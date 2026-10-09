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

Usage: python3 scripts/held_beat_check.py [--motion out/evidence/motion.json] [--floor 2.0]
"""
import argparse
import json
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
MOTION = os.path.join(REPO, "out", "evidence", "motion.json")
BOARD = os.path.join(REPO, "out", "dispatch", "storyboard.json")
FLOOR = 2.0


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


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--motion", default=MOTION)
    ap.add_argument("--board", default=BOARD)
    ap.add_argument("--floor", type=float, default=FLOOR)
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
    if not low:
        print(f"held beats: all {len(strips)} strips change {a.floor:g} percent or more")
        return 0
    for name, pct in low:
        b = beats.get(beat_of(name))
        shows = f" | {b.get('shows', '')[:90]}" if b else ""
        print(f"  {pct:4.1f}%  {name}{shows}")
    # Names first: make_cut keeps the first 220 characters of a NOTE line.
    print(f"{len(low)} under {a.floor:g}%: " + ", ".join(f"{n} {p:.1f}" for n, p in low)
          + f" (of {len(strips)} strips; give each an idle cycle before the panel)")
    return 2


if __name__ == "__main__":
    sys.exit(main())
