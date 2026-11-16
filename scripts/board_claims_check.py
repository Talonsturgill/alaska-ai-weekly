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
  FAIL  (machine pass 2026-11-16) a DRAWN SHARE that misstates the beat's percentage. On a beat whose
        plate or phrase carries a percentage, `shows`/`draw` stating a drawn ratio ("4 in 20 out of
        step", "six of ten cards") must sit within 10 points of a percentage there (either the ratio
        or its complement, since "out of step" draws the rest); a quantifier (most, nearly all, a
        few, half) fails, because it leaves the count to the scene; and a drawn COUNT of things ("twenty lake polygons") with no ratio
        must say how many carry the share. On 11-16 the editor's two hard blockers on cut 1 were
        exactly this: 8 of 10 weather cards beside about 62 percent, 19 of 20 ducklings beside 82
        and 75. A board that states the ratio hands the scene its count; DISPATCH_STANDARD "A drawn
        count is a claim about a proportion" tells the scene to draw it.
  NOTE  the plate's content words found in none of its cited claims, for the author to read before
        the critics do. Advisory: framing words (ASKED, SAYS, POST) are legitimate.

    python3 scripts/board_claims_check.py [storyboard.json] [claims.json]
    python3 scripts/board_claims_check.py --self-test

Boards dated before 2026-11-11 are not checked (no shipped board before then carried claim ids).
The drawn-share check binds boards dated 2026-11-17 on; the shipped 11-16 board fails it at beat 14
("most stamped" beside about 62 percent, the beat its cut 1 drew as 8 of 10) when read as a later board.
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


