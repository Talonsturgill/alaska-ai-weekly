"""
Alaska.Ai Dispatch "The Launch Call" — 9:16 (1080x1920), 60s/1800f, 2026-07-06.
STORY: Alaska's Tribal Health System (ANTHC, Southcentral Foundation, Maniilaq, UAF CANHR, UAA,
Stanford) is testing a community-governed AI/ML model that scores medevac-launch risk from patient
vitals, weather, and aircraft status, for roadless villages, while the governance rules for who owns
and consents to that data are still unwritten. Honest caveat: research pilot, not deployed; a person's
hand, not the model, makes the final call.
ARCHETYPE: six-shot journey, top-down map -> clinic interior -> booting instrument panel -> macro
ledger (a hand halts the machine, hand-drafts an unresolved guardrail line) -> eye-level rising row of
hands placing named plates -> map bookend + branded outro.
PALETTE: overcast gunmetal-grey + pale birch-white snow, marigold-orange risk needle, glacier-blue
console glow, flat charcoal void for the still-unwritten rule. Register: blueprint-technical.
  test:  python render_launchcall.py test 0 120 228 400 625 900 1024 1200 1324 1450 1533 1700 1799
  range: python render_launchcall.py 0 1800
"""
import sys, os, math, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter
import easing as E
import dispatch_core as dc

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, "frames_launchcall"); os.makedirs(FR, exist_ok=True)
W, H, FPS, NF = dc.W, dc.H, dc.FPS, dc.NF

# ---------------- palette (deliberately NOT blue-default; a cold storm world + one warm accent) ----------------
VOID = (10, 12, 16)
GUNMETAL_HI = (74, 82, 94); GUNMETAL_LO = (34, 38, 46)
BIRCH = (206, 214, 220); BIRCH_DIM = (120, 128, 138)
SLATE = (100, 114, 132); SLATE_DIM = (56, 64, 76)
MARIGOLD = (255, 158, 54); MARIGOLD_HI = (255, 196, 120)
GLACIER = (94, 176, 214); GLACIER_DIM = (46, 84, 104)
CHARCOAL = (18, 20, 24)
PAPER = (223, 220, 208); PAPER_DIM = (150, 148, 140)
SNOW_WHITE = (244, 250, 255)

fr = dc.fr; mono = dc.mono; tw = dc.tw; tk = dc.tk; finish = dc.finish
caption = dc.caption; outro_card = dc.outro_card; logw = dc.logw; set_frame_bg = dc.set_frame_bg
xfade = dc.xfade; reframe = dc.reframe; whip = dc.whip; mask_wipe = dc.mask_wipe

TIM = json.load(open(os.path.join(HERE, "audio", "timing60.json")))
BEATS = TIM["beats"]  # 17 ints, frame index each VO beat starts
SPEECH_END_F = int(round(TIM["speech_end"] * FPS))  # 1670

# shot boundaries (frames) — anchored to real beat starts (see out/dispatch/storyboard.json timing_note)
S1, S2, S3, S4, S5, S6 = 0, BEATS[2], BEATS[6], BEATS[10], BEATS[13], BEATS[15]
SEND = NF
TR = 22  # transition blend half-window in frames

rng_g = np.random.default_rng(42)

# ================================================================== shared texture helpers ==================================================================
def vgrad(h0, h1, y0, y1, H_=H):
    band = np.zeros((H_, 1, 3), np.float32)
    for y in range(y0, y1):
        t = (y - y0) / max(1, (y1 - y0 - 1))
        band[y, 0] = np.array(h0, np.float32) * (1 - t) + np.array(h1, np.float32) * t
    return band

def noise_field(seed, sigma=1.4, scale=1.0):
    n = gaussian_filter(np.random.default_rng(seed).standard_normal((H, W)).astype(np.float32), sigma)
    n = n / (n.std() + 1e-6)
    return n * scale

def snowfall(img, f, density=0.5, seed=5):
    """Drifting snow/static motes, diagonal drift — keeps ambient motion alive in every scene."""
    rng = np.random.default_rng(seed)
    n = 90 + int(120 * density)
    d = ImageDraw.Draw(img, "RGBA")
    for i in range(n):
        px = (rng.uniform(0, W) + f * (0.6 + 0.4 * (i % 3)) * 0.35) % (W + 40) - 20
        py = (rng.uniform(0, H) + f * (1.3 + 0.5 * (i % 4))) % (H + 40) - 20
        r = 1.0 + 2.2 * rng.random()
        a = int(40 + 90 * rng.random())
        d.ellipse([px - r, py - r, px + r, py + r], fill=(*BIRCH, a))
    return img

def glow_dot(img, xy, r, color, glow=1.0):
    x, y = xy
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    for k, a in ((r * 5.5, 22), (r * 3.2, 46), (r * 1.8, 90)):
        ld.ellipse([x - k, y - k, x + k, y + k], fill=(*color, int(a * glow)))
    out = Image.alpha_composite(img.convert("RGBA"), lay)
    d = ImageDraw.Draw(out); d.ellipse([x - r, y - r, x + r, y + r], fill=(*color, 255))
    return out.convert("RGB")

