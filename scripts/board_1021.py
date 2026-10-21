#!/usr/bin/env python3
"""2026-10-21 "The Count and the Calf": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1021.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1021.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "hit", "viewfinder frame", "slams onto the first grey mound on the gravel and the tally clicks 01", "plain", "COUNT",
  "four orange viewfinder corners slam onto a grey mound on a straw gravel beach and a brass tally clicks to 01",
  "the corners overshoot and settle, the tally digit rolls", ""),
 (3, 1, 0, W("breathed"), "swell", "calf", "the third grey mound's flank rises under the frame and the tally digit sticks half rolled", "alert", "ONE OF THEM BREATHED",
  "the third mound's flank rises and falls under the corners and the tally digit sticks half rolled",
  "the flank heaves and the tally digit trembles", ""),
 (4, 2, 1, W("Mid-September"), "whoosh", "Alaska map", "a pin pulses on the northwest coast", "curious", "POINT LAY · MID-SEPTEMBER",
  "the view cuts to a map of Alaska where a pin pulses on the northwest coast, POINT LAY, MID-SEPTEMBER",
  "the pin pulses and the coast shimmers", ""),
 (6, 2, 1, W("Violet"), "pop", "Violet", "walks in holding a phone", "curious", "VIOLET ANNISKETT · COLLEGE STUDENT",
  "a figure in a flannel jacket walks in on the gravel holding a phone, VIOLET ANNISKETT, COLLEGE STUDENT",
  "the figure's stride settles and the plate bounces", ""),
 (7, 2, 1, W("photographed"), "snap", "phone", "flashes as the orange corners snap onto a mound", "alert", "PHOTOS, TO COUNT LATER",
  "the phone flashes and orange viewfinder corners snap onto a grey mound, PHOTOS, TO COUNT LATER",
  "the flash blooms and the corners overshoot", ""),
 (9, 2, 1, W("Tony"), "tap", "Tony", "steps in at the edge of the frame", "plain", "TONY FISCHBACH · USGS",
  "a second figure in a green puffer steps in with a clipboard, TONY FISCHBACH, USGS",
  "the plate bounces and the figure's breath steams", ""),
 (11, 3, 2, W("stomach"), "thump", "calf", "the small mound's flank heaves and the orange corners jolt with it", "alert", "A STOMACH MOVED",
  "the small mound's flank heaves and the orange corners jolt, A STOMACH MOVED",
  "the flank heaves and the corners tremble", "plant: will he live"),
 (12, 3, 2, W("baby"), "bloom", "calf", "the grey drains to warm tawny as a wet eye opens", "afraid", "A BABY WALRUS",
  "the grey drains to warm tawny hide and a big wet eye opens between two carcasses",
  "the colour floods in and the eye shines", ""),
 (13, 3, 2, W("between"), "hit", "boxes", "snap onto the two carcasses and miss the calf", "plain", "TWO CARCASSES · ONE BREATH",
  "two orange boxes snap onto the two grey carcasses and the tawny calf sits between them, outside both",
  "the boxes settle and the calf breathes", ""),
 (14, 3, 2, W("alive"), "tick", "calf", "lifts its head and blinks", "afraid", "ALIVE",
  "the calf lifts its head and blinks at the camera, small and afraid",
  "the calf blinks and shivers", ""),
 (15, 3, 2, W("bear"), "thump", "bear prints", "step across the foreground gravel", "alert", "BEAR TRACKS NEARBY",
  "bear tracks step one by one across the foreground gravel toward the calf, BEAR TRACKS NEARBY",
  "the prints press in and the calf flinches", ""),
 (16, 4, 3, W("Her"), "creak", "viewfinder frame", "closes slowly around the calf alone as the view drops low behind him", "ask", "THE FIRST MOVE",
  "the view drops low across the gravel behind the calf as the orange corners close slowly around him alone, THE FIRST MOVE",
  "the corners tighten and the calf looks up", ""),
 (17, 4, 3, W("rescue"), "hush", "Violet's hand", "reaches toward the calf and stops short", "ask", "NOT A RESCUE",
  "a sleeve and hand reach in from the edge of frame toward the calf, stop short of touching him and hold",
  "the hand hovers and trembles and the calf shivers", ""),
 (18, 4, 3, W("question"), "stamp", "question stamp", "slams down beside the calf as the hand withdraws", "ask", "A QUESTION",
  "the hand withdraws and a big orange question mark slams down beside the calf and stays",
  "the stamp lands and the calf blinks", "rehook: the question"),
 (19, 5, 4, W("Machines"), "whoosh", "trail camera", "swings its lens toward a far haulout of grey mounds", "curious", "MACHINES · TAUGHT TO COUNT",
  "the view cuts to a trail camera on a post looking out over a far haulout of grey mounds, its cream light blinking, while orange corners settle on the far haulout and a small breathing calf sits held in its own corners in the lower corner",
  "the lens turns and the LED blinks", ""),
 (21, 5, 5, W("U"), "thunk", "plate", "stamps beside the trail camera", "plain", "USGS · TEACHING NEURAL NETWORKS TO SPOT WALRUSES",
  "a plate stamps beside the trail camera reading USGS, TEACHING NEURAL NETWORKS TO SPOT WALRUSES, while the big orange question mark shrinks into a small mark parked in the corner",
  "the plate bounces", ""),
 (22, 5, 5, W("trail"), "pop", "trail camera", "flashes and a photo slides out", "alert", "TRAIL CAMERA PHOTOS",
  "the trail camera flashes and a photo of grey mounds slides out into frame",
  "the flash blooms and the photo settles", ""),
 (23, 5, 5, W("neural"), "bloop", "neural network", "lights up as four glass layers", "curious", "DEEP NEURAL NETWORK",
  "four stacked glass layers with dotted links light up beside the photo, a deep neural network, in development, the small calf insert still breathing in its corners",
  "the layers glow in sequence", ""),
 (24, 5, 5, W("walruses"), "ping", "dotted guesses", "drop onto the photo's mounds", "plain", "SPOTTING WALRUSES · IN DEVELOPMENT",
  "pale dotted boxes drop onto the mounds in the photo, IN DEVELOPMENT",
  "the dashes crawl", ""),
 (25, 6, 6, 0.0, "scratch", "human boxes", "get drawn on the photo in solid orange", "plain", "PEOPLE MARK",
  "a hand draws solid orange boxes around each mound in a big photo, PEOPLE MARK WHAT'S IN IT",
  "each box snaps on with an overshoot", ""),
 (26, 6, 6, W("guesses"), "whoosh", "dotted guesses", "wander in wrong", "curious", "THE NETWORK GUESSES",
  "pale dotted boxes appear and wander in the wrong places",
  "the guesses drift and wobble", ""),
 (28, 6, 6, W("adjusts"), "bell", "dotted guesses", "slide partway toward the solid boxes", "plain", "ADJUSTS",
  "the dotted boxes slide partway toward the solid ones and the needle drops but stays above zero, ILLUSTRATIVE",
  "the boxes settle closer and the needle trembles", ""),
 (29, 7, 7, 0.0, "whoosh", "orbit view", "pulls back from the photo to a satellite view of the coast", "curious", "SATELLITE VIEW",
  "the photo shrinks into a satellite view of the coast under a dotted grid as a satellite slides in",
  "the grid draws in and the satellite glides", ""),
 (31, 7, 7, W("Marine"), "thunk", "plate", "stamps over the coast", "plain", "MARINE MAMMAL PROTECTION ACT · REPORTING",
  "a plate stamps over the coast reading MARINE MAMMAL PROTECTION ACT, REPORTING",
  "the plate bounces", ""),
 (32, 7, 7, W("Methods"), "stamp", "dashed stamp", "lands and the boxes stay dotted", "firm", "METHODS IN DEVELOPMENT · NOT RESULTS",
  "a dashed stamp lands across the grid reading METHODS IN DEVELOPMENT, NOT RESULTS, and the boxes stay dotted",
  "the dashes crawl and the stamp rings", ""),
 (33, 8, 8, W("One"), "swell", "plate", "stamps onto the beach", "serious", "THE FAIR OBJECTION",
  "the view drops to the empty beach where a plate stamps THE FAIR OBJECTION beside the three grey mounds from the first shot, the middle one breathing",
  "the plate bounces and the middle mound breathes", ""),
 (34, 8, 8, W("counting"), "tap", "satellite", "slides in and sweeps the beach", "plain", "COUNTING GOES REMOTE",
  "a satellite slides across the sky and its scan cone sweeps the empty beach",
  "the cone sweeps and the gulls scatter", ""),
 (35, 8, 8, W("people"), "hush", "dotted cell", "lands over the three mounds and labels all three alike", "serious", "3 MOUNDS · NOBODY STANDING THERE",
  "a dotted grid cell lands over the three mounds and labels all three alike, 3 MOUNDS, NOBODY STANDING THERE, while the middle mound's flank rises under it unseen",
  "the cell settles and the middle flank rises", "rehook: nobody there to see it"),
 (38, 9, 9, W("people"), "slide", "photo", "slides up an arrow into the network", "plain", "PICTURES PEOPLE COLLECT",
  "a photo slides along an arrow up into the glass layers, PICTURES PEOPLE COLLECT",
  "the photo slides and the layers brighten", ""),
 (39, 9, 9, W("but"), "hit", "dotted wall", "drops down the middle of the frame", "firm", "NOT THE CHOICE",
  "a dotted wall drops down the middle of the frame and the network dims on its side while a small calf insert breathes in the corner",
  "the wall lands and the network dims", ""),
 (40, 9, 9, W("choice"), "thud", "question stamp", "glows alone on the other side", "ask", "THE CHOICE SHE FACED",
  "the big orange question mark glows alone on the other side, nothing reaching it",
  "the question mark pulses", ""),
 (41, 10, 10, 0.0, "swell", "shoreline", "settles into a quiet wide at dusk", "serious", "HUNTED THERE FOR SUBSISTENCE",
  "the view settles into a quiet wide of the shoreline at dusk with a few steady house windows far down the beach, HUNTED THERE FOR SUBSISTENCE, the calf small at the far edge",
  "the sea swells and the windows glow steady", ""),
 (42, 10, 10, W("It"), "type", "quote plate", "types her words", "serious", "IT WAS VERY IMPORTANT FOR US TO ASK THE COMMUNITY FIRST",
  "a quote plate types her words, IT WAS VERY IMPORTANT FOR US TO ASK THE COMMUNITY FIRST, ANNISKETT, PER ALASKA PUBLIC MEDIA",
  "the words type to her voice", ""),
 (43, 10, 10, W("ask"), "tap", "question stamp", "dims in the corner as the quote lands", "serious", "ASK THE COMMUNITY FIRST",
  "the quote plate finishes typing and the small orange question mark in the corner dims, answered",
  "the question mark dims", "pay: the question is asked"),
 (44, 11, 11, 0.0, "thump", "Violet's hand", "hovers just above the calf's flank and does not touch him", "worried", "IT FELT HARD",
  "a low close view of Violet's sleeve and hand hovering just above the calf's flank without touching him",
  "the hand trembles and the flank rises", ""),
 (45, 11, 11, W("We"), "type", "quote plate", "types her words", "serious", "WE CAN'T CHOOSE THIS ON OUR OWN",
  "a quote plate types WE CAN'T CHOOSE THIS ON OUR OWN, ANNISKETT",
  "the words type to her voice", ""),
 (46, 11, 11, W("Once"), "bell", "Violet's hand", "settles on the calf for the first time as the orange corners step back", "warm", "ONCE THE COMMUNITY DECIDED",
  "Violet's hand settles on the calf's flank for the first time and the orange corners step back from him",
  "the hand settles and the corners retreat", ""),
 (48, 12, 12, W("walked"), "thump", "calf", "waddles after the two figures along the gravel at dusk", "content", "THEY WALKED HIM TO CAMP",
  "the calf waddles after Violet and Tony along the dusk gravel toward a small cabin",
  "the calf's flippers shuffle and the figures glance back", ""),
 (49, 12, 12, W("old"), "knock", "cabin door", "is old and broken and swings in", "plain", "AN OLD BROKEN DOOR",
  "an old split plank door with a hole swings in and the calf shuffles through",
  "the door creaks and swings", ""),
 (50, 12, 12, W("cabin"), "click", "lamp", "clicks on inside the cabin", "warm", "THE CAMP CABIN",
  "a pale straw kerosene lamp clicks on inside the plank cabin and the calf settles on the floor",
  "the lamp light blooms and flickers", ""),
 (51, 12, 12, W("stayed"), "fold", "Violet", "sits down beside him", "warm", "THEY STAYED THE NIGHT",
  "Violet and Tony sit down on the floor on either side of him",
  "the figures settle and the lamp flickers", ""),
 (52, 13, 13, W("sad"), "swell", "calf", "calls hoo hoo and its throat pulses", "sad", "\"HOO, HOO\"",
  "the calf lifts its head and calls, a sad little hoo hoo, its throat pulsing, HOO HOO",
  "the throat pulses and the lamp flickers", "rehook: hoo hoo"),
 (53, 13, 13, W("window"), "bell", "window frame", "the orange frame becomes a cabin window the calf looks out of", "sad", "THE WINDOW",
  "the calf goes to the window and the orange frame becomes its mullions, pale lamp glow behind him",
  "the mullions draw in and the glow warms", ""),
 (54, 13, 13, W("day"), "hush", "dawn light", "greys the window", "plain", "DAY TWO",
  "dawn grey fills the window as the lamp pales",
  "the light shifts and the calf breathes", ""),
 (55, 13, 13, W("slept"), "bloop", "calf", "falls asleep against Violet's leg", "content", "ASLEEP AGAINST HER",
  "the calf sleeps with its head against Violet's leg and her hand resting near it",
  "the calf's flank rises slow and the lamp flickers", ""),
 (56, 14, 14, W("Townspeople"), "whoosh", "skiff", "carries the calf across a teal lagoon", "plain", "ACROSS THE LAGOON",
  "a small skiff carries the calf and two people across a teal lagoon, ACROSS THE LAGOON",
  "the skiff bobs and the wake spreads", ""),
 (57, 14, 14, W("Alaska"), "thunk", "kennel", "stands open on the gravel and the calf steps in", "plain", "ALASKA SEALIFE CENTER · KENNEL",
  "a grey transport kennel stands open on the gravel framed by orange corners at its door and Violet's sleeve guides the calf in, ALASKA SEALIFE CENTER, KENNEL",
  "the latch swings and the calf looks out", ""),
 (58, 14, 14, W("flew"), "drone", "bush plane", "banks across a pewter sky", "plain", "FLEW TO ANCHORAGE",
  "a small plane banks across a pewter sky, FLEW TO ANCHORAGE",
  "the prop spins and the plane banks", ""),
 (59, 14, 14, W("drove"), "roll", "route line", "draws across the Alaska map to Seward", "plain", "DROVE TO SEWARD",
  "a route line draws across the Alaska map from Point Lay to Anchorage and down to Seward",
  "the line draws and the pins pop", ""),
 (60, 14, 14, W("eight"), "bloop", "plate", "stamps over the route", "firm", "MORE THAN 800 MILES TO SEWARD",
  "a plate stamps over the route reading MORE THAN 800 MILES TO SEWARD",
  "the plate bounces and the line pulses", ""),
 (61, 15, 15, W("says"), "pop", "pool", "holds the calf afloat at the surface", "content", "SEALIFE CENTER · DOING WELL",
  "the calf floats at the surface of a small tiled pool, content, SEALIFE CENTER, DOING WELL",
  "the water rocks and the calf blinks", ""),
 (62, 15, 15, W("Annautaq"), "chime", "name plate", "drops in beside the pool", "warm", "ANNAUTAQ · NAMED FOR HER LATE FATHER",
  "a name plate drops in beside the pool and orange corners close on it, reading ANNAUTAQ, NAMED FOR HER LATE FATHER",
  "the plate glows and the water rocks", "pay: the calf lives"),
 (63, 16, 16, W("satellites"), "whoosh", "orbit view", "pulls back from the pool to the coast grid", "ask", "IF SATELLITES",
  "the pool shrinks away into a satellite view of the coast under the dotted grid",
  "the grid draws in and the satellite glides", ""),
 (65, 16, 16, W("who"), "swell", "orange frame", "the view cranes down into one cell that turns solid orange around a figure", "ask", "WHO SHOULD STILL BE ON THE BEACH?",
  "the view cranes down into one dotted cell on the beach that turns solid survey orange as its corners snap around Violet standing with her phone, WHO SHOULD STILL BE ON THE BEACH?",
  "the corners snap with an overshoot", ""),
 (66, 16, 16, W("beach"), "hit", "orange frame", "holds on her", "ask", "ON THE BEACH",
  "the solid corners hold around Violet and her phone on the gravel as the gulls cross",
  "the corners breathe and the gulls cross", "pay: the loop back to the first frame"),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "macro-closeup", "close", "low", "pewter-beach", "eye-level-immersive", "single-object-void", "horizontal-traverse", "single-organic-hero", "", "",
  "Counted, then a breath", "Orange viewfinder corners hop across three grey mounds and a tally clicks, and the third mound's flank rises."),
 (2, 1, "map-territory", "extreme-wide", "overhead", "alaska-map-to-beach", "orbital-aerial", "map-territory", "radial-emanate", "landscape-as-subject", "carried-element", "carry",
  "A pin, then the beach", "A map pin on the northwest coast zooms down to a gravel beach where two figures photograph grey mounds."),
 (3, 2, "subject-portrait", "insert", "eye", "pewter-beach-macro", "macro-closeup", "stacked-layers", "push-in-only", "single-organic-hero", "match-cut", "match",
  "A stomach moved", "The camera pushes in on three mounds, the smallest breathes, its grey drains to tawny and a wet eye opens as bear tracks arrive."),
 (4, 3, "two-up", "close", "eye", "pewter-beach-low", "eye-level-immersive", "fullbleed-split", "assemble-build", "single-organic-hero", "carried-element", "carry",
  "The first move is a question", "From low behind the calf a sleeve and hand reach toward him, stop short and withdraw as a big orange question mark stamps beside him."),
 (5, 4, "data-panel", "wide", "high", "far-haulout", "instrument-screen", "grid-modular", "scroll-data", "data-as-subject", "whip-pan", "travel",
  "A camera and a network", "A trail camera on a post watches a far haulout, flashes a photo and glass layers light up with dotted guesses."),
 (6, 6, "data-panel", "close", "overhead", "mechanism-panel", "instrument-screen", "fullbleed-split", "vertical-descent", "data-as-subject", "carried-element", "carry",
  "People mark, the network guesses", "A hand draws solid orange boxes, dotted guesses wander wrong, a needle swings and the guesses lock on."),
 (7, 7, "alt-vantage", "extreme-wide", "overhead", "orbit-coast", "orbital-aerial", "map-territory", "vertical-rise", "structure-as-subject", "match-cut", "match",
  "A coast from orbit", "The photo pulls back to a satellite view of the coast under a dotted grid where boxes never quite lock."),
 (8, 8, "wide-establish", "wide", "eye", "pewter-beach", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "structure-as-subject", "whip-pan", "travel",
  "Nobody standing there", "A satellite cell lands over three grey mounds and labels them alike while the middle mound breathes unseen under the held corners."),
 (9, 9, "two-up", "medium", "eye", "split-frame", "instrument-screen", "fullbleed-split", "assemble-build", "data-as-subject", "hard-cut", "carry",
  "The network and the choice", "A hand feeds a photo to the glass layers, a dotted wall drops, and the question mark glows alone on the other side."),
 (10, 10, "wide-establish", "extreme-wide", "eye", "dusk-shoreline", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "landscape-as-subject", "mask-wipe", "build",
  "Ask the community first", "A quiet static wide of the dusk shoreline with steady house windows far down the beach, the calf small at the edge and her words typed on a plate."),
 (11, 11, "macro-closeup", "insert", "low", "dusk-beach-close", "macro-closeup", "single-object-void", "push-in-only", "single-organic-hero", "carried-element", "carry",
  "It felt hard", "A low close two-up of Violet's hand hovering over the calf's flank, her words typing, the hand settling as the corners step back and open like a door."),
 (12, 12, "alt-vantage", "wide", "high", "camp-and-cabin", "eye-level-immersive", "horizontal-traverse-layout", "horizontal-traverse", "single-organic-hero", "match-action", "match",
  "To the cabin", "The calf waddles after two figures to an old broken door and a lamp clicks on inside the cabin."),
 (13, 13, "two-up", "close", "eye", "cabin-interior", "eye-level-immersive", "fullbleed-split", "push-in-only", "single-organic-hero", "match-cut", "match",
  "Hoo hoo at the window", "The calf calls, the orange frame becomes the window it looks out of and by day two it sleeps against her."),
 (14, 14, "map-territory", "extreme-wide", "high", "lagoon-to-map", "orbital-aerial", "stacked-layers", "assemble-build", "data-as-subject", "whip-pan", "travel",
  "800 miles", "A skiff crosses the lagoon, a kennel opens, a plane banks and a route draws across Alaska to Seward."),
 (15, 15, "two-up", "medium", "low", "sealife-pool", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "single-organic-hero", "mask-wipe", "build",
  "Doing well", "The calf floats in a small tiled pool and a name plate lights beside it."),
 (16, 16, "map-territory", "extreme-wide", "overhead", "orbit-coast", "orbital-aerial", "map-territory", "vertical-rise", "structure-as-subject", "match-cut", "match",
  "Who should still be there", "The pool pulls back to the coast grid where one tiny figure with a phone is held in the orange corners."),
]

AMBIENT = {
 1: "gulls drift, the sea swells, the grey mounds sit, the tally ticks in the wind",
 2: "the pin pulses, gulls drift, the sea swells, the grey mounds sit",
 3: "the calf breathes, gulls cry, gravel dust drifts, the corners tremble",
 4: "the calf breathes, the sea swells, the question mark pulses, gulls drift",
 5: "the red LED blinks, grass sways, the far mounds shift, the layers glow",
 6: "the guesses drift, the needle trembles, the corners breathe, the photo curls",
 7: "the grid breathes, the satellite drifts, the specks flicker, the coast shimmers",
 8: "the satellite drifts, the sea swells, the ghost outlines crawl, gulls drift",
 9: "the layers glow, the wall flickers, the question mark pulses, dust drifts",
 10: "the dusk dims, the calf breathes, house windows flicker, the sea swells",
 11: "Violet breathes, the calf shivers, the windows glow, the sea swells",
 12: "the calf shuffles, the lamp flickers, the sea swells, gulls cry",
 13: "the lamp flickers, the calf breathes, stars twinkle in the window, the throat pulses",
 14: "the water ripples, the prop spins, the route line pulses, gulls drift",
 15: "the water rocks, the calf breathes, the plate glows, the tiles shimmer",
 16: "the grid breathes, the specks flicker, the corners breathe, the warm dot glimmers",
}
CENTER = {1: "the mounds at x540 y1100", 2: "the figures at x540 y1150", 3: "the calf at x540 y1150", 4: "the calf at x540 y1150", 5: "the camera at x330 y1050", 6: "the photo at x540 y950", 7: "the grid at x540 y1100",
          8: "the beach at x540 y1150", 9: "the layers at x540 y1000", 10: "the calf at x400 y1250", 11: "Violet and the calf at x540 y1150", 12: "the calf at x540 y1200",
          13: "the window at x700 y800", 14: "the skiff at x540 y1050", 15: "the pool at x540 y1150", 16: "the grid at x540 y1100"}
HERO = {
 1: ("viewfinder frame + dull mounds + tally", "45% mounds, 30% corners, 25% beach"),
 2: ("AlaskaMini + Character x2 + mounds", "40% beach, 35% figures, 25% mounds"),
 3: ("WalrusCalf + CarcassMound x2", "50% calf, 35% mounds, 15% prints"),
 4: ("WalrusCalf + question stamp", "55% calf, 30% corners, 15% stamp"),
 5: ("TrailCam + HaulPhoto + network", "40% camera, 30% photo, 30% layers"),
 6: ("HaulPhoto + hand + needle", "60% photo, 25% boxes, 15% needle"),
 7: ("OrbitBG + SatelliteEye + grid", "55% coast, 30% grid, 15% satellite"),
 8: ("BeachBG + Character x3 + satellite", "40% beach, 35% figures, 25% satellite"),
 9: ("network layers + photo + wall", "40% network, 35% wall, 25% stamp"),
 10: ("WalrusCalf + BeachBG dusk + plate", "40% calf, 35% beach, 25% plate"),
 11: ("Character + WalrusCalf + plate", "40% figure, 30% calf, 30% plate"),
 12: ("WalrusCalf + Character x2 + CabinBG", "40% calf, 30% figures, 30% cabin"),
 13: ("WalrusCalf + window ViewFrame", "45% calf, 35% window, 20% lamp"),
 14: ("skiff + Kennel + BushPlane + AlaskaMini", "40% vehicles, 35% map, 25% kennel"),
 15: ("Pool + WalrusCalf + plate", "45% calf, 35% pool, 20% plate"),
 16: ("OrbitBG + ViewFrame + tiny figure", "55% coast, 30% corners, 15% figure"),
}
PARTS = {1: 46, 2: 52, 3: 60, 4: 48, 5: 58, 6: 50, 7: 44, 8: 56, 9: 46, 10: 50, 11: 54, 12: 62, 13: 58, 14: 60, 15: 50, 16: 44}
STAGE3D = {k: "planes" for k in range(1, 17)}
for _k in (6, 9, 15):
    STAGE3D[_k] = "flat:a locked panel where the boxes, the wall and the water are the motion"
CAMERA = {1: "dollyThrough", 2: "craneDown", 3: "dollyThrough", 4: "dollyThrough", 5: "truckAcross", 6: "static:the boxes and the needle are the shot", 7: "craneDown", 8: "static:the held corners over the breathing mound are the shot",
          9: "static:the dotted wall is the shot", 10: "static:the steady windows and the still calf are the shot", 11: "dollyThrough", 12: "truckAcross", 13: "dollyThrough", 14: "craneDown", 15: "static:the calf in the water is the shot", 16: "craneDown"}


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
        if b["id"] in (12, 52):
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

    palette = "soft pewter dawn over a teal sea and straw gravel, a tawny calf, survey orange for the count, one amber cabin and a navy orbit"
    board = {
        "run_date": "2026-10-21", "slug": "the-count-and-the-calf", "title": "The Count and the Calf",
        "concept": ("USGS says it is teaching deep neural networks, on trail camera photos, to spot walruses remotely, and developing satellite methods to count carcasses. "
                    "In mid-September near Point Lay a college student photographing carcasses to count them found one living calf between two of them, and asked the community first. "
                    "The film draws the count as a survey-orange rectangle that begins as a viewfinder, becomes a network's label box and a satellite cell, hangs empty over a beach, "
                    "and ends as the window a rescued calf looks out of. It gives the fair objection a scene (counting remote could mean fewer people on the beach), keeps the community's decision quiet "
                    "and machine-free, and ends on the open question of who should still stand on the beach."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "push-in-only", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "pewter-coast-and-tawny-hero", "palette": palette, "camera_strategy": "push-ins on the calf with orbit pull-backs", "light_story": "soft dawn light on a gravel beach, a navy orbit, a gentle dusk beach, then one warm glowing amber lamp pool in a plank cabin",
                        "metaphor": "a survey-orange counting frame that becomes a window"},
        "palette": palette,
        "divergence_note": ("10-20 was an overcast celadon and walnut office with a manila folder and fireweed magenta. 10-18 was a blue-hour indigo and rose world with a mustard felt bench and a mint jelly. "
                            "This film is an outdoor pewter-lilac and teal coast with bone gravel, a tawny animal hero and survey orange, then an amber lamp-lit cabin, and it moves through a beach, a map, a trail camera, a labelling panel, an orbit, a dusk beach, a cabin, a lagoon and a pool."),
        "treatment": {"winner": "The Dramatist's count and calf (one breath inside the count, the community's quiet decision), with the Explainer's labelling mechanism as the middle act and the Enthusiast's honest case for remote counting as the fair objection.",
                      "why": "A living face in a world of dull counted mounds carries emotion, the survey-orange frame makes the count one object that changes state, and the objection gets a scene before the community's decision is left quiet."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "Four orange viewfinder corners slam onto a grey mound on a pewter gravel beach and a brass tally clicks to 01.",
                 "headline": "SHE WAS COUNTING THE DEAD", "motion_by_s": 0.3,
                 "loopback": "The last frame is the same orange corners, solid now, closing around Violet on the beach, the first frame's count turned toward a person."},
        "open_loop": {"plant_t": b_at(11), "pay_t": b_at(62), "what": "Will he live? Planted as the small mound's flank heaves, paid as the calf floats in the SeaLife Center pool and gets his name."},
        "open_loop_2": {"plant_t": b_at(21), "pay_t": b_at(42), "what": "What was the first-move question? Planted as the big orange question mark stamps beside the calf and waits as a small mark in the corner of the machine scenes, paid as her quote about asking the community first lands."},
        "throughline": {"object": "the orange counting frame", "lands_in_button": "a dotted satellite cell turning solid orange around Violet on the beach",
                        "states": [
                            {"at_s": b_at(1), "state": "four viewfinder corners slamming onto a mound"},
                            {"at_s": b_at(7), "state": "a phone's viewfinder"},
                            {"at_s": b_at(13), "state": "two boxes around two carcasses, missing the calf"},
                            {"at_s": b_at(25), "state": "solid label boxes drawn by a hand"},
                            {"at_s": b_at(31), "state": "dotted satellite cells that never lock"},
                            {"at_s": b_at(19), "state": "corners on a far haulout, with the calf held small in the corner"},
                            {"at_s": b_at(35), "state": "corners held over a breathing mound nobody is watching"},
                            {"at_s": b_at(41), "state": "a small question mark dimming in the corner of the quiet dusk wide"},
                            {"at_s": b_at(46), "state": "corners opening like a door"},
                            {"at_s": b_at(53), "state": "a cabin window with the calf in it"},
                            {"at_s": b_at(57), "state": "corners as the kennel door frame"},
                            {"at_s": b_at(62), "state": "orange corners on the name plate"},
                            {"at_s": b_at(65), "state": "a dotted cell turning solid orange around Violet on the beach"}]},
        "reveals": [
            {"t": b_at(12), "type": "build-on", "what": "the grey mound drains to warm tawny and a wet eye opens", "hold_s": 0.7},
            {"t": b_at(29), "type": "scale-pullback", "what": "the photo pulls back to a satellite view of the coast under a dotted grid", "hold_s": 0.7},
            {"t": b_at(60), "type": "build-on", "what": "the route line draws across Alaska and the plate stamps MORE THAN 800 MILES TO SEWARD", "hold_s": 0.6}],
        "tail_s": 1.7, "audio_arc": {"build_steps": 4, "dip_at": round(b_at(65) - 0.5, 3), "riser_at": round(b_at(63), 3), "silence_at": round(b_at(66) - 0.35, 3),
                      "payoff_at": b_at(66), "button_pattern": "question", "interrupt_at": b_at(6), "extra_dips": [b_at(44), b_at(52)]},
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
    book.raise_if_missing("board_1021 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1021Ids.ts").write_text(
        "// GENERATED by scripts/board_1021.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
