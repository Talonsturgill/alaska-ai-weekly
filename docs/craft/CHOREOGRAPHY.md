# CHOREOGRAPHY — the living-screen doctrine (why a Dispatch never reads as a slideshow)

**Why this doc exists.** The 2026-07-11 Dispatch ("The Lid") passed every gate and still drew the
producer note: *"reads slightly like a slide show, want it more coordinated and intelligent, more
happening on screen."* The three judges said the same thing three ways: "camera- and
atmosphere-driven more than object animation," "cards slide and settle," "near-rest beats riding a
held composition." Diagnosis: our doctrine commanded a CADENCE (something changes every ~5s,
VISUAL_FLOW) and a LOOK (DIMENSIONAL_CRAFT), but nothing commanded how motion is ORGANIZED inside
a shot. One element ticked while the rest of the frame held. That is a slideshow with moving parts.

The fix, distilled from how the elite shops do it (Kurzgesagt's scene economy, Vox/Harris's
evidence-sync, Territory-style living instruments, Material/Carbon motion choreography, the
Disney principles applied to non-characters): **motion is organized into channels, every action
has a cause and a consequence, the subject performs, and the world has an arc.**

This doc is LAW for Phase 4.5 (storyboard) and Phase 5 (build). It is enforced three ways:
the beat schema's `choreo` block (flow_check), the LIVING_SCREEN objective gate (quality_gate),
and the flow-critic's choreography red-team.

---

## 1. THE FOUR CHANNELS (all four run at once, every shot)

At any instant the frame carries four concurrent motion channels. This replaces the old
"one at a time" rule in VISUAL_FLOW §4 — one PRIMARY at a time, yes, but never one MOTION at a time.

1. **PRIMARY — the narrated action.** One per beat, VO-synced (the number resolves AS it is
   spoken, the lid draws AS it is named). Biggest amplitude on screen. Only the primary may
   grab the eye. (Vox/Harris discipline: evidence appears on its cue, motion explains.)
2. **REACTION — the consequence channel.** The primary's arrival visibly disturbs the world:
   neighbors recoil-and-settle, particles get shoved aside, a light responds, a readout spikes,
   the water ripples. Cause then effect, within ~half a second. This channel is what reads as
   "coordinated and intelligent" — motion that happens BECAUSE of other motion.
3. **AMBIENT — the life bed.** Two to three low-amplitude idle loops unrelated to the VO
   (spruce sway with height-lagged phase, a distant bird crossing, a flag flutter, water
   undulation, a readout breathing). Summed incommensurate frequencies (e.g. 0.37 Hz + 1.13 Hz),
   phase-offset per instance, so nothing syncs and nothing loops visibly inside 60s.
4. **ATMOSPHERE — the perpetual bed.** Drifting particle field (smoke motes, snow, spores,
   embers) at 2 to 8 percent opacity + scrolling haze/fog layers + slow cloud-shadow sweep
   across the terrain. Never off. This is the cheapest density win in the whole stack.

Amplitude discipline: ambient + atmosphere stay under ~10 percent of the primary's amplitude.
Support motion must never compete with the primary (staging). More than one loud thing = noise,
zero loud things = slideshow.

## 2. ARRIVAL PHYSICS (nothing enters cold, nothing stops dead)

- **Anticipation**: a 2-4 frame counter-move before the main move (the panel dips 2-4 percent
  before launching; the chimney compresses before the smoke puff; the light flickers once
  before snapping on). Anticipation is what turns a state-change into a performed action.
- **Eased entrance, banned linear**: entrances decelerate into place (fast-in, soft-landing);
  exits accelerate away. Element moves run 4-9 frames at 30fps (130-300 ms), longer travel =
  longer duration.
- **Overshoot + settle**: 3-6 percent past the final pose, one or two decaying oscillations.
  Use `easing.py`'s spring. Corporate-small, never cartoon-large.
- **Follow-through**: sub-parts trail the body by 2-4 frames (the antenna whips after the
  housing lands; the label catches up to its card). Motion travels THROUGH a form: phase-lag
  sway by height so wind visibly climbs the tree.
- **Staggered cascades**: grouped arrivals enter 2-3 frames apart along ONE directional focal
  path (reading order), never in unison, never scattered.

## 3. THE CAUSE-AND-EFFECT LAW

Every beat's primary action must provoke at least one visible reaction the viewer can attribute
to it. The storyboard names it in the beat's `choreo.reaction` and the scene code implements it.
Patterns (pick per beat):
- **Displacement**: A arrives and pushes B aside; B's shift reveals space C drops into.
- **Impulse broadcast**: A's landing emits a radial impulse; nearby instanced elements sample it
  (recoil, rotate toward, opacity pulse) with spring-damper settle.
