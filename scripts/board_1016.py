#!/usr/bin/env python3
"""2026-10-16 "The Forecast That Shows Its Work": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1016.py gen       # write out/dispatch/storyboard.json (times estimated until the voice exists)
    python3 scripts/board_1016.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

Beats anchor to (vo_line, a spoken word or a fraction of the line), so the film re-times itself with the voice.
Mirrors board_1011.py's contract (idempotent, never edits the narration, only binds picture and sound to it).
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
 (1, 1, 0, 0.0, "rumble", "SeismicStation", "shudders as its horn whips and the pen lashes a hard zigzag across the paper drum", "alarmed", "3:07 A.M.",
  "the SeismicStation on black muskeg shudders as its horn whips round and the pen lashes a hard zigzag across the drum under one tungsten lamp, a 3:07 pip flaring red",
  "the lamp swings and snow dust jumps off the ground", ""),
 (2, 1, 0, W("magnitude"), "thump", "magnitude chip", "slams onto the frame", "firm", "M5.6 · 43 KM NNW OF LAKE MINCHUMINA · OCT 15TH",
  "a chalk chip M5.6 slams onto the frame beside the station with its place line under it",
  "the horn settles toward listening and the zigzag trace keeps drawing", ""),
 (3, 1, 0, W("hits"), "whoosh", "blank slip", "starts to curl out of the station's flank", "curious", "A SLIP",
  "a blank warm thermal slip starts to curl out of a slot in the station's flank and the camera trucks along it",
  "the slip's free end sways and the lamp glints on the paper", ""),
 (4, 1, 0, W("hundred"), "swoosh", "report slips", "flutter onto a cork wall one by one", "busy", "103 FELT REPORTS · USGS",
  "the truck along the slip arrives at a cork wall where small report slips flutter on and pin home one by one",
  "the pinned slips tremble and settle", ""),
 (5, 1, 0, W("reports"), "thock", "count chip", "stamps the final count on the wall", "firm", "103 FELT REPORTS · USGS",
  "a count chip stamps 103 on the cork wall, the slips below it a dense grid",
  "the grid of slips shivers a pixel", ""),
 (6, 2, 1, 0.0, "hush", "dark clock", "fills the frame with no hands and the blank slip hangs beside it", "uneasy", "WHEN?",
  "a dark round clock face with no hands fills the frame and the blank slip hangs beside it, the lamp pool breathing",
  "the slip's end turns slowly and the clock face glints", ""),
 (7, 2, 1, W("When's"), "tick", "question mark", "rises on the clock face and the hands refuse to appear", "uneasy", "THE NEXT ONE",
  "a single question mark rises on the dark clock face and the hands start to draw and fade out",
  "the clock glass shivers", ""),
 (8, 3, 2, 0.0, "slide", "slip", "slides onto a desk under a lamp as a stamp hovers", "calm", "U S GEOLOGICAL SURVEY",
  "the slip slides onto a desk under a lamp already wrapped on its last line in masking tape marked READ LAST, and a rubber stamp reading U S GEOLOGICAL SURVEY hovers over it",
  "the lamp sways and the paper curls at the edge", ""),
 (9, 3, 2, W("odds"), "click", "slip first line", "prints ODDS with a stepper stutter", "firm", "ODDS, NOT A TIME",
  "the slip's first line prints ODDS with a stepper stutter and a second line stays blank where WHEN would go",
  "the print head stutters and the paper creeps", ""),
 (10, 3, 2, W("twelve"), "alarm", "wall clock", "whips a half day with overshoot as a stamp lands", "brisk", "FORECAST ISSUED 12 HOURS LATER",
  "the wall clock hands whip a full half day with overshoot and a stamp lands on the slip, 12 HOURS LATER",
  "the clock pendulum swings and the stamp bounces", "rehook: the odds arrive twelve hours late"),
 (11, 3, 2, W("shaking"), "creak", "forecast chip", "stamps beside the slip as the taped end lifts in the draft", "wary", "M5+ OUTSIDE THE LOWER 48 · FORECAST POSTED",
  "a chip stamps beside the slip, M5 PLUS OUTSIDE THE LOWER 48, FORECAST POSTED, while the taped end of the slip lifts in the draft",
  "the tape end lifts in the draft", ""),
 (12, 4, 3, 0.0, "thunk", "odds board", "rises as a ten by ten board of dark enamel tiles in a brass frame", "expectant", "A WEEK OUT · M3+",
  "a ten by ten board of one hundred dark enamel tiles rises in a brass frame under a boxed M3 PLUS A WEEK OUT label",
  "the tiles glint one by one and the frame hums", ""),
 (13, 4, 3, W("forty"), "clack", "forty tiles", "flip lit in a serpentine ripple", "rising", "ABOUT 40 IN 100",
  "forty tiles flip chartreuse in a serpentine ripple with a clack each, the board's count ticking to 40",
  "the lit tiles pulse and the dark ones sway", "rehook: forty in a hundred is a lot"),
 (14, 4, 3, W("seven"), "tick", "tiles", "fall dark until seven stay lit", "easing", "M4+ · ABOUT 7 IN 100",
  "the forty fall dark until seven stay lit",
  "the seven glow and the board settles", ""),
 (15, 4, 3, W("Five"), "blip", "single tile", "lights only three quarters of the way, never full", "calm", "M5+ · UNDER 1 IN 100",
  "one tile fills with light only three quarters of the way and never goes full",
  "the sliver tile pulses once", ""),
 (16, 4, 3, W("Six"), "swoosh", "bin", "the camera pulls back and up to a glass bin of a thousand grains with one grain glowing smaller than its neighbours", "relieved", "M6+ · UNDER 1 IN 1,000",
  "the camera pulls back and up and the board is one layer of ten in a glass bin of a thousand grains with one grain glowing a little smaller than its neighbours",
  "the grains shimmer and the lit speck breathes", "rehook: the bin pullback"),
 (17, 4, 3, W("thousand"), "chime", "drawers", "slide out nested, a day inside a week inside a year", "plain", "ONE DAY 23 IN 100 · ONE YEAR 58 IN 100 · M3+",
  "three nested drawers slide out of the bin's front, each containing the one before, labelled ONE DAY 23 IN 100 and ONE YEAR 58 IN 100",
  "the drawer handles swing and the lit tiles inside glint", ""),
 (18, 5, 4, 0.0, "fold", "dial panel", "powers on with four brass dials a b c and p under a Reasenberg and Jones plate", "focused", "REASENBERG AND JONES · 1989 · FOUR DIALS: a b c p",
  "a brass dial panel powers on with four dials a, b, c and p under a Reasenberg and Jones 1989 plate",
  "the dial needles settle and the panel lamp breathes", ""),
 (19, 5, 4, W("past"), "slide", "ledger sheets", "feed into the panel and the dials settle", "focused", "PAST SEQUENCES",
  "ledger sheets of past sequences feed into the panel's slot one after another and the dials seat",
  "the sheets ripple as they feed", ""),
 (20, 5, 4, W("bends"), "tick", "fresh sheet", "slides in and the dials re-seat by a hair", "alert", "BENDS TOWARD THIS ONE",
  "one fresh sheet slides in last and the dials re-seat by a hair with p wobbling",
  "dial p wobbles and settles", ""),
 (21, 6, 5, 0.0, "swoosh", "bracket", "opens over a row of six slots", "curious", "A RANGE, NOT A NUMBER",
  "a dashed bone bracket opens over a row of six empty slots while a corner of the slip shows its blank clock box",
  "the bracket's dashes crawl and the slots glint", "rehook: a range, not a number"),
 (22, 6, 5, W("Zero"), "click", "slots", "label 0 to 5 as the bracket snaps wide", "firm", "0 TO 5 AFTERSHOCKS THIS WEEK",
  "the six slots label themselves 0 to 5 as the bracket snaps wide",
  "the slots flicker once each", ""),
 (23, 6, 5, W("counted"), "thock", "chalk token", "drops into slot 1 and the clicker reads 1", "firm", "COUNTED SO FAR · 1 AFTERSHOCK M3+",
  "a chalk token drops into slot 1 with a bounce and a brass clicker reads 1",
  "the token rocks and settles", ""),
 (24, 7, 6, 0.0, "bell", "slip", "tilts into frame with a question mark over its odds line", "doubtful", "WORTH TRUSTING?",
  "the slip tilts into frame with a question mark stamped over its odds line",
  "the slip rocks and the question mark pulses", ""),
 (25, 7, 6, W("quake"), "thud", "marble", "drops down a pegboard and lands in a slot beside a board of forty lit tiles", "tense", "ONE QUAKE",
  "one marble drops down a pegboard and lands in one slot beside a small board of forty lit tiles",
  "the pegs ring and the marble bounces", ""),
 (26, 7, 6, W("wrong"), "snap", "split panels", "two panels meet at a hard seam and both boards still read forty", "firm", "FORTY IN A HUNDRED · NOT WRONG EITHER WAY",
  "two panels meet at a hard seam, one where another quake arrives and one where none does, and both boards still read FORTY IN A HUNDRED",
  "the seam lamp flickers and both boards glow", ""),
 (27, 7, 6, W("week"), "flip", "calendar", "flips to the week's end as a long stack of small boards fans out", "patient", "A LONG RUN OF FORECASTS",
  "a calendar leaf flips to the week's end and a long stack of small boards fans out behind it",
  "the leaf curls and the fan shivers", ""),
 (28, 8, 8, 0.0, "creak", "tape", "trembles on the slip's last line in macro", "uneasy", "READ LAST",
  "macro on the slip's taped last line, the tape trembling and its rust corner just visible",
  "the tape end quivers and the paper grain drifts", ""),
 (29, 8, 8, W("poorly"), "crack", "tape", "peels about a pivot and the rust line prints in alarm red", "grim", "MAY PERFORM POORLY WHEN BIG AFTERSHOCKS TRIGGER MORE · PER USGS",
  "the tape peels about a pivot and the line beneath prints in alarm red, MAY PERFORM POORLY WHEN BIG AFTERSHOCKS TRIGGER MORE, PER USGS",
  "the peeled tape curls away and the red line glows", "rehook: the page confesses first"),
 (30, 8, 8, W("own", 2), "boom", "big tile", "lands and kicks its own row of tiles like dominoes", "alarmed", "AFTERSHOCKS SET OFF THEIR OWN",
  "a big tile lands and kicks its own row of tiles like dominoes while the four dials lose sync",
  "the dominoes rattle and the dial needles wobble", ""),
 (31, 9, 7, 0.0, "swell", "map plate", "a small magnitude 7.3 pin ticks on a bone map plate", "tense", "CONTEXT, NOT AN ALASKA CLAIM",
  "a small M7.3 pin pulses on a bone map plate labelled CONTEXT, NOT AN ALASKA CLAIM",
  "the pin pulses and the map grid glides", ""),
 (32, 9, 7, W("2011"), "tap", "date chip", "stamps 2011 JAPAN on the plate", "firm", "2011 JAPAN · M7.3",
  "a date chip stamps 2011 JAPAN M7.3 on the plate",
  "the plate tilts a hair", ""),
 (33, 9, 7, W("two"), "tick", "two ticks", "pass on a day dial", "tense", "TWO DAYS LATER",
  "a day dial ticks twice beside the pin",
  "the dial needle trembles", ""),
 (34, 9, 7, W("nine"), "heavy", "giant disc", "swings in and fills the picture as the first pin shrinks to a speck", "stunned", "2011 JAPAN · M7.3 · TWO DAYS LATER · M9.1",
  "the camera pulls back as a giant M9.1 disc swings in and fills the picture, the first pin a speck in its corner, labelled not to scale",
  "the disc's rim shivers and the map dims", "rehook: the big one came second"),
 (35, 10, 9, 0.0, "thud", "stamp", "lands on the slip, CAN BE CHECKED · NOT YET GRADED", "firm", "CAN BE CHECKED · NOT YET GRADED",
  "back on the muskeg a stamp lands on the slip pinned to the station's flank, CAN BE CHECKED, NOT YET GRADED",
  "the stamp bounces and the slip sways", ""),
 (36, 10, 9, W("next"), "ping", "clock box", "fills with a printed clock face and a NEXT UPDATE tab", "relieved", "NEXT UPDATE TIME PRINTED ON EVERY FORECAST",
  "the slip's blank clock box fills with a printed clock face and a NEXT UPDATE tab swings from it",
  "the tab swings and the station's lamp warms", "rehook: what the box was for"),
 (37, 10, 9, W("isn't"), "hush", "pending stamp", "lands as the station's lamp dims to watching", "patient", "VERDICT PENDING",
  "a PENDING stamp lands under the clock and the station's horn turns to watching with its lamp dim",
  "the horn sweeps a few degrees", ""),
 (38, 11, 10, 0.0, "tick", "four ticks", "stamp down the slip's edge one beat each", "firm", "ODDS · A RANGE · A LIMIT · A NEXT CHECK",
  "four ticks stamp down the slip's edge one beat each beside ODDS, A RANGE, A LIMIT and A NEXT CHECK",
  "the ticks bounce and settle", ""),
 (39, 11, 10, W("forecast"), "pop", "corkboard", "the camera pulls back from the pinned slip to blank slips FLOOD FIRE WEATHER ANY TOOL", "hopeful", "FLOOD · FIRE · WEATHER · ANY TOOL",
  "the camera pulls back from the pinned slip to a corkboard with blank slips labelled FLOOD, FIRE, WEATHER and ANY TOOL",
  "the blank slips curl in the draft", ""),
 (40, 11, 10, W("bar"), "bell", "station lamp", "lights as a blank slip curls out of its flank, the open replaying", "warm", "THE BAR",
  "dawn light grows on the corkboard as the station's lamp lights and a blank slip starts to curl out of its flank, the open replaying",
  "the slip's end curls and the lamp warms", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "subject-portrait", "wide", "ground", "muskeg-night-yard", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "instrument-as-subject", "", "",
  "3:07 on the muskeg", "A seismic station shudders on black muskeg at night and prints a slip that carries the camera to a cork wall of felt reports."),
 (2, 1, "macro-closeup", "insert", "eye", "clock-void", "macro-closeup", "single-object-void", "radial-emanate", "single-organic-hero", "hard-cut", "carry",
  "A clock with no hands", "A dark clock face with no hands and a question mark that rises."),
 (3, 2, "alt-vantage", "medium", "high", "slip-desk", "cross-section-cutaway", "stacked-layers", "horizontal-traverse", "structure-as-subject", "whip-pan", "travel",
  "The odds come out", "A desk under a lamp, a slip that prints ODDS and a wall clock that whips twelve hours."),
 (4, 3, "data-panel", "close", "eye", "odds-board", "instrument-screen", "hud-instrument-frame", "vertical-rise", "data-as-subject", "fui-boot", "build",
  "A hundred tiles, then a bin", "A ten by ten tile board lights forty, seven and a sliver, then the camera pulls back to a thousand grains."),
 (5, 4, "push-detail", "insert", "eye", "dial-panel", "exploded-diagram", "grid-modular", "scroll-data", "instrument-as-subject", "match-cut", "match",
  "Four dials", "A brass dial panel fed by ledger sheets of past aftershock sequences."),
 (6, 5, "two-up", "medium", "low", "range-table", "eye-level-immersive", "fullbleed-split", "pull-back-only", "multiplicity-swarm", "mask-wipe", "build",
  "A range of six", "A dashed bracket over six slots and a token that drops into slot one."),
 (7, 6, "two-up", "wide", "overhead", "pegboard-test", "top-down-map", "grid-modular", "vertical-descent", "data-as-subject", "carried-element", "carry",
  "One draw", "A marble on a pegboard, two panels with the same board, and a long run of small boards."),
 (9, 7, "map-territory", "extreme-wide", "high", "japan-map", "orbital-aerial", "map-territory", "pull-back-only", "landscape-as-subject", "whip-pan", "travel",
  "The big one came second", "A map plate with a small pin that is overtaken by a giant disc."),
 (8, 8, "macro-closeup", "close", "ground", "slip-desk", "macro-closeup", "single-object-void", "push-in-only", "instrument-as-subject", "focus-pull", "carry",
  "The tape comes off", "Macro on the slip's last line as the tape peels and a red line prints."),
 (10, 9, "subject-portrait", "medium", "low", "muskeg-night-yard", "eye-level-immersive", "centered-hero-lowerthird", "radial-emanate", "single-organic-hero", "match-action", "match",
  "Checked, not graded", "The station on the muskeg with the slip pinned to its flank and a clock box that fills."),
 (11, 10, "wide-establish", "wide", "eye", "corkboard-dawn", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "carried-element", "carry",
  "Ask for the slip", "A corkboard at dawn with the pinned slip and blank slips for flood, fire, weather and any tool."),
]

AMBIENT = {
 1: "snow dust drifts across the muskeg, the lamp swings, the paper end sways, the station's horn idles",
 2: "the lamp pool breathes, dust turns, the clock glass glints, the slip hangs and sways",
 3: "the desk lamp breathes, paper edges curl, the wall pendulum swings, the print head stutters",
 4: "the tiles glint, the brass frame hums, a slow vignette drifts, the grains in the bin shimmer",
 5: "the dial lamp breathes, needles tremble, ledger edges flutter, tick marks shimmer",
 6: "the bracket's dashes crawl, the slot lamps flicker, dust motes drift, the token rocks",
 7: "the pegs ring, the seam lamp flickers, the boards glow, the calendar leaf curls",
 8: "paper grain drifts, the tape quivers, the red line glows, dominoes rattle",
 9: "the map grid glides, cloud shadow drifts, the pin pulses, the disc rim shivers",
 10: "snow dust drifts, the slip sways, the station's lamp warms, the clock tab swings",
 11: "dawn light grows, the blank slips curl, dust drifts, the station's lamp breathes",
}
CENTER = {1: "the station at x540 y1150", 2: "the clock at x540 y1000", 3: "the slip at x540 y1000", 4: "the board at x540 y1000", 5: "the dial panel at x540 y1000", 6: "the bracket at x540 y1000",
          7: "the pegboard at x540 y1000", 8: "the tape at x540 y960", 9: "the map plate at x540 y980", 10: "the station at x540 y1150", 11: "the corkboard at x540 y1000"}
HERO = {
 1: ("SeismicStation + Slip + cork wall", "50% station and slip, 30% muskeg and sky, 20% cork wall"),
 2: ("DarkClock + Slip", "60% clock, 25% slip, 15% void"),
 3: ("Slip + desk + wall clock", "45% slip, 30% clock, 25% desk and lamp"),
 4: ("OddsBoard + GrainBin", "65% board, 20% frame, 15% bin and drawers"),
 5: ("DialPanel + ledger sheets", "55% panel, 30% sheets, 15% plate"),
 6: ("RangeCarton + bracket", "50% slots, 30% bracket and token, 20% table"),
 7: ("Pegboard + two boards + calendar", "40% pegboard, 40% boards, 20% calendar"),
 8: ("Slip tape + red line + dominoes", "50% slip and tape, 30% dominoes, 20% dials"),
 9: ("MapPlate + pins + giant disc", "40% plate, 40% disc, 20% pins"),
 10: ("SeismicStation + Slip", "45% station, 30% slip and clock box, 25% muskeg"),
 11: ("Corkboard + slips + SeismicStation", "55% board, 25% slips, 20% station and dawn"),
}
PARTS = {1: 52, 2: 24, 3: 40, 4: 120, 5: 46, 6: 30, 7: 64, 8: 36, 9: 30, 10: 44, 11: 48}
STAGE3D = {k: "planes" for k in range(1, 12)}
STAGE3D[2] = "flat:a locked dark clock face where the question mark is the motion"
STAGE3D[4] = "flat:a locked tile board where the lit count is the motion and the pullback is the camera"
STAGE3D[5] = "flat:a locked dial panel where the dials seating is the motion"
STAGE3D[7] = "flat:a locked top-down pegboard where the marble drop is the motion"
CAMERA = {1: "dollyThrough", 2: "static:the question mark rising on the clock is the whole shot", 3: "craneDown", 4: "riseWith", 5: "static:the dials seating is the whole shot", 6: "truckAcross",
          7: "static:the marble drop and the split are the shot", 8: "dollyThrough", 9: "craneDown+truckAcross", 10: "orbitReveal", 11: "dollyThrough"}


# ---- the L3 split (2026-10-16): the ladder line ran 18.8 s as one shot, over the 16 s ceiling, so the script line is now two
# (L3 forty and seven, L4 five and six) and the bin pullback is its own shot. Old numbering below stays as authored.
def _remap():
    global B, S
    nb = []
    for row in B:
        row = list(row)
        key, line = row[0], row[2]
        if key in (15, 16, 17):
            row[2] = 4
        elif line >= 4:
            row[2] = line + 1
        nb.append(tuple(row))
    ns = []
    for row in S:
        row = list(row)
        if row[0] >= 5:
            row[1] = row[1] + 1
        ns.append(tuple(row))
    new = (12, 4, "map-territory", "extreme-wide", "high", "grain-bin", "orbital-aerial", "stacked-layers", "pull-back-only", "multiplicity-swarm", "match-cut", "match",
           "A bin of a thousand", "The board pulls back and up to a glass bin of a thousand grains with one grain lit and three nested drawers.")
    i = next(k for k, r in enumerate(ns) if r[0] == 4)
    ns.insert(i + 1, new)
    for k, r in enumerate(nb):
        line = r[2]
        sh = max(j for j, srow in enumerate(ns, 1) if srow[1] <= line)
        r = list(r); r[1] = sh; nb[k] = tuple(r)
    B, S = nb, ns


AMBIENT[12] = "the grains shimmer, the lit speck breathes, the glass glints, the drawer handles swing"
CENTER[12] = "the bin at x540 y930"
HERO[12] = ("GrainBin + OddsBoard", "55% bin, 30% board on top, 15% drawers")
PARTS[12] = 110
STAGE3D[12] = "planes"
CAMERA[12] = "craneDown"
HERO[4] = ("OddsBoard", "70% board, 20% frame and label, 10% room")
PARTS[4] = 70
_remap()


def est_starts():
    t, out = 0.0, {}
    for i, s in enumerate(LINES):
        out[i] = t
        t += len(s.split()) * 0.4345 + 0.6974 * len(re.findall(r"[.?!]", s)) + 0.15
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


def build():
    starts, real = line_starts()
    end = starts["end"]
    words = load_words() if real else {}

    # Word anchors resolve through board_anchor: on conform (real voice) a word the read no longer
    # says is an orphan and main() refuses to write the board (machine pass 2026-10-15).
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
        assert sh == shot, (bid, sh, shot)
        a = round(at(line, anc), 3)
        beats.append({
            "id": bid, "shot": sh, "at_s": a, "vo_line": line,
            "anchor": {"vo_line": line, "fraction": anc if not isinstance(anc, tuple) else 0.0, "offset": round(a - starts[line], 3)},
            "offset": round(a - starts[line], 3), "vo": LINES[line], "phrase": " ".join(LINES[line].split()[:4]),
            "shows": shows, "sfx": sfx, "means": ann.lower(), "rehook": rehook,
            "draw": {"subject": subj, "action": act, "emotion": emo, "annotation": ann},
            "choreo": {"primary": shows, "reaction": reaction, "ambient": AMBIENT[sh]},
        })
    beats.sort(key=lambda b: (b["at_s"], b["id"]))
    # keep ONE declared rehook per drift window, the first candidate in it
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

    palette = "black-spruce night, tungsten lamp, chalk paper, brass, alarm red once per frame, snow-blue dawn"
    board = {
        "run_date": "2026-10-16", "slug": "the-forecast-that-shows-its-work", "title": "The Forecast That Shows Its Work",
        "concept": ("USGS posted odds for aftershocks twelve hours after the October 15th M5.6 near Lake Minchumina. The film makes the odds physical (a hundred tiles, a bin of a thousand grains), "
                    "shows that the forecast gives a range, a count, its own weak spot and the time of its next update, lets the strongest fair objection stand (one quake can't grade a probability), "
                    "and ends on what any forecast, human or machine, should show. A thermal slip printed by a seismic station is the throughline and the verdict stays pending."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "push-in-only", "hero_treatment": "instrument-as-subject", "layout": "centered-hero-lowerthird",
                        "register": "naturalistic-scene", "palette": palette, "camera_strategy": "dolly-through", "light_story": "3 a.m. tungsten night warming to snow-blue dawn as the slip fills",
                        "metaphor": "a receipt printed by the ground itself"},
        "palette": palette,
        "divergence_note": ("10-15 was pearl fog daylight with a cranberry Gate and 10-11 first-light rose tundra with a medicine crate. This film opens in a black-spruce night under one tungsten lamp "
                            "on a round brass instrument with a face, moves through a clock void, a desk, a tile board, a dial panel, a pegboard and a map, and ends at a corkboard at dawn. "
                            "The hero is an instrument that listens, the throughline is a paper receipt, and the palette is night teal, tungsten and chalk with no cranberry or pearl."),
        "treatment": {"winner": "The Dramatist's 3 a.m. frame and Slip, with the Explainer's hundred-tile board and bin, the Comedian's tape peel and the Enthusiast's ask-for-the-slip corkboard.",
                      "why": "The Dramatist's night and its tape-peel loop carry the honest turn, the Explainer's tile counts make the odds felt, and the Enthusiast's button turns the point into something a viewer can ask for."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A brass seismic station on black muskeg shudders at 3:07 under one tungsten lamp, its pen lashing a zigzag.",
                 "headline": "THE FORECAST THAT SHOWS ITS WORK", "motion_by_s": 0.4,
                 "loopback": "The last frame is the station with a blank slip starting to curl out of its flank, the open replaying."},
        "open_loop": {"plant_t": b_at(8), "pay_t": b_at(30), "what": "What is under the tape marked READ LAST. Paid as the forecast's own printed weak spot."},
        "open_loop_2": {"plant_t": b_at(21), "pay_t": b_at(36), "what": "What the blank clock box on the slip is for. Paid as the time of the next update."},
        "throughline": {"object": "the thermal Slip", "lands_in_button": "the slip pinned on a corkboard beside blank slips for flood, fire, weather and any tool",
                        "states": [
                            {"at_s": b_at(3), "state": "blank warm slip curling out of the station"},
                            {"at_s": b_at(9), "state": "ODDS printed, last line taped READ LAST, clock box blank"},
                            {"at_s": b_at(23), "state": "range bracket 0 to 5 and a count of 1 stamped"},
                            {"at_s": b_at(29), "state": "tape peeled, the rust weak spot printed"},
                            {"at_s": b_at(36), "state": "clock box filled, NEXT UPDATE tab"},
                            {"at_s": b_at(39), "state": "pinned on the corkboard beside blank slips"}]},
        "reveals": [
            {"t": b_at(16), "type": "scale-pullback", "what": "the tile board pulls back to a glass bin of a thousand grains with one grain lit", "hold_s": 0.6},
            {"t": b_at(21), "type": "build-on", "what": "a dashed bracket opens over six slots and a token drops in", "hold_s": 0.6},
            {"t": b_at(34), "type": "scale-pullback", "what": "a giant M9.1 disc fills the map and the first pin becomes a speck", "hold_s": 0.7}],
        "tail_s": 1.7, "audio_arc": {"build_steps": 4, "dip_at": round(starts[11] - 0.2, 3), "riser_at": round(starts[11] - 1.0, 3), "silence_at": round(starts[11] + 0.5, 3),
                      "payoff_at": b_at(40), "button_pattern": "question", "interrupt_at": b_at(30), "extra_dips": [b_at(29), b_at(34)]},
        "shots": shots, "beats": beats,
    }
    order = sorted(board["beats"], key=lambda b: (b["at_s"], b["id"]))
    ids = {b["id"]: rank for rank, b in enumerate(order, 1)}
    for b in board["beats"]:
        b["key"] = b["id"]
        b["id"] = ids[b["key"]]
    board["beats"].sort(key=lambda b: b["id"])
    board["_ids"] = ids
    book.raise_if_missing("board_1016 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1016Ids.ts").write_text(
        "// GENERATED by scripts/board_1016.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
