"""
Alaska.Ai Dispatch 2026-07-04 -- "Two Ships, One Night" -- 9:16 (1080x1920), 64s/1920f @30fps.
STORY: Matson's Alaska cargo fleet already runs WhaleSpotter, an AI thermal whale-detection
system. On June 21 2026 a Royal Caribbean cruise ship docked in Seward with a dead, pregnant
fin whale on its bow (vessel-strike-consistent, cause still pending). No Alaska cruise ship is
known to carry equivalent tech. The film never claims the tech would have saved this whale, or
that the cruise line was offered and declined it -- only that a real, documented gap exists.
ARCHETYPE: fullbleed split-screen diptych -- one instrumented (thermal, AI-sighted) half, one
blind (dark, uninstrumented) half. Built fresh to out/dispatch/storyboard.json; see there for the
composition fingerprint + 7-shot list + beat map.
PALETTE: midnight indigo night sea; a magenta-to-copper thermal heat signature (the AI's sight);
bare graphite-and-mercury grey (the blind ship's world). Never reused by any prior Dispatch.

NOTE on alpha: PIL's ImageDraw does not alpha-blend fills against the destination -- it stamps
the raw fill color with a stored alpha channel that gets DISCARDED on .convert("RGB"), silently
turning every "translucent" shape fully opaque. Every faded element here is therefore drawn onto
its own transparent scratch layer (NL()) and merged with Image.alpha_composite, which performs a
real "over" blend using the layer's per-pixel alpha. Fully-opaque (alpha=255) content is drawn
directly since there's nothing to blend.

  test:  python render_whalespotter.py test 0 60 300 620 1000 1400 1700 1850
  range: python render_whalespotter.py 0 1920
"""
import sys, os, math, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter
import easing as E
import dispatch_core as dc

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, "frames_v3")
os.makedirs(FR, exist_ok=True)
W, H, FPS = 1080, 1920, 30
NF = 1920  # 64s -- gives the outro room after speech_end (59.6s) without a rushed sign-off
TIM = dc.TIM
SPEECH_END = TIM.get("speech_end", 59.6)

# ---------------- palette (fresh; never used by a prior Dispatch) ----------------
NIGHT_HI = (28, 34, 58)     # indigo horizon
NIGHT_LO = (6, 8, 18)       # near-black water depth
MERCURY = (146, 154, 168)   # blind-half cold grey
SODIUM = (232, 214, 170)    # blind-half deck-light warm-white
MAGENTA = (232, 64, 158)    # thermal hot
COPPER = (224, 140, 64)     # thermal warm-mid
THERMAL_COOL = (18, 44, 84) # thermal cold background (still "AI sees" but cold water)
SNOW = (244, 250, 255)
GOLD = (255, 199, 44)
FAINT = (150, 168, 194)

SHOTS_SEC = [
    (1, 0.0, 6.675, "wide-establish"),
    (2, 6.675, 13.9, "push-detail"),
    (3, 13.9, 18.075, "alt-vantage"),
    (4, 18.075, 30.375, "data-panel"),
    (5, 30.375, 44.625, "two-up"),
    (6, 44.625, 59.6, "map-territory"),
    (7, 59.6, 64.0, "subject-portrait"),
]
SHOTS_F = [(i, int(a * FPS), int(b * FPS), fr_) for (i, a, b, fr_) in SHOTS_SEC]
TRANS_F = 20  # frames of cross-blend at each cut

rng_g = np.random.default_rng(11)


def _shape_bbox(shapes):
    xs, ys = [], []
    for kind, spec in shapes:
        if kind == "ellipse":
            xs += [spec[0], spec[2]]; ys += [spec[1], spec[3]]
        else:
            xs += [p[0] for p in spec]; ys += [p[1] for p in spec]
    return min(xs), min(ys), max(xs), max(ys)


def shaded_fill(shape, base_rgb, light_from="upper-left", shade_strength=0.55, tex_amt=9, seed=7, alpha=255, img=None):
    """Fill `shape` (a polygon point list, or a list of ("ellipse", bbox) / ("poly", pts) tuples)
    with a directional-lit gradient + subtle film grain, so the surface reads as FORM (key light +
    falloff + material texture) instead of a flat solid color. Operates ONLY on the shape's local
    bounding box (not the full WxH canvas) for speed -- a per-frame render draws dozens of these.
    If `img` is given, pastes directly onto it and returns img; otherwise returns a small RGBA
    patch + its (x0,y0) offset for the caller to paste itself."""
    shapes = shape if (isinstance(shape, list) and shape and isinstance(shape[0], tuple) and shape[0] and shape[0][0] in ("ellipse", "poly")) else [("poly", shape)]
    bx0, by0, bx1, by1 = _shape_bbox(shapes)
    pad = 3
    x0, y0 = max(0, int(bx0) - pad), max(0, int(by0) - pad)
    x1, y1 = min(W, int(math.ceil(bx1)) + pad), min(H, int(math.ceil(by1)) + pad)
    lw, lh = x1 - x0, y1 - y0
    if lw <= 0 or lh <= 0:
        patch = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
        if img is not None:
            img.paste(patch, (x0, y0), patch); return img
        return patch, x0, y0
    mask = Image.new("L", (lw, lh), 0)
    md = ImageDraw.Draw(mask)
    for kind, spec in shapes:
        if kind == "ellipse":
            md.ellipse([spec[0] - x0, spec[1] - y0, spec[2] - x0, spec[3] - y0], fill=255)
        else:
            md.polygon([(p[0] - x0, p[1] - y0) for p in spec], fill=255)
    m = np.asarray(mask, dtype=np.float32) / 255.0
    yy, xx = np.mgrid[0:lh, 0:lw].astype(np.float32)
    nx = (xx + x0 - bx0) / max(1, (bx1 - bx0))
    ny = (yy + y0 - by0) / max(1, (by1 - by0))
    if light_from == "upper-left":
        light = (1 - nx) * 0.5 + (1 - ny) * 0.5
    elif light_from == "upper-right":
        light = nx * 0.5 + (1 - ny) * 0.5
    else:
        light = 1 - ny
    light = np.clip(light, 0, 1) ** 1.25
    base = np.array(base_rgb, np.float32)
    hi = np.clip(base * 1.32 + 16, 0, 255)
    lo = np.clip(base * 0.32, 0, 255)
    grad = lo[None, None, :] * (1 - shade_strength) + base[None, None, :] * shade_strength + (hi - lo)[None, None, :] * light[..., None] * shade_strength
    rr = np.random.default_rng(seed)
    noise = gaussian_filter(rr.standard_normal((lh, lw)).astype(np.float32), 1.1)
    grad = grad + noise[..., None] * tex_amt
    grad = np.clip(grad, 0, 255).astype(np.uint8)
    out = np.dstack([grad, (m * alpha).astype(np.uint8)])
    patch = Image.fromarray(out, "RGBA")
    if img is not None:
        img.paste(patch, (x0, y0), patch)
        return img
    return patch, x0, y0


