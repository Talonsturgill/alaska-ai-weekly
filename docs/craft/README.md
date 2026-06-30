# Cinematic Scene Craft — the Director's Brain for the Dispatch

## Why this exists
The Dispatch (60s, 9:16, hand-coded, narrated ALASKA.AI films) reached "multi-shot," but the
maintainer caught the flaw: the "scene changes" were just the camera **zooming/panning over ONE
rendered display**. That is reframing, not scene-breaking. The SCENE_STRUCTURE gate even *passed* it —
proof the gate rewards a luma spike, not a genuine change of world.

A real cut drops the viewer into a **different world** — a different screen, space, or visual register —
and a real transition **carries them there** with momentum and meaning. The viewer should be taken on a
journey. That is the bar this brain exists to clear.

## What this is
A durable **creativity brain**: documentation distilled from how the great directors, editors,
cinematographers, and documentarians actually build scenes and move between them. The routine's
planning/storyboard step draws from this brain to design genuinely distinct shots and meaningful
transitions — **organically**, as a palette of principles, not a checklist to satisfy.

## Goal
Make the Dispatch's scene structure **10x better**: real scene breaks, transitions that mean something,
a 60-second journey — not camera moves on a static canvas.

## The medium (read before translating any technique)
- 60s, vertical **9:16 (1080×1920 @30fps)**, narrated; documentary/editorial register, often
  instrument/HUD/data-viz.
- **100% hand-coded in Python (PIL/numpy/scipy).** Every pixel drawn in code. No AI imagery, no
  live-action footage, no stock. "Scenes" = rendered compositions (illustration, diagram, UI, data-viz,
  stylized environments).
- So film technique must be **translated into code-drawn motion graphics**, not assumed camera/actors.

## Research facets (`docs/craft/research/`)
1. **Cut grammar & the rhythm of editing** — the cut as the atom (Murch, Soviet montage, cut types, pace).
2. **Scene-break & world-transition techniques** — moving the viewer between worlds (graphic match, whip,
   match-on-action, dissolve, sound bridge, object wipe). ← *the core fix.*
3. **Shot grammar & sequence construction** — a sequence of genuinely different shots (sizes, angle,
   blocking, composition).
4. **Motivated camera movement** — movement that carries story (the cure for zoom-for-its-own-sake).
5. **Documentary & essayistic craft** — non-fiction journeys (Burns, Morris, Curtis, Kapadia, editorial
   motion graphics).
6. **Title design & data/HUD motion-graphics transitions** — the Dispatch's native register (Bass,
   Cooper, FUI, explainer motion).

## Synthesis target
`docs/craft/CINEMATIC_SCENE_CRAFT.md` — the operative brain: principles + a transition/scene-break
library + the journey-arc model + concrete hand-coded implementation patterns + the
anti-"fake-scene-change" rule.

## How the routine will use it
- The storyboard/planning step (Gate 0) **consults the brain** and must specify, per shot, a genuinely
  distinct composition **and** a motivated transition into it.
- The gate is **tightened** so a "scene change" must be a real compositional change (a different rendered
  scene), not a camera crop.
- `prompts/routine_instructions.md` + `docs/ROUTINE_SPEC.md` fold this in.
- It stays **organic**: principles to draw from, not a formula to obey.

## Status
Research in progress (6 parallel researchers). Dossiers land in `research/`, then synthesize → the brain.
