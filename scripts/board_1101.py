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
 (1, 1, 0, 0.0, "whoosh", "the slope", "drips soaked blue as a pebble rolls off the ledge past the goat while a dashed ghost hill draws itself in beside it in one stroke", "worried", "A COPY OF A SLOPE · A PLAN",
  "a soaked layered slope with a white goat on its ledge and a dashed ghost hill drawing itself in beside it in one stroke as a pebble rolls off the ledge, a plate reads A COPY OF A SLOPE, A PLAN", "the slope drips", ""),
 (2, 1, 0, W("killed"), "crack", "the slope face", "tears open a scar across its upper layers as the real goat braces its legs and the ghost goat stays standing a beat late", "worried", "SLIDES HAVE KILLED PEOPLE",
  "a scar tears open across the upper layers of the slope as soil crumbles away and the real goat braces its legs while the ghost goat stays standing a beat late, a plate reads SLIDES HAVE KILLED PEOPLE", "the soil crumbles", ""),
 (3, 1, 0, W("Southeast"), "swish", "the camera", "pulls back from the single hill to a whole coast of slopes stretching into mist", "reading", "SOUTHEAST ALASKA",
  "the camera pulls back from the single hill to a whole coast of soaked slopes stretching into mist, a plate reads SOUTHEAST ALASKA", "the mist drifts", ""),
 (4, 1, 0, W("copy"), "scratch", "the ghost hill", "fills with a faint grid as the camera drops back to the one hill", "curious", "A COMPUTER COPY · PLANNED",
  "the dashed ghost hill fills with a faint grid as the camera drops back to the one hill, a plate reads A COMPUTER COPY, PLANNED", "the grid shimmers", ""),
 (5, 1, 0, W("keeps"), "tick", "the ghost hill", "lurches and jitters as a pebble lands on the real slope and the dashes break and re-form", "puzzled", "A PLAN TO KEEP UP",
  "the ghost outline lurches and jitters as a pebble lands on the real slope and the dashes break and re-form, a plate reads A PLAN TO KEEP UP", "the dashes crawl", ""),
 (6, 1, 1, 0.0, "creak", "the goat", "turns toward the cartoon ghost standing beside a real mountain and tilts its head with one eyebrow up", "skeptical", "CAN THAT CARTOON KEEP UP?",
  "the white goat turns toward the dashed cartoon ghost beside a towering real mountain and tilts its head with one eyebrow up, a plate reads CAN THAT CARTOON KEEP UP WITH A REAL MOUNTAIN?", "the goat chews", "plant: can a cartoon keep up"),
 (7, 2, 2, 0.0, "snap", "a slate relief map", "rises out of the ground as the camera whips to it and an engraved plate inks the award number", "reading", "NSF AWARD RECORD · 2608510",
  "a standing slate relief map of Alaska rises out of the ground as the camera whips to it and an engraved plate reading NSF AWARD RECORD 2608510 inks itself across its corner", "the plate rings", "rehook: the whip-pan to a standing relief map"),
 (8, 2, 2, W("Fairbanks"), "tick", "a pin", "drops onto Fairbanks as a name card slides in below it", "reading", "UNIVERSITY OF ALASKA FAIRBANKS",
  "a pin drops onto Fairbanks on the relief map as a name card reading UNIVERSITY OF ALASKA FAIRBANKS slides in below it", "the pin pulses", ""),
 (9, 2, 2, W("million"), "ding", "a coin stack", "grows beside the pin into the shape of a little hill as a slate-bronze dial counter ticks up to $1,772,170", "reading", "$1,772,170 · UAF",
  "a stack of coins grows beside the pin into the shape of a little hill as a slate-bronze dial counter ticks up to $1,772,170, a plate reads $1,772,170", "the coins settle", ""),
 (10, 2, 2, W("years"), "snap", "a long road bar", "draws across the map and stays mostly empty", "thoughtful", "AUG 1ST 2026 TO JULY 31ST 2032",
  "a long road-shaped bar labelled AUG 1ST 2026 TO JULY 31ST 2032 draws across the relief map and fills only a sliver, a plate reads PLANNED DATES", "the bar glows", ""),
 (11, 2, 3, 0.0, "paper", "a name card", "slides onto the relief map beside the pin", "reading", "PI CARL TAPE · UAF",
  "a card reading PI CARL TAPE, UAF slides onto the relief map beside the Fairbanks pin and settles", "the card settles", ""),
 (12, 2, 3, W("twin"), "pop", "the ghost hill", "sketches itself in over the Interior of the relief map", "curious", "DIGITAL TWIN · A STAND-IN",
  "the dashed ghost hill sketches itself in over the Interior of the relief map with a faint grid, a plate reads DIGITAL TWIN, A STAND-IN FOR A REAL SLOPE", "the grid shimmers", ""),
 (13, 3, 4, 0.0, "whoosh", "a three-panel strip", "slides in with the ghost standing pristine beside the real slope in every panel", "reading", "THE CHAIN · PER THE AWARD ABSTRACT",
  "a three-panel strip slides in, each panel the real slope with the dashed ghost standing pristine beside it, a plate reads THE CHAIN, PER THE AWARD ABSTRACT", "the panels settle", ""),
 (14, 3, 4, W("Rain"), "drip", "a rain gauge", "fills as blue seeps into the real slope only while the ghost stays dry", "worried", "1 · RAIN SOAKS THE HILL",
  "a one-inch rain gauge fills as blue seeps into the real slope layers in panel one while the ghost beside it stays dry, a plate reads 1 RAIN SOAKS THE HILL", "the layers darken", "rehook: the real slope floods blue while the ghost beside it stays dry"),
 (15, 3, 4, W("quake"), "clank", "a seismic station", "flinches as a crack opens through the soaked layers while the ghost stays unmoved", "alarmed", "2 · A QUAKE WEAKENS IT",
  "a round seismic station on the crest flinches as a crack opens through the soaked real layers in panel two while the ghost stays unmoved, a plate reads 2 A QUAKE WEAKENS IT", "the crack spreads", ""),
 (16, 3, 4, W("later"), "thud", "a storm cloud", "rolls in and the cracked real slope slumps while the ghost goes stale and frozen-grey", "alarmed", "3 · A LATER STORM BRINGS IT DOWN",
  "a storm cloud rolls over panel three and the cracked real slope slumps while the ghost beside it goes stale and frozen-grey, a plate reads 3 A LATER STORM BRINGS IT DOWN and a small plate reads A COPY WITH NO READINGS", "the slope slumps", ""),
 (17, 4, 5, 0.0, "paper", "a plain card", "holds still under a tall rain gauge", "somber", "HAINES · DEC 2020",
  "a plain slate card reading HAINES, DEC 2020 under a tall rain gauge, a slow push", "the gauge glints", ""),
 (18, 4, 5, W("eight"), "tick", "the rain gauge", "fills past its top mark", "somber", "AT LEAST 8 IN OF RAIN IN 2 DAYS · PER KHNS",
  "the tall rain gauge fills past its top mark, a plate reads AT LEAST 8 IN OF RAIN IN 2 DAYS, PER KHNS", "the water settles", ""),
 (19, 4, 5, W("killed"), "tap", "a card", "slides in beside the gauge reading two killed", "somber", "TWO KILLED",
  "a plain slate card slides in beside the gauge reading TWO KILLED", "the card settles", ""),
 (20, 4, 6, 0.0, "page", "a plain card", "holds still reading Wrangell with a slow push", "somber", "WRANGELL · NOV 2023",
  "a plain slate card reading WRANGELL, NOV 2023, a slow push, no other motion", "the card holds", ""),
 (21, 4, 6, W("six"), "rumble", "the rain gauge", "drains slowly beside the card as the number lands", "somber", "SIX KILLED",
  "the tall rain gauge drains slowly beside the plain card as the card reads SIX KILLED", "the water drains", ""),
 (22, 5, 7, 0.0, "whoosh", "the ghost hill", "rises beside the slope as a first thin feed line pulls in toward it, next to a bare socket post with an unlit lamp, while fog creeps along its edge", "curious", "WHICH SLOPE?",
  "the dashed ghost hill rises beside the slope as a first thin feed line pulls in toward it, next to a bare socket post with an unlit lamp, while fog creeps along the ghost's edge, a plate reads WHICH SLOPE?", "the first feed line pulses", "rehook: the ghost rises beside an unlit socket, plant: which slope"),
 (23, 5, 7, W("shaking"), "ding", "a seismic station", "sends a shaking feed line toward the ghost", "curious", "SHAKING",
  "a round seismic station on the slope sends a shaking feed line toward the ghost hill, a plate reads SHAKING", "the feed pulses", ""),
 (24, 5, 7, W("satellite"), "pop", "a satellite eye", "swings into frame and beams a feed line toward the ghost", "curious", "SATELLITE PICTURES",
  "a satellite eye swings into frame and beams a feed line toward the ghost hill, a plate reads SATELLITE PICTURES", "the beam pulses", ""),
 (25, 5, 7, W("weather"), "chime", "the rain gauge", "slides in from the hush and sends a weather feed line toward the ghost", "curious", "WEATHER",
  "the tall rain gauge from the hush frames slides in and sends a weather feed line toward the ghost hill, a plate reads WEATHER", "the gauge glints", ""),
 (26, 5, 7, W("groundwater"), "drip", "a groundwater probe", "rises from the slope and drips a green feed line toward the ghost", "curious", "GROUNDWATER",
  "a groundwater probe rises from the slope and drips a green feed line toward the ghost hill, a plate reads GROUNDWATER", "the probe drips", ""),
 (27, 5, 7, W("separate"), "ratchet", "four clocks", "tick on separate dials that do not touch", "wry", "SEPARATE SYSTEMS · RARELY WORK TOGETHER",
  "four separate clock dials tick one beside each feed and never touch, a plate reads SEPARATE SYSTEMS, RARELY WORK TOGETHER, PER THE ABSTRACT", "the dials tick", ""),
 (28, 5, 8, W("fast"), "clank", "a crank machine", "grinds slowly labelled REAL PHYSICS while the ghost speed-draws ten quick sketches", "determined", "SURROGATE MODEL · FAST STAND-IN FOR SLOW PHYSICS",
  "a heavy crank machine labelled REAL PHYSICS grinds out one answer while the dashed ghost speed-draws ten quick sketches, a plate reads SURROGATE MODEL, FAST STAND-IN FOR SLOW PHYSICS", "the crank grinds", ""),
 (29, 5, 8, W("tugged"), "snap", "pulses", "tug the dashed corners of the ghost until it snaps closer to the real slope as the clouds break", "determined", "EACH NEW READING WOULD TUG IT CLOSER",
  "pulses from the four feeds tug the dashed corners of the ghost and it snaps visibly closer to the real slope each time while the clouds break, a plate reads EACH NEW READING WOULD TUG IT CLOSER", "the ghost snaps", ""),
 (30, 6, 9, 0.0, "creak", "the ghost hill", "is already alone on a slate void and hollows out to an empty outline", "stern", "THE FAIR CASE",
  "the first frame after the hard cut is an empty slate void with the dashed ghost already alone on it as it hollows out to an empty outline, a plate reads THE FAIR CASE", "the grid drains", "rehook: the ghost goes hollow"),
 (31, 6, 9, W("built"), "rumble", "four feed lines", "die one by one and go grey as the hollow ghost sags", "stern", "NOT BUILT",
  "the four feed lines into the hollow ghost die one by one and go grey as it sags, a plate reads NOT BUILT", "the lines go grey", ""),
 (32, 6, 9, W("public"), "tick", "one thin line", "strikes from the hollow ghost to a lone pole while every other line stays dark", "stern", "ONE PUBLIC SOURCE · THE AWARD RECORD",
  "one thin line strikes from the hollow ghost to a single lone pole labelled THE AWARD RECORD while every other line stays dark, a plate reads ONE PUBLIC SOURCE", "the line pulses", ""),
 (33, 6, 10, 0.0, "slide", "the single live line", "forks to a second, taller pole labelled UNIVERSITY OF WASHINGTON beside the shorter UAF pole", "thoughtful", "PARTNER AWARDS · UW $2,209,093 · UAF $1,772,170",
  "the single live line forks to a second, taller pole labelled UNIVERSITY OF WASHINGTON $2,209,093 beside the shorter pole labelled UAF $1,772,170, EARTHSCOPE $449,448 as a small card, a plate reads PARTNER AWARDS", "the poles settle", ""),
 (34, 6, 10, W("results"), "thud", "a results plate", "stays empty under the test outline as the hollow ghost stops short", "stern", "NO RESULTS",
  "a results plate under the dashed test outline stays empty as the hollow ghost leans toward it and stops short, a plate reads NO RESULTS", "the plate stays empty", ""),
 (35, 7, 11, 0.0, "swish", "the real slope", "looms from a low angle as three lit instruments glow gold and the ghost snaps razor sharp around them while fog rolls over its far side", "thoughtful", "SHARP WHERE INSTRUMENTS ARE",
  "from a low angle the real slope looms with a rain gauge, a seismic station and a probe glowing lantern-gold, the dashed ghost snaps razor sharp around them while fog rolls over its far side, a plate reads SHARP WHERE INSTRUMENTS ARE", "the fog drifts", ""),
 (36, 7, 11, W("keep"), "tick", "two goats", "walk in sync near the instruments", "curious", "IN SYNC NEAR INSTRUMENTS",
  "the real goat and the ghost goat walk together in sync near the lit instruments", "the goats step", ""),
 (37, 7, 11, W("nowhere"), "boom", "the goat", "steps onto the fog and the ghost goat lags then breaks apart under its hooves, leaving the bare slope", "wry", "COULD KEEP UP WHERE THERE ARE SENSORS · NOWHERE ELSE",
  "the goat steps onto the fog and its ghost goat lags then breaks apart, leaving the bare slope, a plate reads COULD KEEP UP WHERE THERE ARE SENSORS, NOWHERE ELSE", "the ghost dissolves", "rehook: the ghost breaks apart in the fog"),
 (38, 8, 12, 0.0, "paper", "the Barry Arm face", "opens already at fjord scale on the dark Barry Arm face with the bare slope as a tiny matching silhouette at its foot", "reading", "NO ALASKA SLOPE NAMED · AWARD ABSTRACT",
  "the shot opens already at fjord scale on the dark Barry Arm face with the bare slope from shot 7 as a tiny matching silhouette at its foot, a plate reads NO ALASKA SLOPE NAMED, AWARD ABSTRACT", "the mist drifts", ""),
 (39, 8, 12, W("Barry"), "whoosh", "a dashed marker", "holds on the face as a dashed marker draws around it", "worried", "BARRY ARM · STATE GEOLOGISTS TRACK IT",
  "a dashed marker draws around the dark Barry Arm face over the fjord, a plate reads BARRY ARM, STATE GEOLOGISTS TRACK IT", "the face looms", ""),
 (40, 8, 12, W("million"), "tick", "a gauge ruler", "climbs the Barry Arm face beside the speck and stops at the mark", "reading", "ROUGHLY 500 MILLION M3 · DGGS",
  "a tall gauge ruler climbs the Barry Arm face past the tiny slope silhouette and stops at its mark, a plate reads ROUGHLY 500 MILLION M3, DGGS", "the ruler settles", ""),
 (41, 8, 12, W("tsunami"), "swell", "the fjord", "heaves and a ripple ring spreads across the empty fjord", "alarmed", "IF IT FAILED FAST · LIFE-THREATENING WAVES",
  "the fjord water heaves and a ripple ring spreads across the empty fjord with no ghost anywhere, a plate reads IF IT FAILED FAST, LIFE-THREATENING WAVES, no wave height anywhere", "the ripple spreads", ""),
 (42, 9, 13, 0.0, "pulse", "the ghost hill", "snaps razor sharp beside one lit lamp as fog closes in beyond and the neighbouring socket stays unlit", "curious", "WHICH SLOPE?",
  "the dashed ghost hill snaps razor sharp beside one lit lantern-gold lamp as fog closes in beyond it and the neighbouring socket post stays unlit, a plate reads WHICH SLOPE?", "the lamp glows", ""),
 (43, 9, 13, W("Nobody's"), "creak", "the goat", "leans on the unlit socket post and looks to camera", "wry", "NOBODY'S SAID",
  "the goat leans on the unlit socket post and looks to camera, a plate reads NOBODY'S SAID", "the goat chews", ""),
 (44, 9, 13, (W("Which", 2)), "ding", "the goat", "looks from the lit lamp to the unlit socket, puts a hoof on the unlit socket post and turns to camera through the tail", "hopeful", "WHICH SLOPE WOULD YOU PICK?",
  "the goat looks from the lit lamp to the unlit socket, puts a hoof on the unlit socket post and turns to camera while the ghost stays sharp beside the lamp through the tail, a plate reads WHICH SLOPE WOULD YOU PICK?", "the lamp glows", ""),
 (45, 4, 5, W("per"), "sizzle", "the rain", "thickens and streaks across the plain card as the gauge fills", "somber", "RAIN THICKENS",
  "the rain thickens and streaks across the plain card as the gauge fills, no ghost", "the rain thickens", ""),
 (46, 6, 10, W("testing"), "paper", "a dashed test outline", "appears as a dashed outline labelled Alaska and Pacific Northwest and the hollow ghost leans toward it", "thoughtful", "TESTS PLANNED · ALASKA + PACIFIC NORTHWEST",
  "a small dashed test outline labelled ALASKA and PACIFIC NORTHWEST appears and the hollow ghost leans toward it, a plate reads TESTS PLANNED", "the model settles", ""),
]

