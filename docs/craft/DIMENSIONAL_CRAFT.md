# DIMENSIONAL CRAFT — the 3D/2.5D doctrine for the ALASKA.AI Dispatch

*Added 2026-07-10 with the `dimensional.py` engine. Read alongside VIDEO_PRODUCTION_STANDARD.md
(which still governs sound, captions, accuracy, cadence) and CINEMATIC_SCENE_CRAFT.md (cuts and
transitions). Where those docs assume 2D PIL scenes, this doc supersedes the LOOK guidance.*

## The one law

**Cheap geometry + expensive light + a filmic finish reads premium. Expensive geometry + flat
light reads amateur.** Every choice below serves that law. We render simple SDF forms and spend
the budget on light, atmosphere, camera, and finish — which the engine makes nearly free.

## The stack + HONEST timings (benchmarked in the routine container, 4 CPU cores, full 1080x1920)

| Layer | Tool | Measured (full-res CPU) | Use |
|---|---|---|---|
| World render | `dimensional.py` (Taichi SDF raymarcher) | **~4.5s/frame** (a moderate scene) | every 3D shot: soft shadows, AO, fog, specular, rim, G-buffer |
| Finish | `dimensional.post()` (numpy, half-res blurs) | **~1.8s/frame** | depth DOF -> split-tone -> halation -> bloom -> ACES -> grain -> vignette -> CA |
| **Full frame** | render + post | **~6.2s/frame** | => ~55 min for an 18s demo, ~3.1h for a 60s dispatch on 4 CPU cores |
| Mesh render | bpy `BLENDER_WORKBENCH` (llvmpipe EGL) | ~2.1s/frame | when a story needs modeled geometry (matcap + cavity + shadow) |
| Hero bakes | bpy `CYCLES` CPU, 16-48spp + denoise | ~28s/frame | one-off beauty stills, composited as 2.5D layers |
| Brand | `dispatch_core` | — | wordmark, captions, HUD, outro — composited OVER the render |

> **Correction (do not repeat the mistake):** an early note claimed "~0.45s/frame". That was a
> *trivial* benchmark scene (one sphere). A real story SDF (terrain + repeated foliage + hero +
> fbm) is ~10-25x heavier per evaluation. Always quote the number for the ACTUAL scene, measured
> after a warm-up frame (the first frame includes the ~26s one-time JIT compile).

### Cost model + the levers (per-frame cost = pixels x march-steps x SDF-eval-cost)
- **SDF eval cost dominates.** The scene SDF is called ~155x/pixel (96 march + shadow + AO + 6
  normal). Cheapening it is the biggest primary lever, but it's the ONLY one that can cut visible
  quality, so guard it.
- **`SHADOW_FN` (cheap shadow SDF) — FREE.** Shadows/AO march a COARSE silhouette SDF (skip foliage
  greebles, hero detail). Pixel-identical to full-detail shadows; ~2x on shadow-heavy scenes.
  Every scene should provide one.
- **Half-res `post()` blurs — FREE.** DOF/halation/bloom are low-frequency; computing them
  downsampled then upsampling is visually identical (2.9s -> 1.8s).
- **`SHADOW_STEPS`/`MARCH_STEPS` tuning — nearly free** within reason (soft scenes tolerate fewer).
- **Render `scale` < 1.0 — NOT free** (softens on upscale). Use ONLY for look-dev iteration
  (`scale=0.4`), never for ship. Default is 1.0.
- **GPU (`DIM_ARCH=cuda|vulkan`) — the real 10x, FREE, zero code change.** The kernel drops from
  ~4.5s to ~0.1s; a GPU-configured routine env renders a full dispatch in minutes. GPU is OPT-IN
  (a failed GPU probe can hard-abort the process, and a daily render must never crash on a guess),
  so set `DIM_ARCH` in the env when a GPU is present. `dim.ARCH` reports what's active.

### Non-negotiable run rule: ONE process per render
Taichi JIT-compiles the scene kernel ONCE per process (~26s, then cached to `~/.cache/taichi`) and
internally parallelizes each frame across ALL cores. So a Dispatch renders in a SINGLE process over
the whole frame range — NOT chunked across 4 processes like the old 2D pipeline (that would pay the
26s compile 4x AND oversubscribe the cores). The engine is committed and stable; only the per-run
SCENE recompiles (correct — a different video every day). It is never "rebuilt per frame".

