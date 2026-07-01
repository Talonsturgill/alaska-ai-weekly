# Smooth-Morph Proof — rich worlds, seamless transitions

A 16-second, 9:16 proof of the two upgrades in `../CINEMATIC_SCENE_CRAFT.md` §1.5 (smoothness) and §3.5
(rich illustration): three **richly-illustrated** worlds joined by **true geometric morphs** — no hard cuts.

## The idea
One polyline threads all three worlds, interpolated point-by-point so each world *continuously becomes*
the next (not a dissolve over two pictures — the actual geometry tweens):

| # | world | illustration |
|---|---|---|
| 1 | KENAI watershed (top-down) | noise-hillshade terrain relief, moss river ribbon, haze |
| 2 | run-curve data panel | perspective vanishing-point grid, dashed escapement goal, rising vermilion curve, data motes |
| 3 | aurora mountain (night) | 3 parallax ridge layers, snow-lit rim, animated aurora curtains, starfield |

- The river's meander **straightens into** the run-curve; the curve **rises and thickens into** the ridge.
- A single **vermilion value** is carried across every transition as the still point (river node → curve
  peak → summit).

## Verification (the sophisticated result: total world-change, zero jump)
Measured on the rendered frames (downsampled per the SCENE_STRUCTURE method):
- **Smoothness** — peak per-frame change *inside* each morph: **2.48** (river→data) and **2.15**
  (data→mountain). A hard cut spikes ~20–40; these never jump.
- **Distinctness** — settled worlds are **49.6** (river↔data) and **45.2** (data↔mountain) apart, vs a
  **0.54** within-world baseline. Genuinely different worlds.

So the transition per-frame delta is ~2 (smooth) while the cumulative change is ~48 (a complete world
change). Smooth transitions *between* distinct worlds — not one world zoomed.

## Note it forced (gate reconciliation)
Because a smooth morph has **no per-frame spike**, the original SCENE_STRUCTURE gate (which looked for a
spike ≥ 5 to call a cut "real") would wrongly reject it. The gate was updated to measure a genuine
**world change** across each shot boundary (settled-frame difference — a morph *or* a cut both clear it; a
zoom of one canvas does not), so the render gate now accepts smooth morphs and still fails a oner.

## Files
`code/demo_smooth.py` · `storyboard.json` (Gate 0 board) · `contact.png` · `stills/`.
Built on `dispatch_core` (`carry_token`, `finish`, type). A technique proof, not a published dispatch.
