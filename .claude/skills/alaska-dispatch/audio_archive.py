"""Audio mix for Dispatch 'The Lid' — VO (bf_emma) + sourced music (ducked) + smoke-story ambient
+ motivated SFX placed at the beat times, two-pass loudnorm to -14 LUFS / -1.0 dBTP, audio gate.
Emits audio/sfx_events.json (>=8 events, >=1 per shot) and mirrors master + events to out/dispatch/audio.
No synth music (music comes from DISPATCH_MUSIC / music_bed.wav).
"""
import os, subprocess, json, re, sys, shutil
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio"); SR = 44100
OUTAUD = os.path.abspath(os.path.join(HERE, "..", "..", "..", "out", "dispatch", "audio")); os.makedirs(OUTAUD, exist_ok=True)
import dispatch_core as dc
env = dict(os.environ); env["SSL_CERT_FILE"] = "/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"] = "/etc/ssl/certs"
def run(c): return subprocess.run(c, capture_output=True, text=True, env=env)
def t(d): return np.linspace(0, d, int(SR * d), endpoint=False)
def lp(x, fc, o=4): return sosfilt(butter(o, fc / (SR / 2), 'low', output='sos'), x)
def bp(x, a, b, o=4): return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], 'band', output='sos'), x)
def nrm(x, p=.9): x = x / (np.max(np.abs(x)) + 1e-9); return (x * p * 32767).astype(np.int16)
rng = np.random.default_rng(11)
TOTAL = 60.0; N = int(TOTAL * SR)

# ---------------- SFX one-shots (return float32 mono) ----------------
def sfx_whoosh(d=0.5):
    tt = t(d); e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.4
    return (bp(rng.standard_normal(len(tt)), 250, 2400) * e * 0.9).astype(np.float32)
def sfx_boom(d=0.6):
    tt = t(d); f = 78 - 30 * tt / d
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (d * .35)) * 0.95).astype(np.float32)
def sfx_hit(d=0.2):
    tt = t(d); return (( .6 * np.sin(2 * np.pi * 120 * tt) + bp(rng.standard_normal(len(tt)), 300, 3000)) * np.exp(-tt / (d * .3))).astype(np.float32)
def sfx_tick(d=0.05):
    tt = t(d); return (bp(rng.standard_normal(len(tt)), 2200, 6500) * np.exp(-tt / (d * .3)) * 0.8).astype(np.float32)
