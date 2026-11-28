#!/usr/bin/env python3
"""2026-11-28 "The Map Swelled": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1128.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1128.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
N = "NIB, a knee-high steel drafting-pen nib with a breather-hole eye and an ultramarine ink reservoir"
H = "the study's checker, a person's hand in an oatmeal cuff holding a persimmon pencil"
R = "our newsroom hand in a pine-green cuff"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "click", N, "drops tip-first onto the shore of a turquoise lake on a grey Landsat tile as the light table clicks on under it, landing with a squash", "curious", "A MACHINE · DEEP LEARNING", "the lamp flickers on at the left", ""),
 (2, 0, W("lakes."), "scribble", N, "skates its tip around the lake as an ultramarine shoreline curls out behind it and closes with a snap", "focused", "TRACED ON SATELLITE TILES", "ink beads at the closing point", ""),
 (3, 0, W("Twice."), "slide", "a second Landsat tile with a date chip CIRCA 2020", "slides in beside the first, and NIB's next line runs to that tile's right edge and stops, its tip hovering over blank vellum", "curious", "CIRCA 2000 · CIRCA 2020", "NIB's tines splay over the blank", ""),
 (4, 1, 0.0, "whoosh", N, "skates tile to tile along a long strip of Landsat tiles, drawing outline after outline as the strip scrolls under it", "proud", "LANDSAT IMAGES", "outlines snap shut one after another", ""),
 (41, 1, W("thousand"), "tick", "the tile under NIB", "snaps its outline shut with a click as the next tile slides in under the tip, its date chip CIRCA 2000", "focused", "CIRCA 2000", "ink beads at the closing point", ""),
 (5, 1, W("twenty"), "pop", "the strip of tiles", "slides on as each tile's date flips to CIRCA 2020 and new small lake outlines pop up between the old ones, the old outlines unchanged", "curious", "CIRCA 2000 AND 2020", "the dates clack over", ""),
 (6, 2, 0.0, "tick", H, "darts in from the lower frame and ticks NIB's outlines one by one while NIB glances back", "steady", "CHECKED BY HAND · PER TU GRAZ", "NIB straightens up", ""),
 (7, 2, W("hand."), "pencil", "the persimmon pencil", "nudges one of NIB's lines a hair outward as NIB watches its line move and its tines click once", "steady", "MANUAL REFINEMENT · PER THE PAPER", "the vellum ripples", ""),
 (8, 3, 0.0, "paper", "the study's checker hand", "slides a journal card under the vellum beside the tile and its title glows up through the paper", "calm", "NATURE CLIMATE CHANGE · NOVEMBER 20TH", "the vellum ripples", ""),
 (9, 4, 0.0, "caw", "a gull on the ice front", "lifts off as the real turquoise lake laps against the ice wall at first light", "curious", "DOES A LAKE EAT ITS GLACIER? · BY HOW MUCH?", "mist curls off the water", ""),
 (10, 4, W("glacier?"), "splash", "a ripple on the lake", "rolls across the water and slaps the foot of the ice front", "uneasy", "THE QUESTION", "the gull wheels away overhead", ""),
 (11, 5, 0.0, "pop", "tiny turquoise lake chips on a world sheet pinned to the wall", "burst up like popcorn among the sheet's old lakes, about 35 new chips for every 100 old lakes (35 of 100)", "surprised", "WORLD · ICE-CONTACT LAKES", "the pins rattle", "rehook: tiny turquoise lake chips burst up like popcorn across the world sheet on the wall"),
 (42, 5, W("three"), "scribble", "an ink total", "writes itself stroke by stroke onto the sheet's margin as the chip bursts slow to a few late pops, landing on +3,567", "surprised", "WORLD · +3,567 LAKES", "the pins rattle", ""),
 (50, 5, W("about"), "stamp", "an ink bracket", "clamps over the burst chips and stamps +35% on the sheet's corner", "surprised", "WORLD · +35% LAKES", "the sheet shivers on its pins", ""),
 (13, 6, 0.0, "squeak", "a steel tape labelled AREA", "slides out along the sheet's foot and stops short at an inked 9% tick as the chip bursts stall", "uneasy", "WORLD · AREA +9%", "the tape case wobbles", ""),
 (14, 7, 0.1, "slide", "the study's press release card", "swings into frame on a TU Graz clip arm and pins down over the vellum's edge", "curious", "PRESS RELEASE · TU GRAZ", "the clip arm bounces", "rehook: the study's press release card swings in on a clip arm and pins down over the vellum"),
 (43, 7, W("pronounced,"), "squeak", "a pale yellow highlighter stripe", "sweeps across the card's quoted line", "curious", "\"PARTICULARLY PRONOUNCED IN ALASKA ...\" · PER TU GRAZ", "the stripe glints", ""),
 (15, 7, W("number."), "snap", "our pine clip tagged OUR QUESTIONS, with two empty tabs HOW MANY? and WHY?", "clamps onto the card's edge, nothing written on the tabs", "uneasy", "NO ALASKA NUMBER IN THE RELEASE", "the tabs flutter", ""),
 (16, 8, 0.0, "swoosh", R, "swings open a folder marked THE AUTHORS' OPEN DATA and fans its tiles across the table", "curious", "THE AUTHORS' OPEN DATA · FIGSHARE", "tiles skid and settle", ""),
 (17, 8, W("matches"), "ratchet", R, "clicks a pine-green tally counter as oak drums roll through the stack and stop at 13,685", "focused", "13,685 LAKES · OUR COUNT", "the drums blur, then stop", ""),
 (18, 8, W("exactly."), "press", R, "presses a pine-green OUR COUNT stamp onto its own tally slip", "proud", "MATCHES THE PAPER · COUNT ONLY · OUR COUNT", "the slip jumps", ""),
 (19, 9, 0.0, "rustle", R, "lays the vellum with the true outline of Alaska over the tiles and the world's steel AREA tape, carried down from the wall, along its foot", "curious", "ALASKA · OUR COUNT", "the vellum settles", ""),
 (44, 9, W("nine"), "snap", R, "clips our pine count slip next to the card's HOW MANY? tab, the blank WHY? tab swinging once, as Alaska's coastal lake outlines drop onto the vellum one by one", "focused", "ALASKA · 931 TO 1,078 · +16% · OUR COUNT", "the tab swings", ""),
 (20, 10, 0.0, "swell", "Alaska's coastal lake outlines along the Gulf of Alaska", "rise like dough under the vellum, bulging past their old dashed pencil lines as NIB watches from the margin", "wonder", "ALASKA · ABOUT 880 SQ KM · C. 2000 · OUR COUNT", "NIB backs up a step", "rehook: Alaska's coastal lakes rise like dough past their pencil lines"),
 (45, 10, W("thirty-five"), "click", "a second AREA tape", "runs out from the same zero as the world's tape, past the world's 9% tick, and stops at its own 35% tick on the same scale", "surprised", "AREA · +35% VS +9% · OUR COUNT", "the tape case spins", ""),
 (51, 10, W("eleven"), "clip", R, "lays a pine slip beside Alaska's tape as the swollen lakes settle", "steady", "ABOUT 1,190 SQ KM · OUR COUNT", "the slip flutters flat", ""),
 (22, 11, 0.0, "slam", R, "pins the Alaska vellum to the wall beside the world sheet, the world's many small new chips against Alaska's few swollen lakes, small tags under each: WORLD LAKES +35% AREA +9%, ALASKA LAKES +16% AREA +35%", "surprised", "THE WORLD'S LAKES MULTIPLIED · ALASKA'S SWELLED", "chips keep bursting on the world sheet while Alaska's lakes breathe outward", "rehook: our hand slams the Alaska sheet onto the wall beside the world's popcorn"),
 (23, 12, 0.0, "slide", R, "slides in an oak frame holding a vellum strip of the world's added lake area", "curious", "THE WORLD'S ADDED AREA · OUR COUNT", "the frame rocks and settles", ""),
 (46, 12, W("half"), "bubble", "the strip's left half", "fills with turquoise from the left end with a glug as the view pulls back to show the whole strip, ALASKA on it, the right half grey", "curious", "ABOUT HALF THE WORLD'S ADDED AREA · OUR COUNT", "the frame rocks", ""),
 (24, 12, W("thirteen"), "pop", "thirteen little lake chips", "drop onto the frame one by one and the seventh lands wearing an ALASKA tag", "curious", "1,078 OF 13,685 · ABOUT 1 IN 13 · OUR COUNT", "the tagged chip wobbles", ""),
 (25, 13, 0.0, "whoosh", "an oblique aerial of Bering Glacier's white lobe at first light", "rises into view, a lake at its foot with two ultramarine inventory rings inked on the water, circa 2000 inside circa 2020, cloud shadows drifting across", "wonder", "BERING GLACIER · AERIAL VIEW", "crevasse lines catch the low sun", "rehook: an aerial of Bering Glacier rises into view, a turquoise lake ringed at its foot"),
 (47, 13, W("Vitus"), "tap", "a pine flag", "drops from above and stakes into the lake shore, flagged VITUS LAKE", "steady", "VITUS LAKE · BIGGEST ALASKA GAIN · OUR COUNT", "the pin's flag flutters", ""),
 (52, 13, W("hundred"), "ping", "the inner ring", "pulses once as a pine tag swings onto it", "steady", "C. 2000 · ABOUT 105 SQ KM · OUR COUNT", "the tag swings", ""),
 (26, 13, W("became"), "swell", "the band of new turquoise water between the two rings", "shimmers and fills from the inner ring out to the outer one", "wonder", "C. 2020 · ABOUT 158 SQ KM · OUR COUNT", "the outer ring glints", ""),
 (27, 14, 0.0, "rush", "two glacier fronts at first light", "rise into view side by side, the left one ending in a turquoise lake, the right one on grey gravel, a survey stake in front holding a strip of the vellum's Gulf coast", "determined", "THE CASE FOR YES", "mist curls off the lake", "rehook: two glacier fronts rise side by side at first light, one into a turquoise lake, one onto gravel"),
 (28, 14, W("sixty-six"), "bubble", "a glass water column beside the lake-ending front", "fills to 66 cm as meltwater pours from the ice into it", "determined", "WORLDWIDE · LAKE-ENDING · ABOUT 66 CM A YEAR · ON AVERAGE", "the lake front drips", ""),
 (29, 14, W("land,"), "drip", "a second glass column beside the land front", "fills to 40 cm, visibly shorter than the first", "steady", "ON LAND · ABOUT 40 CM A YEAR", "a pebble rolls off the moraine", ""),
 (30, 15, 0.0, "splash", "ripples on the lake-ending front's water", "run out in rings past the survey stake as a tag on the stake turns face up", "determined", "TOBIAS BOLCH · CO-AUTHOR · TU GRAZ", "the stake trembles", ""),
 (31, 15, W("accelerates"), "swish", H, "lifts the full 66 column off the shore to carry it indoors as the stake's tag shows Bolch's line", "determined", "\"CONTACT WITH A LAKE FURTHER ACCELERATES THE LOSS OF ICE\" · TOBIAS BOLCH · PER TU GRAZ", "the columns catch the light", ""),
 (32, 16, 0.0, "clank", "a nickel rail of three spring scales with empty pans", "lowers on its column onto the light table beside the 66 column carried in from the field, plate MACHINE LEARNING MODELS, the release card's clip arm at its right end with an empty pan already hanging from it", "steady", "MACHINE LEARNING · WEIGHS THE FACTORS", "the pans swing", "rehook: a nickel rail of spring scales lowers onto the table beside the carried column"),
 (48, 16, W("factors."), "swing", "three nickel weights on hooks", "swing down and hang over the empty pans, LAKE with a turquoise lake inlay, CLIMATE and GLACIER SHAPE stamped on them", "steady", "LAKE · CLIMATE · GLACIER SHAPE", "the pans sway", ""),
 (53, 17, 0.2, "knock", H, "strikes the lake-ending glass column at the margin with a knuckle and its tag swings over", "steady", "LAKE-ENDING GLACIERS · WORLDWIDE", "the column rings", ""),
 (33, 17, W("eleven"), "clunk", "a small nickel weight labelled LAKE", "drops into the first pan, a small nickel weight with a turquoise lake inlay, and its spring stretches a short way down", "steady", "LAKE ~11% · LAKE-ENDING GLACIERS · WORLDWIDE", "the pan bobs", ""),
 (34, 17, W("forty-three."), "thud", "a big nickel weight labelled CLIMATE", "drops into the second pan and its spring stretches far past the LAKE spring", "steady", "CLIMATE ~43%", "the rail hums", ""),
 (35, 17, W("forty-six."), "thump", "a big nickel weight labelled GLACIER SHAPE", "drops into the third pan and its spring stretches a little further still", "steady", "GLACIER SHAPE ~46%", "the three pans settle while the empty fourth pan on the clip keeps swaying", ""),
 (36, 18, 0.0, "creak", N, "stands small on the survey stake at the lake-ending front, the empty pan hanging beside it, and turns from the water back toward the ice and holds still", "curious", "A REAL PUSH · THE SMALLEST OF THE THREE", "the empty pan creaks on its hook", ""),
 (37, 19, 0.0, "rustle", "the blank WHY? tab", "flutters in on the wind and drops into the empty pan on the stake, the pan that hung from the release card's clip since the weigh-in began", "curious", "ALASKA'S SPLIT · NOT IN THE RELEASE OR ABSTRACT", "the stake leans and the pan swings on its hook", ""),
 (38, 19, W("bigger,"), "creak", "the empty pan on the stake", "rocks and settles level, the blank tab lying in it weighing nothing, no needle, no number", "curious", "COULD BE BIGGER · OR SMALLER", "NIB's tines splay", "rehook: the empty pan rocks level on the stake against the real ice"),
 (39, 20, 0.0, "scribble", N, "skates its line to the vellum's right edge, ruled THE MAP ENDS · CIRCA 2020, and stops, its tip hovering over blank vellum", "curious", "THE MAP ENDS · CIRCA 2020", "the lamp warms", ""),
 (40, 20, W("Who"), "slide", "the persimmon pencil hand and our pine-green hand", "come to rest on the table as NIB steps past the edge, touches its tip to the blank vellum once and lifts it", "curious", "THE NEXT MAP · ?", "the pencil rolls to a stop", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 60)}
PLATE_AT.update({1: "lower-third", 9: "lower-third", 22: "lower-third", 40: "lower-third"})
CLAIM_MAP = {1: ["c3"], 2: ["c3"], 3: ["c3"], 4: ["c4"], 41: ["c3"], 5: ["c3"], 6: ["c5"], 7: ["c3"], 8: ["c1"], 9: ["narration"], 10: ["narration"],
             11: ["c6"], 50: ["c6"], 42: ["c6"], 13: ["c19"], 14: ["c7"], 43: ["c7"], 15: ["c7"], 16: ["c8"], 17: ["c9"], 18: ["c9"], 19: ["c10"], 44: ["c10"], 20: ["c11"], 45: ["c11", "c19"], 51: ["c11"],
             22: ["c6", "c19", "c10", "c11"], 23: ["c12"], 46: ["c12"], 24: ["c20"], 25: ["c13"], 47: ["c13"], 52: ["c13"], 26: ["c13"], 27: ["narration"], 28: ["c14"], 29: ["c14"],
             30: ["c2"], 31: ["c15"], 32: ["c16"], 48: ["c17"], 53: ["c17"], 33: ["c17"], 34: ["c17"], 35: ["c17"], 36: ["c17"], 37: ["c7"], 38: ["narration"], 39: ["c18"], 40: ["narration"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "overhead", "light-table-top", "top-down-map", "single-object-void", "radial-emanate", "instrument-as-subject", "", "", "The trace",
  "Overhead, the light table clicks on under a grey Landsat tile, NIB drops onto a turquoise lake's shore and skates an ultramarine shoreline round it, a CIRCA 2020 tile slides in and NIB's next line stops at its edge; then the view lifts as the tiles become a long strip scrolling under NIB, the dates flip to CIRCA 2020 and new small outlines pop up between the old ones"),
 (3, 2, "two-up", "medium", "eye", "light-table-side", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "match-action", "carry", "Checked by hand",
  "At eye level across the table the study's checker hand ticks NIB's outlines in persimmon, nudges one line as NIB watches, and slides a journal card under the vellum"),
 (4, 4, "wide-establish", "wide", "ground", "dawn-lakeshore", "eye-level-immersive", "stacked-layers", "vertical-descent", "landscape-as-subject", "match-cut", "match", "The question",
  "At ground level at first light a real turquoise lake laps against a white ice front and a ripple slaps its foot"),
 (5, 5, "map-territory", "extreme-wide", "eye", "wall-sheet", "instrument-screen", "map-territory", "radial-emanate", "multiplicity-swarm", "match-cut", "match", "The world multiplied",
  "A world sheet pinned on the wall bursts with popcorn lake chips among its old lakes, an ink total writes +3,567 on its margin, and a steel AREA tape stops at an inked 9% tick"),
 (6, 7, "push-detail", "close", "high", "release-card", "top-down-map", "single-object-void", "vertical-descent", "data-as-subject", "hard-cut", "carry", "No Alaska number",
  "From above the study's press release card swings in on a TU Graz clip arm, a highlighter sweeps its Alaska line, and two empty pine tabs, HOW MANY? and WHY?, snap onto its edge"),
 (7, 8, "data-panel", "medium", "eye", "open-data-folder", "exploded-diagram", "hud-instrument-frame", "assemble-build", "data-as-subject", "mask-wipe", "build", "We counted",
  "Our pine-cuffed hand opens a folder of the authors' open data, clicks a tally counter as oak drums stop at 13,685, and stamps OUR COUNT on its own slip"),
 (8, 9, "map-territory", "wide", "overhead", "alaska-vellum", "top-down-map", "map-territory", "radial-emanate", "landscape-as-subject", "map-travel", "travel", "Alaska swelled",
  "Overhead our hand lays the Alaska vellum and clips 931 TO 1,078 beside the HOW MANY? tab, the coastal lakes rise like dough past their pencil lines, and Alaska's AREA tape stops at 35% beside the world's 9% on one scale"),
 (16, 11, "two-up", "medium", "eye", "wall-sheet", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "data-as-subject", "graphic-match", "match", "Multiplied, swelled",
  "Back at the wall, our hand pins the Alaska vellum beside the world sheet, the world's many small popcorn chips against Alaska's few swollen lakes"),
 (9, 12, "data-panel", "medium", "eye", "half-bar", "instrument-screen", "grid-modular", "horizontal-traverse", "data-as-subject", "graphic-match", "build", "About half",
  "Our hand slides in an oak frame with a vellum strip of the world's added lake area, its left half fills turquoise for Alaska, and thirteen lake chips drop on it, one tagged ALASKA"),
 (10, 13, "wide-establish", "extreme-wide", "high", "bering-aerial", "orbital-aerial", "stacked-layers", "radial-emanate", "landscape-as-subject", "map-travel", "travel", "Two rings",
  "An oblique aerial of the real Bering lobe at first light, its moraine stripes and crevasses raked by low sun, Vitus Lake at its foot with two inked inventory rings on the water, a pine flag dropping onto the shore from above and the band between the rings shimmering"),
 (11, 14, "two-up", "wide", "ground", "glacier-fronts", "eye-level-immersive", "fullbleed-split", "vertical-descent", "landscape-as-subject", "hard-cut", "travel", "The case for yes",
  "At ground level at first light two glacier fronts stand side by side, one into a turquoise lake and one onto gravel, and two glass water columns fill to 66 and 40 cm"),
 (12, 15, "alt-vantage", "medium", "overhead", "lakeshore-stake", "orbital-aerial", "centered-hero-lowerthird", "push-in-only", "landscape-as-subject", "hard-cut", "carry", "Further accelerates",
  "From straight above the lake-ending front's shore, the survey stake's tag carries Bolch's line as ripples run in rings across the turquoise water, and the study's checker hand lifts the 66 column to carry it indoors"),
 (13, 16, "wide-establish", "wide", "eye", "scale-table", "eye-level-immersive", "stacked-layers", "vertical-descent", "structure-as-subject", "match-cut", "build", "The weigh-in",
  "A nickel rail of three spring scales lowers onto the light table, an unexplained empty pan hanging from the release card's clip at its right end, the lake-ending column parked at the far margin, weights LAKE, CLIMATE and GLACIER SHAPE drop in and their springs stretch to their shares"),
 (14, 18, "subject-portrait", "medium", "ground", "lakefront-pan", "eye-level-immersive", "centered-hero-lowerthird", "radial-emanate", "landscape-as-subject", "carried-element", "carry", "The empty pan",
  "At ground level back at the lake-ending front, the empty pan from the clip now hangs from the survey stake against the real ice, NIB small on the stake looks back at the water and holds still, then the blank WHY? tab flutters into the pan and it settles level, weighing nothing"),
 (15, 20, "subject-portrait", "medium", "overhead", "light-table-edge", "top-down-map", "single-object-void", "horizontal-traverse", "instrument-as-subject", "match-cut", "carry", "The map ends",
  "Overhead, NIB skates its line to the vellum's right edge ruled THE MAP ENDS · CIRCA 2020 and hovers over blank vellum as both hands come to rest beside it"),
]

AMBIENT = {i: "a quiet drafting room, the lamp's hum" for i in range(1, 17)}
AMBIENT.update({4: "lake water lapping, a far gull", 10: "high wind over the ice", 11: "cold wind off the ice, meltwater trickling", 12: "water lapping, wind", 14: "wind off the ice, water lapping"})
CENTER = {1: "the tile and NIB at x540 y980", 2: "the tile strip at x540 y960", 3: "NIB and the hand at x540 y1000", 4: "the lake and ice front at x540 y1000",
          5: "the wall sheet at x540 y900", 6: "the release card at x540 y940", 7: "the tally counters at x540 y960", 8: "the Alaska vellum at x540 y960",
          16: "the two sheets at x540 y960", 9: "the half bar at x540 y980", 10: "Vitus rings at x540 y1060", 11: "the two fronts at x540 y1000", 12: "the stake on the shore at x540 y960",
          13: "the spring rail at x540 y980", 14: "the empty pan on the stake at x600 y960", 15: "the vellum edge at x540 y980"}
HERO = {
 1: ("NIB + Landsat tiles + tile strip + ultramarine line", "primary NIB and its line 55%, secondary the tile 30%, tertiary the table 15%"),
 2: ("tile strip + NIB + new small outlines", "primary the strip 50%, secondary NIB 35%, tertiary the dates 15%"),
 3: ("NIB + persimmon pencil hand + journal card", "primary NIB 45%, secondary the hand 35%, tertiary the card 20%"),
 4: ("real lake + ice front + first light", "primary the waterline 55%, secondary the ice wall 30%, tertiary the peaks 15%"),
 5: ("world sheet + popcorn chips + ink total + AREA tape", "primary the chips 50%, secondary the ink total 30%, tertiary the tape 20%"),
 6: ("release card + clip arm + pine tabs + highlighter", "primary the card 60%, secondary the tabs 25%, tertiary the arm 15%"),
 7: ("pine-cuffed hand + open folder + oak drums + stamp", "primary the drums 45%, secondary the hand and stamp 35%, tertiary the folder 20%"),
 8: ("Alaska vellum + coastal lake outlines + two AREA tapes", "primary the vellum 55%, secondary the lakes 30%, tertiary the tapes 15%"),
 16: ("wall: world sheet + Alaska vellum + pine-cuffed hand", "primary the two sheets 70%, secondary the hand 20%, tertiary the pins 10%"),
 9: ("oak frame + half strip + thirteen chips + pine-cuffed hand", "primary the strip 60%, secondary the chips 30%, tertiary the hand 10%"),
 10: ("aerial Bering lobe + Vitus rings + pine flag", "primary the rings 55%, secondary the ice lobe 30%, tertiary the flag 15%"),
 11: ("two glacier fronts + water columns + survey stake", "primary the fronts 55%, secondary the columns 35%, tertiary the stake 10%"),
 12: ("survey stake + tag + lake ripples + checker hand", "primary the stake 45%, secondary the water 35%, tertiary the hand 20%"),
 13: ("nickel spring rail + weights + carried column + clip arm", "primary the rail 60%, secondary the weights 25%, tertiary the column and clip 15%"),
 14: ("lake-ending front + survey stake + empty pan + NIB", "primary the empty pan on the stake 55%, secondary the lake-ending ice front and water 30%, tertiary NIB 15%"),
 15: ("NIB + vellum edge + two hands", "primary NIB and its line 50%, secondary the edge 30%, tertiary the hands 20%"),
}
PARTS = {1: 38, 2: 52, 3: 46, 4: 34, 5: 60, 6: 30, 7: 48, 8: 56, 16: 64, 9: 40, 10: 44, 11: 50, 12: 36, 13: 58, 14: 32, 15: 42}
KICKS = (1, 22, 37)
CAMERA = {1: "craneDown+dollyThrough", 2: "truckAcross", 3: "dollyThrough", 4: "riseWith", 5: "truckAcross", 6: "craneDown", 7: "dollyThrough", 8: "craneDown",
          16: "truckAcross", 9: "truckAcross", 10: "craneDown", 11: "riseWith", 12: "craneDown", 13: "craneDown", 14: "riseWith", 15: "truckAcross"}

PALETTE = ("bright lamplit umber drafting den #2A2018, amber-cream vellum #F6DDA8 lit from beneath, honey oak #6B4E34, Landsat frames #9A9894 with snowy ice #EEF3F6, "
           "rock-flour turquoise lakes #7FC8C2, ultramarine #3346C8 for the machine alone, persimmon #E0662A for the study's pencil alone, pine #2F6B45 for OUR COUNT alone, nickel #8E949C scales, lavender #5E5A78 to rose #E9B49A first light outdoors")


def BOARD_HEAD(b_at, end, ad, tr):
    return {
        "run_date": "2026-11-28", "slug": "the-map-swelled", "title": "The Map Swelled",
        "concept": ("A study in Nature Climate Change (November 20th, Zhao et al., co-author Tobias Bolch of TU Graz) used deep learning to map glacier lakes worldwide from Landsat images of about 2000 and about 2020, and people checked them by hand. "
                    "Lakes touching glaciers rose by 3,567, about 35 percent, but their area only about 9 percent. The release calls Alaska's growth particularly pronounced but prints no Alaska number, so we counted the authors' open map: our count matches their world lake count exactly, "
                    "Alaska's went 931 to 1,078 while their area grew about 35 percent to about 1,190 sq km, about half the world's added area from about 1 in 13 of its lakes, Vitus Lake at Bering Glacier the biggest gain (about 105 to 158 sq km). "
                    "The case for yes: lake-ending glaciers lost about 66 cm of water a year against about 40 on land, and Bolch says lake contact further accelerates loss. Then the team's machine learning models weighed the factors: lake about 11, climate about 43, glacier shape about 46, for lake-ending glaciers worldwide. "
                    "A real push, the smallest of the three. The release and abstract give no split for Alaska. Drawn as NIB, a drafting-pen nib that traces lakes on glowing Landsat tiles while the study's persimmon pencil checks the lines and our pine-cuffed hand counts, a world of popcorn lake chips against Alaska's lakes rising like dough, two inventory rings at Vitus Lake with our pin, "
                    "two glacier fronts with water columns, a rail of three spring scales, and the release card's blank WHY row hanging as an empty fourth pan."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "top-down-map", "motion_vector": "radial-emanate", "hero_treatment": "instrument-as-subject", "layout": "grid-modular",
                        "register": "cartoon-interior-drafting-table", "palette": PALETTE, "camera_strategy": "overhead-light-table-and-ground-level-fronts",
                        "light_story": "bright amber lamplight that cools as the weighing begins and warms again at the end",
                        "metaphor": "a drafting-pen nib that traces lakes while a person's pencil checks it, lakes that rise like dough, two tree rings at one lake, and a rail of spring scales with an empty fourth pan"},
        "signature_shot": 10,
        "palette": PALETTE,
        "divergence_note": ("Against the last four films: 11-27 an outdoor green-slate storm with lemon lightning (hue about 52) and a teardrop glass hero on a sedge ridge; 11-26 celadon CT tile and orchid under a bone lightbox, indoors before dawn; 11-25 bone noon snow at a rail fork with railway amber; 11-24 flat July overcast on olive tundra with vermilion pins. "
                            "This film is a warm umber drafting den lit from BELOW by amber-cream vellum and a lamp, with three inks each reserved to one role (ultramarine about 232 for the machine's lines, persimmon about 20 as thin pencil strokes for the study's checker, pine about 143 for OUR COUNT stamps and slips) and turquoise lake fills (about 175); persimmon sits about 12 degrees from 11-24's vermilion pins, kept to hairline pencil strokes, never fills. "
                            "The hero is a steel drafting-pen nib standing on its tines, a chisel silhouette unlike 11-27's teardrop flask, 11-26's round pulse or 11-23's cylinder. Honest overlaps: 11-26 also had a backlit table (a clinical bone CT lightbox; here warm cream vellum over grey satellite tiles in a dark room), "
                            "11-24 also used overhead map shots (here the overhead view is of a drafting table, not terrain), 11-26 also lit an interior from a glowing surface (a bone CT lightbox; here a warm vellum table plus a lamp key), and the scales are nickel, not 11-27's brass; the glacier fronts are hand-drawn in this palette."),
        "treatment": {"title": "The Map Swelled", "summary": ad["treatment"], "judge_reasoning": tr[2] if len(tr) > 2 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "A dark light table and a grey Landsat tile with a turquoise lake against white ice; at 0.2 s the table clicks on from below and NIB drops tip-first onto the lake's shore with a squash",
                 "headline": "A MACHINE · DEEP LEARNING", "motion_by_s": 0.2,
                 "loopback": "Frame 1 is NIB dropping onto a lake's shore on the lit table; the last shot returns overhead to the same table, NIB's line stopped at the vellum's CIRCA 2020 edge and its tip hovering over blank vellum as at 0:03."},
        "open_loop": {"plant_t": b_at(9), "pay_t": b_at(33), "plant_glow_s": 0.4, "plant_sfx": "caw", "what": "Does a lake eat its glacier? Planted as a real turquoise lake lapping a white ice front at first light under the plate DOES A LAKE EAT ITS GLACIER? · BY HOW MUCH?; paid when the LAKE weight lands in its pan and its spring stretches a real but short way, LAKE ~11% · LAKE-ENDING GLACIERS · WORLDWIDE, before CLIMATE and GLACIER SHAPE stretch theirs far past it."},
        "open_loop_2": {"plant_t": b_at(15), "pay_t": b_at(37), "what": "What goes on the empty WHY? tab? Planted as two empty pine tabs, HOW MANY? and WHY?, snapping onto the release card's edge under PARTICULARLY PRONOUNCED IN ALASKA; our slip 931 TO 1,078 is clipped beside HOW MANY?, and WHY? is paid when it flutters into the empty pan now hanging from the survey stake at the lake-ending front, ALASKA'S SPLIT · NOT IN THE RELEASE OR ABSTRACT."},
        "throughline": {"object": "the cream vellum sheet on the light table", "lands_in_button": "the vellum's right edge ruled THE MAP ENDS · CIRCA 2020, blank vellum beyond it, NIB's tip hovering and both hands at rest beside it",
                        "states": [
                            {"at_s": b_at(1), "state": "V0 blank cream vellum over one grey tile as the table clicks on"},
                            {"at_s": b_at(6), "state": "V1 NIB's ultramarine outlines on it, each with a persimmon tick"},
                            {"at_s": b_at(14), "state": "V2 the release card pinned down over its edge by a TU Graz clip, two empty pine tabs on the card"},
                            {"at_s": b_at(20), "state": "V3 laid over the true outline of Alaska, its coastal lakes swelling past their circa-2000 pencil lines"},
                            {"at_s": b_at(22), "state": "V4 laid beside a WORLD sheet, the two side by side"},
                            {"at_s": b_at(27), "state": "V5 a strip of its Gulf coast carried into the field on a survey stake in front of the glacier fronts"},
                            {"at_s": b_at(32), "state": "V6 back on the table under the scale rail, the lake-ending column standing on its margin"},
                            {"at_s": b_at(39), "state": "V7 its right edge ruled THE MAP ENDS · CIRCA 2020, blank vellum beyond, both hands at rest beside it"}]},
        "reveals": [
            {"t": b_at(11), "type": "scale-pullback", "what": "the view pulls back to the whole world sheet on the wall as popcorn lake chips burst up", "hold_s": 0.7},
            {"t": b_at(20), "type": "build-on", "what": "Alaska's coastal lakes rise like dough past their circa-2000 pencil lines", "hold_s": 0.7},
            {"t": b_at(26), "type": "build-on", "what": "the band of new water between Vitus Lake's two inventory rings fills and shimmers", "hold_s": 0.8},
            {"t": b_at(46), "type": "scale-pullback", "what": "the view pulls back from Alaska's half of the world's added lake area to show the other half the same size", "hold_s": 0.8},
            {"t": b_at(35), "type": "morph-to-chart", "what": "the three springs settle at their shares, the LAKE spring a short stretch beside two long ones", "hold_s": 0.7},
            {"t": b_at(37), "type": "build-on", "what": "the blank WHY? tab drops into the empty pan on the survey stake at the lake-ending front", "hold_s": 0.6}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.0}, {"line": 5, "offset": 0.0, "level": 1.15}, {"line": 7, "offset": 0.0, "level": 0.85},
            {"line": 9, "offset": 0.0, "level": 1.1}, {"line": 11, "offset": 0.0, "level": 1.2}, {"line": 14, "offset": 0.0, "level": 0.9},
            {"line": 16, "offset": 0.0, "level": 1.0}, {"at_s": round(b_at(36) - 0.6, 3), "level": 0.35}, {"at_s": round(b_at(36) + 0.5, 3), "level": 1.0},
            {"line": 20, "offset": 0.0, "level": 1.1}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(36) - 0.5, 3), "riser_at": round(b_at(32) - 1.0, 3), "silence_at": round(b_at(36) - 0.5, 3),
            "payoff_at": b_at(36), "button_pattern": "callback", "interrupt_at": b_at(27), "extra_dips": []},
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
    book.raise_if_missing("board_1128 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1128Ids.ts").write_text(
        "// GENERATED by scripts/board_1128.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
