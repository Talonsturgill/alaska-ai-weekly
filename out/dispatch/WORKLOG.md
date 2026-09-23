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
| 2 | Phase 1 research fan-out (4 researchers, 20 searches each) | IN FLIGHT |
| 3 | Phase 2 adversarial fact-check | |
| 4 | Phase 3 story lock + story_gate check | |
| 5 | Phase 3.5 angle room | |
| 6 | Phase 4 directors room + art direction | |
| 7 | Gate 0A-0E | |
| 8 | VO synth + soundcheck | |
| 9 | ROUGH CUT (whole film, crude) — mandatory before any polish | |
| 10 | taste loop, breadth-first, worst scene first | |
| 11 | preflight.py exit 0 | |
| 12 | 3-judge panel to median >= 7.0 | |
| 13 | ship_gate record + check | |
| 14 | encode, upload, publish_feed | |
| 15 | Gmail draft, readback DRAFT | |
| 16 | dedupe add, RUN_UPGRADES, PR ready, MERGE to main | |
| 17 | PushNotification to the owner | |

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
