# STORYBOARD — Carousel No. 9 — "No Road Out. Quinhagak Flies Its Own Eyes."

## DECK HEADER

**Thesis.** In a roadless Yup'ik delta where search-and-rescue calls come
weekly and outside operators cannot read the airspace, a village corporation
trains its own pilots and runs its own neural network, so the community owns not
just the drone but the machine that watches its land, waters, and people.

**Document title (PDF, 42 chars):** No Road Out. Quinhagak Flies Its Own Eyes

**Arc (emotional temperature climbs cold to warm):**
1. HOOK (cold night, agency) -> 2. STAKES pays (weekly SAR) -> 3. PLACE (roadless, why local) -> 4. PEOPLE (the trainees) -> 5. BREATHER/ORIGIN (Nunalleq, warm dusk) -> 6. HERO/DATA (the machine they own, white-hot) -> 7. HONESTY (what is AI, what is not) -> 8. SYNTHESIS (own the whole stack, warm dawn) -> 9. CLOSE (single debate ask).

**Slide count rationale:** 9 slides = 1 cover + 7 content + 1 close, the save-optimal 8 to 10 band; every slide plants or pays a loop.

**Continuity system (3 devices):**
- MOTIF EVOLUTION + PROGRESS: the SEARCH GRID, a faint drone's-eye ground grid living in the lower field of every slide, changing STATE with the narrative. Doubles as the deck's progress read.
- PALETTE ARC: temperature climbs from cold navy isolation (S1) to white-hot at the rescue (S6) to held warm dawn (S8), tracking emotional stakes.
- EDGE-TEASE: the Kanektok River (a warm thread) bleeds off the right edge of each slide and resumes on the next.

**MOTIF STATE TABLE (search grid):**
| Slide | Grid state | Shape change |
|---|---|---|
| S1 | idle scan, one faint cell blinking | sparse grid, low glow |
| S2 | sweeping, a warm human dot found | scan line crossing, 1 lit cell |
| S3 | grid thins to river+air corridors | grid warps to follow the delta |
| S4 | counting bodies: 12 warm dots | 12 discrete lit cells |
| S5 | wide + soft, dissolving to dusk | grid recedes to horizon |
| S6 | ONE cell white-hot, LOCKED (boat) | bounding box snaps, cell peaks |
| S7 | grid forks: lit branch vs gray branch | split into 2 labeled columns |
| S8 | grid resolves to warm dawn field | cells settle, one gold node seals |
| S9 | single sealed node + Polaris | grid gone to one point |

**Variety ledger check (REQUIRED divergence, from ledger/artwork.json last 4):**
- Last 4 heroes: autonomy-ring (07-12), FIRM/SOFT type-weight ledger (07-13), fixed-y waterline cross-section (07-14), uncomputed-relief survey-plate (07-15). THIS hero = a thermal drone's-eye SEARCH-GRID over AK3D delta terrain with a CNN-locked cell. New shape; none of the four, and not a camera-map, glyph-ledger, trace panel, or cutaway panorama.
- Last 3 atmospheres: cool drafting-blueprint, sonar-dark navy, graphite-bone survey. THIS = THERMAL warm-amber-on-cold-tundra. New family.
- Last 2 continuity: fixed-y waterline+sonar rings; camera-over-relief+confidence-meter. THIS = evolving search-grid + palette-arc + river edge-tease. New.
- Last 3 hooks: big-number monument, place-paradox two-sentence, withheld-fact gap. THIS = scene/stakes-declarative ("No road out. So Quinhagak learned to fly its own drones."). New.
- Last 3 palettes: drafting-blue+copper, abyssal-navy+sonar-cyan, graphite+phantom-blue+gold. THIS = thermal ember/amber/white-hot on cold navy tundra + gold. New.
- Last 2 type pairings: Fraunces+Space Grotesk+JBMono; Archivo+Manrope+JBMono. THIS = Instrument Serif + Space Grotesk + JetBrains Mono. New pairing (serif display is new lead).

**Variance dials:** design_variance 4, visual_density 3, type_temperature 4 (warm/humanist). Justified: 8 straight cold-infrastructure/instrument decks; a warm human register is itself the strongest divergence and the story (people, place, sovereignty) demands it.

