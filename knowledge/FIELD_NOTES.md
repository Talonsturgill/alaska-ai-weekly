# FIELD NOTES - living learnings

Append-only. Each run's retro adds dated entries: what worked, what failed,
what the human changed, new techniques discovered, sources to consider.
Newest first. Keep entries terse and actionable; promote stable lessons
into the doctrine/library files and prune here.

---

## 2026-07-21 - run retro (Carousel No. 13, "A Better Ear Is Not a Recovery", 8.77)

- FULL-STUDIO RUN, no usage-limit degradation. 6 scouts + fact-checker + 3 treatment-directors +
  copywriter + 5 pixel critics + flow-critic + scorer all ran. Shipped 8.77 vs 8.3, vector PDF 7.8MB,
  9 slides, zero hard fails.
- STORY. First marine-mammal / endangered-species acoustic-AI deck of the series: NOAA Fisheries +
  Microsoft AI for Good + ADF&G built a deep-learning dual-stage detector-then-classifier (contrastive
  audio-language models + active learning) to hear rare Cook Inlet beluga calls in a ship-noisy inlet and
  firm up daily presence; a separate NOAA-led effort (USGS, Microsoft AI for Good, Naval Research Lab)
  adds satellite detection. Deliberate NET-NEW pivot off the fatigued data-center beat (Nos 1,4,6,10) and
  every recent cold-infrastructure hero. Thesis "a better ear is not a recovery" (hearing is not healing).
- FACT-CHECK sharpened the honesty spine. The acoustic paper's full text is paywalled (Wiley 403), so the
  method is asserted only from the abstract and NO detection-accuracy percentage is claimed (none exists).
  The fact-checker corrected the population framing: NOAA says the best estimate 331 "may be stabilizing
  and possibly increasing" YET the population "has not recovered as expected" -> the deck draws neither a
  "still crashing" curve nor a recovery hockey stick; the S7 chart shows the ~80% collapse (1,300 1979 ->
  279 2018), a small hedged 331 uptick in a dashed uncertainty band, and a dotted 1979 baseline rule so the
  gap IS the argument. Dropped the scout's unproven "116,103 caribou" (fallback story) and fixed an author
  affiliation.
- CRAFT. New chassis: a continuous underwater Cook Inlet depth-world (camera descent + mono depth readout as
  progress) carried by a SINGLE warm gold "call" that changes state but NEVER multiplies (a clearer signal
  is not more whales), sealing into the Polaris; the water reads visibly UNCHANGED S1 vs S8, and the S8
  boundary box shows noise/prey/habitat as arrows that stop at the wall with no intake port. Story-art
  fusion 9, variety 9, flow SHIP (sequence_reads_as_one, motif_reads_across_all_9). Two new techniques + 3
  instincts logged.
- HERO / GROWTH EDGE (recurring). Artwork-craft capped at 7 again: the S3 beluga shipped as the DESIGNED
  CANVAS FALLBACK because the akthree GPU path false-negatived. Lesson (new instinct): an akthree object
  composited over a TRANSPARENT background makes AKT.snapshot's black-frame sentinel read empty samples as
  a dead frame and silently drop to the fallback; render the subject on an OPAQUE in-palette bg and
  composite the whole frame, or make the 2D illustration the hero on purpose. The fallback beluga reads
  clearly as a beluga but flat; Phase 12 candidate = a bounded akthree object-hero-on-opaque-bg helper.
- PIXEL CATCHES machine QA missed (qa PASS 0/0): S2 top-heavy with a dead lower band; S4 core metaphor not
  reading (faint noise band + gold needle reading as the mooring cable) PLUS a gold SHIP NOISE readout;
  S8 gold leaking onto the SHIP NOISE/PREY/HABITAT input labels; S3 body wrapping to 8 lines. New instinct:
  audit every secondary label for accent-color leak before render (gold = the call ONLY). All fixed and
  re-verified to ship; RECORD-SYNC caught one drift (S7 "2008 endangered" -> "2008 listed endangered")
  reconciled before ship.
- DOCKET: no new AI-infrastructure decision (a beluga-monitoring story is not infrastructure). Material
  in-window update tracked: the City of Houston ban ordinance vs the AIDEA Mat-Su data-center park (Aug 13
  council vote added). Re-verified STAK (comment closed, pending final decision), AKLNG (third special
  session July 27), Air Force EUL (no award as of July 19). docket_alerts result noted at ship.
- NEXT: a published beluga-model accuracy number or a Sealaska Tlingit-AI-translator second source remain
  strong future angles; the akthree-on-opaque-bg object-hero helper would retire the chronic flat-hero cap.



- FULL-STUDIO RUN, no usage-limit degradation. 6 scouts + fact-checker + 3 treatment-directors +
  copywriter + 5 pixel critics + flow-critic + scorer all ran. Shipped 8.55 vs 8.3, vector PDF 2.2MB,
  9 slides, zero hard fails.
- STORY. The first education deck of the series: the rules for AI in Alaska's classrooms are being
  written now. In-window anchor = Kenai Peninsula Borough School District's proposed AI policy (KBBI,
  July 8), which already spent $8,300 on MagicSchool before the governing policy exists. Deliberate
  net-new pivot away from the fatigued data-center/power beat (Nos 1,4,6,10) and the covered
  salmon/volcano/wildfire/Navy/minerals/SAR/permafrost topics. The DEED 2025 K-12 AI framework (32nd
  state, 7 principles, 6-step process) is the keepable backbone, stamped "CONTEXT, NOT NEWS."
- FACT-CHECK KILLED A TEMPTING LEAD. The in-window Space Force GBRD radar award ($423M, 2 Alaska
  radars, July 17) looked strong but the fact-checker confirmed NONE of the primary/trade sources say
  AI or ML; it is analog-to-digital radar digitization. Building an "AI" deck on it would have
  fabricated the premise. Dropped. (NSF minerals in-window = hard dedupe with No.8; STAK/AIDEA =
  fatigue.) Runner-up NOAA YOLOv11 salmon-bycatch (fully verified, primary NOAA) passed over for
  salmon+CV adjacency to No.2 (11 days prior) + background date.
- CRAFT. New chassis: a gradebook-page editorial substrate + an evolving pencil motif whose length
  encodes the shrinking runway to the fall deadline, with ONE rendered akthree pencil-on-lit-gradebook
  still-life as the depth hero and 8 flat editorial slides (argued). Diverges from all last-4 heroes.
  Flow-critic SHIP 8.3, sequence-reads-as-one. New technique + 3 instincts logged.
