#!/usr/bin/env python3
"""2026-11-16 "The Forest Can't Stand on the Ice": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1116.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1116.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "pop", "a troupe of small faced decision trees", "punch up through the polar-night snow of the North Slope tundra like whack-a-moles while a caribou chewing moss drops it", "startled", "A FOREST? ON THE NORTH SLOPE", "the moss drops", ""),
 (2, 0, W("almost"), "whoosh", "the dark tundra", "pulls back as thousands of small frozen lake polygons light up across it", "awed", "30,774 LAKES · ALASKA NORTH SLOPE", "the lakes light", ""),
 (3, 1, 0.0, "snap", "one VoteTree up close", "shakes snow off its crown, which splits into a glowing yes or no fork", "proud", "NOT SPRUCE", "the snow falls", ""),
 (4, 1, W("machine"), "pop", "the troupe behind it", "bursts up out of the snow row by row, every crown splitting at its fork", "proud", "RANDOM FOREST · 100 TREES", "the rows pop", ""),
 (5, 1, W("decision"), "creak", "one tree's root", "reaches out to tap the kettle lake's ice, a hairline crack opens, and the root curls back as a tag ONE OF 30,774 pops up on a little flag on the lake's shore", "worried", "ONE OF 30,774", "the root recoils", ""),
 (6, 2, 0.0, "page", "a paper titled THE CRYOSPHERE", "flutters down onto the snow beside the kettle lake and falls open", "curious", "A NEW PAPER · THE CRYOSPHERE", "the paper opens", ""),
 (7, 2, W("freeze"), "crack", "the kettle lake", "flickers between frozen celadon and open teal and the troupe leans in to read the paper, then flinches", "curious", "WHEN IT FREEZES · WHEN IT THAWS", "the troupe flinches", ""),
 (8, 3, 0.0, "whoosh", "a radar satellite with a lime lens", "glides along its orbit arc above a lid of cloud in the polar night", "eager", "SENTINEL-1 RADAR · NO SUN NEEDED", "the satellite glides", ""),
 (9, 3, W("cloud"), "sonar", "a lime radar beam", "punches down through the cloud lid onto the kettle lake and a scan line sweeps it", "focused", "SEES THROUGH CLOUD AND POLAR NIGHT", "the scan sweeps", ""),
 (10, 4, 0.0, "tick", "a ring of four tick marks around the lake", "sweeps round once and stops as the beam lands on the lake again, and the trees lift their paddles to half-mast", "steady", "A LOOK ABOUT EVERY 4 DAYS", "the ring ticks", ""),
 (11, 5, W("vote"), "flip", "the forest at the lake edge", "lift ballot paddles, most reading ICE and a few WATER, and their crown forks flicker lime", "eager", "EACH TREE VOTES", "the paddles flip", ""),
 (12, 5, W("open"), "stamp", "a lime label stamp", "presses ICE onto the lake's shore chip with an ink spread, then the camera pulls back as the same stamp ripples across thousands of lakes", "proud", "MOST TREES LEAN ICE", "the stamps ripple", "rehook: one stamp becomes a ripple of stamps across thousands of lakes"),
 (13, 6, 0.0, "tap", "a faced thermometer in reading glasses", "drops flashcards from a weather-record deck onto the snow in front of the trees", "calm", "PRACTICE ANSWERS", "the cards deal", ""),
 (14, 6, W("weather"), "scrape", "the flashcards", "fan out on the snow, most stamped with a small thermometer mark", "calm", "ABOUT 62% OF LABELS · FROM WEATHER RECORDS", "the cards fan", ""),
 (15, 7, W("94"), "stamp", "a report card", "drops onto an easel with a big 94% and the easel legs bounce as the trees shake their paddles", "proud", "94% AGREEMENT", "the card bounces", ""),
 (16, 7, W("graded"), "thock", "a paper flap", "drops over the card's GRADED BY line and hides it, and the trees glance at each other", "puzzled", "WHO GRADED IT?", "the flap drops", ""),
 (17, 8, 0.0, "rustle", "the midnight sun", "rolls along the north horizon as the tundra warms to rust and gold, a snow bunting lifts off a tussock and the first mosquitoes drift in", "curious", "WHAT DID THE LAKES SAY?", "the bird lifts", ""),
 (18, 8, W("June"), "crack", "the kettle lake's ice", "cracks into shards that drift apart over teal water as the mosquitoes clock in on the shore", "startled", "ICE OUT · AVERAGE JUNE 8TH", "the ice breaks", ""),
 (19, 9, 0.0, "crunch", "the lake", "skins over with ice again as the sun dips and the mosquitoes leave", "calm", "ICE ON · AVERAGE SEPT 30TH", "the ice closes", ""),
 (20, 9, W("open"), "roll", "a teal ribbon", "unrolls along the shore from the June mark to the September mark", "proud", "ABOUT 114 DAYS OF OPEN WATER", "the ribbon unrolls", ""),
 (21, 10, 0.0, "rumble", "a painted map of the North Slope", "tilts up out of the tundra with a teal ribbon beside each band of lakes and the kettle lake's tag pinned to its bottom band", "curious", "FARTHER NORTH", "the map tilts", "rehook: the ground tilts up into a map and the ribbons start to shrink"),
 (22, 10, W("23"), "scrape", "the ribbons", "shrink band by band as they go north", "wincing", "ABOUT 23 FEWER DAYS PER DEGREE NORTH", "the ribbons shrink", ""),
 (23, 11, 0.0, "boing", "the thermometer", "hops to the front of the map and its red column climbs", "proud", "TEMPERATURE LED", "the column climbs", ""),
 (24, 11, W("Shape"), "rattle", "two small lakes tagged SHAPE and SIZE", "shake a tiny tin cup that tips and spills two coins", "sheepish", "SHAPE AND SIZE · ABOUT 2% MORE", "the cup rattles", ""),
 (25, 12, 0.0, "bubble", "the kettle lake cut open by season, June open on the left, October frozen on the right", "burps strings of bubbles from its bed on the June side", "curious", "WHY CARE?", "the bubbles rise", ""),
 (26, 12, W("open"), "hiss", "the bubbles", "pop at the June surface and drift up into the air while on the October side they press flat under the ice", "curious", "METHANE · OPEN-WATER SEASON", "the bubbles pop", ""),
 (27, 13, 0.0, "thunk", "a row of school desks on the tundra shore at dusk", "lands in the sedge with the forest seated at them, paddles raised like hands, the 94% card on its easel, and the lake ice empty beyond them", "tense", "THE FAIR TEST", "the desks land", ""),
 (28, 13, W("That"), "flip", "the flap on the report card", "lifts to show a second satellite in a sun visor whose eye shuts every time a cloud drifts over and opens when it parts, as the trees look up", "puzzled", "SENTINEL-2 · CLEAR DAYS ONLY", "the eye shuts", ""),
 (29, 13, W("anyone"), "swish", "an empty teacher's desk", "slides out alone onto the lake ice with an unused red pen on it, and one tree stretches a root toward it and stops at the ice line", "plain", "NOT ANYONE ON THE ICE", "the root stops", ""),
 (30, 14, 0.0, "pin", "a small card", "pins to the front of the empty desk as the raised paddles on the shore lower row by row and the grader's eye blinks shut under a passing cloud", "plain", "NO FIELD CHECK · PER THE PAPER", "the paddles lower", ""),
 (31, 15, 0.0, "tap", "the thermometer on its wooden board", "deals frost cards and sun cards onto a long ribbon of days laid across the snow", "calm", "MOST ANSWERS FROM WEATHER", "the cards land", ""),
 (32, 15, W("temperature"), "pin", "a TEMPERATURE LED card", "is pulled from the same weather deck, carrying the same thermometer mark, and pins beside it", "plain", "AND TEMPERATURE LED", "the card pins", ""),
 (33, 16, 0.0, "slide", "the dealt cards", "slide to the two ends of the ribbon, frost on deep winter and sun on high summer, and the shoulder weeks between them open up blank", "even", "ONLY LONG DEEP COLD OR REAL WARMTH", "the cards slide", "rehook: the cards split to the two ends and the shoulder weeks open blank"),
 (34, 16, W("warmth"), "chime", "the blank shoulder weeks", "fill with a few clear-sky cards and neutral question marks where no weather card reaches", "even", "THE IN-BETWEEN WEEKS", "the ticks land", ""),
 (35, 17, 0.0, "slide", "a ribbon pulled off a logger on a stake at an instrumented lake's edge", "slides across under the 114 ribbon, its two ends marked 80 and 110", "plain", "FIELD-INSTRUMENTED LAKES · 80 TO 110 DAYS", "the ribbon slides", ""),
 (36, 17, W("other"), "click", "a tag", "swings in on a string and settles between the two ribbons", "plain", "DIFFERENT LAKES · DIFFERENT YEARS", "the tag clips", ""),
 (37, 18, 0.0, "bloop", "twenty lake polygons", "rise out of the tundra and waddle into a long line behind the thermometer like ducklings, the tagged kettle lake hopping in last", "curious", "THE PAPER'S TEMPERATURE MODEL", "the lakes waddle", ""),
 (38, 18, W("82"), "tick", "the line", "falls into step behind the thermometer, about four lakes in twenty out of step", "satisfied", "TEMPERATURE MODEL · ICE OUT 82% · ICE ON 75%", "the line steps", ""),
 (39, 19, 0.0, "sting", "the out-of-step lakes, the tagged kettle lake first", "step out of the line and glow fuchsia, and the camera cranes up to the whole slope where about one lake in five glows", "startled", "THE LAKES THAT BREAK THE RULE", "the lakes step out", ""),
 (40, 20, 0.0, "clank", "the radar's own pixel view of the tagged lake", "snaps into a top-down lime pixel grid where the jagged shoreline's land pixels bleed into the water pixels", "curious", "MAYBE SHORELINES · PER THE PAPER", "the pixels bleed", ""),
 (41, 20, W("Or"), "ping", "the frame", "splits, the pixel-bleed reading on one side and the lake drawn clean with its own ribbon off-length on the other, both the same size", "open", "OR THOSE LAKES REALLY DIFFER", "the frame splits", ""),
 (42, 20, W("settle"), "knock", "the clean half of the split", "widens to fill the frame and shows the empty desk already standing on the tagged lake, now fuchsia, the red pen untouched", "plain", "A FIELD CHECK WOULD SETTLE IT", "the frame widens", ""),
 (43, 21, 0.0, "thud", "the forest on the shore", "sinks back into the polar-night snow one tree at a time with soft thuds", "calm", "THE FOREST CAN'T STAND ON THE ICE", "the trees sink", ""),
 (44, 21, W("Someone"), "creak", "the empty desk on the fuchsia lake", "creaks on the ice as the caribou crosses behind it and looks up", "open", "NOT YET CHECKED", "the caribou looks up", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 45)}
PLATE_AT.update({1: "lower-third", 2: "lower-third", 17: "lower-third", 27: "lower-third", 43: "lower-third"})
CLAIM_MAP = {1: ["narration"], 2: ["c1"], 3: ["narration"], 4: ["c8"], 5: ["narration"], 6: ["c1"], 7: ["c1"], 8: ["c6"], 9: ["c6"], 10: ["c7"],
             11: ["c8"], 12: ["c8"], 13: ["c10"], 14: ["c10"], 15: ["c13"], 16: ["c13"], 17: ["narration"], 18: ["c16"], 19: ["c17"], 20: ["c18"],
             21: ["c19"], 22: ["c19"], 23: ["c21"], 24: ["c21"], 25: ["narration"], 26: ["c25"], 27: ["narration"], 28: ["c13", "c11"], 29: ["c13"],
             30: ["c26"], 31: ["c10"], 32: ["c21"], 33: ["c10"], 34: ["c10"], 35: ["c27"], 36: ["c27"], 37: ["c23"], 38: ["c23"], 39: ["c23"],
             40: ["c28"], 41: ["c28"], 42: ["c28"], 43: ["c26"], 44: ["c26"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "high", "night-tundra", "orbital-aerial", "map-territory", "vertical-rise", "multiplicity-swarm", "", "", "A forest where none grows", "Polar night tundra, a troupe of faced decision trees punches up through the snow, a caribou drops its moss, and thousands of lake polygons light up"),
 (2, 1, "subject-portrait", "close", "eye", "lake-edge-night", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "match-cut", "match", "Not spruce", "One VoteTree shakes off snow, its crown forks, the troupe pops up behind it, a root tests the ice and recoils, a paper flutters down and the lake flickers"),
 (3, 3, "alt-vantage", "wide", "low", "night-sky", "orbital-aerial", "stacked-layers", "vertical-descent", "instrument-as-subject", "graphic-match", "carry", "Radar in the dark", "A lime-lensed radar satellite glides above the cloud lid and its beam punches down onto the kettle lake"),
 (4, 4, "push-detail", "medium", "eye", "lake-edge-night", "eye-level-immersive", "centered-hero-lowerthird", "radial-emanate", "multiplicity-swarm", "match-action", "match", "The vote", "A four-tick ring clicks round the lake, the trees raise ICE and WATER paddles and a pressed lime label stamp reads where most trees lean, rippling across thousands of lakes"),
 (5, 6, "two-up", "medium", "eye", "snow-classroom", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "match-action", "build", "Practice answers", "The thermometer deals weather-record flashcards to the trees, then a 94% report card drops onto an easel and a flap hides its GRADED BY line under WHO GRADED IT?"),
 (6, 8, "wide-establish", "wide", "eye", "summer-tundra", "eye-level-immersive", "single-object-void", "horizontal-traverse", "landscape-as-subject", "mask-wipe", "build", "The open season", "Under the midnight sun the lake's ice cracks open, mosquitoes clock in, the lake skins over again and a teal ribbon runs from June to September"),
 (7, 10, "map-territory", "wide", "high", "map-tundra", "top-down-map", "map-territory", "vertical-rise", "data-as-subject", "match-cut", "match", "Farther north", "The tundra tilts up into a map, ribbons shrink band by band going north, the thermometer hops forward and shape and size rattle a tin cup"),
 (8, 12, "macro-closeup", "insert", "low", "under-lake", "cross-section-cutaway", "stacked-layers", "vertical-rise", "data-as-subject", "graphic-match", "carry", "Why care", "In cross-section the open lake burps bubbles to the air while a frozen lake beside it holds its bubbles under the ice"),
 (9, 13, "two-up", "medium", "eye", "exam-shore-dusk", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "multiplicity-swarm", "match-cut", "match", "The exam room", "At dusk the forest sits at desks on the shore, the report card's flap lifts to a sun-visor grader that only sees clear days, and one empty desk slides out alone onto the ice"),
 (10, 15, "map-territory", "wide", "high", "year-ribbon-snow", "top-down-map", "grid-modular", "assemble-build", "data-as-subject", "carried-element", "build", "The ribbon of days", "From above, the thermometer deals frost and sun cards onto a ribbon of days across the snow, they slide to the two ends and the blank shoulder weeks fill with clear-sky cards and lime radar ticks"),
 (11, 17, "push-detail", "medium", "eye", "logger-lake-dusk", "eye-level-immersive", "stacked-layers", "push-in-only", "data-as-subject", "carried-element", "carry", "Other lakes, other years", "At an instrumented lake a logger on a stake pays out a ribbon marked 80 and 110 that slides under the 114 ribbon, and a DIFFERENT LAKES tag swings in between them"),
 (12, 18, "wide-establish", "wide", "low", "dusk-tundra", "eye-level-immersive", "map-territory", "horizontal-traverse", "multiplicity-swarm", "match-cut", "match", "The ducklings", "From a low angle lake polygons waddle into a line behind the thermometer, most fall into step and a few step out glowing fuchsia as the forest turns"),
 (13, 20, "macro-closeup", "close", "high", "radar-pixels", "instrument-screen", "hud-instrument-frame", "assemble-build", "instrument-as-subject", "graphic-match", "carry", "The radar's own view", "A top-down lime pixel grid of the tagged lake where shoreline pixels bleed, the frame splits against a clean drawing of a lake that really differs, then the empty desk slides onto the fuchsia lake"),
 (14, 21, "wide-establish", "wide", "eye", "night-tundra", "eye-level-immersive", "single-object-void", "vertical-descent", "landscape-as-subject", "match-cut", "match", "Someone will have to", "Back in polar night the forest sinks into the snow on the shore and the empty desk waits alone on the fuchsia lake's ice NOT YET CHECKED as the caribou crosses behind"),
]

AMBIENT = {1: "wind over snow, a low hum", 2: "wind, creaking wood", 3: "a high thin wind, a radio hiss", 4: "wind, wooden paddles clacking",
           5: "wind, cards shuffling", 6: "a soft summer breeze, mosquitoes whine far off", 7: "paper map rustle, wind", 8: "underwater burble, bubbles",
           9: "dusk wind, a school bell far off", 10: "a hush, wind", 11: "breeze, ribbon flutter", 12: "dusk wind, a waddle patter",
           13: "a low hum, wind", 14: "night wind, snow settling"}
CENTER = {1: "the troupe at x540 y1100", 2: "the tree at x540 y1050", 3: "the satellite at x540 y700", 4: "the lake at x540 y1000", 5: "the thermometer at x420 y1000",
          6: "the lake at x540 y1050", 7: "the map at x540 y900", 8: "the bubbles at x540 y900", 9: "the desks at x540 y1050", 10: "the thermometer at x540 y1000",
          11: "the ribbons at x540 y950", 12: "the line at x540 y1050", 13: "the lake at x540 y950", 14: "the desk at x700 y1150"}
HERO = {
 1: ("troupe of faced decision trees + caribou + lake polygons + polar night", "45% trees, 30% lake field, 25% caribou and sky"),
 2: ("VoteTree close + forking crown + troupe + kettle lake + paper", "50% tree, 30% lake, 20% troupe"),
 3: ("radar satellite + cloud lid + lime beam + kettle lake", "40% satellite, 30% beam, 30% lake"),
 4: ("trees with paddles + kettle lake + four-tick ring + stamp", "45% trees, 35% lake, 20% ring and stamp"),
 5: ("thermometer teacher + flashcards + front row of trees + report card easel", "40% thermometer and cards, 35% trees, 25% easel"),
 6: ("kettle lake ice and water + midnight sun + mosquitoes + ribbon", "45% lake, 25% sun and sky, 30% ribbon and shore"),
 7: ("tilted map + lake bands + ribbons + thermometer + tin cup", "45% map, 30% ribbons, 25% thermometer and cup"),
 8: ("lake cross-section + bubbles + frozen lake + air", "50% open lake, 30% frozen lake, 20% air"),
 9: ("shore desks + forest + report card + sun-visor satellite + empty desk on the ice", "40% forest at desks, 30% card and grader, 30% empty desk"),
 10: ("ribbon of days + thermometer board + frost and sun cards + radar ticks", "45% ribbon, 30% cards and ticks, 25% thermometer"),
 11: ("two ribbons + tag + instrumented lake", "55% ribbons, 25% tag, 20% instrumented lake"),
 12: ("duckling line of lakes + thermometer + fuchsia lakes + whole slope", "45% line, 25% thermometer, 30% fuchsia lakes and slope"),
 13: ("radar pixel grid + tagged lake + split clean lake + empty desk", "45% pixel lake, 30% split frame, 25% desk"),
 14: ("sinking forest + fuchsia lake + empty desk + caribou + polar night", "35% lake and desk, 35% forest, 30% caribou and sky"),
}
PARTS = {1: 56, 2: 52, 3: 46, 4: 54, 5: 50, 6: 48, 7: 50, 8: 44, 9: 56, 10: 48, 11: 42, 12: 58, 13: 44, 14: 50}
KICKS = (1, 27, 42)
CAMERA = {1: "craneDown", 2: "dollyThrough", 3: "craneDown", 4: "dollyThrough", 5: "truckAcross", 6: "truckAcross", 7: "craneDown",
          8: "static:the bubbles rising and popping are the move", 9: "truckAcross", 10: "static:a locked overhead of the ribbon of days while cards land and slide", 11: "dollyThrough", 12: "truckAcross+riseWith",
          13: "static:a locked radar pixel view that splits in two", 14: "craneDown"}

PALETTE = ("indigo-plum polar winter #1C1A33 for the open and the button, golden midnight-sun honey #F6C66B over a warm sunlit sky #9FC3D6 for the findings, apricot dusk #E89A7A over heather #5C4A78 for the exam, "
           "rust sedge #8A4B2E and ochre tussock #A2603A tundra, celadon frozen lakes #D8ECEF and warm teal open water #2D6E73, birch-bark cream #E9DCC1 trunks with moss crowns #6E8B3D, "
           "radar lime #C6F04D reserved for the model and the radar, fuchsia #F24FA0 reserved for lakes that break the temperature rule")


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
    board = {
        "run_date": "2026-11-16", "slug": "the-forest-cant-stand-on-the-ice", "title": "The Forest Can't Stand on the Ice",
        "concept": ("A random forest of 100 decision trees, reading Sentinel-1 radar that sees through cloud and polar night, dated the ice on 30,774 North Slope lakes (Nguyen et al., The Cryosphere). "
                    "On average ice went out around June 8th and came back around September 30th, about 114 open days, about 23 fewer days per degree north, and temperature led while shape and size added about 2 percent. "
                    "The fair test: the 94 percent is agreement with clear-sky Sentinel-2 labels, not anyone on the ice, the paper says no field validation was done, and weather supplied most of the practice answers, though only for long deep cold or real warmth. "
                    "The paper's temperature model matched the radar's dates for 82 and 75 percent of lakes, so the lakes that break the rule hold the next question, and a field check would settle it. "
                    "Drawn as a troupe of faced decision trees punching up through the snow of a land where trees don't grow, voting ICE or WATER with ballot paddles, a thermometer teacher, an exam room on the shore with one empty desk on the ice, ducklings, and that empty desk alone on a fuchsia lake."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "horizontal-traverse", "hero_treatment": "multiplicity-swarm", "layout": "centered-hero-lowerthird",
                        "register": "field-notebook-cartoon", "palette": PALETTE, "camera_strategy": "track-follow",
                        "light_story": "a polar winter sky lit by a lime radar beam, then a warm golden midnight sun low in the north, then an apricot dusk for the exam, then the winter sky again with one fuchsia glow",
                        "metaphor": "a random forest drawn as a troupe of faced decision trees that vote with ballot paddles on a tundra where real trees don't grow"}, "signature_shot": 12,
        "palette": PALETTE,
        "divergence_note": ("The last films were full rain-black night at one Juneau door with a faceless gunmetal letterbox and pencilled vellum (11-15), high-noon white sea ice with cobalt leads, a ringed seal and a survey camera (11-14), "
                            "and a brass faucet with a face on an overcast gravel lot (11-13). This film is open tundra in three lights (polar night, midnight-sun honey, apricot dusk), its hero is a CROWD of soft wooden trees, not a single metal fixture, "
                            "its AI colour is radar lime instead of cyan, and its world is the ground itself and the lakes in it. Honest overlaps: 11-14 also had a satellite and Arctic ice, answered by tundra lakes from the side and a crowd hero. 11-15 also opened at night, answered by keeping night to the first eight and last four seconds."),
        "treatment": {"title": "The Forest Can't Stand on the Ice", "summary": ad["treatment"],
                      "judge_reasoning": "Dramatist pitch won (49 of 60): the only full act structure with dated rehooks, a throughline lake that changes at every act boundary, a why-care beat and an Act 3 that tests then honestly narrows. Grafts: the Comedian's whack-a-mole open, tin cup, empty desk and duckling turn, the Explainer's report-card flip and whispering thermometer, the Enthusiast's June 8th mosquitoes. Fixes: no vote tallies, no named lake, the grader is clear-sky Sentinel-2 labels, averages say AVERAGE, shoreline is the paper's possibility, no boot prints at the unchecked lake."},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "anomaly-question", "frame1": "Polar-night tundra under a lid of cloud, a caribou chewing moss, and at 0.3 s the first faced decision trees punch up through the snow like whack-a-moles with a snow burst.",
                 "headline": "A FOREST? ON THE NORTH SLOPE", "motion_by_s": 0.4,
                 "loopback": "Frame 1 is the trees punching up through the polar-night snow beside the caribou, the last image is the same night with the trees sinking back into the snow and the caribou crossing behind the empty desk alone on the one fuchsia lake."},
        "open_loop": {"plant_t": b_at(5), "pay_t": b_at(43), "plant_glow_s": 0.4, "plant_sfx": "creak", "what": "Who stands on the ice? Planted when one tree's root taps the kettle lake's ice, cracks it and curls back, kept as the empty teacher's desk alone on the ice in the exam room while the forest sits on the shore, paid when the forest sinks into the snow under THE FOREST CAN'T STAND ON THE ICE and the empty desk waits on the lake NOT YET CHECKED."},
        "open_loop_2": {"plant_t": b_at(16), "pay_t": b_at(28), "what": "Who graded the 94 percent, and when can it see? Planted as a paper flap dropping over the card's GRADED BY line under WHO GRADED IT? while the voice says keep in mind who graded it, paid in the exam room on 'another satellite' when the flap lifts to a sun-visor satellite whose eye shuts each time a cloud drifts over, under SENTINEL-2 · CLEAR DAYS ONLY."},
        "throughline": {"object": "one kettle lake, ONE OF 30,774", "lands_in_button": "the same tagged lake, glowing fuchsia in polar night with the empty teacher's desk alone on its ice, NOT YET CHECKED",
                        "states": [
                            {"at_s": b_at(1), "state": "K1 dark and unseen under polar night"},
                            {"at_s": b_at(9), "state": "K2 swept by the lime radar beam"},
                            {"at_s": b_at(12), "state": "K3 stamped ICE, most trees lean ice"},
                            {"at_s": b_at(18), "state": "K4 cracked open to teal water under the midnight sun"},
                            {"at_s": b_at(20), "state": "K5 frozen again with a 114-day ribbon on its shore"},
                            {"at_s": b_at(29), "state": "K6 one empty desk alone on its ice at dusk, the forest at desks on the shore"},
                            {"at_s": b_at(39), "state": "K7 first to step out of the duckling line, glowing fuchsia"},
                            {"at_s": b_at(44), "state": "K8 alone in polar night with the empty desk on its ice, NOT YET CHECKED"}]},
        "reveals": [
            {"t": b_at(2), "type": "scale-pullback", "what": "the camera pulls back as thousands of lake polygons light up across the dark tundra", "hold_s": 0.8},
            {"t": b_at(21), "type": "morph-to-chart", "what": "the tundra tilts up into a map with a ribbon beside each band of lakes", "hold_s": 0.8},
            {"t": b_at(37), "type": "build-on", "what": "lake polygons rise and waddle into a long line behind the thermometer", "hold_s": 0.8},
            {"t": b_at(39), "type": "scale-pullback", "what": "the camera cranes up from the line to the whole slope where about one lake in five glows fuchsia", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 3, "offset": 0.0, "level": 1.3}, {"line": 6, "offset": 0.0, "level": 0.9},
            {"line": 8, "offset": 0.0, "level": 1.7}, {"line": 13, "offset": 0.0, "level": 0.7}, {"line": 18, "offset": 0.0, "level": 1.8},
            {"at_s": round(b_at(44) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(44) + 0.5, 3), "level": 1.5},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(44) - 0.5, 3), "riser_at": round(b_at(37), 3), "silence_at": round(b_at(44) - 0.5, 3),
            "payoff_at": b_at(44), "button_pattern": "callback", "interrupt_at": b_at(27), "extra_dips": []},
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
    book.raise_if_missing("board_1116 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1116Ids.ts").write_text(
        "// GENERATED by scripts/board_1116.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
