# ENGAGEMENT — keep a viewer hooked every single second

Upgrade #3 from `docs/UPGRADE_BACKLOG.md`. Synthesized 2026-07-20 from four research
fan-outs (raw findings + sources: `docs/research/engagement/*.json`). This is the
second-by-second doctrine; the never-rest gate was the floor, this is the ceiling.

Owner's framing: attention spans are short; the win is not just illustrating the
narration but keeping something NEW and genuinely COOL happening on screen every
second, so the eye never has a reason to leave.

## 1. The retention curve (what we're fighting)

- 50-60% of all abandonment happens in the FIRST 3 SECONDS. The median scroll-or-stay
  decision lands at ~3.1s. The first 3s set the ceiling for the whole curve.
- Second cliff: the 25-35s drift. New viewers sag there unless something re-grabs them.
- Completion + rewatch are the dominant 2025-26 ranking signals (each Shorts loop counts
  as a view since 2025-03). A loopable ending is a distribution feature, not a flourish.
- Our 60-75s format sits in the 40-55% expected-retention band; every rule below exists
  to fight that number upward.

## 2. The cadence law (beats)

1. **Front-load**: the first 10s carry the highest visual-change density of the piece
   (>= 3 beats in the first 10s; first beat lands by 1.5s). MrBeast: "the first minute
   is the most important minute" — for a 60s piece, that's the first 10s.
2. **Never-rest floor**: a story-advancing change every <= 5s (existing gate).
   Target median gap 2.5-4s.
3. **NO METRONOME**: never 3+ consecutive near-identical gaps. Fixed cadence habituates
   ("the brain detects the pattern and stops reacting"). Jitter the intervals: 2.5s,
   4s, 3s — never tick-tick-tick.
4. **Re-hook**: one beat in the 25-38s window must be a deliberate RE-HOOK — an
   escalation, a promise-payoff, a "that's not even the crazy part" turn — not just the
   next beat in line. Declare it (`beats[].rehook`).
5. **Back-half holds**: after ~40s viewers watch semi-passively; slightly longer holds
   are allowed (never past the 5s floor). Spend the saved density on the button.

## 3. The reveal grammar (how a beat lands COOL, not just clear)

Every major reveal follows **telegraph -> disclose -> hold**:

- **Anticipation** (6-12 frames): a small opposing prep move — pull-back, dip,
  compress — before the payoff. Length sets tone: long build = suspense, short = snap.
- **Disclose** with the right primitive for the content:
  - `scaleFromAnchor` — icons, badges, chips
  - `maskWipe` — text blocks, photos, map fills
  - `trimPathDrawOn` — routes, connectors, diagrams (chain + stagger = build-on assembly)
  - `morphToChart` — object dissolves into its data form (fake-morph: crossfade + drift)
  - `scalePullback` — the TRUE-SCALE whoa: tight detail, pull out to context.
    **At least one scale-class reveal per piece**, aligned to the story's escalation.
- **Hold** (0.4-0.8s): a still beat after the reveal lands. The pause IS the
  punctuation. No motion during the hold; the next beat starts after it.

## 4. Motion quality (the premium tells)

- **No linear easing, ever** (the #1 amateur tell). Tokens in `lib/motion.tsx`:
  `EASE.enter` (strong ease-out) for entrances, `EASE.move` (ease-in-out) for moves,
  `EASE.overshoot` for confident landings.
- **Overshoot budget: ONE element per frame** (usually the key number). Overshoot
  everywhere = cheap everywhere.
- **Nothing lands simultaneously**: primary settles first, secondaries trail 50-100ms,
  shadows/accents lag with lower amplitude. Multi-element blocks cascade at 60-90ms/item
  (a reading path, not a pop-in).
- **Duration bands**: micro-moves < 300ms; transitions 400-600ms; cinematic reveals
  0.8-2s; hero moments 1-3s.
- **Every move resolves** to a strong static frame. Motion arrives somewhere.
- Squash/stretch on impacts resolves within ~150ms; secondary motion never rests
  (that's LIVING_SCREEN's floor).

## 5. The interrupt taxonomy (vary the WEAPON, not just the timing)

hard-cut context switch (backbone) / zoom-punch (key stat) / b-roll flash (novelty
insert) / stat-card kinetic text (every number on screen, synced to the spoken word) /
scale-reveal (the wow, 1+ per piece) / palette-flip (section boundary) / whip-pan
(energy bridge) / reaction insert (re-hook, comedy) / sound accent (pairs with all of
the above; silence is an interrupt too) / ambient motion + texture (keeps quiet
stretches alive).

Rules: max 2 simultaneous interrupt types in any ~1s window (deliberate disruption,
not digital whiplash). Never the same interrupt on a fixed interval 3+ times.
Section boundaries get a high-salience interrupt (palette flip or whip-pan + label).

## 6. Sound (the other half of every beat)

- Master -14 LUFS integrated, true-peak <= -1.0 dBTP (existing audio gate).
  VO > music (ducked >= 6dB) > SFX accents (3-4dB under VO peak, high-passed ~120Hz,
  presence 2-5kHz so they cut without masking).
- **Impact SFX land +2 to +5 frames AFTER the visual event** (~85-210ms), never on the
  exact frame — punchy, not mechanical. Comedy/payoff stingers +0.2-0.5s after the beat.
- Music **drop-to-silence (0.3-0.8s) or section switch before each major reveal**; the
  energy curve rises into the payoff. One audio interrupt in the 25-35s window.
- VO pace 150-175 WPM for this format (warn under 130 / over 190). 60s of VO is
  ~100-150 words; the hook line lands inside 2s.
- Every transition/reveal has a matched sound event (existing SFX_EVENTS gate).

## 7. Frame discipline (what "cool" looks like when nothing moves)

- **One read per frame**: a single focal element (thirds + silhouette clarity); all
  else subordinate.
- **Depth over width** in 9:16: 3+ z-layers with parallax + atmospheric fade
  (= Stage3D planes + Atmosphere; that's WHY the 2.5D engine exists).
- **Rim-light separation** on the hero + slight background darken on hero frames.
- **Palette discipline**: limited palette, ONE accent hue spent once per frame as the
  focal signal. An off-palette element auto-reads as "look here" — don't waste it.
- Texture keeps static assets alive (grain/materials — `lib/materials.tsx`).

## 8. Enforcement map (who checks what)

| Rule | Where enforced |
|---|---|
| First beat <= 1.5s, hook pattern + loop-back | storyboard_check.py hook block (existing) |
| >= 3 beats in first 10s (front-load) | flow_check.py FRONTLOAD (new) |
| Gap <= 5s, median 2.5-4s | flow_check.py (existing) |
| No 3+ near-identical consecutive gaps | flow_check.py METRONOME (new) |
| Re-hook beat declared in 25-38s | flow_check.py REHOOK (new) |
| >= 1 scale-class reveal per piece | storyboard_check.py REVEALS (new) |
| Reveal grammar (anticipate/disclose/hold) | storyboard-critic + flow-critic (doctrine) |
| VO pace 130-190 WPM | flow_check.py WPM warn (new) |
| -14 LUFS / VO dominance / SFX events | audio gate + quality_gate.py (existing) |
| LIVING_SCREEN 3+ motion regions | quality_gate.py (existing) |
| CAMERA_MOTION real parallax | quality_gate.py (existing) |
| Easing/overshoot/stagger/hold quality | flow-critic POST pass (doctrine) |
| Max 2 simultaneous interrupts | flow-critic (doctrine) |

The critics read THIS file. When a critic and this doc disagree, this doc wins until
the retrospective amends it.
