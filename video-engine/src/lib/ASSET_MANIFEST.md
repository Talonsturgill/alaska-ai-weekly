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

## Fauna (the Alaska bestiary) — lib/fauna.tsx
- `Moose` — land — fauna.tsx — emotion: calm/wary; idle head-bob/ear-flick/tail; palmate antlers; form-shaded + rim + AO — NEW 2026-07-18
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
  - Environment kit is thin: ONE biome. Candidates for growth: tundra, coastal/fjord, glacier,
    river/stream, town/main-street, interior-taiga-winter, North Slope oilfield, night/aurora.

## Engine systems (the craft layer — advance these every run, don't just consume them)
- `lib/motion.tsx` — animation principles: entrance() (anticipation/overshoot/squash-stretch + MotionBlur velocity), followThrough() secondary swing, accentKick(), idleSway(), squashStretch(), ChipShadow (HUD chips sit in the scene) — NEW 2026-07-18b
- `lib/voice.tsx` — VOICE ACTING: VoiceProvider/useVoice (per-frame mouth envelope + emphasis accents from the VO pipeline), TalkMouth flapping mouth; Character + ServerMachine take `talking` — the cast speaks/reacts in sync with the narration — NEW 2026-07-18b
- `assets/sfx/` designed-foley bank (scripts/build_sfx_library.py, 16 sounds; scripts/sfx_bank.py resolver; drop real CC0 takes in assets/sfx/real/ to upgrade any entry) — NEW 2026-07-18b
- `scripts/render.sh` — draft (half-res ~2-4x faster) vs final render wrapper; the taste loop iterates on drafts — NEW 2026-07-18b
- `lib/lighting.tsx` — tones() ramps, FormGradient, RimLight, ContactShadow, BrushedMetal/BarkTexture/FoliageSpeckle, GradeLayer (bloom+vignette+grain), MotionBlur (180° anisotropic) — NEW 2026-07-18
- `lib/FX.tsx` — SpeedLines, ImpactStar, PaperStorm, ZoomVignette — ACTIVE
- Known next advances: kinetic typography, per-material
  texture library, a real cast-shadow projector (not just contact AO), night/aurora lighting.
