#!/usr/bin/env python3
"""DENOMINATOR CHECK: a spoken or printed "N of M" must use the denominator its claim pairs with N.

WHY THIS EXISTS (machine pass 2026-11-19; queue: denominator-check).
The 11-19 panel's only cut-1 hard blocker was "69 of 3,648". Claim c45 says the upgrade converts
3,648 routers and, per the contractor, 400 are installed with 69 operational. So 69 belongs to the
400 installed, and "69 of 3,648" told the viewer the network was dark. vo_claims_check and the 0F
editor both passed it, because every number on the plate was in the cited claim. Each number was
sourced; the RATIO was not.

The check is mechanical and narrow. For every "N of M" ("N out of M", "N of the M", and on a board a
plate reading "OF M" right after a plate ending in N), where both N and M appear in a cited claim:
  PASS  the claim itself states N of M, or
  PASS  no other number in the claim lies strictly between N and M, so M is the nearest set N fits in;
  FAIL  the claim carries a number K with N < K < M (400 between 69 and 3,648). N belongs to K, and
        "N of M" skips a set. Say "N of K", or name M as a different set ("of K installed, M planned").
Years, ordinals, percentages and dollar amounts are not set sizes and are ignored as K.

Used by vo_claims_check (every narration line against the claims it cites) and board_claims_check
(each VO line's plates, in order, plus its narration, against the beats' claims).

    python3 scripts/denominator_check.py --self-test
"""
import re
import sys

UNITS = {"zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
         "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
         "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19}
TENS = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80,
        "ninety": 90}
SCALES = {"hundred": 100, "thousand": 1000, "million": 10**6, "billion": 10**9}
TOKEN = re.compile(r"\$?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:%|st|nd|rd|th)?|[a-z]+(?:-[a-z]+)*|·|[^\sa-z\d]", re.I)


def _digits(tok):
    """(value, is_set_size) for a digit token, or None."""
    m = re.fullmatch(r"(\$?)(\d[\d,]*(?:\.\d+)?)(%|st|nd|rd|th)?", tok, re.I)
    if not m:
        return None
    raw = m.group(2)
    try:
        val = float(raw.replace(",", ""))
    except ValueError:
        return None
    is_size = not (m.group(1) or m.group(3) or ("," not in raw and "." not in raw and 1900 <= val <= 2100))
    return val, is_size


def numbers(text):
    """[(value, is_set_size, start_token, end_token)] over a tokenized text; spelled numbers joined."""
    toks = [t.lower() for t in TOKEN.findall(str(text or ""))]
    out, i = [], 0
    while i < len(toks):
        d = _digits(toks[i])
        if d is not None:
            val, size = d
            j = i + 1
            if j < len(toks) and toks[j] in ("million", "billion", "thousand"):
                val *= SCALES[toks[j]]
                j += 1
            nxt = toks[j] if j < len(toks) else ""
            if nxt in ("percent", "per") or (j > i and nxt == "cent"):
                size = False
            out.append((val, size, i, j))
            i = j
            continue
        parts = toks[i].split("-")
        if all(p in UNITS or p in TENS for p in parts):
            total, cur, j = 0, 0, i
            while j < len(toks):
                t = toks[j]
                ps = t.split("-")
                if all(p in UNITS or p in TENS for p in ps):
                    for p in ps:
                        cur += UNITS.get(p, TENS.get(p, 0))
                elif t in SCALES and (cur or total):
                    if t == "hundred":
                        cur *= 100
                    else:
                        total += cur * SCALES[t]
                        cur = 0
                elif t == "and" and j + 1 < len(toks) and (toks[j + 1].split("-")[0] in UNITS or
                                                            toks[j + 1].split("-")[0] in TENS) and (cur or total):
                    pass
                else:
                    break
                j += 1
            val = total + cur
            nxt = toks[j] if j < len(toks) else ""
            size = nxt not in ("percent", "per") and not re.fullmatch(r"(st|nd|rd|th)", nxt)
            out.append((float(val), size, i, j))
            i = j
            continue
        i += 1
    return out, toks


def ratios(text):
    """[(N, M, said)] for each 'N [up to 3 words] of|out of [the|its|their|all] M' in text."""
    nums, toks = numbers(text)
    out = []
    for a in nums:
        for b in nums:
            if b[2] <= a[3]:
                continue
            between = toks[a[3]:b[2]]
            if any(t in ("·", ".", ",", ";", ":", "?", "!") for t in between):
                continue
            words = list(between)
            while words and words[-1] in ("the", "its", "their", "all", "those", "these"):
                words.pop()
            if words[-2:] == ["out", "of"]:
                pre = words[:-2]
            elif words[-1:] == ["of"]:
                pre = words[:-1]
            else:
                continue
            if len(pre) <= 3 and a[1] and b[1] and 0 < a[0] < b[0]:
                out.append((a[0], b[0], " ".join(toks[a[2]:b[3]])))
            break  # only the nearest following number pairs with a
    return out


def _fmt(v):
    return f"{int(v):,}" if float(v).is_integer() else f"{v:g}"


