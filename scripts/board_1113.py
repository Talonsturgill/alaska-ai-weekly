#!/usr/bin/env python3
"""2026-11-13 "The Faucet Before the Water": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1113.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1113.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
 (1, 0, 0.0, "creak", "Drip, a brass spigot with a face", "lifts his handle like a brow and coughs one puff of dust over an empty pail while a tiny tomato-red binder walks toward him from the spruce row", "hopeful", "NOTHING COMING OUT YET", "the pail waits", ""),
 (2, 0, W("infrastructure"), "clunk", "the gravel lot", "pulls away as a fat pipe rolls out from Drip's neck past the spruce toward the Chugach", "eager", "A PIPE TO THE HORIZON", "the pipe rolls", ""),
 (3, 0, W("nothing"), "tick", "a single dust speck", "gathers on Drip's lip, hangs and does not fall into the pail", "patient", "WAITING ON THE FIRST DROP", "the speck hangs", "plant: what will come out first"),
 (4, 1, 0.0, "stamp", "a press podium with a state seal", "thumps onto an empty hall floor beside a wall calendar whose ninth gets a red ring", "official", "NOV 9 INVESTNORTH", "the ring closes", ""),
 (5, 1, W("state"), "paper", "a brass banner", "drops from the podium front and swings open across it", "formal", "STATE-SPONSORED FINANCING PLATFORM", "the banner swings", ""),
 (6, 1, W("data"), "pop", "a window in the hall wall", "slides open onto the lot where a faint server hall ghosts in beside the spruce", "distant", "PITCHED AT DATA CENTERS", "the hall flickers", ""),
 (7, 2, 0.0, "whoosh", "a pump house with an AIDEA flag", "thumps down beside the pipe as the camera dollies along it and the flag snaps taut", "proud", "AIDEA", "the flag snaps", ""),
 (8, 2, W("Alaska"), "tick", "a small booth", "drops beside the pump house with a funnel on its roof", "plain", "ALASKA DATA CORP", "the booth settles", ""),
 (9, 3, 0.0, "flip", "a page of a wall calendar", "flips over to January on the booth wall", "dated", "JANUARY", "the page settles", ""),
 (10, 3, W("twenty"), "coins", "twenty fat bags", "drop one by one into the booth's funnel and the booth shudders", "heavy", "$20 MILLION", "the funnel shudders", ""),
 (45, 3, W("run"), "ping", "a gauge on the booth", "swings to a label that reads TO RUN ON while Drip strains at the edge of the frame", "steady", "TO RUN ON", "the needle settles", ""),
 (11, 4, 0.0, "clip", "a cable car clamp", "slides onto the side of the pipe and locks with a ding while Drip coughs a second puff", "bright", "BUILT WITH PLURAL", "the clamp dings", ""),
 (12, 4, W("Plural"), "tap", "Bucket, a dented pail with a face", "tilts to look at the clamp from under the spout", "wary", "SAN FRANCISCO", "the pail tilts", ""),
 (13, 5, 0.0, "whoosh", "the booth wall", "peels open into a coat check where Marge stands behind a half door", "plain", "TOKENIZATION", "the wall peels", "rehook: the booth wall peels open into a coat check"),
 (14, 5, W("record"), "scribble", "Marge", "writes a numbered ticket into a ledger and stamps it", "literal", "A RECORD OF WHO OWNS A STAKE", "the ledger stamps", ""),
 (15, 5, W("coat"), "bloom", "the numbered ticket", "slides across the counter to Bucket while the coat stays on its hook", "light", "THE TICKET IS THE RECORD", "the ticket slides", ""),
 (16, 6, 0.0, "knock", "a dog-door-sized window", "slides open in the pipe wall with a stenciled word painted over it", "tentative", "SOME DEALS MAY BE ALASKANS ONLY", "the window opens", ""),
 (17, 6, W("May", 2), "bloop", "the stenciled word MAY", "peels at one letter edge and the letter drops to the gravel", "uncertain", "MAY", "the letter drops", "plant: does may become is"),
 (18, 7, 0.0, "flip", "Drip", "flips the OPEN sign on his neck to NO OFFERINGS YET while a padlock snaps onto his handle", "caught", "NO OFFERINGS YET", "the lock snaps", ""),
 (19, 7, W("terms"), "rattle", "a torn price tag", "swings from the padlock with the price ripped off while Bucket looks up at it", "blank", "TERMS NOT DECIDED", "the tag swings", ""),
 (21, 8, 0.0, "swing", "a billboard", "drops onto the pipe and swings open a speech balloon in its corner", "grand", "PLURAL CEO · THE PITCH", "the billboard opens", ""),
 (22, 8, W("largest"), "thump", "the speech balloon", "swells and the whole pipe thrums once under Drip", "bold", "ONE OF THE LARGEST CAPITAL NEEDS IN A GENERATION", "the pipe thrums", ""),
 (23, 9, 0.0, "shimmer", "a mint slip", "glows up out of a paperwork pile before anyone touches it", "empty", "THAT'S THE PITCH", "the slip glows", "rehook: a mint slip glows up out of the paperwork pile"),
 (24, 9, W("project"), "tap", "a magnifying glass", "sweeps across the mint slip and finds it blank", "searching", "NONE NAMED IN SOURCES REVIEWED HERE", "the glass sweeps", ""),
 (25, 9, W("here"), "hush", "Bucket", "raises one eyebrow at the blank slip", "dry", "NO AI PROJECT NAMED", "the brow lifts", ""),
 (26, 10, 0.0, "flap", "a newsprint masthead", "drops beside a ledger page on a counter", "plain", "THE DAILY NEWS", "the masthead settles", ""),
 (27, 10, W("June"), "press", "two cup nameplates", "land on the ledger one for the governor and one for Plural's chief executive", "firm", "FIRST MET JUNE 2025", "the cups land", ""),
 (28, 10, W("seven"), "thud", "Drip", "dulls a notch as each of seven coffee rings stamps onto a plain ledger page one by one", "heavy", "AT LEAST 7 MEETINGS", "the rings stamp", ""),
 (29, 11, 0.0, "stop", "the camera", "pulls back along the pipe as its far end lifts off the lot", "grave", "A CRITIC · THE DAILY NEWS", "the pipe lifts", ""),
 (43, 11, W("advocacy"), "clack", "a name tab", "lands on the pipe's far flange and sticks", "plain", "ADVOCACY GROUP FOUNDER", "the tab sticks", ""),
 (30, 11, W("hundreds"), "roll", "the pipe's far end", "tilts toward a Lower 48 outline while the bags in the booth lean after it", "strained", "CRITIC · HUNDREDS OF MILLIONS", "the pipe tilts", ""),
 (31, 11, W("Lower"), "clunk", "a crate on the Lower 48 outline", "settles under the pipe's far end as Drip turns to watch his own pipe point away", "grave", "CRITIC · LOWER 48 CORPORATIONS", "the crate settles", ""),
 (32, 12, 0.0, "clink", "an empty boardroom table", "drops its chairs one by one around a wall calendar", "plain", "AIDEA BOARD", "the chairs drop", ""),
 (33, 12, W("December"), "ring", "a red ring", "draws around the fourth on the wall calendar", "urgent", "AT LEAST ONE MORE MEETING DEC 4", "the ring closes", ""),
 (34, 13, W("opportunity"), "pop", "a roadside sign", "swings into the boardroom window reading DATA CENTERS HERE", "steady", "DATA CENTERS HERE", "the sign swings", ""),
 (35, 13, W("let's"), "swing", "Drip", "reads the sign's second plank drop in under the first as DO IT RIGHT and his handle lifts", "steady", "LET'S DO IT RIGHT", "the plank drops", ""),
 (36, 14, 0.0, "boing", "the Rulebook, a tomato-red binder with one eye", "arrives at the lot out of breath with its rings flapping and a light flurry starting behind it", "late", "STILL BLANK", "the rings flap", "rehook: the Rulebook arrives out of breath at the lot"),
 (44, 14, W("governor"), "ding", "a nameplate", "slides onto the post at the lot's edge beside a calendar page ringed on the seventh", "firm", "NEW GOVERNOR DEC 7", "the nameplate settles", ""),
 (37, 14, W("pause"), "swish", "Drip", "turns toward a second sign that swings in over the lot's gate", "careful", "WOULD SUPPORT A PAUSE", "the sign swings", ""),
 (38, 14, W("rules"), "clip", "a plank tag", "clips under the second sign while the stenciled MAY flickers back on the dog-door window", "careful", "UNTIL COMPREHENSIVE RULES", "the tag clips", ""),
 (39, 15, 0.0, "whoosh", "a padlock key", "drops macro into the gravel at Drip's feet beside the pail and the Rulebook", "pointed", "BUILD VS PAUSE", "the key drops", ""),
 (40, 15, W("order"), "thud", "the camera", "pulls back low along the pipe as both signs swing to point at the Rulebook", "hesitant", "ORDER", "the signs point", ""),
 (41, 15, W("Rules"), "ring", "Drip", "turns his handle a quarter toward the Rulebook and stops against the padlock", "quiet", "RULES FIRST", "the handle stops", ""),
 (42, 15, W("first", 2), "hush", "the dust speck", "hangs on Drip's lip above the empty pail and does not fall as the frame cuts hard to black", "open", "RULES FIRST, OR MONEY FIRST", "the speck hangs", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 46)}
PLATE_AT.update({1: "lower-third", 4: "side-plate-right", 10: "side-plate-left", 21: "side-plate-left", 26: "side-plate-right", 29: "lower-third", 32: "side-plate-right", 36: "side-plate-left", 41: "lower-third", 42: "lower-third"})
CLAIM_MAP = {1: ["c9"], 2: ["narration"], 3: ["narration"], 4: ["c1"], 5: ["c2"], 6: ["c2"], 7: ["c3"], 8: ["c3"], 9: ["c5"], 10: ["c5"], 45: ["c5"],
             11: ["c6"], 12: ["c6"], 13: ["c7"], 14: ["c7"], 15: ["c7"], 16: ["c8"], 17: ["c8"], 18: ["c9"], 19: ["c10"],
             21: ["c14"], 22: ["c14"], 23: ["narration"], 24: ["c15"], 25: ["c15"], 26: ["c11"], 27: ["c11"], 28: ["c12"], 29: ["c19"],
             30: ["c19"], 31: ["c19"], 32: ["c18"], 33: ["c18"], 34: ["c13"], 35: ["c13"], 36: ["narration"], 37: ["c17"], 38: ["c17"],
             39: ["narration"], 40: ["narration"], 41: ["narration"], 42: ["narration"], 43: ["c19"], 44: ["c16"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "ground", "gravel-lot-day", "low-lateral-along-pipe", "pipe-perspective", "assemble-build", "character-as-subject", "", "", "The faucet", "Drip coughs over an empty pail, the pipe rolls out to the horizon and one speck hangs on his lip"),
 (2, 1, "push-detail", "medium", "eye", "press-hall-interior", "eye-level-immersive", "stacked-layers", "vertical-descent", "data-as-subject", "mask-wipe", "build", "The announcement", "A press podium thumps onto an empty hall floor, a banner drops and a window opens onto the lot"),
 (3, 2, "map-territory", "medium", "eye", "pump-and-booth", "dolly-along-pipe", "grid-modular", "horizontal-traverse", "structure-as-subject", "carried-element", "travel", "The company", "A pump house and a booth drop beside the pipe, the calendar flips to January and twenty bags thud into the funnel"),
 (4, 4, "subject-portrait", "close", "eye", "gravel-lot-day", "macro-closeup", "fullbleed-split", "radial-emanate", "instrument-as-subject", "graphic-match", "match", "The partner", "A cable car clamp locks onto the pipe, Drip coughs and Bucket tilts to look at it"),
 (5, 5, "push-detail", "insert", "eye", "coat-check-cutaway", "cross-section-cutaway", "stacked-layers", "scroll-data", "instrument-as-subject", "carried-element", "carry", "The ticket", "The booth wall peels open into a coat check and a ticket slides to Bucket while the coat stays"),
 (6, 6, "alt-vantage", "close", "low", "gravel-lot-day", "dog-door-low", "pipe-perspective", "assemble-build", "data-as-subject", "match-cut", "match", "The word may", "A dog door window opens under a stenciled MAY, a letter peels and a padlock snaps on Drip's handle"),
 (7, 8, "wide-establish", "wide", "low", "billboard-row", "eye-level-immersive", "grid-modular", "horizontal-traverse", "structure-as-subject", "graphic-match", "match", "The pitch", "A billboard opens with the CEO's line and a mint slip glows blank under a glass"),
 (8, 10, "map-territory", "medium", "ground", "ledger-counter", "overhead-flat", "grid-modular", "radial-emanate", "data-as-subject", "carried-element", "carry", "The count", "A masthead, two cup nameplates and seven coffee rings land on a ledger while Drip's brass dulls"),
 (9, 11, "alt-vantage", "wide", "low", "pipe-pullback", "dolly-along-pipe", "pipe-perspective", "vertical-descent", "structure-as-subject", "mask-wipe", "build", "The strongest case", "The camera pulls back along the pipe as its far end lifts toward a Lower 48 outline and Drip turns to watch"),
 (10, 12, "push-detail", "medium", "ground", "boardroom", "ground-level-side", "stacked-layers", "scroll-data", "data-as-subject", "carried-element", "carry", "The clock", "An empty boardroom drops its chairs around a calendar ringed on the fourth and a sign says do it right"),
 (11, 14, "subject-portrait", "medium", "eye", "gravel-lot-day", "low-lateral-along-pipe", "pipe-perspective", "horizontal-traverse", "character-as-subject", "graphic-match", "match", "The handover", "The Rulebook arrives at the lot out of breath, a nameplate and a second sign go up and the light flurry starts"),
 (12, 15, "wide-establish", "close", "eye", "gravel-lot-day", "macro-closeup", "pipe-perspective", "assemble-build", "character-as-subject", "match-cut", "match", "The order", "A padlock key drops at Drip's feet, the camera pulls back low along the pipe and a speck hangs before the cut"),
]

AMBIENT = {1: "wind over a gravel lot, a sign creaks, a dry hiss", 2: "a hall echoes, paper snaps, a banner swings", 3: "a pump thumps, bags thud, a flag snaps, wind",
           4: "metal dings, a dry cough, wind", 5: "a ledger scratches, paper slides, a stamp thuds", 6: "paint peels, a lock snaps, wind",
           7: "a billboard flaps, the pipe thrums, paper rustles", 8: "a counter creaks, rings thud, paper settles", 9: "wind, the pipe creaks as it lifts, a low room tone",
           10: "chairs scrape, a calendar flaps, a sign creaks", 11: "wind, rings flap, a first flurry hisses", 12: "wind, a key clinks, a dry hiss, a held tone"}
CENTER = {i: "Drip at x700 y1000" for i in range(1, 13)}
CENTER.update({2: "the podium at x440 y1000", 3: "the booth at x540 y1000", 4: "the clamp at x540 y1000", 5: "Marge at x540 y980", 6: "the window at x540 y1040", 7: "the billboard at x540 y960",
               8: "the ledger at x540 y1000", 9: "the pipe at x540 y1000", 10: "the calendar at x440 y920", 11: "the Rulebook at x440 y1000", 12: "the key at x700 y1300"})
HERO = {
 1: ("Drip + the pail + the pipe + the Rulebook speck", "50% Drip, 25% pail and pipe, 25% sign and spruce"),
 2: ("press podium + banner + wall calendar + window onto the lot", "45% podium and banner, 30% calendar, 25% window"),
 3: ("pump house + booth + twenty bags + gauge + Drip", "50% booth and bags, 30% pump house, 20% Drip"),
 4: ("cable car clamp + Bucket + Drip + pipe", "50% clamp, 30% Bucket, 20% Drip"),
 5: ("coat check + Marge + ledger + ticket + Bucket", "50% Marge and counter, 30% ledger, 20% ticket"),
 6: ("dog-door window + stenciled MAY + padlock + Drip + torn tag", "40% window and MAY, 35% Drip and padlock, 25% tag"),
 7: ("billboard + speech balloon + magnifying glass + mint slip + Drip + Bucket", "45% billboard, 30% glass and slip, 25% Drip and Bucket"),
 8: ("ledger + masthead + two cup nameplates + seven coffee rings + Drip", "50% ledger and rings, 30% masthead and cups, 20% Drip"),
 9: ("the pipe's far end + Lower 48 outline + crate + booth bags + Drip", "45% pipe, 30% outline and crate, 25% Drip"),
 10: ("boardroom table + chairs + wall calendar + roadside sign + Drip", "50% calendar, 30% table, 20% sign"),
 11: ("the Rulebook + nameplate + calendar page + second sign + Drip + flurry", "40% Rulebook, 30% Drip, 30% signs"),
 12: ("padlock key + Drip + pail + Rulebook + two signs + dust speck", "40% key then Drip, 30% pail and Rulebook, 30% signs and speck"),
}
PARTS = {1: 48, 2: 46, 3: 56, 4: 44, 5: 54, 6: 50, 7: 58, 8: 52, 9: 48, 10: 48, 11: 52, 12: 54}
KICKS = (4, 23, 41)
CAMERA = {1: "dollyThrough", 2: "craneDown", 3: "truckAcross", 4: "dollyThrough", 5: "static:the peeling wall and the ticket are the move",
          6: "static:the peeling letter and the snapping lock are the move", 7: "truckAcross", 8: "static:the rings stamping are the move",
          9: "dollyThrough", 10: "dollyThrough", 11: "truckAcross", 12: "orbitReveal"}

DRIP_STATES = {
 1: {"name": "bare and dry, ribbon on, pail empty under the spout"},
 2: {"name": "plumbed in, Plural clamp on, second cough, still dry"},
 3: {"name": "padlocked, tagged NO OFFERINGS YET and TERMS NOT DECIDED, brass dulled"},
 4: {"name": "handle quarter turned toward the arriving Rulebook, a first flurry on the lot"},
 5: {"name": "polished again, still dry, padlock key at his feet, Rulebook beside him"},
}

PALETTE = ("overcast pewter-sage sky rising to light straw, wet gravel with puddle glints, far spruce green, brushed brass reserved for Drip, galvanized grey pail, "
           "cream notice sheets with slate type, tomato reserved for the Rulebook and circled dates, electric mint reserved for the AI slip")


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
        "run_date": "2026-11-13", "slug": "the-faucet-before-the-water", "title": "The Faucet Before the Water",
        "concept": ("On November 9th the governor announced InvestNorth, a state-sponsored financing platform pitched at data centers, built with Plural of San Francisco on top of Alaska Data Corp, an AIDEA company "
                    "that AIDEA's board voted $20 million in January. Tokenization is a digital record of who owns a stake. Some deals may be reserved for Alaskans, no offering is open and terms aren't decided, "
                    "and by the sources reviewed here none names an AI project. The Daily News counts at least seven meetings with Plural's chief executive and a critic calls it public money to Lower 48 corporations. "
                    "AIDEA's board meets again December 4th and on December 7th Jonathan Kreiss-Tomkins becomes governor and says he would support a pause on data center construction until there are rules. "
                    "The film draws all of it as a brass faucet with a face at the end of a pipe with nothing to pour, and ends on a hard cut at a dust speck that does not fall."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "low-lateral-along-pipe", "motion_vector": "horizontal-traverse", "hero_treatment": "character-as-subject", "layout": "pipe-perspective",
                        "register": "naturalistic-scene", "palette": PALETTE, "camera_strategy": "dolly-along",
                        "light_story": "overcast gravel-lot day, paper-lit cutaways, a hard cut to black",
                        "metaphor": "a brass faucet at the end of a long pipe with nothing yet to pour, a rulebook always arriving last"},
        "palette": PALETTE,
        "divergence_note": ("The last films were a lime stake tag on raven dusk (11-12), pink-gold ice fog with amber (11-11), a violet shore with vermilion and lemon (11-10), an oxblood courtroom (11-09) and a permafrost road (11-08). "
                            "This film is an overcast pewter-sage gravel lot under the Chugach with brushed brass on one hero, tomato red on one binder and mint on one slip, with no lime, no pink-gold and no plum. "
                            "Its hero is a brass spigot with a face rather than a stake, tag or puck, its device is a pipe in perspective that the camera runs along, its tokenization is a coat check, and it ends on a speck that does not fall. "
                            "Honest cost: several shots stay on the same lot."),
        "treatment": {"title": "The Faucet Before the Water", "summary": ad["treatment"]["judge_reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "anomaly-question", "frame1": "A brass spigot with a face stands at the end of a long pipe on a wet gravel lot beside an empty pail, lifts its handle like a brow and coughs one puff of dust.",
                 "headline": "ALASKA BUILT THE FAUCET FIRST", "motion_by_s": 0.3,
                 "loopback": "Frame 1 is Drip coughing dust at the end of the pipe, the last frame is Drip with a padlock key at his feet and a speck hanging on his lip that does not fall, then a hard cut to black."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(42), "plant_glow_s": 0.4, "plant_sfx": "tick", "what": "What will come out of the faucet first, rules or money? Planted as a speck that hangs on the lip, paid when the speck hangs again after rules first or money first and the frame cuts to black."},
        "open_loop_2": {"plant_t": b_at(17), "pay_t": b_at(38), "what": "Does MAY become IS? Planted as a stenciled MAY on the residents-only window that loses a letter, paid when MAY flickers back behind the plank tag until comprehensive rules, so the word stays a may until someone writes it down."},
        "throughline": {"object": "Drip, the brass spigot", "lands_in_button": "Drip stands polished and still dry with a padlock key at his feet and a speck on his lip before the cut",
                        "param_states": {str(k): v for k, v in DRIP_STATES.items()},
                        "states": [
                            {"at_s": b_at(1), "state": "D1 bare and dry, ribbon on, one dust cough"},
                            {"at_s": b_at(12), "state": "D2 plumbed in, Plural clamp on, second cough, still dry"},
                            {"at_s": b_at(18), "state": "D3 padlocked, tagged NO OFFERINGS YET and TERMS NOT DECIDED, brass dulled"},
                            {"at_s": b_at(28), "state": "D3b brass dulls a notch with each of seven coffee rings"},
                            {"at_s": b_at(31), "state": "D3c turned to watch his own pipe point away toward the Lower 48 crate"},
                            {"at_s": b_at(36), "state": "D3d eyes widen as the Rulebook arrives out of breath with the first flurry behind it"},
                            {"at_s": b_at(41), "state": "D4 handle quarter turned toward the arriving Rulebook, a first flurry on the lot"},
                            {"at_s": b_at(42), "state": "D5 polished again, still dry, padlock key at his feet, Rulebook beside him"}]},
        "reveals": [
            {"t": b_at(2), "type": "scale-pullback", "what": "the pipe unrolls from Drip's neck to the horizon across the wet gravel lot", "hold_s": 0.8},
            {"t": b_at(9), "type": "build-on", "what": "twenty bags drop one by one into the booth's funnel", "hold_s": 0.8},
            {"t": b_at(13), "type": "build-on", "what": "the booth wall peels open into a coat check", "hold_s": 0.8},
            {"t": b_at(29), "type": "scale-pullback", "what": "the camera pulls back along the pipe as its far end lifts toward a Lower 48 outline", "hold_s": 0.8},
            {"t": b_at(40), "type": "scale-pullback", "what": "the camera pulls back low along the pipe from the key to the whole lot with Drip small at its end", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 1, "offset": 0.0, "level": 1.0}, {"line": 4, "offset": 0.0, "level": 1.4},
            {"line": 6, "offset": 0.0, "level": 0.5}, {"line": 8, "offset": 0.0, "level": 1.3}, {"line": 10, "offset": 0.0, "level": 1.0},
            {"line": 11, "offset": 0.0, "level": 0.4}, {"line": 14, "offset": 0.0, "level": 1.2}, {"line": 15, "offset": 0.0, "level": 1.4},
            {"at_s": round(b_at(42) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(42) + 0.6, 3), "level": 2.0},
            {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(42) - 0.5, 3), "riser_at": round(b_at(39), 3), "silence_at": round(b_at(42) - 0.5, 3),
            "payoff_at": b_at(42), "button_pattern": "callback", "interrupt_at": b_at(29), "extra_dips": [b_at(32), b_at(36)]},
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
    book.raise_if_missing("board_1113 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1113Ids.ts").write_text(
        "// GENERATED by scripts/board_1113.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
