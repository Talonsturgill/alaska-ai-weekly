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
 (1, 1, 0, 0.0, "whoosh", "Clicky the brass counter", "sits on a night dashboard and clicks once as a teal ring pulses off it beside a blank dotted signature square", "wry", "SMART DRIVER · ALLEGED",
  "Clicky, a brass hand counter with eyes, on a blue-black night dashboard clicks once as a teal ring pulses off it beside a blank dotted signature square, a plate reads SMART DRIVER, ALLEGED", "the ring pulses", ""),
 (2, 1, 0, W("Smart"), "tick", "a brass token", "drops onto the dash beside Clicky engraved ENROLLED?", "curious", "ENROLLED?",
  "a scalloped brass token drops onto the dash beside Clicky engraved ENROLLED?", "the token rocks", ""),
 (3, 1, 0, W("diary"), "page", "a diary ledger", "opens beside Clicky with ruled rows ticking down from 2016 to 2024", "wry", "2016 TO 2024 · PER THE ATTORNEYS GENERAL",
  "a ledger diary opens beside Clicky with ruled rows ticking down from 2016 to 2024, a plate reads 2016 TO 2024 PER THE ATTORNEYS GENERAL", "the rows tick", ""),
 (4, 2, 1, 0.0, "ding", "a coin stack", "builds under a brass flip counter that rolls up to $220 million", "reading", "$220 MILLION · GM",
  "a coin stack builds under a brass flip counter rolling up to $220 MILLION, a plate reads GM TO PAY, PER THE SETTLEMENT", "the coins settle", ""),
 (5, 2, 1, W("thirty-six"), "stamp", "36 name cards", "slap onto a rail one after another", "reading", "36 ATTORNEYS GENERAL",
  "thirty-six small name cards slap onto a rail one after another, a plate reads 36 ATTORNEYS GENERAL", "the cards settle", ""),
 (6, 2, 1, W("Alaska"), "tick", "an Alaska pin", "pulses and the cards pull back to a mini map of the states with Alaska lit", "proud", "ALASKA IN",
  "the cards pull back into a mini map of the states with an Alaska pin pulsing, a plate reads ALASKA IN", "the pin pulses", ""),
 (7, 3, 2, 0.0, "swish", "two sealed envelopes", "slide onto the desk labelled ONE THING FIXED and ONE THING CAN'T while the token flips to a question mark", "curious", "ONE THING FIXED · ONE THING CAN'T",
  "two sealed envelopes slide onto a desk labelled ONE THING FIXED and ONE THING CAN'T while the token flips to a question mark", "the envelopes rock", "plant: the one thing it fixes and the one thing it can't"),
 (8, 4, 3, 0.0, "snap", "three dash gauges", "flinch in a row as the camera whips into the dash", "alarmed", "HARD BRAKING · LATE-NIGHT",
  "three round dash gauges flinch in a row as the camera whips into the dash, plates read HARD BRAKING and LATE-NIGHT DRIVING", "the needles flinch", "rehook: the whip-pan into three flinching dash gauges"),
 (9, 4, 3, W("location"), "tick", "a ring pulse", "fires every three seconds from Clicky over a map trail of dots", "alarmed", "LOCATION EVERY 3 SECONDS",
  "a teal ring pulse fires every three seconds from Clicky over a map trail of dots, a plate reads LOCATION EVERY 3 SECONDS", "the dots drop", ""),
 (10, 5, 4, 0.0, "clank", "the Broker", "a copper server machine takes a page from Clicky and drools", "greedy", "VERISK · LEXISNEXIS · ALLEGED",
  "a copper server machine with eyes takes a page from Clicky and drools, a plate reads VERISK, LEXISNEXIS, ALLEGED", "the Broker drools", ""),
 (11, 5, 4, W("ratings"), "stamp", "driver rating sheets", "print out of the Broker and stack up", "focused", "DRIVER RATINGS",
  "driver rating sheets print out of the Broker and stack up, a plate reads DRIVER RATINGS", "the sheets stack", ""),
 (12, 5, 4, W("insurers"), "paper", "insurer envelopes", "fly from the stack to small insurer houses along a belt", "reading", "TO INSURERS",
  "envelopes fly from the rating stack to small insurer houses along a belt, a plate reads TO INSURERS", "the belt runs", ""),
 (13, 5, 4, W("part"), "tick", "a small tag", "flips on one house reading SOME INSURERS · IN PART · TO SET RATES", "wry", "SOME INSURERS · IN PART",
  "a tag flips on one insurer house reading SOME INSURERS · IN PART", "the tag swings", ""),
 (14, 6, 5, 0.0, "ding", "an Alaska card", "slides onto a top-down map of Alaska reading $2.5 MILLION per the Alaska Department of Law", "reading", "ALASKA · $2.5 MILLION",
  "an Alaska card slides onto a top-down map of Alaska reading ALASKA · $2.5 MILLION", "the card settles", ""),
 (15, 6, 5, W("how"), "pop", "a blank box", "opens beside the card with a pulsing question mark", "puzzled", "HOW MANY ALASKANS?",
  "a blank dotted box opens beside the Alaska card with a pulsing question mark, a plate reads HOW MANY ALASKANS?", "the box pulses", "plant: how many Alaskans were in the data"),
 (16, 7, 6, 0.0, "thud", "a NOT ENROLLED sign", "is held up in a tiny hand while teal data leaks under it", "smug", "NOT ENROLLED",
  "a vermilion NOT ENROLLED sign is held up in a tiny hand while teal data leaks under it and the token cracks to NOT ENROLLED", "the data leaks", ""),
 (17, 7, 6, W("seventy"), "tick", "a paper tower", "builds beside the sign to the 370,000 mark", "alarmed", "OVER 370,000 TOLD 'NOT ENROLLED'",
  "a tower of paper notices builds beside the sign to a mark reading OVER 370,000, a plate reads OVER 370,000 TOLD NOT ENROLLED, ALLEGED", "the tower sways", ""),
 (18, 7, 6, W("glitch"), "pop", "a wrench label", "shrugs onto the sign reading THE COMPLAINT BLAMES A GLITCH", "wry", "THE COMPLAINT BLAMES A GLITCH",
  "a wrench label shrugs onto the sign reading THE COMPLAINT BLAMES A GLITCH", "the wrench wobbles", ""),
 (19, 8, 7, 0.0, "page", "bone paper", "flips the scene to a quiet courtroom with a plate reading THE FAIR CASE", "somber", "THE FAIR CASE",
  "the scene flips to a quiet bone-paper courtroom diorama, a plate reads THE FAIR CASE", "the paper settles", ""),
 (20, 8, 7, W("admitted"), "stamp", "StampBot", "slams a vermilion NO ADMISSION stamp onto the docket", "smug", "NO ADMISSION · GM",
  "StampBot slams a vermilion NO ADMISSION stamp onto the docket, a plate reads GM ADMITTED NO VIOLATION OF LAW", "the stamp recoils", ""),
 (21, 8, 7, W("claims"), "clunk", "a claims window", "shows a painted brick wall with a sign reading NO CLAIMS PROCESS", "somber", "NO CLAIMS PROCESS",
  "a claims window shows a painted brick wall with a sign reading NO CLAIMS PROCESS", "the wall holds", ""),
 (22, 8, 7, W("many"), "tick", "a blank box", "from the Alaska map reads ALASKA DRIVERS AFFECTED NOT STATED", "puzzled", "ALASKA DRIVERS AFFECTED · NOT STATED",
  "the blank dotted box from the Alaska map slides onto the docket reading ALASKA DRIVERS AFFECTED, NOT STATED", "the box holds", ""),
 (23, 9, 8, 0.0, "thud", "the brass token", "cracks across its face and reads CAN'T", "somber", "THE ONE THING IT CAN'T",
  "the brass token cracks across its face and reads CAN'T in a held close-up, a plate reads THE ONE THING IT CAN'T DO", "the crack spreads", ""),
 (24, 9, 8, 0.55, "drip", "an empty hand", "reaches for a coin that never arrives", "somber", "NO PAYOUT FOR DRIVERS",
  "an open empty hand reaches for a coin that never arrives, a plate reads NO PAYOUT FOR DRIVERS ALREADY RECORDED", "the hand sags", ""),
 (25, 10, 9, 0.18, "whoosh", "a consent gate", "flips in from the paper and a lever swings from COLLECT BY DEFAULT to ASK FIRST", "determined", "ASK FIRST",
  "the paper flips to the dark dash and a gate with a lever swings from COLLECT BY DEFAULT to ASK FIRST, a plate reads ASK FIRST", "the lever swings", "rehook: the paper flips and the gate lever slams to ASK FIRST"),
 (26, 10, 9, W("yes"), "clunk", "a teal bolt", "slams into the gate reading A CLEAR YES", "determined", "A CLEAR YES",
  "a teal bolt slams into the gate reading A CLEAR YES, per the settlement", "the bolt rings", ""),
 (27, 11, 10, 0.0, "clank", "a second bolt", "locks beside the first reading ONLY WHAT'S NEEDED", "determined", "ONLY WHAT'S NEEDED",
  "a second bolt locks beside the first reading ONLY WHAT'S NEEDED", "the bolt rings", ""),
 (28, 11, 10, W("delete"), "swish", "a calendar", "flips back to January 16th, 2025 and a pile of old data shrinks with a few sheets left", "reading", "BEFORE JAN 16TH, 2025 · DELETE",
  "a calendar flips back to JAN 16TH 2025 and the pile of old data shrinks leaving a few sheets, a plate reads DELETE WITH SOME EXCEPTIONS", "the pile shrinks", ""),
 (29, 12, 11, 0.0, "ding", "the gate", "swings open only a crack with a teal thread running through", "proud", "THE DOOR · CAN GM COLLECT AT ALL?",
  "the gate swings open only a crack with the teal thread running through it, a plate reads THE DOOR, WHETHER GM CAN COLLECT AT ALL", "the thread glows", ""),
 (30, 12, 11, W("key"), "chime", "a brass key", "drops into the driver's hand as the token reads YES?", "proud", "THE DRIVER HOLDS THE KEY",
  "a brass key drops into a driver's small hand as the token flips to YES?, a plate reads THE DRIVER HOLDS THE KEY", "the key glints", ""),
 (31, 13, 12, 0.0, "click", "two buttons", "COPY and DELETE rise on the dash under Clicky", "warm", "ASK FOR A COPY · ASK FOR DELETION",
  "two big buttons labelled COPY and DELETE rise on the dash under Clicky, a plate reads ASK GM FOR YOUR COPY OR DELETION", "the buttons glow", ""),
 (32, 13, 12, W("delete"), "tick", "a finger", "presses DELETE and a ring pulse fades", "warm", "YOUR DATA · YOUR CALL",
  "a finger presses DELETE and the teal ring pulse fades", "the ring fades", ""),
 (33, 13, 13, 0.0, "click", "Clicky", "clicks once and the token drops YES into the blank signature square", "warm", "YES · OR NO",
  "Clicky clicks once and the brass token drops into the blank dotted signature square, a plate reads YES OR NO", "Clicky smiles", ""),
 (34, 3, 2, 0.55, "creak", "the CAN'T envelope", "rattles and a thin crack of light shows under its flap", "curious", "ONE THING CAN'T",
  "the CAN'T envelope rattles on the desk and a thin crack of light shows under its flap, a plate reads ONE THING CAN'T", "the flap rattles", ""),
 (35, 4, 3, 0.42, "tick", "the late-night gauge", "swings its needle into a crescent moon zone while the dash lights dim", "alarmed", "LATE-NIGHT DRIVING",
  "the late-night gauge swings its needle into a crescent moon zone while the dash lights dim, a plate reads LATE-NIGHT DRIVING", "the needle quivers", ""),
 (36, 6, 5, 0.42, "ping", "a pin", "drops onto Anchorage on the Alaska map and the card tags it ALASKA DEPARTMENT OF LAW", "reading", "ALASKA DEPARTMENT OF LAW",
  "a pin drops onto Anchorage on the Alaska map and the card tags it ALASKA DEPARTMENT OF LAW", "the pin pulses", ""),
 (37, 7, 6, 0.45, "whoosh", "a phone", "slides into frame showing the app toggle flipped to NOT ENROLLED while teal data keeps flowing out of it", "smug", "THE APP SAID NOT ENROLLED",
  "a phone slides in showing the app toggle flipped to NOT ENROLLED while teal data keeps flowing out of the back of it, a plate reads THE APP SAID NOT ENROLLED", "the toggle slips", "rehook: a phone slides in saying NOT ENROLLED while teal data pours out the back"),
 (38, 7, 6, 0.76, "tick", "a dealer hand", "reaches in and taps the phone enrolled for the customer", "wry", "ALLEGED",
  "a small dealer hand reaches in and taps the phone toggle on for the customer, a vermilion ALLEGED stamp lands beside it", "the stamp lands", ""),
 (39, 12, 11, 0.38, "ding", "the open crack", "widens a hand's width as the teal thread brightens", "proud", "WHETHER GM CAN COLLECT AT ALL",
  "the gate crack widens a hand's width as the teal thread brightens", "the thread brightens", ""),
 (40, 11, 10, 0.88, "tick", "a few sheets", "settle in the shrunk pile marked EXCEPTIONS", "reading", "WITH SOME EXCEPTIONS",
  "a few sheets settle in the shrunk pile marked EXCEPTIONS", "the sheets settle", ""),
]

