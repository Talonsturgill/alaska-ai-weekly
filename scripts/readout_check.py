#!/usr/bin/env python3
"""Fail a readout that counts a different clock from the instrument drawn beside it.

WHY (machine pass 2026-11-26; queue eased-readout-wrong-value). Ep1126 S9 drew a stopwatch whose
hand ran on an EASED progress, `sweep = lerp(0.5, 4.38, Easing.inOut(Easing.quad)(run))`, and printed
its readout from the RAW progress, `hrs = Math.min(4, Math.floor(5.2 * run))`. The two clocks agree
only at the ends: an ease-in-out lags the linear count at the start and leads it later, so the dial
and the number disagreed for most of the sweep, and the flow critic and seat 1 read "0 HR" sitting
under a hand that had already swept past the first hours (the 4 h 23 min beat). The run's fix was a
third constant (4.38 became 5.2), which moves where they disagree rather than removing it.

The rule: a number painted on screen counts the SAME value that draws the instrument. Derive it from
the drawn quantity (`Math.floor(sweep)` for revolutions, the needle's own value), never from the
progress that quantity was eased from.

What it reads, per scene body (`const S<n>: React.FC`) or component of the episode source:
  - a DRAWN variable D whose initializer applies an easing to a progress variable P
    (`Easing.<...>(P)`, `ease*(P ...)`, `spr(P ...)`, or `interpolate(P, ..., {easing ...})`);
  - a COUNT variable V whose initializer has `Math.floor(`/`Math.round(`/`Math.ceil(` over P (the
    raw progress, not D);
  - V painted on screen: inside a template literal `${V}`, a JSX text child `{V}`, or a variable that
    is itself painted and built from V.
Each such V is a FAIL naming the line, P and D. Exit 0 clean, 1 on a finding, 2 when no episode found.

    python3 scripts/readout_check.py [EPISODE.tsx ...]
    python3 scripts/readout_check.py --self-test
"""
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

DECL = re.compile(r"^\s*const\s+(\w+)\s*=\s*(.+?);\s*$", re.M)
ROUND = re.compile(r"Math\.(?:floor|round|ceil)\(")


def _bodies(src):
    """[(name, start_offset, body)] for every top-level `const Name: React.FC` or arrow component."""
    heads = [(m.group(1), m.start()) for m in re.finditer(r"^const (\w+)\s*(?::\s*React\.FC[^=]*)?=\s*\(", src, re.M)]
    out = []
    for i, (name, a) in enumerate(heads):
        out.append((name, a, src[a:heads[i + 1][1] if i + 1 < len(heads) else len(src)]))
    return out


def _eases(expr, var):
    v = re.escape(var)
    return bool(re.search(r"Easing\.[\w.]+(?:\([^()]*\))?\(\s*%s\b" % v, expr)
                or re.search(r"\b(?:ease\w*|spr|spring\w*)\(\s*%s\b" % v, expr)
                or (re.search(r"\binterpolate\(\s*%s\b" % v, expr) and "easing" in expr))


def _rounds_raw(expr, var):
    """True when a Math.floor/round/ceil call in expr reads `var` directly."""
    for m in ROUND.finditer(expr):
        i, depth = m.end(), 1
        while i < len(expr) and depth:
            depth += {"(": 1, ")": -1}.get(expr[i], 0)
            i += 1
        if re.search(r"\b%s\b" % re.escape(var), expr[m.end():i - 1]):
            return True
    return False


def _painted(body, var, decls, seen=None):
    seen = seen or set()
    if var in seen:
        return False
    seen.add(var)
    v = re.escape(var)
    # inside a template literal ${...var...}, or a bare JSX child {var}
    for m in re.finditer(r"\$\{([^}]*)\}", body):
        if re.search(r"\b%s\b" % v, m.group(1)):
            # a template inside a const that is not itself painted is followed through below
            line_start = body.rfind("\n", 0, m.start()) + 1
            dm = re.match(r"\s*const\s+(\w+)\s*=", body[line_start:m.start()])
            if not dm:
                return True
            if _painted(body, dm.group(1), decls, seen):
                return True
    if re.search(r">\s*\{\s*%s\s*\}" % v, body) or re.search(r"\{\s*%s\s*\}\s*<" % v, body):
        return True
    for name, expr in decls:
        if name != var and re.search(r"\b%s\b" % v, expr) and not expr.lstrip().startswith("`") and "${" not in expr:
            if re.search(r"['\"`]", expr) and _painted(body, name, decls, seen):
                return True
    return False


