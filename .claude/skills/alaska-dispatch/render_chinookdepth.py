"""
Alaska.Ai Dispatch -- THE DEPTH CHART (2026-07-01). 9:16 1080x1920, 60s/1800f.

COMPOSITION (out/dispatch/storyboard.json, derived_from: scratch; passes scripts/storyboard_check.py):
A top-down chart of the Gulf of Alaska where thirteen years of satellite tag pings from Chinook salmon
assemble into a living probability heatmap of where a Chinook is likely to be, by depth, season, and hour.
A trawl captain reads the field before the net ever leaves the deck. Register: data-brutalist. Color
world: plum-violet open ocean + a magenta-to-butter-yellow inferno probability gradient + graphite/
off-white chart UI. This is deliberately NOT the permafrost cross-section (vertical descent, thermal
duotone) and NOT the river sonar instrument screen (instrument-screen pov, amber-on-abyss). Shared CRAFT
(type, finish/grade, captions, outro, textlog) is IMPORTED from dispatch_core; the SCENE is authored here.
Scene events ride the VO's OWN beat map (dc.BEATS) so picture and voice cannot drift apart.
  test:  python render_chinookdepth.py test 60 200 400 600 800 1000 1200 1400 1600 1750
  range: python render_chinookdepth.py 0 1800
"""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter
import easing as E, craft
import dispatch_core as dc
from dispatch_core import W, H, FPS, NF, fr, mono, tw, tk, finish, caption, outro_card

HERE = dc.HERE
FR = os.path.join(HERE, "frames_chinookdepth"); os.makedirs(FR, exist_ok=True)

# ---- palette (deep plum-violet ocean + magenta->butter-yellow inferno gradient) ----
OCEAN_A = np.array([18, 10, 28],  np.float32)   # deep plum-black (bottom)
OCEAN_B = np.array([44, 22, 58],  np.float32)   # plum-violet (top, near coast)
GRID_LN = (120, 100, 140, 60)
OFFWHITE = (238, 233, 242)
GRAPHITE = (150, 138, 160)
CORAL_WARN = (255, 120, 118)

def magma(t):
    """4-stop inferno-style ramp: deep violet -> magenta -> orange -> butter-yellow."""
    stops = [(0.00, (28, 12, 48)), (0.38, (168, 24, 108)), (0.68, (232, 96, 42)), (1.00, (255, 214, 96))]
    t = max(0.0, min(1.0, t))
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]; t1, c1 = stops[i + 1]
        if t <= t1 or i == len(stops) - 2:
            k = 0 if t1 == t0 else (t - t0) / (t1 - t0)
            k = max(0.0, min(1.0, k))
            return tuple(int(c0[j] + (c1[j] - c0[j]) * k) for j in range(3))
    return stops[-1][1]

MAGMA_LUT = np.array([magma(i / 255.0) for i in range(256)], np.uint8)

# ---- procedural probability fields (two fixed seeded noise fields, blended by season_mix) ----
FW, FH = 96, 176   # small logical grid, upsampled to frame size
def _field(seed, bias_y):
    rng = np.random.default_rng(seed)
    n = rng.standard_normal((FH, FW)).astype(np.float32)
    n = gaussian_filter(n, sigma=(9, 6))
    n = (n - n.min()) / (n.max() - n.min() + 1e-6)
    yy = np.linspace(0, 1, FH)[:, None]
    n = n * (1.0 - 0.55 * np.abs(yy - bias_y))
    return n
SPRING_FIELD = _field(11, bias_y=0.26)     # cold spring -> shallow (near top of the water-column band)
AFTERNOON_FIELD = _field(37, bias_y=0.72)  # warm afternoon -> deep

def blended_field(season_mix):
    f = SPRING_FIELD * (1 - season_mix) + AFTERNOON_FIELD * season_mix
    return (f - f.min()) / (f.max() - f.min() + 1e-6)

