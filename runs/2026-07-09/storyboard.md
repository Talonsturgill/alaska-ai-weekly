# STORYBOARD — Carousel No. 2 — 2026-07-09
## "One River, Two Ways to Count It"

Built entirely from out/2026-07-09/claims.json. Every on-slide number/quote carries a claim-id.
Seed for all noise: **20260709**. Canvas 1080x1350, 2x backing. Text in DOM/SVG, art in canvas.

---

## DECK HEADER

- **Thesis:** Bristol Bay is testing an unproven AI salmon-counter against a 70-year human method
  whose hand-clicked tallies still decide when the fleet can fish, and the machine has not yet
  earned a single count it can stand behind.
- **Document title (<=60):** `One River, Two Ways to Count It: AI vs the Tower`
- **Arc (9 slides):** hook (audit frame) -> stakes (the count is the trigger) -> the old way
  (70-year human method + its live numbers) -> the machine arrives (the drone, in training) ->
  BREATHER/3D (the right bank at 8:30) -> the scorecard (keepable audit, UNPROVEN cell) -> who
  counts and who does not (partners; ADF&G not involved) -> why now (the convergence, the one
  warm beat) -> close (single debate ask). Emotional temperature: cold and skeptical, one warm
  lift at slide 8, resolving to a hard question.
- **Slide-count rationale:** 9 = house-ideal cadence (hook/context/point/breather/point/data/
  point/synthesis/close); two keepable data slides (3, 6), one breather+3D (5), single-ask close.
- **Continuity system (3 devices, exceeds the >=2 rule):**
  1. **Timeline spine** -- a JetBrains Mono year-ruler pinned to the bottom margin of every slide,
     71 ticks 1955..2026; a sockeye-red "you are here" marker walks 1955->2026 across the deck and
     doubles as the progress indicator. STATE TABLE below.
  2. **Motif evolution** -- "the mark of one fish": one glyph recurs and changes state: hand
     tally-stroke (S1-S3) -> hand-clicker click (S3->S4 transition) -> machine bounding box
     (S4-S7) -> BOTH marks on one red sockeye (S6/S9). The argument in one evolving glyph.
  3. **Edge-tease** -- the tally field / river current / count line is cut by the right margin and
     resumes on the next slide; the count never stops between swipes.
  - Motif state table (marker year / dominant mark / count-to-date shown):
    S1 cover(greyed 2026) hand-stroke | S2 1955-start, accumulation bar | S3 1955 tally field 144
    cols | S4 2026 first bounding boxes | S5 2026 (scene, marker faint) | S6 split 1955|2026 both
    marks | S7 2026 bounding boxes + dashed exclusion | S8 2026 warm | S9 2026 rests red.
- **Variety-ledger divergence (vs run 1, the only prior deck -- a cartographic camera-map,
  Aurora Veil, camera+constellation-corner, big-number hook, arctic-teal+amber, Fraunces+Manrope):**
  - hero_structure: hand-mark-vs-machine-mark evolving ledger + a riverbank software-3D depth scene
    (NOT an Alaska camera/zoom map; the only geography is a low riverbank horizon + a coord readout).
  - atmosphere: tannin river fog / cold field morning (Mesh Wash body + one Conic Horizon warm beat)
    -- NOT Aurora Veil.
  - continuity: timeline-spine + motif-evolution + edge-tease -- NOT camera + constellation-corner.
  - hook_archetype: named-tension / before-after (clicker vs machine eye) -- NOT a big lone number.
  - palette_family: tannin-slate + driftwood + sockeye-red -- NOT arctic-teal + amber.
  - type_pairing: Archivo variable (wdth+wght axes) + JetBrains Mono -- NOT Fraunces + Manrope.
- **Variance dials:** design_variance 4 (evolving-glyph ledger is well off house center),
  visual_density 4 (dense instrument/annotation furniture: year-ruler, tally fields, leaders,
  readouts), type_temperature 2 (cool grotesk-forward: Archivo + mono, deliberately NO warm serif).
- **Palette (roles, hex):**
  - bg base `#0B1519` (tannin water, night) ; elevation panel `#13232A` ; water mid `#1E3B44`
  - human/driftwood ink `#B7A489` (dark `#7C6A50`) ; machine/drone grey `#9AA6AE` (dark `#566169`)
  - **accent sockeye red `#C23A2B`** (halo `#D9573F`) -- ~10%, smallest areas only
  - tundra rust (sparing texture) `#8A5A34` ; text bone `#E9ECE7` ; mono-label muted `#9DB0AE`
  - **gold `#FFC72C`** (halo `#FFDA6E`) -- FIXTURE ONLY: Polaris star + progress counter + the one
    UNPROVEN flag. Budgeted per slide below.
  - 60/30/10: desaturated water/driftwood fills dominate; structure inks at 30; sockeye-red at 10
    on the single most important element per slide.
- **Type system:** Archivo variable (display: wdth 112-125, wght 760-800, tracking -2%, leading
  0.98; body: wdth 100, wght 440-500, leading 1.36, tracking -1%) + JetBrains Mono (instrument:
  500/700, small-caps tracked +8-12%, tabular-nums lining-nums). Two-family rule satisfied (Archivo
  one family across axes + mono instrument). No faux weights; all weights exist in fonts.css.
- **Claims index (claim-id -> slides):** c1 S1,S4,S5,S6 · c2 S4,S6 · c3 S4 · c4 S4,S6 · c5 S1,S3,S6,S7
  · c6 S3,S6 · c7 S3,S6 · c8 S7 · c9 S7 · c10 S8 · c11 S4 · c12 S8 · c13 S2 · c14 S2 · c15 S3 · c16 S3
  · c17 S3. (Every content number traces to a verified claim. S5/S8/S9 carry no unverified numbers.)

---

## SLIDE 01 — COVER — "One river. Two ways to count it. Only one is proven."

