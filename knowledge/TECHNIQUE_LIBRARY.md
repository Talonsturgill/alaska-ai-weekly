# TECHNIQUE LIBRARY — the variety engine's palette

Named, reusable visual techniques for bespoke slide code. Each entry: what /
how (key parameters) / when / difficulty D1-D5. All render reliably in
headless Chromium (Canvas 2D, SVG, CSS) unless flagged. Committed helpers:
`AK` (noise.js), `AK3D` (ak3d.js), Zdog, d3+topojson, GeoJSON in assets/geo.

**Selection rules (the variety engine):**
- Per deck pick: 1 ATMOSPHERE + 1-2 STRUCTURES + 1 DATA/CARTO form + TYPE
  mechanics as needed + at least one 3D/DEPTH technique. Never two loud
  structures on one slide.
- The artwork ledger logs each deck's stack; a new deck may not reuse the
  same hero structure as the last 4 decks, the same atmosphere as the last
  3, or the same continuity device as the last 2. Parameters must encode
  story numbers (DESIGN_DOCTRINE §6).
- Seed all noise from the run date. Grain pass + contrast check on every
  slide. Novel techniques beyond this catalog are ENCOURAGED — log them into
  this file with a dated note when they work (that is how the library grows).

## ATMOSPHERES (fields & washes)

1. **Aurora Veil** — layered light curtains over night base. SVG tall
   gradient rects → feTurbulence(0.004-0.006 x 0.03-0.05, oct 2, per-layer
   seeds) → feDisplacementMap(scale 120-200) → blur(15-25) → mix-blend
   screen; 2-3 layers, green-first hues. Sky stories, hero hooks. D2
2. **Grain Pass** — tileable noise tile as repeating background
   (`AK.grainTile(280, 45-60, seed)`), mix-blend overlay, opacity 0.05-0.12.
   EVERY slide, final layer. NEVER a full-frame feTurbulence rect (10-40MB
   in the PDF; the tile embeds once). D1
3. **Mesh Wash** — 4-7 stacked radial-gradients (OKLCH stops) at varied
   positions over a base, optionally blurred colored divs; + grain. Quiet
   body-slide backgrounds. D1
4. **Conic Horizon** — conic/radial sweep `in oklch` + mask fade; a light
   source implied off-canvas. Dawn/energy/optimism beats. D1
5. **Nebula Displacement** — fractalNoise 0.002-0.01 oct 4 displacing a
   multi-hue gradient, blurred, duotoned to brand inks. Moody dividers,
   uncertainty. D2
6. **Paper Tooth** — fractalNoise 0.04 oct 5 → feDiffuseLighting
   (surfaceScale 2, distant light az 45 el 60). Editorial/serif "print"
   slides. D2
7. **Deep-Sea Scrim** — linear gradient black 0.55→0 opacity under text
   zones; verify worst-case contrast. Legibility fallback over busy art. D1
8. **Frost Panel** — backdrop-filter blur(12-18px) saturate(1.4-1.7) +
   rgba(255,255,255,0.10-0.14) fill + 1px lighter top edge. Data plates
   floating over scenes. D1

## STRUCTURES (generative systems)

9. **Streamline Field** — Hobbs flow field: angle grid = fbm(x·0.0012-0.002)
   × 2-2.5π, grid extends 50% beyond canvas, long curves stepped 0.1-0.5%
   of width, collision-spaced via occupancy grid (cell ≈ 7px), tapered
   width (fat middle). Currents, wind, migration, forces. D3
10. **Fur Field** — same grid, thousands of 5-15 step ticks from
    Poisson-ish starts. Texture panels, terrain shading, crowds. D2
11. **Topo Contours** — simplex/elevation grid → d3.contours (marching
    squares) → stroked nested polygons, optional elevation labels. The
    signature Alaska texture; "mapping the landscape" beats. D2
12. **Ridgeline Pulse** — stacked horizon polylines, y-offset per row,
    amplitude from data or noise, each FILLED with bg color before stroking
    (fill = occlusion), stroke alpha fades with row. Unknown Pleasures
    energy; time-series-as-terrain. D1
13. **Interference Rings** — brightness = Σ sin(dist(p, sourceᵢ)·f + φᵢ)
    from 2-4 sources, thresholded into bands or contoured. Broadcast,
    sonar, policy ripple-effects. D2
14. **Particle Drift** — particles advected through a field with fading
    trails (translucent bg rect per step, final frame only). Snow, data
    flow; count = the story's quantity. D3
15. **Voronoi Stipple** — Secord weighted stippling: darkness-weighted
    Lloyd relaxation via d3-delaunay, 40-80 iterations. Engraved portraits/
    objects, density maps. D4
