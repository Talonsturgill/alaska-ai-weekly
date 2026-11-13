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
 (1, 0, 0.0, "thump", "Drip, a brass spigot with a face", "lifts his handle like a brow and coughs one puff of dust beside a COMING SOON sign that swings on its stake with a row of spruce and the Chugach range behind", "hopeful", "NOTHING COMING OUT YET", "the sign swings", ""),
 (2, 0, W("infrastructure"), "slide", "a fat pipe", "drops from Drip's neck and rolls out across the gravel lot toward the Chugach", "eager", "A PIPE TO THE HORIZON", "the pipe unrolls", ""),
 (3, 0, W("nothing"), "drip", "a single dust speck", "gathers on Drip's lip, hangs and does not fall", "patient", "NO OFFERINGS YET", "the speck hangs", "plant: what will come out first"),
 (4, 1, 0.0, "slam", "a wall calendar page", "slams onto the pipe and a red ring draws around the ninth", "official", "NOV 9 INVESTNORTH", "the ring closes", ""),
 (5, 1, W("state"), "ching", "a brass plaque", "clips onto the pipe and swings once", "formal", "STATE-SPONSORED FINANCING PLATFORM", "the plaque swings", ""),
 (6, 1, W("data"), "buzz", "a faint server hall", "ghosts in beside a spruce row at the far end of the pipe and flickers", "distant", "PITCHED AT DATA CENTERS", "the hall flickers", ""),
 (7, 2, 0.0, "whoosh", "a pump house with an AIDEA flag", "thumps down at the far end of the pipe and its flag snaps taut", "proud", "AIDEA", "the flag snaps", ""),
 (8, 2, W("Alaska"), "clink", "a small booth", "drops beside the pump house with a sign painted over its door", "plain", "ALASKA DATA CORP", "the booth settles", ""),
 (9, 3, 0.0, "coins", "twenty fat bags", "drop one by one into the booth's funnel and the booth shudders", "heavy", "$20 MILLION", "the funnel shudders", ""),
 (10, 3, 0.55, "ping", "a gauge on the booth", "swings to a label that reads TO RUN ON", "steady", "JANUARY · TO RUN ON", "the needle settles", ""),
 (11, 4, 0.0, "clip", "a cable car clamp", "slides onto the side of the pipe and locks with a ding", "bright", "BUILT WITH PLURAL", "the clamp dings", ""),
 (12, 4, W("Plural"), "squeak", "Bucket, a dented pail with a face", "tilts to look at the clamp", "wary", "SAN FRANCISCO", "the pail tilts", ""),
 (13, 5, 0.0, "whoosh", "the booth wall", "peels open into a coat check where Marge stands behind a half door", "plain", "TOKENIZATION", "the wall peels", "rehook: the booth wall peels open into a coat check"),
 (14, 5, W("record"), "scribble", "Marge", "writes a numbered ticket into a ledger and stamps it", "literal", "A RECORD OF WHO OWNS A STAKE", "the ledger stamps", ""),
 (15, 5, W("coat"), "flutter", "a parka", "lifts out of the picture while the ticket stays on the counter", "light", "THE TICKET IS THE RECORD", "the ticket stays", ""),
 (16, 6, 0.0, "knock", "a dog-door-sized window", "slides open in the pipe wall under a neon tag", "tentative", "SOME DEALS MAY BE ALASKANS ONLY", "the window opens", ""),
 (17, 6, W("May", 2), "buzz", "the neon word MAY", "flickers like a motel sign and one letter drops out", "uncertain", "MAY", "the sign flickers", "plant: does may become is"),
 (18, 7, 0.0, "flip", "an OPEN sign on Drip's neck", "flips over and its back reads NO OFFERINGS YET", "caught", "NO OFFERINGS YET", "the sign flips", ""),
 (19, 7, W("terms"), "rattle", "a torn price tag", "swings from Drip's handle with the price ripped off", "blank", "TERMS NOT DECIDED", "the tag swings", ""),
 (20, 7, W("decided"), "hush", "Bucket", "looks into his own empty pail", "tired", "NOTHING OPEN", "the pail echoes", ""),
 (21, 8, 0.0, "swing", "a billboard", "drops onto the pipe and swings open a speech balloon in its corner", "grand", "PLURAL CEO · THE PITCH", "the billboard unfurls", ""),
 (22, 8, W("largest"), "bell", "the speech balloon", "swells and the whole pipe thrums once", "bold", "ONE OF THE LARGEST CAPITAL NEEDS IN A GENERATION", "the pipe thrums", ""),
 (23, 9, 0.0, "tap", "a magnifying glass", "sweeps across a pile of state paperwork", "searching", "THAT'S THE PITCH", "the glass sweeps", "rehook: a magnifying glass sweeps the paperwork pile"),
 (24, 9, W("project"), "shimmer", "a mint slip", "drops under the glass and lands blank with nothing written on it", "empty", "NO AI PROJECT NAMED", "the slip glows", ""),
 (25, 9, W("sources"), "hush", "Bucket", "raises one eyebrow at the slip", "dry", "SOURCES REVIEWED HERE", "the brow lifts", ""),
 (26, 10, 0.0, "thock", "a newsprint masthead", "drops onto a bare table beside the pipe", "plain", "THE DAILY NEWS", "the masthead settles", ""),
 (27, 10, W("June"), "press", "a date stamp", "lands on the table beside the masthead", "firm", "FIRST MET JUNE 2025", "the stamp lands", ""),
 (28, 10, W("seven"), "thud", "seven coffee rings", "stamp onto a map one by one with four landing on Washington", "heavy", "AT LEAST 7 MEETINGS", "the rings stamp", "rehook: seven coffee rings stamp onto a map"),
 (29, 11, 0.0, "stop", "a plain card", "drops onto a bare table and is held without a joke", "grave", "A CRITIC · THE DAILY NEWS", "the card holds", ""),
 (30, 11, W("hundreds"), "roll", "the pipe's far end", "tilts toward a crate on a Lower 48 outline", "strained", "LOWER 48 CORPORATIONS", "the pipe tilts", ""),
 (31, 11, W("Lower"), "creak", "a scale pan", "tips and holds under the crate", "grave", "THE CRITIC'S VIEW", "the pan holds", ""),
 (32, 12, 0.0, "ring", "a wall calendar", "slides in with one page circled red", "urgent", "AIDEA BOARD DEC 4", "the page circles", ""),
 (33, 12, W("least"), "clack", "a meeting stub", "hangs on the pipe beside a second stub", "plain", "AT LEAST ONE MORE MEETING", "the stub swings", ""),
 (34, 13, 0.0, "swing", "a roadside sign", "swings into frame beside the pipe", "steady", "LET'S DO IT RIGHT", "the sign swings", "rehook: a roadside sign swings in and the governor says do it right"),
 (35, 13, W("outgoing"), "creak", "the Rulebook, a binder with one eye", "arrives out of breath with its rings flapping", "late", "OUTGOING GOVERNOR", "the rings flap", ""),
 (36, 14, 0.0, "tear", "the calendar", "rips over to December and a red ring draws around the seventh", "urgent", "NEW GOVERNOR DEC 7", "the ring closes", ""),
 (37, 14, W("pause"), "swish", "a second sign", "swings in beside the first", "careful", "WOULD SUPPORT A PAUSE", "the sign swings", ""),
 (38, 14, W("rules"), "clip", "a plank tag", "clips under the second sign", "careful", "UNTIL COMPREHENSIVE RULES", "the tag clips", ""),
 (39, 15, 0.0, "riser", "both signs", "swing together to point at the blank Rulebook", "pointed", "THE FIGHT IS ORDER", "the signs point", ""),
 (40, 15, W("order"), "thud", "Drip", "turns his handle a quarter and stops", "hesitant", "RULES FIRST, OR MONEY FIRST", "the handle stops", ""),
 (41, 15, W("money"), "clink", "a padlock key", "drops at Drip's feet beside Bucket", "quiet", "WHO WRITES IT DOWN FIRST", "the key lands", ""),
 (42, 15, W("first", 2), "hush", "the dust speck", "hangs on Drip's lip and does not fall as the frame cuts hard to black", "open", "RULES FIRST, OR MONEY FIRST", "the speck hangs", ""),
 (43, 11, W("advocacy"), "clack", "a name tab", "lands on the plain card and sticks", "plain", "ADVOCACY GROUP FOUNDER", "the tab clips", ""),
 (44, 14, W("governor"), "ding", "a nameplate", "slides onto the calendar page", "firm", "KREISS-TOMKINS · GOVERNOR", "the nameplate settles", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 45)}
