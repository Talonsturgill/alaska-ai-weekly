# ALASKA.AI — Video Production Standard (v1)

The reusable pro playbook for Alaska.Ai "Dispatch" videos. Hand-coded Python
(PIL + numpy) + ffmpeg, 30fps. Numbers are load-bearing defaults, not vibes.
Derived from a 2026 research pass across motion design, color science, underwater
rendering, sound, Alaska authenticity, and platform delivery (sources at bottom).

## 0. The seven principles
1. **Illustration leads; the voice follows.** Your craft is hand-coded illustration that
   DEPICTS the story (object/process/place/data), legit-looking AND entertaining. Sync the VO
   to the picture beat-for-beat — a motion-illustration piece the voice rides, not narration
   over a slideshow. Color is FREE per story (see ROUTINE_SPEC; "always blue" is wrong) — the
   brand throughline is the wordmark + Fraunces/JetBrains type + craft. Platforms: LinkedIn
   (primary) + TikTok → master 9:16 1080x1920, export a 4:5 LinkedIn crop.
2. **One hero per beat.** Decide the focal point before animating. Animate ONLY the hero;
   everything else is still or ambient. Clutter = "no one was in control."
3. **Restraint reads as expensive.** Slow, eased, patient, lots of negative space (30-50%
   of frame intentionally empty). The amateur instinct is more/faster motion; remove until
   only meaningful, gentle, cushioned moves remain.
4. **Motivated motion only.** A move must mean something. A baseline of stillness is what
   makes one slow push-in land. Never drift forever.
5. **Honest + local.** Pro-Alaska, never "Silicon Valley saves Alaska." Verify every fact;
   ship on measured numbers (audio + visual gates), not on the room.
6. **Open strong, CLOSE strong.** Every Dispatch has a deliberate arc — hook → body → a real
   ENDING. The first second earns the watch; the last ~6s earn brand recall and the follow. After
   the VO ends, BUILD A BRANDED OUTRO — wordmark sign-off + the tagline + a sources credit, revealed
   in staged beats — then a gentle cinematic fade. NEVER end on a static hold: the outro carries
   motion to the final frame (it is part of the EVENT_CADENCE gate). No proper ending IS a lame
   ending — design it from the first storyboard, don't bolt it on after.
7. **Every Dispatch is a new FILM, not a re-skin.** The enemy is bias to action: opening the repo,
   finding a render that works, copying it, swapping the hero, and shipping last week's composition in
   a costume. A new SUBJECT is not a new COMPOSITION. SLOW DOWN and design the picture from a blank page
   for THIS story — then PROVE it diverges before you build (Phase 4.5 / Gate 0). Divergence is measured
   across 7 axes (config/composition_axes.yaml): camera POV, motion vector, hero treatment, layout,
   register, palette, central metaphor. A real new film differs from the last one on most of these — not
   just the animal on screen. Reuse CRAFT by importing helpers (dispatch_core); never reuse a COMPOSITION
   by copying a scene file. If you can mute two of our videos and a viewer says "same template, different
   animal," we failed. (This is why the salmon that re-used the beluga's staging was rejected.)

## 1. Format & delivery (master once, crop per surface)
- **Master 4:5 portrait, 1080x1350** (matches our brief-image format; max mobile feed real
  estate on Facebook-primary + IG + LinkedIn). 1:1 (1080x1080) acceptable; 9:16 only if
  reframed with hero kept in the central 1080x1080.
- **Safe area:** hard floor 40px/side (content box 1000-wide). Premium margin ~80-110px
  (~8%). Keep all text/logo inside.
- **Encode:** MP4, H.264 High, 4:2:0, progressive; ~12-15 Mbps VBR 2-pass; closed GOP ~15,
  2 B-frames, CABAC; Rec.709 8-bit SDR; +faststart. Audio AAC-LC 48kHz stereo 256-320kbps.
  Upload richer than the platform keeps so its transcode starts clean. Don't ship HEVC to FB.
