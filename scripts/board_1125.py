#!/usr/bin/env python3
"""2026-11-25 "The Other Track": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1125.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1125.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
SW = "the faceless cast-iron switch stand at the fork near Houston, spruce and birch under the Talkeetna Mountains"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "clank", SW, "throws its lever hard over toward the short closed AIDEA BOARD branch and powder jumps off the rail", "steady", "12 DAYS TO THE HANDOFF", "powder jumps off the rail", ""),
 (40, 0, W("governors"), "whoosh", "a gust of powder", "rolls across both branches and settles in the ties", "curious", "NEAR HOUSTON · MAT-SU", "the powder settles", ""),
 (2, 0, W("boardroom"), "tick", "a lit window card on the buffer stop at the end of the short AIDEA BOARD branch", "flicks on warm and its glow lands on the snow", "curious", "AIDEA BOARD", "the window card glows", ""),
 (3, 0, W("elsewhere"), "clunk", "the switch stand's amber lamp", "flares while its long low-sun shadow stretches down the open branch past a milepost sign that swings out", "alert", "DNR · STATE LAND NEAR HOUSTON", "the milepost sign swings", ""),
 (4, 1, 0.0, "footstep", "a faceless Suit with a boxed name card KREISS-TOMKINS on the station platform", "walks in from frame left and stops by a slat date board", "steady", "GOVERNOR-ELECT · JONATHAN KREISS-TOMKINS", "the coat sways as he stops", ""),
 (5, 1, W("December"), "clack", "the slat date board on the platform post", "slams its slats over one by one to DEC 7TH and the post shudders", "steady", "TAKES OFFICE DECEMBER 7TH", "the post shudders", ""),
 (6, 2, W("postpone"), "paper", "the KREISS-TOMKINS Suit", "clips a paper order onto the tall train-order hoop beside the AIDEA BOARD track and steps back to wait", "steady", "\"POSTPONE FURTHER ACTION\"", "the order flutters in the hoop", ""),
 (7, 2, 0.0, "clink", "a brass plate on the platform post", "swings out on its bracket", "steady", "AIDEA · A PUBLIC CORPORATION OF THE STATE", "the plate swings", ""),
 (8, 3, 0.0, "door", "the walnut boardroom door", "swings shut and its sign flips to CLOSED SESSION", "uneasy", "CLOSED SESSION", "the sign swings", ""),
 (9, 3, 0.2, "whirr", "the faceless wall clock", "spins its hands from 10 round to 3", "tense", "10 A.M. TO 3 P.M. · NO ACTION", "the hands blur", ""),
 (10, 3, W("Friday"), "thunk", "a card on the walnut table", "drops onto the walnut table and lands beside a foil-covered pie, which jumps", "wry", "RESUMES FRIDAY · NOVEMBER 27TH · 10 A.M.", "the foil crinkles", ""),
 (11, 4, 0.0, "rumble", "a plain faceless grey diesel pulling boxcars stencilled ARCTIC REFUGE (ANWR), AMBLER and PORT MACKENZIE", "rolls along the closed AIDEA BOARD branch and out of frame", "steady", "PENDING AGENDA", "the cars sway", ""),
 (12, 4, W("Ambler"), "rattle", "the switch stand's lever", "rattles in its keeper, still set to AIDEA BOARD, as the cars pass", "uneasy", "ANWR · AMBLER · PORT MACKENZIE", "the lever shivers", ""),
 (13, 4, W("item"), "squeak", "the last car's free coupler", "swings loose as the train clears and the AIDEA BOARD branch behind it lies bare to the buffer stop", "puzzled", "NO DATA CENTER ITEM", "the coupler swings", "rehook: the agenda train clears and the closed branch behind it lies bare to the buffer stop, NO DATA CENTER ITEM"),
 (14, 5, 0.0, "clack", "a boxcar stencilled ALASKA DATA CORP on a yard spur on the AIDEA side", "is already rolling out of the yard, its taillight shrinking", "steady", "ALASKA DATA CORP · AIDEA-OWNED · FORMED IN MARCH", "the taillight blinks and powder kicks off the wheels", ""),
 (15, 5, W("twenty"), "coins", "a coin sack tagged $20M", "thumps onto the boxcar's tail platform as it rolls", "steady", "$20M · BOARD VOTE · PER ADN", "the car dips on its springs", ""),
 (16, 6, 0.0, "slide", "a painted billboard on the station platform facing the yard", "swings up into view on its two posts", "curious", "PLURAL CEO · STATE'S PLATFORM PARTNER", "the board settles on its posts", ""),
 (41, 6, W("infrastructure"), "scratch", "the painted quote", "rolls onto the billboard word by word", "curious", "\"ONE OF THE LARGEST CAPITAL NEEDS IN A GENERATION\" · PLURAL CEO, ON AI", "paint glints", ""),
 (17, 6, W("generation"), "stamp", "an amber THE PITCH stamp", "slams onto the billboard corner", "wry", "THE PITCH · NOT A PROJECT", "the board shudders", ""),
 (18, 7, 0.0, "page", "a land plat of the Mat-Su with the Susitna River, pinned to a board by the tracks", "unrolls showing the pencilled 6,800 acre parcel near Houston", "steady", "DNR · NOVEMBER 10TH", "the paper curls", ""),
 (19, 7, W("hundred"), "pin", "four push pins", "press into the plat's corners one after another as the parcel shades in", "steady", "6,800 ACRES · NEAR HOUSTON · NO COST · DNR, NOVEMBER 10TH", "the paper flattens", ""),
 (20, 8, 0.0, "pop", "three small use cards", "spring up out of the snow on stakes one by one and land upright", "curious", "LOGISTICS · MANUFACTURING · \"SCALABLE DATA CENTERS\" · AIDEA, JULY · PER ALASKA BEACON", "the cards wobble", ""),
 (21, 8, W("scalable"), "swing", "the switch points beside the parcel", "slide over toward a siding that curves out of sight behind the birch", "puzzled", "COULD HOST", "the points clunk home", ""),
 (22, 9, 0.0, "clank", SW, "throws its lever with an overshoot and the target disc turns so its long shadow sweeps across both branches and settles on the open DNR track", "resolved", "THE LAND'S CLOCK", "the lamp flares amber", "rehook: the switch throws and the disc's long shadow swings onto the open track as the lamp flares"),
 (23, 9, W("November"), "clink", "an amber station sign on the DNR branch", "swings down on its chains as the lamp glows", "alert", "RECONSIDERATION DUE NOVEMBER 30TH · DNR HAS 30 DAYS", "the chains sway", ""),
 (24, 10, 0.0, "thud", "12 ties on the short AIDEA BOARD branch", "lay on one by one to the buffer stop marked DECEMBER 7TH", "steady", "12 DAYS TO DECEMBER 7TH", "each tie thuds into the snow", ""),
 (25, 10, W("Thirty"), "thump", "5 bare ties then 30 laid ties on the open DNR branch", "lay one by one past the DECEMBER 7TH mark and off the frame edge as the view pulls wide", "tense", "30 DAYS FROM NOVEMBER 30TH", "the rails run off the edge", ""),
 (26, 10, W("could"), "ding", "an amber signal lamp at the DECEMBER 7TH mark", "lights the word COULD", "uneasy", "COULD LAND UNDER THE NEXT GOVERNOR", "the lamp pulses", ""),
 (27, 11, 0.0, "footstep", "the faceless KREISS-TOMKINS Suit, the switch stand small far behind with its lever still on DNR and its amber lamp blinking", "steps past the DECEMBER 7TH post and lifts a card", "steady", "MORATORIUM UNTIL RULES · PER ADN", "the card catches the sun", ""),
 (28, 11, W("team"), "flutter", "a blank question tag on the parcel stake", "swings on its nail and spins while the Suit looks from his card to it and does not reach", "unsure", "REVERSE THE TRANSFER? HIS TEAM HASN'T SAID", "the tag twists", ""),
 (29, 12, 0.0, "thock", "a faceless Suit with a name card RANDY RUARO at the AIDEA buffer stop under the lit window card", "sets a thick binder stack on the buffer and squares its edges", "steady", "RANDY RUARO · AIDEA EXECUTIVE DIRECTOR", "the binders thump down", ""),
 (42, 12, W("rapidly"), "page", "the binder stack's page tabs", "flutter as the RUARO Suit taps the stack square", "steady", "\"NOT RAPIDLY MOVING THROUGH PROJECTS WITHOUT DUE DILIGENCE\" · RANDY RUARO", "the tabs settle", ""),
 (31, 13, 0.0, "clank", "three flatcars stencilled ACRES on the open siding", "uncouple, two rolling away and one staying", "steady", "NEARLY 20,000 TO 6,800 ACRES", "the couplers clank", ""),
 (32, 13, W("acres"), "chain", "a coupler chain tagged REVERSION CLAUSE from the one ACRES car to a STATE OF ALASKA post", "draws taut but does not pull", "steady", "REVERSION CLAUSE · BACK TO THE STATE IF NOT DEVELOPED", "the chain hums taut", ""),
 (46, 13, W("reverts"), "stamp", "a DNR stamp", "lands on the ACRES car's plat card", "steady", "THE TRANSFER · NOT THE USE · DNR, PER MAT-SU SENTINEL", "the card jumps", ""),
 (33, 14, 0.0, "thump", "canvas mail sacks", "drop one after another onto a freight scale and the view rises to show sacks stacked down the whole platform", "steady", "2,300+ COMMENTS", "the scale needle swings", "rehook: canvas mail sacks drop one after another onto a freight scale"),
 (43, 14, W("opposed"), "ratchet", "the freight scale needle", "swings hard toward MOSTLY OPPOSED and bounces", "steady", "MOSTLY OPPOSED", "the needle bounces", ""),
 (34, 14, W("Borough"), "paper", "an envelope stamped MAT-SU BOROUGH", "slides onto the pile and its letter unfolds with a hand-drawn arrow to POINT MACKENZIE INSTEAD while the switch stand at mid-ground shivers in its DNR notch", "steady", "MAT-SU BOROUGH · REQUEST TO RECONSIDER", "the letter flaps", ""),
 (35, 15, 0.0, "slide", "an empty boxcar coupled ahead of the one ACRES car on the open siding", "rolls its doors open on nothing inside", "puzzled", "NO TENANT · NO POWER SOURCE · NO COOLING · NO SCHEDULE · AIDEA, JULY", "dust drifts in the empty car", ""),
 (44, 15, W("cooling"), "hiss", "a puff of air-brake exhaust", "blows through the empty car and out the far door", "puzzled", "NO COOLING · NO SCHEDULE", "dust swirls", ""),
 (36, 16, 0.0, "thunk", "new ties stencilled RULES", "lay themselves ahead of the empty boxcar, which waits", "hopeful", "\"HAS NOT IDENTIFIED A SPECIFIC PROJECT\" · AIDEA", "frost breath at the coupling", ""),
 (37, 17, 0.0, "click", "the boardroom window card at the buffer stop", "flicks on bright with FRIDAY in ivory", "steady", "FRIDAY", "the card glows", ""),
 (45, 17, W("November"), "clink", "the second switch's lever", "begins a slow lean toward RULES FIRST as its lamp lights", "steady", "NOVEMBER 30TH", "far off, the amber NOVEMBER 30TH sign swings on its chains and glows", ""),
 (38, 17, W("first"), "creak", "a second switch stand where the open branch splits again past the siding points, one leg laid with RULES ties and the other holding the empty boxcar", "stops its slow swing caught mid-throw between the RULES FIRST leg and the TENANT FIRST leg", "unsure", "RULES OR A TENANT?", "the lever trembles", ""),
 (39, 17, W("rules"), "hiss", "the second switch's lever, holding mid-throw, with the main stand small behind still on DNR and its lamp flaring", "trembles as a gust of powder rolls across both legs and lands on it", "steady", "WHICH FIRST?", "powder lands on the lever", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 60)}
PLATE_AT.update({1: "lower-third", 22: "lower-third", 38: "lower-third"})
CLAIM_MAP = {1: ["c1"], 2: ["c4"], 3: ["c20"], 4: ["c1"], 5: ["c1"], 6: ["c2"], 7: ["c4"], 8: ["c12"], 9: ["c12"], 10: ["c13"],
             11: ["c36"], 12: ["c36"], 13: ["c36"], 14: ["c9"], 15: ["c10"], 16: ["c37"], 17: ["c37"], 18: ["c20"], 19: ["c20"], 20: ["c22"],
             21: ["c22"], 22: ["c32"], 23: ["c32"], 24: ["c1"], 25: ["c32"], 26: ["c32", "c1"], 27: ["c11"], 28: ["c34"], 29: ["c15"], 
             31: ["c21", "c20"], 32: ["c26"], 33: ["c28"], 34: ["c30"], 35: ["c24"], 36: ["c25"], 37: ["c13"], 38: ["narration"], 39: ["narration"], 40: ["c20"], 41: ["c37"], 42: ["c15"], 43: ["c28"], 44: ["c24"], 45: ["c32"], 46: ["c35"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "alt-vantage", "wide", "low", "fork-noon", "low-angle-heroic", "centered-hero-lowerthird", "radial-emanate", "structure-as-subject", "", "", "The fork", "Low and wide at a rail fork in noon snow near Houston, a faceless switch stand throws its lever toward the short closed AIDEA BOARD branch, a window card glows at its buffer, and the lamp flares as the disc's shadow points down the open DNR branch"),
 (2, 1, "subject-portrait", "medium", "eye", "platform", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "whip-pan", "carry", "The request", "On the station platform the KREISS-TOMKINS Suit walks to a slat date board that clacks to DEC 7TH and clips a POSTPONE order onto the train-order hoop by the AIDEA BOARD track"),
 (3, 3, "push-detail", "medium", "eye", "boardroom", "eye-level-immersive", "stacked-layers", "push-in-only", "structure-as-subject", "hard-cut", "build", "Closed session", "In the Anchorage boardroom the door shuts on CLOSED SESSION, the wall clock spins 10 to 3 and a RESUMES FRIDAY card slaps down beside a pie"),
 (4, 4, "two-up", "wide", "eye", "agenda-cut", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "multiplicity-swarm", "hard-cut", "travel", "The agenda", "A grey diesel pulls ARCTIC REFUGE (ANWR), AMBLER and PORT MACKENZIE boxcars along the closed branch while the switch lever rattles, then the train clears and leaves the branch bare to the buffer stop, NO DATA CENTER ITEM"),
 (5, 5, "map-territory", "extreme-wide", "high", "aidea-yard", "top-down-map", "map-territory", "vertical-descent", "structure-as-subject", "hard-cut", "travel", "Already voted", "From above, in the AIDEA yard, the ALASKA DATA CORP boxcar rolls out along its own spur and a $20M coin sack thumps onto its tail platform"),
 (6, 6, "alt-vantage", "medium", "low", "billboard", "low-angle-heroic", "single-object-void", "vertical-rise", "data-as-subject", "graphic-match", "carry", "The pitch", "Low on the station platform a billboard facing the yard swings up, the Plural CEO quote rolls on word by word and an amber THE PITCH stamp slams on"),
 (7, 7, "data-panel", "close", "eye", "plat-board", "macro-closeup", "single-object-void", "assemble-build", "data-as-subject", "hard-cut", "build", "The land", "A land plat of the Mat-Su by the tracks unrolls the pencilled 6,800 acre parcel near Houston and pins press into its corners"),
 (8, 8, "push-detail", "medium", "high", "parcel-siding", "exploded-diagram", "stacked-layers", "assemble-build", "landscape-as-subject", "graphic-match", "match", "Could host", "Three use cards spring up on the parcel and the switch points slide toward a siding that curves out of sight behind the birch"),
 (9, 9, "subject-portrait", "wide", "low", "fork-signature", "low-angle-heroic", "centered-hero-lowerthird", "radial-emanate", "structure-as-subject", "match-cut", "carry", "The land's clock", "Low and wide at noon the switch throws, the disc's long shadow sweeps across both branches and settles on the open DNR track, the amber lamp flares and the reconsideration sign swings down"),
 (10, 10, "map-territory", "extreme-wide", "high", "tie-count", "top-down-map", "grid-modular", "horizontal-traverse", "data-as-subject", "graphic-match", "build", "Count the ties", "From above 12 ties lay to the AIDEA buffer at DECEMBER 7TH, then 5 bare and 30 laid ties run the DNR branch past the mark, and an amber lamp lights COULD"),
 (11, 11, "two-up", "medium", "eye", "past-the-mark", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "hard-cut", "carry", "Moratorium", "The KREISS-TOMKINS Suit steps past the DECEMBER 7TH post, the switch stand blinking amber far behind, with a MORATORIUM UNTIL RULES card and looks to a parcel stake whose blank question tag spins, and does not reach"),
 (12, 12, "subject-portrait", "close", "low", "aidea-buffer", "low-angle-heroic", "centered-hero-lowerthird", "vertical-rise", "single-organic-hero", "whip-pan", "carry", "Due diligence", "At the AIDEA buffer stop under the lit window card the RANDY RUARO Suit sets a binder stack down, squares it and rests a hand on it as his quote holds"),
 (13, 13, "push-detail", "medium", "eye", "acres-cars", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "hard-cut", "build", "Cut and tied back", "Three ACRES flatcars uncouple to one, its REVERSION CLAUSE chain to a STATE OF ALASKA post draws taut without pulling, and a DNR stamp lands on the plat card"),
 (14, 14, "data-panel", "medium", "eye", "freight-scale", "eye-level-immersive", "hud-instrument-frame", "vertical-descent", "multiplicity-swarm", "hard-cut", "build", "The other side", "Mail sacks drop onto a freight scale as the camera rises to sacks stacked down the platform, the needle bounces to MOSTLY OPPOSED and a MAT-SU BOROUGH request to reconsider lands on top while the switch stand at mid-ground shivers in its DNR notch"),
 (15, 15, "push-detail", "close", "eye", "empty-car", "eye-level-immersive", "single-object-void", "assemble-build", "structure-as-subject", "graphic-match", "match", "Nothing inside", "An empty boxcar with the ACRES car behind it on the open siding rolls its doors open on nothing, then RULES ties lay ahead of it as it waits"),
 (16, 17, "alt-vantage", "wide", "low", "fork-button", "low-angle-heroic", "centered-hero-lowerthird", "radial-emanate", "structure-as-subject", "match-cut", "carry", "Which first", "Low where the open branch splits again past the siding points, a second switch in the foreground swings slowly between a RULES FIRST leg laid with ties and a TENANT FIRST leg where the empty boxcar waits on bare roadbed with no ties under it and stops caught mid-throw, the main stand small behind still on DNR, the FRIDAY window card and the amber NOVEMBER 30TH sign glowing far off"),
]

AMBIENT = {1: "light wind over snow, wire hum", 2: "platform wind, a far horn", 3: "a quiet room, a clock tick", 4: "a passing train, wind", 5: "wind over snow, a far train",
           6: "wind over snow", 7: "wind, paper", 8: "wind over snow", 9: "wind, wire hum", 10: "wind over snow", 11: "wind over snow, a far horn",
           12: "wind, a dripping tower", 13: "couplers, wind", 14: "wind, canvas", 15: "wind in an empty car", 16: "light wind over snow, wire hum"}
CENTER = {1: "the switch stand at x540 y1060", 2: "the Suit and the hoop at x520 y980", 3: "the clock and the door at x600 y860", 4: "the agenda cut at x540 y1000",
          5: "the boxcar on the yard spur at x600 y1000", 6: "the billboard at x540 y880", 7: "the plat at x540 y960", 8: "the parcel and siding at x540 y980",
          9: "the switch stand at x540 y1040", 10: "the two branches at x540 y960", 11: "the Suit and the stake at x540 y1000", 12: "the Suit and the binder stack at x600 y1100",
          13: "the ACRES cars at x540 y1040", 14: "the scale at x540 y1040", 15: "the empty boxcar at x540 y1020", 16: "the second switch stand at x540 y1180"}
HERO = {
 1: ("switch stand + track fork + buffer stop window card + open branch", "45% switch, 35% fork, 20% far world"),
 2: ("Suit + slat date board + train-order hoop + brass plate", "45% Suit, 30% hoop, 25% board"),
 3: ("boardroom door + wall clock + table card + pie", "40% clock, 35% door, 25% table"),
 4: ("diesel + boxcars + free coupler + buffer stop + switch lever", "50% train, 30% switch, 20% world"),
 5: ("yard spur + boxcar + coin sack", "45% track, 35% car, 20% world"),
 6: ("billboard + painted quote + stamp + platform", "60% billboard, 25% stamp, 15% track"),
 7: ("land plat + parcel + push pins", "60% plat, 25% outline, 15% board"),
 8: ("parcel + use cards + switch points + empty siding", "40% parcel, 35% cards, 25% siding"),
 9: ("switch stand + disc shadow + both branches + amber sign", "45% switch, 35% shadow, 20% sign"),
 10: ("two branches + ties + buffer + amber lamp", "50% ties, 30% branches, 20% lamp"),
 11: ("Suit + card + parcel stake + question tag", "45% Suit, 30% stake, 25% mark"),
 12: ("Suit + binder stack + buffer stop + window card", "45% Suit, 30% binders, 25% buffer"),
 13: ("ACRES flatcars + coupler chain + state post", "50% cars, 30% chain, 20% post"),
 14: ("freight scale + mail sacks + envelope + switch stand far behind", "45% sacks, 35% scale, 20% letter and switch"),
 15: ("empty boxcar + RULES ties + open siding", "50% car, 35% ties, 15% siding"),
 16: ("second switch stand + RULES FIRST leg + TENANT FIRST leg + empty boxcar + main stand behind + two signs", "45% second switch, 30% legs and car, 25% signs and main stand"),
}
PARTS = {i: 44 for i in range(1, 17)}
KICKS = (9, 22, 38)
CAMERA = {1: "static:a locked tableau of the fork", 2: "truckAcross", 3: "dollyThrough", 4: "truckAcross", 5: "craneDown", 6: "riseWith", 7: "dollyThrough", 8: "craneDown",
          9: "static:locked so the shadow sweep is the only move", 10: "truckAcross", 11: "dollyThrough", 12: "riseWith", 13: "truckAcross", 14: "riseWith", 15: "dollyThrough", 16: "static:a locked hold on the lever caught mid-throw"}

PALETTE = ("bleached-linen haze #D9D6C8 over sun-washed cream #EFE8D6, a crusted snowfield #F3F1EA with oatmeal snow shade #CFC6B4, "
           "long honey-lit snow with lake-blue cast shadows #9FB6CC, birch bark #F2EFE6, spruce black-teal #1E2B24, rail rust #8A4B2E over creosote ties #5B4636, "
           "a cast-iron #3B3F44 switch with a linen disc, railway lamp amber #F2A93B for the land's dates, a grey-brown walnut boardroom #4A4740 and #C9B48A")


def BOARD_HEAD(b_at, end, ad, tr):
    return {
        "run_date": "2026-11-25", "slug": "the-other-track", "title": "The Other Track",
        "concept": ("Twelve days before Alaska changes governors, Governor-elect Jonathan Kreiss-Tomkins asked AIDEA, a public corporation of the state, to postpone action until he takes office December 7th. "
                    "The board met behind closed doors from 10 a.m. to 3 p.m., took no action and resumes Friday, November 27th; its pending agenda lists ANWR, Ambler and Port MacKenzie and no data center item. "
                    "The data center pieces moved earlier: AIDEA's Alaska Data Corp got a $20 million board vote, and on November 10th DNR approved giving AIDEA about 6,800 acres near Houston at no cost, land AIDEA said in July could host logistics, manufacturing and scalable data centers. "
                    "Reconsideration requests are due November 30th and DNR then has 30 days, so the answer could land under the next governor, who has said he'd support a moratorium until rules exist. "
                    "The test gives AIDEA's case (due diligence, the land cut from nearly 20,000 acres, a reversion clause) and the other side's (2,300+ comments, mostly opposed, a Mat-Su Borough request to reconsider) full scenes, then AIDEA's own July words: no committed tenant, power source, cooling or schedule. "
                    "Drawn as a faceless switch stand at a rail fork near Houston in noon snow: a short closed AIDEA BOARD branch ending at a buffer stop, a long open DNR branch running off the frame, ties as days, and a lever caught mid-throw between RULES and a TENANT."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "low-angle-heroic", "motion_vector": "radial-emanate", "hero_treatment": "structure-as-subject", "layout": "centered-hero-lowerthird",
                        "register": "naturalistic-scene", "palette": PALETTE, "camera_strategy": "low-wide-rise",
                        "light_story": "bright-hard-low-noon-sun",
                        "metaphor": "a faceless switch stand at a fork where the short closed branch is the board's calendar and the long open branch is the land's clock, ties counted as days, and a lever caught mid-throw between rules and a tenant"},
        "signature_shot": 9,
        "palette": PALETTE,
        "divergence_note": ("The last two films were flat July overcast over olive tundra seen from above with a faced Pi board, red GPS pins and a clipboard grid (11-24), and an apricot-plum civil twilight over lavender river ice with a scarlet ribbon, sample tubes and a cargo drone (11-23). "
                            "This film is a hard low noon sun on bone haze and crusted snow, seen low and wide at a rail fork; its hero is a faceless cast-iron switch stand that acts through its lever, lamp and disc; its accent is signal amber; its shape language is divergence, a closed branch against an open one. "
                            "Honest overlaps: rail appears two films after 11-23's 1925 trail (no steam, no sepia, no long single track to a vanishing point here), faceless Suits (house rig), and a tie count from above as one explainer beat."),
        "treatment": {"title": "The Other Track", "summary": ad["treatment"], "judge_reasoning": tr[1] if len(tr) > 1 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "Low and wide at a rail fork in noon snow near Houston, and at 0.2 s the faceless switch stand throws its lever hard over with a clank as powder jumps off the rail",
                 "headline": "12 DAYS TO THE HANDOFF", "motion_by_s": 0.2,
                 "loopback": "Frame 1 is the main lever thrown hard toward the short closed branch; the last shot keeps the main lever on DNR, small behind, while a second switch past the siding points is caught mid-throw between a RULES FIRST leg and a TENANT FIRST leg."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(35), "plant_glow_s": 0.4, "plant_sfx": "clunk", "what": "What is down the other track? Planted as the lamp flares and the stand's long shadow stretches down the open DNR branch past a milepost reading DNR, STATE LAND NEAR HOUSTON, running off the frame; carried as the land's clock is set on that branch; paid when an empty boxcar on that branch rolls its doors open on nothing inside: no committed tenant, power source, cooling or schedule."},
        "open_loop_2": {"plant_t": b_at(20), "pay_t": b_at(46), "what": "Does the land decide what gets built? Planted as three use cards spring up on the parcel, COULD HOST, and the points slide toward a siding that curves out of sight; paid when a DNR stamp lands on the ACRES car: THE TRANSFER, NOT THE USE."},
        "throughline": {"object": "the switch lever", "lands_in_button": "the lever caught mid-throw between a stack of RULES ties and an empty boxcar, the amber lamp glowing",
                        "states": [
                            {"at_s": b_at(1), "state": "L1 thrown hard toward the short closed AIDEA BOARD branch"},
                            {"at_s": b_at(12), "state": "L2 still set to AIDEA BOARD, rattling in its keeper as the agenda passes"},
                            {"at_s": b_at(22), "state": "L3 thrown to the open DNR branch, the disc shadow settling on it"},
                            {"at_s": b_at(27), "state": "L3b small beyond the DECEMBER 7TH post, still set to DNR, its amber lamp now blinking steady"},
                            {"at_s": b_at(34), "state": "L4 at mid-ground beside the freight scale, still set to DNR, shivering in its notch as the borough letter unfolds"},
                            {"at_s": b_at(38), "state": "L5 the main lever still on DNR; the second switch where the open branch splits caught mid-throw between the RULES leg and the empty boxcar leg"}]},
        "reveals": [
            {"t": b_at(3), "type": "scale-pullback", "what": "the stand's long shadow stretches down an open branch that runs far beyond the frame", "hold_s": 0.6},
            {"t": b_at(11), "type": "build-on", "what": "the agenda cut rolls in car by car", "hold_s": 0.6},
            {"t": b_at(25), "type": "scale-pullback", "what": "the view pulls wide as 30 ties run past the DECEMBER 7TH mark and off the frame", "hold_s": 0.8},
            {"t": b_at(31), "type": "build-on", "what": "three ACRES cars uncouple to one, nearly 20,000 to 6,800", "hold_s": 0.6},
            {"t": b_at(33), "type": "scale-pullback", "what": "the view rises from the scale to show mail sacks stacked down the whole platform", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.0}, {"line": 3, "offset": 0.0, "level": 0.9}, {"line": 5, "offset": 0.0, "level": 1.1},
            {"line": 9, "offset": 0.0, "level": 1.2}, {"line": 12, "offset": 0.0, "level": 0.7}, {"line": 15, "offset": 0.0, "level": 0.6}, {"line": 17, "offset": 0.0, "level": 0.9},
            {"at_s": round(b_at(38) - 0.6, 3), "level": 0.35}, {"at_s": round(b_at(38) + 0.4, 3), "level": 1.2},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(38) - 0.5, 3), "riser_at": round(b_at(22) - 1.0, 3), "silence_at": round(b_at(38) - 0.5, 3),
            "payoff_at": b_at(38), "button_pattern": "callback", "interrupt_at": b_at(22), "extra_dips": []},
    }


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
    board = BOARD_HEAD(b_at, end, ad, tr)
    board.update({"shots": shots, "beats": beats})
    board["throughline"]["states"].sort(key=lambda x: x["at_s"])
    order = sorted(board["beats"], key=lambda b: (b["at_s"], b["id"]))
    ids = {b["id"]: rank for rank, b in enumerate(order, 1)}
    for b in board["beats"]:
        b["key"] = b["id"]
        b["id"] = ids[b["key"]]
    board["beats"].sort(key=lambda b: b["id"])
    board["_ids"] = ids
    book.raise_if_missing("board_1125 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1125Ids.ts").write_text(
        "// GENERATED by scripts/board_1125.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
