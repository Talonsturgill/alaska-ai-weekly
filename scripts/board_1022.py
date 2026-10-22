#!/usr/bin/env python3
"""2026-10-22 "The Hair Above the Ground": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1022.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1022.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "hit", "Plumb", "swings in on his hairline string and stops a hair above a blue patch of a dark survey sheet, tip trembling", "wary", "DGGS · TWO 2026 SURVEYS",
  "a brass plumb bob with two bone eyes swings in on a hairline string from the top of the frame and stops a hair above a blue pond in the tundra turf, its tip trembling, while a floating survey sheet at the left holds flight lines, DGGS, TWO 2026 SURVEYS",
  "the string swings and settles, the tip trembles", ""),
 (2, 1, 0, W("forty"), "whoosh", "survey helicopter", "crosses the floating sheet laying a vermilion dashed flight line behind it", "plain", "FLIGHT LINES",
  "a small survey helicopter crosses the floating vellum sheet and a vermilion dashed line draws behind it",
  "the rotor blurs and the line draws on", ""),
 (3, 1, 0, W("southwest"), "tick", "flight lines", "fill the sheet row on row like a mown lawn while a brass counter rolls", "plain", "ABOUT 45,800 LINE-KM · THE FILM'S ARITHMETIC",
  "vermilion flight lines fill the floating sheet row on row like a mown lawn, ABOUT 45,800 LINE-KM, THE FILM'S ARITHMETIC",
  "the rows draw in and the digits roll", ""),
 (4, 2, 1, 0.0, "slide", "survey sheet", "copies fan out from the sheet like a hand of cards", "plain", "DATA OFFERED FOR DOWNLOAD · DGGS",
  "copies of the survey sheet fan out like a hand of cards, DATA OFFERED FOR DOWNLOAD, DGGS",
  "the cards fan and settle", ""),
 (5, 2, 1, W("download"), "pop", "download arrows", "drop onto each copy", "plain", "DOWNLOAD",
  "a fat download arrow drops onto each copy in turn",
  "each arrow lands with a bounce", ""),
 (6, 1, 0, W("kilometers"), "hush", "moss tarp", "rumples in the lower corner and a tiny Zzz rises", "sleepy", "ZZZ",
  "on the turf at the right edge a moss green tarp rumples over a lumpy shape and a tiny Zzz rises",
  "the tarp breathes and the Zzz drifts", ""),
 (48, 2, 1, W("improve"), "type", "quote plate", "types the state's words", "plain", "IMPROVE THE UNDERSTANDING OF THE GEOLOGY AND MINERAL POTENTIAL",
  "a quote plate types the state's words, IMPROVE THE UNDERSTANDING OF THE GEOLOGY AND MINERAL POTENTIAL, DGGS",
  "the words type to the voice", ""),
 (56, 2, 1, 0.96, "slide", "copies", "slide into a neat stack as the arrows fade", "plain", "ONE MAP, MANY COPIES",
  "the copies slide into a neat stack as the arrows fade and the bit's tarp breathes in the corner, ONE MAP, MANY COPIES",
  "the stack squares up", ""),
 (7, 3, 2, W("October"), "whoosh", "paper plane", "flies in from off the lower left across the map", "curious", "OCT 20TH",
  "a map of Alaska floats in the sky as a paper plane flies in from off the lower left, OCT 20TH",
  "the plane glides and its shadow crosses the map", ""),
 (8, 3, 2, W("Portland"), "tap", "tag", "swings from the plane's tail", "plain", "PORTLAND-BASED",
  "a kraft tag swings from the plane's tail reading PORTLAND-BASED",
  "the tag swings", ""),
 (9, 3, 2, W("Geomorphic"), "thunk", "name plate", "drops in over the map", "plain", "GEOMORPHIC AI",
  "a plate drops in over the map reading GEOMORPHIC AI",
  "the plate bounces", ""),
 (10, 3, 2, W("Alaska"), "hit", "paper plane", "lands on the map and a dashed pin outline pops up", "plain", "OCT 20TH · GOLDEN DYKE EXPLORATION LLC",
  "the plane lands and a dashed pin outline floats up beside the map, unplaced, OCT 20TH, GOLDEN DYKE EXPLORATION LLC",
  "the plane skids and settles, the dashes crawl", ""),
 (11, 4, 3, W("calls"), "chime", "Plumb", "turns and a brass-edged tag hangs on his string", "curious", "ITS WORDS",
  "Plumb hangs a hair above the pond and a tag hangs from his string reading ITS WORDS",
  "the tag swings and Plumb tilts", ""),
 (12, 4, 3, W("prospect"), "bloop", "plaque", "rises beside Plumb", "plain", "ITS WORDS · AI-DRIVEN PROSPECT GENERATOR",
  "a plaque rises beside Plumb reading ITS WORDS, AI-DRIVEN PROSPECT GENERATOR",
  "the plaque bounces", "rehook: it calls itself"),
 (13, 4, 3, W("overlooked"), "ping", "question marks", "bloom on the bare rock under the turf as a beam from his tip sweeps", "curious", "OVERLOOKED SYSTEMS?",
  "hollow question marks bloom on the bare rock under the turf one by one as a beam from Plumb's tip sweeps across, OVERLOOKED SYSTEMS?",
  "the marks pop and the beam sweeps", ""),
 (53, 4, 3, W("geological"), "creak", "moss tarp", "shifts in the lower corner as the sleeping shape turns over and the Zzz stops", "sleepy", "TURNS OVER",
  "in the lower corner the moss tarp shifts as the sleeping shape turns over under it and the Zzz stops",
  "the tarp shifts and settles", ""),
 (14, 4, 3, W("packages"), "roll", "rolled sheet", "rolls out of a brass tube floating in the sky", "plain", "DRILL-READY DATA PACKAGE",
  "a rolled sheet in a brass tube floating in the sky rolls out, DRILL-READY DATA PACKAGE",
  "the roll unrolls and curls", ""),
 (55, 5, 4, 0.0, "swing", "mapping sheet", "glides in from the left and floats beside Plumb", "curious", "WHAT IT READS",
  "a generic mapping sheet glides in from the left and floats beside Plumb, WHAT IT READS",
  "the lamp swings and the sheet glides", ""),
 (15, 5, 4, W("public"), "swell", "dusk light", "settles on a plate", "plain", "ITS WORDS · WHAT IT READS IS PUBLIC",
  "the dusk light settles on a plate, ITS WORDS, WHAT IT READS IN ALASKA IS PUBLIC",
  "the lamp swings and the light pool shifts", ""),
 (16, 5, 4, W("airborne"), "slide", "survey sheet", "slides in from the right with periwinkle contours and floats there, never under Plumb", "plain", "NEW STATE AIRBORNE SURVEYS",
  "a second sheet with periwinkle aeromagnetic contours slides in, NEW STATE AIRBORNE SURVEYS",
  "the sheet slides and settles", ""),
 (17, 5, 4, W("surveys"), "bloom", "contours", "ripple across the sheet", "plain", "STATE DATA",
  "periwinkle contour lines ripple across the new sheet as Plumb leans over it",
  "the contours ripple", ""),
 (18, 6, 5, W("Here's"), "whoosh", "survey helicopter", "banks across a dusk tundra with a bird swinging on a cable", "plain", "WHAT ONE OF THOSE LOOKS LIKE",
  "the world drops away to a dusk tundra where a survey helicopter banks in with a sensor bird swinging on a cable, WHAT ONE OF THOSE LOOKS LIKE",
  "the rotor blurs and the bird swings", "rehook: what one looks like"),
 (19, 6, 5, W("Ganes"), "thunk", "name plate", "drops in over the hills", "plain", "GANES CREEK · 25,731 LINE-KM",
  "a plate drops in over the hills reading GANES CREEK, 25,731 LINE-KM",
  "the plate bounces", ""),
 (20, 6, 5, W("helicopter"), "drone", "survey helicopter", "flies row after row and the lines draw behind it", "plain", "400 M APART",
  "the helicopter flies row after row over the tundra and vermilion lines draw behind it",
  "the rows draw and the counter rolls", ""),
 (49, 5, 4, W("including"), "creak", "moss tarp", "twitches on the turf as the new survey sheet slides in", "plain", "WHAT'S UNDER THE TARP?",
  "on the turf at the right edge the moss tarp twitches as the second sheet slides in",
  "the tarp twitches", "plant: what's under the tarp"),
 (21, 6, 5, W("magnetic"), "bloom", "bird", "passes over the cutaway where periwinkle field lines bend", "plain", "MAGNETIC SENSOR · GAMMA-RAY SPECTROMETERS",
  "periwinkle field lines bend under the sensor bird, MAGNETIC SENSOR, GAMMA-RAY SPECTROMETERS",
  "the field lines bend", ""),
 (22, 6, 5, W("gamma"), "bloom", "rock layers", "glow lichen green where they differ", "plain", "GLOW MEANS ROCK DIFFERS",
  "lichen green glow brightens in the rock layers where they differ",
  "the glow swells and fades", ""),
 (23, 7, 6, W("Add"), "slide", "second survey sheet", "snaps in beside the first", "plain", "ANIAK + LITTLE TAYLOR MTNS · 20,090 LINE-KM",
  "a second survey sheet snaps in beside the first, ANIAK AND LITTLE TAYLOR MTNS, 20,090 LINE-KM, lines 400 M APART",
  "the sheet snaps with a bounce", ""),
 (24, 7, 6, W("once"), "swell", "vermilion ribbon", "lifts off both sheets and winds around a globe", "curious", "MORE THAN ONCE AROUND",
  "the vermilion lines lift off both sheets as one ribbon and wind around a blue globe, MORE THAN ONCE AROUND",
  "the ribbon winds and the globe turns", ""),
 (25, 7, 6, W("Earth"), "hit", "ribbon", "passes once around with slack left over", "curious", "SURVEYS ADD · NOT ONE FLIGHT",
  "the ribbon passes once around the globe with slack trailing, SURVEYS ADD, NOT ONE FLIGHT",
  "the slack ripples", ""),
 (26, 8, 7, W("best"), "swell", "four readers", "lean over copies of one sheet on a lamp lit bench", "curious", "THE FAIR CASE",
  "the view drops to a lamp lit bench where four identical readers with loupes lean over copies of the same sheet, THE FAIR CASE",
  "the readers lean and the lamp swings", "rehook: the fair case"),
 (27, 8, 7, W("everyone"), "pop", "download arrows", "land at once, one copy per reader", "plain", "THE SAME MAP",
  "download arrows land at once, one copy per reader, with Plumb hanging at the head of the bench as one more reader, THE SAME MAP",
  "the arrows bounce", ""),
 (28, 8, 7, W("edge"), "tap", "pedestal", "carries a floating question mark and the third reader steps toward it first", "ask", "FIRST LOOK?",
  "at the end of the bench a bone pedestal carries a floating question mark, FIRST LOOK, and the third reader steps toward it first while the others lean in after",
  "the question mark bobs and the readers lean", ""),
 (47, 9, 8, W("single"), "knock", "moss tarp", "lifts a crack on the turf and one steel eye opens and watches Plumb", "wary", "ONE EYE OPEN",
  "on the turf at the right edge the moss tarp lifts a crack and one steel eye opens and watches Plumb",
  "the tarp lifts and the eye blinks", ""),
 (29, 9, 8, W("named"), "thunk", "dashed pin", "sits alone on the map under Plumb", "ask", "NO ALASKA PROPERTY NAMED YET",
  "a lone dashed pin outline floats in the sky beside the Alaska map card and Plumb, NO ALASKA PROPERTY NAMED YET",
  "the dashes crawl and Plumb trembles", ""),
 (30, 9, 8, W("property"), "scratch", "Plumb", "swings back and forth with a tag that flips through question marks", "worried", "A DEED?",
  "Plumb swings and a tiny tag on his string flips through question marks",
  "the tag flips and Plumb sags", ""),
 (31, 9, 8, W("soon"), "tick", "tag", "swings from the dashed pin", "plain", "SOON · ITS WORD",
  "a pale tag swings from the dashed pin reading SOON, ITS WORD",
  "the tag swings", ""),
 (32, 10, 9, W("release"), "page", "release sheet", "unrolls like a scroll beside the map", "plain", "ITS RELEASE",
  "a release sheet unrolls like a scroll beside the map, ITS RELEASE",
  "the scroll unrolls and curls", ""),
 (33, 10, 9, W("belong"), "slide", "deposit blobs", "sit on the map each with a hang tag", "plain", "ITS RELEASE · DEPOSITS IT MENTIONS BELONG TO OTHERS",
  "three solid deposit mounds sit on the turf each with a hang tag, ITS RELEASE, DEPOSITS IT MENTIONS BELONG TO OTHERS",
  "the tags swing", ""),
 (34, 10, 9, W("ground"), "hush", "dashed outline", "stays empty among them", "ask", "NOTHING SHOWN ON ITS GROUND",
  "a dashed empty ring sits on the turf around the pond under Plumb, NOTHING SHOWN ON ITS OWN GROUND",
  "the dashes crawl", ""),
 (35, 11, 10, W("magnetism"), "bloom", "glowing map", "glows periwinkle and lichen", "plain", "MAGNETISM + NATURAL RADIATION",
  "a floating sheet and the rock beneath the turf glow periwinkle and lichen green, MAGNETISM, NATURAL RADIATION",
  "the glow swells", ""),
 (36, 11, 10, W("differs"), "fade", "rock block", "pulls out of the map as a cutaway with banded layers", "curious", "A MAP SHOWS ROCK · A DRILL SHOWS WHAT'S IN IT",
  "the banded rock under the turf glows where it differs, A MAP SHOWS WHERE ROCK DIFFERS",
  "the block rises and the bands shimmer", ""),
 (37, 11, 10, W("drill"), "thump", "steel bit", "throws off the moss tarp, sits up, yawns, looks at the glow and shakes its head", "serious", "ONLY A DRILL SHOWS WHAT THE ROCK HOLDS",
  "the moss tarp lifts and a steel tricone bit with two eyes sits up on the turf, yawns, looks at the glow in the rock and shakes its head, ONLY A DRILL SHOWS WHAT THE ROCK HOLDS",
  "the tarp slides and the bit yawns and shakes", "rehook: it's a drill bit"),
 (38, 12, 11, W("doesn't"), "hit", "Plumb", "reaches for the bit and has no hands", "worried", "IT DOESN'T DRILL",
  "Plumb swings toward the bit and has no hands, the string just swings, IT DOESN'T DRILL",
  "the string swings and Plumb droops", ""),
 (39, 12, 11, W("Partners"), "whoosh", "partners", "walk in with hard hats and a thermos", "plain", "PARTNERS DRILL · IT KEEPS AN INTEREST",
  "two rig figures in hard hats walk in at dawn, one with a thermos, and the bit stands up with its tarp as a cape and a tag PARTNERS FUND AND RUN IT, PARTNERS DRILL, IT KEEPS AN INTEREST",
  "their strides settle and the steam drifts", ""),
 (40, 12, 11, W("interest"), "clink", "brass tag", "clips onto Plumb's string", "plain", "KEEPS AN INTEREST",
  "a small brass tag clips onto Plumb's string, KEEPS AN INTEREST",
  "the tag clinks and swings", ""),
 (41, 13, 12, W("Sumner"), "type", "quote card", "types the CEO's words", "plain", "MARK SUMNER, CEO",
  "a quote card types the CEO's words, MARK SUMNER, CEO",
  "the words type to the voice", ""),
 (42, 13, 12, W("Peru"), "pop", "dashed pins", "pop onto a map sheet labelled PERU and ALASKA", "curious", "\"TWO OF THE MOST PROSPECTIVE PLACES IN THE WORLD\" · MARK SUMNER, CEO",
  "two dashed pin outlines pop onto the map sheet labelled PERU and ALASKA, TWO OF THE MOST PROSPECTIVE PLACES IN THE WORLD, MARK SUMNER, CEO",
  "the pins pop and the dashes crawl", ""),
 (57, 13, 12, W("places"), "slide", "dashed pins", "pulse together", "curious", "TWO PLACES",
  "the two dashed pins pulse together on the map sheet",
  "the pins pulse", ""),
 (43, 13, 12, W("copper"), "ping", "copper disc", "a dashed copper coloured circle pops beside the pins", "plain", "COPPER",
  "a dashed copper coloured circle pops beside the pins, COPPER",
  "the dashes crawl", ""),
 (44, 13, 12, W("gold"), "tick", "gold disc", "a dashed gold coloured circle pops beside the copper one", "plain", "GOLD",
  "a dashed gold coloured circle pops beside the copper one, GOLD",
  "the dashes crawl", ""),
 (52, 14, 13, W("If"), "swell", "Plumb", "returns over the table one hair above the blue patch with the bit beside him", "wary", "THE HAIR ABOVE THE GROUND",
  "the ground returns at dawn with Plumb one hair above the blue pond and the steel bit awake on the turf beside him",
  "the string settles and the tip trembles", ""),
 (45, 14, 13, W("get"), "ping", "question mark", "floats up from the blue patch", "ask", "WHO ACTS ON IT FIRST?",
  "a brass question mark floats up from the blue patch, WHO ACTS ON IT FIRST?",
  "the question mark bobs", ""),
 (50, 14, 13, W("who", 2), "bloop", "question mark", "a second hollow question mark floats up beside the bit", "ask", "WHO PAYS FOR THE FIRST HOLE?",
  "a second hollow question mark floats up beside the steel bit, WHO PAYS FOR THE FIRST HOLE?",
  "the question mark bobs", ""),
 (46, 14, 13, W("cost"), "thud", "steel bit", "spins and bores down through the turf and the rock beside Plumb", "firm", "THE FIRST HOLE",
  "the steel bit spins and bores down through the turf and the rock beside Plumb who still hangs a hair above, ILLUSTRATIVE",
  "the bit spins and the ground jolts", "pay: the weight and the bit"),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "eye", "ground-column-dusk", "cross-section-cutaway", "fullbleed-split", "vertical-descent", "instrument-as-subject", "", "",
  "A hair above the ground", "A brass plumb bob swings in on a string and stops a hair above a pond in the tundra turf while a floating sheet fills with red flight lines."),
 (2, 1, "alt-vantage", "medium", "eye", "ground-column-dusk", "cross-section-cutaway", "grid-modular", "assemble-build", "multiplicity-swarm", "carried-element", "carry",
  "Offered for download", "The floating sheet fans into copies in the sky and an arrow lands on each while a tarp rumples on the turf."),
 (3, 2, "map-territory", "wide", "eye", "ground-column-dusk", "cross-section-cutaway", "map-territory", "horizontal-traverse", "landscape-as-subject", "whip-pan", "travel",
  "A paper plane from Portland", "A paper plane glides across the sky to a floating Alaska map and a dashed pin outline floats up beside it."),
 (4, 3, "subject-portrait", "close", "eye", "ground-column-dusk", "cross-section-cutaway", "stacked-layers", "radial-emanate", "instrument-as-subject", "match-action", "match",
  "Its words", "Plumb hangs a hair above the turf, its words hang on a tag, hollow question marks bloom in the bare rock and a roll slides out."),
 (5, 4, "two-up", "medium", "eye", "ground-column-dusk", "cross-section-cutaway", "fullbleed-split", "horizontal-traverse", "data-as-subject", "carried-element", "carry",
  "Public data", "Two sheets float in from either side of Plumb and the tarp twitches on the turf."),
 (6, 5, "wide-establish", "extreme-wide", "high", "dusk-tundra-to-cutaway", "orbital-aerial", "stacked-layers", "horizontal-traverse", "landscape-as-subject", "whip-pan", "travel",
  "What one of those looks like", "A helicopter mows rows over a dusk tundra and the ground goes translucent on bending field lines and a lichen glow."),
 (7, 6, "map-territory", "extreme-wide", "high", "globe-and-sheets", "orbital-aerial", "map-territory", "assemble-build", "data-as-subject", "match-cut", "match",
  "More than once around", "Two survey sheets send one red ribbon around a globe with slack to spare."),
 (8, 7, "two-up", "wide", "eye", "bench-lamp", "eye-level-immersive", "stacked-layers", "push-in-only", "multiplicity-swarm", "mask-wipe", "build",
  "The same map", "Five readers and a hanging brass bob lean over copies of one sheet toward a question mark pedestal."),
 (9, 8, "map-territory", "medium", "eye", "ground-column-dusk", "cross-section-cutaway", "single-object-void", "vertical-descent", "instrument-as-subject", "hard-cut", "carry",
  "No property named", "A lone dashed pin floats in the sky beside Plumb who sways and flips a tag of question marks while an eye opens under the tarp."),
 (10, 9, "two-up", "close", "eye", "ground-column-dusk", "cross-section-cutaway", "fullbleed-split", "assemble-build", "data-as-subject", "carried-element", "carry",
  "Others' deposits", "A release scrolls out above three tagged mounds on the turf and a dashed ring circles the pond under Plumb."),
 (11, 10, "alt-vantage", "wide", "low", "ground-column-glow", "cross-section-cutaway", "stacked-layers", "vertical-rise", "structure-as-subject", "match-cut", "match",
  "A map shows rock", "The rock under the turf glows where it differs and the tarp lifts on a steel bit on the turf that shakes its head."),
 (12, 11, "two-up", "medium", "eye", "ground-column-dawn", "cross-section-cutaway", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "carried-element", "carry",
  "Partners drill", "Plumb reaches for the bit and has no hands as partners walk in at dawn with a thermos and a tag clips on."),
 (13, 12, "wide-establish", "wide", "eye", "survey-table-lamp", "top-down-map", "map-territory", "horizontal-traverse", "data-as-subject", "whip-pan", "travel",
  "The announcing", "A quote card types the CEO's words as two dashed pins and two dashed discs pop onto a map sheet while the caped bit stands by."),
 (14, 13, "wide-establish", "close", "eye", "ground-column-dawn", "cross-section-cutaway", "stacked-layers", "vertical-descent", "instrument-as-subject", "match-cut", "match",
  "The first hole", "The ground returns at dawn, Plumb holds a hair above the pond and the steel bit spins down through the turf and the rock beside him."),
]

AMBIENT = {
 1: "the lamp swings a hair, dust crosses the cone, Plumb's string breathes, the lines draw on",
 2: "the copies shimmer, the tarp breathes, dust crosses the cone, the lamp swings",
 3: "the plane glides, the map shimmers, the lamp swings, the pin outline crawls",
 4: "Plumb swings, the tag swings, the beam sweeps, dust crosses the cone",
 5: "the lamp swings, contours ripple, Plumb swings, dust crosses the cone",
 6: "grass sways, the bird swings, the rotor blurs, the field lines ripple",
 7: "the globe turns, the ribbon ripples, the sheets shimmer, stars twinkle",
 8: "the lamp swings, the readers shift, the question mark bobs, dust crosses the cone",
 9: "Plumb sways, the dashes crawl, the tag swings, dust crosses the cone",
 10: "the scroll curls, the tags swing, the dashes crawl, the lamp swings",
 11: "the bands shimmer, the glow swells, the bit breathes, dust drifts",
 12: "Plumb swings, steam drifts, the tag swings, the lamp swings",
 13: "the cape ripples, the dashes crawl, steam drifts, the lamp swings",
 14: "Plumb trembles, the string breathes, the question mark bobs, dust crosses the cone",
}
CENTER = {1: "Plumb at x540 y1000", 2: "the copies at x540 y1050", 3: "the map at x540 y1100", 4: "Plumb at x540 y1000", 5: "the sheets at x540 y1050", 6: "the helicopter at x540 y950",
          7: "the globe at x540 y1000", 8: "the bench at x540 y1100", 9: "Plumb at x540 y950", 10: "the map at x540 y1050", 11: "the block at x540 y1000", 12: "Plumb and the bit at x540 y1050",
          13: "the card at x540 y900", 14: "Plumb at x400 y950"}
HERO = {
 1: ("Plumb + VellumSheet + SurveyHeli", "40% Plumb, 40% sheet, 20% lines"),
 2: ("VellumSheet x5 + download arrows + tarp", "50% copies, 30% arrows, 20% tarp"),
 3: ("AlaskaMini + paper plane + dashed pin", "55% map, 25% plane, 20% plate"),
 4: ("Plumb + tag + question marks + tube", "40% Plumb, 35% sheet, 25% roll"),
 5: ("VellumSheet x2 + lamp + contours", "50% sheets, 30% lamp pool, 20% Plumb"),
 6: ("TundraBG + SurveyHeli + RockBlock", "40% tundra, 30% heli, 30% cutaway"),
 7: ("VellumSheet x2 + Globe + ribbon", "45% globe, 35% sheets, 20% ribbon"),
 8: ("Character x5 + benches + Plumb + pedestal", "50% readers, 30% bench, 20% pedestal"),
 9: ("AlaskaMini + dashed pin + Plumb", "45% map, 35% Plumb, 20% tag"),
 10: ("MapSheet + release scroll + blobs", "40% map, 35% scroll, 25% blobs"),
 11: ("RockBlock + glowing map + DrillBit", "45% block, 30% bit, 25% glow"),
 12: ("Plumb + DrillBit + Character x2", "35% Plumb, 30% bit, 35% partners"),
 13: ("quote card + MapSheet + dashed pins + DrillBit", "40% card, 35% map, 25% bit"),
 14: ("Plumb + DrillBit + VellumSheet", "40% Plumb, 35% bit, 25% sheet"),
}
PARTS = {1: 54, 2: 50, 3: 48, 4: 52, 5: 46, 6: 60, 7: 50, 8: 62, 9: 46, 10: 48, 11: 58, 12: 56, 13: 54, 14: 52}
STAGE3D = {k: "planes" for k in range(1, 15)}
for _k in (2, 5, 10):
    STAGE3D[_k] = "flat:a locked panel where the sheets, the arrows and the contours are the motion"
CAMERA = {1: "dollyThrough", 2: "static:the fanning copies and landing arrows are the shot", 3: "craneDown", 4: "dollyThrough", 5: "static:the sliding sheets and the rippling contours are the shot", 6: "truckAcross", 7: "craneDown",
          8: "dollyThrough", 9: "dollyThrough", 10: "static:the unrolling release and the hang tags are the shot", 11: "craneDown", 12: "dollyThrough", 13: "truckAcross", 14: "craneDown"}


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
    for b in beats:
        if b["id"] in (37, 46):
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

    palette = "dark spruce ink night, vellum maps, brass hanging reader, periwinkle magnetic contours, lichen green glow, cold steel drill and one vermilion thread"
    board = {
        "run_date": "2026-10-22", "slug": "the-hair-above-the-ground", "title": "The Hair Above the Ground",
        "concept": ("Alaska's geologists flew two helicopter surveys and offer the data for download. A Portland company, Geomorphic AI, says it has set up in Alaska as an AI driven prospect generator that screens geological data, "
                    "and has named no Alaska property. The film draws the reader as a brass plumb bob on a hairline string that hangs a hair above the map and can't come down, and the only thing that can grade a map, a steel drill bit asleep under a tarp in the corner, "
                    "wakes up across the film. It gives the fair case for the reader a scene (the map is open to everyone so the edge goes to whoever reads best), keeps every company line labelled ITS WORDS, and ends on the open question of who gets the first look and who pays for the first hole."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "cross-section-cutaway", "motion_vector": "vertical-descent", "hero_treatment": "instrument-as-subject", "layout": "fullbleed-split",
                        "register": "editorial-schematic", "palette": palette, "camera_strategy": "slow pushes on a side view of the ground with a craneDown into the rock and a dollyThrough on the bench", "light_story": "a cold dusk over tundra turf with a pond, a self-lit glow in the rock, a lamp-lit bench, a cold space with a globe, then a pale dawn with the steel bit boring down through the rock",
                        "metaphor": "a brass plumb bob that hangs a hair above the map while a steel drill bit is the only thing that goes down"},
        "palette": palette,
        "divergence_note": ("10-21 was a pewter-lilac and teal beach with a tawny calf and survey orange. 10-20 was a celadon and walnut office with a manila folder and fireweed magenta. 10-18 was a blue-hour indigo and rose world with a mustard felt bench. "
                            "This film is a dark spruce-ink survey table with vellum, brass, periwinkle and lichen green and one vermilion thread, and it moves through a table, a map, a lamp lit bench, a dusk tundra, a rock cutaway and a globe, with an instrument hero and a top-down map view."),
        "treatment": {"winner": "The Dramatist's Plumb (a brass bob that hangs a hair above the ground and can't come down), with the Comedian's sleeping drill bit as the throughline that wakes act by act, the Explainer's flight-line ribbon around the Earth, and the Enthusiast's open-map bench as the fair case.",
                      "why": "A hanging reader with a face carries emotion and the whole thesis in one image, the sleeping steel bit gives the film a quiet joke and a payoff and is the only thing that grades, and the fair case for the reader gets a full scene before the film narrows honestly."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A brass plumb bob with bone eyes swings in on a hairline string over a dark survey sheet and stops a hair above a blue patch while a helicopter lays red flight lines.",
                 "headline": "45,800 KM OF ALASKA ROCK", "motion_by_s": 0.3,
                 "loopback": "The last frame is the same table, Plumb a hair above the same blue patch, but the steel bit is awake beside him and spinning into the ground."},
        "open_loop": {"plant_t": b_at(1), "pay_t": b_at(46), "what": "Will the hanging weight ever come down? Planted as Plumb stops a hair above the blue patch, paid at the button when the steel bit goes in beside him and Plumb still hangs."},
        "open_loop_2": {"plant_t": b_at(49), "pay_t": b_at(37), "what": "What is under the tarp? Planted as the moss tarp twitches when the survey bird passes, paid as the tarp lifts on a steel drill bit that shakes its head."},
        "throughline": {"object": "the sleeping steel drill bit", "lands_in_button": "the bit awake and spinning into the ground beside the hanging Plumb",
                        "states": [
                            {"at_s": b_at(6), "state": "asleep under a moss tarp in the corner, Zzz"},
                            {"at_s": b_at(53), "state": "the sleeper turns over under the tarp"},
                            {"at_s": b_at(49), "state": "the tarp twitches as the survey bird passes"},
                            {"at_s": b_at(47), "state": "one steel eye opens under the tarp and watches the readers"},
                            {"at_s": b_at(37), "state": "the tarp slides off and the bit sits up and shakes its head"},
                            {"at_s": b_at(39), "state": "standing with the tarp as a cape beside the partners' thermos"},
                            {"at_s": b_at(46), "state": "spinning into the ground beside Plumb"}]},
        "reveals": [
            {"t": b_at(3), "type": "build-on", "what": "vermilion flight lines fill the vellum sheet row on row like a mown lawn", "hold_s": 0.7},
            {"t": b_at(24), "type": "scale-pullback", "what": "two sheets of lines lift off as one red ribbon that winds around a globe more than once", "hold_s": 0.7},
            {"t": b_at(36), "type": "build-on", "what": "a banded rock block rises out of the glowing map", "hold_s": 0.6}],
        "tail_s": 3.2, "audio_arc": {"build_steps": 4, "dip_at": round(b_at(45) - 0.5, 3), "riser_at": round(b_at(52), 3), "silence_at": round(b_at(46) - 0.35, 3),
                      "payoff_at": b_at(46), "button_pattern": "question", "interrupt_at": b_at(18), "extra_dips": [b_at(37)]},
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
    book.raise_if_missing("board_1022 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1022Ids.ts").write_text(
        "// GENERATED by scripts/board_1022.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
