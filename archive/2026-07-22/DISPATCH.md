# Dispatch 2026-07-22 — "The checkpoint lever frozen at the midpoint"

## Story
The Air Force is offering ~4,700 acres across 12 parcels at Joint Base Elmendorf-Richardson,
Eielson Air Force Base, and Clear Space Force Station to private companies to build AI data
centers, via a 50-year (reported, not DAF-confirmed) Enhanced Use Lease. As of air date
2026-07-22, no operator has been selected.

## Earned angle (Phase 3.5 angle room)
Open question / curiosity, not celebration or caution. Both the Air Force's legitimate
public-private-partnership stake and Eielson-area resident Sarah Hollister's real, named
concerns (noise, property values) get equal weight. The freshest true fact is that nothing has
been decided yet. Stance: curious.

## Fact-check-safe set (2 independent validators)
- af.mil / spaceforce.mil (2026-04-10): ~4,700 acres / 12 parcels, the Enhanced Use Lease
  mechanism, Robert Moriarty's verbatim quote.
- Air & Space Forces Magazine (secondary): the 50-year lease figure, labeled REPORTED on screen
  and in the caption since it is not DAF-confirmed.
- Alaska's News Source / KTUU-KTVF (2026-06-08/06-12): proposal deadline (June 29), Sarah
  Hollister's verbatim quote.
- Cut: a contested school-proximity claim, a fabricated "constant hum" quote, an unverified
  solicitation number, and an unrelated Industry Day land offer (all unverifiable or
  independently confirmed false by validator re-fetch).

## Craft
- Composition fingerprint: cross-section-cutaway POV, push-in-only motion, instrument-as-subject
  hero, single-object-void layout, editorial-schematic register, locked-drift camera, night-
  practical light story. Palette: gunmetal steel-gray + arctic frost-white + caution-yellow
  signal light + storm-navy shadow.
- NET-NEW: CheckpointGateLever (hero prop, composes GearLever's pulled 0..1 mechanic with new
  barrier-arm/pivot-bolt/signal-housing geometry). MachineShadow promoted from a lost
  episode-local history into lib/kit.tsx (generalized, `grow` param).
- Hero-collision catch: all 4 writers-room pitches independently proposed a trembling pen, which
  the immediately prior dispatch (2026-07-21, KPBSD school policy) had just used. Pivoted to the
  checkpoint-gate lever before any scene code was written.
- Signature transition: a motion-blurred whip-pan from the MachineShadow/Moriarty beat into
  Sarah Hollister's yard, closing the panel's most-cited motion-craft gap this run (see
  strip_whip_pan.png).

## Voice
Gemini native TTS, voice Sulafat, model gemini-3.1-flash-tts-preview. Preset voice with a
SynthID watermark, NOT a clone. Best of 3 takes, WER 0.009, 42.8s. See vo_report.json.

## Music
"Frost Waltz" Kevin MacLeod (incompetech.com), licensed under CC BY 4.0.

## Deliverables
- 9:16 1080x1920 (TikTok cut) and 4:5 1080x1350 (LinkedIn feed cut, PRIMARY).
- LinkedIn caption (caption.txt): editor 8.6, scorer 8.52 vs ship 8.5.

## Gate record
Objective quality_gate.py: 10.0/10, all 15 checks pass (EVENT_CADENCE 0.0s dead gap, CAMERA_MOTION
all 3 moving shots clear the 30% floor). Subjective panel across 4 revision rounds: editor ship,
flow-critic ship, 3-judge scorer average 8.62/10 (8.68 / 8.60 / 8.58) vs the 8.6 threshold, 2 of 3
individually ship.

## Upgrades shipped this run
- Fixed a repeat-offender bug in scripts/render.sh (output paths silently resolved against the
  wrong directory) with a real code fix, not a second doctrine reminder.
- Solved EVENT_CADENCE's self-referential percentile-floor whack-a-mole with a documented,
  reusable "spread wash" technique.
- Closed a motion-craft gap by applying the engine's existing (but previously unused) MotionBlur
  helper to a scene transition.
- Extended the idle-life system to more character poses with a per-character intensity control.

See docs/RUN_UPGRADES.md for the full retrospective.
