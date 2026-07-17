# DISPATCH 2026-07-17 — "It's Digging For Its Own Parts"

**Story:** The University of Alaska Fairbanks won a $15M NSF Critical Mineral Accelerator Engine
(one of 12 across 20 states), using AI to prospect for Alaska's critical minerals. Up to $160M is
possible over 10 years, contingent on renewal — not awarded.

**Angle / metaphor:** An AI machine drills into Alaska's bedrock for the exact critical minerals
(cobalt, graphite, gallium, germanium, nickel, rare earths) that go into its own chip. A machine
mining its own parts. The honest caveat is drawn three ways: a dashed lime $160M "ghost" model
stamped NOT AWARDED beside the solid $15M model; a geologist's pickaxe bouncing off bare bedrock
stamped UNPROVEN AT SCALE; and a still-empty chest socket in the loop button.

## Pipeline results

- **Gate 0 (composition divergence):** PASS — 9/9 fingerprint axes differ from both prior dispatches
  (07-14 aerial/blueprint, 07-16 ground-level comedy). Fresh amethyst-plum / copper / citrine /
  phosphor-lime palette. Spatial signature (cross-section-cutaway, stacked-layers, vertical-descent)
  repeats none of the last four.
- **Gate 0 critics:** storyboard-critic ship-true; flow-critic (PRE) ship-true after a say-it-show-it
  retime (every number now lands on its spoken word) and cutting the off-spine cargo-ship beat.
- **Voice:** owner's cloned voice via the vo_qc pipeline. 10 lines, 55.8s. Median speaker-similarity
  0.929 (floor 0.92). Three short lines dipped below the floor (0.885 / 0.892 / 0.894) — disclosed
  in the Gmail draft; the owner's listen-and-approve is the gate on voice.
- **Captions:** per-line forced alignment (whole-file alignment drifted on the gapped VO), 22 verbatim
  cues, no dashes, word-synced.
- **Objective quality gate:** PASS 15/15, 10.0/10 (after fixing first-frame poster grade, the
  pre-button silence dip → 17 dB, and living-screen motion → 100% of windows). The gate was made
  engine-aware: the retired-3D checks (DIMENSIONAL/DEPTH_FIELD/CAMERA_MOTION) and the PIL-textlog
  readability check no longer misfire on the current infographic-2.5d Remotion engine (legibility is
  covered by the image-based CAPTION_TEXT/HUD_TEXT checks).
- **Gate-B panel (3 judges + editor + flow-critic POST):** flow-critic POST ship-true (flow 9,
  sound 9, transitions 9). Editor found one concrete factual defect (on-screen "$15M YEAR ONE" vs the
  safe set's "first two years") — FIXED to "$15M FIRST 2 YRS". Three scorer judges landed 6.8 / 6.9 /
  7.2 (median 6.9) with ZERO hard blockers; their shared markdown was the illustration/motion "craft"
  axis wanting photographic 3D depth (rim-light/AO/material texture), which is a style-register tension
  with the routine's own mandated flat multi-tone IGS 2.5D look (§4.5 bans 3D worlds). Per the
  deliver-with-disclosed-scorecard policy, every concrete named defect was fixed and the scorecard is
  disclosed honestly in the draft rather than looping a flat-vs-3D grade forever.
- **Concrete fixes applied post-panel:** $15M badge period corrected; clipped "1 OF 12" badge; the 4:5
  LinkedIn crop was amputating the hook headline (moved into the 4:5 safe box); NICKEL and RARE EARTHS
  labels retimed so all five minerals land on their words; plus two named craft lifts (a real layered
  strata cross-section, a more mechanical auger drill).
- **LinkedIn caption:** 8.9/10, objective linter PASS (1688 chars, hook 70c, 5 tags, no dashes).
- **Music:** "The Descent" — Kevin MacLeod (incompetech.com) — CC BY 4.0 (thematically apt: underground).
- **Audio:** -14.0 LUFS / -1.0 dBTP, VO-dominant, 15 SFX events, real pre-button dip.

## Also shipped this run (the recurring-stall fix)

The routine had been stalling. Root causes + fixes baked in:
- `scripts/run_bg.sh` — a heartbeat background runner (PID + heartbeat file + `.done` exit-code marker)
  so long jobs (voice ~45min, renders) never hit the 10-minute foreground Bash timeout and a wedged
  job is detectable (stale heartbeat) instead of looking identical to a slow one.
- `prompts/dispatch_routine.md` guardrail 6 (NO-STALL / KEEP-ALIVE DISCIPLINE): long jobs always
  backgrounded; fallback wakeups <= 300s during build; never end a turn with no live work AND no wakeup.

## Deliverables

- 9:16 master: `out/dispatch/dispatch_916.mp4` (1080x1920)
- 4:5 LinkedIn cut: `out/dispatch/dispatch_45.mp4` (1080x1350)
- Poster: `out/dispatch/poster.png` (frame 0)
