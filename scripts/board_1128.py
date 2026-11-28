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
N = "NIB, a knee-high brushed-steel drafting-pen nib with a breather-hole eye and an ultramarine ink reservoir, labelled DEEP LEARNING"
H = "a person's hand in a navy cuff holding a carmine pencil"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "click", N, "drops tip-first onto the shore of a turquoise lake on a grey Landsat tile as the dark light table clicks on under it, landing with a squash", "curious", "A MACHINE · DEEP LEARNING", "the lamp flickers on at the left", ""),
 (2, 0, W("lakes."), "scribble", N, "skates its tip around the lake as an ultramarine shoreline curls out behind it and closes with a snap", "focused", "TRACED ON SATELLITE TILES", "ink beads at the closing point", ""),
 (3, 0, W("Twice."), "slide", "a second Landsat tile with a date chip CIRCA 2020", "slides over the first beside it, and NIB's next line runs to that tile's right edge and stops, its tip hovering over blank vellum", "curious", "CIRCA 2000 · CIRCA 2020", "NIB's tines splay over the blank", ""),
 (4, 1, 0.0, "whoosh", N, "skates tile to tile along a long strip of Landsat tiles, drawing outline after outline as the strip scrolls under it", "proud", "LANDSAT IMAGES", "outlines snap shut one after another", ""),
 (5, 1, W("traced"), "flip", "the strip's date chips", "flip CIRCA 2000 to CIRCA 2020 and NIB draws a second, larger outline around each lake", "curious", "DEEP LEARNING · LAKES WORLDWIDE · 2000 AND 2020", "the chips clack over", ""),
 (6, 2, 0.0, "tick", H, "darts in from the lower frame and ticks NIB's outlines one by one in carmine while NIB glances back over its shoulder", "steady", "CHECKED BY HAND · PER TU GRAZ", "NIB straightens up", ""),
 (7, 2, W("hand."), "pencil", "the carmine pencil", "nudges one of NIB's lines a hair outward, then presses a carmine tick sticker onto NIB's shoulder", "steady", "MANUAL REFINEMENT · PER THE PAPER", "NIB's tines splay, then click shut", ""),
 (8, 3, 0.0, "paper", "a journal card", "slides under the vellum beside the tile and its title glows up through the paper", "calm", "NATURE CLIMATE CHANGE · NOVEMBER 20TH", "the vellum ripples", ""),
 (9, 4, 0.0, "creak", N, "walks to where the turquoise lake meets the white ice front and peers down at the waterline", "curious", "DOES A LAKE EAT ITS GLACIER?", "a ripple laps the ice edge", ""),
 (10, 4, W("glacier?"), "hum", N, "splays its tines, unsure, over the waterline as its eye looks from the water up to the ice", "uneasy", "THE QUESTION", "the lamp hums", ""),
 (11, 5, 0.0, "pop", "tiny turquoise lake chips", "pop up across a world sheet of tiles like popcorn, a few, then hundreds, then thousands", "surprised", "WORLD · +3,567 ICE-CONTACT LAKES · +35%", "NIB hops back", "rehook: tiny turquoise lake chips pop up across the world sheet like popcorn"),
 (12, 5, W("thirty-five"), "ratchet", "a brass tally counter on the sheet's corner", "rolls up to +3,567 and lands with a clunk", "surprised", "+3,567 · ABOUT 35% MORE LAKES", "chips keep popping", ""),
 (13, 6, 0.0, "squeak", "a tailor's tape measure labelled AREA", "creeps out a short way beside the popcorn and stalls, a bead of sweat at its brass tip", "uneasy", "WORLD · AREA +9%", "NIB taps the stalled tape", ""),
 (14, 7, 0.0, "slide", "the study's press release card", "slides onto the vellum and its line about Alaska lights up", "curious", "\"PARTICULARLY PRONOUNCED IN ALASKA\" · PER TU GRAZ", "NIB leans in to read", ""),
 (15, 7, W("number."), "flip", "two blank rows on the release card, HOW MANY and WHY", "flip open empty, a small dust puff from each", "uneasy", "NO ALASKA NUMBER IN THE RELEASE", "NIB's eye widens", ""),
 (16, 8, 0.0, "swoosh", "a folder marked THE AUTHORS' OPEN DATA", "swings open and a stack of tiles fans out across the vellum", "curious", "THE AUTHORS' OPEN DATA · FIGSHARE", "tiles skid and settle", ""),
 (17, 8, W("counted."), "ratchet", "a row of brass tally counters", "roll their drums up through the stack to 13,685", "focused", "OUR COUNT · 13,685 LAKES · +3,567 · MATCHES THE PAPER", "the drums blur", ""),
 (18, 8, W("exactly."), "stamp", "a cobalt stamp", "slams OUR COUNT onto the tally card and the carmine pencil ticks it", "proud", "COUNT ONLY · OUR COUNT", "the card jumps", ""),
 (19, 9, 0.0, "rustle", "the vellum over the true outline of Alaska", "slides into place over the tiles and the release card's HOW MANY row fills in, its WHY row still blank", "curious", "ALASKA · 931 TO 1,078 · +16% · OUR COUNT", "coastal lake chips settle along the Gulf of Alaska", ""),
 (20, 10, 0.0, "swell", "Alaska's coastal lake outlines along the Gulf of Alaska", "rise like dough under the vellum, bulging past their circa-2000 pencil lines", "wonder", "ALASKA · ABOUT 880 TO 1,190 SQ KM · +35% · OUR COUNT", "NIB backs up step by step", ""),
 (21, 10, W("kilometers."), "swoosh", "the AREA tape", "unrolls past the vellum's edge and off the table while NIB chases its end", "surprised", "AREA · +35% · OUR COUNT", "the tape case spins", ""),
 (22, 11, 0.0, "boom", "a hard centre seam", "slams down the frame, the world's popcorn chips on the left, Alaska's swollen lakes on the right", "surprised", "THE WORLD'S LAKES MULTIPLIED · ALASKA'S SWELLED", "chips bounce on the left, the lakes wobble on the right", "rehook: a hard centre seam slams down between the world's popcorn chips and Alaska's swollen lakes"),
 (23, 12, 0.0, "slide", "a long brass bar of the world's added lake area", "slides in under the seam and its left half lights turquoise for Alaska", "curious", "ABOUT HALF THE WORLD'S ADDED AREA · OUR COUNT", "the bar rocks and settles", ""),
 (24, 12, W("thirteen"), "pop", "a row of thirteen little lake chips", "pops up above the bar and one of them wears an ALASKA tag", "curious", "1,078 OF 13,685 · ABOUT 1 IN 13 · OUR COUNT", "the tagged chip wobbles", ""),
 (25, 13, 0.0, "whoosh", "Vitus Lake at the foot of Bering Glacier on the vellum", "rushes up as the view cranes down onto it, its circa-2000 outline in ultramarine", "wonder", "VITUS LAKE · BERING GLACIER · OUR COUNT", "the glacier lobe's crevasse lines catch the light", ""),
 (26, 13, W("became"), "scribble", N, "draws a second, larger ring around the first like a tree ring, then stands on the outer ring looking down into the new band of turquoise as the carmine pencil ticks both rings", "wonder", "ABOUT 105 TO 158 SQ KM · OUR COUNT", "the new band of water shimmers", ""),
 (27, 14, 0.0, "rush", "two glacier fronts side by side under a pre-dawn sky", "rise into view, the left one ending in a turquoise lake, the right one on grey gravel", "determined", "THE CASE FOR YES", "mist curls off the lake", "rehook: two glacier fronts rise side by side, one into a turquoise lake, one onto gravel"),
 (28, 14, W("sixty-six"), "bubble", "a glass water column beside the lake-ending front", "fills down its ticks to 66 cm as meltwater pours from the ice into it", "determined", "LAKE-ENDING · 66 CM A YEAR · ON AVERAGE", "the lake front's face drips", ""),
 (29, 14, W("forty."), "drip", "a second glass column beside the land front", "fills to 40 cm, visibly shorter than the first", "steady", "ON LAND · 40 CM A YEAR", "a pebble rolls off the moraine", ""),
 (30, 15, 0.0, "clink", "a boxed name card on a stake", "drives into the gravel beside the lake-ending front like a thrown dart", "steady", "TOBIAS BOLCH · CO-AUTHOR · TU GRAZ", "gravel sprays", ""),
 (31, 15, W("accelerates"), "type", "a quote card on the stake", "types out its line row by row as the lake-ending column ticks on", "determined", "\"CONTACT WITH A LAKE FURTHER ACCELERATES THE LOSS OF ICE\" · TOBIAS BOLCH · PER TU GRAZ", "the stake trembles", ""),
 (32, 16, 0.0, "clank", "a brass rail of three spring scales with empty pans", "lowers onto the light table on a column, its plate reading MACHINE LEARNING MODELS, while NIB watches from the vellum's margin", "steady", "MACHINE LEARNING · WEIGHS THE FACTORS", "the pans swing", ""),
 (33, 17, W("eleven"), "clunk", "a small brass weight labelled LAKE", "drops into the first pan and its spring stretches a short way down", "steady", "LAKE ~11% · LAKE-ENDING GLACIERS · WORLDWIDE", "the pan bobs", ""),
 (34, 17, W("forty-three."), "thud", "a big brass weight labelled CLIMATE", "drops into the second pan and its spring stretches about four times as far", "steady", "CLIMATE ~43%", "the rail hums", ""),
 (35, 17, W("forty-six."), "thump", "a big brass weight labelled GLACIER SHAPE", "drops into the third pan and its spring stretches a little further still", "steady", "GLACIER SHAPE ~46%", "all three pans settle", ""),
 (36, 18, 0.0, "hush", N, "looks from the small LAKE pan, still dipped a real notch below its hook, to the two heavy ones, and nods", "curious", "A REAL PUSH · THE SMALLEST OF THE THREE", "the LAKE pan bobs once", ""),
 (37, 19, 0.0, "rustle", "the release card's blank WHY row", "lifts off the card on the table and floats up to the rail, hanging there as an empty fourth pan", "curious", "ALASKA'S SPLIT · NOT IN THE RELEASE OR ABSTRACT", "the rail rings softly", ""),
 (38, 19, W("bigger,"), "creak", "the empty fourth pan", "rocks gently and hangs level with nothing in it", "curious", "COULD BE BIGGER · OR SMALLER", "NIB tilts its head at it", "rehook: the empty fourth pan rocks level on the rail with nothing in it"),
 (39, 20, 0.0, "scribble", N, "skates its line to the vellum's right edge, ruled THE MAP ENDS · CIRCA 2020, and stops, its tip hovering over blank vellum", "curious", "THE MAP ENDS · CIRCA 2020", "the lamp warms", ""),
 (40, 20, W("Who"), "slide", H, "slides the carmine pencil across the blank vellum toward the viewer and lets go, while NIB's tip hovers beside it", "curious", "WHO TRACES THE NEXT ONE?", "the pencil rolls to a stop at the edge", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 60)}
