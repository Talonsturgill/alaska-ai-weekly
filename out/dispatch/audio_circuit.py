"""Circuit 64s Dispatch mix: vo60 + sourced music bed (with the 42s seam) + print-shop SFX layer
(stamp thocks, ledger ticks, paper whooshes on cuts, diesel rumble, turbine ring, coil creak,
dead-switch clicks, press-roller sweep), two-pass loudnorm -14 LUFS / -1.5 dBTP, plus the gate.
Requires DISPATCH_MUSIC=<wav from get_music.py>. Reads/writes THIS dir's audio/."""
import os, subprocess, json, re, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, "audio"); SR = 44100
TOTAL = 64.0
env = dict(os.environ); env["SSL_CERT_FILE"] = "/etc/ssl/certs/ca-certificates.crt"; env["SSL_CERT_DIR"] = "/etc/ssl/certs"
def run(c): return subprocess.run(c, capture_output=True, text=True, env=env)
def t(d): return np.linspace(0, d, int(SR * d), endpoint=False)
def lp(x, fc, o=4): return sosfilt(butter(o, fc / (SR / 2), 'low', output='sos'), x)
def hp(x, fc, o=4): return sosfilt(butter(o, fc / (SR / 2), 'high', output='sos'), x)
def bp(x, a, b, o=4): return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], 'band', output='sos'), x)
def nrm(x, p=.85): x = x / (np.max(np.abs(x)) + 1e-9); return (x * p * 32767).astype(np.int16)
rng = np.random.default_rng(7)
N = int(TOTAL * SR)

def place(buf, t0, sig, amp=1.0):
    s = int(t0 * SR); e = min(s + len(sig), len(buf)); buf[s:e] += amp * sig[:e - s].astype(np.float32)

# ---------------- SFX bus (events cut to the picture) ----------------
sfx = np.zeros(N, np.float32)

def thock(dur=0.34, f0=95.0, tone=1.0):
    """A felt stamp impact: low sine thump + soft noise bite."""
    n = int(dur * SR); tb = np.linspace(0, dur, n)
    body = np.sin(2 * np.pi * (f0 - 30 * tb / dur) * tb) * np.exp(-tb / (dur * 0.22))
    bite = hp(rng.standard_normal(n), 1200) * np.exp(-tb / 0.018) * 0.5
    return lp(body, 400) * tone + bite * 0.5

def tick(fq=2100.0):
    n = int(0.045 * SR); tb = np.linspace(0, 0.045, n)
    return (np.sin(2 * np.pi * fq * tb) * np.exp(-tb / 0.012)).astype(np.float32)

def whoosh(dur=0.38, lo=300, hi=2400, rev=False):
    n = int(dur * SR); tb = np.linspace(0, 1, n)
    sweep = lo + (hi - lo) * (1 - tb if rev else tb)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    for k in range(0, n, 1024):
        fc = float(np.clip(sweep[min(k, n - 1)], 120, 6000))
        out[k:k + 1024] = bp(x[k:k + 1024], max(80, fc * 0.5), min(9000, fc * 1.6), o=2)
    return (out * np.hanning(n)).astype(np.float32)

# stamps: 4700 (0.35), bases (4.4,4.95,5.5), dated slug (7.5), grid label (9.7), counter lock (13.6),
# quote slam (16.1), panels (20.2), 30% edge (21.0), UNDER 1% lands (25.5), LAST YEAR (25.9),
# GVEA plate (29.1), turbine plate (33.1), $120M slam (34.35), +195% (39.3), buyers slug (40.1),
# waitlist (41.0), PROPOSED ghost (43.8), no-awards slugs (48.1), closing 1 (52.4), question (54.9),
# wordmark (58.2), sources (60.5)
for (tt_, amp, f0) in [(0.35, 1.0, 88), (5.9, 0.55, 120), (6.5, 0.55, 126), (7.1, 0.55, 132),
                       (10.1, 0.4, 110), (12.6, 0.45, 110), (17.9, 0.6, 100), (22.7, 0.95, 84),
                       (25.3, 0.5, 105), (26.3, 0.45, 115), (32.3, 0.75, 92), (33.1, 0.4, 118),
                       (38.3, 0.5, 104), (42.5, 0.45, 112), (41.05, 1.0, 82), (45.9, 0.85, 90),
                       (47.8, 0.5, 108), (49.5, 0.45, 114), (52.7, 0.55, 78), (52.4, 0.5, 106),
                       (55.4, 0.7, 94), (57.9, 0.9, 86), (60.9, 0.8, 90), (62.6, 0.45, 108)]:
    place(sfx, tt_, thock(f0=f0), amp)
# ledger ticks: chits (6.6-8.6, 12) and grid multiplication (9.2-12.4, ~26) and barrels (26-29, 16)
for k in range(12): place(sfx, 9.05 + k * 0.166, tick(2300), 0.30)
for k in range(26): place(sfx, 12.45 + k * 0.118, tick(1800 + (k % 5) * 90), 0.16)
for k in range(16): place(sfx, 34.25 + k * 0.185, tick(950), 0.22)
# row-flood swells (11.5-15.2): soft rising noise per wave
for k in range(10):
    n = int(0.30 * SR); tb = np.linspace(0, 1, n)
    sw = bp(rng.standard_normal(n), 500, 1600) * np.sin(np.pi * tb) * 0.10
    place(sfx, 15.35 + k * 0.32, sw.astype(np.float32))
# paper whooshes on the cuts (9, 20, 30, 42) + press roller (57.5)
for (tt_, dr) in [(12.06, False), (25.06, True), (39.56, False), (51.16, True)]:
    place(sfx, tt_, whoosh(0.42, rev=dr), 0.5)