- PIXEL/FLOW CATCHES machine QA missed: S5 headline "not ink." washed out on the lit cream page
  (fixed with a DOM Deep-Sea-Scrim, not the fading gradient); S5 gradebook ruled lines + half-written
  line were absent and the tip read gold (added lines, darkened the nib); S6 headline overprinted the
  ISOTYPE grid (SVG marks are invisible to qa.py's text-only collision check) and a big dead mid-card
  band (relocated the 32/50 strip down, freed the headline full width); two bodies (S2/S4) wrapped to
  4 lines; the pencil motif dropped out on S4/S6 (flow-critic; added the pencil to both). All fixed
  and re-verified.
- SCORER (8.55). Weakest = artwork craft (7): one moderately-rendered hero carrying 8 flat slides,
  and the pencil still reads a touch like a gold rod without a fully distinct graphite writing tip
  (logged growth edge). Legibility 7: low-contrast accent furniture (gold counter on paper ~1.5:1,
  red-on-cream) darkened before ship. Alaska authenticity 9.
- DOCKET: no new AI-infrastructure decision item (an education-policy story is not infrastructure).
  Re-verified STAK (comment window closed July 17, DNR weighing) and AIDEA Houston (open to Aug 19);
  both accurate. docket_alerts result noted at ship.
- NEXT: if KPBSD adopts the policy at the start of the school year, that is a clean UPDATE angle. The
  Sealaska Tlingit AI translator and the ANLC ChatGPT-DEI grant story remain strong untouched
  language-AI angles once corroborated with a second readable source.

## 2026-07-20 - craft refresh (run 12 pre-research pass)

- Platform numbers RECONFIRMED, nothing to change: document/carousel posts remain
  the highest-reach native format (~6.6% ER), saves are the dominant 2026 signal
  (~5x a like), dwell 15 to 20s, 8 to 10 slides the sweet spot, 1080x1350 the
  ratio. (dataslayer/oktopost/contentdrips 2026.)
- One marginally-fresh craft handle for the keepable data slide, consistent with
  the 07-19 annotation note: 2026 editorial dataviz desks frame good annotation as
  "deliberate subtraction, not addition" (FT chief data reporter) - place titles,
  labels, gridlines, color so each element supports comprehension or is cut; one
  primary annotation reads first, all others stay visibly secondary. Reinforces
  existing practice; no gate change.

---

## 2026-07-17 - run 9 retro (Carousel No. 9, "No Road Out. Quinhagak Flies Its Own Eyes", 9.07)

- FULL-STUDIO RUN, no usage-limit degradation. 6 scouts + fact-checker + 3 treatment-directors + copywriter + 5 pixel critics + flow-critic + scorer all ran. Shipped 9.07 vs 8.3, vector PDF 7.86MB, 9 slides, zero hard fails.
- STORY. Quinhagak's Nalaquq (Native-owned Qanirtuuq subsidiary) trains its own FAA Part 107 drone pilots in the roadless Y-K Delta and owns its own machine vision (a real search-and-rescue boat-detection CNN plus a polarized-lens salmon counter). Deliberate hard break from 8 straight cold-infrastructure/instrument decks: a warm, human, place-rooted sovereignty story. Runner-up (AIDEA Houston 30-sq-mi free-land data-center giveaway, fully verified) was passed over for variety and tracked on the docket instead.
- HONESTY-AS-EDGE, again. The fact-checker's make-or-break call: the AI is REAL but narrow. Training is human-piloted (Part 107), NOT autonomous; the ML is two Nalaquq prior JCMC tools; reindeer thermal and archaeology are human-read, NOT AI. Rendered the split AS DESIGN (S7 MACHINE-vs-HUMAN equal-panels ledger plus a standing PILOT/HUMAN tag on the hero, no invented percentage). Scorer and flow both read the modesty as the spine, not a hedge. New instinct (honesty-quarantine-as-design).
- CRAFT: the chronic flat-hero weakness is RESOLVED. S6 AK3D software-3D thermal river-valley (heightfield plus akpost grade) with a white-hot CNN boat detection read as genuine dimensional relief (artwork-craft 8, not the usual 7). Two framing lessons: brighten the valley floor (near-black reads as a dead void) and raise the horizon so terrain fills the lower half. New instinct (ak3d-terrain-hero-resolves-flat). New technique logged (Thermal Search-Grid motif).
- PIXEL CATCH machine QA missed: all 12 S4 ISOTYPE trainees rendered gold, blowing the gold budget and killing the highlighted figure's distinction; recolored 11 to muted slate. New instinct (isotype-neutral-not-accent). The HAND-LAUNCHED leader also read as a strikethrough over its label (rerouted).
- DOCKET: added the AIDEA Houston land-giveaway item; refreshed STAK (comment window closes today 4:30pm), AKLNG (Dunleavy called a THIRD special session, rejecting the corporate tax), GVEA (outcome still unconfirmed), Air Force EUL. docket_alerts SENT 1 subscriber email (4 alerts) because BUTTONDOWN_API_KEY is set and STAK's deadline is inside 48 hours.
- DELIVERABLE GAP (Phase 12 candidate for next run): gmail_draft.py reads copy.json["post_copy"] and ["aftercare"], but the copywriter contract emits "caption" (text lives in caption.txt) and NO aftercare list, so BOTH the post-copy block and the aftercare checklist rendered EMPTY in the first payload. Caught at draft time by the showrunner and hand-fixed (added post_copy = caption + hashtags, and a 6-item aftercare list, to copy.json). Permanent fix: either make gmail_draft.py fall back to caption.txt + a default aftercare when the keys are missing, OR add post_copy/aftercare to the copywriter's required output schema. Recurs every run until fixed.
- NEXT: STAK final DNR decision lands after 7/17; GVEA LM6000 outcome still worth a hard re-check; AIDEA Houston comment window to 8/19; a Nalaquq published accuracy number or the Sealaska Tlingit-AI translator would be strong future update angles.

## 2026-07-15 - run 8 retro (Carousel No. 8, "The Uncomputed Ground", 8.78)

- FULL-STUDIO RUN, recovered mid-run. Today's earlier No.7 died on the account
  weekly limit; this run's canary Beat B scout ran fine (limit reset past 5pm
  UTC), so the fan-out spawned, but 3 scouts (A/C/E) then hit a SESSION limit
  ("resets 11:50pm UTC"). Beat B + D + F completed with enough coverage, the
  maintainer confirmed the reset, and the full studio ran end to end
  (fact-checker, 3 treatment-directors, copywriter, 5 pixel critics, flow-critic,
  scorer). Lesson reconfirmed: a CANARY probe before a 6-way fan-out cheaply
  distinguishes "layer dead" from "layer alive" and its result is not wasted.
- STORY. NSF named a UAF-led coalition its Critical Mineral Accelerator Engine
  ($15M now, up to $160M/10yr if milestones met) to use AI to help locate deposits
  and biological methods to extract them. Sharpest honest angle: the AI headlining
  it is a single sourced sentence with no model, dataset, or site named yet, and
  the $160M is a milestone-gated ceiling. Honesty-as-edge (like No.2, No.5).
- FACT-CHECK CAUGHT THREE SHIP-STOPPERS the scouts/community-signal had wrong: NANA
  is a PARTNER, not a co-owner; "biomining"/mine-waste-recovery/remediation are NOT
  on the page (say "biological methods for extracting minerals"); and the sources
  name NO specific mine/district, so do NOT connect the Engine to Ambler/Pebble.
  Trust only fetched text; the Beat F community framing was a useful angle guide but
  several of its "facts" did not survive the fact-check.
- CRAFT. New continuity motif that landed: a CONFIDENCE METER that evolves per beat
  and never lies to 100%, plus a strict gold=real / phantom-blue=promise TRUTH COLOR
  CODE (story-art fusion scored 9). New technique: the Uncomputed Prospectivity
  Survey-Plate. Two new instincts (confidence-meter-honesty-motif, truth-color-code).
- WEAKEST = artwork craft (7.5). The deliberately flat/graded 2D relief (argued in
  the dossier since the thesis is an unfinished survey) shipped but read as a graded
  2D map with a grid overlay, not the dimensional plate the storyboard argued for.
  Same rendered-ladder growth edge as No.7. PARKED as a Phase 12 upgrade candidate: a
  reusable relief-depth helper (directional hillshade + atmospheric layering + interior
  texture) so future map-hero decks get real depth without GL risk. New instinct logged
  (relief-depth-not-just-grade).
- PIXEL/FLOW held: 7/9 shipped first pass; S2 body overflowed to 7 lines and ended on
  a fragment (tightened), S8 body grazed the coastline and had an ambiguous bare
  "Engine" (fixed with a scrim + "chief executive"). Flow-critic flagged the S6->S7
  junction (no open loop); fixed with an S7 kicker bridge ("WHAT THE CLIMB IS FOR").
- DATE BOUNDARY. No.7 shipped as 2026-07-14 earlier today; this run dated 2026-07-15
  to avoid colliding with the committed runs/2026-07-14 artifacts (same rolling-forward
  as No.7 off No.6).

## 2026-07-13 - run 6 retro (Carousel No. 6, "The Interior's Power Math")

