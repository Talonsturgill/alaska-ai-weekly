# STORYBOARD — 2026-07-12 — Carousel No. 5
# "First Machine to the Fire"

## DECK HEADER

**Thesis.** Alaska's roadless Interior has quietly become the world's test range
for autonomous wildfire robots: five finalist teams are racing on a 1,000 square
kilometer Alaska range, run through UAF, to prove a machine can close the loop
from spark to suppression before any human arrives, and the verdict is not in.

**PDF document title (<=60):** First Machine to the Fire

**Arc (9 slides).**
1. COVER (hook, emblem) - the open Autonomy Ring over a dusk spruce field, one ember at center. Loop: what closes the ring?
2. THE ARENA (pays off) - 1,000 km2 Alaska range, run by UAF ACUASI, an FAA UAS test site. Loop: why here?
3. WHY ALASKA (stakes data) - background fire record, the reason Alaska is the arena. Loop: who is competing?
4. THE FIVE (keepable data) - five finalists, narrowed from nearly 300. Loop: what must they do to win?
5. THE AUTONOMY LOOP (signature) - detect, decide, dispatch, douse as one closed ring, no human in the loop. Loop: has anyone closed it?
6. THE MACHINE (rendered hero, breather) - a backlit responder over a fire-lit dusk; "Dryad says" it did, attributed. Loop: what is it worth?
7. THE PURSE (keepable data) - the 11M dollar prize architecture in honest bars. Loop: when do we know?
8. THE VERDICT (synthesis, position) - September 2026; ring closes with a gold seal; the real stakes and the honest caveat. Loop: what should an Alaskan watch?
9. CLOSE - single ask + fixtures.
Emotional temperature: cool -> hot at the stakes (S3) and the douse (S6) -> cold resolution (S8-9).

**Slide-count rationale.** 9 slides = 1 cover + 7 content + 1 close, inside the
8-10 save-optimal band. Rhythm alternates dense and breather: hook / context /
data / data / signature-diagram / rendered-breather / data / synthesis / close.

**Continuity system (two devices, neither forbidden).**
1. MOTIF EVOLUTION - the closing Autonomy Ring. Fixed top-right, ~86px, a
   4-arc cyclic state ring (detect/decide/dispatch/douse) that lights one arc
   per stage and seals shut with a gold Polaris at the verdict. It IS the
   progress counter. A DISCRETE STATE ring, not a continuous trace, so it does
   not repeat the forbidden motif-trace + edge-tease pairing.
   State table:
   | Slide | Ring state                         | Ember/fire state          |
   |-------|------------------------------------|---------------------------|
   | 1     | open, gap at top, faint            | ember at ring center      |
   | 2     | +detect arc lit (cyan)             | spark on the range        |
   | 3     | detect lit                         | burn-scar glow (hot beat) |
   | 4     | +decide arc lit                    | five sparks (the teams)   |
   | 5     | full 4-arc schematic (the subject) | ember hunted by the loop  |
   | 6     | +dispatch+douse, 3/4 to closed     | ember being hit (peak)    |
   | 7     | nearly closed                      | ember cooling             |
   | 8     | CLOSED + gold Polaris seal         | ember cold                |
   | 9     | closed quiet mark                  | ember gone, pre-dawn      |
2. PALETTE ARC - temperature drops as autonomy "wins". Ember-hot spruce night
   (1) -> cyan detection signal enters (2-5) -> fire-peak confrontation (6) ->
   cooling (7) -> snow/ice pre-dawn, fire out (8-9).

**Variety ledger check (REQUIRED divergence, stated).**
- Last 4 hero structures: cartographic camera-map (No.1), evolving glyph-ledger
  (No.2), trace-conductor instrument panel (No.3), subsurface cutaway panorama
  spine (No.4). THIS deck: a closing cyclic control-system RING + a single-actor
  deep-field rendered machine. New.
- Last 3 atmospheres: tannin river fog, obsidian-instrument-ember-phosphor,
  core-sample haze. THIS deck: cold spruce-tinted dusk-night with a small warm
  ignition (green-tinted base, deliberately NOT run-3 obsidian, NOT run-4 ochre).
- Last 2 devices: panorama-spine+valve, motif-trace+edge-tease. THIS deck:
  discrete state-ring motif-evolution + palette-arc. New.
- Last 3 hooks: named-tension/before-after, present-tense reveal, cutaway-reveal.
  THIS deck: engineered-emblem / insignia cold-open. New.
- Last 3 palettes: tannin-slate, obsidian+ember+phosphor, depleted-reservoir
  ochre. THIS deck: spruce-night + fire-orange antagonist + cyan/mint machine cue.
- Last 2 type pairings: Fraunces+Manrope+JetBrains, Space Grotesk+JetBrains+
  Instrument Serif. THIS deck: Archivo variable + JetBrains Mono. New.
- Editorial adjacency guard: run 3 (volcano AI) was passive Alaska-built
  MONITORING ("a machine is listening"). This deck is ACTIVE global-competition
  ROBOTS that physically act on a fire. The art avoids instrument-gauge/HUD
  language to stay clear.

**Variance dials.** DESIGN_VARIANCE 4 (the closing control-ring engine board is a
genuinely new structural idea). VISUAL_DENSITY 3 (breathing room; one idea per
slide; prior runs ran dense). TYPE_TEMPERATURE 2 (cool grotesk Archivo, editorial
and analytical, resisting warm serif).

**Palette + type system.**
Palette (roles):
- bg base spruce-night: deep_night #02060F, spruce-black #08130E, spruce elev #0F2A20
- sky/horizon: flag_blue_horizon #081426, smoke-dusk #1B3550 / #24435F
- smoke: #6B7A78 (gray-green)
- FIRE antagonist (small area only): #FF6A2C, deep #C43A16, halo #FFB25A
- MACHINE cue (protagonist cool): aurora mint #3CE6B4, ice #5AC8F0
- resolution: snow #F4F8FF, ice-blue #CFE4F0
- GOLD #FFC72C: Polaris star (every slide), the ring-seal (S8), the mono counter,
  and the single "September 2026" marker (S8). ~6% area max; most-saturated on
  smallest area. Fire-orange is a deliberately different hue so gold never muddies.
