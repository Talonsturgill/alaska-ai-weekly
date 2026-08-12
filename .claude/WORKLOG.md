# WORKLOG — Dispatch 2026-08-12, "The Smallest Door"

Run branch: `tsturg/sweet-cray-bstv4c`. PR #107, open, **NOT merged and must not be merged
until a panel median clears 7.5.** Nothing has been emailed since the owner's instruction below.

## Owner directives, verbatim and binding

> "why was media branch push rejected? ... You again accepted failure, I do not go into github
> to find videos. You are explicitly instructed to drop the download links in my email, and wtf
> do you mean no judge panel dude that's not the deliverable we agreed to, get the fucking job
> done and et it done right, and drop the god damn dowload links in my email, and fix whatever
> allowed u to take the easy way out and fail again"

> "dude why are you delivering video to links, if the video has not yet reached ship quality, if
> the video was not ship ready then why the fuck did you even email me in the first place, has it
> still not scored high enough the entire time?"

**The resolution of those two together, and it governs this run: the links were never the
deliverable, the finished film is.** A cut that has not cleared 7.5 has nothing to deliver, so
there is no email, no download link and no notification until it does. The answer to the owner's
question is no: it has never scored high enough. Do not soften that in any report.

> "don't ever ask me to for permission to edit worklog, u have permanent permission, and this is
> an autonomous routine"

## Score history (all against a 7.5 bar read from config/dispatch_rubric.yaml)

| Round | Judges | Median | On which bytes |
|---|---|---|---|
| 1 | 5.68 / 5.04 / 6.02 | **5.68** | 153.5s cut, no captions, frozen strips |
| 2 | 5.44 / 5.84 / 6.20 | **5.84** | same 153.5s cut, evidence rebuilt frame-accurately |
| 3 | 6.92 / 6.21 / 5.83 | **6.21** | 119.57s recut, captions rendering |
| 4 | not yet run | — | current bytes, all round-3 fixes landed |

**The current bytes are UNGRADED and ship_gate correctly BLOCKS on that.** Round 3 graded the
pre-fix render. Recording 6.21 against the current cut would be precisely the stale-verdict
failure ship_gate was written to make impossible. Do not record a verdict the panel did not give.

## State of the artifacts (verified, not asserted)

- `out/dispatch/dispatch_master.mp4` 1080x1920, 119.57s, 3587 frames, in the 112-130s band
- square + 720p encoded, aspect and audio asserts passing, -13.77 LUFS / -1.21 dBTP
- `preflight.py`: **zero blockers**, 4 advisories
- captions verified ON SCREEN in the delivered bytes (8 cues, 203-206 contrast vs a 120 floor)
- mix silence measured directly: **0** windows >=0.5s below -45dB. Still frames: **0** of 3587
- `out/evidence/` 53 files, rebuilt from these bytes, audio_report now fresh (111.58s)

## NEXT ACTION, in order

1. `python3 scripts/build_evidence.py` if anything re-rendered since the last build
2. Convene panel round 4: 3 `scorer` agents, brief at `/tmp/brief.md` (regenerate if the
   container was recycled; it names the pack paths and carries the corrections below)
3. `ship_gate.py record --median M --judges a,b,c` then `ship_gate.py check`
4. **Only on a passing median:** upload cuts, build the email through
   `scripts/dispatch_email.py` (it now refuses dead links), create the Gmail draft, merge #107,
   `publish_feed.py`, then notify. On a failing median, fix and loop. No partial delivery.

## Corrections the next brief MUST carry

- The "39.59s of silence" figure given to panels 1 and 2 was wrong. It comes from
  `audio_report.gaps_from_words`, field `vo_silence_in_gaps_s`: pauses between SPOKEN WORDS, not
  silence in the mix. The bed is 180s and continuous. That bad number cost Sound across a whole
  panel, one judge calling it a hard blocker. Measure the master directly and say so.
- Panel 3 graded a stale `audio_report.json` describing the 153.5s cut. `build_evidence.py` now
  regenerates it, so this should not recur, but check `last_word_ends_s` against the runtime.

## Outstanding, named by round 3 and NOT yet fixed

