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

## Shot list (6 shots, ~60s) — REVISED after Gate 0B critique
Fixes applied: (1) cold-opens on the consequence in frame 1 instead of building up to it at 8s,
(2) shot 1 now ends at 11.9s (was 15.8s, sitting on the 16s ceiling) so a real world-change lands
well before the quarter-film mark, (3) the redundant "SAFER DEPTH" text chip is replaced with a
SHOWN outcome (pollock in the net, Chinook clear above), (4) shot 6's transition is relabeled
`map-travel` (a real scene-break thread) instead of `pull-out` (a move verb), so the underwater
to orbital jump can't be built or read as a same-canvas zoom.

1. **0.0-11.9s** — wide-establish. COLD OPEN on the SEASON CLOSED stamp already mid-slam at frame 1;
   a reverse-wipe then explains 2024's two boats before the timeline catches back up.
2. **11.9-19.9s** — push-detail, eye-level-immersive. Match-cut to inside the water: one Chinook
   descends and fades before a river-mouth icon, then dissolves to a single point of light.
   Transition in: **match-cut** (thread: match).
3. **19.9-31.9s** — data-panel, macro-closeup into a void. 700,000+ tag-points (each landing at its
   own depth/time coordinate, not a stock counter) assemble into one smooth probability curve.
   Transition in: **assemble** (thread: build).
4. **31.9-39.9s** — subject-portrait. Graphic-match cut: the curve resolves back into the water
   column as the breathing depth-occupancy band; the WHERE/WHEN caveat plays here. Transition in:
   **graphic-match** (thread: match).
5. **39.9-50.9s** — two-up. The trawl net's headrope depth line steers around the carried glowing
   band; ends with pollock visibly filling the net while the Chinook stays clear above (the shown
   payoff). Transition in: **mask-wipe** (thread: carry).
6. **50.9-60.0s** — map-territory. Pull back to the wide Gulf of Alaska at dawn, boats spaced clear
   of the band; branded outro. Transition in: **map-travel** (thread: travel).

## Beat map (16 beats, never-rest <=5s gaps, accelerando in the data-build section)
See `storyboard.json > beats[]` for the full timed {t, vo, shows, sfx, means} objects. Summary:
1. 0.0-3.9 — COLD OPEN: the SEASON CLOSED stamp is already mid-slam at frame 1.
2. 4.0-7.9 — reverse-wipe explains 2024, two boats, bycatch tally rising.
3. 8.0-11.9 — timeline catches up, gate fully shut; shot 1 ends.
4. 12.0-15.9 — match-cut: one salmon descends and fades before reaching a river.
5. 16.0-19.9 — the fish dissolves to a single point of light (seeds shot 3).
6. 20.0-22.4 — 13 years, Gulf of Alaska label; tag-points bloom (accelerated ~2.4s beats begin).
7. 22.5-24.9 — 700,000+ points land at real depth/time coordinates, not a generic counter.
8. 25.0-27.4 — the point-cloud begins collapsing inward.
9. 27.5-31.9 — the collapse completes into the probability curve (BUILD payoff, held to land it).
10. 32.0-35.9 — graphic-match into shot 4: the breathing depth band + diel dial.
11. 36.0-39.9 — the honest caveat drawn: WHERE sharp, WHEN foggy toward a "?".
12. 40.0-43.9 — mask-wipe into shot 5: net headrope steers around the band.
13. 44.0-47.9 — SHOWN outcome: pollock fill the net, Chinook's glow stays clear above.
14. 48.0-50.9 — VOLUNTARY stamp (softer than the opening stamp; the honest adoption note).
15. 51.0-54.9 — map-travel to shot 6: wide dawn Gulf, fleet spaced clear.
16. 55.0-60.0 — outro: wordmark, tagline, source credit, ends on motion not a static hold.

## Ending
Designed in: after "run after run," the outro stages in over the still-drifting aerial shot (parallax
continues, camera does not freeze) — wordmark, tagline, then a gentle cinematic fade.
