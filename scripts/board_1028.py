#!/usr/bin/env python3
"""2026-10-28 "The River It Never Saw": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1028.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1028.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "snap", "the agency sonar", "snaps on with a mint ring and a flash while amber fish flood across the gold center line", "reading", "NUSHAGAK",
  "a black frame, the agency's faceless sonar fan snaps on with a mint ring and amber fish flood across a gold center line while a dashed violet question mark glows over an unlit fan at the far right",
  "the tally wheels blur and the question mark pulses", "plant: why is the right third black"),
 (2, 1, 0, W("Nushagak"), "knock", "the plate", "lands over the fan", "reading", "NUSHAGAK · JUNE 28TH · SONAR COUNT",
  "a plate reads NUSHAGAK, JUNE 28TH, SONAR COUNT", "the fish keep streaming", ""),
 (3, 1, 0, W("thousand"), "thump", "the odometer", "rolls up to 855,936 and lands with a hit", "reading", "855,936",
  "a brass six digit odometer rolls up to 855,936 and lands", "the odometer jolts and the plaque rattles while the dashed question fan pulses once", ""),
 (4, 2, 1, 0.0, "whoosh", "the camera", "whips across from the fan to a river where a stack of amber slabs rises", "reading", "KENAI",
  "the view whips across to a dark river where a tall stack of amber slabs rises beside a small faceless sonar", "the slabs rise", ""),
 (5, 2, 1, W("million"), "ping", "the top slab", "lights pale as the stack tops out", "reading", "KENAI MILE 19 · 1,111,781 · SONAR ESTIMATE",
  "the stack tops out and the top slab lights pale, a plate reads KENAI MILE 19, 1,111,781, SONAR ESTIMATE",
  "the stack settles and the small fan streams", ""),
 (6, 15, 2, 0.0, "pop", "fifteen pins", "pop onto a painted Alaska one after another", "reading", "FIFTEEN PINS",
  "fifteen mint pins pop onto a painted outline of Alaska one by one",
  "the pins pulse", ""),
 (7, 15, 2, W("thirteen"), "click", "the sites plate", "stamps beside the map", "reading", "15 SONAR SITES · 13 RIVERS · ADF&G",
  "a plate reads 15 SONAR SITES, 13 RIVERS, ADF&G and a smaller plate marks the map as schematic", "the pins pulse", ""),
 (8, 3, 3, 0.2, "slide", "a paper sheet", "drops from above and settles with a bounce", "reading", "PREPRINT · OCT 15TH · CALTECH + MIT",
  "a cream paper sheet headed CFC26 drops in and settles, a plate reads PREPRINT, OCT 15TH, CALTECH + MIT",
  "the sheet settles and sways", "rehook: a paper lands in the river world"),
 (9, 3, 3, W("preprint"), "thunk", "a stamp", "slaps PREPRINT then NOT PEER REVIEWED onto the sheet", "reading", "PREPRINT · NOT PEER REVIEWED",
  "an ink stamp slaps PREPRINT onto the sheet and NOT PEER REVIEWED lands under it", "the stamp rings and the sheet shivers", "rehook: the stamp lands"),
 (10, 3, 3, W("test"), "click", "the sheet's title line", "slides out of the sheet and lands in a plate", "reading", "A TEST FOR SONAR FISH COUNTING",
  "a plate reads A TEST FOR SONAR FISH COUNTING", "the sheet sways", ""),
 (38, 3, 3, W("video"), "bloop", "a strip of clips", "slides in under the sheet, each frame a tiny fan with fish", "reading", "BENCHMARK CLIPS",
  "a sprocket film strip slides in under the sheet, each frame a tiny sonar fan with amber fish", "the strip fans stream", ""),
 (11, 4, 4, 0.0, "knock", "a person", "walks in to a sonar video monitor holding a brass clicker", "reading", "EXPERTS WATCH THE VIDEO · PER PREPRINT",
  "a person in a puffer jacket stands at a monitor showing a faceless sonar fan with a ruled gold center line and holds a brass clicker, a plate reads EXPERTS WATCH THE VIDEO, PER PREPRINT",
  "the fish stream and the person breathes", ""),
 (12, 4, 4, W("tallying"), "tick", "the clicker", "clicks and its count rolls up as each fish crosses the line while the left and right wheels tick", "reading", "TALLY OF CROSSINGS, EACH DIRECTION",
  "the thumb clicks the brass clicker as each fish crosses the line and the left and right wheels on the base tick, a plate reads TALLY OF CROSSINGS, EACH DIRECTION",
  "the count rolls up", ""),
 (13, 4, 5, W("harvest"), "tick", "a plate", "slides in as the thumb clicks again", "reading", "COUNTS GUIDE HARVEST LIMITS · PER PREPRINT",
  "a plate reads COUNTS GUIDE HARVEST LIMITS, PER PREPRINT", "the ticks keep dropping", ""),
 (14, 5, 6, 0.0, "slide", "a coast line", "draws down the frame from Alaska to California", "reading", "11 SITES",
  "a pale coast line draws down the frame and eleven dots light along it one by one while a grid of clip tiles lights below with a plate 4,363 CLIPS, 1.0M+ BOXES", "the dots pulse", "plant: eleven dots on a coast"),
 (15, 5, 6, W("nine"), "pop", "the Kenai halo", "closes a solid ring around the three Kenai dots as one", "reading", "11 SITES · 9 RIVER SYSTEMS",
  "a solid mint halo rings the three Kenai dots as one river system, a plate reads 11 SITES, 9 RIVER SYSTEMS",
  "the halo crawls", ""),
 (46, 5, 6, W("four"), "pop", "four mint dots", "fill solid on the Alaska end", "reading", "ALASKA · 3 KENAI SITES + 1 NUSHAGAK",
  "the four Alaska dots fill solid mint, a plate reads ALASKA, 3 KENAI SITES + 1 NUSHAGAK", "the dots pulse", ""),
 (16, 5, 6, W("Alaska"), "ping", "a plate", "slides in under the coast", "reading", "ALASKA · LARGER, DENSER POPULATIONS · PER PREPRINT",
  "a plate reads ALASKA, LARGER, DENSER POPULATIONS, PER PREPRINT", "the tiles twinkle", ""),
 (17, 6, 7, 0.0, "swell", "Wedge", "slides in as THE MODEL and swings its eyes to the black third of its fan", "unsure", "CAN IT COUNT A RIVER IT NEVER SAW?",
  "a close Wedge labelled as the model with its eyes on the black right third of the fan, a violet dashed question mark appears in the dark, a plate reads CAN IT COUNT A RIVER IT NEVER SAW?",
  "the eyes squint and the question mark pulses", "rehook: the dark third gets a question"),
 (19, 7, 8, 0.0, "whoosh", "the score needle", "sweeps across the center line", "reading", "NEW SCORE · DIRECTION OF ERROR",
  "the gold center line becomes a needle that sweeps from side to side, a plate reads NEW SCORE, DIRECTION OF ERROR",
  "the needle trembles", "rehook: the line becomes a gauge"),
 (36, 7, 8, W("misses"), "bell", "the needle", "settles toward center", "reading", "TOO HIGH OR TOO LOW?",
  "the needle slows, a plate reads TOO HIGH OR TOO LOW?", "the needle trembles", ""),
 (20, 14, 9, 0.0, "snap", "a clip frame", "snaps up around a cross-section of the Kenai while a small Wedge in the corner snaps boxes onto the fish crossing the gold line", "reading", "KENAI BANK HELD OUT OF TRAINING",
  "a sprocket clip frame snaps up around a cross-section of the Kenai with two banks and a gold line across the channel, a small Wedge labelled as the model in the corner snaps mint boxes onto the fish, a plate reads KENAI BANK HELD OUT OF TRAINING", "the boxes snap", "rehook: the answer snaps up"),
 (50, 14, 9, W("average"), "roll", "two empty vertical tracks", "stand up on the two banks", "reading", "KENAI HELD OUT",
  "two empty vertical gauge tracks stand up on the two banks of the cross-section", "the tracks settle", ""),
 (21, 14, 9, W("seven"), "ping", "the left bank gauge", "fills a hair and stops under 0.07", "reading", "LEFT BANK · MISS UNDER 0.07 (7%)",
  "a thin mint gauge fills a hair and stops under 0.07, a plate reads LEFT BANK, MISS UNDER 0.07 (7%)", "the bar fills", ""),
 (22, 14, 9, W("right"), "pop", "the right bank gauge", "fills even less and stops under 0.03", "reading", "RIGHT BANK · MISS UNDER 0.03 (3%)",
  "a second thin gauge fills less and stops under 0.03, a plate reads RIGHT BANK, MISS UNDER 0.03 (3%)", "the bar fills", ""),
 (23, 14, 9, W("lean"), "bloop", "the needle", "leans a hair to the left and holds", "reading", "NEAR ZERO, NOT ZERO",
  "the needle leans a hair to the left of center and holds, a plate reads NEAR ZERO, NOT ZERO", "the needle trembles", ""),
 (24, 8, 11, 0.0, "clink", "two clickers", "drop onto a ledge and click up to slightly different counts", "reading", "TWO PEOPLE, ONE VIDEO",
  "two brass hand clickers on a warm dusk ledge click up to slightly different counts, a plate reads TWO PEOPLE, ONE VIDEO",
  "the clickers bob", "rehook: a second ruler drops in"),
 (25, 8, 11, W("ten"), "thunk", "a pale ruler", "drops between the clickers and measures their gap", "reading", "ABOUT 10% APART · INFORMAL",
  "a pale ruler drops between the clickers, a plate reads ABOUT 10% APART, INFORMAL", "the ruler glints", ""),
 (39, 8, 11, W("ruler"), "thunk", "the Kenai gauge", "slides in toward the pale ruler, its ticks do not line up, and it stops a visible gap short", "reading", "NOT A SCOREBOARD",
  "the thin mint Kenai gauge slides in from the right toward the pale human ruler, its tick spacing does not match and it stops a visible gap short, a plate reads NOT A SCOREBOARD",
  "the clickers stop bobbing", ""),
 (26, 9, 10, W("Hold"), "rumble", "a clip strip", "scrolls past Wedge and the Nushagak clip lifts out, goes dashed violet and is set aside", "reading", "HELD OUT OF TRAINING",
  "a strip of clip frames scrolls past Wedge, the clip labelled NUSHAGAK lifts out of the strip and is set aside as a dashed violet slot, a plate reads HELD OUT OF TRAINING",
  "the strip scrolls", "rehook: the clip lifts out"),
 (48, 9, 10, W("missed"), "ping", "a thin mint gauge", "fills a hair beside the set-aside clip", "reading", "NUSHAGAK HELD OUT · MISS 0.035 (3.5%)",
  "a thin mint gauge beside the set-aside clip fills a hair, a plate reads NUSHAGAK HELD OUT, MISS 0.035 (3.5%)", "the gauge fills", ""),
 (27, 10, 12, 0.0, "slide", "two empty tracks", "slide up side by side beside a dusk creek", "reading", "MAD RIVER · CALIFORNIA",
  "two empty tracks labelled IN TRAINING and HELD OUT slide up, a plate reads MAD RIVER, CALIFORNIA", "the tracks settle", "rehook: the hard river"),
 (42, 10, 12, W("third"), "pop", "the mint bar", "rises to a third of the track", "reading", "ABOUT A THIRD (0.33)",
  "the mint bar labelled IN TRAINING rises to about a third and its tag reads ABOUT A THIRD (0.33)", "the bar settles", ""),
 (28, 10, 12, W("eighty"), "thump", "the coral bar", "shoots up to 0.80", "wide", "CALIFORNIA · IN TRAINING 0.33 · HELD OUT 0.80",
  "the coral bar labelled HELD OUT shoots up to 0.80 (80%) beside the mint bar at 0.33, a plate reads CALIFORNIA, IN TRAINING 0.33, HELD OUT 0.80", "the bar settles", "rehook: the coral bar jumps"),
 (29, 10, 12, W("held"), "bloop", "the camera", "pulls back from the tall bars while two hairline ticks for the Kenai banks drop onto the same track", "reading", "KENAI HELD OUT · 0.07 AND 0.03",
  "the camera pulls back from the tall bars and two hairline ticks drop onto the same track at 0.07 and 0.03, a plate reads KENAI HELD OUT, 0.07 AND 0.03", "the ticks settle", ""),
 (30, 11, 13, 0.0, "bloop", "two empty tracks", "stand up on a pale gold baseline", "reading", "KENAI CHANNEL",
  "two empty tracks stand up on a pale gold baseline, a plate reads KENAI CHANNEL", "the tracks settle", ""),
 (52, 11, 13, W("fourteen"), "pop", "a mint bar", "rises to 0.14", "reading", "14% (0.14)",
  "the first mint bar rises to about 0.14 and its tag reads 14% (0.14)", "the bar settles", ""),
 (31, 11, 13, W("twenty"), "thump", "a second bar", "shoots up to twice the height beside it", "reading", "KENAI CHANNEL · HELD OUT 0.14 TO 0.29",
  "a second mint bar labelled HELD OUT shoots up to about 0.29 beside the first and its tag reads 29% (0.29), a plate reads KENAI CHANNEL, HELD OUT 0.14 TO 0.29", "the bars settle", ""),
 (32, 12, 14, 0.0, "slide", "a dashed cable", "runs from Wedge toward the agency sonar and stops one step short of it while a dashed unlit fan with a question mark waits behind", "reading", "BUILT FOR DEPLOYMENT",
  "the CFC26 sheet and Wedge stand beside the agency sonar while a dashed violet cable runs from Wedge toward it and stops one step short and the dashed unlit fan with its question mark waits at the right, a plate reads BUILT FOR DEPLOYMENT",
  "the sheet sways", ""),
 (33, 12, 14, W("Nothing"), "clink", "a plate", "stamps over the dashed fan and its question mark greys", "reading", "NO AGENCY USE REPORTED",
  "a plate reads NO AGENCY USE REPORTED over the dashed unlit fan and its question mark greys", "the question mark greys", ""),
 (34, 13, 15, 0.0, "snap", "the agency sonar", "returns to the opening composition lit at left, with the dashed unlit fan and Wedge at right", "idle", "ADF&G SONAR",
  "the opening frame returns: the agency's faceless sonar lit at left with tally wheels and fish crossing the gold line and no boxes, the dashed unlit violet fan at right with Wedge standing at its edge and unlit, the gold line running solid under the lit fan and dashed into the unlit one and ending in an open hook",
  "the dashes crawl and the fish stream", ""),
 (49, 13, 15, W("Alaska"), "fade", "the model's eyes", "turn from the lit agency fan to the dashed fan", "unsure", "THE MODEL",
  "Wedge standing at the edge of the dashed fan turns its eyes from the lit agency fan toward the dashed one", "the dashes crawl", ""),
 (51, 13, 15, W("didn't"), "thump", "the dashed fan", "pulses once at its rim", "unsure", "A COUNT SOMEBODY USES · STILL MISSING",
  "the dashed unlit fan pulses once at its rim beside Wedge", "the dashes crawl", ""),
 (44, 13, 15, W("missing"), "bloop", "three question boxes", "drop in above the dashed unlit fan", "unsure", "A COUNT SOMEBODY USES · STILL MISSING",
  "three dashed violet question boxes drop in above the dashed unlit fan and a plate reads A COUNT SOMEBODY USES, STILL MISSING", "the boxes pulse", ""),
 (35, 13, 15, W("somebody"), "swell", "one fish", "stops one step short of the dashed fan's line", "wide", "A COUNT SOMEBODY USES · STILL MISSING",
  "one amber fish with a dashed ring stops one step short of the line of the dashed fan, then the frame cuts to black",
  "the fish bobs and the dashes crawl", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "wide-establish", "medium", "eye", "sonar-fan", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "instrument-as-subject", "", "",
  "The flood", "A black frame where the agency's faceless sonar fan snaps on and amber fish flood across a gold line while an odometer climbs to 855,936, with a dashed unlit fan and a question mark at the far right."),
 (2, 1, "wide-establish", "wide", "high", "river-stack", "overhead", "stacked-layers", "vertical-rise", "data-as-subject", "whip-pan", "travel",
  "The Kenai season", "A stack of amber slabs rises beside a small faceless sonar to 1,111,781 and lights the busiest day."),
 (15, 2, "map-territory", "extreme-wide", "high", "painted-map", "top-down-map", "map-territory", "push-in-only", "landscape-as-subject", "hard-cut", "match",
  "Fifteen sites", "Fifteen mint pins pop onto a painted Alaska."),
 (3, 3, "subject-portrait", "close", "eye", "preprint-desk", "macro-closeup", "single-object-void", "vertical-descent", "structure-as-subject", "hard-cut", "match",
  "The preprint", "A paper sheet CFC26 drops in and is stamped PREPRINT, with a film strip of benchmark clips below."),
 (4, 4, "alt-vantage", "medium", "eye", "sonar-cutaway", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "multiplicity-swarm", "carried-element", "carry",
  "Counted at a line", "A person with a brass clicker beside a sonar video where fish cross a ruled gold line and the tally wheels tick."),
 (5, 6, "map-territory", "wide", "high", "coast-line", "top-down-map", "stacked-layers", "vertical-descent", "data-as-subject", "hard-cut", "match",
  "The data", "A coast line from Alaska to California with eleven lit dots, three Kenai dots haloed together, and a grid of clip tiles."),
 (6, 7, "subject-portrait", "close", "low", "dark-third", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "match-cut", "match",
  "The question", "Wedge, labelled as the model, looks at the black third of its own fan where a dashed violet question mark glows."),
 (7, 8, "wide-establish", "medium", "eye", "needle-gauge", "eye-level-immersive", "single-object-void", "push-in-only", "instrument-as-subject", "carried-element", "carry",
  "Which way it misses", "The center line becomes a needle that sweeps and slows."),
 (14, 9, "wide-establish", "medium", "eye", "kenai-readout", "cross-section-cutaway", "stacked-layers", "vertical-descent", "data-as-subject", "carried-element", "carry",
  "A Kenai bank held out", "A cross-section of the Kenai inside a benchmark clip frame with a thin gauge on each bank stopping under 0.07 and 0.03 while a small Wedge reads it and the needle rests a hair left."),
 (9, 10, "alt-vantage", "wide", "eye", "clip-strip", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "multiplicity-swarm", "whip-pan", "travel",
  "Nushagak held out", "A strip of clips scrolls past Wedge and the Nushagak clip is lifted out and set aside while a thin mint gauge fills a hair."),
 (8, 11, "two-up", "close", "low", "clicker-ledge", "macro-closeup", "single-object-void", "vertical-descent", "instrument-as-subject", "hard-cut", "match",
  "A different ruler", "Two brass hand clickers on a warm dusk ledge with a pale ruler dropped between them and a thin gauge that cannot dock against it."),
 (10, 12, "alt-vantage", "medium", "high", "bar-creek", "overhead", "stacked-layers", "vertical-rise", "data-as-subject", "hard-cut", "match",
  "Mad River", "Two bars rise to 0.33 and 0.80, then the camera pulls back to the full track where the Kenai hairlines sit."),
 (11, 13, "subject-portrait", "close", "eye", "channel-bars", "macro-closeup", "single-object-void", "push-in-only", "data-as-subject", "match-cut", "match",
  "Kenai channel", "Two mint bars on a gold baseline, the second twice the height of the first."),
 (12, 14, "two-up", "close", "eye", "unwired", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "structure-as-subject", "hard-cut", "match",
  "Not deployed", "The CFC26 sheet and Wedge beside the agency sonar with a dashed cable that stops one step short."),
 (13, 15, "wide-establish", "medium", "eye", "opening-pose", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "instrument-as-subject", "match-cut", "match",
  "The button", "The opening frame returns: the agency fan lit at left, the dashed unlit fan at right with Wedge at its edge, the line ending in an open hook and one fish stopping short, then a cut to black."),
]

AMBIENT = {
 1: "fish stream across the fan, the odometer rolls, the sweep turns, the question mark pulses, silt drifts",
 2: "the slabs breathe, the small fan streams, silt drifts",
 15: "the pins pulse, the outline glows, silt drifts",
 3: "the sheet sways, the strip fans stream, silt drifts",
 4: "fish stream across the video, the thumb clicks, the wheels tick, the sweep turns",
 5: "the dots pulse, the halo crawls, the tiles twinkle",
 6: "the eyes squint, the question mark pulses, the dashes crawl",
 7: "the needle trembles, boxes snap, the sweep turns",
 14: "the gauges fill, the needle trembles, boxes snap, the clip frame flickers",
 8: "the clickers bob, the gauge slides, the ruler glints, silt drifts",
 9: "the clip strip scrolls, the dashed slot pulses, the gauge fills, silt drifts",
 10: "the bars settle, fish drift, silt drifts",
 11: "the bars breathe, the baseline glints, silt drifts",
 12: "the sheet sways, fish stream, silt drifts",
 13: "the dashes crawl, one fish bobs, the sweep turns",
}
CENTER = {1: "the fan at x540 y1090", 2: "the stack at x300 y900", 15: "the map at x540 y1000", 3: "the sheet at x540 y1000", 4: "the fan at x540 y1130", 5: "the coast at x450 y900",
          6: "the fan at x500 y1120", 7: "the fan at x540 y1150", 14: "the fan at x540 y1160", 8: "the clickers at x540 y1000", 9: "the strip at x540 y700", 10: "the bars at x400 y1000",
          11: "the bars at x400 y1000", 12: "the sheet and fan at x540 y1050", 13: "the fan at x540 y1130"}
HERO = {
 1: ("faceless agency sonar + odometer + fish", "55% sonar, 25% fish, 20% odometer"),
 2: ("stack of slabs + small faceless sonar", "60% stack, 30% sonar, 10% plates"),
 15: ("painted Alaska + fifteen pins", "70% map, 30% pins"),
 3: ("CFC26 sheet + stamp + film strip", "55% sheet, 20% stamp, 25% strip"),
 4: ("person + clicker + sonar video + tally wheels", "40% video, 30% person, 30% clicker and wheels"),
 5: ("coast line + eleven dots + clip tiles", "40% coast, 35% dots, 25% tiles"),
 6: ("Wedge + black third + question mark", "50% Wedge, 30% dark third, 20% question mark"),
 7: ("Wedge + needle", "60% Wedge, 40% needle"),
 14: ("river cross-section + two bank gauges + small Wedge", "45% cross-section, 35% gauges, 20% Wedge"),
 8: ("two clickers + dashed ruler + ledge", "50% clickers, 25% ruler, 25% ledge"),
 9: ("clip strip + set-aside Nushagak clip + Wedge + thin gauge", "40% strip, 30% Wedge, 30% gauge"),
 10: ("two bars + full track + Kenai hairlines", "60% bars, 25% track, 15% hairlines"),
 11: ("two Kenai channel bars + gold baseline", "70% bars, 30% baseline"),
 12: ("sheet + Wedge + agency sonar + dashed cable", "35% sheet, 30% Wedge, 20% sonar, 15% cable"),
 13: ("agency sonar + dashed fan + Wedge + open hook + one fish", "35% agency sonar, 30% dashed fan and Wedge, 20% hook, 15% fish"),
}
PARTS = {1: 56, 2: 48, 15: 44, 3: 50, 4: 54, 5: 52, 6: 50, 7: 46, 14: 52, 8: 46, 9: 48, 10: 50, 11: 54, 12: 46, 13: 52}
KICKS = (3, 28, 35)
STAGE3D = {k: "planes" for k in HERO}
CAMERA = {1: "dollyThrough", 2: "truckAcross", 15: "craneDown", 3: "craneDown", 4: "truckAcross", 5: "craneDown", 6: "dollyThrough", 7: "static:the needle is the motion", 14: "craneDown",
          8: "truckAcross", 9: "truckAcross", 10: "riseWith", 11: "craneDown", 12: "truckAcross", 13: "dollyThrough"}


def est_starts():
    t, out = 0.0, {}
    for i, s in enumerate(LINES):
        out[i] = t
        t += len(s.split()) * 0.4345 + 0.6974 * len(re.findall(r"[.?!]", s)) + 0.15
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

    palette = "submerged abyss lit only by a bright phosphor mint sonar fan, amber fish echoes, one gold center line, odometer wheels, violet dashes for the unknown, coral spent once on 0.80"
    board = {
        "run_date": "2026-10-28", "slug": "the-river-it-never-saw", "title": "The River It Never Saw",
        "concept": ("A Caltech and MIT preprint (arXiv 2610.22549, October 15th) called CFC26 is a benchmark for AI that counts salmon in sonar video, with 11 sites on 9 river systems, four in Alaska (three on the Kenai and one on the Nushagak). "
                    "Held out of training, the Kenai banks still miss by under 0.07 and 0.03 with a direction score near zero and the Nushagak by about 0.035, the Kenai channel doubles from 0.14 to 0.29 and California's Mad River goes from about a third to 0.80. "
                    "The preprint reports no agency use. The agency's sonar is drawn faceless and fully lit. The model is Wedge, a faced sonar fan labelled THE MODEL that first appears at the question, and a pale gold center line is the throughline: bare, ruled with tallies, a needle, half dashed into the dark, an open hook. "
                    "A dashed unlit fan with a question mark is planted in the first frame and is the question the film pays at the end with an honest blank."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "push-in-only", "hero_treatment": "instrument-as-subject", "layout": "centered-hero-lowerthird",
                        "register": "naturalistic-scene", "palette": palette, "camera_strategy": "slow-push-with-pullbacks",
                        "light_story": "bright sonar glow in clear water, then a soft fog",
                        "metaphor": "a sonar fan with a face counting fish across a gold line, half of its view black where the unseen river would be"},
        "palette": palette,
        "divergence_note": ("The last films were a bright civic hall of sage and honey with a ballot box (10-26), a rain boardwalk of signs (10-25), a navy orbit (10-24), a paper building in snow (10-23) and a dark tundra bob (10-22). "
                            "This film is a near-black submerged sonar world lit by one mint fan, with amber fish echoes, a gold line and violet dashes. There is no hall, no desk of sliding sheets, no podium, no ballot, no boardwalk, no calendar and no scale. "
                            "Its hero is a wedge-shaped instrument with a face, a new silhouette, and its world is the instrument's own screen plus a river bank near plane."),
        "treatment": json.loads((OUT / "treatment.json").read_text()) if (OUT / "treatment.json").exists() else {},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A black frame, the agency's faceless sonar fan snaps on with a mint ring while amber fish flood across a gold line and a dashed violet unlit fan with a question mark glows at the far right.",
                 "headline": "855,936 IN ONE DAY", "motion_by_s": 0.3,
                 "loopback": "The last frame returns to the opening pose with the center line half dashed and one fish stopping one step short, changed in state."},
        "open_loop": {"plant_t": round(b_at(1) + 0.5, 3), "pay_t": b_at(33), "what": "Why is there a dashed unlit fan with a question mark beside the lit one? Planted in the first frame, paid when the preprint reports no agency use and the film names the missing count somebody uses."},
        "open_loop_2": {"plant_t": b_at(17), "pay_t": b_at(28), "what": "Can the model count a river it never saw? Planted as Wedge looks at the dark third, paid in part when the Mad River bar jumps from 0.33 to 0.80."},
        "throughline": {"object": "the gold center line", "lands_in_button": "the center line half dashed and ending in an open hook, with one fish stopping a step short",
                        "states": [
                            {"at_s": b_at(1), "state": "a bare gold line that fish cross"},
                            {"at_s": b_at(11), "state": "ruled with ticks and boxes snapping onto each crossing"},
                            {"at_s": b_at(19), "state": "a needle that leans to show direction of error"},
                            {"at_s": b_at(23), "state": "the needle resting a hair left of center, near zero"},
                            {"at_s": b_at(26), "state": "a clip of the line lifted out of the strip and set aside as a dashed slot"},
                            {"at_s": b_at(24), "state": "a gold zero tick on the human ruler"},
                            {"at_s": b_at(30), "state": "a pale gold baseline under the Kenai channel bars"},
                            {"at_s": b_at(34), "state": "half dashed and ending in an open hook, one fish stopping short"}]},
        "reveals": [
            {"t": b_at(5), "type": "morph-to-chart", "what": "the stack of slabs rises to 1,111,781 and tops out", "hold_s": 0.7},
            {"t": b_at(15), "type": "build-on", "what": "eleven dots light along the coast and the three Kenai dots share one halo", "hold_s": 0.7},
            {"t": b_at(29), "type": "scale-pullback", "what": "the camera pulls back from the tall 0.80 bar to the full track where the Kenai hairlines sit", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.55}, {"line": 0, "offset": 3.0, "level": 1.0}, {"line": 1, "offset": 0.0, "level": 0.15},
            {"line": 2, "offset": 0.0, "level": 0.9}, {"line": 3, "offset": 0.0, "level": 0.14}, {"line": 4, "offset": 0.0, "level": 0.95},
            {"line": 5, "offset": 0.0, "level": 0.12}, {"line": 6, "offset": 0.0, "level": 0.9}, {"line": 7, "offset": 0.0, "level": 0.2},
            {"line": 8, "offset": 0.0, "level": 1.0}, {"line": 9, "offset": 0.0, "level": 0.12}, {"line": 9, "offset": 4.0, "level": 1.05},
            {"line": 10, "offset": 0.0, "level": 0.14}, {"line": 11, "offset": 0.0, "level": 1.0}, {"line": 12, "offset": 0.0, "level": 0.12},
            {"line": 12, "offset": 5.0, "level": 1.0}, {"line": 13, "offset": 0.0, "level": 0.1}, {"line": 14, "offset": 0.0, "level": 0.9},
            {"at_s": round(b_at(34) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(34) + 0.8, 3), "level": 0.55},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "build_steps": 4, "dip_at": round(b_at(34) - 0.3, 3), "riser_at": round(b_at(31), 3), "silence_at": round(b_at(34) - 0.3, 3),
                      "payoff_at": b_at(33), "button_pattern": "callback", "interrupt_at": b_at(17), "extra_dips": [b_at(33)]},
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
    book.raise_if_missing("board_1028 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1028Ids.ts").write_text(
        "// GENERATED by scripts/board_1028.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
