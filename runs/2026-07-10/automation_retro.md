# Automation Retro — 2026-07-10 (Carousel No. 3)

Shipped 8.96 vs 8.3 threshold, 9 slides, vector PDF 4.98 MB, merged to main
(sha a950047). run_state shows every phase through `ship` done; this is the
Phase 12 pass. Walking run_state phase by phase against
prompts/routine_instructions.md.

## Phase-by-phase deviations (with evidence)

- **wake / craft_refresh / research / claims / docket / selection**: clean.
  6 scouts, fact-checker, docket update all returned. No env breakage, no
  install failures, no 403s, no usage-limit degradation (contrast run 1,
  where all workers were session-limit-blocked). Fact-checker caught three
  real errors ($6.3M is a shared 7-project award; Great Sitkin 5,708 ft;
  Shishaldin elevation unfetchable -> honest "not listed"), which is the
  process working as designed, not a deviation.

- **directors_room / copy**: clean. 3 treatment-directors + copywriter
  returned; caption_check passed.

- **art_build (DEVIATION 1 — gate blind spot, the run's clearest
  "gate passed a defect a later gate caught")**: machine_qa.json shows
  `verdict: PASS, fails: 0, warns: 0` for all 9 slides. Yet TWO canvas-over-
  DOM-text collisions shipped past the machine gate and were caught only by
  the pixel critics:
  - S3: the canvas flightpath arc crossed two body-copy lines.
  - S4 (first layout): the canvas orbit arc crossed the headline.
  Root cause: qa.py's `text_collisions()` compares DOM/SVG text line boxes
  against each OTHER only. Canvas ink is invisible to it (text lives in the
  DOM tree; canvas is a bitmap). So structured art drawn under a text line
  box passes every objective check. This is the exact analogue of the run-1
  text-on-text miss that motivated the 2026-07-08 collision gate, one layer
  down (art-on-text instead of text-on-text). FIELD_NOTES 2026-07-10 already
  logged the instinct ("Canvas-over-DOM-text is a QA blind spot").
  Evidence: out/2026-07-10/render/machine_qa.json (all PASS) vs the pixel-
  critic fix history and the retro note.

- **art_build (DEVIATION 3 — minor, resolved in-run)**: the Instrument Serif
  upright-400 font check produced a false FAIL when only the ITALIC face was
  actually used on the slide; fixed in-slide by explicitly loading both
  faces. render.py's font probe builds its check spec as
  `cs.fontWeight + " 32px \"" + fam + "\""` with no font-style, so
  `document.fonts.check()` probes the UPRIGHT face even when the element is
  italic. Low-severity (self-corrected, no ship impact) but it is a latent
  false-FAIL source for any italic-only display face.

- **pixel_review / flow_review**: worked as designed. 5 pixel critics caught
  the two canvas-over-text collisions above (Deviation 1). Flow critic found
  the conductor motif read on only ~6 of 9 frames; fixed with low-alpha
  enter/exit strokes on S3/S6/S7. Positive signal: AK.fitText (the
  2026-07-09 committed helper) prevented ALL display-wrap collisions this run
  (0 vs 4 last run) — the recurring wrap-collision defect class appears
  closed by the committed helper.

- **assemble / scoring**: clean. Vector PDF 4.98 MB (in the 2-25 band),
  correct page count. Scorer returned 8.96.

- **ship (DEVIATION 2 — friction, repeat offender)**: scripts/site_build.py's
  `prose_colon_gate` fired TWICE at ship time in Phase 11, forcing manual
  rephrasing mid-ship:
  1. a docket history note carried a prose colon;
  2. copy.json's first_comment lead line "Sources for today's deck:".
  Run 2 (2026-07-09) hit the SAME class twice (a docket history note + the
  first_comment article-title colon). The gate is CORRECT and must not
  weaken — the issue is timing: the colon is only caught at ship, after the
  docket note is written (Phase 3.5) and copy.json is written (Phase 6), so
  the rephrase happens under ship-time pressure. FIELD_NOTES 2026-07-09
  already parked a "pre-flight colon lint" candidate: run the exact same rule
  EARLY, where the text is authored, so it surfaces before ship. Bounded to
  the identical rule site_build already enforces.

