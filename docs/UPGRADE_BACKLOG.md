# Dispatch — Large-Scale Upgrade Backlog

The per-run fix-log lives in `docs/RUN_UPGRADES.md` (small fixes, made every run). THIS file
is the opposite: the big, cross-cutting initiatives that need a dedicated work session (or
several), not a mid-run patch. Owner-requested 2026-07-20. Newest priorities first.

---

## 1. TRUE 2.5D — move off the flat-vector look into real depth

**Where we are:** the engine calls itself "infographic-2.5d" but it is really flat 2D vector art
with a depth-*lighting* pass bolted on (`lib/lighting.tsx`: form-shading ramps, rim light, contact
shadow). Forms are lit, but they are still flat shapes on flat planes. Judges keep reading big fills
(the megafire wall, map dioramas) as "clip-art" / "slide."

**What "big time" looks like:**
- Real layered PARALLAX planes with genuine Z separation (fore/mid/back), camera that dollies and
  the layers drift against each other at different rates (we do a little of this in backgrounds; it
  needs to be the whole staging system, not a background trick).
- Dimensional forms: extruded/beveled shapes, cast shadows that project onto other surfaces (not
  just a contact-AO ellipse), ambient occlusion between stacked layers, a real light rig with a key
  that throws directional shadows.
- Camera language through Z: push THROUGH a layer, rack focus between planes, orbit a hero slightly
  so it reads as a solid object, not a sticker.
- A material/texture library so surfaces read as substances (metal, spruce bark, tarmac, smoke),
  not flat fills — the "no flat single-tone fills" rule enforced by the engine, not by hand.

**Approach:** a dedicated engine session. Prototype a "true 2.5D" scene in Remotion (layered
`<div>`/SVG planes with CSS 3D transforms + a shared virtual camera), compare it side-by-side with
the current flat scene, and if it clears the bar, migrate the scene-authoring API so every future
Dispatch is 2.5D by default. This is the single biggest lever on the "looks designed and expensive"
axis the rubric grades.

**STATUS 2026-07-20: prototype landed and proven.** `video-engine/src/lib/stage3d.tsx` implements
the real engine (`Stage3D` shared virtual camera via CSS 3D perspective; `Plane` depth layers with
automatic perspective parallax + overscan; `Extrude` solid dimensional forms; `CastShadow3D`
projected ground shadows). `video-engine/src/TwentyFiveD.tsx` is a proof scene (comp `TwentyFiveD`)
plus a flat `BorealFlat` for A/B. The camera dollies THROUGH a layered boreal treeline and orbits to
reveal the hero's extruded side wall; the before/after is unmistakable (foreground spruces sweep past
while the ridge barely moves; the hero reads as a solid volume, not a sticker). REMAINING to close
the initiative: (a) richer per-face shading on `Extrude` (a real key/side/top light model, not just a
darkening stack); (b) a `Character`/kit adapter so existing heroes author into a Plane and can be
lightly extruded; (c) migrate the Episode scene-authoring API onto Stage3D (planes + camera keyframes
per scene) and re-point the storyboard `camera_strategy` axis at real camera moves; (d) a material/
texture pass so surfaces read as substances at depth. Do (a)+(b) first, then migrate one scene as a
vertical slice before converting all six.

---

## 2. AN ASSET-CREATION SESSION — build a library of amazing reusable art up front

**Where we are:** we grow the library one or two net-new assets per run (the growth mandate). That
compounds slowly, and each run's hero is built under time pressure inside the pipeline.

**What "big time" looks like:**
- A focused session (not a Dispatch run) whose ONLY job is to author a deep library of genuinely
  great, reusable assets the automation pulls from: a real Alaska bestiary (bears, caribou, orca,
  puffin, salmon runs, ptarmigan, the whole `fauna.tsx` backlog), a prop/vehicle kit (bush plane,
  snowmachine, fishing boat, drilling rig, data-center, weir, sonar), a set of biomes (tundra,
  fjord, glacier, river, main-street, North Slope, night/aurora), and a cast of characterized
  objects and people built to the exemplar craft bar.
- Each asset built once, deliberately, to the highest quality, with full pose/emotion/animation
  sets — so a run composes a showstopper from a rich shelf instead of authoring the hero from
  scratch every time.

**Approach:** treat it like a studio "model sheet" sprint. Pick the 15-20 highest-frequency Alaska
subjects, build them to the Vale/Sourdough bar with idle animation + emotion params, register each
in `ASSET_MANIFEST.md`. The per-run growth mandate then shifts from "build a hero from zero" to
"add one asset + advance one system," with the heavy lifting already banked.

---

## 3. ENGAGEMENT SCIENCE — keep a viewer hooked every single second

**Owner's framing:** attention spans are short; the win is not just *illustrating* the narration but
keeping something NEW and genuinely COOL happening on screen every second, so the eye never has a
reason to leave. We have the never-rest gate (a beat every <5s) but that is a floor, not "cool."

**What "big time" looks like:**
- RESEARCH FIRST: launch research agents into what actually holds attention in short-form vertical
  video, second by second — retention-curve studies, the pattern-interrupt cadence of the best
  Infographics Show / MrBeast / kurzgesagt / TikTok explainer content, what makes a single frame
  "cool" vs merely clear (motion design, reveals, scale surprises, micro-payoffs, anticipation).
- SYNTHESIZE it into a concrete, checkable engagement spec: a tighter cadence (a genuine new visual
  idea every ~1.5-2s, not 5s), a "coolness" rubric axis with teeth, a library of reveal/transition
  techniques, and rules for layering secondary motion so the frame is always alive.
- APPLY what we learn: upgrade the storyboard beat-density gate, the flow-critic, and the
  scene-authoring patterns; add the techniques research surfaces to the engine as reusable moves.

**Approach:** a research-and-apply cycle. Fan out researcher agents on the questions above, converge
the findings into `docs/craft/ENGAGEMENT.md`, then land the enforceable pieces (gate thresholds,
new critic checks, engine motion primitives) so every future run is measured against the higher bar.

---

### How these relate to the per-run loop
The daily routine keeps shipping and self-upgrading in small steps (RUN_UPGRADES.md). These three
are step-changes that each deserve their own session and, once landed, raise the floor for every run
after. Recommend tackling in the order above: (1) true 2.5D and (2) the asset library are the
foundation the (3) engagement upgrades then get applied on top of.
