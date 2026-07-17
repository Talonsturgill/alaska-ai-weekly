"""Build the VO for Dispatch 2026-07-17 "It's Digging For Its Own Parts" in the
owner's CLONED voice through the QC pipeline (vo_qc.synth_qc — the ONLY approved
synthesis path per config/voices.yaml, standing recipe 2026-07-15).

Synthesizes WHOLE SENTENCES (never fragments — fragment synthesis caused the
2026-07-14 accent drift), lays them on a 60s timeline near the beats they cover,
never time-stretches, and writes:
  audio/vo60.wav          float32->int16 stereo, -1.5 dBTP-ish headroom
  audio/timing60.json     {starts, speech_end, total, fps}
  audio/vo_qc_report.json per-line {similarity, wer, attempts, warning} for the Gmail draft

Run with the voice venv:
  .venv-voice/bin/python .claude/skills/alaska-dispatch/vo_build_minerals.py
"""
import os, sys, json
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import vo_qc  # synth_qc; QC dials cfg_weight 0.5 (never lower), WER<=0.15, SIM_FLOOR 0.92
from vo_backends import normalize_for_tts, SR  # 44100

REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
AUD = os.path.join(REPO, "out", "dispatch", "audio")
os.makedirs(AUD, exist_ok=True)
TOTAL = 60.0
GAP = 0.22  # min gap between sentences when one runs long

# WHOLE SENTENCES (never fragments). Numbers already spelled phonetically for the synth;
# rendered as NUMERALS on screen via the captions. Target start = where this sentence's
# first beat sits (None = "immediately after the previous sentence").
LINES = [
    ("An AI system is digging into Alaska's ground, hunting for the metals it is built from.", 0.5),
    ("The University of Alaska Fairbanks won fifteen million dollars from the National Science Foundation.", 8.0),
    ("One of twelve engines picked across twenty states, aimed at Alaska's bedrock.", 16.0),
    ("Fifty six of sixty critical minerals sit here: cobalt, graphite, gallium, nickel, rare earths.", 24.0),
    ("Crack one open, and inside is the same chip the machine needs to keep thinking.", 32.0),
    ("It is mining itself.", None),
    ("Up to one hundred sixty million dollars is possible over ten years.", 40.0),
    ("That part is not funded yet. Only fifteen million is real.", 44.0),
    ("Geologists still have to swing the pick.", 48.0),
    ("Alaska found the flashlight. It has not found the minerals yet.", 52.0),
]

buf = np.zeros(int((TOTAL + 40) * SR), np.float32)  # headroom; we measure the real length
starts, reports = [], []
cursor = 0.0
for i, (line, target) in enumerate(LINES):
    audio, rep = vo_qc.synth_qc(line)
    audio = np.asarray(audio, np.float32)
    t = (cursor + GAP) if target is None else max(float(target), cursor + (GAP if i else 0.0))
    s = int(t * SR)
    if s >= len(buf):
        print(f"line {i:02d} OVERFLOW at t={t:.2f}s; stopping")
        break
    e = min(s + len(audio), len(buf))
    buf[s:e] += audio[: e - s]
    starts.append(round(t, 3))
    cursor = t + len(audio) / SR
    reports.append({
        "i": i, "t": round(t, 2), "dur": round(len(audio) / SR, 2),
        "text": line,
        "similarity": round(float(rep.get("similarity", 0.0)), 4),
        "wer": round(float(rep.get("wer", 0.0)), 4),
        "attempts": int(rep.get("attempts", 0)),
        "warning": rep.get("warning", ""),
    })
    print(f"line {i:02d} t={t:5.2f} +{len(audio)/SR:4.2f}s sim={rep.get('similarity'):.4f} "
          f"wer={rep.get('wer'):.3f} att={rep.get('attempts')}  {normalize_for_tts(line)[:56]}")

speech_end = cursor
print(f"\nTOTAL VO DURATION: {speech_end:.2f}s (target <= 59s)")
if speech_end > 59.0:
    print(f"  WARNING: VO runs {speech_end-59.0:.1f}s long — TRIM THE SCRIPT and re-synth (never time-stretch).")

buf = buf[: int((speech_end + 0.5) * SR)]
peak = float(np.max(np.abs(buf))) + 1e-9
buf = buf / peak * (10 ** (-1.5 / 20))  # ~-1.5 dBTP headroom before the mix
stereo = np.stack([buf, buf], 1)
wavfile.write(os.path.join(AUD, "vo60.wav"), SR, (stereo * 32767).astype(np.int16))
json.dump({"starts": starts, "speech_end": round(speech_end, 2), "total": TOTAL, "fps": 30},
          open(os.path.join(AUD, "timing60.json"), "w"), indent=2)
json.dump({"voice": "cloned:talon (chatterbox, vo_qc QC pipeline)",
           "sim_floor": vo_qc.SIM_FLOOR, "wer_max": vo_qc.WER_MAX, "lines": reports},
          open(os.path.join(AUD, "vo_qc_report.json"), "w"), indent=2)
mn = min((r["similarity"] for r in reports), default=0.0)
print(f"WROTE vo60.wav  speech_end={speech_end:.2f}s  min_similarity={mn:.4f}  lines={len(reports)}")
