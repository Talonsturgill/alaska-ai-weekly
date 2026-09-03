# Dispatch 2026-09-03 active worklog

Execute the complete daily pipeline from prompts/dispatch_routine.md. Draft only, never send.
Main fetched and prompt read in full. Branch claude/dispatch-2026-09-03 and run stamp created.
Environment setup passed. Keychain credential presence verified without output. Research window 10 days.
Three researchers, independent validation, FRESH dedupe and story gate passed. Angle room and
cross-challenge complete. Locked story is TCC's September 2 Sully.ai announcement, title
The Care Has to Stay. No claim of proven outcomes or completed rollout. Directors room complete.
Gate 0A/B/C/D/E pass after specific storyboard, fairness and flow revisions. Narration 277 words.
Three Gemini takes generated (118.2s, 114.3s, 116.2s); soundcheck/alignment running in managed
terminal session 2512. Episode Dispatch0903 whole crude blocking authored; not yet rendered.
Next: finish voice and whole rough cut,
taste loop, objective gates, independent panel, exact-byte ship lock, permanent delivery and merge.

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
