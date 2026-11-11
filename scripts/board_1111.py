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
 (1, 0, 0.0, "whoosh", "a headlight beam", "sweeps a black frame across a dry-looking Fairbanks road and a pale sliver rakes across it until the road turns to a mirror holding the roof puck upside down", "uneasy", "ILLUSTRATIVE · BLACK ICE", "the reflection shivers", ""),
 (3, 0, W("testing"), "scrape", "the roof puck", "settles rimed in frost onto a dark car silhouette as the headlight passes, its lens eye blind white under a frost brow", "sleepy", "WAYMO SELF-DRIVING CAR", "frost ferns creep", ""),
 (4, 0, W("Do"), "wipe", "the puck's micro wiper", "drags one arc through the rime in the shape of a question mark and the lens eye blinks open", "startled", "\"DO THEY KNOW TO LOOK FOR BLACK ICE?\"", "the eyebrows jump", ""),
 (5, 0, W("black"), "crackle", "the question-mark patch", "freezes back over behind the wiper while the puck squints down at the mirror road", "wary", "A FAIRBANKS RESIDENT ASKED", "the frost crackles back", ""),
 (6, 1, 0.0, "paper-rustle", "a blog page card", "drops beside the puck with a date tab and the puck leans to read it", "curious", "NOVEMBER 5TH", "the card settles", ""),
 (7, 1, W("Alaska"), "pop", "a pin", "drops onto an Alaska plate and lands wide across the whole state", "curious", "CLOSED-COURSE TESTS · ALASKA", "the pin wobbles", ""),
 (8, 1, W("closed-course"), "tick", "a blank odometer counter", "rolls its drums beside the card and lands on blanks while snow fills a data drum below it", "puzzled", "HOW MANY CARS?", "the drums clack", "plant: the unfilled number"),
 (10, 2, 0.0, "thud", "the post's Alaska plate", "holds its blurred state-wide pin while the puck taps it with a wiper eyebrow", "careful", "THE POST SAYS ALASKA", "the pin stays wide", ""),
 (11, 2, W("names"), "pop", "a governor's post card", "slides over the map and its pin snaps down onto Fairbanks", "bright", "GOVERNOR'S POST · FAIRBANKS", "the pin snaps", ""),
 (12, 2, W("proving"), "chime", "a frost-rimmed banner", "unrolls over the Fairbanks pin as the puck squints proudly", "proud", "\"NO BETTER PROVING GROUND\"", "the banner flaps", ""),
 (13, 3, 0.0, "whoosh", "the puck on its car silhouette", "rides up to the head of a winter road as the camera cranes over it, one wiper arc clear and the eye open", "alert", "WAYMO STATEMENT", "snow plumes behind", "rehook: the camera cranes over the puck at the head of a winter road"),
 (14, 3, W("three"), "lock", "three lanes", "split from the road and lock in one by one, the first lighting with a silhouette driver's hands on the wheel", "focused", "THREE KINDS OF WORK", "the lane lines lock", ""),
 (16, 3, W("autonomous"), "click", "the second lane", "slides in with a specialist silhouette's hands hovering at the wheel as the puck steers", "focused", "SPECIALIST AT THE WHEEL", "the hands hover", ""),
 (17, 3, W("limited"), "tick", "the third lane", "lights as a closed course of cones with a short taped loop", "careful", "LIMITED STRUCTURED TESTING", "the cones wobble", ""),
 (18, 4, 0.0, "whoosh", "the puck", "splits open into a cutaway as the camera pushes into its shell", "proud", "SIXTH-GENERATION WAYMO DRIVER", "the shell halves part", ""),
 (19, 4, W("cameras"), "click", "three sensor layers", "light in turn inside the cutaway, camera, radar, lidar", "focused", "CAMERAS · RADAR · LIDAR", "each layer clicks in", ""),
 (20, 4, W("heaters"), "sizzle", "amber heater coils", "glow and melt the rime into a clear ring around the eye while the micro wipers flick", "relieved", "HEATERS · MICRO-WIPERS", "meltwater beads", ""),
 (21, 4, W("clear"), "pop", "the lens eye", "opens wide and clear inside its heated ring as sleet bounces off", "confident", "SENSORS KEPT CLEAR", "sleet bounces", ""),
 (22, 5, 0.0, "wind", "a whiteout", "floods the frame and the puck's camera eye goes blind white as it winces", "alarmed", "CAMERAS IN A WHITEOUT", "the eye blanks", ""),
 (23, 5, W("whiteout"), "pulse", "amber radar and lidar rings", "pulse out from the blind puck and draw the road ahead as dots, which thin out toward a dashed white wall", "determined", "ANOTHER SENSING SYSTEM BACKS IT UP", "the dots draw", "plant: what happens when winter wins"),
 (25, 6, 0.0, "clunk", "the camera", "drops under the car silhouette to four wheels on a glazed road", "tense", "UNDER EACH WHEEL", "the tires creak", "rehook: the camera drops under the car to four wheels on glazed ice"),
 (26, 6, W("each"), "tick", "four traction gauges", "rise one by one above the wheels, their amber needles swinging as the glaze shifts", "focused", "TRACTION · EACH WHEEL", "the needles twitch", ""),
 (27, 6, W("recreates"), "pour", "a digital grid", "pours a glass road out of light in a gridded box while the puck watches its own reflection", "curious", "SIMULATED BLACK ICE", "the glass ripples", ""),
 (28, 7, 0.0, "ping", "the puck", "sprouts a tiny vane and thermometer and sends out a ping", "chatty", "MOBILE WEATHER STATION", "the vane spins", ""),
 (29, 7, W("sharing"), "whoosh", "the camera", "pulls back from one puck to an unnumbered illustrative map of pucks pinging each other across snowy regions", "warm", "SHARED ACROSS THE FLEET · ILLUSTRATIVE", "the pings cross", ""),
 (30, 7, W("of"), "tick", "snowflake mile markers", "tick along routes in three snowy regions far from Alaska", "proud", "TENS OF THOUSANDS OF MILES", "the markers tick", ""),
 (32, 8, 0.0, "paper-rustle", "the whole design", "folds down into a single sheet pinned to a roadside billboard frame", "hopeful", "AN ANSWER ON PAPER", "the sheet's corner flaps", ""),
 (33, 8, W("Hold"), "creak", "a blank roadside billboard", "rolls up out of the snowbank beside the sheet as the puck holds its breath with its eyebrows raised", "uneasy", "HOLD THAT THOUGHT", "the billboard shudders", ""),
 (35, 9, W("stall"), "beep", "the stalled car silhouette", "blinks its tail light red once at the roadside as a resident's quote slams onto the billboard, then everything holds silent", "stern", "\"STALL OUT\"", "the tail light blinks", "rehook: one red tail light blinks on a stalled car in the dark"),
 (36, 9, W("shouldn't"), "thud", "a second billboard", "slams up beside the first as the puck shrinks back on its mount", "stern", "\"SHOULDN'T BE ALLOWED\"", "the puck flinches", ""),
 (37, 10, 0.0, "chime", "a third billboard", "rolls up with a ribbon while the puck, now clean, rides by under a specialist silhouette's hand on the wheel", "hopeful", "\"A GREAT OPPORTUNITY\"", "the ribbon flutters", ""),
 (39, 11, 0.0, "paper-rustle", "the blog page card", "returns frosted at the edges and a gauge on it climbs toward a dashed line", "wary", "WAYMO'S OWN POST", "the needle climbs", ""),
 (41, 11, W("pause"), "lock", "a PAUSE sign", "drops over a small city street and calendar leaves stack from hours into days behind it", "sober", "PAUSE FOR HOURS OR DAYS", "the leaves stack", ""),
 (42, 12, 0.0, "riser", "the puck", "looks from the paper sheet back to the dark road", "uncertain", "IS PAPER ENOUGH?", "the sheet rustles", ""),
 (43, 12, W("how"), "clack", "the odometer counter", "rolls its drums again and lands on blanks", "puzzled", "HOW MANY CARS?", "the drums clack", ""),
 (44, 12, W("dates"), "thud", "a blank calendar", "flips up beside the blank counter and both hold empty", "flat", "NO COUNT · NO DATES", "the calendar sways", ""),
 (45, 13, 0.0, "typewriter", "a reporter's notepad", "slides under a desk light as a question types onto it line by line", "curious", "A REPORTER ASKED", "the keys clack", ""),
 (46, 13, W("Waymo"), "hush", "the reply field", "stays empty while its cursor blinks", "flat", "NOT YET ANSWERED", "the cursor blinks", ""),
 (47, 14, 0.0, "hum", "the roof puck", "sits half frosted and half clear under a sodium lamp on the road from the opening", "pensive", "WAYMO'S POST IS A CLAIM", "the lamp buzzes", ""),
 (49, 14, W("What"), "crackle", "the question-mark frost patch", "reforms on the puck's frosted half as its clear eye turns to the viewer", "searching", "WHAT WOULD YOU WANT PROVEN?", "the road glints", ""),
]

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "macro-closeup", "close", "ground", "mirror-road-night", "macro-closeup", "single-object-void", "horizontal-traverse", "instrument-as-subject", "", "", "The mirror road", "A headlight finds a road that is really a mirror and a frosted puck wipes one question mark clear"),
 (2, 1, "push-detail", "medium", "eye", "dusk-roadside", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "instrument-as-subject", "hard-cut", "carry", "The post", "The puck reads a dated blog card, a pin lands wide on Alaska and a blank counter rolls"),
 (3, 2, "map-territory", "wide", "overhead", "alaska-map", "top-down-map", "map-territory", "vertical-descent", "data-as-subject", "graphic-match", "match", "Alaska and Fairbanks", "The post's pin stays wide on Alaska and the governor's card snaps a pin onto Fairbanks"),
 (4, 3, "wide-establish", "extreme-wide", "high", "three-lane-road", "orbital-aerial", "stacked-layers", "assemble-build", "structure-as-subject", "whip-pan", "travel", "Three kinds of work", "The road splits into three lanes that lock in and light, manual, specialist, structured"),
 (5, 4, "subject-portrait", "insert", "eye", "puck-cutaway", "cross-section-cutaway", "single-object-void", "radial-emanate", "instrument-as-subject", "graphic-match", "match", "Inside the puck", "The puck opens, three sensor layers light and amber heaters melt a clear ring around its eye"),
 (6, 5, "push-detail", "close", "eye", "whiteout-road", "instrument-screen", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "mask-wipe", "build", "The whiteout", "The camera eye goes blind white and amber backup rings draw the road as dots"),
 (7, 6, "alt-vantage", "medium", "ground", "under-car-ice", "cross-section-cutaway", "grid-modular", "assemble-build", "data-as-subject", "hard-cut", "carry", "Under each wheel", "Under the car four traction gauges light and a simulated glass road is poured"),
 (8, 7, "map-territory", "extreme-wide", "overhead", "fleet-map", "top-down-map", "map-territory", "radial-emanate", "multiplicity-swarm", "map-travel", "travel", "The weather station", "One puck pings and the camera pulls back to an unnumbered map of pucks sharing what they see"),
 (9, 8, "push-detail", "medium", "eye", "billboard-sheet", "eye-level-immersive", "single-object-void", "vertical-descent", "structure-as-subject", "morph", "match", "On paper", "The whole design folds into one sheet pinned to a roadside billboard"),
 (10, 9, "wide-establish", "wide", "low", "billboard-row", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "carried-element", "carry", "The test", "Three roadside billboards carry the skeptics and the mayor, a stalled car blinks red once"),
 (11, 11, "data-panel", "medium", "eye", "post-gauge", "instrument-screen", "hud-instrument-frame", "vertical-rise", "data-as-subject", "hard-cut", "carry", "When winter wins", "The post returns frosted, a gauge crosses its line and a PAUSE sign drops over a city"),
 (12, 12, "two-up", "close", "eye", "counter-calendar", "macro-closeup", "fullbleed-split", "scroll-data", "data-as-subject", "match-cut", "match", "No count, no dates", "The counter from the open rolls to blanks beside a blank calendar"),
 (13, 13, "push-detail", "insert", "high", "reporter-notepad", "macro-closeup", "single-object-void", "push-in-only", "instrument-as-subject", "hard-cut", "carry", "Not yet answered", "A reporter's question is typed and the reply field stays empty"),
 (14, 14, "wide-establish", "wide", "ground", "mirror-road-return", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "instrument-as-subject", "graphic-match", "match", "The button", "The opening road under a sodium lamp, the puck half frosted half clear, the question mark reforms"),
]