S = [
 (1, 0, "wide-establish", "wide", "low", "wet-slope-ledge", "cross-section-cutaway", "centered-hero-lowerthird", "vertical-descent", "single-organic-hero", "", "",
  "The slope", "A soaked slope with a goat, a ghost hill drawing in beside it, a scar, a pullback to a coast of slopes and the goat's raised eyebrow."),
 (2, 2, "map-territory", "medium", "eye", "slate-relief-map", "eye-level-immersive", "map-territory", "horizontal-traverse", "data-as-subject", "whip-pan", "travel",
  "Fairbanks", "A standing slate relief map of Alaska with the award plate, a Fairbanks pin, a coin stack that grows into a hill and a six-year road bar, then the ghost sketching in."),
 (3, 4, "data-panel", "insert", "ground", "three-panel-strip", "macro-closeup", "grid-modular", "horizontal-traverse", "structure-as-subject", "match-cut", "match",
  "The chain", "Three panels of the real slope with a pristine ghost beside each, rain, quake and storm hitting only the real one."),
 (4, 5, "subject-portrait", "close", "low", "plain-card-gauge", "eye-level-immersive", "single-object-void", "push-in-only", "single-organic-hero", "hard-cut", "match",
  "Haines and Wrangell", "A tall rain gauge beside three plain slate cards, a slow push, rain only and no gags."),
 (5, 7, "alt-vantage", "wide", "high", "feed-lines-slope", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "carried-element", "carry",
  "The loop", "The ghost rises beside a bare unlit socket post, four feeds pour in one by one, four clocks tick apart, a crank grinds and readings tug the ghost onto the slope."),
 (6, 9, "two-up", "medium", "eye", "slate-void", "eye-level-immersive", "stacked-layers", "push-in-only", "single-organic-hero", "hard-cut", "match",
  "Fair case", "A hard cut to a hollow ghost alone on a slate void, its four feed lines die, one thin line reaches a lone pole, forks to a taller UW pole beside a shorter UAF pole, a dashed test outline and an empty results plate."),
 (7, 11, "push-detail", "wide", "low", "instrumented-slope", "cross-section-cutaway", "stacked-layers", "vertical-descent", "single-organic-hero", "match-cut", "match",
  "Where the sensors are", "The real slope from low with three lit instruments, a razor-sharp ghost around them, fog beyond, the goats in sync and the ghost goat dissolving in the fog."),
 (8, 12, "push-detail", "extreme-wide", "high", "barry-arm-fjord", "eye-level-immersive", "map-territory", "vertical-descent", "landscape-as-subject", "match-cut", "travel",
  "Barry Arm", "Opens at fjord scale on the dark Barry Arm face with the bare slope as a tiny matching silhouette at its foot, a dashed marker, the gauge ruler builds up the face, a ripple ring, no ghost."),
 (9, 13, "wide-establish", "wide", "low", "instrumented-slope-2", "cross-section-cutaway", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "match-cut", "match",
  "Which slope", "The ghost snaps sharp beside one lit lamp with the neighbouring socket still unlit, the goat looks from the lamp to the socket and puts a hoof on the unlit post."),
]

