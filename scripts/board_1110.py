#!/usr/bin/env python3
"""2026-11-10 "Take a Number": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1110.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1110.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board_anchor import AnchorBook  # noqa: E402
import board_1102 as base  # noqa: E402  (shared helpers only: est_starts, line_starts, load_words, _phrase)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"
LINES = base.LINES

W = lambda w, n=1: (w, n)
# key, line, anchor, sfx, subject, action, emotion, annotation (plate text), reaction, rehook
B = [
 (1, 0, 0.0, "slide", "the take-a-number machine", "shakes on the dusk Cook Inlet shingle behind two brass posts and a rope as its flip sign snaps over", "patient", "COOK INLET", "the sign flips", ""),
 (2, 0, W("number"), "tick", "a vermilion ticket", "curls out of the dispenser slot printed P-15423", "curious", "PRELIMINARY PERMIT · FERC P-15423", "the ticket curls", ""),
 (3, 0, 0.72, "hush", "an empty queue rope", "sways between two brass posts while a second ticket peeks from the slot reading NEXT and a moose stands far off by the spruce", "calm", "NEXT?", "the rope sways", "plant: who else gets a number"),
 (4, 1, 0.0, "creak", "a suited applicant silhouette", "steps up to a counter window with a case tagged NEEDHAM MA and slides the ticket across", "hopeful", "DEEPGREEN COOK INLET SPV LLC", "the case swings", ""),
 (43, 1, 0.2, "slide", "a clerk silhouette", "rises behind the window glass and takes the ticket", "stern", "FEDERAL REGULATORS", "the glass fogs", ""),
 (5, 1, W("FERC"), "hush", "the clerk", "glances at the empty rope through the window behind the applicant", "curious", "FERC", "the clerk glances", ""),
 (6, 1, W("permit"), "stamp", "the clerk", "inks the stamp and brings it down on the ticket", "firm", "PRELIMINARY PERMIT", "the stamp rings", ""),
 (7, 1, W("underwater"), "splash", "a ghost outline of a data center", "dips under the waterline in dashes in the window view", "curious", "PROPOSED · UNDERWATER DATA CENTER", "the outline sinks", ""),
 (8, 2, 0.0, "whoosh", "the camera", "plunges through the surface of Cook Inlet to a seabed", "reading", "PROPOSED · 66 SUBSEA PODS", "the bubbles rise", "rehook: the camera plunges through the water"),
 (51, 2, W("turbines"), "tick", "the turbine rotors", "are passed by a close camera along one rotor and the row recedes into the dark", "reading", "PROPOSED TIDAL TURBINES", "the rotors blur", ""),
 (38, 2, W("seabed"), "pop", "dashed ghost pods", "draw on one by one in rows along the seabed", "reading", "PODS ON THE SEABED", "the outlines draw", ""),
 (9, 2, W("about"), "whoosh", "dashed tidal turbines", "rise in rows and begin to spin", "reading", "PROPOSED · 330 TO 350 TURBINES", "the rotors spin", ""),
 (10, 3, 0.0, "swell", "a power meter", "sweeps its needle to a dashed mark", "reading", "ABOUT 100 MW", "the needle sweeps", ""),
 (39, 3, W("mostly"), "hum", "a dashed load bar", "fills toward the dashed pods", "reading", "MOSTLY THE DATA CENTER", "the bar fills", ""),
 (11, 3, W("cable"), "thud", "a dashed cable", "runs from the pods to a pin on the spruce Kenai shore", "reading", "ABOUT 3.5 MILES · NIKISKI", "the cable draws", ""),
 (12, 4, 0.0, "crack", "the vermilion ticket", "half-tears along its perforation with flaps reading STUDY and PLACE IN LINE opening on a still-joined stub and folding back", "firm", "STUDY PRIORITY ONLY", "the flaps flutter", "rehook: the ticket tears large in the frame"),
 (13, 4, W("first"), "tick", "a queue of ghost silhouettes", "shuffles back while the ticket holder steps to the front", "proud", "FIRST PLACE IN LINE", "the queue shuffles", ""),
 (44, 4, 0.86, "hum", "the front ticket", "reaches a window marked LICENSE that stays dark", "curious", "LICENSE · APPLY LATER", "the window stays dark", ""),
 (15, 5, 0.0, "page", "a quote card", "slides in and a typewriter line types across it", "calm", "THE COMPANY'S OWN WORDS", "the keys clack", ""),
 (14, 5, W("build"), "snap", "a BUILD lever", "is padlocked with a brass lock", "firm", "BUILD · LOCKED", "the lock swings", "plant: will the license window ever light"),
 (50, 6, 0.0, "hum", "a tube lamp", "buzzes on over the docket window as the clock hand rises toward five", "tense", "DEADLINE FOR OBJECTIONS", "the lamp buzzes", ""),
 (16, 6, W("five"), "tick", "a wall clock", "drops its minute hand onto five with a clack as a time-zone flag pops up and the calendar leaf flips to NOVEMBER 2ND", "tense", "5 PM EASTERN", "the hands tick", ""),
 (17, 6, W("November"), "alarm", "a shutter", "slides on as a blue permit tag and a tabbed folder slip through the slot just before a shutter slams over the docket window, the tube lamp above it dies on the slam, the ticket stays pinned behind the glass and a small docket sign above the window flips to CLOSED", "firm", "DEADLINE · NOVEMBER 2ND", "the lamp dies and the shutter slams", ""),
 (18, 7, 0.0, "creak", "a parka mayor silhouette", "opens a mailbox on the Kenai shore and finds it empty", "unimpressed", "MAYOR PETER MICCICHE", "the flap bangs", "rehook: the mayor opens an empty mailbox"),
 (19, 7, W("sloppy"), "tap", "the mayor", "checks the tray and shakes his head over a company folder", "stern", "CALLED IT SLOPPY", "the head shakes", ""),
 (20, 7, W("email"), "thud", "a silent dark phone", "is lifted by the mayor and dropped back on the tray", "wry", "NO EMAIL, LETTER OR CALL, HE SAYS", "the phone stays dark", ""),
 (21, 8, 0.0, "page", "the applicant", "holds the ticket and turns a calendar page at the counter window to TOO EARLY", "calm", "COMPANY SAYS TOO EARLY TO CONTACT OFFICIALS", "the page flips", "rehook: the applicant turns a calendar page to TOO EARLY"),
 (47, 8, 0.92, "pop", "a second ticket", "slides out of a slot beside the counter reading NEXT", "curious", "NEXT?", "the ticket peeks", ""),
 (22, 8, W("engineering"), "scratch", "paper blueprints and a fish chart", "get a pencil line drawn across them as a rubber band snaps around the roll", "reading", "ON PAPER FIRST", "the pencil draws", ""),
 (23, 9, 0.0, "pop", "a pegboard of blue permit tags", "pins on tag by tag into a wall behind the ticket pinned at its head", "alarmed", "1,300+ ACTIVE PERMITS · FISHERIES ALLIANCE", "the tags click on", ""),
 (24, 9, W("assess"), "tap", "a dashed gap of unpinned pegs", "outlines itself in the middle of the tag wall", "stern", "ALLIANCE SAYS NOT ASSESSED", "the gap pulses", ""),
 (25, 9, W("Center"), "clink", "a field-jacket silhouette", "steps up and pins a folder tabbed INTERVENE beside the tags", "firm", "CENTER FOR BIOLOGICAL DIVERSITY · FILED TO INTERVENE", "the folder pins", ""),
 (26, 10, 0.0, "chime", "a pale lemon lamp cone", "snaps on over a desk seen from above as the applicant slides a binder across it", "hopeful", "THE COMPANY'S BEST CASE", "the lamp glows", "rehook: the light snaps to lemon over a desk from above"),
 (27, 10, W("answers"), "page", "the applicant", "turns binder pages while a magnifier sweeps a seabed chart that fills in as he goes", "focused", "A STUDY IS HOW YOU GET ANSWERS", "the chart fills", ""),
 (28, 10, W("permit"), "clunk", "the applicant", "tugs the padlocked BUILD lever once and lets it go with the ticket under the magnifier", "calm", "PERMIT ALLOWS NO CONSTRUCTION", "the lock holds", ""),
 (29, 11, 0.0, "swell", "a beluga silhouette", "glides in a round patch of water that matches the magnifier lens", "calm", "COOK INLET BELUGAS", "the whale glides", ""),
 (48, 11, 0.12, "tick", "a date tab", "lands beside the round patch as the whale turns, kept off every population count", "somber", "ENDANGERED SINCE 2008", "the tab lands", ""),
 (30, 11, W("NOAA's"), "hush", "a field of white dots", "drains in eased cohorts from a full 1979 field to a lit compact block", "somber", "331 WHALES · RANGE 290 TO 386", "the dots drain", ""),
 (31, 11, W("down"), "hum", "a ghost outline of 1,300 dots", "holds around the lit block beside a strip of blue permit tags", "somber", "ABOUT 1,300 IN 1979", "the outline holds", ""),
 (32, 11, W("nineteen"), "stamp", "a divider bar", "drops between the labeled whale field and the labeled block of blue permit tags and holds", "firm", "NOT THE SAME 1,300", "the stamp rings", ""),
 (33, 12, 0.0, "slide", "a long study table", "slides into the top-down frame with the 331 block pressed at its edge, keeping a soft rippled water edge where it meets the table", "reading", "331 WHALES", "the table settles", "rehook: a long table slides in with the small block at its edge"),
 (40, 12, W("whether"), "page", "a blank binder", "lands on the table with a question mark on its cover", "curious", "NOT WHETHER, WHO", "the binder lands", ""),
 (34, 12, W("room"), "creak", "three chairs", "pull out from the table empty with plates BOROUGH, FLEET and NOAA", "hopeful", "WHO'S IN THE ROOM?", "the chairs pull out", ""),
 (49, 12, W("designed"), "tick", "a pencil", "writes STUDY TERMS across the binder cover", "hopeful", "WHEN THE STUDY IS DESIGNED", "the pencil writes", ""),
 (36, 13, 0.0, "hum", "the machine sign", "flips all the way to NOT YET after one false start and holds while the rope sways", "curious", "FERC HAS NOT RULED", "the sign holds", ""),
 (41, 13, W("borough"), "creak", "three silhouettes", "walk up and stop outside the rope at the brass posts looking at the NEXT ticket, a parka, a boat cap and a field jacket, none reaching for it", "hopeful", "BOROUGH · FLEET · NOAA", "the silhouettes stop", ""),
 (35, 13, W("help"), "page", "the vermilion ticket", "with its number P-15423 legible splits along its perforation into STUDY and OUTREACH halves and rests on the rope", "hopeful", "STUDY + OUTREACH", "the halves part", ""),
 (37, 13, W("terms"), "hoof", "the machine", "clacks once more as a moose ambles along the shingle behind the silhouettes and pauses outside the far end of the rope while the sign flips to NEXT", "wry", "WHO HELPS WRITE THE TERMS?", "the sign flips", ""),
]

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "ground", "nikiski-shore-low", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "", "The dispenser", "Low behind the queue rope a machine prints ticket P-15423 and a second ticket peeks out"),
 (2, 1, "two-up", "medium", "eye", "ferc-counter-interior", "cross-section-cutaway", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "hard-cut", "carry", "The counter", "The applicant slides the ticket through the window and the clerk stamps it, a ghost data center sinks in the view"),
 (3, 2, "wide-establish", "extreme-wide", "ground", "seabed", "cross-section-cutaway", "stacked-layers", "vertical-descent", "multiplicity-swarm", "mask-wipe", "build", "Sixty-six pods", "The camera dives through the water, the ghost pods draw on and the turbines spin"),
 (4, 3, "map-territory", "wide", "overhead", "cable-chart", "top-down-map", "map-territory", "assemble-build", "data-as-subject", "map-travel", "travel", "The cable", "A meter sweeps, a load bar fills toward the pods and a dashed cable runs to Nikiski"),
 (5, 4, "subject-portrait", "close", "eye", "ticket-macro", "macro-closeup", "single-object-void", "radial-emanate", "structure-as-subject", "graphic-match", "match", "Study and place in line", "The ticket tears into two flaps, the queue shuffles, the license window stays dark and the lever is padlocked"),
 (6, 6, "push-detail", "medium", "high", "docket-window", "instrument-screen", "hud-instrument-frame", "scroll-data", "instrument-as-subject", "hard-cut", "carry", "The deadline", "A clock drops to five, a tag and a folder slip through the slot and a shutter slams on the ticket"),
 (7, 7, "two-up", "wide", "low", "mailbox-shore", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "match-cut", "match", "The mayor", "The mayor opens an empty mailbox, checks the tray and lifts the silent phone"),
 (8, 8, "subject-portrait", "close", "eye", "ferc-counter-return", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "whip-pan", "travel", "Too early", "The applicant turns a calendar to TOO EARLY at the counter and a second ticket peeks out"),
 (9, 9, "data-panel", "wide", "eye", "permit-wall", "exploded-diagram", "grid-modular", "assemble-build", "multiplicity-swarm", "carried-element", "carry", "The permit wall", "A pegboard of blue tags builds out behind the pinned ticket, a gap of bare pegs and a folder pinned beside it"),
 (10, 10, "subject-portrait", "medium", "overhead", "lemon-desk-topdown", "top-down-map", "single-object-void", "push-in-only", "single-organic-hero", "carried-element", "carry", "The best case", "From above in lemon light the applicant slides a binder, a magnifier fills a seabed chart and he tugs the lock"),
 (11, 11, "data-panel", "extreme-wide", "overhead", "dot-field", "top-down-map", "stacked-layers", "radial-emanate", "data-as-subject", "graphic-match", "match", "Thirteen hundred and 331", "A beluga in a round patch, the 1979 field drains to a 331 block and a stamp parts it from the fleet's tags"),
 (12, 12, "map-territory", "wide", "overhead", "study-table-topdown", "top-down-map", "map-territory", "horizontal-traverse", "structure-as-subject", "carried-element", "carry", "Who is in the room", "A table slides in, a blank binder lands, three empty chairs pull out and a pencil writes STUDY TERMS"),
 (13, 13, "wide-establish", "wide", "ground", "nikiski-return", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "hard-cut", "match", "The button", "The shore from frame one, three silhouettes stop outside the rope, ticket P-15423 splits and a moose pauses at the far end of the rope"),
]

AMBIENT = {1: "wind in the rope, the sign flips, the ticket curls", 2: "the window lamp hums, the case swings, the tide moves behind the glass", 3: "bubbles rise, rotors turn, outlines draw",
           4: "the meter trembles, the cable draws along a tidal contour", 5: "the flaps flutter, the queue shuffles, the lock swings", 6: "the clock ticks, the lamp buzzes, the shutter rattles, the tide clock swells",
           7: "the mailbox flap bangs, the inlet glints through the spruce", 8: "the page flips, the tide moves behind the glass", 9: "tags click on, the tide chart curves",
           10: "the lamp glows, pages turn, the window shows water", 11: "the whale glides, dots drift, the stamp rings", 12: "the table settles, the pencil writes",
           13: "wind in the rope, the halves part, the sign flips"}
CENTER = {1: "the machine at x540 y1020", 2: "the window at x620 y960", 3: "the pods at x540 y1100", 4: "the meter at x540 y620 and the cable at y1000",
          5: "the ticket at x540 y960", 6: "the shutter at x600 y930", 7: "the mailbox at x760 y1020", 8: "the applicant at x430 y960", 9: "the pegboard at x540 y900",
          10: "the binder at x540 y1000", 11: "the dot field at x540 y960", 12: "the table at x540 y1000", 13: "the machine at x300 y1060"}
HERO = {
 1: ("take-a-number machine + ticket + queue rope", "70% machine, 20% ticket and rope, 10% shore"),
 2: ("applicant + clerk + ticket + FERC window + ghost data center", "60% ticket and stamp, 25% clerk and applicant, 15% window view"),
 3: ("dashed pods + tidal turbines + seabed", "60% pods and turbines, 25% seabed, 15% bubbles"),
 4: ("power meter + load bar + dashed cable + Nikiski pin", "55% cable and bar, 30% meter, 15% pin"),
 5: ("ticket flaps + ghost queue + LICENSE window + padlocked lever", "60% ticket, 25% queue, 15% window and lever"),
 6: ("clock + shutter + calendar leaf + tag and folder + ticket + sign", "55% shutter and ticket, 25% clock, 10% tag and folder, 10% CLOSED sign"),
 7: ("mayor + mailbox + tray + phone", "60% mayor and mailbox, 25% tray and phone, 15% shore"),
 8: ("applicant + calendar + second ticket + blueprints", "60% applicant and calendar, 25% blueprints, 15% slot"),
 9: ("pegboard of tags + ticket pinned at its head + bare peg gap + folder", "70% pegboard, 20% gap, 10% folder"),
 10: ("applicant + binder + magnifier + seabed chart + padlocked lever", "65% binder and chart, 20% applicant, 15% lever"),
 11: ("dot field + lit block + blue tags + stamp + beluga", "65% dots and block, 25% stamp and tags, 10% beluga"),
 12: ("study table + blank binder + three chairs + pencil", "60% table and binder, 30% chairs, 10% pencil, the 331 block keeps a soft rippled water edge"),
 13: ("machine + split ticket + rope + three silhouettes + moose", "60% machine and split ticket, 25% rope and silhouettes, 15% moose and far shore"),
}
PARTS = {1: 46, 2: 52, 3: 48, 4: 40, 5: 48, 6: 44, 7: 52, 8: 44, 9: 60, 10: 46, 11: 54, 12: 44, 13: 50}
KICKS = (12, 24, 32)
CAMERA = {1: "dollyThrough", 2: "static:the glass holds still while the stamp lands", 3: "craneDown", 4: "truckAcross", 5: "dollyThrough", 6: "static:the shutter is the move",
          7: "truckAcross", 8: "static:a calm desk lock", 9: "truckAcross", 10: "static:the Test is held calm", 11: "dollyThrough", 12: "craneDown", 13: "dollyThrough"}

PALETTE = ("blue-hour true violet shore, shingle slate, a vermilion dispenser, one acid lemon lamp for the Test, fleet blue permit tags and white beluga dots")


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
        nx = beats[i + 1]["at_s"] if i + 1 < len(beats) else end + 3.0
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

    tre = json.loads((OUT / "treatment.json").read_text())
    board = {
        "run_date": "2026-11-10", "slug": "take-a-number", "title": "Take a Number",
        "concept": ("A Needham, Massachusetts company has asked FERC for a preliminary permit to study a proposed subsea data center in Cook Inlet, 66 seabed pods run by about 330 to 350 tidal turbines, "
                    "about 100 megawatts and a 3.5 mile cable to Nikiski. The permit only lets the holder study the site and claim first place in line, and the company says it gives no permission to build. "
                    "The objection deadline passed on November 2nd. The borough mayor called the approach sloppy and says he heard nothing, the company says it was too early, a fisheries alliance and a conservation group object, "
                    "and the film gives the company's best case its own lemon room before narrowing: the question is not whether to study but who is in the room when the study is designed, "
                    "with the 331 belugas drawn against the 1,300 of 1979 and kept apart from the fleet's 1,300 permits. Hero is a take-a-number machine and the throughline is ticket P-15423."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "top-down-map", "motion_vector": "assemble-build", "hero_treatment": "structure-as-subject", "layout": "stacked-layers",
                        "register": "paper-and-stamp", "palette": PALETTE, "camera_strategy": "locked-drift",
                        "light_story": "blue-hour-then-lemon-daylight",
                        "metaphor": "a take-a-number machine on the Nikiski shore: the permit is a place in line, and the film asks who else is handed a number before the study is written"},
        "palette": PALETTE,
        "divergence_note": ("The last films were an oxblood courtroom (11-09), a permafrost road (11-08), a teal transformer yard (11-07), a tangerine office (11-06) and a midnight indigo cab (11-02), so the sky moves to a true violet. "
                            "This film is a true violet blue-hour shore with a vermilion ticket machine, a seabed cross-section, a blue pegboard wall and one acid lemon lamp over a desk seen from above. "
                            "It has no courtroom, cab, office or desk-chart, and its throughline is one ticket that is printed, stamped, parked, argued over and finally split in two."),
        "treatment": {"title": "Take a Number", "summary": tre["judge_reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "hook": {"pattern": "anomaly-question", "frame1": "A fat vermilion take-a-number machine clacks on a dusk shingle shore and spits ticket P-15423 while a plate reads COOK INLET.",
                 "headline": "TAKE A NUMBER", "motion_by_s": 0.3,
                 "loopback": "The machine clacks once more and a moose pauses outside the far end of the rope behind three silhouettes, rhyming with the far moose of the opening."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(34), "what": "Who else gets a number? Planted when a second ticket reading NEXT peeks from the slot, paid when three chairs slide up to the study table."},
        "open_loop_2": {"plant_t": b_at(14), "pay_t": b_at(28), "what": "Will the BUILD lever ever unlock? Planted when the lever is padlocked beside the dark LICENSE window, paid when the applicant tugs the lock in the company's best case and it holds with the window still dark."},
        "throughline": {"object": "ticket P-15423", "lands_in_button": "the ticket splits into STUDY and OUTREACH halves",
                        "states": [
                            {"at_s": b_at(2), "state": "blank, printed P-15423 at the shore"},
                            {"at_s": b_at(6), "state": "stamped PRELIMINARY PERMIT at the FERC window"},
                            {"at_s": b_at(12), "state": "half-torn along its perforation, flaps open on a still-joined stub, printed not stamped"},
                            {"at_s": b_at(17), "state": "pinned behind the dropped docket shutter"},
                            {"at_s": b_at(21), "state": "back in the applicant's hand at the counter"},
                            {"at_s": b_at(23), "state": "pinned at the head of the pegboard ahead of 1,300 blue tags"},
                            {"at_s": b_at(28), "state": "under the magnifier on the lemon desk beside the padlocked lever"},
                            {"at_s": b_at(35), "state": "split in two, STUDY and OUTREACH"}]},
        "reveals": [
            {"t": b_at(8), "type": "scale-pullback", "what": "from one dashed pod to a seabed field of 66 with turbines", "hold_s": 0.8},
            {"t": b_at(23), "type": "build-on", "what": "from one blue permit tag to a pegboard wall of 1,300", "hold_s": 0.8},
            {"t": b_at(31), "type": "morph-to-chart", "what": "the 331 block against the 1979 field of 1,300 dots", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.2}, {"line": 2, "offset": 0.0, "level": 0.6}, {"line": 4, "offset": 0.0, "level": 1.2},
            {"line": 6, "offset": 0.0, "level": 0.4}, {"line": 8, "offset": 0.0, "level": 0.9}, {"line": 10, "offset": 0.0, "level": 0.5},
            {"at_s": 63.3, "level": 0.1}, {"at_s": 64.25, "level": 1.1}, {"at_s": 74.4, "level": 0.1}, {"at_s": 75.45, "level": 0.6}, {"at_s": 94.6, "level": 0.15}, {"at_s": 95.6, "level": 1.0},
            {"line": 11, "offset": 0.0, "level": 1.1},
            {"at_s": round(b_at(34) - 0.3, 3), "level": 0.12}, {"at_s": round(b_at(34) + 0.8, 3), "level": 2.0},
            {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(34) - 0.3, 3), "riser_at": round(b_at(33), 3), "silence_at": round(b_at(34) - 0.3, 3),
            "payoff_at": b_at(34), "button_pattern": "callback", "interrupt_at": b_at(12), "extra_dips": [b_at(28)]},
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
    book.raise_if_missing("board_1110 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1110Ids.ts").write_text(
        "// GENERATED by scripts/board_1110.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
