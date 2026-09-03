# Dispatch 2026-09-03 active worklog

Execute the complete daily pipeline from prompts/dispatch_routine.md. Draft only, never send.
Main fetched and prompt read in full. Branch claude/dispatch-2026-09-03 and run stamp created.
Environment setup passed. Keychain credential presence verified without output. Research window 10 days.
Three researchers, independent validation, FRESH dedupe and story gate passed. Angle room and
cross-challenge complete. Locked story is TCC's September 2 Sully.ai announcement, title
The Care Has to Stay. No claim of proven outcomes or completed rollout. Directors room complete.
Gate 0A/B/C/D/E pass after specific storyboard, fairness and flow revisions. Narration 277 words.
Three Gemini takes generated (118.2s, 114.3s, 116.2s); take0 passed WER0.015 and pitch9.19.
Whole roughcut rendered, muxed with real audio, ffprobed131.0667s and contact sheet LOOKED.
Independent density review found12meaningful facts inside7bundles, still insufficient for118s.
Two repetitive lines replaced with sourced recording-HIPAA assurance and tell-provider refusal
procedure. Surgical patch9/14 passed WER0 each,1.0xpace,4,721,346outside samples unchanged.
14claim ledger/VO gate passes. Word ledger now moves atomically with surgical captions/audio.
All14scenes authored and four affected-range visual passes inspected. Hand approaches actual
lever grip; OFF now aligns with phase-continuous brake, and its label clears exposed linkage.
Continuous illustration/TCC attribution is on hypothetical care scenes. Source labels and
policy timing corrected. Claims contract passes14 obligations through actual rendered Label routing.
Text-fit covers57variants; overlap covers14scenes; unknown transformed bounds remain disclosed.
71Python tests and6shelf tests pass; final typecheck completing. Narration is271words,
14independently validated facts in117.78s; patch report binds the two new voice slots.
Current PCM mix -14.83LUFS/-2.38dBTP. Scheduled0.90s dip includes tails; core is near-silent.
Next: full-resolution final render/encode, rendered objective gates, independent panel,
exact-byte ship lock, permanent delivery, visually verified Gmail draft and merge.
Production changes committed as1792245 and plan/proof as4072ded. Render83280 completed all3932
frames16MB; chunk9 recovered after one Chrome-start timeout. Encode16705 FAILED on actual AAC
true peak -0.48dBTP despite passing PCM. GateA59674 completed all3932 actual frames in
frames_0903_r1: 8.7 FAIL, CAMERA_MOTION S3/S6/S9/S10 and LIVING_SCREEN39/64 (61%, floor80%).
All other GateA checks pass, including hook[3,4], captions,38SFX and6.3dB silence dip.
Original R1 cuts/mute/mix/receipts/report copied to out/dispatch/round1; no shipped history changed.
Exact living diagnosis maps all25weak windows; at least13more must pass with credits unchanged.
Camera fixer owns Ep0903 and is repairing sustained camera travel and meaningful local actions,
especially S2/S11. No gate thresholds or criteria were weakened. No September3 Gmail/publication.
Remix with controlled peak limiting and +0.3dB output passes a real192kAAC48kstereo preview:
-14.85LUFS, -2.60dBTP, LRA6.10. New scripts/mix_aac_check.py runs before finish-mix, is bound in
MIX_REQUIRED, and9focused tests+21provenance tests pass. Final encoded cut must still pass too.
Read-only early probes flag camera timing: most moving shots finish before GateA's25/75%
sample pair. Research fixer diagnosed real but front-loaded camera moves and recommended
symmetric travel over8-92% ofshot, substantial environment planes, stable screen-space labels.
Do not lower camera threshold or relabel static to pass. Confirm actual report, fix named
failures, probe exactpairs, rerender/regatebeforepanel. No panel convened yet.
b787945 fixes report output to the current run (--out supported), with2CLI tests. be6eaa7
integrates parse_engine.cjs into render_parallel.sh and its required provenance inputs.
It parses77files through one esbuild service;4testsPASS and36.721s full-source measurement
under competing render load. Use this integrated wrapper for the second full render.
The connected Gmail profile is currently talon.sturgill@gmail.com, not the account stated in
CLAUDE.md; use the user's explicitly requested connected Gmail, to docket@alaskaaihq.com,
omit From, and keep unsent. Final email must disclose missing agreed panel anchors.

