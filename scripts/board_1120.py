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
BUB = "Bub, a cream speech bubble with two dot eyes and a typing ellipsis on its belly, inside a frosted glass case on a turntable"
REF = "a tall faceless figure in a marigold armband tagged CONSUMER PRIVACY OMBUDSMAN"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "pop", BUB, "jolts awake as a square auction paddle snaps up into the spotlight and its shadow sweeps across the glass, a rain window onto Mount Juneau behind", "shocked", "AUCTION · DECEMBER 1ST", "Bub's dots scramble", ""),
 (2, 0, W("chats"), "roll", "the turntable", "swings the case toward camera, a round brass keyhole glinting on it with no key anywhere on the plinth", "anxious", "AN AI CHAT APP · AT AUCTION", "the keyhole glints", "rehook"),
 (3, 1, 0.0, "type", "Bub", "jumps out of the case and lands on a giant phone screen that slides up from the plinth, little character faces popping out in chat bubbles", "delighted", "AN APP FOR CHATTING WITH AI CHARACTERS", "the bubbles pop", ""),
 (4, 2, 0.0, "stamp", "a court notice", "slides across the screen and a CHAPTER 11 tab clamps onto its corner while the little chat bubbles deflate", "worried", "CHAPTER 11 · OCTOBER", "the bubbles deflate", ""),
 (5, 2, W("sell"), "slide", "the phone screen", "tips back down into the frosted case on the turntable as the hall lights come up around it", "uneasy", "U.S. BANKRUPTCY COURT · DELAWARE", "the hall lights rise", ""),
 (6, 3, 0.0, "thunk", "a birch crate of gears in a slate LICENSE sleeve", "rolls onto the LOT 1 pedestal on a hand truck and its gears turn behind the slats", "businesslike", "A LICENSE · SOME TECHNOLOGY", "the gears turn", ""),
 (7, 3, W("twenty"), "ching", "a Disney paddle over the crate", "snaps up and its number card flips to 20 million", "confident", "DISNEY · $20 MILLION · A LICENSE", "the card flips", ""),
 (8, 4, 0.0, "glass", "a tall glass pane", "drops between the two pedestals and pinches Bub's typing dots, which boing back to its belly", "startled", "NO CHATS IN THE DISNEY DEAL", "the dots boing back", ""),
 (9, 5, 0.0, "squeak", "a second paddle wearing a PER PPC LAND sash", "rises over Bub's case and keeps straightening its sash", "fussy", "$10 MILLION · APP, MODELS, USER DATA · PER PPC LAND", "the sash slips", ""),
 (10, 5, W("models"), "clank", "a brass two-pan scale", "drops onto the plinth to weigh the two paddles and both pans fly up and slam against its stops", "stubborn", "TWO SEPARATE BIDS", "the pans flip up", ""),
 (11, 6, 0.0, "shimmer", "frosted labels on the glass", "slide up through the frost one at a time while Bub pulls its tail over its belly", "shy", "MENTAL HEALTH · RELATIONSHIPS · PER ALASKA DEPT. OF LAW", "Bub curls its tail", "rehook: the labels rise through the frost"),
 (12, 7, 0.0, "bubble", "a stack of tiny cream bubbles", "climbs beside the case up past the window line, each one a dot, still rising", "overwhelmed", "OVER 2 MILLION MINORS' ACCOUNTS · COMPANY FIGURES", "the stack keeps climbing", "rehook: the stack of tiny bubbles climbs past the window line"),
 (13, 8, 0.0, "hush", "the spotlight", "narrows to the case and an empty tall referee's chair beside it with a blank marigold folder on its seat while the hall goes dark", "lonely", "WHO'S WATCHING THIS PART?", "the folder sits untouched", "rehook: an empty referee chair waits with a blank folder"),
 (14, 9, 0.0, "flap", "a Raven on a rain streaked window sill over Mount Juneau and the Gastineau Channel", "shakes off rain as a Department of Law envelope slides in under the sash", "alert", "ALASKA JOINED · OCTOBER · BIPARTISAN STATES", "the Raven shakes off rain", "rehook: an envelope slides in under the Juneau window"),
 (15, 9, W("protections"), "paper", "the envelope", "opens and a fan of state outline cards spreads across the sill with Alaska's outline among them", "hopeful", "PROTECTIONS IN ANY SALE", "the cards fan out", ""),
 (16, 10, 0.0, "clunk", "the camera", "pushes into the case's round keyhole and the brass lock opens into a cross section", "curious", "11 U.S.C. 363 · A PROMISE LIMITS THE SALE", "the lock opens", ""),
 (17, 10, W("ombudsman"), "click", "three brass tumblers in the lock", "lift one at a time under labels JUDGE, OMBUDSMAN and HEARING while the bolt stays put", "methodical", "JUDGE · OMBUDSMAN · HEARING", "the tumblers lift", ""),
 (18, 11, 0.0, "footstep", REF, "walks in past the tall Mount Juneau window and stops beside the empty chair, facing the bench and not Bub", "composed", "COURT ORDERS A PRIVACY OMBUDSMAN", "the figure settles", "rehook: the referee walks in"),
 (19, 12, 0.0, "blip", "the ombudsman", "lifts a marigold loupe toward the case, Bub hides its labels behind its tail, and the loupe settles on a sale terms sheet instead", "careful", "REVIEWS THE SALE · RECOMMENDS SAFEGUARDS", "Bub peeks out", "rehook: the loupe drifts toward Bub"),
 (20, 13, 0.0, "step", "a faceless figure tagged CORI MILLS at a lectern by a rain window over Juneau", "steps up as a quote plate drops onto the lectern front", "firm", "\"SOLD TO THE HIGHEST BIDDER\" · CORI MILLS", "the plate settles", "rehook: the Acting Attorney General's quote drops onto the lectern"),
 (21, 14, 0.0, "scrape", "a brass slide bolt on the case stamped VOLUNTARY", "is nudged back a notch by the edge of a bidder's paddle", "uneasy", "VOLUNTARY · \"COULD BE ... REVERSED BY A FUTURE BUYER\"", "the bolt slides", "rehook: a paddle nudges the VOLUNTARY bolt"),
 (22, 15, 0.0, "flutter", "a claret velvet curtain", "sweeps across and opens on a high walnut bench in a courtroom", "even", "THE OTHER SIDE", "the curtain sways", "rehook: the curtain opens on the other side"),
 (23, 16, 0.0, "clip", "a framed company notice", "is set on an easel before the bench and swings once", "calm", "\"CONTINUES TO BE PROTECTED\" · THE COMPANY", "the frame swings", ""),
 (24, 17, 0.0, "page", "a declaration sheet", "slides onto a second easel showing a long column of costs and an empty profit line", "tired", "LEGAL COSTS · NO PROFIT · PER THE CEO", "the sheet settles", ""),
 (25, 18, 0.0, "press", "a faceless figure tagged JUDGE at the bench", "sets a bound rule book down flat beside a stack of state objection letters", "neutral", "AUCTION RULES APPROVED · OVER STATE OBJECTIONS", "the book lands", ""),
 (26, 19, 0.0, "tap", "the ombudsman", "walks to the bench and holds a brass key up to it", "patient", "CAN'T BLOCK THE SALE", "the key glints", ""),
 (27, 19, W("decides"), "tick", "the brass key", "rests in the judge's open hand and nobody turns it", "open", "ADVISES · THE JUDGE DECIDES", "the hand stays open", "rehook: the key rests unturned in the judge's hand"),
 (28, 20, 0.0, "creak", "a dusty archive drawer stenciled 2015", "slides open and a paper receipt rises out of it", "curious", "2015 · RADIOSHACK · FTC STEPPED IN", "the receipt rises", "rehook: a 2015 drawer slides open on RadioShack"),
 (29, 20, W("promised"), "flip", "the receipt", "unfolds to show a mailing list held back behind a ruled promise line", "plain", "\"PROMISES NOT TO SELL\" · FTC, 2015", "the list stays back", "rehook: the 2015 receipt unfolds"),
 (30, 21, 0.0, "swing", "the velvet curtain", "splits the stage, Disney's crate spotlit on one side and Bub's case on the other with the ombudsman beside it", "resolved", "REVIEW OF THE SALE · PRIVATE CHATS", "the spotlights split", ""),
 (31, 21, W("didn't"), "bloom", "the blank marigold folder from the referee's chair", "unfolds in the ombudsman's hands and dashed latches project onto the case", "hopeful", "SAFEGUARDS · RECOMMENDED TO THE COURT", "the latches glow dashed", ""),
 (32, 22, 0.0, "bell", "a placard on the bench in the window's reflection", "turns to face the hall", "open", "SALE HEARING · DECEMBER 3RD AND 4TH", "the placard settles", ""),
 (33, 22, W("safeguards"), "ping", "Bub", "lets its ellipsis flicker into a question mark as the paddle's shadow crosses the glass again", "wondering", "WHICH SAFEGUARDS?", "the question mark flickers", ""),
]

