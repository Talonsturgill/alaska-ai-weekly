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
G = "the storm glass, a sealed glass capsule on a brass stand with a face etched in it and feather crystals inside, labelled THE MODEL"
T = "the strike-token stack on one lifted square of Alaska map"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "crack", G, "takes a lemon bolt from the anvil cloud square on its brass cap with a squash, and its crystals branch out in answer on a sedge ridge under the midnight sun", "startled", "BY 2100 · HIGH EMISSIONS", "the raven on the stake ducks", ""),
 (2, 0, W("double,"), "thud", T, "drops one TODAY token, then two lemon tokens and a sixth of a third slam down beside it", "curious", "MORE THAN 2X · LOW END", "the stack wobbles and settles", ""),
 (3, 0, W("seven"), "riser", T, "grows a tower of dashed lemon outlines up to nearly 7X that sways in the wind", "surprised", "UP TO NEARLY 7X · UPPER ESTIMATE · PER AGU", "the glass leans back to look up at it", ""),
 (4, 1, 0.0, "page", "a journal sheet blown along the ridge by a gust", "slaps against a brass easel beside the glass and a spring clip snaps shut on it", "curious", "EARTH'S FUTURE · NOVEMBER 24TH", "the corner flutters", ""),
 (5, 2, 0.0, "clink", "a boxed name card on a short stake", "drives into the tussock beside the easel like a thrown dart and the turf splits around it", "steady", "ANDREAS KRAUSE · TECHNICAL UNIVERSITY OF MUNICH", "the card shivers", ""),
 (6, 2, W("machine"), "swing", G, "turns to show a brass label tag swinging from its stand", "proud", "A MACHINE LEARNING MODEL · XGBOOST", "the tag swings", ""),
 (7, 3, 0.0, "whirr", "six brass intake taps on the glass's stand, each fed by a little instrument (a thermometer, a rain cup, a hair hygrometer, a barometer, a windsock, a sun disc)", "open one after another and a lemon trickle runs up each pipe into the glass", "curious", "TEMPERATURE · RAIN · HUMIDITY · PRESSURE · WIND · SUN", "the crystals inside grow a branch per tap", ""),
 (8, 3, W("strikes"), "tap", "a gridded square tile on the brass bench under the glass", "gets lemon strike marks tapped into its half-degree cells by a crystal tip that reaches down through the base", "focused", "CLOUD-TO-GROUND LIGHTNING · HALF-DEGREE GRID", "dust puffs from each mark", ""),
 (9, 4, 0.0, "stamp", "an oxblood wax seal on the glass's cap", "is pressed down with a brass stamp and leaves 2019 in the wax", "steady", "TRAINED ON 2019", "the cap rings", ""),
 (10, 3, W("everyday"), "slide", "a sealed parchment envelope", "slides in under the brass stand from off frame and stops with its wax dot up, the glass glancing down at it", "uneasy", "OCTOBER 17TH · 2 OF THE SAME AUTHORS", "the envelope's flap lifts a hair and settles", ""),
 (11, 5, 0.0, "whoosh", "the true outline of Alaska drawn on the tundra like a giant map", "lifts one small square out of its Interior like a tile as the view cranes down", "curious", "ONE MAP SQUARE · ILLUSTRATIVE", "the tile rocks as it rises", ""),
 (12, 5, W("strike"), "tick", T, "shows a single lemon TODAY token standing alone on the lifted square", "calm", "UNDER 1 BOLT PER SQ KM A YEAR · 1995 TO 2014 · PER AGU", "the token bobs", ""),
 (13, 6, 0.0, "thud", T, "takes two lemon tokens and a sixth of a third, slammed down beside the TODAY token", "surprised", "+116% · LOW END", "the square dips under the weight", "rehook: two lemon tokens slam onto the map square beside the lone TODAY token and the square dips"),
 (14, 6, W("ninety-four"), "riser", T, "grows a dashed tower to nearly 7X and the view tilts up to follow it", "surprised", "ALASKA · +116% TO +594% · PROJECTION · HIGH EMISSIONS", "the tower sways", ""),
 (15, 7, 0.0, "slide", "a second, shorter stack labelled WORLD", "slides in beside Alaska's and stops well below its dashed tower", "curious", "WORLD · +76% TO +140% · HIGH EMISSIONS", "the WORLD stack's top token rocks", ""),
 (16, 8, 0.0, "boom", "a row of wooden ledger posts in black spruce country under the anvil, one per year from 2015 to 2024", "rises post by post, 10 of 10 topped by a bar filled past the 93 percent mark", "worried", "LIGHTNING FIRES · 93% TO 100% OF ACRES BURNED · 2015 TO 2024 · AK DIV. OF FORESTRY", "the spruce tops sway", ""),
 (17, 8, W("decade."), "rumble", "the true map of Alaska seen from above", "pulls back as a hatched patch the size of 2022's burned acres darkens across the Interior", "worried", "2022 · ABOUT 3.1 MILLION ACRES · 99% LIGHTNING", "smoke curls off the hatch", ""),
 (18, 9, 0.0, "stamp", G, "turns away from the ledger posts as a parchment stamp lands on the easel beside it", "steady", "THE STUDY DIDN'T MODEL FIRE", "the easel jumps", ""),
 (19, 9, W("spark"), "sizzle", "a lemon bolt", "touches one far spruce tip and stops there as a single spark, while the raven on its stake ducks", "uneasy", "ONLY LIGHTNING", "the raven ruffles", ""),
 (20, 10, 0.0, "type", "a parchment quote card on the easel", "types itself out letter by letter beside the glass", "surprised", "\"I WAS QUITE SURPRISED THAT THE PROJECTIONS WERE SO HIGH.\" · ANDREAS KRAUSE · PER AGU", "the glass's brow rises", ""),
 (21, 10, W("surprised"), "glass", G, "blushes ember from the base up and its crystals give a little shiver", "sheepish", "LEAD AUTHOR", "a crystal tinkles", ""),
 (22, 11, 0.0, "roll", "a brass sensitivity dial on the bench, its scale in percent per degree", "spins its needle backward as a 1900s strip of sepia weather unrolls beneath it", "focused", "1900S · MODEL ESTIMATE", "the strip curls", "rehook: the brass dial spins its needle backward as a sepia 1900s strip unrolls under it"),
 (23, 11, W("twelve"), "click", "the dial's needle", "settles at 12 with a small overshoot", "calm", "ABOUT 12% PER °C", "the needle quivers", ""),
 (24, 12, 0.0, "slide", "a shaded band on the dial face", "slides in around the needle from 8 to 17", "calm", "EARLIER STUDIES · 8% TO 17% PER °C", "the band's edge glints", ""),
 (25, 12, W("forward,"), "whoosh", "the dial's needle", "winds back for an anticipation and swings hard right, past the shaded band", "surprised", "FUTURE · ABOUT 30% PER °C · COULD", "the dial housing jumps on the bench", "rehook: the needle winds back and swings hard right past the EARLIER STUDIES band"),
 (26, 12, W("thirty"), "hiss", "the oxblood wax seal on the glass's cap", "bulges and weeps a bead of wax as the crystals inside crowd up", "worried", "NEARLY 3X ITS OWN 12", "a wax bead runs down", ""),
 (39, 13, 0.0, "paper", "a press-release sheet", "drops out of the wind onto the easel and its clip snaps", "steady", "PRESS RELEASE · AGU", "the sheet settles", ""),
 (27, 13, W("math."), "scratch", "a brass pointer", "slams down on one sentence of the press-release sheet and the easel rocks back", "steady", "EARLIER STUDIES DIFFER MOSTLY IN MATH · PER AGU", "the pointer taps twice", ""),
 (28, 13, W("uncertainty."), "pop", "a quote plate", "hangs from the easel's arm on two chains and swings", "steady", "\"QUITE A LARGE UNCERTAINTY\" · ANDREAS KRAUSE · PER AGU", "the chains rattle", ""),
 (29, 14, 0.0, "rustle", "the sealed envelope under the glass's stand", "trembles and its flap lifts a finger's width", "uneasy", "PREPRINT · OCTOBER 17TH · KRAUSE AND RAMMIG", "the glass looks down", ""),
 (30, 14, W("average"), "roll", "a plain wooden ruler with a sleepy face", "lies across a satellite-data race track and simply wins as a lineup of unlabelled machine learning model saplings sprint and stall behind it, the storm glass watching from outside the rail", "smug", "SIMPLE AVERAGE · BEAT THE ML MODELS · PREPRINT · ON SATELLITE DATA", "the saplings droop", ""),
 (31, 15, 0.0, "tear", "the envelope", "tears open and a parchment card rises out of it", "determined", "TEST OUTSIDE THE TRAINING DATA · PREPRINT", "the card spins once and faces out", "rehook: the envelope that waited under the glass since the start tears open and a card rises out of it"),
 (32, 15, W("conditions."), "stamp", "the oxblood wax seal", "is stamped over with TEST OUTSIDE and a crack of air hisses under the cap", "determined", "THE SEAL · RESTAMPED", "the cap rattles", ""),
 (33, 16, 0.0, "bell", G, "has two rosette ribbons pinned on its brass stand", "proud", "BEAT A REGRESSION + 3 EXISTING FORMULAS · PER THE PAPER", "the ribbons flutter", ""),
 (34, 17, 0.0, "swell", T, "is bracketed top to bottom by a brass caliper from the TODAY token to the top of the dashed tower", "steady", "THE RANGE · +116% TO +594%", "the caliper's jaws settle", ""),
 (35, 17, W("double"), "chime", "the caliper's lower jaw", "glows at the low end, two tokens and a sixth, over the black spruce", "steady", "LOW END · MORE THAN 2X", "the spruce sway", ""),
 (36, 18, 0.0, "creak", G, "lifts its cap a crack and peers out at new weather rolling in over the ridge", "curious", "WEATHER IT NEVER SAW", "the crystals lean toward the gap", ""),
 (37, 19, 0.0, "boom", "a June sky over Southwest Alaska", "fills with lemon bolts from a wall of cloud as the view pulls back over the true map", "awed", "ONE DAY · NEARLY 7,000 STRIKES", "the raven ducks twice", ""),
 (38, 19, W("Who"), "ping", G, "stands with its cap half lifted in the storm light while the raven hops onto the envelope and leans in", "curious", "WHO SHOULD RUN THE TEST?", "the raven tilts its head", ""),
 (40, 0, W("Alaska"), "rumble", "the anvil cloud over the ridge", "flickers lemon inside and rumbles as the raven on its stake ducks", "uneasy", "ALASKA", "the raven ruffles", ""),
 (41, 7, W("more."), "clink", "the WORLD stack's top token", "clinks into place and the two stacks rock side by side", "curious", "BOTH · HIGH EMISSIONS", "the stacks settle", ""),
 (42, 8, W("acres"), "thump", "the tenth ledger post, 10 of 10", "thumps into the peat and its bar fills past the 93 percent mark", "worried", "AT LEAST 93% · EVERY YEAR", "the spruce shiver", ""),
 (43, 14, W("testing"), "swoosh", "a satellite-data race track", "unrolls across the ridge and a lineup of unlabelled model racers toes the start line", "curious", "LIGHTNING MODELS · TESTED", "the racers bounce", ""),
 (44, 16, W("formulas."), "pin", "a brass pin", "punches a second rosette onto the stand and it springs out and flutters", "proud", "PER THE PAPER'S ABSTRACT", "the ribbons flutter", ""),
 (45, 19, W("Alaska."), "crack", "the true map under the storm", "flashes lemon over its Southwest coast as one bolt lands", "awed", "JUNE 23RD, 2024 · AK DIV. OF FORESTRY", "the raven ducks", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 60)}