S = [
 (1, 0, "subject-portrait", "medium", "eye", "night-dash", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "", "The diary", "Clicky on a night dash with a blank signature square, the ENROLLED? token and a ledger diary ticking 2016 to 2024."),
 (2, 1, "data-panel", "insert", "ground", "ledger-counter", "macro-closeup", "grid-modular", "vertical-rise", "data-as-subject", "hard-cut", "match", "$220 million", "A coin stack under a brass counter, 36 name cards on a rail and an Alaska pin on a mini map."),
 (3, 2, "two-up", "medium", "eye", "two-envelopes", "exploded-diagram", "fullbleed-split", "radial-emanate", "structure-as-subject", "whip-pan", "travel", "The question", "Two sealed envelopes, ONE THING FIXED and ONE THING CAN'T, with the token a question mark."),
 (4, 3, "alt-vantage", "wide", "high", "dash-gauges", "instrument-screen", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "match-cut", "match", "The gauges", "A whip into three flinching dash gauges and a ring pulse every three seconds over a dotted map trail."),
 (5, 4, "wide-establish", "wide", "low", "broker-belt", "cross-section-cutaway", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "carried-element", "carry", "The Broker", "A copper Broker machine takes a page, prints rating sheets, a belt carries envelopes to insurer houses."),
 (6, 5, "map-territory", "extreme-wide", "high", "alaska-map", "top-down-map", "map-territory", "push-in-only", "landscape-as-subject", "map-travel", "travel", "Alaska's share", "A top-down map of Alaska, a $2.5 million card and a blank box with a question mark."),
 (7, 6, "push-detail", "close", "low", "enrolled-sign", "macro-closeup", "single-object-void", "vertical-descent", "single-organic-hero", "hard-cut", "match", "Not enrolled", "A vermilion NOT ENROLLED sign held by a tiny hand, data leaking under it, a paper tower and a glitch wrench."),
 (8, 7, "two-up", "medium", "eye", "courtroom", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "hard-cut", "match", "The courtroom", "A bone-paper courtroom with StampBot, a brick-wall claims window and a blank Alaska box."),
 (9, 8, "subject-portrait", "close", "eye", "empty-counter", "macro-closeup", "single-object-void", "push-in-only", "data-as-subject", "match-cut", "match", "The empty hand", "A cracked brass token CAN'T and an open empty hand reaching for a coin that never arrives."),
 (10, 9, "alt-vantage", "wide", "low", "consent-gate", "cross-section-cutaway", "centered-hero-lowerthird", "assemble-build", "structure-as-subject", "whip-pan", "travel", "The gate", "The paper flips to the dark dash, a consent gate lever swings to ASK FIRST and a teal bolt slams in."),
 (11, 10, "data-panel", "medium", "high", "bolts-calendar", "exploded-diagram", "grid-modular", "scroll-data", "data-as-subject", "carried-element", "carry", "Two more bolts", "A second bolt and a calendar flipping back to January 16th, 2025 as an old pile of data shrinks."),
 (12, 11, "subject-portrait", "close", "eye", "key-to-door", "eye-level-immersive", "centered-hero-lowerthird", "vertical-descent", "single-organic-hero", "match-cut", "match", "The key", "The gate opens a crack with a teal thread and a brass key drops into the driver's hand."),
 (13, 12, "wide-establish", "wide", "low", "final-dash", "instrument-screen", "hud-instrument-frame", "push-in-only", "instrument-as-subject", "carried-element", "carry", "Copy or delete", "COPY and DELETE buttons under Clicky and the token YES drops into the blank signature square."),
]

