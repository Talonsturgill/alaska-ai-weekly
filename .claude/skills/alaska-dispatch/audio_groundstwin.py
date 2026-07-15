"""60s mix for 'THE GROUND'S TWIN': clone VO + Arctic wind bed + ice groan + fiber sensor ticks +
motivated SFX + sourced music (ducked), a deliberate silence dip before the payoff, two-pass
loudnorm to -14 LUFS / -1.5 dBTP. Emits master60.wav, music_status.json, sfx_events.json (>=8,
>=1 per shot, real audible transients so the SFX_EVENTS gate verifies lifts). Audio gate at the end.
  DISPATCH_MUSIC=<wav> python audio_groundstwin.py
"""
import os, subprocess, json, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio"); SR = 44100
env = dict(os.environ); env["SSL_CERT_FILE"] = "/root/.ccr/ca-bundle.crt"; env["SSL_CERT_DIR"] = "/etc/ssl/certs"
def run(c): return subprocess.run(c, capture_output=True, text=True, env=env)
def tt(d): return np.linspace(0, d, int(SR * d), endpoint=False)
def lp(x, fc, o=4): return sosfilt(butter(o, fc / (SR / 2), 'low', output='sos'), x)
def bp(x, a, b, o=4): return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], 'band', output='sos'), x)
rng = np.random.default_rng(11)
TOTAL = 60.0; N = int(TOTAL * SR)

tim = json.load(open(os.path.join(AUD, "timing60.json")))
sb = tim.get("shot_bounds", [0, 315, 630, 855, 1215]); FPS = tim.get("fps", 30)
speech_end = float(tim.get("speech_end", 52.5))
shot_t = [b / FPS for b in sb] + [TOTAL]   # shot start times (s), + end
_ps = tim.get("pause_span")   # the REAL VO gap (ground truth) around the honest-caveat turn

# ---------------- ambient Arctic wind bed ----------------
ta = tt(TOTAL)
wind = lp(rng.standard_normal(N), 300) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.06 * ta)) + 0.20 * lp(rng.standard_normal(N), 700)
wind = (wind / (np.max(np.abs(wind)) + 1e-9) * 0.8).astype(np.float32)

# ---------------- motivated SFX bus (real transients placed at event times) ----------------
sfx = np.zeros(N, np.float32)
events = []
def place(t, buf):
    s = int(t * SR); e = min(N, s + len(buf)); sfx[s:e] += buf[:e - s].astype(np.float32)
def ev(t, kind, label, buf):
    place(t, buf); events.append({"t": round(float(t), 3), "kind": kind, "label": label})
def boom(dur=0.9, f0=64):
    x = tt(dur); f = f0 * np.exp(-x / 0.5); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / (dur * 0.5))
    return (0.9 * s + 0.3 * bp(s, 40, 120)).astype(np.float32)
def whoosh(dur=0.6, up=True):
    x = tt(dur); n = lp(rng.standard_normal(len(x)), 1800); envs = np.sin(np.pi * x / dur) ** 2
    sweep = np.interp(x, [0, dur], [400, 1800] if up else [1800, 400]); s = n * envs * (0.6 + 0.4 * np.sin(2 * np.pi * sweep * x / SR))
    return (0.7 * s).astype(np.float32)
def tick(dur=0.16, f=1500):
    x = tt(dur); s = np.tanh(1.5 * np.sin(2 * np.pi * f * x)) * np.exp(-x / 0.04); return (0.6 * lp(s, 5200)).astype(np.float32)
def riser(dur=2.2):
    x = tt(dur); f = np.interp(x, [0, dur], [120, 900]); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (x / dur) ** 2
    n = lp(rng.standard_normal(len(x)), 2500) * (x / dur) ** 2; return (0.5 * (s + 0.6 * n)).astype(np.float32)
def bloom(dur=1.4):
    x = tt(dur); base = 180.0; s = np.zeros(len(x))
    for k, r in enumerate([1.0, 1.5, 2.0, 3.0]): s += (0.5 / (k + 1)) * np.sin(2 * np.pi * base * r * x)
    return (0.5 * s * np.sin(np.pi * x / dur) ** 2).astype(np.float32)
