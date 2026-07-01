"""
demo_smooth.py — RICH worlds + EXTREMELY SMOOTH morph transitions (the brain §1.5 + §3.5 in practice).

One polyline threads three genuinely different worlds and is interpolated point-by-point so each world
CONTINUOUSLY BECOMES the next — a true geometric morph, not a hard cut, not a dissolve over two pictures:
  RIVER (top-down watershed)  --morph-->  RUN-CURVE (data panel)  --morph-->  MOUNTAIN RIDGE (aurora night)
The same shared x-samples carry a y-path that eases from river-meander -> run-curve -> ridge; the world
CONTEXT (terrain / grid / aurora), palette, and atmosphere cross-transform on the same eased envelopes; a
vermilion token rides the path as the still point. No frame ever jumps.

Rich illustration, piece by piece: noise hillshade terrain, glowing ribboned polyline, perspective grid,
drifting data motes, animated aurora curtains, parallax starfield, atmospheric haze, the finish grade.

Usage: python3 demo_smooth.py [start end] | board | contact   (default: board + all + contact)
"""
import os, sys, json, math, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter
import dispatch_core as dc
import easing as E

W, H, FPS = dc.W, dc.H, dc.FPS
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demo_frames")
HERE = os.path.dirname(os.path.abspath(__file__))

# ---- palette (the demo's own cohesive world) ----
VERM = (231, 82, 51); MOSS = (120, 165, 120); BONE = (228, 234, 230)
RIVER_BG = np.array([16, 26, 28]); DATA_BG = np.array([9, 11, 15]); MTN_BG = np.array([10, 15, 34])

# ---- timeline (continuous; morphs are eased windows, never cuts) ----
F0 = 30                                   # open from black
M1 = (140, 180); M2 = (300, 340); NFP = 500
def env(f, a, b): return float(E.in_out_sine(E.seg(f, a, b)))

# ---- the SHARED polyline: x-samples fixed; y eases river -> curve -> (ridge = curve) ----
NX = 300
XS = np.linspace(120, W - 110, NX)
_t = np.linspace(0, 1, NX)
RIV_Y = H * 0.44 + np.sin(_t * 6.6) * 150 + np.sin(_t * 15.0 + 1.1) * 46          # a meander across the map
CUR_Y = (H * 0.66 - _t * H * 0.31) - np.abs(np.sin(_t * 7.2)) * 76 - np.abs(np.sin(_t * 18 + 1)) * 22  # rising run-curve
IDX = int(np.argmin(CUR_Y))               # the carried value sits at the curve's summit (== ridge peak)

def poly_y(p):                            # p: 0=river ... 1=curve/ridge
    return RIV_Y * (1 - p) + CUR_Y * p

