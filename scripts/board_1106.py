#!/usr/bin/env python3
"""2026-11-06 "Who Wrote the Rules": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1106.py gen       # write out/dispatch/storyboard.json (estimated timing until vo_lines.json exists)
    python3 scripts/board_1106.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board_anchor import AnchorBook  # noqa: E402
import board_1102 as base  # noqa: E402  (shared helpers only: est_starts, line_starts, load_words, _phrase)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"
LINES = base.LINES

W = lambda w, n=1: (w, n)
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "stamp", "StampBot", "slams a magenta REJECTED stamp on a student essay so ink splats toward the lens", "stern", "REJECTED", "the ink splat spreads", ""),
 (2, 0, W("nineteen"), "ping", "a tray of exactly 150 dots", "slides onto the desk and 119 of them glow", "reading", "119 OF 150 CITED", "the dots glow", ""),
 (3, 0, W("So"), "pop", "a blank gold token", "drops onto the Plan Sheet beside its blank dotted strip reading WHO WROTE THIS? while StampBot's eye slides to it", "puzzled", "WHO WROTE THIS?", "the token wobbles", "plant: who wrote the rules"),
 (4, 1, 0.0, "page", "a calendar page", "flips to MAY above a row of regent chairs", "reading", "ASKED IN MAY", "the page settles", ""),
 (5, 1, W("Fairbanks"), "pin", "a map pin", "drops onto Fairbanks on a top-down Alaska map", "reading", "REGENTS · FAIRBANKS", "the pin bounces", ""),
 (6, 1, W("Engaged"), "clunk", "DiplomaPress", "ejects the Plan Sheet titled AI ENGAGED with a blank dotted strip at its foot", "proud", "AI ENGAGED", "the press hiccups", ""),
 (7, 2, 0.0, "pop", "six badges", "pop onto the Plan Sheet one after another", "proud", "6 PRINCIPLES", "the badges settle", ""),
 (8, 2, W("four"), "ping", "four coins", "drop in a stack beside the Sheet", "reading", "4 INVESTMENT PRIORITIES", "the coins settle", ""),
 (9, 2, W("five"), "clank", "five checkboxes", "tick down the side of the Plan Sheet one after another", "reading", "5 EXPECTATIONS PER CAMPUS", "the ticks land", ""),
 (10, 2, W("class"), "whoosh", "a hundred little desks", "pull into view each holding a different rule sign while one reads ASK ME", "wry", "CLASS BY CLASS", "the signs flip", ""),
 (11, 3, W("recommend"), "slide", "the chatbot ServerMachine", "slides a note across a desk toward a human hand", "focused", "AI RECOMMENDS", "the note slides", ""),
 (12, 3, W("person"), "stamp", "a human hand", "stamps the note while StampBot beams", "proud", "A PERSON DECIDES", "the stamp rings", ""),
 (13, 4, 0.0, "page", "two professors", "step up as one raises an op-ed and the other lays an October calendar page with the 9th circled", "firm", "OP-ED · UAA PROFESSORS", "the paper rustles", "rehook: two professors step up with an op-ed"),
 (14, 4, W("Claude"), "clip", "the chatbot ServerMachine", "sets its pencil down on the desk and clips a tag to its own casing", "focused", "THIS FILM IS ALSO BUILT ON CLAUDE", "the tag clips on", ""),
 (15, 4, W("disclosed"), "crack", "the gold token", "cracks and its engraving changes to NOT DISCLOSED UNTIL OCT 9TH", "worried", "OP-ED CLAIM · NOT DISCLOSED UNTIL OCT 9TH", "the crack spreads", "plant: did anyone hide it"),
 (16, 5, 0.0, "tick", "a typewriter", "types the professors' quote across the Plan Sheet", "stern", "ALLOWING AI TO SPEAK FIRST SETS THE HARMFUL PRECEDENT", "the letters land", ""),
 (17, 5, W("chatbots"), "shimmer", "a balance scale", "tips toward a chatbot on one pan against a hand on the other", "somber", "CHATBOT'S AUTHORITY · HUMAN WISDOM", "the scale tips", ""),
 (18, 6, 0.0, "swell", "five faculty", "sit in a warm room around the Sheet", "calm", "REBUTTAL · 5 UA FACULTY · NOV 5TH", "the room glows", "rehook: five faculty answer in a warm room"),
 (19, 6, W("concealed"), "tick", "a speech bubble", "types the faculty line while StampBot lowers its stamp", "calm", "\"IN THIS CASE, AI USE WAS NOT 'CONCEALED.'\"", "the bubble holds", ""),
 (20, 6, W("administrators"), "whoosh", "a hallway of half-filled chairs", "pulls back through the wall behind the room with a tag asking WHO WASN'T THERE?", "curious", "ANYONE WHO MET WITH ADMINISTRATORS KNEW", "the chairs wait", ""),
 (21, 7, 0.0, "clank", "an arrow from the professors", "points at the chatbot ServerMachine labeled USED", "reading", "THE FAIR PART", "the arrow locks", ""),
 (22, 7, W("hid"), "blip", "a third arrow", "points at an empty box with a magenta question mark", "puzzled", "HIDDEN?", "the box pulses", ""),
 (23, 8, 0.0, "whoosh", "ten thousand five hundred dots", "fill the frame then pull back to a field", "reading", "10,500+ UAA STUDENTS", "the dots drift", ""),
 (24, 8, W("point"), "blip", "119 glowing dots", "shrink to a pinprick in the field", "reading", "119 OF 10,500+ · ABOUT 1.1%", "the pinprick glows", ""),
 (25, 8, W("Cited"), "thud", "a card", "drops onto the field", "somber", "CITED CASES, NOT ALL CASES", "the card settles", ""),
 (26, 9, 0.0, "chime", "the blank dotted strip", "fills with a typed line while an unlit lightbulb waits beside it", "proud", "OUR SUGGESTION · DRAFTED WITH AI · DECIDED BY PEOPLE", "the line types in", "rehook: the footnote strip fills at last"),
 (27, 9, W("decided"), "stamp", "StampBot", "presses an OUR SUGGESTION note onto the plan and the lightbulb lights", "proud", "ONE LINE, DISCLOSED", "the stamp rings", ""),
 (28, 9, W("rule"), "swish", "an arrow", "loops from the strip back to the AI RECOMMENDS note", "reading", "THE PLAN'S OWN RULE", "the arrow loops", ""),
 (29, 10, 0.0, "rustle", "a small tag", "drops and hangs from the Sheet", "calm", "NO DECISION REPORTED", "the tag swings", ""),
 (30, 10, W("Claude"), "stamp", "the chatbot ServerMachine", "gets a magenta BUILT ON CLAUDE stamp on its forehead and looks straight at the lens", "focused", "THIS FILM · BUILT ON CLAUDE", "the machine holds still", ""),
 (31, 11, 0.0, "pop", "a fresh Plan Sheet", "drops in with the footnote pencilled in dashes while the gold token reads ONE LINE?", "warm", "ONE LINE OR WHO WAS THERE?", "the token shines", ""),
 (32, 11, 0.62, "whoosh", "StampBot", "lifts the stamp over a new student essay and the footnote reads DRAFTED WITH AI", "wry", "SHOWS ITS WORK", "the stamp hovers", ""),
 (33, 1, 0.36, "creak", "the regents", "fill four chairs and one regent flips the Plan Sheet over looking for a byline", "reading", "THE BOARD OF REGENTS", "the chairs fill", ""),
 (34, 2, W("Until"), "slide", "a single desk", "slides in beside the Plan Sheet with a NO AI sign", "wry", "UNTIL NOW · EACH CLASS ITS OWN", "the sign wobbles", ""),
 (35, 3, 0.0, "tap", "a name card", "drops onto the desk beside the chatbot", "reading", "STEPHANIE ERICKSON · UA SPECIAL PROJECTS LEAD", "the card settles", "rehook: a name card drops and the plan's core idea begins"),
 (36, 5, W("precedent"), "tick", "an ink underline", "slides under the word precedent in the typed quote", "stern", "\"THE HARMFUL PRECEDENT\"", "the underline lands", ""),
 (37, 6, W("answered"), "slide", "the meeting draft", "slides across the faculty table with pencil marks in plain sight", "calm", "THEY SAY · IN PLAIN SIGHT", "the draft slides", ""),
 (38, 7, W("agree"), "clank", "a second arrow", "points at the chatbot from the other side", "reading", "BOTH SIDES AGREE · AI WAS USED", "the arrow locks", ""),
 (39, 8, W("nineteen"), "ping", "119 dots", "flash and swell in the middle of the field", "reading", "119 CITED", "the dots glow", ""),
 (40, 9, W("saying"), "whoosh", "the camera", "pulls back so the one line is the only mark at the foot of a thick plan", "reading", "ONE LINE", "the plan thickens", ""),
 (41, 10, W("disclosure"), "press", "StampBot", "inks a stamp and hovers it over the chatbot's forehead", "wry", "ONE MORE DISCLOSURE", "the stamp hovers", ""),
 (42, 3, W("core"), "pop", "the chatbot ServerMachine", "lifts its pencil and the core idea card lights up", "focused", "THE CORE IDEA", "the card lights", ""),
 (44, 0, 0.1, "splat", "the ink splat", "hits the lens and the plate wipes in", "stern", "UAA · 119 OF 150 CITED USED AI", "the ink runs", ""),
 (45, 4, W("wrote"), "stamp", "an op-ed headline", "stamps onto the Plan Sheet title", "firm", "THE OP-ED SAYS", "the headline lands", ""),
 (46, 10, W("reported"), "scribble", "the tag text", "fills in line by line", "calm", "NO RESULT ON THE PLAN", "the tag fills", ""),
 (47, 0, W("misconduct"), "tap", "a tag", "drops onto the dot tray and sticks", "reading", "CITED FOR MISCONDUCT", "the tag pins on", ""),
 (48, 6, W("draft"), "swell", "the pencil marks", "on the meeting draft swell and glow", "calm", "THE FIRST DRAFT", "the marks glow", ""),
 (43, 5, W("speak"), "pop", "a tiny chatbot", "pops into the corner of the quote sheet and speaks first", "wry", "AI SPEAKS FIRST", "the chatbot pops in", ""),
]

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "close", "high", "stamp-desk", "macro-closeup", "centered-hero-lowerthird", "radial-emanate", "single-organic-hero", "", "", "The slam", "StampBot slams REJECTED on an essay, the dot field glows, the Plan Sheet slides in with a blank token"),
 (2, 1, "map-territory", "extreme-wide", "overhead", "regents-map", "top-down-map", "map-territory", "push-in-only", "landscape-as-subject", "whip-pan", "carry", "The regents", "A calendar flips to May, a pin drops on Fairbanks, DiplomaPress ejects AI ENGAGED"),
 (3, 2, "data-panel", "medium", "eye", "plan-desk", "exploded-diagram", "grid-modular", "assemble-build", "multiplicity-swarm", "carried-element", "carry", "The plan", "Six badges, four coins, five campus doors, then a hundred desks each with its own sign"),
 (4, 3, "two-up", "medium", "low", "decision-desk", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "match-cut", "match", "Recommends, decides", "The chatbot slides a note across the desk and a human hand stamps it"),
 (5, 4, "alt-vantage", "wide", "low", "newsstand", "cross-section-cutaway", "stacked-layers", "vertical-descent", "single-organic-hero", "hard-cut", "match", "The fight", "Two professors hold the op-ed, the chatbot sweats, the token cracks"),
 (6, 5, "macro-closeup", "insert", "overhead", "typed-sheet", "instrument-screen", "single-object-void", "scroll-data", "data-as-subject", "mask-wipe", "travel", "The quote", "The quote types across the Plan Sheet and ghost text writes with no author line"),
 (7, 6, "wide-establish", "wide", "eye", "faculty-room", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "multiplicity-swarm", "crossfade", "travel", "The meeting everyone was in", "Five faculty in a warm room, the speech bubble, then the hallway of empty chairs"),
 (8, 7, "two-up", "medium", "high", "agree-desk", "instrument-screen", "fullbleed-split", "radial-emanate", "structure-as-subject", "whip-pan", "match", "Both agree", "Two equal arrows point at USED and a third at HIDDEN?"),
 (9, 8, "data-panel", "extreme-wide", "overhead", "dot-field", "top-down-map", "grid-modular", "scroll-data", "data-as-subject", "pull-out", "travel", "Cited, not all", "A field of 10,500 dots, 119 shrink to a pinprick, a card says CITED CASES"),
 (10, 9, "subject-portrait", "close", "eye", "footnote-desk", "macro-closeup", "centered-hero-lowerthird", "assemble-build", "single-organic-hero", "match-cut", "match", "The footnote", "The blank strip fills, the bulb lights, StampBot stamps DISCLOSED"),
 (11, 10, "alt-vantage", "medium", "low", "tag-desk", "eye-level-immersive", "single-object-void", "push-in-only", "instrument-as-subject", "hard-cut", "carry", "Our own label", "NO DECISION REPORTED tag, the chatbot stamped BUILT ON CLAUDE"),
 (12, 11, "wide-establish", "wide", "eye", "fresh-sheet", "eye-level-immersive", "stacked-layers", "push-in-only", "single-organic-hero", "carried-element", "carry", "The loop", "A fresh Sheet with its footnote printed, the token shines, StampBot lifts the stamp over a new essay"),
]

AMBIENT = {1: "the ink drips, the dots drift, StampBot breathes", 2: "dust drifts in the window light, the pin pulses", 3: "the badges rock, the coins settle, the signs flip",
           4: "the note slides, the hand stamps, StampBot beams", 5: "the paper rustles, sweat drops, the token cracks", 6: "the letters land, the ghost text flickers",
           7: "the room glows, the chairs stand empty", 8: "the arrows lock, the box pulses", 9: "the dots drift, the pinprick glows",
           10: "the bulb flickers, the strip glows, the stamp rings", 11: "the tag swings, the machine whistles", 12: "the token shines, StampBot hovers"}
CENTER = {k: f"the hero at x540 y1000" for k in range(1, 13)}
HERO = {
 1: ("StampBot + essay + dot field + Plan Sheet + token", "35% StampBot, 25% essay, 20% dots, 20% sheet"),
 2: ("calendar + Alaska map + pin + DiplomaPress + Plan Sheet", "30% map, 25% calendar, 25% press, 20% sheet"),
 3: ("Plan Sheet + badges + coins + campus doors + hundred desks", "30% sheet, 25% badges, 25% doors, 20% desks"),
 4: ("chatbot + note + desk + human hand + StampBot", "30% chatbot, 25% note, 25% hand, 20% StampBot"),
 5: ("two professors + op-ed + chatbot + cracked token", "30% professors, 25% paper, 25% chatbot, 20% token"),
 6: ("Plan Sheet + typed quote + ghost text + magnifier", "40% sheet, 30% text, 30% magnifier"),
 7: ("five faculty + warm room + speech bubble + empty chairs", "35% faculty, 25% room, 20% bubble, 20% chairs"),
 8: ("chatbot + two arrows + third arrow + empty box", "30% chatbot, 40% arrows, 30% box"),
 9: ("dot field + glowing 119 + CITED card", "60% field, 20% pinprick, 20% card"),
 10: ("footnote strip + lightbulb + StampBot + DISCLOSED stamp", "35% strip, 25% bulb, 25% StampBot, 15% stamp"),
 11: ("tag + chatbot + BUILT ON CLAUDE stamp", "40% chatbot, 30% stamp, 30% tag"),
 12: ("fresh Sheet + token + StampBot + new essay", "35% sheet, 25% token, 25% StampBot, 15% essay"),
}
PARTS = {1: 44, 2: 46, 3: 60, 4: 40, 5: 44, 6: 34, 7: 52, 8: 36, 9: 40, 10: 40, 11: 34, 12: 40}
KICKS = (12, 27)
CAMERA = {1: "craneDown+dollyThrough", 2: "craneDown", 3: "dollyThrough", 4: "truckAcross", 5: "dollyThrough", 6: "dollyThrough", 7: "craneDown+dollyThrough", 8: "truckAcross", 9: "craneDown", 10: "dollyThrough", 11: "truckAcross", 12: "craneDown+dollyThrough"}

PALETTE = ("saturated tangerine office walls, deep teal desks, cream legal pads, a mint clerk robot with an oxblood arm and raspberry ink")


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

    tre = json.loads((OUT / "treatment.json").read_text())
    board = {
        "run_date": "2026-11-06", "slug": "who-wrote-the-rules", "title": "Who Wrote the Rules",
        "concept": ("The University of Alaska regents have a first systemwide AI plan, AI Engaged, before them, and two UAA professors write in an op-ed that Anthropic's Claude produced the first draft and that this wasn't disclosed until October 9th, while five faculty answer that the use was not concealed. Both sides agree AI was used and disagree only about whether anyone hid it. "
                    "At UAA 119 of 150 students cited for misconduct used AI, about 1.1 percent of more than 10,500 students and cited cases only. No decision on the plan had been reported. The film proposes one plain disclosure line on the plan, the same rule the plan sets for AI (it recommends, a person decides), and discloses that its own pipeline is built on Claude. "
                    "A mint rubber-stamp robot named StampBot is the hero and a gold question token the throughline, ending as DISCLOSED on a footnote strip."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "macro-closeup", "motion_vector": "assemble-build", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "editorial-schematic", "palette": PALETTE, "camera_strategy": "dolly-through",
                        "light_story": "noon-hard",
                        "metaphor": "a rubber stamp that has rejected student essays all semester is asked to stamp the university's own AI plan and finds a blank footnote strip where the disclosure should be"},
        "palette": PALETTE,
        "divergence_note": ("The last five films were a night cab (11-02), an overcast moss slope (11-01), a sage-and-cream chart desk (10-31), an aubergine dusk depot (10-29) and a green-black sonar abyss (10-28). "
                            "This film is a saturated tangerine daylight office with deep teal desks, cream paper and a mint rubber-stamp hero, lit by hard noon window light. It has no cab, slope, depot or sea cutaway, "
                            "and its signature object is a gold question token that changes its engraving at every act boundary and lands as DISCLOSED on a footnote strip that sat blank from the first shot."),
        "treatment": {"title": "The Footnote", "summary": tre["judge_reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "hook": {"pattern": "anomaly-question", "frame1": "StampBot slams a magenta REJECTED stamp on a student essay and ink splats toward the lens, a plate reads UAA 119 OF 150 CITED USED AI.",
                 "headline": "WHO WROTE THE RULES", "motion_by_s": 0.3,
                 "loopback": "StampBot lifts the stamp over a new essay with a footnote on it, rhyming with the opening slam."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(26), "what": "Who writes the rules? Planted with the blank gold token on the Plan Sheet, paid when the footnote strip fills with the one-line disclosure."},
        "open_loop_2": {"plant_t": b_at(15), "pay_t": b_at(22), "what": "Did anyone hide it? Planted when the token cracks to NOT DISCLOSED UNTIL OCT 9TH, paid at the empty box HIDDEN? after both sides agree AI was used."},
        "throughline": {"object": "a gold question token", "lands_in_button": "the token is polished and reads DISCLOSED on the footnote strip, the film's argument",
                        "states": [
                            {"at_s": b_at(3), "state": "blank engraving WHO WROTE THIS?"},
                            {"at_s": b_at(10), "state": "re-engraved ASK THE CLASS"},
                            {"at_s": b_at(12), "state": "engraved A PERSON DECIDES with a dent"},
                            {"at_s": b_at(15), "state": "cracked NOT DISCLOSED UNTIL OCT 9TH"},
                            {"at_s": b_at(19), "state": "taped and re-engraved WHO WAS THERE?"},
                            {"at_s": b_at(25), "state": "blank and unengraved beside the still-empty footnote strip"},
                            {"at_s": b_at(31), "state": "polished DISCLOSED on the footnote strip"}]},
        "reveals": [
            {"t": b_at(10), "type": "scale-pullback", "what": "from one desk's rule sign to a hundred desks each with its own", "hold_s": 0.8},
            {"t": b_at(20), "type": "scale-pullback", "what": "from the warm faculty room to a hallway of empty chairs", "hold_s": 0.8},
            {"t": b_at(23), "type": "morph-to-chart", "what": "ten thousand five hundred dots with 119 glowing shrinking to a pinprick", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.3}, {"line": 1, "offset": 0.0, "level": 0.55}, {"line": 2, "offset": 0.0, "level": 1.0},
            {"line": 3, "offset": 0.0, "level": 0.45}, {"line": 4, "offset": 0.0, "level": 1.6}, {"line": 5, "offset": 0.0, "level": 0.35},
            {"line": 6, "offset": 0.0, "level": 0.5}, {"line": 7, "offset": 0.0, "level": 1.5}, {"line": 8, "offset": 0.0, "level": 0.3},
            {"at_s": round(b_at(26) - 0.3, 3), "level": 0.12}, {"at_s": round(b_at(26) + 0.8, 3), "level": 1.7},
            {"line": 10, "offset": 0.0, "level": 0.5}, {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(26) - 0.3, 3), "riser_at": round(b_at(25), 3), "silence_at": round(b_at(26) - 0.3, 3),
            "payoff_at": b_at(26), "button_pattern": "callback", "interrupt_at": b_at(18), "extra_dips": [b_at(21)]},
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
    book.raise_if_missing("board_1106 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1106Ids.ts").write_text(
        "// GENERATED by scripts/board_1106.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
