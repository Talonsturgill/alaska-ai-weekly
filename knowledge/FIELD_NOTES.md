# FIELD NOTES — living learnings

Append-only. Each run's retro adds dated entries: what worked, what failed,
what the human changed, new techniques discovered, sources to consider.
Newest first. Keep entries terse and actionable; promote stable lessons
into the doctrine/library files and prune here.

---

## 2026-07-10 — run 3 retro (Carousel No. 3, "The Machine That Hears a Mountain Think")

- Story: AVO volcano-monitoring AI (VOISS-Net + VolcSARvatory) with the live Great Sitkin
  eruption peg (3 volcanoes elevated at once, Jul 3 AVO update). First instrument-register deck
  (Space Grotesk + JBMono + obsidian/phosphor); evolving seismic-trace conductor motif.
- **Canvas-over-DOM-text is a QA blind spot**: qa.py checks DOM line boxes only, so the S3
  flightpath arc crossed body copy and machine QA PASSED it; pixel critics caught it. New
  instinct logged: route canvas paths around text blocks at PLAN time and make critics check
  canvas-vs-text explicitly.
- **Motif connective tissue**: the flow critic found the conductor trace read on ~6 of 9 frames;
  adding low-alpha enter/exit strokes on S3/S6/S7 stitched the film together. Lesson: a motif's
  TRANSFORMATION states are not enough; draw the connections.
- Fact-checker corrections that mattered: $6.3M is a shared NASA award (7 projects), Great Sitkin
  is 5,708 ft (not 5,709), Shishaldin elevation unfetchable so the Arc Index shows "not listed"
  (honest omission beats invention).
- fitText everywhere prevented all wrap-collisions this run (0 vs 4 last run); the recurring
  defect class appears closed by the committed helper.

## 2026-07-10 — craft refresh (run 3 pre-research pass)

- **Personal profile carousels earn ~63% more engagement than company-page carousels** (dataslayer/linkboost 2026). Alaska.Ai posts from a page; the human should consider cross-posting the deck from a personal profile, or at minimum knows the page handicap is real. Aftercare-relevant, not a design change.
- **Buffer 2026 State of Social Media (52M+ posts)** reports a median LinkedIn carousel engagement rate far above single-format medians; the wide spread confirms carousels as the highest-ceiling format but says nothing new to change the build. Documents still #1 (~6.6% ER convergent).
- **Year-over-year platform contraction is steeper than the mid-2025 read**: views ~-50%, engagement ~-25%, follower growth ~-59% (dataslayer Feb 2026). Reinforces judging against OUR trailing median and the keepable-artifact strategy over applause. Nothing to change in the machine.

## 2026-07-09 — run 2 retro (Carousel No. 2, "One River, Two Ways to Count It")

- **Shipped 8.83 vs 8.3** (9 slides, vector PDF 4.94MB), zero hard fails, one pixel-refinement
  round + a passing flow round. Story: the Wood River AI drone + computer-vision salmon-counting
  pilot vs Bristol Bay's 70-year hand-count towers. Full worker roster ran (6 scouts, fact-checker,
  3 treatment-directors, copywriter, 5 pixel critics, flow critic, scorer) with no usage-limit
  degradation this time; parallel critics earned their keep (caught 3 things machine_qa passed).
- **Fact-checker saved us from two errors the scouts carried**: ADF&G is NOT a project partner
  ("isn't directly involved at this stage"), and the run forecast is 44.05M not 41.5M. Re-fetching
  every URL and dropping the unverifiable (BBRSDA dates, exact GVEA cents/kWh, the 4:30pm deadline
  time) kept the deck honest. Lesson reinforced: trust only fetched text, never scout summaries.
- **Honesty as the edge, not a hedge**: the deck's whole thesis is that the AI is UNPROVEN (in
  training). The gold UNPROVEN scorecard cell, the "CONF 0.00 UNTRAINED" cover tag, and "every
  number the fleet trusts came from a human hand" scored best-in-class story-art fusion (9). A
  thin-but-true frame beat a hyped one.
- **Display-headline wrap is the new slide-3 defect class**: four headlines (S1/S4/S7/S8) wrapped
  an extra line into the body and machine_qa-FAILED as overprint, all because the headline
  container was narrower than its longest line. New instinct logged; fix is full-width or downsize
  + verify line count pre-render.
- **Empty lower thirds** cost a craft point. Several slides left the bottom third dead. New
  instinct: budget the lower third (readout / caption / anchor / intentional quiet), do not default.
- **Canvas ctx.filter="blur()" works headless** for a discrete DOF foreground pass (S5 reeds);
  keep the focal layer outside the filtered save/restore. Cheap, reliable repoussoir blur.
- **NEW technique invented**: SpawningSockeye (added to TECHNIQUE_LIBRARY) -- a side-profile
  spawning sockeye SVG icon (humped dorsal, kype, olive-green head, forked tail) that reads as
  salmon at 432px and doubles as the deck's data anchor (the fish wears both counting marks).
- Story note: the drone pilot has NO published accuracy number yet; when the team reports one
  (or ADF&G formally joins), that is a strong UPDATE angle. GVEA July 13 turbine vote, STAK July 17
  comment close, and AKLNG July 16 vote all resolve within days -- docket-worthy follow-ups.

## 2026-07-09 — craft refresh (run 2 pre-research pass)

- Platform numbers hold, nothing new vs run 1's craft note: documents still the
  #1 format (6.6 to 7.0% ER, ~5x reach of static, 12.92% of all saves), 8-10
  slides, 15-20s dwell the ranking signal. (dataslayer/contentdrips/postunreel 2026.)
- **Echogram as a portable visual language (NEW craft handle)**: imaging-sonar
  fish counting compresses hundreds of sonar video frames into a single
  "echogram" band (time on one axis, range on the other, each fish a bright
  streak). This is a real, drawable, information-dense motif for any AK
  fisheries-AI deck: a seeded streak field where streak COUNT encodes the fish
  number and density encodes run strength, with a flat 2D axis. Portable to
  offline Canvas. (arxiv 2502.05129 "Counting Fish with Temporal Representations
  of Sonar Video"; arxiv 2505.06637 multimodal foundation AI for wild salmon in
  Indigenous rivers.) Parked as a technique candidate; only used if the story lands there.

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

## 2026-07-09 — parked frontier + friction candidates (typography scan)

- **Variable-font WIDTH-axis fitting (parked).** Archivo and Unbounded carry
  a variable `wdth` axis; fit-to-width.js binary-searches the width axis
  (not just font-size) to fit a line, preserving optical size and cap-height
  while narrowing letterforms. Would complement AK.fitText (fit wdth first,
  then font-size) for headlines where shrinking type reads as timid.
  Not bounded enough to land in one daily upgrade slot; revisit when a deck
  needs a wide poster headline held at a fixed size.
  Source: https://github.com/Lorp/fit-to-width
- **Pre-flight colon lint (parked friction fix).** scripts/site_build.py
  refuses prose colons on emitted pages; run 2026-07-09 hit it twice (a
  docket history note, the first_comment article-title colon) and had to
  rephrase at SHIP time. A cheap lint over ledger notes / emitted copy run
  earlier in the pipeline would surface it before ship. The gate is correct
  and must not weaken; this only moves the catch earlier. Bound it to the
  same colon rule site_build already enforces before implementing.