AMBIENT = {1: "the ring pulses, dash lights glow, Clicky breathes", 2: "the coins settle, the cards tick, the pin pulses", 3: "the envelopes rock, the token glints",
           4: "the needles tremble, the dots drop, the ring pulses", 5: "the belt runs, the Broker drools, the sheets rustle", 6: "the map glows, the pin pulses, the box pulses",
           7: "the data leaks, the tower sways, the sign wobbles", 8: "paper dust drifts, the stamp rings, the docket settles", 9: "the crack spreads, the hand trembles",
           10: "the lever creaks, the bolt rings, the gate hums", 11: "the bolts ring, the calendar flips, the pile shrinks", 12: "the thread glows, the key glints",
           13: "the buttons glow, the ring fades, Clicky breathes"}
CENTER = {1: "Clicky at x540 y1000", 2: "the counter at x540 y1010", 3: "the envelopes at x540 y1000", 4: "the middle gauge at x540 y1000", 5: "the Broker at x540 y1000", 6: "Alaska at x540 y1020",
          7: "the sign at x540 y1000", 8: "StampBot at x540 y1000", 9: "the token at x540 y1000", 10: "the gate at x540 y1010", 11: "the calendar at x540 y1000", 12: "the key at x540 y1010", 13: "Clicky at x540 y1000"}
