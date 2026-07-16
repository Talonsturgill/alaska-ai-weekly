#!/usr/bin/env python3
"""Synthesize the Dispatch VO with edge-tts (Microsoft neural voice), per line,
capturing exact word-boundary timings for frame-accurate captions.

Owner directive (2026-07-16): do NOT use the cloned voice; use the most human
option available. edge-tts Microsoft neural (Andrew Multilingual) is that option.
Word boundaries come straight from the synth engine, so caption timings are
ground-truth, not whisper-estimated.

Outputs into out/dispatch/audio/:
  vo_line_XX.wav        per-line mono 44.1k
  vo.wav                assembled VO with beat gaps
  vo_words.json         [{word, start, end}] on the assembled timeline (seconds)
  vo_lines.json         [{idx, text, start, end}] line spans on the timeline
"""
import asyncio
import json
import os
import subprocess
import sys

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(REPO, "out", "dispatch")
AUD = os.path.join(OUT, "audio")
os.makedirs(AUD, exist_ok=True)
FFMPEG = os.environ.get("FFMPEG_BIN", "/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux")
SR = 44100
GAP = 0.42  # seconds of breath between lines


async def synth_line(text, voice, rate, mp3_path):
    words = []
    comm = edge_tts.Communicate(text, voice, rate=rate)
    with open(mp3_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # offset/duration are in 100-ns ticks
                words.append({
                    "word": chunk["text"],
                    "start": chunk["offset"] / 1e7,
                    "end": (chunk["offset"] + chunk["duration"]) / 1e7,
                })
    return words


def to_wav(mp3_path, wav_path):
    subprocess.run(
        [FFMPEG, "-y", "-i", mp3_path, "-ar", str(SR), "-ac", "1", wav_path],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def dur(wav_path):
    out = subprocess.run(
        [FFMPEG, "-i", wav_path, "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    # parse "time=00:00:03.45"
    t = 0.0
    for tok in out.split():
        if tok.startswith("time="):
            hh, mm, ss = tok[5:].split(":")
            t = int(hh) * 3600 + int(mm) * 60 + float(ss)
    return t


async def main():
    with open(os.path.join(OUT, "vo_script.json")) as f:
        spec = json.load(f)
    voice, rate = spec["voice"], spec.get("rate", "+0%")

    all_words, all_lines = [], []
    concat_inputs = []
    cursor = 0.0
    for i, text in enumerate(spec["lines"]):
        mp3 = os.path.join(AUD, f"vo_line_{i:02d}.mp3")
        wav = os.path.join(AUD, f"vo_line_{i:02d}.wav")
        words = await synth_line(text, voice, rate, mp3)
        to_wav(mp3, wav)
        d = dur(wav)
        for w in words:
            all_words.append({
                "word": w["word"],
                "start": round(cursor + w["start"], 3),
                "end": round(cursor + min(w["end"], d), 3),
            })
        all_lines.append({"idx": i, "text": text,
                          "start": round(cursor, 3), "end": round(cursor + d, 3)})
        concat_inputs.append((wav, d))
        cursor += d + GAP
        print(f"line {i}: {d:.2f}s  '{text[:48]}'")

    total = cursor - GAP
    print(f"TOTAL VO: {total:.2f}s over {len(spec['lines'])} lines")

    # assemble with silence gaps via ffmpeg filter
    silence = os.path.join(AUD, "_gap.wav")
    subprocess.run([FFMPEG, "-y", "-f", "lavfi", "-t", str(GAP),
                    "-i", f"anullsrc=r={SR}:cl=mono", silence],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    listfile = os.path.join(AUD, "_concat.txt")
    with open(listfile, "w") as f:
        for j, (wav, _) in enumerate(concat_inputs):
            f.write(f"file '{wav}'\n")
            if j < len(concat_inputs) - 1:
                f.write(f"file '{silence}'\n")
    vo = os.path.join(AUD, "vo.wav")
    subprocess.run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", listfile,
                    "-ar", str(SR), "-ac", "1", vo],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    with open(os.path.join(OUT, "vo_words.json"), "w") as f:
        json.dump(all_words, f, indent=2)
    with open(os.path.join(OUT, "vo_lines.json"), "w") as f:
        json.dump({"total": round(total, 3), "gap": GAP, "voice": voice,
                   "rate": rate, "lines": all_lines}, f, indent=2)
    print(f"wrote {vo}, vo_words.json ({len(all_words)} words), vo_lines.json")


if __name__ == "__main__":
    asyncio.run(main())
