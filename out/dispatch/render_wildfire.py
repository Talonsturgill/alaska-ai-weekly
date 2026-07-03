"""
Alaska.Ai Dispatch -- "The Ten Minute Clock" -- 9:16 (1080x1920), 60s/1800f.
STORY: the XPRIZE Wildfire autonomous-drone finals in Nenana, Alaska. AI-powered sensor towers
and drone swarms (Anduril, Dryad, AURA Foresight) detect and suppress a controlled wildfire
ignition within 10 minutes, no human in the loop, on a 1,000 km2 UAF/ACUASI test range.
ARCHETYPE: field-HUD/instrument. A machine's-eye view: a dark boreal night, a detection grid
booting on, a converging drone swarm, a countdown, then a pulled-back honest-caveat split
between the crisp proven box and the unproven fog beyond it.
PALETTE: near-black spruce night, white-hot ignition, phosphor cyan-violet detection grid,
ember amber accents. Built FRESH to out/dispatch/storyboard.json -- see storyboard.md.

  test:  python render_wildfire.py test 0 300 700 950 1250 1600 1799
  range: python render_wildfire.py 0 1800
"""
import sys, os, math, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import easing as E
import craft
import dispatch_core as dc

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, "frames_v3")
os.makedirs(FR, exist_ok=True)
W, H = 1080, 1920
FPS = 30
NF = 1800

# ---------------- palette (deliberately NOT blue; night-canopy + phosphor detection) ----------------
BG0 = (6, 11, 10)          # deepest canopy black
BG1 = (11, 22, 18)         # canopy dark
BG2 = (20, 40, 32)         # canopy mid
IGNITE_HI = (255, 250, 232)
IGNITE_CORE = (255, 205, 120)
EMBER = (255, 150, 70)
CYAN = (110, 235, 232)
VIOLET = (162, 132, 255)
AMBER = (255, 178, 84)
SNOW = (244, 250, 255)
GOLD = (255, 199, 44)
FOG = (150, 160, 168)

RNG_SEED = 20260703

# ---------------- shot boundaries (frames, from storyboard.json shots[]) ----------------
SHOTS = [
    {"id": 1, "s": 0,    "e": 288,  "framing": "wide-establish"},
    {"id": 2, "s": 288,  "e": 672,  "framing": "data-panel"},
    {"id": 3, "s": 672,  "e": 900,  "framing": "subject-portrait"},
    {"id": 4, "s": 900,  "e": 1173, "framing": "macro-closeup"},
    {"id": 5, "s": 1173, "e": 1554, "framing": "two-up"},
    {"id": 6, "s": 1554, "e": 1800, "framing": "wide-establish"},
]
XFADE_F = 10   # frames blended across each shot boundary

def shot_at(f):
    for sh in SHOTS:
        if sh["s"] <= f < sh["e"]:
            return sh
    return SHOTS[-1]


# ==================================================================================
# ---------------- shared helpers ----------------
def _rng(seed_extra=0):
    return np.random.default_rng(RNG_SEED + seed_extra)