# ---- precomputed rich layers ----
def _terrain():
    rng = np.random.default_rng(11)
    lo = gaussian_filter(rng.standard_normal((H // 8, W // 8)), 5)
    hm = np.asarray(Image.fromarray(((lo - lo.min()) / (np.ptp(lo) + 1e-6) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.0
    gy, gx = np.gradient(gaussian_filter(hm, 3))
    shade = np.clip(0.55 + (gx - gy) * 22, 0, 1)                                  # directional hillshade
    return hm, shade
HM, SHADE = _terrain()
_YY, _XX = np.mgrid[0:H, 0:W].astype(np.float32)
STAR = None
def _stars():
    global STAR
    if STAR is None:
        rng = np.random.default_rng(5); STAR = np.zeros((H, W), np.float32)
        ys = rng.integers(0, int(H * 0.62), 520); xs = rng.integers(0, W, 520); br = rng.uniform(0.3, 1.0, 520)
        for x, y, b in zip(xs, ys, br): STAR[y, x] = b
        STAR = gaussian_filter(STAR, 0.6)
    return STAR

def glow_ribbon(size_img, pts, color, width, glow, seed=0):
    """A glowing polyline ribbon: soft wide glow + bright core (drawn on its own RGBA layer)."""
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.line(pts, fill=(*color, 255), width=width + 8, joint="curve")
    lay = lay.filter(ImageFilter.GaussianBlur(11))
    lay = Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 0)), lay, min(1.0, glow))
    d2 = ImageDraw.Draw(lay)
    d2.line(pts, fill=(*color, 255), width=width, joint="curve")
    d2.line(pts, fill=(255, 255, 255, 210), width=max(1, width // 3), joint="curve")     # hot core
    return lay


def render(f):
    rc = env(f, F0, 55) * (1 - env(f, *M1))          # river context alpha
    dc_ = env(f, *M1) * (1 - env(f, *M2))            # data context alpha
    mc = env(f, *M2)                                  # mountain context alpha
    p = env(f, *M1)                                   # polyline river->curve morph
    ridge = env(f, *M2)                               # below-line fill grows -> mountain
    s = rc + dc_ + mc + 1e-6

    # --- background: cross-blend the three world palettes on the same envelopes ---
    base = (RIVER_BG * rc + DATA_BG * dc_ + MTN_BG * mc) / s
    arr = np.repeat(np.repeat(base[None, None, :], H, 0), W, 1).astype(np.float32)
    # a soft vertical light for depth
    arr += (np.clip(0.5 - _YY / H, -0.4, 0.5)[..., None] * np.array([6, 8, 12]))

    # --- RIVER world: hillshade terrain + haze (alpha rc) ---
    if rc > 0.01:
        land = (RIVER_BG + 6)[None, None, :] + (SHADE[..., None] * np.array([26, 40, 30]) - 10)
        arr = arr * (1 - rc * 0.9) + np.clip(land, 0, 255) * (rc * 0.9)
        haze = np.exp(-((_YY / H - 0.5) ** 2) / 0.16)[..., None] * np.array([10, 16, 18]) * rc
        arr += haze

    # --- MOUNTAIN world: aurora curtains + parallax stars (alpha mc) ---
    if mc > 0.01:
        au = np.exp(-((_YY / H - (0.24 + 0.03 * np.sin(_XX / W * 7 + f * 0.03))) ** 2) / 0.010)
        au += 0.6 * np.exp(-((_YY / H - (0.33 + 0.04 * np.sin(_XX / W * 5 - f * 0.02))) ** 2) / 0.020)
        arr += (au[..., None] * np.array([26, 150, 96]) * mc)
        arr += (np.exp(-((_YY / H - 0.30) ** 2) / 0.05)[..., None] * np.array([40, 22, 70]) * mc * 0.5)
        arr += (_stars()[..., None] * np.array([200, 210, 230]) * mc)

    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")

    # --- DATA world: a perspective grid that fades in (alpha dc_) ---
    if dc_ > 0.01:
        g = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
        vpx, vpy = W * 0.5, H * 0.20
        for gx in range(0, W + 1, 90):
            gd.line([(gx, H), (vpx + (gx - vpx) * 0.12, vpy)], fill=(70, 110, 120, 70), width=1)
        for k in range(1, 12):
            yy = int(H - (H - vpy) * (k / 12) ** 1.5)
            gd.line([(0, yy), (W, yy)], fill=(60, 96, 108, 60), width=1)
        gyth = int(CUR_Y.min()) - 36                                              # ESCAPEMENT GOAL (dashed)
        for xx in range(120, W - 90, 30): gd.line([(xx, gyth), (xx + 16, gyth)], fill=(150, 178, 150, 120), width=2)
        gd.text((W - 250, gyth - 30), "ESCAPEMENT GOAL", font=dc.mono(15, m=True), fill=(150, 178, 150, 150))
        img = Image.alpha_composite(img, Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 0)), g, dc_))

    # --- the through-line polyline (morphs river->curve); MOUNTAIN fills below it ---
    ys = poly_y(p); pts = [(float(XS[i]), float(ys[i])) for i in range(NX)]
    if ridge > 0.01:                                   # ridge silhouettes grow in under the line (parallax layers)
        sil = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sil)
        sd.polygon([(0, H)] + [(x, y + 150 + 46 * math.sin(x / 190 + 2)) for x, y in pts[::4]] + [(W, H)], fill=(22, 30, 52, 150))  # far ridge
        sd.polygon([(0, H)] + [(x, y + 76 + 30 * math.sin(x / 140)) for x, y in pts[::3]] + [(W, H)], fill=(12, 17, 32, 205))       # mid ridge
        sd.polygon([(XS[0], H)] + pts + [(XS[-1], H)], fill=(5, 8, 14, 255))                                                        # near ridge (== the curve)
        rng = np.random.default_rng(3)                                                                                             # deterministic snow on the near ridge
        for i in range(0, NX, 4):
            if rng.random() < 0.5:
                sx, sy = int(XS[i]), int(ys[i] + rng.uniform(2, 30))
                sd.ellipse([sx, sy, sx + 2, sy + 2], fill=(206, 222, 232, 210))
        img = Image.alpha_composite(img, Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 0)), sil, ridge))
    lc = tuple(max(0, min(255, int(MOSS[i] * (rc + 0.0001) / s + VERM[i] * (dc_ + 0.0001) / s + (150, 190, 150)[i] * (mc + 0.0001) / s))) for i in range(3))
    img = Image.alpha_composite(img, glow_ribbon(img, pts, lc, 7, 0.55 + 0.35 * dc_))

    # --- particles: data motes rise (data), snow drifts (mtn), river sheen (river) ---
    if dc_ > 0.05:
        pd = ImageDraw.Draw(img, "RGBA")
        for i in range(80):
            mx = (i * 137 % W); my = int((H - (f * 3 + i * 53) % H))
            a = int(120 * dc_ * (0.4 + 0.6 * ((i * 29) % 10) / 10))
            pd.ellipse([mx, my, mx + 3, my + 3], fill=(255, 150, 110, a))

    # --- the carried value (still point) ---
    tokx, toky = float(XS[IDX]), float(ys[IDX])
    img = dc.carry_token(img.convert("RGB"), (tokx, toky), r=15, color=VERM, glow=0.7 + 0.3 * math.sin(f * 0.2)).convert("RGBA")

    out = Image.fromarray(dc.finish(np.asarray(img.convert("RGB")), 9000 + f))
    return out


