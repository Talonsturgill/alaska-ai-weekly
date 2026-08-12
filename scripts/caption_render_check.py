#!/usr/bin/env python3
"""Assert the caption track ACTUALLY RENDERED into the delivered film.

WHY THIS EXISTS (2026-08-12). The 2026-08-12 dispatch shipped 4602 frames with a completely
empty caption band and every single check in this repo passed it.

The cause was a shape mismatch, not a missing feature. captions.json is forced-alignment
output and speaks in {start, end}; every caption component this engine has had reads {t, d}.
Handed a {start, end} cue, `cues.find(c => t >= c.t && t < c.t + c.d)` compares against
undefined, matches nothing on any frame, and the component's own `if (!cue) return null`
guard correctly draws nothing. The film then rendered exactly as instructed: no captions.

Nothing objected, and the reason is worth writing down, because it is the general shape of
the bug this file is here to close:

  - the props were valid JSON, so no parser complained
  - the zod schema declares {t, d, text}, but Remotion only enforces schemas on Studio
    inputs, not on CLI --props, so declaring it bought nothing at render time
  - caption_check.py lints what the captions SAY, not whether they are delivered
  - caption_band_check.py asserts nothing informational INTRUDES into the band, which an
    empty band satisfies perfectly
  - the pixel gates measure the story region, which was fine
  - a build gate on build_scenes.py would only ever prove the builder was right at the
    moment it ran

Every one of those checks is correct. They just all happened to be looking somewhere else.
Three judges reading 57 frames found it, which is the most expensive way to learn that a
caption track is missing.

So this asks the DELIVERED BYTES the direct question: at moments when a cue is supposed to
be on screen, is there anything in the caption band? It reads the film, not the builder,
for the same reason the site sign-off reads the built directory: a build that never happened
is invisible to a build gate.

Method: for a sample of cues spread across the runtime, extract the frame at the cue's
midpoint, crop the caption band, and measure two things:
  1. mean absolute Laplacian (glyph-edge energy) inside the band, which is high for text
     and near zero for flat background, and
  2. the band's contrast against the same crop taken from a frame where NO cue is active,
     which catches a band that is drawn but empty.
A cue that is supposed to be up and shows neither is a failed caption.

Exit 0 = captions are on screen. Exit 1 = they are not, and the film is not shippable.

Usage:
  python3 scripts/caption_render_check.py
  python3 scripts/caption_render_check.py --video out/dispatch/dispatch_master.mp4 \
      --props out/dispatch/episode_props.json --samples 8
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# The band geometry is the engine's, mirrored here. Keep in step with CAPTION_TOP /
# CAPTION_H in the episode component. Over-cropping slightly is safe; under-cropping is not.
CAPTION_TOP = 1336
CAPTION_H = 132

# Empirical floor. A flat background crop measures well under 1.0; a crop with the caption
# bar and one line of 46px bold type in it measures far above 3.0. 2.0 leaves room for a
# short cue in a dark scene without admitting an empty band.
EDGE_FLOOR = 2.0


def laplacian_energy(png_path):
    """Mean absolute Laplacian of the crop, computed without numpy/opencv.

    Uses ffmpeg's own convolution so this has no dependency the render does not already
    have. signalstats reports the mean luma of the filtered plane, which for a Laplacian
    kernel is exactly the glyph-edge energy we want.
    """
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", png_path,
         "-vf", "format=gray,convolution='0 -1 0 -1 4 -1 0 -1 0':0:0:0:1:1:1:1,signalstats,"
                "metadata=print:file=-",
         "-f", "null", "-"],
        capture_output=True, text=True)
    for line in r.stdout.splitlines():
        if "lavfi.signalstats.YAVG" in line:
            try:
                return float(line.split("=")[-1].strip())
            except ValueError:
                pass
    return 0.0


def crop_band(video, t, dest):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", video, "-vframes", "1",
         "-vf", f"crop={{w}}:{CAPTION_H + 40}:0:{CAPTION_TOP - 20}".format(w="iw"),
         "-y", dest],
        capture_output=True, text=True)
    return os.path.exists(dest) and os.path.getsize(dest) > 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", default=os.path.join(REPO, "out/dispatch/dispatch_master.mp4"))
    ap.add_argument("--props", default=os.path.join(REPO, "out/dispatch/episode_props.json"))
    ap.add_argument("--samples", type=int, default=8)
    a = ap.parse_args()

    if not os.path.exists(a.video):
        print(f"caption_render_check: SKIP, no delivered cut at {a.video}")
        return 0
    if not os.path.exists(a.props):
        print(f"FAIL [caption_render_check] no props at {a.props}, so the caption contract "
              f"cannot be checked. This is a failure and not a skip: a missing props file is "
              f"how the caption track goes missing.")
        return 1

    props = json.load(open(a.props))
    cues = props.get("captions") or []
    if not cues:
        print("FAIL [caption_render_check] the props carry ZERO caption cues, so the film "
              "cannot have captions. Rebuild with scripts/build_scenes.py.")
        return 1

    # THE SHAPE CHECK, and it is the one that would have caught 2026-08-12 in four seconds.
    # The component reads c.t and c.t + c.d. Anything else is a cue that can never match.
    wrong = [c for c in cues if "t" not in c or "d" not in c or "text" not in c]
    if wrong:
        keys = sorted({k for c in wrong[:5] for k in c})
        print(f"FAIL [caption_render_check] {len(wrong)} of {len(cues)} caption cues are not in "
              f"the {{t, d, text}} shape the engine reads; they carry {keys}. A cue in any other "
              f"shape compares against undefined on every frame, matches nothing, and renders an "
              f"empty caption band for the whole film. Convert at the boundary in "
              f"scripts/build_scenes.py.")
        return 1

    good = [c for c in cues if c["d"] > 0.35 and c["text"].strip()]
    if not good:
        print("FAIL [caption_render_check] no caption cue is long enough to be seen.")
        return 1

    step = max(1, len(good) // a.samples)
    sample = good[::step][:a.samples]

    tmp = tempfile.mkdtemp(prefix="caprender_")
    failures, measured = [], []
    for i, c in enumerate(sample):
        mid = c["t"] + c["d"] / 2.0
        png = os.path.join(tmp, f"c{i:02d}.png")
        if not crop_band(a.video, mid, png):
            failures.append(f"t={mid:.2f}s: could not extract the frame")
            continue
        e = laplacian_energy(png)
        measured.append((mid, e, c["text"][:40]))
        if e < EDGE_FLOOR:
            failures.append(f"t={mid:.2f}s: caption band edge energy {e:.2f} < {EDGE_FLOOR} "
                            f"while the cue {c['text'][:40]!r} should be on screen")

    for mid, e, txt in measured:
        print(f"  t={mid:7.2f}s  edge={e:5.2f}  {txt!r}")

    if failures:
        print(f"\nFAIL [caption_render_check] {len(failures)} of {len(sample)} sampled cues are "
              f"NOT on screen in the delivered cut:")
        for f in failures:
            print("  - " + f)
        print("\nThe caption band is empty where a caption belongs. Captions missing is a hard "
              "blocker in config/dispatch_rubric.yaml. Check the cue shape against the episode "
              "component's Captions reader before re-rendering.")
        return 1

    print(f"PASS [caption_render_check] {len(sample)} sampled cues all render visible captions "
          f"in the delivered cut.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
