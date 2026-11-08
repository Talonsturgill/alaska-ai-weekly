#!/usr/bin/env python3
"""2026-11-08 "The Ground Takes Notes": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1108.py gen       # write out/dispatch/storyboard.json (estimated timing until vo_lines.json exists)
    python3 scripts/board_1108.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json
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
 (1, 0, 0.0, "pop", "Strand", "wakes in a pale overcast soil cutaway as one terracotta thaw drop falls through the road and lands on its plug, its eyes snap open", "startled", "UTQIAGVIK ROAD EMBANKMENT", "the cable ripples", ""),
 (3, 0, W("Under"), "whoosh", "two cables", "unspool side by side through the soil under the road slab, the near one Strand with a face and the second a plain violet run", "proud", "2 CABLES", "the cables settle", ""),
 (4, 0, W("kilometer"), "ping", "a ruler", "pulls out along one cable with ten ticks while a blank paper ribbon slides from its plug", "reading", "1 KM EACH", "the ruler locks", ""),
 (5, 1, 0.0, "thock", "a fiber interrogator box", "on a field table at the road edge lights its lamp as the cable rises into it and the paper ribbon starts to print", "focused", "FIELD STATION", "the lamp glows", ""),
 (7, 1, W("to"), "thock", "a date plate", "flips to SEPT 2021 then spins to JUNE 2024 while the ribbon inks thirty three months", "reading", "SEPT 2021 TO JUNE 2024", "the plate settles", ""),
 (8, 1, W("hundred"), "clank", "steel calipers", "snap open over the first tenth of a long road ruler labelled 100 METERS", "firm", "100 METERS", "the ruler dims", ""),
 (9, 1, W("road"), "pop", "a pewter dial", "hangs in the corner with a caution-yellow strip of tape over its window", "puzzled", "?", "the dial swings", ""),
 (10, 2, 0.0, "whoosh", "a plate wall", "slides in with a PENN STATE plate while the ribbon tail runs across it toward a doorway", "curious", "PENN STATE · DIGITAL TWIN", "the plate settles", ""),
 (11, 2, W("Dmitry"), "tap", "a plate", "drops beside it as the ribbon tail threads through its eyelet naming the UAF co-author", "reading", "DMITRY NICOLSKY", "the plate swings", ""),
 (12, 2, W("University"), "pop", "a second plate", "drops below it as the ribbon tail threads through its eyelet", "reading", "UNIVERSITY OF ALASKA FAIRBANKS", "the plate swings", ""),
 (13, 2, W("number"), "creak", "the taped dial", "swings to center as Strand peeks under the corner of the tape", "puzzled", "HOW CLOSE DOES IT GET?", "the tape lifts", "rehook: the taped dial swings to center and Strand peeks under it"),
 (15, 3, 0.0, "clunk", "the HEAT solver", "slides in with a camera pull while the ribbon end feeds into its intake slot", "focused", "HEAT TRANSFER SOLVER", "the box settles", "rehook: the heat solver slides in and swallows the ribbon end"),
 (16, 3, W("inside"), "pop", "Knot", "a six node network with eyes drops into the porthole and settles", "curious", "NEURAL NETWORK", "the network settles", ""),
 (17, 3, W("estimates"), "tick", "the UNFROZEN WATER dial", "swings its needle as a fogged jar brightens", "focused", "UNFROZEN WATER", "the jar brightens", ""),
 (18, 3, W("thermal"), "tick", "the CONDUCTIVITY dial", "swings its needle as the second jar brightens", "focused", "THERMAL CONDUCTIVITY", "the jar brightens", ""),
 (19, 4, 0.0, "creak", "the two needles", "swing through wide pale arcs", "puzzled", "UNCERTAIN SOIL PROPERTIES", "the needles wobble", ""),
 (20, 4, W("Penn"), "tap", "an essay byline", "drops onto the ribbon and threads the first bead into the intake", "reading", "XIAO · PUBLISHED ESSAY", "the byline settles", ""),
 (21, 4, W("data"), "tick", "white beads", "patter along the ribbon into the intake while the needle arcs shrink step by step", "proud", "NEW DATA IN · MODEL ADJUSTS", "the arcs tighten", ""),
 (23, 4, W("Keep"), "pop", "a blank paper tag marked with a question mark", "swings in beside the ribbon", "curious", "ONE MORE NUMBER", "the tag swings", ""),
 (25, 5, 0.0, "tick", "a bench of three witness instruments", "slides in while Strand feeds the printed line up from a floor port and the seismometer drum brightens as it passes", "proud", "SEISMIC", "the drum lights", "rehook: three witness instruments slide in and light one by one"),
 (26, 5, W("borehole"), "chime", "the borehole thermistor string", "brightens bead by bead", "proud", "BOREHOLE", "the string lights", ""),
 (27, 5, W("lab"), "tick", "the lab oven", "brightens its window", "proud", "LAB", "the oven lights", ""),
 (28, 6, 0.0, "whoosh", "the camera", "rises and pulls back from one road slab to a long painted shoreline while a short ribbon stub lies beside the slab", "somber", "THE FAIR CASE AGAINST", "the shoreline unrolls", ""),
 (29, 6, W("one"), "thud", "a caliper span", "snaps onto the road slab against the long shoreline", "somber", "ONE ROAD", "the tag lands", ""),
 (30, 6, W("town"), "thud", "a second tag", "drops beside it as Strand bends to span the slab and comes up short of the shoreline", "somber", "ONE TOWN", "Strand bends", ""),
 (31, 6, W("predicts"), "tick", "a thermometer needle", "swings up while the ribbon stub gains a tick at its tip", "somber", "TEMPERATURE", "the strip dips", ""),
 (32, 6, W("not"), "crack", "a tag reading ROAD FAILURE", "drops beside it and a strike-through crosses it", "somber", "NOT ROAD FAILURE", "the tag cracks", ""),
 (33, 7, 0.0, "thud", "the taped dial", "rolls into a pool of white light as an engraved plate clips onto its housing", "somber", "RESEARCH FRAMEWORK", "the plate clips on", ""),
 (34, 7, W("deployment"), "clunk", "a second engraved plate", "snaps onto the dial housing beside the ribbon stub", "calm", "NO DEPLOYMENT REPORTED", "the plate clips on", ""),
 (35, 7, W("The", 2), "slide", "the dial label plate", "swivels into view", "reading", "ACCURACY", "the label settles", ""),
 (36, 7, W("number"), "scratch", "the tape", "lifts at a corner and tears slowly from the window over the ribbon stub's blank end", "puzzled", "NO ACCURACY NUMBER IN PUBLIC SUMMARIES", "the tape tears", ""),
 (38, 7, W("isn't"), "creak", "the dial window", "opens to plain empty glass under the light", "calm", "THERE ISN'T ONE", "the glass shines", ""),
 (40, 8, W("holds"), "snap", "the steel frame", "snaps around the first tenth of the ribbon", "firm", "HOLDS UP AS A METHOD", "the frame rings", ""),
 (41, 8, W("claim"), "tick", "a small plate", "snaps under the frame", "calm", "THE CLAIM STAYS SMALL", "the plate snaps", ""),
 (42, 9, 0.0, "page", "a black-bordered newsprint chart card", "slides over the scene with a SEPARATE STUDY stamp while a hairline of ribbon stays pinned at its left edge", "reading", "SEPARATE STUDY · ARCTIC COASTAL PLAIN", "the card settles", "rehook: a black-bordered newsprint chart card slides over the whole scene"),
 (43, 9, W("Plain"), "snap", "a tag", "stamps onto the chart corner", "firm", "NOT THE TWIN", "the tag sticks", ""),
 (44, 9, W("projects"), "stamp", "a stamp", "lands on the chart axis corner", "firm", "HIGH EMISSIONS ONLY", "the stamp rings", ""),
 (45, 9, W("less"), "ping", "the curve", "runs flat and low across the chart past a UNDER 10 PERCENT marker", "reading", "UNDER 10% AT RISK", "the curve runs", ""),
 (47, 9, W("twenty"), "whoosh", "the curve", "bends into a cliff and the buildings bar climbs", "alarmed", "2090S · 80% BUILDINGS", "the bar climbs", ""),
 (48, 9, W("sixty"), "tick", "the roads bar", "climbs while the ribbon shrinks to a sliver on the century axis", "reading", "60% ROADS", "the sliver glows", ""),
 (49, 9, W("ninety"), "tick", "the pipelines bar", "climbs", "reading", "90% PIPELINES", "the bar climbs", ""),
 (50, 10, 0.0, "tap", "a typewriter", "types Xiao's quote across the ribbon", "calm", "PENN STATE · XIAO", "the letters land", ""),
 (51, 10, W("ten"), "tick", "ten dashed year ticks", "extend beyond June 2024 on the ribbon", "hopeful", "10 MORE YEARS OF DATA", "the ticks blink", ""),
 (53, 10, W("Ten", 2), "stamp", "the blank tag", "flips to 10 beside the empty dial", "hopeful", "THE OTHER NUMBER", "the tag locks", ""),
 (54, 11, 0.0, "whoosh", "the cutaway", "returns to the cold open with the ruler and the lit 100 meters", "calm", "THE MODEL ISN'T THE HARD PART", "the ruler returns", ""),
 (55, 11, W("record"), "tick", "the dashed ribbon", "runs off frame with a blinking cursor tick", "hopeful", "THE RECORD IS", "the cursor blinks", ""),
 (56, 11, W("Who"), "chime", "a second dashed cable", "unspools toward the horizon while Strand looks into the lens", "hopeful", "WHO LAYS THE NEXT CABLE?", "Strand looks up", ""),
 (57, 11, W("pays"), "pop", "a blank work-order tag", "clips onto the dashed cable end", "hopeful", "AND WHO PAYS?", "the tag swings", ""),
]

# sid, line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "eye", "road-cutaway", "cross-section-cutaway", "stacked-layers", "horizontal-traverse", "single-organic-hero", "", "", "A road, a cable", "A thaw drop wakes Strand under a Utqiagvik road, two kilometer cables unspool, a ruler pulls out and a blank ribbon slides from the plug."),
 (2, 1, "alt-vantage", "medium", "eye", "field-table", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "instrument-as-subject", "carried-element", "carry", "The field station", "Above ground the interrogator box prints the ribbon, a date plate spans 2021 to 2024, calipers pick out 100 meters, a taped dial hangs in the corner."),
 (3, 2, "data-panel", "close", "eye", "plate-wall", "exploded-diagram", "grid-modular", "assemble-build", "multiplicity-swarm", "hard-cut", "match", "Who built it", "Penn State and UAF plates drop in, the ribbon tail threads through each eyelet to a doorway, the taped dial swings to center and Strand peeks from a floor port."),
 (4, 3, "push-detail", "close", "low", "solver-room", "instrument-screen", "hud-instrument-frame", "radial-emanate", "instrument-as-subject", "carried-element", "carry", "Network in solver", "The ribbon comes through the doorway into the heat solver intake, Knot drops into its porthole and two dials swing."),
 (5, 4, "macro-closeup", "insert", "high", "needle-bench", "macro-closeup", "fullbleed-split", "scroll-data", "structure-as-subject", "match-cut", "match", "It adjusts", "Two needle arcs wobble wide, ribbon segments pass through and the arcs tighten, a blank question tag swings in."),
 (6, 5, "subject-portrait", "medium", "eye", "witness-bench", "eye-level-immersive", "single-object-void", "push-in-only", "multiplicity-swarm", "whip-pan", "carry", "Three witnesses", "Strand feeds the printed line up from a floor port and a seismometer drum, a borehole thermistor string and a lab oven each brighten as it passes."),
 (7, 6, "map-territory", "extreme-wide", "high", "shore-stage", "top-down-map", "map-territory", "vertical-descent", "landscape-as-subject", "pull-out", "travel", "The one road ruler", "The camera rises from one road slab to a long painted shoreline while Strand holds on a foreground layer, a caliper span lights, a thermometer swings, a tag is struck through."),
 (8, 7, "subject-portrait", "medium", "low", "audit-stage", "instrument-screen", "centered-hero-lowerthird", "push-in-only", "instrument-as-subject", "mask-wipe", "build", "The empty window", "The taped dial rolls into white light, two engraved plates clip on, the label reads ACCURACY and the tape tears to empty glass."),
 (9, 8, "macro-closeup", "insert", "eye", "verdict-card", "macro-closeup", "single-object-void", "assemble-build", "single-organic-hero", "match-cut", "match", "Small claim", "A steel frame snaps around the first tenth of the ribbon and a small plate snaps under it."),
 (10, 9, "data-panel", "wide", "overhead", "chart-paper", "top-down-map", "grid-modular", "horizontal-traverse", "data-as-subject", "carried-element", "carry", "A separate clock", "A black-bordered newsprint chart card, a curve flat then a cliff, then a hard cut inside the shot to a bare century axis where the ribbon shrinks to a sliver and the roads and pipelines bars climb."),
 (11, 10, "macro-closeup", "close", "eye", "record-ribbon", "macro-closeup", "stacked-layers", "scroll-data", "data-as-subject", "graphic-match", "match", "Ten more years", "Xiao's quote types on the ribbon, ten dashed years extend, the blank tag flips to 10 beside the empty dial."),
 (12, 11, "wide-establish", "extreme-wide", "ground", "road-cutaway", "cross-section-cutaway", "centered-hero-lowerthird", "radial-emanate", "single-organic-hero", "carried-element", "carry", "Who lays the next", "The cold open returns, the ribbon runs off frame, a dashed cable unspools, Strand looks up, a blank work order clips on."),
]
SHOT_ANCHOR = {}

AMBIENT = {1: "the pulse runs, ice glints, the thaw line wobbles", 2: "the lamp glows, the ribbon prints, the pen scribbles", 3: "the plates sway, the ribbon tail drifts",
           4: "the dials twitch, rivets pop, steam puffs", 5: "the needles breathe, the beads patter", 6: "the instruments hum, Strand breathes",
           7: "the strip drifts, the slab sits, Strand bends", 8: "the light breathes, the glass shines", 9: "the frame rivets settle, the ribbon edge flutters",
           10: "the curve glows, bars rise, the sliver pulses", 11: "the letters land, the ticks blink", 12: "the pulse runs, the cursor blinks"}
CENTER = {1: "Strand head at x790 y920", 2: "the box at x300 y900", 3: "the dial at x540 y1000", 4: "the solver at x540 y880", 5: "the dials at x540 y800", 6: "the instruments at x540 y900", 7: "Strand head at x540 y1180", 8: "the dial at x540 y880", 9: "the frame at x540 y900", 10: "the chart at x540 y880", 11: "the ribbon at x540 y930", 12: "Strand head at x790 y920"}
HERO = {
 1: ("Strand + road slab + soil strata + ruler + ice lenses", "30% Strand, 30% strata, 20% slab, 20% ruler"),
 2: ("interrogator box + ribbon + date plate + calipers + taped dial", "30% box, 25% ribbon, 25% calipers, 20% dial"),
 3: ("plates + ribbon tail + taped dial + Strand", "35% plates, 25% ribbon, 20% dial, 20% Strand"),
 4: ("HEAT solver + Knot + dials + jars + ribbon", "35% solver, 25% Knot, 25% dials, 15% ribbon"),
 5: ("two needle dials + ribbon + beads + blank tag", "35% dials, 25% ribbon, 25% beads, 15% tag"),
 6: ("seismometer drum + thermistor string + lab oven + printed line + Strand", "25% drum, 25% string, 20% oven, 15% line, 15% Strand"),
 7: ("road slab + shoreline strip + tags + Strand + caliper span", "30% strip, 25% slab, 20% tags, 25% Strand"),
 8: ("taped dial + light pool + engraved plates", "45% dial, 30% light, 25% plates"),
 9: ("steel frame + ribbon + small plate", "50% frame, 30% ribbon, 20% plate"),
 10: ("newsprint chart card + curve + bars then a bare century axis + ribbon sliver", "35% chart, 30% curve, 20% bars, 15% sliver"),
 11: ("ribbon + typed quote + ten ticks + tag + empty dial", "30% ribbon, 30% quote, 20% ticks, 20% tag"),
 12: ("Strand + ruler + dashed cable + cursor + work order", "30% Strand, 25% ruler, 25% cable, 20% cursor"),
}
PARTS = {1: 56, 2: 48, 3: 52, 4: 60, 5: 52, 6: 44, 7: 44, 8: 40, 9: 30, 10: 56, 11: 40, 12: 44}
KICKS = (47, 35)
CAMERA = {1: "craneDown+dollyThrough", 2: "truckAcross", 3: "static:plates hold while the ribbon tail moves", 4: "dollyThrough", 5: "craneDown", 6: "truckAcross", 7: "riseWith", 8: "static:the light pool holds the dial", 9: "dollyThrough", 10: "truckAcross", 11: "craneDown", 12: "craneDown+dollyThrough"}

PALETTE = ("pale overcast snow light, warm stone and umber strata, bone-white ice, a thin terracotta thaw line, a saturated violet fiber cable hero with a white pulse, pewter instruments, a black-and-white newsprint separate-study card and caution yellow tape reserved for the missing number")

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

    SHOT_ST = {}
    for row in S:
        sid_, line_ = row[0], row[1]
        ln, anc_ = SHOT_ANCHOR.get(sid_, (line_, 0.0))
        SHOT_ST[sid_] = round(at(ln, anc_), 3) if sid_ in SHOT_ANCHOR else round(starts[line_], 3)

    def shot_for(a_):
        return max(i for i, row in enumerate(S, 1) if SHOT_ST[row[0]] <= a_ + 0.001)

    beats = []
    for (bid, line, anc, sfx, subj, act, emo, ann, reaction, rehook) in B:
        a = round(at(line, anc), 3)
        sh = shot_for(a)
        shows = f"{subj} {act}, a plate reads {ann}"
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
        st = SHOT_ST[sid]
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
        "run_date": "2026-11-08", "slug": "the-ground-takes-notes", "title": "The Ground Takes Notes",
        "concept": ("Under one Utqiagvik road two kilometer fiber cables recorded temperature and seismic data from September 2021 to June 2024, and a Penn State led team with UAF's Dmitry Nicolsky built a digital twin that puts a neural network inside a heat transfer physics solver to estimate uncertain soil properties and adjust as data arrives. "
                    "The film gives the fair case against it its own scene, one road in one town, temperature not road failure, a research framework with no reported deployment and no accuracy number in the public summaries, then shows a separate study's risk curve and Xiao's ten more years. "
                    "A long violet cable named Strand is the hero and a record ribbon the throughline, ending long-dashed and open on who lays the next cable and who pays."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "exploded-diagram", "motion_vector": "scroll-data", "hero_treatment": "single-organic-hero", "layout": "grid-modular",
                        "register": "overcast-section", "palette": PALETTE, "camera_strategy": "lateral-travel",
                        "light_story": "overcast-snow-light",
                        "metaphor": "a violet fiber cable with a face that feels the ground, a paper record ribbon that is printed, fed into a solver, narrowed on two needle dials, held against three witnesses, shrunk to a sliver beside a separate study and extended as ten dashed years, and a dial whose window stays empty because no accuracy number is public"},
        "palette": PALETTE,
        "divergence_note": ("Recorded palettes. 11-06 tangerine office walls, teal desks, mint hero, magenta ink. 11-02 midnight indigo cab, sodium amber, teal stream, magenta stamps. 11-01 moss green slope, storm slate, sulphur key, lantern gold. 10-31 sage and cream chart desk, cobalt sea, graphite pencil, brass, vermilion. 10-29 aubergine dusk, rose violet snow, ember orange. 10-24 orbital navy, ember amber, ice cyan, peat. 10-17 deep navy cutaway in frost noon. The 06-26 film on this same permafrost story: ice indigo cutaway, ochre active layer, coral thaw front. "
                            "This film is a pale overcast section in warm stone and umber with bone-white ice and a cool white paper, a saturated violet cable hero, pewter instruments, a black and white newsprint separate-study card and caution yellow on one strip of tape. It breaks all three legs of 10-31's cobalt, graphite and cream, and shares no hue family with any other film above. The one deliberate overlap is a thin terracotta thaw line and drop, a minimal-area callback to the 06-26 coral thaw front on the same story, kept to a few pixels of line. "
                            "There is no ghost landscape and no dotted twin: 'the model adjusts' is two needle arcs narrowing as ribbon segments feed the solver, where 06-26 and 11-01 redrew a ghost. Its signature object is a record ribbon that is printed above ground, fed into a solver, held against three witness instruments, shown as a stub beside a slab, shrunk to a sliver on a century axis and extended as ten long-dashed years."),
        "treatment": {"title": "The Ground Takes Notes", "summary": tre["judge_reasoning"]},
        "angle": json.loads((OUT / "angle.json").read_text()),
        "hook": {"pattern": "anomaly-question", "frame1": "One terracotta thaw drop falls through a road slab in a pale overcast soil cutaway and lands on a cable with a face, its eyes snap open, a plate reads UTQIAGVIK ROAD EMBANKMENT.",
                 "headline": "THE GROUND TAKES NOTES", "motion_by_s": 0.3,
                 "loopback": "The cold open framing returns with the ribbon running off frame and a dashed second cable unspooling while Strand looks into the lens."},
        "open_loop": {"plant_t": b_at(9), "pay_t": b_at(38), "what": "What is the number nobody published? Planted with a pewter dial taped shut in the corner, paid when the tape peels and the accuracy window is plain empty glass."},
        "open_loop_2": {"plant_t": b_at(23), "pay_t": b_at(53), "what": "What is the one more number? Planted with a blank tag marked with a question mark, paid when Xiao's ten more years of data flips the tag to 10 beside the empty dial."},
        "throughline": {"object": "a record ribbon", "lands_in_button": "the ribbon runs off frame long-dashed with a blinking cursor, the record the next cable has to start",
                        "states": [
                            {"at_s": b_at(4), "state": "STUB, a blank ribbon sliding out of Strand's plug"},
                            {"at_s": b_at(15), "state": "FED into the solver intake slot"},
                            {"at_s": b_at(28), "state": "MEASURED, thin beside one road slab and a long shoreline"},
                            {"at_s": b_at(42), "state": "A hairline pinned to the left edge of the separate study card"},
                            {"at_s": b_at(48), "state": "A SLIVER on the century axis"},
                            {"at_s": b_at(51), "state": "DASHED, ten unlit years of long-dashed ticks"},
                            {"at_s": b_at(55), "state": "OPEN, running off frame with a blinking cursor"}]},
        "reveals": [
            {"t": b_at(4), "type": "scale-pullback", "what": "from Strand's plug to a kilometer ruler with ten ticks", "hold_s": 0.8},
            {"t": b_at(28), "type": "scale-pullback", "what": "from one road slab to a long painted shoreline strip", "hold_s": 0.8},
            {"t": b_at(42), "type": "morph-to-chart", "what": "a black-bordered newsprint chart card with a curve flat to mid century then a cliff and three bars", "hold_s": 0.8},
            {"t": b_at(48), "type": "scale-pullback", "what": "from 33 months of ribbon to a sliver on the century axis", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 1.4}, {"line": 1, "offset": 0.0, "level": 0.5}, {"line": 2, "offset": 0.0, "level": 1.5},
            {"line": 3, "offset": 0.0, "level": 0.4}, {"line": 4, "offset": 0.0, "level": 1.6}, {"line": 5, "offset": 0.0, "level": 0.35},
            {"line": 6, "offset": 0.0, "level": 0.3}, {"line": 7, "offset": 0.0, "level": 0.3},
            {"at_s": round(b_at(38) - 0.4, 3), "level": 0.1}, {"at_s": round(b_at(38) + 0.8, 3), "level": 1.8},
            {"line": 9, "offset": 0.0, "level": 0.6}, {"line": 10, "offset": 0.0, "level": 0.4}, {"from_end": 2.6, "level": 0.9}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "room",
            "build_steps": 4, "dip_at": round(b_at(38) - 0.4, 3), "riser_at": round(b_at(36), 3), "silence_at": round(b_at(38) - 0.4, 3),
            "payoff_at": b_at(38), "button_pattern": "callback", "interrupt_at": b_at(28), "extra_dips": [b_at(50)]},
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
    book.raise_if_missing("board_1108 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1108Ids.ts").write_text(
        "// GENERATED by scripts/board_1108.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
