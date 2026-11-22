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
NIX = "Nix, a lichen-chartreuse felt canary holding a NO card in its wing"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "thunk", "a soot-charcoal lump of coal refuse", "drops and thunks into an empty glass jar on a lab bench under a warm lamp, a big window onto the snowy Chugach behind", "startled", "SAYS NO · FAST", "the jar rings", ""),
 (2, 0, W("job"), "snap", NIX, "snaps its head round to the jar with an overshoot and settles", "alert", "ONE JOB", "the head snaps", ""),
 (3, 0, W("No"), "flip", "Nix's NO card", "flips up in its wing with a squash and a settle", "steady", "NO", "the card flips", ""),
 (4, 1, 0.0, "step", "a faceless Brandon Briggs with a boxed name tag", "leans in at the window bench with a big brass magnifier over a tray of rocks", "curious", "BRANDON BRIGGS · UAA BIOLOGIST", "the magnifier swings", ""),
 (5, 1, W("not"), "ping", "the magnifier lens", "sweeps the tray and lilac specks flicker in every rock, one landing on Nix's beak", "surprised", "\"THE RARE EARTHS ARE NOT RARE\" · BRIGGS", "the specks glint", ""),
 (6, 2, 0.0, "whirr", "a tiny motor and a toy wind turbine on the sill", "spin up as lilac specks fly into their magnets", "busy", "MAGNETS · MOTORS · WIND TURBINES", "the rotor spins", ""),
 (7, 2, W("Concentrating"), "rustle", "the lilac specks", "scatter thin across the whole tray while Nix squints after them", "puzzled", "SPREAD THIN · HARD TO CONCENTRATE", "the specks scatter", ""),
 (8, 3, 0.0, "paper", "a paper staircase", "unrolls out of the window and climbs the Chugach face, flight after flight", "daunting", "CAN TAKE 200 STEPS · PER BRIGGS", "the paper unrolls", ""),
 (9, 3, W("acids"), "hiss", "acid, heat and solvent drums", "shake on the bottom steps as steam pours over them", "ominous", "ACIDS · HEAT · SOLVENTS", "the drums steam", ""),
 (10, 3, W("hundred"), "thud", "a tiny hard-hatted microbe climber", "slides back down and drops onto a low step, mopping its brow", "tired", "200 STEPS", "the climber slumps", ""),
 (11, 4, 0.0, "bloom", "the microbe crew in tiny hard hats", "lifts the bench flask overhead and it blooms lilac", "proud", "WORKED BEFORE · IN THE LAB", "the flask glows", ""),
 (12, 5, 0.0, "rumble", "a cobalt wall", "rises out of the floor behind the bench block by block until it blots out the window", "looming", "NOT YET SCALED · NOT YET VIABLE", "the wall rises", "rehook: a cobalt wall rises behind the glowing flask and blots out the window"),
 (13, 5, W("wall"), "thump", NIX, "tilts back to follow the wall up and its NO card tips down", "worried", "THE WALL", "the card droops", ""),
 (14, 6, 0.0, "stamp", "an NSF award card", "stamps down on the bench beside the flask", "bright", "NSF · $6M PROJECT · LED BY UAA", "the card lands", ""),
 (15, 6, W("Briggs"), "clip", "three partner pins", "snap onto the award board one after another", "bright", "UAF · MONTANA TECH · WYOMING", "the chips clip on", ""),
 (16, 7, 0.0, "whoosh", "a cutaway into the flask", "opens on crumbs of coal refuse as the microbe crew swims in", "busy", "MICROBES · RARE EARTHS FROM COAL REFUSE", "the crew swims in", ""),
 (17, 7, W("waste"), "pop", "the microbes", "grab scattered lilac specks and squeeze them into one bright cluster", "proud", "COAL REFUSE · WASTE FROM COAL PROCESSING", "the cluster pops", ""),
 (18, 8, 0.0, "slide", "a small step stool tagged GOAL", "slides in at the foot of the 200 paper steps", "hopeful", "GOAL · \"FOUR OR FIVE\" STEPS", "the stool slides in", ""),
 (19, 9, 0.0, "swing", "a faceless Masoumeh Heidari Kapourchali with a boxed name tag", "hangs an empty bird feeder marked DATA by the window", "steady", "MASOUMEH HEIDARI KAPOURCHALI · UAA ENGINEERING", "the feeder swings", ""),
 (20, 9, W("model"), "flap", NIX, "glides down and lands on the bench among four dials", "alert", "A DEEP LEARNING MODEL · DATA FEEDER EMPTY", "the wings flap", ""),
 (21, 10, 0.0, "tick", "four bench dials", "pop up one by one with their needles swinging", "busy", "TEMPERATURE · ACIDITY · SALINITY · OXYGEN", "the needles swing", ""),
 (22, 10, W("oxygen"), "clink", NIX, "pops on four tiny monocles and peers at each dial in turn", "focused", "WILL READ EACH REACTOR", "the monocles clink", ""),
 (23, 11, 0.0, "buzz", "the OXYGEN dial", "dips into the red as the flask's foam starts to boil over", "worried", "\"WHEN THAT REACTOR'S GOING TO FAIL\" · BRIGGS", "the foam rises", "rehook: the OXYGEN needle drops into the red and the flask foams over"),
 (24, 11, W("fix"), "click", NIX, "flips its card to FIX and a crew microbe spins a valve so the foam settles", "relieved", "FLAG · THEN FIX · PER BRIGGS", "the foam settles", ""),
 (25, 12, 0.0, "page", "month pages", "tear off a wall calendar and scatter across the bench", "frantic", "MONTHS, IF NOT YEARS · PER BRIGGS", "the pages blow", ""),
 (26, 12, W("feedstock"), "tear", "a feedstock jar", "slides to Nix, who flips NO before it stops, and a whole year tears off the calendar", "smug", "COULD RULE OUT A FEEDSTOCK FAST", "the year tears off", "rehook: Nix flips NO before the jar stops and a whole year tears off the calendar"),
 (27, 13, 0.0, "swoosh", "a fat arrow", "rises up the face of the cobalt wall from the glowing flask", "hopeful", "SPEED THE SCALE-UP · PER BRIGGS", "the arrow shoots up", ""),
 (28, 14, 0.0, "whoosh", "the camera", "dollies off the bench through a steel door onto a cold plant floor where a ghost pilot tank stands", "uneasy", "DOE-FUNDED PILOT · DIFFERENT METHOD · 2023", "the door swings", ""),
 (29, 14, W("scenario"), "stamp", "the pilot's ledger", "flips page after page, every row stamped red", "grim", "EVERY SCENARIO IN THE RED · DOE-FUNDED PILOT", "the stamps land", ""),
 (30, 15, 0.0, "slide", "two recovery bars", "rise side by side, the PILOT bar at 10 blocks and the LAB bar 3 of 10 blocks taller", "uneasy", "LAB RAN ABOUT 30% HIGHER THAN THE PILOT", "the bars rise", ""),
 (31, 15, W("pilot"), "thud", "the flask Nix rode in on", "lands beside the PILOT bar and Nix turns from one bar to the other", "deflated", "ONE FEEDSTOCK · LIGNITE", "the flask sets down", ""),
 (32, 16, 0.0, "creak", "a tiny bench reactor", "rolls over asleep in a rocking bassinet under a spinning mobile of lilac specks", "sleepy", "\"STILL IN THEIR INFANCY\" · 2021 REVIEW", "the bassinet rocks", ""),
 (33, 17, 0.0, "drip", "three seeds", "drop into the DATA feeder and Nix pecks at the near-empty tray", "hungry", "DATA · THE USUAL LIMIT · 2021 REVIEW", "the seeds drop", ""),
 (34, 18, 0.0, "stamp", "a rubber stamp", "thuds onto a blank results card on the bench", "plain", "NO RESULTS YET · PLANNED WORK", "the stamp lands", ""),
 (35, 19, 0.0, "flap", NIX, "flies to the foot of the cobalt wall and plants a small pennant at its base", "steady", "AIMED AT THE WALL", "the pennant plants", "rehook: Nix flies to the wall's foot and plants a small pennant"),
 (36, 19, W("aimed", 2), "swell", "the camera", "tilts slowly from the glowing flask up a dashed cobalt plant-scale column past spruce to the Chugach at dusk", "awed", "FULL SIZE", "the column climbs", ""),
 (37, 20, 0.0, "scribble", "a stick of chalk", "writes AUGUST 2030 on the wall above the pennant", "plain", "AWARD RUNS TO AUGUST 2030", "the chalk scratches", ""),
 (38, 20, W("score"), "tick", "the GOAL step stool", "lights at the wall's foot beside the flask's unmarked fill line", "hopeful", "THE SCORE · \"FOUR OR FIVE\" STEPS", "the stool lights", ""),
 (39, 21, 0.0, "chime", NIX, "is back on the window bench and flips its NO card as the flask on the sill takes an AUGUST 2030 tag", "wry", "\"THE RARE EARTHS ARE NOT RARE\" · BRIGGS", "the tag swings", ""),
 (40, 21, W("holds"), "thunk", "a fresh lump of coal refuse", "drops into the empty bench jar, matching the open", "startled", "AN EARLY NO THAT HOLDS UP", "the jar rings", ""),
 (41, 1, W("everywhere"), "glass", "one lilac speck", "bounces off the tray and lands on Nix's beak, and Nix goes cross-eyed at it", "surprised", "FOUND EVERYWHERE · PER BRIGGS", "Nix goes cross-eyed", ""),
 (42, 14, W("coal"), "clank", "the ghost pilot tank", "flickers up to full height in dashed cobalt as its stencil plate swings", "uneasy", "A DIFFERENT METHOD", "the plate swings", ""),
 (43, 20, W("steps"), "swing", "the blank tag on the flask's neck", "swings in the dusk draft beside the unmarked fill line", "quiet", "AT FULL SIZE", "the tag swings", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 50)}
