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
    "The code didn't set a single price, and Jones said it still needs human oversight.",
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

# id, shot, vo_line, fraction, sfx, subject, action, emotion, annotation, shows, rehook, kick
B = [
    (1, 1, 0, 0.00, "bloop", "FlightCrate", "lifts an inch on its rotor stubs", "hopeful", "STUDY CRATE",
     "the FlightCrate's four rotor stubs whine up and it lifts an inch off first-light tundra as a blank kraft tag spins on its handle", "", False),
    (2, 1, 0, 0.55, "thump", "FlightCrate", "wobbles and thumps back down", "sheepish", "STARTED AS DRONE DELIVERY RESEARCH",
     "the crate wobbles and thumps into the snow with a dust puff while the tag swings on its string", "", False),
    (3, 2, 1, 0.00, "whoosh", "AlaskaMini", "rises as the camera pulls back", "curious", "PER ANCHORAGE DAILY NEWS",
     "the camera pulls back from the crate and a map plate of Alaska rises with a PER ANCHORAGE DAILY NEWS chip", "", False),
    (4, 2, 1, 0.38, "blip", "Mike Jones silhouette", "sits at a desk behind the crate", "focused", "MIKE JONES · UAA",
     "a faceless silhouette at a desk behind the crate gets its name plate, MIKE JONES · UAA", "", False),
    (5, 2, 1, 0.62, "tick", "dotted flight line", "draws itself toward a village pin", "hopeful", "A DRONE DELIVERY PLAN",
     "four rotor stubs trace a dotted flight line toward a village pin on the map, drawn as a plan and never a flight", "", False),
    (6, 3, 2, 0.00, "whoosh", "rotor blades", "unscrew and flutter into price tags", "playful", "WHERE IS IT HEADED?",
     "the rotor stubs unscrew, float off and each blade flutters into a kraft price tag that settles on a rural store shelf", "", False),
    (7, 3, 3, 0.00, "page", "quote plate", "types the quote across the shelf", "earnest", "\"SIGNIFICANTLY MORE THAN THAT\" · MIKE JONES",
     "a quote plate types Jones's two sentences while the tags settle", "", False),
    (8, 3, 3, 0.50, "click", "crate tag", "flips to a smudged face with a blank destination line", "puzzled", "SMUDGED SHELF ENTRIES",
     "the crate's own tag flips to scrawled illegible shelf entries and a blank destination line that pulses", "", False),
    (9, 4, 4, 0.00, "whoosh", "grocery shelf", "slides in with a mint code sheet beside it", "curious", "RURAL ALASKA GROCERY PRICES",
     "a rural grocery shelf slides in beside a blank mint code sheet", "rehook: new place, new question", False),
    (10, 4, 4, 0.58, "tick", "shelf tags", "disagree about the same can", "baffled", "UNCLEANED PRICE DATA",
     "on the shelf two tags for the same can carry codes that do not line up", "", False),
    (11, 4, 5, 0.00, "whoosh", "code sheet", "prints mint lines and the smudged entries snap into rows", "satisfied", "AI-WRITTEN CODE · CLEANED THE PRICE DATA",
     "the mint code sheet prints line by line and the smudged shelf entries snap one by one into ruled rows", "", False),
    (12, 4, 5, 0.58, "click", "kraft tag", "is combed flat and set on a fresh string", "relieved", "CODE WRITTEN BY AI",
     "the code comb passes over the tag and it comes out flat on a fresh string with its CHECKED BY box empty", "", False),
    (13, 5, 6, 0.40, "thunk", "paper stack", "grows past the top of frame as a tally counter clicks", "weary", "QUEBEC · HUNDREDS OF HOURS BY HAND · PER ADN",
     "on the left of a hard seam a stack of hand-matched tags grows past the top of the frame as a brass tally counter clicks", "", False),
    (14, 5, 7, 0.00, "snap", "StampBot", "charges in with APPROVED raised and a hand stops it", "indignant", "JONES SAYS IT STILL NEEDS HUMAN OVERSIGHT",
     "on the right of the seam a small stamp robot charges in with APPROVED raised and a hand holding a red pen stops it", "", False),
    (15, 5, 7, 0.60, "tick", "red pen", "hovers over the code and does not land", "careful", "CHECKED BY",
     "the pen hovers over one code line while the CHECKED BY box on the tag stays empty", "", False),
    (16, 6, 8, 0.00, "whoosh", "Anchorage beam", "whips in under the skyline with one crisp tag", "steady", "ANCHORAGE FOOD PRICES",
     "a whip pan to the Anchorage skyline where a steel beam holds one crisp tag stamped ANCHORAGE", "", False),
    (17, 6, 8, 0.38, "clunk", "zone weights", "slide out along the beam", "methodical", "ANCHORAGE PRICES PLUS ZONE ADJUSTMENT · 7 CFR 273.10",
     "three gold zone weights slide out along the beam, URBAN, RURAL I and RURAL II, nudging copies of the tag", "", False),
    (34, 6, 8, 0.76, "tick", "zone weights", "light up one by one", "methodical", "URBAN · RURAL I · RURAL II",
     "the three gold zone weights light up one by one as the zones are named, URBAN, RURAL I and RURAL II", "", False),
    (18, 6, 9, 0.00, "stamp", "kraft tag", "flips through edge-on to its back", "wry", "ADN CALLS IT A 40-YEAR-OLD FORMULA",
     "the hero tag flips through edge-on and its back reads ANCHORAGE + ZONE under a chip, ADN CALLS IT A 40-YEAR-OLD FORMULA", "", False),
    (19, 7, 10, 0.00, "thunk", "steady beam", "stands firm in the snow lit by a brass inspection light", "calm", "STEADY · AUDITABLE",
     "the Anchorage beam stands firm on a snowy bluff and a brass inspection light runs along it so every part reads", "rehook: the fair case against, at full strength", False),
    (20, 7, 10, 0.58, "tick", "zone weights", "line up on a ruled rail", "orderly", "ONE CITY PRICE PLUS FIXED ZONES",
     "the three weights line up on a ruled rail anyone could check with a ruler", "", False),
    (21, 7, 11, 0.00, "whoosh", "rural tags", "swirl in a gust while a raven snatches one", "chaotic", "RURAL PRICES ARE NOISY",
     "a gust sends a cart of rural tags swirling and jittering and a raven snatches one and flaps off", "", False),
    (22, 8, 12, 0.00, "stamp", "NOT PUBLISHED YET stamp", "lands on the hero tag", "sober", "NOT PUBLISHED YET",
     "a stamp reading NOT PUBLISHED YET lands on the hero tag in close-up", "", False),
    (23, 8, 12, 0.55, "click", "single chip", "pins to the top of the frame", "plain", "ONE OUTLET · ANCHORAGE DAILY NEWS",
     "a single chip pins to the top, ONE OUTLET · ANCHORAGE DAILY NEWS, and stays", "", False),
    (24, 9, 13, 0.00, "whoosh", "USDA gate", "rises at the edge of the map", "closed", "HOPED TO INFORM USDA · SNAP RATES IN ALASKA",
     "a green USDA gate rises at the edge of the Alaska map with a sealed envelope beside it", "", False),
    (25, 9, 13, 0.58, "tick", "hero tag", "drifts toward the gate and stops short", "hopeful", "A HOPE",
     "the hero tag drifts toward the gate and stops an inch short", "", False),
    (26, 9, 14, 0.00, "click", "crate destination line", "fills in as a dotted USDA address", "wistful", "HOPED · NOT A DECISION",
     "the crate's blank destination line finally fills in, dotted, USDA, with a HOPED chip", "", False),
    (27, 10, 15, 0.00, "whoosh", "two tags", "hang side by side under one lamp", "curious", "SHELF PRICE · ANCHORAGE PRICE PLUS ZONE",
     "two tags hang side by side under one lamp, MEASURED ON THE SHELF and STARTS FROM ANCHORAGE", "rehook: the turn, a different kind of evidence", False),
    (28, 10, 15, 0.55, "tick", "calipers", "swing open between the tags with a dotted readout", "pending", "NOBODY HAS PUBLISHED THE DISTANCE",
     "brass calipers swing open between the two tags and the readout stays dotted", "", False),
    (29, 10, 16, 0.00, "thunk", "red pen", "lands and ticks the CHECKED BY box", "satisfied", "CHECKED BY A PERSON",
     "the red pen lands and ticks the CHECKED BY box on the shelf tag", "", False),
    (30, 10, 16, 0.55, "click", "plate", "reads WAITS ON PUBLICATION AND USDA", "patient", "WAITS ON PUBLICATION AND USDA",
     "a plate slides in under the calipers, WAITS ON PUBLICATION AND USDA", "", False),
    (31, 11, 17, 0.00, "whoosh", "tundra crate", "back at first light with the tag spinning edge-on", "wistful", "WILL THEY MATCH ANCHORAGE PLUS A ZONE?",
     "back on the dawn tundra the crate sits with the tag spinning edge-on between its two faces", "", False),
    (32, 11, 17, 0.62, "riser", "rotor stubs", "twitch", "hopeful", "A QUESTION",
     "the rotor stubs give one small twitch as the music thins", "", False),
    (33, 11, 18, 0.00, "bloop", "FlightCrate", "lifts an inch again", "hopeful", "STUDY CRATE",
     "the crate lifts an inch again, the frame the film opened on", "", False),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
    (1, 0, "subject-portrait", "wide", "ground", "tundra-dawn", "eye-level-immersive", "single-object-void", "vertical-rise", "single-organic-hero", "", "",
     "The crate that couldn't fly", "A FlightCrate on first-light tundra lifts an inch and thumps back."),
    (2, 1, "map-territory", "extreme-wide", "high", "tundra-map", "orbital-aerial", "map-territory", "horizontal-traverse", "landscape-as-subject", "push-in", "carry",
     "The study that was supposed to fly", "The camera pulls back from the crate to a map of Alaska with a dotted drone plan."),
    (3, 2, "push-detail", "medium", "eye", "store-shelf", "macro-closeup", "stacked-layers", "vertical-descent", "multiplicity-swarm", "match-cut", "match",
     "Blades become price tags", "The rotor blades flutter into kraft price tags that settle on a rural store shelf."),
    (4, 4, "macro-closeup", "close", "eye", "shelf-and-code", "instrument-screen", "hud-instrument-frame", "scroll-data", "data-as-subject", "whip-pan", "travel",
     "The code that cleaned the shelf", "A rural grocery shelf beside a mint code sheet that prints and combs the smudged tags into rows."),
    (5, 6, "two-up", "wide", "high", "split-quebec-oversight", "eye-level-immersive", "fullbleed-split", "vertical-rise", "structure-as-subject", "match-action", "match",
     "Hours by hand, and the pen", "A hard seam splits a Quebec desk of hand-matched tags from a red pen that stops a stamp robot."),
    (6, 8, "map-territory", "extreme-wide", "high", "anchorage", "exploded-diagram", "grid-modular", "assemble-build", "structure-as-subject", "whip-pan", "travel",
     "The starting price", "A steel beam under the Anchorage skyline holds one tag and three zone weights."),
    (7, 10, "two-up", "medium", "low", "beam-yard", "eye-level-immersive", "fullbleed-split", "radial-emanate", "multiplicity-swarm", "match-action", "match",
     "The case for the old way", "A steady beam on a snowy bluff against a gust of noisy rural tags."),
    (8, 12, "macro-closeup", "insert", "eye", "tag-bench", "macro-closeup", "single-object-void", "push-in-only", "single-organic-hero", "hard-cut", "match",
     "Not published yet", "A stamp lands on the hero tag and one outlet chip pins to the frame."),
    (9, 13, "alt-vantage", "wide", "overhead", "usda-gate", "top-down-map", "map-territory", "assemble-build", "structure-as-subject", "map-travel", "travel",
     "A hope, not a decision", "A closed USDA gate on the map and the tag that stops an inch short."),
    (10, 15, "two-up", "close", "low", "tag-bench", "macro-closeup", "fullbleed-split", "radial-emanate", "instrument-as-subject", "fui-boot", "build",
     "Different evidence", "Two tags under one lamp, calipers open, the red pen ticks the box."),
    (11, 17, "subject-portrait", "wide", "ground", "tundra-dawn", "eye-level-immersive", "single-object-void", "vertical-rise", "single-organic-hero", "graphic-match", "match",
     "The question, and the crate", "Back on the dawn tundra the tag spins and the crate lifts an inch again."),
]