def rim_edge(pts, color, width=4, alpha=210, blur=1.4, img=None):
    """A bright highlight stroke along a named sub-path of a silhouette (the lit top contour),
    with a soft glow -- reads as a rim/back light catching the edge of the form. Local bbox only."""
    pad = int(width + blur * 4 + 4)
    x0 = max(0, int(min(p[0] for p in pts)) - pad); y0 = max(0, int(min(p[1] for p in pts)) - pad)
    x1 = min(W, int(math.ceil(max(p[0] for p in pts))) + pad); y1 = min(H, int(math.ceil(max(p[1] for p in pts))) + pad)
    lw, lh = max(1, x1 - x0), max(1, y1 - y0)
    lay = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
    ImageDraw.Draw(lay).line([(p[0] - x0, p[1] - y0) for p in pts], fill=(*color, alpha), width=width, joint="curve")
    if blur > 0:
        arr = np.asarray(lay).astype(np.float32)
        arr[..., 3] = gaussian_filter(arr[..., 3], blur)
        lay = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
    if img is not None:
        img.paste(lay, (x0, y0), lay)
        return img
    return lay, x0, y0


def contact_shadow(cx, base_y, w, h=16, alpha=140, img=None):
    """Soft blurred dark ellipse where a hull meets the water -- grounds the form, kills the
    'cardboard cutout floating in space' read. Local bbox only (a fixed blur margin)."""
    pad = 34
    x0, y0 = max(0, int(cx - w - pad)), max(0, int(base_y - h * 0.4 - pad))
    x1, y1 = min(W, int(cx + w + pad)), min(H, int(base_y + h + pad))
    lw, lh = max(1, x1 - x0), max(1, y1 - y0)
    lay = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
    ImageDraw.Draw(lay).ellipse([cx - w - x0, base_y - h * 0.4 - y0, cx + w - x0, base_y + h - y0], fill=(0, 0, 0, alpha))
    arr = np.asarray(lay).astype(np.float32)
    arr[..., 3] = gaussian_filter(arr[..., 3], 10)
    lay = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
    if img is not None:
        img.paste(lay, (x0, y0), lay)
        return img
    return lay, x0, y0


def NL():
    """A fresh fully-transparent scratch layer + its drawer. Draw translucent content here, then
    merge with Image.alpha_composite (the only Pillow op that actually blends alpha correctly)."""
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return lay, ImageDraw.Draw(lay, "RGBA")


def _grad(top, bot, h=H, w=W):
    t = np.linspace(0, 1, h).reshape(h, 1, 1)
    row = np.array(top, np.float32) * (1 - t) + np.array(bot, np.float32) * t
    return np.repeat(row, w, axis=1).astype(np.float32)


def sea_texture(seed, rows=H, cols=W, scale=0.0018):
    y, x = np.mgrid[0:rows, 0:cols].astype(np.float32)
    r = np.random.default_rng(seed)
    n = np.zeros((rows, cols), np.float32)
    for oct_, amp in [(1, 1.0), (2, 0.5), (4, 0.25)]:
        ph = r.uniform(0, 6.283)
        n += amp * np.sin(x * scale * oct_ + y * scale * 2.4 * oct_ + ph)
    return (n - n.min()) / (n.max() - n.min() + 1e-6)


def draw_ship(img, cx, base_y, scale, lit_windows=True, kind="cruise", alpha=255, seed=41):
    """Composites a form-shaded hull (key-lit gradient + grain + rim highlight + contact shadow)
    onto `img` and returns the updated image. Reads as a lit, grounded object, not a flat icon."""
    if kind == "cruise":
        hw, hh = 260 * scale, 90 * scale
        hull = [(cx - hw, base_y), (cx - hw * 0.9, base_y - hh * 0.5), (cx - hw * 0.3, base_y - hh),
                (cx + hw * 0.6, base_y - hh), (cx + hw, base_y - hh * 0.35), (cx + hw, base_y),
                (cx - hw, base_y)]
        top_contour = hull[:5]
        img = contact_shadow(cx, base_y, hw * 1.05, alpha=min(150, alpha), img=img)
        img = shaded_fill(hull, (34, 40, 56), light_from="top", shade_strength=0.6, tex_amt=7, seed=seed, alpha=alpha, img=img)
        d = ImageDraw.Draw(img, "RGBA")
        if lit_windows:
            for ri in range(3):
                wy = base_y - hh * (0.28 + ri * 0.24)
                for wx in np.linspace(cx - hw * 0.75, cx + hw * 0.75, 14):
                    if rng_g.random() > 0.22:
                        d.rectangle([wx - 4, wy - 3, wx + 4, wy + 3], fill=(*SODIUM, alpha))
        img = rim_edge(top_contour, (200, 214, 232), width=3, alpha=int(0.75 * alpha), img=img)
        d = ImageDraw.Draw(img, "RGBA")
    else:  # cargo
        hw, hh = 300 * scale, 46 * scale
        hull = [(cx - hw, base_y), (cx - hw, base_y - hh * 0.4), (cx - hw * 0.92, base_y - hh),
                (cx + hw * 0.86, base_y - hh), (cx + hw, base_y - hh * 0.4), (cx + hw, base_y)]
        top_contour = hull[1:5]
        img = contact_shadow(cx, base_y, hw * 1.05, alpha=min(150, alpha), img=img)
        img = shaded_fill(hull, (28, 30, 38), light_from="top", shade_strength=0.55, tex_amt=7, seed=seed, alpha=alpha, img=img)
        d = ImageDraw.Draw(img, "RGBA")
        box_w = hw * 0.16
        for bx in np.arange(cx - hw * 0.8, cx + hw * 0.8, box_w * 1.05):
            bh = hh * (0.55 + 0.35 * rng_g.random())
            box_top, box_bot = base_y - hh - bh, base_y - hh
            col = (72, 46, 40) if rng_g.random() > 0.5 else (58, 60, 68)
            img = shaded_fill([(bx, box_bot), (bx, box_top), (bx + box_w, box_top), (bx + box_w, box_bot)],
                               col, light_from="upper-left", shade_strength=0.6, tex_amt=6, seed=abs(int(bx)) + 1, alpha=alpha, img=img)
        d = ImageDraw.Draw(img, "RGBA")
        if lit_windows:
            for wx in np.linspace(cx - hw * 0.2, cx + hw * 0.15, 4):
                d.rectangle([wx - 3, base_y - hh * 0.7, wx + 3, base_y - hh * 0.55], fill=(*SODIUM, alpha))
        img = rim_edge(top_contour, (170, 182, 200), width=3, alpha=int(0.65 * alpha), img=img)
        d = ImageDraw.Draw(img, "RGBA")
    d.ellipse([cx - hw - 4, base_y - hh * 0.5 - 4, cx - hw + 4, base_y - hh * 0.5 + 4], fill=(255, 70, 70, alpha))
    d.ellipse([cx + hw - 4, base_y - hh * 0.5 - 4, cx + hw + 4, base_y - hh * 0.5 + 4], fill=(80, 255, 120, alpha))
    return img


