#!/usr/bin/env python3
"""Refuse a storyboard whose beats are filed under a shot that does not own their line.

WHY THIS EXISTS (2026-09-22, handed over by the 2026-09-19 run as its one instruction to
the next run).

Two gates read the same field and they had been pulling it in opposite directions:

  - `say_it_show_it_check.py` asks whether every SHOT owns at least one beat authored
    against a line inside that shot's own VO span.
  - `strip_name_check.py` asks whether every NAMED EVIDENCE STRIP's beat is animated by the
    engine branch the board files it under.

Both read `beat.shot`. On 2026-09-19 the board had drifted a shot away from the engine, so
strip_name_check was red on nine beats. Refiling those beats by hand turned say_it_show_it
red instead, because the refile moved beats out from under the shots whose lines they quote.
The run reverted, shipped, and wrote down that the two have to be conformed TOGETHER, at
Gate 0A, before a render can validate anything.

This is that conformance, and it runs where it is cheap. `beat.shot` is not a free field.
A shot owns a span of VO lines, so the shot a beat belongs to is DERIVABLE from the line the
beat was authored against, and the only correct value of `beat.shot` is the derived one.
When the board obeys that rule:

  - say_it_show_it passes by construction, because every beat quoting a line in a shot's
    span is filed under that shot;
  - strip_name_check reduces to an ENGINE question ("does branch n animate the beats the
    board filed under shot n"), which is the question it was written to ask and the one a
    person can act on without breaking the other gate.

So this gate is a SOURCE gate. It needs no frames, no engine and no render, it runs at
Gate 0A beside storyboard_check, and it is the thing that makes the pair satisfiable.

    python3 scripts/board_conform_check.py            # exit 1 on a misfiled beat
    python3 scripts/board_conform_check.py --print    # table only, always exit 0
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
    """Content overlap, deliberately the SAME test say_it_show_it_check uses.

    A second, stricter notion of "this beat quotes this line" would just move the
    disagreement from beat.shot into the matcher, which is the failure this file exists to
    end. 0.45 Jaccard tolerates an ordinary script edit and still refuses a different
    subject."""
    ta, tb = _toks(a), _toks(b)
    if not ta or not tb:
        return False
    return len(ta & tb) / len(ta | tb) >= 0.45


def spans(shots, n_lines):
    out = []
    for i, sh in enumerate(shots):
        lo = sh.get("vo_line")
        hi = shots[i + 1].get("vo_line") if i + 1 < len(shots) else n_lines
        out.append((lo, hi))
    return out


def owner_of_line(shots, n_lines, idx):
    for (lo, hi), sh in zip(spans(shots, n_lines), shots):
        if lo <= idx < hi:
            return sh.get("id")
    return None


def audit(board, lines):
    shots = board.get("shots") or []
    beats = board.get("beats") or []
    if not shots or not beats:
        return ["storyboard has no shots or no beats to audit"], []
    anchors = [sh.get("vo_line") for sh in shots]
    if any(type(a) is not int for a in anchors):
        return ["every shot needs an integer vo_line before this check can run"], []

    ids = [sh.get("id") for sh in shots]
    problems, table = [], []
    for b in beats:
        bid = b.get("id")
        said = b.get("shot")
        vo = b.get("vo")
        # Which line was this beat authored against? Prefer an explicit index when the board
        # carries one; otherwise match the text, which is what both sibling gates do.
        idx = b.get("vo_line")
        if type(idx) is not int:
            hits = [i for i, t in enumerate(lines) if _same(vo, t)]
            idx = hits[0] if len(hits) == 1 else (hits[0] if hits else None)
            ambiguous = len(hits) > 1
        else:
            ambiguous = False
        want = owner_of_line(shots, len(lines), idx) if idx is not None else None
        row = {"beat": bid, "line": idx, "filed": said, "derived": want,
               "vo": " ".join(_norm(vo).split()[:8])}
        table.append(row)

        if said not in ids:
            problems.append(
                f"beat {bid} is filed under shot {said!r}, which is not a shot in this "
                f"board. The shots are {ids}.")
            continue
        if idx is None:
            problems.append(
                f"beat {bid} quotes no VO line in this script. Its text is "
                f'"{row["vo"]}". A beat is a picture drawn WHILE a line is spoken, so a '
                f"beat matching no line is either stale copy or a line that got cut. Fix "
                f"the beat's `vo`, or give the beat an explicit integer `vo_line`.")
            continue
        if want != said:
            extra = " (its text matches more than one line, so give it an explicit " \
                    "integer `vo_line`)" if ambiguous else ""
            problems.append(
                f"beat {bid} is filed under shot {said} but its line L{idx} belongs to "
                f"shot {want}{extra}.\n"
                f'      the beat: "{row["vo"]}"\n'
                f"      Refile the beat to shot {want}, or move the shot anchor so shot "
                f"{said} owns L{idx}. Do NOT leave them disagreeing: say_it_show_it reads "
                f"this field to ask whether a shot draws its own lines, and "
                f"strip_name_check reads it to ask whether the engine animates the beat "
                f"where the board says. A wrong value makes one of them lie.")
    return problems, table


def load():
    board = json.load(open(os.path.join(OUT, "storyboard.json")))
    script = json.load(open(os.path.join(OUT, "vo_script.json")))
    return board, [l["text"] for l in script["lines"]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--print", dest="only_print", action="store_true",
                    help="print the table and always exit 0")
    args = ap.parse_args()

    board, lines = load()
    problems, table = audit(board, lines)

    print("board conformance: the shot each beat is FILED under vs the shot that owns its line")
    for row in table:
        flag = "  " if row["filed"] == row["derived"] else "!!"
        line = f"L{row['line']}" if row["line"] is not None else "L?"
        print(f" {flag} beat {str(row['beat']):>3}  {line:<5} filed shot {str(row['filed']):>3}"
              f"  derived shot {str(row['derived']):>3}  | {row['vo']}")

    if args.only_print:
        return 0
    if problems:
        print()
        for p in problems:
            print(f"FAIL [board_conform] {p}")
        print()
        print("  This gate runs BEFORE the engine exists on purpose. Conforming the board to "
              "itself here costs nothing. Conforming it at delivery costs a render and cannot "
              "be validated before the ship gate has bound the graded cut.")
        return 1
    print(f"PASS [board_conform] {len(table)} beats, every one filed under the shot that "
          f"owns its line")
    return 0


if __name__ == "__main__":
    sys.exit(main())