PLATE_AT.update({1: "lower-third", 14: "lower-third", 38: "lower-third"})
CLAIM_MAP = {1: ["c8"], 2: ["c8"], 3: ["c9"], 4: ["c1"], 5: ["c2"], 6: ["c4"], 7: ["c5"], 8: ["c6"], 9: ["c3"], 10: ["c19"],
             11: ["narration"], 12: ["c7"], 13: ["c8"], 14: ["c8"], 15: ["c10"], 16: ["c23"], 17: ["c24"], 18: ["c25"], 19: ["c25"],
             20: ["c15"], 21: ["c2"], 22: ["c11"], 23: ["c12"], 24: ["c14"], 25: ["c13"], 26: ["c13"], 27: ["c14"], 28: ["c16"],
             29: ["c19"], 30: ["c20"], 39: ["c14"], 40: ["narration"], 41: ["c8", "c10"], 42: ["c23"], 43: ["c19"], 44: ["c22"], 45: ["c26"], 31: ["c21"], 32: ["narration"], 33: ["c22"], 34: ["c8"], 35: ["c8"], 36: ["c21"], 37: ["c26"], 38: ["narration"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "low", "storm-ridge", "low-angle-heroic", "stacked-layers", "vertical-descent", "single-organic-hero", "", "", "The strike",
  "On a sedge ridge under a thunderhead at midnight sun a lemon bolt hits the storm glass's cap, its crystals branch, and strike tokens stack from one TODAY token to two and a sixth, then a dashed tower to nearly seven"),
 (2, 1, "two-up", "medium", "eye", "ridge-easel", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "whip-pan", "carry", "Who made it",
  "Beside the glass a journal sheet flips up on a brass easel, a name card knocks into the tussock, and the glass turns to show its MACHINE LEARNING MODEL tag"),
 (3, 3, "macro-closeup", "insert", "eye", "tap-cutaway", "exploded-diagram", "hud-instrument-frame", "assemble-build", "data-as-subject", "push-in", "build", "Six readings in",
  "A cutaway of the brass stand: six taps fed by six little weather instruments open one by one, lemon trickles climb into the glass, and a crystal tip taps strike marks into a half-degree grid tile"),
 (4, 4, "push-detail", "close", "high", "glass-cap", "macro-closeup", "single-object-void", "vertical-descent", "single-organic-hero", "match-cut", "match", "Sealed in 2019",
  "From above a brass stamp presses 2019 into the oxblood wax on the cap, and a sealed envelope slides in under the stand"),
 (5, 5, "map-territory", "extreme-wide", "overhead", "tundra-map", "top-down-map", "map-territory", "vertical-rise", "landscape-as-subject", "map-travel", "travel", "One square",
  "From above, the true outline of Alaska drawn across the tundra lifts one small square out of its Interior, and a single TODAY token stands on it"),
 (6, 6, "data-panel", "wide", "low", "token-stack", "low-angle-heroic", "fullbleed-split", "vertical-rise", "multiplicity-swarm", "graphic-match", "build", "The stack",
  "Low beside the lifted square two tokens and a sixth slam down, a dashed tower rises to nearly seven, and a shorter WORLD stack slides in beside it"),
 (7, 8, "wide-establish", "extreme-wide", "eye", "spruce-ledger", "eye-level-immersive", "stacked-layers", "assemble-build", "multiplicity-swarm", "hard-cut", "travel", "Fire country",
  "In black spruce under the anvil ten ledger posts rise with nearly full bars, then the view pulls up over the true map as 2022's burned area darkens"),
 (8, 9, "subject-portrait", "medium", "eye", "storm-ridge", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "hard-cut", "carry", "Only lightning",
  "The glass turns its back on the ledger as THE STUDY DIDN'T MODEL FIRE stamps the easel, and a bolt touches one far spruce tip as a single spark while the raven ducks"),
 (9, 10, "push-detail", "close", "eye", "quote-easel", "macro-closeup", "single-object-void", "push-in-only", "single-organic-hero", "push-in", "carry", "Surprised",
  "Krause's surprise types out on a quote card and the glass blushes ember from the base up"),
 (10, 11, "data-panel", "medium", "eye", "dial-bench", "exploded-diagram", "hud-instrument-frame", "radial-emanate", "data-as-subject", "whip-pan", "build", "The dial",
  "On the brass bench a sensitivity dial runs backward over a sepia 1900s strip to 12, an EARLIER STUDIES band slides in from 8 to 17, then the needle swings hard past it to 30 and the wax seal bulges"),
 (11, 13, "two-up", "medium", "eye", "release-easel", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "structure-as-subject", "hard-cut", "carry", "Different math",
  "A press-release sheet drops onto the easel with one sentence underlined and a QUITE A LARGE UNCERTAINTY plate swings on chains"),
 (12, 14, "wide-establish", "wide", "eye", "satellite-track", "eye-level-immersive", "grid-modular", "horizontal-traverse", "multiplicity-swarm", "mask-wipe", "build", "The twist",
  "The envelope trembles, then on a satellite-data race track a sleepy wooden AVERAGE ruler wins while unlabelled model saplings stall, the storm glass watching from outside the rail"),
 (13, 15, "push-detail", "close", "eye", "glass-cap", "macro-closeup", "centered-hero-lowerthird", "radial-emanate", "single-organic-hero", "match-cut", "match", "The advice",
  "The envelope tears open, a card reading TEST OUTSIDE THE TRAINING DATA rises, and the wax seal is stamped over as air hisses under the cap"),
 (14, 16, "subject-portrait", "medium", "low", "storm-ridge", "low-angle-heroic", "centered-hero-lowerthird", "vertical-rise", "single-organic-hero", "hard-cut", "carry", "In fairness",
  "Two rosette ribbons are pinned on the glass's stand for beating a regression and three existing formulas"),
 (15, 17, "data-panel", "wide", "eye", "token-stack", "eye-level-immersive", "fullbleed-split", "vertical-descent", "multiplicity-swarm", "graphic-match", "build", "A range",
  "A brass caliper brackets the whole stack from TODAY to the dashed top, its low jaw glows at two and a sixth, then the glass lifts its cap a crack toward weather rolling over the ridge"),
 (16, 19, "map-territory", "extreme-wide", "low", "june-storm", "low-angle-heroic", "stacked-layers", "radial-emanate", "landscape-as-subject", "pull-out", "travel", "Who runs it",
  "A June wall of cloud rains lemon bolts over Southwest Alaska on the true map, then the glass stands with its cap half lifted in the storm light as the raven hops onto the envelope and leans in"),
]

