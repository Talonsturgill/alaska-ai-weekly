# The Launch Call Dispatch — 2026-07-06 — RESULT

- Story: Alaska's tribal health system (ANTHC with Southcentral Foundation, Maniilaq Association,
  UAF's Center for Alaska Native Health Research, UAA) and Stanford are testing a research model that
  scores the rural medevac launch decision from patient vitals, weather, and aircraft status, trained
  on years of real flights across the Alaska Tribal Health System. The honest turn: the same
  researchers published that no ethical guidelines yet exist for AI/ML inside Alaska Native and
  American Indian tribal health, and that community involvement is nearly absent from the healthcare-AI
  literature — so data ownership and consent are being written first, and no clinic runs the model
  today. It is a pilot by design. Sources verified to primaries (two open-access PMC papers, the
  International Journal of Circumpolar Health article, Stanford EMED, ADN/GovTech context) — see
  `sources.json`.
- Objective quality gate (Gate A): **10.0/10 PASS** (all 10 checks green) — SHARPNESS, HUD_TEXT,
  CAPTION_TEXT, EVENT_CADENCE (0.0s biggest dead gap), BEAT_DENSITY (21 beats), SCENE_STRUCTURE
  (6 shots / 5 real transitions / 6 framings), CAPTION_SYNC (17 voice-synced cues), READABILITY
  (1219 words, 0 too dim), MUSIC (sourced), SFX_EVENTS (20 events, 20 audible).
- Composition (Gate 0 fingerprint): instrument-screen POV / assemble-build motion / data-as-subject
  hero treatment / hud-instrument-frame layout / blueprint-technical register. Palette: overcast
  gunmetal-grey sky over pale birch-white snow, a warm marigold-orange risk needle, a cool
  glacier-blue console glow, and one flat charcoal void for the still-unwritten rule. Metaphor: the
  model can score the risk before the plane leaves the ground, but the rulebook for who owns the data
  hasn't been written yet, and a person's hand — not the model — still makes the call.
- Shot structure: **6 shots, 5 real transitions, 6 distinct framings** — roadless-map cold open (lone
  medevac pin already pulsing in the void) -> clinic worker keying a radio into worsening weather ->
  instrument panel weighing VITALS/WEATHER/AIRCRAFT into one rising risk needle -> a hand halts the
  needle and hand-drafts the "GOVERNANCE RULES — DRAFT, NOT YET ADOPTED" line -> a rising row of hands
  placing the tribal-org + community plates -> map bookend where a human hand presses the LAUNCH
  switch, then the wordmark. See `stills/contact_sheet.png`.
- Master: 9:16 1080x1920 and 4:5 1080x1350, ~60s, H.264 High, faststart, AAC 48k, audio loudnorm
  -14 LUFS. Sourced music bed ducked under VO + SFX. Voice: Kokoro am_michael (native per-word
  MToken timing). Music: "Awaiting Return" Kevin MacLeod (incompetech.com via archive.org), CC BY 4.0.
- Subjective taste gate (Gate B, dispatch_rubric.yaml, ship threshold 9.0): moved
  **8.32 -> 8.24 -> 8.20 -> 7.70 -> 7.66 -> 7.94** across rounds. A genuine, reviewer-consensus
  thesis-breaking defect was found and fixed: the hero hands (the ledger, the partner-plate row, and
  the LAUNCH-switch payoff) had been built from stacked equal-width rounded rectangles and read as a
  robotic gripper — which in the payoff frame inverted the film's own thesis ("a person's hand, not
  the model, makes the call"). They were re-drawn as human hands (rounded palm + tapered wrist, four
  fanned graduated-length fingers with rounded tips + nail hints, an angled thumb, warm skin shading,
  grounded contact shadow); the clinic human was repositioned/unoccluded; the map got a recognizable
  Alaska silhouette (SE panhandle + Aleutian chain); and motion-blur trails were added to the fast
  beats (risk-needle sweep, plate rises) with the four plate-hands varied. After those fixes, the
  EDITOR (the adversarial "don't ship" critic) returned SHIP and the FLOW-CRITIC returned SHIP; the
  binding SCORER reached 7.94 and stated the remaining gap is "broad… not another single fix" — a
  cluster of criteria the scorer holds at 8 for deliberate documentary restraint (MOTION_INTENSITY
  dial 4 — correct for a life-and-death subject) and for craft unverifiable from static contact
  sheets. As on prior runs, the 0.16-weight illustration criterion structurally caps a hand-coded
  PIL/numpy renderer below the 9.0 "banger-tier" bar; closing it needs a different rendering
  technology, not another iteration of the same method. Given a perfect objective gate, zero hard
  blockers, the one genuine defect fixed and confirmed fixed by all three reviewers, and 2 of 3
  critics shipping, delivery proceeded (with the run owner's explicit approval) rather than iterating
  indefinitely — documented honestly in the Gmail draft and here.
- On-screen readouts (VITALS/WEATHER/AIRCRAFT, the risk needle, "YEARS OF FLIGHT DATA") are
  illustrative of the model's inputs, not a live feed; the honest caveat ("No clinic runs it today.
  It's a research pilot.") is delivered as staged physical action, not fine print.
- No em/en dashes anywhere (VO, captions, on-screen text, post copy, credits). Dedupe: distinct from
  the prior 14 days (medical-ethics / tribal-data-sovereignty story; instrument-panel archetype;
  gunmetal/marigold/glacier palette) — logged to `config/state.yaml > dispatch_history`.
