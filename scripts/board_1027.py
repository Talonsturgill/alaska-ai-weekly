#!/usr/bin/env python3
"""2026-10-27 "The Blank Line": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1027.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1027.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "snap", "the Reel", "rolls onto a lilac dusk dock and stops at a teal vault door with squash and overshoot, its cable paying out behind it", "hope", "UP TO $75M",
  "a lilac dusk dock by the water, a saffron cable reel with a face rolls up to a teal vault door and stops with squash and overshoot, its black cable paying out behind it",
  "the cable settles and the reel blinks", ""),
 (2, 1, 0, W("seventy-five"), "ping", "the vault door", "lights its stencilled plate as the Reel looks up", "hope", "UP TO $75M",
  "the vault door's stencilled plate lights up reading UP TO $75M while the reel looks up at it",
  "the plate glints", ""),
 (3, 1, 0, W("unsigned"), "tick", "a pen", "slides in over a contract board and hovers above its blank dotted signature line", "ask", "ONE UNSIGNED LINE",
  "a contract board slides in at the door and a pen hovers above its blank dotted signature line, a plate reads ONE UNSIGNED LINE",
  "the pen trembles and the dots crawl", "plant: who signs the line"),
 (4, 2, 1, 0.0, "thunk", "the gavel", "slams down on its block with a ring of dust", "plain", "AIDEA BOARD · OCT 21ST · RESOLUTION G26-11",
  "a gavel slams onto its block in front of the contract with a ring of dust, a plate reads AIDEA BOARD, OCT 21ST, RESOLUTION G26-11",
  "the dust drifts and the block jumps", ""),
 (5, 2, 1, W("Resolution"), "page", "the contract", "unrolls from the block with its heading line", "plain", "RESOLUTION G26-11",
  "the contract sheet unrolls from the block under the gavel with a heading line and rows of text bars",
  "the sheet settles and curls", ""),
 (6, 2, 1, W("subsidiary"), "pop", "a blank slot", "pops open in the heading line and pulses under the Reel's squint", "ask", "A BLANK SLOT",
  "a highlighted empty slot opens in the contract's text line and pulses while the Reel squints at it",
  "the slot pulses", "plant: the missing word"),
 (7, 2, 1, W("Northstar"), "slide", "the name tag", "swings onto the Reel's cart from a hook", "plain", "NORTHSTAR FIBER DEVELOPMENT (WORKING NAME)",
  "a hanging tag swings onto the Reel's cart reading NORTHSTAR FIBER DEVELOPMENT, WORKING NAME",
  "the tag swings and settles", ""),
 (8, 3, 2, 0.0, "whoosh", "the cable coils", "swing past the lens as a magnifier slides over the contract", "plain", "SUBSEA + TERRESTRIAL FIBER",
  "a magnifier slides over the contract while a coil of black cable with an orange stripe swings past, a plate reads SUBSEA + TERRESTRIAL FIBER",
  "the coil swings and the lens glints", ""),
 (9, 3, 2, W("expect"), "tick", "the magnifier", "sweeps every text line and each one comes up empty", "ask", "ONE WORD IS MISSING",
  "the magnifier sweeps down each text line of the contract and every line comes up empty, a plate reads ONE WORD IS MISSING",
  "the lens bobs and the lines flicker", ""),
 (10, 3, 2, W("thought"), "bloop", "a sticky note", "slaps onto the blank slot", "plain", "HOLD THAT THOUGHT",
  "a butter sticky note slaps onto the blank slot reading HOLD THAT THOUGHT",
  "the note flutters", ""),
 (11, 4, 3, 0.0, "whoosh", "the painted map", "unrolls with four teal cables running south off the coast to a LOWER 48 band", "plain", "ALASKA · LOWER 48",
  "a painted map of Alaska unrolls with four teal cables running south off the coast to a band labelled LOWER 48",
  "the map ripples and the cables sway", "rehook: four cables"),
 (12, 4, 3, W("four"), "ping", "four cables", "light one by one down the map", "plain", "4 UNDERSEA CABLES TO THE LOWER 48",
  "four teal cables light one after another running south, a plate reads 4 UNDERSEA CABLES TO THE LOWER 48",
  "the cables pulse in turn", ""),
 (13, 4, 3, W("1999"), "pop", "two cables", "pull on party hats and 1999 tags", "plain", "2 IN SERVICE SINCE 1999",
  "two of the cables pull on small party hats and hang 1999 tags, a plate reads 2 IN SERVICE SINCE 1999",
  "the hats bob", ""),
 (14, 4, 3, W("typical"), "creak", "the two old cables", "droop a little as a design-life gauge reaches its end mark", "worried", "END OF TYPICAL DESIGN LIFE",
  "the two hatted cables droop slightly as a gauge needle reaches the end mark, a plate reads END OF TYPICAL DESIGN LIFE",
  "the needle settles at the mark", ""),
 (15, 5, 4, 0.0, "slide", "the road sign", "rises at the dead end of a coastal road", "plain", "\"DATA CUL-DE-SAC\"",
  "a road sign rises at the dead end of a short coastal road reading DATA CUL-DE-SAC in quotes",
  "the sign sways", ""),
 (16, 5, 4, W("damaged"), "snap", "one cable", "snaps with a tomato spark and a grey wash spreads across the map", "worried", "ONE DAMAGED SYSTEM CAN DEGRADE OR ISOLATE LARGE PARTS OF THE STATE",
  "one cable snaps with a tomato spark and a grey wash spreads over much of the map, a plate reads ONE DAMAGED SYSTEM CAN DEGRADE OR ISOLATE LARGE PARTS OF THE STATE",
  "the spark fades and the grey breathes", ""),
 (17, 5, 4, W("hub"), "swell", "the sign", "flips from CUL-DE-SAC to HUB as the road bends into a crossing", "hope", "FROM \"CUL-DE-SAC\" TOWARD \"HUB\"",
  "the road sign flips over from CUL-DE-SAC to HUB while the dead-end road bends into a crossing, a plate reads FROM CUL-DE-SAC TOWARD HUB",
  "the sign swings", ""),
 (18, 6, 5, 0.0, "clunk", "a big clock", "slams onto the dock beside the vault with its hands whirling", "plain", "THE MONEY HAS A CLOCK",
  "a big egg-timer clock slams onto the dock beside the vault door with its hands whirling, a plate reads THE MONEY HAS A CLOCK",
  "the clock rocks and the hands whirl", ""),
 (19, 6, 5, W("December"), "bell", "the clock hands", "stop on the red wedge", "plain", "AUTHORITY EXPIRES DEC 31ST, 2028",
  "the clock hands stop on a red wedge, a plate reads AUTHORITY EXPIRES DEC 31ST, 2028",
  "the hands tremble and tick", ""),
 (20, 6, 5, W("extends"), "type", "a small lever", "tilts toward a flag marked UNLESS THE BOARD EXTENDS IT", "ask", "UNLESS THE BOARD EXTENDS IT",
  "a small lever beside the clock tilts toward a flag reading UNLESS THE BOARD EXTENDS IT",
  "the lever wobbles", ""),
 (21, 7, 6, 0.0, "stomp", "fifteen small boxes", "parade onto the dock holding MAYBE sticky notes as the camera pulls back", "plain", "AS MANY AS 15 DATA CENTER PROPOSALS",
  "the camera pulls back as fifteen small faced server boxes parade onto the dock each holding a butter sticky note reading MAYBE?, a plate reads AS MANY AS 15 DATA CENTER PROPOSALS",
  "the boxes bob and the notes flutter", "rehook: fifteen boxes"),
 (22, 7, 6, W("Public"), "paper", "an outlet tag", "swings in on a hook", "plain", "ALASKA PUBLIC MEDIA · OCT 15TH",
  "a small tag swings in on a hook reading ALASKA PUBLIC MEDIA, OCT 15TH",
  "the tag swings", ""),
 (23, 7, 6, W("fifteen"), "pop", "the boxes", "count off in a ripple and hold up their notes", "hope", "15",
  "the fifteen boxes count off in a ripple, each hopping and holding up its note",
  "the boxes hop in sequence", ""),
 (24, 8, 7, 0.0, "thump", "the Clip bouncer", "slides in between the boxes and the vault door", "plain", "SEC. 9",
  "a clipboard bouncer with a face and crossed arms slides in between the boxes and the vault door, a plate reads SEC. 9",
  "the clip rocks and the boxes lean", ""),
 (25, 8, 7, W("binding"), "thunk", "Clip's board", "lights its page", "plain", "SEC. 9 · BINDING CUSTOMER COMMITMENTS",
  "the clipboard's page lights up, a plate reads SEC. 9, BINDING CUSTOMER COMMITMENTS",
  "the page glows", ""),
 (26, 8, 7, W("expressions"), "snap", "the boxes", "press forward with their notes and Clip holds out one hand", "plain", "\"EXPRESSIONS OF INTEREST ... DO NOT SATISFY\"",
  "the boxes press forward holding their notes and Clip holds out one hand, a plate reads EXPRESSIONS OF INTEREST, DO NOT SATISFY",
  "the notes flap", ""),
 (27, 8, 7, W("count"), "hit", "the stamp", "slams DO NOT SATISFY and the sticky notes blow off", "firm", "DO NOT SATISFY",
  "Clip's stamp slams down with a tomato DO NOT SATISFY and a gust blows every sticky note off the boxes",
  "the notes blow away and the dust rings", ""),
 (28, 9, 8, 0.0, "slide", "the Reel and a box", "face off across the contract under a hard lamp", "plain", "THE FAIR CASE AGAINST THE RULE",
  "a hen in a hard hat and an egg face off across the contract under a hard overhead lamp, a plate reads THE FAIR CASE AGAINST THE RULE",
  "the lamp sways and the Reel breathes", "rehook: the fair case against"),
 (29, 9, 8, W("customer"), "ping", "the hen", "folds her wings and a bubble reads WAITS FOR THE CABLE", "firm", "WAITS FOR THE CABLE",
  "the hen folds her wings, a bubble reads WAITS FOR THE CABLE",
  "the bubble wobbles", ""),
 (30, 9, 8, W("cable", 2), "tick", "the egg", "cracks a hairline as a bubble reads WAITS FOR THE CUSTOMER and the camera snap-zooms on the hen", "sweat", "WAITS FOR THE CUSTOMER",
  "a hairline crack opens in the egg, a bubble reads WAITS FOR THE CUSTOMER, and the camera snap-zooms onto the hen's sweating face",
  "the egg cracks and rocks", ""),
 (31, 10, 9, 0.0, "boom", "a glass ceiling", "slams down over the vault at the seventy-five mark", "plain", "$75M · ALL-IN CEILING",
  "a glass ceiling slams down over the vault door and stops at a line marked $75M, a plate reads $75M, ALL-IN CEILING",
  "the glass rings and the dust shakes", ""),
 (32, 10, 9, W("maybe"), "pop", "a MAYBE note", "bounces off the ceiling and flutters away", "plain", "NO BET ON A MAYBE",
  "a MAYBE sticky note bounces off the glass ceiling and flutters away, a plate reads NO BET ON A MAYBE",
  "the note flutters off", ""),
 (33, 11, 10, 0.0, "page", "the magnifier", "returns over the contract and every line is searched", "ask", "THE RESOLUTION NEVER SAYS \"AI\"",
  "the magnifier returns and sweeps the whole contract, a plate reads THE RESOLUTION NEVER SAYS AI",
  "the lens bobs", "rehook: the missing word"),
 (34, 11, 10, W("artificial"), "tick", "three search chips", "flash AI, DATA CENTERS and COMPUTE and each shows 0 MATCHES", "plain", "AI · DATA CENTERS · COMPUTE · 0 MATCHES",
  "three search chips AI, DATA CENTERS and COMPUTE flash in turn and each shows 0 MATCHES",
  "the chips flash", ""),
 (35, 11, 10, W("compute"), "hush", "a tumbleweed", "rolls across the page", "plain", "NOTHING ON THE PAGE",
  "a small tumbleweed rolls across the empty contract page, a plate reads NOTHING ON THE PAGE",
  "the tumbleweed bounces", ""),
 (36, 12, 11, 0.0, "slide", "the AI boxes", "slide off the dock and the Reel stands steadier with its cable", "hope", "TAKE AI OUT",
  "the small boxes slide off the dock and out of frame while the Reel with its cable stands steadier and brighter",
  "the Reel rocks and blinks", ""),
 (37, 12, 11, W("allocated"), "ping", "a river of coins", "pours from a federal broadband cloud toward a row of village roofs", "plain", "BEAD · $1.017 BILLION ALLOCATED",
  "a river of coins pours from a cloud labelled FEDERAL BROADBAND toward a row of village roofs, a plate reads BEAD, $1.017 BILLION ALLOCATED",
  "the coins flow and the cloud drifts", ""),
 (38, 12, 11, W("backbone"), "bloop", "the cable", "runs under the roofs and lights each one", "hope", "LAST MILE NEEDS A BACKBONE",
  "the Reel's cable runs under the whole row of village roofs and lights each one in turn, a plate reads LAST MILE NEEDS A BACKBONE",
  "the roofs light in turn", ""),
 (39, 13, 12, 0.0, "swell", "the Reel", "turns the pen around and holds it out to the row of boxes", "firm", "ANYONE WHO WANTS IN HAS TO SIGN",
  "the Reel turns the pen around and holds it out toward the row of small boxes, a plate reads ANYONE WHO WANTS IN HAS TO SIGN",
  "the pen trembles and the boxes lean", ""),
 (40, 13, 12, W("signed"), "tick", "the signature line", "pulses blank under the hovering pen", "ask", "A SIGNED CUSTOMER",
  "the dotted signature line pulses blank under the hovering pen, a plate reads A SIGNED CUSTOMER",
  "the dots crawl", "pay: who signs the line"),
 (41, 13, 12, W("December"), "thunk", "the clock", "chimes and its hands tick toward the red wedge as the camera returns to the opening pose", "ask", "DEC 31ST, 2028",
  "the clock chimes and its hands tick toward the red wedge while the camera returns to the opening dock pose, a plate reads DEC 31ST, 2028",
  "the hands tick", ""),
 (42, 2, 1, W("board"), "stomp", "an AIDEA banner", "unfurls above the desk and snaps taut", "plain", "AIDEA BOARD",
  "a banner reading AIDEA BOARD unfurls above the desk and snaps taut",
  "the banner flaps", ""),
 (43, 5, 4, W("isolate"), "creak", "the grey wash", "creeps over the end of the coastal road", "worried", "ISOLATED",
  "the grey wash creeps over the end of the coastal road and the road sign dims",
  "the wash creeps", ""),
 (44, 8, 7, W("dollar"), "clip", "a coin", "drops toward the vault slot and Clip's board stops it in mid air", "plain", "NO DOLLAR YET",
  "a gold coin drops toward a slot beside the vault door and Clip's board swings out and stops it in mid air, a plate reads NO DOLLAR YET",
  "the coin spins and hangs", ""),
 (45, 10, 9, W("exposure"), "tick", "the ceiling gauge", "needle climbs to the glass and stops", "plain", "THE MOST IT CAN RISK",
  "a gauge beside the vault door climbs and its needle stops against the glass ceiling, a plate reads THE MOST IT CAN RISK",
  "the needle trembles", ""),
 (46, 12, 11, W("broadband"), "whoosh", "a cloud", "drifts in labelled FEDERAL BROADBAND", "plain", "FEDERAL BROADBAND MONEY",
  "a cloud labelled FEDERAL BROADBAND drifts in over the dock above a row of village roofs",
  "the cloud drifts", ""),
 (47, 12, 11, W("depends"), "thump", "the cable", "lifts under the roofs like a beam as they settle onto it", "hope", "DEPENDS ON A RESILIENT BACKBONE",
  "the Reel's cable lifts under the row of roofs like a beam and the roofs settle onto it, a plate reads DEPENDS ON A RESILIENT BACKBONE",
  "the roofs settle and the cable hums", ""),
 (48, 13, 12, W("sign"), "pop", "the pen", "dips toward the dotted line and the boxes lean in", "ask", "HAS TO SIGN",
  "the pen dips toward the dotted line and the whole row of boxes leans in, a plate reads HAS TO SIGN",
  "the pen dips and the boxes lean", ""),
 (49, 4, 3, W("Lower"), "clink", "the LOWER 48 band", "pulses where the four cables land", "plain", "LOWER 48",
  "the band labelled LOWER 48 pulses at the bottom of the map where the four cables land",
  "the band pulses", ""),
]


# ---- Gate 0B/0C/0D revisions (2026-10-27): re-timed anchors, restaged middle third, the line changing state ------------------------------------
_F = ("key", "shot", "line", "anchor", "sfx", "subject", "action", "emotion", "ann", "shows", "reaction", "rehook")
def _patch(rows, patches, adds, drops=()):
    out = []
    for r in rows:
        d = dict(zip(_F, r))
        if d["key"] in drops:
            continue
        d.update(patches.get(d["key"], {}))
        out.append(tuple(d[k] for k in _F))
    for a in adds:
        out.append(a)
    return out

_PATCH = {
 1: {"sfx": "thump"},
 18: {"action": "slams onto a shelf inside the vault with its hands whirling", "shows": "inside the dark vault a big egg-timer clock slams onto a shelf lit by one lamp with its hands whirling, a porthole behind it shows the lilac dusk, a plate reads THE MONEY HAS A CLOCK"},
 3: {"sfx": "slide", "anchor": W("line")},
 5: {"sfx": "flip"},
 6: {"action": "opens a butter-highlighted gap in the middle of a text bar while the Reel squints at it", "ann": "A GAP IN THE TEXT",
     "shows": "a butter-highlighted gap opens in the middle of one text bar of the contract while the Reel squints at it, a small plate reads A GAP IN THE TEXT"},
 9: {"anchor": W("One"), "action": "sweeps every text line and each one comes up empty except the gap"},
 10: {"anchor": W("isn't"), "sfx": "flip", "action": "slaps onto the butter gap"},
 11: {"ann": "FOUR LINES SOUTH", "shows": "a painted map of Alaska unrolls with four teal cables running south off the coast to a band labelled LOWER 48"},
 12: {"anchor": W("connect"), "sfx": "ping"},
 13: {"anchor": W("two"), "sfx": "pop"},
 14: {"anchor": W("end"), "emotion": "calm", "sfx": "ping", "action": "stand proudly in their hats as a design-life gauge needle reaches its end mark",
      "shows": "the two hatted cables stand steady as a gauge needle reaches the end mark, a plate reads END OF TYPICAL DESIGN LIFE"},
 16: {"emotion": "ask", "action": "a dashed ghost of one cable snaps with a tomato spark and the road lamps along the coast go grey, as a what if",
      "shows": "a dashed ghost of one cable snaps with a tomato spark under the coastal road and the road lamps and houses go grey as a what if, a plate reads ONE DAMAGED SYSTEM CAN DEGRADE OR ISOLATE LARGE PARTS OF THE STATE"},
 19: {"anchor": W("thirty-first"), "shows": "the clock hands stop on a glowing red wedge, a plate reads AUTHORITY EXPIRES DEC 31ST, 2028"},
 20: {"anchor": W("unless"), "sfx": "clank"},
 21: {"ann": "THE LINE FORMS", "shows": "the camera looks out of the vault porthole as fifteen small server boxes in silhouette parade past, each holding a butter sticky note reading MAYBE?, a small plate reads THE LINE FORMS"},
 23: {"ann": "AS MANY AS 15 DATA CENTER PROPOSALS"},
 22: {"sfx": "slide", "ann": "ALASKA PUBLIC MEDIA", "shows": "a small tag swings in on a hook reading ALASKA PUBLIC MEDIA"},
 26: {"action": "press forward and slap their MAYBE notes over the dotted signature line until it is papered over", "sfx": "stomp"},
 27: {"ann": "DO NOT COUNT", "sfx": "hit", "action": "slams DO NOT COUNT and a gust sweeps the sticky notes off the signature line, leaving it bare",
      "shows": "Clip's stamp slams a tomato DO NOT COUNT beside the dotted line and a gust sweeps every sticky note off the line, leaving it bare"},
 28: {"subject": "the Reel and one box", "action": "face off across the contract under a hard overhead lamp", "emotion": "firm",
      "shows": "the Reel and one small faced box face off across the contract under a hard overhead lamp, a plate reads THE FAIR CASE AGAINST THE RULE"},
 29: {"subject": "the box", "action": "holds the pen out and a bubble reads WAITS FOR THE CABLE", "emotion": "firm",
      "shows": "the box holds a pen out toward the Reel, a bubble reads WAITS FOR THE CABLE"},
 30: {"subject": "the Reel", "action": "turns the pen back, a bubble reads WAITS FOR THE CUSTOMER, and the camera snap-zooms onto the Reel's face", "emotion": "sweat", "sfx": "crack",
      "shows": "the Reel turns the pen back toward the box, a bubble reads WAITS FOR THE CUSTOMER, and the camera snap-zooms onto the Reel's sweating face"},
 33: {"ann": "SEARCHING THE TEXT", "shows": "the magnifier returns and sweeps the whole contract while the HOLD THAT THOUGHT note peels off the gap", "sfx": "scratch",
      "action": "returns over the contract and the HOLD THAT THOUGHT note peels off the gap"},
 34: {"anchor": W("artificial")},
 36: {"anchor": 0.0},
 37: {"ann": "BEAD · $1.017 BILLION ALLOCATED"},
 39: {"ann": "THE CABLE DOESN'T NEED AI", "shows": "the Reel turns the pen around so the nib points outward, a plate reads THE CABLE DOESN'T NEED AI",
      "action": "turns the pen around so the nib points outward"},
 40: {"anchor": W("signed"), "action": "pulses blank under the hovering pen while one box looks at it", "ann": "A SIGNED CUSTOMER",
      "shows": "the dotted signature line pulses blank under the hovering pen while one box looks at it without reaching, a plate reads A SIGNED CUSTOMER"},
 41: {"sfx": "chime"},
 48: {"anchor": W("Anyone"), "ann": "ANYONE WHO WANTS IN HAS TO SIGN", "sfx": "tap", "action": "dips toward the dotted line and the nearest box leans in",
      "shows": "the pen dips toward the dotted line and the nearest box leans in, a plate reads ANYONE WHO WANTS IN HAS TO SIGN"},
}
_ADDS = [
 (50, 7, 6, W("October"), "stamp", "a date stamp", "slaps onto the outlet tag", "plain", "OCT 15TH",
  "a date stamp slaps onto the outlet tag reading OCT 15TH", "the tag rings", ""),
 (51, 7, 6, W("proposals"), "clack", "the boxes", "lift their MAYBE notes high", "hope", "MAYBE?",
  "the boxes lift their MAYBE notes high", "the notes flutter", ""),
 (52, 2, 1, W("development"), "knock", "the gavel", "taps once more as the banner's lower strip unrolls", "plain", "STATE DEVELOPMENT AUTHORITY",
  "the gavel taps once more and the banner's lower strip unrolls reading STATE DEVELOPMENT AUTHORITY", "the strip sways", ""),
 (53, 11, 10, W("never"), "tick", "the plate", "lands as the lens stops on a blank line", "plain", "THE RESOLUTION NEVER SAYS \"AI\"",
  "the lens stops on a blank line of the contract, a plate reads THE RESOLUTION NEVER SAYS AI", "the lens bobs", "pay: the missing word"),
 (54, 5, 4, W("cul-de-sac"), "pop", "the quote marks", "stamp in around the sign text", "plain", "THE ROAD ENDS",
  "quotation marks stamp in around the sign text and the road end barrier flashes its stripes, a small plate reads THE ROAD ENDS", "the stripes flash", ""),
 (55, 10, 9, W("capped"), "clank", "a small coffer", "locks with a padlock shaped like the ceiling gauge", "plain", "A CAPPED STATE FUND",
  "a small coffer beside the vault door locks with a padlock, a plate reads A CAPPED STATE FUND", "the lock clanks", ""),
 (56, 13, 12, W("comes"), "tick", "a question mark", "hovers over the pen and the clock", "ask", "WHICH COMES FIRST?",
  "a question mark hovers between the pen and the clock", "the question mark bobs", ""),
 (57, 6, 5, W("sign"), "clack", "the pen", "drops onto the vault plate AUTHORITY TO SIGN", "plain", "AUTHORITY TO SIGN",
  "the pen from the first shot drops onto a small plate beside the clock reading AUTHORITY TO SIGN", "the pen bounces", ""),
 (58, 12, 11, W("still"), "ping", "the Reel's cable", "lights end to end", "hope", "THE CABLE STANDS",
  "the Reel's cable lights end to end along the dock, a plate reads THE CABLE STANDS", "the light runs along the cable", ""),
 (60, 12, 11, W("federal"), "whoosh", "a cloud", "drifts in labelled FEDERAL BROADBAND over the village roofs", "plain", "FEDERAL BROADBAND MONEY",
  "a cloud labelled FEDERAL BROADBAND drifts in over the dock above a row of village roofs", "the cloud drifts", ""),
 (59, 12, 11, W("called"), "stamp", "the label", "BEAD stamps onto the cloud", "plain", "BEAD",
  "a BEAD stamp lands on the federal broadband cloud", "the stamp rings", ""),
]
B = _patch(B, _PATCH, [a for a in _ADDS if a[0] != 59], drops=(46,))
B = [tuple(("rehook: the missing word" if (r[0] == 33 and False) else x) if i == 11 else x for i, x in enumerate(r)) for r in B]


# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "wide-establish", "medium", "eye", "dusk-dock", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "", "",
  "The unsigned line", "A lilac dusk dock where the Reel rolls up to a vault door marked UP TO $75M and a pen hovers over a blank signature line."),
 (2, 1, "subject-portrait", "medium", "eye", "board-desk", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "instrument-as-subject", "hard-cut", "carry",
  "The resolution", "A gavel slams, the contract unrolls with a blank slot, and a name tag swings onto the Reel."),
 (3, 2, "subject-portrait", "close", "high", "contract-closeup", "macro-closeup", "single-object-void", "vertical-descent", "data-as-subject", "carried-element", "carry",
  "The missing word", "A magnifier sweeps the contract, every line comes up empty, a sticky note says HOLD THAT THOUGHT."),
 (4, 3, "map-territory", "extreme-wide", "high", "cable-map", "top-down-map", "map-territory", "vertical-descent", "landscape-as-subject", "hard-cut", "match",
  "Four cables", "A painted map where four teal cables run south and two wear party hats and 1999 tags."),
 (5, 4, "wide-establish", "wide", "low", "cul-de-sac", "eye-level-immersive", "fullbleed-split", "horizontal-traverse", "structure-as-subject", "carried-element", "carry",
  "A data cul-de-sac", "A dead-end road with a sign, a cable snaps and the map greys, then the sign flips to HUB."),
 (6, 5, "subject-portrait", "medium", "eye", "vault-interior", "cross-section-cutaway", "single-object-void", "vertical-rise", "instrument-as-subject", "hard-cut", "match",
  "The clock", "Inside the vault a big egg-timer clock slams onto a shelf lit by one lamp, its wedge glowing, with a porthole showing the dusk outside."),
 (7, 6, "wide-establish", "extreme-wide", "eye", "porthole-parade", "instrument-screen", "grid-modular", "horizontal-traverse", "multiplicity-swarm", "whip-pan", "travel",
  "Fifteen boxes", "From inside the vault we look out through the porthole as fifteen small boxes in silhouette parade past holding MAYBE sticky notes."),
 (8, 7, "alt-vantage", "close", "low", "plank-macro", "macro-closeup", "stacked-layers", "push-in-only", "structure-as-subject", "carried-element", "carry",
  "Sec. 9", "At plank height Clip guards the contract board, the boxes slap their MAYBE notes onto the dotted line, Clip stamps DO NOT COUNT and a gust sweeps the notes away."),
 (9, 8, "two-up", "close", "eye", "standoff-table", "eye-level-immersive", "fullbleed-split", "vertical-rise", "single-organic-hero", "hard-cut", "match",
  "The fair case against", "The Reel and one small box face off across the contract under a hard lamp, each holding the pen out and waiting for the other."),
 (10, 9, "subject-portrait", "medium", "low", "ceiling-dock", "eye-level-immersive", "stacked-layers", "vertical-descent", "structure-as-subject", "hard-cut", "match",
  "The ceiling", "A glass ceiling slams down over the vault at $75M and a MAYBE note bounces off it."),
 (11, 10, "subject-portrait", "close", "high", "contract-search", "macro-closeup", "single-object-void", "push-in-only", "data-as-subject", "match-cut", "match",
  "The word", "The magnifier searches the contract for AI, data centers and compute and finds nothing."),
 (12, 11, "wide-establish", "wide", "eye", "village-roofs", "eye-level-immersive", "stacked-layers", "horizontal-traverse", "landscape-as-subject", "carried-element", "carry",
  "Without AI", "The boxes slide away, the cable still stands, and coins flow to village roofs that need a backbone."),
 (13, 12, "wide-establish", "medium", "eye", "dusk-dock-button", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "hard-cut", "match",
  "Who signs", "The Reel turns the pen toward the boxes, the line stays blank, the clock ticks, and the dock returns to the opening pose."),
]

AMBIENT = {
 1: "the cable settles, the water laps, clouds drift, the plate glints",
 2: "dust drifts, the sheet curls, the slot pulses, the tag swings",
 3: "the lens bobs, the lines flicker, the coil swings, the note flutters",
 4: "the map ripples, the cables pulse, the hats bob, the gauge needle trembles",
 5: "the sign sways, the road dust drifts, the spark fades, the grey breathes",
 6: "the clock rocks, the hands tick, the lever wobbles, the water laps",
 7: "the boxes bob, the notes flutter, the tag swings, the counter ticks",
 8: "the bouncer rocks, the notes flap, the stamp lifts, the dust rings",
 9: "the lamp sways, the Reel breathes, the box bobs, the bubbles wobble",
 10: "the glass rings, the dust shakes, the note flutters, the water laps",
 11: "the lens bobs, the chips flash, the tumbleweed bounces, the page curls",
 12: "the coins flow, the cloud drifts, the roofs light in turn, the Reel rocks",
 13: "the pen trembles, the dots crawl, the clock ticks, the boxes lean",
}
CENTER = {1: "the Reel and the vault door at x540 y960", 2: "the gavel and contract at x540 y980", 3: "the contract and magnifier at x540 y980", 4: "the map at x540 y960",
          5: "the road sign at x540 y1000", 6: "the clock and vault at x540 y980", 7: "the box parade at x540 y1000", 8: "Clip and the vault door at x540 y1000",
          9: "the Reel, box and contract at x540 y1000", 10: "the glass ceiling and vault at x540 y980", 11: "the contract and search chips at x540 y980",
          12: "the Reel and village roofs at x540 y1000", 13: "the Reel, pen and boxes at x540 y980"}
HERO = {
 1: ("the Reel + vault door + contract board + pen", "45% Reel, 25% vault, 20% board, 10% pen"),
 2: ("gavel + contract + blank slot + name tag", "30% gavel, 40% contract, 15% slot, 15% tag"),
 3: ("magnifier + contract + sticky note + coils", "40% contract, 30% magnifier, 15% note, 15% coil"),
 4: ("painted map + four cables + party hats + gauge", "40% map, 35% cables, 15% hats, 10% gauge"),
 5: ("road sign + dead-end road + snapping cable + grey wash", "35% sign, 25% road, 25% cable, 15% wash"),
 6: ("egg-timer clock + vault door + lever + flag", "50% clock, 25% vault, 15% lever, 10% flag"),
 7: ("fifteen boxes + sticky notes + outlet tag + counter", "60% boxes, 20% notes, 10% tag, 10% counter"),
 8: ("Clip + stamp + boxes + sticky notes + vault door", "35% Clip, 20% stamp, 30% boxes, 15% notes"),
 9: ("Reel + box + contract + pen + bubbles + overhead lamp", "30% Reel, 25% box, 25% contract, 20% bubbles"),
 10: ("glass ceiling + vault door + MAYBE note", "50% ceiling, 35% vault, 15% note"),
 11: ("magnifier + search chips + tumbleweed + contract", "35% contract, 30% chips, 20% magnifier, 15% tumbleweed"),
 12: ("Reel + cable + coin river + cloud + village roofs", "30% Reel, 25% coins, 15% cloud, 30% roofs"),
 13: ("Reel + pen + signature line + boxes + clock", "30% Reel, 15% pen, 15% line, 25% boxes, 15% clock"),
}
PARTS = {1: 52, 2: 50, 3: 46, 4: 58, 5: 50, 6: 46, 7: 64, 8: 54, 9: 48, 10: 44, 11: 46, 12: 56, 13: 56}
KICKS = (4, 30, 41)
STAGE3D = {k: "planes" for k in range(1, 14)}
CAMERA = {1: "riseWith", 2: "truckAcross", 3: "dollyThrough", 4: "craneDown", 5: "truckAcross", 6: "dollyThrough", 7: "truckAcross",
          8: "dollyThrough", 9: "dollyThrough", 10: "craneDown", 11: "dollyThrough", 12: "truckAcross", 13: "riseWith"}


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

    palette = "lilac-periwinkle dusk sky, blush horizon, petrol-green sea and vault door, warm tan planks, saffron Reel, black cable with an orange tracer, butter sticky notes, tomato stamps"
    board = {
        "run_date": "2026-10-27", "slug": "the-blank-line", "title": "The Blank Line",
        "concept": ("AIDEA's board passed Resolution G26-11 on October 21st, creating a subsidiary (working name Northstar Fiber Development) with up to $75 million of Revolving Fund money for subsea and terrestrial fiber. "
                    "The resolution calls Alaska a data cul-de-sac, notes two of its four undersea cables went into service in 1999, sets a December 31st, 2028 expiry on the authority to sign, and makes binding customer commitments the condition of any project money, saying expressions of interest do not count. "
                    "Alaska Public Media reported on October 15th proposals for as many as 15 data centers. The resolution's text never mentions AI, data centers or compute. A saffron cable reel with a face, the Reel, rolls up to a vault door with an unsigned line, "
                    "the film walks the resolution's own facts (the gavel, the blank slot, four cables, the cul-de-sac sign, the clock, fifteen boxes holding MAYBE notes, a Sec. 9 bouncer, a hen and an egg, a glass ceiling), pays the missing word, and ends with the Reel holding the pen out. The AI link is read, not claimed: the cable stands without AI and anyone who wants in has to sign."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "assemble-build", "hero_treatment": "single-organic-hero", "layout": "centered-hero-lowerthird",
                        "register": "naturalistic-scene", "palette": palette, "camera_strategy": "dolly-and-crane-mix",
                        "light_story": "dusk-to-sunrise",
                        "metaphor": "a cable reel waiting at a vault door for one signature on a blank dotted line"},
        "palette": palette,
        "divergence_note": ("The last films were a sage and honey civic hall (10-26), a rain boardwalk of signs in pink (10-25), a navy and cyan orbit (10-24) and a paper building in snow (10-23). "
                            "This film is an outdoor lilac dusk dock by the water in lilac, teal and saffron, with a tomato stamp and butter sticky notes, built of a cable reel, a vault door, a contract with a dotted line, a clock, fifteen small boxes and a hen and an egg. "
                            "There is no ballot, no podium, no map-of-pins-and-sheds, no rain, no sign hero and no orbit. HONEST OVERLAP: its hero is a faced object for the sixth film in a row, but it is a round spool among rectangles and rolls on a cart."),
        "treatment": {"winner": "The Explainer's ONE BLANK LINE (the Reel, the signature line as throughline, the missing word as the primary loop) with the Comedian's Sec. 9 bouncer and sticky-note gags, the Dramatist's chicken-and-egg Test and the Enthusiast's cable-stands-without-AI turn.",
                      "why": "All four pitches converged on the same mechanism, a rule that makes customers sign before the state spends, and on a standoff scene as the fair case against it. The Explainer's structure puts the missing word at the start and the pay at the turn."},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A lilac dusk dock where a saffron cable reel with a face rolls up to a teal vault door marked UP TO $75M with a contract board and a pen hovering over a blank dotted line.",
                 "headline": "THE BLANK LINE", "motion_by_s": 0.3,
                 "loopback": "The last frame returns to the opening dock pose, the line still blank, the pen now turned toward the viewer."},
        "open_loop": {"plant_t": b_at(6), "pay_t": b_at(53), "what": "One word you would expect in the resolution isn't there. Planted as a blank slot opens in the contract's text, paid when the magnifier proves the resolution never says AI.",},
        "open_loop_2": {"plant_t": b_at(18), "pay_t": b_at(41), "what": "Who signs the unsigned line before the clock runs out. Planted as the big clock slams onto the dock, paid when the line pulses blank beneath a hovering pen as the clock chimes at DEC 31ST, 2028.",},
        "throughline": {"object": "the signature line", "lands_in_button": "the dotted signature line still blank with the Reel holding the pen out to the boxes while the clock ticks",
                        "states": [
                            {"at_s": b_at(3), "state": "a blank dotted line on a contract board with a pen hovering"},
                            {"at_s": b_at(5), "state": "the same line on the unrolled resolution with a blank slot beside it"},
                            {"at_s": b_at(10), "state": "the line at the foot of the magnified contract under a HOLD THAT THOUGHT note"},
                            {"at_s": b_at(19), "state": "the line on the contract board beside the clock's red wedge"},
                            {"at_s": b_at(23), "state": "the line with fifteen boxes queued toward it holding MAYBE notes"},
                            {"at_s": b_at(25), "state": "the line guarded by Clip's SEC. 9 page"},
                            {"at_s": b_at(26), "state": "papered over by fifteen MAYBE sticky notes"},
                            {"at_s": b_at(27), "state": "swept bare by a gust beside a DO NOT COUNT stamp"},
                            {"at_s": b_at(31), "state": "under a $75M glass ceiling slab"},
                            {"at_s": b_at(40), "state": "blank with the pen held out under the clock"}]},
        "reveals": [
            {"t": b_at(11), "type": "scale-pullback", "what": "the painted map unrolls to show Alaska and the four cables running south", "hold_s": 0.7},
            {"t": b_at(21), "type": "scale-pullback", "what": "the camera pulls back as fifteen small boxes parade onto the dock", "hold_s": 0.8},
            {"t": b_at(37), "type": "build-on", "what": "a river of coins pours toward a row of village roofs that light one by one", "hold_s": 0.8},
            {"t": b_at(39), "type": "morph-to-chart", "what": "the Reel turns the pen around and the row of boxes lean toward it", "hold_s": 0.7}],
        "tail_s": 3.2, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.55}, {"line": 0, "offset": 3.0, "level": 1.0}, {"line": 1, "offset": 0.0, "level": 0.14},
            {"line": 2, "offset": 0.0, "level": 0.95}, {"line": 3, "offset": 0.0, "level": 0.16}, {"line": 4, "offset": 0.0, "level": 1.05},
            {"line": 5, "offset": 0.0, "level": 0.14}, {"line": 6, "offset": 0.0, "level": 0.9}, {"line": 7, "offset": 0.0, "level": 0.12},
            {"line": 8, "offset": 0.0, "level": 0.2}, {"line": 9, "offset": 0.0, "level": 0.1}, {"line": 9, "offset": 3.0, "level": 0.9},
            {"line": 10, "offset": 0.0, "level": 0.12}, {"line": 11, "offset": 0.0, "level": 1.1}, {"line": 12, "offset": 0.0, "level": 0.14},
            {"at_s": round(b_at(40) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(40) + 0.8, 3), "level": 0.55},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "build_steps": 4, "dip_at": round(b_at(40) - 0.3, 3), "riser_at": round(b_at(31), 3), "silence_at": round(b_at(40) - 0.3, 3),
                      "payoff_at": b_at(40), "button_pattern": "callback", "interrupt_at": b_at(53), "extra_dips": [b_at(26)]},
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
    book.raise_if_missing("board_1027 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1027Ids.ts").write_text(
        "// GENERATED by scripts/board_1027.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
