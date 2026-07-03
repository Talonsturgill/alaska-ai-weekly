"""60s Dispatch mix -- "The Ten Minute Clock" (XPRIZE Wildfire). vo60 + a boreal-night ambient bed +
motivated SFX cut to the picture (grid boot-up ping, drone whoosh, accelerating countdown ticks, a
suppression burst, a resolve tone) + a sidechain-ducked, sourced music bed, two-pass loudnorm to
-14 LUFS / -1.5 dBTP, with the audio GATE. Adapted from audio_v3.py's structure for THIS story's
sound design (no whale/sonar reuse -- this story has no beluga or salmon).
"""
import os, subprocess, json, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, "audio")
SR = 44100
env = dict(os.environ)
env["SSL_CERT_FILE"] = "/etc/ssl/certs/ca-certificates.crt"
env["SSL_CERT_DIR"] = "/etc/ssl/certs"


def run(c):
    return subprocess.run(c, capture_output=True, text=True, env=env)


def t(d):
    return np.linspace(0, d, int(SR * d), endpoint=False)


def lp(x, fc, o=4):
    return sosfilt(butter(o, fc / (SR / 2), "low", output="sos"), x)


def bp(x, a, b, o=4):
    return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], "band", output="sos"), x)


def nrm(x, p=0.85):
    x = x / (np.max(np.abs(x)) + 1e-9)
    return (x * p * 32767).astype(np.int16)


rng = np.random.default_rng(2026)

# ---------------- ambient bed: boreal night forest (wind through canopy, no water) ----------------
tt = t(60.0)
amb = lp(rng.standard_normal(len(tt)), 260) * (0.55 + 0.35 * np.sin(2 * np.pi * 0.05 * tt))
amb += 0.14 * lp(rng.standard_normal(len(tt)), 900)
for _ in range(10):
    st = rng.uniform(0, 57)
    dur = rng.uniform(0.05, 0.11)
    n = int(dur * SR)
    tb = np.linspace(0, dur, n)
    ff = 700 + 500 * tb / dur
    amb[int(st * SR):int(st * SR) + n] += lp(np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-tb / (dur * 0.35)), 2200) * 0.10
wavfile.write(os.path.join(AUD, "amb60.wav"), SR, nrm(amb, 0.75))

# ---------------- SFX cut to the picture (timeline matches render_wildfire.py shot boundaries) ----------------
sfx = np.zeros(int(60.0 * SR), np.float32)


def place(sig, at_s, gain=1.0):
    s = int(at_s * SR)
    e = min(s + len(sig), len(sfx))
    if s < len(sfx) and e > s:
        sfx[s:e] += sig[: e - s] * gain


# grid boot-up ping (~9.6s, shot1->2): a rising two-tone chirp + a soft click lattice
d1 = t(1.6)
f1 = 520 + 900 * (d1 / 1.6) ** 1.6
boot = np.sin(2 * np.pi * np.cumsum(f1) / SR) * np.exp(-d1 / 0.9)
boot = lp(boot, 4200)
place(boot, 9.55, 0.55)
for k in range(4):
    tk_ = t(0.05)
    click = np.sin(2 * np.pi * 2600 * tk_) * np.exp(-tk_ / 0.012)
    place(click, 9.6 + k * 0.22, 0.35)

# drone whoosh (~19.1-24s, the whip-pan into the swarm + Anduril pass)
dw = t(2.6)
whoosh = lp(rng.standard_normal(len(dw)), 1800) * np.hanning(len(dw))
whoosh *= (1 + 0.6 * np.sin(2 * np.pi * 3.2 * dw))
place(whoosh, 19.3, 0.32)
dw2 = t(1.8)
whoosh2 = lp(rng.standard_normal(len(dw2)), 2400) * np.hanning(len(dw2))
place(whoosh2, 26.8, 0.22)

# accelerating countdown ticks (~30.0-34.6s)
tick_times = [30.0 + i * (4.6 / 9) * (1 - i * 0.05) for i in range(9)]
for i, tt0 in enumerate(tick_times):
    tk_ = t(0.045)
    pitch = 1400 + i * 60
    click = np.sin(2 * np.pi * pitch * tk_) * np.exp(-tk_ / 0.02)
    place(click, tt0, 0.30)

# suppression burst (~34.6s: dur*0.66 within shot4 -> 900/30 + 0.66*9.1 = 30+6.0=36.0s)
db = t(1.1)
boom = np.sin(2 * np.pi * np.cumsum(np.linspace(90, 35, len(db))) / SR) * np.exp(-db / 0.35)
hiss = lp(rng.standard_normal(len(db)), 3200) * np.exp(-db / 0.5)
place(boom * 0.8 + hiss * 0.5, 35.95, 0.5)

# resolve tone (contained, ~36.3s) + a second soft resolve at the caveat reveal (~45.5s)
dr_ = t(2.0)
resolve = np.sin(2 * np.pi * 660 * dr_) * np.exp(-dr_ / 1.1) + 0.5 * np.sin(2 * np.pi * 990 * dr_) * np.exp(-dr_ / 0.8)
place(lp(resolve, 3000), 36.3, 0.22)
dr2 = t(1.6)
resolve2 = np.sin(2 * np.pi * 440 * dr2) * np.exp(-dr2 / 1.0)
place(lp(resolve2, 2600), 45.4, 0.16)

