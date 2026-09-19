#!/usr/bin/env python3
"""SAY IT, SHOW IT — does each shot DRAW what its own lines SAY?

WHY THIS EXISTS (2026-09-19). The routine already carries the lesson, in
prompts/dispatch_routine.md under "RE-SOLVING THE SHOT MAP INVALIDATES THE SCENE
ART": the moment you re-solve the shot anchors, every scene downstream is cutting
to different words, and nothing in the toolchain says so. tsc is clean,
build_scenes runs, the render succeeds, and the film is simply about the wrong
things. On 2026-08-06 that cost a full render. On 2026-09-19 it happened again
inside a single run: a shot map solved purely for even durations produced
beautiful 7-to-13 second shots and broke say-it-show-it on five of twelve.

Both times the defect was caught by a person reading a table. `build_scenes.py`
only validates that the anchors are integers and increase. Nothing compared what
a shot DRAWS against what its lines SAY. This is that comparison, as a program.

THE CHECK. A storyboard shot owns a span of VO lines, from its own `vo_line`
anchor up to the next shot's. It also owns the beats whose `shot` is its id, and
every beat carries the `vo` text it was authored against. So:

    a shot PASSES when at least one of its beats quotes a line inside its span.

That is deliberately the weakest useful question, because the weakest question is
the one that was going unasked. It cannot tell you a scene is good. It can tell
you a scene is about a different part of the script than the words playing over
it, which is the failure that actually happens.

It prints the table the routine already tells a run to read by hand, so a run
that wants the detail gets it for free.

    python3 scripts/say_it_show_it_check.py            # exit 1 on a mismatch
    python3 scripts/say_it_show_it_check.py --print    # table only, always exit 0
"""
import argparse
import json
import os
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(REPO, "out", "dispatch")


def _norm(s):
    return " ".join(str(s or "").split()).strip().lower()


def _toks(s):
    return {w.strip(".,?!\"'") for w in _norm(s).split() if len(w) > 2}


def _same(a, b):
    """Content overlap, not string equality.

    The first build of this check compared normalised strings exactly and lit up
    on eight of twelve shots, almost all of them because the SCRIPT had been
    edited after the beats were authored ("by next June" became "by June"). An
    exact match turns every ordinary rewrite into a false alarm, and a gate that
    cries wolf gets skipped. Token overlap tolerates an edit and still refuses a
    different subject, which is the distinction that matters."""
    ta, tb = _toks(a), _toks(b)
    if not ta or not tb:
        return False
    return len(ta & tb) / len(ta | tb) >= 0.45


def load():
    board = json.load(open(os.path.join(OUT, "storyboard.json")))
    script = json.load(open(os.path.join(OUT, "vo_script.json")))
    return board, [l["text"] for l in script["lines"]]


def spans(shots, n_lines):
    """Each shot owns [its anchor, the next shot's anchor)."""
    out = []
    for i, sh in enumerate(shots):
        lo = sh.get("vo_line")
        hi = shots[i + 1].get("vo_line") if i + 1 < len(shots) else n_lines
        out.append((lo, hi))
    return out


def audit(board, lines):
    shots = board.get("shots") or []
    beats = board.get("beats") or []
    if not shots or not beats:
        return ["storyboard has no shots or no beats to audit"], []
    anchors = [sh.get("vo_line") for sh in shots]
    if any(type(a) is not int for a in anchors):
        return ["every shot needs an integer vo_line before this check can run"], []

    by_shot = {}
    for b in beats:
        by_shot.setdefault(b.get("shot"), []).append(b)

    problems, table = [], []
    for (lo, hi), sh in zip(spans(shots, len(lines)), shots):
        sid = sh.get("id")
        owned = [_norm(t) for t in lines[lo:hi]]
        mine = by_shot.get(sid) or []
        quoting = [b for b in mine if any(_same(b.get("vo"), t) for t in owned)]
        elsewhere = [b for b in mine
                     if _norm(b.get("vo")) and not any(_same(b.get("vo"), t) for t in owned)]
        table.append({
            "shot": sid, "lines": f"L{lo}..L{hi - 1}", "beats": len(mine),
            "on_script": len(quoting), "off_script": len(elsewhere),
            "first_words": [" ".join(t.split()[:6]) for t in lines[lo:hi]],
        })
        if not mine:
            problems.append(
                f"shot {sid} (L{lo}..L{hi - 1}) has NO beats at all. Every shot is a "
                f"visual sentence somewhere; a shot with no beat is a held frame.")
            continue
        if not quoting:
            said = "; ".join(f'"{t[:46]}"' for t in lines[lo:hi]) or "(no lines)"
            drew = "; ".join(f'"{_norm(b.get("vo"))[:46]}"' for b in mine[:3])
            problems.append(
                f"shot {sid} covers L{lo}..L{hi - 1} and NOT ONE of its {len(mine)} beats "
                f"was authored against those lines.\n"
                f"      the words playing over it: {said}\n"
                f"      the words its beats were written for: {drew}\n"
                f"      Either re-anchor the shot or re-author the scene. This is the "
                f"2026-08-06 defect: the board was right and the wiring moved.")
    return problems, table


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--print", dest="only_print", action="store_true",
                    help="print the table and always exit 0")
    args = ap.parse_args()

    board, lines = load()
    problems, table = audit(board, lines)

    print("say-it-show-it: what each shot's lines SAY vs what its beats DRAW")
    for row in table:
        flag = "  " if row["on_script"] else "!!"
        print(f" {flag} shot {row['shot']:>2}  {row['lines']:<10} "
              f"beats {row['beats']:>2}  on-script {row['on_script']:>2}  "
              f"off-script {row['off_script']:>2}")
        for w in row["first_words"]:
            print(f"        | {w}")

    if args.only_print:
        return 0
    if problems:
        print()
        for p in problems:
            print(f"FAIL [say_it_show_it] {p}")
        return 1
    print(f"PASS [say_it_show_it] {len(table)} shots, every one drawing its own lines")
    return 0


if __name__ == "__main__":
    sys.exit(main())
