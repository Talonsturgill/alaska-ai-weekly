# Automation Retro - Carousel No. 8 - 2026-07-15 (Phase 12)

## Run vs spec, phase by phase (deviations with evidence)
- Phase 0-1 (wake/craft): clean. Craft refresh was current (same-day No.7 refresh), so no new
  same-day search was run, to protect the shared usage budget. Correct per spec ("if nothing new,
  write nothing").
- Phase 2 (research): PARTIAL DEVIATION. A canary Beat B scout was spawned first (deliberate probe,
  since No.7 had died on the weekly limit hours earlier). It succeeded, so the remaining 5 scouts
  fanned out. Then 3 of them (A power, C field, E robotics) died on a SESSION limit ("resets 11:50pm
  UTC") after returning only partial leads; Beat B (canary) + Beat D + Beat F completed with enough
  coverage to select and build. The maintainer confirmed the limit reset, and the full studio ran
  from Phase 3 onward. NET: no run impact (the lead story was confirmed by two independent scouts),
  but it shows the limit can flip mid-fan-out, not just at spawn.
- Phase 3 (claims): clean and high-value. The fact-checker caught THREE ship-stoppers the scout /
  community-signal layer had wrong (NANA=co-owner -> partner; biomining/waste-recovery -> not on the
  page; no Ambler/Pebble connection). This is the fact-checker earning its keep exactly as designed.
- Phase 3.5 (docket): clean. Added the NSF Engine as a grant item; refreshed STAK/AKLNG/GVEA with
  dated notes (GVEA newsroom returned HTTP 403 again, a recurring transient, carried forward honestly).
- Phase 4-6 (selection/directors/copy): clean. 3 treatments synthesized; copywriter clean; caption_check
  PASS, style_lint clean.
- Phase 7 (art): clean. qa.py PASS 0 fails 0 warns after two objective repairs (a slide-03 body/headline
  collision the gate caught, and a legibility pass). No engine/script breakage. Vector PDF 3.28MB.
- Phase 8 (pixel/flow): worked as designed. 5 pixel critics (7 ship, 2 revise) + flow-critic (ship 8.3)
  caught composition/legibility items qa.py cannot see (S2 body overflow, S8 body-over-coastline, S4
  target-crosshair reading as a "found" deposit, S6 $500K sliver merging with the bar, the S6->S7
  junction). All fixed and re-verified. The machine-qa-is-not-taste instinct held again.
- Phase 10 (scoring): 8.78 ship, no hard fail. Weakest = artwork craft (7.5): the deliberately flat
  graded-2D relief reads as a map-with-grid, not a dimensional survey plate. Same rendered-ladder growth
  edge as No.7.

## Frontier scan
Focus (rotated off the last 3 scan_log entries): procedural relief / cartographic depth for map-hero
decks. Held to 0 searches to protect main-loop budget for the Gmail deliverable; the finding came from
this run's own scorer evidence. FINDING: the recurring artwork-craft ceiling on map decks is depth. The
bounded fix is a reusable relief-depth helper (directional hillshade with real contrast from an fbm
gradient, aerial-perspective layering toward the far edge, low-alpha interior texture) layered over the
already-committed noise.js primitives, mirroring the parked strata-texture/rim-light helper (runs 4/11).

## Upgrades implemented: ZERO (an acceptable count)
- No reactive FIX was needed: no engine/script defect occurred this run (render/qa/assemble all clean).
  The session-limit-mid-fan-out is an external account limit already covered in spirit by the FAILURE
  PROTOCOL's weekly-limit clause; codifying a session-vs-weekly distinction would not change behavior
  (switch to solo either way), so no prompt change is warranted.
- The relief-depth helper is an IMPROVEMENT (not a fix) that edits shared rendering craft and wants
  careful A/B verification across multiple decks + examples/demo-deck; forcing it into the tail of a
  long run would violate the "every engine/script change is verified before commit" bar. PARKED to
  FIELD_NOTES (2026-07-15) with concrete parameters + a new instinct (relief-depth-not-just-grade) so a
  focused dev session can land it properly and verify it on several map decks.

## scan_log entry appended to ledger/upgrades.json; no new upgrade entries this run.
