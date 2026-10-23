#!/usr/bin/env python3
"""2026-10-23 "The Rule That Stops at the Fence": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1023.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1023.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "thunk", "Dotty", "snaps onto a snowy desk beaming as the stamp slams beside her", "proud", "THE WEATHER RULE IS A FORM",
  "Dotty the borough form snaps onto a snowy desk with a NEW sticker as an ink stamp slams beside her, a faint dashed teal box waiting empty at the foot of her page",
  "her cowlick bounces and the stamp's ink pad squashes", ""),
 (2, 1, 0, W("form"), "whoosh", "building", "pulls back to three floors with only the ground floor lit", "proud", "ONE LIT FLOOR OF THREE",
  "the camera pulls back from the desk to a three floor paper building in cutaway where only the ground floor glows marigold and Dotty waves from its window, the two floors above dark",
  "the lit window flickers and snow drifts past", ""),
 (3, 2, 1, 0.0, "thunk", "stamp", "strikes the date onto the form", "proud", "OCT 20TH · KENAI PENINSULA BOROUGH ASSEMBLY",
  "the ink stamp strikes OCT 20TH onto a big form in close up under a boxed plate, KENAI PENINSULA BOROUGH ASSEMBLY",
  "the strike makes the paper jump and the ink print blooms", ""),
 (4, 2, 1, W("effect"), "bloom", "parcel plane", "tilts in with the borough's own parcels glowing marigold", "proud", "IN EFFECT RIGHT AWAY",
  "a tilted snow plane of land parcels rises in with the borough's own parcels glowing marigold and the rest left snow white and spruce, IN EFFECT RIGHT AWAY",
  "the dashed parcel borders crawl and snow drifts", ""),
 (5, 2, 2, 0.0, "tap", "Dotty", "walks onto a marigold parcel", "proud", "BOROUGH LAND · LEASE OR PERMIT",
  "Dotty walks in on her paper legs and stands on a marigold parcel under a sign, BOROUGH LAND, LEASE OR PERMIT",
  "her boots plant and her sheet sways", ""),
 (6, 2, 2, W("permit"), "snap", "tack", "pins Dotty to the parcel", "proud", "COMMERCIAL LEASE OR LAND USE PERMIT",
  "a red tack drops onto Dotty's page and pins her to the parcel while a plate reads COMMERCIAL LEASE OR LAND USE PERMIT",
  "the tack bounces and her page flutters", ""),
 (7, 3, 3, 0.0, "swell", "berry bush", "stands in snow beside ski tracks on a marigold parcel", "curious", "BERRY PICKING · SKIING",
  "a snowy marigold parcel with a berry bush and a pair of ski tracks, BERRY PICKING, SKIING, Dotty watching from beside it",
  "the bush sways and a skier's tracks draw on", ""),
 (8, 3, 3, W("banned"), "stamp", "NO sign", "slaps down over the bush and the tracks", "firm", "GEOENGINEERING BANNED · CASUAL-USE LAND",
  "a red NO sign slaps down over the parcel and a plate reads GEOENGINEERING BANNED, CASUAL-USE LAND, while Dotty flexes proudly",
  "the sign rattles and the bush shivers", ""),
 (9, 4, 4, 0.0, "pop", "Dotty", "reads her own boxes aloud as they pop open", "proud", "THE FORM ASKS",
  "close up on Dotty as her four boxes pop open one after another and she reads them aloud, the first box typing in CHEMICALS",
  "her eyes drop to each box in turn and the cowlick sways", ""),
 (10, 4, 4, W("flares"), "click", "FLARES box", "types in", "proud", "FLARES",
  "the FLARES box types in and a tick pops",
  "the typed ink flickers on", ""),
 (11, 4, 4, W("often"), "click", "FLIGHTS box", "types in", "proud", "HOW OFTEN · HOW LONG",
  "the FLIGHTS box types in with how often and how long and a tick pops",
  "the typed ink flickers on", ""),
 (12, 4, 4, W("outcome"), "ding", "INTENDED OUTCOME box", "fills last and ticks", "beam", "THE OUTCOME THEY INTEND",
  "the INTENDED OUTCOME box fills last and its marigold tick pops, Dotty beaming, while the faint dashed teal box below it stays empty",
  "her cheeks glow and the dashed box crawls", "rehook: the empty box"),
 (13, 5, 5, 0.0, "whoosh", "map", "slides in as the desk drops away and the camera lands on a snowy map of Kachemak Bay", "plain", "AUG 23RD · RAINMAKER · CALIFORNIA",
  "the desk drops away and a snowy map of the water and shore around Homer slides in with a calendar chip, AUG 23RD, and a kraft tag, RAINMAKER, CALIFORNIA",
  "the water shimmers and the snow drifts", ""),
 (14, 5, 5, W("drone"), "whir", "SeedDrone", "lifts off two launch sites and climbs", "plain", "A DRONE · TWO SITES",
  "a grey seeding drone lifts off from two launch pins and climbs northeast over the shore, A DRONE, TWO SITES",
  "the rotors blur and its shadow slides over the snow", "rehook: the drone"),
 (15, 5, 5, W("Homer"), "ping", "dashed line", "draws from Homer to the pins and a question lifts over the drone", "plain", "20 MILES NE OF HOMER",
  "a dashed line draws from a Homer pin to the launch pins, 20 MILES NE OF HOMER, and a small hollow WHOSE SKY question mark rises over the drone",
  "the dashes crawl and the question bobs", "plant: whose sky"),
 (16, 6, 6, 0.0, "pour", "silver iodide", "pours from the drone's rack in a thin stream", "plain", "ABOUT 375 G SILVER IODIDE · ITS REPORT",
  "the drone's flare rack pours a thin stream of silver iodide, ABOUT 375 G SILVER IODIDE, ITS REPORT, over a pinch sized pile",
  "the stream shimmers and the rotors blur", ""),
 (17, 6, 6, W("Rainmaker"), "tick", "kraft tag", "swings in over a square map tile", "plain", "RAINMAKER SAYS",
  "a kraft tag, RAINMAKER SAYS, swings in over a square map tile marked 100 SQUARE MILES while the drone circles above",
  "the tag swings and the tile edges shimmer", ""),
 (18, 6, 6, W("hundredth"), "tick", "ruler", "marks a hairline on the tile", "plain", "ABOUT 0.01 IN OF RAIN",
  "a ruler tick marks a hairline height on the tile edge, ABOUT 0.01 IN OF RAIN",
  "the tick flashes and settles", ""),
 (19, 6, 6, W("nineteen"), "swell", "gallon counter", "rolls up while a sheet of water floods the tile", "plain", "RAINMAKER SAYS · 19 MILLION GALLONS",
  "a gallon counter rolls up to 19 MILLION GALLONS while a sheet of water floods the whole tile, RAINMAKER SAYS",
  "the counter rolls and the flood ripples", ""),
 (20, 6, 6, W("square"), "swoosh", "camera", "dives to the tile's edge where the flood is a hairline film", "curious", "ABOUT 0.01 IN · THE WHOLE FLOOD",
  "the camera dives to the tile's edge and the flood is a hairline film on the ground, ABOUT 0.01 IN, the counter shrinking to a decimal",
  "the film glints and the counter deflates", ""),
 (21, 7, 7, 0.0, "swell", "Stratus dial", "turns on a forecast panel", "plain", "ITS WORDS · STRATUS",
  "a forecast panel with a round Stratus dial turns, ITS WORDS, STRATUS, with real time weather ticks streaming in",
  "the dial turns and the ticks stream", "rehook: the software"),
 (22, 7, 7, W("picking"), "click", "dial needle", "clicks into a window and the drone follows", "plain", "PICKS THE SEEDING WINDOWS",
  "the needle clicks into a marked window on a time bar, PICKS THE SEEDING WINDOWS, and the drone slides along under it",
  "the needle settles and the window pulses", ""),
 (23, 8, 8, 0.0, "creak", "Dotty", "stands at the foot of the stair looking up", "curious", "SO WHAT CAN A BOROUGH REACH?",
  "the building returns in cutaway with Dotty at the foot of a stair in the lit ground floor looking up through two dark floors, SO WHAT CAN A BOROUGH REACH?",
  "her cowlick sways and the lit window flickers", "rehook: the stair"),
 (24, 8, 8, W("limited"), "thud", "painted line", "stops the stair at the ceiling of the lit floor", "plain", "\"LIMITED TO BOROUGH LANDS AT THIS POINT\" · MAYOR MICCICHE",
  "Dotty climbs and the solid stair stops at a painted borough line, a quote plate reads LIMITED TO BOROUGH LANDS AT THIS POINT, MAYOR MICCICHE, and the stair beyond it is only dashes",
  "her boots plant on the line and the dashes crawl", ""),
 (25, 8, 9, 0.0, "clank", "FAA hatch", "rattles its padlock far above the dashed stair", "wary", "\"THE FAA CONTROLS THE SKIES\" · MAYOR MICCICHE",
  "a locked round hatch with a padlock rattles at the top of the dashed stair, a quote plate reads THE FAA CONTROLS THE SKIES, MAYOR MICCICHE",
  "the padlock rattles and Dotty goes on tiptoe", ""),
 (26, 9, 10, 0.0, "hum", "STATE floor", "sits dark and empty with an unlit desk", "plain", "DNR · STATE LAW DOESN'T ADDRESS CLOUD SEEDING",
  "the camera drops to the middle floor, dark and empty with an unlit desk and a dashed stair running through it, a plate reads DNR, STATE LAW DOESN'T ADDRESS CLOUD SEEDING",
  "dust drifts through the dark room and the dashes crawl", ""),
 (27, 10, 11, 0.0, "swell", "Dotty", "squares up beside a huge weather book", "firm", "A LAND PERMIT · NOT A WEATHER GAUGE",
  "the view cuts to a warm paper desk where Dotty squares up beside a huge book, WEATHER SCIENCE, a plate reads A LAND PERMIT, NOT A WEATHER GAUGE",
  "the lamp sways and her cowlick bobs", "rehook: the fair case"),
 (28, 10, 11, W("measure"), "thump", "Dotty", "nods at the book", "proud", "SHE NEVER CLAIMED TO",
  "Dotty looks at the book, shrugs one noodle arm and nods",
  "her sheet settles and the lamp sways", ""),
 (29, 11, 12, 0.0, "tap", "mayor card", "lands on the left pan of a small balance and the pan drops", "plain", "MAYOR: THE BOROUGH WAS MISLED",
  "a name card on the left pan of a small balance, MAYOR MICCICHE, MISLED ABOUT WHAT RAINMAKER PLANNED, set beside a matching card on the right",
  "the pans bob a pixel", ""),
 (30, 11, 12, W("Rainmaker's"), "tap", "CEO card", "lands on the right pan and the balance levels", "plain", "RAINMAKER: HAD PERMISSIONS · COULD HAVE DONE MORE OUTREACH",
  "the matching card on the right pan, RAINMAKER'S CEO, HAD EVERY PERMISSION IT NEEDED, COULD HAVE DONE MORE OUTREACH, and the balance comes level",
  "the pans bob and settle level", ""),
 (31, 12, 13, 0.0, "whoosh", "bill", "slides under a tall door", "plain", "ASSEMBLY ASKED THE LEGISLATURE · BAN OR REGULATE",
  "a paper bill slides under a tall door, ALASKA LEGISLATURE, a plate reads ASSEMBLY ASKED THE LEGISLATURE, BAN OR REGULATE",
  "the bill slides and the door light flickers", "rehook: the ask"),
 (32, 12, 13, W("Homer's"), "tick", "Vance card", "sits dashed beside the door", "plain", "REP. VANCE · A BILL IF RE-ELECTED",
  "a dashed outline bill rests beside the door, a card reads REP. VANCE, A BILL IF RE-ELECTED, drawn in dashes because it is conditional",
  "the dashes crawl", "pay: whose sky"),
 (33, 13, 14, 0.0, "whir", "Dotty", "copies onto other parcels", "proud", "A TEMPLATE THE STATE COULD COPY",
  "a copier whirs and copies of Dotty land on other parcels of the tilted plane, A TEMPLATE THE STATE COULD COPY",
  "the copies bounce in one after another", ""),
 (34, 14, 15, 0.0, "ding", "Dotty", "holds up her filled boxes beside the dashed one", "wary", "IT ASKS WHAT A FLIGHT INTENDS",
  "close up on Dotty, her four boxes ticked and the dashed teal box below them lit and crawling, IT ASKS WHAT A FLIGHT INTENDS",
  "the dashes crawl and her eyes drop to the empty box", ""),
 (35, 14, 15, W("radar"), "ping", "radar sweep", "turns in a kraft plate", "plain", "ITS WORDS · RADAR AND SATELLITE CHECK",
  "a kraft plate with a radar sweep, ITS WORDS, RADAR AND SATELLITE CHECK, swings in beside Dotty",
  "the sweep turns and the plate swings", ""),
 (36, 15, 16, 0.0, "stamp", "NOT REPORTED", "stamps into the dashed box", "wobble", "NO OUTSIDE CHECK REPORTED",
  "a teal NOT REPORTED stamp lands in the dashed box, a plate reads NO OUTSIDE CHECK REPORTED, Dotty's eyes wide and her mouth wavy",
  "the stamp thuds and Dotty wobbles", "pay: the empty box"),
 (37, 16, 17, 0.0, "swell", "Dotty", "lifts the dashed box up like a question", "ask", "WHO ASKS WHAT CAME OUT?",
  "Dotty lifts the dashed box up on her raised arm like a question, WHO ASKS WHAT CAME OUT?",
  "the box wobbles and the dashes crawl", ""),
 (38, 16, 17, W("Who"), "swell", "building", "pulls back to dawn light on the dashed box", "ask", "ONE LIT FLOOR OF THREE",
  "the camera pulls back to the whole building at first light, the ground floor lit and a teal glint on the dashed box held up in its window",
  "the first dawn light slides over the window", ""),
 (39, 5, 5, W("company"), "tick", "kraft tag", "swings in", "plain", "RAINMAKER · CALIFORNIA",
  "a kraft tag, RAINMAKER, CALIFORNIA, swings in beside the shore and a small calendar chip flips to AUG 23RD",
  "the tag swings", ""),
 (40, 6, 6, W("grams"), "tick", "pinch pile", "grows under the stream", "plain", "A PINCH OF IT",
  "the thin silver stream builds a small pinch sized pile on a plate beside the drone",
  "the pile glints", ""),
 (41, 8, 8, W("mayor"), "tap", "mayor card", "slides in beside the stair", "plain", "MAYOR PETER MICCICHE",
  "a name card, MAYOR PETER MICCICHE, slides in beside the stair as Dotty starts to climb",
  "the card flutters and Dotty's boots start up", ""),
 (42, 9, 10, W("cloud"), "hum", "dashed stair", "keeps climbing through the dark floor", "plain", "NO RULE YET FOR CLOUD SEEDING",
  "the dashed stair keeps climbing through the dark empty floor toward the locked hatch, NO RULE YET FOR CLOUD SEEDING",
  "the dashes crawl upward", ""),
 (43, 11, 12, W("outreach"), "tick", "CEO card", "drops a second line onto the pan and the pan tips", "plain", "COULD HAVE DONE MORE OUTREACH",
  "a second line types onto the right hand card, COULD HAVE DONE MORE OUTREACH",
  "the line types on and the pans bob", ""),
 (44, 12, 13, W("ban"), "stamp", "BAN OR REGULATE", "stamps on the bill", "plain", "BAN, OR AT LEAST REGULATE",
  "two stamps land on the bill one after the other, BAN, then REGULATE",
  "the bill jumps under each stamp", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "wide-establish", "close", "eye", "snow-desk-to-building", "cross-section-cutaway", "stacked-layers", "vertical-rise", "single-organic-hero", "", "",
  "The form", "Dotty the application form snaps onto a snowy desk beside a slamming stamp, then the camera pulls back to a three floor building with only the ground floor lit."),
 (2, 1, "alt-vantage", "medium", "eye", "snow-parcel-plane", "top-down-map", "map-territory", "assemble-build", "single-organic-hero", "match-action", "match",
  "Borough land", "A stamp strikes the date, a tilted plane of parcels lights marigold where the borough owns it, and Dotty walks on and is pinned down."),
 (3, 3, "alt-vantage", "medium", "eye", "snow-parcel-plane", "top-down-map", "map-territory", "push-in-only", "landscape-as-subject", "whip-pan", "travel",
  "Berry picking and skiing", "A snowy marigold parcel with a berry bush and ski tracks gets a red NO sign."),
 (4, 4, "subject-portrait", "close", "eye", "paper-desk-lamp", "macro-closeup", "single-object-void", "radial-emanate", "single-organic-hero", "carried-element", "carry",
  "Her four boxes", "Dotty reads her own boxes aloud as chemicals, flares, flights and the intended outcome type in and tick."),
 (5, 5, "map-territory", "wide", "high", "snow-bay-map", "top-down-map", "map-territory", "horizontal-traverse", "landscape-as-subject", "whip-pan", "travel",
  "August 23rd", "A snowy map of Kachemak Bay, a drone lifts from two launch pins and a dashed line runs twenty miles northeast of Homer."),
 (6, 6, "wide-establish", "wide", "eye", "snow-bay-map", "cross-section-cutaway", "fullbleed-split", "vertical-descent", "data-as-subject", "match-cut", "match",
  "Nineteen million gallons", "A silver iodide stream, a square tile, a flood of water and a camera dive that shows the flood is a hairline film."),
 (7, 7, "alt-vantage", "medium", "eye", "forecast-panel", "instrument-screen", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "whip-pan", "travel",
  "Stratus", "A forecast panel with a turning dial and a needle that clicks into a seeding window while the drone follows."),
 (8, 8, "wide-establish", "wide", "eye", "building-cutaway", "cross-section-cutaway", "stacked-layers", "vertical-rise", "structure-as-subject", "match-cut", "match",
  "The stair that stops", "Dotty climbs a stair in the lit ground floor that stops at a painted line while a locked hatch rattles above."),
 (9, 10, "alt-vantage", "extreme-wide", "eye", "building-cutaway", "cross-section-cutaway", "single-object-void", "vertical-descent", "structure-as-subject", "carried-element", "carry",
  "The empty floor", "The camera drops to the dark empty middle floor where a dashed stair keeps going."),
 (10, 11, "two-up", "medium", "eye", "paper-desk-lamp", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "whip-pan", "travel",
  "The fair case", "On a warm paper desk Dotty squares up beside a huge weather science book and nods."),
 (11, 12, "two-up", "medium", "eye", "paper-desk-lamp", "eye-level-immersive", "fullbleed-split", "push-in-only", "data-as-subject", "match-action", "match",
  "Two accounts", "A small balance holds the mayor's card and Rainmaker's CEO's card, and it comes level."),
 (12, 13, "wide-establish", "wide", "eye", "legislature-door", "eye-level-immersive", "single-object-void", "horizontal-traverse", "structure-as-subject", "whip-pan", "travel",
  "The ask", "A paper bill slides under a tall door and a dashed bill rests beside it."),
 (13, 14, "alt-vantage", "medium", "high", "snow-parcel-plane", "top-down-map", "grid-modular", "multiplicity-swarm", "multiplicity-swarm", "match-cut", "match",
  "The template", "Copies of Dotty land across the tilted parcels."),
 (14, 15, "subject-portrait", "close", "eye", "paper-desk-lamp", "macro-closeup", "single-object-void", "radial-emanate", "single-organic-hero", "carried-element", "carry",
  "What it asks", "Dotty's filled boxes next to the lit dashed box and a radar sweep plate."),
 (15, 16, "subject-portrait", "close", "eye", "paper-desk-lamp", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "match-action", "match",
  "Not reported", "A teal stamp lands in the dashed box."),
 (16, 17, "wide-establish", "wide", "eye", "snow-desk-to-building", "cross-section-cutaway", "stacked-layers", "vertical-rise", "single-organic-hero", "match-cut", "match",
  "The question", "Dotty holds the dashed box up like a question then the camera pulls back to the building at first light."),
]

AMBIENT = {
 1: "snow drifts, Dotty breathes, the cowlick sways, the ink pad squashes",
 2: "snow drifts, the dashed borders crawl, Dotty sways, the tack bounces",
 3: "snow drifts, the bush sways, the ski tracks draw on, the sign rattles",
 4: "the lamp pool sways, the typed ink flickers, the cowlick sways, dust drifts",
 5: "the water shimmers, the rotors blur, the dashes crawl, snow drifts",
 6: "the rotors blur, the stream shimmers, the flood ripples, snow drifts",
 7: "the dial turns, the ticks stream, the needle trembles, the window pulses",
 8: "the window flickers, the dashes crawl, the padlock rattles, snow drifts past the windows",
 9: "dust drifts, the dashes crawl, the dark window stars twinkle, the lamp is unlit",
 10: "the lamp sways, dust drifts, the book breathes, the cowlick bobs",
 11: "the lamp sways, the pans bob, dust drifts, the cards flutter",
 12: "the door light flickers, the bill slides, the dashes crawl, dust drifts",
 13: "snow drifts, the copies bounce, the dashed borders crawl, the copier whirs",
 14: "the dashes crawl, the radar sweeps, the lamp sways, the cowlick sways",
 15: "the stamp thuds, the dashes crawl, the lamp sways, the cheeks glow",
 16: "the dashes crawl, the arm wobbles, the window glows, snow drifts",
}
CENTER = {1: "Dotty at x540 y1100", 2: "Dotty at x540 y1150", 3: "the parcel at x540 y1100", 4: "Dotty at x540 y1050", 5: "the map at x540 y1050", 6: "the tile at x540 y1000",
          7: "the dial at x540 y1000", 8: "the stair at x540 y1000", 9: "the middle floor at x540 y940", 10: "Dotty at x420 y1150", 11: "the balance at x540 y1050",
          12: "the door at x540 y1000", 13: "the plane at x540 y1100", 14: "Dotty at x540 y1050", 15: "Dotty at x540 y1050", 16: "Dotty at x540 y1000"}
HERO = {
 1: ("Dotty + Stamp + Building", "50% Dotty, 30% stamp, 20% building"),
 2: ("Stamp + ParcelPlane + Dotty + tack", "35% parcels, 35% Dotty, 30% stamp"),
 3: ("ParcelPlane + berry bush + NO sign", "50% parcel, 30% sign, 20% bush"),
 4: ("Dotty x1 close-up + four boxes", "70% Dotty, 20% boxes, 10% lamp"),
 5: ("SnowMorningBG + map + SeedDrone", "45% map, 35% drone, 20% plates"),
 6: ("SeedDrone + tile + flood + counter", "40% tile, 30% drone, 30% counter"),
 7: ("Stratus dial + time bar + SeedDrone", "50% dial, 30% bar, 20% drone"),
 8: ("Building + Stair + Dotty + Hatch", "45% building, 30% Dotty, 25% hatch"),
 9: ("Building middle floor + dashed stair", "60% floor, 25% stair, 15% desk"),
 10: ("Dotty + BigBook + DeskLamp", "45% Dotty, 40% book, 15% lamp"),
 11: ("balance + two cards", "50% balance, 40% cards, 10% lamp"),
 12: ("door + bill + dashed bill", "50% door, 30% bill, 20% card"),
 13: ("ParcelPlane + Dotty x6", "50% copies, 30% plane, 20% copier"),
 14: ("Dotty + dashed box + radar plate", "55% Dotty, 25% box, 20% plate"),
 15: ("Dotty + NOT REPORTED stamp", "60% Dotty, 30% stamp, 10% box"),
 16: ("Dotty + building", "50% Dotty, 40% building, 10% dawn"),
}
PARTS = {1: 56, 2: 52, 3: 40, 4: 60, 5: 46, 6: 54, 7: 44, 8: 62, 9: 50, 10: 48, 11: 40, 12: 42, 13: 58, 14: 58, 15: 50, 16: 62}
KICKS = (1, 20, 36)
STAGE3D = {k: "planes" for k in range(1, 17)}
for _k in (4, 7, 11, 14, 15):
    STAGE3D[_k] = "flat:a locked panel where the typing boxes, the dial and the stamp are the motion"
CAMERA = {1: "dollyThrough", 2: "craneDown", 3: "static:the sign and the bush are the shot", 4: "static:the typing boxes are the shot", 5: "craneDown", 6: "dollyThrough", 7: "static:the dial and the needle are the shot",
          8: "craneDown", 9: "dollyThrough", 10: "dollyThrough", 11: "static:the balance and the cards are the shot", 12: "truckAcross", 13: "craneDown", 14: "static:the boxes and the sweep are the shot",
          15: "static:the stamp landing is the shot", 16: "dollyThrough"}


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
        assert sh == shot, (bid, sh, shot)
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

    palette = "first-snow white and mist-blue, a paper form hero with checkbox eyes, marigold borough ground, lavender and slate upper floors, turquoise dashed outline, a red tack"
    board = {
        "run_date": "2026-10-23", "slug": "the-rule-that-stops-at-the-fence", "title": "The Rule That Stops at the Fence",
        "concept": ("On October 20th the Kenai Peninsula Borough Assembly passed a weather modification rule after California's Rainmaker flew a cloud seeding drone near Homer. The rule is a form that attaches to borough land only. "
                    "The film draws the form as Dotty, a paper character who is pinned to the borough's own ground and asks four things about a flight, while the sky above belongs to the FAA and the state floor is dark and empty. "
                    "It gives the fair case a scene (a land permit was never going to measure the weather, both sides are quoted, the assembly has asked the Legislature) and ends on one fact: the form asks what a flight intends, and the reports found describe no outside check of the rain Rainmaker says it made."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "cross-section-cutaway", "motion_vector": "vertical-rise", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "tactile-collage", "palette": palette, "camera_strategy": "pull-backs from a desk to a three floor building, a tilted parcel plane, a dive into a hairline and a craneDown through the floors",
                        "light_story": "an overcast first-snow morning, a lit marigold ground floor under two dark floors, a warm paper desk under one lamp, then first light on a dashed teal box",
                        "metaphor": "a form that can only be pinned to the ground it stands on, with one dashed box that asks who checks the sky"},
        "palette": palette,
        "divergence_note": ("10-22 was a dusk tundra survey table in spruce ink, brass and vermilion with a plumb bob. 10-21 was a pewter beach with a tawny calf. 10-20 was a celadon and walnut office with a manila folder. "
                            "This film is a bright white and mist-blue snow morning with a warm paper hero, a marigold accent and a teal dashed box, and it moves through a snowy building cutaway, a tilted parcel plane, a forecast panel, a paper desk and a legislature door, with a character form as hero."),
        "treatment": {"winner": "The Explainer's three floor building and the dive into 19 million gallons being a hairline, with the Comedian's characterized form (Dotty) as hero and throughline, the Dramatist's mayor sentence that trails off and the conditional Vance bill, and the Enthusiast's fair-case template scene.",
                      "why": "A form with a face carries the thesis in one image (it can only be pinned to the ground it stands on), the lit floor under two dark ones makes jurisdiction a picture a muted viewer can read, and the dashed fifth box gives a planted promise that pays at the button."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A paper form with checkbox eyes snaps onto a snowy desk beside a slamming ink stamp with a faint dashed teal box empty at the foot of her page.",
                 "headline": "THE WEATHER RULE IS A FORM", "motion_by_s": 0.3,
                 "loopback": "The last frame is the same form, now holding the dashed box up like a question in the window of the building at first light."},
        "open_loop": {"plant_t": b_at(1), "pay_t": b_at(36), "what": "What is the faint empty dashed box at the foot of her page for? Planted in the first frame, paid when it is stamped NOT REPORTED for the outside check."},
        "open_loop_2": {"plant_t": b_at(15), "pay_t": b_at(32), "what": "Whose sky is it? Planted as a question mark rises over the drone, paid when a bill appears in dashes at the Legislature's door."},
        "throughline": {"object": "Dotty the borough form", "lands_in_button": "the dashed outside-check box held up like a question",
                        "states": [
                            {"at_s": b_at(1), "state": "blank and beaming with a NEW sticker and a faint dashed box"},
                            {"at_s": b_at(6), "state": "pinned to the borough's own marigold parcel"},
                            {"at_s": b_at(12), "state": "four boxes filled and ticked"},
                            {"at_s": b_at(24), "state": "stopped on the painted borough line at the top of the solid stair"},
                            {"at_s": b_at(27), "state": "squared up beside the huge weather book arguing her limit"},
                            {"at_s": b_at(33), "state": "copied onto other parcels as a template"},
                            {"at_s": b_at(34), "state": "the dashed teal box lit and crawling beside the filled ones"},
                            {"at_s": b_at(36), "state": "the dashed box stamped NOT REPORTED"},
                            {"at_s": b_at(37), "state": "the dashed box held up like a question"}]},
        "reveals": [
            {"t": b_at(2), "type": "scale-pullback", "what": "the desk pulls back to a three floor building where only the ground floor is lit", "hold_s": 0.7},
            {"t": b_at(20), "type": "scale-pullback", "what": "the camera dives from a flooded tile to its edge where the flood is a hairline film", "hold_s": 0.7},
            {"t": b_at(31), "type": "build-on", "what": "a bill slides under a tall door and a dashed bill appears beside it", "hold_s": 0.6}],
        "tail_s": 3.2, "audio_arc": {"build_steps": 4, "dip_at": round(b_at(37) - 0.5, 3), "riser_at": round(b_at(35), 3), "silence_at": round(b_at(36) - 0.35, 3),
                      "payoff_at": b_at(36), "button_pattern": "question", "interrupt_at": b_at(20), "extra_dips": [b_at(27)]},
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
    book.raise_if_missing("board_1023 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1023Ids.ts").write_text(
        "// GENERATED by scripts/board_1023.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