_field_cache = {}
def field_rgba(season_mix, alpha_scale=1.0):
    key = round(season_mix, 3)
    if key not in _field_cache:
        f = blended_field(key)
        idx = np.clip((f * 255).astype(np.int32), 0, 255)
        rgb = MAGMA_LUT[idx]
        a = np.clip((f ** 0.7) * 255, 0, 255).astype(np.uint8)
        rgba = np.dstack([rgb, a])
        img = Image.fromarray(rgba, "RGBA").resize((W, int(H * 0.62)), Image.LANCZOS)
        _field_cache[key] = img
    img = _field_cache[key]
    if alpha_scale < 0.999:
        a = np.asarray(img.split()[-1]).astype(np.float32) * alpha_scale
        img = img.copy(); img.putalpha(Image.fromarray(a.astype(np.uint8)))
    return img

# ---- base chart canvas (ocean gradient + graticule + coastline) ----
_YG = np.linspace(0, 1, H)[:, None, None].astype(np.float32)
def ocean_bg():
    g = OCEAN_A[None, None, :] + (OCEAN_B - OCEAN_A)[None, None, :] * (1 - _YG[:int(H * 0.7)])
    canvas = np.zeros((H, W, 3), np.float32)
    canvas[:int(H * 0.7)] = np.broadcast_to(g, (int(H * 0.7), W, 3))
    canvas[int(H * 0.7):] = OCEAN_A
    return canvas.astype(np.uint8)
OCEAN_BG = ocean_bg()

COAST = [(0, 0), (60, 60), (180, 40), (300, 120), (420, 70), (560, 140), (700, 90), (820, 160),
         (960, 110), (1080, 170), (1080, 0)]

# the magma heatmap (field_rgba) can paste bright butter-yellow patches straight into the caption
# lower-third (captions live ~y1360-1700, see dispatch_core.caption's y0=1500-blockh//2). A 3px dark
# stroke alone can't hold >=2.0 contrast for the dim "not-yet-said" caption color over a bright patch,
# so shots that show the live field (3 tail, 4, 6) darken a soft band behind the caption zone only —
# the heatmap itself is untouched everywhere else on screen.
_CAP_Y0, _CAP_Y1 = 1340, 1720
def caption_scrim(img, strength=0.62):
    ys = np.arange(H, dtype=np.float32)
    t = np.clip((ys - _CAP_Y0) / max(1, (_CAP_Y1 - _CAP_Y0)), 0, 1)
    fade = np.sin(np.pi * t)  # 0 at top/bottom of band, peak at the caption's vertical center
    alpha_col = np.clip(fade * 255 * strength, 0, 255).astype(np.uint8)
    alpha = np.broadcast_to(alpha_col[:, None], (H, W))
    scrim = Image.new("RGBA", (W, H), (6, 3, 10, 0))
    scrim.putalpha(Image.fromarray(np.ascontiguousarray(alpha), "L"))
    img.paste(scrim, (0, 0), scrim)

def draw_chart(d, drift=0.0, coast_alpha=210):
    d.polygon([(x, y * 0.9 + 40) for x, y in COAST], fill=(10, 6, 16, coast_alpha))
    step = 108
    for gx in range(-step, W + step, step):
        x = gx + (drift % step)
        d.line([(x, 0), (x, H)], fill=GRID_LN, width=1)
    for gy in range(180, H, 130):
        d.line([(0, gy), (W, gy)], fill=GRID_LN, width=1)

def eyebrow(d, f, label="ALASKA.AI  ·  FIELD SIGNAL"):
    a = int(255 * min(1.0, f / 20.0))
    ft = mono(26, m=True)
    tk(d, label, ft, (*GRAPHITE, min(a, 190)), 64, 76, 0.14)
    dc.logw(64, 76, tw(label, ft, 0.14), ft.size, GRAPHITE, min(a, 190) / 255, False, "hud")

def boat_icon(d, cx, cy, scale=1.0, heading=0.0, glow=None):
    s = 16 * scale
    hull = [(-s, -s * 0.55), (s * 1.3, 0), (-s, s * 0.55), (-s * 0.55, 0)]
    ang = math.radians(heading)
    pts = [(cx + px * math.cos(ang) - py * math.sin(ang), cy + px * math.sin(ang) + py * math.cos(ang)) for px, py in hull]
    if glow:
        for k, a in ((s * 4, 22), (s * 2.2, 46)):
            d.ellipse([cx - k, cy - k, cx + k, cy + k], fill=(*glow, a))
    d.polygon(pts, fill=(*OFFWHITE, 235), outline=(*GRAPHITE, 255))

