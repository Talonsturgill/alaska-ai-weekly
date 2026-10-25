#!/usr/bin/env python3
"""Name the beats whose evidence strip barely moves, before a judge does. ADVISORY.

WHY THIS EXISTS (machine pass 2026-10-09; queue: ship-hold-under-2pct 10-08,
held-beats-under-2pct 10-09, repeat 1). On 10-08 all three judges listed the same boats,
chair, phone, pencil and closing lens at 1.3 to 2 percent change; on 10-09 the pen, barge,
news card and bench at 0.6 to 1.3 percent, again from all three. build_evidence.py had
already measured every one of them into out/evidence/motion.json, and nothing read it until
the panel did. A held beat under 2 percent reads as a still with a caption
(DISPATCH_STANDARD section 11), and the fix is one continuous idle cycle on that beat.

This prints those beats, by strip name and board beat, so make_cut's summary carries them as a
NOTE line before a panel is spent. It never fails a cut: exit 0 when every strip is at or
above the floor, exit 2 (preflight NOTE) when some are under it or the data is missing.
It changes no threshold of any other gate.

CAMERA SOLVED OUT (machine pass 2026-10-25; queue: held-beats-under-six-percent, repeat 2). The
10-24 and 10-25 panels capped Motion at 6.5 to 7.2 on both films for held beats (island, cord,
intakes, podium, testimony sheet) at 2.0 to 5.9 percent, and wrote that the camera push and the
rain do not count. motion.json's changed_pct is frame 1 against frame 8 of the strip with the
camera IN it, so a push repaints the frame and a beat whose objects are statues still reads 5 or 7
percent. So every strip is now measured a second time on the delivered master: the engine's own
camera (uniform scale about the centre plus translation) is solved with motion_check.register and
warped out, a 3x3 median removes thin rain streaks and grain, the caption band counts as still, and
what is left is the share of the frame that moved more than 12/255. A strip under --held-floor
(6 percent, the panel's own line) is printed as HELD with both numbers side by side. ADVISORY in
preflight like the 2 percent floor above, until a shipped film clears it; `--strict` exits 1, and
the named beats are the work order: an object-level secondary motion on the held thing (HeldProp
from lib/heldidle.tsx, a drip, a sway, a flutter), never a bigger camera move.

Usage: python3 scripts/held_beat_check.py [--motion out/evidence/motion.json] [--floor 2.0]
                                          [--held-floor 6.0] [--no-solve] [--strict]
"""
import argparse
import json
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
MOTION = os.path.join(REPO, "out", "evidence", "motion.json")
BOARD = os.path.join(REPO, "out", "dispatch", "storyboard.json")
VIDEO = os.path.join(REPO, "out", "dispatch", "dispatch_master.mp4")
FLOOR = 2.0
HELD_FLOOR = 6.0        # the panel's line, 10-24 and 10-25: under 6 percent reads as held
CAPTION_TOP = 1310      # the most conservative caption top in the gates (plate_overlap_check)
MID_W, MID_H = 270, 480 # quarter resolution: a prop's drift survives, a 1 px rain streak does not


def solved_change(a_rgb, b_rgb):
    """Percent of the frame changing by more than 12/255 after the engine's camera is solved and
    warped out. The caption band counts as unchanged (burned words are not the beat) but stays in
    the denominator, so the figure is on the same whole-frame scale as motion.json's changed_pct."""
    import numpy as np
    from PIL import ImageFilter
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import motion_check as mc
    w_full, h_full = a_rgb.size
    small = [np.asarray(im.convert("L").resize((mc.RW, mc.RH)), dtype=np.float32) / 255.0
             for im in (a_rgb, b_rgb)]
    # Register on the picture above the captions only, so changing words cannot pull the solve.
    rcap = int(mc.RH * CAPTION_TOP / 1920.0)
    k, dx, dy, _ = mc.register(small[0][:rcap], small[1][:rcap])
    # register() scales about the centre of the array it was given; rebase dy to the full frame.
    dy_full = dy + (rcap - mc.RH) / 2.0 * (1 - k)
    mid = [np.asarray(im.convert("L").resize((MID_W, MID_H)).filter(ImageFilter.MedianFilter(3)),
                      dtype=np.float32) / 255.0 for im in (a_rgb, b_rgb)]
    warped = mc.warp(mid[1], k, dx * MID_W / mc.RW, dy_full * MID_H / mc.RH)
    moved = np.abs(mid[0] - warped) > 12 / 255.0
    moved[int(MID_H * CAPTION_TOP / 1920.0):, :] = False       # captions are not the beat
    bx, by = int(MID_W * 0.04), int(MID_H * 0.04)               # the warp clamps at the border
    moved[:by, :] = moved[MID_H - by:, :] = False
    moved[:, :bx] = moved[:, MID_W - bx:] = False
    return float(moved.mean() * 100.0), float(k)


def _grab(video, t):
    import subprocess
    import tempfile
    from PIL import Image
    fd, path = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    try:
        r = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-ss", f"{t:.3f}", "-i",
                            video, "-frames:v", "1", "-y", path], capture_output=True)
        if r.returncode != 0 or not os.path.getsize(path):
            return None
        return Image.open(path).convert("RGB")
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


def held_solved(strips, video, floor=HELD_FLOOR):
    """[(name, solved_pct, gross_pct)] for within-shot strips under `floor` once the camera is
    solved out, measured frame 1 against frame 8 of the same window build_evidence used."""
    out, measured = [], 0
    for name, s in strips.items():
        if s.get("within_shot") is False or not isinstance(s.get("window_start_s"), (int, float)):
            continue
        t0 = float(s["window_start_s"])
        a, b = _grab(video, t0), _grab(video, t0 + 7 / 30.0)
        if a is None or b is None:
            continue
        pct, _k = solved_change(a, b)
        pct = round(pct, 1)
        s["solved_pct"] = pct
        measured += 1
        if pct < floor:
            out.append((name, pct, s.get("changed_pct")))
    return sorted(out, key=lambda x: (x[1], x[0])), measured


