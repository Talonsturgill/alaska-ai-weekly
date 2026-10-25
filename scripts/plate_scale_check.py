#!/usr/bin/env python3
"""Fail a lettered sign-kit Plate drawn too small to read, from the episode source, before the render.

WHY THIS EXISTS (machine pass 2026-10-25; queue: plate-hero-clutter-on-small-sizes). The 10-25
film drew its hero, the faced Plate from lib/sign.tsx, at s 0.5 to 0.62 in three shots. Its
DATA CENTER lettering is 34 px in draw space, so it landed at 17 to 21 px, and all three seats
called it unreadable (Composition 6.8 to 7.5). No gate measures it: text_fit_check reads mono
<text> beside a rect and the episode Plate's call sites, not a lib component's own lettering.

WHAT IT DOES. It reads the episode's imports to find every local name bound to lib/sign's Plate
(`import {Plate as Sign} from './lib/sign'` makes it `Sign`; a namespace import makes it
`ns.Plate`), finds each JSX use, and FAILS one whose literal `s` is under PLATE_MIN_LETTERED_S
(read from lib/sign.tsx, 0.8) unless it passes `lettered={false}`. An `s` it can't evaluate (a
variable, a lerp) is printed as not measured, so coverage is never assumed.

HONEST LIMITS: it multiplies no parent transform (a Plate at s 0.9 inside a scale(0.5) group is
not seen), and it reads the episode only, never another file that renders a Plate.

Usage: python3 scripts/plate_scale_check.py [episode.tsx ...]     # default: this run's episode
       python3 scripts/plate_scale_check.py --self-test
"""
import ast
import operator
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
SIGN_LIB = os.path.join(REPO, "video-engine", "src", "lib", "sign.tsx")


def min_s():
    try:
        m = re.search(r"PLATE_MIN_LETTERED_S\s*=\s*([0-9.]+)", open(SIGN_LIB).read())
        return float(m.group(1)) if m else 0.8
    except OSError:
        return 0.8


def plate_names(src):
    """Local JSX names that resolve to lib/sign's Plate."""
    names = []
    for m in re.finditer(r"import\s*\{([^}]*)\}\s*from\s*['\"](?:\.\.?/)+lib/sign['\"]", src):
        for part in m.group(1).split(","):
            bits = part.strip().split()
            if bits and bits[0] == "Plate":
                names.append(bits[2] if len(bits) == 3 and bits[1] == "as" else "Plate")
    for m in re.finditer(r"import\s*\*\s*as\s+(\w+)\s+from\s*['\"](?:\.\.?/)+lib/sign['\"]", src):
        names.append(f"{m.group(1)}.Plate")
    return names


def jsx_tags(src, name):
    """(line, attribute text) for each <name ...> opening tag, braces balanced."""
    out = []
    for m in re.finditer(r"<" + re.escape(name) + r"(?=[\s/>])", src):
        i, depth, quote = m.end(), 0, None
        while i < len(src):
            c = src[i]
            if quote:
                if c == quote:
                    quote = None
            elif c in "\"'`" and depth == 0:
                quote = c
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
            elif c == ">" and depth == 0:
                break
            i += 1
        out.append((src.count("\n", 0, m.start()) + 1, src[m.end():i]))
    return out


def attr(attrs, key):
    """The raw value of `key=` in a JSX attribute string, or None."""
    m = re.search(r"(?<![\w.])" + re.escape(key) + r"\s*=\s*", attrs)
    if not m:
        return None
    i = m.end()
    if i < len(attrs) and attrs[i] in "\"'":
        j = attrs.index(attrs[i], i + 1)
        return attrs[i + 1:j]
    if i < len(attrs) and attrs[i] == "{":
        depth, j = 0, i
        while j < len(attrs):
            depth += attrs[j] == "{"
            depth -= attrs[j] == "}"
            if depth == 0:
                return attrs[i + 1:j].strip()
            j += 1
    return None


_OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv}


def evaluate(expr):
    """A number for a pure arithmetic literal expression, else None."""
    try:
        node = ast.parse(expr, mode="eval").body
    except SyntaxError:
        return None

    def ev(n):
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)):
            return float(n.value)
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.USub):
            v = ev(n.operand)
            return None if v is None else -v
        if isinstance(n, ast.BinOp) and type(n.op) in _OPS:
            a, b = ev(n.left), ev(n.right)
            return None if a is None or b is None else _OPS[type(n.op)](a, b)
        return None
    return ev(node)


def check_source(src, floor):
    fails, unmeasured, measured = [], [], 0
    for name in plate_names(src):
        for line, attrs in jsx_tags(src, name):
            lettered = attr(attrs, "lettered")
            if lettered is not None and lettered.strip() == "false":
                measured += 1
                continue
            raw = attr(attrs, "s")
            if raw is None:
                measured += 1           # the default s is 1
                continue
            v = evaluate(raw)
            if v is None:
                unmeasured.append((line, raw))
                continue
            measured += 1
            if v < floor:
                fails.append((line, v))
    return fails, unmeasured, measured


def _this_runs_episode():
    sys.path.insert(0, os.path.join(REPO, "scripts"))
    from caption_band_check import default_targets
    return default_targets()


def _self_test():
    src = ("import {Plate as Sign, Ruler} from './lib/sign';\n"
           "const A = () => <g>\n"
           "  <Sign x={1} s={0.62} f={g} mood=\"plain\" />\n"
           "  <Sign x={2} s={0.5} lettered={false} f={g} />\n"
           "  <Sign x={3} s={0.9} f={g} look={f > 3 ? 1 : 0} />\n"
           "  <Sign x={4} f={g} />\n"
           "  <Sign x={5} s={lerp(0.4, 1, k)} f={g} />\n"
           "  <Plate text=\"NOT THE LIB PLATE\" y={5} />\n"
           "</g>;\n")
    fails, unmeasured, measured = check_source(src, 0.8)
    assert fails == [(3, 0.62)], fails
    assert [u[0] for u in unmeasured] == [7], unmeasured
    assert measured == 4, measured
    assert plate_names("import * as sk from '../lib/sign';") == ["sk.Plate"]
    assert plate_names("import {Plate} from './lib/sign';") == ["Plate"]
    assert plate_names("import {Plate} from './lib/stack';") == []
    print("plate_scale_check self-test: PASS")
    return 0


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if "--self-test" in argv:
        return _self_test()
    files = argv or _this_runs_episode()
    floor = min_s()
    bad = 0
    for path in files:
        src = open(path).read()
        fails, unmeasured, measured = check_source(src, floor)
        rel = os.path.relpath(path, REPO)
        for line, raw in unmeasured:
            print(f"  not measured {rel}:{line}  s={{{raw}}} (not a literal; keep it at {floor} or more "
                  f"while lettered)")
        for line, v in fails:
            print(f"FAIL {rel}:{line}  lettered Plate at s {v:g}, under {floor} (its 34 px lettering lands "
                  f"at {34 * v:.0f} px): scale it to {floor} or pass lettered={{false}}")
        bad += len(fails)
        print(f"plate_scale_check: {rel}: {measured} lib Plate uses measured, {len(unmeasured)} not "
              f"measured, {len(fails)} failing")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
