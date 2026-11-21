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
 (1, 0, 0.0, "pop", SB, "pops up out of a glowing phone on a night kitchen table under a snowy Chugach window and wobbles to a stop", "startled", "AN AI APP'S CHATS · FOR AUCTION", "the stack wobbles", ""),
 (2, 0, W("auction"), "thunk", "a blank mustard lot tag on a string", "drops and THUNKs onto Scrollback's foot as the stack squashes", "startled", "AUCTION · DECEMBER 1ST", "the stack squashes", ""),
 (3, 1, 0.0, "click", "the phone's generic chat app icon", "pops open on the phone screen and Scrollback's bubbles snap on in two alternating voices, user side and AI side", "curious", "CHARACTER.AI · CHAT WITH AI CHARACTERS", "the bubbles light", ""),
 (4, 1, W("therapists"), "ding", "one AI-side bubble in Scrollback's stack", "pins on a little paper badge reading THERAPIST? and Scrollback's eyes slide to it", "wary", "CHATBOTS POSING AS THERAPISTS · PER ATTORNEYS GENERAL", "the eyes slide", ""),
 (5, 2, 0.0, "cascade", "Scrollback's scarf of older messages", "unspools across the table and each rounded bubble squares off into a stencilled pine crate as it lands", "worried", "PRIVATE CHATS · VOICE CALLS · MENTAL HEALTH", "the crates land", ""),
 (6, 2, W("train"), "whirr", "one crate", "drops onto a fat arrow conveyor and slides into a faceless MODEL hopper that swallows it and hums", "uneasy", "USED TO TRAIN ITS AI · PER THE AGS", "the hopper hums", ""),
 (7, 3, 0.0, "thud", "the chat app icon", "keels over onto a pile of paper bills on the table", "dizzy", "BANKRUPT · OCTOBER 12TH", "the bills puff", ""),
 (8, 3, W("legal"), "flutter", "the bills", "flutter up stamped LEGAL COSTS as the icon lies flat", "glum", "LEGAL COSTS · NO PROFIT", "the bills flutter", ""),
 (9, 4, 0.0, "whoosh", "a dashed map line", "runs from a pin on the Alaska kitchen across a painted map to a tiny Delaware courtroom while the crates ride it", "uneasy", "COULD TRANSFER TO A NEW OWNER", "the crates ride", ""),
 (10, 4, W("December"), "pin", "the courtroom pin", "pops up with a calendar flag as the crates arrive", "tense", "AUCTION · DECEMBER 1ST", "the pin pops", ""),
 (11, 5, 0.0, "ching", "a mustard starburst", "slams onto the lot tag as the crates stack on an auction platform beside a phone icon and a model box", "shocked", "$10M STARTING BID · APP · MODELS · ACCOUNTS · CHATS", "Scrollback ducks behind a crate", "rehook: the starting bid slams onto the lot tag and Scrollback ducks"),
 (12, 5, W("chat"), "clunk", "the last crate", "clunks onto the platform as a spotlight snaps on over an empty bidder's stand at the back with a blank name card", "glum", "ACCOUNTS · CHAT CONTENT", "the spotlight snaps on", ""),
 (13, 6, 0.0, "step", "a plain grey crate carrying a gear", "walks past the platform at an ordinary pace, its label facing camera", "neutral", "DISNEY · $20M · TECH LICENSE · NOT THE CHATS", "the grey crate passes", ""),
 (14, 6, W("Not"), "stamp", "a NOT THE CHATS stamp", "lands on the grey crate's side as it passes the chat crates", "dry", "NOT THE CHATS", "the stamp lands", ""),
 (15, 7, 0.0, "swish", "a row of small slate desks with plain flag rectangles", "lights up as the Alaska desk's navy flag with eight gold dots raises", "proud", "ALASKA JOINED · BIPARTISAN AG COALITION", "the flag raises", ""),
 (16, 8, 0.0, "ring", "40 desk lamps", "switch on in a wave from the New York desk down the long row", "busy", "40 ATTORNEYS GENERAL · NEW YORK LED", "the lamps wave on", ""),
 (17, 9, 0.0, "slam", "a walnut gavel", "strikes the bench and a COURT ORDERS card slides out", "firm", "COURT ORDERS A PRIVACY OMBUDSMAN", "the card slides", ""),
 (18, 10, 0.0, "footstep", "a faceless figure with a boxed name tag", "walks up to the bench carrying a report binder", "steady", "OMBUDSMAN · LUCY L. THOMSON", "she walks in", ""),
 (19, 10, W("expert"), "tap", "the faceless figure", "flips open her binder and a second tag swings out", "steady", "NAMED BY THE U.S. TRUSTEE", "the tag taps", ""),
 (20, 11, 0.0, "clank", "an empty brass two-pan scale", "is set down on the bench by her hand, its pans swinging empty", "careful", "REVIEWS THE SALE · RECOMMENDS SAFEGUARDS", "the pans swing", ""),
 (21, 11, W("safeguards"), "press", "a round privacy seal reading SAFEGUARDS?", "is pressed by her hand onto the lot tag beside the $10M", "careful", "RECOMMENDS SAFEGUARDS TO THE COURT", "the seal presses", ""),
 (22, 12, 0.0, "swoosh", "a warm-lit oxblood velvet curtain", "parts on a blank mustard bid paddle on a stand with a blank name card", "curious", "WHO MADE THE $10M BID?", "the curtain parts", "rehook: the curtain parts on a blank paddle with a blank name card"),
 (23, 12, W("formed"), "flip", "the lot tag", "swings and flips over to a new face", "curious", "FORMED NOV 13 · BID FILED NOV 14", "the tag flips", ""),
 (24, 13, 0.0, "hush", "Scrollback", "yanks its scarf back inside its accordion and snaps shut while the blank name card stays blank", "wary", "BACKER NOT PUBLIC", "the scarf tucks in", ""),
 (25, 14, 0.0, "roll", "a faceless company lawyer", "kicks the privacy policy open and it rolls down the aisle like a long paper runway", "confident", "THE COMPANY'S SIDE", "the runway unrolls", ""),
 (26, 14, W("allowed"), "thock", "the runway's end", "slams into a giant YES box that rocks back, no hand anywhere near it", "confident", "\"POLICY ALREADY PERMITTED THE SALE\" · PER THE COMPANY", "the box rocks", ""),
 (27, 15, 0.0, "slide", "a small latch on a chat crate tagged LIMITS ON MINORS", "rattles as a dashed ghost hand swoops in and hovers over it", "uneasy", "LIMITS ON MINORS · VOLUNTARY · COULD BE REVERSED", "the latch rattles", ""),
 (28, 16, 0.0, "thump", "two weights tagged LOSSES? and GAINS?", "drop into the brass scale's pans and it wobbles and settles level", "thoughtful", "PRIVACY POLICY · LOSSES OR GAINS · ALTERNATIVES", "the scale settles", "rehook: LOSSES? and GAINS? weights drop and the scale fights its way to level"),
 (29, 16, W("decide"), "slide", "the faceless figure's hand", "slides her report onto the bench beside the level scale as the lot tag flips to UNDER REVIEW", "steady", "THE OMBUDSMAN ADVISES", "the report slides", ""),
 (30, 17, 0.0, "creak", "a walnut gavel twice the scale's size", "lowers into view above the bench, out of her reach, in one raking shaft of light", "weighty", "SALE NEEDS COURT APPROVAL", "the gavel hovers", ""),
 (31, 18, 0.0, "chime", "two plates", "hang under the figure and under the gavel, ADVISES and DECIDES", "plain", "THE OMBUDSMAN ADVISES · THE COURT DECIDES", "the plates settle", ""),
 (32, 18, W("money"), "flip", "the lot tag", "flips to COURT DECIDES with an empty signature line beside the still blank paddle card", "plain", "COURT DECIDES", "the tag flips", ""),
 (33, 18, W("public"), "whoosh", "the camera", "pulls back out of the courtroom window, along the map line and through the snowy kitchen window to the phone on the table where Scrollback sits", "wistful", "BACKER NOT PUBLIC", "Scrollback settles on the table", ""),
 (34, 1, W("characters"), "bloop", "a second AI-side bubble", "pops onto Scrollback's stack wearing a tiny character mask and bounces", "curious", "AI CHARACTER", "the bubble bounces", ""),
 (35, 2, W("voice"), "hit", "the VOICE CALLS bubble", "squares off mid-air and lands on the table with a hit", "worried", "VOICE CALLS", "the crate lands", ""),
 (36, 5, W("models"), "heavy", "a steel MODELS box", "drops onto the auction platform beside the crates", "glum", "MODELS", "the platform jolts", ""),
 (37, 7, W("coalition"), "flap", "a long coalition banner", "unrolls down the row of desks and snaps taut", "proud", "BIPARTISAN", "the banner snaps", ""),
 (38, 9, W("ombudsman"), "clip", "the COURT ORDERS card", "slides into a brass tray and a clip snaps over it", "firm", "AT THE COALITION'S URGING", "the clip snaps", ""),
 (39, 14, W("court"), "rustle", "the policy runway", "rolls past the lawyer's shoes and keeps unrolling", "confident", "PRIVACY POLICY", "the paper rolls", ""),
 (40, 15, W("future"), "snap", "the dashed ghost hand", "flicks the latch open in dashed outline only, then the latch snaps back shut", "uneasy", "A FUTURE BUYER COULD REVERSE THEM", "the latch snaps back", ""),
 (41, 16, W("gain"), "scrape", "a third weight tagged ALTERNATIVES?", "slides onto the scale's base and the beam steadies", "thoughtful", "ALTERNATIVES", "the beam steadies", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 50)}
