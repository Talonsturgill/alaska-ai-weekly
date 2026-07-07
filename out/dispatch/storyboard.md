# Storyboard — "The Launch Call" (2026-07-06)

## Story
Alaska's Tribal Health System, the Alaska Native Tribal Health Consortium (ANTHC), Southcentral
Foundation, and Maniilaq Association, working with UAF's Center for Alaska Native Health Research
(CANHR), UAA, and Stanford, has published a community-engaged governance framework for AI/ML in
Alaska Native health care, alongside an early pilot machine-learning model that predicts appropriate
medevac (air ambulance) utilization for critically ill patients in Alaska's roadless villages. Over
80 percent of Alaska's communities have no road system; when someone is critically sick, the only way
out is by air, and a clinic worker has to decide whether to launch a flight, often into worsening
weather. The model weighs patient vitals, weather, and aircraft status into a single risk score,
trained on years of real flight data across the Alaska Tribal Health System. Published in *Frontiers
in Artificial Intelligence* (framework, April 7, 2025) and the *International Journal of Circumpolar
Health* (symposium perspectives, May 23, 2026, from a 31-person Anchorage symposium).

**Honest caveat (the one that's drawn, not just said):** this is a governance framework plus an early
research pilot, not a deployed clinical tool. No clinic runs it today. The peer-reviewed record itself
says no specific ethical guidelines yet exist for AI/ML in the Alaska Native and American Indian tribal
health systems, and only about 0.2 percent of healthcare-AI publications even mention community
involvement. Drawn as a PHYSICAL action: a hand enters frame and stops the climbing gauge needle, then
hand-drafts a dotted, dissolving guardrail line that never fully resolves, legible with the sound off,
never a passive text stamp. The story closes on the honest resolution: the score can inform the call,
but a person's hand still makes it, pressing a physical launch switch, not tapping a UI cursor.

## Style mode + taste dials
STYLE MODE: **cinematic-doc** (filmic, atmospheric, human stakes), with a clean blueprint-technical
register for the instrument/ledger shots.

- DESIGN_VARIANCE 7 — the fullbleed-split ledger shot and the rising-row-of-hands shot are genuinely
  asymmetric departures from the console/map shots.
- MOTION_INTENSITY 4 — deliberate and restrained; this is a quiet decision, not a race or a countdown
  (lower than both of the last two dispatches).
- VISUAL_DENSITY 5 — the console shot carries real data density, but the map and circle shots breathe.
- COLOR_BOLDNESS 6 — a muted arctic-storm base punctuated by one bold marigold-orange risk needle.
- TEXTURE_GRAIN 4 — cleaner and more clinical than the last two dispatches' filmic ocean/ember grain.
- GRADE_STRENGTH 5 — a measured cinematic grade, not a heavy stylized push.

References: Stripe/Linear-style clean instrument-panel product design (calm, confident data surfaces,
no glossy sci-fi HUD glow); Ken Burns-style restrained documentary pacing (measured holds, no forced
excitement, respecting the human stakes).

## Palette
Overcast gunmetal-grey sky over pale birch-white snow, a warm marigold-orange risk needle, a cool
glacier-blue console glow, and one flat charcoal void for the still-unwritten rule.

## Composition fingerprint (7 axes)
| axis | value |
|---|---|
| pov | instrument-screen |
| motion_vector | assemble-build |
| hero_treatment | data-as-subject |
| layout | hud-instrument-frame |
| register | blueprint-technical |
| palette | gunmetal-grey / birch-white / marigold-orange / glacier-blue / charcoal void |
| metaphor | the model can score the risk before the plane leaves the ground. The rulebook for who owns the data hasn't been written yet, and a person, not the model, still makes the call |

**Divergence from the last 2 dispatches:** differs on 6/7 axes from both 07-03 (the orbital field-HUD
wildfire-drone countdown) and 07-05 (the cross-section ocean depth-model descent). Spatial signature
(instrument-screen, hud-instrument-frame, assemble-build) is unique versus the last 4 dispatches.
Palette shares no more than one token with either of the last 2 (verified via `storyboard_check.py`).

**Revised after Gate 0B:** the original "who decides" shot staged the community as an orbital-aerial
ring of converging light points, which a muted viewer would read as a relabeled copy of 07-03's entire
composition identity (orbital-aerial + radial-emanate + multiplicity-swarm, the wildfire-drone swarm).
It is now an eye-level, grid-modular, vertical-rise row of hands placing named plates, sharing at most
one axis with any prior dispatch's full fingerprint. The governance turn was also re-staged as a
physical hand action (stopping the gauge, hand-drawing the guardrail line, pressing a launch switch)
instead of a passive text stamp, so it reads muted without relying on on-screen labels.

## Shot list (6 shots, ~60s)
1. **0.0-6.8s** — wide-establish, top-down-map / map-territory / push-in-only / landscape-as-subject.
   COLD OPEN: a single marigold pin already pulsing alone in black void at frame 1, weather closing in,
   before the rest of the roadless map fades up around it.
2. **6.8-17.0s** — push-detail, eye-level-immersive / centered-hero-lowerthird / horizontal-traverse /
   single-organic-hero. Map-travel into a clinic interior (with a brief plane-silhouette cue for "by
   air"): a health aide keys a radio as snow thickens outside. Transition in: **map-travel** (thread: travel).
3. **17.0-31.0s** — data-panel, instrument-screen / hud-instrument-frame / assemble-build /
   data-as-subject. Radio static boots into an instrument panel; VITALS / WEATHER / AIRCRAFT channels
   converge into one climbing risk gauge. Transition in: **fui-boot** (thread: build).
4. **31.0-41.5s** — two-up, macro-closeup / fullbleed-split / push-in-only / structure-as-subject.
   Match-cut: a hand enters frame and physically stops the gauge's climbing needle, then hand-draws a
   dotted guardrail line across a nearly blank ledger page that never fully resolves. Transition in:
   **match-cut** (thread: carry).
5. **41.5-48.5s** — subject-portrait, eye-level-immersive / grid-modular / vertical-rise /
   structure-as-subject. Graphic-match: the dissolving line becomes a rising row's baseline; hands place
   named plates (ANTHC, Southcentral, Maniilaq, community) into it one by one, then the miniature gauge
   reappears steady beside the row, visibly advisory. Transition in: **graphic-match** (thread: match).
6. **48.5-60.0s** — map-territory, top-down-map / map-territory / horizontal-traverse /
   landscape-as-subject. Whip-pan back to the map bookend: a plane icon crosses to the village pin as a
   human thumb physically presses a launch switch beside it, then the branded outro. Transition in:
   **whip-pan** (thread: travel).

## Beat map (17 beats, never-rest <=5s gaps, ~3.2-3.6s cadence)
See `storyboard.json > beats[]` for the full timed {t, vo, shows, sfx, means} objects. Summary:
1. 0.0-3.2 — COLD OPEN: a marigold pin already pulsing alone in black void at frame 1.
2. 3.2-6.8 — camera pushes toward the pin as the roadless map resolves around it.
3. 6.8-10.2 — map-travel (with a brief plane-silhouette cue): the glow becomes a clinic window's light.
4. 10.2-13.6 — a health aide's hand reaches for the radio; monitor glow on their face.
5. 13.6-17.0 — the aide keys the radio; snow thickens at the window.
6. 17.0-20.5 — fui-boot: radio static resolves into an instrument panel.
7. 20.5-24.0 — VITALS / WEATHER / AIRCRAFT channels appear in sequence.
8. 24.0-27.5 — each channel fills with a live readout.
9. 27.5-31.0 — the channels converge into one climbing risk gauge.
10. 31.0-34.5 — match-cut: a hand enters frame and physically stops the gauge's needle.
11. 34.5-38.0 — the same hand begins drawing a dotted guardrail line on the ledger page.
12. 38.0-41.5 — the line keeps dissolving at its edges, never fully resolving.
13. 41.5-45.0 — graphic-match: the line becomes a rising row; hands place named plates.
14. 45.0-48.5 — a final "community" plate locks in; the miniature gauge sits steady beside the row.
15. 48.5-52.0 — whip-pan back to the map; the plane reaches the pin as a thumb presses the launch switch.
16. 52.0-55.5 — the switch's glow resolves into the ALASKA.AI wordmark fading up.
17. 55.5-60.0 — outro: tagline, source credit, ends on motion not a static hold.

## Ending
Designed in: after the plane icon reaches the village pin and a human thumb physically presses the
launch switch, the outro stages in over the still-moving map (the plane's engine hum still audible,
tapering) — wordmark, tagline, source credit, then a gentle cinematic fade. Motion and sound both keep
running to the final frame; never a static hold.

## Cultural sensitivity note
This story concerns Alaska Native and American Indian tribal health governance. Framing throughout is
humble and centers the tribal health organizations (ANTHC, Southcentral Foundation, Maniilaq) as the
authors and decision-makers, not as subjects. No Native iconography, regalia, or unverified Native
language appears on screen; the "community" visual is generic, unidentifiable hands placing plain
organizational name plates into a row, no faces, no regalia, no invented Native imagery. The Gmail
draft and on-screen source credit will note that any further use of this story should credit and
consult the named tribal health organizations directly.
