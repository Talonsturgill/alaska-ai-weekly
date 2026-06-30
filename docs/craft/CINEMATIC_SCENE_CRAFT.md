# Cinematic Scene Craft — the Director's Brain

The operative creativity brain for the Dispatch's scene structure. Distilled from six research
dossiers (`research/1..6`) on how the great directors, editors, cinematographers, and documentarians
build scenes and move between them — every principle translated to our medium: **60s, vertical 9:16,
100% hand-coded PIL/numpy, no footage, no AI imagery.**

Use it as a **palette and a vocabulary**, not a checklist. Draw what the story needs. The point is that
the viewer is **carried on a journey through different worlds**, not shown one canvas being zoomed.

---

## 0. The one rule that fixes what was broken: MOVE vs CUT

The v2 critique was exact: our "scene changes" were the camera **zooming/panning over ONE rendered
display.** That is reframing, not scene-breaking. All six researchers converged on the same law:

> **If the WORLD changes — a different screen, space, register, or subject — CUT to a newly rendered
> composition. Never travel the crop to get there. Reserve camera MOVEMENT for developing the world
> you are already inside.**

- A **cut** changes the world. A **move** develops the world. Don't substitute one for the other.
- A move (`dc.reframe`, a push-in) is legitimate **only when it lands a *different composition*** —
  new or newly-legible information — not the same picture bigger (Spielberg's oner, PTA's "four
  compositions in a few feet"). Otherwise, cut.
- **The on-screen test** (freeze the two frames either side of a boundary): if everything except a
  *deliberate matched anchor* is the **same content at a different scale**, it's a fake scene change.
  A real one flips **≥4 of the 7 composition axes** (pov, motion_vector, hero_treatment, layout,
  register, palette, metaphor — `config/composition_axes.yaml`). Same axes + new zoom = no scene.

---

## 1. What makes a transition (not a slide, not a zoom): MATCH · CARRY · BUILD · TRAVEL

A real transition has **meaning** (it links two ideas), **momentum** (motion crosses the boundary),
and **takes the viewer somewhere.** Every scene break should do at least **one** of these four:

- **MATCH** — anchor the eye across a *total* world-change. The next scene opens on a kindred shape at
  the same screen geometry, so two unrelated worlds read as one inevitable thought. *(The single most
  important move for us.)*
- **CARRY** — a named element survives the cut and changes role (a chart dot becomes a map pin). Two
  screens read as one sentence.
- **BUILD** — the new screen **assembles or boots into being** (wireframe → render; FUI power-on),
  so arrival is an event, not a slide.
- **TRAVEL** — the camera moves *through* a shared substrate (a map, a grid, a data field) to reach the
  next scene, so the journey is literal.

If a boundary does none of these, it's either a slideshow cut or a fake (zoom) — fix it.

---

## 2. The transition library (hand-coded)

Each: **what / who** · **when** · **how in our engine.** Helpers that already exist in
`dispatch_core.py`: `xfade`, `reframe`, `whip`, `mask_wipe`, `focus_pull`, `set_frame_bg`,
`write_shots`. Items marked *(new helper)* are worth building.

### Graphic match cut — `[MATCH]`  ★ the core fix
*2001* bone→spacecraft; *Lawrence of Arabia* flame→sun. Render scene A to **resolve on a salient
primitive** at a known geometry — a disc/ridge/arc/sweep at `(cx, cy, r)` with a motion vector — then
render scene B to **open on a different object at the identical geometry**, and **hard-cut on the VO
downbeat.** Same on-screen anchor, completely different world. Brand pairings: spectrogram peak →
mountain ridge; salmon tail-fan → sonar beam-fan; one data point → Polaris; radar sweep → river meander.

### Hard cut, done right — `[the spine]`
Render A and B as **fully independent compositions** (≥4 of 7 axes differ); swap the frame with **zero
blend on the stressed syllable**; pre-roll A to a settle-still and open B already in motion. Declare
every boundary via `dc.write_shots(...)` so the gate can prove the change is real.

### Match-on-action across time/space — `[MATCH/CARRY]`
*The Graduate.* End A mid-gesture; resume the **same gesture** (matched px/frame velocity + screen
position) opening B in a new world — a swipe "lands" in a different panel; a wing-beat completes as a
turbine blade.

### Carried-element transition — `[CARRY]`  ★ the anti-slideshow move
Saul Bass's recombining cut-paper; Vox's "anchor motif." Keep a few **named persistent objects** in the
engine (`hero_point`, `coastline_path`, `polaris`). At a break, **don't clear the canvas** — tween the
object from its scene-A pose to its scene-B role while everything else fades/builds around it.

### Whip-pan world jump — `[TRAVEL]`
Edgar Wright. `dc.whip`: over ~4–6 frames smear A off-frame (directional blur 0→~150px) while B slides
in from the opposite edge with **matched direction + blur magnitude**; hide the render-swap in the 1–2
fully-smeared frames. For a "meanwhile / scale jump" (one sensor → the statewide map).

### Object / portal / iris wipe — `[CARRY/BUILD]`
Star Wars; Spielberg. `dc.mask_wipe`: a passing foreground element (salmon, ice floe, a swinging
needle), a hard edge, a flare white-out, or an iris closing on a target reveals B. Native to our HUD
register — a wipe de-allocates attention like a doorway.

### Match / lap dissolve — `[MATCH]`
*Apocalypse Now* ceiling-fan↔helicopter rotors. `dc.xfade` ~10–18f **with a shape hinge** (radar sweep
→ river meander; wireframe digital-twin → the real terrain it predicted). **Reserve for time-passing /
reflection** beats; never default-dissolve every cut.

### Morph / form transition — `[CARRY]` *(new helper)*
*T2*; Premiere Morph Cut. Tween tagged contours with `scipy` (coastline→isoline; noisy waveform→clean
signal; scatter→fitted curve) **when the transformation *is* the argument**; sync the midpoint to the
thesis word.

### Assemble-into-being — `[BUILD]` *(new helper)*
Westworld titles (Patrick Clair). A state-chain renderer per hero object:
`points → edges → faces → shaded`, driven by a 0→1 progress. A break = scene A's geometry collapses to
points that re-fly into scene B's wireframe. Arrival becomes an event.

### FUI boot-up / power-on — `[BUILD]`
Territory Studio (*Blade Runner 2049*). Give each scene a 6–12 frame **boot-in**: corner brackets snap,
a sweep line draws the grid/axes, readouts count up and settle with overshoot, labels type on. **Boot a
*new* interface, not the same one zoomed** — this is the direct fix for the fake scene change.

### Double-exposure / figure-as-window — `[CARRY]` *(new helper)*
*True Detective* S1 (Antibody). Hold a **silhouette mask** (salmon, coastline, turbine) constant across
a cut and **swap what shows through it** via numpy alpha composite (chart inside coastline → satellite
map inside the same coastline → mask dissolves to full map). The shape carries; the contents journey.

### Map / grid travel — `[TRAVEL]`
Vox Atlas (Sam Ellis); GMUNK's *Tron* boardroom. Use an **Alaska map (or one grid module) as the
persistent coordinate space**; treat scenes as altitudes/overlays/layouts on it. Because it's one
projection in code, the camera **literally travels between scenes** (animate offset/scale) instead of
cutting — or stage a **grid takeover** at a turning point: the grid glitches and a new data layer floods
in from a corner to overwrite the screen.

### Sound bridge (J-cut / L-cut) — `[stacks on any cut]`  ★ cheapest pro upgrade
We control the audio timeline frame-exactly. Start scene B's signature sound (or the VO's next first
syllable) **~6–14 frames before** the picture cuts (J-cut), or let A's clause/ambience run ~6–14 frames
**past** it (L-cut). **Never slam picture and audio on the same frame every time** — that's the amateur
tell. Pure mix-timing offset; no new visual infra; it makes any cut feel motivated.

