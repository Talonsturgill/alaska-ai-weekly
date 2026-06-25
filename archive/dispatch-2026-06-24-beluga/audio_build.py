"""
Alaska.Ai Dispatch — VO assembly.
Generates 5 per-segment mp3s with edge-tts (Ava, warm female, rate -3%),
measures each, lays them on a 30s stereo bed with a 0.5s lead-in and ~0.18s
gaps, peak-normalizes, and prints per-segment beat frames (round(start*30)).
"""
import os, subprocess, json, sys
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, "audio")
os.makedirs(AUD, exist_ok=True)

VOICE = "en-US-AvaMultilingualNeural"
RATE = "-3%"
SR = 44100
FPS = 30
LEAD_IN = 0.5
GAP = 0.18
TOTAL_S = 30.0

SEGMENTS = [
    "Cook Inlet has its own belugas. About three hundred and thirty are left.",
    "You can't watch a whale you can't see. So scientists filled the inlet with microphones.",
    "Then an A.I. learned to pull one beluga's call from a passing ship's roar.",
    "It hears them. It can't count them, and it can't make the water quiet.",
    "The counting still needs a plane and patient eyes. The sound just says, they're still here.",
]

env = dict(os.environ)
env["SSL_CERT_FILE"] = "/etc/ssl/certs/ca-certificates.crt"
env["SSL_CERT_DIR"] = "/etc/ssl/certs"

def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, env=env)

def dur(path):
    out = run(["ffprobe","-v","error","-show_entries","format=duration",
               "-of","csv=p=0", path]).stdout.strip()
    return float(out)

def load_mono(path):
    wav = os.path.splitext(path)[0] + ".wav"
    run(["ffmpeg","-y","-i",path,"-ac","1","-ar",str(SR),"-f","wav",wav])
    sr, data = wavfile.read(wav)
    if data.dtype == np.int16:
        data = data.astype(np.float32)/32768.0
    elif data.dtype == np.int32:
        data = data.astype(np.float32)/2147483648.0
    else:
        data = data.astype(np.float32)
    return data

# 1) synth + measure
durs = []
clips = []
for i, text in enumerate(SEGMENTS, 1):
    mp3 = os.path.join(AUD, f"seg{i}.mp3")
    run(["edge-tts","--voice",VOICE,f"--rate={RATE}","--text",text,"--write-media",mp3])
    d = dur(mp3)
    durs.append(d)
    clips.append(load_mono(mp3))
    print(f"seg{i}: {d:.3f}s  | {text}")

# 2) lay on timeline
N = int(TOTAL_S*SR)
buf = np.zeros(N, dtype=np.float32)
starts = []
t = LEAD_IN
beats = []
for i, clip in enumerate(clips):
    s = int(round(t*SR))
    starts.append(t)
    beats.append(round(t*FPS))
    end = min(s+len(clip), N)
    buf[s:end] += clip[:end-s]
    t += durs[i] + GAP

speech_end = t - GAP
print(f"\nlead-in {LEAD_IN}s, gap {GAP}s")
print("segment starts (s):", [round(x,3) for x in starts])
print("beat frames:", beats)
print(f"total speech end: {speech_end:.3f}s (target 26-28s)")
print(f"sum speech: {sum(durs):.3f}s")

# 3) peak normalize (final loudnorm handled in mux)
peak = np.max(np.abs(buf)) + 1e-9
buf = buf / peak * (10**(-1.5/20))  # -1.5 dBFS peak
stereo = np.stack([buf, buf], axis=1)
vo = os.path.join(AUD, "vo.wav")
wavfile.write(vo, SR, (stereo*32767).astype(np.int16))
print(f"\nwrote {vo}")

# stash beats for renderer
json.dump({"starts":starts,"beats":beats,"durs":durs,"speech_end":speech_end,
           "lead_in":LEAD_IN,"gap":GAP,"fps":FPS,"total_s":TOTAL_S},
          open(os.path.join(AUD,"timing.json"),"w"), indent=2)
print("wrote timing.json")