- **Shipped 8.69 vs 8.3** (9 slides, vector PDF 3.26MB), zero hard fails, 1 pixel round (all 9 reviewed; S2/S3/S4 had blocker/major issues, all fixed + re-verified) + 1 flow round (SHIP, 8.2) + 1 post-score fix. Story: GVEA's July 13 board vote on a second ~$120M LM6000 gas turbine, framed "Firm power, soft load" -- a member-owned Interior co-op asked to finance firm gas capacity on member debt while the AI loads that make firm power feel urgent (Air Force EULs at Eielson/Clear/JBER) are still proposals. Deliberate pivot to a flat editorial FIRM/SOFT type-weight ledger + one rendered turbine, after four straight energy/monitoring/robotics decks.
- **The winning frame was the essayist's, strengthened by the other two directors.** "Firm power, soft load" (a portable rule-of-thumb) beat "the megawatt mortgage" (data-journalist) and "the phantom load" (systems-illustrator); the phantom-load idea was GRAFTED in (the SOFT column drawn in drafting phantom-dashes), and all three converged on the rendered LM6000 object as the depth hero. Synthesis > any single pitch.
- **Fact-check recovered claims the fact-checker dropped on dead URLs.** The fact-checker returned 19 verified claims but dropped the GVEA fuel-spike (its guessed alaskasnewssource/ADN URLs 404'd). A quick showrunner re-fetch with the REAL URLs (gvea primary via search + alaskasnewssource + KUAC) recovered the +61%/$45.74/$2.50-to-$5.10 backdrop (c19-c24) that became the emotional core (S5). Lesson: when the fact-checker drops a claim for a fetch failure (not a falsehood), retry the URL yourself before abandoning a strong beat.
- **Honesty firewall as a DESIGN problem, not just a copy one.** The load-bearing S3 ("what the paper reports" vs "what the co-op says") FAILED the pixel critic because the attributed data-center panel rendered larger/brighter than GVEA's own words -- visual favoritism inverting the honesty point. Fix: identical panels (same top, min-height, plate, quote glyphs). New instinct logged (equalize-honesty-panels).
- **Rendered object hero needs a text scrim, not text-shadow.** S4's body copy over the akthree steel turbine dropped below 4.5:1 (pixel BLOCKER) despite a shadow; a Deep-Sea-Scrim DOM gradient behind the text column fixed it while keeping the object big. Also: the first lathe profile read as a propane bottle; a bell intake + casing seams + a rear exhaust stack + a control cabinet made it read as an industrial turbine package. Two new instincts (render-object-text-scrim; and reshape-for-silhouette). Weakest rubric criterion again = artwork craft (7): the turbine still reads slightly generic as a chrome vessel; parked as a reusable LM6000-specific object-hero detail kit.
- **The dividing-rule motif carried the whole argument.** A FIRM(solid)/SOFT(ghost) vertical rule that migrates per beat and SEALS into a gold "closed door" at synthesis (executive session) then splits open into the close question read as one evolving object across the filmstrip (flow critic confirmed motif + palette-arc). Generalizes to any two-sided / certain-vs-speculative story.
- **Recurring fixes that held:** fixed-width centered label boxes tripped the safe-zone gate on their BOX edges (S2); content-width nowrap fixed it (new instinct). Instrument-Serif-italic-only again false-FAILed render.py's upright-400 font probe; the offscreen upright-loader span cleared it (the parked 07-10 probe fix is now worth landing as a real engine change -- Phase 12 candidate).

## 2026-07-13 - craft refresh (run 6 pre-research pass)

- **"Bounce rate" is now named as an explicit tracked document-post signal** (dataslayer Feb 2026, digitallybugged 2026 guide): the algorithm reportedly reads whether a viewer swipes past slide 1, and a high slide-1-to-slide-2 dropoff suppresses reach. This is a sharper articulation of our existing "steepest drop is 1 to 2 / cover must earn the swipe" rule, not a new lever. Practical restatement for the directors room: the cover's ONLY job is to buy the second slide, and slide 2 must pay immediately (no agenda beat). Nothing to change in the gates.
- Everything else reconfirms current practice: documents remain the top organic format (~6.6% ER), saves ~5x a like / ~2x a comment in reach value, 8 to 10 slides and 15 to 20s dwell the save-optimal band. No doctrine change.

---

## 2026-07-12 - run 5 retro (Carousel No. 5, "First Machine to the Fire")

- **Shipped 8.54 vs 8.3** (9 slides, vector PDF 2.3MB), zero hard fails, 1 pixel round + confirmed fixes + 1 flow round. Story: Alaska as the world's proving ground for autonomous wildfire robots (XPRIZE Autonomous track finals via UAF ACUASI on a 1,000 sq km range; five finalists; September 2026 verdict). Deliberate break from four straight energy/infrastructure/monitoring decks.
- **The Dryad/XPRIZE story that collapsed in run 4 survived in run 5** because the frame changed: the deck is built on the VERIFIED structure (xprize.org roster, ACUASI/UAF partner, 1,000 km2, prize architecture, FAA test-site status), and Dryad's self-reported detect-and-suppress demo is one attributed data point (S6, "Dryad says" + NOT INDEPENDENTLY VERIFIED), never the thesis. The climax is the honest open verdict (S8), not the demo. Fact-check-before-select resolved the finalist count too: FIVE Autonomous finalists (Dryad's own "final three" contradicts xprize.org and was dropped).
- **New hero/motif that landed: the closing Autonomy Ring** - a discrete cyclic control-system loop (detect/decide/dispatch/douse) that doubles as an explicit N/4 progress counter and seals gold at the verdict. Flow critic caught that brightness-only arc increments read as a static logo; fix = dim (gray) unlit arcs + an explicit "N / 4" label. New instinct logged. Generalizes to any process/loop story.
- **Two honesty catches by the pixel critics** that qa.py can't see: S3 lit "fire-season" bars rendered gold after akpost (fixed to redder #E8531F to match the split bar and clear the gold budget), and S4's warm convergence point sat exactly on the Dryad row (favoritism for the one company featured later; moved above the roster, all five nodes equal). Both were composition/honesty, not machine-detectable.
- **Rendered akthree hero** (backlit quadcopter over fire-lit dusk) shipped with an AK3D fallback; weakest criterion (artwork craft, 7) is that it still reads slightly flat. A warm rim light from the key direction + a scale bump made it read as a quadcopter rather than a smear (new instinct). Parked for Phase 12: a reusable rim-light + profile-clarity helper for object heroes.
- Canvas-vs-DOM overprint recurred and was again caught only by eye (S5 loop arcs vs block plates, S8 body vs closed ring), not qa.py. Confirmed-instinct bumped.

---

## 2026-07-12 - craft refresh (run 5)

- Named, reusable frameworks drive SAVES on LinkedIn carousels (a coined "The N-Thing Method" reads as a portable thinking tool). Reinforces giving each deck a named thesis/frame on the cover, not just a headline. Consider a coined frame when the story has a clean structural spine.
- 8 to 10 slides remains the save-optimal band with roughly 15 to 20 seconds dwell; nothing here changes current practice. Consistency of the visual system across every slide (background, type, accent, grid) is repeated as the top design driver, which the constellation system already enforces.

---

## 2026-07-11 - THE 3D UPGRADE (maintainer-directed dev session, post run 4)

- **The 2D-to-3D leap landed.** Empirical probes overturned the standing "WebGL experimental"
  assumption: SwiftShader/ANGLE (Vulkan "Subzero") renders a full PBR frame (MeshStandardMaterial,
  2048px PCFSoft shadows, ACES, AA) at 2160x2700 in ~70ms in this container. Forum lore said 24-31s;
  measure, do not inherit. Four new committed benches: akthree (GPU PBR + procedural IBL + brand
  rigs/materials), aksdf (CPU SDF raymarcher for organic sculpted heroes), akpost (film-grade post:
  correct op order, IGN dither, masked grain, unsharp), akcolor (OKLCH ramps + gradient-map
  underpainting). TECHNIQUE_LIBRARY 87-90; DESIGN_DOCTRINE gained THE RENDERED LADDER; proof deck at
  examples/proof-3d (3 slides, qa PASS).
- **Two bugs the bench now encodes forever:** (1) three.js setPixelRatio must precede setSize or the
  backing store silently drops to 1x (all early probes were unknowingly 1080p); (2) a nested block
  comment in a JS header killed a module load with a bare "Unexpected token" page error; node --check
  everything committed.
- **Scene-authoring lessons from the proofs:** emissive tubes at tone-mapped exposure balloon into
  washed bands (keep emissive intensity <= ~2.5 and radius small); SDF carved tunnels go near-black
  without an indirect floor; light-bottomed renders need dark-ink footer furniture (contrast gate
  caught it).
- **Enforcement wired (same session, maintainer prompt):** qa.py now FAILS dead canvases (near-uniform
  pixels = failed GL frame) and sub-1.5x canvas backing; rubric + pixel-critic enforce THE RENDERED
  LADDER; master prompt names the gates. The dead-canvas gate's first reconstruction run caught a real
  bug: probing webglOK on the render target froze the context without preserveDrawingBuffer and blinded
  the sampler. Probes get throwaway canvases, forever.
- **Parked, high-value next steps:** matcap + G-buffer deferred pass for ak3d (per-pixel normals,
  Blender-clay look without GPU); APCA text-contrast auto-solver; saliency-map focal-hierarchy QA
  check (Itti-Koch downsample: assert the intended focal wins); strata-texture helper (run 4 retro);
  llvmpipe lane (--use-angle=gl) as a SwiftShader hedge if Chromium's deprecation ever lands.

## 2026-07-11 - run 4 retro (Carousel No. 4, "The Cook Inlet Gas Machine")

- **Shipped 8.90 vs 8.3** (9 slides, vector PDF 2.94MB), zero hard fails, 1 pixel round + 1 flow round.
  Story: the July 10 RCA denial of Enstar's $240M Cook Inlet gas STORAGE prudency request, framed as
  Alaska's supply ceiling meeting AI's gigawatt demand. NEW hero: a subsurface engineering cutaway
  ("the gas machine") on a panorama-spine, with a reservoir-lens state machine and a valve open->shut motif.
- **Fact-check-before-select earned its keep again**: the two topically-fresher candidates collapsed under
  scrutiny (Dryad XPRIZE wildfire = company-PR-only sourcing + vague AK site; MONTIS avalanche drone = NOT AI,
  it is remote-piloted, and "first DOT"/"replaces helicopters" were unsupported). Ordering claims before
  selection saved the run from building a deck on PR. A well-sourced important story beat two novel thin ones.
- **The canvas-vs-DOM-text blind spot recurred at scale** and is now the dominant defect class: qa.py PASSED a
  deck where in-section DOM readouts and canvas labels overlapped body text and sat on the low-contrast ochre
  band (S2 legend on homes, S3 curve labels on body, S4 readouts ~1.5:1 on ochre, S6 SUSPENDED, S7 flag-label
  mash, S8 context on ochre). Fixes: a `.plate-dark` CSS class for DOM readouts, canvas knockout chips for
  canvas labels, and capping body max-width so the body ENDS in the sky zone. Two new instincts logged.
- **State-change motif needs geometry, not rotation**: the flow critic found the 8-spoke valve looked identical
  rotated; an amber lock-bar across the hub made "shut" read at 432px. Motif carriers must change SHAPE.
