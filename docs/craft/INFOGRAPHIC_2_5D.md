# THE 2.5D INFOGRAPHIC DOCTRINE (supersedes DIMENSIONAL_CRAFT.md, 2026-07-15)

## Why the 3D engine was retired

The dimensional raymarcher produced *scenery*, not *story*: a landscape per shot with the actual
narrative relegated to HUD text on top, at a cost of 2-5 hours of CPU per render. The owner's
verdict on the final 3D dispatch ("The Claim on the Tundra"): worst one yet. The reference point
for what these videos SHOULD be is The Infographics Show: flat 2D/2.5D, story-first, where every
element on screen carries narrative information, produced at daily cadence precisely BECAUSE the
system is built from fast, reusable flat assets.

## The law

**Every on-screen element must be a story element.** An icon, a map, a counter, a chart, an
arrow, a character silhouette, a labeled diagram — each one exists because the narration needs
it at that moment. If an element only sets a mood, it does not go on screen. There is no
"background scenery" budget. The 2.5D feel comes from parallax layers, scale/slide/pop easing,
and drop shadows on flat art — never from rendering a 3D world.

## The engine: Remotion (video-engine/)

- React-based programmatic video. Text, SVG, CSS, charts, counters, maps are native citizens.
- 1080x1920 @30fps master composition "Dispatch"; a 60s video renders in MINUTES on this
  container (measure and log per run), vs hours for the raymarcher.
- License: free for individuals / companies of 3 or fewer people (remotion.dev/docs/license).
- Per-run data (the storyboard: beats, numbers, labels, palette) is injected as JSON props
  (`--props=storyboard.json`) — the SCENES are code, the STORY is data.
- Reusable scene component library grows over time (this is how daily cadence gets cheap):
  MapPin, CounterUp, StatBar, VsSplit, PaperStack, TimelineBar, QuoteCard, IconRow, HookTitle.
  Add a component when a story needs it; reuse it forever after.

## The beat grammar (unchanged in spirit, cheaper in execution)

- 12-16 beats / ~60s, each beat = ONE new story-advancing visual (a number lands, a map pin
  drops, a bar overtakes a baseline, a stack grows). Say-it-show-it: the visual appears within
  ~0.5s of the narration saying it.
- Numbers are numerals, animated (count-up, bar-grow), and only fact-check-safe values appear.
- Shots = scene components swapping via motivated transitions (slide, wipe, scale-through),
  a scene change every ~8-12s. Camera moves are CSS transforms on layer groups (parallax),
  not a virtual 3D camera.
- Captions: word-synced from FORCED ALIGNMENT of the final VO (scripts/align_captions.py,
  faster-whisper word timestamps, ±50-100ms). NEVER approximate caption timings. NEVER
  time-stretch audio to fit; trim the SCRIPT to length instead.

## Voice (the other half of the 2026-07-14 failure)

- The narrator is the owner's cloned voice, synthesized ONLY through the QC pipeline
  (.claude/skills/alaska-dispatch/vo_qc.py): full-sentence chunks, N candidates per line,
  faster-whisper transcript validation, resemblyzer speaker-similarity scoring against
  assets/voice/talon_ref_cond.wav, best-candidate selection with seed re-rolls.
  cfg_weight stays at 0.5 (lowering it reduces adherence to the owner's voice — that is
  how the accent drifted). A per-line similarity floor gates delivery; a full-read similarity
  report goes in the Gmail draft.
- No atempo. No per-fragment synthesis. No unreviewed voice recipe changes (owner sign-off rule
  in config/voices.yaml still stands).

## Quality gates

The objective gate keeps its spirit (legibility, cadence, sync, sound, first-frame) but the
3D-specific checks (DIMENSIONAL / DEPTH_FIELD / CAMERA_MOTION via render manifest) are replaced
by 2.5D checks: STORY_DENSITY (every beat introduces a nameable story element), say-it-show-it
lag, and caption alignment error (measured against the forced alignment, must be < 150ms median).

## The bridge: where the intelligence goes (added after the 2026-07-15 style study)

The 2026-07-14 failure was not a rendering failure, it was an ALLOCATION failure: the routine
spent its intelligence on rendering mechanics and none on visual translation. The fix is
structural, in order:

1. **The visual sentence pass (Phase 4).** For every VO line: "what literal cartoon do we draw
   while this is said?" — subject (a character/characterized object with a face and an emotion),
   action (a visible verb), annotation (the number/label/arrow that lands with it). Recorded as
   beats[].draw. If it can't be phrased as "X does Y," it's a slide, not a beat.
2. **The style grammar** (from studying real IGS frames, saved refs in the session archive):
   ink outlines on everything; base+shade+highlight tones; faces with expressions; 20+ shapes
   per hero object; fat outlined arrows; shouty boxed labels; starburst badges; saturated
   radial-burst backgrounds. Exemplar component held to this bar: video-engine/src/IGSHook.tsx.
3. **The taste loop (Phase 5).** Renders cost ~60s, so LOOKING is mandatory: extract frames of
   every scene, run the five-question check (face? visible verb? outlined+shaded? number drawn?
   holds up next to a real IGS frame?), iterate 3-5x. The craft comes from the iteration the
   old engine priced out.
4. **The compounding library.** Every rig/arrow/badge/map built for one dispatch is reusable;
   per-run effort goes into 1-2 NEW bespoke hero illustrations, not re-plumbing.
