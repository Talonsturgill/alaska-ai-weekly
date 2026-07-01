"""
render_yakutat.py — Dispatch 2026-07-01 — "the machine drew the hidden edge".

Authored FRESH to out/dispatch/storyboard.json (Gate 0A+0B green). Imports the shared craft from
dispatch_core (fonts, finish/grade, voice-synced captions, easing, outro helpers, write_shots); the
COMPOSITION is new. Six genuinely different worlds joined by SMOOTH MORPHS, with the crimson razor EDGE
as the carried through-line (the still point) while the world around it cross-transforms:
  1 SCAN (top-down field, a scan igniting ~1,750 hidden quakes)
  2 RAZOR EDGE (the points morph onto a 250 km line on a map of southern Alaska)
  3 SLAB (the map opens into an oblique cross-section; a stress mark migrates the boundary)
  4 LOOMING FAULT (low-angle; a ghosted PROPOSED vector reaches the Denali Fault; 2002 M7.9)
  5 THE LIMIT (drawn: edge razor-sharp in space = WHERE; a time axis fogged = WHEN)
  6 WORDMARK (the edge graphic-matches into the ALASKA.AI rule)
9:16 1080x1920, 1800 frames @30fps. Usage: python3 render_yakutat.py [start end] | shots | contact
"""
import os, sys, json, math, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter
import dispatch_core as dc
import easing as E

W, H, FPS, NF = dc.W, dc.H, dc.FPS, 1800
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "frames_yakutat")

# ---- the story's color world (fresh: basalt + incandescent crimson-to-orange + bone + slate) ----
BASALT = np.array([14, 15, 20]); CRIMSON = (226, 58, 42); EMBER = (255, 150, 60)
BONE = (226, 232, 228); SLATE = (78, 92, 110); GHOST = (150, 120, 150)

# ---- shot boundaries (frames) : 0,9,19,29.5,40,49,60 s ----
B = [0, 270, 570, 885, 1200, 1470, NF]
MW = 22                                                     # morph window (frames) at each boundary
def shot_at(f):
    i = 0
    for k in range(6):
        if f >= B[k]: i = k
    return i

# ---- the carried EDGE: one wavy NW->SE razor line (frame coords), constant across worlds 2-5 ----
NL = 80
_tl = np.linspace(0, 1, NL)
EDGE = np.stack([200 + _tl * 690, 560 + _tl * 815 + np.sin(_tl * math.pi * 1.7) * 46 + np.sin(_tl * 7) * 12], 1)
EDGE_H = np.stack([np.linspace(150, W - 150, NL), np.full(NL, 1180.0)], 1)      # horizontal rule (wordmark world)
# ~1,750 quakes (render subset); scatter positions + their target on the line
NP = 620
_rng = np.random.default_rng(21)
SCAT = np.stack([_rng.uniform(150, W - 130, NP), _rng.uniform(430, 1520, NP)], 1)
_ti = np.sort(_rng.uniform(0, 1, NP)); LPT = np.stack([200 + _ti * 690, 560 + _ti * 815 + np.sin(_ti * math.pi * 1.7) * 46 + np.sin(_ti * 7) * 12], 1)
LPT += _rng.normal(0, 5, (NP, 2))                          # slight jitter on the line

def edge_now(f):
    """The carried crimson edge polyline for frame f (morphs to a horizontal rule for the wordmark)."""
    i = shot_at(f)
    if i >= 5:
        p = E.in_out_sine(E.seg(f, B[5], B[5] + 26)); return EDGE * (1 - p) + EDGE_H * p
    return EDGE

