#!/usr/bin/env python3
"""2026-11-01 "The Stand-In": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1101.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1101.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "whoosh", "the slope", "drips soaked blue in cross-section as a pebble rolls off the ledge past a mountain goat and falls out of frame", "worried", "SOUTHEAST ALASKA",
  "a layered hillside in cross-section, soaked blue, with a white mountain goat on its ledge and a plate reading SOUTHEAST ALASKA, the camera cranes down",
  "the slope drips", "plant: a plan to draw a slope that keeps up"),
 (2, 1, 0, W("plan"), "pop", "a dashed ghost hill", "draws itself in beside the real slope in one stroke, then its ghost goat drops onto its haunches early", "wry", "A STAND-IN",
  "a dashed ghost outline of the same hill draws itself beside the real slope in one stroke while its ghost goat sits down before the real goat does, a plate reads A STAND-IN", "the ghost wobbles", ""),
 (3, 1, 0, W("keeps"), "tick", "the ghost hill", "lurches and jitters as a pebble lands on the real slope and the dashes break and re-form", "puzzled", "KEEPS UP", "the ghost outline jitters to keep up as the real slope shudders under a drip", "the dashes crawl", ""),
 (4, 1, 2, 0.0, "thunk", "a clipboard", "slaps onto the desk under a stamp reading NSF AWARD RECORD", "reading", "NSF AWARD RECORD · 2608510",
  "a clipboard slaps onto the paper desk beside the slope with a stamp reading NSF AWARD RECORD 2608510", "the stamp settles", ""),
 (5, 1, 2, W("million"), "ping", "a brass counter", "ticks up to $1,772,170 beside a stack of coins that grows", "reading", "$1,772,170 · UAF",
  "a brass counter ticks up to $1,772,170 beside a stack of coins that grows, a plate reads UNIVERSITY OF ALASKA FAIRBANKS", "the coins settle", ""),
 (6, 1, 2, W("years"), "tick", "a six-year bar", "fills a sliver from the left and stays mostly empty", "thoughtful", "AUG 1ST 2026 TO JULY 31ST 2032",
  "a long bar labelled AUG 1ST 2026 TO JULY 31ST 2032 fills a sliver from the left and stays mostly empty, the plate reads PLANNED DATES", "the bar glows", ""),
 (7, 2, 3, 0.0, "page", "an Alaska map", "drops a pulsing pin on Fairbanks beside a name card", "reading", "PI CARL TAPE · UAF",
  "a painted Alaska map drops a pulsing pin on Fairbanks beside a name card reading PI CARL TAPE, UAF", "the pin pulses", ""),
 (8, 2, 3, W("digital"), "pop", "the ghost hill", "sketches itself in again with a dashed label and a faint grid", "curious", "DIGITAL TWIN · A STAND-IN",
  "the dashed ghost hill sketches itself in again with a faint grid, a plate reads DIGITAL TWIN, A STAND-IN FOR A REAL SLOPE", "the grid shimmers", ""),
 (9, 2, 1, 0.0, "hum", "the goat", "turns toward the cartoon ghost standing beside a real mountain and tilts its head with one eyebrow up", "skeptical", "CAN A CARTOON KEEP UP?",
  "the white goat raises one eyebrow at the dashed cartoon ghost standing beside a towering real mountain, a plate reads CAN A CARTOON KEEP UP WITH A REAL MOUNTAIN?", "the goat chews", "plant: can a cartoon keep up"),
 (10, 3, 4, 0.0, "whoosh", "a three-panel strip", "slides across the desk over one slope", "reading", "THE CHAIN · PER THE AWARD ABSTRACT",
  "a three-panel strip slides across the desk, each panel the same slope, a plate reads THE CHAIN, PER THE AWARD ABSTRACT", "the panels settle", ""),
 (11, 3, 4, W("Rain"), "drip", "a rain gauge", "fills as blue seeps into the slope layers", "worried", "1 · RAIN SOAKS THE HILL",
  "a one-inch rain gauge fills as blue seeps into the slope layers in panel one, a plate reads 1 RAIN SOAKS THE HILL", "the layers darken", ""),
 (12, 3, 4, W("quake"), "crack", "a seismic station", "flinches as a crack opens through the soaked layers", "alarmed", "2 · A QUAKE WEAKENS IT",
  "a round seismic station on the crest flinches as a crack opens through the soaked layers in panel two, a plate reads 2 A QUAKE WEAKENS IT", "the crack spreads", ""),
 (13, 3, 4, W("later"), "boom", "a storm cloud", "rolls in and the cracked slope slumps", "alarmed", "3 · A LATER STORM BRINGS IT DOWN",
  "a storm cloud rolls over panel three and the cracked slope slumps, a plate reads 3 A LATER STORM BRINGS IT DOWN", "the slope slumps", "rehook: the slope finally falls"),
 (14, 4, 5, 0.0, "hush", "a plain card", "holds still under a tall rain gauge with no motion but a slow push", "somber", "HAINES · DEC 2020",
  "a plain cream card reading HAINES, DEC 2020 under a tall rain gauge, no gags, a slow push", "the gauge glints", ""),
 (15, 4, 5, W("eight"), "tick", "the rain gauge", "fills past its top mark", "somber", "AT LEAST 8 IN OF RAIN IN 2 DAYS · PER KHNS",
  "the tall rain gauge fills past its top mark, a plate reads AT LEAST 8 IN OF RAIN IN 2 DAYS, PER KHNS", "the water settles", ""),
 (16, 4, 5, W("killed"), "hush", "a card", "slides in beside the gauge reading two killed that week", "somber", "TWO KILLED THAT WEEK",
  "a plain card slides in beside the gauge reading TWO KILLED THAT WEEK", "the card settles", ""),
 (17, 4, 6, 0.0, "hush", "a plain card", "holds still reading Wrangell with no motion", "somber", "WRANGELL · NOV 20TH 2023 · SIX KILLED",
  "a plain cream card reading WRANGELL, NOV 20TH 2023, SIX KILLED, no gags, a slow push", "the card holds", ""),
 (18, 5, 7, 0.0, "whoosh", "four feed lines", "pour in colour-coded from four instruments toward the ghost hill", "curious", "SHAKING · SATELLITE · WEATHER · GROUNDWATER",
  "four colour-coded feed lines from a seismic station, a satellite eye, a wind vane and a groundwater probe pour toward the ghost hill, a plate reads SHAKING, SATELLITE, WEATHER, GROUNDWATER", "the feeds pulse", "plant: which slope"),
 (19, 5, 7, W("separate"), "thunk", "four clocks", "tick on separate dials that do not touch", "wry", "SEPARATE SYSTEMS · RARELY WORK TOGETHER",
  "four separate clock dials tick one beside each feed and never touch, a plate reads SEPARATE SYSTEMS, RARELY WORK TOGETHER, PER THE ABSTRACT", "the dials tick", ""),
 (20, 5, 8, 0.0, "clank", "a crank machine", "grinds slowly labelled REAL PHYSICS while the ghost speed-draws ten sketches", "smug", "SURROGATE MODEL · FAST STAND-IN FOR SLOW PHYSICS",
  "a heavy crank machine labelled REAL PHYSICS grinds out one answer while the dashed ghost speed-draws ten quick sketches and sticks out its tongue, a plate reads SURROGATE MODEL, FAST STAND-IN FOR SLOW PHYSICS", "the crank grinds", ""),
 (21, 5, 8, W("tugged"), "pop", "pulses", "tug the dashed corners of the ghost until it snaps closer to the real slope", "determined", "EACH NEW READING TUGS IT CLOSER",
  "pulses from the four feeds tug the dashed corners of the ghost and it snaps visibly closer to the real slope each time, a plate reads EACH NEW READING TUGS IT CLOSER", "the ghost snaps", "rehook: the ghost snaps onto the slope"),
 (22, 6, 9, 0.0, "thunk", "three stamps", "line up on a bench in front of the ghost", "stern", "THE FAIR CASE AGAINST IT",
  "three rubber stamps line up on a bench in front of the dashed ghost, a plate reads THE FAIR CASE AGAINST IT", "the bench creaks", "rehook: the film turns on itself"),
 (23, 6, 9, W("built"), "stamp", "a stamp", "slams NOT BUILT across the ghost and the clipboard record glows", "stern", "NOT BUILT · ONE PUBLIC SOURCE",
  "a stamp slams NOT BUILT across the ghost while the clipboard shows NSF AWARD RECORD as the only public source", "the stamp rings", ""),
 (24, 6, 10, 0.0, "slide", "two partner cards", "slide onto the bench, the bigger one for the University of Washington", "wry", "UW $2,209,093 · EARTHSCOPE $449,448",
  "two partner cards slide onto the bench, UNIVERSITY OF WASHINGTON $2,209,093 larger than EARTHSCOPE $449,448, a plate reads PARTNER AWARDS", "the cards settle", ""),
 (25, 6, 10, W("testing"), "tick", "two test sites", "drop onto a map and land as dotted outlines labelled Alaska and Pacific Northwest", "thoughtful", "TESTS PLANNED · NO RESULTS YET",
  "two dotted outlines of test sites labelled ALASKA and PACIFIC NORTHWEST draw in, a plate reads TESTS PLANNED, NO RESULTS YET", "the dots crawl", ""),
 (26, 6, 11, 0.0, "ping", "the ghost hill", "snaps to crisp lines around the instruments while fog rolls in and breaks the far side into smears", "thoughtful", "SHARP WHERE INSTRUMENTS ARE",
  "the ghost hill is razor sharp around three lit instruments and smears to fog on the far side of the slope, a plate reads SHARP WHERE INSTRUMENTS ARE", "the fog drifts", ""),
 (27, 6, 11, W("nowhere"), "boom", "the goat", "steps onto the fog and the ghost breaks apart under its hooves, leaving the bare slope", "wry", "KEEPS UP WHERE THERE ARE SENSORS · NOWHERE ELSE",
  "the goat steps onto the foggy bare slope where the ghost is gone, a plate reads KEEPS UP WHERE THERE ARE SENSORS, NOWHERE ELSE", "the goat looks back", "rehook: the ghost vanishes under the goat"),
 (28, 7, 12, 0.0, "whoosh", "a dark slope", "rises over a fjord with no instruments on it", "worried", "BARRY ARM · ROUGHLY 500M M3 · DGGS",
  "a dark slope rises over a fjord with no instruments on it, a plate reads BARRY ARM, ROUGHLY 500M M3, STATE GEOLOGISTS TRACK IT", "the slope looms", ""),
 (29, 7, 12, W("tsunami"), "swell", "the fjord", "heaves and a ripple ring spreads with no wave height shown", "alarmed", "IF IT FAILED FAST · LIFE-THREATENING WAVES",
  "the fjord water heaves and a ripple ring spreads, a plate reads IF IT FAILED FAST, LIFE-THREATENING WAVES, no wave height anywhere", "the ripple spreads", ""),
 (30, 8, 13, 0.0, "thunk", "the ghost hill", "settles dashed on the desk with a tag reading SLOPE blank", "curious", "SLOPE ___",
  "the dashed ghost hill settles on the desk with a hanging tag reading SLOPE and a blank line", "the tag swings", ""),
 (31, 8, 13, W("Nobody's"), "hush", "the goat", "leans on the blank tag and looks to camera", "wry", "NOBODY'S SAID",
  "the goat leans on the blank tag and looks to camera, a plate reads NOBODY'S SAID", "the goat chews", ""),
 (32, 8, 13, W("yours"), "ping", "the goat", "steps from the bare slope onto the lit one and the ghost hill keeps its dashed edge", "hopeful", "WHAT WOULD YOU PUT ON YOURS?",
  "the goat steps from the bare slope onto the lit instrumented one while the ghost hill keeps its dashed edge, a plate reads WHAT WOULD YOU PUT ON YOURS?", "the lamp glows", ""),
]

S = [
 (1, 0, "wide-establish", "wide", "high", "desk-slope", "eye-level-immersive", "centered-hero-lowerthird", "vertical-descent", "single-organic-hero", "", "",
  "The slope", "A soaked layered hillside with a goat, a dashed ghost hill drawing itself beside it and the goat raising an eyebrow at the cartoon."),
 (2, 2, "map-territory", "medium", "eye", "alaska-map-desk", "top-down-map", "map-territory", "push-in-only", "landscape-as-subject", "whip-pan", "travel",
  "Fairbanks", "An NSF award clipboard, a coin counter, a six-year bar, a painted Alaska map pinning Fairbanks and the ghost hill sketching a grid."),
 (3, 4, "data-panel", "insert", "ground", "three-panel-strip", "macro-closeup", "grid-modular", "horizontal-traverse", "data-as-subject", "match-cut", "match",
  "The chain", "Three panels of one slope, rain fills a gauge, a quake cracks the layers, a later storm slumps the slope."),
 (4, 5, "subject-portrait", "close", "low", "plain-card-gauge", "eye-level-immersive", "single-object-void", "push-in-only", "single-organic-hero", "hard-cut", "match",
  "Haines and Wrangell", "A tall rain gauge fills beside two plain cards for Haines and Wrangell, a slow push with no gags."),
 (5, 7, "alt-vantage", "wide", "high", "feed-lines-desk", "top-down-map", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "carried-element", "carry",
  "The loop", "Four coloured feeds pour toward the ghost, four clocks tick apart, a crank grinds as the ghost speed-draws and each reading tugs it closer."),
 (6, 9, "two-up", "medium", "eye", "test-bench", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "hard-cut", "match",
  "The empty bench", "Three stamps on a bench, NOT BUILT, partner cards, dotted test sites, then a ghost sharp near instruments and fog beyond."),
 (7, 12, "push-detail", "extreme-wide", "high", "barry-arm-fjord", "eye-level-immersive", "map-territory", "vertical-descent", "landscape-as-subject", "match-cut", "travel",
  "Barry Arm", "A dark slope over a fjord with no instruments and a ripple ring, no wave height."),
 (8, 13, "wide-establish", "wide", "low", "desk-slope-2", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "match-cut", "match",
  "The blank tag", "The ghost hill with a blank SLOPE tag, the goat leaning on it and stepping onto the lit slope."),
]

AMBIENT = {1: "the slope drips, dust motes drift, the ghost dashes crawl", 2: "the pin pulses, the grid shimmers, paper edges lift", 3: "the panels settle, rain streaks fall, the crack spreads",
           4: "the gauge glints, a slow push, quiet air", 5: "the feeds pulse, the dials tick, the crank grinds", 6: "the bench creaks, the dots crawl, fog drifts",
           7: "the slope looms, the water heaves, mist rises", 8: "the tag swings, the lamp glows, the goat chews"}
CENTER = {1: "the slope at x540 y1000", 2: "the Alaska map at x540 y1020", 3: "the middle panel at x540 y1000", 4: "the gauge at x420 y1040", 5: "the ghost hill at x540 y1060", 6: "the bench at x540 y1050", 7: "the dark slope at x540 y1020", 8: "the blank tag at x540 y1080"}
HERO = {
 1: ("LayeredLand slope + goat + dashed ghost + clipboard + coin counter", "35% slope, 25% ghost, 20% clipboard and counter, 20% goat"),
 2: ("Alaska map + ghost hill + goat", "35% map, 30% ghost, 20% goat, 15% pin"),
 3: ("three slope panels + rain gauge + seismic station + storm", "40% panels, 25% gauge, 20% station, 15% storm"),
 4: ("tall rain gauge + two plain cards", "50% gauge, 30% cards, 20% desk"),
 5: ("ghost hill + four feeds + four clocks + crank machine", "30% ghost, 30% feeds, 20% crank, 20% clocks"),
 6: ("bench + three stamps + partner cards + test sites + ghost", "30% stamps, 25% ghost, 25% cards, 20% sites"),
 7: ("dark slope + fjord water + plates", "50% slope, 35% fjord, 15% plates"),
 8: ("ghost hill + blank tag + goat + lit slope", "30% ghost, 25% tag, 25% goat, 20% lit slope"),
}
PARTS = {1: 48, 2: 40, 3: 52, 4: 30, 5: 56, 6: 50, 7: 34, 8: 40}
KICKS = (13, 27)
STAGE3D = {k: "planes" for k in HERO}
CAMERA = {1: "craneDown+dollyThrough", 2: "truckAcross", 3: "dollyThrough", 4: "static:hush frame", 5: "craneDown", 6: "dollyThrough", 7: "craneDown", 8: "riseWith"}


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

    palette = "storm slate, sulphur-yellow rain light, wet moss-green slope layers, chalk-white dashes for the ghost and one lantern-gold lamp for the instruments"
    board = {
        "run_date": "2026-11-01", "slug": "the-stand-in", "title": "The Stand-In",
        "concept": ("According to the NSF award record, 2608510, the University of Alaska Fairbanks gets $1,772,170 over six years from August 1st, 2026 for GAIA, a plan led by Carl Tape for a digital twin that aims to estimate landslide hazards in close to real time. "
                    "The award abstract describes a chain, rain soaks a slope, an earthquake weakens it, a later storm brings it down, and says the data that could warn of it come from separate systems that rarely work together. "
                    "The plan adds fast surrogate models, stand-ins for slow physics, coupled to incoming observations. Haines (December 2020, KHNS) and Wrangell (November 2023, six killed) show the stakes. "
                    "Nothing is built, the award record is the only public source, the University of Washington holds a larger partner award, and a loop only sharpens where instruments exist. "
                    "A dashed ghost hill, the Stand-In, is the throughline and the film ends on a blank SLOPE tag."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "low-angle-hero", "motion_vector": "vertical-descent", "hero_treatment": "single-organic-hero", "layout": "centered-hero-lowerthird",
                        "register": "storm-slate-cutaway", "palette": palette, "camera_strategy": "crane-down-and-hush",
                        "light_story": "overcast storm light that clears to one warm lamp on the instrumented slope",
                        "metaphor": "a dashed ghost hill that redraws itself closer to a real slope each time a reading arrives, and fogs where no instrument listens"},
        "palette": palette,
        "divergence_note": ("The last five films were a sage fiber chart desk (10-31), an aubergine dusk depot (10-29), a green-black sonar abyss (10-28), a sage civic hall (10-26) and a teal fog boardwalk (10-25). "
                            "This film is storm-slate overcast on a layered hillside cross-section with graphite dashes and one amber lamp. Its hero is a soaked hillside with a mountain goat, its stage is a slope and a test bench, "
                            "and it has no chart desk map, no hall, no depot, no boardwalk and no sea cutaway. The signature object is a dashed ghost hill that snaps closer to the real slope with each reading and smears to fog beyond the instruments."),
        "treatment": {"title": "The Stand-In", "summary": (OUT / "treatment.md").read_text()[:600] if (OUT / "treatment.md").exists() else ""},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A soaked layered hillside with a goat on its ledge while a dashed ghost hill draws itself beside it in one stroke.",
                 "headline": "A SLOPE THAT KEEPS UP", "motion_by_s": 0.3,
                 "loopback": "The goat steps from the bare slope onto the lit one and the ghost hill keeps its dashed edge, matching the opening ledge."},
        "open_loop": {"plant_t": b_at(9), "pay_t": b_at(27), "what": "Can a cartoon keep up with a real mountain? Planted when the goat raises an eyebrow at the ghost, paid when the ghost keeps up only around the instruments and the goat steps onto the bare fog."},
        "open_loop_2": {"plant_t": b_at(18), "pay_t": b_at(30), "what": "Which slope will the twin learn first? Planted when four feeds pour toward an untagged ghost, paid when the SLOPE tag is still blank."},
        "throughline": {"object": "the Stand-In, a dashed ghost hill", "lands_in_button": "the ghost hill keeps its dashed edge beside a blank SLOPE tag",
                        "states": [
                            {"at_s": b_at(2), "state": "a blank dashed outline drawn in one stroke"},
                            {"at_s": b_at(8), "state": "a quick sketch with a faint grid"},
                            {"at_s": b_at(13), "state": "stands unchanged beside the slumped slope, still only a sketch"},
                            {"at_s": b_at(18), "state": "waits untagged as four feeds pour toward it"},
                            {"at_s": b_at(21), "state": "tugged closer to the slope by each reading"},
                            {"at_s": b_at(26), "state": "razor sharp near the instruments and fog beyond"},
                            {"at_s": b_at(30), "state": "dashed, beside a blank SLOPE tag"}]},
        "reveals": [
            {"t": b_at(4), "type": "build-on", "what": "the NSF record clipboard, coin counter and six-year bar build onto the desk beside the slope", "hold_s": 0.6},
            {"t": b_at(13), "type": "morph-to-chart", "what": "the three panels resolve into the chain of rain, quake, storm on one slope", "hold_s": 0.8},
            {"t": b_at(21), "type": "scale-pullback", "what": "from one tugged corner to the whole ghost snapping onto the slope", "hold_s": 0.8},
            {"t": b_at(28), "type": "scale-pullback", "what": "from the bench out to a whole dark slope over a fjord with no instruments", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 0, "offset": 3.0, "level": 1.0}, {"line": 2, "offset": 0.0, "level": 0.2},
            {"line": 4, "offset": 0.0, "level": 0.95}, {"line": 5, "offset": 0.0, "level": 0.15}, {"line": 7, "offset": 0.0, "level": 0.9},
            {"line": 8, "offset": 0.0, "level": 0.14}, {"line": 9, "offset": 0.0, "level": 0.95}, {"line": 10, "offset": 0.0, "level": 0.16},
            {"line": 11, "offset": 0.0, "level": 0.9},
            {"at_s": round(b_at(27) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(27) + 0.8, 3), "level": 0.6},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(27) - 0.3, 3), "riser_at": round(b_at(28), 3), "silence_at": round(b_at(27) - 0.3, 3),
                      "payoff_at": b_at(27), "button_pattern": "callback", "interrupt_at": b_at(22), "extra_dips": [b_at(16)]},
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
    book.raise_if_missing("board_1101 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1101Ids.ts").write_text(
        "// GENERATED by scripts/board_1101.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
