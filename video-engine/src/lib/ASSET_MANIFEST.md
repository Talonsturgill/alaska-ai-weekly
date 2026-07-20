# Cast & Asset Manifest — Alaska.Ai Dispatch engine

The living inventory of everything the Dispatch video engine can draw. **Every run
reads this to know what exists, and every run must ADD to it** (see the growth
doctrine in `prompts/dispatch_routine.md` §4.3a). This file is how the world and the
craft compound instead of the same few pieces being re-posed forever.

When you add or upgrade an asset, update this file in the same commit. Keep entries
one line: `Name — kind — file — params/poses — status`.

## Characters (people)
- `Character` — human rig — Character.tsx — poses: stand/arms-crossed/point/panic; emotions: neutral/angry/worried/shock/smug; outfits: parka/suit/worker/puffer/flannel/vest; headgear: bare/beanie/cap/trapper/hood (bands raised off the eyes 2026-07-18b, no more 'burglar mask'); `talking` prop = TalkMouth lip-flap; form-shaded + rim + contact shadow — ACTIVE

## Characterized objects (heroes with a face / bespoke silhouette)
- `ServerMachine` — the data-center/AI antagonist — kit.tsx — emotions: greedy/focused/nervous/shock/ghost; tints: steel/copper; `talking` prop = lip-flap — ACTIVE
- `MachineShadow` — faceless institutional monolith (no face, deliberately cold) — Episode.tsx (2026-07-18) — form-shaded + brushed metal + rim + contact shadow — ACTIVE
- `Sourdough` — NET-NEW 2026-07-19 — personified regional power plant hero, warm/rounded/blocky (deliberate shape-language OPPOSITE of ServerMachine/MachineShadow's cold rectilinear institutions) — kit.tsx — emotions: proud/confident/faltering/frozen; `glow` 0..1 drives his furnace-window-chest emotional tell (dims at a story's turn); `accent` 0..1 for VO-emphasis reactivity; form-shaded + rim + contact shadow — ACTIVE
- `Cell` — NET-NEW 2026-07-19 — battery-storage sidekick on sled runners, a genuine parallel-bet visual (grid-modernization hedge) — kit.tsx — `chargeLevel` 0/1/2 charge-bar face; form-shaded + rim + contact shadow — ACTIVE
- `Vale` — NET-NEW 2026-07-20 — the GUARDIAN autonomous wildfire-response drone (hero). Deliberate shape language: rounded/symmetric/protective gunmetal machine, the opposite of the fire's chaos AND the ServerMachine's greed. A single expressive camera-EYE is the emotional tell (iris dilates scanning, CLAMPS small+bright on a lock, with lock ticks); quad rotor arms with spinning blur discs, a suppressant-tank belly with a fill gauge, landing skids, blinking running lights. `emotion` vigilant/locked/resolute/calm; `eyeLock` 0..1; `accent` reactive; `groundY` draws a contact shadow when landed; idle hover-bob + blink. Built to the depth bar (tones/FormGradient/RimLight/ContactShadow) — kit.tsx — ACTIVE

## Craft advance this run (2026-07-19): every claim/format/story is a "live, tested run", not a batch script
- Fixed two real infrastructure bugs discovered while producing this run's VO (both would recur on EVERY future dispatch with numbers/dates in the script, not just this one): `scripts/vo_soundcheck.py`'s WER canonicalizer silently dropped `$`/`%` symbols and mis-split comma-grouped numbers (inflated WER on every number-heavy script); `scripts/vo_synth_gemini.py`'s `_align_wholefile` (a) passed the script's own opening words as Whisper's `initial_prompt`, which made Whisper hallucinate-skip the real audio matching it (reproduced: dropped the first ~14.6s of a real take), and (b) collapsed multi-word token expansions to word[0] only, desyncing the alignment arrays. Both fixed; see the scripts' own comments for the reproduction notes.