def wake(d, pts, alpha=140):
    for i, (x, y) in enumerate(pts):
        a = int(alpha * (i + 1) / max(1, len(pts)))
        r = 2 + i * 0.35
        d.ellipse([x - r, y - r, x + r, y + r], outline=(*OFFWHITE, a), width=1)

def hud_label(d, x, y, text, size=30, color=OFFWHITE, alpha=1.0, bold=True, center=False, right=False, target=True):
    ft = mono(size, b=bold)
    w = tw(text, ft, 0.06)
    xx = x - w // 2 if center else (x - w if right else x)
    d.text((xx, y), text, font=ft, fill=(*color, int(255 * alpha)), stroke_width=2, stroke_fill=(3, 2, 8, int(220 * alpha)))
    dc.logw(xx, y, w, ft.size, color, alpha, target and alpha >= 0.62, "hud")

def dashed_border(d, box, dash=10, gap=7, color=OFFWHITE, alpha=200, w=2):
    x0, y0, x1, y1 = box
    x = x0
    while x < x1:
        d.line([(x, y0), (min(x + dash, x1), y0)], fill=(*color, alpha), width=w)
        d.line([(x, y1), (min(x + dash, x1), y1)], fill=(*color, alpha), width=w)
        x += dash + gap
    y = y0
    while y < y1:
        d.line([(x0, y), (x0, min(y + dash, y1))], fill=(*color, alpha), width=w)
        d.line([(x1, y), (x1, min(y + dash, y1))], fill=(*color, alpha), width=w)
        y += dash + gap

# ================================================================ SHOT 1 (0-228) — the empty boat
def shot1(f):
    img = Image.fromarray(OCEAN_BG.copy())
    d = ImageDraw.Draw(img, "RGBA")
    draw_chart(d, drift=f * 0.15)
    p = f / 228.0
    bx = 210 + (W - 420) * E.in_out_cubic(p)
    by = 560 + 18 * math.sin(f * 0.05)
    tail = [(bx - 28 - k * 20, by + 6 + k * 2) for k in range(6)]
    wake(d, tail)
    void_r = 120 + 6 * math.sin(f * 0.07)
    d.ellipse([bx - void_r, by + 40 - void_r * 0.4, bx + void_r, by + 40 + void_r * 0.4], fill=(6, 3, 10, 210))
    q_a = E.out_cubic(E.seg(f, 60, 100)) * (0.55 + 0.25 * math.sin(f * 0.12))
    if q_a > 0.02:
        ft = fr(74, 800); w = tw("?", ft)
        tk(d, "?", ft, (*OFFWHITE, int(200 * q_a)), int(bx - w / 2), int(by + 20), 0)
        dc.logw(int(bx - w / 2), int(by + 20), w, ft.size, OFFWHITE, q_a, q_a >= 0.62, "hero")
    flag_a = E.out_back(E.seg(f, 70, 110))
    if flag_a > 0.02:
        fx, fy = bx + 60, by - 60
        d.line([(fx, fy), (fx, fy - 34 * flag_a)], fill=(*CORAL_WARN, int(255 * min(1, flag_a))), width=3)
        d.polygon([(fx, fy - 34 * flag_a), (fx + 46 * flag_a, fy - 26 * flag_a), (fx, fy - 18 * flag_a)], fill=(*CORAL_WARN, int(230 * min(1, flag_a))))
        if flag_a > 0.9:
            hud_label(d, fx + 8, fy - 14, "OVER LIMIT", 20, CORAL_WARN, min(1, (f - 96) / 20))
    boat_icon(d, bx, by, scale=1.15, heading=0)
    eyebrow(d, f)
    hud_label(d, W - 64, 76, "GULF OF ALASKA · CHART", 22, GRAPHITE, min(1, f / 20), bold=False, right=True)
    return img

