#!/usr/bin/env python3
"""Prove lib FigureFinish lights a flat figure across its form and paints nothing outside it.

Machine pass 2026-11-11 (queue: illustration-figure-parity; "figures plainer than props" on 11-06,
11-07, 11-10 and every round of 11-11, Illustration craft 6.5 to 7.0). FigureLook draws the rigged
11-09 Person ('rig') and the same Person inside <FigureFinish> ('finish'), and a stamp-only frame
gives the background. This renders frame 100 of each through scripts/held_beat_probe.cjs (the Chrome
path the films render in) and measures, inside the figure's own silhouette:

  LIT     the share of the figure's pixels the finish changes by more than 12/255 (the rim and the
          core shade together). PASS needs at least 25 percent: a flat fill turned into a form, not
          a hairline.
  KEY     the rim lands on the key side: the mean change is brighter on the left half of the figure
          than on the right (the shade darkens the far side).
  OUTSIDE the share of pixels OUTSIDE the silhouette and above the floor that the finish changes.
          PASS needs under 0.5 percent of that area: the filter is clipped to the drawing.

    python3 scripts/figure_finish_check.py      # exit 0 PASS, 1 FAIL, 2 could not render
"""
import json
import os
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
SOURCE = os.path.join(REPO, "video-engine", "src", "FigureLook.tsx")
FRAME = 100
BOX = (60, 860, 540, 1290)            # around the Person (x 290, foot line 1300), above the floor
LIT_MIN, OUTSIDE_MAX = 0.25, 0.005


def render(mode, subject, tmp):
    from PIL import Image
    tag = f"{mode}_{subject}"
    props = os.path.join(tmp, f"{tag}.json")
    json.dump({"mode": mode, "subject": subject, "scenes": [{"from": 0, "dur": 240}]}, open(props, "w"))
    opts = os.path.join(tmp, f"{tag}_o.json")
    json.dump({"source": SOURCE, "props": props, "component": "FigureLook", "frames": [FRAME]}, open(opts, "w"))
    out = os.path.join(tmp, tag)
    r = subprocess.run(["node", os.path.join(REPO, "scripts", "held_beat_probe.cjs"), opts, out],
                       cwd=REPO, capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise RuntimeError(f"probe failed for {tag}:\n" + (r.stderr or r.stdout)[-1500:])
    return Image.open(os.path.join(out, f"f{FRAME:05d}.png")).convert("RGB").crop(BOX)


def main():
    import numpy as np
    try:
        with tempfile.TemporaryDirectory(prefix="figure-finish-") as tmp:
            bg = np.asarray(render("rig", "stamp", tmp), dtype=np.int16)
            rig = np.asarray(render("rig", "figure", tmp), dtype=np.int16)
            fin = np.asarray(render("finish", "figure", tmp), dtype=np.int16)
    except (RuntimeError, OSError) as exc:
        print(f"figure_finish_check: could not render: {exc}")
        return 2
    # Any channel, not luminance: the 11-09 Person's navy torso and the maroon wall are within 12/255
    # of each other in luminance, so a luminance mask loses the torso and counts its shade as outside.
    fig = (np.abs(rig - bg) > 12).any(axis=2)         # the figure's silhouette in the rig frame
    changed = (np.abs(fin - rig) > 12).any(axis=2)
    lit = float(changed[fig].mean())
    outside = float(changed[~fig].mean())
    cols = np.nonzero(fig.any(axis=0))[0]
    mid = (cols.min() + cols.max()) // 2
    delta = (fin - rig).astype(np.float32).mean(axis=2)
    left = float(delta[:, :mid][fig[:, :mid]].mean())
    right = float(delta[:, mid:][fig[:, mid:]].mean())
    print(f"  LIT      {lit * 100:5.1f}% of the figure's pixels changed by the finish (need {LIT_MIN * 100:.0f}%)")
    print(f"  KEY      mean change left half {left:+.1f}, right half {right:+.1f} (key light on the left)")
    print(f"  OUTSIDE  {outside * 100:5.2f}% of the area around the figure changed (need under {OUTSIDE_MAX * 100:.1f}%)")
    fails = []
    if lit < LIT_MIN:
        fails.append(f"the finish changes {lit * 100:.1f}% of the figure, under {LIT_MIN * 100:.0f}%")
    if not left > right:
        fails.append("the lit side is not the key side")
    if outside >= OUTSIDE_MAX:
        fails.append(f"the finish paints {outside * 100:.2f}% of the area outside the figure")
    if fails:
        print("FAIL [figure_finish] " + "; ".join(fails))
        return 1
    print("PASS [figure_finish] a flat figure gets a key-side rim and a far-side shade, clipped to its drawing")
    return 0


if __name__ == "__main__":
    sys.exit(main())
