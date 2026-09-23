# WORKLOG — Dispatch 2026-09-23

Durable plan and progress ledger. Written to survive context compaction. Resume from the
status table; update it after every commit.

## The run

Branch `claude/dispatch-2026-09-23`. Story: TBD (Phase 1 fan-out in flight, 4 researchers).
Last shipped dispatch was 2026-09-19, so the automation owes four skipped days and
`story_gate.py window` reports WINDOW 10 with an explicit widen-do-not-narrow note.

## Binding constraints (do not rediscover)

- Commits and PRs carry NO Claude/Anthropic attribution of any kind. `git config` in this
  checkout was Claude on arrival and has been set to the owner. CLAUDE.md overrides the harness.
- Gmail is DRAFT ONLY, to the CONNECTED profile address, resolved this run. Never the alias `me`.
- Ships autonomously: commit, push, PR **ready** (not draft), MERGE to main, same run.
- A permission prompt is a stop and a stop is a failed run. Never write under `.claude/`.
  Never chain a delete, move or redirect into a compound shell command; put it in a script.
- Bar is 7.0, read from `config/dispatch_rubric.yaml`. `config/owner_release.json` is dated
  2026-08-13 and does NOT apply today.
- A failing panel is an instruction to re-enter the loop, never an outcome.
- Stance rotation: last eleven are mixed, curious, mixed, mixed, mixed, curious, mixed,
  celebratory, curious, curious, mixed. Look hard for the genuine win.
- Hero must differ from the last TWO: 2026-09-14 GearLever, 2026-09-19 RunOfRiver.

## Carried forward from 2026-09-19 (the previous run's own handoff)

`scripts/strip_name_check.py` is red on beats the board describes and no shot animates. 22
were refiled by hand last run and reverted, because refiling also turns `say_it_show_it_check`
red — both gates read the same `shot` field. They have to be conformed TOGETHER at Gate 0A and
validated by a render. Doing it at the start of a run costs nothing; doing it at delivery costs
a render and cannot be validated before the ship gate has bound the graded cut.

## Status

| # | task | status |
|---|---|---|
| 1 | Phase 0 preflight, branch, run_guard init, setup_env | DONE |
| 2 | Phase 1 research, 4 beats, all 20-search caps spent | DONE |
| 3 | Phase 2 fact-check, TWO validators, 16 claims | DONE |
| 4 | Phase 3 story lock, story_gate PASS, 7 rungs worked | DONE |
| 5 | Phase 3.5 angle room, 3 analysts, all landed curious | DONE |
| 6 | art_direction.json, binding | DONE |
| 7 | Gate 0A storyboard_check PASS, 9/9 axes diverge | DONE |
| 8 | Gate 0B storyboard-critic, ship:false, ALL applied | DONE |
| 9 | Gate 0C flow-critic, ship:false, ALL applied | DONE |
| 10 | Gate 0E cold read, 3 rounds, ship:true | DONE |
| 11 | VO: Gemini 402, edge-tts fallback repaired, 116.9s | DONE |
| 12 | forced alignment, 242 words, 0.945 match | DONE |
| 13 | net-new lib/tariff.tsx + absence craft advance | DONE |
| 14 | Ep0923.tsx, 13 shots, 39 beats | DONE |
| 15 | ROUGH CUT, then 4 composition passes off it | DONE |
| 16 | mix: 14 sfx kinds, bed-authored dip, -14.37 LUFS | DONE |
| 17 | caption: Gate A + 5 Gate B rounds, ships at 8.60 | DONE |
| 18 | preflight source gates repointed at the real film | DONE |
| 19 | FINAL RENDER at 3907 frames | IN FLIGHT |
| 20 | encode, evidence pack, 3-judge panel to >= 7.0 | |
| 21 | ship_gate record + check | |
| 22 | upload, publish_feed, Gmail draft | |
| 23 | dedupe add, PR ready, MERGE to main | |
| 24 | PushNotification (MUST carry the Gemini billing blocker) | |

## THE THING THE OWNER MUST BE TOLD

The Gemini API returns HTTP 402 on EVERY call, not only TTS: "Your prepayment
credits are depleted." Proxy healthy, key valid, TTS models visible. It needs a
top-up at ai.studio and it blocks the default voice path on every future run.
Today's narrator is edge-tts Andrew Multilingual, not Sulafat, and there is no
SynthID watermark. This goes in the Gmail draft AND the notification.