**PALETTE (roles + hex):**
- Cold base (tundra night): deep_night #02060F, flag_blue_horizon #081426, panel_navy #0E2138.
- Thermal ramp (heat signatures, the story's material world): tundra rust #B4552A, ember #E8892B, hot amber #F6B23C, white-hot #FFE9C2.
- Brand gold #FFC72C (+ halo #FFDA6E): Polaris, the found-boat cell, the ownership seal, wordmark. Budgeted per slide below.
- Cool 10% accent (legibility only): river/coast hairline forget-me-not #6EA5FF; snow text #F4F8FF.
- Gradients in OKLCH; grain tile every slide (AK.grainTile).

**TYPE SYSTEM (2 families + mono instrument):**
- DISPLAY (the warm human voice): Instrument Serif, upright, opsz high. Hook 120-150px, headlines 60-96px. NOTE: include an offscreen upright-400 loader span (FIELD_NOTES 07-13) so render.py's font probe never false-FAILs; prefer upright, italic only with the loader present.
- BODY/LABELS: Space Grotesk, wght 400-600, 32-40px body, tracking 0.
- INSTRUMENT: JetBrains Mono, 500, tracked +8-12%, small-caps feel, for kicker, counter, coordinates, readouts.
- Two families + mono = doctrine-legal. Serif+sans+mono, no two-similar-sans.

**Grid:** 12 col x 8 row, 80px margins, 24px gutters, 8px base. Asymmetric mass; text lives in the upper cold field (y <= ~640), art/grid in the lower thermal field.

**Constellation fixtures (every slide):** ALASKA.AI wordmark (Instrument Serif) on cover + close; gold Polaris 4-point star >=1 per slide; JetBrains Mono progress counter "NN / 09" fixed top-right; coordinates footer (data-decorative); gold #FFC72C deliberate on every slide; dark-arctic base. Close carries alaskaaihq.com small mono near the mark.

**Seed:** base AK.reseed(20260717); per-slide seed = 20260717 + slideNumber.

**Claims index:**
- c1 KYUK date/reporter -> S1
- c2 June 9 session/hand-launch -> S1, S4
- c3 a dozen trainees, across rural AK -> S4 (12 dots)
- c5 Nalaquq = Native-owned subsidiary of Qanirtuuq -> S6, S8
- c6 14-week Part 107 course -> S4
- c7 4-community November cohort (Quinhagak/Eek/Goodnews/Platinum) -> S4
- c8 Alaska DOT grant (no dollar figure) -> S4
- c9 applications: thermal reindeer, salmon Kanektok, SAR -> S2, S3, S7
- c10 Byron Petluska weekly/daily SAR -> S2
- c11 Sean Gleason local pilots read airspace -> S3, S8
- c12 Angelina Olrun 19, Mekoryuk, herding interest -> S4
- c13 Nunalleq origin -> S5, S7
- c14 SAR boat-detection CNN (JCMC, prior work) -> S6, S7
- c15 polarized-lens salmon counting (JCMC) -> S6, S7
- c16 Nalaquq 2D/3D remote sensing/mapping -> S6, S8
- c17 Nalaquq lists Automated Salmon Counts / archaeology (titles) -> S6, S7

**HONESTY FIREWALL (binding, on every relevant slide):** training = human-piloted + Part 107, never autonomous AI; real ML = only the SAR CNN (c14) + salmon counting (c15/c17), cited as Nalaquq prior published work; reindeer thermal (c9/c12) and archaeology (c13/c17) are human-read, NOT AI; no DOT dollar figure; June dozen (c3) != November 4-community cohort (c7). A standing "PILOT / HUMAN" mono tag rides the hero and honesty slides.

---

## SLIDE 01 — COVER

**A. NARRATIVE**
1. Beat: HOOK. Stop the scroll with a vivid roadless-place fact and a surprising act of agency. Plants the loop "learned to fly, for what?"
2. Copy, final:
   - Kicker (mono, top): "ALASKA.AI   No. 09" (18) and counter "01 / 09" top-right.
   - Peg (mono, under kicker): "QUINHAGAK   KYUK, JULY 14 2026" (30) [c1]
   - Hook (Instrument Serif display, 3 lines by sense):
     line1 "No road out." (12)
     line2 "So Quinhagak learned" (20)
     line3 "to fly its own drones." (22)
     [c2] (total 10 words)
   - Footer coords (mono, data-decorative): "59 45 N   161 55 W" (Quinhagak)
3. Reader takeaway: a roadless Yup'ik village taught itself to fly drones.

**B. COMPOSITION**
4. Layout map: hook mass left-aligned, occupying cols 1 to 8, rows 3 to 6 (optical-left). Focal point rule-of-thirds at (0.33, 0.62) where a pair of warm hands releases a small drone silhouette. Quiet zone upper-right around the counter. Eye path: hook (1) -> hands/drone (2) -> drone's faint search grid igniting bottom-right (3). One grid violation: the drone silhouette nudges into the right margin as the edge-tease.
5. Depth plan (z-stack): bg tundra-night gradient (OKLCH, deep_night to horizon) -> atmosphere (low aurora-veil hint, green-first, very faint, #3CE6B4 at 0.05) -> mid: cold tundra ridge silhouette (occlusion) -> foreground: warm-lit hands + drone (sharp focal plane, DOF blur on far ridge) -> search grid faint on the ground plane (lower field) -> type -> grain. Depth cues: occlusion (ridge over sky), atmospheric fade, DOF (far ridge blur), one warm key light on hands (4:1) with cool tundra shadow. Focal plane = hands/drone.
6. Continuity state: search grid IDLE (one faint cell blinking ember, bottom-right). Kanektok thread enters from behind the ridge and exits right edge. Palette-arc START = coldest.

**C. ART DIRECTION**
7. Technique stack: #4 Conic Horizon (OKLCH tundra-night wash, light implied low-right) + #1 Aurora Veil (single faint green layer, seed 20260718, feTurbulence 0.005x0.04 oct2, displacement 140, blur 20, screen, alpha 0.05) + hands/drone as a Profile-Heaviest (#58) filled SVG silhouette (hero-weight outer, fine seams), warm rim light from lower-right + #43 Gradient Solids for the drone body + #57 Frozen Dash Motion faint grid + #2 Grain tile (AK.grainTile(280,52,20260717), overlay 0.08). Search grid: canvas perspective grid, 12 cols converging to a vanishing point at (540, 470), cell rows fading up; one cell filled ember #E8892B at 0.5.
8. Data-in-art mapping: the single blinking cell = the one call about to come (seeds S2). Grid faintness = program at rest before the story. Drone count = 1 (the one being launched, c2).
9. Palette assignment: bg #02060F->#081426; ridge #0E2138; hands warm ramp #B4552A->#F6B23C rim; drone body #0E2138 with #6EA5FF edge; hook text #F4F8FF; "drones" word tinted hot amber #F6B23C for one-word emphasis; gold #FFC72C on the Polaris star only (upper-right, near counter) + the blinking cell gets a gold pinpoint. Worst-case contrast: snow #F4F8FF on deep_night = ~18:1; amber word on deep_night ~7:1. OK.
10. Type spec: hook Instrument Serif ~132px/0.98/-1% upright, snow, left, max-width 820px, fit strategy AK.fitText(min 96, max 140, maxLines 3). Kicker/peg JBMono 22px/500 tracked +10%, #6EA5FF at 0.8. Counter JBMono 24px snow. Footer JBMono 18px data-decorative #6EA5FF 0.5.
11. Anchor spec: the hands+drone SVG silhouette is the literal anchor (built like #49b SpawningSockeye method: one confident filled path, profile-heaviest, one gradient, one accent). Annotation furniture: a fine leader from the drone to a mono tag "HAND-LAUNCHED" (#72), 1.25px.

**D. VERIFICATION**
12. Reference intent: a National Geographic field-dispatch cover meets an arctic mission poster; warm human hands against cold enormity.
13. Risk flags: (a) Instrument Serif upright font probe false-FAIL -> mitigation: offscreen upright-400 loader span. (b) hands silhouette reading as a blob -> profile-heaviest outer weight + warm rim + a clear drone shape. (c) grid overprinting hook -> grid confined to lower field (y > 760), hook at rows 3 to 6.
14. Acceptance checklist:
- [ ] hook reads in exactly 3 lines, no 4th line wrap into footer
- [ ] "No road out." is unmistakable at 432px thumb
- [ ] warm hands + a recognizable small drone read as a hand-launch, not a blob
- [ ] exactly one gold Polaris + one gold cell pinpoint (gold budget)
- [ ] Kanektok thread exits the right edge (edge-tease live)
- [ ] search grid faint, entirely below the type, one ember cell
- [ ] counter "01 / 09" top-right in mono

---

## SLIDE 02 — THE CALLS (payoff)

**A. NARRATIVE**
1. Beat: STAKES, pays slide 1 instantly. Inherits "learned to fly, for what?"; plants "who can answer, out here?"
2. Copy, final:
   - Kicker (mono): "THE STAKES   02 / 09"
   - Pull-quote (Instrument Serif display): "We get weekly calls for search and rescue. Sometimes daily." (60) [c10]
   - Attribution (mono): "BYRON PETLUSKA, QUINHAGAK" (25) [c10]
   - Body (Space Grotesk): "In a roadless stretch of the Yukon-Kuskokwim Delta, a lost boat or an overdue traveler is a life-and-death search. Quinhagak's drone team answers those calls from the air, week after week." (185 chars, ~31 words) [c10, c9]
3. Reader takeaway: out here search-and-rescue is constant, and the drones answer it.

**B. COMPOSITION**
4. Layout: pull-quote cols 1 to 9 rows 2 to 4 (optical-left, big). Attribution directly under. Body cols 1 to 7 row 6. Focal (0.3,0.32) on the quote's first line. Quiet zone right of the quote. Eye path quote -> attribution -> body -> the swept grid below.
5. Depth plan: bg tundra night -> search grid sweeping the lower field (a scan line crossing) -> one warm human dot found in a lit cell -> type over the cold upper sky (quiet) -> grain. Cues: occlusion (dot in cell over grid), atmospheric fade up, a single warm key on the found dot, cool everywhere else. Focal plane = the lit cell.
6. Continuity: grid SWEEPING. A bright scan line moves left-to-right; exactly one cell lit ember with a warm dot (a person found). Kanektok exits right. Palette warming slightly.

**C. ART DIRECTION**
7. Technique stack: canvas perspective search grid (same vanishing point 540,470 as S1), a #57 Frozen Dash scan line at x=0.62, #13 Interference Rings from the found dot (2 rings, faint), the dot a #43 gradient solid warm; #2 grain. Seed 20260719.
8. Data-in-art mapping: scan-line rhythm and the 7-faint-plus-1-bright cadence encode "weekly, sometimes daily" (c10): 7 faint pulse marks along the grid horizon plus one bright daily flare. No invented total.
9. Palette: bg #02060F->#0E2138; grid lines #6EA5FF at 0.12 (grid opacity tier); scan line #F6B23C 0.5; found dot white-hot #FFE9C2 core + ember halo; quote text #F4F8FF, the word "daily" tinted amber; gold Polaris top-right; gold pinpoint on the found dot center. Contrast: snow on navy ~15:1; body Space Grotesk 34px snow ~14:1.
10. Type spec: pull-quote Instrument Serif 84px/1.0/-1% upright snow, max-width 900, fit maxLines 3. Attribution JBMono 22px tracked+10% #F6B23C. Body Space Grotesk 34px/1.4/400 snow max-width 760px. Kicker/counter JBMono 22/24.
11. Anchor spec: the single found dot in its lit cell (literal anchor = "one person found"). Furniture: a #72 leader from the dot to a mono tag "SEARCH GRID" 1.25px; 7+1 horizon pulse ticks.

**D. VERIFICATION**
12. Reference intent: an FT big-quote spread, arctic night edition; the data is the emotional temperature.
13. Risk flags: canvas scan line/dot overprinting body -> body confined to row 6 left, grid+dot in lower-right field; verify no line box intersect. Curly-quote false positive -> straight quotes only, verify at source.
14. Acceptance checklist:
- [ ] the quote reads and lands the gut-punch at 432px
- [ ] exactly one found dot, one lit cell, one scan line
- [ ] 7 faint + 1 bright cadence marks present (c10 mapping), no invented number
- [ ] body 25 to 50 words, no dash, straight quotes
- [ ] grid + dot never touch the quote or body line boxes
- [ ] gold budget = Polaris + found-dot pinpoint only

---

## SLIDE 03 — THE SKY IS THE ROAD (why local)

**A. NARRATIVE**
1. Beat: PLACE. Inherits "who can answer out here?"; plants "so who is learning to fly?" Establishes the roadless geography as the proof of why local pilots matter.
2. Copy, final:
   - Kicker (mono): "WHY LOCAL   03 / 09"
   - Headline (Instrument Serif): "The sky is the only road." (25)
   - Body (Space Grotesk): "No roads reach Quinhagak or its neighbors on the Kuskokwim coast. Rivers and airspace are the only ways through. A local pilot, instructor Sean Gleason says, knows the traffic patterns better than anyone from outside." (208 chars, ~35 words) [c11, c9]
3. Reader takeaway: in a roadless delta, local knowledge of the airspace is the edge.

**B. COMPOSITION**
4. Layout: headline cols 1 to 8 rows 2 to 3. Body cols 1 to 6 rows 4 to 5. The delta map fills the lower-right and bleeds under the text at low contrast. Focal (0.62, 0.6) on the Quinhagak node. Quiet zone upper-left. Eye path headline -> body -> Quinhagak node -> Kanektok exiting right.
5. Depth plan: bg night -> delta map (coastline stroke-only, warm tundra fill very low) -> river threads (warm) -> village nodes (gradient solids) over the map (occlusion) -> type in the cold upper-left sky -> grain. Cues: occlusion (nodes over map), atmospheric fade to Bering haze at the coast, DOF soft interior, one warm key. Flat map is honest (equal-area projection); depth via layering + haze, NOT a camera-over-relief move (that was 07-15).
6. Continuity: grid morphs to FOLLOW the delta (grid lines bend into river/air corridors). Kanektok is the through-line, exits right toward S4. Palette: cold with warm river.

**C. ART DIRECTION**
7. Technique stack: #24 Alaska Hero Map, canonical projection d3.geoConicEqualArea parallels[55,65] rotate[154,0], fitExtent to full state at a baseline then AKGeo.zoomTo the Y-K Delta center (-162.5, 61.0) at zoom ~3.2, coastline STROKE-ONLY (#79 cased line for legibility). Villages hardcoded lon/lat: Quinhagak(-161.9156,59.7517), Eek(-162.0244,60.2178), Goodnews Bay(-161.5772,59.1189), Platinum(-161.82,59.0111), Bethel(-161.7558,60.7922), Mekoryuk(-166.2708,60.3906). Kanektok River as a hand-placed warm polyline from ~(-160.3,59.7) headwaters to the Quinhagak mouth (#59 tapered ribbon, warm). NO roads drawn (the point). Nodes: #43 gradient discs, Quinhagak largest + gold ring. Grain. Seed 20260720.
8. Data-in-art mapping: absence of any road line = the thesis (roadless). River = the only-road. Node sizes uniform except Quinhagak (the subject).
9. Palette: sea/bg #02060F; land fill #0E2138 at 0.5 with faint #B4552A tundra warmth; coastline #6EA5FF 0.7 cased; rivers ember #E8892B; nodes snow with Quinhagak gold #FFC72C ring; headline snow, "only road" tinted amber; gold Polaris. Contrast: headline snow on night ~16:1; body on the low-fill map region kept in the upper-left sky (no map behind body) -> ~14:1.
10. Type spec: headline Instrument Serif 88px/1.0 upright snow max-width 820 fit maxLines 2. Body Space Grotesk 34px/1.42 snow max-width 660 (ends in sky, not on map). Node labels JBMono 18px tracked+8% snow on #75 knockout windows. Kicker/counter mono.
11. Anchor spec: the roadless delta map is the literal anchor (brand geo signature). Furniture: a scale bar (#84), a tiny north glyph, node labels in knockout windows, a "NO ROADS" mono note with a #72 leader to empty tundra.

**D. VERIFICATION**
12. Reference intent: a Reuters locator map that argues by omission; the missing roads carry the point.
13. Risk flags: d3 zoom trap (fitExtent to small bbox = giant disc) -> use baseline full-state fit then zoomTo, stroke-only (logged instinct). Node labels overprinting coastline -> knockout windows, labels placed to sea side. Body over map -> body confined to sky zone.
14. Acceptance checklist:
- [ ] map reads as the Y-K Delta coast, Quinhagak clearly marked, at 432px
- [ ] ZERO road lines anywhere; a "NO ROADS" note present
- [ ] Kanektok River reads as a warm through-line, exits right edge
- [ ] all node labels legible on knockouts, none on the coastline stroke
- [ ] body copy ends in the sky zone, not over the map fill
- [ ] gold only on Quinhagak ring + Polaris

---

## SLIDE 04 — THE CLASS (the trainees)

**A. NARRATIVE**
1. Beat: PEOPLE. Inherits "who is learning?"; plants "what does the machine above them do?"
2. Copy, final:
   - Kicker (mono): "THE CLASS   04 / 09"
   - Headline (Instrument Serif): "They are training their own." (28)
   - Body (Space Grotesk): "On June 9, a dozen trainees from across rural Alaska came to Quinhagak to learn to fly. The local course runs 14 weeks toward an FAA Part 107 license on an Alaska DOT grant, one seat each for Quinhagak, Eek, Goodnews, and Platinum." (238 chars, ~44 words) [c2, c3, c6, c7, c8]
   - Annotation (mono, near one dot): "ANGELINA OLRUN, 19, MEKORYUK   WANTS TO COUNT REINDEER BY THERMAL DRONE" (2 lines) [c12, c9]
3. Reader takeaway: the village is training its own pilots, a named human class.

**B. COMPOSITION**
4. Layout: headline cols 1 to 8 row 2. Body cols 1 to 7 rows 3 to 4. A field of 12 warm human dots in the lower-right, one haloed (Angelina) with the annotation leader. A 14-tick timeline runs along row 6. Focal (0.66,0.58) on the haloed dot. Eye path headline -> body -> 12 dots -> haloed dot.
5. Depth plan: bg night -> search grid COUNTING (12 discrete lit cells, one per trainee) -> 12 warm dots (gradient solids) -> haloed dot brighter (occlusion + key) -> type upper-left -> grain. Cues: occlusion, scale (uniform dots = ISOTYPE honesty, never enlarged), one warm key, atmospheric fade. Focal = haloed dot.
6. Continuity: grid = 12 lit cells (bodies counted). Kanektok exits right. Palette warming.

**C. ART DIRECTION**
7. Technique stack: #28 ISOTYPE Rows (12 identical human pictograms, same size, one accent/haloed) placed on the grid cells; #74 Haloed Balloon marker on Angelina; the 14-tick timeline as an #77-adjacent even-spaced rule (14 ticks, one per week) with a Part 107 seal terminal; #43 gradient solids for dots; grain. Seed 20260721. Honesty: the 12 June dots and the 4 named cohort communities are visually separated (the 4 communities appear as 4 labels on a small inset "NOV COHORT", NOT among the 12 June dots).
8. Data-in-art mapping: exactly 12 dots = c3; 14 ticks = c6; 4 cohort labels = c7; one haloed dot = c12 (never the hook). Uniform dot size (ISOTYPE rule: quantity by count, not size).
9. Palette: bg night; grid cells ember 0.3; dots warm #F6B23C, haloed dot white-hot #FFE9C2 + gold ring; timeline #6EA5FF hairline with amber ticks; headline snow, "their own" amber; gold Polaris + Angelina ring. Contrast snow ~15:1.
10. Type spec: headline Instrument Serif 84px/1.0 upright snow maxLines 2 max-width 820. Body Space Grotesk 34px/1.42 max-width 720. Annotation JBMono 18px tracked+8% snow on knockout, 2 lines. Timeline labels JBMono 16px. Kicker/counter mono.
11. Anchor spec: the 12-dot ISOTYPE field + haloed Angelina dot (literal anchor = the class). Furniture: #72 leader to the annotation, 14-tick timeline, a small "NOV COHORT: 4 VILLAGES" inset with the 4 names.

**D. VERIFICATION**
12. Reference intent: a Bloomberg human-scale ISOTYPE explainer, warm arctic edition.
13. Risk flags: conflating June dozen with Nov cohort -> keep the 12 dots and the 4-village inset visually separate and labeled. Annotation overprint -> knockout window, leader clear of dots. 12 dots miscount -> assert exactly 12.
14. Acceptance checklist:
- [ ] exactly 12 human dots, uniform size, one haloed
- [ ] the 4-village Nov cohort is a SEPARATE labeled inset, not among the 12
- [ ] 14 timeline ticks, Part 107 seal terminal
- [ ] Angelina annotation reads, no reindeer-as-AI implication (says "thermal drone")
- [ ] body 25 to 50 words, no dashes, "one seat each" not "1 seat"
- [ ] gold budget = Polaris + Angelina ring only

---

## SLIDE 05 — IT BEGAN AT THE DIG (breather / origin)

**A. NARRATIVE**
1. Beat: BREATHER + ORIGIN. Low text, big atmosphere. Inherits "what does the machine do?"; plants "and now the machine sees what?"
2. Copy, final:
   - Kicker (mono): "HOW IT STARTED   05 / 09"
   - Headline (Instrument Serif, small): "It began at the dig." (20)
   - Body (Space Grotesk, short): "The drones first came to map Nunalleq, an ancestral Yup'ik village eroding into the Bering Sea. The pilots stayed, and turned the same eyes on the living delta." (162 chars, ~29 words) [c13]
3. Reader takeaway: the technology arrived for heritage and stayed for everything.

**B. COMPOSITION**
4. Layout: a wide atmospheric drone's-eye delta at dusk fills the frame. Headline lower-left cols 1 to 6 row 6, body row 7. Focal (0.4,0.4) on the eroding coast edge. Generous quiet sky. Eye path: the vast dusk field -> headline -> body.
5. Depth plan: MULTIPLANE PARALLAX (#42): 5 layers, scale 0.72^i, atmosphere lerp (i/n)^1.4 to a warm-dusk Bering haze, ONE sharp focal plane at the coast edge, blurred repoussoir foreground clod bleeding off bottom-left. Cues: all five (atmosphere, occlusion, scale, DOF, fog). This is the deck's big-visual breather.
6. Continuity: grid WIDE + SOFT, receding to the horizon (a whisper). Kanektok meets the sea and exits right. Palette warmest-so-far dusk (setup for the S6 white-hot peak).

**C. ART DIRECTION**
7. Technique stack: #42 Multiplane Parallax delta terrain (AK3D.heightfield low relief, warm dusk grade) + #11 Topo Contours faint on the near plane + a thin eroding-coast line (#17 Dither Decay at the water edge = erosion) + #46 faint volumetric dusk shaft + akpost warm grade + grain. Seed 20260722. renderReady gates the AK3D draw.
8. Data-in-art mapping: the dither-decay erosion at the coast = Nunalleq eroding (c13); the receding grid = the program's reach widening from one dig to the whole delta.
9. Palette: sky warm dusk #B4552A->#F6B23C->#02060F top; land shadowed navy with ember rim; coast edge white-hot dither; headline snow, body snow 0.9; gold Polaris small. Contrast: text lower-left over the darkest land zone, snow ~12:1 (verify; add a subtle Deep-Sea-Scrim #7 only if needed).
10. Type spec: headline Instrument Serif 60px/1.0 upright snow. Body Space Grotesk 32px/1.42 max-width 620 over the dark land zone. Kicker/counter mono. Low density (breather).
11. Anchor spec: the eroding Nunalleq coast edge (literal anchor). Furniture: one mono tag "NUNALLEQ" with a #72 leader to the coast; a small scale bar.

**D. VERIFICATION**
12. Reference intent: a cinematic aerial establishing shot, dusk; the quiet before the reveal.
13. Risk flags: AK3D terrain crammed low or dead -> compute horizonY = cy + tan(-pitch)*f, place coast at ~0.4; canvas health (near-uniform fail) -> ensure textured relief + grade. Text contrast over dusk -> keep text on the darkest land quadrant, scrim fallback.
14. Acceptance checklist:
- [ ] reads as a wide aerial delta at dusk at 432px, clearly a breather
- [ ] the eroding coast edge is visible (dither-decay), tagged NUNALLEQ
- [ ] AK3D relief is textured, not a dead flat canvas (qa canvas-health)
- [ ] text contrast >= 4.5:1 at worst point (scrim if needed)
- [ ] grid recedes softly; Kanektok exits right
- [ ] one gold Polaris only

---

## SLIDE 06 — THE MACHINE THEY OWN (HERO + keepable data)

**A. NARRATIVE**
1. Beat: HERO + KEEPABLE. The real ML, the depth peak. Inherits "the machine sees what?"; plants "so what here is NOT the machine?"
2. Copy, final:
   - Kicker (mono): "THE MACHINE THEY OWN   06 / 09"
   - Headline (Instrument Serif): "Nalaquq built its own eyes." (27)
   - Body (Space Grotesk): "Nalaquq, the village-owned company, wrote its own machine vision: a neural network that spots a small aluminum boat on a search grid, and a polarized-lens rig that counts salmon in the river. The name means it's been found." (223 chars, ~40 words) [c5, c14, c15, c16, c17]
   - Readouts (mono): "DETECTED  ALUMINUM HULL  /  ANALYSIS BACKEND" [c14]; "SALMON COUNT  POLARIZED LENS" [c15]; standing tag "PILOT / HUMAN" [firewall]
3. Reader takeaway: the community owns the actual AI, a boat-finding neural network.

**B. COMPOSITION**
4. Layout: hero art fills lower two-thirds. Headline cols 1 to 8 row 2, body cols 1 to 7 row 3 (in the cold upper sky). The white-hot locked boat cell at focal (0.62,0.66). A small salmon-tally panel lower-left. Eye path headline -> body -> white-hot boat cell -> readouts.
5. Depth plan: HERO rung = AK3D terrain river-valley (reliable, no GL) at LOW horizon (monumental), thermal-graded. Camera: pitch -18deg, fov 54, f from ak3d, cy=675; horizonY = cy + tan(18deg)*f -> place ridge/horizon at ~0.42 height; the search grid projected in perspective onto the valley floor; ONE cell white-hot around a small aluminum boat wearing a CNN bounding box. z-stack: sky -> graded terrain -> projected grid -> lit boat cell + bbox -> readouts on plates -> type in sky -> grain. Cues: all (atmosphere, occlusion, scale gradient of grid cells, DOF far valley, fog, one warm key). Focal = the boat cell.
6. Continuity: grid ONE CELL WHITE-HOT, LOCKED (the bounding box snaps, cell peaks) = the climax state. Kanektok is the very river holding the boat, exits right. Palette PEAK white-hot.

**C. ART DIRECTION**
7. Technique stack: #34 AK3D Terrain (heightfield seed 20260723, redistribution for a river valley, Lambert + warm ambient) + #89 akpost thermal grade (ember-to-white-hot ramp, bloom on the hot cell, IGN dither) + #90 akcolor OKLCH ramp (warm key/cool shadow) + the CNN bounding box drawn as #73 Dimension-call corner ticks + #84 instrument readouts on knockout plates + salmon tally as a tiny #29 big-number-adjacent panel (count from c15/c17, shown as "COUNTING" not a fabricated total) + grain. renderReady gates AK3D. Designed fallback: if AK3D fails, a 2D thermal gradient valley + grid (documented). Seed 20260723.
8. Data-in-art mapping: the bounding box = the CNN detection (c14), the ONE literal anchor; the white-hot cell = a real detection event; grid cell scale gradient = the search grid over distance; salmon panel = c15 (polarized-lens counting), labeled process not a made-up number. PILOT/HUMAN tag = firewall.
9. Palette: sky #02060F->#0E2138; terrain shadow navy with ember #E8892B slopes; the locked cell white-hot #FFE9C2 + gold #FFC72C bounding box; readout plates panel_navy with snow text; headline snow, "its own eyes" amber; gold budget = the bounding box + Polaris + one cell. Contrast: readouts on dark knockout plates >= 8:1; body in sky ~14:1.
10. Type spec: headline Instrument Serif 84px upright snow maxLines 2. Body Space Grotesk 34px/1.42 max-width 720 in sky. Readouts JBMono 17px tracked+10% snow on plates. "PILOT / HUMAN" JBMono 18px amber, fixed lower-right. Kicker/counter mono.
11. Anchor spec: the CNN-bounding-boxed aluminum boat in the white-hot cell (the hero anchor). Furniture: corner-tick bbox, #72 leaders to the two readouts, a scale bar on the valley, the salmon-tally micro-panel.

**D. VERIFICATION**
12. Reference intent: a NASA/defense sensor-fusion still meets a warm arctic river at dawn; the one hot detection carries the eye. THE RENDERED LADDER via AK3D terrain + akpost grade.
13. Risk flags: (a) AK3D dead/flat canvas -> qa canvas-health; ensure textured relief + grade, compute the camera math, verify horizon at ~0.42. (b) bounding box implying autonomous AI -> label "DETECTED / ANALYSIS BACKEND" + PILOT/HUMAN tag; the box is on analysis, not flight. (c) canvas readouts overprinting body -> body in sky, readouts on lower plates, verify no line-box intersect. (d) invented accuracy % -> NONE; say DETECTED / COUNTING only.
14. Acceptance checklist:
- [ ] the white-hot boat cell + gold bounding box is the clear focal point at 432px
- [ ] terrain is real textured relief, not a dead flat canvas (qa canvas-health, >=1.5x backing)
- [ ] horizon sits ~0.42 height (camera math honored)
- [ ] readouts say DETECTED / ANALYSIS BACKEND and COUNTING, NO percentage
- [ ] "PILOT / HUMAN" tag present (firewall)
- [ ] body attributes the ML to Nalaquq (c5/c14/c15), calls it machine vision, not autonomous
- [ ] gold budget = bounding box + one cell + Polaris only

---

## SLIDE 07 — WHAT IS AI, WHAT IS NOT (honesty)

**A. NARRATIVE**
1. Beat: HONESTY (the integrity spine). Inherits "what is NOT the machine?"; plants "so why does owning it matter?"
2. Copy, final:
   - Kicker (mono): "BE PRECISE   07 / 09"
   - Headline (Instrument Serif): "Most of the eyes are human." (28)
   - Body (Space Grotesk): "Be exact about the machine. A neural network finds boats. A lens rig counts salmon. But people fly every drone, and the thermal reindeer counts and the archaeology are human eyes reading pictures, not algorithms." (211 chars, ~35 words) [c9, c12, c13, c14, c15]
   - Column labels (mono): left "MACHINE  (AI)" over "FINDS BOATS  [c14]", "COUNTS SALMON  [c15]"; right "HUMAN EYES" over "FLIES THE DRONE", "COUNTS REINDEER (THERMAL)  [c9]", "READS THE DIG  [c13]"
3. Reader takeaway: the AI here is small and specific; the rest is people.

**B. COMPOSITION**
4. Layout: a two-column honest ledger, cols 1 to 6 (MACHINE) and cols 7 to 12 (HUMAN), headline spanning rows 2, body row 3, the two columns rows 4 to 7. Focal (0.5,0.5) on the dividing gutter. Equal visual weight both columns (honesty: neither favored). Eye path headline -> body -> left column -> right column.
5. Depth plan: mostly flat by DELIBERATE CHOICE (this is an argument slide, honesty needs clarity, not spectacle) with slight elevation (#45 layered shadow) on the two column plates; the search grid FORKS behind them (a lit branch under MACHINE, a gray branch under HUMAN). Cues: occlusion (plates over grid), one light, subtle shadow elevation. Flat argued in-dossier per doctrine.
6. Continuity: grid FORKS into two labeled branches (shape change). The two branches are equal width (honesty). Kanektok exits right under the human column.

**C. ART DIRECTION**
7. Technique stack: two equalized honesty panels (identical plate, min-height, header, per FIELD_NOTES equalize-honesty-panels instinct) + #65 cross-hatch material code (MACHINE branch = thermal-lit fill; HUMAN branch = neutral stipple) + #67 phantom/center dash gutter rule + #74 balloon item markers + grain. Seed 20260724. The MACHINE column glows faint ember; the HUMAN column is cool neutral, NOT diminished (equal size/contrast).
8. Data-in-art mapping: 2 items under MACHINE (c14 boats, c15 salmon), 3 under HUMAN (piloting, c9 reindeer, c13 archaeology) = the honest proportion "most of the eyes are human". The lit-vs-gray branch encodes AI vs human-read.
9. Palette: bg night; MACHINE plate panel_navy + ember edge #E8892B; HUMAN plate panel_navy + #6EA5FF edge (cool, equal); item text snow; headline snow, "human" amber; gold Polaris + one gold tick on the dividing rule. Contrast both columns snow ~13:1 (equal).
10. Type spec: headline Instrument Serif 84px upright snow maxLines 2. Body Space Grotesk 34px/1.42 max-width 900 (spans). Column headers JBMono 20px tracked+12%; items Space Grotesk 26px/1.35 with mono claim-tags. Counter mono.
11. Anchor spec: the two-column ledger is the anchor (the honest subtraction). Furniture: the center phantom-dash rule (#67), balloon markers, claim-id tags per item.

**D. VERIFICATION**
12. Reference intent: an editorial "what the data does and does not say" box; the honesty firewall as design (lineage: No.2 UNPROVEN cell, No.5 confidence meter).
13. Risk flags: the HUMAN column reading as lesser (visual favoritism inverting the point) -> identical plates, equal size/contrast, only the accent-edge hue differs. Overclaim creep -> every MACHINE item is c14/c15 only; reindeer/archaeology sit under HUMAN with tags.
14. Acceptance checklist:
- [ ] two columns are visually equal (same plate, min-height, header weight)
- [ ] MACHINE column contains ONLY boats (c14) and salmon (c15)
- [ ] HUMAN column contains piloting, reindeer thermal (c9), archaeology (c13)
- [ ] "not algorithms" is unambiguous; no autonomous-AI implication
- [ ] each factual item carries a claim-id tag
- [ ] gold budget = Polaris + one divider tick

---

## SLIDE 08 — OWN THE EYE (synthesis)

**A. NARRATIVE**
1. Beat: SYNTHESIS. Inherits "why does owning it matter?"; plants the closing question. The sovereignty point, warm.
2. Copy, final:
   - Kicker (mono): "THE POINT   08 / 09"
   - Headline (Instrument Serif): "Own the eye, don't rent it." (28)
   - Body (Space Grotesk): "Elsewhere the sensor, the model, and the data belong to outside companies. In Quinhagak the pilots, the drones, and the machine vision belong to the village that flies over its own land, water, and people." (206 chars, ~36 words) [c5, c11, c16]
3. Reader takeaway: sovereignty is owning the whole sensing stack, not renting it.

**B. COMPOSITION**
4. Layout: headline cols 1 to 8 rows 2 to 3, body cols 1 to 7 row 4. A warm dawn field fills the lower half; a compact ownership mark (three small linked tokens: pilot, drone, vision) sealing under one gold ring at focal (0.66,0.6). Eye path headline -> body -> the sealed gold ownership mark.
5. Depth plan: a warm dawn gradient (Conic Horizon #4) over the delta silhouette; the three ownership tokens as small gradient solids linked by a #79 cased line that seals into one gold ring (restrained, NOT a SaaS layer-cake). Cues: atmosphere (dawn), occlusion (tokens over silhouette), one warm key, soft shadow. Focal = the gold seal.
6. Continuity: grid RESOLVES to a warm dawn field, cells settling; one gold node seals (ownership). Kanektok exits right toward the close. Palette warm dawn (held).

**C. ART DIRECTION**
7. Technique stack: #4 Conic Horizon dawn wash (OKLCH) + delta ridge silhouette + three linked tokens (#43 gradient solids) + #79 cased connector sealing to a #55 motif-ticker gold ring + Polaris + grain. Seed 20260725. The "elsewhere vs here" contrast is a restrained two-state mark (left tokens splayed/cool with a small "RENTED" tag vs right tokens sealed/gold "OWNED"), not a full second stack.
8. Data-in-art mapping: three tokens = the three owned layers (pilots, drones, machine vision) per c5/c16; one gold ring = one owner (the village); the cool splayed set = outsiders elsewhere.
9. Palette: dawn sky #B4552A->#F6B23C->#FFE9C2 near horizon, cooling to #02060F top; ridge navy; owned tokens gold-ringed; rented tokens #5A6B7E cool; headline snow, "Own" amber; gold budget = the ownership seal + Polaris. Contrast headline snow on upper dark sky ~14:1; body over mid sky, verify (scrim if needed).
10. Type spec: headline Instrument Serif 88px upright snow maxLines 2. Body Space Grotesk 34px/1.42 max-width 720. Token labels JBMono 16px on knockouts. Kicker/counter mono.
11. Anchor spec: the sealed gold ownership mark (anchor). Furniture: RENTED/OWNED mono tags, #72 leaders, the three token labels (PILOTS, DRONES, MACHINE VISION).

**D. VERIFICATION**
12. Reference intent: a warm editorial close-of-argument; dawn as resolution; ownership as a small, earned gold seal.
13. Risk flags: SaaS layer-cake slop -> keep it a restrained 3-token seal, not stacked cards; two-state mark must read at thumb. Body contrast over dawn -> keep body over the darker upper-mid, scrim fallback.
14. Acceptance checklist:
- [ ] the gold ownership seal reads as ONE owner at 432px
- [ ] the RENTED (cool, splayed) vs OWNED (gold, sealed) contrast is legible
- [ ] three tokens labeled PILOTS / DRONES / MACHINE VISION (c5/c16)
- [ ] no SaaS glass-card stack; warm dawn register held
- [ ] body >= 4.5:1 contrast at worst point
- [ ] gold budget = ownership seal + Polaris

---

## SLIDE 09 — CLOSE (single ask)

**A. NARRATIVE**
1. Beat: CLOSE. Inherits the synthesis; resolves to ONE debate ask. No stacked asks.
2. Copy, final:
   - Wordmark (Instrument Serif): "ALASKA.AI"
   - Ask (Instrument Serif display): "Who should own the machine that watches your community?" (55)
   - Source note (mono): "SOURCES IN COMMENTS"
   - Site fixture (mono, small near mark): "alaskaaihq.com"
   - Counter "09 / 09"; coordinates footer data-decorative.
3. Reader takeaway: a genuine, debatable question the reader carries.

**B. COMPOSITION**
4. Layout: ask centered-left cols 1 to 9 rows 3 to 5 (a deliberate near-title-card). ALASKA.AI mark top-left, alaskaaihq.com small mono directly under it. "SOURCES IN COMMENTS" row 6. A single sealed search-grid node + gold Polaris at focal (0.72,0.4). Quiet, resolved. Eye path ask -> mark+site -> source note.
5. Depth plan: calm dark-arctic field, one warm sealed node with a soft glow, minimal depth (a close, not a spectacle); #45 subtle elevation on the node. One warm key. Grain.
6. Continuity: grid GONE to a SINGLE sealed node (the journey ends at one point). Kanektok terminates at the node. Palette settling cool-warm balance (a resolved calm).

**C. ART DIRECTION**
7. Technique stack: #4 Conic Horizon faint + the single sealed node (#43 gradient solid + #80 neon triple gold glow, ONE glowing element) + gold Polaris + #2 grain. Seed 20260726.
8. Data-in-art mapping: one node = the one village owning its one machine; the terminated river = the story's end.
9. Palette: bg deep_night->panel_navy; node white-hot core + gold #FFC72C ring + halo #FFDA6E; ask text snow, "own" amber; wordmark snow; site mono #6EA5FF. Contrast snow on night ~16:1.
10. Type spec: ask Instrument Serif 92px/1.02 upright snow maxLines 3 max-width 900 fit. Wordmark Instrument Serif 40px snow. Site JBMono 20px #6EA5FF near mark. Source note JBMono 20px tracked+10% snow. Counter/footer mono.
11. Anchor spec: the single sealed gold node (anchor + brand Polaris). Furniture: the site fixture near the mark, source note, counter.

**D. VERIFICATION**
12. Reference intent: a clean magazine back-cover; one question, one mark, one star.
13. Risk flags: stacked asks -> ONE question only; site is a fixture, not the ask. Ask wrapping -> fit maxLines 3.
14. Acceptance checklist:
- [ ] exactly ONE ask (the debate question), no follow/save stacked
- [ ] ALASKA.AI mark + alaskaaihq.com small mono near it, present
- [ ] "SOURCES IN COMMENTS" present
- [ ] one gold Polaris + one sealed node (gold budget)
- [ ] ask reads at 432px, no 4th-line wrap
- [ ] counter "09 / 09"

---

## STORYBOARD GATE (self-review, per Phase 5.4)
- 9 slides (6 to 12 band, 8 to 10 default): PASS.
- Cover <= 12 words: "No road out. So Quinhagak learned to fly its own drones." = 10: PASS.
- Slide 2 pays immediately (weekly SAR quote answers "for what?"): PASS.
- A breather exists (S5 Nunalleq dusk aerial): PASS.
- A keepable data slide exists (S6 the machine, S7 the honest ledger): PASS.
- Single-ask close with "sources in comments" + site fixture: PASS (S9).
- >= 2 continuity devices: 3 (search-grid motif, palette-arc, river edge-tease): PASS.
- Every number on every slide has a claim-id: mapped in claims index + per slide: PASS.
- Variety divergence stated: PASS (header).
- Honesty firewall on every relevant slide (S6/S7 tags, no % , human/AI split): PASS.
- A stranger could sketch each slide from its dossier: reviewed; PASS.
