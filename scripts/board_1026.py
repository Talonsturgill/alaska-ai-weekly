#!/usr/bin/env python3
"""2026-10-26 "Not Yes or No": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1026.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1026.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

Beats anchor to (vo_line, a spoken word or a fraction of the line), so the film re-times itself with the voice.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board_anchor import AnchorBook  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"
LINES = [l.strip() for l in (OUT / "vo_script.txt").read_text().splitlines() if l.strip()]

W = lambda w, n=1: (w, n)
# key, shot, line, anchor, sfx, subject, action, emotion, annotation, shows, reaction, rehook
B = [
 (1, 1, 0, 0.0, "thunk", "the BallotBox", "spits a big YES / NO ballot slip out of its slot mouth with squash and overshoot", "blank", "DATA CENTERS?",
  "a bright polling-place hall, a steel-blue ballot box with a slanted lid and a face spits a cream ballot slip out of its mouth slot, the slip reads DATA CENTERS? over two big boxes YES and NO",
  "the seal ribbon sways and the slip flutters", "plant: what happens to a yes or no slip"),
 (2, 1, 0, W("candidates"), "tick", "the pen", "swings between the YES box and the NO box and stops, sweating", "sweat", "YES · NO",
  "a pen swings between YES and NO and stops in midair, the BallotBox squints with a sweat drop",
  "the pen wobbles and the box blinks", ""),
 (3, 1, 0, W("data"), "pop", "the two boxes", "soften and drip down the slip like butter", "worried", "THE SLIP MELTS",
  "the YES and NO boxes soften and drip down the slip, the BallotBox leans back worried",
  "the drips run down the paper", ""),
 (4, 1, 0, W("November"), "bloop", "three rails", "set from the drips on the slip while a stamp lands in the corner", "ask", "VOTING OPEN · ELECTION DAY NOVEMBER 3RD",
  "the drips set into three ink-blue rails with sliding knobs labelled SIZE, PLACE and WHO PAYS, and a plate stamps VOTING OPEN, ELECTION DAY NOVEMBER 3RD",
  "the knobs glide and the box squints", ""),
 (5, 2, 1, 0.0, "slide", "twelve lecterns", "slide up from the stage floor in two rows as brick curtains part", "plain", "FAIRBANKS-AREA FORUM",
  "brick-red curtains part on a wood forum stage and twelve faceless lectern silhouettes slide up in two rows with blank name cards, a boxed tag reads FAIRBANKS-AREA FORUM",
  "the lecterns settle and the curtain sways", ""),
 (6, 2, 1, W("twelve"), "pop", "the name cards", "light up one by one along the rows", "plain", "12 FAIRBANKS-AREA CANDIDATES · RULES + LOCAL INPUT",
  "the twelve name cards light up one by one, a plate reads 12 FAIRBANKS-AREA CANDIDATES, RULES + LOCAL INPUT",
  "the cards pulse and the rows settle", ""),
 (7, 2, 1, W("generally"), "clack", "the busts", "nod together, most of them, two a beat late", "plain", "GENERALLY AGREED",
  "most of the lectern silhouettes nod together and two nod a beat late, a plate reads GENERALLY AGREED",
  "the nods ripple along the rows", ""),
 (8, 2, 1, W("rules"), "thunk", "RULES signs", "lift on most lecterns, two lift late", "plain", "RULES · LOCAL INPUT",
  "a small sign reading RULES lifts on most lecterns and a second reads LOCAL INPUT, two lecterns lift late",
  "the signs sway", ""),
 (9, 2, 1, W("per"), "slide", "newspaper tag", "swings in on a hook from the stage frame", "plain", "PER THE FAIRBANKS DAILY NEWS-MINER",
  "a small newspaper tag swings in on a hook reading PER THE FAIRBANKS DAILY NEWS-MINER, MID OCTOBER",
  "the tag swings and settles", ""),
 (10, 3, 2, 0.0, "whoosh", "the slip", "lifts off and flies along a rail, then drops face down into an IN tray", "plain", "A BILL",
  "the cream slip lifts and flies along an ink-blue rail, dropping face down into a wooden IN tray with a LATER tab, a plate reads A BILL",
  "the tray rocks and dust puffs", "plant: what is in that bill"),
 (11, 3, 2, W("Hold"), "thunk", "the LATER tab", "slaps the BallotBox's reaching arm away from the tray", "ask", "HOLD THAT THOUGHT",
  "the BallotBox reaches for the sheet and the LATER tab slaps its arm away, a plate reads HOLD THAT THOUGHT",
  "the tab flips and the box blinks", ""),
 (12, 4, 3, 0.0, "snap", "the lecterns", "slide apart across the stage floor", "plain", "THEN THEY SPLIT",
  "the twelve lecterns slide apart across the stage floor on their bases, a plate reads THEN THEY SPLIT",
  "the lecterns skid and settle", ""),
 (13, 4, 3, W("three"), "clink", "three lecterns", "haul a padlocked gate across the stage together", "plain", "3 BACK A STATE MORATORIUM",
  "three lecterns haul a padlocked gate across the stage floor, a plate reads 3 BACK A STATE MORATORIUM",
  "the gate swings and the lock clinks", ""),
 (14, 4, 3, W("study"), "tick", "the key", "slides up labelled STUDY and hovers at the keyhole while the lock stays shut", "plain", "UNTIL ALASKA CAN STUDY IT",
  "a brass key labelled STUDY slides up and hovers in front of the padlock's keyhole, the lock stays shut, a plate reads UNTIL ALASKA CAN STUDY IT",
  "the key glints and hovers", ""),
 (15, 5, 4, W("Rentzel"), "slide", "the WHO PAYS rail", "glides in beside a brass cash register", "plain", "RENTZEL · SOME SORT OF TAX",
  "the WHO PAYS rail glides to centre beside a brass cash register, a plate reads RENTZEL, SOME SORT OF TAX",
  "the knob glides and the bell rings", "rehook: who pays"),
 (16, 5, 4, W("tax"), "ching", "the cash register", "pops its drawer open as the knob slides to TAX", "plain", "TAX",
  "the register drawer pops open as the knob slides to TAX", "the drawer rattles", ""),
 (17, 5, 4, W("Aimee"), "slide", "the envelope", "slides in and tilts open beside the rail", "plain", "MOORE",
  "a mail envelope addressed EVERY ALASKAN slides in and tilts open, a plate reads MOORE",
  "the envelope flaps", ""),
 (18, 5, 4, W("Alaskan"), "coins", "dashed coins", "pour from the envelope toward a row of identical mail slots and hover outlined above them", "plain", "COULD PAY A DIGITAL DIVIDEND",
  "dashed outlined coins pour from the envelope toward a row of identical mail slots along the desk and hover above them, a plate reads COULD PAY A DIGITAL DIVIDEND",
  "the coins drop into the slots", ""),
 (19, 6, 5, 0.0, "whoosh", "a painted map", "unrolls with a south pin and a far north pin", "plain", "SOUTH ANCHORAGE · HOUSE RACE",
  "a painted map of Alaska unrolls with a pin at the south coast and a far pin on the north coast, a boxed tag reads SOUTH ANCHORAGE, HOUSE RACE",
  "the map ripples and the pins pulse", ""),
 (20, 6, 5, W("Holland"), "bloop", "a small shed", "pops up at the south pin with an outlet", "calm", "HOLLAND · MODEST · PURPOSE-BUILT",
  "a small shed-sized building with a plain door pops up at the south pin, a plate reads HOLLAND, MODEST, PURPOSE-BUILT",
  "the shed bobs", ""),
 (21, 6, 5, W("Boyle"), "rumble", "a huge hall", "rolls on a rail from the south pin up the map to the north pin", "plain", "BOYLE · OPEN TO LARGE",
  "a huge hall rolls on a rail from the south pin far up the map to the north pin, a plate reads BOYLE, OPEN TO LARGE",
  "the hall rumbles along the rail", ""),
 (22, 6, 5, W("especially"), "swell", "the camera", "pulls back across the whole distance and a power cord dangles unplugged from a corner knob", "ask", "NORTH SLOPE",
  "the camera pulls back across the whole distance to a tag NORTH SLOPE, a green power cord from the WHO PAYS knob in the map corner dangles in the air, plugged into nothing",
  "the cord sways and the pins pulse", "plant: the unplugged cord"),
 (23, 7, 6, 0.0, "slide", "two governor lecterns", "slide in as brick curtains part, each holding a plain YES / NO slip", "plain", "FOR GOVERNOR · POSITIONS FROM SEPTEMBER",
  "brick-red curtains part on two faceless governor lecterns with name cards, a boxed tag reads FOR GOVERNOR, POSITIONS FROM SEPTEMBER",
  "the lecterns settle", ""),
 (24, 7, 6, W("Dave"), "tick", "Bronson's card", "lights up on the first lectern", "plain", "BRONSON",
  "the first lectern's card BRONSON lights up", "the card pulses", ""),
 (25, 7, 6, W("believer"), "pop", "a pen", "ticks the YES box firmly on the plain YES / NO slip held at the first lectern", "plain", "BRONSON · BIG BELIEVER · SAID IN SEPTEMBER",
  "a pen ticks the YES box on a plain unmelted YES / NO slip at the first lectern, a plate reads BRONSON, BIG BELIEVER, SAID IN SEPTEMBER",
  "the pennant flaps", ""),
 (26, 7, 6, W("Treg"), "tick", "Taylor's card", "lights up on the second lectern", "plain", "TAYLOR",
  "the second lectern's card TAYLOR lights up", "the card pulses", ""),
 (27, 7, 6, W("embrace"), "flap", "a pen", "ticks the YES box on the plain YES / NO slip held at the second lectern", "plain", "TAYLOR · EMBRACE IT",
  "a pen ticks the YES box on a plain unmelted YES / NO slip at the second lectern, a plate reads TAYLOR, EMBRACE IT",
  "the pennant flaps", ""),
 (28, 8, 7, 0.0, "slide", "Wilson's lectern", "slides in beside the silhouette of a vast hall", "plain", "A VAST HALL",
  "a lectern slides in beside the silhouette of a vast hall",
  "the lectern settles", "rehook: the line at hyperscale"),
 (29, 8, 7, W("candidate"), "tick", "Wilson's card", "lights up on the lectern", "plain", "WILSON · SEPTEMBER",
  "the lectern card WILSON lights up, a plate reads WILSON, SEPTEMBER", "the card pulses", ""),
 (52, 8, 7, W("allow"), "creak", "Wilson's arm", "reaches up from the lectern and pulls a navy limit card down toward the vast hall's roofline", "alarm", "NEVER",
  "an arm reaches up from the lectern and pulls a navy limit card down toward the vast hall's roofline", "the card sways", ""),
 (30, 8, 7, W("hyperscale"), "thump", "the limit card", "slams onto the roofline with a ring of paper dust", "alarm", "NEVER LITTERED WITH HYPERSCALE",
  "the limit card slams onto the vast roofline, a plate reads NEVER LITTERED WITH HYPERSCALE",
  "the dust settles", ""),
 (31, 9, 8, 0.0, "snap", "Kreiss-Tomkins's lectern", "swings in beside a padlocked gate", "plain", "KREISS-TOMKINS · SEPTEMBER",
  "a lectern with the card KREISS-TOMKINS swings in beside the padlocked gate, a plate reads KREISS-TOMKINS, SEPTEMBER",
  "the gate sways", ""),
 (32, 8, 8, W("moratorium"), "clink", "the padlock", "clinks as the key slot lights", "plain", "UNTIL A FRAMEWORK",
  "the padlock clinks and its keyhole lights, a plate reads UNTIL A FRAMEWORK",
  "the lock clinks", ""),
 (33, 8, 8, W("passes"), "tick", "a dashed key", "sheet-shaped outline drops into view and hovers at the keyhole", "ask", "A FRAMEWORK · NOT WRITTEN YET",
  "a dashed sheet-shaped key outline labelled A FRAMEWORK drops into view and hovers at the keyhole, a plate reads A FRAMEWORK, NOT WRITTEN YET",
  "the dashed key pulses", ""),
 (34, 9, 9, 0.0, "creak", "a power pole", "slides in as the curtains part on dusk and its green line drops into a deep slack curve", "plain", "IN THE INTERIOR",
  "curtains part on a dusk Interior with a power pole whose aurora-green line drops into a slack curve, a boxed tag reads IN THE INTERIOR",
  "the line sways", ""),
 (35, 9, 9, W("Harmony"), "ping", "the alert lamp", "flickers on as the pole bends", "worried", "TOMASZEWSKI",
  "the alert lamp on the pole flickers on as the pole bends under the line, a plate reads TOMASZEWSKI",
  "the lamp flickers", ""),
 (36, 9, 9, W("grid"), "hit", "the lamp", "flares as the line sags lower, the WHO PAYS knob on a small rail jams, and the BallotBox at the foot of the pole lets its ribbon drop", "worried", "THE GRID ISN'T READY",
  "the lamp flares, the WHO PAYS knob on a small rail jams and shakes, the BallotBox at the pole's foot lets its ribbon drop, a plate reads THE GRID ISN'T READY, and a small label reads GOLDEN VALLEY ELECTRIC, RECENT ENERGY ALERT",
  "the lamp flares and the ribbon droops", ""),
 (37, 9, 9, W("Mike"), "slide", "a borough counter", "slides in beside the pole", "plain", "PRAX · HANEY",
  "a small borough counter slides in beside the pole, a plate reads PRAX, HANEY", "the counter settles", ""),
 (53, 9, 9, W("zoning"), "bell", "the service bell", "rings and the PLACE knob on the small rail slides to LOCAL", "plain", "ZONING IS LOCAL",
  "the service bell rings and the PLACE knob on the small rail slides to LOCAL, a plate reads ZONING IS LOCAL", "the bell shivers", ""),
 (38, 10, 10, 0.0, "snap", "two buildings", "slide in, the small shed and the huge hall, and the dangling cord swings across and plugs into the shed with a green flash, a dashed line between them and the sagging pole at the edge", "plain", "HOLLAND AND BOYLE",
  "the small shed and the huge hall slide in under the dusk sky with a dashed unlit green line labelled INVESTMENT drawn between them and the sagging pole at the frame edge, a plate reads HOLLAND AND BOYLE",
  "the dashes crawl", "pay: the cord plugs in"),
 (39, 10, 10, W("energy"), "hit", "the dangling cord", "fills the dashed line in at last, green and whole", "calm", "BOTH SEE ENERGY INVESTMENT",
  "the dangling cord swings across and plugs into the shed with a green flash and the dashed line fills in, a plate reads BOTH SEE ENERGY INVESTMENT",
  "the green line pulses", ""),
 (40, 11, 11, 0.0, "thunk", "the LATER tab", "flips over on the IN tray to read NOW under a single lamp", "ask", "THE RULE?",
  "a close IN tray under a single lamp, the face-down sheet inside it and the LATER tab flipping over to read NOW, a plate reads THE RULE?",
  "the tab flips and the lamp glows", ""),
 (41, 11, 12, W("Senate"), "page", "the sheet", "flips over in the IN tray and the tray lamp glows", "plain", "SENATE · 14 TO 5",
  "the tray lamp glows and the face-down sheet flips over, a plate reads SENATE, 14 TO 5",
  "the sheet settles and the lamp glows", "rehook: the bill flips over"),
 (42, 11, 12, W("bill"), "pop", "the sheet text", "types its two headings in", "plain", "UTILITY POWER USE · DECOMMISSIONING PLANS",
  "the sheet types two headings UTILITY POWER USE and DECOMMISSIONING PLANS with a plug icon and a crane icon",
  "the text types", ""),
 (43, 11, 12, W("decommissioning"), "thunk", "the stamp", "taps the sheet", "plain", "THE BILL · POWER RULES + DECOMMISSIONING",
  "a plate reads THE BILL, POWER RULES + DECOMMISSIONING, and a rubber stamp taps SENATE PASSED beside it",
  "the stamp lifts", ""),
 (44, 12, 13, 0.0, "thunk", "the chamber doors", "slide in at the end of a long corridor while the camera pulls back from the sheet on a side table outside", "plain", "HOUSE · NEVER TOOK IT UP",
  "the camera pulls back from the bill sheet on a side table to a long corridor that ends in two tall chamber doors marked HOUSE far away, the sheet untouched, a plate reads HOUSE, NEVER TOOK IT UP",
  "dust drifts across the table", "reveal: the sheet is a long way from the doors"),
 (45, 12, 13, W("took"), "bell", "the session bell", "rings and the corridor lights go out one by one down the hall", "plain", "SESSION ENDED",
  "a brass session bell on a post rings and the corridor lights go out one by one down the hall, a small plate reads SESSION ENDED",
  "the bell swings", ""),
 (46, 12, 13, W("return"), "pop", "sponsor tag", "swings in on a hook", "plain", "SPONSOR LÖKI TOBIN RETURNS NEXT YEAR",
  "a small tag swings in on a hook reading SPONSOR LÖKI TOBIN, RETURNS NEXT YEAR",
  "the tag swings", ""),
 (47, 13, 14, 0.0, "slide", "the blank sheet", "slides in headed NEXT SESSION with two pens hovering over it", "ask", "A STATE RULE · NEXT SESSION?",
  "a blank cream sheet headed NEXT SESSION slides in and two pens hover over it, one with a dome on its cap and one with a counter bell on its cap that is already writing a short line in the margin",
  "the pens hover and the sheet sways", ""),
 (48, 13, 14, W("size"), "tick", "the SIZE knob", "pulses on its rail", "plain", "SIZE",
  "the three rails return beside the sheet and the SIZE knob pulses", "the knob pulses", ""),
 (49, 13, 14, W("place"), "tock", "the PLACE knob", "pulses", "plain", "PLACE",
  "the PLACE knob pulses on its rail", "the knob pulses", ""),
 (50, 13, 14, W("pays"), "ping", "the WHO PAYS knob", "pulses with its green cord glowing", "plain", "WHO PAYS",
  "the WHO PAYS knob pulses and its green cord glows", "the cord glows", ""),
 (51, 13, 14, W("decides"), "thunk", "the BallotBox", "swallows the blank sheet and spits out a fresh slip with three blank rails and no boxes", "ask", "WHICH ONE?",
  "the BallotBox swallows the blank sheet and spits out a fresh slip with three rails and no YES or NO boxes, the same pose as the first frame",
  "the slip flutters", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "wide-establish", "medium", "eye", "polling-hall", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "",
  "The slip", "A bright polling-place hall where the BallotBox spits a YES / NO slip whose boxes melt into three rails."),
 (2, 1, "wide-establish", "wide", "eye", "forum-booth", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "carried-element", "carry",
  "Twelve lecterns", "Brick curtains part on a forum stage of twelve lecterns whose cards light up one by one."),
 (3, 2, "subject-portrait", "close", "low", "tray-booth", "macro-closeup", "single-object-void", "vertical-descent", "structure-as-subject", "carried-element", "carry",
  "The slip in the tray", "The slip flies along a rail and drops face down in an IN tray with a LATER tab."),
 (4, 3, "wide-establish", "wide", "eye", "gate-stage", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "multiplicity-swarm", "hard-cut", "match",
  "Then they split", "Twelve lecterns slide apart and three haul a padlocked gate while a STUDY key hovers."),
 (5, 4, "alt-vantage", "medium", "high", "pay-desk", "overhead", "stacked-layers", "vertical-descent", "instrument-as-subject", "whip-pan", "travel",
  "Who pays", "The WHO PAYS rail beside a cash register and an envelope pouring coins into mail slots."),
 (6, 5, "map-territory", "extreme-wide", "high", "painted-map", "top-down-map", "map-territory", "vertical-descent", "landscape-as-subject", "hard-cut", "match",
  "Shed or hall", "A painted map where a shed sits at the south pin and a huge hall rolls north to the far pin."),
 (7, 6, "two-up", "medium", "eye", "governor-booth", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "carried-element", "carry",
  "For governor", "Curtains part on two governor lecterns, each lifting a plain pennant."),
 (8, 7, "two-up", "wide", "low", "governor-booth-2", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "structure-as-subject", "carried-element", "carry",
  "A line at hyperscale", "Wilson's lectern reaches up and pulls a limit card down onto the roofline of a vast hall."),
 (14, 8, "subject-portrait", "close", "eye", "gate-lectern", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "match-cut", "match",
  "Until a framework", "Kreiss-Tomkins's lectern beside the padlocked gate and a dashed sheet-shaped key labelled A FRAMEWORK."),
 (9, 9, "wide-establish", "wide", "low", "interior-dusk", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "landscape-as-subject", "carried-element", "carry",
  "The grid", "A dusk Interior with a sagging power pole, an alert lamp and a borough counter bell."),
 (10, 10, "two-up", "wide", "eye", "two-buildings", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "match-cut", "match",
  "Same line", "A shed and a hall under a dashed line that fills in when the dangling cord plugs in."),
 (11, 11, "subject-portrait", "medium", "eye", "hearing-room", "eye-level-immersive", "single-object-void", "vertical-rise", "data-as-subject", "hard-cut", "match",
  "The bill flips", "A blank rule board, then the tray's sheet flips to SENATE 14 TO 5 and types its two headings."),
 (12, 13, "wide-establish", "wide", "eye", "chamber-corridor", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "structure-as-subject", "hard-cut", "match",
  "Never took it up", "A corridor ending in HOUSE chamber doors where the bill lies on a side table as a session bell rings and the lights go out."),
 (13, 14, "wide-establish", "medium", "eye", "polling-hall-button", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "hard-cut", "match",
  "Which one decides", "A blank FIRST RULE UNWRITTEN sheet with two pens over it and the three rails, then the BallotBox swallows it and spits out the opening slip."),
]

AMBIENT = {
 1: "the seal ribbon sways, the slip flutters, light drifts through the high windows",
 2: "lecterns nod and settle, the curtain sways, spot lights drift",
 3: "dust drifts, the tray rocks, the lamp hums, the LATER tab flips",
 4: "lecterns skid and settle, the gate swings, the key glints",
 5: "knobs glide, the register drawer rattles, coins roll, the envelope flaps",
 6: "the map ripples, pins pulse, the hall rumbles, the cord sways",
 7: "stage lights sway, pennants flap, the cards pulse",
 8: "the limit card hums, the gate sways, the dashed key pulses, dust drifts",
 9: "the line sags and sways, the lamp flashes, the bell shivers, the dusk breathes",
 10: "building lights flicker, the dashes crawl, the cord sways",
 11: "the lamp glows, the board sways, the sheet types, the stamp lifts",
 12: "dust drifts, the bell swings, the lights go out, the tag swings",
 13: "the pens hover, the sheet sways, knobs pulse, the ribbon sways",
 14: "the gate sways, the dashed key pulses, dust drifts, the lectern settles",
}
CENTER = {1: "the BallotBox and the slip at x540 y960", 2: "the lectern rows at x540 y960", 3: "the tray at x540 y1000", 4: "the gate at x540 y960", 5: "the rail at x540 y980",
          6: "the map at x540 y960", 7: "the governor lecterns at x540 y1000", 8: "the lectern and hall at x540 y980", 9: "the pole at x540 y1000", 10: "the two buildings at x540 y1000",
          11: "the board and tray at x540 y1000", 12: "the chamber doors at x540 y1000", 13: "the BallotBox and the sheet at x540 y960", 14: "the lectern and gate at x540 y1000"}
HERO = {
 1: ("the BallotBox + slip + rails", "50% BallotBox, 35% slip, 15% rails"),
 2: ("twelve lecterns + cards + signs", "70% lecterns, 20% cards, 10% tag"),
 3: ("IN tray + the slip + LATER tab", "40% tray, 40% slip, 20% tab"),
 4: ("lecterns + padlocked gate + STUDY key", "40% lecterns, 40% gate, 20% key"),
 5: ("WHO PAYS rail + register + envelope + mail slots", "30% rail, 30% register, 40% envelope and slots"),
 6: ("painted map + shed + hall + cord", "45% map, 20% shed, 25% hall, 10% cord"),
 7: ("two governor lecterns + pennants", "60% lecterns, 40% pennants"),
 8: ("Wilson lectern + vast hall + limit card + gate + dashed key", "30% hall and card, 30% lectern, 40% gate and key"),
 9: ("power pole + alert lamp + counter bell", "50% pole, 20% lamp, 30% counter"),
 10: ("shed + hall + dashed line + cord", "25% shed, 40% hall, 20% line, 15% cord"),
 11: ("rule board + IN tray + bill sheet", "25% board, 30% tray, 45% sheet"),
 12: ("chamber doors + side table + bill + session bell", "35% doors, 30% table, 35% bell"),
 13: ("BallotBox + blank sheet + two pens + three rails", "35% BallotBox, 30% sheet and pens, 35% rails"),
 14: ("Kreiss-Tomkins lectern + padlocked gate + dashed sheet key", "30% lectern, 45% gate, 25% key"),
}
PARTS = {1: 52, 2: 60, 3: 44, 4: 54, 5: 50, 6: 56, 7: 48, 8: 54, 9: 50, 10: 48, 11: 52, 12: 46, 13: 54, 14: 48}
KICKS = (3, 21, 41)
STAGE3D = {k: "planes" for k in range(1, 15)}
CAMERA = {1: "riseWith", 2: "truckAcross", 3: "dollyThrough", 4: "craneDown", 5: "craneDown", 6: "craneDown", 7: "dollyThrough",
          8: "truckAcross", 9: "dollyThrough", 10: "truckAcross", 11: "riseWith", 12: "dollyThrough", 13: "dollyThrough", 14: "truckAcross"}


def est_starts():
    t, out = 0.0, {}
    for i, s in enumerate(LINES):
        out[i] = t
        t += len(s.split()) * 0.4345 + 0.6974 * len(re.findall(r"[.?!]", s)) + 0.15
    out["end"] = t
    return out


def line_starts():
    p = OUT / "vo_lines.json"
    if p.exists():
        v = json.loads(p.read_text())["lines"]
        starts = {x["idx"]: float(x["start"]) for x in v}
        starts["end"] = max(float(x["end"]) for x in v)
        return starts, True
    return est_starts(), False


def load_words():
    p = OUT / "audio" / "words.json"
    if not p.exists():
        return {}
    w = json.loads(p.read_text())
    ws = w["words"] if isinstance(w, dict) else w
    out = {}
    for x in ws:
        out.setdefault(int(x["seg"]), []).append(x)
    return out


def norm(s):
    return "".join(c for c in s.lower() if c.isalnum())


def _phrase(line, anc):
    words = LINES[line].split()
    if isinstance(anc, tuple):
        want, nth = anc
        hits = [i for i, w in enumerate(words) if norm(w) == norm(want)]
        if len(hits) >= nth:
            i = hits[nth - 1]
            return " ".join(words[i:i + 4])
    return " ".join(words[:4])



def build():
    starts, real = line_starts()
    end = starts["end"]
    words = load_words() if real else {}
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
    for (bid, shot, line, anc, sfx, subj, act, emo, ann, shows, reaction, rehook) in B:
        sh = shot_for(line)
        a = round(at(line, anc), 3)
        beats.append({
            "id": bid, "shot": sh, "at_s": a, "vo_line": line,
            "anchor": {"vo_line": line, "fraction": anc if not isinstance(anc, tuple) else 0.0, "offset": round(a - starts[line], 3)},
            "offset": round(a - starts[line], 3), "vo": LINES[line], "phrase": _phrase(line, anc),
            "shows": shows, "sfx": sfx, "means": ann.lower(), "rehook": rehook if rehook.startswith("rehook") else "",
            "draw": {"subject": subj, "action": act, "emotion": emo, "annotation": ann},
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
            "camera": CAMERA[sid], "transition_in": trans, "thread": thread, "stage3d": STAGE3D[sid],
            "centered": CENTER[sid], "means": means, "ambient": AMBIENT[sid],
            "hero": {"name": HERO[sid][0], "parts": PARTS[sid], "zones": 3, "detail_note": HERO[sid][1]},
            "id": idx, "start_s": st,
        })
    for i, s in enumerate(shots):
        nx = shots[i + 1]["start_s"] if i + 1 < len(shots) else end
        s["t"] = f"{s['start_s']:.3f}-{nx:.3f}"

    def b_at(i):
        return next(b for b in beats if b["id"] == i)["at_s"]

    palette = "pale sage hall walls, honey gym floor, cranberry booth curtains and flag, steel box with a parchment slip, ink-black rails, aurora lamps for electricity only"
    board = {
        "run_date": "2026-10-26", "slug": "not-yes-or-no", "title": "Not Yes or No",
        "concept": ("The Fairbanks Daily News-Miner (October 18th), the Anchorage Daily News (October 22nd) and the Alaska Beacon (September 18th and October 24th) report how Alaska's legislative and governor candidates answer the data center question, "
                    "and that the Senate passed a data center bill 14 to 5 that the House never took up. A steel-blue ballot box with a face, the BallotBox, spits out a YES / NO slip whose boxes melt into three sliding rails, SIZE, PLACE and WHO PAYS. "
                    "The film follows the slip across a forum stage of twelve podiums, an IN tray, a padlocked gate that a STUDY key opens, a cash register and a coin envelope, a painted map with a shed and a huge hall, a governor stage, a limit line at hyperscale, a sagging power pole, a counter bell, one green line that plugs two rival buildings in, the bill sheet flipping to SENATE 14 TO 5, a session bell, and a blank FIRST RULE UNWRITTEN sheet that the BallotBox swallows before spitting out the opening slip."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "push-in-only", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "naturalistic-scene", "palette": palette, "camera_strategy": "rail-glide-panels",
                        "light_story": "morning-to-dusk",
                        "metaphor": "a yes or no ballot slip whose boxes melt into three sliding rails: size, place and who pays"},
        "palette": palette,
        "divergence_note": ("The last films were a rain boardwalk of signs (10-25), a navy orbit (10-24), a paper building in snow (10-23) and a dark tundra bob (10-22). "
                            "This film is a bright indoor civic hall in sage and honey with a cranberry accent and aurora green for electricity only, built of a ballot slip, sliders, podiums, a padlocked gate and an IN tray. "
                            "There is no rain, no sign hero, no orbit, no cutaway ground, no paper creature, no remote, no pause button and no calendar. HONEST OVERLAP: its hero is a faced object for the fifth film in a row, but it is a hard steel box with a slot mouth and a flag."),
        "treatment": {"winner": "The Explainer's ballot slip that melts into three rails, with the Enthusiast's face-down bill sheet in the IN tray as the primary loop, the Dramatist's unplugged power cord as the secondary loop, and the Comedian's coin gag. The pause is a padlocked gate with a key, never a button.",
                      "why": "All four pitches converged on a YES / NO slip that becomes sliders. The thesis is that the argument is size, place and who pays, so the picture is a slip whose boxes melt into three rails, and the unfinished bill is the sheet that sat in the tray."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A bright polling hall where a steel-blue ballot box with a face spits out a big YES / NO ballot slip, a pen swinging between the two boxes and stopping, the boxes starting to sag.",
                 "headline": "NOT YES OR NO", "motion_by_s": 0.3,
                 "loopback": "The last frame is the BallotBox swallowing the blank NEXT SESSION sheet and spitting out a fresh slip with three blank rails in the same pose as the first frame, changed in state."},
        "open_loop": {"plant_t": b_at(10), "pay_t": b_at(41), "what": "One bill already tried to write the rules down, hold that thought. Planted as a sheet drops face down in an IN tray under a LATER tab, paid when the sheet flips over to SENATE 14 TO 5.",},
        "open_loop_2": {"plant_t": b_at(22), "pay_t": b_at(38), "what": "A power cord dangles unplugged from the WHO PAYS knob. Planted as the camera pulls back across the map, paid when one green line plugs both rival buildings in at BOTH SEE ENERGY INVESTMENT.",},
        "throughline": {"object": "the ballot slip", "lands_in_button": "the blank NEXT SESSION sheet that the BallotBox swallows before it spits out a fresh slip of three blank rails",
                        "states": [
                            {"at_s": b_at(1), "state": "a cream slip with two boxes YES and NO"},
                            {"at_s": b_at(4), "state": "the boxes melted into three rails SIZE, PLACE, WHO PAYS"},
                            {"at_s": b_at(25), "state": "an unmelted YES / NO slip at a lectern, ticked YES"},
                            {"at_s": b_at(14), "state": "the WHO PAYS rail alone with a register and an envelope"},
                            {"at_s": b_at(19), "state": "the SIZE rail slid far up the map, a cord dangling"},
                            {"at_s": b_at(25), "state": "the SIZE rail with a limit line at hyperscale"},
                            {"at_s": b_at(34), "state": "the bill sheet flipped over, SENATE 14 TO 5"},
                            {"at_s": b_at(37), "state": "the bill sheet untouched in the IN tray"},
                            {"at_s": b_at(40), "state": "a blank sheet headed FIRST RULE UNWRITTEN with a pen hovering"},
                            {"at_s": b_at(47), "state": "a blank sheet headed NEXT SESSION with two pens hovering, then a fresh slip of three blank rails"}]},
        "reveals": [
            {"t": b_at(6), "type": "scale-pullback", "what": "the forum stage reveals twelve podiums lighting up one by one", "hold_s": 0.7},
            {"t": b_at(22), "type": "scale-pullback", "what": "the camera pulls back across the whole map from the south pin to the far north pin", "hold_s": 0.8},
            {"t": b_at(42), "type": "build-on", "what": "the bill sheet types its two headings, utility power use and decommissioning plans", "hold_s": 0.8},
            {"t": b_at(48), "type": "morph-to-chart", "what": "the three rails return beside the blank sheet and pulse in turn", "hold_s": 0.7}],
        "tail_s": 3.2, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 0, "offset": 3.0, "level": 0.8}, {"line": 1, "offset": 0.0, "level": 0.55},
            {"line": 2, "offset": 0.0, "level": 0.5}, {"line": 3, "offset": 0.0, "level": 0.7}, {"line": 4, "offset": 0.0, "level": 0.6},
            {"line": 5, "offset": 0.0, "level": 0.8}, {"line": 6, "offset": 0.0, "level": 0.6}, {"line": 7, "offset": 0.0, "level": 0.45},
            {"line": 8, "offset": 0.0, "level": 0.35}, {"line": 9, "offset": 0.0, "level": 0.2}, {"line": 9, "offset": 4.0, "level": 0.14},
            {"line": 10, "offset": 0.0, "level": 0.6}, {"line": 11, "offset": 0.0, "level": 0.2}, {"line": 12, "offset": 0.0, "level": 0.7},
            {"line": 13, "offset": 0.0, "level": 0.5},
            {"at_s": round(b_at(48) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(48) + 0.8, 3), "level": 0.55},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "build_steps": 4, "dip_at": round(b_at(48) - 0.3, 3), "riser_at": round(b_at(41), 3), "silence_at": round(b_at(48) - 0.3, 3),
                      "payoff_at": b_at(48), "button_pattern": "callback", "interrupt_at": b_at(30), "extra_dips": [b_at(44)]},
        "shots": shots, "beats": beats,
    }
    board["throughline"]["states"].sort(key=lambda x: x["at_s"])
    order = sorted(board["beats"], key=lambda b: (b["at_s"], b["id"]))
    ids = {b["id"]: rank for rank, b in enumerate(order, 1)}
    for b in board["beats"]:
        b["key"] = b["id"]
        b["id"] = ids[b["key"]]
    board["beats"].sort(key=lambda b: b["id"])
    board["_ids"] = ids
    book.raise_if_missing("board_1026 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1026Ids.ts").write_text(
        "// GENERATED by scripts/board_1026.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
