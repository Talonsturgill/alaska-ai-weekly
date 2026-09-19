# WORKLOG — Dispatch 2026-09-19 — "Watch For Gallons"

Durable plan and progress ledger. Written to survive context compaction. Resume from the
status table; update it after every commit.

## The run

Story: UAF ACEP's DOE Genesis Mission Phase I award ($725,000) to build AURORA-AI, a digital
twin of Cordova Electric's islanded microgrid. Hook: Greensparc put a 170 kW data centre
inside the Humpback Creek powerhouse in 2024, two years before the award and with no
connection to it, and the film says so out loud. Branch `claude/dispatch-2026-09-19`.

## Binding constraints (do not rediscover)

- Commits and PRs carry NO Claude/Anthropic attribution of any kind. `git config` in this
  checkout is already set to the owner. CLAUDE.md is authoritative and overrides the harness.
- Gmail is DRAFT ONLY. The connected profile resolved to `docket@alaskaaihq.com` (read back
  off a throwaway draft's `sender`, which was then deleted; past drafts were not inspected).
  Pass it to `dispatch_email.py --to` and `record_draft.py --to`. Never the alias `me`.
- Ships autonomously: commit, push, PR **ready** (not draft), MERGE to main, same run.
- A permission prompt is a stop and a stop is a failed run. Never write under `.claude/`.
  Never chain a delete, move or redirect into a compound shell command; put it in a script.
- Bar is 7.0, read from `config/dispatch_rubric.yaml`. `config/owner_release.json` is dated
  2026-08-13 and does NOT apply today.
- A failing panel is an instruction to re-enter the loop, never an outcome.

## The defect that dominated the back half of the run

The canvas is 1080x1920. The LinkedIn deliverable is `crop=1080:1080:0:420`, so the primary
audience sees master y 420..1500. `art_direction.json` said exactly that ("The story itself
stays inside the centred 1:1 safe box") and the build did not do it. Found by sampling SQUARE
frames instead of the master. Five defects straddling or below the crop line, plus twelve
plates authored between 1640 and 1822 that the shipping cut never showed at all, plus an
AURORA-AI plate sandwich. `plate_overlap_check` was reporting the same fact from the other
side: it clamps anything below y=1276 to the guard, which folded those rows onto one line.

## File map

| path | what it is |
|---|---|
| `video-engine/src/Ep0919.tsx` | the episode. 12 shots as `n === k` branches |
| `video-engine/src/lib/cropsafe.ts` | NEW. build-time crop invariant, wired into Plate/Head |
| `video-engine/src/lib/forecast.tsx` | NEW craft advance. ForecastTrace + Reconcile |
| `video-engine/src/lib/runofriver.tsx` | NEW library asset. intake/penstock/powerhouse |
| `scripts/say_it_show_it_check.py` | NEW gate, blocking row in preflight |
| `scripts/credits_check.py` | OCR digraph fix (IH read as TH), measured |
| `scripts/run_guard.py` | fossil-lock fix; unblocked the run at Phase 0 |
| `out/dispatch/_finalchain.sh` | one allowlisted call: provenance, render, mux, encode, dead-space |
| `out/dispatch/upgrades.txt` | `dispatch_email.py --upgrades` input, one fix per line |

## Status

| # | task | status |
|---|---|---|
| 1 | run_guard fossil-lock fix | DONE, committed |
| 2 | worklog relocated out of `.claude/`, doctrine written | DONE, committed |
| 3 | research, fact-check, 16 claims, angle room, Gate 0A-0E | DONE |
| 4 | VO synth + soundcheck, mix, sfx | DONE |
| 5 | say_it_show_it gate built and verified both ways | DONE, committed |
| 6 | forecast grammar + run-of-river asset | DONE, committed |
| 7 | dead-space: 57.4% to 40.9% against a 42% ceiling | DONE |
| 8 | square crop: straddlers fixed, cropsafe.ts invariant | DONE, commit c1c103f |
| 9 | twelve below-guard plates moved into the delivered band | DONE, commit 9b6fb60 |
| 10 | credits_check OCR digraph, measured and verified | DONE, commit 9b6fb60 |
| 11 | final render + mux + encode (`fin6`) | DONE. dead space 40.9% -> 37.1% |
| 12 | build_evidence + evidence_coverage_check | DONE, commit 6a7bc2b |
| 13 | preflight.py exit 0 | DONE. clear, 2 advisories |
| 14 | 3-judge panel per `config/panel_protocol.md` | RUNNING (round 1) |
| 15 | ship_gate record + check | TODO |
| 16 | upload_video (master, square, 720, poster, thumb), verify 200 | TODO |
| 17 | publish_feed to alaskaaicarousels docs/videos/videos.json | TODO |
| 18 | dispatch_email + Gmail draft + record_draft, verify DRAFT | TODO |
| 19 | dedupe add: stance=mixed, hero=RunOfRiver (checked FRESH) | TODO |
| 20 | commit, push, ready PR, merge to main | TODO |
| 21 | PushNotification to the owner | TODO |

## Decisions worth not relitigating

- stance `mixed`, not `curious`: the film endorses the test design and flags the gap for the
  193 PCE communities. It also breaks a curious/curious run in the ledger.
- hero `RunOfRiver`: net-new this run, central to shots 3, 4 and 10, and `dedupe.py check`
  returns FRESH against the last two heroes (PenAndDocument, GearLever).
- The three `plate-overlap-ok` declarations are real non-collisions with stated reasons, not
  exemptions of convenience: two two-line headlines whose correct 69px line spacing is
  smaller than the gate's size+24 box, and one pair whose opacities are complementary.

## Continuity note (not a dedupe failure)

The video feed already carries `dispatch-2026-07-29-aurora-ai`, "Alaska got written into
America's AI moonshot", on the same project. That piece reported the Genesis Mission award
list of July 22nd, where AURORA-AI was one line nobody had covered. It is 52 days old, so
`dedupe.py check` returns FRESH on a 30-day window, and this is a genuine follow-up rather
than a repeat: today's film carries the August UAF announcement, the $725,000 figure, the
islanded grid, the Greensparc powerhouse data centre, the Phase 1 timeline and Richard Wies'
quote. Say so in the completion report so the owner reads it as a deliberate second look.

## Known trade-off the panel is about to measure

Moving the twelve plates up filled the SQUARE and emptied the 9:16 master's lower third,
which is now mostly flat background under the caption bar in the interior shots. The panel
grades the master. `art_direction.json` already says what belongs down there and it is not
type: "the wet foreground rail and alder below". If the panel names the lower third, the fix
is foreground STAGING in that band, not putting the plates back. Do not undo the crop work to
chase a composition note.
