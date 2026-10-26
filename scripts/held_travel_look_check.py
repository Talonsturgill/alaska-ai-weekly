#!/usr/bin/env python3
"""Prove HeldTravel lifts a held prop over the panel's line where HeldProp alone does not.

Machine pass 2026-10-26 (queue: held beats under 6 percent with the camera solved out, repeat 3,
named on 10-22, 10-24, 10-25 and 10-26). HeldTravelLook draws one held sheet the size of 10-26's
painted map, wrapped in HeldProp, with no camera, in four modes: 'none' (HeldProp alone) and the
three HeldTravel modes. This renders frame 1 and frame 8 of eight evenly spaced windows of each
through scripts/held_beat_probe.cjs, the Chrome path held_beat_check --source uses, and measures the
same camera-solved whole-frame change (held_beat_check.solved_change).

The prop covers about 7 percent of the frame, so the share a held beat can gain from it is bounded
by that. PASS needs, as medians over the windows: 'none' under 2 percent (the rig alone moves
edges, which is why the 10-26 beats were held), 'sweep' and 'shadow' each at least 2.0 points over
'none' (enough to lift the median 10-26 HELD beat, 4.8 percent, over 6), and 'runner' over 'none' at all.

    python3 scripts/held_travel_look_check.py      # exit 0 PASS, 1 FAIL
"""
import json
import os
import statistics
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
sys.path.insert(0, os.path.join(REPO, "scripts"))
SOURCE = os.path.join(REPO, "video-engine", "src", "HeldTravelLook.tsx")
WINDOWS = [8 + 27 * i for i in range(8)]
LIFT = 2.0


def measure(mode, tmp):
    from PIL import Image
    from held_beat_check import solved_change
    props = os.path.join(tmp, f"{mode}.json")
    with open(props, "w") as fh:
        json.dump({"mode": mode, "scenes": [{"from": 0, "dur": 240}]}, fh)
    opts = os.path.join(tmp, f"{mode}_o.json")
    frames = sorted({f for w in WINDOWS for f in (w, w + 7)})
    with open(opts, "w") as fh:
        json.dump({"source": SOURCE, "props": props, "frames": frames, "component": "HeldTravelLook"}, fh)
    out = os.path.join(tmp, mode)
    r = subprocess.run(["node", os.path.join(REPO, "scripts", "held_beat_probe.cjs"), opts, out],
                       cwd=REPO, capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise RuntimeError(f"probe failed for {mode}:\n" + r.stderr[-1500:])
    vals = []
    for w in WINDOWS:
        a = Image.open(os.path.join(out, f"f{w:05d}.png")).convert("RGB")
        b = Image.open(os.path.join(out, f"f{w + 7:05d}.png")).convert("RGB")
        vals.append(solved_change(a, b)[0])
    return statistics.median(vals), min(vals)


def main():
    res = {}
    with tempfile.TemporaryDirectory(prefix="held-travel-") as tmp:
        for mode in ("none", "sweep", "shadow", "runner"):
            res[mode] = measure(mode, tmp)
    for mode, (med, lo) in res.items():
        print(f"  {mode:7s} median {med:5.2f}%  min {lo:5.2f}%  (whole frame, camera solved out)")
    base = res["none"][0]
    fails = []
    if base >= 2.0:
        fails.append(f"HeldProp alone reads {base:.2f}%, the stand no longer isolates the travel")
    for mode in ("sweep", "shadow"):
        if res[mode][0] - base < LIFT:
            fails.append(f"{mode} lifts {res[mode][0] - base:.2f} points, under {LIFT}")
    if res["runner"][0] <= base:
        fails.append("runner adds nothing")
    if fails:
        print("FAIL [held_travel_look] " + "; ".join(fails))
        return 1
    print(f"PASS [held_travel_look] sweep +{res['sweep'][0] - base:.2f}, shadow +{res['shadow'][0] - base:.2f}, "
          f"runner +{res['runner'][0] - base:.2f} points over HeldProp alone ({base:.2f}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
