#!/usr/bin/env python3
"""2026-11-18 "Clear on Size": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1118.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1118.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
 (1, 0, 0.0, "snap", "Chalky, a dented vermilion chalk-line reel in an earflap hat", "thunks into the Tanana valley snow, hooks a black spruce and snaps a dashed ultramarine chalk line across the borough map, a chalk puff blooming", "proud", "A LINE ON SIZE", "the chalk puff blooms", ""),
 (2, 0, W("line"), "whoosh", "the far end of the chalk line", "runs off into a bank of ice fog where nobody can see it end, and Chalky squints after it", "uneasy", "WHERE DOES IT END?", "Chalky squints", ""),
 (3, 1, 0.0, "pencil", "a simple faceless parka figure tagged MAYOR GRIER HOPKINS", "drives a survey stake into the snow beside the line, its board pencilled PAUSE 12 MONTHS", "steady", "THE MAYOR ASKED FOR 12 MONTHS", "the stake wobbles in", ""),
 (4, 2, 0.0, "scratch", "a row of faceless figures tagged PLANNING COMMISSION", "pull the stake up, rub out the 12 and drive it back down reading 18 inside a dashed RECOMMENDED border", "steady", "COMMISSION RECOMMENDS 18 MONTHS", "the card flips to 18", ""),
 (5, 2, W("eighteen"), "tap", "a wooden clothes peg", "snaps a small source slip onto the stake", "plain", "UNANIMOUS · PER THE NEWS-MINER", "the tag clips on", ""),
 (6, 3, 0.0, "pop", "Chalky up close", "taps a boxed card that pops out of the snow with his crank, the chalk on his hook puffing", "earnest", "NOT A VOTE ON AI", "the card pops up", ""),
 (7, 3, W("size"), "bloop", "Chalky's crank", "spins and a puff of chalk bursts into the outline of a big block with a power plug", "earnest", "SIZE AND POWER", "the puff bursts", ""),
 (8, 4, 0.0, "clank", "Chalky's case", "swings open into a cutaway showing three brass trip pins inside the spool, labelled", "proud", "ANY ONE TRIPS IT · PER THE NEWS-MINER", "the case swings open", "rehook: the reel's case swings open into its own machinery"),

 (9, 4, W("five"), "click", "a block silhouette rolling past", "nudges just the first pin and the reel clicks and the line snaps taut", "startled", "AT LEAST 5 MW OF POWER", "the first pin trips", ""),
 (10, 5, 0.0, "click", "a wider flat block silhouette", "brushes only the second pin and the line snaps again", "startled", "OR 40,000 SQ FT", "the second pin trips", "rehook: a second block trips a second pin and the line snaps again"),

 (11, 6, 0.0, "click", "a block with a little smokestack", "touches only the third pin and the line snaps a third time", "startled", "OR 5 MW MADE ON SITE", "the third pin trips", ""),
 (12, 7, 0.0, "hum", "one GVEA power line on H-frame poles", "carries an amber pulse into a dashed 5 MW block outline on the snow", "focused", "5 MW · PER THE PLANNING DIRECTOR", "the pulse travels", ""),
 (13, 7, W("three"), "chime", "a valley of house windows along the Chena", "light up row by row as the camera pulls back, while Earl the plugged-in pickup shivers and his cord sags", "awed", "5 MW · AT LEAST 3,000 HOMES", "the windows light", ""),
 (14, 8, 0.0, "roll", "the borough map", "floods with one flat general-use colour across 97 of 100 grid squares, the line now a thin stroke across it", "plain", "GENERAL USE ZONE · 97% OF THE BOROUGH · PER THE NEWS-MINER", "the flood spreads", "rehook: the whole map floods one colour and the line suddenly looks tiny"),
 (15, 9, 0.0, "boots", "a moose", "ambles across the flooded map past a hot dog cart and an outhouse without a glance", "calm", "\"ANYTHING GOES IN GENERAL USE\"", "the moose ambles", ""),
 (16, 9, W("general"), "footstep", "a faceless parka builder", "walks up to the chalk line, reads the numbers off it and nods, and a bubble swells over the builder holding a chalk stick and a paint can", "curious", "CHALK OR PAINT?", "the builder nods", ""),
 (17, 10, 0.0, "swish", "Chalky", "walks along his own line under the GVEA wire, boots crunching past the black spruce", "determined", "CLEAR ON SIZE", "Chalky sets off", ""),
 (18, 10, W("reaches"), "whoosh", "the ice fog ahead", "rolls across the line and swallows its far end", "uneasy", "WHERE IT REACHES?", "the fog rolls in", ""),
 (19, 11, 0.0, "clink", "the Eielson Air Force Base chain-link fence", "rises out of the fog with nothing but snow and spruce behind it, and Chalky's hook strikes the wire", "wary", "EIELSON AIR FORCE BASE", "the hook taps the wire", "rehook: the chain-link rises out of the fog across the frame"),

 (20, 11, W("zone"), "hiss", "the chalk line at the fence", "fades from ultramarine to a soft gray cloud as it passes the wire", "uneasy", "INSIDE THE FENCE · LIKELY NOT BOROUGH ZONING", "the chalk goes gray", "rehook: the chalk turns gray at the wire"),

 (21, 12, 0.0, "flap", "a card hung on the fence wire", "swings in on a string beside the gray chalk, written in pencil", "plain", "PURELY GOVERNMENT PURPOSE · \"NOT SUBJECT,\" HOPKINS BELIEVES", "the card swings in", ""),
 (22, 13, 0.0, "flutter", "a second dotted board", "swings onto the wire below the first with a pencil question mark", "plain", "PRIVATE USE · \"MIGHT BE DIFFERENT\"", "the dotted card flutters", ""),
 (23, 14, 0.0, "pin", "a gray paint swatch", "pins to the fence and two sealed paint cans, black and white, thunk down in the snow at its foot", "curious", "\"TURN THAT GRAY AREA BLACK AND WHITE\"", "the cans land", "rehook: two sealed cans, black and white, land beside the gray and nobody opens them"),
 (24, 14, W("black"), "swoosh", "Chalky", "sneezes and a little puff of gray chalk bursts at the swatch", "sheepish", "RESEARCH UNDER WAY · NO ANSWER YET", "Chalky sneezes", ""),
 (25, 15, 0.0, "thump", "Chalky, back on the open snow with his line taut", "plants his boots as the first rope is tossed over the line", "braced", "THE FAIR TEST", "the rope lands", ""),
 (26, 16, 0.0, "rumble", "a soot-cheeked diesel genset", "rolls up puffing and ties its rope to the line, pulling it straighter while Chalky's boots skid", "worried", "DIESEL GENERATORS · A COMMISSIONER'S WORRY", "Chalky's boots skid", "rehook: a diesel genset rolls in and its rope pulls the line"),

 (27, 17, 0.0, "rustle", "a cluster of faceless figures", "pull a second rope tight beside a newspaper sheet", "anxious", "AI DATA CENTERS NATIONWIDE · PER THE NEWS-MINER", "the rope tightens", ""),
 (28, 17, W("anxiety"), "swell", "the cluster's speech balloon", "inflates over them", "anxious", "\"ANXIETY ... OVER AI IN GENERAL\"", "the balloon swells", "rehook: the anxiety balloon swells over the crowd"),

 (29, 18, 0.0, "creak", "a faceless resident in a parka", "ties a third rope and holds it steady, and the line straightens further", "calm", "\"IT'S SMART TO TAKE THE TIME\"", "the line straightens", ""),
 (30, 19, 0.0, "slide", "a long strip of months", "slides out on the snow under the line, a marker at month 10 and another at month 18", "even", "RESEARCH DUE MONTH 10 · PAUSE ENDS MONTH 18", "the strip slides out", "rehook: the strip slides out and the 8 months between the markers stay empty"),
 (31, 19, W("eighteen"), "tick", "the empty stretch between the markers", "stays blank under a small honest tag", "even", "WHY THE EXTRA 8? NEITHER OUTLET SAYS", "the tag swings", ""),
 (32, 20, 0.0, "tock", "a frosted stopwatch on a spruce nail outside the borough building", "hangs with its hand at zero beside a sign", "plain", "NOT LAW YET · ASSEMBLY VOTE LIKELY JAN 14TH", "the hand stays at zero", "rehook: the stopwatch hangs frozen at zero"),

 (33, 20, W("clock"), "ding", "the GVEA power pole beside it", "tilts toward the stopwatch as its wire pulses, holding up a blank board", "curious", "NEXT QUESTION · THE GRID · GOLDEN VALLEY ELECTRIC", "the wire hums", "rehook: the power pole tilts in with a blank question"),

 (34, 21, 0.0, "ratchet", "Chalky", "nods at the ropes, plants his feet and starts reeling the line IN through the fog, crank over crank", "determined", "READINESS, NOT REFUSAL, IF...", "the crank turns", ""),
 (35, 21, W("rules"), "flutter", "the far end of the line", "slides out of the fog dragging two parcel slips, both unticked with pencil question marks", "hopeful", "RULES A BUILDER CAN MEET", "the tags flutter out", ""),
 (36, 22, 0.0, "swing", "the second tag", "swings round to face us", "hopeful", "AN ANSWER AT THE FENCE", "the tag swings round", ""),
 (37, 23, 0.0, "footstep", "Chalky", "walks back past the fence where the gray swatch hangs and both cans stay sealed, and Earl the pickup stops shivering", "calm", "STILL CHALK · NOT LAW YET", "Earl stops shivering", ""),
 (38, 23, W("find"), "snap", "Chalky on the open snowfield", "re-hooks the same spruce and snaps the dashed line across the snow again, the far end running into the fog", "proud", "CLEAR ON SIZE · NOT YET ON REACH", "the chalk puff blooms", ""),
 (39, 8, W("borough"), "crunch", "the general-use flood", "laps up against Chalky's boots and he hops up onto his own taut line to stay dry", "startled", "AND THE LINE?", "Chalky hops", ""),
 (40, 12, W("built"), "rattle", "the fence wire", "shakes as the gray chalk cloud drifts through the chain-link diamonds like breath", "uneasy", "HOPKINS BELIEVES · NOT A RULING", "the wire twangs", ""),
 (41, 15, W("asking"), "thud", "a coil of rope", "sails in from off frame, drops over the line and lands with a thump beside Chalky's boots", "braced", "REASONS FOR TIME", "the coil lands", ""),
 (42, 19, W("ten"), "pop", "a marker flag", "snaps up out of the strip at month 10", "even", "RESEARCH · 10 MONTHS", "the flag snaps up", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 43)}
PLATE_AT.update({1: "lower-third", 14: "lower-third", 25: "lower-third", 38: "lower-third"})
CLAIM_MAP = {1: ["c1"], 2: ["narration"], 3: ["c1", "c2"], 4: ["c3"], 5: ["c4"], 6: ["c21"], 7: ["c28"], 8: ["c6"], 9: ["c6"], 10: ["c7"],
             11: ["c8"], 12: ["c9"], 13: ["c9"], 14: ["c11"], 15: ["c12"], 16: ["c11", "c12"], 17: ["narration"], 18: ["narration"], 19: ["c15"], 20: ["c15"],
             21: ["c16"], 22: ["c17"], 23: ["c18"], 24: ["c18"], 25: ["narration"], 26: ["c19"], 27: ["c21"], 28: ["c20"], 29: ["c23"], 30: ["c5", "c3"],
             31: ["c5"], 32: ["c28", "c13"], 33: ["c25"], 34: ["narration"], 35: ["narration"], 36: ["c18"], 37: ["c28"], 38: ["narration"], 39: ["narration"], 40: ["c16"], 41: ["narration"], 42: ["c5"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "extreme-wide", "high", "tanana-snowfield", "orbital-aerial", "map-territory", "horizontal-traverse", "instrument-as-subject", "", "", "The snap", "Over the Tanana valley at a rose-gold noon, a vermilion chalk-line reel hooks a spruce and snaps a dashed line across the borough map, its far end vanishing into ice fog"),
 (2, 1, "map-territory", "wide", "overhead", "borough-map", "top-down-map", "grid-modular", "assemble-build", "data-as-subject", "graphic-match", "match", "Twelve, then eighteen", "From overhead, the mayor's figure drives a stake pencilled 12 MONTHS by the line and the commission row redrives it at 18 inside a dashed RECOMMENDED border"),
 (3, 3, "subject-portrait", "close", "eye", "snowfield-close", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "match-cut", "match", "Not a vote on AI", "Chalky up close taps a NOT A VOTE ON AI card and spins his crank so a chalk puff bursts into a block with a power plug, SIZE AND POWER"),
 (4, 4, "macro-closeup", "insert", "eye", "reel-interior", "cross-section-cutaway", "stacked-layers", "assemble-build", "instrument-as-subject", "push-in", "build", "Any one trips it", "Chalky's case opens into a cutaway of three trip pins and a block silhouette trips each pin alone, the line snapping each time"),
 (5, 7, "wide-establish", "wide", "high", "valley-windows", "orbital-aerial", "map-territory", "radial-emanate", "landscape-as-subject", "carried-element", "carry", "At least 3,000 homes", "One GVEA power line carries a pulse into a dashed 5 MW block outline and the valley's house windows light row by row as Earl the pickup shivers in the lot"),
 (6, 8, "map-territory", "wide", "overhead", "borough-map", "top-down-map", "map-territory", "horizontal-traverse", "data-as-subject", "map-travel", "travel", "Anything goes", "The map floods one colour across 97 of 100 squares, a moose ambles past an outhouse and a parka builder reads the line and nods"),
 (7, 10, "alt-vantage", "medium", "low", "spruce-wire-trail", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "single-organic-hero", "carried-element", "carry", "Follow the line", "From a low angle Chalky follows his line under the GVEA wire through black spruce as ice fog swallows its far end and the Eielson fence looms"),
 (8, 12, "push-detail", "close", "eye", "eielson-fence", "macro-closeup", "fullbleed-split", "push-in-only", "structure-as-subject", "match-action", "match", "The gray at the fence", "At the chain-link the chalk turns gray, two hedged cards hang on the wire and a gray swatch gets two sealed cans, black and white"),
 (9, 15, "wide-establish", "wide", "low", "rope-field", "eye-level-immersive", "stacked-layers", "radial-emanate", "single-organic-hero", "hard-cut", "build", "The ropes", "On open snow Chalky braces as a sooty diesel genset ties a rope to the line and pulls it straighter, his boots skidding"),
 (10, 17, "alt-vantage", "extreme-wide", "overhead", "rope-field", "top-down-map", "map-territory", "radial-emanate", "multiplicity-swarm", "pull-out", "carry", "More ropes", "From overhead a cluster of faceless figures pull a second rope tight beside a newspaper sheet, their anxiety balloon swells, and a resident ties a third rope that straightens the line"),
 (11, 19, "data-panel", "medium", "eye", "timeline-strip", "exploded-diagram", "grid-modular", "scroll-data", "data-as-subject", "carried-element", "carry", "The extra eight", "A strip of months slides out under the line, markers at month 10 and month 18 and an honest blank between them"),
 (12, 20, "two-up", "medium", "eye", "borough-building-steps", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "mask-wipe", "build", "Not law yet", "A frosted stopwatch at zero hangs by NOT LAW YET while the GVEA pole beside it holds up a blank grid question card"),
 (13, 21, "push-detail", "close", "ground", "fog-line-end", "eye-level-immersive", "single-object-void", "horizontal-traverse", "single-organic-hero", "match-action", "match", "Reel it in", "From the ground Chalky reels the line in through the fog until two unticked shipping tags come out of it"),
 (14, 23, "wide-establish", "extreme-wide", "high", "tanana-snowfield", "orbital-aerial", "map-territory", "horizontal-traverse", "instrument-as-subject", "match-cut", "match", "Clear on size", "Chalky walks back past the fence and the sealed cans, Earl stops shivering, and the reel re-snaps the dashed line into the fog"),
]

AMBIENT = {1: "wind over snow, a far raven", 2: "paper map rustle, wind", 3: "a close cold breeze", 4: "a ticking spool, a hum",
           5: "a power line hum, a far car", 6: "map rustle, a moose's crunch", 7: "wind in spruce, a wire hum", 8: "wind through chain-link",
           9: "wind over open snow, a far engine", 10: "wind, rope creak", 11: "a hush, wind", 12: "a power line hum, wind",
           13: "fog hush, a ratchet", 14: "wind over snow, a far raven"}
CENTER = {1: "the line at x540 y1100", 2: "the stake card at x540 y980", 3: "Chalky at x540 y1060", 4: "the pins at x540 y960", 5: "the windows at x540 y1000",
          6: "the map at x540 y980", 7: "Chalky at x480 y1120", 8: "the fence at x540 y1000", 9: "Chalky at x430 y1120", 10: "the line at x540 y980",
          11: "the strip at x540 y1020", 12: "the stopwatch at x380 y980", 13: "the tags at x600 y1040", 14: "the line at x540 y1100"}
HERO = {
 1: ("chalk-line reel + dashed line + Tanana valley + ice fog + spruce", "40% line and reel, 35% valley, 25% fog and sky"),
 2: ("borough map + stake card + mayor figure + commission row + line", "40% map, 35% card and figures, 25% line"),
 3: ("Chalky close + NOT A VOTE ON AI card + chalk puff block", "55% Chalky, 25% card, 20% puff"),
 4: ("reel cutaway + three trip pins + block silhouettes + snapping line", "45% pins and spool, 30% blocks, 25% line"),
 5: ("GVEA line + 5 MW outline + valley windows + Earl in the lot", "40% windows, 30% line and outline, 30% lot"),
 6: ("flooded map + moose + outhouse and cart + builder + line", "45% map, 30% moose and props, 25% builder"),
 7: ("Chalky walking + line + GVEA wire + spruce + fog + fence", "40% Chalky and line, 35% trail, 25% fog and fence"),
 8: ("chain-link fence + gray chalk + two cards + swatch + two cans", "40% fence, 30% cards, 30% swatch and cans"),
 9: ("Chalky braced + taut line + diesel genset + rope", "40% Chalky, 35% genset, 25% line"),
 10: ("taut line + cluster + resident + speech balloon", "40% line and ropes, 35% figures, 25% snow"),
 11: ("month strip + two markers + blank stretch + line above", "50% strip, 30% markers, 20% line"),
 12: ("frosted stopwatch + sign + GVEA pole + blank card + building", "40% stopwatch, 35% pole and card, 25% building"),
 13: ("Chalky reeling + line + fog + two tags", "45% Chalky, 30% tags, 25% fog"),
 14: ("Chalky + dashed line + fence and cans + Earl", "40% line and reel, 35% valley, 25% fence, cans and lot"),
}
PARTS = {1: 52, 2: 46, 3: 56, 4: 50, 5: 54, 6: 48, 7: 50, 8: 46, 9: 52, 10: 44, 11: 40, 12: 46, 13: 48, 14: 54}
KICKS = (1, 23, 34)
CAMERA = {1: "craneDown", 2: "static:a locked overhead of the map while the stake card is written", 3: "dollyThrough", 4: "dollyThrough", 5: "craneDown",
          6: "static:a locked overhead of the map while it floods", 7: "truckAcross", 8: "dollyThrough", 9: "truckAcross",
          10: "craneDown", 11: "truckAcross", 12: "dollyThrough", 13: "truckAcross+riseWith", 14: "craneDown"}

PALETTE = ("rose-gold Fairbanks noon glow #F2A48C low on the southern horizon beneath periwinkle #B9C3E6 fading to lilac #6E7FB8 overhead, "
           "snowfield #E9EEF8 with blue-violet shadows #9DB0DA, pearl ice fog #DCDDE8, spruce green #1F3A33, "
           "a vermilion reel #D2452B with brass #C9A04A, surveyor's ultramarine chalk #2F5FD0 kept to the line, "
           "neutral pewter #8F9096 kept to the fence, marigold #F0B54A kept to the grid pulse, sealed charcoal and chalk-white cans")


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
        "run_date": "2026-11-18", "slug": "clear-on-size", "title": "Clear on Size",
        "concept": ("The Fairbanks North Star Borough Planning Commission recommended stretching Mayor Grier Hopkins' proposed 12-month pause on permits for large data centers to 18 months. "
                    "Per the News-Miner any one of three thresholds would trip it, at least 5 MW of power, 40,000 square feet or 5 MW made on site, and the planning director says 5 MW can power at least 3,000 homes, in a borough where the general use zone covers 97 percent of the land and anything goes. "
                    "The line is clear on size before anyone knows where it reaches: the borough likely can't zone inside the Eielson Air Force Base fence, Hopkins believes a purely government-purpose data center would not be subject to the pause, private use might be different, and the borough is researching how to turn that gray area black and white. "
                    "The fair test gives the reasons for time a full scene (diesel generators, anxiety over AI in general, a resident's call to take the time) and the opposite case too (research due at month 10, the pause running 18, neither outlet says why). Nothing is law yet; the Assembly vote is likely January 14th. "
                    "Drawn as Chalky, a faced vermilion chalk-line reel snapping a dashed ultramarine line across the Tanana valley at a rose-gold noon, a cutaway of three trip pins, a flooded map, the line going gray in the ice fog at the chain-link with two sealed paint cans, ropes that pull the line straighter, and a reel-in to two unticked tags."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "orbital-aerial", "motion_vector": "vertical-descent", "hero_treatment": "instrument-as-subject", "layout": "map-territory",
                        "register": "editorial-schematic", "palette": PALETTE, "camera_strategy": "aerial-descent",
                        "light_story": "a warm golden Fairbanks noon sun sitting low on the Alaska Range all film, bright rose light raking across the snow, softening into pearl ice fog at the Eielson fence and brightening again for the reel-in",
                        "metaphor": "a surveyor's chalk-line reel that snaps a clear line on size and has to reel it in through the fog to find where it reaches"}, "signature_shot": 14,
        "palette": PALETTE,
        "divergence_note": ("The last films were open North Slope tundra in polar night and midnight-sun honey with a crowd of faced decision trees and radar lime (11-16), and rain-black Juneau night at one door with a gunmetal letterbox under a sodium lamp and pencilled vellum (11-15). "
                            "This film is a single rose-gold Fairbanks noon over blue-violet snow and pearl ice fog in the Tanana valley, its hero is ONE small vermilion surveyor's tool that moves through the world drawing a line, its signal colour is ultramarine chalk, and its signature is an overhead of a line going gray at a chain-link fence. "
                            "Honest overlaps: 11-15 drew a proposed rule as dashed pencil, answered here by snapped chalk with powder puffs and string texture, never pencil on vellum, and no ink pen; 11-16 also had snow and a map tilt, answered by Interior valley, spruce and fog instead of tundra lakes, and a single traveling hero instead of a crowd. "
                            "Data center stories from 10-25 (Sitka, a faced sign against a ruler) and 11-07 (Petersburg, a glass reserve gauge) are answered by a tool that draws the line rather than a sign or gauge that is measured."),
        "treatment": {"title": "Clear on Size", "summary": ad["treatment"],
                      "judge_reasoning": json.loads((OUT / "treatment.json").read_text())["reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "anomaly-question", "frame1": "A rose-gold noon over the Tanana valley snow, ice fog in banks, and at 0.3 s a vermilion chalk-line reel thunks into the snow, hooks a spruce and snaps a dashed ultramarine line across the map with a chalk puff.",
                 "headline": "A LINE ON SIZE", "motion_by_s": 0.4,
                 "loopback": "Frame 1 is the reel snapping the line across the snow with its far end lost in fog; the last image is the same reel re-snapping the same line from the same spruce, the far end still running into the fog."},
        "open_loop": {"plant_t": b_at(2), "pay_t": b_at(35), "plant_glow_s": 0.4, "plant_sfx": "whoosh", "what": "Where does the line end? Planted when the snapped line's far end runs off into a bank of ice fog under WHERE DOES IT END?, kept as the fog swallowing the line on the walk to the fence, paid when Chalky reels the line in through the fog and its end comes out with two unticked shipping tags, RULES A BUILDER CAN MEET and AN ANSWER AT THE FENCE."},
        "open_loop_2": {"plant_t": b_at(16), "pay_t": b_at(32), "what": "Chalk or paint? Planted as a bubble over the parka builder holding a chalk stick and a paint can as the builder reads the line, kept as two sealed paint cans, black and white, landing beside the gray swatch at the fence, paid at the borough building when the stopwatch hangs at zero under NOT LAW YET, still chalk, and again on the walk back past the sealed cans."},
        "throughline": {"object": "Chalky's dashed ultramarine chalk line", "lands_in_button": "the same dashed line re-snapped across the snow from the same spruce, still chalk, its far end still in the fog",
                        "states": [
                            {"at_s": b_at(1), "state": "L1 snapped clean across the snow, its far end lost in fog"},
                            {"at_s": b_at(9), "state": "L2 tripped taut by one pin at a time in the reel's cutaway"},
                            {"at_s": b_at(14), "state": "L3 a thin stroke across a map flooded one colour"},
                            {"at_s": b_at(20), "state": "L4 gone gray in the fog at the Eielson chain-link"},
                            {"at_s": b_at(26), "state": "L5 pulled straighter by ropes while Chalky's boots skid"},
                            {"at_s": b_at(35), "state": "L6 reeled in to two unticked tags"},
                            {"at_s": b_at(38), "state": "L7 re-snapped as chalk, not paint, its end still in the fog"}]},
        "reveals": [
            {"t": b_at(8), "type": "build-on", "what": "the reel's case swings open into a cutaway of three trip pins", "hold_s": 0.8},
            {"t": b_at(13), "type": "scale-pullback", "what": "the camera pulls back as the valley's windows light row by row from one power line", "hold_s": 0.8},
            {"t": b_at(14), "type": "morph-to-chart", "what": "the borough map floods one colour across 97 of 100 squares", "hold_s": 0.8},
            {"t": b_at(19), "type": "scale-pullback", "what": "the camera pulls back as the Eielson chain-link looms out of the fog across the whole frame", "hold_s": 0.8},
            {"t": b_at(23), "type": "build-on", "what": "a gray swatch pins to the fence and two sealed cans land at its foot", "hold_s": 0.8},
            {"t": b_at(27), "type": "scale-pullback", "what": "the camera cranes up to show every rope running to the taut line", "hold_s": 0.8},
            {"t": b_at(30), "type": "build-on", "what": "a strip of months slides out with markers at month 10 and month 18", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.7}, {"line": 4, "offset": 0.0, "level": 1.2}, {"line": 8, "offset": 0.0, "level": 0.8},
            {"line": 10, "offset": 0.0, "level": 1.5}, {"line": 15, "offset": 0.0, "level": 0.6}, {"line": 19, "offset": 0.0, "level": 1.6},
            {"at_s": round(b_at(38) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(38) + 0.5, 3), "level": 1.4},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(38) - 0.5, 3), "riser_at": round(b_at(34), 3), "silence_at": round(b_at(38) - 0.5, 3),
            "payoff_at": b_at(38), "button_pattern": "callback", "interrupt_at": b_at(25), "extra_dips": []},
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
    book.raise_if_missing("board_1118 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1118Ids.ts").write_text(
        "// GENERATED by scripts/board_1118.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