# ================================================================ SHOT 2 (228-380) — the closure
def shot2(f):
    lf = f - 228
    img = Image.fromarray(OCEAN_BG.copy())
    d = ImageDraw.Draw(img, "RGBA")
    tilt = 0.10 * E.out_cubic(E.seg(lf, 0, 24))
    draw_chart(d, drift=228 * 0.15, coast_alpha=int(210 * (1 - tilt)))
    d.polygon([(0, 0), (W, 0), (W, H * (0.28 + tilt)), (0, H * (0.20 + tilt))], fill=(0, 0, 0, int(60 * tilt)))
    frozen = lf >= 72
    barx, bary0, barh = W - 160, 300, 900
    p = min(1.0, lf / 72.0)
    fillh = barh * E.in_out_cubic(p)
    d.rectangle([barx - 30, bary0, barx + 30, bary0 + barh], outline=(*GRAPHITE, 200), width=2)
    col = CORAL_WARN if p > 0.86 else OFFWHITE
    d.rectangle([barx - 28, bary0 + barh - fillh, barx + 28, bary0 + barh], fill=(*col, 210))
    d.line([(barx - 46, bary0 + 40), (barx + 46, bary0 + 40)], fill=(*CORAL_WARN, 220), width=2)
    hud_label(d, barx, bary0 - 34, "BYCATCH TALLY", 20, GRAPHITE, 1.0, center=True, bold=False)
    if frozen:
        fa = E.out_cubic(E.seg(lf, 72, 92))
        d.rectangle([0, 0, W, H], fill=(90, 20, 24, int(120 * fa)))
        noise = (np.random.default_rng(f).random((H // 6, W // 6)) * 18 * fa).astype(np.uint8)
        noise_img = Image.fromarray(np.dstack([noise] * 3)).resize((W, H))
        img = Image.fromarray(np.clip(np.asarray(img.convert("RGB")).astype(np.int16) + np.asarray(noise_img).astype(np.int16), 0, 255).astype(np.uint8)).convert("RGBA")
        d = ImageDraw.Draw(img, "RGBA")
        sa = E.out_back(E.seg(lf, 78, 108))
        if sa > 0.02:
            ft = fr(88, 900); s = "SEASON"; s2 = "CLOSED"
            w1 = tw(s, ft); w2 = tw(s2, ft)
            sc = 0.7 + 0.3 * min(1, sa)
            tk(d, s, ft, (*OFFWHITE, int(255 * min(1, sa))), (W - w1) // 2, 820, 0)
            tk(d, s2, ft, (*CORAL_WARN, int(255 * min(1, sa))), (W - w2) // 2, 920, 0)
            dc.logw((W - w1) // 2, 820, w1, ft.size, OFFWHITE, min(1, sa), sa >= 0.62, "hero")
    eyebrow(d, 228)
    hud_label(d, W - 64, 76, "ORBITAL VIEW", 22, GRAPHITE, 1.0, bold=False, right=True)
    return img

# ================================================================ SHOT 3 (380-705) — the pings assemble
UAF_TXT = "UNIVERSITY OF ALASKA FAIRBANKS"
def shot3(f):
    lf = f - 380
    img = Image.new("RGB", (W, H), (10, 5, 16))
    d = ImageDraw.Draw(img, "RGBA")
    if lf < 12:
        m = Image.new("L", (W, H), 0)
        r = int(1400 * E.out_cubic(lf / 12))
        ImageDraw.Draw(m).ellipse([W // 2 - r, H // 2 - r, W // 2 + r, H // 2 + r], fill=255)
        prior = np.asarray(shot2(379).convert("RGB"))
        img = Image.composite(img, Image.fromarray(prior), m)
        d = ImageDraw.Draw(img, "RGBA")
    n_chars = int(len(UAF_TXT) * min(1.0, max(0, lf - 6) / 40))
    if n_chars > 0:
        hud_label(d, W // 2, 220, UAF_TXT[:n_chars], 24, GRAPHITE, 1.0, center=True, bold=False)
    # sonar-ping flashes: two soft radial pulses (concentric low-alpha rings, same glow language as
    # boat_icon/dash glow elsewhere) fire across the mask-wipe settle and again mid-swarm — a hard,
    # salient onset/offset (not a silent ramp-in) spaced through the 12.8-19.4s window; the point swarm
    # alone stayed too sparse for too long to register as a beat.
    px, py = W / 2, H / 2 - 60
    def _ping_flash(onset, hold, fadeout):
        # hard onset (full brightness in 1 frame), brief hold, quick offset — each edge alone is a big
        # enough full-frame luminance jump to register as a cadence spike, without reading as a solid disc.
        if onset <= lf < onset + hold:
            a = 1.0
        elif onset + hold <= lf < onset + hold + fadeout:
            a = max(0.0, 1.0 - (lf - onset - hold) / max(1, fadeout))
        else:
            return
        col = magma(0.92)
        for k, base_a in ((190, 30), (110, 55), (55, 85), (20, 150)):
            d.ellipse([px - k, py - k, px + k, py + k], fill=(*col, int(base_a * a)))
        d.ellipse([px - 8, py - 8, px + 8, py + 8], fill=(*col, int(255 * a)))
    _ping_flash(12, 4, 3)     # t≈13.07-13.63s — right as the mask-wipe settles
    _ping_flash(110, 4, 3)    # t≈16.67-17.23s — mid-swarm, keeps the back half of the window alive
    # point-assembly ramp: pulled forward and steepened so the swarm is visibly, densely building
    # through the whole 12.8-19.4s window instead of staying near-empty until lf~60-80.
    p = min(1.0, max(0.0, (lf - 14) / 90.0))
    n_pts = int(1400 * E.out_cubic(p)) + (1 if lf >= 12 else 0)
    rng = np.random.default_rng(9)
    xs = rng.normal(W / 2, 260, 1600); ys = rng.normal(H / 2 - 60, 340, 1600)
    for i in range(min(n_pts, 1600)):
        x, y = xs[i], ys[i]
        if 0 < x < W and 0 < y < H * 0.86:
            a = 120 + int(80 * ((i * 37) % 7) / 7)
            col = magma(min(1.0, i / 1400.0))
            d.ellipse([x - 2.2, y - 2.2, x + 2.2, y + 2.2], fill=(*col, a))
    if lf >= 190:
        sweep_p = E.in_out_cubic(min(1.0, (lf - 190) / 40.0))
        field = field_rgba(0.35, alpha_scale=sweep_p)
        img.paste(field, (0, int(H * 0.30)), field)
    yc = 630 - 200
    label13 = min(1.0, max(0, lf - 55) / 20.0)
    if label13 > 0.02:
        hud_label(d, 90, yc, "13 YEARS", 40, OFFWHITE, label13, bold=True)
    label700 = min(1.0, max(0, lf - 85) / 25.0)
    if label700 > 0.02:
        hud_label(d, 90, yc + 56, "700,000+ SIGNALS", 34, magma(0.7), label700, bold=True)
    eyebrow(d, 380 + lf)
    if lf >= 190:
        caption_scrim(img, strength=0.62 * sweep_p)
    return img

# ================================================================ SHOT 4 (705-1020) — the living heatmap
def shot4(f):
    lf = f - 705
    img = Image.fromarray(OCEAN_BG.copy())
    d = ImageDraw.Draw(img, "RGBA")
    draw_chart(d, drift=705 * 0.15, coast_alpha=160)
    reveal = E.out_cubic(E.seg(lf, 0, 30))
    season = 0.5 + 0.5 * math.sin((lf - 90) * 0.011) if lf > 90 else 0.5
    field = field_rgba(season, alpha_scale=reveal)
    img.paste(field, (0, int(H * 0.30)), field)
    d = ImageDraw.Draw(img, "RGBA")
    if lf < 90:
        la = min(1.0, max(0, lf - 40) / 20.0)
        hud_label(d, W // 2, 900, "ODDS: DEPTH x HOUR", 30, OFFWHITE, la, center=True)
    else:
        tag = "COLD SPRING · SHALLOW" if season < 0.5 else "WARM AFTERNOON · DEEP"
        hud_label(d, W // 2, 900, tag, 26, OFFWHITE, 1.0, center=True, bold=False)
    boat_icon(d, W * 0.66, H * 0.40, scale=0.9, glow=magma(season))
    eyebrow(d, 705 + lf)
    hud_label(d, W - 64, 76, "SEASONAL PROBABILITY FIELD", 20, GRAPHITE, 1.0, bold=False, right=True)
    caption_scrim(img, strength=0.62 * reveal)
    return img

# ================================================================ SHOT 5 (1020-1333) — the captain reads it
def shot5(f):
    lf = f - 1020
    horizon = Image.new("RGB", (W, H), (14, 8, 22))
    d = ImageDraw.Draw(horizon, "RGBA")
    for i in range(int(H * 0.55)):
        t = i / (H * 0.55)
        col = tuple(int(magma(0.55)[c] * (1 - t) + 14 * t) for c in range(3))
        d.line([(0, i), (W, i)], fill=col)
    d.rectangle([0, int(H * 0.55), W, H], fill=(8, 5, 12, 255))
    deck_y = int(H * 0.56)   # keep the dashboard well clear of the lower-third caption safe zone
    d.polygon([(0, H), (0, deck_y), (W * 0.3, deck_y - 40), (W, deck_y + 20), (W, H)], fill=(5, 3, 8, 255))
    cap_x, cap_y = W * 0.58, deck_y - 90
    lean = E.out_cubic(E.seg(lf, 0, 40))
    d.ellipse([cap_x - 30, cap_y - 150 - lean * 10, cap_x + 30, cap_y - 90 - lean * 10], fill=(4, 2, 6, 255))
    d.polygon([(cap_x - 46, cap_y - 96), (cap_x + 46, cap_y - 96), (cap_x + 34, cap_y + 60), (cap_x - 34, cap_y + 60)], fill=(4, 2, 6, 255))
    dash_x, dash_y = cap_x - 150, deck_y - 20
    d.rounded_rectangle([dash_x - 90, dash_y - 60, dash_x + 90, dash_y + 40], radius=10, fill=(20, 12, 28, 235), outline=(*GRAPHITE, 200), width=2)
    glow_p = min(1.0, lf / 40.0)
    gx, gy = dash_x, dash_y - 10
    if glow_p > 0.02:
        col = magma(0.75)
        for k, a in ((26, 40), (14, 90)):
            d.ellipse([gx - k, gy - k, gx + k, gy + k], fill=(*col, int(a * glow_p)))
        d.ellipse([gx - 7, gy - 7, gx + 7, gy + 7], fill=(*col, int(255 * glow_p)))
        hud_label(d, gx, gy + 24, "BEST WINDOW", 18, OFFWHITE, glow_p, center=True, bold=False)
    if lf >= 118:
        fa = E.seg(lf, 118, 138)
        stray_x, stray_y = gx + 70, gy - 34
        flick = 0.5 + 0.5 * math.sin(f * 0.9)
        d.ellipse([stray_x - 5, stray_y - 5, stray_x + 5, stray_y + 5], outline=(*CORAL_WARN, int(220 * fa * flick)), width=2)
    if lf >= 161:
        ba = E.out_cubic(E.seg(lf, 161, 181))
        box = [dash_x - 90, dash_y - 60, dash_x + 90, dash_y + 40]
        dashed_border(d, box, color=CORAL_WARN, alpha=int(200 * ba))
        hud_label(d, dash_x, dash_y + 52, "LEARNED FROM THE PAST", 17, CORAL_WARN, ba, center=True, bold=False)
    eyebrow(d, 1020 + lf)
    return horizon.convert("RGBA")

# ================================================================ SHOT 6 (1333-1672) — the human holds it
def shot6(f):
    lf = f - 1333
    img = Image.fromarray(OCEAN_BG.copy())
    d = ImageDraw.Draw(img, "RGBA")
    draw_chart(d, drift=1333 * 0.15, coast_alpha=160)
    season = 0.5 + 0.5 * math.sin((1020 - 705 + 90 - 90) * 0.011)
    dim = max(0.16, 1.0 - E.out_cubic(E.seg(lf, 0, 40)) * 0.82)
    field = field_rgba(season, alpha_scale=dim)
    img.paste(field, (0, int(H * 0.30)), field)
    d = ImageDraw.Draw(img, "RGBA")
    bx, by = W * 0.58, H * 0.40
    resolve = E.out_back(E.seg(lf, 0, 34))
    if resolve > 0.02:
        r = 34 * min(1, resolve)
        col = magma(0.85)
        for k, a in ((r * 2.6, 30), (r * 1.4, 70)):
            d.ellipse([bx - k, by - k, bx + k, by + k], fill=(*col, int(a * min(1, resolve))))
        d.rounded_rectangle([bx - 60, by - 30, bx + 60, by + 30], radius=8, fill=(16, 10, 22, int(230 * min(1, resolve))), outline=(*OFFWHITE, int(220 * min(1, resolve))), width=2)
        state = "HOLD" if lf < 150 else "OPEN"
        hud_label(d, bx, by - 12, state, 24, OFFWHITE, min(1, resolve), center=True)
    boat_icon(d, bx, by + 70, scale=0.85)
    if lf >= 167:
        ca = E.out_cubic(E.seg(lf, 167, 195))
        cx, cy = 150, 220
        d.rounded_rectangle([cx - 10, cy - 40, cx + 260, cy + 10], radius=6, fill=(14, 8, 20, int(210 * ca)), outline=(*GRAPHITE, int(200 * ca)))
        hud_label(d, cx + 10, cy - 30, "SEASON: OPEN", 22, magma(0.15) if False else (150, 235, 190), ca, bold=True)
    eyebrow(d, 1333 + lf)
    hud_label(d, W - 64, 76, "DECISION ON THE CHART", 20, GRAPHITE, 1.0, bold=False, right=True)
    caption_scrim(img, strength=0.62 * dim)
    return img

# ================================================================ SHOT 7 (1672-1800) — outro
def shot7(f):
    lf = f - 1672
    base = shot6(min(1671, 1333 + 339))
    fade = min(1.0, lf / 90.0)
    dark = Image.new("RGB", (W, H), (8, 4, 12))
    img = Image.blend(base.convert("RGB"), dark, 0.55 * fade).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    ping_y = H * 0.5 - lf * 2.2
    if ping_y > -20:
        a = max(0, 1 - lf / 110.0)
        col = magma(0.8)
        d.ellipse([W * 0.68 - 5, ping_y - 5, W * 0.68 + 5, ping_y + 5], fill=(*col, int(200 * a)))
    return img

SHOT_FUNCS = [(0, 228, shot1), (228, 380, shot2), (380, 705, shot3), (705, 1020, shot4),
              (1020, 1333, shot5), (1333, 1672, shot6), (1672, 1800, shot7)]

def draw_scene(f):
    for s, e, fn in SHOT_FUNCS:
        if s <= f < e:
            return fn(f)
    return shot7(min(1799, f))

def render(f):
    img = draw_scene(f).convert("RGB")
    arr = finish(np.asarray(img), seed=f)
    out = Image.fromarray(arr).convert("RGBA")
    dc.set_frame_bg(out, f)
    d = ImageDraw.Draw(out, "RGBA")
    caption(out, f)
    outro_card(out, f)
    dc.flush_textlog(f)
    out.convert("RGB").save(os.path.join(FR, f"frame_{f:05d}.png"))

def write_shots_json():
    shots = [
        dict(id=1, start=0,    end=228,  framing="wide-establish",   transition_in="fade-up",       note="the trawler crossing the blank chart"),
        dict(id=2, start=228,  end=380,  framing="data-panel",       transition_in="pull-out",      note="tally bar climbing to SEASON CLOSED, aerial oblique view"),
        dict(id=3, start=380,  end=705,  framing="push-detail",      transition_in="mask-wipe",     note="one tag-ping multiplying into thousands"),
        dict(id=4, start=705,  end=1020, framing="map-territory",    transition_in="graphic-match", note="the seasonal probability heatmap breathing"),
        dict(id=5, start=1020, end=1333, framing="subject-portrait", transition_in="carried-element", note="the captain reading the dashboard"),
        dict(id=6, start=1333, end=1672, framing="map-territory",    transition_in="carried-element", note="the OPEN/HOLD marker on the map as AI dims"),
        dict(id=7, start=1672, end=1800, framing="subject-portrait", transition_in="crossfade",     note="the ALASKA.AI wordmark and tagline"),
    ]
    dc.write_shots(shots, NF)

if __name__ == "__main__":
    write_shots_json()
    if sys.argv[1] == "test":
        for f in map(int, sys.argv[2:]):
            render(f)
        print("wrote test frames:", sys.argv[2:])
    else:
        s, e = int(sys.argv[1]), int(sys.argv[2])
        for f in range(s, e):
            render(f)
        print(f"rendered {s}-{e}")
