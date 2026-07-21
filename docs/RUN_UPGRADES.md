# Dispatch Run Upgrades — the fix-log / rollback trail

Every run appends a dated entry here (Phase 8 retrospective): what shipped, every
code/doctrine/asset change with commit refs, what was upgraded and why, deferred
known-issues, and the gate/panel result. This is the log to diff against and roll
back on if a later run regresses. Newest first.

---

## 2026-07-20 — "Alaska Ran the Sky" (Dryad / XPRIZE Wildfire finals at Nenana)

**Shipped:** ~57s vertical Dispatch, Gemini narrator (Sulafat, 54s read). Story: the XPRIZE
Wildfire "Autonomous Wildfire Response" finals were physically held in Alaska (Nenana Municipal
Airport, near Fairbanks, June 15 to 28 2026), UAF's ACUASI managed the airspace, and finalist
Dryad Networks says it demonstrated fully autonomous detection and suppression there, no human in
the loop. Earned angle (three-analyst angle room converged): proven IN Alaska, not done TO Alaska;
Alaska is the proving ground; honest guardrail drawn as a picture (controlled airfield test,
judging pending September, one test ignition vs a roadless megafire, Alaska made the range not the
drones, Anduril dual-use). Stance: celebratory (rotates off the recent cautionary AI-infrastructure
runs). Objective quality_gate.py: 9.3/10 with only FIRST_FRAME failing before the poster-frame fix
(see below); LinkedIn caption scorer 8.68 (ship 8.5).

**Bugs found and FIXED this run (the real retrospective material):**
1. **`out/` scratch was git-TRACKED** (a new vector of the recurring stale-scratch class the 07-18
   and 07-19 retros both flagged). A prior commit force-added `out/dispatch/*` despite `.gitignore`,
   so a fresh `git checkout -B main origin/main` silently restored the ALREADY-SHIPPED 07-19 GVEA
   turbine dispatch with a fresh checkout mtime, defeating run_guard.py's mtime freshness check.
   Confirmed live at run start (out/dispatch held the complete GVEA dispatch). ROOT-CAUSE FIX:
   `git rm -r --cached out/` so `.gitignore` actually takes effect (commit on this branch); each
   run still explicitly commits only the specific artifacts it wants kept.
2. **VO soundcheck crashed on a missing `librosa`** (ModuleNotFoundError in vo_soundcheck.py's
   pitch-variance gate) AFTER paying for 4 Gemini takes. Same silent-missing-dep class as the 07-18
   faster_whisper/resemblyzer gap. FIXED: installed librosa AND added `librosa, faster_whisper` to
   `scripts/setup_env.sh` (idempotent top-up) so it never recurs.
3. **WER canonicalizer inflated on compound splits (REPEAT-OFFENDER class).** Whisper transcribes
   closed compounds as two words ("airstrip"->"air strip", "megafire"->"mega fire"), so every take
   of this compound-heavy script scored 2 word-errors PER compound and all 4 takes landed 0.09-0.10
   vs the 0.08 threshold on a genuinely-correct read. This is the SAME canonicalizer-precision class
   as the 07-19 $/% fix, so per the repeat-offender rule it got a real code fix, not a defer:
   `scripts/vo_soundcheck.py` now joins a curated set of closed compounds SYMMETRICALLY (ref AND hyp)
   before the Levenshtein, so it can only cancel a tokenization mismatch, never invent a missing word.
   VERIFIED: script-vs-heard WER dropped 0.093 -> 0.034 (passes) while a garbage take stayed 0.966
   (the fix does not mask real errors).
4. **`Root.tsx` durationInFrames was hardcoded (1561f) and truncated the render.** The real VO
   retimed the piece to 1699f, so the first full render silently cut the last ~4.5s (the S6 button /
   signature liftoff). ENFORCED FIX: the Dispatch composition now derives its duration from the VO
   via `calculateMetadata` reading `total` from episode_props.json, so the tail can never be truncated
   again on a retime.
