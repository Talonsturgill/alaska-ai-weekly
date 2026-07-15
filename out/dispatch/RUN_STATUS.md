# Dispatch 2026-07-15 — RUN STATUS (honest, incomplete)

**Story (LOCKED, fact-checked):** "THE GROUND'S TWIN" — Penn State's permafrost digital twin
for a road embankment in Utqiagvik, Alaska (JGR: Earth Surface, DOI 10.1029/2025JF008787).
Two buried 1 km fiber-optic cables feed a physics + machine-learning twin that forecasts the
thaw a step ahead. Honest caveat: it predicts the ground but cannot freeze it back, and it is
proven at ONE embankment on about three years of data (Sept 2021 to June 2024).

This run did NOT auto-deliver a finished video + Gmail draft. It completed the high-judgment
upstream work and validated the build direction, but the full render/audio/delivery pipeline was
not completable autonomously in one session. Details below.

## DONE and verified (committed to this branch)
- Phase 1 research: 4-beat parallel fan-out. Two beats independently surfaced this story.
- Phase 2 fact-check: adversarial `validator` returned CLEARS_GATE. `out/dispatch/facts.md` holds
  the verified fact pack with the validator's two corrections baked in (the ~2 F/decade figure is
  CONTEXT not a twin output; no unqualified "first" claim).
- Phase 3 dedupe: FRESH on the honest distinctive entity set.
- Phase 4.5 storyboard: `out/dispatch/storyboard.json` PASSES Gate 0A (9/9 axes diverge from the
  last 2 dispatches), Gate 0B (storyboard-critic: ship), Gate 0C (flow-critic: ship after fixes).
- Engine: added a backward-compatible `EMIT_FN` self-illumination hook to `dimensional.py`
  (tested; demo + prior scenes unaffected) for the underground fiber pulse / twin glow.
- VO (publish voice): the owner's Chatterbox clone WORKS in this env (weights pull from HF fine;
  ~1 phrase/min on CPU). `build_vo_groundstwin.py` builds a phrase-timed clone VO + words60.json
  + timing60.json. (kokoro install fails on docopt; edge-tts is blocked by the proxy's TLS
  interception on its WebSocket endpoint — both are only fallbacks, so this is not a blocker.)
- Render driver `render_groundstwin.py`: authored FRESH to the storyboard (5 distinct worlds),
  compiles and renders. Look-dev probes validate the direction:
  `stills/lookdev_shot1_surface.png` (the road on the ice, warm-lit stake) and
  `stills/lookdev_shot2_cutaway.png` (the subsurface cutaway: strata, ice lenses — the signature
  shot) both read.

## REMAINING to a shippable, gated, merged video (for the next run)
1. Look-dev polish on shots 3 (macro fiber -> twin lattice), 4 (real-vs-twin diptych), 5
   (rise-reveal); warm up the peat palette (reads too blue under the cool underground light);
   make the fiber pulse / twin glow more prominent.
2. Add the brand-chrome compositing path to the render driver (dispatch_core captions + per-shot
   HUD numerals: UTQIAGVIK, 2 CABLES / 1 KM EACH, SEPT 2021 TO JUNE 2024; textlog for READABILITY;
   `write_shots`; two-phase plate/text like render_thelid).
3. Music: source a real track (network) via `get_music.py`; author the audio mix (sfx_events.json
   >=8 and >=1/shot, silence dip at 45.5s, music_status source=sourced, master60.wav, -14 LUFS).
4. Full render at scale 1.0 (~0.45 s/frame, ~15-30 min for 1785 frames), early-look check.
5. Gates + self-heal: quality_gate.py (13 checks), audio gate, review sheets, 3-judge panel.
6. LinkedIn caption (2-gate loop). Encode 9:16 + 4:5. Upload both (rclone; remote/dispatch-media
   host must be confirmed working in this env). Gmail draft. dedupe.py add. PR -> merge to main.

## Environment notes
- Render stack OK: taichi 1.7.4, ffmpeg 6.1.1, numpy/scipy/PIL, rclone 1.74.4.
- Clone voice OK (chatterbox in .venv-voice; ~3 GB HF weights now cached).
- kokoro: install fails (docopt wheel). edge-tts: proxy TLS blocks its WSS endpoint.
- Fixed the cutaway strata SDF (was keeping the half-space in front of the cut face).
