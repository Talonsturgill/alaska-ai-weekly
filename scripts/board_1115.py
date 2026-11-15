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
 (1, 0, 0.0, "pop", "a cream speech balloon with a question mark", "drifts out of the dark rain into the lamp cone and the faceless gunmetal letterbox's flap snaps open and gulps it as a pencil starts sketching a dashed outline beside the slot", "curious", "ASK OUT LOUD · IT COUNTS", "the flap snaps", ""),
 (2, 0, W("simple"), "flap", "the letterbox flap", "smacks shut and rattles once while rain beads drip off its nickel lip and the pencil line keeps drawing", "satisfied", "CURRENT RULE · ORAL REQUESTS COUNT", "the flap rattles", ""),
 (3, 1, 0.0, "whoosh", "the street door of a state office building in Juneau seen from across the road", "stands lit in the rain under the lamp and the JUNEAU street sign while a person in a rain shell crosses to it", "calm", "JUNEAU · A STATE OFFICE DOOR", "the person crosses", ""),
 (4, 1, W("skipping"), "paper", "a napkin note in the person's hand", "slides into the letterbox and the flap swallows it", "relieved", "CURRENT RULE · NO DENIAL FOR SKIPPING THE FORM", "the note goes in", ""),
 (5, 2, 0.0, "stamp", "a printed notice", "slaps flat onto the wired-glass door panel, the spruce hillside reflected in the glass, and its tape corners snap down one by one", "plain", "NOTICE OF PROPOSED CHANGES · NOV 11TH", "the tape snaps", ""),
 (6, 2, W("Administration"), "pin", "a small department tag", "pins under the notice and swings once on its tack", "plain", "DEPARTMENT OF ADMINISTRATION", "the tag swings", ""),
 (7, 3, 0.0, "snap", "a sheet of tracing vellum with a pencilled form-shaped outline", "is clipped to the door beside the slot with two binder clips that snap shut, its bolt holes only pencilled circles, a DRAFT tab in its corner and a blank tag folded up behind one clip", "tense", "PROPOSED · A DRAFT, PER JUNEAU EMPIRE", "the clips snap", ""),
 (8, 3, W("third"), "slide", "an envelope with a courier service sticker", "slides up to the pencilled outline and stops at the line, waiting", "unsure", "PROPOSED · NO THIRD PARTY SERVICES", "the envelope stops", ""),
 (9, 3, W("automated"), "whirr", "Tote, a graphite courier robot with an ice-cyan screen face", "rolls up the wet step under the JUNEAU street sign, raises its envelope to the outline and stops at the PROPOSED line, waiting", "eager", "PROPOSED · NO REQUESTS VIA AUTOMATED TOOLS OR AI", "the robot stops", ""),
 (10, 4, 0.0, "creak", "the blank hang tag", "unfolds from behind its clip, drops on its string and swings toward the camera with nothing written on it", "waiting", "NOTHING REPORTED SAYS WHY", "the tag swings", "rehook: a blank tag drops and swings into the lens as the voice says hold on to that"),
 (11, 4, W("Hold"), "clink", "the blank tag's string", "chinks against a binder clip as the tag turns face on, still blank", "wary", "HOLD ON TO THAT", "the tag turns", ""),
 (12, 5, 0.0, "blip", "a screen on the clerk's desk in Juneau", "boots up showing an official request form with the state seal at its head", "plain", "PROPOSED · OFFICIAL FORMS OR PORTALS ONLY", "the screen boots", ""),
 (47, 5, W("portals"), "snap", "the form on the screen", "folds into a portal login box with a blinking cursor", "plain", "FORM · OR PORTAL", "the form folds", ""),
 (13, 6, 0.0, "swish", "a person in a rain shell under the door's awning", "lifts a phone whose screen shows a small ice-cyan helper face, the Juneau spruce hillside behind the awning", "hopeful", "AN AI HELPER · ILLUSTRATION", "the screen wakes", ""),
 (14, 6, W("trim"), "scratch", "a long rambling paper scroll", "unrolls off the phone and the helper snips it down to one short line", "busy", "TRIMMED TO ONE QUESTION", "the scroll drops", ""),
 (15, 7, 0.0, "scribble", "the person's pencil", "crosses out one wrong word on the short note and writes over it", "focused", "FIXED BY HAND", "the pencil scratches", ""),
 (16, 7, W("send"), "fold", "the person's hand", "folds the note and carries it to the slot", "steady", "CARRIED BY THE PERSON", "the hand reaches", ""),
 (17, 8, 0.0, "hum", "the folded note", "nudges against the dashed pencil edge of the outline, which neither blocks it nor lets it through", "puzzled", "AUTOMATED TOOL = ?", "the note presses", ""),
 (18, 8, W("reported"), "buzz", "the dashed fourth edge", "flickers dash by dash as the note hovers at it", "unsure", "NOT DEFINED IN THE REPORT", "the dashes flicker", ""),
 (19, 9, 0.0, "swoosh", "the camera", "cranes down through the slot past the folded note caught half in and half out, lit by the dashed edge's amber glow, into the dark inside of the door and a wire basket", "curious", "AI ISN'T THE WHOLE DRAFT", "the basket swings", ""),
 (20, 10, W("reports"), "thump", "a stack of request pages", "climbs in the wire basket toward a strip of masking tape on the wall marked DRAFT", "strained", "PER JUNEAU EMPIRE", "the stack climbs", ""),
 (42, 10, W("250"), "click", "the stack", "reaches the masking-tape line and stops dead as the tape flutters", "strained", "PROPOSED · STOP AT 250 DOCUMENTS OR 15 HOURS", "the stack stops", ""),
 (21, 10, W("staff"), "drip", "a 15 hour candle", "burns down one notch beside the basket and a wax drop falls", "tired", "STAFF HOURS RUN DOWN", "the wax drops", ""),
 (22, 11, 0.0, "roll", "an hour meter", "rolls past 5 and the first five tiles flip along with every tile after", "wincing", "PROPOSED · PAST 5 HOURS, PAY FOR ALL OF IT", "the tiles flip", ""),
 (23, 11, W("first"), "clink", "a small state law plaque with an Alaska outline", "clips on beside the meter and rocks once", "plain", "STATE LAW · FEES START PAST 5 HOURS A MONTH", "the plaque rocks", ""),
 (24, 12, 0.0, "swing", "a tall sand timer marked 60", "turns over on a shelf as a denial slip drops beside it", "plain", "CURRENT RULE · 60 WORKING DAYS TO APPEAL", "the timer turns", ""),
 (25, 12, W("30"), "thunk", "a squat sand timer marked 30 with a DRAFT tag", "is set down upright beside the tall one, its sand held still", "startled", "PROPOSED · APPEAL WINDOW 60 TO 30 WORKING DAYS", "the timer lands", "rehook: a squat 30 timer with a DRAFT tag lands beside the running 60"),
 (26, 13, 0.0, "slide", "a card on the green stair railing outside", "slides up the rail in the rain and stops level", "plain", "PROPOSED · RESIDENTS GET PRIORITY", "the card slides", ""),
 (27, 13, W("every"), "slide", "a second card the same size on printed stock", "slides up the rail and stops level beside the pencilled vellum card, the same height in the same light", "plain", "STATE LAW · \"EVERY PERSON HAS A RIGHT TO INSPECT\" · WITH EXCEPTIONS", "the card slides", ""),
 (28, 14, 0.0, "page", "the night clerk at a lamp-lit oak desk", "lifts the next request off a tall stack and glances once at a folded note still caught half in the door slot behind, beside a window onto Juneau's spruce hillside", "busy", "THE FAIR CASE FOR THE DRAFT", "the page lifts", ""),
 (29, 14, W("finite"), "drip", "a candle on the clerk's desk", "burns down a notch as the clerk reaches for the next request", "weary", "STAFF HOURS ARE FINITE", "the notch drops", ""),
 (30, 15, 0.0, "page", "a placard on its easel", "is turned toward us by the clerk's hand", "plain", "PER THE FILING, AS REPORTED", "the placard turns", ""),
 (31, 15, W("efficiency"), "flip", "the placard", "flips its card to the stated aim and settles", "even", "STATED AIM · EFFICIENCY · NO ADDED COST", "the card flips", ""),
 (32, 16, 0.0, "thunk", "a waiver stamp", "lands on a page and leaves a soft round mark", "kind", "PROPOSED · PUBLIC INTEREST WAIVER STAYS", "the stamp lands", ""),
 (33, 16, W("ten"), "ding", "a desk calendar with the state letterhead", "flips to 10 WORKING DAYS and holds there", "steady", "10 WORKING DAYS TO RESPOND · UNCHANGED", "the card flips", ""),
 (34, 17, 0.0, "blip", "the portal screen on the desk", "lights and a small portrait card snaps into its empty name field", "plain", "COULD · A KNOWN PERSON BEHIND EACH REQUEST", "the card snaps", ""),
 (43, 17, W("refuse"), "slide", "a request with a dollar sign on it", "slides across the desk toward an empty wire tray", "plain", "PROPOSED · REJECT REQUESTS FOR COMMERCIAL GAIN", "the request slides", ""),
 (35, 17, W("gain"), "thud", "the dollar request", "drops into the wire tray and the tray rocks", "plain", "COULD, PER JUNEAU EMPIRE", "the tray rocks", ""),
 (36, 18, 0.0, "whoosh", "the door in cross-section, rain outside on the left, the basket inside on the right", "opens up as the camera pulls back, a gloved hand's envelope of official forms and Tote's envelope arriving at the slot side by side", "even", "PROPOSED CAPS", "the door opens up", "rehook: the door splits into a cross-section, outside and inside at once"),
 (37, 18, W("250"), "thud", "a stack of hand-filled official forms with the state seal, posted by a gloved hand", "drops into the basket and stops at the 250 tape line, while beside it Tote's stack is only a dashed ghost outline labelled IF ALLOWED reaching the same line", "even", "VOLUME · 250 DOCUMENTS, WHATEVER TOOL FILED IT", "the stack lands", ""),
 (44, 19, 0.0, "tick", "three labels on the cross-section", "light in turn, VOLUME on the tape line, A KNOWN PERSON IF A PORTAL IS REQUIRED on a card clipped to the real stack, and TOOL LINE on the blank tag", "puzzled", "WHAT DOES THE TOOL LINE ADD?", "the labels light", ""),
 (38, 19, W("Nothing"), "clink", "the blank hang tag", "swings into the middle of the cross-section, still blank", "waiting", "NOTHING REPORTED SAYS", "the tag swings", ""),
 (39, 20, 0.0, "scratch", "the dashed fourth edge on the vellum, seen over the person's shoulder from under the awning", "is traced by a sliding steel ruler whose pencil follows it solid from end to end, still pencil", "open", "IF DEFINED NARROWLY", "the edge draws", ""),
 (45, 20, W("helper"), "chime", "the phone in the person's hand", "swings up into frame beside the door, its ice-cyan helper face waking", "hopeful", "THE HELPER QUESTION", "the screen lights", ""),
 (46, 21, 0.0, "rustle", "the person under the awning", "rests a fingertip on the note still caught half in the slot and stops a finger's width short of pushing it past the dashed edge, the phone still lit, as the 250 tape line glows through the wired glass", "plain", "IT CAN COUNT DOCUMENTS", "the hand stops", ""),
 (40, 21, W("where"), "hum", "the pencilled edge", "breaks back into glowing pencil dashes", "open", "WHERE DOES A TOOL END?", "the dashes return", ""),
 (41, 21, W("Where", 2), "bloom", "the cream question balloon", "drifts back out of the dark past the JUNEAU street sign and holds beside the caught note at the threshold, neither in nor out", "open", "WHERE WOULD YOU DRAW THE LINE?", "the balloon hovers", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 48)}