# Per-shot choreography (ambient life the held frame runs on) and centre of interest.
AMBIENT = {
    1: "tundra cottongrass shivers, clouds drift, the tag swings, snow-dust blows off the crate lid, the gauge needle hunts",
    2: "map pin pulses, the dotted line marches, tundra ripples below, the silhouette's lamp sways",
    3: "tags flutter and settle, shelf cans gleam, dust turns in the light, the crate tag swings",
    4: "code lines scroll, the mint glow breathes, shelf tags tremble, cans gleam, dust turns in the lamp light",
    5: "the tally counter clicks, the stack leans, the pen hovers and drifts, the robot's stamp shivers, a lamp sways on each side",
    6: "the skyline lights blink, clouds slide, the beam hum shows as a faint shimmer, the weights swing on their chains",
    7: "snow falls, the swirl keeps moving, the inspection light slides along the beam, the raven circles",
    8: "the lamp pool breathes, the kraft tag sways on its string, dust turns, the stamp ink settles",
    9: "the map pin pulses, the gate lights breathe, the envelope flap lifts and settles, the dotted line marches",
    10: "the lamp swings a few pixels, both tags sway out of phase, the calipers tremble, the pen tip drifts",
    11: "tundra grass shivers, clouds drift, the tag spins edge-on, the gauge needle hunts",
}
CENTER = {1: "the crate at x540 y1180", 2: "the map plate at x540 y1000", 3: "the shelf at x540 y1150", 4: "the code sheet at x540 y1000",
          5: "the seam at x540", 6: "the beam at x540 y900", 7: "the beam at x300, the swirl at x780",
          8: "the tag at x540 y1000", 9: "the gate at x540 y950", 10: "the two tags at x330 and x750", 11: "the crate at x540 y1180"}
