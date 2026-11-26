#!/usr/bin/env python3
"""Prove a lib Suit holding a gesture still moves inside the strip a judge reads, between its cues.

Machine pass 2026-11-26 (queue held-figure-no-idle, repeat 2; Motion the lowest axis on 30 of 36 judge
cards from 11-13 to 11-26, and on all three Ep1126 cards). Ep1126 S11 stood Kelly Isaacs, a lib Suit,
with her hand out from beat 40 to beat 27, and seats 1 and 3 read "one outstretched pose for all 8
filmstrip frames" at 75.1 s and 79.2 s. The Suit's cue performance (lib/figureidle) only runs about
1.7 s around each cue, and between cues the reaching hand was pinned: its point moved by pose.armR * 6
units, a fraction of a pixel per frame. So a long held gesture was a statue in every strip that did not
straddle a cue, which is most of them.

SuitHoldLook draws the Isaacs pose (s 1.2, facing -1, face off, long hair, reach 1) with its only cue
at frame 20, and this renders five eight-frame strips from frame 90 on, well clear of the cue, through
scripts/held_beat_probe.cjs (the held_beat_check --source Chrome path). It measures the share of the
figure's own box that changes by more than 12/255 from frame 1 to frame 8 of each strip (no camera in
the stand, so no solve), for the live figure and for the same figure at gain 0 (the statue).

PASS needs, as medians over the five strips: the live reaching figure at least FLOOR (5) percent of
its box and at least RATIO (3) times the frozen one, and the live standing figure (no gesture) at least
STAND_FLOOR (4), so an idle between cues is never a sub-pixel breath. Calibration, measured 2026-11-26
on this stand: the Suit as Ep1126 shipped it read 3.5 percent reaching, 3.1 frozen (its torso bob
ignored gain) and 3.0 standing, so the floors sit above the statue it was; with holdLife it reads 6.4
reaching (the hand travels about 15 px across a strip, read on the frame pair), 0.0 frozen, 5.6
standing.

    python3 scripts/suit_hold_check.py      # exit 0 PASS, 1 FAIL, 2 could not render
"""
import json
import os
import statistics
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
SOURCE = os.path.join(REPO, "video-engine", "src", "SuitHoldLook.tsx")
WINDOWS = [90, 130, 170, 210, 250]
BOX = (330, 860, 750, 1316)          # the figure at x 540, foot 1300, s 1.2, reach to the left
FLOOR, RATIO, STAND_FLOOR = 5.0, 3.0, 4.0


def box_change(a, b):
    import numpy as np
    pa = np.asarray(a.convert("L").crop(BOX), dtype=np.int16)
    pb = np.asarray(b.convert("L").crop(BOX), dtype=np.int16)
    return float((np.abs(pa - pb) > 12).mean() * 100.0)


def measure(pose, frozen, tmp):
    from PIL import Image
    tag = f"{pose}_{'frozen' if frozen else 'live'}"
    props = os.path.join(tmp, f"{tag}.json")
    with open(props, "w") as fh:
        json.dump({"pose": pose, "frozen": frozen, "scenes": [{"from": 0, "dur": 300}]}, fh)
    opts = os.path.join(tmp, f"{tag}_o.json")
    with open(opts, "w") as fh:
        json.dump({"source": SOURCE, "props": props, "component": "SuitHoldLook",
                   "frames": sorted({f for w in WINDOWS for f in (w, w + 7)})}, fh)
    out = os.path.join(tmp, tag)
    r = subprocess.run(["node", os.path.join(REPO, "scripts", "held_beat_probe.cjs"), opts, out],
                       cwd=REPO, capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise RuntimeError(f"probe failed for {tag}:\n" + (r.stderr or r.stdout)[-1500:])
    vals = []
    for w in WINDOWS:
        a = Image.open(os.path.join(out, f"f{w:05d}.png")).convert("RGB")
        b = Image.open(os.path.join(out, f"f{w + 7:05d}.png")).convert("RGB")
        vals.append(box_change(a, b))
    return statistics.median(vals), vals


def main():
    try:
        with tempfile.TemporaryDirectory(prefix="suit-hold-") as tmp:
            live, live_v = measure("reach", False, tmp)
            frozen, _ = measure("reach", True, tmp)
            stand, stand_v = measure("stand", False, tmp)
    except (RuntimeError, OSError) as exc:
        print(f"suit_hold_check: could not render: {exc}")
        return 2
    print(f"  reach live   {live:5.2f}% of the figure box (strips {', '.join(f'{v:.1f}' for v in live_v)})")
    print(f"  reach frozen {frozen:5.2f}%")
    print(f"  stand live   {stand:5.2f}% (strips {', '.join(f'{v:.1f}' for v in stand_v)})")
    fails = []
    if live < FLOOR:
        fails.append(f"a held reach moves {live:.2f}% of its box between cues, under {FLOOR}")
    if live < RATIO * max(frozen, 0.5):
        fails.append(f"a held reach {live:.2f}% is not {RATIO}x the frozen figure {frozen:.2f}%")
    if stand < STAND_FLOOR:
        fails.append(f"a standing Suit moves {stand:.2f}% of its box between cues, under {STAND_FLOOR}")
    if fails:
        print("FAIL [suit_hold] " + "; ".join(fails))
        return 1
    print(f"PASS [suit_hold] a held reach moves {live:.1f}% of its box between cues "
          f"({live / max(frozen, 0.5):.1f}x the statue), a standing Suit {stand:.1f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
