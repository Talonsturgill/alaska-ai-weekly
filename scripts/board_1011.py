#!/usr/bin/env python3
"""2026-10-11 "This Crate Was Supposed To Fly": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1011.py gen       # write out/dispatch/storyboard.json from the tables below
                                            # (times estimated from word counts until the voice exists)
    python3 scripts/board_1011.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json

Beats anchor to (vo_line, fraction of that line), so the film re-times itself with the voice. The
tables are the single source: nothing here is typed twice. Mirrors conform_dispatch_board.py's
contract (idempotent, never edits the narration, only binds picture and sound to it).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"

LINES = [
    "This drone crate was supposed to fly.",
    "The Anchorage Daily News reports UAA economist Mike Jones set out to study delivering goods and medicine to rural Alaska by drone.",
    "Then the study changed shape.",
    "In his words, \"The impetus for the study was actually transportation research. What it's become is significantly more than that.\"",
    "Now it's about what rural groceries cost.",
    "Jones's team used code written by AI to clean up the price data.",
    "Per the Daily News, researchers in Quebec spent hundreds of hours on similar work by hand.",
    "The code didn't set a single price, and Jones said it still needs human oversight. Those shelf prices land beside a federal rule.",
    "Under federal law, SNAP benefits in rural Alaska start from a food plan priced in Anchorage and adjusted by zone. The zones are urban, rural one and rural two.",
    "The Daily News calls the formula forty years old.",
    "The case for the old way. One city price plus fixed zones is steady, and anyone can audit it.",
    "Prices scattered across rural shelves are noisy.",
    "The research hasn't been published yet, and it all comes from one news report.",
    "Jones hopes the data will inform USDA's update of SNAP benefit rates in Alaska.",
    "That's a hope, not a decision.",
    "A price measured on the shelf is different evidence than one worked out from Anchorage.",
    "How much it weighs waits on publication, and USDA.",
    "When those prices are out, will they match Anchorage plus a zone?",
    "This drone crate was supposed to fly.",
]

# id, shot, vo_line, anchor (a fraction of the line, or ("word", nth) snapped to that spoken word), sfx, subject, action, emotion, annotation, shows, reaction, rehook
B = [
    (1, 1, 0, 0.00, "bloop", "FlightCrate", "whines its rotors up and lifts an inch", "hopeful", "STUDY CRATE",
     "the FlightCrate's four rotors whine up and it lifts an inch off first-light tundra as a blank kraft tag spins on its handle",
     "the cottongrass flattens in the rotor wash", ""),
    (2, 1, 0, ("fly", 1), "thunk", "FlightCrate", "settles gently back onto the snow", "wistful", "STARTED AS DRONE DELIVERY RESEARCH",
     "the crate settles back onto the snow and the rotors wind down while the tag keeps spinning",
     "a soft ring of snow-dust lifts and drifts off the lid", ""),
    (3, 2, 1, 0.00, "slide", "AlaskaMini", "rises as the camera pulls back", "curious", "PER ANCHORAGE DAILY NEWS",
     "the camera pulls back from the crate and a map plate of Alaska slides up with a PER ANCHORAGE DAILY NEWS chip",
     "the crate shrinks onto the map and its rotors fold", ""),
    (4, 2, 1, ("Mike", 1), "blip", "name chip", "pins to the map beside the dotted plan", "focused", "MIKE JONES · UAA",
     "a name chip, MIKE JONES · UAA, pins to the map at the start of the route",
     "the map pin pulses once", ""),
    (5, 2, 1, ("delivering", 1), "tick", "dotted flight line", "draws itself toward a village pin", "hopeful", "A DRONE DELIVERY PLAN",
     "a dotted route draws itself across the map toward a village pin, a plan and never a flight",
     "the pin bobs as the line reaches it", ""),
    (6, 3, 2, 0.00, "whoosh", "rotor blades", "unscrew and flutter into price tags", "playful", "A BLADE BECOMES A TAG",
     "the rotor blades unscrew, float off and each one flutters into a kraft price tag that settles on a rural store shelf",
     "the shelf's own edge tags tremble as the new ones land", ""),
    (8, 3, 3, ("impetus", 1), "click", "crate tag", "drops in and flips to a smudged face with a blank destination line", "puzzled", "WHERE IS IT HEADED?",
     "the study's tag drops in on its string and flips to scrawled illegible shelf entries and a blank destination line that pulses",
     "the shelf tags lean to read it", ""),
    (39, 3, 3, ("What", 1), "blip", "crate tag", "pulses its blank destination line", "puzzled", "BLANK DESTINATION LINE",
     "the study tag's blank destination line pulses again as the second half of the quote begins",
     "the shelf tags lean toward the pulse", ""),
    (7, 3, 3, ("significantly", 1), "page", "quote plate", "types the quote across the shelf", "earnest", "\"SIGNIFICANTLY MORE THAN THAT\" · MIKE JONES",
     "a quote plate lands with Jones's words over the shelf",
     "the tag stills on its string as the words land", ""),
    (9, 4, 4, 0.00, "slide", "grocery shelf", "slides in beside a blank mint code sheet", "curious", "RURAL ALASKA GROCERY PRICES",
     "a rural grocery shelf slides in beside a blank mint code sheet on a dark grid",
     "the code sheet's cursor starts to blink", ""),
    (10, 4, 4, ("groceries", 1), "tick", "shelf tags", "disagree about the same can", "baffled", "UNCLEANED PRICE DATA",
     "on the shelf two tags for the same can carry codes that do not line up and a dashed ring circles them",
     "the neighbouring cans lean away from the muddle", ""),
    (11, 4, 5, ("code", 1), "page", "code sheet", "prints mint lines and the smudged entries snap into rows", "satisfied", "AI-WRITTEN CODE · CLEANED THE PRICE DATA",
     "the mint code sheet prints line by line and the smudged shelf entries snap one by one into ruled rows",
     "the shelf tags straighten on their pegs row by row", "rehook: the first payoff, messy becomes ruled"),
    (12, 4, 5, ("clean", 1), "click", "kraft tag", "is combed flat and set on a fresh string", "relieved", "CODE WRITTEN BY AI",
     "the code comb passes over the tag and it comes out flat on a fresh string with its barcode in clean bars",
     "the comb ray fades out down the shelf", ""),
    (42, 5, 6, 0.00, "slide", "seam", "closes down the middle with a Quebec desk on the left", "weary", "PER ADN",
     "a hard seam closes down the middle of the frame with a desk of hand-matched tags on the left and a chip, PER ADN",
     "the lamp on the desk sways", ""),
    (13, 5, 6, ("hundreds", 1), "thunk", "paper stack", "grows past the top of frame as a tally counter clicks", "weary", "QUEBEC · HUNDREDS OF HOURS BY HAND · PER ADN",
     "on the left of a hard seam a stack of hand-matched tags grows past the top of the frame as a brass tally counter clicks",
     "the seated figure keeps sorting without looking up", ""),
    (15, 5, 7, ("single", 1), "slide", "red pen", "a hand runs it down the code sheet that slid across the seam", "careful", "A PERSON READS THE CODE",
     "the mint code sheet slides across the seam and a hand holding a red pen runs down its lines, underlining one row at a time",
     "the code sheet's glow dims a little under the pen", ""),
    (14, 5, 7, ("oversight", 1), "tick", "red pen", "rests on one line and does not move on", "careful", "JONES SAYS IT STILL NEEDS HUMAN OVERSIGHT",
     "the pen comes to rest on one line while a plate carries Jones's caution",
     "the Quebec stack stops growing", ""),
    (50, 5, 7, ("Those", 1), "page", "combed shelf tag", "lifts off the code sheet and slides toward the seam", "steady", "SHELF PRICES",
     "the combed shelf tag lifts off the code sheet and slides toward the seam as the shelf prices are named",
     "the code sheet's glow follows it and dims", ""),
    (36, 5, 7, ("federal", 1), "slide", "steel panel", "wipes in from the right edge", "steady", "FEDERAL RULE",
     "a steel panel wipes in from the right edge of the frame, riveted and plain, and pushes the code sheet out",
     "the seam line bends under the steel", ""),
    (51, 6, 8, ("Under", 1), "whoosh", "skyline", "whips in under a pale morning", "steady", "A STEEL BEAM",
     "a whip pan lands on the Anchorage skyline and a steel beam rises with two empty hooks",
     "the beam's rivets catch the morning light", "rehook: the pivot to the federal rule"),
    (16, 6, 8, ("SNAP", 1), "click", "plate", "names SNAP BENEFITS IN RURAL ALASKA", "steady", "SNAP BENEFITS · RURAL ALASKA",
     "a plate names SNAP BENEFITS IN RURAL ALASKA over the empty beam",
     "the beam's rivets catch the morning light", ""),
    (35, 6, 8, ("Anchorage", 1), "clunk", "steel tag", "drops onto the left hook", "steady", "ANCHORAGE FOOD PRICES",
     "a steel tag stamped ANCHORAGE drops onto the beam's left hook",
     "the beam dips a hair and levels", ""),
    (17, 6, 8, ("adjusted", 1), "slide", "zone weights", "slide out from the steel tag on chains", "methodical", "ANCHORAGE PRICES PLUS ZONE ADJUSTMENT · 7 CFR 273.10",
     "three identical gold weights slide out on chains from the steel tag and a dotted gap with a question mark opens between it and the empty right hook",
     "the empty hook swings, waiting", ""),
    (34, 6, 8, ("urban", 1), "tick", "zone weights", "light up one by one", "methodical", "URBAN · RURAL I · RURAL II",
     "the three zone weights light up one by one as the zones are named, URBAN, RURAL I and RURAL II",
     "the steel tag swings a hair with each light", ""),
    (18, 6, 9, 0.00, "clunk", "kraft tag", "hangs from a drawer knob in the archive", "wry", "THE RULE ON FILE",
     "in an archive wall of steel drawers the shelf tag hangs from the knob of the drawer labelled with the rule",
     "the dotted gap with its question mark pulses between the two tags, never narrowing", ""),
    (44, 7, 9, ("forty", 1), "page", "kraft tag", "flips through edge-on to its rule face", "wry", "ADN CALLS IT A 40-YEAR-OLD FORMULA",
     "the shelf tag flips through edge-on to its rule face and a chip lands, ADN CALLS IT A 40-YEAR-OLD FORMULA",
     "the knob's drawer label catches the lamp", ""),
    (40, 7, 10, 0.00, "whoosh", "snowy bluff", "opens under falling snow", "calm", "A STEADY BEAM",
     "a snowy bluff opens with the Anchorage beam standing in it under falling snow",
     "the snow settles on the bluff and the light goes flat", ""),
    (19, 7, 10, ("plus", 1), "thunk", "steady beam", "stands with its steel tag and three weights", "calm", "ONE CITY PRICE PLUS FIXED ZONES",
     "the Anchorage beam with its steel tag and three weights settles on a snowy bluff",
     "the weights settle on their chains", "rehook: the fair case against, at full strength"),
    (45, 7, 10, ("steady", 1), "thunk", "beam", "stays unmoved while snow loads on top of it", "calm", "STEADY",
     "snow loads onto the beam's top edge and the beam does not move",
     "the weights barely sway", ""),
    (20, 7, 10, ("audit", 1), "blip", "inspection light", "runs along the beam so every part reads", "orderly", "STEADY · AUDITABLE",
     "a nickel inspection light runs along the beam so every part of it reads",
     "the light's cone sweeps the snow", ""),
    (21, 7, 11, 0.00, "whoosh", "rural tags", "swirl in a gust that also hits the shelf tag", "chaotic", "RURAL PRICES ARE NOISY",
     "a gust sends a cart of rural tags swirling and jittering and blurs the shelf tag's clean rows back toward the smudge before they settle",
     "the post and its crossbar creak", ""),
    (38, 7, 11, ("noisy", 1), "slide", "swirl tags", "two of them tear away and blow off the frame", "chaotic", "SCATTERED SHELF TAGS",
     "two loose tags tear away from the swirl and tumble off the right edge",
     "the remaining tags jitter and rebalance", ""),
    (52, 8, 12, 0.00, "slide", "proof desk", "opens with the tag hanging below a news clipping", "sober", "ONE CLIPPING",
     "a pale proof desk opens with the shelf tag hanging by one string below a single news clipping",
     "the string sways in the lamp's warmth", ""),
    (22, 8, 12, ("published", 1), "stamp", "NOT PUBLISHED YET stamp", "lands on the shelf tag", "sober", "NOT PUBLISHED YET",
     "a stamp reading NOT PUBLISHED YET slams onto the shelf tag, which hangs from a single string tied to a news clipping",
     "the tag swings on its one string and ink flecks the clipping", ""),
    (23, 8, 12, ("one", 1), "click", "single chip", "pins under the tag", "plain", "ONE OUTLET · ANCHORAGE DAILY NEWS",
     "a chip pins under the tag, ONE OUTLET · ANCHORAGE DAILY NEWS, and the string it hangs by stays taut",
     "the clipping's pins catch the lamp", ""),
    (24, 9, 13, 0.00, "slide", "dotted line", "grows across the map as the shelf tag sets off", "hopeful", "A DOTTED LINE ACROSS ALASKA",
     "a dotted line grows across the Alaska map and the shelf tag sets off along it",
     "the dotted line marches as it grows", ""),
    (46, 9, 13, ("update", 1), "slide", "USDA marker", "rises at the edge of the map", "plain", "HOPED TO INFORM USDA · SNAP RATES IN ALASKA",
     "a plain green USDA signpost rises at the edge of the Alaska map at the end of the dotted line",
     "the signpost board catches the light", ""),
    (26, 9, 14, ("hope", 1), "click", "tag destination line", "fills in as a dotted USDA address", "wistful", "HOPED · NOT A DECISION",
     "the tag flips and its blank destination line fills in, dotted, USDA, with a HOPED chip",
     "the signpost stays unlit and unchanged", ""),
    (27, 10, 15, 0.00, "clunk", "shelf tag", "swings in on a rope between two stakes", "curious", "SHELF PRICE",
     "on the dawn tundra the shelf tag swings in alone on a rope strung between two stakes",
     "the rope sags and the stakes lean", ""),
    (48, 10, 15, ("different", 1), "blip", "rope", "sags and a glint runs along it", "curious", "DIFFERENT EVIDENCE",
     "the rope sags and a pale glint runs along it as the turn is spoken",
     "the stakes lean in", "rehook: the turn, a different kind of evidence"),
    (49, 10, 15, ("worked", 1), "slide", "Anchorage tag", "swings in on the rope's far end", "steady", "ANCHORAGE PRICE PLUS ZONE",
     "the steel Anchorage tag swings in on the far end of the rope, ANCHORAGE + ZONE",
     "the rope rocks and the shelf tag swings out of phase", ""),
    (28, 10, 15, ("Anchorage", 1), "snap", "calipers", "swing open between the tags with a dotted readout", "pending", "NOBODY HAS PUBLISHED THE DISTANCE",
     "brass calipers swing open between the two tags and the readout stays dotted",
     "the two tags settle out of phase", ""),
    (29, 10, 16, ("weighs", 1), "click", "readout", "turns into two empty slots", "patient", "PUBLICATION · USDA",
     "the dotted readout becomes two empty dashed slots, PUBLICATION and USDA, and nothing fills them",
     "the calipers hold their opening", ""),
    (30, 10, 16, ("publication", 1), "blip", "empty slots", "pulse one after the other", "patient", "WAITS ON PUBLICATION AND USDA",
     "the PUBLICATION slot pulses and then the USDA slot pulses, and both stay empty",
     "the rope sways once in a breath of wind", ""),
    (31, 11, 17, 0.00, "whoosh", "tundra crate", "is parked at first light with the tag spinning", "wistful", "WILL THEY MATCH ANCHORAGE PLUS A ZONE?",
     "back on the dawn tundra the crate sits parked with its rotors furled and the tag spinning on its handle",
     "the clouds drift and the grass shivers", ""),
    (54, 11, 17, ("match", 1), "snap", "study tag", "stills on its measured face then turns to its rule face", "curious", "MEASURED OR ANCHORAGE PLUS A ZONE",
     "the spinning tag stills on its measured face and turns to its rule face as Anchorage is said",
     "the grass leans toward it", ""),
    (32, 11, 17, ("zone", 1), "riser", "rotors", "unfold with a small twitch", "hopeful", "A QUESTION",
     "the rotors unfold with a small twitch as the music thins",
     "the cottongrass leans toward the crate", ""),
    (33, 11, 18, 0.00, "bloop", "FlightCrate", "holds with its rotors unfolded and still", "hopeful", "STUDY CRATE",
     "the rotors hold unfolded and still, the frame the film opened on, while the tag keeps spinning",
     "the snow-dust lifts off the lid", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
    (1, 0, "subject-portrait", "wide", "ground", "tundra-dawn", "eye-level-immersive", "single-object-void", "vertical-rise", "single-organic-hero", "", "",
     "The crate that was supposed to fly", "A FlightCrate on first-light tundra whines its rotors up, lifts an inch and settles."),
    (2, 1, "map-territory", "extreme-wide", "high", "tundra-map", "orbital-aerial", "map-territory", "horizontal-traverse", "landscape-as-subject", "pull-out", "carry",
     "The study that was supposed to fly", "The camera pulls back from the crate to a map of Alaska with a dotted drone plan."),
    (3, 2, "push-detail", "medium", "eye", "store-shelf", "macro-closeup", "stacked-layers", "vertical-descent", "multiplicity-swarm", "match-cut", "match",
     "Blades become price tags", "The rotor blades flutter into kraft price tags that settle on a rural store shelf."),
    (4, 4, "macro-closeup", "close", "eye", "shelf-and-code", "instrument-screen", "hud-instrument-frame", "scroll-data", "data-as-subject", "whip-pan", "travel",
     "The code that cleaned the shelf", "A rural grocery shelf beside a mint code sheet that prints and combs the smudged tags into rows."),
    (5, 6, "two-up", "wide", "high", "split-quebec-oversight", "eye-level-immersive", "fullbleed-split", "vertical-rise", "structure-as-subject", "carried-element", "carry",
     "Hours by hand, and the person checking", "A hard seam splits a Quebec desk of hand-matched tags from the mint code sheet and a red pen that reads down it."),
    (6, 8, "map-territory", "extreme-wide", "high", "anchorage", "exploded-diagram", "grid-modular", "assemble-build", "structure-as-subject", "whip-pan", "travel",
     "The starting price", "A steel beam under the Anchorage skyline holds one tag and three zone weights and waits with an empty hook."),
    (61, 9, "alt-vantage", "close", "eye", "rule-archive", "cross-section-cutaway", "grid-modular", "push-in-only", "single-organic-hero", "match-cut", "match",
     "The rule on file", "In an archive wall of steel drawers the shelf tag hangs from the drawer that holds the rule and flips to its rule face."),
    (7, 10, "two-up", "medium", "low", "beam-yard", "eye-level-immersive", "fullbleed-split", "radial-emanate", "multiplicity-swarm", "match-action", "match",
     "The case for the old way", "A steady beam on a snowy bluff against a gust of noisy rural tags that also blurs the shelf tag."),
    (8, 12, "macro-closeup", "insert", "eye", "proof-desk", "macro-closeup", "single-object-void", "push-in-only", "single-organic-hero", "hard-cut", "match",
     "Not published yet", "A stamp lands on the shelf tag, which hangs from one string tied to one news clipping."),
    (9, 13, "alt-vantage", "wide", "overhead", "usda-marker", "top-down-map", "map-territory", "assemble-build", "structure-as-subject", "map-travel", "travel",
     "A hope, not a decision", "A plain USDA signpost on the map and the tag that stops a clear gap short of it."),
    (10, 15, "two-up", "close", "low", "tundra-rope", "eye-level-immersive", "fullbleed-split", "radial-emanate", "instrument-as-subject", "carried-element", "carry",
     "Different evidence", "Two tags on a rope between stakes at dawn, calipers open, the readout two empty slots."),
    (11, 17, "subject-portrait", "wide", "ground", "tundra-dawn", "eye-level-immersive", "single-object-void", "vertical-rise", "single-organic-hero", "graphic-match", "match",
     "The question, and the parked crate", "Back on the dawn tundra the crate sits parked, the rotors unfold and the tag spins."),
]

# Per-shot choreography (ambient life the held frame runs on) and centre of interest.
AMBIENT = {
    1: "tundra cottongrass shivers, clouds drift, the tag swings, snow-dust blows off the crate lid, the gauge needle hunts",
    2: "map pin pulses, the dotted line marches, tundra ripples below, the map card's gridlines glide",
    3: "tags flutter and settle, shelf cans gleam, dust turns in the light, the study tag swings",
    4: "code lines scroll, the mint glow breathes, shelf tags tremble, cans gleam, dust turns in the lamp light",
    5: "the tally counter clicks, the stack leans, the pen drifts, the figure keeps sorting, a lamp sways on each side",
    6: "the skyline lights blink, clouds slide, the beam hum shows as a faint shimmer, the weights swing on their chains",
    7: "snow falls, the swirl keeps moving, the inspection light slides along the beam, snow streaks cross the right half",
    8: "the lamp pool breathes, the tag sways on its string, dust turns, the clipping's pins glint",
    9: "the map pin pulses, the dotted line marches, the signpost board catches the light, map gridlines glide",
    10: "the rope sags and sways, the tags swing out of phase, the calipers tremble, clouds drift behind",
    11: "tundra grass shivers, clouds drift, the tag spins edge-on, the gauge needle hunts",
    61: "the drawer knobs shine, the tag sways on its string, the lamp pool breathes, a slow push drifts across the steel wall",
}
CENTER = {1: "the crate at x540 y1180", 2: "the map plate at x540 y1000", 3: "the shelf at x540 y1150", 4: "the code sheet at x540 y1000",
          5: "the seam at x540", 6: "the beam at x540 y900", 7: "the beam at x300, the swirl at x780",
          8: "the tag at x540 y1000", 9: "the signpost at x860 y950", 10: "the two tags at x290 and x790", 11: "the crate at x540 y1180", 61: "the hanging tag at x540 y900"}
HERO = {
    1: ("FlightCrate", "70% crate and rotors and tag, 20% tundra and ridge, 10% sky"),
    2: ("AlaskaMini + FlightCrate icon", "60% map and dotted plan, 25% crate icon and name chip, 15% dawn ground"),
    3: ("KraftTag + falling blades", "50% tags and blades, 30% shelf, 20% store wall"),
    4: ("GroceryShelf + CodeSheet", "50% code sheet and comb, 35% shelf tags, 15% grid backdrop"),
    5: ("DriftStack + CodeSheet + red pen", "40% stack and tally, 40% code sheet and pen, 20% seam and desks"),
    6: ("ZoneBeam + steel tag + ZoneWeights", "60% beam and steel tag, 25% three equal weights and the dotted gap, 15% skyline"),
    7: ("ZoneBeam + RuralSwirl + shelf tag", "40% beam and light, 40% swirl and the hanging shelf tag, 20% bluff"),
    8: ("KraftTag + stamp", "60% tag and stamp, 25% clipping, 15% desk"),
    9: ("UsdaMarker + KraftTag", "45% tag and dotted line, 30% signpost, 25% map"),
    10: ("KraftTag + SteelTag + Calipers", "50% caliper jaws and the empty slots, 30% two tags, 20% rope and dawn"),
    11: ("FlightCrate", "70% crate and rotors and tag, 20% tundra, 10% sky"),
    61: ("KraftTag + DrawerWall", "55% the flipping shelf tag, 30% the labelled drawer, 15% the steel wall"),
}
PARTS = {1: 60, 2: 36, 3: 52, 4: 58, 5: 62, 6: 48, 61: 44, 7: 56, 8: 34, 9: 38, 10: 46, 11: 60}
CHOREO_STAGE3D = {1: "planes", 2: "planes", 3: "planes", 4: "flat:a locked code sheet, depth adds nothing", 5: "flat:a locked split with a seam, depth adds nothing",
                  6: "planes", 7: "planes", 8: "flat:a locked macro, the swing is the motion", 9: "planes", 10: "planes", 11: "planes", 61: "flat:a locked archive wall, the flip is the motion"}
CAMERA = {1: "craneDown", 2: "dollyThrough+craneDown", 3: "truckAcross", 4: "static:a locked code sheet where the lines and the tags move", 5: "static:a locked split where the stack grows and the pen moves",
          6: "truckAcross+riseWith", 7: "dollyThrough", 8: "static:a locked macro where the tag swings", 9: "craneDown", 10: "orbitReveal", 11: "craneDown+dollyThrough", 61: "static:a locked archive wall where the tag flips"}


def est_starts():
    """Rough line starts from word counts until the voice exists."""
    t, out = 0.0, {}
    for i, s in enumerate(LINES):
        out[i] = t
        t += max(1.6, len(s.split()) * 0.50) + (0.22 if s.endswith((".", "?", "!")) else 0)
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
            hits = [x for x in words.get(line, []) if norm(x["w"]) == norm(want)]
            if len(hits) >= nth:
                return max(starts[line], float(hits[nth - 1]["s"]) - 0.05)
            return starts[line] + 0.5 * (nxt - starts[line])
        return starts[line] + anc * (nxt - starts[line])

    beats = []
    def shot_for(line):
        return max(i for i, row in enumerate(S, 1) if row[1] <= line)

    def key_for(line):
        return next(row[0] for i, row in enumerate(S, 1) if i == shot_for(line))

    for (bid, shot, line, anc, sfx, subj, act, emo, ann, shows, reaction, rehook) in B:
        shot = key_for(line)
        a = round(at(line, anc), 3)
        beats.append({
            "id": bid, "shot": shot_for(line), "at_s": a, "vo_line": line,
            "anchor": {"vo_line": line, "fraction": anc if not isinstance(anc, tuple) else 0.0, "offset": round(a - starts[line], 3)},
            "offset": round(a - starts[line], 3), "vo": LINES[line], "phrase": " ".join(LINES[line].split()[:4]),
            "shows": shows, "sfx": sfx, "means": ann.lower(), "rehook": rehook,
            "draw": {"subject": subj, "action": act, "emotion": emo, "annotation": ann},
            "choreo": {"primary": shows, "reaction": reaction, "ambient": AMBIENT[shot]},
        })
    beats.sort(key=lambda b: (b["at_s"], b["id"]))
    for i, b in enumerate(beats):
        nx = beats[i + 1]["at_s"] if i + 1 < len(beats) else end
        b["t"] = f"{b['at_s']:.3f}-{nx:.3f}"
    shots = []
    for idx, (sid, line, framing, scale, height, stage, pov, layout, mv, hero_t, trans, thread, title, means) in enumerate(S, 1):
        st = round(starts[line], 3)
        shots.append({
            "title": title, "vo_line": line, "framing": framing, "scale": scale, "height": height, "stage": stage,
            "pov": pov, "layout": layout, "motion_vector": mv, "hero_treatment": hero_t,
            "camera": CAMERA[sid], "transition_in": trans, "thread": thread, "stage3d": CHOREO_STAGE3D[sid],
            "centered": CENTER[sid], "means": means, "ambient": AMBIENT[sid],
            "hero": {"name": HERO[sid][0], "parts": PARTS[sid], "zones": 3, "detail_note": HERO[sid][1]},
            "id": idx, "start_s": st,
        })
    for s in shots:
        if s["title"] == "The starting price":
            s["cut_offset_s"] = -0.4
            s["cut_reason"] = "the cut lands under the steel panel's wipe as it fills the frame, which keeps the Quebec and pen shot under the 16 second ceiling"
            s["start_s"] = round(s["start_s"] - 0.4, 3)
    for i, s in enumerate(shots):
        nx = shots[i + 1]["start_s"] if i + 1 < len(shots) else end
        s["t"] = f"{s['start_s']:.3f}-{nx:.3f}"

    def b_at(i):
        return next(b for b in beats if b["id"] == i)["at_s"]

    palette = "first-light rose and glacier ice tundra, spruce shelves, kraft tags, steel beam with gold zone weights, mint code, pen red"
    board = {
        "run_date": "2026-10-11", "slug": "this-crate-was-supposed-to-fly", "title": "This Crate Was Supposed To Fly",
        "concept": ("A medicine crate that was supposed to fly stands for a UAA drone-delivery study that, per the Anchorage Daily News, grew into a cleaner record of rural grocery prices, "
                    "cleaned by code an AI wrote and a person checks. The film sets that shelf-measured price beside the federal rule, which starts rural Alaska's food plan from an Anchorage price "
                    "and adjusts by zone, gives the steady rule its best case, and ends on the open question with the crate parked and its rotors unfolding."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {
            "pov": "eye-level-immersive", "motion_vector": "vertical-rise", "hero_treatment": "single-organic-hero",
            "layout": "stacked-layers", "register": "editorial-schematic", "camera_strategy": "rise-reveal", "light_story": "dawn-backlight",
            "palette": palette,
            "metaphor": "a kraft price tag on a string that started on a medicine crate, passes through a code comb and a red pen, and hangs beside a steel beam that prices rural Alaska from Anchorage",
        },
        "palette": palette,
        "divergence_note": ("10-10 was a night parking lot under amber sodium lamps with a pole camera and colour-coded rule owners, 10-09 a dusk utility yard with a steel tank. "
                            "This film opens on pink first-light tundra with a medicine crate, then moves through a warm store shelf, a mint code grid, a split Quebec desk, a flat Anchorage morning, "
                            "a snowy bluff, a pale proof desk and a rope strung across the tundra. The hero is a soft object on a string passing between tools, where 10-10 was a faced machine on a pole. "
                            "The colour code is by role (kraft the tag, mint the code, red the person, steel and gold the rule, green the signpost), and the argument is carried by one tag flipping between a measured face and a rule face."),
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "treatment": {
            "winner": "The Enthusiast's structure (the crate that never flew, rotors that become tags, the dotted hope) with the Explainer's rule beam with three zone weights, the Dramatist's calipers with a dotted readout.",
            "why": "All four pitches converged on a kraft price tag as the throughline and the Daily News attribution on every study claim. The Enthusiast gave the accident a wonder moment without claiming an outcome, the Explainer drew the rule's structure as a physical mechanism, and the Dramatist's calipers hold the ambivalence as two empty slots. The Comedian's raven gag was cut after the storyboard critic flagged it as a cultural misstep.",
        },
        "hook": {"pattern": "in-medias-res", "frame1": "A medicine crate on first-light tundra whines its four rotors up and lifts an inch with a blank kraft tag spinning on its handle.",
                 "headline": "THIS CRATE WAS SUPPOSED TO FLY", "motion_by_s": 0.4,
                 "loopback": "The last frame is the same crate with its rotors unfolded and still and the tag spinning, and the open replays on the whine-up."},
        "open_loop": {"plant_t": b_at(6), "pay_t": b_at(26), "what": "Where is the study tag headed. Paid when its blank destination line fills in, dotted, as a hope for USDA."},
        "open_loop_2": {"plant_t": b_at(17), "pay_t": b_at(29), "what": "How far apart are the shelf price and the Anchorage price. Planted as a dotted gap with a question mark between two hooks, paid as an honest empty slot, PUBLICATION and USDA."},
        "throughline": {"object": "the kraft price tag on the crate's handle", "lands_in_button": "the tag spins between its measured face and its rule face while the rotors begin to turn",
                        "states": [
                            {"at_s": b_at(1), "state": "blank, spinning on the crate handle"},
                            {"at_s": b_at(8), "state": "smudged with illegible shelf entries and a blank destination line"},
                            {"at_s": b_at(12), "state": "combed flat on a fresh string with clean barcode bars"},
                            {"at_s": b_at(44), "state": "flipped to its rule face, ANCHORAGE + ZONE"},
                            {"at_s": b_at(22), "state": "stamped NOT PUBLISHED YET and hanging by one string"},
                            {"at_s": b_at(26), "state": "its destination line filled in, dotted, for USDA"},
                            {"at_s": b_at(28), "state": "hanging on a rope beside the Anchorage tag with calipers open"},
                            {"at_s": b_at(31), "state": "spinning on the parked crate, measured face then rule face"},
                        ]},
        "reveals": [
            {"t": b_at(3), "type": "scale-pullback", "what": "the crate shrinks to an icon as a map of Alaska rises", "hold_s": 0.6},
            {"t": b_at(44), "type": "build-on", "what": "the hero tag flips and its back builds on the rule, ANCHORAGE + ZONE", "hold_s": 0.6},
            {"t": b_at(28), "type": "build-on", "what": "the calipers build on between the two tags and the readout opens as two empty slots", "hold_s": 0.6},
        ],
        "audio_arc": {"build_steps": 4, "dip_at": b_at(31), "riser_at": b_at(32), "silence_at": round(starts[18] - 0.9, 3),
                      "payoff_at": round(starts[18], 3), "button_pattern": "question", "interrupt_at": b_at(21), "extra_dips": [b_at(22), b_at(26)]},
        "shots": shots, "beats": beats,
    }
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
