#!/usr/bin/env python3
"""2026-11-15 "The Slot Without an Edge": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1115.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1115.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
 (1, 0, 0.0, "pop", "a cream speech balloon with a question mark", "drifts out of the dark rain past the JUNEAU street sign into the lamp cone and Flap's gunmetal flap snaps open and gulps it with a squash and an overshoot", "curious", "CURRENT RULE · ORAL REQUESTS COUNT", "the flap snaps", ""),
 (2, 0, W("simple"), "flap", "Flap, a gunmetal letterbox with rivet eyes in a state office door", "swallows, smacks its flap shut and blinks up at the sodium lamp while rain beads on its nickel lip", "pleased", "ASK OUT LOUD · IT COUNTS", "the lids blink", ""),
 (3, 1, 0.0, "whoosh", "the street door of a state office building in Juneau", "comes into view as the camera pulls back from Flap past the stone lintel, the green railing and the dark spruce hillside", "calm", "JUNEAU · A STATE OFFICE DOOR", "the rain sweeps", ""),
 (4, 1, W("skipping"), "paper", "a napkin note in a person's hand", "slides into Flap's mouth and Flap chews it happily", "pleased", "CURRENT RULE · NO DENIAL FOR SKIPPING THE FORM", "Flap chews", ""),
 (5, 2, 0.0, "stamp", "a printed notice", "slaps flat onto the wired-glass door panel and its tape corners snap down one by one", "plain", "NOTICE OF PROPOSED CHANGES · NOV 11TH", "the tape snaps", ""),
 (6, 2, W("Administration"), "pin", "a small department tag", "pins under the notice and swings once on its tack", "plain", "DEPARTMENT OF ADMINISTRATION", "the tag swings", ""),
 (7, 3, 0.0, "slam", "a steel faceplate with a form-shaped cutout", "swings in and bolts on BESIDE Flap's open mouth, bolt by bolt, each bolt head flashing cinnabar while Flap flinches", "startled", "PROPOSED", "the bolts fire", ""),
 (8, 3, W("reports"), "clip", "a blank hang tag on a chain", "drops from the faceplate's corner and swings with nothing written on it", "puzzled", "PER JUNEAU EMPIRE", "the tag swings", ""),
 (9, 3, W("automated"), "whirr", "Tote, a mint courier robot with a satchel", "rolls up the wet step under the JUNEAU street sign on two wheels, its satchel swinging, and looks up at the faceplate", "eager", "PROPOSED · NO REQUESTS VIA AUTOMATED TOOLS OR AI", "the wheels spin", ""),
 (10, 4, 0.0, "creak", "the blank hang tag", "swings toward the camera, still blank, as the camera pushes in on it", "waiting", "NOTHING REPORTED SAYS WHY", "the tag turns", "rehook: the blank tag swings into the lens as the voice says hold on to that"),
 (11, 4, W("Hold"), "tick", "Flap", "glances sideways at the blank tag and back at us with its flap pressed shut", "wary", "HOLD ON TO THAT", "the eyes slide", ""),
 (12, 5, 0.0, "snap", "the faceplate's cutout", "lights up in the shape of an official form while Flap's eyes cross at the bolt beside it", "strained", "PROPOSED · OFFICIAL FORMS OR PORTALS ONLY", "the eyes cross", ""),
 (13, 6, 0.0, "swish", "a person in a rain shell under the door's awning", "lifts a phone whose screen shows a small seafoam helper face, the Juneau spruce hillside behind the awning", "hopeful", "AN AI HELPER · ILLUSTRATION", "the screen wakes", ""),
 (14, 6, W("trim"), "scratch", "a long rambling paper scroll", "unrolls off the phone and the seafoam helper snips it down to one short line", "busy", "TRIMMED TO ONE QUESTION", "the scroll drops", ""),
 (15, 7, 0.0, "scribble", "the person's pencil", "crosses out one word on the short note and writes over it", "focused", "FIXED BY HAND", "the pencil scratches", ""),
 (16, 7, W("send"), "fold", "the person's hand", "folds the note and posts it into Flap's mouth themselves", "steady", "SENT BY THE PERSON", "the note goes in", ""),
 (17, 8, 0.0, "hum", "the faceplate's cutout", "fills the frame, three edges solid ink and the fourth a glowing dashed line, the folded note hovering at it", "puzzled", "AUTOMATED TOOL = ?", "the dashes glow", ""),
 (18, 8, W("say"), "ring", "the dashed fourth edge", "flickers dash by dash while Flap's eyes follow it end to end", "unsure", "NOT DEFINED IN THE REPORT", "the eyes track", ""),
 (19, 9, 0.0, "swoosh", "the camera", "cranes down through Flap's mouth into the dark inside of the door where a wire basket catches the notes", "curious", "AI ISN'T THE WHOLE DRAFT", "the basket catches", ""),
 (20, 10, 0.0, "thump", "a stack of request pages", "climbs in the wire basket to a painted line and stops dead at it", "strained", "PROPOSED · STOP AT 250 DOCUMENTS OR 15 HOURS", "the stack stops", ""),
 (21, 10, W("hours"), "drip", "a 15 hour candle", "burns down one notch beside the basket and a wax drop falls", "tired", "15 STAFF HOURS", "the wax drops", ""),
 (22, 11, 0.0, "roll", "an hour meter", "rolls past 5 and the first five tiles flip cinnabar along with every tile after", "wincing", "PROPOSED · PAST 5 HOURS, PAY FOR ALL OF IT", "the tiles flip", ""),
 (23, 11, W("first"), "clink", "a small state law plaque", "clips on beside the meter and rocks once", "plain", "STATE LAW · FEES START PAST 5 HOURS A MONTH", "the plaque rocks", ""),
 (24, 12, 0.0, "swing", "a sand timer marked 60", "turns over on a shelf as a denial slip drops beside it", "plain", "CURRENT RULE · 60 WORKING DAYS TO APPEAL", "the timer turns", ""),
 (25, 12, W("30"), "flip", "the sand timer", "is swapped for a squat one marked 30 and its sand rushes", "startled", "PROPOSED · APPEAL WINDOW 60 TO 30 WORKING DAYS", "the sand rushes", "rehook: the tall timer is swapped for a squat one and the sand rushes"),
 (26, 13, 0.0, "rush", "the camera", "tilts up the wet door outside to the stone lintel above Flap, the Juneau spruce hillside dark behind it, as a placard slides up the railing", "calm", "PROPOSED · RESIDENTS GET PRIORITY", "the placard slides", ""),
 (27, 13, W("every"), "press", "the carved words on the lintel", "catch the sodium light letter by letter as the rain runs over them", "steady", "\"EVERY PERSON HAS A RIGHT TO INSPECT\"", "the letters light", ""),
 (28, 14, 0.0, "knock", "the night clerk at a lamp-lit oak desk", "looks up from a stack of pages beside a window onto Juneau's spruce hillside in the rain", "tired", "THE FAIR CASE FOR THE DRAFT", "the head lifts", ""),
 (29, 14, W("finite"), "tock", "a desk clock", "ticks round over the clerk's shoulder while the clerk rubs one eye", "weary", "STAFF HOURS ARE FINITE", "the hand sweeps", ""),
 (30, 15, 0.0, "page", "a placard on the clerk's desk", "flips up on its little easel and settles", "plain", "STATED AIM · EFFICIENCY · NO ADDED COST", "the placard settles", ""),
 (31, 15, W("cost"), "tap", "the clerk", "nods and squares the stack of pages with two taps", "even", "PER THE FILING, AS REPORTED", "the stack squares", ""),
 (32, 16, 0.0, "thunk", "a waiver stamp", "lands on a page beside the folded question note and leaves a soft round mark", "kind", "PROPOSED · PUBLIC INTEREST WAIVER STAYS", "the stamp lands", ""),
 (33, 16, W("ten"), "ding", "a desk calendar", "flips to 10 WORKING DAYS and holds there", "steady", "10 WORKING DAYS TO RESPOND · UNCHANGED", "the card flips", ""),
 (34, 17, 0.0, "blip", "a portal screen on the clerk's desk", "lights up with a name field already filled in", "plain", "ONE PORTAL", "the field fills", ""),
 (35, 17, W("commercial"), "slide", "a request with a dollar sign on it", "tips toward an empty wire tray at the desk edge", "plain", "PROPOSED · REJECT REQUESTS FOR COMMERCIAL GAIN", "the request tips", ""),
 (36, 18, 0.0, "whoosh", "two same-size envelopes, one posted by a person's hand, one carried by Tote", "slide side by side through the amber rain past the JUNEAU street sign toward the faceplate", "even", "CHANNEL · HOW DID IT ARRIVE?", "the envelopes slide", "rehook: two same-size envelopes slide in side by side, one from a hand, one from the robot"),
 (37, 18, W("whatever"), "thud", "both stacks", "drop together inside the door and stop at the SAME 250 line", "even", "VOLUME · 250 DOCUMENTS, WHATEVER TOOL FILED IT", "the stacks land", ""),
 (38, 19, W("Nothing"), "clank", "the blank hang tag", "swings back into frame, still blank, between the two stacks", "waiting", "NOTHING REPORTED SAYS", "the tag swings", ""),
 (39, 20, 0.0, "scratch", "the dashed fourth edge", "is traced by a sliding steel ruler whose ink follows it solid from end to end while Flap leans out to watch", "open", "IF DEFINED NARROWLY", "the edge draws", ""),
 (40, 21, W("ends"), "hum", "the edge", "breaks back into glowing dashes", "open", "WHERE DOES A TOOL END?", "the dashes return", ""),
 (42, 10, W("documents"), "click", "the painted 250 line", "flashes white as the top page touches it and the basket wires twang", "strained", "250 DOCUMENTS", "the line flashes", ""),
 (43, 17, W("request"), "pop", "a small portrait card", "pops up into the portal's name field and settles", "plain", "A KNOWN PERSON BEHIND EACH REQUEST", "the card pops", ""),
 (44, 19, 0.0, "swing", "Flap", "looks from the person's envelope to Tote's envelope and back, its lids lifting", "puzzled", "SAME STACK · TWO WAYS IN", "the eyes swing", ""),
 (45, 20, W("helper"), "chime", "the phone in the person's hand", "swings up into frame beside the door, its seafoam helper face waking", "hopeful", "THE HELPER QUESTION", "the screen lights", ""),
 (46, 21, 0.0, "rustle", "both stacks inside the door", "flick through once as a counter on the basket reads 250", "plain", "IT CAN COUNT DOCUMENTS", "the pages flick", ""),
 (41, 21, W("draw"), "bloom", "the cream question balloon", "drifts back out of the dark past the JUNEAU street sign and sails through Flap's open mouth untouched while Flap smiles", "open", "WHERE WOULD YOU DRAW THE LINE?", "the balloon sails", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 47)}
PLATE_AT.update({1: "lower-third", 3: "lower-third", 19: "lower-third", 28: "lower-third", 41: "lower-third"})
CLAIM_MAP = {1: ["c5"], 2: ["c5"], 3: ["narration"], 4: ["c4"], 5: ["c1"], 6: ["c1"], 7: ["c2"], 8: ["c2"], 9: ["c2"], 10: ["c2"], 11: ["narration"],
             12: ["c3"], 13: ["narration"], 14: ["narration"], 15: ["narration"], 16: ["narration"], 17: ["c2"], 18: ["c2"], 19: ["narration"],
             20: ["c6"], 21: ["c6"], 22: ["c7"], 23: ["c8"], 24: ["c11"], 25: ["c10"], 26: ["c15"], 27: ["c16"], 28: ["narration"], 29: ["narration"],
             30: ["c19"], 31: ["c19"], 32: ["c9"], 33: ["c12"], 34: ["c3"], 35: ["c13"], 36: ["narration"], 37: ["c6"], 38: ["c2"],
             39: ["narration"], 40: ["narration"], 41: ["narration"],
             42: ["c6"], 43: ["narration"], 44: ["narration"], 45: ["narration"], 46: ["narration"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "close", "eye", "door-night", "slot-height-closeup", "centered-hero", "radial-emanate", "character-as-subject", "", "", "The slot eats a question", "Out of the dark rain a spoken question balloon drifts into the lamp cone and Flap the letterbox gulps it"),
 (2, 1, "wide-establish", "wide", "low", "door-night", "steps-low-angle", "vertical-stack", "vertical-descent", "structure-as-subject", "crossfade", "carry", "The door in Juneau", "The camera pulls back to the whole state office door, lintel, railing and spruce hillside, and a hand posts a napkin note"),
 (3, 2, "push-detail", "insert", "eye", "door-panel", "flat-on-glass", "stacked-layers", "assemble-build", "data-as-subject", "graphic-match", "match", "The notice", "A printed notice slaps onto the wired-glass panel, NOV 11TH, with a department tag pinned under it"),
 (4, 3, "subject-portrait", "medium", "eye", "door-night", "slot-height-three-quarter", "offset-thirds", "horizontal-traverse", "character-as-subject", "match-cut", "match", "The faceplate", "A steel faceplate bolts on beside Flap's mouth, a blank tag drops from its corner and Tote rolls up the step"),
 (5, 5, "macro-closeup", "insert", "eye", "faceplate", "macro-faceplate", "fullbleed-split", "radial-emanate", "instrument-as-subject", "carried-element", "carry", "Forms or portals", "The faceplate's cutout lights in the shape of an official form while Flap's eyes cross at the bolt"),
 (6, 6, "alt-vantage", "medium", "eye", "awning", "over-shoulder-phone", "split-race", "horizontal-traverse", "character-as-subject", "mask-wipe", "build", "The helper", "Under the awning a person's phone helper trims a rambling scroll to one line, the person fixes it and posts it"),
 (7, 8, "push-detail", "close", "eye", "faceplate", "macro-faceplate", "centered-hero", "radial-emanate", "instrument-as-subject", "graphic-match", "match", "The dashed edge", "The cutout fills the frame, its fourth edge dashed and glowing, the folded note hovering at it under AUTOMATED TOOL = ?"),
 (8, 9, "alt-vantage", "medium", "high", "inside-door", "crane-through-slot", "stacked-layers", "vertical-descent", "data-as-subject", "match-action", "carry", "Inside the door", "The camera cranes through the slot to a wire basket where the stack stops at a 250 line, a 15 hour candle and an hour meter"),
 (9, 12, "push-detail", "close", "eye", "inside-door", "shelf-level-side", "side-by-side", "assemble-build", "data-as-subject", "carried-element", "build", "The appeal timer", "A tall sand timer marked 60 turns over and is swapped for a squat one marked 30"),
 (10, 13, "map-territory", "wide", "low", "door-night", "tilt-to-lintel", "vertical-stack", "vertical-descent", "structure-as-subject", "whip-pan", "carry", "The lintel", "Outside, the camera tilts up from a RESIDENTS placard on the railing to the statute carved in the stone lintel"),
 (11, 14, "subject-portrait", "medium", "eye", "clerk-room", "desk-eye-level", "centered-hero", "radial-emanate", "character-as-subject", "crossfade", "match", "The clerk's side", "In a warm lamp-lit room the night clerk looks up, the clock ticks and a STATED AIM placard flips up on the desk"),
 (12, 16, "two-up", "close", "high", "clerk-room", "overhead-desk", "grid-modular", "scroll-data", "data-as-subject", "carried-element", "build", "What the draft keeps", "From above the desk a waiver stamp lands, the calendar holds at 10 working days, a portal fills a name and a dollar request tips"),
 (13, 18, "two-up", "medium", "eye", "door-night", "slot-height-closeup", "symmetric-split", "vertical-descent", "data-as-subject", "match-cut", "match", "Same line", "Two same-size envelopes slide to the faceplate side by side and both stacks drop to the same 250 line, the blank tag between them"),
 (14, 20, "subject-portrait", "close", "eye", "door-night", "slot-height-closeup", "centered-hero", "radial-emanate", "character-as-subject", "graphic-match", "match", "Where a tool ends", "The dashed edge draws solid under IF DEFINED NARROWLY, breaks back into dashes, and the balloon sails through Flap's mouth"),
]

AMBIENT = {1: "rain on a door, a gutter drip", 2: "rain, a downpipe, distant traffic hiss", 3: "rain on glass, tape tear", 4: "rain, bolt clanks, wheel squeak",
           5: "rain close on steel, a low hum", 6: "rain on an awning, a phone tick", 7: "a low hum, rain far off", 8: "rain muffled through a door, paper settling",
           9: "a room tone, sand pouring", 10: "rain, a downpipe gurgle", 11: "a warm room tone, a clock, rain on a window", 12: "a room tone, a stamp, a click",
           13: "rain, paper slide, a thud through the door", 14: "rain, a low hum, a soft breath"}
CENTER = {1: "Flap at x540 y900", 2: "the door at x540 y900", 3: "the notice at x540 y900", 4: "Flap at x430 y920", 5: "the cutout at x540 y900",
          6: "the person at x420 y980", 7: "the edge at x540 y900", 8: "the basket at x540 y960", 9: "the timer at x540 y920", 10: "the lintel at x540 y760",
          11: "the clerk at x540 y980", 12: "the desk at x540 y920", 13: "the envelopes at x540 y880", 14: "Flap at x540 y900"}
HERO = {
 1: ("Flap + question balloon + sodium lamp + rain", "55% Flap, 25% balloon, 20% lamp cone and rain"),
 2: ("door + stone lintel + green railing + spruce hillside + Flap + napkin note + hand", "40% door and lintel, 30% Flap and note, 30% hillside and lamp"),
 3: ("printed notice + tape corners + department tag + wired-glass panel", "55% notice, 25% glass panel, 20% tag"),
 4: ("Flap + steel faceplate + bolts + blank hang tag + Tote", "40% Flap and faceplate, 30% Tote, 30% tag and step"),
 5: ("faceplate cutout + bolt + Flap's eye", "55% cutout, 25% eye, 20% bolt"),
 6: ("person + phone + mint helper + scroll + pencil + note + awning", "45% person, 30% phone and scroll, 25% awning and door"),
 7: ("cutout + dashed edge + folded note + Flap's eyes", "50% cutout and edge, 30% note, 20% eyes"),
 8: ("wire basket + request stack + 250 line + candle + hour meter + law plaque", "40% basket and stack, 30% meter, 30% candle"),
 9: ("tall sand timer + squat sand timer + denial slip + shelf", "50% timers, 30% slip, 20% shelf"),
 10: ("stone lintel + carved statute + placard + railing + Flap", "50% lintel, 30% placard, 20% door"),
 11: ("night clerk + oak desk + green lamp + clock + placard + window", "45% clerk, 30% desk and placard, 25% window and clock"),
 12: ("waiver stamp + calendar + portal screen + dollar request + tray", "30% stamp, 25% calendar, 25% portal, 20% tray"),
 13: ("two envelopes + hand + Tote + faceplate + two stacks + 250 line + blank tag", "40% envelopes and stacks, 30% faceplate, 30% tag and Tote"),
 14: ("Flap + dashed edge + steel ruler + question balloon", "45% Flap, 30% edge, 25% balloon"),
}
PARTS = {1: 48, 2: 56, 3: 44, 4: 54, 5: 44, 6: 52, 7: 44, 8: 52, 9: 44, 10: 50, 11: 54, 12: 50, 13: 54, 14: 48}
KICKS = (7, 25, 37)
CAMERA = {1: "dollyThrough", 2: "craneDown", 3: "static:the notice slapping on and its tape snapping is the move", 4: "truckAcross", 5: "dollyThrough",
          6: "truckAcross", 7: "dollyThrough", 8: "craneDown", 9: "static:the timers turning and swapping are the move", 10: "craneDown",
          11: "dollyThrough", 12: "static:an overhead locked desk where four props land in turn", 13: "truckAcross", 14: "dollyThrough"}

PALETTE = ("rain-black Juneau night #142420, slate stone #3A4A5C lifted to #5E7385 under one sodium amber wall lamp #F2A541, blackened gunmetal letterbox #4A4F57 with a nickel lip #B9BEC4, "
           "request ivory #F3E9D2, cinnabar #D2452F on PROPOSED stamps and bolt heads, seafoam #7FD6C2 for the robot and the phone helper, an oak interior #6B4A2E under a green-shaded desk lamp")


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
        "run_date": "2026-11-15", "slug": "the-slot-without-an-edge", "title": "The Slot Without an Edge",
        "concept": ("Under Alaska's current rules a records request can be spoken out loud and can't be refused for skipping the form. On November 11th the Department of Administration posted proposed changes, and per the Juneau Empire the draft would bar requests filed through third party services or automated tools, including AI, "
                    "let agencies require their own forms or portals, stop work at 250 documents or 15 staff hours, charge for all of it once past five hours a month, cut the appeal window from 60 to 30 working days and give residents priority over nonresidents. Nothing reported says why the AI line is there. "
                    "Drawn as a gunmetal letterbox in a Juneau door that gets a steel faceplate with a form-shaped cutout whose fourth edge is dashed, AUTOMATED TOOL = ?. A person drafts with an AI helper and posts it themselves, a courier robot submits through, the night clerk gets the fair case, "
                    "and both envelopes stop at the same 250 line. The film ends on the question of where a tool ends."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "slot-height-closeup", "motion_vector": "vertical-descent", "hero_treatment": "character-as-subject", "layout": "centered-hero",
                        "register": "night-noir-storybook", "palette": PALETTE, "camera_strategy": "push-and-crane-through",
                        "light_story": "one sodium amber lamp raking a rain-black door outside, a warm green-shaded desk lamp inside for the fair case",
                        "metaphor": "a letterbox that has always swallowed any question gets a steel faceplate whose fourth edge is a dashed line nobody has drawn"}, "signature_shot": 13,
        "palette": PALETTE,
        "divergence_note": ("The last films were high-noon white sea ice with cobalt leads and a survey camera (11-14), a brass faucet on an overcast pewter-sage gravel lot (11-13), a survey stake tag on rose dusk snow with a raven (11-12) and a vermilion take-a-number machine on a violet shore (11-10). "
                            "This film is full night at one vertical door plane in Juneau rain, one sodium lamp, a GUNMETAL letterbox with a face (never brass), cinnabar only on PROPOSED and mint only on the AI, and a warm lamp-lit interior for the test. Its device is a faceplate with a dashed fourth edge. "
                            "Honest overlaps: 11-13 was also wet, answered here by night, a vertical door with no ground lot, and no water vessel. 11-10 had a machine that dispenses, so Flap only receives and never hands anything out."),
        "treatment": {"title": "The Slot Without an Edge", "summary": ad["treatment"],
                      "judge_reasoning": "Dramatist pitch won (47 of 60): the only retention plan with every loop explicit and legal, an Act 3 that is a real test where the clerk's case gets its own scene and then both same-size envelopes stop at the same 250 line, an AI presence that only submits through (the reported verb), and the falsifier drawn on screen. Grafts: the Enthusiast's honest AI drafting upside with the person fixing the helper's mistake and posting it themselves, the Explainer's crane through the slot and CHANNEL and VOLUME labels, the Comedian's statute carved in the lintel. The flap is gunmetal not brass to stay clear of 11-13."},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "anomaly-question", "frame1": "Rain streaks through one sodium lamp cone on a dark door and a gunmetal letterbox with rivet eyes, and a cream question balloon drifts in from the dark.",
                 "headline": "ASK OUT LOUD · IT COUNTS", "motion_by_s": 0.4,
                 "loopback": "Frame 1 is the question balloon drifting into the lamp cone toward Flap, the last image is the same balloon sailing through Flap's open mouth untouched."},
        "open_loop": {"plant_t": b_at(8), "pay_t": b_at(38), "plant_glow_s": 0.4, "plant_sfx": "clip", "what": "Why is the AI line there? Planted as a BLANK hang tag dropping from the new faceplate's corner, held on as nothing reported says why, paid when the same tag swings back between the two stacks still blank as the voice says nothing reported says."},
        "open_loop_2": {"plant_t": b_at(17), "pay_t": b_at(40), "what": "Is the person with the AI helper an automated tool? Planted as the folded note hovering at the dashed fourth edge under AUTOMATED TOOL = ?, paid in two moves, the ruler traces the edge solid under IF DEFINED NARROWLY, then on where a tool ends it breaks back into dashes under WHERE DOES A TOOL END, handing the question to the viewer."},
        "throughline": {"object": "the Question, a cream balloon that becomes a folded note", "lands_in_button": "the balloon sails through Flap's open mouth untouched, as it did in frame 1",
                        "states": [
                            {"at_s": b_at(1), "state": "Q1 a spoken balloon, gulped"},
                            {"at_s": b_at(4), "state": "Q1b a napkin note on any paper, swallowed"},
                            {"at_s": b_at(16), "state": "Q2 a trimmed note, fixed by hand and posted by the person"},
                            {"at_s": b_at(17), "state": "Q3 the folded note hovering at the dashed edge"},
                            {"at_s": b_at(20), "state": "Q4 stacked in the wire basket under the 250 line"},
                            {"at_s": b_at(32), "state": "Q4b on the clerk's desk under the lamp, a soft waiver mark beside it"},
                            {"at_s": b_at(37), "state": "Q5 one of two same-size stacks at the same 250 line"},
                            {"at_s": b_at(41), "state": "Q6 a balloon again, sailing through the open flap"}]},
        "reveals": [
            {"t": b_at(3), "type": "scale-pullback", "what": "the camera pulls back from Flap to the whole Juneau door, lintel, railing and hillside", "hold_s": 0.8},
            {"t": b_at(19), "type": "build-on", "what": "the crane through the slot reveals the basket, the candle and the meter inside the door", "hold_s": 0.8},
            {"t": b_at(26), "type": "scale-pullback", "what": "the camera tilts up from the placard to the whole carved lintel", "hold_s": 0.8},
            {"t": b_at(37), "type": "build-on", "what": "both stacks drop and stop at the same 250 line", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.5}, {"line": 3, "offset": 0.0, "level": 1.4}, {"line": 6, "offset": 0.0, "level": 1.0},
            {"line": 9, "offset": 0.0, "level": 1.8}, {"line": 14, "offset": 0.0, "level": 0.8}, {"line": 18, "offset": 0.0, "level": 1.9},
            {"at_s": round(b_at(41) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(41) + 0.6, 3), "level": 1.6},
            {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "rain",
            "build_steps": 4, "dip_at": round(b_at(41) - 0.5, 3), "riser_at": round(b_at(36), 3), "silence_at": round(b_at(41) - 0.5, 3),
            "payoff_at": b_at(41), "button_pattern": "callback", "interrupt_at": b_at(7), "extra_dips": []},
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
    book.raise_if_missing("board_1115 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1115Ids.ts").write_text(
        "// GENERATED by scripts/board_1115.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
