#!/usr/bin/env python3
"""2026-11-23 "Two Runs Out of Nenana": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1123.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1123.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
FLEW = "FLEW, a clear glass sample tube with an oxblood fill and a face on the glass"
STAYED = "STAYED, FLEW's twin sample tube"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "pawstep", "a sepia dog team on a cream map of Alaska laid on the river ice", "runs off the NENANA pin and draws a curving paw trail west toward Nome", "eager", "TWO RUNS · ONE TOWN", "the trail inks out", ""),
 (2, 0, W("first"), "swish", "the sepia paw trail", "runs on along the river country and crosses into the NOME pin", "determined", "ALL THE WAY · NOME", "the trail reaches Nome", ""),
 (3, 0, W("second"), "snap", "a grey drone's shadow", "sweeps in, glances toward an unlit village pin, and closes a scarlet ribbon loop that snaps shut on NENANA", "wistful", "1,000 KM · ONE LOOP", "the loop snaps shut", ""),
 (4, 1, 0.0, "creak", "a sepia print of Nome's roofs in a January night", "fades up with snow drifting across it and a lamp in one window", "worried", "NOME · JANUARY 1925 · DIPHTHERIA", "the snow drifts", ""),
 (5, 2, 0.0, "rumble", "a sepia locomotive", "steams in along the rail and stops at a depot sign reading NENANA, a scarlet ribbon tied to the sign post", "busy", "BY TRAIN TO NENANA", "the smoke rolls", ""),
 (6, 2, W("closest"), "bell", "the depot sign", "swings as the brakes hiss, a dashed line drawn from NENANA toward Nome on a small inset map", "steady", "RAILROAD'S CLOSEST POINT TO NOME", "the sign swings", ""),
 (7, 3, 0.0, "swish", "a sepia dog team with a faceless musher in a plain parka", "runs across the river ice at dusk, the sled runners hissing", "determined", "20 MUSHERS · RELAY", "the team gallops", ""),
 (8, 3, W("six"), "tick", "a mileage counter on a trail marker", "rolls up as the team passes it", "determined", "NENANA TO NOME · 674 MILES · DOG TEAMS", "the counter rolls", ""),
 (9, 4, 0.0, "rattle", "a little sepia airplane engine on a stand", "trembles under icicles as the musher glances at it and snaps the team forward past it", "nervous", "1925 · AN ENGINE AT 40 BELOW?", "the engine coughs", ""),
 (10, 4, W("forty"), "drip", "a sweat drop on the engine", "falls and freezes into an icicle in mid air", "nervous", "NOBODY KNEW · PER UAF SCIENCE FORUM", "the drop freezes", ""),
 (11, 5, 0.0, "hum", "the grey cargo drone at the Nenana runway on an August evening, green spruce and birch, no snow", "rolls out of a hangar as its twin props blur, a scarlet ribbon tied to the hangar door", "steady", "NENANA · AUGUST 19TH", "the props blur", "rehook: the props blur as a drone rolls out onto the same town's runway a century later"),
 (12, 5, W("drone"), "rush", "the cargo drone", "lifts off past the runway lights in silhouette against the apricot sky", "steady", "TAKES OFF", "the gear lifts", ""),
 (13, 6, 0.0, "drone", "the cargo drone seen from above, its twin-engine high-wing shadow", "glides across the green Tanana flats and its shadow crosses the river", "steady", "WINDRACERS ULTRA · TWIN ENGINE", "the shadow crosses", ""),
 (14, 7, 0.0, "click", "a faceless pilot with a boxed name tag at a ground station", "takes the stick as the screen draws a scarlet loop around the NENANA dot", "focused", "FLOWN BY UAF PILOTS · REMOTELY", "the stick tilts", ""),
 (15, 7, W("fly"), "type", "the pilot's hand", "pushes the stick and the scarlet loop trace sweeps around the NENANA dot on the screen", "focused", "UAF DRONE CENTER", "the trace draws", ""),
 (16, 8, 0.0, "pop", FLEW, "pops up out of a rack, buckles on flight goggles and squeaks down into an insulated crate", "eager", "HUMAN BLOOD SAMPLES", "the goggles snap", ""),
 (17, 8, W("agency"), "clunk", "the crate lid", "slams shut on FLEW as its latch clicks", "eager", "SPORTS ANTI-DOPING · INTERNATIONAL TESTING AGENCY", "the lid slams", ""),
 (18, 9, 0.0, "slide", STAYED, "slides onto a fridge shelf behind glass under a KEEP ON GROUND sign and waves a tiny handkerchief", "wistful", "TWO SAMPLES EACH", "the shelf slides", ""),
 (19, 9, W("stay"), "glass", "the fridge door", "swings shut on STAYED as the two tubes look at each other across the hangar", "wistful", "ONE FLEW · ONE STAYED · TO COMPARE", "the door swings", ""),
 (20, 10, 0.0, "tock", "the ground station clock", "spins round as the pilot's hand empties the coffee mug, refills it and empties it again", "tired", "8 HR 47 MIN", "the mug empties", ""),
 (21, 10, W("forty"), "caw", "a raven outside the ground station window", "flies past the window and turns back round", "dizzy", "STILL UP", "the raven circles", ""),
 (22, 11, 0.0, "creak", "the scarlet ribbon on the map on the ice", "un-loops off NENANA and slides along the curving sepia paw trail", "tense", "1,000 KM LOOP · LAID ALONG THE TRAIL", "the ribbon lays along", "rehook: the loop un-loops and lays itself along the 1925 trail"),
 (23, 11, W("twenty", 1), "tick", "the ribbon's frayed end", "creeps a hair forward and stops about nine tenths of the way along, bare sepia trail ahead to NOME", "tense", "ABOUT 621 MILES", "the end trembles", ""),
 (24, 11, W("length"), "pawstep", "the lead sled dog", "runs up and stops nose down at the ribbon's frayed end", "curious", "NENANA TO NOME · 674 MILES", "the dog sniffs", ""),
 (25, 12, 0.0, "crack", "the ribbon", "twangs and snaps back into a loop on NENANA with an overshoot", "wistful", "LANDS WHERE IT STARTED · A TEST LOOP", "the ribbon snaps back", "rehook: the ribbon snaps back into a loop on NENANA"),
 (26, 13, 0.0, "whirr", "a small quadcopter drone", "hovers steady in blowing snow beside the shivering ghost of the 1925 engine", "proud", "SMALL DRONES FLOWN AT 40 BELOW · PER CAHILL", "the rotors spin", ""),
 (27, 13, W("drones"), "thock", "a thermometer stake", "drops to 40 BELOW as the little drone holds its hover", "steady", "SMALL DRONES ONLY · NOT THE ULTRA", "the needle drops", ""),
 (28, 14, 0.0, "boots", "a faceless Cathy Cahill with a boxed name tag", "walks to a table by a cold window and sets FLEW down beside STAYED, both clear glass", "steady", "CATHY CAHILL · UAF DRONE CENTER DIRECTOR", "the tubes clink", ""),
 (29, 14, W("says"), "glass", "Cahill", "lifts both tubes level, one in each hand, as a quote plate hangs from her name, then sets them down", "steady", "\"THE BLOOD COULD SURVIVE\" · CAHILL", "the tubes lift", "rehook: Cahill lifts both tubes level by the cold window"),
 (30, 15, 0.0, "thump", "a small lab results printer", "thumps down on the table between the tubes after Cahill steps away", "uneasy", "THE COMPARISON", "the printer lands", ""),
 (31, 15, W("no"), "buzz", "the printer's output tray", "pushes out nothing while both tubes lean in and tilt toward it", "uneasy", "LAB RESULTS · NOT PUBLISHED", "the tray stays empty", ""),
 (32, 16, 0.0, "flip", "the empty sample crate beside the table", "turns to show NOT TESTED FOR DOPING stamped on its side and the ribbon slides out under the door", "steady", "NOT TESTED FOR DOPING · CLAIM THE TRIP, NOT THE RESULT", "the tag flips", ""),
 (33, 17, 0.0, "door", "a village of ten snow roofs and a clinic with a warm window at dusk", "brightens window by window with no road leading to 8 of 10 roofs", "steady", "82% OF COMMUNITIES OFF THE ROAD SYSTEM · PER THE STATE", "the windows glow", ""),
 (34, 18, 0.0, "swing", "a new strand of the scarlet ribbon on the map on the ice", "pulls off the coil at NENANA and reaches toward the unlit village pin", "hopeful", "A VILLAGE RUN", "the strand reaches", ""),
 (35, 18, W("rules"), "clank", "the strand's tip", "snags on the phosphor edge of a sight bubble that rises round NENANA and strains against it", "frustrated", "FEDERAL RULES · BEYOND LINE OF SIGHT", "the strand strains", "rehook: the ribbon strains against the edge of a sight bubble"),
 (36, 19, 0.0, "whirr", "a dashed phosphor radar dish with one eye, PLANNED hung on it", "rises beside the parked drone on the night runway", "eager", "DETECT AND AVOID RADAR · PLANNED", "the dashes march", ""),
 (37, 19, W("step"), "sizzle", "the dashed radar", "hops toward the drone's wing and passes straight through it like a ghost, still dashed", "shy", "\"A KEY STEP\" · CAHILL", "the radar ghosts through", ""),
 (38, 20, 0.0, "crunch", "a dashed link line from the ground station antenna to the drone", "flickers and breaks, and the dashed radar opens a scan arc", "steady", "IF THE DRONE LOSES LINK · PER CAHILL · PLANNED", "the link breaks", ""),
 (43, 20, W("automatically"), "sonar", "a dashed ghost airplane silhouette", "crosses the far sky and the scan arc swings to track it as a dashed arrow bends the drone's path away", "steady", "AVOID OTHER AIRCRAFT · AUTOMATICALLY · PLANNED", "the arrow bends", ""),
 (39, 21, 0.0, "rush", "a snow gust", "sweeps across a dark village runway with unlit edge markers under a clinic window", "hopeful", "PARTNERS · RYAN AIR · TANANA CHIEFS CONFERENCE", "the snow sweeps", ""),
 (44, 21, W("Tanana"), "click", "the clinic window", "brightens behind a closed door", "hopeful", "AN ALASKA NATIVE NONPROFIT", "the window glows", ""),
 (40, 21, W("develop"), "tap", "the dashed runway edge markers", "flicker in outline one after another, still unlit, as a dashed phosphor flight line arrives from the frame edge and stops short of them", "hopeful", "DEVELOP OR TEST · MEDICAL DELIVERY", "the outlines flicker", ""),
 (41, 22, 0.0, "pawstep", "the sepia dog team on the map on the ice", "settles at the NENANA pin beside the parked drone as the camera pulls wide", "wistful", "THE DOGS RAN THE TRAIL", "the dogs settle", ""),
 (45, 22, W("drone"), "clip", "the scarlet ribbon", "snaps along the sepia trail to the nine tenths mark and swings back to a loop", "proud", "THE DRONE HAS THE LEGS", "the ribbon flicks", ""),
 (42, 22, W("Next"), "bloom", "the scarlet ribbon", "stretches solid inside a sight bubble round NENANA and continues as a dashed phosphor line to the clinic pin, the dashed radar beside it", "hopeful", "NEXT · EYES OF ITS OWN · PLANNED", "the dashes lay out", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 60)}
PLATE_AT.update({1: "lower-third", 22: "lower-third", 41: "lower-third"})
CLAIM_MAP = {1: ["narration"], 2: ["c22"], 3: ["c2"], 4: ["c20"], 5: ["c21"], 6: ["c21"], 7: ["c23"], 8: ["c22"], 9: ["c25"], 10: ["c25"],
             11: ["c1"], 12: ["c1"], 13: ["c8"], 14: ["c13"], 15: ["c12"], 16: ["c4"], 17: ["c5"], 18: ["c7"], 19: ["c7"], 20: ["c3"],
             21: ["c3"], 22: ["c2"], 23: ["c43"], 24: ["c22"], 25: ["c2"], 26: ["c26"], 27: ["c26"], 28: ["c14"], 29: ["c15"], 30: ["c7"],
             31: ["c16"], 32: ["c6"], 33: ["c19"], 34: ["narration"], 35: ["c29"], 36: ["c30"], 37: ["c33"], 38: ["c32"], 39: ["c34"],
             40: ["c34"], 41: ["c22"], 42: ["c30"], 43: ["c32"], 44: ["c35"], 45: ["c43"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "map-territory", "wide", "high", "map-on-ice", "top-down-map", "map-territory", "horizontal-traverse", "landscape-as-subject", "", "", "Two runs", "On a cream map laid on the river ice a sepia dog team inks a paw trail west to Nome while a drone's shadow closes a scarlet loop back on NENANA"),
 (2, 1, "wide-establish", "wide", "eye", "sepia-nome-depot", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "structure-as-subject", "morph", "build", "1925", "A sepia print of Nome's roofs in January, then a sepia train steams into the Nenana depot, a scarlet ribbon tied to the sign post"),
 (3, 3, "alt-vantage", "medium", "low", "sepia-trail", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "multiplicity-swarm", "match-action", "build", "The relay", "A sepia dog team gallops across the dusk ice past a mileage marker and a shivering little engine whose sweat drop freezes"),
 (4, 5, "wide-establish", "extreme-wide", "low", "runway", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "instrument-as-subject", "hard-cut", "travel", "August 19th", "The grey cargo drone rolls out of a Nenana hangar and lifts off in silhouette against the apricot dusk"),
 (5, 6, "map-territory", "wide", "high", "tanana-flats", "top-down-map", "single-object-void", "vertical-rise", "instrument-as-subject", "match-cut", "match", "The aircraft", "From above, the twin-engine high-wing cargo drone and its shadow glide across the green Tanana flats in August"),
 (6, 7, "two-up", "medium", "eye", "ground-station", "eye-level-immersive", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "hard-cut", "carry", "The pilots", "A faceless pilot at a ground station flies the drone from the screen, a scarlet loop trace around NENANA"),
 (7, 8, "push-detail", "close", "eye", "hangar-rack", "macro-closeup", "fullbleed-split", "assemble-build", "single-organic-hero", "whip-pan", "build", "Two samples", "FLEW buckles goggles and drops into the crate, STAYED slides onto a fridge shelf behind glass and waves"),
 (8, 10, "data-panel", "medium", "eye", "ground-station-clock", "eye-level-immersive", "grid-modular", "radial-emanate", "data-as-subject", "match-cut", "carry", "Eight forty seven", "The clock spins, the pilot's hand empties, refills and empties the mug, a raven passes the window and turns back"),
 (9, 11, "map-territory", "wide", "high", "map-on-ice", "top-down-map", "map-territory", "horizontal-traverse", "data-as-subject", "graphic-match", "match", "Laid along the trail", "The ribbon un-loops and slides along the curving paw trail, stops about nine tenths of the way with bare trail to NOME, the lead dog sniffs the frayed end, and it snaps back into A TEST LOOP on NENANA"),
 (10, 13, "two-up", "medium", "low", "snowfield", "eye-level-immersive", "fullbleed-split", "vertical-descent", "instrument-as-subject", "hard-cut", "carry", "Forty below", "A small quadcopter holds a hover in blowing snow beside the shivering ghost of the 1925 engine, a thermometer at 40 BELOW"),
 (11, 14, "subject-portrait", "close", "eye", "test-table", "macro-closeup", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "hard-cut", "build", "The test", "A faceless Cahill lifts FLEW and STAYED level by a cold window, steps away, a printer lands and its tray stays empty, a crate tag flips to NOT TESTED FOR DOPING"),
 (12, 17, "wide-establish", "extreme-wide", "eye", "village", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "landscape-as-subject", "carried-element", "carry", "The villages", "Ten snow roofs and a clinic with a warm window at dusk, no road to 8 of 10"),
 (13, 18, "map-territory", "wide", "high", "map-on-ice", "top-down-map", "map-territory", "radial-emanate", "data-as-subject", "map-travel", "match", "Keep it in sight", "The ribbon reaches from NENANA toward a village pin and snags on the phosphor edge of the sight bubble"),
 (14, 19, "alt-vantage", "medium", "low", "runway-night", "eye-level-immersive", "fullbleed-split", "vertical-rise", "single-organic-hero", "hard-cut", "carry", "Eyes of its own", "A dashed phosphor radar marked PLANNED rises by the parked drone and ghosts through its wing, the link line breaks, the scan arc tracks a dashed ghost airplane"),
 (15, 21, "wide-establish", "wide", "eye", "village-night", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "landscape-as-subject", "pull-out", "travel", "Partners", "A snow gust sweeps a dark village runway with unlit outlined markers, a clinic window brightens behind a closed door"),
 (16, 22, "map-territory", "wide", "high", "map-on-ice", "top-down-map", "map-territory", "vertical-descent", "data-as-subject", "graphic-match", "match", "Next", "The map on the ice: the dogs at NENANA, the parked drone, the ribbon flicking to the nine tenths mark, then solid inside a sight bubble and dashed phosphor to the clinic"),
]

AMBIENT = {1: "wind over river ice", 2: "a steam whistle far off, wind", 3: "sled runners hiss, wind", 4: "a runway at dusk, prop hum", 5: "wind and engine drone",
           6: "a console room hum", 7: "a hangar room tone", 8: "a console room hum, a clock", 9: "wind over river ice", 10: "blowing snow, small rotors",
           11: "a quiet room, wind at a cold window", 12: "dusk wind over a village", 13: "wind over river ice", 14: "a runway at night, wind", 15: "dusk wind over a village", 16: "wind over river ice"}
CENTER = {1: "the map and the NENANA pin at x540 y980", 2: "the depot sign and the train at x540 y1020", 3: "the dog team at x540 y1080", 4: "the drone and the runway at x540 y1040",
          5: "the drone in profile at x540 y900", 6: "the pilot and the screen at x540 y980", 7: "FLEW and the crate at x540 y1040", 8: "the clock and the mug at x540 y960",
          9: "the ribbon and the paw trail at x540 y960", 10: "the small drone at x540 y940", 11: "FLEW and STAYED on the table at x540 y1060", 12: "the clinic window at x540 y1040",
          13: "the ribbon tip at the bubble edge at x540 y960", 14: "the radar and the wing at x540 y1040", 15: "the clinic window at x540 y1040", 16: "the ribbon toward the clinic at x540 y980"}
HERO = {
 1: ("map on the ice + sepia dog team + drone shadow + scarlet ribbon loop", "50% map, 30% ribbon and dogs, 20% ice"),
 2: ("sepia Nome roofs + sepia train + Nenana depot sign + ribbon", "45% train, 30% depot, 25% town"),
 3: ("sepia dog team + faceless musher + mileage marker + 1925 engine", "50% team, 25% engine, 25% ice"),
 4: ("cargo drone + hangar + runway lights + apricot sky", "45% drone, 30% runway, 25% sky"),
 5: ("the cargo drone seen from above + its shadow + green Tanana flats", "50% drone and shadow, 50% flats"),
 6: ("faceless pilot + ground station + screen loop", "45% pilot, 55% console"),
 7: ("FLEW + crate + STAYED + fridge", "45% FLEW and crate, 35% fridge, 20% rack"),
 8: ("clock + mug + raven at the window", "40% clock, 30% mug, 30% window"),
 9: ("ribbon + paw trail + lead dog + map", "45% ribbon and trail, 30% map, 25% dog"),
 10: ("small quadcopter + ghost 1925 engine + thermometer", "45% drone, 30% engine, 25% snow"),
 11: ("FLEW + STAYED + faceless Cahill + results printer + crate tag", "45% tubes, 30% printer, 25% Cahill"),
 12: ("village roofs + clinic window + snow", "45% clinic, 40% roofs, 15% sky"),
 13: ("ribbon + sight bubble + village pin + map", "45% ribbon, 35% bubble, 20% map"),
 14: ("dashed radar + parked drone + dashed ghost airplane + runway", "45% radar, 35% drone, 20% runway"),
 15: ("snow gust + dark village runway + clinic window", "45% clinic, 35% runway, 20% snow"),
 16: ("sepia dog team + ribbon + parked drone + dashed radar + map", "40% ribbon, 35% map, 25% dogs and drone"),
}
PARTS = {1: 46, 2: 44, 3: 48, 4: 46, 5: 40, 6: 50, 7: 52, 8: 44, 9: 46, 10: 40, 11: 52, 12: 48, 13: 40, 14: 44, 15: 44, 16: 50}
KICKS = (25, 35)
CAMERA = {1: "craneDown", 2: "truckAcross", 3: "truckAcross", 4: "riseWith", 5: "truckAcross", 6: "dollyThrough", 7: "dollyThrough", 8: "static:a locked clock insert",
          9: "craneDown", 10: "riseWith", 11: "dollyThrough", 12: "truckAcross", 13: "craneDown", 14: "riseWith", 15: "truckAcross", 16: "craneDown"}

PALETTE = ("apricot and golden civil twilight #F2A779 climbing through dusky mauve #8A6283 to plum dusk #3B2B4A above lavender river ice #D9D0E3, an ivory paper map #F1E6D2 laid on the ice, "
           "a vivid scarlet ribbon #E0303F as the only scarlet, oxblood #7E1626 in clear glass sample tubes #C8E3F0, sepia #B98A57 reserved to 1925, radar-phosphor green #2EE86B for anything planned")


def BOARD_HEAD(b_at, end, ad, tr):
    return {
        "run_date": "2026-11-23", "slug": "two-runs-out-of-nenana", "title": "Two Runs Out of Nenana",
        "concept": ("In January 1925 diphtheria threatened Nome; antitoxin came by train to Nenana, the railroad's closest point, and 20 mushers ran it 674 miles by dog team, because nobody knew how a small engine would take 40 below. "
                    "On August 19th UAF's drone center flew a Windracers ULTRA out of Nenana, piloted remotely, with human blood samples for the International Testing Agency; each volunteer gave two samples so one flew and one stayed. "
                    "It flew 8 hours 47 minutes and 1,000 km, about 621 miles, nearly the length of the serum trail, in a loop that landed where it started. UAF has flown small drones at 40 below, and director Cathy Cahill says the flight proves the blood could survive. "
                    "The test: no lab results have been published, so the film claims the trip, not the result. The state says 82 percent of communities are off the road; federal rules regulate against flying beyond the operator's line of sight; UAF plans detect-and-avoid radar, which Cahill calls a key step, and has partnered with Ryan Air and Tanana Chiefs Conference to develop or test medical delivery. "
                    "Drawn as two faced sample tubes, FLEW and STAYED, a plain cargo drone with no face, a dashed phosphor radar that stays PLANNED, and a scarlet ribbon that is a loop until it is laid along the 1925 paw trail on a map on the river ice, about nine tenths of the way."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "horizontal-traverse", "hero_treatment": "instrument-as-subject", "layout": "fullbleed-split",
                        "register": "naturalistic-scene", "palette": PALETTE, "camera_strategy": "lateral-track-and-overhead",
                        "light_story": "warm-golden-dusk-glow",
                        "metaphor": "a scarlet ribbon that is a loop until it is laid along the 1925 dog trail about nine tenths of the way, two sample tubes that flew and stayed, and a dashed radar that is the drone's eyes of its own, still planned"},
        "signature_shot": 9,
        "palette": PALETTE,
        "divergence_note": ("The last two films were a blue-hour lab bench under the Chugach with a felt canary, a cobalt wall and a corridor planner (11-22), and an orbital night kitchen and walnut courtroom with a faced chat-bubble accordion and an auction tag (11-21). "
                            "This film moves through an apricot-to-plum Interior dusk on the river ice: a cream map laid on the ice seen from above, a sepia 1925 depot and trail, a Nenana runway and hangar, a ground station, a test table by a cold window, a village at dusk and a night runway. Its motion is lateral (dogs, a train, a drone, a ribbon laid along a trail) instead of 11-22's rise, its hero pair is two glass tubes instead of a bird, and its machine is drawn plain with no face. "
                            "Honest overlaps: a quote plate and a faceless named person with a boxed tag (house grammar), and a dusk exterior (11-22 ended at a dusk wall; here the light is apricot and plum on ice, never cyan or teal)."),
        "treatment": {"title": "Two Runs Out of Nenana", "summary": ad["treatment"], "judge_reasoning": tr[1] if len(tr) > 1 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "Overhead, a cream map of Alaska laid on lavender river ice at dusk, a NENANA pin, and at 0.2 s a sepia dog team bursts off the pin inking a paw trail west while a grey drone shadow sweeps in",
                 "headline": "TWO RUNS · ONE TOWN", "motion_by_s": 0.2,
                 "loopback": "Frame 1 is the dog team bursting off NENANA as a drone shadow closes a scarlet loop on the pin; the last shot is the same map with the dogs back at NENANA, the drone parked, and the ribbon laid toward a clinic with its last stretch dashed."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(36), "plant_glow_s": 0.4, "plant_sfx": "snap", "what": "Could it reach a village? Planted as the drone shadow glances at an UNLIT VILLAGE PIN and closes ONE LOOP on NENANA, carried as the ribbon lays along the trail and snaps back to A TEST LOOP, paid when the dashed DETECT AND AVOID RADAR · PLANNED pops up by the parked drone: UAF names the next step, a radar."},
        "open_loop_2": {"plant_t": b_at(19), "pay_t": b_at(31), "what": "Did the blood make it? Planted as STAYED's fridge door swings shut and the two tubes look at each other (one flew, one stayed, to compare), paid when the printer's tray between them stays empty: LAB RESULTS · NOT PUBLISHED."},
        "throughline": {"object": "the scarlet ribbon", "lands_in_button": "the ribbon laid across the map toward the village clinic, its last stretch dashed PLANNED beside the dashed radar",
                        "states": [
                            {"at_s": b_at(3), "state": "R1 a LOOP closed on the NENANA pin after the paw trail reached Nome"},
                            {"at_s": b_at(5), "state": "R1b tied to the 1925 depot sign post, a knot at the start of the trail"},
                            {"at_s": b_at(11), "state": "R1c tied to the 2026 hangar door at the same town"},
                            {"at_s": b_at(14), "state": "R1d drawn as a loop trace on the pilot's screen"},
                            {"at_s": b_at(22), "state": "R2 LAID ALONG the curving paw trail, stopping about nine tenths of the way to NOME"},
                            {"at_s": b_at(25), "state": "R2b snapped back into a loop on NENANA"},
                            {"at_s": b_at(28), "state": "R3 COILED round FLEW and STAYED on the test table"},
                            {"at_s": b_at(34), "state": "R4a a NEW strand pulled off the coil, reaching for the unlit village pin"},
                            {"at_s": b_at(35), "state": "R4 SNAGGED on the edge of the sight bubble that rises after the strand is out"},
                            {"at_s": b_at(42), "state": "R5 SOLID inside a sight bubble round NENANA, then a dashed phosphor line to the clinic, PLANNED"}]},
        "reveals": [
            {"t": b_at(2), "type": "scale-pullback", "what": "the paw trail crosses the whole map into Nome", "hold_s": 0.6},
            {"t": b_at(8), "type": "build-on", "what": "the mileage counter rolls to 674 as the team passes", "hold_s": 0.6},
            {"t": b_at(22), "type": "morph-to-chart", "what": "the ribbon un-loops and lays itself along the paw trail as a measure", "hold_s": 0.8},
            {"t": b_at(25), "type": "build-on", "what": "the ribbon snaps back into a loop on NENANA", "hold_s": 0.6},
            {"t": b_at(33), "type": "scale-pullback", "what": "the village opens with no road to 8 of 10 roofs", "hold_s": 0.8},
            {"t": b_at(41), "type": "scale-pullback", "what": "the camera pulls wide on the whole map, dogs, drone and ribbon", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.0}, {"line": 1, "offset": 0.0, "level": 0.7}, {"line": 5, "offset": 0.0, "level": 1.2},
            {"line": 11, "offset": 0.0, "level": 1.3}, {"line": 15, "offset": 0.0, "level": 0.6}, {"line": 19, "offset": 0.0, "level": 1.2},
            {"at_s": round(b_at(42) - 0.5, 3), "level": 0.35}, {"at_s": round(b_at(42) + 0.4, 3), "level": 1.3},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(42) - 0.5, 3), "riser_at": round(b_at(41) - 1.0, 3), "silence_at": round(b_at(42) - 0.5, 3),
            "payoff_at": b_at(42), "button_pattern": "callback", "interrupt_at": b_at(30), "extra_dips": []},
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
    book.raise_if_missing("board_1123 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1123Ids.ts").write_text(
        "// GENERATED by scripts/board_1123.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