AMBIENT = {1: "wind over the road, frost ferns crackle, the headlight hums", 2: "wind in the spruce, the card flutters, the drums tick", 3: "the map paper settles, the pins wobble",
           4: "tires hiss on packed snow, lane lines lock", 5: "heater coils tick, meltwater drips, sleet bounces", 6: "the whiteout roars, radar rings pulse",
           7: "the ice creaks under the tires, the needles twitch", 8: "the vane spins, pings cross the map", 9: "the sheet flaps on the billboard frame",
           10: "wind on the billboards, a car idles", 11: "the gauge needle ticks, calendar leaves turn", 12: "the drums settle, the calendar sways",
           13: "the desk light hums, the cursor blinks", 14: "the sodium lamp buzzes, snow falls, wind over the road"}
CENTER = {1: "the puck reflection at x540 y1080", 2: "the puck at x540 y900 and the card at x760 y980", 3: "the Fairbanks pin at x560 y860", 4: "the three lanes at x540 y980",
          5: "the puck cutaway at x540 y940", 6: "the blind eye at x540 y900", 7: "the four gauges at x540 y920", 8: "the pucks at x540 y960", 9: "the sheet at x540 y900",
          10: "the middle billboard at x540 y860", 11: "the gauge at x540 y900", 12: "the counter at x400 y960 and the calendar at x700 y960", 13: "the notepad at x540 y960", 14: "the puck at x540 y940"}
