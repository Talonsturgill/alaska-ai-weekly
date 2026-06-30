# Scene-Craft Proof — four worlds, real transitions

A 14-second, 9:16 proof that the Director's Brain (`../CINEMATIC_SCENE_CRAFT.md`) works in our hand-coded
medium: a Dispatch can **CUT between genuinely different rendered WORLDS** — not zoom one canvas — carried
by real transitions. This is the direct answer to the v2 critique ("the scene changes were just the camera
zooming/panning over one sonar display").

## What it proves
**Four distinct compositions**, each authored as its OWN render (not a crop of one master):

| # | world | pov / layout / hero |
|---|---|---|
| 1 | river map | top-down-map / map-territory / landscape |
| 2 | run-curve data panel | instrument-screen / grid-modular / data-as-subject |
| 3 | aurora mountain ridge | orbital-aerial / stacked-layers / landscape |
| 4 | ALASKA.AI wordmark | eye-level / single-object-void / brand |

- **CARRIED ELEMENT** (`dc.carry_token` + `dc.lerp`): one vermilion token survives all three cuts —
  it leaves the river node, flies to become the run-curve's peak value, then rides the cut onto the
  mountain summit. One object threads four worlds together.
- **GRAPHIC MATCH**: the run-curve's shape *is* the mountain ridge's top edge (both drawn from the shared
  `RY` path); a hard cut on that shared geometry makes the data "become" the land.

## Gate results (the new system accepts a real multi-world piece)
- **Gate 0** (`scripts/storyboard_check.py` on `proof_storyboard.json`): **PASS** — "4 shots across 4
  distinct compositions (each cut moves to a different world, not a zoom)"; diverges from the last two
  dispatches on 5/7 and 6/7 axes; fresh palette (moss-green + bone-white on graphite, one vermilion signal).
- **Real cuts** (downsampled per-frame luma delta, the SCENE_STRUCTURE method): within-shot baseline
  **0.34**; cut @120 = **10.6**, @250 = **22.9**, @350 = **21.6** — all REAL (floor 5.0). The inverse of
  the v2 sonar, where within-shot motion was high and the "cuts" barely rose above it.

## Files
- `code/proof_scenes.py` — the four scene renderers + the carried-element and graphic-match logic, built
  on `dispatch_core` (imports the shared craft; nothing copied).
- `proof_storyboard.json` — the board (per-shot compositions + transition threads) that passed Gate 0.
- `contact.png` — 15-thumb contact sheet: the four worlds at a glance.
- `stills/` — river map · carry in-flight · run-curve peak · graphic-match ridge · wordmark.

Engine helpers exercised: `dc.carry_token`, `dc.lerp` (CARRY). Also added to the engine this round:
`dc.iris_wipe`, `dc.assemble_alpha`, `dc.dissolve`. A graphic match needs no helper — it's a hard cut
between two scenes rendered to share screen geometry.

**This is a technique proof, not a published dispatch.** It validates the grammar and the new helpers; the
full 60-second production (a real Alaska + AI story told this way, with VO/captions/music) is the next step.