def button(dur=0.7, f0=90):
    x = tt(dur); s = np.sin(2 * np.pi * f0 * x) * np.exp(-x / 0.28); return (0.8 * (s + 0.4 * bp(s, 60, 160))).astype(np.float32)

# events anchored to the shot windows (guarantees >=1 per shot; >=8 total)
s0, s1, s2, s3, s4, end = shot_t[0], shot_t[1], shot_t[2], shot_t[3], shot_t[4], shot_t[5]
ev(s0 + 0.4, "ambient", "wind bed opens", whoosh(0.8, up=False) * 0.5)
ev(s0 + (s1 - s0) * 0.72, "boom", "the ground is warming", boom(1.0, 60))
ev(s1 + 0.15, "whoosh", "push through the surface into the strata", whoosh(0.6, up=False))
ev(s1 + (s2 - s1) * 0.45, "tick", "fiber sensor tick", tick(0.16, 1500))
ev(s1 + (s2 - s1) * 0.78, "pulse", "thermal pulse travels", whoosh(0.5, up=True))
ev(s2 + 0.15, "boom", "the twin ignites, harmonic bloom", bloom(1.4))
ev(s2 + (s3 - s2) * 0.62, "lock", "the twin corrects itself", tick(0.18, 1200))
ev(s3 + 0.15, "whoosh", "diptych assembles, stereo widen", whoosh(0.7, up=True))
ev(s3 + (s4 - s3) * 0.42, "riser", "the thaw front descends", riser(2.0))
ev(s4 + 0.3, "tick", "here is the honest part", tick(0.2, 900))
if _ps:   # place the breath exactly in the VO's real gap (ground truth, not a guess)
    SIL = round((_ps[0] + _ps[1]) / 2.0, 3)
else:
    SIL = min(speech_end - 3.5, s4 + (end - s4) * 0.30)
print(f"pause_span={_ps} -> SIL={SIL}", flush=True)
ev(SIL + 3.2, "riser", "the rise reveal lifts", riser(2.2))
ev(min(speech_end + 0.6, end - 1.0), "boom", "button on the signoff", button(0.7, 88))
sfx = (sfx / (np.max(np.abs(sfx)) + 1e-9) * 0.9).astype(np.float32)

# the shared duck envelope for the pre-payoff breath — applied to BOTH the wind bed and the music
# bed (below), so the master's actual RMS drops at SIL, not just one stem the ear won't notice.
if _ps:
    _ds = int((_ps[0] - 0.05) * SR); _de = int((_ps[1] + 0.05) * SR)
else:
    _ds = int((SIL - 0.5) * SR); _de = int((SIL + 0.7) * SR)
DUCK = np.ones(N, np.float32); DUCK[max(0, _ds):min(N, _de)] = 0.12
DUCK = lp(DUCK, 40).astype(np.float32)
wind *= DUCK
wavfile.write(os.path.join(AUD, "wind60.wav"), SR, (np.stack([wind, wind], 1) * 32767).astype(np.int16))
wavfile.write(os.path.join(AUD, "sfx60.wav"), SR, (np.stack([sfx, sfx], 1) * 32767).astype(np.int16))

# ---------------- music: sourced track (DISPATCH_MUSIC), quiet-window pick, ducked, with silence dip ----------------
def loadw(p):
    _, d = wavfile.read(p); a = (d.astype(np.float32) / 32768.) if d.dtype == np.int16 else d.astype(np.float32)
    return a if a.ndim > 1 else np.stack([a, a], 1)
mp = os.environ.get("DISPATCH_MUSIC"); legacy = os.path.join(HERE, "music", "188_44.wav")
msrc = "sourced" if (mp and os.path.exists(mp)) else ("legacy" if os.path.exists(legacy) else "synth")
if mp and os.path.exists(mp): X = loadw(mp)
elif os.path.exists(legacy): X = loadw(legacy)
else:
    X = np.stack([lp(rng.standard_normal(int(80 * SR)), 500) * 0.4] * 2, 1).astype(np.float32)
