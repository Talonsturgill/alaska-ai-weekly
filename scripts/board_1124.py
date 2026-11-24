#!/usr/bin/env python3
"""2026-11-24 "Trust the Flag": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1124.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1124.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
SPECS = "Specs, a Raspberry Pi board with LED eyes riding under the quadcopter"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "whoosh", "a rainbow push-broom scanline with a squinting face over overcast July tundra by the Bering Sea", "sweeps down the frame stripe by stripe and crosses a pair of olive waders lying in the grass", "curious", "ONE LINE AT A TIME", "the stripe over the waders flips colour", ""),
 (2, 0, W("question"), "pop", "a red GPS pin flag", "springs out of the grass beside the waders with an overshoot", "eager", "DIFFERENT MATERIAL", "the pin wobbles", ""),
 (36, 0, W("ground"), "slide", "the blank clipboard search grid with an inked CLEARED rubber stamp beside it", "slides in at the frame corner, the first pin copies onto the paper and the stamp rocks on its handle, waiting", "tempted", "SEARCH GRID", "the stamp rocks", ""),
 (3, 1, 0.0, "click", "a regular camera and an infrared camera on a small survey drone", "sweep the tundra as their two screens show plain grass", "doubtful", "STANDARD KIT · VISIBLE + INFRARED", "the screens stay plain", ""),
 (4, 1, W("miss"), "thud", "three boxed cards reading CAMOUFLAGED, INSULATED and NO HEAT SIGNATURE", "drop onto the grass where both screens see nothing", "uneasy", "CAMOUFLAGED · INSULATED · NO HEAT SIGNATURE", "the cards land", ""),
 (5, 2, 0.0, "snap", "a box of 3 crayons marked R G B", "sits while a second box unfolds like an accordion into 150 spectrum crayons", "surprised", "150 BANDS · 400 TO 1000 NM", "the box unfolds", ""),
 (6, 2, W("revealing"), "ding", "two spectrum cards, one for grass and one for a jacket", "fan open bar by bar and their curves split apart", "curious", "SEES MATERIAL DIFFERENCES", "the curves split", ""),
 (7, 3, 0.0, "rush", SPECS, "is revealed as the camera pod pours a flood of striped scan lines at him", "squint", "RASPBERRY PI 4B · ON THE DRONE", "the lines pour", ""),
 (8, 4, 0.0, "rattle", "a mute faced stopwatch clipped to the camera pod", "ticks past its red 10 MS mark and sweats as unread lines pile up over Specs", "nervous", "DETECTOR ALONE · 21.34 MS · TOO SLOW", "the pile grows", ""),
 (37, 4, W("detector"), "creak", "the pile of unread scan lines", "stacks higher than the quadcopter's rotor arms and tips over Specs", "buried", "LINES PILE UP", "the pile tips", "rehook: the pile of unread lines stacks past the rotor arms and buries Specs"),
 (40, 4, W("milliseconds"), "whirr", "the stopwatch needle", "sweeps past its red 10 mark and on round to 21 while Specs strains", "nervous", "21 MS A LINE", "the needle sweeps", ""),
 (9, 4, W("ten"), "tick", "the stopwatch's red 10 MS mark", "flickers red as the pile of lines buries Specs up to his LED eyes", "buried", "A NEW LINE EVERY 10 MS", "the mark flashes", ""),
 (10, 5, 0.0, "clank", "a brass rope post with a face and a clipboard, the DBSCAN bouncer", "swings in at the pod's output and checks pixels at a velvet rope", "stern", "SABL · ERX DETECTOR · DBSCAN", "the rope sways", ""),
 (38, 5, W("faster"), "snap", "the bouncer's velvet rope", "snaps taut as a queue of pixels presses up to it from the pod", "stern", "SCORE · THEN CLUSTER", "the rope snaps taut", ""),
 (41, 5, W("scores"), "blip", "a gauge marked ERX on the pod", "swings and one pixel brightens as it scores high", "focused", "SCORES EACH PIXEL", "the pixel brightens", ""),
 (11, 5, W("standouts"), "pop", "a lone sparkly stray pixel", "is waved off the rope by the bouncer's clipboard while a tight cluster passes through", "shrug", "STRAY PIXELS OUT · CLUSTERS IN", "the clipboard waves", ""),
 (12, 6, 0.0, "ding", "the stopwatch", "settles at 5.7 as Specs leans back with his cable feet up", "smug", "5.67 TO 5.73 MS · UNDER 10 MS", "the feet go up", "rehook: Specs puts his feet up as the stopwatch drops under its 10 MS mark"),
 (13, 7, 0.0, "snap", "a cluster on the clipboard search grid", "collapses into a GPS reticle and a red pin springs up on the paper", "proud", "GPS POINT PER CLUSTER", "the pin springs", ""),
 (14, 7, W("check"), "creak", "the CLEARED stamp at the clipboard's edge", "rocks closer on its handle as Specs side-eyes it", "tempted", "ONE PIN · GO CHECK", "the stamp rocks", ""),
 (15, 8, 0.0, "whoosh", "a paper map of the Bering Sea coast and the Yukon-Kuskokwim Delta", "flies in and a pin drops on Quinhagak", "steady", "QUINHAGAK · YUP'IK VILLAGE · NO ROADS IN", "the pin drops", ""),
 (16, 8, W("nonprofit"), "flip", "a boxed org card on a stake", "swings up on its stake and lands beside the pin", "steady", "QUINHAGAK SEARCH AND RESCUE · VOLUNTEER NONPROFIT", "the card flips", ""),
 (17, 9, 0.0, "slam", "a STAGED SEARCH stamp", "slams onto the tundra beside a clapperboard as gear is laid flat on the ground", "steady", "A STAGED SEARCH · NOT A REAL RESCUE", "the stamp lands", "rehook: a STAGED SEARCH stamp slams onto the tundra beside a clapperboard"),
 (18, 9, W("community"), "rustle", "waders, a net, buoys, a life jacket and a drab jacket the colour of the grass", "settle flat in a row on the tundra, the drab jacket nearly vanishing into the grass", "calm", "ITEMS MOSTLY DONATED BY THE COMMUNITY", "the jacket blends", ""),
 (19, 10, 0.0, "pop", "red pins on a grey Bering Sea mudflat diorama with its own threshold placard", "pop up across the mud and tilt, 5 of 9 pins on gear and 4 on bare mud, 5 of 9 items pinned", "sheepish", "MUDFLAT · ITS OWN THRESHOLD", "the bare-mud pins wobble", ""),
 (20, 10, W("caught"), "thump", "a badge", "slams onto the mudflat diorama's placard", "steady", "56% PRECISION · 55% RECALL", "the badge lands", ""),
 (21, 11, 0.0, "slam", "a split wall", "slides in and a second diorama of khaki swamp grass by the Arolik River rises beside the mudflat", "steady", "SWAMP GRASS · A DIFFERENT THRESHOLD", "the wall slides", ""),
 (22, 11, W("ninety"), "ding", "2 red pins in the swamp grass", "rise and 2 of 2 land on planted items", "proud", "99% OF FLAGS ON PLANTED ITEMS", "the pins stand", ""),
 (23, 11, W("twenty"), "thump", "the 7 planted items in the swamp grass", "lie as the scanline passes, 2 of 7 pinned and 5 of 7 bare", "uneasy", "29% OF ITEMS FLAGGED", "the gear stays bare", ""),
 (24, 12, 0.0, "boom", "the 99% badge and the 29% badge", "slam together into one coin that spins over the swamp grass diorama", "alarmed", "SAME SCENE · SAME SETTING", "the coin spins", "rehook: the 99% and 29% badges slam together into one coin"),
 (25, 12, W("misses"), "swish", "the coin", "lands and the pins glow while the blank grass fogs over", "doubtful", "TRUST THE FLAG · NOT THE SILENCE", "the fog rolls in", ""),
 (26, 13, 0.0, "thud", "the three cards CAMOUFLAGED, INSULATED, NO HEAT SIGNATURE", "rise huge over the swamp grass diorama", "serious", "THE CAMOUFLAGE CASE · THE PAPER'S PITCH", "the cards rise", ""),
 (39, 13, W("camouflage"), "hush", "the drab jacket in the swamp grass diorama", "darkens to the grass colour as the three cards loom over it", "uneasy", "BLENDS IN", "the jacket darkens", ""),
 (27, 14, 0.0, "clank", "the bouncer at the velvet rope", "waves off a crowd of stray false-alarm pixels", "stern", "CUTTING FALSE ALARMS", "the crowd scatters", ""),
 (28, 14, W("hide"), "stamp", "the bouncer", "turns away the drab jacket's faint pixels too and a red stamp lands on the rope", "shrug", "CAN DROP REAL HITS · ILLUSTRATION", "the faint pixels fade", ""),
 (29, 15, 0.0, "creak", "Specs", "dims his LED eyes as the drab jacket stays under the fog", "doubtful", "QUIET IN THE CASE IT'S PITCHED FOR", "the eyes dim", ""),
 (30, 16, 0.0, "knock", "a survey stake sign", "drops and slams into the tundra beside the dioramas", "steady", "RECALL · STILL LIMITED · 2 TUNDRA SCENES", "the stake shudders", "rehook: survey stake signs hammer in around the dioramas"),
 (42, 16, W("tundra"), "pencil", "a dashed survey ring", "closes around the two small dioramas, no third scene inside it", "steady", "2 SCENES · BOTH TUNDRA", "the ring closes", ""),
 (31, 17, W("preprint"), "knock", "two more survey stake signs", "slam into the ground beside it, fencing the evidence", "steady", "UNREVIEWED PREPRINT · NOT A REAL SEARCH", "the stakes shudder", ""),
 (32, 18, 0.0, "slide", "a layer cake of maps with QSAR's visible and infrared drone layer at the bottom", "takes a new layer of red pins sliding on top, nothing erased", "steady", "AUGMENT · NOT REPLACE", "the layer settles", ""),
 (33, 19, 0.0, "whoosh", "the CLEARED stamp", "swings down at the fogged swamp grass on the clipboard grid", "tense", "CLEARED?", "the stamp swings", ""),
 (34, 19, W("look"), "snap", "a red pin", "springs up under the stamp and stops it mid-air", "resolved", "A FLAG MEANS GO LOOK", "the stamp jolts", ""),
 (35, 19, W("Silence"), "flip", "the stamp", "flips over to NOT CLEARED and presses onto the fog as the scanline starts sweeping again", "resolved", "NO FLAG · KEEP LOOKING", "the scanline restarts", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 60)}
PLATE_AT.update({1: "lower-third", 24: "lower-third", 35: "lower-third"})
CLAIM_MAP = {1: ["c12"], 2: ["c7"], 36: ["c15"], 3: ["c5"], 4: ["c6"], 5: ["c11"], 6: ["c7"], 7: ["c13"], 8: ["c17"], 9: ["c16"],
             10: ["c3", "c14"], 11: ["c14"], 12: ["c16"], 13: ["c15"], 14: ["c15"], 15: ["c20"], 16: ["c19"], 17: ["c25"], 18: ["c27"],
             19: ["c24"], 20: ["c28"], 21: ["c24", "c29"], 22: ["c29"], 23: ["c29"], 24: ["c29"], 25: ["narration"], 26: ["c6"],
             27: ["c31"], 28: ["c31"], 29: ["c31", "c6"], 30: ["c30", "c32"], 31: ["c1", "c35"], 32: ["c33", "c22"], 33: ["narration"],
             34: ["c15"], 35: ["c30", "c33"], 37: ["c17"], 38: ["c14"], 39: ["c6"], 40: ["c17"], 41: ["c14"], 42: ["c32"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "map-territory", "wide", "high", "tundra-above", "top-down-map", "map-territory", "vertical-descent", "data-as-subject", "", "", "One question", "From above, a rainbow scanline sweeps overcast July tundra, a stripe flips over waders, a red pin springs, and the clipboard grid with a waiting CLEARED stamp slides in"),
 (2, 1, "two-up", "medium", "eye", "tundra-low", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "instrument-as-subject", "pull-out", "carry", "Standard kit", "A small survey drone with a regular and an infrared camera sweeps the tundra, its two screens plain while three cards drop where they see nothing"),
 (3, 2, "push-detail", "close", "eye", "desk-crayons", "macro-closeup", "single-object-void", "assemble-build", "data-as-subject", "match-cut", "build", "150 bands", "Three crayons against a box that unfolds into 150 spectrum crayons, then two spectrum cards whose curves split"),
 (4, 3, "subject-portrait", "medium", "low", "under-drone", "eye-level-immersive", "centered-hero-lowerthird", "vertical-descent", "single-organic-hero", "whip-pan", "carry", "The flood", "Under the quadcopter Specs takes a flood of scan lines, the stopwatch sweats past 10 MS and Specs is buried"),
 (5, 5, "alt-vantage", "medium", "eye", "velvet-rope", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "hard-cut", "build", "The bouncer", "The DBSCAN bouncer works a velvet rope at the pod's output, waves off a stray pixel, the stopwatch settles at 5.7 and Specs puts his feet up"),
 (6, 7, "data-panel", "close", "high", "clipboard", "top-down-map", "grid-modular", "assemble-build", "data-as-subject", "graphic-match", "match", "One pin", "On the clipboard grid a cluster collapses into a GPS reticle and a red pin, the CLEARED stamp rocks closer"),
 (7, 8, "map-territory", "wide", "high", "map-delta", "top-down-map", "map-territory", "vertical-descent", "landscape-as-subject", "map-travel", "travel", "Quinhagak", "A paper map of the Bering Sea coast and the Yukon-Kuskokwim Delta, a pin on Quinhagak and an org card on a stake"),
 (8, 9, "wide-establish", "medium", "eye", "tundra-staging", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "hard-cut", "build", "Staged", "A STAGED SEARCH stamp and a clapperboard on the tundra, gear laid flat in a row, a drab jacket blending into the grass"),
 (9, 10, "two-up", "wide", "high", "mudflat-diorama", "top-down-map", "map-territory", "assemble-build", "data-as-subject", "pull-out", "match", "Mudflat", "A grey mudflat diorama with its own threshold placard, pins wobbling on gear and bare mud, 56 and 55"),
 (10, 11, "two-up", "wide", "eye", "split-dioramas", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "data-as-subject", "carried-element", "match", "Swamp grass", "A split wall and the swamp grass diorama, a few solid pins on gear and most gear bare, 99 and 29"),
 (11, 12, "push-detail", "close", "eye", "coin", "macro-closeup", "single-object-void", "push-in-only", "data-as-subject", "match-action", "carry", "One coin", "The 99 and 29 badges slam into one coin that spins and lands, pins glow and the blank grass fogs"),
 (12, 13, "wide-establish", "extreme-wide", "low", "camo-cards", "eye-level-immersive", "stacked-layers", "vertical-rise", "landscape-as-subject", "hard-cut", "build", "The camouflage case", "Three huge cards rise over the swamp grass, the reason the camera exists"),
 (13, 14, "alt-vantage", "medium", "eye", "velvet-rope-fog", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "match-cut", "carry", "Turned away", "The bouncer waves off false alarms and turns away the drab jacket's faint pixels too, Specs dims"),
 (14, 16, "wide-establish", "wide", "eye", "survey-stakes", "eye-level-immersive", "stacked-layers", "vertical-descent", "structure-as-subject", "pull-out", "build", "The fence", "Survey stake signs hammer in around the two dioramas, fencing the evidence"),
 (15, 18, "push-detail", "medium", "high", "layer-cake", "exploded-diagram", "stacked-layers", "assemble-build", "data-as-subject", "graphic-match", "build", "Augment", "A layer cake of maps, QSAR's visible and infrared layer below, a new layer of red pins slides on top"),
 (16, 19, "map-territory", "wide", "high", "clipboard-fog", "top-down-map", "map-territory", "vertical-descent", "data-as-subject", "graphic-match", "match", "Keep looking", "The CLEARED stamp swings at the fog, a pin stops it, it flips to NOT CLEARED and the scanline sweeps again"),
]

AMBIENT = {1: "wind over open tundra, a far surf", 2: "wind, small rotors", 3: "a quiet desk room", 4: "rotors overhead, wind", 5: "rotors, a velvet rope creak",
           6: "a quiet desk room, wind at a window", 7: "a quiet desk room, paper", 8: "wind over tundra, a far surf", 9: "wind over a mudflat, a far surf", 10: "wind in grass",
           11: "wind in grass", 12: "wind over tundra", 13: "rotors, wind in grass", 14: "wind over tundra", 15: "a quiet desk room", 16: "wind over open tundra, a far surf"}
CENTER = {1: "the waders and the pin at x540 y960", 2: "the drone and the screens at x540 y900", 3: "the crayon boxes at x540 y980", 4: "Specs at x540 y960",
          5: "the bouncer and the rope at x540 y1000", 6: "the pin on the grid at x540 y960", 7: "the Quinhagak pin at x540 y900", 8: "the gear row at x540 y1040",
          9: "the mudflat diorama at x540 y960", 10: "the swamp grass diorama at x540 y960", 11: "the coin at x540 y900", 12: "the three cards at x540 y880",
          13: "the bouncer and the jacket at x540 y1000", 14: "the stake signs at x540 y980", 15: "the layer cake at x540 y960", 16: "the stamp and the fog at x540 y960"}
HERO = {
 1: ("rainbow scanline + waders + red pin + clipboard grid + CLEARED stamp", "45% tundra and scanline, 30% pin and waders, 25% grid"),
 2: ("survey drone + regular and infrared screens + three cards", "40% drone, 35% screens, 25% cards"),
 3: ("crayon boxes + spectrum cards", "50% crayons, 50% cards"),
 4: ("Specs + quadcopter + camera pod + stopwatch + scan line pile", "45% Specs, 30% drone, 25% stopwatch and pile"),
 5: ("DBSCAN bouncer + velvet rope + pixels + stopwatch + Specs", "40% bouncer, 30% pixels, 30% Specs"),
 6: ("clipboard grid + GPS reticle + red pin + CLEARED stamp", "50% grid, 30% pin, 20% stamp"),
 7: ("paper map of the Bering Sea coast + pin + org card", "60% map, 40% card"),
 8: ("STAGED stamp + clapperboard + gear row", "45% gear, 30% stamp, 25% tundra"),
 9: ("mudflat diorama + pins + placard + badge", "55% diorama, 25% pins, 20% badge"),
 10: ("split wall + swamp grass diorama + red pins + planted items", "50% grass diorama, 25% mudflat, 25% badges"),
 11: ("two-faced coin + diorama + fog", "55% coin, 45% diorama"),
 12: ("three huge cards + swamp grass", "60% cards, 40% grass"),
 13: ("bouncer + rope + faint jacket pixels + fog + Specs", "40% bouncer, 35% pixels and fog, 25% Specs"),
 14: ("survey stake signs + dioramas", "55% stakes, 45% dioramas"),
 15: ("layer cake of maps + pins", "60% layers, 40% pins"),
 16: ("CLEARED stamp + pin + fog + clipboard grid + scanline", "40% stamp, 35% grid and fog, 25% pin"),
}
PARTS = {i: 44 for i in range(1, 17)}
KICKS = (24, 34)
CAMERA = {1: "craneDown", 2: "truckAcross", 3: "dollyThrough", 4: "riseWith", 5: "truckAcross", 6: "craneDown", 7: "craneDown", 8: "truckAcross",
          9: "craneDown", 10: "truckAcross", 11: "dollyThrough", 12: "riseWith", 13: "truckAcross", 14: "dollyThrough", 15: "riseWith", 16: "craneDown"}

PALETTE = ("pewter-sage overcast #B9C3C6, sedge olive #7E8A4A, tussock khaki #A08A54, wet slate mudflat #6F6A62, circuit green #2F8F5B with brass #E9C46A pins and cyan LED eyes #7CF0FF, "
           "signal red #E63B2E on GPS flags and the stamp alone, violet-to-crimson spectrum stripes for the machine view, clipboard bone #F3EDE0, drifting fog #C9CFCB")


def BOARD_HEAD(b_at, end, ad, tr):
    return {
        "run_date": "2026-11-24", "slug": "trust-the-flag", "title": "Trust the Flag",
        "concept": ("An arXiv preprint posted November 20th, not peer reviewed, describes SABL: a Raspberry Pi 4B riding a DJI quadcopter reads a 150-band push-broom hyperspectral camera line by line, scores pixels with an anomaly detector and clusters the standouts into GPS points, in about 5.7 ms a line against a 10 ms camera interval, where the detector alone took 21.34 ms. "
                    "The data come from a 10-day deployment with Quinhagak Search and Rescue, a volunteer nonprofit in a Yup'ik village off the road system, on a staged search: researchers laid out waders, nets, buoys and life jackets, mostly donated by the community. "
                    "Mudflat about 56 percent precision and 55 percent recall; swamp grass, at a different threshold, about 99 percent precision and 29 percent recall. The test: the paper's pitch for hyperspectral is camouflage, and the authors say cutting false alarms can drop real hits and stricter settings can hide camouflaged objects. "
                    "Drawn as Specs, a faced Pi board, a mute stopwatch, a DBSCAN bouncer at a velvet rope, red GPS pins on a clipboard search grid, two dioramas with their own thresholds, a coin with 99 and 29 on its faces, and an inked CLEARED stamp that a pin stops and flips to NOT CLEARED."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "top-down-map", "motion_vector": "assemble-build", "hero_treatment": "data-as-subject", "layout": "map-territory",
                        "register": "editorial-schematic", "palette": PALETTE, "camera_strategy": "aerial-descent",
                        "light_story": "overcast-diffuse",
                        "metaphor": "red pins that a searcher can trust on a clipboard grid, fog over the ground they never flagged, and a CLEARED stamp that a pin stops mid-air and flips to NOT CLEARED"},
        "signature_shot": 11,
        "palette": PALETTE,
        "divergence_note": ("The last two films were an apricot-to-plum dusk on lavender river ice with sample tubes, a cargo drone and a scarlet ribbon (11-23), and a blue-hour lab bench under the Chugach with a felt canary and a cobalt wall (11-22). "
                            "This film is flat overcast July daylight over olive and khaki tundra and a grey mudflat, seen mostly from above as a survey: a clipboard search grid, two dioramas, a coin, survey stakes. Its motion assembles (pins accumulate, layers stack) instead of 11-23's lateral traverse or 11-22's rise, its hero is a faced circuit board and its colour story is signal red for flags alone against a spectral rainbow for the machine's view. "
                            "Honest overlaps: a small quadcopter (11-23 had a big cargo drone; here the aircraft has no face and is only the carrier), a stamp (house grammar), and boxed org cards."),
        "treatment": {"title": "Trust the Flag", "summary": ad["treatment"], "judge_reasoning": tr[1] if len(tr) > 1 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "Overhead, overcast July tundra by a grey Bering Sea strip, and at 0.2 s a rainbow scanline with a squinting face sweeps down across a pair of olive waders in the grass",
                 "headline": "ONE LINE AT A TIME", "motion_by_s": 0.2,
                 "loopback": "Frame 1 is the scanline sweeping the tundra toward the waders; the last shot is the scanline sweeping the clipboard grid again over the fog stamped NOT CLEARED."},
        "open_loop": {"plant_t": b_at(36), "pay_t": b_at(35), "plant_glow_s": 0.4, "plant_sfx": "slide", "what": "Will anyone stamp the empty ground CLEARED? Planted as the inked CLEARED stamp rocks beside the blank clipboard grid in the opening, carried as Specs side-eyes it at the first pin, paid when it swings at the fog, a pin stops it and it flips to NOT CLEARED, KEEP LOOKING."},
        "open_loop_2": {"plant_t": b_at(11), "pay_t": b_at(28), "what": "Is the bouncer always right? Planted as the DBSCAN bouncer waves a lone stray pixel off the velvet rope and Specs approves, paid when the same bouncer, same clipboard, same shrug turns away the drab jacket's faint pixels with the false alarms, tagged ILLUSTRATION, the authors' general warning that cutting false alarms can drop real hits."},
        "throughline": {"object": "the clipboard search grid", "lands_in_button": "the grid with red pins glowing GO LOOK and the fogged swamp grass stamped NOT CLEARED, KEEP LOOKING",
                        "states": [
                            {"at_s": b_at(36), "state": "G1 BLANK, one pin copied on, the CLEARED stamp waiting"},
                            {"at_s": b_at(9), "state": "G1b clipped beside Specs, striped with rainbow scan bands as the lines pour in faster than he can read, the stamp still waiting"},
                            {"at_s": b_at(13), "state": "G2 a GPS reticle collapses into the first solid pin"},
                            {"at_s": b_at(19), "state": "G3 CROWDED with wobbling pins, the mudflat half"},
                            {"at_s": b_at(25), "state": "G4 a few solid pins and wide blank ground fogging over, NOT THE SILENCE"},
                            {"at_s": b_at(32), "state": "G5 its pins become the top layer of the layer cake, nothing erased"},
                            {"at_s": b_at(35), "state": "G6 pins glowing, the fog stamped NOT CLEARED, KEEP LOOKING"}]},
        "reveals": [
            {"t": b_at(5), "type": "build-on", "what": "the crayon box unfolds into 150 spectrum crayons", "hold_s": 0.6},
            {"t": b_at(12), "type": "build-on", "what": "the stopwatch settles under its 10 MS mark", "hold_s": 0.6},
            {"t": b_at(21), "type": "scale-pullback", "what": "the split wall reveals the second diorama beside the first", "hold_s": 0.8},
            {"t": b_at(24), "type": "morph-to-chart", "what": "the 99 and 29 badges fuse into one coin", "hold_s": 0.8},
            {"t": b_at(30), "type": "scale-pullback", "what": "the camera pulls wide on the stakes fencing both dioramas", "hold_s": 0.6},
            {"t": b_at(32), "type": "build-on", "what": "the pin layer stacks onto QSAR's layer", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.0}, {"line": 3, "offset": 0.0, "level": 1.2}, {"line": 7, "offset": 0.0, "level": 0.9},
            {"line": 10, "offset": 0.0, "level": 1.1}, {"line": 13, "offset": 0.0, "level": 0.6}, {"line": 18, "offset": 0.0, "level": 1.1},
            {"at_s": round(b_at(35) - 0.6, 3), "level": 0.35}, {"at_s": round(b_at(35) + 0.4, 3), "level": 1.3},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(34) - 0.4, 3), "riser_at": round(b_at(33) - 1.0, 3), "silence_at": round(b_at(34) - 0.4, 3),
            "payoff_at": b_at(35), "button_pattern": "callback", "interrupt_at": b_at(24), "extra_dips": []},
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
    book.raise_if_missing("board_1124 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1124Ids.ts").write_text(
        "// GENERATED by scripts/board_1124.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
