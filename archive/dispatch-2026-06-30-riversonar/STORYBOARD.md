# Storyboard — Dispatch 2026-06-30 — "River Sonar: what the machine sees"

**Concept.** We watch the Kenai through the machine's own imaging-sonar **display**. Salmon rise up an
acoustic beam as bright amber echoes, get tallied at a count line, then boxed and classified by computer
vision in real time. The honest caveat is *shown, not said*: the machine still misses, and the call of how
many fish to let pass before the nets open stays human.

**Honest caveat.** Counting is not managing. The AI counts the run; the escapement decision is still human.

**Style mode:** field-HUD / instrument. **References:** a real ARIS/DIDSON operator display; Bloomberg/Vox
editorial-data clarity for the run-curve and labels.
**Taste dials:** design 7 · motion 6 · density 7 · color 6 · grain 5 · grade 6.

## Composition fingerprint (the 7 axes — see config/composition_axes.yaml)
| axis | this Dispatch | beluga (06-24) | permafrost (06-26) |
|---|---|---|---|
| pov | **instrument-screen** | eye-level-immersive | cross-section-cutaway |
| motion_vector | **vertical-rise** | horizontal-traverse | vertical-descent |
| hero_treatment | **multiplicity-swarm** | single-organic-hero | landscape-as-subject |
| layout | **hud-instrument-frame** | centered-hero-lowerthird | fullbleed-split |
| register | **instrument-readout** | naturalistic-scene | editorial-schematic |
| palette | **amber-on-abyss + cyan UI + coral** | glacial teal-green + aurora | thermal duotone |
| metaphor | **the machine counting the run** | sound made visible | a digital twin learning ahead |

Differs from **both** prior dispatches on **7 / 7** axes. Spatial signature
`(instrument-screen, hud-instrument-frame, vertical-rise)` is unique vs the last four.

> **Why this is NOT the beluga.** The beluga was a painted, eye-level underwater world with one hero
> swimming sideways across a centered/lower-third frame. This is the opposite on every structural axis:
> we are *outside the water looking at a screen*, the subject is *a whole run of fish* (not one character),
> the motion is *vertical*, the layout *is the instrument*, and the color world is amber-on-black, not
> teal/aurora. The rejected salmon re-skin shared the beluga's exact signature; this does not.

## Beat map (15 beats; rides the 9 VO segments + outro)
1. **0.0–4.5** — Cold open on the dark display; beam fan powers up; one echo rises and trips the COUNT LINE → "1". *(power-on scanline)* — premise in one second.
2. **4.5–10.5** — Gray haze wipes; the sun-disc dims; display flips to SONAR and echoes resolve from noise. *(focus-pull murk→acoustic)* — why sound, not light.
3. **10.5–18.0** — HUD discloses: range arcs in meters, "ARIS · KENAI · since 2010", a stream of echoes rising with comet trails, time-scrub advancing. *(progressive disclosure)*
4. **18.0–21.5** — Human CROSSHAIR moves to one fish, clicks +1, moves on — slow, one at a time. "COUNTED BY HAND". *(reticle snap)*
5. **21.5–24.5** — Too many fish; uncounted echoes pile at the top; the crosshair stutters. *(backlog builds)* — the bottleneck is visible.
6. **24.5–30.5** — HARD CUT: reticle gone; detection BOXES snap onto EVERY fish at once + confidence; count races. *(cut on the downbeat; one-at-a-time→all-at-once)* — **hero moment**.
7. **30.5–36.0** — Boxes gain SPECIES labels (KING / SOCKEYE); a length caliper sweeps one fish; legend appears. *(labels type-on)* — king vs sockeye by length.
8. **36.0–39.5** — Pull back; the screen multiplies into a strip of river-screens lighting up across a faint BC-to-AK map line; "RIVERS · BC TO ALASKA · 500K+ LABELED FRAMES". *(mask into multi-screen)*
9. **39.5–42.5** — Strip collapses back to the hero screen; "TRAINED" bar completes. *(reverse-mask)* — bridge.
10. **42.5–46.0** — THE MISS: a fish passes with NO box; tally stutters; coral "~ −25%" flag blinks; one box flickers 0.94→0.71. *(coral warning)* — caveat shown.
11. **46.0–49.0** — The corner RUN-CURVE comes forward, rising toward a dashed ESCAPEMENT GOAL; the count feeds it. *(graph eases forward)*
12. **49.0–53.5** — Curve hits the goal; "HOW MANY BEFORE THE NETS OPEN?"; AI boxes DIM, a human OPEN/HOLD toggle stays lit. *(AI dims; human holds)* — **thesis**.
13. **53.5–55.5** — Outro: UI recedes; ALASKA.AI wordmark resolves. *(wordmark in)*
14. **55.5–57.5** — Tagline "what's moving in alaska ai, this week". *(staged reveal)*
15. **57.5–60.0** — Last echo drifts up and out; cinematic fade. *(fade; motion to the final frame)*

**Ending** is designed in (beats 13–15), motion runs to the last frame. **Captions** voice-synced from
`audio/words60.json`. **Music** freshly sourced + credited.

## Shot structure (the MACRO rhythm — 8 shots, a cut ~every 6–11s; see config/shot_structure.yaml)
The beats above are the *micro* rhythm (what moves); these shots are the *macro* rhythm (how it's framed).
A camera crops/zooms over the one composed display so each shot is its own framing, and a "sonar refresh"
scan-cut punctuates every change. This is what makes it a sequence, not a 60s 'oner'. SCENE_STRUCTURE
gate: **8 shots · 7 real transitions · 6 distinct framings** (`stills/contact_sheet.png` shows the cuts).

| # | t | framing | centered on | cut in |
|---|---|---|---|---|
| 1 | 0.0–9.9 | wide-establish | the display powering on | fade-up |
| 2 | 9.9–17.0 | push-detail | the COUNT LINE, a fish tripping it | push-in |
| 3 | 17.0–21.4 | alt-vantage | the operator's reticle, counting by hand | hard-cut |
| 4 | 21.4–32.4 | wide-establish | the AI boxing the whole run | hard-cut |
| 5 | 32.4–40.1 | map-territory | the river-screen network, BC→Alaska | mask-wipe |
| 6 | 40.1–46.1 | push-detail | the UNDETECTED fish; the ~23% miss | hard-cut |
| 7 | 46.1–53.9 | data-panel | the run-curve at the goal; the HOLD call | push-in |
| 8 | 53.9–60.0 | subject-portrait | the ALASKA.AI wordmark, last echo rising | crossfade |

## Silent-first check
Mute the VO and the picture still tells it: a counting screen → light fails, sound takes over → a human
tags fish one by one and falls behind → the AI boxes them all at once → it labels species → it scales to
many rivers → it visibly *misses* one → a run-curve climbs to a goal → the machine dims and a human keeps
the OPEN/HOLD decision. State evolves murk→clarity, hand→machine, confident→fallible, counted→decided.
