#!/usr/bin/env python3
"""Build out/dispatch/vo_lines.json (idx/start/end on the assembled timeline) and
out/dispatch/audio/vo.wav from the CORRECT per-line source wavs.

2026-07-18 REWRITE: the original version aliased its 0-indexed destination
filenames ("vo_line_00.wav".."vo_line_12.wav") with the 1-indexed source
filenames ("vo_line_01.wav".."vo_line_13.wav") -- e.g. dst for idx=1 and src for
orig_id=1 were BOTH "vo_line_01.wav". A single run was safe (each src byte was
read before its slot got overwritten later in the same loop), but re-running the
script a second time read already-shifted files as "sources", silently shifting
every line's audio by one slot in the final mix (confirmed by transcript: line 0's
timeline slot played line 2's speech). Fix: sources now live in a permanently
separate directory (out/dispatch/audio/recovered/) that destinations never touch,
so the script is idempotent no matter how many times it runs.
"""
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent  # out/dispatch -- dispatch_captions.py and dispatch_mix_*.py read vo_lines.json from here
SRC_DIR = HERE / "recovered"
GAP = 0.4  # seconds of silence between lines (tightened for a natural, non-draggy pace)
# a real pre-button breath: line 13 ("Nobody's said yes... no where it counts.") is the button.
# The standard 0.5s inter-line gap is immediately filled by the next line's speech, so the
# music-bed dip has nothing to sit in -- extend the pause before the final line so there is
# genuine silence for the dip (quality_gate.py's SILENCE_DIP check). Keyed by 0-indexed idx.
EXTRA_GAP_BEFORE = {12: 1.1}

N_LINES = 13


def wav_dur_s(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


t = 0.0
lines_out = []
for idx in range(N_LINES):
    t += EXTRA_GAP_BEFORE.get(idx, 0.0)
    src = SRC_DIR / f"line_{idx:02d}.wav"
    dur = wav_dur_s(src)
    lines_out.append({"idx": idx, "start": round(t, 3), "end": round(t + dur, 3)})
    t += dur + GAP

total = round(t, 3)
timeline_doc = json.dumps({"lines": lines_out, "total": total}, indent=2)
(OUT / "vo_lines.json").write_text(timeline_doc)
print(f"timeline: {len(lines_out)} lines, total {total:.2f}s -> {OUT / 'vo_lines.json'}")

# copy sources to the working 0-indexed names dispatch_captions.py / the mix script expect
# (safe now: SRC_DIR is never a destination, so no collision regardless of run count)
for ln in lines_out:
    src = SRC_DIR / f"line_{ln['idx']:02d}.wav"
    dst = HERE / f"vo_line_{ln['idx']:02d}.wav"
    dst.write_bytes(src.read_bytes())

# assemble vo.wav: adelay each line's wav to its start offset, amix
inputs = []
filters = []
labels = []
for j, ln in enumerate(lines_out):
    wav = SRC_DIR / f"line_{ln['idx']:02d}.wav"
    inputs += ["-i", str(wav)]
    ms = int(ln["start"] * 1000)
    lbl = f"a{j}"
    filters.append(f"[{j}:a]aformat=sample_rates=44100:channel_layouts=mono,adelay={ms}|{ms}[{lbl}]")
    labels.append(f"[{lbl}]")

filt = ";".join(filters) + ";" + "".join(labels) + f"amix=inputs={len(labels)}:normalize=0:dropout_transition=0[out]"
out_wav = HERE / "vo.wav"
cmd = ["ffmpeg", "-y", *inputs, "-filter_complex", filt, "-map", "[out]", "-ar", "44100", "-ac", "2", str(out_wav)]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    print("FFMPEG FAILED:", r.stderr[-3000:])
    raise SystemExit(1)
print(f"wrote {out_wav}")