- **Honesty guardrails held**: c10/c11 (op-ed rate stats) kept off every slide; c12 (2027) used once, tagged
  op-ed; c13 quoted verbatim with the "different units, not one sum" guardrail directly under the S8 bars; no
  derived MW anywhere. The Bcf-vs-GW adjacency (all three directors flagged it) is defused on-slide.
- **Curly-apostrophe false-positive, again**: three pixel critics flagged "smart quotes"; source grep showed
  ZERO curly/dash bytes on all 9 slides (straight U+0027/U+0022). Fraunces/Manrope render straight apostrophes
  with a slight curl. Always verify quote/dash violations at SOURCE level (run-1 lesson, re-confirmed).
- **Weakest criterion = artwork craft (7)**: flat strata gradient bands, plain elliptical lenses, and S1/S9
  lower-third dead zones. PARKED for Phase 12 as a reusable strata-texture/rim-light helper (within-band fbm
  mottling + lens rim-light + dead-zone fill) so every future cutaway/landscape deck gets it for free.
- Docket: added the Enstar Cook Inlet gas storage item (RCA denial). GVEA (Jul 13) and AKLNG (Jul 16) re-fetch
  failed (429/503/403) and were carried forward; both resolve within days and are worth a hard re-check next run.

## 2026-07-11 - Phase 12 (automation retro + frontier scan)

- **APPLIED - knockout-plate canvas-label helper (`assets/js/aklabel.js`).** The durable form of this run's
  dominant hand-fix. `AK.canvasLabel(cx,x,y,text,{color,align})` draws an opaque plate under the glyphs so a
  canvas label's contrast depends on (text, plate) only, not the strata beneath; `AK.rectsOverlap` keeps stacked
  in-scene labels from merging. Verified: same text/colour that shipped at ~1.9:1 on ochre reads ~8.5:1 with the
  helper; ENSTAR/HILCORP that merged into "ENSTAHILCORP" now sit on separate plates. Opt-in; no gate touched.
- **PARKED - canvas-text-aware QA gate.** The real gap is that canvas-DRAWN text is invisible to EVERY gate
  (text_collisions/contrast_estimate/busy-art tripwire all walk render.py's DOM text_nodes; canvas ink has no
  node). A gate that could see it needs OCR or stroke/edge heuristics that would false-positive on dense
  sectional artwork (strata hatching, valve wheels, curves). Not a safely-boundable ~100-line change. Revisit
  only with a bounded discriminator (e.g. require in-scene labels to register a DOM "shadow rect" the gate can
  read, turning canvas labels back into checkable boxes). Meanwhile `aklabel.js` removes the incentive to draw
  raw canvas text. Recommended to maintainer: a contrast floor for `data-decorative` labels over light bands, or
  a house rule that in-scene labels use `AK.canvasLabel` (both are threshold/policy = maintainer's call).
- **PARKED (frontier, procedural-art scan) - strata-texture / rim-light craft helper.** Weakest rubric this run
  = artwork craft (7): flat gradient bands, plain elliptical lenses, dead lower-thirds. The scan confirmed the
  math is ALREADY committed in noise.js (`AK.fbm2/fbm3/warp2`); Quilez's fbm article gives the geological
  parameter (H=1, gain=0.5, ~5-6 octaves) for rock-like spectra, and relief needs only a cheap gradient-of-fbm
  rim-light. So the parked helper is a thin painterly LAYER over existing primitives, not new deps: (1) clip to
  a band path, paint low-alpha fbm mottling (gain 0.5, 5 oct) tinted +/- 8% luminance; (2) rim-light a filled
  lens/shape by stroking its upper-left arc with a lighter tint at ~0.5 alpha; (3) fill dead lower-thirds with a
  very low-alpha warp2 field. Held because it is a SECOND assets/js change the day after a 4-upgrade day; land
  it next run as the sole improvement slot, verified by rendering an opt-in demo slide. Sources:
  https://iquilezles.org/articles/fbm/ , https://iquilezles.org/articles/warp/

## 2026-07-11 - craft refresh (run 4 pre-research pass)

- **Named, reusable frameworks drive saves (new actionable handle).** Multiple 2026 carousel roundups (Oktopost, Morphica, SocialPilot) converge that the highest-save decks hand the reader a NAMED, portable thinking tool ("The 3-C Framework", "The RICE Method") they can carry and reuse, not just a story. For us that means: when the story allows, give the deck ONE named lens or rule-of-thumb the reader keeps (a coined term, a 3-part test, a checklist), stated once and reinforced on the close. Save-value is our whole strategy, so this is a real lever, not fluff. Does not change gates.
- Platform numbers otherwise hold: documents remain the top organic format (~4.5% ER, ~45% over video, ~6x reach of link posts, ~3x save rate of text), 4:5 portrait, 6-10 slides the sweet spot, caption under ~150 words driving INTO the deck, personal-profile edge persists (aftercare note for the human, not a design change).

## 2026-07-10 - parked frontier + minor candidates (upgrade-engineer, editorial-dataviz/cartography scan)

- **Concentric-radial-rings seasonal small multiple (parked technique).** A
  recent Bloomberg guide wraps the calendar year into a ring per small chart;
  concentric rings each encode a variable (weekly share, avg high temp,
  precipitation) and a seasonal peak reads as a bulge. Portable to offline,
  seeded, static SVG/Canvas. Strong fit for any AK deck with a seasonal
  quantity (fishing openers, daylight swing, eruption cadence, PFD timing).
  TECHNIQUE_LIBRARY candidate, not an engine change; promote when a deck's
  story lands on a cyclical/seasonal number.
  Source: https://www.anychart.com/blog/2026/07/10/data-graphics-pull-their-weight/
- **Data-journalist map design space (parked reference).** "How do Data
  Journalists Design Maps to Tell Stories?" analyzes 462 journalistic maps from
  five outlets into an eight-dimension design space (article properties + map
  visual/interactive features) plus common editorial rationales. A checklist
  for the treatment-directors when a deck goes cartographic (framing/crop,
  annotation, focus+context, projection intent). Reference, not code.
  Source: https://arxiv.org/abs/2508.10903
- **Style-aware font probe (parked minor fix).** render.py's font-loaded check
  builds its `document.fonts.check()` spec as weight + size + family with NO
  font-style, so an italic-only display face (Instrument Serif italic this run)
  false-FAILs the upright-400 probe; self-corrected in-slide by loading both
  faces. Fix: pass the element's computed font-style into the check spec so the
  probe tests the face actually used. Bounded and correct, but it edits a hard
  gate and was not defect-forced this run, so it was held (daily cadence favors
  0-1 upgrades and two reactive fixes spent the budget). Land it a day the
  budget is open; verify no shipped slide's font check changes verdict.

## 2026-07-10 - run 3 retro (Carousel No. 3, "The Machine That Hears a Mountain Think")

- Story: AVO volcano-monitoring AI (VOISS-Net + VolcSARvatory) with the live Great Sitkin
  eruption peg (3 volcanoes elevated at once, Jul 3 AVO update). First instrument-register deck
  (Space Grotesk + JBMono + obsidian/phosphor); evolving seismic-trace conductor motif.
- **Canvas-over-DOM-text is a QA blind spot**: qa.py checks DOM line boxes only, so the S3
  flightpath arc crossed body copy and machine QA PASSED it; pixel critics caught it. New
  instinct logged: route canvas paths around text blocks at PLAN time and make critics check
  canvas-vs-text explicitly.
- **Motif connective tissue**: the flow critic found the conductor trace read on ~6 of 9 frames;
  adding low-alpha enter/exit strokes on S3/S6/S7 stitched the film together. Lesson: a motif's
  TRANSFORMATION states are not enough; draw the connections.
- Fact-checker corrections that mattered: $6.3M is a shared NASA award (7 projects), Great Sitkin
  is 5,708 ft (not 5,709), Shishaldin elevation unfetchable so the Arc Index shows "not listed"
  (honest omission beats invention).
- fitText everywhere prevented all wrap-collisions this run (0 vs 4 last run); the recurring
  defect class appears closed by the committed helper.

## 2026-07-10 - craft refresh (run 3 pre-research pass)

- **Personal profile carousels earn ~63% more engagement than company-page carousels** (dataslayer/linkboost 2026). Alaska.Ai posts from a page; the human should consider cross-posting the deck from a personal profile, or at minimum knows the page handicap is real. Aftercare-relevant, not a design change.
- **Buffer 2026 State of Social Media (52M+ posts)** reports a median LinkedIn carousel engagement rate far above single-format medians; the wide spread confirms carousels as the highest-ceiling format but says nothing new to change the build. Documents still #1 (~6.6% ER convergent).
- **Year-over-year platform contraction is steeper than the mid-2025 read**: views ~-50%, engagement ~-25%, follower growth ~-59% (dataslayer Feb 2026). Reinforces judging against OUR trailing median and the keepable-artifact strategy over applause. Nothing to change in the machine.

## 2026-07-09 - run 2 retro (Carousel No. 2, "One River, Two Ways to Count It")

- **Shipped 8.83 vs 8.3** (9 slides, vector PDF 4.94MB), zero hard fails, one pixel-refinement
  round + a passing flow round. Story: the Wood River AI drone + computer-vision salmon-counting
  pilot vs Bristol Bay's 70-year hand-count towers. Full worker roster ran (6 scouts, fact-checker,
  3 treatment-directors, copywriter, 5 pixel critics, flow critic, scorer) with no usage-limit
  degradation this time; parallel critics earned their keep (caught 3 things machine_qa passed).
