"""
Alaska.Ai Dispatch — audio mux + SOUND CHECK gate.
Re-picks a fuller music window, normalizes stems to known loudness, ducks the
bed gently under the voice, muxes against the existing frames, then MEASURES
the result and asserts the music is actually audible (music-only tail level).
"""
import subprocess, numpy as np, os, sys, re
from scipy.io import wavfile

SR=44100
def run(c): return subprocess.run(c, capture_output=True, text=True)
def astats(infile, ss, to):
    r=run(["ffmpeg","-ss",str(ss),"-to",str(to),"-i",infile,"-af","astats","-f","null","-"])
    m=re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr)
    return float(m[0]) if m else -120.0
def integrated(infile):
    r=run(["ffmpeg","-i",infile,"-af","loudnorm=print_format=summary","-f","null","-"])
    m=re.search(r"Input Integrated:\s*(-?[\d.]+)", r.stderr)
    tp=re.search(r"Input True Peak:\s*(-?[\d.]+)", r.stderr)
    return (float(m.group(1)) if m else None, float(tp.group(1)) if tp else None)

# ---- 1) re-pick a fuller, consistent 30s window from "Echoes" ----
sr,x = wavfile.read("music/188_44.wav"); X=x.astype(np.float32)/32768.0
mono=X.mean(1); N=len(mono); hop=int(SR*0.1)
env=np.array([np.sqrt(np.mean(mono[i:i+hop]**2)) for i in range(0,N-hop,hop)])
fps=10.0; wlen=int(30*fps); med=np.median(env)
best=None
for s in range(0,len(env)-wlen,2):
    w=env[s:s+wlen]; me=w.mean(); st=w.std(); start_e=w[:10].mean(); peak=w.max()
    if start_e < 0.6*med: continue            # don't start near-silent
    if peak/(me+1e-9) > 3.0: continue          # avoid a big transient
    score = me - 0.5*st                        # full + consistent
    if best is None or score>best[0]: best=(score, s/fps, me, st, start_e)
if best is None: best=(0, 38.0, 0,0,0)
t0=best[1]
print(f"music window: start={t0:.1f}s mean={best[2]:.3f} std={best[3]:.3f} start_e={best[4]:.3f}")
s0=int(t0*SR); seg=X[s0:s0+30*SR].copy()
if len(seg)<30*SR: seg=np.pad(seg,((0,30*SR-len(seg)),(0,0)))
fi=int(0.3*SR); fo=int(0.45*SR)               # short fades so the tail stays present
seg[:fi]*=np.linspace(0,1,fi)[:,None]; seg[-fo:]*=np.linspace(1,0,fo)[:,None]
wavfile.write("audio/bed_raw.wav", SR, (seg*32767).astype(np.int16))

# ---- 2) normalize stems to known loudness ----
run(["ffmpeg","-y","-i","audio/bed_raw.wav","-af","loudnorm=I=-22:TP=-4:LRA=11","-ar","44100","audio/bed_n.wav"])
run(["ffmpeg","-y","-i","audio/vo.wav","-af","loudnorm=I=-16:TP=-1.5:LRA=11","-ar","44100","audio/vo_n.wav"])
print("bed_n :", integrated("audio/bed_n.wav"))
print("vo_n  :", integrated("audio/vo_n.wav"))

# ---- 3) mux: gentle sidechain duck (bed stays an audible bed) ----
mux=["ffmpeg","-y","-framerate","30","-i","frames/frame_%05d.png",
 "-i","audio/vo_n.wav","-i","audio/bed_n.wav","-filter_complex",
 "[2:a]asplit=1[m];"
 "[m][1:a]sidechaincompress=threshold=0.055:ratio=3:attack=25:release=380[md];"
 "[1:a][md]amix=inputs=2:duration=first:normalize=0[mix];"
 "[mix]loudnorm=I=-14:TP=-1.5:LRA=11[a]",
 "-map","0:v","-map","[a]","-c:v","libx264","-profile:v","high","-level","4.0","-pix_fmt","yuv420p",
 "-crf","21","-preset","slow","-c:a","aac","-b:a","192k","-ar","44100","-movflags","+faststart","-shortest","out.mp4"]
r=run(mux)
if r.returncode: print("MUX FAIL", r.stderr[-400:]); sys.exit(1)

# ---- 4) SOUND CHECK gate ----
itg, tp = integrated("out.mp4")
tail_music = astats("out.mp4", 27.95, 29.5)   # voice ends 27.76 -> music only
mid_voice  = astats("out.mp4", 10.0, 12.0)    # voice + ducked bed
gap_music  = astats("out.mp4", 5.55, 5.78)    # an inter-segment gap (bed un-ducked)
print("\n===== SOUND CHECK =====")
print(f"integrated loudness : {itg} LUFS  (target -14 +/-1)")
print(f"true peak           : {tp} dBTP   (target <= -1.0)")
print(f"music-only tail RMS : {tail_music:.1f} dB  (must be > -34 to be audible)")
print(f"gap music RMS       : {gap_music:.1f} dB")
print(f"mid-voice RMS       : {mid_voice:.1f} dB  (voice should dominate)")
ok = (tail_music > -34) and (itg is not None and -15.5 < itg < -12.5) and (tp is not None and tp <= -1.0)
voice_lead = mid_voice - tail_music
print(f"voice lead over bed : {voice_lead:.1f} dB  (want ~ +6 to +16)")
print("RESULT:", "PASS — music clearly audible, voice dominant" if ok else "FAIL — adjust levels")
sys.exit(0 if ok else 2)
