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
 (1, 0, 0.0, "whoosh", "a raven", "drops out of the indigo dusk under the Brooks Range ridgeline onto a survey stake whose orange tag flips blank in the wind", "watchful", "NORTH SLOPE · ILLUSTRATIVE", "the tag swings", ""),
 (2, 0, W("fifty"), "thunk", "a rubber stamp", "slams onto the blank orange tag and the string pulls taut", "firm", "50-YEAR LEASE", "the string hums", ""),
 (3, 0, W("one"), "tick", "the raven", "tilts its head at the tag while a blank card with a hollow word-shaped hole flips beside it", "curious", "ONE WORD NOT IN THE NOTICE", "the card flutters", "plant: the missing word"),
 (4, 1, 0.0, "page", "a faceless state letter", "slides down onto a snowdrift and unfolds under the stake with the raven hopping onto its corner", "formal", "APPROVED NOV 10", "the letter settles", ""),
 (5, 1, W("STAK"), "pop", "a plain wooden company sign", "rises out of the snow beside the letter and rocks once", "plain", "STAK ENERGY", "the sign rocks", ""),
 (6, 1, W("case"), "stamp", "a case-number ticker on the letter", "rolls its digits and locks on the number", "precise", "ADL 422741", "the digits lock", ""),
 (7, 2, 0.0, "pop", "a pin", "drops onto the North Slope of a paper map of Alaska and a dotted survey square draws itself around it", "careful", "ABOUT 715 ACRES", "the square closes", ""),
 (8, 2, 0.55, "tick", "the pin's offset line", "slides south along the map from a Deadhorse dot while the raven follows it with its eye", "careful", "26 MILES SOUTH OF DEADHORSE", "the line ticks", ""),
 (9, 3, 0.0, "type", "the notice page", "types out a line and a highlighter bar sweeps across it", "flat", "GAS-POWERED DATA CENTER", "the bar sweeps", ""),
 (10, 3, W("high"), "tick", "the highlighter", "jumps to a second line while the raven leans in over the page", "focused", "HIGH-PERFORMANCE COMPUTING", "the bar jumps", ""),
 (11, 4, 0.0, "whoosh", "a pipe", "feeds gas into a squat generator hall as the camera dollies into a cutaway", "steady", "NORTH SLOPE GAS", "the hall hums", "rehook: the camera dollies out of the snow into a generator hall cutaway"),
 (12, 4, W("one"), "hum", "a gauge needle", "swings across the generator's dial and lands under a newsprint badge", "steady", "1 TO 3 GW · ADN", "the needle settles", ""),
 (13, 4, W("tied"), "snap", "a dashed cable", "strains toward a Railbelt wall socket, stops one hand-width short and snaps back", "stubborn", "OFF-GRID", "the cable recoils", ""),
 (14, 5, 0.0, "pop", "a speech chip", "pops onto the generator's side with the company's words", "assured", "STAK SAYS NO RATEPAYER IMPACT", "the chip wobbles", ""),
 (15, 5, W("company"), "tick", "a CLAIM stamp", "presses onto the chip and the chip tilts under it", "wry", "A COMPANY CLAIM", "the chip tilts", ""),
 (16, 6, 0.0, "page", "a newsprint clipping", "slides in on a cord from the right edge with a masthead and a date tab", "reading", "WORLD OIL · REPORTED NOV 5", "the clipping swings", ""),
 (17, 6, W("fifteen"), "click", "a short cord", "ties itself onto the stake tag beside the long lease cord and hangs visibly shorter", "tense", "15-YEAR GAS DEAL", "the cord swings", ""),
 (18, 6, W("second"), "riser", "a second clock face", "opens under the short cord and its hand starts to tick", "uneasy", "A SECOND CLOCK", "the hand ticks", "plant: the second clock"),
 (19, 7, 0.0, "thud", "a mail slot", "bangs open as the camera whips into a fluorescent mailroom and slips start to fall", "overwhelmed", "THEN THE PUBLIC SPOKE", "the slot rattles", ""),
 (20, 7, W("one"), "cascade", "a tally counter", "rolls its drums as slips pile past the raven's perch", "overwhelmed", "1,205 COMMENTS", "the drums settle", ""),
 (21, 7, W("opposed"), "stamp", "red stamps", "hammer onto the heap and a tray fills with red-stamped slips", "firm", "MOSTLY OPPOSED · ADN", "the tray overflows", "rehook: red stamps hammer the heap and the opposed tray overflows"),
 (22, 8, 0.0, "slide", "a plain card", "slides over the slips and settles on the counter", "careful", "INCOMING GOVERNOR BACKS MORATORIUM", "the card settles", ""),
 (23, 8, W("statement"), "tick", "a footer stamp", "presses onto the card's lower edge in plain type", "careful", "STATEMENT OF SUPPORT · NOT AN ACTION", "the stamp lands", ""),
 (24, 8, W("lease"), "hush", "the card", "slides away from the stake's tag on a thin rail and stops apart from it", "plain", "NOT ABOUT THIS LEASE", "the card stops", ""),
 (25, 9, 0.0, "creak", "the stake", "leans as slips pile on its strings and the orange tag bends", "strained", "THE STRONGEST OBJECTION", "the stake leans", ""),
 (26, 9, W("something"), "thud", "the lease cord", "sags under a heavy tag swinging from its middle", "heavy", "SOMETHING VERY LARGE", "the cord sags", ""),
 (27, 10, 0.0, "whoosh", "the raven", "drags a search reticle across the notice page as the camera pushes in", "hunting", "THE MISSING WORD", "the reticle drifts", ""),
 (28, 10, W("never"), "blip", "the reticle", "closes on the page and locks on empty paper", "flat", "NOTICE TEXT: NO \"AI\"", "the ring locks", ""),
 (29, 10, W("Environmental"), "pop", "an attribution chip", "slides in from the margin carrying a phrase in quotes", "plain", "ENVIRONMENTAL CENTER LISTS \"ARTIFICIAL INTELLIGENCE COMPUTING\"", "the chip settles", ""),
 (30, 11, 0.0, "whoosh", "the camera", "pulls back from the notice to two cords laid along a long ruler under the stake", "grave", "LAND · GAS · HALF A CENTURY", "the ruler unrolls", "rehook: the camera pulls back to two cords laid on one ruler"),
 (31, 11, W("fifteen"), "click", "the short cord", "ends tidy inside the frame with a brass cap", "tidy", "15-YEAR GAS DEAL", "the cap clicks", ""),
 (32, 11, W("fifty"), "riser", "the long lease cord", "runs off the right edge of the frame while the stake leans after it and the raven tilts its head", "grave", "50-YEAR LEASE", "the cord runs on", ""),
 (33, 12, 0.0, "thud", "a calendar pin", "lands on the November 30th square and a red ring draws around it", "urgent", "RECONSIDERATION DUE NOV 30", "the ring closes", ""),
 (34, 13, 0.0, "hush", "the stake", "straightens under one lamp wearing a new blank orange tag as the raven lands on it", "open", "WHAT SHOULD ALASKA ASK?", "the tag swings once", ""),
 (35, 13, W("fifty"), "tick", "the camera", "rises from the stake to one small light on a vast dark Slope", "open", "50 YEARS OF STATE LAND", "the lamp pool shrinks", ""),
 (36, 5, W("impact"), "tick", "the chip's ribbon", "unfurls under the speech chip with the words on it", "assured", "NO IMPACT · PUBLIC GRID", "the ribbon ripples", ""),
 (37, 7, W("Daily"), "pop", "a newspaper masthead", "pops onto the heap of slips beside the tray", "plain", "ANCHORAGE DAILY NEWS", "the masthead rocks", ""),
 (38, 9, W("power"), "hum", "the raven", "hops along the leaning stake toward a small glowing plug that hangs unconnected from its tag", "watchful", "A PROJECT THAT POWERS ITSELF", "the plug swings", ""),
 (39, 11, W("gas"), "tick", "the ruler", "ticks a notch past the short cord while a gas flame flickers at the cord's tip", "grave", "GAS", "the flame flickers", ""),
 (40, 11, W("lease"), "creak", "the stake", "tilts a degree toward the long cord and the raven shifts its feet", "grave", "BECAUSE THE CLOCKS DIFFER", "the stake tilts", ""),
 (41, 13, W("powers"), "hum", "the lamp", "glows brighter over the stake as a plug-end swings free of its tag", "open", "A PROJECT THAT POWERS ITSELF", "the lamp warms", ""),
 (42, 13, W("Alaska"), "tick", "the blank tag", "turns slowly toward the camera as a pen-shaped shadow hovers over it", "open", "WHAT SHOULD ALASKA ASK?", "the tag turns", ""),
 (43, 0, W("Deadhorse"), "tick", "a faint map ridge behind the stake", "lights a Deadhorse dot at its foot as the raven glances toward it", "careful", "NEAR DEADHORSE", "the dot glows", ""),
 (44, 8, W("construction"), "tick", "a tiny hard-hat tag", "swings from the card's corner", "careful", "DATA CENTER CONSTRUCTION", "the tag swings", ""),
 (45, 10, W("among"), "tick", "a pin", "drops onto the chip and its torn list flips open to reveal a second line", "plain", "AMONG THE POSSIBLE USES", "the list unfurls", ""),
]

