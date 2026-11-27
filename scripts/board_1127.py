#!/usr/bin/env python3
"""2026-11-27 "Trained on 2019": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1127.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1127.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board_anchor import AnchorBook  # noqa: E402
import board_1102 as base  # noqa: E402  (shared helpers only: line_starts, load_words, _phrase)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"
LINES = base.LINES

W = lambda w, n=1: (w, n)
G = "the glass instrument labelled THE MODEL, a teardrop flask with a wax-sealed neck held in a brass bracket, eyes in a dark lens, crystals growing from its bottom"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "crack", G, "takes a lemon bolt from the anvil square on its wax-sealed neck with a squash, and its crystals flare lemon from the bottom up, against the dark taiga plane", "startled", "BY 2100 · HIGH EMISSIONS", "the raven on the far stake ducks", ""),
 (40, 0, W("Alaska"), "rumble", "the anvil cloud over the ridge", "flickers inside and rolls a low rumble across the sedge as a single paper TODAY token drops onto the ridge beside the glass", "uneasy", "ALASKA · TODAY", "the token rocks and settles", ""),
 (2, 0, W("double,"), "shimmer", "a ghost column of hatched lemon outlines", "rises above the TODAY token from a floor at about two to a ceiling at about seven times its height, hatched the same top to bottom, with a question mark on it", "curious", "MORE THAN 2X TO NEARLY 7X · PROJECTION · PER AGU", "the glass leans back to look up at it", ""),
 (3, 0, W("seven"), "flutter", "the question mark on the ghost column", "spins once and the whole column sways in the wind", "surprised", "UPPER ESTIMATE · NEARLY 7X · PER AGU", "the glass's eyes widen", ""),
 (4, 1, 0.0, "page", "a journal sheet blown along the ridge by a gust", "slaps against a brass easel beside the glass and a spring clip snaps shut on it", "curious", "EARTH'S FUTURE · NOVEMBER 24TH", "the glass flinches as it passes", ""),
 (5, 2, 0.0, "clink", "a boxed name card on a short stake", "drives into the tussock beside the easel like a thrown dart and the turf splits around it", "steady", "ANDREAS KRAUSE · TECHNICAL UNIVERSITY OF MUNICH", "the raven hops back a step", ""),
 (6, 2, W("machine"), "swing", G, "turns to show a brass label tag swinging from its collar", "curious", "A MACHINE LEARNING MODEL · XGBOOST", "the tag swings", ""),
 (7, 3, 0.0, "whirr", "six little weather instruments on posts around the glass's foot (a thermometer, a rain cup, a hair hygrometer, a barometer, a windsock, a sun disc)", "each tick as the six brass taps open in a quick cascade and clear trickles climb the pipes into the glass", "curious", "TEMPERATURE · RAIN · HUMIDITY · PRESSURE · WIND · SUN", "the crystals inside grow a branch per tap", ""),
 (10, 3, W("where"), "slide", "a sealed parchment envelope addressed ML LIGHTNING MODELS", "skids in along the ridge and stops a pace away from the glass's foot, wax dot up", "uneasy", "ML LIGHTNING MODELS · IN GENERAL", "the raven eyes it", ""),
 (8, 3, W("strikes"), "tap", "a gridded square tile on the field plank under the glass", "gets lemon strike marks tapped into its half-degree cells by a crystal tip reaching down through the foot", "focused", "CLOUD-TO-GROUND LIGHTNING · HALF-DEGREE GRID", "dust puffs from each mark", ""),
 (46, 4, 0.0, "whirr", "a brass hand stamp", "lowers out of the anvil's shadow and hovers over the wax seal while the taps close and the crystals settle", "steady", "ONE YEAR OF OBSERVATIONS", "the stamp's shadow crosses the seal", ""),
 (9, 4, W("nineteen."), "stamp", "the brass hand stamp", "presses down into the oxblood wax on the neck and lifts away leaving 2019", "steady", "TRAINED ON 2019 · PER AGU", "the glass blinks", ""),
 (11, 5, 0.0, "scrape", "the true outline of Alaska drawn across the tundra like a giant chalked map seen low and oblique", "cuts into the sedge as the view cranes down over it, the storm glass standing at the map's edge", "curious", "ALASKA · TODAY'S CLIMATE", "turf curls up along the line", ""),
 (12, 5, W("strike"), "tick", "the paper TODAY token", "drops onto the middle of the chalked outline and stands alone", "calm", "MOST OF ALASKA · UNDER 1 STRIKE PER SQ KM A YEAR · 1995 TO 2014 · PER AGU", "the token bobs", ""),
 (13, 6, 0.0, "ratchet", "a hatched lemon range column on the chalked map", "clicks in as a hatched lemon band floating on a thin mast above the TODAY token, its floor at about two units", "surprised", "PROJECTION · HIGH EMISSIONS · PER AGU", "the storm glass behind it leans back and its wax seal catches the lemon light", "rehook: a hatched lemon range column racks up out of the chalked map beside the lone TODAY token"),
 (14, 6, W("hundred"), "clack", "the hatched range column", "clacks up section by section to its ceiling at about seven units, the band hatched the same weight top to bottom, as the view tilts up to follow it while the envelope sits small in the back plane", "surprised", "ALASKA · +116% TO +594% · PROJECTION · HIGH EMISSIONS · PER AGU", "the column sways and the seal glows", ""),
 (15, 7, 0.0, "slide", "a second, slimmer hatched range column labelled WORLD", "slides in beside Alaska's, its top standing just above Alaska's floor", "curious", "WORLD · +76% TO +140% · HIGH EMISSIONS", "the WORLD column's top wobbles", ""),
 (41, 7, W("more."), "clink", "the two range columns", "touch shoulders where the WORLD top overlaps Alaska's floor and both rock", "curious", "BOTH · PROJECTION · HIGH EMISSIONS", "the columns settle", ""),
 (16, 8, 0.0, "knock", "a row of wooden ledger posts in taiga country under the anvil, 10 of 10 for 2015 to 2024", "knock up out of the peat post by post, each bar filling past the 93 percent mark, the storm glass small on the far ridge above the trees", "worried", "LIGHTNING FIRES · 93% TO 100% OF ACRES BURNED · 2015 TO 2024 · AK DIV. OF FORESTRY", "the conifer tops shiver", ""),
 (17, 8, W("percent"), "rumble", "a true-scale swatch of 2022's burned area", "unrolls beside a small true outline of Alaska on a survey sheet pinned to the last post, unplaced", "worried", "2022 · ABOUT 3.1 MILLION ACRES · 99% LIGHTNING", "smoke curls off the swatch", ""),
 (18, 9, 0.0, "stamp", G, "turns from the ledger posts to face the anvil as a parchment stamp lands on the easel beside it", "steady", "THE STUDY DIDN'T MODEL FIRE", "the easel jumps", ""),
 (19, 9, W("spark"), "sizzle", "a lemon bolt from the anvil", "touches one far conifer tip and stops there as a single spark, far from the glass, while the raven ducks", "uneasy", "THE STUDY · LIGHTNING ONLY", "the raven ruffles", ""),
 (20, 10, 0.0, "type", "a parchment slip clipped to Krause's name card staked low in the tussock, seen from above", "types itself out letter by letter as the stake trembles", "surprised", "\"I WAS QUITE SURPRISED THAT THE PROJECTIONS WERE SO HIGH.\" · ANDREAS KRAUSE · PER AGU", "the glass in the mid-ground looks up", ""),
 (21, 10, W("surprised"), "click", "Krause's name card on its stake", "drops a second line, LEAD AUTHOR, under the name with a click", "steady", "ANDREAS KRAUSE · LEAD AUTHOR", "the glass in the mid-ground goes still and a parchment question-mark tag swings out on a thread from the collar under its crisp 2019 seal", ""),
 (22, 11, 0.0, "roll", "a brass sensitivity dial on a weathered field plank on the ridge, its scale in percent per degree", "whips its needle backward as a sepia 1900s strip snaps out and unrolls under it", "focused", "1900S · MODEL ESTIMATE · ABOUT +11%", "the strip snaps flat", "rehook: the brass dial whips its needle backward as a sepia 1900s strip snaps out under it"),
 (23, 11, W("twelve"), "click", "the dial's needle", "settles at 12 with a small overshoot", "calm", "ABOUT 12% PER °C", "the needle quivers", ""),
 (24, 12, 0.0, "slide", "a shaded band on the dial face", "slides in around the needle from 8 to 17", "calm", "EARLIER STUDIES · 8% TO 17% PER °C", "the band's edge glints", ""),
 (25, 12, W("forward,"), "whoosh", "the dial's needle", "winds back for an anticipation and swings hard right, past the shaded band", "surprised", "RUN FORWARD · NEARLY 3X ITS OWN 12 · ABOUT 30% PER °C · COULD", "the dial housing jumps on the plank", ""),
 (26, 12, W("thirty"), "hiss", "the oxblood wax seal on the storm glass beside the dial", "glows hot, its 2019 crisp and intact, the question-mark tag still swinging, as the crystals inside crowd up", "worried", "FUTURE RUNS · PER AGU", "the glass holds very still", ""),
 (39, 13, 0.0, "clank", "the dial's brass housing, seen from straight above", "swings open on a hinge to show two gear trains turning side by side, both fed by the same weather strip", "steady", "EARLIER STUDIES' MATH · THIS STUDY'S MATH", "the gears catch the light", ""),
 (27, 13, W("math."), "ratchet", "the two gear trains", "turn at different speeds, one ticking a counter to 8 TO 17, the other to 30, as the question-mark tag on the glass at the plank edge drops away", "steady", "EARLIER STUDIES DIFFER MOSTLY IN MATH · PER AGU", "the housing rattles", ""),
 (28, 13, W("uncertainty."), "chain", "a quote plate on two chains", "drops from the open housing lid and swings while the needle's shadow fans wide across the dial face", "steady", "\"QUITE A LARGE UNCERTAINTY\" · ANDREAS KRAUSE · PER AGU", "the chains rattle", ""),
 (29, 14, 0.0, "rustle", "the sealed envelope a pace from the glass", "trembles and its flap lifts a finger's width", "uneasy", "PREPRINT · OCTOBER 17TH · KRAUSE AND RAMMIG", "the raven backs off", ""),
 (43, 14, W("testing"), "swoosh", "a satellite-data race track", "unrolls across the ridge and a lineup of unlabelled block racers toes the start line", "curious", "ML LIGHTNING MODELS IN GENERAL · PREPRINT", "the racers bounce", ""),
 (30, 14, W("average"), "roll", "a plain pine ruler with a sleepy face", "lies across the track and simply wins as the block racers sprint and stall behind it, with no glass anywhere on the course", "smug", "SIMPLE AVERAGE · BEAT THE ML MODELS · PREPRINT · ON SATELLITE DATA", "the racers slump", ""),
 (31, 15, 0.0, "tear", "the envelope", "tears open and a parchment card rises out of it onto a stake between the glass and the incoming weather", "determined", "TEST OUTSIDE THE TRAINING DATA · PREPRINT · NOT PEER REVIEWED", "the card spins once and faces the ridge", "rehook: the envelope that waited by the glass since the start tears open and a card rises out of it onto a stake"),
 (32, 15, W("conditions."), "creak", "the test card's shadow", "falls across the glass's sealed neck as the light lowers, the 2019 seal intact", "determined", "OUR READ · THE RANGE WAITS ON A TEST", "the shadow settles", ""),
 (33, 16, 0.0, "knock", "a weathered field plank in front of the storm glass", "has four empty brass pins knocked into it in a row", "calm", "BEAT A REGRESSION + 3 EXISTING FORMULAS · PER THE PAPER", "the plank jumps", ""),
 (47, 16, W("regression"), "pin", "a brass-and-parchment rosette", "punches onto the first pin with a snap and springs out", "calm", "1 REGRESSION", "the glass glances down", ""),
 (44, 16, W("formulas."), "pop", "three more rosettes", "punch onto the other three pins one after another and flutter", "calm", "3 EXISTING FORMULAS · PER THE PAPER", "the rosettes flutter", ""),
 (34, 17, 0.0, "ratchet", "a brass caliper", "racks its two jaws onto the hatched range column, one jaw at its floor and one at its ceiling with equal weight, the TODAY token below outside the jaws", "steady", "ALASKA · +116% TO +594% · PROJECTION · PER AGU", "the jaws settle", ""),
 (35, 17, W("double"), "click", "a labelled tick on the caliper's lower jaw", "slides out and clicks against the floor of the range", "steady", "LOW END · MORE THAN 2X · PROJECTION · PER AGU", "the caliper hums", ""),
 (36, 18, 0.0, "rumble", "a storm wall", "rises on the far horizon behind the ridge for the first time, a dashed band of unfamiliar sky beyond it", "curious", "OUR READ · THE WHOLE RANGE AWAITS AN OUT-OF-SAMPLE TEST", "the glass turns to look", ""),
 (37, 19, 0.0, "boom", "the true map of Alaska seen from above under a storm", "takes lemon strike marks statewide, densest over the Southwest", "awed", "JUNE 23RD, 2024 · AK DIV. OF FORESTRY", "cloud shadows race across it", ""),
 (45, 19, W("strikes"), "crack", "the strike marks on the map", "keep landing until the Southwest is thick with them", "awed", "ONE DAY · NEARLY 7,000 STRIKES · AK DIV. OF FORESTRY", "a far roll of thunder", ""),
 (38, 19, W("Who"), "hush", G, "stands on the ridge in the frame-one framing with its 2019 seal still on, the test card on its stake beside it and the dashed band of unfamiliar sky behind", "curious", "WHO SHOULD RUN THAT TEST?", "the glass's eyes turn toward the band of unfamiliar sky", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 60)}
PLATE_AT.update({1: "lower-third", 14: "lower-third", 38: "lower-third"})
CLAIM_MAP = {1: ["c8"], 40: ["c7"], 2: ["c8"], 3: ["c9"], 4: ["c1"], 5: ["c2"], 6: ["c4"], 7: ["c5"], 10: ["c19"], 8: ["c6"], 46: ["c3"], 9: ["c3"],
             11: ["narration"], 12: ["c7"], 13: ["c8"], 14: ["c8"], 15: ["c10"], 41: ["c8", "c10"], 16: ["c23"], 17: ["c24"], 18: ["c25"], 19: ["c25"],
             20: ["c15"], 21: ["c2"], 22: ["c11"], 23: ["c12"], 24: ["c14"], 25: ["c13"], 26: ["c13"], 39: ["c14"], 27: ["c14"], 28: ["c16"],
             29: ["c19"], 43: ["c19"], 30: ["c20"], 31: ["c21"], 32: ["narration"], 33: ["c22"], 47: ["c22"], 44: ["c22"], 34: ["c8"], 35: ["c8"], 36: ["c21"], 37: ["c26"], 45: ["c26"], 38: ["narration"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "low", "storm-ridge", "low-angle-heroic", "stacked-layers", "vertical-descent", "single-organic-hero", "", "", "The strike",
  "Low on a sedge ridge under a thunderhead at a June midnight sun a lemon bolt hits the storm glass's sealed neck and its crystals flare, a paper TODAY token drops beside it, and a hatched ghost column with a question mark rises to about seven times its height"),
 (2, 1, "two-up", "medium", "eye", "ridge-easel", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "whip-pan", "carry", "Who made it",
  "Beside the glass a gust slaps a journal sheet onto a brass easel, a name card darts into the tussock, and the glass turns to show its MACHINE LEARNING MODEL tag"),
 (3, 3, "macro-closeup", "insert", "eye", "tap-cutaway", "exploded-diagram", "hud-instrument-frame", "assemble-build", "data-as-subject", "push-in", "build", "Six readings in",
  "Close on the glass, foot to sealed neck: six little weather instruments tick, six brass taps open in a cascade, an envelope addressed ML LIGHTNING MODELS skids to a stop a pace away, and a crystal tip taps strike marks into a half-degree grid tile"),
 (4, 4, "push-detail", "close", "high", "glass-cap", "macro-closeup", "single-object-void", "vertical-descent", "single-organic-hero", "match-cut", "match", "Sealed in 2019",
  "From above a brass hand stamp hovers over the wax seal, then presses 2019 into it"),
 (5, 5, "map-territory", "extreme-wide", "high", "tundra-map", "oblique-map", "map-territory", "vertical-rise", "landscape-as-subject", "map-travel", "travel", "Today's Alaska",
  "Low and oblique, the true outline of Alaska is cut into the tundra like a chalked map with the storm glass at its edge, and a single TODAY token drops into its middle"),
 (6, 6, "data-panel", "wide", "low", "range-columns", "low-angle-heroic", "fullbleed-split", "vertical-rise", "multiplicity-swarm", "graphic-match", "build", "The range",
  "Low beside the TODAY token a hatched lemon range column racks up from about two to about seven units with the storm glass and its glowing seal behind, then a slimmer WORLD range column slides in and its top overlaps Alaska's floor"),
 (7, 8, "wide-establish", "extreme-wide", "eye", "taiga-ledger", "eye-level-immersive", "stacked-layers", "assemble-build", "multiplicity-swarm", "hard-cut", "travel", "Fire country",
  "In taiga under the anvil ten ledger posts knock up with bars past 93 percent, the glass small on the far ridge, then a true-scale unplaced swatch of 2022's burned area unrolls on a survey sheet"),
 (8, 9, "subject-portrait", "medium", "eye", "storm-ridge", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "hard-cut", "carry", "Only lightning",
  "The glass turns from the ledger to face the anvil as THE STUDY DIDN'T MODEL FIRE stamps the easel, and a far bolt touches one conifer tip as a single spark while the raven ducks"),
 (9, 10, "push-detail", "close", "high", "name-stake", "top-down-map", "single-object-void", "push-in-only", "data-as-subject", "push-in", "carry", "Surprised",
  "From above, a parchment slip on Krause's name card staked low in the tussock types out the quote, the card drops a LEAD AUTHOR line, and the glass in the mid-ground goes still as a question-mark tag swings from its collar"),
 (10, 11, "data-panel", "medium", "eye", "dial-plank", "exploded-diagram", "hud-instrument-frame", "radial-emanate", "data-as-subject", "whip-pan", "build", "The dial",
  "On a field plank on the ridge a brass sensitivity dial whips back over a sepia 1900s strip to 12, an EARLIER STUDIES band slides in from 8 to 17, the needle swings hard past it, and the seal on the glass beside it glows hot"),
 (11, 13, "map-territory", "medium", "overhead", "dial-open", "top-down-map", "hud-instrument-frame", "radial-emanate", "structure-as-subject", "pull-out", "carry", "Different math",
  "From straight above the dial's housing swings open on two gear trains fed by one weather strip, turning out 8 TO 17 and 30, and a quote plate drops on chains as the needle's shadow fans wide"),
 (12, 14, "wide-establish", "wide", "eye", "satellite-track", "eye-level-immersive", "grid-modular", "horizontal-traverse", "multiplicity-swarm", "mask-wipe", "build", "The twist",
  "The envelope trembles, then a satellite-data race track unrolls and a sleepy pine AVERAGE ruler lies across it and wins while unlabelled block racers stall, no glass on the course"),
 (13, 15, "push-detail", "close", "eye", "card-stake", "macro-closeup", "centered-hero-lowerthird", "radial-emanate", "single-organic-hero", "match-cut", "match", "The advice",
  "The envelope tears open, a card reading TEST OUTSIDE THE TRAINING DATA rises onto a stake between the glass and the weather, and the card's shadow falls across the glass's still-sealed neck"),
 (14, 16, "subject-portrait", "medium", "low", "pin-plank", "low-angle-heroic", "centered-hero-lowerthird", "vertical-rise", "single-organic-hero", "hard-cut", "carry", "In fairness",
  "On a field plank in front of the glass four brass pins wait, one rosette punches on for the regression and three more for the existing formulas"),
 (15, 17, "data-panel", "wide", "eye", "range-columns", "eye-level-immersive", "fullbleed-split", "vertical-descent", "multiplicity-swarm", "graphic-match", "build", "Read it as a range",
  "A brass caliper racks onto the hatched range column, one jaw at its floor and one at its ceiling with equal weight, a tick clicks out at the low end, and a storm wall rises on the far horizon with a dashed band of unfamiliar sky"),
 (16, 19, "map-territory", "extreme-wide", "overhead", "june-storm", "top-down-map", "stacked-layers", "radial-emanate", "landscape-as-subject", "pull-out", "travel", "Who runs it",
  "From above the true map takes strike marks statewide, densest over the Southwest, then a cut back to the frame-one ridge: the glass still sealed, the test card on its stake beside it, the dashed band of unfamiliar sky behind"),
]

AMBIENT = {1: "wind in the sedge, the anvil grumbling", 2: "wind, a far rumble", 3: "a brass hum, trickling", 4: "wind, a far rumble", 5: "high wind",
           6: "wind, a far rumble", 7: "wind in the spruce, rumble", 8: "wind in the sedge", 9: "wind in the tussock", 10: "a brass hum, wind",
           11: "wind, paper", 12: "wind over the track", 13: "wind, a far rumble", 14: "wind in the sedge", 15: "wind, rumble", 16: "storm wind and rain"}
CENTER = {1: "the glass at x560 y1000", 2: "the glass and easel at x540 y1000", 3: "the tap cutaway at x540 y960", 4: "the seal at x540 y900",
          5: "the map square at x540 y960", 6: "the range column at x560 y1000", 7: "the ledger posts at x540 y1000", 8: "the glass at x540 y1020",
          9: "the quote card at x540 y940", 10: "the dial at x540 y940", 11: "the open gear trains at x540 y980", 12: "the track at x540 y1000",
          13: "the cap and card at x540 y920", 14: "the glass at x540 y1000", 15: "the stack and caliper at x560 y980", 16: "the glass at x560 y1020"}
HERO = {
 1: ("storm glass + anvil cloud + bolt + strike-token stack + raven", "55% glass and bolt, 30% stack, 15% sky"),
 2: ("storm glass + brass easel + journal sheet + name card + label tag", "50% glass, 35% easel, 15% card"),
 3: ("brass stand cutaway + six taps + six weather instruments + grid tile + envelope", "55% taps, 25% glass base, 20% tile and envelope"),
 4: ("glass neck + wax seal + brass stamp", "65% seal and neck, 35% stamp"),
 5: ("chalked true Alaska outline + TODAY token + storm glass at the edge", "60% outline, 25% token, 15% glass"),
 6: ("hatched range column + TODAY token + WORLD column + storm glass", "55% columns, 25% token, 20% glass"),
 7: ("black spruce + ten ledger posts + true map with 2022 hatch", "50% posts, 30% spruce, 20% map"),
 8: ("storm glass + easel stamp + far spruce + bolt + raven", "50% glass, 30% stamp, 20% spark"),
 9: ("name card stake + parchment slip + glass instrument in the mid-ground", "55% slip, 25% stake, 20% glass"),
 10: ("sensitivity dial + 1900s strip + earlier studies band + wax seal", "60% dial, 25% band, 15% seal"),
 11: ("open dial housing + two gear trains + quote plate on chains", "55% gears, 30% dial, 15% plate"),
 12: ("satellite race track + sleepy ruler + block racers + envelope", "55% ruler and racers, 35% track, 10% envelope"),
 13: ("envelope + rising card on stake + card shadow + sealed neck", "45% card, 35% seal, 20% envelope"),
 14: ("field plank + four pins + four rosettes + storm glass", "50% rosettes, 35% glass, 15% plank"),
 15: ("range column + caliper + storm wall on horizon", "55% column and caliper, 30% horizon, 15% token"),
 16: ("true map with strike marks + storm glass + test card on stake", "50% map, 35% glass and card, 15% storm"),
}
PARTS = {i: 44 for i in range(1, 17)}
KICKS = (1, 25, 37)
CAMERA = {1: "craneDown+dollyThrough", 2: "truckAcross", 3: "dollyThrough", 4: "craneDown", 5: "craneDown", 6: "riseWith", 7: "truckAcross", 8: "dollyThrough",
          9: "craneDown", 10: "dollyThrough", 11: "craneDown", 12: "truckAcross", 13: "craneDown", 14: "riseWith", 15: "riseWith", 16: "orbitReveal"}

PALETTE = ("green-slate #2F3A3A storm sky to a pewter #55606A anvil, golden apricot #F2A65A midnight light banding below the anvil that thins act by act, tussock khaki #6B6A3A, taiga conifers #1D2A22, "
           "muted fireweed buds #A65A7E, a smoke-lilac #DCD6E6 teardrop vial in a brass #B98A3A bracket, lemon #FFE45C reserved for lightning, oxblood #7E2630 reserved for the wax seal, aubergine outlines #1A1424")


def BOARD_HEAD(b_at, end, ad, tr):
    return {
        "run_date": "2026-11-27", "slug": "trained-on-2019", "title": "Trained on 2019",
        "concept": ("A study in Earth's Future (November 24th) by Andreas Krause's team at the Technical University of Munich trained an XGBoost machine learning model on lightning and weather observations from one year, 2019, "
                    "six everyday weather readings and where ground strikes landed on a half-degree grid. On today's climate most of Alaska got under one strike per square kilometer a year. By 2100 under high emissions Alaska could get 116 to 594 percent more, "
                    "the world's land 76 to 140 percent. Lightning fires burned at least 93 percent of Alaska's wildfire acres every year for a decade, but the study didn't model fire. Krause was quite surprised the projections were so high. "
                    "Run backward the model estimated about 12 percent more lightning per degree; earlier studies projected 8 to 17; run forward its own 12 could nearly triple to 30, and the release says earlier studies differ mostly in math. "
                    "The twist: a month earlier Krause and Anja Rammig posted a preprint in which a simple average beat the machine learning lightning models it tested, and advised testing models outside their training conditions. "
                    "In fairness the paper's model beat a regression and three existing formulas. Read it as a range that waits on that test. Drawn as a teardrop glass instrument labelled THE MODEL with a wax seal stamped 2019, a hatched lemon range column beside a paper TODAY token, a dial whose two gear trains differ, a sleepy ruler that wins a race the model isn't in, and an envelope addressed ML LIGHTNING MODELS whose card ends on a stake beside the still-sealed glass."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "low-angle-heroic", "motion_vector": "vertical-rise", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "cartoon-exterior-storm", "palette": PALETTE, "camera_strategy": "ridge-low-and-craned-map",
                        "light_story": "warm golden midnight sun under an anvil",
                        "metaphor": "a sealed glass instrument that learned the sky from one year, a hatched range column of strikes, a dial whose two gear trains differ, and a test card that waits on a stake"},
        "signature_shot": 1,
        "palette": PALETTE,
        "divergence_note": ("Against the last four films: 11-26 celadon CT tile and graphite under a bone lightbox key with an orchid #D94FB0 pulse (hue about 318), indoors before dawn; 11-25 bone noon snow at a rail fork with railway amber #F2A93B (about 38); 11-24 flat July overcast on olive tundra with vermilion pins (about 8); 11-23 apricot-plum civil twilight on river ice with scarlet (about 355). "
                            "This film is outdoors under a green-slate storm sky (#2F3A3A, about 180) with a golden ember band, and its only saturated accent is lemon #FFE45C (about 52) for lightning alone; the hero glass is smoke-lilac #DCD6E6 (about 260), far from 11-26's celadon; fireweed is muted buds only. "
                            "The hero is a teardrop glass instrument sealed with wax in a brass bracket, which differs from 11-23's SampleTube (a stoppered upright cylinder in a lab rack) by silhouette (teardrop vs cylinder), closure (wax-sealed neck vs stopper) and mount (field bracket vs rack), and it performs mostly through its physics, not a face's moods. "
                            "Honest overlaps: a true Alaska map seen from above in one shot (S16; S5 is a low oblique), a brass needle dial (11-24 used gauges), a race gag (11-26 had a printer losing to a phone), and conifers from the shelf."),
        "treatment": {"title": "Trained on 2019", "summary": ad["treatment"], "judge_reasoning": tr[2] if len(tr) > 2 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "A green-slate storm sky over a sedge ridge, a sealed glass instrument on a brass bracket against dark taiga, and at 0.2 s a lemon bolt drops out of the anvil onto its sealed neck while its crystals flare",
                 "headline": "BY 2100 · HIGH EMISSIONS", "motion_by_s": 0.2,
                 "loopback": "Frame 1 is the bolt hitting the sealed glass low on the ridge; the last shot returns to the same low framing with the glass still sealed, the test card on its stake beside it and the storm wall far behind."},
        "open_loop": {"plant_t": b_at(10), "pay_t": b_at(31), "plant_glow_s": 0.4, "plant_sfx": "slide", "what": "What is in the envelope addressed ML LIGHTNING MODELS? Planted as a sealed parchment envelope dated OCTOBER 17TH skidding to a stop a pace from the glass; paid when it tears open and the card TEST OUTSIDE THE TRAINING DATA rises onto a stake."},
        "open_loop_2": {"plant_t": b_at(20), "pay_t": b_at(27), "what": "Why so high? Planted as Krause's surprise typing out on the slip by his name card; paid when the dial housing swings open on two different gear trains turning out 8 TO 17 and 30, earlier studies differ mostly in math."},
        "throughline": {"object": "the oxblood wax seal on the storm glass's neck", "lands_in_button": "the seal still on, 2019 in the wax, the test card on its stake beside the glass",
                        "states": [
                            {"at_s": b_at(1), "state": "S0 a plain oxblood seal on the neck as the first bolt hits"},
                            {"at_s": b_at(9), "state": "S1 pressed with 2019"},
                            {"at_s": b_at(14), "state": "S2 glowing as the range column racks up in front of the glass"},
                            {"at_s": b_at(21), "state": "S2b a parchment question-mark tag hangs from the collar under the crisp 2019 seal at Krause's surprise"},
                            {"at_s": b_at(26), "state": "S3 the 2019 glowing hot, crisp and intact, the question tag still on, as the forward run swings past the earlier studies"},
                            {"at_s": b_at(32), "state": "S4 the test card's shadow falls across the sealed neck"},
                            {"at_s": b_at(38), "state": "S5 still sealed with 2019 beside the test card on its stake, the test not yet shown"}]},
        "reveals": [
            {"t": b_at(14), "type": "build-on", "what": "the hatched range column clacks up to about seven units beside the lone TODAY token", "hold_s": 0.7},
            {"t": b_at(17), "type": "scale-pullback", "what": "a true-scale swatch of 2022's burned area unrolls beside a small whole Alaska", "hold_s": 0.8},
            {"t": b_at(25), "type": "morph-to-chart", "what": "the needle swings past the EARLIER STUDIES band", "hold_s": 0.6},
            {"t": b_at(34), "type": "build-on", "what": "the caliper's jaws rack onto the floor and ceiling of the range", "hold_s": 0.7},
            {"t": b_at(45), "type": "scale-pullback", "what": "the whole true map fills with strike marks, densest over the Southwest", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.0}, {"line": 5, "offset": 0.0, "level": 0.8}, {"line": 6, "offset": 0.0, "level": 1.15},
            {"line": 8, "offset": 0.0, "level": 0.9}, {"line": 11, "offset": 0.0, "level": 0.8}, {"line": 12, "offset": 0.0, "level": 1.2},
            {"line": 14, "offset": 0.0, "level": 0.9}, {"line": 15, "offset": 0.0, "level": 1.15}, {"line": 17, "offset": 0.0, "level": 0.9},
            {"at_s": round(b_at(38) - 0.6, 3), "level": 0.35}, {"at_s": round(b_at(38) + 0.4, 3), "level": 1.1},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(38) - 0.5, 3), "riser_at": round(b_at(31) - 1.0, 3), "silence_at": round(b_at(38) - 0.5, 3),
            "payoff_at": b_at(38), "button_pattern": "callback", "interrupt_at": b_at(30), "extra_dips": []},
    }


def build():
    starts, real = base.line_starts()
    end = starts["end"]
    words = base.load_words() if real else {}
    book = AnchorBook(words, real=real, lines=LINES)

    def at(line, anc):
        nxt = starts.get(line + 1, end)
        if isinstance(anc, tuple):
            want, nth = anc
            return book.word(line, want, nth, starts[line], nxt)
        return starts[line] + anc * (nxt - starts[line])

    def shot_for(line):
        return max(i for i, row in enumerate(S, 1) if row[1] <= line)

    beats = []
    for (bid, line, anc, sfx, subj, act, emo, ann, reaction, rehook) in B:
        sh = shot_for(line)
        shows = f"{subj} {act}, a plate reads {ann}"
        a = round(at(line, anc), 3)
        beats.append({
            "id": bid, "shot": sh, "at_s": a, "vo_line": line,
            "anchor": {"vo_line": line, "fraction": anc if not isinstance(anc, tuple) else 0.0, "offset": round(a - starts[line], 3)},
            "offset": round(a - starts[line], 3), "vo": LINES[line], "phrase": base._phrase(line, anc),
            "shows": shows, "sfx": sfx, "means": ann.lower(), "rehook": rehook if rehook.startswith("rehook") else "",
            "draw": {"subject": subj, "action": act, "emotion": emo, "annotation": ann},
            "plate_at": PLATE_AT[bid], "claims": CLAIM_MAP[bid],
            "choreo": {"primary": shows, "reaction": reaction, "ambient": AMBIENT[S[sh - 1][0]]},
        })
    for b in beats:
        if b["id"] in KICKS:
            b["kick"] = True
    beats.sort(key=lambda b: (b["at_s"], b["id"]))
    for lo, hi in ((25, 38), (55, 72), (88, 104)):
        seen = False
        for b in beats:
            if lo <= b["at_s"] <= hi and b["rehook"]:
                if seen:
                    b["rehook"] = ""
                seen = True
    for i, b in enumerate(beats):
        nx = beats[i + 1]["at_s"] if i + 1 < len(beats) else end
        b["t"] = f"{b['at_s']:.3f}-{nx:.3f}"

    shots = []
    for idx, (sid, line, framing, scale, height, stage, pov, layout, mv, hero_t, trans, thread, title, means) in enumerate(S, 1):
        st = round(starts[line], 3)
        shots.append({
            "title": title, "vo_line": line, "framing": framing, "scale": scale, "height": height, "stage": stage,
            "pov": pov, "layout": layout, "motion_vector": mv, "hero_treatment": hero_t,
            "camera": CAMERA[sid], "transition_in": trans, "thread": thread, "stage3d": "planes",
            "centered": CENTER[sid], "means": means, "ambient": AMBIENT[sid],
            "hero": {"name": HERO[sid][0], "parts": PARTS[sid], "zones": 3, "detail_note": HERO[sid][1]},
            "id": idx, "start_s": st,
        })
    for i, s in enumerate(shots):
        nx = shots[i + 1]["start_s"] if i + 1 < len(shots) else end
        s["t"] = f"{s['start_s']:.3f}-{nx:.3f}"

    def b_at(i):
        return next(b for b in beats if b["id"] == i)["at_s"]

    ad = json.loads((OUT / "art_direction.json").read_text())
    tr = (OUT / "treatment.md").read_text().splitlines()
    board = BOARD_HEAD(b_at, end, ad, tr)
    board.update({"shots": shots, "beats": beats})
    board["throughline"]["states"].sort(key=lambda x: x["at_s"])
    order = sorted(board["beats"], key=lambda b: (b["at_s"], b["id"]))
    ids = {b["id"]: rank for rank, b in enumerate(order, 1)}
    for b in board["beats"]:
        b["key"] = b["id"]
        b["id"] = ids[b["key"]]
    board["beats"].sort(key=lambda b: b["id"])
    board["_ids"] = ids
    book.raise_if_missing("board_1127 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1127Ids.ts").write_text(
        "// GENERATED by scripts/board_1127.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