PLATE_AT.update({1: "lower-third", 14: "lower-third", 28: "lower-third"})
CLAIM_MAP = {1: ["narration"], 2: ["narration"], 3: ["narration"], 4: ["c1"], 5: ["c2"], 6: ["c4"], 7: ["c3"], 8: ["c5"], 9: ["c5"], 10: ["c5"],
             11: ["c32"], 12: ["c33"], 13: ["c33"], 14: ["c6"], 15: ["c7"], 16: ["c8"], 17: ["c9"], 18: ["c12"], 19: ["c15"], 20: ["c15"],
             21: ["c14"], 22: ["c14"], 23: ["c16"], 24: ["c17"], 25: ["c34"], 26: ["c34"], 27: ["c25"], 28: ["c22"], 29: ["c22"], 30: ["c23"],
             31: ["c23"], 32: ["c24"], 33: ["c26"], 34: ["c28"], 35: ["narration"], 36: ["narration"], 37: ["c27"], 38: ["c12"], 39: ["c2"], 40: ["narration"], 41: ["c2"], 42: ["c22"], 43: ["c12"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "push-detail", "close", "eye", "bench-jar", "macro-closeup", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "", "The jar", "A lump of coal refuse thunks into an empty bench jar at a window onto the Chugach, Nix snaps round and flips NO"),
 (2, 1, "two-up", "medium", "eye", "window-bench", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "instrument-as-subject", "match-action", "build", "Not rare", "A faceless Briggs's magnifier finds lilac specks in every rock, the specks fly into a motor and a turbine, then scatter thin"),
 (3, 3, "wide-establish", "extreme-wide", "low", "window-range", "eye-level-immersive", "stacked-layers", "vertical-rise", "structure-as-subject", "push-in", "build", "Two hundred steps", "A paper staircase unrolls out the window and climbs the Chugach past acid, heat and solvent drums while a tiny microbe climber gives up"),
 (4, 4, "subject-portrait", "medium", "low", "bench", "macro-closeup", "centered-hero-lowerthird", "vertical-rise", "multiplicity-swarm", "hard-cut", "build", "The wall", "The microbe crew hoists the flask glowing lilac and a cobalt wall rises behind it until it blots out the window"),
 (5, 6, "data-panel", "close", "eye", "flask-cutaway", "cross-section-cutaway", "single-object-void", "assemble-build", "multiplicity-swarm", "morph", "build", "Inside the flask", "An NSF card stamps down with three partner chips, then a cutaway shows the microbes squeezing scattered specks into one cluster and a GOAL step stool slides in"),
 (6, 9, "two-up", "medium", "eye", "bench-dials", "eye-level-immersive", "grid-modular", "assemble-build", "instrument-as-subject", "match-action", "carry", "The canary", "A faceless Heidari Kapourchali hangs an empty DATA feeder and Nix lands among four dials in four monocles"),
 (7, 11, "push-detail", "close", "eye", "reactor", "macro-closeup", "hud-instrument-frame", "push-in-only", "instrument-as-subject", "push-in", "carry", "Flag then fix", "The oxygen dial dips red as a reactor foams, Nix flags it and flips to FIX, and the foam settles"),
 (8, 12, "wide-establish", "wide", "eye", "bench-calendar", "eye-level-immersive", "stacked-layers", "radial-emanate", "data-as-subject", "whip-pan", "build", "The fast no", "Calendar months blow past, a feedstock jar gets an instant NO, a year tears off and an arrow shoots up the wall"),
 (9, 14, "wide-establish", "extreme-wide", "low", "plant-floor", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "pull-out", "travel", "The pilot", "The camera dollies to a cold plant floor and a ghost DOE-funded pilot whose ledger goes red in every scenario"),
 (10, 15, "data-panel", "medium", "eye", "plant-floor", "exploded-diagram", "fullbleed-split", "vertical-descent", "data-as-subject", "carried-element", "carry", "Lab and pilot", "LAB and PILOT recovery bars rise at 13 blocks to 10 and the flask sets down beside the pilot bar"),
 (11, 16, "subject-portrait", "close", "eye", "bench-corner", "macro-closeup", "single-object-void", "push-in-only", "instrument-as-subject", "match-cut", "match", "Infancy", "A reactor sleeps in a bassinet, three seeds drop into the DATA feeder, and NO RESULTS YET stamps a blank card"),
 (12, 19, "wide-establish", "extreme-wide", "low", "wall-foot", "eye-level-immersive", "stacked-layers", "vertical-rise", "landscape-as-subject", "carried-element", "carry", "Aimed at the wall", "Nix plants a pennant at the wall's foot, the camera tilts up a dashed plant-scale column to the Chugach at dusk, chalk writes AUGUST 2030"),
 (13, 21, "wide-establish", "wide", "eye", "window-bench", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "graphic-match", "match", "The next lump", "Back at the window bench Nix flips its card, the flask on the sill takes an AUGUST 2030 tag and a fresh lump thunks into the jar"),
]