16. **Halftone Plate** — dot grid, radius ∝ sampled luminance, screen angle
    15-45°. Retro-print figures, duotone photos-as-graphics. D2
17. **Dither Decay** — ordered Bayer/Floyd-Steinberg dithering as a texture
    gradient. Digital/degradation metaphors, brutalist accents. D2
18. **Circle Pack Fill** — collision-packed circles filling a silhouette,
    radius from data or noise. Composition/resource-pool stories. D3
19. **Truchet Weave** — random quarter-arc tiles forming endless pipes,
    seeded 2-state grid. Infrastructure, networks, complexity-from-rules. D1
20. **Mondrian Split** — recursive weighted rectangle subdivision,
    restrained fills + hairline rules. Structured covers, budget/allocation. D2
21. **Phyllotaxis Bloom** — θ = n·137.5°, r = c√n golden spiral, size/hue
    mapped to data. Growth, accumulation. D1
22. **Constellation Graph** — glow nodes + Delaunay/Gabriel edges over
    night base, 1-2 highlighted paths. AI/connectivity, supply chains,
    org webs. D2
23. **Chladni Curve** — Lissajous/harmonograph parametric line
    (x=sin(at+φ), y=sin(bt)) stroked with glow. Resonance, elegance
    dividers, abstract AI-math. D1

## CARTOGRAPHY & DATA

24. **Alaska Hero Map** — committed GeoJSON + canonical projection
    (`d3.geoConicEqualArea().parallels([55,65]).rotate([154,0]).fitExtent`),
    glow coastline, interior treatment varies (stipple/contour/hillshade/
    borough choropleth). Any geographic beat; brand signature. D3
25. **Great-Circle Route** — d3.geoInterpolate arcs between labeled
    endpoints, dash rhythm, interference rings at landing points. Cables,
    shipping, flights, exports. D2
26. **Choropleth Glow** — boroughs filled on dark base, OKLCH sequential
    ramp, thin luminous borders, DIRECT labels (kill legends). Regional
    comparisons. D3
27. **Orthographic Globe** — d3.geoOrthographic rotated to hero hemisphere;
    graticule10 wireframe + great-circle arcs + radial-gradient limb
    shading (light at 33%/28%); optional day/night terminator
    (geoCircle r=90 at solar antipode). Arctic/global framing — Alaska at
    the top of the world. D3
28. **ISOTYPE Rows** — repeated same-size pictograms, partial icon for
    fractions, one accent row. Quantities with human meaning (jobs, boats,
    homes). D2
29. **Big-Number Tile** — one huge tabular figure + unit + one-line context
    + hairline rule, Swiss-placed. The data breather slide. D1
30. **Annotated Line Poster** — one chart, direct end-labels, one
    highlighted series vs gray context, one leader-line annotation at the
    inflection. FT/Datawrapper grammar. D2
31. **Small-Multiples Grid** — 4-9 mini charts, shared axes, one panel
    highlighted. Comparisons without memory load. D3
32. **Prism Map / 3D Bars** — parallel projection ONLY (cabinet oblique:
    x + 0.5z·cos45°, y + 0.5z·sin45°), walls 2 shades darker by facing,
    h = k·value linear, grid/labels stay flat. Regional metrics,
    sparingly. D3
33. **Hillshade Relief** — numpy: gy,gx = gradient(elev); slope/aspect;
    hs = cos(zen)cos(slope) + sin(zen)sin(slope)cos(az−aspect), az 315
    el 45; multiply over hypsometric ramp (PIL pre-render, <img> in slide).
    Terrain heroes; also relights any grayscale art as emboss. D2

## 3D & DEPTH (the dimension bench)

34. **AK3D Terrain** — fbm heightfield (`AK3D.heightfield`), redistribution
    e=(1.2e)^3 for peaks, ridged 2(0.5−|0.5−n|) for ranges; Lambert +
    ambient 0.3-0.4; exp2-ish fog to sky color; plan the frame with the
    composition math in ak3d.js (horizonY = cy + tan(−pitch)·f). Epic
    landscape heroes, data-landscapes. D3
35. **Perspective Point Cloud** — project dots, r = r0·f/z, alpha ∝ f/z,
    z-sorted (`AK3D.points3d`); Fibonacci sphere (z=1−2i/(N−1),
    θ=i·π(3−√5)) for globes/clouds. Constellations, particle spheres. D2
36. **Depth-Weighted Wireframe** — mesh edges only, lineWidth = k/z, alpha
    falls with depth; far lines first. Blueprint/technical 3D; zero sorting
    bugs. D2
37. **Painter's Solid** — convex low-poly forms: backface cull (screen-space
    signed area) needs NO sort; concave scenes sort by centroid z
    (`AK3D.render` does both). Crystals, monuments, product forms. D3
