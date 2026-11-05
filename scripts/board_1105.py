#!/usr/bin/env python3
"""2026-11-05 "Who Held the Pen": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1105.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1105.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
W = lambda w, n=1: (w, n)
# key, shot, line, anchor, sfx, subject, action, emotion, annotation, shows, reaction, rehook
B = [
 (1, 1, 0, 0.0, "click", "DiplomaPress", "sits on a seminar table, its mint machine handle trembling over a sheet reading AI ENGAGED", "curious", "AI ENGAGED",
  "the oxblood DiplomaPress sits on a seminar table with its mint machine handle twitching over a draft sheet, a plate reads AI ENGAGED", "the handle trembles", ""),
 (2, 1, 0, W("professors"), "ping", "the mint handle", "lights and drags a glowing line across the sheet", "curious", "TWO PROFESSORS SAY · CLAUDE WROTE THE FIRST DRAFT",
  "the mint machine handle lights and drags a glowing line across the draft sheet, a plate reads TWO PROFESSORS SAY · CLAUDE WROTE THE FIRST DRAFT", "the line glows", ""),
 (3, 1, 1, 0.0, "page", "a calendar card", "flips onto the table beside the press", "reading", "REGENTS · NOVEMBER MEETING",
  "a calendar card flips onto the table beside the press, a plate reads REGENTS · NOVEMBER MEETING", "the card settles", ""),
 (4, 2, 2, 0.0, "whoosh", "a pen", "swings over the sheet between a cream human hand and a mint machine hand", "puzzled", "WHO HELD THE PEN?",
  "a pen swings over the sheet between a cream human hand and a mint machine hand, a plate reads WHO HELD THE PEN?", "the pen swings", "plant: who held the pen"),
 (5, 2, 3, W("Claude"), "ping", "the mint hand", "drags CLAUDE across the first line of the sheet", "curious", "THEY SAY · CLAUDE",
  "the mint hand drags CLAUDE across the first line of the sheet, a plate reads THEY SAY · CLAUDE", "the ink glows", ""),
 (6, 2, 3, W("October"), "page", "a calendar page", "flips to OCT 9 while a hush stamp lifts off the sheet", "reading", "OCT 9TH · THEY SAY",
  "a calendar page flips to OCT 9 while a hush stamp lifts off the sheet, a plate reads NOT DISCLOSED UNTIL OCT 9TH · THEY SAY", "the stamp lifts", ""),
 (7, 3, 4, 0.0, "thud", "a stack of summer pages", "grows beside a sun lamp under a UA badge", "reading", "UA TECH CHIEF · DRAFTED OVER THE SUMMER",
  "a stack of draft pages grows beside a sun lamp under a UA badge, a plate reads UA TECH CHIEF · DRAFTED OVER THE SUMMER", "the stack grows", "rehook: a stack of summer pages grows under a sun lamp"),
 (8, 3, 4, W("regents"), "stamp", "a request slip", "slides in under the lamp and gets pinned to the stack", "reading", "AT THE REGENTS' REQUEST",
  "a request slip slides in under the lamp and gets pinned to the stack, a plate reads AT THE REGENTS' REQUEST", "the pin rings", ""),
 (9, 3, 5, W("both"), "clunk", "the two stacks", "slide together over one sheet", "wry", "BOTH CAN BE TRUE",
  "the two draft stacks slide together over one sheet, a plate reads BOTH CAN BE TRUE", "the stacks settle", ""),
 (10, 3, 5, W("response"), "flip", "an empty speech bubble", "opens beside the stacks, pulses and stays empty", "puzzled", "WE FOUND NO UA RESPONSE",
  "an empty speech bubble opens beside the stacks, pulses and stays empty, a plate reads UA RESPONSE · NOT FOUND", "the bubble pulses", ""),
 (11, 4, 6, 0.0, "pop", "150 name tags", "hang in a grid on a cream wall", "reading", "150 STUDENTS CITED · UAA REPORT",
  "150 name tags hang in a grid on a cream wall, a plate reads 150 STUDENTS CITED · UAA REPORT", "the tags sway", ""),
 (42, 4, 6, W("report"), "flip", "a row of name tags", "tilts and settles on the wall", "reading", "CITED FOR MISCONDUCT",
  "a row of name tags tilts and settles on the wall, a plate reads CITED FOR MISCONDUCT", "the tags settle", ""),
 (12, 4, 6, W("nineteen"), "ping", "119 tags", "flip up mint underline ticks in a ripple across the grid", "alarmed", "119 OF 150 CITED · USED AI",
  "119 of the name tags flip up mint underline ticks in a ripple across the grid, a plate reads 119 OF 150 CITED · USED AI", "the ripple runs", ""),
 (13, 4, 7, 0.0, "punch", "a bar", "climbs from a baseline of 1.0 up to 1.73", "alarmed", "AI PLAGIARISM · UP 73% · LAST YEAR",
  "a bar climbs from a baseline of 1.0 up to 1.73, a plate reads AI PLAGIARISM · UP 73% · LAST YEAR", "the bar overshoots", ""),
 (31, 4, 7, 0.6, "pop", "a +73% label", "pops onto the top of the bar", "alarmed", "+73% · LAST YEAR",
  "a +73% label pops onto the top of the bar, a plate reads +73% · LAST YEAR", "the label bounces", ""),
 (14, 5, 8, 0.0, "tick", "a map of Alaska", "shows three campus pins each holding its own little rulebook", "curious", "NO SYSTEMWIDE AI POLICY TODAY",
  "a map of Alaska shows three campus pins each holding its own little rulebook, a plate reads NO SYSTEMWIDE AI POLICY TODAY", "the pins pulse", "rehook: a map of Alaska with three campus pins each holding a rulebook"),
 (37, 5, 8, 0.3, "snap", "a campus flag", "snaps up at the Fairbanks pin beside the draft sheet", "curious", "3 CAMPUSES",
  "a campus flag snaps up at the Fairbanks pin beside the draft sheet, a plate reads 3 CAMPUSES", "the flag snaps", ""),
 (15, 5, 9, 0.0, "snap", "a band", "ties the three pins into one triangle", "reading", "IF APPROVED · ALL 3 CAMPUSES NEED A PLAN",
  "a band ties the three campus pins into one triangle, a plate reads IF APPROVED · ALL 3 CAMPUSES NEED A PLAN", "the band snaps tight", ""),
 (16, 6, 10, 0.0, "creak", "the press", "swings to show its oxblood human examiner handle", "focused", "THE FAIR CASE",
  "the DiplomaPress swings to show its oxblood human examiner handle on bone paper, a plate reads THE FAIR CASE", "the paper settles", ""),
 (17, 6, 10, W("recommend"), "whoosh", "the mint handle", "pulls the die down toward the sheet", "focused", "AI COULD RECOMMEND",
  "the mint machine handle pulls the die down toward the sheet, a plate reads AI COULD RECOMMEND", "the die drops", ""),
 (18, 6, 10, W("decides"), "clunk", "the examiner handle", "catches the die a hand short of the sheet", "proud", "BUT A HUMAN DECIDES",
  "the oxblood examiner handle catches the die a hand short of the sheet, a plate reads BUT A HUMAN DECIDES", "the die rocks", ""),
 (19, 6, 11, 0.0, "bloom", "a quote card", "slides in beside the press and lands against the bone paper", "reading", "\"BE DELIBERATE\" · UA OFFICIAL",
  "a quote card slides in beside the press and lands against the bone paper, a plate reads \"BE DELIBERATE\" · UA OFFICIAL", "the card settles", ""),
 (20, 7, 12, 0.0, "creak", "a ring of chairs", "slides in around the press with a pen on the first", "curious", "A FIRST DRAFT ISN'T A FLAW",
  "a ring of chairs slides in around the press with a pen on the first, a plate reads WHO READS IT · WHO CHANGES IT", "the chairs settle", ""),
 (21, 7, 12, W("change"), "knock", "a red edit mark", "pulses in the sheet's margin", "curious", "WHO GETS TO CHANGE IT?",
  "a red edit mark pulses in the margin of the sheet, a plate reads WHO GETS TO CHANGE IT?", "the mark pulses", "rehook: a red edit mark pulses in the margin"),
 (22, 7, 13, 0.0, "thud", "two empty chairs", "stand dim with tags reading FACULTY and STUDENTS", "somber", "SUMMER DRAFT · TOO LITTLE FEEDBACK",
  "two empty chairs stand dim with tags reading FACULTY and STUDENTS, a plate reads SUMMER DRAFT · TOO LITTLE FEEDBACK", "the chairs dim", ""),
 (23, 8, 14, 0.0, "ping", "a highlighter", "sweeps across the margin of the sheet", "determined", "THE PART TO WATCH",
  "a highlighter sweeps across the margin of the sheet, a plate reads THE PART TO WATCH", "the highlight glows", ""),
 (38, 8, 14, W("whoever"), "ping", "the highlighter", "lands on the words WHOEVER HELD THE PEN", "determined", "WHOEVER HELD THE PEN",
  "the highlighter lands on the words WHOEVER HELD THE PEN, a plate reads WHOEVER HELD THE PEN", "the highlight flares", ""),
 (24, 8, 15, 0.0, "stamp", "a DROP stamp", "ghosts over the sheet", "somber", "DROP THE PLAN · THEY SAY",
  "a DROP IT stamp ghosts over the sheet, a plate reads DROP THE PLAN · THEY SAY", "the stamp rings", ""),
 (25, 8, 15, W("trusting"), "snap", "a quote card", "snaps onto the desk", "somber", "\"WRONG APPROACH\" · HARTLEY AND POTTER",
  "a quote card snaps onto the desk, a plate reads \"WRONG APPROACH\" · HARTLEY AND POTTER", "the card rocks", ""),
 (26, 9, 16, 0.0, "crack", "the cyan handle", "goes still on the press while the token holds", "warm", "A HUMAN DECIDES · THE UNIVERSITY SAYS",
  "the mint machine handle goes still on the press while the draft sheet holds, a plate reads A HUMAN DECIDES · THE UNIVERSITY SAYS", "the sheet rocks", ""),
 (41, 9, 16, 0.25, "knock", "the pen", "lifts off the blank signature line", "somber", "UNSIGNED",
  "the pen lifts off the blank signature line, a plate reads UNSIGNED", "the pen hovers", ""),
 (27, 9, 16, W("consulted"), "hush", "the draft sheet", "lands on the blank signature line in front of two dark chairs", "somber", "WHO WAS ASKED?",
  "the draft sheet lands unsigned on its blank signature line in front of two dark chairs, a plate reads WHO WAS ASKED?", "the chairs glow", ""),
 (28, 1, 0, 0.75, "slide", "the draft sheet", "slides out of the press tray onto the table", "curious", "THE PLAN ABOUT CHATBOTS",
  "the draft sheet slides out of the press tray onto the table, a plate reads THE PLAN ABOUT CHATBOTS", "the sheet settles", ""),
 (39, 1, 1, 0.85, "flip", "a name card", "slides in front of the gavel", "focused", "BOARD OF REGENTS",
  "a tent name card slides in front of the gavel, a plate reads BOARD OF REGENTS", "the card settles", ""),
 (40, 3, 4, 0.45, "page", "the lamp", "flares as the pages riffle", "reading", "OVER THE SUMMER",
  "the lamp flares as the pages riffle, a plate reads OVER THE SUMMER", "the pages riffle", ""),
 (29, 2, 2, 0.55, "blip", "the human hand", "reaches for the pen and stops short", "puzzled", "HUMAN OR MACHINE?",
  "the cream human hand reaches for the pen and stops short, a plate reads HUMAN OR MACHINE?", "the hand hovers", ""),
 (30, 4, 6, 0.85, "punch", "a source tag", "pins to the wall of name tags", "reading", "VIA ADN · UAA REPORT",
  "a source tag pins to the wall of name tags, a plate reads VIA ADN · UAA REPORT", "the tag swings", ""),
 (32, 5, 9, 0.55, "clink", "three rulebooks", "merge into one plan on the map", "curious", "ONE PLAN · THREE CAMPUSES",
  "three little rulebooks merge into one plan on the map, a plate reads ONE PLAN · THREE CAMPUSES", "the books merge", ""),
 (33, 6, 10, 0.4, "bloom", "the examiner handle", "lifts into the light", "focused", "HUMAN IN THE LOOP",
  "the oxblood examiner handle lifts into the light, a plate reads HUMAN IN THE LOOP", "the handle flexes", ""),
 (34, 7, 12, 0.45, "crack", "the pen", "passes from chair to chair around the ring", "curious", "WHO READS IT?",
  "the pen passes from chair to chair around the ring, a plate reads WHO READS IT?", "the pen rolls", ""),
 (35, 7, 13, 0.5, "clip", "the FACULTY chair", "tips toward the empty STUDENTS chair", "somber", "FACULTY · STUDENTS",
  "the FACULTY chair tips toward the empty STUDENTS chair, a plate reads FACULTY · STUDENTS", "the chairs tip", ""),
 (36, 9, 16, W("wrote"), "blip", "the pen", "and the mint handle light up on the press", "warm", "WHO WROTE IT?",
  "the pen and the mint handle light up on the press, a plate reads WHO WROTE IT?", "the handle glows", ""),
]

S = [
 (1, 0, "subject-portrait", "medium", "eye", "seminar-table", "eye-level-immersive", "centered-hero-lowerthird", "vertical-rise", "single-organic-hero", "", "", "The press", "The DiplomaPress on a seminar table, its mint handle twitching over the AI ENGAGED sheet and a calendar card flipping on."),
 (2, 2, "alt-vantage", "close", "high", "pen-over-sheet", "macro-closeup", "single-object-void", "vertical-descent", "instrument-as-subject", "whip-pan", "travel", "The pen", "A pen hovering between a human hand and a machine hand over the sheet, the date flipping to OCT 9."),
 (3, 4, "two-up", "medium", "eye", "two-stacks", "exploded-diagram", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "carried-element", "carry", "Two drafts", "Two draft stacks slide together while an empty speech bubble pulses."),
 (4, 6, "data-panel", "wide", "low", "name-tag-wall", "instrument-screen", "grid-modular", "radial-emanate", "multiplicity-swarm", "hard-cut", "match", "150 tags", "A wall of 150 name tags, 119 flipping mint, and a bar overtaking a baseline."),
 (5, 8, "map-territory", "extreme-wide", "high", "campus-map", "top-down-map", "map-territory", "push-in-only", "landscape-as-subject", "map-travel", "travel", "Three campuses", "A top-down Alaska map with three campus pins tied into one triangle."),
 (6, 10, "wide-establish", "wide", "low", "press-handles", "cross-section-cutaway", "stacked-layers", "assemble-build", "instrument-as-subject", "mask-wipe", "travel", "The fair case", "The press on bone paper, mint handle pulling the die and the oxblood examiner handle catching it."),
 (7, 12, "alt-vantage", "wide", "eye", "chair-ring", "eye-level-immersive", "radial-burst", "scroll-data", "multiplicity-swarm", "match-cut", "match", "The chairs", "A ring of chairs around the press with two empty ones tagged FACULTY and STUDENTS."),
 (8, 14, "push-detail", "close", "eye", "highlight-margin", "macro-closeup", "single-object-void", "push-in-only", "single-organic-hero", "hard-cut", "match", "The margin", "A highlighter lighting WHOEVER HELD THE PEN and a DROP stamp ghosting over the sheet."),
 (9, 16, "subject-portrait", "medium", "low", "signature-line", "eye-level-immersive", "centered-hero-lowerthird", "vertical-rise", "single-organic-hero", "carried-element", "carry", "The token", "The brass token rotating to WHO WAS ASKED? and the pen settling on a signature line."),
]

AMBIENT = {1: "the handle twitches, dust drifts in the window light, the token breathes", 2: "the pen wavers, the hands hover, the ink glows", 3: "the lamp hums, the stacks settle, the bubble pulses",
           4: "the tags sway, the ripple runs, the bar settles", 5: "the pins pulse, the band hums, the rulebooks flutter", 6: "dust drifts, the die rocks, the dial ticks",
           7: "the chairs creak, the mark pulses, the window sun slides", 8: "the highlight glows, the stamp rings, the dust drifts", 9: "the token rocks, the sun sets, the pen rests"}
CENTER = {1: "the press at x640 y960", 2: "the pen at x330 y900", 3: "the stacks at x420 y1000", 4: "the tag wall at x540 y880", 5: "the map at x600 y1020", 6: "the press at x700 y940", 7: "the chairs at x540 y1050", 8: "the pinned sheet at x360 y960", 9: "the sheet at x540 y1040"}
HERO = {
 1: ("DiplomaPress + AI ENGAGED sheet + calendar card + QuestionToken + window sun", "40% press, 25% sheet, 20% token, 15% calendar"),
 2: ("pen + human hand + mint hand + sheet + calendar page + hush stamp", "30% pen, 25% hands, 25% sheet, 20% calendar"),
 3: ("two draft stacks + sun lamp + UA badge + request slip + speech bubble", "35% stacks, 25% lamp, 20% slip, 20% bubble"),
 4: ("150 name tags + 119 mint tags + bar + baseline", "50% tags, 30% bar, 20% wall"),
 5: ("Alaska map + three campus pins + rulebooks + band", "45% map, 30% pins, 25% band"),
 6: ("DiplomaPress + mint machine handle + oxblood examiner handle + dial", "55% press, 25% handles, 20% dial"),
 7: ("ring of chairs + press + pen + two empty tagged chairs + red edit mark", "40% chairs, 25% press, 20% tags, 15% mark"),
 8: ("sheet + highlighter + DROP stamp + quote card", "35% sheet, 30% highlighter, 20% stamp, 15% card"),
 9: ("draft sheet + pen + blank signature line + two dark chairs + press", "35% sheet, 25% pen, 20% chairs, 20% press"),
}
PARTS = {1: 44, 2: 38, 3: 46, 4: 52, 5: 36, 6: 48, 7: 44, 8: 32, 9: 30}
KICKS = (18, 24)
STAGE3D = {k: "planes" for k in HERO}
CAMERA = {1: "craneDown+dollyThrough", 2: "dollyThrough", 3: "truckAcross", 4: "dollyThrough", 5: "craneDown", 6: "dollyThrough", 7: "craneDown+dollyThrough", 8: "dollyThrough", 9: "craneDown+dollyThrough"}


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

    palette = "burgundy and oak seminar room at dusk, cream sheets, an oxblood brass press, mint machine light and highlighter yellow"
    board = {
        "run_date": "2026-11-05", "slug": "who-held-the-pen", "title": "Who Held the Pen",
        "concept": ("Two UAA professors say Anthropic's Claude wrote the first draft of the University of Alaska's 'AI Engaged' plan, which the Board of Regents is set to take up at its November meeting. "
                    "The university's technology chief says he drafted it over the summer at the regents' request, and we found no university response to the Claude claim. A UAA report says 119 of 150 students cited for misconduct used AI and AI plagiarism rose 73% last year. "
                    "The fair case: a university official says AI could recommend but a human decides. The film's position is that who held the pen matters less than who was consulted, because by the reporting the summer draft got too little faculty and student feedback. "
                    "A DiplomaPress with a mint machine handle and an oxblood human examiner handle is the hero and the draft sheet is the throughline, ending unsigned before two dark chairs"),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "vertical-rise", "hero_treatment": "single-organic-hero", "layout": "centered-hero-lowerthird",
                        "register": "naturalistic-scene", "palette": palette, "camera_strategy": "slow-orbit-and-push",
                        "light_story": "golden-hour-low-key",
                        "metaphor": "a plan-stamping press with a machine handle and a human handle, and a draft sheet that changes state until it lies unsigned before two dark chairs"},
        "palette": palette,
        "divergence_note": ("The last films were an indigo night cab (11-02), a storm slate slope (11-01), a sage chart desk (10-31) and an aubergine depot (10-29). "
                            "This film is a warm burgundy and oak seminar room at dusk with cream paper, a mint machine glow and highlighter yellow light. Its hero is an oxblood brass credential press, "
                            "and it has no cab, slope, chart desk or depot. The throughline is the AI ENGAGED draft sheet, which changes state at every act boundary."),
        "treatment": {"title": "The Press With Two Handles", "summary": "Explainer's mechanism (machine handle vs human handle) with the Dramatist's empty chairs and the Comedian's pen between two hands, and the Enthusiast's fair case given a full scene."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "An oxblood DiplomaPress sits on a seminar table with its mint machine handle writing a first mint line on a draft sheet titled RULES FOR AI, a plate reads AI ENGAGED.",
                 "headline": "WHO WROTE THE AI RULES?", "motion_by_s": 0.3,
                 "loopback": "The draft sheet lies unsigned in front of two dark chairs on the same press where the mint handle wrote in the first frame."},
        "open_loop": {"plant_t": b_at(4), "pay_t": b_at(38), "what": "Who held the pen, and does that change the plan? Planted with the pen between two hands, paid when the highlighter says it is the part to watch whoever held it."},
        "open_loop_2": {"plant_t": b_at(11), "pay_t": b_at(18), "what": "Will a human stay in charge of AI at the university? Planted with the 150 name tags, paid when the oxblood human examiner handle catches the die."},
        "throughline": {"object": "the AI ENGAGED draft sheet", "lands_in_button": "the draft sheet lies unsigned on its blank signature line in front of two dark chairs, the film's argument",
                        "states": [
                            {"at_s": b_at(1), "state": "first mint line being written"},
                            {"at_s": b_at(7), "state": "buried in a summer stack under a UA badge"},
                            {"at_s": b_at(14), "state": "pinned beside a campus flag with no policy on it"},
                            {"at_s": b_at(16), "state": "embossed DRAFT by the press"},
                            {"at_s": b_at(21), "state": "red margin edit marks with the faculty and student lines blank"},
                            {"at_s": b_at(38), "state": "highlighted WHOEVER HELD THE PEN"},
                            {"at_s": b_at(27), "state": "unsigned on its blank signature line before two dark chairs"}]},
        "reveals": [
            {"t": b_at(7), "type": "build-on", "what": "a stack of summer draft pages grows under the lamp", "hold_s": 0.8},
            {"t": b_at(13), "type": "morph-to-chart", "what": "the mint ticked tags collapse into a bar that climbs past a baseline", "hold_s": 0.8},
            {"t": b_at(20), "type": "scale-pullback", "what": "from the press to a whole ring of chairs around it", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.5}, {"line": 0, "offset": 3.0, "level": 1.4}, {"line": 2, "offset": 0.0, "level": 0.35},
            {"line": 4, "offset": 0.0, "level": 1.4}, {"line": 6, "offset": 0.0, "level": 0.55}, {"line": 8, "offset": 0.0, "level": 1.3},
            {"line": 10, "offset": 0.0, "level": 0.5}, {"line": 12, "offset": 0.0, "level": 1.4},
            {"at_s": round(b_at(38) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(38) + 0.8, 3), "level": 0.6},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(38) - 0.3, 3), "riser_at": round(b_at(23), 3), "silence_at": round(b_at(38) - 0.3, 3),
                      "payoff_at": b_at(38), "button_pattern": "callback", "interrupt_at": b_at(16), "extra_dips": [b_at(20)]},
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
    book.raise_if_missing("board_1105 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1105Ids.ts").write_text(
        "// GENERATED by scripts/board_1105.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
