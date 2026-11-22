#!/usr/bin/env python3
"""2026-11-22 "The Bird That Says No": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1122.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1122.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
NIX = "Nix, a lichen-chartreuse felt canary holding a card in its wing"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "thunk", "a soot-charcoal lump of coal refuse", "drops and thunks into an empty glass jar on a lab bench beside an empty flask with a blank neck tag, a window onto the snowy Chugach behind", "startled", "AN AI BUILT TO SAY NO · FAST", "the jar rings", ""),
 (2, 0, W("canary"), "snap", NIX, "snaps its head round to the jar with an overshoot and settles", "alert", "ONE JOB", "the head snaps", ""),
 (3, 0, W("Say"), "flip", "Nix's card", "swings up edge-on in its wing, NO on one face and OK on the other, turning between them", "curious", "NO? · OK?", "the card turns", ""),
 (4, 1, 0.0, "step", "a faceless Brandon Briggs with a boxed name tag", "steps in at the window bench and his brass magnifier hops rock to rock across a tray, three stops", "curious", "BRANDON BRIGGS · UAA BIOLOGIST", "the magnifier hops", ""),
 (5, 1, W("not"), "tap", "the magnifier lens", "sweeps the tray and lilac specks flicker in every rock, one landing on Nix's beak", "surprised", "\"THE RARE EARTHS ARE NOT RARE\" · BRIGGS", "the specks flicker", ""),
 (6, 1, W("everywhere"), "shimmer", "Briggs", "lifts the magnifier to the window and lilac specks flicker across the whole Chugach face", "awed", "FOUND EVERYWHERE · PER BRIGGS", "the range glints", ""),
 (7, 2, W("magnets"), "whirr", "a tiny motor and a toy wind turbine on the sill behind him", "spin up as lilac specks fly into their magnets", "busy", "MAGNETS · MOTORS · WIND TURBINES", "the rotor spins", ""),
 (8, 2, W("Concentrating"), "rustle", "Briggs", "pinches at one speck and it slips through his gloved fingers while the specks scatter thinner under the lens", "frustrated", "SPREAD THIN · HARD TO CONCENTRATE · PER BRIGGS", "the specks scatter", ""),
 (9, 3, 0.0, "paper", "a paper staircase", "unrolls out of the window and climbs the Chugach face as a step counter runs up the flights", "daunting", "TODAY'S ROUTE · PER BRIGGS", "the paper unrolls", ""),
 (10, 3, W("acids"), "hiss", "acid, heat and solvent drums", "shake on the bottom steps as steam pours over them", "ominous", "ACIDS · HEAT · SOLVENTS", "the drums steam", ""),
 (11, 3, W("hundred"), "thud", "a faceless worker in a hard hat with a drum on a hand truck", "drops onto a low step and mops his brow as the counter lands", "tired", "CAN TAKE 200 STEPS · PER BRIGGS", "the counter lands", ""),
 (12, 4, 0.0, "bloom", "the microbe crew in tiny hard hats", "lifts the empty flask off the bench and carries it toward the jar", "proud", "WORKED BEFORE · IN THE LAB", "the flask blooms", ""),
 (13, 5, 0.0, "rumble", "a cobalt wall", "rises out of the floor behind the bench block by block until it blots out the window", "looming", "NOT YET SCALED · NOT YET VIABLE", "the wall rises", "rehook: a cobalt wall rises behind the glowing flask and blots out the window"),
 (14, 5, W("wall"), "thump", NIX, "tilts back to follow the wall up as the last block seats and its card tips down", "worried", "THE WALL", "the block seats", ""),
 (15, 6, 0.0, "swoosh", "a map table", "slides in with Alaska, Canada between it and the lower 48, as four pins drop in Anchorage, Fairbanks, Montana and Wyoming and a dashed line draws between them, the glowing flask at the table's edge", "bright", "UAA · UAF · MONTANA TECH · WYOMING", "the pins drop", ""),
 (16, 6, W("six"), "punch", "a $6M stamp", "punches down onto the middle of the dashed network, its ring spanning all four pins", "bright", "NSF · $6M · WHOLE PROJECT", "the stamp punches", ""),
 (17, 6, W("Briggs"), "swing", "a small tag", "swings down off the Anchorage pin on a string", "bright", "LED BY BRIGGS, UAA", "the tag swings", ""),
 (18, 7, 0.0, "whoosh", "a cutaway into the glowing flask", "opens as crumbs of coal refuse sink and the microbe crew swims in", "busy", "MICROBES · RARE EARTHS FROM COAL REFUSE", "the crew swims in", ""),
 (19, 7, W("waste"), "pop", "the microbes", "grab scattered lilac specks and squeeze them into one bright cluster", "proud", "COAL REFUSE · WASTE FROM COAL PROCESSING", "the cluster pops", ""),
 (20, 8, 0.0, "slide", "a dashed step stool tagged GOAL", "slides in at the foot of the 200 paper steps, still only an outline", "hopeful", "GOAL · \"FOUR OR FIVE\" STEPS · A HOPE", "the outline slides in", ""),
 (21, 9, 0.0, "flap", NIX, "glides down and lands on the bench among four dark dials in front of the cobalt wall", "alert", "A DEEP LEARNING MODEL · PLANNED", "the wings flap", ""),
 (22, 9, W("led"), "swing", "a faceless Masoumeh Heidari Kapourchali with a boxed name tag", "hangs a frosted feeder tagged DATA on the wall's edge, its fill hidden behind the frost", "steady", "MASOUMEH HEIDARI KAPOURCHALI · UAA ENGINEERING", "the feeder swings", ""),
 (23, 10, W("read"), "click", "Heidari Kapourchali", "runs a wire from the first dial to Nix's perch", "focused", "WILL READ EACH REACTOR", "the wire snaps in", ""),
 (24, 10, W("temperature"), "tick", "the TEMPERATURE dial", "ticks alive as its wire connects", "busy", "TEMPERATURE", "the needle swings", ""),
 (25, 10, W("acidity"), "blip", "the ACIDITY and SALINITY dials", "tick alive one after the other as she connects them", "busy", "ACIDITY · SALINITY", "the needles swing", ""),
 (26, 10, W("oxygen"), "clink", NIX, "swings four tiny monocles down over its eyes as the OXYGEN needle swings alive and she presses the dial once", "focused", "OXYGEN", "the monocles clink", ""),
 (27, 11, 0.0, "buzz", "a row of bench reactors seen from above inside a dashed blueprint frame", "tilts into view as one reactor's oxygen needle turns toward the red and its foam starts to rise", "uneasy", "PLANNED · PER BRIGGS", "the needle drifts", "rehook: from above, one reactor's oxygen needle drifts toward the red inside a PLANNED blueprint frame"),
 (28, 11, W("fail"), "alarm", NIX, "on a rail above the bay raises its card as the foam swells, before it crests", "alert", "WHEN A REACTOR'S GOING TO FAIL · PER BRIGGS", "the card rises", ""),
 (29, 11, W("fix"), "click", "a crew microbe", "spins the reactor's valve as Nix's card turns to FIX and the foam settles below the rim", "relieved", "FLAG · THEN FIX · PER BRIGGS", "the foam settles", ""),
 (30, 12, 0.0, "page", "a wall planner in a corridor seen straight on", "tears off month pages one by one that fly toward camera", "frantic", "MONTHS, IF NOT YEARS · PER BRIGGS", "the pages fly", ""),
 (31, 12, W("flag"), "slam", "a SKIPPED stamp", "slams across the stack of months inside a dashed COULD corner frame as a feedstock jar slides past Nix's wing flipping a NO card at the frame edge, and the torn pages fly back onto the planner", "smug", "COULD QUICKLY FLAG A BAD FEEDSTOCK · PER BRIGGS", "the pages fly back", ""),
 (32, 13, 0.0, "swoosh", "a dashed arrow", "rises up a cobalt stripe on the corridor wall and halts a third of the way up", "hopeful", "SHOULD SPEED THE SCALE-UP · PER BRIGGS", "the arrow halts", ""),
 (33, 14, 0.0, "whoosh", "the camera", "pulls out of the corridor onto a cold street where Nix stands on the sidewalk outside another building, the flask beside it, its glow flickering and recovering in the cold", "uneasy", "OTHERS HIT THAT WALL", "the street opens", ""),
 (34, 14, W("pilot"), "hum", "the other building's window", "lights up on a ghost pilot tank in dashed cobalt as a sign swings over its door", "uneasy", "DOE-FUNDED PILOT · DIFFERENT METHOD · 2023", "the sign swings", ""),
 (35, 14, W("lost"), "stamp", "one red-stamped ledger page", "slaps flat against the inside of the far window as the camera trucks up to the glass, Nix's reflection small in the pane", "grim", "EVERY SCENARIO IN THE RED · DOE-FUNDED PILOT", "the stamps land", ""),
 (36, 15, 0.0, "slide", "a dashed lab beaker and the dashed pilot tank", "slide in side by side as their bars start to rise", "uneasy", "ONE FEEDSTOCK · THE PILOT'S OWN LAB AND PLANT", "the bars start", ""),
 (37, 15, W("thirty"), "hit", "the LAB bar", "rises 3 of 10 blocks taller than the PILOT bar's 10", "uneasy", "LAB RAN ABOUT 30% HIGHER THAN THE PILOT", "the blocks land", ""),
 (38, 16, 0.0, "creak", "the bench lamp", "swings in the draft over a bassinet tagged THE FIELD where a tiny reactor rolls over asleep", "sleepy", "\"STILL IN THEIR INFANCY\" · 2021 REVIEW", "the bassinet rocks", "rehook: a bassinet tagged THE FIELD rocks under a swinging lamp, the whole field still asleep"),
 (39, 17, 0.0, "scratch", "a small reference feeder for neural networks in general", "swings beside the frosted feeder, its needle stopping hard at its own fill line, as a dashed fill line, still to be gathered, draws on the frosted glass and a dashed ? draws on the flask's fill line beside it", "thoughtful", "DATA · THE USUAL LIMIT · 2021 REVIEW", "the line draws", ""),
 (40, 18, 0.0, "thud", "a rubber stamp", "thuds onto a blank results card on the bench", "plain", "NO RESULTS YET · PLANNED WORK", "the stamp lands", ""),
 (41, 19, 0.0, "flap", NIX, "flies to the foot of the cobalt wall in dusk silhouette and lands facing it beside the flask set down there", "steady", "NOT OVER THE WALL", "the wings fold", ""),
 (42, 19, W("at"), "swing", NIX, "turns its card to show a sighting reticle and holds it up to the wall", "steady", "AIMED AT IT", "the card turns", ""),
 (43, 20, 0.0, "scribble", "a stick of chalk", "writes AUGUST 2030 on the wall above Nix", "plain", "AWARD RUNS TO AUGUST 2030", "the chalk scratches", ""),
 (44, 20, W("Four"), "slide", "the dashed GOAL stool", "slides out beside the still-towering 200 paper steps, an outline only", "hopeful", "GOAL · \"FOUR OR FIVE\" STEPS", "the outline slides", ""),
 (45, 20, W("full"), "swell", "the camera", "tilts from the flask at the wall's foot up a dashed cobalt plant-scale column to the Chugach ridge at dusk", "awed", "AT FULL SIZE", "the column climbs", ""),
 (46, 21, 0.0, "chime", "the view from inside the empty jar", "looks up through the glass at Nix holding its card edge-on, 2030? on its face, the flask on the bench edge past its shoulder turning its neck tag to AUGUST 2030", "wry", "\"THE RARE EARTHS ARE NOT RARE\" · BRIGGS", "the card turns", ""),
 (47, 21, W("early"), "thunk", "a fresh lump of coal refuse", "drops into the jar toward camera, matching the open", "startled", "AN EARLY NO THAT HOLDS UP?", "the jar rings", ""),
 (48, 4, W("coal"), "pebble", "the crew", "tips a crumb of refuse from the jar's lump into the flask and the flask blooms lilac", "proud", "MICROBES · COAL · IN THE LAB", "the flask blooms", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 60)}
PLATE_AT.update({1: "lower-third", 15: "lower-third", 33: "lower-third"})
CLAIM_MAP = {1: ["narration"], 2: ["narration"], 3: ["narration"], 4: ["c1"], 5: ["c2"], 6: ["c2"], 7: ["c4"], 8: ["c3"], 9: ["c5"], 10: ["c5"],
             11: ["c5"], 12: ["c32"], 13: ["c33"], 14: ["c33"], 15: ["c7"], 16: ["c6"], 17: ["c6"], 18: ["c8"], 19: ["c9"], 20: ["c12"],
             21: ["c15"], 22: ["c15"], 23: ["c14"], 24: ["c14"], 25: ["c14"], 26: ["c14"], 27: ["c16"], 28: ["c16"], 29: ["c17"], 30: ["c34"],
             31: ["c34"], 32: ["c25"], 33: ["c22"], 34: ["c22"], 35: ["c22"], 36: ["c23"], 37: ["c23"], 38: ["c24"], 39: ["c26"], 40: ["c28"],
             41: ["narration"], 42: ["narration"], 43: ["c27"], 44: ["c12"], 45: ["c12"], 46: ["c2"], 47: ["narration"], 48: ["c32"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "push-detail", "close", "eye", "bench-jar", "macro-closeup", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "", "The jar", "A lump of coal refuse thunks into an empty jar beside an empty flask, Nix snaps round and holds up a card that turns between NO and OK"),
 (2, 1, "two-up", "medium", "eye", "window-bench", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "instrument-as-subject", "match-action", "build", "Not rare", "A faceless Briggs's magnifier finds lilac specks in every rock and across the Chugach, the specks feed a motor and a turbine, and slip through his fingers, spread thin"),
 (3, 3, "wide-establish", "extreme-wide", "low", "window-range", "eye-level-immersive", "stacked-layers", "vertical-rise", "structure-as-subject", "push-in", "build", "Two hundred steps", "A paper staircase unrolls out the window up the Chugach past acid, heat and solvent drums and a worker with a hand truck gives up"),
 (4, 4, "subject-portrait", "medium", "low", "bench", "macro-closeup", "centered-hero-lowerthird", "vertical-rise", "multiplicity-swarm", "hard-cut", "build", "The wall", "The microbe crew lifts the flask glowing lilac and a cobalt wall rises behind it until it blots out the window"),
 (5, 6, "map-territory", "wide", "high", "map-table", "top-down-map", "map-territory", "horizontal-traverse", "landscape-as-subject", "map-travel", "travel", "Four pins", "A map table with Canada between Alaska and the lower 48, a $6M stamp on Anchorage and a dashed line to Fairbanks, Montana and Wyoming"),
 (6, 7, "data-panel", "close", "eye", "flask-cutaway", "cross-section-cutaway", "single-object-void", "assemble-build", "multiplicity-swarm", "morph", "build", "Inside the flask", "A cutaway shows refuse crumbs sinking and the microbes squeezing scattered specks into one bright cluster"),
 (7, 8, "alt-vantage", "wide", "low", "window-range", "eye-level-immersive", "stacked-layers", "push-in-only", "structure-as-subject", "graphic-match", "match", "The goal", "Back at the staircase, a dashed GOAL step stool slides in at its foot, an outline only"),
 (8, 9, "two-up", "medium", "eye", "bench-dials", "eye-level-immersive", "grid-modular", "assemble-build", "instrument-as-subject", "hard-cut", "carry", "The canary", "Nix lands among four dark dials, a faceless Heidari Kapourchali hangs a frosted DATA feeder and wires each dial alive"),
 (9, 11, "data-panel", "medium", "high", "reactor-bay", "top-down-map", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "match-cut", "carry", "Flag then fix", "From above, a row of reactors inside a PLANNED blueprint frame, one foams, Nix raises its card before it crests, a microbe spins the valve"),
 (10, 12, "wide-establish", "wide", "eye", "corridor", "eye-level-immersive", "single-object-void", "radial-emanate", "data-as-subject", "whip-pan", "build", "The fast no", "A corridor planner sheds months, a SKIPPED stamp sends them flying back, and a dashed arrow halts a third of the way up a cobalt stripe"),
 (11, 14, "wide-establish", "extreme-wide", "eye", "street", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "pull-out", "travel", "Across the street", "On a cold street Nix and the dimming flask look across at another building where a dashed ghost pilot's ledger goes red in every scenario"),
 (12, 15, "data-panel", "medium", "eye", "pilot-bars", "exploded-diagram", "fullbleed-split", "vertical-rise", "data-as-subject", "push-in", "carry", "Their lab and plant", "The pilot's own dashed beaker and tank, its LAB bar 3 of 10 blocks taller than its PILOT bar, one feedstock"),
 (13, 16, "subject-portrait", "close", "eye", "bench-night", "macro-closeup", "stacked-layers", "vertical-descent", "instrument-as-subject", "carried-element", "match", "Still early", "Under a swinging lamp a bassinet tagged THE FIELD rocks with a sleeping reactor, a dashed to-be-gathered line draws on the frosted feeder, and NO RESULTS YET stamps a card"),
 (14, 19, "wide-establish", "extreme-wide", "low", "wall-foot", "eye-level-immersive", "stacked-layers", "vertical-rise", "landscape-as-subject", "hard-cut", "carry", "Aimed at it", "In dusk silhouette at the wall's foot Nix aims a reticle card at the wall, chalk writes AUGUST 2030, a dashed GOAL stool and the camera tilts up a plant-scale column to the Chugach"),
 (15, 21, "push-detail", "close", "low", "jar-inside", "macro-closeup", "centered-hero-lowerthird", "vertical-rise", "single-organic-hero", "graphic-match", "match", "The next lump", "From inside the jar, Nix looks down holding its card edge-on, 2030? on its face, as a fresh lump drops in toward camera"),
]

AMBIENT = {1: "a lab room hum, a fridge compressor", 2: "a lab room hum, wind at the window", 3: "wind on the range, paper flapping", 4: "a lab room hum, a low rumble",
           5: "a quiet room, paper", 6: "bubbling liquid, a lab hum", 7: "wind on the range", 8: "a lab room hum against the wall",
           9: "a fume-hood fan, bubbling", 10: "a corridor hum, paper rustle", 11: "a cold street, a far ventilation drone", 12: "a big cold hall",
           13: "a quiet lab at night, a clock", 14: "wind at dusk, a far hum", 15: "a glass hum, room tone"}
CENTER = {1: "the jar, the flask and Nix at x540 y1080", 2: "the magnifier and the rock tray at x540 y1040", 3: "the staircase and the window at x540 y860", 4: "the flask and the wall at x540 y1000",
          5: "the map and the four pins at x540 y960", 6: "the flask cutaway at x540 y980", 7: "the staircase foot and the stool at x540 y1100", 8: "Nix and the dials at x540 y1060",
          9: "the reactor row at x540 y980", 10: "the planner and the stripe at x540 y960", 11: "Nix, the flask and the far window at x540 y1000", 12: "the two bars at x540 y1000",
          13: "the bassinet and the feeders at x540 y1040", 14: "the wall, Nix and the column at x540 y1120", 15: "Nix through the jar mouth at x540 y900"}
HERO = {
 1: ("Nix + refuse lump + jar + empty flask + window onto the Chugach", "45% Nix, jar and flask, 30% window and range, 25% bench"),
 2: ("faceless Briggs + magnifier + rock tray + motor + turbine", "40% magnifier and tray, 30% Briggs, 30% sill"),
 3: ("paper staircase + drums + worker with hand truck + Chugach", "50% staircase, 30% range, 20% drums"),
 4: ("microbe crew + glowing flask + cobalt wall + Nix", "40% flask and crew, 40% wall, 20% Nix"),
 5: ("map table + four pins + $6M stamp + dashed line", "60% map, 25% pins, 15% stamp"),
 6: ("flask cutaway + microbes + specks + refuse crumbs", "60% cutaway, 25% crew, 15% cluster"),
 7: ("staircase foot + dashed GOAL stool", "50% stool, 50% steps"),
 8: ("Nix + four dials + Heidari Kapourchali + frosted DATA feeder", "40% Nix and dials, 35% figure, 25% feeder"),
 9: ("reactor row + blueprint frame + Nix on a rail + valve microbe", "50% reactors, 30% frame, 20% Nix"),
 10: ("corridor planner + month pages + SKIPPED stamp + dashed arrow", "45% planner, 30% pages, 25% arrow"),
 11: ("street + Nix + dimming flask + other building + ghost tank + ledger", "40% far window, 35% Nix and flask, 25% street"),
 12: ("dashed beaker + dashed tank + LAB bar + PILOT bar", "60% bars, 40% vessels"),
 13: ("bassinet reactor + swinging bench lamp + frosted feeder + reference feeder + stamp", "40% bassinet, 35% feeders, 25% card"),
 14: ("cobalt wall + Nix silhouette + reticle card + flask at the wall foot + paper staircase on the Chugach behind + dashed GOAL stool + dashed column + Chugach dusk", "40% wall, 35% column and range, 25% Nix and flask"),
 15: ("jar rim + Nix + edge-on card + falling lump", "50% Nix, 30% jar glass, 20% lump"),
}
PARTS = {1: 52, 2: 46, 3: 50, 4: 52, 5: 44, 6: 54, 7: 30, 8: 50, 9: 46, 10: 44, 11: 48, 12: 40, 13: 46, 14: 54, 15: 40}
KICKS = (13, 35)
CAMERA = {1: "dollyThrough", 2: "truckAcross", 3: "riseWith", 4: "riseWith", 5: "craneDown", 6: "dollyThrough", 7: "static:a graphic-match insert holds the staircase still",
          8: "truckAcross", 9: "craneDown", 10: "static:a flat planner seen straight on", 11: "truckAcross", 12: "static:the caveat chart is locked off",
          13: "truckAcross", 14: "riseWith", 15: "riseWith"}

PALETTE = ("a warm honey-cream glow #FFE2A0 on chalk countertops #EEF0F2, a soft aqua blue-hour window #9FB4C4 deepening to deep teal #24474F over the Chugach, "
           "neodymium lilac #B48CE0 kept for every speck, a bright lichen-chartreuse felt canary #B8D433, a cobalt scale wall #2F5DB8 and soot charcoal coal refuse #2B2A30")


def BOARD_HEAD(b_at, end, ad, tr):
    return {
        "run_date": "2026-11-22", "slug": "the-bird-that-says-no", "title": "The Bird That Says No",
        "concept": ("Brandon Briggs, a UAA biologist, says the rare earths are not rare; the hard part is concentrating them, which he says can take acids, heat, solvents and 200 steps. "
                    "His lab already got microbes to do it with coal in the lab but it never scaled to commercial viability. The NSF is funding a $6M project led by Briggs, with UAF, Montana Technological University and Wyoming, to use microbes on coal refuse, with a goal of four or five steps. "
                    "A deep-learning model led by Masoumeh Heidari Kapourchali will read reactor temperature, acidity, salinity and oxygen, flag a reactor before it fails and a fix, and could quickly flag a bad feedstock instead of months or years, which Briggs says should speed the scale-up. "
                    "The test: a federally funded pilot elsewhere, by a different method, lost money on paper in every scenario, its own lab recovery ran about 30 percent above its pilot plant for one feedstock, reviews call the field in its infancy, neural networks are usually limited by data, and no results are reported yet. "
                    "Drawn as NIX, a felt canary holding a card that turns between NO and OK, through seven worlds: a blue-hour lab bench under the Chugach, a map table, a flask cutaway, a top-down reactor bay inside a PLANNED blueprint frame, a corridor planner, a cold street outside another building's pilot, and a dusk wall where Nix aims a reticle card AT the wall beside a dashed GOAL stool, closing from inside a jar."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "vertical-rise", "hero_treatment": "single-organic-hero", "layout": "centered-hero-lowerthird",
                        "register": "naturalistic-scene", "palette": PALETTE, "camera_strategy": "rise-reveal",
                        "light_story": "dusk-silhouette",
                        "metaphor": "a coal-mine canary that says no early, a glowing lab flask facing a cobalt scale wall, and 200 paper steps up a mountain with a small goal stool at their foot"},
        "signature_shot": 14,
        "palette": PALETTE,
        "divergence_note": ("The last two films were an orbital night kitchen and walnut courtroom with a faced chat-bubble accordion and an auction tag (11-21), and a persimmon-daylight evidence board with a faced suggestion slip (11-19). "
                            "This film moves through seven worlds (a blue-hour lab bench under the Chugach, a map table, a flask cutaway, a top-down reactor bay in a blueprint frame, a corridor planner, a cold street outside another building's pilot, and a dusk wall exterior in silhouette) with a living hero, a felt canary; its motion is a rise (a wall grows, 200 steps climb, an arrow halts a third of the way, the signature tilt climbs a plant-scale column), and it closes looking up from inside a jar instead of returning to the window. "
                            "Honest overlaps: October 9th covered this same NSF project with a faced steel tank, an ember power gauge and a coal ash heap at a dusk frost yard; none of that cast, palette or set returns here, and the thesis is the scale wall, not power. A window onto the Chugach also appeared on 11-21 (kitchen at night), answered by a lab at blue hour."),
        "treatment": {"title": "The Bird That Says No", "summary": ad["treatment"], "judge_reasoning": tr[1] if len(tr) > 1 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "A blue-hour lab bench at a big window onto the snowy Chugach, an empty glass jar and an empty flask with a blank neck tag under a honey-cream lamp, and at 0.3 s a soot-charcoal lump of coal refuse drops and thunks into the jar while a felt canary beside it snaps its head round",
                 "headline": "AN AI BUILT TO SAY NO · FAST", "motion_by_s": 0.3,
                 "loopback": "Frame 1 is a lump thunking into the empty jar as Nix snaps round with a card turning between NO and OK; the last shot looks up from inside that jar at Nix holding the card edge-on, 2030? on its face, as a fresh lump drops in toward camera."},
        "open_loop": {"plant_t": b_at(1), "pay_t": b_at(43), "plant_glow_s": 0.4, "plant_sfx": "thunk", "what": "Will this ever work at full size? Planted with the empty flask's BLANK neck tag beside the jar as the lump lands, carried as the flask glows, meets the wall, dims on the street outside another building's pilot and takes a dashed ? on its fill line, paid when chalk writes AUGUST 2030 on the wall above Nix, the date the answer is due."},
        "open_loop_2": {"plant_t": b_at(22), "pay_t": b_at(39), "what": "How much will it learn from? Planted when Heidari Kapourchali hangs a FROSTED feeder tagged DATA whose fill is hidden, paid when a small reference feeder labelled NEURAL NETWORKS GENERALLY swings beside it and a dashed TO BE GATHERED line draws on the frosted glass: how much the model learns depends on what goes in, and the amount isn't stated."},
        "throughline": {"object": "the bench flask", "lands_in_button": "the flask in the jar-view button, seen past Nix on the bench edge, fill line unmarked, tagged AUGUST 2030",
                        "states": [
                            {"at_s": b_at(1), "state": "F1 EMPTY beside the jar with a blank neck tag"},
                            {"at_s": b_at(48), "state": "F2 GLOWING LILAC, lifted by the crew, worked before in the lab"},
                            {"at_s": b_at(15), "state": "F2b at the map table's edge, glowing, as the four pins drop"},
                            {"at_s": b_at(18), "state": "F3 OPEN IN CUTAWAY, microbes squeezing specks into a cluster"},
                            {"at_s": b_at(27), "state": "F4 one of a row of reactors inside a PLANNED blueprint frame, foam steadied below the rim"},
                            {"at_s": b_at(33), "state": "F5 OUTSIDE on a cold street beside Nix, glow dimming, never inside the other building, fill line blank"},
                            {"at_s": b_at(39), "state": "F6 BACK ON THE NIGHT BENCH with a dashed ? where a scale-up reading would go"},
                            {"at_s": b_at(41), "state": "F7 AT THE WALL'S FOOT in dusk silhouette, fill line unmarked, AUGUST 2030 chalked above"},
                            {"at_s": b_at(46), "state": "F8 on the bench edge past Nix in the jar view, its neck tag now reading AUGUST 2030, fill line unmarked"}]},
        "reveals": [
            {"t": b_at(9), "type": "scale-pullback", "what": "the paper staircase unrolls out the window and climbs the whole Chugach face", "hold_s": 0.8},
            {"t": b_at(13), "type": "build-on", "what": "a cobalt wall rises block by block until it blots out the window", "hold_s": 0.6},
            {"t": b_at(19), "type": "build-on", "what": "microbes squeeze scattered specks into one bright cluster", "hold_s": 0.6},
            {"t": b_at(34), "type": "scale-pullback", "what": "the street opens onto another building where a ghost pilot tank lights up", "hold_s": 0.8},
            {"t": b_at(37), "type": "morph-to-chart", "what": "the pilot's own LAB bar rises 3 of 10 blocks taller than its PILOT bar", "hold_s": 0.6},
            {"t": b_at(45), "type": "scale-pullback", "what": "the camera tilts from the flask up a dashed plant-scale column to the Chugach at dusk", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.9}, {"line": 4, "offset": 0.0, "level": 1.2}, {"line": 9, "offset": 0.0, "level": 0.8},
            {"line": 12, "offset": 0.0, "level": 1.3}, {"line": 14, "offset": 0.0, "level": 0.7}, {"line": 19, "offset": 0.0, "level": 1.3},
            {"at_s": round(b_at(46) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(46) + 0.5, 3), "level": 1.3},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(46) - 0.5, 3), "riser_at": round(b_at(45) - 1.0, 3), "silence_at": round(b_at(46) - 0.5, 3),
            "payoff_at": b_at(46), "button_pattern": "callback", "interrupt_at": b_at(33), "extra_dips": []},
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
    board.update({
        "shots": shots, "beats": beats,
    })
    board["throughline"]["states"].sort(key=lambda x: x["at_s"])
    order = sorted(board["beats"], key=lambda b: (b["at_s"], b["id"]))
    ids = {b["id"]: rank for rank, b in enumerate(order, 1)}
    for b in board["beats"]:
        b["key"] = b["id"]
        b["id"] = ids[b["key"]]
    board["beats"].sort(key=lambda b: b["id"])
    board["_ids"] = ids
    book.raise_if_missing("board_1122 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1122Ids.ts").write_text(
        "// GENERATED by scripts/board_1122.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