38. **Isometric Block World** — 2:1 dimetric tiles: sx=(i−j)·W/2,
    sy=(i+j)·H/4 − h·rise; rows back-to-front = free occlusion; three-face
    light (top +15L / left base / right −15L), ONE global light; crisp
    12-20% alpha cast shadows along one direction. Systems, datacenters,
    infrastructure explainers. D2
39. **Cabinet Extrusion** — front face undistorted, depth at half scale 45°;
    walls darker, lid lightest. 3D type, extruded cards, honest 3D bars. D2
40. **CSS 3D Stage** — perspective: 800-1200px scene, preserve-3d object,
    faces rotate-then-translateZ; fake lighting with per-face gradient
    overlays; text stays vector-crisp under transform. GOTCHA: overflow/
    opacity/filter on ancestors flattens the scene; offset coplanar faces
    ≥1px. Typographic 3D heroes, exploded layer stacks
    (rotateX(54.7°) rotateZ(45°) + translateZ(i·60px) + per-layer shadow). D3
41. **Zdog Model** — declarative rounded pseudo-3D (parallel projection,
    stroke = volume); per-face Box colors give three-face light free; avoid
    intersecting shapes (per-shape z-sort). One updateRenderGraph() then
    screenshot. Friendly dimensional icons/mascot moments. D2
42. **Multiplane Parallax** — 3-7 discrete layers: scale 0.72^i, atmosphere
    lerp (i/n)^1.4, DOF blur ∝ |z−z_focus|, ONE sharp focal plane, dark
    repoussoir foreground bleeding off-frame. The default "deep 2D" scene
    recipe. D2
43. **Gradient Solids** — sphere: radial-gradient(circle at 33% 28%, light,
    mid 45%, dark 80%) + 4% hard highlight + ground shadow; cylinder:
    symmetric linear band; cone: converging band. 90% of geometric shading
    needs. D1
44. **SVG Phong Emboss** — blur(SourceAlpha 3-5) as bump →
    feSpecularLighting(surfaceScale 4-8, exponent 15-25, distant az 225
    el 45) → composite over source; feDiffuseLighting for matte clay.
    Badges, chiseled type, molded panels. Set color-interpolation-filters
    explicitly. D3
45. **Layered Shadow Elevation** — stacked shadows in geometric series
    (1,2,4,8,16px offsets/blurs, equal ~0.2 alpha), y ≈ 2x, shadow color =
    darkened bg hue never black. Which-layer-floats hierarchy. D1
46. **Volumetric Shafts** — 5-9 wedge polygons fanning from the light,
    alpha 0.04-0.12, screen/lighter blend, noise-masked; dust motes inside.
    Drama, reveals. D2
47. **Neon Layering** — ≥3 same-hue glow layers with growing blur
    (0 0 5px / 20px / 40px) + near-white core. Signals, night-tech. D1
48. **Long Shadow** — silhouette extruded 45° (stacked 1px shadows or one
    skewed fading polygon to frame edge). Flat-design dimensionality. D1
49. **WebGL/SwiftShader — SUPERSEDED (2026-07-11)**: the GPU path is now
    PROVEN and first-class via the committed akthree bench; see #87. The old
    warnings survive as rules inside #87 (probe, sentinel, fallback design).

## RENDERED 3D (the GPU + raymarch bench — NEW 2026-07-11)

The 2D-to-3D leap. Verified in this container: WebGL2 runs via SwiftShader
(ANGLE/Vulkan "Subzero") and a full PBR frame at 2160x2700 costs ~70ms to
render (~3-9s per slide all-in). Every deck now has access to REAL rendered
artwork. Doctrine still applies: perspective for scenes, never for quantities;
text stays DOM/SVG; one imaginary light per deck; fog in the sky's hue.

87. **GPU PBR Scene (akthree)** — three.module.min.js (r170, committed) +
    `assets/js/akthree.js`. Physically-based materials (gold/steel/clay/
    plastic/ice/emissive presets from the brand world), 2048px PCFSoft shadow
    maps, ACES tone mapping, procedural IBL (`AKT.environment`: an emissive
    softbox room through PMREMGenerator, so metals get REAL reflections with
    zero texture files), three-point illustration rigs (`AKT.rigs.arcticNight
    / goldenHour / galleryWhite`), geometry helpers (lathe / tube-on-path /
    extrude-with-bevel). HARD RULES: `setPixelRatio` BEFORE `setSize` (the
    bench does it; hand-rolled three code that reverses them silently renders
    1x); `await AKT.snapshot(R)` and CHECK `.ok` (black-frame sentinel: reads
    24 px, catches the documented headless first-paint race and silent-2D
    fallback); always design a Canvas/AK3D fallback for `AKT.webglOK()===false`;
    render into an OFFSCREEN canvas and `drawImage` onto the slide's 2D canvas
    when compositing with 2D art or akpost. Hero scenes, monuments, object
    still-lifes, dimensional systems. D3
