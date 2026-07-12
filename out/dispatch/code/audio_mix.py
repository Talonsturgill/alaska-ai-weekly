"""audio_mix.py — 'THE FAKE THAT SWAM' 60s mix: edge-tts VO + sourced music ("Reawakening",
Kevin MacLeod, CC BY 4.0) + motivated SFX, EQ-carved/ducked VO, a real pre-payoff SILENCE dip at
35.4s, two-pass loudnorm to -14 LUFS. Emits audio/sfx_events.json + audio/music_status.json so the
quality gate can verify the picture is sonified and the track is real (not synth).

Writes to BOTH the skill audio dir and out/dispatch/audio (master60.wav + sfx60.wav + jsons).
"""
import os, sys, json, re, subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SKILL = os.path.join(ROOT, ".claude", "skills", "alaska-dispatch")
sys.path.insert(0, SKILL)
import dispatch_core as dc
AUD = os.path.join(ROOT, "out", "dispatch", "audio")
SKILL_AUD = os.path.join(SKILL, "audio")
MUSIC = os.path.join(ROOT, "out", "dispatch", "music_bed.wav")
SR = 44100
TOTAL = 60.0
N = int(TOTAL * SR)

def sh(c):
    return subprocess.run(c, capture_output=True, text=True)

def t(dr):
    return np.linspace(0, dr, int(SR * dr), endpoint=False)

def lp(x, fc, o=4):
    return sosfilt(butter(o, fc / (SR / 2), "low", output="sos"), x)

def bp(x, a, b, o=4):
    return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], "band", output="sos"), x)

rng = np.random.default_rng(20260712)
sfx = np.zeros(N, np.float32)
EVENTS = []

def place(sig, at_s, gain=1.0, kind="hit", label=""):
    s = int(at_s * SR); e = min(N, s + len(sig))
    if s < N:
        sfx[s:e] += sig[: e - s] * gain
    EVENTS.append({"t": round(at_s, 3), "kind": kind, "label": label})

def hit(dur=0.22, f0=180, decay=6):
    tt = t(dur); sig = np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * decay)
    sig += 0.5 * np.sin(2 * np.pi * f0 * 2.01 * tt) * np.exp(-tt * decay * 1.3)
    return lp(sig, 900).astype(np.float32)

def boom(dur=0.55, f0=70, decay=3.2):
    tt = t(dur); sig = np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * decay)
    sig += 0.3 * rng.standard_normal(len(tt)) * np.exp(-tt * decay * 2.5)
    return lp(sig, 400).astype(np.float32)

def tick(dur=0.05, f0=2400):
    tt = t(dur); sig = np.sin(2 * np.pi * f0 * tt) * np.exp(-tt / (dur * 0.22))
    return bp(sig, 800, 6000).astype(np.float32)

def whoosh(dur=0.42, rising=True):
    tt = t(dur); n = rng.standard_normal(len(tt))
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
    tt = t(dur); freq = np.linspace(f0, f1, len(tt))
    sig = np.sin(2 * np.pi * np.cumsum(freq) / SR)
    env = np.linspace(0.1, 1.0, len(tt)) ** 1.4
    return (sig * env * 0.5).astype(np.float32)

def chime(dur=1.4, f0=760):
    tt = t(dur); sig = np.zeros(len(tt), np.float32)
    for k, ratio in enumerate([1.0, 2.01, 3.0]):
        sig += (0.5 / (k + 1)) * np.sin(2 * np.pi * f0 * ratio * tt)
    return (sig * np.exp(-tt * 2.2)).astype(np.float32)

def swell(dur=2.6, f0=90):
    tt = t(dur); sig = np.sin(2 * np.pi * f0 * tt) * (0.4 + 0.3 * np.sin(2 * np.pi * 0.6 * tt))
    env = np.sin(np.pi * np.linspace(0, 1, len(tt))) ** 0.8
    return (lp(sig, 300) * env * 0.7).astype(np.float32)