AMBIENT = {1: "a lab room hum, a fridge compressor", 2: "a lab room hum, wind at the window", 3: "wind on the range, paper flapping", 4: "a lab room hum, a low rumble",
           5: "bubbling liquid, a lab hum", 6: "a lab room hum, wind at the window", 7: "bubbling and a dial buzz", 8: "a lab room hum, paper rustle",
           9: "a big cold hall, a ventilation drone", 10: "a big cold hall", 11: "a quiet lab at night, a clock", 12: "wind at dusk, a far hum", 13: "a lab room hum, wind at the window"}
CENTER = {1: "the jar and Nix at x540 y1080", 2: "the magnifier and the rock tray at x540 y1040", 3: "the staircase and the window at x540 y860", 4: "the flask and the wall at x540 y1000",
          5: "the flask cutaway at x540 y980", 6: "Nix and the dials at x540 y1060", 7: "the oxygen dial and the flask at x560 y1000", 8: "the calendar, the jar and Nix at x540 y1020",
          9: "the pilot tank and the ledger at x540 y980", 10: "the two bars and the flask at x540 y1000", 11: "the bassinet and the feeder at x540 y1040", 12: "the wall, the pennant and Nix at x540 y1120",
          13: "Nix, the jar and the sill flask at x540 y1060"}
