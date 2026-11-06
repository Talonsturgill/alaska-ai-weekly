#!/usr/bin/env python3
"""DEAD-SPACE METER — turn "the frame feels empty" into a number you can act on.

WHY THIS EXISTS (2026-07-31, after two panel rounds).

"Mean low-information area is roughly 50 percent" was the single most repeated finding
across two rounds and three judges, and it survived a whole editing round in which I added
a far ridge, wheel ruts, a gravel scatter, a verge, a near berm and a ground falloff. All
of that was texture, and texture is not information. The reason the round failed on this
axis is that I was guessing at what "empty" meant and shipping fixes I could not measure,
so I could not tell the difference between a frame that got better and a frame that got
busier.

The measure: a pixel is LOW INFORMATION if its neighbourhood carries almost no structure
(local standard deviation under a threshold) AND it is not close to an edge. Gradients,
noise textures and subtle scatter all stay low-information, which is correct — a viewer
gets nothing from them. Ink outlines, type, and real objects raise local structure, which
is also correct. The score is the fraction of frame area that is low-information.

Use it as a RATCHET, not a target: measure, change one thing, measure again, keep the
change if the number moved. Reported per-shot so the worst shots are named rather than
averaged away.

WHY IT WAS REWRITTEN (2026-08-04, after the panel found 12 to 14 seconds of empty frames
inside the retention window and this script did not).

The meter was correct and unreachable. Three separate reasons, each enough on its own:

  1. It read PNGs from out/dispatch/frames, and the pipeline renders straight to mp4. That
     directory has never existed on a normal run, so every invocation died on "no frames"
     and the step was quietly skipped. A check with a precondition no run satisfies is not
     a check.
  2. It only PRINTED. `worst` was computed, named, and then the process exited 0. Nothing
     downstream could tell a clean film from a film with three empty shots.
  3. It measured the 1080x1920 master. The LinkedIn deliverable is the 1:1 SQUARE CUT, and
     the square throws away 840 rows. A subject parked at the top of the tall frame is
     centred and fine there and gone from the thing people actually see.

All three are the same shape as the no_exit hole closed earlier today: an artifact that
looked like a gate, read as authoritative, and could not fail. So this now samples the
SHIPPED VIDEO with ffmpeg, measures the cut that ships, and EXITS 1.

WHAT IT DOES NOT DO, stated plainly so nobody trusts it for more than it is worth. This
measures TEXTURE-FREE AREA, which is not the same thing as "no subject in the shot". On
the cut the panel faulted for empty frames, the shots the judges named scored 27 to 30
percent while three shots they did not name scored 39 to 45. Big flat colour fields are
this brand, and they read as empty to the meter whether or not something is happening in
front of them. So the ceilings below are a RATCHET against regression, deliberately set
just above the worst film measured rather than at a level that would have caught the
2026-08-03 defect, because a gate tuned to catch that one would fail three innocent shots
every run and would be turned off within a week. Judging whether a shot has a SUBJECT is
still the panel's job, and the storyboard's.

  python3 scripts/dead_space_check.py                          # the square cut, gated
  python3 scripts/dead_space_check.py --video out/dispatch/dispatch_master.mp4
  python3 scripts/dead_space_check.py --frames out/dispatch/frames   # legacy PNG path
"""
import argparse, glob, json, os, shutil, subprocess, tempfile
import numpy as np


