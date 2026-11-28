#!/usr/bin/env python3
"""Prove lib Hand articulates: it acts through its wrist and fingers around a cue and is never a statue
between cues, where the hand every episode hand-drew (Ep1128's CheckHand) only translated.

Machine pass 2026-11-28 (queue lib-hand-asset, repeat 1, and the 11-26 doctor's hand). Motion was the
lowest axis on 33 of 39 judge cards from 11-15 to 11-28. On 11-28 seat 1 named the cause: both
CheckHands "are flat single-tone polygons that translate rigidly, with no wrist or finger articulation
and no anticipation, press, recoil or settle". A press drawn as translate + squash of one silhouette
moves pixels, so a plain frame difference calls it motion; what a judge sees is that nothing BENDS.

So this measures two things on HandLook (src/HandLook.tsx), rendered through scripts/held_beat_probe.cjs
(the held_beat_check --source Chrome path), inside the hand's own box:

  ARTICULATION  for each frame pair across the strike (anticipation, strike, press, recoil), the share
                of the box that still differs after the best RIGID shift of one frame onto the other
                (searched over +-40 px). A rigid press leaves almost nothing; a wrist turn and a finger
                curl leave the parts that bent. Median over the pairs, lib Hand against the shipped
                CheckHand driven the way Ep1128 drives it (press 1 for six frames from the cue).
  HOLD          the plain change across a seven-frame strip well after the cue's settle, live hand
                against the same hand at gain 0.

PASS needs the Hand's articulation at least ART_FLOOR percent and ART_RATIO times the legacy hand's,
and its hold at least HOLD_FLOOR percent and HOLD_RATIO times the frozen hand. Calibration is in the
constants' comment, measured on this stand on 2026-11-28.

    python3 scripts/hand_check.py      # exit 0 PASS, 1 FAIL, 2 could not render
"""
import json
import os
import statistics
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
SOURCE = os.path.join(REPO, "video-engine", "src", "HandLook.tsx")
CUE = 60                                    # HAND_LOOK_CUE
STRIKE_PAIRS = [(48, 54), (54, 58), (58, 61), (61, 64), (64, 70), (70, 78)]
HOLD_WINDOWS = [110, 150, 190, 230, 270]
BOX = (300, 560, 860, 1460)                 # HAND_BOX: the hand at 520,1300, s 1.6, sleeve up-right
SHIFT = 40
# Calibration, measured on this stand 2026-11-28: lib Hand articulation 6.1 (pairs 2.6 to 12.2), the
# shipped CheckHand 0.78 (its press onset and release squash read 3.7 and 3.9, everything else under 1);
# Hand hold 3.2 against 0.0 frozen. The floors sit well above the rigid hand and under the live one.
ART_FLOOR, ART_RATIO, HOLD_FLOOR, HOLD_RATIO = 4.0, 3.0, 2.0, 3.0


def crop(img):
    import numpy as np
    return np.asarray(img.convert("L").crop(BOX), dtype=np.int16)


def residual(a, b):
    """percent of the box still different (>12/255) after the best rigid integer shift of b onto a"""
    import numpy as np
    ds = 2
    sa, sb = a[::ds, ::ds], b[::ds, ::ds]
    h, w = sa.shape
    m = SHIFT // ds
    best = None
    for dy in range(-m, m + 1):
        for dx in range(-m, m + 1):
            ya, yb = max(0, dy), max(0, -dy)
            xa, xb = max(0, dx), max(0, -dx)
            pa = sa[ya:h - yb, xa:w - xb]
            pb = sb[yb:h - ya, xb:w - xa]
            v = float((np.abs(pa - pb) > 12).mean())
            if best is None or v < best[0]:
                best = (v, dy * ds, dx * ds)
    # refine at full resolution around the coarse best
    _, by, bx = best
    h, w = a.shape
    out = best[0]
    for dy in range(by - ds, by + ds + 1):
        for dx in range(bx - ds, bx + ds + 1):
            ya, yb = max(0, dy), max(0, -dy)
            xa, xb = max(0, dx), max(0, -dx)
            pa = a[ya:h - yb, xa:w - xb]
            pb = b[yb:h - ya, xb:w - xa]
            out = min(out, float((np.abs(pa - pb) > 12).mean()))
    return out * 100.0


