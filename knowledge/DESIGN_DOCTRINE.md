# DESIGN DOCTRINE — the visual standard

What separates our slides from templates. Every rule is codifiable; the
pixel critics grade against this document. Companion: TECHNIQUE_LIBRARY.md
(the how), SLIDE_DOSSIER_SPEC.md (the plan format), CAROUSEL_CRAFT.md
(platform physics).

## 1. The grid is the engine (Swiss doctrine)

- Build every slide on a **12-col x 8-row module grid**, 80px outer margins,
  24px gutters, all sizes/spacing multiples of an 8px base unit.
- **Asymmetric composition on the symmetric grid.** Never default to centered
  stacks; centered is a deliberate choice reserved for 1-2 line title cards.
  Place mass off-axis, counterweight with a small element.
- Restraint budget per slide: **max 2 type families, 3 type sizes, 1 accent
  color, 1 loud visual device.** One deliberate grid violation maximum.
- Negative space is the price of premium: margins never invaded by primary
  content; at least one generous quiet zone per slide.
- Optical > mechanical alignment: pull display-type left edges out slightly
  so glyph stems align; hang punctuation outside the margin.

## 2. Typography

- Library (committed, see engine SKILL.md): Fraunces (brand serif, the
  editorial soul), JetBrains Mono (telemetry/data), Space Grotesk, Archivo
  (width axis 62-125% — the poster voice), Manrope (body workhorse),
  Instrument Serif (elegant display), Bricolage Grotesque (characterful),
  Unbounded (wide statement display, sparingly).
- Pair with intent: serif display + mono metadata is the house editorial-tech
  signature. One display voice + one support voice per deck; mono always
  allowed as the third "instrument" voice for data/labels.
- Scale from a modular ratio (1.25 dense / 1.333-1.5 dramatic). Display
  leading 0.95-1.05, body 1.3-1.45. Display tracking −1% to −3%; tracked-out
  (+5-12%) only for small all-caps mono labels.
- Line length on slides: 28-42 characters. Headlines wrap ≤3 lines, broken
  at sense boundaries — never orphan a preposition; break lines by meaning.
- Data uses `font-variant-numeric: tabular-nums lining-nums` (or mono).
- Type crimes (auto-fail): faux bold/italic (weights not in the library),
  fake small caps, unkerned display pairs (check A-V, L-T at >90px), full
  justification, hyphenation, ALL-CAPS paragraphs, more than 2 families,
  two similar sans faces together.
- Fit-to-box recipe for display type (no guessing): binary-search font-size
  in JS until `scrollWidth ≤ clientWidth && scrollHeight ≤ clientHeight`,
  then floor to a scale step. Never let the renderer discover overflow.

## 3. Color