HERO = {
 1: ("Clicky + dash + signature square + token + ledger", "35% Clicky, 25% dash, 20% ledger, 20% token"),
 2: ("coin stack + flip counter + 36 cards + mini map", "30% coins, 25% counter, 25% cards, 20% map"),
 3: ("two envelopes + desk + token", "40% envelopes, 30% desk, 30% token"),
 4: ("three gauges + ring pulse + dotted map trail", "40% gauges, 30% ring, 30% trail"),
 5: ("Broker machine + page + rating sheets + belt + insurer houses", "30% Broker, 25% sheets, 25% belt, 20% houses"),
 6: ("top-down Alaska map + $2.5M card + blank box", "50% map, 25% card, 25% box"),
 7: ("NOT ENROLLED sign + tiny hand + data leak + paper tower + wrench label", "30% sign, 25% leak, 25% tower, 20% label"),
 8: ("courtroom + StampBot + brick-wall claims window + docket + blank box", "30% StampBot, 30% window, 20% docket, 20% box"),
 9: ("cracked token + empty hand + coin", "50% token, 35% hand, 15% coin"),
 10: ("gate + lever + teal bolt + paper flip", "40% gate, 25% lever, 20% bolt, 15% paper"),
 11: ("second bolt + calendar + data pile + sheets", "30% bolt, 30% calendar, 25% pile, 15% sheets"),
 12: ("gate crack + teal thread + brass key + driver's hand", "30% gate, 25% thread, 25% key, 20% hand"),
 13: ("Clicky + COPY and DELETE buttons + token + signature square", "30% Clicky, 30% buttons, 20% token, 20% square"),
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

    palette = "midnight indigo road cab, sodium-lamp amber glow, an electric teal data stream, bone paper only in one courtroom and a signal-magenta accent on ALLEGED stamps and the NOT ENROLLED sign"
    board = {
        "run_date": "2026-11-02", "slug": "the-door-is-yours", "title": "The Door Is Yours",
        "concept": ("Thirty-six attorneys general, Alaska among them, settled with General Motors for $220 million over its Smart Driver program, which the complaint says logged hard braking, late-night driving and location every three seconds, sold it to Verisk and LexisNexis, who built driver ratings for insurers, some of whom used them in part to set rates. "
                    "The complaint says more than 370,000 people were told they weren't enrolled while data was collected. GM admitted no violation of law, there is no claims process for drivers, and the count of Alaska drivers is not stated. "
                    "The one thing the settlement fixes is the door: a driver's clear yes before collection or sharing, only what's reasonably necessary, and deletion of data kept from before January 16th, 2025. Drivers can ask GM for a copy or for deletion. "
                    "A brass counter named Clicky is the hero and a brass token is the throughline, ending as YES in the blank signature square."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "radial-emanate", "hero_treatment": "instrument-as-subject", "layout": "hud-instrument-frame",
                        "register": "tactile-collage", "palette": palette, "camera_strategy": "track-follow",
                        "light_story": "night-practical",
                        "metaphor": "a brass counter that clicks every three seconds and a consent gate that finally waits for a yes, with a brass token carrying the question from ENROLLED? to YES"},
        "palette": palette,
        "divergence_note": ("The last five films were an overcast moss slope (11-01), a sage-and-cream chart desk (10-31), an aubergine dusk depot (10-29), a green-black sonar abyss (10-28) and a sage civic hall (10-26). "
                            "This film is a night dashboard of blue-black with brass instrument glow and a teal data stream, with bone paper only in one courtroom shot and a single vermilion accent. Its hero is a brass hand counter with eyes, "
                            "and it has no slope, no desk, no depot, no sea cutaway and no hall. The signature object is a brass token that changes its engraving at every act boundary and drops YES into a blank signature square."),
        "treatment": {"title": "The Diary With No Signature Line", "summary": "Comedian's Clicky, with the Dramatist's cracked token and fair-case scene and the Explainer's pipeline, closing on the Enthusiast's door is yours."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "Clicky, a brass hand counter with eyes, clicks once on a night dashboard as a teal ring pulses off it beside a blank dotted signature square, a plate reads SMART DRIVER, ALLEGED.",
                 "headline": "A DIARY, ALLEGED", "motion_by_s": 0.3,
                 "loopback": "Clicky clicks once more and the token drops into the blank signature square, rhyming with the opening click and the empty dotted square."},
        "open_loop": {"plant_t": b_at(7), "pay_t": b_at(29), "what": "What is the one thing the settlement fixes and the one thing it can't? Planted with the two sealed envelopes, paid in halves, the can't at the cracked token and the fixes at the gate opening a crack."},
        "open_loop_2": {"plant_t": b_at(15), "pay_t": b_at(22), "what": "How many Alaskans were in the data? Planted with the blank box on the Alaska map, paid when the courtroom box reads NOT STATED."},
        "throughline": {"object": "a brass token", "lands_in_button": "the token drops into the blank dotted signature square reading YES OR NO, the film's argument",
                        "states": [
                            {"at_s": b_at(2), "state": "engraved ENROLLED?"},
                            {"at_s": b_at(7), "state": "flips to a question mark between the two envelopes"},
                            {"at_s": b_at(16), "state": "cracked and reading NOT ENROLLED"},
                            {"at_s": b_at(23), "state": "cracked across its face reading CAN'T"},
                            {"at_s": b_at(26), "state": "bolted to the gate reading ASK FIRST"},
                            {"at_s": b_at(30), "state": "flipped to YES? in the driver's hand"},
                            {"at_s": b_at(33), "state": "dropped into the signature square reading YES OR NO"}]},
        "reveals": [
            {"t": b_at(6), "type": "scale-pullback", "what": "from the name cards to a mini map of the states with Alaska lit", "hold_s": 0.8},
            {"t": b_at(17), "type": "build-on", "what": "a paper tower builds beside the NOT ENROLLED sign to the 370,000 mark", "hold_s": 0.8},
            {"t": b_at(28), "type": "morph-to-chart", "what": "the calendar flips back and the pile of old data shrinks to a few sheets", "hold_s": 0.8},
            {"t": b_at(30), "type": "scale-pullback", "what": "from the key in the hand to the whole dash with the gate open a crack", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 0, "offset": 3.0, "level": 1.0}, {"line": 2, "offset": 0.0, "level": 0.5},
            {"line": 3, "offset": 0.0, "level": 0.95}, {"line": 5, "offset": 0.0, "level": 0.9}, {"line": 6, "offset": 0.0, "level": 0.9},
            {"line": 7, "offset": 0.0, "level": 0.14}, {"line": 8, "offset": 0.0, "level": 0.1}, {"line": 9, "offset": 0.0, "level": 0.9},
            {"line": 10, "offset": 0.0, "level": 0.8},
            {"at_s": round(b_at(29) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(29) + 0.8, 3), "level": 0.6},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(29) - 0.3, 3), "riser_at": round(b_at(28), 3), "silence_at": round(b_at(29) - 0.3, 3),
                      "payoff_at": b_at(29), "button_pattern": "callback", "interrupt_at": b_at(19), "extra_dips": [b_at(23)]},
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
