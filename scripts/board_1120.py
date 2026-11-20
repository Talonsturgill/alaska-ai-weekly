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
BUB = "Bub, a porcelain-pale speech bubble with two dot eyes and a typing ellipsis on its belly, behind frost inside a glass case on a turntable"
REF = "a tall faceless figure in a marigold armband"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "pop", BUB, "jolts awake as a square auction paddle snaps up into the spotlight and its shadow sweeps the glass, the auctioneer's hammer raised high on its nickel arm above", "shocked", "AUCTION · DECEMBER 1ST", "Bub's dots scramble", ""),
 (2, 0, W("chats"), "roll", "the turntable", "swings the case toward camera as the light catches a round keyhole on the hammer's catch with no key in it", "anxious", "ITS CHATS MAY GO TOO", "the keyhole glints", ""),
 (3, 1, 0.0, "type", "a faceless adult hand holding a phone at a kitchen table at night", "taps the CHARACTER.AI app open and chat bubbles with little character faces lift off the screen and drift up", "busy", "CHARACTER.AI · CHAT WITH AI CHARACTERS", "the bubbles drift", ""),
 (4, 2, 0.0, "stamp", "a court notice", "slides down across the phone screen and a CH. 11 tab clamps onto it while the bubbles stall in the air", "worried", "BANKRUPTCY · OCTOBER", "the bubbles stall", ""),
 (5, 2, W("sell"), "clip", "a FOR SALE tag on a string", "drops into frame and swings over the phone", "uneasy", "TO SELL ITSELF", "the tag swings", ""),
 (6, 3, 0.0, "thunk", "a birch crate of gears", "rolls onto the left pedestal on a hand truck as a Disney paddle rises over it", "businesslike", "DISNEY OPENS", "the gears turn", ""),
 (7, 3, W("twenty"), "flip", "the Disney paddle", "flips its blank card to $20M", "confident", "$20 MILLION", "the card settles", ""),
 (42, 3, W("only"), "slide", "a slate LICENSE sleeve", "slides down over the crate of gears", "plain", "ONLY A LICENSE · SOME TECHNOLOGY", "the sleeve settles", ""),
 (8, 4, 0.0, "glass", "a tall glass pane", "drops between the two pedestals and Bub's dots jolt apart then snap back", "startled", "NO CHATS IN THE DISNEY DEAL", "the dots snap back", ""),
 (9, 5, 0.0, "swing", "a second paddle with a blank card and a PER PPC LAND sash", "rises beyond the frosted glass", "watchful", "PER PPC LAND", "the sash sways", ""),
 (44, 5, W("bid"), "squeak", "the second paddle", "tips toward the glass and its blank card swings to face the lens", "pointed", "ANOTHER OPENING BID", "the card swings", ""),
 (34, 5, W("ten"), "snap", "the second paddle's blank card", "flips to $10M", "sharp", "$10 MILLION", "the card settles", ""),
 (10, 5, W("models"), "slide", "a small sleeved crate tagged APP · MODELS", "slides against the plinth as a nickel lot tie cinches across the glass in front of the lens", "plain", "APP · MODELS · USER DATA", "the tie cinches", ""),
 (11, 6, 0.0, "crack", "the case seen from straight above in a dark void", "frosts over with a crackle as two blank labels rise through the frost", "quiet", "PER ALASKA DEPT. OF LAW", "the frost crackles", ""),
 (35, 6, W("mental"), "squeak", "the frosted labels", "etch in, MENTAL HEALTH on one word and RELATIONSHIPS on the next, while Bub's ellipsis freezes", "still", "MENTAL HEALTH · RELATIONSHIPS", "the ellipsis freezes", ""),
 (12, 7, 0.0, "bubble", "tiny child-sized porcelain bubbles", "pour out around the case and spread across the void as the camera rises", "overwhelmed", "OVER 2 MILLION ACCOUNTS · COMPANY FIGURES", "the field spreads", "rehook: tiny bubbles pour out until the case is one dot among them"),
 (43, 7, W("minors"), "tick", "the swarm of child-sized bubbles", "rolls outward and bumps to the frame edges with a soft glass tick until the case is one dot in the field", "tender", "OVER 2 MILLION MINORS' ACCOUNTS · COMPANY FIGURES", "the swarm keeps spreading", ""),
 (13, 8, 0.0, "click", "a spotlight from above", "irises down onto the case and an empty tall referee's chair beside it with a closed marigold folder on its seat", "lonely", "WHO'S WATCHING?", "the folder sits closed", ""),
 (14, 9, 0.0, "chain", "a desk lamp in an Alaska Department of Law office in Juneau at blue hour, Mount Juneau in the window", "clicks on over a fan of state outline cards", "alert", "OCTOBER · STATE ATTORNEYS GENERAL", "the lamp warms the desk", ""),
 (15, 9, W("joined"), "slide", "Alaska's outline card", "slides into the fan of state cards", "hopeful", "ALASKA JOINED · BIPARTISAN STATES", "the fan shifts", ""),
 (41, 9, W("protections"), "snap", "the fan of state cards", "squares into one stack and a nickel band snaps around it", "resolved", "PROTECTIONS IN ANY SALE", "the band snaps", ""),
 (16, 10, 0.0, "flip", "a law book on a reading stand", "falls open and a page starts to pop up", "curious", "FEDERAL LAW · 11 U.S.C. 363", "the pages fan", ""),
 (17, 10, W("judge"), "fold", "a paper staircase", "pops up out of the page in three steps labelled OMBUDSMAN, HEARING and JUDGE, a paper hammer waiting at the top", "methodical", "OMBUDSMAN · HEARING · JUDGE", "the steps stand", ""),
 (18, 11, 0.0, "step", REF, "walks into the hall past the turning case with its name tag turned away", "composed", "AT THE STATES' URGING", "the figure settles", ""),
 (45, 11, W("Alaska's"), "tap", "the ombudsman", "stops beside the case and lifts a marigold tag from its pocket", "ready", "PER ALASKA DEPT. OF LAW", "the tag dangles", ""),
 (36, 11, W("court"), "snap", "the ombudsman's name tag", "flips face out as its hands knot a marigold tag reading OMBUDSMAN ORDERED onto the case's ring to travel with the lot", "firm", "COURT ORDERS A PRIVACY OMBUDSMAN · OMBUDSMAN ORDERED", "the marigold tag swings", ""),
 (19, 12, 0.0, "footstep", "the ombudsman", "walks alongside the turning case at its pace, eyes on the frosted labels, a small key at its belt glinting", "steady", "REVIEWS THE SALE", "the case keeps turning", "rehook: the watchdog walks beside the turning case"),
 (20, 13, 0.0, "step", "a faceless figure tagged CORI MILLS in the same Juneau office", "walks to the desk and lifts a card held by a single paper clip that slips, and catches it", "firm", "CORI MILLS · ACTING ATTORNEY GENERAL", "the paper clip wobbles", ""),
 (37, 13, W("can"), "thud", "a quote plate", "drops onto the desk front as Mills holds the card up", "pointed", "\"SOLD TO THE HIGHEST BIDDER\"", "the desk lamp shakes", ""),
 (21, 14, 0.0, "clank", "the case's slide bolt", "shoots home and the same blank card swings on its one clip", "uneasy", "LIMITS ON MINORS", "the card swings", ""),
 (46, 14, W("voluntary"), "scratch", "the card on the bolt", "inks VOLUNTARY across itself as it swings", "uneasy", "VOLUNTARY", "the ink dries", ""),
 (38, 14, W("buyer"), "whirr", "a dashed ghost paddle tagged FUTURE BUYER", "rises beside the bolt and stops short, hovering without touching it", "uneasy", "\"COULD BE ... REVERSED BY A FUTURE BUYER\" · MILLS", "the ghost hovers", ""),
 (22, 15, 0.0, "clunk", "the hall lights", "snap off the spotlight and flat white house lights slam on, the empty chair and its closed folder in view", "even", "THE OTHER SIDE", "the room goes flat", ""),
 (23, 16, 0.0, "chain", "a faceless figure tagged THE COMPANY", "hangs its own padlock on the case's ring", "calm", "STILL PROTECTED · PER THE COMPANY", "the padlock swings", ""),
 (24, 17, 0.0, "creak", "the company figure", "hooks a declaration sheet onto the far end of the hammer's arm, which drops and dips toward the case under its weight", "tired", "LEGAL COSTS · STRUGGLING TO PROFIT · PER THE CEO", "the arm dips", ""),
 (25, 18, 0.0, "thump", "a faceless figure tagged JUDGE at a pale bench in a celadon courtroom", "sets a heavy bound rule book down", "neutral", "THE JUDGE · AUCTION RULES APPROVED", "the book lands", ""),
 (39, 18, W("objections"), "rustle", "a stack of state objection letters", "is slid aside by the judge's hand under the rule book", "neutral", "OVER STATE AGS' OBJECTIONS", "the letters slide", ""),
 (26, 19, 0.0, "ring", "the ombudsman", "walks to the bench and holds up the small key from its belt", "patient", "CAN'T BLOCK THE SALE", "the key glints", ""),
 (27, 19, W("advises"), "clink", "the small key", "rests in the judge's open hand, the fingers staying open and still", "open", "ADVISES · THE JUDGE DECIDES", "the hand stays open", "rehook: the key rests unturned in the judge's open hand"),
 (28, 20, 0.0, "creak", "a drawer stencilled 2015 under a cold strip light", "slides open", "curious", "PRECEDENT · 2015", "dust lifts", ""),
 (40, 20, W("Federal"), "page", "an FTC letter", "lands on a RadioShack receipt in the drawer", "plain", "FTC · RADIOSHACK'S COURT", "the letter settles", ""),
 (29, 20, W("promised"), "pencil", "a pencil", "underlines the promise line on the receipt", "plain", "\"PROMISES NOT TO SELL\" · FTC, 2015", "the line darkens", ""),
 (30, 21, 0.0, "knock", "Disney's sleeved gear crate behind the pane", "takes a dull glass knock as the spotlight slides off it onto the case alone on the other side", "plain", "THE DISNEY BID SKIPPED THE CHATS", "the pane hums", ""),
 (31, 21, W("review"), "fold", "the ombudsman", "lifts the marigold folder from the chair and opens it to blank pages headed SAFEGUARDS · DUE TO THE COURT", "hopeful", "THE REVIEW COVERS THE CHATS", "the blank pages flutter", ""),
 (32, 22, 0.0, "clip", "a court card", "drops and clips onto the hammer's catch", "open", "SALE HEARING · DECEMBER 3RD AND 4TH", "the card swings", ""),
 (33, 22, W("safeguards"), "swish", "the camera", "rises to the whole hall as Bub's ellipsis turns into a question mark and the paddle's shadow crosses the glass, the hammer still raised with its arm dipped under the declaration, its catch unturned, the marigold tag hanging below", "wondering", "WHICH SAFEGUARDS HOLD · UP TO THE JUDGE", "the question mark flickers", ""),
]