5. **`scripts/dispatch_mix.py` had a hardcoded VIDEO_SECS (1673f) and a STALE EVENTS list** (the
   07-16 Stak "square mile / gigawatt / paper storm" beats). FIXED: VIDEO_SECS now derives from
   `vo_lines.json` (max end + tail), and the SFX EVENTS were rewritten for this story's beats
   (>= 1 per scene, 22 events). Also deepened the pre-button music dip to clear the >=6 dB gate
   (measured 16.7 dB) and aligned storyboard `audio_arc.silence_at` to the real 44.2s dip.

**Upgrades made this run (growth mandate):**
- NEW HERO `Vale` (kit.tsx) — the guardian autonomous wildfire drone, expressive camera-eye tell
  (iris clamps on a lock), quad rotors + suppressant-tank belly, built to the depth bar.
- NEW BIOME `NenanaRangeBG` (Episode.tsx) — boreal airstrip (tarmac + runway lights + low spruce
  band), provably distinct from DawnForestBG / FrostYardBG. Environment kit now three biomes.
- NEW CRAFT ADVANCE (single primary) `IRVision` (lib/lighting.tsx) — reusable false-color thermal/IR
  heat-vision look system (magenta->coral->citron ramp + scanlines + THERMAL HUD); inherited by any
  future sensor/thermal Alaska story. Plus `SmellRings` + `ScanReticle` FX (lib/FX.tsx).
- NEW POSE `Moose.alert` (fauna.tsx) — ear-perk + head-raise sky-watcher, distinct from bumpKick.
- All registered in `lib/ASSET_MANIFEST.md` in this run's commit.

**Known issues deferred (with a concrete plan, not vague):**
- Scene-internal beat timings are still ABSOLUTE frame numbers hand-tuned to the VO bounds (S3/S4
  had to be re-timed by hand this run when the real VO made those scenes shorter than the drafts
  assumed). Plan: pass each scene's `dur` (from episode_props scenes) into the scene component so
  beat interpolations scale proportionally, removing the manual retime step. Deferred (a build-time
  refactor of all 6 scenes; too large to verify safely mid-run) — logged here as the plan.
- `AlaskaMini`'s pin is hardcoded at the North Slope position; for Nenana (interior) it reads
  slightly off-geography. Plan: add an `(x,y)` pin-position prop to AlaskaMini. Minor, deferred.

**Panel/gate result:** Objective quality_gate.py 10.0/10 (all 14 checks). Subjective 3-judge panel
across TWO rounds: round 1 median 7.0 (three HARD BLOCKERS: on-screen caption phonetic leaks
'Ex Prize'/'DRY-ad'/'nuh-NAN-uh', a compressed verbatim quote, plus a hovering signature liftoff and
a flat+silent megafire); ALL fixed; round 2 median 8.16 (8.26 / 7.46 / 8.16), editor SHIP,
flow-critic SHIP, ZERO hard blockers. Shipped below the 9.0 bar under the routine's disclosed-ship
rule: every concrete named defect was fixed and verified across both panels, and the sole remaining
gap to 9.0 is unanimous style-register / illustration-craft ceiling (the map blob, triangle-spruce
treeline, and megafire read flat next to the depth-lit hero; the hero itself reads a touch
cartoonish). That ceiling is the flat-vector-2D engine itself, which is a large-scale initiative
(true 2.5D + a deep asset library), now captured in docs/UPGRADE_BACKLOG.md (owner-requested), not a
mid-run patch. Trajectory 7.0 -> 8.16 shows the fixes landed; disclosed in the Gmail draft with the
full scorecard.

---

## 2026-07-19 (follow-up, owner request) — Phase 8 now FIXES, not just suggests

Owner: "when it does the retro at the end, I want it to also just fix things it found or
repeat-offender hurdles, on the spot, and in the email tell me the upgrades it did." The old
Phase 8 said "prefer MAKING the smallest upgrade... queue the larger ones" — a defer-by-default
bias, and the email had no field for the upgrade log at all (Phase 7 said to include it, but
`dispatch_email.py` had no `--upgrades` param, so it could only be smuggled into `--note`).

