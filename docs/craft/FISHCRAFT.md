# FISHCRAFT — the fish-realism doctrine (2026-07-21 fish-mastery session)

Owner directives that created this: "master the fish artwork since AK is all about fish and
ocean life", "salmon are silver and scaly and shiny, not red", "research realism so you can
really give the fish depth and shine and better motion graphics", "do them all in depth and
with a wow factor". Engine: `video-engine/src/lib/fishcraft.tsx`. Species compose it in
`lib/fauna.tsx` (Salmon/sockeye, Coho, RainbowTrout, Halibut). Audition sheet:
`FishShowcase.tsx`.

## Why fish look fake (the failure modes we fixed, in taste-loop order)
1. FLAT FILL = rubber bath toy. Fix: the chrome layer stack (below).
2. Uniform big scale tile = roe/chain-mail. Fix: fine 13x10 half-offset shingle rows,
   masked so scales whisper except where light rakes the mid-flank.
3. Full-length white spec band = a rod skewering the fish. Real chrome dies over the caudal
   wrist. Fix: spec band/glint stroked with a head-to-tail fade gradient + sub-ranged rails.
4. Sine body profile that saturates early = the rear quarter collapses to a rod. Real salmon
   keep a caudal wrist about 9 percent of body length. Fix: wrist FLOOR in dTop/dBot.
5. Outline built from TWO concatenated subpaths = each auto-closes with a straight chord:
   phantom lines + an unfilled background wedge through the body (read as a fake "shine
   stripe" for three rounds before diagnosis). Fix: ONE closed loop through top rail +
   reversed bottom rail.
6. uid() pure-hash ids collide for same-position instances and cross-wire gradient defs
   (ocean fish picked up spawn-red). Fix: include EVERY variant prop in the uid input.
7. Stroke + feGaussianBlur + multiply on thin geometry renders as a hard dark bar. Fix:
   filled band shapes with their own opacity gradients, never blurred strokes.

## The chrome layer stack (FishSurface, back to front)
1. Countershade gradient: dark back, bright upper flank, white belly (5 stops).
2. Shingle scale pattern, region-masked (strongest on the raking mid-flank).
3. Form shadow: FILLED lower-flank band, own vertical opacity gradient (max ~0.11).
4. Soft specular band riding rail 0.3, screen blend, blurred, FADED head-to-tail.
5. Hard waterline glint at rail 0.26 (crisp against the soft band = wet metal).
6. Iridescence puddle over the gill/shoulder, overlay blend, drifts with yaw; keep it OFF
   the belly (low placement reads as a bruise).
7. Warm belly bounce light, soft-light blend.
8. Optional caustic dapples for submerged scenes.
9. Species markings (spots, stripes, stipple) INSIDE the clip, over the sheen.
10. Rim light along the dorsal contour.

## Swim (makeSpine; sources: carangiform locomotion literature incl. PNAS 2021)
- Traveling wave: lateral(s) = A(s) * sin(2 pi s / lambda - phase), amplitude ~s^2 tailward.
- Tail pitch LAGS heave ~90 degrees: the figure-8 tail path emerges, never authored.
- Head counter-yaw (small, opposite phase). Asymmetric gill pulse: max(0, sin).
- Buoyancy bob + roll on irrational periods (2.4 s / 3.1 s) so idle never loops visibly.
- Fin membranes ripple root-to-tip with phase lag (FinMembrane), each fin on its own phase.

## Species field marks (verified vs ADFG/NOAA references)
- SOCKEYE ocean: chrome silver, blue-green back, fine back stipple, NO large spots.
  Spawn: scarlet body, olive-green head, male hump + hooked toothy kype, drab unspotted tail.
- COHO ocean: brilliant chrome; small black spots on back + UPPER tail lobe ONLY; white gums.
  Spawn: dark olive head/back, maroon-brick flanks, modest hump.
- RAINBOW TROUT: olive back, PINK lateral stripe gill-to-tail + rosy cheek, profuse small
  spots above the line and on dorsal/adipose/BOTH tail lobes, squared tail, small mouth
  ending under the eye.
- PACIFIC HALIBUT: right-eyed flatfish; elongated diamond; BOTH eyes stacked on the dark
  mottled eyed side; continuous undulating dorsal + anal fringes (tapered to points at both
  ends or they read as a barrel rim); broad crescent tail; lateral line arches high over the
  pectoral.

## Usage
- The SILVER/chrome phase is the DEFAULT hero look (owner law). Spawn colors only when the
  story is literally about spawning rivers.
- Audition any new species or phase on FishShowcase (still at frame 20 + a second frame ~50
  to verify the swim reads) before it appears in an episode.
