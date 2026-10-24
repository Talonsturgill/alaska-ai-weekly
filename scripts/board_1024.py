#!/usr/bin/env python3
"""2026-10-24 "Seeing Is the Easy Part": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1024.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1024.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "thunk", "hot pixel", "slams on in a cold grid with an overshoot and a heat ring", "alarm", "ONE SQUARE · ONE FIRE",
  "black-indigo frame, a hard top-down false-colour grid of cold tiles, one amber square snaps on at frame 6 with an overshoot and throws a pulsing warm ring",
  "the ring pulses and the grid ticks drift", ""),
 (2, 1, 0, W("square"), "hush", "the Eye", "slides in from the top edge and leans over the square", "curious", "THE EYE",
  "the faced satellite slides in from the top edge, cyan iris wide, and tips forward over the pixel",
  "its wings flutter and the iris dilates", ""),
 (3, 1, 0, W("Somebody"), "ping", "scan reticle", "clamps on the pixel and a hollow question mark rises", "wary", "SOMEBODY HAS TO DECIDE",
  "four corner brackets snap inward onto the pixel and a hollow question mark rises off it",
  "the brackets settle and the question bobs", ""),
 (4, 2, 1, 0.0, "snap", "FireSat screen", "boots on as a different screen with the square carried in", "plain", "FIRESAT · A PROTOTYPE",
  "a hard cut to a FireSat sensor screen, a bezel, scanlines and a raw sensor strip of river braids, the square carried to a new place on it, a boxed tag reads FIRESAT, A PROTOTYPE",
  "the scanlines refresh and the river braids shimmer", ""),
 (5, 2, 1, W("two"), "pop", "second pixel", "ignites beside the first and both get a tag", "alarm", "MORAN FIRE · CHICKEN FIRE",
  "a second square ignites beside the first, two tags pop on, MORAN FIRE and CHICKEN FIRE, and the Eye's iris tracks from one to the other",
  "both squares pulse out of phase", ""),
 (6, 2, 1, W("image"), "click", "frame brackets", "close around both squares", "beam", "ONE IMAGE · JUNE 2025",
  "frame brackets slam around both squares and a date chip prints, ONE IMAGE, JUNE 2025",
  "the brackets settle and the iris glows cyan", ""),
 (7, 3, 2, 0.0, "whirr", "three FireSats", "glide across the dark limb of the Earth in single file", "plain", "3 OPERATIONAL FIRESATS · JULY",
  "a curved dark horizon of the Earth with cloud bands and a thin cyan rim, three faceless satellites glide across it in single file, each with a lens light that blinks on in turn",
  "the stars drift and the lens lights blink", "rehook: the orbit"),
 (8, 3, 2, W("July"), "bell", "lens lights", "all three go steady", "beam", "REACHED ORBIT THIS JULY",
  "all three lens lights go steady cyan and a boxed tag reads 3 OPERATIONAL FIRESATS, JULY",
  "the lights pulse softly", ""),
 (9, 3, 3, 0.0, "hum", "dashed ring", "sweeps outward over the Interior as the lead satellite tilts", "plain", "GOAL · EVERY 20 MINUTES · EARLY 2030S",
  "the lead satellite tilts and a dashed scan ring sweeps outward over the dark Interior around one lit square while a dashed plate reads GOAL, EVERY 20 MINUTES, EARLY 2030S",
  "the dashes crawl", ""),
 (10, 4, 4, 0.0, "snap", "Alaska", "snaps in as a state map where the dashed ring lands as the outline of its glowing Interior half", "plain", "ABOUT HALF OF U.S. WILDFIRE EMISSIONS",
  "a hard cut to the state of Alaska on the cold plate, the dashed ring from the last shot landing as the outline of the Interior half which glows a low dull ember with one brighter square in it",
  "the glow pulses and smoke wisps drift up", ""),
 (11, 4, 4, W("half"), "thump", "smoke stack", "builds fifty puffs in a tall column", "plain", "ABOUT HALF · PER MIT TECHNOLOGY REVIEW",
  "a tall column of grey smoke puffs builds beside the map, puff by puff, to a half-height mark, a plate reads ABOUT HALF, PER MIT TECHNOLOGY REVIEW",
  "the puffs bob", ""),
 (12, 4, 4, W("four"), "clink", "coins", "four steel coins drop beside the smoke and the Eye double takes", "wary", "AROUND 4% OF FEDERAL FIREFIGHTING FUNDS",
  "four steel-silver coins drop one by one beside the tall smoke column and a plate reads AROUND 4% OF FEDERAL FIREFIGHTING FUNDS while the Eye double takes",
  "the coins wobble and the Eye's iris snaps wide", ""),
 (13, 4, 4, W("Review"), "slide", "coins", "slide into a faint tray of one hundred slots beside the column", "plain", "OUT OF 100 · ILLUSTRATIVE",
  "the four coins slide into a faint tray of one hundred slots beside the column, four filled, a small plate reads OUT OF 100, ILLUSTRATIVE",
  "the tray glints", ""),
 (14, 5, 5, 0.0, "tick", "SEEING box", "ticks", "beam", "SEEING",
  "the Eye close in the middle of the frame with two boxes, SEEING ticks bone, a small lit square beside it",
  "the Eye breathes and its wings flutter", ""),
 (15, 5, 5, W("Deciding"), "hit", "DECIDING box", "slams down empty with a hollow question mark", "wary", "DECIDING",
  "a dashed DECIDING box slams down beside it, empty, with a hollow question mark and the Eye's iris drops sheepishly",
  "the box rattles and the Eye droops", "rehook: the hard part"),
 (16, 6, 6, 0.0, "slide", "Yukon Flats", "slides in as a braided river basin from above", "plain", "YUKON FLATS",
  "a top-down braided river basin in cold false colour, the refuge outline drawn dashed in bone, rivers in cyan",
  "the rivers shimmer and the grid drifts", ""),
 (17, 6, 6, W("acres"), "click", "pilot box", "lights over a section of the refuge", "plain", "1.6 MILLION ACRES · A PILOT",
  "a pilot box lights bright over a section of the refuge and a plate reads 1.6 MILLION ACRES, A PILOT",
  "the box edge pulses", ""),
 (18, 6, 6, W("sends"), "tap", "crew dots", "arrive in a line and wait at the edge of the box", "plain", "CREWS",
  "small crew dots walk in along the river in a line and stop at the edge of the pilot box",
  "the dots shuffle", ""),
 (19, 6, 6, W("fire"), "alarm", "fire pixel", "ignites inside the box and a clock ring appears", "alarm", "72 HOUR CLOCK",
  "a hot square ignites inside the pilot box and a radial 72:00 clock ring draws itself around it",
  "the pixel pulses and warm rings spread", ""),
 (20, 6, 6, W("seventy"), "roll", "clock ring", "drains while the crews hold at the edge", "plain", "ATTACK ONLY IF CONTAINED IN 72 HOURS",
  "the clock ring drains while the crew dots hold at the edge of the box and a plate reads ATTACK ONLY IF CONTAINED IN 72 HOURS",
  "the clock drains and the dots shuffle", ""),
 (21, 7, 7, 0.0, "drone", "scoreboard", "boots up with a ten minute stopwatch", "plain", "XPRIZE · ALASKA · JUNE · 10 MINUTES",
  "a contest scoreboard boots on, a stopwatch counting down from 10:00 and a plate XPRIZE, ALASKA, JUNE, 10 MINUTES, over a top-down arena of cold land with three decoy squares, an ILLUSTRATION",
  "the stopwatch ticks and the scanlines refresh", ""),
 (22, 7, 7, W("robots"), "whirr", "drone silhouette", "races across the arena over the decoys with a stopwatch snap", "plain", "FIND AND PUT OUT",
  "a faceless generic drone icon races across the arena over the decoy squares toward the real fire pixel and the stopwatch snaps",
  "the rotors blur and the shadow slides", "rehook: the race"),
 (23, 7, 7, W("found"), "bell", "DETECTED flag", "pops on the fire and a dashed put-out ring beside it stays empty", "plain", "AURA FORESIGHT · MET THE DETECTION GATE",
  "a DETECTED flag pops on the fire pixel and the stopwatch freezes at the gate line, a plate reads AURA FORESIGHT, MET THE DETECTION GATE, and beside it a dashed ring labelled PUT OUT, NO RESULT STATED stays empty",
  "the flag flutters and the dashed ring crawls", "plant: did anyone put it out"),
 (24, 8, 8, 0.0, "hum", "ghost panel", "fades up as a lit glass pane with a dashed edge beside the Eye", "plain", "INTENDS TO BUILD · AI TRIAGE TOOL",
  "a translucent glass pane with a dashed edge fades up beside the Eye, a plate reads EDF, INTENDS TO BUILD, AI TRIAGE TOOL",
  "the dashes crawl and the Eye leans in", ""),
 (25, 8, 8, W("fight"), "whoosh", "Eye wing", "tilts toward the dashed button and a dashed line from the wingtip passes through it", "plain", "A PLAN",
  "the Eye's solar wing tilts toward a dashed button on the pane and a dashed line from the wingtip passes straight through it",
  "the dashes crawl", ""),
 (26, 8, 9, 0.0, "swell", "acre counter", "flickers on the pixel and a strike crosses it", "wary", "ACRES BURNED · THE WRONG NUMBER?",
  "an acres counter flickers over the hot pixel and a strike slashes through it while a plate asks ACRES BURNED, THE WRONG NUMBER?",
  "the counter flickers and the strike draws", "rehook: the floor"),
 (27, 8, 9, W("number"), "thump", "camera", "plunges through the square into the ground", "alarm", "THROUGH THE FLOOR",
  "the camera falls through the hot square, the grid cells break up and dissolve into irregular strata and the whole frame drops with it",
  "the grid dissolves into soil", ""),
 (28, 9, 10, 0.0, "hush", "two soil columns", "rise into frame, unburned on the left and burned on the right, each with a probe hovering", "plain", "TWO GROUNDS",
  "two layered cuts side by side, the unburned one on the left with moss on top, peat, then ice and the burned one on the right with char on top, a foot ruler down the left edge, and a steel probe hovering over each",
  "the moss sways and the ice glints", ""),
 (29, 9, 10, W("frozen"), "thunk", "left probe", "drops and stops dead on the ice", "alert", "UNBURNED · FROZEN ABOUT A FOOT DOWN",
  "the left probe drops through the peat and stops dead on the ice at the 1 FT mark, the handle jolts, a chip of ice flies and a plate prints over the left column, UNBURNED, FROZEN ABOUT A FOOT DOWN, then the right column's thaw front starts to glow faintly while its probe twitches",
  "the handle shakes and a chip of ice flies", ""),
 (31, 9, 11, 0.0, "slide", "right probe", "starts down over the burned column as its thaw front glows", "alert", "BURN SCAR · JULY 2021",
  "the right probe starts down over the burned cut as ash drifts up and the dull thaw front glows and a plate reads BURN SCAR, JULY 2021",
  "ash drifts up and the thaw front glows", ""),
 (32, 9, 11, W("plunged"), "crack", "right probe", "plunges through the mark where the ice should have stopped it", "alarm", "AT LEAST 3 TIMES DEEPER",
  "the right probe punches down through the 1 FT mark and keeps going while the ice around it dissolves",
  "the rod blurs and ice chips fly", ""),
 (33, 9, 11, W("deeper"), "knock", "ruler", "marks 3 FT beside the left column's 1 FT", "alarm", "BURN SCAR · AT LEAST 3 TIMES DEEPER",
  "the right probe lands past 3 FT and a plate reads BURN SCAR, AT LEAST 3 TIMES DEEPER, the left column's 1 FT mark glowing beside it",
  "the handle shudders and the thaw front pulses", ""),
 (34, 10, 12, 0.0, "rumble", "burned plain", "opens wide as the first amber motes lift off the glow", "plain", "2007 ANAKTUVUK RIVER FIRE",
  "the thaw glow lifts off the burned column as the first amber carbon motes and opens to a wide burned plain under a low smoke sky, a plate reads 2007 ANAKTUVUK RIVER FIRE",
  "the motes rise and the smoke drifts", ""),
 (35, 10, 12, W("million"), "roll", "carbon counter", "rolls up to two million tons", "alarm", "2 MILLION+ TONS OF CARBON",
  "a counter rolls up to 2 MILLION+ TONS OF CARBON as the stream of amber motes thickens",
  "the counter rolls and the motes thicken", ""),
 (36, 10, 12, W("So"), "thunk", "hot pixel", "sinks into the peat and goes dark", "heavy", "THE LOSS IS THE GROUND · OUR READ",
  "the hot square sinks slowly through the char into the peat, going from bright to a heavy dark orange, and a plate reads THE LOSS IS THE GROUND, OUR READ",
  "the pixel dims as it sinks", ""),
 (37, 11, 13, 0.0, "hush", "cold ground", "drains the warmth from the frame as a name plate arrives", "plain", "MICHELLE MACK · NORTHERN ARIZONA UNIVERSITY",
  "a cold ice-cyan cut of ground with the hot square sunk deep in the peat and small crew dots on the surface far above, a plain name plate MICHELLE MACK, NORTHERN ARIZONA UNIVERSITY slides in over the cold frame",
  "the frost glints and the crew dots shuffle", "rehook: the doubt"),
 (38, 11, 13, W("suppression"), "tick", "doubt line", "types out and holds with the hose water stopping short of a dashed ring", "plain", "SUPPRESSION · IMPACT NOT CLEAR",
  "a plain line types out and holds, SUPPRESSION, IMPACT NOT CLEAR, while the hose water arcs down toward the ground and a hollow question mark sits in the distance still to cover",
  "the hoses spray and the pixel stays dark", ""),
 (39, 12, 14, 0.0, "drone", "two columns", "sink to the same depth, a fought one and a left one", "wary", "IF THE DOUBT HOLDS",
  "a split frame, FOUGHT on the left and LEFT on the right, each a ground cut with a hose or nothing above it, and both thaw fronts sink to the same depth, a plate reads IF THE DOUBT HOLDS",
  "the thaw fronts sink", ""),
 (40, 12, 15, 0.0, "hit", "fought column", "snaps back to frozen at one foot while the left one sinks further", "wary", "IF THE DOUBT IS WRONG",
  "the FOUGHT column snaps back to frozen at 1 FT while the LEFT column sinks further, a plate reads IF THE DOUBT IS WRONG",
  "the thaw front rebounds and sinks", ""),
 (41, 13, 16, 0.0, "snap", "hot pixel", "arrives at a fork with three roads", "curious", "THREE CHOICES",
  "the hot square sits on a fork seen from above, three roads leaving it, FIGHT, LEAVE, SET, each a dim line",
  "the pixel pulses", "rehook: the fork"),
 (42, 13, 16, W("fight"), "click", "FIGHT road", "lights with a clock ring", "plain", "FIGHT",
  "the FIGHT road lights up with a small clock ring",
  "the ring ticks", ""),
 (43, 13, 16, W("leave"), "hush", "LEAVE road", "fills with grey smoke", "plain", "LEAVE",
  "the LEAVE road fills with drifting grey smoke",
  "the smoke drifts", ""),
 (44, 13, 16, W("purpose"), "sizzle", "SET road", "lights at the same brightness as the others", "plain", "SET A MILD FIRE",
  "the SET road lights a small flame at its start, no brighter than the FIGHT and LEAVE roads",
  "the flame flickers", ""),
 (45, 14, 17, 0.0, "fade", "spring ground", "opens at eye level in low sunrise light with a name plate", "plain", "EDWARD ALEXANDER · GWICH'IN COUNCIL INTERNATIONAL",
  "a low eye-level view of unplaced spring ground, birch green on tan, wet sunrise light, a far tree line, a name plate EDWARD ALEXANDER, GWICH'IN COUNCIL INTERNATIONAL slides in",
  "the grass sways and the light shifts", ""),
 (46, 14, 17, W("need"), "page", "quote plate", "types the quote as it is spoken", "plain", "\"WE NEED MILD FIRE, NOT WILDFIRE.\"",
  "a quote plate types as the words are said, WE NEED MILD FIRE, NOT WILDFIRE",
  "the plate types and the grass sways", ""),
 (47, 14, 17, W("wildfire"), "bloom", "small flame", "lights low on the ground in the middle distance", "plain", "MILD FIRE · THE IDEA",
  "a small low flame lights on the ground in the middle distance, candle scale, steady, and a small plate reads MILD FIRE, THE IDEA",
  "the flame flickers", ""),
 (48, 15, 18, 0.0, "slide", "plan view", "slides in as the top-down twin of the flame, a dashed burn unit beside a river bend", "plain", "CATG CREW · PLANNED",
  "a hard cut to a top-down plan view where the flame is a dashed twin at the edge of a dashed outline of a burn unit beside a river bend, a plate reads CATG CREW, PLANNED",
  "the dashes crawl and the river shimmers", ""),
 (49, 15, 18, W("Fort"), "crunch", "dashed flame line", "grows along the unit edge as a plan", "plain", "FORT YUKON · A PLAN, NOT A RESULT",
  "a dashed flame line grows along the unit edge, a plan and not a result, a plate reads FORT YUKON, and a line of crew dots in dashed outline stands at the corner",
  "the dashes crawl", ""),
 (50, 15, 18, W("spring"), "tick", "planned tag", "stamps onto the plan", "plain", "CATG CREW · PLANNED CULTURAL BURNS · NEXT SPRING",
  "a dashed plate stamps onto the plan, PLANNED CULTURAL BURNS, NEXT SPRING",
  "the plate settles", ""),
 (51, 16, 19, 0.0, "swell", "flame line", "condenses to a point and the camera lifts", "plain", "PLANNED, NOT YET LIT",
  "the dashed flame line condenses to a point at the unit edge and the camera begins to lift straight up",
  "the point glows faintly", ""),
 (52, 16, 19, W("Who"), "hush", "dashed square", "appears in orbit as a dashed ember square in a dashed boundary", "beam", "WHO SHOULD CHOOSE?",
  "the lift ends in orbit, the point is a dashed ember square on the cold grid inside a dashed boundary and the Eye beside it blinks calmly",
  "the square pulses softly and the Eye blinks", ""),
 (53, 16, 19, W("fought"), "ping", "ghost squares", "light one by one on fought, left and lit", "curious", "FOUGHT · LEFT · LIT",
  "three small ghost squares around the dashed square light one by one as the words fought, left and lit are said",
  "the ghost squares pulse", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "macro-closeup", "close", "overhead", "orbital-plate", "top-down-map", "single-object-void", "radial-emanate", "data-as-subject", "", "",
  "One square", "A cold false-colour grid, one amber square snaps on and the Eye slides in to look at it."),
 (2, 1, "data-panel", "medium", "overhead", "firesat-screen", "instrument-screen", "hud-instrument-frame", "push-in-only", "instrument-as-subject", "graphic-match", "match",
  "One image", "A hard cut to a FireSat sensor screen that carries the square to a new place, where two squares, Moran and Chicken, light in one image."),
 (3, 2, "wide-establish", "extreme-wide", "high", "earth-limb", "orbital-aerial", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "whip-pan", "travel",
  "Three in orbit", "Three faceless FireSats glide across the dark limb of the Earth and a dashed ring sweeps out over the Interior for the goal of a twenty minute scan."),
 (4, 4, "map-territory", "wide", "overhead", "alaska-plate", "top-down-map", "map-territory", "vertical-rise", "data-as-subject", "match-cut", "match",
  "Half and four", "The dashed ring lands as the outline of the glowing half of Alaska beside a smoke column while four coins drop and slide into a tray of a hundred."),
 (5, 5, "subject-portrait", "close", "eye", "eye-closeup", "macro-closeup", "single-object-void", "push-in-only", "single-organic-hero", "carried-element", "carry",
  "Seeing and deciding", "The Eye in close-up with a SEEING box ticked and a DECIDING box empty."),
 (6, 6, "map-territory", "extreme-wide", "overhead", "yukon-flats", "top-down-map", "map-territory", "radial-emanate", "landscape-as-subject", "map-travel", "travel",
  "The seventy two hour clock", "A braided river basin where a pilot box lights over 1.6 million acres, crews wait at its edge and a fire gets a seventy two hour clock."),
 (7, 7, "data-panel", "medium", "high", "xprize-arena", "instrument-screen", "grid-modular", "scroll-data", "instrument-as-subject", "fui-boot", "build",
  "Ten minutes", "A scoreboard stopwatch, a generic drone icon racing over decoys, a detected flag and an empty put-out ring."),
 (8, 8, "alt-vantage", "medium", "eye", "glass-pane", "eye-level-immersive", "single-object-void", "vertical-descent", "single-organic-hero", "match-cut", "match",
  "A plan and a plunge", "A glass pane with a dashed edge the Eye can't press, then the acres counter strikes out and the camera falls through the square."),
 (9, 10, "two-up", "wide", "eye", "two-soil-cuts", "cross-section-cutaway", "fullbleed-split", "vertical-descent", "data-as-subject", "morph", "match",
  "Frozen against three times deeper", "Two ground cuts side by side, the left probe stops dead on the ice at one foot and the right probe plunges through the burn scar to three times deeper."),
 (10, 12, "wide-establish", "extreme-wide", "high", "burned-plain", "orbital-aerial", "centered-hero-lowerthird", "radial-emanate", "landscape-as-subject", "carried-element", "carry",
  "Two million tons", "The thaw glow lifts into amber motes over a burned plain while a counter rolls and the hot square sinks into the peat."),
 (11, 13, "alt-vantage", "wide", "eye", "cold-cut", "cross-section-cutaway", "single-object-void", "push-in-only", "structure-as-subject", "hard-cut", "match",
  "The fair doubt", "A drained cold cut of ground with the square sunk deep and surface hoses spraying above it under a plain name plate."),
 (12, 14, "two-up", "wide", "overhead", "split-test", "cross-section-cutaway", "fullbleed-split", "horizontal-traverse", "multiplicity-swarm", "match-action", "match",
  "If and if not", "A split frame, a fought ground cut and a left one both sink to the same depth if the doubt holds, and if it is wrong the fought one snaps back to frozen."),
 (13, 16, "map-territory", "medium", "overhead", "fork-map", "orbital-aerial", "map-territory", "radial-emanate", "data-as-subject", "carried-element", "carry",
  "Three roads", "The hot square sits on a fork with three roads, fight, leave and set."),
 (14, 17, "subject-portrait", "medium", "ground", "spring-ground", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "landscape-as-subject", "hard-cut", "match",
  "Mild fire", "Unplaced spring ground at eye level, a name plate, a quote typed as it is said and one small flame lit low on the ground as an idea."),
 (15, 18, "map-territory", "extreme-wide", "overhead", "plan-view", "top-down-map", "map-territory", "horizontal-traverse", "structure-as-subject", "match-cut", "match",
  "A plan, not a result", "A dashed plan view of a burn unit near Fort Yukon, the flame as its top-down dashed twin and a dashed flame line grown along its edge."),
 (16, 19, "subject-portrait", "extreme-wide", "high", "orbit-lift", "orbital-aerial", "single-object-void", "vertical-rise", "single-organic-hero", "match-action", "match",
  "Planned, not found", "The dashed flame line condenses to a point and the camera lifts to orbit where it is a dashed ember square and the Eye blinks."),
]

AMBIENT = {
 1: "grid ticks drift, the heat ring pulses, the Eye's wings flutter",
 2: "scanlines refresh, river braids shimmer, both squares pulse, the iris glows",
 3: "stars drift, lens lights blink, dashes crawl, the horizon glows",
 4: "the glow pulses, smoke drifts, puffs bob, coins wobble",
 5: "the Eye breathes, wings flutter, the box rattles, the iris moves",
 6: "rivers shimmer, the box edge pulses, the clock drains, dots shuffle",
 7: "scanlines refresh, the stopwatch ticks, rotors blur, dashes crawl",
 8: "dashes crawl, the Eye leans, the counter flickers, the grid dissolves",
 9: "moss sways, ice glints, handles shake, ash drifts",
 10: "motes rise, smoke drifts, the counter rolls, the pixel dims",
 11: "frost glints, hoses spray, the pixel stays dark, dust drifts",
 12: "thaw fronts sink, hoses spray, glints crawl, the front rebounds",
 13: "the pixel pulses, ring ticks, smoke drifts, the flame flickers",
 14: "grass sways, light shifts, the plate types, the flame flickers",
 15: "dashes crawl, the river shimmers, the flame line grows",
 16: "the point glows, the square pulses, the Eye blinks, ghost squares pulse",
}
CENTER = {1: "the pixel at x540 y960", 2: "the two squares at x540 y960", 3: "the satellites at x540 y900", 4: "the map at x540 y1000", 5: "the Eye at x540 y960", 6: "the pilot box at x540 y960",
          7: "the scoreboard at x540 y960", 8: "the Eye and pane at x540 y960", 9: "the two soil cuts at x540 y1000", 10: "the plain at x540 y1000",
          11: "the cold cut at x540 y1000", 12: "the split at x540 y960", 13: "the fork at x540 y960", 14: "the ground at x540 y1000", 15: "the plan at x540 y1000", 16: "the square at x540 y1000"}
HERO = {
 1: ("hot pixel + grid + Eye", "50% pixel, 30% Eye, 20% grid"),
 2: ("two squares + FireSat screen", "50% squares, 30% screen, 20% tags"),
 3: ("three FireSats + Earth limb + dashed ring", "45% satellites, 35% limb, 20% ring"),
 4: ("Alaska map + smoke column + coins", "40% map, 35% smoke, 25% coins"),
 5: ("the Eye + two boxes", "55% Eye, 45% boxes"),
 6: ("Yukon Flats basin + pilot box + clock ring", "45% basin, 30% box, 25% clock"),
 7: ("scoreboard + drone + fire pixel + rings", "35% board, 30% drone, 35% rings"),
 8: ("Eye + glass pane + acres counter", "40% Eye, 30% pane, 30% counter"),
 9: ("two SoilColumns + two ThawProbes", "50% columns, 50% probes"),
 10: ("burned plain + carbon motes + counter + pixel", "40% plain, 30% motes, 30% counter"),
 11: ("cold SoilColumn + sunk pixel + hoses", "50% column, 25% pixel, 25% hoses"),
 12: ("two split cuts + hoses", "50% left, 50% right"),
 13: ("fork + three roads + pixel", "40% pixel, 60% roads"),
 14: ("spring ground + quote plate + flame", "50% ground, 25% plate, 25% flame"),
 15: ("plan view + dashed outline + flame line", "55% plan, 25% outline, 20% line"),
 16: ("dashed square + lift + orbit grid + Eye", "40% square, 35% grid, 25% Eye"),
}
PARTS = {1: 40, 2: 46, 3: 52, 4: 56, 5: 48, 6: 54, 7: 60, 8: 50, 9: 70, 10: 52, 11: 48, 12: 56, 13: 44, 14: 46, 15: 42, 16: 48}
KICKS = (27, 41)
STAGE3D = {k: "planes" for k in range(1, 17)}
for _k in (2, 5, 7, 13, 15):
    STAGE3D[_k] = "flat:a locked panel with a slow drift where the squares, the boxes, the board and the roads are the motion"
CAMERA = {1: "dollyThrough", 2: "static:the two squares are the shot", 3: "truckAcross", 4: "craneDown", 5: "static:the boxes are the shot", 6: "craneDown", 7: "static:the stopwatch and the drone are the shot",
          8: "dollyThrough", 9: "dollyThrough", 10: "craneDown", 11: "dollyThrough", 12: "truckAcross", 13: "static:the three roads are the shot", 14: "dollyThrough",
          15: "static:the dashed plan is the shot", 16: "riseWith"}


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

    palette = "orbital navy void with river cyan, a bright warm thermal amber and ember yellow hot pixel, ice cyan permafrost, peat brown, smoke wisps, dashed bone plan lines, low sunrise light and birch green on tan for the last frames"
    board = {
        "run_date": "2026-10-24", "slug": "seeing-is-the-easy-part", "title": "Seeing Is the Easy Part",
        "concept": ("MIT Technology Review's October 19th feature on Arctic wildfire and permafrost carbon, checked against Earth Fire Alliance, XPRIZE, Alaska Public Media and Woodwell. "
                    "A faced satellite, the Eye, looks down at one hot square on a cold false-colour plate. The film follows that square from a FireSat frame, to a seventy two hour clock on the Yukon Flats, to a plunge through the floor into two ground cuts side by side where a thaw probe stops at one foot on unburned ground and goes at least three times deeper in a burn scar, "
                    "gives the fair doubt about suppression its own cold scene and a fought against left split, then a fork with three roads, fight, leave and set, a mild fire as an idea, and a dashed plan for next spring that lifts to a dashed ember square in orbit."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "orbital-aerial", "motion_vector": "radial-emanate", "hero_treatment": "landscape-as-subject", "layout": "map-territory",
                        "register": "instrument-readout", "palette": palette, "camera_strategy": "aerial-descent",
                        "light_story": "an orbital plate where one warm square is the only light, a clear ice-cyan cut for the doubt, then low sunrise spring light and one small ember flame",
                        "metaphor": "one lit square seen from orbit that is first found, then timed, then buried, then forked, and finally a dashed plan"},
        "palette": palette,
        "divergence_note": ("The last four films were a paper form in a snowy cutaway building, a plumb bob in dark ground with a steel bit, a calf on a pewter beach and a manila folder on a walnut desk. "
                            "This film is a navy orbital plate with self-lit thermal colour, then a plunge through the floor into ice and peat, then low spring ground. There is no desk, no paper, no lamp pool and no cutaway building, and its dominant POV is looking down from orbit. "
                            "HONEST OVERLAP: its hero is a faced object for the third film in a row (Plumb, Dotty, now the Eye), and its middle is a ground cutaway with a steel rod like 10-22's drill bit. The cutaway is held to one two-up shot of about twelve seconds plus a cold doubt scene, the rod is a faceless hand-pushed probe that stops, and the accent is amber and not vermilion."),
        "treatment": {"winner": "The Dramatist's one falling lens from orbit to soil to orbit with the Explainer's 50 versus 4 smoke and coin comparison and probe cutaway, the Enthusiast's three-way fork, and the Comedian's decoy squares gag cut to the XPRIZE scoreboard (the comedy stops before the doubt).",
                      "why": "The story is a view from space that falls to the ground, so a faced satellite and a single hot square carry the argument in one picture a muted viewer can read: the square is found, timed, buried, forked and planned. The doubt gets a drained cold scene at full strength."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A black-indigo top-down false-colour grid of cold tiles with one amber square snapping on at frame 6 with an overshoot and a pulsing heat ring, the faced Eye sliding in from the top edge to look at it.",
                 "headline": "ONE SQUARE · ONE FIRE", "motion_by_s": 0.3,
                 "loopback": "The last frame is one dashed ember square on the same cold grid, inside a dashed boundary, with the Eye blinking calmly beside it: the square that was found is now a plan."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(52), "what": "Somebody has to decide what to do about the fire. Planted as the reticle clamps on the pixel and a question mark rises, answered with three branches at the fork and handed back to the viewer as the closing question.",},
        "open_loop_2": {"plant_t": b_at(23), "pay_t": b_at(38), "what": "Did anyone put it out? Planted as the XPRIZE put-out ring stays empty after detection, paid when the doubt line holds that suppression's impact is not clear.",},
        "throughline": {"object": "the hot pixel", "lands_in_button": "one dashed ember square on the cold grid inside a dashed boundary, planned and not lit",
                        "states": [
                            {"at_s": b_at(1), "state": "a single amber hot square snapping on in a cold grid"},
                            {"at_s": b_at(5), "state": "two squares, Moran and Chicken, in one FireSat image"},
                            {"at_s": b_at(9), "state": "a lit square at the centre of the dashed scan ring"},
                            {"at_s": b_at(10), "state": "a brighter square inside the glowing Interior half of Alaska"},
                            {"at_s": b_at(14), "state": "a small lit square beside the SEEING tick"},
                            {"at_s": b_at(19), "state": "a hot square with a 72:00 clock ring on the Yukon Flats"},
                            {"at_s": b_at(23), "state": "the square flagged DETECTED with an empty put-out ring beside it"},
                            {"at_s": b_at(27), "state": "the square the camera falls through into the ground"},
                            {"at_s": b_at(36), "state": "the square sinking into the peat, dark and heavy"},
                            {"at_s": b_at(41), "state": "the square at a fork with three roads, fight, leave and set"},
                            {"at_s": b_at(52), "state": "one dashed ember square inside a dashed boundary, planned and not lit"}]},
        "reveals": [
            {"t": b_at(4), "type": "scale-pullback", "what": "a hard cut to a wide FireSat sensor screen with river braids and a second fire", "hold_s": 0.7},
            {"t": b_at(27), "type": "scale-pullback", "what": "the camera falls through the hot square and the grid dissolves into layered ground", "hold_s": 0.7},
            {"t": b_at(33), "type": "build-on", "what": "the right probe lands past the three foot mark beside the left column's one foot mark", "hold_s": 0.8},
            {"t": b_at(52), "type": "scale-pullback", "what": "the camera lifts from a dashed flame point to orbit where it is a dashed ember square", "hold_s": 0.8}],
        "tail_s": 3.2, "audio_arc": {"build_steps": 4, "dip_at": round(b_at(53) - 0.3, 3), "riser_at": round(b_at(26), 3), "silence_at": round(b_at(52) - 0.3, 3),
                      "payoff_at": b_at(52), "button_pattern": "question", "interrupt_at": b_at(27), "extra_dips": [b_at(37)]},
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
    book.raise_if_missing("board_1024 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1024Ids.ts").write_text(
        "// GENERATED by scripts/board_1024.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
