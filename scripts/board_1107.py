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
 (1, 0, 0.0, "clunk", "Grid, a glass gauge on boots", "slams a palm on a dock sign while the height chart beside it stands blank", "worried", "DATA CENTERS IN PETERSBURG TODAY · 0", "the sign rocks", ""),
 (2, 0, W("Assembly"), "tap", "six Assembly figures", "squint at a tarped crate that sits on the rainy dock", "reading", "PETERSBURG ASSEMBLY · WRITING RULES", "the figures lean in", ""),
 (3, 0, W("anyway"), "pop", "the tarped crate", "flinches and a pair of eyes blinks under the tarp", "nervous", "WHAT WOULD IT RUN?", "the tarp breathes", "plant: what would the crate run"),
 (4, 1, 0.0, "creak", "a Raven", "lands on the rust-brown cannery roof beside a rain-streaked sign", "wry", "OLD OCEAN BEAUTY CANNERY", "the Raven shakes off rain", ""),
 (5, 1, W("transformer"), "clank", "a transformer", "drops beside the cannery wall and a key tag swings from it", "reading", "2 MW TRANSFORMER · PRIVATELY OWNED", "the tag swings", ""),
 (6, 1, W("Greensparc"), "slide", "a crate stenciled GREENSPARC", "rolls onto a fishing boat that pulls away", "wry", "GREENSPARC DEAL · NOT FINALIZED", "the boat bobs", ""),
 (7, 1, W("pursuing"), "thud", "a small tarped crate", "is set down on the dock by a gloved hand", "reading", "STILL PURSUING A SMALL PROJECT", "the crate settles", ""),
 (8, 2, 0.0, "tick", "a brass kWh meter", "on the cannery wall rolls its digits up and stops", "reading", "CANNERY IN 2015 · 1,064,400 kWh", "the needle settles", ""),
 (9, 2, W("utility's"), "clip", "a chip", "slaps onto the meter reading PER THE UTILITY'S FAQ", "reading", "PER THE UTILITY'S FAQ", "the chip rocks", ""),
 (10, 3, 0.0, "whoosh", "the height chart", "grows a ladder and the pencil climbs past the cannery tick", "hopeful", "2 MW · 17,000,000 kWh A YEAR", "the pencil climbs", ""),
 (11, 3, W("sixteen"), "boom", "sixteen cannery silhouettes", "stack up the fjord wall like a wobbling tower while a Raven rides the top", "shock", "ABOUT 16X THE CANNERY · FULL 2 MW BUILD", "the tower sways", "rehook: sixteen canneries stack up the fjord wall"),
 (12, 4, 0.0, "creak", "a Gate with three padlocks", "stands in the council chamber while three figures lift and three press down", "tense", "SEPT 21 · 3 TO 3", "the gate bobs level", ""),
 (13, 4, W("failed"), "stamp", "a crimson stamp", "lands on a one year padlock plate", "stern", "1 YEAR PAUSE · FAILED", "the stamp rings", ""),
 (14, 4, W("Vice"), "tap", "a Lectern name card", "slides forward carrying a quote while a SeaOtter shrugs below", "wry", "\"A SOLUTION IN SEARCH OF A PROBLEM\" · JEIGH STANTON GREGOR", "the card settles", ""),
 (15, 5, 0.0, "swell", "all six figures", "lift the Gate together and its three padlocks hang crimson and shut", "hopeful", "OCT 5 · UNANIMOUS · 9 MONTHS", "the gate rises", "plant: which of the three locks stays shut"),
 (16, 5, W("November"), "page", "a Calendar", "shows three boxes and the first holds a question mark", "reading", "NOV 2 · FIRST OF THREE READINGS", "the box pulses", ""),
 (17, 5, W("outcome"), "rustle", "a small tag", "drops and hangs from the calendar", "calm", "NO OUTCOME REPORTED", "the tag swings", ""),
 (18, 6, 0.0, "clank", "three padlocks", "bolt onto the chart post labelled GRID CAPACITY, GENERATORS, UNCONTAINED COOLING", "reading", "GRID CAPACITY · GENERATORS · UNCONTAINED COOLING", "the plates settle", ""),
 (19, 6, W("generators"), "swing", "a GenStack in a hard hat", "wobbles beside the generators padlock", "reading", "GENERATORS", "the hat tips", ""),
 (20, 6, W("cooling"), "hiss", "a steaming hose", "waves beside the cooling padlock", "reading", "UNCONTAINED COOLING", "the steam puffs", ""),
 (21, 7, 0.0, "whoosh", "the utility worker", "takes the Lectern beside an easel while the palette flips to bright", "firm", "THE UTILITY'S CASE", "the easel rocks", "rehook: palette flip to the utility's case"),
 (22, 7, W("twelve"), "ping", "two price tags", "morph into bars, a short one for Petersburg beside a tall one", "reading", "RESIDENTIAL · 12.2 CENTS · ALASKA NEAR 30 (UTILITY FIGURE)", "the bars rise", ""),
 (23, 7, W("dollars"), "clink", "CashBlocks", "march onto the right pan of a scale", "proud", "OVER $2M A YEAR · UTILITY ESTIMATE", "the pan tips", ""),
 (24, 7, W("smaller"), "tick", "a rate arrow", "shrinks while a resident exhales", "warm", "UTILITY · SMALLER RATE INCREASES", "the arrow shrinks", ""),
 (25, 8, 0.0, "clunk", "a GenStack in a hard hat", "is turned away at the door and goes cold under the hat", "reading", "NO DIESEL GENERATORS ON SITE · BATTERIES", "the stack cools", ""),
 (26, 8, W("closed"), "hiss", "a car radiator", "bolted to the crate puffs steam while a SeaOtter floats by", "wry", "CLOSED LOOP COOLING", "the radiator puffs", ""),
 (27, 8, W("two"), "chime", "two padlocks", "swing open green on the chart post", "proud", "2 OF 3 ANSWERED", "the shackles swing", ""),
 (28, 8, W("settle"), "thud", "Grid", "wobbles beside the dark third padlock and a pending mark spins", "worried", "GRID CAPACITY · NOT SETTLED", "the lock stays shut", ""),
 (29, 9, 0.0, "rustle", "Grid", "yanks the tarp and finds a second tarp underneath", "puzzled", "WHAT IT RUNS · NOT IN THE RECORD", "the tarp falls", "rehook: Grid yanks the tarp and finds a second tarp"),
 (30, 9, W("website"), "pin", "a claim chip", "pins to a vendor brochure and slides off the crate", "wry", "VENDOR PITCH · HIGH-DENSITY AI COMPUTE", "the chip slides", ""),
 (31, 10, 0.0, "whoosh", "the six figures", "turn their backs on the crate all at once to face the height chart", "focused", "HOW BIG A CUSTOMER?", "the figures turn", ""),
 (32, 10, W("deciding", 2), "swell", "Grid", "straightens up and the sixteen tick glows on the chart", "steady", "HOW BIG · NOT WHAT", "the fluid settles", ""),
 (33, 10, W("fourth"), "tick", "an empty fourth bracket", "sketches a dotted lock labelled WHAT IT RUNS?", "curious", "WHAT IT RUNS?", "the dotted lock draws", ""),
 (34, 10, W("draws"), "tap", "the pencil", "hovers over the chart with no line drawn while the crate peeks up", "curious", "WHAT IT DRAWS?", "the pencil trembles", ""),
 (35, 2, 0.5, "hiss", "the cannery vent", "puffs steam as the meter digits blur", "reading", "CANNERY · 2015", "the steam rises", ""),
 (36, 3, W("megawatts"), "tick", "the pencil", "stops at the top of the ladder with the full build tick", "hopeful", "FULL 2 MW BUILD", "the pencil trembles", ""),
 (37, 4, W("problem"), "tap", "a SeaOtter", "peers under the dock and finds nothing", "wry", "A PROBLEM?", "the otter shrugs", ""),
 (38, 7, W("residential"), "tick", "a price tag", "drops onto the easel under the worker's hand", "reading", "PETERSBURG UTILITY · PER ITS FAQ", "the tag swings", ""),
 (39, 7, W("average"), "pop", "an Alaska outline", "fills with tags while the short bar stands beside it", "reading", "NEAR 30 CENTS (UTILITY FIGURE)", "the tags flutter", ""),
 (40, 9, W("nothing"), "rustle", "a Raven", "peers at the brochure and the crate", "wry", "NOTHING IN THE RECORD", "the Raven tilts", ""),
]
# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "eye", "rainy-dock", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "", "Zero", "Grid slams a sign that reads zero beside a tarped crate."),
 (2, 1, "wide-establish", "wide", "high", "cannery-waterfront", "top-down-map", "map-territory", "horizontal-traverse", "landscape-as-subject", "whip-pan", "carry", "The cannery", "A Raven, a transformer, a crate that rolls away and a small one that stays."),
 (3, 2, "macro-closeup", "close", "eye", "meter-wall", "macro-closeup", "single-object-void", "scroll-data", "data-as-subject", "match-cut", "match", "The meter", "A brass meter rolls to the cannery's 2015 use."),
 (4, 3, "alt-vantage", "extreme-wide", "low", "fjord-wall", "cross-section-cutaway", "stacked-layers", "vertical-descent", "multiplicity-swarm", "pull-out", "travel", "Sixteen", "A ladder grows up the chart and sixteen canneries stack up the fjord wall."),
 (5, 4, "two-up", "medium", "eye", "council-chamber", "exploded-diagram", "fullbleed-split", "radial-emanate", "structure-as-subject", "hard-cut", "carry", "Three to three", "A three-padlock gate bobs level while a crimson stamp lands."),
 (6, 5, "data-panel", "medium", "overhead", "reading-calendar", "instrument-screen", "grid-modular", "assemble-build", "structure-as-subject", "crossfade", "travel", "Unanimous", "All six lift the gate and a calendar shows reading one of three."),
 (7, 6, "map-territory", "insert", "high", "chart-post", "exploded-diagram", "stacked-layers", "assemble-build", "instrument-as-subject", "carried-element", "match", "Three tests", "Three padlocks bolt onto the chart post."),
 (8, 7, "wide-establish", "wide", "eye", "utility-stand", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "multiplicity-swarm", "whip-pan", "carry", "The utility's case", "A bright stand with bars, cash blocks and a shrinking arrow."),
 (9, 8, "alt-vantage", "close", "low", "dock-door", "cross-section-cutaway", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "match-cut", "match", "Two answered", "Two padlocks swing green and the third stays dark."),
 (10, 9, "subject-portrait", "medium", "eye", "crate-corner", "macro-closeup", "centered-hero-lowerthird", "radial-emanate", "single-organic-hero", "hard-cut", "carry", "Under the tarp", "Grid yanks the tarp and finds a second tarp."),
 (11, 10, "wide-establish", "extreme-wide", "high", "dock-chart", "eye-level-immersive", "map-territory", "push-in-only", "landscape-as-subject", "pull-out", "match", "How big", "The crowd turns to the chart and the pencil hovers."),
]
AMBIENT = {1: "rain streaks, the tarp breathes, Grid's fluid sloshes", 2: "rain, the Raven shakes, the boat bobs", 3: "the needle settles, steam from the cannery vent",
           4: "the tower sways, the Raven rides it, the fluid sloshes", 5: "the gate bobs, the crimson stamp rings", 6: "the calendar box pulses, the gate hangs",
           7: "the plates settle, the hose steams", 8: "the easel rocks, the bars rise, cash blocks clink", 9: "the radiator puffs, the pending mark spins",
           10: "the tarp breathes, the brochure flutters", 11: "the pencil trembles, the crate peeks up, the rain eases"}