def glow_ribbon(pts, color, width, glow):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.line([tuple(p) for p in pts], fill=(*color, 255), width=width + 7, joint="curve")
    lay = Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 0)), lay.filter(ImageFilter.GaussianBlur(10)), min(1.0, glow))
    d2 = ImageDraw.Draw(lay)
    d2.line([tuple(p) for p in pts], fill=(*color, 255), width=width, joint="curve")
    d2.line([tuple(p) for p in pts], fill=(255, 240, 220, 230), width=max(1, width // 3), joint="curve")
    return lay

_YY, _XX = np.mgrid[0:H, 0:W].astype(np.float32)
def basalt_bg(seed, warm=0.0):
    n = gaussian_filter(np.random.default_rng(seed).standard_normal((H // 6, W // 6)), 4)
    n = np.asarray(Image.fromarray(((n - n.min()) / (np.ptp(n) + 1e-6) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255
    arr = BASALT[None, None, :] + (n[..., None] * np.array([16, 14, 20]) - 6)
    arr += np.clip(0.5 - _YY / H, -0.4, 0.5)[..., None] * np.array([6, 7, 10])
    r2 = (((_XX - W / 2) / (W * 0.60)) ** 2 + ((_YY - H * 0.42) / (H * 0.60)) ** 2)    # depth: motivated key + filmic vignette
    arr += np.clip(1 - r2, 0, 1)[..., None] * np.array([11, 11, 14]) * 0.85            # soft central light lift (the field has a center)
    arr -= np.clip(r2 - 0.55, 0, 1.1)[..., None] * np.array([11, 12, 15])              # edges recede into shadow
    arr += (np.random.default_rng(seed + 7).random((H, W, 1)) - 0.5) * 2.6             # hi-freq dither: no 8-bit gradient banding
    if warm > 0:                                            # a deep magma warmth low in frame
        arr += np.exp(-((_YY / H - 0.86) / 0.22) ** 2)[..., None] * np.array([60, 26, 8]) * warm
    return np.clip(arr, 0, 255)

def graticule(d, a=1.0):
    for gx in range(0, W, 120): d.line([(gx, 0), (gx, H)], fill=(*SLATE, int(30 * a)), width=1)
    for gy in range(0, H, 120): d.line([(0, gy), (W, gy)], fill=(*SLATE, int(30 * a)), width=1)

def eyebrow(d, f):
    dc.tk(d, "ALASKA.AI", dc.mono(18, True), (*BONE, 235), 96, 74, 0.14)
    dc.tk(d, "/  SEISMIC DISPATCH", dc.mono(18), (*(210, 120, 90), 180), 96 + dc.tw("ALASKA.AI", dc.mono(18, True), .14) + 16, 74, 0.14)

def alaska_coast(d, a):
    """A stylized southern-Alaska coastline mass (bottom), so the map reads as territory, not a void."""
    poly = [(0, H), (0, 1180), (250, 1230), (520, 1300), (760, 1250), (980, 1330), (W, 1290), (W, H)]
    d.polygon(poly, fill=(int(22 * 1), int(26), int(30), int(210 * a)))
    d.line(poly[1:-1], fill=(*SLATE, int(150 * a)), width=2, joint="curve")

# ---- the six worlds (each returns an RGB uint8 array, PRE-finish; the edge is drawn on top later) ----
def w_scan(f):
    arr = basalt_bg(500)
    im = Image.fromarray(arr.astype(np.uint8)); d = ImageDraw.Draw(im, "RGBA")
    graticule(d, 0.7)
    sy = int(E.out_cubic(E.seg(f, 8, B[1] - 20)) * (H + 120))                 # the scan sweeps down
    ig = E.out_cubic(E.seg(f, 8, B[1] - 10))                                  # fraction of quakes ignited
    for i in range(int(NP * ig)):
        x, y = SCAT[i]; near = max(0.0, 1 - abs(y - sy) / 90.0)
        r = 2 + near * 3; col = (255, 200, 150) if near > 0.4 else (210, 70, 50)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(*col, 235))
    if 0 < sy < H:                                                           # the scan line + soft leading glow
        d.rectangle([0, sy - 2, W, sy + 2], fill=(120, 170, 200, 150))
        d.rectangle([0, sy - 40, W, sy], fill=(70, 110, 150, 40))
    raw = min(1.0, E.out_cubic(E.seg(f, 24, 130)))                           # the count races up, then LOCKS + holds
    cnt = int(round(raw * 1750))
    disp = "~1,750" if raw >= 0.999 else f"{cnt:,}"                          # holds on the verified ~1,750 for most of the shot
    cf = dc.mono(30, True); s = f"{disp}  HIDDEN QUAKES"
    dc.tk(d, s, cf, (*BONE, 210), 96, 1372, 0.02)
    dc.tk(d, "MACHINE-LEARNING SCAN  ·  SEISMIC CATALOG", dc.mono(16, m=True), (*SLATE, 210), 96, 1420, 0.02)
    return np.asarray(im.convert("RGB"))

def w_edge(f):
    arr = basalt_bg(500)
    im = Image.fromarray(arr.astype(np.uint8)); d = ImageDraw.Draw(im, "RGBA")
    graticule(d, 0.7); alaska_coast(d, 1.0)
    for i in range(0, NP, 2):                                               # the quakes, now settled on the line
        x, y = LPT[i]; d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(255, 150, 90, 150))
    for t in (0.16, 0.5, 0.84):                                             # bone-white station pins
        px, py = EDGE[int(t * (NL - 1))]
        d.line([(px, py - 16), (px, py + 4)], fill=(*BONE, 220), width=2)
        d.ellipse([px - 4, py - 20, px + 4, py - 12], outline=(*BONE, 230), width=2)
    dc.tk(d, "YAKUTAT MICROPLATE", dc.mono(22, True), (*BONE, 235), 96, 470, 0.02)
    dc.tk(d, "the razor edge  ·  ~1,750 quakes  ·  250 km", dc.mono(17, m=True), (*(210, 120, 90), 220), 96, 508, 0.02)
    dc.tk(d, "SOUTHERN ALASKA", dc.mono(16, m=True), (*SLATE, 210), 96, 1372, 0.02)
    return np.asarray(im.convert("RGB"))

def w_slab(f):
    arr = basalt_bg(700, warm=0.7)
    im = Image.fromarray(arr.astype(np.uint8)); d = ImageDraw.Draw(im, "RGBA")
    # crust strata ABOVE the edge (stacked layers), then the descending slab wedge BELOW it
    strata = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(strata)   # crust layers as ROCK, not a UI band
    for yy, col in [(150, (40, 42, 50)), (300, (52, 48, 46)), (450, (44, 40, 44))]:
        sd.rectangle([0, yy, W, yy + 120], fill=(*col, 48))
        sd.line([(0, yy), (W, yy)], fill=(72, 66, 60, 80), width=2)                 # a faint stratum contact line
    strata = strata.filter(ImageFilter.GaussianBlur(9))                             # feather the seams (no hard letterbox edge)
    im = Image.alpha_composite(im.convert("RGBA"), strata).convert("RGB"); d = ImageDraw.Draw(im, "RGBA")
    epts = [tuple(p) for p in EDGE]
    wedge = [(EDGE[0][0], EDGE[0][1])] + epts + [(EDGE[-1][0], EDGE[-1][1]), (W, H), (0, H)]
    d.polygon(wedge, fill=(20, 16, 22, 235))                                # the slab body diving under
    for k in range(1, 5):                                                   # faint internal slab layering
        off = k * 60; d.line([(p[0], p[1] + off) for p in EDGE], fill=(60, 44, 40, 90), width=2, joint="curve")
    sm = E.seg(f, B[2] + 10, B[3] - 10); idx = int(sm * (NL - 1))           # the migrating STRESS MARK — a traveling load
    mx, my = EDGE[idx]
    for k in range(26, 0, -1):                                             # a LUMINOUS tapered streak trailing the head => it is clearly TRAVELING
        j0 = max(0, idx - k); j1 = max(0, idx - k + 1); f2 = 1 - k / 26.0
        d.line([tuple(EDGE[j0]), tuple(EDGE[j1])], fill=(255, 185, 100, int(210 * f2 ** 1.35)), width=max(1, int(11 * f2)))
    d.ellipse([mx - 24, my - 24, mx + 24, my + 24], fill=(255, 170, 80, 60))    # head bloom
    d.ellipse([mx - 13, my - 13, mx + 13, my + 13], fill=(255, 150, 70, 120))   # inner glow
    d.ellipse([mx - 7, my - 7, mx + 7, my + 7], fill=(255, 234, 165, 250))      # the bright leading head
    dc.tk(d, "THE EDGE IS A SLAB, DIVING", dc.mono(22, True), (*BONE, 235), 96, 300, 0.02)
    dc.tk(d, "collision loads the crust  ·  stress migrates", dc.mono(17, m=True), (*(230, 170, 110), 220), 96, 338, 0.02)
    return np.asarray(im.convert("RGB"))

def w_fault(f):
    # low-angle: a dark foreground ground rising to a horizon; the looming DENALI scarp across the mid-ground
    yy = np.linspace(0, 1, H)[:, None]
    sky = np.array([26, 22, 30])[None, :] * (1 - yy) + np.array([12, 12, 18])[None, :] * yy
    sky += np.exp(-((yy - 0.34) / 0.05) ** 2) * np.array([50, 26, 16]) * 0.5     # a low warm band at the horizon
    arr = np.repeat(np.clip(sky, 0, 255)[:, None, :], W, 1).astype(np.uint8)
    im = Image.fromarray(arr); d = ImageDraw.Draw(im, "RGBA")
    d.polygon([(0, H), (0, 1080), (W, 980), (W, H)], fill=(16, 14, 18, 255))     # foreground ground
    dn = [(0, 760), (280, 700), (560, 740), (820, 690), (W, 730)]                # the looming Denali scarp
    fl = E.out_cubic(E.seg(f, B[3] + 60, B[3] + 120)) * (0.4 + 0.6 * abs(math.sin(f * 0.25)))  # ghosted flare
    d.line(dn, fill=(*GHOST, int(120 + 100 * fl)), width=5, joint="curve")
    for x in range(60, W, 46):                                                   # the ghosted, dotted PROPOSED vector traveling north
        prog = E.out_cubic(E.seg(f, B[3] + 6, B[3] + 90))
        yv = 980 - prog * 220
        if 780 < yv: d.ellipse([x - 3, yv - 3, x + 3, yv + 3], fill=(*GHOST, 150))
    dc.tk(d, "A PROPOSED LINK", dc.mono(20, True), (*BONE, 230), 96, 560, 0.02)
    dc.tk(d, "DENALI FAULT", dc.mono(24, True), (*BONE, int(150 + 90 * fl)), 96, 700, 0.03)
    dc.tk(d, "2002  ·  M7.9", dc.mono(18, m=True), (*(235, 150, 120), 235), 96, 736, 0.02)
    dc.tk(d, "researchers propose", dc.mono(15, m=True), (*SLATE, 220), 96, 764, 0.02)
    return np.asarray(im.convert("RGB"))

def w_limit(f):
    arr = basalt_bg(900)
    im = Image.fromarray(arr.astype(np.uint8)); d = ImageDraw.Draw(im, "RGBA")
    graticule(d, 0.4)
    # ---- WHERE (known): crisp cross-ticks precisely locating points ON the razor edge — certainty in space ----
    wp = E.out_cubic(E.seg(f, B[4] + 16, B[4] + 84))
    for t in np.linspace(0.10, 0.90, 9):
        if t <= 0.10 + 0.80 * wp:
            px, py = EDGE[int(t * (NL - 1))]
            d.line([(px - 12, py + 5), (px + 12, py - 5)], fill=(*BONE, 225), width=2)     # sharp = precisely located
    # ---- WHEN (unknown): a TIME axis in open space — crisp at 'now', DISSOLVING into fog toward a '?' it never resolves ----
    tp = E.out_cubic(E.seg(f, B[4] + 60, B[4] + 150))
    tx0, tay, span = 545, 640, 400; txe = tx0 + int(span * tp)
    fog = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(fog)
    for tx in range(tx0, txe, 4):
        frac = (tx - tx0) / span                                                          # 0 crisp -> 1 fogged
        aa = int(235 * (1 - frac) ** 1.35)
        wob = int((frac ** 1.7) * math.sin(tx * 0.10 + f * 0.2) * 22)                      # the axis wanders as certainty fails
        fd.line([(tx, tay + wob), (tx, tay + 3 + wob)], fill=(162, 166, 190, max(0, aa)), width=3)
    fog = fog.filter(ImageFilter.GaussianBlur(2))
    im = Image.alpha_composite(im.convert("RGBA"), fog).convert("RGB"); d = ImageDraw.Draw(im, "RGBA")
    d.line([(tx0, tay - 13), (tx0, tay + 13)], fill=(*BONE, 225), width=2)                 # 'now' — the one certain point
    dc.tk(d, "now", dc.mono(16, m=True), (*BONE, 205), tx0 - 8, tay + 24, 0.02)
    if tp > 0.45:                                                                          # a ghosted '?' at the fogged end
        qa = int(150 * E.seg(f, B[4] + 118, B[4] + 158)); qf = dc.mono(58, True)
        d.text((tx0 + span - 30, tay - 48), "?", font=qf, fill=(150, 152, 178, qa))
    # ---- labels: WHERE (left, known) vs WHEN (right, unknowable) ----
    dc.tk(d, "WHERE the edge is", dc.mono(20, True), (*BONE, 235), 96, 470, 0.02)
    dc.tk(d, "known", dc.mono(18, m=True), (120, 220, 150, 235), 96 + dc.tw("WHERE the edge is ", dc.mono(20, True), .02), 470, 0.02)
    dc.tk(d, "WHEN it moves", dc.mono(20, True), (*BONE, 210), tx0, 500, 0.02)
    dc.tk(d, "the model can't say", dc.mono(18, m=True), (210, 120, 110, 225), tx0, 534, 0.02)
    return np.asarray(im.convert("RGB"))

def w_wordmark(f):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    t = f - B[5]                                                        # a slow LIVING drift of the glow (motion runs to the last frame)
    cx = W / 2 + 46 * math.sin(t * 0.040); cy = H * 0.42 + 30 * math.sin(t * 0.055 + 1.0)
    br = 1.0 + 0.10 * math.sin(t * 0.075)
    r = np.sqrt(((xx - cx) / W) ** 2 + ((yy - cy) / H) ** 2)
    base = np.clip(30 * br * np.exp(-(r * 2.4) ** 2), 0, 58)
    arr = np.dstack([np.clip(14 + base * .8, 0, 255), np.clip(15 + base * .7, 0, 255), np.clip(20 + base * .9, 0, 255)]).astype(np.uint8)
    return arr

WORLD = [w_scan, w_edge, w_slab, w_fault, w_limit, w_wordmark]

def base_world(f):
    """Render the current world, cross-dissolving into it across the morph window at each boundary."""
    i = shot_at(f)
    cur = WORLD[i](f)
    if i > 0 and f < B[i] + MW:                                              # hinged dissolve into each world (the point morph rides on top at 1->2)
        p = E.in_out_sine((f - B[i]) / MW); prev = WORLD[i - 1](f)
        cur = (prev.astype(np.float32) * (1 - p) + cur.astype(np.float32) * p).astype(np.uint8)
    return cur

def draw_points_or_edge(img, f):
    """Shot 1 = scattered igniting points; the 1->2 morph converges them onto the line; shots 2+ = the carried edge."""
    i = shot_at(f); d = ImageDraw.Draw(img, "RGBA")
    if i == 0:
        return img                                                          # points are drawn inside w_scan
    if i == 1 and f < B[1] + 60:                                            # THE HERO MORPH: scatter -> line
        p = E.in_out_sine(E.seg(f, B[1], B[1] + 60))
        pos = SCAT * (1 - p) + LPT * p
        for k in range(0, NP, 2):
            x, y = pos[k]; d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(255, 130, 80, int(120 + 100 * p)))
        if p > 0.3:
            img = Image.alpha_composite(img.convert("RGBA"), glow_ribbon(edge_now(f), CRIMSON, int(5 * p), 0.5 * p)).convert("RGB")
        return img
    ep = edge_now(f)
    return Image.alpha_composite(img.convert("RGBA"), glow_ribbon(ep, CRIMSON, 6, 0.55)).convert("RGB")

def outro(d, f):
    start = max(B[5] + 30, int(dc.TIM["speech_end"] * FPS) + 10)
    a1 = E.out_cubic(E.seg(f, start, start + 44))
    if a1 > 0.02:
        wf = dc.fr(96, 820, 144); s = "ALASKA.AI"; w = dc.tw(s, wf, 0.04)
        dc.tk(d, s, wf, (255, 236, 210, int(255 * a1)), (W - w) // 2, 1090 - int((1 - a1) * 16), 0.04)
    a2 = E.out_cubic(E.seg(f, start + 40, start + 78))
    if a2 > 0.02:
        tf = dc.fr(38, 600, 144); s2 = "what's moving in alaska ai, this week"; w2 = dc.tw(s2, tf, 0.02)
        dc.tk(d, s2, tf, (226, 232, 228, int(226 * a2)), (W - w2) // 2, 1214, 0.02)
        cf = dc.mono(16, m=True); s3 = "Miller et al., ANU  ·  The Seismic Record (2026)"
        dc.tk(d, s3, cf, (*SLATE, int(210 * a2)), (W - dc.tw(s3, cf, .02)) // 2, 1268, 0.02)
    if a1 > 0.25:                                                       # beat 14: the last incandescent point drifts the wordmark rule
        dp = E.seg(f, start + 16, NF); px = 168 + dp * (W - 336); py = 1180
        gl = 0.72 + 0.28 * math.sin(f * 0.22)                           # a calm alive pulse as it travels
        for rr, aa in ((20, 45), (11, 95), (5, 220)):
            d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=(255, 182, 104, int(aa * a1 * gl)))

# ---- lower-third scrim so captions always clear the contrast floor (READABILITY) ----
_scrim = np.clip(150 * np.exp(-((np.arange(H, dtype=np.float32) - 1500) / 150) ** 2), 0, 255).astype(np.uint8)
SCRIM = np.zeros((H, W, 4), np.uint8); SCRIM[..., 3] = _scrim[:, None]; SCRIM_IMG = Image.fromarray(SCRIM, "RGBA")

def render_frame(f):
    base = base_world(f)
    img = Image.fromarray(dc.finish(base, 3000 + f)).filter(ImageFilter.UnsharpMask(2.2, 90, 2))
    img = draw_points_or_edge(img.convert("RGB"), f)
    img = Image.alpha_composite(img.convert("RGBA"), SCRIM_IMG).convert("RGB")
    dc.set_frame_bg(img, f, clear=True)
    d = ImageDraw.Draw(img, "RGBA"); eyebrow(d, f)
    dc.caption(img, f);
    d2 = ImageDraw.Draw(img, "RGBA"); outro(d2, f)
    fin = E.seg(f, 0, 16)
    if fin < 1: img = Image.alpha_composite(img.convert("RGBA"), Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - E.out_cubic(fin)))))).convert("RGB")
    outf = E.seg(f, NF - 46, NF)
    if outf > 0: img = Image.alpha_composite(img.convert("RGBA"), Image.new("RGBA", (W, H), (0, 0, 0, int(250 * E.in_out_sine(outf))))).convert("RGB")
    dc.flush_textlog(f)
    return img.convert("RGB")

def emit_shots():
    fr = ["wide-establish", "map-territory", "alt-vantage", "two-up", "data-panel", "subject-portrait"]
    tr = ["fade-up", "morph", "map-travel", "morph", "morph", "graphic-match"]
    sl = [{"id": i + 1, "start": B[i], "end": B[i + 1], "framing": fr[i], "transition_in": tr[i], "is_oner": False} for i in range(6)]
    dc.write_shots(sl, NF); return sl

def render_range(a, b):
    os.makedirs(OUT, exist_ok=True)
    for f in range(a, b): render_frame(f).save(os.path.join(OUT, f"frame_{f:05d}.png"), compress_level=1)

def build_contact():
    fs = sorted(glob.glob(os.path.join(OUT, "frame_*.png")))
    th = [Image.open(fs[i]).resize((W // 6, H // 6)) for i in range(0, len(fs), 60)]
    cols = max(1, len(th)); sheet = Image.new("RGB", ((W // 6) * cols, H // 6), (0, 0, 0))
    for i, im in enumerate(th): sheet.paste(im, ((W // 6) * i, 0))
    sheet.save(os.path.join(HERE, "contact_yakutat.png")); print(f"contact {cols} thumbs / {len(fs)} frames")

def main():
    a = sys.argv[1:]
    if a and a[0] == "shots": emit_shots(); return
    if a and a[0] == "contact": build_contact(); return
    if len(a) == 2: render_range(int(a[0]), int(a[1])); return
    emit_shots(); render_range(0, NF); build_contact()

if __name__ == "__main__":
    main()
