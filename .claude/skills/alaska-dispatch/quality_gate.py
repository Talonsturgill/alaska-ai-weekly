"""
quality_gate.py — the OBJECTIVE ship/fail gate for a Dispatch render.
This is the routine's checks-and-balances layer: it runs BEFORE the subjective
scorer and FAILS the render numerically, so the human never has to catch these.
Every check here exists because a human reviewer once had to flag it by hand:

  CHECK            defends against the human note...
  SHARPNESS        "the whole thing looks blurry compared to before"
  HUD_TEXT         "the letters in the chart box are illegible"
  CAPTION_TEXT     "the captions look generic / hard to read"
  EVENT_CADENCE    "a bit boring, too slow — something should happen every ~5s"
  BEAT_DENSITY     "the illustration must keep TELLING the story — distinct visual beats, not just motion"
  SCENE_STRUCTURE  "don't run one continuous scene the whole time — CUT between shots (a 'oner' fails)"
  CAPTION_SYNC     "the voice doesn't match the on-screen captions"
  READABILITY      "is every word bright enough + legible (not just sharp)?"
  MUSIC            "real sourced track is on, NOT the synth fallback" (loop must get real music)

  python quality_gate.py                         # gate frames_v3/ + audio/words60.json
  python quality_gate.py --frames DIR --words W --fps 30 --max-gap 5.0
Writes a JSON scorecard next to the frames (quality_report.json) for the email.
Exit 0 = PASS (safe to encode/ship). Exit 1 = FAIL -> route back into the Phase-6 loop: delegate to
the dispatch-fixer subagent, patch the cause, re-render, re-gate. A FAIL never withholds delivery —
the loop self-heals and only exits (and ships) on PASS.
numpy/PIL/scipy only.
"""
import os, sys, json, argparse, glob
import numpy as np
from PIL import Image
from scipy.ndimage import laplace

W,H=1080,1920
CAP_BAND=(110,1410,970,1600)      # caption lower-third (crisp HUD text lives here)
CARD_BAND=(100,1175,980,1360)     # spectrogram chart card
# objective floors — a render must clear these to ship
F_SHARP=14.0                       # median variance-of-Laplacian over the clip
F_HUD_HF=3.2                       # p90 high-freq energy in a HUD text band (glyph edges)
F_WORDS=10                         # min voice-synced caption cues
F_VIS=0.42                         # min visible brightness (fill_luma/255 * alpha) of a readable word
F_CON=2.0                          # min text/background contrast ratio for a readable word

def lum(a): return 0.2126*a[...,0]+0.7152*a[...,1]+0.0722*a[...,2]
def lap_var(g): return float(laplace(g.astype(np.float32)).var())
def hf_energy(g): return float(np.abs(laplace(g.astype(np.float32))).mean())
def region(a,b): x0,y0,x1,y1=b; return a[y0:y1,x0:x1]