PLATE_AT = {b[0]: "upper-third" for b in B}
CLAIM_MAP = {1: ["c5"], 2: ["c5"], 3: ["c1"], 4: ["c2"], 5: ["c3"], 6: ["c6"], 7: ["c6"], 8: ["c7"], 9: ["c8"], 10: ["c6", "c8"],
             11: ["c11"], 12: ["c9"], 13: ["narration"], 14: ["c12"], 15: ["c12"], 16: ["c17"], 17: ["c17"], 18: ["c13"], 19: ["c14"],
             20: ["c18"], 21: ["c20"], 22: ["narration"], 23: ["c21"], 24: ["c4"], 25: ["c22"], 26: ["c16"], 27: ["c16"], 28: ["c24"],
             29: ["c24"], 30: ["c14"], 31: ["c14", "c16"], 32: ["c23"], 33: ["c14"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "low", "auction-hall", "macro-closeup", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "", "", "This is for sale", "In a Juneau auction hall at dusk a frosted glass case turns into a brass spotlight, Bub jolts awake inside as a paddle snaps up and its shadow crosses the glass, a keyhole with no key"),
 (2, 1, "data-panel", "close", "eye", "app-screen", "instrument-screen", "single-object-void", "assemble-build", "data-as-subject", "push-in", "build", "The app", "Bub hops onto a giant phone screen of little character chats until a court notice and a CHAPTER 11 tab slide across and the screen tips back into the case"),
 (3, 3, "two-up", "wide", "high", "auction-hall", "eye-level-immersive", "fullbleed-split", "vertical-descent", "structure-as-subject", "pull-out", "carry", "Two lots", "From high in the gallery, a gear crate in a LICENSE sleeve takes the Lot 1 pedestal under Disney's paddle and a glass pane drops between it and Bub's case"),
 (4, 5, "push-detail", "medium", "low", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "vertical-rise", "instrument-as-subject", "hard-cut", "build", "Lot 2", "From low by the plinth, a second paddle in a PER PPC LAND sash rises over the case and a brass scale refuses to weigh the two paddles"),
 (5, 6, "macro-closeup", "insert", "eye", "glass-macro", "macro-closeup", "stacked-layers", "vertical-rise", "multiplicity-swarm", "push-in", "build", "What's inside", "Pressed against the frosted glass, labels surface and a stack of tiny bubbles climbs past the window line"),
 (6, 8, "wide-establish", "extreme-wide", "high", "juneau-window", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "landscape-as-subject", "pull-out", "travel", "Who's watching", "The spotlight narrows to the case and an empty referee's chair, then the camera crosses the dark hall to a tall rain window over Mount Juneau where a Raven watches a Department of Law envelope slide in"),
 (7, 10, "data-panel", "close", "eye", "lock-cutaway", "cross-section-cutaway", "single-object-void", "push-in-only", "instrument-as-subject", "push-in", "build", "The lock", "The camera pushes into the case's keyhole and the brass lock opens into a cross section of three tumblers marked JUDGE · OMBUDSMAN · HEARING"),
 (8, 11, "subject-portrait", "medium", "low", "auction-hall", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "pull-out", "carry", "The referee", "A tall faceless figure in a marigold armband walks in, stops beside the empty chair facing the bench, and aims a loupe that settles on the sale terms"),
 (9, 13, "alt-vantage", "close", "eye", "juneau-office", "eye-level-immersive", "fullbleed-split", "push-in-only", "instrument-as-subject", "hard-cut", "match", "The voluntary bolt", "A faceless figure tagged CORI MILLS at a lectern by a Juneau rain window, then a VOLUNTARY slide bolt on the case nudged by a paddle's edge"),
 (10, 15, "wide-establish", "wide", "low", "courtroom", "eye-level-immersive", "grid-modular", "assemble-build", "structure-as-subject", "mask-wipe", "build", "The other side", "A velvet curtain sweeps open on a high walnut bench where the company's notice and the CEO's declaration go up on easels, lit flat and fair"),
 (11, 18, "alt-vantage", "medium", "ground", "courtroom", "eye-level-immersive", "centered-hero-lowerthird", "vertical-rise", "single-organic-hero", "hard-cut", "build", "The key", "From the floor looking up at the bench, the judge sets down the rule book and the ombudsman hands up a brass key that rests unturned in an open hand"),
 (12, 20, "push-detail", "insert", "high", "archive", "top-down-map", "single-object-void", "horizontal-traverse", "instrument-as-subject", "hard-cut", "travel", "2015", "From above, a dusty drawer stenciled 2015 slides open and a RadioShack receipt unfolds behind a ruled promise line"),
 (13, 21, "subject-portrait", "wide", "eye", "auction-hall", "macro-closeup", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "match-action", "match", "Back on the turntable", "The curtain splits the stage, the referee's folder unfolds into dashed latches on the case, the hearing placard turns and the paddle's shadow crosses the glass again"),
]