Motion is the binding constraint (4.5 / 4.5 / 6.5) and is where the remaining points are.

- `filmstrip_assemble` enters three plates by pure opacity crossfade, zero displacement
- `filmstrip_pour` changes only by a glow ellipse growing under a static slab
- `filmstrip_swell` is effectively frozen for 8 frames; its 3.6% is a 6px sliver
- no motion blur on any mover anywhere, including the fastest (~80px/frame slab drop)
- no anticipation, no secondary/follow-through, no idle life on held elements
- thesis card lands ~6s late: "The institute isn't the mistake" is spoken at 97.76s and its
  plate does not own the frame until ~104.5s. Re-time, do not re-write
- 5 caption cues break on dangling function words ("...tribes, and", "...comment, got")
- headline face at f004.3 is a generic grotesque, neither Fraunces nor JetBrains
- "TRIPLED" is unlabelled arithmetic on two published floors, against the derived-figure rule

## Machine fixes shipped this run (all committed, all verified)

Seven gates were blind or crashing on this episode, and four of them reported CLEANLY:

1. **Captions never rendered.** `captions.json` speaks `{start,end}`, the engine reads `{t,d}`;
   the cue lookup compared against `undefined` on every frame and drew nothing for 4602 frames.
   Fixed at the boundary in `build_scenes.py`. New `caption_render_check.py` reads the DELIVERED
   bytes, checks cue shape then samples band text contrast, wired into preflight as blocking.
2. **`zoom_clip_check`, `plate_overlap_check`, `text_fit_check`, `shot_map`, `staging_check`** all
   matched scenes on an exact `React.FC<SceneProps>`; this episode types them
   `React.FC<SceneProps & {dur: number}>`. Zero matches. `staging_check` printing "0 figure(s),
   every one performing what the board staged" is the most dangerous line in the run.
3. **`text_fit_check` could never measure this episode at all** — it wants a literal `<text>` body
   and an integer fontSize, and every string here goes through a `Plate` component with a
   computed size. Added `check_plate_call_sites`, which mirrors Plate's own fit arithmetic and
   fails any string auto-shrunk below a 22px legibility floor.
4. **`claims_contract_check` crashed** on every run: its prose branch handled only the list
   spelling of `requires`, and this run's claims write it as a sentence.
5. **`vo_claims_check` had no input** — `vo_script.json` never existed. Authored; it immediately
   caught two lines stating a quantity with no claim cited.
6. **`caption_spelling_check`'s advice could not work.** Fixups ran only inbound, and
   `_rebalance_cues` rebuilds cue text and discarded them, so "A I three" shipped on screen while
   the fixup map declared AI3 and the remedy ("re-run build_scenes") reproduced it exactly.
7. **The mux was eating the credits.** `-shortest` cut 5.4s because audio ends before picture,
   taking the card that carries the CC BY 4.0 music attribution — a licence condition, and a
   judge had already scored the missing credit. Now `apad` + `-shortest`.

Delivery-side, from the owner's directive:

- `preflight.git_identity_is_the_owners()` — the media host is a git push, and `upload_video`
  refuses to author a media commit as Anthropic, so an unset `user.email` was the real cause of
  the "rejected push". It never reached the push at all.
- `dispatch_email.refuse_unless_links_are_live()` — no working link, no draft, no bypass flag.
  The old failure was a run emailing a caveat in place of the deliverable.

## Claims settled after panel round 2

- **c22 added, verified**: "Alaska Native communities will remain eligible across EAGLE project
  areas", verbatim from the Federal Register. The film's even-handedness card was carried on
  nothing before this.
- **c23 KILLED**: the AI3 Institute's deliverable. The notice was re-fetched and asked directly
  for any statement of output, roadmap, assessment or scope: ABSENT. The pivot the whole back
  half turned on was the run's own characterization. Cut from VO, post and screen.
- **c24 KILLED**: "eight still hold a list nobody published" is contradicted by c16's own note
  recording that the statement-of-need page lists the submitted proposals. They went unfunded,
  which was always the real point.
- c22's `requires` clause forbids any LEAD/WIN inference. It was cut from the VO in round 2 and
  survived in `post.txt` into round 3, where two judges filed it as a hard blocker. Now cut.
