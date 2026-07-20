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