def canopy_layer(seed, scale, dark, mid, alpha_boost=1.0):
    """Procedural boreal canopy texture seen from above/oblique: blobby noise field
    thresholded and colored dark-to-mid green-black, gaussian-blurred for soft canopy shapes."""
    rng = _rng(seed)
    small = rng.standard_normal((H // 6, W // 6)).astype(np.float32)
    small = gaussian_filter(small, scale)
    small = (small - small.min()) / (small.max() - small.min() + 1e-6)
    big = np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.0
    big = np.clip(big * alpha_boost, 0, 1)
    out = np.zeros((H, W, 3), np.float32)
    for c in range(3):
        out[..., c] = dark[c] / 255.0 + (mid[c] / 255.0 - dark[c] / 255.0) * big
    return out


_SCRIM_Y = np.arange(H).astype(np.float32)
# ramps from 0 at ~H*0.60 to full strength by ~H*0.76 (covers the caption text band, y~1430-1600)
_SCRIM = np.clip((_SCRIM_Y - H * 0.60) / (H * 0.16), 0, 1) ** 1.15


def draw_eyebrow(canv, f):
    """Persistent small brand eyebrow, present from frame 0 -- brand throughline, and ensures the
    opening/poster frame is never a flat black card (production standard requirement)."""
    a = 1.0
    d = ImageDraw.Draw(canv)
    fnt = dc.mono(22, b=True)
    s = "ALASKA.AI  ·  FIELD SIGNAL"
    w = dc.tw(s, fnt, 0.14)
    x, y = (W - w) // 2, 96
    dc.tk(d, s, fnt, (*SNOW, int(200 * a)), x, y, 0.14)


def apply_lower_scrim(img, strength=0.82):
    """Darken the lower-third band a scene-independent floor amount so caption text (drawn after
    the grade) always clears the READABILITY contrast floor, even over a bright background (fog,
    a blown highlight). A standard broadcast/caption technique, not a scene element."""
    arr = np.asarray(img.convert("RGB"), np.float32)
    k = (1 - _SCRIM[:, None] * strength)
    arr = arr * k[:, :, None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def vignette(rgb):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    ri = 1 / (1 + (r * 1.15) ** 2) ** 2
    return rgb * (0.78 + 0.22 * ri[..., None])


def glow_disc(canvas_rgba, cx, cy, r, color, strength=1.0):
    """Additive soft glow: a small hard core plus a gaussian-blurred falloff (no banded rings)."""
    cx, cy, r = int(cx), int(cy), max(1, int(r))
    pad = int(r * 6) + 4
    x0, y0 = max(0, cx - pad), max(0, cy - pad)
    x1, y1 = min(W, cx + pad), min(H, cy + pad)
    if x1 <= x0 or y1 <= y0:
        return canvas_rgba
    lw, lh = x1 - x0, y1 - y0
    mask = Image.new("L", (lw, lh), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([cx - x0 - r * 0.5, cy - y0 - r * 0.5, cx - x0 + r * 0.5, cy - y0 + r * 0.5], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(max(1.0, r * 1.1)))
    m = np.asarray(mask, np.float32) / 255.0 * strength
    lay = np.zeros((lh, lw, 4), np.float32)
    lay[..., 0] = color[0]
    lay[..., 1] = color[1]
    lay[..., 2] = color[2]
    lay[..., 3] = np.clip(m * 255, 0, 255)
    lay_img = Image.fromarray(lay.astype(np.uint8), "RGBA")
    base = canvas_rgba.copy()
    region = base.crop((x0, y0, x1, y1))
    region = Image.alpha_composite(region, lay_img)
    base.paste(region, (x0, y0))
    return base


def pulse_ring(d, cx, cy, radius, color, alpha, width=3):
    if radius <= 1 or alpha <= 0.01:
        return
    d.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=(*color, int(255 * alpha)), width=width)


def hud_text(d, x, y, s, font, color, alpha, tr=0.0, glow=None):
    fill = (*color, int(255 * max(0, min(1, alpha))))
    if glow:
        for ox, oy in ((0, 0),):
            pass
    dc.tk(d, s, font, fill, x, y, tr)


def wander(f, ax, ay, px, py, phx=0.0, phy=0.0):
    t = f / FPS
    return ax * math.sin(2 * math.pi * t / px + phx), ay * math.sin(2 * math.pi * t / py + phy)


def streak_draw(base_rgba, draw_fn, vx, vy, k=6, fade=0.6):
    """Cheap directional motion-blur: draw_fn(offset_img) K times at receding sub-positions with
    decaying alpha, composited under the sharp final draw. draw_fn takes an ImageDraw and (dx,dy)."""
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for k_i in range(k, 0, -1):
        frac = k_i / k
        a = fade ** (k - k_i)
        sub = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sub)
        draw_fn(sd, -vx * frac, -vy * frac, a)
        lay = Image.alpha_composite(lay, sub)
    return Image.alpha_composite(base_rgba, lay)


# ==================================================================================
# ---------------- SHOT 1 / 6: wide orbital-aerial night landscape ----------------
def scene_landscape(f, ignite_amt, grid_amt, label_amt, status_amt, bookend=False, pullback=0.0):
    bg = canopy_layer(1, 5.0, BG0, BG1, 1.0)
    mid = canopy_layer(2, 2.6, (0, 0, 0), BG2, 0.55)
    m_alpha = np.clip((mid.mean(2) - BG1[1] / 255 * 0.3), 0, 1)[..., None] * 0.5
    rgb = bg * (1 - m_alpha) + mid * m_alpha
    rgb = np.clip(rgb * 255, 0, 255).astype(np.uint8)
    img = Image.fromarray(rgb, "RGB").convert("RGBA")

    dx, dy = wander(f, 6, 4, 9.5, 12.5)
    cx, cy = W * 0.5 + dx, H * 0.62 + dy
    scale = 1.0 - pullback * 0.28

    if ignite_amt > 0.01:
        r = 10 + 46 * min(1.0, ignite_amt)
        img = glow_disc(img, cx, cy, r * 3.4, (*EMBER,), 0.5 * ignite_amt)
        img = glow_disc(img, cx, cy, r, (*IGNITE_HI,), ignite_amt)
        d = ImageDraw.Draw(img)
        core_r = 5 + 5 * ignite_amt
        d.ellipse([cx - core_r, cy - core_r, cx + core_r, cy + core_r], fill=(*IGNITE_HI, int(255 * ignite_amt)))

    if grid_amt > 0.01:
        d = ImageDraw.Draw(img)
        n_rings = 3
        for i in range(n_rings):
            rr = (grid_amt * (260 + i * 90)) % 320
            a = grid_amt * (1 - rr / 320) * 0.8
            pulse_ring(d, cx, cy, 40 + rr, CYAN, a, width=2)
        gstep = 130
        for gx in range(0, W + gstep, gstep):
            a = grid_amt * 0.16
            d.line([(gx, 0), (gx, H)], fill=(*CYAN, int(255 * a)), width=1)
        for gy in range(0, H + gstep, gstep):
            a = grid_amt * 0.16
            d.line([(0, gy), (W, gy)], fill=(*CYAN, int(255 * a)), width=1)

    d = ImageDraw.Draw(img)
    if label_amt > 0.01 and not bookend:
        f1 = dc.mono(30, m=True)
        s = "1,000 km²  ·  NENANA, ALASKA"
        w = dc.tw(s, f1, 0.06)
        x0 = (W - w) // 2
        y0 = int(H * 0.74)
        a = min(1.0, label_amt)
        dc.tk(d, s, f1, (*CYAN, int(235 * a)), x0, y0, 0.06)
        dc.logw(x0, y0, w, f1.size, CYAN, a, a >= 0.6, "hud")

    if status_amt > 0.01 and not bookend:
        f2 = dc.mono(26, b=True)
        s = "HUMAN: NONE"
        w = dc.tw(s, f2, 0.10)
        x0 = (W - w) // 2
        y0 = int(H * 0.79)
        a = min(1.0, status_amt)
        dc.tk(d, s, f2, (*SNOW, int(230 * a)), x0, y0, 0.10)
        dc.logw(x0, y0, w, f2.size, SNOW, a, a >= 0.6, "hud")

    if scale != 1.0:
        cw, ch = int(W * scale), int(H * scale)
        x0 = (W - cw) // 2
        y0 = (H - ch) // 2
        img = img.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.LANCZOS)
    return img.convert("RGB")


# ==================================================================================
# ---------------- SHOT 2: data panel / sensor network ----------------
NODES = None

def _nodes():
    global NODES
    if NODES is None:
        rng = _rng(3)
        pts = []
        for _ in range(14):
            ang = rng.uniform(0, 2 * math.pi)
            rad = rng.uniform(0.18, 0.42)
            pts.append((0.5 + rad * math.cos(ang) * 0.86, 0.5 + rad * math.sin(ang)))
        NODES = pts
    return NODES


def scene_datapanel(f, local_t, dur):
    rgb = np.zeros((H, W, 3), np.float32)
    rgb[..., 0] = BG0[0] / 255
    rgb[..., 1] = BG0[1] / 255
    rgb[..., 2] = BG0[2] / 255
    img = Image.fromarray((rgb * 255).astype(np.uint8), "RGB").convert("RGBA")
    d = ImageDraw.Draw(img)

    box_x0, box_y0, box_x1, box_y1 = 120, 560, 960, 1400
    boot = E.out_cubic(E.seg(local_t, 0.0, 1.1))
    bx0 = box_x0 + (1 - boot) * 60
    bx1 = box_x1 - (1 - boot) * 60
    by0 = box_y0 + (1 - boot) * 60
    by1 = box_y1 - (1 - boot) * 60
    a_box = boot
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=18, outline=(*CYAN, int(200 * a_box)), width=2)
    for i in range(1, 4):
        yy = by0 + (by1 - by0) * i / 4
        d.line([(bx0, yy), (bx1, yy)], fill=(*CYAN, int(28 * a_box)), width=1)
        xx = bx0 + (bx1 - bx0) * i / 4
        d.line([(xx, by0), (xx, by1)], fill=(*CYAN, int(28 * a_box)), width=1)

    cxN, cyN = (bx0 + bx1) / 2, (by0 + by1) / 2
    pts = _nodes()
    reveal_speed = 10.0
    for i, (nx, ny) in enumerate(pts):
        px = bx0 + (bx1 - bx0) * nx
        py = by0 + (by1 - by0) * ny
        node_on = E.out_cubic(E.seg(local_t, 0.15 + i * 0.05, 0.15 + i * 0.05 + 0.35))
        if node_on <= 0.01:
            continue
        d.ellipse([px - 4, py - 4, px + 4, py + 4], fill=(*CYAN, int(255 * node_on)))
        conv = E.in_out_cubic(E.seg(local_t, 1.1, 2.6))
        if conv > 0.01:
            ex = px + (cxN - px) * 0
            d.line([(px, py), (cxN, cyN)], fill=(*VIOLET, int(120 * conv * node_on)), width=1)

    ignite_amt = 1.0
    r = 7 + 3 * math.sin(local_t * 6)
    img = glow_disc(img, cxN, cyN, 28, (*EMBER,), 0.55)
    d2 = ImageDraw.Draw(img)
    d2.ellipse([cxN - r, cyN - r, cxN + r, cyN + r], fill=(*IGNITE_HI, 255))

    # periodic radar-style scan sweep across the box -- keeps the shot alive across its full duration
    # (a new visual event every ~2.2s), not just the boot-up beat at the top of the shot
    sweep_period = 2.2
    sweep_phase = (local_t % sweep_period) / sweep_period
    if local_t > 1.3:
        sweep_x = bx0 + (bx1 - bx0) * sweep_phase
        d2.line([(sweep_x, by0), (sweep_x, by1)], fill=(*CYAN, 130), width=3)
        d2 = ImageDraw.Draw(img)
        for i, (nx, ny) in enumerate(pts):
            px = bx0 + (bx1 - bx0) * nx
            if abs(nx - sweep_phase) < 0.04:
                py = by0 + (by1 - by0) * ny
                img = glow_disc(img, px, py, 20, (*CYAN,), 0.6)
                d2 = ImageDraw.Draw(img)
        # a bright detection-ping FLASH across the whole box each sweep cycle -- a real full-frame
        # event (not just a thin moving line), so the shot never reads as "dead" for more than ~2.2s
        pulse_t = local_t % sweep_period
        pulse_env = math.exp(-pulse_t / 0.10)
        if pulse_env > 0.03:
            flash = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            fd = ImageDraw.Draw(flash)
            fd.rounded_rectangle([bx0, by0, bx1, by1], radius=18, fill=(*CYAN, int(70 * pulse_env)))
            img = Image.alpha_composite(img, flash)
            d2 = ImageDraw.Draw(img)

    tag_a = E.out_cubic(E.seg(local_t, 0.4, 1.1))
    if tag_a > 0.01:
        f1 = dc.mono(24, b=True)
        s = "ACUASI · UAF GEOPHYSICAL INSTITUTE"
        w = dc.tw(s, f1, 0.04)
        x0 = (W - w) // 2
        y0 = 220
        dc.tk(d, s, f1, (*SNOW, int(230 * tag_a)), x0, y0, 0.04)
        dc.logw(x0, y0, w, f1.size, SNOW, tag_a, tag_a >= 0.6, "hud")
        f2 = dc.mono(20)
        s2 = "SENSOR NETWORK · TRIANGULATING"
        w2 = dc.tw(s2, f2, 0.08)
        dc.tk(d, s2, f2, (*CYAN, int(180 * tag_a)), (W - w2) // 2, 262, 0.08)

    return img.convert("RGB")


# ==================================================================================
# ---------------- SHOT 3: subject portrait / drone swarm ----------------
def draw_ghost_x(d, cx, cy, s, alpha, color=SNOW):
    pts = [(cx, cy - s), (cx + s * 0.85, cy), (cx, cy + s), (cx - s * 0.85, cy)]
    d.polygon(pts, outline=(*color, int(255 * alpha)), width=2)
    d.line([(cx - s, cy - s), (cx + s, cy + s)], fill=(*color, int(160 * alpha)), width=1)
    d.line([(cx - s, cy + s), (cx + s, cy - s)], fill=(*color, int(160 * alpha)), width=1)


def draw_tower(d, cx, base_y, h, alpha, color=SNOW):
    d.line([(cx, base_y), (cx, base_y - h)], fill=(*color, int(220 * alpha)), width=3)
    d.line([(cx - 16, base_y - h), (cx + 16, base_y - h)], fill=(*color, int(220 * alpha)), width=2)
    for k in range(3):
        rr = 6 + k * 10
        d.arc([cx - rr, base_y - h - rr, cx + rr, base_y - h + rr], 300, 240, fill=(*CYAN, int(120 * alpha)), width=1)


def draw_web_node(d, cx, cy, r, alpha, color=AMBER):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*color, int(230 * alpha)), width=2)
    for k in range(6):
        ang = k * math.pi / 3
        d.line([(cx, cy), (cx + math.cos(ang) * r * 2.2, cy + math.sin(ang) * r * 2.2)],
               fill=(*color, int(90 * alpha)), width=1)