Changes:
- `prompts/dispatch_routine.md` PHASE 8 rewritten: triage every finding into FIX-THIS-RUN
  (fixable + verifiable → you MUST make it now, verify before commit) vs. genuinely-too-large
  (deferred only WITH a concrete plan). Hard REPEAT-OFFENDER rule: anything deferred once and
  recurred cannot be soft-deferred again — it gets a real code/gate/doctrine fix this run, or an
  explicit escalation to the owner in the email. Prefer an enforced code guard over a doctrine
  reminder (run_guard.py is named as the template).
- `scripts/dispatch_email.py`: new `--upgrades` param renders a first-class "Upgrades shipped
  this run" section (green block) listing what was actually DONE, one bullet per line.
- Phase 7 step 3 updated to pass `--upgrades` from Phase 8's fix list, with an ordering note
  (do the Phase 8 fixes before composing the email so the list is real).

Deferred (with plan, not vague): none — this was itself the fix.

---

## 2026-07-19 — "He Paid $50K Just To Wait" (GVEA North Pole turbine)

**Shipped:** ~52s vertical Dispatch, Gemini narrator (Sulafat). Story: GVEA paid a $50,000
deposit in April 2026 to hold an order slot for a second GE LM6000 naphtha turbine at its
North Pole Power Plant, board vote scheduled July 28, 2026; framed as a co-op acting like a
sophisticated buyer against a global AI-driven turbine backlog, honestly counterweighted by
North Pole's federal PM2.5 non-attainment status and a named clean-air advocate's objection.
Objective gate 10/10 (all 14 checks). Subjective 3-judge panel: 7.60 → 7.94/10 median across
two rounds (ship 9.0), zero hard blockers both rounds; shipped with the scorecard disclosed
per the routine's stall rule (median plateaued with only illustration-craft style notes left).

**Bugs found and fixed this run (the actual retrospective material):**
1. **VO WER canonicalizer silently broken.** `scripts/vo_soundcheck.py`'s word-error-rate
   check inflated to 0.19 (threshold 0.08) on every number-heavy line because `num2words` was
   missing from `.venv-voice`, so `$`/`%`/comma-grouped numbers/ordinals/years never got
   canonicalized before comparison. Installed the dependency AND rewrote the canonicalizer to
   actually handle all of those forms. Confirmed the fix discriminates correctly (the winning
   take dropped to WER 0.04-0.07; genuinely bad takes stayed bad at 0.68/0.25) rather than just
   lowering every score.
2. **Catastrophic caption/timing corruption** (`scripts/vo_synth_gemini.py`'s
   `_align_wholefile`): passing the script's own opening words as Whisper's `initial_prompt`
   made Whisper hallucinate-skip the first ~14.6s of real audio, and truncating multi-word
   token expansions to `word[0]` desynced the intended/heard index arrays — together these once
   produced a nonsensical 434.5s "total" duration for a 51s take. Fixed both independently,
   verified independently, then combined.
3. **Render-path silent bug.** `scripts/render.sh final <comp> <relative-path>` resolves a
   relative output path against `video-engine/` (post-`cd`), not the caller's cwd — a fix
   appeared to have "zero effect" identically across 3 render attempts because every retest was
   silently re-reading the same stale file at its true absolute location. Always pass absolute
   output paths to `render.sh final` now.
4. **LIVING_SCREEN gate: diffuse motion doesn't register.** The gate's coarse 90x96px-cell
   luma-delta grid needs a cell's AVERAGE to clear a floor after median subtraction; lots of
   small/diffuse particles (mist, snow) never move a cell average enough. Fixed by adding two
   large, high-contrast, spatially-isolated rotating telemetry dials present in every scene,
   not by adding more small particles.
