"""Yakutat 60s Dispatch mix: vo60 + deep geologic rumble + faint seismic ticks + ducked music,
two-pass loudnorm -14 LUFS / -1.5 dBTP, with the audio GATE. Reads THIS dir's audio/ (the Yakutat VO)."""
import os, subprocess, json, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio"); SR = 44100
env = dict(os.environ); env["SSL_CERT_FILE"] = "/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"] = "/etc/ssl/certs"
def run(c): return subprocess.run(c, capture_output=True, text=True, env=env)
def t(d): return np.linspace(0, d, int(SR * d), endpoint=False)
def lp(x, fc, o=4): return sosfilt(butter(o, fc / (SR / 2), 'low', output='sos'), x)
def nrm(x, p=.85): x = x / (np.max(np.abs(x)) + 1e-9); return (x * p * 32767).astype(np.int16)
rng = np.random.default_rng(7)
tt = t(60.0)
# deep earth rumble (a slab under strain): low noise with slow swell + a ~44 Hz drone
rumble = lp(rng.standard_normal(len(tt)), 70) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * tt))
rumble += 0.4 * np.sin(2 * np.pi * 44 * tt) * (0.35 + 0.30 * np.sin(2 * np.pi * 0.08 * tt))
for st in (7, 24, 41):                                               # tectonic groans (descending low tones)
    n = int(3.5 * SR); tb = np.linspace(0, 3.5, n); fg = 60 - 24 * (tb / 3.5)
    g = np.sin(2 * np.pi * np.cumsum(fg) / SR) * np.exp(-tb / 2.6)
    rumble[int(st * SR):int(st * SR) + n] += 0.32 * lp(g, 300)
# ---- MOTIVATED, picture-synced low SFX (ambient bed + events cut to the frame) ----
def place(buf, t0, sig):
    s = int(t0 * SR); e = min(s + len(sig), len(buf)); buf[s:e] += sig[:e - s].astype(np.float32)
nb = int(3.2 * SR); tb = np.linspace(0, 3.2, nb)                    # slab-DIVE boom ~19.2s (shot 3: the plate plunges)
fdown = 82 - 54 * (tb / 3.2)                                        # a descending sub-bass, 82 Hz -> 28 Hz
dive = np.sin(2 * np.pi * np.cumsum(fdown) / SR) * (np.minimum(tb / 0.5, 1.0) * np.exp(-tb / 2.2))
place(rumble, 19.2, 0.55 * lp(dive, 200))
for pt, amp in ((32.2, 0.95), (32.7, 0.62)):                       # Denali stress-PULSE (double thud) ~32s: the fault ghost-flares
    npu = int(1.4 * SR); tp = np.linspace(0, 1.4, npu)
    place(rumble, pt, amp * lp(np.sin(2 * np.pi * 50 * tp) * np.exp(-tp / 0.34), 260))
nl = int(5.0 * SR); tl = np.linspace(0, 5.0, nl)                    # LOCK resolve tone ~49.3s: the edge settles, the arc resolves
place(rumble, 49.3, lp(np.sin(2 * np.pi * 58 * tl) * (np.minimum(tl / 0.4, 1.0) * np.exp(-tl / 3.0)) * 0.28, 240))
wavfile.write(os.path.join(AUD, "rumble60.wav"), SR, nrm(rumble, .8))
# faint seismic ticks in the first 9 s (the hidden quakes igniting under the scan)
ticks = np.zeros(len(tt), np.float32)
for st in np.linspace(1.4, 8.6, 11):                                # ignition sparks under the scan (one per detected quake burst)
    n = int(0.05 * SR); tb = np.linspace(0, 0.05, n)
    ti = np.sin(2 * np.pi * np.cumsum(1150 + np.zeros(n)) / SR) * np.exp(-tb / 0.02)
    ticks[int(st * SR):int(st * SR) + n] += 0.40 * ti.astype(np.float32)
