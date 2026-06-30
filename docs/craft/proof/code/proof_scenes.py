"""
proof_scenes.py — a SHORT proof that the Director's Brain works in our hand-coded medium.

Four GENUINELY DIFFERENT rendered worlds, connected by REAL transitions (not a zoom on one canvas):
  1. RIVER MAP        (top-down-map / map-territory / landscape)   --carried-element-->
  2. DATA PANEL       (instrument-screen / grid / data-as-subject) --graphic-match---->
  3. MOUNTAIN RIDGE   (orbital / stacked / landscape)              --hard-cut/build--->
  4. WORDMARK         (eye-level / single-object-void / brand)

The CARRIED ELEMENT: a gold token leaves the river node, flies to become the chart's peak value, rides
the graphic-match cut onto the mountain's summit — one object surviving three world-changes (CARRY).
The GRAPHIC MATCH: the chart's rising curve IS the mountain ridge's top edge (shared RY path) — hard cut
on the same screen geometry so the data 'becomes' the land (MATCH).

Renders to out/dispatch/proof_frames/, writes shots.json (SCENE_STRUCTURE) + storyboard.json (Gate 0),
and a contact sheet. No VO/captions — this proves the VISUAL grammar.
"""
import os, sys, json, math, glob
import numpy as np
from PIL import Image, ImageDraw
import dispatch_core as dc
import easing as E

W, H, FPS = dc.W, dc.H, dc.FPS
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "proof_frames")

# ---- timeline (4 shots, ~14s) ----
CUT1, CUT2, CUT3, NFP = 120, 250, 350, 430
VERM = (226, 76, 46)            # the one vermilion signal (the carried value)
MOSS = (120, 158, 112)          # moss-green (rivers, ridge line)
BONE = (228, 234, 230)          # bone-white (type)

# ---- the SHARED shape: a rising run-curve that is ALSO a mountain ridge (the graphic match) ----
_xs = np.arange(W, dtype=np.float32); _xn = _xs / W
RY = (H * 0.655 - _xn * H * 0.20) - np.abs(np.sin(_xn * 7.4)) * 74 - np.abs(np.sin(_xn * 19 + 1)) * 24
RY = RY.astype(np.float32)
PEAKX = int(np.argmin(RY[200:W - 160]) + 200)          # the summit / the curve's high value
PEAKY = int(RY[PEAKX])
TOKEN_A = (688.0, 760.0)                                # the river node on the map
TOKEN_BC = (float(PEAKX), float(PEAKY))                 # the chart peak == the mountain summit (carry target)


def scene_map(f):
    im = Image.new("RGB", (W, H), (19, 21, 25)); d = ImageDraw.Draw(im)
    for gx in range(0, W, 120): d.line([(gx, 0), (gx, H)], fill=(28, 31, 34), width=1)
    for gy in range(0, H, 120): d.line([(0, gy), (W, gy)], fill=(28, 31, 34), width=1)
    d.polygon([(0, H), (0, 1180), (360, 1260), (700, 1470), (W, 1360), (W, H)], fill=(24, 27, 26))   # coastline mass
    riv = MOSS
    d.line([(540, 300), (600, 560), (688, 760), (820, 1040), (900, 1340)], fill=riv, width=7, joint="curve")
    d.line([(688, 760), (520, 900), (415, 1090)], fill=riv, width=5, joint="curve")
    d.line([(600, 560), (770, 640), (892, 700)], fill=riv, width=4, joint="curve")
    return np.asarray(im)


def scene_data(f):
    im = Image.new("RGB", (W, H), (15, 16, 19)); d = ImageDraw.Draw(im)
    for gx in range(180, W - 60, 150): d.line([(gx, 320), (gx, 1480)], fill=(26, 28, 32), width=1)
    for gy in range(320, 1480, 150): d.line([(150, gy), (W - 80, gy)], fill=(26, 28, 32), width=1)
    d.line([(150, 1480), (W - 80, 1480)], fill=(120, 140, 165), width=3)
    d.line([(150, 320), (150, 1480)], fill=(120, 140, 165), width=3)
    yth = int(RY.min()) - 26                                            # the goal threshold (dashed)
    for x in range(180, W - 90, 34): d.line([(x, yth), (x + 18, yth)], fill=(120, 150, 176), width=2)
    X0, X1 = 182, W - 110
    prog = E.out_cubic(E.seg(f, CUT1, CUT1 + 44))                       # the curve DRAWS in
    xlead = int(X0 + (X1 - X0) * prog)
    pts = [(x, int(RY[x])) for x in range(X0, max(X0 + 2, xlead), 5)]
    if len(pts) >= 2: d.line(pts, fill=VERM, width=6, joint="curve")
    return np.asarray(im)


