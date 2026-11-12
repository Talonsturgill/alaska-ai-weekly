#!/usr/bin/env python3
"""GATE 0A, SHOT GRAMMAR SLOT BY SLOT: a board that re-runs a recent film's template fails here.

WHY (machine pass 2026-11-12, queue item gate0-critic-rounds, repeat 3). Gate 0B said 11-12's v1
board was "a relabel of 11-11's template", and v1 to v2 was a full rebuild of the board and scenes
(46 beats, 12 shots) after the source gates were already green. storyboard_check had passed v1:
it compares the FILM-level fingerprint (seven axes) with recent films, and 11-12 v1 differed from
11-11 on most of them. What 0B read was the SHOT sequence: slot 2 a push-detail single-object
instrument insert scrolling data, slot 3 a top-down map-territory data shot, the button a
single-object orbital vertical rise over landscape, exactly where 11-11 had them.

That read is mechanical, so it runs here, before a critic is spent. Each shot's grammar is the
five board fields (framing, pov, layout, motion_vector, hero_treatment). Slots are aligned from the
START for the first half of the board and from the END for the second half, so the open lines up
with the open and the button with the button whatever the shot counts. A slot REPEATS when at
least 4 of its 5 fields equal the aligned slot of a recent board. A board FAILS when 3 or more of
its slots repeat either of the two most recent shipped boards (runs/<date>/storyboard.json, dated
before this board).

Calibration, measured on every shipped board from 10-03 to 11-12 against its two predecessors:
every one repeats at most 2 slots, except 10-17, which repeats 4 of 10-15's and is the board Gate
0B and 0D flagged as repeating 10-15 (queue item storyboard-check-motif-repeat). 11-12 v1
(git f74cba7, scripts/board_1112.py) repeats 4 of 11-11's. Two repeats print as an advisory.

    python3 scripts/template_slot_check.py [out/dispatch/storyboard.json]
    python3 scripts/template_slot_check.py --self-test
    python3 scripts/template_slot_check.py --history     # every shipped board, for calibration

storyboard_check.py runs analyze() as its section 11.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUNS = ROOT / "runs"
AXES = ["framing", "pov", "layout", "motion_vector", "hero_treatment"]
SLOT_MATCH = 4      # fields of 5 that make a slot a repeat
FAIL_SLOTS = 3      # repeated slots against one recent board that fail the board
WINDOW = 2          # recent shipped boards compared


def grammar(shot):
    return tuple(str(shot.get(a) or "").strip().lower() for a in AXES)


def shot_grammar(board):
    return [grammar(s) for s in (board.get("shots") or []) if isinstance(s, dict)]


def repeats(new, old):
    """[(new slot, old slot, fields equal, grammar)] for slots of `new` that repeat `old`, 1-based."""
    out = []
    n = len(new)
    for i, g in enumerate(new):
        j = i if i < n / 2 else len(old) - (n - i)
        if not 0 <= j < len(old):
            continue
        same = sum(1 for a, b in zip(g, old[j]) if a and a == b)
        if same >= SLOT_MATCH:
            out.append((i + 1, j + 1, same, g))
    return out


def recent_boards(run_date, runs_dir=RUNS, window=WINDOW):
    """[(date, board)] for the `window` newest shipped boards dated before run_date."""
    found = []
    for p in sorted(Path(runs_dir).glob("*/storyboard.json")):
        d = p.parent.name
        if run_date and d >= run_date:
            continue
        try:
            b = json.loads(p.read_text())
        except (OSError, ValueError):
            continue
        if shot_grammar(b):
            found.append((d, b))
    return found[-window:]


def analyze(board, runs_dir=RUNS, prior=None):
    """{'problems', 'warnings', 'compared'}. `prior` overrides the shipped boards (self-test)."""
    new = shot_grammar(board)
    run_date = str(board.get("run_date") or board.get("date") or "").strip()
    prior = recent_boards(run_date, runs_dir) if prior is None else prior
    problems, warnings, compared = [], [], []
    if not new:
        return {"problems": problems, "warnings": warnings, "compared": compared}
    for d, old_board in prior:
        hits = repeats(new, shot_grammar(old_board))
        compared.append((d, len(hits)))
        if not hits:
            continue
        where = "; ".join(f"shot {i} repeats {d} shot {j} ({k}/5: {', '.join(g)})" for i, j, k, g in hits)
        if len(hits) >= FAIL_SLOTS:
            problems.append(
                f"{len(hits)} of {len(new)} shots re-run {d}'s shot grammar slot for slot, the template "
                f"read Gate 0B calls a relabel: {where}. Change the framing, pov, layout or motion of "
                f"those slots, or move them to a different place in the film.")
        elif len(hits) == FAIL_SLOTS - 1:
            warnings.append(f"{len(hits)} shots repeat {d}'s slot grammar ({where}); one more fails")
    return {"problems": problems, "warnings": warnings, "compared": compared}


# 11-12 v1 (git f74cba7 scripts/board_1112.py S rows) and 11-11 as shipped, five fields per shot.
_V1_1112 = [
    ("wide-establish", "eye-level-immersive", "single-object-void", "vertical-descent", "landscape-as-subject"),
    ("push-detail", "macro-closeup", "single-object-void", "scroll-data", "instrument-as-subject"),
    ("map-territory", "top-down-map", "map-territory", "radial-emanate", "data-as-subject"),
    ("push-detail", "macro-closeup", "fullbleed-split", "scroll-data", "instrument-as-subject"),
    ("subject-portrait", "cross-section-cutaway", "stacked-layers", "assemble-build", "structure-as-subject"),
    ("push-detail", "eye-level-immersive", "grid-modular", "horizontal-traverse", "data-as-subject"),
    ("wide-establish", "eye-level-immersive", "fullbleed-split", "vertical-descent", "structure-as-subject"),
    ("subject-portrait", "eye-level-immersive", "single-object-void", "horizontal-traverse", "instrument-as-subject"),
    ("alt-vantage", "eye-level-immersive", "single-object-void", "vertical-descent", "structure-as-subject"),
    ("push-detail", "instrument-screen", "hud-instrument-frame", "radial-emanate", "instrument-as-subject"),
    ("wide-establish", "orbital-aerial", "stacked-layers", "horizontal-traverse", "data-as-subject"),
    ("subject-portrait", "orbital-aerial", "single-object-void", "vertical-rise", "landscape-as-subject"),
]
_SHIPPED_1111 = [
    ("macro-closeup", "macro-closeup", "single-object-void", "horizontal-traverse", "instrument-as-subject"),
    ("push-detail", "eye-level-immersive", "single-object-void", "scroll-data", "instrument-as-subject"),
    ("map-territory", "top-down-map", "map-territory", "vertical-descent", "data-as-subject"),
    ("wide-establish", "orbital-aerial", "stacked-layers", "assemble-build", "structure-as-subject"),
    ("subject-portrait", "cross-section-cutaway", "single-object-void", "radial-emanate", "instrument-as-subject"),
    ("alt-vantage", "instrument-screen", "hud-instrument-frame", "radial-emanate", "data-as-subject"),
    ("push-detail", "cross-section-cutaway", "grid-modular", "assemble-build", "data-as-subject"),
    ("map-territory", "top-down-map", "map-territory", "radial-emanate", "multiplicity-swarm"),
    ("subject-portrait", "eye-level-immersive", "single-object-void", "vertical-descent", "instrument-as-subject"),
    ("wide-establish", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject"),
    ("alt-vantage", "instrument-screen", "hud-instrument-frame", "vertical-rise", "data-as-subject"),
    ("push-detail", "macro-closeup", "fullbleed-split", "scroll-data", "instrument-as-subject"),
    ("wide-establish", "orbital-aerial", "single-object-void", "vertical-rise", "landscape-as-subject"),
]


def _board(rows, date="2099-01-01"):
    return {"run_date": date, "shots": [dict(zip(AXES, r)) for r in rows]}


def self_test():
    ok = True

    def expect(name, cond):
        nonlocal ok
        print(("  ok   " if cond else "  FAIL ") + name)
        ok = ok and cond

    r = analyze(_board(_V1_1112), prior=[("2026-11-11", _board(_SHIPPED_1111))])
    expect("11-12 v1 fails against 11-11 (the board Gate 0B called a relabel)", len(r["problems"]) == 1)
    expect("it names the repeated slots, open half and button half",
           r["problems"] and "shot 2 repeats 2026-11-11 shot 2" in r["problems"][0]
           and "shot 12 repeats 2026-11-11 shot 13" in r["problems"][0])
    expect("a board does not repeat itself shifted by one", repeats(_V1_1112[1:] + _V1_1112[:1], _V1_1112) == [])
    two = [list(x) for x in _SHIPPED_1111]
    for k in range(len(two)):
        if k not in (1, 2):
            two[k][3] = "zoom-out"
            two[k][4] = "other-subject"
    w = analyze(_board([tuple(x) for x in two]), prior=[("d", _board(_SHIPPED_1111))])
    expect("two repeated slots warn and do not fail", not w["problems"] and len(w["warnings"]) == 1)
    expect("empty fields never count as equal",
           repeats([("", "", "", "", "x")], [("", "", "", "", "x")]) == [])
    expect("a board with no shots passes", analyze({"run_date": "2099-01-01"}, prior=[])["problems"] == [])
    print("template_slot_check self-test: " + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def history():
    """Every shipped board against its two predecessors. Exit 1 if any board other than 10-17
    (flagged by Gate 0B and 0D, see the docstring) fails, so a calibration drift shows."""
    bad = []
    for p in sorted(RUNS.glob("*/storyboard.json")):
        b = json.loads(p.read_text())
        b.setdefault("run_date", p.parent.name)
        r = analyze(b)
        flag = "FAIL" if r["problems"] else ("warn" if r["warnings"] else "ok")
        print(f"  {p.parent.name}: {flag}  " + ", ".join(f"{d} {n}" for d, n in r["compared"]))
        if r["problems"] and p.parent.name != "2026-10-17":
            bad.append(p.parent.name)
    print("template_slot_check history: " + ("FAIL " + ", ".join(bad) if bad else "PASS"))
    return 1 if bad else 0


def main():
    if "--self-test" in sys.argv:
        sys.exit(self_test())
    if "--history" in sys.argv:
        sys.exit(history())
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "out" / "dispatch" / "storyboard.json"
    r = analyze(json.loads(path.read_text()))
    for w in r["warnings"]:
        print("WARN " + w)
    for p in r["problems"]:
        print("FAIL " + p)
    print("template_slot_check: " + ", ".join(f"{d} {n} repeated" for d, n in r["compared"])
          + (" FAIL" if r["problems"] else " PASS"))
    sys.exit(1 if r["problems"] else 0)


if __name__ == "__main__":
    main()
