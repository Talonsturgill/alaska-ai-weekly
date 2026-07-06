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

HAND_COLOR = (86, 66, 50)

def _vol_rect(d, box, radius, color, alpha, light_corner="tl"):
    """A rounded rect with a cheap key/fill volumetric cue (a soft highlight on one corner, a soft
    shadow on the opposite corner) instead of a single flat fill — so hero shapes read as rounded
    3D forms, not flat single-tone silhouettes."""
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(*color, alpha))
    w, h = x1 - x0, y1 - y0
    hl = tuple(min(255, int(c * 1.5 + 20)) for c in color)
    sh = tuple(int(c * 0.5) for c in color)
    if light_corner == "tl":
        d.rounded_rectangle([x0, y0, x1 - w * 0.30, y0 + h * 0.45], radius=radius * 0.7, fill=(*hl, int(alpha * 0.38)))
        d.rounded_rectangle([x0 + w * 0.35, y1 - h * 0.4, x1, y1], radius=radius * 0.7, fill=(*sh, int(alpha * 0.32)))
    else:  # "left" — light from the left edge (for hands reaching in from that side)
        d.rounded_rectangle([x0, y0, x0 + w * 0.4, y1], radius=radius * 0.7, fill=(*hl, int(alpha * 0.38)))
        d.rounded_rectangle([x1 - w * 0.35, y0, x1, y1], radius=radius * 0.7, fill=(*sh, int(alpha * 0.30)))

def draw_hand_down(d, tip_x, tip_y, scale=1.0, alpha=255, color=HAND_COLOR):
    """A recognizable hand (palm + 4 fingers + thumb + wrist) reaching DOWN from above; fingertips
    rest at (tip_x, tip_y). Sized to read clearly even at thumbnail scale (per Gate B: the earlier
    triangle-wedge markers were too small/abstract to register as a human hand)."""
    gy = tip_y + 10 * scale
    d.ellipse([tip_x - 46 * scale, gy - 12 * scale, tip_x + 46 * scale, gy + 12 * scale], fill=(0, 0, 0, int(70 * (alpha / 255))))
    for fx, flen in ((-30, 34), (-10, 44), (10, 42), (30, 30)):  # index..pinky, middle longest
        x0 = tip_x + (fx - 7) * scale; x1 = tip_x + (fx + 7) * scale
        y1 = tip_y; y0 = tip_y - flen * scale
        _vol_rect(d, [x0, y0, x1, y1], 6 * scale, color, alpha)
    py1 = tip_y - 28 * scale; py0 = py1 - 58 * scale
    _vol_rect(d, [tip_x - 38 * scale, py0, tip_x + 38 * scale, py1], 16 * scale, color, alpha)
    _vol_rect(d, [tip_x + 32 * scale, py1 - 34 * scale, tip_x + 60 * scale, py1 - 2 * scale], 10 * scale, color, alpha)
    _vol_rect(d, [tip_x - 24 * scale, py0 - 46 * scale, tip_x + 24 * scale, py0 + 8 * scale], 10 * scale, color, alpha)