mstat = {"source": msrc, "path": mp or legacy or ""}
try:
    cf = os.path.join(os.path.dirname(mp), "music_credit.json") if mp else ""
    if cf and os.path.exists(cf): mstat["credit"] = json.load(open(cf)).get("credit", "")
except Exception: pass
json.dump(mstat, open(os.path.join(AUD, "music_status.json"), "w"))
# quietest 60s window
mono = X.mean(1); hop = int(SR * 0.2); envv = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) for i in range(0, max(1, len(mono) - int(60 * SR)), hop)])
wl = int(60 / 0.2); best = None
for s_ in range(0, max(1, len(envv) - wl), 3):
    m_ = envv[s_:s_ + wl].mean()
    if best is None or m_ < best[0]: best = (m_, s_ * 0.2)
w0 = best[1] if best else 0.0; seg = X[int(w0 * SR):int(w0 * SR) + N].copy()
if len(seg) < N: seg = np.pad(seg, ((0, N - len(seg)), (0, 0)))
fi = int(0.8 * SR); fo = int(2.4 * SR); seg[:fi] *= np.linspace(0, 1, fi)[:, None]; seg[-fo:] *= np.linspace(1, 0, fo)[:, None]
# deliberate SILENCE DIP: duck the bed hard across the VO's REAL gap (>=6 dB under neighborhood,
# for the SILENCE_DIP gate) using the SAME envelope already applied to the wind bed above.
seg *= DUCK[:, None]
wavfile.write(os.path.join(AUD, "bed60raw.wav"), SR, (seg * 32767).astype(np.int16))
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "bed60raw.wav"), "-af", "loudnorm=I=-24:TP=-6:LRA=11", "-ar", "44100", os.path.join(AUD, "bed60.wav")])

# ---------------- premix + master ----------------
graph = ("[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,equalizer=f=3400:t=q:w=2:g=2.5[vo];"
         "[vo]asplit=2[vout][key];[1:a]highpass=f=90,equalizer=f=2500:t=q:w=1.3:g=-3[mus];"
         "[mus][key]sidechaincompress=threshold=0.028:ratio=9:attack=22:release=420[md];"
         "[2:a]volume=-19dB[amb];[3:a]volume=-7dB[sfx];"
         "[vout][md][amb][sfx]amix=inputs=4:duration=first:normalize=0[mix]")
r = run(["ffmpeg", "-y", "-i", os.path.join(AUD, "vo60.wav"), "-i", os.path.join(AUD, "bed60.wav"),
         "-i", os.path.join(AUD, "wind60.wav"), "-i", os.path.join(AUD, "sfx60.wav"),
         "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix60.wav")])
if r.returncode: print("PREMIX FAIL", r.stderr[-800:]); sys.exit(1)
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix60.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=8", "-ar", "44100", os.path.join(AUD, "master60.wav")])

# sfx_events.json for the SFX_EVENTS gate
json.dump({"events": sorted(events, key=lambda e: e["t"]), "n": len(events)}, open(os.path.join(AUD, "sfx_events.json"), "w"), indent=2)

# ---------------- audio gate ----------------
def rms(a, b):
    r = run(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", os.path.join(AUD, "master60.wav"), "-af", "astats", "-f", "null", "-"])
    mm = re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr); return float(mm[0]) if mm else -120
r = run(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr); TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
tail = rms(speech_end + 1.0, min(speech_end + 3.0, 59.5)); dipdb = rms(SIL - 0.2, SIL + 0.4); nb = rms(SIL - 2.5, SIL - 0.8)
print(f"music={msrc} events={len(events)} sil@{SIL:.1f} dip={dipdb:.1f} vs nb={nb:.1f} ({nb - dipdb:+.1f}dB)")
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS tail={tail:.1f}dB")
ok = I and -15.5 < float(I[-1]) < -12.5 and (nb - dipdb) >= 6.0
print("PASS" if ok else "CHECK")
