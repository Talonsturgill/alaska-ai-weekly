"""60s Dispatch mix for "The Count from a Dot":
vo60 + tundra-wind ambient + a motivated SFX layer cut to the beats + ducked sourced music,
two-pass loudnorm -14 LUFS / -1.5 dBTP. Emits audio/sfx_events.json + audio/music_status.json.
"""
import os, subprocess, json, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio"); SR = 44100
CA = "/root/.ccr/ca-bundle.crt"
env = dict(os.environ); env["SSL_CERT_FILE"] = CA; env["SSL_CERT_DIR"] = os.path.dirname(CA)
def run(c): return subprocess.run(c, capture_output=True, text=True, env=env)
def t(d): return np.linspace(0, d, int(SR * d), endpoint=False)
def lp(x, fc, o=4): return sosfilt(butter(o, fc / (SR / 2), 'low', output='sos'), x)
def hp(x, fc, o=4): return sosfilt(butter(o, fc / (SR / 2), 'high', output='sos'), x)
def bp(x, a, b, o=4): return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], 'band', output='sos'), x)
def nrm(x, p=.9): x = x / (np.max(np.abs(x)) + 1e-9); return (x * p * 32767).astype(np.int16)
rng = np.random.default_rng(708)

TOTAL = 60.0; N = int(TOTAL * SR)

# ---------------- ambient volcanic-night bed: deep seismic rumble + high wind + faint magma crackle ----------------
tt = t(TOTAL)
# a low ground rumble that breathes, plus a thin cold wind on top
amb = lp(rng.standard_normal(N), 110) * (.60 + .40 * np.sin(2 * np.pi * .045 * tt)) + .16 * lp(rng.standard_normal(N), 480)
# occasional wind gust across the chain
for _ in range(6):
    st = rng.uniform(0, 57); dur = rng.uniform(1.4, 2.8); n = int(dur * SR)
    g = lp(rng.standard_normal(n), 520) * np.hanning(n) * 0.45
    amb[int(st * SR):int(st * SR) + n] += g[:min(n, N - int(st * SR))]
# faint magma crackle: sparse high-passed clicks, denser early (over the crater) and fading late
for _ in range(140):
    ct = rng.uniform(0.5, 45.0); w = 1.0 - ct / 55.0
    if rng.random() > 0.35 + 0.5 * w: continue
    ci = int(ct * SR); cl = int(rng.uniform(0.004, 0.02) * SR)
    click = hp(rng.standard_normal(cl), 2200) * np.exp(-np.linspace(0, 6, cl)) * (0.10 + 0.10 * w)
    amb[ci:ci + cl] += click[:max(0, min(cl, N - ci))]
wavfile.write(os.path.join(AUD, "amb60.wav"), SR, nrm(amb, .8))

# ---------------- SFX synthesis (motivated, cut to the beats) ----------------
def env_ad(n, a, d):
    e = np.ones(n); ai = int(a * SR); di = int(d * SR)
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if di: e[-di:] = np.linspace(1, 0, di)
    return e
def s_tick(dur=0.05, f=1900):
    x = t(dur); return np.tanh(2 * np.sin(2 * np.pi * f * x)) * np.exp(-x / (dur * .3)) * 0.7
def s_pop(dur=0.13, f=520):
    x = t(dur); return np.sin(2 * np.pi * (f + 260 * np.exp(-x / .03)) * x) * np.exp(-x / (dur * .35)) * 0.8
def s_whoosh(dur=0.45):
    x = t(dur); nz = lp(rng.standard_normal(len(x)), 3000); return nz * np.hanning(len(x)) * (0.4 + 0.6 * x / dur) * 0.7
def s_riser(dur=1.3):
    x = t(dur); f = 180 + 900 * (x / dur) ** 2; s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    nz = hp(rng.standard_normal(len(x)), 800) * (x / dur)
    return (0.5 * s + 0.5 * nz) * (x / dur) ** 1.5 * 0.7
def s_boom(dur=0.8, f=58):
    x = t(dur); return (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 2 * x)) * np.exp(-x / (dur * .4)) * 0.95
def s_lock(dur=0.2):
    x = t(dur); a = np.sin(2 * np.pi * 660 * x) * np.exp(-x / .05); b = np.sin(2 * np.pi * 990 * x) * np.exp(-(x - .06) / .06) * (x > .06)
    return (a + b) * 0.6
def s_shimmer(dur=0.9):
    x = t(dur); s = sum(np.sin(2 * np.pi * fr * (1 + 0.01 * np.sin(2 * np.pi * 7 * x)) * x) for fr in (1200, 1560, 2010))
    return s / 3 * env_ad(len(x), .1, .5) * np.exp(-x / (dur)) * 0.5
def s_clack(dur=0.09):
    x = t(dur); return (hp(rng.standard_normal(len(x)), 1500) * np.exp(-x / .015)) * 0.9
