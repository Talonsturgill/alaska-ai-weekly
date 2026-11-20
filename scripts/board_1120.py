#!/usr/bin/env python3
"""2026-11-20 "Lot 2": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1120.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1120.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
BUB = "Bub, a cream speech bubble with two dot eyes and a typing ellipsis on its belly, behind frost inside a glass case on a turntable"
REF = "a tall faceless figure in a marigold armband tagged CONSUMER PRIVACY OMBUDSMAN"
HAM = "the auctioneer's hammer raised on a nickel arm above the case"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "pop", BUB, "jolts awake as a square auction paddle snaps up into the spotlight and its shadow sweeps the glass, the auctioneer's hammer raised high on its arm above", "shocked", "AUCTION · DECEMBER 1ST", "Bub's dots scramble", ""),
 (2, 0, W("chats"), "roll", "the turntable", "swings the case toward camera, a round keyhole glinting with no key anywhere, Bub's ellipsis pressing at the frost", "anxious", "ITS CHATS MAY GO TOO", "the keyhole glints", ""),
 (3, 1, 0.0, "type", "chat bubbles projected inside the glass around Bub", "slide up inside the glass one by one, little character faces popping out of them under a glowing CHARACTER.AI header", "busy", "CHARACTER.AI · CHAT WITH AI CHARACTERS", "the projected bubbles pop", ""),
 (4, 2, 0.0, "stamp", "a court notice", "slides onto the plinth front and a CH. 11 tab clamps onto it while the projected chats dim", "worried", "CHAPTER 11 · OCTOBER", "the chats dim", ""),
 (5, 2, W("sell"), "clip", "a FOR SALE tag on a string", "drops and loops over the dome's knob", "uneasy", "TO SELL ITSELF", "the tag swings", ""),
 (6, 3, 0.0, "thunk", "a birch crate of gears", "rolls onto the left pedestal on a hand truck as a Disney paddle rises over it", "businesslike", "DISNEY OPENS", "the gears turn", ""),
 (7, 3, W("twenty"), "flip", "the Disney paddle", "flips its card to $20M while a slate LICENSE sleeve slides over the crate", "confident", "$20 MILLION · A LICENSE", "the sleeve settles", ""),
 (8, 4, 0.0, "glass", "a tall glass pane", "drops between the two pedestals and Bub's dots jolt apart then snap back", "startled", "NO CHATS IN THE DISNEY DEAL", "the dots snap back", ""),
 (9, 5, 0.0, "swing", "a second paddle with a blank card and a PER PPC LAND sash", "rises over Bub's side of the pane", "watchful", "PER PPC LAND · ANOTHER OPENING BID", "the sash sways", ""),
 (34, 5, W("ten"), "snap", "the second paddle's blank card", "flips to $10M", "sharp", "$10 MILLION", "the card settles", ""),
 (10, 5, W("models"), "slide", "a small sleeved crate tagged APP · MODELS", "slides onto Bub's pedestal beside the case", "plain", "APP · MODELS · USER DATA", "the crate lands", ""),
 (11, 6, 0.0, "crack", "blank frosted labels on the glass", "rise up through the frost with a crackle", "quiet", "ALASKA DEPT. OF LAW · THE DATA FOR SALE", "the frost crackles", ""),
 (35, 6, W("mental"), "pop", "the frosted labels", "fill in, MENTAL HEALTH on one word and RELATIONSHIPS on the next, while Bub's ellipsis freezes", "still", "MENTAL HEALTH · RELATIONSHIPS", "the ellipsis freezes", ""),
 (12, 7, 0.0, "bubble", "a stack of tiny cream bubbles", "climbs beside the case up past the gallery rail, each one a dot, still rising", "overwhelmed", "OVER 2 MILLION MINORS' ACCOUNTS · COMPANY FIGURES", "the stack keeps climbing", "rehook: the stack of tiny bubbles climbs past the gallery rail"),
 (13, 8, 0.0, "click", "the spotlight", "irises down to the case and an empty tall referee's chair beside it with a closed marigold folder on its seat", "lonely", "WHO'S WATCHING?", "the folder sits closed", ""),
 (14, 9, 0.0, "page", "a desk lamp in an Alaska Department of Law office in Juneau at blue hour, Mount Juneau in the window", "clicks on over a fan of state outline cards", "alert", "OCTOBER · STATE ATTORNEYS GENERAL", "the lamp warms the desk", ""),
 (15, 9, W("joined"), "slide", "Alaska's outline card", "slides into the fan of state cards", "hopeful", "ALASKA JOINED · BIPARTISAN STATES", "the fan shifts", ""),
 (41, 9, W("protections"), "paper", "the fan of state cards", "squares into one stack and a marigold band snaps around it", "resolved", "PROTECTIONS IN ANY SALE", "the band snaps", ""),
 (16, 10, 0.0, "flip", "a law book on a reading stand", "falls open and a page starts to pop up", "curious", "11 U.S.C. 363 · A PROMISE LIMITS THE SALE", "the pages fan", ""),
 (17, 10, W("judge"), "fold", "a paper auction hammer", "pops up out of the page, held up by three paper tabs labelled JUDGE, OMBUDSMAN and HEARING", "methodical", "JUDGE · OMBUDSMAN · HEARING", "the tabs stand", ""),
 (18, 11, 0.0, "step", REF, "walks into the hall past the empty chair, facing the hammer and not Bub", "composed", "AT THE STATES' URGING · PER ALASKA DEPT. OF LAW", "the figure settles", ""),
 (36, 11, W("court"), "snap", "a marigold cord", "shoots up from the ombudsman's hand and knots around the raised hammer's arm, pulling taut", "firm", "COURT ORDERS A PRIVACY OMBUDSMAN", "the cord goes taut", ""),
 (19, 12, 0.0, "thud", "the ombudsman", "lays a hand on the turntable and it jolts to a stop for the first time, a small key at its belt glinting", "steady", "REVIEWS THE SALE", "the turntable stops", "rehook: the turntable stops under the watchdog's hand"),
 (20, 13, 0.0, "step", "a faceless figure tagged CORI MILLS in a Juneau committee room with a plaster wall and a framed Alaska map", "walks up to a lectern and sets both hands down on it", "firm", "CORI MILLS · ACTING ATTORNEY GENERAL", "the figure squares up", ""),
 (37, 13, W("worry"), "clip", "Mills", "lifts a card held by a single paper clip as a quote plate drops", "pointed", "\"SOLD TO THE HIGHEST BIDDER\"", "the paper clip wobbles", ""),
 (21, 14, 0.0, "clank", "the case's slide bolt", "holds the same VOLUNTARY card by its one paper clip", "uneasy", "LIMITS ON MINORS · VOLUNTARY", "the clip trembles", ""),
 (38, 14, W("buyer"), "whirr", "a dashed ghost paddle tagged FUTURE BUYER", "rises beside the bolt and stops short, hovering without touching it", "uneasy", "\"COULD BE ... REVERSED BY A FUTURE BUYER\"", "the ghost hovers", ""),
 (22, 15, 0.0, "clunk", "the hall lights", "snap off the spotlight and flat white house lights slam on across the hall", "even", "THE OTHER SIDE", "the room goes flat", ""),
 (23, 16, 0.0, "chain", "the company's own padlock", "is hung on the dome's ring with a tag", "calm", "\"CONTINUES TO BE PROTECTED\" · THE COMPANY", "the padlock swings", ""),
 (24, 17, 0.0, "pin", "a declaration sheet with a long cost column and an empty profit line", "is pinned to the plinth", "tired", "LEGAL COSTS · STRUGGLING TO PROFIT · PER THE CEO", "the sheet flutters", ""),
 (25, 18, 0.0, "press", "a faceless figure tagged JUDGE at a pale bench in a flat white courtroom", "sets a bound rule book down", "neutral", "THE JUDGE · AUCTION RULES APPROVED", "the book lands", ""),
 (39, 18, W("objections"), "rustle", "a stack of state objection letters", "is slid aside under the rule book", "neutral", "OVER STATE AGS' OBJECTIONS", "the letters slide", ""),
 (26, 19, 0.0, "tap", "the ombudsman", "walks to the bench and holds up the small key from its belt", "patient", "CAN'T BLOCK THE SALE", "the key glints", ""),
 (27, 19, W("advises"), "clink", "the small key", "rests in the judge's open hand, the fingers staying open and still", "open", "ADVISES · THE JUDGE DECIDES", "the hand stays open", "rehook: the key rests unturned in the judge's open hand"),
 (28, 20, 0.0, "creak", "a drawer stencilled 2015 under a cold strip light", "slides open", "curious", "PRECEDENT · 2015", "dust lifts", ""),
 (40, 20, W("Federal"), "page", "an FTC letter", "lands on a RadioShack receipt in the drawer", "plain", "FTC · RADIOSHACK'S COURT", "the letter settles", ""),
 (29, 20, W("promised"), "pencil", "a pencil", "underlines the promise line on the receipt", "plain", "\"PROMISES NOT TO SELL\" · FTC, 2015", "the line darkens", ""),
 (30, 21, 0.0, "swish", "the Disney crate behind its pane", "dims while the case is lit, the hammer still raised above it", "resolved", "NOT IN THE DISNEY DEAL", "the light shifts", ""),
 (31, 21, W("review"), "fold", "the ombudsman", "takes the marigold folder from the chair and opens it to blank pages headed SAFEGUARDS · DUE TO THE COURT", "hopeful", "WILL RECOMMEND SAFEGUARDS", "the blank pages flutter", ""),
 (32, 22, 0.0, "snap", "a second marigold cord", "shoots up from the ombudsman's hand and knots around the raised hammer's arm beside the first, pulling taut", "open", "SALE HEARING · DECEMBER 3RD AND 4TH", "the cord goes taut", ""),
 (33, 22, W("safeguards"), "ping", "a third marigold cord tagged THE JUDGE DECIDES", "ties on as Bub's ellipsis turns into a question mark and the paddle's shadow crosses the glass, the hammer still raised", "wondering", "WHICH SAFEGUARDS HOLD · UP TO THE JUDGE", "the question mark flickers", ""),
]

PLATE_AT = {b[0]: "upper-third" for b in B}
CLAIM_MAP = {1: ["c5"], 2: ["c11"], 3: ["c1"], 4: ["c2"], 5: ["c2"], 6: ["c6"], 7: ["c6"], 8: ["c7"], 9: ["c8"], 34: ["c8"], 10: ["c8"],
             11: ["c11"], 35: ["c11"], 12: ["c9"], 13: ["narration"], 14: ["c12"], 15: ["c12"], 41: ["c12"], 16: ["c17"], 17: ["c17"],
             18: ["c13"], 36: ["c13"], 19: ["c14"], 20: ["c18"], 37: ["c18"], 21: ["c20"], 38: ["c20"], 22: ["narration"], 23: ["c21"],
             24: ["c4"], 25: ["c22"], 39: ["c22"], 26: ["c16"], 27: ["c16"], 28: ["c24"], 40: ["c24"], 29: ["c24"], 30: ["c7"],
             31: ["c14"], 32: ["c23"], 33: ["c14", "c16"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "low", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "structure-as-subject", "", "", "This is for sale", "In a placeless auction hall at dusk a frosted glass case turns in a spotlight under a raised auctioneer's hammer, Bub jolts awake as a paddle snaps up and its shadow crosses the glass, a keyhole with no key"),
 (2, 1, "macro-closeup", "insert", "eye", "glass-interior", "macro-closeup", "single-object-void", "assemble-build", "data-as-subject", "push-in", "build", "The app", "Inside the glass, projected chat bubbles with little character faces light up around Bub under a CHARACTER.AI header until a court notice and a CH. 11 tab dim them and a FOR SALE tag drops over the dome"),
 (3, 3, "two-up", "wide", "high", "auction-hall", "eye-level-immersive", "fullbleed-split", "vertical-descent", "structure-as-subject", "pull-out", "carry", "Two bids", "From high in the gallery, a gear crate takes the left pedestal under Disney's paddle and a LICENSE sleeve, and a glass pane drops between it and Bub's case"),
 (4, 5, "push-detail", "medium", "low", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "vertical-rise", "instrument-as-subject", "hard-cut", "build", "Another bid", "From low by the plinth, a second paddle in a PER PPC LAND sash rises over the case, flips to $10M, and an APP · MODELS crate slides in beside it"),
 (5, 6, "alt-vantage", "close", "eye", "auction-hall", "macro-closeup", "stacked-layers", "vertical-rise", "multiplicity-swarm", "push-in", "build", "What's inside", "Close on the frost, labels fill in and a stack of tiny bubbles climbs past the gallery rail, then the spotlight irises down to the case and an empty referee chair"),
 (6, 9, "wide-establish", "extreme-wide", "high", "juneau-office", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "landscape-as-subject", "hard-cut", "travel", "Juneau", "A hard cut to an Alaska Department of Law office in Juneau at blue hour, Mount Juneau in the window, where Alaska's outline card slides into a fan of state cards"),
 (7, 10, "data-panel", "close", "overhead", "law-book", "top-down-map", "single-object-void", "assemble-build", "instrument-as-subject", "hard-cut", "build", "The rule", "From above, a law book falls open and a paper auction hammer pops up held by three paper tabs"),
 (8, 11, "subject-portrait", "medium", "low", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "hard-cut", "carry", "The watchdog", "A faceless ombudsman in a marigold armband walks in, ties the first marigold cord to the raised hammer, and lays a hand on the turntable so it stops"),
 (9, 13, "alt-vantage", "close", "eye", "juneau-committee", "eye-level-immersive", "single-object-void", "push-in-only", "instrument-as-subject", "hard-cut", "match", "The paper clip", "In a Juneau committee room, a faceless Mills at a lectern lifts a VOLUNTARY card held by a single paper clip"),
 (10, 14, "macro-closeup", "insert", "low", "bolt-macro", "macro-closeup", "stacked-layers", "vertical-rise", "instrument-as-subject", "match-action", "match", "The bolt", "Match on the paper clip to the same card clipped to the case's bolt, where a dashed ghost paddle tagged FUTURE BUYER hovers and never touches"),
 (11, 15, "wide-establish", "wide", "eye", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "assemble-build", "structure-as-subject", "hard-cut", "build", "The other side", "The hall goes to flat white house light and the company's case lands on the glass case itself, its own padlock and the CEO's declaration pinned to the plinth"),
 (12, 18, "alt-vantage", "medium", "ground", "courtroom", "eye-level-immersive", "stacked-layers", "vertical-rise", "single-organic-hero", "hard-cut", "build", "The key", "From the floor of a flat white courtroom, the judge sets down the rule book over the objection letters and the ombudsman hands up a small key that rests unturned in an open hand"),
 (13, 20, "push-detail", "insert", "overhead", "archive", "top-down-map", "single-object-void", "horizontal-traverse", "instrument-as-subject", "hard-cut", "travel", "2015", "From above under a cold strip light, a drawer stencilled 2015 slides open, an FTC letter lands on a RadioShack receipt and a pencil underlines the promise"),
 (14, 21, "wide-establish", "wide", "high", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "vertical-rise", "structure-as-subject", "hard-cut", "match", "Three cords", "Back in the hall from the gallery, the ombudsman opens the folder to blank pages, two more marigold cords tie to the raised hammer, and the paddle's shadow crosses the glass again"),
]

AMBIENT = {1: "a hall hush, a radiator tick", 2: "a soft projector hum", 3: "a hall hush, hand truck wheels", 4: "a hall hush, nickel creak",
           5: "a glass ring, a hall hush", 6: "a quiet office, harbor wind at the glass", 7: "paper and a page turn", 8: "a hall hush, footsteps",
           9: "a committee room hush, a radiator", 10: "a glass ring, a faint whirr", 11: "fluorescent hum, a hall hush", 12: "a courtroom hush",
           13: "fluorescent hum, an archive hush", 14: "a hall hush, a radiator tick"}
CENTER = {1: "the case at x500 y1000", 2: "Bub at x540 y980", 3: "the pane at x540 y980", 4: "the paddle at x560 y920", 5: "the labels at x480 y960",
          6: "the cards at x540 y1080", 7: "the hammer at x540 y940", 8: "the ombudsman at x620 y1000", 9: "the card at x560 y900", 10: "the bolt at x560 y980",
          11: "the padlock at x540 y960", 12: "the key at x540 y960", 13: "the receipt at x540 y980", 14: "the hammer at x660 y760"}
HERO = {
 1: ("frosted glass case + Bub + turntable + spotlight + paddle + keyhole + auctioneer's hammer", "45% case and Bub, 30% paddle and hammer, 25% hall"),
 2: ("chat bubbles + character faces + CHARACTER.AI header + Bub + court notice + CH. 11 tab + FOR SALE tag", "50% projection, 30% Bub, 20% notice"),
 3: ("pedestals + birch crate + Disney paddle + LICENSE sleeve + glass pane + Bub's case", "40% crate and paddle, 35% pane, 25% case"),
 4: ("second paddle + PER PPC LAND sash + APP · MODELS crate + Bub's case", "40% paddle, 35% case, 25% crate"),
 5: ("frosted labels + stack of tiny bubbles + spotlight + referee's chair + marigold folder", "40% glass and labels, 35% stack, 25% chair"),
 6: ("desk lamp + state outline cards + Alaska's outline card + Mount Juneau window + marigold band", "40% cards, 35% window, 25% desk"),
 7: ("law book + reading stand + paper auction hammer + three paper tabs", "50% pop-up, 30% book, 20% stand"),
 8: ("ombudsman + marigold armband + marigold cord + raised hammer + turntable + empty chair", "40% ombudsman, 35% cord and hammer, 25% case"),
 9: ("Mills + lectern + VOLUNTARY card + paper clip + framed Alaska map + plaster wall", "40% card, 35% figure, 25% wall"),
 10: ("slide bolt + VOLUNTARY card + paper clip + dashed ghost paddle + glass ring", "45% bolt and card, 35% ghost paddle, 20% glass"),
 11: ("house lights + company's padlock + declaration sheet + plinth", "40% padlock and case, 35% sheet, 25% hammer"),
 12: ("judge + pale bench + rule book + objection letters + ombudsman + small key + open hand", "40% key and hand, 35% bench, 25% figures"),
 13: ("drawer + FTC letter + RadioShack receipt + pencil + strip light", "50% drawer and receipt, 30% letter, 20% pencil"),
 14: ("ombudsman + marigold folder + blank pages + three marigold cords + raised hammer + case + Disney crate + paddle shadow", "40% hammer and cords, 35% case and folder, 25% crate"),
}
PARTS = {1: 54, 2: 46, 3: 52, 4: 46, 5: 44, 6: 50, 7: 42, 8: 48, 9: 42, 10: 40, 11: 48, 12: 46, 13: 42, 14: 56}
KICKS = (1, 14, 33)
CAMERA = {1: "dollyThrough", 2: "dollyThrough", 3: "craneDown", 4: "riseWith", 5: "riseWith", 6: "truckAcross", 7: "craneDown",
          8: "truckAcross", 9: "dollyThrough", 10: "riseWith", 11: "dollyThrough", 12: "riseWith", 13: "truckAcross", 14: "craneDown"}

PALETTE = ("fumed cherry hall #9A5A3A with dark walnut #5E3426, claret velvet #7A1F35, cool nickel fittings #8A8F7A, "
           "a pale spotlight #FFF3DE, cream bubble #FFF4E0 behind frost #DCE8EE on a velvet black interior #24152A, "
           "Juneau blue hour #5B6C8F over the Gastineau Channel #3D5566 in Alaska's rooms, celadon plaster #C9CFC0 for the courtroom, "
           "referee marigold #F2B632 reserved for the ombudsman, its cords and its folder")


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
        "run_date": "2026-11-20", "slug": "lot-2", "title": "Lot 2",
        "concept": ("Character.AI, an app for chatting with AI characters, filed for Chapter 11 in October to sell itself, and its assets go to auction on December 1st. "
                    "Disney's $20M opening bid is only a license to some of the technology and leaves out the chats; PPC Land reports a separate $10M opening bid for the app, models and user data. "
                    "Alaska's Department of Law says the chats include mental health and relationships, and over 2 million accounts belonged to minors by company figures. "
                    "Alaska joined a bipartisan group of states; federal law says a sale against a privacy promise needs a judge, an ombudsman and a hearing, and at the coalition's urging the court ordered a privacy ombudsman. "
                    "The company says the data is still protected, the CEO cited legal costs and no profit, the judge approved the auction rules over the states' objections, and the ombudsman advises while the judge decides. "
                    "Drawn as Bub, a cream speech bubble with two dot eyes and a typing ellipsis that never leaves its frosted case on an auction turntable, under an auctioneer's hammer that marigold cords of fact hold up, with Juneau as Alaska's own rooms."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "vertical-rise", "hero_treatment": "structure-as-subject", "layout": "centered-hero-lowerthird",
                        "register": "tactile-collage", "palette": PALETTE, "camera_strategy": "locked-drift",
                        "light_story": "a near-white spotlight on a turning case in a placeless auction hall, Juneau blue hour for Alaska's rooms, flat white house light when the company makes its case, a flat sage courtroom, and the hammer held up by marigold cords in the last frame",
                        "metaphor": "an auction where the chats wait behind frost on a turntable under a raised hammer that the facts of the case tie up one marigold cord at a time"},
        "signature_shot": 14,
        "palette": PALETTE,
        "divergence_note": ("The last films were persimmon daylight over the Anchorage apron, a cork evidence board with red strings, a faced paper route card and a sealed envelope (11-19), and a mint afterglow over lilac snow with a faced chalk-line reel, a three trip-pin cutaway and dashed chalk marks (11-18). "
                            "This film is a fumed cherry and claret velvet auction interior with cool nickel fittings, its spine a raised auctioneer's hammer that marigold cords tie up one fact at a time, its hero a bubble that never leaves its frosted case and acts only with its eyes and ellipsis, and Juneau kept to Alaska's own rooms. "
                            "Honest overlaps: it is still a faced inanimate hero, answered by keeping it passive and behind glass while people act; the final image is still an unresolved state, answered by a hammer that hasn't fallen rather than a token; 11-15 was Juneau in rain, answered by blue hour with the rain stopped and two interior offices."),
        "treatment": {"title": "Lot 2", "summary": ad["treatment"],
                      "judge_reasoning": json.loads((OUT / "treatment.json").read_text())["reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "Low and close on a frosted glass case turning into a brass spotlight in a timber hall, Bub asleep inside, and at 0.3 s a square auction paddle snaps up into the light and its shadow sweeps across the glass",
                 "headline": "AUCTION · DECEMBER 1ST", "motion_by_s": 0.3,
                 "loopback": "Frame 1 is the case in the spotlight under the raised hammer with the paddle's shadow crossing it; the last image is the same case and the same raised hammer, now held up by three marigold cords, as the paddle's shadow crosses the glass again and Bub's ellipsis turns into a question mark."},
        "open_loop": {"plant_t": b_at(2), "pay_t": b_at(27), "plant_glow_s": 0.4, "plant_sfx": "roll", "what": "Who holds the key? Planted as a round keyhole glinting on the case with no key anywhere, seeded again when a small key glints at the ombudsman's belt, paid when the ombudsman hands that key up to the bench and it rests unturned in the judge's open hand."},
        "open_loop_2": {"plant_t": b_at(13), "pay_t": b_at(31), "what": "What's in the closed folder? Planted as an empty tall referee's chair beside the case with a closed marigold folder on its seat when the narration asks who's watching, kept closed beside the case, paid when the ombudsman opens it to blank pages headed SAFEGUARDS · DUE TO THE COURT."},
        "throughline": {"object": "the auctioneer's hammer raised over the case", "lands_in_button": "the hammer still raised over the case, held up by three marigold cords tagged OMBUDSMAN ORDERED, SALE HEARING · DECEMBER 3RD AND 4TH and THE JUDGE DECIDES",
                        "states": [
                            {"at_s": b_at(1), "state": "T1 raised free on its arm over the turning case"},
                            {"at_s": b_at(8), "state": "T2 raised over the pane that splits the two bids"},
                            {"at_s": b_at(17), "state": "T3 drawn as a paper pop-up held by three tabs in the law book"},
                            {"at_s": b_at(36), "state": "T4 the first marigold cord tied on, OMBUDSMAN ORDERED"},
                            {"at_s": b_at(23), "state": "T5 raised over the company's padlock in flat white light"},
                            {"at_s": b_at(32), "state": "T6 a second cord, SALE HEARING · DECEMBER 3RD AND 4TH"},
                            {"at_s": b_at(33), "state": "T7 three cords, still raised, not fallen"}]},
        "reveals": [
            {"t": b_at(3), "type": "build-on", "what": "chat bubbles project inside the glass around Bub", "hold_s": 0.6},
            {"t": b_at(12), "type": "scale-pullback", "what": "a stack of tiny bubbles climbs past the gallery rail", "hold_s": 0.8},
            {"t": b_at(14), "type": "scale-pullback", "what": "a hard cut out to a Juneau office with Mount Juneau in the window", "hold_s": 0.6},
            {"t": b_at(17), "type": "build-on", "what": "a paper hammer pops up out of the law book on three tabs", "hold_s": 0.8},
            {"t": b_at(33), "type": "scale-pullback", "what": "the camera rises to the whole hall and the hammer held up by three cords", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.8}, {"line": 3, "offset": 0.0, "level": 1.2}, {"line": 8, "offset": 0.0, "level": 0.5},
            {"line": 10, "offset": 0.0, "level": 1.4}, {"line": 15, "offset": 0.0, "level": 0.6}, {"line": 20, "offset": 0.0, "level": 1.2},
            {"at_s": round(b_at(31) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(31) + 0.5, 3), "level": 1.4},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(31) - 0.5, 3), "riser_at": round(b_at(36), 3), "silence_at": round(b_at(31) - 0.5, 3),
            "payoff_at": b_at(31), "button_pattern": "callback", "interrupt_at": b_at(8), "extra_dips": []},
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
    book.raise_if_missing("board_1120 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1120Ids.ts").write_text(
        "// GENERATED by scripts/board_1120.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