## Fauna (the Alaska bestiary) — lib/fauna.tsx
- `Moose` — land — fauna.tsx — emotion: calm/wary; idle head-bob/ear-flick/tail; palmate antlers; form-shaded + rim + AO — NEW 2026-07-18; `bumpKick` 0..1 NEW 2026-07-19: a comic bumped-indignant-recover reaction pose (squash-and-stagger, pinned ears, wide indignant eyes, antler wobble, impact stars); `alert` 0..1 NEW 2026-07-20: ears perk fully UP+forward, head/neck RAISES, nostril-flare sniff, pupil tracks upward — the OPPOSITE motion from bumpKick's lateral recoil (a watching-the-sky pose), used for the drone-watcher gag — existing-asset new-pose growth quota
- `Raven` — air/perch — fauna.tsx — mode: perch/fly; head-tilt, throat hackles, wing-beat cycle — NEW 2026-07-18
- `BaldEagle` — air — fauna.tsx — soaring, fingered primaries, white head/tail, yellow beak — NEW 2026-07-18
- `Salmon` — water — fauna.tsx — spawning (red/green kype) or ocean chrome; S-curve swim undulation — NEW 2026-07-18
- `Grizzly` — land — fauna.tsx — NET-NEW 2026-07-20c (asset-library session, UPGRADE #2): purpose-built anatomy PER STANCE (all4: horizontal bulk, hump highest, head slung forward; stand: upright pear-trunk tower, planted hinds, dangling clawed forepaws; fish: head dropped to the waterline + water hint); emotion calm/alert; roar 0..1 head-throw + jaw; breath/sway/ear idles; fur break-up detail; form-shaded + rim + AO. Taste-looped twice (v1 potato-pose redone). fish stance not yet frame-checked — verify before first on-air use — ACTIVE
- `SledDogTeam` — land — Episode.tsx — gallop gait + 180° motion blur + form-shading (2026-07-18); SHOULD be promoted into fauna.tsx and parameterized — ACTIVE (needs refactor)

### Bestiary gaps to fill (candidates for upcoming runs' net-new quota)
grizzly/black bear, caribou, red fox, dall sheep, sea otter, humpback whale, orca,
puffin, ptarmigan (state bird), wolf, lynx, mountain goat, king crab, mosquito (the
unofficial state bird, for comic beats).

## Props & set pieces
- `AlaskaMini` — map of Alaska w/ pulsing pin — kit.tsx — ACTIVE
- `StatCard` / `Nameplate` / `SwingSign` / `GearLever` / `SurveyStake` / `MeasuringChain` / `PenAndDocument` / `TrailPost` / `ParcelBoundary` — Episode.tsx — episode-local props (candidates to generalize into a shared props kit) — ACTIVE
- `BoxLabel` / `StatBurst` / `FatArrow` / `Stamp` — HUD/label kit — kit.tsx — ACTIVE
  - NOTE: these HUD chips still render as flat fills over the lit world (flagged by the
    scorer panel 2026-07-18). Next craft-advance: give the label/chip kit form-shading + a
    drop shadow so overlays sit IN the lit scene, not on top of it.

## Look-dev harnesses
- `CraftShowcase` — motion/voice/SFX-era look-dev comp (entrance, followThrough, TalkMouth ramp, talking cast) — CraftShowcase.tsx — NEW 2026-07-18b

## Environments
- `DawnForestBG` — boreal birch/spruce dawn, parallax treeline, mist, birds, ground gradient, form-shaded trunks + bark texture + foliage speckle — Episode.tsx (2026-07-18) — ACTIVE
- `FrostYardBG` — NET-NEW 2026-07-19 — interior powerplant-yard/dusk biome: parallax mist/gust bands, flickering skyline windows, drifting snow particles, `parallax` prop for depth-of-field scene layering — Episode.tsx — ACTIVE
- `NenanaRangeBG` — NET-NEW 2026-07-20 — boreal AIRSTRIP biome (distinct from DawnForestBG's full forest and FrostYardBG's utility yard): a flat man-made tarmac foreground with a painted runway centerline + receding blue edge lights to a vanishing point, fronted by a LOW distant black-spruce band (3-4 parallax sub-bands = the supporting aerial-depth refinement), under a boreal midnight-blue -> rose-gold sky. `dawn` 0..1 warms night->sunrise; `parallax` DOF; `showStrip`; dawn-mist drift + fading stars (second disjoint motion region) — Episode.tsx — ACTIVE
  - Environment kit now THREE biomes. Candidates for growth: tundra, coastal/fjord, glacier,
    river/stream, town/main-street, North Slope oilfield, night/aurora.

## Engine systems (the craft layer — advance these every run, don't just consume them)
- `lib/motion.tsx` — animation principles: entrance() (anticipation/overshoot/squash-stretch + MotionBlur velocity), followThrough() secondary swing, accentKick(), idleSway(), squashStretch(), ChipShadow (HUD chips sit in the scene) — NEW 2026-07-18b
- `lib/voice.tsx` — VOICE ACTING: VoiceProvider/useVoice (per-frame mouth envelope + emphasis accents from the VO pipeline), TalkMouth flapping mouth; Character + ServerMachine take `talking` — the cast speaks/reacts in sync with the narration — NEW 2026-07-18b
- `assets/sfx/` designed-foley bank (scripts/build_sfx_library.py, 16 sounds; scripts/sfx_bank.py resolver; drop real CC0 takes in assets/sfx/real/ to upgrade any entry) — NEW 2026-07-18b
- `scripts/render.sh` — draft (half-res ~2-4x faster) vs final render wrapper; the taste loop iterates on drafts — NEW 2026-07-18b
- `lib/lighting.tsx` — tones() ramps, FormGradient, RimLight, ContactShadow, BrushedMetal/BarkTexture/FoliageSpeckle, GradeLayer (bloom+vignette+grain), MotionBlur (180° anisotropic) — NEW 2026-07-18; `HazeOverlay` NEW 2026-07-19 — translucent grid-textured animated air-quality/pollution grading layer (`amount` 0..1 drives wash + tint + grid opacity), for a story's environmental-stakes turn
- `lib/FX.tsx` — SpeedLines, ImpactStar, PaperStorm, ZoomVignette; `SmellRings` NEW 2026-07-20 (radial VOC/smoke detection rings emanating from a sensor node, radial-emanate motion) + `ScanReticle` NEW 2026-07-20 (thermal-lock targeting reticle: rotating corner brackets that SNAP inward and clamp on a target, `lock` 0..1) — ACTIVE
- `lib/lighting.tsx` CRAFT ADVANCE 2026-07-20: `IRVision` — a reusable false-color THERMAL/IR heat-vision look system (magenta->coral->citron heat ramp centered on the hot target + sensor scanlines + refresh sweep + a boxed THERMAL HUD tag), `amount` 0..1 crossfades the drone's-eye view in. Any future sensor/thermal/IR Alaska story inherits it. The run's SINGLE primary craft advance (atmospheric-perspective aerial-depth treeline in NenanaRangeBG is a supporting refinement).
- `lib/stage3d.tsx` — TRUE 2.5D ENGINE (NEW 2026-07-20, UPGRADE_BACKLOG #1 prototype). A real shared
  virtual camera via CSS 3D perspective (`Stage3D`: dolly/truck/boom/orbit/roll), depth layers with
  automatic perspective parallax + overscan (`Plane`), solid extruded dimensional forms (`Extrude`),
  and projected ground cast-shadows (`CastShadow3D`). Proof scenes in `TwentyFiveD.tsx` (comp
  `TwentyFiveD` vs flat `BorealFlat`). NOT yet wired into the Episode pipeline; see UPGRADE_BACKLOG.md
  for the migration plan (per-face Extrude shading + a Character/kit adapter, then migrate one scene).
- `lib/stage3d.tsx` UPGRADES 2026-07-20b: Extrude now has a REAL per-face light model (side wall
  responds to the live camera orbit under the fixed screen-left key, back-slice AO); new `Atmosphere`
  (per-plane aerial perspective: desaturate + contrast-loss + sky veil with depth); new `Solidify` +
  `Card` asset adapter (ANY existing kit hero gains real body thickness with zero re-authoring:
  darkened copies stacked in Z behind the lit front face). Proven in `Nenana3D.tsx` (comp `Nenana3D`),
  the VERTICAL SLICE: Vale on a TRUE 3D runway floor (rotateX'd ground plane, supersampled 2x so the
  perspective-stretched tarmac stays crisp), camera cranes down through the treeline, flies low over
  the runway, rises with the liftoff.
- Known next advances: migrate Episode scenes onto stage3d (planes + camera keyframes), kinetic
  typography, per-material texture library, night/aurora lighting.
