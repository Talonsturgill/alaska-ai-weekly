"""audio_mix.py — "The Depth Model" 60s mix: Kokoro VO + sourced music bed + motivated SFX,
EQ-carved/ducked VO, two-pass loudnorm to -14 LUFS, with the audio gate. Emits
audio/sfx_events.json (dispatch_core.write_sfx_events schema) so quality_gate's SFX_EVENTS
check can verify the picture is sonified.
"""
import os, sys, json, re
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, "audio")
SR = 44100
sys.path.insert(0, os.path.join(HERE, "..", "..", ".claude", "skills", "alaska-dispatch"))
import dispatch_core as dc


def sh(c):
    import subprocess
    return subprocess.run(c, capture_output=True, text=True)


def t(d):
    return np.linspace(0, d, int(SR * d), endpoint=False)


def lp(x, fc, o=4):
    return sosfilt(butter(o, fc / (SR / 2), "low", output="sos"), x)


def hp(x, fc, o=4):
    return sosfilt(butter(o, fc / (SR / 2), "high", output="sos"), x)


def bp(x, a, b, o=4):
    return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], "band", output="sos"), x)


rng = np.random.default_rng(20260705)

TOTAL = 60.0
N = int(TOTAL * SR)
sfx = np.zeros(N, np.float32)
EVENTS = []


def place(sig, at_s, gain=1.0, kind="hit", label=""):
    s = int(at_s * SR)
    e = min(N, s + len(sig))
    if s < N:
        sfx[s:e] += sig[: e - s] * gain
    EVENTS.append({"t": round(at_s, 3), "kind": kind, "label": label})


def hit(dur=0.22, f0=180, decay=6):
    tt = t(dur)
    sig = np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * decay)
    sig += 0.5 * np.sin(2 * np.pi * f0 * 2.01 * tt) * np.exp(-tt * decay * 1.3)
    return lp(sig, 900).astype(np.float32)


def boom(dur=0.55, f0=70, decay=3.2):
    tt = t(dur)
    sig = np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * decay)
    sig += 0.3 * rng.standard_normal(len(tt)) * np.exp(-tt * decay * 2.5)
    return lp(sig, 400).astype(np.float32)


def tick(dur=0.05, f0=2400):
    tt = t(dur)
    sig = np.sin(2 * np.pi * f0 * tt) * np.exp(-tt / (dur * 0.22))
    return bp(sig, 800, 6000).astype(np.float32)


def whoosh(dur=0.42, rising=True):
    tt = t(dur)
    n = rng.standard_normal(len(tt))
    fc = np.linspace(300, 3200, len(tt)) if rising else np.linspace(3200, 300, len(tt))
    out = np.zeros(len(tt), np.float32)
    for i in range(0, len(tt), 512):
        seg = n[i:i + 512]
        if len(seg) == 0:
            continue
        out[i:i + 512] = bp(seg, max(80, fc[i] * 0.6), min(SR / 2 - 100, fc[i] * 1.4))
    env = np.sin(np.pi * np.linspace(0, 1, len(tt))) ** 0.6
    return (out * env * 0.8).astype(np.float32)


def riser(dur=1.6, f0=180, f1=1400):
    tt = t(dur)
    freq = np.linspace(f0, f1, len(tt))
    sig = np.sin(2 * np.pi * np.cumsum(freq) / SR)
    env = np.linspace(0.1, 1.0, len(tt)) ** 1.4
    return (sig * env * 0.5).astype(np.float32)


def fray_noise(dur=2.0):
    tt = t(dur)
    n = rng.standard_normal(len(tt))
    out = hp(lp(n, 6000), 1200)
    env = np.linspace(0.05, 0.6, len(tt))
    return (out * env * 0.4).astype(np.float32)


def pulse(dur=0.5, f0=220):
    tt = t(dur)
    sig = np.sin(2 * np.pi * f0 * tt) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.2 * tt))
    return (lp(sig, 700) * np.exp(-tt * 1.2)).astype(np.float32)