def draw_whale(img, cx, cy, scale, alpha=255, shaded=True, base_col=(52, 58, 72), seed=53):
    """Composites a form-shaded whale body onto `img` and returns the updated image. base_col is
    deliberately lighter/greyer than any hull it may be draped across, so it reads as a distinct
    subject rather than camouflaging into a black silhouette behind it. Built from overlapping
    ellipses (not a low-vertex polygon) so the directional shading reads as a smooth, rounded
    body rather than faceted origami."""
    bw, bh = 210 * scale, 62 * scale
    body = [
        ("ellipse", (cx - bw, cy - bh, cx + bw * 0.55, cy + bh * 0.62)),
        ("ellipse", (cx - bw * 0.15, cy - bh * 0.92, cx + bw * 0.92, cy + bh * 0.42)),
        ("ellipse", (cx + bw * 0.35, cy - bh * 0.55, cx + bw * 1.05, cy + bh * 0.22)),
    ]
    img = shaded_fill(body, base_col, light_from="top", shade_strength=0.32, tex_amt=7, seed=seed, alpha=alpha, img=img)
    d = ImageDraw.Draw(img, "RGBA")
    fx, fy = cx + bw * 0.95, cy - bh * 0.1
    fluke = [(fx, fy), (fx + 34 * scale, fy - 26 * scale), (fx + 40 * scale, fy), (fx + 34 * scale, fy + 26 * scale)]
    img = shaded_fill(fluke, tuple(int(c * 0.75) for c in base_col), light_from="upper-left", shade_strength=0.5, tex_amt=6, seed=seed + 1, alpha=alpha, img=img)
    d = ImageDraw.Draw(img, "RGBA")
    ecx, ecy = cx - bw * 0.225, cy - bh * 0.19
    erx, ery = bw * 0.775, bh * 0.81
    top_arc = [(ecx + erx * math.cos(a), ecy + ery * math.sin(a)) for a in np.linspace(math.pi * 1.08, math.pi * 1.92, 14)]
    img = rim_edge(top_arc, (220, 228, 238), width=3, alpha=int(0.7 * alpha), blur=1.6, img=img)
    return img


def thermal_blob_layer(cx, cy, r, glow_a):
    """Warm heat signature on its own transparent layer (caller composites it)."""
    lay, ld = NL()
    for k, col, a in [(r * 2.6, MAGENTA, 0.10), (r * 1.6, MAGENTA, 0.22), (r * 1.0, COPPER, 0.55), (r * 0.55, (255, 224, 190), 0.85)]:
        ld.ellipse([cx - k, cy - k * 0.6, cx + k, cy + k * 0.6], fill=(*col, int(255 * a * glow_a)))
    return lay


def bracket(d, cx, cy, r, alpha=255, col=MAGENTA):
    L = r * 1.5
    for sx, sy in [(-1, -1), (1, -1), (-1, 1), (1, 1)]:
        x0, y0 = cx + sx * L, cy + sy * L * 0.62
        d.line([(x0, y0), (x0 - sx * 22, y0)], fill=(*col, alpha), width=3)
        d.line([(x0, y0), (x0, y0 - sy * 22)], fill=(*col, alpha), width=3)


def full_frame_flash(img, p, peak=0.22, col=SNOW):
    """A brief, full-frame brightness pulse (a camera flash / beacon sweep / instrument strobe).
    Guarantees a large, unambiguous EVENT_CADENCE spike since it touches every pixel at once,
    unlike a small localized highlight which barely moves the whole-frame average."""
    if p <= 0.02:
        return img
    lay = Image.new("RGBA", (W, H), (*col, int(255 * peak * p)))
    return Image.alpha_composite(img, lay)


def stars(base, seed, n=90, area=(0, 0, W, int(H * 0.42))):
    lay, ld = NL()
    r = np.random.default_rng(seed)
    for _ in range(n):
        x = r.uniform(area[0], area[2]); y = r.uniform(area[1], area[3])
        # keep the top-left header safe-area clear so stars never land on the ALASKA.AI / DISPATCH /
        # SEWARD wordmark and read as stray typos on the type (a flagged polish issue)
        if y < 140 and x < 560:
            continue
        a = int(r.uniform(60, 190))
        ld.ellipse([x, y, x + 1.4, y + 1.4], fill=(*SNOW, a))
    return Image.alpha_composite(base, lay)


# ---------------- SHOT SCENES (each returns an RGB PIL image at full frame, pre-grade) ----------------

