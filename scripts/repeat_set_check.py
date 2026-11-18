#!/usr/bin/env python3
"""One set band pasted under most shots reads as one set. SOURCE ADVISORY.

WHY THIS EXISTS (machine pass 2026-11-18; queue: shared-near-band-stamp). The 11-18 flow critic
counted one foreground band (snow drifts, posts, plug stubs) at the same pixels on 24 of 26 stills,
reel included. Ep1118 draws it as a local `Near` component in 13 of its 16 scenes; the seed only
nudges the drift heights, the five drifts sit at the same x every time. The same class was named
on 11-08 ("repeated soil band 23 percent of every shot"), 11-13 (pebble floor) and 11-16 (sedge band).

WHAT WAS MEASURED BEFORE CHOOSING A SOURCE CHECK. A pixel version (edge-structure correlation of
the band under the caption bar, master y 79 to 100 percent, sampled every 2 s on the 720 masters)
reads the largest matching cluster as 0.81 of the film on 11-08, but 0.05 to 0.21 on 11-18, the
same as 11-14 and 11-15 (0.05 to 0.19) which nobody faulted: a band drawn under a moving Frame
camera with seed-jittered heights is the same set to a judge and a different image to a pixel
metric. The source sees it plainly. Over Ep1101 to Ep1118 this rule names Ep1118 (Near 13 of 16,
plus its Sky, Snow and SpruceRank at 12), Ep1101 (Ground 7 of 9) and Ep1107 (Dock 7 of 11), and
nothing on the other thirteen. It does NOT see 11-08's soil, 11-13's pebbles or 11-16's sedge,
which were drawn inside the scenes or a shared world rather than as one local band component.

The rule: an episode-local set component (its body carries data-band="ok", the house marker for
set dressing allowed under the caption bar) drawn in more than six scenes AND in more than half of
them. It NOTES and exits 0 by default; the remedy is a variant per act (different pieces, a
different horizon, or none) so no band carries more than six shots. `--strict` exits 1.

    python3 scripts/repeat_set_check.py [EPISODE.tsx ...] [--strict]
    python3 scripts/repeat_set_check.py --self-test
"""
import argparse
import os
import re
import sys

MAX_SHOTS = 6


def components(src):
    starts = list(re.finditer(r"^const (\w+)\s*:\s*React\.FC\b", src, re.M))
    out = {}
    for i, m in enumerate(starts):
        end = starts[i + 1].start() if i + 1 < len(starts) else len(src)
        out[m.group(1)] = src[m.start():end]
    return out


def repeated_sets(src):
    """[(name, scenes_drawing_it, scene_count)] for each over-used local set component."""
    comps = components(src)
    scenes = {k: v for k, v in comps.items() if re.match(r"S\d+$", k)}
    sets = {k for k, v in comps.items() if k not in scenes and 'data-band="ok"' in v and k not in ("Frame", "World", "SVG")}
    n = len(scenes)
    out = []
    for name in sorted(sets):
        used = sum(1 for body in scenes.values() if re.search(r"<" + re.escape(name) + r"\b", body))
        if used > MAX_SHOTS and used * 2 > n:
            out.append((name, used, n))
    return sorted(out, key=lambda r: -r[1])


def _self_test():
    band = 'const Near: React.FC<{seed?: number}> = ({seed = 0}) => <g data-band="ok"><path d="M0 0" /></g>;\n'
    hero = 'const Chalky: React.FC<{x: number}> = ({x}) => <g><circle r={4} /></g>;\n'

    def ep(k, n):
        return band + hero + "".join(
            f"const S{i}: React.FC<SceneProps> = ({{p}}) => <svg><Chalky x={{1}} />{'<Near seed={%d} />' % i if i <= k else ''}</svg>;\n"
            for i in range(1, n + 1))
    cases = [
        ("band in 13 of 16 scenes notes", repeated_sets(ep(13, 16)), 1),
        ("band in 6 of 8 scenes is under the count", repeated_sets(ep(6, 8)), 0),
        ("band in 7 of 16 scenes is under half", repeated_sets(ep(7, 16)), 0),
        ("a hero in every scene is not set dressing", [r for r in repeated_sets(ep(0, 16)) if r[0] == "Chalky"], 0),
    ]
    bad = [name for name, got, want in cases if len(got) != want]
    print("repeat_set_check self-test:", "FAIL " + "; ".join(bad) if bad else f"PASS ({len(cases)} cases)")
    return 1 if bad else 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("targets", nargs="*")
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return _self_test()
    targets = a.targets
    if not targets:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from caption_band_check import default_targets
        targets = default_targets()
    if not targets:
        print("repeat_set_check: no episode file found")
        return 0
    hit = False
    for t in targets:
        rows = repeated_sets(open(t).read())
        rel = os.path.relpath(t)
        if not rows:
            print(f"repeat_set_check: {rel} clean (no set band in more than {MAX_SHOTS} shots and half the film)")
            continue
        hit = True
        for name, used, n in rows:
            print(f"  NOTE  {rel}: set component {name} is drawn in {used} of {n} scenes; the panel reads one "
                  f"band under most shots as one set (11-18 Near, 11-08 soil band)")
        print(f"repeat_set_check: {len(rows)} repeated set band(s) in {rel}: "
              + ", ".join(r[0] for r in rows)
              + f". Give each act its own variant (other pieces, another horizon, or none) so no band carries more than {MAX_SHOTS} shots.")
    return 1 if (hit and a.strict) else 0


if __name__ == "__main__":
    sys.exit(main())
