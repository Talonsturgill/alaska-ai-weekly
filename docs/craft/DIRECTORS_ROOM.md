# THE DIRECTORS ROOM (2026-07-15) — how the automation outputs a showstopper every run

The owner's mandate: the automation is the whole studio. Research + storytelling were already
strong; this doc adds the PRODUCERS and EDITORS — the intelligence that turns a fact-checked
story into an entertaining SHOW, every run, without a human in the loop until the Gmail draft.

## The room (Phase 4, after the story is picked and fact-checked)

Convene a WRITERS-ROOM PANEL of no-spawn agents before any storyboard is written. Each pitches
a full episode treatment from a different lens:
  - THE COMEDIAN: where are the jokes, the sight gags, the ironic cutaways, the personified
    objects? (A sweating server. A drooling machine. A moose watching, unimpressed.)
  - THE DRAMATIST: where is the CONFLICT? Who wants what? What is the stake, the turn, the
    button? Every episode needs an antagonist force and a moment the tension peaks.
  - THE EXPLAINER: where do the numbers land hardest? What comparison makes scale FELT
    (X per second, stacked against a thing people know)?
A judge pass (scorer) picks the winning treatment and grafts the best beats from the others.
The output is the VISUAL SENTENCE storyboard: for every VO line, beats[].draw = {subject,
action, emotion, annotation} — a cartoon you could describe to an animator in one sentence.

## The cast (video-engine/src/lib/)

- Character.tsx — the parameterized person rig: poses (stand, arms-crossed, point, panic),
  emotions (neutral, angry, worried, shock, smug), outfits (parka, suit, worker), facing,
  built-in breath/blink idle. CAST CONTINUITY: reuse the same characters across scenes so the
  audience follows people, not diagrams. New poses/emotions/outfits get ADDED TO THE RIG,
  never one-offed.
- FX.tsx — the juice: SpeedLines, ImpactStar, PaperStorm, ZoomVignette. Every scene event
  gets juice; nothing pops in without anticipation/overshoot or an FX accent.
- Scene exemplars: IGSHook.tsx (character + map + annotation hook), Standoff.tsx (two-character
  conflict diorama + dramatic snap-zoom). New scenes are held to these, and each run's best
  new scene becomes the next exemplar.

## The camera (cinematic grammar in 2.5D)

- SLOW PUSH on every held scene (1.0 -> ~1.07); static frames are banned.
- THE DRAMATIC SNAP-ZOOM onto a face at the emotional peak (spring scale ~2.5x, speed lines,
  impact star, vignette slam) — the genre's signature; use once or twice per episode, at the
  moments that matter.
- Scene-to-scene: whip-pans, iris/paper wipes, match cuts on shapes. A cut must MOVE the story
  to a new place; a transition is never decoration.
- Parallax on every diorama (far range drifts against the push).

## The editors (Phase 5/6, unchanged bar, sharper question)

The taste loop's five questions, now with the showstopper test up front:
  0. Would a stranger STOP SCROLLING on this frame? (If unsure, the answer is no — redo.)
  1. Character/face present? 2. Nameable action verb? 3. Everything outlined + shaded?
  4. Spoken number drawn on screen? 5. Holds up next to a real Infographics Show frame?
Render probes of every scene, look, iterate 3-5x. Renders are ~60s; there is no excuse not to.

## The law of compounding

Every rig pose, FX, prop, and scene pattern built for an episode is LIBRARY, forever. The
per-episode intelligence goes into: the writers-room treatment, 1-2 bespoke hero illustrations,
and the edit. That is how output quality climbs every single run instead of resetting.