PLATE_AT.update({1: "lower-third", 9: "lower-third", 22: "lower-third", 40: "lower-third"})
CLAIM_MAP = {1: ["c3"], 2: ["c3"], 3: ["c3"], 4: ["c4"], 5: ["c3"], 6: ["c5"], 7: ["c3"], 8: ["c1"], 9: ["narration"], 10: ["narration"],
             11: ["c6"], 12: ["c6"], 13: ["c19"], 14: ["c7"], 15: ["c7"], 16: ["c8"], 17: ["c9"], 18: ["c9"], 19: ["c10"], 20: ["c11"], 21: ["c11"],
             22: ["c6", "c19", "c10", "c11"], 23: ["c12"], 24: ["c20"], 25: ["c13"], 26: ["c13"], 27: ["narration"], 28: ["c14"], 29: ["c14"],
             30: ["c2"], 31: ["c15"], 32: ["c16"], 33: ["c17"], 34: ["c17"], 35: ["c17"], 36: ["c17"], 37: ["c7"], 38: ["narration"], 39: ["c18"], 40: ["narration"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "overhead", "light-table-top", "top-down-map", "single-object-void", "radial-emanate", "instrument-as-subject", "", "", "The trace",
  "Overhead, a dark light table clicks on under a grey Landsat tile, NIB drops tip-first onto a turquoise lake's shore and skates an ultramarine shoreline round it, a CIRCA 2020 tile slides in and NIB's next line stops at its edge, tip hovering over blank vellum"),
 (2, 1, "alt-vantage", "wide", "high", "tile-strip", "orbital-aerial", "grid-modular", "horizontal-traverse", "multiplicity-swarm", "whip-pan", "carry", "Tile to tile",
  "High over a long strip of Landsat tiles NIB skates from lake to lake drawing outlines, the date chips flip CIRCA 2000 to CIRCA 2020 and each lake gets a second, larger outline"),
 (3, 2, "two-up", "medium", "eye", "light-table-side", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "match-action", "carry", "Checked by hand",
  "At eye level across the light table a person's hand with a carmine pencil ticks NIB's outlines, nudges one line, presses a tick sticker on NIB's shoulder, and a journal card slides under the vellum"),
 (4, 4, "macro-closeup", "insert", "low", "ice-front-tile", "macro-closeup", "single-object-void", "vertical-descent", "instrument-as-subject", "push-in", "push", "The question",
  "Low and close at the waterline where a tile's turquoise lake meets its white ice front, NIB peers down and its tines splay, unsure"),
 (5, 5, "map-territory", "extreme-wide", "overhead", "world-sheet", "top-down-map", "map-territory", "radial-emanate", "multiplicity-swarm", "pull-out", "travel", "The world multiplied",
  "Pulled out over a world sheet of tiles, turquoise lake chips pop up like popcorn, a brass counter rolls to +3,567, and a tailor's AREA tape creeps out and stalls"),
 (6, 7, "push-detail", "close", "high", "release-card", "top-down-map", "single-object-void", "vertical-descent", "data-as-subject", "hard-cut", "carry", "No Alaska number",
  "From above the study's press release card slides onto the vellum, its Alaska line lights, and two rows HOW MANY and WHY flip open blank"),
 (7, 8, "data-panel", "medium", "eye", "open-data-folder", "exploded-diagram", "hud-instrument-frame", "assemble-build", "data-as-subject", "mask-wipe", "build", "We counted",
  "A folder of the authors' open data swings open and fans its tiles, brass tally counters roll up to 13,685, and a cobalt OUR COUNT stamp slams onto the tally card"),
 (8, 9, "map-territory", "wide", "overhead", "alaska-vellum", "top-down-map", "map-territory", "radial-emanate", "landscape-as-subject", "map-travel", "travel", "Alaska swelled",
  "Overhead, the vellum with the true outline of Alaska slides over the tiles, the HOW MANY row fills, Alaska's coastal lakes rise like dough past their pencil lines, the AREA tape runs off the table, and a seam splits the world's popcorn from Alaska's swollen lakes"),
 (9, 12, "data-panel", "medium", "eye", "half-bar", "instrument-screen", "grid-modular", "horizontal-traverse", "data-as-subject", "graphic-match", "build", "About half",
  "A long brass bar of the world's added lake area slides in and half of it lights turquoise for Alaska, then thirteen lake chips pop up, one tagged ALASKA"),
 (10, 13, "push-detail", "close", "overhead", "vitus-vellum", "top-down-map", "single-object-void", "radial-emanate", "single-organic-hero", "push-in", "push", "Two rings",
  "Craned down onto Vitus Lake at the foot of Bering Glacier, NIB draws the circa-2020 ring around the circa-2000 ring and stands on it looking into the new band of water as the pencil ticks both"),
 (11, 14, "two-up", "wide", "ground", "glacier-fronts", "eye-level-immersive", "fullbleed-split", "vertical-descent", "landscape-as-subject", "hard-cut", "travel", "The case for yes",
  "At ground level under a pre-dawn sky two glacier fronts stand side by side, one into a turquoise lake and one onto gravel, and two glass water columns fill to 66 and 40 cm"),
 (12, 15, "subject-portrait", "medium", "low", "glacier-quote", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "data-as-subject", "carried-element", "carry", "Further accelerates",
  "Low beside the lake-ending front a name card darts into the gravel and a quote card on its stake types out Bolch's line row by row"),
 (13, 16, "wide-establish", "wide", "eye", "scale-table", "eye-level-immersive", "stacked-layers", "vertical-descent", "structure-as-subject", "match-cut", "build", "The weigh-in",
  "A brass rail of three spring scales lowers onto the light table under a MACHINE LEARNING MODELS plate, weights LAKE, CLIMATE and GLACIER SHAPE drop in and their springs stretch to their shares, and NIB looks from the small pan to the heavy ones"),
 (14, 19, "macro-closeup", "close", "low", "scale-rail", "macro-closeup", "single-object-void", "radial-emanate", "structure-as-subject", "push-in", "push", "The empty pan",
  "Low and close on the rail, the release card's blank WHY row floats up and hangs as an empty fourth pan, rocking level"),
 (15, 20, "subject-portrait", "medium", "overhead", "light-table-edge", "top-down-map", "single-object-void", "horizontal-traverse", "instrument-as-subject", "match-cut", "carry", "Who traces the next one",
  "Overhead, NIB skates its line to the vellum's right edge ruled THE MAP ENDS · CIRCA 2020 and hovers over blank vellum as the hand slides the carmine pencil toward the viewer"),
]