- **Fact-checker saved us from two errors the scouts carried**: ADF&G is NOT a project partner
  ("isn't directly involved at this stage"), and the run forecast is 44.05M not 41.5M. Re-fetching
  every URL and dropping the unverifiable (BBRSDA dates, exact GVEA cents/kWh, the 4:30pm deadline
  time) kept the deck honest. Lesson reinforced: trust only fetched text, never scout summaries.
- **Honesty as the edge, not a hedge**: the deck's whole thesis is that the AI is UNPROVEN (in
  training). The gold UNPROVEN scorecard cell, the "CONF 0.00 UNTRAINED" cover tag, and "every
  number the fleet trusts came from a human hand" scored best-in-class story-art fusion (9). A
  thin-but-true frame beat a hyped one.
- **Display-headline wrap is the new slide-3 defect class**: four headlines (S1/S4/S7/S8) wrapped
  an extra line into the body and machine_qa-FAILED as overprint, all because the headline
  container was narrower than its longest line. New instinct logged; fix is full-width or downsize
  + verify line count pre-render.
- **Empty lower thirds** cost a craft point. Several slides left the bottom third dead. New
  instinct: budget the lower third (readout / caption / anchor / intentional quiet), do not default.
- **Canvas ctx.filter="blur()" works headless** for a discrete DOF foreground pass (S5 reeds);
  keep the focal layer outside the filtered save/restore. Cheap, reliable repoussoir blur.
- **NEW technique invented**: SpawningSockeye (added to TECHNIQUE_LIBRARY) -- a side-profile
  spawning sockeye SVG icon (humped dorsal, kype, olive-green head, forked tail) that reads as
  salmon at 432px and doubles as the deck's data anchor (the fish wears both counting marks).
- Story note: the drone pilot has NO published accuracy number yet; when the team reports one
  (or ADF&G formally joins), that is a strong UPDATE angle. GVEA July 13 turbine vote, STAK July 17
  comment close, and AKLNG July 16 vote all resolve within days -- docket-worthy follow-ups.

## 2026-07-09 - craft refresh (run 2 pre-research pass)

- Platform numbers hold, nothing new vs run 1's craft note: documents still the
  #1 format (6.6 to 7.0% ER, ~5x reach of static, 12.92% of all saves), 8-10
  slides, 15-20s dwell the ranking signal. (dataslayer/contentdrips/postunreel 2026.)
- **Echogram as a portable visual language (NEW craft handle)**: imaging-sonar
  fish counting compresses hundreds of sonar video frames into a single
  "echogram" band (time on one axis, range on the other, each fish a bright
  streak). This is a real, drawable, information-dense motif for any AK
  fisheries-AI deck: a seeded streak field where streak COUNT encodes the fish
  number and density encodes run strength, with a flat 2D axis. Portable to
  offline Canvas. (arxiv 2502.05129 "Counting Fish with Temporal Representations
  of Sonar Video"; arxiv 2505.06637 multimodal foundation AI for wild salmon in
  Indigenous rivers.) Parked as a technique candidate; only used if the story lands there.

## 2026-07-08 - run 1 retro (Carousel No. 1, "Four Rooms, One Open Door")

- **Shipped 8.64 vs 8.3** (9 slides, vector PDF 10.74MB) after one revision
  cycle. Round 0 scored 6.9: the scorer caught a slide-3 DOM text overlap
  (body line over a bar label) that machine QA passed - the
  machine-qa-is-not-taste instinct, confirmed the hard way.
- **DEGRADED run**: a session usage limit blocked ALL worker subagents
  mid-run (treatment directors, copywriter, pixel critic, flow critic).
  Showrunner authored the treatment/copy and self-reviewed; the objective
  gates (render QA, caption lint) and the scorer (which recovered later)
  still ran. Fallback held, but solo review missed a collision the scorer
  caught: parallel critics are not optional at full quality.
- **d3 zoom trap (new instinct)**: fitExtent to a small lon/lat bbox
  polygon renders a giant fill disc + mis-scaled map. Manual zoom (baseline
  full-state fit, then scale x zoom and re-translate onto the target) with
  a STROKE-ONLY coastline is the reliable recipe (slides 2 and 7).
- **data-decorative does not inherit**: mark the leaf text element (span,
  b, appended SVG text), not the parent div.
- **pypdf/cryptography panic**: the container's Debian cryptography 41
  rust binding panics on import, killing the vector PDF path;
  `pip install --user --upgrade cryptography` fixes it. Consider adding to
  bootstrap.sh.
- Scorer false-positive to remember: serif fonts render straight U+0027 as
  a typographic apostrophe glyph; verify quote characters with grep at the
  SOURCE level before treating as a hard fail.
- Story note: the STAK docket (ADL 422741) final decision lands after Jul
  17 - next run should check it for an update angle; Bristol Bay AI
  sockeye counting is the parked runner-up (claims c64-c77, fully
  verified).

## 2026-07-08 - craft refresh (run 1 pre-research pass)

- **360Brew is live as THE ranker** (LinkedIn Engineering, ~Mar 2026):
  distribution now runs on meaning/intent matching, not keywords. On-slide
  vector text and a topically explicit caption directly feed ranking;
  reinforces the vector-text hard gate. (dataslayer.ai 2026 algorithm
  review.)
- **AuthoredUp 3M-post study (Mar 2025 to Feb 2026)**: documents earn 39%
  more reach / 30% more engagement than the average post; documents are
  12.92% of all saves (2.6x their content share); only 4.88% of creators
  post documents regularly. Format edge persists. (contentdrips 2026-07-01.)
- **Q1 2026 softening**: carousel reach declining quarter over quarter
  while infographic-style posts hit 28.6% of top-1% posts. The keepable
  data-slide mandate is now the growth edge, not a nice-to-have.
- Mid-2026 "authenticity update": engagement bait, pods, and link spam
  penalized harder; polls effectively dead (0.07% ER). Nothing to change
  for us; confirms educational + native strategy.

## 2026-07-08 - framework build (engine smoke test lessons)

