# HOOK CRAFT — the first 1.3 seconds (muted-feed cold-open engineering)

**Why this doc exists.** The 2026-07-11 panel scored Hook 7/10: *"moody contemplative open,
premise legible but soft — real sag risk on a muted phone scroll; watch-through likely,
scroll-stop not guaranteed."* The data says that profile bleeds: 50-60 percent of short-form
drop-off happens in the first 3 seconds, ~80 percent of LinkedIn plays are muted, the
pre-attentive "swipe or stay" decision lands around 1.3s, and watch-time drives ~40-50 percent
of ranking — an early drop suppresses distribution to everyone. A slow atmospheric open IS the
pattern the scrolling brain is trained to skip. The fix is not clickbait; it is arriving loaded.

## The frame-1 poster law

- **Frame 1 is a designed poster, never a fade-in.** Full exposure at frame 0: the strongest
  visual + the claim burned in. No fade-up from black, no slow reveal.
- **The headline**: 5-8 words max, the verified arresting fact or question ("THE FORECAST READS
  THE AIR 5x TOO CLEAN"). Bold weight, >= 48pt-equivalent, high-value ink on a scrim/shadow —
  it must survive the 120px-wide shrink test. Held on screen >= 2s; its entrance animation
  <= 0.5s (or none).
- **Contrast is pre-attentive**: guarantee the headline against the footage (scrim) and let the
  frame's color anomaly (the blood-orange disk, the mint line) fight the feed's dominant hues.
- **Front-load the single strongest visual.** A hero image saved for 0:20 is seen by half the
  people who saw 0:01. If the best image is the payoff, design a second-best tease for frame 1.

## Motion by 1.3 seconds

Something must be VISIBLY changing within the first second — anomalous, not merely pretty:
smoke actively rolling and thickening, an instrument spiking, a count climbing, action already
underway (in medias res). A slow eased push over static scenery is drift, not a hook. Premium
register means documentary-legitimate motion (a decisive push, an accelerating timelapse, a hard
first beat) — never gimmick speed-ramps.

## Four cold-open patterns (credible science-doc register — declare ONE per Dispatch)

- **anomaly-question**: the strange fact made visual + the question as the headline. ("Why is
  the sun red at noon?")
- **in-medias-res**: the story's action already underway at frame 1; context backfills.
- **bold-claim**: a high-contrast card stating the verified arresting number, then cut to world.
  Premium because the claim is factual.
- **stakes-antagonist**: lead with the threat/force at the story's center (the fire, the smoke,
  the flood curve), established immediately.

## The loop-back ending

The last 3 seconds must rhyme with the first 3 (image or line callback) so the loop feels
continuous — total-watch-time and completion are ranking inputs on both platforms. Test: play
tail against head; it should feel like one motion.

## Platform deltas

- **TikTok**: zero dead air tolerance; hook text can run curiosity-gap; consider the tighter cut.
- **LinkedIn**: insight-register hook ("the stakes / the finding"); more patience for complexity,
  none for fluff; early engagement gates reach (golden-hour test), so the hook is MORE
  front-loaded, not less.

## Enforcement

1. **PLAN**: storyboard.json declares a top-level `hook` block:
   `{"pattern": <one of the four above>, "frame1": "<what frame 0 shows, fully exposed>",
   "headline": "<the burned-in text, 5-8 words>", "motion_by_s": <float <= 1.3>,
   "loopback": "<how the tail rhymes with the head>"}`. storyboard_check fails without it,
   validates the pattern vocab and the headline word count.
2. **VERIFY (objective)**: quality_gate FIRST_FRAME check — frame 0 must carry poster-grade
   ink: edge energy (|laplace| mean) >= 4.0 AND luma std >= 30. (Calibration: the criticized
   2026-07-11 frame 0 scores 2.55 edge energy — no headline — and FAILS.) HOOK_WINDOW check —
   the first two 2s LIVING_SCREEN windows must clear min_regions (the 07-11 artifact failed
   its 0s and 2s windows; a hook may never be the quietest part of the film).
3. **JUDGE**: the storyboard-critic red-teams the hook block for register (credible, not
   clickbait) and for whether frame1 + headline + motion actually deliver the declared pattern.

## SOURCES

TikTok for Business 3-second data + retention-curve analyses (OpusClip, SociaVault,
humbleandbrag); pattern-interrupt visual science (Ardena, Klypse, Promo); text-overlay and
first-frame conventions (Digital Zoom Studio, miraflow, overlaytext); LinkedIn video behavior
and specs (Gorilla Creative, Visla, Fliki); cold-open patterns (Wistia, authorflows, Wikipedia);
loop-structure retention (virvid, Mario So).
