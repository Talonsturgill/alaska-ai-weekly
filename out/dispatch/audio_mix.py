"""60s+ WhaleSpotter Dispatch mix: vo60 + night-sea ambience + a motivated SFX layer cut to the
picture's own beats (tick/pop/whoosh/riser/hit/lock/pulse/boom) + the sourced "Anguish" music bed,
ducked under the VO, two-pass loudnorm -14 LUFS / -1.5 dBTP, with the audio GATE.
Writes audio/sfx_events.json (VISUAL_FLOW.md sonification contract) + audio/music_status.json +
audio/master60.wav.
"""
import os, subprocess, json, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, "audio")
SR = 44100
TOTAL = 64.0

env = dict(os.environ)
env["SSL_CERT_FILE"] = "/etc/ssl/certs/ca-certificates.crt"
env["SSL_CERT_DIR"] = "/etc/ssl/certs"


def run(c):
    return subprocess.run(c, capture_output=True, text=True, env=env)


def t(d):
    return np.linspace(0, d, int(SR * d), endpoint=False)


def lp(x, fc, o=4):
    return sosfilt(butter(o, fc / (SR / 2), 'low', output='sos'), x)


def bp(x, a, b, o=4):
    return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], 'band', output='sos'), x)


def nrm(x, p=0.85):
    x = x / (np.max(np.abs(x)) + 1e-9)
    return (x * p * 32767).astype(np.int16)


rng = np.random.default_rng(19)

# ---------------- night-sea ambience (64s): low wind + distant swell + a faint metal-hull creak ----------------
tt = t(TOTAL)
amb = lp(rng.standard_normal(len(tt)), 260) * (0.55 + 0.35 * np.sin(2 * np.pi * 0.05 * tt))
amb += 0.18 * lp(rng.standard_normal(len(tt)), 620)
for _ in range(6):
    st = rng.uniform(0, TOTAL - 3); dur = rng.uniform(0.6, 1.4); n = int(dur * SR)
    tb = np.linspace(0, dur, n); ff = 70 + 20 * np.sin(tb / dur * np.pi)
    creak = np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-tb / (dur * 0.6))
    s0 = int(st * SR)
    amb[s0:s0 + n] += bp(creak, 60, 200) * 0.12
wavfile.write(os.path.join(AUD, "amb.wav"), SR, nrm(amb, 0.75))

# ---------------- SFX event bed: one procedural burst per beat, matching its declared `kind` ----------------
storyboard = json.load(open(os.path.join(HERE, "storyboard.json")))
beats = storyboard["beats"]


def syn_tick(dur=0.05):
    tb = t(dur); f0 = 2200 * np.exp(-tb / (dur * 0.5))
    return np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f0) / SR)) * np.exp(-tb / (dur * 0.28))


def syn_pop(dur=0.09):
    tb = t(dur); f0 = 520 * np.exp(-tb / (dur * 0.7))
    return np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.exp(-tb / (dur * 0.32))


def syn_whoosh(dur=0.4):
    tb = t(dur); n = rng.standard_normal(len(tb))
    sweep = bp(n, 250, 3400)
    return sweep * np.sin(np.pi * tb / dur)


def syn_riser(dur=0.9):
    tb = t(dur); n = rng.standard_normal(len(tb))
    sweep = bp(n, 200, 3200)
    return sweep * (tb / dur) ** 1.2


def syn_hit(dur=0.18):
    tb = t(dur); f0 = 90 * np.exp(-tb / (dur * 0.4))
    return (np.sin(2 * np.pi * np.cumsum(f0) / SR) + 0.4 * rng.standard_normal(len(tb))) * np.exp(-tb / (dur * 0.22))


def syn_lock(dur=0.12):
    tb = t(dur); a = syn_tick(dur * 0.4); b = np.zeros(int(dur * SR))
    b[: len(a)] += a
    off = int(dur * SR * 0.55)
    a2 = syn_tick(dur * 0.35)
    b[off: off + len(a2)] += a2 * 0.85
    return b


def syn_pulse(dur=0.22):
    tb = t(dur); f0 = 760 + 30 * np.sin(2 * np.pi * 6 * tb)
    return np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.exp(-tb / (dur * 0.5))


def syn_boom(dur=1.1):
    tb = t(dur); f0 = 62 * np.exp(-tb / (dur * 1.4))
    return np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.exp(-tb / (dur * 0.55))


def syn_ambient_swell(dur=0.6):
    tb = t(dur); n = rng.standard_normal(len(tb))
    return lp(n, 500) * np.sin(np.pi * tb / dur) * 0.6


SYN = {"tick": syn_tick, "pop": syn_pop, "whoosh": syn_whoosh, "riser": syn_riser,
       "hit": syn_hit, "lock": syn_lock, "pulse": syn_pulse, "boom": syn_boom, "ambient": syn_ambient_swell}

sfx_bed = np.zeros(int(TOTAL * SR), np.float32)
events = []
for b in beats:
    t0 = float(str(b["t"]).split("-")[0])
    kind = b.get("sfx", "tick")
    fn = SYN.get(kind, syn_tick)
    burst = fn().astype(np.float32)
    s0 = int(t0 * SR)
    e0 = min(len(sfx_bed), s0 + len(burst))
    if e0 > s0:
        sfx_bed[s0:e0] += burst[: e0 - s0] * (0.9 if kind in ("boom", "riser") else 0.65)
    events.append({"t": round(t0, 3), "kind": kind, "label": b.get("means", "")[:60]})