## Summary

Two reactive items rise to the bar this run:
- DEVIATION 1 (canvas-over-text): a genuine defect that the machine gate
  passed and only the human-eye critics caught. Highest priority. Reactive
  FIX candidate (a): a WARN-level canvas-under-text tripwire in qa.py.
- DEVIATION 2 (prose-colon timing): a two-run-repeat friction that required
  manual intervention at ship both times. Reactive FIX candidate (b): a
  scripts/style_lint.py helper reusing the exact colon rule + a prompt line
  in Phase 3.5 and Phase 6 to lint early.
- DEVIATION 3 (italic font false-FAIL): minor, self-resolved. Candidate (c),
  style-aware font probe — only if trivially verifiable, else park.

Frontier scan below.

## Frontier scan

Focus: **editorial dataviz / cartography technique** (rotated off the last two
scan_log entries: self-improving-pipeline 2026-07-08, typography 2026-07-09).
6 searches/fetches, timeboxed. This studio leans hard on d3 cartography and a
keepable-data-slide mandate, so fresh news-graphics technique is high leverage.

Findings (substantive sources read):
- **Bloomberg concentric-radial-rings seasonal small multiple.** Each small
  chart wraps the calendar year into a ring; concentric rings each encode a
  different variable (weekly share, avg high temp, precipitation), and a
  seasonal peak reads as a bulge. Portable to offline SVG/Canvas as a seeded,
  static small-multiple. Genuinely useful for any AK deck with a seasonal
  quantity (fishing openers, daylight, eruption cadence, PFD timing). But it is
  a TECHNIQUE-LIBRARY candidate, not an engine change, and not safely boundable
  in one daily upgrade slot -> PARKED to FIELD_NOTES with source.
- **"How do Data Journalists Design Maps to Tell Stories?" (arxiv 2508.10903)**
  analyzes 462 journalistic maps from five major outlets and derives an
  eight-dimension design space (article properties + map visual/interactive
  features) plus common editorial rationales. A reference for the
  treatment-directors when a deck goes cartographic (framing/crop, annotation,
  focus+context, projection intent). Knowledge/reference item, not code ->
  PARKED with source.
- Cartographic narrative technique roundups (maplibrary, ResearchGate content
  analysis) reconfirmed the static-implementable subset we already practice
  (color/value progression, type hierarchy, symbol economy, annotation,
  framing). Nothing new to change in the machine.

Outcome: **parked** (no frontier code applied this run; the two reactive fixes
fill the budget and these are library/reference candidates, correctly parked).
Scan_log entry appended to ledger/upgrades.json; FIELD_NOTES candidates dated
2026-07-10 with URLs.

## Upgrades applied this run (both reactive fixes)

1. **FIX (engine) — canvas-under-text tripwire in qa.py** (DEVIATION 1). New
   `busy_art_under_text()`, WARN only, primary text (font_px>=30). Verified:
   this run's 9 slides stay PASS 0/0 (no false warns); demo-deck exits 0 with
   one sensible warn on its display-over-generative-field line; a defect
   reconstruction (arc crossed body copy) WARNs while its clean control
   (arc routed above) stays silent. No gate weakened, no new dependency.
2. **FIX (scripts+prompts) — scripts/style_lint.py + Phase 3.5/6 lint step**
   (DEVIATION 2). Byte-for-byte replica of site_build's prose-colon rule, run
   early where copy is authored. Verified: fires on both of this run's original
   ship-time failing strings, passes the fixed copy.json first_comment, exempts
   clock times and URLs, matches site_build exactly. The ship gate is unchanged.

DEVIATION 3 (italic font false-FAIL) was NOT shipped: at daily cadence, prefer
0-1 upgrades and two reactive fixes already spent the budget; the font probe is
a hard gate and a correct-but-not-defect-forced tweak, so touching it this run
risks a regression for no urgent gain. Parked as a FIELD_NOTES candidate.
</content>
