#!/usr/bin/env python3
"""Print every beat gap of a storyboard against the never-rest ceiling and the metronome band.

WHY THIS EXISTS (machine pass 2026-10-28, queue item from 10-28 "The River It Never Saw", repeat 1).
Changing one VO sentence moved a beat seven seconds from its neighbour, and storyboard_check failed
on max_gap and METRONOME twice. Its flow block (scripts/flow_check.py) says how many gaps are over
and how long the worst run is, but not WHICH beats, so the author re-read the board by hand. The
run proposed a `board_1028.py gaps` view. This is that view for any board, so every episode's
generator gets it without a per-run copy.

It reads the same thresholds as the gate (config/visual_flow.yaml beats.max_gap_s, engagement
metronome_tol_s and metronome_max_run) and the beat starts the gate reads (flow_check.load_beats,
sorted by start), so its verdict is the gate's verdict on those two rules. One row per gap, with
OVER on a gap past the ceiling and METRO on every gap inside a run the gate fails.

    python3 scripts/beat_gaps.py [out/dispatch/storyboard.json] [--only-flagged]
    python3 scripts/beat_gaps.py --self-test

Exit 0 when both rules pass, 1 when either fails. It changes nothing and is safe to run between a
board generator and Gate 0A.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow_check  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DEFAULT = ROOT / "out" / "dispatch" / "storyboard.json"


def gap_rows(sb, cfg=None):
    """(rows, verdict). rows are dicts {a, b, t_a, t_b, gap, over, metro}; a and b are beat ids."""
    cfg = cfg or flow_check.CFG
    ceil = cfg["beats"]["max_gap_s"]
    eng = cfg.get("engagement") or {}
    tol, max_run = eng.get("metronome_tol_s", 0.4), eng.get("metronome_max_run", 2)
    beats, _ = flow_check.load_beats(sb)
    raw = sb.get("beats") or []
    timed = sorted(((b["t0"], raw[b["i"]].get("id", b["i"] + 1) if isinstance(raw[b["i"]], dict) else b["i"] + 1)
                    for b in beats if b["t0"] is not None))
    rows = []
    for (ta, a), (tb, b) in zip(timed, timed[1:]):
        g = round(tb - ta, 2)       # the gate rounds each gap to 0.01 s before comparing
        rows.append({"a": a, "b": b, "t_a": ta, "t_b": tb, "gap": g, "over": g > ceil, "metro": False})
    # A metronome run is consecutive gaps each within tol of the one before (flow_check's walk).
    # Mark every gap of a run longer than max_run.
    start, worst = 0, 1
    for i in range(1, len(rows) + 1):
        if i < len(rows) and abs(rows[i]["gap"] - rows[i - 1]["gap"]) <= tol:
            continue
        n = i - start
        worst = max(worst, n)
        if n > max_run:
            for r in rows[start:i]:
                r["metro"] = True
        start = i
    verdict = {"max_gap_s": ceil, "over": sum(r["over"] for r in rows), "metronome_tol_s": tol,
               "metronome_max_run": max_run, "metronome_worst_run": worst if rows else 0,
               "pass": not any(r["over"] or r["metro"] for r in rows)}
    return rows, verdict


def report(rows, verdict, only_flagged=False):
    out = [f"beat gaps: {len(rows)} gaps, ceiling {verdict['max_gap_s']} s, metronome band "
           f"+/-{verdict['metronome_tol_s']} s over more than {verdict['metronome_max_run']} gaps in a row"]
    for r in rows:
        flags = " ".join(f for f, on in (("OVER", r["over"]), ("METRO", r["metro"])) if on)
        if only_flagged and not flags:
            continue
        out.append(f"  beat {r['a']:>3} {r['t_a']:7.2f}s -> beat {r['b']:>3} {r['t_b']:7.2f}s  "
                   f"gap {r['gap']:5.2f}s  {flags}".rstrip())
    out.append(f"{'PASS' if verdict['pass'] else 'FAIL'}: {verdict['over']} gap(s) over the ceiling, "
               f"worst metronome run {verdict['metronome_worst_run']} gaps")
    if not verdict["pass"]:
        out.append("  Fix an OVER gap with a beat inside it (re-anchor a beat to a word in that window), "
                   "and a METRO run by moving one beat of it off the shared interval by more than the band.")
    return "\n".join(out)


def self_test():
    ok = True

    def expect(name, cond):
        nonlocal ok
        print(("  ok   " if cond else "  FAIL ") + name)
        ok = ok and cond

    def board(starts):
        return {"beats": [{"id": i + 1, "t": f"{s}-{s + 1}", "vo": "", "shows": "", "sfx": "", "means": ""}
                          for i, s in enumerate(starts)]}

    rows, v = gap_rows(board([0, 2.5, 6.1, 13.2, 16.0]))
    expect("a 7.1 s gap is OVER and names beats 3 and 4",
           [(r["a"], r["b"]) for r in rows if r["over"]] == [(3, 4)] and not v["pass"])
    rows, v = gap_rows(board([0, 3.0, 6.1, 9.0, 12.2, 14.0]))
    expect("four gaps of about 3 s are one METRO run of four",
           [r["metro"] for r in rows] == [True, True, True, True, False] and v["metronome_worst_run"] == 4)
    rows, v = gap_rows(board([0, 3.0, 6.1, 8.0, 12.0]))
    expect("two equal gaps then a change is legal", v["pass"] and not any(r["metro"] for r in rows))
    rows, v = gap_rows(board([4.0, 0.0, 2.5]))
    expect("beats are read in start order, as the gate reads them", [(r["a"], r["b"]) for r in rows] == [(2, 3), (3, 1)])
    # The gate's own verdict on the shipped boards must match this one on both rules.
    agree, n = True, 0
    for f in sorted((ROOT / "runs").glob("2026-10-*/storyboard.json")):
        sb = json.loads(f.read_text())
        if not sb.get("beats") or not isinstance(sb["beats"][0], dict):
            continue
        _, v = gap_rows(sb)
        R = flow_check.analyze(str(f.parent))          # the gate itself, not a copy of its arithmetic
        gate_pass = not [p for p in R["problems"] if p.startswith(("max_gap", "METRONOME"))]
        agree = agree and gate_pass == v["pass"] and R["metrics"].get("metronome_worst_run") == v["metronome_worst_run"]
        n += 1
    import tempfile
    for starts in ([0, 2.5, 6.1, 13.2, 16.0], [0, 3.0, 6.1, 9.0, 12.2, 14.0]):
        with tempfile.TemporaryDirectory() as td:
            sb = board(starts)
            (Path(td) / "storyboard.json").write_text(json.dumps(sb))
            R = flow_check.analyze(td)
            failed = bool([p for p in R["problems"] if p.startswith(("max_gap", "METRONOME"))])
            agree = agree and failed and not gap_rows(sb)[1]["pass"]
    expect(f"the verdict matches flow_check.analyze on two planted failing boards and {n} shipped October boards", agree and n > 0)
    print("beat_gaps self-test: " + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def main(argv):
    if "--self-test" in argv:
        return self_test()
    paths = [a for a in argv if not a.startswith("--")]
    path = Path(paths[0]) if paths else DEFAULT
    if not path.exists():
        print(f"beat_gaps: no storyboard at {path}")
        return 2
    rows, verdict = gap_rows(json.loads(path.read_text()))
    print(report(rows, verdict, only_flagged="--only-flagged" in argv))
    return 0 if verdict["pass"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
