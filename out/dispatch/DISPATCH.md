# Dispatch 2026-07-08 — "The Count from a Dot"

**Story:** OWL (Overhead Wildlife Locator), a weakly-supervised deep-learning model from Microsoft's
AI for Good Lab, counts caribou in aerial survey imagery by learning each animal from a single point
label instead of an expensive bounding box. Validated on the Alaska Department of Fish and Game's
2022 Central Arctic Herd census.

**Primary source (fact-checked):** arXiv:2606.13911 (June 11, 2026), "Overhead Wildlife Locator (OWL):
Benchmarking Weakly Supervised Learning for Aerial Wildlife Surveys." Corroboration: github.com/microsoft/MegaDetector-Overhead.

## Verified load-bearing facts (on-screen + VO)
- Point labels are up to **7x faster and 3x cheaper** to produce than bounding boxes.
- On ADF&G's **2022 Central Arctic** census, OWL-C attained **F1 = 0.965** with a **+3.1%** signed count error.
- OWL-D beat HerdNet on Delplanque (0.934 vs 0.840 AP).
- Honest caveat (drawn, not captioned): **performance is regime-dependent** — the count slips where
  animals crowd together, and the heaviest foundation-model variant (OWL-D) degrades on the densest herds.
- It counts what the camera sees; it cannot fly the plane or find the herd.
- Attribution: Microsoft AI for Good Lab-led; the ADF&G co-author is Nathan J. Pamperin, and it uses
  ADF&G's 2022 census data (not a broader Microsoft/ADF&G co-development).
- Framing: the Central Arctic and Porcupine herds are subsistence and management cornerstones;
  surveyors are not being replaced.

## Composition (Gate 0 passed)
- **7-axis fingerprint:** pov=top-down-map · motion=horizontal-traverse · hero=multiplicity-swarm ·
  layout=map-territory · register=naturalistic-scene · palette=autumn-tundra + phosphor-mint ·
  metaphor=count a living herd from a lone dot, honest about the crush where certainty thins.
- **Divergence:** 7/7 axes differ from both the 07-05 depth-model and the 07-06 launch-call.
- **7 shots** across 7 distinct worlds: overhead herd (hook: spinning uncountable tally) → ground-level
  biologist light table + point marker → macro box-collapses-to-a-dot → top-down count sweep (F1 0.965,
  7x/3x, +3.1%) → the dense crush where the overlay dissolves to a "?" → the survey camera's viewfinder
  (tags only what is in the reticle) → the map settles, count home sooner, ALASKA.AI outro.
- Gate 0A objective PASS; storyboard-critic ship (8/8/8/8/8); flow-critic (PRE) flows:true.

## Production
- **Voice:** kokoro:af_heart (Apache-2.0, publish-safe). ~50.6s narration on a 60s timeline.
- **Music:** "Reawakening" by Kevin MacLeod (incompetech.com), CC BY 4.0.
- **Masters:** 9:16 1080x1920 (TikTok) + 4:5 1080x1350 (LinkedIn), H.264 High, -14 LUFS.
- **Numbers on screen are the fact-checked figures; the live tally is illustrative and resolves to a
  non-numeric "COUNTED" state (no fabricated herd total shown).**