place(sfx, 59.97, whoosh(0.8, 200, 3400), 0.65)
# diesel rumble under 26-30s
nn = int(4.4 * SR); tb = np.linspace(0, 1, nn)
rumble = lp(rng.standard_normal(nn), 90) * (0.6 + 0.25 * np.sin(2 * np.pi * 9 * tb))
place(sfx, 34.15, (rumble * np.minimum(tb * 6, 1) * np.minimum((1 - tb) * 3.2, 1)).astype(np.float32), 0.5)
# turbine resonant ring as the machine completes (~33.6)
nn = int(2.6 * SR); tb = np.linspace(0, 2.6, nn)
ring = sum(a * np.sin(2 * np.pi * fq * tb) for a, fq in ((0.5, 196), (0.3, 392), (0.16, 588)))
place(sfx, 40.9, (ring * np.exp(-tb / 1.1)).astype(np.float32), 0.35)
# coil tightening creak (38.2-41.8): slow descending granular creak
nn = int(3.4 * SR); tb = np.linspace(0, 1, nn)
cr = bp(rng.standard_normal(nn), 160, 900) * (0.4 + 0.6 * np.sin(2 * np.pi * (3.2 - 2.0 * tb) * tb * 14))
place(sfx, 44.0, (cr * np.sin(np.pi * tb) * 0.5).astype(np.float32), 0.55)
# dead-switch clicks where the pulses die (~49.1, ~51.5)
for tt_ in (54.55, 55.6):
    n = int(0.16 * SR); tb = np.linspace(0, 0.16, n)
    cl = hp(rng.standard_normal(n), 2600) * np.exp(-tb / 0.006)
    cl += np.sin(2 * np.pi * 130 * tb) * np.exp(-tb / 0.05) * 0.8
    place(sfx, tt_, cl.astype(np.float32), 0.8)
wavfile.write(os.path.join(AUD, "sfx64.wav"), SR, nrm(sfx, .8))

# ---------------- music bed: sourced track with the 42s seam ----------------
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
# choose the most energetic-but-steady window of the track for a ledger with momentum:
# pick the window with median energy (not the quietest, not the loudest chorus)
mono = X.mean(1); hop = int(SR * 0.2)
envv = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) for i in range(0, max(1, len(mono) - int(TOTAL * SR)), hop)])
wl = int(TOTAL / 0.2)
cands = [(envv[s_:s_ + wl].mean(), s_ * 0.2) for s_ in range(0, max(1, len(envv) - wl), 3)]
cands.sort()
w0 = cands[len(cands) // 2][1] if cands else 0.0
print("music window start", round(w0, 1))
seg = X[int(w0 * SR):int(w0 * SR) + int(TOTAL * SR)].copy()
if len(seg) < int(TOTAL * SR): seg = np.pad(seg, ((0, int(TOTAL * SR) - len(seg)), (0, 0)))
# the single hard audio seam: music dies on the coil creak (41.0->42.0), restarts as the circuit draws (42.3->43.4)
tt = np.arange(len(seg)) / SR
gain = np.ones(len(seg), np.float32)
gain = np.where((tt >= 50.2) & (tt < 51.2), np.maximum(0.0, 1.0 - (tt - 50.2) / 1.0), gain)
gain = np.where((tt >= 51.2) & (tt < 51.55), 0.0, gain)
gain = np.where((tt >= 51.55) & (tt < 52.7), np.minimum(1.0, (tt - 51.55) / 1.15), gain)
seg *= gain[:, None]
fi = int(.6 * SR); fo = int(2.4 * SR)
seg[:fi] *= np.linspace(0, 1, fi)[:, None]; seg[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 0.8
wavfile.write(os.path.join(AUD, "bed64raw.wav"), SR, (np.clip(seg, -1, 1) * 32767).astype(np.int16))
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "bed64raw.wav"), "-af", "loudnorm=I=-23:TP=-5:LRA=11", "-ar", "44100", os.path.join(AUD, "bed64.wav")])

# ---------------- premix: VO EQ/comp, music sidechain-ducked, SFX under ----------------
graph = ("[0:a]highpass=f=85,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,"
         "equalizer=f=3400:t=q:w=2:g=2.5,equalizer=f=6800:t=q:w=2.2:g=-3[vo];"
         "[vo]asplit=2[vout][key];"
         "[1:a]highpass=f=100,equalizer=f=2500:t=q:w=1.3:g=-3.5[mus];"
         "[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=25:release=450[md];"
         "[2:a]volume=-13dB[sx];"
         "[vout][md][sx]amix=inputs=3:duration=first:normalize=0[mix]")
r = run(["ffmpeg", "-y", "-i", os.path.join(AUD, "vo60.wav"), "-i", os.path.join(AUD, "bed64.wav"),
         "-i", os.path.join(AUD, "sfx64.wav"), "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix64.wav")])
if r.returncode: print("PREMIX FAIL", r.stderr[-600:]); sys.exit(1)
run(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix64.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=8", "-ar", "44100", os.path.join(AUD, "master60.wav")])

# ---------------- audio gate ----------------
def rms(a, b):
    r = run(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", os.path.join(AUD, "master60.wav"), "-af", "astats", "-f", "null", "-"])
    mm = re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr); return float(mm[0]) if mm else -120
r = run(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr); TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
tail = rms(59.5, 62.5); mid = rms(30, 32)
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS | music-tail={tail:.1f}dB (>-34) mid-voice={mid:.1f}dB")
ok = (tail > -34 and I and -15.5 < float(I[-1]) < -12.5 and TP and float(TP[-1]) <= -1.0)
print("PASS" if ok else "CHECK")
sys.exit(0 if ok else 3)
