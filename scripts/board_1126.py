#!/usr/bin/env python3
"""2026-11-26 "Ahead of the Patient": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1126.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1126.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
PING = "Ping, the round orchid alert pulse with a face"
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "ping", PING, "pops awake inside the bore of a bone-white CT ring with a squash and a PING, reacting to a greyscale brain slice whose bright vessel tree already stops at one cutoff", "alert", "A BRAIN SCAN · AN ALASKA HOSPITAL", "the ring's lamps chase round", ""),
 (46, 0, W("Every"), "tick", "a brass counter on the CT room wall", "starts rolling its wheels as Ping's eyes go wide", "worried", "EVERY MINUTE", "the wheels blur", ""),
 (2, 0, W("two"), "clack", "the brass counter", "lands its wheels on 2,000,000 with a clack", "worried", "ABOUT 2 MILLION BRAIN CELLS · EVERY MINUTE", "the bezel shudders", ""),
 (3, 0, W("die."), "clink", "the bare brass nail labelled RESULTS beside the cold 0:00 stopwatch on the console", "catches the ring light in a glint as Ping glances at it", "curious", "RESULTS", "the nail glints", ""),
 (4, 1, 0.0, "whoosh", "a ream of thousands of brain slices on a stylised Alaska map board", "crawls along a dashed wire toward an ANCHORAGE dot, sweating, as the view pulls wide over the whole map", "weary", "JUST SENDING THE IMAGES TO ANCHORAGE", "a sweat drop falls off the ream", ""),
 (5, 1, W("forty-five"), "creak", "the slice ream", "jams a hair from the start and a single sheet peels off and drops back to the start line", "weary", "COULD TAKE 45 MIN", "the sheet flutters", ""),
 (6, 2, 0.0, "swoosh", PING, "jumps off a lightbox and lands on a reading-room desk with a bounce beside a cold 0:00 stopwatch", "proud", "VOLUNTEER GROUP", "the desk lamp sways", ""),
 (39, 2, W("Alaska"), "rustle", "a hand-lettered sheet reading ALASKA STROKE COALITION", "unrolls down the reading-room wall and swings", "proud", "ALASKA STROKE COALITION", "the sheet swings", ""),
 (7, 2, W("RapidAI."), "pop", PING, "spins round to show the word RAPIDAI on a little hanging plate", "proud", "RAPIDAI · STROKE SCAN SOFTWARE", "the plate swings", ""),
 (8, 3, 0.0, "scratch", "a giant brain slice filling the lightbox", "slides up into place as Ping leans in and a bone-white reticle sweeps across the bright vessel tree", "determined", "READING THE SCAN", "the reticle sweeps", ""),
 (9, 3, W("large"), "snap", "the bone-white reticle", "snaps shut on the point where one bright vessel stops", "alert", "SUSPECTED LARGE VESSEL OCCLUSION", "the cutoff pulses", ""),
 (42, 3, W("clot"), "thud", "the vessel branch beyond the cutoff", "dims to grey as a tiny ruby marker presses onto the cutoff point", "worried", "A CLOT IN A BIG BRAIN ARTERY", "Ping winces", ""),
 (10, 4, 0.0, "ding", PING, "swells and launches an orchid alert straight at the doctor's wall phone, which shakes and jumps on its hook", "alert", "IN ONE CASE · PER STAT", "the phone jumps", "rehook: Ping launches an orchid alert at the wall phone, which shakes and jumps on its hook"),
 (11, 4, W("seconds"), "chime", "a small clock tag on the alert", "flips to SECONDS as Ping grins", "proud", "ALERT · SECONDS AFTER THE SCAN", "the tag spins once", ""),
 (12, 5, 0.0, "swish", PING, "stretches and splits like a cell into two identical copies over the map board", "determined", "THE ALERT SPLITS", "the neck snaps", ""),
 (13, 5, W("local"), "whoosh", "the two orchid copies", "streak apart, one to the LOCAL TEAM tag beside a small hospital dot and one off the edge of the map onto a WHOLE STATE card, landing on the same frame and bowing", "proud", "LOCAL TEAM + SPECIALISTS AT ONCE", "both copies bow", ""),
 (14, 6, 0.0, "thump", "the WHOLE STATE card with five small faceless figures standing on it", "rises as the view pulls back until the five figures are dwarfed by the whole outline of Alaska behind them", "steady", "WHOLE STATE", "the card wobbles", ""),
 (15, 6, W("five"), "tap", PING, "points at the five figures one by one with a stubby arm and each tips its head in a nod while the nearest figure's pager twitches on its belt with a bone-white blink", "earnest", "5 CLOT-REMOVAL SPECIALISTS · WHOLE STATE", "the pager twitches", ""),
 (16, 7, 0.0, "door", "the swinging doors of a different hospital, an exterior in the blue before sunrise", "bang open as a small faceless gurney token rolls in, the intake board and its stopwatch visible through the door glass", "uneasy", "MID-60s · A MORNING FALL · INTERIOR HOSPITAL", "the doors swing", ""),
 (17, 7, W("interior."), "click", "the brass stopwatch hanging on that hospital's intake board", "clicks into motion while a beige printer beside it starts to print one slow page", "tense", "THE CLOCK STARTS", "the hand starts to sweep", ""),
 (18, 8, 0.0, "tick", "the stopwatch", "sweeps past a marked UNDER 30 tick as a local nurse's hand lifts the desk phone", "determined", "UNDER 30 MIN AFTER HE ARRIVED", "the cord swings", ""),
 (43, 8, W("Providence"), "whirr", "a bone-white pulse", "runs down the phone cord to a tag reading PROVIDENCE · ANCHORAGE", "determined", "PROVIDENCE · ANCHORAGE", "the tag swings", ""),
 (19, 8, W("transfer."), "clunk", "the receiver", "drops back onto its hook and swings on its cord", "determined", "TRANSFER CALL", "the cord sways", ""),
 (20, 9, 0.0, "slam", "the beige faceless printer", "finally drops its one page OFFICIAL REPORT into the tray beside the phone that is already back on the hook and still swinging", "wry", "2 MIN BEFORE THE OFFICIAL REPORT", "the page skids and stops", ""),
 (44, 10, 0.0, "whirr", "the stopwatch, medium in frame on the intake board", "sweeps hard, its hours ring spinning", "tense", "AFTER HE ARRIVED", "the hand blurs", ""),
 (21, 10, W("minutes"), "tock", "the stopwatch", "slams to a stop at 4 HR 23 MIN and the board jumps", "steady", "4 HR 23 MIN · CLOT OUT", "the bezel shudders", ""),
 (22, 10, W("out."), "pop", "a paper tag reading FROM ARRIVAL", "swings down on a pin beside the stopped stopwatch", "steady", "CLOT OUT", "the tag swings", ""),
 (23, 11, 0.0, "whoosh", "a split frame with a hard center seam", "shows on the left three outlined gurney tokens crawling three abstract dashed distance lines that converge on the seam, and on the right a warm Anchorage room with a TRANSFER CALL note already pinned to its door", "determined", "INFORMATION FIRST · ANY TRANSFER", "the seam flickers", "rehook: a hard seam splits the frame, three gurney tokens still on their lines while the Anchorage room already has the call on its door"),
 (24, 11, W("patient."), "click", "the Anchorage room's ceiling lights", "snap on one by one and gowns drop onto a hook rail before the gurney arrives", "hopeful", "THE ROOM GETS READY", "the gowns sway", ""),
 (25, 11, W("thirty"), "chime", "a plate on the Anchorage door", "swings out on its bracket", "hopeful", "ABOUT 30% FASTER START · EARLY DATA · PER STAT", "the plate swings", ""),
 (45, 11, W("reach"), "swing", "the lead gurney token", "rolls across the seam into the lit room and the doors swing behind it", "hopeful", "ONCE PATIENTS REACH ANCHORAGE", "the doors swing", ""),
 (26, 12, 0.0, "slide", PING, "slides a frozen stopwatch across a desk in the warm Anchorage room toward a faceless Suit with a boxed name card", "proud", "KELLY ISAACS · PROVIDENCE STROKE PROGRAM", "the stopwatch skids", ""),
 (40, 12, W("Isaacs,"), "knock", "the faceless Suit", "hits two lit rows on the wall scoreboard with a knuckle while the third row, labelled OUTCOMES, has its value cells taped over with paper", "steady", "TIME TO CALL · TIME TO START · OUTCOMES", "the board rattles", ""),
 (27, 12, W("statistically"), "flip", "the faceless Suit", "turns from the board and opens one empty hand toward Ping", "steady", "\"CAN I GIVE YOU STATISTICALLY SIGNIFICANT INFORMATION ...? I CAN'T, REALLY.\" · KELLY ISAACS · PER STAT", "Ping's grin falters", ""),
 (28, 13, 0.0, "rustle", "a fat binder of stroke outcome forms on a records shelf", "falls open and its mismatched pages flutter, some forms filled, some blank, no two alike", "uneasy", "NO CONSISTENT STROKE OUTCOME REPORTING", "loose pages drift down", ""),
 (29, 13, W("software"), "buzz", PING, "swells and yells at a perfectly clear slice on a small viewer behind the binder as the focus pulls to it, and an inset FLAGGED lamp blinks, then Ping deflates", "sheepish", "FALSE POSITIVES", "a bead of sweat pops off Ping", ""),
 (30, 14, 0.0, "flip", "a doctor's hand", "comes in and turns the over-eager Ping over so it goes grey and settles", "steady", "A DOCTOR REVIEWS EVERY OUTPUT", "Ping settles grey", "rehook: a doctor's hand turns the over-eager Ping over and it goes grey"),
 (31, 14, W("transfer."), "slide", "the doctor's hand", "turns a small desk slip over from ALERT to the clear side and the FLAGGED lamp goes dark by itself", "steady", "THAT READ DECIDES THE TRANSFER", "the pager goes dark", ""),
 (32, 15, 0.0, "pop", "six separate small hospital buildings, each in its own framed vignette", "brighten their windows one after another", "hopeful", "6 HOSPITALS · FREE ACCESS", "snow falls in each frame", ""),
 (33, 15, W("pay"), "coins", "a tag on each lit hospital", "flips over to KEEP + PAY", "hopeful", "ALL 6 SAY THEY'LL KEEP AND PAY", "the tags swing", ""),
 (35, 16, 0.0, "knock", "a plate on a post at one dashed hospital outline on a long dusk horizon of Alaska", "drops into place and the post shudders", "steady", "OVER $3.1M · FEDERAL RURAL HEALTH MONEY · CMS", "snow lifts off the plate", ""),
 (47, 16, W("federal"), "tock", "a row of survey stakes", "knock into the snow along the horizon line where the network will run", "steady", "IS SET TO BUILD", "each stake shivers", ""),
 (41, 16, W("network"), "scrape", "a dashed line", "strings itself along the horizon from left to right", "hopeful", "AI IMAGING NETWORK · PLANNED", "the dashes settle", ""),
 (34, 16, W("twenty-one"), "clack", "21 dashed hospital outlines", "pop up one by one along the horizon as the view pulls back from the first outline to the whole line", "hopeful", "PLANNED · 21 HOSPITALS", "each outline settles", ""),
 (36, 16, W("Utqiagvik"), "clink", "two end tags at the left and right ends of the horizon", "swing out on their pins", "hopeful", "UTQIAGVIK TO JUNEAU", "the tags swing", ""),
 (37, 17, 0.0, "snap", PING, "carries the stopwatch back into the CT room to the RESULTS nail where the Anchorage scoreboard now hangs, and tugs the taped paper off its OUTCOMES row, which falls away to show a dashed blank", "hopeful", "THE TIMES ARE ON THE BOARD", "the scoreboard swings", ""),
 (38, 17, W("measure"), "hum", "the camera", "pulls back out through the CT ring so the bore frames Ping beside the scoreboard on the nail, matching the first shot", "curious", "WHAT SHOULD ALASKA MEASURE?", "Ping looks up at the blank row", ""),
]

PLATE_AT = {i: "on-object" for i in range(1, 60)}
PLATE_AT.update({1: "lower-third", 21: "lower-third", 38: "lower-third"})
CLAIM_MAP = {1: ["narration"], 46: ["c5"], 2: ["c5"], 3: ["narration"], 4: ["c7"], 5: ["c7"], 6: ["c24"], 39: ["c24"], 7: ["c1"], 8: ["c1"], 9: ["c2"], 42: ["c2"],
             10: ["c3"], 11: ["c3"], 12: ["c4"], 13: ["c4"], 14: ["c6"], 15: ["c6"], 16: ["c13"], 17: ["narration"], 18: ["c14"], 43: ["c14"], 19: ["c14"],
             20: ["c15"], 44: ["c16"], 21: ["c16"], 22: ["c16"], 23: ["narration"], 24: ["narration"], 25: ["c17"], 45: ["c17"], 26: ["c21"], 40: ["c14", "c17"],
             27: ["c21"], 28: ["c20"], 29: ["c18"], 30: ["c19"], 31: ["c19"], 32: ["c10"], 33: ["c10"], 35: ["c11"], 41: ["c11", "c12"], 47: ["c11"], 34: ["c12"], 36: ["c8"],
             37: ["narration"], 38: ["narration"]}

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "subject-portrait", "medium", "eye", "ct-room", "eye-level-immersive", "stacked-layers", "radial-emanate", "single-organic-hero", "", "", "Born in the ring",
  "In a cold CT room Ping pops awake in the bore beside a slice whose vessel stops at a cutoff, a brass counter lands on 2 million brain cells a minute, and a bare RESULTS nail waits beside a cold stopwatch"),
 (2, 1, "map-territory", "extreme-wide", "overhead", "map-board", "top-down-map", "map-territory", "horizontal-traverse", "multiplicity-swarm", "whip-pan", "travel", "The old way",
  "From above, a sweating ream of slices crawls a dashed wire across the map of Alaska toward Anchorage and jams, just sending the images could take 45 minutes"),
 (3, 2, "wide-establish", "wide", "eye", "reading-room", "eye-level-immersive", "centered-hero-lowerthird", "vertical-rise", "single-organic-hero", "hard-cut", "carry", "The coalition",
  "In the reading room Ping lands on the desk beside a cold stopwatch, the volunteer ALASKA STROKE COALITION sheet unrolls and Ping spins to show RAPIDAI"),
 (4, 3, "macro-closeup", "insert", "eye", "slice-macro", "macro-closeup", "single-object-void", "push-in-only", "data-as-subject", "push-in", "build", "The flag",
  "A giant slice fills the lightbox, a bone reticle snaps on the vessel cutoff, the branch beyond dims, and Ping launches its alert at the wall phone, seconds after the scan in one case"),
 (5, 5, "map-territory", "wide", "overhead", "map-board", "top-down-map", "fullbleed-split", "radial-emanate", "multiplicity-swarm", "graphic-match", "match", "At once",
  "Over the map Ping splits into two copies, one to the LOCAL TEAM tag and one off the map onto a WHOLE STATE card, landing on the same frame"),
 (6, 6, "alt-vantage", "extreme-wide", "low", "whole-state", "low-angle-heroic", "centered-hero-lowerthird", "vertical-descent", "multiplicity-swarm", "pull-out", "carry", "Five",
  "Low behind the WHOLE STATE card the view pulls back until five faceless figures are dwarfed by the whole outline of Alaska, and Ping points at each as one figure's pager twitches"),
 (7, 7, "wide-establish", "wide", "low", "er-doors", "low-angle-heroic", "stacked-layers", "horizontal-traverse", "structure-as-subject", "hard-cut", "travel", "Another case",
  "At a different hospital's doors in the blue before sunrise a gurney token rolls in, the intake stopwatch clicks into motion and a beige printer starts one slow page"),
 (8, 8, "two-up", "medium", "eye", "er-desk", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "match-action", "carry", "The call beats the report",
  "A local nurse's hand lifts the desk phone as the stopwatch passes UNDER 30, a pulse runs down the cord to the Providence tag, the receiver drops back, and the slow printer finally drops OFFICIAL REPORT"),
 (9, 10, "push-detail", "medium", "eye", "intake-board", "exploded-diagram", "single-object-void", "radial-emanate", "data-as-subject", "graphic-match", "carry", "Clot out",
  "The stopwatch on the intake board sweeps hard and slams to a stop as the clot comes out, and a FROM ARRIVAL tag swings down beside it"),
 (10, 11, "two-up", "wide", "eye", "split-race", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "multiplicity-swarm", "mask-wipe", "build", "Information first",
  "A split frame: left, three outlined gurney tokens crawl converging dashed distance lines; right, the warm Anchorage room already has the call on its door, lights snap on, gowns drop, an early 30 percent plate swings, and the gurney crosses into a ready room"),
 (11, 12, "subject-portrait", "medium", "low", "anchorage-room", "low-angle-heroic", "stacked-layers", "vertical-rise", "single-organic-hero", "hard-cut", "carry", "The proof desk",
  "In the warm Anchorage room Ping slides its stopwatch to the faceless Kelly Isaacs, who knocks on the two lit TIME rows of a scoreboard whose third row is taped over, then turns with an open hand while her quote holds"),
 (12, 13, "push-detail", "close", "eye", "records", "macro-closeup", "hud-instrument-frame", "push-in-only", "data-as-subject", "focus-pull", "build", "The binder and the false alarm",
  "A fat binder of stroke outcome forms falls open on mismatched pages, then the focus pulls to Ping yelling at a clear slice while an inset FLAGGED lamp blinks, and Ping deflates"),
 (13, 14, "push-detail", "close", "high", "doctor-desk", "exploded-diagram", "single-object-void", "vertical-descent", "single-organic-hero", "match-cut", "match", "The doctor's read",
  "From above a doctor's hand turns the over-eager Ping over so it goes grey, then turns a desk slip over to its clear side and the FLAGGED lamp goes dark"),
 (14, 15, "data-panel", "wide", "eye", "hospital-grid", "eye-level-immersive", "grid-modular", "assemble-build", "multiplicity-swarm", "whip-pan", "build", "Keep and pay",
  "Six separate framed hospital vignettes brighten their windows one after another and their tags flip to KEEP + PAY"),
 (15, 16, "map-territory", "extreme-wide", "ground", "horizon", "low-angle-heroic", "map-territory", "horizontal-traverse", "landscape-as-subject", "pull-out", "travel", "The planned network",
  "On a long dusk horizon of Alaska a CMS plate drops on a post at one dashed outline, the view pulls back, a dashed line strings along the horizon and 21 dashed hospital outlines pop up, Utqiagvik to Juneau"),
 (16, 17, "alt-vantage", "wide", "eye", "ct-room", "eye-level-immersive", "centered-hero-lowerthird", "vertical-descent", "single-organic-hero", "match-cut", "carry", "Keep score",
  "Back in the CT room Ping carries the stopwatch to the RESULTS nail, the Anchorage scoreboard hangs on it, Ping tugs the paper off the OUTCOMES row to show a dashed blank, and the camera pulls back out through the ring"),
]

AMBIENT = {1: "room tone, the scanner hum", 2: "a far wind, paper", 3: "room tone, lightbox buzz", 4: "room tone, lightbox buzz", 5: "room tone, paper",
           6: "room tone, a far wind", 7: "wind at the doors, a far heater", 8: "room tone, printer grind", 9: "room tone, a clock", 10: "room tone, a far wind",
           11: "warm room tone", 12: "room tone, paper", 13: "room tone", 14: "wind over snow", 15: "dusk wind", 16: "room tone, the scanner hum"}
CENTER = {1: "Ping in the CT bore at x600 y900", 2: "the ream on the map at x540 y960", 3: "Ping on the desk at x540 y1060", 4: "the slice at x540 y900",
          5: "the split copies at x540 y960", 6: "the five figures at x540 y1000", 7: "the doors and gurney at x540 y1060", 8: "the phone and printer at x540 y980",
          9: "the stopwatch at x540 y920", 10: "the seam at x540 y960", 11: "Ping and the Suit at x540 y1060", 12: "the binder and slice at x540 y980",
          13: "Ping under the hand at x540 y980", 14: "the six vignettes at x540 y960", 15: "the horizon at x540 y1000", 16: "Ping and the board at x540 y1000"}
HERO = {
 1: ("Ping + CT ring + brain slice + counter + RESULTS nail", "60% ring and Ping, 25% counter, 15% nail"),
 2: ("map board + slice ream + dashed wire + Anchorage dot", "60% ream on route, 30% map, 10% desk"),
 3: ("Ping + desk + coalition sheet + lightbox + cold stopwatch", "55% Ping, 30% sheet, 15% lightbox"),
 4: ("brain slice + reticle + cutoff + Ping + wall phone", "65% slice, 25% Ping, 10% phone"),
 5: ("map board + two Ping copies + LOCAL TEAM tag + WHOLE STATE card edge", "55% copies, 30% map, 15% card"),
 6: ("WHOLE STATE card + five figures + Alaska outline + Ping", "50% figures, 35% outline, 15% Ping"),
 7: ("hospital doors + gurney token + intake board + stopwatch + printer", "50% doors and gurney, 30% board, 20% printer"),
 8: ("desk phone + nurse's hand + stopwatch + printer + report page", "45% phone and hand, 35% printer, 20% stopwatch"),
 9: ("stopwatch on the intake board + FROM ARRIVAL tag", "70% stopwatch, 20% tag, 10% board"),
 10: ("split seam + three dashed distance lines + three gurney tokens + Anchorage room + gowns + door plate", "60% room, 30% line, 10% seam"),
 11: ("Ping + desk + faceless Suit + wall scoreboard", "50% Suit and board, 35% Ping, 15% desk"),
 12: ("outcomes binder + clear slice + Ping + FLAGGED lamp", "50% binder, 35% Ping, 15% slice"),
 13: ("doctor's hand + Ping + desk slip + FLAGGED lamp", "55% hand and Ping, 30% slip, 15% lamp"),
 14: ("six framed hospital vignettes + tags", "70% windows, 30% tags"),
 15: ("horizon + 21 dashed outlines + CMS plate post + end tags", "60% outlines, 25% horizon, 15% plate"),
 16: ("Ping + stopwatch + RESULTS nail + scoreboard + CT ring", "60% ring and Ping, 25% scoreboard, 15% nail"),
}
PARTS = {i: 44 for i in range(1, 17)}
KICKS = (10, 23, 35)
CAMERA = {1: "dollyThrough", 2: "craneDown", 3: "truckAcross", 4: "dollyThrough", 5: "craneDown", 6: "orbitReveal", 7: "truckAcross", 8: "riseWith",
          9: "static:the stopwatch hand is the only move", 10: "static:a locked split so the two halves race", 11: "riseWith", 12: "dollyThrough", 13: "craneDown",
          14: "static:a locked grid so the windows carry the motion", 15: "truckAcross", 16: "orbitReveal"}

PALETTE = ("celadon CT tile #CFE3D8, graphite ink #1F3438, navy winter windows #2D4660 with warm sodium dots, ivory lightbox key #F4F1E6, "
           "greyscale scans with one ruby marker #B3223A at a vessel cutoff, a warm orchid glow #D94FB0 for Ping alone, a buttercream Anchorage room #EBDDBF under a warm bulb")


def BOARD_HEAD(b_at, end, ad, tr):
    return {
        "run_date": "2026-11-26", "slug": "ahead-of-the-patient", "title": "Ahead of the Patient",
        "concept": ("Alaska hospitals in the volunteer Alaska Stroke Coalition use RapidAI to read stroke scans. It flags a suspected large vessel occlusion, and in one case it alerted the doctor seconds after the scan, "
                    "with the results reaching the local team and the clot specialists at once, in a state with five doctors who can pull out those clots. Before, just sending the images to Anchorage could take 45 minutes. "
                    "In another case a man in his sixties came into an interior hospital after a fall; his team called Providence in Anchorage under 30 minutes after he arrived, two minutes before the official scan report, and the clot was out 4 hours 23 minutes after he arrived. "
                    "Early, unpublished data shows about a 30 percent faster start on clot removal once patients reach Anchorage. The test: Providence's Kelly Isaacs says she can't really show statistically significant proof, Alaska has no consistent stroke outcome reporting, the software throws false positives; "
                    "the clinicians' answer is that a doctor reviews every output and decides the transfer, and the six hospitals that got it free say they'll keep and pay. Federal rural health money, over $3.1 million, is set to build an AI imaging network across a planned 21 hospitals. "
                    "Drawn as Ping, a round orchid alert pulse with a face born in a CT ring, that splits so the news reaches two places at once; in the second case a slow faceless report printer loses to a phone call; the film ends on a scoreboard whose outcomes row is a dashed blank."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "horizontal-traverse", "hero_treatment": "single-organic-hero", "layout": "stacked-layers",
                        "register": "cartoon-interior", "palette": PALETTE, "camera_strategy": "interior-push-and-overhead-map",
                        "light_story": "warm-glow-interior-before-sunrise",
                        "metaphor": "a round orchid alert pulse with a face that splits so the news reaches the local team and the specialists at once, races ahead of the patient, and ends at a scoreboard with one blank row"},
        "signature_shot": 10,
        "palette": PALETTE,
        "divergence_note": ("The last three films were outdoors: a hard low noon sun on bone snow at a rail fork with a faceless cast-iron switch stand and signal amber (11-25), flat July overcast on olive tundra seen from above with a faced Pi board and red pins (11-24), and apricot-plum dusk on river ice with scarlet and sample tubes (11-23). "
                            "This film is a screen-lit hospital interior before dawn, celadon tile and graphite-teal under a bone lightbox key; its hero is a round faced orchid pulse that splits (no card or document silhouette); its accent is orchid at about 318 degrees, about 50 degrees from 11-24's vermilion and 11-23's scarlet and far from 11-25's amber. "
                            "Honest overlaps: a stylised Alaska map board seen from above in two shots (11-23 and 11-24 used top-down maps), a faceless Suit (house rig), and a brass stopwatch from the 11-19 shelf."),
        "treatment": {"title": "Ahead of the Patient", "summary": ad["treatment"], "judge_reasoning": tr[1] if len(tr) > 1 else ""},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "claim_map": {str(k): v for k, v in CLAIM_MAP.items()},
        "hook": {"pattern": "in-medias-res", "frame1": "A cold CT room, a greyscale slice in the bore whose bright vessel already stops at a cutoff, and at 0.2 s Ping pops awake in front of it with a squash and a PING while the ring's lamps chase round",
                 "headline": "A BRAIN SCAN · AN ALASKA HOSPITAL", "motion_by_s": 0.2,
                 "loopback": "Frame 1 is Ping waking in the CT bore beside a bare RESULTS nail; the last shot pulls back out through the same bore to frame Ping beside the scoreboard now hung on that nail, its third row a dashed blank."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(37), "plant_glow_s": 0.4, "plant_sfx": "clink", "what": "What hangs on the RESULTS nail? Planted as a bare brass nail labelled RESULTS beside a cold stopwatch in the CT room; paid when the Anchorage scoreboard hangs on the nail and Ping tugs the taped paper off its OUTCOMES row on camera to show a dashed blank under the lit TIME rows."},
        "open_loop_2": {"plant_t": b_at(15), "pay_t": b_at(29), "what": "Will the five get called for nothing? Planted as one of the five figures' pagers twitches on its belt while Ping counts them; paid when Ping yells at a clear slice and that pager blinks, then the doctor's read flips a slip to CLEAR · NO TRANSFER CALL and the pager goes dark: false positives, and a doctor's read decides the transfer."},
        "throughline": {"object": "the brass stopwatch", "lands_in_button": "Ping holding the stopwatch at the RESULTS nail under a scoreboard whose OUTCOMES row is a dashed blank",
                        "states": [
                            {"at_s": b_at(3), "state": "T1 cold at 0:00 on the CT console beside the bare RESULTS nail"},
                            {"at_s": b_at(6), "state": "T1b cold at 0:00 on the reading desk beside Ping"},
                            {"at_s": b_at(17), "state": "T2 running on the second hospital's intake board from the man's arrival"},
                            {"at_s": b_at(18), "state": "T3 sweeping past UNDER 30 as the transfer call goes"},
                            {"at_s": b_at(21), "state": "T4 slammed to a stop at 4 HR 23 MIN"},
                            {"at_s": b_at(26), "state": "T5 carried by Ping as a courier into Anchorage and slid across the desk to the scoreboard"},
                                                        {"at_s": b_at(37), "state": "T7 held up at the RESULTS nail under the scoreboard's blank row"}]},
        "reveals": [
            {"t": b_at(4), "type": "scale-pullback", "what": "the view pulls wide over the whole map as the sweating ream crawls toward Anchorage", "hold_s": 0.6},
            {"t": b_at(14), "type": "scale-pullback", "what": "the view pulls back until five figures are dwarfed by the whole outline of Alaska", "hold_s": 0.8},
            {"t": b_at(24), "type": "build-on", "what": "the Anchorage room lights snap on one by one before the gurney arrives", "hold_s": 0.7},
            {"t": b_at(34), "type": "scale-pullback", "what": "the view pulls back from one dashed outline until 21 stand along the horizon, Utqiagvik to Juneau", "hold_s": 0.8}],
        "tail_s": 2.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.0}, {"line": 4, "offset": 0.0, "level": 1.1}, {"line": 7, "offset": 0.0, "level": 0.9},
            {"line": 11, "offset": 0.0, "level": 1.2}, {"line": 12, "offset": 0.0, "level": 0.7}, {"line": 15, "offset": 0.0, "level": 1.0}, {"line": 16, "offset": 0.0, "level": 1.2},
            {"at_s": round(b_at(37) - 0.6, 3), "level": 0.35}, {"at_s": round(b_at(37) + 0.4, 3), "level": 1.1},
            {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(37) - 0.5, 3), "riser_at": round(b_at(23) - 1.0, 3), "silence_at": round(b_at(37) - 0.5, 3),
            "payoff_at": b_at(37), "button_pattern": "callback", "interrupt_at": b_at(20), "extra_dips": []},
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
    book.raise_if_missing("board_1126 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1126Ids.ts").write_text(
        "// GENERATED by scripts/board_1126.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
