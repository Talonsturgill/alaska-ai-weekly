#!/usr/bin/env python3
"""2026-11-04 "The Ears Did the Work": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1104.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1104.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

Beats anchor to (vo_line, a spoken word or a fraction of the line), so the film re-times itself with the voice.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board_anchor import AnchorBook  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "dispatch"
LINES = [l.strip() for l in (OUT / "vo_script.txt").read_text().splitlines() if l.strip()]

W = lambda w, n=1: (w, n)
# key, shot, line, anchor, sfx, subject, action, emotion, annotation, shows, reaction, rehook
B = [
 (1, 1, 0, 0.0, "stamp", "the Robot", "takes a bow at the centre of a front-on stage as confetti falls and a banner reads AI FINDS ~3X THE QUAKES beside a catalog Sheet of six chalk dots pinned to the curtain", "smug", "AI FINDS ~3X THE QUAKES",
  "the Robot, a squared-off server machine with eyes, takes a bow at the centre of a front-on stage as confetti falls and a banner reads AI FINDS ~3X THE QUAKES beside a catalog Sheet of six chalk dots pinned to the curtain, a plate reads AI FINDS ~3X THE QUAKES", "the confetti falls", ""),
 (31, 1, 0, 0.3, "page", "the Sheet", "flutters on the curtain and a scope tag pins to it", "curious", "2018 TO 2019",
  "the catalog Sheet flutters on the curtain and a scope tag pins to it, a plate reads 2018 TO 2019", "the Sheet flutters", ""),
 (2, 1, 0, W("credit"), "snap", "the Robot", "hugs the banner to its chest as a gold crown pops onto its head", "smug", "ALL THE CREDIT?",
  "the Robot hugs the banner to its chest as a gold crown pops onto its head, a plate reads ALL THE CREDIT?", "the crown wobbles", ""),
 (3, 1, 0, 0.82, "thud", "a trapdoor", "swings open under the Robot's spotlight spill and a cut to a seabed plate shows Bunk blinking in the dark", "wry", "THE PAPER SAYS OTHERWISE",
  "a trapdoor swings open under the Robot's spotlight spill and a cut to a seabed plate shows Bunk, a mint-domed seafloor ear, blinking in the dark, a plate reads THE PAPER SAYS OTHERWISE", "Bunk blinks", "plant: what really made the picker better"),
 (4, 2, 1, 0.0, "blip", "Bunk", "rests in the mud with a mint ring pulsing off his dome", "curious", "BUNK · SEAFLOOR SEISMOMETER",
  "Bunk rests in the mud with a mint ring pulsing off his dome, a plate reads BUNK · SEAFLOOR SEISMOMETER", "the ring pulses", ""),
 (5, 2, 1, W("seventy-five"), "pop", "75 Bunks", "light up one after another in a wave along the seabed with one late blinker at the end", "curious", "75 ON THE SEAFLOOR",
  "seventy-five Bunks light up one after another in a wave along the seabed with one late blinker at the end, a plate reads 75 ON THE SEAFLOOR", "the wave blinks", ""),
 (6, 2, 1, W("thirty"), "tick", "30 shore sensors", "pop up along the Alaska Peninsula coast on a strip map", "curious", "30 ON LAND",
  "thirty shore sensors pop up along the Alaska Peninsula coast on a strip map, a plate reads 30 ON LAND", "the pins pop", ""),
 (7, 3, 2, 0.0, "tick", "an analyst", "pencils a vertical tick on the first arrival of a squiggle and stamps CHECKED BY HAND on the Sheet", "focused", "CHECKED BY HAND",
  "an analyst pencils a vertical tick on the first arrival of a squiggle and stamps CHECKED BY HAND on the catalog Sheet, a plate reads CHECKED BY HAND", "the stamp rings", ""),
 (8, 3, 2, 0.42, "stamp", "two hands", "slide the stamped Sheet off the desk with a Cornell sleeve plate reading BARCHECK · CORNELL", "proud", "BARCHECK · CORNELL",
  "two hands slide the stamped Sheet off the desk with a Cornell sleeve plate, a plate reads BARCHECK · CORNELL", "the Sheet slides", ""),
 (9, 3, 2, 0.74, "stamp", "the second hand", "lifts a USGS sleeve plate into frame as the analyst lets go", "proud", "RUPPERT · USGS",
  "the second hand lifts a USGS sleeve plate into frame as the analyst lets go of the Sheet, a plate reads RUPPERT · USGS", "the analyst lets go", ""),
 (10, 4, 3, 0.0, "clank", "the Robot", "flags a squiggle with P and S marks that land at the arrivals while its EQTRANSFORMER plate lights", "focused", "EQTRANSFORMER · GLOBAL MODEL",
  "the Robot flags a squiggle with P and S marks that land at the arrivals while its EQTRANSFORMER plate lights, a plate reads EQTRANSFORMER · GLOBAL MODEL", "the flags snap", "rehook: the Robot's marks land on the squiggle and the Sheet slides into its tray"),
 (11, 4, 3, 0.22, "ping", "wave flags", "pop onto the squiggle where P and S marks land at the arrival points", "focused", "FINDS QUAKES · MARKS ARRIVALS",
  "wave flags pop onto the squiggle where P and S marks land at the arrival points, a plate reads FINDS QUAKES · MARKS ARRIVALS", "the flags snap", ""),
 (35, 4, 3, 0.68, "clank", "the Sheet", "slides into the Robot's tray and the Robot's worldwide cards drop away", "determined", "FINE-TUNED ON HAND-CHECKED PICKS",
  "the stamped Sheet slides into the Robot's tray and the Robot's worldwide cards drop away, a plate reads FINE-TUNED ON HAND-CHECKED PICKS", "the tray clanks", ""),
 (12, 5, 4, 0.0, "whoosh", "four tricks", "line up as caped racers at a starting rail then sprint down four lanes", "curious", "SEVERAL TRAINING TRICKS",
  "four tricks line up as caped racers at a starting rail then sprint down four lanes, a plate reads SEVERAL TRAINING TRICKS", "the racers sprint", ""),
 (37, 5, 4, 0.55, "whoosh", "a starting-model racer", "a filter racer and a splits racer pull ahead and fall back in the middle lane", "wry", "STARTING MODEL · FILTERS · SPLITS",
  "a starting-model racer, a filter racer and a splits racer pull ahead and fall back in the middle lane, a plate reads STARTING MODEL · FILTERS · SPLITS", "the lanes streak", ""),
 (13, 5, 4, W("substantially"), "thock", "the finish line", "freezes a photo finish with all four tied and blank medals while the meter stays flat", "wry", "NONE SUBSTANTIALLY BETTER",
  "the finish line freezes a photo finish with all four racers tied and blank medals while the meter stays flat, a plate reads NONE SUBSTANTIALLY BETTER", "the meter holds flat", ""),
 (14, 6, 5, 0.0, "rush", "a recording reel", "pours a firehose of Alaska waveforms into the Robot's slot while a tab clips onto the Sheet", "determined", "THE ALASKA DATA ITSELF",
  "a recording reel pours a firehose of Alaska waveforms into the Robot's slot while a tab clips onto the Sheet, a plate reads THE ALASKA DATA ITSELF", "the reel spins", ""),
 (15, 6, 5, 0.5, "pop", "the Halibut", "nudges a dome and a stray squiggle appears beside a dotted box asking REAL OR NOISE?", "puzzled", "REAL OR NOISE?",
  "the Halibut nudges a dome and a stray squiggle appears beside a dotted box, a plate reads REAL OR NOISE?", "the box pulses", "plant: are the new ones real"),
 (50, 6, 5, 0.8, "pop", "gold quake dots", "pop out of the continuous waveform strip one by one", "proud", "HUNTING SMALL QUAKES",
  "gold quake dots pop out of the continuous waveform strip one by one, a plate reads HUNTING SMALL QUAKES", "the dots pop", ""),
 (16, 7, 6, 0.0, "knock", "the Sheet stack", "grows from six chalk dots to a tall stack with gold dots filling in over the chalk ones until a numeral reads 3X", "proud", "~3X MORE EARTHQUAKES",
  "the catalog Sheet stack grows from six chalk dots to a tall stack with gold dots filling in over the chalk ones until a numeral reads ~3X, a plate reads ~3X MORE EARTHQUAKES", "the stack sways", "rehook: gold dots flood the Sheet stack up to 3X"),
 (39, 7, 6, 0.22, "tick", "gold dots", "tick onto the Sheet beside the chalk ones one by one", "proud", "NEW DOTS",
  "gold dots tick onto the Sheet beside the chalk ones one by one, a plate reads NEW DOTS", "the dots tick", ""),
 (17, 7, 6, W("authors"), "stamp", "a tag", "swings onto the stack reading PER THE AUTHORS", "reading", "PER THE AUTHORS",
  "a tag swings onto the stack, a plate reads PER THE AUTHORS", "the tag swings", ""),
 (18, 7, 6, W("smallest"), "slide", "a size key", "on the Sheet's edge slides down one notch and the newest gold dots are visibly smaller than the chalk ones", "curious", "SMALLEST QUAKE CAUGHT · DOWN 0.1 TO 0.4",
  "a size key on the Sheet's edge slides down one notch and the newest gold dots are visibly smaller than the chalk ones, a plate reads SMALLEST QUAKE CAUGHT · DOWN 0.1 TO 0.4", "the key slides", ""),
 (41, 7, 6, 0.8, "tick", "tiny gold dots", "fill the gaps between the chalk dots", "curious", "SMALLER QUAKES NOW CAUGHT",
  "tiny gold dots fill the spaces between the chalk dots, a plate reads SMALLER QUAKES NOW CAUGHT", "the dots fill", ""),
 (20, 8, 7, 0.0, "ping", "gold dots", "flare brightest along the far offshore side and thin toward the land stations", "proud", "BIGGEST GAINS · FAR OFFSHORE",
  "gold dots flare brightest along the far offshore side and thin toward the land stations, a plate reads BIGGEST GAINS · FAR OFFSHORE", "the dots flare", ""),
 (19, 8, 7, 0.4, "rumble", "the ocean plate", "bends up at a bulge before diving under the Peninsula in a cross-section", "curious", "OUTER RISE · PLATE BENDS BEFORE IT DIVES",
  "the ocean plate bends up at a bulge before diving under the Peninsula in a cross-section, a plate reads OUTER RISE · PLATE BENDS BEFORE IT DIVES", "the plate flexes", ""),
 (42, 8, 7, 0.86, "thud", "gold dots", "burst in a ring across the outer rise bulge while the land side stays sparse", "proud", "BIGGEST GAINS · OUTER RISE",
  "gold dots burst in a ring across the outer rise bulge while the land side stays sparse, a plate reads BIGGEST GAINS · OUTER RISE", "the ring spreads", ""),
 (21, 9, 8, 0.0, "pop", "a dotted box", "wobbles over a stray squiggle reading REAL OR NOISE? as the Halibut peeks in", "puzzled", "REAL OR NOISE?",
  "a dotted box wobbles over a stray squiggle as the Halibut peeks in, a plate reads REAL OR NOISE?", "the box wobbles", ""),
 (43, 9, 8, 0.3, "slide", "a ghost map", "of the old catalog snaps over the new gold dots and they land where the old dots cluster", "reading", "LANDS WHERE QUAKES ALREADY CLUSTER",
  "a ghost map of the old catalog snaps over the new gold dots and they land where the old dots cluster, a plate reads LANDS WHERE QUAKES ALREADY CLUSTER", "the ghost snaps", ""),
 (22, 9, 8, 0.74, "chime", "the dotted box", "fills in and stays dotted at the edge reading CONSISTENT with a small coral tag FALSE ALARM RATE NOT IN ABSTRACT", "reading", "CONSISTENT WITH EARLIER MAPS",
  "the dotted box fills in and stays dotted at the edge with a small coral tag, a plate reads CONSISTENT WITH EARLIER MAPS", "the box settles", ""),
 (23, 10, 9, 0.0, "creak", "a window bar", "labeled 2018 TO 2019 slides across a seismogram and closes in coral", "somber", "ONE TEMPORARY EXPERIMENT",
  "a window bar labeled 2018 TO 2019 slides across a seismogram and closes in coral, a plate reads ONE TEMPORARY EXPERIMENT", "the bar closes", ""),
 (44, 10, 9, 0.28, "tick", "one seismogram", "plays twice over the same recording, once with the analysts' three chalk picks and once with the picker's nine gold picks", "reading", "SAME RECORDINGS · MORE PICKED",
  "one seismogram plays twice over the same recording, once with the analysts' three chalk picks and once with the picker's nine gold picks, a plate reads SAME RECORDINGS · MORE PICKED", "the wiggle repeats", ""),
 (24, 10, 9, W("nothing"), "clunk", "a coral sign", "reading MORE HEARD NOT PROOF OF MORE SHAKING drops over the Sheet's gold stack", "somber", "MORE HEARD · NOT PROOF OF MORE SHAKING",
  "a coral sign drops over the Sheet's gold stack, a plate reads MORE HEARD · NOT PROOF OF MORE SHAKING", "the sign settles", "rehook: a coral sign drops over the gold stack"),
 (25, 10, 9, W("heard"), "clank", "a crane hook", "descends and lifts the first Bunk out of the mud while the Sheet gets a margin note 2018 TO 2019 ONLY", "somber", "2018 TO 2019 ONLY",
  "a crane hook descends and lifts the first Bunk out of the mud while the Sheet gets a coral margin note, a plate reads 2018 TO 2019 ONLY", "the hook lifts", ""),
 (26, 11, 10, 0.0, "whoosh", "the banner", "swings from AI to LOCAL DATA as the spotlight leaves the Robot", "proud", "LOCAL DATA MADE IT BETTER",
  "the banner swings from AI to LOCAL DATA as the spotlight leaves the Robot and lands on Bunk, a plate reads LOCAL DATA MADE IT BETTER", "the banner swings", ""),
 (45, 11, 10, 0.25, "snap", "the Robot", "peeks at the swinging banner and slowly lowers its crown", "wry", "NOT A CLEVER TRICK",
  "the Robot peeks at the swinging banner and slowly lowers its crown, a plate reads NOT A CLEVER TRICK", "the crown drops", ""),
 (27, 11, 10, W("seafloor"), "pop", "the analyst", "walks on under the spotlight beside Bunk holding the stamped Sheet", "warm", "SEAFLOOR EARS + PEOPLE WITH PENCILS",
  "the analyst walks on under the spotlight beside Bunk holding the stamped Sheet, a plate reads SEAFLOOR EARS + PEOPLE WITH PENCILS", "the analyst waves", ""),
 (46, 11, 10, W("pencils"), "page", "the Sheet", "is handed to the Robot, which bows to the analyst and Bunk instead of the audience", "warm", "HAND-CHECKED PICKS",
  "the stamped Sheet is handed to the Robot, which bows to the analyst and Bunk instead of the audience, a plate reads HAND-CHECKED PICKS", "the Robot bows", ""),
 (28, 12, 11, 0.0, "clank", "a crane", "lifts the 75 domes off the seabed grid one by one in an aerial view as their lights go out", "somber", "THE EARS COME UP",
  "a crane lifts the 75 domes off the seabed grid one by one in an aerial view as their lights go out, a plate reads THE EARS COME UP", "the lights go out", ""),
 (48, 12, 11, 0.42, "creak", "the crane", "swings clear leaving one dome lit in the grid", "somber", "ONE ARRAY · 2018 TO 2019",
  "the crane swings clear leaving one dome lit in the grid, a plate reads ONE ARRAY · 2018 TO 2019", "the hook sways", ""),
 (29, 12, 11, W("back"), "pop", "one Bunk", "tilts toward the camera like an ear with a pulsing question mark over his dome", "curious", "WILL THE EARS GO BACK DOWN?",
  "one Bunk tilts toward the camera like an ear with a pulsing question mark over his dome, a plate reads WILL THE EARS GO BACK DOWN?", "the question pulses", ""),
 (30, 12, 11, 0.94, "blip", "Bunk", "closes his eye and the ring pulse stops, then the eye opens again", "warm", "BUNK",
  "Bunk closes his eye and the ring pulse stops then the eye opens again, mirroring the open", "the eye reopens", ""),
 (33, 2, 1, 0.24, "tick", "a calendar tick", "flips onto Bunk's ring reading STARTING IN 2018 as a second dome wakes", "curious", "STARTING IN 2018",
  "a calendar tick flips onto Bunk's ring and a second dome wakes, a plate reads STARTING IN 2018", "the ring widens", ""),
]

S = [
 (1, 0, "subject-portrait", "medium", "eye", "proscenium-stage", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "", "", "The bow", "A front-on stage where the Robot takes a bow, then a trapdoor cut to Bunk on a seabed plate"),
 (2, 1, "wide-establish", "wide", "low", "seabed-row", "exploded-diagram", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "match-cut", "match", "75 ears", "Bunk wakes, 75 domes light in a wave, 30 shore sensors pop on a strip map"),
 (3, 2, "push-detail", "close", "eye", "analyst-desk", "macro-closeup", "single-object-void", "push-in-only", "instrument-as-subject", "carried-element", "carry", "Checked by hand", "an analyst stamps the Sheet and the authors' Cornell and USGS hands slide it away"),
 (4, 3, "data-panel", "medium", "high", "robot-lab", "instrument-screen", "hud-instrument-frame", "scroll-data", "instrument-as-subject", "carried-element", "carry", "Retrained", "The Sheet slides into the Robot's tray and the worldwide cards drop"),
 (5, 4, "wide-establish", "wide", "ground", "trick-lanes", "exploded-diagram", "grid-modular", "horizontal-traverse", "multiplicity-swarm", "mask-wipe", "travel", "Photo finish", "Four training tricks sprint and tie in a photo finish"),
 (6, 5, "macro-closeup", "insert", "eye", "recording-reel", "macro-closeup", "single-object-void", "radial-emanate", "data-as-subject", "carried-element", "carry", "Alaska data", "A reel pours local waveforms into the Robot and gold dots pop out"),
 (7, 6, "data-panel", "medium", "eye", "sheet-stack", "instrument-screen", "stacked-layers", "vertical-rise", "data-as-subject", "match-cut", "match", "Three times", "The catalog Sheet stack fills with gold to 3X and the size key slides down"),
 (8, 7, "alt-vantage", "extreme-wide", "high", "plate-cross-section", "cross-section-cutaway", "fullbleed-split", "vertical-descent", "landscape-as-subject", "mask-wipe", "build", "Outer rise", "Gold dots flare offshore, the plate bends at the outer rise and a gold ring bursts across it"),
 (9, 8, "two-up", "medium", "overhead", "overlay-map", "top-down-map", "map-territory", "push-in-only", "data-as-subject", "hard-cut", "match", "Same map", "A dotted box asks real or noise and the ghost map snaps over the new dots"),
 (10, 9, "subject-portrait", "close", "low", "seismogram-window", "instrument-screen", "hud-instrument-frame", "scroll-data", "structure-as-subject", "match-cut", "match", "The limit", "A 2018 to 2019 window, the same wiggle heard by more ears, a coral sign and a crane hook lifting the first dome"),
 (11, 10, "alt-vantage", "wide", "low", "stage-banner", "eye-level-immersive", "centered-hero-lowerthird", "assemble-build", "single-organic-hero", "carried-element", "carry", "Credit swings", "The lifted dome carries back onto the stage, the banner swings to LOCAL DATA and the Robot bows to the analyst and Bunk"),
 (12, 11, "wide-establish", "extreme-wide", "overhead", "dark-seabed-grid", "orbital-aerial", "single-object-void", "vertical-descent", "multiplicity-swarm", "mask-wipe", "travel", "Who keeps listening", "An aerial view of the 75 domes going dark under the crane, one left lit with a question"),
]

AMBIENT = {1: "confetti falls, the spotlight sweeps, the curtain sways", 2: "the domes pulse, bubbles rise", 3: "the pencil scratches, paper rustles, the lamp hums",
           4: "the cards flutter, the flags snap", 5: "the lanes streak, confetti falls", 6: "the reel spins, waveforms ripple", 7: "the stack sways, dots shimmer",
           8: "the plate flexes, dots shimmer", 9: "the ghost shimmers, the dots pulse", 10: "the seismogram scrolls, the sign settles", 11: "the banner swings, the spotlight sweeps",
           12: "bubbles rise, the question pulses, the ring pulse slows"}
CENTER = {1: "the Robot at x540 y1000", 2: "Bunk at x540 y1000", 3: "the analyst's pencil at x540 y1000", 4: "the Robot at x540 y1000", 5: "the finish line at x540 y1000", 6: "the reel at x540 y1000",
          7: "the Sheet stack at x540 y1000", 8: "the outer rise at x540 y1000", 9: "the overlay at x540 y1000", 10: "the seismogram at x540 y1000", 11: "Bunk at x540 y1000", 12: "the last Bunk at x540 y1000"}
HERO = {
 1: ("Robot + proscenium stage + banner + confetti + trapdoor + Sheet + Bunk", "30% Robot, 25% Bunk, 25% banner, 20% confetti"),
 2: ("Bunk row + seabed + strip map + shore pins + Sheet + dated ring", "35% Bunks, 25% map, 20% Sheet, 20% pins"),
 3: ("analyst + pencil + squiggle + Sheet + two sleeve plates + hands", "30% analyst, 30% squiggle, 20% Sheet, 20% hands"),
 4: ("Robot + P and S flags + squiggle + tray + Sheet + worldwide cards", "40% Robot, 30% squiggle, 30% tray"),
 5: ("four racers + lanes + finish line + medals + meter", "40% racers, 30% lanes, 30% finish"),
 6: ("recording reel + waveforms + Robot slot + Sheet tab + Halibut + gold dots", "35% reel, 30% waveforms, 35% dots"),
 7: ("Sheet stack + gold dots + 3X numeral + tag + size key", "40% stack, 30% key, 30% tag"),
 8: ("plate cross-section + outer rise bulge + gold dots + gold ring", "40% plate, 35% dots, 25% Bunk"),
 9: ("overlay map + ghost map + gold and chalk dots + dotted box + Halibut", "50% map, 30% dots, 20% box"),
 10: ("window bar + seismogram + coral sign + crane hook + first dome", "35% seismogram, 30% sign, 35% crane"),
 11: ("banner + spotlight + Bunk + analyst + Sheet + Robot", "30% banner, 30% Bunk, 20% analyst, 20% Robot"),
 12: ("aerial dome grid + crane + one lit dome + question mark", "40% grid, 30% crane, 30% dome"),
}
PARTS = {1: 50, 2: 56, 3: 40, 4: 44, 5: 52, 6: 38, 7: 46, 8: 44, 9: 36, 10: 38, 11: 42, 12: 36}
KICKS = (3, 26)
STAGE3D = {k: "planes" for k in HERO}
CAMERA = {1: "dollyThrough", 2: "truckAcross", 3: "dollyThrough", 4: "craneDown", 5: "truckAcross", 6: "dollyThrough", 7: "craneDown", 8: "craneDown+dollyThrough", 9: "dollyThrough", 10: "truckAcross", 11: "dollyThrough", 12: "craneDown+dollyThrough"}


def est_starts():
    t, out = 0.0, {}
    for i, s in enumerate(LINES):
        out[i] = t
        t += len(s.split()) * 0.4 + 0.6 * len(re.findall(r"[.?!]", s)) + 0.15
    out["end"] = t
    return out


def line_starts():
    p = OUT / "vo_lines.json"
    if p.exists():
        v = json.loads(p.read_text())["lines"]
        starts = {x["idx"]: float(x["start"]) for x in v}
        starts["end"] = max(float(x["end"]) for x in v)
        return starts, True
    return est_starts(), False


def load_words():
    p = OUT / "audio" / "words.json"
    if not p.exists():
        return {}
    w = json.loads(p.read_text())
    ws = w["words"] if isinstance(w, dict) else w
    out = {}
    for x in ws:
        out.setdefault(int(x["seg"]), []).append(x)
    return out


def norm(s):
    return "".join(c for c in s.lower() if c.isalnum())


def _phrase(line, anc):
    words = LINES[line].split()
    if isinstance(anc, tuple):
        want, nth = anc
        hits = [i for i, w in enumerate(words) if norm(w) == norm(want)]
        if len(hits) >= nth:
            i = hits[nth - 1]
            return " ".join(words[i:i + 4])
    return " ".join(words[:4])


def build():
    starts, real = line_starts()
    end = starts["end"]
    words = load_words() if real else {}
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
    for (bid, shot, line, anc, sfx, subj, act, emo, ann, shows, reaction, rehook) in B:
        sh = shot_for(line)
        if ', a plate reads ' in shows:
            ann = shows.split(', a plate reads ')[-1].strip().rstrip('.')
        a = round(at(line, anc), 3)
        beats.append({
            "id": bid, "shot": sh, "at_s": a, "vo_line": line,
            "anchor": {"vo_line": line, "fraction": anc if not isinstance(anc, tuple) else 0.0, "offset": round(a - starts[line], 3)},
            "offset": round(a - starts[line], 3), "vo": LINES[line], "phrase": _phrase(line, anc),
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
            "camera": CAMERA[sid], "transition_in": trans, "thread": thread, "stage3d": STAGE3D[sid],
            "centered": CENTER[sid], "means": means, "ambient": AMBIENT[sid],
            "hero": {"name": HERO[sid][0], "parts": PARTS[sid], "zones": 3, "detail_note": HERO[sid][1]},
            "id": idx, "start_s": st,
        })
    for i, s in enumerate(shots):
        nx = shots[i + 1]["start_s"] if i + 1 < len(shots) else end
        s["t"] = f"{s['start_s']:.3f}-{nx:.3f}"

    def b_at(i):
        return next(b for b in beats if b["id"] == i)["at_s"]

    palette = "oxblood seafloor and stage, glowing mint seafloor ears, bright yellow machine dots, chalk human-checked dots and coral limit plates"
    board = {
        "run_date": "2026-11-04", "slug": "the-ears-did-the-work", "title": "The Ears Did the Work",
        "concept": ("An AI picker, EQTransformer, retrained by G. Barcheck (Cornell) and N. A. Ruppert (USGS) on a hand-checked catalog from the 2018 to 2019 Alaska Amphibious Community Seismic Experiment (75 seafloor and 30 land seismometers), "
                    "found roughly three times as many earthquakes along the Alaska Peninsula than the analyst-checked catalog, per the authors' abstract. No training strategy was substantially better, local data was what improved it, "
                    "and the biggest gains were far offshore and in the outer rise. The film credits the ears and the pencils, shows the check that passed (same map) and the limit (one temporary experiment, more heard not more shaking), "
                    "and ends asking whether Alaska keeps putting ears on the seafloor. Bunk, a mint-domed seafloor seismometer, is the hero and the catalog Sheet is the throughline."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "exploded-diagram", "motion_vector": "horizontal-traverse", "hero_treatment": "multiplicity-swarm", "layout": "stacked-layers",
                        "register": "editorial-schematic", "palette": palette, "camera_strategy": "locked-drift",
                        "light_story": "dusk-silhouette",
                        "metaphor": "a seafloor ear and a hand-checked catalog sheet that the algorithm's spotlight briefly borrows, then hands back"},
        "palette": palette,
        "divergence_note": ("The last films were a midnight indigo cab with sodium amber and teal (11-02), a storm slate slope with sulphur (11-01), a cream chart desk with cobalt and brass (10-31), an aubergine dusk depot (10-29) and a green-black sonar abyss (10-28). "
                            "This film is oxblood and wine with mint, gold and chalk, played on a stage over a seafloor cutaway. Its hero is a mint-domed seafloor seismometer, "
                            "its stage opens front-on with a trapdoor cut rather than a floor cutaway and it closes on an aerial grid, it has no cab, no slope, no desk, no depot and no green-black sonar, and its signature object is a catalog Sheet whose dots go chalk, gold and outline."),
        "treatment": {"title": "The Robot Takes a Bow", "summary": "Comedian's stage and bow, with the Dramatist's limit scene, the Explainer's waterline and the Enthusiast's Sheet."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A spotlit Robot, a squared-off server machine with eyes, takes a bow under falling confetti and a banner reading AI FINDS 3X THE QUAKES while a mint dome blinks under the stage floor.",
                 "headline": "THE ROBOT TAKES A BOW", "motion_by_s": 0.3,
                 "loopback": "Bunk's mint eye closes and opens again, mirroring the first blink under the stage."},
        "open_loop": {"plant_t": b_at(3), "pay_t": b_at(26), "what": "What really made the picker better? Planted when the paper says otherwise, paid when the banner swings from AI to LOCAL DATA MADE IT BETTER."},
        "open_loop_2": {"plant_t": b_at(15), "pay_t": b_at(22), "what": "Are the new quakes real or noise? Planted with the dotted box on the reel, paid when the ghost map lines up."},
        "throughline": {"object": "the catalog Sheet", "lands_in_button": "the Sheet's gold dots fade to outlines as the Bunks lift, leaving one question",
                        "states": [
                            {"at_s": b_at(1), "state": "bare with six chalk dots on the curtain"},
                            {"at_s": b_at(7), "state": "stamped CHECKED BY HAND"},
                            {"at_s": b_at(35), "state": "slides into the Robot tray as the retraining set"},
                                                        {"at_s": b_at(14), "state": "clipped with a LOCAL tab"},
                            {"at_s": b_at(16), "state": "gold dots fill in to roughly 3X over the chalk ones"},
                            {"at_s": b_at(43), "state": "overlaid by the ghost map and still matching"},
                            {"at_s": b_at(25), "state": "margin note 2018 TO 2019 ONLY in coral"},
                            {"at_s": b_at(28), "state": "dots faded to outlines as the Bunks lift"}]},
        "reveals": [
            {"t": b_at(5), "type": "scale-pullback", "what": "from one Bunk to a wave of 75 along the seabed", "hold_s": 0.8},
            {"t": b_at(16), "type": "morph-to-chart", "what": "gold dots fill the Sheet stack up to a 3X numeral", "hold_s": 0.8},
            {"t": b_at(19), "type": "scale-pullback", "what": "from the Sheet to the whole plate cross-section with the outer rise bulge", "hold_s": 0.8},
            {"t": b_at(26), "type": "build-on", "what": "the banner swings from AI to LOCAL DATA and the spotlight finds Bunk and a pencil", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.7}, {"line": 1, "offset": 0.0, "level": 1.0}, {"line": 3, "offset": 0.0, "level": 0.8},
            {"line": 4, "offset": 0.0, "level": 1.1}, {"line": 6, "offset": 0.0, "level": 1.2}, {"line": 8, "offset": 0.0, "level": 0.6},
            {"line": 9, "offset": 0.0, "level": 0.2}, {"line": 10, "offset": 0.0, "level": 1.2},
            {"at_s": round(b_at(28) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(28) + 0.8, 3), "level": 0.6},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(28) - 0.3, 3), "riser_at": round(b_at(27), 3), "silence_at": round(b_at(28) - 0.3, 3),
                      "payoff_at": b_at(28), "button_pattern": "callback", "interrupt_at": b_at(23), "extra_dips": [b_at(26)]},
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
    book.raise_if_missing("board_1104 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1104Ids.ts").write_text(
        "// GENERATED by scripts/board_1104.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
