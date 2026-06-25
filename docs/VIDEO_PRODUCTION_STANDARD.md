# ALASKA.AI — Video Production Standard (v1)

The reusable pro playbook for Alaska.Ai "Dispatch" videos. Hand-coded Python
(PIL + numpy) + ffmpeg, 30fps. Numbers are load-bearing defaults, not vibes.
Derived from a 2026 research pass across motion design, color science, underwater
rendering, sound, Alaska authenticity, and platform delivery (sources at bottom).

## 0. The five principles
1. **The voice carries the story.** Visuals clarify; they don't shout. Drop on-screen
   text the narration already speaks.
2. **One hero per beat.** Decide the focal point before animating. Animate ONLY the hero;
   everything else is still or ambient. Clutter = "no one was in control."
3. **Restraint reads as expensive.** Slow, eased, patient, lots of negative space (30-50%
   of frame intentionally empty). The amateur instinct is more/faster motion; remove until
   only meaningful, gentle, cushioned moves remain.
4. **Motivated motion only.** A move must mean something. A baseline of stillness is what
   makes one slow push-in land. Never drift forever.
5. **Honest + local.** Pro-Alaska, never "Silicon Valley saves Alaska." Verify every fact;
   ship on measured numbers (audio + visual gates), not on the room.

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
- Burn in phrase-level captions synced to the VO (we have per-segment timings).
- Style: bold sans (or JetBrains Mono Bold for brand), ~44-56px on 1080, white with a
  ~3-4px dark stroke OR a 60-70% rounded box behind; high contrast; never rely on color alone.
- Placement: lower third, inside the safe area, clear of the bottom ~10% where UI sits.
  ≤2 lines, ≤~20 chars/sec reading speed; hold each phrase ≥ its spoken duration.

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