Type:
- DISPLAY: Archivo variable (wght 400-900, wdth 62-125). Expanded Black/SemiBold
  for hero headlines; condensed for engineered labels. opsz n/a.
- BODY: Archivo Regular/Medium (one family + mono avoids the two-sans crime).
- INSTRUMENT: JetBrains Mono 400/500/700 (labels, counter, telemetry, coords).
Global seed: 20260712 (AK.reseed / AK.rng). All grain via AK.grainTile tile,
opacity 0.06-0.10, never a full-frame feTurbulence rect. Every art canvas at 2x
backing; text is DOM/SVG only; canvas labels (if any) via AK.canvasLabel plates.
Every art canvas finished with AKPOST.grade (grain + IGN dither; aberration only
on hero-art slides 1 and 6).

**Claims index.**
- c1 ($11M) -> S7. c2 (5 finalists) -> S4, S5. c3 (1,000 km2) -> S2. c4 (ACUASI/
  UAF) -> S2. c5 (FAA UAS test site) -> S2. c6 ($3.5M/track) -> S7. c7 ($1M
  Lockheed detection bonus) -> S7. c8 ($750K semifinal / $150K each) -> S4, S7.
  c9 (September 2026) -> S8. c10 (~300 teams) -> S4. c11 (Santy quote) -> S3 or S8
  (optional). c12 (Dryad detected+suppressed, ATTRIBUTED) -> S6. c13 (100 L,
  ATTRIBUTED) -> S6. c14 (30,000+ sensors, ATTRIBUTED) -> S5 texture label.
  c16 (3 of 4 seasons, BACKGROUND) -> S3. c17 (nearly half 2022, BACKGROUND) -> S3.
Every on-slide number carries its claim-id in the dossier below. Self-reported
Dryad claims (c12/c13/c14) appear ONLY with "Dryad says" attribution on-slide.

---

## SLIDE 01 - COVER (emblem hook)

**A. NARRATIVE**
1. Beat: the hook. Introduce the Autonomy Ring and the race in one monumental
   emblem. Plants the loop: what closes the ring / who reaches the fire first?
2. Copy, final:
   - kicker (mono, JetBrains, 24px): "ALASKA . AI  .  NO. 05" (counter fixture) and eyebrow "THE AUTONOMY RACE" (18 chars).
   - headline (Archivo Expanded Black, hero): "First Machine to the Fire" (25 chars, 2 lines: "First Machine" / "to the Fire").
   - dek (Archivo Medium, 34px): "Alaska is the test range for the world's firefighting robots." (60 chars) [thesis, no number -> no claim-id needed on cover]
   - footer coords (mono, data-decorative): "64 50 N  147 43 W" (Fairbanks, data-decorative).
   - counter: "01 / 09".
3. Reader takeaway: Alaska is where firefighting robots are being proven; a race is on.

**B. COMPOSITION**
4. Layout map: 12x8 grid. The Autonomy Ring emblem centered on cols 4-9, rows
   3-6 (optical center slightly high, focal point at rule-of-thirds upper-center
   ember). Headline lower-left cols 1-8 rows 6-7. Dek under headline row 7-8.
   Kicker top-left row 1. Ring-motif also mirrored small top-right (the fixed
   progress mark) - on the cover it is the SAME ring at hero size, so the fixed
   corner mark is omitted here and introduced at S2 (note this exception).
   Quiet zone: upper-right sky. Eye path: ember center (1) -> headline (2) -> dek (3).
5. Depth plan: bg spruce-night radial (deep_night to spruce-black) -> atmospheric
   dusk band low -> the Ring as a glowing torus emblem with soft outer bloom ->
   ember at center with a thin smoke wisp rising -> type plates -> grain. Depth
   cues: glow/bloom halo (light), occlusion (smoke wisp crosses ring), atmospheric
   fade at the low horizon, one focal plane on the ring. Focal plane: the ring.
   2D multiplane (no GPU on the cover for safety); akpost grade + subtle aberration.
6. Continuity device state: Ring OPEN with a visible gap at top (loop not closed);
   ember burning at center. This is the birth of the motif. Nothing bleeds off edge.

**C. ART DIRECTION**
7. Technique stack: #50 Title-Card Hook + a bespoke "Autonomy Ring" emblem
   (canvas 2x): a torus ring stroked in cyan (#5AC8F0) with #47 Neon Layering
   (3 same-hue glow layers, blur 0/18/40px, near-white core) and a top gap of
   ~26deg; ember = radial-gradient(circle) #FFB25A->#FF6A2C->transparent, r~70px,
   with a #46-style thin smoke shaft (2-3 wedge polys, screen blend, alpha
   0.05-0.09, noise-masked, seed 20260712). Background: #3 Mesh Wash (4 radial
   stops in OKLCH) + #2 Grain tile (AK.grainTile(280, 52, seed), overlay 0.08).
   AKPOST.grade(exposure 1.05, grain on, IGN dither, aberration 0.4 hero-only).
8. Data-in-art mapping: none numeric on cover (emblem is conceptual). The ring's
   4 arc segments preview detect/decide/dispatch/douse; the single ember = the
   one fire every machine must reach.
9. Palette assignment: bg #02060F->#08130E; ring stroke #5AC8F0 + mint inner
   #3CE6B4 hairline; ember #FF6A2C/#FFB25A; headline snow #F4F8FF; dek #CFE4F0;
   gold #FFC72C ONLY on a small Polaris star tucked at the ring's sealed base
   (bottom of ring) as a 1-per-deck fixture. Worst-case contrast: snow headline
   on spruce-night ~14:1 (pass); dek #CFE4F0 on #081426 ~9:1 (pass).