HERO = {1: ("FlightCrate", 40), 2: ("AlaskaMini + FlightCrate", 30), 3: ("PriceTag", 45), 4: ("GroceryShelf + CodeSheet", 50),
        5: ("DriftStack + PenHand", 45), 6: ("ZoneBeam", 40), 7: ("ZoneBeam + RuralSwirl", 45), 8: ("PriceTag", 30),
        9: ("UsdaGate", 35), 10: ("PriceTag x2 + calipers", 45), 11: ("FlightCrate", 40)}


CAMERA = {1: "craneDown", 2: "dollyThrough+craneDown", 3: "truckAcross", 4: "static:a locked code sheet where the lines and the tags move", 5: "riseWith",
          6: "truckAcross+riseWith", 7: "dollyThrough", 8: "orbitReveal", 9: "craneDown", 10: "orbitReveal", 11: "craneDown+dollyThrough"}


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


def build():
    starts, real = line_starts()
    end = starts["end"]

    def at(line, frac):
        nxt = starts.get(line + 1, end)
        return starts[line] + frac * (nxt - starts[line])

    beats = []
    for i, (bid, shot, line, frac, sfx, subj, act, emo, ann, shows, rehook, kick) in enumerate(B):
        a = round(at(line, frac), 3)
        beats.append({
            "id": bid, "shot": shot, "at_s": a, "vo_line": line,
            "anchor": {"vo_line": line, "fraction": frac, "offset": round(a - starts[line], 3)},
            "offset": round(a - starts[line], 3), "vo": LINES[line], "phrase": " ".join(LINES[line].split()[:4]),
            "shows": shows, "sfx": sfx, "means": ann.lower(), "rehook": rehook,
            "draw": {"subject": subj, "action": act, "emotion": emo, "annotation": ann},
            "choreo": {"primary": shows, "reaction": f"{subj} {act}", "ambient": AMBIENT[shot]},
            **({"kick": True} if kick else {}),
        })
    for i, b in enumerate(beats):
        nx = beats[i + 1]["at_s"] if i + 1 < len(beats) else end
        b["t"] = f"{b['at_s']:.3f}-{nx:.3f}"
    shots = []
    for (sid, line, framing, scale, height, stage, pov, layout, mv, hero_t, trans, thread, title, means) in S:
        st = round(starts[line], 3)
        shots.append({
            "title": title, "vo_line": line, "framing": framing, "scale": scale, "height": height, "stage": stage,
            "pov": pov, "layout": layout, "motion_vector": mv, "hero_treatment": hero_t,
            "camera": CAMERA[sid],
            "transition_in": trans, "thread": thread,
            "stage3d": "planes" if sid in (1, 2, 3, 7, 9, 11) else "flat:a locked bench or diagram, depth adds nothing",
            "centered": CENTER[sid], "means": means, "ambient": AMBIENT[sid],
            "hero": {"name": HERO[sid][0], "parts": HERO[sid][1], "zones": 3, "detail_note": "60% hero, 20% supporting, 20% set"},
            "id": sid, "start_s": st,
        })
    for i, s in enumerate(shots):
        nx = shots[i + 1]["start_s"] if i + 1 < len(shots) else end
        s["t"] = f"{s['start_s']:.3f}-{nx:.3f}"

    def b_at(i):
        return next(b for b in beats if b["id"] == i)["at_s"]

    board = {
        "run_date": "2026-10-11", "slug": "this-crate-was-supposed-to-fly", "title": "This Crate Was Supposed To Fly",
        "concept": ("A medicine crate built to fly goods to rural Alaska can't lift off, and the Anchorage Daily News story behind it is that a UAA drone-delivery "
                    "study grew into a cleaner record of rural grocery prices, cleaned by code an AI wrote and a person checks. The film sets that shelf-measured price "
                    "beside the federal rule, which starts rural Alaska's food plan from an Anchorage price and adjusts by zone, gives the steady rule its best case, "
                    "and ends on the open question with the crate lifting an inch again."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {
            "pov": "macro-closeup", "motion_vector": "vertical-descent", "hero_treatment": "multiplicity-swarm",
            "layout": "stacked-layers", "register": "editorial-schematic", "camera_strategy": "rise-reveal", "light_story": "dawn-backlight",
            "palette": "first-light rose and glacier ice tundra, spruce shelves, kraft tags, pewter beam with brass zone weights, mint code, pen red",
            "metaphor": "a kraft price tag on a string that started on a medicine crate, passes through a code comb and a red pen, and hangs beside a steel beam that prices rural Alaska from Anchorage",
        },
        "palette": "first-light rose and glacier ice tundra, spruce shelves, kraft tags, pewter beam with brass zone weights, mint code, pen red",
        "divergence_note": ("10-10 was a night parking lot under amber sodium lamps with a pole camera and colour-coded rule owners, 10-09 a dusk utility yard with a steel tank. "
                            "This film opens on pink first-light tundra with a medicine crate, then moves through a warm store shelf, a cool paper office, a flat Anchorage morning, "
                            "a snowy bluff and a kraft-lit tag bench. The hero is a soft object on a string passing between tools, where 10-10 was a faced machine on a pole. "
                            "The colour code is by role (kraft the tag, mint the code, red the human check, steel and gold the rule), and the argument is carried by one tag flipping between a measured face and a rule face."),
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "treatment": {
            "winner": "The Enthusiast's structure (the crate that never flew, rotors that become tags, the dotted hope) with the Explainer's rule gate with zone teeth, the Dramatist's calipers with a dotted readout, and the Comedian's raven.",
            "why": "All four pitches converged on a kraft price tag as the throughline and the Daily News attribution on every study claim. The Enthusiast gave the accident a wonder moment without claiming an outcome, the Explainer drew the rule's structure as a physical mechanism, the Dramatist's calipers hold the ambivalence, and the Comedian's raven pays the fair case against a joke.",
        },
        "hook": {"pattern": "in-medias-res", "frame1": "A medicine crate on first-light tundra whines its four rotor stubs up and lifts an inch with a blank kraft tag spinning on its handle.",
                 "headline": "THIS CRATE WAS SUPPOSED TO FLY", "motion_by_s": 0.4,
                 "loopback": "The last frame is the same crate lifting an inch again, with the tag spinning, and the open replays."},
        "open_loop": {"plant_t": b_at(6), "pay_t": b_at(26), "what": "Where is the crate's tag headed. Paid when the destination line fills in, dotted, as a hope for USDA."},
        "open_loop_2": {"plant_t": b_at(14), "pay_t": b_at(29), "what": "Who checks what the code did. Paid when the red pen lands and ticks the CHECKED BY box."},
        "throughline": {"object": "the kraft price tag on the crate's handle", "lands_in_button": "the tag spins between its measured face and its rule face as the crate lifts an inch",
                        "states": [
                            {"at_s": b_at(1), "state": "blank, spinning on the crate handle"},
                            {"at_s": b_at(8), "state": "smudged with illegible shelf entries and a blank destination line"},
                            {"at_s": b_at(13), "state": "combed flat on a fresh string with an empty CHECKED BY box"},
                            {"at_s": b_at(18), "state": "flipped to its rule face, ANCHORAGE + ZONE"},
                            {"at_s": b_at(22), "state": "stamped NOT PUBLISHED YET"},
                            {"at_s": b_at(26), "state": "its destination line filled in, dotted, for USDA"},
                            {"at_s": b_at(29), "state": "ticked CHECKED BY A PERSON"},
                            {"at_s": b_at(31), "state": "spinning edge-on between measured and rule faces"},
                        ]},
        "reveals": [
            {"t": b_at(3), "type": "scale-pullback", "what": "the crate shrinks to a pin as a map of Alaska rises", "hold_s": 0.6},
            {"t": b_at(18), "type": "build-on", "what": "the hero tag flips and its back builds on the rule, ANCHORAGE + ZONE", "hold_s": 0.6},
            {"t": b_at(27), "type": "morph-to-chart", "what": "two tags and open calipers become a comparison with a dotted readout", "hold_s": 0.6},
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
