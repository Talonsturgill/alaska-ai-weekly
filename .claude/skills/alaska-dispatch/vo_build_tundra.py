"""Build the VO for Dispatch 2026-07-14 'The Claim on the Tundra' in the owner's
cloned voice. Reads out/dispatch/storyboard.json beats[].vo in order, synthesizes
each phrase via vo_backends.synth() (cloned:talon + E2 dials + auto normalization),
lays them on a 60s timeline near each beat's t (never overlapping), normalizes, and
writes audio/vo60.wav + audio/timing60.json + audio/voice_used.json.

Run with the voice venv:  .venv-voice/bin/python .claude/skills/alaska-dispatch/vo_build_tundra.py
"""
import os, sys, json
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import vo_backends as vb

REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SB = os.path.join(REPO, "out", "dispatch", "storyboard.json")
AUD = os.path.join(REPO, "out", "dispatch", "audio")
os.makedirs(AUD, exist_ok=True)
SR = vb.SR  # 44100
TOTAL = 60.0
GAP = 0.18  # min gap between phrases when one runs long

beats = json.load(open(SB))["beats"]
buf = np.zeros(int(TOTAL * SR) + SR, np.float32)
starts = []
cursor = 0.0
for i, b in enumerate(beats):
    line = b["vo"]
    a = vb.synth(line)                       # cloned voice, normalized text
    t = max(float(b["t"]), cursor + (GAP if i else 0.0))
    s = int(t * SR)
    e = min(s + len(a), len(buf))
    buf[s:e] += a[: e - s]
    starts.append(round(t, 3))
    cursor = t + len(a) / SR
    print(f"beat {i:02d} t={t:5.2f}  +{len(a)/SR:4.2f}s  {vb.normalize_for_tts(line)[:60]}")

speech_end = cursor
buf = buf[: int(TOTAL * SR)]
peak = float(np.max(np.abs(buf))) + 1e-9
buf = buf / peak * (10 ** (-1.5 / 20))       # -1.5 dBTP-ish headroom
stereo = np.stack([buf, buf], 1)
wavfile.write(os.path.join(AUD, "vo60.wav"), SR, (stereo * 32767).astype(np.int16))
json.dump({"starts": starts, "speech_end": round(speech_end, 2), "total": TOTAL, "fps": 30},
          open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
json.dump(vb.backend_report(), open(os.path.join(AUD, "voice_used.json"), "w"), indent=2)
print(f"\nWROTE vo60.wav  speech_end={speech_end:.2f}s  backend={vb.backend_report()['backend']}")