PLATE_AT.update({1: "lower-third", 3: "lower-third", 19: "lower-third", 28: "lower-third", 41: "lower-third"})
CLAIM_MAP = {1: ["c5"], 2: ["c5"], 3: ["narration"], 4: ["c4"], 5: ["c1"], 6: ["c1"], 7: ["c2"], 8: ["c2"], 9: ["c2"], 10: ["c2"], 11: ["narration"],
             12: ["c3"], 47: ["c3"], 13: ["narration"], 14: ["narration"], 15: ["narration"], 16: ["narration"], 17: ["c2"], 18: ["c2"], 19: ["narration"],
             20: ["c6"], 42: ["c6"], 21: ["c6"], 22: ["c7"], 23: ["c8"], 24: ["c11"], 25: ["c10"], 26: ["c15"], 27: ["c16"], 28: ["narration"], 29: ["narration"],
             30: ["c19"], 31: ["c19"], 32: ["c9"], 33: ["c12"], 34: ["c3"], 43: ["c13"], 35: ["c13"], 36: ["c6"], 37: ["c6"], 44: ["c2"], 38: ["c2"],
             39: ["narration"], 45: ["narration"], 46: ["narration"], 40: ["narration"], 41: ["narration"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "close", "eye", "door-night", "slot-height-closeup", "centered-hero", "radial-emanate", "structure-as-subject", "", "", "The slot eats a question", "Out of the dark rain a spoken question balloon drifts into the lamp cone and the letterbox gulps it while a pencil starts a dashed outline beside it"),
 (2, 1, "wide-establish", "wide", "eye", "street-night", "across-the-road", "vertical-stack", "horizontal-traverse", "character-as-subject", "match-cut", "match", "The door in Juneau", "From across the road the lit state office door under the lamp and the JUNEAU sign, a person crosses and posts a napkin note"),
 (3, 2, "push-detail", "insert", "eye", "door-panel", "flat-on-glass", "stacked-layers", "assemble-build", "data-as-subject", "graphic-match", "match", "The notice", "A printed notice slaps onto the wired glass, the hillside reflected in it, NOV 11TH, with a department tag pinned under it"),
 (4, 3, "subject-portrait", "medium", "eye", "door-night", "slot-height-three-quarter", "offset-thirds", "horizontal-traverse", "instrument-as-subject", "match-cut", "match", "The draft template", "Tracing vellum with a pencilled outline is clipped beside the slot, a service envelope and Tote both stop at its line, a blank tag drops"),
 (5, 5, "push-detail", "close", "eye", "clerk-desk-screen", "over-desk-screen", "fullbleed-split", "assemble-build", "data-as-subject", "graphic-match", "match", "Forms or portals", "On the clerk's desk in Juneau a screen boots an official form with the state seal, then folds it into a portal login"),
 (6, 6, "alt-vantage", "medium", "eye", "awning", "over-shoulder-phone", "split-race", "horizontal-traverse", "character-as-subject", "mask-wipe", "build", "The helper", "Under the awning a person's phone helper trims a rambling scroll to one line, the person fixes it by hand and carries it to the slot"),
 (7, 8, "macro-closeup", "insert", "eye", "vellum", "macro-vellum", "centered-hero", "radial-emanate", "instrument-as-subject", "graphic-match", "match", "The dashed edge", "The folded note presses at the dashed pencil edge, which neither blocks it nor lets it through, under AUTOMATED TOOL = ?"),
 (8, 9, "alt-vantage", "medium", "high", "inside-door", "crane-through-slot", "stacked-layers", "vertical-descent", "data-as-subject", "match-action", "carry", "Inside the door", "The camera cranes through the slot to a wire basket where the stack stops at a DRAFT tape line, a 15 hour candle and an hour meter"),
 (9, 12, "push-detail", "close", "eye", "inside-door", "shelf-level-side", "side-by-side", "assemble-build", "data-as-subject", "carried-element", "build", "The appeal timers", "A tall 60 timer turns over and a squat 30 timer with a DRAFT tag is set beside it"),
 (10, 13, "two-up", "medium", "low", "railing-night", "railing-low-side", "symmetric-split", "horizontal-traverse", "data-as-subject", "match-cut", "match", "Two cards", "Outside on the green railing two same-size cards slide up and stop level, the residents draft and the statute's words"),
 (11, 14, "subject-portrait", "medium", "eye", "clerk-room", "desk-eye-level", "centered-hero", "radial-emanate", "character-as-subject", "crossfade", "match", "The clerk's side", "In a warm lamp-lit room the clerk works through the stack while a candle burns down and turns the STATED AIM placard toward us"),
 (12, 16, "map-territory", "close", "high", "clerk-room", "overhead-desk", "grid-modular", "scroll-data", "data-as-subject", "carried-element", "build", "What the draft keeps", "From above the desk a waiver stamp lands, the calendar holds at 10, a portrait card snaps into the portal and a dollar request drops into a tray"),
 (13, 18, "wide-establish", "wide", "eye", "door-cutaway", "cross-section", "fullbleed-split", "vertical-descent", "data-as-subject", "match-cut", "match", "Same line", "The door in cross-section, rain outside and the basket inside, the person's stack stops at the 250 line beside a dashed ghost of Tote's"),
 (14, 20, "alt-vantage", "medium", "eye", "awning", "over-shoulder-door", "offset-thirds", "radial-emanate", "structure-as-subject", "graphic-match", "match", "Where a tool ends", "Over the person's shoulder a ruler traces the dashed edge solid, it breaks back into dashes, and the balloon stops at the threshold"),
]