# outro boom slightly after the last beat, under the wordmark reveal
outro_t = 60.4
sfx_bed_tail = syn_boom(1.2).astype(np.float32) * 0.55
s0 = int(outro_t * SR); e0 = min(len(sfx_bed), s0 + len(sfx_bed_tail))
if e0 > s0:
    sfx_bed[s0:e0] += sfx_bed_tail[: e0 - s0]
events.append({"t": round(outro_t, 3), "kind": "boom", "label": "wordmark reveal"})

import sys as _s
sys.path.insert(0, HERE)
import dispatch_core as dc
dc.write_sfx_events(events, os.path.join(AUD, "sfx_events.json"))
wavfile.write(os.path.join(AUD, "sfx.wav"), SR, nrm(sfx_bed, 0.8))
print(f"sfx events: {len(events)}")

# ---------------- music bed: the sourced track (Anguish, Kevin MacLeod, CC BY 4.0) ----------------
def _loadwav(p):
    _, d = wavfile.read(p)
    a = (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)
    return a if a.ndim > 1 else np.stack([a, a], 1)


_mp = os.environ.get("DISPATCH_MUSIC")
if _mp and os.path.exists(_mp):
    X = _loadwav(_mp)
    print("music: sourced ->", _mp)
    _msrc = "sourced"
else:
    print("music: NO TRACK FOUND -- this must not happen; get_music.py must run first", file=sys.stderr)
    sys.exit(1)

_mstat = {"source": _msrc, "path": _mp}
try:
    _cf = os.path.join(os.path.dirname(_mp), "music_credit.json")
    if os.path.exists(_cf):
        _mstat["credit"] = json.load(open(_cf)).get("credit", "")
except Exception:
    pass
json.dump(_mstat, open(os.path.join(AUD, "music_status.json"), "w"))

mono = X.mean(1) if X.ndim > 1 else X
hop = int(SR * 0.2)
envv = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) for i in range(0, max(1, len(mono) - int(TOTAL * SR)), hop)])
wl = int(TOTAL / 0.2)
best = None
for s_ in range(0, max(1, len(envv) - wl), 3):
    m_ = envv[s_:s_ + wl].mean()
    if best is None or m_ < best[0]:
        best = (m_, s_ * 0.2)
w0 = best[1] if best else 0.0
print("music window start", round(w0, 1))
seg = X[int(w0 * SR): int(w0 * SR) + int(TOTAL * SR)].copy()
if len(seg) < int(TOTAL * SR):
    seg = np.pad(seg, ((0, int(TOTAL * SR) - len(seg)), (0, 0)))
fi, fo = int(0.8 * SR), int(2.5 * SR)
seg[:fi] *= np.linspace(0, 1, fi)[:, None]
seg[-fo:] *= np.linspace(1, 0, fo)[:, None]
wavfile.write(os.path.join(AUD, "bed_raw.wav"), SR, (seg * 32767).astype(np.int16))
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "bed_raw.wav"), "-af", "loudnorm=I=-23:TP=-5:LRA=11", "-ar", "44100",
     os.path.join(AUD, "bed.wav")])

# ---------------- premix: VO (sidechain-ducks music+sfx), ambience low, sfx present but under VO ----------------
graph = (
    "[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,"
    "equalizer=f=3400:t=q:w=2:g=2.5,equalizer=f=6800:t=q:w=2.2:g=-3[vo];"
    "[vo]asplit=2[vout][key];"
    "[1:a]highpass=f=100,equalizer=f=2500:t=q:w=1.3:g=-3.5[mus];"
    "[mus][key]sidechaincompress=threshold=0.035:ratio=7:attack=25:release=420[md];"
    "[2:a]volume=-24dB,lowpass=f=1800[amb];"
    "[3:a]volume=-9dB[sfx];"
    "[vout][md][amb][sfx]amix=inputs=4:duration=longest:normalize=0[mix]"
)
r = run(["ffmpeg", "-y", "-i", os.path.join(AUD, "vo60.wav"), "-i", os.path.join(AUD, "bed.wav"),
         "-i", os.path.join(AUD, "amb.wav"), "-i", os.path.join(AUD, "sfx.wav"),
         "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix.wav")])
if r.returncode:
    print("PREMIX FAIL", r.stderr[-800:])
    sys.exit(1)
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=8", "-ar", "44100",
     os.path.join(AUD, "master60.wav")])


def rms(a, b):
    r = run(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", os.path.join(AUD, "master60.wav"), "-af", "astats", "-f", "null", "-"])
    mm = re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr)
    return float(mm[0]) if mm else -120


r = run(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr)
TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
tail = rms(60.0, 63.5)
mid = rms(40, 42)
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS | tail={tail:.1f}dB (>-34) mid-voice={mid:.1f}dB")
print("PASS" if (tail > -34 and I and -15.5 < float(I[-1]) < -12.5) else "CHECK")
