# Machine queue — what the weekly machine pass works on

Since 2026-09-30 a Dispatch run fixes only what its own film needs and queues every other engine,
gate, doctrine or asset upgrade here (Phase 8). The weekly machine pass (Phase 9, brief in
`prompts/machine_weekly.md`) works this list in a fresh agent: repeat offenders first, then oldest
first. `scripts/machine_due.py` reads it to decide whether a pass is due.

One line per item, in this exact shape, so the due check can read it:

    - [ ] <date found> | repeat: <runs it has bitten beyond this one> | <signature> | evidence: <what showed it> | fix: <the proposed change>

A pass that ships an item changes `[ ]` to `[x]` and appends ` | shipped <date> <commit>`. An item
the pass can't fix safely stays open with ` | escalated <date>: <why>` and goes in the email.

## Open

- [ ] 2026-09-30 | repeat: 0 | dead-gate-beat-delivery | evidence: ship_gate.check_beats_delivered() returns early because out/dispatch/frames is never produced, so it has never looked at a frame (found 2026-08-06, runbook "KNOWN DEAD GATE") | fix: sample the delivered cut like dead_space_check, pass the episode's CAPTION_TOP instead of 1420, run it ADVISORY for one full run, promote only after it passes a good film
- [ ] 2026-09-30 | repeat: 0 | stale-fixer-playbook | evidence: .claude/agents/dispatch-fixer.md still points at render_v3.py, vo60.py, craft.py and quality_report.json from the retired per-frame PIL pipeline, while Phase 6 hands it Remotion panel findings | fix: rewrite its inputs and playbook for the Remotion engine (a named panel finding, the episode file, probe_frames.sh to verify) and keep it no-spawn
- [ ] 2026-09-30 | repeat: 0 | advisory-gates-never-promoted | evidence: preflight carries staging_check, evidence_coverage_check, strip_name_check, shot_conform_check and crop_safety as ADVISORY "until a run has read it and cleared it", and none has been promoted | fix: for each, read what it reported on the last three shipped films, promote the ones that passed a good film, and record why the rest stay advisory

## Done

(none yet)