---

## 3. Building a sequence of genuinely distinct shots

- **Author each shot as its own render**, never a crop of one canvas. Render the establishing wide
  *once*, then leave it; the medium, the insert, the reaction are new compositions sharing only the
  brand throughlines (wordmark, type, grade, captions).
- **Force a scale ladder (ELS → ECU).** At least one extreme-wide (the whole story-system small in a
  large field) and one ECU insert (one needle/rivet/data cell full-frame, everything else gone).
  Wide→ECU is the single biggest "new image" you can make.
- **Change the ANGLE, not the zoom.** A top-down map/plan projection of the same subject is the cheapest
  genuinely-different shot we have; add a low-angle "looms" (converging verticals); ration a Dutch tilt
  (±3–8°) for one beat of alarm.
- **Encode "lens" as a perspective/parallax/DOF recipe.** Wide = strong vanishing-point convergence +
  big parallax + large foreground; telephoto = near-orthographic, compressed planes, shallow-DOF
  isolating one sharp plane. Alternating them on one subject yields two distinct images for free.
- **The coverage build (~4+ shots / 60s):** establishing wide → medium subsystem → ECU detail that *is*
  the AI mechanism → a **reaction** that cuts to the human / Alaska consequence (the meter, the
  ratepayer number, the animal). The reaction shot is how the data earns meaning.
- **Borrow whole composition registers:** Kubrick one-point symmetry (control/dread); Wes Anderson
  planimetric flat-stacked layers (nearly free in our layer compositing); Fincher locked precision with
  the ECU *rationed*; Deakins negative-space silhouette for scale and emotion. Thirds on connective
  beats; dead-center on the thesis punch.
- **Exploit the tall 9:16 frame:** stack distinct registers top-to-bottom (aurora band / hero / data
  rail) and reveal them progressively; make a vertical descent or rising column the dominant motion
  vector. Keep load-bearing content in the central 1080×1080 so a 4:5/1:1 crop still reads.

---

## 4. The rhythm of the cut (the 60-second curve)

- **Author an explicit cut-interval curve, not a metronome.** Establishing shots long (~10–12s) → build
  beats trending shorter (8→6→4→2s) as the VO escalates → then **ONE deliberate held shot** (1–2s,
  idle-drift only) on the thesis line, landed on the downbeat. The held shot is the scarce, expensive
  move; the acceleration earns it.
