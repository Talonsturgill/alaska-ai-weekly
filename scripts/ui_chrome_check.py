#!/usr/bin/env python3
"""Source gate: no progress-tracker UI strip of state chips over the film. Runs in make_cut.

WHY THIS EXISTS (machine pass 2026-11-11; queue: dev-ui-chrome-on-screen, 11-11). Every episode from
Ep1104 to Ep1110 carried the same copied overlay: a `TOPS` list of four to seven state labels drawn
as a row of rounded chips, lit one by one as the beats pass (`TOPS.filter((q) => f >= at(q.k))`).
The panel read it as interface, not picture, every time it was looked at: "tab strip and chip small
at phone size" (11-04), "Top tracker, ILLUSTRATION tag and bottom strip eat the frame" (11-05), "nav
chips and mono labels tiny" (11-06), and on 11-11 the RoofPuck tracker shipped to the first panel as
on-screen UI and cost a round before it was cut. It came from a doctrine line that asked for a
"throughline strip" in the top band (11-02); a throughline is an OBJECT in the world, not a row of
app tabs.

The signature, read from the episode source (no render):
  a top-level array with four or more entries carrying an all-caps label (`t: 'FILED'`),
  that the file both FILTERS against the frame (`NAME.filter(... f >= ...)`, i.e. lit by progress)
  and MAPS into chips (`NAME.map(` whose body draws a `<rect` and a `<text`).
That is a progress tracker. Exit 1 names it and where it is drawn; exit 0 otherwise. A diegetic row of
labelled things (lanes, cones, drawers) is not lit by a frame filter over a label list and passes.

    python3 scripts/ui_chrome_check.py [EPISODE.tsx ...]     # default: this run's episode
    python3 scripts/ui_chrome_check.py --self-test
"""
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
MIN_CHIPS = 4
LABEL = re.compile(r"""\bt\s*:\s*(['"])([A-Z0-9][A-Z0-9 ~?!.,'·&/-]*)\1""")


def _array_body(src, start):
    """The text of the bracketed array beginning at src[start] == '['."""
    depth = 0
    for i in range(start, len(src)):
        if src[i] == "[":
            depth += 1
        elif src[i] == "]":
            depth -= 1
            if depth == 0:
                return src[start:i + 1]
    return src[start:]


def trackers(src):
    """[(name, labels, line)] for every progress-tracker chip strip in the source."""
    out = []
    for m in re.finditer(r"^const (\w+)\s*(?::[^=]+)?=\s*\[", src, re.M):
        name = m.group(1)
        body = _array_body(src, m.end() - 1)
        labels = [g[1] for g in LABEL.findall(body)]
        if len(labels) < MIN_CHIPS:
            continue
        lit = re.search(re.escape(name) + r"\.filter\([^;]*\bf\s*>=", src)
        mapped = False
        for mm in re.finditer(re.escape(name) + r"\.map\(", src):
            chunk = src[mm.end():mm.end() + 1600]
            if "<rect" in chunk and "<text" in chunk:
                mapped = True
                break
        if lit and mapped:
            out.append((name, labels, src.count("\n", 0, m.start()) + 1))
    return out


def default_targets():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from caption_band_check import default_targets as dt
    return dt()


def _self_test():
    tracker = ("const TOPS = [{k: 2, t: 'PRINTED'}, {k: 6, t: 'FILED'}, {k: 12, t: 'IN LINE'}, {k: 17, t: 'PINNED'}];\n"
               "const Bands = () => { const cur = TOPS.filter((q) => f >= at(q.k)).length - 1;\n"
               "  return <g>{TOPS.map((q, i) => (<g key={i}><rect x={0} /><text>{q.t}</text></g>))}</g>; };\n")
    three = tracker.replace(", {k: 17, t: 'PINNED'}", "")
    lanes = ("const LANES = [{x: 1, t: 'MANUAL'}, {x: 2, t: 'SPECIALIST'}, {x: 3, t: 'TESTING'}, {x: 4, t: 'CONES'}];\n"
             "const S4 = () => <g>{LANES.map((q, i) => (<g key={i}><rect x={0} /><text>{q.t}</text></g>))}</g>;\n")
    unlit_list = tracker.replace("TOPS.filter((q) => f >= at(q.k))", "TOPS.slice(0)")
    cases = [("tracker fails", tracker, 1), ("three chips pass", three, 0),
             ("diegetic labelled row passes", lanes, 0), ("a list never lit by the frame passes", unlit_list, 0)]
    bad = [f"{n}: found {len(trackers(s))}" for n, s, want in cases if len(trackers(s)) != want]
    print("ui_chrome_check self-test:", "FAIL " + "; ".join(bad) if bad else f"PASS ({len(cases)} cases)")
    return 1 if bad else 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if argv[:1] == ["--self-test"]:
        return _self_test()
    targets = argv or default_targets()
    if not targets:
        print("ui_chrome_check: no episode file found")
        return 2
    worst = 0
    for t in targets:
        found = trackers(open(t).read())
        rel = os.path.relpath(t, REPO)
        for name, labels, line in found:
            print(f"FAIL [ui_chrome] {rel}:{line} `{name}` is a progress-tracker strip of {len(labels)} state chips "
                  f"({' / '.join(labels[:7])}) lit by the frame. The panel reads it as app UI, not picture "
                  "(11-04, 11-05, 11-06, and a lost round on 11-11). Cut it, and carry the throughline as an "
                  "object in the world that changes state (the puck frosting, the ticket moving down the line)")
            worst = 1
        if not found:
            print(f"ui_chrome_check: {rel} clean, no progress-tracker chip strip")
    return worst


if __name__ == "__main__":
    sys.exit(main())