def draw_swarm_tri(d, cx, cy, s, alpha, color=VIOLET):
    d.polygon([(cx, cy - s), (cx + s * 0.9, cy + s * 0.7), (cx - s * 0.9, cy + s * 0.7)],
              outline=(*color, int(255 * alpha)), width=2)


def draw_treeline(d, base_y, seed, color, alpha, jitter=42):
    rng = np.random.default_rng(seed)
    n = 26
    xs = np.linspace(-20, W + 20, n)
    ys = base_y + rng.uniform(-jitter, jitter * 0.4, n) - np.abs(rng.standard_normal(n)) * jitter * 0.6
    pts = [(W // 2 * 0 + xs[i], ys[i]) for i in range(n)]
    poly = [(xs[0], H)] + list(zip(xs, ys)) + [(xs[-1], H)]
    d.polygon(poly, fill=(*color, int(255 * alpha)))


def _formation(n, spread_x, spread_y, seed):
    """A loose V/scatter formation of n points around origin, with a depth factor per point
    (0=far/small/dim, 1=near/big/bright) so a group of icons reads as a SWARM with parallax,
    not one representative glyph standing in for the whole team."""
    rng = np.random.default_rng(seed)
    pts = []
    for i in range(n):
        row = i % 4
        col = i // 4
        jx = rng.uniform(-18, 18)
        jy = rng.uniform(-14, 14)
        px = (row - 1.5) * spread_x * (0.55 + 0.15 * col) + jx
        py = col * spread_y * 0.62 + row * 6 + jy
        depth = float(np.clip(1.0 - col * 0.34 + rng.uniform(-0.08, 0.08), 0.28, 1.0))
        pts.append((px, py, depth))
    return pts


def scene_swarm(f, local_t, dur):
    bg = canopy_layer(4, 3.4, BG0, (40, 58, 44), 1.0)
    fg = canopy_layer(5, 1.6, (0, 0, 0), BG2, 0.6)
    rgb = bg * 0.75 + fg * 0.35
    # a warm, smoke-lit horizon wash low in frame -- brightens + warms this shot so it reads as a
    # visibly different WORLD from the near-pure-black instrument panels either side of it
    yy = np.mgrid[0:H, 0:W][0].astype(np.float32)
    horizon = np.clip(1.0 - np.abs(yy - H * 0.80) / (H * 0.34), 0, 1) ** 1.6
    warm = np.array([120, 74, 40], np.float32) / 255.0
    rgb = rgb * (1 - horizon[..., None] * 0.5) + warm[None, None, :] * (horizon[..., None] * 0.5)
    img = Image.fromarray(np.clip(rgb * 255, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    d = ImageDraw.Draw(img)
    draw_treeline(d, H * 0.80, 11, (10, 16, 12), 1.0, jitter=70)
    draw_treeline(d, H * 0.87, 12, (5, 9, 7), 1.0, jitter=50)

    target_x, target_y = W * 0.52, H * 0.5

    phase_a = E.out_cubic(E.seg(local_t, 0.0, 2.0))  # anduril
    phase_b = E.out_cubic(E.seg(local_t, 2.0, 4.4))  # dryad
    phase_c = E.out_cubic(E.seg(local_t, 4.4, 6.8))  # aura
    conv = E.in_out_cubic(E.seg(local_t, 0.0, dur))

    if phase_a > 0.01:
        tx = target_x - 260 + 260 * conv
        ty = 420 - 60 * conv
        img = glow_disc(img, W * 0.22, H * 0.42 - 260, 60, (*CYAN,), 0.4 * phase_a)
        d = ImageDraw.Draw(img)
        draw_tower(d, W * 0.22, H * 0.58, 260, phase_a)

        # a FORMATION of Ghost-X units (not a single icon) -- far units smaller/dimmer/softer
        formation = _formation(6, 100, 90, seed=41)
        for (ox, oy, depth) in sorted(formation, key=lambda p: p[2]):
            sz = 14 + 26 * depth
            k = max(2, int(4 + 4 * depth))
            fade = 0.5 + 0.1 * depth

            def dfn(sd, sox, soy, al, _ox=ox, _oy=oy, _depth=depth, _sz=sz):
                draw_ghost_x(sd, tx + _ox + sox, ty + _oy + soy, _sz, al * phase_a * (0.55 + 0.45 * _depth))
            img = streak_draw(img, dfn, 30 * depth + 6, 4 * depth + 1, k=k, fade=fade)
            d = ImageDraw.Draw(img)
        d.ellipse([tx - 5, ty - 5, tx + 5, ty + 5], fill=(*SNOW, int(255 * phase_a)))
        f1 = dc.mono(26, b=True)
        s = "ANDURIL"
        w = dc.tw(s, f1, 0.10)
        dc.tk(d, s, f1, (*SNOW, int(235 * phase_a)), int(W * 0.22 - w / 2), int(H * 0.30), 0.10)
        s2 = "LATTICE AI · SENTRY + GHOST-X"
        f2 = dc.mono(18)
        w2 = dc.tw(s2, f2, 0.05)
        dc.tk(d, s2, f2, (*CYAN, int(190 * phase_a)), int(W * 0.22 - w2 / 2), int(H * 0.335), 0.05)

    if phase_b > 0.01:
        node_pts = [(-140, -40), (10, 55), (155, -20), (-55, 65), (95, 90), (-10, -75), (170, 55)]
        cxb, cyb = W * 0.30, H * 0.60
        d = ImageDraw.Draw(img)
        for i in range(len(node_pts) - 1):
            ax, ay = node_pts[i]
            bx, by = node_pts[(i + 1) % len(node_pts)]
            d.line([(cxb + ax, cyb + ay), (cxb + bx, cyb + by)], fill=(*AMBER, int(70 * phase_b)), width=1)
        for i, (ox, oy) in enumerate(node_pts):
            img = glow_disc(img, cxb + ox, cyb + oy, 18, (*AMBER,), 0.32 * phase_b)
        d = ImageDraw.Draw(img)
        for i, (ox, oy) in enumerate(node_pts):
            draw_web_node(d, cxb + ox, cyb + oy, 12 + 4 * (i % 3 == 0), phase_b)
        f1 = dc.mono(26, b=True)
        s = "DRYAD"
        w = dc.tw(s, f1, 0.10)
        dc.tk(d, s, f1, (*SNOW, int(235 * phase_b)), int(W * 0.30 - w / 2), int(H * 0.665), 0.10)
        s2 = "SILVANET · SOLAR SENSOR WEB"
        f2 = dc.mono(18)
        w2 = dc.tw(s2, f2, 0.05)
        dc.tk(d, s2, f2, (*AMBER, int(190 * phase_b)), int(W * 0.30 - w2 / 2), int(H * 0.70), 0.05)

    if phase_c > 0.01:
        tx = target_x + 230 - 230 * conv
        ty = H * 0.30 + 40 * conv

        img = glow_disc(img, tx, ty, 55, (*VIOLET,), 0.35 * phase_c)
        d = ImageDraw.Draw(img)

        swarm_pts = _formation(9, 70, 60, seed=77)

        def dfn2(sd, sox, soy, al):
            for (ddx, ddy, depth) in swarm_pts:
                draw_swarm_tri(sd, tx + ddx + sox, ty + ddy + soy, 10 + 18 * depth,
                                al * phase_c * (0.5 + 0.5 * depth))
        img = streak_draw(img, dfn2, 30, -10, k=7, fade=0.55)
        d = ImageDraw.Draw(img)
        f1 = dc.mono(26, b=True)
        s = "AURA FORESIGHT"
        w = dc.tw(s, f1, 0.06)
        dc.tk(d, s, f1, (*SNOW, int(235 * phase_c)), int(W * 0.72 - w / 2), int(H * 0.26), 0.06)
        s2 = "DETECT · VERIFY · ACT"
        f2 = dc.mono(18)
        w2 = dc.tw(s2, f2, 0.08)
        dc.tk(d, s2, f2, (*VIOLET, int(190 * phase_c)), int(W * 0.72 - w2 / 2), int(H * 0.295), 0.08)

    glow_a = min(1.0, conv * 1.2)
    img = glow_disc(img, target_x, target_y, 20 + 10 * glow_a, (*EMBER,), 0.5)
    d = ImageDraw.Draw(img)
    d.ellipse([target_x - 6, target_y - 6, target_x + 6, target_y + 6], fill=(*IGNITE_HI, 255))

    return img.convert("RGB")


def draw_lock_brackets(d, cx, cy, size, gap, color, alpha, width=3, rot=0.0):
    """A target-lock reticle (4 corner brackets), NOT a concentric ring -- a distinct geometric
    language from the ignition pulse (shot 1/6) and the detection sweep (shot 2), so the
    countdown reads as its own visual idea (tightening lock) rather than a recycled ring."""
    a8 = int(255 * alpha)
    for sx in (-1, 1):
        for sy in (-1, 1):
            bx, by = cx + sx * gap, cy + sy * gap
            d.line([(bx, by), (bx + sx * size, by)], fill=(*color, a8), width=width)
            d.line([(bx, by), (bx, by + sy * size)], fill=(*color, a8), width=width)


# ==================================================================================
# ---------------- SHOT 4: macro countdown (target-lock reticle, tightens + reddens) ----------------
def scene_countdown(f, local_t, dur):
    bg = canopy_layer(6, 2.2, BG0, (14, 26, 22), 0.3)
    img = Image.fromarray(np.clip(bg * 255, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    cx, cy = W * 0.5, H * 0.44

    prog = min(1.0, local_t / (dur * 0.72))
    remain = max(0.0, 1.0 - prog)
    total_s = remain * 600  # ten minutes, compressed
    mm = int(total_s // 60)
    ss = int(total_s % 60)

    burst_t = E.seg(local_t, dur * 0.66, dur * 0.66 + 0.9)
    contained = local_t >= dur * 0.66 + 0.15

    # urgency escalates as remain -> 0: the lock brackets tighten and shift cyan -> amber -> red,
    # and the pulse rate speeds up (a genuinely tenser countdown, not a static backdrop with a numeral swap)
    urgency = 1.0 - remain
    d = ImageDraw.Draw(img)
    lock_col = tuple(int(CYAN[i] + (EMBER[i] - CYAN[i]) * min(1.0, urgency * 1.3)) for i in range(3))
    pulse_hz = 0.8 + urgency * 2.6
    breathe = 0.5 + 0.5 * math.sin(local_t * pulse_hz * 2 * math.pi)
    base_gap = 150 - urgency * 55
    gap = base_gap + breathe * (10 - urgency * 6)
    if not contained:
        draw_lock_brackets(d, cx, cy, 46, gap, lock_col, 0.55 + 0.25 * breathe, width=3,
                            rot=local_t * 0.3)
        draw_lock_brackets(d, cx, cy, 22, gap * 0.55, lock_col, 0.30 + 0.2 * breathe, width=2)
    else:
        draw_lock_brackets(d, cx, cy, 46, base_gap * 0.55, FOG, 0.35, width=2)

    glow_col = EMBER if not contained else FOG
    ign_r = 16 * (1 - E.out_cubic(burst_t) * 0.85) if contained else 16 + 3 * math.sin(local_t * 10)
    img = glow_disc(img, cx, cy, ign_r * 3.2, (*glow_col,), 0.5)
    d = ImageDraw.Draw(img)
    d.ellipse([cx - ign_r, cy - ign_r, cx + ign_r, cy + ign_r],
              fill=((*SNOW, 235) if contained else (*IGNITE_HI, 255)))

    if burst_t > 0.01 and burst_t < 1.0:
        rng = _rng(9)
        n = 40
        for i in range(n):
            ang = rng.uniform(0, 2 * math.pi)
            dist = E.out_cubic(burst_t) * rng.uniform(40, 140)
            px, py = cx + math.cos(ang) * dist, cy + math.sin(ang) * dist
            a = (1 - E.out_cubic(burst_t)) * 0.7
            rr = 3 + 3 * (1 - E.out_cubic(burst_t))
            d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=(*SNOW, int(255 * a)))

    fbig = dc.mono(120, b=True)
    label = f"{mm:02d}:{ss:02d}" if not contained else "00:00"
    w = dc.tw(label, fbig, 0.02)
    y0 = int(H * 0.60)
    col = CYAN if not contained else AMBER
    dc.tk(d, label, fbig, (*col, 255), (W - w) // 2, y0, 0.02)
    dc.logw((W - w) // 2, y0, w, fbig.size, col, 1.0, True, "hud")

    sub_a = 1.0
    fsub = dc.mono(24, m=True)
    sub = "TIME TO DETECT + SUPPRESS" if not contained else "CONTAINED"
    w2 = dc.tw(sub, fsub, 0.10)
    dc.tk(d, sub, fsub, (*SNOW, 220), (W - w2) // 2, y0 + 150, 0.10)

    if contained:
        prize_a = E.out_cubic(E.seg(local_t, dur * 0.66 + 0.6, dur * 0.66 + 1.3))
        if prize_a > 0.01:
            fpz = dc.mono(24, b=True)
            s = "AUTONOMOUS TRACK PRIZE"
            wpz = dc.tw(s, fpz, 0.08)
            y1 = y0 + 195
            dc.tk(d, s, fpz, (*GOLD, int(210 * prize_a)), (W - wpz) // 2, y1, 0.08)
            f11 = dc.fr(44, 800)
            s11 = "$3.5M"
            w11 = dc.tw(s11, f11)
            y2 = y1 + 34
            dc.tk(d, s11, f11, (*SNOW, int(245 * prize_a)), (W - w11) // 2, y2)
            dc.logw((W - w11) // 2, y2, w11, f11.size, SNOW, prize_a, prize_a >= 0.6, "hud")
            d.ellipse([(W // 2) - w11 // 2 - 34, y2 + 8, (W // 2) - w11 // 2 - 14, y2 + 28],
                      outline=(*GOLD, int(220 * prize_a)), width=2)

    return img.convert("RGB")


# ==================================================================================
# ---------------- SHOT 5: two-worlds split (the honest caveat) ----------------
def scene_split(f, local_t, dur):
    left = canopy_layer(7, 3.0, BG0, BG1, 0.9)
    left_img = Image.fromarray(np.clip(left * 255, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    dl = ImageDraw.Draw(left_img)
    bx0, by0, bx1, by1 = 90, 620, 990, 1280
    a_box = E.out_cubic(E.seg(local_t, 0.0, 1.0))
    dl.rounded_rectangle([bx0, by0, bx1, by1], radius=16, outline=(*CYAN, int(220 * a_box)), width=2)
    for i in range(1, 5):
        yy = by0 + (by1 - by0) * i / 5
        dl.line([(bx0, yy), (bx1, yy)], fill=(*CYAN, int(24 * a_box)), width=1)
    cxN, cyN = (bx0 + bx1) / 2, (by0 + by1) / 2
    left_img = glow_disc(left_img, cxN, cyN, 40, (*FOG,), 0.35)
    dl = ImageDraw.Draw(left_img)
    dl.ellipse([cxN - 5, cyN - 5, cxN + 5, cyN + 5], fill=(*SNOW, 200))
    fnt = dc.mono(20, b=True)
    lbl = "PROVEN · INSIDE THE BOX"
    wlbl = dc.tw(lbl, fnt, 0.06)
    lcx = bx0 + int((bx1 - bx0) * 0.26)
    dc.tk(dl, lbl, fnt, (*CYAN, int(220 * a_box)), lcx - wlbl // 2, by1 + 24, 0.06)

    right = _rng(8)
    fognoise = right.standard_normal((H // 8, W // 8)).astype(np.float32)
    fognoise = gaussian_filter(fognoise, 3.0)
    fognoise = (fognoise - fognoise.min()) / (fognoise.max() - fognoise.min() + 1e-6)
    fog_big = np.asarray(Image.fromarray((fognoise * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255.0
    fog_amt = E.out_cubic(E.seg(local_t, 0.3, 1.4))
    right_rgb = np.zeros((H, W, 3), np.float32)
    for c in range(3):
        right_rgb[..., c] = BG0[c] / 255 * (1 - fog_amt) + (FOG[c] / 255 * 0.5 + fog_big * FOG[c] / 255 * 0.5) * fog_amt
    right_img = Image.fromarray(np.clip(right_rgb * 255, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    dr = ImageDraw.Draw(right_img)
    qa = E.out_cubic(E.seg(local_t, 1.0, 2.2)) * (0.55 + 0.15 * math.sin(local_t * 2))
    fq = dc.fr(150, 700, it=True)
    qs = "?"
    wq = dc.tw(qs, fq)
    dc.tk(dr, qs, fq, (*SNOW, int(200 * qa)), (bx0 + bx1) // 2 - wq // 2, (by0 + by1) // 2 - 90)
    lbl2 = "UNPROVEN · BEYOND IT"
    wlbl2 = dc.tw(lbl2, fnt, 0.06)
    rcx = bx0 + int((bx1 - bx0) * 0.74)
    dc.tk(dr, lbl2, fnt, (*FOG, int(210 * fog_amt)), rcx - wlbl2 // 2, by1 + 24, 0.06)

    # FRAYED edge (per storyboard: "its edge fraying into unlit fog") -- an irregular, noisy
    # boundary per row, not a straight vertical cut, so the crisp box visibly dissolves into fog
    # rather than being sliced by a hard line.
    seam = 0.5 + 0.01 * math.sin(local_t * 1.3)
    seam_x = int(W * seam)
    fray_rng = np.random.default_rng(13)
    fray = fray_rng.standard_normal(H).astype(np.float32)
    fray = gaussian_filter(fray, 14)
    fray = fray / (np.abs(fray).max() + 1e-6) * 46
    fray += gaussian_filter(fray_rng.standard_normal(H).astype(np.float32), 3) * 8
    grad_w = 44
    xx = np.arange(W).astype(np.float32)[None, :]
    row_seam = (seam_x + fray)[:, None]
    v = np.clip((xx - (row_seam - grad_w)) / (2 * grad_w), 0, 1) * 255
    mask = Image.fromarray(v.astype(np.uint8), "L")
    out = Image.composite(right_img, left_img, mask)
    d = ImageDraw.Draw(out)

    label_a = E.out_cubic(E.seg(local_t, 2.4, 3.2))
    if label_a > 0.01:
        f1 = dc.mono(30, b=True)
        s = "NO WINNER ANNOUNCED YET"
        w = dc.tw(s, f1, 0.06)
        y0 = by1 + 90
        dc.tk(d, s, f1, (*SNOW, int(235 * label_a)), (W - w) // 2, y0, 0.06)
        dc.logw((W - w) // 2, y0, w, f1.size, SNOW, label_a, label_a >= 0.6, "hud")

    return out.convert("RGB")


# ==================================================================================
def render_scene(f):
    sh = shot_at(f)
    if sh["id"] in (1, 6):
        if sh["id"] == 1:
            local = f - sh["s"]
            dur = sh["e"] - sh["s"]
            ignite_amt = E.out_cubic(E.seg(local, 12, 42))
            grid_amt = E.out_cubic(E.seg(local, 60, 150))
            label_amt = E.out_cubic(E.seg(local, 130, 190))
            status_amt = E.out_cubic(E.seg(local, 170, 240))
            return scene_landscape(f, ignite_amt, grid_amt, label_amt, status_amt, bookend=False, pullback=0.0)
        else:
            local = f - sh["s"]
            dur = sh["e"] - sh["s"]
            pullback = E.out_cubic(E.seg(local, 0, 90))
            fade_amt = max(0.0, 1 - E.in_cubic(E.seg(local, 0, 30)) * 0.3)
            return scene_landscape(f, fade_amt, fade_amt * 0.35, 0.0, 0.0, bookend=True, pullback=pullback)
    elif sh["id"] == 2:
        local_t = (f - sh["s"]) / FPS
        dur = (sh["e"] - sh["s"]) / FPS
        return scene_datapanel(f, local_t, dur)
    elif sh["id"] == 3:
        local_t = (f - sh["s"]) / FPS
        dur = (sh["e"] - sh["s"]) / FPS
        return scene_swarm(f, local_t, dur)
    elif sh["id"] == 4:
        local_t = (f - sh["s"]) / FPS
        dur = (sh["e"] - sh["s"]) / FPS
        return scene_countdown(f, local_t, dur)
    elif sh["id"] == 5:
        local_t = (f - sh["s"]) / FPS
        dur = (sh["e"] - sh["s"]) / FPS
        return scene_split(f, local_t, dur)


TRANSITIONS = {2: "fui-boot", 3: "whip-pan", 4: "match-cut", 5: "pull-out", 6: "crossfade"}


def render_frame(f):
    sh = shot_at(f)
    img = render_scene(f)

    # blend across the boundary into the NEXT shot for the trailing XFADE_F frames of this shot,
    # and the current shot is blended FROM the previous for its leading XFADE_F frames.
    prev_end = sh["s"]
    if f < sh["e"] and (f - sh["s"]) < XFADE_F and sh["id"] > 1:
        prev_sh = SHOTS[sh["id"] - 2]
        t = (f - sh["s"] + XFADE_F) / (2 * XFADE_F)
        prev_img = render_scene(prev_sh["e"] - 1)
        trans = TRANSITIONS.get(sh["id"], "crossfade")
        if trans == "whip-pan":
            img = dc.whip(prev_img, img, t)
        elif trans in ("match-cut", "fui-boot"):
            img = dc.xfade(prev_img, img, E.out_cubic(t))
        elif trans == "pull-out":
            img = dc.focus_pull(prev_img, img, t, sigma=5.0)
        elif trans == "crossfade":
            img = dc.xfade(prev_img, img, t)
        else:
            img = dc.xfade(prev_img, img, t)

    arr = np.asarray(img.convert("RGB"), np.uint8)
    graded = dc.finish(arr, seed=f)
    out = Image.fromarray(graded, "RGB")
    return out


def main():
    args = sys.argv[1:]
    if args and args[0] == "test":
        frames = [int(a) for a in args[1:]] or [0, 300, 700, 950, 1250, 1600, 1799]
    else:
        s = int(args[0]) if len(args) > 0 else 0
        e = int(args[1]) if len(args) > 1 else NF
        frames = list(range(s, e))

    shots_manifest = [
        {"id": sh["id"], "start": sh["s"], "end": sh["e"], "framing": sh["framing"],
         "transition_in": TRANSITIONS.get(sh["id"], "")}
        for sh in SHOTS
    ]
    dc.write_shots(shots_manifest, NF, path=os.path.join(HERE, "shots.json"))

    for f in frames:
        out = render_frame(f)
        out = apply_lower_scrim(out)
        canv = out.convert("RGBA")
        draw_eyebrow(canv, f)
        dc.set_frame_bg(canv.convert("RGB"), f)
        dc.caption(canv, f)
        dc.outro_card(canv, f)
        canv.convert("RGB").save(os.path.join(FR, f"frame_{f:05d}.png"))
        dc.flush_textlog(f)
        if f % 100 == 0:
            print("frame", f)
    print("done", len(frames), "frames")


if __name__ == "__main__":
    main()
