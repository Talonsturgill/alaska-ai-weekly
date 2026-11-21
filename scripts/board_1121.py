#!/usr/bin/env python3
"""2026-11-21 "Lot 1, Your Chats": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1121.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1121.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
SB = "Scrollback, a chat history drawn as an accordion of rounded chat bubbles with a worried face on its pale mint top bubble and a scarf of older messages"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "pop", SB, "pops up out of a glowing phone on a night kitchen table under a snowy Chugach window and wobbles to a stop", "startled", "AN AI APP'S CHATS", "the stack wobbles", ""),
 (2, 0, 0.2, "thunk", "a blank mustard lot tag on a string", "drops and THUNKs onto Scrollback's foot as the stack squashes", "startled", "IN AN AUCTION LOT", "the stack squashes", ""),
 (3, 0, W("auction"), "creak", "a moose outside the window", "leans in, fogs the glass and squints at the blank tag", "wary", "PLANNED AUCTION", "the glass fogs", ""),
 (4, 1, 0.0, "click", "a flat chat window on the phone screen", "fills the frame as user and AI bubbles pop in turn beside the lot tag swinging from the phone's corner", "curious", "CHARACTER.AI · CHAT WITH AI CHARACTERS", "the bubbles pop", ""),
 (5, 1, W("characters"), "bloop", "an AI-side bubble", "pops in wearing a tiny character mask and bounces", "curious", "AI CHARACTER", "the bubble bounces", ""),
 (6, 1, W("therapists"), "ding", "one AI bubble", "catches a THERAPIST? badge that drops onto it as the window's bubbles swell out of the glass", "wary", "CHATBOTS POSING AS THERAPISTS · PER ATTORNEYS GENERAL", "the bubbles bulge", ""),
 (7, 2, 0.0, "cascade", "Scrollback's scarf of older messages", "unspools across the table and each rounded bubble squares off into a stencilled crate as it lands", "worried", "PRIVATE CHATS · VOICE CALLS · MENTAL HEALTH", "the crates land", ""),
 (8, 2, W("voice"), "hit", "the VOICE CALLS bubble", "squares off mid-air and lands on the table with a hit", "worried", "VOICE CALLS", "the crate lands", ""),
 (9, 2, W("train"), "whirr", "one crate", "drops onto a fat arrow conveyor and slides into a faceless MODEL hopper that swallows it and hums", "uneasy", "USED TO TRAIN ITS AI · PER THE AGS", "the hopper hums", ""),
 (10, 3, 0.0, "thud", "the chat app icon", "keels over onto a pile of paper bills on the map table", "dizzy", "BANKRUPT · OCTOBER 12TH", "the bills puff", ""),
 (11, 3, W("legal"), "flutter", "the bills", "flutter up stamped LEGAL COSTS and LOSSES as the icon lies flat", "glum", "LEGAL COSTS · LOSSES", "the bills flutter", ""),
 (12, 4, 0.0, "whoosh", "a dashed map line", "runs from the Alaska kitchen pin across a painted map to a tiny Delaware courtroom while the crates ride it, the lead crate wearing the lot tag", "uneasy", "COULD TRANSFER TO A NEW OWNER", "the crates ride", ""),
 (13, 4, W("December"), "pin", "the courtroom pin", "pops up with a DEC 1ST flag as the crates arrive", "tense", "AUCTION · DECEMBER 1ST", "the pin pops", ""),
 (14, 5, 0.0, "ching", "a mustard starburst", "slams onto the lot tag as the crates stack on an auction platform", "shocked", "$10M STARTING BID · APP · MODELS · ACCOUNTS · CHATS", "Scrollback ducks behind a crate", "rehook: the starting bid slams onto the lot tag and Scrollback ducks"),
 (15, 5, W("models"), "heavy", "a steel MODELS box", "drops onto the auction platform beside the crates", "glum", "MODELS", "the platform jolts", ""),
 (16, 5, W("chat"), "clunk", "the last crate", "clunks onto the platform as a spotlight snaps on over two bidder stands at the back, one name card blank", "glum", "ACCOUNTS · CHAT CONTENT", "the spotlight snaps on", ""),
 (17, 6, 0.0, "step", "a plain grey crate carrying a gear", "walks past the chat crates at an ordinary pace and steps up to the stand whose card reads DISNEY", "neutral", "DISNEY · $20M · TECH LICENSE · NOT THE CHATS", "the grey crate steps up", ""),
 (18, 6, W("Not"), "stamp", "a NOT THE CHATS stamp", "thuds onto the grey crate's side", "dry", "NOT THE CHATS", "the stamp lands", ""),
 (19, 7, 0.0, "swish", "Alaska's navy flag with eight gold dots", "snaps up on the desk at the front of a long row of attorneys general desks", "proud", "ALASKA JOINED · BIPARTISAN AG COALITION", "the flag snaps up", ""),
 (20, 8, 0.0, "ring", "New York's desk lamp", "switches on first and 39 more lamps follow in a wave down the row", "busy", "NEW YORK LED · 39 OTHER ATTORNEYS GENERAL", "the lamps wave on", ""),
 (21, 9, 0.0, "rush", "the lamps' light", "runs down the row and out the hall doors as one beam", "busy", "PER ALASKA'S DEPARTMENT OF LAW", "the beam runs", ""),
 (22, 9, W("court"), "slam", "a walnut gavel", "strikes the bench as the beam lands on it and a COURT ORDERS card slides out", "firm", "COURT ORDERS A PRIVACY OMBUDSMAN", "the card slides", ""),
 (23, 9, W("ombudsman"), "clank", "an empty brass two-pan scale", "is set down on the bench by a faceless clerk's hand, its pans swinging empty", "careful", "PRIVACY OMBUDSMAN · AT THE COALITION'S URGING", "the pans swing", ""),
 (24, 10, 0.0, "footstep", "a faceless figure with a binder", "walks up to the bench and pins a badge on her own lapel", "steady", "NAMED BY THE U.S. TRUSTEE", "the badge pins", ""),
 (25, 10, W("Thomson"), "tap", "her boxed name tag", "swings out from the binder's edge", "steady", "LUCY L. THOMSON · DATA PRIVACY EXPERT", "the tag swings", ""),
 (26, 11, 0.0, "swing", "the faceless figure", "opens her binder beside the empty scale as its pans swing", "careful", "REVIEWS THE SALE · RECOMMENDS SAFEGUARDS", "the pans swing", ""),
 (27, 11, W("safeguards"), "press", "a round privacy seal reading SAFEGUARDS?", "is pressed by her hand onto the lot tag beside the $10M", "careful", "RECOMMENDS SAFEGUARDS TO THE COURT", "the seal presses", ""),
 (28, 12, 0.0, "swoosh", "the camera", "slides along the two bidder stands past DISNEY to the blank name card as a spotlight snaps onto it", "curious", "WHO MADE THE $10M BID?", "the spotlight snaps", "rehook: the spotlight snaps onto the one blank name card"),
 (29, 12, W("formed"), "flip", "the lot tag", "swings and flips over to a new face", "curious", "FORMED NOV 13TH · BID FILED NOV 14TH", "the tag flips", ""),
 (30, 13, 0.0, "fold", "Scrollback", "yanks its scarf back inside its accordion and snaps shut while the name card stays blank", "wary", "BACKER NOT PUBLIC", "the scarf tucks in", ""),
 (31, 14, 0.0, "roll", "a faceless company lawyer", "pulls the privacy policy open with both hands and it rolls down the aisle like a long paper runway", "confident", "THE COMPANY'S SIDE", "the runway unrolls", ""),
 (32, 14, W("court"), "stamp", "a TOLD THE COURT filing stamp", "thunks onto the rolling runway", "confident", "TOLD THE COURT · PER THE COMPANY", "the stamp thunks", ""),
 (33, 14, W("allowed"), "thock", "the lawyer's finger", "taps a highlighted clause and the camera follows it down the runway to the company's court filing, a sheet with a big quote mark", "confident", "\"POLICY ALREADY PERMITTED THE SALE\" · PER THE COMPANY", "the box rocks", ""),
 (34, 15, 0.0, "rattle", "a sticky note on a chat crate's lid", "lifts at one corner and settles back as the crate shakes", "uneasy", "ALASKA'S SIDE · ALASKA ARGUES", "the note flutters", ""),
 (46, 15, W("voluntary"), "flap", "the sticky note on the crate lid", "lifts at its corner and flaps back down", "uneasy", "LIMITS ON MINORS · VOLUNTARY", "the corner flaps", ""),
 (35, 15, W("future"), "tear", "a dashed outline of the note", "tears away from the lid in dashed outline only, while the real note stays", "uneasy", "A FUTURE BUYER COULD REVERSE THEM", "the outline peels", ""),
 (36, 16, W("policy"), "thump", "a rolled POLICY weight", "is set into one pan of the brass scale by the faceless figure's own hand", "thoughtful", "PRIVACY POLICY", "the pan dips", ""),
 (37, 16, W("lose"), "clink", "two weights tagged LOSSES? and GAINS?", "are set into the pans by her hand one at a time and the beam bobs, never settling", "thoughtful", "WHAT USERS COULD LOSE OR GAIN", "the beam bobs", "rehook: she sets LOSSES? and GAINS? in the pans and the beam won't settle"),
 (38, 16, W("alternatives"), "scrape", "a third weight tagged ALTERNATIVES?", "slides onto the scale's base and she presses her pen to the binder", "thoughtful", "ALTERNATIVES", "the pen scratches", ""),
 (39, 16, W("decide"), "slide", "her closed binder with a blank cover", "slides into the court's brass tray at the bench foot and she steps back, hands at her sides", "steady", "SHE DOESN'T DECIDE THE SALE", "the binder slides in", ""),
 (40, 17, 0.0, "creak", "a walnut gavel twice the scale's size", "descends into frame and stops high above the bench, never touching it, as the camera pulls back and the binder in the tray looks small", "weighty", "COURT APPROVAL · AFTER A HEARING", "the gavel descends", ""),
 (41, 18, 0.0, "chime", "two plates on the snowy kitchen window", "hang beside Scrollback and the phone after a hard cut matched on the lot tag", "plain", "THE OMBUDSMAN ADVISES", "the plates settle", ""),
 (42, 18, W("decides"), "flip", "the lot tag on Scrollback's foot", "flips to COURT DECIDES over an empty signature line", "plain", "COURT DECIDES", "the tag flips", ""),
 (44, 7, W("coalition"), "snap", "a row of desk flags", "snap up one after another behind Alaska's", "proud", "BIPARTISAN", "the flags snap", ""),
 (45, 16, 0.0, "pop", "the faceless figure", "lifts a rolled POLICY weight out of her binder", "thoughtful", "BY LAW", "the weight lifts", ""),
 (43, 18, W("money"), "swing", "the phone beside Scrollback", "lights up with a $10M bid card whose name line is blank as Scrollback swings round to it, then the camera rises out the window toward the moonlit Chugach", "wistful", "THE MONEY BEHIND THE BID · NOT PUBLIC SO FAR", "the camera rises", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 50)}
PLATE_AT.update({1: "lower-third", 22: "lower-third", 41: "lower-third"})
CLAIM_MAP = {1: ["c10"], 2: ["c10", "c9"], 3: ["c9"], 4: ["c2"], 5: ["c2"], 6: ["c3", "c14"], 7: ["c6"], 8: ["c6"], 9: ["c7"], 10: ["c1"],
             11: ["c24"], 12: ["c8"], 13: ["c9"], 14: ["c10"], 15: ["c10"], 16: ["c10"], 17: ["c12"], 18: ["c12"], 19: ["c13"], 20: ["c14"],
             21: ["c15"], 22: ["c15"], 23: ["c15"], 24: ["c19"], 25: ["c19"], 26: ["c16"], 27: ["c16"], 28: ["narration"], 29: ["c11"], 30: ["c11"],
             31: ["c25"], 32: ["c25"], 33: ["c25"], 34: ["c22"], 35: ["c22"], 36: ["c18"], 37: ["c18"], 38: ["c18"], 39: ["c17"], 40: ["c26"],
             41: ["c17"], 42: ["c17"], 43: ["c11"], 44: ["c13"], 45: ["c18"], 46: ["c22"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "eye", "kitchen-table", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "", "The pop", "On an Anchorage kitchen table at night under a snowy Chugach window, Scrollback pops out of a phone, a blank mustard lot tag THUNKs onto its foot and a moose squints in"),
 (2, 1, "macro-closeup", "insert", "eye", "phone-screen", "instrument-screen", "hud-instrument-frame", "scroll-data", "data-as-subject", "push-in", "build", "Inside the phone", "Inside the phone, a flat chat window where user and AI bubbles pop in turn, one AI bubble in a mask and one with a THERAPIST? badge, bulging out of the glass"),
 (3, 2, "data-panel", "medium", "eye", "kitchen-cutaway", "exploded-diagram", "stacked-layers", "assemble-build", "multiplicity-swarm", "morph", "build", "Bubbles into crates", "The bubbles extrude into Scrollback's scarf, which unspools into crates, one riding a conveyor into a MODEL hopper, the lot tag on the lead crate"),
 (4, 3, "map-territory", "wide", "high", "map-table", "top-down-map", "map-territory", "horizontal-traverse", "landscape-as-subject", "map-travel", "travel", "Kitchen to Delaware", "From above, the app icon faints onto LEGAL COSTS bills, then a dashed line carries the tagged crates from Alaska to a tiny Delaware courtroom"),
 (5, 5, "wide-establish", "extreme-wide", "high", "auction-floor", "orbital-aerial", "grid-modular", "vertical-descent", "instrument-as-subject", "carried-element", "carry", "The lot", "From above the auction floor, the starting bid slams onto the lot tag, a spotlight finds two bidder stands, and Disney's grey crate steps up to its own stand with a tech license"),
 (6, 7, "alt-vantage", "extreme-wide", "high", "ag-hall", "orbital-aerial", "stacked-layers", "radial-emanate", "multiplicity-swarm", "hard-cut", "build", "Forty desks", "Alaska's flag snaps up at the front of a long row of attorneys general desks, New York's lamp lights and 39 follow, and the light runs out the doors"),
 (7, 9, "push-detail", "close", "low", "court-bench", "eye-level-immersive", "centered-hero-lowerthird", "vertical-descent", "structure-as-subject", "carried-element", "carry", "The order", "The beam lands on the walnut bench, a gavel strikes, a COURT ORDERS card slides out and a clerk's hand sets an empty brass scale down"),
 (8, 10, "two-up", "medium", "eye", "court-bench", "macro-closeup", "single-object-void", "push-in-only", "instrument-as-subject", "match-action", "carry", "Named by the trustee", "A faceless ombudsman pins on her badge, her name tag swings out, and she opens her binder at the empty scale and seals the lot tag"),
 (9, 12, "push-detail", "close", "eye", "bidder-stands", "macro-closeup", "fullbleed-split", "horizontal-traverse", "instrument-as-subject", "push-in", "build", "The blank card", "The camera slides along the two bidder stands to the blank name card, the lot tag flips to its formation dates and Scrollback snaps shut"),
 (10, 14, "wide-establish", "wide", "low", "court-aisle", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "structure-as-subject", "graphic-match", "match", "The fine print", "A faceless company lawyer unrolls the policy down the aisle with both hands, a TOLD THE COURT stamp lands, and the camera follows a highlighted clause to the company's quoted court filing"),
 (11, 15, "push-detail", "close", "eye", "court-table", "exploded-diagram", "single-object-void", "vertical-rise", "instrument-as-subject", "match-cut", "match", "The sticky note", "A sticky note on a chat crate lid lifts and a dashed outline shows it could tear off, per Alaska's Department of Law"),
 (12, 16, "subject-portrait", "medium", "low", "court-bench", "eye-level-immersive", "fullbleed-split", "vertical-descent", "structure-as-subject", "carried-element", "carry", "Advises", "She sets each weight into the scale herself, the beam bobbing, slides her blank-covered binder into the court's tray, and a gavel twice the scale's size descends above"),
 (13, 18, "wide-establish", "wide", "eye", "kitchen-window", "orbital-aerial", "fullbleed-split", "vertical-rise", "landscape-as-subject", "graphic-match", "match", "Back to the kitchen", "A hard cut matched on the lot tag to the moonlit kitchen, the tag flips to COURT DECIDES over an empty signature line, and the camera rises out the window to the Chugach"),
]

AMBIENT = {1: "a fridge hum, wind at the window", 2: "a soft phone buzz, typing taps", 3: "paper and a low machine hum", 4: "a soft room tone, paper", 5: "a big room murmur",
           6: "a long hall murmur, lamp clicks", 7: "a hall murmur, then a courtroom hush and a clock", 8: "a courtroom hush", 9: "a courtroom hush, a spotlight buzz", 10: "a courtroom hush, paper",
           11: "a courtroom hush", 12: "a courtroom hush, a clock", 13: "a fridge hum, wind at the window"}
CENTER = {1: "Scrollback and the lot tag at x540 y1100", 2: "the chat window at x540 y960", 3: "the crates and the lot tag at x540 y1040", 4: "the map line and the tagged crate at x540 y960",
          5: "the platform and the lot tag at x540 y1060", 6: "the desk row and a pinned lot tag at x540 y980", 7: "the gavel, the scale and the tagged crate at x560 y960",
          8: "the scale, the binder and the lot tag at x600 y1040", 9: "the blank name card and the lot tag at x540 y980", 10: "the runway, the box and the tagged crate at x560 y1080",
          11: "the sticky note and the lot tag at x540 y1000", 12: "the scale, the binder and the gavel at x560 y980", 13: "Scrollback, the lot tag and the window at x540 y960"}
HERO = {
 1: ("Scrollback + blank mustard lot tag + moose + glowing phone", "45% Scrollback and tag, 30% window and range, 25% table"),
 2: ("flat chat window + AI-side bubble + AI bubble + lot tag", "60% window, 25% badge, 15% tag"),
 3: ("scarf + crates + conveyor + MODEL hopper", "45% crates, 30% scarf, 25% hopper"),
 4: ("map line + courtroom pin + bills + chat app icon", "45% map line, 30% bills and icon, 25% courtroom"),
 5: ("starburst + lot tag + crates + platform + grey crate + bidder stands", "45% platform and crates, 30% starburst, 25% stands"),
 6: ("Alaska flag + desk lamp + desk flags", "55% desk row, 30% lamps, 15% flag"),
 7: ("lamps light + walnut gavel + brass scale", "40% gavel, 30% bench, 30% scale"),
 8: ("faceless figure + binder + name tag + privacy seal + lot tag", "40% figure, 30% scale, 30% tag"),
 9: ("bidder stands + blank name card + lot tag + Scrollback", "45% card, 35% stands, 20% tag"),
 10: ("company lawyer + runway + filing stamp + court filing", "45% runway, 30% box, 25% lawyer"),
 11: ("sticky note + chat crate + dashed outline", "50% note, 30% outline, 20% tag"),
 12: ("brass scale + weights + binder + walnut gavel", "40% scale, 35% gavel, 25% figure"),
 13: ("kitchen window plates + lot tag + phone", "40% window, 30% tag, 30% Scrollback"),
}
PARTS = {1: 52, 2: 44, 3: 50, 4: 48, 5: 52, 6: 56, 7: 46, 8: 50, 9: 42, 10: 46, 11: 40, 12: 54, 13: 50}
KICKS = (2, 22)
CAMERA = {1: "craneDown", 2: "dollyThrough", 3: "truckAcross", 4: "craneDown", 5: "craneDown", 6: "truckAcross", 7: "craneDown",
          8: "dollyThrough", 9: "truckAcross", 10: "truckAcross", 11: "riseWith", 12: "craneDown", 13: "riseWith"}

PALETTE_OLD = ("spruce-black night #13241E outside a #1F4D3A spruce window frame, the Chugach #5B6B7A frost slate with #DCE3EA snow faces, "
           "oiled birch-plank walls #B39A76 and a darker birch table #8C6A44 under a #FFE3A8 lamp pool, walnut bench #6E4A2E with #9C6F45 lit faces, "
           "a pale spruce-mint hero #CFE6DA with slate-tint #E6E8EE and warm #F6EEDD bubbles, oxblood velvet #6B2232, auction mustard #E0A526 held for the money")
PALETTE = ("lamp-lit birch boards #B39A76, a walnut bench #6E4A2E, a seafoam-pale talking stack #CFE6DA, theatre-red drapes #6B2232, "
           "auction mustard #E0A526 for the money, a moonlit range #5B6B7A")


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
    tr = (OUT / "treatment.md").read_text().splitlines()
    board = {
        "run_date": "2026-11-21", "slug": "lot-1-your-chats", "title": "Lot 1, Your Chats",
        "concept": ("Character.AI, an app where people talk with AI characters, filed for bankruptcy in October and plans to auction its assets on December 1st. Per the attorneys general it collects private chats, voice calls and mental health disclosures and uses them to train its AI, "
                    "and the data could pass to a new owner. A $10 million starting bid covers the app, its AI models, user accounts and chat content; Disney's $20 million is for a technology license, not the chats. "
                    "Alaska joined a bipartisan coalition of 40 attorneys general led by New York, and per Alaska's Department of Law the court ordered a consumer privacy ombudsman at the coalition's urging. The U.S. Trustee named Lucy Thomson. "
                    "She reviews the planned sale and recommends safeguards, weighing the policy, what users could lose or gain and alternatives. The $10 million bidder was formed the day before the filing that disclosed its bid and its backer isn't public. "
                    "The company says its policy already allowed the sale; Alaska argues the limits on minors are voluntary and a buyer could reverse them. The ombudsman advises and the court decides. "
                    "Drawn as Scrollback, a faced accordion of chat bubbles whose scarf of older messages squares off into crates on an auction platform, a lot tag that changes face, two bidder stands (DISNEY and a blank card), and an empty brass scale the ombudsman fills herself before handing her binder up to the court."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "orbital-aerial", "motion_vector": "vertical-descent", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "tactile-collage", "palette": PALETTE, "camera_strategy": "track-follow",
                        "light_story": "a moonlit night kitchen under a warm pendant lamp, a flat-lit map table, then a walnut courtroom in high warm window light that dims behind a warm-edged curtain, goes flat and even for the fair weighing, and narrows to one raking shaft at the verdict, then the moonlit kitchen again",
                        "metaphor": "a chat history becomes an auction lot: soft bubbles square off into crates on a platform, a tag changes face, and a privacy expert fills an empty scale and hands her binder up to the court"}, "signature_shot": 12,
        "palette": PALETTE,
        "divergence_note": ("The last films were a persimmon-daylight evidence board with a cream paper route card and fiber cyan (11-19), a mint afterglow over lilac snow with a chalk-line reel and ultramarine (11-18), polar night with faced decision trees and radar lime (11-16), and a rain-black Juneau letterbox (11-15). "
                            "This film is a spruce-black night kitchen and a walnut courtroom with one auction mustard, its hero a pale mint accordion of chat bubbles that unspools and squares off into crates. "
                            "Honest overlaps: a faced inanimate hero again (fourth in a row), varied by giving it business its predecessors never had (it unspools, re-stacks, hides its messages); 11-19 also staged an interior with a raven and a magnifier, both cut here; 11-15 also used a night interior, answered by a warm lamp kitchen and a daylit courtroom."),
        "treatment": {"title": "Lot 1, Your Chats", "summary": ad["treatment"], "judge_reasoning": tr[1] if len(tr) > 1 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "An Anchorage kitchen table at night under a snowy Chugach window, a phone glowing, and at 0.3 s a pale mint stack of chat bubbles with a face pops up out of the screen, then at about 1.0 s a mustard lot tag THUNKs onto its foot",
                 "headline": "AN AI APP'S CHATS · FOR AUCTION", "motion_by_s": 0.4,
                 "loopback": "Frame 1 is the phone on the night kitchen table with Scrollback popping out; the last shot is the same table after a hard cut, Scrollback beside the phone with its tag reading COURT DECIDES over an empty signature line, the phone lit with a $10M bid card whose name line is blank, then a rise out the same snowy window to the Chugach."},
        "open_loop": {"plant_t": b_at(2), "pay_t": b_at(42), "plant_glow_s": 0.4, "plant_sfx": "thunk", "what": "Who ends up with this lot? Planted when a BLANK mustard lot tag THUNKs onto Scrollback's foot, kept as the tag changes face ($10M, a SAFEGUARDS? seal, FORMED NOV 13TH · BID FILED NOV 14TH), paid when it flips to COURT DECIDES over an empty signature line back on the kitchen table."},
        "open_loop_2": {"plant_t": b_at(23), "pay_t": b_at(37), "what": "What goes in the empty scale? Planted when a clerk's hand sets an EMPTY brass scale on the bench as the ombudsman is ordered, kept in view as she opens her binder beside it, paid when she sets the POLICY, LOSSES? and GAINS? weights into the pans herself and the beam keeps bobbing, a weighing still in progress."},
        "throughline": {"object": "the mustard lot tag", "lands_in_button": "the tag reads COURT DECIDES over an empty signature line on Scrollback's foot back on the kitchen table",
                        "states": [
                            {"at_s": b_at(2), "state": "T1 BLANK, just THUNKed onto Scrollback's foot"},
                            {"at_s": b_at(14), "state": "T2 $10M under a starburst on the auction platform"},
                            {"at_s": b_at(27), "state": "T3 $10M with a round privacy seal reading SAFEGUARDS? pressed on"},
                            {"at_s": b_at(29), "state": "T4 FORMED NOV 13TH · BID FILED NOV 14TH beside the blank name card, carried forward as $10M BID · BACKER NOT PUBLIC on a peg away from every person"},
                            {"at_s": b_at(42), "state": "T5 COURT DECIDES over an empty signature line"}]},
        "reveals": [
            {"t": b_at(7), "type": "build-on", "what": "the scarf unspools and every bubble squares off into a crate", "hold_s": 0.6},
            {"t": b_at(12), "type": "scale-pullback", "what": "the camera rises over a painted map as a dashed line carries the crates from Alaska to Delaware", "hold_s": 0.8},
            {"t": b_at(20), "type": "scale-pullback", "what": "40 desk lamps wave on down a long row of attorneys general desks", "hold_s": 0.8},
            {"t": b_at(37), "type": "build-on", "what": "she sets the weights into the pans and the beam keeps bobbing", "hold_s": 0.6},
            {"t": b_at(40), "type": "scale-pullback", "what": "the camera pulls back as a gavel twice the scale's size descends and the binder in the tray looks small", "hold_s": 0.8},
            {"t": b_at(43), "type": "scale-pullback", "what": "the camera rises out the kitchen window to the moonlit range", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.9}, {"line": 3, "offset": 0.0, "level": 1.2}, {"line": 7, "offset": 0.0, "level": 0.8},
            {"line": 12, "offset": 0.0, "level": 1.4}, {"line": 14, "offset": 0.0, "level": 0.7}, {"line": 16, "offset": 0.0, "level": 1.2},
            {"at_s": round(b_at(41) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(41) + 0.5, 3), "level": 1.3},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(41) - 0.5, 3), "riser_at": round(b_at(28) - 1.0, 3), "silence_at": round(b_at(41) - 0.5, 3),
            "payoff_at": b_at(41), "button_pattern": "callback", "interrupt_at": b_at(28), "extra_dips": []},
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
    book.raise_if_missing("board_1121 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1121Ids.ts").write_text(
        "// GENERATED by scripts/board_1121.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