AMBIENT = {1: "the slope drips, mist drifts, the ghost dashes crawl", 2: "the pin pulses, slate dust drifts, the relief map's side light shifts", 3: "the panels settle, rain streaks fall, the crack spreads",
           4: "the gauge glints, a slow push, quiet air", 5: "the feeds pulse, the dials tick, fog creeps along the ghost's edge", 6: "slate dust drifts, the dead lines flicker, the live line hums",
           7: "fog drifts, the lamps glow, the goats breathe", 8: "the face looms, the water heaves, mist rises", 9: "the lamp glows, fog drifts, the goat chews"}
CENTER = {1: "the slope at x540 y1000", 2: "the relief map at x540 y1020", 3: "the middle panel at x540 y1000", 4: "the gauge at x420 y1040", 5: "the ghost hill at x540 y1060", 6: "the hollow ghost at x640 y1000", 7: "the ghost at x540 y1040", 8: "the Barry Arm face at x540 y1020", 9: "the lit lamp at x560 y1000"}
HERO = {
 1: ("LayeredLand slope + goat + dashed ghost hill + ghost goat", "40% slope, 30% ghost, 20% goat, 10% scar"),
 2: ("slate relief map + pin + coin stack hill + road bar + ghost", "35% map, 25% coin hill, 20% ghost, 20% cards"),
 3: ("three slope panels + pristine ghost + rain gauge + seismic station + storm", "35% panels, 25% ghost, 20% gauge and station, 20% storm"),
 4: ("tall rain gauge + three plain slate cards + rain", "55% gauge, 30% cards, 15% rain"),
 5: ("ghost hill + bare socket post + four feeds + four clocks + crank machine", "30% ghost, 25% feeds, 25% crank, 20% clocks"),
 6: ("hollow ghost + dead feed lines + award-record pole + UW pole + UAF pole + dashed test outline + empty results plate", "35% ghost, 25% feed lines, 25% poles, 15% outline and plate"),
 7: ("real slope + three lit instruments + ghost + two goats + fog", "30% ghost, 30% instruments, 25% goats, 15% fog"),
 8: ("Barry Arm face + tiny slope silhouette at its foot + dashed marker + fjord + ruler + ripple", "45% face, 25% fjord, 15% silhouette, 15% ruler"),
 9: ("ghost hill + lit lamp + unlit socket post + goat", "30% ghost, 25% lamp, 25% goat, 20% socket"),
}
PARTS = {1: 52, 2: 48, 3: 56, 4: 34, 5: 60, 6: 52, 7: 58, 8: 40, 9: 44}
KICKS = (16, 37)
STAGE3D = {k: "planes" for k in HERO}
CAMERA = {1: "craneDown+dollyThrough", 2: "truckAcross", 3: "dollyThrough", 4: "dollyThrough", 5: "craneDown", 6: "dollyThrough", 7: "craneDown", 8: "static:opens at fjord scale", 9: "dollyThrough"}


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

    palette = "verdant wet moss-green slope layers, a muted sulphur-green storm key, slate timber, cool pale plates, a charcoal-cased pale-grey ghost and warm golden lantern light only on lit instruments"
    board = {
        "run_date": "2026-11-01", "slug": "the-stand-in", "title": "The Stand-In",
        "concept": ("According to the NSF award record, 2608510, the University of Alaska Fairbanks gets $1,772,170 over six years from August 1st, 2026 for GAIA, a plan led by Carl Tape for a digital twin that aims to estimate landslide hazards in close to real time. "
                    "The award abstract describes a chain, rain soaks a slope, an earthquake weakens it, a later storm brings it down, and says the data that could warn of it come from separate systems that rarely work together. "
                    "The plan adds fast surrogate models, stand-ins for slow physics, coupled to incoming observations. Haines (December 2020, KHNS) and Wrangell (November 2023, six killed) show the stakes. "
                    "Nothing is built, the award record is the only public source, the University of Washington holds a larger partner award, and a loop only sharpens where instruments exist. "
                    "A dashed ghost hill, the Stand-In, is the throughline and the film ends on an unlit socket beside one lit lamp."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "cross-section-cutaway", "motion_vector": "vertical-descent", "hero_treatment": "single-organic-hero", "layout": "centered-hero-lowerthird",
                        "register": "storm-slate-cutaway", "palette": palette, "camera_strategy": "crane-down-and-hush",
                        "light_story": "rain light that breaks to clear warm golden light on the instrumented slope",
                        "metaphor": "a dashed ghost hill that redraws itself closer to a real slope each time a reading arrives, goes hollow when its feeds die, and fogs where no instrument listens"},
        "palette": palette,
        "divergence_note": ("The last five films were a sage-and-cream fiber chart desk (10-31), an aubergine dusk depot (10-29), a green-black sonar abyss (10-28), a sage civic hall (10-26) and a teal fog boardwalk (10-25). "
                            "This film is overcast daylight on a wet layered hillside seen from a low angle, with slate timber props, grey-white plates, a standing relief map and a slate void. Its hero is a soaked slope with a goat and a dashed ghost hill, "
                            "and it has no chart desk, no cream paper, no hall, no depot, no boardwalk and no sea cutaway. Gold appears only on listening instruments, and the signature object is a ghost hill that snaps closer to the real slope with each reading and fogs where no instrument listens."),
        "treatment": {"title": "The Stand-In", "summary": (OUT / "treatment.md").read_text()[:600] if (OUT / "treatment.md").exists() else ""},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A soaked layered hillside with a goat on its ledge while a dashed ghost hill draws itself beside it in one stroke and a plate reads A COPY OF A SLOPE, A PLAN.",
                 "headline": "A COPY OF A SLOPE", "motion_by_s": 0.3,
                 "loopback": "The goat puts a hoof on the unlit socket post and turns to camera while the ghost stays sharp beside the lamp, rhyming with the opening ledge and the first ghost stroke."},
        "open_loop": {"plant_t": b_at(6), "pay_t": b_at(37), "what": "Can a cartoon keep up with a real mountain? Planted when the goat raises an eyebrow at the ghost, paid when the ghost keeps up only around the instruments and the goat steps onto the bare fog."},
        "open_loop_2": {"plant_t": b_at(22), "pay_t": b_at(42), "what": "Which slope will the twin learn first? Planted when the ghost rises beside a bare unlit socket, paid when the neighbouring socket is still unlit beside the lit lamp."},
        "throughline": {"object": "the Stand-In, a dashed ghost hill", "lands_in_button": "the ghost stays razor sharp beside one lit lamp with fog beyond and an unlit socket beside it, the film's argument",
                        "states": [
                            {"at_s": b_at(1), "state": "a blank dashed outline drawn in one stroke beside the real slope"},
                            {"at_s": b_at(4), "state": "filled with a faint grid as a planned computer copy"},
                            {"at_s": b_at(12), "state": "sketched in over the Interior of the relief map"},
                            {"at_s": b_at(16), "state": "goes stale and frozen-grey beside the slumping real slope"},
                            {"at_s": b_at(22), "state": "rises beside a bare unlit socket as fog creeps along its edge"},
                            {"at_s": b_at(29), "state": "tugged closer to the real slope by each reading"},
                            {"at_s": b_at(35), "state": "razor sharp around three lit instruments and fog beyond"},
                            {"at_s": b_at(31), "state": "hollow with every feed line dead and grey"},
                            {"at_s": b_at(41), "state": "absent, no twin at Barry Arm"},
                            {"at_s": b_at(42), "state": "sharp beside one lit lamp with the neighbouring socket still unlit"}]},
        "reveals": [
            {"t": b_at(3), "type": "scale-pullback", "what": "from the single hill to a whole coast of soaked slopes stretching into mist", "hold_s": 0.8},
            {"t": b_at(16), "type": "morph-to-chart", "what": "the three panels resolve into the chain of rain, quake, storm on one slope with a pristine ghost", "hold_s": 0.8},
            {"t": b_at(29), "type": "scale-pullback", "what": "from one tugged corner to the whole ghost snapping onto the slope as the clouds break", "hold_s": 0.8},
            {"t": b_at(40), "type": "build-on", "what": "the gauge ruler builds up the dark Barry Arm face past the tiny slope silhouette, a scale read on the same shot", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 0, "offset": 3.0, "level": 1.0}, {"line": 2, "offset": 0.0, "level": 0.5},
            {"line": 4, "offset": 0.0, "level": 0.95}, {"line": 5, "offset": 0.0, "level": 0.12}, {"line": 7, "offset": 0.0, "level": 0.9},
            {"line": 8, "offset": 0.0, "level": 0.8}, {"line": 9, "offset": 0.0, "level": 0.95}, {"line": 10, "offset": 0.0, "level": 0.4},
            {"line": 11, "offset": 0.0, "level": 0.9},
            {"at_s": round(b_at(37) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(37) + 0.8, 3), "level": 0.6},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(37) - 0.3, 3), "riser_at": round(b_at(38), 3), "silence_at": round(b_at(37) - 0.3, 3),
                      "payoff_at": b_at(37), "button_pattern": "callback", "interrupt_at": b_at(30), "extra_dips": [b_at(19)]},
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
