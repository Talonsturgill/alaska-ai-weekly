"""
Alaska.Ai Dispatch — "The Count from a Dot" (9:16, 1080x1920, 60s/1800f).
STORY: OWL (Microsoft AI for Good), a weakly-supervised model that counts Alaska caribou in aerial
survey photos from a single point per animal, validated on ADF&G's 2022 Central Arctic census
(F1 0.965, +3.1%), honest about the dense crush where its count slips.
Composition fingerprint: top-down-map / horizontal-traverse / multiplicity-swarm / map-territory /
naturalistic-scene / autumn-tundra+mint. Authored FRESH to out/dispatch/storyboard.json (7 shots).

Runs from the WORK dir (out/dispatch): reads audio/timing60.json + audio/words60.json, writes
frames_v3/*.png, textlog/*.json (readability manifest), and shots.json (scene-structure manifest).
  range: python render_owl.py 0 1800
  test:  python render_owl.py test 30 260 560 800 1120 1300 1600 1799
"""
import sys, os, math, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, "frames_v3"); os.makedirs(FR, exist_ok=True)
TLOG_DIR = os.path.join(HERE, "textlog"); os.makedirs(TLOG_DIR, exist_ok=True)
# fonts live in the repo .claude skills (HERE = out/dispatch -> ../../.claude/...)
FONTS = os.path.abspath(os.path.join(HERE, "..", "..", ".claude", "skills", "alaska-ai-brief", "fonts"))
W, H, FPS, NF = 1080, 1920, 30, 1800
LOGTEXT = os.environ.get("DISPATCH_TEXTLOG") == "1"

# ---------------- autumn-tundra + phosphor-mint palette ----------------
INK      = (14, 18, 24)
RUST     = (122, 54, 34);  CRANBERRY = (96, 34, 40);  OCHRE = (156, 100, 42)
BRASS    = (182, 138, 60); LICHEN    = (138, 140, 92); SAGE  = (108, 120, 86)
SLATE    = (52, 60, 74);   SLATE_HI  = (96, 108, 126); DUSK  = (34, 40, 52)
CARIBOU  = (86, 62, 44);   CARIBOU_HI= (140, 112, 84); FAWN = (176, 150, 120)
MINT     = (104, 240, 196); MINT_HI  = (188, 255, 226); MINT_LO = (44, 150, 128)
SNOW     = (244, 250, 255); GOLD     = (255, 199, 44);  AMBER = (255, 176, 92)
GREY     = (150, 164, 182)

# ---------------- type system (Fraunces Black + JetBrains Mono) ----------------
_FCACHE = {}
def fr(sz, wt=900, op=144, it=False, sf=0):
    k = ("fr", sz, wt, op, it, sf)
    if k in _FCACHE: return _FCACHE[k]
    f = ImageFont.truetype(os.path.join(FONTS, "Fraunces-Italic-Var.ttf" if it else "Fraunces-Var.ttf"), sz)
    try: f.set_variation_by_axes([op, wt, sf, 0])
    except Exception: pass
    _FCACHE[k] = f; return f
def mono(sz, b=False, m=False):
    k = ("mono", sz, b, m)
    if k in _FCACHE: return _FCACHE[k]
    f = ImageFont.truetype(os.path.join(FONTS, "JetBrainsMono-Bold.ttf" if b else ("JetBrainsMono-Medium.ttf" if m else "JetBrainsMono-Regular.ttf")), sz)
    _FCACHE[k] = f; return f
def tw(t, f, tr=0.0):
    ex = int(round(f.size * tr)); s = 0
    for c in t: b = f.getbbox(c); s += (b[2] - b[0]) + ex
    return s - ex
def tk(d, t, f, fill, x, y, tr=0.0):
    ex = int(round(f.size * tr)); c = x
    for ch in t: d.text((c, y), ch, font=f, fill=fill); b = f.getbbox(ch); c += (b[2] - b[0]) + ex

# ---------------- easing ----------------
def clamp01(x): return 0.0 if x < 0 else (1.0 if x > 1 else x)
def seg(t, a, b): return clamp01((t - a) / (b - a)) if b > a else (1.0 if t >= b else 0.0)
def oc(t): t = clamp01(t); return 1 - (1 - t) ** 3
def ss(t): t = clamp01(t); return t * t * (3 - 2 * t)
def eio(t): t = clamp01(t); return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2
def lerp(a, b, t): return a + (b - a) * t
def mix(c1, c2, t):
    t = clamp01(t); return tuple(int(round(lerp(c1[i], c2[i], t))) for i in range(3))

# ---------------- timing ----------------
TIM = json.load(open(os.path.join(HERE, "audio", "timing60.json")))
CUES = json.load(open(os.path.join(HERE, "audio", "words60.json")))["words"]
SEG = TIM["seg_starts"]; SPEECH_END = TIM.get("speech_end", 50.0)
BOUNDS = TIM["shot_bounds"]  # [15,246,506,723,1082,1244,1389]
# shot frame windows (shot1 opens at 0 for full coverage)
SHOTS = [(0, BOUNDS[1]), (BOUNDS[1], BOUNDS[2]), (BOUNDS[2], BOUNDS[3]),
         (BOUNDS[3], BOUNDS[4]), (BOUNDS[4], BOUNDS[5]), (BOUNDS[5], BOUNDS[6]), (BOUNDS[6], NF)]
FRAMING = ["wide-establish", "alt-vantage", "macro-closeup", "data-panel", "two-up", "push-detail", "map-territory"]
TRANS = ["", "carried-element", "match-cut", "graphic-match", "match-cut", "fui-boot", "crossfade"]
TW_LEN = 18  # transition blend length (frames)

def shot_of(f):
    for i, (a, b) in enumerate(SHOTS):
        if a <= f < b: return i
    return len(SHOTS) - 1

# ---------------- readability manifest (per-word brightness/contrast for the gate) ----------------
TEXTLOG = []; BGLUMA = None
def _lum(a): return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
def set_frame_bg(img, f):
    global BGLUMA, TEXTLOG
    if LOGTEXT and f % 6 == 0:
        TEXTLOG = []; BGLUMA = _lum(np.asarray(img.convert("RGB")).astype(np.float32))
    else: BGLUMA = None