PLATE_AT.update({1: "lower-third", 4: "side-plate-right", 9: "side-plate-left", 16: "lower-third", 21: "side-plate-left", 26: "side-plate-right", 29: "lower-third", 32: "side-plate-right", 36: "side-plate-left", 40: "lower-third", 42: "lower-third"})
CLAIM_MAP = {1: ["c9"], 2: ["narration"], 3: ["c9"], 4: ["c1"], 5: ["c2"], 6: ["c2"], 7: ["c3"], 8: ["c3"], 9: ["c5"], 10: ["c5"],
             11: ["c6"], 12: ["c6"], 13: ["c7"], 14: ["c7"], 15: ["c7"], 16: ["c8"], 17: ["c8"], 18: ["c9"], 19: ["c10"], 20: ["c9"],
             21: ["c14"], 22: ["c14"], 23: ["narration"], 24: ["c15"], 25: ["c15"], 26: ["c11"], 27: ["c11"], 28: ["c12"], 29: ["c19"],
             30: ["c19"], 31: ["c19"], 32: ["c18"], 33: ["c18"], 34: ["c13"], 35: ["c16"], 36: ["c16"], 37: ["c17"], 38: ["c17"],
             39: ["narration"], 40: ["narration"], 41: ["narration"], 42: ["narration"], 43: ["c19"], 44: ["c16"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "ground", "gravel-lot-day", "low-lateral-along-pipe", "pipe-perspective", "assemble-build", "character-as-subject", "", "", "The faucet", "Drip coughs dust, the pipe unrolls to the horizon and one speck hangs on his lip"),
 (2, 1, "push-detail", "medium", "ground", "gravel-lot-day", "low-lateral-along-pipe", "pipe-perspective", "horizontal-traverse", "data-as-subject", "carried-element", "carry", "The announcement", "A calendar page slams on the pipe, a plaque clips on and a server hall ghosts in at the far end"),
 (3, 2, "map-territory", "medium", "eye", "pump-and-booth", "eye-level-immersive", "stacked-layers", "vertical-descent", "structure-as-subject", "carried-element", "travel", "The company", "A pump house and a booth drop in and twenty bags thud into its funnel"),
 (4, 4, "subject-portrait", "close", "eye", "gravel-lot-day", "macro-closeup", "fullbleed-split", "radial-emanate", "instrument-as-subject", "mask-wipe", "build", "The partner", "A cable car clamp locks onto the pipe and Bucket tilts to look at it"),
 (5, 5, "push-detail", "insert", "eye", "coat-check-cutaway", "cross-section-cutaway", "stacked-layers", "scroll-data", "instrument-as-subject", "carried-element", "carry", "The ticket", "The booth wall peels open into a coat check and a ticket outlasts the coat"),
 (6, 6, "alt-vantage", "close", "low", "gravel-lot-day", "dog-door-low", "pipe-perspective", "assemble-build", "data-as-subject", "match-cut", "match", "The word may", "A dog door ticket window opens under a flickering neon MAY"),
 (7, 8, "wide-establish", "wide", "low", "billboard-row", "eye-level-immersive", "grid-modular", "horizontal-traverse", "structure-as-subject", "graphic-match", "match", "The pitch", "A billboard unfurls with the CEO's line and a glass finds a blank slip"),
 (8, 10, "map-territory", "medium", "ground", "table-and-map", "overhead-flat", "grid-modular", "radial-emanate", "data-as-subject", "carried-element", "carry", "The count", "A masthead, a date stamp and seven coffee rings land on a map"),
 (9, 11, "subject-portrait", "close", "eye", "table-and-map", "instrument-screen", "hud-instrument-frame", "vertical-descent", "instrument-as-subject", "mask-wipe", "build", "The strongest case", "A plain card is held, the pipe tilts toward a Lower 48 crate and the scale pan tips"),
 (10, 12, "push-detail", "medium", "ground", "calendar-wall", "ground-level-side", "stacked-layers", "scroll-data", "data-as-subject", "carried-element", "carry", "The clock", "A wall calendar circles December 4th and a roadside sign says do it right"),
 (11, 14, "alt-vantage", "wide", "low", "calendar-wall", "low-lateral-along-pipe", "pipe-perspective", "horizontal-traverse", "data-as-subject", "graphic-match", "match", "The handover", "The calendar rips to December and a second sign swings in"),
 (12, 15, "subject-portrait", "close", "eye", "gravel-lot-day", "ground-level-side", "pipe-perspective", "assemble-build", "character-as-subject", "match-cut", "match", "The order", "Both signs point at the blank Rulebook, a key lands and a speck hangs before the cut"),
]