- **Dark-arctic-first**: base never pure black — layered dark surfaces from
  the brand register (#030710-#0d2038 family), 2-3 elevation steps apart.
- Brand anchors always present somewhere: Alaska flag gold **#FFC72C**
  (Polaris/accent), aurora family (cyan-green #3CE6B4 / ice blue #5AC8F0 /
  violet #9664E6), forget-me-not #6EA5FF, snow #F4F8FF.
- Rotate the SUPPORTING palette per deck from the story's material world
  (salmon roe orange, sodium-lamp amber, sea ice mint, spruce, tundra rust,
  NOAA-chart sepia) — palettes derive from the subject, never from a SaaS
  mood board.
- 60/30/10 hierarchy; most saturated color on the smallest area. Desaturate
  large fills; light-on-dark text drops one weight notch and gains +1-2%
  tracking (optical bleed compensation).
- Gradients: interpolate in **OKLCH** (`linear-gradient(in oklch, ...)`) or
  multi-stop to kill the gray dead zone; ease stops near the dark end; grain
  over every large gradient (banding + flatness). Green-first auroras read
  authentic; purple-first reads as slop.
- **AI-slop ban list** (auto-fail): indigo→purple SaaS gradients
  (#6366F1/#8B5CF6 as accents), three evenly-rounded glass cards, thin-line
  icon decoration, Inter-everywhere sameness, unmotivated glassmorphism.
- Text contrast ≥4.5:1 at the worst-case point; earn it with the art
  (composition routes quiet zones under text) before reaching for scrims;
  scrim/plate/backdrop-blur are the fallback tools, subtle and motivated.

## 4. Depth & dimension (the 3D mandate)

Flat is a choice, not a default. Every deck deploys REAL depth somewhere —
the hero slide at minimum — chosen from the 3D bench (TECHNIQUE_LIBRARY
§3D): software-3D meshes/terrain (AK3D), point clouds, depth-weighted
wireframes, isometric systems (2:1 dimetric, three-face light: top +15L /
left base / right −15L, one global light), CSS preserve-3d stages, oblique
extrusion, orthographic globes, hillshade relief.

The cinematographer's stack — compose with at least FOUR depth cues:
1. Atmospheric perspective: per layer i of n, lerp color toward sky by
   (i/n)^1.4, desaturate x(1−0.6·i/n), contrast falls with distance.
2. Overlap/occlusion (free and strongest — silhouettes must overlap).
3. Scale gradient (repeat elements at 0.72^i) + vertical position.
4. Depth-of-field: ONE tack-sharp focal plane; blur near+far layers;
   a blurred foreground element bleeding off-frame = instant expensive lens.
5. Fog (exp2: 1−e^−(dz)²) in the palette's sky color, never gray.
6. One key light, 4:1 to 8:1 key:fill; shadows share one global direction,
   colored as darkened background hue, never black; two-part shadows
   (tight contact + wide ambient).
7. Volumetric shafts/god rays for drama beats (wedge fans, screen blend,
   alpha 0.04-0.12).
Perspective camera language: fov 50-58 normal, 65-75 wide drama, low horizon
(20-30% from bottom) = monumental; high horizon = overview/map. Plan with
the AK3D composition math (horizonY = cy + tan(−pitch)·f) — never eyeball.
3D data honesty: parallel projection for data (iso/cabinet), NEVER
perspective on quantities, no 3D pies, grid/labels stay flat 2D.

## 5. Genuine detail (the anti-lazy standard)

Every slide must survive the zoom test — at 100% there is craft in every
region: texture in large fills (grain tile, paper tooth, dither), deliberate
edges, micro-typography (real quotes, spaced units, tabular figures),
annotation furniture (leader lines, ticks, scale bars, coordinate readouts),
line-weight hierarchy (2-4 distinct weights with meaning). No raw flat
rectangles, no default drop shadows, no unstyled chart defaults. Detail
must be MOTIVATED by the story — ornament for its own sake is also a fail.
Consistent shadow/glow physics: one imaginary light source per deck.

## 6. Illustration serves the story (the Reuters standard)

"Each design feels fresh and specific to the story." The art is never
wallpaper:
1. Extract the story's **geometry** (route, grid, boundary, network), its
   **quantity** (MW, $, jobs, km, fish), and its **place** (real geography).
2. Map concept→drawable system: connectivity→routes/networks · growth/
   decline→contours/ridgelines directional · risk→fracture/dither decay ·
   scale→ISOTYPE repetition (same-size pictograms, never enlarged ones) ·
   energy→particle density · regulation→grid lines interrupting a field.
3. **The field carries the data**: parameters of the generative system ARE
   numbers from the story (particle count = megawatts; contour interval =
   years; stipple density = population). State the mapping in the dossier;
   the critic verifies it.
4. **One literal anchor + one annotation** per abstract composition (the
   Alaska silhouette, a labeled route, one tabular figure). Two anchors max;
   zero anchors = wallpaper = fail.
5. Diagram, don't decorate: thin leader lines, small mono labels, units,
   a scale — the grammar that signals "this image contains information."
6. Alaska geography is the brand's recurring hero: committed GeoJSON +
   the canonical projection (parallels 55/65, rotate 154) — but vary the
   treatment (glow coast, stipple interior, hillshade, boroughs choropleth,
   orthographic globe from space, 3D terrain).

## 7. Deck-level continuity (story in the artwork)

Choose at least TWO per deck:
- **Panorama spine**: design slide backgrounds on one continuous n·1080-wide
  canvas so each swipe REVEALS (same field parameters, camera translating
  x += 1080 per slide; text stays ≥80px inside each column). Only art may
  cross cut lines; primary text never sits on a cut.
- **Edge-tease**: an interesting element deliberately cut by the right edge
  of slide n, completing on n+1 (ridge line, route, chart line, half glyph).
- **Motif evolution**: one glyph/system recurs every slide and CHANGES STATE
  with the narrative (a route extends, a star moves, a fill level rises, a
  variable-font axis climbs). Doubles as the progress indicator when placed
  consistently.
- **Camera move**: the same 3D scene viewed from evolving camera positions
  across slides (wide establish → detail → aerial).
- **Palette arc**: hue/temperature shifts meaningfully across the deck
  (night→dawn as the story turns hopeful).
The contact sheet review judges the deck AS A FILMSTRIP: continuity devices
must read left-to-right as one composed sequence.

## 8. The feed test (final judgment)

Every slide is ALSO reviewed at 432px thumb width: the hook must stop a
scroll at that size; body slides must have one readable takeaway at that
size. If a slide only works at full size, it fails. The cover competes with
the entire feed; it gets the deck's largest type and strongest single image.
