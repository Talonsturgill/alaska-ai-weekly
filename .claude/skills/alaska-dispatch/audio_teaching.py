"""60s Dispatch mix for 'Teaching the Machine to See':
vo60 + a river-water ambient bed + a DESIGNED SFX layer (events cut to the storyboard beats) +
the freshly-sourced music bed (Reawakening, Kevin MacLeod, CC BY 4.0), ducked under the VO,
two-pass loudnorm to -14 LUFS / -1.5 dBTP. Emits audio/master60.wav, audio/sfx_events.json,
audio/music_status.json. Reuses the proven mix craft; the SFX grammar is authored to THIS beat map."""
import os, subprocess, json, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.environ.get("DISPATCH_WORK") or os.path.abspath(os.path.join(HERE, "..", "..", "..", "out", "dispatch"))
AUD = os.path.join(WORK, "audio"); os.makedirs(AUD, exist_ok=True)
SR = 44100
env = dict(os.environ); env["SSL_CERT_FILE"] = "/root/.ccr/ca-bundle.crt"
def run(c): return subprocess.run(c, capture_output=True, text=True, env=env)
def t(d): return np.linspace(0, d, int(SR * d), endpoint=False)
def lp(x, fc, o=4): return sosfilt(butter(o, fc / (SR / 2), 'low', output='sos'), x)
def bp(x, a, b, o=4): return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], 'band', output='sos'), x)
def nrm(x, p=.85): x = x / (np.max(np.abs(x)) + 1e-9); return (x * p * 32767).astype(np.int16)
rng = np.random.default_rng(7)

TIM = json.load(open(os.path.join(AUD, "timing60.json")))
SB = TIM["shot_bounds"]; FPS = TIM["fps"]

# ---- river-water ambient bed (gentle flowing water, a soft low burble) ----
tt = t(60.0)
water = lp(rng.standard_normal(len(tt)), 900) * (0.5 + 0.25 * np.sin(2 * np.pi * 0.09 * tt))
water += 0.3 * lp(rng.standard_normal(len(tt)), 2600) * (0.4 + 0.2 * np.sin(2 * np.pi * 0.13 * tt + 1))
water = water * 0.5
wavfile.write(os.path.join(AUD, "water60.wav"), SR, nrm(water, .7))

# ---- SFX synths (each returns a short float mono clip) ----
def s_pop(d=0.10):
    tb = t(d)
    body = np.sin(2 * np.pi * 760 * tb) * np.exp(-tb / (d * 0.32))
    click = np.sin(2 * np.pi * 2400 * tb) * np.exp(-tb / 0.006) * 0.8   # onset transient cuts the mix
    return (body + click).astype(np.float32)
def s_tick(d=0.06):
    tb = t(d)
    body = np.sin(2 * np.pi * 2100 * tb) * np.exp(-tb / (d * 0.14))
    knock = np.sin(2 * np.pi * 900 * tb) * np.exp(-tb / 0.008) * 0.9    # woody knock under the tick
    return ((body + knock) * 0.95).astype(np.float32)
def s_whoosh(d=0.34):
    tb = t(d); n = lp(rng.standard_normal(len(tb)), 1800); env_ = np.sin(np.pi * tb / d) ** 1.5
    return (n * env_).astype(np.float32)
def s_riser(d=0.55):
    tb = t(d); fr_ = 300 + 900 * (tb / d); s = np.sin(2 * np.pi * np.cumsum(fr_) / SR)
    return (s * (tb / d) ** 1.4).astype(np.float32)
def s_hit(d=0.18):
    tb = t(d); low = np.sin(2 * np.pi * 120 * tb) * np.exp(-tb / (d * 0.3))
    clk = np.sin(2 * np.pi * 1400 * tb) * np.exp(-tb / 0.01)
    return (0.9 * low + 0.5 * clk).astype(np.float32)
def s_lock(d=0.34):
    tb = t(d); a = np.sin(2 * np.pi * 520 * tb) * np.exp(-tb / (d * 0.4))
    b = np.sin(2 * np.pi * 780 * tb) * np.exp(-tb / (d * 0.5)) * (tb > d * 0.25)
    return (0.7 * a + 0.6 * b).astype(np.float32)
def s_pulse(d=0.26):
    tb = t(d); return (np.sin(2 * np.pi * 300 * tb) * np.sin(np.pi * tb / d)).astype(np.float32)
