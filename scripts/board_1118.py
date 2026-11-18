#!/usr/bin/env python3
"""2026-11-18 "Clear on Size": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1118.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1118.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
 (1, 0, 0.0, "snap", "Chalky, a dented safety-orange chalk-line reel in an olive knit earflap hat", "thunks into the Tanana valley snow, hooks a spruce and snaps a dashed ultramarine chalk line across the valley, a chalk puff blooming", "proud", "A LINE ON SIZE", "the chalk puff blooms", ""),
 (2, 0, W("line"), "whoosh", "the far end of the chalk line", "runs off into a bank of ice fog where nobody can see it end, and Chalky squints after it", "uneasy", "WHERE DOES IT END?", "Chalky squints", ""),
 (3, 1, 0.0, "scratch", "a faceless parka figure tagged MAYOR GRIER HOPKINS", "kneels and presses a chalk mark onto the line at 12", "steady", "THE MAYOR ASKED FOR 12 MONTHS", "the mark lands", ""),
 (4, 2, 0.0, "ratchet", "a row of faceless figures tagged PLANNING COMMISSION", "pull six more feet off Chalky's spool and press a mark at 18 inside a dashed border", "steady", "COMMISSION RECOMMENDS 18 MONTHS", "the spool spins", ""),
 (5, 2, W("eighteen"), "clip", "a wooden clothes peg", "snaps a small source slip onto the line", "plain", "UNANIMOUS · PER THE NEWS-MINER", "the peg snaps on", ""),
 (6, 3, 0.0, "pop", "a boxed board", "pops up out of the snow and Chalky taps it with his crank", "earnest", "NOT A VOTE ON AI", "the board pops up", ""),
 (7, 3, W("size"), "bloop", "Chalky's crank", "spins and a puff of chalk bursts into the dashed outline of a big block with a power plug", "earnest", "SIZE AND POWER", "the puff bursts", ""),
 (8, 4, 0.0, "clank", "Chalky's case", "swings open into a cutaway of three blank brass trip pins around the spool", "proud", "PROPOSED THRESHOLDS · ANY ONE OF THREE", "the case swings open", "rehook: the reel opens into its own machinery"),
 (9, 4, W("five"), "click", "a dashed hypothetical block outline", "drifts past and nudges the first pin, which swings and pops a dashed RECOMMENDED flag as its label engraves", "startled", "AT LEAST 5 MW OF POWER", "the first pin swings", ""),
 (10, 5, 0.0, "tick", "a wide flat dashed block outline", "slides up to the chalk line on the open snow and touches it, popping a dashed RECOMMENDED flag", "startled", "OR 40,000 SQ FT", "the second pin swings", ""),
 (11, 6, 0.0, "ping", "a dashed block outline with a little smokestack", "slides up beside it and touches the line, popping its own flag", "startled", "OR 5 MW MADE ON SITE", "the third pin swings", ""),
 (12, 6, W("site"), "chime", "a tall dashed outline", "slides in as the third and all three outlines pulse together at the line, three dashed flags up", "proud", "ANY ONE · PROPOSED · NOT LAW", "the pins glow", ""),
 (13, 7, 0.0, "hum", "one GVEA power line on wooden H-frame poles", "carries a spring-green pulse into a dashed 5 MW block outline on the snow", "focused", "5 MW · PER THE PLANNING DIRECTOR", "the pulse travels", ""),
 (14, 7, W("three"), "bell", "a valley of house windows along the frozen Chena", "light up row by row as the camera pulls back, while Earl the plugged-in pickup shivers and his cord sags", "awed", "5 MW · AT LEAST 3,000 HOMES", "the windows light", ""),
 (15, 8, 0.0, "roll", "the borough map", "floods sage across 97 of 100 grid squares, the chalk line now a thin stroke across it", "plain", "GENERAL USE ZONE · 97% OF THE BOROUGH · PER THE NEWS-MINER", "the flood spreads", "rehook: the whole map floods one colour and the line suddenly looks tiny"),
 (16, 8, W("borough"), "pebble", "the sage flood", "laps up against Chalky's boots and he hops up onto his own taut line to stay dry", "startled", "AND THE LINE?", "Chalky hops", ""),
 (17, 9, 0.0, "step", "a moose", "ambles across the flooded map past a hot dog cart and an outhouse without a glance", "calm", "\"ANYTHING GOES IN GENERAL USE\"", "the moose ambles", ""),
 (18, 9, W("anything"), "footstep", "a faceless parka figure tagged ANY BUILDER", "walks in from the edge of the map, reads the numbers off the chalk line and nods", "satisfied", "ANY BUILDER", "the builder nods", ""),
 (19, 9, W("use"), "swell", "a bubble over the builder", "swells holding a chalk stick and a paint can, a question mark over the can", "curious", "WHEN DOES IT TURN TO PAINT?", "the bubble swells", ""),
 (20, 10, 0.0, "boots", "Chalky", "walks along his own line under the GVEA wire, boots crunching past the spruce", "determined", "CLEAR ON SIZE", "Chalky sets off", ""),
 (21, 10, W("reaches"), "whoosh", "the ice fog ahead", "rolls across the line and swallows its far end", "uneasy", "WHERE IT REACHES?", "the fog rolls in", ""),
 (22, 11, 0.0, "clink", "the rust-brown Eielson chain-link fence", "rises across the whole frame out of the fog with only snow and spruce behind it, a sign on its outside face", "wary", "EIELSON AIR FORCE BASE", "the fence rises", "rehook: a hard cut and the chain-link fills the frame"),
 (23, 11, W("zone"), "hiss", "the chalk at the fence", "piles up gray on the outside face of the wire and the line drops slack there", "uneasy", "INSIDE THE FENCE · LIKELY NOT BOROUGH ZONING", "the line drops slack", ""),
 (24, 12, 0.0, "flap", "a pencilled board", "swings onto the outside of the wire on a string as pencil writes across it", "plain", "HOPKINS BELIEVES · PURELY GOVERNMENT PURPOSE", "the board swings in", ""),
 (25, 12, W("pause"), "creak", "the pencilled board", "turns on its string while slack gray chalk settles against the outside of the wire", "plain", "\"NOT SUBJECT\" TO THE PAUSE · NOT A RULING", "the stamp drops", ""),
 (26, 13, 0.0, "flutter", "a second dotted board", "swings onto the wire below the first with a pencil question mark", "plain", "PRIVATE USE · \"MIGHT BE DIFFERENT\"", "the dotted board swings", ""),
 (27, 14, 0.0, "pin", "a gray swatch with blank black and white halves", "pins to the outside of the wire", "curious", "\"TURN THAT GRAY AREA BLACK AND WHITE\"", "the swatch pins up", "rehook: a gray swatch with empty black and white halves pins to the wire"),
 (28, 14, W("black"), "rattle", "the wire", "shakes in the wind and gray chalk dust sifts down and settles only on the swatch's gray middle, both halves staying blank", "uneasy", "RESEARCH UNDER WAY · NO ANSWER YET", "the dust sifts", ""),
 (29, 15, 0.0, "thump", "three blank rope coils with tags", "drop one after another into the snow beside Chalky as he grips the slack line", "braced", "THE FAIR TEST · REASONS FOR TIME", "the coils drop", ""),
 (46, 15, W("real"), "clunk", "a faceless figure tagged A COMMISSIONER", "walks in carrying the first coil while Chalky grips the slack line in both mittens", "braced", "REAL REASONS", "Chalky grips", ""),
 (30, 16, 0.0, "creak", "a faceless figure tagged A COMMISSIONER", "ties a rope whose tag carries a sooty genset icon and lifts the slack, Chalky pulling with", "worried", "DIESEL GENERATORS · A COMMISSIONER'S WORRY", "the slack lifts", ""),
 (31, 17, 0.0, "page", "a figure tagged ANOTHER COMMISSIONER", "steps onto a big newspaper page laid on the snow and pulls a second rope tight", "anxious", "ANOTHER COMMISSIONER · HEARING ANXIETY", "the rope tightens", ""),
 (32, 17, W("anxiety"), "swell", "a speech balloon over the figure", "inflates over the newspaper page", "anxious", "\"ANXIETY ... OVER AI IN GENERAL\"", "the balloon swells", "rehook: the anxiety balloon swells over the page"),
 (33, 18, 0.0, "knock", "a faceless resident in a parka", "ties a third rope and the line lifts taut", "calm", "\"IT'S SMART TO TAKE THE TIME\"", "the line lifts taut", ""),
 (34, 19, 0.0, "slide", "the line past the ropes", "runs on and drops onto the snow as a long unheld slack coil, and the parka builder walks in from the other side, lifts its end and looks along it", "even", "THE OPPOSITE VIEW IS FAIR TOO", "the builder lifts the end", "rehook: the line runs on into an unheld slack coil"),
 (35, 19, W("ten"), "pop", "a marker flag", "snaps up out of the snow at month 10", "even", "RESEARCH DUE · MONTH 10", "the flag snaps up", ""),
 (36, 19, W("eighteen"), "swing", "a month 18 flag", "swings up and a bracket stretches over the unheld coil between the flags", "even", "THE EXTRA 8 MONTHS · NEITHER OUTLET SAYS WHY", "the bracket stretches", ""),
 (37, 20, 0.0, "crack", "frost on a copper stopwatch outside the borough building", "cracks off its face, the hand at zero, two sealed paint cans at its foot", "plain", "NOT LAW YET", "the frost cracks", ""),
 (38, 20, W("likely"), "thunk", "a sign", "drops onto the building's door bracket, the lit window behind clicks on and the two sealed can lids rattle", "plain", "ASSEMBLY VOTE · LIKELY JAN 14TH", "the sign drops", ""),
 (39, 20, W("clock"), "tock", "a dashed ghost hand", "sweeps one preview arc around the stopwatch and fades, the real hand staying at zero", "plain", "THE CLOCK WOULD START AT THE VOTE", "the ghost hand sweeps", ""),
 (40, 21, 0.0, "ratchet", "Chalky", "plants his feet and reels the line in through thinning fog, crank over crank", "determined", "READINESS, NOT REFUSAL, IF...", "the crank turns", ""),
 (41, 21, W("refusal"), "slide", "the three tagged ropes", "stay knotted and roll onto the spool one after another as the line pays in", "hopeful", "ONLY IF IT ENDS WITH", "the ropes lift free", ""),
 (42, 21, W("builder"), "scratch", "the line's end", "slides out of the fog bare and frayed, and a dashed chalk mark on the snow waits to be struck", "hopeful", "RULES A BUILDER CAN MEET", "the frayed end slides out", ""),
 (43, 22, 0.0, "scribble", "a second dashed chalk mark", "presses into the snow beside the first", "hopeful", "AN ANSWER AT THE FENCE", "the mark draws in", ""),
 (44, 23, 0.0, "swoosh", "the camera", "cranes up and back from Chalky to the whole valley, the line crisp across the snow and slack and gray at the outside of the far chain-link, Earl still shivering in his lot", "calm", "CLEAR ON SIZE · STILL CHALK", "the valley opens", ""),
 (45, 23, W("find"), "snap", "Chalky on the open snow", "re-hooks the same spruce and snaps the dashed line across the snow again, its far end running into the fog", "proud", "WHERE DOES IT REACH?", "the chalk puff blooms", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 47)}
PLATE_AT.update({1: "lower-third", 15: "lower-third", 29: "lower-third", 44: "lower-third"})
CLAIM_MAP = {1: ["c1"], 2: ["narration"], 3: ["c1", "c2"], 4: ["c3"], 5: ["c4"], 6: ["c21"], 7: ["c6"], 8: ["c6"], 9: ["c6"], 10: ["c7"],
             11: ["c8"], 12: ["c6", "c7", "c8"], 13: ["c9"], 14: ["c9"], 15: ["c11"], 16: ["narration"], 17: ["c12"], 18: ["c11", "c12"], 19: ["c28"], 20: ["narration"],
             21: ["narration"], 22: ["c15"], 23: ["c15"], 24: ["c16"], 25: ["c16"], 26: ["c17"], 27: ["c18"], 28: ["c18"], 29: ["narration"], 30: ["c19"],
             31: ["c20"], 32: ["c20"], 33: ["c23"], 34: ["narration"], 35: ["c5"], 36: ["c5", "c3"], 37: ["c28"], 38: ["c13"], 39: ["c13"], 40: ["narration"],
             41: ["narration"], 42: ["narration"], 43: ["c18"], 44: ["c28"], 45: ["narration"], 46: ["narration"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "extreme-wide", "high", "tanana-snowfield", "orbital-aerial", "map-territory", "horizontal-traverse", "instrument-as-subject", "", "", "The snap", "Over the Tanana valley in clear mint afterglow, a safety-orange chalk-line reel hooks a spruce and snaps a dashed line across the snow, its far end running into a bank of ice fog"),
 (2, 1, "push-detail", "close", "ground", "line-on-snow", "eye-level-immersive", "single-object-void", "push-in-only", "data-as-subject", "graphic-match", "match", "Twelve, then eighteen", "From the ground at the line, the mayor's figure presses a chalk mark at 12 and the commission row pulls six more feet off the spool and marks 18 inside a dashed border, and a peg snaps a source slip on"),
 (3, 3, "subject-portrait", "close", "eye", "snowfield-close", "eye-level-immersive", "centered-hero-lowerthird", "radial-emanate", "single-organic-hero", "match-cut", "match", "Not a vote on AI", "Chalky up close taps a NOT A VOTE ON AI board and spins his crank so a chalk puff bursts into the dashed outline of a block with a power plug"),
 (4, 4, "macro-closeup", "insert", "eye", "reel-interior", "cross-section-cutaway", "stacked-layers", "assemble-build", "instrument-as-subject", "push-in", "build", "Proposed thresholds", "Chalky's case swings open into a cutaway of three blank trip pins and a dashed hypothetical outline swings the first pin, which pops a dashed RECOMMENDED flag"),
 (5, 5, "wide-establish", "medium", "ground", "line-outlines-snow", "eye-level-immersive", "grid-modular", "radial-emanate", "multiplicity-swarm", "hard-cut", "build", "Any one of three", "Out of the reel onto the open snow, a wide flat dashed outline, then one with a smokestack, then a tall one slide up to the chalk line, each popping a dashed RECOMMENDED flag, and all three pulse together"),
 (6, 7, "wide-establish", "wide", "high", "valley-windows", "orbital-aerial", "map-territory", "radial-emanate", "landscape-as-subject", "carried-element", "carry", "At least 3,000 homes", "One GVEA power line carries a spring-green pulse into a dashed 5 MW block outline and the valley's windows light row by row while Earl the plugged-in pickup shivers in his lot"),
 (7, 8, "map-territory", "wide", "overhead", "borough-map", "top-down-map", "map-territory", "horizontal-traverse", "data-as-subject", "map-travel", "travel", "Anything goes", "The borough map floods sage across 97 of 100 squares, a moose ambles past an outhouse, and a parka builder reads the line, nods and wonders when it turns to paint"),
 (8, 10, "alt-vantage", "medium", "low", "spruce-wire-trail", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "single-organic-hero", "carried-element", "carry", "Follow the line", "From a low angle Chalky walks his line under the GVEA wire past spruce until the ice fog swallows its far end"),
 (9, 11, "wide-establish", "wide", "eye", "eielson-fence", "eye-level-immersive", "fullbleed-split", "vertical-rise", "structure-as-subject", "hard-cut", "build", "The fence", "A hard cut and the umber Eielson chain-link rises across the frame out of the fog, the chalk piling gray on its outside face and the line dropping slack there"),
 (17, 12, "push-detail", "medium", "eye", "fence-board", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "data-as-subject", "match-action", "match", "Hopkins believes", "Pushed in on the outside of the wire, a pencilled board swings on and is written HOPKINS BELIEVES, then turns on its string as slack gray chalk settles against the wire"),
 (10, 13, "push-detail", "close", "ground", "fence-outside-low", "macro-closeup", "single-object-void", "push-in-only", "structure-as-subject", "match-action", "match", "The gray swatch", "Low from the snow looking along the slack gray line to the wire, a dotted board swings on and a gray swatch with blank black and white halves pins up while chalk dust sifts down"),
 (11, 15, "wide-establish", "wide", "low", "rope-field", "eye-level-immersive", "stacked-layers", "vertical-rise", "single-organic-hero", "hard-cut", "build", "The fair test", "On open snow three rope coils drop beside Chalky, and a commissioner figure with a genset icon on the rope tag lifts the slack line while Chalky pulls with"),
 (12, 17, "alt-vantage", "medium", "high", "newspaper-page", "top-down-map", "grid-modular", "assemble-build", "multiplicity-swarm", "carried-element", "carry", "On the page", "From above, a second commissioner steps onto a big newspaper page laid on the snow and pulls a rope tight as an anxiety balloon swells, and a resident ties a third rope"),
 (13, 19, "data-panel", "wide", "eye", "timeline-strip", "exploded-diagram", "map-territory", "scroll-data", "data-as-subject", "carried-element", "carry", "The extra eight", "The line runs on into an unheld slack coil on the snow, the builder picks up its end, and flags snap up at month 10 and month 18 with a bracket over the coil"),
 (14, 20, "two-up", "medium", "eye", "borough-building-steps", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "mask-wipe", "build", "Not law yet", "Frost cracks off a copper stopwatch at zero outside the borough building, two sealed paint cans at its foot, a vote sign drops and a dashed ghost hand previews a sweep"),
 (15, 21, "push-detail", "close", "ground", "fog-line-end", "eye-level-immersive", "single-object-void", "horizontal-traverse", "single-organic-hero", "match-action", "match", "Reel it in", "From the ground Chalky reels the line in through thinning fog, the ropes lift free, the end slides out bare and frayed and two dashed chalk marks wait on the snow"),
 (16, 23, "wide-establish", "extreme-wide", "high", "tanana-snowfield", "orbital-aerial", "map-territory", "vertical-rise", "instrument-as-subject", "match-cut", "match", "Clear on size", "The camera cranes up from Chalky to the whole valley, the line crisp across the snow and slack and gray at the outside of the far chain-link, Earl still shivering, and Chalky re-snaps it"),
]

AMBIENT = {17: "wind through chain-link, string creak", 1: "wind over snow, a far dog bark", 2: "a close cold breeze, chalk grit", 3: "a close cold breeze", 4: "a ticking spool, a hum", 5: "a ticking spool, a hum",
           6: "a power line hum, a far car", 7: "map rustle, a moose's crunch", 8: "wind in spruce, a wire hum", 9: "wind through chain-link", 10: "wind through chain-link, sifting dust",
           11: "wind over open snow, rope creak", 12: "paper flutter, wind", 13: "a hush, wind", 14: "a power line hum, a door", 15: "fog hush, a ratchet", 16: "wind over snow, a far dog bark"}
CENTER = {17: "the board at x540 y960", 1: "the line at x540 y1100", 2: "the marks at x540 y1080", 3: "Chalky at x540 y1060", 4: "the pins at x540 y960", 5: "the pins at x540 y960",
          6: "the windows at x540 y1000", 7: "the map at x540 y980", 8: "Chalky at x480 y1120", 9: "the fence at x540 y1000", 10: "the swatch at x620 y980",
          11: "Chalky at x430 y1120", 12: "the page at x540 y1000", 13: "the coil at x540 y1040", 14: "the stopwatch at x380 y980", 15: "the frayed end at x600 y1080", 16: "the line at x540 y1100"}
HERO = {
 1: ("Chalky + dashed line + spruce + ice fog", "40% line and reel, 35% valley, 25% fog and sky"),
 2: ("chalk marks on the line + mayor figure + commission row + peg + source slip", "45% line and marks, 35% figures, 20% peg and slip"),
 3: ("Chalky close + NOT A VOTE ON AI board + chalk puff block", "55% Chalky, 25% board, 20% puff"),
 4: ("reel cutaway + trip pins + dashed outline + dashed flag", "50% pins and spool, 30% outline, 20% flag"),
 5: ("chalk line on snow + wide flat outline + smokestack outline + tall outline + flags", "40% outlines, 35% line, 25% flags"),
 17: ("pencilled board + outside of the wire + slack gray chalk", "45% board, 35% wire, 20% chalk"),
 6: ("GVEA power line + dashed 5 MW outline + house windows + Earl", "40% windows, 30% line and outline, 30% Earl and lot"),
 7: ("borough map + sage flood + moose + outhouse + builder + bubble", "45% map, 30% moose and props, 25% builder"),
 8: ("Chalky walking + chalk line + GVEA wire + spruce + ice fog", "40% Chalky and line, 35% trail, 25% fog"),
 9: ("umber chain-link fence + gray chalk + slack line", "50% fence, 30% chalk, 20% line"),
 10: ("slack gray line + wire + dotted board + gray swatch + dust", "40% line and wire, 30% board, 30% swatch"),
 11: ("Chalky + slack line + rope coils + commissioner figure + genset icon", "40% Chalky and line, 35% figure and rope, 25% coils"),
 12: ("newspaper page + commissioner figure + speech balloon + resident", "40% page, 35% figures, 25% balloon"),
 13: ("unheld slack coil + builder + month flags + bracket", "45% coil, 30% flags and bracket, 25% builder"),
 14: ("copper stopwatch + sealed paint cans + vote sign + ghost hand + borough building", "40% stopwatch, 30% cans, 30% building"),
 15: ("Chalky reeling + ropes + frayed end + chalk marks + fog", "40% Chalky, 30% end and marks, 30% fog and ropes"),
 16: ("valley + dashed line + far chain-link + Earl + Chalky", "40% line, 35% valley, 25% fence and lot"),
}
PARTS = {17: 44, 1: 52, 2: 46, 3: 56, 4: 50, 5: 46, 6: 54, 7: 48, 8: 50, 9: 46, 10: 44, 11: 52, 12: 46, 13: 42, 14: 46, 15: 48, 16: 54}
KICKS = (1, 22, 40)
CAMERA = {17: "dollyThrough", 1: "craneDown", 2: "dollyThrough", 3: "dollyThrough", 4: "dollyThrough", 5: "static:the cutaway rotates while the pins swing",
          6: "craneDown", 7: "static:a locked overhead of the map while it floods", 8: "truckAcross", 9: "dollyThrough", 10: "truckAcross",
          11: "truckAcross", 12: "static:a locked overhead of the page while ropes tighten", 13: "truckAcross", 14: "dollyThrough", 15: "truckAcross+riseWith", 16: "riseWith"}

PALETTE = ("clear mint afterglow #BFE3D2 at the horizon rising through sea-glass #7DB7AE to deep lagoon #3E6E78, "
           "lilac-white snowfield #EEEAF4 with mauve skylight shade #B9A9C9, ice fog #E4E2EA at the fence, spruce #22433A, "
           "a safety-orange reel #E8582A with brass #C9A04A and an olive knit hat #5E7A3A, surveyor's ultramarine chalk #2F5FD0 kept to the line, "
           "neutral pewter #8F9096 kept to the chalk at the fence, weathered umber-brown wire #6B4A36, a dusty sage flood #A9BE9A, spring-green grid pulse #3FCB73, sealed charcoal and chalk-white cans")


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
        "run_date": "2026-11-18", "slug": "clear-on-size", "title": "Clear on Size",
        "concept": ("The Fairbanks North Star Borough Planning Commission recommended stretching Mayor Grier Hopkins' proposed 12-month pause on permits for large data centers to 18 months. "
                    "Per the News-Miner any one of three thresholds would trip it, at least 5 MW of power, 40,000 square feet or 5 MW made on site, and the planning director says 5 MW can power at least 3,000 homes, in a borough where the general use zone covers 97 percent of the land and anything goes. "
                    "The line is clear on size before anyone knows where it reaches: the borough likely can't zone inside the Eielson Air Force Base fence, Hopkins believes a purely government-purpose data center would not be subject to the pause, private use might be different, and the borough is researching how to turn that gray area black and white. "
                    "The fair test gives the reasons for time a full scene (diesel generators, anxiety over AI in general, a resident's call to take the time) and the opposite view the same weight (research due at month 10, the pause running 18, neither outlet says why). Nothing is law yet; the Assembly vote is likely January 14th. "
                    "Drawn as Chalky, a faced safety-orange chalk-line reel snapping a dashed ultramarine line across the Tanana valley in a sunless mint afterglow, a cutaway of three PROPOSED trip pins tripped by dashed outlines, a map flooded sage, the chalk piling gray and going slack at the outside of the umber Eielson chain-link, three owned ropes lifting the slack line while an unheld coil carries the extra 8 months, a frosted stopwatch at zero with two sealed paint cans, and a reel-in to a bare frayed end beside two unstruck chalk marks."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "vertical-rise", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "editorial-schematic", "palette": PALETTE, "camera_strategy": "rise-reveal",
                        "light_story": "a clear bright afterglow afternoon with the sun already set, a mint horizon and soft skylight over lilac snow, the light softening into milky fog only at the Eielson fence and the clear afterglow returning for the reel-in and the crane-up",
                        "metaphor": "a surveyor's chalk-line reel that snaps a clear line on size, finds it slack at a fence it can't cross, and reels it in to see what its end still needs"}, "signature_shot": 16,
        "palette": PALETTE,
        "divergence_note": ("The last films were open North Slope tundra in polar night and midnight-sun honey with a crowd of faced decision trees and radar lime (11-16), rain-black Juneau night at one door with a gunmetal letterbox under a sodium lamp and pencilled vellum (11-15), "
                            "a rose-line dusk dome over a survey stake pulled by three parties and watched by a raven (11-12), and a pink-gold ice-fog noon in Fairbanks with a roof puck (11-11). "
                            "This film is a clear mint-afterglow afternoon with no sun over lilac snow and sage, its hero ONE small safety-orange surveyor's tool that moves through the valley drawing a line, its signal colour ultramarine chalk, its fence rust-brown, and fog only at the fence. "
                            "Honest overlaps: 11-12 also had people pulling on something, answered by ropes that LIFT a slack line with the hero pulling with them, owned reasons, and no stake, tag or raven; 11-11 was also Fairbanks, answered by a sunless afterglow instead of a pink-gold sun in fog; "
                            "11-15 drew proposals dashed, answered by snapped chalk with powder and string texture and never pencil on vellum; 10-29 ended on blank shipping tags, answered here by a bare frayed line end and unstruck chalk marks; 10-23's rule stopped at a fence, answered by chalk that piles at the outside of the wire and goes slack. "
                            "The hero's safety orange is pushed away from 11-16's thermometer red."),
        "treatment": {"title": "Clear on Size", "summary": ad["treatment"],
                      "judge_reasoning": json.loads((OUT / "treatment.json").read_text())["reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "anomaly-question", "frame1": "A clear mint afterglow over the Tanana valley snow, no sun, a bank of ice fog far off, and at 0.3 s a safety-orange chalk-line reel in an olive knit hat thunks into the snow, hooks a spruce and snaps a dashed ultramarine line across the valley with a chalk puff",
                 "headline": "A LINE ON SIZE", "motion_by_s": 0.4,
                 "loopback": "Frame 1 is the reel snapping the line across the snow with its far end lost in fog; the last image is the same reel re-snapping the same line from the same spruce, the far end still running into the fog."},
        "open_loop": {"plant_t": b_at(2), "pay_t": b_at(42), "plant_glow_s": 0.4, "plant_sfx": "whoosh", "what": "Where does the line end? Planted when the snapped line's far end runs off into a bank of ice fog under WHERE DOES IT END?, kept as the fog swallowing the line on the walk and the line going slack at the outside of the Eielson wire, paid when Chalky reels the line in and its end slides out of the fog bare and frayed while two dashed chalk marks wait on the snow to be struck, RULES A BUILDER CAN MEET and AN ANSWER AT THE FENCE."},
        "open_loop_2": {"plant_t": b_at(19), "pay_t": b_at(38), "what": "When does it turn to paint? Planted as a bubble over the parka builder holding a chalk stick and a paint can with a question mark over the can, kept as two sealed paint cans at the foot of a frosted stopwatch at zero under NOT LAW YET, paid when the vote sign ASSEMBLY VOTE · LIKELY JAN 14TH drops and the sealed can lids rattle, so the cans visibly key to the vote."},
        "throughline": {"object": "Chalky's dashed ultramarine chalk line", "lands_in_button": "the same dashed line crisp across the valley and slack and gray at the outside of the far chain-link, re-snapped as chalk",
                        "states": [
                            {"at_s": b_at(1), "state": "L1 snapped clean across the snow, its far end lost in fog"},
                            {"at_s": b_at(4), "state": "L2 marked at 12 and pulled out to 18 inside a dashed border"},
                            {"at_s": b_at(15), "state": "L3 a thin stroke across a map flooded sage"},
                            {"at_s": b_at(23), "state": "L4 piled gray at the outside of the wire and dropped slack"},
                            {"at_s": b_at(33), "state": "L5 lifted taut by three owned ropes, Chalky pulling with"},
                            {"at_s": b_at(34), "state": "L6 running on into an unheld slack coil past month 10"},
                            {"at_s": b_at(42), "state": "L7 reeled in, the end bare and frayed, two marks unstruck"},
                            {"at_s": b_at(45), "state": "L8 re-snapped as chalk, its end still in the fog"}]},
        "reveals": [
            {"t": b_at(8), "type": "build-on", "what": "the reel's case swings open into a cutaway of three trip pins", "hold_s": 0.8},
            {"t": b_at(14), "type": "scale-pullback", "what": "the camera pulls back as the valley's windows light row by row from one power line", "hold_s": 0.8},
            {"t": b_at(15), "type": "morph-to-chart", "what": "the borough map floods sage across 97 of 100 squares", "hold_s": 0.8},
            {"t": b_at(22), "type": "scale-pullback", "what": "a hard cut and the Eielson chain-link rises across the whole frame", "hold_s": 0.8},
            {"t": b_at(27), "type": "build-on", "what": "a gray swatch with blank black and white halves pins to the outside of the wire", "hold_s": 0.8},
            {"t": b_at(34), "type": "build-on", "what": "the line runs on into a long unheld slack coil on the snow", "hold_s": 0.8},
            {"t": b_at(44), "type": "scale-pullback", "what": "the camera cranes up from Chalky to the whole valley and the far chain-link", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.7}, {"line": 4, "offset": 0.0, "level": 1.2}, {"line": 8, "offset": 0.0, "level": 0.8},
            {"line": 10, "offset": 0.0, "level": 1.5}, {"line": 15, "offset": 0.0, "level": 0.6}, {"line": 19, "offset": 0.0, "level": 1.6},
            {"at_s": round(b_at(45) - 0.5, 3), "level": 0.12}, {"at_s": round(b_at(45) + 0.5, 3), "level": 1.4},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(45) - 0.5, 3), "riser_at": round(b_at(40), 3), "silence_at": round(b_at(45) - 0.5, 3),
            "payoff_at": b_at(45), "button_pattern": "callback", "interrupt_at": b_at(29), "extra_dips": []},
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
    book.raise_if_missing("board_1118 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1118Ids.ts").write_text(
        "// GENERATED by scripts/board_1118.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