def chime(dur=1.4, f0=880):
    tt = t(dur)
    sig = np.zeros(len(tt), np.float32)
    for k, ratio in enumerate([1.0, 2.01, 3.0]):
        sig += (0.5 / (k + 1)) * np.sin(2 * np.pi * f0 * ratio * tt)
    return (sig * np.exp(-tt * 2.2)).astype(np.float32)


def creak(dur=0.6):
    tt = t(dur)
    n = rng.standard_normal(len(tt))
    sig = bp(n, 200, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * tt))
    return (sig * np.exp(-tt * 1.8) * 0.6).astype(np.float32)


# ---------------- place the events (matches storyboard.json beats' sfx fields) ----------------
place(hit(f0=140), 0.0, 1.1, "hit", "SEASON CLOSED stamp slam (cold open)")
place(boom(), 0.15, 0.7, "boom", "settling boom after the slam")
place(whoosh(0.35), 4.0, 0.9, "whoosh", "reverse-wipe rewind to 2024")
place(tick(), 4.35, 0.8, "tick", "tally tick 1")
place(tick(), 4.55, 0.8, "tick", "tally tick 2")
place(hit(f0=160, dur=0.16), 8.19, 0.7, "hit", "confirming hit, gate shut")
place(whoosh(0.4), 10.86, 1.0, "whoosh", "match-cut into the water")
place(tick(f0=1800), 15.4, 0.6, "tick", "fish fades to a point")
place(hit(f0=520, dur=0.12), 19.51, 0.7, "pop", "13 YEARS label lands")
place(tick(f0=3200), 19.85, 0.5, "tick", "shimmer on the void")
place(tick(f0=2600), 22.68, 0.7, "tick", "points landing 1")
place(tick(f0=2900), 22.9, 0.6, "tick", "points landing 2")
place(tick(f0=2500), 23.1, 0.6, "tick", "points landing 3")
place(riser(1.6, 220, 900), 25.08, 0.8, "riser", "point-cloud collapse begins")
place(whoosh(0.5), 27.4, 0.8, "whoosh", "assemble payoff whoosh")
place(pulse(), 27.85, 0.8, "pulse", "breathing depth band")
place(pulse(f0=210), 30.9, 0.5, "pulse", "band breathes again")
place(fray_noise(2.4), 30.16, 0.9, "riser", "WHEN fog fraying in")
place(tick(f0=1400, dur=0.09), 33.6, 0.6, "tick", "ghosted question mark")
place(whoosh(0.4), 34.63, 0.9, "whoosh", "cut to the boat")
place(creak(), 35.0, 0.7, "tick", "net paying out")
place(hit(f0=200, dur=0.18), 37.98, 0.8, "hit", "net catch, pollock fill it")
place(boom(f0=90, dur=0.4), 39.92, 0.55, "boom", "VOLUNTARY stamp (softer)")
place(whoosh(0.45), 42.12, 0.9, "whoosh", "map-travel to the aerial")
place(chime(1.0, 660), 46.94, 0.6, "pulse", "fleet settles, resolving chime")
place(hit(f0=440, dur=0.14), 48.5, 0.6, "pop", "wordmark lands")
place(hit(f0=480, dur=0.14), 52.3, 0.6, "pop", "tagline lands (crossfade to closing card)")
place(tick(f0=2000), 53.6, 0.5, "tick", "source credit line")
place(chime(1.8, 520), 56.1, 0.7, "pulse", "final resolve chime, fade to black")

dc.write_sfx_events(EVENTS, path=os.path.join(AUD, "sfx_events.json"))
print(f"placed {len(EVENTS)} sfx events")

wavfile.write(os.path.join(AUD, "sfx60.wav"), SR, np.stack([sfx, sfx], 1).astype(np.float32) * 0.9)

