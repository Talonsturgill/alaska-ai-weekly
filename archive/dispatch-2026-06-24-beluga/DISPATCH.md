# ALASKA.AI Dispatch — "What The Water Says"

Cook Inlet beluga acoustic AI. Produced 2026-06-24. 1080x1080, ~30s, narrated.

## Concept
- **Angle.** Cook Inlet has its own resident, endangered beluga population (~331, 2022 NOAA
  survey). A NOAA + Microsoft AI-for-Good team trained a convolutional-neural-net ensemble to
  pick a beluga's call out of a noisy inlet, turning thousands of hours of hydrophone audio into
  something a few scientists can actually use.
- **Honest caveat.** The microphone hears them. It can't count them, and it can't make the water
  quiet. The population number still comes from an aerial survey and human eyes.
- **Visual.** "Sound made visible." One beluga as the calm hero in deep Cook Inlet blue under a
  surface aurora, a lone hydrophone mooring, and a spectrogram card where the model snaps a gold
  detection box onto one call pulled out of the violet ship-noise roar. No fish tallies — acoustic,
  quiet, singular. Distinct from prior Dispatches (salmon counting, microgrids, BVLOS drones,
  XPRIZE wildfire, volcano monitoring).

## VO script (en-US-AvaMultilingualNeural, rate -3%, total speech 27.76s)
1. Cook Inlet has its own belugas. About three hundred and thirty are left.
2. You can't watch a whale you can't see. So scientists filled the inlet with microphones.
3. Then an A.I. learned to pull one beluga's call from a passing ship's roar.
4. It hears them. It can't count them, and it can't make the water quiet.
5. The counting still needs a plane and patient eyes. The sound just says, they're still here.

Beat frames (30fps): [15, 174, 361, 508, 657].

## Credits (for the comments)
- **Voice.** edge-tts, Microsoft Azure Neural TTS voice "Ava" (en-US-AvaMultilingualNeural),
  warm female, rate -3%.
- **Music.** "Echoes" by **Andrew Ev**, via Mixkit (Mixkit Free License). 30s window from 0:55.6
  (the developed body of the track), bed normalized to -22 LUFS and sidechain-ducked under the voice.

## Sources (load-bearing claims)
- Population ~331 (median; range 290-386), 2022 survey; trend ~+0.2%/yr 2012-2022; ESA-listed
  endangered 2008 — NOAA Fisheries:
  https://www.fisheries.noaa.gov/feature-story/new-abundance-estimate-endangered-cook-inlet-beluga-whales
- AI mechanism, 15 moorings, "more than 96 percent accuracy," 10-15 days -> overnight, builders
  (NOAA AFSC Marine Mammal Lab + Microsoft AI for Good + UW JISAO) — NOAA Fisheries:
  https://www.fisheries.noaa.gov/feature-story/using-artificial-intelligence-identify-endangered-beluga-whales
- Precision 96.57% / recall 92.26% at 0.5 threshold, ensembled CNN — Zhong, Castellote, Dodhia,
  Lavista Ferres, Keogh, Brewer, J. Acoust. Soc. Am. 147(3):1834 (2020):
  https://pubmed.ncbi.nlm.nih.gov/32237822/
- Tuxedni Bay first documented winter foraging ground, 127 days, passive acoustics — NOAA Fisheries
  (Jul 15 2024): https://www.fisheries.noaa.gov/feature-story/first-winter-foraging-ground-endangered-cook-inlet-beluga-whales-identified
  and Frontiers in Marine Science: https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2024.1393380/full
- 2026 context: adaptive acoustic monitoring upgrade (Marine Mammal Science, 2026); ship-noise
  masks mother-calf "combined calls" (UW, Behavioral Ecology & Sociobiology, May 2026); NOAA GAIA
  satellite+AI program page updated Apr 30 2026.

## Fact-check
- "~330 left" — VERIFIED, NOAA 2022 median 331 (range 290-386). Framed as "the last good count"
  because the June 2025 survey result is not yet released.
- "they don't leave the inlet" — VERIFIED, resident, geographically isolated DPS (NOAA).
- "NOAA and Microsoft's AI for Good" trained a neural network to classify calls vs noise — VERIFIED
  (NOAA feature; JASA 2020). UW JISAO/CICOES also co-developed.
- "better than ninety six percent accuracy" — VERIFIED, NOAA "more than 96 percent"; JASA 96.57%
  precision.
- "months of recordings into a night's work" — VERIFIED, NOAA: a single mooring's 6-8 months took
  10-15 days to classify by hand, "done overnight" with ML.
- "winter feeding ground in Tuxedni Bay nobody had documented" — VERIFIED, first documented winter
  foraging ground, 127 days (NOAA Jul 2024 / Frontiers 2024).
- **On-screen numbers are illustrative, not live telemetry.** The spectrogram, the detection box,
  and the "0.97 / 0.71" confidence readouts are an illustration of how the classifier works, not a
  real feed. The only real figure shown is "≈ 330" (the NOAA survey estimate). The act-4 "?" on the
  number is a deliberate honesty cue (acoustics give presence, not a head count).

## Writing-rule self-check
- No em or en dashes, no semicolons, no curly quotes, no colons in body copy. PASS.
- Contractions throughout; "can't" never "cannot." PASS.
- Sentence length varied; <= 3 commas per sentence; no comma-set appositives. PASS.
- Banned words (delve, leverage, navigate, underscore, pivotal) absent; no "genuinely/honestly/
  actually" as filler. Brand banned phrases absent. PASS.
- No hashtags; ends on a real engagement question. PASS.
- VO numbers/acronyms phonetic ("three hundred and thirty", "A.I."). PASS.
- Trimmed >5% after drafting (VO cut from ~103 to 73 words; post ~290 to ~255). PASS.

## Voice licensing note
edge-tts (Azure Neural "Ava") is a gray area for commercial publishing and is fine for drafts. For
publish I can re-cut the narration in Kokoro af_heart (Apache-2.0), which shifts segment durations
and needs a re-sync of the beat frames and a re-render.

## What's fresh this round
First acoustic/sound-led Dispatch — the whole piece is about listening, not counting or watching.
New hero illustration (a hand-coded beluga), a new mechanism on screen (a live spectrogram with a
detection box), and the most local subject yet (Cook Inlet, off Anchorage). The honest limit is the
sharpest one we've run: a machine that can hear an endangered animal but can't tell you how many are
left.

## Build
- `render.py` — PIL/numpy illustration renderer (900 frames). `audio_build.py` — edge-tts VO
  assembly. `audio_mux.py` — music-window pick + stem normalize + sidechain duck + mux, with a
  built-in SOUND-CHECK gate. Music: Mixkit "Echoes" (Andrew Ev).
- **Sound-check gate (added after first pass shipped silent music).** The mux script measures the
  finished file and fails unless the music-only tail (27.95-29.5s, after the VO ends) is clearly
  audible. v1 measured the tail at -69 dB RMS (the bed had a long fade-out over the only voice-free
  stretch, and the level was buried). v2 ships at: integrated -14.9 LUFS, true peak -1.4 dBTP,
  music-only tail -22.8 dB RMS, bed ~8-9 dB under the voice during narration (voice dominant). This
  check is now a permanent step for the routine.
