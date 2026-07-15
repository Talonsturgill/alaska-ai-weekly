# Dispatch routine prompt — v2 deltas (2.5D pivot, 2026-07-15)

The dispatch routine's master prompt lives in the routine UI at claude.ai/code/routines and
still says "dimensional-first" (the 3D raymarcher). After the 2026-07-14 post-mortem (wrong-accent
voice, desynced captions, scenery-not-story, 2-5h renders), the repo has pivoted to a 2.5D
infographic engine. PASTE THE REPLACEMENTS BELOW into the routine prompt. Repo-side doctrine:
docs/craft/INFOGRAPHIC_2_5D.md (supersedes DIMENSIONAL_CRAFT.md).

---

## 1. Replace the "YOUR CRAFT IS DIMENSIONAL CINEMATOGRAPHY" bullet in PHASE 4 with:

- YOUR CRAFT IS 2.5D INFOGRAPHIC STORYTELLING (The Infographics Show register). Build every
  scene in the Remotion engine (video-engine/, doctrine in docs/craft/INFOGRAPHIC_2_5D.md):
  flat, bold, story-first compositions where EVERY on-screen element is a story element — a
  map with a pinned location, a counter landing on a real number, a bar overtaking a baseline,
  a labeled diagram, a character silhouette. No decorative scenery, no mood backgrounds, no 3D
  worlds. The 2.5D feel comes from parallax layers and eased pops on flat art. Scenes are
  reusable React components; the story (beats, numbers, labels, palette) is per-run data
  injected via --props. Grow the component library run over run — that is how daily cadence
  gets cheap.

## 2. Replace the PHASE 5 render instructions with:

PHASE 5: BUILD (Remotion, 9:16 1080x1920 @30fps)
Author this run's scenes in video-engine/src/ to the storyboard (compose from the existing
component library first; add new components only when the story needs them). Per-run data goes
in a props JSON, never hard-coded. Render: `npx remotion render Dispatch <out>` (headless-shell
config is baked into remotion.config.ts). A 60s render takes MINUTES — render often, look at
frames early and iterate; there is no 3-hour render to protect. VOICE: synthesize ONLY through
.claude/skills/alaska-dispatch/vo_qc.py (full-sentence chunks; N candidates per line; whisper
transcript validation; speaker-similarity scoring against assets/voice/talon_ref_cond.wav; the
per-line similarity report goes in the Gmail draft). cfg_weight stays 0.5. NEVER time-stretch
audio (atempo is banned) — if the read runs long, trim the SCRIPT and re-synth. CAPTIONS: after
the final VO is mixed, run scripts/align_captions.py (faster-whisper forced alignment on the
FINAL audio) and drive all caption cues from its words JSON. Approximated, scaled, or hand-
shifted caption timings are banned.

## 3. In PHASE 6 (gates), replace the three 3D hygiene checks with:

- STORY_DENSITY: every beat introduces a nameable story element (an icon/number/map/chart
  event), verified against the storyboard beat list.
- SAY_IT_SHOW_IT lag: each spoken number/name appears on screen within ~0.5s of the word
  (measured against the forced-alignment words JSON).
- CAPTION_ALIGNMENT: median |caption cue - aligned word| < 150ms.

## 4. In the guardrails, replace guardrail 3 (background render / Taichi kernel) with:

3. Renders are minutes, not hours — render early and often; review frames after every scene
   change. The voice QC loop (vo_qc.py) is mandatory for every narrated line; a line that fails
   its similarity floor is re-rolled, never shipped.

## 5. Delete from the tooling list: dimensional.py, DIMENSIONAL_CRAFT.md, demo_dimensional.py
   references (the files stay in the repo for history but are retired). Add: video-engine/
   (Remotion), vo_qc.py, scripts/align_captions.py, docs/craft/INFOGRAPHIC_2_5D.md.