CENTER = {k: "the hero at x540 y1000" for k in range(1, 12)}
HERO = {
 1: ("Grid + tarped crate + height chart + sign", "35% Grid, 30% crate, 20% chart, 15% sign"),
 2: ("cannery + transformer + Raven + fishing boat + crate", "30% cannery, 25% transformer, 25% crate, 20% boat"),
 3: ("brass meter + cannery wall + chip", "60% meter, 25% wall, 15% chip"),
 4: ("height chart + ladder + sixteen cannery silhouettes + pencil", "30% chart, 40% canneries, 30% ladder"),
 5: ("Gate + three padlocks + six figures + stamp", "35% gate, 30% figures, 20% locks, 15% stamp"),
 6: ("six figures + Gate + Calendar + tag", "35% figures, 30% gate, 20% calendar, 15% tag"),
 7: ("three padlocks + chart post + GenStack + hose", "40% padlocks, 20% post, 20% GenStack, 20% hose"),
 8: ("utility worker + Lectern + bars + CashBlocks + scale", "25% worker, 30% bars, 25% cash, 20% scale"),
 9: ("GenStack + radiator + two green padlocks + dark padlock + Grid", "25% GenStack, 20% radiator, 30% padlocks, 25% Grid"),
 10: ("Grid + tarps + claim chip + brochure", "35% Grid, 30% tarps, 20% chip, 15% brochure"),
 11: ("six figures + height chart + pencil + fourth bracket + crate", "25% figures, 30% chart, 20% bracket, 25% crate"),
}
PARTS = {1: 44, 2: 52, 3: 34, 4: 60, 5: 56, 6: 46, 7: 40, 8: 52, 9: 50, 10: 40, 11: 48}
KICKS = (11, 31)
CAMERA = {1: "craneDown+dollyThrough", 2: "truckAcross", 3: "dollyThrough", 4: "craneDown", 5: "dollyThrough", 6: "craneDown+dollyThrough", 7: "truckAcross", 8: "dollyThrough", 9: "truckAcross", 10: "dollyThrough", 11: "craneDown+dollyThrough"}
PALETTE = "silver overcast fjord and spruce green with an ice-white glass gauge hero, golden fluid, a slate-violet tarp over the unknown load, a brown-rust cannery and one signal-crimson for shut locks"


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
        "hook": {"pattern": "anomaly-question", "frame1": "Grid slams a palm on a dock sign reading DATA CENTERS IN PETERSBURG TODAY 0 beside a tarped crate with eyes and a blank height chart.",
                 "headline": "WHAT'S IN THE BOX", "motion_by_s": 0.3,
                 "loopback": "The pencil hovers over the chart as a tarped crate peeks up, rhyming with the opening dock frame."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(31), "what": "What would the crate run? Planted when the tarp flinches, paid when the crowd turns from the crate to the chart and the film says the question is how big."},
        "open_loop_2": {"plant_t": b_at(15), "pay_t": b_at(28), "what": "Which of the three locks stays shut? Planted when the gate rises with three crimson padlocks, paid when grid capacity stays dark."},
        "throughline": {"object": "a wooden height chart", "lands_in_button": "the pencil hovers over the chart with no line drawn",
                        "states": [
                            {"at_s": b_at(1), "state": "blank chart beside the dock sign"},
                            {"at_s": b_at(10), "state": "extended by a ladder with a cannery tick and a sixteen tick off the top"},
                            {"at_s": b_at(18), "state": "bolted to the gate post with three brass plates GRID, GENERATORS, COOLING"},
                            {"at_s": b_at(27), "state": "GENERATORS and COOLING lit green, GRID plate dark"},
                            {"at_s": b_at(34), "state": "pencil hovering at the top, no line drawn"}]},
        "reveals": [
            {"t": b_at(11), "type": "scale-pullback", "what": "from one cannery tick to sixteen canneries stacked up the fjord wall", "hold_s": 0.8},
            {"t": b_at(22), "type": "morph-to-chart", "what": "two price tags morphing into a 12.2 bar beside a near 30 bar", "hold_s": 0.8},
            {"t": b_at(32), "type": "scale-pullback", "what": "from Grid's face to the whole town at dusk with the dark third lock", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.4}, {"line": 1, "offset": 0.0, "level": 0.4}, {"line": 2, "offset": 0.0, "level": 0.35},
            {"line": 3, "offset": 0.0, "level": 1.6}, {"line": 4, "offset": 0.0, "level": 0.4}, {"line": 5, "offset": 0.0, "level": 0.4},
            {"line": 6, "offset": 0.0, "level": 0.35}, {"line": 7, "offset": 0.0, "level": 0.45}, {"line": 8, "offset": 0.0, "level": 0.5},
            {"at_s": round(b_at(31) - 0.3, 3), "level": 0.12}, {"at_s": round(b_at(31) + 0.8, 3), "level": 1.9},
            {"line": 10, "offset": 0.0, "level": 0.6}, {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "rain",
            "build_steps": 4, "dip_at": round(b_at(31) - 0.3, 3), "riser_at": round(b_at(30), 3), "silence_at": round(b_at(31) - 0.3, 3),
            "payoff_at": b_at(31), "button_pattern": "callback", "interrupt_at": b_at(21), "extra_dips": [b_at(12)]},
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
