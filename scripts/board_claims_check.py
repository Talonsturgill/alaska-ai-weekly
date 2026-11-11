#!/usr/bin/env python3
"""Gate 0A: every plate the board writes cites the claim it shows. Runs inside storyboard_check.

WHY THIS EXISTS (machine pass 2026-11-11; queue: gate0-critic-rounds, repeat 2, 11-10 and 11-11).
Gate 0B, 0C and 0D took three to five critic rounds on 11-10 and three on 11-11, and the edits were
mostly board TEXT checked against the claims by hand. On 11-10 the editor and a judge caught a
metaphor printed as a fact (A QUEUE ALREADY FORMED) and DISPATCH_STANDARD gained "Every banner traces
to a claim" and "A sign is a status claim". On 11-11 the second board revision added a claim id to
every beat (no shipped board from 11-05 to 11-10 carried one, 0 of 191 annotated beats) and rewrote
the plates it then found unsupported: CLOSED-COURSE TESTS · ALASKA became THIS SEASON · ALASKA,
WAYMO STATEMENT became QUOTED BY TV STATION, the mile count gained ILLUSTRATIVE. Both checks are
mechanical, so they run before a critic is spent:

  FAIL  a beat whose `draw.annotation` (its plate) carries no `claims` list. A spoken framing line
        that asserts no fact (HOLD THAT THOUGHT, IS PAPER ENOUGH?) cites "narration", explicitly.
  FAIL  a cited claim id that claims.json does not have.
  FAIL  a STATUS word on a plate, outside a question, (CLOSED, APPROVED, BANNED, VALIDATED, NOW SERVING ...) whose stem
        appears in none of the beat's cited claims, or that cites only "narration". A status word is
        a statement about the world, never a framing device.
  NOTE  the plate's content words found in none of its cited claims, for the author to read before
        the critics do. Advisory: framing words (ASKED, SAYS, POST) are legitimate.

    python3 scripts/board_claims_check.py [storyboard.json] [claims.json]
    python3 scripts/board_claims_check.py --self-test

Boards dated before 2026-11-11 are not checked (no shipped board before then carried claim ids).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SB = ROOT / "out" / "dispatch" / "storyboard.json"
DEFAULT_CLAIMS = ROOT / "out" / "dispatch" / "claims.json"
FIRST_DATE = "2026-11-11"
NARRATION = "narration"

# Words that assert the state of the world: a decision, a verdict, a permission or a lifecycle stage.
STATUS = ("closed", "closes", "opened", "approved", "approval", "denied", "rejected", "granted",
          "banned", "ban", "allowed", "legal", "illegal", "passed", "failed", "voted", "signed",
          "launched", "live", "done", "final", "certified", "validated", "safe", "unsafe", "cleared",
          "licensed", "permitted", "permit", "completed", "complete", "cancelled", "canceled",
          "suspended", "blocked", "won", "guilty", "ruled", "ruling", "ordered", "serving", "expired",
          "proven", "confirmed", "official", "operating", "deployed")
STATUS_RE = re.compile(r"\b(" + "|".join(STATUS) + r")\b", re.I)
STOP = set("a an the and or of to in on at by for with from is are be it its this that these those "
           "not no yes how what why who when where which per vs".split())
FRAMING = set("asked asks says said say post posts quoted quote illustrative illustration what if "
              "expects claim question".split())


def stem(word):
    w = re.sub(r"'s$", "", word.lower().strip("'"))
    for suf in ("ation", "ing", "ed", "es", "s"):
        if w.endswith(suf) and len(w) - len(suf) >= 4:
            return w[: -len(suf)]
    return w


def claim_text(c):
    parts = [c.get("spoken") or "", c.get("on_screen") or ""]
    parts += [str(r) for r in (c.get("requires") or [])]
    return " ".join(parts).lower()


def analyze(sb, claims):
    """{'problems': [...], 'notes': [...], 'checked': n, 'skipped': reason or ''}"""
    date = str(sb.get("run_date") or "")
    if date and date < FIRST_DATE:
        return {"problems": [], "notes": [], "checked": 0, "skipped": f"board dated {date}"}
    by_id = {c.get("id"): c for c in (claims.get("claims") if isinstance(claims, dict) else claims) or []}
    problems, notes, checked = [], [], 0
    for b in sb.get("beats") or []:
        ann = str((b.get("draw") or {}).get("annotation") or "").strip()
        if not ann:
            continue
        checked += 1
        bid = b.get("id")
        cited = [str(x) for x in (b.get("claims") or [])]
        if not cited:
            problems.append(f"beat {bid} plate {ann!r} cites no claim. Add the claim id(s) it shows, or "
                            f"[\"{NARRATION}\"] for a spoken framing line that asserts no fact")
            continue
        unknown = [x for x in cited if x != NARRATION and x not in by_id]
        if unknown:
            problems.append(f"beat {bid} cites {', '.join(unknown)}, not in claims.json")
        text = " ".join(claim_text(by_id[x]) for x in cited if x in by_id)
        # A question asserts nothing (WHAT WOULD YOU WANT PROVEN?); each ' · ' segment is read alone.
        asserted = " · ".join(seg for seg in re.split(r"\s*·\s*", ann) if not seg.rstrip().endswith("?"))
        for m in STATUS_RE.finditer(asserted):
            w = m.group(1)
            if not text or stem(w) not in text:
                problems.append(f"beat {bid} plate {ann!r} says {w.upper()}, a status claim, and "
                                + ("cites only narration" if not text else
                                   f"none of {', '.join(x for x in cited if x in by_id)} says it")
                                + ". Write what the record says (DISPATCH_STANDARD: a sign is a status claim)")
        if text:
            words = [w for w in re.findall(r"[A-Za-z][A-Za-z'-]+", ann)
                     if w.lower() not in STOP and w.lower() not in FRAMING and len(w) > 2]
            loose = [w for w in words if stem(w.strip("'")) not in text]
            if loose:
                notes.append(f"beat {bid} plate {ann!r}: {', '.join(w.upper() for w in loose)} in none of "
                             f"{', '.join(x for x in cited if x in by_id)}")
    return {"problems": problems, "notes": notes, "checked": checked, "skipped": ""}


def _self_test():
    claims = {"claims": [
        {"id": "c1", "spoken": "The objection deadline passed on November 2nd.", "on_screen": None},
        {"id": "c2", "spoken": "The company says its sensors are validated to a weather limit.",
         "requires": ["validated limit"]},
        {"id": "c3", "spoken": "A study permit application is pending at FERC."}]}

    def board(*beats, date="2026-11-12"):
        return {"run_date": date, "beats": [
            {"id": i + 1, "draw": {"annotation": a}, **({"claims": c} if c is not None else {})}
            for i, (a, c) in enumerate(beats)]}

    cases = [
        ("uncited plate fails", board(("A QUEUE ALREADY FORMED", None)), 1),
        ("narration framing passes", board(("HOLD THAT THOUGHT", ["narration"])), 0),
        ("unknown id fails", board(("DEADLINE PASSED", ["c9"])), 2),
        ("status word backed passes", board(("DEADLINE PASSED", ["c1"]), ("VALIDATED LIMIT", ["c2"])), 0),
        ("status word unbacked fails", board(("CLOSED", ["c1"])), 1),
        ("status on narration fails", board(("NOW SERVING", ["narration"])), 1),
        ("status word not in cited claim fails", board(("PERMIT APPROVED", ["c3"])), 1),
        ("old board skipped", board(("CLOSED", None), date="2026-11-10"), 0),
        ("a question asserts nothing", board(("WHAT WOULD YOU WANT PROVEN?", ["narration"])), 0),
        ("a question segment does not shelter a status segment",
         board(("PROVEN? · APPROVED", ["narration"])), 1),
    ]
    bad = []
    for name, sb, want in cases:
        r = analyze(sb, claims)
        if len(r["problems"]) != want:
            bad.append(f"{name}: got {len(r['problems'])} problem(s) {r['problems']}")
    r = analyze(board(("SENSORS VALIDATED IN ALASKA", ["c2"])), claims)
    if r["problems"] or not any("ALASKA" in n for n in r["notes"]):
        bad.append(f"loose word note: {r}")
    print("board_claims_check self-test:", "FAIL " + "; ".join(bad) if bad else f"PASS ({len(cases) + 1} cases)")
    return 1 if bad else 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if argv[:1] == ["--self-test"]:
        return _self_test()
    sb_path = Path(argv[0]) if argv else DEFAULT_SB
    cl_path = Path(argv[1]) if len(argv) > 1 else DEFAULT_CLAIMS
    r = analyze(json.loads(sb_path.read_text()), json.loads(cl_path.read_text()))
    if r["skipped"]:
        print(f"PASS [board_claims] not checked: {r['skipped']} (before {FIRST_DATE})")
        return 0
    for n in r["notes"]:
        print(f"  NOTE [board_claims] {n}")
    for p in r["problems"]:
        print(f"FAIL [board_claims] {p}")
    if not r["problems"]:
        print(f"PASS [board_claims] {r['checked']} plates cite a claim, every status word backed")
    return 1 if r["problems"] else 0


if __name__ == "__main__":
    sys.exit(main())