PLATE_AT = {b[0]: "upper-third" for b in B}
CLAIM_MAP = {30: ["c7"], 44: ["c8"], 45: ["c13"], 46: ["c20"], 1: ["c5"], 2: ["c11"], 3: ["c1"], 4: ["c2"], 5: ["c2"], 6: ["c6"], 7: ["c6"], 42: ["c6"], 8: ["c7"], 9: ["c8"], 34: ["c8"], 10: ["c8"],
             11: ["c11"], 35: ["c11"], 12: ["c9", "c10"], 43: ["c9"], 13: ["narration"], 14: ["c12"], 15: ["c12"], 41: ["c12"], 16: ["c17"], 17: ["c17"],
             18: ["c13"], 36: ["c13"], 19: ["c14"], 20: ["c18"], 37: ["c18"], 21: ["c20"], 38: ["c20"], 22: ["narration"], 23: ["c21"],
             24: ["c4"], 25: ["c22"], 39: ["c22"], 26: ["c16"], 27: ["c16"], 28: ["c24"], 40: ["c24"], 29: ["c24"],
             31: ["c14"], 32: ["c23"], 33: ["c14", "c16"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "low", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "structure-as-subject", "", "", "This is for sale", "In a windowless auction hall a frosted glass case turns in a spotlight under a raised auctioneer's hammer, Bub jolts awake as a paddle snaps up and its shadow crosses the glass, a keyhole on the hammer's catch with no key"),
 (2, 1, "macro-closeup", "close", "high", "kitchen-night", "macro-closeup", "single-object-void", "horizontal-traverse", "instrument-as-subject", "hard-cut", "travel", "The app", "A hard cut to a kitchen table at night where a faceless adult hand holds a phone, the CHARACTER.AI app opens and chat bubbles lift off the screen until a court notice and a CH. 11 tab stall them and a FOR SALE tag swings over the phone"),
 (3, 3, "two-up", "wide", "high", "auction-hall", "eye-level-immersive", "fullbleed-split", "vertical-descent", "structure-as-subject", "hard-cut", "carry", "Two bids", "From high in the gallery, a gear crate takes the left pedestal under Disney's paddle, a LICENSE sleeve slides over it, and a glass pane drops between it and Bub's case"),
 (4, 5, "alt-vantage", "medium", "low", "case-interior", "macro-closeup", "stacked-layers", "vertical-rise", "instrument-as-subject", "hard-cut", "build", "Another bid", "A reverse from inside the frosted case, Bub's ellipsis in the foreground: beyond the glass a second paddle in a PER PPC LAND sash rises blurred, flips to $10M, an APP · MODELS crate slides against the plinth and a nickel lot tie cinches across the glass in front of the lens"),
 (5, 6, "map-territory", "extreme-wide", "overhead", "bubble-void", "top-down-map", "map-territory", "radial-emanate", "multiplicity-swarm", "hard-cut", "build", "What's inside", "Straight down on the case in a dark void, labels etch through the frost and tiny bubbles pour out across the void until the case is one dot, then a spotlight irises down onto the case and an empty referee chair"),
 (6, 9, "wide-establish", "wide", "eye", "juneau-office", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "landscape-as-subject", "hard-cut", "travel", "Juneau", "A hard cut to an Alaska Department of Law office in Juneau at blue hour, Mount Juneau in the window, where Alaska's outline card slides into a fan of state cards"),
 (7, 10, "data-panel", "close", "overhead", "law-book", "top-down-map", "single-object-void", "assemble-build", "instrument-as-subject", "hard-cut", "build", "The rule", "From above, a law book falls open and a paper staircase pops up in three steps toward a paper hammer"),
 (8, 11, "subject-portrait", "medium", "low", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "hard-cut", "carry", "The watchdog", "A faceless ombudsman in a marigold armband walks in, a marigold OMBUDSMAN ORDERED tag knots onto the case's ring to travel with the lot, and the ombudsman walks beside the turning case"),
 (9, 13, "alt-vantage", "close", "eye", "juneau-office", "eye-level-immersive", "single-object-void", "push-in-only", "instrument-as-subject", "hard-cut", "match", "The paper clip", "Back in the Juneau office from the desk's side, a faceless Mills lifts a card held by a single paper clip"),
 (10, 14, "macro-closeup", "insert", "low", "bolt-macro", "macro-closeup", "stacked-layers", "vertical-rise", "instrument-as-subject", "match-action", "match", "The bolt", "Match on the paper clip to the same card swinging on the case's bolt as VOLUNTARY inks in, where a dashed FUTURE BUYER paddle hovers and never touches"),
 (11, 15, "wide-establish", "wide", "eye", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "assemble-build", "structure-as-subject", "hard-cut", "build", "The other side", "Flat white house light; a faceless figure tagged THE COMPANY hangs its padlock on the dome and hooks the CEO's declaration on the hammer's arm, which dips under the weight"),
 (12, 18, "alt-vantage", "medium", "ground", "courtroom", "eye-level-immersive", "stacked-layers", "vertical-rise", "single-organic-hero", "hard-cut", "build", "The key", "From the floor of a flat celadon courtroom, the judge sets down the rule book over the objection letters and the ombudsman hands up a small key that rests unturned in an open hand"),
 (13, 20, "push-detail", "insert", "overhead", "archive", "top-down-map", "single-object-void", "horizontal-traverse", "instrument-as-subject", "hard-cut", "travel", "2015", "From above under a cold strip light, a drawer stencilled 2015 slides open, an FTC letter lands on a RadioShack receipt and a pencil underlines the promise"),
 (14, 21, "wide-establish", "wide", "high", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "vertical-rise", "structure-as-subject", "hard-cut", "match", "Still raised", "Back in the hall, the ombudsman opens the folder to blank pages, a court card clips onto the hammer's catch, and the camera rises as the paddle's shadow crosses the glass under a hammer that hasn't fallen"),
]