def _low_map(im, win=17, thresh=5.0):
    """Boolean map, True where the neighbourhood carries no local structure."""
    im = im.convert("L")
    im = im.resize((im.width // 3, im.height // 3))       # 360x640, plenty for this
    a = np.asarray(im, dtype=np.float32)

    # local mean and local mean-of-squares via a separable box filter -> local variance
    def box(x, k):
        c = np.cumsum(np.pad(x, ((k // 2 + 1, k // 2), (0, 0))), axis=0)
        x = (c[k:] - c[:-k]) / k
        c = np.cumsum(np.pad(x, ((0, 0), (k // 2 + 1, k // 2))), axis=1)
        return (c[:, k:] - c[:, :-k]) / k

    m = box(a, win)
    m2 = box(a * a, win)
    sd = np.sqrt(np.maximum(0.0, m2 - m * m))
    return sd < thresh


def low_info_fraction(path, win=17, thresh=5.0):
    """Fraction of the frame carrying no local structure."""
    from PIL import Image
    return float(_low_map(Image.open(path), win, thresh).mean())


# ---- THE TOP OF THE SQUARE (machine pass 2026-11-06) ------------------------------------------
# Queue: empty-top-third-9x16 (10-31, 11-02 repeat 2) and "hero scale and the empty upper band under
# the 1:1 crop" (11-06, repeat 3). Every seat on 10-31, 11-02 and 11-06 named dead wall above the
# action, and the whole-frame meter above could not see it, because a busy desk and caption band
# under the action average it away. Both in-run fixes (11-02 and 11-06) drew a throughline strip at
# master y 150 to 270, OUTSIDE the square crop, so the deliverable never showed it.
#
# The measure: the low-information share of the TOP QUARTER of the square (master y 420 to 690),
# with the structure map computed on the whole square so the band's lower edge is not starved.
# Calibrated on the shipped masters, cropped as encode_deliverables crops them, in-scene samples:
#   named by the panel for an empty top:  10-31 48.7%, 11-02 52.1%, 11-06 56.6%
#   not named:                            10-24 38.9%, 10-26 41.0%, 10-29 41.2%, 11-01 38.2%
# (10-25, a flat night sky named in its own words, read 38.6%: stars and gulls are structure here,
# so this does not catch every empty sky, it catches the empty WALL three films in a row shipped.)
# The film ceiling sits between the two groups. A shot over SHOT_TOP_NOTE is named as the work order.
SQUARE_Y0, SQUARE_H = 420, 1080
TOP_BAND_ROWS = SQUARE_H // 4             # 270 rows of the square, master y 420 to 690
FAIL_TOP = 0.45
SHOT_TOP_NOTE = 0.55
TOP_REMEDY = ("Raise the stage, not the texture: put the hero or the throughline object so its top "
              "sits inside master y 420 to 690, or scale it up, and keep bands drawn above y 420 out of "
              "the count, because the square never shows them")


def square_of(im):
    """The 1:1 deliverable from a 1080x1920 master (crop=1080:1080:0:420); a square passes through."""
    if im.height > im.width:
        y0 = int(round(SQUARE_Y0 * im.height / 1920.0))
        return im.crop((0, y0, im.width, y0 + im.width))
    return im


def top_band_fraction(im, thresh=5.0):
    """Low-information share of the top quarter of the square, for a PIL image or a path."""
    from PIL import Image
    if isinstance(im, str):
        im = Image.open(im)
    lm = _low_map(square_of(im), thresh=thresh)
    return float(lm[: lm.shape[0] // 4].mean())


def top_band_verdict(vals, scenes, fail_top=FAIL_TOP, note=SHOT_TOP_NOTE):
    """vals: [(source_frame, top_fraction)]. In-scene samples only, so the credits card is not
    counted. Returns (film_mean, [(shot, mean)] over note, failed)."""
    if scenes:
        inside = [(i, v) for i, v in vals
                  if any(sc["from"] <= i < sc["from"] + sc["dur"] for sc in scenes)]
    else:
        inside = vals
    if not inside:
        return None, [], False
    film = float(np.mean([v for _, v in inside]))
    named = []
    for si, sc in enumerate(scenes or []):
        v = [x for i, x in inside if sc["from"] <= i < sc["from"] + sc["dur"]]
        if v and float(np.mean(v)) > note:
            named.append((si + 1, float(np.mean(v))))
    return film, sorted(named, key=lambda x: -x[1]), film > fail_top


def print_top_band(film, named, failed, fail_top=FAIL_TOP, where="the square"):
    print(f"TOP OF THE SQUARE (master y 420 to 690), {where}: {film * 100:.1f}% low-information "
          f"(ceiling {fail_top * 100:.0f}%)")
    if named:
        print("  emptiest tops, worst first: " + ", ".join(f"S{n} ({m * 100:.0f}%)" for n, m in named))
    if failed:
        print(f"  TOP BAND FAILED: {film * 100:.1f}% is over the {fail_top * 100:.0f}% ceiling. {TOP_REMEDY}.")


def plan_top_band(plan_path, scenes_path, fail_top=FAIL_TOP):
    """Gate the pre-render plan held_beat_check --source writes (Chrome frames of the real
    composition, before a frame of the full render is spent).

    A missing or stale plan (older than the episode it names) is NOT MEASURED and exits 0 with that
    said, because preflight's required `--top-only` row measures the delivered square anyway: a
    probe crash must not stop a cut at the source gates, and must not pass on last cut's numbers."""
    try:
        plan = json.load(open(plan_path))
        src = plan.get("source", "")
        if src and os.path.exists(src) and os.path.getmtime(src) > os.path.getmtime(plan_path):
            raise ValueError(f"older than {src}")
    except (OSError, ValueError) as exc:
        print(f"top band (plan): NOT MEASURED, no current plan at {plan_path} ({exc}); "
              "held_beat_check --source writes it, and preflight measures the delivered square")
        return 0
    scenes = None
    if os.path.exists(scenes_path):
        scenes = json.load(open(scenes_path)).get("scenes")
    vals = [(int(s["frame"]), float(s["top"])) for s in plan.get("samples", [])]
    film, named, failed = top_band_verdict(vals, scenes, fail_top)
    if film is None:
        print("top band (plan): measured NOTHING")
        return 2
    print_top_band(film, named, failed, fail_top, where=f"{len(vals)} pre-render Chrome frames")
    return 1 if failed else 0


def _self_test():
    """A flat wall over the action must fail; the same frame with a subject up top must pass."""
    from PIL import Image, ImageDraw
    rng = np.random.default_rng(3)
    base = Image.new("RGB", (1080, 1920), (217, 100, 26))
    d = ImageDraw.Draw(base)
    for _ in range(260):                       # busy action and desk from master y 820 down
        x, y = int(rng.integers(0, 1040)), int(rng.integers(820, 1880))
        d.rectangle((x, y, x + 40, y + 30), outline=(16, 20, 35), width=4)
    empty = top_band_fraction(base)
    full = base.copy()
    d2 = ImageDraw.Draw(full)
    for _ in range(120):                       # a subject whose top reaches into y 420 to 690
        x, y = int(rng.integers(0, 1040)), int(rng.integers(430, 690))
        d2.rectangle((x, y, x + 40, y + 30), outline=(16, 20, 35), width=4)
    filled = top_band_fraction(full)
    above = base.copy()                        # a band above y 420 is outside the square
    ImageDraw.Draw(above).rectangle((40, 150, 1040, 270), outline=(16, 20, 35), width=6)
    off_square = top_band_fraction(above)
    sq = top_band_fraction(square_of(full))
    scenes = [{"from": 0, "dur": 60}, {"from": 60, "dur": 60}]
    _f, _n, fail_e = top_band_verdict([(0, empty), (30, empty), (60, empty), (90, empty), (150, 0.0)], scenes)
    _f, _n, fail_f = top_band_verdict([(0, filled), (30, filled), (60, filled), (90, filled), (150, 1.0)], scenes)
    assert empty > 0.8, f"a flat wall top read {empty:.2f}"
    assert filled < FAIL_TOP, f"a subject in the top band read {filled:.2f}"
    assert abs(off_square - empty) < 1e-6, "a band drawn above y 420 changed the square's top"
    assert abs(sq - filled) < 1e-6, "a square input did not pass through"
    assert fail_e and not fail_f, "verdict did not separate the flat top from the filled one"
    print(f"dead_space_check self-test: PASS (flat top {empty * 100:.0f}%, subject up top "
          f"{filled * 100:.0f}%, band above y 420 ignored, credits excluded)")
    return 0


def main():
    import sys
    if sys.argv[1:2] == ["--self-test"]:
        raise SystemExit(_self_test())
    ap = argparse.ArgumentParser()
    ap.add_argument("--top-only", action="store_true",
                    help="gate ONLY the top of the square (preflight's required row); the whole-frame "
                         "ceilings stay advisory")
    ap.add_argument("--plan", nargs="?", const="out/dispatch/top_band_plan.json", default="",
                    help="gate the pre-render plan held_beat_check --source writes, no video needed")
    ap.add_argument("--fail-top", type=float, default=FAIL_TOP,
                    help="film ceiling on the top quarter of the square (calibrated, see TOP OF THE SQUARE)")
    ap.add_argument("--video", default="out/dispatch/dispatch_square.mp4",
                    help="THE CUT THAT SHIPS. Frames are sampled from it with ffmpeg, so the "
                         "meter cannot measure a different image than the audience gets.")
    ap.add_argument("--frames", default="",
                    help="legacy: read frame_*.png from a directory instead of a video")
    ap.add_argument("--every", type=int, default=30)
    ap.add_argument("--scenes", default="out/dispatch/episode_props.json")
    ap.add_argument("--thresh", type=float, default=5.0)
    ap.add_argument("--budget", type=float, default=0.33,
                    help="per-shot ADVISORY ceiling; shots above it are named and sorted")
    # CEILINGS ARE MEASURED, NOT GUESSED. On the 2026-08-03 cut, which the panel called
    # partly empty, per-shot means ran 19.8% to 45.0% and the film mean was 33.2%. So these
    # are set just above that film: a RATCHET that fails on regression, not a target.
    ap.add_argument("--fail-shot", type=float, default=0.55,
                    help="per-shot HARD ceiling (measured worst-ever shot: 45.0%%).")
    ap.add_argument("--fail-mean", type=float, default=0.42,
                    help="whole-film HARD ceiling (measured worst-ever film: 33.2%%).")
    ap.add_argument("--no-gate", action="store_true",
                    help="measure and report without the exit code. For calibration runs ONLY: "
                         "a pipeline step must never pass this, or the gate is decorative again.")
    a = ap.parse_args()
    if a.plan:
        raise SystemExit(plan_top_band(a.plan, a.scenes, a.fail_top))

    tmp = None
    stride = a.every          # source frames between samples; used to place samples in shots
    if a.frames:
        fs = sorted(glob.glob(os.path.join(a.frames, "frame_*.png")))
        if not fs:
            raise SystemExit(f"no frames in {a.frames}")
    else:
        if not os.path.exists(a.video):
            raise SystemExit(f"no video at {a.video} -- render and encode before measuring it")
        tmp = tempfile.mkdtemp(prefix="deadspace")
        fps = 30.0 / max(1, a.every)
        subprocess.run(["ffmpeg", "-y", "-i", a.video, "-vf", f"fps={fps}",
                        os.path.join(tmp, "frame_%05d.png"), "-v", "error"], check=True)
        fs = sorted(glob.glob(os.path.join(tmp, "frame_*.png")))
        if not fs:
            raise SystemExit(f"ffmpeg produced no frames from {a.video}")
        # ffmpeg already decimated, so read every extracted frame. STRIDE stays at --every
        # because the per-shot bucketing below compares against SOURCE frame numbers: the
        # first version scaled it to 1 and dropped all 84 samples into S1.
        a.every = 1
        print(f"sampled {len(fs)} frames from {a.video}")

    scenes = None
    if os.path.exists(a.scenes):
        try:
            scenes = json.load(open(a.scenes)).get("scenes")
        except Exception:
            scenes = None

    idx = list(range(0, len(fs), a.every))
    from PIL import Image
    vals, tops = [], []
    for i in idx:
        im = Image.open(fs[i])
        vals.append((i * stride, float(_low_map(im, thresh=a.thresh).mean())))
        tops.append((i * stride, top_band_fraction(im, thresh=a.thresh)))
    overall = float(np.mean([v for _, v in vals]))
    top_film, top_named, top_failed = top_band_verdict(tops, scenes, a.fail_top)
    if a.top_only:
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)
        if top_film is None:
            raise SystemExit("top band: no in-scene samples")
        print_top_band(top_film, top_named, top_failed, a.fail_top)
        if not top_failed:
            print(f"  OK  the top of the square carries the picture ({top_film * 100:.1f}%)")
        raise SystemExit(1 if top_failed and not a.no_gate else 0)

    print(f"frames sampled: {len(vals)} of {len(fs)}   (every {a.every})")
    print(f"MEAN LOW-INFORMATION AREA: {overall * 100:.1f}%")
    print()

    if scenes:
        print("per shot:")
        worst, hard = [], []
        for si, sc in enumerate(scenes):
            lo, hi = sc["from"], sc["from"] + sc["dur"]
            v = [x for i, x in vals if lo <= i < hi]
            if not v:
                continue
            mean, mx = float(np.mean(v)), float(np.max(v))
            flag = "  <-- OVER BUDGET" if mean > a.budget else ""
            print(f"  S{si + 1:<2} {lo / 30:6.1f}s..{hi / 30:6.1f}s   mean {mean * 100:5.1f}%   worst {mx * 100:5.1f}%{flag}")
            if mean > a.budget:
                worst.append((mean, si + 1))
            if mean > a.fail_shot:
                hard.append((mean, si + 1))
        if worst:
            print()
            print("fix these first, worst first: " +
                  ", ".join(f"S{n} ({m * 100:.0f}%)" for m, n in sorted(worst, reverse=True)))
    else:
        hard = []
        for i, v in vals:
            print(f"  f{i:<5} {i / 30:6.1f}s  {v * 100:5.1f}%")

    if top_film is not None:
        print()
        print_top_band(top_film, top_named, top_failed, a.fail_top)

    # ---- THE PART THAT WAS MISSING: a verdict, with an exit code behind it -------
    if tmp:
        shutil.rmtree(tmp, ignore_errors=True)
    if a.no_gate:
        print("\n(--no-gate: measured only, no verdict)")
        return

    fails = []
    if overall > a.fail_mean:
        fails.append(f"whole film mean low-information area {overall * 100:.1f}% "
                     f"is over the {a.fail_mean * 100:.0f}% ceiling")
    for m, n in sorted(hard, reverse=True):
        fails.append(f"S{n} mean {m * 100:.1f}% is over the {a.fail_shot * 100:.0f}% "
                     f"per-shot ceiling: that shot has no subject in it")
    if top_failed:
        fails.append(f"the top of the square is {top_film * 100:.1f}% low-information, over the "
                     f"{a.fail_top * 100:.0f}% ceiling")
    if fails:
        print()
        print("=" * 74)
        print("  DEAD-SPACE GATE FAILED")
        print("=" * 74)
        for f in fails:
            print("  - " + f)
        print()
        print("  A shot over the ceiling is not a taste note. It is a stretch of the film")
        print("  where a viewer is given nothing to look at, and it is measured on the cut")
        print("  that ships, not on the tall master. Put a SUBJECT in the frame -- an object,")
        print("  a person, an instrument doing something -- not more texture. Gradients,")
        print("  noise and scatter all score as empty here, correctly.")
        raise SystemExit(1)
    print(f"\n  OK  mean {overall * 100:.1f}% (ceiling {a.fail_mean * 100:.0f}%), "
          f"every shot under the {a.fail_shot * 100:.0f}% per-shot ceiling")


if __name__ == "__main__":
    main()