def check_source(path):
    src = open(path).read()
    findings = []
    for name, a, body in _bodies(src):
        decls = [(m.group(1), m.group(2)) for m in DECL.finditer(body)]
        names = {n for n, _ in decls}
        drawn = []          # (D, P)
        for d, expr in decls:
            for p in names:
                if p != d and _eases(expr, p):
                    drawn.append((d, p))
        if not drawn:
            continue
        for m in DECL.finditer(body):
            v, expr = m.group(1), m.group(2)
            if not ROUND.search(expr):
                continue
            for d, p in drawn:
                if v in (d, p) or not _rounds_raw(expr, p) or re.search(r"\b%s\b" % re.escape(d), expr):
                    continue
                if _painted(body, v, decls):
                    line = src.count("\n", 0, a + m.start()) + 1 + (1 if body[m.start()] == "\n" else 0)
                    findings.append((line, name, v, p, d))
                    break
    return findings


def default_targets():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from caption_band_check import default_targets as dt
    return dt()


def _self_test():
    import tempfile
    bad = """const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const run = clamp01(f / Math.max(1, b(21)));
  const sweep = lerp(0.5, 4.38, Easing.inOut(Easing.quad)(run));
  const hrs = Math.min(4, Math.floor(5.2 * run));
  const readout = run >= 1 ? '4 HR 23 MIN' : `${hrs} HR`;
  return <g><Stopwatch sweep={sweep} /><text>{readout}</text></g>;
};
"""
    good = bad.replace("Math.floor(5.2 * run)", "Math.floor(sweep)")
    direct = """const S3: React.FC<SceneProps> = ({p}) => {
  const t = clamp01(p.f / 60);
  const fill = ease(t, 0, 1);
  const pct = Math.round(100 * t);
  return <g><Bar w={fill} /><text x={1}>{pct}</text></g>;
};
"""
    unpainted = """const S4: React.FC<SceneProps> = ({p}) => {
  const t = clamp01(p.f / 60);
  const fill = ease(t, 0, 1);
  const n = Math.floor(6 * t);
  return <g>{Array.from({length: n}, (_, i) => <rect key={i} />)}<Bar w={fill} /></g>;
};
"""
    res = {}
    for k, body in (("bad", bad), ("good", good), ("direct", direct), ("unpainted", unpainted)):
        with tempfile.NamedTemporaryFile("w", suffix=".tsx", delete=False) as fh:
            fh.write(body)
        try:
            res[k] = check_source(fh.name)
        finally:
            os.remove(fh.name)
    assert [(n, v, p, d) for _l, n, v, p, d in res["bad"]] == [("S9", "hrs", "run", "sweep")], res["bad"]
    assert res["bad"][0][0] == 5, res["bad"]
    assert res["good"] == [], res["good"]
    assert [(v, p, d) for _l, _n, v, p, d in res["direct"]] == [("pct", "t", "fill")], res["direct"]
    assert res["unpainted"] == [], res["unpainted"]
    print("readout_check self-test: PASS (Ep1126 S9 shape caught at its line, the fixed form and an "
          "unpainted count clean)")
    return 0


def main(argv):
    if argv[:1] == ["--self-test"]:
        return _self_test()
    targets = argv or default_targets()
    if not targets:
        print("readout_check: no episode file found")
        return 2
    worst = 0
    for t in targets:
        for line, name, v, p, d in check_source(t):
            print(f"  FAIL {os.path.relpath(t, REPO)}:{line} {name}: `{v}` is painted from Math.floor/round of the raw "
                  f"progress `{p}`, while the instrument `{d}` draws an EASED `{p}`, so the number and the dial disagree "
                  f"for most of the move. Derive `{v}` from `{d}` (the drawn value), e.g. Math.floor({d})")
            worst = 1
    print("FAIL [readout] a painted count runs on a different clock from its instrument" if worst
          else f"PASS [readout] every painted count reads the value its instrument draws ({len(targets)} file(s))")
    return worst


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