def problems(said_ratios, claim_texts, where):
    """FAIL lines for ratios whose denominator skips a set the claims name between N and M."""
    found = []
    for n, m, said in said_ratios:
        for cid, ctext in claim_texts:
            cnums = [v for v, size, _, _ in numbers(ctext)[0] if size]
            if n not in cnums or m not in cnums:
                continue
            if any(cn == n and cm == m for cn, cm, _ in ratios(ctext)):
                continue
            between = sorted({k for k in cnums if n < k < m})
            if between:
                k = between[-1]
                found.append(
                    f"{where}: {said!r} uses {_fmt(m)} as the denominator of {_fmt(n)}, but {cid} also carries "
                    f"{_fmt(k)}, a set between them. {_fmt(n)} belongs to {_fmt(k)}, so '{_fmt(n)} of {_fmt(m)}' "
                    f"skips a set and changes the story. Say '{_fmt(n)} of {_fmt(k)}', or name {_fmt(m)} as a "
                    f"different set ('of {_fmt(k)} ..., {_fmt(m)} ...'). (denominator_check, 2026-11-19 c45)")
                break
    return list(dict.fromkeys(found))


def claim_text(c):
    return " ".join(str(c.get(k) or "") for k in ("spoken", "on_screen", "verbatim_source"))


def plate_ratios(plates):
    """Ratios within each plate, plus a plate (or segment) opening 'OF M' after one ending in N."""
    out, prev = [], None
    for p in plates:
        p = str(p or "")
        out += ratios(p)
        segs = [s.strip() for s in re.split(r"\s*·\s*", p) if s.strip()]
        if prev is not None and segs:
            out += ratios(f"{prev} {segs[0]}") if re.match(r"(?i)^(of|out of)\b", segs[0]) else []
        for a, b in zip(segs, segs[1:]):
            if re.match(r"(?i)^(of|out of)\b", b):
                out += ratios(f"{a} {b}")
        # the number that a following "OF M" plate continues: the last number-bearing segment
        nums_segs = [s for s in segs if numbers(s)[0]]
        prev = nums_segs[-1] if nums_segs else prev
    seen, uniq = set(), []
    for r in out:
        if (r[0], r[1]) not in seen:
            seen.add((r[0], r[1]))
            uniq.append(r)
    return uniq


def _self_test():
    c45 = ("c45", "Per the contractor, the upgrade converts 3,648 routers, and 400 are installed with 69 "
                  "operational. 3,648 ROUTERS · 400 IN · 69 RUNNING · PER THE CONTRACTOR")
    checks = [
        (numbers("three thousand six hundred forty eight")[0][0][0] == 3648, "spelled 3,648 parses"),
        (numbers("sixty-nine")[0][0][0] == 69, "hyphenated sixty-nine parses"),
        ([v for v, s, _, _ in numbers("On November 13th, 2026, 45 percent and $400")[0] if s] == [],
         "ordinals, years, percentages and dollars are not set sizes"),
        (bool(problems(ratios("Per the contractor, just sixty nine of three thousand six hundred forty eight "
                              "routers were running."), [c45], "L16")), "the 11-19 cut-1 VO form fails"),
        (not problems(ratios("Per the contractor, just sixty nine of the four hundred new routers installed "
                             "were running."), [c45], "L16"), "the shipped 11-19 VO passes"),
        (bool(problems(plate_ratios(["69 RUNNING", "OF 3,648 · VIA SENATE COMMERCE DEMOCRATS"]), [c45], "b35")),
         "the 11-19 cut-1 plate pair fails"),
        (not problems(plate_ratios(["PER THE CONTRACTOR VIA SENATE COMMERCE DEMOCRATS",
                                    "69 RUNNING · PER THE CONTRACTOR", "OF 400 INSTALLED · 3,648 PLANNED"]),
                      [c45], "line 16"), "the shipped 11-19 plates pass"),
        (not problems(ratios("400 of 3,648 are installed"), [c45], "x"), "400 of 3,648 passes (nothing between)"),
        (not problems(ratios("69 of 3,648"), [("c9", "69 of 3,648 sites, out of 400 visited")], "x"),
         "a claim that states N of M itself passes"),
        (not problems(ratios("one of the 22 centers"), [("c1", "all 22 en route centers in 2026")], "x"),
         "a year in the claim is never K"),
        (not problems(ratios("69 of 3,648"), [("c2", "69 sites")], "x"), "M absent from the claim: not this check"),
        (ratios("69 RUNNING · OF 3,648") == [], "a segment break inside one plate is not a ratio by itself"),
        (len(plate_ratios(["69 RUNNING · OF 3,648"])) == 1, "but a segment opening OF M continues N"),
    ]
    bad = [msg for ok, msg in checks if not ok]
    for ok, msg in checks:
        print(("ok   " if ok else "FAIL ") + msg)
    print("denominator_check self-test:", "FAIL" if bad else f"PASS ({len(checks)} cases)")
    return 1 if bad else 0


if __name__ == "__main__":
    if sys.argv[1:2] == ["--self-test"]:
        sys.exit(_self_test())
    print(__doc__)
    sys.exit(0)
