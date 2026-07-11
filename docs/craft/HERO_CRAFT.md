# HERO CRAFT — premium detail in the dimensional engine (geometry + materials, not light)

**Why this doc exists.** All three judges on the 2026-07-11 panel dinged the same, heaviest-weighted
axis (Illustration craft, 0.16): *"cone spruce, box cabin, cylinder+sphere figure read as plain
fills / primitive proxies"* — while PRAISING the lighting and atmosphere. Light cannot rescue
single-tier, single-zone geometry. The doctrine: **a primitive is a starting mesh you then bevel,
zone, cluster, and break up — never the final object.**

## The shape-hierarchy law (the core lever)

- **Three shape tiers per hero, always.** Squint = the big shape reads; step in = secondary shapes
  sit on or carve the primary; close = tertiary accents. One tier = programmer art.
- **70/20/10 mass split** across the tiers (and across the albedo palette). Never 50/50 — two
  equal masses compete and the eye finds nothing designed.
- **Detail density gradients toward the focal point.** Spike small-shape density at the hero,
  fall off into the fog. Uniform detail is noise; uniform smoothness is a proxy.
- **A hero is >= 3 SDF parts and >= 2 albedo zones.** (Also required for follow-through — a
  single primitive cannot perform. See CHOREOGRAPHY.md §4.)

## The SDF toolkit (ranked by ROI, all cheap)

1. **Albedo zoning by nearest primitive**: return a material id from whichever primitive won the
   `min()`; trunk vs foliage, wall vs roof vs door, coat vs skin vs pack. Kills "plain fill" for
   ~zero cost. Height bands and boolean regions also work.
2. **Second + third shape tier**: spruce = 3-5 stacked offset cones of decreasing radius with
   per-tier id-hash jitter; cabin = base + roof + chimney + door + window row; figure = smin-blended
   body + head + pack.
3. **Global bevel**: `d - r` on every hard primitive (varied r per part). Sharp mathematically
   perfect edges are the "I didn't finish" tell.
4. **Domain-repetition detail**: one evaluation tiles log courses, planks, shingles, window grids,
   fence pickets. Clamp the cell id for finite runs; key EVERY per-instance variation off the
   ROUNDED cell id (ribboning rule, DIMENSIONAL_CRAFT).
5. **Boolean subtraction for negative detail**: `max(d, -cut)` carves doorways, windows, vents.
   Negative space reads as built.
6. **smin every joint** on organic forms; vary k per join. The hard-boolean "snowman seam" is the
   cylinder+sphere tell.
7. **Proportion exaggeration + asymmetry**: elongate, taper, lean; id-hash jitter position/rotation/
   scale. Perfect symmetry and default proportions read procedural.
8. **Valid surface break-up — WARNING**: naive `d + fbm(p)` CORRUPTS the distance field (gradient
   != 1) and silently wrecks AO, soft shadows, and fog. Use the iq method: carve octaves of a
   random-radius sphere grid, clip each octave to the host with `smax`, blend with `smin`. Or skip
   micro-relief and rely on zoning + facet shading.
9. **Edge/rim bias on the hero**: you have rim light — weight it toward hero objects so they pop
   out of atmospheric murk instead of dissolving into it.

## Set dressing (sparse must read composed, not unfinished)

- **Cluster 3-4 story props near the hero** (woodpile + stump + axe by the cabin; buoy + skiff by
  the shore). Grouped = inhabited; evenly scattered = empty.
- **Fractal placement**: duplicate-shrink-rotate-offset, never grid spacing. Id-hash per instance.
- **Break the ground plane**: undulation + scattered rocks/tufts; ground valued DARKER than the
  forms standing on it; hide seams with a prop.
- **Wear and story details**: a path, smoke, a leaning fence — a few tell who lives here.
- **Density gradient**: crowded zone near the hero thinning into fog, so emptiness reads composed.

## Anti-patterns (any one = the programmer-art tell)

Single shape tier · single albedo zone · unbeveled edges · perfect symmetry/default proportions ·
hard boolean snowman joints · clean flat ground plane · grid-spaced clones · additive fbm
displacement (breaks the light) · 50/50 mass with no focal point · counting on fog to hide all of
the above (the judges see it anyway).

## Enforcement

1. **PLAN**: every shot in storyboard.json declares its hero:
   `"hero": {"name": "...", "parts": <int >= 3>, "zones": <int >= 2>, "detail_note": "<what the
   3 tiers and zones ARE>"}`. storyboard_check fails shots without it.
2. **LOOK-DEV**: the mandatory probe set includes ONE HERO CLOSE-UP still per shot (hero fills
   >= 40 percent of frame) — the editor pass reviews detail at that scale BEFORE the full render.
   A hero that only reads acceptable at distance in murk fails look-dev.
3. **JUDGE**: the scorer panel grades Illustration against this doc's shape-hierarchy law; the
   review evidence pack includes the hero close-ups.

## SOURCES

Inigo Quilez (distfunctions, sdfrepetition, fbmsdf — the authoritative SDF references); Neil
Blevins (primary/secondary/tertiary shapes); Big/Medium/Small design theory (ArtStation);
70/30 + 70/20/10 composition rules (MontCarta, Altaygrafik); RetroStyle Games low-poly guide
(bevels, silhouette, color zoning, edge highlights); The Level Design Book (clustering, fractal
placement, ground breakup, value hierarchy); MAGES set-dressing guide; StudioBinder set dressing.
