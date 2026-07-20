# STAGE3D — the true-2.5D engine (authoring doctrine)

`video-engine/src/lib/stage3d.tsx`. Landed 2026-07-20 (UPGRADE_BACKLOG #1). This is how
Dispatch scenes get real depth. Remotion renders through Chrome, so all of this is the
browser's genuine 3D projection — one shared virtual camera, physically consistent
parallax — not per-layer drift.

## The pieces

- **`Stage3D`** — the viewport. Takes ONE `camera` ({x truck, y boom, z dolly, rotX tilt,
  rotY orbit, rotZ roll}). Every child layer projects through it.
- **`Plane z={depth}`** — a depth layer. `fill` pre-scales content (with overscan) so a
  far layer still covers the frame; without `fill`, content keeps its authored size and
  shrinks with distance. Author children as ordinary 1080x1920 SVG/HTML, exactly like the
  flat engine.
- **`Atmosphere z={depth}`** — wrap a far Plane's content: distance desaturates, loses
  contrast, and fades toward the sky color. The strongest depth cue after parallax.
- **`Extrude`** — flat silhouette -> solid form with real thickness. Side wall lit by the
  LIVE camera orbit under the fixed screen-left key (pass `camRotY`); back-slice AO.
- **`Solidify` / `Card`** — the asset adapter: ANY existing kit hero (Vale, ServerMachine,
  Moose...) gains body thickness with ZERO re-authoring. `Card` positions it in a Plane;
  `solid` stacks darkened copies behind the lit front face.
- **`CastShadow3D`** — a silhouette projected onto the ground along the key (skew +
  squash + blur), a real cast shadow.
- **`CameraMoves` + `composeCams`** — named cinematic moves (dollyThrough, orbitReveal,
  craneDown, truckAcross, riseWith). Ease progress with Remotion interpolate/Easing,
  then sum moves. The storyboard `camera_strategy` axis should name these.
- **A TRUE GROUND PLANE** — rotate a div `rotateX(~88deg)` at the ground line and the
  camera genuinely flies OVER it (see Nenana3D's RunwayFloor). SUPERSAMPLE its SVG 2x
  (render at 2x, scale(0.5)) or the perspective-stretched foreground goes soft.

## Reference scenes

- `TwentyFiveD.tsx` — minimal proof (layers + extruded hero + A/B vs `BorealFlat`).
- `Nenana3D.tsx` — the Episode-grade vertical slice: crane down through the treeline,
  fly low over a true 3D runway, rise with Vale's liftoff. Copy its structure.

## Authoring rules (learned in the taste loop)

1. 4-6 planes is plenty: sky (fill, ~2000) / far ridge (fill, ~1400, Atmosphere) / mid
   treeline (fill, ~900, Atmosphere) / near band (fill, ~500) / hero (~100-200, no fill)
   / foreground sweep elements (~30-60).
2. Camera moves make the engine: a scene with a static camera wastes it. Compose 2-3
   named moves per scene; ease everything; the orbit is what sells Solidified heroes.
3. Grade lighter than the flat engine (vignette ~0.24): the depth already separates the
   hero; a heavy vignette reads as a dark oval mid-frame.
4. Keep captions/lower-thirds OUTSIDE Stage3D (screen-space chrome, not world objects).
5. Heroes stay authored in the flat kit — the adapter does the depth. Do not fork heroes
   into 3D variants; the library must stay single-source.

## Migration status

Vertical slice proven. NEXT: rebuild the 6 Episode scene components as Stage3D scenes
(each declaring planes + composed camera moves), re-point the storyboard
`camera_strategy` axis at CameraMoves names, and extend quality_gate's SCENE_STRUCTURE
to verify a real camera move per scene. Until then, new dispatches may mix: flat scenes
where 2.5D adds nothing, Stage3D wherever there is a world to move through.