def held(strips, floor=FLOOR):
    """[(name, pct)] for strips measured within one shot under `floor` percent, stillest first."""
    out = []
    for name, s in strips.items():
        if s.get("within_shot") is False:
            continue          # a strip across a cut measures the cut, not the beat
        pct = s.get("changed_pct")
        if isinstance(pct, (int, float)) and pct < floor:
            out.append((name, float(pct)))
    return sorted(out, key=lambda x: (x[1], x[0]))


def beat_of(name):
    m = re.search(r"_(\d+)$", name)
    return int(m.group(1)) if m else None


def _self_test():
    """A pure camera push over a still picture must read near zero; the same push with a moving
    prop must read over the floor. Proves the solve removes the camera and keeps the object."""
    import numpy as np
    from PIL import Image, ImageDraw
    rng = np.random.default_rng(7)
    base = Image.fromarray((rng.random((60, 34, 3)) * 255).astype("uint8")).resize((1080, 1920), Image.BILINEAR)

    def push(im, k):
        w, h = im.size
        cw, ch = int(w / k), int(h / k)
        x0, y0 = (w - cw) // 2, (h - ch) // 2
        return im.crop((x0, y0, x0 + cw, y0 + ch)).resize((w, h), Image.BILINEAR)

    still, _ = solved_change(base, push(base, 1.012))
    moved_b = push(base, 1.012)
    d = ImageDraw.Draw(moved_b)
    d.rectangle((300, 500, 780, 1000), fill=(250, 40, 40))
    moving, _ = solved_change(base, moved_b)
    capb = base.copy()
    ImageDraw.Draw(capb).rectangle((0, 1400, 1080, 1700), fill=(255, 255, 255))
    caption_only, _ = solved_change(base, capb)
    # A 1.2 percent push (four times an 8-frame push on the 10-25 film) repaints 26 percent of
    # this texture before the solve; the 0.0025 solve grid leaves about 1.4 percent.
    assert still < 2.5, f"a pure camera push read {still:.2f}%"
    assert moving > HELD_FLOOR, f"a moving prop read {moving:.2f}%"
    assert caption_only < 0.5, f"a caption change read {caption_only:.2f}%"
    print(f"held_beat_check self-test: PASS (push only {still:.2f}%, push plus prop {moving:.2f}%, "
          f"caption only {caption_only:.2f}%)")
    return 0


def main(argv=None):
    if (argv if argv is not None else sys.argv[1:])[:1] == ["--self-test"]:
        return _self_test()
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--motion", default=MOTION)
    ap.add_argument("--board", default=BOARD)
    ap.add_argument("--floor", type=float, default=FLOOR)
    ap.add_argument("--video", default=VIDEO)
    ap.add_argument("--held-floor", type=float, default=HELD_FLOOR,
                    help="percent of picture moving with the camera solved out (panel line: 6)")
    ap.add_argument("--no-solve", action="store_true", help="skip the camera-solved pass")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 when a beat is under the held floor (default advisory, exit 2)")
    a = ap.parse_args(argv)
    try:
        strips = json.load(open(a.motion))["strips"]
    except (OSError, ValueError, KeyError) as exc:
        print(f"held beats: no readable motion.json ({exc}); run build_evidence.py first")
        return 2
    try:
        beats = {b["id"]: b for b in json.load(open(a.board))["beats"]}
    except (OSError, ValueError, KeyError):
        beats = {}
    low = held(strips, a.floor)
    solved, measured = [], 0
    if not a.no_solve and os.path.exists(a.video):
        solved, measured = held_solved(strips, a.video, a.held_floor)
        for name, pct, gross in solved:
            b = beats.get(beat_of(name))
            shows = f" | {b.get('shows', '')[:80]}" if b else ""
            print(f"  HELD {pct:4.1f}% solved ({gross}% with camera)  {name}{shows}")
        if measured:
            print(f"camera solved out: {len(solved)} of {measured} strips under {a.held_floor:g}%"
                  + (": " + ", ".join(f"{n} {p:.1f}" for n, p, _g in solved) if solved else ""))
    elif not a.no_solve:
        print(f"held beats: no master at {os.path.relpath(a.video, REPO)}, camera-solved pass skipped")
    if not low and not solved:
        print(f"held beats: all {len(strips)} strips change {a.floor:g} percent or more"
              + (f", and {a.held_floor:g} percent with the camera solved out" if measured else ""))
        return 0
    if not low:
        print(f"{len(solved)} held under {a.held_floor:g}% with the camera solved out: "
              + ", ".join(f"{n} {p:.1f}" for n, p, _g in solved)
              + " (an object-level idle on each: HeldProp in lib/heldidle.tsx, not a camera move)")
        return 1 if a.strict else 2
    for name, pct in low:
        b = beats.get(beat_of(name))
        shows = f" | {b.get('shows', '')[:90]}" if b else ""
        print(f"  {pct:4.1f}%  {name}{shows}")
    # Names first: make_cut keeps the first 220 characters of a NOTE line.
    print(f"{len(low)} under {a.floor:g}%: " + ", ".join(f"{n} {p:.1f}" for n, p in low)
          + f" (of {len(strips)} strips; wrap each held prop in <HeldProp> from lib/heldidle.tsx)")
    return 1 if (a.strict and solved) else 2


if __name__ == "__main__":
    sys.exit(main())