- **J/L-cut most boundaries** (see Sound bridge). Picture and audio rarely land on the same frame.
- **Cross-cut the core ALASKA.AI argument.** Keep two rendered worlds alive — Alaska physical reality
  vs. the AI/ML mechanism — and intercut in **decreasing dwell** (3.0→2.0→1.0→0.5s) so they visibly
  converge, then resolve to a single composite where the model overlays the reality. The cut between
  them *is* the thesis.
- **Rationed specials:** smash cut (one per film — a quiet near-still beat hard-cut to a dense,
  high-contrast frame on a sound stab, killing the bed at the same instant) for the pivot; jump cut
  (hold the same composition, snap a state discontinuously — counter 14→53→91) to compress "and it kept
  climbing" without changing worlds.

---

## 5. The documentary journey (sequence as argument)

The Dispatch is non-fiction. The structure of the cuts *is* the editorial.

- **Order is the argument** (Adam Curtis: "high end bolted to low end"). Sequence genuinely different
  **registers** — map → chart → reconstruction → vignette → type plate — so the succession carries
  meaning.
- **The collision cut.** Render A = an austere data chart (the cold number); hard-cut to B = the
  stylized human/landscape the number is *about*. The collision IS the editorial — the direct antidote
  to zoom-on-one-display.
- **Animate data toward its punchline, then cut to meaning** (Vox/Bloomberg). Never drop a finished
  chart on screen: axes draw in, the line decelerates / shifts color at the inflection the story is
  about, a callout overshoots-and-settles, hold — *then* cut to the register that gives the number
  meaning. Open on the stakes/question; withhold the hero number until earned.
- **The visual-investigation sequence** (NYT VI): a rendered map fixes **where**, an annotated
  before/after fixes **when**, a schematic/3D reconstructs **how**, a chart quantifies **how much** —
  four distinct register-cuts in the order of the argument, each animating *as it's introduced.*
- **Expressive, openly-diagrammatic reenactment** (Errol Morris). To show an AI prediction vs. reality,
  render **two versions of the same beat** (predicted path vs. observed path) as separate hard-cut
  shots; the gap between them is the thesis. (This also keeps us inside the no-AI-imagery / no-stock
  rule by construction.)
- **Align audio seams to register cuts.** Mark every new movement by ear: change the music bed, drop a
  hit, or cut to **held silence** under a full-bleed type plate. A register cut on a beat reads as a
  chapter; one with no audio event reads as a glitch.

---

## 6. Anti-patterns (name them, kill them)

- **Zoom/pan over one canvas as a "scene change."** Reframing, not a cut: no world change, no collision,
  no journey. (A flash/luma spike can fool a naive gate — ours did. The gate now checks for real
  compositional divergence across the boundary, not just a brightness delta.)
- **The slideshow.** Cutting between static screens with no MATCH/CARRY/BUILD/TRAVEL — dead air with
  edges.
- **The fake oner.** A pan stitching unrelated panels. Those are separate shots that deserve real cuts;
  reserve the true continuous take for a story that is genuinely one traversal (headwaters→delta,
  surface→seabed) — **one per film, max.**
- **Decorative motion / HUD noise** with no meaning; **constant drift** that deadens. Most shots should
  end *stiller* than they began. If you can't name a move's job in one phrase, don't move — and ask
  whether the real intent was to **cut**.

---

## 7. How the routine draws from this (organic, not a quota)

At the **storyboard step (Gate 0)**, each shot declares:
1. its **composition** — the 7 axes, distinct from its neighbors on **≥4** (no two adjacent shots are
   the same composition reframed); and
2. its **transition IN** — a named technique from §2, **which thread** it uses (MATCH/CARRY/BUILD/
   TRAVEL), and **what it means** (the idea the cut links).

Then:
- `scripts/storyboard_check.py` + the `storyboard-critic` agent verify the board is a real journey
  (adjacent shots genuinely diverge; transitions are motivated; the on-screen test would pass).
- `quality_gate.py` SCENE_STRUCTURE verifies the *render* cut is real — a genuinely different
  composition across the boundary, not a zoom (§6).
- **Stay organic.** This is a vocabulary to compose from, not a checklist to satisfy: pick the
  transitions the story wants, keep the special moves scarce (one signature traversal; one held thesis
  shot; rationed smash/jump cuts), and let the journey — not the gate — be the goal.

---

## Source dossiers
1. [Cut grammar & the rhythm of editing](research/1-cut-grammar-and-rhythm.md)
2. [Scene-break & world-transition techniques](research/2-scene-breaks-world-transitions.md)
3. [Shot grammar & sequence construction](research/3-shot-grammar-sequence-construction.md)
4. [Motivated camera movement](research/4-motivated-camera-movement.md)
5. [Documentary & essayistic craft](research/5-documentary-essayistic-craft.md)
6. [Title design, FUI/HUD & data motion-graphics transitions](research/6-title-hud-data-motion-graphics.md)