AMBIENT = {1: "rain on tall windows, a hall hush", 2: "a soft device hum", 3: "a hall hush, the hand truck's wheels", 4: "a hall hush, brass creak",
           5: "a glass ring, faint rain", 6: "rain on the window, wind", 7: "a brass mechanism tick", 8: "a hall hush, footsteps",
           9: "rain on the window, a room hush", 10: "a courtroom hush", 11: "a courtroom hush", 12: "an archive room hush, paper", 13: "rain on tall windows, a hall hush"}
CENTER = {1: "the case at x540 y980", 2: "the screen at x540 y960", 3: "the pane at x540 y980", 4: "the paddle at x560 y900", 5: "the glass at x540 y960",
          6: "the window at x540 y940", 7: "the tumblers at x540 y980", 8: "the ombudsman at x600 y1000", 9: "the bolt at x540 y980", 10: "the bench at x540 y940",
          11: "the key at x540 y960", 12: "the drawer at x540 y1000", 13: "the case at x540 y980"}
HERO = {
 1: ("frosted glass case + Bub + turntable + spotlight + paddle + keyhole + rain window", "45% case and Bub, 30% spotlight and paddle, 25% hall"),
 2: ("giant phone screen + Bub + character chat bubbles + court notice + CHAPTER 11 tab", "50% screen, 30% Bub, 20% notice"),
 3: ("pedestals + gear crate in LICENSE sleeve + Disney paddle + glass pane + Bub's case", "40% crate and paddle, 35% pane, 25% case"),
 4: ("PER PPC LAND paddle + sash + Bub's case + two-pan scale", "40% paddle, 35% case, 25% scale"),
 5: ("frosted glass macro + labels + stack of tiny bubbles + window line", "45% glass and labels, 35% stack, 20% window"),
 6: ("dark hall + spotlit case + empty referee chair + folder + rain window + Mount Juneau + channel + Raven + envelope", "35% window and range, 35% case and chair, 30% hall"),
 7: ("brass lock cross section + three tumblers + bolt + keyhole ring", "60% tumblers, 25% bolt, 15% ring"),
 8: ("ombudsman + marigold armband + loupe + empty chair + case + sale terms sheet", "40% referee, 35% case, 25% chair and sheet"),
 9: ("Mills figure + lectern + Juneau rain window + VOLUNTARY bolt + paddle edge", "40% bolt, 35% figure, 25% window"),
 10: ("curtain + walnut bench + easel + framed notice + declaration sheet", "40% bench, 35% easels, 25% curtain"),
 11: ("bench + judge's open hand + brass key + rule book + objection letters + ombudsman", "40% key and hand, 35% bench, 25% figures"),
 12: ("archive drawer + 2015 stencil + receipt + promise line + mailing list", "50% drawer, 35% receipt, 15% cabinet"),
 13: ("curtain + Disney crate + case + Bub + dashed latches + ombudsman + placard + paddle shadow", "40% case and latches, 30% referee, 30% crate and curtain"),
}
PARTS = {1: 54, 2: 44, 3: 52, 4: 46, 5: 42, 6: 56, 7: 48, 8: 46, 9: 44, 10: 50, 11: 46, 12: 40, 13: 56}
KICKS = (1, 16, 30)
CAMERA = {1: "dollyThrough", 2: "dollyThrough", 3: "craneDown", 4: "riseWith", 5: "riseWith", 6: "truckAcross", 7: "dollyThrough",
          8: "truckAcross", 9: "dollyThrough", 10: "craneDown", 11: "riseWith", 12: "truckAcross", 13: "dollyThrough"}