- **Grain economics**: full-frame feTurbulence grain rasterizes to a 10-40MB
  incompressible bitmap in the printed PDF. Always `AK.grainTile()` as a
  repeating background. (Encoded in TECHNIQUE_LIBRARY #2 and noise.js docs.)
- **Vector text survives blend modes**: Chromium's print engine keeps HTML/
  SVG text as vector even under mix-blend-mode overlays - but canvas text
  always rasterizes. Text in DOM/SVG, art in canvas. (Engine SKILL.md.)
- **`#map svg { display: block }`** - inline SVG baseline space overflowed
  the page by ~5px; the engine's body_overflow gate caught it. Always
  display:block full-bleed SVGs.
- **AlbersUsa inversion is a trap**: us-atlas TopoJSON is pre-projected and
  the inversion params are not recoverable reliably. We committed genuinely
  unprojected sources instead (Natural Earth 10m state outline via
  world-atlas; plotly unprojected counties for the 29 boroughs). Winding
  must satisfy the d3 spherical convention - rewind any ring whose
  geoArea > π.
- **3D composition must be computed, not eyeballed**: horizonY =
  cy + tan(−pitch)·f; a peak d units above the camera at distance D lands
  (d/D)·f px above the horizon. First two terrain attempts buried the
  range in the bottom 15% of frame. (Math now in ak3d.js header.)
- **Machine QA passed a slide the eye failed** (terrain crammed low, spec
  row colliding with ridge): objective gates catch errors, only pixel
  critics catch composition. Both layers are mandatory.
- **Simultaneous-contrast illusion**: bright strokes bounding a dark region
  make it read lighter than an identical fill elsewhere. Sample pixels
  before declaring a fill bug (we chased a phantom for four bisections).
- **Contrast estimator limits**: qa.py's bbox-median method under-detects
  text over busy varied art. The pixel critic must check worst-case
  contrast visually; the estimator is a tripwire only.

## 2026-07-08 - patterns adopted from the GitHub scout pass

- Instincts ledger (ECC pattern): ledger/instincts.json, confidence-scored
  lessons injected into future runs. Prune < 0.5 confidence after 8 runs.
- Variance dials + anti-repetition (taste-skill pattern): in the dossier
  header + artwork ledger.
- Claims-file fact-checking (Loki shape): claims.json with atomic claims,
  evidence URL + verbatim quote each; slides carry claim-ids.
- Completion gate (planning-with-files pattern): out/<run>/run_state.json
  phases must all be "done" with artifacts existing before merge/delivery.
- Critic text transcription (OCR-wave pattern, no deps): pixel critics
  transcribe every visible word from the PNG and diff against the dossier
  copy - catches font fallback, tofu, truncation that DOM checks miss.
- Candidates parked for later: microsoft/flint-chart (chart spec language),
  pyiqa (BRISQUE gate; heavy torch dep), meodai/heerich (SVG voxel mode),
  self-hosted Postiz (publish automation), pretext (text layout lib).

## 2026-07-09 - parked frontier + friction candidates (typography scan)

- **Variable-font WIDTH-axis fitting (parked).** Archivo and Unbounded carry
  a variable `wdth` axis; fit-to-width.js binary-searches the width axis
  (not just font-size) to fit a line, preserving optical size and cap-height
  while narrowing letterforms. Would complement AK.fitText (fit wdth first,
  then font-size) for headlines where shrinking type reads as timid.
  Not bounded enough to land in one daily upgrade slot; revisit when a deck
  needs a wide poster headline held at a fixed size.
  Source: https://github.com/Lorp/fit-to-width
- **Pre-flight colon lint (parked friction fix).** scripts/site_build.py
  refuses prose colons on emitted pages; run 2026-07-09 hit it twice (a
  docket history note, the first_comment article-title colon) and had to
  rephrase at SHIP time. A cheap lint over ledger notes / emitted copy run
  earlier in the pipeline would surface it before ship. The gate is correct
  and must not weaken; this only moves the catch earlier. Bound it to the
  same colon rule site_build already enforces before implementing.

## 2026-07-12 - parked frontier candidates (accessibility / PDF scan)

- **Per-slide alt text surfaced in the Gmail draft (parked, highest-value).**
  In 2026 LinkedIn has no native organic image carousel; the only swipeable
  format is a document post (PDF/PPTX/DOCX), which LinkedIn RE-RENDERS into
  images. That means embedded PDF tags do NOT carry to the LinkedIn viewer;
  the reach/accessibility lever is the ALT TEXT typed into LinkedIn's upload
  UI per slide. The machine could emit a short factual alt string per slide
  (from the dossier + transcribed copy) and print them in the Gmail draft so
  the maintainer pastes them at upload. Parked because it needs a copy source
  of truth (dossier vs pixel-critic transcription) and gmail_draft.py work
  beyond one bounded daily slot; not a defect. Sources:
  https://www.oktopost.com/blog/linkedin-carousel-pdf-best-practices/ ,
  https://socialbee.com/blog/how-to-post-linkedin-carousels/
- **PDF /Lang + Marked flag in assemble.py (parked, near-bounded).** The
  public-site PDF (alaskaaihq.com) has no document language set; a screen
  reader guesses pronunciation. assemble.py already writes Title/Author/
  Creator metadata (lines 96-97) but no /Lang or /Marked. Setting
  writer's viewer prefs / catalog /Lang "en-US" is a ~2-line pypdf change
  that helps the site PDF (LinkedIn rasterizes, so no LinkedIn effect). Held
  because it touches the vector-PDF writer path and must be verified to not
  disturb the vector-text output the hard-fail gate checks; low value, so it
  waits for a slot where assemble.py is already open. Full PDF/UA tagging
  (structure tree, per-image alt, reading order) is a large unbounded effort
  on vector-drawn pages with no semantic DOM and is NOT recommended. Source:
  https://www.grackledocs.com/en/a-guide-to-wcag-standards-for-pdfs/

## 2026-07-13 - parked frontier candidate (headless-rendering scan)

- **Pin chromium-headless-shell / re-baseline on any Playwright upgrade
  (parked, watch item).** Playwright v1.49 removed Chromium's OLD headless
  mode; the NEW headless mode (real Chrome without a window) renders
  screenshots DIFFERENTLY and the Playwright team explicitly says to update
  all screenshot expectations after upgrading. Playwright ships a separate
  chromium-headless-shell build (install --only-shell) that keeps the old,
  lighter, deterministic behavior render.py currently relies on. This engine
  pins nothing and re-baselines nothing, so a future Playwright/Chromium bump
  in the cloud environment could silently shift PNG output, kerning, WebGL
  behavior, and every pixel gate's baseline at once. Parked (not a defect
  today; the installed Playwright still uses the shell path): when the
  environment's Playwright is upgraded, either pin chromium-headless-shell or
  re-verify examples/demo-deck + examples/proof-3d visually and re-baseline
  the busy-art/contrast noise floors BEFORE trusting a green run. Sources:
  https://github.com/microsoft/playwright/issues/33566 ,
  https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/check

## 2026-07-14 - craft refresh (LinkedIn saves + isometric geometry)

- Saves are among the strongest 2026 LinkedIn distribution signals, and a
  clear NUMBERED framework (a titled, enumerated set the reader can act on)
  is one of the most consistently SAVED B2B document formats. When a story
  supports it honestly, a numbered spine (N steps / N rooms / N forces) is a
  save-bait structure worth reaching for, without ever faking enumeration.
  Sources: https://www.oktopost.com/blog/linkedin-carousel-pdf-best-practices/ ,
  https://www.socialpilot.co/blog/linkedin-carousel
- Isometric projection (three axes at 120 degrees, equal foreshortening) is
  a fresh hero geometry available to this deck series: pseudo-3D depth from
  a purely 2D SVG/Canvas draw, no GL frame required, and it reads as a
  built system (a grid, a campus, a network) rather than a camera-map or a
  raymarched hero. Keep line-weight and shading layered per the doctrine
  ladder. Source: https://fastercapital.com/content/Visualization-Techniques--Isometric-Projection--A-New-Angle-on-Data-Visualization.html

## 2026-07-14 - retro (Carousel No. 7, "The Anchorage Address", 8.95)

- DEGRADED SOLO RUN. All studio subagents (scout, fact-checker, treatment,
  copywriter, pixel-critic, flow-critic, scorer, upgrade-engineer) died on the
  account weekly usage limit ("resets 5pm UTC"). Main-loop WebSearch/WebFetch
  and the Gmail/GitHub MCP tools kept working, so the showrunner ran every
  phase solo and still shipped. The binding risk in that mode is main-loop
  budget, not any one subagent; the pipeline degrades to a one-operator studio
  cleanly.
- STORY. An Alaska-incorporated, Anchorage-HQ, Native-owned SBA 8(a) firm
  (ReconCraft) won a $24.96M sole-source Navy contract for autonomous
  low-profile vessels, built in Clackamas, Oregon. The sharpest honest angle
  was the gap between Alaska's paper footprint (ownership, 8(a), address) and
  its physical one (the Oregon shipyard). FAR 19.805-1(b)(2) tied the
  sole-source basis directly to the 8(a) status.
- CRAFT. The waterline-as-both-physics-and-argument metaphor carried the deck
  on one fixed-y line plus sonar rings, no GL required. Canvas-2D orthographic
  hero instead of a rendered-ladder GPU hero, by reliability choice; that is
  the run's scored growth edge.
- HONESTY GUARDRAIL. ALPV spec figures are the vessel CLASS's documented
  numbers (Leidos/DIU/Marine program), not ReconCraft's unspecified design, and
  every specs slide says so. Autonomy framed as uncrewed remote plus waypoint
  today with future autonomy, never full AI self-piloting.
- DATE BOUNDARY. Trigger fired at Anchorage 2026-07-13 20:10 after the 07-13
  edition had already shipped; dated this run 2026-07-14 to avoid a same-date
  collision. Watch for this at the day boundary.

## 2026-07-17 - upgrade-engineer scan (parked candidates)

- PARKED (frontier, editorial cartography): 2026 news-graphics desks converge
  on MINIMALIST maps for the map-hero decks this studio ships (akgeo.js). A
  reusable convention set worth building when a map-heavy deck's artwork-craft
  is the growth edge: calm background (warm light grey / soft beige / very pale
  blue), ONE to two accent colors for the focal region only, LIGHT relief
  (soft gradient or faint contour-inspired lines, simple water texture) instead
  of a loud high-contrast hillshade, label ONLY narrative-referenced features,
  a small locator inset (globe/wider-context highlighting the focal region),
  and an optional scale bar. News-map content analysis puts real desks at scale
  bar 31.2% / inset 28.1% / legend 25% / north arrow 18.8% prevalence, so an
  inset + light relief are the highest-leverage additions. Overlaps the parked
  relief-depth helper (2026-07-15) and map design-space reference (2026-07-10);
  build as one akgeo helper with A/B across two map decks before adopting.
  Sources: https://www.onestopmap.com/blog/minimalist-editable-vector-maps/ ,
  https://www.researchgate.net/publication/405348439_Designing_Maps_in_News_Stories_A_Longitudinal_Visual_Content_Analysis_of_Cartographic_Design_in_US_Data_Journalism