def s_boot(dur=0.28):
    x = t(dur); f = 400 + 1400 * (x / dur); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(x), .02, .12) * 0.5
def s_drone(dur=2.6, f=96):
    x = t(dur); s = np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 1.5 * x) + 0.25 * bp(rng.standard_normal(len(x)), 90, 260)
    return s * env_ad(len(x), .3, .8) * 0.35
def s_resolve(dur=1.4, f=196):
    x = t(dur); s = sum(a * np.sin(2 * np.pi * f * r * x) for r, a in ((1, .6), (1.5, .4), (2, .3), (2.5, .2)))
    return s * env_ad(len(x), .15, .8) * np.exp(-x / (dur * 1.3)) * 0.5

def s_magma(dur=1.6):
    x = t(dur); base = lp(rng.standard_normal(len(x)), 90) * 0.5
    clk = np.zeros(len(x), np.float32)
    for _ in range(int(dur * 22)):
        i = int(rng.uniform(0, len(x) - 1)); cl = int(rng.uniform(0.003, 0.014) * SR)
        clk[i:i + cl] += (hp(rng.standard_normal(cl), 2000) * np.exp(-np.linspace(0, 6, cl)))[:max(0, min(cl, len(x) - i))] * 0.5
    return (base + clk) * env_ad(len(x), .1, .6) * 0.8
def s_dissolve(dur=1.4, f=520):
    x = t(dur); g = f * (1 - 0.55 * (x / dur))          # a falling, hollowing swell toward near-silence
    s = np.sin(2 * np.pi * np.cumsum(g) / SR) * (1 - x / dur) ** 1.4
    return (0.6 * s + 0.4 * lp(rng.standard_normal(len(x)), 700) * (1 - x / dur)) * env_ad(len(x), .05, .5) * 0.55
def s_glitch(dur=0.34):
    x = t(dur); base = np.sin(2 * np.pi * 440 * x)
    gate = (np.sin(2 * np.pi * 38 * x) > 0).astype(np.float32)  # stutter/gate
    return (base * gate + 0.5 * hp(rng.standard_normal(len(x)), 1800) * gate) * np.exp(-x / (dur * .7)) * 0.6

# (t seconds, kind, label, synth) — >=1 per shot, cut to the beat map (shots: S1 .5-10.3, S2 10.3-18.7,
# S3 18.7-24.3, S4 24.3-36.1, S5 36.1-41.9, S6 41.9-46.6, S7 46.6-60). Sounds match storyboard beats.
EVENTS = [
    # S1 — the mountain venting + the chain
    (0.7,  "boom",    "crater glows, sub-bass",         s_boom(0.95, 48)),
    (4.2,  "ambient", "magma crackle rising",           s_magma(1.6)),
    (5.0,  "lock",    "WATCH ORANGE badge stamps in",   s_lock(0.22)),
    (7.6,  "tick",    "cone ignites",                   s_tick(0.06, 1300)),
    (8.6,  "tick",    "cone ignites",                   s_tick(0.06, 1500)),
    (9.6,  "tick",    "cone ignites",                   s_tick(0.06, 1700)),
    # S2 — the world slices open, sensors wake, sound travels
    (10.5, "whoosh",  "view slices to cross-section",   s_whoosh(0.5)),
    (12.4, "boot",    "two sensors power on",           s_boot(0.30)),
    (14.4, "boom",    "seismic rumble down the rock",   s_boom(0.8, 56)),
    (16.9, "whoosh",  "infrasound sweep through air",   s_whoosh(0.55)),
    # S3 — waves morph up into the spectrogram
    (18.8, "riser",   "waves morph into a spectrogram", s_riser(1.5)),
    (22.2, "shimmer", "spectrogram resolves",           s_shimmer(0.9)),
    # S4 — the reader boots, tally climbs, tags lock, 87% locks
    (24.4, "boot",    "VOISS-Net interface boots",      s_boot(0.32)),
    (26.3, "tick",    "training tally climbs",          s_tick(0.05, 1900)),
    (27.1, "tick",    "training tally climbs",          s_tick(0.05, 2050)),
    (29.5, "lock",    "TREMOR tag locks",               s_lock(0.18)),
    (30.9, "lock",    "EXPLOSION tag locks",            s_lock(0.18)),
    (32.8, "boom",    "87% accuracy locks in",          s_boom(0.5, 70)),
    # S5 — the honest turn: name vs foresee, dissolve to a ?
    (36.1, "boom",    "hard downbeat on the turn",      s_boom(0.85, 52)),
    (39.6, "ambient", "dissolving swell to a question", s_dissolve(1.6, 520)),
    # S6 — the tag slips, a person keeps watch
    (42.0, "tick",    "the label glitches and slips",   s_glitch(0.34)),
    (44.5, "resolve", "warm tone under the silhouette", s_resolve(1.3, 180)),
    # S7 — the arc map settles, sign-off
    (46.7, "riser",   "the arc map rises and settles",  s_resolve(1.7, 196)),
    (49.2, "shimmer", "sound-rings pulse across the arc",s_shimmer(0.9)),
    (52.8, "boom",    "the sign-off lands",             s_boom(0.7, 60)),
    (54.4, "shimmer", "outro sound-ring pulse",         s_shimmer(0.8)),
    (58.0, "shimmer", "final sound-ring pulse",         s_shimmer(0.9)),
]
sfx = np.zeros(N, np.float32)
for (tt0, kind, label, sig) in EVENTS:
    s0 = int(tt0 * SR); e0 = min(s0 + len(sig), N); sfx[s0:e0] += sig[:e0 - s0].astype(np.float32)