AMBIENT = {1: "wind in the sedge, the anvil grumbling", 2: "wind, a far rumble", 3: "a brass hum, trickling", 4: "wind, a far rumble", 5: "high wind",
           6: "wind, a far rumble", 7: "wind in the spruce, rumble", 8: "wind in the sedge", 9: "wind, the easel creaking", 10: "a brass hum, wind",
           11: "wind, paper", 12: "wind over the track", 13: "wind, a far rumble", 14: "wind in the sedge", 15: "wind, rumble", 16: "storm wind and rain"}
CENTER = {1: "the glass at x560 y1000", 2: "the glass and easel at x540 y1000", 3: "the tap cutaway at x540 y960", 4: "the cap at x540 y900",
          5: "the map square at x540 y960", 6: "the stack at x560 y1000", 7: "the ledger posts at x540 y1000", 8: "the glass at x540 y1020",
          9: "the quote card at x540 y940", 10: "the dial at x540 y940", 11: "the easel at x540 y980", 12: "the track at x540 y1000",
          13: "the cap and card at x540 y920", 14: "the glass at x540 y1000", 15: "the stack and caliper at x560 y980", 16: "the glass at x560 y1020"}
HERO = {
 1: ("storm glass + anvil cloud + bolt + strike-token stack + raven", "55% glass and bolt, 30% stack, 15% sky"),
 2: ("storm glass + brass easel + journal sheet + name card + label tag", "50% glass, 35% easel, 15% card"),
 3: ("brass stand cutaway + six taps + six weather instruments + grid tile + envelope", "55% taps, 25% glass base, 20% tile and envelope"),
 4: ("glass cap + wax seal + brass stamp", "65% seal and cap, 35% stamp"),
 5: ("true Alaska outline + lifted map square + TODAY token", "55% outline, 30% square, 15% token"),
 6: ("map square + token stack + dashed tower + WORLD stack", "60% stack, 25% square, 15% world stack"),
 7: ("black spruce + ten ledger posts + true map with 2022 hatch", "50% posts, 30% spruce, 20% map"),
 8: ("storm glass + easel stamp + far spruce + bolt + raven", "50% glass, 30% stamp, 20% spark"),
 9: ("quote card on easel + storm glass blushing", "55% card, 45% glass"),
 10: ("sensitivity dial + 1900s strip + earlier studies band + wax seal", "60% dial, 25% band, 15% seal"),
 11: ("press-release sheet + brass pointer + quote plate on chains + easel", "50% sheet, 30% plate, 20% easel"),
 12: ("satellite race track + sleepy ruler + model saplings + storm glass at the rail + envelope", "45% ruler and saplings, 35% track, 20% glass"),
 13: ("envelope + rising card + wax seal + glass cap", "45% card, 35% seal, 20% envelope"),
 14: ("storm glass + two rosette ribbons + brass stand", "60% glass, 40% ribbons"),
 15: ("token stack + caliper + storm glass + ridge weather", "50% stack and caliper, 35% glass, 15% weather"),
 16: ("June storm wall + bolts + true map + storm glass + raven + envelope", "45% storm, 35% glass, 20% raven"),
}
PARTS = {i: 44 for i in range(1, 17)}
KICKS = (1, 25, 37)
CAMERA = {1: "craneDown+dollyThrough", 2: "truckAcross", 3: "dollyThrough", 4: "craneDown", 5: "craneDown", 6: "riseWith", 7: "truckAcross", 8: "dollyThrough",
          9: "dollyThrough", 10: "static:the needle is the move", 11: "truckAcross", 12: "truckAcross", 13: "craneDown", 14: "riseWith", 15: "riseWith", 16: "orbitReveal"}