- PARKED (reactive, deferred): AK3D landscape-hero framing helper. The S6
  terrain hero this run needed two hand-reframes (valley too low + too dark,
  large near-black dead mid-band; fixed by brightening the valley floor and
  raising the horizon via smaller cy / lower pitch magnitude). Reusable
  helper = auto-place horizon in the upper third and lift valley-floor
  luminance above a dead-band threshold, mirroring AKT.objectHero (2026-07-12).
  Edits shared 3D craft; wants multi-deck A/B, so held to an improvement slot,
  not forced into a daily budget. Instinct ak3d-terrain-hero-resolves-flat
  already logged.
- MAINTAINER NOTE (not an upgrade): config/scoring_rubric.yaml criteria
  weights sum to 1.10, so weighted totals run ~10% high vs a nominal 0-10
  scale (this run 9.07; normalized ~8.25). Renormalizing weights or restating
  the 8.3 threshold is a gate change and is the maintainer's call, not made
  autonomously.

## 2026-07-18 - retro (Carousel No. 10, "On the grid, or off it", 8.90)

- STORY. The kitchen-table data-center question, corrected: will an Alaska data
  center raise your power bill? The honest answer splits on one wire. Off-grid
  North Slope (STAK) self-generates behind the meter, disconnected from the
  Railbelt, so it CANNOT raise city bills (the misconception behind 500-plus
  angry comments). The on-grid project the state just advanced (AIDEA's ~30 sq
  mi Mat-Su transfer, July 16-17) can, and there a big load either spreads fixed
  costs and LOWERS rates (per a Launch Alaska op-ed) or competes for scarce gas
  and RAISES them, decided by the rate deal. The gap: Anchorage adopted AO
  2026-27 (10 to 2) while the statewide bill HB 259 sits in the House Energy
  Committee. Both Beat A and Beat F independently converged on this as the
  send-to-a-coworker story.
- CRAFT. New hero: an ISOMETRIC WIRING-DIAGRAM built-system with ONE conduit
  motif that changes shape every slide (cut/junction/severed/snap/fork/baseline/
  dormant/solid-vs-dashed/sealed) + a gold progress tick + edge-tease. The
  strongest story-art fusion move: the off-grid subject rendered as a DETACHED
  slate slab with NO glow makes "disconnected = cannot touch your bill" legible
  at 432px with zero words (story-art fusion scored 9). Fresh iso hero, never a
  series signature; diverged from all last-4 heroes; offline pure-Canvas iso, no
  GL race.
- GROWTH EDGE (recurring). Artwork-craft capped at 7 again: the S5 FORK hero,
  the deck's own designated depth showcase, read as a FLAT two-arrow schematic.
  The iso chassis broke the flat-hero weakness on S3/S4 (raised slabs/boxes with
  three-face light + cast shadows read dimensional) but NOT on S5, where a flat
  gold disc + a barely-visible DOF-blurred grid stayed flat. Lesson (new
  instinct iso-focal-node-needs-raised-base): give the one hero node a genuinely
  raised 3D pedestal (three-face base + real contact shadow) and make the DOF
  grid present enough to read. Held to a logged lesson, not re-opened post-score.
- HONESTY. C4 (Chugach 1%/yr, 2.3% in 2025, $2.5M per 1%) is an attributed
  Launch Alaska op-ed, flagged on-slide on S5 ("Launch Alaska argues") AND inside
  the S6 card frame ("PER A LAUNCH ALASKA OP-ED, ADN, APRIL 2026"); the two rate
  arrows were rendered EQUAL so the deck favors neither outcome. AO 2026-27
  (adopted, solid gold, 10-to-2 bar) vs HB 259 (in committee, dashed phantom
  void) encodes "Anchorage acted, the state has not" without overclaiming. No
  AKLNG-buyer claim. Fact-checker caught and corrected SB 250 -> HB 259 and
  dropped an unverifiable Cook-Inlet-gas-share figure.
- RECORD-SYNC. copy_sync_check caught 6 real drifts after the pixel-polish
  hand-edits (readout "MMcf gas / day" -> "per day"; the shortened S4 parcel;
  the S6 kicker/card-header/annotations that are separate rendered elements);
  reconciled copy.json to the shipped render before ship. The check earns its
  place every run there is a hand-edit.
- MAINTAINER WATCH-ITEM (from the scorer). This is the 4th deck touching
  data-centers-and-electricity (Nos. 1, 4, 6, 10). The frame here is genuinely
  distinct (ratepayer economics / on-off-grid), but if audience data shows topic
  fatigue, space these out.

## 2026-07-18 - upgrade-engineer scan (LinkedIn platform focus, parked candidates)

Frontier focus = LinkedIn platform / algorithm 2026 (rotated off the last three:
self-improving-pipeline 07-14, procedural-relief 07-15, editorial-dataviz 07-17).
The whole document-carousel strategy is REVALIDATED, not threatened: PDF/document
posts remain the single highest-reach native format (reported ~6.60% engagement;
3-6x the reach of text/image/video), and the March 2026 "Authenticity Update" +
the 360Brew ranking model reward exactly what this studio already makes (topical
depth, real dwell time, honest non-baity copy). Current specs are compliant:
9 slides sits in the reported 8-10 sweet spot (engagement drops after slide 10);
2160x2700 is portrait 4:5, the recommended feed ratio; the 80px safe zone beats
the >=50px minimum. No machine change is bounded enough for the daily budget
(the reactive copy_sync_check fix took the slot), so the levers are PARKED:

- PARKED (strategy -> possible scorer/gate improvement): SAVES are the dominant
  2026 ranking signal (reported ~5x the reach of a like, ~2x a comment), and
  infographics are now the single most common format among top-1% posts (28.6%).
  The lever is SAVE-WORTHINESS: is any single slide a keepable, screenshot-worthy
  reference on its own? The routine already prizes "a keepable data slide"; the
  bounded upgrade candidate is to make it explicit -- a storyboard-gate line and
  a scorer descriptor asking "would a reader SAVE this slide as a standalone
  reference?" Wants careful wording so it does not become a checkbox; hold to an
  improvement slot. Sources: https://www.oktopost.com/blog/linkedin-carousel-pdf-best-practices/ ,
  https://www.dataslayer.ai/blog/linkedin-algorithm-february-2026-whats-working-now
- PARKED (maintainer strategy note, NOT a machine change): the external-link
  penalty escalated in 2026 -- posts with an outbound link see ~60% less reach,
  and as of early 2026 even the "link in first comment" workaround reportedly
  carries a residual penalty. This studio puts source URLs in the first comment
  for integrity, which is non-negotiable, so this is a disclosure for the
  maintainer, not something the machine should auto-change. Possible mitigations
  worth a human decision: post the sources comment a few minutes AFTER the deck
  rather than instantly, or lead the caption with the debate/question and keep
  the link block purely in the comment (already the practice). Source:
  https://www.dataslayer.ai/blog/linkedin-algorithm-february-2026-whats-working-now
- CONFIRMED, NO ACTION: dwell time is heavily weighted and each swipe counts, so
  the tightly-paced one-point-per-slide + alternating text/visual rhythm the
  storyboard gate already enforces is the correct dwell play; polls collapsed to
  ~0.07% engagement (the studio never uses them). Nothing to change.

## 2026-07-18 - reactive gap for next Phase 12 (gmail_draft copy fields)

- RECURRED (logged 2026-07-17, bit again 2026-07-18): scripts/gmail_draft.py
  reads copy.get('post_copy') and copy.get('aftercare'), but the copywriter
  agent + Phase 6 emit 'caption' (the post text) and no 'aftercare'. Result:
  the "Paste the post copy" block and the Aftercare checklist render EMPTY in
  the draft unless the showrunner hand-adds post_copy=caption and an aftercare
  list to copy.json before running gmail_draft. The showrunner patched it in
  the moment this run. Bounded permanent fix for a future Phase 12: make
  gmail_draft.py fall back post_copy -> caption when post_copy is absent, and
  synthesize a default aftercare checklist from CAROUSEL_CRAFT (or have the
  copywriter emit both fields). Weakens no gate; removes a recurring manual
  step. Held this run because Phase 12's daily budget was taken by the
  copy_sync_check list-form fix.

## 2026-07-19 - craft refresh (annotation hierarchy on data slides)

Fresh EuroVis 2026 practitioner study on visualization annotation, useful for
this studio's keepable data slide:
- Attention plan, not a pile: pick ONE primary annotation, give it the strongest
  placement and emphasis so it reads first; keep every other annotation
  consistently secondary via lighter weight and reduced salience. Busy-ness reads
  as amateur.
- Annotate next to the data, not in a detached legend or keyed list. For any
  small-multiples panel, label in place rather than off to the side.
- LinkedIn platform side: no change from the 2026-07-18 scan (documents still the
  highest-reach format, saves the dominant signal, 7 to 10 slides the sweet spot).
  Logged nothing new there.

## 2026-07-19 - run retro (Carousel No. 11, permafrost digital twin, 8.81)