PLATE_AT.update({1: "lower-third", 17: "lower-third", 31: "lower-third"})
CLAIM_MAP = {1: ["c10", "c9"], 2: ["c9"], 3: ["c2"], 4: ["c3", "c14"], 5: ["c6"], 6: ["c7"], 7: ["c1"], 8: ["c24"], 9: ["c8"], 10: ["c9"],
             11: ["c10"], 12: ["c10"], 13: ["c12"], 14: ["c12"], 15: ["c13"], 16: ["c14"], 17: ["c15"], 18: ["c19"], 19: ["c19"], 20: ["c16"],
             21: ["c16"], 22: ["narration"], 23: ["c11"], 24: ["c11"], 25: ["narration"], 26: ["c25"], 27: ["c22"], 28: ["c18"], 29: ["c17"], 30: ["c26"],
             31: ["c17"], 32: ["c17"], 33: ["c11"],
             34: ["c2"], 35: ["c6"], 36: ["c10"], 37: ["c13"], 38: ["c15"], 39: ["c25"], 40: ["c22"], 41: ["c18"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "eye", "kitchen-table", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "", "The pop", "On an Anchorage kitchen table at night under a snowy Chugach window, Scrollback pops out of a phone and a blank mustard lot tag THUNKs onto its foot"),
 (2, 1, "subject-portrait", "close", "eye", "kitchen-table", "macro-closeup", "single-object-void", "radial-emanate", "single-organic-hero", "push-in", "build", "Two voices", "Close on Scrollback, its bubbles lighting user side and AI side, one AI bubble wearing a THERAPIST? badge"),
 (3, 2, "data-panel", "medium", "eye", "kitchen-cutaway", "cross-section-cutaway", "stacked-layers", "assemble-build", "data-as-subject", "morph", "build", "Bubbles into crates", "The scarf unspools and its rounded bubbles square off into labelled crates, one riding a conveyor into a MODEL hopper"),
 (4, 3, "map-territory", "wide", "high", "map-table", "top-down-map", "map-territory", "horizontal-traverse", "landscape-as-subject", "map-travel", "travel", "Kitchen to Delaware", "From above, the app icon faints onto LEGAL COSTS bills, then a dashed line carries the crates from Alaska across the map to a tiny Delaware courtroom"),
 (5, 5, "wide-establish", "extreme-wide", "high", "auction-floor", "exploded-diagram", "grid-modular", "assemble-build", "instrument-as-subject", "carried-element", "carry", "The lot", "The crates stack on an auction platform, a $10M starburst slams onto the lot tag, and Disney's grey crate walks past with only a tech license"),
 (6, 7, "alt-vantage", "extreme-wide", "high", "ag-hall", "orbital-aerial", "grid-modular", "radial-emanate", "multiplicity-swarm", "whip-pan", "travel", "Forty desks", "A long row of attorneys general desks, Alaska's flag rising, 40 lamps waving on from New York's desk"),
 (7, 9, "push-detail", "close", "low", "court-bench", "eye-level-immersive", "centered-hero-lowerthird", "vertical-descent", "structure-as-subject", "hard-cut", "build", "The order", "From low at the walnut bench a gavel strikes and a COURT ORDERS card slides out, and a faceless ombudsman walks up with her binder"),
 (8, 11, "two-up", "medium", "eye", "court-bench", "eye-level-immersive", "fullbleed-split", "push-in-only", "instrument-as-subject", "match-action", "carry", "The empty scale", "She sets an empty brass scale on the bench beside Scrollback and presses a privacy seal onto a crate lid"),
 (9, 12, "macro-closeup", "insert", "eye", "court-curtain", "macro-closeup", "single-object-void", "push-in-only", "instrument-as-subject", "push-in", "build", "Behind the curtain", "A warm velvet curtain parts on a blank mustard paddle with a blank name card, and the lot tag flips to its formation dates"),
 (10, 14, "wide-establish", "wide", "low", "court-aisle", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "structure-as-subject", "pull-out", "carry", "The fine print", "A faceless company lawyer unrolls the privacy policy down the aisle as a runway to a giant YES box nobody touches"),
 (11, 15, "push-detail", "close", "eye", "court-table", "cross-section-cutaway", "single-object-void", "vertical-rise", "instrument-as-subject", "match-cut", "match", "The latch", "A small latch on a crate tagged LIMITS ON MINORS rattles under a dashed ghost hand, per Alaska's Department of Law"),
 (12, 16, "subject-portrait", "medium", "low", "court-bench", "eye-level-immersive", "fullbleed-split", "vertical-rise", "structure-as-subject", "carried-element", "carry", "Advises, decides", "Weights land level in the scale, she slides her report onto the bench, and a gavel twice the scale's size hovers out of her reach"),
 (13, 18, "wide-establish", "extreme-wide", "high", "kitchen-window", "orbital-aerial", "map-territory", "vertical-rise", "landscape-as-subject", "pull-out", "travel", "Back to the kitchen", "The tag flips to COURT DECIDES with an empty signature line, then the camera pulls back along the map line through the snowy kitchen window to the phone"),
]