def scene_mountain(f):
    yy = np.linspace(0, 1, H, dtype=np.float32)
    top = np.array([8., 14, 42]); bot = np.array([4., 7, 15])
    rows = top[None, :] * (1 - yy[:, None]) + bot[None, :] * yy[:, None]
    rows += np.exp(-((yy - 0.22) / 0.085) ** 2)[:, None] * np.array([16., 122, 88]) * 0.72   # aurora band
    rows += np.exp(-((yy - 0.40) / 0.16) ** 2)[:, None] * np.array([34., 20, 60]) * 0.5      # violet wash
    arr = np.repeat(np.clip(rows, 0, 255)[:, None, :], W, axis=1).astype(np.uint8)
    im = Image.fromarray(arr); d = ImageDraw.Draw(im)
    rng = np.random.default_rng(7)
    for _ in range(90):
        sx, sy = int(rng.uniform(0, W)), int(rng.uniform(0, H * 0.5)); b = int(rng.uniform(70, 210))
        d.ellipse([sx, sy, sx + 2, sy + 2], fill=(b, b, min(255, b + 20)))
    poly = [(0, H)] + [(int(x), int(RY[int(x)])) for x in range(0, W, 4)] + [(W, H)]            # ridge == RY (the match)
    d.polygon(poly, fill=(17, 19, 23))
    d.line([(int(x), int(RY[int(x)])) for x in range(0, W, 4)], fill=(78, 104, 80), width=3)
    return np.asarray(im)


def scene_wordmark(f):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H * 0.42) / H) ** 2)
    base = np.clip(34 * np.exp(-(r * 2.3) ** 2), 0, 60)
    arr = np.dstack([np.clip(15 + base * .7, 0, 255), np.clip(16 + base * .7, 0, 255), np.clip(20 + base * .8, 0, 255)]).astype(np.uint8)
    return arr


