# Repeat-Offender Doctrine — make the automation better every run from what the eval gates say

The Dispatch has two eval gates: the objective `quality_gate.py` and the subjective panel
(editor + flow-critic + 3 judges vs `config/dispatch_rubric.yaml`). They tell us, every run, what
is failing. The failure mode this doctrine kills: **fixing the symptom, not the cause, so the same
weakness comes back.** It came back a lot —

- the VO **WER canonicalizer** inflated on missing deps (07-18), then `$/%` tokens (07-19), then
  split compound nouns (07-20): three runs, three point-patches, same underlying "canonicalizer is
  not symmetric/precise" cause;
- git-tracked **`out/` scratch** shipped a prior run's work three runs running before someone ran
  `git rm -r --cached out/`;
- the **flat-vector human rig** was the panel's *weakest axis for seven straight rounds* of the
  2026-07-21 run — round after round of single-surface tweaks (softness, facial planes, idle sway,
  a walk cycle) each revealing the next flat surface — because the root cause was the rig's whole
  fidelity, which needed one comprehensive pass, not seven patches.

## The rule

A weakness is a **repeat offender** when either:

- **Cross-run:** the same failure signature appears in **≥ 2 distinct runs** (`config/eval_ledger.yaml`), or
- **Within-run:** an axis is the panel's **weakest for ≥ 3 rounds** of a single run (the taste loop
  is tweaking symptoms without converging).

A repeat offender **MUST get a root-cause engine/doctrine fix that run.** Not a symptom patch, not a
defer, and **never** ship-with-disclosure while a repeat offender is unresolved. If it's cross-run,
the prior fix was too narrow or regressed — go **deeper/broader** than last time, do not re-apply the
same shape of patch. If it's within-run, stop iterating on the surface and fix the underlying
engine/rig/doctrine cause in one pass.

First occurrences are normal: a proportionate fix plus a ledger record is enough. The escalation is
only for things that have *earned* it by recurring.

## The loop (wire this into Phase 6/8 of the routine)

```
# after the panel settles each run, BEFORE deciding to ship:
python3 scripts/eval_tracker.py record --date <date> --slug <slug> --gate-score <n> \
    --rounds  '[{"round":2,"median":7.92,"weakest_axis":"motion-animation-craft","hard_blockers":0}, ...]' \
    --findings '[{"signature":"flat-vector-human-rig","axis":"illustration-craft-detail",
                  "first_seen_round":2,"rounds_as_weakest":7,"status":"in_progress",
                  "root_cause":"...","fix_commits":["..."]}]'

python3 scripts/eval_tracker.py offenders   # exit 2 => repeat offenders present
# -> if exit 2, the run is NOT allowed to ship until each listed offender has a root-cause fix.
#    Fix the CAUSE, re-render, re-gate, then:
python3 scripts/eval_tracker.py resolve --signature flat-vector-human-rig --date <date> \
    --commits <commit1,commit2> --note "comprehensive rig pass: faces+legs+idle+gait+captions"
```

`resolve` records that a signature was root-caused this run with the fixing commits. If a *later*
run records the same signature again, `offenders` shows the prior resolution and flags that it **did
not hold** — the proof that the next fix has to be stronger, and the mechanism that stops us from
shipping the same patch twice.

## Why this makes the automation compound

Every run now leaves two artifacts behind: the fix, and the *memory that the fix was needed*. The
memory is what turns "we keep hitting this" into "we already root-caused this, and here's the commit
— if it's back, go deeper." Over runs the ledger becomes the list of causes we've actually killed,
and the eval gates stop re-teaching us the same lesson.
