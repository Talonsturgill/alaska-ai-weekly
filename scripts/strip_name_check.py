#!/usr/bin/env python3
"""Refuse an evidence strip named for something the film does not draw there.

WHY THIS EXISTS (2026-09-19, after it cost two panel rounds of the Motion axis).

The evidence pack names each motion filmstrip after a storyboard beat's choreography line,
and the panel reads that name as a promise about the frames underneath it. On this run the
board and the engine had drifted a whole shot apart from beat 10 onward, and nine beats the
board describes were not drawn by any shot at all. So `filmstrip_bar_overshoots_and_settles`
was cut at a beat the engine spends on a headline and a ghost outline, and three judges
across two rounds wrote, correctly and independently, that the strip named for an overshoot
contains no bar and the strip named for a character stepping contains no character. They
were right about the strip. The film was not the thing that was wrong.

That is the 2026-08-03 failure in a new coat: an artifact read BY NAME that looked plausible
and misrepresented the film, and the cost is the most expensive kind, because it is paid in
judge attention and in a score that then reads as a craft verdict.

WHAT THIS CHECKS. For every entry in build_evidence.MOVES it finds which `n === k` branch of
the episode animates that beat, through q(), pop() or at(), and compares the beat's own
storyboard `shot` field against it. A mismatch means the strip is named from a beat sheet
that no longer describes the picture. A beat no shot animates at all is worse: the pack will
photograph a moment the film never stages.

WHAT IT DOES NOT CHECK. It compares WHICH SHOT, not whether the named action is the one that
shot performs at that instant. A board can be shot-correct and still describe the wrong
gesture. This catches the structural drift, which is the failure that actually happened.
"""
import argparse
import json
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(REPO, "scripts"))


def episode_path(board_date):
    stamp = os.path.join(REPO, "out", "dispatch", ".run_stamp.json")
    comp = None
    if os.path.exists(stamp):
        comp = json.load(open(stamp)).get("composition")
    if comp:
        p = os.path.join(REPO, "video-engine", "src", comp.replace("Dispatch", "Ep") + ".tsx")
        if os.path.exists(p):
            return p
    guess = "Ep" + (board_date or "").replace("-", "")[4:] + ".tsx"
    return os.path.join(REPO, "video-engine", "src", guess)


def shot_of_beat(src):
    """beat id -> the first `n === k` branch that animates it."""
    body = src[src.index("let picture: React.ReactNode"):]
    marks = sorted([(int(m.group(1)), m.start())
                    for m in re.finditer(r"\(n === (\d+)\)", body)], key=lambda x: x[1])
    out = {}
    for i, (n, a) in enumerate(marks):
        b = marks[i + 1][1] if i + 1 < len(marks) else len(body)
        for m in re.finditer(r"\b(?:q|pop|at)\((\d+)", body[a:b]):
            out.setdefault(int(m.group(1)), n)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--board", default=os.path.join(REPO, "out", "dispatch", "storyboard.json"))
    ap.add_argument("--episode")
    a = ap.parse_args()

    board = json.load(open(a.board))
    src = open(a.episode or episode_path(board.get("run_date"))).read()
    drawn = shot_of_beat(src)

    import build_evidence
    named = {bid: name for name, bid, _ in build_evidence.MOVES}

    undrawn, misplaced = [], []
    for beat in board["beats"]:
        bid = beat["id"]
        if bid not in named:
            continue
        where = drawn.get(bid)
        if where is None:
            undrawn.append((bid, named[bid]))
        elif where != beat.get("shot"):
            misplaced.append((bid, named[bid], beat.get("shot"), where))

    for bid, name in undrawn:
        print(f"FAIL beat {bid} '{name}': no shot animates it, so the strip photographs a "
              f"moment the film never stages")
    for bid, name, said, real in misplaced:
        print(f"FAIL beat {bid} '{name}': the board files it under shot {said} and the engine "
              f"draws it in shot {real}, so the strip is named for another shot's action")

    bad = len(undrawn) + len(misplaced)
    print(f"strip_name_check: {len(named)} named strips, {bad} named for something the film "
          f"does not draw there")
    if bad:
        print("  A judge reads the strip NAME as a promise about the frames under it. When the")
        print("  two disagree the panel reports a move that did not happen, marks the Motion")
        print("  axis down for it, and the run reads that as a craft verdict. Fix the BOARD or")
        print("  the names, never the film, and never argue with the resulting score before")
        print("  this is green.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
