# Dispatch Storyboard — "The Count from a Dot"

**Story:** Overhead Wildlife Locator (OWL), a weakly-supervised deep-learning model from Microsoft's
AI for Good Lab, counts caribou in aerial survey imagery by learning each animal from a single point
label instead of an expensive box. Validated on Alaska Department of Fish and Game's 2022 Central
Arctic Herd census (F1 = 0.965, +3.1% signed count error). Primary source: arXiv:2606.13911 (June 11, 2026).

**The honest AI angle + the ONE caveat (drawn, not captioned):** the count is fast and cheap, but its
accuracy is *regime-dependent*. Where the animals crowd together the count starts to slip, and the
fanciest foundation-model variant (OWL-D) actually degrades on the densest herds. It counts what the
camera sees; it cannot fly the plane or find the herd.

## Style mode + taste dials
Field-naturalist illustration meets a restrained phosphor count-overlay. The tundra is the hero; the
AI is a quiet layer of mint light laid on top of a real-looking place. Dials: realism 0.7, diagram 0.5,
warmth 0.75, restraint 0.8. References: Nat-Geo aerial-census photography; aerial point-count plates.

## Composition fingerprint (7 axes) — derived_from: scratch
- **pov:** top-down-map (the survey photo POV, straight down on the tundra)
- **motion_vector:** horizontal-traverse (the survey sweep tracks across the ground)
- **hero_treatment:** multiplicity-swarm (a whole herd, a count, not one instrument)
- **layout:** map-territory (an aerial territory fills the frame)
- **register:** naturalistic-scene (a painted, textured tundra, AI as a thin overlay)
- **palette:** autumn tundra — rust-red groundcover, ochre + lichen-gold, caribou-brown herd, cool
  slate-blue shadow, one clean phosphor-mint AI count overlay
- **metaphor:** the machine learns to count a living herd from one dot per animal, and admits the
  crowded crush where its certainty thins

**Divergence:** 7/7 axes differ from both the 07-05 depth-model (cross-section water column, vertical
data scroll, editorial-schematic) and the 07-06 launch-call (instrument-screen HUD, blueprint console).
Fresh spatial signature (top-down-map · map-territory · horizontal-traverse) and a brand-new palette.

## Shot list (7 shots, a scene change every ~8-10s — journeys through distinct worlds, not one aerial substrate)
1. **0-9s · wide-establish** — tundra herd from straight overhead; a mint tally spins uncountably (the motif, hooked in the first second). *[top-down-map / map-territory / horizontal-traverse / multiplicity-swarm]*
2. **9-17s · alt-vantage** — GROUND-LEVEL: a biologist over a light table of aerial photos, a hand dropping ONE point marker on one caribou. Transition: carried-element (carry). *[eye-level-immersive / grid-modular / push-in-only / single-organic-hero]*
3. **17-27s · macro-closeup** — a box draws around the animal then collapses into one bright dot as the model's scan assembles. Transition: match-cut (match). *[macro-closeup / single-object-void / assemble-build / data-as-subject]*
4. **27-36s · data-panel** — the dot rhymes into a field of dots; mint sweep crosses the tundra grid; tally locks F1 0.965, +3.1% stamps; 7x/3x. Transition: graphic-match (match). *[top-down-map / grid-modular / horizontal-traverse / data-as-subject]*
5. **36-44s · two-up** — clean sparse count rhymes into a dense crush where the overlay dissolves to a "?" (REGIME-DEPENDENT). Transition: match-cut (match). *[orbital-aerial / fullbleed-split / vertical-descent / multiplicity-swarm]*
6. **44-52s · push-detail** — the SURVEY CAMERA's own viewfinder boots; it fires one frame and only in-reticle animals tag; a herd beyond stays dark. Transition: fui-boot (build). *[instrument-screen / hud-instrument-frame / push-in-only / structure-as-subject]*
7. **52-60s · map-territory** — the map settles, the final count carried home ("COUNT HOME SOONER"), then the ALASKA.AI wordmark outro. Transition: crossfade (carry). *[top-down-map / map-territory / push-in-only / data-as-subject]*

Adjacent shots each change >= 2 heavy axes; 7 distinct framings. Three non-aerial worlds (human light table, macro, camera viewfinder) break the top-down lean.

## Beat map (14 timed beats — see storyboard.json for {t,vo,shows,sfx,means})
Opens on the stake at 1.0s, start-to-start gaps ~3.5-4s (<= 5s never-rest ceiling), every VO sentence
illustrated, every beat names a motivated sound. The picture tells the whole story with the sound off:
scatter → dense herd → survey photos → one animal → box-to-dot → AI sweep + count → F1 0.965 →
crush where it slips → the plane that still must fly → count home sooner → outro.

## On-screen numbers (verbatim, fact-checked)
`7x FASTER` · `3x CHEAPER` · `F1 0.965` · `+3.1%` · `2022 CENTRAL ARCTIC`

## Ending (designed in)
The tundra map settles with the final count carried in; "the count comes home sooner" lands, then the
ALASKA.AI wordmark + "what's moving in alaska ai, this week" tagline rise in staged beats and the frame
fades on a slow push. Motion runs to the final frame (no static hold).