88. **SDF Raymarched Hero (aksdf)** — `assets/js/aksdf.js`, pure-JS CPU
    sphere-tracing for ORGANIC sculpted forms meshes are bad at (blended
    blobs, carved monuments, molten masses). Primitives + quadratic smin (the
    only safe smin: never overestimates distance) + twist/repeat/fbm
    displacement (thin-shell: only when |d|<0.12); tetrahedral normals; 5-tap
    AO applied to sky/indirect ONLY (never the key term: Quilez rule); single
    soft-shadow ray (k~14); fresnel rim; two-tone warm-key/cool-shadow ramp;
    ACES + gamma out. Render at 480x720 internal into a box and upscale (the
    softness reads painterly); ~5-15s for <=12 primitives; `deadlineMs`
    degrades shadows->AO, never aborts. Carved tunnels go near-black: raise
    the indirect floor or light them with an emissive material. One hero
    panel per deck, cache by seed. D4
89. **Film Grade Pass (akpost)** — `assets/js/akpost.js`. THE finishing move:
    call `AKPOST.grade(ctx,{...})` once on the ART canvas after all drawing.
    Researched op order (not optional): bloom (linear, brights) -> exposure ->
    saturation -> log-contrast (pivot 0.18) -> ACES filmic -> display gamma ->
    lift/gain split-tone -> luminance-masked soft-light grain -> IGN dither
    (kills 8-bit banding; ALWAYS on with large soft gradients) -> unsharp
    mask. House grade for the dark-arctic register lives in the file header.
    Restraint: aberration only on hero-art slides (never data/type); total
    texture budget (grain+dither+feTurbulence) <= ~10%; brand-exact marks
    (gold Polaris, wordmark) stay DOM/SVG so the grade never shifts them.
    `AKPOST.depthGrade(d)` returns the atmospheric-perspective numbers
    (mix/contrast/chroma/blur) for layered 2D scenes. D2
90. **OKLCH Material Ramps + Gradient-Map Underpainting (akcolor)** —
    `assets/js/akcolor.js`. Perceptually even palette math: `AKC.ramp(base,
    {steps:7, keyHue, ambientHue, drift})` builds 5-7 step material ramps
    with the chroma bell (peak at L~0.55) and hue drift toward the key in
    light / ambient in shadow ("warm light, cool shadow", numerically).
    `AKC.mixOklab` for gradients (no gray dead zone); `AKC.gradientMapLUT` +
    `applyGradientMap` remaps a grayscale value-study underpainting through a
    brand ramp: instant "everything in one light" cohesion. Gamut-maps by
    CHROMA reduction at constant L/H (never RGB clamping). Use ramp steps for
    shading instead of ad-hoc lightening. D2

## SUBJECT ICONS (story-anchor illustrations)

49b. **SpawningSockeye** (NEW 2026-07-09) — a side-profile spawning sockeye
    salmon as a single filled SVG path set: humped dorsal back, hooked upper
    jaw (kype), forked caudal fin, dorsal/adipose/anal/pelvic/pectoral fins,
    a top-lit vertical body gradient (light dorsal to deep belly), an
    olive-green head (the iconic spawning coloration) with a bone eye, and a
    dashed lateral line. Outer silhouette at hero weight, fin seams at fine.
    Reads unmistakably as salmon at 432px thumb. Doubles as a DATA ANCHOR:
    the fish can wear story marks (a hand tally-stroke and a machine
    bounding box) so one object states a whole thesis. Portable, offline,
    deterministic. Used as the cover + close bookend of "One River, Two Ways
    to Count It." Generalizes: build other AK subject icons (a boat, a
    turbine, a drone-in-a-box) the same way — one confident filled path,
    profile-heaviest outline, one gradient, one accent, grain over the fill. D2