# ================================================================== SHOT 1 — THE VILLAGE (map) ==================================================================
VILLAGES = [(310, 640), (420, 520), (540, 760), (610, 480), (720, 690), (380, 900), (860, 560),
            (760, 920), (300, 1080), (650, 1040), (900, 820), (480, 1180), (200, 800), (930, 1120), (560, 1300)]
PIN = (540, 780)

def scene1_map(f):
    t = f / FPS
    img = np.zeros((H, W, 3), np.float32)
    img[:] = np.array(VOID, np.float32)
    # subtle drifting static/aurora-less cold texture behind the map
    n = noise_field(101, 2.2, 1.0)
    img += (n[..., None] * np.array([6, 8, 12], np.float32))
    # map reveal: pin is ALREADY glowing at frame 0; rest of the map fades up around it over ~30f
    reveal = E.out_cubic(E.seg(f, 0, 34))
    # roadless "territory" outline (stylized simplified silhouette, not literal cartography)
    outline = [(120, 520), (260, 380), (460, 340), (620, 300), (820, 360), (960, 460), (1000, 640),
               (940, 860), (980, 1080), (880, 1260), (700, 1420), (500, 1460), (320, 1380), (200, 1200),
               (140, 980), (180, 780), (120, 620)]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    d.line(outline + [outline[0]], fill=(*SLATE, int(140 * reveal)), width=3)
    # villages: dim slate dots, all disconnected (no road lines between them)
    for (vx, vy) in VILLAGES:
        a = int(150 * reveal)
        d.ellipse([vx - 4, vy - 4, vx + 4, vy + 4], fill=(*SLATE, a), outline=(*BIRCH_DIM, a))
    im = im.convert("RGB")
    # the pin: pulsing marigold glow, present from frame 0 (cold open)
    pulse = 0.75 + 0.25 * math.sin(t * 2 * math.pi * 0.9)
    im = glow_dot(im, PIN, 13 + 3 * pulse, MARIGOLD, glow=1.0)
    # weather static closing in around the pin (frame 1 onward), thins as map reveals
  # (kept subtle; storm intensifies again toward the transition)
    storm = 0.5 * (1 - 0.5 * reveal) + 0.35 * E.seg(f, S2 - 60, S2)
    im = snowfall(im, f, density=0.3 + storm, seed=7)
    # brief plane silhouette flash across the distant sky, timed to "the only way out is by air,"
    plane_a = E.out_cubic(E.seg(f, BEATS[2] - 6, BEATS[2] + 4)) * (1 - E.seg(f, BEATS[2] + 10, BEATS[2] + 26))
    if plane_a > 0.02:
        d2 = ImageDraw.Draw(im, "RGBA")
        ppx = 250 + (f - (BEATS[2] - 10)) * 9
        ppy = 340 - (f - (BEATS[2] - 10)) * 2.4
        ang = math.radians(-15)
        tip = (ppx + 26 * math.cos(ang), ppy + 26 * math.sin(ang))
        t1 = (ppx - 13 * math.cos(ang) + 8 * math.sin(ang), ppy - 13 * math.sin(ang) - 8 * math.cos(ang))
        t2 = (ppx - 13 * math.cos(ang) - 8 * math.sin(ang), ppy - 13 * math.sin(ang) + 8 * math.cos(ang))
        d2.polygon([tip, t1, t2], fill=(*SNOW_WHITE, int(230 * plane_a)))
        d2.line([(ppx - 60 * math.cos(ang), ppy - 60 * math.sin(ang)), (ppx - 13 * math.cos(ang), ppy - 13 * math.sin(ang))],
                fill=(*SNOW_WHITE, int(120 * plane_a)), width=2)
    # slow push toward the pin
    prog = E.in_out_sine(E.seg(f, 0, S2))
    scale = 1.0 - 0.10 * prog
    cx, cy = PIN[0] / W, PIN[1] / H
    im = reframe(im, cx, cy, scale)
    return im