- **Loudness:** one master at **-14 LUFS integrated (dialog-gated), -1.5 dBTP**. Serves
  YT/TikTok/IG/FB/LinkedIn (all normalize *down*, never up — you can't out-loud the normalizer).
  Separate -23/-24 LUFS only for broadcast.
- **Poster/first frame:** a designed title/brand card, never black or a mid-blink frame.

## 2. Open captions (NON-NEGOTIABLE — most feed video is watched muted)
- Build captions FROM THE TTS WORD-TIMINGS (`vo60.py` writes `audio/words60.json`), never a
  hand-typed paraphrase — the on-screen text is exactly what's spoken, exactly when it's spoken.
  This is what the CAPTION_SYNC gate enforces.
- KINETIC, voice-synced reveal (MANDATORY — not a static slab):
  · Reveal LINE BY LINE — each line appears as the VO reaches it (line *i* at spoken-progress
    *i/total*), with a quick settle-in. This keeps long phrases visibly alive (so a multi-second
    caption never reads as a dead hold — it feeds the EVENT_CADENCE gate) and reads as designed.
  · Active-word emphasis (karaoke): the word being spoken is brand-accent (gold), already-spoken
    words bright snow-white, upcoming words dimmed. A thin underline tracks spoken time.
- Style: bold brand type (Fraunces ~54–58px or JetBrains Mono Bold) on 1080, white with a ~3px dark
  stroke; high contrast; never rely on color alone.
- Composite captions AND ALL HUD text AFTER the cinematic grade, so glyph edges stay razor-sharp —
  bloom/grain/CA must never soften them. This is the CAPTION_TEXT / HUD_TEXT legibility gate.
- Placement: lower third, inside the safe area, clear of the bottom ~10% where UI sits.
  ≤3 lines, ≤~20 chars/sec reading speed; hold each phrase ≥ its spoken duration.

## 3. Motion system
- **Easing (never linear — linear = massless/robotic).** Entrances: easeOutQuint/Expo.
  Camera/between-states: easeInOutCubic. Exits (30% faster): easeInCubic. Tactile pops:
  easeOutBack (overshoot 5-15%). One weighted overshoot max; 3+ oscillations = toy.
  Spring alt: zeta 0.65-0.75, response 0.3-0.55s. (Formulas in `easing.py`.)
- **Durations @30fps:** micro 2-5f; standard reveal 7-11f; hero/large move 12-18f; expressive
  21-30f. Sweet spot 100-500ms. Scale duration with travel distance.
- **Push-in (Ken Burns, restrained):** total scale travel **3-6% over 6-10s**, eased in/out
  with long shoulders. Zoom about frame center. 1-3% over 15s+ for prestige stillness.
- **Parallax:** 3-layer multipliers bg **0.3** / mid **0.4** / fg **0.5** (0.1 spacing reads
  as distinct planes); never exceed 0.7. Foreground may go 1.1-1.3x.
- **Idle "living stillness":** positional drift A=3-10px, P=6-12s, DIFFERENT periods on x vs y
  (e.g. x/9s, y/11s) so it wanders not circles; breathing scale A=1-2%, P=4-8s; rotation
  sway ≤0.8°. Sum two incommensurate sines. Scale amplitude by layer depth.
- **Motion blur (180° shutter = the #1 "why smooth math still looks cheap" fix):** sub-frame
  accumulation — render K=8-16 sub-positions across half the frame interval, average. Fast
  layers smear more automatically (reinforces parallax). Cheap fallback: directional blur of
  length 0.5·|Δpx/frame| along velocity.
- **Holds:** pre-roll still 0.5-1.5s → slow move → settle still 1-2s before any cut. Hold ~1s
  after the thesis line. Stillness is never truly static (keep idle drift under it).
- **Pacing (30s = 900f):** hook 0-2s (land hero by ~f45) → 3-4s establishing → 2-4s build
  beats trending shorter → payload thesis lands ON the stressed word/downbeat ~f630-720 →
  1s dead-still hold → resolution → 3s sign-off. Sync visual emphasis to stressed syllables.

## 3B. Visual storytelling — the picture carries the story (silent-first)
This is the battle. Most plays are MUTED, the feed is one thumb-flick from gone, and people remember
~65% of what they SEE versus ~10% of what they read. So the illustration is not decoration under the
voice — it IS the story. Test: mute the VO; if the picture alone doesn't tell it, the piece failed.

- **THE BEAT MAP (storyboard before you render).** Break the ~60s into **12-16 BEATS, ~3-4s each**.
  Every beat introduces ONE new visual idea that ADVANCES the story — a new element, a state change,
  a reveal, a reframe — never a repeat or a wiggle to satisfy a gate. Write the map first: per beat,
  (a) the ONE new thing on screen, (b) the MOTIVATED transition into it, (c) what it MEANS in the
  argument. The VO is then timed to RIDE the beats, not the other way around.
- **PROGRESSIVE DISCLOSURE (the open loop).** Never dump the whole diagram at once. Reveal one piece,
  let it land, then ADD or REPLACE the next as the VO reaches it. A picture that is still assembling
  is a question the viewer stays to see answered — that open loop is what beats the scroll.
- **VISUAL STATE EVOLUTION (show, don't say).** The scene's STATE must visibly change to mirror the
  arc: scattered→resolved, noisy→clean, frozen→thawing, unknown→measured. The transformation on
  screen is the message; the words just name it.
- **ONE CENTRAL METAPHOR.** Pick a concrete image that embodies the abstract AI mechanism and live in
  it (a detector = one voice pulled from a roar, made visible; a digital twin = a ghost copy of the
  ground learning ahead of the real one). Abstract idea → one thing you can SEE working.
- **MOTIVATED TRANSITIONS (the cut MEANS something).** Beat-to-beat, change with intent, not stock
  swipes. Vocabulary: MATCH CUT (a shape morphs into a kindred shape — a spectrogram peak becomes a
  mountain ridge — a thematic link); MORPH (one object becomes another = transformation); MASK / WHIP
  / push-through-a-shape (hide the cut, signal a jump in time or scale); FOCUS-PULL / IRIS (hand
  attention to the new hero); a hard CUT on the downbeat for emphasis. Fast change = energy/urgency;
  slow dissolve = reflection. The best transition is barely noticed — it feels like the next sentence
  of the picture, not a sticker between two shots.
- **ATTENTION STEERING.** Motion pulls the eye, so move ONLY the thing that matters this beat;
  everything else holds. Emphasize the word being spoken (scale / glow / underline / color) so eye
  and ear land together. ONE focal point per beat — never two things competing.
- **INSTANT CLARITY + ORIENTATION.** The first second states the premise visually (hero on screen by
  ~f30-45). Through the middle, the picture's own progression signals "where we are" in the arc so the
  viewer feels carried, not lost.
- **THE PERPETUAL RULE:** something STORY-ADVANCING happens on screen at least every ~4-5s, and it is
  a NEW idea or a state change, not motion for its own sake. The EVENT_CADENCE + BEAT_DENSITY gate
  checks enforce the floor; this section is the bar. *Why it works:* muted viewing makes the picture
  the story; each new on-screen idea is a micro pattern-interrupt that resets the "should I scroll"
  timer; progressive disclosure holds an open loop to completion; and visual memory dwarfs verbal, so
  the transitions and on-screen events ARE what they remember.

## 3C. Composition divergence — design a new film, then PROVE it (Gate 0)
The beat map (§3B) makes one video tell its story. THIS makes every video a DIFFERENT film. The threat
is structural sameness: re-using a working scene with a new hero. So before any frame renders, the
composition is FINGERPRINTED across 7 axes and machine-checked against history.
- **The 7 axes (config/composition_axes.yaml):** (1) POV/vantage — where the camera stands relative to
  the subject (in the water vs. looking at a screen vs. a cutaway vs. top-down map); (2) MOTION VECTOR —
  the dominant movement (horizontal traverse vs. vertical rise/descent vs. radial scan vs. push-in vs.
  scrolling data); (3) HERO TREATMENT — single organic hero vs. a multiplicity/run vs. landscape vs.
  instrument vs. data-as-subject; (4) LAYOUT — where load-bearing info lives (centered-hero+lower-third
  vs. full-bleed split vs. HUD/instrument frame vs. map vs. stacked layers vs. object-in-void); (5)
  REGISTER — naturalistic scene vs. instrument readout vs. editorial schematic vs. data-brutalist;
  (6) PALETTE — the color world; (7) METAPHOR — the one concrete image carrying the AI mechanism.
- **The rule (enforced by scripts/storyboard_check.py, Gate 0A):** differ from EACH of the last 2
  dispatches on >= 4 of 7 axes; the (POV, layout, motion vector) SPATIAL SIGNATURE must be unique vs.
  the last 4; palette must not repeat the last 2. Same signature = same video. The salmon re-skin had
  the beluga's exact signature (eye-level-immersive, centered-hero-lower-third, horizontal-traverse) and
  would have failed here on paper, before wasting a render.
- **Import craft, don't copy composition.** Shared, scene-agnostic helpers (fonts, the finish/grade,
  the caption engine, easing, craft) live in an importable core (out/dispatch/dispatch_core.py). A new
  scene IMPORTS them and is authored fresh; it never starts life as a copy of a prior render_*.py.

## 4. Visual finishing (apply as a final pass, in this order)
Work in **linear light** for tone/light math (sRGB→linear in, linear→sRGB out).
1. **Filmic tone map:** ACES (Narkowicz: a2.51 b0.03 c2.43 d0.59 e0.14, input ×0.6) or Hable.
2. **S-curve contrast** about pivot 0.18 (mild).
3. **Brand split-tone:** shadows → flag-blue/teal (~200-210°), highlights → Pantone gold
   (~45-50°). Weights: shadow (1-luma)², highlight luma². Subtle (≤0.10).
4. **Bloom + halation:** threshold highlights (luma>0.7) → big Gaussian blur → screen back at
   10-25%; halation = same, tinted warm, larger radius, lower.
5. **Vignette:** cos⁴ natural — `RI = 1/(1+(r/f)²)²`, f≈2-4 (corners 0.85-0.92 subtle).
6. **Chromatic aberration:** radial, 0 at center; scale k≈0.002-0.004 (≈4-9px corner sep at
   1080). Use little.
7. **Film grain:** ONE monochrome field added to luma only (never per-RGB → chroma blotches).
   σ≈6-12/255 (subtle). Midtone bell: amp = exp(-(L-0.40)²/(2·0.25²)). Grain size via
   Gaussian-blur the noise (renormalize). **New seed every frame** (film "dance").
8. **Dither gradients (TPDF) in float before 8-bit:** noise=(rand+rand-1)/255 per channel,
   then round. Kills banding in skies/water. (ffmpeg fallback: `gradfun`, and `-tune grain`.)
- **Anti-alias:** render hero + type at 2x supersample, downsample LANCZOS. Stems ≥2px.

## 5. Underwater authenticity (this overrides "tropical blue")
- Beer-Lambert: `I = J·exp(-β_D·z) + B_inf·(1-exp(-β_B·z))`, β_D≠β_B.
- **Cook Inlet is glacial-silt, turbid, NOT clear blue.** Real descriptors: "opaque as a
  latte," muddy gray, grayish-turquoise, steely. In silty water the ocean rule INVERTS:
  **green penetrates deepest, blue dies** (β_B ≳ β_G). Use β≈[0.8,0.55,0.60], B_inf green-
  brown/steely. Heavy backscatter/haze; visibility a few meters; desaturate with distance.
- Reconcile with brand: keep the **aurora vivid at the surface band** (brand signature) and
  let the water below read authentically silty/steely with god-rays + marine snow. Atmospheric
  depth (cool/desaturated/low-contrast recedes; warm/contrast advances) does the heavy lifting.

## 6. Sound design (7-layer stack; VO = 0dB anchor)
Music **-18 to -22dB** under VO (rides up ~6dB in gaps); ambient -24 to -30; featured SFX -6
to -12; sub/impact felt not heard; risers sweep to -6; UI ticks -18 to -26.
- **Synthesize in numpy** (no paid libs): underwater bed = LP(~350Hz) noise × slow 0.08Hz LFO
  + sparse bubbles; sonar = 600-1kHz sine + downglide + long exp decay + delay/reverb;
  whale = downward freq glide 220→180Hz + 2nd/3rd harmonics + drifting bandpass + slow vibrato;
  riser = noise w/ rising LP cutoff; sub-impact = 80→40Hz glide + click + tanh. Randomize
  timing so nothing loops (the line between cinematic and screensaver). One ping + one distant
  moan per 30s, low-passed, tucked under the music key.
- **VO chain (order matters):** HPF ~85Hz → corrective EQ → compressor 3-4:1 (4-8dB GR) →
  de-ess (5-9kHz, 3-6dB) → +2-3dB presence at 2-5kHz.
- **Carve the music** -2 to -4dB at 1-4kHz (VO pocket); HPF music ~100Hz.
- **Sidechain duck** music off VO: threshold ~0.02, ratio ~8-12, attack 20-50ms, release
  400-800ms (breathes back in gaps).
- **Two-pass loudnorm** (single-pass pumps): measure → apply -14/-1.5. True-peak limit -1dBTP.
  LRA tight 5-8 LU (survives a phone in a noisy room).

## 7. Alaska authenticity & cultural respect (protects the brand)
- **Aurora accurately:** diffuse, faint, green low / red high; not neon; not in bright summer.
  Cook Inlet water gray/turbid/steely (see §5), big tides, silt mudflats.
- **Read the live debate:** as of 2024-2026 there is an active, skeptical Alaskan fight over AI
  data centers vs. a real Cook Inlet gas crunch + rural energy crisis ($9/gal Bethel). The
  credible posture is **"on our terms"** (local control, ratepayer protection, community benefit).
  DON'T: "save/fix/rescue Alaska," "put AK on the map," "cheap energy/land/water inputs," gold-
  rush/frontier hype, over-promise jobs, dismiss skeptics (they're the Assembly + a state senator).
  DO: foreground residents' energy first; lift Alaskan-built tech (60Hertz/Pinga, Arcnito);
  concede tradeoffs.
- **Cook Inlet beluga is cultural, not just ecological.** Cook Inlet = **Tikahtnu**, homeland of
  the **Dena'ina** (Anchorage sits on Dena'ina land). Tyonek Dena'ina **voluntarily ended their
  beluga hunt** (~2005) for the whale's survival; today's threats are **industrial noise, vessel
  traffic, pollution, prey loss — NOT Native hunting.** A tech-brand "AI saves the beluga" frame
  risks erasing that stewardship and sacrifice.
  - DON'T: use Native iconography as decoration; use Northwest-Coast formline for Athabascan
    subjects (wrong nation); "spirit animal/ancient wisdom/vanishing"; speak as/for the Dena'ina;
    put unverified Dena'ina words on screen; do a vague past-tense land acknowledgment.
  - DO (for publish): consult + COMPENSATE the actual tribes (Native Village of Tyonek/Tebughna,
    Eklutna, Knik, Kenaitze) and Cook Inlet Tribal Council / Alaska Native Heritage Center; get
    sign-off on any cultural content + spellings; frame the hunt's end as sacrifice; point to the
    Anchorage Museum "Dena'ina Way of Living" and qenaga.org rather than paraphrasing.
  - Gut check: *Are we letting the Dena'ina tell their story (and paying them), or using their
    land and their whale as our backdrop?*

## 8. Beluga accuracy (for the illustrated rig)
- White only as **adults**; **juveniles gray**, **calves dark slate-gray/brownish**, lightening
  with age — a mother-calf pair is gray-on-white (ties to the masking-of-mother-calf-calls story).
- Bulbous **melon** (deformable), **NO dorsal fin** (low dorsal ridge), small rounded pec
  flippers set low/forward, notched fluke, robust body, **flexible neck** (can turn head —
  unusual for a whale). Slow, graceful; pods; surfacing/blow; no dolphin breaching.

## 9. QA GATES (ship on numbers)
- **GATE 0 — COMPOSITION DIVERGENCE (mandatory, BEFORE any render):** `scripts/storyboard_check.py`
  MUST exit 0, then the `storyboard-critic` agent must return ship:true. No scene code until both pass.
  This is the cheap save — it kills a cookie-cutter composition on paper, before a render is wasted.
- **OBJECTIVE GATE (mandatory, FIRST of the render gates):** `quality_gate.py` MUST exit 0 before encoding. It measures
  SHARPNESS (not blurry), HUD_TEXT + CAPTION_TEXT legibility, EVENT_CADENCE (no on-screen-dead window
  > 5.0s), and CAPTION_SYNC. A fail is not a stop — fix the cause, re-render, re-gate (Phase 6 loop).
- **Visual:** 4-frame contact sheet across the acts; check focal hierarchy, legibility,
  safe area, banding. Whale must read as a beluga in pure silhouette.
- **Audio:** measure the muxed file — integrated -14±0.5 LUFS, TP ≤-1.0, music-only tail
  audible (>-34dB RMS), music ≥ ~8 LU under VO during speech, no clipping, mono-foldown ok.
  (Script: `audio_mux.py` gate.)
- **Captions:** present, legible at phone size, inside safe area, reading speed ≤20 cps.

## 10. The 10x punch-list (ranked by impact for our Dispatches)
1. **Open captions** (muted viewing) + master **4:5 1080x1350**.
2. **Motion**: ease everything, add a 4% push-in + parallax + breathing/drift + 180° motion blur.
3. **Sound design**: 7-layer bed (underwater + distant whale + sonar + riser), EQ-carved VO,
   two-pass loudnorm, gate.
4. **Cinematic finishing**: linear-light ACES grade + brand split-tone + bloom + luma grain +
   dither + cos⁴ vignette + subtle CA.
5. **Underwater authenticity**: glacial-silt water (green penetrates), heavy haze/backscatter,
   aurora kept at the surface.
6. **Accurate beluga rig** (gray calf beside white adult) + supersampled hero/type (no aliasing).
7. **Cultural framing**: threats = noise/vessels not hunting; humble, not savior; plan tribal
   consult + compensation before any published cultural content.

## Sources (domains)
easings.net, robertpenner.com, m3.material.io, developer.apple.com (HIG/springs), schoolofmotion.com,
valhead.com, nngroup.com, studiobinder.com (camera/pacing), builder.io + docs.godotengine.org (parallax),
knarkowicz.wordpress.com + filmicworlds.com + 64.github.io (tonemapping), OpenColorIO (CDL),
en.wikipedia.org/wiki/Vignetting + ffmpeg.org (vignette/noise/geq), bartwronski.com + dehancer (grain),
Akkaynak & Treibitz CVPR 2017-19 + Pope&Fry (underwater), forasoft + criticallisteninglab + EBU R128 (loudness),
support.google.com/youtube + Meta xHE-AAC (encoding), NOAA Fisheries + ADF&G (beluga),
Anchorage Museum + qenaga.org + Native Governance Center + Cultural Survival + Alaska Beacon/ADN (Dena'ina, sentiment).
