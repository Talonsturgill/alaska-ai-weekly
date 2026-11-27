#!/usr/bin/env python3
"""A typed string wrapped by a fixed character count splits words. SOURCE GATE.

WHY THIS EXISTS (machine pass 2026-11-27, queue quote-slip-char-wrap). Ep1127 S9 typed Krause's
quote onto a slip and wrapped it with `[shown.slice(0, 22), shown.slice(22, 44), shown.slice(44)]`,
so the second row ended on W and the third began ERE. The judge called
it a hard blocker. text_fit measured each row as fitting, which it did: the defect is WHERE the row
breaks, not how wide it is, and no gate read that.

So this reads the TSX for a string constant (`const NAME = '...'` with a space in it) and every
`.slice(a, b)` with literal bounds taken of NAME, or of an alias typed from it
(`const shown = NAME.slice(0, ...)`), and FAILS a bound that falls between two letters or digits
of the full string, which is a word cut in half. Wrap at word boundaries instead: a ROWS array of
whole words revealed by a running count (the shipped Ep1127 S9 fix), or split on spaces.

    python3 scripts/typed_wrap_check.py [FILE.tsx ...]
    python3 scripts/typed_wrap_check.py --self-test
Exit 0 clean, 1 a mid-word cut, 2 nothing to read.
"""
import glob
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
LIB = os.path.join(REPO, "video-engine", "src", "lib")
REMEDY = ("wrap at word boundaries: a ROWS array of whole words revealed by a running character "
          "count, or split the string on spaces, never a fixed character slice")

CONST = re.compile(r"""\bconst\s+([A-Za-z_]\w*)\s*=\s*(['"`])((?:(?!\2)[^\\\n]|\\.)*)\2""")
ALIAS = re.compile(r"\bconst\s+([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\.slice\(\s*0\s*,")
SLICE = re.compile(r"\b([A-Za-z_]\w*)\.slice\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?\)")


def analyze(src):
    """[(line, name, bound, snippet)] for each literal slice bound that cuts a word in half."""
    consts = {m.group(1): m.group(3) for m in CONST.finditer(src) if " " in m.group(3)}
    alias = {m.group(1): m.group(2) for m in ALIAS.finditer(src) if m.group(2) in consts}
    out, seen = [], set()
    for m in SLICE.finditer(src):
        base = consts.get(m.group(1)) or consts.get(alias.get(m.group(1), ""))
        if base is None:
            continue
        for g in (m.group(2), m.group(3)):
            if g is None:
                continue
            n = int(g)
            line = src.count("\n", 0, m.start()) + 1
            if (0 < n < len(base) and base[n - 1].isalnum() and base[n].isalnum()
                    and (line, n) not in seen):
                seen.add((line, n))
                out.append((line, m.group(1), n, f"{base[max(0, n - 8):n]}|{base[n:n + 8]}"))
    return out


def _self_test():
    bad = []
    shipped_defect = (
        "const QUOTE = 'I WAS QUITE SURPRISED THAT THE PROJECTIONS WERE SO HIGH.';\n"
        "const shown = QUOTE.slice(0, Math.floor(type * QUOTE.length));\n"
        "const rows = [shown.slice(0, 22), shown.slice(22, 44), shown.slice(44)];\n")
    hits = analyze(shipped_defect)
    if [h[2] for h in hits] != [44]:   # 22 falls after "SURPRISED ", 44 splits W|ERE
        bad.append(f"the 11-27 S9 char wrap was not caught once, at 44 (W|ERE): {hits}")
    shipped_fix = (
        "const QUOTE = '\"QUITE SURPRISED\"';\n"
        "const shown = QUOTE.slice(0, Math.floor(type * QUOTE.length));\n"
        "const ROWS = ['\"QUITE', 'SURPRISED\"'];\n"
        "const rows = ROWS.map((r) => r.slice(0, k));\n")
    if analyze(shipped_fix):
        bad.append(f"the shipped word-row fix was flagged: {analyze(shipped_fix)}")
    clean = ("const T = 'ONE TWO THREE';\nconst a = T.slice(0, 3), b = T.slice(4, 7);\n"
             "const ID = 'abc';\nconst c = ID.slice(1, 2);\n")
    if analyze(clean):
        bad.append(f"word-boundary slices or a spaceless id were flagged: {analyze(clean)}")
    for b in bad:
        print("  FAIL " + b)
    print("typed_wrap_check self-test:", "FAIL" if bad else "PASS")
    return 1 if bad else 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if "--self-test" in argv:
        return _self_test()
    targets = [a for a in argv if not a.startswith("-")]
    if not targets:
        targets = sorted(glob.glob(os.path.join(LIB, "*.tsx")))
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        try:
            from caption_band_check import default_targets
            targets += [t for t in default_targets() if t not in targets]
        except Exception as e:  # the lib scan still stands on its own
            print(f"  NOTE  no episode target ({e}); lib only")
    if not targets:
        print("typed_wrap_check: nothing to read")
        return 2
    n = 0
    for t in targets:
        rel = os.path.relpath(t, REPO)
        for line, name, bound, snip in analyze(open(t).read()):
            n += 1
            print(f"  FAIL  {rel}:{line}: {name}.slice cuts a word at {bound} ({snip})")
    if n:
        print(f"FAIL [typed_wrap_check] {n} fixed-count slice bound(s) cut a word. {REMEDY}")
        return 1
    print(f"PASS [typed_wrap_check] {len(targets)} file(s), no typed string sliced mid-word")
    return 0


if __name__ == "__main__":
    sys.exit(main())
