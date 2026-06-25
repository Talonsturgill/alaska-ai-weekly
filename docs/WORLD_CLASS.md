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

## 4. Storyboard / previz GATE (before any rendering)
Elite teams board before they build. Produce a 1-page board: the 6-9 beats, a one-line
composition + motion note per beat, the palette swatches, the chosen mode + dial settings, and
1-2 named world-class references you're matching. Run ONE no-spawn critic agent to red-team the
board (clarity, freshness, does it bang, does it serve the story). Fix on paper. Only then build
— this saves the most time and catches the most mistakes cheaply.

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
