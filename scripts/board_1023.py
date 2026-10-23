#!/usr/bin/env python3
"""2026-10-23 "The Rule That Stops at the Fence": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1023.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1023.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "thunk", "Dotty", "rises out of a slot in the floor of the lit ground floor and locks upright", "proud", "THE WEATHER RULE IS A FORM",
  "wide on a snowy three floor paper building in cutaway, snow falling, Dotty the borough form rises out of a slot in the floor of the lit ground floor and snaps upright with a squash, a rain gauge on a post standing in the snow beside the building",
  "her cowlick bounces and the lit window flickers", ""),
 (2, 1, 0, W("form"), "wind hush", "building", "pulls back to show the lit floor under two dark floors", "proud", "BOROUGH LAND",
  "the camera pushes in on Dotty then pulls back to the whole building, the ground floor glowing and labelled BOROUGH LAND, the two floors above dark, each with a small hollow question mark",
  "the lit window flickers and snow drifts past", ""),
 (3, 1, 1, 0.0, "thunk", "stamp", "strikes the date onto Dotty's header band", "proud", "OCT 20TH",
  "the camera slides in on Dotty as the stamp comes down and strikes OCT 20TH onto her header band in emerald ink",
  "the strike makes her sheet jump and the ink print blooms", ""),
 (5, 1, 1, W("effect"), "snap", "tag", "swings onto the door frame", "proud", "IN EFFECT RIGHT AWAY",
  "a tag swings onto the door frame, IN EFFECT RIGHT AWAY, and the window light flares once",
  "the tag swings", ""),
 (6, 2, 2, 0.0, "snow hush", "parcel plane", "tilts in with the borough's own parcels lighting emerald", "plain", "BOROUGH LAND",
  "the camera drops from the roof onto a tilted snow plane of land parcels where the borough's own parcels light emerald and the rest stay white and fir green, BOROUGH LAND",
  "the dashed borders crawl and snow drifts", ""),
 (7, 2, 2, W("lease"), "tap", "Dotty", "walks onto an emerald parcel", "proud", "COMMERCIAL LEASE OR LAND USE PERMIT",
  "Dotty walks in on her paper legs and stands on an emerald parcel beside the rain gauge on its post, a plate reads COMMERCIAL LEASE OR LAND USE PERMIT",
  "her boots plant and her sheet sways", ""),
 (8, 2, 2, W("permit"), "snap", "tack", "drops and pins Dotty to the parcel", "proud", "PINNED TO BOROUGH LAND",
  "an ink tack drops onto Dotty's page and pins her to the parcel",
  "the tack bounces and her page flutters", ""),
 (9, 2, 3, 0.12, "wind", "berry bush", "slides into view on a snowy parcel", "curious", "A CASUAL-USE PARCEL",
  "the camera slides to a snowy parcel, Dotty leaning toward it on her tack",
  "the bush sways and the tracks draw on", ""),
 (56, 2, 3, W("berry"), "swish", "berry bush", "shakes its berries", "curious", "BERRY PICKING",
  "a berry bush shakes its berries as the label prints, BERRY PICKING, and a pair of ski tracks draw on beside it and finish on the word skiing, SKIING",
  "the bush sways", ""),
 (10, 2, 3, W("banned"), "slam", "NO glyph", "slaps down in front of Dotty and she leans back", "wary", "GEOENGINEERING BANNED · CASUAL-USE LAND",
  "an ink NO glyph slaps down across the parcel in front of Dotty and she leans back because there is no form to fill there, GEOENGINEERING BANNED, CASUAL-USE LAND",
  "the glyph rattles and Dotty leans back", ""),
 (11, 3, 4, 0.0, "pop", "Dotty", "reads her own boxes aloud as they pop open", "proud", "THE FORM ASKS",
  "close on Dotty against a pale snow window wall as her four boxes pop open one after another and she reads them aloud, CHEMICALS typing in, the rain gauge with its empty second hook beside her",
  "her eyes drop to each box in turn and the cowlick sways", ""),
 (12, 3, 4, W("flares"), "click", "FLARES box", "types in", "proud", "FLARES",
  "the FLARES box types in and a tick pops",
  "the typed ink flickers on", ""),
 (13, 3, 4, W("often"), "click", "FLIGHTS box", "types in", "proud", "HOW OFTEN · HOW LONG",
  "the FLIGHTS box types in with how often and how long and a tick pops",
  "the typed ink flickers on", ""),
 (14, 3, 4, W("outcome"), "ding", "INTENDED OUTCOME box", "fills last and ticks", "beam", "THE OUTCOME THEY INTEND",
  "the INTENDED OUTCOME box fills last and its tick pops, Dotty beaming, the second hook on the gauge beside her bobbing empty",
  "her cheeks glow and the empty hook swings", ""),
 (15, 4, 5, 0.0, "water lap", "map", "drops in from above as a late summer bay map", "plain", "AUG 23RD",
  "the view whips to a late summer map of Kachemak Bay from above, green shore, low gold sun and blue water with a calendar chip, AUG 23RD",
  "the water shimmers and the sun glints", "rehook: the summer bay"),
 (16, 4, 5, W("company"), "tick", "putty tag", "swings in", "plain", "RAINMAKER · CALIFORNIA",
  "a putty tag, RAINMAKER, CALIFORNIA, swings in beside the shore",
  "the tag swings", ""),
 (17, 4, 5, W("drone"), "whir", "SeedDrone", "lifts off two launch pins and climbs", "plain", "A DRONE · TWO SITES",
  "a grey seeding drone lifts off from two launch pins and climbs northeast over the shore, A DRONE, TWO SITES",
  "the rotors blur and its shadow slides over the shore", ""),
 (18, 4, 5, W("twenty", 2), "ping", "dashed line", "stretches out from Homer to the pins", "plain", "20 MILES NE OF HOMER",
  "a dashed line stretches from a Homer pin out to the launch pins, 20 MILES NE OF HOMER",
  "the dashes crawl", ""),
 (19, 5, 6, 0.0, "pour", "silver iodide", "pours from the drone's rack in a thin stream", "plain", "ITS REPORT",
  "high over the bay in late summer light the drone's flare rack pours a thin stream toward a weighing pan, ITS REPORT",
  "the stream shimmers and the rotors blur", ""),
 (20, 5, 6, W("three"), "tick", "weighing pan", "grows a small heap under the stream", "plain", "SILVER IODIDE · ABOUT 375 G",
  "the thin silver stream builds a small heap on a weighing pan under the drone, SILVER IODIDE, ABOUT 375 G, ITS REPORT",
  "the heap glints", ""),
 (21, 5, 6, W("Rainmaker"), "flick", "putty tag", "swings in over a square map tile", "plain", "RAINMAKER SAYS",
  "a putty tag, RAINMAKER SAYS, swings in over a square map tile that slides up into view and stays on the tile to the end of the shot",
  "the tag swings and the tile edges shimmer", ""),
 (22, 5, 6, W("hundredth"), "tick", "ruler", "marks a hairline on the tile edge", "plain", "ABOUT 0.01 IN OF RAIN · RAINMAKER SAYS",
  "a ruler tick marks a hairline height on the tile edge, ABOUT 0.01 IN OF RAIN, RAINMAKER SAYS",
  "the tick flashes and settles", ""),
 (23, 5, 6, W("nineteen"), "roll", "gallon counter", "rolls up while a sheet of water floods the tile", "plain", "RAINMAKER SAYS · 19 MILLION GALLONS",
  "a gallon counter rolls up to 19 MILLION GALLONS while a sheet of water floods the whole tile, RAINMAKER SAYS",
  "the counter rolls and the flood ripples", ""),
 (24, 5, 6, W("square"), "ratchet", "camera", "dives to the tile's edge where the flood is a thin film beside a gauge", "curious", "100 SQUARE MILES · ABOUT 0.01 IN · RAINMAKER SAYS",
  "the label 100 SQUARE MILES prints on the tile and the camera dives to its edge where the flood is a thin film thinner than a sheet of paper that matches the water line in a rain gauge beside it, the counter still reading 19 MILLION GALLONS, and the tag ABOUT 0.01 IN, AUG 23RD, RAINMAKER SAYS peels off the tile edge and hangs itself on the gauge's first hook",
  "the film glints and the ruler ticks", ""),
 (25, 6, 7, 0.0, "tick stream", "forecast trace", "draws itself across a panel", "plain", "REAL TIME WEATHER",
  "a forecast panel with an observed line and a predicted line draws itself across a late summer sky, real time weather ticks streaming in",
  "the trace draws and the ticks stream", ""),
 (60, 6, 7, W("Stratus"), "ratchet", "putty plate", "swings onto the panel", "plain", "ITS WORDS · STRATUS",
  "a putty plate, ITS WORDS, STRATUS, swings onto the panel",
  "the plate swings", ""),
 (26, 6, 7, W("picking"), "click", "window marker", "clicks onto the time bar and the drone slides along", "plain", "PICKS THE SEEDING WINDOWS",
  "a window marker clicks onto the time bar, PICKS THE SEEDING WINDOWS, the drone slides along under it and a hollow question mark with the word WHO rises over the window and then drifts up out of the panel on the whip into the next shot",
  "the marker settles and the question bobs", "plant: the question mark"),
 (27, 7, 8, 0.0, "board creak", "Dotty", "stands at the foot of the stair looking up", "curious", "SO WHAT CAN A BOROUGH REACH?",
  "the camera starts low inside the lit ground floor looking up the stair as the question mark from the last shot floats down into view at the top of the dashed stair, Dotty at the foot of the stair looking up through two dark floors, SO WHAT CAN A BOROUGH REACH?",
  "her cowlick sways and the lit window flickers", "rehook: the stair"),
 (28, 7, 8, W("mayor"), "tap", "mayor card", "slides in beside the stair as Dotty starts to climb", "plain", "MAYOR PETER MICCICHE",
  "a name card, MAYOR PETER MICCICHE, slides in beside the stair as Dotty starts to climb",
  "the card flutters and Dotty's boots start up", ""),
 (29, 7, 8, W("limited"), "thud", "painted line", "stops the solid stair at the ceiling of the lit floor", "plain", "\"LIMITED TO BOROUGH LANDS AT THIS POINT\" · MAYOR MICCICHE",
  "Dotty climbs and the solid stair stops at a painted borough line, a quote plate reads LIMITED TO BOROUGH LANDS AT THIS POINT, MAYOR MICCICHE, and the stair beyond it is only dashes rising through a dark floor",
  "her boots plant on the line and the dashes crawl", ""),
 (30, 7, 9, 0.0, "clank", "FAA hatch", "wakes and rattles its padlock far above the dashed stair", "wary", "THE HATCH WAKES",
  "the locked round hatch with a padlock, drawn dark at the top of the dashed stair from the start of the shot, wakes and rattles, Dotty goes on tiptoe and the hollow question mark drifts up toward the padlock",
  "the padlock rattles and Dotty goes on tiptoe", ""),
 (54, 7, 9, W("FAA"), "ping", "FAA plate", "swings onto the hatch", "wary", "\"THE FAA CONTROLS THE SKIES\" · MAYOR MICCICHE",
  "an ink plate, FAA, swings onto the hatch as the quote types, THE FAA CONTROLS THE SKIES, MAYOR MICCICHE, and on the word skies the hollow question mark bounces off the padlock once and falls down the dashed stair through the cut",
  "the plate swings", ""),
 (31, 8, 10, 0.0, "board creak", "state office", "cuts to an empty state office where the question mark lands on a dead desk", "plain", "THE DARK MIDDLE FLOOR",
  "the view cuts to the inside of the dark middle floor at eye level, the dashed stair rising up through a hole in its floor and out through its ceiling toward the hatch, an empty chair and a dead desk, the question mark lands on the desk",
  "the question mark settles and dust drifts", ""),
  (58, 8, 10, W("Department"), "tick", "DNR plate", "swings onto the dead desk", "plain", "DNR",
  "a plate, DNR, swings onto the dead desk",
  "the plate swings", ""),
 (59, 8, 10, W("law"), "tick", "law plate", "types on", "plain", "STATE LAW DOESN'T ADDRESS CLOUD SEEDING",
  "the plate types on, STATE LAW DOESN'T ADDRESS CLOUD SEEDING, finishing on the words cloud seeding",
  "the plate types", ""),
 (32, 8, 10, W("seeding"), "flicker", "ceiling fixture", "flickers cold twice and fails", "plain", "THE QUESTION STAYS",
  "a dead ceiling fixture flickers cold twice and fails while the dashed stair in the middle of the room flickers with it",
  "the fixture flickers and dust drifts", ""),
 (33, 9, 11, 0.0, "swish", "Dotty", "looks up at the gauge, then down at her own tack", "proud", "THAT LIMIT",
  "at the foot of the building in the snow Dotty looks up at the rain gauge spinning its cups above her with nobody reading it, then down at her own tack, and pats it",
  "her eyes go up and down and her hand pats the tack", "rehook: the fair case"),
 (34, 9, 11, W("permit"), "tick", "plate", "swings in", "proud", "A LAND PERMIT",
  "a plate swings in over the snow, A LAND PERMIT, while Dotty turns back toward her parcel",
  "the plate swings", ""),
 (53, 9, 11, W("weather"), "tick", "plate", "swings in under the first", "proud", "NOT A WEATHER GAUGE",
  "a second plate swings in under the first, NOT A WEATHER GAUGE, as the gauge's cups keep spinning with nobody reading them",
  "the second plate swings and the cups spin", ""),
 (35, 9, 12, 0.0, "thud", "mayor card", "lands on the left pan of a balance", "plain", "MAYOR: MISLED ABOUT WHAT RAINMAKER PLANNED",
  "a name card lands on the left pan of a balance on a snow table and the pan drops, MAYOR MICCICHE, MISLED ABOUT WHAT RAINMAKER PLANNED",
  "the beam rocks and settles low on the left", ""),
 (36, 9, 12, W("Rainmaker's"), "thud", "CEO card", "lands on the right pan", "plain", "RAINMAKER'S CEO",
  "a matching card lands on the right pan, RAINMAKER'S CEO, and the beam swings up through level",
  "the beam rocks", ""),
 (37, 9, 12, W("permission"), "type", "CEO card", "types its line", "plain", "HAD EVERY PERMISSION IT NEEDED",
  "the right hand card types its line, HAD EVERY PERMISSION IT NEEDED",
  "the line types on", ""),
 (38, 9, 12, W("outreach"), "drop", "outreach line", "types under the first line on the CEO's own card", "plain", "COULD HAVE DONE MORE OUTREACH",
  "a second smaller line types under the first on the CEO's card, COULD HAVE DONE MORE OUTREACH, and the beam swings back and forth through level and never settles on either side",
  "the beam swings through level and the snow drifts", ""),
 (39, 10, 13, 0.0, "slide", "copy of Dotty", "slides under a tall door in the dark middle floor", "plain", "ASSEMBLY ASKED THE LEGISLATURE",
  "back on the dark middle floor a copy of Dotty with two empty boxes slides under a tall door, ALASKA LEGISLATURE, ASSEMBLY ASKED THE LEGISLATURE, the question mark still on the dead desk",
  "the bill slides and the dust drifts", ""),
 (40, 10, 13, W("ban"), "tick", "BAN box", "presses into a tick on the copy of Dotty", "plain", "BAN",
  "a box on the copy of Dotty that slid under the door presses down into an emerald tick, BAN",
  "the copy shifts", ""),
 (41, 10, 13, W("least"), "tick", "REGULATE box", "presses into a tick on the copy of Dotty", "plain", "OR AT LEAST REGULATE",
  "a second box on the copy of Dotty presses down into an emerald tick, OR AT LEAST REGULATE, and the copy waits under the door",
  "the copy shifts", ""),
 (42, 10, 13, W("Sarah"), "slide", "Vance card", "slides in beside the door", "plain", "REP. VANCE",
  "a name card, REP. VANCE, slides in beside the door",
  "the card flutters", ""),
 (43, 10, 13, W("sponsor"), "pencil scratch", "dashed bill", "unfolds in dashes beside the card", "plain", "A BILL",
  "a dashed outline bill unfolds beside the card, A BILL",
  "the dashes crawl", "rehook: the conditional bill"),
 (44, 10, 13, W("reelected"), "flicker", "dashed light", "comes on under the question mark", "plain", "THE LEGISLATURE · IF IT ACTS",
  "the words IF RE-ELECTED print under the dashed bill and the dead fixture comes back as a dashed outline glow above the desk lighting the question mark, THE LEGISLATURE, IF IT ACTS",
  "the dashed light pulses", ""),
 (45, 10, 14, W("template"), "whir", "copier", "feeds copies of Dotty up the dashed stair into the dark state office", "proud", "A TEMPLATE THE STATE COULD COPY",
  "a copier whirs and feeds copies of Dotty up the dashed stair into the dark middle floor A TEMPLATE THE STATE COULD COPY, the copies rising up the dashed stair through the floor hole, one copy waiting on the top step in front of the dark door",
  "the copies climb", ""),
 (46, 11, 15, 0.0, "tick", "Dotty", "stands with her filled page beside the rain gauge", "wary", "WHAT IT INTENDS",
  "close on Dotty beside the rain gauge in the snow window light, her four boxes ticked under a plate that prints WHAT IT INTENDS on the word, the gauge tagged ABOUT 0.01 IN, RAINMAKER SAYS, on its first hook and its second hook bare",
  "the empty hook swings and her eyes drop to it", ""),
 (47, 11, 15, W("checks"), "ping", "radar sweep", "swings in on a putty plate", "plain", "ITS WORDS · RADAR AND SATELLITE CHECK",
  "a putty plate with a radar sweep, ITS WORDS, RADAR AND SATELLITE CHECK, swings in and Dotty turns and holds her filled page up to the sweep, the sweep passes over it and her four boxes stay intent only",
  "the sweep turns and Dotty lifts her page", ""),
 (48, 12, 16, 0.0, "paper riffle", "report pages", "riffle past the rain gauge", "wary", "THE REPORTS WE FOUND",
  "a stack of report pages riffles past in front of the rain gauge, THE REPORTS WE FOUND, the second hook still empty",
  "the pages riffle and the empty hook swings", ""),
 (49, 12, 16, W("outside"), "thunk", "tag", "drops onto the empty hook and swings", "plain", "OUTSIDE CHECK · NOT IN THE REPORTS WE FOUND",
  "a tag drops onto the empty second hook and swings, OUTSIDE CHECK, NOT IN THE REPORTS WE FOUND, held legible to the end of the shot",
  "the tag swings", "pay: the empty hook"),
 (50, 12, 16, W("rain"), "tick", "hairline film", "glints in a small inset beside the gauge", "wary", "THAT RAIN",
  "a small inset of the hairline film from the dive glints beside the gauge, THAT RAIN, desaturated",
  "the film glints", ""),
 (51, 13, 17, 0.0, "creak", "Dotty", "looks from the gauge to the camera", "ask", "LOOKS FROM THE GAUGE TO YOU",
  "a hard cut to the frame one wide at flat noon, the whole building under its two dark floors, the rain gauge on its post and Dotty small in the snow beside it looking from the gauge to the camera",
  "the tagged hook swings and snow drifts", ""),
 (52, 13, 17, W("Who"), "wind hush", "plate", "holds the question", "ask", "WHO ASKS WHAT CAME OUT?",
  "the question WHO ASKS WHAT CAME OUT? holds over the wide under flat noon light, the building with its one lit floor",
  "snow drifts and the window glows", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "eye", "building-exterior", "cross-section-cutaway", "stacked-layers", "vertical-rise", "single-organic-hero", "", "",
  "The form rises", "Dotty rises out of a slot in the lit ground floor of a snowy paper building under two dark floors and a stamp dates the rule on her header."),
 (2, 2, "alt-vantage", "medium", "high", "snow-parcel-plane", "top-down-map", "map-territory", "horizontal-traverse", "landscape-as-subject", "match-action", "match",
  "Borough land", "A tilted plane of parcels lights emerald where the borough owns it, Dotty is pinned down beside a rain gauge and leans back from a casual use parcel."),
 (3, 4, "subject-portrait", "close", "eye", "snow-window-wall", "macro-closeup", "single-object-void", "radial-emanate", "single-organic-hero", "carried-element", "carry",
  "Her four boxes", "Dotty reads her own boxes aloud as chemicals, flares, flights and the intended outcome type in and tick beside a rain gauge with an empty second hook."),
 (4, 5, "map-territory", "extreme-wide", "high", "summer-bay-map", "orbital-aerial", "map-territory", "horizontal-traverse", "landscape-as-subject", "whip-pan", "travel",
  "August 23rd", "A late summer map of Kachemak Bay, a drone lifts from two pins and a dashed line runs twenty miles northeast of Homer."),
 (5, 6, "push-detail", "medium", "eye", "summer-tile", "cross-section-cutaway", "fullbleed-split", "vertical-descent", "data-as-subject", "match-cut", "match",
  "Nineteen million gallons", "A silver iodide stream, a square tile, a flood of water and a camera dive that shows the flood is a hairline film matching the hairline in a rain gauge."),
 (6, 7, "data-panel", "insert", "eye", "forecast-sky", "instrument-screen", "hud-instrument-frame", "scroll-data", "instrument-as-subject", "whip-pan", "travel",
  "Stratus", "A forecast trace draws across a late summer sky and a window marker clicks onto a time bar while the drone slides along."),
 (7, 8, "wide-establish", "wide", "eye", "building-exterior", "cross-section-cutaway", "stacked-layers", "vertical-rise", "structure-as-subject", "whip-pan", "travel",
  "The stair that stops", "Dotty climbs a stair in the lit ground floor that stops at a painted line while the rain gauge stands in the snow outside the wall with its first hook tagged and its second bare, and a locked hatch rattles above and drops a question mark down the dashed stair."),
 (8, 10, "alt-vantage", "medium", "eye", "state-office", "eye-level-immersive", "single-object-void", "push-in-only", "landscape-as-subject", "carried-element", "carry",
  "The empty office", "The question mark lands on the dead desk of an empty dark state office."),
 (9, 11, "two-up", "wide", "low", "snow-base", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "whip-pan", "travel",
  "The fair case", "At the foot of the building Dotty looks up at the gauge, pats her tack and turns back to her parcel, then a balance holds the mayor's card and Rainmaker's CEO's."),
 (10, 13, "alt-vantage", "medium", "eye", "state-office", "eye-level-immersive", "grid-modular", "assemble-build", "multiplicity-swarm", "match-cut", "match",
  "The ask", "A copy of Dotty slides under the Legislature door and the assembly ticks BAN and OR AT LEAST REGULATE on it, a dashed conditional bill draws beside the Vance card, a dashed light comes on, and copies rise up the dashed stair through the floor hole."),
 (11, 15, "subject-portrait", "close", "eye", "snow-window-wall", "macro-closeup", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "match-action", "match",
  "What it asks", "Dotty beside the rain gauge with her ticked boxes, a tagged first hook and an empty second hook, and a radar sweep plate."),
 (12, 16, "macro-closeup", "insert", "eye", "snow-gauge", "macro-closeup", "single-object-void", "push-in-only", "instrument-as-subject", "carried-element", "carry",
  "Not in the reports", "Report pages riffle past the rain gauge on bare white snow and a tag drops onto the empty second hook."),
 (13, 17, "wide-establish", "extreme-wide", "eye", "building-exterior-noon", "cross-section-cutaway", "stacked-layers", "vertical-rise", "single-organic-hero", "hard-cut", "match",
  "The question", "A hard cut to the frame one wide at flat noon where Dotty stands small in the snow beside the rain gauge under the building and looks from the gauge to the camera."),
]

AMBIENT = {
 1: "snow falls, the lit window flickers, Dotty breathes, the cowlick sways, the gauge vane turns",
 2: "snow drifts, the dashed borders crawl, the bush sways, the tracks draw on",
 3: "the window light shifts, the typed ink flickers, the cowlick sways, the empty hook swings",
 4: "the water shimmers, the sun glints, the rotors blur, the dashes crawl",
 5: "the rotors blur, the stream shimmers, the flood ripples, sunlight glints",
 6: "the trace draws, the ticks stream, the rotors blur, the marker pulses",
 7: "the window flickers, the dashes crawl, the padlock rattles, snow drifts past the windows",
 8: "dust drifts, the blinds glow cold, the fixture flickers, the question bobs",
 9: "snow drifts, the beam rocks, the vane spins, the cowlick sways",
 10: "dust drifts, the dashed stair crawls, the blinds glow cold, the question bobs on the desk",
 11: "the window light shifts, the empty hook swings, the radar sweeps, the cowlick sways",
 12: "the pages riffle, the tag swings, the film glints, snow falls",
 13: "snow drifts, the tagged hook swings, the window glows, the vane turns",
}
CENTER = {1: "Dotty at x440 y1250", 2: "the parcel at x540 y1100", 3: "Dotty at x470 y1100", 4: "the map at x540 y1000", 5: "the tile at x540 y1000", 6: "the panel at x540 y1000",
          7: "the stair at x540 y1000", 8: "the desk at x540 y1100", 9: "Dotty at x400 y1250", 10: "the door at x540 y1000", 11: "Dotty at x400 y1100", 12: "the gauge at x540 y1000", 13: "Dotty at x420 y1150"}
HERO = {
 1: ("Dotty + Building + stamp + rain gauge", "45% building, 35% Dotty, 20% stamp"),
 2: ("ParcelPlane + Dotty + rain gauge + NO glyph", "45% parcels, 30% Dotty, 25% gauge"),
 3: ("Dotty close-up + four boxes + rain gauge", "55% Dotty, 20% boxes, 25% gauge"),
 4: ("summer bay map + SeedDrone", "50% map, 30% drone, 20% plates"),
 5: ("SeedDrone + tile + flood + counter + gauge", "35% tile, 30% drone, 35% counter"),
 6: ("ForecastTrace + time bar + SeedDrone", "50% trace, 30% bar, 20% drone"),
 7: ("Building + Stair + Dotty + Hatch", "45% building, 30% Dotty, 25% hatch"),
 8: ("state office + dead desk + question mark", "50% room, 30% desk, 20% question"),
 9: ("Dotty + gauge + balance", "40% Dotty, 30% balance, 30% gauge"),
 10: ("door + bill + copier + copies", "35% door, 30% copies, 35% bill"),
 11: ("Dotty + rain gauge + radar plate", "50% Dotty, 30% gauge, 20% plate"),
 12: ("rain gauge + report pages + tag", "55% gauge, 25% pages, 20% tag"),
 13: ("Dotty + rain gauge + building", "40% Dotty, 30% gauge, 30% building"),
}
PARTS = {1: 62, 2: 56, 3: 60, 4: 50, 5: 56, 6: 40, 7: 64, 8: 48, 9: 50, 10: 56, 11: 54, 12: 40, 13: 52}
KICKS = (1, 24, 49)
STAGE3D = {k: "planes" for k in range(1, 14)}
for _k in (3, 6, 11, 12):
    STAGE3D[_k] = "flat:a locked panel with a slow drift where the typing boxes, the trace and the tag are the motion"
CAMERA = {1: "dollyThrough", 2: "craneDown", 3: "static:the typing boxes are the shot", 4: "craneDown", 5: "dollyThrough", 6: "static:the trace and the marker are the shot", 7: "riseWith",
          8: "dollyThrough", 9: "dollyThrough", 10: "truckAcross", 11: "static:the boxes and the sweep are the shot", 12: "static:the tag drop is the shot", 13: "dollyThrough"}

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

    palette = "first-snow white and mist-blue, a paper form hero with checkbox eyes, emerald borough ground, indigo and plum upper floors, a late summer viridian and gold bay, a single amber tag on the rain gauge's second hook, a black tack"
    board = {
        "run_date": "2026-10-23", "slug": "the-rule-that-stops-at-the-fence", "title": "The Rule That Stops at the Fence",
        "concept": ("On October 20th the Kenai Peninsula Borough Assembly passed a weather modification rule after California's Rainmaker flew a cloud seeding drone near Homer. The rule is a form that attaches to borough land only. "
                    "The film draws the form as Dotty, a paper character who is pinned to the borough's own ground and asks four things about a flight, beside a rain gauge, while the sky above belongs to the FAA and the state office is dark and empty. "
                    "It gives the fair case a scene (a land permit was never going to measure the weather, both sides are quoted, the assembly has asked the Legislature) and ends on one fact: the form asks what a flight intends, the gauge carries only Rainmaker's tag, and the reports found describe no outside check of the rain Rainmaker says it made."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "cross-section-cutaway", "motion_vector": "vertical-rise", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "tactile-collage", "palette": palette, "camera_strategy": "pull-backs from a desk to a three floor building, a tilted parcel plane, a dive into a hairline and a craneDown through the floors",
                        "light_story": "an overcast first-snow day, a lit ground floor under two dark floors, a late summer gold bay in flashback, a cool snow window wall with no lamp, cold grey blinds in an empty state office, then flat noon light on a rain gauge in the snow",
                        "metaphor": "a form that can only be pinned to the ground it stands on, beside a rain gauge with a hook nobody has hung an outside reading on"},
        "palette": palette,
        "divergence_note": ("10-22 was a dusk tundra survey table in spruce ink, brass and vermilion with a plumb bob. 10-21 was a pewter beach with a tawny calf. 10-20 was a celadon and walnut office with a manila folder and a lamp. "
                            "This film is a bright first-snow day with a paper form hero, an emerald borough accent, indigo and plum floors, a late summer viridian and gold flashback and an amber hook tag, and it moves through a snowy three floor building cutaway, a tilted parcel plane, a summer bay map, a forecast panel, an empty state office and a rain gauge in the snow. HONEST OVERLAP: a paper document hero with a face, as in 10-20, and a question that ends on an absence, as in 10-22."),
        "treatment": {"winner": "The Explainer's three floor building and the dive into 19 million gallons being a hairline, with the Comedian's characterized form (Dotty) as hero, a rain gauge with an empty hook as the throughline object, the Dramatist's conditional Vance bill, and the Enthusiast's fair-case template scene.",
                      "why": "A form with a face carries the thesis in one image (it can only be pinned to the ground it stands on), the lit floor under two dark ones makes jurisdiction a picture a muted viewer can read, and a rain gauge with a bare hook gives a planted promise that pays at the button."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A snowy paper building in cutaway with falling snow and a paper form with checkbox eyes rising out of a floor slot on the lit ground floor under two dark floors, a rain gauge on a post standing in the snow beside the building.",
                 "headline": "THE WEATHER RULE IS A FORM", "motion_by_s": 0.3,
                 "loopback": "The last frame is the same form standing in the snow beside the same rain gauge with the same building behind her, looking from the gauge to the camera at flat noon."},
        "open_loop": {"plant_t": b_at(7), "pay_t": b_at(49), "what": "What is the empty second hook on the rain gauge for? Planted as Dotty is pinned beside the gauge with its first hook empty too and its second hook bare, paid when a tag drops onto it reading NOT IN THE REPORTS WE FOUND."},
        "open_loop_2": {"plant_t": b_at(26), "pay_t": b_at(44), "what": "Who writes the rules for when it flies? Planted as a hollow question mark rises over the forecast window, paid when a conditional bill and one dashed light appear under it on the state office desk."},
        "throughline": {"object": "the rain gauge with an empty second hook", "lands_in_button": "Dotty beside the gauge, looking from its empty hook to the camera",
                        "states": [
                            {"at_s": b_at(1), "state": "standing in the snow beside the building"},
                            {"at_s": b_at(7), "state": "planted beside Dotty's parcel with a bare hook"},
                            {"at_s": b_at(24), "state": "the tag ABOUT 0.01 IN AUG 23RD RAINMAKER SAYS peels off the flood tile and hangs on its first hook, second hook bare"},
                            {"at_s": b_at(33), "state": "Dotty looks up at its tag and its spinning cups with nobody reading them"},
                            {"at_s": b_at(49), "state": "the second hook gets a tag NOT IN THE REPORTS WE FOUND"},
                            {"at_s": b_at(51), "state": "Dotty looks from it to the camera"}]},
        "reveals": [
            {"t": b_at(2), "type": "scale-pullback", "what": "the camera pulls back from Dotty to the whole building where only the ground floor is lit and two floors are dark with a question mark each", "hold_s": 0.7},
            {"t": b_at(24), "type": "scale-pullback", "what": "the camera dives from a flooded tile to its edge where the flood is a hairline film matching the gauge's hairline", "hold_s": 0.7},
            {"t": b_at(51), "type": "scale-pullback", "what": "a hard cut to the frame one wide where Dotty and the gauge are small under the building and two dark floors", "hold_s": 1.0}],
        "tail_s": 3.2, "audio_arc": {"build_steps": 4, "dip_at": round(b_at(51) - 0.3, 3), "riser_at": round(b_at(47), 3), "silence_at": round(b_at(49) - 0.35, 3),
                      "payoff_at": b_at(49), "button_pattern": "question", "interrupt_at": b_at(24), "extra_dips": [b_at(35)]},
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
    book.raise_if_missing("board_1023 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1023Ids.ts").write_text(
        "// GENERATED by scripts/board_1023.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