sfx = sfx / (np.max(np.abs(sfx)) + 1e-9) * 0.85
wavfile.write(os.path.join(AUD, "sfx60.wav"), SR, (np.stack([sfx, sfx], 1) * 32767).astype(np.int16))
# emit the event manifest the SFX_EVENTS gate reads
json.dump({"events": [{"t": round(float(a), 3), "kind": b, "label": c} for (a, b, c, _) in EVENTS], "n": len(EVENTS)},
          open(os.path.join(AUD, "sfx_events.json"), "w"), indent=2)

# ---------------- music: the freshly-sourced bed (DISPATCH_MUSIC) ----------------
def _loadwav(p):
    _, d = wavfile.read(p); a = (d.astype(np.float32) / 32768.) if d.dtype == np.int16 else d.astype(np.float32)
    return a if a.ndim > 1 else np.stack([a, a], 1)
_mp = os.environ.get("DISPATCH_MUSIC", os.path.join(HERE, "music_bed.wav"))
if not os.path.exists(_mp):
    print("NO MUSIC at", _mp); sys.exit(2)
X = _loadwav(_mp); print("music: sourced ->", _mp)
_mstat = {"source": "sourced", "path": _mp}
_cf = os.path.join(os.path.dirname(_mp), "music_credit.json")
if os.path.exists(_cf):
    try: _mstat["credit"] = json.load(open(_cf)).get("credit", "")
    except Exception: pass
json.dump(_mstat, open(os.path.join(AUD, "music_status.json"), "w"))
# pick the calmest 60s window, fade, loudnorm to a bed level
mono = X.mean(1); hop = int(SR * 0.2)
envv = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) for i in range(0, max(1, len(mono) - int(60 * SR)), hop)])
wl = int(60 / 0.2); best = None
for s_ in range(0, max(1, len(envv) - wl), 3):
    m_ = envv[s_:s_ + wl].mean()
    if best is None or m_ < best[0]: best = (m_, s_ * 0.2)
w0 = best[1] if best else 0.0
seg = X[int(w0 * SR):int(w0 * SR) + int(60 * SR)].copy()
if len(seg) < int(60 * SR): seg = np.pad(seg, ((0, int(60 * SR) - len(seg)), (0, 0)))
fi = int(.8 * SR); fo = int(2.2 * SR); seg[:fi] *= np.linspace(0, 1, fi)[:, None]; seg[-fo:] *= np.linspace(1, 0, fo)[:, None]
wavfile.write(os.path.join(AUD, "bed60raw.wav"), SR, (seg * 32767).astype(np.int16))
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "bed60raw.wav"), "-af", "loudnorm=I=-24:TP=-6:LRA=11", "-ar", "44100", os.path.join(AUD, "bed60.wav")])

# ---------------- premix: VO ducks music; add ambient + sfx ----------------
graph = ("[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,equalizer=f=3200:t=q:w=2:g=2.5,equalizer=f=6600:t=q:w=2.2:g=-2[vo];"
         "[vo]asplit=2[vout][key];"
         "[1:a]highpass=f=110,equalizer=f=2600:t=q:w=1.3:g=-3[mus];[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=25:release=450[md];"
         "[2:a]volume=-24dB,lowpass=f=1800[amb];"
         "[3:a]volume=-9dB[sfx];"
         "[vout][md][amb][sfx]amix=inputs=4:duration=first:normalize=0[mix]")
r = run(["ffmpeg", "-y", "-i", os.path.join(AUD, "vo60.wav"), "-i", os.path.join(AUD, "bed60.wav"),
         "-i", os.path.join(AUD, "amb60.wav"), "-i", os.path.join(AUD, "sfx60.wav"),
         "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix60.wav")])
if r.returncode: print("PREMIX FAIL", r.stderr[-800:]); sys.exit(1)
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix60.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=8", "-ar", "44100", os.path.join(AUD, "master60.wav")])
# report
import re
r = run(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr); TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
print(f"MASTER: I={I[-1] if I else '?'} LUFS  TP={TP[-1] if TP else '?'} dBFS  | sfx events={len(EVENTS)}")
print("PASS" if (I and -15.5 < float(I[-1]) < -12.5) else "CHECK")