HERO = {
 1: ("Nix + refuse lump + bench jar + window onto the Chugach", "45% Nix and jar, 30% window and range, 25% bench"),
 2: ("faceless Briggs + magnifier + rock tray + motor + turbine", "40% magnifier and tray, 30% Briggs, 30% sill"),
 3: ("paper staircase + drums + microbe climber + Chugach", "50% staircase, 30% range, 20% drums"),
 4: ("microbe crew + glowing flask + cobalt wall + Nix", "40% flask and crew, 40% wall, 20% Nix"),
 5: ("NSF card + partner chips + flask cutaway + microbes + specks + GOAL stool", "50% cutaway, 30% card, 20% stool"),
 6: ("Heidari Kapourchali + DATA feeder + Nix + four dials", "40% Nix and dials, 35% figure, 25% feeder"),
 7: ("oxygen dial + foaming flask + Nix + FIX card + valve", "45% dial, 35% flask, 20% Nix"),
 8: ("calendar + feedstock jar + Nix + arrow + wall", "40% calendar, 35% Nix and jar, 25% wall"),
 9: ("ghost pilot tank + ledger + plant floor + door", "45% tank, 35% ledger, 20% floor"),
 10: ("LAB bar + PILOT bar + flask + Nix", "50% bars, 30% flask, 20% Nix"),
 11: ("bassinet reactor + DATA feeder + seeds + stamp + results card", "40% bassinet, 35% feeder, 25% card"),
 12: ("cobalt wall + pennant + Nix + dashed column + Chugach dusk", "40% wall, 35% column and range, 25% Nix"),
 13: ("Nix + jar + sill flask + tag + window", "40% Nix and jar, 30% flask, 30% window"),
}
PARTS = {1: 52, 2: 46, 3: 50, 4: 52, 5: 54, 6: 50, 7: 46, 8: 48, 9: 44, 10: 40, 11: 44, 12: 54, 13: 50}
KICKS = (12, 29)
CAMERA = {1: "dollyThrough", 2: "truckAcross", 3: "riseWith", 4: "riseWith", 5: "dollyThrough", 6: "truckAcross", 7: "dollyThrough",
          8: "truckAcross", 9: "dollyThrough", 10: "craneDown", 11: "dollyThrough", 12: "riseWith", 13: "dollyThrough"}

