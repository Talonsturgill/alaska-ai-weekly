#!/usr/bin/env python3
"""2026-10-17 "Ten Billion, How Many Megawatts": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1017.py gen       # write out/dispatch/storyboard.json (times estimated until the voice exists)
    python3 scripts/board_1017.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.09, "thud", "CashBlock", "hops in and lands on its mark against a wooden megawatt height chart with a squash and an eager grin", "eager", "10 BILLION",
  "a banknote-green CashBlock with an eager face hops onto its mark in front of a wooden height chart marked in MW and lands with a squash",
  "the chart creaks and the block's grin settles", ""),
 (2, 1, 0, W("megawatts"), "pop", "pencil", "slides in and hovers at the block's head, the reading line left blank", "puzzled", "HOW MANY MEGAWATTS?",
  "a pencil slides in over the chart and hovers level with the block's head while the ReserveBar beside the chart blinks awake and the reading stays blank",
  "the pencil wobbles and the bar blinks", ""),
 (3, 2, 1, 0.0, "whoosh", "hall front", "slides in with a date chip as the CashBlock hops down in front of the door", "brisk", "BURGUM · FAIRBANKS CHAMBER · OCTOBER 14TH",
  "a snow-banked hall front slides in with a date chip and the CashBlock hops down in front of its door",
  "snow dust drifts and the block bobs", ""),
 (31, 2, 1, W("Secretary"), "swoosh", "banner chip", "whips across the top of the hall front", "brisk", "INTERIOR SECRETARY BURGUM",
  "a banner chip whips across the top of the hall front reading INTERIOR SECRETARY BURGUM and a brass plaque on the door reads BURGUM",
  "the banner flutters and the block bobs", ""),
 (39, 2, 1, W("crowd"), "creak", "chamber crowd", "unfaced snow-suited figures lean in toward the door", "attentive", "A FAIRBANKS CHAMBER CROWD",
  "a row of small snow-suited silhouettes in the foreground lean in toward the door as the ReserveBar peeks up among them",
  "the figures shift their weight", ""),
 (4, 2, 1, W("knocking"), "thump", "CashBlock", "knocks on the door three times with a squash on each knock", "eager", "BURGUM SAID",
  "the CashBlock knocks on the brass-plaqued door three times, squashing on each knock, under a BURGUM SAID plate",
  "the door shivers and the crowd leans with each knock", ""),
 (33, 2, 1, W("center"), "thunk", "data center box", "the tower folds into a squat windowless hall with a sign inside a dashed thought bubble", "plain", "A DATA CENTER",
  "the brick tower folds down inside a dashed thought bubble into a squat windowless hall with a sign reading A DATA CENTER",
  "the sign swings and the hall hums", ""),
 (5, 2, 1, W("breaks"), "snap", "tag", "swings from the block's handle", "eager", "NO TAX BREAKS",
  "a NO TAX BREAKS tag swings from the block's handle",
  "the tag swings", ""),
 (6, 3, 2, 0.0, "whoosh", "lightning bolt", "drops into a funnel machine whose gears spin up", "charged", "ELECTRICITY IN",
  "a lightning bolt drops into the mouth of a brass funnel machine and the gears spin up",
  "the gears turn and sparks jump off the funnel rim", ""),
 (7, 3, 2, W("intelligence"), "pop", "brain", "pops out of the spout", "delighted", "\"YOU CONVERT ELECTRICITY INTO INTELLIGENCE, YOU MAKE MONEY\" · BURGUM",
  "a brain pops out of the machine's spout under a quote plate attributed to Burgum",
  "the brain bobs", "rehook: the brain"),
 (50, 3, 2, W("money"), "clink", "coins", "spill out of the spout after the brain", "delighted", "MONEY",
  "coins spill out of the spout and bounce along the floor",
  "the coins bounce and settle", ""),
 (8, 4, 3, 0.0, "thump", "remote", "drops from above onto a table and bounces", "attentive", "AT THAT EVENT",
  "a big horizontal remote drops from above onto a table and bounces, a small tent card standing beside it",
  "the remote rocks and settles", ""),
 (34, 4, 3, W("candidate"), "paper", "tent card", "flips open to its full line", "attentive", "KREISS-TOMKINS · DEMOCRATIC CANDIDATE FOR GOVERNOR",
  "the tent card flips open to read KREISS-TOMKINS, DEMOCRATIC CANDIDATE FOR GOVERNOR",
  "the card swings and settles", ""),
 (35, 4, 3, W("audience"), "creak", "ReserveBar", "in the foreground turns to look up at the remote", "attentive", "IN THE AUDIENCE",
  "the ReserveBar in the foreground turns to look up at the remote from the audience",
  "the bar blinks and tilts its head", ""),
 (9, 4, 3, W("pause"), "clunk", "pause button", "presses down and glows", "firm", "KREISS-TOMKINS · \"I THINK WE SHOULD PAUSE\"",
  "the remote's pause button presses down and glows brass beside a quote plate",
  "the button glows and the remote rocks", ""),
 (10, 5, 4, 0.0, "whoosh", "rewind button", "presses and a brass date drum starts to roll backwards", "curious", "TWO DAYS EARLIER",
  "the remote's pause button pops up and the rewind button presses as a brass date drum on the wall starts to roll backwards",
  "the drum whirs and the remote rocks", "rehook: pause for what?"),
 (48, 5, 4, W("Monday"), "ping", "date drum", "lands on the 12th with a hazard-orange ring", "pointed", "MONDAY OCTOBER 12TH",
  "the drum clicks to rest on 12 and a hazard-orange ring draws round it",
  "the ring wobbles", ""),
 (11, 5, 4, W("Golden"), "stamp", "alert lamp", "lights hazard orange on a switchbox", "uneasy", "GOLDEN VALLEY ELECTRIC · LEVEL 2 ALERT",
  "a hazard-orange lamp lights on a switchbox beside the drum",
  "the lamp pulses", ""),
 (12, 5, 4, W("first"), "thunk", "switchbox lid", "opens to show a 1 sticker as a stamp lands", "firm", "FIRST UNDER A NEW ALERT SYSTEM",
  "the switchbox lid flips open to show a 1 sticker as a stamp lands: FIRST UNDER A NEW ALERT SYSTEM",
  "the stamp bounces and the lamp pulses", ""),
 (13, 6, 5, 0.0, "whoosh", "ReserveBar", "rises in a navy cutaway with a spare tire hung beside it", "calm", "THE RESERVE",
  "the ReserveBar rises in a navy cutaway with a spare tire hung on a hook beside it and the fluid sloshing",
  "the fluid waves and the tire sways", ""),
 (41, 6, 5, W("everyone's"), "pop", "house icons", "light up beside the tube", "plain", "IN USE",
  "small house icons light up beside the tube under an IN USE chip",
  "the windows twinkle", ""),
 (14, 6, 5, W("room"), "snap", "bracket", "opens up the tube marking spare room", "explaining", "THE RESERVE · SPARE ROOM",
  "a chalk bracket opens up the tube marking SPARE ROOM",
  "the bracket dashes crawl and the fluid glints", ""),
 (52, 6, 5, W("Level"), "snap", "LEVEL 2 line", "draws across the tube in hazard orange as the bar's lamp lights", "uneasy", "LEVEL 2",
  "the orange LEVEL 2 line draws across the tube and the bar's lamp lights while the fluid holds still",
  "the line's dashes crawl and the bar looks at it", ""),
 (15, 6, 5, W("fifteen"), "creak", "fluid", "slumps with overshoot below the orange LEVEL 2 line", "alarmed", "LEVEL 2 · RESERVE UNDER 15 MW",
  "the orange LEVEL 2 line draws across the tube and the fluid slumps with overshoot below it while the bar sweats",
  "a sweat bead slides down the glass", ""),
 (16, 7, 6, 0.0, "rumble", "plant stacks", "three steam stacks rise out of the snow", "plain", "THREE UNITS",
  "three generator stacks rise out of the snow with steam curling off them and a sweating ReserveBar in the foreground",
  "the steam curls and the snow drifts", ""),
 (17, 7, 6, W("offline"), "clunk", "left stack", "goes dark with an orange lamp", "grim", "1 UNIT OFFLINE",
  "the left stack's steam stops and its lamp goes orange",
  "the dark stack ticks as it cools", "rehook: one unit offline"),
 (36, 7, 6, W("maintenance"), "clink", "hard hats", "drop onto the two other stacks", "plain", "2 IN MAINTENANCE",
  "hard hats drop onto the two other stacks with a clink each under a 2 IN MAINTENANCE chip",
  "the hats wobble and settle", ""),
 (53, 7, 6, W("Spokesperson"), "thunk", "stamp", "lands over the dark stack", "firm", "THE REPORTS TIE THE ALERT TO A UNIT, NOT A DATA CENTER",
  "a stamp lands across the dark stack: THE REPORTS TIE THE ALERT TO A UNIT, NOT A DATA CENTER",
  "the stamp rings and the stack ticks", ""),
 (54, 7, 6, W("generation"), "clank", "wrench and stack", "icon turns over the stacks", "plain", "GENERATION",
  "a wrench-and-stack icon turns over the three stacks",
  "the wrench turns", ""),
 (18, 7, 6, W("quick"), "stamp", "quote plate", "stamps in beside the bar", "grim", "\"NOT GOING TO BE A QUICK FIX\" · GVEA'S ASHLEY BRADISH",
  "a quote plate stamps in beside the sweating bar",
  "the plate bounces and the bar shivers", ""),
 (19, 8, 7, 0.0, "fold", "postcard", "unfolds on a hinge into a street of small houses with porch lights", "hopeful", "THE BEST CASE FOR YES",
  "a postcard unfolds on a hinge into a street of small houses whose porch lights wink on",
  "the porch lights flicker and the card edges curl", "rehook: the best case for yes"),
 (37, 8, 7, W("Dakota"), "pop", "map chip", "pops up over the street", "plain", "ELLENDALE, NORTH DAKOTA",
  "an ELLENDALE, NORTH DAKOTA chip pops up over the street",
  "the chip bobs", ""),
 (20, 8, 7, W("rebates"), "clink", "rebate check", "flutters down and lands on a roof", "warm", "BILL REBATES",
  "a rebate check flutters down and lands on a roof",
  "the check rocks on the shingles", ""),
 (55, 8, 7, W("K"), "stamp", "source chip", "stamps on the street", "plain", "PER KTUU",
  "a PER KTUU source chip stamps onto the street",
  "the chip bounces", ""),
 (21, 9, 8, 0.0, "slide", "plug", "a plug on its own power cord slides in from the side", "hopeful", "IF IT BROUGHT ITS OWN POWER?",
  "a plug on its own long cord slides in from the side toward the bar in the cutaway",
  "the cord swings and the bar tips its head", ""),
 (38, 9, 8, W("leave"), "swoosh", "reserve mark", "rises on the bar's tube as the fluid climbs", "hopeful", "MORE RESERVE, NOT LESS",
  "the fluid climbs the tube and a mark rises with it reading MORE RESERVE, NOT LESS, as a question",
  "the fluid sloshes and the bar beams", ""),
 (22, 9, 8, W("But"), "hush", "question mark", "stamps onto the plug's tag and the bar holds its height, unsure", "uncertain", "THE REPORTS DON'T SAY",
  "a question mark stamps onto the plug's tag and the bar holds its height, eyes sliding sideways",
  "the tag swings and the bar blinks", "rehook: but the reports don't say"),
 (23, 10, 9, 0.0, "clunk", "play button", "presses down and the pause button pops up", "relieved", "\"AND THEN, IN A THOUGHTFUL WAY, DEVELOPMENT CAN PROCEED\" · KREISS-TOMKINS",
  "the remote's play button presses down and the pause button pops up beside a quote plate",
  "the button glows and the bar in the foreground glances up", ""),
 (58, 10, 9, W("thoughtful"), "ping", "lamp", "glows over the remote", "relieved", "THOUGHTFUL",
  "a small lamp glows over the remote",
  "the lamp sways", ""),
 (45, 10, 9, W("development"), "chime", "play triangle", "rolls forward across the table", "hopeful", "PROCEED",
  "the play triangle rolls forward across the table toward the camera",
  "the triangle pulses", ""),
 (24, 11, 10, 0.0, "stamp", "ledger slip", "HOMES stamps down ending in MW?", "firm", "EVERY TERM OF YES",
  "the ledger slip HOMES stamps down ending in MW? and a mini ReserveBar sits unlit in the readout's bezel",
  "the slip bounces and settles", ""),
 (59, 11, 10, W("term"), "stamp", "ledger slip", "REBATES stamps down ending in MW?", "firm", "A MEGAWATT QUESTION",
  "the ledger slip REBATES stamps down ending in MW?",
  "the slip bounces", ""),
 (46, 11, 10, W("megawatt"), "snap", "ledger slip", "WHO BUILDS THE POWER stamps down ending in MW?", "firm", "MW?",
  "the ledger slip WHO BUILDS THE POWER stamps down ending in MW?",
  "the slip bounces", ""),
 (25, 11, 10, W("reports"), "boom", "stamp", "slams in hazard orange across the blank readout", "grim", "THE REPORTS NAME NO MEGAWATTS FOR THE 10 BILLION",
  "an orange stamp slams across the blank MW readout: THE REPORTS NAME NO MEGAWATTS FOR THE 10 BILLION",
  "the stamp rings and the readout flickers", ""),
 (26, 12, 11, 0.0, "whoosh", "funnel machine", "rolls back in with a plug where the lightning bolt entered", "thoughtful", "OUR READ",
  "the funnel machine rolls back in, a power plug where the bolt entered and OUR READ on a tag",
  "the gears turn slowly and the plug sways", "rehook: our read"),
 (47, 12, 11, W("AI"), "creak", "AI tag", "flips on the funnel machine", "plain", "AI",
  "a small AI tag flips onto the funnel machine's rim",
  "the tag swings", ""),
 (27, 12, 11, W("power"), "clunk", "plug", "slots into the machine's input and the bar nods", "firm", "A POWER QUESTION FIRST",
  "the plug slots into the machine's input and the bar nods beside it",
  "the bar blinks and the gears spin up", ""),
 (28, 13, 12, 0.0, "thud", "CashBlock", "hops back onto its mark against the height chart", "eager", "10 BILLION",
  "the CashBlock hops back onto its mark against the height chart and lands with a squash, the pencil hovering at its head",
  "the chart creaks and the block's grin settles", ""),
 (61, 13, 12, W("many"), "tick", "pencil line", "swings in and snaps a dashed line across the chart as a ? MW label flips up", "puzzled", "? MW",
  "the pencil swings in and snaps a dashed line across the chart level with the block's head as a ? MW label flips up beside it",
  "the pencil wobbles", ""),
 (29, 13, 12, W("Name"), "bell", "dashed block", "hovers above the CashBlock waiting for a number", "hopeful", "NAME THE MEGAWATTS",
  "a dashed ghost block marked ? MW hovers above the CashBlock waiting for its number",
  "the dashes crawl and the pencil hovers", ""),
 (30, 13, 12, W("read"), "ping", "ReserveBar", "turns to look straight at the camera and the open replays", "warm", "10 BILLION · ? MW",
  "the ReserveBar beside the chart turns to look straight at the camera while the pencil hovers over the blank line, the opening image replaying",
  "the bar smiles", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "two-up", "medium", "eye", "height-chart-room", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "", "",
  "Dollars against a megawatt chart", "A CashBlock stands against a wooden height chart marked in megawatts while a pencil hovers with no reading and the ReserveBar blinks beside it."),
 (2, 1, "wide-establish", "wide", "eye", "snow-street", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "single-organic-hero", "hard-cut", "carry",
  "A knock", "A snowy hall front where the CashBlock knocks on a plaqued door under a Burgum plate and ten bricks fold into a data center."),
 (3, 2, "push-detail", "close", "eye", "funnel-machine", "cross-section-cutaway", "single-object-void", "radial-emanate", "structure-as-subject", "whip-pan", "build",
  "Electricity into intelligence", "A funnel machine takes a lightning bolt and spits out a brain and coins."),
 (4, 3, "macro-closeup", "insert", "high", "remote-table", "macro-closeup", "single-object-void", "push-in-only", "instrument-as-subject", "mask-wipe", "carry",
  "Pause", "A big remote drops onto a table beside a tent card and its pause button glows."),
 (5, 4, "two-up", "medium", "high", "drum-and-box", "instrument-screen", "grid-modular", "horizontal-traverse", "data-as-subject", "match-cut", "travel",
  "Two days earlier", "The remote's rewind rolls a brass date drum back to the 12th and a switchbox lamp goes orange."),
 (6, 5, "data-panel", "close", "eye", "reserve-cutaway", "cross-section-cutaway", "hud-instrument-frame", "vertical-rise", "single-organic-hero", "focus-pull", "build",
  "The reserve", "The ReserveBar in a navy cutaway with a spare tire, a SPARE ROOM bracket and a fluid that slumps past the Level 2 line."),
 (7, 6, "wide-establish", "wide", "ground", "plant-yard", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "multiplicity-swarm", "whip-pan", "travel",
  "Three units", "Three steam stacks in the snow, one goes dark and two put on hard hats and a stamp ties the alert to a unit."),
 (8, 7, "map-territory", "wide", "overhead", "postcard-street", "top-down-map", "map-territory", "push-in-only", "landscape-as-subject", "carried-element", "carry",
  "A postcard from Ellendale", "A postcard unfolds into a street of small houses with porch lights and a rebate check."),
 (9, 8, "subject-portrait", "medium", "low", "reserve-cutaway", "cross-section-cutaway", "hud-instrument-frame", "vertical-rise", "single-organic-hero", "match-action", "match",
  "Its own power", "The bar perks up as a plug on its own cord seats in its base and a question mark stamps on its tag."),
 (10, 9, "macro-closeup", "insert", "eye", "remote-table", "macro-closeup", "single-object-void", "radial-emanate", "instrument-as-subject", "hard-cut", "match",
  "Then proceed", "The remote's play button presses and its triangle rolls forward."),
 (11, 10, "data-panel", "close", "eye", "ledger-desk", "instrument-screen", "hud-instrument-frame", "push-in-only", "data-as-subject", "fui-boot", "build",
  "Every term is megawatts", "Three ledger slips stamp down each ending in MW? and an orange stamp slams across the blank readout."),
 (12, 11, "push-detail", "medium", "eye", "funnel-machine", "cross-section-cutaway", "stacked-layers", "pull-back-only", "structure-as-subject", "match-cut", "match",
  "Our read", "The funnel machine rolls back with a plug where the bolt entered."),
 (13, 12, "two-up", "wide", "eye", "height-chart-room", "eye-level-immersive", "fullbleed-split", "pull-back-only", "structure-as-subject", "match-cut", "match",
  "Name the megawatts", "The CashBlock hops back against the height chart and a dashed ? MW block hovers above it while the bar looks at the camera."),
]

AMBIENT = {
 1: "the pencil wobbles, window light drifts, the chart creaks, the bar breathes",
 2: "snow dust drifts, the awning drips, the block bobs, the crowd shifts",
 3: "gears turn, sparks jump, the brain bobs, coins settle",
 4: "the remote rocks, the tent card sways, dust drifts, the bar in the foreground blinks",
 5: "the drum whirs, the switchbox lamp pulses, wires sway, the remote rocks",
 6: "the fluid waves, the tire sways, the bracket dashes crawl, a sweat bead slides",
 7: "steam curls, snow drifts, hard hats tilt, the dark stack ticks as it cools",
 8: "porch lights flicker, card edges curl, snowflakes fall, the check rocks",
 9: "the cord swings, the bar blinks, the tag turns, the fluid waves",
 10: "the triangle pulses, the lamp sways, dust drifts, the quote plate breathes",
 11: "slips bounce, the readout flickers, the stamp rings, dust drifts",
 12: "gears turn, the plug sways, the bar blinks, sparks jump",
 13: "the pencil wobbles, window light drifts, the bar breathes",
}
CENTER = {1: "the block at x400 y1230", 2: "the door at x620 y1000", 3: "the funnel at x540 y1000", 4: "the remote at x540 y1000", 5: "the drum at x300 y1000", 6: "the bar at x540 y1000",
          7: "the stacks at x540 y1000", 8: "the postcard at x540 y1000", 9: "the bar at x330 y1000", 10: "the remote at x540 y1000", 11: "the ledger at x540 y1000", 12: "the funnel at x540 y1000", 13: "the block at x400 y1230"}
HERO = {
 1: ("HeightChart + CashBlock + ReserveBar", "40% chart, 35% block, 25% bar and pencil"),
 2: ("CashBlock + door + crowd", "40% block and bricks, 35% door and hall, 25% crowd"),
 3: ("FunnelMachine", "60% machine, 25% brain and coins, 15% bolt"),
 4: ("RemoteControl + tent card", "65% remote, 20% card, 15% table"),
 5: ("DateDrum + Switchbox + remote", "40% drum, 40% switchbox, 20% remote"),
 6: ("ReserveBar", "70% bar, 30% tire and bracket"),
 7: ("Generator stacks + ReserveBar", "60% stacks, 25% hats and stamp, 15% bar"),
 8: ("Postcard street", "55% houses, 30% porch lights, 15% check"),
 9: ("ReserveBar + plug", "55% bar, 30% plug and cord, 15% tag"),
 10: ("RemoteControl", "70% remote, 20% plate, 10% table"),
 11: ("Ledger slips + readout", "50% slips, 30% readout, 20% stamp"),
 12: ("FunnelMachine + plug", "60% machine, 25% plug, 15% bar"),
 13: ("HeightChart + CashBlock + ReserveBar", "40% chart, 35% block and ghost, 25% bar"),
}
PARTS = {1: 56, 2: 60, 3: 58, 4: 44, 5: 54, 6: 60, 7: 60, 8: 70, 9: 50, 10: 36, 11: 44, 12: 50, 13: 58}
STAGE3D = {k: "planes" for k in range(1, 14)}
STAGE3D[3] = "flat:a locked funnel machine where the bolt and the brain are the motion"
STAGE3D[4] = "flat:a locked macro of the remote where the press and the glow are the motion"
STAGE3D[10] = "flat:a locked macro of the remote where the play press and the rolling triangle are the motion"
STAGE3D[11] = "flat:a locked ledger desk where the stamps are the motion"
CAMERA = {1: "dollyThrough", 2: "truckAcross", 3: "static:the bolt dropping and the brain popping is the whole shot", 4: "craneDown", 5: "truckAcross", 6: "riseWith", 7: "truckAcross",
          8: "craneDown", 9: "dollyThrough", 10: "static:the play press and the rolling triangle are the whole shot", 11: "static:the stamps landing are the shot", 12: "riseWith", 13: "dollyThrough"}


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

    # Word anchors resolve through board_anchor: on conform (real voice) a word the read no longer
    # says is an orphan and main() refuses to write the board (machine pass 2026-10-15).
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
            "shows": shows, "sfx": sfx, "means": ann.lower(), "rehook": rehook,
            "draw": {"subject": subj, "action": act, "emotion": emo, "annotation": ann},
            "choreo": {"primary": shows, "reaction": reaction, "ambient": AMBIENT[S[sh - 1][0]]},
        })
    beats.sort(key=lambda b: (b["at_s"], b["id"]))
    # keep ONE declared rehook per drift window, the first candidate in it
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

    palette = "frost noon, snowbank, reserve cyan, hazard orange, banknote green, charcoal"
    board = {
        "run_date": "2026-10-17", "slug": "ten-billion-how-many-megawatts", "title": "Ten Billion, How Many Megawatts",
        "concept": ("Interior Secretary Burgum told a Fairbanks Chamber crowd on October 14th that people want to drop ten billion on a data center with no tax breaks, two days after Golden Valley Electric's "
                    "first alert under its new alert system, a Level 2 with reserve under 15 MW. The film stands a block of money against a growth chart marked in megawatts, shows they are in different units, gives the best case for yes "
                    "(Ellendale's homes and rebates, a customer that brings its own power) a full scene, and lands on one blank readout: the reports name no megawatts. A glass ReserveBar with a face is the throughline."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "cross-section-cutaway", "motion_vector": "vertical-rise", "hero_treatment": "single-organic-hero", "layout": "hud-instrument-frame",
                        "register": "bright-industrial-comic", "palette": palette, "camera_strategy": "pull-back-reveal", "light_story": "low peach sun over an Interior snow day, a deep navy cutaway, hazard-orange alerts",
                        "metaphor": "a growth chart marked in megawatts that a block of dollars can't be measured against"},
        "palette": palette,
        "divergence_note": ("10-16 was a black-spruce night with tungsten and chalk around a seismic station, and 10-15 pearl fog with a cranberry Gate. This film is a bright snow-and-ice winter noon with cyan, "
                            "hazard orange and banknote green, a tall thin glass gauge against a squat heavy money block, and it moves through a height-chart room, a snowy door, a funnel machine, a remote on a table, "
                            "a date drum and switchbox, a navy reserve cutaway, a plant yard, a postcard street and a ledger desk."),
        "treatment": {"winner": "The Explainer's balance scale and reserve cutaway, with the Comedian's smug CashBlock, the Dramatist's pause button and the Enthusiast's Ellendale test.",
                      "why": "The scale makes the units mismatch a picture before a word is said, the cutaway makes a reserve felt, and the best case for yes gets a full scene that ends on the same blank readout."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A smug green money block thuds onto one pan of a brass balance scale while the other pan holds a blank megawatt readout, and the beam refuses to tip.",
                 "headline": "TEN BILLION, HOW MANY MEGAWATTS", "motion_by_s": 0.4,
                 "loopback": "The last frame is the balance scale again with the bar stepping onto the right pan, the open replaying."},
        "open_loop": {"plant_t": b_at(2), "pay_t": b_at(29), "what": "How many megawatts the ten billion is. Paid as the ask: the reports name none, so name them."},
        "open_loop_2": {"plant_t": b_at(14), "pay_t": b_at(22), "what": "Whether a new big customer could fit beside a reserve under 15 megawatts. Paid as the reports not saying whether this one would bring its own power."},
        "throughline": {"object": "the ReserveBar", "lands_in_button": "the bar beside the height chart turning to look straight at the camera while the pencil hovers over the blank line",
                        "states": [
                            {"at_s": b_at(2), "state": "calm, blinking awake beside the chart and the hovering pencil"},
                            {"at_s": b_at(35), "state": "attentive in the foreground of the audience, looking up at the remote"},
                            {"at_s": b_at(11), "state": "uneasy in the cutaway of the alert, a lamp orange behind it"},
                            {"at_s": b_at(15), "state": "fluid slumped below the Level 2 line, sweating"},
                            {"at_s": b_at(18), "state": "sweating beside a dark stack and a quote plate"},
                            {"at_s": b_at(37), "state": "a bar-shaped silhouette lit amber in a porch window"},
                            {"at_s": b_at(38), "state": "perked up tall beside a plug on its own cord"},
                            {"at_s": b_at(23), "state": "wary in the foreground glancing up at the play button"},
                            {"at_s": b_at(25), "state": "unlit mini bar in the readout bezel under the slam"},
                            {"at_s": b_at(30), "state": "looking straight at the camera beside the blank line"}]},
        "reveals": [
            {"t": b_at(7), "type": "build-on", "what": "a lightning bolt drops into a funnel machine and a brain pops out with coins", "hold_s": 0.6},
            {"t": b_at(17), "type": "build-on", "what": "three stacks rise from the snow, one goes dark and two put on hard hats", "hold_s": 0.6},
            {"t": b_at(23), "type": "morph-to-chart", "what": "the remote's pause button pops up and the play button takes over", "hold_s": 0.6},
            {"t": b_at(29), "type": "build-on", "what": "a dashed ghost block marked ? MW hovers above the CashBlock waiting for its number", "hold_s": 0.7}],
        "tail_s": 1.7, "audio_arc": {"build_steps": 4, "dip_at": round(b_at(29) - 0.9, 3), "riser_at": round(b_at(61) , 3), "silence_at": round(b_at(29) - 0.2, 3),
                      "payoff_at": b_at(30), "button_pattern": "question", "interrupt_at": b_at(25), "extra_dips": [b_at(15), b_at(23)]},
        "shots": shots, "beats": beats,
    }
    order = sorted(board["beats"], key=lambda b: (b["at_s"], b["id"]))
    ids = {b["id"]: rank for rank, b in enumerate(order, 1)}
    for b in board["beats"]:
        b["key"] = b["id"]
        b["id"] = ids[b["key"]]
    board["beats"].sort(key=lambda b: b["id"])
    board["_ids"] = ids
    book.raise_if_missing("board_1017 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1017Ids.ts").write_text(
        "// GENERATED by scripts/board_1017.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