PALETTE = ("steel violet Juneau dusk #5B6C8F over wet slate cloud #8FA0B8 and the Gastineau Channel #3D5566, "
           "honey timber hall #B9824A with walnut #6B3F2A, claret velvet #7A1F35, gilt bronze #C99A3A, "
           "warm cream bubble #FFF4E0 in frosted glass #DCE8EE, aubergine corners #2B1B2E, "
           "referee marigold #F2B632 reserved for the ombudsman and the safeguards")


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
                    "Drawn as Bub, a faced cream speech bubble in a frosted glass case on an auction turntable in a Juneau hall, Lot 2, with a referee in a marigold armband and a lock whose tumblers are the law."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "macro-closeup", "motion_vector": "horizontal-traverse", "hero_treatment": "single-organic-hero", "layout": "centered-hero-lowerthird",
                        "register": "tactile-collage", "palette": PALETTE, "camera_strategy": "orbit-reveal",
                        "light_story": "a warm brass spotlight on a turning case in a dusk hall, the steel violet rain window taking over as Alaska enters, a flat fair bench light for the company's case, and marigold latches the warmest thing in the last frame",
                        "metaphor": "an auction where the chats are their own lot in a frosted case, the law is a lock with three tumblers, and the referee's folder becomes dashed safeguards no one has fastened yet"},
        "signature_shot": 7,
        "palette": PALETTE,
        "divergence_note": ("The last films were persimmon daylight over the Anchorage apron and a cork evidence board with red strings and a faced paper route card (11-19), a mint afterglow over lilac snow with a faced chalk-line reel in Fairbanks ice fog (11-18), "
                            "polar night with a troupe of faced decision trees (11-16) and a rain-black Juneau night at one gunmetal letterbox (11-15). "
                            "This film is a timber and claret velvet auction interior against a steel violet rain window, its hero a soft cream speech bubble in a frosted case on a turntable, its signal colour a marigold reserved for the referee, "
                            "and its mechanism a brass lock cutaway. Honest overlaps: it is the fourth faced inanimate mascot in a row, varied by being round and soft, behind glass, and passive while people act around it; "
                            "11-15 was also in Juneau and also in rain, answered here by an interior hall at dusk, warm light and the window only as a view; 11-19 also had a raven, kept to the sill and one beat."),
        "treatment": {"title": "Lot 2", "summary": ad["treatment"],
                      "judge_reasoning": json.loads((OUT / "treatment.json").read_text())["reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "Low and close on a frosted glass case turning into a brass spotlight in a timber hall, Bub asleep inside, and at 0.3 s a square auction paddle snaps up into the light and its shadow sweeps across the glass",
                 "headline": "AN AI CHAT APP · AT AUCTION", "motion_by_s": 0.3,
                 "loopback": "Frame 1 is the case in the spotlight with the paddle's shadow crossing it; the last image is the same case on the same turntable with dashed marigold latches projected on it, the referee beside it, and the paddle's shadow crossing the glass again as Bub's ellipsis flickers into a question mark."},
        "open_loop": {"plant_t": b_at(2), "pay_t": b_at(27), "plant_glow_s": 0.4, "plant_sfx": "whoosh", "what": "Who holds the key? Planted as a round brass keyhole glinting on the case with no key anywhere on the plinth, kept in view on every turntable shot and opened in the lock cutaway, paid when the ombudsman hands a brass key up to the bench and it rests unturned in the judge's open hand."},
        "open_loop_2": {"plant_t": b_at(13), "pay_t": b_at(31), "what": "What's in the blank folder? Planted as an empty tall referee's chair beside the case with a blank marigold folder on its seat when the narration asks who's watching, kept beside the case when the referee arrives, paid when the folder unfolds into dashed safeguard latches projected onto the case."},
        "throughline": {"object": "the frosted glass case and its lock", "lands_in_button": "the case on the turntable with dashed marigold latches projected on it, recommended and not fastened",
                        "states": [
                            {"at_s": b_at(1), "state": "T1 sealed and turning in the spotlight, a keyhole with no key"},
                            {"at_s": b_at(8), "state": "T2 divided from Lot 1 by a dropped glass pane"},
                            {"at_s": b_at(11), "state": "T3 frosted labels surfacing on its glass"},
                            {"at_s": b_at(16), "state": "T4 its lock opened into a cross section of three tumblers"},
                            {"at_s": b_at(21), "state": "T5 its VOLUNTARY bolt nudged back by a paddle"},
                            {"at_s": b_at(27), "state": "T6 its key held up to the bench, resting unturned in the judge's open hand"},
                            {"at_s": b_at(31), "state": "T7 dashed marigold latches projected onto it, not fastened"}]},
        "reveals": [
            {"t": b_at(3), "type": "build-on", "what": "the case becomes a giant phone screen of character chats", "hold_s": 0.6},
            {"t": b_at(12), "type": "scale-pullback", "what": "a stack of tiny bubbles climbs past the window line", "hold_s": 0.8},
            {"t": b_at(16), "type": "build-on", "what": "the lock opens into a cross section of three tumblers", "hold_s": 0.8},
            {"t": b_at(22), "type": "scale-pullback", "what": "the curtain sweeps open on the whole courtroom bench", "hold_s": 0.6},
            {"t": b_at(30), "type": "scale-pullback", "what": "the curtain splits the whole stage into the two lots", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.8}, {"line": 3, "offset": 0.0, "level": 1.2}, {"line": 8, "offset": 0.0, "level": 0.5},
            {"line": 10, "offset": 0.0, "level": 1.4}, {"line": 15, "offset": 0.0, "level": 0.6}, {"line": 20, "offset": 0.0, "level": 1.2},
            {"at_s": round(b_at(30) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(30) + 0.5, 3), "level": 1.4},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "rain",
            "build_steps": 4, "dip_at": round(b_at(30) - 0.5, 3), "riser_at": round(b_at(16), 3), "silence_at": round(b_at(30) - 0.5, 3),
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
