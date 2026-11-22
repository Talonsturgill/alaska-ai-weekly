#!/usr/bin/env python3
"""Text drawn under a `facing` mirror reads backwards. SOURCE GATE.

WHY THIS EXISTS (machine pass 2026-11-22, queue mirrored-hero-card). Ep1122 drew its hero Nix with
facing={-1} in shot 9, and lib/canary.tsx draws Nix's NO card inside the body group, whose transform
is scale(scale * facing, scale). So the card read "ON" backwards for 3.1 s. label_footprint caught it
on cut 4, after four renders, and the run fixed it in-run by counter-mirroring the card and flag
text. Every lib character that takes `facing` and draws a <text> inside its flipped body has the same
latent defect; it only shows on the first film that turns that character left.

So this reads the TSX and FAILS when a <text> sits under an odd number of facing mirrors: every
<g> (or <svg>, or the <text> itself) whose `transform` mentions both `facing` and `scale(` toggles
the mirror, which is how both the mirror (`scale(${scale * facing}, ...)`) and the counter-mirror
(`transform={`scale(${facing} 1)`}` or `facing < 0 ? `... scale(-1 1)` : undefined`) are written in
lib. A text under an even count reads the right way round at either facing.

It reads lib/*.tsx and the current episode (caption_band_check.default_targets). It can't see text
drawn by a child COMPONENT inside the flip (a <Plate> inside the body); keep copy components outside
the flipped group, which is also where FigureFinish wants them.

    python3 scripts/mirror_text_check.py [FILE.tsx ...]
    python3 scripts/mirror_text_check.py --self-test
Exit 0 clean, 1 a mirrored <text>, 2 nothing to read.
"""
import glob
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
LIB = os.path.join(REPO, "video-engine", "src", "lib")
REMEDY = ("counter-mirror it: give the <text> transform={`scale(${facing} 1)`} about its own x (the "
          "lib/canary.tsx card), or move it outside the flipped group")

TAG = re.compile(r"<(/?)(g|svg|text)(?=[\s>/])")


def _tag_end(src, i):
    """Index just past the '>' that closes the opening tag at src[i] == '<', and whether it
    self-closes. JSX attribute values hold arrow functions and comparisons, so a '>' only counts
    outside every brace, quote, template string and comment; the scanner keeps a stack of them."""
    stack, j, n = [], i + 1, len(src)
    while j < n:
        ch = src[j]
        top = stack[-1] if stack else None
        if top in ('"', "'"):
            if ch == top:
                stack.pop()
        elif top == "`":
            if ch == "\\":
                j += 1
            elif ch == "`":
                stack.pop()
            elif ch == "$" and src[j + 1:j + 2] == "{":
                stack.append("{")
                j += 1
        else:
            if top == "{" and src[j:j + 2] == "/*":
                k = src.find("*/", j + 2)
                j = n if k < 0 else k + 2
                continue
            if top == "{" and src[j:j + 2] == "//":
                k = src.find("\n", j)
                j = n if k < 0 else k + 1
                continue
            if ch == "{":
                stack.append("{")
            elif ch == "}":
                if stack:
                    stack.pop()
            elif ch == "`":
                stack.append("`")
            elif ch == '"' and top is None:
                stack.append('"')
            elif ch == "'" and top == "{":
                stack.append("'")
            elif ch == '"' and top == "{":
                stack.append('"')
            elif ch == ">" and not stack:
                return j + 1, src[j - 1] == "/"
        j += 1
    return n, False


def _flips(opening):
    m = re.search(r"\btransform=", opening)
    if not m:
        return False
    rest = opening[m.end():]
    return "facing" in rest and "scale(" in rest


def analyze(src):
    """[(line, snippet)] for each <text> under an odd number of facing mirrors."""
    hits, stack, i = [], [], 0
    while True:
        m = TAG.search(src, i)
        if not m:
            break
        closing, name = m.group(1) == "/", m.group(2)
        if closing:
            for k in range(len(stack) - 1, -1, -1):
                if stack[k][0] == name:
                    del stack[k:]
                    break
            i = m.end()
            continue
        end, selfclose = _tag_end(src, m.start())
        opening = src[m.start():end]
        flip = _flips(opening)
        if name == "text":
            parity = (sum(1 for _, f in stack if f) + (1 if flip else 0)) % 2
            if parity:
                line = src.count("\n", 0, m.start()) + 1
                hits.append((line, re.sub(r"\s+", " ", opening)[:110]))
        if not selfclose:
            stack.append((name, flip))
        i = end
    return hits


def _self_test():
    cases = [
        ("""<g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}>
              <text x={0} y={-35} fontSize={26}>{shown}</text></g>""", 1),          # the 11-22 card
        ("""<g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}>
              <text x={0} y={-35} transform={`scale(${facing} 1)`}>{shown}</text></g>""", 0),  # the fix
        ("""<g transform={`scale(${s * facing},${s})`}>{a > b && <g transform={`scale(${facing},1)`}>
              <text>OK</text></g>}<text transform={facing < 0 ? `translate(9 0) scale(-1 1)` : undefined}>F</text></g>""", 0),
        ("""<g transform={`scale(${s * facing},${s})`}><g opacity={x > 1 ? 1 : 0}><text>NO</text></g></g>
            <text>outside</text>""", 1),
        ("""<g transform={`translate(${x},${y})`}><text>{facing > 0 ? 'R' : 'L'}</text></g>""", 0),
    ]
    bad = []
    for k, (src, want) in enumerate(cases):
        got = len(analyze(src))
        if got != want:
            bad.append(f"case {k}: {got} hits, want {want}")
    for b in bad:
        print("  " + b)
    print("mirror_text_check self-test:", "FAIL" if bad else "PASS")
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
        print("mirror_text_check: nothing to read")
        return 2
    n = 0
    for t in targets:
        rel = os.path.relpath(t, REPO)
        for line, snip in analyze(open(t).read()):
            n += 1
            print(f"  FAIL  {rel}:{line}: <text> under a facing mirror reads backwards at facing -1: {snip}")
    if n:
        print(f"FAIL [mirror_text_check] {n} <text> drawn under a facing mirror. {REMEDY}")
        return 1
    print(f"PASS [mirror_text_check] {len(targets)} file(s), no <text> under a facing mirror")
    return 0


if __name__ == "__main__":
    sys.exit(main())
