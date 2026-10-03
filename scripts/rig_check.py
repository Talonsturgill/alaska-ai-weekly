#!/usr/bin/env python3
"""Measure the shared cast rig (video-engine/src/lib/Character.tsx) on its look-dev sheets.

WHY THIS EXISTS (2026-10-02 machine pass)
-----------------------------------------
Character.tsx is drawn by every registered episode, and the panel graded it below the props two
films running. A rig change is judged by eye on RigLook, and this script turns the parts of that
judgement that are measurable into a check a later pass can rerun before a rig edit reaches a film.

  finish  RigLightLook: one figure drawn facing each way with its idle frozen. The house key is at
          the screen's upper left (lighting.LIGHT), so on BOTH faces the left half of the lower face
          must be brighter than the right half. Before the 2026-10-02 finish pass the rig drew its
          shading in a space that `facing` mirrors, so a figure facing left wore its shadow toward
          the lamp (the 10-02 manager's "ghosted duplicate layer").

Usage:
  python3 scripts/rig_check.py                 # every check
  python3 scripts/rig_check.py --only finish

Exit 0 when every check passes, 1 when one fails, 2 when the stills could not be rendered.
"""
import argparse
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENGINE = os.path.join(REPO, "video-engine")

# RigLightLook (RigLook.tsx): feet at y 1500, scale 1.4, idle frozen, so the head centre is
# exactly (x, feet - 368 * scale).
FACES = [("facing +1", 300, 1), ("facing -1", 780, -1)]
FEET_Y, SCALE = 1500, 1.4
# lit half must beat the shadow half by this many 8-bit luma levels on the lower face
MIN_LIGHT_STEP = 6.0


def still(comp, frame, out_dir):
    path = os.path.join(out_dir, f"{comp}_{frame}.png")
    r = subprocess.run(["npx", "remotion", "still", "src/index.ts", comp, path, f"--frame={frame}"],
                       cwd=ENGINE, capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(path):
        sys.stderr.write(r.stdout[-1500:] + r.stderr[-1500:])
        raise RuntimeError(f"could not render {comp} at frame {frame}")
    return path


def luma(path):
    a = np.asarray(Image.open(path).convert("RGB")).astype(float)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def check_finish(tmp):
    """Both facings lit from the screen's left: compare the two halves of the lower face."""
    y = luma(still("RigLightLook", 0, tmp))
    ok = True
    for name, x, facing in FACES:
        cx, cy, r = x, FEET_Y - 368 * SCALE, 56 * SCALE
        yy, xx = np.mgrid[0:y.shape[0], 0:y.shape[1]]
        # the lower face only: cheeks and jaw, clear of the glasses, brows and hair
        disc = ((xx - cx) ** 2 + (yy - cy) ** 2 <= (0.8 * r) ** 2) & (yy >= cy + 0.12 * r)
        left = y[disc & (xx < cx - 0.12 * r)].mean()
        right = y[disc & (xx > cx + 0.12 * r)].mean()
        step = left - right
        good = step >= MIN_LIGHT_STEP
        ok &= good
        print(f"  {'OK  ' if good else 'FAIL'} finish/light  {name}: lower face left {left:.1f}, "
              f"right {right:.1f}, lit side leads by {step:+.1f} (need >= +{MIN_LIGHT_STEP:.0f}, "
              f"key at the screen's upper left)")
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["finish"], help="run one check")
    a = ap.parse_args()
    with tempfile.TemporaryDirectory(prefix="rig_check_") as tmp:
        try:
            results = []
            if a.only in (None, "finish"):
                results.append(check_finish(tmp))
        except RuntimeError as e:
            print(f"rig_check: {e}")
            return 2
    if all(results):
        print(f"rig_check: PASS ({len(results)} check(s))")
        return 0
    print("rig_check: FAIL")
    return 1


if __name__ == "__main__":
    sys.exit(main())