49c. **Subsurface Cutaway Panorama** (NEW 2026-07-11) — an engineering
    cross-section of the ground drawn as a cabinet-extruded folded-strata slab
    and sliced as a PANORAMA SPINE: strata tops are pure functions of
    globalX = slideIndex*1080 + localX (`yTop_i(gx) = base_i - amp*sin(2π(gx-x0)/λ)`
    for a gentle anticline), so adjacent panning slides seam EXACTLY while the
    camera pans across features (reservoir region -> pipeline+valve ->
    surface demand). Bands are material-coded (#65 crosshatch: dense shale seal /
    sparse porous sandstone / blue gas stipple); depth from cabinet extrusion +
    atmospheric fade to a basement haze + a blurred repoussoir clod. Two devices
    ride the spine: a per-slide RESERVOIR-LENS STATE MACHINE (empty -> depleted
    stipple -> filling gas-blue -> dashed phantom "unconfirmed") that doubles as
    the story's progress, and a shared object whose state flips (a valve OPEN with
    flowing dashes -> SHUT with an amber lock-bar across the hub + cold downstream).
    The surface line does double duty as the demand skyline (home plateau vs a
    single tall load bar). Cover/close are pulled-back whole-slab bookends of the
    same section. Honest: all quantities stay in parallel projection (cabinet
    bars, #39), never perspective. Label discipline is mandatory: primary text in
    the sky zone (y<=~560), every in-section readout on a dark plate/knockout.
    Used as the hero of "The Cook Inlet Gas Machine." Generalizes to any
    infrastructure-in-the-ground story (pipelines, aquifers, mines, permafrost,
    cables). D3

## TYPE & CAROUSEL MECHANICS

50. **Title-Card Hook** — 120-170px display (high-contrast serif or wide
    grotesk), hand-broken lines, optical-left alignment, mono credits
    footer, over one atmosphere. Always a cover candidate. D2
51. **Knockout Reveal** — art inside giant letterforms (background-clip:
    text or SVG text mask), field continues faintly outside at ~10%. Covers
    where one word IS the story. D2
52. **Echo Outline Type** — offset stroked copies (-webkit-text-stroke /
    shadow stack) fading back. Motion/emphasis without imagery. D1
53. **Variable-Axis Crescendo** — same word set in rising wght/wdth via
    font-variation-settings across slides — type as the progress motif. D2
54. **Panorama Spine** — one master field n·1080 wide, sliced per slide
    (same seed, camera x += 1080); only art crosses cuts; text ≥80px inside
    columns. The continuity chassis. D3
55. **Motif Ticker** — small recurring glyph in a fixed corner advancing/
    filling per slide, doubling as progress. D1
56. **Duotone Unifier** — feColorMatrix saturate(0) → feComponentTransfer
    table ramp to two brand inks — forces any mixed visuals into one
    system. D2
57. **Frozen Dash Motion** — stroke-dasharray rhythms with per-element
    dashoffset implying motion direction in a still. Routes, flows,
    timelines. D1
58. **Closing State-Ring Counter** (NEW 2026-07-12) — a cyclic process (N
    named stages) drawn as N arcs of a ring; the ring advances one arc per
    narrative beat and SEALS shut (bridge the top gap with a gold accent +
    Polaris) at resolution, doubling as the deck's progress counter. RULES
    that make it read: unlit arcs must be a clearly DIM GRAY (not a faint
    tint of the lit hue) or brightness-only increments read as a static logo
    at corner/thumb size; pair with an EXPLICIT quantized label (a small mono
    "N / 4") so the fill count is unambiguous; the full-size version can host
    the stages as labeled blocks at the clock positions with cased signal
    arcs BETWEEN them (leave a >=30deg gap so arrowheads never collide with a
    block plate; draw plates BEFORE arcs so arrowheads are never covered). A
    central subject (an ember, a target) can be "hunted" by the loop. Used as
    the hero + continuity motif of "First Machine to the Fire" (the
    detect/decide/dispatch/douse autonomy loop). Generalizes to any pipeline,
    control loop, decision cycle, or multi-stage process story. D2

58b. **FIRM/SOFT Dividing Rule** (NEW 2026-07-13) — a continuity motif where a
    single vertical rule splits every slide into two argued halves distinguished
    by TYPE WEIGHT, not just color: one side SOLID (certain / real / dated), the
    other GHOST (dashed drafting phantom-lines #67, outlined, "proposed"). The
    rule's x-position and state MIGRATE with the narrative (centered at the setup,
    shoved toward whichever side the beat is about, a centered ledger spine at the
    reckoning) and it SEALS into a climactic bar at synthesis (here a gold, beveled
    "closed door" = the executive-session decision boundary) then SPLITS OPEN into
    the closing question. Doubles as the progress indicator. RULES that make it
    read: the two sides must be legible on their own merits (SOFT readable copy
    stays SOLID in the ghost hue, only containers/rules go dashed, or contrast
    fails); keep the argued figures in their own units on each side and print a
    "different units, not one sum" guard if they are not comparable; the seal is
    the deck's single saturated-accent moment (gold budget). Used as the hero
    system + continuity of "The Interior's Power Math" (firm gas capacity now vs a
    still-proposed AI load). Generalizes to any certain-vs-speculative, cost-vs-
    benefit, or who-decides-who-pays story. D2

58c. **Thermal Search-Grid Motif** (NEW 2026-07-17) — a drone's-eye perspective
    ground grid living in the lower field of every slide that CHANGES STATE with the
    narrative and doubles as the progress read: idle scan (cover) -> sweeping with a
    found dot + interference rings (stakes) -> a counting lattice behind ISOTYPE
    figures -> wide+soft for a breather -> ONE cell white-hot LOCKED as a rendered CNN
    detection (a small subject in a gold bounding box with corner ticks, over AK3D
    thermal terrain) -> forks into two labeled branches for an AI-vs-human honesty
    beat -> a single sealed node whisper at the close. Perspective grid: fixed
    vanishing point, horizontal rows spaced pow(t,1.7) toward the horizon, verticals
    fanning from the VP; a "lit" cell is a warm gradient quad; keep the grid in the
    LOWER field (y > ~760) so it never overprints the cold upper-sky text zone. Pairs
    with a THERMAL palette (ember/amber/white-hot on cold navy) and a warm-river
    edge-tease. RULES: the state change must be a SHAPE change (found dot, locked box,
    fork), not brightness-only; the white-hot detection is the deck's single hottest
    point and the gold budget's anchor. Used as the hero + continuity motif of "No
    Road Out. Quinhagak Flies Its Own Eyes." Generalizes to any sensing / detection /
    search-and-rescue / monitoring story. D2

58d. **Isometric Wiring-Diagram + Evolving Conduit** (NEW 2026-07-18) — a whole
    deck built as ONE shared 2:1 dimetric isometric world (screen sx=(i-j)*W/2,
    sy=(i+j)*H/4 - z*rise; draw rows back-to-front for free occlusion; one global
    upper-left light with three-face shading top/left/right and a 14% cast shadow
    thrown down-right) whose focal objects change per beat, tied together by ONE
    glowing CONDUIT that changes SHAPE every slide and carries a small gold
    progress tick: cut by the right edge (cover) -> splits at a gold junction
    (the on/off distinction) -> a SEVERED blunt stub with a visible black GAP to a
    DETACHED slate island (off-grid) -> snaps LIVE into a gold anchor node on a
    cyan web (on-grid) -> forks into two EQUAL tapered arrows at a gold pivot (the
    two-way mechanism) -> flattens into a data baseline -> a dormant hairline at
    rest (breather) -> a SOLID gold stub vs a DASHED phantom void (#67) (adopted
    vs pending) -> a sealed gold ring (close). RULES that make it read: the state
    change must be a SHAPE change not brightness; the OFF/disconnected subject is
    a slate slab with NO glow (this is what makes "not on your grid" legible at
    432px with zero words); keep the conduit routed AROUND all DOM text at plan
    time (canvas ink is invisible to qa.py); one gold budget (junction, node,
    pivot, tick, seal). CRAFT CAVEAT (run 10 scorer): schematic iso reads FLAT
    unless the ONE hero/focal node is a genuinely RAISED 3D object (iso pedestal +
    three-face base + real contact shadow, not a flat disc) and the DOF context
    grid is present enough to register; raised slabs/boxes (the island, the
    anchor) read dimensional, a flat disc does not. Used as the hero + continuity
    chassis of "On the grid, or off it." Generalizes to any on-grid-vs-off-grid,
    network, supply-chain, or infrastructure-siting ARGUMENT deck. Pure Canvas 2D,
    offline, no GL. D3

## LINE & DIAGRAM FLAIR

The meta-law from every lineage (ink, drafting, cartography, transit maps,
Tufte): lines carry meaning through DIFFERENTIATED WEIGHT; craft = a small
fixed system of weights/dashes/terminators applied with total consistency.
Uniform line weight is the #1 amateur tell.

**The five-token weight system** (CSS vars, at 1080px width; forbid
off-token widths — assign by MEANING):
`--w-hair: 0.75px` (hatching, grids, scaffolding) · `--w-fine: 1.25px`
(detail, leaders, dimensions) · `--w-std: 2px` (default object stroke) ·
`--w-bold: 3.5px` (emphasized/cut edges) · `--w-hero: 5.5px` (THE key path,
outer silhouette).

**Tufte opacity tiers**: data 1.0 / labels 0.75 / axes 0.4 / grid 0.10-0.15.
Grey for context, ONE accent for focus.

58. **Profile-Heaviest Rule** — outer silhouette gets hero weight; interior
    seams hair/fine ("everything relates to the distance between adjacent
    surfaces"). Any object illustration. D2
59. **Tapered Ribbon Stroke** — polygon-from-centerline: sample path every
    4-8px, offset ±w(t)/2 along normals, fill; w(t)=wMax·sin(πt)^0.7. Hero
    connectors, hand annotations. D3
60. **Chisel-Nib Ribbon** — constant-angle extrusion ±(nib/2)(cos40°,sin40°);
    width varies with direction like a broad pen. Calligraphic arrows,
    swashes. D3
61. **Low-Pass Wobble (xkcd)** — perpendicular displacement by SMOOTHED
    noise (2-3 neighbor-average passes), amplitude 1.5-4px, always seeded;
    + white casing under the line at ~4x width. Napkin-sketch voice ONLY;
    never on dense data; never sub-1.5px. D3
62. **Rough Double-Stroke** — every outline drawn twice with independent
    seeded jitter (roughness 0.8-2.5, bowing ~1); overlap reads as ink.
    Premium decks prefer taper + slight bowing over full wobble. D2
63. **Seeded Hachure Fill** — parallel hairlines at −41° (off-45 feels
    hand-set), gap 4x strokeWidth, weight 0.5x, jittered ends. Sketch/patent
    fills. D2
64. **Density-Ramp Hatching** — generated line ARRAY (not <pattern>) with
    spacing 4→12px as a function of position, clipped to shape — hatching
    as shading; monochrome depth. D3
65. **Cross-Hatch Material Code** — 45°+135° hair crosshatch = dense/solid;
    sparse parallels = light/transparent; stipple = soft. Region coding
    without color. D2
66. **Stipple Tone Field** — Poisson-disk dots (min-dist ∝ 1/√density),
    r 0.8-1.5px, blue-noise never grid-jitter. Soft shadows, terrain. D4
67. **Alphabet-of-Lines Dash Kit** — hidden `7 4` / center `24 5 5 5` /
    phantom `30 5 6 5 6 5` at 1.25px; centerlines overshoot shapes 8-12px
    and cross at hole centers. Implied states, symmetry axes, ghosts. D1
68. **pathLength Dash Symmetry** — set pathLength="100", pick dasharrays
    dividing evenly so both ends land on full dashes. Every visible dashed
    rule. D1
69. **Round-Cap Dot Rhythm** — dasharray "0 N" + round cap = perfect dots
    at N≈3-4x width. Dotted leaders, soft boundaries. D1
70. **Scotch Rule** — the editorial thick-thin pair: 4px rule + 3px gap +
    0.75px hairline (thick toward the content head). Section headers,
    mastheads. D1
71. **Rule Terminals** — end major rules with ONE chosen flourish (4px dot,
    6px perpendicular tick, or 45° cut) used deck-wide. D1
72. **Leader-Line Discipline** — oblique 30-60° (snap 15°), 18-24px
    horizontal elbow at the text end; terminator encodes target: arrow=edge,
    5px filled dot=face, 45° tick=dimension; leaders never cross. D2
73. **Dimension Call** — extension lines: 4px gap from object, 6px
    overshoot; 3:1 arrowheads (~10x3.3px); centered small-caps value;
    rows 24px then 16px apart. "2.4x wider" spatial claims. D2
74. **Haloed Balloon Numbers** — 24-28px numbered discs with 3px
    canvas-color halo ring, mono numerals, leaders to parts. Step/part
    enumeration over art. D2
75. **Hatch Knockout Windows** — blank rounded-rect holes punched in any
    texture behind labels (numerals never sit on hatching). D2
76. **Junction Dots & Hop-Overs** — connection = filled dot 2.5-3x width;
    crossing-no-connection = semicircle hop r≈2.5x width; NEVER a 4-way
    dot junction (offset into two Ts). Any line-crossing diagram. D2
77. **Octolinear Snap** — all segments 0/45/90/135°, bends rounded at
    r=2-3x width, uniform weight, even stop spacing (Beck/Vignelli).
    Journey/pipeline/roadmap "transit" slides. D3
78. **Interchange Roundel & Station Ticks** — stops = perpendicular ticks
    (length ≈ width); major nodes = white-filled circle + ring (ring ≈
    width, d ≈ 2.2x width). Milestones on transit lines. D1
79. **Cased Line (Halo Stroke)** — every line crossing texture drawn twice:
    casing at width+3px in canvas/darker color underneath. Universal
    map-grade legibility. D1
80. **Neon Triple Layer** — same path 3x: 12px @25% blur(8) → 6px @55%
    blur(3) → 2px near-white core. ONE glowing path per slide. D2
81. **Segment-Interpolated Gradient Stroke** — 30-60 getPointAtLength
    segments, per-segment interpolated color, round caps hide seams.
    Flow direction, temperature along a path. D3
82. **Marker Arrowhead Set** — <defs> markers, orient="auto-start-reverse",
    markerUnits="strokeWidth", fill="context-stroke"; filled 3:1 =
    technical, open 35° chevron = editorial, barbed concave-back = ink.
    ONE shape per deck. D2
83. **Drafting Furniture Kit** — crop-mark Ls (20px, offset 8px, never
    touching), registration circle+cross (r7, low opacity), plus-grid at
    intersections (10px arms @10%), title block (hairline table, mono
    small-caps, 2.5px outer border, bottom-right). Blueprint/document
    framing. D2
84. **Instrument Corner Readouts** — mono small-caps telemetry (tracked
    +8-14%, 60-75% opacity): coordinates, checkerboard scale bar (4-6
    segments, 8px tall), tiny axis glyph — small and inconspicuous. D2
85. **Curve Exit Discipline** — edges exit nodes PERPENDICULAR to the node
    boundary, then bend; S-link control points at 1/3 and 2/3 span,
    Δ = 0.4·|x2−x1|. Pick ONE routing voice per deck: orthogonal
    (engineered) / octolinear (transit) / cubic Bézier (organic). D2
86. **Lynch Urban Glyphs** — paths = bold lines, edges = toothed/hatched
    barriers, nodes = circles, districts = loose hatched blobs, landmarks =
    stars. Ecosystem/landscape diagrams that shouldn't look like org
    charts. D2

**The four line voices** (never mix cap styles or wobble regimes within a
slide; contrast voices across a deck deliberately — clean art + hand-ink
annotation is the strongest pair):
- **Drafting**: 58, 67, 72, 73, 75, 83 + butt caps/miter joins
- **Transit/Systems**: 76, 77, 78, 79, 82 + round/round
- **Hand-Ink**: 59, 60, 61, 62, 63, 71 + one seed per slide
- **Instrument/Editorial**: 68, 69, 70, 74, 80, 81, 84

58e. **Source-Provenance Evidence Tags** (NEW 2026-07-19) - an honesty beat that renders
    a story's SOURCING state as design, for single-source or thinly-sourced decks. Two
    title-block plates (#83) sit side by side: a LEFT plate drawn SOLID with a gold
    "SOURCED" / "VERIFIED" stamp naming the fetched source and date, and a RIGHT plate
    drawn as a DASHED phantom (#67) with a gray "NOT CHECKED" stamp naming what could not
    be independently verified (a paywalled primary paper, a 403, a single secondary source).
    Weight and dash state, not just colour, carry the meaning: solid = confirmed, ghost =
    unconfirmed. Pairs naturally with a scale beat (one lit tick on a vast empty plain =
    "one embankment, not the region") so the deck's factual LIMIT and its factual SOURCE
    are both drawn, not footnoted. RULES: the gold "SOURCED" stamp is the slide's single
    saturated-gold moment (gold budget); keep each plate to a stamp plus <= 2 short mono
    lines; the primary-source disclosure MUST also ride into the first comment. Used as the
    honesty beat of "Reading the Frozen Ground at the Top of America" (a single-source
    permafrost digital-twin deck). Generalizes to any deck built on one source, a press
    release ahead of a paywalled paper, or a claim the studio could not fully verify. D2

58f. **Single-Signal-That-Never-Multiplies motif** (NEW 2026-07-21) - a continuity + honesty
    device for any "better instrument, not a fix" story. ONE small warm accent-point (here a gold
    beluga "call") is the deck's only warm element, and it changes STATE across every slide (cover
    faint call in the murk -> passes the detect ring -> a needle punching up through a noise band ->
    resolves into the lit species channel -> the single datapoint on the honest chart -> seals into
    the Polaris at close) but is NEVER duplicated into a chorus. The restraint carries the argument:
    a clearer signal is not more animals. Pair with (a) a visibly UNCHANGED environment between the
    first content slide and the turn slide (same cold water = the world the instrument cannot move),
    and (b) a mono depth/telemetry readout that advances as the progress meter. RULES: the accent is
    the strict single-hue budget, audited on EVERY secondary label so nothing else leaks warm; cool
    (snow/ice/steel) everything that is not the signal; a functional "stop/blocked" role may use a
    distinct red without breaking the warm-accent budget. Used as the spine of "A Better Ear Is Not a
    Recovery". Generalizes to monitoring/detection/measurement stories whose point is that sensing is
    not solving. D2

58g. **Boundary-Box Limit beat** (NEW 2026-07-21) - the honesty TURN drawn as a diagram. The
    instrument (a compact glyph of the machine + its one output token + a mono "OUTPUT: WHERE AND
    WHEN" chip) sits INSIDE a dashed drafting boundary box; the forces the machine cannot touch
    (noise, prey, habitat) sit OUTSIDE it, drawn as arrows that travel toward the box and STOP dead
    at the wall with a short red blocked-cap and NO intake port. The visual claim: the instrument
    measures the subject, it cannot move it. Keep the box's interior output cool/gold-single and the
    blocked-caps red (functional stop colour); route all labels in DOM/SVG on knockout plates; place
    the box near optical centre so the lower third is not dead. Used as S8 of "A Better Ear Is Not a
    Recovery" (measures but cannot move the whale). Generalizes to any deck arguing that a tool's
    output is narrower than the problem (monitoring vs recovery, prediction vs prevention, a metric
    vs the thing it measures). D2
