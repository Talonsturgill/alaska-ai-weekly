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
 (1, 1, 0, 0.0, "thunk", "Gate", "lifts its brow and the blank token spins on its sill", "wary", "DID FAIRBANKS VOTE ON DATA CENTERS",
  "the half-open cranberry Gate lifts its brow while a blank gold token spins on its sill, a ballot box on one side and a YES and NO signpost on the other, the Gate's boom the seam between them",
  "the YES and NO arms of the sign sway toward the spinning token", ""),
 (2, 1, 0, W("Except"), "snap", "signpost", "spins hard and snaps its own arrow off", "comic", "YES OR NO",
  "the YES and NO signpost spins hard and its arrow snaps off and clatters onto the snow",
  "the token keeps spinning between the two halves and the Gate blinks", ""),
 (3, 2, 1, 0.0, "tick", "folding chairs", "fill the gym floor from the middle", "blank", "OCT 6TH",
  "a plan view of a gym floor and a grid of folding chairs fills in from the centre under a calendar chip, most chairs dim",
  "the dim chairs sway a pixel and the overhead lamp grid hums", ""),
 (4, 2, 1, W("one"), "click", "tally clicker", "clicks one chair in five alight", "flat", "TURNOUT 20.95% · 16,177 OF 77,227 · UNOFFICIAL",
  "one chair in five lights gold-white as the tally clicker clicks, and the gold token in the corner engraves 1 IN 5",
  "the lit chairs glint and the dim ones stay put", ""),
 (5, 3, 2, 0.0, "whoosh", "ballot stacks", "rise side by side on the count table", "tense", "HOWELL 7,759 · RAMIREZ 7,542 · UNOFFICIAL",
  "two ballot stacks rise on a count table under a brass lamp with boxed name labels, Howell a hair taller",
  "the lamp sways a hair and paper edges flutter", ""),
 (6, 3, 2, W("two"), "tick", "sliver band", "opens between the stack tops and is measured", "tense", "217 VOTES",
  "a bright sliver band opens between the stack tops and a ruler measures it, 217",
  "the stacks lean away from each other by a pixel", ""),
 (7, 3, 2, W("unofficially"), "thud", "UNOFFICIAL stamp", "slams onto the ledger", "firm", "UNOFFICIAL",
  "a navy ink UNOFFICIAL stamp slams onto the ledger and the count table jumps",
  "the stacks jolt and settle a hair short", ""),
 (8, 4, 3, 0.0, "type", "name card", "slides in beside a blank token", "unsure", "MIGUEL RAMIREZ · NO POSITION",
  "the Ramirez name card slides into close-up with a blank un-engraved token beside it",
  "the card's corner lifts a hair as it lands", ""),
 (9, 4, 3, W("studies"), "tick", "balance scale", "holds its YAY and NAY pans level", "unsure", "MORE STUDIES",
  "a balance scale with level YAY and NAY pans and an unplaced MORE STUDIES weight hovering above them",
  "the pans bob a pixel and the weight turns slowly", ""),
 (10, 5, 4, 0.0, "riser", "three outlines", "each carry a faint question mark", "curious", "WHO ANSWERED THAT?",
  "three outlines on the borough map, a ballot box, a gavel and a Senate door, each stamped with a faint question mark while the token spins up a question",
  "the map's gridlines glide and the pins pulse", ""),
 (11, 5, 5, 0.0, "flip", "calendar", "flips backward to AUG 27TH", "brisk", "AUG 27TH",
  "the calendar leaf flips backward to AUG 27TH and a paper request folds in front of it",
  "the leaf curls and settles", "rehook: the reversal, the request came before the vote"),
 (12, 5, 5, W("asked"), "swoosh", "paper plane", "glides to the Juneau pin", "hopeful", "REQUEST TO THE LEGISLATURE",
  "the folded request glides over the map to a Juneau pin and lands in a slot",
  "the pin bobs as it lands", ""),
 (13, 5, 5, W("pause"), "chime", "condition plate", "lights with four dials still dark", "firm", "PAUSE UNTIL STANDARDS EXIST · PER KUAC",
  "the Gate's condition plate lights with the pause wording and the land qualifier, and four dials stay dark, ELECTRICAL DEMAND, WATER USE, ENVIRONMENTAL IMPACTS, AIR QUALITY",
  "the token engraves UNTIL and settles", ""),
 (41, 5, 5, W("reported"), "tick", "four dials", "tick once each and stay dark", "firm", "ELECTRICAL DEMAND · WATER USE · ENVIRONMENTAL IMPACTS · AIR QUALITY",
  "the four dials on the condition plate each tick once in turn and stay dark",
  "the plate's lamp glows steady", ""),
 (14, 6, 6, 0.0, "slide", "bill sheet", "slides down a long hallway", "hopeful", "DATA CENTER BILL · POWER USE · DECOMMISSIONING",
  "a bill sheet slides down a long hallway of overhead lamps toward a pair of doors",
  "the sheet's corners ripple in the draft", ""),
 (15, 6, 6, W("passed"), "tick", "tally lamps", "light one by one to fourteen against five", "pleased", "SENATE 14-5",
  "tally lamps light one by one beside the first door, fourteen lit against five dark",
  "the lamps glow and the door frame hums", ""),
 (16, 6, 6, W("House"), "knock", "second door", "rattles but holds", "blank", "HOUSE NEVER TOOK IT UP",
  "the bill sheet nudges the second door, which rattles and holds, and the sheet waits at its foot",
  "dust falls from the lintel", ""),
 (17, 7, 7, 0.0, "thump", "guide folder", "drops onto the desk with the token on its cover", "curious", "A GUIDE FROM UAF",
  "a guide folder drops onto a desk and the gold token lands on its cover",
  "the folder's cover flutters and the desk lamp breathes", ""),
 (18, 7, 7, W("skipped"), "blip", "two hands", "reach for the folder and the token spins away from both", "curious", "WHAT BOTH SIDES SKIPPED",
  "two hands labelled YES and NO reach for the folder and the token spins away from both",
  "the hands pull back empty", ""),
 (19, 8, 8, 0.0, "boom", "stamp", "comes down on the Gate's condition plate", "grim", "THE CASE AGAINST",
  "a heavy stamp comes down on the Gate's condition plate reading THE CASE AGAINST as frost starts at the Gate's arm",
  "the Gate's brow droops and the plate rattles", ""),
 (20, 8, 9, 0.0, "hiss", "frost", "spreads along the Gate's arm and freezes the token", "stiff", "THE PAUSE",
  "frost spreads along the Gate's arm and freezes over the token on its sill",
  "the fog thickens and drifts across the Gate and its breath shows", "rehook: the case against"),
 (21, 8, 9, W("drafts"), "tick", "cobweb", "falls across the STANDARDS drawer and settles", "stiff", "IF NOBODY DRAFTS THEM",
  "a cobweb falls across the STANDARDS drawer behind the Gate and settles",
  "the web sways and shakes in the draft", ""),
 (22, 8, 9, W("good"), "pop", "Gate", "holds up a neat NO, THANK YOU card and bows", "polite", "A NO WITH GOOD MANNERS",
  "the Gate holds up a neat NO, THANK YOU card and gives a small bow",
  "the card quivers and the token on the sill stays frosted", ""),
 (23, 8, 9, W("builds"), "punch", "server machine", "looks up at a wall clock as its ticket is punched FIRST", "patient", "FAVORS WHOEVER BUILDS FIRST",
  "a steel server machine waits at the front of the line, looks up at a wall clock, and a hole punch marks its ticket FIRST",
  "its status lamp blinks slowly", ""),
 (24, 9, 10, 0.0, "slide", "name card", "pushes in with a typewriter quote", "firm", "\"NOT GOOD FOR ANY COMMUNITY\" · NICK LAJINESS",
  "the LaJiness name card pushes in, WINNING INCUMBENT, and the quote begins typing at full strength",
  "the card's lamp pool breathes", ""),
 (25, 9, 10, W("community"), "clank", "token", "takes a dent", "grim", "WINNING INCUMBENT",
  "the gold token beside the card takes a dent as the quote ends",
  "the card settles and the dent glints", ""),
 (26, 10, 11, 0.0, "crack", "condition plate", "lights as frost cracks off the Gate", "relieved", "UNTIL STANDARDS EXIST",
  "the Gate's condition plate lights and the frost cracks off its arm in plates while the fog thins behind it",
  "the token's dent catches the light", "rehook: the pause ends when standards exist"),
 (27, 10, 11, W("door"), "chime", "glow", "runs down the Gate's seams into the pen", "hopeful", "A DOOR WITH A CONDITION",
  "a warm glow runs down the Gate's seams to its sill where a pen rests beside a blank STANDARDS sheet",
  "the pen rolls a hair and stops", ""),
 (28, 10, 11, W("written"), "tick", "pen", "taps each empty dial slot and leaves no ink", "hopeful", "A CONDITION CAN BE WRITTEN",
  "the pen taps each of the four empty dial slots in turn and leaves no ink",
  "the four dials flicker once each and stay dark", ""),
 (29, 11, 12, 0.0, "flip", "guide", "slides back in and opens to its title page", "warm", "COMPUTING IN PLACE",
  "the guide folder from the desk slides back in carrying its token and opens to a title page, COMPUTING IN PLACE",
  "the pages riffle once and settle", ""),
 (30, 11, 12, W("Navy's"), "stamp", "plate", "stamps onto the cover", "plain", "OFFICE OF NAVAL RESEARCH · PER THE DEPOSIT RECORD",
  "a navy plate stamps onto the guide's cover, OFFICE OF NAVAL RESEARCH, PER THE DEPOSIT RECORD",
  "the cover jumps a hair and the lamp breathes", ""),
 (31, 12, 13, 0.0, "pop", "tokens", "radiate outward from the central token, blank", "curious", "WHO BENEFITS? WHO PAYS? · AS UAF SUMMARIZES",
  "brass-and-gold question tokens radiate outward from the central token, each blank but for a question mark and an empty verdict slot",
  "the empty verdict slot stays empty", "rehook: the guide's questions arrive"),
 (33, 12, 13, W("pays"), "clink", "central token", "lights WHO BENEFITS and re-engraves itself WHO PAYS", "curious", "WHO PAYS",
  "the radiating tokens light WHO BENEFITS then WHO PAYS and the central token re-engraves itself to WHO PAYS and settles",
  "the radiating tokens draw back toward it", ""),
 (34, 13, 14, 0.0, "type", "name card", "slides in as the Gate splits into two apertures", "calm", "\"DIFFERENT QUESTIONS\" · LEASI VANESSA LEE RAYMOND, ACEP",
  "the Raymond name card slides in with the quote typing and the big gate splits into two apertures, one small and one large",
  "the two plates settle on either side of the card", ""),
 (46, 13, 14, W("small"), "roll", "clinic box", "rolls in from the left edge of the frame", "plain", "A SMALL FACILITY",
  "a small clinic box rolls in from the left edge of the frame toward the two apertures",
  "the aperture plates tilt toward it", ""),
 (35, 13, 14, W("hospital"), "roll", "clinic box", "arrives at the small aperture and stops at its own plate", "plain", "HOSPITAL OR TRIBAL FACILITY",
  "a small clinic box arrives at the small aperture and stops at its own plate, which shows its own question card",
  "the box's lamp warms", ""),
 (42, 13, 14, W("raises"), "flip", "question card", "flips over on the clinic box's plate", "plain", "A SMALL FACILITY · ITS OWN QUESTIONS",
  "the question card on the clinic box's plate flips over to a new question as the quote reaches different questions",
  "the plate's lamp warms", ""),
 (36, 13, 14, W("hyperscale"), "whoosh", "hangar box", "arrives at the large aperture as the camera pulls out", "plain", "HYPERSCALE · DIFFERENT QUESTIONS",
  "the camera pulls out until a hangar-sized box dwarfs the clinic box, and it stops at the large aperture's plate with a different question card",
  "the hangar box's lamp warms and the clinic box looks small beside it", ""),
 (43, 13, 14, W("customers"), "roll", "hangar box", "rolls to a stop at its plate", "plain", "A HYPERSCALE FACILITY · OTHER QUESTIONS",
  "the hangar box rolls to a stop at the large aperture's plate and its question card drops into place",
  "the clinic box settles behind it", ""),
 (37, 14, 15, W("missing"), "snap", "signpost", "folds away at the side of the panel", "plain", "NOT YES, NOT NO",
  "the snapped YES and NO signpost is folded away at the side of the dial panel",
  "the panel's dial lamp glows", ""),
 (38, 14, 15, W("rules"), "whir", "dial", "turns and resizes the two slots", "focused", "RULES SIZED TO WHAT GETS BUILT",
  "the dial at the panel's centre turns, with the gold token as its hub, and two slots resize themselves",
  "the tick marks shimmer", ""),
 (44, 14, 15, W("built"), "tick", "tick marks", "light beside each slot size", "focused", "A SLOT FOR EACH SIZE",
  "tick marks light beside each of the two slot sizes at the end of the dial's turn",
  "the dial settles with a small overshoot", ""),
 (39, 15, 16, 0.0, "riser", "pen", "hovers over the first dotted line of the blank sheet", "expectant", "ONE BLANK PAGE",
  "the half-open Gate in the fog lot, the blank STANDARDS sheet on its cranberry sill and a pen hovering over a dotted first line",
  "the fog rolls in and the pen shivers", ""),
 (45, 15, 16, W("stalled"), "knock", "bill sheet", "waits at the foot of a small shut door in an inset", "blank", "THE ONE BILL THAT MOVED STALLED IN THE HOUSE",
  "a small inset opens at the corner of the frame showing the bill sheet waiting at the foot of the shut House door",
  "the sheet's corner lifts in the draft", ""),
 (40, 15, 17, 0.0, "chime", "token", "flips to WHO WRITES THEM on the sill", "expectant", "WHO WRITES THEM?",
  "the gold token flips to WHO WRITES THEM on the sill of the half-open Gate as the fog closes in",
  "the Gate's lamp swings half open", ""),
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
 (8, 8, "subject-portrait", "wide", "ground", "gate-frost", "eye-level-immersive", "fullbleed-split", "push-in-only", "single-organic-hero", "mask-wipe", "build",
  "The frost and the waiting machine", "The Gate frosting over beside a cobwebbed drawer and a waiting server machine."),
 (9, 10, "macro-closeup", "close", "eye", "quote-wall", "macro-closeup", "hud-instrument-frame", "scroll-data", "data-as-subject", "focus-pull", "carry",
  "LaJiness says it plainly", "A name card with a typewriter quote and a dented token."),
 (10, 11, "alt-vantage", "medium", "low", "gate-ledger", "cross-section-cutaway", "stacked-layers", "assemble-build", "structure-as-subject", "graphic-match", "match",
  "A condition can be written", "The Gate's condition plate lights over four empty dial slots and a pen taps each one."),
 (11, 12, "wide-establish", "wide", "high", "guide-room", "exploded-diagram", "grid-modular", "scroll-data", "multiplicity-swarm", "pull-out", "build",
  "The guide opens", "The guide folder opens to its title page and a Navy plate stamps its cover."),
 (12, 13, "macro-closeup", "insert", "eye", "token-desk", "macro-closeup", "single-object-void", "radial-emanate", "instrument-as-subject", "match-cut", "match",
  "Who benefits, who pays", "Question tokens radiate outward from the central token."),
 (13, 14, "two-up", "medium", "eye", "aperture-sort", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "whip-pan", "travel",
  "Two apertures", "A clinic box and a hangar box each stop at their own aperture plate."),
 (14, 15, "data-panel", "close", "eye", "dial-panel", "instrument-screen", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "fui-boot", "build",
  "Rules sized to what gets built", "A dial panel with the gold token as hub and two slots that resize."),
 (15, 16, "subject-portrait", "wide", "ground", "ice-fog-lot", "eye-level-immersive", "single-object-void", "push-in-only", "single-organic-hero", "carried-element", "carry",
  "The blank sheet and the loop", "The half-open Gate in the fog lot with the blank sheet, the pen and the token."),
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
CAMERA = {1: "truckAcross", 2: "riseWith", 3: "truckAcross", 4: "dollyThrough", 5: "craneDown+truckAcross", 6: "dollyThrough", 7: "craneDown",
          8: "static:the stillness is the argument so the frost and the waiting machine move instead", 9: "dollyThrough", 10: "orbitReveal", 11: "riseWith",
          12: "dollyThrough", 13: "truckAcross", 14: "static:the dial turning is the whole shot", 15: "dollyThrough"}


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

    palette = "bright pearl fog daylight, warm cranberry gate, golden larch token, teal-black ink, navy stamp"
    board = {
        "run_date": "2026-10-15", "slug": "the-door-with-a-condition", "title": "The Door With a Condition",
        "concept": ("A half-open Gate with a face stands for the Fairbanks Assembly's August request to pause new commercial data centers until standards exist. The film shows that the "
                    "October 6th vote did not decide the question, that the pause is a door with a condition rather than a no, and that a University of Alaska Fairbanks guide, Computing in Place, "
                    "hands out questions while the one data center bill that moved stalled in the House, so the open question is who writes the rules. A gold question token changes state "
                    "across the film and the blank STANDARDS sheet is the unpaid promise."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "horizontal-traverse", "hero_treatment": "structure-as-subject", "layout": "fullbleed-split",
                        "register": "naturalistic-scene", "palette": palette, "camera_strategy": "dolly-through", "light_story": "overcast-diffuse",
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
        "open_loop": {"plant_t": b_at(2), "pay_t": b_at(40), "what": "Who answered the data center question. Paid as a blank STANDARDS sheet and the one bill that stalled."},
        "open_loop_2": {"plant_t": b_at(18), "pay_t": b_at(31), "what": "What both sides skipped. Paid as the guide's question tokens, who benefits and who pays."},
        "throughline": {"object": "the gold QuestionToken", "lands_in_button": "the token flips to WHO WRITES THEM on the sill of the half-open Gate in the same fog",
                        "states": [
                            {"at_s": b_at(1), "state": "blank gold disc spinning on the Gate's sill"},
                            {"at_s": b_at(4), "state": "engraved 1 IN 5 in the corner of the gym"},
                            {"at_s": b_at(13), "state": "engraved UNTIL on the Gate's sill"},
                            {"at_s": b_at(20), "state": "frosted over on the sill"},
                            {"at_s": b_at(25), "state": "dented by the strongest no"},
                            {"at_s": b_at(33), "state": "re-engraved WHO PAYS"},
                            {"at_s": b_at(40), "state": "WHO WRITES THEM, seated on the sill of the half-open Gate"}]},
        "reveals": [
            {"t": b_at(3), "type": "scale-pullback", "what": "the Gate shrinks to an icon as a gym floor of chairs rises", "hold_s": 0.6},
            {"t": b_at(13), "type": "mask-wipe", "what": "the plane lands in the Juneau slot and the condition plate wipes in", "hold_s": 0.5},
            {"t": b_at(28), "type": "build-on", "what": "the condition plate builds on the four empty dial slots and the pen", "hold_s": 0.6},
            {"t": b_at(36), "type": "scale-pullback", "what": "the camera pulls out until the hangar box dwarfs the clinic box", "hold_s": 0.6}],
        "audio_arc": {"build_steps": 4, "dip_at": round(starts[16] - 0.2, 3), "riser_at": round(starts[17] - 1.0, 3), "silence_at": round(starts[17] - 0.3, 3),
                      "payoff_at": round(starts[17] + 0.3, 3), "button_pattern": "question", "interrupt_at": b_at(20), "extra_dips": [b_at(26), b_at(31)]},
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