AMBIENT = {1: "wind over frozen lot, a sign creaks, a dry hiss", 2: "paper snaps, brass rings, wind", 3: "a pump thumps, bags thud, a flag snaps", 4: "metal dings, wind",
           5: "a ledger scratches, paper slides, a stamp thuds", 6: "a neon buzz, a motel sign flickers", 7: "a billboard flaps, the pipe thrums, paper rustles",
           8: "a table creaks, rings thud, paper settles", 9: "silence, a scale creaks", 10: "a calendar flaps, a sign creaks", 11: "pages tear, signs swing, wind", 12: "wind, a key clinks, a dry hiss, silence"}
CENTER = {i: "Drip at x700 y1000" for i in range(1, 13)}
CENTER.update({2: "the calendar at x440 y900", 4: "the clamp at x540 y1000", 7: "the billboard at x540 y960", 12: "Drip at x700 y1000", 3: "the booth at x540 y1000", 5: "Marge at x540 y980", 6: "the window at x540 y1040", 8: "the map at x540 y1000", 9: "the card at x540 y960", 10: "the calendar at x440 y920", 11: "the signs at x540 y1000"})
HERO = {
 1: ("Drip + the pipe + the COMING SOON sign", "50% Drip, 30% pipe, 20% sign"),
 2: ("calendar page + brass plaque + server hall", "45% calendar and plaque, 30% pipe, 25% hall"),
 3: ("pump house + booth + twenty bags + gauge", "50% booth and bags, 30% pump house, 20% gauge"),
 4: ("cable car clamp + Bucket + pipe", "50% clamp, 30% Bucket, 20% pipe"),
 5: ("coat check + Marge + ledger + ticket + parka", "50% Marge and counter, 30% ledger, 20% ticket"),
 6: ("dog-door window + neon MAY + pipe wall", "50% window and neon, 30% pipe wall, 20% snow"),
 7: ("billboard + speech balloon + magnifying glass + mint slip + Bucket", "45% billboard, 30% glass and slip, 25% Bucket"),
 8: ("table + masthead + date stamp + seven coffee rings + map", "50% map and rings, 30% masthead and stamp, 20% table"),
 9: ("plain card + tilting pipe end + Lower 48 crate + scale", "45% card, 35% pipe and crate, 20% scale"),
 10: ("wall calendar + meeting stub + roadside sign + Rulebook", "50% calendar, 30% sign, 20% stubs"),
 11: ("calendar + two roadside signs + plank tag", "45% calendar, 40% signs, 15% tag"),
 12: ("Drip + two signs + Rulebook + padlock key + Bucket + dust speck", "40% Drip, 30% signs and Rulebook, 30% key and Bucket"),
}
PARTS = {1: 46, 2: 44, 3: 52, 4: 42, 5: 54, 6: 44, 7: 56, 8: 50, 9: 44, 10: 46, 11: 44, 12: 52}
KICKS = (4, 24, 40)
CAMERA = {1: "dollyThrough", 2: "truckAcross", 3: "craneDown", 4: "dollyThrough", 5: "static:the peeling wall and the ticket are the move",
          6: "static:the flicker of the neon is the move", 7: "truckAcross", 8: "static:the rings stamping are the move",
          9: "static:held on purpose so the card gets no camera tricks", 10: "dollyThrough", 11: "truckAcross", 12: "dollyThrough"}

