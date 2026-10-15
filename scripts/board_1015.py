#!/usr/bin/env python3
"""2026-10-15 "The Door With a Condition": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1015.py gen       # write out/dispatch/storyboard.json (times estimated until the voice exists)
    python3 scripts/board_1015.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

Beats anchor to (vo_line, a spoken word or a fraction of the line), so the film re-times itself with the voice.
Mirrors board_1011.py's contract (idempotent, never edits the narration, only binds picture and sound to it).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"
LINES = [l.strip() for l in (OUT / "vo_script.txt").read_text().splitlines() if l.strip()]

W = lambda w, n=1: (w, n)
# key, shot, line, anchor, sfx, subject, action, emotion, annotation, shows, reaction, rehook
B = [
 (1, 1, 0, 0.0, "thunk", "Gate", "lifts its brow and the blank token spins as the camera dollies through its gap", "wary", "DID FAIRBANKS VOTE ON DATA CENTERS",
  "the camera dollies through the gap of the half-open cranberry Gate, which lifts its brow, while a blank gold token spins on its sill, a ballot box on one side and a YES and NO signpost on the other, the Gate's boom the seam between them",
  "the YES and NO arms of the sign sway toward the token", ""),
 (2, 1, 0, W("Except"), "snap", "signpost", "spins hard and snaps its own arrow off into the token", "comic", "YES OR NO",
  "the YES and NO signpost spins hard and its arrow snaps off and knocks the token, which rolls along the sill and spins",
  "the Gate blinks and the fog drifts past the gap", ""),
 (3, 2, 1, 0.0, "tap", "ballot box slot", "opens into a plan-view gym door as chairs fill in", "blank", "OCT 6TH",
  "the camera drops through the ballot box's slot, the slot becomes a gym door in plan view and a grid of folding chairs fills in from the middle under a calendar chip, most chairs dim",
  "the dim chairs sway a pixel and the overhead lamp grid hums", ""),
 (4, 2, 1, W("one"), "click", "tally clicker", "clicks one chair in five alight", "flat", "TURNOUT 20.95% · 16,177 OF 77,227 · UNOFFICIAL",
  "one chair in five lights warm white as the tally clicker clicks, and the gold token in the corner engraves 1 IN 5",
  "the lit chairs glint and the dim ones stay put", ""),
 (5, 3, 2, 0.0, "thump", "ballot stacks", "rise side by side on the count table", "tense", "HOWELL 7,759 · RAMIREZ 7,542 · UNOFFICIAL",
  "two ballot stacks rise on a count table under a brass lamp with boxed name labels, Howell a hair taller, the gold token resting in the near corner of the table",
  "the lamp sways a hair and paper edges flutter", ""),
 (6, 3, 2, W("two"), "snap", "sliver band", "opens between the stack tops and is measured", "tense", "217 VOTES",
  "a bright sliver band opens between the stack tops and a ruler measures it, 217",
  "the stacks lean away from each other by a pixel", ""),
 (7, 3, 2, W("unofficially"), "thud", "UNOFFICIAL stamp", "slams onto the ledger", "firm", "UNOFFICIAL",
  "a navy ink UNOFFICIAL stamp slams onto the ledger and the count table jumps",
  "the stacks jolt and settle a hair short", ""),
 (8, 4, 3, 0.0, "slide", "name card", "slides in beside the engraved token", "unsure", "MIGUEL RAMIREZ",
  "the Ramirez name card slides into close-up with the gold token beside it, still engraved 1 IN 5",
  "the card's corner lifts a hair as it lands", ""),
 (9, 4, 3, W("position"), "thock", "position field", "is stamped on the card and stays blank", "unsure", "NO POSITION",
  "a dashed empty POSITION field is stamped on the card and stays blank",
  "the field's dashes shiver once", ""),
 (10, 4, 3, W("studies"), "creak", "balance scale", "holds its YAY and NAY pans level under a hovering weight", "unsure", "MORE STUDIES",
  "a balance scale with level YAY and NAY pans and an unplaced MORE STUDIES weight hovering above them",
  "the pans bob a pixel and the weight turns slowly", ""),
 (11, 5, 4, 0.0, "swell", "three outlines", "each carry a faint question mark", "curious", "WHO ANSWERED THAT?",
  "three outlines on the borough map, a ballot box, a gavel and a Senate door, each stamped with a faint question mark while the gold token spins up a question",
  "the map's gridlines glide and the pins pulse", ""),
 (12, 5, 5, 0.0, "flip", "calendar", "starts on the OCT 6TH chip from the gym and flips backward to AUG 27TH", "brisk", "AUG 27TH",
  "the calendar leaf starts on the OCT 6TH chip carried from the gym, flips visibly backward to AUG 27TH and a paper request folds in front of it",
  "the leaf curls and settles", "rehook: the reversal, the request came before the vote"),
 (13, 5, 5, W("asked"), "swoosh", "paper plane", "glides to the Juneau pin", "hopeful", "REQUEST TO THE LEGISLATURE",
  "the folded request glides over the map to a Juneau pin, the gold token riding its fold, and lands in a slot",
  "the pin bobs as it lands", ""),
 (14, 5, 5, W("pause"), "thud", "request", "opens in the slot with PAUSE in large type and its UNTIL clause fogged", "firm", "PAUSE · PER KUAC",
  "the request unfolds in the slot showing PAUSE in large type, new commercial data centers, and its UNTIL clause fogged white so it reads as a plain no for now",
  "the slot's edge lamp flickers once", ""),
 (15, 5, 5, W("exist"), "chime", "token", "engraves UNTIL and settles on the slot", "firm", "UNTIL",
  "the gold token engraves UNTIL on the slot's edge while the request's clause stays fogged white",
  "the token glints and the map's pins pulse", ""),
 (16, 6, 6, 0.0, "slide", "bill sheet", "slides down a long hallway", "hopeful", "DATA CENTER BILL · POWER USE · DECOMMISSIONING",
  "a bill sheet slides down a long hallway of overhead lamps toward a pair of doors, the gold token riding its corner",
  "the sheet's corners ripple in the draft", ""),
 (17, 6, 6, W("fourteen"), "ping", "tally lamps", "light one by one to fourteen against five", "pleased", "SENATE 14-5",
  "tally lamps light one by one beside the first door, fourteen lit against five dark",
  "the lamps glow and the door frame hums", ""),
 (18, 6, 6, W("House"), "knock", "second door", "rattles but holds with the token at its foot", "blank", "HOUSE NEVER TOOK IT UP",
  "the bill sheet nudges the second door, which rattles and holds, and the sheet and token wait at its foot",
  "dust falls from the lintel", ""),
 (19, 7, 7, 0.0, "thump", "guide folder", "drops onto the desk with the token engraved UNTIL on its cover", "curious", "A GUIDE FROM UAF",
  "a guide folder drops onto a desk and the gold token, engraved UNTIL, lands on its cover",
  "the folder's cover flutters and the desk lamp breathes", ""),
 (21, 7, 7, W("questions"), "blip", "two hands", "reach for the folder and part around the token", "curious", "THE QUESTIONS UNDERNEATH",
  "two hands labelled YES and NO reach for the folder and part to either side of the token, which stays upright between them",
  "the hands settle at the folder's edges", ""),
 (22, 8, 8, 0.0, "crunch", "frost", "freezes along the Gate's arm and brow as the brow droops", "grim", "THE PAUSE",
  "frost freezes along the Gate's arm and brow as the Gate's brow droops, the token still gold on its sill",
  "the fog thickens across the gap", ""),
 (23, 8, 8, W("against"), "boom", "stamp", "comes down on the Gate's fogged plate", "grim", "THE CASE AGAINST",
  "a heavy navy stamp comes down on the Gate's fogged condition plate reading THE CASE AGAINST",
  "the plate rattles and the frost shivers", ""),
 (24, 8, 9, W("pause"), "hush", "fog", "grows as the Gate's plate fills with white", "stiff", "A PAUSE",
  "the fog grows and drifts across the gap as the Gate's condition plate fills with white",
  "the Gate's breath shows in the fog", "rehook: the case against"),
 (59, 8, 9, W("manners"), "creak", "token", "freezes over until its engraved UNTIL is erased to a blank disc", "stiff", "BLANK",
  "frost freezes over the gold token and its engraved UNTIL until only a blank frosted disc is left, so the pause reads as a no",
  "the frost glints on the sill", ""),
 (25, 8, 9, W("no"), "pop", "Gate", "holds up a neat NO, THANK YOU card and bows", "polite", "A NO WITH GOOD MANNERS",
  "the Gate holds up a neat NO, THANK YOU card on its board and tilts forward in a small bow",
  "the card quivers and the frosted token stays put", ""),
 (26, 8, 9, W("drafts"), "hush", "cobweb", "falls across the STANDARDS drawer and settles", "stiff", "IF NOBODY DRAFTS THEM",
  "a cobweb falls across the STANDARDS drawer behind the Gate and settles",
  "the web sways and shakes in the draft", ""),
 (28, 8, 9, W("whoever"), "punch", "server machine", "glances at a wall clock and its taped ticket is punched FIRST", "patient", "FAVORS WHOEVER BUILDS FIRST",
  "a generic steel server machine glances up at a wall clock and a hole punch marks the ticket taped on its front FIRST",
  "its status lamp blinks slowly", ""),
 (29, 9, 10, 0.0, "slide", "name label", "slides onto the winning stack with the quote typing", "firm", "NICK LAJINESS · WINNING INCUMBENT",
  "back at the count table the LaJiness name label sits on the winning stack, WINNING INCUMBENT, with the quote typing on the label and the blank frosted token beside it",
  "the lamp pool breathes over the stacks", ""),
 (66, 9, 10, W("think"), "tick", "quote", "underlines DATA CENTERS as it types", "firm", "DATA CENTERS",
  "an INK rule draws under DATA CENTERS in the typed quote",
  "the label's WINNING INCUMBENT chip taps once", ""),
 (30, 9, 10, W("community"), "clank", "token", "takes a dent", "grim", "HIS GENERAL VIEW",
  "the blank frosted gold token beside the stack takes a dent as the quote ends, labelled as his general view",
  "the label settles and the dent glints", ""),
 (67, 8, 9, W("standards"), "tick", "plate fog", "tears a bar to show the word UNTIL and closes", "stiff", "UNTIL",
  "the white fog on the Gate's plate tears a bar open to show the word UNTIL and closes again",
  "the Gate's brow droops a hair", ""),
 (31, 10, 11, 0.0, "pulse", "condition plate", "lights from inside as the dent's glint carries into it", "relieved", "BUT",
  "the dented token's glint carries across the cut into the Gate's condition plate, which lights from inside as hairline cracks run through the frost on its arm",
  "the plate's lamp breathes", ""),
 (32, 10, 11, W("ends"), "crack", "frost", "cracks off the Gate in plates and the clause becomes legible", "relieved", "UNTIL STANDARDS EXIST · PER KUAC",
  "the frost cracks off the Gate and off the token in plates, which returns to dented blank gold, and for the first time the plate's clause UNTIL STANDARDS EXIST is legible, the fog thinning behind it",
  "the plates fall and the dented token glints", "rehook: the pause ends when standards exist"),
 (33, 10, 11, W("door"), "bloom", "four dials", "appear in a row under the plate, labelled and empty", "hopeful", "A DOOR WITH A CONDITION",
  "four empty dials rise under the plate, ELECTRICAL DEMAND, WATER USE, ENVIRONMENTAL IMPACTS and AIR QUALITY, a warm glow running down the Gate's seams to its sill where a pen rests on a blank STANDARDS sheet",
  "the four dials flicker once each and stay dark", ""),
 (34, 10, 11, W("condition", 2), "tick", "pen", "taps each empty dial slot and leaves no ink", "hopeful", "A CONDITION CAN BE WRITTEN",
  "the pen taps each of the four empty dial slots in turn and leaves no ink",
  "the pen's cap glints and the sheet stays blank", ""),
 (36, 11, 12, 0.0, "roll", "guide", "lies open to its title page as the token rolls onto it", "warm", "COMPUTING IN PLACE",
  "the guide lies open to its title page, COMPUTING IN PLACE, and the dented blank gold token rolls in from the left edge, from the Gate's sill, and settles on it",
  "the pages riffle once and settle", ""),
 (37, 11, 12, W("Navy's"), "clip", "navy tag", "snaps onto the cover", "plain", "OFFICE OF NAVAL RESEARCH · PER THE DEPOSIT RECORD",
  "a navy deposit-record tag snaps onto the guide's cover, OFFICE OF NAVAL RESEARCH, PER THE DEPOSIT RECORD",
  "the cover jumps a hair and the lamp breathes", ""),
 (39, 12, 13, W("benefits"), "clink", "satellite tokens", "engrave UAF's four summary questions one at a time", "curious", "WHO BENEFITS? WHO PAYS? · AS UAF SUMMARIZES",
  "the four satellite tokens engrave UAF's summarized questions one at a time, WHAT COMPUTING, WHAT RESOURCES, WHO SHOULD CONTROL IT and WHO BENEFITS, as a slow rack passes between them",
  "the unengraved tokens dim a step", ""),
 (40, 12, 13, W("pays"), "clink", "central token", "re-engraves itself WHO PAYS", "curious", "WHO PAYS",
  "the ring lights WHO PAYS and the central token re-engraves itself to WHO PAYS and settles",
  "the radiating tokens draw back toward it", ""),
 (52, 11, 12, W("record"), "flip", "guide pages", "riffle past the title to a spread of question marks as the token lifts a hair", "plain", "PER THE DEPOSIT RECORD",
  "the guide's pages riffle past the title to a spread of question marks and the token lifts a hair off the page",
  "the tag swings on its clip", ""),
 (53, 12, 13, 0.0, "pop", "central token", "lifts off the guide's cover as four satellite tokens bloom around it", "curious", "THE QUESTIONS UNDERNEATH",
  "the central token lifts off the guide's cover and four blank satellite tokens bloom around it",
  "the cover settles under the token's shadow", ""),
 (41, 13, 14, 0.0, "slide", "name card", "slides in with the guide lead's name only", "calm", "LEASI VANESSA LEE RAYMOND, ACEP",
  "the Raymond name card slides in showing the name only, the token beside it engraved WHO PAYS",
  "the two aperture plates tilt toward the card", ""),
 (42, 13, 14, W("Leasi"), "whoosh", "condition ring", "splits into two pearl-steel apertures", "calm", "TWO APERTURES",
  "the cranberry rim of the WHO PAYS token carries across the cut as the Gate's condition ring and splits into two pearl-steel apertures with cranberry rims, one small and one large",
  "the two plates settle on either side of the card", "rehook: the guide lead's scale distinction splits the rule"),
 (43, 13, 14, W("small"), "rumble", "clinic box", "rolls in from the left edge toward the small aperture as the quote types", "plain", "A SMALL FACILITY",
  "a small clinic box rolls in from the left edge toward the small aperture as the Raymond quote starts typing",
  "the aperture plate tilts toward it", ""),
 (55, 13, 14, W("raises"), "flip", "question card", "flips over on the clinic box's plate", "plain", "\"DIFFERENT QUESTIONS\" · LEASI VANESSA LEE RAYMOND, ACEP",
  "the short question card on the clinic box's plate flips over as the quote reaches raises different questions",
  "the box's lamp warms", ""),
 (44, 13, 14, W("hospital"), "stop", "clinic box", "stops at its own plate which shows a short question card", "plain", "HOSPITAL OR TRIBAL FACILITY",
  "the clinic box stops at the small aperture's plate, which shows a short question card of two question marks",
  "the box's lamp warms", ""),
 (45, 13, 14, W("hyperscale"), "heavy", "server machine", "rolls in as the camera pulls out and dwarfs the clinic box", "plain", "HYPERSCALE · DIFFERENT QUESTIONS",
  "the camera pulls out as the generic steel server machine rolls in, its ticket torn off at the edge of frame, dwarfs the clinic box, and stops at the large aperture's plate, which shows a long stack of question marks",
  "the machine's lamp warms and the clinic box looks small beside it", ""),
 (65, 13, 14, W("global"), "stop", "server machine", "stops at the large aperture's plate and its lamp warms", "plain", "A LONG STACK OF QUESTIONS",
  "the server machine stops at the large aperture's plate, which shows a long stack of question marks, and its lamp warms",
  "the clinic box looks small beside it", ""),
 (46, 14, 15, 0.0, "fold", "dial panel", "powers on as the snapped arrow drops onto the dial between greyed YES and NO", "plain", "NOT YES, NOT NO",
  "the dial panel powers on and the snapped arrow from the opening drops onto the dial as its pointer, between greyed YES and NO marks at the two ends of a continuous size scale, the gold token as the hub",
  "the panel's dial lamp glows", ""),
 (57, 14, 15, W("yes"), "tap", "pointer", "touches YES then NO and slides off both onto the scale", "focused", "NOT YES, NOT NO",
  "the pointer touches the greyed YES then the greyed NO and slides off both onto the size scale between them",
  "the hub token turns a hair", ""),
 (47, 14, 15, W("rules"), "tick", "dial", "turns and the two slots resize to the clinic box and machine silhouettes", "focused", "RULES SIZED TO WHAT GETS BUILT",
  "the dial turns and the two slots resize themselves to the silhouettes of the clinic box and the server machine from the aperture shot",
  "the tick marks shimmer", ""),
 (48, 15, 16, 0.0, "drone", "pen", "hovers over the first dotted line of the blank sheet", "expectant", "ONE BLANK PAGE",
  "the half-open Gate in the same fog lot framing as the opening, the ballot box on one side and the signpost stump on the other, a blank gold unengraved token on its cranberry sill beside the blank STANDARDS sheet and a pen hovering over a dotted first line",
  "the fog rolls in and the pen shivers", ""),
 (64, 15, 16, W("rules"), "tap", "pen", "drops to the first dotted line and the ink does not take", "expectant", "RULES FIRST",
  "the pen drops to the first dotted line of the blank sheet and the ink does not take",
  "the sheet's corner lifts", ""),
 (49, 15, 16, W("bill"), "knock", "bill sheet", "slides onto the sill beside the blank sheet", "blank", "THE SENATE'S BILL STALLED IN THE HOUSE",
  "the bill sheet from the hallway slides onto the cranberry sill beside the blank STANDARDS sheet and stops",
  "the sheet's corner lifts in the draft", ""),
 (50, 15, 17, 0.0, "swell", "Gate", "swings its lamp half open as the fog closes in", "expectant", "FOG CLOSES IN",
  "the fog closes in around the half-open Gate in the same framing as the opening, the camera drifting back out through the gap, and its lamp swings",
  "the fog drifts across the sheet", ""),
 (51, 15, 17, W("who"), "bell", "token", "flips to WHO WRITES THEM on the sill and holds", "expectant", "WHO WRITES THEM?",
  "the gold token flips to WHO WRITES THEM on the sill of the half-open Gate and holds for the outro while the fog drifts and the pen shivers",
  "the pen hovers over the blank sheet and shivers", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "two-up", "wide", "high", "ice-fog-lot", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "", "",
  "The Gate is the seam", "A half-open cranberry Gate stands in ice fog with a ballot box on one side and a YES and NO sign on the other."),
 (2, 1, "data-panel", "extreme-wide", "overhead", "gym-overhead", "top-down-map", "grid-modular", "assemble-build", "multiplicity-swarm", "match-cut", "match",
  "One in five chairs", "A plan view of a gym floor of folding chairs fills in and one in five lights."),
 (3, 2, "two-up", "medium", "eye", "count-table", "eye-level-immersive", "stacked-layers", "vertical-rise", "data-as-subject", "carried-element", "carry",
  "The 217 sliver", "Two ballot stacks rise on a count table and a sliver opens between their tops."),
 (4, 3, "macro-closeup", "close", "eye", "quote-wall", "macro-closeup", "single-object-void", "push-in-only", "instrument-as-subject", "hard-cut", "build",
  "More studies", "The Ramirez name card beside a level balance scale with a weight hovering above it."),
 (5, 4, "map-territory", "extreme-wide", "high", "juneau-map", "orbital-aerial", "map-territory", "horizontal-traverse", "landscape-as-subject", "map-travel", "travel",
  "From the question to Juneau", "A map of Alaska, three question outlines, a calendar flipping to August and a paper request flying to Juneau."),
 (6, 6, "alt-vantage", "medium", "low", "house-hall", "eye-level-immersive", "single-object-void", "vertical-descent", "structure-as-subject", "whip-pan", "travel",
  "The door that never opened", "A bill sheet slides down a hallway past a first door that lights and a second door that holds."),
 (7, 7, "push-detail", "insert", "overhead", "guide-desk", "top-down-map", "centered-hero-lowerthird", "radial-emanate", "instrument-as-subject", "match-action", "carry",
  "A guide lands on the desk", "A guide folder drops onto a desk with the gold token on it and two hands reach for it."),
 (8, 8, "subject-portrait", "wide", "ground", "gate-frost", "eye-level-immersive", "fullbleed-split", "radial-emanate", "single-organic-hero", "mask-wipe", "build",
  "The frost and the waiting machine", "The Gate frosting over beside a cobwebbed drawer and a waiting server machine."),
 (9, 10, "push-detail", "close", "eye", "count-table", "macro-closeup", "hud-instrument-frame", "scroll-data", "data-as-subject", "focus-pull", "carry",
  "LaJiness says it plainly", "A name label on the winning stack with a typewriter quote and a dented token."),
 (10, 11, "alt-vantage", "medium", "low", "gate-ledger", "cross-section-cutaway", "stacked-layers", "assemble-build", "structure-as-subject", "graphic-match", "match",
  "A condition can be written", "The Gate's condition plate lights over four empty dial slots and a pen taps each one."),
 (11, 12, "wide-establish", "wide", "high", "guide-room", "exploded-diagram", "grid-modular", "scroll-data", "multiplicity-swarm", "carried-element", "carry",
  "The guide opens", "The guide folder opens to its title page and a Navy plate stamps its cover."),
 (12, 13, "macro-closeup", "insert", "eye", "token-desk", "macro-closeup", "single-object-void", "radial-emanate", "instrument-as-subject", "match-cut", "match",
  "Who benefits, who pays", "Question tokens radiate outward from the central token."),
 (13, 14, "two-up", "medium", "eye", "aperture-sort", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "whip-pan", "travel",
  "Two apertures", "A clinic box and a hangar box each stop at their own aperture plate."),
 (14, 15, "data-panel", "close", "eye", "dial-panel", "instrument-screen", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "fui-boot", "build",
  "Rules sized to what gets built", "A dial panel with the gold token as hub and two slots that resize."),
 (15, 16, "two-up", "wide", "high", "ice-fog-lot", "eye-level-immersive", "fullbleed-split", "pull-back-only", "structure-as-subject", "carried-element", "carry",
  "The blank sheet and the loop", "The opening framing again, the half-open Gate as the seam between the ballot box and the signpost stump, the blank sheet, the pen and the token on its sill, the camera drifting back out through the gap."),
]

AMBIENT = {
 1: "ice fog bands drift on two layers, snow dust turns, the token glints as it spins, the signpost arms sway",
 2: "ceiling lamps hum and flicker, dust motes drift in the lamp pools, the dim chairs sway a pixel, the lit chairs glint",
 3: "a brass lamp breathes two percent over the count table, dust motes drift in the pool, paper edges flutter",
 4: "the lamp pool on the wall breathes, a slow vignette drifts, the balance pans bob a pixel, the card's corner lifts",
 5: "cloud shadow drifts over the map, the gridlines glide, the pins pulse, the paper plane's fold flutters",
 6: "overhead lamp bars flicker slowly, dust drifts in the window shaft, a radiator ticks, the sheet ripples in the draft",
 7: "the desk lamp breathes, paper fibers drift, the folder cover flutters, dust motes turn in the lamp",
 8: "ice fog thickens and drifts, frost glints, the cobweb sways, the machine's status lamp blinks, the wall clock ticks",
 9: "the lamp pool breathes, dust drifts, the token's dent glints, the card ripples as the type lands",
 10: "a warm inner glow breathes in the Gate's seams, dust drifts, the four dials flicker, the pen glints",
 11: "overhead conference light hums, dust drifts, the title page riffles, the chairs sway a pixel",
 12: "the tokens drift on slow orbits, a lamp breathes, the central token glints",
 13: "two lamps breathe, the plates shimmer, dust motes drift, the boxes' lamps pulse",
 14: "the dial lamp breathes, tick marks shimmer, the hub token glints, a dark panel vignette drifts",
 15: "ice fog bands drift on two layers, snow dust turns, the pen shivers, the token glints, the Gate blinks",
}
CENTER = {1: "the Gate at x540 y1100", 2: "the chair grid at x540 y1000", 3: "the stacks at x540 y1100", 4: "the name card at x540 y960", 5: "the Juneau pin at x760 y900",
          6: "the second door at x540 y900", 7: "the folder at x540 y1000", 8: "the Gate at x420 y1100, the machine at x800", 9: "the quote card at x540 y960", 10: "the Gate's plate at x540 y900",
          11: "the guide at x540 y1000", 12: "the central token at x540 y1000", 13: "the two plates at x300 and x780", 14: "the dial at x540 y1000", 15: "the Gate at x540 y1100"}
HERO = {
 1: ("Gate", "60% gate, token, ballot box and sign, 25% fog lot and treeline, 15% sky"),
 2: ("ChairGrid + TallyCounter", "70% chair grid and clicker, 20% gym floor, 10% lamp grid"),
 3: ("BallotStacks + name labels", "55% stacks and sliver, 25% ruler and stamp, 20% table"),
 4: ("NameCard + balance scale", "50% card, 30% scale and weight, 20% wall"),
 5: ("AlaskaMini + calendar + paper plane", "50% map and pins, 30% calendar and plane, 20% table"),
 6: ("BillSheet + HouseDoors + tally lamps", "40% sheet, 40% doors, 20% hall floor and lamps"),
 7: ("GuideFolder + QuestionToken + hands", "50% folder and token, 30% hands, 20% desk"),
 8: ("Gate + ServerMachine + drawer", "45% Gate, 30% machine and clock, 25% drawer and frost"),
 9: ("NameCard + dented token", "55% card and quote, 30% token, 15% wall"),
 10: ("Gate + four dials + ReviewPen", "50% plate and dials, 30% Gate and seams, 20% pen and sill"),
 11: ("GuideFolder + Navy plate", "55% open guide, 25% plate, 20% table and chairs"),
 12: ("QuestionToken + radiating tokens", "50% central token, 40% tokens, 10% desk"),
 13: ("ThresholdGate + AperturePlate + boxes", "50% two plates, 35% boxes, 15% floor"),
 14: ("AperturePlate dial + QuestionToken hub", "60% dial, 25% slots, 15% panel and sign"),
 15: ("Gate + StandardsSheet + ReviewPen", "50% Gate and sill, 25% sheet and pen, 25% fog lot"),
}
PARTS = {1: 44, 2: 120, 3: 60, 4: 36, 5: 56, 6: 48, 7: 40, 8: 62, 9: 34, 10: 54, 11: 50, 12: 34, 13: 64, 14: 44, 15: 46}
STAGE3D = {k: "planes" for k in range(1, 16)}
STAGE3D[2] = "flat:a locked plan-view chair grid where depth adds nothing"
STAGE3D[14] = "flat:a locked dial panel, the turning dial is the motion"
CAMERA = {1: "dollyThrough", 2: "riseWith", 3: "truckAcross", 4: "dollyThrough", 5: "craneDown+truckAcross", 6: "dollyThrough", 7: "craneDown",
          8: "static:the stillness is the argument so the frost and the waiting machine move instead", 9: "static:the quote types on the label and the dent lands so nothing is passed through", 10: "orbitReveal", 11: "riseWith",
          12: "static:a slow rack between the satellite tokens so nothing is passed through", 13: "truckAcross", 14: "static:the dial turning is the whole shot", 15: "dollyThrough"}


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


def build():
    starts, real = line_starts()
    end = starts["end"]
    words = load_words() if real else {}

    def at(line, anc):
        nxt = starts.get(line + 1, end)
        if isinstance(anc, tuple):
            want, nth = anc
            if words:
                hits = [x for x in words.get(line, []) if norm(x["w"]) == norm(want)]
                if len(hits) >= nth:
                    return max(starts[line], float(hits[nth - 1]["s"]) - 0.05)
            toks = [norm(t) for t in LINES[line].split()]
            if norm(want) in toks:
                k = toks.index(norm(want))
                return starts[line] + (nxt - starts[line]) * (k / max(1, len(toks)))
            return starts[line] + 0.5 * (nxt - starts[line])
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
            "offset": round(a - starts[line], 3), "vo": LINES[line], "phrase": " ".join(LINES[line].split()[:4]),
            "shows": shows, "sfx": sfx, "means": ann.lower(), "rehook": rehook,
            "draw": {"subject": subj, "action": act, "emotion": emo, "annotation": ann},
            "choreo": {"primary": shows, "reaction": reaction, "ambient": AMBIENT[sh]},
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

    palette = "bright pearl fog daylight, warm cranberry gate, golden larch token, teal-black shadow, navy ink stamp"
    board = {
        "run_date": "2026-10-15", "slug": "the-door-with-a-condition", "title": "The Door With a Condition",
        "concept": ("A half-open Gate with a face stands for the Fairbanks Assembly's August request to pause new commercial data centers until standards exist. The film shows that the "
                    "October 6th vote did not decide the question, that the pause is a door with a condition rather than a no, and that a University of Alaska Fairbanks guide, Computing in Place, "
                    "hands out questions while the one data center bill that moved stalled in the House, so the open question is who writes the rules. A gold question token changes state "
                    "across the film and the blank STANDARDS sheet is the unpaid promise."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "horizontal-traverse", "hero_treatment": "structure-as-subject", "layout": "fullbleed-split",
                        "register": "naturalistic-scene", "palette": palette, "camera_strategy": "dolly-through", "light_story": "fog thickening through the Test, thinning at the turn, closing in at the button",
                        "metaphor": "a gate with a condition on its plate, waiting for a hand to write the rule"},
        "palette": palette,
        "divergence_note": ("10-11 opened on first-light rose tundra with a medicine crate, 10-10 was a night parking lot under sodium lamps and 10-09 a dusk utility yard. This film opens in pearl "
                            "daylight ice fog on a cranberry Gate that is the seam between a YES side and a NO side, moves through a plan-view gym floor of chairs, a count table, a map, a hallway and "
                            "a guide desk, and ends on a thin loop to the fog. The hero is a conditional rule rather than a machine or an object being carried, the opening is a split frame rather than "
                            "a centred portrait, and its palette is pearl, cranberry and larch gold, none of which the last three decks used. The honest overlaps are daylight and a pale snow world, "
                            "which 10-11 also had, so the break comes from the hue family and the split composition."),
        "treatment": {"winner": "The Dramatist's half-open Gate and its Padlock scene, with the Comedian's polite no and waiting machine, the Explainer's chair grid and four dials, and the Enthusiast's two apertures as the turn.",
                      "why": "All four pitches cast the Gate as hero and the QuestionToken as throughline, so the synthesis took each room's strongest fair beat."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A cranberry Gate with a face stands half open in ice fog as the seam between a ballot box and a YES and NO sign, a blank gold token spinning on its sill.",
                 "headline": "DID FAIRBANKS VOTE ON DATA CENTERS", "motion_by_s": 0.5,
                 "loopback": "The last frame is the same fog lot with the Gate half open and the token reading WHO WRITES THEM, and the open replays on the token spin."},
        "open_loop": {"plant_t": b_at(2), "pay_t": b_at(51), "what": "Who answered the data center question. Paid as a blank STANDARDS sheet and the Senate bill stalled beside it, and the question who writes them."},
        "open_loop_2": {"plant_t": b_at(21), "pay_t": b_at(39), "what": "The questions underneath. Paid as the guide's question tokens, who benefits and who pays."},
        "throughline": {"object": "the gold QuestionToken", "lands_in_button": "the token flips to WHO WRITES THEM on the sill of the half-open Gate in the same fog",
                        "states": [
                            {"at_s": b_at(1), "state": "blank gold disc lying on the Gate's sill, then spinning"},
                            {"at_s": b_at(4), "state": "engraved 1 IN 5 in the corner of the gym"},
                            {"at_s": b_at(15), "state": "engraved UNTIL on the Juneau slot's edge"},
                            {"at_s": b_at(59), "state": "frosted over to a blank disc on the Gate's sill"},
                            {"at_s": b_at(30), "state": "dented by the strongest no"},
                            {"at_s": b_at(40), "state": "re-engraved WHO PAYS"},
                            {"at_s": b_at(51), "state": "WHO WRITES THEM, seated on the sill of the half-open Gate"}]},
        "reveals": [
            {"t": b_at(3), "type": "build-on", "what": "the ballot box slot becomes the gym door and the chair grid builds from it", "hold_s": 0.6},
            {"t": b_at(14), "type": "mask-wipe", "what": "the request unfolds in the Juneau slot with PAUSE in large type", "hold_s": 0.5},
            {"t": b_at(33), "type": "build-on", "what": "the four labelled dials build on under the lit condition plate and the pen taps them", "hold_s": 0.6},
            {"t": b_at(45), "type": "scale-pullback", "what": "the camera pulls out until the server machine dwarfs the clinic box", "hold_s": 0.6}],
        "tail_s": 1.7, "audio_arc": {"build_steps": 4, "dip_at": round(starts[16] - 0.2, 3), "riser_at": round(starts[17] - 1.0, 3), "silence_at": round(starts[17] + 0.5, 3),
                      "payoff_at": b_at(51), "button_pattern": "question", "interrupt_at": b_at(23), "extra_dips": [b_at(31), b_at(39)]},
        "shots": shots, "beats": beats,
    }
    order = sorted(board["beats"], key=lambda b: (b["at_s"], b["id"]))
    ids = {b["id"]: rank for rank, b in enumerate(order, 1)}
    for b in board["beats"]:
        b["key"] = b["id"]
        b["id"] = ids[b["key"]]
    board["beats"].sort(key=lambda b: b["id"])
    board["_ids"] = ids
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1015Ids.ts").write_text(
        "// GENERATED by scripts/board_1015.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
