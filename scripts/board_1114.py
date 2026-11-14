#!/usr/bin/env python3
"""2026-11-14 "Two Pixels, One New Name": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1114.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1114.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board_anchor import AnchorBook  # noqa: E402
import board_1102 as base  # noqa: E402  (shared helpers only: line_starts, load_words, _phrase)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"
LINES = base.LINES

W = lambda w, n=1: (w, n)
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "pop", "two orange pixels", "blink on a cold violet thermal frame of sea ice and a ring snaps around them with overshoot", "curious", "AS SMALL AS 2 PIXELS", "the ring snaps", ""),
 (2, 0, W("pixels"), "whoosh", "the RingedSeal, a ringed seal on the ice", "resolves out of the two pixels as the camera zooms through them, lifts her head and squints up at us", "curious", "ARCTIC SEA ICE", "the seal squints", ""),
 (3, 1, 0.0, "whirr", "a bush plane with the SurveyPod under its belly", "banks across the frame over white pack ice and cobalt leads, its shadow sliding over a floe", "eager", "NOAA SURVEY PLANE", "the plane banks", ""),
 (4, 1, W("color"), "click", "the SurveyPod, a twin-lens belly camera", "snaps its shutter and a flash bursts out of both lenses as the capsule squashes, its steel plate reading 2019 · ARTIFICIAL INTELLIGENCE", "focused", "2019 · ARTIFICIAL INTELLIGENCE", "the shutter squashes", ""),
 (5, 1, W("thousand"), "tick", "an altimeter tag", "drops on a line from the plane to the ice and clicks onto its number", "plain", "1,000 FT", "the tag clicks", ""),
 (6, 2, 0.0, "paper", "a wall of photo tiles", "stacks up tile by tile until it fills the frame, cold white ice in every one", "overwhelmed", "MILLIONS OF COLOR + THERMAL IMAGES", "the tiles stack", ""),
 (7, 2, W("seven"), "pop", "a scatter of tiles", "lights up one at a time in warm thermal orange, a few among thousands", "hopeful", "1,000,000 IMAGES · 7,000 TO 9,000 ANIMALS", "the tiles glow", ""),
 (8, 2, W("animals"), "pin", "one dark tile", "gets a boxed tag on a pin that swings and settles", "teasing", "ONE OF THESE IS A SEAL", "the tag swings", "plant: which tile is the seal"),
 (9, 3, 0.0, "flip", "an analyst at a desk lamp", "leans into a magnifier over a stack of prints under a wall map of Alaska while the calendar sheds its months like snow", "tired", "BY HAND · A YEAR", "the months fall", ""),
 (10, 3, W("season"), "stamp", "a sepia stamp", "thumps 2019 onto the corner of the calendar and the analyst rubs his eyes", "weary", "2019 · BEFORE THE SOFTWARE", "the stamp lands", ""),
 (11, 4, 0.0, "slide", "a color frame and a thermal frame", "slide across each other from opposite edges and lock into register with a click", "precise", "COLOR + THERMAL IN REGISTER", "the frames lock", ""),
 (12, 4, W("software"), "snap", "a detector box", "snaps around the warm blob with overshoot and the seal inside it blinks", "proud", "SEAL HEAT SIGNATURES", "the box snaps", ""),
 (13, 4, W("Microsoft"), "ding", "a small credit plate", "clips onto the corner of the locked frames and rocks once", "plain", "DEVELOPED WITH MICROSOFT AI", "the plate rocks", ""),
 (14, 5, 0.0, "whoosh", "the SurveyPod", "swings back into frame under the plane, still wearing its steel 2019 plate", "plain", "NOAA · ALASKA FISHERIES SCIENCE CENTER", "the pod swings", ""),
 (15, 5, W("updated"), "tear", "a calendar page on a stake in the ice", "tears away to NOV 6 beside the pod", "plain", "UPDATED NOV 6", "the page tears", ""),
 (16, 5, W("super"), "slam", "a gold stamp", "slams onto the pod's plate and the plate swells gold while both lenses stay exactly the same size", "startled", "SUPER INTELLIGENCE", "the plate swells", "rehook: the gold stamp slams and the plate swells while the lenses stay the same size"),
 (17, 6, W("smarter"), "tick", "the SurveyPod", "glances down at its swollen gold plate, puzzled, then looks back at the ice and keeps scanning", "puzzled", "DID IT GET SMARTER?", "the lenses glance down", "plant: did it get smarter"),
 (18, 7, 0.0, "thud", "an ear stone reader with one lens eye", "drops onto a lab bench under a map of Alaska beside a brass microscope with a gold sticker on its side", "eager", "SUPER INTELLIGENCE · AGING FISH", "the bench jumps", ""),
 (19, 7, W("near"), "ping", "a band of near infrared light", "sweeps across a tiny ear stone in the reader's tray", "focused", "NEAR INFRARED", "the light sweeps", ""),
 (20, 7, W("thirty"), "tick", "a stopwatch", "ticks round as the stone drops into a done tray", "brisk", "30 TO 50 SECONDS PER EAR STONE", "the hand sweeps", ""),
 (21, 7, W("ten"), "coins", "ten ear stones", "clatter into the reader's tray one after another while the microscope sweats and mops its brow", "exhausted", "10X+ FASTER THAN A MICROSCOPE", "the stones clatter", ""),
 (22, 8, 0.0, "page", "a framed 2019 NOAA article", "drops onto a wall hook and swings, its headline in big type over a seal photo", "plain", "2019 · \"ARTIFICIAL INTELLIGENCE\"", "the frame swings", ""),
 (23, 8, W("seal"), "clip", "a red string", "pins from the article's seal photo across to the pod's gold plate in the window", "pointed", "SAME SEAL WORK", "the string pins", ""),
 (24, 9, 0.0, "press", "an executive order document", "slides onto a desk under a lamp beside a framed map of Alaska and its seal presses itself into the page", "formal", "EXECUTIVE ORDER · SEPT 29", "the seal presses", "rehook: the executive order slides onto the desk and its seal presses itself"),
 (41, 9, W("agencies"), "paper", "a stack of agency letterheads", "fans out across the desk and the top sheet slides under the order", "dutiful", "FEDERAL AGENCIES", "the sheets fan", ""),
 (25, 9, W("instead"), "flip", "a word card on the order's page", "flips from ARTIFICIAL INTELLIGENCE to SUPER INTELLIGENCE", "formal", "SAY SUPER INTELLIGENCE", "the card flips", ""),
 (26, 9, W("websites"), "type", "a browser window", "opens beside the document and the new words type themselves into it", "plain", "WEBSITES · REPORTS · PUBLIC COMMUNICATIONS", "the words type", ""),
 (27, 10, 0.0, "snap", "a sealed envelope", "pins onto a wall calendar ringed on the 28th", "waiting", "PROPOSED NEW DEFINITION DUE NOV 28", "the envelope pins", ""),
 (42, 10, W("President"), "scribble", "the envelope's address line", "inks itself in a quick hand as the envelope swings on its pin", "formal", "TO THE PRESIDENT", "the pin swings", ""),
 (28, 11, 0.0, "swish", "the SurveyPod's gold plate", "spins like a coin and its back face lands reading SAME LEGAL DEFINITION", "plain", "SAME LEGAL DEFINITION", "the plate spins", ""),
 (29, 11, W("law"), "thump", "a statute book", "drops open on the ice behind the pod to the page the order points at", "plain", "15 U.S.C. 9401(3)", "the book drops", ""),
 (30, 12, 0.0, "knock", "two identical signposts", "drop and slam into the same ice floe on either side of the pod, equally lit", "even", "THE CASE FOR IT", "the posts thump", ""),
 (31, 13, 0.0, "swing", "the left signpost's board", "swings open into an ivory quote card", "earnest", "\"NOT MERELY ARTIFICIAL INTELLIGENCE\"", "the board swings", ""),
 (43, 13, W("increasingly"), "swish", "the SurveyPod", "tilts its lenses toward the left sign and its gold plate turns to face it", "attentive", "THE ORDER'S OWN WORDS", "the plate turns", ""),
 (32, 13, W("era"), "shimmer", "a low sun", "rises behind the left sign and lights its card", "hopeful", "THE ORDER · SEPT 29", "the sun rises", ""),
 (33, 14, 0.0, "swing", "the right signpost's board", "swings open into a matching quote card the same size in the same light", "even", "\"ANY PURPOSE OTHER THAN REBRANDING\" · TILLIPMAN, GWU", "the board swings", ""),
 (34, 14, W("rebranding"), "tap", "the RingedSeal", "turns her head from one sign to the other and back, the same number of times each way", "curious", "SAME TOOLS · BOTH SIDES", "the head turns", ""),
 (44, 14, W("George"), "slide", "a name card", "slides into the right sign's frame under the quote and settles", "plain", "PROCUREMENT LAW · GEORGE WASHINGTON UNIVERSITY", "the card settles", "rehook: the right sign opens to the dean's words at the same size and light"),
 (45, 15, W("figure"), "clink", "a magnifier", "sweeps across the blank tag and finds nothing on it", "searching", "NO ACCURACY FIGURE ON THE PAGE", "the glass sweeps", ""),
 (35, 15, 0.0, "clank", "a blank tag on a chain", "swings down in front of the pod and stops", "flat", "ACCURACY · NOT GIVEN", "the tag stops", ""),
 (36, 16, 0.0, "tick", "the SurveyPod", "looks at the tag, then up at its own swollen gold plate", "dry", "NO NEW NUMBER", "the lenses look up", ""),
 (37, 16, W("bigger"), "whoosh", "the gold plate", "spins once more and lands standing on its edge, neither face showing, while the lenses never change size", "wry", "A BIGGER NAME", "the plate lands on its edge", ""),
 (38, 17, 0.0, "tick", "the sealed envelope on the calendar stake", "trembles but stays sealed as the ring on the 28th pulses", "waiting", "DUE NOV 28 · NOT YET", "the ring pulses", ""),
 (39, 18, 0.0, "pop", "the RingedSeal", "rises out of the dark tile on the ice and looks up at the pod's lens as the edge-standing plate crosses frame", "curious", "AS SMALL AS 2 PIXELS", "the seal looks up", ""),
 (40, 18, W("prove"), "hush", "two orange pixels", "blink on the cold violet thermal frame as the seal folds back into them", "open", "WHAT SHOULD IT HAVE TO PROVE?", "the pixels blink", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 46)}
PLATE_AT.update({1: "lower-third", 6: "side-plate-left", 9: "side-plate-right", 14: "lower-third", 24: "side-plate-right", 30: "lower-third", 40: "lower-third"})
CLAIM_MAP = {1: ["c8"], 2: ["c4"], 3: ["c6"], 4: ["c11"], 5: ["c6"], 6: ["c5"], 7: ["c7"], 8: ["narration"], 9: ["c9"], 10: ["c9"],
             11: ["c6"], 12: ["c10"], 13: ["c3"], 14: ["c1", "c11"], 15: ["c2"], 16: ["c3"], 17: ["narration"], 18: ["c12"], 19: ["c12"],
             20: ["c13"], 21: ["c14"], 22: ["c11"], 23: ["c11"], 24: ["c18"], 25: ["c18"], 26: ["c19"], 27: ["c22"], 28: ["c21"],
             29: ["c21"], 30: ["narration"], 31: ["c20"], 32: ["c20"], 33: ["c23"], 34: ["narration"], 35: ["c26"], 36: ["c26"],
             37: ["narration"], 38: ["c22"], 39: ["c8"], 40: ["narration"], 41: ["c18"], 42: ["c22"], 43: ["c20"], 44: ["c23"], 45: ["c26"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "close", "eye", "thermal-ice", "thermal-frame-zoom", "fullbleed-split", "radial-emanate", "character-as-subject", "", "", "Two pixels", "Two orange pixels blink on a thermal frame of sea ice and resolve into a ringed seal who squints at us"),
 (2, 1, "wide-establish", "wide", "high", "pack-ice-aerial", "aerial-oblique", "diagonal-depth", "horizontal-traverse", "structure-as-subject", "whip-pan", "carry", "The survey plane", "A bush plane banks over the pack ice and the twin-lens pod under it fires color and thermal together from 1,000 ft"),
 (3, 2, "map-territory", "wide", "eye", "tile-wall", "flat-on-wall", "grid-modular", "assemble-build", "data-as-subject", "carried-element", "build", "A million photos", "A wall of photo tiles stacks up, a few glow warm, and one dark tile gets a tag that says one of these is a seal"),
 (4, 3, "push-detail", "medium", "eye", "analyst-desk", "over-shoulder", "stacked-layers", "vertical-descent", "character-as-subject", "mask-wipe", "build", "By hand", "An analyst squints into a magnifier while the calendar sheds a year of months and a 2019 stamp lands"),
 (5, 4, "push-detail", "insert", "eye", "register-cutaway", "cross-section-cutaway", "fullbleed-split", "horizontal-traverse", "instrument-as-subject", "graphic-match", "match", "The mechanism", "A color frame and a thermal frame slide into register and a detector box snaps around a warm seal"),
 (6, 5, "subject-portrait", "close", "low", "pod-under-wing", "low-under-belly", "centered-hero", "vertical-descent", "instrument-as-subject", "match-cut", "match", "The new plate", "The pod swings back, a calendar tears to Nov 6, a gold stamp swells its plate and the pod glances down puzzled"),
 (7, 7, "alt-vantage", "medium", "eye", "lab-bench", "bench-level-side", "split-race", "horizontal-traverse", "instrument-as-subject", "carried-element", "carry", "The ear stone race", "An ear stone reader reads stones under near infrared light while a microscope sweats beside it"),
 (8, 8, "push-detail", "close", "eye", "article-wall", "flat-on-wall", "stacked-layers", "vertical-descent", "data-as-subject", "mask-wipe", "build", "The 2019 article", "A framed 2019 NOAA article swings on a hook and a red string pins it to the gold plate"),
 (9, 9, "map-territory", "medium", "high", "order-desk", "overhead-flat", "grid-modular", "scroll-data", "data-as-subject", "carried-element", "carry", "The order", "An executive order slides onto a desk, a word card flips and a browser types the new words"),
 (10, 10, "subject-portrait", "close", "eye", "floe-pod", "eye-level-immersive", "centered-hero", "radial-emanate", "instrument-as-subject", "graphic-match", "match", "The definition", "A sealed envelope pins to a calendar on the ice, then the gold plate spins and lands on SAME LEGAL DEFINITION"),
 (11, 12, "wide-establish", "wide", "low", "two-sign-floe", "low-ice-level", "symmetric-split", "horizontal-traverse", "structure-as-subject", "whip-pan", "carry", "Two signs", "Two identical signposts thump into one floe either side of the pod and the left one opens into the order's words"),
 (12, 14, "alt-vantage", "medium", "eye", "two-sign-floe", "seal-eye-level", "symmetric-split", "radial-emanate", "character-as-subject", "match-cut", "match", "The other sign", "The right sign opens into the dean's words, same size and light, and the seal turns between the two"),
 (13, 15, "push-detail", "close", "eye", "floe-pod", "macro-closeup", "centered-hero", "radial-emanate", "instrument-as-subject", "match-cut", "match", "A bigger name", "A blank accuracy tag swings down and the gold plate spins and lands on its edge"),
 (14, 17, "alt-vantage", "medium", "high", "thermal-ice", "aerial-oblique", "fullbleed-split", "vertical-descent", "character-as-subject", "match-cut", "match", "Still two pixels", "The envelope stays sealed, the seal rises from her tile to look up at the lens and folds back into two pixels"),
]

AMBIENT = {1: "wind over ice, a thin electronic hum", 2: "a prop drone, wind, ice creaks", 3: "paper riffles, a room tone", 4: "a desk lamp buzz, pages turn, a clock",
           5: "a soft electronic hum, a lock click", 6: "a prop drone, wind, a stamp thud", 7: "a lab room tone, stones click, a stopwatch",
           8: "a room tone, a frame creaks on a hook", 9: "a desk room tone, paper slides, keys tap", 10: "wind over ice, a coin spin",
           11: "wind over ice, wood knocks", 12: "wind over ice, a board swings", 13: "wind, a chain clinks, a coin spin", 14: "wind over ice, a thin hum, a held tone"}
CENTER = {1: "the seal at x540 y980", 2: "the plane at x540 y860", 3: "the tile wall at x540 y960", 4: "the analyst at x420 y1000", 5: "the frames at x540 y960",
          6: "the pod at x540 y880", 7: "the reader at x400 y1000", 8: "the article at x540 y900", 9: "the order at x540 y980", 10: "the pod at x540 y860",
          11: "the pod at x540 y940", 12: "the right sign at x700 y900", 13: "the pod at x540 y880", 14: "the seal at x540 y1080"}
HERO = {
 1: ("two pixels + ring + RingedSeal", "50% seal, 30% thermal ice, 20% ring and plate"),
 2: ("bush plane + SurveyPod + pack ice + leads", "45% plane and pod, 35% ice and leads, 20% altimeter tag"),
 3: ("tile wall + glowing tiles + dark tile + pin tag", "60% tiles, 25% glowing tiles, 15% tag"),
 4: ("analyst + magnifier + prints + wall calendar + wall map of Alaska", "45% analyst, 30% calendar, 25% prints and map"),
 5: ("color frame + thermal frame + detector box + seal + credit plate", "50% frames, 30% box and seal, 20% plate"),
 6: ("SurveyPod + gold plate + stamp + calendar stake + plane belly", "55% pod and plate, 25% stamp, 20% calendar"),
 7: ("ear stone reader + microscope + stones + stopwatch + map of Alaska", "45% reader, 30% microscope, 25% stopwatch and stones"),
 8: ("framed article + red string + window with the pod", "55% article, 25% string, 20% window"),
 9: ("order document + word card + browser + lamp + desk", "50% document, 30% card and browser, 20% lamp"),
 10: ("SurveyPod + gold plate + calendar stake + envelope + statute book", "45% pod and plate, 30% envelope, 25% book"),
 11: ("two signposts + quote card + pod + floe + low sun", "40% signs, 35% pod, 25% ice and sun"),
 12: ("right signpost + quote card + RingedSeal + left sign", "40% sign, 35% seal, 25% left sign"),
 13: ("SurveyPod + accuracy tag + edge-standing gold plate", "50% pod, 30% plate, 20% tag"),
 14: ("calendar envelope + RingedSeal + dark tile + pod lens + two pixels", "45% seal, 30% pod and plate, 25% envelope"),
}
PARTS = {1: 46, 2: 52, 3: 48, 4: 50, 5: 46, 6: 54, 7: 56, 8: 44, 9: 50, 10: 52, 11: 54, 12: 50, 13: 48, 14: 50}
KICKS = (16, 24, 37)
CAMERA = {1: "dollyThrough", 2: "truckAcross", 3: "craneDown", 4: "static:the falling months and the magnifier are the move", 5: "truckAcross",
          6: "craneDown", 7: "truckAcross", 8: "static:the swinging frame and the string are the move", 9: "craneDown", 10: "dollyThrough",
          11: "truckAcross", 12: "dollyThrough", 13: "dollyThrough", 14: "craneDown"}

PALETTE = ("bright noon sunshine on clear Arctic blue #BFE3F2 to haze #F4FBFD, pack ice #F2F7F9 with blue shadow planes #A9C7D6, cobalt leads #123B57, smoky ringed seal #6B6A73 with ivory rings glowing gold-white, "
           "enamel camera pod #E9E4D8, a thermal ramp violet to magenta to coral to citron only inside heat frames, gold leaf #D9A520 only on the SUPER INTELLIGENCE nameplate, document ivory #EFE8D6 with ink #232A33")


def build():
    starts, real = base.line_starts()
    end = starts["end"]
    words = base.load_words() if real else {}
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
    for (bid, line, anc, sfx, subj, act, emo, ann, reaction, rehook) in B:
        sh = shot_for(line)
        shows = f"{subj} {act}, a plate reads {ann}"
        a = round(at(line, anc), 3)
        beats.append({
            "id": bid, "shot": sh, "at_s": a, "vo_line": line,
            "anchor": {"vo_line": line, "fraction": anc if not isinstance(anc, tuple) else 0.0, "offset": round(a - starts[line], 3)},
            "offset": round(a - starts[line], 3), "vo": LINES[line], "phrase": base._phrase(line, anc),
            "shows": shows, "sfx": sfx, "means": ann.lower(), "rehook": rehook if rehook.startswith("rehook") else "",
            "draw": {"subject": subj, "action": act, "emotion": emo, "annotation": ann},
            "plate_at": PLATE_AT[bid], "claims": CLAIM_MAP[bid],
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
            "camera": CAMERA[sid], "transition_in": trans, "thread": thread, "stage3d": "planes",
            "centered": CENTER[sid], "means": means, "ambient": AMBIENT[sid],
            "hero": {"name": HERO[sid][0], "parts": PARTS[sid], "zones": 3, "detail_note": HERO[sid][1]},
            "id": idx, "start_s": st,
        })
    for i, s in enumerate(shots):
        nx = shots[i + 1]["start_s"] if i + 1 < len(shots) else end
        s["t"] = f"{s['start_s']:.3f}-{nx:.3f}"

    def b_at(i):
        return next(b for b in beats if b["id"] == i)["at_s"]

    ad = json.loads((OUT / "art_direction.json").read_text())
    board = {
        "run_date": "2026-11-14", "slug": "two-pixels-one-new-name", "title": "Two Pixels, One New Name",
        "concept": ("NOAA's Alaska Fisheries Science Center page on its research tools, last updated November 6th, now calls its seal and polar bear detectors and its ear stone aging tool super intelligence. "
                    "NOAA survey planes shoot color and thermal photos together from 1,000 feet, a seal can be as small as two pixels, a million images may hold 7,000 to 9,000 animals, and finding them by hand took a year. "
                    "NOAA's own 2019 article calls the same seal work artificial intelligence. A September 29th executive order told agencies to say super intelligence instead, and for now defines it as what the law already calls artificial intelligence, "
                    "with a proposed new definition due November 28th. The order's case and a procurement law dean's doubt get equal signs on one floe, the page gives no accuracy figure, and the film ends on the same two pixels it opened on."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "aerial-oblique", "motion_vector": "radial-emanate", "hero_treatment": "instrument-as-subject", "layout": "centered-hero",
                        "register": "naturalistic-scene", "palette": PALETTE, "camera_strategy": "zoom-through",
                        "light_story": "bright warm noon sunshine on the ice, a glowing thermal survey view, warm cream lamp-lit paper interiors",
                        "metaphor": "a survey camera whose nameplate keeps growing while its lenses never change size, over a seal that is still two pixels"},
        "palette": PALETTE,
        "divergence_note": ("The last films were a brass faucet on an overcast pewter-sage gravel lot (11-13), a flagging-orange stake tag on raven polar dusk (11-12), a roof puck in pink-gold ice fog (11-11) and a vermilion take-a-number machine on a violet shore (11-10). "
                            "This film is high-noon white pack ice with cobalt leads, a thermal violet survey view and gold leaf on exactly one nameplate. Its hero is a living animal, a ringed seal, not an object, its AI presence is a twin-lens survey camera, "
                            "its device is a zoom through two pixels and a plate that grows while the lenses never change, and its test is two identical signs on one floe. Honest cost: three shots share the floe set."),
        "treatment": {"title": "Two Pixels, One New Name", "summary": ad["treatment"],
                      "judge_reasoning": "Explainer pitch won (48 of 60): the only pitch that draws the mechanism, c21 lands on the act boundary, both loops legal with margin, Act 3 gives c20 and c23 identical size and light and the turn refuses to pick a side. Grafts: B's stamp that leaves machine learning showing (cut for length, c24 kept off screen), A's plate that grows while the lens keeps its size, A's sweating microscope and the ONE OF THESE IS A SEAL tile, D's seal watching both signs, D's puzzled glance, B's seal looking up at the lens in the button."},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "anomaly-question", "frame1": "A cold violet thermal frame of sea ice with two orange pixels that blink on at 0.3 s and a ring that snaps around them.",
                 "headline": "AS SMALL AS 2 PIXELS", "motion_by_s": 0.3,
                 "loopback": "Frame 1 is two orange pixels blinking on a thermal frame of ice, the last frame is the same two pixels after the seal folds back into them."},
        "open_loop": {"plant_t": b_at(8), "pay_t": b_at(39), "plant_glow_s": 0.4, "plant_sfx": "pin", "what": "Which tile is the seal? Planted as ONE OF THESE IS A SEAL on a dark tile in the million-tile wall, paid when the seal rises out of that tile on the ice and looks up at the lens."},
        "open_loop_2": {"plant_t": b_at(17), "pay_t": b_at(36), "what": "Did it get smarter? Planted as the pod glancing down at its new gold plate under DID IT GET SMARTER, paid when the accuracy tag swings down blank and the pod looks up at its own plate under NO NEW NUMBER."},
        "throughline": {"object": "the SurveyPod's nameplate", "lands_in_button": "the plate stands on its edge, neither face showing, as the seal looks up at the unchanged lens",
                        "states": [
                            {"at_s": b_at(4), "state": "P1 steel plate, 2019 · ARTIFICIAL INTELLIGENCE"},
                            {"at_s": b_at(16), "state": "P2 stamped gold, SUPER INTELLIGENCE, swollen while the lenses keep their size"},
                            {"at_s": b_at(28), "state": "P3 spun to its back face, SAME LEGAL DEFINITION"},
                            {"at_s": b_at(37), "state": "P4 spun again and landed on its edge, neither face showing"},
                            {"at_s": b_at(39), "state": "P5 still on its edge as the seal looks up at the lens"}]},
        "reveals": [
            {"t": b_at(6), "type": "build-on", "what": "the photo tiles stack up until the wall fills the frame", "hold_s": 0.8},
            {"t": b_at(11), "type": "build-on", "what": "the color and thermal frames slide into register", "hold_s": 0.6},
            {"t": b_at(21), "type": "build-on", "what": "ten ear stones clatter into the tray while the microscope finishes one", "hold_s": 0.8},
            {"t": b_at(24), "type": "build-on", "what": "the order slides onto the desk and its seal presses itself", "hold_s": 0.6},
            {"t": b_at(30), "type": "scale-pullback", "what": "the camera pulls back low across the floe to show two identical signs either side of the pod", "hold_s": 0.8},
            {"t": b_at(39), "type": "scale-pullback", "what": "the camera cranes down from the pod's lens to the seal rising out of her tile", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.5}, {"line": 1, "offset": 0.0, "level": 1.4}, {"line": 4, "offset": 0.0, "level": 2.0},
            {"line": 6, "offset": 0.0, "level": 0.3}, {"line": 7, "offset": 0.0, "level": 1.8}, {"line": 9, "offset": 0.0, "level": 1.2},
            {"line": 12, "offset": 0.0, "level": 0.3}, {"line": 13, "offset": 0.0, "level": 1.5}, {"line": 15, "offset": 0.0, "level": 2.0},
            {"at_s": round(b_at(39) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(39) + 0.6, 3), "level": 1.8},
            {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(39) - 0.5, 3), "riser_at": round(b_at(37), 3), "silence_at": round(b_at(39) - 0.5, 3),
            "payoff_at": b_at(39), "button_pattern": "callback", "interrupt_at": b_at(24), "extra_dips": [b_at(30), b_at(35)]},
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
    book.raise_if_missing("board_1114 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1114Ids.ts").write_text(
        "// GENERATED by scripts/board_1114.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
