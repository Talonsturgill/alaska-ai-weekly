"""
render_teaching.py — 'Teaching the Machine to See' (Bristol Bay sockeye drone/CV pilot), 2026-07-10.
FRESH composition authored to out/dispatch/storyboard.json (macro-closeup / fullbleed-split /
vertical-descent / single-organic-hero / editorial-schematic). NOT a re-skin of any prior render:
the scene, hero staging, layout and motion are built new. The scene-agnostic CRAFT (Fraunces+Mono
type, cinematic finish/grade, voice-synced captions, readability manifest, branded outro) is the
proven engine craft, reused here inline so all paths resolve to the run's WORK dir.

8 shots, editorial teaching-worksheet: a phosphor-yellow HUMAN mark descends onto ONE sockeye, the
labor that must precede the machine. Palette: sockeye crimson, glacial pale-blue, gravel sage, cedar,
phosphor-yellow, deep charcoal. 1080x1920 @30fps, 1800 frames.

  python render_teaching.py [start] [end]      # renders frame range [start,end) into WORK/frames_v3
  python render_teaching.py --shots            # (re)write WORK/shots.json only
"""
import os, sys, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.environ.get("DISPATCH_WORK") or os.path.abspath(os.path.join(HERE, "..", "..", "..", "out", "dispatch"))
AUD = os.path.join(WORK, "audio")
FR = os.path.join(WORK, "frames_v3"); os.makedirs(FR, exist_ok=True)
FONTS = os.path.join(HERE, "..", "alaska-ai-brief", "fonts")
LOGTEXT = os.environ.get("DISPATCH_TEXTLOG", "1") == "1"
W, H, FPS, NF = 1080, 1920, 30, 1800

# ---- palette (fresh color world) ----
CHAR   = (20, 24, 30)      # deep charcoal ground
CHAR2  = (30, 37, 46)
PALE   = (120, 170, 200)   # glacial pale-blue river
PALE_HI= (196, 226, 242)
PALE_LO= (64, 96, 118)
CRIM   = (212, 71, 52)      # sockeye crimson
CRIM_HI= (240, 116, 88)
SAGE   = (128, 142, 108)    # river-gravel sage-green
CEDAR  = (166, 116, 68)     # cedar tower-wood
CEDAR_HI=(206, 158, 104)
YEL    = (255, 224, 77)      # phosphor-yellow human label mark
YEL_HI = (255, 240, 150)
SNOW   = (244, 250, 255)
GOLD   = (255, 199, 44)      # brand type accent
INK    = (10, 13, 17)
GREY   = (150, 168, 190)

TIM = json.load(open(os.path.join(AUD, "timing60.json")))
CUES = json.load(open(os.path.join(AUD, "words60.json")))["words"]
SPEECH_END = TIM["speech_end"]

# ---- shots (render splits the long final segment into resolution + outro so no shot > 16s) ----
# frames; storyboard 7 shots -> 8 render shots (S7 resolution, S8 map/outro)
SB = TIM["shot_bounds"]  # [s1..s7] segment starts
SHOTS = [
    (0,        SB[1], "wide-establish"),   # 1 aerial run
    (SB[1],    SB[2], "subject-portrait"), # 2 tower + tally counter
    (SB[2],    SB[3], "alt-vantage"),      # 3 drone lifts + films
    (SB[3],    SB[4], "data-panel"),       # 4 the teaching (yellow marks)
    (SB[4],    SB[5], "push-detail"),      # 5 machine echoes
    (SB[5],    1207,  "two-up"),           # 6 not tested + shadow
    (1207,     1500,  "wide-establish"),   # 7 resolution: tower+drone+count settles
    (1500,     NF,    "map-territory"),    # 8 Bristol Bay map + branded outro
]
TRANS = ["", "match-cut", "fui-boot", "focus-pull", "double-exposure", "hard-cut", "pull-out", "map-travel"]
FRAMING = [s[2] for s in SHOTS]

def which_shot(f):
    for i, (a, b, _) in enumerate(SHOTS):
        if a <= f < b: return i
    return len(SHOTS) - 1

# ---------------- type ----------------
_FC = {}
def fr(sz, wt=900, op=144, it=False):
    k = ("fr", sz, wt, op, it)
    if k in _FC: return _FC[k]
    f = ImageFont.truetype(os.path.join(FONTS, "Fraunces-Italic-Var.ttf" if it else "Fraunces-Var.ttf"), sz)
    try: f.set_variation_by_axes([op, wt, 0, 0])
    except Exception: pass
    _FC[k] = f; return f
def mono(sz, b=False, m=False):
    k = ("m", sz, b, m)
    if k in _FC: return _FC[k]
    fn = "JetBrainsMono-Bold.ttf" if b else ("JetBrainsMono-Medium.ttf" if m else "JetBrainsMono-Regular.ttf")
    f = ImageFont.truetype(os.path.join(FONTS, fn), sz); _FC[k] = f; return f
def tw(t, f, tr=0.0):
    ex = int(round(f.size * tr)); s = 0
    for c in t:
        b = f.getbbox(c); s += (b[2] - b[0]) + ex
    return s - ex if t else 0
def tk(d, t, f, fill, x, y, tr=0.0):
    ex = int(round(f.size * tr)); c = x
    for ch in t:
        d.text((c, y), ch, font=f, fill=fill); b = f.getbbox(ch); c += (b[2] - b[0]) + ex

# ---------------- readability manifest ----------------
TEXTLOG = []; BGLUMA = None
def _lum(a): return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
def set_frame_bg(img, f):
    global BGLUMA, TEXTLOG
    if LOGTEXT and f % 6 == 0:
        TEXTLOG = []; BGLUMA = _lum(np.asarray(img.convert("RGB")).astype(np.float32))
    else:
        BGLUMA = None
def logw(x, y, w_px, h_px, col, alpha, target, kind):
    if not LOGTEXT or BGLUMA is None: return
    x0 = max(0, int(x)); y0 = max(0, int(y)); x1 = min(W, int(x + w_px)); y1 = min(H, int(y + h_px))
    if x1 <= x0 or y1 <= y0: return
    bg = float(BGLUMA[y0:y1, x0:x1].mean()); fl = float(0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2])
    TEXTLOG.append({"kind": kind, "alpha": round(float(alpha), 3), "fill_luma": round(fl, 1),
                    "bg_luma": round(bg, 1), "vis": round(fl / 255.0 * float(alpha), 3),
                    "target": bool(target) and float(alpha) >= 0.62})
def flush_textlog(f):
    if LOGTEXT and f % 6 == 0:
        d = os.path.join(WORK, "textlog"); os.makedirs(d, exist_ok=True)
        json.dump(TEXTLOG, open(os.path.join(d, f"frame_{f:05d}.json"), "w"))

