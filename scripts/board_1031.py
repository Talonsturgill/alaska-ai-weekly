#!/usr/bin/env python3
"""2026-10-31 "A Ceiling Is Not a Cable": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1031.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1031.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "whoosh", "Pip", "pops out of a phone screen on a chart desk and tumbles onto the paper, brass and wide-eyed", "curious", "A CHATBOT QUESTION · ALASKA.AI'S FRAMING",
  "a brass question token with eyes pops out of a phone screen on a cream chart desk and tumbles across the paper while a chip reads A CHATBOT QUESTION, ALASKA.AI'S FRAMING, its engraving band reads a question mark",
  "the phone glows and the token wobbles", "plant: where does the question go"),
 (2, 1, 0, W("chatbot"), "pop", "Pip", "leaps off the desk edge in an arc toward a painted sea and drops through the surface with a splash", "curious", "OUT OF ALASKA",
  "the token leaps off the desk in an arc toward a cut-away window of cobalt sea and drops through the surface with a splash", "the splash rings", ""),
 (3, 1, 0, W("cable"), "hum", "Pip", "lands on a glowing cable in the deep and zips along it", "curious", "ONE CABLE SOUTH",
  "the token lands on a cream-coloured cable under the sea and zips along it leaving a pulse of light", "the pulse streams", ""),
 (4, 2, 1, 0.0, "whoosh", "the chart", "pulls back from the cable to a map where four cream strands draw on from Alaska", "reading", "4 SUBSEA CABLES",
  "the camera pulls back from the cable to a painted chart of the North Pacific where four cream strands with ink keylines draw on from Alaska, a plate reads 4 SUBSEA CABLES",
  "the strands pulse", "rehook: the camera pulls back to the whole map"),
 (37, 2, 1, W("land"), "tick", "an ink line", "draws itself north of the strands across Canada as the land route", "reading", "1 LAND ROUTE · PER AIDEA",
  "a solid ink line in land colour draws itself across Canada north of the strands, a plate reads 1 LAND ROUTE, PER AIDEA", "the line settles", ""),
 (5, 2, 1, W("Oregon"), "ping", "three pins", "pop onto the Oregon coast and one onto Washington", "reading", "3 OREGON · 1 WASHINGTON",
  "three pins pop onto the Oregon coast and one onto Washington, a plate reads 3 OREGON, 1 WASHINGTON", "the pins pulse", ""),
 (6, 2, 1, W("Washington"), "knock", "Pip", "rolls west across the empty Pacific and bonks into an invisible pane of glass", "puzzled", "THE GLASS TO THE WEST",
  "the token rolls west across the empty Pacific and bonks into an invisible pane of glass that rings", "the glass rings", "plant: the wall to the west"),
 (7, 3, 2, 0.0, "page", "two old strands", "wear paper party hats under the sea as Pip rolls slowly past them", "wry", "ALASKA UNITED EAST 1999 · ALASKA COMMUNICATIONS 1999",
  "two of the four cream strands on the seabed wear paper party hats and hang tags reading ALASKA UNITED EAST 1999 and ALASKA COMMUNICATIONS 1999 while Pip slows as it passes", "the hats wobble", ""),
 (8, 3, 2, W("AIDEA"), "thunk", "a card", "drops beside the strands reading AIDEA", "reading", "AIDEA · STATE DEVELOPMENT AUTHORITY",
  "a card drops onto the seabed reading AIDEA, STATE DEVELOPMENT AUTHORITY", "the card settles", ""),
 (9, 3, 2, W("about"), "clink", "a birthday cake", "lights one steady candle on a card reading ABOUT 25 YEARS PER AIDEA", "wry", "TYPICAL DESIGN LIFE · ABOUT 25 YEARS · PER AIDEA",
  "a small cake with a sign reading TYPICAL DESIGN LIFE ABOUT 25 YEARS PER AIDEA and one steady candle", "the candle glows", ""),
 (10, 4, 3, 0.0, "thump", "a street sign", "rises out of the desk reading A DIGITAL CUL-DE-SAC", "puzzled", "\"A DIGITAL CUL-DE-SAC\" · AIDEA",
  "a graphite street sign rises out of the chart reading A DIGITAL CUL-DE-SAC, AIDEA", "the sign sways", ""),
 (38, 4, 3, 0.45, "roll", "Pip", "loops the painted bulb under the sign and rolls out the way it came", "puzzled", "OUT THE WAY IT CAME",
  "the token loops the painted bulb under the cul-de-sac sign and rolls back out the way it came, a plate reads OUT THE WAY IT CAME", "the token wobbles", ""),
 (11, 4, 3, W("connects"), "whoosh", "Pip", "rolls west again and the invisible glass wall lights up", "puzzled", "NO CABLE FROM ALASKA REACHES ASIA DIRECTLY · PER AIDEA",
  "the token rolls west again and the invisible glass wall lights up with a plate reading NO CABLE FROM ALASKA REACHES ASIA DIRECTLY, PER AIDEA", "the glass glints", ""),
 (12, 4, 3, W("Hold"), "ratchet", "Pip", "turns to camera and its engraving band clicks over to VIA LOWER 48", "thoughtful", "HOLD THAT THOUGHT",
  "the token turns to camera and its engraving band clicks over to VIA LOWER 48, a plate reads HOLD THAT THOUGHT", "the token wobbles", ""),
 (13, 5, 4, 0.0, "thunk", "a gavel", "drops on a block marked OCT 21ST and a pencil jumps up from the chart", "reading", "OCT 21ST · AIDEA BOARD · RESOLUTION G26-11",
  "a gavel drops on a block under a plate reading OCT 21ST, AIDEA BOARD, RESOLUTION G26-11 and a graphite pencil jumps up from the chart", "the block jumps", "rehook: the gavel lands and the pencil starts a line"),
 (14, 5, 4, W("Northstar"), "scratch", "a pencil", "draws a graphite line out from Alaska and letters a nameplate along it", "reading", "NORTHSTAR FIBER DEVELOPMENT LLC",
  "the graphite pencil draws a line out from Alaska across the chart and letters NORTHSTAR FIBER DEVELOPMENT LLC along it while Pip rolls toward its tip", "the pencil shavings fall", ""),
 (15, 5, 4, W("owned"), "click", "a bracket", "snaps around the pencil's nameplate", "reading", "OWNED BY AIDEA",
  "a bracket snaps around the lettered nameplate on the pencil line, a plate reads OWNED BY AIDEA", "the bracket settles", ""),
 (16, 6, 5, 0.0, "swell", "a tide gauge", "rises out of the sea cut-away with a painted ceiling line at the top", "reading", "UP TO $75 MILLION",
  "a tall brass tide gauge rises out of a window of cobalt sea with a painted ceiling line at the top reading UP TO $75 MILLION and the water at zero", "the gauge glints", ""),
 (17, 6, 5, W("ceiling"), "tick", "Pip", "floats up the gauge, bonks softly at the painted line and its band flips to UP TO $75M while the camera pulls back", "wry", "A CEILING · NOT A CHECK",
  "the token floats up the gauge and bonks softly against the painted ceiling line, its engraving band reads UP TO $75M while the camera pulls back to show the water still at zero, a plate reads A CEILING, NOT A CHECK",
  "the gauge sways", "rehook: the camera pulls back to the empty gauge"),
 (18, 6, 5, W("date"), "knock", "a chronometer", "lands on the chart edge with a thud, lid shut, a vermilion tab on its side", "thoughtful", "ONE DATE",
  "a closed brass chronometer lands on the chart edge with a vermilion tab, a plate reads ONE DATE", "the chronometer ticks", "plant: the date"),
 (19, 7, 6, 0.0, "page", "a to-do list", "slides open across the desk with three ruled lines and line one lights up", "reading", "1 · ALASKA TO THE PACIFIC COAST",
  "a paper list unrolls with three ruled lines and line one lights up reading 1 ALASKA TO THE PACIFIC COAST while lines two and three stay faint pencil ghosts", "the list sways", ""),
 (39, 7, 6, W("Pacific"), "tick", "a pencil", "drops onto line one and a tick mark lands beside it", "reading", "PACIFIC COAST FIRST",
  "a graphite pencil ticks the first line on the list, a plate reads PACIFIC COAST FIRST", "the pencil taps", ""),
 (20, 7, 6, W("land"), "stamp", "a stamp", "slams down and pins a passing cable to the Alaska shore", "reading", "MUST LAND IN ALASKA",
  "a cable swooping past the shore is pinned to the beach by a stamp reading MUST LAND IN ALASKA", "the cable twitches", ""),
 (21, 7, 6, W("picks"), "fade", "three pencil cards", "slide in and the swooping cable lifts away", "reading", "NO PROJECT · NO PARTNER · NO ROUTE",
  "three pencil cards slide in reading NO PROJECT, NO PARTNER, NO ROUTE while the swooping cable lifts away while the three cards settle and Pip waits on blank paper", "the cards settle", ""),
 (22, 8, 7, 0.0, "page", "two documents", "slide onto the chart desk under a magnifier", "wry", "THE CASE AGAINST OUR OWN SPIN",
  "two documents slide onto the chart desk under a brass magnifier while Pip peers over the edge, a plate reads THE CASE AGAINST OUR OWN SPIN", "the documents settle", "rehook: the film turns on itself"),
 (23, 8, 7, W("release"), "scratch", "a magnifier", "sweeps the press release line by line", "wry", "THE PRESS RELEASE",
  "the magnifier sweeps the press release line by line", "the lens glints", ""),
 (40, 8, 7, W("artificial"), "ping", "the magnifier", "stops on the letters AI and they are only inside the word AIDEA, ringed in pencil", "wry", "AI · ONLY INSIDE AIDEA",
  "the magnifier stops on the letters AI, which sit only inside the word AIDEA, and a pencil rings them", "the ring draws", ""),
 (41, 8, 7, W("compute"), "thump", "three ghost words", "fall through the paper because they weigh nothing", "wry", "AI · DATA CENTER · COMPUTE · NOT IN EITHER DOCUMENT",
  "three ghost words AI, DATA CENTER and COMPUTE drawn in graphite fall straight through the paper, a plate reads AI, DATA CENTER, COMPUTE, NOT IN EITHER DOCUMENT", "the words fall", ""),
 (24, 8, 7, W("part"), "bloop", "a chip", "slides onto the AI word", "reading", "ALASKA.AI'S FRAMING",
  "a chip slides onto the AI word reading ALASKA.AI'S FRAMING", "the chip settles", ""),
 (25, 9, 8, 0.0, "slide", "a binder", "is lowered onto a chart table beside an Alaska outline", "reading", "STUDIES CITED",
  "a blue binder is lowered onto a top-down chart table beside a pencilled Alaska outline, a plate reads STUDIES CITED", "the binder swings", ""),
 (42, 9, 8, W("Nordic"), "page", "little flags", "pop up on the binder's spine", "reading", "NORDIC AND EUROPEAN",
  "little Nordic and European flags pop up on the binder's spine", "the flags flutter", ""),
 (26, 9, 8, W("Alaska"), "crack", "the binder", "is laid over the Alaska outline and its fjord coastline does not fit", "wry", "NORDIC AND EUROPEAN · NOT ALASKA",
  "the binder's fjord coastline is laid over the Alaska outline and does not fit, a plate reads NORDIC AND EUROPEAN, NOT ALASKA", "the binder slides off", ""),
 (27, 10, 9, 0.0, "creak", "a brass scale", "rolls in with Pip as its needle and the binder drops on the left pan", "determined", "THE DOUBTS",
  "a brass two-pan scale rolls in with the left pan labelled THE DOUBTS and the right labelled THE CASE FOR, Pip as the needle engraved WHICH WAY?, and the carried binder drops on the left pan which sinks",
  "the pans sway", "rehook: the scale rolls in"),
 (43, 10, 9, W("ceiling"), "clink", "a gauge plate", "lands on the right pan and the needle moves a third of the way", "hopeful", "CEILING",
  "a small brass plate reading UP TO $75M lands on the right pan and the needle moves a third of the way", "the pan dips", ""),
 (47, 10, 9, W("rule"), "stamp", "locks and a stamp", "a ring of locks then a MUST LAND stamp land on the right pan and the needle reaches level", "hopeful", "CONDITIONS · LANDING RULE",
  "a ring of small locks and then a MUST LAND stamp land on the right pan and the needle reaches level, a plate reads CONDITIONS, LANDING RULE", "the scale levels", ""),
 (28, 10, 9, W("cables"), "clink", "the 1999 tag", "lands last and nudges the needle just past level", "hopeful", "A DOCUMENTED NEED",
  "the barnacled 1999 tag lands last on the right pan and nudges the needle just past level, a plate reads A DOCUMENTED NEED", "the tag glints", ""),
 (29, 11, 10, 0.0, "whoosh", "Pip", "rolls west off the beam and the camera pulls up to the chart where the glass wall rings", "puzzled", "THE GLASS TO THE WEST",
  "Pip rolls off the beam toward the glass wall and the camera pulls up to the North Pacific chart where the glass rings", "the glass rings", "rehook: the wall returns"),
 (30, 11, 10, W("third"), "pop", "a dotted line", "slides through the glass toward an ASIA strip and a dotted line follows", "reading", "3 · ASIA · \"EXPLORE AND COLLABORATE\"",
  "a faint graphite dotted line draws itself through the glass to a strip of land labelled ASIA, a plate reads 3 ASIA, EXPLORE AND COLLABORATE", "the dots crawl", ""),
 (31, 12, 11, 0.0, "click", "two keyholes", "slide in at the stub of the pencil line and light up", "reading", "FINANCE PLAN · BINDING CUSTOMER COMMITMENTS",
  "two keyholes light up at the stub of the pencil line, one reading FINANCE PLAN and one reading BINDING CUSTOMERS, Pip's band reads WHO SIGNS?", "the keyholes glow", ""),
 (32, 12, 11, W("binding", 2), "flutter", "a postcard", "stamped INTEREST jiggles in the second keyhole and slides off", "wry", "BINDING · NOT JUST INTEREST",
  "a postcard stamped INTEREST jiggles in the second keyhole and slides off, a plate reads BINDING, NOT JUST INTEREST", "the postcard flutters", ""),
 (33, 12, 11, W("December"), "bell", "the chronometer", "opens its lid on the date as the camera pulls back to the whole chart", "determined", "AUTHORITY ENDS DEC 31ST, 2028",
  "the chronometer in the corner opens its lid on DEC 31ST 2028 while the camera pulls back to the whole chart with four inked strands and the unfinished pencil line, a plate reads AUTHORITY ENDS DEC 31ST, 2028", "the chronometer ticks", "rehook: the chronometer opens and the camera pulls back"),
 (34, 13, 12, 0.0, "thunk", "a starting flag", "plants itself on the stub of the pencil line", "thoughtful", "A STARTING GUN · NOT A FINISH LINE",
  "a small flag plants itself on the stub of the pencil line, a plate reads A STARTING GUN, NOT A FINISH LINE", "the flag flutters", ""),
 (45, 13, 12, W("Until"), "ping", "a signature line", "waits blank with a pen hovering over it", "thoughtful", "BINDING CUSTOMER COMMITMENT",
  "a blank signature line labelled BINDING CUSTOMER COMMITMENT waits with a pen hovering over it", "the pen hovers", ""),
 (35, 13, 12, W("traffic"), "whirr", "Pip", "pops out of the phone exactly as in the opening", "curious", "ALASKA'S TRAFFIC LEAVES ON THE SAME CABLES",
  "the token pops out of the phone on the desk exactly as in the opening, a plate reads ALASKA'S TRAFFIC LEAVES ON THE SAME CABLES", "the phone glows", ""),
 (36, 13, 12, W("cables"), "splash", "Pip", "dives onto the same hatted 1999 strands", "curious", "THE SAME CABLES",
  "the token dives onto the same two hatted 1999 strands with the pencil line still unfinished behind it", "the pulse streams", ""),
 (48, 5, 4, W("board"), "tap", "the pencil", "rises off the chart and hovers over the Alaska coast", "reading", "THE BOARD VOTED",
  "the graphite pencil rises off the chart and hovers over the Alaska coast as the gavel's echo ring spreads", "the ring spreads", ""),
]

S = [
 (1, 0, "wide-establish", "wide", "high", "chart-desk", "top-down-map", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "", "",
  "The send", "A brass question token pops out of a phone on a chart desk, arcs into a cut-away sea and rides a glowing cable."),
 (2, 1, "map-territory", "extreme-wide", "high", "north-pacific-chart", "top-down-map", "map-territory", "push-in-only", "landscape-as-subject", "map-travel", "travel",
  "Four cables", "A chart of the North Pacific where four cream strands draw on from Alaska to the Oregon and Washington coast and the token bonks a glass wall to the west."),
 (3, 2, "push-detail", "medium", "ground", "seabed-cutaway", "eye-level-immersive", "stacked-layers", "vertical-descent", "structure-as-subject", "match-cut", "match",
  "Nineteen ninety nine", "Two strands on the seabed wear party hats, an AIDEA card lands and a cake with one candle reads about 25 years."),
 (4, 3, "two-up", "medium", "eye", "cul-de-sac-diorama", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "whip-pan", "travel",
  "The cul-de-sac", "A graphite street sign reads A DIGITAL CUL-DE-SAC and the token loops the bulb and rolls west into the glass wall."),
 (5, 4, "alt-vantage", "close", "low", "chart-table", "macro-closeup", "single-object-void", "vertical-descent", "data-as-subject", "hard-cut", "match",
  "The vote", "A gavel drops and a graphite pencil starts a line out from Alaska lettered NORTHSTAR FIBER DEVELOPMENT LLC with a bracket reading owned by AIDEA."),
 (6, 5, "data-panel", "insert", "ground", "sea-gauge", "eye-level-immersive", "stacked-layers", "push-in-only", "structure-as-subject", "carried-element", "carry",
  "The ceiling", "A brass tide gauge rises out of the sea cut-away with the water at zero under a painted ceiling line, and Pip bonks it softly."),
 (7, 6, "subject-portrait", "medium", "high", "paper-list", "top-down-map", "grid-modular", "scroll-data", "data-as-subject", "whip-pan", "travel",
  "What the list says", "A paper list unrolls with three ruled lines, a stamp pins a passing cable to the shore and three pencil cards erase the route."),
 (8, 7, "wide-establish", "wide", "low", "chart-desk-docs", "macro-closeup", "centered-hero-lowerthird", "horizontal-traverse", "multiplicity-swarm", "match-cut", "match",
  "The case against us", "A magnifier sweeps two documents on the chart desk and finds AI only inside the word AIDEA while three ghost words fall through the paper."),
 (9, 8, "two-up", "close", "high", "chart-table-top", "top-down-map", "fullbleed-split", "push-in-only", "data-as-subject", "hard-cut", "match",
  "Borrowed numbers", "A binder with Nordic flags is laid over an Alaska outline on a top-down chart table and its coastline does not fit."),
 (10, 9, "alt-vantage", "medium", "ground", "stage-scale", "eye-level-immersive", "stacked-layers", "vertical-descent", "structure-as-subject", "carried-element", "carry",
  "The fair case", "A labelled brass scale takes the carried binder on the doubts pan and then the gauge plate, locks, landing stamp and 1999 tag on the case for pan until it levels."),
 (11, 10, "map-territory", "wide", "high", "north-pacific-chart-2", "top-down-map", "map-territory", "horizontal-traverse", "landscape-as-subject", "map-travel", "travel",
  "Asia is third", "The token rolls west to the glass wall and a graphite dotted line draws itself through it to an ASIA strip."),
 (12, 11, "macro-closeup", "insert", "eye", "pencil-stub", "macro-closeup", "single-object-void", "vertical-descent", "data-as-subject", "carried-element", "carry",
  "Two locks", "Two keyholes at the stub of the pencil line, a postcard that slides off and a chronometer that opens on December 31st 2028."),
 (13, 12, "wide-establish", "wide", "low", "chart-desk", "top-down-map", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "match-cut", "match",
  "The button", "A flag on the pencil stub, a blank signature line, and the token popping out of the phone again onto the same hatted 1999 strands."),
]

AMBIENT = {1: "the phone glows, paper edges lift, a pulse travels the cable", 2: "the pulse travels the strands, pins pulse, pencil shavings drift", 3: "caustic ripples cross the seabed, silt drifts, the hats wobble",
           4: "the sign sways, road dust drifts, the glass glints", 5: "the gavel's echo ring spreads, pencil shavings fall, dust in a shaft", 6: "the gauge glints, water ripples at zero, the chronometer ticks",
           7: "the list sways, the pencil taps, a cable twitches", 8: "the lens glints, the documents settle, pencil rings draw", 9: "flags flutter, the binder swings, the pencil outline dashes crawl",
           10: "the chains creak, the pans sway, the needle trembles", 11: "the glass rings, the dots crawl, ruler shadow drifts", 12: "the keyholes glow, the postcard flutters, the chronometer ticks",
           13: "the phone glows, the flag flutters, the pulse streams"}
CENTER = {1: "Pip at x540 y1000", 2: "the chart at x540 y1040", 3: "the hatted strands at x540 y1050", 4: "the sign and the bulb at x540 y1250", 5: "the pencil tip at x610 y1250", 6: "the gauge at x400 y1000",
          7: "the list at x540 y1000", 8: "the lens at x560 y1040", 9: "the Alaska outline at x440 y1010", 10: "the needle at x540 y880", 11: "the glass wall at x100 y1150", 12: "the pencil stub at x610 y1250", 13: "the phone at x250 y1090"}
HERO = {
 1: ("Pip + phone + cut-away sea + cable", "35% Pip, 25% phone, 25% sea window, 15% cable"),
 2: ("chart + four strands + pins + Pip", "40% strands, 25% chart, 20% pins, 15% Pip"),
 3: ("two hatted strands + cake + AIDEA card", "40% strands, 25% hats, 20% cake, 15% Pip"),
 4: ("graphite street sign + bulb road + Pip + glass", "35% sign, 30% Pip, 20% road, 15% glass"),
 5: ("gavel + graphite pencil line + lettered nameplate", "35% pencil line, 30% gavel, 20% nameplate, 15% Pip"),
 6: ("tide gauge + Pip + chronometer + sea window", "45% gauge, 25% Pip, 15% chronometer, 15% sea"),
 7: ("paper list + stamp + cable + pencil cards", "40% list, 25% cards, 20% cable, 15% Pip"),
 8: ("two documents + magnifier + ghost words + Pip", "40% documents, 25% magnifier, 20% ghost words, 15% Pip"),
 9: ("binder + Alaska outline", "50% binder, 35% outline, 15% Pip"),
 10: ("labelled scale + binder + gauge plate + locks + landing stamp + 1999 tag + Pip", "45% scale, 25% weights, 15% Pip, 15% labels"),
 11: ("chart + glass wall + dotted line + ASIA strip + Pip", "35% chart, 25% glass, 25% dotted line, 15% Pip"),
 12: ("pencil stub + two keyholes + postcard + chronometer", "35% keyholes, 25% stub, 20% chronometer, 20% postcard"),
 13: ("phone + flag on pencil stub + signature line + Pip + hatted strands", "30% phone, 25% Pip, 20% flag and line, 25% strands"),
}
PARTS = {1: 40, 2: 52, 3: 48, 4: 40, 5: 46, 6: 44, 7: 50, 8: 46, 9: 36, 10: 60, 11: 44, 12: 42, 13: 50}
KICKS = (6, 40, 33)
STAGE3D = {k: "planes" for k in HERO}
CAMERA = {1: "craneDown+dollyThrough", 2: "craneDown", 3: "dollyThrough", 4: "truckAcross", 5: "craneDown", 6: "dollyThrough", 7: "truckAcross", 8: "riseWith",
          9: "dollyThrough", 10: "truckAcross", 11: "craneDown", 12: "dollyThrough", 13: "riseWith"}


def est_starts():
    t, out = 0.0, {}
    for i, s in enumerate(LINES):
        out[i] = t
        t += len(s.split()) * 0.4 + 0.6 * len(re.findall(r"[.?!]", s)) + 0.15
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

    palette = "cream chart paper, graphite pencil and a cobalt sea cutaway with a brass question token and vermilion on the locks and clock"
    board = {
        "run_date": "2026-10-31", "slug": "a-ceiling-is-not-a-cable", "title": "A Ceiling Is Not a Cable",
        "concept": ("On October 21st the board of AIDEA, Alaska's state development authority, voted for a new wholly owned company, Northstar Fiber Development LLC, that can put up to $75 million into subsea and land fiber. "
                    "Alaska reaches the Lower 48 on four undersea cables (three land in Oregon, one in Washington) and one land route, two of the cables from 1999 against a typical design life of about 25 years per AIDEA, and no cable connects Alaska directly to Asia. "
                    "The resolution lists a link to the Pacific coast first, Asia third as explore and collaborate, requires capacity to land in Alaska, picks no project, partner or route, requires a finance plan and binding customer commitments before any binding commitment, and ends the authority on December 31st, 2028. "
                    "Neither AIDEA document says AI, data center or compute, so the AI link is Alaska.Ai's own framing, and the economic studies the resolution cites are Nordic and European. "
                    "Pip, a faced brass question token, travels in every shot. The film grants the guardrails and the documented need, narrows the claim to a starting gun and ends where it began."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "top-down-map", "motion_vector": "horizontal-traverse", "hero_treatment": "single-organic-hero", "layout": "map-territory",
                        "register": "chart-room-paper", "palette": palette, "camera_strategy": "pullback-reveal",
                        "light_story": "midday chart-room window key drifting to a late warm rake",
                        "metaphor": "a brass question token travelling a cable, a two-pan scale that sinks and re-levels, a dashed port with two locks and a clock"},
        "palette": palette,
        "divergence_note": ("The last five films were an aubergine dusk depot (10-29), a green-black sonar abyss (10-28), a sage civic hall (10-26), a teal fog boardwalk (10-25) and a navy orbit (10-24). "
                            "This film is daylight on cream chart paper with graphite pencil lines and a cobalt sea shown only as a cutaway. Its hero is a faced brass question token, its stage is a chart desk and a brass scale, "
                            "and it has no night sky, no hall, no depot, no boardwalk and no orbit. The look is a map being drawn, the throughline is a graphite pencil line that never reaches its end, and the signature object is a labelled scale that walks to level one weight at a time."),
        "treatment": json.loads((OUT / "treatment.json").read_text()) if (OUT / "treatment.json").exists() else {},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A brass question token with eyes pops out of a phone on a cream chart desk and tumbles across the paper while a chip names the framing.",
                 "headline": "WHERE DOES THE QUESTION GO", "motion_by_s": 0.3,
                 "loopback": "Pip pops out of the phone on the chart desk exactly as in the opening and dives onto the same hatted 1999 strands."},
        "open_loop": {"plant_t": b_at(6), "pay_t": b_at(30), "what": "Why does the question bonk a glass wall to the west? Planted when Pip rolls west across the empty Pacific, paid when a dotted graphite line draws itself through the glass to an ASIA strip, third on the list as explore and collaborate."},
        "open_loop_2": {"plant_t": b_at(18), "pay_t": b_at(33), "what": "What is the one date? Planted when a closed brass chronometer with a vermilion tab sets itself on the chart edge, paid when its lid opens on December 31st, 2028."},
        "throughline": {"object": "Pip, the brass question token", "lands_in_button": "Pip pops out of the phone again and dives onto the same hatted 1999 strands, engraved with a question mark as in the opening",
                        "states": [
                            {"at_s": b_at(1), "state": "engraved ? and bright brass, popping out of the phone"},
                            {"at_s": b_at(12), "state": "engraved VIA LOWER 48 after the cul-de-sac lap"},
                            {"at_s": b_at(17), "state": "engraved UP TO $75M after bonking the painted ceiling line on the tide gauge"},
                            {"at_s": b_at(27), "state": "the needle of the scale, engraved WHICH WAY?"},
                            {"at_s": b_at(31), "state": "beside the two keyholes, engraved WHO SIGNS?"},
                            {"at_s": b_at(35), "state": "engraved ? again, popping out of the phone onto the same 1999 strands"}]},
        "reveals": [
            {"t": b_at(4), "type": "scale-pullback", "what": "the camera pulls back from one cable to the whole North Pacific chart with four strands", "hold_s": 0.8},
            {"t": b_at(17), "type": "scale-pullback", "what": "Pip at the painted ceiling line of the gauge to the whole gauge with the water still at zero", "hold_s": 0.8},
            {"t": b_at(29), "type": "scale-pullback", "what": "from the scale beam up to the whole North Pacific chart where the glass wall rings", "hold_s": 0.8},
            {"t": b_at(33), "type": "scale-pullback", "what": "from the opening chronometer out to the whole chart with four inked strands and the unfinished pencil line", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 0, "offset": 3.0, "level": 1.0}, {"line": 1, "offset": 0.0, "level": 0.2},
            {"line": 2, "offset": 0.0, "level": 0.95}, {"line": 3, "offset": 0.0, "level": 0.15}, {"line": 4, "offset": 0.0, "level": 0.9},
            {"line": 5, "offset": 0.0, "level": 0.16}, {"line": 6, "offset": 0.0, "level": 0.95}, {"line": 7, "offset": 0.0, "level": 0.14},
            {"line": 8, "offset": 0.0, "level": 1.0}, {"line": 9, "offset": 0.0, "level": 0.14}, {"line": 10, "offset": 0.0, "level": 1.05},
            {"line": 11, "offset": 0.0, "level": 0.16},
            {"at_s": round(b_at(33) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(33) + 0.8, 3), "level": 0.6},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(33) - 0.3, 3), "riser_at": round(b_at(34), 3), "silence_at": round(b_at(33) - 0.3, 3),
                      "payoff_at": b_at(33), "button_pattern": "callback", "interrupt_at": b_at(22), "extra_dips": [b_at(27)]},
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
    book.raise_if_missing("board_1031 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1031Ids.ts").write_text(
        "// GENERATED by scripts/board_1031.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
