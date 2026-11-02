#!/usr/bin/env python3
"""2026-11-02 "The Door Is Yours": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1102.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1102.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "click", "Clicky", "clicks on the dash of a moving night cab and a teal ring pulses off it while gloved hands hold the wheel and snowy road lines stream past the headlights", "wry", "SMART DRIVER · ALLEGED",
  "Clicky, a gunmetal counter with eyes, clicks on the dash of a moving night cab and a teal ring pulses off it while a driver's gloved hands hold the wheel and snowy road lines stream past the headlights, a plate reads SMART DRIVER · ALLEGED", "the ring pulses", ""),
 (2, 1, 0, W("Smart"), "clank", "a key fob", "swings from the ignition engraved ENROLLED?", "curious", "ENROLLED?",
  "a nickel key fob swings from the ignition engraved ENROLLED? as the dash lights flicker", "the fob swings", ""),
 (3, 1, 0, W("diary"), "page", "a diary ledger", "unrolls from Clicky's side with rows ticking from 2016 to 2024", "wry", "2016 TO 2024 · PER THE ATTORNEYS GENERAL",
  "a ledger diary unrolls from Clicky's side with ruled rows ticking from 2016 to 2024, a plate reads 2016 TO 2024 · PER THE ATTORNEYS GENERAL", "the rows tick", ""),
 (4, 2, 1, 0.0, "ping", "a coin stack", "builds under a sodium-lit flip counter that rolls up to $220 million", "reading", "$220 MILLION · PER THE SETTLEMENT",
  "a coin stack builds under a sodium-lit flip counter rolling up to $220 million, a plate reads $220 MILLION · PER THE SETTLEMENT", "the coins settle", ""),
 (5, 2, 1, W("thirty-six"), "stamp", "36 name cards", "slap onto a rail one after another with one card set apart for D.C.", "reading", "36 ATTORNEYS GENERAL",
  "thirty-six name cards slap onto a rail one after another with one set apart for D.C., a plate reads 36 ATTORNEYS GENERAL", "the cards settle", ""),
 (6, 2, 1, W("Alaska"), "blip", "the Alaska card", "lifts from the rail and its edge glows", "proud", "ALASKA IN",
  "the Alaska card lifts from the rail and its edge glows, a plate reads ALASKA IN", "the card glows", ""),
 (7, 3, 2, 0.0, "slide", "two sealed envelopes", "slide onto the desk labelled ONE THING FIXED and ONE THING CAN'T with the key fob between them", "curious", "ONE THING FIXED · ONE THING CAN'T",
  "two sealed envelopes slide onto a desk labelled ONE THING FIXED and ONE THING CAN'T with the key fob between them", "the envelopes rock", "plant: the one thing it fixes and the one thing it can't"),
 (34, 3, 2, 0.55, "creak", "the CAN'T envelope", "rattles and a thin crack of light shows under its flap", "curious", "ONE THING CAN'T",
  "the CAN'T envelope rattles on the desk and a thin crack of light shows under its flap, a plate reads ONE THING CAN'T", "the flap rattles", ""),
 (8, 4, 3, 0.0, "snap", "a moose", "steps into the headlights and the cab brakes so the HARD BRAKING gauge flinches and Clicky clicks", "alarmed", "HARD BRAKING",
  "a moose steps into the headlights and the cab brakes so the HARD BRAKING gauge flinches and Clicky clicks, a plate reads HARD BRAKING", "the needle flinches", "rehook: a moose steps into the headlights and the cab brakes"),
 (35, 4, 3, W("late-night"), "thock", "the late-night gauge", "swings its needle into a crescent moon zone as the dash lights dim", "alarmed", "LATE-NIGHT DRIVING",
  "the late-night gauge swings its needle into a crescent moon zone as the dash lights dim, a plate reads LATE-NIGHT DRIVING", "the needle quivers", ""),
 (9, 4, 3, W("location"), "ping", "a ring pulse", "fires every three seconds as the camera pulls back from one drive's dots to a whole night city of dots", "alarmed", "LOCATION EVERY 3 SECONDS",
  "a teal ring pulse fires every three seconds as the camera pulls back from one drive's dots to a whole night city of dots, a plate reads LOCATION EVERY 3 SECONDS", "the dots drop", ""),
 (10, 5, 4, 0.0, "clank", "the teal page", "leaves Clicky and rides into the Broker's slot", "focused", "GM SOLD IT · ALLEGED",
  "the teal page leaves Clicky and rides into the Broker's slot, a plate reads GM SOLD IT · ALLEGED", "the slot clacks", ""),
 (43, 5, 4, W("Verisk"), "stamp", "a Verisk plate", "slams onto the Broker's left slot", "focused", "VERISK",
  "a plate slams onto the Broker's left slot, a plate reads VERISK", "the plate rings", ""),
 (44, 5, 4, W("LexisNexis"), "stamp", "a LexisNexis plate", "slams onto the Broker's right slot", "focused", "LEXISNEXIS",
  "a plate slams onto the Broker's right slot, a plate reads LEXISNEXIS", "the plate rings", ""),
 (11, 5, 4, W("ratings"), "page", "driver rating sheets", "print out of the Broker and stack up", "focused", "DRIVER RATINGS",
  "driver rating sheets print out of the Broker and stack up, a plate reads DRIVER RATINGS", "the sheets stack", ""),
 (12, 5, 4, W("some"), "page", "insurer envelopes", "fly from the stack to small insurer houses along a belt", "reading", "TO INSURERS",
  "envelopes fly from the rating stack to small insurer houses along a belt with the key fob riding it, a plate reads TO INSURERS", "the belt runs", ""),
 (13, 5, 4, W("rates"), "clip", "a small tag", "flips on one house reading SOME INSURERS · IN PART", "wry", "SOME INSURERS · IN PART",
  "a tag flips on one insurer house reading SOME INSURERS · IN PART", "the tag swings", ""),
 (14, 6, 5, 0.0, "ping", "an Alaska card", "slides onto a top-down map of Alaska reading $2.5 MILLION", "reading", "ALASKA · $2.5 MILLION",
  "an Alaska card slides onto a top-down map of Alaska reading ALASKA · $2.5 MILLION while Clicky watches from the corner", "the card settles", ""),
 (36, 6, 5, 0.42, "tap", "a source tag", "pins to the card", "reading", "ALASKA DEPT OF LAW · VIA ALASKA'S NEWS SOURCE",
  "a source tag pins to the card, a plate reads ALASKA DEPT OF LAW · VIA ALASKA'S NEWS SOURCE", "the tag swings", ""),
 (15, 6, 5, W("how"), "pop", "a blank box", "opens beside the card with a pulsing question mark", "puzzled", "HOW MANY ALASKANS?",
  "a blank dotted box opens beside the Alaska card with a pulsing question mark, a plate reads HOW MANY ALASKANS?", "the box pulses", "plant: how many Alaskans were in the data"),
 (16, 7, 6, 0.06, "thud", "a phone", "shows the app toggle at NOT ENROLLED in magenta while teal data keeps pouring out of the back of it", "smug", "NOT ENROLLED",
  "a phone shows the app toggle at NOT ENROLLED in magenta while teal data keeps pouring out of the back of it, a plate reads NOT ENROLLED", "the data pours", ""),
 (48, 7, 6, 0.42, "rumble", "the teal data", "thickens into a river out of the phone while Clicky's dial shakes", "alarmed", "STILL COLLECTING",
  "the teal data thickens into a river out of the phone while Clicky's dial shakes, a plate reads STILL COLLECTING", "Clicky strains", "rehook: the teal data thickens into a river out of the phone while Clicky strains"),
 (17, 7, 6, W("seventy"), "knock", "a paper tower", "builds beside the phone to the 370,000 mark", "alarmed", "OVER 370,000 TOLD 'NOT ENROLLED'",
  "a tower of paper notices builds beside the phone to a mark reading OVER 370,000, a plate reads OVER 370,000 TOLD 'NOT ENROLLED'", "the tower sways", ""),
 (38, 7, 6, W("collected"), "stamp", "an ALLEGED stamp", "lands on the phone while the teal data keeps pouring out of it", "wry", "ALLEGED",
  "a magenta ALLEGED stamp lands on the phone while the teal data keeps pouring out of it, a plate reads ALLEGED", "the stamp lands", ""),
 (18, 7, 6, W("glitch"), "pop", "a wrench label", "shrugs onto the phone reading THE COMPLAINT BLAMES A GLITCH", "wry", "THE COMPLAINT BLAMES A GLITCH",
  "a wrench label shrugs onto the phone reading THE COMPLAINT BLAMES A GLITCH", "the wrench wobbles", ""),
 (19, 8, 7, 0.0, "page", "bone paper", "flips the scene to a quiet courtroom with a plate reading THE FAIR CASE", "somber", "THE FAIR CASE",
  "the scene flips to a quiet bone-paper courtroom diorama with Clicky on the rail, a plate reads THE FAIR CASE", "the paper settles", ""),
 (20, 8, 7, W("admitted"), "stamp", "StampBot", "slams a magenta NO ADMISSION stamp onto the docket", "focused", "NO ADMISSION · GM",
  "StampBot slams a magenta NO ADMISSION stamp onto the docket, a plate reads NO ADMISSION · GM", "the stamp recoils", ""),
 (21, 8, 7, W("claims"), "clunk", "a claims window", "shows a painted brick wall with a sign reading NO CLAIMS PROCESS", "somber", "NO CLAIMS PROCESS",
  "a claims window shows a painted brick wall with a sign reading NO CLAIMS PROCESS", "the wall holds", ""),
 (22, 8, 7, W("many"), "tick", "a blank box", "from the Alaska map slides onto the docket reading ALASKA DRIVERS AFFECTED NOT STATED", "puzzled", "ALASKA DRIVERS AFFECTED · NOT STATED",
  "the blank dotted box from the Alaska map slides onto the docket reading ALASKA DRIVERS AFFECTED · NOT STATED", "the box holds", ""),
 (23, 9, 8, 0.0, "thud", "insurer houses", "stand full of rating sheets with no gate in front of them and the dark fob in the corner", "somber", "THE ONE THING IT CAN'T DO",
  "the insurer houses from the belt stand full of rating sheets with no gate in front of them and the dark key fob in the corner, a plate reads THE ONE THING IT CAN'T DO", "the houses hum", ""),
 (42, 9, 8, 0.4, "clunk", "a coin", "rolls in from the right across the felt and stops short of an empty hand", "somber", "THE COIN STOPS SHORT",
  "a coin rolls in from the right across the felt and stops short of an empty open hand, a plate reads THE COIN STOPS SHORT", "the coin wobbles", ""),
 (24, 9, 8, 0.66, "clip", "the open hand", "sags as the coin tips over", "somber", "NO PAYOUT FOR DRIVERS",
  "the open hand sags as the coin tips over, a plate reads NO PAYOUT FOR DRIVERS", "the hand sags", ""),
 (41, 10, 9, 0.0, "slide", "bone paper", "sweeps off the screen like a passing page to reveal the dark cab and the teal stream running at a closed gate", "determined", "THE DOOR",
  "the bone paper sweeps off the screen like a passing page revealing the dark cab and the teal stream running at a closed gate, a plate reads THE DOOR", "the paper falls away", ""),
 (25, 10, 9, 0.18, "whoosh", "a consent gate", "slams its lever from COLLECT BY DEFAULT to ASK FIRST so the stream pools and Clicky stops clicking", "determined", "ASK FIRST",
  "a consent gate slams its lever from COLLECT BY DEFAULT to ASK FIRST so the teal stream pools against it and Clicky stops clicking while a sodium sweep crosses the frame, a plate reads ASK FIRST", "the lever slams", "rehook: the gate lever slams to ASK FIRST and Clicky stops clicking"),
 (26, 10, 9, W("yes"), "clunk", "a teal bolt", "slams into the gate reading A CLEAR YES", "determined", "A CLEAR YES",
  "a teal bolt slams into the gate reading A CLEAR YES, per the settlement", "the bolt rings", ""),
 (27, 11, 10, 0.0, "tap", "night road dots", "stretch along a timeline road, one dot for every drive recorded", "reading", "EVERY DOT KEPT",
  "dots stretch along a night road timeline, one for every drive recorded, a plate reads EVERY DOT KEPT", "the dots glow", "rehook: a new world, a night road timeline with a dot for every drive recorded"),
 (47, 11, 10, W("necessary"), "clink", "a needle", "is clamped by a thin band on a dial reading ONLY WHAT'S NEEDED", "determined", "ONLY WHAT'S NEEDED",
  "a needle on a dial is clamped by a thin band, a plate reads ONLY WHAT'S NEEDED", "the needle trembles", ""),
 (28, 11, 10, W("January"), "slide", "a cutoff line", "sweeps back along the timeline to JAN 16TH 2025", "reading", "BEFORE JAN 16TH, 2025",
  "a cutoff line sweeps back along the road timeline to JAN 16TH 2025, a plate reads BEFORE JAN 16TH, 2025", "the line sweeps", ""),
 (40, 11, 10, W("twenty-five"), "stamp", "the old dots", "blink out one by one behind the line leaving a few", "reading", "DELETE OLDER DATA · WITH EXCEPTIONS",
  "the dots before the line blink out one by one leaving a few, a plate reads DELETE OLDER DATA · WITH EXCEPTIONS", "the dots blink out", ""),
 (29, 12, 11, 0.0, "ping", "the closed gate", "stands in the cab with a plate THE DOOR", "proud", "THE DOOR · GM MUST ASK FIRST",
  "the closed gate stands shut in front of the dash, a plate reads THE DOOR · GM MUST ASK FIRST", "the gate hums", ""),
 (39, 12, 11, 0.38, "knock", "a gloved hand", "rises from the wheel toward the gate", "warm", "THE DRIVER",
  "a gloved driver's hand rises from the wheel toward the closed gate, a plate reads THE DRIVER", "the glove flexes", ""),
 (30, 12, 11, W("key"), "chime", "a car key", "lifts off the gate lever knob and drops into the driver's gloved hand reading YES?", "proud", "THE DRIVER HOLDS THE KEY",
  "the nickel key fob lifts off the gate lever knob and drops into the driver's gloved hand reading YES?, a plate reads THE DRIVER HOLDS THE KEY", "the key glints", ""),
 (31, 13, 12, 0.0, "pop", "the key", "wakes the driver's phone where COPY and DELETE buttons light up while the gate behind stays shut and the teal stream stays pooled", "warm", "ASK FOR A COPY · ASK FOR DELETION",
  "the key wakes the driver's phone where COPY and DELETE buttons light up while the gate behind stays shut and the teal stream stays pooled, a plate reads ASK FOR A COPY · ASK FOR DELETION", "the buttons glow", ""),
 (32, 13, 12, W("delete"), "blip", "the gloved hand", "slides back and forth between COPY and DELETE without pressing", "warm", "YOUR DATA · YOUR CALL",
  "the gloved hand slides back and forth between COPY and DELETE without pressing, a plate reads YOUR DATA · YOUR CALL", "the glove lifts", ""),
 (33, 13, 13, 0.0, "thock", "the key fob", "settles blank into the dotted square while Clicky waits silent", "warm", "COPY FIRST OR DELETE?",
  "the key fob settles into the blank dotted square reading YOUR CALL while Clicky waits silent, a plate reads COPY FIRST OR DELETE?", "Clicky waits", ""),
 (45, 13, 13, 0.62, "ping", "the ring pulse", "stays off until the gloved hand moves and then fires once", "warm", "YOUR CALL",
  "the ring pulse stays off until the gloved hand moves and then fires once, a plate reads YOUR CALL", "the ring fires", ""),
]

S = [
 (1, 0, "subject-portrait", "medium", "eye", "moving-night-cab", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "instrument-as-subject", "", "", "The diary", "Clicky on the dash of a moving night cab with the driver's gloved hands on the wheel, the key fob in the ignition and a ledger diary unrolling 2016 to 2024."),
 (2, 1, "data-panel", "insert", "ground", "ledger-counter", "macro-closeup", "grid-modular", "vertical-rise", "data-as-subject", "hard-cut", "match", "$220 million", "A coin stack under a sodium-lit counter and 36 name cards slapping onto a rail with the Alaska card lifting."),
 (3, 2, "two-up", "medium", "eye", "two-envelopes", "exploded-diagram", "fullbleed-split", "radial-emanate", "structure-as-subject", "whip-pan", "travel", "The question", "Two sealed envelopes, ONE THING FIXED and ONE THING CAN'T, with the key fob between them."),
 (4, 3, "alt-vantage", "wide", "high", "cab-gauges", "instrument-screen", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "match-cut", "match", "The gauges", "A moose in the headlights, the cab brakes, three gauges flinch and a ring pulse every three seconds pulls back to a night city of dots."),
 (5, 4, "wide-establish", "wide", "low", "broker-belt", "cross-section-cutaway", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "carried-element", "carry", "The Broker", "The teal page rides into a Broker machine, Verisk and LexisNexis plates slam on, rating sheets print and a belt carries envelopes to insurer houses."),
 (6, 5, "map-territory", "extreme-wide", "high", "alaska-map", "top-down-map", "map-territory", "push-in-only", "landscape-as-subject", "map-travel", "travel", "Alaska's share", "A top-down map of Alaska with a $2.5 million card, a source tag and a blank box with a question mark."),
 (7, 6, "push-detail", "close", "low", "phone-toggle", "macro-closeup", "single-object-void", "vertical-descent", "single-organic-hero", "hard-cut", "match", "Not enrolled", "A phone with the app toggle at NOT ENROLLED while teal data pours out the back, a paper tower, an ALLEGED stamp and a glitch wrench."),
 (8, 7, "two-up", "medium", "eye", "courtroom", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "mask-wipe", "travel", "The courtroom", "A bone-paper courtroom with StampBot, a brick-wall claims window, a docket and the blank Alaska box landing, with Clicky on the rail."),
 (9, 8, "subject-portrait", "close", "eye", "full-houses", "exploded-diagram", "stacked-layers", "scroll-data", "multiplicity-swarm", "match-cut", "carry", "The houses", "The insurer houses full of rating sheets with no gate in front of them and an empty open hand with a coin that stops short."),
 (10, 9, "alt-vantage", "wide", "low", "consent-gate", "cross-section-cutaway", "centered-hero-lowerthird", "assemble-build", "structure-as-subject", "mask-wipe", "travel", "The gate", "The bone paper sweeps off to the dark cab, the stream runs at a closed gate, the lever slams to ASK FIRST and Clicky goes silent."),
 (11, 10, "data-panel", "medium", "high", "road-timeline", "top-down-map", "grid-modular", "scroll-data", "multiplicity-swarm", "match-cut", "match", "Delete the old dots", "A night road timeline of dots, a dial clamping the needle, a cutoff line sweeping back to January 16th, 2025 and old dots blinking out."),
 (12, 11, "subject-portrait", "close", "eye", "key-to-hand", "macro-closeup", "single-object-void", "vertical-descent", "single-organic-hero", "hard-cut", "match", "The key", "The closed gate, the driver's gloved hand rising and the nickel fob lifting off the lever knob into it."),
 (13, 12, "wide-establish", "wide", "low", "driver-phone", "instrument-screen", "hud-instrument-frame", "push-in-only", "instrument-as-subject", "carried-element", "carry", "Copy or delete", "The driver's phone lights COPY and DELETE while the gate stays shut and Clicky waits silent, the glove hovers and the fob settles blank into the dotted square."),
]

AMBIENT = {1: "the ring pulses, dash lights glow, Clicky breathes", 2: "the coins settle, the cards tick, the Alaska card glows", 3: "the envelopes rock, the fob glints",
           4: "the needles tremble, the dots drop, the ring pulses", 5: "the belt runs, the Broker works, the sheets rustle", 6: "the map glows, the pin pulses, the box pulses",
           7: "the data leaks, the tower sways, the sign wobbles", 8: "paper dust drifts, the stamp rings, the docket settles", 9: "the houses hum, the hand trembles",
           10: "the lever creaks, the bolt rings, the gate hums", 11: "the dots glow, the dial trembles, the old dots blink out", 12: "the gate hums, the fob glints",
           13: "the buttons glow, the glove hovers, Clicky waits"}
CENTER = {1: "Clicky at x540 y1000", 2: "the counter at x540 y1010", 3: "the envelopes at x540 y1000", 4: "the middle gauge at x540 y1000", 5: "the Broker at x540 y1000", 6: "Alaska at x540 y1020",
          7: "the sign at x540 y1000", 8: "StampBot at x540 y1000", 9: "the fob at x540 y1000", 10: "the gate at x540 y1010", 11: "the calendar at x540 y1000", 12: "the key at x540 y1010", 13: "Clicky at x540 y1000"}
HERO = {
 1: ("Clicky + moving night cab + gloved hands + signature square + key fob + ledger", "35% Clicky, 25% dash, 20% ledger, 20% token"),
 2: ("coin stack + flip counter + 36 name cards + D.C. card + Alaska card", "30% coins, 25% counter, 25% cards, 20% map"),
 3: ("two envelopes + desk + token", "40% envelopes, 30% desk, 30% token"),
 4: ("three gauges + ring pulse + dotted map trail", "40% gauges, 30% ring, 30% trail"),
 5: ("Broker machine + page + rating sheets + belt + insurer houses", "30% Broker, 25% sheets, 25% belt, 20% houses"),
 6: ("top-down Alaska map + $2.5M card + blank box", "50% map, 25% card, 25% box"),
 7: ("NOT ENROLLED sign + tiny hand + data leak + paper tower + wrench label", "30% sign, 25% leak, 25% tower, 20% label"),
 8: ("courtroom + StampBot + brick-wall claims window + docket + blank box", "30% StampBot, 30% window, 20% docket, 20% box"),
 9: ("insurer houses + CAN'T envelope + empty gloved hand + coin", "50% token, 35% hand, 15% coin"),
 10: ("gate + lever + teal bolt + paper flip", "40% gate, 25% lever, 20% bolt, 15% paper"),
 11: ("night road timeline + dots + dial + cutoff line", "30% bolt, 30% calendar, 25% pile, 15% sheets"),
 12: ("closed gate + FIXED envelope + nickel fob + driver's gloved hand", "30% gate, 25% thread, 25% key, 20% hand"),
 13: ("driver phone + COPY and DELETE buttons + Clicky + fob + signature square", "30% Clicky, 30% buttons, 20% token, 20% square"),
}
PARTS = {1: 44, 2: 46, 3: 36, 4: 40, 5: 58, 6: 44, 7: 48, 8: 54, 9: 30, 10: 42, 11: 44, 12: 38, 13: 44}
KICKS = (16, 30)
STAGE3D = {k: "planes" for k in HERO}
CAMERA = {1: "craneDown+dollyThrough", 2: "dollyThrough", 3: "truckAcross", 4: "dollyThrough", 5: "truckAcross", 6: "craneDown", 7: "dollyThrough", 8: "dollyThrough", 9: "dollyThrough", 10: "craneDown+dollyThrough", 11: "truckAcross", 12: "dollyThrough", 13: "craneDown+dollyThrough"}


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
        if ', a plate reads ' in shows:
            ann = shows.split(', a plate reads ')[-1].strip().rstrip('.')
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
        nx = beats[i + 1]["at_s"] if i + 1 < len(beats) else end + 3.0
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

    palette = "midnight indigo cab interior, sodium amber glow, an electric teal stream, a gunmetal counter, bone courtroom paper and magenta warning stamps"
    board = {
        "run_date": "2026-11-02", "slug": "the-door-is-yours", "title": "The Door Is Yours",
        "concept": ("Thirty-six attorneys general, Alaska among them, settled with General Motors for $220 million over its Smart Driver program, which the complaint says logged hard braking, late-night driving and location every three seconds, sold it to Verisk and LexisNexis, who built driver ratings for insurers, some of whom used them in part to set rates. "
                    "The complaint says more than 370,000 people were told they weren't enrolled while data was collected. GM admitted no violation of law, there is no claims process for drivers, and the count of Alaska drivers is not stated. "
                    "The one thing the settlement fixes is the door: a driver's clear yes before collection or sharing, only what's reasonably necessary, and deletion of data kept from before January 16th, 2025. Drivers can ask GM for a copy or for deletion. "
                    "A gunmetal counter named Clicky is the hero and a nickel key fob is the throughline, ending as YOUR CALL in the blank signature square."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "radial-emanate", "hero_treatment": "instrument-as-subject", "layout": "hud-instrument-frame",
                        "register": "tactile-collage", "palette": palette, "camera_strategy": "track-follow",
                        "light_story": "night-practical",
                        "metaphor": "a gunmetal counter that clicks every three seconds and a consent gate that finally waits for a yes, with a key fob carrying the question from ENROLLED? to YES"},
        "palette": palette,
        "divergence_note": ("The last five films were an overcast moss slope (11-01), a sage-and-cream chart desk (10-31), an aubergine dusk depot (10-29), a green-black sonar abyss (10-28) and a sage civic hall (10-26). "
                            "This film is a night dashboard of blue-black with sodium-amber light and a teal data stream, with bone paper only in the courtroom shots and a single signal-magenta accent. Its hero is a gunmetal hand counter with eyes, "
                            "and it has no slope, no desk, no depot, no sea cutaway and no hall. The signature object is a key fob that changes its engraving at every act boundary and settles YES into a blank signature square."),
        "treatment": {"title": "The Diary With No Signature Line", "summary": "Comedian's Clicky, with the Dramatist's dark fob and fair-case scene and the Explainer's pipeline, closing on the Enthusiast's door is yours."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "Clicky, a gunmetal hand counter with eyes, clicks once on a night dashboard as a teal ring pulses off it beside a blank dotted signature square, a plate reads SMART DRIVER, ALLEGED.",
                 "headline": "A DIARY, ALLEGED", "motion_by_s": 0.3,
                 "loopback": "Clicky clicks once more and the fob drops into the blank signature square, rhyming with the opening click and the empty dotted square."},
        "open_loop": {"plant_t": b_at(7), "pay_t": b_at(29), "what": "What is the one thing the settlement fixes and the one thing it can't? Planted with the two sealed envelopes, paid in halves, the can't at the dark fob and the fixes at the gate opening a crack."},
        "open_loop_2": {"plant_t": b_at(14), "pay_t": b_at(22), "what": "How many Alaskans were in the data? Planted with the blank box on the Alaska map, paid when the courtroom box reads NOT STATED."},
        "throughline": {"object": "a nickel key fob", "lands_in_button": "the fob drops into the blank dotted signature square reading YES OR NO, the film's argument",
                        "states": [
                            {"at_s": b_at(2), "state": "engraved ENROLLED?"},
                            {"at_s": b_at(7), "state": "flips to a question mark between the two envelopes"},
                            {"at_s": b_at(16), "state": "tag reading NOT ENROLLED while still blinking teal"},
                            {"at_s": b_at(23), "state": "dark and unlit in the corner while the houses stand full"},
                            {"at_s": b_at(26), "state": "swung to the gate lever knob reading ASK FIRST"},
                            {"at_s": b_at(30), "state": "flipped to YES? in the driver's hand"},
                            {"at_s": b_at(33), "state": "settled blank into the dotted signature square reading YOUR CALL"}]},
        "reveals": [
            {"t": b_at(9), "type": "scale-pullback", "what": "from one drive's dots to a whole night city of dots", "hold_s": 0.8},
            {"t": b_at(17), "type": "build-on", "what": "a paper tower builds beside the NOT ENROLLED sign to the 370,000 mark", "hold_s": 0.8},
            {"t": b_at(40), "type": "morph-to-chart", "what": "the road timeline of dots blinks out behind the January 16th, 2025 line", "hold_s": 0.8},
            {"t": b_at(31), "type": "scale-pullback", "what": "from the key in the lock to the whole cab with the gate swung open", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 0, "offset": 3.0, "level": 1.2}, {"line": 2, "offset": 0.0, "level": 0.5},
            {"line": 3, "offset": 0.0, "level": 1.2}, {"line": 5, "offset": 0.0, "level": 1.1}, {"line": 6, "offset": 0.0, "level": 0.9},
            {"line": 7, "offset": 0.0, "level": 0.2}, {"line": 8, "offset": 0.0, "level": 0.16}, {"line": 9, "offset": 0.0, "level": 1.25},
            {"line": 10, "offset": 0.0, "level": 0.8},
            {"at_s": round(b_at(29) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(29) + 0.8, 3), "level": 0.6},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(29) - 0.3, 3), "riser_at": round(b_at(28), 3), "silence_at": round(b_at(29) - 0.3, 3),
                      "payoff_at": b_at(29), "button_pattern": "callback", "interrupt_at": b_at(19), "extra_dips": [b_at(25)]},
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
    book.raise_if_missing("board_1102 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1102Ids.ts").write_text(
        "// GENERATED by scripts/board_1102.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
