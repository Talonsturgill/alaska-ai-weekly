"""render_circuit.py — "The Circuit That Won't Close" (Dispatch 2026-07-02)

Authored FRESH to out/dispatch/storyboard.json (rev 3, critic-shipped). A living print-brutalist
ledger on warm parchment: stamps, ink bleed, chits, a draining gas band, a strangled turbine, and
a circuit whose breaker never closes. Imports the scene-agnostic craft from dispatch_core (type
system, finish/grade, caption timing, textlog, shot manifest) and builds every composition new.

  python render_circuit.py <start_frame> <end_frame>     # render a chunk of frames_v3/
"""
import os, sys, math, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import dispatch_core as dc
import easing as E

HERE = os.path.dirname(os.path.abspath(__file__))
FR_DIR = os.path.join(HERE, "frames_v3"); os.makedirs(FR_DIR, exist_ok=True)
W, H, FPS = dc.W, dc.H, dc.FPS
NF = 1920                                    # 64.0s
S = lambda sec: int(round(sec * FPS))        # seconds -> frame

# ---------------- the color world (this run's palette; brand type accents stay in dc) ----------------
PARCH  = (234, 227, 212)   # warm parchment field
PARCH_HI = (241, 236, 224) # lighter chit paper
INK    = (33, 29, 24)      # carbon ink
INK_SOFT = (55, 50, 43)
VERM   = (217, 72, 28)     # hot vermilion (marks, stamps)
VERM_HI = (255, 172, 104)  # vermilion-bright highlight (active caption word) — luma ~183 clears the readability floor mid-fade
PEWTER = (141, 151, 160)   # cold pewter (ghosts, frost, dotted PROPOSED)
BRASS  = (169, 138, 74)    # aged brass (source chips only)
GOLD   = dc.GOLD           # brand wordmark accent (outro only)

SHOT_F = [(0, S(12.2)), (S(12.2), S(25.2)), (S(25.2), S(39.7)), (S(39.7), S(51.3)), (S(51.3), S(60.4)), (S(60.4), NF)]