10. Type spec: headline Archivo, wght 800, wdth 112 (expanded), 132px, leading
    0.98, tracking -0.02em, case Title, color snow, align optical-left, max-width
    900px, fit via AK.fitText(min 96, max 150, maxLines 2). Dek Archivo Medium
    500, 34px, leading 1.28, tracking 0, snow-ice, max-width 640px. Kicker/counter
    JetBrains Mono 500, 24px, tracking .16em, cyan #8FDCF7 / mono-grey.
11. Anchor spec: the literal anchor is the Ring emblem itself (the machine-loop)
    + the ember (the fire). Annotation furniture: a fine mono tick at each of the
    4 arc joints (hair 0.75px), unlabeled on the cover (labeled at S5).

**D. VERIFICATION**
12. Reference intent: "a mission-patch insignia meets a Reuters dusk cover" - an
    emblem that is also a place.
13. Risk flags: (a) headline "First Machine / to the Fire" must fit 2 lines at
    132px in a 900px box - use AK.fitText, verify line count (instinct 4). (b) the
    ring glow must not wash out the ember at center - keep ember on top z, bloom
    radius small. (c) aberration must stay subtle (<=0.5px) so type stays crisp
    (type is DOM, unaffected, but the ring should not fringe garishly).
14. Acceptance checklist:
    - [ ] headline renders exactly 2 lines, no third line into the dek.
    - [ ] the ring has a clear gap at the top (loop visibly OPEN).
    - [ ] the ember is the single most-saturated warm point; gold appears only on
          the small Polaris at the ring base.
    - [ ] at 432px the emblem reads as one glowing ring caging a fire spark.
    - [ ] no canvas text; all type DOM; grain is a tile not a full-frame rect.
    - [ ] cover word count <= 12 (headline 5 + dek is support, dek <= 10 words).

---

## SLIDE 02 - THE ARENA (pays off immediately)

**A. NARRATIVE**
1. Beat: pay the cover's loop - name the arena. Alaska is not the backdrop, it is
   the range. Plant: why here?
2. Copy, final:
   - kicker (mono): "THE RANGE".
   - headline (Archivo SemiBold 640, 68px): "A thousand square kilometers of Alaska, wired for fire." (54 chars, 2 lines).
   - body (Archivo Regular, 33px, ~34 words): "The finals of the world's autonomous wildfire contest are being field tested across a 1,000 square kilometer range in Alaska, run through the University of Alaska Fairbanks. It is an FAA designated test site for unmanned aircraft." [c3, c4, c5]
   - label on the scale box: "1,000 km2 TEST ZONE" [c3] and "UAF ACUASI" [c4].
   - counter "02 / 09"; coords data-decorative.
3. Reader takeaway: the world's firefighting-robot finals run on a huge Alaska range via UAF.

**B. COMPOSITION**
4. Layout map: headline top cols 1-9 rows 1-2; body left cols 1-6 rows 3-4; the
   scale device (a 1,000 km2 graticule box with a scale bar) lower-right cols
   7-12 rows 4-7, off-axis mass counterweighted by the small ring mark top-right.
   Quiet zone: lower-left. Eye path headline -> body -> scale box.
5. Depth plan: bg spruce-night; a faint low relief of spruce ridge silhouettes
   (2 layers, atmospheric fade) behind a clean measured graticule box; the box
   sits on a subtle plane. Depth cues: atmospheric fade on ridges, occlusion
   (box over ridge), one focal plane on the box, fog low. NOT a hero AK map (to
   avoid run-1 cartographic camera): the geography is implied by a scale bar and
   a single small "Interior Alaska" locator tick, NOT a rendered coastline.
6. Continuity state: fixed ring mark introduced top-right (86px) with the DETECT
   arc now lit cyan; one spark on the range inside the scale box. Ember thread: a
   single ignition dot inside the zone.

**C. ART DIRECTION**
7. Technique stack: #83 Drafting furniture (title-block scale bar, corner ticks,
   0.75px hair grid inside the box at 10x10 to imply 1,000 km2), #79 cased line
   for the box edge (2px std), #57 Frozen Dash for a faint sensor-mesh hint
   inside. Spruce ridge silhouettes via #12 Ridgeline Pulse (2 rows, amplitude
   from noise seed 20260712, filled with bg then stroked, alpha fade). Grain tile.
8. Data-in-art mapping: the graticule box = 1,000 km2 [c3]; its 10x10 hair grid =
   100 cells so one cell = 10 km2 (a readable scale, stated on the scale bar).
   One ember dot = the fire a machine must reach.
9. Palette: bg #02060F/#08130E; ridges #0F2A20 fading to #1B3550; box stroke ice
   #5AC8F0; grid hair #24435F; label snow; spark #FF6A2C. Gold only on Polaris +
   ring seal-base + the lit DETECT arc stays cyan (not gold). Contrast: body snow
   on spruce ~13:1.
10. Type spec: headline Archivo 640 wdth 100, 68px, leading 1.02, tracking -0.01,
    max-width 860px, fit-to-box 2 lines. Body Archivo Regular 400, 33px, leading
    1.34, max-width 560px (ENDS before the scale box - verify line count vs box,
    instinct 4). Labels JetBrains Mono 500, 22px, tracking .1em, cyan.
11. Anchor spec: the scale box + scale bar (the arena, measured). Furniture:
    corner registration ticks, a "N" arrow (fine), a locator tick "INTERIOR AK".

**D. VERIFICATION**
12. Reference intent: "an engineer's site plan of a wildland test range."
13. Risk flags: (a) body could collide with the scale box - cap body max-width
    560px and keep the box in cols 7-12. (b) the ridge silhouettes must stay
    subtle, not become a competing hero. (c) do not draw a full Alaska coastline
    (run-1 avoidance).
14. Acceptance checklist:
    - [ ] body text ends clear of the scale box (no overlap at full or thumb).
    - [ ] "1,000 km2" and "UAF ACUASI" both legible at 432px.
    - [ ] ring mark top-right shows exactly one lit arc (DETECT), rest dim.
    - [ ] scale bar states the cell = 10 km2 mapping.
    - [ ] no rendered coastline; geography is implied by scale + one locator tick.

---

## SLIDE 03 - WHY ALASKA (stakes, data, hot beat)