DRIP_STATES = {
 1: {"name": "bare and dry, ribbon on, one dust cough"},
 2: {"name": "plumbed in, Plural clamp on, still dry"},
 3: {"name": "tagged NO OFFERINGS YET and TERMS NOT DECIDED, rime on the brass"},
 4: {"name": "handle quarter turned, a rules plate screwed beside it"},
 5: {"name": "polished again, still dry, padlock key at his feet"},
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
        "hook": {"pattern": "anomaly-question", "frame1": "A brass spigot with a face stands at the end of a long pipe on a frozen lot, lifts its handle like a brow and coughs one puff of dust.",
                 "headline": "ALASKA BUILT THE FAUCET FIRST", "motion_by_s": 0.3,
                 "loopback": "Frame 1 is Drip coughing dust at the end of the pipe, the last frame is Drip with a padlock key at his feet and a speck hanging on his lip that does not fall, then a hard cut to black."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(42), "plant_glow_s": 0.4, "plant_sfx": "tick", "what": "What will come out of the faucet first, rules or money? Planted as a speck that hangs on the lip, paid when the speck hangs again after rules first or money first and the frame cuts to black."},
        "open_loop_2": {"plant_t": b_at(17), "pay_t": b_at(38), "what": "Does MAY become IS? Planted as a flickering neon MAY on the residents-only window, paid when the plank tag says until comprehensive rules, so the word stays a may until someone writes it down."},
        "throughline": {"object": "Drip, the brass spigot", "lands_in_button": "Drip stands polished and still dry with a padlock key at his feet and a speck on his lip before the cut",
                        "param_states": {str(k): v for k, v in DRIP_STATES.items()},
                        "states": [
                            {"at_s": b_at(1), "state": "D1 bare and dry, ribbon on, one dust cough"},
                            {"at_s": b_at(13), "state": "D2 plumbed in, Plural clamp on, still dry"},
                            {"at_s": b_at(26), "state": "D3 tagged NO OFFERINGS YET and TERMS NOT DECIDED, rime on the brass"},
                            {"at_s": b_at(36), "state": "D4 handle quarter turned, a rules plate screwed beside it"},
                            {"at_s": b_at(41), "state": "D5 polished again, still dry, padlock key at his feet"}]},
        "reveals": [
            {"t": b_at(2), "type": "scale-pullback", "what": "the pipe unrolls from Drip's neck to the horizon across the frozen lot", "hold_s": 0.8},
            {"t": b_at(9), "type": "build-on", "what": "twenty bags drop one by one into the booth's funnel", "hold_s": 0.8},
            {"t": b_at(13), "type": "build-on", "what": "the booth wall peels open into a coat check", "hold_s": 0.8},
            {"t": b_at(28), "type": "scale-pullback", "what": "seven coffee rings stamp onto a map of the Lower 48", "hold_s": 0.8},
            {"t": b_at(30), "type": "scale-pullback", "what": "the pipe's far end tilts toward a crate on the Lower 48 outline", "hold_s": 0.8}],
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
