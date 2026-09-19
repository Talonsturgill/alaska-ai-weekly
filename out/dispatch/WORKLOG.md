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
| 14 | 3-judge panel | DONE. r1 6.66 median w/ blockers, r2 **7.33** median, all ship, none |
| 15 | ship_gate record + check | DONE. PASS |
| 16 | upload_video, all five verified 200 | DONE |
| 17 | publish_feed, live on the sibling repo main | DONE |
| 18 | Gmail draft r4784989645756598808, readback DRAFT | DONE |
| 19 | dedupe add, stance mixed, hero RunOfRiver | DONE |
| 20 | PR #121 ready, merged to main as 8ebcbcd | DONE |
| 21 | PushNotification to the owner | in flight |

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

## Defects found by eye while the panel ran (fix in the SAME next render)

1. **The function plates cover Sourdough's face.** f060.1.jpg: DETECT ABNORMAL CONDITIONS
   and OPTIMIZE HYDRO AND DIESEL land across the hero's head, leaving one eye and the hat.
   Introduced by moving that list up out of the 9:16-only band. FIX: move the list to
   x=760, over the TWIN's column, which is also better staging because the list is what
   AURORA-AI will do. Sourdough is at x=296 and clears it entirely. No gate caught this
   because plate_overlap_check compares plates to plates and staging_check looks for
   direct Character sites, and neither asks whether type lands on a face.
2. **The 9:16 lower third is empty** in the five interior shots (1, 2, 6, 7, 9). The
   Backdrop's grate starts at y=1640 and is a dark fill with faint lines. art_direction.json
   asked for staging there. FIX: raise the floor, add a cable tray along the wall base,
   coiled cable, a drain channel with a puddle catching the amber bounce. One component,
   five shots, and it cannot affect the square because it is all below y=1500.
3. **Sourdough covers the signature shot's unit label.** f086.2.jpg: his head sits in front
   of the Reconcile widget and cuts GALLONS SAVED to "GAL...VED". art_direction.json calls
   this the signature shot and says Sourdough stands BETWEEN the two slots, not in front of
   them. FIX: lift the Reconcile group from translate(540 940) to about translate(540 840)
   so the unit label clears his head; moving him instead would push more of him under the
   caption bar.

## Panel round 1 and what it cost, in order

Median 6.66 against 7.0, with hard blockers on all three cards. Four renders total.

The two blockers all three judges hit were one bug: `build_scenes._rebalance_cues` already
guarded against a spoken number being split across cards, and its number-word list jumps
twelve to twenty, so every TEEN fell through it, and "point" was never in it. The screen
read "sixty six customers" for a co-op with 1,566, and "eight megawatts of diesel" under a
plate saying 10.8 MW. A third judge found a card that was literally ", nine months.".

The Motion scores (5.5 / 6.0 / 6.8) had a single root cause worth remembering: from shot 4
onward, NINE OF TWELVE shots animated beats that fire BEFORE the shot is on screen, by up
to nine seconds. The film built its cards during the previous shot and cut to a settled
tableau. The judges were reading the strips correctly; the strips were correct.

Fixing that overcorrected once: a 1.35s tail put every shot's LAST beat 1.35s before its own
cut, so shot 7's partner board had six tenths of a second. Every shot now reserves 3.4s, or
45 percent of its own length when it cannot afford that.

Declined, on the record: all three judges wanted the 12.3s credits tail trimmed as
watch-through loss. `build_scenes.py` carries the owner's 2026-08-12 rule that the number
may go up and may not go down, because that card holds the source list and the CC BY 4.0
attribution. The run does not take time back out of the card people are meant to read.

Known and accepted rather than fixed: the diesel stack in shot 4 sits at x=1060 and is half
off the right edge, so its exhaust plume is mostly outside the frame. The tank yard added
this round carries that half of the comparison. If a later round reopens this shot, move the
stack to about x=930 and the plume comes back with it.


## RUN COMPLETE

All tasks DONE and shipped. Merged to main as 8ebcbcd via PR #121. This file is gitignored
scratch in an ephemeral container and is left in place rather than deleted, because a delete
under a path a tool may treat as sensitive is how this run got stopped twice at Phase 0.

## The one thing the next run should do first

`scripts/strip_name_check.py` is red on nine beats the board describes and no shot animates,
and 22 more were refiled by hand here and reverted because refiling also turns
`say_it_show_it_check` red, since that gate reads the same `shot` field. The two have to be
conformed together at Gate 0A and validated by a render, and then this row becomes blocking.
Doing it at the START of a run costs nothing. Doing it at delivery costs a render and cannot
be validated before the ship gate has already bound the graded cut.
