#!/usr/bin/env python3
"""eval_tracker.py — the REPEAT-OFFENDER escalation system for the Dispatch eval gates.

Why this exists
---------------
The routine has two eval gates: the objective quality_gate.py (numeric) and the
subjective panel (editor + flow-critic + 3 judges vs config/dispatch_rubric.yaml).
When a gate keeps failing on the SAME thing — across rounds within one run, or
across runs — the old behavior was to either keep tweaking symptoms or, once the
median stalled, ship-with-disclosure. Both leave the ROOT CAUSE in place, so the
same axis fails again next time. (Real examples from docs/RUN_UPGRADES.md: the VO
WER canonicalizer failed on 07-18, 07-19, AND 07-20 before each got a point fix;
git-tracked `out/` scratch recurred three runs running; the 2026-07-21 run's
"flat-vector human characters" was the weakest panel axis for SIX straight rounds
before the rig was actually rebuilt.)

This tool turns that informal "repeat-offender rule" into an enforced loop:

  1. record   — after a run, append its gate score + per-round panel results +
                per-finding signatures to config/eval_ledger.yaml.
  2. offenders— read the ledger and flag REPEAT OFFENDERS:
                  * cross-run: a signature that failed in >= cross_run_threshold
                    distinct runs (the same weakness keeps coming back), and
                  * within-run: an axis that was the panel's weakest for >=
                    within_run_threshold consecutive taste-loop rounds in one run
                    (symptom-tweaking is not converging — go to the root cause).
                Repeat offenders MUST get a root-cause ENGINE/DOCTRINE fix that
                run (never a defer / never a ship-with-disclosure), and the tool
                prints the prior root-causes + fix commits so you fix the CAUSE
                and can see if an earlier fix regressed.
  3. resolve  — mark a signature root-caused with the fix commit(s), so a later
                run detecting the same signature knows the prior fix regressed
                (a stronger fix is then required, not a repeat of the same patch).

The point: every time a gate tells us something is failing, the system traces it
back to a cause, fixes the cause, and remembers — so the automation gets strictly
better each run instead of re-litigating the same weakness.

Ledger lives at config/eval_ledger.yaml (committed, like config/state.yaml).
numpy-free; stdlib + pyyaml only.
"""
import sys, os, json, argparse, datetime as dt
from pathlib import Path
import yaml

LEDGER = Path(__file__).resolve().parent.parent / "config" / "eval_ledger.yaml"


def _load():
    if LEDGER.exists():
        d = yaml.safe_load(LEDGER.read_text()) or {}
    else:
        d = {}
    d.setdefault("runs", [])
    d.setdefault("resolved", {})  # signature -> {run, commits, note} of the last root-cause fix
    return d


def _save(d):
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    LEDGER.write_text(yaml.safe_dump(d, sort_keys=False, width=100))


def _norm_sig(s):
    """Normalize a free-text signature/axis to a stable slug so 'Motion & animation
    craft', 'motion-animation-craft', and 'motion animation craft' all collide."""
    out = []
    for ch in (s or "").lower():
        out.append(ch if ch.isalnum() else "-")
    slug = "-".join(w for w in "".join(out).split("-") if w)
    return slug


# ---------------------------------------------------------------- record
def cmd_record(a):
    d = _load()
    rounds = json.loads(a.rounds) if a.rounds else []
    findings = json.loads(a.findings) if a.findings else []
    for fnd in findings:
        fnd["signature"] = _norm_sig(fnd.get("signature") or fnd.get("axis", ""))
        if "axis" in fnd:
            fnd["axis"] = _norm_sig(fnd["axis"])
    # replace any existing entry for this date+slug (idempotent re-record)
    key = (a.date, a.slug)
    d["runs"] = [r for r in d["runs"] if (r.get("date"), r.get("slug")) != key]
    d["runs"].append({
        "date": a.date,
        "slug": a.slug,
        "gate_score": a.gate_score,
        "panel_rounds": rounds,       # [{round, median, weakest_axis, hard_blockers}]
        "findings": findings,         # [{signature, axis, first_seen_round, rounds_as_weakest, status, root_cause, fix_commits}]
    })
    d["runs"].sort(key=lambda r: str(r.get("date")))
    _save(d)
    print(f"recorded {a.date} / {a.slug}: gate={a.gate_score}, {len(rounds)} panel rounds, {len(findings)} findings")