EEVEE does not work headless (GPU-only). Cycles is NEVER the per-frame renderer (1800 frames = 14h);
it is a baker.

## The target aesthetic

**Lit low-poly diorama with a filmic finish** (references: Ordinary Folk's restrained geometric
3D; Kurzgesagt's textured 2.5D depth; Buck's light-and-camera finish; the Apple-keynote
hero-object language: one beautiful thing, slow dolly, rack focus, dark gradient stage).

- Forms stay SIMPLE and designed (SDF primitives, smooth blends). Silhouette first.
- The BRAND look survives via palette and type, not via flatness: the same crimson/gold/spruce
  color worlds now live on lit surfaces.
- Avoid photoreal organics (fur, faces, fluid sims). Stylized-geometric always.

## The ten levers (ranked by perceived-value per unit cost)

1. **Filmic finish on every frame** — the fixed `post()` chain, correct order: DOF -> split-tone
   (warm highs / cool lows) -> halation -> bloom -> ACES tonemap -> luma grain -> vignette -> CA.
   Never ship a raw render.
2. **Three-point light with a mandatory rim** — key sun + cool sky fill + rim (`RIM_STR`); the rim
   fades with distance (`exp(-0.09t)`) so it sculpts subjects, never washes landscapes.
3. **Depth cues everywhere** — exponential distance fog toward a story-fit fog color, atmospheric
   perspective on receding forms (build 2-3 recession planes into every scene), depth-buffer DOF.
4. **Camera language** — slow eased dolly (`dim.dolly`), orbit (`dim.orbit`), RACK FOCUS between
   story subjects (animate `cam.focus`), and handheld micro-drift (`dim.drift`) on every shot. A
   locked camera reads as template.
5. **Specular life** — the Blinn term makes water glint and heroes feel material. Give every scene
   one surface that catches the sun.
6. **Soft shadows + AO** — free in the raymarcher; they are why forms feel grounded. Contact
   matters: heroes must sit IN the world (shadow pooling beneath).
7. **A warm/cool axis** — dawn/dusk sun angles (low elevation) create the two-tone modeling that
   noon light cannot. Choose the sun's story: shooting into it (backlit fog) reads epic.
8. **Materials by proximity, not bands** — color a form by recomputing ITS SDF in `MAT_FN`
   (`if d_form < eps`), never by coordinate boxes; bands leak onto neighbors.
9. **Micro-motion** — water ripple phase, hero bob, run drift: every surface breathing at
   different frequencies. (EVENT_CADENCE still gated downstream.)
10. **The 2.5D bridge** — Cycles-baked hero stills or 2D art can ride as parallax planes inside
    the 3D world when full modeling is not worth it.

## Scene authorship rules (hard-won, from the demo's look-dev)

- **Sign discipline on SDF terrain**: `d = p.y + K(x,z)` puts the surface at `y = -K`. To DIG,
  INCREASE K. (The demo shipped a berm instead of a river until this was fixed.)
- **Domain repetition needs per-cell parameters**: any per-instance variation (offset, size) must
  key off the ROUNDED cell index, never the continuous coordinate — else instances shear into
  ribbons.
- **Exhausted rays are hits**: the engine shades step-exhaustion as a hit; without that, glancing
  terrain bleeds sky (the pale-wash bug).
- **Look-dev on 3 probe frames** (early/mid/late in the shot) before any full render; iterate at
  probe cost (~2s), not render cost.
- Per-frame cost scales with MARCH_STEPS x pixels: half-res proxy (`dim.init(540, 960)`) for
  iteration, full-res for ship.

## How a Dispatch uses this

Phase 4.5 storyboards declare which shots are DIMENSIONAL (most should be, going forward) with
the same composition-axis fingerprints. Phase 5 authors one scene file per world
(`_scene`/`_mat` hooks + a `cam_at(f)` move), renders through `dimensional.render_frame + post`,
then composites `dispatch_core` captions/brand per shot exactly as before. All existing gates
(quality_gate, SCENE_STRUCTURE, READABILITY textlog, SFX) apply unchanged — the textlog pass runs
in the caption composite step.
