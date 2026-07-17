# Automation Retro — Carousel No. 9 — 2026-07-17

Full studio run, no usage-limit degradation. Shipped 9.07 vs 8.3 threshold,
vector PDF 7.55MB, machine_qa WARN / 0 fails, no hard fails. This retro walks
run_state phase by phase, records deviations with evidence, then the frontier
scan and the upgrade decision.

## 1. REACTIVE RETRO (run_state vs spec, phase by phase)

- wake / craft_refresh / research / claims / docket / selection: clean. Craft
  refresh confirmed known FIELD_NOTES numbers (docs 6.6% ER, infographics
  28.6% top-1%, 360Brew, Mar authenticity update) and correctly wrote nothing
  to doctrine.
- directors_room / copy: clean.
- art_build: PASS/WARN, 0 fails. Deviation A below (S6 terrain hero) was an
  in-phase craft iteration, not a gate failure.
- pixel_review: 5 critics, 8 ship / 1 revise. Deviations B, C, D below.
- flow_review: SHIP est 8.3; applied S5 amber word + "BEFORE THE CLASS"
  kicker (S4->S5 loop). Deviation C originates here.
- assemble / scoring: clean, 9.07. Deviation E (rubric weights) surfaced here.
- ship: in_progress at retro time (expected; Phase 12 runs before Gmail).

### Deviation A — S6 AK3D terrain hero needed two hand-reframes (craft cost, no defect shipped)
Evidence: incident note 1; instinct `ak3d-terrain-hero-resolves-flat` already
logged. First render framed the valley too low and too dark (large near-black
dead mid-band); fixed by brightening the valley floor and raising the horizon
(smaller cy / lower pitch magnitude). This is the studio's chronic flat-hero
growth edge for landscapes. It cost two iterations but produced no defect and
no gate miss. A reusable AK3D landscape-framing helper would prevent the
two-iteration cost, but it edits shared 3D rendering craft and wants careful
multi-deck A/B (the same reason the relief-depth helper was parked 2026-07-15).
Not safely boundable in this run's budget -> PARK.

### Deviation B — gold-budget overuse invisible to machine QA (pixel critic caught)
Evidence: incident note 2; pixel_review_note ("1 revise (S4 gold-budget on
figures)"). All 12 S4 ISOTYPE trainee figures rendered in the gold accent;
spec is neutral with one highlighted. machine_qa is structurally blind to this
because gold budget is a canvas-fill semantic with no DOM node. Recurring
class: canvas-drawn semantics (gold budget, canvas label contrast, this run's
leader-vs-label). A canvas-text/semantic QA gate was assessed and PARKED
2026-07-11 as not safely boundable without OCR/false-positives on dense
sectional artwork. Same conclusion holds -> PARK (no new bounded machinery).

### Deviation C — copy.json went stale vs the shipped render (RECORD-SYNC GAP)  <-- FIXED THIS RUN
Evidence: incident note 3. During flow review the S5 kicker was hand-edited in
the HTML "HOW IT STARTED" -> "BEFORE THE CLASS"; copy.json kept "HOW IT
STARTED" until the scorer's transcription caught it. There was NO machine
check that copy.json matches the shipped render text. This is objective,
cleanly boundable machinery. FIXED (see section 3).

### Deviation D — hand-launched leader on S1 rendered as a strikethrough over its own label (pixel critic caught)
Evidence: incident note 4; pixel_review_note ("S1 leader" among applied
minors). A leader line routed through its own label glyphs. Another canvas-vs-
DOM blind spot (leader is canvas geometry, label may be DOM or canvas). Same
class as Deviation B; not separately boundable without the parked canvas-
semantic gate -> PARK.

### Deviation E — rubric criteria weights sum to 1.10, not 1.00 (normalization question)
Evidence: incident note 5; verified directly — config/scoring_rubric.yaml
criteria weights: 0.14+0.14+0.16+0.14+0.12+0.10+0.08+0.07+0.05+0.10 = 1.10.
The scorer's weighted total therefore runs ~10% high vs a nominal 0-10 scale
(9.07 here; normalized ~8.25, still above an ~7.55-normalized-equivalent
threshold). This is a THRESHOLD / normalization decision for the maintainer.
HARD RULE: never silently rescale or reweight a gate. -> PARK as an explicit
note to the maintainer (below). Do NOT change the rubric this run.