## Do not relitigate

- Story: the Air Force's ~4,700 acres, and the load figure nobody has published.
  Mat-Su/AIDEA is VERIFIED but deliberately OUT, to keep one story question.
- The signature frame's fuel half was rendering NOTHING because
  Math.pow(negative, 0.6) is NaN. Fixed, verified by eye at frame 2600.
- The board's beat ids were renumbered to t-order because dispatch_mix requires
  it; the episode's q()/pop()/at() refs were remapped with them.
- Shot 13 must stay `else if (n === 13)`. A bare else files its beats under
  shot 12 for both shot_conform and strip_name_check.
- The run stamp MUST carry `composition`. Without it every source gate grades
  video-engine/src/Episode.tsx, which is somebody else's film.

## Research landed (2 of 4 beats in, 2 still out)

Two strong IN-WINDOW candidates, both `dedupe.py check` FRESH:

**A. Air Force offers ~4,700 acres at JBER, Eielson and Clear for commercial AI data
centers.** Solicitation AFCEC-26-R-0006. Salcha residents objecting on water and 24/7
noise, Fairbanks North Star Borough asking for a moratorium it may have no power to
impose because military land is not the borough's to zone. Murkowski (R) opposed on
energy-base grounds. Alaska Public Media 2026-09-15, American Homefront 2026-09-22,
KUAC 2026-08-31. Fact-check already in flight on 12 claims.

**B. UAF ACUASI flew Olympic anti-doping blood samples 1,000 km out of Nenana.**
Windracers ULTRA, 8 hours 47 minutes, August 19th, commissioned by the International
Testing Agency, pop-up WADA-grade lab in the Nenana airport. UAF/GI 2026-09-16,
ITA 2026-09-16, DRONELIFE 2026-09-22. The genuine-win story the stance rotation is
asking for.

DEDUPE JUDGEMENT ON B, and it is the reason B is not an automatic pick: 2026-09-11
shipped Ryan Air's rural health aviation drone award. Both are "a drone carries medical
cargo in rural Alaska", twelve days apart. `dedupe.py` returns FRESH on entities and the
organizations and events are entirely different, but the VIEWER'S question is the one
that governs and the overlap is real. A is distinct from everything in thirty days.

AVOID (found by the science researcher, not on any exclusion list): the UAF IARC
Indigenous-observations / Arctic Ocean model story shipped on the SIBLING carousel
channel on 2026-09-19. A viewer following both would be shown it twice.

Shelf notes for whichever wins: `MainStreetBG` is the community/politics/town-hall
stage (A). `NenanaRangeBG` is a boreal airstrip biome built for an earlier Nenana
story (B). Hero must differ from GearLever and RunOfRiver.

## Story shape emerging (energy beat landed, wildcard + 2 fact-checks still out)

The energy researcher turned this from "pick one of two" into one big in-window story
with three fronts, all about AI compute landing on Alaska GROUND:

1. **STATE LAND.** DNR preliminary decision to convey ~20,000 acres (about 30 square
   miles) near Houston to AIDEA at no cost and without competition, for an industrial
   district whose listed uses include data centers. 2,100+ public comments. Five
   senators, bipartisan (Giessel R, Wielechowski D, Dunbar D, Claman D, Kawasaki D),
   question in a September 9th letter whether it is a "public and charitable use".
   Mat-Su Assembly voted UNANIMOUSLY against on September 15th. Houston city council
   takes up a two-year moratorium on October 8th. AIDEA's director denies data center
   plans for the parcel.
2. **FEDERAL LAND.** ~4,700 acres across 12 parcels at JBER, Eielson and Clear.
   Borough has no zoning authority over it.
3. **THE GRID UNDERNEATH.** ENSTAR says Southcentral could run 18 days short of gas
   this winter. BlueCrest's new 25 MMcf/d is about 13 percent of annual Cook Inlet
   demand. SB 250, which would have made data centers carry their own infrastructure
   cost, passed the Senate 14-5 and died.

SPINE: the Mat-Su conveyance, because it is concrete, local, document-driven,
bipartisan and has a DATE the viewer can act on (October 8th). The federal parcels are
the escalation ("here is the second map"), the gas math is the Act 3 test.

