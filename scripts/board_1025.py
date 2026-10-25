#!/usr/bin/env python3
"""2026-10-25 "One Word, Every Size": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1025.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1025.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "thunk", "the Plate", "slams onto the Cubby's door with an overshoot and a ring of rain spray", "smug", "DATA CENTER",
  "a rainy powerhouse floor, a fridge-size copper box with a face, the Cubby, and a brass-rimmed enamel sign with a face, the Plate, reading DATA CENTER slams onto its door like a bow tie and grins",
  "the Plate swings on its hinge and the Cubby hum-bounces", "plant: where does the sign stop fitting"),
 (2, 1, 0, W("fridge"), "ping", "the Cubby", "hum-bounces and puffs a warm breath under the sign", "nervous", "FRIDGE SIZE",
  "the Cubby shivers under the sign, a small plate reads FRIDGE SIZE, rain runs down the window behind",
  "the Cubby hums and the rain runs", ""),
 (3, 1, 0, W("campus"), "whoosh", "a gull", "snatches the Plate off the Cubby's door and flaps across to a block as big as a hillside sliding in from frame right", "alarm", "CAMPUS",
  "a gull snatches the one Plate off the Cubby's door and flaps it across to a block as big as a hillside sliding in from the right, a small plate reads CAMPUS",
  "the block rumbles in and the gull flaps", ""),
 (4, 1, 0, W("gigawatt"), "rumble", "the Plate", "snaps onto the block and stretches like taffy while its lettering holds its size", "strained", "1 GIGAWATT",
  "the Plate snaps onto the huge block and stretches like taffy across it, face squished and straining, DATA CENTER lettering unchanged",
  "the Plate twangs and the rain spatters", ""),
 (5, 2, 1, 0.0, "snap", "zoning map", "hard cuts in as a painted wall map of Sitka with a fjord and five tinted zones", "plain", "SITKA · OCTOBER 21ST",
  "a hard cut to a painted sign-shop wall map of Sitka, island and fjord, five tinted zone patches on the town, a boxed tag reads SITKA, OCTOBER 21ST",
  "the fjord water ripples and rain streaks the glass", ""),
 (6, 2, 1, W("unanimously"), "pop", "commission post", "rises on the boardwalk beside the map", "plain", "PLANNING COMMISSION · UNANIMOUS",
  "a cedar post springs up beside the map with a nameplate PLANNING COMMISSION, UNANIMOUS",
  "the post settles and rain drips off its arm", ""),
 (7, 2, 1, W("banning"), "thump", "RECOMMENDED stamp", "slams across the map in signal pink ink with squash and a ring of spray, the zones taking dashed hatching", "alert", "RECOMMENDED · A BAN IN EVERY ZONE",
  "a big rubber stamp slams RECOMMENDED across the map in signal pink ink, every zone patch taking dashed hatching, not a fill, and a plate reads RECOMMENDED, A BAN IN EVERY ZONE",
  "the ink settles and the stamp lifts", ""),
 (8, 2, 1, W("radio"), "slide", "radio tag", "swings in on a hook from the map frame", "plain", "PER KCAW · SITKA PUBLIC RADIO",
  "a small radio-tower tag swings in on a hook from the map frame reading PER KCAW, SITKA PUBLIC RADIO",
  "the tag swings and settles", ""),
 (9, 3, 2, 0.0, "creak", "stamped sheet", "slides along a cedar rail toward a mailbox marked SITKA ASSEMBLY", "plain", "NEXT · THE SITKA ASSEMBLY · DATE NOT SET",
  "the stamped sheet slides along a boardwalk rail toward a cedar mailbox marked SITKA ASSEMBLY, a plate reads NEXT, THE SITKA ASSEMBLY, DATE NOT SET",
  "the mailbox flag trembles and rain drips", ""),
 (10, 3, 2, W("nobody"), "tick", "empty lot", "reveals a bare lot with a sign and a gull perched on it", "plain", "NO DATA CENTER PROPOSED IN SITKA",
  "the camera trucks to a bare gravel lot behind a chain rail with a plain sign NO DATA CENTER PROPOSED IN SITKA and a gull perched on top, looking at the camera",
  "the gull shifts and the puddles ripple", ""),
 (11, 4, 3, 0.0, "page", "city memo", "unfolds on a cedar frame in a rain-streaked window", "plain", "CITY MEMO",
  "a cream memo sheet unfolds on a cedar frame against a rain-streaked window, a heading reads CITY MEMO",
  "the sheet settles and the rain streaks", "rehook: the memo's warning"),
 (12, 4, 3, W("spurred"), "swell", "growth steps", "rise as a staircase of plain boxes beside the memo", "plain", "AI SPURRED THE GROWTH · PER CITY MEMO",
  "a staircase of plain unlabelled boxes climbs beside the memo, a plate reads AI SPURRED THE GROWTH, PER CITY MEMO",
  "the steps rise and rain streaks the glass", ""),
 (13, 4, 3, W("small"), "tap", "quote card", "types the memo's words as the Cubby tiptoes into the frame wearing its sign", "wary", "\"NOT ENTIRELY UNLIKELY\" · CITY MEMO",
  "a quote card types NOT ENTIRELY UNLIKELY, CITY MEMO, while the Cubby tiptoes in from the edge wearing its sign and stops, wide-eyed",
  "the card types and the Cubby bobs", ""),
 (14, 5, 4, 0.0, "snap", "blank ruler", "slides across the frame with no marks at all", "plain", "THE DRAFT · NO SIZE LINE",
  "a long cedar ruler with brass end caps slides across the frame with no tick marks at all, a plate reads THE DRAFT, NO SIZE LINE",
  "the ruler glints and settles", "rehook: the ruler with no marks"),
 (15, 5, 4, W("Rudas"), "clink", "name tag", "drops on a chain from the ruler's end and swings", "plain", "COMMISSIONER RUDAS",
  "a brass name tag drops on a chain from the ruler's end and swings, COMMISSIONER RUDAS, as the Plate climbs onto the ruler and looks along it",
  "the tag swings and the Plate shifts its feet", ""),
 (16, 5, 4, W("kilowatt"), "click", "lab box", "drops onto the ruler beside the Plate", "plain", "1 KW",
  "a small bench box drops onto the ruler beside the Plate and a label reads 1 KW",
  "the box hums", ""),
 (17, 5, 4, W("megawatt"), "knock", "container", "lands beside the lab box", "plain", "1 MW",
  "a shipping-container-size block lands beside it, a label reads 1 MW",
  "the container settles", ""),
 (18, 5, 4, W("gigawatt"), "rumble", "mountain block", "looms in behind both and the Plate stretches across all three until a hairline crack opens", "strained", "1 KW · 1 MW · 1 GW · ONE WORD",
  "a mountain-size block looms behind both, the one Plate stretched across all three until a hairline crack opens in its enamel, a plate reads 1 KW, 1 MW, 1 GW, ONE WORD",
  "the Plate strains and the block rumbles", ""),
 (19, 6, 5, 0.0, "whirr", "penstock", "pours water down a long pipe into a small powerhouse", "plain", "CORDOVA · HYDRO PLANT",
  "a side view of a creek pouring down a penstock pipe through a turning turbine wheel into a small cedar powerhouse, a plate reads CORDOVA, HYDRO PLANT",
  "the water pours and the wheel turns", ""),
 (20, 6, 5, W("fridge"), "hum", "Cubby", "sits on a shelf in the powerhouse beside a dotted fridge outline", "plain", "FRIDGE SIZED · PER SITKA'S MEMO",
  "the Cubby wearing the cracked Plate sits on a shelf in the powerhouse and a dotted fridge outline appears beside it and matches it, a plate reads FRIDGE SIZED, PER SITKA'S MEMO",
  "the Cubby hums and the wheel turns", ""),
 (21, 6, 5, W("fifty"), "tick", "power readout", "ticks onto the Cubby's door", "plain", "150 KW",
  "a small brass readout on the Cubby's door ticks to 150 KW",
  "the readout flickers", ""),
 (22, 7, 6, 0.0, "swell", "one tower", "rises lit with twenty six windows beside a small brass balance under a tarp", "curious", "RECORD PEAK · 26.02 MW",
  "one slim tower rises on a wet ground plane with twenty six lit windows, the Plate at its door, a plate reads RECORD PEAK, 26.02 MW, and a small brass balance stands covered by a tarp beside it",
  "the windows flicker and the tarp flaps", "plant: what is under the tarp"),
 (23, 7, 6, W("thirty"), "rumble", "tower stack", "cranes up as thirty eight identical towers stack through the cloud deck and off the top of the frame", "alarm", "1 GW IS ABOUT 38 TIMES THAT PEAK",
  "the camera cranes up and thirty eight identical lit towers stack through the cloud deck and out of the top of the frame, a plate reads 1 GW IS ABOUT 38 TIMES THAT PEAK, a small tag OUR MATH thumps onto the top, a tiny gull on the first tower looks up",
  "the clouds part and the towers glow", ""),
 (25, 8, 7, 0.0, "slide", "staff signpost", "rises on the boardwalk and sags as rain drips from its arm", "plain", "STAFF DID NOT PROPOSE A BAN",
  "a cedar signpost rises from the boardwalk reading STAFF DID NOT PROPOSE A BAN, the Plate standing at its foot, rain dripping from its arm",
  "the post sways and the rain drips", "rehook: who overrode whom"),
 (26, 8, 7, W("sustainability"), "knock", "second signpost", "rises beside it", "plain", "OCTOBER 5TH · SUSTAINABILITY COMMISSION",
  "a second signpost rises, OCTOBER 5TH, SUSTAINABILITY COMMISSION",
  "the post settles", ""),
 (27, 8, 7, W("unanimously"), "chime", "unanimous bell", "rings on the second post", "plain", "UNANIMOUS · A PERMIT",
  "a small brass bell on the second post rings and a plate reads UNANIMOUS, A PERMIT",
  "the bell swings", ""),
 (28, 8, 7, W("instead"), "thump", "dashed board", "rolls on a boardwalk hand-cart along the near boardwalk in front of both signposts toward the Assembly mailbox", "alert", "THE PLANNING COMMISSION RECOMMENDED A BAN INSTEAD",
  "a wide dashed RECOMMENDATION board on a boardwalk hand-cart rolls along the near boardwalk in front of both signposts, which stay readable, toward the Assembly mailbox, a plate reads THE PLANNING COMMISSION RECOMMENDED A BAN INSTEAD",
  "the board sways as it passes and the rain drips", ""),
 (29, 9, 8, 0.0, "click", "hammer", "swings in and drives one nail through a plain sign board", "plain", "A BAN · ONE CLEAR RULE",
  "a hammer swings in on a hook and drives one nail through a plain sign board, a plate reads A BAN, ONE CLEAR RULE",
  "the board shudders and the nail rings", ""),
 (30, 9, 8, W("tool"), "tap", "ruler", "slides under a second plain sign board and the board settles on it", "plain", "WHICH TOOL KEEPS CONTROL",
  "the blank ruler slides under a second plain sign board and the board settles on it, a plate reads WHICH TOOL KEEPS CONTROL",
  "the board rocks and settles", ""),
 (31, 10, 9, 0.0, "hush", "the island", "settles under a squall as a stone island with a lit town and no bridge", "plain", "SITKA",
  "a hard cut to a stone island in a dark teal sound under a squall, a tiny lit town, the Plate hanging on the powerhouse, a long dangling extension cord that ends at the shore above the water",
  "the rain falls and the town windows flicker", ""),
 (32, 10, 9, W("island"), "creak", "extension cord", "dangles from the shore over dark water", "wary", "ISLANDED GRID · ALL HYDRO",
  "the cord sways over the water, a plate reads ISLANDED GRID, ALL HYDRO",
  "the cord sways and the water ripples", ""),
 (33, 10, 9, W("water"), "whirr", "two intakes", "turn their wheels in the hills above the town", "plain", "HYDRO",
  "two hydro intakes in the hills turn their wheels over white water above the town",
  "the wheels turn and the foam churns", ""),
 (34, 10, 9, W("hundred"), "roll", "balance", "is stripped of its tarp by the wind and its left pan fills to a line", "plain", "2025 · 120 GWH MADE",
  "the wind whips the tarp off the brass balance from the tower, its left pan fills with blue water to a marked line, a plate reads 2025, 120 GWH MADE",
  "the water sloshes and the beam creaks", ""),
 (35, 10, 9, W("eighteen"), "thunk", "right pan", "fills to almost the same line and the beam hardly tips", "wary", "118 USED",
  "the right pan fills to almost the same line, the beam hardly tipping, a plate reads 118 USED",
  "the beam wobbles and creaks", ""),
 (36, 11, 10, 0.0, "whoosh", "intake stream", "thins as a dry spell sets in and the left pan drops", "plain", "HYDRO MOVES WITH RAIN",
  "the intake stream above the island thins to a trickle and the balance's left pan sinks, the beam tipping, the Plate watching, a plate reads HYDRO MOVES WITH RAIN",
  "the stream thins and the beam dips", "rehook: the human voice"),
 (37, 11, 10, W("Sadlier-Hart"), "knock", "podium", "is set down on the boardwalk with a microphone", "plain", "LISA SADLIER-HART · PUBLIC TESTIMONY",
  "everything else fades to rain and a wooden podium with a microphone is set down on the boardwalk with a testimony sheet clipped to it, LISA SADLIER-HART, PUBLIC TESTIMONY",
  "the podium settles and the rain falls", ""),
 (38, 11, 10, W("loud"), "type", "testimony sheet", "types the quote as it is spoken, held quiet", "plain", "\"WE NEED TO SAY IT LOUD, AND WE NEED TO SAY IT NOW\" · LISA SADLIER-HART",
  "the testimony sheet types WE NEED TO SAY IT LOUD, AND WE NEED TO SAY IT NOW with her name beneath, nothing else moving but rain and the microphone's small sway",
  "the sheet types and the rain falls", ""),
 (39, 12, 11, 0.0, "whoosh", "the ruler", "sweeps back in with a Fairbanks tag in a tiny parka", "curious", "FAIRBANKS",
  "the blank ruler sweeps back in, a tag reads FAIRBANKS wearing a tiny parka, a gull perched on the ruler's end",
  "the tag swings and the gull bobs", "rehook: a number appears"),
 (40, 12, 11, W("moratorium"), "clink", "moratorium tag", "swings down from the Fairbanks tag", "plain", "FAIRBANKS · MORATORIUM PROPOSED · THROUGH DEC. 31ST, 2027",
  "a tag swings down from the Fairbanks tag, FAIRBANKS, MORATORIUM PROPOSED, THROUGH DEC. 31ST, 2027",
  "the tag swings and settles", ""),
 (41, 12, 11, W("five"), "click", "first tick", "is inked onto the ruler at five megawatts as a dashed proposed mark", "curious", "PROPOSED LINE · 5 MW",
  "the first tick is inked onto the ruler at 5 MW as a dashed proposed mark with a small PROPOSED flag, a plate reads PROPOSED LINE, 5 MW, and the Plate looks along the ruler at it",
  "the tick pulses", ""),
 (42, 13, 12, 0.0, "page", "guide cover", "flips open on the boardwalk and a page turns mid-beat", "plain", "\"DATA CENTERS ARE NOT ALL THE SAME\" · UAF ACEP GUIDE",
  "a guide booklet flips open on the boardwalk and a page turns mid-beat, a plate reads DATA CENTERS ARE NOT ALL THE SAME, UAF ACEP GUIDE",
  "the pages flutter", ""),
 (43, 13, 12, W("plainly"), "snap", "two sizes", "slide into two different-sized slots in the open guide", "plain", "NOT ALL THE SAME",
  "the Cubby and the huge block slide into two different-sized slots in the open guide beside the cracked Plate",
  "the slots settle", ""),
 (44, 14, 13, 0.0, "hush", "two sizes", "stand either side of the Plate", "plain", "SAME SIGN · TWO SIZES",
  "the Cubby and the huge block stand either side of the cracked Plate in a thin golden break in the rain, a plate reads SAME SIGN, TWO SIZES",
  "the rain thins and the golden light drifts", ""),
 (45, 14, 13, W("ban"), "knock", "hammer", "taps the ruler's end once", "plain", "A BAN · ONE CLEAR RULE",
  "the hammer taps the end of the ruler once, a plate reads A BAN, ONE CLEAR RULE",
  "the hammer swings and settles", ""),
 (46, 14, 13, W("number"), "tick", "ruler", "shows one open tick in signal pink on the crack seam with a gull holding a pencil", "curious", "A SIZE LINE",
  "the ruler shows one open signal pink tick unlabelled, and a gull hovers over it with a pencil, a plate reads A SIZE LINE",
  "the tick pulses and the pencil circles", ""),
 (47, 14, 13, W("where"), "ping", "the Plate", "hangs from the open tick beside the Cubby", "plain", "A BAN OR A LINE? AND WHERE?",
  "the cracked Plate hangs from the open tick beside the Cubby, the pencil tip hovering, a plate reads A BAN OR A LINE? AND WHERE?",
  "the Plate sways and the pencil hovers", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "wide-establish", "medium", "eye", "powerhouse-floor", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "",
  "One sign", "A rainy powerhouse floor where the Plate grins on the Cubby's door and then stretches like taffy over a hillside block."),
 (2, 1, "map-territory", "medium", "overhead", "zoning-wall-map", "top-down-map", "map-territory", "vertical-descent", "landscape-as-subject", "hard-cut", "match",
  "A ban in every zone", "A painted wall map of Sitka where a RECOMMENDED stamp slams across it and every zone takes dashed hatching."),
 (3, 2, "two-up", "wide", "eye", "mailbox-and-lot", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "whip-pan", "travel",
  "Only a recommendation", "A stamped sheet slides toward a mailbox marked SITKA ASSEMBLY, beside a bare lot with a gull."),
 (4, 3, "subject-portrait", "close", "eye", "memo-sheet", "macro-closeup", "single-object-void", "push-in-only", "data-as-subject", "graphic-match", "match",
  "The memo", "A city memo with a staircase of growth boxes and a quote card while the Cubby tiptoes in."),
 (5, 4, "data-panel", "wide", "eye", "blank-ruler", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "multiplicity-swarm", "match-cut", "match",
  "No size line", "A blank ruler across the frame with a lab box, a container and a mountain block under one stretched Plate."),
 (6, 5, "wide-establish", "medium", "eye", "cordova-powerhouse", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "structure-as-subject", "hard-cut", "match",
  "Cordova", "A small hydro powerhouse with a turning wheel and the Cubby in the doorway at 150 kW."),
 (7, 6, "wide-establish", "extreme-wide", "high", "tower-stack", "orbital-aerial", "stacked-layers", "vertical-rise", "multiplicity-swarm", "carried-element", "carry",
  "Thirty eight towns", "One lit tower of twenty six windows, then a crane up through thirty eight identical towers off the top of the frame."),
 (8, 7, "two-up", "wide", "eye", "signposts", "eye-level-immersive", "fullbleed-split", "vertical-descent", "structure-as-subject", "hard-cut", "match",
  "Overridden", "Two signposts on the boardwalk, staff's and the sustainability commission's, and a dashed RECOMMENDATION board on a hand-cart rolling in front of both."),
 (9, 8, "alt-vantage", "medium", "eye", "tool-wall", "macro-closeup", "single-object-void", "push-in-only", "instrument-as-subject", "match-cut", "match",
  "Which tool", "A hammer and the blank ruler on a cedar wall and the Plate looking from one to the other."),
 (10, 9, "wide-establish", "extreme-wide", "high", "island", "orbital-aerial", "centered-hero-lowerthird", "push-in-only", "landscape-as-subject", "hard-cut", "match",
  "The island", "A stone island under a squall with a cord that ends at the shore and a brass balance of 120 against 118."),
 (11, 10, "subject-portrait", "medium", "eye", "podium", "eye-level-immersive", "single-object-void", "push-in-only", "landscape-as-subject", "carried-element", "carry",
  "Say it loud", "The intake stream thins and the balance tips, then everything fades to rain and a podium with a microphone holds a testimony sheet that types a quote."),
 (12, 11, "data-panel", "wide", "eye", "fairbanks-ruler", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "instrument-as-subject", "whip-pan", "travel",
  "Fairbanks draws a line", "The blank ruler returns, a Fairbanks tag in a parka and a dashed ink proposed tick landing at 5 MW."),
 (13, 12, "subject-portrait", "close", "eye", "guide-cover", "macro-closeup", "single-object-void", "push-in-only", "data-as-subject", "graphic-match", "match",
  "Not all the same", "A guide booklet flips open and the cracked Plate trembles beside it."),
 (14, 13, "subject-portrait", "medium", "eye", "ruler-button", "eye-level-immersive", "single-object-void", "push-in-only", "single-organic-hero", "match-cut", "match",
  "Where does the line go", "Two sizes either side of one sign in a golden break, a hammer tap, and the Plate hanging from one open tick."),
]

AMBIENT = {
 1: "rain runs down the window, the Cubby hums, the Plate swings, the block rumbles",
 2: "the fjord ripples, rain streaks the glass, ink settles, the tag wobbles",
 3: "the mailbox flag trembles, puddles ripple, the gull shifts, rain drips",
 4: "the sheet settles, rain streaks, the steps rise, the Cubby bobs",
 5: "the ruler glints, boxes hum, the Plate shifts its feet, the block rumbles",
 6: "the wheel turns, the creek runs, the Cubby hums, the readout flickers",
 7: "windows flicker, rain falls, clouds part, the gull looks up",
 8: "posts sway, rain drips, the bell swings, the board rocks",
 9: "tools sway on their hooks, the Plate hops and blinks",
 10: "rain falls, town windows flicker, the cord sways, wheels turn, the beam creaks",
 11: "the stream thins, the beam dips, the sheet types, the rain falls, the microphone sways",
 12: "the tag swings, the gull bobs, the tick pulses",
 13: "the pages flutter, the crack runs, the Plate trembles",
 14: "the rain thins, gold light drifts, the hammer swings, the pencil circles, the Plate sways",
}
CENTER = {1: "the Cubby and the Plate at x540 y960", 2: "the map at x540 y960", 3: "the mailbox and the lot at x540 y1000", 4: "the memo at x540 y960", 5: "the ruler at x540 y980",
          6: "the powerhouse at x540 y1000", 7: "the tower at x540 y1000", 8: "the signposts at x540 y1000", 9: "the tools at x540 y960", 10: "the island at x540 y1000",
          11: "the podium at x540 y1000", 12: "the ruler at x540 y980", 13: "the guide at x540 y1000", 14: "the ruler at x540 y1000"}
HERO = {
 1: ("the Plate + Cubby + gull + block", "40% Plate, 25% Cubby, 20% block, 15% gull"),
 2: ("wall map + RECOMMENDED stamp + nameplate", "55% map, 30% stamp, 15% plate"),
 3: ("stamped sheet + mailbox + bare lot + gull", "35% sheet, 30% mailbox, 35% lot"),
 4: ("memo sheet + growth steps + quote card + Cubby", "40% memo, 30% steps, 30% card"),
 5: ("blank ruler + lab box + container + block + Plate", "35% ruler, 40% three sizes, 25% Plate"),
 6: ("powerhouse + wheel + Cubby + readout", "45% house, 30% Cubby, 25% creek"),
 7: ("lit tower + thirty eight tower stack + gull", "30% tower, 55% stack, 15% gull"),
 8: ("two signposts + dashed board on a cart + Plate", "40% posts, 40% board, 20% Plate"),
 9: ("hammer + ruler + wall + Plate", "35% hammer, 35% ruler, 30% Plate"),
 10: ("island + cord + intakes + balance", "35% island, 25% intakes, 40% balance"),
 11: ("thinning stream + balance + podium + testimony sheet", "30% stream, 20% balance, 50% podium"),
 12: ("ruler + Fairbanks tag + tick + gull", "50% ruler, 25% tag, 25% tick"),
 13: ("guide booklet + Plate + crack", "50% book, 50% Plate"),
 14: ("Cubby + block + hammer + ruler + open tick + Plate", "30% sizes, 25% hammer, 45% tick and Plate"),
}
PARTS = {1: 52, 2: 48, 3: 44, 4: 46, 5: 60, 6: 50, 7: 66, 8: 52, 9: 40, 10: 62, 11: 44, 12: 42, 13: 38, 14: 54}
KICKS = (7, 18)
STAGE3D = {k: "planes" for k in range(1, 15)}
for _k in (4, 5, 8, 9, 13, 14):
    STAGE3D[_k] = "flat:a locked panel with a slow drift where the sheet, the ruler, the posts, the tools, the guide and the tick are the motion"
CAMERA = {1: "dollyThrough", 2: "craneDown", 3: "truckAcross", 4: "static:the memo is the shot", 5: "static:the ruler is the shot", 6: "truckAcross", 7: "riseWith",
          8: "static:the posts and the board are the shot", 9: "static:the tools are the shot", 10: "dollyThrough", 11: "dollyThrough", 12: "truckAcross",
          13: "static:the guide is the shot", 14: "static:the ruler and the open tick are the shot"}


def est_starts():
    t, out = 0.0, {}
    for i, s in enumerate(LINES):
        out[i] = t
        t += len(s.split()) * 0.4345 + 0.6974 * len(re.findall(r"[.?!]", s)) + 0.15
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
        assert sh == shot, (bid, sh, shot)
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
        nx = beats[i + 1]["at_s"] if i + 1 < len(beats) else end
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

    palette = "cedar boardwalk, teal harbor fog, chalk cream enamel signs with brass rims, hydro blue water, signal pink tick and stamp ink, a golden break"
    board = {
        "run_date": "2026-10-25", "slug": "one-word-every-size", "title": "One Word, Every Size",
        "concept": ("KCAW and the Daily Sitka Sentinel report that Sitka's planning commission recommended on October 21st banning data centers in every zone, checked against the City and Borough of Sitka's staff memo, draft ordinance and electric utility annual report, "
                    "the Fairbanks North Star Borough agenda and Alaska's News Source, and the UAF ACEP guide. A brass-rimmed enamel sign with a face, the Plate, reads DATA CENTER and fits a fridge-size copper box, the Cubby, and a gigawatt block alike. "
                    "The film follows that one sign across a painted zoning map, a mailbox, a blank ruler, a Cordova powerhouse, a stack of thirty eight towers, two signposts passed by a dashed recommendation board, a hammer and the ruler, an island balance of 120 made against 118 used, a quiet quote, a Fairbanks tick at 5 MW, a cracked sign and one open signal pink tick."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "horizontal-traverse", "hero_treatment": "structure-as-subject", "layout": "centered-hero-lowerthird",
                        "register": "naturalistic-scene", "palette": palette, "camera_strategy": "dolly-through",
                        "light_story": "storm-dramatic",
                        "metaphor": "one brass sign that fits every size of thing, stretched until it cracks against a ruler with no marks"},
        "palette": palette,
        "divergence_note": ("The last four films were an orbital navy plate with a hot pixel, a paper form in a snowy cutaway building, a plumb bob in dark ground, and a calf on a pewter beach. "
                            "This film is an eye-level rain-day boardwalk town in warm cedar, teal and cream with one signal pink. There is no orbit, no cutaway slice of ground, no desk, no paper creature and no lamp pool. Its world is built of signs, posts, a ruler and a balance. "
                            "HONEST OVERLAP: its hero is a faced object for the fourth film in a row, but it is rigid enamel with a hinge that stretches, shares the frame with a second faced box and a bird, and is not paper or a sensor."),
        "treatment": {"winner": "The Explainer's Plate that stretches over every size and cracks on the ruler, with the Comedian's gull gag and the 38-stack pullback, the Dramatist's island scene drawn at full strength with the Sadlier-Hart quote held quiet, and the Enthusiast's open tick as the button.",
                      "why": "All four pitches converged on one sign that fits every size. The thesis is a SIZE question, so the picture is a sign stretched past its size against a ruler with no marks. The ban's best case gets its own quiet scene and no gag."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A rainy powerhouse floor where a brass-rimmed sign with a face slams onto a fridge-size copper box and grins, rain spray ringing out, a gull dropping from the rafters.",
                 "headline": "THE SAME SIGN", "motion_by_s": 0.3,
                 "loopback": "The last frame is the same Plate and Cubby, now hanging from one open signal pink tick on the ruler, the gull's pencil hovering: the sign that slammed on is now asking where the line goes."},
        "open_loop": {"plant_t": b_at(1), "pay_t": b_at(47), "what": "One sign fits a fridge and a gigawatt. Where does it stop fitting? Planted as the gull flaps the Plate onto a hillside block, paid as the film hands the open tick to the viewer.",},
        "open_loop_2": {"plant_t": b_at(22), "pay_t": b_at(34), "what": "What is under the tarp beside Sitka's peak tower? Planted as a brass balance stands covered beside the tower, paid when the wind strips the tarp on the island and 120 made against 118 used leaves the beam nearly level.",},
        "throughline": {"object": "the Plate", "lands_in_button": "the cracked Plate hanging from one open signal pink tick on the blank ruler",
                        "states": [
                            {"at_s": b_at(1), "state": "smug on the Cubby's door like a bow tie"},
                            {"at_s": b_at(4), "state": "stretched like taffy over a hillside block, lettering unchanged"},
                            {"at_s": b_at(15), "state": "standing on a blank ruler, looking along it"},
                            {"at_s": b_at(18), "state": "stretched across a lab box, a container and a mountain until a hairline crack opens"},
                            {"at_s": b_at(20), "state": "cracked, on the Cubby at Cordova"},
                            {"at_s": b_at(22), "state": "cracked, at the door of Sitka's lit tower"},
                            {"at_s": b_at(25), "state": "cracked, standing at the foot of the staff signpost"},
                            {"at_s": b_at(31), "state": "cracked, hanging on the island's powerhouse"},
                            {"at_s": b_at(36), "state": "cracked, watching the intake stream thin"},
                            {"at_s": b_at(41), "state": "cracked, looking along the ruler at the proposed 5 MW tick"},
                            {"at_s": b_at(44), "state": "cracked, between two sizes in a golden break"},
                            {"at_s": b_at(47), "state": "hanging from one open signal pink tick beside the Cubby"}]},
        "reveals": [
            {"t": b_at(4), "type": "scale-pullback", "what": "the Plate stretches from the fridge-size box to a hillside block", "hold_s": 0.7},
            {"t": b_at(23), "type": "scale-pullback", "what": "the camera cranes up through thirty eight stacked towers off the top of the frame", "hold_s": 0.8},
            {"t": b_at(35), "type": "morph-to-chart", "what": "the island resolves into a brass balance of 120 made against 118 used", "hold_s": 0.8},
            {"t": b_at(41), "type": "build-on", "what": "the first dashed proposed tick is inked onto the blank ruler at 5 MW", "hold_s": 0.8}],
        "tail_s": 3.2, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.6}, {"line": 0, "offset": 3.0, "level": 0.8}, {"line": 1, "offset": 0.0, "level": 0.55},
            {"line": 2, "offset": 0.0, "level": 0.5}, {"line": 3, "offset": 0.0, "level": 0.6}, {"line": 4, "offset": 0.0, "level": 0.7},
            {"line": 5, "offset": 0.0, "level": 0.45}, {"line": 6, "offset": 0.0, "level": 0.8}, {"line": 7, "offset": 0.0, "level": 0.62},
            {"line": 7, "offset": 4.0, "level": 1.0}, {"line": 8, "offset": 0.0, "level": 0.4}, {"line": 9, "offset": 0.0, "level": 0.18},
            {"line": 10, "offset": 0.0, "level": 0.14}, {"line": 10, "offset": 4.0, "level": 0.12}, {"line": 11, "offset": 0.0, "level": 0.6},
            {"line": 12, "offset": 0.0, "level": 0.5}, {"line": 13, "offset": 0.0, "level": 0.7},
            {"at_s": round(b_at(46) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(47) + 0.8, 3), "level": 0.55},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "build_steps": 4, "dip_at": round(b_at(46) - 0.3, 3), "riser_at": round(b_at(23), 3), "silence_at": round(b_at(46) - 0.3, 3),
                      "payoff_at": b_at(47), "button_pattern": "question", "interrupt_at": b_at(28), "extra_dips": [b_at(37)]},
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
    book.raise_if_missing("board_1025 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1025Ids.ts").write_text(
        "// GENERATED by scripts/board_1025.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
