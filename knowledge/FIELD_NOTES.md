# FIELD NOTES — living learnings

Append-only. Each run's retro adds dated entries: what worked, what failed,
what the human changed, new techniques discovered, sources to consider.
Newest first. Keep entries terse and actionable; promote stable lessons
into the doctrine/library files and prune here.

---

## 2026-07-08 — run 1 retro (Carousel No. 1, "Four Rooms, One Open Door")

- **Shipped 8.64 vs 8.3** (9 slides, vector PDF 10.74MB) after one revision
  cycle. Round 0 scored 6.9: the scorer caught a slide-3 DOM text overlap
  (body line over a bar label) that machine QA passed — the
  machine-qa-is-not-taste instinct, confirmed the hard way.
- **DEGRADED run**: a session usage limit blocked ALL worker subagents
  mid-run (treatment directors, copywriter, pixel critic, flow critic).
  Showrunner authored the treatment/copy and self-reviewed; the objective
  gates (render QA, caption lint) and the scorer (which recovered later)
  still ran. Fallback held, but solo review missed a collision the scorer
  caught: parallel critics are not optional at full quality.
- **d3 zoom trap (new instinct)**: fitExtent to a small lon/lat bbox
  polygon renders a giant fill disc + mis-scaled map. Manual zoom (baseline
  full-state fit, then scale x zoom and re-translate onto the target) with
  a STROKE-ONLY coastline is the reliable recipe (slides 2 and 7).
- **data-decorative does not inherit**: mark the leaf text element (span,
  b, appended SVG text), not the parent div.
- **pypdf/cryptography panic**: the container's Debian cryptography 41
  rust binding panics on import, killing the vector PDF path;
  `pip install --user --upgrade cryptography` fixes it. Consider adding to
  bootstrap.sh.
- Scorer false-positive to remember: serif fonts render straight U+0027 as
  a typographic apostrophe glyph; verify quote characters with grep at the
  SOURCE level before treating as a hard fail.
- Story note: the STAK docket (ADL 422741) final decision lands after Jul
  17 — next run should check it for an update angle; Bristol Bay AI
  sockeye counting is the parked runner-up (claims c64-c77, fully
  verified).

## 2026-07-08 — craft refresh (run 1 pre-research pass)

- **360Brew is live as THE ranker** (LinkedIn Engineering, ~Mar 2026):
  distribution now runs on meaning/intent matching, not keywords. On-slide
  vector text and a topically explicit caption directly feed ranking;
  reinforces the vector-text hard gate. (dataslayer.ai 2026 algorithm
  review.)
- **AuthoredUp 3M-post study (Mar 2025 to Feb 2026)**: documents earn 39%
  more reach / 30% more engagement than the average post; documents are
  12.92% of all saves (2.6x their content share); only 4.88% of creators
  post documents regularly. Format edge persists. (contentdrips 2026-07-01.)
- **Q1 2026 softening**: carousel reach declining quarter over quarter
  while infographic-style posts hit 28.6% of top-1% posts. The keepable
  data-slide mandate is now the growth edge, not a nice-to-have.
- Mid-2026 "authenticity update": engagement bait, pods, and link spam
  penalized harder; polls effectively dead (0.07% ER). Nothing to change
  for us; confirms educational + native strategy.

## 2026-07-08 — framework build (engine smoke test lessons)

- **Grain economics**: full-frame feTurbulence grain rasterizes to a 10-40MB
  incompressible bitmap in the printed PDF. Always `AK.grainTile()` as a
  repeating background. (Encoded in TECHNIQUE_LIBRARY #2 and noise.js docs.)
- **Vector text survives blend modes**: Chromium's print engine keeps HTML/
  SVG text as vector even under mix-blend-mode overlays — but canvas text
  always rasterizes. Text in DOM/SVG, art in canvas. (Engine SKILL.md.)
- **`#map svg { display: block }`** — inline SVG baseline space overflowed
  the page by ~5px; the engine's body_overflow gate caught it. Always
  display:block full-bleed SVGs.
- **AlbersUsa inversion is a trap**: us-atlas TopoJSON is pre-projected and
  the inversion params are not recoverable reliably. We committed genuinely
  unprojected sources instead (Natural Earth 10m state outline via
  world-atlas; plotly unprojected counties for the 29 boroughs). Winding
  must satisfy the d3 spherical convention — rewind any ring whose
  geoArea > π.
- **3D composition must be computed, not eyeballed**: horizonY =
  cy + tan(−pitch)·f; a peak d units above the camera at distance D lands
  (d/D)·f px above the horizon. First two terrain attempts buried the
  range in the bottom 15% of frame. (Math now in ak3d.js header.)
- **Machine QA passed a slide the eye failed** (terrain crammed low, spec
  row colliding with ridge): objective gates catch errors, only pixel
  critics catch composition. Both layers are mandatory.
- **Simultaneous-contrast illusion**: bright strokes bounding a dark region
  make it read lighter than an identical fill elsewhere. Sample pixels
  before declaring a fill bug (we chased a phantom for four bisections).
- **Contrast estimator limits**: qa.py's bbox-median method under-detects
  text over busy varied art. The pixel critic must check worst-case
  contrast visually; the estimator is a tripwire only.

## 2026-07-08 — patterns adopted from the GitHub scout pass

- Instincts ledger (ECC pattern): ledger/instincts.json, confidence-scored
  lessons injected into future runs. Prune < 0.5 confidence after 8 runs.
- Variance dials + anti-repetition (taste-skill pattern): in the dossier
  header + artwork ledger.
- Claims-file fact-checking (Loki shape): claims.json with atomic claims,
  evidence URL + verbatim quote each; slides carry claim-ids.
- Completion gate (planning-with-files pattern): out/<run>/run_state.json
  phases must all be "done" with artifacts existing before merge/delivery.
- Critic text transcription (OCR-wave pattern, no deps): pixel critics
  transcribe every visible word from the PNG and diff against the dossier
  copy — catches font fallback, tofu, truncation that DOM checks miss.
- Candidates parked for later: microsoft/flint-chart (chart spec language),
  pyiqa (BRISQUE gate; heavy torch dep), meodai/heerich (SVG voxel mode),
  self-hosted Postiz (publish automation), pretext (text layout lib).