# ---------------------------------------------------------------- offenders
def cmd_offenders(a):
    d = _load()
    if not d["runs"]:
        print("(eval ledger empty — nothing to analyze)")
        return 0
    xr, wr = a.cross_run_threshold, a.within_run_threshold

    # --- cross-run: same signature failing in >= xr distinct runs
    by_sig = {}
    for r in d["runs"]:
        for f in r.get("findings", []):
            sig = f.get("signature")
            if not sig:
                continue
            by_sig.setdefault(sig, []).append({
                "date": str(r.get("date")), "slug": r.get("slug"),
                "status": f.get("status"), "root_cause": f.get("root_cause"),
                "fix_commits": f.get("fix_commits") or [],
            })

    cross = {s: hits for s, hits in by_sig.items()
             if len({h["date"] for h in hits}) >= xr}

    # --- within-run: a weakness that dominated many rounds of one run. Two detectors, because the
    # SAME root cause often surfaces under DIFFERENT rubric axes round to round (e.g. a flat, un-
    # animated character rig reads as "illustration-craft" one round and "motion-craft" the next):
    #   (a) panel_rounds streak — the raw weakest_axis label repeated >= wr consecutive rounds, and
    #   (b) a recorded finding whose own rounds_as_weakest >= wr (axis-label-agnostic, so a rotating
    #       label can't hide a root cause that was the ceiling the whole run).
    within = []
    for r in d["runs"]:
        rounds = sorted(r.get("panel_rounds", []), key=lambda x: x.get("round", 0))
        run = best = 0
        prev = None
        best_axis = None
        for pr in rounds:
            ax = _norm_sig(pr.get("weakest_axis", ""))
            run = run + 1 if ax and ax == prev else 1
            if run > best:
                best, best_axis = run, ax
            prev = ax
        if best >= wr and best_axis:
            within.append({"date": str(r.get("date")), "slug": r.get("slug"),
                           "kind": "axis-streak", "key": best_axis, "count": best,
                           "rounds": len(rounds)})
        for f in r.get("findings", []):
            if (f.get("rounds_as_weakest") or 0) >= wr:
                within.append({"date": str(r.get("date")), "slug": r.get("slug"),
                               "kind": "finding", "key": f.get("signature"),
                               "count": f.get("rounds_as_weakest"),
                               "rounds": len(rounds), "status": f.get("status")})

    print("=== REPEAT-OFFENDER REPORT ===")
    print(f"(cross-run threshold: >={xr} runs   within-run threshold: >={wr} consecutive weakest rounds)\n")

    if not cross and not within:
        print("No repeat offenders. Any this-run failure is a first occurrence — a normal fix + a")
        print("ledger record is enough; no forced root-cause escalation.")
        return 0

    esc = 1
    if cross:
        print("CROSS-RUN repeat offenders — the SAME weakness keeps coming back across runs.")
        print("MANDATE: a stronger root-cause fix than last time (the prior fix regressed or was too")
        print("narrow). Do NOT re-apply the same patch; escalate the cause.\n")
        for sig, hits in sorted(cross.items(), key=lambda kv: -len({h['date'] for h in kv[1]})):
            runs = sorted({h["date"] for h in hits})
            print(f"  [{esc}] signature: {sig}")
            print(f"      seen in {len(runs)} runs: {', '.join(runs)}")
            res = d["resolved"].get(sig)
            if res:
                print(f"      last root-cause fix: run {res.get('run')} commits {res.get('commits')} — "
                      f"{res.get('note','')}")
                print(f"      -> that fix DID NOT HOLD. Root-cause deeper this run.")
            else:
                causes = [h["root_cause"] for h in hits if h.get("root_cause")]
                if causes:
                    print(f"      prior noted causes: {causes[-1]}")
            esc += 1
        print()

    if within:
        print("WITHIN-RUN repeat offenders — an axis stayed the panel's WEAKEST across many rounds,")
        print("so symptom-tweaks are not converging. MANDATE: stop tweaking; make the root-cause")
        print("engine/rig/doctrine fix for that axis THIS run (never defer, never ship-with-disclosure")
        print("while a within-run offender is unresolved).\n")
        for w in within:
            label = "axis" if w["kind"] == "axis-streak" else "finding"
            unit = "consecutive weakest rounds" if w["kind"] == "axis-streak" else "rounds as the weakest axis"
            tail = f" (status: {w['status']})" if w.get("status") else ""
            print(f"  [{esc}] {label}: {w['key']}  — {w['count']} {unit} "
                  f"(of {w['rounds']}) in {w['date']}/{w['slug']}{tail}")
            esc += 1
        print()

    print("Exit code 2 = repeat offenders present and must be root-caused before this run ships.")
    return 2


# ---------------------------------------------------------------- resolve
def cmd_resolve(a):
    d = _load()
    sig = _norm_sig(a.signature)
    d["resolved"][sig] = {
        "run": a.date,
        "commits": [c.strip() for c in a.commits.split(",") if c.strip()],
        "note": a.note or "",
    }
    _save(d)
    print(f"marked '{sig}' root-cause-fixed in {a.date}: {d['resolved'][sig]['commits']}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    rec = sub.add_parser("record", help="append a run's gate/panel results to the ledger")
    rec.add_argument("--date", required=True)
    rec.add_argument("--slug", required=True)
    rec.add_argument("--gate-score", type=float, required=True)
    rec.add_argument("--rounds", default="[]", help='JSON: [{"round":2,"median":7.92,"weakest_axis":"motion","hard_blockers":0}]')
    rec.add_argument("--findings", default="[]", help='JSON: [{"signature":"flat-human-rig","axis":"illustration","first_seen_round":2,"rounds_as_weakest":5,"status":"root_caused","root_cause":"...","fix_commits":["abc123"]}]')
    rec.set_defaults(fn=cmd_record)

    off = sub.add_parser("offenders", help="report repeat offenders (exit 2 if any must be root-caused)")
    off.add_argument("--cross-run-threshold", type=int, default=2)
    off.add_argument("--within-run-threshold", type=int, default=3)
    off.set_defaults(fn=cmd_offenders)

    res = sub.add_parser("resolve", help="record a root-cause fix for a signature")
    res.add_argument("--signature", required=True)
    res.add_argument("--date", required=True)
    res.add_argument("--commits", required=True, help="comma-separated commit refs")
    res.add_argument("--note", default="")
    res.set_defaults(fn=cmd_resolve)

    a = ap.parse_args()
    rc = a.fn(a)
    sys.exit(rc or 0)


if __name__ == "__main__":
    main()
