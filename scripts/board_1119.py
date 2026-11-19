#!/usr/bin/env python3
"""2026-11-19 "One Thousand Knocks": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1119.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1119.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
SLIP = "Slip, a chubby folded paper route card with a worried face, no hands and a dashed pencil route on its belly"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "slam", "a wide-eyed faced jet airliner at a Ted Stevens Anchorage gate", "strains forward as a boxed plate slams down in front of its nose and a traffic cone slides under its nose wheel", "shocked", "NOV 13 · NATIONWIDE GROUND STOP", "the jet winces", ""),
 (2, 0, W("leaving"), "stamp", "a Super Cub bush plane on the other half of the apron", "blurs its prop and lifts off over the Chugach while a stamp lands across only the jet's half", "carefree", "FLIGHTS OUT OF ALASKA GROUNDED · PER AN AIRPORT OFFICIAL", "the Cub climbs", ""),
 (3, 1, 0.0, "pin", "a cork evidence board beside an office window onto the Chugach", "holds a pinned Alaska map whose in-state strings to Bethel, Nome and Juneau pulse while the strings off the map's edge freeze stiff", "steady", "IN STATE FLIGHTS NOT IMPACTED · PER ALASKA AIRLINES", "the in-state strings pulse", ""),
 (4, 1, W("said"), "tick", "a brass stopwatch pinned on the board", "sweeps past four hour marks as a small card pins up beside it", "tense", "MORE THAN 4 HOURS · 2ND SINCE 9/11", "the hand sweeps", ""),
 (5, 2, 0.0, "rustle", "two lumpy tarps pinned under the map, each tagged NEW", "swell and shake as something under each one pushes against the cork", "curious", "TWO NEW THINGS THAT WEEK", "the tarps ripple", ""),
 (6, 2, W("One"), "swish", "a desk lamp spotlight", "swings across the board and lands on the left tarp, where a small AI tag dangles", "suspicious", "ONE OF THEM WAS AI", "the tag swings", ""),
 (7, 3, 0.0, "flip", "a desk calendar", "flips back three pages to NOV 10 as the left tarp slides off a map of control center domes", "brisk", "NOV 10 · ALL 22 CENTERS", "the pages flip", ""),
 (8, 3, W("SMART"), "chime", "22 control center domes on a US map", "light up one by one as a little paper slip drops into each", "busy", "SMART · BUILT BY AIR SPACE INTELLIGENCE", "the domes light", ""),
 (9, 3, W("centers"), "whoosh", "a fat persimmon arrow", "swings from the NOV 10 page across to the NOV 13 page", "pointed", "3 DAYS LATER", "the arrow lands", ""),
 (10, 4, 0.0, "bubble", SLIP, "soaks in streams of weather and schedule icons through a cutaway of its folds and draws a dashed route", "focused", "AI THAT PREDICTS CONGESTION", "the route draws", "rehook: a paper card soaks up the sky's data and draws a route"),
 (11, 4, W("suggests"), "slide", "Slip", "slides its route across a desk to a faceless controller's hand, which picks it up and decides", "humble", "IT ADVISES · PEOPLE DECIDE", "the hand picks it up", ""),
 (12, 5, 0.0, "pin", "Slip, back on the board", "is pinned to the board's center under the spotlight with red question strings running to it", "scared", "THE QUESTION · IS IT THE AI?", "Slip folds smaller", ""),
 (13, 5, W("result"), "clip", "a quote plate", "slams onto the board beside Slip and bounces once, no check mark on it", "plain", "\"NOT BASED ON OR A RESULT OF THE SMART SYSTEM\" · PER ASI", "the plate clips on", ""),
 (14, 6, 0.0, "step", "a faceless figure tagged SEC. SEAN DUFFY", "walks in and slaps a second quote plate onto the board beside the first", "firm", "\"COMPLETELY DISCONNECTED\" · DUFFY", "the figure steps in", ""),
 (15, 6, W("copper"), "thunk", "a dull coil of old copper wire", "drops beside the board onto a CLAIM card, its oversized DUFFY SAID tag sliding down the wire", "sheepish", "\"1980S LITTLE COPPER LINES\" · DUFFY SAID", "the tag slides", ""),
 (16, 7, 0.0, "hum", "a big magnifying glass tagged MULLIN", "hovers over Slip and never lands while Slip sweats a bead of ink", "nervous", "\"CAN'T RULE OUT ANYTHING AT THIS POINT\" · MULLIN", "the glass hovers", ""),
 (17, 7, W("anything"), "tap", "two source tags", "swing down under the two denial plates, one tagged THE MAKER and one tagged DUFFY", "pointed", "A DENIAL · NOT A FINDING", "the tags swing", ""),
 (18, 7, W("point"), "flutter", "a small snapshot pinned in the board's corner", "drops into the board's corner on a falling pin, showing a shadowed dispatch desk where a hand hovers over a screen", "quiet", "A DISPATCH DESK NEAR SEATTLE", "the snapshot flutters", ""),
 (19, 8, 0.0, "page", "a stack of letters", "slides onto the board as gray fog rolls off it", "uneasy", "OCT · MORE THAN 2 DOZEN LAWMAKERS ASKED FOR A PAUSE", "the fog rolls", ""),
 (20, 8, W("transparency"), "hush", "the fog", "rolls across half the board and swallows the plates under it", "uneasy", "\"EGREGIOUS LACK OF TRANSPARENCY\"", "the fog drifts", ""),
 (21, 9, 0.0, "creak", "a faceless hand tagged FAA", "slides in through the window and reaches for an uncut pie tagged ASI on the sill", "tempted", "FAA SEEKS A STAKE IN ASI", "the hand reaches", ""),
 (22, 9, W("confirmed"), "thock", "the pie", "stays whole as the hand stops short and hovers", "plain", "NO DEAL CONFIRMED", "the hand stops", ""),
 (23, 10, 0.0, "rattle", "a Moose, a Raven and a Bald Eagle on a gallery bench", "lean in toward the board as the second tarp twitches", "curious", "NO OFFICIAL HAS LINKED SMART TO THE OUTAGE", "the second tarp twitches", "rehook: three animals lean in and the second tarp twitches"),
 (24, 11, 0.0, "tear", "the second tarp", "is yanked off the board and the photo under it grows into a cable vault at night", "startled", "PER CBS · CITING THE FAA AND L3HARRIS", "the tarp flies off", ""),
 (25, 11, W("router"), "clank", "a faceless new router with packing peanuts and a FRAGILE sticker", "slides into a rack, its LEDs flickering", "jittery", "A NEW ROUTER · EL DORADO, ARKANSAS", "the LEDs flicker", ""),
 (26, 11, W("Arkansas"), "snap", "a fiber cyan string", "pulls taut from the board's center pin to the router", "sharp", "WHERE THE TRACE POINTS", "the string twangs", ""),
 (27, 12, 0.0, "scrape", "a dull copper line in the vault", "is cut and snapped into a glowing cyan fiber strand by faceless gloved hands, sparks popping", "busy", "COPPER TO FIBER UPGRADE · DUFFY SAID", "the splice glows", ""),
 (28, 13, 0.0, "buzz", "a flood of cyan pulses", "pours out of the router down a cable toward an older system's single intake slot", "frantic", "PER THE FAA", "the pulses pour", ""),
 (29, 13, W("seconds"), "tick", "a counter beside a stopwatch", "climbs from 0 to 1,000 over one full 4.5 second sweep", "frantic", "1,000 TRIES EVERY 4 TO 5 SECONDS", "the counter climbs", "rehook: a counter races to 1,000 over one stopwatch sweep"),
 (30, 13, W("long"), "stop", "the counter", "lands on 1,000 as the sweep completes and the intake slot jams and its door bulges", "overwhelmed", "\"OVERWHELMING THE OLDER SYSTEM\" · MULLIN SAID", "the door bulges", ""),
 (31, 14, 0.0, "slide", "the camera", "pulls back out of the vault onto the board, where the copper coil's DUFFY SAID tag flutters off its CLAIM card", "wry", "COPPER GOT BLAMED", "the tag flutters off", ""),
 (32, 14, W("replacement"), "swing", "the red question strings to Slip", "sag slack but stay pinned while the cyan string to the router glows", "uneasy", "THE TRACE POINTS AT ITS REPLACEMENT", "the strings sag", ""),
 (33, 15, 0.0, "pencil", "a paper tag on the board's center pin", "is pencilled and swings on its string", "plain", "WHY IT FAILED · NOT YET FINAL", "the tag swings", ""),
 (34, 16, 0.0, "rumble", "the camera", "pulls back from the one router to a field of 3,648 router outlines, nearly all dark", "awed", "3,648 ROUTERS · PER THE CONTRACTOR VIA SENATE COMMERCE DEMOCRATS", "the field opens", "rehook: one router becomes a field of 3,648, nearly all dark"),
 (35, 16, W("running"), "ping", "69 router outlines in the field", "flicker on cyan one after another and pulse among the dark ones while 400 sit outlined", "small", "400 INSTALLED · 69 RUNNING", "the 69 glow", ""),
 (36, 17, 0.0, "door", "the shadowed dispatch desk from the snapshot", "lights up, a sibling paper slip tagged FLYWAYS on its screen", "warm", "ALASKA AIRLINES · FLYWAYS · SINCE 2021", "the lamp clicks on", ""),
 (37, 18, 0.0, "slide", "the FLYWAYS slip", "unfolds and slides three dashed routes across the screen", "eager", "IT SUGGESTS BETTER ROUTES", "the routes fan out", ""),
 (38, 18, W("decides"), "tap", "a faceless dispatcher's hand", "drops onto the second route and taps it in, and the slip bounces a small nod", "content", "THE DISPATCHER DECIDES · PER ALASKA'S OPS CHIEF VIA NPR", "the slip nods", ""),
 (39, 19, 0.0, "ching", "a fuel gauge on the desk", "swings its needle up as a gallon counter rolls over", "pleased", "ABOUT 1 MILLION GALLONS A YEAR · PER ALASKA AIRLINES", "the counter ticks", ""),
 (40, 20, 0.0, "whoosh", "the camera", "pulls back out of the office window onto the split apron, the Cub banking over the Chugach and the jet waiting by its cone", "calm", "BLAME CAN WAIT FOR THE FINDINGS", "the apron opens", ""),
 (41, 20, W("right"), "bell", "Slip on the board in the office window", "still pinned beside NOT YET FINAL, turns and lifts its face toward the window as the bell lands", "hopeful", "GETTING THE CUTOVER RIGHT CAN'T", "Slip looks out", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 42)}
PLATE_AT.update({1: "lower-third", 16: "lower-third", 24: "lower-third", 40: "lower-third"})
CLAIM_MAP = {1: ["c1"], 2: ["c2"], 3: ["c3"], 4: ["c5", "c6"], 5: ["c7", "c18"], 6: ["c7"], 7: ["c7"], 8: ["c39", "c11"], 9: ["c8"], 10: ["c9"],
             11: ["c10"], 12: ["narration"], 13: ["c13"], 14: ["c14"], 15: ["c15"], 16: ["c23"], 17: ["c37"], 18: ["c28"], 19: ["c26"], 20: ["c26"],
             21: ["c42"], 22: ["c42"], 23: ["c8"], 24: ["c18"], 25: ["c18"], 26: ["c18"], 27: ["c19"], 28: ["c20"], 29: ["c20"], 30: ["c21"],
             31: ["c15"], 32: ["c18", "c19"], 33: ["c22"], 34: ["c45"], 35: ["c45"], 36: ["c27"], 37: ["c28"], 38: ["c29"], 39: ["c31"], 40: ["narration"],
             41: ["narration"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "extreme-wide", "high", "anchorage-apron", "top-down-map", "fullbleed-split", "vertical-rise", "structure-as-subject", "", "", "The split apron", "Over the Ted Stevens Anchorage apron in low persimmon sun, a plate slams in front of a wide-eyed jet and a stamp grounds only its half while a Super Cub lifts off over the Chugach"),
 (2, 1, "map-territory", "medium", "eye", "evidence-board-wall", "eye-level-immersive", "grid-modular", "radial-emanate", "data-as-subject", "graphic-match", "match", "The board", "A cork evidence board by an office window holds an Alaska map whose in-state strings pulse while the strings off its edge freeze, and a stopwatch sweeps past four hours"),
 (3, 2, "push-detail", "close", "eye", "board-tarps", "macro-closeup", "centered-hero-lowerthird", "push-in-only", "instrument-as-subject", "push-in", "build", "Two new things", "Two lumpy tarps tagged NEW ripple under the map and a spotlight swings onto the left one where a small AI tag dangles"),
 (4, 3, "map-territory", "wide", "high", "centers-map", "orbital-aerial", "map-territory", "radial-emanate", "multiplicity-swarm", "map-travel", "travel", "Twenty two centers", "A calendar flips back to NOV 10 and 22 control center domes light across a US map as a paper slip drops into each, then a fat arrow swings to NOV 13"),
 (5, 4, "macro-closeup", "insert", "eye", "slip-cutaway", "cross-section-cutaway", "single-object-void", "assemble-build", "instrument-as-subject", "push-in", "build", "It only suggests", "A cutaway of Slip's folds soaking in weather and schedule streams and drawing a dashed route it slides to a faceless controller's hand"),
 (6, 5, "two-up", "medium", "eye", "evidence-board-wall", "eye-level-immersive", "grid-modular", "assemble-build", "instrument-as-subject", "carried-element", "carry", "The denials", "Slip is pinned to the board's center under the spotlight, two quote plates clip on beside it with no check marks, and a copper coil drops beside the board on a CLAIM card"),
 (7, 7, "subject-portrait", "close", "low", "board-close", "macro-closeup", "centered-hero-lowerthird", "push-in-only", "instrument-as-subject", "match-cut", "match", "The glass that never lands", "A magnifying glass tagged MULLIN hovers over Slip and never lands, then source tags swing under the denials and a snapshot of a dark dispatch desk flutters in the corner"),
 (8, 8, "wide-establish", "wide", "eye", "board-and-sill", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "pull-out", "build", "Fog and pie", "Letters slide on as gray fog rolls across the board, and a faceless FAA hand reaches toward an uncut ASI pie on the windowsill and stops short"),
 (9, 10, "alt-vantage", "medium", "ground", "gallery-bench", "eye-level-immersive", "single-object-void", "vertical-rise", "multiplicity-swarm", "whip-pan", "carry", "The gallery", "From low by the gallery bench a Moose, a Raven and a Bald Eagle lean in toward the board as the second tarp twitches"),
 (10, 11, "push-detail", "close", "eye", "el-dorado-vault", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "structure-as-subject", "mask-wipe", "build", "The other new thing", "The second tarp is yanked off and the photo grows into a night cable vault in El Dorado where a faceless new router with packing peanuts slides into a rack and a cyan string pulls taut to it"),
 (11, 12, "data-panel", "wide", "eye", "vault-cutaway", "cross-section-cutaway", "stacked-layers", "horizontal-traverse", "structure-as-subject", "push-in", "build", "One thousand knocks", "A cross-section of the vault, copper spliced into cyan fiber, pulses pouring from the router to an older system's intake slot while a counter climbs to 1,000 over one 4.5 second sweep"),
 (12, 14, "alt-vantage", "medium", "high", "evidence-board-wall", "top-down-map", "grid-modular", "push-in-only", "instrument-as-subject", "pull-out", "carry", "Not yet final", "Back on the board from above, the copper coil's tag flutters off, the question strings to Slip sag slack but stay pinned, and a pencilled NOT YET FINAL tag swings on the center pin"),
 (13, 16, "wide-establish", "extreme-wide", "overhead", "router-field", "orbital-aerial", "grid-modular", "vertical-rise", "multiplicity-swarm", "pull-out", "travel", "Sixty nine of 3,648", "The camera pulls back from one router to a field of 3,648 router outlines, nearly all dark, 69 glowing cyan"),
 (14, 17, "two-up", "close", "eye", "seattle-desk", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "instrument-as-subject", "hard-cut", "build", "The dispatcher decides", "Lights come up on a dispatch desk near Seattle where a sibling slip tagged FLYWAYS offers three routes and a faceless hand picks one"),
 (15, 20, "wide-establish", "extreme-wide", "high", "anchorage-apron", "top-down-map", "fullbleed-split", "vertical-rise", "structure-as-subject", "pull-out", "match", "Back to the apron", "Out through the office window to the split apron, the Cub banking over the Chugach, the jet by its cone, Slip still pinned on the board in the window"),
]

AMBIENT = {1: "a jet idle whine, wind over the apron", 2: "an office hush, a wall clock", 3: "an office hush, tarp rustle", 4: "a soft radio crackle", 5: "paper rustle, a data hum",
           6: "an office hush, a wall clock", 7: "a lamp buzz", 8: "wind at the window, paper", 9: "an office hush, a bench creak", 10: "a vault fan hum",
           11: "a vault fan hum, a fast data buzz", 12: "an office hush", 13: "a low wind", 14: "a dispatch room murmur, keyboard", 15: "a jet idle whine, wind over the apron"}
CENTER = {1: "the jet at x700 y1040", 2: "the map at x540 y960", 3: "the tarps at x540 y1000", 4: "the domes at x540 y980", 5: "Slip at x540 y1000",
          6: "Slip at x540 y980", 7: "the glass at x540 y940", 8: "the board at x500 y960", 9: "the bench at x540 y1100", 10: "the router at x540 y1000",
          11: "the counter at x540 y980", 12: "the center pin at x540 y980", 13: "the field at x540 y1000", 14: "the slip at x540 y1000", 15: "the jet at x700 y1040"}
HERO = {
 1: ("faced jet + plate + cone + Super Cub + Chugach + apron", "40% jet and plate, 30% Cub and range, 30% apron"),
 2: ("cork board + Alaska map + pulsing strings + frozen strings + stopwatch + window", "45% map, 30% board, 25% window and stopwatch"),
 3: ("two tarps + NEW tags + spotlight + AI tag", "50% tarps, 30% spotlight, 20% tags"),
 4: ("US map + 22 domes + paper slips + calendar + arrow", "45% map and domes, 30% calendar, 25% arrow"),
 5: ("Slip cutaway + data streams + dashed route + controller hand", "50% Slip, 30% streams, 20% hand"),
 6: ("Slip pinned + quote plates + Duffy figure + copper coil + CLAIM card", "40% Slip and plates, 30% figure, 30% coil"),
 7: ("magnifying glass + Slip + source tags + snapshot", "45% glass and Slip, 30% tags, 25% snapshot"),
 8: ("board + letters + fog + FAA hand + ASI pie + sill", "40% board, 30% hand and pie, 30% fog"),
 9: ("Moose + Raven + Bald Eagle + bench + twitching tarp", "50% animals, 30% bench, 20% tarp"),
 10: ("vault + router + peanuts + FRAGILE sticker + cyan string", "50% router, 30% vault, 20% string"),
 11: ("vault cross-section + copper splice + fiber + pulses + intake slot + counter + stopwatch", "40% pulses and slot, 30% counter, 30% splice"),
 12: ("board from above + slack strings + NOT YET FINAL tag + copper coil", "45% board, 30% tag, 25% coil"),
 13: ("3,648 router outlines + 69 glowing", "70% field, 30% glow"),
 14: ("dispatch desk + FLYWAYS slip + dashed routes + dispatcher hand + fuel gauge", "40% slip, 30% hand, 30% desk"),
 15: ("split apron + Cub + jet + cone + office window + board", "40% apron, 30% Cub and range, 30% window"),
}
PARTS = {1: 52, 2: 48, 3: 40, 4: 50, 5: 46, 6: 52, 7: 44, 8: 48, 9: 46, 10: 50, 11: 56, 12: 48, 13: 40, 14: 46, 15: 54}
KICKS = (1, 24)
CAMERA = {1: "craneDown", 2: "dollyThrough", 3: "dollyThrough", 4: "craneDown", 5: "dollyThrough", 6: "truckAcross", 7: "dollyThrough",
          8: "truckAcross", 9: "riseWith", 10: "dollyThrough", 11: "truckAcross", 12: "craneDown", 13: "riseWith", 14: "truckAcross", 15: "riseWith"}

PALETTE = ("persimmon low daylight #E0662B above peach #F4B183 and brick zenith #9C3F2A above the Anchorage apron, "
           "bone ivory paper and drifts #F2E8D0 with buff #C9B48E, pine vault dark #0E5A63 down to #082F35, "
           "cork #B07A48 board, brick-red question string #B8323A, dull penny copper #8A5A3A, card stock #F7EFDC with graphite #4A4A52, "
           "fiber cyan #39F0FF held for the traced mechanism")


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
        "run_date": "2026-11-19", "slug": "one-thousand-knocks", "title": "One Thousand Knocks",
        "concept": ("On November 13th a nationwide ground stop held every flight leaving Alaska while flights inside Alaska kept flying. Two new things were going in that week. "
                    "Three days earlier the FAA had expanded SMART, an advisory AI tool built by Air Space Intelligence that predicts congestion and only suggests, to all 22 en route centers. "
                    "ASI said the stop wasn't a result of SMART, Duffy called SMART completely disconnected and blamed 1980s little copper lines, Mullin said you can't rule out anything at this point, "
                    "lawmakers had asked in October to pause SMART over transparency and the FAA is seeking a stake in ASI. Then, per CBS citing the FAA and L3Harris, the trace pointed at the other new thing, "
                    "a router going in at El Dorado, Arkansas during a copper to fiber cutover, devices trying to connect 1,000 times every 4 to 5 seconds. Why it failed isn't final, and per the contractor only 69 of 3,648 new routers were running. "
                    "Alaska Airlines has used ASI's Flyways since 2021, it suggests and the dispatcher decides. Drawn as Slip, a faced paper route card with no hands, pinned to an evidence board under a question, "
                    "beside a second tarp that comes off a faceless router in a night vault, and a 4.5 second counting hold."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "macro-closeup", "motion_vector": "assemble-build", "hero_treatment": "instrument-as-subject", "layout": "grid-modular",
                        "register": "case-file-cartoon", "palette": PALETTE, "camera_strategy": "push-reveal",
                        "light_story": "low persimmon November sun over the Anchorage apron, then an office board lit by a desk lamp spotlight, then a night cable vault under one caged work lamp with cyan pulses, then the screen glow of a dispatch desk, then the apron sun again",
                        "metaphor": "a detective's evidence board where a paper suggestion card is pinned under a question and the strings go slack when a second tarp comes off a router"}, "signature_shot": 11,
        "palette": PALETTE,
        "divergence_note": ("The last films were a sunless mint afterglow over lilac snow with a faced chalk-line reel and ultramarine chalk (11-18), polar night and midnight-sun honey with a troupe of faced decision trees and radar lime (11-16), "
                            "a rain-black Juneau night at one gunmetal letterbox (11-15), and a rose-line dusk dome over a survey stake (11-12). "
                            "This film is warm persimmon daylight and a night vault, its hero a soft folded PAPER card with no hands rather than a faced fixture or a crowd, its signal colour a fiber cyan reserved for the traced mechanism, "
                            "and its spine an interior evidence board with real exteriors at the open and the close. Honest overlaps: 11-18 also had a line or string as a throughline, answered here by many strings on a board that go slack rather than one snapped line; "
                            "11-15 also staged an interior, answered by a lamp-lit office board and a vault rather than a doorway in rain; 11-12 also had a fat arrow, kept to one beat."),
        "treatment": {"title": "One Thousand Knocks", "summary": ad["treatment"],
                      "judge_reasoning": json.loads((OUT / "treatment.json").read_text())["reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "Overhead on the Ted Stevens Anchorage apron in low persimmon sun, the Chugach behind, a wide-eyed jet at a gate on the right and a Super Cub on the left, and at 0.3 s a boxed plate slams down in front of the jet's nose while a cone slides under its wheel",
                 "headline": "NATIONWIDE GROUND STOP", "motion_by_s": 0.3,
                 "loopback": "Frame 1 is the split apron with the jet grounded and the Cub flying; the last image pulls out of the office window onto the same split apron, the Cub banking and the jet by its cone, with Slip still pinned on the board in the window."},
        "open_loop": {"plant_t": b_at(6), "pay_t": b_at(33), "plant_glow_s": 0.4, "plant_sfx": "swish", "what": "Is it the AI? Planted when the spotlight lands on the left tarp under ONE OF THEM WAS AI, kept as Slip pinned to the board's center under red question strings through the denials, the magnifier and the fog, paid when the question strings sag slack but stay pinned and a pencilled WHY IT FAILED · NOT YET FINAL tag swings on the center pin, the trace pointing at the other tarp's router."},
        "open_loop_2": {"plant_t": b_at(18), "pay_t": b_at(38), "what": "Whose dark desk is that? Planted as a snapshot fluttering in the board's corner of a shadowed dispatch desk near Seattle with a hand hovering over a screen, paid when the desk lights up as Alaska Airlines' Flyways desk and the dispatcher's hand taps the second route, THE DISPATCHER DECIDES."},
        "throughline": {"object": "the cork evidence board and its strings", "lands_in_button": "the board seen small through the office window from the split apron, Slip still pinned under slack strings beside NOT YET FINAL",
                        "states": [
                            {"at_s": b_at(3), "state": "T1 an Alaska map pinned on, in-state strings pulsing, out-of-state strings frozen"},
                            {"at_s": b_at(12), "state": "T2 Slip pinned to the center under red question strings, denial plates beside it, no checks"},
                            {"at_s": b_at(21), "state": "T3 crowded with exhibits, fog across half, the copper CLAIM card set aside"},
                            {"at_s": b_at(26), "state": "T4 a taut cyan string from the center pin to the router photo"},
                            {"at_s": b_at(33), "state": "T5 question strings slack but pinned, NOT YET FINAL on the center pin"},
                            {"at_s": b_at(41), "state": "T6 small in the office window from the apron, Slip still pinned"}]},
        "reveals": [
            {"t": b_at(3), "type": "morph-to-chart", "what": "the board holds an Alaska map whose in-state strings pulse and border strings freeze", "hold_s": 0.8},
            {"t": b_at(8), "type": "scale-pullback", "what": "22 control center domes light across a US map", "hold_s": 0.8},
            {"t": b_at(10), "type": "build-on", "what": "a cutaway of Slip's folds soaking in the sky's data", "hold_s": 0.6},
            {"t": b_at(24), "type": "build-on", "what": "the second tarp is yanked off and the photo grows into a night cable vault", "hold_s": 0.8},
            {"t": b_at(29), "type": "build-on", "what": "a cross-section where a counter climbs to 1,000 over one 4.5 second sweep", "hold_s": 0.8},
            {"t": b_at(34), "type": "scale-pullback", "what": "one router becomes a field of 3,648 router outlines, nearly all dark", "hold_s": 0.8},
            {"t": b_at(40), "type": "scale-pullback", "what": "the camera pulls out of the office window onto the split apron", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.8}, {"line": 3, "offset": 0.0, "level": 1.2}, {"line": 7, "offset": 0.0, "level": 0.7},
            {"line": 12, "offset": 0.0, "level": 1.5}, {"line": 16, "offset": 0.0, "level": 0.6}, {"line": 18, "offset": 0.0, "level": 1.3},
            {"at_s": round(b_at(41) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(41) + 0.5, 3), "level": 1.4},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(41) - 0.5, 3), "riser_at": round(b_at(23), 3), "silence_at": round(b_at(41) - 0.5, 3),
            "payoff_at": b_at(41), "button_pattern": "callback", "interrupt_at": b_at(24), "extra_dips": []},
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
    book.raise_if_missing("board_1119 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1119Ids.ts").write_text(
        "// GENERATED by scripts/board_1119.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