def logw(x, y, wpx, hpx, col, alpha, target, kind):
    if not LOGTEXT or BGLUMA is None: return
    x0 = max(0, int(x)); y0 = max(0, int(y)); x1 = min(W, int(x + wpx)); y1 = min(H, int(y + hpx))
    if x1 <= x0 or y1 <= y0: return
    bg = float(BGLUMA[y0:y1, x0:x1].mean()); fl = float(0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2])
    TEXTLOG.append({"kind": kind, "alpha": round(float(alpha), 3), "fill_luma": round(fl, 1),
                    "bg_luma": round(bg, 1), "vis": round(fl / 255.0 * float(alpha), 3),
                    "target": bool(target) and float(alpha) >= 0.62})
def flush_textlog(f):
    if LOGTEXT and f % 6 == 0:
        json.dump(TEXTLOG, open(os.path.join(TLOG_DIR, f"frame_{f:05d}.json"), "w"))

# ---------------- cinematic finish (linear ACES + autumn split-tone + bloom + grain + vignette) ----------------
_Y, _X = np.mgrid[0:H, 0:W].astype(np.float32)
_R = np.sqrt(((_X - W / 2) / (W / 2)) ** 2 + ((_Y - H / 2) / (H / 2)) ** 2)
def finish(u8, seed):
    f = u8.astype(np.float32) / 255.
    a, b, c, d, e = 2.51, .03, 2.43, .59, .14
    g = np.clip((f * (a * f + b)) / (f * (c * f + d) + e), 0, 1)
    g = np.clip(g + (g - .5) * .06, 0, 1)
    lum = (0.2126 * g[..., 0] + 0.7152 * g[..., 1] + 0.0722 * g[..., 2])[..., None]
    sh = (1 - lum) ** 2; hi = lum ** 2
    # split-tone: shadows toward dusk-slate, highlights toward warm brass/amber
    g = np.clip(g + (np.array([30, 40, 58]) / 255 - .5) * .085 * sh
                + (np.array([255, 196, 120]) / 255 - .5) * .07 * hi, 0, 1)
    lb = np.clip(lum[..., 0] - .72, 0, 1) / .28; sm = lb[::4, ::4]
    glow = np.asarray(Image.fromarray((np.clip(gaussian_filter(sm, 2.5) + .6 * gaussian_filter(sm, 6), 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.
    g = 1 - (1 - g) * (1 - np.clip(glow[..., None] * np.array([1, .92, .7]) * .13, 0, 1))
    g = g * (0.84 + 0.16 * (1 / (1 + (_R * 1.42) ** 2) ** 2))[..., None]
    rng = np.random.default_rng(seed)
    n = gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 1.1); n /= n.std() + 1e-6
    g = g + (n * np.exp(-((lum[..., 0] - .4) ** 2) / (2 * .25 ** 2)) * (3.6 / 255.))[..., None]
    g = np.clip(g + (rng.random((H, W, 1)) + rng.random((H, W, 1)) - 1) / 255., 0, 1)
    return (g * 255).astype(np.uint8)

# ---------------- ground texture (autumn tundra), precomputed once, panned for horizontal-traverse ----------------
GW, GH = 1720, 1920  # wider than frame so we can pan horizontally
def _build_ground():
    rng = np.random.default_rng(20260708)
    base = np.zeros((GH, GW, 3), np.float32)
    # large-scale mottling between rust/ochre/cranberry/sage
    m1 = gaussian_filter(rng.standard_normal((GH, GW)), 60); m1 = (m1 - m1.min()) / (m1.ptp() + 1e-9)
    m2 = gaussian_filter(rng.standard_normal((GH, GW)), 22); m2 = (m2 - m2.min()) / (m2.ptp() + 1e-9)
    m3 = gaussian_filter(rng.standard_normal((GH, GW)), 8);  m3 = (m3 - m3.min()) / (m3.ptp() + 1e-9)
    for i in range(3):
        base[..., i] = (lerp(RUST[i], OCHRE[i], m1) * 0.6
                        + lerp(CRANBERRY[i], BRASS[i], m2) * 0.25
                        + lerp(SAGE[i], LICHEN[i], m3) * 0.15)
    # fine grain / lichen speckle
    spk = gaussian_filter(rng.standard_normal((GH, GW)), 1.2)
    base += spk[..., None] * 9.0
    # scattered tundra tarns (soft-edged, muted)
    for _ in range(8):
        cx, cy = rng.integers(0, GW), rng.integers(0, GH); rr = rng.integers(18, 40)
        yy, xx = np.ogrid[-cy:GH - cy, -cx:GW - cx]; dd = np.sqrt(xx * xx + yy * yy)
        soft = np.clip(1.0 - (dd - rr + 10) / 12.0, 0, 1) * 0.6  # feathered edge
        for i in range(3): base[..., i] = base[..., i] * (1 - soft) + SLATE[i] * soft
    return np.clip(base, 0, 255).astype(np.uint8)
GROUND = _build_ground()
def ground_pan(px, py, zoom=1.0, shade=1.0):
    cw, ch = int(W / zoom), int(H / zoom)
    x0 = int(clamp01(px) * (GW - cw)); y0 = int(clamp01(py) * (GH - ch))
    crop = GROUND[y0:y0 + ch, x0:x0 + cw]
    img = np.asarray(Image.fromarray(crop).resize((W, H), Image.BILINEAR), np.float32) * shade
    return np.clip(img, 0, 255)

# ---------------- caribou (top-down): body + branching antlers + legs + soft shadow ----------------
def _dark(c, k=0.6): return tuple(int(v * k) for v in c)
def caribou_topdown(dr, x, y, s, ang, col=CARIBOU, alpha=255, shadow=True, detail=None):
    if detail is None: detail = s >= 6
    ca, sa = math.cos(ang), math.sin(ang)
    def R(dx, dy): return (x + dx * ca - dy * sa, y + dx * sa + dy * ca)
    aw = int(min(6, max(1, 0.24 * s)))  # antler stroke (thin, capped)
    lw = int(min(7, max(1, 0.4 * s)))   # leg stroke
    # soft contact shadow / ambient occlusion under the body (subtle, screen-offset down-right, never a hard blob)
    if shadow:
        for (ox, oy, sx, sy, aa) in ((0.55 * s, 0.8 * s, 2.4, 1.05, 14), (0.3 * s, 0.45 * s, 1.9, 0.8, 20)):
            sh = [(x + sx * s * math.cos(th) + ox, y + sy * s * math.sin(th) + oy) for th in [k * math.pi / 8 for k in range(16)]]
            dr.polygon(sh, fill=(18, 16, 20, int(aa * alpha / 255)))
    # legs (only at scale)
    if detail:
        for (lx, ly, ex, ey) in [(-1.8, -1.0, -2.4, -1.9), (-1.8, 1.0, -2.4, 1.9), (1.5, -1.0, 2.1, -1.9), (1.5, 1.0, 2.1, 1.9)]:
            dr.line([R(lx * s, ly * s), R(ex * s, ey * s)], fill=(*_dark(col), alpha), width=lw)
    # body (rotated ellipse) with directional key/core shading (fixed screen light from upper-left)
    body = [R(3.2 * s * math.cos(th), 1.18 * s * math.sin(th)) for th in [k * math.pi / 9 for k in range(18)]]
    dr.polygon(body, fill=(*col, alpha))
    def _blob(scale, dx, dy):  # scale body toward its center (x,y), shift in SCREEN space
        return [(x + (px - x) * scale + dx, y + (py - y) * scale + dy) for (px, py) in body]
    dr.polygon(_blob(0.80, 0.55 * s, 0.62 * s), fill=(*_dark(col, 0.62), int(alpha * 0.5)))     # core shadow (down-right)
    dr.polygon(_blob(0.68, -0.42 * s, -0.52 * s), fill=(*mix(col, CARIBOU_HI, 0.9), int(alpha * 0.55)))  # key light (up-left)
    if detail:
        rump = [R(-2.7 * s + 0.75 * s * math.cos(th), 0.85 * s * math.sin(th)) for th in [k * math.pi / 6 for k in range(12)]]
        dr.polygon(rump, fill=(*mix(col, FAWN, 0.55), int(alpha * 0.7)))
        # rim light along the upper-left contour
        rim = [R(3.2 * s * math.cos(th), 1.18 * s * math.sin(th)) for th in [k * math.pi / 9 for k in range(4, 11)]]
        dr.line([(px - 0.28 * s, py - 0.34 * s) for (px, py) in rim], fill=(*mix(col, SNOW, 0.7), int(alpha * 0.7)), width=max(1, int(0.35 * s)), joint="curve")
    dr.line([R(-1.9 * s, 0), R(2.3 * s, 0)], fill=(*CARIBOU_HI, int(alpha * 0.6)), width=max(1, int(0.5 * s)))
    # neck + head (clearly at the front)
    dr.line([R(3.0 * s, 0), R(4.3 * s, 0)], fill=(*col, alpha), width=max(1, int(1.05 * s)))
    hx, hy = R(4.6 * s, 0); dr.ellipse([hx - 0.85 * s, hy - 0.72 * s, hx + 1.0 * s, hy + 0.72 * s], fill=(*col, alpha))
    # long, thin, forked antlers sweeping forward then out (the caribou signature)
    base = R(4.8 * s, 0)
    for side in (-1, 1):
        m1 = R(6.4 * s, side * 0.8 * s); m2 = R(8.0 * s, side * 1.7 * s); m3 = R(9.2 * s, side * 1.2 * s)
        dr.line([base, m1, m2, m3], fill=(*FAWN, int(alpha * 0.92)), width=aw, joint="curve")   # main beam curling in
        dr.line([m2, R(8.8 * s, side * 2.6 * s)], fill=(*FAWN, int(alpha * 0.9)), width=aw)      # outer tine
        dr.line([m1, R(7.6 * s, side * 0.3 * s)], fill=(*FAWN, int(alpha * 0.88)), width=aw)     # inner tine forward
        dr.line([base, R(6.6 * s, side * 0.05 * s)], fill=(*FAWN, int(alpha * 0.82)), width=aw)  # brow shovel forward

def _herd_positions(n, seed, x0, x1, y0, y1, clump=0.0):
    rng = np.random.default_rng(seed); pts = []
    if clump > 0:
        centers = rng.uniform([x0, y0], [x1, y1], size=(max(2, n // 18), 2))
        for _ in range(n):
            c = centers[rng.integers(0, len(centers))]
            p = c + rng.normal(0, (1 - clump) * 130 + 14, size=2)
            pts.append((float(np.clip(p[0], x0, x1)), float(np.clip(p[1], y0, y1)), float(rng.uniform(0, 2 * math.pi))))
    else:
        for _ in range(n):
            pts.append((float(rng.uniform(x0, x1)), float(rng.uniform(y0, y1)), float(rng.uniform(0, 2 * math.pi))))
    return pts

# =================================================================================
# SCENES — each returns an RGB uint8 array (pre-grade). Authored fresh per storyboard.
# =================================================================================
def brand_eyebrow(dr, f):
    tk(dr, "ALASKA.AI", mono(30, b=True), (*GOLD, 235), 96, 84, 0.14)
    tk(dr, "DISPATCH", mono(30), (*SNOW, 150), 300, 84, 0.14)

def scene1(f, lt):
    # top-down tundra, herd scatter multiplying, an uncountable mint tally spinning (the hook motif)
    t = f / FPS
    px = 0.10 + 0.22 * ss(lt / 8.5)               # slow horizontal traverse
    base = ground_pan(px, 0.34, zoom=1.06, shade=0.92)
    img = Image.fromarray(base.astype(np.uint8)).convert("RGBA")
    dr = ImageDraw.Draw(img, "RGBA")
    # herd count grows over the shot: scatter -> dense field
    grow = ss(seg(t, 1.0, 7.6))
    n = int(lerp(26, 240, grow))
    for (x, y, a) in _herd_positions(n, 7, 60, W - 60, 300, 1150, clump=0.15 + 0.25 * grow):
        s = 3.1 + 1.2 * ((x * 13 + y) % 5) / 5.0
        caribou_topdown(dr, x, y, s, a, alpha=int(200 + 55 * grow))
    return np.asarray(img.convert("RGB"), np.float32)

def scene2(f, lt):
    # GROUND LEVEL: a biologist's light table — a modular contact-sheet grid of aerial prints,
    # a hand dropping ONE point marker on one caribou in one print.
    img = Image.new("RGB", (W, H), DUSK); dr = ImageDraw.Draw(img, "RGBA")
    # table surface
    dr.rectangle([0, 0, W, H], fill=(28, 32, 40))
    # backlit light-table glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle([80, 360, W - 80, 1360], 24, fill=(210, 224, 236, 40))
    img = Image.alpha_composite(img.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(40))).convert("RGB")
    dr = ImageDraw.Draw(img, "RGBA")
    # contact-sheet grid of aerial prints (each a tiny tundra tile with dots)
    rng = np.random.default_rng(3)
    cols, rows = 4, 5; m = 96; gw = (W - 2 * m); cw = gw // cols; ch = 190
    y0 = 386
    zoomp = 1.0 + 0.16 * ss(lt / 8.5)             # slow push-in on the table
    for r in range(rows):
        for c in range(cols):
            x = m + c * cw + 8; y = y0 + r * (ch + 8)
            tile = ground_pan(rng.uniform(0.1, 0.7), rng.uniform(0.1, 0.6), zoom=2.4, shade=0.8)
            tImg = Image.fromarray(tile.astype(np.uint8)).resize((cw - 16, ch - 8))
            img.paste(tImg, (x, y)); dr = ImageDraw.Draw(img, "RGBA")
            dr.rectangle([x, y, x + cw - 16, y + ch - 8], outline=(70, 82, 96, 200), width=2)
            td = ImageDraw.Draw(img, "RGBA")
            for _ in range(rng.integers(3, 8)):
                dx = x + rng.integers(10, cw - 26); dy = y + rng.integers(10, ch - 18)
                caribou_topdown(td, dx, dy, 2.2, rng.uniform(0, 6.28))
    # the ONE hero print (center) enlarged, a hand + marker dropping on one animal
    hx0, hy0, hw, hh = 300, 560, 480, 560
    hero = ground_pan(0.42, 0.30, zoom=1.7, shade=0.95)
    heroI = Image.fromarray(hero.astype(np.uint8)).resize((hw, hh))
    img.paste(heroI, (hx0, hy0)); dr = ImageDraw.Draw(img, "RGBA")
    dr.rectangle([hx0, hy0, hx0 + hw, hy0 + hh], outline=(*SNOW, 220), width=3)
    ax, ay = hx0 + hw // 2, hy0 + hh // 2
    caribou_topdown(dr, ax, ay, 8.5, 0.5, col=CARIBOU, alpha=255)
    # marker drop (a point label) lands on the animal
    drop = oc(seg(lt, (SEG[3] - SEG[2]) - 0.2, (SEG[3] - SEG[2]) + 1.0))  # ~ on "find every animal"
    if drop > 0.02:
        my = ay - int((1 - drop) * 220)
        for k, rr in enumerate((26, 16, 9)):
            dr.ellipse([ax - rr, my - rr, ax + rr, my + rr], outline=(*MINT_HI, int(200 * drop)), width=3 - k)
        if drop > 0.75:
            dr.ellipse([ax - 7, ay - 7, ax + 7, ay + 7], fill=(*MINT_HI, 255)); dr.ellipse([ax - 7, ay - 7, ax + 7, ay + 7], outline=(*INK, 255), width=2)
    return np.asarray(img.convert("RGB"), np.float32)

def scene3(f, lt):
    # MACRO: one caribou in negative space; a bounding box draws then collapses into one mint dot
    # as the model's scan interface assembles.
    # continuous push-in + drift so SOMETHING is always changing across the whole shot
    dur = (SHOTS[2][1] - SHOTS[2][0]) / FPS
    p = clamp01(lt / dur); push = eio(p)
    # a heavily-darkened tundra base that PANS + PUSHES IN the whole shot (keeps 'negative space' but alive)
    gpx = 0.30 + 0.24 * p
    base = ground_pan(gpx, 0.34, zoom=lerp(1.04, 1.30, p), shade=0.42)
    img = Image.fromarray(base.astype(np.uint8)).convert("RGBA")
    # soft vignette field to hold the single-animal focus
    vg = Image.new("RGBA", (W, H), (0, 0, 0, 0)); vd = ImageDraw.Draw(vg)
    vd.ellipse([120, 480, W - 120, 1360], fill=(30, 26, 22, 150))
    img = Image.alpha_composite(img, vg.filter(ImageFilter.GaussianBlur(60)))
    dr = ImageDraw.Draw(img, "RGBA")
    cx = W // 2 + int(lerp(-46, 46, ss(p)))       # slow lateral drift across the shot
    cy = 900 + int(lerp(34, -26, push))           # gentle vertical settle
    cs = 30 * lerp(1.0, 1.16, push)               # continuous scale-up (push-in)
    caribou_topdown(dr, cx, cy, cs, 0.35, col=CARIBOU, alpha=255)
    # a mint scanning shimmer sweeping down over the animal — repeats through the whole shot (never idle)
    scan_y = int(lerp(560, 1300, (lt * 0.62) % 1.0))
    dr.line([(cx - 320, scan_y), (cx + 320, scan_y)], fill=(*MINT, 90), width=3)
    dr.line([(cx - 320, scan_y + 7), (cx + 320, scan_y + 7)], fill=(*MINT_LO, 55), width=1)
    # phase A: model interface boots (brackets snap in) on seg4 start; phase B: box; phase C: collapse to dot
    boot = oc(seg(lt, 0.2, 1.4))
    if boot > 0.02:
        L = int(340 * boot)
        for (bx, by, dx, dy) in [(cx-200, cy-150, 1, 1), (cx+200, cy-150, -1, 1), (cx-200, cy+150, 1, -1), (cx+200, cy+150, -1, -1)]:
            dr.line([(bx, by), (bx + dx * 60, by)], fill=(*MINT, int(220 * boot)), width=3)
            dr.line([(bx, by), (bx, by + dy * 60)], fill=(*MINT, int(220 * boot)), width=3)
    # box draw then collapse — STRETCHED across most of the shot so the beat keeps evolving (no dead middle)
    boxp = oc(seg(lt, 1.6, 3.6))
    collapse = eio(seg(lt, 4.0, 6.8))
    bw = int(lerp(210, 12, collapse)); bh = int(lerp(150, 12, collapse)); ba = int(255 * boxp * (1 - 0.5 * collapse))
    if boxp > 0.02:
        dr.rectangle([cx - bw, cy - bh, cx + bw, cy + bh], outline=(*MINT_HI, ba), width=3)
        # corner ticks
        for (sx, sy) in [(-1,-1),(1,-1),(-1,1),(1,1)]:
            dr.line([(cx + sx*bw, cy + sy*bh), (cx + sx*(bw-18), cy + sy*bh)], fill=(*MINT_HI, ba), width=3)
            dr.line([(cx + sx*bw, cy + sy*bh), (cx + sx*bw, cy + sy*(bh-18))], fill=(*MINT_HI, ba), width=3)
    if collapse > 0.5:
        rr = int(lerp(9, 13, collapse))
        for k, kr in enumerate((rr*3, rr*2, rr)):
            dr.ellipse([cx-kr, cy-kr, cx+kr, cy+kr], outline=(*MINT_HI, int(120*(collapse))), width=2)
        dr.ellipse([cx-rr, cy-rr, cx+rr, cy+rr], fill=(*MINT_HI, 255)); dr.ellipse([cx-rr, cy-rr, cx+rr, cy+rr], outline=(*INK, 255), width=2)
    return np.asarray(img.convert("RGB"), np.float32)

def scene4(f, lt):
    # DATA PANEL top-down: the single dot rhymes into a FIELD of dots; a mint scan sweep crosses the
    # tundra grid, a marker lighting per animal, the tally locking to F1 0.965.
    t = f / FPS
    px = 0.28 + 0.16 * ss(lt / 12.0)
    base = ground_pan(px, 0.34, zoom=1.04, shade=0.80)
    img = Image.fromarray(base.astype(np.uint8)).convert("RGBA"); dr = ImageDraw.Draw(img, "RGBA")
    # faint modular grid
    for gx in range(120, W, 150): dr.line([(gx, 280), (gx, 1200)], fill=(*MINT_LO, 46), width=1)
    for gy in range(300, 1200, 150): dr.line([(120, gy), (W - 120, gy)], fill=(*MINT_LO, 46), width=1)
    herd = _herd_positions(200, 41, 120, W - 120, 300, 1160, clump=0.35)
    sweep = clamp01(lt / 7.5)                      # 0..1 sweep across
    sx = int(lerp(120, W - 120, sweep))
    for (x, y, a) in herd:
        caribou_topdown(dr, x, y, 3.0, a, alpha=210)
        if x <= sx:  # counted -> mint marker
            dr.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(*MINT_HI, 255))
    # scan line
    dr.line([(sx, 280), (sx, 1200)], fill=(*MINT_HI, 220), width=4)
    dr.rectangle([sx, 280, min(W-120, sx+40), 1200], fill=(*MINT, 26))
    return np.asarray(img.convert("RGB"), np.float32)

def scene5(f, lt):
    # TWO-UP: clean sparse count (top) rhymes into a dense crush (bottom); the mint overlay flickers
    # and dissolves toward a '?'.
    img = Image.new("RGB", (W, H), DUSK); dr = ImageDraw.Draw(img, "RGBA")
    # top half: clean, sparse, confidently counted
    topb = ground_pan(0.3, 0.16, zoom=1.5, shade=0.86)
    img.paste(Image.fromarray(topb.astype(np.uint8)).resize((W, 620)), (0, 280)); dr = ImageDraw.Draw(img, "RGBA")
    for (x, y, a) in _herd_positions(26, 5, 120, W - 120, 320, 840, clump=0.05):
        caribou_topdown(dr, x, y, 4.5, a); dr.ellipse([x-5, y-5, x+5, y+5], fill=(*MINT_HI, 255))
    # divider
    dr.line([(80, 930), (W - 80, 930)], fill=(*SNOW, 120), width=2)
    # bottom half: the crush
    botb = ground_pan(0.5, 0.5, zoom=1.4, shade=0.7)
    img.paste(Image.fromarray(botb.astype(np.uint8)).resize((W, 320)), (0, 950)); dr = ImageDraw.Draw(img, "RGBA")
    for (x, y, a) in _herd_positions(260, 9, 120, W - 120, 980, 1250, clump=0.75):
        caribou_topdown(dr, x, y, 4.2, a, alpha=245, shadow=False)
    # overlay flicker + dissolve to '?'
    flick = seg(f / FPS, SEG[7] + 1.0, SEG[7] + 2.2)
    rng = np.random.default_rng(f)
    for (x, y, a) in _herd_positions(40, 11, 140, W - 140, 990, 1240, clump=0.7):
        if rng.random() > flick * 0.8:
            dr.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(*MINT_HI, int(220 * (1 - flick))))
    if flick > 0.3:
        qf = fr(150, 900); qs = "?"; qw = tw(qs, qf)
        tk(dr, qs, qf, (*MINT_HI, int(230 * flick)), (W - qw) // 2, 1030, 0)
    return np.asarray(img.convert("RGB"), np.float32)

def scene6(f, lt):
    # THE SURVEY CAMERA's own viewfinder HUD: a reticle over the tundra; it fires one frame and only
    # in-reticle animals tag; a herd beyond the frame stays dark and uncounted.
    px = 0.44 + 0.10 * ss(lt / 4.8)
    base = ground_pan(px, 0.4, zoom=1.02, shade=0.62)   # darker: 'beyond the frame stays dark'
    img = Image.fromarray(base.astype(np.uint8)).convert("RGBA"); dr = ImageDraw.Draw(img, "RGBA")
    herd = _herd_positions(150, 61, 60, W - 60, 300, 1200, clump=0.35)
    # the reticle frame (the captured frame)
    fx0, fy0, fx1, fy1 = 210, 470, W - 210, 1090
    # brighten inside the frame
    inside = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ind = ImageDraw.Draw(inside)
    ind.rectangle([fx0, fy0, fx1, fy1], fill=(255, 240, 210, 30)); img = Image.alpha_composite(img, inside); dr = ImageDraw.Draw(img, "RGBA")
    fire = oc(seg(lt, 1.2, 1.8))                     # shutter fires
    for (x, y, a) in herd:
        inb = fx0 < x < fx1 and fy0 < y < fy1
        caribou_topdown(dr, x, y, 3.4, a, alpha=255 if inb else 150)
        if inb and fire > 0.5:
            dr.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(*MINT_HI, int(255 * fire)))
    # viewfinder chrome
    dr.rectangle([fx0, fy0, fx1, fy1], outline=(*MINT_HI, 235), width=3)
    for (cxx, cyy) in [(fx0, fy0), (fx1, fy0), (fx0, fy1), (fx1, fy1)]:
        dr.line([(cxx, cyy), (cxx + (28 if cxx == fx0 else -28), cyy)], fill=(*SNOW, 235), width=3)
        dr.line([(cxx, cyy), (cxx, cyy + (28 if cyy == fy0 else -28))], fill=(*SNOW, 235), width=3)
    # center crosshair
    cx, cy = (fx0 + fx1) // 2, (fy0 + fy1) // 2
    dr.line([(cx - 26, cy), (cx + 26, cy)], fill=(*MINT_HI, 200), width=2)
    dr.line([(cx, cy - 26), (cx, cy + 26)], fill=(*MINT_HI, 200), width=2)
    return np.asarray(img.convert("RGB"), np.float32)

def scene7(f, lt):
    # MAP settles, the final count carried home, then the branded outro.
    q = clamp01(lt / 14.0)                       # LINEAR (constant-velocity) parallax to the final frame
    px = 0.44 - 0.30 * q                          # horizontal traverse of SHARP tundra
    base = ground_pan(px, 0.30, zoom=lerp(1.03, 1.10, q), shade=0.86)   # light zoom (deep zoom blurs -> less delta)
    img = Image.fromarray(base.astype(np.uint8)).convert("RGBA")
    herd = _herd_positions(150, 41, 120, W - 120, 320, 1140, clump=0.3)
    # the count keeps coming home: a soft mint sweep crosses the map (repeating) and flares each marker it passes
    sweepx = int(150 + (W - 300) * ((lt * 0.34) % 1.0))
    band = Image.new("RGBA", (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(band)
    bd.rectangle([sweepx - 42, 300, sweepx + 42, 1120], fill=(*MINT, 48))
    img = Image.alpha_composite(img, band); dr = ImageDraw.Draw(img, "RGBA")
    dr.line([(sweepx, 300), (sweepx, 1120)], fill=(*MINT_HI, 150), width=2)
    for (x, y, a) in herd:
        caribou_topdown(dr, x, y, 3.0, a, alpha=200)
        near = max(0.0, 1.0 - abs(x - sweepx) / 90.0)   # markers flare as the sweep reaches them
        dr.ellipse([x-3, y-3, x+3, y+3], fill=(*MINT_HI, int(150 + 105 * near)))
    return np.asarray(img.convert("RGB"), np.float32)

SCENES = [scene1, scene2, scene3, scene4, scene5, scene6, scene7]
def render_scene(f):
    si = shot_of(f); a, b = SHOTS[si]; lt = (f - a) / FPS
    cur = SCENES[si](f, lt)
    # transition blend into this shot from the previous scene, for the first TW_LEN frames
    if si > 0 and (f - a) < TW_LEN:
        prev = SCENES[si - 1](f, (f - SHOTS[si - 1][0]) / FPS)
        tt = (f - a + 1) / TW_LEN
        kind = TRANS[si]
        if kind == "match-cut" or kind == "graphic-match":
            # quick hard-ish rhyme with a short dissolve on the shape
            cur = lerp(prev, cur, ss(tt))
        elif kind == "fui-boot":
            cur = lerp(prev, cur, oc(tt))
        elif kind == "carried-element":
            cur = lerp(prev, cur, ss(tt))
        else:  # crossfade
            cur = lerp(prev, cur, ss(tt))
    return np.clip(cur, 0, 255).astype(np.uint8)

# ---------------- captions (voice-synced, lower third) ----------------
def _wrap(words, fnt, maxw, spw):
    lines = [[]]
    for wd in words:
        cur = lines[-1]; width = sum(tw(x[0], fnt) for x in cur) + spw * len(cur) + tw(wd[0], fnt)
        if cur and width > maxw: lines.append([wd])
        else: cur.append(wd)
    return lines
def caption(img, f):
    t = f / FPS; cue = None
    for c in CUES:
        if c["s"] - 0.24 <= t < c["e"] + 0.18: cue = c; break
    if not cue: return
    s, e = cue["s"], cue["e"]
    ap = oc(seg(t, s - 0.24, s + 0.08)) * (1.0 - seg(t, e - 0.10, e + 0.18))
    if ap <= 0.02: return
    prog = clamp01((t - s) / max(0.25, (e - s)))
    raw = cue["w"].split(); tot = max(1, sum(len(w) + 1 for w in raw)); acc = 0; words = []
    for w in raw:
        midp = (acc + (len(w) + 1) / 2.0) / tot; acc += len(w) + 1; words.append((w, midp))
    fnt = fr(58, 650); maxw = W - 2 * 104; spw = int(fnt.size * 0.30)
    lines = _wrap(words, fnt, maxw, spw)
    if len(lines) > 2: fnt = fr(48, 650); spw = int(fnt.size * 0.30); lines = _wrap(words, fnt, maxw, spw)
    nl = len(lines); lh = int(fnt.size * 1.18); blockh = lh * nl; y0 = 1508 - blockh // 2
    d = ImageDraw.Draw(img, "RGBA")
    for li, ln in enumerate(lines):
        lr = oc(clamp01((prog - li / max(1, nl)) / 0.18)); la = ap * lr
        if la <= 0.02: continue
        rise = int((1 - lr) * 12)
        lwf = sum(tw(w, fnt) for w, _ in ln) + spw * (len(ln) - 1); x = (W - lwf) // 2; y = y0 + li * lh + rise
        for (w, midp) in ln:
            col = SNOW if midp <= prog - 0.05 else (GOLD if midp <= prog + 0.05 else GREY)
            d.text((x, y), w, font=fnt, fill=(*col, int(255 * la)), stroke_width=3, stroke_fill=(3, 8, 14, int(232 * la)))
            logw(x, y, tw(w, fnt), fnt.size, col, la, (midp <= prog + 0.05) and (la >= 0.6), "caption")
            x += tw(w, fnt) + spw
    uw = W - 2 * 150; ux = 150; uy = y0 + blockh + 16
    d.line([(ux, uy), (ux + uw, uy)], fill=(70, 90, 116, int(120 * ap)), width=2)
    d.line([(ux, uy), (ux + int(uw * prog), uy)], fill=(*GOLD, int(230 * ap)), width=3)

# ---------------- HUD readout strip (crisp mono, lives in the CARD_BAND y[1175,1360]) + scene labels ----------------
def hud_and_labels(img, f):
    d = ImageDraw.Draw(img, "RGBA"); t = f / FPS; si = shot_of(f)
    # persistent telemetry strip (keeps HUD_TEXT crisp; brand throughline)
    sy = 1214
    d.line([(96, sy - 14), (W - 96, sy - 14)], fill=(*MINT_LO, 150), width=2)
    left = "OWL  ·  CENTRAL ARCTIC CENSUS"
    tk(d, left, mono(26, m=True), (*SNOW, 214), 96, sy, 0.05)
    logw(96, sy, tw(left, mono(26, m=True), 0.05), 26, SNOW, 1.0, True, "hud")
    right = "weak-supervision count"
    rw = tw(right, mono(24), 0.04); tk(d, right, mono(24), (*MINT_HI, 220), W - 96 - rw, sy + 2, 0.04)
    logw(W - 96 - rw, sy + 2, rw, 24, MINT_HI, 1.0, True, "hud")
    # per-shot big labels / numbers (post-grade -> crisp), placed in the card band
    def stamp(txt, x, y, fnt, col, a, key):
        tk(d, txt, fnt, (*col, int(255 * a)), x, y, 0.02)
        logw(x, y, tw(txt, fnt, 0.02), fnt.size, col, a, a >= 0.6, key)
    if si == 0:  # HOOK: a LIVE TALLY racing upward, too fast to read (the count motif, illustrative)
        cf = mono(70, b=True); label = mono(26, m=True)
        panw = 360; px0 = (W - panw) // 2; py0 = 330
        d.rounded_rectangle([px0, py0, px0 + panw, py0 + 150], 12, outline=(*MINT, 200), width=2)
        tk(d, "LIVE TALLY", label, (*MINT_HI, 220), px0 + 24, py0 + 18, 0.08)
        # a counter climbing fast as the herd multiplies, with the last two digits rolling so it
        # never settles on a specific figure (clearly a count in progress, not a claimed total)
        climb = ss(seg(t, 0.8, 7.4)); top = int(46000 * climb)
        churn = f"{top // 100:03d}" + f"{(f * 41) % 100:02d}"
        nw = tw(churn, cf); tk(d, churn, cf, (*SNOW, 240), px0 + (panw - nw) // 2, py0 + 54)
        logw(px0 + (panw - nw) // 2, py0 + 54, nw, cf.size, SNOW, 1.0, True, "hook")
        tag = "illustrative"; tgw = tw(tag, mono(18), 0.06)
        tk(d, tag, mono(18), (*GREY, 190), px0 + (panw - tgw) // 2, py0 + 122, 0.06)
    if si == 3:  # data panel: 7x/3x + F1 0.965
        a1 = oc(seg(t, SEG[5] + 0.2, SEG[5] + 1.0)) * (1 - seg(t, SEG[6] - 0.3, SEG[6] + 0.2))
        if a1 > 0.02:
            stamp("7x FASTER   ·   3x CHEAPER", 150, 1270, mono(40, b=True), MINT_HI, a1, "stat")
        a2 = oc(seg(t, SEG[6] + 0.6, SEG[6] + 1.4))
        if a2 > 0.02:
            stamp("F1  0.965", 150, 1264, fr(64, 800), SNOW, a2, "stat")
            stamp("2022 CENTRAL ARCTIC", 150 + tw("F1  0.965", fr(64, 800), 0.02) + 40, 1284, mono(28, m=True), (200, 212, 228), a2, "stat")
        # +3.1% belongs to the ACCURACY beat on the clean counted field (spoken "within about three percent"),
        # NOT the density-crush frame (it is the aggregate overcount, not the regime failure)
        a2b = oc(seg(t, SEG[6] + 2.4, SEG[6] + 3.2))
        if a2b > 0.02:
            stamp("+3.1%  OVERCOUNT", 150, 1330, mono(36, b=True), AMBER, a2b, "stat")
    if si == 4:  # the honest limit: the count SLIPS in the crush (uncertainty only, no aggregate stat here)
        a4 = oc(seg(t, SEG[7] + 0.6, SEG[7] + 1.4))
        if a4 > 0.02:
            stamp("COUNT SLIPS", 150, 1270, mono(40, b=True), AMBER, a4, "stat")
        a5 = oc(seg(t, SEG[7] + 1.4, SEG[7] + 2.2))
        if a5 > 0.02:
            stamp("REGIME-DEPENDENT", 150, 1322, mono(30, b=True), MINT_HI, a5, "stat")
    if si == 6:  # payoff — the tally motif RESOLVES (carry the count home)
        settle = ss(seg(t, SHOTS[6][0] / FPS + 0.3, SHOTS[6][0] / FPS + 2.0))
        cf = mono(70, b=True); label = mono(26, m=True)
        panw = 360; px0 = (W - panw) // 2; py0 = 330
        d.rounded_rectangle([px0, py0, px0 + panw, py0 + 150], 12, outline=(*MINT, 200), width=2)
        tk(d, "COUNT LOCKED", label, (*MINT_HI, 220), px0 + 24, py0 + 18, 0.08)
        # the churn RESOLVES to a non-numeric locked state (no fabricated herd total on screen)
        if settle < 0.85:
            num = "".join(str((f * (7 + i * 13) + i * 3) % 10) for i in range(5)); cff = cf
        else:
            num = "COUNTED"; cff = mono(58, b=True)
        nw = tw(num, cff); tk(d, num, cff, (*GOLD, 240), px0 + (panw - nw) // 2, py0 + (54 if settle < 0.85 else 60))
        logw(px0 + (panw - nw) // 2, py0 + 54, nw, cf.size, GOLD, 1.0, True, "hook")
        if settle < 0.85:  # while still a rolling number, flag it illustrative
            tag = "illustrative"; tgw = tw(tag, mono(18), 0.06)
            tk(d, tag, mono(18), (*GREY, 190), px0 + (panw - tgw) // 2, py0 + 122, 0.06)
        a5 = oc(seg(t, SEG[9] + 0.6, SEG[9] + 1.6))
        if a5 > 0.02:
            stamp("COUNT HOME SOONER", 150, 1276, fr(56, 800), GOLD, a5, "stat")

# ---------------- outro (staged reveals, motion to the last frame) ----------------
def outro(img, f):
    start = max(int(SPEECH_END * FPS) + 16, BOUNDS[6] + 60)
    if f < start: return
    d = ImageDraw.Draw(img, "RGBA")
    a1 = oc(seg(f, start, start + 46))
    if a1 > 0.02:
        wf = fr(94, 800); s = "ALASKA.AI"; w = tw(s, wf, 0.05)
        tk(d, s, wf, (255, 222, 120, int(255 * a1)), (W - w) // 2, 1420 - int((1 - a1) * 16), 0.05)
        logw((W - w) // 2, 1420, w, wf.size, (255, 222, 120), a1, a1 >= 0.6, "outro")
    a2 = oc(seg(f, start + 40, start + 82))
    if a2 > 0.02:
        tf = fr(38, 600); s = "what's moving in alaska ai, this week"; w = tw(s, tf, 0.02)
        tk(d, s, tf, (228, 240, 250, int(228 * a2)), (W - w) // 2, 1536 - int((1 - a2) * 14), 0.02)
        logw((W - w) // 2, 1536, w, tf.size, (228, 240, 250), a2, a2 >= 0.6, "outro")
    a3 = oc(seg(f, start + 74, start + 108))
    if a3 > 0.02:
        cf = mono(24); s = "arXiv:2606.13911  ·  Microsoft AI for Good + ADF&G 2022 census"; w = tw(s, cf, 0.04)
        tk(d, s, cf, (150, 170, 190, int(210 * a3)), (W - w) // 2, 1610, 0.04)
    # a slowly-advancing underline with a drifting mint glow tip — keeps moving right up to the fade
    gp = seg(f, start + 40, NF - 6)
    if gp > 0.0:
        uw = 520; ux = (W - uw) // 2; uy = 1586; tip = ux + int(uw * ss(gp))
        d.line([(ux, uy), (ux + uw, uy)], fill=(70, 92, 118, 150), width=2)
        d.line([(ux, uy), (tip, uy)], fill=(*GOLD, 220), width=3)
        d.ellipse([tip - 5, uy - 5, tip + 5, uy + 5], fill=(*MINT_HI, 210))
    # final gentle fade
    fade = seg(f, NF - 34, NF - 2)
    if fade > 0:
        ov = Image.new("RGBA", (W, H), (6, 9, 14, int(235 * ss(fade)))); img.alpha_composite(ov)

# ---------------- dark plates (drawn BEFORE bg-luma capture, so text is measured on its real base) ----
# A soft bottom SCRIM (dark vertical gradient) puts the persistent HUD strip (~y1214), the stat labels
# (~y1270-1330) and the lower-third captions (~y1450-1590) on a dark base even over the bright tundra
# shots — a graded gradient, NOT a hard letterbox band. Plus the tally/count PANEL plate for shots 0/6.
SCRIM_COL = np.array([8, 10, 14], np.float32)
_scr = np.clip((_Y - 1120.0) / 150.0, 0.0, 1.0)
SCRIM_A = ((_scr * _scr * (3 - 2 * _scr)) * 0.66)[..., None]   # smoothstep feather from y1120 -> hold 0.66
def draw_plates(img, f):
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    arr = arr * (1 - SCRIM_A) + SCRIM_COL * SCRIM_A
    img.paste(Image.fromarray(arr.astype(np.uint8)))
    si = shot_of(f)
    if si == 0 or si == 6:  # the tally/count panel plate (border + text still drawn in hud_and_labels, on top)
        d = ImageDraw.Draw(img, "RGBA")
        panw = 360; px0 = (W - panw) // 2; py0 = 330
        d.rounded_rectangle([px0, py0, px0 + panw, py0 + 150], 12, fill=(10, 20, 20, 210))

# ---------------- compose one frame ----------------
def render_frame(f):
    base = render_scene(f)
    graded = finish(base, seed=1000 + f)
    img = Image.fromarray(graded).convert("RGBA")
    draw_plates(img, f)
    set_frame_bg(img, f)
    dr = ImageDraw.Draw(img, "RGBA")
    brand_eyebrow(dr, f)
    hud_and_labels(img, f)
    caption(img, f)
    outro(img, f)
    flush_textlog(f)
    return img.convert("RGB")

def write_shots():
    shots = []
    for i, (a, b) in enumerate(SHOTS):
        shots.append({"id": i + 1, "start": int(a), "end": int(b), "framing": FRAMING[i],
                      "transition_in": TRANS[i], "note": ""})
    json.dump({"shots": shots, "fps": FPS, "total": NF}, open(os.path.join(HERE, "shots.json"), "w"), indent=2)

def main():
    args = sys.argv[1:]
    if args and args[0] == "test":
        for fs in args[1:]:
            f = int(fs); render_frame(f).save(os.path.join(FR, f"frame_{f:05d}.png"))
            print("wrote test frame", f)
        write_shots(); return
    a = int(args[0]) if args else 0; b = int(args[1]) if len(args) > 1 else NF
    if a == 0: write_shots()
    for f in range(a, b):
        render_frame(f).save(os.path.join(FR, f"frame_{f:05d}.png"))
    print(f"rendered {a}..{b}")

if __name__ == "__main__":
    main()