# ---------------- premix: VO + music + sfx, EQ-carved + ducked ----------------
def loadwav(p):
    _, d = wavfile.read(p)
    a = (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)
    return a if a.ndim > 1 else np.stack([a, a], 1)


mus = loadwav(os.path.join(HERE, "music_bed.wav"))
mono = mus.mean(1)
hop = int(SR * 0.2)
envv = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2)) for i in range(0, max(1, len(mono) - int(TOTAL * SR)), hop)])
wl = int(TOTAL / 0.2)
best = None
for s_ in range(0, max(1, len(envv) - wl), 3):
    m_ = envv[s_:s_ + wl].mean()
    if best is None or m_ < best[0]:
        best = (m_, s_ * 0.2)
w0 = best[1] if best else 0.0
seg_m = mus[int(w0 * SR):int(w0 * SR) + int(TOTAL * SR)].copy()
if len(seg_m) < int(TOTAL * SR):
    seg_m = np.pad(seg_m, ((0, int(TOTAL * SR) - len(seg_m)), (0, 0)))
fi, fo = int(0.8 * SR), int(2.5 * SR)
seg_m[:fi] *= np.linspace(0, 1, fi)[:, None]
seg_m[-fo:] *= np.linspace(1, 0, fo)[:, None]
wavfile.write(os.path.join(AUD, "musicseg.wav"), SR, (seg_m * 32767).astype(np.int16))
sh(["ffmpeg", "-y", "-i", os.path.join(AUD, "musicseg.wav"), "-af", "loudnorm=I=-23:TP=-5:LRA=11", "-ar", "44100",
    os.path.join(AUD, "musicnorm.wav")])

graph = (
    "[0:a]highpass=f=90,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,"
    "equalizer=f=3200:t=q:w=2:g=2.2,equalizer=f=6500:t=q:w=2.2:g=-2.5[vo];"
    "[vo]asplit=3[vout][key1][key2];"
    "[1:a]highpass=f=110,equalizer=f=2400:t=q:w=1.3:g=-3.2[mus];"
    "[mus][key1]sidechaincompress=threshold=0.035:ratio=7:attack=25:release=420[md];"
    "[2:a]highpass=f=200,equalizer=f=2400:t=q:w=1.2:g=-2[sfxb];"
    "[sfxb][key2]sidechaincompress=threshold=0.05:ratio=4:attack=10:release=200[sfxd];"
    "[vout][md][sfxd]amix=inputs=3:duration=first:normalize=0[mix]"
)
r = sh(["ffmpeg", "-y",
        "-i", os.path.join(AUD, "vo60.wav"),
        "-i", os.path.join(AUD, "musicnorm.wav"),
        "-i", os.path.join(AUD, "sfx60.wav"),
        "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix60.wav")])
if r.returncode:
    print("PREMIX FAIL", r.stderr[-800:])
    sys.exit(1)
sh(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix60.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=8", "-ar", "44100",
    os.path.join(AUD, "master60.wav")])


def rms(a, b):
    r = sh(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", os.path.join(AUD, "master60.wav"), "-af", "astats", "-f",
            "null", "-"])
    mm = re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr)
    return float(mm[0]) if mm else -120


r = sh(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr)
TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
tail = rms(55.6, 57.5)
mid = rms(40, 42)
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS | tail={tail:.1f}dB (>-34) mid={mid:.1f}dB")
print("PASS" if (tail > -34 and I and -15.5 < float(I[-1]) < -12.5) else "CHECK")

# music_status.json so quality_gate's MUSIC check confirms a REAL sourced track (not synth)
credit = json.load(open(os.path.join(HERE, "music_credit.json")))
json.dump({"source": "sourced", "path": os.path.join(HERE, "music_bed.wav"), "credit": credit.get("credit", "")},
          open(os.path.join(AUD, "music_status.json"), "w"))
print("wrote music_status.json, sfx_events.json, master60.wav")