## 2. FRONTIER SCAN

Focus: editorial dataviz / cartography technique (news-graphics desks). Rotated
off the last three scan_log foci — headless-Chromium 2026-07-13, self-
improving-pipeline 2026-07-14, procedural-art/relief 2026-07-15. Chosen because
this deck was map-heavy (S3 "NO ROADS", S6).

Sources read:
- onestopmap, Minimalist Editable Vector Maps 2026 cartography guide
  (https://www.onestopmap.com/blog/minimalist-editable-vector-maps/): 2026
  editorial maps converge on calm backgrounds (warm light grey / soft beige /
  very pale blue), one to two accent colors for the focal region, LIGHT relief
  (soft gradients, faint contour-inspired lines, simple water texture) instead
  of loud high-contrast hillshade, label only narrative-referenced features,
  small locator inset (globe/wider context highlighting the focal region),
  short annotations.
- News-map convention study surfaced via search (Designing Maps in News
  Stories, longitudinal US-data-journalism content analysis): quantifies
  convention prevalence — scale bar 31.2%, inset map(s) 28.1%, legend 25%,
  north arrow 18.8%.

Assessment: genuinely relevant (the studio ships map heroes via akgeo.js), but
it is an IMPROVEMENT, not a reactive fix, and it edits shared cartographic
rendering craft that wants multi-deck A/B — the same shape as the already-
parked relief-depth helper (2026-07-15) and the map design-space reference
(2026-07-10). The daily 0-1 budget is taken by the reactive copy-sync fix.
Outcome: PARK as a FIELD_NOTES candidate (locator-inset + scale-bar + faint-
contour light-relief convention set for akgeo map heroes), with source URLs.

## 3. UPGRADE DECISION — one bounded reactive fix

Held to the daily 0-1 discipline. One upgrade, reactive-first, the cleanly
boundable one:

FIX (Deviation C): new `scripts/copy_sync_check.py`. For every slide string in
copy.json["slides"], verify it appears in that slide's rendered text
(render_report.json text_nodes[].text). One-directional (authored copy must
not go stale relative to the render). Matching is on letters+digits only,
case/whitespace/punctuation-insensitive; long strings are matched on their
leading 40 alphanumeric chars to tolerate render.py's 80-char node-text
truncation, short display strings (the record-sync risk class) in full. Reads
only; never edits copy or slides. Wired into Phase 8 (post-hand-edit
pre-flight) and the Phase 11 completion gate (final pre-ship guard). Exit 0
pass / 1 mismatch / 2 usage.

Verification:
- Clean deck: PASS, 52 authored slide strings all present, 0 false positives.
- Defect reconstruction (S5 kicker reverted to stale "HOW IT STARTED"): FAILs,
  exit 1, reports `S5 kicker.text -> 'HOW IT STARTED'` — the exact incident.
- Engine untouched: qa.py on out/2026-07-17/render unchanged (WARN, 0 fails);
  examples/demo-deck render+qa unchanged (known slide-03 busy-art WARN, exit 0).
- No gate weakened, no threshold changed, no new runtime dependency (stdlib
  only), slides not modified.

Not upgraded / PARKED:
- AK3D landscape-hero framing helper (Deviation A) — shared 3D craft, wants
  multi-deck A/B; not budget-safe this run.
- Canvas-semantic QA gate covering gold-budget overuse and leader-vs-label
  overlap (Deviations B, D) — reaffirms the 2026-07-11 park: not boundable
  without OCR / false-positives on dense artwork.
- Editorial-cartography convention helper (frontier) — FIELD_NOTES candidate.
- Rubric-weights normalization (Deviation E) — maintainer decision; see note.

### Note to the maintainer — rubric weights sum to 1.10
config/scoring_rubric.yaml criteria weights sum to 1.10, so weighted totals run
~10% above a nominal 0-10 scale (this run 9.07; normalized ~8.25). If the
intent is a true 0-10 scale, either renormalize the ten weights to sum 1.00 or
restate the 8.3 threshold against the 1.10 basis. This is a gate/threshold
change and is deliberately NOT made here — flagging it for your call.
