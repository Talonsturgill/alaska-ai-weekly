# ALASKA.AI — World-class upgrades (authoritative add-on to ROUTINE_SPEC.md)

Goal: every Dispatch is a BANGER — world's-greatest-tier motion illustration, never slop,
never the same. This is where we leverage agents to do what a whole human studio does.
Grade against `config/dispatch_rubric.yaml` (ship_threshold 9.0). Inspired in part by the
"taste-skill" idea of quantifying taste into adjustable dials.

## 1. Anti-slop creed
Default AI output is generic. Refuse it. Every choice is deliberate. No template energy, no
stock-fill flatness, no linear motion, no "always blue." If a frame could belong to any brand,
it fails.

## 2. Taste dials — set per Dispatch (record in state.yaml > dispatch_history)
Quantify the look so variety is intentional, not random. Pick 1-10 per story:
- DESIGN_VARIANCE (1 centered/classic ↔ 10 asymmetric/experimental)
- MOTION_INTENSITY (1 calm/floating ↔ 10 kinetic/cut-driven)
- VISUAL_DENSITY (1 spare/negative-space ↔ 10 dense/data-rich)
- COLOR_BOLDNESS (1 muted/tonal ↔ 10 saturated/high-contrast)
- TEXTURE_GRAIN (1 clean ↔ 10 filmic/tactile)
- GRADE_STRENGTH (1 natural ↔ 10 heavy cinematic grade)
Vary the dial settings run-to-run; don't repeat last week's profile. Justify each setting from
the story's mood in one line.

## 3. Style modes — pick ONE to fit the story (a coherent vibe over the concept archetype)
- naturalist-illustration (lit, textured, organic — wildlife/landscape)
- editorial (Bloomberg/print-graphic — policy/economics/data)
- field-HUD / instrument (telemetry, readouts — sensors/AI/defense)
- cinematic-doc (filmic, atmospheric — human stakes)
- data-brutalist (Swiss type, hard grid — numbers-forward)
- soft-premium (calm, whitespace, spring motion — reflective)
Mode sets type treatment, motion feel, and density defaults; the color world is still chosen
fresh per story.

## 4. Storyboard / previz GATE (GATE 0 — before any rendering, ENFORCED)
Elite teams board before they build. This is now a HARD, machine-checked gate (ROUTINE_SPEC Phase 4.5),
not a paper habit — because the routine's worst failure is shipping last week's composition with a new
hero. SLOW DOWN here; designing on paper is nearly free, re-rendering is not.
Produce the board in TWO files:
- out/dispatch/storyboard.md — the 12-16 beats (one-line composition + motivated-transition + meaning
  per beat, ENDING included), palette swatches, chosen STYLE MODE + TASTE DIALS, and 1-2 named
  world-class references you're matching.
- out/dispatch/storyboard.json — the COMPOSITION FINGERPRINT: a primary tag for each of the 7 axes in
  config/composition_axes.yaml (pov, motion_vector, hero_treatment, layout, register, palette, metaphor),
  derived_from: scratch, the beats, and a >=120-char divergence_note.
Then pass BOTH halves of Gate 0:
- 0A OBJECTIVE: `python scripts/storyboard_check.py` exits 0 — your fingerprint must differ from each of
  the last 2 dispatches on >= 4 of 7 axes, hold a unique (pov, layout, motion) signature vs the last 4,
  and not repeat a recent palette. It refuses an incomplete board or one not built from scratch. You
  redesign to pass; you never relax the rule.
- 0B TASTE: ONE no-spawn `storyboard-critic` agent red-teams the board for GENUINE divergence (would a
  muted viewer call it a different video, or the same template re-skinned?), silent-first storytelling,
  and "does it bang." Fix on paper and re-run until ship:true.
Only then build — and build the scene FRESH (import shared helpers from out/dispatch/dispatch_core.py;
never `cp` a prior render and re-skin it). This saves the most time and catches the most mistakes cheaply.

## 5. Illustration-detail craft bar (the "video detail" that takes humans ages)
Hand-coded, but it must read as designed and lit, not flat clip-art:
- LIGHTING: a key direction + soft fill + a rim/back light on the hero. Shade with gradients,
  not flat fills.
- CONTACT SHADOWS / ambient occlusion where forms meet; never pure-black — tint toward the scene.
- MATERIAL + TEXTURE: subtle surface texture/noise so planes feel tactile (water, ice, metal, fur).
- SECONDARY ANIMATION + follow-through: the subject genuinely MOVES (swim cycle, flow, rotation,
  drift); child elements lag the parent 2-4 frames. No bobbing static sprite.
- OVERSHOOT + settle on entrances (5-15%); anticipation before big moves; nothing linear.
- DEPTH: multiplane parallax (bg 0.3 / mid 0.4 / fg 0.5), depth-of-field blur on non-hero planes,
  atmospheric perspective (cooler/lower-contrast in back).
- 180° MOTION BLUR on anything that moves (sub-frame accumulation, 8-16 samples) — the #1
  "why does this look cheap" fix.
- Hand-made imperfection: tiny irregularity beats sterile geometry.
- Render hero + type at 2-4x supersample, downsample LANCZOS; dither gradients (no banding).

## 6. Critic panel — the virtual studio (leverage agents; all no-spawn)
After the build, convene an adversarial review board: spawn independent no-spawn critic agents,
ONE per lens, each told to be a harsh expert and return a 0-10 + the top 3 concrete fixes:
- cinematography/composition  - animation/motion craft  - illustration detail/lighting
- color/grade  - sound design/mix  - typography/captions/legibility
- fact-checker (re-verify on-screen claims)  - Alaska authenticity  - retention/"does it bang"
Aggregate with the `scorer` (against dispatch_rubric.yaml) and the `editor`. Apply the fixes,
RE-RENDER affected ranges, and re-convene the panel. ITERATE until score >= 9.0 AND no hard
blocker AND no lens is below 7. Spend tokens freely; do not ship a piece that hasn't cleared
the board. (Keep it bounded/non-recursive: many critics, one level, none may spawn agents.)

## 7. Reference benchmarking
Each run, name 1-2 world-class touchstones (e.g. Kurzgesagt depth/lighting, Bloomberg/Vox
editorial clarity, a Buck-style motion moment) and explicitly match that bar in the board and
the panel review. "Is this as good as <reference>?" is a gate question.

## 8. Retention / hook engineering (LinkedIn primary + TikTok)
- First FRAME is a designed poster, never black/blurry. First 1-2s lands the hero + the tension.
- A pattern interrupt every ~3-5s (reveal, scale, cut, color shift) so attention never sags.
- The thesis pays off the hook; the last beat invites a comment (LinkedIn) and is loop-friendly (TikTok).
- Captions always on (muted viewing); keep key content in the centered 4:5 safe box.

## 9. What takes a human studio time → which agent does it (all no-spawn)
- Research + fact-check → researcher / validator agents (Phases 1-2)
- Storyboard red-team → 1 critic agent (Phase 4 gate)
- Frame-by-frame QA → you, via dense contact sheets + zoom-ins (Phase 6)
- Multi-discipline review → the critic panel (this doc, §6)
- Copy/voice critique + grade → editor + scorer agents
You orchestrate; they specialize. Go wide, stay one level deep, never let an agent spawn agents.