Run improvements: macOS fallback for run_bg.sh (setsid is absent), and content-bound render
freshness that preserves stale-render protection without treating a git checkout as a source edit.
Implemented before rendering. Four tests and shell syntax checks pass. Render and encode wrappers
now mint source-content receipts; preflight and ship verify inputs and output hashes. Timestamp-only
touches pass, content edits/additions/deletions fail. Follow-up review hardened cache and mix
provenance: complete-manifest cache keys, quarantined chunks until validation, actual props/WAV
binding and full VO/music/foley mix receipts. 23 regression tests passed before adding the
storyboard to mix inputs (new schedule reads approved board); rerun pending. No delivery bytes yet.

The standalone detached voice launch did not survive the desktop terminal lifecycle and had
no live PID or done marker. No duplicate synth remained. The managed terminal session is the
working path for this run; do not treat a launch message as liveness evidence.

Recovery: first voice-analysis process was terminated after >20m with negligible progress;
all three completed takes preserved. Existing VO_REUSE_TAKES path avoids re-spending Gemini.
Current managed session8448 runs HF_HUB_OFFLINE=1 VO_REUSE_TAKES=1 under caffeinate. Cached
base model loads; take0 ASR/pitch completed and take1 decoding progresses. Soundcheck now
reports safe stage progress to stderr while keeping JSON stdout intact. No thresholds changed.
run_bg now waits for a detached-child READY handshake. Cross-terminal desktop probe confirmed
its log and exit0 marker after the caller returned; the startup race is now reproduced/fixed.
Caption independent PASS8.86, exact1714chars; Gate0 reviews all ship:true. Rough Ep0903 compiles.

September 2 is shipped in PR #113 at d654382. Its locked outputs are preserved in
out/dispatch-2026-09-02-shipped and must not be modified. The historical pending-merge line below
is superseded by that verified merge.

## Previous run record

# Dispatch 2026-09-02 worklog

Owner directive: run the complete Alaska.AI Dispatch automation on its daily schedule.

## Scope

- Execute `prompts/dispatch_routine.md` exactly from current `main`.
- Retrieve Gemini voice credentials from macOS Keychain without displaying or committing them.
- Deliver the finished Dispatch, site feed entry, Gmail draft, and merged run branch.
- Keep the Gmail draft unsent and visually verify its rendered layout.

## Status

| Task | State |
|---|---|
| Fetch main and read authoritative routine | DONE |
| Bootstrap environment, guarded branch, and credential access | DONE |
| Story research and adversarial validation | DONE |
| Angle room and directors room | DONE |
| Gate 0 | DONE |
| Voice, rough cut, full build, and taste loop | DONE |
| Objective gates | DONE |
| Independent panel | DONE — 8.328 / 8.086 / 7.912; zero blockers |
| Ship gate | DONE — exact-byte PASS after one blocked editing round |
| Permanent media upload and site feed publication | DONE |
| Gmail draft creation and visual inspection | DONE — corrected responsive wrapping; unsent |
| Ready PR, required checks, and merge | IN PROGRESS |

## Locked deliverable

- Title: `The Diploma Still Has to Be Earned`
- Composition: `Dispatch0902`
- Runtime: 134.833 seconds including credits
- Cuts: 1080x1920 master, 1080x1080 LinkedIn square, 720x1280 mobile rendition
- Audio: -14.95 LUFS integrated, -2.34 dBTP true peak
- Panel median: 8.086; all judges ship; zero hard blockers
- Caption score: 8.986; zero hard failures
- Ship gate: 3 deliverables and 64 evidence pieces hash-matched; 30/30 beats covered; PASS
- Phase 8 renderer repair: `ef60b51` adds macOS-safe locking, source fingerprinting, timeouts,
  and dynamic child waiting; verified on the complete 4,045-frame render
- Phase 8 exact-artifact repair: `b5c09c6` couples `shots.json` to current scene generation,
  measures the performed silence dip, adds the missing opening action, and records honest static
  camera reasons; current Gate A passes 10.0/10

Do not rerender or modify delivery bytes after this lock. Permanent upload and feed publication
are verified. Gmail draft `r6991931523445856974` was inspected in Gmail at full size after its
responsive wrapping repair; both download buttons, caption, sources, credits, and run notes render
cleanly, and the draft remains unsent. Ready PR, required checks, and merge remain.