def sfx_riser(d=0.6, up=True):
    tt = t(d); f = (400 + 900 * tt / d) if up else (1300 - 900 * tt / d)
    e = np.clip(tt / (d * .2), 0, 1) * np.clip((d - tt) / (d * .3), 0, 1)
    return (np.tanh(1.3 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * e * 0.7).astype(np.float32)
def sfx_pulse(d=0.35):
    tt = t(d); return (np.sin(2 * np.pi * 1400 * tt) * np.exp(-tt / (d * .3)) * 0.7).astype(np.float32)
def sfx_lock(d=0.3):
    tt = t(d); s = np.zeros(len(tt), np.float32)
    for k in (0.0, 0.06, 0.12):  # ratchet clicks
        i = int(k * SR); s[i:i + 400] += bp(rng.standard_normal(400), 900, 3500) * np.exp(-np.linspace(0, 1, 400) * 6)
    s += 0.7 * np.sin(2 * np.pi * 90 * tt) * np.exp(-tt / (d * .25))  # lock thunk
    return (s * 0.8).astype(np.float32)
def sfx_pop(d=0.12):
    tt = t(d); return (bp(rng.standard_normal(len(tt)), 500, 2600) * np.exp(-tt / (d * .3)) * 0.7).astype(np.float32)
def sfx_chirp(d=0.42):
    # fui-boot: two rising sine blips (880->1320 Hz), bright enough to read over a VO onset
    tt = t(d); s = np.zeros(len(tt), np.float32)
    for k, f0 in ((0.0, 880.0), (0.16, 1320.0)):
        i = int(k * SR); n = int(0.12 * SR); seg = np.linspace(0, 0.12, n, endpoint=False)
        s[i:i + n] += np.sin(2 * np.pi * (f0 + 500 * seg / 0.12) * seg) * np.exp(-seg / 0.05)
    return (s * 0.9).astype(np.float32)

MAKERS = {"whoosh": sfx_whoosh, "boom": sfx_boom, "hit": sfx_hit, "tick": sfx_tick,
          "riser": lambda: sfx_riser(up=True), "pulldown": lambda: sfx_riser(up=False),
          "pulse": sfx_pulse, "lock": sfx_lock, "pop": sfx_pop, "chirp": sfx_chirp,
          "ambient": lambda: np.zeros(1, np.float32)}

# ---------------- the SFX event list (>=1 per shot; kinds from the gate vocab) ----------------
# (t seconds, kind for the mix, gate-kind, label). gate-kind must be in pop/whoosh/riser/hit/ambient/tick/boom/lock/pulse
EVENTS = [
    (1.0,  "tick",     "tick",   "cold scanner sweep tick"),
    (5.2,  "pop",      "pop",    "the DEI prompt line types on"),
    (7.7,  "whoosh",   "whoosh", "a grant card lifts to the machine slot"),
    (10.6, "lock",     "lock",   "card seats, the classifier gate boots"),
    (14.5, "hit",      "hit",    "the YES/NO binary snaps"),
    (15.9, "pulse",    "pulse",  "the archive card blooms into warm waveforms"),
    (19.4, "riser",    "riser",  "the field of recordings deepens"),
    (22.0, "boom",     "boom",   "the crimson stamp descends"),
    (24.6, "hit",      "hit",    "TERMINATED stamp lands, bars grey"),
    (27.2, "pop",      "riser",  "red cascade spreading across the grid"),
    (30.7, "boom",     "boom",   "100 million dollars, 22 days slam in"),
    (34.2, "lock",     "lock",   "a human hand closes on the lever"),
    (39.0, "riser",    "riser",  "the court-green wave restores the archive"),
    (43.6, "tick",     "tick",   "push in, the dim gaps remain"),
    (47.7, "pulse",    "pulse",  "a human reads along every line"),
    (52.7, "hit",      "hit",    "soft brand sting"),
]

# ---------------- SFX bus ----------------
sfxbus = np.zeros(N, np.float32)
GAIN = {"whoosh": .5, "boom": .8, "hit": .55, "tick": .5, "riser": .45, "pulldown": .5, "pulse": .55, "lock": .7, "pop": .5, "chirp": .95}
for (tt0, mk, gk, lab) in EVENTS:
    s = MAKERS[mk]()
    i = int(tt0 * SR); e = min(i + len(s), N)
    sfxbus[i:e] += s[:e - i] * GAIN.get(mk, .5)
wavfile.write(os.path.join(AUD, "sfxbus60.wav"), SR, nrm(sfxbus, .85))

# ---------------- ambient bed: cold institutional room (fluorescent hum + sparse paper/key shuffles) ----------------
tt = t(TOTAL)
hum = (0.5 * np.sin(2 * np.pi * 120.0 * tt) + 0.3 * np.sin(2 * np.pi * 60.0 * tt)) * 0.12  # mains fluorescent hum
room = lp(rng.standard_normal(N), 240) * 0.5                                                # low room tone
shuffle = np.zeros(N, np.float32)
for _ in range(70):
    st = rng.uniform(0, 59); n = int(rng.uniform(.008, .02) * SR); i = int(st * SR)
    shuffle[i:i + n] += bp(rng.standard_normal(n), 1800, 6000) * np.exp(-np.linspace(0, 1, n) * 6) * rng.uniform(.15, .4)
amb = (hum + room) * 0.7 + shuffle * 0.5
wavfile.write(os.path.join(AUD, "amb60.wav"), SR, nrm(amb, .8))

# ---------------- music (sourced only) ----------------
def _loadwav(p):
    _, d = wavfile.read(p); a = (d.astype(np.float32) / 32768.) if d.dtype == np.int16 else d.astype(np.float32)
    return a if a.ndim > 1 else np.stack([a, a], 1)
_mp = os.environ.get("DISPATCH_MUSIC") or os.path.abspath(os.path.join(HERE, "..", "..", "..", "out", "dispatch", "music_bed.wav"))
if not os.path.exists(_mp):
    print("NO MUSIC BED at", _mp); sys.exit(2)
X = _loadwav(_mp); _msrc = "sourced"
_mstat = {"source": _msrc, "path": _mp}
try:
    _cf = os.path.abspath(os.path.join(os.path.dirname(_mp), "music_credit.json"))
    if os.path.exists(_cf): _mstat["credit"] = json.load(open(_cf)).get("credit", "")
except Exception: pass
json.dump(_mstat, open(os.path.join(AUD, "music_status.json"), "w"))
# pick the quietest 60s window then fade
mono = X.mean(1); hop = int(SR * 0.2)
envv = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) for i in range(0, max(1, len(mono) - int(60 * SR)), hop)])
wl = int(60 / 0.2); best = None
for s_ in range(0, max(1, len(envv) - wl), 3):
    m_ = envv[s_:s_ + wl].mean()
    if best is None or m_ < best[0]: best = (m_, s_ * 0.2)
