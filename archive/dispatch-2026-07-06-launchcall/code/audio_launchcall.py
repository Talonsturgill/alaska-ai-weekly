""""The Launch Call" 60s Dispatch mix: vo60 + arctic-wind ambient bed + a synthesized, per-event SFX
layer built directly from audio/sfx_events.json (pulse/whoosh/tick/hit/riser/lock/pop/boom) + ducked
sourced music, two-pass loudnorm -14 LUFS/-1.5 dBTP, with the audio GATE.
"""
import os, subprocess, json, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio"); SR = 44100
env = dict(os.environ); env["SSL_CERT_FILE"] = "/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"] = "/etc/ssl/certs"
def run(c): return subprocess.run(c, capture_output=True, text=True, env=env)
def t(d): return np.linspace(0, d, int(SR * d), endpoint=False)
def lp(x, fc, o=4): return sosfilt(butter(o, fc / (SR / 2), 'low', output='sos'), x)
def hp(x, fc, o=4): return sosfilt(butter(o, fc / (SR / 2), 'high', output='sos'), x)
def bp(x, a, b, o=4): return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], 'band', output='sos'), x)
def nrm(x, p=.85): x = x / (np.max(np.abs(x)) + 1e-9); return (x * p * 32767).astype(np.int16)
rng = np.random.default_rng(9)

TOTAL = 60.0
N = int(TOTAL * SR)

# ---------------- arctic wind/storm ambient bed (60s), replaces the underwater ambient ----------------
tt = t(TOTAL)
amb = lp(rng.standard_normal(len(tt)), 900) * (.55 + .45 * np.sin(2 * np.pi * .05 * tt))
amb += .18 * hp(lp(rng.standard_normal(len(tt)), 2200), 500) * (.5 + .5 * np.sin(2 * np.pi * .11 * tt + 1.3))
for _ in range(6):  # occasional gust swells
    st = rng.uniform(0, 55); dur = rng.uniform(1.2, 2.4); n = int(dur * SR)
    tb = np.linspace(0, dur, n); env_g = np.sin(np.pi * tb / dur) ** 2
    s0 = int(st * SR); e0 = min(len(amb), s0 + n)
    amb[s0:e0] += lp(rng.standard_normal(e0 - s0), 1400) * env_g[: e0 - s0] * .35
wavfile.write(os.path.join(AUD, "amb60.wav"), SR, nrm(amb, .75))

# ---------------- per-event synthesized SFX layer (built directly from sfx_events.json) ----------------
sfx_j = json.load(open(os.path.join(AUD, "sfx_events.json")))
events = sfx_j["events"]

def syn_pulse(dur=0.30):
    tb = t(dur); f0 = 105 - 30 * (tb / dur)
    sig = np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.exp(-tb / (dur * .32))
    return lp(sig, 260)

def syn_whoosh(dur=0.42):
    tb = t(dur); env_w = np.sin(np.pi * tb / dur)
    n = rng.standard_normal(len(tb))
    sweep = bp(n, 1800, 6500) * (1 - tb / dur) + bp(n, 250, 1200) * (tb / dur)
    return sweep * env_w

def syn_tick(dur=0.07):
    tb = t(dur)
    sig = np.tanh(2.2 * np.sin(2 * np.pi * 2600 * tb)) * np.exp(-tb / (dur * .22))
    return hp(sig, 1200)

def syn_hit(dur=0.24):
    tb = t(dur); f0 = 180 * np.exp(-tb / .05)
    sig = np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.exp(-tb / (dur * .35))
    click = np.tanh(3 * rng.standard_normal(len(tb))) * np.exp(-tb / .01) * .5
    return lp(sig, 500) + hp(click, 2000)

def syn_riser(dur=1.7):
    tb = t(dur); f0 = 220 + 380 * (tb / dur) ** 1.4
    sig = np.sin(2 * np.pi * np.cumsum(f0) / SR) * (tb / dur) ** 0.8
    return bp(sig, 180, 3200) * 0.8

def syn_lock(dur=0.10):
    tb = t(dur)
    sig = np.tanh(2.5 * np.sin(2 * np.pi * 1400 * tb)) * np.exp(-tb / (dur * .18))
    return hp(sig, 800)

def syn_pop(dur=0.09):
    tb = t(dur)
    sig = np.sin(2 * np.pi * 3200 * tb) * np.exp(-tb / (dur * .12))
    return hp(sig, 1800)

def syn_boom(dur=2.2):
    tb = t(dur); f0 = 74.0
    sig = (np.sin(2 * np.pi * f0 * tb) + .5 * np.sin(2 * np.pi * f0 * 1.5 * tb) + .3 * np.sin(2 * np.pi * f0 * 2 * tb))
    return lp(sig, 900) * np.exp(-tb / (dur * .55)) * np.sin(np.pi * np.clip(tb / (dur * .08), 0, 1) / 2)

SYN = {"pulse": syn_pulse, "whoosh": syn_whoosh, "tick": syn_tick, "hit": syn_hit,
       "riser": syn_riser, "lock": syn_lock, "pop": syn_pop, "boom": syn_boom}
GAIN = {"pulse": .55, "whoosh": .5, "tick": .5, "hit": .65, "riser": .5, "lock": .55, "pop": .45, "boom": .6}

sfxbuf = np.zeros(N, np.float32)
for e in events:
    kind = e.get("kind", "hit"); fn = SYN.get(kind, syn_hit)
    burst = fn().astype(np.float32) * GAIN.get(kind, 0.5)
    s = int(e["t"] * SR); en = min(N, s + len(burst))
    if s < N:
        sfxbuf[s:en] += burst[: en - s]
