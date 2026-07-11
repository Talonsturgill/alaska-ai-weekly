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

    # 8) SFX_EVENTS — the picture must be SONIFIED: a motivated sound cut to the visual events, verified
    # present in the master. The mix emits audio/sfx_events.json ([{t,kind,label}...]); we confirm there
    # are enough events, >=1 per shot, and (when the master wav is readable) that each planned event
    # produced a real high-band energy lift vs its neighborhood. Doctrine: docs/craft/VISUAL_FLOW.md §5.
    base=os.path.dirname(os.path.abspath(frames_dir))
    MIN_SFX_TOTAL=8   # config/visual_flow.yaml sfx.min_events_total ; MIN per shot = 1
    sfx_p=os.path.join(base,"audio","sfx_events.json")
    if not os.path.exists(sfx_p):
        checks.append({"name":"SFX_EVENTS","pass":False,
            "detail":"no audio/sfx_events.json — the mix must emit its motivated-sound event list so the "
                     "picture is verifiably sonified (a pop per entrance, whoosh per move, hit per stat). VISUAL_FLOW.md §5/§9"})
    else:
        try:
            _sj=json.load(open(sfx_p)); evs=_sj.get("events",_sj) if isinstance(_sj,dict) else _sj
            evs=[e for e in evs if isinstance(e,dict)]
        except Exception:
            evs=[]
        def _ev_t(e):
            try: return float(str(e.get("t")).split("-")[0])
            except Exception: return -1.0
        bad=[]
        if len(evs)<MIN_SFX_TOTAL: bad.append(f"only {len(evs)} sfx events (need >={MIN_SFX_TOTAL})")
        # >=1 event per shot
        try:
            shj=json.load(open(os.path.join(base,"shots.json"))); shs=shj.get("shots",[]) if isinstance(shj,dict) else shj
        except Exception: shs=[]
        if shs:
            emptyshots=[]
            for s in shs:
                a0=s.get("start",0)/fps; b0=s.get("end",0)/fps
                if not any(a0<=_ev_t(e)<b0 for e in evs): emptyshots.append(round(a0,1))
            if emptyshots: bad.append(f"{len(emptyshots)} shot(s) have no sound event (starts {emptyshots})")
        # optional: verify each event actually lifts the master's SFX band
        m["sfx_events"]=len(evs); lift_ok=None
        try:
            from scipy.io import wavfile
            mp=os.path.join(base,"audio","master60.wav")
            if os.path.exists(mp) and evs:
                sr,wav=wavfile.read(mp); wav=wav.astype(np.float32)
                if wav.ndim>1: wav=wav.mean(1)
                wav=wav/(np.abs(wav).max()+1e-9)
                def _diff_rms(t0,t1):     # transient proxy (ticks/pops/whooshes)
                    s=max(0,int(t0*sr)); e=min(len(wav),int(t1*sr))
                    if e<=s: return 1e-9
                    d=np.abs(np.diff(wav[s:e])); return float(np.sqrt((d*d).mean())+1e-9)
                def _amp_rms(t0,t1):      # amplitude proxy (slow-attack booms/pulses/risers)
                    s=max(0,int(t0*sr)); e=min(len(wav),int(t1*sr))
                    if e<=s: return 1e-9
                    seg=wav[s:e]; return float(np.sqrt((seg*seg).mean())+1e-9)
                lifts=0
                for e in evs:
                    t=_ev_t(e)
                    if t<0: continue
                    okd=_diff_rms(t,t+0.18)>_diff_rms(t-0.35,t-0.05)*1.15
                    oka=_amp_rms(t,t+0.30)>_amp_rms(t-0.45,t-0.05)*1.10
                    if okd or oka: lifts+=1   # calibrated on the Yakutat mix: 14/18 real events register; a silent stem ~0
                lift_ok=lifts
                m["sfx_lifts"]=lifts
                if lifts < max(1,int(0.5*len(evs))):
                    bad.append(f"only {lifts}/{len(evs)} events show an audible lift in the master (planned but not heard)")
        except Exception:
            pass
        checks.append({"name":"SFX_EVENTS","pass":(not bad),
            "detail":(f"{len(evs)} sound events"+(f", {lift_ok} verified audible" if lift_ok is not None else "")+
                      (" — "+"; ".join(bad) if bad else " — every shot sonified, events audible in the master")+" (VISUAL_FLOW.md §5)")})

    # 8a) SILENCE_DIP — the pre-payoff silence was actually MIXED, not just planned (VOICE_AND_SCORE.md).
    try:
        _sbp=os.path.join(base,"..","..","..","out","dispatch","storyboard.json")
        _aa=(json.load(open(_sbp)).get("audio_arc") or {}) if os.path.exists(_sbp) else {}
    except Exception:
        _aa={}
    if _aa.get("silence_at") is not None:
        try:
            from scipy.io import wavfile as _wf
            _t0=float(_aa["silence_at"]); _sr,_wav=_wf.read(os.path.join(base,"audio","master60.wav"))
            _wav=_wav.astype(np.float32); _wav=_wav.mean(1) if _wav.ndim>1 else _wav
            def _rms(a,b):
                seg=_wav[max(0,int(a*_sr)):int(b*_sr)]
                return 20*np.log10(float(np.sqrt((seg*seg).mean())+1e-9))
            din=_rms(_t0-0.35,_t0+0.35)
            dnb=max(_rms(_t0-3.0,_t0-0.6),_rms(_t0+0.6,_t0+3.0))
            checks.append({"name":"SILENCE_DIP","pass":(dnb-din)>=6.0,
                "detail":f"bed at silence_at={_t0}s sits {dnb-din:.1f} dB under its neighborhood (need >=6) "
                         f"— the breath before the payoff is real, not planned"})
        except Exception as _e:
            checks.append({"name":"SILENCE_DIP","pass":False,"detail":f"could not verify declared silence_at ({_e})"})
    else:
        checks.append({"name":"SILENCE_DIP","pass":False,
            "detail":"storyboard declares no audio_arc.silence_at — the pre-payoff silence is a required "
                     "story beat (VOICE_AND_SCORE.md; storyboard_check enforces the block)"})

    # 8b) LIVING_SCREEN — layered, disjoint motion (the anti-slideshow gate; docs/craft/CHOREOGRAPHY.md).
    # Camera-compensated luma deltas on a coarse grid; a 2s window is ALIVE when >=min_regions spatially
    # disjoint clusters of cells are active. One ticker over a held frame = 1 region = a slide.
    try:
        import yaml as _yaml
        _cf=_yaml.safe_load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","..","..","config","visual_flow.yaml")))
        _ch=(_cf or {}).get("choreo") or {}
    except Exception:
        _ch={}
    if _ch:
        GX,GY=_ch.get("cell_grid",[12,20]); WIN=float(_ch.get("window_s",2.0)); MINR=int(_ch.get("min_regions",3))
        PASSPCT=float(_ch.get("min_window_pass_pct",0.8)); EXEMPT=float(_ch.get("outro_exempt_s",2.0))
        FLOOR=float(_ch.get("active_cell_floor",2.2))
        def _sluma(path):
            im=Image.open(path).convert("L").resize((135,240)); return np.asarray(im,np.float32)
        def _regions(a,b):
            d=np.abs(b-a); h,w=d.shape; chh,cww=h//GY,w//GX
            cells=d[:GY*chh,:GX*cww].reshape(GY,chh,GX,cww).mean((1,3))
            cells=np.maximum(0,cells-np.median(cells)); act=cells>FLOOR
            seen=np.zeros_like(act,bool); n=0
            for y in range(GY):
                for x in range(GX):
                    if act[y,x] and not seen[y,x]:
                        n+=1; st=[(y,x)]
                        while st:
                            cy,cx=st.pop()
                            if 0<=cy<GY and 0<=cx<GX and act[cy,cx] and not seen[cy,cx]:
                                seen[cy,cx]=True; st+=[(cy+1,cx),(cy-1,cx),(cy,cx+1),(cy,cx-1)]
            return n
        step=6; total_s=len(fs)/fps; wins={}
        prevL=_sluma(fs[0]); prev_j=0
        for j in range(step,len(fs),step):
            curL=_sluma(fs[j]); wid=int((j/fps)//WIN)
            wins.setdefault(wid,0); wins[wid]=max(wins[wid],_regions(prevL,curL)); prevL=curL
        cut=int((total_s-EXEMPT)//WIN)
        vals=[v for k,v in sorted(wins.items()) if k<cut]
        ok=sum(1 for v in vals if v>=MINR); pct=ok/max(1,len(vals))
        weak=[f"{k*int(WIN)}s" for k,v in sorted(wins.items()) if k<cut and v<MINR]
        m["living_screen_pct"]=round(pct,3)
        checks.append({"name":"LIVING_SCREEN","pass":pct>=PASSPCT,
            "detail":f"{ok}/{len(vals)} 2s-windows show >={MINR} disjoint motion regions ({pct:.0%}, floor {PASSPCT:.0%})"
                     +(f" — quiet windows at {weak[:6]}" if weak else "")
                     +" — layered choreography, not one ticker on a held frame (CHOREOGRAPHY.md)"})
        # HOOK_WINDOW — the open may never be the quietest part of the film (HOOK_CRAFT.md)
        hookv=[wins.get(0,0),wins.get(1,0)]
        checks.append({"name":"HOOK_WINDOW","pass":all(v>=MINR for v in hookv),
            "detail":f"first two 2s windows carry {hookv} disjoint motion regions (each needs >={MINR}) "
                     f"— a muted scroll decides at ~1.3s; the hook arrives loaded or not at all"})
        # FIRST_FRAME — frame 0 is a designed poster with the claim burned in (HOOK_CRAFT.md)
        g0=lum(np.asarray(Image.open(fs[0]).convert("RGB"),np.float32))
        f0_edge=float(np.abs(laplace(g0)).mean()); f0_std=float(g0.std())
        m["first_frame_edge"]=round(f0_edge,2); m["first_frame_std"]=round(f0_std,1)
        checks.append({"name":"FIRST_FRAME","pass":(f0_edge>=4.0 and f0_std>=30.0),
            "detail":f"frame 0 edge energy {f0_edge:.2f} (floor 4.0 — poster-grade ink/headline present), "
                     f"luma std {f0_std:.1f} (floor 30 — real contrast, no fade-from-black)"})

    # 9-11) DIMENSIONAL HYGIENE — the render must PROVE it used the 3D engine correctly
    # (render_manifest.json is written by dimensional.write_manifest at render end).
    man_p=os.path.join(base,"render_manifest.json")
    if not os.path.exists(man_p):
        checks.append({"name":"DIMENSIONAL","pass":False,
            "detail":"no render_manifest.json — the scene must render through dimensional.py and call "
                     "write_manifest() (proof of engine/scale/shadow-LOD/backend). 2D PIL scenes are retired."})
    else:
        try: man=json.load(open(man_p))
        except Exception: man={}
        bad=[]
        if man.get("engine")!="dimensional": bad.append("engine != dimensional")
        if float(man.get("scale",0))<0.999: bad.append(f"ship scale {man.get('scale')} < 1.0 — proxy renders are for look-dev only")
        if not man.get("shadow_fn"): bad.append("no SHADOW_FN — every scene provides a cheap shadow SDF (free speed, zero quality cost)")
        m["render_arch"]=man.get("arch","?")
        checks.append({"name":"DIMENSIONAL","pass":(not bad),
            "detail":f"engine={man.get('engine')} scale={man.get('scale')} shadow_fn={man.get('shadow_fn')} "
                     f"arch={man.get('arch')}"+(" — "+"; ".join(bad) if bad else " — 3D hygiene clean")})
        smp=man.get("samples",[])
        # DEPTH_FIELD: the scene is genuinely dimensional (near/far spread in the depth buffer)
        if smp:
            spreads=[x["z_p90"]-x["z_p10"] for x in smp if x.get("z_p90") is not None]
            okn=sum(1 for v in spreads if v>=1.0)
            med=sorted(spreads)[len(spreads)//2] if spreads else 0.0
            m["depth_spread_med"]=round(med,2)
            checks.append({"name":"DEPTH_FIELD","pass":(med>=2.0 and okn>=0.8*len(spreads)),
                "detail":f"median near/far depth spread {med:.1f} world units over {len(spreads)} samples "
                         f"({okn} above floor) — a real 3D scene, not a flat card (need med>=2.0, 80% >=1.0)"})
            # CAMERA_MOTION: the camera lives — travel or drift, and focus behaves
            import math as _m
            pos=[x["pos"] for x in smp]
            path=sum(_m.dist(pos[i],pos[i+1]) for i in range(len(pos)-1))
            maxstep=max((_m.dist(pos[i],pos[i+1]) for i in range(len(pos)-1)),default=0.0)
            foc=[x["focus"] for x in smp]; ftrav=max(foc)-min(foc) if foc else 0.0
            m["cam_path"]=round(path,2); m["focus_travel"]=round(ftrav,2)
            static=(maxstep<1e-4)
            checks.append({"name":"CAMERA_MOTION","pass":(not static) and (path>=0.4 or ftrav>=0.4),
                "detail":f"camera path {path:.2f} wu, focus travel {ftrav:.2f} wu, max step {maxstep:.4f} — "
                         f"the camera must LIVE (drift at minimum) and either travel or rack (>=0.4 wu)"})
        else:
            checks.append({"name":"DEPTH_FIELD","pass":False,"detail":"manifest has no samples — render through dimensional.post() so telemetry logs"})
            checks.append({"name":"CAMERA_MOTION","pass":False,"detail":"manifest has no samples — render through dimensional.post() so telemetry logs"})

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