AMBIENT = {1: "a hall hush, a radiator tick", 2: "a kitchen hush, a fridge hum", 3: "a hall hush, hand truck wheels", 4: "a muffled hall through glass",
           5: "a low void hum", 6: "a quiet office, harbor wind at the glass", 7: "paper and a page turn", 8: "a hall hush, footsteps",
           9: "a quiet office, a radiator", 10: "a glass ring, a faint whirr", 11: "fluorescent hum, a hall hush", 12: "a courtroom hush",
           13: "fluorescent hum, an archive hush", 14: "a hall hush, a radiator tick"}
CENTER = {1: "the case at x500 y1000", 2: "the phone at x540 y980", 3: "the pane at x540 y980", 4: "the paddle at x560 y920", 5: "the case at x540 y960",
          6: "the cards at x540 y1080", 7: "the hammer at x540 y940", 8: "the ombudsman at x620 y1000", 9: "the card at x560 y900", 10: "the bolt at x560 y980",
          11: "the padlock at x540 y960", 12: "the key at x540 y960", 13: "the receipt at x540 y980", 14: "the hammer at x660 y760"}
HERO = {
 1: ("frosted glass case + Bub + turntable + spotlight + paddle + keyhole + auctioneer's hammer", "45% case and Bub, 30% paddle and hammer, 25% hall"),
 2: ("faceless adult hand + phone + CHARACTER.AI app + chat bubbles + court notice + CH. 11 tab + FOR SALE tag + kitchen table", "45% phone and hand, 35% bubbles, 20% notice"),
 3: ("pedestals + birch crate + Disney paddle + LICENSE sleeve + glass pane", "40% crate and paddle, 35% pane, 25% case"),
 4: ("second paddle + PER PPC LAND sash + APP · MODELS crate + nickel lot tie + frosted glass", "40% paddle, 35% case, 25% crate"),
 5: ("frosted labels + tiny porcelain bubbles + spotlight + referee's chair + marigold folder", "40% glass and labels, 35% stack, 25% chair"),
 6: ("desk lamp + state outline cards + Alaska's outline card + Mount Juneau window + nickel band", "40% cards, 35% window, 25% desk"),
 7: ("law book + reading stand + paper auction hammer + three paper tabs", "50% pop-up, 30% book, 20% stand"),
 8: ("ombudsman + marigold armband + marigold tag + name tag + case", "40% ombudsman, 35% tag and case ring, 25% case"),
 9: ("Mills + desk + quote plate + paper clip + desk lamp + Juneau office", "40% card, 35% figure, 25% wall"),
 10: ("slide bolt + card + paper clip + dashed ghost paddle + glass ring", "45% bolt and card, 35% ghost paddle, 20% glass"),
 11: ("house lights + company figure + padlock + declaration sheet + hammer's arm", "40% padlock and case, 35% sheet, 25% hammer"),
 12: ("judge + pale bench + rule book + objection letters + ombudsman + small key + open hand", "40% key and hand, 35% bench, 25% figures"),
 13: ("drawer + FTC letter + RadioShack receipt + pencil + strip light", "50% drawer and receipt, 30% letter, 20% pencil"),
 14: ("Disney's sleeved gear crate + pane + ombudsman + marigold folder + blank pages + court card + hammer's catch + paddle shadow", "40% hammer, catch and court card, 35% case and folder, 25% crate behind the pane"),
}
PARTS = {1: 54, 2: 46, 3: 52, 4: 46, 5: 44, 6: 50, 7: 42, 8: 48, 9: 42, 10: 40, 11: 48, 12: 46, 13: 42, 14: 56}
KICKS = (1, 14, 22)
CAMERA = {1: "dollyThrough", 2: "dollyThrough", 3: "craneDown", 4: "riseWith", 5: "riseWith", 6: "truckAcross", 7: "craneDown",
          8: "truckAcross", 9: "dollyThrough", 10: "riseWith", 11: "dollyThrough", 12: "riseWith", 13: "truckAcross", 14: "riseWith"}