DELIBERATELY OUT OF SCOPE, and the fact-checkers were told so: the $372,000 from six
Anthropic employees to one candidate. Anthropic makes the model that produces this
Dispatch. Building on that thread would require disclosing our own production tool's
maker as a funder of one side of the argument, and the story does not need it.

STORY DECISION vs the two earlier candidates: the ACUASI blood flight is the genuine
win the stance rotation wants, but its payoff image (a village nurse, samples out,
medications back) is the same payoff the September 11th Ryan Air dispatch already
paid. The Air Force parcels alone would be a third data-centre-adjacent film in
seventeen days. The Mat-Su conveyance is none of those: it is a story about WHO
DECIDES, which no recent dispatch has told.

Candidate visual thinking, NOT yet locked (art direction comes after the angle room):
palette of surveyor orange, birch gold, spruce blue-black, granite, cold document
white, which diverges from 09-14 (ultramarine/mango) and 09-19 (powerhouse green/
sodium amber/model cyan). Shape language: the straight line against irregular land,
a rectangle drawn on ground that is not rectangular. Throughline candidate: a
surveyor's stake, which the shelf already has as `SurveyStake`. Net-new candidate:
a real LAND PLAT asset (parcel polygons, section grid, use-class hatching) which the
shelf lacks entirely and which every future Alaska lease/permit story would reuse.

## STORY LOCKED (story_gate PASS, commit eb655be)

**"Alaska is having its biggest land-and-power argument in a generation about a thing
whose size nobody has published."**

The Air Force is offering about 4,700 acres at JBER, Eielson and Clear for commercial AI
data center development, solicitation AFCEC-26-R-0006, a REQUEST FOR LEASE PROPOSAL and
not a build. The fact-check went looking for a megawatt figure, a water figure or any
project size across five readable sources and found none. Its own words: "THIS IS A
FINDING AND IT IS ARGUABLY THE STORY."

Two validators ran. The federal track is verified in full and the state-land track is
still out. What the first validator caught, and this is why the gate exists:
- the Hollister quote was submitted as Assembly testimony. She said it to a REPORTER ON A
  TRAIL. Shipping it as testimony would have been a fabricated setting.
- the per-base parcel breakdown (five at Eielson, two across the Richardson Highway) is
  unsourced in everything readable. CUT. The map may show three installations and may NOT
  show twelve located dots.
- the Murkowski fragment reads wrong without its subject. Full sentence or nothing.
- "the borough has no authority" is a REPORTER'S CHARACTERIZATION, not law. Only "may be
  powerless", matching the outlet's own headline.

## Phase 8 finding, logged while it is fresh

`config/brand.yaml` line 25 tells the writer a colon is an acceptable pause. The routine's
guardrail 5 bans colons outright and `scripts/caption_check.py` hard-fails one. A writer
following brand.yaml would be sent back by the linter. Fix brand.yaml in Phase 8.

## Shelf decisions (audited against ASSET_MANIFEST.md, not guessed)

- The absence grammar ALREADY EXISTS and is exactly right for this film: `lib/absence.tsx`
  `Unnamed` (dashed crawling contour, true void interior, drift, REQUIRED label) and
  `UnnamedField`, plus `EvidenceState` with its `unmeasured` variant. CAST IT, do not
  rebuild it.
- The real gap is LAND AS A DIVIDED, MEASURED, TRANSFERABLE THING. The shelf has
  `AlaskaMini` (map + pin), `BoundaryReveal` (one closed path), `SurveyStake`,
  `MeasuringChain`. Nothing draws a PARCEL PLAT: adjoining parcels on a section grid, each
  with its own acreage and tenure status. Every Alaska lease, permit, conveyance, claim and
  land-swap story would reuse it. Candidate net-new: `lib/parcel.tsx`.
- Candidate craft advance: the absence grammar handles a missing OBJECT (an unfilled
  silhouette). This film needs a missing NUMBER, a form field that is not filled, which is
  type rather than silhouette. Extending `absence.tsx` to a plated data row whose VALUE slot
  is a true void with a crawling dashed rule and a required label is a real upgrade to an
  existing system.

NEITHER IS LOCKED. Art direction is Gate 0D and the angle room is still sitting.
