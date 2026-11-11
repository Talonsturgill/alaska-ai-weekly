#!/usr/bin/env python3
"""2026-11-11 "The Roof Puck": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1111.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1111.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board_anchor import AnchorBook  # noqa: E402
import board_1102 as base  # noqa: E402  (shared helpers only: est_starts, line_starts, load_words, _phrase)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"
LINES = base.LINES

W = lambda w, n=1: (w, n)
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "whoosh", "a mittened hand", "wipes a frosted window and through it a headlight sweeps a dry-looking road that turns to a mirror holding the roof puck upside down", "uneasy", "A FAIRBANKS RESIDENT ASKED", "the reflection shivers", ""),
 (3, 0, W("testing"), "thump", "the roof puck", "settles rimed in frost onto a dark car silhouette in the fog, its lens eye blind white under a jagged frost brow", "sleepy", "ILLUSTRATIVE", "frost ferns creep", ""),
 (4, 0, W("Do"), "slide", "the puck's micro wiper", "drags one arc through the rime in the shape of a question mark and the lens eye blinks open", "startled", "DO THEY KNOW?", "the eyebrows jump", ""),
 (5, 0, W("black"), "crunch", "the question-mark patch", "freezes back over behind the wiper in jagged crystals while the puck squints down at the mirror road", "wary", "BLACK ICE", "the frost crunches back", ""),
 (6, 1, 0.0, "page", "a phone in a warm kitchen", "slides across a table and lights up with Waymo's blog post and its date tab while the puck sits small, reflected in the window glass behind it", "curious", "NOVEMBER 5TH", "the screen scrolls", ""),
 (7, 1, W("Alaska"), "pop", "a pin on the phone screen", "drops onto an Alaska outline and lands wide across the whole state", "curious", "THIS SEASON · ALASKA", "the pin wobbles", ""),
 (8, 1, W("closed-course"), "tick", "a small cone loop on the screen", "lights cone by cone, then a snow data drum fills beside it while a small blank counter on the post rolls and glows once", "puzzled", "CLOSED-COURSE TESTS · HEAVY SNOWFALL DATA", "the drum fills", "plant: the unfilled number"),
 (10, 2, 0.0, "thud", "the post's Alaska plate", "drops onto a paper map with its blurred state-wide pin and the puck taps it with a wiper eyebrow", "careful", "THE POST SAYS ONLY ALASKA", "the pin stays wide", ""),
 (11, 2, W("names"), "pop", "a governor's post card", "slides over the map and its pin snaps down onto Fairbanks", "bright", "GOVERNOR'S POST · FAIRBANKS", "the pin snaps", ""),
 (12, 2, W("proving"), "snap", "a frost-rimmed cloth banner", "unrolls and snaps taut over the Fairbanks dot as the camera finishes craning down", "bright", "\"NO BETTER PROVING GROUND\"", "the cloth snaps", ""),
 (13, 3, 0.0, "whoosh", "the puck on its car silhouette", "rides up to the head of a fog-white road as the camera cranes over it and a TV-station card slides in", "alert", "QUOTED BY TV STATION", "snow plumes behind", "rehook: the camera cranes over the puck at the head of a fogged road"),
 (14, 3, W("three"), "click", "three lanes already laid in the road", "click and fill with content one by one, a roadside logger, a wheel, a cone course", "focused", "THREE KINDS OF WORK", "the lane lines lock", ""),
 (15, 3, W("Manual"), "tap", "the first lane", "fills as a person in a parka steps in at the roadside holding a handheld logger and taps it", "focused", "MANUAL DATA COLLECTION", "the logger blinks", ""),
 (16, 3, W("autonomous"), "slide", "the second lane", "fills as a specialist silhouette's hands slide onto the wheel while the puck steers", "focused", "SPECIALIST AT THE WHEEL", "the hands hover", ""),
 (17, 3, W("limited"), "tick", "the third lane", "lights as a closed course of cones with a short taped loop", "careful", "LIMITED STRUCTURED TESTING", "the cones wobble", ""),
 (18, 4, 0.0, "whoosh", "the puck", "splits open into a cutaway as the camera pushes into its smooth shell", "proud", "SIXTH-GENERATION WAYMO DRIVER", "the shell halves part", "rehook: the puck splits open into a cutaway"),
 (19, 4, W("cameras"), "click", "three sensor layers", "light in turn inside the cutaway, camera, radar, lidar", "focused", "CAMERAS · RADAR · LIDAR", "each layer clicks in", ""),
 (20, 4, W("heaters"), "sizzle", "amber heater coils", "glow and melt the jagged rime into a smooth clear ring around the eye while the micro wipers flick", "relieved", "HEATERS · MICRO-WIPERS", "meltwater beads", ""),
 (21, 4, W("clear"), "pop", "the lens eye", "opens wide and clear inside its heated ring as sleet bounces off", "confident", "SENSORS KEPT CLEAR", "sleet bounces", ""),
 (22, 5, 0.0, "whoosh", "the puck's own view", "floods white as the camera layer goes blind in a whiteout", "alarmed", "CAMERAS IN A WHITEOUT", "the view blanks", ""),
 (23, 5, W("whiteout"), "pulse", "amber radar and lidar returns", "pulse across the white and draw the road ahead as dots, which thin out toward a dashed white wall", "determined", "ONE SENSOR BLIND · ANOTHER BACKS IT UP", "the dots draw", "plant: what happens when winter wins"),
 (25, 6, 0.0, "clunk", "the camera", "drops under the car silhouette to four wheels on broken glazed ice as four traction gauges rise above them", "tense", "TRACTION · EACH WHEEL", "the needles swing", "rehook: the camera drops under the car to four wheels on glazed ice"),
 (27, 6, W("recreates"), "cascade", "a digital grid", "pours a glass road out of light in a box labelled SIMULATION while the puck watches its own reflection", "curious", "SIMULATED BLACK ICE · SIMULATION", "the glass ripples", ""),
 (28, 7, 0.0, "ping", "the clean puck", "glows warm, sprouts a tiny vane and thermometer and sends out a ping", "chatty", "MOBILE WEATHER STATION", "the vane spins", ""),
 (29, 7, W("sharing"), "whoosh", "the camera", "pulls back from one puck to an abstract snow field of unnumbered pings answering each other", "warm", "SHARED ACROSS THE FLEET · ILLUSTRATIVE", "the pings cross", "rehook: the camera pulls back from one puck to a field of pings"),
 (30, 7, W("of"), "tick", "the snow field of pings", "answers everywhere except one dark silent patch carrying the Fairbanks pin, while drawn snowflake mile markers tick elsewhere", "quiet", "WAYMO SAYS · TENS OF THOUSANDS OF MILES · SNOWY REGIONS ELSEWHERE", "the markers tick", ""),
 (32, 8, 0.0, "fold", "the whole design", "folds down into a single sheet that lands on the dark silent patch", "hopeful", "AN ANSWER ON PAPER", "the sheet settles", ""),
 (33, 8, W("paper"), "hush", "a gust", "sweeps across the puck and jagged frost creeps back over the rim of its clear eye", "uneasy", "HOLD THAT THOUGHT", "the eye narrows", ""),
 (34, 9, 0.0, "creak", "a first roadside billboard", "rolls up out of the snowbank on its posts", "worried", "ONE RESIDENT EXPECTS", "the billboard shudders", ""),
 (35, 9, W("stall"), "blip", "a thought-frame on the billboard", "slams in showing a worried car silhouette stopped on a roadside shoulder, its tail light blinking crimson once under dim white hazards, the same shoulder the puck's view will land on, then everything holds silent", "stern", "\"STALL OUT\" · WHAT IF", "the tail light blinks", "rehook: one crimson tail light blinks inside a worried thought-frame"),
 (36, 9, W("shouldn't"), "thud", "a second billboard", "slams up beside the first as the puck holds still on its mount", "stern", "\"SHOULDN'T BE ALLOWED\"", "the billboard rattles", ""),
 (37, 10, 0.0, "flip", "a third billboard", "rolls up and its ribbon flips in the wind", "hopeful", "THE MAYOR · \"A GREAT OPPORTUNITY\"", "the ribbon flutters", ""),
 (39, 11, 0.0, "swell", "the puck's dot road from the whiteout", "returns and a gauge needle swings past a dashed line labelled VALIDATED LIMIT", "wary", "WEATHER BEYOND VALIDATED · VALIDATED LIMIT", "the needle climbs", ""),
 (41, 11, W("pause"), "stop", "the backup rings", "shrink as the dots thin into the white wall in front of a generic city skyline under a HUD label CITY SERVICE, the car eases onto the same shoulder as the worry's thought-frame with dim white hazards strobing, and calendar leaves stack like snow on its hood", "sober", "ITS OWN POST · IN ITS CITIES · PAUSE FOR HOURS OR DAYS", "the leaves pile", ""),
 (42, 12, 0.0, "riser", "the paper sheet", "slides onto a dashboard and frosts over edge to edge as the camera cuts into the cab", "uncertain", "IS PAPER ENOUGH?", "the frost spreads", "rehook: the paper answer frosts over on the dashboard"),
 (43, 12, W("how"), "roll", "the odometer counter on a specialist's clipboard", "rolls its drums and lands on blanks beside a calendar that has already flipped up blank", "puzzled", "HOW MANY CARS?", "the drums settle", ""),
 (44, 12, W("dates"), "thump", "the counter and the calendar", "thump down together on the clipboard, both empty", "flat", "NO COUNT · NO DATES", "the clipboard bounces", ""),
 (45, 13, 0.0, "type", "the words DRIVERLESS CARS PLANNED?", "type across a field on the clipboard as the specialist's pen lowers toward it", "curious", "A REPORTER ASKED · DRIVERLESS?", "the pen lowers", ""),
 (46, 13, W("Waymo"), "hush", "the specialist's pen", "hovers over the blank answer line and lifts away without writing", "flat", "NOT YET ANSWERED", "the pen lifts", ""),
 (47, 14, 0.0, "hum", "the roof puck", "settles half frosted and half clear in a tight pool of light under a single lamp at night", "pensive", "WAYMO'S POST IS A CLAIM", "the lamp buzzes", ""),
 (48, 14, W("This"), "crack", "jagged frost", "creeps over the clear half toward the eye", "tense", "THIS WINTER IS THE TEST", "the eye narrows", ""),
 (49, 14, W("What"), "whoosh", "the camera", "rises and pulls back from the puck to one small car lower left on a vast dark Fairbanks road under the lamp", "searching", "WHAT WOULD YOU WANT PROVEN?", "the road glints", ""),
]

# where each beat's plate lives (not everything in the lower third)
PLATE_AT = {1: "lower-third", 3: "on-object", 4: "side-plate-right", 5: "corner-tag", 6: "phone-screen", 7: "phone-screen", 8: "phone-screen",
            10: "on-object", 11: "on-object", 12: "on-object", 13: "lower-third", 14: "side-plate-left", 15: "on-object", 16: "on-object",
            17: "on-object", 18: "side-plate-right", 19: "on-object", 20: "side-plate-left", 21: "lower-third", 22: "hud", 23: "hud",
            25: "on-object", 27: "on-object", 28: "side-plate-right", 29: "lower-third", 30: "side-plate-left", 32: "on-object",
            33: "lower-third", 34: "billboard", 35: "billboard", 36: "billboard", 37: "billboard", 39: "hud", 41: "side-plate-right",
            42: "on-object", 43: "on-object", 44: "on-object", 45: "on-object", 46: "on-object", 47: "lower-third", 48: "lower-third",
            49: "side-plate-right"}
# every on-screen fact and drawn actor, by claim id ("narration" = a spoken framing line, no fact asserted)
CLAIM_MAP = {1: ["c25"], 3: ["c1"], 4: ["c25"], 5: ["c25"], 6: ["c2"], 7: ["c3", "c5"], 8: ["c3", "c4", "c30"], 10: ["c5"], 11: ["c6"],
             12: ["c7"], 13: ["c11"], 14: ["c11"], 15: ["c12"], 16: ["c13"], 17: ["c14"], 18: ["c15", "c17"], 19: ["c17"],
             20: ["c18"], 21: ["c18"], 22: ["c19"], 23: ["c19"], 25: ["c20"], 27: ["c21"], 28: ["c23"], 29: ["c23"], 30: ["c22"],
             32: ["c17", "c18", "c19", "c20", "c21"], 33: ["narration"], 34: ["c26"], 35: ["c26"], 36: ["c29"], 37: ["c27", "c13"],
             39: ["c24"], 41: ["c24"], 42: ["narration"], 43: ["c30"], 44: ["c30"], 45: ["c16"], 46: ["c16"], 47: ["c2", "narration"],
             48: ["narration"], 49: ["narration"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "macro-closeup", "close", "ground", "mirror-road-fog", "macro-closeup", "single-object-void", "horizontal-traverse", "instrument-as-subject", "", "", "The mirror road", "A resident wipes a window, a headlight finds a road that is really a mirror and a frosted puck wipes one question mark clear"),
 (2, 1, "push-detail", "insert", "high", "warm-kitchen-phone", "eye-level-immersive", "single-object-void", "scroll-data", "instrument-as-subject", "hard-cut", "carry", "The post", "A phone on a warm kitchen table shows the dated blog post, a pin lands wide on Alaska, cones and a snow drum light, the puck small in the window glass"),
 (3, 2, "map-territory", "wide", "overhead", "alaska-paper-map", "top-down-map", "map-territory", "vertical-descent", "data-as-subject", "graphic-match", "match", "Alaska and Fairbanks", "The post's pin stays wide on Alaska, then the camera cranes down from the statewide pin until Fairbanks is one dot under the governor's card"),
 (4, 3, "wide-establish", "extreme-wide", "high", "three-lane-road", "orbital-aerial", "stacked-layers", "assemble-build", "structure-as-subject", "whip-pan", "travel", "Three kinds of work", "The road splits into three lanes, a roadside logger, a specialist at the wheel, a cone course"),
 (5, 4, "subject-portrait", "medium", "eye", "puck-cutaway", "cross-section-cutaway", "single-object-void", "radial-emanate", "instrument-as-subject", "graphic-match", "match", "Inside the puck", "The puck opens, three sensor layers light and amber heaters melt a clear ring around its eye"),
 (6, 5, "alt-vantage", "wide", "eye", "puck-pov-whiteout", "instrument-screen", "hud-instrument-frame", "radial-emanate", "data-as-subject", "mask-wipe", "build", "The whiteout", "From inside the puck the view goes white and radar and lidar returns draw the road as dots"),
 (7, 6, "push-detail", "close", "ground", "under-car-ice", "cross-section-cutaway", "grid-modular", "assemble-build", "data-as-subject", "hard-cut", "carry", "Under each wheel", "Under the car four traction gauges rise and a simulated glass road is poured"),
 (8, 7, "map-territory", "extreme-wide", "overhead", "snow-field-abstract", "top-down-map", "map-territory", "radial-emanate", "multiplicity-swarm", "map-travel", "travel", "The weather station", "One warm clean puck pings and the camera pulls back to an abstract snow field of unnumbered pings"),
 (9, 8, "subject-portrait", "medium", "low", "roadside-sheet", "eye-level-immersive", "single-object-void", "vertical-descent", "instrument-as-subject", "morph", "match", "On paper", "The design folds into one sheet that lands on the dark silent patch and a gust frosts the rim of the puck's eye"),
 (10, 9, "wide-establish", "wide", "low", "billboard-row", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "carried-element", "carry", "The test", "Three roadside billboards carry the skeptics and the mayor, one holds a worried thought-frame with a crimson blink on a shoulder under dim white hazards"),
 (11, 11, "alt-vantage", "wide", "eye", "puck-pov-return", "instrument-screen", "hud-instrument-frame", "vertical-rise", "data-as-subject", "graphic-match", "match", "When winter wins", "The dot road returns, the needle crosses VALIDATED LIMIT, the rings shrink and the dolly decelerates to a dead stop as the car pulls onto the shoulder"),
 (12, 12, "push-detail", "close", "overhead", "dashboard-clipboard", "macro-closeup", "fullbleed-split", "scroll-data", "instrument-as-subject", "hard-cut", "carry", "No count, no dates", "On the dashboard the paper frosts, the clipboard counter and calendar stay blank and the pen hovers over an unanswered question"),
 (13, 14, "wide-establish", "extreme-wide", "high", "night-road-lamp", "orbital-aerial", "single-object-void", "vertical-rise", "landscape-as-subject", "match-cut", "match", "The button", "Under one lamp the puck sits half frosted, frost creeps toward its eye and the camera rises to one small car on a vast dark road, reflected upside down in black ice, the mirror of frame one"),
]

AMBIENT = {1: "wind over the road, frost ferns crunch, the headlight hums", 2: "a kettle ticks in the kitchen, the screen scrolls, wind at the glass", 3: "the map paper settles, the pins wobble",
           4: "tires hiss on packed snow, lane lines lock", 5: "heater coils tick, meltwater drips, sleet bounces", 6: "the whiteout roars, returns pulse",
           7: "the ice creaks under the tires, the needles swing", 8: "the vane spins, pings cross the snow field", 9: "the sheet flaps on its frame, a gust hisses",
           10: "wind on the billboards, a car idles", 11: "returns pulse, the hazards tick, snow settles", 12: "the heater fan hums, the drums settle, the pen scratches nothing",
           13: "the lamp buzzes, snow falls, wind over the road"}
CENTER = {1: "the puck reflection at x540 y1080", 2: "the phone at x380 y1000 and the puck reflection at x780 y700", 3: "the Fairbanks pin at x600 y860", 4: "the three lanes at x540 y980",
          5: "the puck cutaway at x420 y940", 6: "the dot road vanishing at x540 y880", 7: "the four gauges at x540 y920", 8: "the pings at x620 y960",
          9: "the sheet at x360 y900 and the puck at x760 y820", 10: "the middle billboard at x540 y860", 11: "the dot road at x540 y900 and the car at x700 y1100",
          12: "the clipboard at x440 y980", 13: "the small car at x300 y1240 under the lamp"}
HERO = {
 1: ("roof puck + mirror road + headlight beam + mittened hand + question-mark frost patch", "55% puck and reflection, 25% road, 20% window and hand"),
 2: ("phone + blog post + Alaska pin + cone loop + snow drum + small reflected puck", "60% phone, 25% screen graphics, 15% reflected puck"),
 3: ("Alaska paper map + two pins + two post cards + cloth banner", "60% map and pins, 30% cards, 10% banner"),
 4: ("three lanes + car silhouette with puck + roadside logger + specialist hands + cones", "60% lanes, 25% car and puck, 15% figures and cones"),
 5: ("puck cutaway + sensor layers + heater coils + micro wipers", "65% cutaway, 25% coils and wipers, 10% sleet"),
 6: ("white field + radar and lidar returns + dot road + white wall", "55% dot road, 30% returns, 15% white wall"),
 7: ("four wheels + traction gauges + broken glazed ice + simulation box", "55% gauges, 30% wheels and ice, 15% simulation box"),
 8: ("warm weather-station puck + abstract snow field of pings + mile markers", "55% pings, 30% puck, 15% markers"),
 9: ("paper sheet + dark silent patch + puck with frosting rim", "50% sheet, 40% puck, 10% patch"),
 10: ("three billboards + thought-frame car silhouette", "65% billboards, 35% thought-frame"),
 11: ("dot road + VALIDATED LIMIT gauge + shrinking rings + car on the shoulder + calendar leaves", "50% dot road and rings, 30% car and leaves, 20% gauge"),
 12: ("dashboard + frosted sheet + clipboard counter and calendar + specialist pen", "60% clipboard, 25% pen, 15% frosted sheet"),
 13: ("half-frosted puck + single lamp + small car + vast dark road", "45% road and dark, 35% car and puck, 20% lamp pool"),
}
PARTS = {1: 48, 2: 46, 3: 38, 4: 44, 5: 58, 6: 40, 7: 48, 8: 50, 9: 38, 10: 50, 11: 48, 12: 46, 13: 44}
KICKS = (4, 23, 35)
CAMERA = {1: "dollyThrough", 2: "truckAcross", 3: "craneDown", 4: "craneDown+dollyThrough", 5: "dollyThrough", 6: "static:the puck's own eye holds still while the returns move",
          7: "truckAcross", 8: "riseWith", 9: "static:the gust is the move", 10: "truckAcross", 11: "dollyThrough",
          12: "static:locked overhead so the pen's non-move is the only motion", 13: "riseWith"}

# six numbered puck states with RoofPuck params; the throughline points at them
PUCK_STATES = {
 1: {"name": "rimed and blind", "frost": 1.0, "clearRing": 0.0, "mode": "blind", "emotion": "sleepy", "glow": 0.0},
 2: {"name": "one wiper arc clear, eye open", "frost": 0.7, "clearRing": 0.2, "mode": "blind", "emotion": "alert", "glow": 0.0},
 3: {"name": "heated clear ring", "frost": 0.15, "clearRing": 1.0, "mode": "wheel", "emotion": "relieved", "glow": 1.0},
 4: {"name": "whiteout, camera blind, backup rings glowing", "frost": 0.3, "clearRing": 0.6, "mode": "backup", "emotion": "determined", "glow": 1.0},
 5: {"name": "clean and warm-lit", "frost": 0.0, "clearRing": 1.0, "mode": "wheel", "emotion": "chatty", "glow": 0.6},
 6: {"name": "half frosted, half clear", "frost": 0.5, "clearRing": 0.5, "mode": "wheel", "emotion": "pensive", "glow": 0.3},
}

PALETTE = ("ice-fog noon, pink-gold low sun behind milky fog, ice-black ground, hoarfrost puck, plum ink on paper, sodium amber on live mechanisms only, a single crimson taillight")


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
        "run_date": "2026-11-11", "slug": "the-roof-puck", "title": "The Roof Puck",
        "concept": ("Waymo posted on November 5th that it will run closed-course tests and collect heavy snowfall data in Alaska this season. The governor's post names Fairbanks, "
                    "and a statement quoted by a TV station lists three kinds of work there, manual data collection, autonomous driving with a specialist at the wheel and limited structured testing. "
                    "A Fairbanks resident asked whether the testers know to look for black ice. The film answers with Waymo's published design drawn as states of one roof sensor puck with a face, "
                    "heated sensors and micro wipers, a stated backup sensing system in a whiteout, traction under each wheel, simulated black ice and a fleet that shares the weather, "
                    "then gives the skeptics full strength on roadside billboards and concedes that the answer so far is on paper. Waymo's own post says service can pause for hours or days, "
                    "the reports give no car count and no dates, the driverless question is unanswered, and the button leaves the puck half frosted on a vast dark road. This winter is the test."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "macro-closeup", "motion_vector": "radial-emanate", "hero_treatment": "instrument-as-subject", "layout": "single-object-void",
                        "register": "naturalistic-scene", "palette": PALETTE, "camera_strategy": "dolly-through",
                        "light_story": "ice-fog noon, whiteout, single lamp in the evening",
                        "metaphor": "the roof sensor puck as the car's eye: every mechanism Waymo published is a state of that one smooth face against jagged rime, and the winter decides which state it ends in"},
        "palette": PALETTE,
        "divergence_note": ("The last films were a true violet shore with a vermilion ticket machine and an acid lemon lamp (11-10), an oxblood courtroom (11-09), a permafrost road (11-08), a teal transformer yard (11-07) and a tangerine office (11-06); 11-02 keyed its whole cab in sodium amber. "
                            "This film is a Fairbanks ice-fog noon, a pink-gold low sun behind milky fog over ice-black ground, with no lemon and no violet, amber only as emitted light on live mechanisms and never the key, and one deep crimson tail light, not vermilion. "
                            "Its light arcs from low sun to whiteout white to one lamp at night. Its shape contrast is a smooth domed puck and soft rings against jagged rime and broken ice, its throughline is the puck's frost state, and it ends on a crane-up to one small car on a vast road, not an eye-level bookend."),
        "treatment": {"title": "The Roof Puck", "summary": ad["treatment"]["judge_reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "anomaly-question", "frame1": "A mittened hand wipes a frosted window, a headlight sweeps a dry-looking road and it turns into a mirror holding a frosted roof puck upside down.",
                 "headline": "DO THEY KNOW BLACK ICE?", "motion_by_s": 0.3,
                 "loopback": "The button returns to a road at night under one lamp, the question-mark frost creeping back over the puck, and rises away to one small car reflected upside down in black ice, the mirror of frame one."},
        "open_loop": {"plant_t": b_at(8), "pay_t": b_at(44), "plant_glow_s": 0.4, "plant_sfx": "tick", "what": "How many cars, and when? Planted as a quiet blank odometer rolling in the corner of the phone with its own tick and a 0.4 s glow, paid when the same counter and a new blank calendar hold empty on the specialist's clipboard, NO COUNT, NO DATES."},
        "open_loop_2": {"plant_t": b_at(23), "pay_t": b_at(41), "what": "What does the system do when winter wins? Planted when the backup returns draw the road as dots thinning toward a dashed white wall, paid on the same dot road as the rings shrink, the car eases to the shoulder with hazards blinking and calendar leaves stack like snow, PAUSE FOR HOURS OR DAYS."},
        "throughline": {"object": "the RoofPuck", "lands_in_button": "the puck sits half frosted and half clear under a single lamp, frost creeping toward its eye",
                        "param_states": {str(k): v for k, v in PUCK_STATES.items()},
                        "states": [
                            {"at_s": b_at(3), "state": "S1 rimed and blind (frost 1.0, clearRing 0.0, mode blind)"},
                            {"at_s": b_at(13), "state": "S2 one wiper arc clear, eye open (frost 0.7, clearRing 0.2)"},
                            {"at_s": b_at(20), "state": "S3 heated clear ring (frost 0.15, clearRing 1.0, glow 1.0)"},
                            {"at_s": b_at(23), "state": "S4 whiteout, camera blind, backup rings glowing, Waymo's stated design (frost 0.3, clearRing 0.6, mode backup)"},
                            {"at_s": b_at(28), "state": "S5 clean and warm-lit at the weather station (frost 0.0, clearRing 1.0, glow 0.6)"},
                            {"at_s": b_at(33), "state": "S5 regressing, a gust frosts the rim of the clear eye as doubt enters (frost 0.25, clearRing 0.8)"},
                            {"at_s": b_at(47), "state": "S6 half frosted, half clear under one lamp (frost 0.5, clearRing 0.5)"}]},
        "reveals": [
            {"t": b_at(11), "type": "scale-pullback", "what": "the statewide pin gives way to Fairbanks as one dot, the camera craning down the map", "hold_s": 0.8},
            {"t": b_at(14), "type": "build-on", "what": "one fogged road splits into three lanes that lock in one by one", "hold_s": 0.8},
            {"t": b_at(29), "type": "scale-pullback", "what": "from one weather-station puck to an abstract snow field of unnumbered pings", "hold_s": 0.8},
            {"t": b_at(49), "type": "scale-pullback", "what": "from the half-frosted puck to one small car on a vast dark Fairbanks road under one lamp", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 1, "offset": 0.0, "level": 1.0}, {"line": 3, "offset": 0.0, "level": 1.2},
            {"line": 5, "offset": 0.0, "level": 0.5}, {"line": 6, "offset": 0.0, "level": 1.1}, {"line": 8, "offset": 0.0, "level": 0.6},
            {"at_s": round(b_at(35) + 0.3, 3), "level": 0.1}, {"at_s": round(b_at(35) + 0.9, 3), "level": 0.8},
            {"line": 11, "offset": 0.0, "level": 0.9},
            {"line": 12, "offset": 0.0, "level": 0.9}, {"at_s": b_at(44), "level": 1.2}, {"line": 13, "offset": 0.0, "level": 0.5},
            {"at_s": round(b_at(48) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(48) + 0.6, 3), "level": 1.6},
            {"at_s": 119.1, "level": 0.15}, {"at_s": 120.3, "level": 0.9}, {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(48) - 0.5, 3), "riser_at": round(b_at(42), 3), "silence_at": round(b_at(48) - 0.5, 3),
            "payoff_at": b_at(48), "button_pattern": "callback", "interrupt_at": b_at(22), "extra_dips": [round(b_at(35) + 0.3, 3), b_at(41)]},
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
    book.raise_if_missing("board_1111 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1111Ids.ts").write_text(
        "// GENERATED by scripts/board_1111.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