**A. NARRATIVE**
1. Beat: escalation - why Alaska is the arena. The fire record makes the stakes
   concrete. Plant: who is competing?
2. Copy, final:
   - kicker: "WHY HERE".
   - headline (Archivo SemiBold, 64px): "The state that keeps setting fire records." (43 chars, 2 lines).
   - stat A (Big-Number): "3 of 4" with label "of Alaska's largest fire seasons have hit in the last 25 years" [c16].
   - stat B: "~ half" with label "of all US acreage burned in 2022 was in Alaska" [c17].
   - background tag (mono, small): "BACKGROUND . SOURCE ASU NEWS 2025" (marks c16/c17 as background).
   - body (Archivo Regular, 32px, ~26 words): "In a fire prone, roadless Interior, minutes to detection is the whole game. That is why the world came here to test machines that do not wait for a crew." [editorial framing, no fabricated number]
   - counter "03 / 09".
3. Reader takeaway: Alaska's record-breaking fire seasons are why it is the test range.

**B. COMPOSITION**
4. Layout map: two stacked Big-Number tiles on the right (cols 7-12, rows 2-6),
   headline top-left (cols 1-7 rows 1-2), body lower-left (cols 1-6 rows 5-7).
   Focal point: the "3 of 4" tile. A hot ember/burn-scar glow bleeds low behind
   the tiles (the hottest palette beat). Quiet zone: mid-left gutter.
5. Depth plan: bg spruce-night with a low warm burn-scar gradient (the one hot
   beat) -> two data plates (frost-panel style, subtle) floating -> type -> grain.
   Depth cues: elevation shadow on plates, warm-glow light from below, one focal
   plane on tiles. This is a DATA slide - honest flat tiles, no perspective.
6. Continuity state: ring mark DETECT lit (unchanged, decide not yet); ember
   thread widens to a burn-scar glow (the stakes are hot). Palette peaks warm here.

**C. ART DIRECTION**
7. Technique stack: #29 Big-Number Tile x2 (huge tabular Archivo figures + hairline
   rule + one-line context), on subtle #8 Frost Panel plates. Warm burn-scar =
   #4 Conic Horizon low glow (oklch, masked fade, alpha 0.5) in #C43A16->#FF6A2C.
   Grain tile. No aberration (data slide).
8. Data-in-art mapping: the "3 of 4" set as 4 small season bars, 3 lit warm, 1
   dim (ISOTYPE honesty) beside the numeral [c16]; the "~ half" as a split bar,
   left half warm = Alaska, right half grey = rest of US, for 2022 [c17].
9. Palette: bg spruce-night; burn glow #C43A16/#FF6A2C low; plates #0F2A20 at 60%;
   numerals snow; warm accent on the lit bars only; gold on Polaris only. Contrast:
   numerals snow on plate ~10:1; background tag mono #8FA0AE on spruce ~5.5:1 (ok,
   data-decorative anyway).
10. Type spec: numerals Archivo 800 wdth 90, 150px, tabular; labels Archivo Regular
    30px leading 1.3 max-width 380px; headline 64px 2 lines; body 32px max-width
    540px; background tag JetBrains Mono 20px tracking .12em.
11. Anchor spec: the two data tiles are the anchors; furniture = hairline rules,
    the 4-season ISOTYPE bars, the split bar with a center divider tick.

**D. VERIFICATION**
12. Reference intent: "an FT stat spread, arctic edition, lit by a distant fire."
13. Risk flags: (a) must LABEL both stats BACKGROUND (guardrail on c16/c17) and
    say "2022" for the half-acreage stat (do not generalize). (b) warm glow must
    not overpower - it is a low beat, keep alpha <=0.5. (c) numerals must be
    tabular and not collide with labels (instinct 4).
14. Acceptance checklist:
    - [ ] both stats carry a visible BACKGROUND marker and c-ids in the dossier.
    - [ ] "~ half" is explicitly tied to 2022, not "every year".
    - [ ] the 4-season ISOTYPE shows 3 lit + 1 dim.
    - [ ] warm glow is the deck's hottest beat but does not wash the numerals.
    - [ ] gold appears only on the Polaris mark.

---

## SLIDE 04 - THE FIVE (keepable data)

**A. NARRATIVE**
1. Beat: the field. Five finalists, narrowed from a huge field. Plant: what must
   they DO to win?
2. Copy, final:
   - kicker: "THE FINALISTS".
   - headline (Archivo SemiBold, 62px): "Five machines made the finals." (30 chars, 1-2 lines).
   - roster (Archivo Medium 34px, mono tag each): "Anduril", "Data Blanket", "Dryad", "FireSwarm Solutions", "Wildfire Quest" [c2] with country tags (USA / USA / Germany / Canada / USA).
   - funnel label: "from nearly 300 teams worldwide" [c10].
   - semifinal note (mono 22px): "$750K semifinal purse, split five ways = $150K each" [c8].
   - body (Archivo Regular 32px, ~22 words): "This is the Autonomous Wildfire Response track. A separate detection track competes elsewhere. These five are the ones on Alaska ground." [c2]
   - counter "04 / 09".
3. Reader takeaway: five named teams, cut from ~300, are the Alaska finalists.

**B. COMPOSITION**
4. Layout map: a vertical roster list of 5 nodes down the right (cols 7-12, rows
   2-7), each a labeled node on a spine; a funnel graphic upper-left (cols 1-6
   rows 2-4) narrowing ~300 -> 5; body lower-left rows 6-7. Focal: the 5-node
   roster. Quiet zone: mid gutter.