- **Parenting**: B's property is literally driven by A's motion (the bracket width IS the gap
  between the curves; the readout IS the plume's height).
- **Call-and-response chain**: gust (call) -> canopy bends -> bird startles and crosses ->
  cabin light flickers (response). Two to three links max; sequenced, not simultaneous.
- **Instrument reaction**: the panel is on the same event bus as the world — when the ember
  pulses under the cloud, the reticle's sweep stutters; when the curve bends, the ticker
  re-latches. (Territory rule: every readout maps to a real scene variable, never random.)

## 4. SUBJECT PERFORMANCE (the hero acts; the camera arrives)

- Every shot's hero has **business**: one small motivated action arc with a beginning, middle,
  and end inside the shot (the drone tilts, scans, locks; the cabin's chimney breathes smoke;
  the plume column billows, presses the lid, flattens). Not an idle loop — an ARC.
- **The camera arrives on the action**: the move settles on the subject exactly when its beat
  fires. A camera that glides past indifferent scenery is drift; a camera that lands ON the
  smoke-puff is direction. Time `cam_at(f)` easing to the beat map.
- **Open on a meaningful object** where the board calls for it (hold the lit window, then
  widen to the dark valley) — the object becomes a character.
- Compose the frame first (every frame poster-worthy), then add the performance. Aliveness
  sits ON composition, not instead of it.

## 5. THE WORLD ARC (a shot ends in a different state than it began)

- One **monotonic ramp** per shot, run once, never looped: light phase advances, smoke
  thickens, snow accumulates, a shadow sweeps a wall, the fire burns down. The viewer must
  feel time passed.
- One **scheduled world event** per Dispatch as the visual climax (~2/3 point, on the story's
  emotional peak): the fog lifts, the sun breaks, the aurora sweeps, the inversion lid cracks.
- **Persistent consequence**: whatever the story did to the world stays done at the outro
  (the light is now on; the forecast line now hugs the smoke). The final frame proves
  something happened.

## 6. LIVING INSTRUMENTS (panels are never static cards)

Every HUD/panel element carries an idle behavior and an event response:
- **Breathe**: status elements cycle ~60-100 percent opacity on a slow sine.
- **Tick**: numeric readouts drift a few units around truth and re-latch periodically —
  an instrument that is MEASURING, not a label.
- **Sweep**: a recurring scan line/arc implies continuous processing; scan-complete triggers
  the next reveal.
- **React**: panels subscribe to scene events (§3). Values spike, brackets snap, traces jump
  when the world acts.
All UI motion obeys §2 physics (overshoot-settle, staggered, never linear).

## 7. NUMERIC CONVENTIONS (at 30 fps)

| thing | value |
|---|---|
| element entrance | 4-9 frames (130-300 ms), longer travel = longer |
| anticipation dip | 2-4 frames, 2-4 percent counter-move |
| overshoot | 3-6 percent past pose, 1-2 decaying bounces |
| follow-through lag | 2-4 frames behind the primary |
| stagger step in a cascade | 2-3 frames per item, one direction |
| concurrent motion channels | 4 (primary, reaction, ambient x2-3, atmosphere) |
| ambient amplitude | under 10 percent of primary |
| enter/exit/reveal event | one every 1.5-3.0 s (rides the beat clock) |
| ambient frequencies | 2 summed incommensurate sines + fine noise for texture |
| scheduled world event | 1 per Dispatch, ~2/3 point |

## 8. ANTI-PATTERNS (any one of these is the slideshow tell)

- One element animates while the rest of the frame holds (the old §4 pattern). FIXED BY §1.
- Unison or identically-timed group entrances; elements popping in scattered order.
- Linear timing anywhere; hard stops with no settle; entrances by bare fade.
- A held composition "riding" a prior reveal through a beat (the 18-21.5s lid beat of 07-11).
- Motion with no attributable cause; decorative tickers disconnected from the story.
- An idle loop instead of a performance arc; a world whose end state equals its start state.
- A panel whose numbers never move between beats.

## 9. ENFORCEMENT (plan it, verify it — same pattern as divergence + flow)

1. **PLAN**: every beat in `storyboard.json` declares a `choreo` object:
   `{"primary": "<the narrated action>", "reaction": "<what it visibly causes>",
   "ambient": "<which life loops run under it>"}`. `flow_check.py` fails beats without it
   (vague values like "stuff moves" fail the critic).
2. **VERIFY (objective)**: `quality_gate.py` LIVING_SCREEN check — sampled at the gate's
   cadence, at least 3 spatially disjoint active motion regions (camera-motion-compensated)
   must be present in at least 80 percent of 2-second windows (final 2s branded outro exempt).
   Calibration: the criticized 07-11 Dispatch scores 63 percent — it FAILS this gate, as it
   should. Thresholds live in `config/visual_flow.yaml > choreo`.
3. **VERIFY (taste)**: the flow-critic red-teams PRE (are the choreo fields real cause-effect
   or relabels?) and POST (do the strips show arrivals with physics, reactions, and a world
   arc?). The scorer panel's Motion axis grades §2 physics from the filmstrips.

## SOURCES

Material Design motion choreography (M1/M2); IBM Carbon motion (productive/expressive, duration
scaling, easing tokens); Willenskomer, "UX in Motion Manifesto" (offset/delay, parenting,
transformation); Disney's 12 principles applied to UI/motion-graphics (IxDF, Adobe, Uxcel,
PremiumBeat); School of Motion + Sunstrike timing heuristics; Kurzgesagt production breakdowns
(10.studio, Skillshare parts 1-3) — ambient actors, particle bed, layered planes, scene economy;
Vox/Johnny Harris breakdowns (PremiumBeat, Motion Street) — word-synced draw-ons, progressive
annotation, motivated map moves; Territory Studio / Jayse Hansen FUI interviews (SciFiInterfaces)
— function-first readouts, widget idle behaviors, event-driven UI; AnimSchool idle-animation
layering; StudioBinder blocking/staging + atmosphere; environmental-storytelling analyses (TMFF,
RMCAD) — monotonic world ramps, persistent consequence; procedural-animation guides (Wayline) —
constrained functions + spring-damper over noise; beat-sync guides (Palos, Koreographer).
