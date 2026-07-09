# ALASKA.AI Dispatch — 2026-07-09

## The Machine That Listens to a Volcano

**Story.** VOISS-Net (VOlcano Infrasound and Seismic Spectrogram Neural Network), a deep-learning
CNN built by the Alaska Volcano Observatory / UAF Geophysical Institute with USGS co-authors
(Fee, Tan et al., *Volcanica*, June 2025), reads a volcano's seismic and infrasound spectrograms to
detect and classify tremor, explosions, quakes and noise. It reached about 87% accuracy on its test
set and was trained on over 270,000 spectrograms from 7 volcanoes (Pavlof, Semisopochnoi, Tanaga,
Takawangha, Redoubt, Etna, Kilauea).

**Live hook (in-window).** Great Sitkin Volcano is erupting now, held at Alert Level WATCH /
Aviation Color Code ORANGE with slow lava effusion continuing in the summit crater, per the AVO
update dated July 8, 2026.

**Honest caveat (the one real limit, drawn three ways).** VOISS-Net is a detector and classifier,
not a predictor. It can name the sound the mountain is making, but it cannot tell you the hour it
will erupt; it can be fooled by signals outside its training scope; and a human duty scientist
stays on watch.

## Composition (Gate 0 green)

- **7-axis fingerprint:** pov = eye-level-immersive · motion = vertical-rise · hero = landscape-as-subject ·
  layout = single-object-void · register = instrument-readout · palette = basalt-black night, ash-plume
  umber, molten ember and magma-red, a sulphur-gold warning band, and a cold infrasound teal trace ·
  metaphor = a machine that HEARS a volcano.
- **Divergence:** 7/7 axes differ vs 2026-07-06 (launchcall); 6/7 differ vs 2026-07-08 (count-from-a-dot).
  New spatial signature (eye-level-immersive / single-object-void / vertical-rise).
- **7 shots, motivated transitions:** wide-establish (the venting cone + the Aleutian chain) →
  alt-vantage cross-section (seismic down through rock, infrasound up through air) → macro-closeup
  (the sound becomes a spectrogram) → data-panel (VOISS-Net boots and classifies, 270,000+ / 7 / 87%) →
  two-up (name the sound vs foresee the hour, dissolving to a "?") → push-detail (a signal outside
  training slips, a person keeps watch) → map-territory (the Aleutian arc, more of Alaska listening) + outro.

## Production

- **Voice:** edge_tts en-US-AndrewMultilingualNeural (deep, authoritative; the intended Kokoro am_fenrir
  publish voice could not be installed in this environment — see infra note below).
- **Music:** "Ossuary 6 - Air" by Kevin MacLeod (incompetech.com), licensed CC BY 4.0 (free for
  commercial use, attribution given). Freshly sourced for this Dispatch.
- **Palette / mood:** a dark volcanic night lit only by ember, ash and the cold teal of a listening machine.

## Sources (every load-bearing claim)

- VOISS-Net paper — *Volcanica* v8(1) 2025, Fee & Tan et al.: https://www.jvolcanica.org/ojs/index.php/volcanica/article/view/349
- USGS Publications Warehouse (87%, 270,000+, 7 volcanoes, event classes): https://pubs.usgs.gov/publication/70268974
- USGS / AVO Volcano Updates (Great Sitkin WATCH/ORANGE, July 8 2026): https://www.usgs.gov/programs/VHP/volcano-updates
- AVO Great Sitkin monitoring page: https://avo.alaska.edu/volcano/great-sitkin

## Accuracy note

On-screen numbers are verified against the primary sources above: 87% ACCURACY, 270,000+ SPECTROGRAMS,
7 VOLCANOES, WATCH · ORANGE. Great Sitkin's ongoing eruption is the live in-window hook; VOISS-Net
(June 2025) is presented as an existing capability, not a brand-new development.

## Infrastructure note

Kokoro (the Apache-2.0 publish voice) failed to build in this run's cloud environment (a `docopt`
wheel build error), so the VO was cut in edge-tts (en-US-AndrewMultilingualNeural) via the agent
proxy. This is an environment limitation, not a quality shortfall; the mix still passed the audio gate.
