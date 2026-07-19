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

## Craft advance this run (2026-07-19): every claim/format/story is a "live, tested run", not a batch script
- Fixed two real infrastructure bugs discovered while producing this run's VO (both would recur on EVERY future dispatch with numbers/dates in the script, not just this one): `scripts/vo_soundcheck.py`'s WER canonicalizer silently dropped `$`/`%` symbols and mis-split comma-grouped numbers (inflated WER on every number-heavy script); `scripts/vo_synth_gemini.py`'s `_align_wholefile` (a) passed the script's own opening words as Whisper's `initial_prompt`, which made Whisper hallucinate-skip the real audio matching it (reproduced: dropped the first ~14.6s of a real take), and (b) collapsed multi-word token expansions to word[0] only, desyncing the alignment arrays. Both fixed; see the scripts' own comments for the reproduction notes.

## Fauna (the Alaska bestiary) — lib/fauna.tsx
- `Moose` — land — fauna.tsx — emotion: calm/wary; idle head-bob/ear-flick/tail; palmate antlers; form-shaded + rim + AO — NEW 2026-07-18; `bumpKick` 0..1 NEW 2026-07-19: a comic bumped-indignant-recover reaction pose (squash-and-stagger, pinned ears, wide indignant eyes, antler wobble, impact stars) for a recurring line-cutting gag — existing-asset new-pose growth quota
- `Raven` — air/perch — fauna.tsx — mode: perch/fly; head-tilt, throat hackles, wing-beat cycle — NEW 2026-07-18
- `BaldEagle` — air — fauna.tsx — soaring, fingered primaries, white head/tail, yellow beak — NEW 2026-07-18
- `Salmon` — water — fauna.tsx — spawning (red/green kype) or ocean chrome; S-curve swim undulation — NEW 2026-07-18
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
  - Environment kit now TWO biomes. Candidates for growth: tundra, coastal/fjord, glacier,
    river/stream, town/main-street, North Slope oilfield, night/aurora.

## Engine systems (the craft layer — advance these every run, don't just consume them)
- `lib/motion.tsx` — animation principles: entrance() (anticipation/overshoot/squash-stretch + MotionBlur velocity), followThrough() secondary swing, accentKick(), idleSway(), squashStretch(), ChipShadow (HUD chips sit in the scene) — NEW 2026-07-18b
- `lib/voice.tsx` — VOICE ACTING: VoiceProvider/useVoice (per-frame mouth envelope + emphasis accents from the VO pipeline), TalkMouth flapping mouth; Character + ServerMachine take `talking` — the cast speaks/reacts in sync with the narration — NEW 2026-07-18b
- `assets/sfx/` designed-foley bank (scripts/build_sfx_library.py, 16 sounds; scripts/sfx_bank.py resolver; drop real CC0 takes in assets/sfx/real/ to upgrade any entry) — NEW 2026-07-18b
- `scripts/render.sh` — draft (half-res ~2-4x faster) vs final render wrapper; the taste loop iterates on drafts — NEW 2026-07-18b
- `lib/lighting.tsx` — tones() ramps, FormGradient, RimLight, ContactShadow, BrushedMetal/BarkTexture/FoliageSpeckle, GradeLayer (bloom+vignette+grain), MotionBlur (180° anisotropic) — NEW 2026-07-18; `HazeOverlay` NEW 2026-07-19 — translucent grid-textured animated air-quality/pollution grading layer (`amount` 0..1 drives wash + tint + grid opacity), for a story's environmental-stakes turn
- `lib/FX.tsx` — SpeedLines, ImpactStar, PaperStorm, ZoomVignette — ACTIVE
- Known next advances: kinetic typography, per-material
  texture library, a real cast-shadow projector (not just contact AO), night/aurora lighting.