AMBIENT = {1: "rain on a door, a gutter drip", 2: "rain on a street, tires hiss far off", 3: "rain on glass, tape tear", 4: "rain, clips snap, wheel squeak",
           5: "a warm room tone, a screen hum", 6: "rain on an awning, a phone tick", 7: "a low hum, rain far off", 8: "rain muffled through a door, paper settling",
           9: "a room tone, sand pouring", 10: "rain on a railing, a downpipe gurgle", 11: "a warm room tone, rain on a window", 12: "a room tone, a stamp, a click",
           13: "rain outside, paper inside, a thud through the door", 14: "rain on an awning, a pencil scratch, a soft hum"}
CENTER = {1: "the letterbox at x540 y900", 2: "the door at x540 y900", 3: "the notice at x540 y900", 4: "the vellum at x700 y920", 5: "the screen at x540 y900",
          6: "the person at x420 y980", 7: "the edge at x540 y900", 8: "the basket at x540 y960", 9: "the timers at x540 y920", 10: "the cards at x540 y900",
          11: "the clerk at x540 y980", 12: "the desk at x540 y920", 13: "the cross-section at x540 y940", 14: "the vellum at x640 y920"}
HERO = {
 1: ("letterbox + question balloon + pencil outline + sodium lamp + rain", "50% letterbox, 25% balloon, 25% lamp cone and pencil line"),
 2: ("street door + person + napkin note", "40% door and lamp, 30% person, 30% hillside and street"),
 3: ("printed notice + tape corners + department tag + wired glass + hillside reflection", "55% notice, 25% glass panel, 20% tag"),
 4: ("tracing vellum + envelope + Tote + blank hang tag", "40% vellum and letterbox, 30% Tote, 30% envelope and tag"),
 5: ("screen + official form + state seal + portal login + desk", "55% screen, 25% form, 20% desk"),
 6: ("person + phone + ice-cyan helper + scroll + pencil + note + awning", "45% person, 30% phone and scroll, 25% awning and door"),
 7: ("folded note + dashed fourth edge", "50% edge, 30% note, 20% vellum"),
 8: ("wire basket + request stack + DRAFT tape line + candle + hour meter + law plaque", "40% basket and stack, 30% meter, 30% candle"),
 9: ("tall sand timer + squat sand timer + DRAFT tag + denial slip + shelf", "50% timers, 30% slip, 20% shelf"),
 10: ("card + green stair railing", "50% cards, 30% railing, 20% steps and rain"),
 11: ("night clerk + oak desk + green lamp + candle + placard + window + stack", "45% clerk, 30% desk and placard, 25% window and candle"),
 12: ("waiver stamp + calendar + portal screen + portrait card + dollar request + tray", "30% stamp, 25% calendar, 25% portal, 20% tray"),
 13: ("door cross-section + rain + basket + person's stack + dashed ghost stack + 250 line + labels + blank tag", "40% stacks, 30% door section, 30% labels and tag"),
 14: ("dashed fourth edge + phone + question balloon", "40% vellum and edge, 30% balloon, 30% phone and shoulder"),
}
PARTS = {1: 48, 2: 56, 3: 44, 4: 54, 5: 44, 6: 52, 7: 44, 8: 52, 9: 44, 10: 46, 11: 54, 12: 50, 13: 58, 14: 50}
KICKS = (7, 25, 36)
CAMERA = {1: "dollyThrough", 2: "truckAcross", 3: "static:the notice slapping on and its tape snapping is the move", 4: "truckAcross", 5: "dollyThrough",
          6: "truckAcross", 7: "dollyThrough", 8: "craneDown", 9: "static:the timers turning and landing are the move", 10: "static:a locked level frame so neither card is favoured",
          11: "dollyThrough", 12: "static:an overhead locked desk where four props land in turn", 13: "craneDown", 14: "truckAcross"}

