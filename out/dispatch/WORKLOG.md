# WORKLOG — Dispatch run 2026-09-19

Branch `claude/dispatch-2026-09-19`. Composition id `Dispatch0919`. Bar: rubric
`ship_threshold` = 7.0. Runtime band 112-130s, VO words band 200-220 (config/state.yaml).
Hero must differ from the last two: NOT GearLever (09-14), NOT PenAndDocument (09-13).
Stance rotation: the last ten skew mixed/curious, so a genuine win is the underweighted register.

## Blockers cleared in Phase 0

1. `run_guard.py init` refused on every run. The 09-14 run committed its scratch, so a fresh
   container inherits SHIP_NOW + panel_verdict.json without the mp4s (heavy, correctly never
   committed), and init demanded three sha256 matches against absent files. Fixed in commit
   9b6540e: a lock with NONE of its deliverables on disk is a fossil, archived with a note
   rather than blocking. Full proof still required the moment any deliverable exists.
2. A harness permission prompt STOPPED this run on a write to `.claude/WORKLOG.md`. Owner's
   ruling: banned behavior, fix the automation. The worklog now lives here, in `out/`.
   `.claude/settings.json` already allows `Write` broadly and that did not help, so the fix is
   to move the write, not widen a rule. Recorded in CLAUDE.md and prompts/dispatch_routine.md.

## Status

| # | Task | State |
|---|---|---|
| 0 | Preflight, env, branch, run stamp | DONE |
| 1 | Research fan-out (4 researchers) | in flight |
| 2 | Fact-check (validators) | |
| 3 | Story lock + story_gate check | |
| 3.5 | Angle room | |
| 4 | Directors room + art direction | |
| 4.5 | Gate 0A-0E | |
| 5 | VO, rough cut, scenes, taste loop | |
| 6 | Gates + 3-judge panel | |
| 6B | LinkedIn caption + Gate A | |
| 7 | Encode, ship gate, upload, feed, email, merge | |
| 8 | Retrospective + upgrades | |
</content>
</invoke>