def plain(a, b):
    import numpy as np
    return float((np.abs(a - b) > 12).mean() * 100.0)


def render(rig, frames, tmp):
    from PIL import Image
    props = os.path.join(tmp, f"{rig}.json")
    with open(props, "w") as fh:
        json.dump({"rig": rig, "mark": False, "scenes": [{"from": 0, "dur": 300}]}, fh)
    opts = os.path.join(tmp, f"{rig}_o.json")
    with open(opts, "w") as fh:
        json.dump({"source": SOURCE, "props": props, "component": "HandLook", "frames": sorted(set(frames))}, fh)
    out = os.path.join(tmp, rig)
    r = subprocess.run(["node", os.path.join(REPO, "scripts", "held_beat_probe.cjs"), opts, out],
                       cwd=REPO, capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise RuntimeError(f"probe failed for {rig}:\n" + (r.stderr or r.stdout)[-1500:])
    return {f: crop(Image.open(os.path.join(out, f"f{f:05d}.png")).convert("RGB")) for f in set(frames)}


def main():
    strike_frames = [f for p in STRIKE_PAIRS for f in p]
    hold_frames = [f for w in HOLD_WINDOWS for f in (w, w + 7)]
    try:
        with tempfile.TemporaryDirectory(prefix="hand-check-") as tmp:
            hand = render("hand", strike_frames + hold_frames, tmp)
            legacy = render("legacy", strike_frames, tmp)
            frozen = render("frozen", hold_frames, tmp)
    except (RuntimeError, OSError) as exc:
        print(f"hand_check: could not render: {exc}")
        return 2
    art_h = [residual(hand[a], hand[b]) for a, b in STRIKE_PAIRS]
    art_l = [residual(legacy[a], legacy[b]) for a, b in STRIKE_PAIRS]
    hold_h = [plain(hand[w], hand[w + 7]) for w in HOLD_WINDOWS]
    hold_z = [plain(frozen[w], frozen[w + 7]) for w in HOLD_WINDOWS]
    ah, al = statistics.median(art_h), statistics.median(art_l)
    hh, hz = statistics.median(hold_h), statistics.median(hold_z)
    print(f"  articulation  Hand {ah:5.2f}% (pairs {', '.join(f'{v:.1f}' for v in art_h)})")
    print(f"  articulation  CheckHand as shipped {al:5.2f}% (pairs {', '.join(f'{v:.1f}' for v in art_l)})")
    print(f"  hold          Hand {hh:5.2f}% (strips {', '.join(f'{v:.1f}' for v in hold_h)}), frozen {hz:.2f}%")
    fails = []
    if ah < ART_FLOOR:
        fails.append(f"the strike leaves {ah:.2f}% of the box bent after a rigid shift, under {ART_FLOOR}")
    if ah < ART_RATIO * max(al, 0.2):
        fails.append(f"the strike's articulation {ah:.2f}% is not {ART_RATIO}x the rigid CheckHand's {al:.2f}%")
    if hh < HOLD_FLOOR:
        fails.append(f"a held hand changes {hh:.2f}% of its box between cues, under {HOLD_FLOOR}")
    if hh < HOLD_RATIO * max(hz, 0.2):
        fails.append(f"a held hand {hh:.2f}% is not {HOLD_RATIO}x the frozen hand {hz:.2f}%")
    if fails:
        print("FAIL [hand] " + "; ".join(fails))
        return 1
    print(f"PASS [hand] the strike bends {ah:.1f}% of the box past a rigid shift ({ah / max(al, 0.2):.1f}x "
          f"the shipped CheckHand), a held hand moves {hh:.1f}% between cues")
    return 0


if __name__ == "__main__":
    sys.exit(main())