wavfile.write(os.path.join(AUD, "sfx60.wav"), SR, nrm(sfx, 0.8))

# ---------------- music bed: sourced track (DISPATCH_MUSIC), trimmed to the best 60s window ----------------
def _loadwav(p):
    _, d = wavfile.read(p)
    a = (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)
    return a if a.ndim > 1 else np.stack([a, a], 1)


def _synth_bed(d=80.0):
    n = int(d * SR)
    tt2 = t(d)
    base = 98.0
    sig = np.zeros(n, np.float32)
    for k, r in enumerate([1.0, 1.5, 2.0, 2.997, 4.0]):
        vib = 1 + 0.003 * np.sin(2 * np.pi * 0.06 * tt2 + k)
        sig += (0.5 / (k + 1)) * np.sin(2 * np.pi * base * r * np.cumsum(vib) / SR).astype(np.float32)
    swell = (0.5 + 0.5 * np.sin(2 * np.pi * 0.02 * tt2 - 1.0)).astype(np.float32)
    sig = lp(sig * swell, 620).astype(np.float32)
    s = sig / (np.max(np.abs(sig)) + 1e-9) * 0.6
    return np.stack([s, s], 1).astype(np.float32)


_mp = os.environ.get("DISPATCH_MUSIC")
_legacy = os.path.join(HERE, "music", "188_44.wav")
if _mp and os.path.exists(_mp):
    X = _loadwav(_mp)
    print("music: sourced ->", _mp)
elif os.path.exists(_legacy):
    X = _loadwav(_legacy)
    print("music: legacy asset")
else:
    X = _synth_bed()
    print("music: SYNTH fallback (no track sourced; note it in the draft)")
_msrc = "sourced" if (_mp and os.path.exists(_mp)) else ("legacy" if os.path.exists(_legacy) else "synth")
_mstat = {"source": _msrc, "path": _mp or _legacy or ""}
try:
    _cf = os.path.join(os.path.dirname(_mp), "music_credit.json") if _mp else ""
    if _cf and os.path.exists(_cf):
        _mstat["credit"] = json.load(open(_cf)).get("credit", "")
except Exception:
    pass
json.dump(_mstat, open(os.path.join(AUD, "music_status.json"), "w"))

mono = X.mean(1) if X.ndim > 1 else X
hop = int(SR * 0.2)
envv = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) for i in range(0, len(mono) - int(60 * SR), hop)])
wl = int(60 / 0.2)
best = None
for s_ in range(0, max(1, len(envv) - wl), 3):
    m_ = envv[s_:s_ + wl].mean()
    if best is None or m_ < best[0]:
        best = (m_, s_ * 0.2)
w0 = best[1] if best else 0.0
print("music window start", round(w0, 1))
seg = X[int(w0 * SR):int(w0 * SR) + int(60 * SR)].copy()
if len(seg) < int(60 * SR):
    seg = np.pad(seg, ((0, int(60 * SR) - len(seg)), (0, 0)))
fi = int(0.6 * SR)
fo = int(2.0 * SR)
seg[:fi] *= np.linspace(0, 1, fi)[:, None]
seg[-fo:] *= np.linspace(1, 0, fo)[:, None]
wavfile.write(os.path.join(AUD, "bed60raw.wav"), SR, (seg * 32767).astype(np.int16))
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "bed60raw.wav"), "-af", "loudnorm=I=-23:TP=-5:LRA=11", "-ar", "44100", os.path.join(AUD, "bed60.wav")])

# ---------------- premix: VO (0dB anchor) + sidechain-ducked music + ambient + SFX ----------------
graph = (
    "[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,"
    "equalizer=f=3400:t=q:w=2:g=2.5,equalizer=f=6800:t=q:w=2.2:g=-3[vo];"
    "[vo]asplit=2[vout][key];"
    "[1:a]highpass=f=100,equalizer=f=2500:t=q:w=1.3:g=-3.5[mus];"
    "[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=25:release=450[md];"
    "[2:a]volume=-26dB,lowpass=f=2600[amb];"
    "[3:a]volume=-13dB[sf];"
    "[vout][md][amb][sf]amix=inputs=4:duration=first:normalize=0[mix]"
)
r = run([
    "ffmpeg", "-y",
    "-i", os.path.join(AUD, "vo60.wav"),
    "-i", os.path.join(AUD, "bed60.wav"),
    "-i", os.path.join(AUD, "amb60.wav"),
    "-i", os.path.join(AUD, "sfx60.wav"),
    "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix60.wav"),
])
if r.returncode:
    print("PREMIX FAIL", r.stderr[-800:])
    sys.exit(1)
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix60.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=8", "-ar", "44100", os.path.join(AUD, "master60.wav")])


def rms(a, b):
    r = run(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", os.path.join(AUD, "master60.wav"), "-af", "astats", "-f", "null", "-"])
    mm = re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr)
    return float(mm[0]) if mm else -120


r = run(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr)
TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
tail = rms(55.6, 57.5)
mid = rms(40, 42)
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS | tail={tail:.1f}dB (>-34) mid-voice={mid:.1f}dB")
print("PASS" if (tail > -34 and I and -15.5 < float(I[-1]) < -12.5) else "CHECK")