PALETTE = ("claret velvet #7A1F35 over dark walnut walls #5E3426 with cherry trim #9A5A3A, cool nickel fittings #8E959B, "
           "a pale spotlight #FFF3DE, a porcelain bubble #EEF3F1 behind frost #DCE8EE on a velvet black interior #24152A, "
           "Juneau blue hour #5B6C8F over the Gastineau Channel #3D5566 in Alaska's rooms, celadon plaster #C9CFC0 for the courtroom, "
           "referee marigold #F2B632 reserved for the ombudsman's armband, its tag and its folder")


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
                    "Drawn as Bub, a porcelain speech bubble with two dot eyes and a typing ellipsis that never leaves its frosted case on an auction turntable, under an auctioneer's hammer whose catch only the judge can release, with Juneau as Alaska's own office."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "vertical-rise", "hero_treatment": "structure-as-subject", "layout": "centered-hero-lowerthird",
                        "register": "tactile-collage", "palette": PALETTE, "camera_strategy": "dolly-through",
                        "light_story": "a pale spotlight on a turning case in a placeless auction hall, Juneau blue hour for Alaska's rooms, flat white house light when the company makes its case, a flat celadon courtroom, and the hammer still raised with its catch unturned in the last frame",
                        "metaphor": "an auction where the chats wait behind frost on a turning case under a raised hammer whose catch only the judge can release, while the watchdog's marigold tag travels with the lot"},
        "signature_shot": 14,
        "palette": PALETTE,
        "divergence_note": ("The last films were persimmon daylight over the Anchorage apron, a cork evidence board with red strings, a faced paper route card and a sealed envelope (11-19), and a mint afterglow over lilac snow with a faced chalk-line reel, a three trip-pin cutaway and three owned ropes lifting a slack line (11-18). "
                            "This film is a windowless claret and dark walnut auction hall with cool nickel fittings, its spine a raised auctioneer's hammer whose catch only the judge can release, a porcelain bubble that never leaves its frosted case, a kitchen phone at night, a top-down field of tiny bubbles, and Juneau kept to Alaska's own office. "
                            "Honest overlaps: pov is eye-level for the third film running and motion is vertical like 11-18, answered by the overhead void, the kitchen macro and the law-book top-down; it is still a faced inanimate hero, answered by keeping it passive and behind glass while people act; the ending is still unresolved, answered by a hammer that hasn't fallen with its catch unturned rather than a token; 11-15 was Juneau in rain, answered by blue hour with the rain stopped in an office."),
        "treatment": {"title": "Lot 2", "summary": ad["treatment"],
                      "judge_reasoning": json.loads((OUT / "treatment.json").read_text())["reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "Low and close on a frosted glass case turning in a nickel-housed spotlight in a windowless claret hall, Bub asleep inside under a raised auctioneer's hammer, and at 0.3 s a square auction paddle snaps up into the light and its shadow sweeps across the glass",
                 "headline": "AUCTION · DECEMBER 1ST", "motion_by_s": 0.3,
                 "loopback": "Frame 1 is the case in the spotlight under the raised hammer with the paddle's shadow crossing it; the last image is the same case and the same raised hammer, its catch now carrying a court card and still unturned, as the paddle's shadow crosses the glass again and Bub's ellipsis turns into a question mark."},
        "open_loop": {"plant_t": b_at(2), "pay_t": b_at(27), "plant_glow_s": 0.4, "plant_sfx": "roll", "what": "Who holds the key? Planted as a round keyhole on the raised hammer's catch with no key in it, seeded again when a small key glints at the ombudsman's belt, paid when the ombudsman hands that key up to the bench and it rests unturned in the judge's open hand."},
        "open_loop_2": {"plant_t": b_at(13), "pay_t": b_at(31), "what": "What's in the closed folder? Planted as an empty tall referee's chair beside the case with a closed marigold folder on its seat when the narration asks who's watching, re-seen closed under flat house light, paid when the ombudsman opens it to blank pages headed SAFEGUARDS · DUE TO THE COURT."},
        "throughline": {"object": "the auctioneer's hammer raised over the case", "lands_in_button": "the hammer still raised over the turning case, a court card clipped to its catch, the catch unturned",
                        "states": [
                            {"at_s": b_at(1), "state": "T1 raised on its nickel arm over the turning case"},
                            {"at_s": b_at(8), "state": "T2 raised over the pane that splits the two bids"},
                            {"at_s": b_at(17), "state": "T3 a paper hammer waiting at the top of three paper steps in the law book"},
                            {"at_s": b_at(36), "state": "T4 raised over the case as the watchdog's marigold tag knots on below it"},
                            {"at_s": b_at(24), "state": "T5 its arm dipping under the company's declaration hung as a counterweight"},
                            {"at_s": b_at(27), "state": "T6 its catch's key resting unturned in the judge's open hand"},
                            {"at_s": b_at(32), "state": "T7 a court card clipped to its catch, still raised"}]},
        "reveals": [
            {"t": b_at(3), "type": "build-on", "what": "chat bubbles lift off a phone in a kitchen at night", "hold_s": 0.6},
            {"t": b_at(12), "type": "scale-pullback", "what": "tiny bubbles pour out until the case is one dot in the void", "hold_s": 0.8},
            {"t": b_at(17), "type": "build-on", "what": "a paper staircase pops up out of the law book", "hold_s": 0.8},
            {"t": b_at(46), "type": "scale-pullback", "what": "pull back from the inked card to the whole case and the hovering ghost paddle", "hold_s": 0.6},
            {"t": b_at(24), "type": "morph-to-chart", "what": "the hammer's arm dips under the declaration like a balance beam", "hold_s": 0.6},
            {"t": b_at(33), "type": "scale-pullback", "what": "the camera rises to the whole hall and the raised hammer", "hold_s": 0.8}],
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