PALETTE = ("a warm amber desk glow #FFC870 against a violet blue-hour window #2C3566 onto the Chugach, neodymium lilac #B48CE0 held for every speck, "
           "a bright lichen-chartreuse felt canary #B8D433, a cobalt scale wall #2F5DB8, chalk countertops #EEF0F2 and soot charcoal coal refuse #2B2A30")


def BOARD_HEAD(b_at, end, ad, tr):
    return {
        "run_date": "2026-11-22", "slug": "the-bird-that-says-no", "title": "The Bird That Says No",
        "concept": ("Brandon Briggs, a UAA biologist, says the rare earths are not rare; the hard part is concentrating them, which he says can take acids, heat, solvents and 200 steps. "
                    "His lab already got microbes to pull rare earths from coal in the lab but it never scaled to commercial viability. The NSF is funding a $6M project led by UAA, with UAF, Montana Technological University and Wyoming, to use microbes on coal refuse, with a goal of four or five steps. "
                    "A deep-learning model led by Masoumeh Heidari Kapourchali will read reactor temperature, acidity, salinity and oxygen, call a failing reactor and a fix, and could rule out a bad feedstock fast instead of months or years, which Briggs says should speed the scale-up. "
                    "The test: a DOE-funded pilot (a different method) lost money on paper in every scenario, its lab recovery ran about 30 percent above the pilot for one feedstock, reviews call the field in its infancy, neural networks are limited by data, and no results are reported yet. "
                    "Drawn as NIX, a felt canary with a NO card, on a blue-hour lab bench under the Chugach, a flask that glows and then meets a cobalt scale wall, and a 200-step paper staircase with a GOAL stool at its foot."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "cross-section-cutaway", "motion_vector": "vertical-rise", "hero_treatment": "single-organic-hero", "layout": "centered-hero-lowerthird",
                        "register": "naturalistic-scene", "palette": PALETTE, "camera_strategy": "rise-reveal",
                        "light_story": "dusk-silhouette",
                        "metaphor": "a coal-mine canary that says no early, a glowing lab flask facing a cobalt scale wall, and 200 paper steps up a mountain with a small goal stool at their foot"},
        "signature_shot": 12,
        "palette": PALETTE,
        "divergence_note": ("The last two films were an orbital night kitchen and walnut courtroom with a faced chat-bubble accordion and an auction tag (11-21), and a persimmon-daylight evidence board with a faced suggestion slip (11-19). "
                            "This film is a blue-hour lab bench under the Chugach with a living hero, a felt canary, and a cutaway into a flask; its motion is a rise (a wall grows, 200 steps climb, the signature tilt climbs a plant-scale column). "
                            "Honest overlaps: October 9th covered this same NSF project with a faced steel tank, an ember power gauge and a coal ash heap at a dusk frost yard; none of that cast, palette or set returns here, and the thesis is the scale wall, not power. A window onto the Chugach also appeared on 11-21 (kitchen at night), answered by a lab at blue hour."),
        "treatment": {"title": "The Bird That Says No", "summary": ad["treatment"], "judge_reasoning": tr[1] if len(tr) > 1 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "A blue-hour lab bench at a big window onto the snowy Chugach, an empty glass jar under a warm lamp, and at 0.3 s a soot-charcoal lump of coal refuse drops and thunks into the jar while a felt canary at its side snaps its head round",
                 "headline": "AN AI THAT SAYS NO · FAST", "motion_by_s": 0.3,
                 "loopback": "Frame 1 is a lump thunking into the empty bench jar as Nix snaps round; the last shot is the same bench and window at dusk, the flask on the sill tagged AUGUST 2030, Nix flipping its card, and a fresh lump thunking into the same empty jar."},
        "open_loop": {"plant_t": b_at(1), "pay_t": b_at(37), "plant_glow_s": 0.4, "plant_sfx": "thunk", "what": "Will this lump ever be worth anything at full size? Planted when the lump thunks into the empty jar beside a blank tag on the flask, carried as the flask glows, meets the wall and loses its fill line, paid when chalk writes AUGUST 2030 on the wall above Nix's pennant, the date the answer is due."},
        "open_loop_2": {"plant_t": b_at(19), "pay_t": b_at(33), "what": "What goes in the empty DATA feeder? Planted when Heidari Kapourchali hangs an empty feeder marked DATA as the model is introduced, kept in view by the dials, paid when only three seeds drop into it and Nix pecks at the near-empty tray, neural networks limited by their data."},
        "throughline": {"object": "the bench flask", "lands_in_button": "the flask on the sill, tagged AUGUST 2030, its fill line unmarked",
                        "states": [
                            {"at_s": b_at(1), "state": "F1 EMPTY, a refuse lump in the jar beside it and a blank tag on its neck"},
                            {"at_s": b_at(11), "state": "F2 GLOWING LILAC, hoisted by the crew, worked before in the lab"},
                            {"at_s": b_at(17), "state": "F3 OPEN IN CUTAWAY, microbes squeezing specks into a cluster"},
                            {"at_s": b_at(23), "state": "F4 FOAMING, the oxygen dial in the red, then settled by the fix"},
                            {"at_s": b_at(31), "state": "F5 SET DOWN beside the PILOT bar, its fill line marked lower"},
                            {"at_s": b_at(36), "state": "F6 AT THE WALL'S FOOT under a dashed plant-scale column"},
                            {"at_s": b_at(39), "state": "F7 ON THE SILL, tagged AUGUST 2030, fill line unmarked"}]},
        "reveals": [
            {"t": b_at(8), "type": "scale-pullback", "what": "the paper staircase unrolls out the window and climbs the whole Chugach face", "hold_s": 0.8},
            {"t": b_at(12), "type": "build-on", "what": "a cobalt wall rises block by block until it blots out the window", "hold_s": 0.6},
            {"t": b_at(17), "type": "build-on", "what": "microbes squeeze scattered specks into one bright cluster", "hold_s": 0.6},
            {"t": b_at(28), "type": "scale-pullback", "what": "the camera dollies out to a cold plant floor and a ghost pilot tank", "hold_s": 0.8},
            {"t": b_at(30), "type": "morph-to-chart", "what": "LAB and PILOT recovery bars rise at 13 blocks to 10", "hold_s": 0.6},
            {"t": b_at(36), "type": "scale-pullback", "what": "the camera tilts from the flask up a dashed plant-scale column to the Chugach at dusk", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.9}, {"line": 4, "offset": 0.0, "level": 1.2}, {"line": 9, "offset": 0.0, "level": 0.8},
            {"line": 12, "offset": 0.0, "level": 1.3}, {"line": 14, "offset": 0.0, "level": 0.7}, {"line": 19, "offset": 0.0, "level": 1.3},
            {"at_s": round(b_at(39) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(39) + 0.5, 3), "level": 1.3},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(39) - 0.5, 3), "riser_at": round(b_at(35) - 1.0, 3), "silence_at": round(b_at(39) - 0.5, 3),
            "payoff_at": b_at(39), "button_pattern": "callback", "interrupt_at": b_at(28), "extra_dips": []},
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