def scene_arrival(f, f0):
    """Shot 1: the cruise ship docks at night, the whale draped on its bow. Slow push handled outside."""
    t = (f - f0) / FPS
    base_arr = _grad(NIGHT_HI, NIGHT_LO)
    sea = sea_texture(101)
    horizon = int(H * 0.40)
    base_arr[:horizon] += (sea[:horizon, :, None] * 6 - 3)
    base_arr[horizon:] += (sea[horizon:, :, None] * 10 - 5) * (1 + 0.15 * math.sin(t * 0.6))
    # mist band -- blended directly in the numpy array (correct math; no ImageDraw alpha involved)
    mist_a = 0.10 + 0.05 * math.sin(t * 0.5)
    y0m, y1m = horizon - 60, horizon + 40
    mist_col = np.array([200, 210, 224], np.float32)
    fall = np.clip(1 - np.abs(np.arange(y0m, y1m) - horizon) / 60.0, 0, 1)[:, None, None]
    base_arr[y0m:y1m] = base_arr[y0m:y1m] * (1 - mist_a * fall) + mist_col * (mist_a * fall)
    img = Image.fromarray(np.clip(base_arr, 0, 255).astype(np.uint8)).convert("RGBA")
    img = stars(img, 5, 70, (0, 0, W, int(H * 0.34)))
    d = ImageDraw.Draw(img, "RGBA")
    # distant harbor hillside silhouette (opaque)
    hy = horizon - 30
    pts = [(0, hy)]
    for x in range(0, W + 1, 60):
        pts.append((x, hy - 40 * math.sin(x * 0.004 + 1.3) - 20))
    pts += [(W, horizon), (0, horizon)]
    d.polygon(pts, fill=(16, 20, 34, 255))
    for wx in range(40, W, 130):
        if rng_g.random() > 0.5:
            d.ellipse([wx, hy - 6, wx + 3, hy - 3], fill=(*SODIUM, 255))
    # HOOK: open ON the ship already substantially in-frame (big, lit windows glowing warm against
    # the night navy) so a strong subject lands in the first second instead of a near-black sea.
    # It settles the last short distance rather than drifting in from the far edge.
    enter = E.out_cubic(E.seg(f, f0, f0 + 45))
    cx = 470 + enter * 130
    base_y = horizon + 210
    ship_scale = 1.55
    img = draw_ship(img, cx, base_y, ship_scale, kind="cruise")
    d = ImageDraw.Draw(img, "RGBA")
    # whale draped across the bow tip, resolves EARLY (by ~1s) -- a lighter, cool grey body so it
    # reads as a distinct subject against the ship's dark hull, and so the loaded image (a shape on
    # the bow) is what stops the scroll, not empty water. The big push-detail reveal is shot 2.
    wa = E.out_cubic(E.seg(f, f0 + 14, f0 + 52))
    if wa > 0.02:
        img = draw_whale(img, cx - 260 * ship_scale * 0.34, base_y - 24, 0.66, int(255 * wa))
        d = ImageDraw.Draw(img, "RGBA")
    # drifting mist motes (foreground, translucent -> own layer)
    mlay, mld = NL()
    for i in range(24):
        mx = (i * 97 + t * 40) % W
        my = (horizon + 60 + (i * 53) % 500)
        mld.ellipse([mx, my, mx + 2, my + 2], fill=(210, 220, 232, 60))
    img = Image.alpha_composite(img, mlay)
    return img