PALETTE = ("rain-black Juneau night #142420, slate stone #3A4A5C lifted to #5E7385 under one sodium amber wall lamp #F2A541, a blackened gunmetal letterbox #4A4F57 with a nickel lip #B9BEC4 on a near-black door #1E2A26, "
           "translucent tracing vellum #E6EEF2 drawn in lead pencil #3A4652 for everything PROPOSED, glacier-cyan #9FE7FF on screens where AI shows, request paper #F3E9D2, an oak interior #6B4A2E under a jade-shaded desk lamp")


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
                    "Drawn as a faceless gunmetal letterbox in a Juneau door with a pencilled DRAFT template on tracing vellum clipped beside it whose fourth edge is dashed, AUTOMATED TOOL = ?. A service envelope and a courier robot wait at the pencil line, a person drafts with an AI helper and carries the note to the slot where it stays half in, the night clerk gets the fair case, "
                    "and in a door cross-section a stack of hand-filled forms meets the 250 line beside a dashed ghost IF ALLOWED. The film ends on the question of where a tool ends."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "slot-height-closeup", "motion_vector": "vertical-descent", "hero_treatment": "data-as-subject", "layout": "offset-thirds",
                        "register": "night-noir-storybook", "palette": PALETTE, "camera_strategy": "push-and-crane-through",
                        "light_story": "one sodium amber lamp raking a rain-black door outside, a warm green-shaded desk lamp inside for the fair case",
                        "metaphor": "a letterbox that has always swallowed any question gets a pencilled draft template clipped beside it whose fourth edge is a dashed line nobody has inked"}, "signature_shot": 13,
        "palette": PALETTE,
        "divergence_note": ("The last films were high-noon white sea ice with cobalt leads and a survey camera (11-14), a brass faucet with a face on an overcast pewter-sage gravel lot (11-13), a survey stake tag on rose dusk snow with a raven (11-12) and a vermilion take-a-number machine on a violet shore (11-10). "
                            "This film is full night at one Juneau door, one sodium lamp, a FACELESS gunmetal letterbox, and the proposed rule drawn as graphite pencil on clipped tracing vellum with dashed edges and pencilled bolts, never hardware. The people (a requester and a night clerk) carry the feeling. "
                            "Honest overlaps: 11-13 was also wet and had a metal fixture as its hero with a face and a two-accent grammar (mint AI, tomato rule), answered here by night, no face on the fixture, pencil-grey for the rule and ice-cyan only on screens for AI. 11-14 had a plate on its hero and two equal signs, answered by a template that is visibly a draft and a cross-section where one stack is only a dashed ghost. 11-10 had a machine that dispenses, so the letterbox only receives."),
        "treatment": {"title": "The Slot Without an Edge", "summary": ad["treatment"],
                      "judge_reasoning": "Dramatist pitch won (47 of 60): the only retention plan with every loop explicit and legal, an Act 3 that is a real test where the clerk's case gets its own scene and then both same-size envelopes stop at the same 250 line, an AI presence that only submits through (the reported verb), and the falsifier drawn on screen. Grafts: the Enthusiast's honest AI drafting upside with the person fixing the helper's mistake and carrying it to the slot, the Explainer's crane through the slot and VOLUME label, the Comedian's statute (now on a level card, not carved). Restaged at Gate 0: faceless letterbox, the rule as a pencilled draft, nothing shown admitted or refused."},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "anomaly-question", "frame1": "Rain streaks through one sodium lamp cone onto a dark door and a faceless gunmetal letterbox, a cream question balloon drifts in from the dark, and a pencil starts sketching a dashed outline beside the slot.",
                 "headline": "ASK OUT LOUD · IT COUNTS", "motion_by_s": 0.4,
                 "loopback": "Frame 1 is the question balloon drifting into the lamp cone toward the letterbox, the last image is the same balloon holding beside the person's note at the threshold between the open slot and the dashed pencil edge, neither in nor out."},
        "open_loop": {"plant_t": b_at(7), "pay_t": b_at(38), "plant_glow_s": 0.4, "plant_sfx": "snap", "what": "Why is the AI line there? Planted as a BLANK tag folded behind a clip on the draft template as it lands, dropped open under NOTHING REPORTED SAYS WHY, held on as the voice says hold on to that, kept in frame on the template in shots 4, 7 and 14 and spilling its glow in shot 8, paid when the same tag swings into the middle of the cross-section, still blank, as the voice says nothing reported says."},
        "open_loop_2": {"plant_t": b_at(17), "pay_t": b_at(40), "what": "Is the person with the AI helper an automated tool? Planted as the folded note pressing at the dashed edge under AUTOMATED TOOL = ?, carried through the middle caught half in the slot, seen from inside in shot 8 and behind the clerk in shot 11, paid in two moves, the ruler traces the edge solid under IF DEFINED NARROWLY, then on where a tool ends it breaks back into dashes, handing the question to the viewer."},
        "throughline": {"object": "the Question, a cream balloon that becomes a folded note", "lands_in_button": "the balloon holds beside the person's note at the threshold, neither in nor out, as it drifted in frame 1",
                        "states": [
                            {"at_s": b_at(1), "state": "Q1 a spoken balloon, gulped"},
                            {"at_s": b_at(4), "state": "Q1b a napkin note on any paper, swallowed"},
                            {"at_s": b_at(16), "state": "Q2 a trimmed note, fixed by hand, carried to the slot by the person"},
                            {"at_s": b_at(17), "state": "Q3 the folded note pressing at the dashed edge, neither in nor out"},
                            {"at_s": b_at(19), "state": "Q3b caught half in the slot, seen from inside the door"},
                            {"at_s": b_at(28), "state": "Q4 still caught in the door slot behind the clerk, glanced at, not taken"},
                            {"at_s": b_at(37), "state": "Q5 not in either stack: the forms stack and a dashed ghost stack meet the 250 line while the question stays out"},
                            {"at_s": b_at(46), "state": "Q5b still caught in the slot, the person's finger on it, not pushing"},
                            {"at_s": b_at(41), "state": "Q6 a balloon again, holding beside the note at the threshold"}]},
        "reveals": [
            {"t": b_at(3), "type": "scale-pullback", "what": "the cut across the road shows the whole lit door, the lamp, the JUNEAU sign and the street in the rain", "hold_s": 0.8},
            {"t": b_at(19), "type": "build-on", "what": "the crane through the slot reveals the basket, the tape line, the candle and the meter inside the door", "hold_s": 0.8},
            {"t": b_at(36), "type": "scale-pullback", "what": "the door splits open into a cross-section, outside and inside at once", "hold_s": 0.8},
            {"t": b_at(37), "type": "build-on", "what": "the person's stack lands at the 250 line beside a dashed ghost stack", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.5}, {"line": 3, "offset": 0.0, "level": 1.4}, {"line": 6, "offset": 0.0, "level": 1.0},
            {"line": 9, "offset": 0.0, "level": 1.8}, {"line": 14, "offset": 0.0, "level": 0.8}, {"line": 18, "offset": 0.0, "level": 1.9},
            {"at_s": round(b_at(41) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(41) + 0.5, 3), "level": 1.6},
            {"from_end": 0.4, "level": 0.0}],
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
