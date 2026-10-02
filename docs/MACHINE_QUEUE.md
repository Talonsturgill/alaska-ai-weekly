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
- [ ] 2026-10-02 | repeat: 3 | vo-wer-canonicalizer | evidence: all three takes of the 10-02 VO failed WER (0.085 to 0.098 vs 0.08) on words said exactly as directed: Whisper wrote the vo_direction pronunciation "Noah" for NOAA, joined "ear stones" into "earstones", and heard the flapped t of otoliths as "odoliths"; the run fixed it with one more curated alias list in vo_soundcheck._norm_words, the same point-patch shape as 07-18, 07-19 and 07-20 | fix: derive spoken aliases from the run's vo_direction.json `pronunciations` map automatically (spoken form scored as its written word, both sides), join a split compound whenever its concatenation exists on the other side instead of a curated pair list, and accept a voiced/voiceless flap (t/d) substitution only inside a word longer than five letters; then delete the hand-written _SPOKEN and ear-stone entries and re-score the 10-02 takes to prove it
- [ ] 2026-10-02 | repeat: 6 | caption-chunk-by-sense | evidence: build_scenes' rebalancer still chunks by width (its own comment calls this the known limit); 10-02 needed a per-run regroup script (out/dispatch/_gen/recue.py) and a sense-aware row breaker written into Ep1002.tsx to stop "caught in the / Aleutians", "first." alone on a card, "600 to" / "800 percent" and a one-frame card blink between cues; prior bites are documented in build_scenes.py comments for 07-31, 08-02, 08-04, 08-09, 08-13 and 09-19 | fix: make dispatch_captions.py emit one cue per sentence or clause from the aligned words, move captionRows (comma and preposition preferred, never after an article, possessive or number, never inside a range) and the sub-0.15s hold into a shared lib Captions component, and have caption_render_check fail a row that ends on a dangling word
- [ ] 2026-10-02 | repeat: 0 | strip-name-driver-vocabulary | evidence: strip_name_check only recognises a beat as animated through q(N), pop(N) or at(N), so six beats driven by ease(f, bAt(N)) or spring(f, bAt(N)) were reported unanimated and had to be rewritten to satisfy the checker rather than the film | fix: also accept ease/spring/since/interpolate calls whose start argument is bAt(N), with a unit test on both forms
- [ ] 2026-10-02 | repeat: 0 | reserved-copy-component-names | evidence: text_fit_check's copy adapter treats any JSX tag named Scope (also Type, Label, Plate, Note, Lever) as a copy carrier, so an episode prop called Scope (a microscope drawing) failed preflight with "Missing Scope.text" and was renamed to get past it | fix: resolve the tag through the episode's imports and only treat the lib copy components as carriers
- [ ] 2026-10-02 | repeat: 0 | vo-patch-pace-ceiling | evidence: vo_patch_lines.PACE_MAX is 1.06, so the surgical patch tool will time-compress a replacement take by up to 6 percent, while the runbook says never time-stretch audio; 10-02 rejected 1.17x takes and shipped only 1.000x ones by hand inspection | fix: set the ceiling to 1.0 (shorten the line instead) or document the exception in the runbook, and make vo_patch_report.json fail on any pace other than 1.0

## Done

(none yet)