def draw_labels(img, f):
    d = ImageDraw.Draw(img)
    dc.tk(d, "ALASKA.AI", dc.mono(18, True), BONE, 96, 84, 0.14)
    dc.tk(d, "/  SMOOTH-MORPH DEMO", dc.mono(18), (150, 178, 132), 96 + dc.tw("ALASKA.AI", dc.mono(18, True), .14) + 16, 84, 0.14)
    rc = env(f, F0, 55) * (1 - env(f, *M1)); dc_ = env(f, *M1) * (1 - env(f, *M2)); mc = env(f, *M2)
    lab = max([(rc, "KENAI WATERSHED"), (dc_, "RUN COUNT  ·  vs ESCAPEMENT GOAL"), (mc, "THE RUN, ON THE GROUND")], key=lambda x: x[0])
    if lab[0] > 0.5:
        a = min(1.0, (lab[0] - 0.5) / 0.4); lf = dc.mono(20, m=True)
        d.text((96, 1392), lab[1], font=lf, fill=tuple(int(20 + (BONE[i] - 20) * a) for i in range(3)))


def render_range(a, b):
    os.makedirs(OUT, exist_ok=True)
    for f in range(a, b):
        img = render(f)
        draw_labels(img, f)
        if f < 22: img = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), img, E.out_cubic(f / 22))
        if f >= NFP - 26: img = Image.blend(img, Image.new("RGB", (W, H), (0, 0, 0)), E.in_out_sine((f - (NFP - 26)) / 26))
        img.save(os.path.join(OUT, f"frame_{f:05d}.png"), compress_level=1)


def build_contact():
    fs = sorted(glob.glob(os.path.join(OUT, "frame_*.png")))
    th = [Image.open(fs[i]).resize((W // 6, H // 6)) for i in range(0, len(fs), 28)]
    cols = max(1, len(th)); sheet = Image.new("RGB", ((W // 6) * cols, H // 6), (0, 0, 0))
    for i, im in enumerate(th): sheet.paste(im, ((W // 6) * i, 0))
    sheet.save(os.path.join(HERE, "demo_contact.png")); print(f"contact: {cols} thumbs / {len(fs)} frames")


def write_board():
    beats = [{"n": i, "t": f"{i*4}-{i*4+4}", "new": b} for i, b in enumerate(
        ["watershed relief resolves", "a river meanders, one node glows", "the river straightens as it morphs",
         "into a rising run-curve", "the count climbs to the goal", "data motes lift off the curve",
         "the curve rises and thickens", "morphing into a mountain ridge", "aurora blooms over the night",
         "the token crowns the summit", "the land the run feeds", "a slow settle"], 1)]
    board = {"concept": "One river's count becomes the mountain it feeds — three worlds, morphed smoothly.",
             "derived_from": "scratch", "palette": "graphite + moss-green + bone, one vermilion signal, aurora night",
             "fingerprint": {"pov": "top-down-map", "motion_vector": "horizontal-traverse", "hero_treatment": "landscape-as-subject",
                             "layout": "map-territory", "register": "editorial-schematic",
                             "palette": "graphite + moss-green + bone, one vermilion signal, aurora night",
                             "metaphor": "a carried value morphing river -> data -> mountain"},
             "divergence_note": "Rich illustrated worlds joined by continuous geometric MORPHS (not cuts): a river meander eases into a run-curve eases into a mountain ridge, one vermilion value carried throughout.",
             "beats": beats,
             "shots": [
                 {"id": 1, "t": "0-4.7", "framing": "map-territory", "pov": "top-down-map", "layout": "map-territory", "motion_vector": "horizontal-traverse", "hero_treatment": "landscape-as-subject", "centered": "the glowing river node"},
                 {"id": 2, "t": "4.7-10", "framing": "data-panel", "pov": "instrument-screen", "layout": "grid-modular", "motion_vector": "scroll-data", "hero_treatment": "data-as-subject", "transition_in": "morph", "thread": "carry", "centered": "the rising run-curve"},
                 {"id": 3, "t": "10-16.7", "framing": "wide-establish", "pov": "orbital-aerial", "layout": "stacked-layers", "motion_vector": "push-in-only", "hero_treatment": "landscape-as-subject", "transition_in": "morph", "thread": "match", "centered": "the ridge that was the curve"}],
             "ending": "settle on the aurora mountain, token on the summit, slow fade."}
    json.dump(board, open(os.path.join(HERE, "demo_storyboard.json"), "w"), indent=2)
    print("board written")


def main():
    a = sys.argv[1:]
    if a and a[0] == "board": write_board(); return
    if a and a[0] == "contact": build_contact(); return
    if len(a) == 2: render_range(int(a[0]), int(a[1])); return
    write_board(); render_range(0, NFP); build_contact()


if __name__ == "__main__":
    main()