NUM_WORDS = {"zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8,
             "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
             "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19,
             "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "hundred": 100}
_NUM = r"(\d+|" + "|".join(sorted(NUM_WORDS, key=len, reverse=True)) + r")"
# Percentages may be fractional; counts and ratios above remain whole numbers.
_PCT_NUM = r"(\d+(?:\.\d+)?|\.\d+|" + "|".join(sorted(NUM_WORDS, key=len, reverse=True)) + r")"
PCT_RE = re.compile(r"(?<![\w.])" + _PCT_NUM + r"\s*(?:%|percent\b)", re.I)
# "4 in 20", "four lakes in twenty", "6 of 10 cards", "3 out of 10": up to three words between
RATIO_RE = re.compile(r"\b" + _NUM + r"\b(?:\s+[a-z'-]+){0,3}?\s+(?:in|of|out of)\s+" + _NUM + r"\b", re.I)
COUNT_RE = re.compile(r"\b" + _NUM + r"\s+(?:[a-z'-]+\s+){0,2}?([a-z'-]+s)\b", re.I)
# quantifier -> the band of percentages it can honestly stand for
QUANT = [(r"\b(?:nearly|almost) (?:all|every)\b|\ball but (?:one|a few)\b", 80, 99),
         (r"\bmost\b|\bmajority\b|\bmore than half\b", 51, 95),
         (r"\bhalf\b", 40, 60), (r"\ba few\b|\bfew\b|\bhandful\b", 1, 35),
         (r"\bminority\b|\bless than half\b", 5, 49)]
SHARE_TOL = 10
FIRST_SHARE_DATE = "2026-11-17"


def _num(tok):
    tok = tok.lower()
    return int(tok) if tok.isdigit() else NUM_WORDS.get(tok)


def share_problems(b):
    """FAIL lines for a beat whose drawing states a share its percentage doesn't support."""
    d = b.get("draw") or {}
    pct_text = " ".join(str(x or "") for x in (d.get("annotation"), b.get("phrase")))
    pcts = [v for v in (NUM_WORDS.get(m.group(1).lower()) if m.group(1).isalpha() else float(m.group(1))
                       for m in PCT_RE.finditer(pct_text)) if v is not None and 0 <= v <= 100]
    if not pcts:
        return []
    drawn = " ".join(str(x or "") for x in (b.get("shows"), d.get("subject"), d.get("action")))
    drawn = PCT_RE.sub(" ", drawn)  # a printed percentage is a label, not a count
    share = d.get("share") if isinstance(d.get("share"), dict) else None
    ratios = []
    if share and share.get("of"):
        ratios.append((float(share.get("drawn") or 0), float(share["of"]), "draw.share"))
    for m in RATIO_RE.finditer(drawn):
        k, n = _num(m.group(1)), _num(m.group(2))
        if k is not None and n and 0 <= k <= n and n > 1 and (k, n) not in [(r[0], r[1]) for r in ratios]:
            ratios.append((k, n, m.group(0)))
    bid, want = b.get("id"), ", ".join(f"{p}%" for p in pcts)
    out = []
    if ratios:
        for k, n, said in ratios:
            share_pct = 100.0 * k / n
            if not any(min(abs(share_pct - p), abs(100 - share_pct - p)) <= SHARE_TOL for p in pcts):
                out.append(f"beat {bid} draws {said!r} ({share_pct:.0f} percent) beside {want}: a drawn count is a "
                           f"claim about a proportion. Draw a share within {SHARE_TOL} points "
                           f"(DISPATCH_STANDARD: a drawn count is a claim about a proportion)")
        return out
    low = drawn.lower()
    for pat, lo, hi in QUANT:
        m = re.search(pat, low)
        if m:
            # Even a fitting word fails: "most stamped" beside about 62 percent was drawn as 8 of 10 on
            # 11-16. A word leaves the count to the scene; the board names it.
            fits = any(lo <= p <= hi or lo <= 100 - p <= hi for p in pcts)
            out.append(f"beat {bid} draws {m.group(0).upper()!r} beside {want}"
                       + ("" if fits else f", which that word can't stand for ({lo} to {hi} percent)")
                       + ". A word leaves the count to the scene: state the drawn ratio in shows (e.g. '6 of 10')")
            return out
    for m in COUNT_RE.finditer(drawn):
        n = _num(m.group(1))
        if n and n >= 3:
            out.append(f"beat {bid} draws {m.group(0)!r} beside {want} without saying how many carry the share. "
                       f"Write it in shows as 'K of {n}' so the scene draws the claim's proportion")
            break
    return out


def analyze(sb, claims):
    """{'problems': [...], 'notes': [...], 'checked': n, 'skipped': reason or ''}"""
    date = str(sb.get("run_date") or "")
    if date and date < FIRST_DATE:
        return {"problems": [], "notes": [], "checked": 0, "skipped": f"board dated {date}"}
    by_id = {c.get("id"): c for c in (claims.get("claims") if isinstance(claims, dict) else claims) or []}
    problems, notes, checked = [], [], 0
    for b in sb.get("beats") or []:
        if not date or date >= FIRST_SHARE_DATE:
            problems += share_problems(b)
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
    def sbeat(shows, ann, phrase="", **draw):
        return {"run_date": "2026-11-17", "beats": [
            {"id": 1, "shows": shows, "phrase": phrase, "claims": ["narration"],
             "draw": {"subject": "", "action": shows, "annotation": ann, **draw}}]}
    share_cases = [
        ("ten cards with no ratio beside 62 percent fails",
         sbeat("the thermometer drops ten cards, eight stamped with a weather mark", "ABOUT 62% OF LABELS"), 1),
        ("eight of ten cards beside 62 percent fails",
         sbeat("eight of ten cards carry a weather mark", "ABOUT 62% OF LABELS"), 1),
        ("6 of 10 beside 62 percent passes", sbeat("6 of 10 cards carry a weather mark", "ABOUT 62% OF LABELS"), 0),
        ("19 of 20 beside 82 and 75 fails",
         sbeat("nineteen of twenty lakes fall into step", "ICE OUT 82% · ICE ON 75%"), 1),
        ("4 in 20 out of step beside 82 passes (complement)",
         sbeat("the line falls into step, about four lakes in twenty out of step", "TEMPERATURE MODEL", "82 percent of lakes,"), 0),
        ("nearly all beside 62 fails", sbeat("nearly all the cards carry a mark", "ABOUT 62% OF LABELS"), 1),
        ("most beside 62 still owes a ratio", sbeat("most cards stamped with a mark", "ABOUT 62% OF LABELS"), 1),
        ("a bare count beside a percentage fails", sbeat("twenty lake polygons waddle into a line", "82% OF LAKES"), 1),
        ("no percentage, no check", sbeat("nineteen of twenty lakes fall into step", "THE LINE"), 0),
        ("a printed 94% is a label, not a count", sbeat("a report card drops onto an easel with a big 94%", "94% AGREEMENT"), 0),
        ("draw.share is checked", sbeat("the cards fan out", "ABOUT 62% OF LABELS", share={"drawn": 9, "of": 10}), 1),
    ]
    share_cases += [
        ("decimal percent valid drawing passes", sbeat("6 of 10 cards", "62.5%"), 0),
        ("decimal percent incorrect drawing fails", sbeat("1 of 20 cards", "62.5%"), 1),
        ("decimal percent word in phrase passes", sbeat("6 of 10 cards", "THE SHARE", "62.5 percent"), 0),
        ("decimal complement passes", sbeat("4 of 10 cards", "62.5%"), 0),
        ("historical fractional value passes", sbeat("4 of 20 cards", "20.95%"), 0),
        ("historical decimal suffix cannot pass", sbeat("19 of 20 cards", "20.95%"), 1),
        ("leading decimal consumes full token", sbeat("1 of 200 cards", ".5%"), 0),
        ("word percent remains supported", sbeat("1 of 2 cards", "FIFTY percent"), 0),
        ("fraction preserved at tolerance edge", sbeat("1 of 2 cards", "60.1%"), 1),
        ("decimal printed label is not count", sbeat("a card with 62.5%", "62.5%"), 0),
    ]
    share_cases += [
        ("zero percent incorrect drawing fails", sbeat("5 of 10 cards", "0%"), 1),
        ("decimal zero incorrect drawing fails", sbeat("5 of 10 cards", "0.0%"), 1),
        ("zero percent phrase is checked", sbeat("5 of 10 cards", "THE SHARE", "0 percent"), 1),
        ("word zero percent is checked", sbeat("5 of 10 cards", "ZERO percent"), 1),
        ("zero numerator passes", sbeat("0 of 10 cards", "0%"), 0),
        ("word zero numerator passes", sbeat("zero of ten cards", "zero percent"), 0),
        ("zero complement remains supported", sbeat("10 of 10 cards", "0%"), 0),
        ("zero still rejects a quantifier", sbeat("most cards stamped", "0%"), 1),
        ("zero still requires a count ratio", sbeat("ten cards", "0%"), 1),
        ("hundred percent passes", sbeat("10 of 10 cards", "100%"), 0),
        ("hundred percent incorrect drawing fails", sbeat("5 of 10 cards", "100%"), 1),
        ("zero tolerance edge passes", sbeat("1 of 10 cards", "0%"), 0),
        ("outside zero tolerance fails", sbeat("2 of 10 cards", "0%"), 1),
    ]
    for name, sb, want in share_cases:
        got = analyze(sb, claims)["problems"]
        if len(got) != want:
            bad.append(f"{name}: got {len(got)} {got}")
    cases += share_cases
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
        print(f"PASS [board_claims] {r['checked']} plates cite a claim, every status word backed, every drawn share fits its percentage")
    return 1 if r["problems"] else 0


if __name__ == "__main__":
    sys.exit(main())
