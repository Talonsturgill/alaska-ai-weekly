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
    # MERGE into any existing entry for this date+slug (idempotent re-record). Normalize the date
    # to a string on BOTH sides — yaml.safe_load parses an unquoted YYYY-MM-DD as a datetime.date,
    # so a str key would never match a seeded date-typed entry and would silently duplicate the run.
    # Merging (not replacing) matters: findings arrive incrementally — the taste-loop records its
    # panel findings mid-run, and post-ship owner feedback appends MORE findings later. A replace
    # here silently erased a run's panel_rounds + earlier findings (caught 2026-07-21).
    key = (str(a.date), a.slug)
    prev = next((r for r in d["runs"] if (str(r.get("date")), r.get("slug")) == key), None)
    d["runs"] = [r for r in d["runs"] if (str(r.get("date")), r.get("slug")) != key]
    if prev:
        rounds = rounds or prev.get("panel_rounds", [])
        merged = {f.get("signature"): f for f in prev.get("findings", [])}
        merged.update({f.get("signature"): f for f in findings})  # new wins per signature
        findings = list(merged.values())
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

    # ---- decide what actually BLOCKS this run's ship vs what is informational history.
    # An offender only blocks if it is implicated in the LATEST run AND is not yet resolved
    # (finding.status root_caused/fixed, or an entry in `resolved`). Historical offenders that were
    # already fixed and did NOT recur this run are shown as "watch for regression", not blockers.
    resolved = d.get("resolved", {})
    latest = d["runs"][-1]
    latest_findings = {f.get("signature"): f for f in latest.get("findings", [])}

    def _done(sig, fnd):
        return sig in resolved or (fnd and fnd.get("status") in ("root_caused", "fixed"))

    blocking = []
    for sig, fnd in latest_findings.items():
        open_within = (fnd.get("rounds_as_weakest") or 0) >= wr and not _done(sig, fnd)
        open_cross = sig in cross and not _done(sig, fnd)
        if open_within or open_cross:
            blocking.append(sig)

    print("=== REPEAT-OFFENDER REPORT ===")
    print(f"(cross-run threshold: >={xr} runs   within-run threshold: >={wr} weakest rounds)\n")

    if not cross and not within:
        print("No repeat offenders. Any this-run failure is a first occurrence — a normal fix + a")
        print("ledger record is enough; no forced root-cause escalation.")
        return 0

    esc = 1
    if cross:
        print("CROSS-RUN patterns — the same signature has failed in multiple runs:")
        for sig, hits in sorted(cross.items(), key=lambda kv: -len({h['date'] for h in kv[1]})):
            runs = sorted({h["date"] for h in hits})
            res = resolved.get(sig)
            state = ("BLOCKING (open in the latest run)" if sig in blocking
                     else "resolved — watch for regression" if res or sig not in latest_findings
                     else "open")
            print(f"  [{esc}] {sig}: {len(runs)} runs ({', '.join(runs)}) — {state}")
            if res:
                print(f"       last root-cause fix: run {res.get('run')} {res.get('commits')}")
                if sig in blocking:
                    print(f"       -> it came back: that fix DID NOT HOLD. Root-cause DEEPER, don't re-apply.")
            esc += 1
        print()

    if within:
        print("WITHIN-RUN patterns — an axis/finding stayed the panel's weakest across many rounds:")
        for w in within:
            label = "axis" if w["kind"] == "axis-streak" else "finding"
            unit = "consecutive weakest rounds" if w["kind"] == "axis-streak" else "rounds as the weakest axis"
            st = w.get("status")
            block = w["kind"] == "finding" and w["key"] in blocking
            state = "BLOCKING" if block else (f"status: {st}" if st else "informational")
            print(f"  [{esc}] {label}: {w['key']} — {w['count']} {unit} "
                  f"(of {w['rounds']}) in {w['date']}/{w['slug']} — {state}")
            esc += 1
        print()

    if blocking:
        print(f"BLOCKING ({len(blocking)}): {', '.join(sorted(set(blocking)))}")
        print("These repeat offenders are OPEN in the latest run and MUST get a root-cause fix before")
        print("it ships (never a symptom patch, never a defer/disclose). Exit 2.")
        return 2
    print("No OPEN repeat offenders in the latest run — every recurring/within-run offender is")
    print("root-caused or resolved. Ship allowed. (History above is kept to catch future regressions.)")
    return 0


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