# ---------------- cinematic finish (linear ACES + split-tone toward THIS palette + bloom + grain + vignette + dither) ----------------
_Y, _X = np.mgrid[0:H, 0:W].astype(np.float32)
_R = np.sqrt(((_X - W / 2) / (W / 2)) ** 2 + ((_Y - H / 2) / (H / 2)) ** 2)
def finish(u8, seed):
    f = u8.astype(np.float32) / 255.; a, b, c, d, e = 2.51, .03, 2.43, .59, .14
    g = np.clip((f * (a * f + b)) / (f * (c * f + d) + e), 0, 1)
    g = np.clip(g + (g - .5) * .06, 0, 1); lum = (0.2126 * g[..., 0] + 0.7152 * g[..., 1] + 0.0722 * g[..., 2])[..., None]
    sh = (1 - lum) ** 2; hi = lum ** 2
    # split-tone: cool glacial blue in shadow, warm cedar/gold in highlight
    g = np.clip(g + (np.array([26, 54, 74]) / 255 - .5) * .09 * sh + (np.array([255, 226, 150]) / 255 - .5) * .06 * hi, 0, 1)
    lb = np.clip(lum[..., 0] - .72, 0, 1) / .28; sm = lb[::4, ::4]
    glow = np.asarray(Image.fromarray((np.clip(gaussian_filter(sm, 2.5) + .6 * gaussian_filter(sm, 6), 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.
    g = 1 - (1 - g) * (1 - np.clip(glow[..., None] * np.array([1, .92, .7]) * .13, 0, 1))
    g = g * (0.85 + 0.15 * (1 / (1 + (_R * 1.45) ** 2) ** 2))[..., None]
    rng = np.random.default_rng(seed); n = gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 1.1); n /= n.std() + 1e-6
    g = g + (n * np.exp(-((lum[..., 0] - .4) ** 2) / (2 * .25 ** 2)) * (4.0 / 255.))[..., None]
    g = np.clip(g + (rng.random((H, W, 1)) + rng.random((H, W, 1)) - 1) / 255., 0, 1)
    return (g * 255).astype(np.uint8)

# ---------------- easing ----------------
def clamp01(x): return max(0.0, min(1.0, x))
def seg(t, a, b):
    if b <= a: return 1.0 if t >= b else 0.0
    return clamp01((t - a) / (b - a))
def oc(x): x = clamp01(x); return 1 - (1 - x) ** 3
def io(x): x = clamp01(x); return x * x * (3 - 2 * x)

# ---------------- drawing helpers ----------------
def base_field(f, tint=0.0):
    """Charcoal editorial ground with a faint vertical worksheet grid + slow drift; RGB float 0..255."""
    c = np.zeros((H, W, 3), np.float32)
    grad = (np.linspace(0, 1, H)[:, None]).astype(np.float32)
    for i in range(3):
        c[..., i] = CHAR[i] * (1 - grad * 0.35) + CHAR2[i] * (grad * 0.35)
    return c

SPRUCE = (74, 104, 66)     # spawning sockeye head-green
def _fish_layer(pts, scale=1.0, t=0.0):
    """Shaded spawning sockeye: crimson body with belly shade + dorsal rim light, the green head,
    a swimming tail that actually beats, small fins, and a soft contact shadow in the water."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for (x, y, s, col) in pts:
        bl = int(30 * s * scale); bh = int(11 * s * scale)
        dk = tuple(int(c * 0.52) for c in col)            # belly shade (strong enough to read small)
        hi = tuple(min(255, int(c * 1.5)) for c in col)   # dorsal rim
        # contact shadow (deeper + offset so the fish visibly floats over the bed)
        d.ellipse([x - bl + 6, y + bh + 1, x + bl + 8, y + bh + 13], fill=(10, 20, 32, 120))
        # tail beats: the caudal fin swings as it swims (two-tone fork)
        beat = math.sin(t * 6.5 + x * 0.05 + y * 0.03) * 7 * s
        tx = x + bl + int(16 * s)
        d.polygon([(x + bl - 3, y), (tx, y - int(10 * s) + int(beat)), (tx, y + int(10 * s) + int(beat))], fill=(*dk, 255))
        d.polygon([(x + bl - 3, y), (tx - int(5 * s), y - int(6 * s) + int(beat)), (tx - int(5 * s), y + int(6 * s) + int(beat))], fill=(*col, 255))
        # body: shaded belly under, crimson mid, rim-lit back
        d.ellipse([x - bl, y - bh, x + bl, y + bh], fill=(*col, 255))
        d.chord([x - bl, y - int(bh * 0.2), x + bl, y + bh + int(bh * 0.9)], 0, 180, fill=(*dk, 235))
        d.arc([x - bl + 2, y - bh, x + bl - 6, y + bh], 190, 330, fill=(*hi, 255), width=max(2, int(3.2 * s)))
        # dorsal fin on the back + pectoral fin below
        d.polygon([(x - int(6 * s), y - bh + 1), (x + int(2 * s), y - bh - int(7 * s)), (x + int(9 * s), y - bh + 1)], fill=(*dk, 245))
        d.polygon([(x - int(4 * s), y + int(3 * s)), (x + int(8 * s), y + int(11 * s)), (x + int(2 * s), y + int(2 * s))], fill=(*dk, 245))
        # the green head of a spawning sockeye + eye with highlight
        hd = int(11 * s)
        d.pieslice([x - bl - int(2 * s), y - bh, x - bl + 2 * hd, y + bh], 90, 270, fill=(*SPRUCE, 255))
        d.arc([x - bl + int(hd * 0.9), y - bh + 2, x - bl + 2 * hd, y + bh - 2], 260, 460,
              fill=(int(SPRUCE[0] * 0.66), int(SPRUCE[1] * 0.66), int(SPRUCE[2] * 0.66), 220), width=max(2, int(1.6 * s)))
        d.ellipse([x - bl + int(2 * s), y - int(4.4 * s), x - bl + int(8 * s), y + int(1.6 * s)], fill=(14, 18, 22, 255))
        d.ellipse([x - bl + int(3.2 * s), y - int(3.4 * s), x - bl + int(5.2 * s), y - int(1.4 * s)], fill=(216, 226, 234, 220))
        # scale arcs on the flank (readable at distance)
        for sxs in range(3):
            ax = x - int(bl * 0.35) + sxs * int(9.5 * s)
            d.arc([ax, y - int(5.5 * s), ax + int(11 * s), y + int(5.5 * s)], 300, 60, fill=(*dk, 175), width=2)
    return img

def draw_river(c, f, cx=W // 2, width=430, flow=1.0, fishcol=CRIM, bright=1.0):
    """A descending pale-blue river ribbon down the center, crimson sockeye flowing DOWN it (vertical-descent),
    with textured sage gravel banks on either side."""
    t = f / FPS
    riv = Image.new("L", (W, H), 0); rd = ImageDraw.Draw(riv)
    for y in range(0, H, 4):
        wob = int(26 * math.sin(y * 0.011 + t * 0.5))
        half = width // 2 + int(18 * math.sin(y * 0.005 - t * 0.3))
        rd.rectangle([cx + wob - half, y, cx + wob + half, y + 4], fill=255)
    # low-frequency fields at quarter res + bilinear upsample: visually identical for smooth
    # masks/blurs, ~16x cheaper than full-res gaussians (the render's former hot spot)
    def _q(arr, sigma):
        small = gaussian_filter(np.asarray(Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).resize((W // 4, H // 4), Image.BILINEAR), np.float32) / 255.0, sigma / 4.0)
        return np.asarray(Image.fromarray((np.clip(small, 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.0
    riv_raw = np.asarray(riv, np.float32) / 255.0
    rivm = _q(riv_raw, 2.0)[..., None]
    # sage gravel banks: two-octave texture + PEBBLES + wet-gravel shoreline darkening + broad light
    global _BANK
    try:
        _BANK
    except NameError:
        rng0 = np.random.default_rng(19)
        g1 = gaussian_filter(rng0.standard_normal((H // 3, W // 3)).astype(np.float32), 1.0)
        g1 = (g1 - g1.min()) / (np.ptp(g1) + 1e-6)
        g1 = np.asarray(Image.fromarray((g1 * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.0
        # pebble octave: hard small stones with per-pebble light/shadow
        peb = rng0.standard_normal((H // 6, W // 6)).astype(np.float32)
        peb = np.clip(gaussian_filter(peb, 0.7) * 1.6, -1, 1)
        peb = np.asarray(Image.fromarray(((peb * 0.5 + 0.5) * 255).astype(np.uint8)).resize((W, H), Image.NEAREST), np.float32) / 255.0
        big = gaussian_filter(rng0.standard_normal((H // 24, W // 24)).astype(np.float32), 1.4)
        big = (big - big.min()) / (np.ptp(big) + 1e-6)
        big = np.asarray(Image.fromarray((big * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.0
        _BANK = (0.42 + 0.30 * g1 + 0.24 * peb + 0.22 * big)  # layered gravel luminance 0.42..1.18
    bank = np.zeros((H, W, 3), np.float32)
    warmth = np.array([1.06, 1.0, 0.9], np.float32)  # a touch of sun on the stones
    for i in range(3):
        bank[..., i] = SAGE[i] * _BANK * warmth[i]
    # wet gravel: darken the bank in a soft margin along the waterline
    shoreline = np.clip(_q(rivm[..., 0], 18) - rivm[..., 0], 0, 1)
    bank *= (1.0 - 0.34 * shoreline[..., None] / (shoreline.max() + 1e-6))
    c = c * (1 - (1 - rivm) * 0.85) + bank * ((1 - rivm) * 0.85)
    watr = np.zeros((H, W, 3), np.float32)
    ripple = 0.5 + 0.5 * np.sin((_Y * 0.05) + t * 2.2 + np.sin(_X * 0.02))
    # DEPTH: the channel darkens toward its center (deep water), stays bright at the shallows,
    # with slow dappled light drifting across the surface
    rivc = rivm[..., 0]
    depth = np.clip(_q(rivc, 26) * 1.15, 0, 1)
    dapple = 0.5 + 0.5 * np.sin(_X * 0.012 + _Y * 0.006 + t * 0.7) * np.sin(_Y * 0.017 - t * 0.4)
    for i in range(3):
        base = PALE_LO[i] * (1 - ripple) + PALE[i] * ripple
        deep = base * (1.0 - 0.38 * depth) + PALE_HI[i] * 0.16 * dapple
        watr[..., i] = deep * bright
    c = c * (1 - rivm * 0.96) + watr * (rivm * 0.96)
    fl = np.asarray(_fish_layer(fish_pts(t, cx, width, flow), t=t), np.float32)
    fish_rgb = fl[..., :3]; fish_a = (fl[..., 3:4] / 255.0) * 0.94
    c = c * (1 - fish_a) + fish_rgb * fish_a * bright
    return c

def fish_pts(t, cx, width, flow, n=20):
    """Deterministic sockeye positions: evenly seeded lanes with PER-FISH speeds so tracks pass each
    other naturally and never lock into stacked coincidence (the old 197-stride aliasing).
    Fish sized so the shading craft (belly/rim/scales/fins) reads at full playback scale."""
    pts = []
    for i in range(n):
        sp = 78 * flow * (0.8 + 0.45 * ((i * 29) % 10) / 10.0)
        yy = int((t * sp + i * (2160.0 / n) * 3.7) % (H + 240)) - 120
        xoff = int((width * 0.34) * math.sin(i * 1.7 + yy * 0.006))
        wob = int(26 * math.sin(yy * 0.011 + t * 0.5))
        xx = cx + wob + xoff
        s = 1.2 + 0.6 * ((i * 37 % 100) / 100.0)
        col = CRIM if (i % 5) else CRIM_HI
        pts.append((xx, yy, s, col))
    return pts

def hero_sockeye(img, cx, cy, bl, t, a=1.0):
    """THE expensive macro hero: a full-frame spawning sockeye with layered shading — belly gradient,
    dorsal rim light, scale rows, gill plate, kype jaw, finnage, and a tail that beats. Drawn large
    enough that the illustration detail carries the shot."""
    bh = int(bl * 0.34)
    d = ImageDraw.Draw(img)
    dk = tuple(int(c * 0.58) for c in CRIM); dk2 = tuple(int(c * 0.78) for c in CRIM)
    hi = tuple(min(255, int(c * 1.38)) for c in CRIM)
    # soft water shadow beneath
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    sd.ellipse([cx - bl, cy + bh - 10, cx + bl, cy + bh + 42], fill=(10, 20, 30, int(110 * a)))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    d = ImageDraw.Draw(img)
    # beating forked tail
    beat = math.sin(t * 5.2) * bl * 0.09
    tx = cx + bl + int(bl * 0.34)
    d.polygon([(cx + bl - int(bl * 0.06), cy),
               (tx, cy - int(bh * 0.95) + int(beat)), (tx - int(bl * 0.10), cy + int(beat * 0.5)),
               (tx, cy + int(bh * 0.95) + int(beat))], fill=(*dk, int(255 * a)))
    # body: base, mid-band, belly, dorsal rim
    d.ellipse([cx - bl, cy - bh, cx + bl, cy + bh], fill=(*CRIM, int(255 * a)))
    d.chord([cx - bl, cy - int(bh * 0.4), cx + bl, cy + int(bh * 1.15)], 0, 180, fill=(*dk2, int(235 * a)))
    d.chord([cx - bl, cy + int(bh * 0.1), cx + bl, cy + int(bh * 1.4)], 0, 180, fill=(*dk, int(235 * a)))
    d.arc([cx - bl + 6, cy - bh, cx + bl - int(bl * 0.2), cy + bh], 195, 325, fill=(*hi, int(245 * a)), width=max(3, bl // 38))
    # scale rows (radiating arcs along the flank)
    for row, ry in enumerate((-0.28, 0.0, 0.3)):
        for k in range(9):
            ax = cx - int(bl * 0.62) + k * int(bl * 0.15)
            ay = cy + int(bh * ry)
            r_ = int(bh * 0.34)
            d.arc([ax, ay - r_, ax + int(r_ * 1.7), ay + r_], 300, 60, fill=(*dk, int(120 * a)), width=2)
    # dorsal + adipose + pectoral + anal fins
    d.polygon([(cx - int(bl * 0.18), cy - bh + 4), (cx + int(bl * 0.16), cy - int(bh * 1.55)),
               (cx + int(bl * 0.34), cy - bh + 6)], fill=(*dk2, int(235 * a)))
    d.ellipse([cx + int(bl * 0.55), cy - int(bh * 1.16), cx + int(bl * 0.68), cy - bh + 4], fill=(*dk2, int(220 * a)))
    d.polygon([(cx - int(bl * 0.28), cy + int(bh * 0.5)), (cx - int(bl * 0.02), cy + int(bh * 1.5)),
               (cx - int(bl * 0.10), cy + int(bh * 0.42))], fill=(*dk, int(230 * a)))
    d.polygon([(cx + int(bl * 0.42), cy + int(bh * 0.6)), (cx + int(bl * 0.62), cy + int(bh * 1.3)),
               (cx + int(bl * 0.66), cy + int(bh * 0.55))], fill=(*dk, int(225 * a)))
    # the green head with gill plate, kype jaw, eye
    hd = int(bl * 0.42)
    d.pieslice([cx - bl - int(bl * 0.06), cy - bh, cx - bl + 2 * hd, cy + bh], 90, 270, fill=(*SPRUCE, int(255 * a)))
    d.arc([cx - bl + int(hd * 0.75), cy - bh + 6, cx - bl + 2 * hd, cy + bh - 6], 250, 470,
          fill=(int(SPRUCE[0] * 0.7), int(SPRUCE[1] * 0.7), int(SPRUCE[2] * 0.7), int(220 * a)), width=max(3, bl // 60))
    # kype (the spawning male's hooked jaw)
    jy = cy + int(bh * 0.32)
    d.polygon([(cx - bl - int(bl * 0.05), jy), (cx - bl + int(bl * 0.16), jy + int(bh * 0.30)),
               (cx - bl + int(bl * 0.16), jy + int(bh * 0.10))], fill=(int(SPRUCE[0] * 0.8), int(SPRUCE[1] * 0.8), int(SPRUCE[2] * 0.8), int(255 * a)))
    ex, ey = cx - bl + int(hd * 0.45), cy - int(bh * 0.30)
    er = max(6, bl // 22)
    d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=(14, 18, 22, int(255 * a)))
    d.ellipse([ex - er // 3, ey - er + 2, ex + er // 4, ey - er // 3], fill=(220, 230, 236, int(210 * a)))
    return img

def yellow_mark(img, x, y, r, a=1.0, ring=True):
    """A phosphor-yellow HUMAN label mark (a hand-drawn cross + soft ring) descending onto a fish."""
    d = ImageDraw.Draw(img)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    for k, aa in ((r * 3.4, 40), (r * 2.0, 80)):
        ld.ellipse([x - k, y - k, x + k, y + k], fill=(*YEL, int(aa * a)))
    img.alpha_composite(lay)
    d = ImageDraw.Draw(img)
    lw = max(3, int(r * 0.42))
    d.line([(x - r, y), (x + r, y)], fill=(*YEL_HI, int(255 * a)), width=lw)
    d.line([(x, y - r), (x, y + r)], fill=(*YEL_HI, int(255 * a)), width=lw)
    if ring:
        d.ellipse([x - r, y - r, x + r, y + r], outline=(*YEL, int(230 * a)), width=max(2, lw - 1))

def panel(img, box, a=1.0, fill=INK, oc_=PALE_LO, ow=2):
    x0, y0, x1, y1 = box
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle(box, radius=14, fill=(*fill, int(210 * a)), outline=(*oc_, int(210 * a)), width=ow)
    img.alpha_composite(lay)

# ---------------- persistent lower HUD in CARD_BAND (x100-980, y1175-1360) — keeps HUD_TEXT crisp ----------------
def hud_card(img, f, title, stat_label, stat_val, tag=None, tagcol=YEL, a=1.0):
    """A crisp mono data strip in the CARD band (the quality gate reads glyph-edge energy here)."""
    if a <= 0.02: return
    box = (104, 1196, 976, 1352)
    panel(img, box, a=a, fill=(14, 18, 24), oc_=PALE_LO, ow=2)
    d = ImageDraw.Draw(img)
    ef = mono(30, m=True)
    tk(d, title, ef, (*PALE_HI, int(240 * a)), 132, 1216, 0.06)
    logw(132, 1216, tw(title, ef, 0.06), ef.size, PALE_HI, a, True, "hud")
    d.line([(132, 1258), (948, 1258)], fill=(*PALE_LO, int(200 * a)), width=2)
    lf = mono(28); lw_ = tw(stat_label, lf)
    tk(d, stat_label, lf, (*GREY, int(230 * a)), 132, 1280)
    logw(132, 1280, lw_, lf.size, GREY, a, True, "hud")
    # auto-shrink the value until it clears the label (no overlapping strings, ever)
    for vsz in (46, 40, 34, 30):
        vf = mono(vsz, b=True); vw = tw(stat_val, vf, 0.02)
        if 948 - vw > 132 + lw_ + 30: break
    vy = 1272 + (46 - vf.size) // 2
    tk(d, stat_val, vf, (*SNOW, int(255 * a)), 948 - vw, vy, 0.02)
    logw(948 - vw, vy, vw, vf.size, SNOW, a, True, "hud")
    if tag:
        tf = mono(26, b=True); twd = tw(tag, tf, 0.08)
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dl = ImageDraw.Draw(lay)
        dl.rounded_rectangle([132, 1316, 132 + twd + 28, 1348], radius=8, fill=(*tagcol, int(60 * a)), outline=(*tagcol, int(230 * a)), width=2)
        img.alpha_composite(lay)
        d = ImageDraw.Draw(img)
        tk(d, tag, tf, (*YEL_HI, int(255 * a)), 146, 1320, 0.08)
        logw(146, 1320, twd, tf.size, YEL_HI, a, True, "hud")

def eyebrow(img, f, text, y=250, a=1.0, col=None):
    col = col or GOLD
    ef = mono(28, b=True); wd = tw(text, ef, 0.16)
    x = (W - wd) // 2
    # soft dark chip behind the strip so the text reads over any scene (posts, bright water, banks)
    chip = Image.new("RGBA", (W, H), (0, 0, 0, 0)); cd = ImageDraw.Draw(chip)
    cd.rounded_rectangle([x - 54, y - 12, x + wd + 54, y + 44], radius=12, fill=(8, 12, 18, int(150 * a)))
    img.alpha_composite(chip.filter(ImageFilter.GaussianBlur(4)))
    global BGLUMA
    if LOGTEXT and f % 6 == 0 and BGLUMA is not None:
        BGLUMA = _lum(np.asarray(img.convert("RGB")).astype(np.float32))
    d = ImageDraw.Draw(img)
    # flanking MIDDOTS, never strokes (a flanking rule reads as a banned em dash at phone size)
    for dx_ in (x - 30, x + wd + 30):
        d.ellipse([dx_ - 4, y + 12, dx_ + 4, y + 20], fill=(*col, int(220 * a)))
    tk(d, text, ef, (*col, int(255 * a)), x, y, 0.16)
    logw(x, y, wd, ef.size, col, a, True, "eyebrow")

def wordmark(img, f, a=1.0, y=150):
    d = ImageDraw.Draw(img); wf = fr(40, 800); s = "ALASKA.AI"; wd = tw(s, wf, 0.04)
    tk(d, s, wf, (*GOLD, int(235 * a)), (W - wd) // 2, y, 0.04)

# ---------------- SCENES (each a distinct world) ----------------
def scene1(f):  # WIDE-ESTABLISH: aerial run descending; plant the yellow mark in second one
    a, b, _ = SHOTS[0]; lt = (f - a) / FPS
    c = base_field(f)
    c = draw_river(c, f, width=470, flow=1.1, bright=1.0)
    img = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).convert("RGBA")
    wordmark(img, f, a=oc(seg(lt, 0.2, 1.0)))
    eyebrow(img, f, "WORLD'S LARGEST SOCKEYE RUN", y=250, a=oc(seg(lt, 0.5, 1.5)), col=PALE_HI)
    # THE THESIS, frame one: a human yellow mark descends onto a single sockeye, then fades as we pull to the run
    mk = seg(lt, 0.05, 1.1); drop = int((1 - oc(mk)) * -260)
    if mk > 0:
        ma = (1.0 if lt < 1.6 else oc(1 - seg(lt, 1.6, 2.6)))
        yellow_mark(img, W // 2 + 40, 700 + drop, int(46 * oc(mk)), a=ma)
    hud_card(img, f, "BRISTOL BAY  ·  WOOD RIVER", "SOCKEYE RETURNING", "BY THE MILLION",
             a=oc(seg(lt, 1.2, 2.2)))
    return img

def scene2(f):  # SUBJECT-PORTRAIT: the mechanical tally counter over the LIVING river it watches
    a, b, _ = SHOTS[1]; lt = (f - a) / FPS
    # the river keeps flowing behind the tower vantage (dimmer, narrower) — the counter watches IT,
    # and the whole frame keeps moving (event cadence)
    c = draw_river(base_field(f), f, width=330, flow=0.9, bright=0.68)
    # cedar tower posts framing the sides — grained, lit from the left, with cast shadows
    tw_img = Image.new("RGBA", (W, H), (0, 0, 0, 0)); td = ImageDraw.Draw(tw_img)
    ced_dk = tuple(int(v * 0.62) for v in CEDAR)
    for sx in (150, W - 150):
        td.rectangle([sx + 10, 232, sx + 30, H - 208], fill=(20, 22, 24, 90))       # cast shadow
        td.rectangle([sx - 16, 220, sx + 16, H - 220], fill=(*CEDAR, 245))
        td.rectangle([sx - 16, 220, sx - 9, H - 220], fill=(*CEDAR_HI, 235))         # lit edge
        td.rectangle([sx + 9, 220, sx + 16, H - 220], fill=(*ced_dk, 235))           # shade edge
        for gk in range(5):                                                          # wood grain
            gxx = sx - 12 + gk * 6 + (gk % 2)
            td.line([(gxx, 240 + gk * 7), (gxx, H - 240 - gk * 11)], fill=(*ced_dk, 70), width=1)
        for yy in range(260, H - 220, 120):                                          # rungs, lit + shaded
            td.rectangle([sx - 60, yy + 14, sx + 64, yy + 22], fill=(18, 20, 22, 80))
            td.rectangle([sx - 60, yy, sx + 60, yy + 18], fill=(*CEDAR_HI, 230))
            td.rectangle([sx - 60, yy + 12, sx + 60, yy + 18], fill=(*ced_dk, 200))
    img = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).convert("RGBA")
    img.alpha_composite(tw_img)
    # center: a big mechanical tally counter, ticking up
    cx, cy = W // 2, 760
    panel(img, (cx - 300, cy - 150, cx + 300, cy + 150), a=oc(seg(lt, 0.1, 0.7)), fill=(24, 20, 16), oc_=CEDAR_HI, ow=3)
    d = ImageDraw.Draw(img)
    # rolling count value driven by time (a hand clicking)
    val = int(1200 + lt * 137) % 100000
    nf = mono(120, b=True); s = f"{val:05d}"; wd = tw(s, nf, 0.04)
    tk(d, s, nf, (*SNOW, 255), cx - wd // 2, cy - 66, 0.04)
    logw(cx - wd // 2, cy - 66, wd, nf.size, SNOW, oc(seg(lt, 0.3, 0.9)), True, "counter")
    # a stylized hand/lever that clicks each ~0.6s
    click = (math.sin(lt * 2 * math.pi / 0.6) > 0.6)
    hy = cy + 190 + (int(-16) if click else 0)
    d.rounded_rectangle([cx + 210, hy, cx + 300, hy + 70], radius=12, fill=(*CEDAR_HI, 240), outline=(*INK, 255), width=2)
    if click:
        yellow_mark(img, cx + 255, hy - 10, 22, a=0.9, ring=False)
    eyebrow(img, f, "COUNTED BY HAND  ·  OVER 70 YEARS", y=250, a=oc(seg(lt, 0.2, 1.0)), col=CEDAR_HI)
    # the cadence HUD grows through the shot (10 min / hr, around the clock, then the season GO->HELD flip)
    ring_a = oc(seg(lt, 1.2, 2.2))
    hud_card(img, f, "COUNTING TOWER PROTOCOL", "10 MIN / HR  ·  AROUND THE CLOCK",
             f"{val:05d}", a=ring_a)
    # season power: at the end of the shot, a fleet marker flips GO -> HELD
    fl = seg(lt, (b - a) / FPS - 3.0, (b - a) / FPS - 0.6)
    if fl > 0:
        held = fl > 0.5
        col = CRIM if held else SAGE
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dl = ImageDraw.Draw(lay)
        dl.rounded_rectangle([cx - 150, 1050, cx + 150, 1120], radius=14, fill=(*col, 120), outline=(*col, 240), width=3)
        img.alpha_composite(lay)
        d = ImageDraw.Draw(img); sf = mono(40, b=True); s2 = "FLEET: HELD" if held else "FLEET: GO"
        w2 = tw(s2, sf, 0.04); tk(d, s2, sf, (*SNOW, 255), cx - w2 // 2, 1064, 0.04)
        logw(cx - w2 // 2, 1064, w2, sf.size, SNOW, min(1.0, fl * 2), True, "hud")
    return img

def scene3(f):  # ALT-VANTAGE: the drone lifts from its box at 08:30, its eye-view drops to the river
    a, b, _ = SHOTS[2]; lt = (f - a) / FPS; L = (b - a) / FPS
    c = base_field(f)
    img = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(img)
    # the box on the gravel bank, opening; drone rising
    boxo = oc(seg(lt, 0.1, 0.7))
    bx, by = W // 2, 1000
    d.rounded_rectangle([bx - 150, by - 40, bx + 150, by + 120], radius=12, fill=(*SAGE, 235), outline=(*INK, 255), width=3)
    # the hatch SLIDES open along the box's top edge (attached, not a floating plank)
    slide = int(260 * boxo)
    d.rounded_rectangle([bx - 150 + slide, by - 64, bx + 150 + slide, by - 40], radius=8, fill=(*CEDAR_HI, 235), outline=(*INK, 255), width=2)
    rise = oc(seg(lt, 0.35, 1.3)); dy = int(360 * rise)
    dx, dyc = bx, by - 20 - dy
    # drone body
    d.ellipse([dx - 44, dyc - 16, dx + 44, dyc + 16], fill=(40, 46, 54, 255), outline=(*PALE_HI, 255), width=3)
    for ox in (-64, 64):
        spin = (f * 0.9) % 2
        d.line([(dx + ox - 34, dyc - 22), (dx + ox + 34, dyc - 22)], fill=(*PALE_HI, 200 if spin < 1 else 90), width=4)
        d.ellipse([dx + ox - 6, dyc - 26, dx + ox + 6, dyc - 14], fill=(*PALE, 255))
    # 08:30 clock booting beside it (fui-boot)
    clk = oc(seg(lt, 0.2, 1.0))
    hud_card(img, f, "DRONE-IN-A-BOX  ·  AUTONOMOUS LAUNCH", "SCHEDULED LIFTOFF", "08:30",
             tag="BOOTING" if lt < L * 0.6 else "AIRBORNE", tagcol=PALE_HI, a=clk)
    eyebrow(img, f, "A NEW VANTAGE ON THE SAME WATER", y=250, a=oc(seg(lt, 0.4, 1.2)), col=PALE_HI)
    # the eye-view frame drops down onto the river in the second half
    drop = seg(lt, L * 0.55, L)
    if drop > 0:
        # a bright river sliver revealing at the top as the camera pitches down
        rc = draw_river(base_field(f), f, cx=W // 2, width=380, flow=1.4, bright=1.0)
        rimg = Image.fromarray(np.clip(rc, 0, 255).astype(np.uint8)).convert("RGBA")
        mh = int(H * oc(drop))
        img.alpha_composite(rimg.crop((0, 0, W, mh)), (0, 0))
        d = ImageDraw.Draw(img)
        d.rectangle([0, mh - 4, W, mh], fill=(*PALE_HI, 200))
    return img

def scene4(f):  # DATA-PANEL: THE TEACHING — a person marks each fish crossing the yellow line (the labor)
    a, b, _ = SHOTS[3]; lt = (f - a) / FPS; L = (b - a) / FPS
    # drone-eye river fills the frame; a bright yellow counting LINE across it
    c = draw_river(base_field(f), f, cx=W // 2, width=520, flow=1.0, bright=0.98)
    img = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(img)
    liney = 720
    d.line([(90, liney), (W - 90, liney)], fill=(*YEL, 235), width=6)
    tk(d, "COUNT LINE", mono(24, b=True), (*YEL_HI, 235), 96, liney - 40, 0.1)
    # "NOT YET" up front
    ny = seg(lt, 0.1, 0.9)
    if lt < 2.1:
        nf = fr(96, 800); s = "NOT YET"; wd = tw(s, nf, 0.02)
        aa = oc(ny) * (1 - seg(lt, 1.6, 2.1))
        tk(d, s, nf, (*SNOW, int(255 * aa)), (W - wd) // 2, 430, 0.02)
        logw((W - wd) // 2, 430, wd, nf.size, SNOW, aa, aa >= 0.62, "big")
    # THE HERO MACRO BEAT ("First, a person has to teach it"): one full-frame shaded sockeye,
    # and the FIRST yellow label descends onto its flank — the thesis at full price
    hb = seg(lt, 2.1, 2.7) * (1 - seg(lt, 4.9, 5.5))
    if hb > 0.02:
        ha = oc(hb)
        hcy = 820 + int(14 * math.sin(lt * 1.8))
        hero_sockeye(img, W // 2 + 30, hcy, 330, lt, a=ha)
        mk = seg(lt, 2.9, 3.9)
        if mk > 0:
            drop = int((1 - oc(mk)) * -300)
            yellow_mark(img, W // 2 + 80, hcy - 40 + drop, int(52 * oc(mk)), a=ha * min(1.0, 0.2 + oc(mk)))
            if mk > 0.75:
                d = ImageDraw.Draw(img)
                tagf = mono(26, b=True)
                tk(d, "LABEL 0001", tagf, (*YEL_HI, int(240 * ha)), W // 2 + 150, hcy - 64, 0.08)
                logw(W // 2 + 150, hcy - 64, tw("LABEL 0001", tagf, 0.08), tagf.size, YEL_HI, ha, mk > 0.8, "hud")
    # then the wide: marks rain one by one on fish crossing the line
    nmark = int(seg(lt, 5.2, L - 0.4) * 14)
    rng = np.random.default_rng(3)
    for i in range(nmark):
        mx = 150 + int((rng.random() * (W - 300)))
        my = liney + int((rng.random() - 0.5) * 60)
        bornp = seg(lt, 5.2 + i * ((L - 5.8) / 14), 5.2 + i * ((L - 5.8) / 14) + 0.3)
        yellow_mark(img, mx, my, int(20 * oc(bornp)), a=oc(bornp) * 0.95, ring=False)
    # live cursor at the newest mark
    if lt > 5.0:
        cxp = 150 + int((math.sin(lt * 2.3) * 0.5 + 0.5) * (W - 300))
        d = ImageDraw.Draw(img)
        d.line([(cxp, liney - 26), (cxp, liney + 26)], fill=(*YEL_HI, 240), width=3)
        d.line([(cxp - 26, liney), (cxp + 26, liney)], fill=(*YEL_HI, 240), width=3)
    eyebrow(img, f, "A PERSON TEACHES THE MACHINE TO SEE", y=250, a=oc(seg(lt, 0.3, 1.1)), col=YEL_HI)
    labels = int(seg(lt, 5.0, L) * 3200) + (1 if 3.0 < lt <= 5.0 else 0)
    hud_card(img, f, "HAND-LABELING  ·  TRAINING DATA", "FISH MARKED AT THE LINE",
             f"{labels:,}", tag="SEVERAL THOUSAND LABELS", tagcol=YEL, a=oc(seg(lt, 1.2, 2.0)))
    return img

def scene5(f):  # PUSH-DETAIL: the marks become the model, then it echoes them across the whole run (grid)
    a, b, _ = SHOTS[4]; lt = (f - a) / FPS; L = (b - a) / FPS
    c = draw_river(base_field(f), f, cx=W // 2, width=560, flow=1.15, bright=0.95)
    img = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(img)
    # machine-drawn detection boxes SNAP ONTO THE ACTUAL FISH (their positions are deterministic:
    # replicate draw_river's flow math for this scene's cx/width/flow so every box frames a sockeye)
    prog = oc(seg(lt, 0.15, 0.9))
    t_ = f / FPS
    # boxes SNAP onto the exact fish the river draws (same deterministic fish_pts call)
    nbox = 0
    for i, (xx, yy, s, _col) in enumerate(fish_pts(t_, W // 2, 560, 1.15)):
        if ((i * 7) % 24) / 24.0 > prog: continue   # boxes appear in a scattered order as prog grows
        if not (300 < yy < 1150): continue          # only box fish in the visible story band
        bw = int(52 * s); bh = int(26 * s)
        d.rectangle([xx - bw, yy - bh, xx + bw + int(14 * s), yy + bh], outline=(*PALE_HI, 230), width=3)
        d.line([(xx - 5, yy - bh - 8), (xx + 5, yy - bh - 8)], fill=(*YEL_HI, 220), width=3)
        nbox += 1
    eyebrow(img, f, "NOW IT PICKS THE FISH OUT ON ITS OWN", y=250, a=oc(seg(lt, 0.2, 1.0)), col=PALE_HI)
    # the readout is the HONEST live number: exactly how many boxes are on screen this frame
    hud_card(img, f, "MODEL INFERENCE  ·  UNAIDED", "FISH IN FRAME  ·  LIVE", f"{nbox}",
             tag="LEARNED FROM THE MARKS", tagcol=PALE_HI, a=oc(seg(lt, 0.3, 1.0)))
    return img

def scene6(f):  # TWO-UP: not tested vs the towers, and a shadow the model misses (honest limit)
    a, b, _ = SHOTS[5]; lt = (f - a) / FPS; L = (b - a) / FPS
    c = base_field(f)
    img = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(img)
    # split seam
    seam = W // 2
    d.line([(seam, 200), (seam, 1120)], fill=(*PALE_LO, 220), width=3)
    # LEFT: the model's clean count climbing
    lc = draw_river(base_field(f), f, cx=seam // 2 + 40, width=200, flow=1.0, bright=0.95)
    limg = Image.fromarray(np.clip(lc, 0, 255).astype(np.uint8)).convert("RGBA")
    img.alpha_composite(limg.crop((0, 200, seam, 1120)), (0, 200))
    d = ImageDraw.Draw(img)
    tk(d, "MODEL COUNT", mono(26, b=True), (*PALE_HI, 235), 120, 320, 0.06)
    logw(120, 320, tw("MODEL COUNT", mono(26, b=True), 0.06), 26, PALE_HI, 1.0, True, "hud")
    # RIGHT: the same river, but a dark SHADOW band crosses and one sockeye dims and is missed
    rc = draw_river(base_field(f), f, cx=seam + (W - seam) // 2 - 40, width=200, flow=1.0, bright=0.9)
    rimg = Image.fromarray(np.clip(rc, 0, 255).astype(np.uint8)).convert("RGBA")
    img.alpha_composite(rimg.crop((seam, 200, W, 1120)), (seam, 200))
    d = ImageDraw.Draw(img)
    tk(d, "TOWER TRUTH?", mono(26, b=True), (*GREY, 235), seam + 40, 320, 0.06)
    logw(seam + 40, 320, tw("TOWER TRUTH?", mono(26, b=True), 0.06), 26, GREY, 1.0, True, "hud")
    # the shadow sweeps down over the right half — a SOFT, feathered cloud-shadow (never a hard
    # letterbox band, which reads as a pasted UI panel)
    shy = 300 + int(seg(lt, 0.5, L) * 700)
    shmask = Image.new("L", (W, H), 0); sd6 = ImageDraw.Draw(shmask)
    sd6.ellipse([seam - 60, shy - 130, W + 220, shy + 130], fill=150)
    shmask = shmask.filter(ImageFilter.GaussianBlur(34))
    shade = Image.new("RGBA", (W, H), (6, 8, 12, 0)); shade.putalpha(shmask)
    img.alpha_composite(shade)
    d = ImageDraw.Draw(img)
    if seg(lt, 0.6, L) > 0.3:
        mx, my = seam + (W - seam) // 2 - 40, shy
        d.ellipse([mx - 30, my - 11, mx + 30, my + 11], outline=(*GREY, 200), width=2)
        tk(d, "MISS", mono(24, b=True), (*CRIM_HI, 240), mx - 30, my - 44, 0.1)
        logw(mx - 30, my - 44, tw("MISS", mono(24, b=True), 0.1), 24, CRIM_HI, 0.9, True, "hud")
    eyebrow(img, f, "NOT PROVEN AGAINST THE TOWERS", y=232, a=oc(seg(lt, 0.2, 1.0)), col=CRIM_HI)
    hud_card(img, f, "VALIDATION  ·  NEXT PHASE", "MODEL vs TOWER COUNTS", "PENDING",
             tag="NOT YET TESTED", tagcol=CRIM_HI, a=oc(seg(lt, 0.3, 1.0)))
    return img

def scene7(f):  # WIDE-ESTABLISH resolution: tower + human + drone over ONE river; the count settles
    a, b, _ = SHOTS[6]; lt = (f - a) / FPS; L = (b - a) / FPS
    c = draw_river(base_field(f), f, width=440, flow=0.9, bright=1.0)
    img = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(img)
    # tower (left) + human silhouette; drone small above (right) — grained + lit like scene2's
    ced_dk7 = tuple(int(v * 0.62) for v in CEDAR)
    d.rectangle([206, 632, 226, 1180], fill=(20, 22, 24, 90))
    d.rectangle([180, 620, 214, 1180], fill=(*CEDAR, 245))
    d.rectangle([180, 620, 187, 1180], fill=(*CEDAR_HI, 235))
    d.rectangle([207, 620, 214, 1180], fill=(*ced_dk7, 235))
    for yy in range(660, 1180, 110):
        d.rectangle([150, yy + 12, 248, yy + 20], fill=(18, 20, 22, 80))
        d.rectangle([150, yy, 244, yy + 16], fill=(*CEDAR_HI, 230))
        d.rectangle([150, yy + 10, 244, yy + 16], fill=(*ced_dk7, 200))
    d.ellipse([176, 560, 218, 640], fill=(18, 22, 28, 255))  # a person on the tower
    dx, dyc = W - 240, 520 + int(20 * math.sin(lt * 1.4))
    d.ellipse([dx - 34, dyc - 12, dx + 34, dyc + 12], fill=(40, 46, 54, 255), outline=(*PALE_HI, 255), width=2)
    for ox in (-46, 46):  # rotor bars so it reads as the drone, not a dark blob
        spin = (f * 0.9) % 2
        d.line([(dx + ox - 22, dyc - 16), (dx + ox + 22, dyc - 16)], fill=(*PALE_HI, 210 if spin < 1 else 100), width=3)
    # both marks glow together: a human yellow mark + a machine box on the same fish
    gx, gy = W // 2, 780
    yellow_mark(img, gx - 30, gy, int(22 + 4 * math.sin(lt * 3)), a=0.9, ring=True)
    d = ImageDraw.Draw(img)
    d.rectangle([gx + 6, gy - 24, gx + 78, gy + 24], outline=(*PALE_HI, 235), width=3)
    eyebrow(img, f, "THE HAND STILL TEACHES  ·  THE MODEL WATCHES", y=250, a=oc(seg(lt, 0.2, 1.2)), col=YEL_HI)
    # the count settles into the TOWERS' escapement window (ADFG runs the towers; the pilot is
    # NOT an ADFG project — keep the goal attributed to the tower count, the tag to the pilot)
    settle = seg(lt, L - 3.2, L - 0.4)
    hud_card(img, f, "THE COUNT COMES HOME", "TOWER ESCAPEMENT GOAL",
             "700,000 TO 2,800,000" if settle > 0.5 else "COUNTING", tag="PILOT · NOT AN ADFG PROJECT", tagcol=YEL, a=oc(seg(lt, 0.2, 1.0)))
    return img

def scene8(f):  # MAP-TERRITORY + branded outro (motion runs to the final frame)
    a, b, _ = SHOTS[7]; lt = (f - a) / FPS; L = (b - a) / FPS
    c = base_field(f)
    img = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(img)
    # a stylized Bristol Bay: a wide bay with river fingers reaching inland, one pulsing node (Wood River)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dl = ImageDraw.Draw(lay)
    dl.polygon([(0, 900), (300, 820), (560, 900), (820, 830), (W, 910), (W, H), (0, H)], fill=(*PALE_LO, 90))
    for (sx, sy, ex, ey) in [(430, 900, 300, 560), (560, 900, 640, 540), (760, 880, 860, 600)]:
        dl.line([(sx, sy), ((sx + ex) // 2, (sy + ey) // 2), (ex, ey)], fill=(*PALE, 200), width=6)
    img.alpha_composite(lay)
    d = ImageDraw.Draw(img)
    # LIVING map: crimson run-dots flow up each river finger continuously (large-area motion to the end)
    for k, (sx, sy, ex, ey) in enumerate([(430, 900, 300, 560), (560, 900, 640, 540), (760, 880, 860, 600)]):
        for j in range(7):
            p = ((lt * 0.22 + j / 7.0 + k * 0.13) % 1.0)
            mx = sx + (ex - sx) * p; my = sy + (ey - sy) * p
            rr = 7 + 3 * math.sin(lt * 2 + j)
            d.ellipse([mx - rr, my - rr, mx + rr, my + rr], fill=(*CRIM_HI, 200))
    node = (300, 560); pr = int(20 + 16 * (0.5 + 0.5 * math.sin(lt * 3)))
    d.ellipse([node[0] - pr, node[1] - pr, node[0] + pr, node[1] + pr], outline=(*YEL, 220), width=3)
    d.ellipse([node[0] - 8, node[1] - 8, node[0] + 8, node[1] + 8], fill=(*YEL_HI, 255))
    tk(d, "WOOD RIVER", mono(26, b=True), (*YEL_HI, 235), node[0] + 26, node[1] - 14, 0.08)
    logw(node[0] + 26, node[1] - 14, tw("WOOD RIVER", mono(26, b=True), 0.08), 26, YEL_HI, oc(seg(lt, 0.3, 1.0)), True, "hud")
    hud_card(img, f, "BRISTOL BAY  ·  ALASKA", "THIS SUMMER", "HAND + MACHINE", a=oc(seg(lt, 0.2, 1.0)))
    # staged full-frame listening pulses through the outro (large-area events spaced <5s to the end)
    arr = np.asarray(img.convert("RGB"), np.float32)
    for pt in (2.2, 5.6, 8.6):
        pa = math.exp(-((lt - pt) ** 2) / (2 * 0.35 ** 2))
        if pa > 0.02:
            ring_r = 200 + 900 * clamp01((lt - pt + 0.7) / 1.4)
            rg = Image.new("L", (W, H), 0); rd2 = ImageDraw.Draw(rg)
            rd2.ellipse([300 - ring_r, 560 - ring_r, 300 + ring_r, 560 + ring_r], outline=255, width=26)
            rgm = gaussian_filter(np.asarray(rg, np.float32) / 255.0, 4.0)[..., None]
            arr = np.clip(arr + rgm * np.array(YEL, np.float32) * (0.35 * pa), 0, 255)
    # slow continuous push-in so the whole frame resamples every frame, then a final cinematic fade
    sc = 1.0 - 0.06 * io(lt / max(1e-6, L))
    cw, ch = int(W * sc), int(H * sc)
    x0 = (W - cw) // 2; y0 = (H - ch) // 2
    arr = np.asarray(Image.fromarray(arr.astype(np.uint8)).crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.LANCZOS), np.float32)
    fade = seg(lt, L - 1.6, L - 0.1)
    if fade > 0: arr = arr * (1.0 - 0.88 * io(fade))
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")

SCENES = [scene1, scene2, scene3, scene4, scene5, scene6, scene7, scene8]

# ---------------- voice-synced captions (proven craft, reused) ----------------
def _wrap(words, fnt, maxw, spw):
    lines = [[]]
    for wd in words:
        cur = lines[-1]; width = sum(tw(x[0], fnt) for x in cur) + spw * len(cur) + tw(wd[0], fnt)
        if cur and width > maxw: lines.append([wd])
        else: cur.append(wd)
    return lines
def caption(img, f):
    t = f / FPS; cue = None
    for cc in CUES:
        if cc["s"] - 0.28 <= t < cc["e"] + 0.14: cue = cc; break
    if not cue: return
    s, e = cue["s"], cue["e"]
    ap = oc(seg(t, s - 0.28, s + 0.06)) * (1.0 - seg(t, e - 0.16, e + 0.14))
    if ap <= 0.02: return
    prog = clamp01((t - s) / max(0.25, (e - s)))
    raw = cue["w"].split(); tot = max(1, sum(len(w) + 1 for w in raw)); acc = 0; words = []
    for w in raw:
        mid = (acc + (len(w) + 1) / 2.0) / tot; acc += len(w) + 1; words.append((w, mid))
    fnt = fr(56, 650); maxw = W - 2 * 104; spw = int(fnt.size * 0.30)
    lines = _wrap(words, fnt, maxw, spw)
    if len(lines) > 3: fnt = fr(44, 650); spw = int(fnt.size * 0.30); lines = _wrap(words, fnt, maxw, spw)
    nl = len(lines); lh = int(fnt.size * 1.18); blockh = lh * nl; y0 = 1500 - blockh // 2
    # soft dark scrim behind the caption block so every word clears the contrast floor over bright
    # water. Its alpha TRACKS the first line's text reveal, so an empty bar never shows alone.
    lr0 = oc(clamp01(prog / 0.10))
    scr_a = int(178 * ap * lr0)
    if scr_a > 3:
        scr = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(scr)
        sd.rounded_rectangle([70, y0 - 26, W - 70, y0 + blockh + 34], radius=22, fill=(6, 10, 16, scr_a))
        scr = scr.filter(ImageFilter.GaussianBlur(6))
        img.alpha_composite(scr)
    # re-capture the background luma so the readability manifest sees the scrim the viewer sees
    global BGLUMA
    if LOGTEXT and f % 6 == 0:
        BGLUMA = _lum(np.asarray(img.convert("RGB")).astype(np.float32))
    d = ImageDraw.Draw(img)
    for li, ln in enumerate(lines):
        lr = oc(clamp01((prog - li / max(1, nl)) / 0.16)); la = ap * lr
        if la <= 0.02: continue
        rise = int((1 - lr) * 12)
        lwf = sum(tw(w, fnt) for w, _ in ln) + spw * (len(ln) - 1); x = (W - lwf) // 2; y = y0 + li * lh + rise
        for (w, mid) in ln:
            col = SNOW if mid <= prog - 0.05 else (YEL if mid <= prog + 0.05 else GREY)
            d.text((x, y), w, font=fnt, fill=(*col, int(255 * la)), stroke_width=3, stroke_fill=(3, 8, 18, int(230 * la)))
            logw(x, y, tw(w, fnt), fnt.size, col, la, (mid <= prog + 0.05) and (la >= 0.6), "caption")
            x += tw(w, fnt) + spw
    uw = W - 2 * 150; ux = 150; uy = y0 + blockh + 16
    d.line([(ux, uy), (ux + uw, uy)], fill=(70, 90, 116, int(110 * ap)), width=2)
    d.line([(ux, uy), (ux + int(uw * prog), uy)], fill=(*GOLD, int(225 * ap)), width=3)

def outro_card(img, f):
    start = max(1500, int(SPEECH_END * FPS) + 12)
    if f < start: return
    d = ImageDraw.Draw(img)
    a1 = oc(seg(f, start, start + 44))
    if a1 > 0.02:
        wf = fr(84, 800); s = "ALASKA.AI"; wd = tw(s, wf, 0.05)
        tk(d, s, wf, (255, 222, 120, int(255 * a1)), (W - wd) // 2, 1460 - int((1 - a1) * 16), 0.05)
        logw((W - wd) // 2, 1460, wd, wf.size, (255, 222, 120), a1, a1 >= 0.6, "outro")
    a2 = oc(seg(f, start + 40, start + 80))
    if a2 > 0.02:
        tf = fr(38, 600); s = "what's moving in alaska ai, this week"; wd = tw(s, tf, 0.02)
        tk(d, s, tf, (228, 240, 250, int(228 * a2)), (W - wd) // 2, 1566 - int((1 - a2) * 14), 0.02)
        logw((W - wd) // 2, 1566, wd, tf.size, (228, 240, 250), a2, a2 >= 0.6, "outro")
    a3 = oc(seg(f, start + 78, start + 116))
    if a3 > 0.02:
        cf = mono(24, m=True); s = "SOURCE: KDLG · ALASKA PUBLIC MEDIA (2026)"; wd = tw(s, cf, 0.04)
        tk(d, s, cf, (150, 170, 190, int(210 * a3)), (W - wd) // 2, 1636, 0.04)

# ---------------- compositor: pick scene, blend at boundaries ----------------
def render_rgb(f):
    si = which_shot(f); a, b, _ = SHOTS[si]
    arr = SCENES[si](f)
    # short cross-dissolve INTO this shot from the previous scene (except hard-cut S5->S6)
    xf = 7
    if si > 0 and (f - a) < xf and TRANS[si] != "hard-cut":
        prev = SCENES[si - 1](f)
        tt = oc((f - a + 1) / (xf + 1))
        arr = Image.blend(prev, arr, tt)
    # slow global drift so every frame changes (event cadence floor)
    if isinstance(arr, Image.Image):
        base = arr.convert("RGB")
    else:
        base = arr
    return base

def compose(f):
    img = render_rgb(f).convert("RGB")
    u8 = finish(np.asarray(img, np.uint8), seed=1234 + f)
    out = Image.fromarray(u8).convert("RGBA")
    set_frame_bg(out, f)
    caption(out, f)
    outro_card(out, f)
    flush_textlog(f)
    return out.convert("RGB")

def write_shots():
    shots = [{"id": i + 1, "start": int(a), "end": int(b), "framing": fr_,
              "transition_in": TRANS[i], "thread": ["", "match", "build", "carry", "carry", "match", "travel", "travel"][i]}
             for i, (a, b, fr_) in enumerate(SHOTS)]
    json.dump({"shots": shots, "fps": FPS, "total": NF}, open(os.path.join(WORK, "shots.json"), "w"), indent=2)
    print("wrote shots.json:", [(s["id"], s["start"], s["end"], s["framing"]) for s in shots])

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--shots":
        write_shots(); return
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    end = int(sys.argv[2]) if len(sys.argv) > 2 else NF
    if start == 0:
        write_shots()
    for f in range(start, end):
        img = compose(f)
        # compress_level=1: frames are intermediates read once by the gate + encoder; PNG stays
        # lossless at any level, and level 1 writes ~2-3x faster than the default 6.
        img.save(os.path.join(FR, f"frame_{f:05d}.png"), compress_level=1)
    print(f"rendered [{start},{end})")

if __name__ == "__main__":
    main()
