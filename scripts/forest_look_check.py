#!/usr/bin/env python3
"""Prove the forest family's beat idle makes a held troupe and thermometer ACT inside the strip.

Machine pass 2026-11-16 (Motion the lowest axis on 30 of 45 judge cards in the 14 days to 11-16;
on 11-16 the panel named "S2 hero tree barely moves" and "S12 thermometer and back troupe little
breath"). lib/forest.tsx's VoteTree, Grove and Thermometer had sine idles only; they now take
`cues` and perform on the beat through lib/figureidle's figureIdle. ForestLook draws a Grove and a
Thermometer as the 11-16 film drew them ('bare', no cues) or with five cues ('rig'). This renders
frame 1 and frame 8 of the strip build_evidence would cut on each cue (four frames before the beat)
through scripts/held_beat_probe.cjs, the Chrome path held_beat_check --source uses, and measures the
camera-solved whole-frame change (held_beat_check.solved_change), one subject at a time.

PASS needs, as medians over the five cues, each rigged subject at least 2x its bare self and at
least 0.4 points over it. The bare numbers are what the 11-16 film shipped.

    python3 scripts/forest_look_check.py      # exit 0 PASS, 1 FAIL, 2 could not render
"""
import json
import os
import statistics
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
sys.path.insert(0, os.path.join(REPO, "scripts"))
SOURCE = os.path.join(REPO, "video-engine", "src", "ForestLook.tsx")
CUES = [30, 75, 120, 165, 210]
RATIO, LIFT = 2.0, 0.4


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
        json.dump({"source": SOURCE, "props": props, "component": "ForestLook",
                   "frames": sorted({f for w in windows for f in (w, w + 7)})}, fh)
    out = os.path.join(tmp, tag)
    r = subprocess.run(["node", os.path.join(REPO, "scripts", "held_beat_probe.cjs"), opts, out],
                       cwd=REPO, capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise RuntimeError(f"probe failed for {tag}:\n" + (r.stderr or r.stdout)[-1500:])
    vals = []
    for w in windows:
        a = Image.open(os.path.join(out, f"f{w:05d}.png")).convert("RGB")
        b = Image.open(os.path.join(out, f"f{w + 7:05d}.png")).convert("RGB")
        vals.append(solved_change(a, b)[0])
    return statistics.median(vals)


def main():
    res = {}
    try:
        with tempfile.TemporaryDirectory(prefix="forest-look-") as tmp:
            for subject in ("grove", "thermo"):
                res[subject] = (measure("bare", subject, tmp), measure("rig", subject, tmp))
    except (RuntimeError, OSError) as exc:
        print(f"forest_look_check: could not render: {exc}")
        return 2
    fails = []
    for subject, (bare, rig) in res.items():
        print(f"  {subject:6s}  bare {bare:5.2f}%  rig {rig:5.2f}%  (whole frame, camera solved out, strip on the cue)")
        if rig - bare < LIFT:
            fails.append(f"{subject} rig adds {rig - bare:.2f} points, under {LIFT}")
        if rig < RATIO * max(bare, 0.1):
            fails.append(f"{subject} rig {rig:.2f}% is not {RATIO}x the bare {bare:.2f}%")
    if fails:
        print("FAIL [forest_look] " + "; ".join(fails))
        return 1
    print("PASS [forest_look] " + ", ".join(f"{s} {r / max(b, 0.1):.1f}x" for s, (b, r) in res.items())
          + " the 11-16 sine idles inside the strip on the beat")
    return 0


if __name__ == "__main__":
    sys.exit(main())