AMBIENT = {i: "a quiet drafting room, the lamp's hum" for i in range(1, 16)}
AMBIENT.update({11: "cold wind off the ice, meltwater trickling", 12: "cold wind, gravel ticking"})
CENTER = {1: "the tile and NIB at x540 y980", 2: "the tile strip at x540 y960", 3: "NIB and the hand at x540 y1000", 4: "the waterline at x540 y980",
          5: "the world sheet at x540 y960", 6: "the release card at x540 y940", 7: "the tally counters at x540 y960", 8: "the Alaska vellum at x540 y960",
          9: "the half bar at x540 y980", 10: "Vitus rings at x540 y960", 11: "the two fronts at x540 y1000", 12: "the quote card at x560 y940",
          13: "the spring rail at x540 y980", 14: "the empty pan at x540 y960", 15: "the vellum edge at x540 y980"}
HERO = {
 1: ("NIB + Landsat tile + turquoise lake + ultramarine line", "55% NIB and line, 30% tile, 15% table"),
 2: ("tile strip + NIB + date chips", "50% strip, 35% NIB, 15% chips"),
 3: ("NIB + carmine pencil hand + light table + journal card", "45% NIB, 35% hand, 20% table"),
 4: ("NIB + waterline + ice front", "55% NIB, 45% waterline"),
 5: ("world sheet + popcorn chips + counter + tape", "50% chips, 30% counter, 20% tape"),
 6: ("release card + blank rows", "65% card, 35% rows"),
 7: ("open folder + tally counters + stamp", "50% counters, 30% folder, 20% stamp"),
 8: ("Alaska vellum + swelling lakes + tape + seam", "55% vellum, 30% lakes, 15% tape"),
 9: ("half bar + thirteen chips", "60% bar, 40% chips"),
 10: ("Vitus rings + NIB + pencil", "55% rings, 30% NIB, 15% pencil"),
 11: ("two glacier fronts + water columns", "60% fronts, 40% columns"),
 12: ("name card + quote card + lake front", "55% card, 45% front"),
 13: ("spring rail + weights + NIB", "60% rail, 25% weights, 15% NIB"),
 14: ("empty pan + rail + release card", "60% pan, 40% rail"),
 15: ("NIB + vellum edge + pencil", "50% NIB, 30% edge, 20% pencil"),
}
PARTS = {i: 44 for i in range(1, 16)}
KICKS = (1, 22, 37)
CAMERA = {1: "craneDown+dollyThrough", 2: "truckAcross", 3: "dollyThrough", 4: "craneDown", 5: "craneUp", 6: "craneDown", 7: "dollyThrough", 8: "craneDown",
          9: "truckAcross", 10: "craneDown", 11: "riseWith", 12: "dollyThrough", 13: "craneDown", 14: "riseWith", 15: "truckAcross"}