PALETTE = ("plum #2E2440 dusk to a lilac-mauve #5B5874 thunderhead, golden apricot #F2A65A midnight light banding below the anvil, sedge olive #5E6B34, taiga conifers #1D2A22, "
           "fireweed magenta #C44C82, sea-glass #CFE4E0 vial on brass #B98A3A, lemon #FFE45C reserved for lightning, oxblood #7E2630 reserved for the wax seal, aubergine outlines #1A1424")


def BOARD_HEAD(b_at, end, ad, tr):
    return {
        "run_date": "2026-11-27", "slug": "trained-on-2019", "title": "Trained on 2019",
        "concept": ("A study in Earth's Future (November 24th) by Andreas Krause's team at the Technical University of Munich trained an XGBoost machine learning model on lightning and weather observations from one year, 2019, "
                    "six everyday weather readings and where ground strikes landed on a half-degree grid. On today's climate most of Alaska got under one strike per square kilometer a year. By 2100 under high emissions Alaska could get 116 to 594 percent more, "
                    "the world's land 76 to 140 percent. Lightning fires burned at least 93 percent of Alaska's wildfire acres every year for a decade, but the study didn't model fire. Krause was quite surprised the projections were so high. "
                    "Run backward the model estimated about 12 percent more lightning per degree; earlier studies projected 8 to 17; run forward its own 12 could nearly triple to 30, and the release says earlier studies differ mostly in math. "
                    "The twist: a month earlier Krause and Anja Rammig posted a preprint in which a simple average beat the machine learning lightning models it tested, and advised testing models outside their training conditions. "
                    "In fairness the paper's model beat a regression and three existing formulas. Read it as a range that waits on that test. Drawn as a faced storm glass sealed with 2019 wax, strike tokens stacking on one map square, a sensitivity dial, a sleepy ruler that wins, and an envelope that waits under the glass until the test card rises out of it."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "low-angle-heroic", "motion_vector": "vertical-rise", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "cartoon-exterior-storm", "palette": PALETTE, "camera_strategy": "ridge-low-and-craned-map",
                        "light_story": "warm golden midnight sun under an anvil",
                        "metaphor": "a sealed storm glass that learned the sky from one year, stacking strike tokens into a range, waiting on a test in weather it never saw"},
        "signature_shot": 1,
        "palette": PALETTE,
        "divergence_note": ("The last three films: celadon hospital tile under a bone lightbox key with a round orchid alert pulse (11-26), a hard noon sun on bone snow at a rail fork with a faceless switch stand (11-25), flat July overcast on olive tundra with a faced Pi board (11-24). "
                            "This film is outdoors on a June night under a thunderhead: plum and slate with an ember band, and its only saturated accent is lemon for lightning. Its hero is a faced glass instrument (a vertical capsule on brass), not a pulse, a tool or a board. "
                            "Honest overlaps: a true Alaska map seen from above in two shots (11-26 and 11-24 used maps), a brass needle dial (11-24 used gauges), and black spruce from the shelf (11-25)."),
        "treatment": {"title": "Trained on 2019", "summary": ad["treatment"], "judge_reasoning": tr[2] if len(tr) > 2 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "A plum sky over a sedge ridge, a sealed storm glass on a brass stand, and at 0.2 s a lemon bolt drops out of the anvil onto its cap while its crystals branch",
                 "headline": "BY 2100 · HIGH EMISSIONS", "motion_by_s": 0.2,
                 "loopback": "Frame 1 is the bolt hitting the sealed glass on the ridge; the last shot stands the same glass on a ridge in storm light with its cap half lifted and the opened envelope at its feet."},
        "open_loop": {"plant_t": b_at(10), "pay_t": b_at(31), "plant_glow_s": 0.4, "plant_sfx": "slide", "what": "What's in the envelope from two of the same authors? Planted as a sealed parchment envelope dated OCTOBER 17TH sliding under the glass's stand; paid when it tears open and the card TEST OUTSIDE THE TRAINING DATA rises out of it."},
        "open_loop_2": {"plant_t": b_at(20), "pay_t": b_at(27), "what": "Why so high? Planted as Krause's surprise typing out and the glass blushing; paid when the press-release sheet's underlined sentence says earlier studies differ from this one mostly in math."},
        "throughline": {"object": "the oxblood wax seal on the storm glass's cap", "lands_in_button": "the seal restamped TEST OUTSIDE with the cap half lifted in June storm light",
                        "states": [
                            {"at_s": b_at(1), "state": "S0 a plain oxblood seal on the cap as the first bolt hits"},
                            {"at_s": b_at(9), "state": "S1 pressed with 2019"},
                            {"at_s": b_at(14), "state": "S2 glowing as the tokens pile up beside the glass"},
                            {"at_s": b_at(21), "state": "S2b the seal warms ember with the glass's blush at Krause's surprise"},
                            {"at_s": b_at(26), "state": "S3 bulging and weeping wax as the forward run swings past the earlier studies"},
                            {"at_s": b_at(32), "state": "S4 stamped over TEST OUTSIDE with a crack of air under the cap"},
                            {"at_s": b_at(38), "state": "S5 the cap half lifted in storm light, the test not yet run"}]},
        "reveals": [
            {"t": b_at(14), "type": "build-on", "what": "the dashed tower climbs to nearly seven tokens over the lone TODAY token", "hold_s": 0.7},
            {"t": b_at(17), "type": "scale-pullback", "what": "the view pulls up over the true map as 2022's burned area darkens", "hold_s": 0.8},
            {"t": b_at(25), "type": "morph-to-chart", "what": "the needle swings past the EARLIER STUDIES band to 30", "hold_s": 0.6},
            {"t": b_at(34), "type": "build-on", "what": "a caliper brackets the whole stack from TODAY to the dashed top", "hold_s": 0.7}],
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
