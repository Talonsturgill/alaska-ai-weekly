#!/usr/bin/env python3
"""2026-11-12 "Fifty Years, One Word Short": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1112.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1112.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
 (1, 0, 0.0, "whoosh", "a raven", "drops onto the snow at the foot of a survey stake and pecks the blank orange tag, which spins on its cord", "watchful", "ONE WORD NOT IN THE NOTICE", "the tag spins", ""),
 (2, 0, W("fifty"), "stamp", "a rubber stamp", "slams onto the tag and the cord pulls taut toward the left edge", "firm", "50-YEAR LEASE", "the cord hums", ""),
 (3, 0, W("Deadhorse"), "tick", "a hollow card", "clips onto the cord with a word-shaped hole cut through it and its edge glows once", "curious", "NEAR DEADHORSE", "the card glows", "plant: the missing word"),
 (4, 1, 0.0, "page", "a state notice card", "slides along the cord and clips beside the hollow card with its date tab", "formal", "APPROVED NOV 10", "the card settles", ""),
 (5, 1, W("STAK"), "thud", "a plain company sign", "knocks into the snow beside the stake and rocks once", "plain", "STAK ENERGY", "the sign rocks", ""),
 (6, 1, W("case"), "thud", "a case-number ticker on the notice", "rolls its digits and locks on the number", "precise", "ADL 422741", "the digits lock", ""),
 (7, 2, 0.0, "pop", "survey flags", "drop one by one around the stake and a dotted square closes between them across the snow", "careful", "ABOUT 715 ACRES", "the square closes", ""),
 (8, 2, W("twenty"), "slide", "a map tab", "slides along the cord and drops a Deadhorse dot and an offset line running south across a small Alaska outline", "careful", "26 MILES SOUTH OF DEADHORSE", "the line extends", ""),
 (9, 3, 0.16, "page", "the notice card", "types its first line while the raven drags a highlighter bar across it", "flat", "GAS-POWERED DATA CENTER · STATE NOTICE", "the bar sweeps", ""),
 (10, 3, W("high"), "creak", "the raven", "slides the highlighter bar down to a second line", "focused", "HIGH-PERFORMANCE COMPUTING · STATE NOTICE", "the bar jumps", ""),
 (11, 3, W("units"), "blip", "the hollow card", "swings once on its clip and the raven turns to it", "curious", "STILL NO SUCH WORD", "the card swings", "plant: the missing word again"),
 (12, 4, 0.0, "whoosh", "a gas cutaway card", "swings in on the cord with a pipe feeding a squat generator hall", "steady", "NORTH SLOPE GAS · ADN", "the card swings", ""),
 (13, 4, W("one"), "hum", "a gauge needle", "swings across the hall's dial under a newsprint badge", "steady", "1 TO 3 GW · ADN", "the needle settles", ""),
 (14, 4, W("tied"), "snap", "a dashed cable", "swings toward a utility-pole socket in the card's corner and snaps back a hand-width short", "stubborn", "OFF-GRID · ADN", "the cable stops", "rehook: the dashed cable lunges at the Railbelt socket and stops a hand-width short"),
 (15, 5, 0.0, "pop", "a speech tab", "drops onto the cutaway card and swings with the company's words", "assured", "STAK SAYS NO IMPACT · PUBLIC GRID", "the tab wobbles", ""),
 (16, 5, W("company"), "snap", "a CLAIM tab", "snaps on beneath the speech tab and the tab tips under it", "wry", "A COMPANY CLAIM", "the tab tilts", ""),
 (17, 6, 0.0, "page", "a newsprint clipping", "slides in on the cord with a masthead and a date tab", "reading", "WORLD OIL · REPORTED NOV 5", "the clipping swings", ""),
 (18, 6, W("fifteen"), "snap", "a short second cord", "snaps onto the tag and its far end swings down into a coil", "tense", "15-YR GAS SALE AGREEMENT · REPORTED", "the coil sways", ""),
 (19, 6, W("second"), "riser", "a clock face", "opens at the cord's coiled end and its hand starts to tick", "uneasy", "HOW LONG?", "the hand ticks", "plant: the second clock"),
 (20, 7, 0.0, "thud", "paper slips", "fall out of the dusk like snow and pile onto the clothesline and the snow around the stake", "overwhelmed", "THE PUBLIC COMMENTED", "the slips settle", ""),
 (21, 7, W("one"), "cascade", "a tally counter", "rolls its drums as slips pile around the raven's feet", "overwhelmed", "1,205 COMMENTS · ENV. CENTER COUNT", "the drums settle", ""),
 (22, 7, W("Daily"), "pop", "a newspaper masthead", "drops onto the side of a crate beside the mailbox", "plain", "ANCHORAGE DAILY NEWS", "the masthead rocks", ""),
 (23, 7, W("opposed"), "clank", "red tabs", "snap onto the slips one by one and the crate overflows with red-tabbed slips", "firm", "MOSTLY OPPOSED · ADN", "the crate overflows", "rehook: red tabs snap onto the slips and the crate overflows"),
 (24, 8, 0.0, "slide", "a plain card on its own small post", "slides in beside the stake and drops onto its post, apart from the tag", "careful", "GOV-ELECT WOULD SUPPORT DATA CENTER MORATORIUM · ADN", "the card rocks", ""),
 (25, 8, W("construction"), "creak", "the card's post", "creaks and tips a degree under the card", "careful", "DATA CENTER CONSTRUCTION", "the string stretches", ""),
 (26, 8, W("action"), "pop", "a small tab", "snaps onto the card's lower edge", "careful", "STATEMENT OF SUPPORT · NOT AN ACTION", "the tab snaps on", ""),
 (27, 8, W("report"), "hush", "the card", "swings on its post with no line to the tag", "plain", "NO LINK TO THIS LEASE IN ADN REPORT", "the card sways", ""),
 (28, 9, 0.0, "creak", "the stake", "leans as slips snag on its strings and the orange tag bends", "strained", "THE REAL TENSION", "the stake leans", ""),
 (29, 9, W("power"), "page", "the raven", "pulls one slip from the heap and drops it onto the lease cord", "watchful", "IF IT POWERS ITSELF · OFF-GRID PER ADN", "the slip swings", ""),
 (31, 9, W("fifty"), "creak", "the lease cord", "runs left past a row of small seasonal markers with the slips snagged only at its near end", "grave", "50 YEARS · ABOUT 715 ACRES", "the markers rattle", ""),
 (32, 10, 0.0, "whoosh", "the raven", "drags a search reticle across the notice card", "hunting", "THE MISSING WORD", "the reticle drifts", ""),
 (44, 10, W("Northern"), "click", "a name tab", "drops onto the reticle stick naming the group", "plain", "NORTHERN ALASKA ENV. CENTER", "the tab clips", ""),
 (33, 10, W("lists"), "pop", "an advocacy chip", "drops into the reticle's empty circle", "plain", "ADVOCACY GROUP LISTS \"ARTIFICIAL INTELLIGENCE COMPUTING\"", "the chip settles", ""),
 (34, 10, W("never"), "blip", "the reticle", "closes and locks on empty paper", "flat", "NOTICE TEXT · NO \"AI\"", "the ring locks", ""),
 (35, 11, 0.0, "whoosh", "a ruler", "unrolls along the snow under the cords as the camera trucks along it", "grave", "LAND · GAS · HALF A CENTURY", "the ruler unrolls", "rehook: a ruler unrolls under the cords and the camera trucks along it"),
 (36, 11, W("century"), "thud", "the lease cord", "lays itself along all fifty ticks of the ruler", "grave", "HALF A CENTURY", "the cord settles", ""),
 (37, 11, W("fifteen"), "slide", "the gas cord", "lays along its fifteen ticks and runs on as a faint dashed line", "tense", "15-YR GAS SALE AGREEMENT · REPORTED", "the dashes sway", ""),
 (38, 11, W("fifty"), "riser", "the stake", "leans toward the long cord as the raven tilts its head", "grave", "50-YEAR LEASE", "the stake leans", ""),
 (39, 12, 0.0, "clank", "a calendar tab", "clips onto the cord and a lamp-white ring draws around the 30th", "urgent", "RECONSIDERATION DUE NOV 30", "the ring closes", ""),
 (40, 13, W("what"), "hush", "the tag", "turns toward the camera showing a new ruled line", "open", "WHAT SHOULD ALASKA ASK?", "the tag swings", ""),
 (42, 13, W("return"), "thud", "the raven", "taps the empty line with its beak and turns its head to look into the lens", "direct", "IN RETURN", "the beak taps", ""),
 (45, 13, 0.0, "hum", "the raven", "hops a step along the snow toward the tag and lifts its head", "direct", "ONE QUESTION", "the head lifts", ""),
 (43, 13, W("fifty"), "thud", "the cords", "sway as the stake leans a degree further and the frame cuts hard to black", "grave", "50 YEARS OF STATE LAND", "the cords sway", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 46)}
PLATE_AT.update({44: "side-plate-right", 1: "lower-third", 8: "side-plate-right", 12: "side-plate-left", 20: "lower-third", 24: "side-plate-left", 28: "lower-third", 35: "lower-third", 40: "lower-third", 43: "lower-third", 33: "side-plate-left"})
CLAIM_MAP = {45: ["narration"], 44: ["c31"], 1: ["c32"], 2: ["c4"], 3: ["c7"], 4: ["c1"], 5: ["c3"], 6: ["c2"], 7: ["c5"], 8: ["c7"], 9: ["c9"], 10: ["c10"], 11: ["c32"],
             12: ["c15"], 13: ["c11"], 14: ["c13"], 15: ["c20"], 16: ["c20"], 17: ["c16"], 18: ["c16"], 19: ["narration"], 20: ["narration"],
             21: ["c21"], 22: ["c22"], 23: ["c22"], 24: ["c27"], 25: ["c27"], 26: ["c27"], 27: ["c27"], 28: ["narration"], 29: ["narration"],
             30: ["c32"], 31: ["c4", "c5"], 32: ["narration"], 33: ["c31"], 34: ["c32"], 35: ["narration"], 36: ["c4"], 37: ["c16"], 38: ["c4"],
             39: ["c23"], 40: ["narration"], 41: ["narration"], 42: ["narration"], 43: ["c4"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
STG = "stake-world-dusk"
POV = "ground-level-side"
LAY = "clothesline-layers"
S = [
 (1, 0, "wide-establish", "wide", "ground", "stake-world-dusk", "ground-level-side", "clothesline-layers", "assemble-build", "structure-as-subject", "", "", "The stake", "A raven pecks the blank orange tag, a stamp slams onto it and a hollow card clips onto the cord"),
 (2, 1, "push-detail", "medium", "ground", "stake-world-dusk", "ground-level-side", "clothesline-layers", "scroll-data", "instrument-as-subject", "carried-element", "carry", "The notice", "A state notice card slides along the cord, a company sign knocks into the snow and the case number locks"),
 (3, 2, "map-territory", "medium", "ground", "stake-world-dusk", "ground-level-side", "clothesline-layers", "radial-emanate", "data-as-subject", "carried-element", "carry", "The site", "Survey flags plant themselves and a dotted square draws on the snow, then a map tab clips on with its offset line"),
 (4, 3, "push-detail", "insert", "eye", "notice-macro", "macro-closeup", "fullbleed-split", "scroll-data", "instrument-as-subject", "carried-element", "carry", "What it says", "The raven drags a highlighter across two lines of the notice and the hollow card glows"),
 (5, 4, "subject-portrait", "close", "eye", "gas-cutaway-macro", "cross-section-cutaway", "stacked-layers", "vertical-descent", "structure-as-subject", "carried-element", "travel", "Its own power", "A gas cutaway card swings in, a gauge reads, the dashed cable lunges and stops short and a company tab clips on"),
 (6, 6, "push-detail", "close", "ground", "stake-world-dusk", "ground-level-side", "clothesline-layers", "horizontal-traverse", "data-as-subject", "carried-element", "build", "The second clock", "A newsprint clipping slides in, a short second cord clips onto the tag with its end coiled and a clock opens"),
 (7, 7, "wide-establish", "wide", "low", "paper-fall-snowfield", "eye-level-immersive", "clothesline-layers", "vertical-descent", "structure-as-subject", "carried-element", "travel", "The public", "A mailbox stands up beside the stake and spills slips, the tally rolls and red-tabbed slips fill a crate"),
 (8, 8, "subject-portrait", "medium", "ground", "stake-world-dusk", "ground-level-side", "clothesline-layers", "horizontal-traverse", "instrument-as-subject", "carried-element", "carry", "A statement, not an action", "A plain card on a string swings toward the tag and hangs short of it with a tab clipped on"),
 (9, 9, "alt-vantage", "wide", "ground", "stake-world-dusk", "ground-level-side", "clothesline-layers", "vertical-descent", "structure-as-subject", "match-cut", "match", "The real tension", "The stake leans as slips snag, the raven drops a slip on the cord and the lease cord runs left past seasonal markers"),
 (10, 10, "push-detail", "close", "eye", "notice-macro", "instrument-screen", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "mask-wipe", "build", "The missing word", "The raven drags a search reticle across the notice, an advocacy chip clips into its circle and it locks on empty paper"),
 (11, 11, "wide-establish", "wide", "low", "ruler-on-snow", "eye-level-immersive", "grid-modular", "horizontal-traverse", "data-as-subject", "graphic-match", "match", "One ruler", "A ruler unrolls on the snow in front of the stake and both cords lay along it, fifteen ticks against fifty, while the camera trucks along"),
 (12, 12, "subject-portrait", "medium", "ground", "stake-world-dusk", "ground-level-side", "clothesline-layers", "assemble-build", "structure-as-subject", "match-cut", "match", "The question", "A calendar tab rings November 30th, the tag turns to an empty IN RETURN line and the raven taps it and looks into the lens before a hard cut to black"),
]

AMBIENT = {1: "wind over snow, the tag creaks, the cord hums", 2: "paper settles on the cord, the digits tick", 3: "snow crunches, flags flutter, a pen scratches",
           4: "the highlighter squeaks, wind at the page edge", 5: "the generator hums, the cable creaks, a socket hangs", 6: "the cords creak, a clock ticks",
           7: "wind, slips slide and thump, the tally clicks", 8: "the string creaks, wind in the card", 9: "the stake creaks, slips rustle, the cord groans",
           10: "the reticle whirs, paper rustles", 11: "wind, the ruler unrolls, a cord settles", 12: "the cord creaks, a beak taps, silence"}
CENTER = {i: "the stake and tag at x700 y1000" for i in range(1, 13)}
CENTER.update({2: "the notice card at x440 y900", 4: "the notice card at x440 y900", 5: "the cutaway card at x440 y920", 6: "the cords at x560 y980", 7: "the mailbox at x340 y1040 and the stake at x700 y1000",
               10: "the reticle at x440 y900", 11: "the ruler at x540 y1100"})
HERO = {
 1: ("the raven + rubber stamp + stake tag + hollow card", "50% stake tag and stamp, 25% raven, 25% hollow card"),
 2: ("state notice card + company sign + case ticker", "55% notice card, 25% sign, 20% case ticker"),
 3: ("survey flags + dotted square + map tab", "45% square and flags, 30% map tab, 25% snow"),
 4: ("the raven + highlighter + notice card + hollow card", "55% card, 25% raven and bar, 20% hollow card"),
 5: ("gas cutaway card + gauge needle + dashed cable + speech tab + claim tab", "55% cutaway card, 25% cable and socket, 20% tabs"),
 6: ("newsprint clipping + short second cord + clock face", "45% cords, 30% clipping, 25% clock"),
 7: ("mailbox + tally counter + newspaper masthead + red tabs + falling slips", "50% mailbox and slips, 25% crate, 25% tally"),
 8: ("plain card on a string + card string + small tab", "50% card and string, 30% tag, 20% raven"),
 9: ("the stake + the raven + lease cord + seasonal markers", "50% stake and slips, 30% cord and markers, 20% raven"),
 10: ("the raven + search reticle + name tab + advocacy chip", "55% card and reticle, 25% chip, 20% raven"),
 11: ("a ruler + lease cord + gas cord + the stake", "50% cords and ruler, 30% stake and tag, 20% snow"),
 12: ("calendar tab + the tag + the raven + the cords", "50% tag, 30% raven, 20% calendar tab"),
}
PARTS = {1: 44, 2: 46, 3: 44, 4: 40, 5: 56, 6: 46, 7: 56, 8: 42, 9: 48, 10: 42, 11: 44, 12: 42}
KICKS = (2, 21, 38)
CAMERA = {1: "craneDown", 2: "dollyThrough", 3: "static:the flags and the dotted square are the move", 4: "dollyThrough", 5: "dollyThrough",
          6: "truckAcross", 7: "static:locked so the slips do the moving", 8: "static:the card on its string is the move",
          9: "static:the lean of the stake is the move", 10: "dollyThrough", 11: "truckAcross", 12: "static:the beak and the hard cut are the move"}

TAG_STATES = {
 1: {"name": "blank, spinning", "cords": 0},
 2: {"name": "stamped 50-YEAR LEASE, one taut cord", "cords": 1},
 3: {"name": "second cord clipped on, 15-YR REPORTED, end coiled", "cords": 2},
 4: {"name": "slips snagged on its strings, stake leaning", "cords": 2},
 5: {"name": "leaning, with an empty IN RETURN line", "cords": 2},
}

PALETTE = ("lifted dusk dome #1B3A55 under a pale rose horizon line, trampled glacier snow, raven black, parchment #D6C9A8 with charcoal text #1B2230, fluorescent lime survey flagging #B8F23A on the stake tag alone, brick red #C0272D on the crate tabs alone")


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
        "run_date": "2026-11-12", "slug": "fifty-years-one-word-short", "title": "Fifty Years, One Word Short",
        "concept": ("On November 10th Alaska's Department of Natural Resources approved a 50-year lease of about 715 acres for STAK Energy's gas-powered data center on the North Slope, case ADL 422741. "
                    "The notice says data center and high-performance computing and never says AI, the Northern Alaska Environmental Center, an advocacy group, lists artificial intelligence computing among the possible uses. "
                    "ADN reports 1 to 3 gigawatts, North Slope gas and no Railbelt connection, STAK says no ratepayer impact, World Oil reported a 15-year gas deal, "
                    "the state got 1,205 comments and ADN says most were opposed, the governor-elect says he would support a moratorium and reconsideration is due November 30th. "
                    "The film draws all of it on one survey stake tag with a raven as witness, lets the 1,205 comments fall as paper snow onto the line, and ends on a hard cut at the tag with an empty IN RETURN line."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "ground-level-side", "motion_vector": "assemble-build", "hero_treatment": "structure-as-subject", "layout": "clothesline-layers",
                        "register": "naturalistic-scene", "palette": PALETTE, "camera_strategy": "static-lock",
                        "light_story": "rose-line dusk, paper-lit cutaways, a hard cut to black",
                        "metaphor": "a survey stake whose tag the lease, the gas deal and the public each pull on, watched by a raven"},
        "palette": PALETTE,
        "divergence_note": ("The last films were pink-gold ice fog with amber (11-11), a violet shore with vermilion and lemon (11-10), an oxblood courtroom (11-09), a permafrost road (11-08), a teal transformer yard (11-07) and a tangerine office (11-06). "
                            "This film is a lifted blue dusk with a rose horizon line over trampled snow, with fluorescent lime survey flagging on one object (breaking the three-run warm accent streak) and red only on the crate tabs. "
                            "Its hero is the stake tag with a raven as supporting witness, its device is a clothesline that carries every document, its comments arrive as paper snow, its Test is slips weighing the line down, and it ends on a hard cut with the stake still leaning, no crane-up and no lamp pool. "
                            "Honest cost: seven of twelve shots stay at the stake and the macro and overhead stages are camera framings of the same pieces."),
        "treatment": {"title": "Fifty Years, One Word Short", "summary": ad["treatment"]["judge_reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "anomaly-question", "frame1": "A raven drops out of blue dusk onto a lone survey stake and a stamp slams onto its blank orange tag.",
                 "headline": "ONE WORD NOT IN THE NOTICE", "motion_by_s": 0.3,
                 "loopback": "Frame 1 is the raven pecking a blank tag, the last frame is the raven tapping the blank IN RETURN line on the same tag, the lean unrecovered, then a hard cut to black."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(34), "plant_glow_s": 0.4, "plant_sfx": "tick", "what": "Which word is missing from the paperwork? Planted as a hollow word-shaped hole on a card beside the tag, paid when the reticle locks on empty paper, NOTICE TEXT · NO AI."},
        "open_loop_2": {"plant_t": b_at(19), "pay_t": b_at(38), "what": "What is the second clock? Planted as a clock opening under the short gas cord, paid when the 15-year cord ends inside the frame and the 50-year lease cord runs off its edge."},
        "throughline": {"object": "the stake tag", "lands_in_button": "the stake still leans, both cords are still on the tag and a new empty IN RETURN line asks the closing question before the cut",
                        "param_states": {str(k): v for k, v in TAG_STATES.items()},
                        "states": [
                            {"at_s": b_at(1), "state": "T1 blank, spinning"},
                            {"at_s": b_at(2), "state": "T2 stamped 50-YEAR LEASE, one taut cord"},
                            {"at_s": b_at(7), "state": "T2b the tag gains an acreage band as the survey flags close around the stake"},
                            {"at_s": b_at(18), "state": "T3 second cord clipped on, 15-YR REPORTED, end coiled"},
                            {"at_s": b_at(28), "state": "T4 slips snagged on its strings, stake leaning"},
                            {"at_s": b_at(38), "state": "T4b the lean deepens toward the long cord as it lays out on the ruler"},
                            {"at_s": b_at(40), "state": "T5 leaning, with an empty IN RETURN line"}]},
        "reveals": [
            {"t": b_at(7), "type": "build-on", "what": "survey flags plant themselves and a dotted square closes around the stake", "hold_s": 0.8},
            {"t": b_at(12), "type": "build-on", "what": "a gas cutaway card swings in with a pipe feeding a generator hall", "hold_s": 0.8},
            {"t": b_at(20), "type": "build-on", "what": "a mailbox flap bangs open and slips spill until the tally reads 1,205", "hold_s": 0.8},
            {"t": b_at(35), "type": "scale-pullback", "what": "from the cords on the tag to both cords on one overhead ruler", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 1, "offset": 0.0, "level": 1.0}, {"line": 4, "offset": 0.0, "level": 1.4},
            {"line": 6, "offset": 0.0, "level": 0.5}, {"line": 7, "offset": 0.0, "level": 1.3}, {"line": 9, "offset": 0.0, "level": 0.4},
            {"line": 10, "offset": 0.0, "level": 1.0}, {"line": 11, "offset": 0.0, "level": 1.4}, {"line": 12, "offset": 0.0, "level": 0.5},
            {"at_s": round(b_at(42) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(42) + 0.6, 3), "level": 2.0},
            {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(42) - 0.5, 3), "riser_at": round(b_at(38), 3), "silence_at": round(b_at(42) - 0.5, 3),
            "payoff_at": b_at(42), "button_pattern": "callback", "interrupt_at": b_at(20), "extra_dips": [b_at(28), b_at(39)]},
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
    book.raise_if_missing("board_1112 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1112Ids.ts").write_text(
        "// GENERATED by scripts/board_1112.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