# ---- place events, aligned to the VO segment times + beat sfx (>=1 per shot) ----
# S1
place(swell(), 0.3, 0.8, "ambient", "sub-aqua swell, the real tank")
place(tick(f0=1600), 3.97, 0.7, "tick", "red feed-frame snaps in")
place(swell(2.0, 70), 6.5, 0.5, "ambient", "false open-water wash rises")
# S2
place(whoosh(0.45), 10.21, 1.0, "whoosh", "phone rises into frame")
place(chime(0.7, 900), 10.7, 0.5, "pulse", "screen boot chime")
for i, tt_ in enumerate([13.6, 14.1, 14.6, 15.1, 15.6]):
    place(tick(f0=1500 + i * 260), tt_, 0.7, "tick", f"view-counter climbs {i+1}")
place(hit(f0=300, dur=0.16), 18.9, 0.6, "lock", "counter locks near six million")
# S3
place(riser(1.0, 200, 900), 20.88, 0.7, "pulse", "detector scan pulse")
place(hit(f0=520, dur=0.12), 22.6, 0.6, "tick", "detector settles 82.6% likely")
place(whoosh(0.5, rising=False), 24.43, 0.9, "whoosh", "morph into the fabrication")
place(riser(2.0, 180, 1200), 28.3, 0.8, "riser", "pixels peeling, tension builds")
# --- the pre-payoff SILENCE (34.56-36.56 VO gap): no sfx here; music notched below ---
# S4
place(boom(0.5, 80), 37.3, 0.9, "boom", "THIS NEVER HAPPENED stamp lands")
place(hit(f0=170, dur=0.2), 37.5, 0.6, "hit", "stamp settle")
place(whoosh(0.5, rising=False), 40.5, 0.7, "whoosh", "the account is pulled, panel power-down")
place(tick(f0=900, dur=0.08), 43.8, 0.6, "tick", "the fake line races ahead of proof")
# S5
place(chime(1.4, 680), 47.31, 0.7, "pulse", "restored tank, warm resolve")
place(swell(2.4, 80), 48.0, 0.4, "ambient", "the water-room returns")
place(chime(1.8, 560), 55.6, 0.7, "pulse", "final resolve, fade to signoff")

for AD in (AUD, SKILL_AUD):
    os.makedirs(AD, exist_ok=True)
    dc.write_sfx_events(EVENTS, path=os.path.join(AD, "sfx_events.json"))
print(f"placed {len(EVENTS)} sfx events")
wavfile.write(os.path.join(AUD, "sfx60.wav"), SR, (np.stack([sfx, sfx], 1) * 0.9).astype(np.float32))

# ---- music: choose a 60s window, fade, and NOTCH a real silence at 34.5-36.5 (pre-payoff breath) ----
def loadwav(p):
    _, d = wavfile.read(p)
    a = (d.astype(np.float32) / 32768.0) if d.dtype == np.int16 else d.astype(np.float32)
    return a if a.ndim > 1 else np.stack([a, a], 1)

mus = loadwav(MUSIC)
# pick the quietest 60s window (avoid starting on a peak)
mono = mus.mean(1); hop = int(SR * 0.5)
env = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2) + 1e-9) for i in range(0, max(1, len(mono) - N), hop)])
wl = int(TOTAL / 0.5); best = None
for s_ in range(0, max(1, len(env) - wl), 2):
    m_ = env[s_:s_ + wl].mean()
    if best is None or m_ < best[0]:
        best = (m_, s_ * 0.5)
w0 = best[1] if best else 0.0
seg = mus[int(w0 * SR):int(w0 * SR) + N].copy()
if len(seg) < N:
    seg = np.pad(seg, ((0, N - len(seg)), (0, 0)))