# ================================================================== SHOT 2 — THE CALL COMES IN (clinic) ==================================================================
def scene2_clinic(f):
    t = (f - S2) / FPS
    img = np.zeros((H, W, 3), np.float32)
    img += vgrad((52, 58, 68), (18, 20, 25), 0, H)  # lit wall to floor — deliberately NOT near-black
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    # a big window, upper-center: storm/snow visibly thickening across the whole clinic scene
    wx0, wy0, wx1, wy1 = 300, 210, 800, 660
    thick = E.seg(f, S2, S4 - 40)
    d.rectangle([wx0 - 18, wy0 - 18, wx1 + 18, wy1 + 18], fill=(40, 44, 50, 255))
    d.rectangle([wx0, wy0, wx1, wy1], fill=(30, 38, 52, 255))
    d.line([(wx0 + (wx1 - wx0) // 2, wy0), (wx0 + (wx1 - wx0) // 2, wy1)], fill=(46, 50, 58, 255), width=8)
    winlay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); wd = ImageDraw.Draw(winlay)
    rng = np.random.default_rng(3)
    for i in range(int(90 + 260 * thick)):
        sx = wx0 + rng.uniform(0, wx1 - wx0); sy = (wy0 + rng.uniform(0, wy1 - wy0) + t * 110 * (1 + i % 3 * .2)) % (wy1 - wy0) + wy0
        wd.ellipse([sx - 2.0, sy - 2.0, sx + 2.0, sy + 2.0], fill=(*BIRCH, 210))
    im = Image.alpha_composite(im, winlay)
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle([wx0 - 18, wy0 - 18, wx1 + 18, wy1 + 18], outline=(64, 70, 80, 255), width=10)
    # monitor console, lower-left, lights that side of the room
    mon_pulse = 0.75 + 0.25 * math.sin(t * 2 * math.pi * 1.3)
    im = glow_dot(im, (255, 1180), 70 * mon_pulse, GLACIER, glow=0.85)
    d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle([160, 1090, 400, 1260], 12, fill=(16, 32, 42, 240), outline=(*GLACIER, 220), width=3)
    for yy in range(1112, 1240, 13):
        bar = int(200 * (0.4 + 0.6 * abs(math.sin(yy * 0.2 + t * 3))))
        d.line([(184, yy), (184 + bar, yy)], fill=(*GLACIER, 220), width=4)
    # hand + radio handset — the HERO, large and centered, reaches in at beat4
    reach = E.out_cubic(E.seg(f, BEATS[3] - 14, BEATS[3] + 40))
    hx, hy = 620, 1280 + int((1 - reach) * 320)
    if reach > 0.02:
        d.line([(hx + 90, hy + 330), (hx + 10, hy + 60)], fill=(58, 48, 40, int(255 * reach)), width=88)
        d.rounded_rectangle([hx - 62, hy - 130, hx + 62, hy + 55], 28, fill=(38, 40, 46, int(255 * reach)),
                             outline=(*SNOW_WHITE, int(150 * reach)), width=3)
        d.rounded_rectangle([hx - 36, hy - 100, hx + 36, hy - 34], 9, fill=(*GLACIER_DIM, int(220 * reach)))
        key = E.out_cubic(E.seg(f, BEATS[4], BEATS[4] + 10)) * (1 - E.seg(f, BEATS[4] + 10, BEATS[4] + 30))
        if key > 0.02:
            im = glow_dot(im, (hx, hy - 67), 54 * key, MARIGOLD, glow=key)
            d = ImageDraw.Draw(im, "RGBA")
    # desk edge along the bottom, lit, not a flat dark slab
    d.polygon([(0, 1620), (W, 1600), (W, H), (0, H)], fill=(26, 28, 34, 255))
    d.line([(0, 1620), (W, 1600)], fill=(70, 76, 86, 200), width=4)
    im = im.convert("RGB")
    im = snowfall(im, f, density=0.14, seed=11)
    # slow horizontal traverse across the room (subtle — a move, not a re-crop that loses content)
    prog = E.seg(f, S2, S3)
    cx = 0.47 + 0.06 * prog; cy = 0.50
    im = reframe(im, cx, cy, 0.97)
    return im

# ================================================================== SHOT 3 — THE MODEL WEIGHS IT (instrument panel) ==================================================================
CH_X = [(122, 380), (410, 668), (698, 956)]
CH_LABELS = ["VITALS", "WEATHER", "AIRCRAFT"]
CH_Y0, CH_Y1 = 1175, 1360

def scene3_panel(f):
    t = (f - S3) / FPS
    img = np.zeros((H, W, 3), np.float32)
    img += vgrad(GUNMETAL_LO, VOID, 0, H)
    # fine blueprint grid (register: blueprint-technical)
    gimg = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    gd = ImageDraw.Draw(gimg, "RGBA")
    boot = E.out_cubic(E.seg(f, S3, S3 + 26))
    for gx in range(0, W, 60):
        gd.line([(gx, 0), (gx, H)], fill=(*GLACIER_DIM, int(26 * boot)), width=1)
    for gy in range(0, H, 60):
        gd.line([(0, gy), (W, gy)], fill=(*GLACIER_DIM, int(26 * boot)), width=1)
    # outer bracket frame snapping in (fui-boot)
    bx0, by0, bx1, by1 = 70, 260, 1010, 1620
    bp = E.out_cubic(E.seg(f, S3, S3 + 30))
    cl = 70
    if bp > 0.02:
        for (cx0, cy0, dx, dy) in [(bx0, by0, 1, 1), (bx1, by0, -1, 1), (bx0, by1, 1, -1), (bx1, by1, -1, -1)]:
            gd.line([(cx0, cy0), (cx0 + dx * int(cl * bp), cy0)], fill=(*GLACIER, int(230 * bp)), width=4)
            gd.line([(cx0, cy0), (cx0, cy0 + dy * int(cl * bp))], fill=(*GLACIER, int(230 * bp)), width=4)
    im = gimg.convert("RGB")
    d = ImageDraw.Draw(im.convert("RGBA"), "RGBA")
    im = im.convert("RGBA")
    # three channels appear in sequence at beat8 (BEATS[7]), each fills with a live readout
    conv = E.in_out_cubic(E.seg(f, BEATS[8], BEATS[9] + 20))  # convergence begins at beat9, completes beat10
    cxN, cyN = (bx0 + bx1) / 2, 980
    rng = np.random.default_rng(21)
    for i, (x0, x1) in enumerate(CH_X):
        app = E.out_cubic(E.seg(f, BEATS[7] + i * 10, BEATS[7] + i * 10 + 30))
        if app <= 0.02:
            continue
        y0, y1 = CH_Y0, CH_Y1
        # channel slides toward center as convergence progresses, THEN fully fades (fill+outline+label+squiggle
        # all share the same (1-conv) factor so nothing outlives the box once it has converged into the gauge)
        ox = (cxN - (x0 + x1) / 2) * conv
        vis = app * (1 - conv)
        if vis <= 0.02:
            continue
        d = ImageDraw.Draw(im, "RGBA")
        d.rounded_rectangle([x0 + ox, y0, x1 + ox, y1], 14, fill=(16, 22, 30, int(225 * vis)),
                             outline=(*GLACIER, int(210 * vis)), width=2)
        lf = mono(20, b=True)
        d.text((x0 + ox + 16, y0 + 12), CH_LABELS[i], font=lf, fill=(*SNOW_WHITE, int(230 * vis)))
        logw(x0 + ox + 16, y0 + 12, tw(CH_LABELS[i], lf), 20, SNOW_WHITE, vis, app >= 0.9 and conv < 0.3, "hud")
        # live readout squiggle per channel
        pts = []
        for k in range(0, int((x1 - x0) - 32), 6):
            yy = y0 + 60 + 60 * math.sin(k * (0.05 + i * 0.02) + t * (3 + i) + rng.standard_normal() * 0.15)
            pts.append((x0 + ox + 16 + k, yy))
        if len(pts) > 1:
            d.line(pts, fill=(*MARIGOLD_HI, int(200 * vis)), width=3)
    # converged gauge: needle climbs to final position (beat10)
    gauge_a = E.out_cubic(E.seg(f, BEATS[9], BEATS[9] + 40))
    if gauge_a > 0.02:
        gcx, gcy, gr = cxN, 1000, 190
        d = ImageDraw.Draw(im, "RGBA")
        d.arc([gcx - gr, gcy - gr, gcx + gr, gcy + gr], 150, 390, fill=(*SLATE, int(160 * gauge_a)), width=10)
        needle_t = E.out_cubic(E.seg(f, BEATS[9], S4 - 20))
        ang = math.radians(150 + 240 * needle_t)
        nx, ny = gcx + gr * 0.86 * math.cos(ang), gcy + gr * 0.86 * math.sin(ang)
        d.arc([gcx - gr, gcy - gr, gcx + gr, gcy + gr], 150, 150 + 240 * needle_t, fill=(*MARIGOLD, int(230 * gauge_a)), width=10)
        d.line([(gcx, gcy), (nx, ny)], fill=(*MARIGOLD_HI, int(240 * gauge_a)), width=5)
        d.ellipse([gcx - 10, gcy - 10, gcx + 10, gcy + 10], fill=(*MARIGOLD_HI, int(240 * gauge_a)))
        rd_a = E.out_cubic(E.seg(f, BEATS[9] + 10, BEATS[9] + 40))
        if rd_a > 0.02:
            rf = mono(19, b=True); s = "YEARS OF FLIGHT DATA"
            d.text((gcx - tw(s, rf) / 2, gcy + gr + 26), s, font=rf, fill=(*SNOW_WHITE, int(220 * rd_a)))
            logw(gcx - tw(s, rf) / 2, gcy + gr + 26, tw(s, rf), 19, SNOW_WHITE, rd_a, rd_a >= 0.6, "hud")
    im = im.convert("RGB")
    im = snowfall(im, f, density=0.05, seed=13)
    prog = E.in_out_sine(E.seg(f, S3, S4))
    im = reframe(im, 0.5, 0.52, 1.0 - 0.05 * prog)
    return im

# ================================================================== SHOT 4 — THE BLANK LEDGER (macro, fullbleed-split) ==================================================================
def scene4_ledger(f):
    t = (f - S4) / FPS
    img = np.zeros((H, W, 3), np.float32)
    # left half: dying console glow (carried); right half: paper/ledger void
    for x in range(W):
        side = x / W
        base = np.array(GLACIER_DIM, np.float32) * (1 - side) + np.array(CHARCOAL, np.float32) * side
        img[:, x] = base
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    # residual gauge glow bleeding from the left edge (carried element)
    fade = 1 - E.seg(f, S4, S4 + 50)
    if fade > 0.02:
        im = glow_dot(im, (40, 960), 220 * fade, GLACIER, glow=0.5)
        d = ImageDraw.Draw(im, "RGBA")
    # the ledger page, right two-thirds
    px0, py0, px1, py1 = 260, 520, 1010, 1440
    page_a = E.out_cubic(E.seg(f, S4, S4 + 30))
    d.rounded_rectangle([px0, py0, px1, py1], 10, fill=(*PAPER, int(240 * page_a)))
    d.rounded_rectangle([px0, py0, px1, py1], 10, outline=(*PAPER_DIM, int(180 * page_a)), width=2)
    # a hand enters and halts the needle (represented as a simple wedge/finger shape at page's left edge)
    halt = E.out_cubic(E.seg(f, BEATS[10], BEATS[10] + 16))
    if halt > 0.02:
        hy = 760
        d.polygon([(px0 - 150 * (1 - halt), hy - 20), (px0 + 10, hy), (px0 - 150 * (1 - halt), hy + 20)],
                  fill=(58, 46, 38, int(255 * halt)))
        d.ellipse([px0 - 22, hy - 26, px0 + 26, hy + 26], outline=(*MARIGOLD, int(200 * halt)), width=3)
    # hand draws a dotted, unresolved guardrail line across the page (beat12), never fully resolving (beat13)
    draw_p = E.out_cubic(E.seg(f, BEATS[11], BEATS[12] + 24))
    if draw_p > 0.02:
        ly = 880
        seg_n = int(46 * draw_p)
        rng = np.random.default_rng(31)
        for i in range(seg_n):
            x0 = px0 + 40 + i * 14
            if x0 > px1 - 40:
                break
            wob = 5 * math.sin(i * 0.6 + t * 1.2) * (0.4 + 0.6 * (i / max(1, seg_n)))
            dissolve = 1.0 if i < seg_n - 8 else max(0.15, 1 - (i - (seg_n - 8)) / 8.0)
            d.line([(x0, ly + wob), (x0 + 7, ly + wob)], fill=(70, 56, 40, int(230 * dissolve)), width=3)
        stamp_a = E.out_cubic(E.seg(f, BEATS[11], BEATS[11] + 24))
        sf = mono(22, b=True); s = "GOVERNANCE RULES  ·  DRAFT, NOT YET ADOPTED"
        d.text((px0 + 40, ly + 30), s, font=sf, fill=(90, 72, 52, int(190 * stamp_a)))
        logw(px0 + 40, ly + 30, tw(s, sf), 22, (90, 72, 52), stamp_a * 0.75, False, "label")
        # hands finish the line into a solid baseline + place named plates (into shot5, drawn there too,
        # but the baseline solidifies here at the very end of shot4 as the carried anchor)
    im = im.convert("RGB")
    prog = E.in_out_sine(E.seg(f, S4, S5))
    im = reframe(im, 0.62, 0.55, 1.0 - 0.06 * prog)
    return im

# ================================================================== SHOT 5 — WHO DECIDES (eye-level rising row of hands + plates) ==================================================================
PLATES = ["ANTHC", "SOUTHCENTRAL", "MANIILAQ", "COMMUNITY"]

def scene5_row(f):
    t = (f - S5) / FPS
    img = np.zeros((H, W, 3), np.float32)
    img += vgrad((30, 32, 38), (14, 15, 18), 0, H)
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    base_y = 1120
    d.line([(140, base_y), (940, base_y)], fill=(*PAPER_DIM, 210), width=4)
    n = len(PLATES)
    slot_w = 800 / n
    for i, name in enumerate(PLATES):
        px = 140 + slot_w * (i + 0.5)
        rise = E.out_back(E.seg(f, BEATS[13] + i * 22, BEATS[13] + i * 22 + 30))
        if rise <= 0.01:
            continue
        py = base_y - 10 - int(140 * rise)
        d.rounded_rectangle([px - 92, py - 46, px + 92, py + 46], 10, fill=(*PAPER, int(235 * min(1, rise + 0.3))),
                             outline=(*SLATE, 200))
        pf = mono(19, b=True)
        d.text((px - tw(name, pf) / 2, py - 11), name, font=pf, fill=(30, 32, 38, 255))
        logw(px - tw(name, pf) / 2, py - 11, tw(name, pf), 19, (30, 32, 38), min(1, rise), rise >= 0.9, "hud")
        # a simple hand silhouette placing each plate (brief, as it locks in)
        arrive = E.seg(f, BEATS[13] + i * 22, BEATS[13] + i * 22 + 20)
        if arrive < 1.0:
            hy = py - 80 - int(120 * (1 - arrive))
            d.polygon([(px - 30, hy + 60), (px, hy), (px + 30, hy + 60)], fill=(52, 44, 38, int(230 * (1 - arrive * 0.3))))
    # miniature advisory gauge reappears at the end of the row (beat15), needle steady, clearly advisory
    adv = E.out_cubic(E.seg(f, BEATS[14], BEATS[14] + 26))
    if adv > 0.02:
        gx, gy, gr = 940, base_y - 190, 46
        d.arc([gx - gr, gy - gr, gx + gr, gy + gr], 150, 390, fill=(*SLATE, int(180 * adv)), width=6)
        ang = math.radians(150 + 240 * 0.62)
        d.line([(gx, gy), (gx + gr * 0.8 * math.cos(ang), gy + gr * 0.8 * math.sin(ang))],
               fill=(*MARIGOLD, int(230 * adv)), width=4)
        d.ellipse([gx - 6, gy - 6, gx + 6, gy + 6], fill=(*MARIGOLD_HI, int(230 * adv)))
        af = mono(15, m=True); s = "ADVISORY"
        d.text((gx - tw(s, af) / 2, gy + gr + 10), s, font=af, fill=(*SNOW_WHITE, int(200 * adv)))
        logw(gx - tw(s, af) / 2, gy + gr + 10, tw(s, af), 15, SNOW_WHITE, adv, adv >= 0.6, "label")
    im = im.convert("RGB")
    im = snowfall(im, f, density=0.04, seed=17)
    prog = E.out_cubic(E.seg(f, S5, S6))
    im = reframe(im, 0.5, 0.55, 1.0 - 0.03 * prog)
    return im

# ================================================================== SHOT 6 — THE HUMAN CALL (map bookend + outro) ==================================================================
def scene6_map_outro(f):
    t = (f - S6) / FPS
    img = np.zeros((H, W, 3), np.float32)
    img[:] = np.array(VOID, np.float32)
    n = noise_field(202, 2.0, 1.0)
    img += (n[..., None] * np.array([6, 8, 12], np.float32))
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    outline = [(120, 520), (260, 380), (460, 340), (620, 300), (820, 360), (960, 460), (1000, 640),
               (940, 860), (980, 1080), (880, 1260), (700, 1420), (500, 1460), (320, 1380), (200, 1200),
               (140, 980), (180, 780), (120, 620)]
    d.line(outline + [outline[0]], fill=(*SLATE, 130), width=3)
    for (vx, vy) in VILLAGES:
        d.ellipse([vx - 4, vy - 4, vx + 4, vy + 4], fill=(*SLATE, 120))
    im = im.convert("RGB")
    # plane travels a flight path toward the pin, arriving at beat17 (BEATS[16])
    START_XY = (900, 220)
    fly = E.in_out_sine(E.seg(f, S6, BEATS[16]))
    px = START_XY[0] + (PIN[0] - START_XY[0]) * fly
    py = START_XY[1] + (PIN[1] - START_XY[1]) * fly
    ang = math.atan2(PIN[1] - START_XY[1], PIN[0] - START_XY[0])
    im = im.convert("RGBA"); d = ImageDraw.Draw(im, "RGBA")
    # trailing streak (comet-like, not a static ring — avoids "missing image"/reticle glyphs)
    for k in range(1, 9):
        tt = max(0.0, fly - k * 0.012)
        tx = START_XY[0] + (PIN[0] - START_XY[0]) * tt; ty = START_XY[1] + (PIN[1] - START_XY[1]) * tt
        d.ellipse([tx - 4 + k * .3, ty - 4 + k * .3, tx + 4 - k * .3, ty + 4 - k * .3], fill=(*MARIGOLD, int(160 * (1 - k / 9))))
    plane_len = 22
    ptip = (px + plane_len * math.cos(ang), py + plane_len * math.sin(ang))
    ptail1 = (px - plane_len * 0.5 * math.cos(ang) + 10 * math.sin(ang), py - plane_len * 0.5 * math.sin(ang) - 10 * math.cos(ang))
    ptail2 = (px - plane_len * 0.5 * math.cos(ang) - 10 * math.sin(ang), py - plane_len * 0.5 * math.sin(ang) + 10 * math.cos(ang))
    d.polygon([ptip, ptail1, ptail2], fill=(*SNOW_WHITE, 255))
    pulse = 0.7 + 0.3 * math.sin(t * 2 * math.pi)
    im = im.convert("RGB"); im = glow_dot(im, PIN, 12 + 2 * pulse, MARIGOLD, glow=0.9); im = im.convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    # thumb physically presses a large tactile launch switch beside the pin, landing exactly on beat16 arrival
    press_x, press_y = PIN[0] + 130, PIN[1] - 10
    switch_a = E.out_cubic(E.seg(f, BEATS[15], BEATS[15] + 14))
    if switch_a > 0.02:
        d.rounded_rectangle([press_x - 60, press_y - 40, press_x + 60, press_y + 40], 14,
                             fill=(30, 32, 38, int(240 * switch_a)), outline=(*MARIGOLD, int(220 * switch_a)), width=3)
        press = E.out_cubic(E.seg(f, BEATS[16] - 6, BEATS[16] + 8))
        btn_y = press_y + int(10 * press)
        d.ellipse([press_x - 34, btn_y - 26, press_x + 34, btn_y + 26], fill=(*MARIGOLD, int(240 * switch_a)))
        # thumb wedge pressing down
        thumb = E.out_cubic(E.seg(f, BEATS[16] - 10, BEATS[16] + 6))
        if thumb > 0.02:
            ty0 = press_y - 150 + int(150 * thumb)
            d.polygon([(press_x - 26, ty0), (press_x + 26, ty0), (press_x + 14, btn_y - 10), (press_x - 14, btn_y - 10)],
                      fill=(58, 46, 38, int(240 * thumb)))
        if press >= 0.85:
            sf = mono(16, b=True); s = "CONFIRM LAUNCH"
            d.text((press_x - tw(s, sf) / 2, press_y + 46), s, font=sf, fill=(*SNOW_WHITE, int(210 * switch_a)))
            logw(press_x - tw(s, sf) / 2, press_y + 46, tw(s, sf), 16, SNOW_WHITE, switch_a, True, "hud")
    im = im.convert("RGB")
    im = snowfall(im, f, density=0.15, seed=23)
    prog = E.in_out_sine(E.seg(f, S6, NF))
    im = reframe(im, 0.5, 0.5, 1.0 - 0.03 * prog)
    return im

SCENES = [(S1, S2, scene1_map), (S2, S3, scene2_clinic), (S3, S4, scene3_panel),
          (S4, S5, scene4_ledger), (S5, S6, scene5_row), (S6, SEND, scene6_map_outro)]

TRANSITIONS = {1: "map-travel", 2: "fui-boot", 3: "match-cut", 4: "graphic-match", 5: "whip-pan"}

def scene_for(f):
    for i, (a, b, fn) in enumerate(SCENES):
        if a <= f < b:
            return i, fn
    return len(SCENES) - 1, SCENES[-1][2]

def render_world(f):
    """Composite the active scene, blending across a declared transition at each shot boundary."""
    idx, fn = scene_for(f)
    img = fn(min(f, SCENES[idx][1] - 1))
    if idx > 0:
        bstart = SCENES[idx][0]
        kind = TRANSITIONS.get(idx, "crossfade")
        win = 8 if kind == "whip-pan" else TR  # a whip-pan is a QUICK smear (~6-10f), not a long dissolve
        if f < bstart + win:
            prev_fn = SCENES[idx - 1][2]
            a_img = prev_fn(bstart - 1)
            local_t = max(0.0, min(1.0, (f - (bstart - win)) / (2 * win)))
            if kind == "whip-pan":
                img = whip(a_img, img, local_t)
            elif kind in ("match-cut", "graphic-match"):
                img = xfade(a_img, img, E.in_out_cubic(local_t))
            elif kind == "map-travel":
                m = Image.new("L", (W, H), 0)
                r = int(1350 * E.out_cubic(local_t))
                ImageDraw.Draw(m).ellipse([PIN[0] - r, PIN[1] - r, PIN[0] + r, PIN[1] + r], fill=255)
                img = mask_wipe(a_img, img, m.filter(ImageFilter.GaussianBlur(30)))
            else:
                img = xfade(a_img, img, local_t)
    return img

# ================================================================== main frame render ==================================================================
def render_frame(f):
    world = render_world(f)
    seed = 5000 + f
    out = Image.fromarray(finish(np.asarray(world.convert("RGB")), seed))
    out = out.filter(ImageFilter.UnsharpMask(radius=2.2, percent=90, threshold=2)).convert("RGBA")
    du = ImageDraw.Draw(out, "RGBA")
    # caption scrim (keeps captions legible over any background)
    cue_now = any(c["s"] - 0.30 <= f / FPS < c["e"] + 0.20 for c in dc.CUES)
    if cue_now:
        sd = ImageDraw.Draw(out, "RGBA")
        for yy in range(1392, 1612, 2):
            edge = abs((yy - 1502) / 110.0); al = int(170 * max(0.0, 1 - edge * edge))
            sd.line([(70, yy), (W - 70, yy)], fill=(5, 11, 20, al), width=2)
    if dc.LOGTEXT and f % 6 == 0:
        set_frame_bg(out, f, clear=True)
    # eyebrow (brand throughline)
    eb = E.out_cubic(E.seg(f, 6, 30))
    if eb > 0:
        tk(du, "ALASKA.AI", mono(18, True), (255, 222, 120, int(220 * eb)), 96, 70, 0.14)
        tk(du, "/  FIELD SIGNAL", mono(18), (214, 230, 245, int(150 * eb)), 96 + tw("ALASKA.AI", mono(18, True), .14) + 16, 70, 0.14)
    # location tag
    lc = E.out_cubic(E.seg(f, 20, 54))
    if lc > 0:
        s = "RURAL ALASKA · MEDEVAC AI"; lf = mono(17, m=True)
        tk(du, s, lf, (214, 230, 245, int(180 * lc)), 96, 104, 0.10)
    caption(out, f)
    outro_card(out, f)
    so = E.out_cubic(E.seg(f, 8, 34))
    if so > 0 and f < SPEECH_END_F + 14:
        sf = fr(36, 900, 144); s = "alaska.ai"
        tk(du, s, sf, (255, 255, 255, int(150 * so)), (W - tw(s, sf)) // 2, 1712)
    # near-instant opening reveal (NOT a slow fade-up): the cold-open pin must be visible at frame 1
    fin = E.seg(f, 0, 4)
    if fin < 1:
        out.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(180 * (1 - E.out_cubic(fin))))))
    outf = E.seg(f, NF - 85, NF)
    if outf > 0:
        out.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(248 * E.in_out_sine(outf)))))
    if dc.LOGTEXT and f % 6 == 0:
        os.makedirs(os.path.join(HERE, "textlog"), exist_ok=True)
        json.dump(dc.TEXTLOG, open(os.path.join(HERE, "textlog", f"frame_{f:05d}.json"), "w"))
    return out.convert("RGB")