def draw_labels(img, idx, f):
    """Crisp post-finish brand eyebrow + per-world label."""
    d = ImageDraw.Draw(img)
    dc.tk(d, "ALASKA.AI", dc.mono(18, True), BONE, 96, 84, 0.14)
    dc.tk(d, "/  SCENE-CRAFT PROOF", dc.mono(18), (150, 178, 132), 96 + dc.tw("ALASKA.AI", dc.mono(18, True), .14) + 16, 84, 0.14)
    lab = ["KENAI WATERSHED  ·  60.5°N", "RUN COUNT  ·  vs ESCAPEMENT GOAL", "THE RUN, ON THE GROUND", ""][idx]
    if lab:
        lf = dc.mono(20, m=True); d.text((96, 1392), lab, font=lf, fill=BONE)
    if idx == 3:
        bg = (15, 16, 21)                                            # fade via COLOR blend (ImageDraw on RGB ignores alpha)
        def fade(target, a): return tuple(int(bg[i] + (target[i] - bg[i]) * max(0.0, min(1.0, a))) for i in range(3))
        a = E.out_cubic(E.seg(f, CUT3 + 6, CUT3 + 50))
        if a > 0.02:
            wf = dc.fr(112, 820, 144); s = "ALASKA.AI"; w = dc.tw(s, wf, 0.04)
            dc.tk(d, s, wf, fade((238, 240, 236), a), (W - w) // 2, 820 - int((1 - a) * 18), 0.04)
            a2 = E.out_cubic(E.seg(f, CUT3 + 34, CUT3 + 70))
            if a2 > 0.02:
                tf = dc.fr(40, 600, 144); s2 = "what's moving in alaska ai, this week"; w2 = dc.tw(s2, tf, 0.02)
                dc.tk(d, s2, tf, fade((228, 234, 230), a2), (W - w2) // 2, 980, 0.02)


def token_pos(f):
    if f < CUT1 - 8: return TOKEN_A
    if f <= CUT1 + 40: return dc.lerp(TOKEN_A, TOKEN_BC, E.in_out_sine(E.seg(f, CUT1 - 8, CUT1 + 40)))
    if f < CUT3 + 8: return TOKEN_BC                                   # rides the chart peak AND the summit
    return None


def render_base(f):
    if f < CUT1: return scene_map(f), 0
    if f < CUT2: return scene_data(f), 1
    if f < CUT3: return scene_mountain(f), 2
    return scene_wordmark(f), 3


def write_board():
    beats = [{"n": i, "t": f"{i*5}.0-{i*5+5}.0", "new": b, "transition": "cut", "means": "advances the arc"}
             for i, b in enumerate([
                 "river map powers up, one node pulses gold", "the node's count is the question",
                 "carried gold token lifts off the river", "lands as the live value on a rising chart",
                 "the run-curve climbs toward the escapement goal", "it crosses the goal line",
                 "graphic match: the curve IS a mountain ridge", "the token rides onto the summit",
                 "aurora over the land the run feeds", "the season, made physical",
                 "hard build to the brand field", "ALASKA.AI wordmark + tagline"], 1)]
    board = {
        "concept": "One river's count becomes the mountain it feeds — a single carried value across four worlds.",
        "derived_from": "scratch", "palette": "moss-green and bone-white on graphite, one vermilion signal",
        "fingerprint": {"pov": "top-down-map", "motion_vector": "horizontal-traverse", "hero_treatment": "landscape-as-subject",
                        "layout": "map-territory", "register": "editorial-schematic",
                        "palette": "moss-green and bone-white on graphite, one vermilion signal",
                        "metaphor": "a carried value: one river's count becomes the mountain it feeds"},
        "divergence_note": ("Opposite to the last two: an overhead editorial MAP that travels horizontally, the land "
                            "itself the hero, moss-green + bone-white + one vermilion signal — not an amber instrument screen (sonar) and not a "
                            "vertical thermal cutaway (permafrost). And it CUTS between four different worlds."),
        "beats": beats,
        "shots": [
            {"id": 1, "t": "0.0-4.0",  "framing": "map-territory",   "pov": "top-down-map",       "layout": "map-territory",   "motion_vector": "horizontal-traverse", "hero_treatment": "landscape-as-subject", "centered": "the pulsing river node"},
            {"id": 2, "t": "4.0-8.3",  "framing": "data-panel",      "pov": "instrument-screen",  "layout": "grid-modular",    "motion_vector": "scroll-data",         "hero_treatment": "data-as-subject",      "transition_in": "carried-element", "thread": "carry", "centered": "the rising run-curve + its peak value"},
            {"id": 3, "t": "8.3-11.7", "framing": "wide-establish",  "pov": "orbital-aerial",     "layout": "stacked-layers",  "motion_vector": "push-in-only",        "hero_treatment": "landscape-as-subject", "transition_in": "graphic-match",   "thread": "match", "centered": "the ridge whose top edge IS the curve"},
            {"id": 4, "t": "11.7-14.3","framing": "subject-portrait","pov": "eye-level-immersive","layout": "single-object-void","motion_vector": "assemble-build",     "hero_treatment": "structure-as-subject", "transition_in": "assemble",        "thread": "build", "centered": "the ALASKA.AI wordmark"}
        ],
        "ending": "branded wordmark builds in over the deep field; the carried token settles, then a slow fade.",
    }
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "proof_storyboard.json")
    json.dump(board, open(p, "w"), indent=2)
    shots = [{"id": s["id"], "start": st, "end": en, "framing": s["framing"], "transition_in": s.get("transition_in", "fade-up")}
             for s, st, en in zip(board["shots"], [0, CUT1, CUT2, CUT3], [CUT1, CUT2, CUT3, NFP])]
    dc.write_shots(shots, NFP, os.path.join(os.path.dirname(os.path.abspath(__file__)), "proof_shots.json"))
    return p


def render_range(a, b):
    os.makedirs(OUT, exist_ok=True)
    for f in range(a, b):
        base, idx = render_base(f)
        img = Image.fromarray(dc.finish(base, 7000 + f))
        draw_labels(img, idx, f)
        tok = token_pos(f)
        if tok is not None:
            img = dc.carry_token(img, tok, r=15, color=VERM, glow=0.75 + 0.3 * math.sin(f * 0.22))
        if f < 12:                                                    # open from black
            img = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), img, E.out_cubic(f / 12))
        if f >= NFP - 18:                                             # close to black
            img = Image.blend(img, Image.new("RGB", (W, H), (0, 0, 0)), E.in_out_sine((f - (NFP - 18)) / 18))
        img.save(os.path.join(OUT, f"frame_{f:05d}.png"), compress_level=1)


def build_contact():
    fs = sorted(glob.glob(os.path.join(OUT, "frame_*.png")))
    thumbs = [Image.open(fs[i]).resize((W // 6, H // 6)) for i in range(0, len(fs), 30)]
    cols = max(1, len(thumbs)); sheet = Image.new("RGB", ((W // 6) * cols, H // 6), (0, 0, 0))
    for i, im in enumerate(thumbs): sheet.paste(im, ((W // 6) * i, 0))
    sheet.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), "proof_contact.png"))
    print(f"contact: {cols} thumbs from {len(fs)} frames")


def main():
    a = sys.argv[1:]
    if a and a[0] == "board": write_board(); return
    if a and a[0] == "contact": build_contact(); return
    if len(a) == 2: render_range(int(a[0]), int(a[1])); return
    write_board(); render_range(0, NFP); build_contact()
    print(f"rendered {NFP} frames; PEAKX={PEAKX} PEAKY={PEAKY}")


if __name__ == "__main__":
    main()
