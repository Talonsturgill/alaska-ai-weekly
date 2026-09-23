#!/usr/bin/env python3
"""THE THREE-WAY SHOT CONFORMANCE REPORT — who is wrong, the board or the engine?

WHY THIS EXISTS (2026-09-23, carried forward as the 2026-09-19 run's own handoff).

Two gates read the same field, `beat["shot"]`, from opposite ends, and last run they
deadlocked on it:

  - `strip_name_check.py` says a beat's `shot` must equal the `n === k` branch that
    ANIMATES it, or the evidence strip is named for another shot's action.
  - `say_it_show_it_check.py` says a shot's beats must quote VO lines inside that shot's
    own span, or the picture is about a different part of the script than the words
    playing over it.

On 2026-09-19 strip_name_check was red on nine beats. The run refiled 22 beats' `shot`
fields by hand to match the engine, which turned say_it_show_it red, so it reverted the
lot and handed the conflict forward. That looked like the two gates contradicting each
other. They do not. THE RUN WAS FIXING THE WRONG SIDE.

The board's `shot` field is what decides WHICH WORDS PLAY OVER THE BEAT, because
say_it_show_it derives each shot's VO span from the shot anchors and then asks which
beats were authored against those lines. So when the engine animates a beat in a
different branch than the board files it under, the ENGINE is drawing the picture during
the wrong narration. Refiling the board to match it does not fix the film. It relabels
the defect and then breaks the gate that was describing it correctly.

WHAT THIS PRINTS. For every beat, three answers to one question:

    BOARD   the shot the storyboard files the beat under
    ENGINE  the `n === k` branch that actually animates it (q/pop/at), if scenes exist
    SCRIPT  the shot whose VO span contains the line the beat was authored against

and then the verdict for each disagreement, with the remedy named rather than implied:

    BOARD != SCRIPT   the board is misfiled, or the shot anchors moved under it.
                      Refile the beat or re-anchor the shot. Cheap, no render.
    BOARD != ENGINE   the engine draws it during the wrong words. MOVE THE ENGINE CODE
                      into the branch the board names. Do NOT refile the board to match
                      the engine: that is the 2026-09-19 deadlock and it ships a film
                      whose pictures are a shot out of step with its narration.

RUN IT AT GATE 0A, BEFORE ANY SCENE CODE EXISTS. With no episode on disk it reports the
BOARD vs SCRIPT half alone and says so, which is the half you can fix for free. Run it
again after the scenes are authored and it fills in the ENGINE column. The whole point of
the early run is that conforming a board costs nothing and conforming a shipped cut costs
a render that the ship gate has already bound.

    python3 scripts/shot_conform_check.py             # exit 1 on any disagreement
    python3 scripts/shot_conform_check.py --print     # report only, always exit 0
    python3 scripts/shot_conform_check.py --named-only # only beats an evidence strip names
"""
import argparse
import json
import os
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(REPO, "out", "dispatch")
sys.path.insert(0, os.path.join(REPO, "scripts"))


def _norm(s):
    return " ".join(str(s or "").split()).strip().lower()


def _toks(s):
    return {w.strip(".,?!\"'") for w in _norm(s).split() if len(w) > 2}


def _same(a, b):
    """Same content test as say_it_show_it_check, deliberately identical.

    A conformance report that disagreed with the gate it is reconciling would be one
    more opinion to arbitrate. It uses the same 0.45 Jaccard floor so a beat this file
    calls on-script is exactly a beat that file calls on-script."""
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


def script_shot_of(beat_vo, shots, spans_, lines):
    """The shot whose VO span contains the line this beat was authored against."""
    hits = []
    for (lo, hi), sh in zip(spans_, shots):
        for t in lines[lo:hi]:
            if _same(beat_vo, t):
                hits.append(sh.get("id"))
                break
    if len(hits) == 1:
        return hits[0], None
    if not hits:
        return None, "no shot's lines match this beat's vo text"
    return hits[0], f"matches {len(hits)} shots ({', '.join(str(h) for h in hits)}), ambiguous"


def engine_shots(board):
    """beat id -> the `n === k` branch that animates it, or None if no episode yet."""
    try:
        import strip_name_check as snc
    except Exception as e:                                    # pragma: no cover
        return None, f"could not import strip_name_check ({e})"
    path = snc.episode_path(board.get("run_date"))
    if not os.path.exists(path):
        return None, f"no episode on disk yet ({os.path.basename(path)})"
    try:
        return snc.shot_of_beat(open(path).read()), None
    except Exception as e:
        return None, f"could not parse {os.path.basename(path)} ({e})"


def named_beats():
    try:
        import build_evidence
        return {bid for _, bid, _ in build_evidence.MOVES}
    except Exception:
        return set()