5. **4:5 crop safe-area clip (caught this run, see Files).** S5's push+tilt camera transform
   was a CSS `transform` on the whole scene's `AbsoluteFill`, so it also carried the
   late-appearing Patrice Lee quote card upward once fully zoomed — clipping its top line above
   the 4:5 crop's safe box. Caught by actually extracting and viewing 4:5 crop-check frames
   (not just trusting the 9:16 master looked fine). Fixed by hoisting the quote card into an
   untransformed sibling layer. Lesson: any late-appearing overlay inside a camera-transformed
   scene needs to be checked against the CROPPED frame, not just the full 9:16 canvas.
6. **Stale `out/dispatch/` scratch files nearly shipped wrong content.** `post.txt`,
   `sources.json`, `shots.json`, `vo_script.json` were leftovers from a PRIOR run about a
   completely different story (the 07-18 AIDEA land conveyance), sitting in the gitignored
   `out/` dir. This is the SAME class of bug 07-18's retrospective already flagged
   ("`shots.json` was stale from the 07-17 episode") and it recurred in a worse form — this
   time it could have put the wrong caption and source list in the delivery email. Caught by
   checking file mtimes before trusting any `out/dispatch/*` content. **Fixed the root cause
   this run**, not just the symptom: added a mandatory `rm -rf out/dispatch` step to Phase 0 in
   `prompts/dispatch_routine.md` (see PHASE 0 step 5) so no run can ever again silently read a
   previous run's leftover artifact.

   **Follow-up (same day), the REAL fix:** the Phase 0 `rm -rf` above is still a soft fix — it
   depends on the agent remembering to run it, which is exactly the failure mode that let this bug
   recur (07-18's retrospective already said "regenerate per run" and it happened again anyway).
   So this was hardened from doctrine into a CODE GUARD: `scripts/run_guard.py`. First principles —
   a run starts at instant T (stamped once by `run_guard.py init` in Phase 0); every artifact this
   run legitimately produces is written at or after T; therefore any scratch file with mtime < T is
   provably a leftover. Freshness is read straight off the filesystem (mtime is trustworthy here
   precisely because scratch is gitignored, so git never rewrites its timestamps), so NO producer
   has to change — which matters because the bug was caused by pipeline DRIFT, and any fix that
   made every producer stamp/register its output would just re-break on the next pipeline change.
   `dispatch_email.py` now routes `--post` and `--sources` through `run_guard.fresh()` and HARD-FAILS
   (with both timestamps) on a stale or unstamped input, with an explicit `--no-freshness-check`
   escape hatch for deliberate manual use. Net effect: a stale artifact now fails the run loudly at
   the delivery boundary instead of silently emailing the wrong story. Landed on a follow-up branch
   off main, not this run's branch.

**Upgrades made this run:**
- NEW asset `Sourdough` (kit.tsx) — personified regional power-plant hero, warm/rounded/blocky
  shape language (deliberately opposite ServerMachine/MachineShadow's cold rectilinear
  institutions); emotions proud/confident/faltering/frozen, furnace-window-chest emotional
  tell. Given a texture pass (panel seams, specular, weathering) mid-run after panel feedback
  flagged flat fill as the one recurring illustration-craft drag.
- NEW asset `Cell` (kit.tsx) — battery-storage sidekick, charge-level face.
- NEW environment `FrostYardBG` (Episode.tsx) — second biome (mist/gust bands, flickering
  skyline windows, snow particles), registered in ASSET_MANIFEST.md.
- NEW engine system `HazeOverlay` (lib/lighting.tsx) — translucent grid-textured animated
  air-quality grading layer, registered in ASSET_MANIFEST.md.
- NEW pose `Moose.bumpKick` (lib/fauna.tsx) — comic bumped-indignant-recover reaction
  (squash-stagger, ear-pin, antler wobble, impact stars) for a recurring line-cutting gag.

**Known issues deferred:**
- Sourdough's illustration craft (fill/shading depth) was the sole consistent drag across both
  panel rounds even after the texture pass — next run should give it a real form-shading ramp
  like the lighting engine gives everything else, not just surface detail.
- The subjective panel median (7.94/10) still sits below the 9.0 ship threshold; this was a
  disclosed, routine-sanctioned ship decision (zero hard blockers, style-register complaints
  only, stalled improvement trajectory), not a resolved gap.

**Commits (branch claude/dispatch-2026-07-19):** story + angle + storyboard + art direction →
Gate 0D contradiction resolution (x3) → build phase (VO fixes, scenes, mix, caption) → audio_arc
re-anchor → LIVING_SCREEN motion fixes (x2) → SwingSign overflow fix → Gate B fix pass (7.60
median) → Sourdough texture pass → quote-card 4:5 safe-area fix + asset-manifest registration.
See `git log` on the branch for exact refs.

---

## 2026-07-18 — "The Fence That Falls Short" (Mat-Su AIDEA land conveyance)

**Shipped:** ~67s vertical Dispatch, Gemini narrator, objective gate 10/10. Story:
Alaska's proposed non-competitive conveyance of ~31 sq mi of Mat-Su birch forest
near Houston to AIDEA for speculative data-center/rail development, no operator
named, local ban falling two miles short of the parcel, comments open to Aug 19.

**Panel trajectory (config/dispatch_rubric.yaml, ship 9.0):** this run was a major
craft-engine rebuild, tracked across four 3-judge panels — median 6.62 (pre-engine)
→ 7.70 (environment lighting) → 7.78 (full-frame lighting) → motion pass + Gemini
(not re-paneled; owner accepted as ship-worthy). Objective gate 10/10 throughout.
Delivered below the 9.0 subjective bar by owner decision, disclosed here.

**Upgrades made this run (with why):**
- NEW ENGINE `video-engine/src/lib/lighting.tsx` — principled depth system
  (tones() key/core/shade ramps, FormGradient, RimLight, ContactShadow/AO,
  Bark/BrushedMetal/Foliage texture, filmic GradeLayer, anisotropic MotionBlur).
  Why: three judges unanimously read the old flat-fill art as "clip-art"; this took
  illustration craft 4/5/6 → 8/7/8 and color 6/6/8 → 8/8/8.
- APPLIED lighting to environment, MachineShadow, the Character rig, and the sled
  dogs; added a gallop gait + 180° motion blur to the dogs and a physical
  shockwave/dust stake impact (replacing a flat comic starburst). Why: motion craft
  and "flat sticker" figure were the named ceilings.
- ROSTER GROWTH SYSTEM (owner directive: stop reusing, grow as artists):
  - `prompts/dispatch_routine.md` §4.3a growth mandate (net-new floor per run),
    §4.1a art-direction pass, Gate 0D (art-direction critic), Phase 8 retrospective.
  - `lib/ASSET_MANIFEST.md` living inventory + backlog.
  - `lib/fauna.tsx` bestiary seeded 1 → 5 (Moose, Raven, BaldEagle, Salmon).
- VOICE: retired the cloned Chatterbox voice for the Gemini TTS narrator (Charon)
  per owner; fixed the Gemini billing/key path (prepay→postpay, project-scoped key).
- BUG FIXES worth remembering:
  - `build_timeline.py` filename-collision that silently SHUFFLED VO line audio on
    re-run (every line but the last played the wrong content) — rewrote to read from
    a permanent `recovered/` source dir; verify VO order by transcript, always.
  - `dispatch_captions.py` — retry whisper alignment + normalize cues (monotonic,
    non-overlapping, min 0.8s) so no caption can collapse to a 0.04s flash.
  - `build_scenes.py` — SCENE_START_LINE had 8 entries vs 6 scenes, so episode_props
    silently fell back to hardcoded bounds; corrected to [0,2,4,6,8,10].
  - `shots.json` was stale from the 07-17 episode; regenerate per run.
  - SILENCE_DIP + VIDEO_SECS in the mix now derive live from vo_lines.json.

**Known issues deferred (owner-acknowledged):**
- Gemini voice reads slightly robotic — tune prosody/style (or a warmer voice /
  ElevenLabs) in a later run.
- HUD/label chips (StatCard, boundary polygon, dotted chain) still render as flat
  fills over the lit world — give the label kit form-shading + drop shadow next.
- Non-question VO close caps the Writing axis; consider a question button.
- SledDogTeam should be promoted from Episode.tsx into fauna.tsx and parameterized.

**Commits (branch tsturg/lucid-cray-s1n1b2):** caption/dip fixes → audio-shift
recovery → scene retime → HUD_TEXT fix → lighting engine → full-frame lighting →
motion pass → Gemini VO retime → roster-growth system → art-direction/retrospective
doctrine. See `git log` on the branch for exact refs.

## 2026-07-20b — "The Referee Arrives" (salmon bycatch meets the AI that counts the fish) — EXTRA TEST RUN

Shipped: ~61s Dispatch (4:5 LinkedIn + 9:16 TikTok cuts, permanent links verified 200), Gmail
draft, disclosed-scorecard ship. Objective gate 10.0/10 on the delivery render (LIVING_SCREEN
100%, zero dead windows). 3-judge panel: first pass median 7.96, fix round verified by regrade,
final median 8.36 (J1 8.56 / J2 8.10 / J3 8.36), ZERO hard blockers across both rounds. Shipped
under the rubric's stall rule (concrete defects all fixed; remaining asks are 9-tier polish).
Owner ran this as a second same-day run to test the whole automation; dedupe cadence rule
bypassed by owner instruction, story dedupe still enforced (FRESH).

### Fixes MADE this run (committed, not suggestions)
1. scripts/dispatch_mix.py: alimiter was running with its default `level=true`, which silently
   NORMALIZES the signal UP after loudnorm — the master left the mixer at +0.0 dBTP. Fixed with
   `alimiter=limit=0.86:level=false` (delivered master: -14.5 LUFS, -1.3 dBTP). This class of
   bug would have shipped a clipping-risk master on every future run.
2. lib/props.tsx TallyCounter: odometer variant displayed the PREVIOUS digit at rest (flip=0
   showed prev instead of the target) — the button beat read 0001->0000->0002. Fixed at the
   component level.
3. 4:5 SAFE-BOX incident: the burned-in hook headline sat at y=210, ABOVE the 4:5 center-crop's
   top edge (y=285) — the LinkedIn cut would have amputated the hook. Moved all burned-in plates
   inside the safe box. RULE FOR FUTURE RUNS: any screen-space chrome must sit inside y 285-1635.
4. Character rig global depth lift (the panel's #1 lever, +0.40 median): core shade 0.88,
   doubled rim light, fabric sheen band + under-shade, far-leg AO, stronger contact shadows.
   Applies to every future dispatch's human cast.
5. GradeLayer grain vs LIVING_SCREEN interaction (doctrine note): raising grain 0.05->0.085 to
   kill sky banding LIFTED the median luma-delta and suppressed motion-region detection —
   HOOK_WINDOW dropped from 4 regions to 2 and failed. Settled at 0.065 + stronger authored hook
   motion. Lesson: grain is not free; verify LIVING_SCREEN/HOOK_WINDOW after any grade change.
6. Stage3D episode migration (the manifest's #1 "known next advance"): the signature boom-up
   crane (S5) is the first Episode scene on Stage3D (riseWith + dollyThrough over an overscanned
   2400x3200 world plane). Learned: non-fill Planes render as cut-out boxes unless the world
   plane is overscanned well past the frame at max pull-back; documented in the scene comment.
7. Net-new library: TallyCounter (mechanical clicker + odometer count marks), VideoWeir
   (fisheries-monitoring stage), Character 'referee' outfit + 'raise' pose. All registered in
   ASSET_MANIFEST.md.
8. Editor fact-hardening: unverified co-sponsor attribution removed from the bill card (the
   July revamp is Sullivan's per KUCB; the Jan trio stays off-screen), counting plates re-worded
   to "N labels" so training annotations cannot read as population counts.

### Deferred WITH plan (first-time deferrals, manifest backlog)
- Fish body-deformation swim (panel: fish translate as rigid sprites): add a spine-follow
  deform to fauna Salmon (tail-to-head phase lag on the body path), ~1 session, in fauna.tsx.
- Human ensemble micro-texture ("simple cartoon" tell): fabric hatch + skin specular pass on
  the Character rig at the lighting layer, behind a `detail` prop so showcase scenes stay cheap.
- Kinetic caption treatment (mid-sentence chunk complaint): word-level caption reveal driven by
  words.json timings in the Captions component.

### Panel/gate record
Gate 0A PASS (7/9 + 9/9 axes diverged, 7 shot-worlds); 0B ship (5 improvements applied);
0C revise->ship (85,000 number-sync repaired on the board); 0D revise->ship (ScanReticle killed,
mechanical TallyCounter adopted, mint dropped for cream-and-brass). Objective gate: 10.0/10.
Caption Gate A PASS (2,052 chars, hook 138) + scorer 8.66 ship + editor fixes applied.
Panel medians: 7.96 -> 8.36 after the verified fix round. VO: Gemini Sulafat take 0/3, score
0.964, WER 0.071, pitch var 4.33 st, 59.0s.

## 2026-07-21 — CRAFT SESSION (no episode): fish mastery + Anchorage kit + the smartness gate

Owner-directed engine session after cold-watching the 07-20b cut. No video shipped; the
2026-07-20b episode stays FINAL and untouched.

1. lib/fishcraft.tsx NET-NEW — the shared fish-realism engine (chrome layer stack, shingle
   scales, carangiform traveling-wave swim with emergent figure-8 tail, gill pulse, rippling
   fin membranes). Doctrine + sources: docs/craft/FISHCRAFT.md. This also RETIRES the
   "fish body-deformation swim" deferral from the 07-20b list: fish now swim on a spine wave,
   not as rigid sprites.
2. Sockeye REBUILT on fishcraft (v3, 8 taste rounds); Coho, RainbowTrout, Halibut NET-NEW
   (owner: "salmon are silver and scaly and shiny" — chrome ocean phase is the default hero
   look). Audition sheet: FishShowcase.tsx.
3. Hard-won SVG rules now encoded in fishcraft + FISHCRAFT.md: single-closed-loop outlines
   (two concatenated subpaths auto-close with chord artifacts: three taste rounds chased a
   "shine stripe" that was actually unfilled background through the body); spec bands fade
   before the caudal wrist; body profiles keep a wrist floor; uid() must hash ALL variant
   props; never blur thin strokes (filled gradient bands instead).
4. AnchorageSkylineBG NET-NEW in lib/biomes.tsx (4 taste rounds): Sleeping Lady, Chugach wall
   with termination dust + Flattop, ConocoPhillips/Atwood slabs, Hotel Captain Cook mustard
   steps, Cook Inlet, coastal trail; animated floatplane + Alaska Railroad. Plus two verified
   local-flavor reference docs: docs/craft/ANCHORAGE_LANDMARKS.md and
   docs/craft/ALASKA_NOSTALGIA.md (usage + sensitivity + trademark rules inside).
5. NARRATIVE INTELLIGENCE fix (owner: the cut "didn't feel intelligently narrated, it felt
   random"): §4.2 of prompts/dispatch_routine.md now carries the causal-chain law (every line
   answers therefore/but/because; actors named before use; one story question; trim whole
   facts, never connectives) and Phase 4.5 gains GATE 0E, a naive cold-read critic that sees
   ONLY the VO text and must retell the causal chain, identify every actor from the text
   alone, and state the piece's single question before any synth. Root cause: the 125-word
   compression stripped connective tissue and every existing gate looked at visuals or
   pacing; nobody ever read the script cold.