wavfile.write(os.path.join(AUD, "ticks60.wav"), SR, nrm(ticks, .7))
# ---- music bed: freshly sourced (DISPATCH_MUSIC via get_music.py) ----
def _loadwav(p):
    _, d = wavfile.read(p); a = (d.astype(np.float32) / 32768.) if d.dtype == np.int16 else d.astype(np.float32)
    return a if a.ndim > 1 else np.stack([a, a], 1)
_mp = os.environ.get("DISPATCH_MUSIC")
if not (_mp and os.path.exists(_mp)):
    print("NO SOURCED MUSIC — set DISPATCH_MUSIC to the get_music.py wav"); sys.exit(1)
X = _loadwav(_mp); print("music: sourced ->", _mp)
_mstat = {"source": "sourced", "path": _mp}
try:
    _cf = os.path.join(os.path.dirname(_mp), "music_credit.json")
    if os.path.exists(_cf): _mstat["credit"] = json.load(open(_cf)).get("credit", "")
except Exception: pass
json.dump(_mstat, open(os.path.join(AUD, "music_status.json"), "w"))
# pick the quietest 60 s window of the track, fade, pre-normalize
mono = X.mean(1); hop = int(SR * 0.2)
envv = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) for i in range(0, len(mono) - int(60 * SR), hop)])
wl = int(60 / 0.2); best = None
for s_ in range(0, max(1, len(envv) - wl), 3):
    m_ = envv[s_:s_ + wl].mean()
    if best is None or m_ < best[0]: best = (m_, s_ * 0.2)
w0 = best[1] if best else 0.0; seg = X[int(w0 * SR):int(w0 * SR) + int(60 * SR)].copy()
if len(seg) < int(60 * SR): seg = np.pad(seg, ((0, int(60 * SR) - len(seg)), (0, 0)))
fi = int(.6 * SR); fo = int(2.0 * SR); seg[:fi] *= np.linspace(0, 1, fi)[:, None]; seg[-fo:] *= np.linspace(1, 0, fo)[:, None]
wavfile.write(os.path.join(AUD, "bed60raw.wav"), SR, (seg * 32767).astype(np.int16))
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "bed60raw.wav"), "-af", "loudnorm=I=-23:TP=-5:LRA=11", "-ar", "44100", os.path.join(AUD, "bed60.wav")])
# ---- premix: VO dominant, music ducked under it, rumble + ticks under everything ----
graph = ("[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,equalizer=f=3300:t=q:w=2:g=2.5[vo];"
         "[vo]asplit=2[vout][key];[1:a]highpass=f=40,equalizer=f=2500:t=q:w=1.3:g=-3[mus];[mus][key]sidechaincompress=threshold=0.04:ratio=8:attack=25:release=450[md];"
         "[2:a]volume=-14dB,lowpass=f=440[rum];[3:a]volume=-18dB[tk];"
         "[vout][md][rum][tk]amix=inputs=4:duration=first:normalize=0[mix]")
r = run(["ffmpeg", "-y", "-i", os.path.join(AUD, "vo60.wav"), "-i", os.path.join(AUD, "bed60.wav"),
         "-i", os.path.join(AUD, "rumble60.wav"), "-i", os.path.join(AUD, "ticks60.wav"),
         "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix60.wav")])
if r.returncode: print("PREMIX FAIL", r.stderr[-700:]); sys.exit(1)
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix60.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=8", "-ar", "44100", os.path.join(AUD, "master60.wav")])
def rms(a, b):
    r = run(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", os.path.join(AUD, "master60.wav"), "-af", "astats", "-f", "null", "-"])
    mm = re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr); return float(mm[0]) if mm else -120
r = run(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr); TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
tail = rms(55.6, 57.5)
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS | music-tail={tail:.1f}dB (>-34)")
print("PASS" if (tail > -34 and I and -15.5 < float(I[-1]) < -12.5) else "CHECK")
