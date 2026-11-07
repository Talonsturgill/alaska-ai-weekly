#!/usr/bin/env python3
"""2026-11-07 "What's In The Box": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1107.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1107.py conform   # re-time every beat to vo_lines.json and words.json
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board_anchor import AnchorBook  # noqa: E402
import board_1102 as base  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"
LINES = base.LINES
W = lambda w, n=1: (w, n)
G, T = "Grid", "the tarped crate"
# key, line, anchor, sfx, subject, action, emotion, annotation, reaction, rehook
B = [
 (1, 0, 0.0, "clunk", "Grid, a glass gauge on boots", "looks up at the blank height chart whose shadow falls across the zero on the dock sign while the tarp beside it twitches", "worried", "DATA CENTERS IN PETERSBURG TODAY · 0", "the shadow creeps", ""),
 (2, 0, W("Assembly"), "thump", "six Assembly figures", "file onto the dock and squint at the tarped crate", "reading", "PETERSBURG ASSEMBLY · WRITING RULES", "the figures lean in", ""),
 (3, 0, W("anyway"), "flip", "the tarped crate", "flinches and a pair of eyes blinks under the tarp", "nervous", "WHAT WOULD IT RUN?", "the tarp breathes", "plant: what would the crate run"),
 (4, 1, 0.0, "hum", "a transformer", "drops beside the cannery wall and a key tag swings from it", "reading", "2 MW TRANSFORMER · PRIVATELY OWNED", "the tag swings", ""),
 (5, 1, W("owns"), "clink", "a name tag", "slaps onto the transformer reading MAZZELLA ALASKA", "reading", "MAZZELLA ALASKA · PRIVATE COMPANY", "the tag settles", ""),
 (6, 1, W("cannery"), "caw", "a Raven", "lands on the rust-brown cannery roof beside the rain-streaked OCEAN BEAUTY sign", "wry", "OLD OCEAN BEAUTY CANNERY", "the Raven shakes off rain", ""),
 (7, 1, W("vendor"), "slide", "a crate stenciled GREENSPARC", "rolls onto a fishing boat that pulls away", "wry", "GREENSPARC DEAL · NOT FINALIZED", "the boat bobs", ""),
 (8, 1, W("pursuing"), "thud", "a small tarped crate", "is set down on the dock by a gloved hand", "reading", "STILL PURSUING A SMALL PROJECT", "the crate settles", ""),
 (9, 2, 0.0, "tick", "a brass kWh meter", "in a dim meter room starts rolling its digits up", "reading", "CANNERY · 2015", "the needle settles", ""),
 (10, 3, 0.0, "roll", "Grid", "climbs the ladder on the height chart with the pencil and ticks the cannery mark", "hopeful", "CANNERY · 1,064,400 kWh", "Grid climbs", "rehook: a new world, Grid climbs the ladder up the fjord wall"),
 (11, 3, W("seventeen"), "creak", "a cable", "runs from the tarped crate into Grid's base and Grid's fluid starts to drop toward the dashed band", "uneasy", "FULL 2 MW BUILD · 17,000,000 kWh · PER THE UTILITY'S FAQ", "the fluid drops", ""),
 (12, 3, W("sixteen"), "boom", "sixteen cannery silhouettes", "stack up the fjord wall behind Grid while the pencil runs past the top of the chart", "shock", "ABOUT 16X THE CANNERY · FULL 2 MW BUILD", "the tower sways", "rehook: sixteen canneries stack up behind Grid on the ladder"),
 (13, 4, 0.0, "clack", "an empty padlock bracket", "on the chart post jams half-shut in the council chamber while three figures push and three hold", "tense", "SEPT 21 · 3 TO 3", "the locks jam", ""),
 (14, 4, W("failed"), "stamp", "a crimson stamp", "lands on a one year plate", "stern", "1 YEAR PAUSE · FAILED", "the stamp rings", ""),
 (15, 4, W("solution"), "slide", "a Lectern name card", "slides forward carrying a quote", "reading", "\"A SOLUTION IN SEARCH OF A PROBLEM\" · JEIGH STANTON GREGOR", "the card settles", ""),
 (16, 5, 0.0, "page", "a paper sheet", "is pinned to a rain-streaked noticeboard stamped DRAFT with three dotted lock outlines", "hopeful", "OCT 5 · UNANIMOUS · DRAFT A 9-MONTH PAUSE", "the sheet flutters", "rehook: a new world, a rain-streaked noticeboard with a DRAFT sheet"),
 (17, 5, W("November"), "ping", "a Calendar card", "is pinned beside it with three boxes and the first holds a question mark", "reading", "NOV 2 · FIRST OF THREE READINGS", "the box pulses", ""),
 (18, 5, W("outcome"), "fold", "a small tag", "drops and hangs from the calendar", "calm", "NO OUTCOME REPORTED", "the tag swings", ""),
 (44, 6, 0.0, "page", "the draft sheet", "slides in with three dotted lock outlines that fill in solid", "reading", "THE DRAFT'S THREE TESTS", "the outlines fill", ""),
 (19, 6, W("Grid"), "clank", "a first padlock", "bolts onto the chart post labelled GRID CAPACITY", "reading", "GRID CAPACITY", "the plate settles", ""),
 (20, 6, W("generators"), "clank", "a second padlock", "bolts on labelled GENERATORS while a GenStack in a hard hat wobbles beside it", "reading", "GENERATORS", "the hat tips", ""),
 (21, 6, W("cooling"), "whirr", "a third padlock", "bolts on labelled UNCONTAINED COOLING beside a steaming hose", "reading", "UNCONTAINED COOLING", "the steam puffs", ""),
 (22, 7, 0.0, "clunk", "the utility worker", "throws a breaker on the transformer and the line to the rooftops lights", "firm", "THE UTILITY'S FAQ · FROM APRIL", "the breaker clacks", "rehook: side-on cross-section of the power line to the rooftops"),
 (23, 7, W("residential"), "tick", "two price tags", "hang from the line over the roofs, a short bar under the first", "reading", "RESIDENTIAL · 12.2 CENTS · PER THE UTILITY'S FAQ", "the tags swing", ""),
 (24, 7, W("average"), "slide", "a tall bar", "rises under the second tag", "reading", "ALASKA AVERAGE · NEAR 30 CENTS (UTILITY FIGURE)", "the bar rises", ""),
 (25, 7, W("dollars"), "clink", "cash blocks", "ride the line from the cannery back to the roofs", "reading", "OVER $2M A YEAR · UTILITY ESTIMATE · ORIGINAL PLAN", "the blocks glide", ""),
 (26, 7, W("smaller"), "slide", "rate arrows", "on the rooftops shrink one by one", "reading", "SMALLER RATE INCREASES · UTILITY CLAIM", "the arrows shrink", ""),
 (45, 8, 0.0, "thump", "a GenStack in a hard hat", "walks up to the cannery door", "reading", "THE ORIGINAL PLAN · PER FAQ", "the stack walks", ""),
 (27, 8, W("diesel"), "clunk", "a GenStack in a hard hat", "is turned away at the cannery door", "reading", "NO DIESEL GENERATORS ON SITE · PER FAQ · TOWN GRID HAS BACKUP", "the stack cools", ""),
 (28, 8, W("closed"), "whirr", "a car radiator", "bolted to the crate puffs steam", "wry", "CLOSED LOOP COOLING · PER FAQ", "the radiator puffs", ""),
 (29, 8, W("answered"), "clink", "two padlocks", "light up with a green ring on the chart post with their shackles still shut", "proud", "2 OF 3 · GREENSPARC PLAN · NOT FINALIZED", "the plates glow", ""),
 (30, 8, W("settle"), "creak", "Grid's own top band", "stays dashed and a pending mark spins on Grid as the pencil can't mark it", "worried", "GRID CAPACITY · NOT SETTLED", "the band wavers", ""),
 (31, 9, 0.0, "flip", "Grid", "yanks the tarp and finds a second tarp underneath", "puzzled", "WHAT IT RUNS · NOT IN THE RECORD", "the tarp falls", "rehook: Grid yanks the tarp and finds a second tarp"),
 (32, 9, W("compute"), "ping", "a claim chip", "pins to a vendor brochure and slides off the crate", "wry", "VENDOR PITCH · HIGH-DENSITY AI COMPUTE", "the chip slides", ""),
 (33, 10, W("grid"), "thump", "the six figures", "turn from the crate toward the height chart as the fallen tarp wipes the frame", "focused", "GRID · GENERATORS · COOLING", "the figures turn", ""),
 (34, 10, W("big"), "swell", "Grid", "straightens up while the rain-dark town stretches out below and the third lock is the only unlit thing", "steady", "HOW BIG A CUSTOMER?", "the fluid settles", ""),
 (35, 10, W("fourth"), "scratch", "an empty fourth bracket", "sketches a dotted lock labelled WHAT IT COMPUTES?", "curious", "WHAT IT COMPUTES?", "the dotted lock draws", ""),
 (36, 10, W("draws"), "scratch", "the pencil", "hovers over the chart with no line drawn while the crate peeks up", "curious", "OR WHAT IT DRAWS?", "the pencil trembles", ""),
 (37, 2, W("used"), "tick", "a ghost blueprint", "of the cannery draws itself over the meter", "reading", "THE WHOLE CANNERY", "the lines draw", ""),
 (43, 2, W("thousand"), "hum", "the meter digits", "settle one by one at the last place", "reading", "1,064,400 kWh · PER THE UTILITY'S FAQ", "the digits settle", ""),
 (39, 3, W("eight"), "tick", "the pencil", "ticks the one megawatt mark on the chart", "hopeful", "1 MW · 8.5 MILLION kWh · PER THE UTILITY'S FAQ", "the tick lands", ""),
 (40, 4, W("pause"), "clack", "a one year plate", "hangs from the jammed bracket", "tense", "1 YEAR PAUSE", "the plate swings", ""),
 (42, 9, W("nothing"), "caw", "a Raven", "pecks the AI COMPUTE line off the brochure and it blows away leaving the second tarp bare", "wry", "NOTHING IN THE RECORD", "the Raven tilts", ""),
 (46, 2, W("hours"), "click", "the meter lamp", "clicks on as the digits stop", "reading", "IN 2015", "the lamp glows", ""),
 (47, 3, W("megawatts"), "roll", "the pencil", "climbs the ladder past the one megawatt mark", "hopeful", "FULL 2 MW BUILD · PER THE UTILITY'S FAQ", "the pencil climbs", ""),
 (48, 5, W("reading"), "ping", "the first calendar box", "fills with a question mark", "reading", "READING 1 OF 3", "the box pulses", ""),
 (51, 10, W("None"), "scratch", "the empty fourth bracket", "is drawn on the chart post as the figures look for a lock that asks what it runs", "curious", "NONE ASKS WHAT IT RUNS", "the bracket draws", ""),
 (52, 5, W("unanimously"), "thump", "all six figures", "nod around the noticeboard while the sheet stays stamped DRAFT", "hopeful", "ALL SIX AGREE · DRAFT ONLY", "the figures nod", ""),
 (53, 10, 0.0, "swell", "the fallen tarp", "wipes the frame as the dock returns and the six figures step back from the crate", "calm", "THE DRAFT · 3 TESTS", "the tarp wipes", ""),
 (54, 8, W("Grid"), "creak", "the dashed band", "wavers beside the pencil", "worried", "GRID CAPACITY", "the band wavers", ""),
]
# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "eye", "rainy-dock", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "", "Zero", "Grid looks up at a blank chart whose shadow crosses the zero on the dock sign while the tarped crate twitches."),
 (2, 1, "wide-establish", "wide", "high", "cannery-waterfront", "top-down-map", "map-territory", "horizontal-traverse", "landscape-as-subject", "hard-cut", "carry", "The cannery", "The tarp's blue carries into the transformer tag. A transformer, a Raven, a crate that rolls away and a small one that stays."),
 (3, 2, "macro-closeup", "close", "eye", "meter-room", "macro-closeup", "single-object-void", "scroll-data", "data-as-subject", "hard-cut", "carry", "The meter", "A brass meter in a dim meter room rolls to the cannery's 2015 use."),
 (4, 3, "alt-vantage", "extreme-wide", "low", "fjord-wall", "cross-section-cutaway", "stacked-layers", "vertical-rise", "single-organic-hero", "carried-element", "carry", "Sixteen", "Grid climbs the ladder while a cable drains its fluid and sixteen canneries stack up behind."),
 (5, 4, "two-up", "medium", "eye", "council-chamber", "exploded-diagram", "fullbleed-split", "radial-emanate", "structure-as-subject", "hard-cut", "build", "Three to three", "One empty bracket jams while three figures push and three hold, then a crimson stamp."),
 (6, 5, "data-panel", "medium", "overhead", "noticeboard", "instrument-screen", "grid-modular", "assemble-build", "data-as-subject", "hard-cut", "travel", "Draft", "A draft sheet and a reading calendar pin onto a rain-streaked noticeboard."),
 (7, 6, "map-territory", "insert", "high", "chart-post", "exploded-diagram", "stacked-layers", "assemble-build", "instrument-as-subject", "carried-element", "match", "Three tests", "Three padlocks bolt onto the chart post."),
 (8, 7, "alt-vantage", "wide", "eye", "power-line", "cross-section-cutaway", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "hard-cut", "carry", "The utility's case", "The breaker's lever carries the three tests' bolts into a switch. The utility worker throws the breaker and the line to the rooftops lights, price tags hang over the roofs, bars rise, cash blocks ride the line and the rate arrows shrink."),
 (9, 8, "subject-portrait", "close", "low", "dock-door", "macro-closeup", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "match-cut", "match", "Two answered", "Two lock plates glow green with shackles shut and Grid's own band stays dashed."),
 (10, 9, "subject-portrait", "medium", "eye", "crate-corner", "eye-level-immersive", "single-object-void", "radial-emanate", "single-organic-hero", "hard-cut", "carry", "Under the tarp", "Grid yanks the tarp and finds a second tarp."),
 (11, 10, "subject-portrait", "medium", "eye", "dock-chart", "eye-level-immersive", "centered-hero-lowerthird", "vertical-rise", "single-organic-hero", "mask-wipe", "carry", "How big", "Back on the dock the figures turn to the chart and the pencil hovers, then the camera rises from Grid to the rain-dark town with one dark lock."),
]
AMBIENT = {1: "rain streaks, the tarp breathes, Grid's fluid sloshes", 2: "rain, the Raven shakes, the boat bobs", 3: "the needle settles, a bulb flickers",
           4: "Grid's fluid sloshes, the tower sways, the cable sags", 5: "the bracket jams, rain on the window, the figures strain", 6: "the sheets flutter, the calendar box pulses",
           7: "the plates settle, the hose steams", 8: "the line hums, the bars rise, the cash blocks glide", 9: "the radiator puffs, the pending mark spins",
           10: "the tarp breathes, the brochure flutters", 11: "the pencil trembles, the crate peeks up, the town lights flicker"}
CENTER = {k: "the hero at x540 y1000" for k in range(1, 12)}
HERO = {
 1: ("Grid + tarped crate + height chart + sign", "35% Grid, 30% crate, 20% chart, 15% sign"),
 2: ("cannery + transformer + Raven + fishing boat + crate", "30% cannery, 25% transformer, 25% crate, 20% boat"),
 3: ("brass meter + dim meter room + lamp", "60% meter, 25% room, 15% chip"),
 4: ("Grid + height chart + ladder + cable + sixteen cannery silhouettes", "30% Grid, 30% chart, 40% canneries"),
 5: ("chart post + one jammed bracket + six figures + stamp", "35% post, 30% figures, 20% bracket, 15% stamp"),
 6: ("noticeboard + draft sheet + calendar + tag", "30% board, 30% sheet, 25% calendar, 15% tag"),
 7: ("three padlocks + chart post + GenStack + hose", "40% padlocks, 20% post, 20% GenStack, 20% hose"),
 8: ("power line + transformer + rooftops + cash blocks + bars + worker", "25% line, 25% roofs, 25% cash, 25% bars"),
 9: ("GenStack + radiator + two green padlocks + Grid band", "25% GenStack, 20% radiator, 30% padlocks, 25% Grid"),
 10: ("Grid + two tarps + claim chip + brochure", "35% Grid, 30% tarps, 20% chip, 15% brochure"),
 11: ("six figures + height chart + pencil + fourth bracket + town", "25% figures, 25% chart, 20% bracket, 30% town"),
}
PARTS = {1: 44, 2: 52, 3: 34, 4: 60, 5: 56, 6: 46, 7: 40, 8: 52, 9: 50, 10: 40, 11: 48}
KICKS = (12, 34)
CAMERA = {1: "craneDown+dollyThrough", 2: "truckAcross", 3: "static:the meter is the subject and the digits are the motion", 4: "riseWith", 5: "static:the jam is the stillness",
          6: "truckAcross", 7: "craneDown", 8: "truckAcross", 9: "dollyThrough", 10: "orbitReveal", 11: "riseWith"}
PALETTE = "silver overcast fjord and spruce green with an ice-white glass gauge hero, golden fluid, a slate-violet tarp over the unknown load, a brown-rust cannery and one signal-crimson stamp"


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
        "run_date": "2026-11-07", "slug": "whats-in-the-box", "title": "What's In The Box",
        "concept": ("Petersburg, Alaska has no data center, yet its Assembly is writing rules for one, and a private owner is still pursuing a small project at the old Ocean Beauty cannery. "
                    "The draft pause tests grid capacity, generators and uncontained cooling, so it measures size, not what the machine runs. By the utility's own FAQ the full 2 MW build would use about sixteen cannery's worth a year, and its plan answered two of the three tests while grid capacity is not settled. "
                    "A glass gauge named Grid stands in for the town's power system, a tarped crate for the unknown load, and a height chart for the question of how big."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "push-in-only", "hero_treatment": "single-organic-hero", "layout": "centered-hero-lowerthird",
                        "register": "editorial-schematic", "palette": PALETTE, "camera_strategy": "push-and-ladder-climb", "light_story": "overcast-soft",
                        "metaphor": "a glass gauge measures a mystery crate against a growth chart on a rainy dock while a town council decides how tall is too tall"},
        "palette": PALETTE,
        "divergence_note": ("The last films were tangerine walls over teal desks (11-06), a midnight indigo cab (11-02), an overcast moss slope (11-01), a sage chart desk (10-31) and an aubergine depot (10-29). "
                            "This one is a rainy silver fjord dock in soft overcast light with an ice-white glass hero, a tarped crate and a wooden height chart. No office, cab, slope, depot or sea cutaway, "
                            "and its signature object is a growth chart that changes state at every act boundary and lands with the pencil hovering and no line drawn."),
        "treatment": {"title": "What's In The Box", "summary": tre["judge_reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "hook": {"pattern": "anomaly-question", "frame1": "Grid looks up at a blank height chart whose shadow crosses the 0 on a dock sign reading DATA CENTERS IN PETERSBURG TODAY 0 while a tarped crate twitches.",
                 "headline": "WHAT'S IN THE BOX", "motion_by_s": 0.3,
                 "loopback": "The pencil hovers over the chart as a tarped crate peeks up, rhyming with the opening dock frame."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(34), "what": "What would the crate run? Planted when the tarp flinches, paid when the crowd turns from the crate to the chart and the film says the question is how big."},
        "open_loop_2": {"plant_t": b_at(16), "pay_t": b_at(30), "what": "Which of the three locks stays shut? Planted when the draft sheet pins up with three dotted lock outlines, paid when the grid capacity lock stays dark."},
        "throughline": {"object": "a wooden height chart", "lands_in_button": "the pencil hovers over the chart with no line drawn",
                        "states": [
                            {"at_s": b_at(1), "state": "blank chart beside the dock sign"},
                            {"at_s": b_at(10), "state": "a ladder grows beside the chart and the cannery tick is drawn"},
                            {"at_s": b_at(12), "state": "extended by a ladder with a cannery tick and a sixteen tick off the top"},
                            {"at_s": b_at(19), "state": "bolted to the chart post with three solid padlocks GRID CAPACITY, GENERATORS, UNCONTAINED COOLING"},
                            {"at_s": b_at(29), "state": "GENERATORS and COOLING padlocks lit green, GRID CAPACITY padlock dark"},
                            {"at_s": b_at(36), "state": "pencil hovering at the top, no line drawn"}]},
        "reveals": [
            {"t": b_at(10), "type": "build-on", "what": "a ladder grows beside the chart tick by tick as Grid climbs", "hold_s": 0.6},
            {"t": b_at(12), "type": "scale-pullback", "what": "from one cannery tick to sixteen canneries stacked up the fjord wall", "hold_s": 0.8},
            {"t": b_at(24), "type": "morph-to-chart", "what": "two price tags morphing into a 12.2 bar beside a near 30 bar", "hold_s": 0.8},
            {"t": b_at(34), "type": "scale-pullback", "what": "from Grid's face to the whole town at dusk with the dark third lock", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 2.0}, {"line": 1, "offset": 0.0, "level": 0.3}, {"line": 2, "offset": 0.0, "level": 0.25},
            {"line": 3, "offset": 0.0, "level": 2.2}, {"line": 4, "offset": 0.0, "level": 0.3}, {"line": 5, "offset": 0.0, "level": 0.3},
            {"line": 6, "offset": 0.0, "level": 0.25}, {"line": 7, "offset": 0.0, "level": 0.35}, {"line": 8, "offset": 0.0, "level": 0.35},
            {"at_s": round(b_at(34) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(34) + 0.8, 3), "level": 2.6},
            {"line": 10, "offset": 0.0, "level": 0.5}, {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "rain",
            "build_steps": 4, "dip_at": round(b_at(34) - 0.3, 3), "riser_at": round(b_at(32), 3), "silence_at": round(b_at(34) - 0.3, 3),
            "payoff_at": b_at(34), "button_pattern": "callback", "interrupt_at": b_at(22), "extra_dips": [b_at(13)]},
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
    book.raise_if_missing("board_1107 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1107Ids.ts").write_text(
        "// GENERATED by scripts/board_1107.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