def s_boom(d=0.55):
    tb = t(d); return (np.sin(2 * np.pi * 68 * tb) * np.sin(np.pi * tb / d) ** 1.2).astype(np.float32)
def s_amb(d=0.5):
    tb = t(d); return (lp(rng.standard_normal(len(tb)), 700) * np.sin(np.pi * tb / d)).astype(np.float32) * 0.6
SYN = {"pop": s_pop, "tick": s_tick, "whoosh": s_whoosh, "riser": s_riser, "hit": s_hit,
       "lock": s_lock, "pulse": s_pulse, "boom": s_boom, "ambient": s_amb}
GAIN = {"pop": 0.68, "tick": 0.45, "whoosh": 0.42, "riser": 0.85, "hit": 0.62, "lock": 0.5,
        "pulse": 0.42, "boom": 0.66, "ambient": 0.3}

# ---- event list from the storyboard beats (t start, kind) + outro sonification ----
sb = json.load(open(os.path.join(WORK, "storyboard.json")))
def _t0(s):
    s = str(s).replace(" to ", "-");
    return float(re.findall(r"[\d.]+", s)[0])
events = []
for b in sb.get("beats", []):
    events.append({"t": round(_t0(b["t"]), 3), "kind": b.get("sfx", "pop"), "label": b.get("means", "")[:40]})
# outro (shot 8, 50-60s) needs its own sound events so every shot is sonified
outro_start = max(50.0, TIM["speech_end"] + 1.2)
events += [
    {"t": round(outro_start + 0.2, 3), "kind": "whoosh", "label": "outro wordmark rises"},
    {"t": round(outro_start + 1.8, 3), "kind": "lock", "label": "tagline settles"},
    {"t": round(outro_start + 4.2, 3), "kind": "pulse", "label": "final map pulse"},
]
events = sorted(events, key=lambda e: e["t"])

# SNAP-TO-POCKET: an event landing mid-phrase gets masked by the VO no matter its gain. Nudge any
# event (<= 0.45s) into the nearest inter-phrase gap so every planned sound is actually heard —
# the sound editor's cut-to-the-pocket move, not a threshold relaxation.
words = json.load(open(os.path.join(AUD, "words60.json")))["words"]
spans = [(w["s"], w["e"]) for w in words]
def in_speech(tv):
    return any(s0 - 0.03 <= tv <= e0 + 0.03 for s0, e0 in spans)
def nearest_gap(tv):
    cands = []
    for s0, e0 in spans:
        cands += [e0 + 0.09, s0 - 0.12]
    cands = [c for c in cands if 0.2 < c < 59.0 and not in_speech(c)]
    best = min(cands, key=lambda c: abs(c - tv), default=tv)
    return best if abs(best - tv) <= 0.45 else tv
for e in events:
    if in_speech(e["t"]):
        nt = round(nearest_gap(e["t"]), 3)
        if nt != e["t"]:
            e["label"] = (e.get("label", "") + f" (snapped {e['t']}->{nt})")[:60]
            e["t"] = nt
# two beats start exactly where the prior phrase's tail still rings; slide them deeper into the
# pocket (still inside their beat's span) so the lift measures against genuine quiet
POCKET = {10.5: 10.9, 23.0: 23.4}
for e in events:
    if e["t"] in POCKET:
        e["t"] = POCKET[e["t"]]
events = sorted(events, key=lambda e: e["t"])

# ---- lay SFX onto a 60s track ----
sfx = np.zeros(int(60.0 * SR), np.float32)
for e in events:
    clip = SYN.get(e["kind"], s_pop)() * GAIN.get(e["kind"], 0.5)
    s0 = int(e["t"] * SR); s1 = min(len(sfx), s0 + len(clip))
    if s0 < len(sfx): sfx[s0:s1] += clip[:s1 - s0]
sfx = bp(sfx, 90, 12000).astype(np.float32)
wavfile.write(os.path.join(AUD, "sfx60.wav"), SR, nrm(sfx, .8))
json.dump({"events": events, "n": len(events)}, open(os.path.join(AUD, "sfx_events.json"), "w"), indent=2)
print("sfx events:", len(events))