5. Depth plan: flat systems layout (data honesty). bg spruce-night; the funnel as
   a converging set of hairlines; nodes as cased dots (#76 junction) with a cyan
   glow. Depth cues: elevation shadow on nodes, slight scale gradient on funnel
   (near dots larger), one focal plane. Grain.
6. Continuity state: ring mark +DECIDE arc lit (2/4). Ember thread: five small
   sparks (one per team) arrayed on the range.

**C. ART DIRECTION**
7. Technique stack: #22 Constellation Graph (5 glow nodes + faint edges to a
   central range point), #76 junction dots, #79 cased connector lines, a funnel
   built from #82 single-arrowhead converging leaders. ISOTYPE-safe: the five
   $150K ticks equal-size (#28). Grain tile.
8. Data-in-art mapping: 5 nodes = 5 finalists [c2]; funnel width start = "nearly
   300" [c10] tapering to 5; five equal ticks = $150K each from $750K [c8].
9. Palette: bg spruce-night; nodes ice #5AC8F0 with mint #3CE6B4 cores; funnel
   hair #24435F; labels snow; country tags mono grey; gold Polaris only. Contrast:
   roster labels snow on spruce ~13:1.
10. Type spec: roster Archivo Medium 500, 34px; country tags JetBrains Mono 20px
    tracking .1em; headline 62px; funnel label mono 22px; body 32px max-width 520px.
11. Anchor spec: the 5-node roster is the anchor; furniture = junction dots, cased
    edges, funnel leaders, equal $150K ticks with a $750K bracket.

**D. VERIFICATION**
12. Reference intent: "a tournament bracket drawn by a transit-map cartographer."
13. Risk flags: (a) 5 team names must all be legible at 432px - keep to one column,
    34px. (b) do NOT imply Dryad is a top-3 (five finalists, equal). (c) keep the
    4-arc ring and the 5-team count from muddling (never share a labeled ring here).
14. Acceptance checklist:
    - [ ] all five team names readable at thumb; countries tagged correctly.
    - [ ] the funnel reads ~300 -> 5; "nearly 300" wording used (c10 guardrail).
    - [ ] five equal $150K ticks sum to $750K, labeled.
    - [ ] no "final three" anywhere; all five shown equal.
    - [ ] ring shows 2 arcs lit (detect+decide).

---

## SLIDE 05 - THE AUTONOMY LOOP (signature)

**A. NARRATIVE**
1. Beat: the coined framework and the crux. What the machines must actually do:
   close the loop with no human. Plant: has anyone closed it?
2. Copy, final:
   - kicker: "THE LOOP".
   - headline (Archivo Expanded Black, 84px): "Detect. Decide. Dispatch. Douse." (32 chars, the coined frame).
   - 4 block labels (Archivo condensed caps 30px): DETECT / DECIDE / DISPATCH / DOUSE, each with a mono sub-label (mono 18px): "sensors flag a spark" / "AI confirms and targets" / "a drone launches itself" / "suppressant on the ignition".
   - knockout tag: "NO HUMAN IN THE LOOP".
   - mesh note (mono 18px, attributed): "sensor mesh, Dryad says 30,000+ deployed globally" [c14].
   - counter "05 / 09".
3. Reader takeaway: winning means closing detect-decide-dispatch-douse with no human.

**B. COMPOSITION**
4. Layout map: the ring schematic centered (cols 3-10, rows 2-7) at full size:
   four blocks at 12/3/6/9 o'clock, clockwise cyan signal lines, junction dots, a
   hop-over; a sparse sensor mesh lower-left feeding DETECT; an arrow from DISPATCH
   arcing to the central ember. Headline top (cols 1-11 row 1). "NO HUMAN IN THE
   LOOP" knockout lower-center. Quiet zone: corners.
5. Depth plan: near-flat schematic with slight elevation (cased lines cast a 1px
   shadow), one focal plane on the ring. bg spruce-night; central ember low glow.
   Depth cues: cased-line elevation, glow on the lit path, occlusion at the hop-over.
6. Continuity state: the ring IS the subject here - full 4-arc schematic, 3/4 lit
   (douse arc dim, "not yet closed"). The corner mark can drop to a tiny echo this
   slide (declare data-overlap-ok if needed). Ember: hunted by the loop at center.

**C. ART DIRECTION**
7. Technique stack: #13 Interference-free clean schematic using #77 octolinear
   routing, #79 cased cyan lines, #76 junction dots, #82 one arrowhead, #83
   drafting title-block for the block labels; sensor mesh = sparse #22 constellation
   nodes (cyan, ~40 dots, seed 20260712) with a dashed #57 vector to DETECT. Central
   ember radial. Grain tile. Canvas art must ROUTE AROUND the 4 block labels and the
   knockout tag (instinct 5) - reserve label rects, draw lines outside them.
8. Data-in-art mapping: 4 blocks = the 4 loop stages; the ~40-node mesh nods to
   "30,000+ sensors, Dryad says" [c14] (attributed, a texture cue not a literal
   count); the dim 4th arc = the loop not yet proven closed (thesis in geometry).
9. Palette: bg spruce-night; ring/lines ice #5AC8F0, lit path mint #3CE6B4; blocks
   outlined snow; knockout tag on a dark plate (#0F2A20) snow text; ember #FF6A2C;
   gold Polaris only. Contrast: block caps snow on spruce ~13:1; knockout on plate ~11:1.
10. Type spec: headline Archivo 800 wdth 108, 84px (fit 1-2 lines); block labels
    Archivo 700 wdth 78 (condensed) 30px tracking .04em; sub-labels + mesh note
    JetBrains Mono 18px; knockout tag Archivo 700 26px on plate.
11. Anchor spec: the ring schematic is the anchor; furniture = junction dots,
    cased lines, one arrowhead, a hop-over bridge, the sensor-mesh field.

**D. VERIFICATION**
12. Reference intent: "a control-systems textbook figure, but alive - signal is
    chasing a fire around the ring."
13. Risk flags: (a) CANVAS-DRAWN lines must not overprint the 4 DOM block labels
    or the knockout tag (instinct 5) - reserve rects at plan time and route lines
    around them; pixel critic must check canvas-vs-text. (b) do not let this read
    as a passive gauge panel (run-3 avoidance) - the signal must visibly travel /
    the loop must be directional and 3/4 closed. (c) keep 4-vs-5 (loop vs teams)
    unmixed - no team names here.
14. Acceptance checklist:
    - [ ] all 4 block labels + sub-labels legible and NOT crossed by canvas lines.
    - [ ] the ring is clearly 3/4 lit with one dim arc (douse), directional arrows.
    - [ ] "NO HUMAN IN THE LOOP" sits on an opaque plate, high contrast.
    - [ ] the 30,000+ sensor note is attributed to Dryad.
    - [ ] reads at 432px as a glowing loop hunting a fire.

---

## SLIDE 06 - THE MACHINE (rendered hero, breather)

**A. NARRATIVE**
1. Beat: the breather + the rendered payoff, AND the honest data point. A machine
   over a fire-lit dusk. The one place the Dryad demo appears, attributed. Plant:
   what is it worth (money) / when do we know (verdict)?
2. Copy, final:
   - kicker: "THE DOUSE".
   - headline (Archivo SemiBold, 60px): "One machine, over one spark, alone." (35 chars, 2 lines).
   - attribution plate (Archivo Regular 30px, ~30 words): "Dryad says its sensors and drone detected a small wildfire within minutes and put it out with no human on scene during the Alaska trials, up to 100 liters of suppressant." [c12, c13, both attributed]
   - caveat tag (mono 20px): "COMPANY SELF REPORT . NOT INDEPENDENTLY VERIFIED".
   - counter "06 / 09".
3. Reader takeaway: a finalist claims a machine put out a fire alone here (its own word).

**B. COMPOSITION**
4. Layout map: rendered scene fills the frame; monumental low horizon (~22% from
   bottom, horizonY ~1050). The machine silhouette upper-third-left (focal, ~y430);
   a warm ignition + smoke column low-right; blurred spruce repoussoir bottom-left.
   Headline in the upper-left sky quiet zone (cols 1-7 row 1-2). Attribution plate
   lower-left on a dark plate (cols 1-7 rows 6-7), clear of the fire. Ring mark
   top-right. Eye path: machine -> fire -> attribution.
5. Depth plan (3D, camera math): akthree PerspectiveCamera, vfov 52, principal cy
   675, f = 675/tan(26deg) ~= 1384px, pitch -15deg -> horizonY = 675 + tan(15deg)*
   1384 ~= 1050 (monumental low horizon, 22% from bottom). Machine on the sharp
   focal plane at screen y~430 (upper third). Depth cues (6): (1) atmospheric
   perspective across ~5 spruce ridgelines lerped to smoke-blue by (i/5)^1.4; (2)
   occlusion - silhouette over the brightest smoke band; (3) DOF - one tack-sharp
   plane on the machine, near spruce blurred repoussoir off bottom-left; (4) exp2
   fog in smoke-blue, thickest low near the glow; (5) one key light = the fire
   (warm, 6:1), cool aurora-ice fill, spruce-teal shadows never black; (6)
   volumetric smoke shafts (#46, screen blend alpha 0.06-0.10) with dust motes.
6. Continuity state: ring +DISPATCH+DOUSE arcs light -> 3/4 to nearly-closed; the
   ember is being HIT (peak warm). Palette peaks warm-near here, then cools after.

**C. ART DIRECTION**
7. Technique stack: #87 akthree GPU PBR. Rig AKT.rigs.goldenHour re-tinted warm-low
   (the fire as key) or a custom low warm key; machine = a compact matte body
   (AKT.mat.plastic dark #10202A or steel darkened) kept as a BACKLIT SILHOUETTE
   (no fine PBR detail to fumble) with ONE cyan nav LED (#47 neon, emissive mint
   #3CE6B4, intensity <=2.2, small); ground AKT.ground spruce #0A1A18; ignition =
   an emissive ember patch + #46 smoke shafts on the 2D composite. Render into an
   OFFSCREEN canvas, drawImage onto the slide 2D canvas, then AKPOST.grade (bloom
   on the fire, exposure 1.1, ACES already in akthree, masked grain, IGN dither,
   hero aberration 0.5) + akcolor OKLCH ramp for the sky. setPixelRatio BEFORE
   setSize; await AKT.snapshot(R) and CHECK .ok (black-frame sentinel).
   FALLBACK (webglOK()===false OR snapshot.ok===false): #42 Multiplane Parallax in
   AK3D - 5 ridge layers (atmospheric lerp), a drawn dark machine silhouette at the
   same screen coords, an ember radial + smoke shaft. Same composition, no GPU.
8. Data-in-art mapping: the single machine + single ember = the whole thesis image;
   the 100 L [c13] shown as a measured suppressant plume onto the ignition; the
   scene is generic ("an autonomous responder"), NOT Dryad-branded.
9. Palette: sky smoke-blue #1B3550/#24435F; spruce #0A1A18/#12312A; machine dark
   with mint LED #3CE6B4; fire #FF6A2C/#FFB25A (small, key light); attribution
   plate #08130E; gold Polaris + ring seal-progress only. Contrast: headline snow
   on smoke-blue sky ~7:1 (pass, worst case - verify the exact sky luma under the
   headline; add a subtle deep-sea scrim #7 under the headline if <4.5:1); plate
   text snow on #08130E ~13:1.
10. Type spec: headline Archivo 640 wdth 100, 60px, 2 lines, snow, optical-left;
    attribution Archivo Regular 30px leading 1.32 max-width 560px on plate; caveat
    JetBrains Mono 20px tracking .1em amber-grey #C9A36A (NOT gold - a muted warn).
11. Anchor spec: the rendered machine + ignition is the anchor; furniture minimal
    (this is the breather) - just the attribution plate and the caveat tag.

**D. VERIFICATION**
12. Reference intent: "a still from a nature documentary about a machine - vast,
    quiet, one small protagonist against weather."
13. Risk flags: (a) akthree hero is the tallest bar - MITIGATED by backlit
    silhouette (no lumpy-drone detail), render budget on atmosphere + one key
    light, and a designed AK3D fallback; check snapshot .ok. (b) headline over sky
    could drop below 4.5:1 - verify worst-case luma, scrim if needed. (c) the fire
    must stay SMALL (data honesty + palette budget) - it is a key light, not a
    wall of flame. (d) plate must sit clear of the smoke column. (e) attribution
    MUST say "Dryad says" and carry the self-report caveat (c12/c13 guardrail).
14. Acceptance checklist:
    - [ ] snapshot .ok true (or the AK3D fallback rendered, noted); canvas not dead/uniform.
    - [ ] horizon sits ~22% from bottom (monumental); machine silhouette upper-third, tack-sharp.
    - [ ] the machine reads as a clean silhouette with ONE cyan LED, no lumpy detail.
    - [ ] headline contrast >=4.5:1 over its sky patch (scrim if needed).
    - [ ] attribution reads "Dryad says ..." + the NOT-VERIFIED caveat is visible.
    - [ ] fire is a small saturated key light, not a large flame fill.
    - [ ] ring mark shows douse arc lighting (nearly closed).

---

## SLIDE 07 - THE PURSE (keepable data)

**A. NARRATIVE**
1. Beat: the stakes in dollars - a keepable reference. Plant: when do we know?
2. Copy, final:
   - kicker: "THE PURSE".
   - headline (Archivo SemiBold, 62px): "Eleven million dollars, on the line." (36 chars).
   - bars/tiles: "$11M total competition purse" [c1]; "$3.5M to each track winner" [c6]; "$1M Lockheed Martin bonus for best detection" [c7]; "$750K semifinal, split among the five finalists" [c8].
   - body (Archivo Regular 32px, ~20 words): "The money is real and already moving. The proof that a machine can do it, out here, is not settled yet." [editorial]
   - counter "07 / 09".
3. Reader takeaway: an $11M contest, $3.5M to win, decided partly on Alaska ground.

**B. COMPOSITION**
4. Layout map: a clean honest bar/tile stack. A dominant $11M tile top (cols 1-8
   row 1-2 headline; the $11M numeral cols 8-12 rows 2-3), then three sub-bars in
   cabinet-oblique or flat parallel (rows 4-6): $3.5M, $1M, $750K, each labeled and
   scaled linearly. Body row 7. Focal: the $11M figure. Quiet zone: lower-right.
5. Depth plan: DATA honesty - parallel projection ONLY if any 3D (cabinet oblique
   #32/#39, walls 2 shades darker, h = k*value linear), grid/labels flat. No 3D
   pie. One focal plane. bg spruce-night; cool palette resumes (post-fire cooling).
6. Continuity state: ring NEARLY closed (douse arc mostly lit, tiny gap). Ember
   cooling (less saturated). Palette cools back toward blue.

**C. ART DIRECTION**
7. Technique stack: #29 Big-Number Tile ($11M hero figure) + #30 Annotated bars
   for the three sub-amounts, or #32 cabinet-oblique bars (parallel projection),
   linear height = value, direct end-labels (kill legends). Grain tile. No aberration.
8. Data-in-art mapping: bar heights linear to dollars [c1 $11M, c6 $3.5M, c7 $1M,
   c8 $750K]; the $11M is the whole, the others are parts (show $3.5M as the
   winner's slice honestly, not summing to $11M - label "of the $11M").
9. Palette: bg spruce-night; bars ice #5AC8F0 desaturated, the winner bar mint
   #3CE6B4; numerals snow tabular; gold #FFC72C on ONE accent - the $3.5M "winner"
   marker (small) + Polaris + ring seal. Contrast: numerals ~12:1.
10. Type spec: $11M numeral Archivo 800 wdth 88, 150px tabular; sub-amounts Archivo
    700, 44px tabular; labels Archivo Regular 28px; body 32px; all mono where telemetry.
11. Anchor spec: the bar set is the anchor; furniture = hairline baseline, direct
    end-labels, a bracket tying the parts to the $11M whole.

**D. VERIFICATION**
12. Reference intent: "a Datawrapper bar chart with a spine."
13. Risk flags: (a) do NOT sum the parts to imply they equal $11M (they are
    overlapping prize lines) - label each relative to the whole. (b) parallel
    projection only, no perspective on quantities (data honesty). (c) tabular nums.
14. Acceptance checklist:
    - [ ] four dollar figures correct: $11M, $3.5M, $1M, $750K with c-ids.
    - [ ] bars linear-scaled, parallel projection, no 3D pie.
    - [ ] gold appears only on the single winner marker + Polaris/ring.
    - [ ] no implied false sum of the prize lines.
    - [ ] ring nearly closed (one hair gap).

---

## SLIDE 08 - THE VERDICT (synthesis, the position)

**A. NARRATIVE**
1. Beat: synthesis and the Alaska.Ai position. The ring closes on a date, not a
   proof. Plant the close loop: what should an Alaskan watch for?
2. Copy, final:
   - kicker: "THE VERDICT".
   - headline (Archivo Expanded Black, 76px): "The winner lands in September. The proof is still out." (52 chars, 2 lines) [c9 for September].
   - body (Archivo Regular 33px, ~40 words): "A winner is expected in September 2026. But a contest result is not the same as a fire crew you can count on. Until a machine does this over a real Alaska summer, the smartest move is to watch, not to believe." [c9; position]
   - stakes line (Archivo Medium 30px): "The prize is minutes: the villages and Interior towns a crew cannot reach in time." [editorial position, no fake number]
   - counter "08 / 09".
3. Reader takeaway: the machines are promising but unproven; September gives a winner, not certainty.

**B. COMPOSITION**
4. Layout map: the Autonomy Ring, now CLOSED, centered-right (cols 6-11 rows 2-6)
   with a gold Polaris sealing the former gap; headline left (cols 1-7 rows 1-3);
   body left (cols 1-6 rows 4-6); stakes line full-width row 7. Focal: the gold
   seal on the closed ring. Quiet zone: upper-right.
5. Depth plan: cool resolution palette (fire out). bg spruce-night lifting toward
   ice pre-dawn low. The closed ring glows cool cyan with one warm gold seal. One
   focal plane. Depth cues: glow/bloom on the ring, occlusion of the seal, a low
   ice-dawn atmospheric lift.
6. Continuity state: ring CLOSED + gold Polaris seal (motif resolves). Ember COLD
   (a faint grey mark at center). Palette fully cool. This is the payoff of the
   closing-ring device.

**C. ART DIRECTION**
7. Technique stack: the Autonomy Ring rendered closed (#47 neon cool layers) with a
   #44-style small gold seal glint at the joint; a low #4 Conic Horizon in ice
   #CFE4F0 (pre-dawn). The "September 2026" set as a small gold marker on the ring.
   Grain tile.
8. Data-in-art mapping: the CLOSED ring = the loop as a settled question of DATE,
   not of proof; the gold seal at the top gap = September 2026 [c9]; the ember gone
   cold = the fire the machines aim to beat, unresolved in reality.
9. Palette: bg spruce-night -> ice pre-dawn low; ring cyan #5AC8F0/#3CE6B4; the seal
   + "September 2026" marker gold #FFC72C (the deck's gold peak, still small);
   headline snow; body ice-snow. Contrast: headline snow on spruce ~14:1.
10. Type spec: headline Archivo 800 wdth 106, 76px, 2 lines; body Archivo Regular
    33px leading 1.34 max-width 540px; stakes line Archivo Medium 500, 30px;
    "September 2026" JetBrains Mono 500 24px in gold near the seal.
11. Anchor spec: the closed ring + gold seal is the anchor; furniture = the seal
    glint, the date marker, a hairline underlining the stakes line.

**D. VERIFICATION**
12. Reference intent: "the closing shot - the machine's loop drawn shut on a
    calendar, the fire it chases still uncaught."
13. Risk flags: (a) the position must READ as analysis, not doom - it takes a
    stance (watch, do not believe yet) without fabricating a number. (b) gold peaks
    here but must stay small (seal + date only). (c) "September 2026" carries c9's
    "expected" framing - use "expected"/"lands" not "will".
14. Acceptance checklist:
    - [ ] the ring is visibly CLOSED with a single gold seal at the old gap.
    - [ ] "September 2026" present, framed as expected, gold, near the seal [c9].
    - [ ] the position (watch, not believe) is stated without any invented stat.
    - [ ] palette fully cool; ember cold grey; fire gone.
    - [ ] gold budget respected (seal + date + Polaris only).

---

## SLIDE 09 - CLOSE (single ask + fixtures)

**A. NARRATIVE**
1. Beat: the close. One ask. Brand fixtures. Resolve the deck.
2. Copy, final:
   - the ask (Archivo SemiBold, 66px): "Save this for September." (24 chars) [single ask].
   - sub (Archivo Regular 30px): "When the winner lands, you will know what was really proven here." (63 chars).
   - source note (mono 22px): "sources in comments".
   - brand: "ALASKA.AI" wordmark (Archivo Black) + Polaris star; site "alaskaaihq.com" (JetBrains Mono 22px) small beneath the wordmark.
   - coords footer (mono, data-decorative): "64 50 N  147 43 W".
   - counter "09 / 09".
3. Reader takeaway: save it; check back in September.

**B. COMPOSITION**
4. Layout map: centered-lower ask (this is a permitted centered title-card moment);
   the closed quiet ring mark small top-center as the resolved motif; wordmark +
   site + Polaris lower-center; source note bottom. Quiet zone: upper field. Eye
   path: ask -> sub -> wordmark/site.
5. Depth plan: quietest slide. bg spruce-night with a faint pre-dawn ice lift; the
   ring a small closed cool mark; minimal depth (glow only). One focal plane on the ask.
6. Continuity state: ring closed quiet mark; ember gone; pre-dawn cool. Motif at rest.

**C. ART DIRECTION**
7. Technique stack: #50 title-card restraint; #47 subtle neon on the small ring;
   #4 low conic ice horizon; grain tile. No aberration.
8. Data-in-art mapping: none (close). The resolved ring = the story, settled to a date.
9. Palette: bg spruce-night -> ice low; ask snow; ring cyan; gold #FFC72C on the
   Polaris star beside the wordmark ONLY. Contrast: ask snow on spruce ~14:1.
10. Type spec: ask Archivo 640 wdth 100, 66px; sub Archivo Regular 30px; wordmark
    Archivo 800 wdth 100, 40px, letterspaced; site JetBrains Mono 500 22px; source
    note + coords mono 20-22px.
11. Anchor spec: wordmark + Polaris + site fixture (constellation system); the ask
    is the single focal line.

**D. VERIFICATION**
12. Reference intent: "a magazine back-cover colophon - calm, branded, one ask."
13. Risk flags: (a) ONE ask only - no stacked follow/like/share. (b) alaskaaihq.com
    MUST appear small in the mono face near the mark (fixture, not the ask). (c)
    "sources in comments" present.
14. Acceptance checklist:
    - [ ] exactly one ask ("Save this for September.").
    - [ ] alaskaaihq.com present, small, JetBrains Mono, near the wordmark.
    - [ ] Polaris gold star present; gold nowhere else on this slide.
    - [ ] "sources in comments" present.
    - [ ] the ring is a small closed resolved mark (motif at rest).

---

## STORYBOARD GATE (self-review) - PASS
- 9 slides (inside 8-10). Cover <= 12 words (headline 5 + short dek). Slide 2 pays
  the cover loop immediately (names the arena). Breather exists (S6 rendered). Two
  keepable data slides (S4 finalists, S7 purse; S3 stats also keepable). Single-ask
  close (S9) with "sources in comments" + alaskaaihq.com fixture in mono near mark.
  >= 2 continuity devices (closing-ring motif + palette-arc). Every on-slide number
  carries a claim-id (see per-slide copy). Variety divergence stated in the header.
  Dryad self-reports (c12/c13/c14) appear only with "Dryad says" + a caveat (S6/S5).
  c16/c17 labeled BACKGROUND (S3). No em/en dashes; straight quotes; ranges as "X to Y".
  Rendered ladder: akthree hero at S6 with a designed AK3D fallback; akpost grade on
  all art canvases. Camera math computed for S6 (horizonY ~1050).
- A stranger could sketch each slide from its dossier. Proceed to Phase 6 (copy).