PLATE_AT = {43: "on-object", 44: "on-object", 45: "on-object", 36: "on-object", 37: "on-object", 38: "on-object", 39: "on-object", 40: "lower-third", 41: "on-object", 42: "lower-third", 1: "corner-tag", 2: "on-object", 3: "on-object", 4: "on-object", 5: "on-object", 6: "on-object", 7: "on-object", 8: "side-plate-right",
            9: "on-object", 10: "on-object", 11: "side-plate-left", 12: "on-object", 13: "on-object", 14: "on-object", 15: "on-object",
            16: "on-object", 17: "on-object", 18: "on-object", 19: "lower-third", 20: "on-object", 21: "on-object", 22: "on-object",
            23: "on-object", 24: "on-object", 25: "lower-third", 26: "on-object", 27: "hud", 28: "hud", 29: "side-plate-left",
            30: "lower-third", 31: "on-object", 32: "on-object", 33: "on-object", 34: "on-object", 35: "lower-third"}
CLAIM_MAP = {43: ["c7"], 44: ["c27"], 45: ["c31"], 36: ["c20"], 37: ["c22"], 38: ["narration"], 39: ["narration"], 40: ["narration"], 41: ["narration"], 42: ["narration"], 1: ["narration"], 2: ["c4"], 3: ["narration"], 4: ["c1"], 5: ["c3"], 6: ["c2"], 7: ["c5"], 8: ["c7"], 9: ["c9"], 10: ["c10"],
             11: ["c15"], 12: ["c11"], 13: ["c13"], 14: ["c20"], 15: ["c20"], 16: ["c16"], 17: ["c16"], 18: ["narration"], 19: ["narration"],
             20: ["c21"], 21: ["c22"], 22: ["c27"], 23: ["c27"], 24: ["c27"], 25: ["narration"], 26: ["narration"], 27: ["narration"],
             28: ["c32"], 29: ["c31"], 30: ["narration"], 31: ["c16"], 32: ["c4"], 33: ["c23"], 34: ["narration"], 35: ["c4"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "low", "slope-dusk-stake", "eye-level-immersive", "single-object-void", "vertical-descent", "landscape-as-subject", "", "", "The stake", "A raven lands on a lone survey stake at blue dusk and a stamp slams onto its blank orange tag"),
 (2, 1, "push-detail", "close", "overhead", "notice-on-snow", "macro-closeup", "single-object-void", "scroll-data", "instrument-as-subject", "graphic-match", "match", "The notice", "The state letter unfolds on the snow with its date, a company sign and the case number locking"),
 (3, 2, "map-territory", "wide", "overhead", "slope-survey-map", "top-down-map", "map-territory", "radial-emanate", "data-as-subject", "map-travel", "travel", "The site", "A pin drops on a paper map of the Slope, a dotted survey square closes and an offset line runs south from Deadhorse"),
 (4, 3, "push-detail", "insert", "eye", "notice-highlight", "macro-closeup", "fullbleed-split", "scroll-data", "instrument-as-subject", "hard-cut", "carry", "What it says", "A highlighter sweeps two lines of the notice while the raven reads over it"),
 (5, 4, "subject-portrait", "medium", "eye", "gas-hall-cutaway", "cross-section-cutaway", "stacked-layers", "assemble-build", "structure-as-subject", "whip-pan", "travel", "Its own power", "A cutaway shows gas feeding a generator hall, a gauge badge, a dashed cable that stops short of the Railbelt socket and the company's own claim chip"),
 (6, 6, "push-detail", "close", "ground", "two-cord-clock", "eye-level-immersive", "grid-modular", "horizontal-traverse", "data-as-subject", "hard-cut", "build", "The second clock", "A newsprint clip ties a short gas cord beside the lease cord on the stake tag and a clock opens beneath it"),
 (7, 7, "wide-establish", "wide", "eye", "mailroom", "eye-level-immersive", "fullbleed-split", "vertical-descent", "structure-as-subject", "whip-pan", "travel", "The mailroom", "A fluorescent mailroom fills with falling slips, the tally rolls to 1,205 and red stamps fill an opposed tray"),
 (8, 8, "subject-portrait", "medium", "low", "mailroom-counter", "eye-level-immersive", "single-object-void", "horizontal-traverse", "instrument-as-subject", "carried-element", "carry", "A statement, not an action", "A plain card about the incoming governor slides onto the counter, is stamped as support and not an action and slides apart from the stake's tag"),
 (9, 9, "alt-vantage", "wide", "ground", "stake-leaning", "eye-level-immersive", "single-object-void", "vertical-descent", "structure-as-subject", "match-cut", "match", "The strongest objection", "The stake leans under piled slips and the lease cord sags under a heavy swinging tag"),
 (10, 10, "push-detail", "close", "overhead", "reticle-search", "instrument-screen", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "mask-wipe", "build", "The missing word", "The raven drags a search reticle across the notice and it locks on empty paper while an attributed phrase slides in"),
 (11, 11, "wide-establish", "extreme-wide", "eye", "two-cords-ruler", "orbital-aerial", "stacked-layers", "horizontal-traverse", "data-as-subject", "graphic-match", "match", "One ruler", "The camera pulls back to two cords on one ruler, the short one capped inside the frame and the long one running off its edge"),
 (12, 12, "subject-portrait", "extreme-wide", "high", "stake-lamp-night", "orbital-aerial", "single-object-void", "vertical-rise", "landscape-as-subject", "match-cut", "match", "The question", "A calendar pin rings November 30th, then one lamp lights the straightened stake wearing a blank tag and the camera rises to a vast dark Slope"),
]

