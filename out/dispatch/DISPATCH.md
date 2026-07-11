# Dispatch 2026-07-11 — "The Lid"

**Story.** A UAF Geophysical Institute team (Jingqiu Mao + doctoral student Zhiwei Dong) trained a
machine-learning model to bias-correct NOAA's HRRR-Smoke surface PM2.5 forecast during the Alaska
wildfire season. The physics model undercounts surface smoke by up to five times on the worst days;
a 1D convolutional neural network (best of RF / CNN1D / CNN2D) cuts the miss to about two. The root
cause is vertical: a warm temperature-inversion lid traps smoke low where people breathe while the
model paints it thin and high. Paper: ACS ES&T Air, 2026, 3(5), 1263 to 1275 (published 2026-04-17),
cross-confirmed via OpenAlex. Live hook: the 2026 fire season is active now (330+ fires, 24,633
lightning strikes in ten days, early July 2026, akfireinfo.com).

**Honest caveat (drawn, not carded).** A correction, not a cure: the machine learns the model's bias
and pulls the number toward measured air, but it cannot move the actual smoke, and a fire hidden
under cloud can still be missed. A person still decides when the air is safe to breathe.

**Concept.** "The Lid" — a 60s dimensional (3D raymarched) film in six worlds: aerial descent into a
smoke-choked Interior valley under a blood-orange sun; a cross-section splitting MODEL vs REAL
plumes with the 5x bracket and the inversion lid; ground level with a cabin in the murk; a forecast
panel where the CNN bends the under-forecast curve down (5x -> 2x); a macro cloud hiding an ember
from an empty-sweeping reticle; a rise-reveal resolution.

**Composition fingerprint.** pov=orbital-aerial · motion=vertical-descent · hero=landscape-as-subject
· layout=stacked-layers · register=naturalistic-scene · camera_strategy=aerial-descent ·
light_story=storm-dramatic · palette=wildfire-smoke ochre/sepia pall, blood-orange sun, soot-brown
spruce, bone-grey lid, one mint forecast line · metaphor=the lid traps the smoke low, the model looks
high, the machine learns to look down and still falls short.

**Gates.** Gate 0A storyboard divergence: PASS (7/9 axes vs each of last two). Early-look editor
review: ship. Audio: -14.2 LUFS integrated, 15 SFX events, sourced music. Caption: caption_check
PASS + scorer 8.66 (threshold 8.5, zero hard fails). Full quality gate + 3-judge panel run
post-render (results in the Gmail draft + commit).

**Credits.** VO: Kokoro `bf_emma` (Apache-2.0). Music: "Long Note Two", Kevin MacLeod
(incompetech.com), CC BY 4.0. Engine: dimensional.py (Taichi CPU raymarch) at 1080x1920 scale 1.0,
brand chrome via dispatch_core with readability chips + caption scrim.