def gate(frames_dir, words_path, fps=30, max_gap=5.0):
    fs=sorted(glob.glob(os.path.join(frames_dir,"frame_*.png")))
    if not fs: return {"pass":False,"checks":[{"name":"FRAMES","pass":False,"detail":"no frames in "+frames_dir}],"metrics":{}}
    idx=sorted(set(range(0,len(fs),6))|{0,len(fs)-1})
    sharp=[]; cap_hf=[]; card_hf=[]; deltas=[]; prev=None; prev_i=None
    for j in idx:
        g=lum(np.asarray(Image.open(fs[j]).convert("RGB"),np.float32))
        sharp.append(lap_var(g)); cap_hf.append(hf_energy(region(g,CAP_BAND))); card_hf.append(hf_energy(region(g,CARD_BAND)))
        if prev is not None: deltas.append((prev_i,j,float(np.abs(g-prev).mean())))
        prev=g; prev_i=j

    checks=[]; m={}
    # 1) SHARPNESS — not soft/blurry
    m["sharpness_median"]=round(float(np.median(sharp)),1)
    checks.append({"name":"SHARPNESS","pass":m["sharpness_median"]>=F_SHARP,
        "detail":f"median lapvar={m['sharpness_median']} (floor {F_SHARP}) — guards 'looks blurry'"})
    # 2) HUD_TEXT — chart labels legible
    m["chart_hf_p90"]=round(float(np.percentile(card_hf,90)),2)
    checks.append({"name":"HUD_TEXT","pass":m["chart_hf_p90"]>=F_HUD_HF,
        "detail":f"chart text hf p90={m['chart_hf_p90']} (floor {F_HUD_HF}) — guards 'chart letters illegible'"})
    # 3) CAPTION_TEXT — captions crisp
    m["caption_hf_p90"]=round(float(np.percentile(cap_hf,90)),2)
    checks.append({"name":"CAPTION_TEXT","pass":m["caption_hf_p90"]>=F_HUD_HF,
        "detail":f"caption text hf p90={m['caption_hf_p90']} (floor {F_HUD_HF}) — guards 'captions generic/hard to read'"})
    # 4) EVENT_CADENCE — no dead window longer than max_gap
    floor=max(0.6,float(np.percentile([d for _,_,d in deltas],55)))
    spikes=sorted((jb/fps) for _,jb,d in deltas if d>=floor)
    gaps=[]; last=0.0
    for s in spikes+[len(fs)/fps]:
        if s-last>max_gap: gaps.append([round(last,1),round(s,1)])
        last=max(last,s)
    m["event_spikes"]=len(spikes); m["biggest_gap_s"]=round(max([0.0]+[b-a for a,b in gaps]),1); m["dead_windows"]=gaps
    checks.append({"name":"EVENT_CADENCE","pass":len(gaps)==0,
        "detail":f"biggest dead gap={m['biggest_gap_s']}s (max {max_gap}s), dead windows={gaps} — guards 'boring/too slow'"})
    # 4b) BEAT_DENSITY — enough DISTINCT story-advancing visual beats (the picture keeps telling the story)
    dur_s=len(fs)/fps
    beat_thr=max(1.3,float(np.percentile([d for _,_,d in deltas],65)))   # a real change, not idle drift
    beats=0; last_bt=-9.0
    for _,jb,d in deltas:                                                # deltas are time-ordered
        tcur=jb/fps
        if d>=beat_thr and (tcur-last_bt)>=2.0: beats+=1; last_bt=tcur
    min_beats=max(8,int(dur_s/5.0))                                      # ~1 strong beat per 5s (12 for 60s)
    m["visual_beats"]=beats; m["min_beats"]=min_beats
    checks.append({"name":"BEAT_DENSITY","pass":beats>=min_beats,
        "detail":f"{beats} distinct visual beats (need >={min_beats}, ~1 per 5s) — the picture must keep telling the story, not just move"})
    # 4c) SCENE_STRUCTURE — the MACRO rhythm: a SEQUENCE of distinct shots with REAL transitions, not one 'oner'.
    # EVENT_CADENCE/BEAT_DENSITY can all be satisfied inside a single locked scene (the sonar Dispatch was a
    # 60s oner). This requires the engine to actually CUT between shots, and verifies each declared cut is a
    # real visual discontinuity — not a relabel. The engine declares shots in shots.json (dispatch_core.write_shots).
    # NOTE: "each cut lands a different WORLD, not a camera zoom/pan on one canvas" (the v2 failure) is enforced
    # UPSTREAM at the PLAN gate — scripts/storyboard_check.py requires adjacent shots to change >=2 heavy axes —
    # plus the storyboard-critic. This render check confirms a cut PHYSICALLY happened at each declared boundary.
    # Full craft: docs/craft/CINEMATIC_SCENE_CRAFT.md.
    shots_path=os.path.join(os.path.dirname(os.path.abspath(frames_dir)),"shots.json")
    MIN_SHOTS=4; MIN_DUR=3.0; MAX_DUR=16.0; MIN_FRAMINGS=3
    if os.path.exists(shots_path):
        try: shots=(json.load(open(shots_path)) or {}).get("shots",[])
        except Exception: shots=[]
        # DOWNSAMPLE before differencing (standard shot-boundary detection): at low res, small fast local
        # motion (fish, particles, a drifting camera) blurs out, while a whole-WORLD change shifts the entire
        # frame. Robust to dense motion.
        def _lumf(i):
            i=max(0,min(len(fs)-1,int(i)))
            return lum(np.asarray(Image.open(fs[i]).convert("RGB").resize((54,96),Image.BILINEAR),np.float32))
        def _fd(i): return float(np.abs(_lumf(i)-_lumf(i-1)).mean())   # per-frame (downsampled) change
        # A real scene change = a genuine WORLD change across the boundary: the shot's SETTLED frame differs
        # from the previous shot's settled frame. Accepts BOTH a hard cut (a per-frame spike) AND a SMOOTH
        # MORPH (no spike, but the settled worlds are far apart — CINEMATIC_SCENE_CRAFT.md §1.5), while a 'oner'
        # or a relabel (settled frames ~identical) fails. storyboard_check.py is the primary enforcer that
        # adjacent worlds are compositionally distinct; this confirms the render agrees.
        mids=[int((s.get("start",0)+s.get("end",len(fs)))/2) for s in shots]
        base=sorted(_fd(p) for p in mids); med_f=base[len(base)//2] if base else 3.0
        spike_floor=max(5.0,1.9*med_f)                       # a hard-cut punctuation
        WORLD_FLOOR=6.0                                      # a genuine world change (settled A vs B); within-world ~0.5, real ~20-50
        durs=[(s.get("end",0)-s.get("start",0))/fps for s in shots]
        framings={str(s.get("framing","")).strip().lower() for s in shots if s.get("framing")}
        real=0; weak=[]
        for i in range(1,len(shots)):                        # each boundary: a WORLD change (a hard cut OR a smooth morph)
            b=int(shots[i].get("start",0)); spike=max(_fd(k) for k in range(b, b+6))
            wdiff=float(np.abs(_lumf(mids[i])-_lumf(mids[i-1])).mean())
            if wdiff>=WORLD_FLOOR or spike>=spike_floor: real+=1
            else: weak.append([round(b/fps,1),round(wdiff,1)])
        need_real=max(3,len(shots)-2)                        # allow at most one soft transition once there are >=5 shots
        bad=[]
        if len(shots)<MIN_SHOTS: bad.append(f"only {len(shots)} shots (need >={MIN_SHOTS} — a scene change ~every 10-15s)")
        if durs and max(durs)>MAX_DUR: bad.append(f"a shot runs {max(durs):.1f}s (>{MAX_DUR}s) = a 'oner'; break it into shots")
        if durs and min(durs)<MIN_DUR: bad.append(f"a shot is {min(durs):.1f}s (<{MIN_DUR}s) — too brief")
        if len(framings)<MIN_FRAMINGS: bad.append(f"only {len(framings)} distinct framings (need >={MIN_FRAMINGS}; vary the shot types)")
        if len(shots)>=MIN_SHOTS and real<need_real: bad.append(f"{len(shots)-1-real} boundary(ies) show no real WORLD change (world floor {WORLD_FLOOR}) at {weak} — each shot must land a different world (a cut OR a smooth morph), not a relabel/oner")
        m["scene_shots"]=len(shots); m["scene_real_cuts"]=real; m["scene_framings"]=len(framings)
        checks.append({"name":"SCENE_STRUCTURE","pass":(not bad),
            "detail":(f"{len(shots)} shots, {real} real transitions, {len(framings)} framings — "+("; ".join(bad) if bad else "a genuine sequence of shots")+" (config/shot_structure.yaml)")})
    else:
        checks.append({"name":"SCENE_STRUCTURE","pass":False,
            "detail":"no shots.json — a Dispatch must be a SEQUENCE of shots with motivated transitions, not one continuous scene (a 'oner'). Storyboard >=4 shots and emit them via dispatch_core.write_shots(...). See config/shot_structure.yaml."})
    # 5) CAPTION_SYNC — captions are voice-driven
    ok_sync=False; det="words60.json missing — captions not voice-synced"
    if os.path.exists(words_path):
        wj=json.load(open(words_path)); words=wj.get("words",[])
        bad=[w for w in words if not (w.get("e",0)>w.get("s",0))]
        ok_sync=(len(words)>=F_WORDS and not bad)
        m["caption_cues"]=len(words)
        det=f"{len(words)} voice-synced cues (min {F_WORDS}), {len(bad)} bad-duration — guards 'voice != captions'"
    checks.append({"name":"CAPTION_SYNC","pass":ok_sync,"detail":det})

    # 6) READABILITY — brightness + contrast of EVERY word meant to be read (from the render text manifest)
    tdir=os.path.join(os.path.dirname(os.path.abspath(frames_dir)),"textlog")
    tfiles=sorted(glob.glob(os.path.join(tdir,"frame_*.json")))
    if tfiles:
        nck=0; bad=[]
        for tfp in tfiles:
            try: ws=json.load(open(tfp))
            except Exception: continue
            for wl in ws:
                if not wl.get("target"): continue
                nck+=1; a=wl["alpha"]
                et=(wl["fill_luma"]*a+wl["bg_luma"]*(1-a))/255.0; bgL=wl["bg_luma"]/255.0
                con=(max(et,bgL)+0.05)/(min(et,bgL)+0.05)
                if wl["vis"]<F_VIS or con<F_CON: bad.append({"kind":wl["kind"],"vis":wl["vis"],"contrast":round(con,2)})
        m["readable_words"]=nck; m["readability_fails"]=len(bad)
        checks.append({"name":"READABILITY","pass":(len(bad)==0 and nck>0),
            "detail":f"{nck} readable words checked, {len(bad)} too dim/low-contrast (need vis>={F_VIS}, contrast>={F_CON}){' eg '+str(bad[:3]) if bad else ''} — guards 'every word bright + legible'"})
    else:
        checks.append({"name":"READABILITY","pass":False,
            "detail":"no text manifest (render with DISPATCH_TEXTLOG=1) — cannot verify per-word brightness/contrast"})

    # 7) MUSIC — must be a REAL sourced track, never the synth fallback (loop to perfection)
    mstat=os.path.join(os.path.dirname(os.path.abspath(frames_dir)),"audio","music_status.json")
    if os.path.exists(mstat):
        ms=json.load(open(mstat)); src=ms.get("source","?"); m["music_source"]=src
        checks.append({"name":"MUSIC","pass":src=="sourced",
            "detail":f"music source = {src}"+(f' ({ms.get("credit","")})' if ms.get("credit") else "")+
                     " — must be a freshly-sourced real track; synth/legacy fails (fix get_music + re-mix)"})
    else:
        checks.append({"name":"MUSIC","pass":False,
            "detail":"no audio/music_status.json — run audio_v3 after get_music so a REAL track (not synth) is confirmed"})

    passed=all(c["pass"] for c in checks)
    m["score"]=round(10.0*sum(c["pass"] for c in checks)/len(checks),1)
    return {"pass":passed,"checks":checks,"metrics":m}

def main():
    HEREd=os.path.dirname(os.path.abspath(__file__))
    ap=argparse.ArgumentParser()
    ap.add_argument("--frames",default=os.path.join(HEREd,"frames_v3"))
    ap.add_argument("--words",default=os.path.join(HEREd,"audio","words60.json"))
    ap.add_argument("--fps",type=int,default=30); ap.add_argument("--max-gap",type=float,default=5.0)
    a=ap.parse_args()
    rep=gate(a.frames,a.words,a.fps,a.max_gap)
    json.dump(rep,open(os.path.join(HEREd,"quality_report.json"),"w"),indent=2)
    print("=== QUALITY GATE (objective regression guard) ===")
    for c in rep["checks"]: print(f"  [{'PASS' if c['pass'] else 'FAIL'}] {c['name']:13s} {c['detail']}")
    print(f"gate score: {rep['metrics'].get('score','?')}/10  ->  RESULT: {'PASS ✓' if rep['pass'] else 'FAIL ✗'}")
    sys.exit(0 if rep["pass"] else 1)

if __name__=="__main__": main()
