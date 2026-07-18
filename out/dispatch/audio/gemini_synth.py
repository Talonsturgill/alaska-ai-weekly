#!/usr/bin/env python3
"""Synthesize all 13 VO lines via Gemini TTS (preset Charon narrator) into the
recovered/ source dir that build_timeline.py reads from. Replaces the cloned
Chatterbox takes (owner's call: use Gemini). Requires GEMINI_API_KEY in env
(pass the working, billing-enabled key) -- vo_gemini reads it.

AIDEA is fed to the TTS as a phonetic respelling only; the on-screen text and
caption alignment source (vo_script.json) keep the real spelling "AIDEA".
"""
import os, sys, json
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / ".claude/skills/alaska-dispatch"))

import numpy as np
from scipy.io import wavfile
import vo_gemini
from vo_gemini import SR

OUT = REPO / "out" / "dispatch"
script = json.load(open(OUT / "vo_script.json"))["lines"]
srcdir = OUT / "audio" / "recovered"
srcdir.mkdir(parents=True, exist_ok=True)


def tts_text(t: str) -> str:
    # "AIDEA" as a bare word gets mispronounced; respell phonetically for the TTS input only
    return t.replace("AIDEA", "eye-DEE-uh")


for i, line in enumerate(script):
    audio = vo_gemini.synth(tts_text(line))
    dur = len(audio) / SR
    wavfile.write(srcdir / f"line_{i:02d}.wav", SR, (np.clip(audio, -1, 1) * 32767).astype(np.int16))
    print(f"line {i:2d}: {dur:5.2f}s  {line[:46]!r}", flush=True)

print("ALL 13 LINES SYNTHESIZED via Gemini")