w0 = best[1] if best else 0.0
seg = X[int(w0 * SR):int(w0 * SR) + int(60 * SR)].copy()
if len(seg) < int(60 * SR): seg = np.pad(seg, ((0, int(60 * SR) - len(seg)), (0, 0)))
fi = int(.6 * SR); fo = int(2.4 * SR); seg[:fi] *= np.linspace(0, 1, fi)[:, None]; seg[-fo:] *= np.linspace(1, 0, fo)[:, None]
wavfile.write(os.path.join(AUD, "bed60raw.wav"), SR, (seg * 32767).astype(np.int16))
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "bed60raw.wav"), "-af", "loudnorm=I=-24:TP=-6:LRA=11", "-ar", "44100", os.path.join(AUD, "bed60.wav")])

# ---------------- premix: VO (EQ+comp) + ducked music + ambient + SFX bus ----------------
graph = ("[0:a]highpass=f=90,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,"
         "equalizer=f=3200:t=q:w=2:g=2.5,equalizer=f=6800:t=q:w=2.2:g=-3[vo];"
         "[vo]asplit=2[vout][key];"
         "[1:a]highpass=f=110,equalizer=f=2500:t=q:w=1.3:g=-3.5[mus];"
         "[mus][key]sidechaincompress=threshold=0.03:ratio=9:attack=20:release=420[md];"
         "[2:a]volume=-24dB,lowpass=f=1800[amb];"
         "[3:a]volume=-4dB[sfx];"
         "[vout][md][amb][sfx]amix=inputs=4:duration=first:normalize=0[mx];"
         # pre-payoff breath: hard-duck the bed/ambient in the VO gap at ~33.8s (no VO there) so the
         # SILENCE_DIP is really mixed, not just planned (VOICE_AND_SCORE.md).
         "[mx]volume=enable='between(t,33.40,33.98)':volume=0.26[mix]")
r = run(["ffmpeg", "-y", "-i", os.path.join(AUD, "vo60.wav"), "-i", os.path.join(AUD, "bed60.wav"),
         "-i", os.path.join(AUD, "amb60.wav"), "-i", os.path.join(AUD, "sfxbus60.wav"),
         "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix60.wav")])
if r.returncode: print("PREMIX FAIL", r.stderr[-700:]); sys.exit(1)
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix60.wav"), "-af", "loudnorm=I=-14:TP=-1.0:LRA=8", "-ar", "44100", os.path.join(AUD, "master60.wav")])

# ---------------- emit sfx events + gate ----------------
dc.write_sfx_events([{"t": e[0], "kind": e[2], "label": e[3]} for e in EVENTS])
def rms(a, b):
    r = run(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", os.path.join(AUD, "master60.wav"), "-af", "astats", "-f", "null", "-"])
    mm = re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr); return float(mm[0]) if mm else -120
r = run(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr); TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
tail = rms(55.6, 57.5); mid = rms(30, 32)
ok = (tail > -34 and I and -15.5 < float(I[-1]) < -12.5 and TP and float(TP[-1]) <= -0.9)
print(f"AUDIO GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS tail={tail:.1f}dB mid-voice={mid:.1f}dB -> {'PASS' if ok else 'CHECK'}")
# mirror to out/dispatch/audio
for fn in ("master60.wav", "sfx_events.json", "music_status.json"):
    src = os.path.join(AUD, fn)
    if os.path.exists(src): shutil.copy(src, os.path.join(OUTAUD, fn))
print("wrote master60.wav + sfx_events.json (", len(EVENTS), "events )")