PALETTE = ("drafting-room night #1C1E26 graphite-charcoal, cream vellum glow #F1E8D0 from below, oak rim #6B4E34, grey Landsat tiles #9A9894 with white ice #EEF3F6, "
           "glacial-flour turquoise lakes #7FC8C2, ultramarine #3346C8 reserved for the machine's ink, carmine #B3263A reserved for the human pencil, cobalt #2F6FA8 reserved for OUR COUNT, brass #B98A3A scale, pre-dawn slate-violet #3B4660 outdoors")


def BOARD_HEAD(b_at, end, ad, tr):
    return {
        "run_date": "2026-11-28", "slug": "the-map-swelled", "title": "The Map Swelled",
        "concept": ("A study in Nature Climate Change (November 20th, Zhao et al., co-author Tobias Bolch of TU Graz) used deep learning to map glacier lakes worldwide from Landsat images of about 2000 and about 2020, and people checked them by hand. "
                    "Lakes touching glaciers rose by 3,567, about 35 percent, but their area only about 9 percent. The release calls Alaska's growth particularly pronounced but prints no Alaska number, so we counted the authors' open map: our count matches their world lake count exactly, "
                    "Alaska's went 931 to 1,078 while their area grew about 35 percent to about 1,190 sq km, about half the world's added area from about 1 in 13 of its lakes, Vitus Lake at Bering Glacier the biggest gain (about 105 to 158 sq km). "
                    "The case for yes: lake-ending glaciers lost about 66 cm of water a year against about 40 on land, and Bolch says lake contact further accelerates loss. Then the team's machine learning models weighed the factors: lake about 11, climate about 43, glacier shape about 46, for lake-ending glaciers worldwide. "
                    "A real push, the smallest of the three. The release and abstract give no split for Alaska. Drawn as NIB, a drafting-pen nib that traces lakes on glowing Landsat tiles while a person's carmine pencil checks every line, a world of popcorn lake chips against Alaska's lakes rising like dough, two nested rings at Vitus Lake, "
                    "two glacier fronts with water columns, a rail of three spring scales, and the release card's blank WHY row hanging as an empty fourth pan."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "top-down-map", "motion_vector": "radial-emanate", "hero_treatment": "instrument-as-subject", "layout": "grid-modular",
                        "register": "cartoon-interior-drafting-table", "palette": PALETTE, "camera_strategy": "overhead-light-table-and-ground-level-fronts",
                        "light_story": "underlit vellum at night, one warm lamp",
                        "metaphor": "a drafting-pen nib that traces lakes while a person's pencil checks it, lakes that rise like dough, two tree rings at one lake, and a rail of spring scales with an empty fourth pan"},
        "signature_shot": 10,
        "palette": PALETTE,
        "divergence_note": ("Against the last four films: 11-27 an outdoor green-slate storm with lemon lightning (hue about 52) and a teardrop glass hero on a sedge ridge; 11-26 celadon CT tile and orchid under a bone lightbox, indoors before dawn; 11-25 bone noon snow at a rail fork with railway amber; 11-24 flat July overcast on olive tundra with vermilion pins. "
                            "This film is an interior charcoal night lit from BELOW by cream vellum, with three saturated inks each reserved to one role (ultramarine about 232 for the machine, carmine about 352 as thin pencil strokes for people, cobalt about 208 for OUR COUNT labels) and turquoise lake fills (about 175). "
                            "The hero is a steel drafting-pen nib standing on its tines, a chisel silhouette unlike 11-27's teardrop flask, 11-26's round pulse or 11-23's cylinder. Honest overlaps: 11-26 also had a backlit table (a clinical bone CT lightbox; here warm cream vellum over grey satellite tiles in a dark room), "
                            "11-24 also used overhead map shots (here the overhead view is of a drafting table, not terrain), and a brass scale family echoes 11-27's brass instruments; the glacier fronts come from the shelf's GlacierBG idiom."),
        "treatment": {"title": "The Map Swelled", "summary": ad["treatment"], "judge_reasoning": tr[2] if len(tr) > 2 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "A dark light table and a grey Landsat tile with a turquoise lake against white ice; at 0.2 s the table clicks on from below and NIB drops tip-first onto the lake's shore with a squash",
                 "headline": "A MACHINE · DEEP LEARNING", "motion_by_s": 0.2,
                 "loopback": "Frame 1 is NIB dropping onto a lake's shore on the lit table; the last shot returns overhead to the same table, NIB's line stopped at the vellum's CIRCA 2020 edge and its tip hovering over blank vellum as at 0:03."},
        "open_loop": {"plant_t": b_at(9), "pay_t": b_at(36), "plant_glow_s": 0.4, "plant_sfx": "creak", "what": "Does a lake eat its glacier? Planted as NIB peering at the waterline where a turquoise lake meets the ice front under the plate DOES A LAKE EAT ITS GLACIER?; paid when the spring scales settle with the LAKE pan dipped a real notch and far less than CLIMATE and GLACIER SHAPE, A REAL PUSH · THE SMALLEST OF THE THREE."},
        "open_loop_2": {"plant_t": b_at(15), "pay_t": b_at(37), "what": "What goes in the release card's blank WHY row? Planted as the HOW MANY and WHY rows flipping open empty under PARTICULARLY PRONOUNCED IN ALASKA; HOW MANY fills with our count at 931 TO 1,078, and WHY is paid when it lifts off the card and hangs on the rail as an empty fourth pan, ALASKA'S SPLIT · NOT IN THE RELEASE OR ABSTRACT."},
        "throughline": {"object": "the cream vellum sheet on the light table", "lands_in_button": "the vellum's right edge ruled THE MAP ENDS · CIRCA 2020, blank vellum beyond it, NIB's tip hovering and the carmine pencil sliding toward the viewer",
                        "states": [
                            {"at_s": b_at(1), "state": "V0 blank cream vellum over one grey tile as the table clicks on"},
                            {"at_s": b_at(6), "state": "V1 NIB's ultramarine outlines on it, each with a carmine tick"},
                            {"at_s": b_at(18), "state": "V2 a cobalt OUR COUNT stamp in its margin, the release card clipped at its edge with WHY blank"},
                            {"at_s": b_at(20), "state": "V3 laid over the true outline of Alaska, its coastal lakes swelling past their circa-2000 pencil lines"},
                            {"at_s": b_at(26), "state": "V4 Vitus Lake's circa-2020 ring drawn around its circa-2000 ring"},
                            {"at_s": b_at(36), "state": "V5 the scale rail stands over it, NIB at its margin"},
                            {"at_s": b_at(39), "state": "V6 its right edge ruled THE MAP ENDS · CIRCA 2020, blank vellum beyond"}]},
        "reveals": [
            {"t": b_at(11), "type": "scale-pullback", "what": "the view pulls out from one tile to a world sheet as thousands of lake chips pop up", "hold_s": 0.7},
            {"t": b_at(20), "type": "build-on", "what": "Alaska's coastal lakes rise like dough past their circa-2000 pencil lines", "hold_s": 0.7},
            {"t": b_at(26), "type": "build-on", "what": "Vitus Lake's second ring is drawn around the first", "hold_s": 0.8},
            {"t": b_at(35), "type": "morph-to-chart", "what": "the three springs settle at their shares, the LAKE spring a short stretch beside two long ones", "hold_s": 0.7},
            {"t": b_at(37), "type": "build-on", "what": "the blank WHY row hangs as an empty fourth pan", "hold_s": 0.6}],
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
