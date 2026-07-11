# Dispatch Storyboard — "The Lid"

**Story:** UAF Geophysical Institute (Jingqiu Mao + doctoral student Zhiwei Dong) trained a
machine-learning model to bias-correct NOAA's HRRR-Smoke surface PM2.5 wildfire-smoke forecast
for Alaska. The physics model undercounts surface smoke by up to **five times**; a 1D
convolutional neural network (best of RF / CNN1D / CNN2D) cuts that to **about two**. Root cause is
vertical: a warm temperature-inversion lid traps smoke low, and the model paints it thin and high.
Paper: ACS ES&T Air 2026, 3(5), 1263 to 1275, published April 17, 2026. Live hook: the 2026 Alaska
fire season is active now (330+ fires this week).

**Honest caveat (drawn, not carded):** a correction, not a cure. It sharpens the number but cannot
move the smoke, and it still misses a fire hidden under cloud. A person still decides when the air
is safe to breathe.

**Composition fingerprint (Gate 0A PASS, 7/9 axes diverge vs each of the last two):**
- pov: orbital-aerial · motion: vertical-descent · hero: landscape-as-subject · layout: stacked-layers
- register: naturalistic-scene · camera_strategy: aerial-descent · light_story: storm-dramatic
- palette: wildfire-smoke ochre + sepia pall, dim blood-orange sun disk, soot-brown spruce, bone-grey inversion lid, one mint forecast line
- metaphor: a warm lid traps the smoke low; the model looks high; the machine learns to look down, and still falls short

**Light:** a low, smoke-dimmed blood-orange sun barely piercing brown haze; the sick filtered light IS the story.

## Shots (6 distinct worlds)
1. **Wide-establish / aerial-descent** (0-11s): sink over a soot-brown spruce valley toward the smoke and a dim sun.
2. **Two-up / cross-section** (11-21.5s): tall thin model plume vs squat thick real plume; a 5x gap bracket; the inversion lid draws across. (match-cut)
3. **Subject-portrait / ground level** (21.5-28.5s): a cabin and a small figure in the murk, the pale model plume floating uselessly above. (focus-pull, carry)
4. **Data-panel / instrument** (28.5-40s): HRRR-Smoke feed into a CNN block; the under-forecast curve bends down; 5x collapses to ~2x. (fui-boot, build)
5. **Macro / fire-under-cloud** (40-52s): a cloud with a hidden ember glow, a reticle sweeping empty; the smoke unchanged. The honest caveat. (hard-cut, travel)
6. **Map-territory / rise-reveal outro** (52-58.5s): lift back out; the mint forecast line now hugs the real smoke; a lit cabin window; alaska.ai signoff. (pull-out, build)

16 timed beats ride the shots (see storyboard.json). Voice: TBD Kokoro (fresh vs last 2-3). Music: fresh sourced track.