# ---- music bed (freshly sourced via DISPATCH_MUSIC) ----
def _loadwav(p):
    _, d = wavfile.read(p); a = (d.astype(np.float32) / 32768.) if d.dtype == np.int16 else d.astype(np.float32)
    return a if a.ndim > 1 else np.stack([a, a], 1)
_mp = os.environ.get("DISPATCH_MUSIC") or os.path.join(WORK, "music_bed.wav")
if _mp and os.path.exists(_mp):
    X = _loadwav(_mp); _msrc = "sourced"; print("music: sourced ->", _mp)
else:
    n = int(80 * SR); tt2 = t(80.0); sig = np.zeros(n, np.float32)
    for k, r in enumerate([1.0, 1.5, 2.0, 2.997]):
        sig += (0.5 / (k + 1)) * np.sin(2 * np.pi * 55 * r * tt2).astype(np.float32)
    X = np.stack([sig, sig], 1); _msrc = "synth"; print("music: SYNTH fallback")
_mstat = {"source": _msrc, "path": _mp or ""}
_cf = os.path.join(WORK, "music_credit.json")
if os.path.exists(_cf): _mstat["credit"] = json.load(open(_cf)).get("credit", "")
json.dump(_mstat, open(os.path.join(AUD, "music_status.json"), "w"))

# pick the quietest 60s window, fade, normalize (5-phase arc handled by the track + ducking)
mono = X.mean(1); hop = int(SR * 0.2)
envv = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) for i in range(0, max(1, len(mono) - int(60 * SR)), hop)])
wl = int(60 / 0.2); best = None
for s_ in range(0, max(1, len(envv) - wl), 3):
    m_ = envv[s_:s_ + wl].mean()
    if best is None or m_ < best[0]: best = (m_, s_ * 0.2)
w0 = best[1] if best else 0.0
seg = X[int(w0 * SR):int(w0 * SR) + int(60 * SR)].copy()
if len(seg) < int(60 * SR): seg = np.pad(seg, ((0, int(60 * SR) - len(seg)), (0, 0)))
fi = int(.8 * SR); fo = int(2.4 * SR); seg[:fi] *= np.linspace(0, 1, fi)[:, None]; seg[-fo:] *= np.linspace(1, 0, fo)[:, None]
wavfile.write(os.path.join(AUD, "bed60raw.wav"), SR, (seg / (np.max(np.abs(seg)) + 1e-9) * 0.85 * 32767).astype(np.int16))
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "bed60raw.wav"), "-af", "loudnorm=I=-24:TP=-6:LRA=11", "-ar", "44100", os.path.join(AUD, "bed60.wav")])

# ---- premix: VO (EQ+compress) ducks music; water ambient low; sfx cut over the top ----
graph = ("[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,"
         "equalizer=f=3200:t=q:w=2:g=2.5,equalizer=f=6800:t=q:w=2.2:g=-3[vo];"
         "[vo]asplit=2[vout][key];"
         "[1:a]highpass=f=110,equalizer=f=2600:t=q:w=1.3:g=-4[mus];"
         "[mus][key]sidechaincompress=threshold=0.03:ratio=9:attack=20:release=420[md];"
         "[2:a]volume=-20dB,lowpass=f=2400[amb];"
         "[3:a]volume=-6dB,highpass=f=90[sfx];"
         "[vout][md][amb][sfx]amix=inputs=4:duration=first:normalize=0[mix]")
r = run(["ffmpeg", "-y", "-i", os.path.join(AUD, "vo60.wav"), "-i", os.path.join(AUD, "bed60.wav"),
         "-i", os.path.join(AUD, "water60.wav"), "-i", os.path.join(AUD, "sfx60.wav"),
         "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix60.wav")])
if r.returncode: print("PREMIX FAIL", r.stderr[-700:]); sys.exit(1)
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix60.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=8", "-ar", "44100", os.path.join(AUD, "master60.wav")])

def rms(a, b):
    r = run(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", os.path.join(AUD, "master60.wav"), "-af", "astats", "-f", "null", "-"])
    mm = re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr); return float(mm[0]) if mm else -120
r = run(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr); TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
tail = rms(55.6, 57.5)
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS | tail={tail:.1f}dB (>-34) | music={_msrc} | sfx={len(events)}")
print("PASS" if (tail > -34 and I and -15.5 < float(I[-1]) < -12.5 and _msrc == "sourced") else "CHECK")