fi, fo = int(1.2 * SR), int(3.0 * SR)
seg[:fi] *= np.linspace(0, 1, fi)[:, None]
seg[-fo:] *= np.linspace(1, 0, fo)[:, None]
# the silence dip: smooth notch to ~0.10 across 34.5-36.5s (the breath before the correction)
gain = np.ones(N, np.float32)
d0, d1 = int(34.4 * SR), int(36.6 * SR); cN = d1 - d0
notch = 0.10 + 0.90 * (0.5 - 0.5 * np.cos(np.linspace(0, 2 * np.pi, cN)))  # dip to 0.10 and back
gain[d0:d1] = notch
seg *= gain[:, None]
wavfile.write(os.path.join(AUD, "musicseg.wav"), SR, (np.clip(seg, -1, 1) * 32767).astype(np.int16))
sh(["ffmpeg", "-y", "-i", os.path.join(AUD, "musicseg.wav"), "-af", "loudnorm=I=-24:TP=-6:LRA=11",
    "-ar", "44100", os.path.join(AUD, "musicnorm.wav")])

# ---- premix: VO + music + sfx, EQ-carved + VO-ducked (sidechain), then 2-pass loudnorm to -14 ----
graph = (
    "[0:a]highpass=f=90,acompressor=threshold=-20dB:ratio=3.5:attack=8:release=120,"
    "equalizer=f=3000:t=q:w=2:g=2.0,equalizer=f=6500:t=q:w=2.2:g=-2.5[vo];"
    "[vo]asplit=3[vout][key1][key2];"
    "[1:a]highpass=f=120,equalizer=f=2600:t=q:w=1.3:g=-3.0[mus];"
    "[mus][key1]sidechaincompress=threshold=0.04:ratio=8:attack=20:release=400[md];"
    "[2:a]highpass=f=180,equalizer=f=2500:t=q:w=1.2:g=-2[sfxb];"
    "[sfxb][key2]sidechaincompress=threshold=0.05:ratio=4:attack=10:release=200[sfxd];"
    "[vout][md][sfxd]amix=inputs=3:duration=first:normalize=0[mix]"
)
r = sh(["ffmpeg", "-y",
        "-i", os.path.join(AUD, "vo60.wav"),
        "-i", os.path.join(AUD, "musicnorm.wav"),
        "-i", os.path.join(AUD, "sfx60.wav"),
        "-filter_complex", graph, "-map", "[mix]", os.path.join(AUD, "mix60.wav")])
if r.returncode:
    print("PREMIX FAIL", r.stderr[-800:]); sys.exit(1)
sh(["ffmpeg", "-y", "-i", os.path.join(AUD, "mix60.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=8",
    "-ar", "44100", os.path.join(AUD, "master60.wav")])

# mirror master to the skill audio dir (encode step + gate read from out/dispatch/audio; keep both in sync)
import shutil
shutil.copy(os.path.join(AUD, "master60.wav"), os.path.join(SKILL_AUD, "master60.wav"))

def rms(a, b):
    r = sh(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", os.path.join(AUD, "master60.wav"),
            "-af", "astats", "-f", "null", "-"])
    mm = re.findall(r"RMS level dB:\s*(-?[\d.]+)", r.stderr)
    return float(mm[0]) if mm else -120

r = sh(["ffmpeg", "-i", os.path.join(AUD, "master60.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"])
I = re.findall(r"I:\s*(-?[\d.]+)\s*LUFS", r.stderr)
TP = re.findall(r"Peak:\s*(-?[\d.]+)\s*dBFS", r.stderr)
tail = rms(55.6, 57.5)
sil = rms(35.05, 35.75); nb = max(rms(32.4, 34.5), rms(36.6, 38.4))
print(f"GATE: I={I[-1] if I else '?'} LUFS TP={TP[-1] if TP else '?'} dBFS | tail={tail:.1f}dB (>-34)")
print(f"SILENCE_DIP: sil@35.4={sil:.1f}dB neighborhood={nb:.1f}dB delta={nb-sil:.1f}dB (need >=6)")

credit = json.load(open(os.path.join(ROOT, "out", "dispatch", "music_credit.json")))
for AD in (AUD, SKILL_AUD):
    json.dump({"source": "sourced", "path": MUSIC, "credit": credit.get("credit", "")},
              open(os.path.join(AD, "music_status.json"), "w"))
print("wrote master60.wav, sfx_events.json, music_status.json")