AMBIENT = {1: "wind over snow, the tag creaks, a stamp thunks", 2: "paper settles on the snow, the digits tick", 3: "the map paper settles, the pin pops",
           4: "the highlighter squeaks, wind at the page edge", 5: "the generator hums, the cable snaps, a socket clicks", 6: "the cords creak, the clock ticks",
           7: "fluorescent buzz, slips slide and thump, stamps land", 8: "fluorescent buzz, the card slides on the counter", 9: "the stake creaks, slips rustle, the cord groans",
           10: "the reticle whirs, paper rustles", 11: "wind, the ruler unrolls, a cap clicks", 12: "a lamp buzzes, a pin thuds, wind over the dark"}
CENTER = {1: "the stake at x560 y980", 2: "the letter at x540 y960", 3: "the pin at x560 y900", 4: "the notice at x540 y950", 5: "the generator hall at x500 y940",
          6: "the stake tag at x540 y930", 7: "the mail slot at x540 y900 and the tally at x760 y1100", 8: "the card at x520 y980", 9: "the leaning stake at x560 y960",
          10: "the reticle at x540 y940", 11: "the two cords at x540 y980", 12: "the stake at x420 y1040 under the lamp"}
HERO = {
 1: ("survey stake + orange tag + raven + stamp", "55% stake and tag, 25% raven, 20% dusk snow"),
 2: ("state letter + company sign + case ticker + snow drift", "60% letter, 25% sign and ticker, 15% snow"),
 3: ("paper map of the Slope + pin + survey square + offset line", "60% map, 30% pin and square, 10% line"),
 4: ("notice page + highlighter bars + raven", "60% page, 25% highlighter, 15% raven"),
 5: ("generator hall + gas pipe + gauge badge + dashed cable + wall socket + claim chip", "50% hall, 30% cable and socket, 20% chip and badge"),
 6: ("stake tag + short cord + long cord + newsprint clipping + clock face", "50% cords, 30% clip, 20% clock"),
 7: ("mail slot + falling slips + tally counter + red-stamped tray", "55% slips and slot, 25% tally, 20% tray"),
 8: ("counter + plain card + stamp + stake tag on a rail", "55% card, 25% counter, 20% stake tag"),
 9: ("leaning stake + piled slips + sagging lease cord + heavy tag", "55% stake and slips, 30% cord, 15% tag"),
 10: ("notice page + search reticle + attributed chip + raven", "55% page and reticle, 25% chip, 20% raven"),
 11: ("ruler + short capped cord + long cord running off frame + stake", "50% cords, 30% ruler, 20% stake"),
 12: ("stake with blank tag + calendar pin + lamp pool + vast dark Slope", "45% dark and road, 35% stake and tag, 20% lamp and pin"),
}
PARTS = {1: 46, 2: 44, 3: 40, 4: 38, 5: 56, 6: 44, 7: 54, 8: 42, 9: 46, 10: 44, 11: 42, 12: 44}
KICKS = (2, 20, 32)
CAMERA = {1: "craneDown", 2: "dollyThrough", 3: "craneDown", 4: "static:the highlighter and the raven's eye are the move", 5: "craneDown+dollyThrough",
          6: "truckAcross", 7: "dollyThrough", 8: "truckAcross", 9: "static:the lean of the stake is the move", 10: "dollyThrough",
          11: "truckAcross", 12: "riseWith"}