HERO = {
 1: ("roof puck + mirror road + headlight beam + question-mark frost patch", "60% puck and reflection, 25% road, 15% headlight"),
 2: ("roof puck + blog card + Alaska pin + blank odometer", "55% puck, 25% card and pin, 20% counter"),
 3: ("Alaska map + two pins + two post cards + banner", "60% map and pins, 30% cards, 10% banner"),
 4: ("three lanes + car silhouette with puck + driver hands + cones", "60% lanes, 25% car and puck, 15% hands and cones"),
 5: ("puck cutaway + sensor layers + heater coils + micro wipers", "65% cutaway, 25% coils and wipers, 10% sleet"),
 6: ("blind puck + backup rings + dot road + white wall", "55% puck and rings, 30% dot road, 15% white wall"),
 7: ("four wheels + traction gauges + glazed road + simulation box", "55% gauges, 30% wheels and glaze, 15% simulation box"),
 8: ("weather-station puck + illustrative map of pucks + mile markers", "55% map and pings, 30% puck, 15% markers"),
 9: ("paper sheet + billboard frame + puck", "65% sheet, 25% frame, 10% puck"),
 10: ("three billboards + stalled car silhouette + clean puck + specialist hand", "60% billboards, 25% stalled car, 15% puck and hand"),
 11: ("post card + gauge + PAUSE sign + calendar leaves", "55% gauge and sign, 30% card, 15% leaves"),
 12: ("blank odometer + blank calendar + puck", "60% counter and calendar, 30% blank drums, 10% puck"),
 13: ("notepad + typed question + empty reply field", "65% notepad, 25% reply field, 10% desk light"),
 14: ("half-frosted puck + sodium lamp + mirror road + question-mark patch", "60% puck, 25% lamp cone, 15% road"),
}
PARTS = {1: 46, 2: 44, 3: 38, 4: 42, 5: 58, 6: 44, 7: 48, 8: 52, 9: 34, 10: 50, 11: 40, 12: 38, 13: 32, 14: 48}
KICKS = (4, 23, 35)
CAMERA = {1: "dollyThrough", 2: "dollyThrough", 3: "craneDown", 4: "craneDown+dollyThrough", 5: "dollyThrough", 6: "static:the whiteout is the move",
          7: "truckAcross", 8: "craneDown", 9: "static:the paper holds still while the design folds", 10: "truckAcross", 11: "static:a calm read of the post",
          12: "truckAcross", 13: "dollyThrough", 14: "dollyThrough"}