Story: a Penn State physics-informed ML digital twin of ONE Utqiagvik permafrost
road embankment (two buried 1 km fiber cables, 3 winters of thermal/seismic data).
Chosen as a net-new topic over an in-window STAK data-center re-touch (11 days after
No.1, would have been the 5th data-center deck) to protect feed variety. Single-source
(Phys.org; the JGR paper was paywalled/HTTP 402), framed honestly on-slide and in the
first comment; ~5 weeks old, framed as recent research not breaking news.

- WON: the first genuinely rendered PBR hero of the recent series (S4 akthree cable-in-
  gravel still-life, film-graded), which the scorer said resolves the flat-hero weakness
  flagged across Nos. 8-10. Best-in-class story-art fusion per the scorer: the lone gold
  tick on a vast empty plain plus the SOURCED vs NOT CHECKED evidence tags render the
  single-source honesty as a visual argument.
- FIBER-CORE CRAFT: an emissive core tube placed INSIDE a larger jacket tube renders
  invisible. Place the glowing core riding the jacket top CROWN (center y ~ jacket_center
  + 0.85*radius) so it reads as a lit fiber, and keep the emissive hue cyan with bloom
  strength <= ~0.45 or it blows out to white/chrome (pixel critic flagged the white read).
- THREE ENGINE-CRAFT GOTCHAS (now instincts): (1) a classic body <script> runs before
  later-in-body elements exist -> getElementById(grain) returned null and failed 8 of 9
  slides; put touched elements before the scripts. (2) canvas fillText labels fail
  copy_sync_check AND the vector-PDF contract; set every label in DOM/SVG. (3) an inline
  appended <svg> needs display:block or it trips body_overflow (S1/S9).
- WATCH-ITEM (scorer): factual weight scored 7 (single-source) and dead lower zones on
  S5/S8/S9 held artwork-craft at 8. Next permafrost-style deck: corroborate a second
  independent source before build, and fill empty diagram regions with graded texture/depth.
- REACTIVE GAP STILL OPEN (logged 2026-07-17/18, held again): gmail_draft.py reads
  copy.get('post_copy') and copy.get('aftercare'); copy.json now carries both (added this
  run), but the permanent fallback fix in gmail_draft.py is still a Phase 12 candidate.
  [RESOLVED by upgrade(2026-07-19): gmail_draft.py now falls back post_copy -> caption and
  synthesizes a default aftercare checklist when the fields are absent.]

### Phase 12 PARKED candidates (2026-07-19)

- PARKED - slide-authoring "element referenced before it is defined" lint. D1 this run:
  a classic (non-module) body <script> ran at parse time and did getElementById on a
  grain <div> placed AFTER it, failing 8 of 9 slides ("Cannot read properties of null").
  render.py already hard-fails on this (page_errors -> exit 1), but late (post-render). A
  pre-flight static lint could catch it earlier, BUT a reliable one must model defer /
  module (deferred by default) / DOMContentLoaded / script-after-element guards or it
  false-positives, so it is parked. Bounded near-term win instead: a SKILL.md slide
  contract rule -- "any element a parse-time classic script touches must appear before
  that script, OR wrap the script in DOMContentLoaded / make it type=module / place it
  last in body." Sources: https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById
- PARKED - body_overflow diagnostic hint. D3 this run: an inline appended <svg> carries a
  baseline line-box and tripped render.py body_overflow on S1/S9 (fixed by
  "#map svg { display:block }"). render.py already hard-fails body_overflow; the marginal
  improvement is to append "(common cause: an inline <svg>/<canvas> baseline line-box; try
  display:block on it)" to the body_overflow message so the author does not rediscover the
  one-line fix. Held: diagnostic-only, no defect can ship, low ROI for an upgrade slot.

## 2026-07-19 - reactive gap for next Phase 12 (score_report key names)

gmail_draft.py reads score.get('ship'), score.get('threshold'), and
score.get('weakest_criterion'), but the scorer agent emits 'ships',
'ship_threshold', and 'weakest_criteria' (list). Result this run: the draft
first rendered the orange "Shipped below threshold. 8.81 / 10 vs ?. Weakest: ?"
banner even though 8.81 is ABOVE the 8.3 threshold. The showrunner hand-added
the alias keys (ship/threshold/weakest_criterion) to score_report.json and
regenerated. Bounded permanent fix for a future Phase 12: make gmail_draft.py
accept either key spelling (ship||ships, threshold||ship_threshold,
weakest_criterion||weakest_criteria[0]), OR have the scorer emit both. Weakens
no gate; removes a wrong-banner risk. Held this run (Phase 12 budget spent on
the two applied fixes).
[RESOLVED by upgrade(2026-07-20): gmail_draft.py now resolves ship via
ship||ships, threshold via threshold||ship_threshold, and weakest via
weakest_criterion||weakest_criteria[0] through a local _alias() helper, so an
agent-native score_report renders the correct banner with no hand-editing.]

## 2026-07-20 - Carousel No. 12 "Written in Pencil" (8.55, shipped, merged)

Clean run: no usage-limit degradation, no environment breakage, no retries; the
akthree GPU pencil hero (S5) rendered. Scorer weakest criterion was artwork
craft (7): 8 of 9 slides are deliberately flat editorial argument with one
rendered hero, and the hero reads slightly like a gold rod without a fully
distinct graphite writing tip (logged growth edge, not gate-level).

- COMPOSITION BLIND SPOT (recurring, confirmed via machine_qa.json): S6's
  headline overprinted the ISOTYPE grid of SVG <rect> marks and BOTH the
  text-vs-text collision gate (07-08) and the PNG busy-art edge-density
  tripwire (07-10) passed it clean -- only the pixel critic caught it. The grid
  rects are low-contrast enough that bg edge density under the headline glyphs
  stayed below the 0.03 warn floor. Same class as canvas/SVG art invisible to
  the DOM text-vs-text walk.
- Minor recurring (authoring discipline, not gate-level): two bodies wrapped to
  4 lines vs a 3-line dossier target (render.py reports line boxes); several
  data-decorative kickers/labels at 18-23px pass qa as data-decorative;
  low-contrast gold counters (~1.5-2.9:1) on lit-paper slides pass qa because
  they are data-decorative furniture (parked 07-11 contrast-floor idea).

### Phase 12 PARKED candidates (2026-07-20)

Frontier focus: typography / layout craft (last touched 2026-07-09; distinct
from the last four foci procedural-relief 07-15, editorial-dataviz 07-17,
LinkedIn-platform 07-18, headless-Chromium 07-19).

- PARKED - SVG/DOM TEXT-HALO helper (the aklabel.js analogue for vector text).
  aklabel.js gives canvas-drawn labels an opaque knockout plate, but DOM/SVG
  text sitting over SVG marks (this run's S6 headline over the ISOTYPE grid; any
  label over relief/chart marks) has no equivalent. The settled dataviz
  technique is a TEXT HALO: a contrasting-color outline behind the glyphs so
  contrast depends on (text, halo) not the art beneath. Concrete portable
  implementation, no new dep: SVG <text> with stroke=<halo-color>,
  stroke-width ~= 0.12-0.18em, stroke-linejoin=round, and paint-order="stroke
  fill" so the halo paints behind the fill (single element, no duplicate);
  halo color auto-picked near-black/near-white from the text luminance, mirroring
  aklabel's plate rule. Held: it is an IMPROVEMENT not a reactive fix (the daily
  0-1 budget was taken by the score-key fix), and it edits shared rendering craft
  wanting a multi-deck A/B. Sources:
  https://data.europa.eu/apps/data-visualisation-guide/text-halos ,
  https://courses.ems.psu.edu/geog486/node/557
- PARKED - text-over-SVG-mark QA warn (bounding the S6 blind spot). A gate that
  intersected primary text boxes against non-text SVG marks (<rect>/<path>/
  <circle>/<line>) would catch the ISOTYPE-grid overprint the two existing gates
  miss, BUT it false-positives on the many slides where text legitimately sits
  over background panels, cards, and chips. Not safely boundable this run without
  a mark-intent attribute (a data-mark or data-overlap-ok on the art, analogous
  to the text-side data-overlap-ok the 07-08 gate already honors). Bounded near
  term is authoring guidance instead: put a halo (above helper) under any
  headline that crosses a mark field. Held pending the intent-attribute design.
- PARKED - tabular lining figures on number-heavy stat slides. Datawrapper /
  Type Network confirm tabular figures (font-feature-settings "tnum" 1, or a
  lining/tabular numeral style) align numerals in columns and all-cap headline
  settings; several stat slides (S8 borough list, S6 step numbers) would read
  cleaner with tnum locked on. Craft note, not a gate. Sources:
  https://www.datawrapper.de/blog/fonts-for-data-visualization ,
  https://typenetwork.com/articles/opentype-at-work-figure-styles
- RECONFIRMED (no change): CSS text-wrap: balance/pretty still do NOT guarantee
  a headline line count nor prevent overflow, and pretty ignores widows (Chrome
  for Developers / MDN, Sept 2025) -- so aktype.js AK.fitText (JS binary-search
  fit-to-box) remains the correct headline mechanism, unchanged since 07-09. The
  4-line body overflow is authoring discipline, not a wrap-CSS fix.