AMBIENT = {1: "a fridge hum, wind at the window", 2: "a fridge hum, soft typing", 3: "paper and a low machine hum", 4: "a soft room tone, paper", 5: "a big room murmur",
           6: "a long hall murmur, lamp clicks", 7: "a courtroom hush, a clock", 8: "a courtroom hush", 9: "a courtroom hush, velvet rustle", 10: "a courtroom hush, paper",
           11: "a courtroom hush", 12: "a courtroom hush, a clock", 13: "a fridge hum, wind at the window"}
CENTER = {1: "Scrollback at x540 y1100", 2: "the AI-side bubble at x540 y980", 3: "the crates at x540 y1040", 4: "the map line at x540 y960", 5: "the platform at x540 y1060",
          6: "the desk row at x540 y980", 7: "the gavel at x540 y960", 8: "the scale at x600 y1040", 9: "the paddle at x540 y980", 10: "the runway at x540 y1080",
          11: "the latch at x540 y1000", 12: "the scale and gavel at x560 y980", 13: "the window at x540 y900"}
HERO = {
 1: ("Scrollback + glowing phone + lot tag + kitchen table", "45% Scrollback and tag, 30% window and range, 25% table"),
 2: ("chat app icon + AI-side bubble", "60% Scrollback, 25% badge, 15% glow"),
 3: ("scarf + crates + conveyor + MODEL hopper", "45% crates, 30% scarf, 25% hopper"),
 4: ("map line + courtroom pin + bills + chat app icon", "45% map line, 30% bills and icon, 25% courtroom"),
 5: ("starburst + lot tag + crates + platform + grey crate", "45% platform and crates, 30% starburst, 25% grey crate"),
 6: ("slate desks + flag + desk lamps", "55% desk row, 30% lamps, 15% flag"),
 7: ("walnut gavel + bench + faceless figure + binder", "40% gavel, 30% bench, 30% figure"),
 8: ("brass scale + privacy seal + lot tag", "40% scale, 30% figure, 30% Scrollback"),
 9: ("velvet curtain + bid paddle + lot tag + Scrollback", "45% curtain, 35% paddle, 20% tag"),
 10: ("company lawyer + privacy policy runway + YES box", "45% runway, 30% box, 25% lawyer"),
 11: ("latch + crate + ghost hand", "50% latch, 30% hand, 20% tag"),
 12: ("brass scale + weights + report + walnut gavel", "40% scale and report, 35% gavel, 25% figure"),
 13: ("plates + lot tag + camera + kitchen window", "40% window, 30% line, 30% Scrollback"),
}
PARTS = {1: 52, 2: 44, 3: 50, 4: 48, 5: 52, 6: 56, 7: 46, 8: 50, 9: 42, 10: 46, 11: 40, 12: 54, 13: 50}
KICKS = (2, 17)
CAMERA = {1: "craneDown", 2: "dollyThrough", 3: "truckAcross", 4: "craneDown", 5: "riseWith", 6: "truckAcross", 7: "craneDown",
          8: "dollyThrough", 9: "dollyThrough", 10: "truckAcross", 11: "riseWith", 12: "craneDown", 13: "riseWith"}

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
                    "Drawn as Scrollback, a faced accordion of chat bubbles whose scarf of older messages squares off into crates on an auction platform, a lot tag that changes face, an empty brass scale and a gavel out of her reach."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "exploded-diagram", "motion_vector": "assemble-build", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "tactile-collage", "palette": PALETTE, "camera_strategy": "track-follow",
                        "light_story": "a moonlit night kitchen under a warm pendant lamp, a flat-lit map table, then a walnut courtroom in high warm window light that dims behind a warm-edged curtain, goes flat and even for the fair weighing, and narrows to one raking shaft at the verdict, then the moonlit kitchen again",
                        "metaphor": "a chat history becomes an auction lot: soft bubbles square off into crates on a platform, a tag changes face, and a privacy expert's empty scale sits under a gavel she can't reach"}, "signature_shot": 12,
        "palette": PALETTE,
        "divergence_note": ("The last films were a persimmon-daylight evidence board with a cream paper route card and fiber cyan (11-19), a mint afterglow over lilac snow with a chalk-line reel and ultramarine (11-18), polar night with faced decision trees and radar lime (11-16), and a rain-black Juneau letterbox (11-15). "
                            "This film is a spruce-black night kitchen and a walnut courtroom with one auction mustard, its hero a pale mint accordion of chat bubbles that unspools and squares off into crates. "
                            "Honest overlaps: a faced inanimate hero again (fourth in a row), varied by giving it business its predecessors never had (it unspools, re-stacks, hides its messages); 11-19 also staged an interior with a raven and a magnifier, both cut here; 11-15 also used a night interior, answered by a warm lamp kitchen and a daylit courtroom."),
        "treatment": {"title": "Lot 1, Your Chats", "summary": ad["treatment"], "judge_reasoning": tr[1] if len(tr) > 1 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "An Anchorage kitchen table at night under a snowy Chugach window, a phone glowing, and at 0.4 s a pale mint stack of chat bubbles with a face pops up out of the screen, then a mustard lot tag THUNKs onto its foot",
                 "headline": "AN AI APP'S CHATS · FOR AUCTION", "motion_by_s": 0.4,
                 "loopback": "Frame 1 is the phone on the night kitchen table with Scrollback popping out; the last image pulls back through the same snowy window to the same phone, Scrollback sitting beside it with its tag reading COURT DECIDES over an empty signature line."},
        "open_loop": {"plant_t": b_at(2), "pay_t": b_at(32), "plant_glow_s": 0.4, "plant_sfx": "thunk", "what": "Who ends up with this lot? Planted when a BLANK mustard lot tag THUNKs onto Scrollback's foot, kept as the tag changes face ($10M, FORMED NOV 13 · BID FILED NOV 14, UNDER REVIEW), paid when it flips to COURT DECIDES with an empty signature line beside the still blank paddle card: the court decides, and the money behind the bid isn't public."},
        "open_loop_2": {"plant_t": b_at(12), "pay_t": b_at(22), "what": "Who is the bidder? Planted when a spotlight snaps on over an EMPTY bidder's stand at the back of the auction floor with a blank name card, kept as the starting bid sits on the lot tag, paid when the velvet curtain parts on that stand's blank paddle and the lot tag flips to FORMED NOV 13 · BID FILED NOV 14, the name card still blank."},
        "throughline": {"object": "the mustard lot tag", "lands_in_button": "the tag reads COURT DECIDES over an empty signature line on Scrollback's foot back on the kitchen table",
                        "states": [
                            {"at_s": b_at(2), "state": "T1 BLANK, just THUNKed onto Scrollback's foot"},
                            {"at_s": b_at(11), "state": "T2 $10M under a starburst on the auction platform"},
                            {"at_s": b_at(21), "state": "T2b $10M with a round privacy seal reading SAFEGUARDS? pressed on"},
                            {"at_s": b_at(23), "state": "T3 FORMED NOV 13 · BID FILED NOV 14 beside the curtain"},
                            {"at_s": b_at(29), "state": "T4 UNDER REVIEW beside the level scale"},
                            {"at_s": b_at(32), "state": "T5 COURT DECIDES with an empty signature line"}]},
        "reveals": [
            {"t": b_at(5), "type": "build-on", "what": "the scarf unspools and every bubble squares off into a crate", "hold_s": 0.6},
            {"t": b_at(9), "type": "scale-pullback", "what": "the camera rises over a painted map as a dashed line carries the crates from Alaska to Delaware", "hold_s": 0.8},
            {"t": b_at(16), "type": "scale-pullback", "what": "40 desk lamps wave on down a long row of attorneys general desks", "hold_s": 0.8},
            {"t": b_at(28), "type": "morph-to-chart", "what": "LOSSES? and GAINS? weights land and the scale settles level", "hold_s": 0.6},
            {"t": b_at(30), "type": "scale-pullback", "what": "a gavel twice the scale's size lowers into view above the bench", "hold_s": 0.8},
            {"t": b_at(33), "type": "scale-pullback", "what": "the camera pulls back along the map line through the kitchen window", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.9}, {"line": 3, "offset": 0.0, "level": 1.2}, {"line": 7, "offset": 0.0, "level": 0.8},
            {"line": 12, "offset": 0.0, "level": 1.4}, {"line": 14, "offset": 0.0, "level": 0.7}, {"line": 16, "offset": 0.0, "level": 1.2},
            {"at_s": round(b_at(31) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(31) + 0.5, 3), "level": 1.3},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(31) - 0.5, 3), "riser_at": round(b_at(22) - 1.0, 3), "silence_at": round(b_at(31) - 0.5, 3),
            "payoff_at": b_at(31), "button_pattern": "callback", "interrupt_at": b_at(22), "extra_dips": []},
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