**A. NARRATIVE**
1. Beat: the hook / audit frame; stop the scroll with one iconic image and one sharp tension.
   Plants the loop: which count do you trust? Inherits nothing (cover).
2. Copy, final (verbatim):
   - Kicker (mono, tracked): `BRISTOL BAY / WOOD RIVER / 2026 SEASON` (33 chars)
   - Headline (Archivo expanded, 3 hand-broken lines, <=12 words total = 11):
     `One river.` / `Two ways to count it.` / `Only one is proven.`
   - Fish label A (hand ink, data-decorative): `| | | |` (four tally strokes on the fish's left flank)
   - Fish label B (mono, data-decorative): `[ CONF 0.00 ]` bracket readout at the machine box corner
     (honest: an untrained model, confidence zero) -- marked data-decorative, not a factual claim.
   - Counter (mono): `01 / 09`
   - Year-ruler (mono, data-decorative): the 1955..2026 spine along the bottom, 2026 tick greyed.
3. Reader takeaway (@432px): "Two ways to count the same salmon, and only one is proven."

**B. COMPOSITION**
4. Layout map (twelfths): focal object (the sockeye) spans cols 3-10, rows 4-6 (rule-of-thirds
   focal at col 8/row 5, the machine box corner). Headline cols 1-8 rows 6.5-8. Kicker top-left
   cols 1-6 row 1. Counter bottom-right. Year-ruler full width row 8 bottom margin. Quiet zone:
   upper-right sky (cols 9-12 rows 1-3). Eye path: fish (1) -> headline (2) -> counter/ruler (3).
5. Depth plan (z-stack): bg gradient (tannin night) -> faint water caustics (canvas, low) ->
   drop shadow under fish (Layered Shadow Elevation #45, colored dark water hue) -> the sockeye
   (SVG filled path) -> the machine bounding-box brackets (grey, over the fish = occlusion) ->
   the hand tally strokes (over the fish flank) -> type -> grain tile. Depth cues: occlusion
   (box over fish over water), shadow (contact), scale (fish is huge, marks small), a soft
   vignette. Focal plane = the fish. NOT a 3D camera slide (that is S5).
6. Continuity state: motif debuts at full size -- one sockeye wearing BOTH marks (hand strokes +
   machine box) so the reader meets the whole argument at once. Edge-tease: the water caustics
   and year-ruler run off the right edge. Marker greyed at 2026 (we will walk back to 1955 next).

**C. ART DIRECTION**
7. Technique stack:
   - **Sockeye salmon icon (NEW: `SpawningSockeye`)** -- a side-profile spawning sockeye as a
     single SVG filled path: humped dorsal back, tapered caudal peduncle, hooked upper jaw (kype),
     dorsal + adipose + anal fins + forked tail. Body fill sockeye-red `#C23A2B` with a subtle
     top-lit vertical gradient (lighter dorsal `#D9573F` -> deep belly `#8E2A1F`); head olive-green
     `#37432B` (iconic spawning coloration) with a small bone eye + dark pupil. Profile-Heaviest
     Rule (#58): outer silhouette `--w-hero` 5.5px in a darker red-brown, interior fin seams
     `--w-fine`. One 4% specular highlight on the shoulder. Log to TECHNIQUE_LIBRARY if it renders.
   - **Machine bounding box** -- four corner brackets (Transit/Systems voice, cased line #79),
     drone-grey `#9AA6AE`, `--w-std` 2px, 22px arms, framing the fish; a mono `[CONF 0.00]` tag at
     the top-left corner. Signals "the machine sees a candidate but cannot yet score it."
   - **Hand tally strokes** -- four driftwood-ink strokes (Hand-Ink voice #61 low-pass wobble,
     amplitude 2px, one seed) on the fish's left flank, `#B7A489`.
   - Atmosphere: Mesh Wash (#3) tannin-night, 4 radial stops OKLCH; Grain Pass `AK.grainTile(280,
     54, 20260709)` overlay 0.08. Deep-Sea Scrim (#7) only under the headline band.
8. Data-in-art: the two marks encode the thesis (human count vs machine count on one fish);
   CONF 0.00 encodes "untrained" (c2/c4 spirit, decorative). Marker greyed at 2026 = the era we
   are about to interrogate (c5).
9. Palette assignment: bg `#0B1519`->`#13232A`; fish `#C23A2B`/`#D9573F`/`#8E2A1F`, head `#37432B`;
   box `#9AA6AE`; hand strokes `#B7A489`; headline bone `#E9ECE7`; kicker+counter mono `#9DB0AE`;
   gold `#FFC72C` on the Polaris star (tiny, top-right) + counter only. Contrast: bone `#E9ECE7`
   on `#0B1519` ~13:1; red fish on tannin water ~4.9:1 (large object, not text).
10. Type spec: Headline Archivo wdth 118 wght 800, 118px, leading 0.98, tracking -0.02em, bone,
    left-optical aligned, max width 760px, fit-to-box binary search to guarantee <=3 lines.
    Kicker JetBrains Mono 500, 22px, tracking +0.16em, small-caps, `#9DB0AE`. Counter mono 24px.
11. Anchor spec: the sockeye IS the literal anchor (a stranger guesses "salmon + AI" instantly).
    Year-ruler = annotation furniture (71 ticks, 6px tall hairlines, every 5th labeled, mono 14px
    data-decorative). Polaris 4-point gold star, 18px, top-right.

**D. VERIFICATION**
12. Reference intent: "A field guide plate meets an object-detection demo." Natural-history
    engraving crossed with a vision-model overlay.
13. Risk flags: (a) fish path could look amateur -> spend the craft, profile-heaviest weight,
    green head, one highlight, grain over the fill; (b) headline over the fish -> keep headline in
    the lower quiet band with a subtle scrim, never crossing the fish body; (c) red-on-dark
    contrast for the tag -> tag is decorative, not body. Fit-to-box on the headline.
14. Acceptance checklist:
    - [ ] the object reads as a salmon at 432px (humped back + kype + forked tail visible)
    - [ ] both marks (hand strokes AND grey box) legible on the fish
    - [ ] headline is exactly 3 lines, no orphan, no dash, straight quotes
    - [ ] gold appears ONLY on the Polaris star and the counter
    - [ ] year-ruler spans 1955..2026 with the 2026 tick greyed
    - [ ] no text line box intersects another (QA) and headline clears the fish body

---

## SLIDE 02 — THE STAKES — "The count is the trigger."

**A. NARRATIVE**
1. Beat: slide-2 payoff -- why this count matters at all (it opens and closes the fishery).
   Inherits "which count do you trust?"; plants "who is doing the counting, and how?"
2. Copy, final:
   - Kicker: `WHAT THE COUNT DECIDES`
   - Headline (Archivo, 2 lines): `A number opens` / `the fishery.`
   - Body (Archivo body, 44 words): `In Bristol Bay the escapement count is not a statistic. It
     is the switch that opens and closes the season. This year's run is forecast at 44.05 million
     sockeye. As of July 6, crews had already counted 26,944,183.` (c13, c14)
   - Data labels (mono): `44.05 M forecast run` (c13) ; `26,944,183 counted to July 6` (c14) ;
     `61% of the forecast, already in` (derived 26.94/44.05 = 0.611)
   - Counter `02 / 09`
3. Reader takeaway: "The count is a switch worth tens of millions, so who pulls it matters."

**B. COMPOSITION**
4. Layout: headline cols 1-7 rows 1.5-3; body cols 1-7 rows 3.5-5; the accumulation bar cols
   1-11 row 6-7 (full width, edge-teased right); data labels along/under the bar. Focal: the
   sockeye-red leading edge of the bar at 61% (~col 8). Quiet zone: upper-right.
5. Depth plan: bg Mesh Wash -> faint Streamline current beneath (canvas 5% opacity, upriver
   direction) -> the accumulation bar (Frost Panel #8 track + sockeye-red fill) -> type -> grain.
   Cues: elevation (frost plate over field), the fill's cast shadow, one accent plane. Flat 2D
   (data honesty: no perspective on the quantity).
6. Continuity: timeline marker sits at 1955-start (we begin the history next); the accumulation
   bar is the tally motif in aggregate; bar runs off the right edge (edge-tease into S3).

**C. ART DIRECTION**
7. Technique stack: **Big-Number accumulation bar** -- a horizontal track (elevation `#13232A`,
   1px top light edge) with a sockeye-red fill to 61.1% and a bright leading edge (halo `#D9573F`,
   Neon Layering #47 subtle). Tick marks every 10% (`--w-hair`). Background Streamline Field (#9)
   angle grid fbm(x*0.0016) at 5% opacity, current left-to-right. Grain tile. Instrument corner
   readouts (#84) for the coord + counter.
8. Data-in-art: bar fill fraction = 26,944,183 / 44,050,000 = 61.1% of track length (c13, c14).
   The one loud accent (red) sits exactly on the counted portion. Verifiable by measuring the bar.
9. Palette: bg `#0B1519`; bar track `#1E3B44`; fill `#C23A2B`->`#D9573F` leading edge; labels mono
   `#9DB0AE`; headline/body bone `#E9ECE7`; gold on counter + Polaris only. Body `#E9ECE7` on
   `#0B1519` ~13:1. Red fill vs track: decorative fill, label sits in a knockout, not on red.
10. Type: Headline Archivo wdth 112 wght 780, 92px, leading 1.0. Body Archivo 440, 34px, leading
    1.4, max width 640px, ragged right (no justify/hyphen). Data labels mono 26px tabular, small-caps.
11. Anchor spec: the accumulation bar is the anchor (a labeled quantity). Scale ticks + a `0` and
    `44.05 M` end-label (Annotated Line grammar). Leader from "61%" to the fill edge (#72 discipline).

**D. VERIFICATION**
12. Reference intent: "FT/Datawrapper stat lead, arctic edition."
13. Risk flags: body wraps to 4 lines -> check line count vs the bar's fixed top (instinct
    verify-body-line-count); keep 40px gap between body baseline and bar. Red fill must not host
    text (use knockout window for the 61% label). Tabular nums for 26,944,183.
14. Acceptance checklist:
    - [ ] bar fill visibly ~61% of track width; leading edge is the brightest point on the slide
    - [ ] 26,944,183 rendered with tabular numerals and correct commas
    - [ ] body is <=4 lines and clears the bar by >=40px
    - [ ] no em/en dash; "700,000 to 2.8 million" style ranges only
    - [ ] gold only on counter + Polaris

---

## SLIDE 03 — THE OLD WAY (keepable) — "Counted by hand, every ten minutes."

**A. NARRATIVE**
1. Beat: honor the 70-year incumbent AND show that every number Bristol Bay trusts today is a
   tower number. Inherits "who counts, how?"; plants "can a machine do this?"
2. Copy, final:
   - Kicker: `METHOD A / THE TOWER / SINCE 1955`
   - Headline (Archivo, 2 lines): `Counted by hand,` / `every ten minutes.`
   - Body (38 words): `For seventy years, Fish and Game crews have counted Bristol Bay's salmon
     from towers, in ten-minute intervals across twenty-four-hour shifts. Most of the bay's count
     still comes from nine tower sites.` (c5, c6, c7)
   - Data plate (mono, keepable), header `WOOD RIVER TOWER / 2026`:
     `2,112,834  count to date` (c15) ; `57,258  counted Sunday` (c16) ;
     `700,000 to 2,800,000  escapement goal, within range` (c17)
   - Footer line (Archivo body italic-off, bone): `Every number the fleet trusts today came from
     a human hand.` (editorial synthesis of c2/c4/c9 -- the machine has no standable count yet;
     phrased as position, no numeric claim)
   - Counter `03 / 09`
3. Reader takeaway: "Seventy years of hand counts still produce every number that matters."

**B. COMPOSITION**
4. Layout: headline cols 1-7 row 1.5-3; body cols 1-6 rows 3-4.3; tally field cols 1-12 rows
   4.5-6.2 (the 144-column field, edge-teased right); data plate a Frost Panel cols 7-12 rows
   1.3-4 (right side, floating); footer line row 7. Focal: the single red tally column in the field.
5. Depth plan: bg -> tally field (canvas) -> Frost Panel data plate (elevation, blurred backdrop)
   -> type -> grain. Cues: elevation (plate floats over field), knockout windows behind labels,
   the red column pops via contrast. Flat 2D.
6. Continuity: timeline marker at 1955 (origin). Tally field = the motif in its human state
   (hand strokes). Field runs off the right edge. This is the deck's densest human-labor texture.

**C. ART DIRECTION**
7. Technique stack: **Tally Field** -- 144 columns (= 144 ten-minute intervals in a 24-hour day,
   c6) x ~14 rows of hand-ink tally strokes (Hand-Ink #61/#62, roughness 1.2, one seed 20260709);
   grouped in gate-of-five (four strokes + a diagonal). One column rendered sockeye-red (the "live"
   interval). Hatch Knockout Windows (#75) punch clean holes behind the plate + labels. Data plate:
   Frost Panel (#8) backdrop blur 14 + rgba(255,255,255,0.10) + 1px light top edge. Instrument
   readouts. Grain tile.
8. Data-in-art: 144 tally columns = the 24h/10min cadence (c6); nine site ticks along the field
   base = nine tower sites (c7); the plate carries the live tower numbers (c15, c16, c17) so the
   "old way" slide is literally the keepable data slide. Timeline: 71-ish years since 1955 (c5).
9. Palette: field ink `#B7A489` on `#0F2027`; red column `#C23A2B`; plate `rgba(19,35,42,.6)`
   frost; plate numerals bone `#E9ECE7` tabular; labels mono `#9DB0AE`; gold on counter+Polaris.
   Contrast: plate numerals on frosted dark >=7:1; footer bone on bg ~12:1.
10. Type: Headline Archivo wdth 112 wght 780, 86px. Body Archivo 440, 32px, leading 1.4, max 560px.
    Plate values JetBrains Mono 700, 40px tabular; plate keys mono 22px small-caps tracked +10%.
    Footer Archivo 460, 30px, bone, max 720px.
11. Anchor spec: the tally field is the anchor (human labor made countable); the Frost data plate
    is the second anchor (allowed: 2 anchors max). Nine base ticks labeled (mono 14px, decorative).

**D. VERIFICATION**
12. Reference intent: "A tide-book ledger page under museum glass."
13. Risk flags: 144x14 strokes is ~2000 canvas ops -> single seeded pass, cache none needed, fine.
    Dense field under the plate -> knockout windows mandatory; verify plate does not sit on the red
    column. Body + footer line counts vs plate bottom -> check before render. Tabular commas on all
    three plate numbers.
14. Acceptance checklist:
    - [ ] tally field reads as hand-counting texture, gate-of-five grouping visible at full size
    - [ ] exactly one column is sockeye-red; all others driftwood-ink
    - [ ] plate shows 2,112,834 / 57,258 / 700,000 to 2,800,000 with tabular numerals, commas
    - [ ] "twenty-four-hour" and "ten-minute" spelled or "24-hour"/"10-minute" -- NO dashes as ranges
    - [ ] plate never overlaps the red column or any tally strokes (knockout clean)
    - [ ] nine base ticks present (= nine tower sites)

---

## SLIDE 04 — THE MACHINE ARRIVES — "At 8:30 a.m., the box opens."

**A. NARRATIVE**
1. Beat: introduce the challenger honestly (it is in training). Inherits "can a machine do this?";
   plants "does it work yet?"
2. Copy, final:
   - Kicker: `METHOD B / THE DRONE / FIRST SEASON`
   - Headline (Archivo, 2 lines): `At 8:30 a.m.,` / `the box opens.`
   - Body (44 words): `On the Wood River, an autonomous drone launches at 8:30 a.m., flies to a
     fixed post above the right bank, and films the salmon below. The footage feeds a
     computer-vision model built to count them. The team expects to need several thousand
     hand-labeled images first.` (c1, c2, c4)
   - Quote (mono/Archivo, attributed): `"we'll be able to feed in a video, and then we'll have a
     computer vision model that will be trained on picking out salmon."` -- `Ian Chiu, machine
     learning developer` (c3, c11)
   - Counter `04 / 09`
3. Reader takeaway: "A drone is filming the run, but its counter is still being trained."

**B. COMPOSITION**
4. Layout: headline cols 1-7 rows 1.3-2.8; body cols 1-6 rows 3-4.5; the "detection frame" (a
   still river frame with bounding boxes) cols 6-12 rows 3-7 (right, edge-teased); quote in a
   knockout band row 7-7.6. Focal: the one high-confidence bounding box (red corner).
5. Depth plan: bg -> detection frame (canvas: faint fish silhouettes + grey boxes) -> type/quote
   -> grain. Cues: occlusion (boxes over fish), the training-progress bar, a partial-fill motif.
   Flat 2D.
6. Continuity: timeline marker jumps to 2026 (rupture). Motif flips: hand strokes give way to
   machine bounding boxes. Detection frame runs off the right edge.

**C. ART DIRECTION**
7. Technique stack: **Detection Frame** -- a dark still "video frame" with ~12 faint fish
   silhouettes (drone-grey, low alpha) and ~7 grey bounding boxes (cased line #79, `--w-std`),
   each with a tiny mono `conf 0.6x` tag (data-decorative); ONE box sockeye-red (the confident
   detection). A **training-images progress bar** (partial fill ~20%, mono label "SEVERAL THOUSAND
   IMAGES NEEDED", c4) as honest furniture. Grain tile. Transit/Systems line voice throughout.
8. Data-in-art: number of boxes < number of faint fish (the model misses some -> in training,
   c2/c4); progress bar partially filled = "several thousand images" still to label (c4);
   launch time 8:30 stamped in the corner readout (c1).
9. Palette: frame bg `#0C1A20`; silhouettes `#566169`; boxes `#9AA6AE`; confident box `#C23A2B`;
   headline/body bone; quote muted bone `#CBD3CF`; gold counter+Polaris only. Contrast: body >=11:1.
10. Type: Headline Archivo wdth 112 wght 780, 88px. Body 440, 32px, max 540px. Quote Archivo 500
    italic-off, 30px, `#CBD3CF`, max 760px, with a mono attribution 22px. Box tags mono 14px decorative.
11. Anchor spec: the detection frame is the anchor (machine vision made legible). Corner readout
    (8:30, coords) = furniture. Progress bar = second anchor.

**D. VERIFICATION**
12. Reference intent: "An object-detection paper figure, cold and honest."
13. Risk flags: quote length -> it is verbatim (c3); keep on <=3 lines in a knockout band, never
    over the boxes. Ensure boxes < fish silhouettes (encodes 'in training'). No dash in body
    ("hand-labeled" hyphen is a compound modifier, allowed; NOT an em/en dash). Verify.
14. Acceptance checklist:
    - [ ] visibly fewer bounding boxes than faint fish (model misses some)
    - [ ] exactly one box is sockeye-red; progress bar partially (not fully) filled
    - [ ] quote is verbatim and attributed to Ian Chiu; on <=3 lines; straight quotes
    - [ ] 8:30 a.m. appears in the corner readout
    - [ ] no text overlaps a bounding box

---

## SLIDE 05 — BREATHER / REAL 3D — "One drone. One river. One season to prove it."

**A. NARRATIVE**
1. Beat: the lung -- stand on the gravel bank at dawn; minimal text, maximal atmosphere; the
   deck's real-depth slide. Inherits "does it work yet?"; plants "on trial against what?"
2. Copy, final:
   - Kicker (mono): `WOOD RIVER / RIGHT BANK / 08:30`
   - One line (Archivo, centered-lower): `One drone. One river. One season to prove it.`
   - Coord readout (mono, data-decorative): `59.28 N  158.61 W  (approx)` (decorative, not a claim)
   - Counter `05 / 09`
3. Reader takeaway: "A single machine, alone on a real river, on trial."

**B. COMPOSITION**
4. Layout: the scene is full-bleed; the one text line sits in the lower-third quiet band (rows
   6.5-7.3), centered (a permitted centered title-card moment); kicker top-left; coord bottom-left.
   Focal: the drone-in-a-box (tack-sharp) on the near bank at rule-of-thirds (col 4/row 5).
5. Depth plan (REAL 3D, computed): Multiplane Parallax (#42) + Depth-Weighted Wireframe (#36) for
   the counting tower. Camera via ak3d.js math: fov 60, pitch -0.16, cy 660, w1080 h1350 ->
   f = (1350/2)/tan(30deg) = 675/0.5774 = 1169px; horizonY = 660 + tan(0.16)*1169 = 660 + 188 =
   ~848 (horizon at ~63% down = low horizon ~22% from bottom of the LOWER scene band; monumental).
   Layers back-to-front: (1) far tundra ridge (atmospheric lerp to water-sky, blur 3px), (2) river
   surface mid (glacial teal, faint Streamline caustics), (3) the weathered ADF&G tower mid-river
   in driftwood wireframe (lineWidth=k/z), (4) THE DRONE-IN-A-BOX on the near bank, tack-sharp
   focal plane, (5) dark blurred reed/gravel repoussoir foreground bleeding off the bottom-left.
   4+ cues: atmospheric perspective, occlusion (tower over far bank), scale gradient (marker posts
   0.72^i up the bank), DOF (drone sharp; ridge + foreground blurred), fog (exp2 in water-sky hue).
   One key light low-left (~33%) = north morning. A few red sockeye faint in the water (small).
6. Continuity: timeline marker faint at 2026; no dominant mark glyph (scene slide); river current
   edge-teases right; palette holds cold (the warm lift comes at S8).

**C. ART DIRECTION**
7. Technique stack: AK3D scene on a 2x canvas: tower as a boxed lattice (AK3D.line3d segments) in
   driftwood `#B7A489`; drone box as a small Painter's Solid / Isometric block (grey, three-face
   light); Multiplane layers as discrete canvas passes with per-layer blur; fog color `#152A32`;
   Grain tile 0.08. Volumetric Shafts (#46) optional, 1 faint dawn wedge, alpha 0.05.
8. Data-in-art: the scene is atmosphere, not data; the single drone vs the single tower encodes
   "1 pilot vs the incumbent" (c1). Marker posts count up the bank as scale furniture.
9. Palette: sky `#0E2028`->`#1E3B44`; water `#1A3540`; tower ink `#B7A489`; drone `#9AA6AE`;
   foreground `#08121A`; red fish `#C23A2B` (tiny); text bone; gold counter+Polaris. Text sits in
   the darkest quiet band -> >=10:1.
10. Type: the single line Archivo wdth 100 wght 620, 44px, tracking -0.01em, bone, centered, with
    a subtle Deep-Sea Scrim under it. Kicker + coord mono 22px small-caps.
11. Anchor spec: the drone-in-a-box is the anchor; the tower is the counter-anchor; both literal.
    Coord readout + scale posts = furniture. Horizon must be computed, not eyeballed (instinct).

**D. VERIFICATION**
12. Reference intent: "A NatGeo dawn field frame with a survey overlay."
13. Risk flags: 3D camera burial (the run-1 lesson) -> horizonY computed above; drone must be the
    sharp focal plane and clearly readable; keep the text band dark and clear. Fog in hue, never
    grey. Foreground blur via a discrete layer (no per-object sort bugs). renderReady gates canvas.
14. Acceptance checklist:
    - [ ] horizon sits low (~20 to 26% from the scene's bottom); tower + drone both clearly visible
    - [ ] the drone-in-a-box is the single tack-sharp element; ridge + foreground softly blurred
    - [ ] at least 4 depth cues present (atmosphere, occlusion, scale posts, DOF, fog)
    - [ ] the one text line is fully legible over its scrim (>=4.5:1)
    - [ ] gold only on counter + Polaris; fog colored (not grey)

---

## SLIDE 06 — THE SCORECARD (keepable) — "Seventy years versus one."

**A. NARRATIVE**
1. Beat: the audit -- the slide people screenshot and argue over at the dock. Inherits "on trial
   against what?"; plants "should you trust its number?"
2. Copy, final:
   - Kicker: `THE SCORECARD / TOWER vs DRONE`
   - Headline (Archivo, 1-2 lines): `Seventy years` / `versus one.`
   - Table (mono keys, values both columns), rows:
     | | THE TOWER | THE DRONE |
     | Years in service | `70+` since 1955 (c5) | `0` first season (c1) |
     | Counting sites | `9` tower sites (c7) | `1` pilot reach |
     | Cadence | every `10 min`, 24-hr shifts (c6) | continuous, automated (c1) |
     | Who does it | human crews (c6) | an autonomous box (c1) |
     | Demonstrated accuracy | decades of record | `NOT YET / IN TRAINING` (c2, c4) |
   - Accuracy cell flag (gold): `UNPROVEN` chip in the drone/accuracy cell.
   - Counter `06 / 09`
3. Reader takeaway: "On every proven measure the tower leads; the machine's key cell is empty."

**B. COMPOSITION**
4. Layout: headline cols 1-5 rows 1.3-3; the two-column table cols 1-12 rows 3.3-7.2 with a
   hairline center rule (the tower|drone split motif); row rules `--w-hair`; the accuracy row
   emphasized (`--w-bold` top rule). Focal: the gold UNPROVEN chip in the drone accuracy cell.
5. Depth plan: bg -> table plate (subtle elevation) -> center rule + row rules -> type -> the gold
   chip (top layer, Layered Shadow) -> grain. Cues: elevation, the chip's lift, hairline hierarchy.
6. Continuity: timeline marker split-rendered 1955|2026 (both eras at once); motif = both marks in
   the header cells (hand strokes over TOWER, bounding box over DRONE); table edge-teases nothing
   (this is a contained reference slide -- a deliberate compositional break from the edge-tease, ok).

**C. ART DIRECTION**
7. Technique stack: **Audit Table** -- Small-Multiples/table grammar (#31 spirit): drafting
   furniture (#83), Scotch Rule (#70) under the header, alphabet-of-lines dashes for the "in
   training" row, direct labels (no legend). Header cells carry the two marks (hand tally vs
   bounding box). UNPROVEN chip: gold `#FFC72C` fill, dark text, Layered Shadow (#45). Grain tile.
8. Data-in-art: the "years in service" cells anchor a tiny 70:1 bar pair (Cabinet Extrusion-free,
   flat) beside the numbers so the incumbency gap is visible, not just stated (c5). Everything
   parallel/flat (data honesty). The empty accuracy value is the whole point.
9. Palette: plate `#10202A`; rules `#3A4750`; tower column tint driftwood `#B7A489` at 12%; drone
   column tint grey `#9AA6AE` at 12%; values bone `#E9ECE7` tabular; UNPROVEN chip gold `#FFC72C`
   on `#1a1200` text; counter gold. Contrast: values >=9:1; chip text on gold >=7:1.
10. Type: Headline Archivo wdth 112 wght 800, 84px. Table keys JetBrains Mono 500 small-caps 22px
    tracked +10%; values Archivo 560 30px + mono for numerics (tabular). Column heads mono 24px.
11. Anchor spec: the table is the anchor; the two header marks are the second anchor. The 70:1 bar
    pair is inline annotation. Center rule = the tower|drone spine (the split motif, one place).

**D. VERIFICATION**
12. Reference intent: "A spec-sheet comparison, Bloomberg-BW, with one damning empty cell."
13. Risk flags: table text density -> generous row height (>=88px), every value in a cell with
    padding, no value touches a rule; verify no line-box intersections (QA). The gold chip is the
    only gold besides the counter. "70+" and "10 min" are not ranges needing "to".
14. Acceptance checklist:
    - [ ] five rows, two columns, clean center rule; header carries both marks
    - [ ] the accuracy cell for the drone reads NOT YET / IN TRAINING with a gold UNPROVEN chip
    - [ ] the 70:1 years bar pair is visually ~70x longer for the tower
    - [ ] every value has tabular numerals where numeric; no cell text touches a rule
    - [ ] gold only on the UNPROVEN chip + counter + Polaris
    - [ ] no banned phrase; no dash

---

## SLIDE 07 — WHO COUNTS, WHO DOES NOT — "Who counts, and who does not."

**A. NARRATIVE**
1. Beat: the structural honesty point -- name who runs the pilot and, crucially, who does not.
   Inherits "should you trust its number?"; plants "why is this even possible now?"
2. Copy, final:
   - Kicker: `WHO IS, AND ISN'T, IN THE ROOM`
   - Headline (Archivo, 2 lines): `Who counts,` / `and who does not.`
   - Body (45 words): `The pilot is run by the University of Washington's Fisheries Research
     Institute, with the Bristol Bay Regional Seafood Development Association and the Bristol Bay
     Economic Development Corporation. Fish and Game, which has run the towers since 1955, is not
     directly involved. The drone is measured against the towers, not run with them.` (c8, c9, c5)
   - Counter `07 / 09`
3. Reader takeaway: "The state that manages the fishery is not part of this pilot yet."

**B. COMPOSITION**
4. Layout: headline cols 1-7 rows 1.3-3; relationship diagram cols 6-12 rows 2.5-7 (right);
   body cols 1-6 rows 3.3-6.5 (left). Focal: the dashed "measured against" gap between the partner
   cluster and the ADF&G node.
5. Depth plan: bg -> diagram (nodes + edges) -> type -> grain. Cues: the dashed exclusion edge,
   node glow elevation, one accent node. Flat 2D.
6. Continuity: timeline marker at 2026; motif = bounding boxes on the partner side; the "measured
   against" dashed line is a phantom-dash (#67) exclusion; edge-tease minimal.

**C. ART DIRECTION**
7. Technique stack: **Restrained Constellation Graph (#22)** -- three partner nodes (UW FRI,
   BBRSDA, BBEDC) linked by solid `--w-std` edges into a "PILOT" hub; ADF&G a separate node linked
   ONLY by a phantom-dashed "measured against" line (Alphabet-of-Lines #67, `pathLength` dash
   symmetry #68). Nodes = interchange roundels (#78). Junction dots + hop-overs (#76) where edges
   cross. Drone-grey structure; ADF&G node in a cooler slate to read "outside." Grain tile.
8. Data-in-art: topology encodes the claim -- three connected partners (c8), one disconnected
   agency (c9); the dashed edge = "measured against, not run with" (c9). Since-1955 label on the
   ADF&G node (c5).
9. Palette: nodes `#13232A` fill, rings `#9AA6AE`; partner edges `#B7A489`; ADF&G node ring cool
   `#6E7C84`, dashed edge `#9DB0AE`; hub accent ring sockeye-red `#C23A2B` (small); text bone;
   gold counter+Polaris. Contrast: node labels >=8:1.
10. Type: Headline Archivo wdth 112 wght 780, 84px. Body 440, 32px, max 540px, leading 1.42. Node
    labels JetBrains Mono 500 20px small-caps; edge label "MEASURED AGAINST" mono 16px tracked +12%.
11. Anchor spec: the relationship graph is the anchor; the dashed exclusion edge is the one idea
    the eye must catch. Labels direct on nodes (no legend).

**D. VERIFICATION**
12. Reference intent: "An org/authority map that refuses to look like a corporate slide."
13. Risk flags: node-label collisions -> curve-exit discipline (#85), leaders never cross, hop-overs
    at crossings; body line-count vs diagram left edge. Keep ADF&G visibly separate (the whole point).
14. Acceptance checklist:
    - [ ] three partner nodes connected to a PILOT hub; ADF&G clearly separate
    - [ ] the only edge to ADF&G is a dashed "measured against" line
    - [ ] body names UW FRI, BBRSDA, BBEDC exactly and states ADF&G "not directly involved"
    - [ ] no edges cross without a hop-over; labels legible at thumb
    - [ ] no dash punctuation in prose; gold only on counter + Polaris

---

## SLIDE 08 — WHY NOW / THE CONVERGENCE — "An amazing convergence."

**A. NARRATIVE**
1. Beat: the one warm beat -- why this is suddenly possible; let the optimism breathe honestly.
   Inherits "why possible now?"; plants "so would you stake the season on it?"
2. Copy, final:
   - Kicker: `WHY NOW`
   - Headline (Archivo, quote-forward): `"An amazing convergence` / `of technology."` (fragment of
     c12, verbatim words, split across 2 lines; straight quotes)
   - Body (40 words): `Norm Van Vactor, forty years in the fishery, means it literally: drone in a
     box, machine learning, Starlink Mini, lithium batteries, and solar panels, all maturing in the
     last year or two. Only now do they meet on one riverbank.` (c12, c10)
   - Tech readouts (mono, 5 small labels): `DRONE-IN-A-BOX` `MACHINE LEARNING` `STARLINK MINI`
     `LITHIUM BATTERIES` `SOLAR PANELS` (all from c12)
   - Counter `08 / 09`
3. Reader takeaway: "Five ordinary tools matured at once, and that is why the drone is here now."

**B. COMPOSITION**
4. Layout: headline cols 1-8 rows 2-3.6 (large, the warm hero line); body cols 1-7 rows 4-5.5;
   five tech readouts as a low instrument row cols 1-12 row 6.3-6.9. Focal: the dawn light source
   upper-right; asymmetric mass lower-left (type). Quiet zone: the warm sky.
5. Depth plan: bg Conic Horizon (#4) dawn -> faint volumetric shaft -> the five readouts converging
   on a point (a subtle supply-into-one node) -> type -> grain. Cues: implied off-canvas light,
   convergence lines, elevation on the readouts. Flat 2D (no data quantities here).
6. Continuity: timeline marker at 2026, now warm-tinted; palette-arc peaks (cold -> dawn) here;
   motif recedes (a breather-ish argument slide); readout row edge-teases right.

**C. ART DIRECTION**
7. Technique stack: **Conic Horizon (#4)** dawn sweep `in oklch` (tannin -> warm amber-rust at the
   light, NOT the house flare-amber gradient -- a muted sunrise over water), masked fade; one faint
   **Volumetric Shaft (#46)** wedge from upper-right, alpha 0.06. Five **Instrument Corner Readouts
   (#84)** as labeled ticks with thin convergence leaders (#72) meeting at a small node. Grain tile.
   This is the ONLY warm slide -- a deliberate palette-arc lift, still cool-anchored.
8. Data-in-art: five readouts = the five named enabling technologies (c12), literally converging to
   one point = "meet on one riverbank"; the warm light = "why now" optimism, budgeted and singular.
9. Palette: sky `#12232A` -> warm `#7A4A2E`/`#A9673B` at the light (muted sunrise, desaturated);
   readouts mono `#CBD3CF`; leaders `#8A97A0`; headline bone `#F1F0EC` (warm-neutral); node accent
   sockeye-red `#C23A2B` tiny; gold counter+Polaris. Contrast: headline on dawn >=7:1 (keep light
   away from the type mass); body in the cooler lower-left >=9:1.
10. Type: Headline Archivo wdth 118 wght 800, 96px (the deck's second-largest type, the warm line),
    leading 0.98. Body 460, 33px, max 620px. Readouts JetBrains Mono 500 20px small-caps tracked +12%.
11. Anchor spec: the convergence node (five leaders into one point) is the anchor; the dawn light is
    atmosphere. Van Vactor attribution mono 22px under the headline.

**D. VERIFICATION**
12. Reference intent: "A mission-poster dawn, restrained, one hopeful breath."
13. Risk flags: warm gradient banding -> OKLCH multi-stop + grain over it; keep headline off the
    brightest zone (contrast). The quoted fragment must be verbatim words from c12 (it is). Body
    lists five items with commas + "and" (no dash). Muted sunrise must NOT read as the banned
    house amber-teal slop.
14. Acceptance checklist:
    - [ ] headline is a verbatim fragment of Van Vactor's quote, straight quotes, 2 lines
    - [ ] five enabling-tech readouts present, all from the quote, converging to one node
    - [ ] this is the only warm-lit slide; gradient is grained, no banding
    - [ ] "forty years in the fishery" present (c10)
    - [ ] headline contrast >=4.5:1 over the dawn; gold only on counter + Polaris

---

## SLIDE 09 — CLOSE — single debate ask

**A. NARRATIVE**
1. Beat: one ask -- a real, debatable question; the brand fixtures; resolve the motif. Inherits
   "would you stake the season on it?"; closes the deck.
2. Copy, final:
   - Headline (Archivo, the single ask, 3 lines): `Would you stake` / `the season on a count` /
     `the machine has not proven?`
   - Fixture line (mono): `ALASKA.AI` (wordmark, Archivo expanded) + Polaris gold star +
     `alaskaaihq.com` (mono, small, near the mark) + `Sources in comments`
   - Counter `09 / 09`
   - No stacked ask (the question IS the single ask; no "save this" added).
3. Reader takeaway: "A genuine, uncomfortable question worth answering in the comments."

**B. COMPOSITION**
4. Layout: the resolved sockeye small, center-right rows 2.5-4 (wearing BOTH marks, the motif
   paid off); headline cols 1-9 rows 4.5-6.8 (large); fixtures row 7.5-8; year-ruler with the
   marker finally at 2026, sockeye-red. Focal: the question. Quiet zone upper-left.
5. Depth plan: bg -> resolved fish (small, both marks) -> type -> grain. Minimal; a calm close.
   Cues: shadow under the fish, the red marker terminus. Flat.
6. Continuity: timeline marker RESTS on 2026 in sockeye-red (journey complete); motif fully
   resolved (hand stroke + bounding box on one fish); river current stops at the right edge (the
   run continues past frame -- the one open thread left deliberately).

**C. ART DIRECTION**
7. Technique stack: the SpawningSockeye icon (small) with both marks; a quiet Mesh Wash bg; Grain
   tile; the wordmark in Archivo expanded (wght 800, wdth 120); Polaris 4-point gold star (#FFC72C
   + halo). Year-ruler resolved. Nothing loud -- the question carries the slide.
8. Data-in-art: the marker resting on 2026 = "we have arrived at the decision" (c5 spine); both
   marks on one fish = the deck's thesis resolved.
9. Palette: bg `#0B1519`->`#13232A`; fish `#C23A2B`/head `#37432B`; headline bone `#E9ECE7`;
   wordmark bone; site + sources mono `#9DB0AE`; gold on the Polaris star + counter + the marker
   terminus. Contrast: headline >=12:1.
10. Type: Headline Archivo wdth 112 wght 780, 92px, 3 lines, leading 1.0. Wordmark Archivo wdth 120
    wght 800, 40px, tracking +0.02em. Site + sources JetBrains Mono 22px small-caps. Counter mono 24px.
11. Anchor spec: the resolved fish is the anchor; the wordmark + Polaris + site are the fixed brand
    constellation (per CAROUSEL_CRAFT close-slide rule: site always present, small, mono, near mark).

**D. VERIFICATION**
12. Reference intent: "A closing editorial question, quiet and hard."
13. Risk flags: only ONE ask (the question) -- do not add "save this". Site fixture present but not
    crowding the ask. Straight quotes; no dash. Fish small so it does not compete with the question.
14. Acceptance checklist:
    - [ ] exactly one ask (the debate question); no stacked CTA
    - [ ] alaskaaihq.com present, small, mono, near the ALASKA.AI wordmark
    - [ ] "Sources in comments" present; Polaris gold star present
    - [ ] the resolved fish shows BOTH marks; the year marker rests red on 2026
    - [ ] headline is 3 lines, no orphan, straight quotes, no dash
    - [ ] gold only on Polaris + counter + marker terminus

---

## STORYBOARD GATE (self-review) -- PASS
- 9 slides (within 6-12, default 8-10). Cover <=12 words (11). Slide 2 pays off immediately.
- Breather exists (S5). Two keepable data slides (S3 tower numbers, S6 scorecard).
- Single-ask close (S9) with "sources in comments" + alaskaaihq.com in mono near the mark. Polaris.
- >=2 continuity devices (3: timeline-spine, motif-evolution, edge-tease).
- Every on-slide number carries a claim-id (claims index above). Variety divergence stated (6 axes).
- Honesty guaranteed: in-training/UNPROVEN (S4,S6), ADF&G-not-a-partner (S7); every number is a
  tower number. No fabricated accuracy figure anywhere.
- A stranger could sketch each slide from its dossier. Ready for copy chamber + art build.