def audit(board, lines, only_named=False):
    shots = board.get("shots") or []
    beats = board.get("beats") or []
    if not shots or not beats:
        return [], [], "storyboard has no shots or no beats to audit"

    anchors = [sh.get("vo_line") for sh in shots]
    if any(type(a) is not int for a in anchors):
        return [], [], "every shot needs an integer vo_line before this check can run"

    sp = spans(shots, len(lines))
    drawn, engine_note = engine_shots(board)
    named = named_beats()

    rows, problems = [], []
    for b in beats:
        bid = b.get("id")
        if only_named and bid not in named:
            continue
        board_shot = b.get("shot")
        script_shot, why = script_shot_of(b.get("vo"), shots, sp, lines)
        engine_shot = None if drawn is None else drawn.get(bid)
        rows.append({
            "beat": bid, "board": board_shot, "engine": engine_shot,
            "script": script_shot, "named": bid in named, "why": why,
        })

        if script_shot is not None and board_shot != script_shot:
            problems.append(
                f"beat {bid}: BOARD files it under shot {board_shot} but its vo text is a "
                f"line of shot {script_shot}.\n"
                f"      REMEDY: refile the beat to shot {script_shot}, or re-anchor the "
                f"shot if the split is what moved. No render needed.")
        elif script_shot is None and _norm(b.get("vo")):
            problems.append(
                f"beat {bid}: its vo text matches NO shot's lines ({why}). Either the "
                f"script was rewritten under the beat or the beat quotes a line that was "
                f"cut.\n"
                f"      REMEDY: re-author the beat's vo against the line it actually plays "
                f"under. No render needed.")

        if drawn is not None and bid in named:
            if engine_shot is None:
                problems.append(
                    f"beat {bid}: an evidence strip is named for it and NO shot animates "
                    f"it, so the pack photographs a moment the film never stages.\n"
                    f"      REMEDY: animate it in shot {board_shot}, or drop the strip.")
            elif engine_shot != board_shot:
                problems.append(
                    f"beat {bid}: BOARD says shot {board_shot}, ENGINE draws it in shot "
                    f"{engine_shot}. The picture lands during the wrong narration.\n"
                    f"      REMEDY: MOVE THE ENGINE CODE into the `n === {board_shot}` "
                    f"branch. Do NOT refile the board to shot {engine_shot} to quiet "
                    f"strip_name_check — that is the 2026-09-19 deadlock, and it turns "
                    f"say_it_show_it red because the board's shot field is what decides "
                    f"which words play over this beat.")

    return rows, problems, engine_note


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--print", dest="only_print", action="store_true",
                    help="report only, always exit 0")
    ap.add_argument("--named-only", action="store_true",
                    help="restrict to beats an evidence strip is named for")
    ap.add_argument("--board", default=os.path.join(OUT, "storyboard.json"))
    ap.add_argument("--script", default=os.path.join(OUT, "vo_script.json"))
    a = ap.parse_args()

    for p in (a.board, a.script):
        if not os.path.exists(p):
            print(f"shot_conform: {os.path.basename(p)} does not exist yet, nothing to check")
            return 0

    board = json.load(open(a.board))
    lines = [l["text"] for l in json.load(open(a.script))["lines"]]
    rows, problems, engine_note = audit(board, lines, only_named=a.named_only)

    print("shot conformance: BOARD (filed) vs ENGINE (animated) vs SCRIPT (words playing)")
    if engine_note:
        print(f"  ENGINE column unavailable: {engine_note}")
        print("  Reporting the BOARD vs SCRIPT half, which is the half that is free to fix.")
    print(f"  {'beat':>5}  {'board':>5}  {'engine':>6}  {'script':>6}  strip")
    for r in rows:
        eng = "-" if r["engine"] is None else r["engine"]
        scr = "?" if r["script"] is None else r["script"]
        ok = (r["script"] is None or r["board"] == r["script"]) and \
             (r["engine"] is None or r["engine"] == r["board"])
        print(f" {'  ' if ok else '!!'} {r['beat']:>5}  {r['board']:>5}  {eng:>6}  {scr:>6}"
              f"  {'named' if r['named'] else ''}")

    if a.only_print:
        return 0
    if problems:
        print()
        for p in problems:
            print(f"FAIL [shot_conform] {p}")
        print()
        print(f"shot_conform: {len(problems)} disagreement(s) across {len(rows)} beats.")
        print("  The board's shot field decides which words play over a beat. When the")
        print("  engine disagrees with it, move the ENGINE. When the script disagrees with")
        print("  it, move the BOARD. Never quiet one gate by feeding the other a lie.")
        return 1
    print(f"PASS [shot_conform] {len(rows)} beats, board, engine and script all agree")
    return 0


if __name__ == "__main__":
    sys.exit(main())
