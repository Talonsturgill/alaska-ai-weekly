#!/usr/bin/env python3
"""Prove lib/heldidle.tsx still gives a held prop life: render HeldPropLook and measure it.

The look draws four props bare (left) and the same four wrapped in <HeldProp> (right), with no
camera. This renders frames 0 to 149, takes the same frame-1-vs-frame-8 diff build_evidence.py
puts on every evidence strip (share of pixels moving more than 12/255), and requires the bare half
to be still and every wrapped prop to move: median at least 2.5 percent over all windows.
Machine pass 2026-10-15 (queue: held-beats-under-2pct, repeat offender).

    python3 scripts/held_prop_look_check.py      # exit 0 PASS, 1 FAIL
"""
import glob
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageChops

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
PROPS = {"box": (600, 280, 1020, 560), "plate": (600, 600, 1020, 830),
         "dials": (600, 990, 1020, 1220), "guide": (660, 1380, 960, 1620)}
BARE = (0, 0, 540, 1920)
FLOOR = 2.5


def pct(a, b, box):
    A = a.crop(box)
    h = ImageChops.difference(A, b.crop(box)).histogram()
    return 100.0 * sum(h[12:]) / (A.size[0] * A.size[1])


def main():
    with tempfile.TemporaryDirectory() as tmp:
        seq = os.path.join(tmp, "seq")
        r = subprocess.run(["npx", "--no-install", "remotion", "render", "src/index.ts", "HeldPropLook", seq,
                            "--sequence", "--image-format=png", "--frames=0-149", "--concurrency=4"],
                           cwd=os.path.join(REPO, "video-engine"), capture_output=True, text=True)
        if r.returncode:
            print("FAIL [held_prop_look] render failed:\n" + r.stderr[-1500:])
            return 1
        frames = [Image.open(p).convert("L") for p in sorted(glob.glob(os.path.join(seq, "*.png")))]
    wins = range(0, len(frames) - 7, 7)
    fails = []
    bare = max(pct(frames[s], frames[s + 7], BARE) for s in wins)
    if bare > 0.05:
        fails.append(f"the bare half moved {bare:.2f} percent, so the stand is not isolating the rig")
    for name, box in PROPS.items():
        v = sorted(pct(frames[s], frames[s + 7], box) for s in wins)
        med = v[len(v) // 2]
        print(f"  {name:6s} wrapped: median {med:4.1f}%  min {v[0]:4.1f}%  ({len(v)} windows)")
        if med < FLOOR:
            fails.append(f"{name} median {med:.1f}% is under {FLOOR}%")
    print(f"  bare half max {bare:.2f}%")
    if fails:
        print("FAIL [held_prop_look] " + "; ".join(fails))
        return 1
    print("PASS [held_prop_look] every wrapped prop moves, the bare props do not")
    return 0


if __name__ == "__main__":
    sys.exit(main())
