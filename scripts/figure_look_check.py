#!/usr/bin/env python3
"""Prove lib/figureidle.tsx makes a held figure and a stamp ACT inside the strip a judge reads.

Machine pass 2026-11-09 (queue: held-figure motion, repeat 4; Motion the lowest axis on 10 of 15
judge cards from 10-28 to 11-09, 44 of 51 strips under 6 percent on 11-09, "held figures show no
weight shift", "props slide rather than act"). FigureLook draws the Person the 11-06 and 11-09
films hand-rolled (breath, a sine nod) and a stamp easing into place ('bare'), or the same two
drawings in <IdleFigure cues> and <StrikeProp> ('rig'). This renders frame 1 and frame 8 of the
strip build_evidence would cut on each cue (it starts 0.13 s, four frames, before the beat) through
scripts/held_beat_probe.cjs, the Chrome path held_beat_check --source uses, and measures the
camera-solved whole-frame change (held_beat_check.solved_change), drawing one subject at a time so
each number is on the panel's own whole-frame scale (a crop would not do: the solve would read the
figure's own shift as camera, and the caption-band mask is placed in whole-frame proportions).

The figure covers about 3 percent of the frame and the stamp about 1, which bounds what either can
add. PASS needs, as medians over the five cues: the rigged figure at least 2.5x the bare figure and
at least 0.75 points over it (a quarter of its own area moving on the beat; measured 1.0), and the struck stamp at
least 1.5x the sliding stamp.

    python3 scripts/figure_look_check.py      # exit 0 PASS, 1 FAIL, 2 could not render
"""
import json
import os
import statistics
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
sys.path.insert(0, os.path.join(REPO, "scripts"))
SOURCE = os.path.join(REPO, "video-engine", "src", "FigureLook.tsx")
CUES = [30, 75, 120, 165, 210]
FIG_RATIO, FIG_LIFT, STAMP_RATIO = 2.5, 0.75, 1.5


def measure(mode, subject, tmp):
    from PIL import Image
    from held_beat_check import solved_change
    tag = f"{mode}_{subject}"
    props = os.path.join(tmp, f"{tag}.json")
    with open(props, "w") as fh:
        json.dump({"mode": mode, "subject": subject, "scenes": [{"from": 0, "dur": 240}]}, fh)
    windows = [c - 4 for c in CUES]
    opts = os.path.join(tmp, f"{tag}_o.json")
    with open(opts, "w") as fh:
        json.dump({"source": SOURCE, "props": props, "component": "FigureLook",
                   "frames": sorted({f for w in windows for f in (w, w + 7)})}, fh)
    out = os.path.join(tmp, tag)
    r = subprocess.run(["node", os.path.join(REPO, "scripts", "held_beat_probe.cjs"), opts, out],
                       cwd=REPO, capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise RuntimeError(f"probe failed for {mode}:\n" + (r.stderr or r.stdout)[-1500:])
    vals = []
    for w in windows:
        a = Image.open(os.path.join(out, f"f{w:05d}.png")).convert("RGB")
        b = Image.open(os.path.join(out, f"f{w + 7:05d}.png")).convert("RGB")
        vals.append(solved_change(a, b)[0])
    return statistics.median(vals)


def main():
    try:
        with tempfile.TemporaryDirectory(prefix="figure-look-") as tmp:
            bare = (measure("bare", "figure", tmp), measure("bare", "stamp", tmp))
            rig = (measure("rig", "figure", tmp), measure("rig", "stamp", tmp))
    except (RuntimeError, OSError) as exc:
        print(f"figure_look_check: could not render: {exc}")
        return 2
    print(f"  figure  bare {bare[0]:5.2f}%  rig {rig[0]:5.2f}%  (whole frame, camera solved out, strip on the cue)")
    print(f"  stamp   bare {bare[1]:5.2f}%  rig {rig[1]:5.2f}%")
    fails = []
    if rig[0] - bare[0] < FIG_LIFT:
        fails.append(f"rigged figure adds {rig[0] - bare[0]:.2f} points, under {FIG_LIFT}")
    if rig[0] < FIG_RATIO * max(bare[0], 0.1):
        fails.append(f"rigged figure {rig[0]:.2f}% is not {FIG_RATIO}x the bare {bare[0]:.2f}%")
    if rig[1] < STAMP_RATIO * max(bare[1], 0.1):
        fails.append(f"struck stamp {rig[1]:.2f}% is not {STAMP_RATIO}x the sliding {bare[1]:.2f}%")
    if fails:
        print("FAIL [figure_look] " + "; ".join(fails))
        return 1
    print(f"PASS [figure_look] figure {rig[0] / max(bare[0], 0.1):.1f}x, stamp {rig[1] / max(bare[1], 0.1):.1f}x "
          "the shipped hand rigs inside the strip on the beat")
    return 0


if __name__ == "__main__":
    sys.exit(main())