# ---------------- paper ----------------
_rngP = np.random.default_rng(20260702)
_fiber = None
def _fiber_map():
    global _fiber
    if _fiber is None:
        n = _rngP.standard_normal((H // 2, W // 2)).astype(np.float32)
        from scipy.ndimage import gaussian_filter
        n = gaussian_filter(n, 1.6) * 2.2 + gaussian_filter(n, 7.0) * 1.6
        n = np.asarray(Image.fromarray(((n - n.min()) / (n.ptp() + 1e-6) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32)
        _fiber = (n / 255.0 - 0.5)
    return _fiber

def paper(f, tone=PARCH, drift=1.0):
    """The parchment field: fiber texture w/ slow drift + soft top-light."""
    fib = _fiber_map()
    off = int((f * 0.22) % 40) if drift else 0
    fib = np.roll(fib, off, axis=0)
    base = np.zeros((H, W, 3), np.float32); base[...] = tone
    base += fib[..., None] * 9.0
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    base *= (1.015 - 0.055 * yy)[..., None]                      # gentle top light
    return np.clip(base, 0, 255)

# ---------------- print craft helpers ----------------
def ink_text(d, xy, s, font, col=INK, misreg=0.0, a=1.0, tr=0.0):
    """Type with optional print misregistration (a 1px offset vermilion ghost under ink)."""
    x, y = xy
    if misreg > 0:
        d.text((x + misreg, y + misreg * 0.6), s, font=font, fill=(*VERM, int(70 * a)))
    if tr:
        dc.tk(d, s, font, (*col, int(255 * a)), int(x), int(y), tr)
    else:
        d.text((x, y), s, font=font, fill=(*col, int(255 * a)))

def slug(d, cx, y, s, font, pad=(26, 12), ink=INK, fg=PARCH, a=1.0, tick=True, tr=0.0, cy_center=False):
    """A reversed-out print slug: solid ink bar, parchment type, small vermilion tick. Returns rect."""
    tw_ = dc.tw(s, font, tr); h = font.size
    x0 = int(cx - tw_ / 2 - pad[0]); x1 = int(cx + tw_ / 2 + pad[0])
    y0 = int(y - (h // 2 + pad[1]) if cy_center else y); y1 = y0 + h + 2 * pad[1]
    d.rounded_rectangle([x0, y0, x1, y1], 6, fill=(*ink, int(242 * a)))
    if tick: d.rectangle([x0, y0, x0 + 7, y1], fill=(*VERM, int(255 * a)))
    ty = y0 + pad[1] - int(h * 0.12)
    if tr: dc.tk(d, s, font, (*fg, int(255 * a)), x0 + pad[0] + (10 if tick else 0), ty, tr)
    else: d.text((x0 + pad[0] + (10 if tick else 0), ty), s, font=font, fill=(*fg, int(255 * a)))
    return (x0, y0, x1, y1)

def stamp_p(f, t0, dur=0.45):
    """Stamp entrance progress: 0 before t0; overshoot-settle after. Returns (scale, alpha)."""
    p = float(E.seg(f, S(t0), S(t0) + int(dur * FPS)))
    if p <= 0: return 0.0, 0.0
    sc = 1.0 + 0.22 * (1.0 - float(E.out_back(p, 0.9)))
    return sc, float(E.out_quart(p))

def shake(f, t0, amp=5.0, dur=0.30):
    """Paper shake right after a stamp impact."""
    p = float(E.seg(f, S(t0), S(t0) + int(dur * FPS)))
    if p <= 0 or p >= 1: return 0, 0
    k = (1 - p) * amp
    return int(k * math.sin(p * 31.4)), int(0.6 * k * math.cos(p * 24.0))

def bleed(layer, r=1.1):
    """Ink bleed: soften a text/mark layer slightly so it sits IN the paper, then re-bite."""
    soft = layer.filter(ImageFilter.GaussianBlur(r))
    return Image.blend(soft, layer, 0.55)

def torn_chit(w, h, seed=3):
    """A lighter paper chit with a torn right+bottom edge; returns RGBA image."""
    rng = np.random.default_rng(seed)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    pts = [(0, 6), (w - 14, 0)]
    for i in range(9):                                          # torn right edge
        pts.append((w - 6 - int(rng.uniform(0, 9)), int(h * (i + 1) / 10)))
    pts += [(w - 10, h - 4)]
    for i in range(9):                                          # torn bottom edge
        pts.append((int(w * (9 - i) / 10), h - 3 - int(rng.uniform(0, 8))))
    pts += [(4, h - 8)]
    d.polygon(pts, fill=(*PARCH_HI, 255), outline=(*INK_SOFT, 90))
    return im

def house(d, x, y, s, fill=None, outline=INK, wd=3, a=1.0):
    """A little house glyph (the demand unit)."""
    if fill: d.polygon([(x, y + s*0.42), (x + s/2, y), (x + s, y + s*0.42), (x + s, y + s), (x, y + s)], fill=(*fill, int(255*a)))
    d.polygon([(x, y + s*0.42), (x + s/2, y), (x + s, y + s*0.42), (x + s, y + s), (x, y + s)], outline=(*outline, int(255*a)), width=wd)

# ---------------- Alaska silhouette (stylized evidence exhibit) ----------------
AK = [(0.32,0.06),(0.55,0.04),(0.72,0.10),(0.80,0.08),(0.86,0.14),(0.84,0.26),(0.86,0.60),
      (0.98,0.94),(0.92,0.96),(0.80,0.74),(0.72,0.62),(0.62,0.62),(0.60,0.70),(0.50,0.78),
      (0.38,0.72),(0.26,0.86),(0.04,0.96),(0.14,0.82),(0.22,0.72),(0.12,0.66),(0.20,0.58),
      (0.10,0.50),(0.20,0.42),(0.14,0.32),(0.24,0.24),(0.18,0.14)]
BASES = [("JBER", 0.50, 0.70), ("CLEAR SFS", 0.545, 0.50), ("EIELSON AFB", 0.615, 0.365)]

def draw_alaska(d, ox, oy, sw, sh, a=1.0, hatch=True):
    pts = [(ox + p[0] * sw, oy + p[1] * sh) for p in AK]
    d.polygon(pts, outline=(*INK, int(255 * a)), width=4)
    if hatch:
        for i in range(0, sw, 14):                              # diagonal hatching, clipped roughly by bbox rows
            d.line([(ox + i, oy + sh), (ox + i + sh * 0.35, oy + sh * 0.62)], fill=(*INK, int(26 * a)), width=2)

# ---------------- the 12 parcel chits (graphic-match anchor, S1 -> S2) ----------------
CHIP_W, CHIP_H, CHIP_GAP = 56, 40, 14
CHIPS_X0 = (W - (12 * CHIP_W + 11 * CHIP_GAP)) // 2
CHIPS_Y = 1290

def draw_chips(d, f, t0, a=1.0):
    for i in range(12):
        p = float(E.seg(f, S(t0) + i * 5, S(t0) + i * 5 + 9))
        if p <= 0: continue
        x = CHIPS_X0 + i * (CHIP_W + CHIP_GAP); y = CHIPS_Y - int((1 - E.out_back(p, 0.6)) * 18)
        d.rounded_rectangle([x, y, x + CHIP_W, y + CHIP_H], 4, fill=(*INK, int(235 * a * p)))
        d.rectangle([x, y + CHIP_H - 6, x + CHIP_W, y + CHIP_H], fill=(*VERM, int(200 * a * p)))

# ============================================================ SHOT 1 · THE ASK (0-9s)
def scene1(f):
    img = Image.fromarray(paper(f).astype(np.uint8)).convert("RGBA")
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    dx, dy = shake(f, 0.55, 6.0)
    # eyebrow
    eb = dc.mono(30, b=True); s_ = "ALASKA.AI DISPATCH"
    ink_text(d, ((W - dc.tw(s_, eb, 0.24)) / 2 + dx, 330 + dy), s_, eb, col=INK_SOFT, tr=0.24)
    d.line([(W//2 - 60 + dx, 384 + dy), (W//2 + 60 + dx, 384 + dy)], fill=(*VERM, 230), width=4)
    # frame-0 poster state: date chip + a blind-emboss pre-print of the plate (the press before the impression)
    dt = dc.mono(26, b=True); s_ = "DISPATCH · JULY 2026"
    ink_text(d, ((W - dc.tw(s_, dt, 0.18)) / 2 + dx, 404 + dy), s_, dt, col=INK_SOFT, a=0.85, tr=0.18)
    fn0 = dc.fr(268, 900)
    x0_ = (W - dc.tw("~4,700", fn0)) / 2
    d.text((x0_ + 2, 472), "~4,700", font=fn0, fill=(*VERM, 66))                # pre-inked plate (poster frame 0)
    fnA = dc.fr(84, 800)
    dc.tk(d, "ACRES", fnA, (*INK, 58), int((W - dc.tw("ACRES", fnA, 0.42)) / 2), 810, 0.42)
    # B1: the hero number stamps (Buck moment #1)
    sc, a1 = stamp_p(f, 0.12, 0.38)
    if a1 > 0:
        fn = dc.fr(int(268 * sc), 900); s_ = "~4,700"
        x = (W - dc.tw(s_, fn)) / 2 + dx; y = 470 - int(292 * sc - 292) // 2 + dy
        d.text((x + 3, y + 2), s_, font=fn, fill=(*INK, int(60 * a1)))          # misreg ghost
        d.text((x, y), s_, font=fn, fill=(*VERM, int(255 * a1)))
    fn2 = dc.fr(84, 800); s2 = "ACRES"
    a1b = float(E.seg(f, S(0.55), S(0.85))) if f > 0 else 0.0
    if a1b > 0:
        ink_text(d, ((W - dc.tw(s2, fn2, 0.42)) / 2 + dx, 810 + dy), s2, fn2, col=INK, a=a1b, tr=0.42)
    a1c = max(0.55, float(E.out_cubic(E.seg(f, S(1.3), S(1.9)))))
    slug(d, W/2 + dx, 950 + dy, "THE AI INDUSTRY'S ASK OF ALASKA", dc.mono(34, b=True), a=a1c, tr=0.08)
    # B2: evidence clipping pastes in
    p2 = float(E.out_quint(E.seg(f, S(5.3), S(6.1))))
    if p2 > 0:
        cw, ch = 640, 560
        chit = torn_chit(cw, ch)
        cd = ImageDraw.Draw(chit)
        draw_alaska(cd, 60, 60, cw - 130, ch - 130, a=1.0)
        exf = dc.mono(24, b=True)
        cd.text((26, 52), "EXHIBIT A · MILITARY LAND, 12 PARCELS", font=exf, fill=(*INK_SOFT, 255))
        # base stamps punch into the clipping
        for bi, (nm, bxp, byp) in enumerate(BASES):
            t0 = 5.8 + bi * 0.6
            scb, ab = stamp_p(f, t0, 0.4)
            if ab <= 0: continue
            bx = 60 + bxp * (cw - 130); by = 60 + byp * (ch - 130)
            r = 13 * scb
            cd.ellipse([bx - r, by - r, bx + r, by + r], fill=(*VERM, int(255 * ab)), outline=(*INK, int(255 * ab)), width=3)
            lbf = dc.mono(25, b=True)
            lx = bx + 22 if bxp < 0.72 else bx - dc.tw(nm, lbf) - 22
            cd.line([(bx + (16 if bxp < 0.72 else -16), by), (lx + (dc.tw(nm, lbf) / 2), by)], fill=(*INK, int(160 * ab)), width=2)
            cd.rectangle([lx - 6, by - 17, lx + dc.tw(nm, lbf) + 6, by + 17], fill=(*PARCH_HI, int(230 * ab)))
            cd.text((lx, by - 14), nm, font=lbf, fill=(*INK, int(255 * ab)))
        rot = 3.2 - 1.1 * p2
        chit = chit.rotate(rot, expand=True, resample=Image.BICUBIC)
        cx0 = (W - chit.width) // 2 + dx; cy0 = int(1020 + (1 - p2) * 70) + dy
        sh_ = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(sh_).rounded_rectangle([cx0 + 12, cy0 + 16, cx0 + chit.width - 4, cy0 + chit.height + 8], 10, fill=(30, 26, 20, int(60 * p2)))
        lay = Image.alpha_composite(lay, sh_.filter(ImageFilter.GaussianBlur(8)))
        tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); tmp.paste(chit, (cx0, cy0), chit)
        # tape corners
        td = ImageDraw.Draw(tmp)
        for (tx, ty, tr_) in [(cx0 + 14, cy0 - 14, 24), (cx0 + chit.width - 96, cy0 - 8, -18)]:
            tp = Image.new("RGBA", (110, 40), (238, 232, 216, int(150 * p2)))
            tp = tp.rotate(tr_, expand=True)
            tmp.paste(tp, (tx, ty), tp)
        tmp = Image.eval(tmp, lambda v: v)  # no-op keep
        lay = Image.alpha_composite(lay, tmp)
        d = ImageDraw.Draw(lay)
    # B3: parcel chits tick in + dated slug
    d = ImageDraw.Draw(lay)
    if f >= S(9.0):
        draw_chips(d, f, 9.0)
        a3 = float(E.out_cubic(E.seg(f, S(10.0), S(10.6))))
        if a3 > 0:
            slug(d, W/2, 1362, "PROPOSALS CLOSED JUNE 29 · KTUU", dc.mono(28, b=True), a=a3, tick=False, tr=0.06)
    lay = bleed(lay)
    return Image.alpha_composite(img, lay).convert("RGB")

# ============================================================ SHOT 2 · THE APPETITE (9-20s)
GRID_C, GRID_R = 10, 10
G_S = 62; G_GX = (W - GRID_C * G_S - (GRID_C - 1) * 14) // 2; G_GY = 620
def gpos(i):
    r, c = divmod(i, GRID_C)
    return (G_GX + c * (G_S + 14), G_GY + r * (G_S + 14))

def scene2(f):
    img = Image.fromarray(paper(f).astype(np.uint8)).convert("RGBA")
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    dxq, dyq = shake(f, 22.7, 6.5)
    eb = dc.mono(30, b=True); s_ = "ALASKA.AI DISPATCH"
    ink_text(d, ((W - dc.tw(s_, eb, 0.24)) / 2, 330), s_, eb, col=INK_SOFT, tr=0.24)
    d.line([(W//2 - 60, 384), (W//2 + 60, 384)], fill=(*VERM, 230), width=4)
    # label
    aL = float(E.out_cubic(E.seg(f, S(12.5), S(13.1))))
    if aL > 0: slug(d, W/2, 470, "ONE LARGE DATA CENTER", dc.mono(36, b=True), a=aL, tr=0.10)
    # graphic-match: the 12 chits (exact S1 positions) multiply into the 100-house grid
    t = f / FPS
    if t < 13.6:
        draw_chips(d, f, -1)                                     # settled chips (t0<0 = fully in)
    mp = float(E.seg(f, S(12.4), S(15.4)))                        # multiplication progress
    for i in range(GRID_C * GRID_R):
        # each house flies from its parent chit
        src = (CHIPS_X0 + (i % 12) * (CHIP_W + CHIP_GAP) + CHIP_W // 2, CHIPS_Y + CHIP_H // 2)
        dst = gpos(i); pi = float(E.out_quint(E.seg(f, S(12.4) + (i % 25) * 2 + (i // 25) * 6, S(12.4) + (i % 25) * 2 + (i // 25) * 6 + 16)))
        if pi <= 0: continue
        x, y = E.lerp(src[0], dst[0], pi), E.lerp(src[1], dst[1], pi)
        # load flood: rows fill vermilion in waves 11.5s -> 15.5s
        row = i // GRID_C
        lit = float(E.seg(f, S(15.3) + row * 9, S(15.3) + row * 9 + 12))
        fill = tuple(int(PARCH_HI[k] + (VERM[k] - PARCH_HI[k]) * lit) for k in range(3)) if (pi >= 0.98) else None
        house(d, x + dxq, y + dyq, int(G_S * 0.86), fill=fill if lit > 0.02 else None, outline=INK, wd=3, a=min(1.0, pi + 0.2))
    # counter slug locks
    aC = float(E.seg(f, S(16.6), S(18.3)))
    if aC > 0:
        if aC < 0.85:
            n = int(100000 * aC / 0.85) // 1000 * 1000
        else:
            n = 100000
        s_ = f"= THE POWER OF ~{n:,} HOUSEHOLDS"
        r = slug(d, W/2 + dxq, 1330 + dyq, s_, dc.mono(37, b=True), a=min(1.0, aC * 2), tr=0.04)
        if aC >= 0.85:
            chipf = dc.mono(22, b=True)
            d.rounded_rectangle([r[2] - 76, r[1] - 16, r[2], r[1] + 12], 4, fill=(*BRASS, 235))
            d.text((r[2] - 64, r[1] - 13), "ADN", font=chipf, fill=(*PARCH_HI, 255))
    # B6: Hollister quote chip (pattern interrupt)
    p6 = float(E.out_quint(E.seg(f, S(22.6), S(23.15))))
    if p6 > 0:
        qw, qh = 880, 420
        chip = Image.new("RGBA", (qw, qh), (0, 0, 0, 0)); qd = ImageDraw.Draw(chip)
        qd.rounded_rectangle([0, 0, qw, qh], 10, fill=(*INK, 255))
        qd.rectangle([0, 0, 12, qh], fill=(*VERM, 255))
        qf = dc.fr(44, 650, it=True)
        lines = ['"People say living close to', "them, it's like having a", "vacuum cleaner on 24 hours", 'a day, seven days a week."']
        for li, ln in enumerate(lines):
            qd.text((44, 34 + li * 62), ln, font=qf, fill=(*PARCH, 255))
        qd.text((44, 34 + 4 * 62 + 14), "NEARBY RESIDENT, NORTH POLE · KTUU", font=dc.mono(24, b=True), fill=(*PEWTER, 255))
        rot = -4.0 + 1.2 * p6
        chip = chip.rotate(rot, expand=True, resample=Image.BICUBIC)
        sc_ = 1.0 + 0.35 * (1 - p6)
        cw2, ch2 = int(chip.width * sc_), int(chip.height * sc_)
        chip = chip.resize((cw2, ch2), Image.LANCZOS)
        cx0 = (W - cw2) // 2 + dxq; cy0 = 700 - (ch2 - chip.height) // 2 + dyq
        tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); tmp.paste(chip, (cx0, cy0), chip)
        fade = min(1.0, p6 * 1.6)
        if fade < 0.995:
            tmp.putalpha(tmp.getchannel("A").point(lambda v: int(v * fade)))
        lay = Image.alpha_composite(lay, tmp); d = ImageDraw.Draw(lay)
    # the carried load line begins to snake out (19.3s -> cut)
    pl = float(E.seg(f, S(24.4), S(25.2)))
    if pl > 0:
        pts = [(G_GX + 300, 1380), (700, 1470), (420, 1560), (140, 1650)]
        npts = max(2, int(len(pts) * pl) + 1)
        d.line([tuple(map(int, p)) for p in pts[:npts]], fill=(*VERM, 255), width=10, joint="curve")
    lay = bleed(lay)
    return Image.alpha_composite(img, lay).convert("RGB")

# ============================================================ SHOT 3 · THE EMPTY PIPE (20-30s)
LP = (70, 640, 512, 1420)    # left panel (gas band)
RP = (566, 640, 1010, 1420)  # right panel (diesel)
def scene3(f):
    img = Image.fromarray(paper(f).astype(np.uint8)).convert("RGBA")
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    t = f / FPS
    eb = dc.mono(30, b=True); s_ = "ALASKA.AI DISPATCH"
    ink_text(d, ((W - dc.tw(s_, eb, 0.24)) / 2, 330), s_, eb, col=INK_SOFT, tr=0.24)
    d.line([(W//2 - 60, 384), (W//2 + 60, 384)], fill=(*VERM, 230), width=4)
    aT = float(E.out_cubic(E.seg(f, S(25.4), S(26.0))))
    if aT > 0: slug(d, W/2, 452, "THE SUPPLY SIDE OF THE LEDGER", dc.mono(33, b=True), a=aT, tr=0.08)
    # the carried load line enters from bottom-left and travels to the band's top edge (25.0-26.2)
    pcin = float(E.in_out_cubic(E.seg(f, S(25.0), S(26.2))))
    if 0 < pcin < 1:
        path = [(140, 1650), (70, 1300), (100, 1010), (LP[0] + 22, 828)]
        npts = max(2, int(len(path) * pcin) + 1)
        d.line([tuple(map(int, q)) for q in path[:npts]], fill=(*VERM, 255), width=10, joint="curve")
    # panels
    pin = float(E.out_quint(E.seg(f, S(25.2), S(25.9))))
    for (x0, y0, x1, y1) in (LP, RP):
        yo = int((1 - pin) * 60)
        d.rounded_rectangle([x0, y0 + yo, x1, y1 + yo], 8, outline=(*INK, int(220 * pin)), width=4)
    # ---- LEFT: the gas band drains (carried line becomes its top edge)
    if pin > 0.3:
        gx0, gy0, gx1, gy1 = LP[0] + 26, LP[1] + 120, LP[2] - 26, LP[3] - 130
        d.text((LP[0] + 26, LP[1] + 24), "COOK INLET GAS", font=dc.mono(30, b=True), fill=(*INK, 255))
        d.text((LP[0] + 26, LP[1] + 62), "SHARE OF GVEA FUEL", font=dc.mono(24), fill=(*INK_SOFT, 255))
        # band: from ~30% full draining to <1% (B7 20-23 establish, B8 23-26 drain)
        est = float(E.out_cubic(E.seg(f, S(26.0), S(28.0))))
        drain = float(E.in_out_cubic(E.seg(f, S(29.2), S(32.4))))
        share = 0.30 * est * (1 - drain) + 0.008 * drain
        bh = gy1 - gy0
        top = gy1 - int(bh * share / 0.34)
        if est > 0:
            d.rectangle([gx0, top, gx1, gy1], fill=(*VERM, 235))
            for k in range(gx0, gx1, 12):                          # ink hatching inside the band
                d.line([(k, top), (k, gy1)], fill=(*INK, 36), width=2)
            d.line([(gx0 - 4, top), (gx1 + 4, top)], fill=(*VERM, 255), width=10)   # the carried edge
            # drip particles while draining
            if 0.02 < drain < 0.98:
                rng = np.random.default_rng(f)
                for _ in range(7):
                    px = rng.integers(gx0, gx1); py = top + rng.integers(4, 60)
                    d.ellipse([px - 3, py - 3, px + 3, py + 3], fill=(*VERM, 160))
        # scale ticks
        for pct, lab in ((0.30, "30%"), (0.20, "20%"), (0.10, "10%"), (0.0, "0")):
            yt = gy1 - int(bh * pct / 0.34)
            d.line([(gx0 - 14, yt), (gx0 - 4, yt)], fill=(*INK, 200), width=3)
            d.text((gx0 - 14 - dc.tw(lab, dc.mono(22)), yt - 12), lab, font=dc.mono(22), fill=(*INK_SOFT, 255))
        # the number lands
        numf = dc.fr(64, 900)
        if drain < 0.5:
            sn = "ABOUT 30%"; an = est
        else:
            sn = "UNDER 1%"; an = float(E.out_back(E.seg(f, S(32.2), S(32.8)), 0.5))
        if an > 0:
            ncol = VERM if drain >= 0.5 else INK
            d.text((LP[0] + 26, LP[3] - 108), sn, font=numf, fill=(*ncol, int(255 * an)))
        aly = float(E.out_cubic(E.seg(f, S(33.0), S(33.6))))
        if aly > 0:
            slug(d, (LP[0]+LP[2])/2, LP[3] - 190, "LAST YEAR · ADN", dc.mono(24, b=True), a=aly, tick=False)
    # ---- RIGHT: diesel barrels stack + counter (B9 26-30)
    if t >= 33.9:
        d.text((RP[0] + 26, RP[1] + 24), "THE STOPGAP", font=dc.mono(30, b=True), fill=(*INK, 255))
        d.text((RP[0] + 26, RP[1] + 62), "DIESEL BURNED FOR POWER", font=dc.mono(24), fill=(*INK_SOFT, 255))
        bx0, by1 = RP[0] + 40, RP[3] - 150
        cols = 4; bw = 84; bh_ = 56
        nbar = int(16 * float(E.seg(f, S(34.2), S(37.4))))
        for b in range(nbar):
            c, r = b % cols, b // cols
            x = bx0 + c * (bw + 14); y = by1 - r * (bh_ + 10)
            d.rounded_rectangle([x, y - bh_, x + bw, y], 8, fill=(*INK, 235))
            d.ellipse([x + 8, y - bh_ + 6, x + 26, y - bh_ + 18], fill=(*INK_SOFT, 255))
            d.line([(x + 8, y - bh_ // 2), (x + bw - 8, y - bh_ // 2)], fill=(*PARCH, 70), width=3)
        aC2 = float(E.seg(f, S(34.8), S(37.4)))
        if aC2 > 0:
            if aC2 < 0.8:
                n = int(250000 * aC2 / 0.8) // 1000 * 1000
                s_ct = f"{n:,} GALLONS A DAY"
            else:
                s_ct = "AT LEAST 250,000 GALLONS A DAY"
            slug(d, (RP[0]+RP[2])/2, RP[3] - 116, s_ct, dc.mono(27, b=True), a=min(1.0, aC2 * 2))
        alw = float(E.out_cubic(E.seg(f, S(37.7), S(38.3))))
        if alw > 0:
            slug(d, (RP[0]+RP[2])/2, RP[1] + 96, "LAST WINTER, AT PEAKS · NEWS-MINER", dc.mono(23, b=True), a=alw, tick=False)
        # frost creeps along the right panel edge
        pf = float(E.seg(f, S(34.3), S(39.5)))
        if pf > 0:
            rng = np.random.default_rng(11)
            fr_ = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(fr_)
            ncr = int(46 * pf)
            for k in range(ncr):
                yy = RP[1] + int((RP[3] - RP[1]) * k / 46)
                ln = rng.uniform(8, 34) * (0.5 + 0.5 * pf)
                fd.line([(RP[2] - 2, yy), (RP[2] - 2 - ln, yy + rng.uniform(-6, 6))], fill=(*PEWTER, 170), width=3)
            lay = Image.alpha_composite(lay, fr_.filter(ImageFilter.GaussianBlur(1.2))); d = ImageDraw.Draw(lay)
    # GVEA plate + flame gutter at the seam (sets as barrels finish, ~29s)
    ap = float(E.out_quint(E.seg(f, S(38.2), S(38.8))))
    if ap > 0:
        slug(d, W/2, 566, "GOLDEN VALLEY ELECTRIC · AT ITS PRODUCTION LIMITS", dc.mono(25, b=True), a=ap, tr=0.02)
        fl = 8 + 6 * math.sin(f * 0.9) + 3 * math.sin(f * 2.3)
        fx = W // 2; fy = 1418
        d.polygon([(fx - 9, fy), (fx, fy - fl - 12), (fx + 9, fy)], fill=(*VERM, int(220 * ap)))
        d.polygon([(fx - 4, fy), (fx, fy - fl * 0.6 - 8), (fx + 4, fy)], fill=(*BRASS, int(230 * ap)))
    lay = bleed(lay)
    return Image.alpha_composite(img, lay).convert("RGB")

# ============================================================ SHOT 4 · THE TURBINE (30-42s)
TCX, TCY = W // 2, 830          # turbine center
def turbine_hull(scale=1.0, cx=TCX, cy=TCY):
    """The LM6000 as a clean technical silhouette: bellmouth intake, ribbed compressor barrel,
    combustor bulge, power turbine, tapered exhaust cone. Returns (hull_polygon, detail_segs)."""
    sx = lambda x: cx + x * scale; sy = lambda y: cy + y * scale
    top = [(-372, -128), (-330, -58), (-236, -58), (-236, -84), (-64, -84), (-64, -70),
           (10, -70), (10, -104), (128, -104), (128, -74), (216, -74), (330, -30)]
    hull = [(sx(x), sy(y)) for (x, y) in top] + [(sx(330), sy(30))] + \
           [(sx(x), sy(-y)) for (x, y) in reversed(top)]
    segs = []
    for i in range(6):                                                        # compressor ribs
        x = -216 + i * 28
        segs.append([(sx(x), sy(-84)), (sx(x), sy(84))])
    segs.append([(sx(-64), sy(-84)), (sx(-64), sy(84))])                      # compressor exit flange
    segs.append([(sx(10), sy(-104)), (sx(10), sy(104))])                      # combustor flange
    segs.append([(sx(128), sy(-104)), (sx(128), sy(104))])                    # turbine flange
    segs.append([(sx(216), sy(-74)), (sx(216), sy(74))])                      # exhaust flange
    segs.append([(sx(-388), sy(0)), (sx(354), sy(0))])                        # centerline
    for k in (-1, 1):                                                         # mount feet
        segs.append([(sx(-150), sy(84 * k)), (sx(-150), sy(120 * k)), (sx(-96, ), sy(120 * k))])
        segs.append([(sx(150), sy(74 * k)), (sx(150), sy(120 * k)), (sx(196), sy(120 * k))])
    return hull, segs

def turbine_pts(scale=1.0, cx=TCX, cy=TCY):
    hull, segs = turbine_hull(scale, cx, cy)
    return [hull + [hull[0]]] + segs

def scene4(f):
    img = Image.fromarray(paper(f, drift=1.0).astype(np.uint8)).convert("RGBA")
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    dx, dy = shake(f, 41.05, 7.0)
    eb = dc.mono(30, b=True); s_ = "ALASKA.AI DISPATCH"
    ink_text(d, ((W - dc.tw(s_, eb, 0.24)) / 2, 330), s_, eb, col=INK_SOFT, tr=0.24)
    d.line([(W//2 - 60, 384), (W//2 + 60, 384)], fill=(*VERM, 230), width=4)
    aT = float(E.out_cubic(E.seg(f, S(39.72), S(40.3))))
    if aT > 0: slug(d, W/2, 452, "THE FIX", dc.mono(36, b=True), a=aT, tr=0.16)
    # B10: assemble points -> edges -> faces (30-34s)
    st, ts_, ov = dc.assemble_alpha(f, S(39.75), int(1.9 * FPS), 3)
    hull, segs = turbine_hull()
    hullO = [(x + dx, y + dy) for (x, y) in hull]
    if st < 2:                                                               # blueprint ghost plate: on screen from the cut frame
        d.polygon(hullO, outline=(*PEWTER, 175), width=4)
        for k in range(0, len(hullO), 3):
            x, y = hullO[k]
            d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(*PEWTER, 200))
    if ov > 0:
        if st == 0:                                                          # points
            for k in range(0, len(hullO), 2):
                x, y = hullO[k]
                pa = float(E.seg(ts_ * len(hullO), k, k + 6))
                if pa > 0: d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(*INK, int(255 * pa)))
        if st == 1:                                                          # edges trace the hull
            n2 = max(2, int(len(hullO) * ts_) + 1)
            d.line(hullO[:n2], fill=(*INK, 255), width=5, joint="curve")
        if st >= 2:                                                          # faces: fill + details + shading
            d.polygon(hullO, fill=(*PARCH_HI, int(235 * max(ts_, 0.3))), outline=(*INK, 255), width=5)
            for si, seg_ in enumerate(segs):
                sa = float(E.seg(ts_ * (len(segs) + 2), si, si + 2))
                if sa <= 0: continue
                d.line([(x + dx, y + dy) for (x, y) in seg_], fill=(*INK, int(230 * sa)), width=3, joint="curve")
            # underside hatch shading (a lit machine, not clip-art)
            for hx in range(-350, 330, 16):
                d.line([(TCX + hx + dx, TCY + 30 + dy), (TCX + hx + 12 + dx, TCY + 78 + dy)],
                       fill=(*INK, int(26 * ts_)), width=2)
            # intake bellmouth ellipse
            d.ellipse([TCX - 384 + dx, TCY - 128 + dy, TCX - 344 + dx, TCY + 128 + dy], outline=(*INK, int(255 * ts_)), width=5)
            # part callouts with leader ticks
            lf2 = dc.mono(21, b=True)
            for (lbx, lby, txt, tipx, tipy) in [(-364, -190, "INTAKE", -358, -132), (-160, 168, "COMPRESSOR", -140, 86),
                                                 (55, 190, "COMBUSTOR", 69, 108), (285, 150, "EXHAUST", 272, 76)]:
                la2 = float(E.seg(ts_, 0.55, 0.95))
                if la2 <= 0: continue
                lx2, ly2 = TCX + lbx + dx, TCY + lby + dy
                d.line([(TCX + tipx + dx, TCY + tipy + dy), (lx2 + dc.tw(txt, lf2) / 2, ly2 + (26 if lby < 0 else 0))], fill=(*INK_SOFT, int(150 * la2)), width=2)
                d.rectangle([lx2 - 5, ly2 - 2, lx2 + dc.tw(txt, lf2) + 5, ly2 + 26], fill=(*PARCH_HI, int(215 * la2)))
                d.text((lx2, ly2), txt, font=lf2, fill=(*INK, int(255 * la2)))
        if ov > 0.6:
            apl = float(E.out_cubic(E.seg(f, S(42.4), S(43.1))))
            if apl > 0: slug(d, W/2 + dx, 1052 + dy, "GE LM6000 · 45 TO 58 MW", dc.mono(32, b=True), a=apl, tr=0.06)
    # B11: price stamp slam (34-38)
    sc, a11 = stamp_p(f, 41.0, 0.42)
    if a11 > 0:
        base_sz = 118
        fn = dc.fr(int(base_sz * sc), 900); s_ = "~$120 MILLION"
        while dc.tw(s_, fn) > 960 and base_sz > 70:
            base_sz -= 4; fn = dc.fr(int(base_sz * sc), 900)
        x = (W - dc.tw(s_, fn)) / 2 + dx; y = 1188 + dy - int(base_sz * (sc - 1)) // 2
        d.text((x + 3, y + 2), s_, font=fn, fill=(*INK, int(70 * a11)))
        d.text((x, y), s_, font=fn, fill=(*VERM, int(255 * a11)))
    # B12: the twist DRAWN — a vermilion chain of houses coils around the machine (38-42)
    p12 = float(E.seg(f, S(43.8), S(47.3)))
    if p12 > 0:
        tighten = float(E.in_out_cubic(E.seg(f, S(45.5), S(47.8))))
        # the coil: an elliptical spiral path around the turbine; houses ride it like beads on a chain
        tmax = p12 * 3.6 * math.pi                       # how far the chain has wound
        def coil_xy(th):
            rad = (470 - 34 * th / math.pi) * (1 - 0.16 * tighten)
            return (TCX + rad * math.cos(th - math.pi * 0.5) * 1.02 + dx,
                    TCY + rad * math.sin(th - math.pi * 0.5) * 0.42 + dy)
        pts = [coil_xy(0.02 * k) for k in range(int(tmax / 0.02) + 1)]
        if len(pts) > 2:
            # chain drawn front/back split so it reads as wrapping AROUND: back half dimmer
            for k in range(1, len(pts)):
                th = 0.02 * k
                behind = math.sin(th - math.pi * 0.5) < -0.15
                col = (*VERM, 120 if behind else 255)
                d.line([pts[k - 1], pts[k]], fill=col, width=7 if not behind else 5)
            for k in range(0, len(pts), 22):             # the houses, riding the chain
                th = 0.02 * k
                behind = math.sin(th - math.pi * 0.5) < -0.15
                hs = 30 if not behind else 22
                house(d, pts[k][0] - hs/2, pts[k][1] - hs, hs, fill=VERM, outline=INK,
                      wd=3 if not behind else 2, a=1.0 if not behind else 0.55)
        a195 = float(E.out_back(E.seg(f, S(45.8), S(46.4)), 0.7))
        if a195 > 0:
            fn = dc.fr(112, 900); s_ = "+195%"
            x = W/2 - dc.tw(s_, fn)/2 + dx
            d.text((x + 3, 520 + dy + 2), s_, font=fn, fill=(*INK, int(70 * a195)))
            d.text((x, 520 + dy), s_, font=fn, fill=(*VERM, int(255 * a195)))
            f2 = dc.fr(46, 750); s2 = "SINCE 2019"
            d.text((W/2 - dc.tw(s2, f2)/2 + dx, 676 + dy), s2, font=f2, fill=(*INK, int(255 * a195)))
        ac = float(E.out_cubic(E.seg(f, S(47.7), S(48.3))))
        if ac > 0:
            slug(d, W/2 + dx, 1296 + dy, "THE BUYERS: DATA CENTERS EVERYWHERE", dc.mono(30, b=True), a=ac, tr=0.02)
            ink_text(d, ((W - dc.tw("per Bloomberg, via the News-Miner", dc.mono(24))) / 2 + dx, 1358 + dy), "per Bloomberg, via the News-Miner", dc.mono(24), col=INK_SOFT, a=ac)
        aw = float(E.out_cubic(E.seg(f, S(49.4), S(50.0))))
        if aw > 0:
            slug(d, W/2 + dx, 762 + dy, "WAITLISTS INTO THE EARLY 2030s", dc.mono(26, b=True), a=aw, tick=False)
    lay = bleed(lay)
    return Image.alpha_composite(img, lay).convert("RGB")

# ============================================================ SHOT 5 · THE OPEN CIRCUIT (42-57.5s)
LCX, LCY, LRX, LRY = 596, 880, 330, 300      # loop center nudged right so the OPEN GAP reads nearer center-left
def loop_xy(theta):
    return (LCX + LRX * math.cos(theta), LCY + LRY * math.sin(theta))
# node angles: DEMAND top(-90), LAND right(0), GENERATION bottom(90), GAS left(180)
NODES = {"DEMAND": -math.pi/2, "LAND": 0.0, "GEN": math.pi/2, "GAS": math.pi}
GAP_A = (math.pi * 0.80, math.pi * 1.20)     # the open breaker gap around GAS

def scene5(f):
    img = Image.fromarray(paper(f).astype(np.uint8)).convert("RGBA")
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    t = f / FPS
    eb = dc.mono(30, b=True); s_ = "ALASKA.AI DISPATCH"
    ink_text(d, ((W - dc.tw(s_, eb, 0.24)) / 2, 330), s_, eb, col=INK_SOFT, tr=0.24)
    d.line([(W//2 - 60, 384), (W//2 + 60, 384)], fill=(*VERM, 230), width=4)
    # the big ghost stamp PROPOSED (loudest label) behind the loop
    ag = float(E.seg(f, S(52.6), S(53.8)))
    if ag > 0:
        gf = dc.fr(190, 900); s_ = "PROPOSED"
        gl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(gl)
        gd.text(((W - dc.tw(s_, gf)) / 2, 1120), s_, font=gf, fill=(*PEWTER, int(74 * ag)))
        gl = gl.rotate(-9, center=(W//2, 1210), resample=Image.BICUBIC)
        lay = Image.alpha_composite(lay, gl); d = ImageDraw.Draw(lay)
    # CARRY-IN: the turbine from Shot 4 shrinks and travels into its node slot (42.0-43.2)
    pc = float(E.in_out_cubic(E.seg(f, S(51.3), S(52.3))))
    if pc < 1.0:
        gx, gy = loop_xy(NODES["GEN"])
        ccx, ccy = E.lerp(TCX, gx, pc), E.lerp(830, gy, pc)
        csc = E.lerp(1.0, 0.16, pc)
        hull, segs_c = turbine_hull(scale=csc, cx=ccx, cy=ccy)
        d.polygon(hull, fill=(*PARCH_HI, 235), outline=(*INK, 255), width=max(2, int(5 * csc + 1)))
        for seg_ in segs_c[:7]:
            d.line(seg_, fill=(*INK, 220), width=max(2, int(3 * csc)))
    # loop draws on (42-45): solid segments ink, GEN segment dotted, gap left open
    pdraw = float(E.in_out_cubic(E.seg(f, S(51.5), S(53.6))))
    def arc(a0, a1, dotted=False, colr=INK, wdt=8):
        n = max(2, int(64 * abs(a1 - a0) / (2 * math.pi) * 4))
        pts = [loop_xy(a0 + (a1 - a0) * k / n) for k in range(n + 1)]
        if dotted:
            for k in range(0, n, 4):
                d.line([pts[k], pts[min(k + 2, n)]], fill=(*colr, 235), width=wdt)
        else:
            d.line(pts, fill=(*colr, 255), width=wdt, joint="curve")
    total_a = pdraw * 2 * math.pi
    a_start = -math.pi / 2
    drawn = 0.0; cur = a_start
    spans = [(-math.pi/2, 0.0, False), (0.0, math.pi/2, False), (math.pi/2, GAP_A[0], True),
             (GAP_A[1], 3*math.pi/2, False)]
    for (sa, ea, dot) in spans:
        if drawn >= total_a: break
        seg_len = ea - sa
        take = min(seg_len, total_a - drawn)
        if take > 0.01:
            arc(sa, sa + take, dotted=dot, colr=(INK if not dot else PEWTER))
        drawn += seg_len
    # breaker terminals at the gap
    if pdraw > 0.9:
        for aa in GAP_A:
            x, y = loop_xy(aa)
            d.ellipse([x - 11, y - 11, x + 11, y + 11], outline=(*INK, 255), width=5)
    # nodes
    node_lab = {"DEMAND": ("DEMAND", "solid"), "LAND": ("LAND · 3 BASES", "solid"),
                "GEN": ("NEW GENERATION", "dotted"), "GAS": ("GAS", "gap")}
    pn = float(E.seg(f, S(52.2), S(54.2)))
    for i, (key, aa) in enumerate(NODES.items()):
        pi = float(E.out_back(E.seg(f, S(52.2) + i * 6, S(52.2) + i * 6 + 10), 0.5))
        if pi <= 0: continue
        x, y = loop_xy(aa)
        lab, kind = node_lab[key]
        r = 46 * pi
        if key == "DEMAND":
            d.ellipse([x - r, y - r, x + r, y + r], fill=(*VERM, 240), outline=(*INK, 255), width=4)
            house(d, x - 14, y - 13, 28, fill=None, outline=PARCH, wd=3)
        elif key == "GEN":
            # the carried turbine, miniature, sits here (dotted = proposed)
            for k in range(0, 360, 24):
                a2 = math.radians(k)
                d.arc([x - r, y - r, x + r, y + r], k, k + 12, fill=(*PEWTER, 255), width=5)
            mini = turbine_pts(scale=0.16, cx=x, cy=y)
            for seg_ in mini: d.line(seg_, fill=(*INK_SOFT, 230), width=2)
            # price tag chit
            d.rounded_rectangle([x + r - 4, y - r - 30, x + r + 96, y - r + 6], 4, fill=(*VERM, 245))
            d.text((x + r + 8, y - r - 26), "+195%", font=dc.mono(24, b=True), fill=(*PARCH, 255))
        elif key == "GAS":
            pass                                                             # the gap IS the node
        else:
            d.ellipse([x - r, y - r, x + r, y + r], fill=(*INK, 240), outline=(*INK, 255), width=4)
        if key != "GAS":
            lf = dc.mono(26, b=True)
            lx = x - dc.tw(lab, lf) / 2
            ly = y - r - 46 if key == "DEMAND" else y + r + 16
            la_n = pi * (1.0 - 0.9 * float(E.seg(f, S(55.1), S(55.7)))) if key == "DEMAND" else pi
            if la_n > 0.03:
                d.rectangle([lx - 8, ly - 4, lx + dc.tw(lab, lf) + 8, ly + 32], fill=(*PARCH_HI, int(220 * la_n)))
                d.text((lx, ly), lab, font=lf, fill=(*INK, int(255 * la_n)))
        else:
            lf = dc.mono(26, b=True); lab2 = "GAS · OPEN"
            x2, y2 = loop_xy(math.pi)
            d.rectangle([x2 - 150, y2 - 18, x2 - 150 + dc.tw(lab2, lf) + 16, y2 + 18], fill=(*PARCH_HI, int(220 * pi)))
            d.text((x2 - 142, y2 - 14), lab2, font=lf, fill=(*VERM, int(255 * pi)))
    # feedback arc: DEMAND -> the GEN price tag (vermilion, drawing 42-47 window's tail)
    pf = float(E.in_out_cubic(E.seg(f, S(53.4), S(54.6))))
    if pf > 0:
        xg, yg = loop_xy(NODES["GEN"]); xd, yd = loop_xy(NODES["DEMAND"])
        cx1, cy1 = LCX + LRX * 1.55, LCY - LRY * 0.9
        cx2, cy2 = LCX + LRX * 1.62, LCY + LRY * 0.9
        n = max(2, int(50 * pf))
        pts = []
        for k in range(n + 1):
            tt = k / 50
            x = (1-tt)**3*xd + 3*(1-tt)**2*tt*cx1 + 3*(1-tt)*tt*tt*cx2 + tt**3*(xg + 60)
            y = (1-tt)**3*yd + 3*(1-tt)**2*tt*cy1 + 3*(1-tt)*tt*tt*cy2 + tt**3*(yg - 36)
            pts.append((x, y))
        for k in range(0, len(pts) - 2, 3):
            d.line([pts[k], pts[min(k + 2, len(pts) - 1)]], fill=(*VERM, 255), width=6)
        if pf > 0.96:
            xx, yy = pts[-1]
            d.polygon([(xx, yy), (xx - 18, yy - 16), (xx - 4, yy - 22)], fill=(*VERM, 255))
    # pulses run the loop and die at the gap (47-52), twice
    for (t0p, dur_p) in ((53.7, 0.95), (54.75, 0.95)):
        pp = float(E.seg(f, S(t0p), S(t0p) + int(dur_p * FPS)))
        if 0 < pp < 1:
            ang = -math.pi/2 + pp * (GAP_A[0] + math.pi/2)                    # travel to the gap edge
            x, y = loop_xy(ang)
            r = 14
            for rr, aa2 in ((r * 2.6, 40), (r * 1.6, 90), (r, 220)):
                d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(*VERM, int(aa2 * (1 - pp * 0.3))))
        if 0.97 <= pp < 1.0:                                                  # dies: a small collapse flash
            x, y = loop_xy(GAP_A[0])
            d.ellipse([x - 26, y - 26, x + 26, y + 26], outline=(*VERM, 200), width=4)
    a_slug = float(E.out_cubic(E.seg(f, S(52.3), S(53.0))))
    if a_slug > 0:
        slug(d, W/2, 1248, "NO AWARDS ANNOUNCED", dc.mono(30, b=True), a=a_slug, tr=0.05)
        slug(d, W/2, 1326, "JULY 13 · GVEA EXECUTIVE SESSION", dc.mono(26, b=True), a=a_slug, tick=False)
    # closing type (52-57.5): thesis then the question
    ac1 = float(E.out_quint(E.seg(f, S(55.3), S(56.0))))
    if ac1 > 0:
        slug(d, W/2, 500, "ALASKA HOLDS THE LAND, THE COLD,", dc.fr(46, 800), pad=(30, 12), a=ac1)
        slug(d, W/2, 585, "AND THE CHOICE.", dc.fr(46, 800), pad=(30, 12), a=ac1, tick=False)
    sc2, ac2 = stamp_p(f, 57.85, 0.45)
    if ac2 > 0:
        fq = dc.fr(int(64 * sc2), 900)
        r = slug(d, W/2, 690, "SHOULD ALASKA SAY YES?", fq, pad=(34, 16), fg=VERM_HI, a=ac2)
    lay = bleed(lay)
    return Image.alpha_composite(img, lay).convert("RGB")

# ============================================================ SHOT 6 · COLOPHON (57.5-64)
def scene6(f):
    img = Image.fromarray(paper(f, drift=1.0).astype(np.uint8)).convert("RGBA")
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    # settled vermilion rule from the press roller
    d.rectangle([0, 640, W, 652], fill=(*VERM, 255))
    # ink block with wordmark
    a1 = float(E.out_quint(E.seg(f, S(60.8), S(61.6))))
    if a1 > 0:
        bw, bh = 760, 300
        x0, y0 = (W - bw) // 2, 760
        d.rounded_rectangle([x0, y0, x0 + bw, y0 + int(bh * a1)], 10, fill=(*INK, 246))
        if a1 > 0.9:
            wf = dc.fr(96, 800, 144); s_ = "ALASKA.AI"
            wq = dc.tw(s_, wf, 0.05)
            dc.tk(d, s_, wf, (*GOLD, 255), int((W - wq) / 2), y0 + 56, 0.05)
            dc.logw((W - wq) / 2, y0 + 56, wq, wf.size, GOLD, 1.0, True, "outro")
            tf = dc.fr(34, 600, 144); s2 = "what's moving in alaska ai, this week"
            w2 = dc.tw(s2, tf, 0.02)
            a2 = float(E.out_cubic(E.seg(f, S(61.8), S(62.3))))
            if a2 > 0:
                dc.tk(d, s2, tf, (228, 224, 214, int(235 * a2)), int((W - w2) / 2), y0 + 190, 0.02)
                dc.logw((W - w2) / 2, y0 + 190, w2, tf.size, (228, 224, 214), a2, a2 >= 0.62, "outro")
    a3 = float(E.out_cubic(E.seg(f, S(62.5), S(63.1))))
    if a3 > 0:
        slug(d, W/2, 1130, "SOURCES: AF.MIL · KTUU · ADN · NEWS-MINER", dc.mono(26, b=True), a=a3, tick=False)
        s4 = "figures as reported · no lease awards announced as of july 2"
        ink_text(d, ((W - dc.tw(s4, dc.mono(22))) / 2, 1210), s4, dc.mono(22), col=INK_SOFT, a=a3)
    a4 = float(E.out_cubic(E.seg(f, S(63.2), S(63.7))))
    if a4 > 0:
        s5 = "· · ·"
        ink_text(d, ((W - dc.tw(s5, dc.mono(30, b=True))) / 2, 1300), s5, dc.mono(30, b=True), col=VERM, a=a4)
    lay = bleed(lay)
    out = Image.alpha_composite(img, lay).convert("RGB")
    # gentle end darkening, motion runs to the last frame (drift + grain continue)
    endf = float(E.seg(f, NF - 24, NF - 2))
    if endf > 0:
        out = Image.eval(out, lambda v: int(v * (1 - 0.28 * endf)))
    return out

# ---------------- captions: voice-synced print slugs (brand type; this run's ink) ----------------
def caption_slug_layout(f):
    """Which cue + word layout is active this frame (mirrors dc.caption timing)."""
    t = f / FPS; cue = None
    for c in dc.CUES:
        if c["s"] - 0.28 <= t < c["e"] + 0.14: cue = c; break
    if not cue: return None
    s, e = cue["s"], cue["e"]
    ap = float(E.out_cubic(E.seg(t * FPS, (s - 0.28) * FPS, (s + 0.06) * FPS))) * (1.0 - float(E.seg(t * FPS, (e - 0.16) * FPS, (e + 0.14) * FPS)))
    if ap <= 0.02: return None
    prog = max(0.0, min(1.0, (t - s) / max(0.25, (e - s))))
    raw = cue["w"].split(); tot = max(1, sum(len(w) + 1 for w in raw)); acc = 0; words = []
    for w in raw:
        mid = (acc + (len(w) + 1) / 2.0) / tot; acc += len(w) + 1; words.append((w, mid))
    fnt = dc.fr(54, 680); maxw = W - 2 * 120; spw = int(fnt.size * 0.30)
    lines = dc._wrap(words, fnt, maxw, spw)
    if len(lines) > 3: fnt = dc.fr(44, 680); spw = int(fnt.size * 0.30); lines = dc._wrap(words, fnt, maxw, spw)
    nl = len(lines); lh = int(fnt.size * 1.20); blockh = lh * nl
    y0 = 1502 - blockh // 2
    return dict(ap=ap, prog=prog, lines=lines, fnt=fnt, spw=spw, y0=y0, lh=lh, blockh=blockh)

def draw_caption_slug(img, cl):
    """The ink slug UNDER the caption (drawn pre-set_frame_bg so contrast is measured vs the slug)."""
    d = ImageDraw.Draw(img, "RGBA")
    pad = 22
    wmax = 0
    for ln in cl["lines"]:
        lw = sum(dc.tw(w, cl["fnt"]) for w, _ in ln) + cl["spw"] * (len(ln) - 1)
        wmax = max(wmax, lw)
    x0 = (W - wmax) // 2 - pad - 12; x1 = (W + wmax) // 2 + pad
    y0 = cl["y0"] - 14; y1 = cl["y0"] + cl["blockh"] + 12
    slug_a = min(1.0, cl["ap"] * 2.2)
    d.rounded_rectangle([x0, y0, x1, y1], 8, fill=(*INK, int(246 * slug_a)))
    d.rectangle([x0, y0, x0 + 7, y1], fill=(*VERM, int(255 * slug_a)))
    return img

def draw_caption_words(img, cl):
    d = ImageDraw.Draw(img, "RGBA")
    ap, prog, fnt, spw = cl["ap"], cl["prog"], cl["fnt"], cl["spw"]
    nl = len(cl["lines"])
    for li, ln in enumerate(cl["lines"]):
        lr = float(E.out_cubic(max(0.0, min(1.0, (prog - li / max(1, nl) + 0.10) / 0.16))))
        la = ap * lr
        if la <= 0.02: continue
        rise = int((1 - lr) * 10)
        lwf = sum(dc.tw(w, fnt) for w, _ in ln) + spw * (len(ln) - 1)
        x = (W - lwf) // 2; y = cl["y0"] + li * cl["lh"] + rise
        for (w, mid) in ln:
            col = PARCH if mid <= prog - 0.05 else (VERM_HI if mid <= prog + 0.05 else (182, 188, 196))
            d.text((x, y), w, font=fnt, fill=(*col, int(255 * la)))
            dc.logw(x, y, dc.tw(w, fnt), fnt.size, col, la, (mid <= prog + 0.05) and (la >= 0.6), "caption")
            x += dc.tw(w, fnt) + spw
    # progress rule on the slug
    uw = W - 2 * 170; ux = 170; uy = cl["y0"] + cl["blockh"] + 2
    d.line([(ux, uy), (ux + uw, uy)], fill=(90, 84, 74, int(120 * ap)), width=2)
    d.line([(ux, uy), (ux + int(uw * prog), uy)], fill=(*VERM_HI, int(230 * ap)), width=3)
    return img

# ---------------- compose ----------------
SCENES = [scene1, scene2, scene3, scene4, scene5, scene6]
def compose(f):
    # which shot
    si = 0
    for i, (a, b) in enumerate(SHOT_F):
        if a <= f < b: si = i; break
    else: si = len(SHOT_F) - 1
    img = SCENES[si](f)
    # mask-wipe into the colophon (57.5s, ~0.7s): vermilion press roller sweeps up
    t = f / FPS
    if 60.05 <= t < 60.75:
        p = (t - 60.05) / 0.7
        a_img = scene5(f); b_img = scene6(f)
        yline = int(H * (1 - E.in_out_cubic(p)))
        m = Image.new("L", (W, H), 0); md = ImageDraw.Draw(m)
        md.rectangle([0, yline, W, H], fill=255)
        img = dc.mask_wipe(a_img, b_img, m)
        d = ImageDraw.Draw(img)
        d.rectangle([0, yline - 46, W, yline + 12], fill=VERM)
    return img

def render_range(a, b):
    for f in range(a, b):
        img = compose(f)
        u8 = dc.finish(np.asarray(img, np.uint8), seed=f * 7 + 3)
        img = Image.fromarray(u8)
        cl = caption_slug_layout(f)
        if cl: img = draw_caption_slug(img, cl)
        img4 = img.convert("RGBA")
        dc.set_frame_bg(img4, f)
        if cl: img4 = draw_caption_words(img4, cl)
        # outro text logging happens inside scene6 pre-grade; re-log post-grade words for gate:
        img = img4.convert("RGB")
        dc.flush_textlog(f)
        img.save(os.path.join(FR_DIR, f"frame_{f:05d}.png"))

if __name__ == "__main__":
    a = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    b = int(sys.argv[2]) if len(sys.argv) > 2 else NF
    b = min(b, NF)
    if a == 0:
        dc.write_shots([
            {"id": 1, "start": 0,             "end": S(12.2),        "framing": "wide-establish",  "transition_in": "",               "note": "THE ASK: 4,700 ACRES stamps; evidence clipping; parcel chits"},
            {"id": 2, "start": S(12.2),       "end": S(25.2),        "framing": "data-panel",      "transition_in": "graphic-match",  "note": "THE APPETITE: chits multiply into the 100-house grid; Hollister chip"},
            {"id": 3, "start": S(25.2),       "end": S(39.7),        "framing": "two-up",          "transition_in": "carried-element","note": "THE EMPTY PIPE: gas band drains beside diesel stack"},
            {"id": 4, "start": S(39.7),       "end": S(51.3),        "framing": "subject-portrait","transition_in": "assemble",       "note": "THE TURBINE: LM6000 assembles; $120M; the glyph coil +195%"},
            {"id": 5, "start": S(51.3),       "end": S(60.4),        "framing": "wide-establish",  "transition_in": "carried-element","note": "THE OPEN CIRCUIT: loop + feedback arc; pulses die; the question"},
            {"id": 6, "start": S(60.4),       "end": NF,             "framing": "push-detail",     "transition_in": "mask-wipe",      "note": "COLOPHON: press roller; wordmark; sources"},
        ], NF)
    render_range(a, b)
    print(f"rendered {a}..{b}")
