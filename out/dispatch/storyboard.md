# Storyboard — "The Depth Model" (2026-07-05)

## Story
A University of Alaska Fairbanks team (Marcel Gietzmann-Sanders, Andrew Seitz, Curry Cunningham,
Michael Courtney; UAF College of Fisheries and Ocean Sciences) trained a probabilistic deep-learning
model on 13 years and 700,000+ tagging/telemetry data points to predict what depth Chinook (king)
salmon occupy in the Gulf of Alaska by season and time of day, so pollock trawlers can choose fishing
depths that reduce accidental king-salmon bycatch. Published in *Animal Biotelemetry* (April 5, 2026);
UAF release June 8, 2026. Context: in 2024, bycatch from two boats over a single weekend was enough
to close the pollock fishery.

**Honest caveat (the one that's drawn, not just said):** the model is a population-level PROBABILITY
learned from history, not a real-time tracker of any one fish. It cannot promise a given tow is clear,
and using it is voluntary. Drawn as WHERE (the depth axis) staying sharp and gridded, while WHEN (this
tow, today) dissolves into fog around a ghosted "?".

## Style mode + taste dials
STYLE MODE: **editorial** (Bloomberg/print-graphic clarity), with naturalistic water/light rendering
for the ocean itself.

- DESIGN_VARIANCE 6 — an asymmetric scrolling strip against a centered water-column slice, not fully classic.
- MOTION_INTENSITY 5 — a breathing tide, not a race (deliberately calmer than the last two dispatches).
- VISUAL_DENSITY 6 — depth axis + probability band + diel dial are load-bearing, but negative space breathes.
- COLOR_BOLDNESS 5 — restrained indigo-navy world, one bold bioluminescent gold accent.
- TEXTURE_GRAIN 6 — filmic grain, water caustics, bioluminescent particulate.
- GRADE_STRENGTH 6 — cinematic ocean grade, split-tone toward indigo/gold.

References: Kurzgesagt's layered, backlit underwater cross-sections; Bloomberg Businessweek's
data-journalism cross-section clarity.

## Palette
Abyssal indigo-navy water column, a bioluminescent gold band, moonlit silver for the night pass, one
coral-dawn beat at the diel turn.

## Composition fingerprint (7 axes)
| axis | value |
|---|---|
| pov | cross-section-cutaway |
| motion_vector | scroll-data |
| hero_treatment | instrument-as-subject |
| layout | stacked-layers |
| register | editorial-schematic |
| palette | abyssal indigo-navy / bioluminescent gold / moonlit silver / coral-dawn |
| metaphor | the depth model breathes: a probability tide rising and falling through day and night, and the net must find the one door it leaves open |

**Divergence from the last 2 dispatches:** differs on 7/7 axes from both the data-brutalist parchment
ledger (07-02, the grid/data-center story) and the orbital field-HUD countdown (07-03, the wildfire
drones). Spatial signature (cross-section-cutaway, stacked-layers, scroll-data) is unique versus the
last 4 dispatches. Palette is fresh (no "amber/ember" or "parchment/vermilion" language repeated).

## Shot list (5 shots, ~60s)
1. **0.0-15.8s** — wide-establish. Cross-section, dusk. Trawl silhouette on the surface line; a
   SEASON CLOSED stamp lands on it.
2. **15.8-31.5s** — push-detail, macro-closeup into a void. 700,000+ tag-points assemble into one
   smooth probability curve. Transition in: **assemble** (thread: build).
3. **31.5-39.8s** — data-panel. Graphic-match cut: the curve resolves back into the water column as
   the breathing depth-occupancy band; the WHERE/WHEN caveat plays here. Transition in:
   **graphic-match** (thread: match).
4. **39.8-50.8s** — two-up. The trawl net's headrope depth line steers around the carried glowing
   band. Transition in: **mask-wipe** (thread: carry).
5. **50.8-60.0s** — map-territory. Pull back to the wide Gulf of Alaska at dawn, boats spaced clear
   of the band; branded outro. Transition in: **pull-out** (thread: travel).

## Beat map (15 beats, ~4s apart, never-rest <=5s gaps)
See `storyboard.json > beats[]` for the full timed {t, vo, shows, sfx, means} objects. Summary:
1. 0.0-3.9 — hook: a fishery can close over one bad weekend.
2. 4.0-7.9 — 2024, two boats, bycatch tally rising.
3. 8.0-11.9 — SEASON CLOSED stamp.
4. 12.0-15.9 — one salmon fades before reaching a river.
5. 16.0-19.9 — UAF team card assembles (shot 2 begins).
6. 20.0-23.9 — 13 years, Gulf of Alaska label; tag-points bloom.
7. 24.0-27.9 — 700,000+ counter races up.
8. 28.0-31.9 — point-cloud collapses into the probability curve.
9. 32.0-35.9 — graphic-match into shot 3: the breathing depth band + diel dial.
10. 36.0-39.9 — the honest caveat drawn: WHERE sharp, WHEN foggy toward a "?".
11. 40.0-43.9 — mask-wipe into shot 4: net headrope steers around the band.
12. 44.0-47.9 — SAFER DEPTH (illustrative) readout chip.
13. 48.0-50.9 — VOLUNTARY stamp (the honest adoption note).
14. 51.0-54.9 — pull-out to shot 5: wide dawn Gulf, fleet spaced clear.
15. 55.0-60.0 — outro: wordmark, tagline, source credit, ends on motion not a static hold.

## Ending
Designed in: after "run after run," the outro stages in over the still-drifting aerial shot (parallax
continues, camera does not freeze) — wordmark, tagline, then a gentle cinematic fade.