def draw_hand_left(d, tip_x, tip_y, scale=1.0, alpha=255, color=HAND_COLOR):
    """A recognizable hand reaching in from the LEFT; fingertips rest at (tip_x, tip_y)."""
    for fy, flen in ((-30, 34), (-10, 44), (10, 42), (30, 30)):
        y0 = tip_y + (fy - 7) * scale; y1 = tip_y + (fy + 7) * scale
        x1 = tip_x; x0 = tip_x - flen * scale
        _vol_rect(d, [x0, y0, x1, y1], 6 * scale, color, alpha, "left")
    px1 = tip_x - 28 * scale; px0 = px1 - 58 * scale
    _vol_rect(d, [px0, tip_y - 38 * scale, px1, tip_y + 38 * scale], 16 * scale, color, alpha, "left")
    _vol_rect(d, [px1 - 34 * scale, tip_y - 60 * scale, px1 - 2 * scale, tip_y - 32 * scale], 10 * scale, color, alpha, "left")
    _vol_rect(d, [px0 - 46 * scale, tip_y - 24 * scale, px0 + 8 * scale, tip_y + 24 * scale], 10 * scale, color, alpha, "left")

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
    # a faint landmass fill + inner rim-shadow so the territory reads as ground, not just a wireframe
    d.polygon(outline, fill=(20, 23, 28, int(120 * reveal)))
    d.line(outline + [outline[0]], fill=(*SLATE, int(70 * reveal)), width=10, joint="curve")
    d.line(outline + [outline[0]], fill=(*SLATE, int(150 * reveal)), width=3)
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
    # the health aide — an actual human silhouette (head + shoulders), the HERO of this shot, not a
    # disembodied icon — holding a radio handset up near their face. Reaches in at beat4.
    reach = E.out_cubic(E.seg(f, BEATS[3] - 14, BEATS[3] + 40))
    hx, hy = 620, 1280 + int((1 - reach) * 320)
    if reach > 0.02:
        pa = int(255 * reach)
        SIL = (9, 8, 8)  # near-black — must read as a clear silhouette against the lit wall, not blend in
        # shoulders + torso (rounded-top silhouette, runs off the bottom of frame)
        d.rounded_rectangle([hx - 190, hy + 140, hx + 190, H + 40], 90, fill=(*SIL, pa))
        # neck + head
        d.rectangle([hx - 34, hy + 60, hx + 34, hy + 150], fill=(*SIL, pa))
        d.ellipse([hx - 88, hy - 70, hx + 88, hy + 96], fill=(*SIL, pa))
        # a thin cool rim-light along the head/shoulder edge (window-light from behind) so the
        # silhouette pops from the wall instead of reading as a same-tone smudge
        d.arc([hx - 88, hy - 70, hx + 88, hy + 96], 200, 340, fill=(*GLACIER, int(160 * reach)), width=4)
        d.arc([hx - 190, hy + 140, hx + 190, H + 40], 190, 260, fill=(*GLACIER, int(110 * reach)), width=4)
        # forearm raising the handset to the head
        d.line([(hx + 150, hy + 220), (hx + 40, hy + 10)], fill=(*SIL, pa), width=64)
        # radio handset, held at ear height
        d.rounded_rectangle([hx + 6, hy - 110, hx + 118, hy + 30], 24, fill=(38, 40, 46, pa),
                             outline=(*SNOW_WHITE, int(150 * reach)), width=3)
        d.rounded_rectangle([hx + 24, hy - 84, hx + 92, hy - 26], 8, fill=(*GLACIER_DIM, int(220 * reach)))
        key = E.out_cubic(E.seg(f, BEATS[4], BEATS[4] + 10)) * (1 - E.seg(f, BEATS[4] + 10, BEATS[4] + 30))
        if key > 0.02:
            im = glow_dot(im, (hx + 62, hy - 55), 54 * key, MARIGOLD, glow=key)
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
        # each channel gets its OWN distinct instrument face, not a generic sine squiggle for all three
        cw = int((x1 - x0) - 32); cx0 = x0 + ox + 16; cy0 = y0 + 60
        col = (*MARIGOLD_HI, int(200 * vis))
        if i == 0:  # VITALS — an ECG-style spike train (a heartbeat, not a wobble)
            pts = []
            for k in range(0, cw, 4):
                ph = (k / 34 + t * 1.6) % 1.0
                yy = 0.0
                if 0.42 < ph < 0.46: yy = -34
                elif 0.46 <= ph < 0.50: yy = 46
                elif 0.50 <= ph < 0.54: yy = -14
                pts.append((cx0 + k, cy0 + yy))
            d.line(pts, fill=col, width=3)
        elif i == 1:  # WEATHER — a radar sweep arc with a rotating beam
            rcx, rcy, rr = cx0 + cw / 2, cy0 + 46, 58
            d.arc([rcx - rr, rcy - rr, rcx + rr, rcy + rr], 0, 360, fill=(*GLACIER, int(140 * vis)), width=2)
            d.arc([rcx - rr * .6, rcy - rr * .6, rcx + rr * .6, rcy + rr * .6], 0, 360, fill=(*GLACIER, int(110 * vis)), width=1)
            sweep = (t * 90) % 360
            bx = rcx + rr * math.cos(math.radians(sweep)); by = rcy + rr * math.sin(math.radians(sweep))
            d.line([(rcx, rcy), (bx, by)], fill=col, width=3)
            for blip_ang in (40, 160, 260):
                bxx = rcx + rr * 0.7 * math.cos(math.radians(blip_ang)); byy = rcy + rr * 0.7 * math.sin(math.radians(blip_ang))
                if (sweep - blip_ang) % 360 < 50:
                    d.ellipse([bxx - 4, byy - 4, bxx + 4, byy + 4], fill=(*MARIGOLD_HI, int(220 * vis)))
        else:  # AIRCRAFT — a status ladder (altitude/fuel/link bars), not a waveform
            for bi in range(5):
                bx0_ = cx0 + bi * (cw / 5) + 6; bw = cw / 5 - 12
                lvl = 0.35 + 0.5 * abs(math.sin(t * 1.1 + bi * 0.7))
                bh = 70 * lvl
                d.rectangle([bx0_, cy0 + 78 - bh, bx0_ + bw, cy0 + 78], fill=col)
            d.text((cx0, cy0 - 6), "LINK OK", font=mono(13, m=True), fill=(*GLACIER, int(200 * vis)))
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
    # the ledger page, right two-thirds — a soft paper-grain gradient + drop shadow, not a flat fill
    px0, py0, px1, py1 = 260, 520, 1010, 1440
    page_a = E.out_cubic(E.seg(f, S4, S4 + 30))
    d.rounded_rectangle([px0 + 14, py0 + 20, px1 + 14, py1 + 20], 10, fill=(0, 0, 0, int(90 * page_a)))  # drop shadow
    for yy in range(py0, py1, 2):
        shade = 1.0 - 0.10 * ((yy - py0) / max(1, py1 - py0))  # subtle top-lit gradient across the page
        col = tuple(int(c * shade) for c in PAPER)
        d.line([(px0, yy), (px1, yy)], fill=(*col, int(240 * page_a)), width=2)
    d.rounded_rectangle([px0, py0, px1, py1], 10, outline=(*PAPER_DIM, int(180 * page_a)), width=2)
    # a HAND enters from the left and physically halts the carried gauge glow at the page's edge
    halt = E.out_back(E.seg(f, BEATS[10], BEATS[10] + 16))  # a slight overshoot as the hand CATCHES the needle
    hy = 760
    if halt > 0.02:
        # impact ring at the moment of the catch — reads as a hit even in a single still frame
        impact = E.seg(f, BEATS[10], BEATS[10] + 14)
        if 0 < impact < 1:
            ring_r = 28 + 46 * impact
            d.ellipse([px0 - ring_r, hy - ring_r, px0 + ring_r, hy + ring_r],
                      outline=(*MARIGOLD, int(190 * (1 - impact))), width=int(max(1, 4 * (1 - impact))))
        d.ellipse([px0 - 26, hy - 30, px0 + 30, hy + 30], outline=(*MARIGOLD, int(200 * min(1, halt))), width=3)
        draw_hand_left(d, px0 + 6, hy, scale=1.05, alpha=int(255 * min(1, halt)))
    # hand draws a dotted, unresolved guardrail line across the page (beat12), never fully resolving (beat13)
    draw_p = E.out_cubic(E.seg(f, BEATS[11], BEATS[12] + 24))
    if draw_p > 0.02:
        ly = 880
        seg_n = int(46 * draw_p)
        rng = np.random.default_rng(31)
        last_xy = (px0 + 40, ly)
        for i in range(seg_n):
            x0 = px0 + 40 + i * 14
            if x0 > px1 - 40:
                break
            wob = 5 * math.sin(i * 0.6 + t * 1.2) * (0.4 + 0.6 * (i / max(1, seg_n)))
            dissolve = 1.0 if i < seg_n - 8 else max(0.15, 1 - (i - (seg_n - 8)) / 8.0)
            d.line([(x0, ly + wob), (x0 + 7, ly + wob)], fill=(70, 56, 40, int(230 * dissolve)), width=3)
            last_xy = (x0 + 7, ly + wob)
        # the hand that is DOING the drawing travels along the line and fades once it's finished (before dissolve)
        drawing_now = draw_p < 0.96
        if drawing_now:
            draw_hand_left(d, last_xy[0] + 4, last_xy[1], scale=0.95, alpha=int(255 * min(1.0, draw_p * 3)))
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
        pa = int(235 * min(1, rise + 0.3))
        # squash-and-stretch impact: visible even in a single freeze-frame (unlike pure position
        # overshoot, which only reads across motion) — the plate briefly flattens+widens on landing
        settle_prog = E.seg(f, BEATS[13] + i * 22 + 22, BEATS[13] + i * 22 + 34)
        squash = math.sin(math.pi * settle_prog) * (1 - settle_prog) if 0 < settle_prog < 1 else 0
        hw = 92 * (1 + 0.16 * squash); hh = 46 * (1 - 0.16 * squash)
        d.rounded_rectangle([px - 90, py - 42, px + 94, py + 50], 10, fill=(0, 0, 0, int(90 * (pa / 235))))  # drop shadow
        _vol_rect(d, [px - hw, py - hh, px + hw, py + hh], 10, PAPER, pa)
        d.rounded_rectangle([px - hw, py - hh, px + hw, py + hh], 10, outline=(*SLATE, 200))
        pf = mono(19, b=True)
        d.text((px - tw(name, pf) / 2, py - 11), name, font=pf, fill=(30, 32, 38, 255))
        logw(px - tw(name, pf) / 2, py - 11, tw(name, pf), 19, (30, 32, 38), min(1, rise), rise >= 0.9, "hud")
        # a recognizable HAND places each plate (reaches down from above, releases once it locks in)
        arrive = E.seg(f, BEATS[13] + i * 22, BEATS[13] + i * 22 + 20)
        if arrive < 1.08:
            hand_alpha = int(255 * (1 - max(0.0, arrive - 0.85) / 0.23)) if arrive > 0.85 else 255
            if hand_alpha > 8:
                hy = py - 46 - int(90 * (1 - min(1.0, arrive)))
                draw_hand_down(d, px, hy, scale=0.95, alpha=hand_alpha)
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
    d.polygon(outline, fill=(20, 23, 28, 120))
    d.line(outline + [outline[0]], fill=(*SLATE, 70), width=10, joint="curve")
    d.line(outline + [outline[0]], fill=(*SLATE, 150), width=3)
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
    # a HUMAN HAND physically presses a large tactile launch button beside the pin — this is the thesis
    # shot ("a person's hand, not the model, makes the call"), so the hand must be unmistakable, large,
    # and the button must read as a physical object (a beveled metal plate), never a floating UI dialog.
    press_x, press_y = PIN[0] + 150, PIN[1] - 10
    switch_a = E.out_cubic(E.seg(f, BEATS[15], BEATS[15] + 14))
    if switch_a > 0.02:
        # beveled mounting plate (embossed look: lighter top-left rim, darker bottom-right rim)
        d.rounded_rectangle([press_x - 74, press_y - 56, press_x + 74, press_y + 56], 16,
                             fill=(26, 28, 33, int(245 * switch_a)))
        d.arc([press_x - 74, press_y - 56, press_x + 74, press_y + 56], 200, 20, fill=(80, 86, 96, int(180 * switch_a)), width=3)
        d.arc([press_x - 74, press_y - 56, press_x + 74, press_y + 56], 20, 200, fill=(8, 9, 11, int(200 * switch_a)), width=3)
        press = E.out_back(E.seg(f, BEATS[16] - 6, BEATS[16] + 10))  # overshoot: the button pops past rest, then settles
        btn_y = press_y + int(10 * press)
        btn_r = 40 - int(4 * press)  # button visibly depresses when pressed
        # impact ring: an expanding, fading shockwave at the instant of contact — reads as a hit even
        # frozen in a single still frame, not just a position change across frames
        impact = E.seg(f, BEATS[16], BEATS[16] + 16)
        if 0 < impact < 1:
            ring_r = btn_r + 70 * impact
            d.ellipse([press_x - ring_r, btn_y - ring_r, press_x + ring_r, btn_y + ring_r],
                      outline=(*MARIGOLD_HI, int(200 * (1 - impact) * switch_a)), width=int(max(1, 5 * (1 - impact))))
        d.ellipse([press_x - btn_r, btn_y - btn_r, press_x + btn_r, btn_y + btn_r], fill=(*MARIGOLD, int(245 * switch_a)))
        d.ellipse([press_x - btn_r, btn_y - btn_r, press_x + btn_r * .3, btn_y - btn_r * .3],
                   fill=(*MARIGOLD_HI, int(140 * switch_a)))  # a highlight so the button reads as a lit, raised object
        # the hand: large, clear, descending from directly above to press the button
        hand_t = E.out_cubic(E.seg(f, BEATS[16] - 22, BEATS[16] + 2))
        if hand_t > 0.02:
            hand_y = (press_y - 130) + (btn_y - (press_y - 130)) * hand_t
            draw_hand_down(d, press_x, hand_y + btn_r * 0.5, scale=1.35, alpha=int(255 * switch_a))
        if press >= 0.85:
            sf = mono(15, b=True); s = "LAUNCH"  # NOT "confirm" — the person decides, doesn't ratify the model
            d.text((press_x - tw(s, sf) / 2, press_y + 66), s, font=sf, fill=(*SNOW_WHITE, int(200 * switch_a)))
            logw(press_x - tw(s, sf) / 2, press_y + 66, tw(s, sf), 15, SNOW_WHITE, switch_a, True, "hud")
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
    # two full-frame resolve flashes in the closing stretch (switch-press thunk + wordmark reveal) —
    # the outro's text-only reveals are too localized to register as EVENT_CADENCE spikes on their own
    wordmark_start = max(1600, SPEECH_END_F + 14)
    for center, col in ((BEATS[16], MARIGOLD_HI), (wordmark_start, (255, 236, 200))):
        d_f = f - center
        if -3 <= d_f <= 10:
            flash = math.exp(-max(0, d_f) / 3.2) * (1.0 if d_f >= 0 else (1 + d_f / 3))
            out.alpha_composite(Image.new("RGBA", (W, H), (*col, int(70 * flash))))
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
