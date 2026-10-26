#!/usr/bin/env python3
"""2026-10-26 "Not Yes or No": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1026.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1026.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "thunk", "the BallotBox", "spits a big YES / NO ballot slip out of its slot mouth with squash and overshoot", "blank", "DATA CENTERS?",
  "a bright polling-place hall, a steel-blue ballot box with a face and a cranberry flag spits a cream ballot slip out of its slot mouth, the slip reads DATA CENTERS? over two big boxes YES and NO",
  "the flag sways and the slip flutters", "plant: what happens to a yes or no slip"),
 (2, 1, 0, W("candidates"), "tick", "the pen", "swings between the YES box and the NO box and stops, sweating", "sweat", "YES · NO",
  "a navy pen swings between YES and NO and stops in midair, the BallotBox squints with a sweat drop",
  "the pen wobbles and the box blinks", ""),
 (3, 1, 0, W("data"), "pop", "the two boxes", "soften and drip down the slip like butter", "worried", "THE SLIP MELTS",
  "the YES and NO boxes soften and drip down the slip, the BallotBox fans its flag in alarm",
  "the drips run and the flag fans", ""),
 (4, 1, 0, W("November"), "bloop", "three sliders", "set from the drips on the slip and a stamp lands in the corner", "ask", "VOTING OPEN · ELECTION DAY NOVEMBER 3RD",
  "the drips set into three navy rails with sliding knobs labelled SIZE, PLACE and WHO PAYS, and a plate stamps VOTING OPEN, ELECTION DAY NOVEMBER 3RD",
  "the knobs glide and the box squints", ""),
 (5, 2, 1, 0.0, "slide", "twelve podiums", "rise from the stage floor in two rows with name cards", "plain", "FAIRBANKS-AREA FORUM",
  "a wood forum stage with twelve faceless podium silhouettes rising in two rows, each with a blank name card, a boxed tag reads FAIRBANKS-AREA FORUM",
  "the podiums settle and the curtain sways", ""),
 (6, 2, 1, W("twelve"), "pop", "the podium cards", "light up one by one along the rows", "plain", "12 CANDIDATES · RULES + LOCAL INPUT",
  "the twelve name cards light up one by one, a plate reads 12 CANDIDATES, RULES + LOCAL INPUT",
  "the cards pulse and the rows nod", ""),
 (7, 2, 1, W("rules"), "thunk", "RULES signs", "lift on every podium together", "plain", "RULES · LOCAL INPUT",
  "a small sign reading RULES lifts on every podium, and a second reads LOCAL INPUT",
  "the signs sway", ""),
 (8, 2, 1, W("per"), "slide", "newspaper tag", "swings in on a hook from the stage frame", "plain", "PER THE FAIRBANKS DAILY NEWS-MINER",
  "a small newspaper tag swings in on a hook reading PER THE FAIRBANKS DAILY NEWS-MINER, MID OCTOBER",
  "the tag swings and settles", ""),
 (9, 3, 2, 0.0, "whoosh", "a bill sheet", "zips along a rail and drops face down into an IN tray", "plain", "A BILL",
  "a cream bill sheet zips along a navy rail and drops face down into a wooden IN tray with a LATER tab, a plate reads A BILL",
  "the tray rocks and dust puffs", "plant: what is in that bill"),
 (10, 3, 2, W("Hold"), "thunk", "the LATER tab", "slaps the BallotBox's reaching arm away from the tray", "ask", "HOLD THAT THOUGHT",
  "the BallotBox's arm reaches for the sheet and the LATER tab slaps it away, a plate reads HOLD THAT THOUGHT",
  "the tab flips and the box blinks", ""),
 (11, 4, 3, 0.0, "snap", "the podiums", "scatter across the stage like startled ptarmigan", "plain", "THEN THEY SPLIT",
  "the twelve podiums scatter across the stage on little slides, a plate reads THEN THEY SPLIT",
  "the podiums skid and settle", ""),
 (12, 4, 3, W("three"), "clink", "three podiums", "lift a padlocked gate together", "plain", "3 BACK A STATE MORATORIUM",
  "three podiums haul a padlocked gate across the stage floor, a plate reads 3 BACK A STATE MORATORIUM",
  "the gate swings and the lock clinks", ""),
 (13, 4, 3, W("study"), "tick", "the key", "slides in labelled STUDY and the lock hangs open on its hasp, not a wall", "plain", "UNTIL ALASKA CAN STUDY IT",
  "a brass key labelled STUDY slides toward the padlock which has a keyhole, a plate reads UNTIL ALASKA CAN STUDY IT, a brick wall stands ghosted beside it labelled A BAN, crossed out as not this",
  "the key glints and the gate sways", ""),
 (14, 5, 4, 0.0, "slide", "the WHO PAYS slider", "slides in alone under a cash register and an envelope", "ask", "WHO PAYS?",
  "the WHO PAYS rail glides to centre with a brass cash register on one side and a mail envelope on the other, a plate reads WHO PAYS?",
  "the knob glides and the box blinks", "rehook: who pays"),
 (15, 5, 4, W("tax"), "thunk", "the cash register", "pops its drawer open", "plain", "RENTZEL · SOME SORT OF TAX",
  "the register drawer pops open as the knob slides to TAX, a plate reads RENTZEL, SOME SORT OF TAX",
  "the drawer rattles and the bell rings", ""),
 (16, 5, 4, W("Alaskan"), "pop", "the envelope", "opens and coins bounce off the BallotBox's forehead", "surprise", "MOORE · A DIGITAL DIVIDEND",
  "the envelope addressed EVERY ALASKAN opens and coins bounce off the BallotBox's forehead, a plate reads MOORE, A DIGITAL DIVIDEND",
  "the coins roll off the stage", ""),
 (17, 6, 5, 0.0, "whoosh", "a painted map", "unrolls with a south marker and a far north marker", "plain", "SOUTH ANCHORAGE · HOUSE RACE",
  "a painted map of Alaska unrolls with a pin at the south coast and a far pin on the north coast, a boxed tag reads SOUTH ANCHORAGE, HOUSE RACE",
  "the map ripples and the pins pulse", ""),
 (18, 6, 5, W("modest"), "bloop", "a small shed building", "pops up at the south pin with a green outlet", "calm", "HOLLAND · MODEST · PURPOSE-BUILT",
  "a small shed-sized building with a plain door pops up at the south pin, a plate reads HOLLAND, MODEST, PURPOSE-BUILT",
  "the shed bobs and its outlet glows", ""),
 (19, 6, 5, W("large"), "rumble", "the SIZE slider", "slides a huge hall far up the map to the north pin", "plain", "BOYLE · OPEN TO LARGE",
  "a huge hall rolls on a rail from the south pin up the map to the north pin, a plate reads BOYLE, OPEN TO LARGE",
  "the hall rumbles along the rail", ""),
 (20, 6, 5, W("especially"), "swell", "the camera", "pulls back to show the whole distance and a power cord dangling unplugged", "ask", "NORTH SLOPE",
  "the camera pulls back across the map showing the whole distance, a power cord from the rail's WHO PAYS knob dangles in the air plugged into nothing, a tag reads NORTH SLOPE",
  "the cord sways and the pins pulse", "plant: the unplugged cord"),
 (21, 7, 6, 0.0, "slide", "the governor stage", "slides in with four name-card stands", "plain", "FOR GOVERNOR",
  "a stage with four faceless governor podiums and name cards, a boxed tag reads FOR GOVERNOR",
  "the stage lights sway", ""),
 (22, 7, 6, W("believer"), "hit", "Bronson's card", "lifts a YES pennant with a squash and stars", "plain", "BRONSON · BIG BELIEVER · SAID IN SEPTEMBER",
  "the first podium card lifts a pennant, a plate reads BRONSON, BIG BELIEVER, SAID IN SEPTEMBER",
  "the pennant flaps", ""),
 (23, 7, 6, W("embrace"), "pop", "Taylor's card", "lifts a matching pennant", "plain", "TAYLOR · EMBRACE IT",
  "the second podium card lifts a pennant, a plate reads TAYLOR, EMBRACE IT",
  "the pennant flaps", ""),
 (24, 8, 7, 0.0, "slide", "the SIZE rail", "glides in with a hyperscale hall at its top end", "plain", "WILSON · NEVER LITTERED WITH HYPERSCALE",
  "the SIZE rail glides in with a vast hall at its top end, a plate reads WILSON, NEVER LITTERED WITH HYPERSCALE",
  "the rail glides and the hall hums", "rehook: the line at the top"),
 (25, 8, 7, W("hyperscale"), "thump", "a limit line", "slams across the top of the SIZE rail with a ring of paper dust", "alarm", "THE LINE IS AT HYPERSCALE",
  "a navy limit line slams across the rail just below the vast hall, a plate reads THE LINE IS AT HYPERSCALE",
  "the dust settles and the line hums", ""),
 (26, 8, 8, 0.0, "snap", "the padlock gate", "swings back in labelled FRAMEWORK on its key slot", "plain", "KREISS-TOMKINS · UNTIL A FRAMEWORK",
  "the padlocked gate swings back across the stage, its key slot labelled FRAMEWORK, a plate reads KREISS-TOMKINS, UNTIL A FRAMEWORK",
  "the gate swings", ""),
 (27, 8, 8, W("passes"), "tick", "the key slot", "drops an empty dashed key outline into the slot where it locks", "ask", "THE KEY IS NOT WRITTEN YET",
  "the key slot glows with an empty dashed key outline, a plate reads THE KEY IS NOT WRITTEN YET",
  "the dashed key pulses", ""),
 (28, 9, 9, 0.0, "creak", "a power pole", "slides in and its green line drops into a deep slack curve in the dusk", "plain", "TOMASZEWSKI · THE GRID ISN'T READY",
  "a dusk Interior skyline with a power pole whose aurora-green line sags, a plate reads TOMASZEWSKI, THE GRID ISN'T READY",
  "the line sags and sways", ""),
 (29, 9, 9, W("grid"), "ping", "the alert lamp", "lights up on the pole and the flag drops", "worried", "GOLDEN VALLEY ELECTRIC · RECENT ENERGY ALERT",
  "an alert lamp on the pole flashes, a plate reads GOLDEN VALLEY ELECTRIC, RECENT ENERGY ALERT, and the BallotBox's flag droops at the pole's foot",
  "the lamp flashes and the flag droops", ""),
 (30, 9, 9, W("zoning"), "bell", "a borough counter", "slides in with a service bell that rings", "plain", "PRAX · HANEY · ZONING IS LOCAL",
  "a small borough counter slides in with a service bell that rings, a plate reads PRAX, HANEY, ZONING IS LOCAL",
  "the bell shivers", ""),
 (31, 10, 10, 0.0, "snap", "the dangling cord", "swings across the stage and plugs into the outlet with a green flash as the shed and the huge hall slide in side by side", "plain", "HOLLAND AND BOYLE",
  "the modest shed and the huge hall stand side by side under the dusk sky, a plate reads HOLLAND AND BOYLE",
  "the lights flicker in both", "pay: the cord plugs in"),
 (32, 10, 10, W("energy"), "hit", "the green line", "stretches across to plug both buildings in at last", "calm", "BOTH SEE ENERGY INVESTMENT",
  "one aurora-green line stretches to plug both buildings in, a plate reads BOTH SEE ENERGY INVESTMENT",
  "the green line pulses", ""),
 (33, 11, 11, 0.0, "thunk", "a rule board", "swings out blank under a lamp", "ask", "THE RULE?",
  "a blank framed rule board swings out under a single lamp, a plate reads THE RULE?",
  "the board sways and the lamp glows", ""),
 (34, 11, 12, W("Senate"), "page", "the face-down sheet", "flips over in the IN tray", "plain", "SENATE · 14 TO 5",
  "the IN tray lamp glows and the face-down sheet flips over, a plate reads SENATE, 14 TO 5",
  "the sheet settles and the lamp glows", "rehook: the bill flips over"),
 (35, 11, 12, W("bill"), "pop", "the sheet text", "types its two headings in", "plain", "UTILITY POWER USE · DECOMMISSIONING PLANS",
  "the sheet types two headings UTILITY POWER USE and DECOMMISSIONING PLANS with a green plug icon and a crane icon",
  "the text types", ""),
 (36, 11, 12, W("decommissioning"), "clink", "the stamp", "taps the sheet", "plain", "THE BILL · POWER RULES + DECOMMISSIONING",
  "a plate reads THE BILL, POWER RULES + DECOMMISSIONING, and a rubber stamp taps SENATE PASSED beside it",
  "the stamp lifts", ""),
 (37, 12, 13, 0.0, "thunk", "the IN tray", "slides back under a HOUSE arch and sits untouched", "plain", "HOUSE · NEVER TOOK IT UP",
  "the sheet slides in the tray under an arch labelled HOUSE and sits untouched, a plate reads HOUSE, NEVER TOOK IT UP",
  "the tray settles and dust drifts", ""),
 (38, 12, 13, W("took"), "bell", "the session bell", "rings and the lights above the tray dim", "plain", "SESSION ENDED",
  "a brass session bell on a post rings and the lights above the tray dim, a small plate reads SESSION ENDED",
  "the bell swings", ""),
 (39, 12, 13, W("Tobin"), "pop", "sponsor tag", "swings in on a hook", "plain", "SPONSOR LOKI TOBIN RETURNS NEXT YEAR",
  "a small tag swings in on a hook reading SPONSOR LÖKI TOBIN, RETURNS NEXT YEAR",
  "the tag swings", ""),
 (40, 13, 14, 0.0, "snap", "the blank sheet", "slides in headed FIRST RULE UNWRITTEN with a pen hovering", "ask", "FIRST RULE UNWRITTEN",
  "a blank cream sheet headed FIRST RULE UNWRITTEN slides in with a pen hovering at the same height as the opening pen",
  "the pen hovers and the sheet sways", ""),
 (41, 13, 14, W("size"), "tick", "the SIZE knob", "pulses on its rail", "plain", "SIZE",
  "the three rails return beside the sheet and the SIZE knob pulses",
  "the knob pulses", ""),
 (42, 13, 14, W("place"), "tick", "the PLACE knob", "pulses", "plain", "PLACE",
  "the PLACE knob pulses on its rail", "the knob pulses", ""),
 (43, 13, 14, W("pays"), "tick", "the WHO PAYS knob", "pulses", "plain", "WHO PAYS",
  "the WHO PAYS knob pulses and its green cord glows", "the cord glows", ""),
 (44, 13, 14, W("decides"), "hit", "the BallotBox", "swallows the blank sheet and spits out the opening YES / NO slip", "ask", "WHICH ONE?",
  "the BallotBox swallows the blank sheet and spits out the opening YES / NO slip, the same frame as the first",
  "the slip flutters and the flag sways", ""),

 (45, 5, 4, W("Aimee"), "slide", "the envelope", "slides in and tilts open under the knob", "plain", "EVERY ALASKAN",
  "a mail envelope slides in under the WHO PAYS knob and tilts open, addressed EVERY ALASKAN", "the envelope flaps", ""),
 (46, 7, 6, W("Dave"), "slide", "Bronson's card", "slides into the first podium", "plain", "BRONSON",
  "the first governor podium slides into frame with the name card BRONSON", "the card settles", ""),
 (47, 7, 6, W("Treg"), "slide", "Taylor's card", "slides into the second podium", "plain", "TAYLOR",
  "the second governor podium slides into frame with the name card TAYLOR", "the card settles", ""),
 (48, 8, 7, W("never"), "tick", "the limit line", "lowers toward the SIZE rail", "alarm", "NEVER",
  "a navy limit line lowers toward the SIZE rail above the vast hall", "the line hums", ""),
 (49, 8, 8, W("moratorium"), "clink", "the gate", "swings in across the stage and its lock clinks", "plain", "A PAUSE WITH A KEY SLOT",
  "the padlocked gate swings across the stage and the lock clinks", "the lock clinks", ""),
 (50, 9, 9, W("Harmony"), "ping", "the alert lamp", "flickers on as the pole bends", "worried", "ENERGY ALERT",
  "the alert lamp on the pole flickers on as the pole bends under the sagging line", "the lamp flickers", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "wide-establish", "medium", "eye", "polling-hall", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "",
  "The slip", "A bright polling-place hall where the BallotBox spits a YES / NO slip whose boxes melt into three sliders."),
 (2, 1, "wide-establish", "wide", "eye", "forum-stage", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "hard-cut", "match",
  "Twelve podiums", "A forum stage of twelve podiums whose cards light up one by one."),
 (3, 2, "subject-portrait", "close", "low", "in-tray", "macro-closeup", "single-object-void", "push-in-only", "structure-as-subject", "whip-pan", "travel",
  "The bill in the tray", "A bill sheet zips along a rail and drops face down in an IN tray, with a LATER tab."),
 (4, 3, "wide-establish", "wide", "eye", "stage-split", "eye-level-immersive", "fullbleed-split", "vertical-descent", "multiplicity-swarm", "hard-cut", "match",
  "Then they split", "Twelve podiums scatter and three haul a padlocked gate that a STUDY key opens."),
 (5, 4, "data-panel", "medium", "eye", "slider-panel", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "instrument-as-subject", "match-cut", "match",
  "Who pays", "The WHO PAYS rail with a cash register and an envelope of coins."),
 (6, 5, "map-territory", "extreme-wide", "high", "painted-map", "top-down-map", "map-territory", "vertical-descent", "landscape-as-subject", "hard-cut", "match",
  "Shed or hall", "A painted map of Alaska where a shed at the south pin and a huge hall slid north to the far pin."),
 (7, 6, "two-up", "medium", "eye", "governor-stage", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "whip-pan", "travel",
  "For governor", "Four governor podiums, two with pennants."),
 (8, 7, "data-panel", "medium", "eye", "size-rail", "eye-level-immersive", "single-object-void", "push-in-only", "instrument-as-subject", "graphic-match", "match",
  "The line at hyperscale", "The SIZE rail with a limit line, then the padlock gate and its empty dashed key."),
 (9, 9, "wide-establish", "wide", "low", "interior-dusk", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "landscape-as-subject", "hard-cut", "match",
  "The grid", "A dusk Interior with a sagging power pole, an alert lamp and a borough counter bell."),
 (10, 10, "two-up", "wide", "eye", "two-buildings", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "match-cut", "match",
  "Same line", "A shed and a hall under one green line that plugs the dangling cord in."),
 (11, 11, "subject-portrait", "medium", "eye", "hearing-room", "eye-level-immersive", "single-object-void", "push-in-only", "data-as-subject", "hard-cut", "match",
  "The bill flips", "A blank rule board, then the tray's bill flips to SENATE 14 TO 5 and types its two headings."),
 (12, 13, "subject-portrait", "close", "low", "in-tray-bell", "macro-closeup", "single-object-void", "push-in-only", "structure-as-subject", "match-cut", "match",
  "Never took it up", "The sheet sits untouched in the tray as a session bell rings and the lights dim."),
 (13, 14, "wide-establish", "medium", "eye", "polling-hall-button", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "hard-cut", "match",
  "Which one decides", "A blank FIRST RULE UNWRITTEN sheet and the three rails, then the BallotBox swallows it and spits out the opening slip."),
]

AMBIENT = {
 1: "the flag sways, the slip flutters, light drifts through the high windows, drips run",
 2: "podiums nod and settle, the curtain sways, spot lights drift",
 3: "dust drifts, the tray rocks, the lamp hums, the LATER tab flips",
 4: "podiums skid and settle, the gate swings, the key glints",
 5: "knobs glide, the register drawer rattles, coins roll, the envelope flaps",
 6: "the map ripples, pins pulse, the hall rumbles, the cord sways",
 7: "stage lights sway, pennants flap, the cards pulse",
 8: "rails glide, the hall hums, the limit line hums, the dashed key pulses",
 9: "the line sags and sways, the lamp flashes, the bell shivers, the dusk breathes",
 10: "building lights flicker, the green line pulses, the cord sways",
 11: "the lamp glows, the board sways, the sheet types, the stamp lifts",
 12: "dust drifts, the bell swings, the lights dim, the tag swings",
 13: "the pen hovers, the sheet sways, knobs pulse, the flag sways",
}
CENTER = {1: "the BallotBox and the slip at x540 y960", 2: "the podium rows at x540 y960", 3: "the tray at x540 y1000", 4: "the gate at x540 y960", 5: "the rail at x540 y980",
          6: "the map at x540 y960", 7: "the governor stage at x540 y1000", 8: "the SIZE rail at x540 y980", 9: "the pole at x540 y1000", 10: "the two buildings at x540 y1000",
          11: "the board and tray at x540 y1000", 12: "the tray at x540 y1000", 13: "the BallotBox and the sheet at x540 y960"}
HERO = {
 1: ("the BallotBox + slip + sliders", "50% BallotBox, 35% slip, 15% rails"),
 2: ("twelve podiums + cards + signs", "70% podiums, 20% cards, 10% tag"),
 3: ("IN tray + bill sheet + LATER tab", "40% tray, 40% sheet, 20% tab"),
 4: ("podiums + padlocked gate + STUDY key", "40% podiums, 40% gate, 20% key"),
 5: ("WHO PAYS rail + register + envelope", "30% rail, 35% register, 35% envelope"),
 6: ("painted map + shed + hall + cord", "45% map, 20% shed, 25% hall, 10% cord"),
 7: ("four governor podiums + pennants", "60% podiums, 40% pennants"),
 8: ("SIZE rail + limit line + gate + dashed key", "35% rail, 20% line, 30% gate, 15% key"),
 9: ("power pole + alert lamp + counter bell", "50% pole, 20% lamp, 30% counter"),
 10: ("shed + hall + green line + cord", "25% shed, 40% hall, 20% line, 15% cord"),
 11: ("rule board + IN tray + bill sheet", "25% board, 30% tray, 45% sheet"),
 12: ("IN tray + sheet + session bell", "40% tray, 30% sheet, 30% bell"),
 13: ("BallotBox + blank sheet + three rails", "40% BallotBox, 30% sheet, 30% rails"),
}
PARTS = {1: 52, 2: 60, 3: 44, 4: 54, 5: 50, 6: 56, 7: 48, 8: 52, 9: 50, 10: 48, 11: 52, 12: 44, 13: 54}
KICKS = (3, 19, 34)
STAGE3D = {k: "planes" for k in range(1, 14)}
for _k in (3, 5, 8, 11, 12):
    STAGE3D[_k] = "flat:a locked panel with a slow drift where the tray, the rail, the sheet and the bell are the motion"
CAMERA = {1: "dollyThrough", 2: "craneDown", 3: "static:the tray is the shot", 4: "truckAcross", 5: "static:the rail is the shot", 6: "craneDown", 7: "truckAcross",
          8: "static:the rail and the gate are the shot", 9: "truckAcross", 10: "dollyThrough", 11: "static:the sheet is the shot", 12: "static:the tray is the shot", 13: "dollyThrough"}


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

    palette = "pale sage hall walls, honey gym floor, cranberry booth curtains and flag, steel box with a parchment slip, ink-black rails, aurora lamps for electricity only"
    board = {
        "run_date": "2026-10-26", "slug": "not-yes-or-no", "title": "Not Yes or No",
        "concept": ("The Fairbanks Daily News-Miner (October 18th), the Anchorage Daily News (October 22nd) and the Alaska Beacon (September 18th and October 24th) report how Alaska's legislative and governor candidates answer the data center question, "
                    "and that the Senate passed a data center bill 14 to 5 that the House never took up. A steel-blue ballot box with a face, the BallotBox, spits out a YES / NO slip whose boxes melt into three sliding rails, SIZE, PLACE and WHO PAYS. "
                    "The film follows the slip across a forum stage of twelve podiums, an IN tray, a padlocked gate that a STUDY key opens, a cash register and a coin envelope, a painted map with a shed and a huge hall, a governor stage, a limit line at hyperscale, a sagging power pole, a counter bell, one green line that plugs two rival buildings in, the bill sheet flipping to SENATE 14 TO 5, a session bell, and a blank FIRST RULE UNWRITTEN sheet that the BallotBox swallows before spitting out the opening slip."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "push-in-only", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "naturalistic-scene", "palette": palette, "camera_strategy": "rail-glide-panels",
                        "light_story": "morning-to-dusk",
                        "metaphor": "a yes or no ballot slip whose boxes melt into three sliding rails: size, place and who pays"},
        "palette": palette,
        "divergence_note": ("The last films were a rain boardwalk of signs (10-25), a navy orbit (10-24), a paper building in snow (10-23) and a dark tundra bob (10-22). "
                            "This film is a bright indoor civic hall in sage and honey with a cranberry accent and aurora green for electricity only, built of a ballot slip, sliders, podiums, a padlocked gate and an IN tray. "
                            "There is no rain, no sign hero, no orbit, no cutaway ground, no paper creature, no remote, no pause button and no calendar. HONEST OVERLAP: its hero is a faced object for the fifth film in a row, but it is a hard steel box with a slot mouth and a flag."),
        "treatment": {"winner": "The Explainer's ballot slip that melts into three rails, with the Enthusiast's face-down bill sheet in the IN tray as the primary loop, the Dramatist's unplugged power cord as the secondary loop, and the Comedian's coin gag. The pause is a padlocked gate with a key, never a button.",
                      "why": "All four pitches converged on a YES / NO slip that becomes sliders. The thesis is that the argument is size, place and who pays, so the picture is a slip whose boxes melt into three rails, and the unfinished bill is the sheet that sat in the tray."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A bright polling hall where a steel-blue ballot box with a face spits out a big YES / NO ballot slip, a pen swinging between the two boxes and stopping, the boxes starting to sag.",
                 "headline": "NOT YES OR NO", "motion_by_s": 0.3,
                 "loopback": "The last frame is the BallotBox swallowing the blank FIRST RULE UNWRITTEN sheet and spitting out the same YES / NO slip, so the film ends where it began and the question is handed back."},
        "open_loop": {"plant_t": b_at(9), "pay_t": b_at(34), "what": "One bill already tried to write the rules down, hold that thought. Planted as a sheet drops face down in an IN tray under a LATER tab, paid when the sheet flips over to SENATE 14 TO 5.",},
        "open_loop_2": {"plant_t": b_at(20), "pay_t": b_at(31), "what": "A power cord dangles unplugged from the WHO PAYS knob. Planted as the camera pulls back across the map, paid when one green line plugs both rival buildings in at BOTH SEE ENERGY INVESTMENT.",},
        "throughline": {"object": "the ballot slip", "lands_in_button": "the blank FIRST RULE UNWRITTEN sheet that the BallotBox swallows before it spits out the opening slip",
                        "states": [
                            {"at_s": b_at(1), "state": "a cream slip with two boxes YES and NO"},
                            {"at_s": b_at(4), "state": "the boxes melted into three rails SIZE, PLACE, WHO PAYS"},
                            {"at_s": b_at(14), "state": "the WHO PAYS rail alone with a register and an envelope"},
                            {"at_s": b_at(19), "state": "the SIZE rail slid far up the map, a cord dangling"},
                            {"at_s": b_at(25), "state": "the SIZE rail with a limit line at hyperscale"},
                            {"at_s": b_at(34), "state": "the bill sheet flipped over, SENATE 14 TO 5"},
                            {"at_s": b_at(37), "state": "the bill sheet untouched in the IN tray"},
                            {"at_s": b_at(40), "state": "a blank sheet headed FIRST RULE UNWRITTEN with a pen hovering"}]},
        "reveals": [
            {"t": b_at(6), "type": "scale-pullback", "what": "the forum stage reveals twelve podiums lighting up one by one", "hold_s": 0.7},
            {"t": b_at(20), "type": "scale-pullback", "what": "the camera pulls back across the whole map from the south pin to the far north pin", "hold_s": 0.8},
            {"t": b_at(35), "type": "build-on", "what": "the bill sheet types its two headings, utility power use and decommissioning plans", "hold_s": 0.8},
            {"t": b_at(41), "type": "morph-to-chart", "what": "the three rails return beside the blank sheet and pulse in turn", "hold_s": 0.7}],
        "tail_s": 3.2, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 0, "offset": 3.0, "level": 0.8}, {"line": 1, "offset": 0.0, "level": 0.55},
            {"line": 2, "offset": 0.0, "level": 0.5}, {"line": 3, "offset": 0.0, "level": 0.7}, {"line": 4, "offset": 0.0, "level": 0.6},
            {"line": 5, "offset": 0.0, "level": 0.8}, {"line": 6, "offset": 0.0, "level": 0.6}, {"line": 7, "offset": 0.0, "level": 0.45},
            {"line": 8, "offset": 0.0, "level": 0.35}, {"line": 9, "offset": 0.0, "level": 0.2}, {"line": 9, "offset": 4.0, "level": 0.14},
            {"line": 10, "offset": 0.0, "level": 0.6}, {"line": 11, "offset": 0.0, "level": 0.2}, {"line": 12, "offset": 0.0, "level": 0.7},
            {"line": 13, "offset": 0.0, "level": 0.5},
            {"at_s": round(b_at(40) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(40) + 0.8, 3), "level": 0.55},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "build_steps": 4, "dip_at": round(b_at(40) - 0.3, 3), "riser_at": round(b_at(34), 3), "silence_at": round(b_at(40) - 0.3, 3),
                      "payoff_at": b_at(40), "button_pattern": "question", "interrupt_at": b_at(28), "extra_dips": [b_at(37)]},
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
    book.raise_if_missing("board_1026 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1026Ids.ts").write_text(
        "// GENERATED by scripts/board_1026.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
