#!/usr/bin/env python3
"""2026-10-29 "The Reactor Is Still a Dotted Line": the storyboard as DATA, plus its conform step.

    python3 scripts/board_1029.py gen       # write out/dispatch/storyboard.json
    python3 scripts/board_1029.py conform   # re-time every beat, shot, loop and reveal to vo_lines.json and words.json

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
 (1, 1, 0, 0.0, "whoosh", "the bush plane", "skims the raspberry horizon and drops a crate beside Sourdough", "proud", "$25M FROM ALASKA",
  "a red bush plane skims the raspberry horizon over a snowy depot and a crate drops toward Sourdough, a plate reads $25M FROM ALASKA",
  "the prop spins and snow drifts", "plant: what is in the crate"),
 (2, 1, 0, W("million"), "thump", "the crate", "thumps into the snow and Sourdough rocks back while a manila tag whips round on its string", "proud", "$25M FROM ALASKA",
  "the crate thumps into the snow, the lid pops and a manila NUSUN tag with four blank ruled lines whips round to face the camera",
  "the tag swings and settles", ""),
 (3, 1, 0, W("reactor", 2), "pop", "the tag", "its four dashed lines glow ice cyan while a plate reads A COMPANY NOT A REACTOR", "unsure", "NOT A REACTOR · A COMPANY",
  "the four ruled lines on the tag glow cyan and Sourdough tilts his head, a plate reads NOT A REACTOR, A COMPANY",
  "the lines pulse", ""),
 (4, 2, 1, 0.0, "slide", "a press release", "slides onto the plank table under a lamp and settles", "reading", "OCT 19TH · NUCUBE ENERGY · IDAHO",
  "a cream press release slides onto a plank table under a warm lamp, a plate reads OCT 19TH, NUCUBE ENERGY, IDAHO",
  "the sheet settles and the lamp sways", "rehook: a paper lands under a lamp"),
 (5, 2, 1, W("announced"), "click", "a stamp", "slaps ANNOUNCED on the release", "reading", "ANNOUNCED OCT 19TH",
  "an ink stamp slaps ANNOUNCED onto the release", "the sheet shivers", ""),
 (6, 2, 1, W("AIDEA"), "thunk", "the AIDEA stamp", "lands beside it with a gold seal", "reading", "AIDEA · ALASKA INDUSTRIAL DEVELOPMENT AND EXPORT AUTHORITY",
  "a second stamp lands reading AIDEA with a gold seal and a plate reads AIDEA, ALASKA INDUSTRIAL DEVELOPMENT AND EXPORT AUTHORITY",
  "the seal glints", ""),
 (7, 3, 2, 0.0, "swell", "the NuSun outline", "draws itself on beside the tag as a dashed ice cyan outline with no fill", "unsure", "NUSUN · SOLID-STATE, HEAT-PIPE-COOLED",
  "a dashed ice cyan outline of a squat reactor draws itself on beside the tag with a name badge reading NUSUN, SOLID-STATE, HEAT-PIPE-COOLED",
  "the dashes crawl", "rehook: the reactor appears as a dotted line"),
 (8, 3, 2, W("big"), "ping", "the SIZE line", "lights up cyan on the tag", "unsure", "SIZE",
  "the SIZE line on the tag lights cyan", "the line pulses", ""),
 (9, 3, 2, W("go"), "ping", "the SITE line", "lights up cyan on the tag", "unsure", "SITE",
  "the SITE line on the tag lights cyan", "the line pulses", ""),
 (10, 3, 2, W("much"), "pop", "a price tag", "Sourdough hangs a price tag on the outline and it falls straight through into the snow", "sheepish", "PRICE",
  "the PRICE line lights cyan while Sourdough hangs a small price tag on the dashed outline and it falls straight through into the snow",
  "the price tag lies in the snow", ""),
 (11, 3, 2, W("when"), "ping", "the DATE line", "lights up cyan on the tag", "unsure", "DATE",
  "the DATE line on the tag lights cyan, all four lines now glow", "the lines pulse", ""),
 (44, 4, 3, W("state"), "tick", "a price sticker", "peels off a roll and slaps onto the back of the tag", "reading", "$10.82 REFERENCE PRICE",
  "a sticker reading $10.82 peels off a roll and slaps onto the back of the tag", "the sticker flaps", ""),
 (12, 4, 3, 0.0, "whoosh", "the tag", "swings around and turns over to show its back", "reading", "THE SHARE TERMS",
  "the tag swings around and flips over to show its back, headed SHARES, with a plate reading THE SHARE TERMS",
  "the tag settles", "rehook: the tag turns over"),
 (13, 4, 3, W("nine"), "pop", "a clearance sticker", "folds down from $10.82 to $9.25", "reading", "$9.25 A SHARE",
  "a sticker folds from $10.82 down to $9.25 on the back of the tag, a plate reads $9.25 A SHARE", "the sticker flaps", ""),
 (14, 4, 3, W("fourteen"), "thump", "a gold band", "stamps the gap between the two prices", "reading", "~14.5% BELOW THE $10.82 REFERENCE PRICE",
  "a gold band brackets the drop and a plate reads ~14.5% BELOW THE $10.82 REFERENCE PRICE", "the band glints", "rehook: the gold band brackets the discount"),
 (15, 4, 3, W("warrant"), "tick", "a half ticket", "tears off the edge of the tag", "reading", "HALF A WARRANT A SHARE · $11.50 · 5 YEARS",
  "a half ticket tears off the tag's edge, a plate reads HALF A WARRANT A SHARE, $11.50, 5 YEARS", "the ticket flutters", ""),
 (16, 5, 4, 0.0, "slide", "the jar", "a glass jar slides in labelled LAUNCH TWO MERGER", "reading", "MERGER WITH LAUNCH TWO",
  "a tall glass jar slides onto a plank counter beside Sourdough, a plate reads MERGER WITH LAUNCH TWO",
  "coins glint", ""),
 (17, 5, 4, W("seventy"), "roll", "the jar", "its top mark lights at $75M as coins pour in", "reading", "$75M CASH TO CLOSE",
  "coins pour into the jar and its top mark lights, a plate reads $75M CASH TO CLOSE", "the coins stream", "rehook: the money pours in"),
 (18, 5, 4, W("counts"), "bell", "a gold block", "drops in and fills the bottom third of the jar", "reading", "AIDEA'S $25M COUNTS",
  "a gold block labelled AIDEA drops in and fills the bottom third of the jar, a plate reads AIDEA'S $25M COUNTS", "the jar rattles", ""),
 (19, 6, 5, 0.0, "slide", "NuCube's filing", "slides onto a desk beside a brass clicker while a ghost server peeks in", "reading", "NUCUBE'S FILING",
  "NuCube's filing lies on a lamplit desk with two highlighted paragraphs headed MARKET TRENDS and ALASKA and a brass clicker at 0, a ghost server peeks in",
  "the clicker waits", "plant: does this deal touch AI at all"),
 (20, 6, 5, W("data"), "tick", "the clicker", "clicks once in the MARKET TRENDS paragraph", "reading", "NUCUBE'S FILING · \"AI DATA CENTER ENERGY DEMAND\" · ONCE",
  "the brass clicker clicks to 1 at a highlighted phrase in the MARKET TRENDS paragraph, a plate reads NUCUBE'S FILING, AI DATA CENTER ENERGY DEMAND, ONCE",
  "the count flips to 1", "rehook: the counter clicks"),
 (21, 6, 5, W("paragraphs"), "bloop", "the clicker", "stays at zero over the ALASKA paragraphs while the ghost server droops", "reading", "ALASKA PARAGRAPHS · AI 0",
  "the clicker sweeps over the ALASKA paragraphs and stays at 0 while the ghost server droops, a plate reads ALASKA PARAGRAPHS, AI 0",
  "the ghost sinks", ""),
 (22, 7, 6, 0.0, "slam", "four paper chips", "slide in from alternating sides and slam into a row", "reading", "AIDEA · MINING · SEAFOOD · MANUFACTURING · DATA CENTERS",
  "four paper chips line up on a desk reading MINING, SEAFOOD, MANUFACTURING, DATA CENTERS under a release headed AIDEA",
  "the chips settle", ""),
 (23, 7, 6, W("data"), "pop", "the data centers block", "rises out of the row and lights gold", "reading", "DATA CENTERS",
  "the DATA CENTERS block rises out of the row and lights gold", "the chip glows", ""),
 (24, 7, 6, W("never"), "thunk", "an empty dashed slot", "appears at the end of the row and a stamp marks it AI NOT SAID", "reading", "AI · NOT SAID",
  "an empty dashed cyan slot appears at the end of the row and a red stamp marks it AI, NOT SAID", "the dashes crawl", ""),
 (25, 8, 7, 0.0, "whoosh", "the tag", "turns back to its front between Sourdough and the dotted outline", "faltering", "SIZE · SITE · PRICE · DATE",
  "the NUSUN tag turns face on between Sourdough and the dashed outline with four ruled lines, Sourdough's window dims", "the tag sways", "rehook: the blank face of the tag"),
 (26, 8, 7, W("size"), "thunk", "a red stamp", "slaps NOT STATED on the SIZE line", "faltering", "SIZE · NOT STATED",
  "a red stamp slaps NOT STATED across the SIZE line", "the tag rocks", ""),
 (27, 8, 7, W("site"), "thunk", "a red stamp", "slaps NOT STATED on the SITE line", "faltering", "SITE · NOT STATED",
  "a red stamp slaps NOT STATED across the SITE line", "the tag rocks", ""),
 (28, 8, 7, W("and", 2), "thunk", "a red stamp", "slaps NOT STATED on the PRICE line", "faltering", "PRICE · NOT STATED",
  "a red stamp slaps NOT STATED across the PRICE line", "the tag rocks", ""),
 (29, 8, 7, W("date"), "thunk", "a red stamp", "slaps NOT STATED on the DATE line", "faltering", "DATE · NOT STATED",
  "a red stamp slaps NOT STATED across the DATE line and all four lines are stamped", "the tag rocks", ""),
 (30, 9, 8, 0.0, "swell", "a banknote block", "strides in with arms spread and takes the plank table", "confident", "THE CASE FOR BLANKS",
  "a banknote block with a face strides onto a plank table with arms spread, a plate reads THE CASE FOR BLANKS", "the block breathes", "rehook: a fair case walks in"),
 (31, 9, 8, W("depend"), "click", "four condition chips", "staple themselves to a board behind it", "confident", "DEPENDS ON · TECHNOLOGY · APPROVALS · FINANCING · HOST COMMUNITIES",
  "four chips staple themselves to a board reading TECHNOLOGY, APPROVALS, FINANCING, HOST COMMUNITIES under DEPENDS ON", "the chips settle", ""),
 (32, 9, 8, W("discount"), "tick", "a discount tag", "swings from the block's hand", "confident", "A DISCOUNT IS WHAT AN EARLY BLANK COSTS",
  "a discount tag swings from the block's hand, a plate reads A DISCOUNT IS WHAT AN EARLY BLANK COSTS", "the tag swings", ""),
 (33, 10, 9, 0.0, "whoosh", "the camera", "pulls up and back from the table to a map with an Eielson pin", "reading", "OKLO · EIELSON AIR FORCE BASE",
  "the camera pulls back to a painted map of the Interior with a pulsing pin and a second dashed outline labelled OKLO, a plate reads OKLO, EIELSON AIR FORCE BASE",
  "the pin pulses", "rehook: the scale pulls back"),
 (34, 10, 9, W("five"), "ping", "Oklo's tag", "fills in with its two stated numbers", "reading", "AT LEAST 5 MW ELECTRIC · EARLY 2030s · OKLO",
  "a manila tag hangs on Oklo's outline reading AT LEAST 5 MW ELECTRIC, EARLY 2030s, OKLO", "the tag swings", ""),
 (35, 10, 9, W("drilling"), "thump", "a drill bit", "turns into the snow beside Oklo's outline", "reading", "BOREHOLE DRILLING · LATE 2026 · OKLO",
  "a drill bit spins into the snow beside Oklo's outline, a plate reads BOREHOLE DRILLING, LATE 2026, OKLO", "the bit spins", ""),
 (45, 10, 9, W("year"), "thump", "the drill bit", "sinks a hole into the snow and the map frame trembles", "reading", "BOREHOLE DRILLING · LATE 2026 · OKLO",
  "the drill bit sinks a hole into the snow beside Oklo's outline and the map frame trembles", "the frame trembles", ""),
 (46, 11, 10, 0.0, "whoosh", "a shed wall", "slides into frame and settles with a frosted window and a bare nail where the calendar will hang", "worried", "ENSTAR'S PRESIDENT",
  "a frosted shed wall slides in and settles with a bare nail and a plate reads ENSTAR'S PRESIDENT", "frost glints on the window", ""),
 (36, 11, 10, W("eighteen"), "thump", "a wall calendar", "slams onto a shed wall with eighteen days crossed", "worried", "ENSTAR · WINTER GAS SHORTAGE · 18 DAYS · 3 BCF",
  "a wall calendar slams onto a frosted shed wall with eighteen squares crossed in red, a plate reads ENSTAR, WINTER GAS SHORTAGE, 18 DAYS, 3 BCF",
  "frost creeps in", "rehook: the calendar slams"),
 (37, 11, 10, W("neither"), "swell", "two dashed outlines", "slide in beside the calendar, one with a date and one still blank, frost creeping over both tags", "worried", "NO DATE REACHES THIS WINTER",
  "NuSun's dashed outline with a blank tag and Oklo's with EARLY 2030s slide in beside the calendar while frost creeps over both tags, a plate reads NO DATE REACHES THIS WINTER",
  "the frost spreads", ""),
 (38, 12, 11, 0.0, "slide", "a share certificate", "slides into the frame beside the dashed outline", "reading", "SHARES, NOT A REACTOR",
  "a gold-sealed share certificate slides in beside the dashed outline, a plate reads SHARES, NOT A REACTOR", "the certificate sways", ""),
 (39, 12, 11, W("filled"), "click", "the tag", "turns to its back, the share terms filled in", "reading", "THE TERMS ARE FILLED IN",
  "the tag turns to its back where the share terms are filled in, a plate reads THE TERMS ARE FILLED IN", "the tag settles", ""),
 (40, 12, 11, W("dotted"), "swell", "the certificate", "slides toward the dotted outline and falls straight through into the snow", "sheepish", "THE REACTOR IS STILL A DOTTED LINE",
  "the certificate slides toward the dashed outline and falls straight through into the snow, the outline stays empty, a plate reads THE REACTOR IS STILL A DOTTED LINE",
  "the certificate lies in the snow", ""),
 (41, 13, 12, 0.0, "whoosh", "the bush plane", "returns over the depot as in the opening and the crate sits at Sourdough's feet", "unsure", "WHAT SHOULD AIDEA PUBLISH, AND BY WHEN?",
  "the red bush plane returns over the depot as in the opening and the crate sits at Sourdough's feet, a plate reads WHAT SHOULD AIDEA PUBLISH, AND BY WHEN?", "snow drifts", ""),
 (42, 13, 12, W("publish"), "bloop", "four dashed boxes", "drop in above the tag as SIZE SITE PRICE DATE", "unsure", "SIZE · SITE · PRICE · DATE",
  "four dashed cyan boxes drop in above the tag reading SIZE, SITE, PRICE, DATE", "the boxes pulse", ""),
 (43, 13, 12, W("reactor"), "swell", "the tag", "swings to camera still blank and the film cuts to black", "unsure", "STILL BLANK",
  "the tag swings round to face the camera, still blank, then the frame cuts to black", "the tag flutters", ""),
]

# id, vo_line, framing, scale, height, stage, pov, layout, motion_vector, hero_treatment, transition_in, thread, title, means
S = [
 (1, 0, "wide-establish", "wide", "low", "depot-yard", "eye-level-immersive", "centered-hero-lowerthird", "horizontal-traverse", "single-organic-hero", "", "",
  "The drop", "A bush plane skims a dusk depot and drops a crate beside Sourdough, and a manila NUSUN tag with four blank lines whips round."),
 (2, 1, "push-detail", "close", "overhead", "press-desk", "macro-closeup", "single-object-void", "vertical-descent", "data-as-subject", "hard-cut", "match",
  "Announced", "A press release slides onto a plank table and is stamped ANNOUNCED and AIDEA."),
 (3, 2, "two-up", "medium", "eye", "depot-yard", "eye-level-immersive", "fullbleed-split", "push-in-only", "structure-as-subject", "match-cut", "match",
  "Four questions", "The tag beside a dashed NuSun outline with its four ruled lines lighting as each question is asked."),
 (4, 3, "macro-closeup", "insert", "eye", "tag-macro", "macro-closeup", "stacked-layers", "vertical-descent", "data-as-subject", "carried-element", "carry",
  "The share terms", "The back of the tag with a price sticker folding from $10.82 to $9.25, a gold band and a half ticket."),
 (5, 4, "alt-vantage", "medium", "low", "jar-counter", "cross-section-cutaway", "stacked-layers", "vertical-descent", "multiplicity-swarm", "whip-pan", "travel",
  "The merger jar", "A glass jar fills with coins to $75M and AIDEA's block fills the bottom third."),
 (6, 5, "data-panel", "close", "high", "filing-desk", "top-down-map", "grid-modular", "scroll-data", "data-as-subject", "hard-cut", "match",
  "The AI count", "NuCube's filing under a lamp, a clicker at 1 in MARKET TRENDS and 0 over the Alaska paragraphs, with a ghost server."),
 (7, 6, "push-detail", "insert", "eye", "filing-desk", "eye-level-immersive", "single-object-void", "horizontal-traverse", "multiplicity-swarm", "carried-element", "carry",
  "AIDEA's list", "Four chips MINING SEAFOOD MANUFACTURING DATA CENTERS and a dashed empty slot stamped AI NOT SAID."),
 (8, 7, "subject-portrait", "medium", "eye", "depot-yard", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "structure-as-subject", "whip-pan", "travel",
  "The blanks", "The tag face on between Sourdough and the dotted outline, four red NOT STATED stamps."),
 (9, 8, "two-up", "medium", "low", "debate-table", "top-down-map", "fullbleed-split", "horizontal-traverse", "single-organic-hero", "graphic-match", "match",
  "The case for blanks", "A banknote block makes the fair case at a plank table with four conditions stapled behind it and a discount tag."),
 (10, 9, "map-territory", "extreme-wide", "high", "eielson-map", "top-down-map", "map-territory", "push-in-only", "landscape-as-subject", "map-travel", "travel",
  "Oklo at Eielson", "A painted map with an Eielson pin, Oklo's dashed outline and tag, and a drill bit."),
 (11, 10, "alt-vantage", "wide", "ground", "calendar-wall", "eye-level-immersive", "stacked-layers", "vertical-descent", "data-as-subject", "whip-pan", "travel",
  "Two clocks", "A wall calendar slams onto a frosted shed wall with eighteen days crossed beside two dashed outlines."),
 (12, 11, "two-up", "medium", "eye", "depot-yard", "eye-level-immersive", "centered-hero-lowerthird", "push-in-only", "single-organic-hero", "graphic-match", "match",
  "Shares, not a reactor", "A certificate beside the dashed outline falls straight through it."),
 (13, 12, "wide-establish", "wide", "low", "depot-yard", "eye-level-immersive", "single-object-void", "horizontal-traverse", "structure-as-subject", "match-cut", "match",
  "The button", "The opening frame returns with the crate at Sourdough's feet and the blank tag swinging to camera."),
]

AMBIENT = {
 1: "snow drifts, the prop spins, the pole line sways, the tag swings",
 2: "the lamp sways, the sheet settles, snow glints on the window",
 3: "the dashes crawl, the tag swings, snow drifts",
 4: "the sticker flaps, the tag swings, the coins glint",
 5: "coins stream, the jar rattles, the lamp sways",
 6: "the clicker waits, the ghost server drifts, the lamp sways",
 7: "the chips breathe, the dashes crawl, the lamp sways",
 8: "the tag rocks, the dashes crawl, snow drifts",
 9: "the block breathes, the discount tag swings, the lamp sways",
 10: "the pin pulses, the drill spins, the dashes crawl",
 11: "frost creeps, the dashes crawl, the pole line sways",
 12: "the certificate sways, the dashes crawl, snow drifts",
 13: "snow drifts, the tag flutters, the dashes crawl",
}
CENTER = {1: "the crate at x540 y1150", 2: "the release at x540 y1000", 3: "the tag at x400 y1000", 4: "the tag back at x540 y1000", 5: "the jar at x540 y1100", 6: "the filing at x540 y1000",
          7: "the chips at x540 y1000", 8: "the tag at x540 y1000", 9: "the block at x540 y1100", 10: "the map at x540 y1000", 11: "the calendar at x540 y1000", 12: "the dashed outline at x700 y1100", 13: "the crate at x540 y1150"}
HERO = {
 1: ("Sourdough + bush plane + crate + NUSUN tag", "35% Sourdough, 25% plane, 20% crate, 20% tag"),
 2: ("press release + stamps + lamp", "55% release, 25% stamps, 20% lamp"),
 3: ("NUSUN tag + dashed outline + Sourdough", "40% tag, 35% outline, 25% Sourdough"),
 4: ("tag back + price sticker + half ticket", "50% tag, 30% sticker, 20% ticket"),
 5: ("glass jar + coins + AIDEA block + Sourdough", "45% jar, 25% coins, 15% block, 15% Sourdough"),
 6: ("filing + clicker + ghost server", "50% filing, 30% clicker, 20% ghost"),
 7: ("four chips + dashed slot + release", "55% chips, 25% slot, 20% release"),
 8: ("NUSUN tag + red stamps + Sourdough + dashed outline", "40% tag, 25% stamps, 20% Sourdough, 15% outline"),
 9: ("banknote block + condition board + discount tag", "45% block, 35% board, 20% tag"),
 10: ("painted map + Eielson pin + Oklo outline + drill", "50% map, 25% outline, 25% drill"),
 11: ("wall calendar + two dashed outlines + frost", "45% calendar, 35% outlines, 20% frost"),
 12: ("certificate + dashed outline + Sourdough", "35% certificate, 35% outline, 30% Sourdough"),
 13: ("Sourdough + crate + plane + blank tag", "30% Sourdough, 25% crate, 20% plane, 25% tag"),
}
PARTS = {1: 52, 2: 44, 3: 50, 4: 46, 5: 48, 6: 50, 7: 44, 8: 52, 9: 50, 10: 48, 11: 50, 12: 46, 13: 52}
KICKS = (2, 36)
STAGE3D = {k: "planes" for k in HERO}
CAMERA = {1: "dollyThrough", 2: "craneDown", 3: "truckAcross", 4: "craneDown", 5: "riseWith", 6: "craneDown", 7: "truckAcross", 8: "dollyThrough",
          9: "truckAcross", 10: "craneDown", 11: "dollyThrough", 12: "truckAcross", 13: "dollyThrough"}


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

    palette = "aubergine dusk and a raspberry horizon over blue-white snow, an ember orange power plant, manila shipping tags, signal red stamps, an ice cyan outline"
    board = {
        "run_date": "2026-10-29", "slug": "the-reactor-is-still-a-dotted-line", "title": "The Reactor Is Still a Dotted Line",
        "concept": ("On October 19th NuCube Energy of Idaho announced a $25 million investment from AIDEA, Alaska's development authority, bought as discounted shares ($9.25, about 14.5% under a $10.82 reference price, plus a half warrant at $11.50) that count toward the $75 million NuCube's merger with Launch Two needs to close. "
                    "NuCube's own filing names AI data center demand once, in a list of market trends, and nowhere in its Alaska paragraphs. AIDEA's release lists data centers beside mining and seafood and never says AI. In the filing, the release and Alaska Business, a size, site, price and date for a NuCube reactor in Alaska are all blank. "
                    "The one dated Alaska reactor is Oklo's at Eielson, at least 5 MW electric in the early 2030s, and Enstar's president puts this winter's gas shortage at 18 days or 3 billion cubic feet. "
                    "Sourdough, the ember power plant, watches a crate drop from a bush plane. The NUSUN shipping tag with four blank ruled lines (SIZE, SITE, PRICE, DATE) is the throughline: blank, flipped to the share terms, stamped NOT STATED, stapled beside AIDEA's own conditions, frosted beside Oklo and the calendar, and blank again at the button. "
                    "NuSun is only ever a dashed ice-cyan outline that anything hung on falls straight through."),
        "derived_from": "scratch", "engine": "infographic-2.5d", "total_seconds": round(end, 2),
        "fingerprint": {"pov": "eye-level-immersive", "motion_vector": "vertical-descent", "hero_treatment": "single-organic-hero", "layout": "centered-hero-lowerthird",
                        "register": "tactile-collage", "palette": palette, "camera_strategy": "track-follow",
                        "light_story": "raspberry dusk raking over snow, lamp-lit paper interiors",
                        "metaphor": "a shipping tag with four blank ruled lines hung on a post beside a dashed outline of a reactor that anything hung on falls straight through"},
        "palette": palette,
        "divergence_note": ("The last films were a near-black submerged sonar world with mint (10-28), a sage and honey civic hall (10-26), a cedar boardwalk of signs in teal fog (10-25), a navy orbit (10-24) and a snow-bound paper building (10-23). "
                            "This film is a warm exterior dusk of aubergine and raspberry over blue-white snow with manila tags and an ember-orange power plant, intercut with lamp-lit paper interiors and a frosted shed wall. "
                            "There is no sonar fan, no hall, no podium, no boardwalk, no orbit. Its hero is Sourdough, a round blocky power plant with a furnace window for a chest, and its object is a shipping tag."),
        "treatment": json.loads((OUT / "treatment.json").read_text()) if (OUT / "treatment.json").exists() else {},
        "angle": json.loads((OUT / "angle.json").read_text()) if (OUT / "angle.json").exists() else {},
        "hook": {"pattern": "anomaly-question", "frame1": "A red bush plane skims a raspberry horizon over a snowy depot and drops a crate beside Sourdough while a manila tag with four blank ruled lines whips round to camera.",
                 "headline": "$25M OF A REACTOR COMPANY", "motion_by_s": 0.3,
                 "loopback": "The last frame returns to the opening depot with the crate at Sourdough's feet and the tag swinging to camera, still blank."},
        "open_loop": {"plant_t": round(b_at(2), 3), "pay_t": b_at(40), "what": "What is in the crate, and what fills the four blank lines on the NUSUN tag? Planted in the first frame, paid when the terms are filled in on the back and the front stays blank, the reactor still a dotted line."},
        "open_loop_2": {"plant_t": b_at(19), "pay_t": b_at(35), "what": "Does this deal touch AI at all? Planted when the filing hits the desk, paid in part with the count of 1 in market trends and 0 in the Alaska paragraphs, and fully when the ghost server finds nothing at Oklo's outline."},
        "throughline": {"object": "the NUSUN shipping tag", "lands_in_button": "the tag swinging to camera with its four lines still blank",
                        "states": [
                            {"at_s": b_at(2), "state": "hung on its post with four blank ruled lines"},
                            {"at_s": b_at(12), "state": "turned over to the share terms with the price sticker and half ticket"},
                            {"at_s": b_at(16), "state": "hung on a nail on the shed wall beside the merger jar, share side out"},
                            {"at_s": b_at(26), "state": "face on again with NOT STATED stamped across the lines"},
                            {"at_s": b_at(31), "state": "hung beside AIDEA's four conditions"},
                            {"at_s": b_at(37), "state": "frost over its edge beside Oklo's dated tag and the calendar"},
                            {"at_s": b_at(43), "state": "swinging to camera, front still blank"}]},
        "reveals": [
            {"t": b_at(7), "type": "build-on", "what": "the NuSun outline draws itself on beside the tag as a dashed shape with no fill", "hold_s": 0.7},
            {"t": b_at(20), "type": "morph-to-chart", "what": "the clicker rolls to 1 in the market trends paragraph and stays at 0 over the Alaska paragraphs", "hold_s": 0.7},
            {"t": b_at(33), "type": "scale-pullback", "what": "the camera pulls back from the table to a map with the Eielson pin", "hold_s": 0.8}],
        "tail_s": 3.0, "audio_arc": {"bed": [
            {"line": 0, "offset": 0.0, "level": 0.55}, {"line": 0, "offset": 3.0, "level": 1.0}, {"line": 1, "offset": 0.0, "level": 0.15},
            {"line": 2, "offset": 0.0, "level": 0.9}, {"line": 3, "offset": 0.0, "level": 0.14}, {"line": 4, "offset": 0.0, "level": 0.95},
            {"line": 5, "offset": 0.0, "level": 0.12}, {"line": 6, "offset": 0.0, "level": 0.9}, {"line": 7, "offset": 0.0, "level": 0.2},
            {"line": 8, "offset": 0.0, "level": 1.0}, {"line": 9, "offset": 0.0, "level": 0.12}, {"line": 9, "offset": 4.0, "level": 1.05},
            {"line": 10, "offset": 0.0, "level": 0.14}, {"line": 11, "offset": 0.0, "level": 0.9},
            {"at_s": round(b_at(40) - 0.3, 3), "level": 0.1}, {"at_s": round(b_at(40) + 0.8, 3), "level": 0.55},
            {"from_end": 2.6, "level": 0.55}, {"from_end": 0.4, "level": 0.0}],
            "ambience": "wind",
            "build_steps": 4, "dip_at": round(b_at(40) - 0.3, 3), "riser_at": round(b_at(42), 3), "silence_at": round(b_at(40) - 0.3, 3),
                      "payoff_at": b_at(40), "button_pattern": "callback", "interrupt_at": b_at(30), "extra_dips": [b_at(36)]},
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
    book.raise_if_missing("board_1029 conform")
    return board, real


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "gen"
    board, real = build()
    ids = board.pop("_ids")
    (ROOT / "video-engine" / "src" / "Ep1029Ids.ts").write_text(
        "// GENERATED by scripts/board_1029.py. Authoring beat key -> storyboard beat id (time order).\nexport const IDS: Record<number, number> = "
        + json.dumps({str(k): v for k, v in sorted(ids.items())}) + ";\n")
    (OUT / "storyboard.json").write_text(json.dumps(board, indent=2) + "\n")
    print(f"{cmd}: {len(board['beats'])} beats / {len(board['shots'])} shots, {board['total_seconds']}s, "
          f"{'REAL voice timing' if real else 'ESTIMATED timing (no vo_lines.json yet)'}")


if __name__ == "__main__":
    main()
