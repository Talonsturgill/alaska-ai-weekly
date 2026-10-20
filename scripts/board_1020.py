#!/usr/bin/env python3
"""2026-10-20 "ADL 234762": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1020.py gen       # write out/dispatch/storyboard.json (times estimated until the voice exists)
    python3 scripts/board_1020.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

Beats anchor to (vo_line, a spoken word or a fraction of the line), so the film re-times itself with the voice.
Mirrors board_1018.py's contract (idempotent, never edits the narration, only binds picture and sound to it).
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
 (1, 1, 0, 0.03, "slam", "Folio", "skids across a walnut desk under a banker's lamp and hits its mark with a squash", "alert", "WHAT DOES THE STATE HAND OVER?",
  "a thin manila folder with two eyes skids across a walnut desk under a banker's lamp and hits its mark with a squash, the tab reading ADL 234762",
  "the folder squashes and blinks", ""),
 (3, 1, 0, W("built"), "tick", "dotted outline", "flickers over the desk and vanishes", "plain", "WHAT GETS BUILT",
  "a dotted magenta pencil outline of a building flickers over the desk and vanishes",
  "the dashes crawl and fade", ""),
 (4, 2, 1, W("Meet"), "pop", "Folio", "hops to the middle of the desk and turns its tab to the camera", "proud", "ADL 234762",
  "the folder hops to the middle of the desk and turns its tab to the camera, ADL 234762",
  "the folder squashes and blinks", "plant: what is in the folder"),
 (44, 2, 1, W("two"), "stamp", "tab plate", "stamps onto the desk beside the folder", "plain", "CASE ADL 234762",
  "a plate stamps onto the desk beside the folder reading CASE ADL 234762",
  "the plate bounces", ""),
 (5, 2, 2, W("proposal"), "whoosh", "plan sheet", "unrolls out of the folder across the desk", "curious", "THE PROPOSAL",
  "a surveyed plan sheet unrolls out of the folder across the desk, a creek, a grid and a hatched parcel",
  "the roll curls and the sheet settles", ""),
 (6, 2, 2, W("Natural"), "ping", "plate", "stamps onto the sheet", "plain", "DNR PROPOSES",
  "a plate stamps onto the sheet reading DNR PROPOSES",
  "the plate bounces", ""),
 (7, 3, 3, W("nineteen"), "thump", "Folio", "swells fat with sheets as the parcel hatch glows", "alert", "ABOUT 19,950 ACRES NEAR HOUSTON",
  "the folder swells fat with sheets while the hatched parcel glows and a pin lands near Houston, ABOUT 19,950 ACRES",
  "the folder squashes and the pin bounces", ""),
 (45, 3, 3, W("Houston"), "pop", "pin", "lands on the hatched parcel near Houston", "alert", "NEAR HOUSTON",
  "a magenta pin lands on the hatched parcel on the plan sheet near Houston",
  "the pin bounces", ""),
 (8, 3, 3, W("industrial"), "stamp", "plate", "stamps onto the sheet", "plain", "AIDEA RECEIVES",
  "a plate stamps onto the sheet reading AIDEA RECEIVES",
  "the plate bounces", ""),
 (9, 4, 4, W("payment"), "slam", "stamp", "comes down on the sheet and leaves NO PAYMENT FOR LAND VALUE", "firm", "NO PAYMENT FOR LAND VALUE",
  "a rubber stamp slams onto the sheet leaving NO PAYMENT FOR LAND VALUE in ink",
  "the ink spatters and the desk jumps", ""),
 (10, 4, 4, W("survey"), "paper", "receipt", "flutters out from under the stamp", "plain", "SURVEY + CLOSING COSTS · AIDEA PAYS",
  "a small torn receipt flutters out from under the stamp reading SURVEY + CLOSING COSTS, AIDEA PAYS",
  "the receipt flutters and settles", ""),
 (11, 4, 4, W("preliminary"), "stamp", "stamp", "lands on the cover and smudges under the stamper's thumb", "plain", "PRELIMINARY ONLY · NO FINAL DECISION",
  "a PRELIMINARY ONLY stamp lands on the folder cover, the wet ink smudging",
  "the ink smudges and the folder blinks", "rehook: preliminary only"),
 (12, 5, 5, W("plan"), "whoosh", "AIDEA plan", "lifts from the sheet as a tab and unfolds", "curious", "AIDEA'S OWN PLAN",
  "a tab on the sheet lifts and unfolds into AIDEA's own plan",
  "the sheet flaps open and settles", ""),
 (13, 5, 5, W("data"), "pop", "dotted data center", "draws itself in dotted pencil on the plan", "curious", "DATA CENTERS · 'POTENTIALLY'",
  "a dotted pencil data center shed draws itself on the plan, a quote tag reading POTENTIALLY",
  "the dashes crawl", ""),
 (14, 5, 5, W("AI"), "hum", "window lights", "blink on in the dotted shed row by row", "plain", "THE BUILDINGS AI RUNS IN",
  "rows of window lights blink on in the dotted shed one by one",
  "the lights flicker row by row", ""),
 (15, 5, 5, W("commitment"), "thunk", "dashed ghost stamp", "fades onto the plan", "plain", "NOT A COMMITMENT",
  "a dashed ghost stamp fades onto the plan reading NOT A COMMITMENT",
  "the dashes crawl", ""),
 (16, 6, 6, W("director"), "whoosh", "letter", "slides in from the right as the folder opens", "attentive", "AIDEA · JULY 30TH LETTER · RANDY RUARO",
  "a letter on a green letterhead slides in from the right reading AIDEA, JULY 30TH LETTER, RANDY RUARO, while the folder swings open to six empty pockets",
  "the letter settles and the cover swings", "rehook: the letter"),
 (17, 6, 6, W("tenant"), "pop", "tabs", "pop out of the folder's edge reading TENANT and SITE PLAN", "attentive", "NO COMMITTED TENANT",
  "two index tabs pop out of the folder's edge reading TENANT and SITE PLAN, each with an empty dotted slot",
  "the tabs wobble", ""),
 (18, 6, 6, W("cooling"), "pop", "tabs", "pop out reading POWER and COOLING", "attentive", "NO POWER SOURCE",
  "two more tabs pop out reading POWER and COOLING with empty dotted slots",
  "the tabs wobble", ""),
 (19, 6, 6, W("schedule"), "thump", "tabs", "pop out reading WATER and SCHEDULE and the pockets pulse magenta", "alert", "NO COMMITTED TENANT · SITE PLAN · POWER SOURCE",
  "the last two tabs pop out reading WATER and SCHEDULE and all six empty pockets pulse magenta",
  "the pockets pulse", ""),
 (20, 7, 7, W("month"), "rattle", "Folio", "gets shaken and rattles, a paperclip dropping out", "worried", "SHAKEN",
  "the folder gets shaken and rattles, one paperclip dropping out of it and bouncing on the desk",
  "the folder rattles and the clip bounces", "plant: so what is the folder for"),
 (21, 7, 7, W("implausible"), "scrub", "eraser", "rubs out the dotted data center", "plain", "AIDEA DIRECTOR · 'IMPLAUSIBLE' · PER ALASKA PUBLIC MEDIA",
  "a pink eraser sweeps and rubs out the dotted data center while a quote plate reads IMPLAUSIBLE, PER ALASKA PUBLIC MEDIA",
  "the eraser crumbs fall and the dashes vanish", ""),
 (22, 7, 8, W("question"), "tick", "Folio", "turns its eyes to the camera over the bare desk", "ask", "NOT THE QUESTION",
  "the folder turns its eyes to the camera over the bare desk where the building was",
  "the folder blinks and the lamp drifts", ""),
 (23, 7, 8, W("empty"), "thump", "tabs", "swing hollow and the magenta slots pulse", "hollow", "THE EMPTY FOLDER",
  "the six tabs swing and the magenta empty slots pulse as the folder looks hollow, THE EMPTY FOLDER",
  "the slots pulse", "rehook: the empty folder"),
 (24, 8, 9, W("Houston's"), "whoosh", "council sign", "pops up from the snow with a porch lamp", "serious", "HOUSTON + MEADOW LAKES COUNCILS · OPPOSE",
  "the view whips to a snowy spruce flat where a hand-lettered sign pops up reading HOUSTON CITY COUNCIL, OPPOSE, with a porch lamp",
  "the sign sways and the lamp flickers", "rehook: the councils"),
 (25, 8, 9, W("Meadow"), "pop", "council sign", "pops up beside the first with its lamp", "serious", "MEADOW LAKES COMMUNITY COUNCIL · OPPOSE",
  "a second sign pops up beside it reading MEADOW LAKES COMMUNITY COUNCIL, OPPOSE, with its lamp",
  "the sign sways and the lamp flickers", ""),
 (26, 8, 9, W("Sentinel"), "ping", "plate", "stamps onto the snow", "plain", "PER MAT-SU SENTINEL",
  "a plate stamps onto the snow reading PER MAT-SU SENTINEL",
  "the plate bounces", ""),
 (46, 9, 10, 0.0, "whoosh", "hearing room", "whips in around the empty witness chair", "serious", "THE HEARING ROOM",
  "the view whips to a spruce-green hearing room around an empty witness chair at a table with a brass nameplate",
  "the pendants sway and the chair creaks", ""),
 (27, 9, 10, W("permission"), "slip", "slip", "slides under the witness chair's table", "plain", "DNR · 'NO PERMISSION TO ATTEND'",
  "a note slips onto the table of the empty witness chair reading NO PERMISSION TO ATTEND, DNR",
  "the note flutters and the chair swivels", ""),
 (28, 9, 11, W("October"), "stamp", "plate", "stamps onto the hearing room wall", "plain", "OCT 14 · SENATE SUBPOENAS DNR COMMISSIONER",
  "a plate stamps onto the hearing room wall reading OCT 14, SENATE SUBPOENAS DNR COMMISSIONER",
  "the plate bounces", ""),
 (29, 9, 11, W("five"), "ding", "vote lamps", "light up green one after another along the rail", "plain", "5 VOTED YES",
  "five green vote lamps light up one after another along the rail, 5 VOTED YES",
  "the lamps flare as each lights", ""),
 (30, 9, 11, W("Crowther"), "stamp", "subpoena stamp", "lands across the folder cover in the foreground", "firm", "CROWTHER · SUBPOENA",
  "a SUBPOENA stamp lands across the folder's cover in the foreground as the CROWTHER nameplate gleams on the empty table",
  "the stamp rings and the folder blinks", ""),
 (31, 10, 12, W("best"), "whoosh", "plate", "slides in over a warm ready-land counter", "attentive", "THE BEST CASE FOR THE TRANSFER",
  "the view wipes to a warm land counter with shelves of parcel files while a plate slides in reading THE BEST CASE FOR THE TRANSFER, the folder listening at the rail",
  "the shelves glow and the folder tilts", "rehook: the best case"),
 (32, 10, 12, W("site"), "hum", "headlights", "sweep across the window and stop at the counter", "attentive", "SITE CONTROL BEFORE A TENANT SIGNS",
  "two headlights sweep across the window and stop outside the counter, a plate reading SITE CONTROL BEFORE A TENANT SIGNS",
  "the beams shimmer", ""),
 (33, 10, 12, W("competes"), "ding", "process lamps", "light green in a row on the rail", "plain", "READY LAND · HOW A STATE COMPETES",
  "three green lamps light in a row on the rail, READY LAND, HOW A STATE COMPETES",
  "the lamps flare as each lights", "rehook: ready land"),
 (47, 10, 13, W("AIDEA"), "clink", "ledger tag", "slides in beside the coin jar", "warm", "AIDEA SAYS",
  "a small ledger tag slides in beside an empty coin tray reading AIDEA SAYS",
  "the tag bobs", ""),
 (34, 10, 13, W("dividends"), "clink", "coin stack", "grows on the counter beside the folder", "warm", "AIDEA SAYS · ~$495M IN DIVIDENDS TO STATE",
  "a brass coin stack grows on the counter beside the folder under a plate reading AIDEA SAYS, ABOUT $495M IN DIVIDENDS TO THE STATE",
  "the coins clink and settle", ""),
 (35, 11, 14, W("statewide"), "whoosh", "coin stack", "slides left along a shelf labelled STATEWIDE away from the folder", "serious", "STATEWIDE · TIED TO NO LAND HERE",
  "the coin stack slides along a shelf labelled STATEWIDE while a string to the folder goes slack, TIED TO NO LAND HERE",
  "the string sags and the coins settle", ""),
 (43, 11, 14, W("land"), "tick", "string", "goes slack between the coins and the folder", "serious", "TIED TO NO LAND HERE",
  "the string between the coin stack and the folder goes slack and sags",
  "the string sags", ""),
 (36, 11, 14, W("guaranteed"), "stamp", "plate", "stamps over the folder's side", "serious", "LETTER · NO RETURN TO HOUSTON GUARANTEED",
  "a plate stamps beside the folder reading LETTER, NO RETURN TO HOUSTON GUARANTEED",
  "the plate bounces", ""),
 (37, 12, 15, W("ask"), "whoosh", "Folio", "hops up to the witness table in the hearing room", "ask", "ASK WHAT READY LAND IS READY FOR",
  "the folder hops up to the witness table of the hearing room beside the empty chair, a plate reading ASK WHAT READY LAND IS READY FOR",
  "the folder squashes and the chair swivels", ""),
 (38, 12, 15, W("October"), "thump", "sticky note", "slaps onto the folder cover", "firm", "OCT 26 · HEARING",
  "a yellow sticky note slaps onto the folder cover reading OCT 26, a plate reading OCT 26 HEARING",
  "the note flutters and settles", "pay: the hearing date"),
 (40, 13, 16, W("Six"), "thump", "Folio", "opens to camera with six empty pockets fanned like a hand of cards", "hollow", "SIX BLANKS",
  "the folder opens to camera with six empty magenta pockets fanned like a hand of cards and one paperclip glinting at the centre",
  "the pockets pulse and the clip glints", ""),
 (41, 13, 16, W("date"), "ding", "sticky note", "lights up beside the folder", "firm", "ONE DATE",
  "the OCT 26 note brightens beside the open folder",
  "the note glows", ""),
 (42, 13, 16, W("fill"), "hum", "Folio", "waits with its tabs flickering under the lamp", "ask", "WATCH WHICH TABS FILL",
  "the open folder waits with its six tabs flickering under the banker's lamp as the camera pushes in",
  "the tabs flicker", "pay: the six blanks"),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "subject-portrait", "close", "eye", "walnut-desk", "eye-level-immersive", "single-object-void", "horizontal-traverse", "single-organic-hero", "", "",
  "The folder skids in", "A thin manila folder with a face skids across a walnut desk under a banker's lamp as an empty chair swivels in the corner."),
 (2, 1, "two-up", "medium", "high", "walnut-desk", "eye-level-immersive", "stacked-layers", "assemble-build", "structure-as-subject", "match-action", "match",
  "The plan sheet unrolls", "The folder hops to the middle of the desk and a plan sheet unrolls from it, a parcel hatched near Houston."),
 (3, 3, "alt-vantage", "wide", "low", "walnut-desk", "eye-level-immersive", "fullbleed-split", "vertical-rise", "single-organic-hero", "hard-cut", "carry",
  "The folder swells", "The folder swells fat with sheets as the hatched parcel glows and a plate reads about 19,950 acres near Houston, AIDEA receives."),
 (4, 4, "macro-closeup", "insert", "high", "desk-blotter", "macro-closeup", "single-object-void", "vertical-descent", "single-organic-hero", "match-cut", "match",
  "Stamps and a receipt", "A stamp slams NO PAYMENT FOR LAND VALUE, a receipt flutters out and a PRELIMINARY stamp smudges the cover."),
 (5, 5, "push-detail", "medium", "eye", "plan-sheet", "instrument-screen", "centered-hero-lowerthird", "push-in-only", "structure-as-subject", "focus-pull", "carry",
  "A dotted data center", "AIDEA's plan unfolds and a data center draws itself in dotted pencil with window lights blinking on."),
 (6, 6, "data-panel", "close", "eye", "letter-desk", "eye-level-immersive", "grid-modular", "scroll-data", "data-as-subject", "hard-cut", "carry",
  "The July letter and six tabs", "A green-letterhead letter slides in and the folder opens, six tabs popping out one pair at a time, every pocket empty."),
 (7, 7, "subject-portrait", "close", "low", "walnut-desk", "eye-level-immersive", "single-object-void", "radial-emanate", "single-organic-hero", "carried-element", "carry",
  "Shaken, then empty", "The folder is shaken and a paperclip falls, an eraser rubs out the data center, and the folder looks hollow at the camera."),
 (8, 9, "wide-establish", "extreme-wide", "high", "houston-snow", "orbital-aerial", "stacked-layers", "assemble-build", "structure-as-subject", "whip-pan", "travel",
  "Two councils oppose", "A snowy spruce flat where two hand-lettered council signs pop up with porch lamps."),
 (9, 10, "two-up", "wide", "low", "hearing-room", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "whip-pan", "travel",
  "The empty chair and five lamps", "A hearing room with an empty witness chair, a no-permission slip, five green vote lamps and a subpoena stamp on the folder in the foreground."),
 (10, 12, "alt-vantage", "wide", "eye", "ready-land-counter", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "structure-as-subject", "mask-wipe", "build",
  "The best case at the counter", "A warm counter of ready parcel files where headlights stop outside, three green lamps light and a coin stack grows."),
 (11, 14, "data-panel", "close", "eye", "counter-shelf", "instrument-screen", "stacked-layers", "scroll-data", "data-as-subject", "carried-element", "carry",
  "The coins tie to no land here", "The coin stack slides along a STATEWIDE shelf as its string to the folder goes slack."),
 (12, 15, "two-up", "medium", "eye", "hearing-room", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "match-cut", "match",
  "A date on a note", "The folder hops to the witness table, a sticky note reading OCT 26 slaps onto it and the empty chair swivels toward it."),
 (13, 16, "macro-closeup", "insert", "high", "walnut-desk", "macro-closeup", "single-object-void", "push-in-only", "single-organic-hero", "carried-element", "carry",
  "Six blanks, one date", "The open folder fans six empty pockets beside a lit OCT 26 note under the banker's lamp."),
]

AMBIENT = {
 1: "the lamp light drifts, dust motes float, the chair creaks, the folder breathes",
 2: "the sheet corners curl, the roll settles, the lamp drifts, the folder breathes",
 3: "the hatch glows, the pin bounces, the lamp drifts, the folder breathes",
 4: "ink spatter settles, the desk jumps, the lamp drifts, the receipt flutters",
 5: "the dashes crawl, window lights flicker, the sheet breathes, dust floats",
 6: "the tabs wobble, the letter settles, the pockets pulse, dust floats",
 7: "the folder rattles, the eraser crumbs fall, the slots pulse, the lamp drifts",
 8: "snow drifts, the signs sway, the porch lamps flicker, the spruce row sways",
 9: "pendant lamps sway, the chair swivels, vote lamps pulse, dust floats",
 10: "the shelves glow, the headlight beams shimmer, the lamps flare, coins clink",
 11: "the string sags, the coins settle, the shelf light drifts, dust floats",
 12: "the chair swivels, the note flutters, the pendants sway, the folder breathes",
 13: "the pockets pulse, the paperclip glints, the tabs flicker, the lamp drifts",
}
CENTER = {1: "the folder at x540 y1100", 2: "the sheet at x540 y900", 3: "the folder at x540 y1100", 4: "the sheet at x540 y950", 5: "the plan at x540 y950", 6: "the folder at x420 y1150", 7: "the folder at x540 y1150",
          8: "the signs at x540 y1000", 9: "the chair at x540 y1050", 10: "the folder at x330 y1150", 11: "the coins at x540 y1000", 12: "the folder at x400 y1150", 13: "the open folder at x540 y1050"}
HERO = {
 1: ("Folio + DeskBG", "55% folder, 30% desk, 15% chair"),
 2: ("Folio + MapSheet", "50% sheet, 35% folder, 15% desk"),
 3: ("Folio + MapSheet", "55% folder, 30% sheet, 15% plates"),
 4: ("Stamp + ReceiptTag + MapSheet", "45% sheet, 35% stamp, 20% receipt"),
 5: ("MapSheet + DottedBuilding", "55% shed, 30% sheet, 15% folder cameo"),
 6: ("Folio + LetterSheet", "45% folder, 40% letter, 15% desk"),
 7: ("Folio + eraser", "60% folder, 25% desk, 15% eraser"),
 8: ("CouncilSign x2 + ExteriorBG", "45% signs, 40% snow flat, 15% lamps"),
 9: ("WitnessChair + VoteLamps", "40% chair, 35% lamps, 25% folder cameo"),
 10: ("CounterBG + CoinStack + Folio", "40% counter, 30% coin stack, 30% folder"),
 11: ("CoinStack + shelf", "50% coins, 30% shelf, 20% folder"),
 12: ("Folio + WitnessChair", "45% folder, 40% chair, 15% note"),
 13: ("Folio open", "65% folder, 20% note, 15% desk"),
}
PARTS = {1: 50, 2: 56, 3: 48, 4: 44, 5: 60, 6: 62, 7: 50, 8: 58, 9: 64, 10: 66, 11: 48, 12: 52, 13: 46}
STAGE3D = {k: "planes" for k in range(1, 14)}
STAGE3D[4] = "flat:a locked macro of the blotter where the stamp and the receipt are the motion"
STAGE3D[5] = "flat:a locked plan sheet where the drawing shed and the window lights are the motion"
STAGE3D[11] = "flat:a locked shelf where the sliding coins and the slack string are the motion"
STAGE3D[13] = "flat:a locked macro where the open folder and its pulsing pockets are the motion"
CAMERA = {1: "dollyThrough", 2: "craneDown", 3: "riseWith", 4: "static:the stamp and the receipt are the shot", 5: "static:the dotted shed drawing itself is the shot", 6: "truckAcross", 7: "dollyThrough",
          8: "craneDown", 9: "truckAcross", 10: "dollyThrough", 11: "static:the slack string is the shot", 12: "truckAcross", 13: "static:the open folder is the shot"}


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
        assert sh == shot, (bid, sh, shot)
        a = round(at(line, anc), 3)
        beats.append({
            "id": bid, "shot": sh, "at_s": a, "vo_line": line,
            "anchor": {"vo_line": line, "fraction": anc if not isinstance(anc, tuple) else 0.0, "offset": round(a - starts[line], 3)},
            "offset": round(a - starts[line], 3), "vo": LINES[line], "phrase": _phrase(line, anc),
            "shows": shows, "sfx": sfx, "means": ann.lower(), "rehook": rehook if rehook.startswith("rehook") else "",
            "draw": {"subject": subj, "action": act, "emotion": emo, "annotation": ann},
            "choreo": {"primary": shows, "reaction": reaction, "ambient": AMBIENT[S[sh - 1][0]]},
        })
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

    palette = "overcast celadon and slate over birch-bone snow, walnut and banker green land office, manila folder, fireweed magenta for what is missing"
    board = {
        "run_date": "2026-10-20", "slug": "adl-234762", "title": "ADL 234762",
        "concept": ("DNR has preliminarily proposed giving about 19,950 acres near Houston to AIDEA with no payment for land value. AIDEA's plan lists data centers as a possible use, and AIDEA's own director wrote that no tenant, site plan, power, cooling, "
                    "water plan or schedule exists. The film draws the case file as Folio, a manila folder with a face that goes thin, fat and hollow, whose six index tabs are the six missing things. It gives the best case for the transfer a full warm scene "
                    "(site control before a tenant signs, ready land, AIDEA's own dividend claim), shows why that case is real but doesn't answer this land, and ends on the one date, October 26th, when senators can first ask the commissioner."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "macro-closeup", "motion_vector": "assemble-build", "hero_treatment": "structure-as-subject", "layout": "stacked-layers",
                        "register": "paper-and-walnut", "palette": palette, "camera_strategy": "crane-and-truck-between-worlds", "light_story": "a warm banker-lamp pool on a walnut desk, overcast celadon snow light on the Houston flat, a spruce-green hearing room, a bright counter",
                        "metaphor": "a manila case folder with six empty tabs asked to hold a forest"},
        "palette": palette,
        "divergence_note": ("10-18 was a blue-hour indigo to rose world with a mustard felt bench and a mint jelly. 10-17 a low peach sun with banknote green. This film is overcast celadon and slate with a walnut land-office desk, "
                            "a manila folder hero and fireweed magenta, moving through a desk, a plan sheet, a blotter macro, a dotted plan, a letter, a snowy council flat, a hearing room, a counter and a shelf."),
        "treatment": {"winner": "The Comedian's Folder (ADL 234762, six empty tabs, an empty chair gag), with the Dramatist's key-shop tenant headlights as the counter scene, the Explainer's acres plan sheet and the Enthusiast's fair land-bank counter.",
                      "why": "A face on a hard-cornered object carries emotion, six tabs make the six missing things countable and the best case gets a warm scene before the film asks its question."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A thin manila folder with two eyes skids across a walnut desk under a banker's lamp and squashes onto its mark, its tab reading ADL 234762.",
                 "headline": "WHAT DOES THE STATE HAND OVER?", "motion_by_s": 0.3,
                 "loopback": "The last frame is the open folder under the same lamp with six blank pockets, the first frame's question left on the desk."},
        "open_loop": {"plant_t": b_at(4), "pay_t": b_at(42), "what": "What is in the folder? Planted as the folder hops to centre, paid as six blank pockets fanned open under the lamp."},
        "open_loop_2": {"plant_t": b_at(20), "pay_t": b_at(37), "what": "So what is the folder for? Planted as the data center is erased, paid as the OCT 26 note slaps on and the hearing is named."},
        "throughline": {"object": "Folio", "lands_in_button": "the open folder with six blank pockets fanned under the lamp beside the OCT 26 note",
                        "states": [
                            {"at_s": b_at(1), "state": "thin and sliding in"},
                            {"at_s": b_at(7), "state": "fat with the plan sheet"},
                            {"at_s": b_at(11), "state": "stamped preliminary"},
                            {"at_s": b_at(19), "state": "open with six empty pockets"},
                            {"at_s": b_at(23), "state": "hollow, tabs swinging"},
                            {"at_s": b_at(30), "state": "pinned by a subpoena stamp"},
                            {"at_s": b_at(34), "state": "listening at the counter"},
                            {"at_s": b_at(38), "state": "holding a sticky note OCT 26"},
                            {"at_s": b_at(40), "state": "open to camera, six blanks fanned"}]},
        "reveals": [
            {"t": b_at(5), "type": "build-on", "what": "a plan sheet unrolls out of the folder across the desk", "hold_s": 0.6},
            {"t": b_at(24), "type": "scale-pullback", "what": "the view whips to a wide snowy spruce flat and two council signs pop up", "hold_s": 0.7},
            {"t": b_at(35), "type": "morph-to-chart", "what": "the coin stack slides along a shelf labelled STATEWIDE and its string to the folder goes slack", "hold_s": 0.6}],
        "tail_s": 1.7, "audio_arc": {"build_steps": 4, "dip_at": round(b_at(41) - 0.9, 3), "riser_at": round(b_at(37), 3), "silence_at": round(b_at(41) - 0.2, 3),
                      "payoff_at": b_at(41), "button_pattern": "question", "interrupt_at": b_at(9), "extra_dips": [b_at(21), b_at(30)]},
        "shots": shots, "beats": beats,
    }
    order = sorted(board["beats"], key=lambda b: (b["at_s"], b["id"]))
    ids = {b["id"]: rank for rank, b in enumerate(order, 1)}
    for b in board["beats"]:
        b["key"] = b["id"]
        b["id"] = ids[b["key"]]
    board["beats"].sort(key=lambda b: b["id"])
    board["_ids"] = ids
    book.raise_if_missing("board_1020 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1020Ids.ts").write_text(
        "// GENERATED by scripts/board_1020.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