def write_manifests():
    shots = [
        {"id": 1, "start": S1, "end": S2, "framing": "wide-establish", "transition_in": "", "note": "map"},
        {"id": 2, "start": S2, "end": S3, "framing": "push-detail", "transition_in": "map-travel", "note": "clinic"},
        {"id": 3, "start": S3, "end": S4, "framing": "data-panel", "transition_in": "fui-boot", "note": "panel"},
        {"id": 4, "start": S4, "end": S5, "framing": "two-up", "transition_in": "match-cut", "note": "ledger"},
        {"id": 5, "start": S5, "end": S6, "framing": "subject-portrait", "transition_in": "graphic-match", "note": "row"},
        {"id": 6, "start": S6, "end": SEND, "framing": "map-territory", "transition_in": "whip-pan", "note": "map+outro"},
    ]
    dc.write_shots(shots, NF, path=os.path.join(HERE, "shots.json"))
    events = [
        {"t": 0.3, "kind": "pulse", "label": "pin heartbeat pulse"},
        {"t": BEATS[1] / FPS, "kind": "pulse", "label": "pin pulse continues"},
        {"t": BEATS[2] / FPS, "kind": "whoosh", "label": "map-travel into clinic"},
        {"t": BEATS[3] / FPS, "kind": "tick", "label": "monitor beep"},
        {"t": BEATS[4] / FPS, "kind": "hit", "label": "radio key-click"},
        {"t": BEATS[6] / FPS, "kind": "pop", "label": "fui-boot brackets snap"},
        {"t": (BEATS[7] + 5) / FPS, "kind": "tick", "label": "channel 1 lock"},
        {"t": (BEATS[7] + 15) / FPS, "kind": "tick", "label": "channel 2 lock"},
        {"t": (BEATS[7] + 25) / FPS, "kind": "tick", "label": "channel 3 lock"},
        {"t": BEATS[8] / FPS, "kind": "riser", "label": "convergence begins"},
        {"t": (BEATS[9] + 30) / FPS, "kind": "hit", "label": "gauge needle settles"},
        {"t": BEATS[10] / FPS, "kind": "hit", "label": "hand halts the needle"},
        {"t": BEATS[11] / FPS, "kind": "tick", "label": "pen-scratch begins"},
        {"t": BEATS[13] / FPS, "kind": "lock", "label": "first plate locks"},
        {"t": (BEATS[13] + 44) / FPS, "kind": "lock", "label": "second plate locks"},
        {"t": (BEATS[13] + 66) / FPS, "kind": "lock", "label": "third plate locks"},
        {"t": BEATS[14] / FPS, "kind": "pulse", "label": "advisory gauge resolve"},
        {"t": BEATS[15] / FPS, "kind": "whoosh", "label": "whip-pan to map"},
        {"t": BEATS[16] / FPS, "kind": "hit", "label": "switch-press thunk"},
        {"t": (SPEECH_END_F + 10) / FPS, "kind": "boom", "label": "wordmark resolve chime"},
    ]
    dc.write_sfx_events(events, path=os.path.join(HERE, "audio", "sfx_events.json"))

def main():
    a = sys.argv[1:]
    write_manifests()
    if a and a[0] == "test":
        td = os.path.join(HERE, "test_launchcall"); os.makedirs(td, exist_ok=True)
        for f in [int(x) for x in a[1:]]:
            render_frame(f).save(os.path.join(td, f"t_{f:05d}.png")); print("test", f, file=sys.stderr)
        return
    s, e = int(a[0]), int(a[1])
    for f in range(s, e):
        render_frame(f).save(os.path.join(FR, f"frame_{f:05d}.png"))
        if f % 50 == 0:
            print("frame", f, file=sys.stderr)
    print("done", file=sys.stderr)

if __name__ == "__main__":
    main()
