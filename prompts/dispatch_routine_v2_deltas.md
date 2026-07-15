# Dispatch routine prompt — v2 deltas (2.5D pivot, 2026-07-15)

The dispatch routine's master prompt lives in the routine UI at claude.ai/code/routines and
still says "dimensional-first" (the 3D raymarcher). After the 2026-07-14 post-mortem (wrong-accent
voice, desynced captions, scenery-not-story, 2-5h renders), the repo has pivoted to a 2.5D
infographic engine. PASTE THE REPLACEMENTS BELOW into the routine prompt. Repo-side doctrine:
docs/craft/INFOGRAPHIC_2_5D.md (supersedes DIMENSIONAL_CRAFT.md).

---

## 1. Replace the "YOUR CRAFT IS DIMENSIONAL CINEMATOGRAPHY" bullet in PHASE 4 with:

- YOUR CRAFT IS 2.5D INFOGRAPHIC STORYTELLING (The Infographics Show register; doctrine in
  docs/craft/INFOGRAPHIC_2_5D.md, craft bar exemplar: video-engine/src/IGSHook.tsx). The core
  intelligence step is the VISUAL SENTENCE PASS: go through the VO line by line and answer,
  for EVERY sentence, "what literal cartoon do we draw while this is said?" — a SUBJECT (who/
  what, usually a character or characterized object with a FACE and an emotion), an ACTION
  (a verb you can see happening), and an ANNOTATION (the number/label/arrow that lands with
  it). Write these into the storyboard as beats[].draw = {subject, action, emotion,
  annotation}. A beat whose draw you cannot phrase as "X does Y" is not a beat, it is a slide.
- THE STYLE GRAMMAR IS LAW (from studying real IGS frames): thick ink outlines on every shape;
  multi-tone shading (base fill + shade region + highlight blob); character faces with real
  expressions anchoring most scenes; detail density (interiors drawn: teeth, vents, LEDs,
  mountains, tree rows — 20+ shapes per hero object); fat outlined arrows; shouty boxed
  labels; starburst stat badges; saturated palettes on radial-burst backgrounds. No decorative
  scenery, no mood backgrounds, no 3D worlds, no flat single-tone fills.
- Scenes are reusable React components in video-engine/src/; the story data (headline, numbers,
  labels, palette) is injected per-run via --props. Every run GROWS the component library
  (character rigs, arrows, badges, maps, meters) — quality compounds; never rebuild what the
  library already does well; DO author 1-2 new bespoke hero illustrations per run where the
  story needs them.

## 2. Replace the PHASE 5 render instructions with:

PHASE 5: BUILD (Remotion, 9:16 1080x1920 @30fps)
Author this run's scenes in video-engine/src/ to the storyboard's beats[].draw (compose from
the existing component library first; author new bespoke hero illustrations where the story
needs them — to the IGSHook.tsx craft bar, never below it). Per-run data goes in a props JSON,
never hard-coded. Render: `npx remotion render Dispatch <out>` (headless-shell config is baked
into remotion.config.ts). A 60s render takes MINUTES, so the TASTE LOOP is mandatory and cheap:
render every scene, EXTRACT FRAMES AND LOOK AT THEM, and iterate each scene until it passes
the five-question check — (1) is there a character/face or characterized object? (2) can you
name the visible action verb? (3) is every shape outlined and shaded, zero flat single-tone
fills? (4) does the spoken number/name appear drawn on screen? (5) would this frame hold up
next to a real Infographics Show frame? Three to five iterations per scene is normal and takes
minutes. A scene that fails question 5 does not ship. VOICE: synthesize ONLY through
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

## 6. Add to PHASE 4, immediately after the story is picked (the DIRECTORS ROOM):

Before writing the storyboard, convene the WRITERS-ROOM PANEL (no-spawn agents, one pitch
each): THE COMEDIAN (sight gags, personified objects, ironic cutaways), THE DRAMATIST
(conflict, stakes, the antagonist force, the turn, the button), THE EXPLAINER (where numbers
land hardest; comparisons that make scale FELT). A scorer judge picks the winning treatment
and grafts the best beats of the others. Only then write beats[].draw. Full doctrine:
docs/craft/DIRECTORS_ROOM.md. Cast continuity: reuse the Character rig cast across scenes
(video-engine/src/lib/Character.tsx); every scene gets a slow push; use the dramatic
snap-zoom-on-a-face (Standoff.tsx exemplar) at the emotional peak, once or twice per episode.
The showstopper test leads the taste loop: would a stranger stop scrolling on this frame?
