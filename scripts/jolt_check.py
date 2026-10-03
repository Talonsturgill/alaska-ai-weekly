#!/usr/bin/env python3
"""THE CAMERA DOES NOT PUNCTUATE BEATS. Measure whole-frame jolts in the delivered master.

WHY THIS EXISTS (owner, 2026-10-03). Watching "The Choosing Isn't", the owner: "every like five
seconds or something ... there's like this pulse ... the screen is shaking slightly ... It's
happening so frequently that it's just kind of overstimulating." The cause was an "impact juice"
block added to Ep1002 at Gate 0C and copied into Ep1003: every board beat kicked the WHOLE frame
with a 3 px jitter and a 2 percent zoom punch decaying over about 22 frames. Measured by this
script: 41 whole-frame jolts in the 113.7 s story of the 10-03 master, one every 2.8 s, and 49 on
the 10-02 master. The 09-06 master has none and the 09-30 master one (a sheet dissolving off
another, two layers moving against each other, which is what the budget's headroom is for).
Judges had also been asking for "a 2 to 3 frame camera shake" on impacts, so it would have spread.

The rule now: an impact lands in the OBJECT (squash, overshoot, a star, a dust puff). A whole-frame
kick is a rare accent the board asks for by name, `"kick": true` on a beat, at most KICK_MAX per
film and at least KICK_MIN_GAP_S apart. build_scenes.py calls kick_budget() and refuses a board
over budget before a frame is rendered, and writes the allowed times to episode_props.json as
`kicks` for lib/camera.ts. This script is the other half: it reads the BYTES that ship, because
an episode can shake its camera any number of ways and only the picture knows.

How it measures. Consecutive frames (half resolution, the story region above the caption card)
are registered by phase correlation. A camera move, a push or a rise moves the whole frame
smoothly in one direction. A kick jitters it, so its frame-to-frame displacement REVERSES
direction from one frame to the next. MIN_REVERSALS or more reversals between JITTER_PX and
JITTER_MAX_PX, close together and clear of the scene cuts in episode_props.json, are one jolt.
The cap and the count are measured, not guessed: without them the 09-30 master read as seven
jolts, three of them whip transitions moving 50 to 200 px a frame that settle on a spring, and
three a single mis-registered frame inside a fast pan, which reverses exactly twice.

What it does not measure. The kick's 2 percent zoom punch is the other half of the "pulse", and
it was tried here as the divergence between a top and a bottom band: 42 on the 10-03 master, but
22 on 09-30 without its cut list and 4 on 09-06 with one, so it is too noisy to fail a film on.
lib/camera.ts drives the punch and the jitter from one budgeted envelope, so a film within this
budget is within the punch budget too, unless an episode writes its own punch. Do not.

    python3 scripts/jolt_check.py                 # out/dispatch/dispatch_master.mp4
    python3 scripts/jolt_check.py --video X.mp4 --props Y.json
    python3 scripts/jolt_check.py --self-test

Exit 0 within budget, 1 over budget, 2 could not measure.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(REPO, "out", "dispatch")

KICK_MAX = 3            # whole-frame kicks a film may carry
KICK_MIN_GAP_S = 20.0   # and how far apart they must be
JITTER_PX = 0.6         # frame-to-frame displacement, half-res px (about 1.2 px at full res)
JITTER_MAX_PX = 8.0     # above this a frame is a whip, a cut or a transition, not a shake
MERGE_FRAMES = 6        # reversals this close together are one event
MIN_REVERSALS = 3       # one mis-registered frame inside a pan reverses twice, a shake many times
CUT_GUARD = 2           # frames either side of a scene cut are not measured
W, H = 540, 960
REGION = (30, 650, 20, 520)  # y0, y1, x0, x1 at half res: the story region above the captions


def kick_budget(times):
    """Seconds of the beats the board flags `"kick": true`, sorted, or SystemExit over budget."""
    times = sorted(float(t) for t in times)
    if len(times) > KICK_MAX:
        raise SystemExit(f"jolt budget: the board flags {len(times)} camera kicks, the most a film "
                         f"may carry is {KICK_MAX} (owner, 2026-10-03). Land the other impacts in the "
                         f"object (squash, overshoot, a star or a dust puff), not the camera.")
    for a, b in zip(times, times[1:]):
        if b - a < KICK_MIN_GAP_S:
            raise SystemExit(f"jolt budget: camera kicks at {a:.1f}s and {b:.1f}s are {b - a:.1f}s apart, "
                             f"the minimum is {KICK_MIN_GAP_S:.0f}s. Keep the bigger one.")
    return [round(t, 3) for t in times]


class Registrar:
    """Phase correlation of consecutive frames over a fixed window."""

    def __init__(self, shape):
        self.win = np.outer(np.hanning(shape[0]), np.hanning(shape[1])).astype(np.float32)
        self.prev = None

    def push(self, img):
        spec = np.fft.rfft2(img * self.win)
        if self.prev is None:
            self.prev = spec
            return 0.0, 0.0
        r = spec * np.conj(self.prev)
        r /= np.abs(r) + 1e-6
        corr = np.fft.irfft2(r, s=img.shape)
        self.prev = spec
        i, j = np.unravel_index(int(np.argmax(corr)), corr.shape)

        def sub(c, n, axis):
            p = [corr[(i + d) % n, j] if axis == 0 else corr[i, (j + d) % n] for d in (-1, 0, 1)]
            den = p[0] - 2 * p[1] + p[2]
            v = c + (0.5 * (p[0] - p[2]) / den if abs(den) > 1e-9 else 0.0)
            return v - n if v > n / 2 else v
        return sub(i, corr.shape[0], 0), sub(j, corr.shape[1], 1)


def events_from(shifts, cut_frames=()):
    """Frame indices of jitter (direction reversals) clustered into events, cuts excluded."""
    guard = {c + d for c in cut_frames for d in range(-CUT_GUARD, CUT_GUARD + 1)}
    jit = []
    for t in range(1, len(shifts)):
        if t in guard:
            continue
        for k in (0, 1):
            a, b = shifts[t - 1][k], shifts[t][k]
            if (JITTER_PX <= abs(a) <= JITTER_MAX_PX and JITTER_PX <= abs(b) <= JITTER_MAX_PX
                    and (a > 0) != (b > 0)):
                jit.append(t)
                break
    events = []
    for t in jit:
        if events and t - events[-1][-1] <= MERGE_FRAMES:
            events[-1].append(t)
        else:
            events.append([t])
    return [e for e in events if len(e) >= MIN_REVERSALS]


def frames_of(video):
    """Grey half-res frames of the story region, streamed so a long film never sits in memory."""
    y0, y1, x0, x1 = REGION
    cmd = ["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={W}:{H},format=gray",
           "-f", "rawvideo", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = W * H
    while True:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            break
        yield np.frombuffer(buf, np.uint8).reshape(H, W)[y0:y1, x0:x1].astype(np.float32)
    proc.wait()


def measure(video, cut_frames=()):
    y0, y1, x0, x1 = REGION
    reg = Registrar((y1 - y0, x1 - x0))
    shifts = [reg.push(img) for img in frames_of(video)]
    return len(shifts), events_from(shifts, cut_frames)


def self_test():
    rng = np.random.default_rng(7)
    base = rng.random((H, W)).astype(np.float32) * 255
    base = (base + np.roll(base, 1, 0) + np.roll(base, 1, 1)) / 3  # a little structure
    y0, y1, x0, x1 = REGION

    def run(offsets):
        reg = Registrar((y1 - y0, x1 - x0))
        return events_from([reg.push(np.roll(base, (oy, ox), (0, 1))[y0:y1, x0:x1]) for oy, ox in offsets])

    kick = lambda f, k: (int(round(np.cos(f * 1.9) * 2.4 * k)), int(round(np.sin(f * 2.3) * 3 * k)))
    smooth = [(0, f * 3 // 2) for f in range(120)]                       # a steady pan
    rise = [(-(f * 7) // 2, 0) for f in range(120)]                       # a camera rise
    still = [(0, 0)] * 120
    glitch = [(0, 2 * f) for f in range(120)]                             # a pan with one
    glitch[60] = (0, 2 * 60 - 4)                                          # frame read wrong
    whip = np.cumsum([0] * 20 + [-199, -91, 15, 54, 39, 8, -11, -13, -6, 1] + [0] * 30)
    whip = [(int(v), 0) for v in whip]                                    # 09-30 at 94.3 s
    beats = [10, 70, 130, 190]
    kicked = []
    for f in range(240):
        k = sum(np.exp(-(f - b) / 6) for b in beats if 0 <= f - b < 22)
        kicked.append(kick(f, min(1.0, k)))
    checks = [
        ("a steady pan is not a jolt", len(run(smooth)) == 0),
        ("a camera rise is not a jolt", len(run(rise)) == 0),
        ("a still frame is not a jolt", len(run(still)) == 0),
        ("one mis-registered frame inside a pan is not a jolt", len(run(glitch)) == 0),
        ("a whip transition settling on a spring is not a jolt", len(run(whip)) == 0),
        ("four beat kicks read as four jolts", len(run(kicked)) == 4),
    ]
    try:
        kick_budget([5, 40, 80])
        checks.append(("three kicks 35 s apart are within budget", True))
    except SystemExit:
        checks.append(("three kicks 35 s apart are within budget", False))
    for bad in ([5, 40, 80, 110], [5, 12]):
        try:
            kick_budget(bad)
            checks.append((f"board kicks {bad} refused", False))
        except SystemExit:
            checks.append((f"board kicks {bad} refused", True))
    for name, ok in checks:
        print(f"  [{'x' if ok else ' '}] {name}")
    if all(ok for _, ok in checks):
        print("SELF-TEST PASS")
        return 0
    print("SELF-TEST FAIL")
    return 1


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", default=os.path.join(OUT, "dispatch_master.mp4"))
    ap.add_argument("--props", default=os.path.join(OUT, "episode_props.json"))
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return self_test()
    if not os.path.exists(a.video):
        print(f"jolt_check: no video at {a.video}")
        return 2
    cuts, story = [], None
    if os.path.exists(a.props):
        props = json.load(open(a.props))
        cuts = [s["from"] for s in props.get("scenes", [])]
        if props.get("credits"):
            story = props["total"] - props["credits"]["frames"]
            cuts.append(story)
    n, events = measure(a.video, cuts)
    if n < 2:
        print(f"jolt_check: decoded {n} frame(s) from {a.video}, nothing measured")
        return 2
    secs = (story or n) / 30.0
    times = [round(e[0] / 30.0, 2) for e in events]
    print(f"jolt_check: {len(events)} whole-frame jolt(s) in {secs:.1f}s of {os.path.basename(a.video)}"
          f" (budget {KICK_MAX}, at least {KICK_MIN_GAP_S:.0f}s apart)")
    if times:
        print("  at " + ", ".join(f"{t:.2f}s" for t in times[:40]) + (" ..." if len(times) > 40 else ""))
    if len(events) > KICK_MAX:
        print(f"FAIL [jolt_check] {len(events)} whole-frame jolts, one every {secs / len(events):.1f}s. "
              f"The camera does not punctuate beats (owner, 2026-10-03). Drive the shot wrapper's shake "
              f"and zoom punch from lib/camera.ts cameraKick() with props.kicks only, and land impacts "
              f"in the object.")
        return 1
    print(f"PASS [jolt_check] {len(events)} jolt(s), within the budget of {KICK_MAX}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
