#!/usr/bin/env python3
"""2026-11-09 "Who Holds the Transcript": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1109.py gen       # write out/dispatch/storyboard.json (estimated timing until vo_lines.json exists)
    python3 scripts/board_1109.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
 (1, 0, 0.0, "creak", "Tagalong", "walks through a side door into a hearing room clutching a notebook page it scribbled", "sneaky", "AI NOTETAKER", "the door creaks", ""),
 (2, 0, W("transcribe"), "thud", "a court clerk's hand", "scruffs Tagalong by the collar and swings it back out while a brass plate slams down", "stern", "NO DIY AI TRANSCRIPTS", "the plate rings", ""),
 (3, 0, W("clerk"), "tap", "a clerk's laptop", "opens a Zoom tile as an AI log note prints itself", "reading", "ZOOM AI LOG NOTE", "the note types", ""),
 (4, 0, W("note"), "flip", "a clerk's hand", "wipes the Zoom AI note off the screen in one sweep", "firm", "NO ZOOM AI NOTES", "the screen clears", ""),
 (5, 1, 0.0, "stamp", "a green binder", "slaps onto the bench as the AI policy with VERSION 1.2 on its cover", "proud", "AI POLICY · ALASKA COURT SYSTEM", "the binder bounces", ""),
 (6, 1, W("every"), "pop", "five silhouettes", "fill in behind the binder, one in a robe", "reading", "ALL STAFF + JUDICIAL OFFICERS", "the crowd settles", ""),
 (7, 1, W("June"), "click", "a date tab", "ticks onto the binder cover", "reading", "VERSION 1.2 · JUNE 2026", "the tab ticks", ""),
 (8, 1, W("LawSites"), "clip", "a source tag", "clips onto the binder", "reading", "AS PUBLISHED BY LAWSITES", "the tag swings", ""),
 (9, 1, W("employee"), "clunk", "a brass key", "swings on a wall hook with its tag face down", "curious", "WHO GETS THE KEY?", "the key swings", "plant: who gets the key"),
 (10, 2, 0.0, "chime", "a green YES sign", "drops onto the wall above a policy page", "wry", "EVERYTHING ELSE IS A YES", "the sign wobbles", ""),
 (11, 2, W("Check"), "tick", "a magnifier", "slides over the page and ticks a green check", "focused", "VERIFY ALL OUTPUT", "the check lands", ""),
 (12, 2, W("confidential"), "snap", "a CONFIDENTIAL folder", "snaps shut with a spark", "stern", "NEVER ENTER CONFIDENTIAL INFO", "the folder rattles", ""),
 (13, 3, W("personal"), "pop", "a phone in a fake mustache", "tries to badge in at a side door and gets bricked in", "sneaky", "NO PERSONAL AI ACCOUNTS", "the phone wiggles", "rehook: a phone in a fake mustache tries to badge in"),
 (14, 3, W("downloads"), "clank", "a download arrow", "bounces off the second door", "wry", "NO AI DOWNLOADS ON COURT DEVICES", "the arrow bounces", ""),
 (15, 3, W("code"), "tick", "a page of code", "gets a green check from a human hand", "focused", "HUMAN REVIEWS THE CODE", "the check lands", ""),
 (16, 3, W("interpreting"), "alarm", "a red NO disc", "slams onto the third door", "stern", "NO AI INTERPRETING", "the disc rings", ""),
 (17, 3, W("rules"), "page", "the notebook page", "crumples into a bin under the doors", "somber", "DISCIPLINE UP TO DISMISSAL", "the page crumples", ""),
 (18, 3, W("discipline"), "whoosh", "the camera", "pulls back until the whole courthouse shows three bricked doors", "reading", "SIDE DOORS CLOSING", "the doors recede", ""),
 (19, 4, 0.0, "swell", "Reels", "wakes as its reel eyes snap open and spin", "proud", "THE COURT'S OWN RECORDER", "the reels spin", ""),
 (20, 4, W("transcripts"), "pop", "Reels", "prints a dashed planned ribbon from its mouth", "proud", "AI TRANSCRIPTS OF ALL HEARINGS", "the ribbon prints", ""),
 (21, 4, W("every"), "whoosh", "seven hearing rooms", "fade in around Reels with brass threads running to it", "reading", "EVERY HEARING", "the threads pulse", ""),
 (22, 4, W("eye"), "pop", "a glass of water and a cobalt ink bottle", "appear on the bench while Reels glances at the key", "curious", "WHO GETS TO READ THEM?", "the glass shimmers", "plant: the ink and the water"),
 (23, 5, 0.0, "pulse", "Reels", "slides open its casing and a courtroom waveform feeds in", "proud", "COURTSMART", "the waveform pulses", ""),
 (24, 5, W("fall"), "page", "a calendar leaf", "drops in with SHOULD BE READY penciled on it and no check", "wry", "SHOULD BE READY BY FALL", "the leaf wobbles", ""),
 (25, 5, W("generated"), "stamp", "the transcript page", "gets a cobalt AI GENERATED tag and a red NOT THE OFFICIAL RECORD stamp", "firm", "NOT THE OFFICIAL RECORD", "the stamp rings", "rehook: the stamp pounds the transcript"),
 (26, 5, W("audio"), "clip", "a brass thread", "ties the transcript to an audio speaker", "reading", "LINKS TO OFFICIAL AUDIO", "the thread pulls tight", ""),
 (27, 6, 0.0, "whoosh", "a counter", "slides in with a glass pane cutting the room in two", "reading", "ONE HEARING · TWO PEOPLE", "the glass glints", "rehook: a counter slides in with a pane of glass down the middle"),
 (28, 6, W("judge"), "tick", "a judge", "scrolls a dashed planned AI transcript on a monitor", "calm", "AI TRANSCRIPT", "the lines scroll", ""),
 (29, 6, W("form"), "slide", "a party", "slides form TF-304 under the glass", "hopeful", "FORM TF-304", "the form slides", ""),
 (30, 6, W("audio"), "clunk", "a cassette", "lands on the party's side with a clack", "reading", "OFFICIAL AUDIO", "the cassette bounces", ""),
 (31, 7, 0.0, "hush", "a velvet rope", "drops across the window between two brass posts", "stern", "INTERNAL ONLY", "the rope swings", ""),
 (32, 7, W("public"), "thud", "the party's hand", "presses on the glass", "wistful", "NOT FOR THE PUBLIC", "the hand presses", ""),
 (33, 8, 0.0, "swell", "a glass of water", "fills the frame lit from the window", "reading", "THE POLICY'S STATED WORRY", "the water shimmers", ""),
 (34, 8, W("confidential"), "bloom", "a drop of cobalt ink", "falls into the water and blooms into the whole glass", "worried", "CAN'T BE PULLED BACK", "the ink blooms", ""),
 (35, 8, W("sealed"), "stamp", "a SEALED stamp and tweezers", "reach into the ink and can't pull any of it back out", "somber", "SEALED LATER", "the tweezers close on nothing", ""),
 (36, 9, 0.0, "whoosh", "the counter", "swings back into frame as the glass catches the light", "firm", "CONTAINMENT, NOT A FIX", "the glass glints", "rehook: the counter swings back into frame"),
 (37, 9, W("inside"), "clunk", "the brass key tag", "flips over to read STAFF SIDE ONLY", "firm", "STAFF SIDE ONLY", "the tag flips", ""),
 (38, 9, W("tape"), "clunk", "a cassette", "lifts against the glass level with the dashed transcript page that stays on the staff side", "hopeful", "THE PARTY CAN REQUEST THE TAPE", "the cassette lands", ""),
 (39, 10, 0.0, "whoosh", "a floor plan", "pulls back to show the courthouse from above", "reading", "NOT BANNING · DECIDING WHO HOLDS", "the plan settles", ""),
 (40, 10, W("Close"), "thud", "four side doors", "brick up one after another", "firm", "SIDE DOORS CLOSED", "the bricks land", ""),
 (41, 10, W("front"), "chime", "one front door", "lights as a dashed outline inside the recorder's room tagged A PLAN", "proud", "ONE FRONT DOOR", "the door glows", ""),
 (42, 11, 0.0, "drone", "the binder", "sweats as a thing is admitted", "nervous", "THE POLICY ADMITS ONE THING", "the sweat drips", ""),
 (43, 11, W("format"), "flip", "a tiny comb", "straightens the margins of the binder", "wry", "AI HELPED FORMAT AN EARLY DRAFT", "the margins straighten", ""),
 (44, 11, W("only"), "tick", "a plate", "stamps FORMATTING ONLY across the binder", "wry", "FORMATTING ONLY", "the stamp rings", ""),
 (45, 12, 0.0, "pop", "a blank second page", "slides to the slot under the glass while the party sets a cassette down and looks from it to the page", "curious", "SHOULD A PARTY GET THE AI DRAFT?", "the page curls", ""),
 (46, 12, W("own"), "creak", "Tagalong", "rises behind a gavel at the side", "sneaky", "THEIR OWN HEARING", "the gavel taps", ""),
 (47, 0, W("staff"), "tap", "a court clerk's hand", "descends from the top of the frame toward Tagalong", "stern", "COURT STAFF", "the hand descends", ""),
 (48, 4, W("judges"), "tick", "Reels", "turns its eyes toward a judge silhouette as its lamp blinks", "curious", "STAFF AND JUDGES", "the lamp blinks", ""),
 (49, 8, W("removed"), "hush", "tweezers", "swing in toward the ink cloud", "reading", "COULDN'T BE REMOVED", "the tweezers swing", ""),
 (50, 10, W("deciding"), "swell", "the four side doors", "darken and wait under the lamp", "firm", "WHO HOLDS THEM", "the doors glow", ""),
 (51, 11, W("asked"), "slide", "a tiny comb", "slides into frame beside the binder", "wry", "THE COURT ASKED AN AI TOOL", "the comb slides", ""),
]

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "medium", "eye", "side-door", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "", "", "The side door", "Tagalong sneaks in, a hand scruffs it, a clerk's Zoom AI note is wiped"),
 (2, 1, "subject-portrait", "close", "low", "bench", "macro-closeup", "single-object-void", "vertical-descent", "structure-as-subject", "hard-cut", "match", "The policy lands", "A binder slaps onto the bench, the crowd fills in, a key hangs face down"),
 (3, 2, "data-panel", "medium", "overhead", "desk-page", "instrument-screen", "grid-modular", "scroll-data", "data-as-subject", "carried-element", "carry", "Yes, with homework", "A YES sign, a magnifier, a confidential folder snaps shut"),
 (4, 3, "wide-establish", "extreme-wide", "high", "courthouse-front", "cross-section-cutaway", "stacked-layers", "assemble-build", "multiplicity-swarm", "mask-wipe", "build", "The doors close", "Three side doors brick up, the page is binned, the camera pulls back"),
 (5, 4, "subject-portrait", "wide", "eye", "recorder-room", "eye-level-immersive", "centered-hero-lowerthird", "radial-emanate", "single-organic-hero", "whip-pan", "travel", "Reels wakes", "Reels wakes and prints, seven hearing rooms feed it, a glass and an ink bottle appear"),
 (6, 5, "push-detail", "medium", "high", "recorder-cutaway", "exploded-diagram", "hud-instrument-frame", "horizontal-traverse", "instrument-as-subject", "carried-element", "carry", "The labeled page", "The transcript is tagged AI GENERATED, stamped, and tied to the audio"),
 (7, 6, "two-up", "wide", "eye", "counter", "eye-level-immersive", "fullbleed-split", "push-in-only", "single-organic-hero", "match-cut", "match", "The counter", "A judge scrolls text, a party files TF-304 and gets a cassette"),
 (8, 7, "push-detail", "medium", "low", "counter-glass", "cross-section-cutaway", "stacked-layers", "vertical-descent", "structure-as-subject", "hard-cut", "carry", "The velvet rope", "A rope drops across the window, a hand presses the glass"),
 (9, 8, "macro-closeup", "insert", "ground", "water-glass", "macro-closeup", "single-object-void", "radial-emanate", "instrument-as-subject", "graphic-match", "match", "The ink drop", "Ink blooms in a glass and a SEALED stamp can't pull it back"),
 (10, 9, "two-up", "medium", "eye", "counter-return", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "whip-pan", "travel", "Containment", "The key tag flips STAFF SIDE ONLY and the party gets the tape"),
 (11, 10, "map-territory", "extreme-wide", "overhead", "floor-plan", "top-down-map", "map-territory", "assemble-build", "structure-as-subject", "map-travel", "travel", "One front door", "Side doors brick shut and one front door lights"),
 (12, 11, "subject-portrait", "close", "eye", "binder-desk", "macro-closeup", "single-object-void", "push-in-only", "single-organic-hero", "crossfade", "match", "The admission", "The binder sweats and a tiny comb straightens its margins"),
 (13, 12, "wide-establish", "wide", "low", "counter-end", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "match-cut", "match", "The question", "A blank page waits at the glass, Tagalong pops up behind a gavel"),
]

AMBIENT = {1: "the door creaks, the screen glows, Tagalong's legs paddle", 2: "the crowd shifts, the binder settles, the key swings", 3: "the YES sign wobbles, the magnifier hums, the folder rattles",
           4: "bricks land, the phone wiggles, the page crumples", 5: "the reels spin, the ribbon prints, the lamp blinks", 6: "the waveform pulses, the calendar leaf wobbles, the stamp rings",
           7: "the monitor scrolls, the key tag sways face down, the form slides, the glass glints", 8: "the rope swings, the hand presses the glass", 9: "the ink blooms, the water shimmers, the tweezers close",
           10: "the tag flips, the cassette slides, the glass glints", 11: "the plan settles, bricks land, the front door glows", 12: "sweat drips, the comb moves, the stamp rings",
           13: "the page curls, the gavel taps, Reels blinks"}
CENTER = {k: "the hero at x540 y1000" for k in range(1, 14)}
HERO = {
 1: ("Tagalong + side door + bailiff hand + clerk laptop + notebook page", "30% Tagalong, 25% door, 25% laptop, 20% hand"),
 2: ("policy binder + five silhouettes + brass key + date tab", "40% binder, 30% crowd, 15% key, 15% tab"),
 3: ("page + magnifier + YES sign + CONFIDENTIAL folder", "30% page, 25% magnifier, 25% sign, 20% folder"),
 4: ("three side doors + phone + arrow + code page + NO disc + bin", "30% doors, 20% phone, 20% arrow, 15% code, 15% disc"),
 5: ("Reels + ribbon + seven hearing rooms + water glass + ink bottle", "40% Reels, 20% ribbon, 25% rooms, 15% glass"),
 6: ("Reels + transcript page + calendar leaf + audio speaker + brass thread", "30% Reels, 30% page, 20% calendar, 20% speaker"),
 7: ("counter + glass pane + brass key + judge + monitor + party + form + cassette", "25% judge, 25% party, 20% monitor, 15% form, 15% cassette"),
 8: ("velvet rope + brass posts + frosted glass + hand", "40% rope, 35% glass, 25% hand"),
 9: ("water tumbler + ink bloom + ink bottle + SEALED stamp + tweezers", "50% tumbler, 20% ink, 15% stamp, 15% tweezers"),
 10: ("key + STAFF SIDE ONLY tag + glass + party + cassette", "35% key, 35% party, 30% cassette"),
 11: ("floor plan + four side doors + front door + Reels room", "40% plan, 30% doors, 15% front door, 15% Reels"),
 12: ("binder + sweat drops + tiny comb + FORMATTING ONLY plate", "55% binder, 25% comb, 20% plate"),
 13: ("Reels + glass + party + blank page + Tagalong + gavel", "25% Reels, 25% party, 20% page, 15% Tagalong, 15% gavel"),
}
PARTS = {1: 46, 2: 44, 3: 40, 4: 56, 5: 60, 6: 52, 7: 56, 8: 44, 9: 38, 10: 48, 11: 40, 12: 38, 13: 50}
KICKS = (25, 41)
CAMERA = {1: "craneDown+dollyThrough", 2: "craneDown", 3: "truckAcross", 4: "dollyThrough", 5: "craneDown+dollyThrough", 6: "truckAcross", 7: "dollyThrough", 8: "craneDown",
          9: "dollyThrough", 10: "truckAcross", 11: "craneDown", 12: "dollyThrough", 13: "craneDown+dollyThrough"}

PALETTE = ("oxblood wall panels, walnut wood, ivory sheets, brass hardware, a copper reel recorder and one cobalt ink drop")


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
        "run_date": "2026-11-09", "slug": "who-holds-the-transcript", "title": "Who Holds the Transcript",
        "concept": ("The Alaska Court System's AI policy, version 1.2 from June, bans staff and judges from using AI on their own to make hearing notes or transcripts, "
                    "then says the court's own people will soon get AI transcripts of every hearing from CourtSmart, expected by fall, labeled not the official record, linked to the official audio and restricted to internal use. "
                    "The film reads that as one rule about control: close the side doors, build one front door, label what comes out. A party gets the audio through form TF-304, not the text, and the policy's stated worry is confidential information that couldn't be removed from an AI system even if a hearing was later sealed. "
                    "The ink drop makes that worry felt, and the film asks whether a party should get the AI draft of their own hearing. Hero is Reels, a copper recorder with two reel eyes, and the throughline is the transcript page."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "cross-section-cutaway", "motion_vector": "horizontal-traverse", "hero_treatment": "instrument-as-subject", "layout": "fullbleed-split",
                        "register": "tactile-collage", "palette": PALETTE, "camera_strategy": "locked-drift",
                        "light_story": "night-practical",
                        "metaphor": "a court builds one front door for its own AI transcripts and bricks up every side door, and a drop of ink in water shows why a sealed hearing can't be taken back out"},
        "palette": PALETTE,
        "divergence_note": ("The last five films were a tangerine daylight office (11-06), a night cab (11-02), an overcast moss slope (11-01), a sage chart desk (10-31) and an aubergine dusk depot (10-29). "
                            "This film (with honest overlap in cream paper, brass and a cobalt accent from 10-31, and a hand and a key tag echoing 11-02) is an oxblood and walnut courtroom after hours, lit by a brass lamp and a cool green window rim, built around a copper reel recorder with a face, a glass counter that splits the frame and a macro ink drop in a tumbler of water. "
                            "It has no stamp robot, cab, slope or chart desk, and its throughline is a single transcript page that is scribbled, binned, stamped, kept behind glass and finally blank."),
        "treatment": {"title": "The Ink Drop", "summary": tre["judge_reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "hook": {"pattern": "anomaly-question", "frame1": "A small slate-lavender notetaker bot tiptoes through a side door into a hearing room clutching a notebook page, a hand scruffs it and a plate reads NO DIY AI TRANSCRIPTS.",
                 "headline": "WHO HOLDS THE TRANSCRIPT", "motion_by_s": 0.3,
                 "loopback": "Tagalong pops up behind a gavel at the side, rhyming with the opening sneak."},
        "open_loop": {"plant_t": b_at(9), "pay_t": b_at(37), "what": "Who gets the key? Planted with a brass key hung tag face down, paid when its tag flips to STAFF SIDE ONLY."},
        "open_loop_2": {"plant_t": b_at(22), "pay_t": b_at(34), "what": "What are the glass of water and the ink for? Planted on the bench, paid when the ink blooms and can't be pulled back."},
        "throughline": {"object": "the transcript page", "lands_in_button": "a second blank page waits at the slot under the glass, the film's open question",
                        "states": [
                            {"at_s": b_at(1), "state": "scribbled in Tagalong's notebook"},
                            {"at_s": b_at(17), "state": "crumpled in the bin under the bricked doors"},
                            {"at_s": b_at(25), "state": "clean, tagged AI GENERATED and stamped NOT THE OFFICIAL RECORD"},
                            {"at_s": b_at(37), "state": "kept behind the glass on the staff side"},
                            {"at_s": b_at(45), "state": "a blank second page waiting at the slot"}]},
        "reveals": [
            {"t": b_at(18), "type": "scale-pullback", "what": "from one phone at one door to the courthouse with three bricked doors", "hold_s": 0.8},
            {"t": b_at(21), "type": "scale-pullback", "what": "from Reels alone to seven hearing rooms feeding it", "hold_s": 0.8},
            {"t": b_at(39), "type": "build-on", "what": "the floor plan from above as four side doors brick shut and one front door lights", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.5}, {"line": 1, "offset": 0.0, "level": 0.5}, {"line": 2, "offset": 0.0, "level": 1.3},
            {"line": 3, "offset": 0.0, "level": 0.4}, {"line": 4, "offset": 0.0, "level": 1.9}, {"line": 5, "offset": 0.0, "level": 0.35},
            {"line": 6, "offset": 0.0, "level": 0.6}, {"line": 7, "offset": 0.0, "level": 1.7}, {"line": 8, "offset": 0.0, "level": 0.3},
            {"at_s": round(b_at(41) - 0.3, 3), "level": 0.12}, {"at_s": round(b_at(41) + 0.8, 3), "level": 2.0},
            {"line": 11, "offset": 0.0, "level": 0.5}, {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(41) - 0.3, 3), "riser_at": round(b_at(40), 3), "silence_at": round(b_at(41) - 0.3, 3),
            "payoff_at": b_at(41), "button_pattern": "callback", "interrupt_at": b_at(25), "extra_dips": [b_at(34)]},
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
    book.raise_if_missing("board_1109 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1109Ids.ts").write_text(
        "// GENERATED by scripts/board_1109.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