wavfile.write(os.path.join(AUD, "sfx60.wav"), SR, nrm(sfxbuf, .9))

# ---------------- music bed: prefer the freshly-sourced track (get_music.py), else synth fallback ----------------
def _loadwav(p):
    _, d = wavfile.read(p); a = (d.astype(np.float32) / 32768.) if d.dtype == np.int16 else d.astype(np.float32)
    return a if a.ndim > 1 else np.stack([a, a], 1)
def _synth_bed(d=80.0):
    n = int(d * SR); tt2 = t(d); base = 55.0; sig = np.zeros(n, np.float32)
    for k, r in enumerate([1.0, 1.5, 2.0, 2.997, 4.0]):
        vib = 1 + 0.003 * np.sin(2 * np.pi * 0.06 * tt2 + k)
        sig += (0.55 / (k + 1)) * np.sin(2 * np.pi * base * r * np.cumsum(vib) / SR).astype(np.float32)
    swell = (0.45 + 0.55 * np.sin(2 * np.pi * 0.018 * tt2 - 1.2)).astype(np.float32)
    sig = lp(sig * swell, 560).astype(np.float32) + 0.12 * lp(rng.standard_normal(n).astype(np.float32), 180) * swell
    return np.stack([s := sig / (np.max(np.abs(sig)) + 1e-9) * 0.6, s], 1).astype(np.float32)
_mp = os.environ.get("DISPATCH_MUSIC"); _legacy = os.path.join(HERE, "music", "188_44.wav")
if _mp and os.path.exists(_mp): X = _loadwav(_mp); print("music: sourced ->", _mp)
elif os.path.exists(_legacy): X = _loadwav(_legacy); print("music: legacy asset")
else: X = _synth_bed(); print("music: SYNTH fallback (no track sourced; note it in the draft)")
_msrc = ("sourced" if (_mp and os.path.exists(_mp)) else ("legacy" if os.path.exists(_legacy) else "synth"))
_mstat = {"source": _msrc, "path": _mp or _legacy or ""}
try:
    _cf = os.path.join(os.path.dirname(_mp), "music_credit.json") if _mp else ""
    if _cf and os.path.exists(_cf): _mstat["credit"] = json.load(open(_cf)).get("credit", "")
except Exception: pass
json.dump(_mstat, open(os.path.join(AUD, "music_status.json"), "w"))
mono_ = X.mean(1) if X.ndim > 1 else X; hop = int(SR * 0.2)
envv = np.array([np.sqrt(np.mean(mono_[i:i + hop] ** 2)) for i in range(0, len(mono_) - int(60 * SR), hop)])
wl = int(60 / 0.2); best = None
for s_ in range(0, max(1, len(envv) - wl), 3):
    m_ = envv[s_:s_ + wl].mean()
    if best is None or m_ < best[0]: best = (m_, s_ * 0.2)
w0 = best[1] if best else 0.0; print("music window start", round(w0, 1)); seg = X[int(w0 * SR):int(w0 * SR) + int(60 * SR)].copy()
if len(seg) < int(60 * SR): seg = np.pad(seg, ((0, int(60 * SR) - len(seg)), (0, 0)))
fi = int(.6 * SR); fo = int(2.0 * SR); seg[:fi] *= np.linspace(0, 1, fi)[:, None]; seg[-fo:] *= np.linspace(1, 0, fo)[:, None]
wavfile.write(os.path.join(AUD, "bed60raw.wav"), SR, (seg * 32767).astype(np.int16))
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "bed60raw.wav"), "-af", "loudnorm=I=-23:TP=-5:LRA=11", "-ar", "44100", os.path.join(AUD, "bed60.wav")])

# ---------------- premix: VO (ducking sidechain key) + music (ducked) + ambient + sfx layer ----------------
graph = ("[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,"
         "equalizer=f=3400:t=q:w=2:g=2.5,equalizer=f=6800:t=q:w=2.2:g=-3[vo];"
         "[vo]asplit=2[vout][key];[1:a]highpass=f=100,equalizer=f=2500:t=q:w=1.3:g=-3.5[mus];"
         "[mus][key]sidechaincompress=threshold=0.035:ratio=8:attack=25:release=450[md];"
         "[2:a]volume=-20dB,lowpass=f=2400[amb];[3:a]volume=-8dB[sf];"
         "[vout][md][amb][sf]amix=inputs=4:duration=first:normalize=0[mix]")
r = run(["ffmpeg", "-y", "-i", os.path.join(AUD, "vo60.wav"), "-i", os.path.join(AUD, "bed60.wav"),
         "-i", os.path.join(AUD, "amb60.wav"), "-i", os.path.join(AUD, "sfx60.wav"),
         "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix60.wav")])
if r.returncode: print("PREMIX FAIL", r.stderr[-800:]); sys.exit(1)
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix60.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=8", "-ar", "44100", os.path.join(AUD, "master60.wav")])

def rms(a, b):
    r = run(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", os.path.join(AUD, "master60.wav"), "-af", "astats", "-f", "null", "-"])
    mm = re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr); return float(mm[0]) if mm else -120
r = run(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr); TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
tail = rms(56.0, 58.0); mid = rms(40, 42)
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS | tail={tail:.1f}dB (>-34) mid-voice={mid:.1f}dB")
print("PASS" if (tail > -34 and I and -15.5 < float(I[-1]) < -12.5) else "CHECK")