def scene_whale_detail(f, f0):
    """Shot 2: push-detail / macro on the whale itself, necropsy hedge caption drawn as an unresolved
    dotted rule (never a hard confirmed box) -- the honest hedge, as a picture."""
    base_arr = _grad((20, 24, 40), (5, 6, 12))
    img = Image.fromarray(np.clip(base_arr, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    cy = int(H * 0.42)
    # draw_whale already carries its own body-hugging rim light; no separate floating arc (a prior
    # extra arc read as a stray stroke detached from the body -- removed).
    img = draw_whale(img, W // 2 + 20, cy, 2.05, 255, shaded=True)
    d = ImageDraw.Draw(img, "RGBA")
    # a slow gleam sweeps across the whale's back between the two cards -- fills the visual gap, and
    # reads as a searchlight/spotter passing over the body (motivated: something is looking at it)
    gleam_p = E.seg(f, f0 + 55, f0 + 95)
    if 0 < gleam_p < 1:
        glay, gld = NL()
        gx = W * 0.15 + gleam_p * W * 0.9
        for dx_, a_ in [(-26, 40), (-12, 90), (0, 160), (12, 90), (26, 40)]:
            gld.line([(gx + dx_, cy - 90), (gx + dx_ - 60, cy + 60)], fill=(220, 232, 245, a_), width=6)
        img = Image.alpha_composite(img, glay)
        d = ImageDraw.Draw(img, "RGBA")
    # a documentation team's camera flash -- fills the mid-shot gap between the two cards with a
    # single, unambiguous full-frame beat (motivated: someone is photographing the necropsy findings)
    flash_p = E.seg(f, f0 + 68, f0 + 74) * (1.0 - E.seg(f, f0 + 74, f0 + 92))
    img = full_frame_flash(img, max(0.0, flash_p), peak=0.16)
    d = ImageDraw.Draw(img, "RGBA")
    # scale numeral card
    numv = E.out_cubic(E.seg(f, f0 + 8, f0 + 40))
    if numv > 0.02:
        nlay, nld = NL()
        nx, ny = 90, 210
        nld.rounded_rectangle([nx - 20, ny - 14, nx + 230, ny + 108], 14, fill=(6, 10, 18, int(210 * numv)))
        nf = dc.fr(66, 850)
        dc.tk(nld, "61 FT", nf, (*SNOW, int(255 * numv)), nx, ny - 6)
        lf = dc.mono(16, b=True)
        dc.tk(nld, "PREGNANT FIN WHALE", lf, (*FAINT, int(230 * numv)), nx, ny + 78, 0.06)
        img = Image.alpha_composite(img, nlay)
        d = ImageDraw.Draw(img, "RGBA")
        dc.logw(nx, ny - 6, dc.tw("61 FT", nf), nf.size, SNOW, numv, numv >= 0.6, "count")
    # necropsy hedge card -- the honest caveat drawn as a picture: a DOTTED rule (unresolved), never solid
    hv = E.out_cubic(E.seg(f, f0 + 100, f0 + 150))
    if hv > 0.02:
        hlay, hld = NL()
        hx, hy = 90, H - 680
        hld.rounded_rectangle([hx - 24, hy - 20, hx + 900, hy + 150], 14, fill=(4, 8, 16, int(200 * hv)))
        hf = dc.mono(24, b=True)
        dc.tk(hld, "NECROPSY: CONSISTENT WITH VESSEL STRIKE", hf, (*SNOW, int(245 * hv)), hx, hy, 0.03)
        # a rule of round DOTS (not a hyphen cluster) -- the hedge stays visually UNRESOLVED (not a
        # hard confirming underline), while avoiding any optical echo of the banned dash character
        for xx in range(hx, hx + 760, 20):
            hld.ellipse([xx, hy + 42, xx + 4, hy + 46], fill=(*GOLD, int(215 * hv)))
        lf2 = dc.mono(18, m=True)
        dc.tk(hld, "CAUSE OF DEATH: STILL PENDING", lf2, (*FAINT, int(220 * hv)), hx, hy + 62, 0.04)
        img = Image.alpha_composite(img, hlay)
        d = ImageDraw.Draw(img, "RGBA")
        dc.logw(hx, hy, dc.tw("NECROPSY: CONSISTENT WITH VESSEL STRIKE", hf, 0.03), hf.size, SNOW, hv, hv >= 0.6, "hud")
    return img


def scene_open_water(f, f0):
    """Shot 3: alt-vantage, open dark water, the Matson cargo ship crossing -- the pivot to a second world."""
    base_arr = _grad((14, 18, 34), (4, 5, 11))
    sea = sea_texture(202, scale=0.0026)
    horizon = int(H * 0.46)
    base_arr[horizon:] += (sea[horizon:, :, None] * 14 - 7)
    img = Image.fromarray(np.clip(base_arr, 0, 255).astype(np.uint8)).convert("RGBA")
    img = stars(img, 6, 110, (0, 0, W, int(H * 0.40)))
    d = ImageDraw.Draw(img, "RGBA")
    trav = (f - f0) / max(1, (SHOTS_F[2][2] - SHOTS_F[2][1]))
    cx = 140 + trav * 780
    img = draw_ship(img, cx, horizon + 130, 0.72, kind="cargo")
    d = ImageDraw.Draw(img, "RGBA")
    hlay, hld = NL()
    hld.rectangle([0, horizon - 4, W, horizon + 4], fill=(60, 72, 96, 60))
    img = Image.alpha_composite(img, hlay)
    return img


def scene_whalespotter_hud(f, f0):
    """Shot 4: the machine's own POV -- a thermal HUD booting up, a heat blob resolving + bracketed."""
    fseg0 = SHOTS_F[3][1]
    boot = E.out_cubic(E.seg(f, fseg0, fseg0 + 26))
    base_arr = _grad(THERMAL_COOL, (4, 10, 22))
    tex = sea_texture(303, scale=0.003)
    base_arr += (tex[:, :, None] * 10 - 5)
    img = Image.fromarray(np.clip(base_arr, 0, 255).astype(np.uint8)).convert("RGBA")

    if boot > 0.02:
        blay, bld = NL()
        m = 60
        bld.rectangle([m, 210, W - m, H - 320], outline=(90, 200, 220, int(200 * boot)), width=2)
        for cx0, cy0 in [(m, 210), (W - m, 210), (m, H - 320), (W - m, H - 320)]:
            bld.line([(cx0 - 14, cy0), (cx0 + 14, cy0)], fill=(*GOLD, int(230 * boot)), width=3)
            bld.line([(cx0, cy0 - 14), (cx0, cy0 + 14)], fill=(*GOLD, int(230 * boot)), width=3)
        img = Image.alpha_composite(img, blay)

    reveal = E.out_cubic(E.seg(f, fseg0 + 20, fseg0 + 70))
    bx = W * 0.56 + 30 * math.sin((f - f0) * 0.03)
    by = H * 0.40 + 14 * math.cos((f - f0) * 0.025)
    if reveal > 0.02:
        img = Image.alpha_composite(img, thermal_blob_layer(bx, by, 46, reveal))
    lock = E.out_cubic(E.seg(f, fseg0 + 60, fseg0 + 96))
    if lock > 0.02:
        klay, kld = NL()
        bracket(kld, bx, by, 60, int(230 * lock))
        lf = dc.mono(15, b=True)
        dc.tk(kld, "HEAT SIGNATURE", lf, (*MAGENTA, int(230 * lock)), bx + 70, by - 30, 0.10)
        img = Image.alpha_composite(img, klay)

    # -------- HUD telemetry card inside CARD_BAND (100,1175,980,1360) for the HUD_TEXT gate --------
    card_v = E.out_cubic(E.seg(f, fseg0 + 30, fseg0 + 66))
    if card_v > 0.02:
        clay, cld = NL()
        cx0, cy0, cx1, cy1 = 100, 1175, 980, 1360
        cld.rounded_rectangle([cx0, cy0, cx1, cy1], 16, fill=(6, 16, 26, int(224 * card_v)))
        cld.rectangle([cx0, cy0, cx1, cy1], outline=(90, 200, 220, int(180 * card_v)), width=2)
        hf = dc.mono(20, b=True)
        dc.tk(cld, "WHALESPOTTER", hf, (*SNOW, int(250 * card_v)), cx0 + 28, cy0 + 22, 0.10)
        sf = dc.mono(15, m=True)
        dc.tk(cld, "AI THERMAL DETECTION: MATSON ALASKA FLEET", sf, (*FAINT, int(220 * card_v)), cx0 + 28, cy0 + 58, 0.03)
        dc.logw(cx0 + 28, cy0 + 22, dc.tw("WHALESPOTTER", hf, 0.10), hf.size, SNOW, card_v, card_v >= 0.6, "hud")
        rangev = E.out_cubic(E.seg(f, fseg0 + 60, fseg0 + 100))
        if rangev > 0.02:
            rf = dc.mono(30, b=True)
            dc.tk(cld, "~3 NM", rf, (*GOLD, int(250 * rangev)), cx0 + 28, cy0 + 110, 0.04)
            lf2 = dc.mono(14, b=True)
            dc.tk(cld, "COMPANY CLAIM: DETECTION RANGE", lf2, (*FAINT, int(220 * rangev)), cx0 + 28, cy0 + 152, 0.03)
            dc.logw(cx0 + 28, cy0 + 110, dc.tw("~3 NM", rf, 0.04), rf.size, GOLD, rangev, rangev >= 0.6, "hud")
        perfv = E.out_cubic(E.seg(f, fseg0 + 130, fseg0 + 170))
        if perfv > 0.02:
            pf = dc.mono(30, b=True)
            dc.tk(cld, ">90%", pf, (*COPPER, int(250 * perfv)), cx0 + 420, cy0 + 110, 0.04)
            lf3 = dc.mono(14, b=True)
            dc.tk(cld, "CEO CLAIM: IN TIME TO TURN", lf3, (*FAINT, int(220 * perfv)), cx0 + 420, cy0 + 152, 0.03)
            dc.logw(cx0 + 420, cy0 + 110, dc.tw(">90%", pf, 0.04), pf.size, COPPER, perfv, perfv >= 0.6, "hud")
        img = Image.alpha_composite(img, clay)
    return img


def scene_split(f, f0):
    """Shot 5: the literal diptych -- instrumented (thermal) half vs blind (dark) half."""
    fseg0 = SHOTS_F[4][1]
    left = Image.fromarray(np.clip(_grad(THERMAL_COOL, (4, 8, 18)), 0, 255).astype(np.uint8)).convert("RGBA")
    bx, by = W * 0.27, H * 0.42
    hold = min(1.0, (f - f0) / 20.0)
    left = Image.alpha_composite(left, thermal_blob_layer(bx, by, 46, hold))
    klay, kld = NL()
    bracket(kld, bx, by, 60, int(230 * hold))
    line_v = E.out_cubic(E.seg(f, fseg0 + 300, fseg0 + 340))
    if line_v > 0.02:
        ly = H * 0.62
        kld.line([(60, ly), (W * 0.5 - 40, ly)], fill=(*GOLD, int(190 * line_v)), width=3)
        lf = dc.mono(15, b=True)
        # the AI's honest LIMIT: it flags heat but has no authority to steer the ship. Worded so it
        # reads as the SYSTEM'S limit, never as "a ship detected the whale and chose not to turn"
        # (which would imply unsourced negligence). This sits on the AI/thermal half.
        dc.tk(kld, "AI DETECTS, CANNOT STEER", lf, (*FAINT, int(220 * line_v)), 60, int(ly) + 12, 0.06)
        dc.logw(60, int(ly) + 12, dc.tw("AI DETECTS, CANNOT STEER", lf, 0.06), lf.size, FAINT, line_v, line_v >= 0.6, "hud")
    left = Image.alpha_composite(left, klay)

    right = Image.fromarray(np.clip(_grad((36, 38, 44), (10, 10, 14)), 0, 255).astype(np.uint8)).convert("RGBA")
    right = draw_ship(right, W * 0.76, H * 0.62, 1.05, kind="cruise")

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    canvas.paste(left.crop((0, 0, W // 2, H)), (0, 0))
    canvas.paste(right.crop((W // 2, 0, W, H)), (W // 2, 0))
    slay, sld = NL()
    sld.line([(W // 2, 0), (W // 2, H)], fill=(*SNOW, 130), width=2)
    canvas = Image.alpha_composite(canvas, slay)

    # caption card on the blind (right) half, then the "absence" beat: a literal empty bracket void
    capv = E.out_cubic(E.seg(f, fseg0 + 260, fseg0 + 300))
    if capv > 0.02 and f < fseg0 + 320:
        clay, cld = NL()
        vf = dc.mono(16, b=True)
        cx0, cy0 = W // 2 + 60, H * 0.30
        cld.rounded_rectangle([cx0 - 20, cy0 - 20, cx0 + 420, cy0 + 90], 12, fill=(0, 0, 0, int(190 * capv)))
        dc.tk(cld, "NO EVIDENCE THIS WAS", vf, (*SNOW, int(240 * capv)), cx0, cy0, 0.02)
        dc.tk(cld, "OFFERED OR DECLINED", vf, (*SNOW, int(240 * capv)), cx0, cy0 + 30, 0.02)
        dc.logw(cx0, cy0, dc.tw("NO EVIDENCE THIS WAS", vf, 0.02), vf.size, SNOW, capv, capv >= 0.6, "caption")
        canvas = Image.alpha_composite(canvas, clay)
    voidv = E.out_cubic(E.seg(f, fseg0 + 320, fseg0 + 350))
    if voidv > 0.02:
        vlay, vld = NL()
        vx, vy = W // 2 + 240, H * 0.34
        bracket(vld, vx, vy, 55, int(170 * voidv), col=MERCURY)
        canvas = Image.alpha_composite(canvas, vlay)
    return canvas


def scene_reckoning(f, f0):
    """Shot 6: pull out to a wide aerial -- both wakes crossing the same water, side by side at
    last, with visible open water between the hulls (not a fused silhouette). A slow continuous
    zoom runs the ENTIRE shot (not just its first 4s) so the back half never reads as a static
    hold -- the picture keeps moving even while the caption track carries the dialogue."""
    base_arr = _grad((22, 28, 46), (6, 8, 16))
    tex = sea_texture(404, scale=0.0016)
    base_arr += (tex[:, :, None] * 16 - 8)
    img = Image.fromarray(np.clip(base_arr, 0, 255).astype(np.uint8)).convert("RGBA")
    img = stars(img, 7, 60, (0, 0, W, int(H * 0.3)))
    d = ImageDraw.Draw(img, "RGBA")
    shot_len = SHOTS_F[5][2] - SHOTS_F[5][1]
    cx1, cx2 = W * 0.20, W * 0.80
    cy = H * 0.52
    s1, s2 = 0.5, 0.56
    img = draw_ship(img, cx1, cy, s1, kind="cargo")
    img = draw_ship(img, cx2, cy, s2, kind="cruise")
    d = ImageDraw.Draw(img, "RGBA")
    wv = E.out_cubic(E.seg(f, f0 + 40, f0 + 100))
    if wv > 0.02:
        wlay, wld = NL()
        for cxw, sgn in [(cx1, -1), (cx2, 1)]:
            for i in range(4):
                yy = cy + 10 + i * 14
                x0, x1 = cxw + sgn * 20, cxw + sgn * (20 + 70 - i * 11)
                wld.line([(x0, yy), (x1, yy)], fill=(*SNOW, int((150 - i * 26) * wv)), width=3)
        # the seam's own line, now carried forward as the meeting-line between the two wakes,
        # spanning the OPEN WATER between the two hulls so the gap itself reads as deliberate
        wld.line([(cx1 + 60, cy + 34), (cx2 - 60, cy + 34)], fill=(*GOLD, int(80 * wv)), width=2)
        img = Image.alpha_composite(img, wlay)
        img = Image.alpha_composite(img, thermal_blob_layer(cx1, cy - 20, 16, wv * 0.6))
        d = ImageDraw.Draw(img, "RGBA")
    # agency returns to a person: a small standing HUMAN SILHOUETTE (head + shoulders + torso) at
    # a console below the two ships, backlit by a warm console glow. A whole figure reads far more
    # legibly at phone scale than a tiny hand did, and carries the same "someone still has to act"
    # meaning. A thin sightline connects the figure to the instrumented ship's heat-lock.
    figv = E.out_cubic(E.seg(f, SHOTS_F[5][1] + 150, SHOTS_F[5][1] + 190))
    if figv > 0.02:
        flay, fld = NL()
        fx0, fy0 = W * 0.5, H * 0.78          # feet baseline
        fig_col = (24, 26, 34)
        # warm console glow behind the figure
        for gr, ga in [(120, 26), (78, 40), (46, 64)]:
            fld.ellipse([fx0 - gr, fy0 - 150 - gr * 0.5, fx0 + gr, fy0 - 150 + gr * 0.5],
                        fill=(232, 200, 150, int(ga * figv)))
        # a sightline from the figure up to the instrumented ship's heat-lock (left)
        fld.line([(fx0, fy0 - 150), (cx1, cy - 20)], fill=(*GOLD, int(70 * figv)), width=2)
        # torso (tapered), shoulders, head
        fld.polygon([(fx0 - 26, fy0), (fx0 + 26, fy0), (fx0 + 18, fy0 - 92), (fx0 - 18, fy0 - 92)],
                    fill=(*fig_col, int(240 * figv)))
        fld.ellipse([fx0 - 34, fy0 - 104, fx0 + 34, fy0 - 78], fill=(*fig_col, int(240 * figv)))   # shoulders
        fld.ellipse([fx0 - 17, fy0 - 150, fx0 + 17, fy0 - 108], fill=(*fig_col, int(245 * figv)))  # head
        img = Image.alpha_composite(img, flay)
        # rim light on the figure's lit (left) edge
        img = rim_edge([(fx0 - 17, fy0 - 130), (fx0 - 24, fy0 - 90), (fx0 - 24, fy0 - 6)],
                       (240, 214, 176), width=2, alpha=int(150 * figv), blur=1.2, img=img)
        d = ImageDraw.Draw(img, "RGBA")
    # a second beat: the thermal watch briefly flares (still watching, mid-shot) -- fills the back half
    flare_p = E.seg(f, f0 + 230, f0 + 260)
    flare_fall = 1.0 - E.seg(f, f0 + 260, f0 + 300)
    flare = min(flare_p, flare_fall) if flare_p > 0 else 0.0
    if flare > 0.02:
        img = Image.alpha_composite(img, thermal_blob_layer(cx1, cy - 30, 30, flare))
        d = ImageDraw.Draw(img, "RGBA")
    # an early beacon beat -- bridges the gap right after the pull-out settles, before the wake fully lands
    beacon0_p = E.seg(f, f0 + 80, f0 + 88) * (1.0 - E.seg(f, f0 + 88, f0 + 106))
    img = full_frame_flash(img, max(0.0, beacon0_p), peak=0.13)
    d = ImageDraw.Draw(img, "RGBA")
    # a full-frame beat mid-gap: a beacon-like flash sweeps the water (a lighthouse or a passing
    # search beam) -- a single unambiguous whole-frame event to bridge the back half of the shot
    beacon_p = E.seg(f, f0 + 200, f0 + 208) * (1.0 - E.seg(f, f0 + 208, f0 + 226))
    img = full_frame_flash(img, max(0.0, beacon_p), peak=0.14)
    d = ImageDraw.Draw(img, "RGBA")
    beacon2_p = E.seg(f, f0 + 355, f0 + 363) * (1.0 - E.seg(f, f0 + 363, f0 + 381))
    img = full_frame_flash(img, max(0.0, beacon2_p), peak=0.12)
    d = ImageDraw.Draw(img, "RGBA")
    # the thesis card -- pays off the VO's last line as an on-screen graphic, staged in bands
    thv = E.out_cubic(E.seg(f, f0 + 305, f0 + 345))
    if thv > 0.02:
        tlay, tld = NL()
        tf = dc.fr(40, 780)
        s1_ = "TWO SHIPS."; s2_ = "ONE SEES THE DARK."
        w1 = dc.tw(s1_, tf, 0.02); w2 = dc.tw(s2_, tf, 0.02)
        ty = int(H * 0.58)
        dc.tk(tld, s1_, tf, (*SNOW, int(240 * thv)), (W - w1) // 2, ty, 0.02)
        dc.tk(tld, s2_, tf, (*GOLD, int(230 * thv)), (W - w2) // 2, ty + 52, 0.02)
        img = Image.alpha_composite(img, tlay)
        d = ImageDraw.Draw(img, "RGBA")
        dc.logw((W - w1) // 2, ty, w1, tf.size, SNOW, thv, thv >= 0.6, "caption")
    # a slow continuous zoom runs the WHOLE shot (not just the opening pull) so the back half,
    # where the caption track alone used to carry all the motion, still has the camera moving
    zoom_prog = E.in_out_sine((f - f0) / max(1, shot_len - 1))
    img = dc.reframe(img.convert("RGB"), 0.5, 0.56, 1.0 - 0.11 * zoom_prog).convert("RGBA")
    return img


def scene_signoff(f, f0):
    base_arr = _grad((8, 10, 18), (3, 4, 7))
    img = Image.fromarray(np.clip(base_arr, 0, 255).astype(np.uint8)).convert("RGBA")
    img = stars(img, 9, 40, (0, 0, W, H))
    return img


SCENES = [scene_arrival, scene_whale_detail, scene_open_water, scene_whalespotter_hud, scene_split, scene_reckoning, scene_signoff]


def shot_at(f):
    for i, (sid, a, b, fr_) in enumerate(SHOTS_F):
        if a <= f < b or (i == len(SHOTS_F) - 1 and f >= a):
            return i, a, b
    return len(SHOTS_F) - 1, SHOTS_F[-1][1], SHOTS_F[-1][2]


def render_scene(f):
    """Dispatch to the active shot's scene fn, blending across cuts with a per-cut transition."""
    i, a, b = shot_at(f)
    cur = SCENES[i](f, a)
    if i > 0:
        prev_a = SHOTS_F[i - 1][1]
        rel = f - a
        if rel < TRANS_F:
            prevf = SCENES[i - 1](a - 1, prev_a)
            tt = rel / TRANS_F
            if i == 1:  # focus-pull: ship -> whale, same tableau
                cur = dc.focus_pull(prevf.convert("RGB"), cur.convert("RGB"), tt, sigma=6.0).convert("RGBA")
            elif i == 2:  # whip-pan: harbor -> open water
                cur = dc.whip(prevf.convert("RGB"), cur.convert("RGB"), tt).convert("RGBA")
            elif i == 3:  # fui-boot: HUD assembles in over the open-water frame
                cur = Image.blend(prevf.convert("RGB"), cur.convert("RGB"), E.out_cubic(tt)).convert("RGBA")
            elif i == 4:  # carried-element: the bracket/blob survives into the split
                cur = Image.blend(prevf.convert("RGB"), cur.convert("RGB"), E.in_out_sine(tt)).convert("RGBA")
            elif i == 5:  # pull-out reveal
                cur = dc.xfade(prevf.convert("RGB"), cur.convert("RGB"), E.out_cubic(tt)).convert("RGBA")
            elif i == 6:  # crossfade to sign-off
                cur = dc.xfade(prevf.convert("RGB"), cur.convert("RGB"), E.in_out_sine(tt)).convert("RGBA")
    return cur


def render_frame(f):
    scene = render_scene(f).convert("RGB")
    # slow push-in on the whole composited frame (motion_vector=push-in-only, the board's macro feel)
    prog = E.in_out_sine(min(1.0, f / (NF - 1)))
    sc = 1.0 + 0.05 * prog
    cw, ch = int(W / sc), int(H / sc)
    x0, y0 = (W - cw) // 2, int((H - ch) * 0.46)
    scene = scene.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.LANCZOS)

    out_arr = dc.finish(np.asarray(scene), 4000 + f)
    out = Image.fromarray(out_arr).filter(ImageFilter.UnsharpMask(radius=2.2, percent=90, threshold=2)).convert("RGBA")

    dc.set_frame_bg(out, f)
    d = ImageDraw.Draw(out, "RGBA")

    # eyebrow wordmark (brand throughline every frame) -- faded in briefly at open, own layer
    eb = E.out_cubic(E.seg(f, 6, 30))
    if eb > 0.02:
        elay, eld = NL()
        dc.tk(eld, "ALASKA.AI", dc.mono(18, True), (255, 222, 120, int(220 * eb)), 96, 70, 0.14)
        dc.tk(eld, "/  DISPATCH", dc.mono(18), (214, 230, 245, int(150 * eb)), 96 + dc.tw("ALASKA.AI", dc.mono(18, True), 0.14) + 16, 70, 0.14)
        out = Image.alpha_composite(out, elay)
        d = ImageDraw.Draw(out, "RGBA")
    loc = E.out_cubic(E.seg(f, 20, 54))
    if loc > 0.02 and f < SHOTS_F[6][1]:
        llay, lld = NL()
        dc.tk(lld, "SEWARD, ALASKA", dc.mono(17, m=True), (214, 230, 245, int(180 * loc)), 96, 104, 0.12)
        out = Image.alpha_composite(out, llay)
        d = ImageDraw.Draw(out, "RGBA")

    dc.caption(out, f)
    dc.outro_card(out, f)
    if f >= int((SPEECH_END + 1.4) * FPS):
        sv = E.out_cubic(E.seg(f, int((SPEECH_END + 1.4) * FPS), int((SPEECH_END + 1.4) * FPS) + 40))
        if sv > 0.02:
            slay, sld = NL()
            cf = dc.mono(16, m=True)
            s = "SOURCES: WHALESPOTTER/MATSON, ADN, ALASKA PUBLIC MEDIA"
            w = dc.tw(s, cf, 0.02)
            dc.tk(sld, s, cf, (200, 214, 230, int(210 * sv)), (W - w) // 2, 1660, 0.02)
            out = Image.alpha_composite(out, slay)

    # opening fade-in (short, so the lit-ship hook is not hidden behind black) + closing fade-out
    fin = E.seg(f, 0, 7)
    if fin < 1:
        out.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - E.out_cubic(fin))))))
    outf = E.seg(f, NF - 55, NF - 1)
    if outf > 0:
        out.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(248 * E.in_out_sine(outf)))))

    dc.flush_textlog(f)
    return out.convert("RGB")


def write_shots_manifest():
    shots = []
    for (sid, a, b, framing) in SHOTS_F:
        shots.append({"id": sid, "start": a, "end": b, "framing": framing})
    dc.write_shots(shots, NF, os.path.join(HERE, "shots.json"))


def main():
    a = sys.argv[1:]
    write_shots_manifest()
    if a and a[0] == "test":
        td = os.path.join(HERE, "test_ws")
        os.makedirs(td, exist_ok=True)
        for f in [int(x) for x in a[1:]]:
            render_frame(f).save(os.path.join(td, f"t_{f:05d}.png"))
            print("test", f, file=sys.stderr)
        return
    s, e = int(a[0]), int(a[1])
    for f in range(s, e):
        render_frame(f).save(os.path.join(FR, f"frame_{f:05d}.png"))
        if f % 50 == 0:
            print("frame", f, file=sys.stderr)
    print("done", file=sys.stderr)


if __name__ == "__main__":
    main()