PALETTE = ("plum twilight sky, hoarfrost puck and paper, ice-black road, sodium amber on live mechanisms only, a single red taillight blink")


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
        nx = beats[i + 1]["at_s"] if i + 1 < len(beats) else end + 3.0
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
                    "and a statement quoted by KTUU lists three kinds of work there, manual data collection, autonomous driving with a specialist at the wheel and limited structured testing. "
                    "A Fairbanks resident asked whether the testers know to look for black ice. The film answers with Waymo's published design drawn as states of one roof sensor puck with a face, "
                    "heated sensors and micro wipers, a backup sensing system in a whiteout, traction under each wheel, simulated black ice and a fleet that shares the weather, "
                    "then gives the skeptics full strength on roadside billboards and concedes that the answer so far is on paper. Waymo's own post says service can pause for hours or days, "
                    "the reports give no car count and no dates, and the button leaves the puck half frosted and half clear. This winter is the test."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "macro-closeup", "motion_vector": "radial-emanate", "hero_treatment": "instrument-as-subject", "layout": "centered-hero-lowerthird",
                        "register": "naturalistic-scene", "palette": PALETTE, "camera_strategy": "dolly-through",
                        "light_story": "dusk-silhouette",
                        "metaphor": "the roof sensor puck as the car's eye: every mechanism Waymo published is a state of that one face, and the winter decides which state it ends in"},
        "palette": PALETTE,
        "divergence_note": ("The last films were a true violet shore with a vermilion ticket machine (11-10), an oxblood courtroom (11-09), a permafrost road (11-08), a teal transformer yard (11-07) and a tangerine office (11-06). "
                            "This film is a plum Fairbanks dusk with a hoarfrost sensor puck that has a face, amber only where a mechanism is live and one tail-light red blink. "
                            "It is shot close on one object, a cutaway, a whiteout and a row of roadside billboards, with no paper machine, desk or courtroom, and its throughline is the puck's frost state."),
        "treatment": {"title": "The Roof Puck", "summary": ad["treatment"]["judge_reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "hook": {"pattern": "anomaly-question", "frame1": "A black frame, a headlight sweeps a dry-looking road and a pale sliver turns it into a mirror holding a frosted roof puck upside down.",
                 "headline": "DO THEY KNOW BLACK ICE?", "motion_by_s": 0.3,
                 "loopback": "The button returns to the opening road under a sodium lamp and the question-mark frost patch reforms on the puck, rhyming with the open."},
        "open_loop": {"plant_t": b_at(8), "pay_t": b_at(44), "what": "How many cars, and when? Planted when a blank odometer counter rolls to blanks beside the post, paid when the same counter lands blank beside a blank calendar, NO COUNT, NO DATES."},
        "open_loop_2": {"plant_t": b_at(23), "pay_t": b_at(41), "what": "What does the system do when winter wins? Planted when the backup rings draw the road as dots that thin toward a dashed white wall, paid when Waymo's own post drops a PAUSE sign over a city, hours or days."},
        "throughline": {"object": "the RoofPuck", "lands_in_button": "the puck sits half frosted and half clear under a sodium lamp",
                        "states": [
                            {"at_s": b_at(3), "state": "rimed in frost, its eye blind white"},
                            {"at_s": b_at(13), "state": "one wiper arc clear, eye open, frost still on the rim"},
                            {"at_s": b_at(20), "state": "heated clear ring around the eye"},
                            {"at_s": b_at(23), "state": "camera eye blind in a whiteout, backup rings glowing amber"},
                            {"at_s": b_at(37), "state": "clean, riding under a specialist's hand at the wheel"},
                            {"at_s": b_at(47), "state": "half frosted, half clear under a sodium lamp"}]},
        "reveals": [
            {"t": b_at(14), "type": "build-on", "what": "one winter road splits into three lanes that lock in one by one", "hold_s": 0.8},
            {"t": b_at(29), "type": "scale-pullback", "what": "from one weather-station puck to an unnumbered map of pucks sharing what they see", "hold_s": 0.8},
            {"t": b_at(41), "type": "build-on", "what": "a PAUSE sign over a city and calendar leaves stacking from hours into days", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 1, "offset": 0.0, "level": 1.0}, {"line": 3, "offset": 0.0, "level": 1.2},
            {"line": 5, "offset": 0.0, "level": 0.5}, {"line": 6, "offset": 0.0, "level": 1.1}, {"line": 8, "offset": 0.0, "level": 0.6},
            {"at_s": round(b_at(35) + 0.3, 3), "level": 0.1}, {"at_s": round(b_at(35) + 0.9, 3), "level": 0.8},
            {"line": 11, "offset": 0.0, "level": 0.9},
            {"at_s": round(b_at(44) - 0.3, 3), "level": 0.12}, {"at_s": round(b_at(44) + 0.8, 3), "level": 1.6},
            {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(35) + 0.3, 3), "riser_at": round(b_at(42), 3), "silence_at": round(b_at(35) + 0.3, 3),
            "payoff_at": b_at(44), "button_pattern": "callback", "interrupt_at": b_at(22), "extra_dips": [b_at(41)]},
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
