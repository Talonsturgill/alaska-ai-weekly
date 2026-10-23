#!/usr/bin/env python3
"""Fail a label that a character, a card or the camera cuts for half a second or more.

WHY THIS EXISTS (machine pass 2026-10-23, queue item label-footprint-check, repeat 1).
------------------------------------------------------------------------------------
The 10-23 film lost four cuts in a row to one defect class, a different label each time and
each one found only by the editor or a judge after a 20 minute cut: the BOROUGH LAND sign with
Dotty standing in front of it, the end of a hanging tag behind Dotty, the FAA sign under a quote
card leaving "AA", and cards wider than the frame after a push-in. 10-02 lost a round to the same
class (POLLOCK STONES lost its final S behind a hopper moved for another note).

Every geometry gate in this repo passed all of them, correctly, because each models one
relationship from source: text_fit a string against its own plate, plate_overlap a plate against
another plate, zoom_clip a plate against the frame under a `<Stage>` zoom. None of them models a
label against ART painted after it, and zoom_clip reads the Frame camera that 10-09 onward uses
(`cam={track([...])}`, z0/z1) as scale 1.0 for every shot. probe_frames.sh said so in 2026-08:
"every one of these was an element landing on ART, which no gate in this repo models".

This one asks the browser instead of the source. scripts/label_footprint_probe.cjs renders the
real composition in Remotion's Chrome, seeks every third story frame, and for every visible SVG
<text> (cumulative opacity 0.95 or more, rendered at least 12 px tall, not the caption bar) it
reads the projected box, which carries the Frame camera, and hit-tests a grid over the glyph
cells with document.elementsFromPoint, which carries the paint order. A point is covered when a
painted SVG element above the text sits on it and is not part of the label's own group (its
plate, shadow and sibling lines), not a full-frame layer (sky, grade, wipe), not a speck under
10 px (a snowflake), and at least 0.4 opaque.

A label FAILS when, for 15 or more observed frames (0.5 s) in a row, it is either partly outside
the 1080x1920 frame or between 6 and 90 percent covered. Observed means first to last sampled
frame inclusive, so at the default step of 3 it takes six consecutive samples, and a stamp head
passing over a card for 13 frames is a NOTE, not a FAIL. A label covered 90 percent or more is
not clipped text, it is not shown, so it is a NOTE too, and so is a label wholly off frame.

WHAT IT CAN'T SEE: HTML text (only SVG <text>), text clipped by a clipPath or mask (the hit test
honours the clip, so the clipped part is simply not on the text), type under about 10 px, and the
4:5 square cut. caption_band_check owns the caption band.

    python3 scripts/label_footprint_check.py                 # this run's episode, every shot
    python3 scripts/label_footprint_check.py --shots 7,13    # a fast re-check of named shots
    python3 scripts/label_footprint_check.py --self-test     # aggregation rules, then a fixture
                                                             # episode with known defects in Chrome
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(REPO, "scripts"))

FPS = 30
MIN_FRAMES = 15          # 0.5 s of observed frames
CLIP_LO, HIDE_HI = 0.06, 0.90
MIN_POINTS = 3           # a label hit on fewer glyph points than this is not graded for cover
FIXTURE = os.path.join(REPO, "video-engine", "src", "fixtures", "LabelFootprintFixture.tsx")


def status(label):
    if label.get("cut"):
        return "cut"
    frac = label.get("frac", 0)
    if label.get("onText", 0) < MIN_POINTS:
        return "ok"
    if frac >= HIDE_HI:
        return "hidden"
    if frac >= CLIP_LO:
        return "clipped"
    return "ok"


def aggregate(data):
    """Turn per-frame samples into runs per label. A run breaks when the label is absent from a
    sample, when its state changes between defect and not, or at a shot boundary."""
    samples = sorted(data["samples"], key=lambda s: s["frame"])
    fails, notes = [], []
    open_runs = {}           # label id -> run dict
    measured = set()

    def close(lid):
        run = open_runs.pop(lid, None)
        if not run:
            return
        frames = run["last"] - run["first"] + 1
        run["frames"] = frames
        if run["kind"] in ("cut", "clipped") and frames >= MIN_FRAMES:
            fails.append(run)
        else:
            notes.append(run)

    prev_shot = None
    for s in samples:
        if s["shot"] != prev_shot:
            for lid in list(open_runs):
                close(lid)
            prev_shot = s["shot"]
        seen = set()
        for lab in s["labels"]:
            lid = lab["id"]
            measured.add(lid)
            seen.add(lid)
            st = status(lab)
            run = open_runs.get(lid)
            defect = st != "ok"
            if run and (not defect or run["kind_class"] != ("hide" if st == "hidden" else "defect")):
                close(lid)
                run = None
            if not defect:
                continue
            if not run:
                run = {"id": lid, "shot": s["shot"], "text": lab["text"], "first": s["frame"],
                       "last": s["frame"], "kind": st, "kind_class": "hide" if st == "hidden" else "defect",
                       "max_frac": 0.0, "by": {}, "side": {}, "box": lab.get("box"), "samples": 0}
                open_runs[lid] = run
            run["last"] = s["frame"]
            run["samples"] += 1
            if st == "cut":
                run["kind"] = "cut"
                run["box"] = lab.get("box")
            run["max_frac"] = max(run["max_frac"], lab.get("frac", 0))
            if lab.get("by"):
                run["by"][lab["by"]] = run["by"].get(lab["by"], 0) + 1
            if lab.get("side"):
                run["side"][lab["side"]] = run["side"].get(lab["side"], 0) + 1
        for lid in list(open_runs):
            if lid not in seen:
                close(lid)
    for lid in list(open_runs):
        close(lid)
    return fails, notes, len(measured)


def top(d):
    return max(d.items(), key=lambda kv: kv[1])[0] if d else None


def describe(run):
    t0, t1 = run["first"] / FPS, (run["last"] + 1) / FPS
    head = f"S{run['shot']} {t0:.1f}-{t1:.1f}s ({run['frames']} frames) '{run['text'][:40]}'"
    if run["kind"] == "cut":
        return head + f": partly outside the frame, box {run['box']}"
    if run["kind"] == "hidden":
        return head + f": covered {round(run['max_frac'] * 100)} percent, so not shown at all, by {top(run['by'])}"
    return head + (f": {round(run['max_frac'] * 100)} percent covered on its {top(run['side'])} side "
                   f"by {top(run['by'])}")


REMEDY = {
    "cut": "keep it inside the camera's visible span at that zoom (fx +- 540/z, fy +- 960/z), "
           "retire it before the push-in, or hang it in the Frame overlay",
    "clipped": "move the label or the art clear of each other for the shot, retire the label before "
               "the art arrives, or draw the art behind it; if the label has no job here, don't draw it",
}


def probe(source, props, step, shots):
    with tempfile.TemporaryDirectory(prefix="label-footprint-") as tmp:
        opts, out = os.path.join(tmp, "o.json"), os.path.join(tmp, "r.json")
        with open(opts, "w") as fh:
            json.dump({"source": os.path.abspath(source), "props": os.path.abspath(props),
                       "step": step, "shots": shots or []}, fh)
        run = subprocess.run(["node", os.path.join(REPO, "scripts", "label_footprint_probe.cjs"), opts, out],
                             cwd=REPO, capture_output=True, text=True, timeout=1800)
        if run.returncode:
            raise RuntimeError("label_footprint_probe failed:\n" + (run.stderr or run.stdout)[-4000:])
        with open(out) as fh:
            return json.load(fh)


def report(data, rel):
    fails, notes, n = aggregate(data)
    print(f"label_footprint_check: {rel}, {data['frames']} frames sampled every {data['step']}, "
          f"{n} label(s) seen")
    for run in fails:
        print(f"  FAIL {describe(run)}")
        print(f"       fix: {REMEDY[run['kind']]}")
    shown = [r for r in notes if r["kind"] != "hidden"][:12]
    for run in shown:
        print(f"  NOTE {describe(run)} (under 0.5 s)")
    hidden = [r for r in notes if r["kind"] == "hidden"]
    if hidden:
        print(f"  NOTE {len(hidden)} run(s) where a label is fully covered, so not shown, e.g. "
              + "; ".join(describe(r) for r in hidden[:3]))
    if n == 0:
        print("label_footprint_check: measured NOTHING, which is a failure and not a pass")
        return 1, fails, notes
    if fails:
        print(f"\nlabel_footprint_check: {len(fails)} label(s) cut by art or by the frame edge for 0.5 s or more.")
        return 1, fails, notes
    print("label_footprint_check: clean, no label is cut by art or the frame edge for 0.5 s or more")
    return 0, fails, notes


def self_test():
    ok = True

    def expect(name, cond):
        nonlocal ok
        print(("  ok   " if cond else "  FAIL ") + name)
        ok = ok and cond

    def lab(i, frac=0.0, cut=False, on=20, text="SIGN"):
        return {"id": i, "text": text, "frac": frac, "cut": cut, "onText": on, "by": "a path", "side": "right",
                "box": [0, 0, 10, 10]}

    def series(frames, fn, shot=1):
        return [{"frame": f, "shot": shot, "labels": fn(f)} for f in frames]

    d = {"samples": series(range(0, 30, 3), lambda f: [lab(1, 0.3)]), "frames": 10, "step": 3}
    f, n, _ = aggregate(d)
    expect("a label 30 percent covered for 28 observed frames fails", len(f) == 1 and f[0]["frames"] == 28)
    d = {"samples": series(range(0, 15, 3), lambda f: [lab(1, 0.3)]), "frames": 5, "step": 3}
    f, n, _ = aggregate(d)
    expect("five samples observe 13 frames, a note and not a fail", not f and n and n[0]["frames"] == 13)
    d = {"samples": series(range(0, 30, 3), lambda f: [lab(1, 1.0)]), "frames": 10, "step": 3}
    f, n, _ = aggregate(d)
    expect("a fully covered label is not shown, so it is a note", not f and n[0]["kind"] == "hidden")
    d = {"samples": series(range(0, 30, 3), lambda f: [lab(1, 0.03)]), "frames": 10, "step": 3}
    f, n, _ = aggregate(d)
    expect("a speck over 3 percent of a label is not a defect", not f and not n)
    d = {"samples": series(range(0, 30, 3), lambda f: [lab(1, cut=True)]), "frames": 10, "step": 3}
    f, n, _ = aggregate(d)
    expect("a label partly off frame for 28 frames fails as cut", len(f) == 1 and f[0]["kind"] == "cut")
    d = {"samples": series(range(0, 12, 3), lambda f: [lab(1, 0.3)], 1) + series(range(12, 30, 3), lambda f: [lab(1, 0.3)], 2),
         "frames": 10, "step": 3}
    f, n, _ = aggregate(d)
    expect("a run does not carry across a shot boundary", len(f) == 1 and f[0]["shot"] == 2 and f[0]["frames"] == 16)
    d = {"samples": series(range(0, 30, 3), lambda f: [lab(1, 0.3)] if f != 12 else []), "frames": 10, "step": 3}
    f, n, _ = aggregate(d)
    expect("a label absent from one sample breaks its run", not f)
    d = {"samples": series(range(0, 30, 3), lambda f: [lab(1, 0.5, on=2)]), "frames": 10, "step": 3}
    f, n, _ = aggregate(d)
    expect("a label hit on fewer than 3 glyph points is not graded for cover", not f and not n)

    # The browser half: a fixture episode with one defect of each kind and two controls.
    if not os.path.exists(FIXTURE):
        expect("fixture episode exists", False)
        return 1
    with tempfile.TemporaryDirectory(prefix="label-footprint-fixture-") as tmp:
        props = os.path.join(tmp, "props.json")
        with open(props, "w") as fh:
            json.dump({"scenes": [{"from": 0, "dur": 45}, {"from": 45, "dur": 45}]}, fh)
        data = probe(FIXTURE, props, 3, None)
    f, n, count = aggregate(data)
    texts = {(r["text"], r["kind"]) for r in f}
    expect("fixture: the sign behind the character fails as clipped", ("BOROUGH LAND", "clipped") in texts)
    expect("fixture: the card past the frame after the push-in fails as cut", ("CARD PAST THE EDGE", "cut") in texts)
    expect("fixture: the clean label is not flagged", not any(r["text"] == "CLEAR LABEL" for r in f + n))
    expect("fixture: the label a ball crosses for 9 frames is a note, not a fail",
           not any(r["text"] == "BRIEF PASS" for r in f) and any(r["text"] == "BRIEF PASS" for r in n))
    expect("fixture: the fully covered label is a hidden note",
           any(r["text"] == "UNDER THE CARD" and r["kind"] == "hidden" for r in n))
    expect("fixture: the plate's own rect never counts against its text", not any(r["text"] == "ON ITS PLATE" for r in f + n))
    expect("fixture: exactly two fails", len(f) == 2)
    print("label_footprint_check self-test: " + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("targets", nargs="*")
    ap.add_argument("--props", default=os.path.join(REPO, "out", "dispatch", "episode_props.json"))
    ap.add_argument("--step", type=int, default=3)
    ap.add_argument("--shots", help="comma separated shot numbers, for a fast re-check")
    ap.add_argument("--json", help="write the runs here")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    targets = a.targets
    if not targets:
        from caption_band_check import default_targets
        targets = default_targets()
    if not targets:
        print("label_footprint_check: no episode file found, which is itself wrong")
        return 1
    if not os.path.exists(a.props):
        print(f"label_footprint_check: FAIL no props at {a.props}; run build_scenes first")
        return 1
    shots = [int(x) for x in a.shots.split(",")] if a.shots else None
    worst, dump = 0, []
    for t in targets:
        try:
            data = probe(t, a.props, a.step, shots)
        except (RuntimeError, subprocess.TimeoutExpired, OSError, ValueError) as exc:
            print(f"label_footprint_check: FAIL {t}: {exc}")
            return 1
        code, fails, notes = report(data, os.path.relpath(t, REPO))
        worst = max(worst, code)
        dump.append({"source": os.path.relpath(t, REPO), "fails": fails, "notes": notes})
    if a.json:
        with open(a.json, "w") as fh:
            json.dump(dump, fh, indent=1)
    return worst


if __name__ == "__main__":
    sys.exit(main())
