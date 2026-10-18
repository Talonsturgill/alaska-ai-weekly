#!/usr/bin/env python3
"""2026-10-18 "What Norm Learns": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1018.py gen       # write out/dispatch/storyboard.json (times estimated until the voice exists)
    python3 scripts/board_1018.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

Beats anchor to (vo_line, a spoken word or a fraction of the line), so the film re-times itself with the voice.
Mirrors board_1011.py's contract (idempotent, never edits the narration, only binds picture and sound to it).
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
 (1, 1, 0, 0.03, "pop", "Norm", "wobbles awake on a lamp-lit felt bench and blinks", "blank", "WHAT NORM LEARNS",
  "a blank mint jelly dome with a face wobbles awake on a mustard felt bench under a lamp and blinks, a pegboard of pressed outlines behind him",
  "the jelly wobbles and his eyes blink", ""),
 (2, 1, 0, W("boot"), "thud", "ski boot", "drops from above and presses into his belly with a squash", "startled", "A BOOT",
  "a hard grey ski boot drops from above and presses into his belly, the jelly squashing round it",
  "the dome squashes and rebounds", ""),
 (3, 1, 0, W("remembers"), "pop", "Norm", "lifts the boot away and grins at the boot-shaped dent it left", "proud", "REMEMBERS THE BOOT",
  "the boot lifts away and a boot-shaped dent stays in the jelly while Norm grins",
  "the dent glints and the jelly settles", ""),
 (4, 2, 1, W("Meet"), "whoosh", "name plate", "slides in as Norm hops to the middle of the bench", "proud", "NORM",
  "a NORM plate slides in as the jelly hops to the middle of the bench",
  "the plate bobs and Norm bows", ""),
 (5, 2, 1, W("machine"), "ping", "stand-in chip", "pops up beside Norm and a pale unset patch shows on his flank", "calm", "NORM · A STAND-IN FOR A MACHINE THAT LEARNS NORMAL",
  "a chip pops up reading NORM, A STAND-IN FOR A MACHINE THAT LEARNS NORMAL and a pale dashed unset patch shows on his flank",
  "the patch outline crawls and the jelly breathes", ""),
 (6, 2, 1, W("Press"), "thump", "the real boot", "slides in from the right and presses back into the dent", "attentive", "PRESS THE REAL BOOT BACK",
  "the real boot slides in from the right and presses back into the dent while mint ticks bloom along its edge",
  "the jelly squashes round the boot", ""),
 (8, 2, 1, W("red"), "sting", "toe corner", "glows alarm red where the boot sticks out of the dent as his brows shoot up", "alarmed", "WHERE IT DOESN'T FIT",
  "the boot's toe corner sticks out past the dent and glows alarm red while his brows shoot up",
  "the red pulses and the jelly shivers", ""),
 (9, 3, 2, 0.0, "whoosh", "symposium banner", "whips in over a stage as the bench slides away", "curious", "UA AI SYMPOSIUM · SEPTEMBER 25TH TO 27TH",
  "a banner on a stage whips in reading A I SYMPOSIUM under a date plate while Norm looks up from the foreground",
  "the banner sways and Norm tilts", ""),
 (10, 3, 2, W("symposium"), "pop", "project tiles", "pop onto the stage one after another", "plain", "THREE PROJECTS",
  "three paper tiles, a ski turn, a floor plan with a button and a pulse line, pop onto the stage one after another",
  "the tiles settle and the stage lights drift", ""),
 (12, 4, 3, W("First"), "whoosh", "skier", "carves a turn down a lilac slope at blue hour", "joyful", "FIRST · A SKI TURN",
  "a small skier in a puffy suit carves an S-turn down a blue-hour lilac slope under a rose ridge and leaves a dotted trace",
  "snow sprays and the trace draws on", ""),
 (13, 4, 3, W("Jan"), "stamp", "name plate", "stamps onto the slope", "plain", "FLOWLINE · JAN RONNER · PER ADN",
  "a plate stamps onto the slope reading FLOWLINE, JAN RONNER, PER ADN",
  "the plate bounces", "rehook: Ronner"),
 (14, 4, 3, W("FlowLine"), "pop", "phone", "slides in from the right playing a clip of the skier", "plain", "GRADES UPLOADED VIDEO · SUGGESTS DRILLS",
  "a phone slides in from the right playing a clip of the skier with three grade bars filling and a drill arrow chip popping up",
  "the clip loops and the bars fill", ""),
 (17, 5, 4, W("generic"), "thunk", "sticky note", "slaps onto Norm's belly and slides off, a bad fit", "unimpressed", "\"VERY GENERIC\" · JAN RONNER",
  "a sticky note reading GENERIC ADVICE slaps onto Norm's belly and slides off while a quote plate lands",
  "the note peels off and Norm frowns", ""),
 (18, 5, 5, W("picture"), "whoosh", "turn dent", "presses into Norm's belly as an S-curve", "proud", "ONE SKIER'S TURN",
  "a dotted S-curve from the skier's trace flies in and presses into Norm's belly as a carved dent",
  "the dent glints and the jelly settles", ""),
 (19, 5, 5, W("December"), "ping", "plate", "stamps in dashed", "plain", "LAUNCH PLANNED FOR DECEMBER",
  "a dashed plate stamps in reading LAUNCH PLANNED FOR DECEMBER",
  "the dashes crawl", ""),
 (21, 6, 6, W("presented"), "stamp", "name plate", "stamps onto a plum night kitchen with a brass button on the counter", "warm", "ANCHOR · NATHAN HEALY · PER ADN",
  "a plate stamps in reading ANCHOR, NATHAN HEALY, PER ADN over a plum night kitchen where a brass button sits on the counter by an amber window",
  "the window light drifts and the button gleams", "plant: will it ever fire for a real household"),
 (25, 7, 7, W("Motion"), "pulse", "sensor pucks", "pulse rings around a top-down plan of a small home", "attentive", "MOTION SENSORS + ONE BUTTON",
  "the view drops to a top-down plan of the home as sensor pucks pulse rings and the one brass button sits on its table",
  "the rings expand and the button gleams", "rehook: motion sensors and one button"),
 (26, 7, 7, W("routines"), "swoosh", "mint band", "draws along the usual path as a navy day-trace follows it", "attentive", "LEARNS A SENIOR'S ROUTINES",
  "a mint band draws along the usual path through the rooms and a navy day-trace follows it",
  "the band edge glints", ""),
 (27, 7, 7, W("alert"), "buzz", "trace", "drifts off the band and turns alarm red as a phone buzzes", "alarmed", "DESIGNED TO ALERT FAMILY",
  "today's trace drifts off the band and across the threshold line in alarm red while a phone marked FAMILY buzzes in the corner",
  "the phone shakes and the red pulses", ""),
 (28, 8, 8, W("Higher"), "whoosh", "Norm", "hops onto the second step of a felt staircase and swells", "determined", "HIGHER STAKES",
  "Norm hops onto the second step of a felt staircase, swelling, his brows set",
  "the jelly squashes on landing", "rehook: higher stakes"),
 (29, 8, 8, W("each"), "clunk", "staircase", "lights its three steps, SKI TURN, A HOME, A PIPELINE", "serious", "HIGHER STAKES",
  "the staircase lights three steps in turn, SKI TURN, A HOME, A PIPELINE, and Norm hops to the top",
  "the steps glow and Norm wobbles", ""),
 (30, 9, 9, W("Third"), "whoosh", "compressor", "runs, its flywheel spinning, in a blue-hour yard", "curious", "THIRD · A MACHINE",
  "a compressor skid runs in a blue-hour yard, its flywheel spinning and pistons pumping",
  "the flywheel turns and the pistons pump", ""),
 (31, 9, 9, W("Aaron"), "stamp", "name plate", "stamps onto the yard", "plain", "AARON SMITH · DIGITAL TWINS OF COMPRESSORS · PER ADN",
  "a plate stamps in reading AARON SMITH, DIGITAL TWINS OF COMPRESSORS, PER ADN",
  "the plate bounces", ""),
 (32, 9, 9, W("twins"), "shimmer", "dashed twin", "slides onto the compressor and then stands beside it", "curious", "A VIRTUAL COPY OF REAL EQUIPMENT",
  "a dashed cream wireframe twin of the compressor slides onto it with a scan line and then stands beside it",
  "the scan line sweeps and the dashes crawl", ""),
 (33, 10, 10, W("calls"), "rumble", "pipeline", "snakes away across the lilac tundra from the compressor", "plain", "A PROPOSED GAS PIPELINE",
  "a fat pipeline snakes away across the lilac tundra from the compressor under a rose horizon",
  "the pipe draws on", ""),
 (34, 10, 10, W("heartbeat"), "thump", "heartbeat line", "draws across the pipe and pulses", "intense", "\"THE HEARTBEAT OF THAT PIPELINE\" · AARON SMITH",
  "an alarm-pink heartbeat line draws across the pipe and pulses under a quote plate",
  "the blip travels along the line", ""),
 (36, 10, 10, W("billion"), "boom", "price tag", "drops onto a signpost beside the pipeline and swings", "strained", "ESTIMATED OVER $54 BILLION · PER ADN",
  "a heavy price tag drops onto a signpost beside the pipeline reading ESTIMATED OVER $54 BILLION, PER ADN, and swings while Norm sweats",
  "the tag swings and Norm sweats", ""),
 (37, 11, 11, W("Do"), "swoosh", "Norm", "wobbles unset under a hard lamp on a plain paper set", "worried", "DO THEY WORK YET?",
  "Norm wobbles under a hard overhead lamp on a plain cream paper set with his pale unset patch showing and a clipboard sliding in",
  "the lamp sways and the jelly wobbles", "rehook: do they work yet"),
 (39, 11, 11, W("users"), "stamp", "stamp row", "stamps NO USERS REPORTED on the clipboard", "plain", "NO USERS REPORTED",
  "a navy stamp lands on the clipboard row NO USERS REPORTED under ONE STORY",
  "the stamp rings", ""),
 (40, 11, 11, W("accuracy"), "stamp", "stamp row", "stamps NO ACCURACY FIGURES on the clipboard", "plain", "NO ACCURACY FIGURES",
  "a navy stamp lands on the clipboard row NO ACCURACY FIGURES",
  "the stamp rings", ""),
 (41, 11, 11, W("pilots"), "stamp", "stamp row", "stamps NO PILOTS on the clipboard", "plain", "NO PILOTS REPORTED",
  "a navy stamp lands on the clipboard row NO PILOTS",
  "the stamp rings and Norm looks over", "pay: will it fire for a real household"),
 (43, 12, 12, W("December"), "slide", "proof card", "slides in with an empty tick box", "hopeful", "WHAT WOULD COUNT AS PROOF",
  "the first of three paper proof cards slides in reading DECEMBER START THAT HOLDS with an empty dashed tick box under a heading WHAT WOULD COUNT AS PROOF",
  "the card bobs and the box dashes crawl", ""),
 (44, 12, 12, W("household"), "slide", "proof card", "slides in with an empty tick box", "hopeful", "A FIRST HOUSEHOLD FOR ANCHOR",
  "the second proof card slides in reading A FIRST HOUSEHOLD FOR ANCHOR with an empty dashed tick box",
  "the card bobs", ""),
 (45, 12, 12, W("twin"), "slide", "proof card", "slides in with an empty tick box", "hopeful", "A TWIN CHECKED AGAINST A REAL COMPRESSOR",
  "the third proof card slides in reading A TWIN CHECKED AGAINST A REAL COMPRESSOR with an empty dashed tick box",
  "the card bobs and Norm leans in", ""),
 (49, 13, 13, W("press"), "thump", "boot", "lowers toward blank Norm who looks straight at the camera", "curious", "WHAT WOULD YOU PRESS NORM AGAINST FIRST?",
  "a boot lowers on its cord toward a blank soft Norm who looks straight at the camera with his unset patch pale on his flank",
  "the boot sways and Norm blinks", "pay: the open question"),
 (7, 2, 1, W("anywhere"), "snap", "the real boot", "tilts and sticks its toe out of the dent", "uneasy", "WHERE IT DOESN'T FIT",
  "the real boot tilts and its toe sticks out of the dent edge",
  "the boot rocks and the jelly tightens", ""),
 (11, 3, 2, W("particular"), "click", "dotted strings", "pull from each tile toward Norm", "curious", "ONE PARTICULAR THING",
  "dotted strings pull from each of the three tiles toward Norm in the foreground",
  "the strings sway and Norm tilts", ""),
 (15, 4, 3, W("grades"), "tick", "grade bars", "fill on the phone as the clip plays", "plain", "GRADES UPLOADED VIDEO",
  "three grade bars fill on the phone while the clip of the skier plays",
  "the bars fill and the clip loops", ""),
 (16, 4, 3, W("drills"), "snap", "drill chip", "slides up on the phone", "plain", "SUGGESTS DRILLS",
  "a drill arrow chip slides up on the phone",
  "the chip bobs", ""),
 (20, 5, 5, W("Ronner"), "pop", "skier icon", "slides toward the dent on Norm's belly", "plain", "RONNER",
  "a small skier icon slides toward the dent on Norm's belly",
  "the icon bobs and Norm watches", ""),
 (22, 6, 6, W("independent"), "ping", "window", "brightens as steam rises from the kettle", "warm", "OLDER ALASKANS STAY INDEPENDENT",
  "the amber window brightens as steam rises from the kettle on the counter",
  "the steam curls and the window glows", ""),
 (50, 9, 9, W("compressors"), "clank", "pistons", "pump faster as an arrow points at the twin", "curious", "MODEL COMPRESSORS",
  "the pistons pump faster as a fat arrow points from the compressor to its dashed twin",
  "the pistons pump and the dashes crawl", ""),
 (51, 10, 10, W("Daily"), "creak", "price tag", "descends on its string from above", "uneasy", "PER ADN",
  "a heavy price tag descends on its string from above toward a signpost beside the pipeline",
  "the tag swings on its string", ""),
 (38, 11, 11, W("story"), "paper", "clipboard", "slides in from the right with ONE STORY at the top", "plain", "ONE STORY",
  "a clipboard slides in from the right with ONE STORY written at the top",
  "the clip rocks", ""),
 (54, 13, 13, 0.0, "creak", "boot", "descends on its cord into frame above blank Norm", "curious", "SO WHAT WOULD YOU PRESS",
  "a boot on a cord descends into frame above blank soft Norm",
  "the cord sways and Norm looks up", ""),
 (55, 5, 4, W("Online"), "creak", "sticky note", "descends from above toward Norm's belly", "uneasy", "ADVICE ONLINE",
  "a sticky note reading GENERIC ADVICE descends from above toward Norm's belly",
  "the note swings", ""),
 (56, 6, 6, W("Second"), "whoosh", "kitchen", "slides in with its amber window as the kettle steams", "warm", "SECOND · A KITCHEN",
  "a plum night kitchen slides in with an amber window and a steaming kettle",
  "the steam curls and the window glows", ""),
 (57, 12, 12, W("showcase"), "paper", "banner", "drops in over the stage lights reading SHOWCASE PROJECTS, EARLY IS FAIR", "calm", "SHOWCASE PROJECTS · EARLY IS FAIR",
  "a banner drops in reading SHOWCASE PROJECTS, EARLY IS FAIR while Norm tilts his head",
  "the banner swings", ""),
 (58, 6, 6, W("older"), "swoosh", "ring", "rolls out from the button across the counter", "warm", "BUILT FOR OLDER ALASKANS",
  "a ring rolls out from the brass button across the counter as the amber window brightens",
  "the ring fades and the kettle steams", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "eye", "workbench", "macro-closeup", "single-object-void", "vertical-descent", "single-organic-hero", "", "",
  "A boot presses a blob", "A blank mint jelly dome with a face wobbles on a felt bench as a ski boot drops and presses a boot-shaped dent into him."),
 (2, 1, "two-up", "close", "high", "workbench", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "match-action", "match",
  "The real boot goes back", "Norm hops to the middle, the real boot slides back into the dent and its toe sticks out and glows red."),
 (3, 2, "wide-establish", "wide", "low", "symposium-stage", "eye-level-immersive", "grid-modular", "assemble-build", "structure-as-subject", "whip-pan", "travel",
  "Three projects", "A stage banner whips in and three paper tiles pop onto it: a ski turn, a home plan, a pulse line."),
 (4, 3, "alt-vantage", "medium", "ground", "ski-slope", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "single-organic-hero", "hard-cut", "carry",
  "A ski turn", "A skier carves a turn at blue hour and a phone slides in playing the clip with grade bars and a drill arrow."),
 (5, 4, "macro-closeup", "close", "high", "workbench", "macro-closeup", "single-object-void", "push-in-only", "single-organic-hero", "match-cut", "match",
  "Generic, then one skier's turn", "A sticky note slides off Norm's belly and a carved S-turn dent presses in."),
 (6, 6, "push-detail", "medium", "low", "night-kitchen", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "structure-as-subject", "whip-pan", "travel",
  "A kitchen and a button", "A plum night kitchen with an amber window and one brass button on the counter."),
 (7, 7, "map-territory", "medium", "overhead", "home-plan", "top-down-map", "map-territory", "radial-emanate", "structure-as-subject", "fui-boot", "build",
  "Sensors, a band and a trace", "A top-down home plan where sensors pulse, a mint band draws and a trace drifts off it in red."),
 (8, 8, "subject-portrait", "close", "low", "felt-stairs", "eye-level-immersive", "centered-hero-lowerthird", "vertical-rise", "single-organic-hero", "hard-cut", "carry",
  "Higher stakes", "Norm hops up a felt staircase of three lit steps, SKI TURN, A HOME, A PIPELINE."),
 (9, 9, "two-up", "wide", "eye", "compressor-yard", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "whip-pan", "travel",
  "A compressor and its twin", "A compressor runs in a blue-hour yard while a dashed twin slides onto it and stands beside it."),
 (10, 10, "wide-establish", "extreme-wide", "high", "pipeline-tundra", "orbital-aerial", "stacked-layers", "scroll-data", "data-as-subject", "carried-element", "carry",
  "The pipeline and the price", "A pipeline snakes across the tundra, a heartbeat line pulses and a heavy price tag drops on Norm."),
 (11, 11, "subject-portrait", "medium", "eye", "paper-set", "eye-level-immersive", "single-object-void", "push-in-only", "instrument-as-subject", "mask-wipe", "build",
  "The test", "Norm wobbles unset under a hard lamp as a clipboard collects stamps: one story, no users, no accuracy figures, no pilots."),
 (12, 12, "data-panel", "close", "eye", "paper-set-cards", "instrument-screen", "grid-modular", "horizontal-traverse", "data-as-subject", "focus-pull", "match",
  "What would count as proof", "Three paper proof cards slide in with empty tick boxes."),
 (13, 13, "macro-closeup", "insert", "high", "workbench", "macro-closeup", "single-object-void", "push-in-only", "single-organic-hero", "carried-element", "carry",
  "What would you press", "Three objects, a boot, a brass button and a compressor, lower on cords toward a blank soft Norm with a pale unset patch."),
]

AMBIENT = {
 1: "the jelly wobbles, the lamp light drifts, dust motes float, the pegboard outlines sway",
 2: "the jelly breathes, the patch outline crawls, the lamp drifts, the toe red pulses",
 3: "stage lights drift, tiles bob, Norm tilts, dust motes float",
 4: "snow sprays, the ridge drifts, the clip loops, the trace draws on",
 5: "the note peels, the dent glints, the lamp drifts, the jelly wobbles",
 6: "the window light drifts, the button gleams, dust motes float, Norm breathes",
 7: "sensor rings expand, the band edge glints, the button gleams, the phone shakes",
 8: "the steps glow, Norm wobbles, dust floats, the felt breathes",
 9: "the flywheel turns, pistons pump, the dashes crawl, snow drifts",
 10: "the pipe draws on, the heartbeat blip travels, the tag swings, Norm sweats",
 11: "the lamp sways, Norm wobbles, the patch outline crawls, stamps ring",
 12: "cards bob, tick boxes dash, Norm leans, dust floats",
 13: "the objects sway on their cords, Norm blinks, the patch outline crawls, the lamp drifts",
}
CENTER = {1: "Norm at x540 y1000", 2: "Norm and the boot at x540 y1000", 3: "the banner at x540 y800", 4: "the skier at x400 y1000", 5: "Norm at x540 y1000", 6: "the button at x540 y1000", 7: "the plan at x540 y900",
          8: "Norm on the stairs at x540 y1000", 9: "the compressor at x540 y1000", 10: "the pipeline and Norm at x540 y1000", 11: "Norm and the clipboard at x540 y1000", 12: "the cards at x640 y900", 13: "Norm at x540 y1100"}
HERO = {
 1: ("Norm + SkiBoot", "60% Norm, 30% boot, 10% bench"),
 2: ("Norm + SkiBoot", "55% Norm, 35% boot, 10% red glow"),
 3: ("SymposiumStage", "60% banner and tiles, 25% stage, 15% Norm"),
 4: ("Skier + PhoneApp", "50% slope and skier, 35% phone, 15% Norm cameo"),
 5: ("Norm + sticky note", "70% Norm, 20% note, 10% bench"),
 6: ("Night kitchen + AnchorButton", "50% room, 30% button, 20% window"),
 7: ("FloorPlan", "70% plan, 20% trace and band, 10% phone"),
 8: ("Norm + staircase", "55% Norm, 35% steps, 10% labels"),
 9: ("Compressor + twin", "55% compressor, 30% twin, 15% Norm cameo"),
 10: ("Pipeline + price tag + Norm", "45% pipeline, 30% Norm and tag, 25% heartbeat line"),
 11: ("Clipboard + Norm", "45% clipboard, 40% Norm, 15% lamp"),
 12: ("ProofCards", "70% cards, 20% Norm, 10% lamp"),
 13: ("Norm + three hanging objects", "50% Norm, 40% objects, 10% bench"),
}
PARTS = {1: 48, 2: 52, 3: 56, 4: 60, 5: 46, 6: 50, 7: 58, 8: 44, 9: 60, 10: 56, 11: 50, 12: 40, 13: 46}
STAGE3D = {k: "planes" for k in range(1, 14)}
STAGE3D[1] = "flat:a locked macro of the bench where the boot press and the wobble are the motion"
STAGE3D[5] = "flat:a locked macro where the note and the dent are the motion"
STAGE3D[7] = "flat:a locked top-down plan where the rings, band and trace are the motion"
STAGE3D[12] = "flat:a locked card table where the sliding cards are the motion"
STAGE3D[13] = "flat:a locked macro where the lowering objects are the motion"
CAMERA = {1: "static:the boot press is the whole shot", 2: "dollyThrough", 3: "craneDown", 4: "truckAcross", 5: "static:the note and the dent are the shot", 6: "truckAcross", 7: "static:the plan and its trace are the shot",
          8: "riseWith", 9: "truckAcross", 10: "craneDown", 11: "dollyThrough", 12: "static:the cards sliding in are the shot", 13: "static:the lowering objects are the shot"}


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
        assert sh == shot, (bid, sh, shot)
        a = round(at(line, anc), 3)
        beats.append({
            "id": bid, "shot": sh, "at_s": a, "vo_line": line,
            "anchor": {"vo_line": line, "fraction": anc if not isinstance(anc, tuple) else 0.0, "offset": round(a - starts[line], 3)},
            "offset": round(a - starts[line], 3), "vo": LINES[line], "phrase": _phrase(line, anc),
            "shows": shows, "sfx": sfx, "means": ann.lower(), "rehook": rehook if rehook.startswith("rehook") else "",
            "draw": {"subject": subj, "action": act, "emotion": emo, "annotation": ann},
            "choreo": {"primary": shows, "reaction": reaction, "ambient": AMBIENT[S[sh - 1][0]]},
        })
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

    palette = "warm lamp-lit mustard felt, glowing rose alpenglow, lilac snow, plum window, mint jelly, signal red"
    board = {
        "run_date": "2026-10-18", "slug": "what-norm-learns", "title": "What Norm Learns",
        "concept": ("Three University of Alaska AI projects shown at a statewide symposium and reported by the Anchorage Daily News (a ski-video coach, a senior-routine sensor, a compressor digital twin) share one move: learn what is normal "
                    "for one particular thing and compare the real thing to it. The film draws that move as Norm, a mint jelly that keeps the dent of whatever is pressed into him and glows red where the real thing does not fit, "
                    "climbs a staircase of rising stakes, then gives the honest test a full scene: one outlet, no users, no accuracy figures, no pilots, and three things that would count as proof. Norm is a labelled metaphor."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "horizontal-traverse", "hero_treatment": "single-organic-hero", "layout": "single-object-void",
                        "register": "tactile-collage", "palette": palette, "camera_strategy": "slow-push-on-held-worlds", "light_story": "a warm lamp pool on a golden mustard felt bench, rose alpenglow over lilac snow, a cozy amber-windowed kitchen, a plain paper test set",
                        "metaphor": "a soft jelly that keeps the dent of whatever is pressed into it and glows red where the real thing does not fit"},
        "palette": palette,
        "divergence_note": ("10-17 was a bright frost noon with cyan, hazard orange and banknote green around a tall glass gauge. 10-16 a black-spruce night with tungsten and chalk. This film is a blue-hour lilac and rose world "
                            "with a mustard felt workbench, a mint jelly hero and alarm red, moving through a bench, a symposium stage, a ski slope, a night kitchen, a top-down home plan, a felt staircase, a compressor yard, a pipeline, "
                            "a paper test set and a ski slope."),
        "treatment": {"winner": "The Explainer's Norm (press, remember, press back, red where it doesn't fit), with the Dramatist's rising-stakes ladder and empty proof boxes, the Comedian's generic-advice sticky note and the Enthusiast's 2019 lineage button.",
                      "why": "One physical idea makes three unlike projects legible in a glance, the honest test gets its own paper set, and the unset patch plants a question the last shot pays."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A blank mint jelly dome with a face wobbles awake on a felt bench and a hard ski boot drops and presses into his belly.",
                 "headline": "WHAT NORM LEARNS", "motion_by_s": 0.3,
                 "loopback": "The last frame is Norm blank on the bench again with a boot hovering above him, the open replaying as a question."},
        "open_loop": {"plant_t": b_at(5), "pay_t": b_at(49), "what": "The pale unset patch on Norm's flank. Paid as the open question: what would you press him against first, since nothing is reported proven."},
        "open_loop_2": {"plant_t": b_at(22), "pay_t": b_at(41), "what": "Whether ANCHOR's alert has ever fired for a real household. Planted as a question mark over the button, paid as the clipboard: no pilots reported."},
        "throughline": {"object": "Norm", "lands_in_button": "blank soft Norm looking straight at the camera with the boot hovering and his unset patch pale",
                        "states": [
                            {"at_s": b_at(1), "state": "blank and wobbling on the bench"},
                            {"at_s": b_at(3), "state": "boot-dented and grinning"},
                            {"at_s": b_at(5), "state": "calm with a pale unset patch on his flank"},
                            {"at_s": b_at(18), "state": "ski-turn dented and proud"},
                            {"at_s": b_at(28), "state": "swollen on the second step of the staircase"},
                            {"at_s": b_at(36), "state": "sweating beside the signpost with the 54 billion tag"},
                            {"at_s": b_at(37), "state": "unset and wobbling under the hard lamp"},
                            {"at_s": b_at(43), "state": "leaning in beside three empty proof boxes"},
                            {"at_s": b_at(49), "state": "blank and soft again, looking at the camera"}]},
        "reveals": [
            {"t": b_at(10), "type": "build-on", "what": "three paper tiles pop onto the symposium stage", "hold_s": 0.6},
            {"t": b_at(26), "type": "morph-to-chart", "what": "a mint band of the usual path draws through the home plan and a day-trace follows", "hold_s": 0.6},
            {"t": b_at(36), "type": "scale-pullback", "what": "the view pulls back over the whole pipeline as the price tag drops on its signpost", "hold_s": 0.7}],
        "tail_s": 1.7, "audio_arc": {"build_steps": 4, "dip_at": round(b_at(49) - 0.9, 3), "riser_at": round(b_at(45), 3), "silence_at": round(b_at(49) - 0.2, 3),
                      "payoff_at": b_at(49), "button_pattern": "question", "interrupt_at": b_at(8), "extra_dips": [b_at(36), b_at(41)]},
        "shots": shots, "beats": beats,
    }
    order = sorted(board["beats"], key=lambda b: (b["at_s"], b["id"]))
    ids = {b["id"]: rank for rank, b in enumerate(order, 1)}
    for b in board["beats"]:
        b["key"] = b["id"]
        b["id"] = ids[b["key"]]
    board["beats"].sort(key=lambda b: b["id"])
    board["_ids"] = ids
    book.raise_if_missing("board_1018 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1018Ids.ts").write_text(
        "// GENERATED by scripts/board_1018.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