TAG_STATES = {
 1: {"name": "blank, wind-flipped", "cords": 0},
 2: {"name": "stamped 50-YEAR LEASE and ABOUT 715 ACRES, string taut", "cords": 1},
 3: {"name": "roped with a shorter 15-YEAR cord", "cords": 2},
 4: {"name": "overloaded by comment slips, the stake leaning", "cords": 2},
 5: {"name": "retagged with the closing question, stands straight", "cords": 2},
}

PALETTE = ("polar indigo dusk #0D2438, packed glacier snow, raven black, parchment #E8DDC2 with charcoal text #1B2230, survey orange #FF6A1A on the stake tag alone, brick red #C0272D on the comment slips alone")


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
                    "The film draws all of it on one survey stake tag with a raven as witness, gives the objection a full scene in the mailroom and ends on one question."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "vertical-descent", "hero_treatment": "structure-as-subject", "layout": "single-object-void",
                        "register": "naturalistic-scene", "palette": PALETTE, "camera_strategy": "crane-down",
                        "light_story": "blue dusk, fluorescent mailroom, one lamp at night",
                        "metaphor": "a survey stake whose tag the lease, the gas deal and the public each pull on, watched by a raven"},
        "palette": PALETTE,
        "divergence_note": ("The last films were pink-gold ice fog with amber (11-11), a violet shore with vermilion and lemon (11-10), an oxblood courtroom (11-09), a permafrost road (11-08), a teal transformer yard (11-07) and a tangerine office (11-06). "
                            "This film is polar indigo dusk over blue-white snow with one saturated survey orange on a single object and red only in the mailroom, a different dominant hue family. "
                            "Its hero is a raven, not a machine or a sensor, its throughline is a stake tag and two cords, its shape contrast is one upright stake against a flat horizon and a sagging cord, and it ends on a crane-up from a lamp-lit stake to a vast dark Slope."),
        "treatment": {"title": "Fifty Years, One Word Short", "summary": ad["treatment"]["judge_reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "anomaly-question", "frame1": "A raven drops out of blue dusk onto a lone survey stake and a stamp slams onto its blank orange tag.",
                 "headline": "ONE WORD NOT IN THE NOTICE", "motion_by_s": 0.3,
                 "loopback": "The button ends with the raven landing on the straightened stake under one lamp, wearing a blank orange tag, the mirror of frame one."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(28), "plant_glow_s": 0.4, "plant_sfx": "tick", "what": "Which word is missing from the paperwork? Planted as a hollow word-shaped hole on a card beside the tag, paid when the reticle locks on empty paper, NOTICE TEXT: NO AI."},
        "open_loop_2": {"plant_t": b_at(18), "pay_t": b_at(32), "what": "What is the second clock? Planted as a clock opening under the short gas cord, paid when the 15-year cord ends inside the frame and the 50-year lease cord runs off its edge."},
        "throughline": {"object": "the stake tag", "lands_in_button": "the stake stands straight under one lamp wearing a blank orange tag that asks the closing question",
                        "param_states": {str(k): v for k, v in TAG_STATES.items()},
                        "states": [
                            {"at_s": b_at(1), "state": "T1 blank, wind-flipped"},
                            {"at_s": b_at(2), "state": "T2 stamped 50-YEAR LEASE, string taut"},
                            {"at_s": b_at(5), "state": "T2b the tag takes the company sign, the string held at one cord"},
                            {"at_s": b_at(13), "state": "T2c the dashed cable stops short and the tag's string slackens a notch"},
                            {"at_s": b_at(17), "state": "T3 roped with a shorter 15-YEAR cord"},
                            {"at_s": b_at(25), "state": "T4 overloaded by comment slips, stake leaning"},
                            {"at_s": b_at(34), "state": "T5 retagged with the closing question, stands straight"}]},
        "reveals": [
            {"t": b_at(8), "type": "scale-pullback", "what": "the pin on the map becomes a survey square and an offset line from Deadhorse", "hold_s": 0.8},
            {"t": b_at(11), "type": "build-on", "what": "gas feeds a generator hall and the dashed cable stops short of the Railbelt socket", "hold_s": 0.8},
            {"t": b_at(20), "type": "build-on", "what": "slips pour from the mail slot and the tally rolls up to 1,205", "hold_s": 0.8},
            {"t": b_at(30), "type": "scale-pullback", "what": "from the notice to two cords on one ruler", "hold_s": 0.8},
            {"t": b_at(35), "type": "scale-pullback", "what": "from the lamp-lit stake to a vast dark Slope", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 1, "offset": 0.0, "level": 1.0}, {"line": 4, "offset": 0.0, "level": 1.4},
            {"line": 6, "offset": 0.0, "level": 0.5}, {"line": 7, "offset": 0.0, "level": 1.3}, {"line": 9, "offset": 0.0, "level": 0.4},
            {"line": 10, "offset": 0.0, "level": 1.0}, {"line": 11, "offset": 0.0, "level": 1.4}, {"line": 12, "offset": 0.0, "level": 0.5},
            {"at_s": round(b_at(34) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(34) + 0.6, 3), "level": 2.0},
            {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(34) - 0.5, 3), "riser_at": round(b_at(30), 3), "silence_at": round(b_at(34) - 0.5, 3),
            "payoff_at": b_at(34), "button_pattern": "callback", "interrupt_at": b_at(19), "extra_dips": [b_at(26), b_at(33)]},
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
