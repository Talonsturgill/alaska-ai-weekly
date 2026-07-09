"""
Alaska.Ai Dispatch — "The Machine That Listens to a Volcano" (9:16, 1080x1920, 60s/1800f).
STORY: VOISS-Net (Alaska Volcano Observatory / UAF, Volcanica 2025), a deep-learning CNN that reads
seismic + infrasound spectrograms to detect and classify volcanic tremor, explosions, quakes and
noise (~87% test accuracy, trained on 270,000+ spectrograms across 7 volcanoes). Live hook: Great
Sitkin erupting now (WATCH/ORANGE). Honest limit: it can NAME the sound, but cannot foresee WHEN.

Composition fingerprint (authored FRESH to out/dispatch/storyboard.json): eye-level-immersive /
vertical-rise / landscape-as-subject / single-object-void / instrument-readout / basalt-ember-teal.
7 shots, motivated transitions. Quality layer (grade, textlog, voice-synced captions, outro) is
imported CRAFT from the engine idiom; the 7 volcanic WORLDS are built new here.

Runs from the WORK dir (out/dispatch): reads audio/timing60.json + audio/words60.json, writes
frames_v3/*.png, textlog/*.json (readability manifest), shots.json (scene-structure manifest).
  range: python render_voiss.py 0 1800
  test:  python render_voiss.py test 30 200 450 650 900 1150 1300 1500 1650 1799
"""
import sys, os, math, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, "frames_v3"); os.makedirs(FR, exist_ok=True)
TLOG_DIR = os.path.join(HERE, "textlog"); os.makedirs(TLOG_DIR, exist_ok=True)
FONTS = os.path.abspath(os.path.join(HERE, "..", "..", ".claude", "skills", "alaska-ai-brief", "fonts"))
W, H, FPS, NF = 1080, 1920, 30, 1800
LOGTEXT = os.environ.get("DISPATCH_TEXTLOG") == "1"

# ---------------- basalt / ember / teal palette ----------------
INK      = (9, 11, 18)                          # basalt-black night
BASALT   = (16, 19, 30);  BASALT_HI = (34, 40, 58)
ASH      = (78, 74, 82);  UMBER = (96, 72, 52);  UMBER_HI = (140, 108, 78)
EMBER    = (232, 96, 40);  MAGMA = (255, 150, 62);  EMBER_HI = (255, 196, 120);  EMBER_LO = (150, 52, 26)
SULPHUR  = (242, 192, 74);  SULPHUR_HI = (255, 224, 140)
TEAL     = (58, 208, 198);  TEAL_HI = (156, 255, 240);  TEAL_LO = (28, 116, 116)
SNOW     = (238, 244, 252);  GREY = (150, 164, 182);  GREY_LO = (96, 108, 126)
GOLD     = (255, 199, 44)

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
SEG = TIM["seg_starts"]; SPEECH_END = TIM.get("speech_end", 51.0)
BOUNDS = TIM["shot_bounds"]   # [15,308,562,730,1082,1256,1397]
SHOTS = [(0, BOUNDS[1]), (BOUNDS[1], BOUNDS[2]), (BOUNDS[2], BOUNDS[3]),
         (BOUNDS[3], BOUNDS[4]), (BOUNDS[4], BOUNDS[5]), (BOUNDS[5], BOUNDS[6]), (BOUNDS[6], NF)]
FRAMING = ["wide-establish", "alt-vantage", "macro-closeup", "data-panel", "two-up", "push-detail", "map-territory"]
TRANS = ["", "match-cut", "morph", "fui-boot", "hard-cut", "focus-pull", "pull-out"]
TW_LEN = 16  # transition blend length (frames)

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

# ---------------- cinematic finish (linear ACES + volcanic split-tone + bloom + grain + vignette) ----------------
_Y, _X = np.mgrid[0:H, 0:W].astype(np.float32)
_R = np.sqrt(((_X - W / 2) / (W / 2)) ** 2 + ((_Y - H / 2) / (H / 2)) ** 2)
def finish(u8, seed):
    f = u8.astype(np.float32) / 255.
    a, b, c, d, e = 2.51, .03, 2.43, .59, .14
    g = np.clip((f * (a * f + b)) / (f * (c * f + d) + e), 0, 1)
    g = np.clip(g + (g - .5) * .07, 0, 1)
    lum = (0.2126 * g[..., 0] + 0.7152 * g[..., 1] + 0.0722 * g[..., 2])[..., None]
    sh = (1 - lum) ** 2; hi = lum ** 2
    # split-tone: shadows toward cold basalt-blue, highlights toward warm ember
    g = np.clip(g + (np.array([26, 34, 56]) / 255 - .5) * .09 * sh
                + (np.array([255, 176, 96]) / 255 - .5) * .075 * hi, 0, 1)
    lb = np.clip(lum[..., 0] - .70, 0, 1) / .30; sm = lb[::4, ::4]
    glow = np.asarray(Image.fromarray((np.clip(gaussian_filter(sm, 2.5) + .6 * gaussian_filter(sm, 6), 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.
    g = 1 - (1 - g) * (1 - np.clip(glow[..., None] * np.array([1, .74, .48]) * .16, 0, 1))
    g = g * (0.80 + 0.20 * (1 / (1 + (_R * 1.44) ** 2) ** 2))[..., None]
    rng = np.random.default_rng(seed)
    n = gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 1.1); n /= n.std() + 1e-6
    g = g + (n * np.exp(-((lum[..., 0] - .4) ** 2) / (2 * .25 ** 2)) * (3.8 / 255.))[..., None]
    g = np.clip(g + (rng.random((H, W, 1)) + rng.random((H, W, 1)) - 1) / 255., 0, 1)
    return (g * 255).astype(np.uint8)

# ================= drawing primitives (numpy float canvas) =================
def canvas(bg=INK):
    c = np.empty((H, W, 3), np.float32); c[:] = np.array(bg, np.float32); return c
def add_glow(c, cx, cy, rad, col, inten, aspect=1.0):
    d2 = ((_X - cx) / rad) ** 2 + ((_Y - cy) / (rad * aspect)) ** 2
    g = np.exp(-d2) * inten
    c += g[..., None] * np.array(col, np.float32)
def vgrad(c, top, bot):
    t = (_Y / H)[..., None]
    c[:] = np.array(top, np.float32) * (1 - t) + np.array(bot, np.float32) * t

# ---- static starfield (shot 1 sky) ----
_rng0 = np.random.default_rng(919)
_STARS = [(int(_rng0.uniform(0, W)), int(_rng0.uniform(0, H * 0.55)), _rng0.uniform(0.2, 1.0)) for _ in range(90)]
# rocky cone texture (low-freq luma break-up so the volcano flank is not a flat fill)
_CONE_TEX = gaussian_filter(_rng0.standard_normal((H, W)).astype(np.float32), (7, 4))
_CONE_TEX = (_CONE_TEX - _CONE_TEX.mean()) / (_CONE_TEX.std() + 1e-6)
_CONE_TEX = _CONE_TEX + 0.5 * gaussian_filter(_rng0.standard_normal((H, W)).astype(np.float32), (2, 1.5))

# ---- volcano cone silhouette (shot 1) ----
def cone_poly(cx, base_y, halfw, height, jitter=None):
    # a rough stratovolcano ridge: left slope up to a notched crater, right slope down
    pts = []
    n = 56
    peak = 0.5                       # summit centered (keeps crater/plume/vein alignment at cx)
    for i in range(n + 1):
        tx = i / n
        x = cx - halfw + tx * 2 * halfw
        # a MODELED stratovolcano: concave flanks (steep near the summit, shallower at the base),
        # not a straight triangle. left flank steeper than right; a subsidiary shoulder ridge right.
        if tx <= peak:
            frl = tx / peak
            yy = base_y - height * (frl ** 1.42)
        else:
            frr = (1 - tx) / (1 - peak)
            yy = base_y - height * (frr ** 1.14)
            yy -= math.exp(-((tx - 0.73) ** 2) / (2 * 0.055 ** 2)) * height * 0.15   # right shoulder
        # a small crater notch at the summit
        if abs(tx - peak) < 0.05:
            yy += (0.05 - abs(tx - peak)) / 0.05 * 24
        # multi-octave ridgeline roughness so the silhouette reads as rock, not a clean edge
        j = (math.sin(i * 1.9) * 5 + math.sin(i * 4.3) * 3.2 + math.sin(i * 9.7) * 1.8
             + math.sin(i * 19.1) * 0.9) if jitter is None else jitter[i]
        pts.append((x, yy + j))
    return pts

# ---- spectrogram synthesis (shots 3-6): freq (Y, low->high upward) x time (X) ----
def make_spectrogram(width, height, seed=7, explosions=2):
    rng = np.random.default_rng(seed)
    xs = np.arange(width); ys = np.arange(height)
    S = rng.standard_normal((height, width)).astype(np.float32) * 0.14 + 0.10   # broadband floor
    # harmonic tremor bands (a fundamental + overtones), low in the frequency range
    for k, base in enumerate([0.16, 0.30, 0.44, 0.60]):
        cy = (1 - base) * height  # low freq near bottom => high y
        drift = 8 * np.sin(xs / (60 + 25 * k) + k)
        amp = (0.9 - 0.16 * k) * (0.6 + 0.4 * np.sin(xs / (90 + 30 * k)))
        band = np.exp(-((ys[:, None] - (cy + drift)[None, :]) ** 2) / (2 * (5.5 - 0.5 * k) ** 2))
        S += band * amp[None, :]
    # explosion bursts: bright broadband vertical columns
    for _ in range(explosions):
        ex = int(rng.uniform(width * 0.25, width * 0.9)); ew = int(rng.uniform(5, 12))
        col = np.exp(-((xs - ex) ** 2) / (2 * ew ** 2))
        S += (col[None, :] * (0.7 + 0.5 * rng.standard_normal((height, 1)))) * np.linspace(1.0, 0.5, height)[:, None]
    S = np.clip(S, 0, 1.6)
    return S  # intensity field

# color LUT: intensity -> basalt->magma->ember->sulphur->white
_LUT_STOPS = [(0.0, (12, 14, 24)), (0.22, (60, 26, 30)), (0.45, (150, 44, 26)),
              (0.68, EMBER), (0.86, SULPHUR), (1.0, (255, 240, 200))]
def colorize(S):
    S = np.clip(S / 1.35, 0, 1)
    out = np.zeros(S.shape + (3,), np.float32)
    for i in range(len(_LUT_STOPS) - 1):
        a0, c0 = _LUT_STOPS[i]; a1, c1 = _LUT_STOPS[i + 1]
        m = (S >= a0) & (S < a1); tt = (S[m] - a0) / (a1 - a0)
        for ch in range(3): out[..., ch][m] = c0[ch] + (c1[ch] - c0[ch]) * tt
    m = S >= _LUT_STOPS[-1][0]
    for ch in range(3): out[..., ch][m] = _LUT_STOPS[-1][1][ch]
    return out

_SPEC_BIG = make_spectrogram(2200, 520, seed=7, explosions=3)      # wide scrolling source
_SPEC_RGB = colorize(_SPEC_BIG)

# ---- rock strata texture (shot 2 cross-section) ----
def strata_band(y0, y1, base):
    rng = np.random.default_rng(int(base[0]) + y0)
    h = y1 - y0
    band = np.zeros((h, W, 3), np.float32); band[:] = np.array(base, np.float32)
    # horizontal grain + speckle
    grain = gaussian_filter(rng.standard_normal((h, W)), (0.6, 3.0)) * 10
    band += grain[..., None]
    return np.clip(band, 0, 255)

# ================= SCENE RENDERERS (7 distinct worlds) =================
def scene1(f):   # WIDE-ESTABLISH: Great Sitkin venting in a dark void; the chain lights along the horizon
    t = f / FPS; local = f - SHOTS[0][0]
    c = canvas(INK)
    vgrad(c, (10, 12, 22), (20, 17, 24))
    # faint stars
    for (sx, sy, sb) in _STARS:
        c[sy:sy + 2, sx:sx + 2] += 90 * sb
    # slow rise: everything drifts up a touch (vertical-rise), camera very slow push
    horizon = 1180
    # the Aleutian chain: side cones IGNITE one by one, each with a sharp bright flash (a discrete motion
    # event per ignition, staggered ~5.6/7.0/8.3/9.4s) so the hook keeps a clear above-floor beat every <2s.
    ign_times = [5.6, 7.0, 8.3, 9.4]
    for i, (cx, hw, hh) in enumerate([(150, 120, 90), (300, 90, 60), (860, 150, 110), (1000, 80, 55)]):
        ti = ign_times[i]
        on = ss(seg(t, ti, ti + 0.9))
        if on <= 0.01: continue
        pts = cone_poly(cx, horizon, hw, hh)
        poly = Image.new("L", (W, H), 0); ImageDraw.Draw(poly).polygon(pts, fill=255)
        mask = (np.asarray(poly, np.float32) / 255.0)[..., None]
        c[:] = c * (1 - mask * on) + np.array((14, 15, 22), np.float32) * mask * on
        add_glow(c, cx, horizon - hh + 8, 46, EMBER_LO, 0.5 * on)
        flash = math.exp(-max(0.0, t - ti) / 0.16) if t >= ti else 0.0   # sharp ignition flash = one delta spike
        add_glow(c, cx, horizon - hh + 8, 74, EMBER_HI, 1.25 * flash, aspect=0.8)
    # HERO: Great Sitkin, centered
    cx = W // 2 + int(6 * math.sin(t * 0.3)); halfw = 470; height = 560
    pts = cone_poly(cx, horizon, halfw, height)
    poly = Image.new("L", (W, H), 0); ImageDraw.Draw(poly).polygon(pts, fill=255)
    mask = (np.asarray(poly, np.float32) / 255.0)[..., None]
    body = np.array((15, 16, 24), np.float32) + np.array((10, 8, 6), np.float32) * (1 - (_Y / H))[..., None]
    # directional form: right flank catches faint sky light, left flank falls into shadow
    shade = np.clip((_X - cx) / halfw, -1, 1)[..., None]
    body = body + shade * np.array((10, 11, 14), np.float32)
    # rocky texture so the cone is not a flat fill (low-freq luma break-up)
    body = body + (_CONE_TEX * 9.0)[..., None]
    c[:] = c * (1 - mask) + np.clip(body, 0, 255) * mask
    crater_x = cx; crater_y = horizon - height + 8
    # ember lava veins creeping down the flanks from the crater (story + depth)
    vein_a = 0.5 + 0.3 * math.sin(t * 1.3)
    for vx0, spread in [(-6, -70), (10, 60), (2, -20)]:
        vpts = [(crater_x + vx0, crater_y + 14)]
        for s in range(1, 9):
            vpts.append((crater_x + vx0 + spread * (s / 8.0) + 8 * math.sin(s * 1.7 + t), crater_y + 14 + s * 46))
        vn = Image.new("L", (W, H), 0); ImageDraw.Draw(vn).line(vpts, fill=255, width=3, joint="curve")
        vnm = gaussian_filter(np.asarray(vn, np.float32) / 255.0, 1.4)[..., None] * (np.asarray(poly, np.float32) / 255.0)[..., None]
        c += vnm * np.array(EMBER, np.float32) * vein_a
    # snow-lit right rim (faint)
    rim = Image.new("L", (W, H), 0); ImageDraw.Draw(rim).line([(p[0] + 3, p[1]) for p in pts[13:]], fill=255, width=3)
    rimm = gaussian_filter(np.asarray(rim, np.float32) / 255.0, 1.2)[..., None]
    c += rimm * np.array((60, 66, 82), np.float32)
    # crater glow pulsing
    pulse = 0.55 + 0.25 * math.sin(t * 1.7)
    add_glow(c, crater_x, crater_y + 6, 70, MAGMA, 0.9 * pulse, aspect=0.7)
    add_glow(c, crater_x, crater_y + 6, 26, EMBER_HI, 1.1 * pulse, aspect=0.7)
    # rising ember plume (vertical-rise particles)
    rng = np.random.default_rng(101)
    npart = 150
    for i in range(npart):
        ph = (t * 0.11 + i / npart) % 1.0
        px = crater_x + rng.uniform(-28, 28) + math.sin((ph + i) * 4) * (24 + ph * 60)
        py = crater_y - ph * 640
        if py < 40: continue
        life = 1 - ph
        rad = 3 + ph * 26
        col = mix(EMBER_HI, ASH, ph)
        inten = 0.5 * life
        add_glow(c, px, py, rad, col, inten, aspect=1.1)
    # scene-wide ember sky-flash as the chain ignites (~7s): a full-frame illumination pulse (large-area
    # change) so the hook carries a clear above-floor EVENT_CADENCE beat in the middle of shot 1.
    for flash_t, amp in ((7.0, 26.0), (9.0, 20.0)):
        sf = math.exp(-((t - flash_t) ** 2) / (2 * 0.14 ** 2))
        if sf > 0.02:
            c += (sf * amp) * np.array([1.0, 0.52, 0.28], np.float32) * (1.25 - (_Y / H))[..., None]
    return np.clip(c, 0, 255).astype(np.uint8)

def scene2(f):   # ALT-VANTAGE cross-section: crater radiates seismic waves DOWN through rock, infrasound UP through air
    t = f / FPS; local = f - SHOTS[1][0]
    c = canvas(INK)
    boundary = 720   # ground surface y
    # air (top)
    c[:boundary] = np.array((18, 22, 34), np.float32)
    add_glow(c, W // 2, boundary - 250, 700, (26, 34, 50), 0.5, aspect=0.5)
    # rock strata (bottom) — stacked layers
    ys = [boundary, 900, 1080, 1300, 1560, H]
    bases = [(52, 40, 34), (40, 32, 30), (58, 44, 34), (34, 28, 30), (46, 36, 32)]
    for i in range(len(ys) - 1):
        c[ys[i]:ys[i + 1]] = strata_band(ys[i], ys[i + 1], bases[i])
    # the crater vent at center on the boundary
    cxv = W // 2
    add_glow(c, cxv, boundary, 60, MAGMA, 0.9, aspect=0.8)
    # radial rings: seismic (ember) DOWN into rock, infrasound (teal) UP into air — emanate over time
    rings = 7
    for k in range(rings):
        ph = (t * 0.5 - k / rings)
        rr = (ph % 1.0)
        if rr <= 0.02: continue
        R = 60 + rr * 780; aa = (1 - rr) * 0.9
        # seismic (down, ember): draw lower semicircle
        seis = Image.new("L", (W, H), 0)
        ImageDraw.Draw(seis).arc([cxv - R, boundary - R, cxv + R, boundary + R], 10, 170, fill=255, width=4)
        sm = gaussian_filter(np.asarray(seis, np.float32) / 255.0, 1.0)[..., None]
        c += sm * np.array(mix(EMBER, EMBER_LO, rr), np.float32) * aa
        # infrasound (up, teal): upper semicircle
        inf = Image.new("L", (W, H), 0)
        ImageDraw.Draw(inf).arc([cxv - R, boundary - R, cxv + R, boundary + R], 190, 350, fill=255, width=3)
        im = gaussian_filter(np.asarray(inf, np.float32) / 255.0, 1.0)[..., None]
        c += im * np.array(mix(TEAL, TEAL_LO, rr), np.float32) * aa * 0.9
    # two sensors wake (teal) after ~12.2s
    wake = ss(seg(t, 12.2, 13.6))
    if wake > 0.01:
        # seismometer in rock
        sx, sy = cxv - 300, 980
        add_glow(c, sx, sy, 30, TEAL_HI, 0.9 * wake)
        d = ImageDraw.Draw(Image.fromarray(c.astype(np.uint8)))  # noqa (glyphs drawn later in overlay)
        # infrasound mic in air
        mx, my = cxv + 300, 470
        add_glow(c, mx, my, 26, TEAL_HI, 0.9 * wake)
    return np.clip(c, 0, 255).astype(np.uint8)

def _spec_window(t, width, height, x0frac):
    # window the big scrolling spectrogram; returns colorized RGB (height,width,3)
    src = _SPEC_RGB
    sh, sw, _ = src.shape
    scrollx = int((x0frac + t * 0.06) % 1.0 * (sw - width - 2))
    win = src[:, scrollx:scrollx + width]
    if win.shape[0] != height or win.shape[1] != width:
        win = np.asarray(Image.fromarray(win.astype(np.uint8)).resize((width, height), Image.BILINEAR), np.float32)
    else:
        win = np.asarray(Image.fromarray(win.astype(np.uint8)).resize((width, height), Image.BILINEAR), np.float32)
    return win

def scene3(f):   # MACRO-CLOSEUP: the radiating waves have become a spectrogram band, building center-frame
    t = f / FPS; local = f - SHOTS[2][0]; lt = local / FPS
    c = canvas(INK)
    add_glow(c, W // 2, 760, 760, (22, 16, 20), 0.5)
    bw, bh = 900, 460; bx = (W - bw) // 2; by = 560
    build = ss(seg(lt, 0.0, 2.6))   # fills left->right and rises
    win = _spec_window(t, bw, bh, 0.05)
    # reveal mask: left->right wipe + rise
    reveal = np.zeros((bh, bw), np.float32)
    cut = int(build * bw)
    reveal[:, :max(1, cut)] = 1.0
    reveal = gaussian_filter(reveal, (0, 18))
    band = win * reveal[..., None]
    # vertical-rise shimmer: brighten a rising scan line
    scan_y = int((1 - (t * 0.5 % 1.0)) * bh)
    band[max(0, scan_y - 3):scan_y + 3, :] += 60
    c[by:by + bh, bx:bx + bw] = np.clip(c[by:by + bh, bx:bx + bw] * (1 - reveal[..., None]) + band, 0, 255)
    # thin frame edges (teal) to read as an image, not the sky
    c[by - 2:by, bx:bx + bw] += np.array(TEAL_LO, np.float32) * 0.8
    c[by + bh:by + bh + 2, bx:bx + bw] += np.array(TEAL_LO, np.float32) * 0.8
    add_glow(c, W // 2, by + bh + 40, 300, EMBER_LO, 0.25 * build)
    return np.clip(c, 0, 255).astype(np.uint8)

def scene4(f):   # DATA-PANEL: VOISS-Net reader BOOTS around the spectrogram — bezel, reticle, tags scroll
    t = f / FPS; local = f - SHOTS[3][0]; lt = local / FPS
    c = canvas((11, 13, 20))
    add_glow(c, W // 2, 720, 820, (18, 22, 30), 0.5)
    boot = ss(seg(lt, 0.0, 1.4))
    bw, bh = 900, 380; bx = (W - bw) // 2; by = 470
    win = _spec_window(t, bw, bh, 0.4)
    c[by:by + bh, bx:bx + bw] = win * (0.5 + 0.5 * boot)
    # instrument bezel (corner brackets) — the NEW world (booted), distinct from scene3's bare band
    br = int(38 * boot)
    for (ox, oy, dx, dy) in [(bx - 14, by - 14, 1, 1), (bx + bw + 14, by - 14, -1, 1),
                             (bx - 14, by + bh + 14, 1, -1), (bx + bw + 14, by + bh + 14, -1, -1)]:
        seisL = Image.new("L", (W, H), 0); dd = ImageDraw.Draw(seisL)
        dd.line([(ox, oy), (ox + dx * br, oy)], fill=255, width=4)
        dd.line([(ox, oy), (ox, oy + dy * br)], fill=255, width=4)
        c += (np.asarray(seisL, np.float32) / 255.0)[..., None] * np.array(TEAL, np.float32) * boot
    # scanning reticle window sweeping left->right across the strip
    rx = bx + int((0.1 + 0.8 * (t * 0.33 % 1.0)) * (bw - 120))
    ret = Image.new("L", (W, H), 0); dr = ImageDraw.Draw(ret)
    dr.rectangle([rx, by + 8, rx + 120, by + bh - 8], outline=255, width=3)
    c += gaussian_filter(np.asarray(ret, np.float32) / 255.0, 0.5)[..., None] * np.array(TEAL_HI, np.float32) * (0.8 * boot)
    # class tags appear beneath, lighting one by one (TREMOR/EXPLOSION/QUAKE/NOISE) — drawn as glyphs in overlay
    return np.clip(c, 0, 255).astype(np.uint8)

def scene5(f):   # TWO-UP split: LEFT the named sound (sharp, gridded), RIGHT the future dissolving to a ?
    t = f / FPS; local = f - SHOTS[4][0]; lt = local / FPS
    c = canvas((12, 13, 21))
    midx = W // 2
    push = 1.0 + 0.04 * ss(seg(lt, 0.0, 5.0))
    # LEFT: a clean gridded spectrogram fragment (what it CAN name)
    lw, lh = 470, 360; lx = 70; ly = 640
    frag = _spec_window(t * 0.3, lw, lh, 0.2)
    c[ly:ly + lh, lx:lx + lw] = frag
    grid = Image.new("L", (W, H), 0); dg = ImageDraw.Draw(grid)
    for gx in range(lx, lx + lw, 52): dg.line([(gx, ly), (gx, ly + lh)], fill=90, width=1)
    for gy in range(ly, ly + lh, 46): dg.line([(lx, gy), (lx + lw, gy)], fill=90, width=1)
    c += (np.asarray(grid, np.float32) / 255.0)[..., None] * np.array(TEAL, np.float32) * 0.7
    c[ly - 2:ly, lx:lx + lw] += np.array(TEAL, np.float32); c[ly + lh:ly + lh + 2, lx:lx + lw] += np.array(TEAL, np.float32)
    # RIGHT: the same fragment dissolving into ash-fog toward a big "?"
    rw, rh = 470, 360; rx = W - 70 - rw; ryy = 640
    diss = ss(seg(lt, 0.6, 4.5))
    rfrag = _spec_window(t * 0.3, rw, rh, 0.2).copy()
    fog = gaussian_filter(rfrag, (10 * diss + 0.5, 22 * diss + 0.5, 0))
    rfrag = rfrag * (1 - diss) + fog * diss
    rfrag *= (1 - 0.7 * diss)
    c[ryy:ryy + rh, rx:rx + rw] = rfrag
    add_glow(c, rx + rw // 2, ryy + rh // 2, 150, (30, 30, 40), 0.6 * diss)
    # dividing line
    dl = Image.new("L", (W, H), 0); ImageDraw.Draw(dl).line([(midx, 600), (midx, 1040)], fill=255, width=2)
    c += (np.asarray(dl, np.float32) / 255.0)[..., None] * np.array(GREY_LO, np.float32) * 0.8
    return np.clip(c, 0, 255).astype(np.uint8)

def scene6(f):   # PUSH-DETAIL: a failing trace slips (vertical-descent), then a lone human at a glowing console
    t = f / FPS; local = f - SHOTS[5][0]; lt = local / FPS
    c = canvas((10, 12, 19))
    # early: a mislabeled failing trace, sinking
    slip = ss(seg(lt, 0.0, 2.2))
    fw, fh = 620, 240; fx = (W - fw) // 2; fy = 560 + int(slip * 40)
    frag = _spec_window(t * 0.4, fw, fh, 0.7)
    # glitch: tear a few rows sideways
    g = frag.copy()
    for r in range(0, fh, 14):
        if (r // 14 + int(t * 8)) % 3 == 0:
            sft = int(18 * math.sin(t * 20 + r))
            g[r:r + 14] = np.roll(frag[r:r + 14], sft, axis=1)
    c[fy:fy + fh, fx:fx + fw] = g * (1 - 0.3 * slip)
    add_glow(c, W // 2, fy + fh // 2, 220, EMBER_LO, 0.3)
    # the human silhouette at a glowing teal console, rising in ~44.5s
    human = ss(seg(t, 44.2, 45.6))
    if human > 0.01:
        # console glow band
        add_glow(c, W // 2, 1020, 520, TEAL_LO, 0.7 * human, aspect=0.5)
        sil = Image.new("L", (W, H), 0); ds = ImageDraw.Draw(sil)
        # head + shoulders silhouette centered
        cx = W // 2; hy = 900
        ds.ellipse([cx - 46, hy, cx + 46, hy + 96], fill=255)
        ds.polygon([(cx - 150, 1080), (cx - 110, hy + 96), (cx + 110, hy + 96), (cx + 150, 1080)], fill=255)
        silm = (np.asarray(sil, np.float32) / 255.0)[..., None]
        c[:] = c * (1 - silm * human) + np.array((6, 8, 12), np.float32) * silm * human
        # teal rim-light on the silhouette edge (console glow wrapping the shoulders/head) — depth, not a flat cutout
        edge = np.asarray(sil, np.float32) / 255.0
        rim = np.clip(gaussian_filter(edge, 3.0) - edge, 0, 1)
        c += rim[..., None] * np.array(TEAL, np.float32) * (0.9 * human)
        # faint warm underglow on the front of the head/chest from the screens
        add_glow(c, cx, hy + 70, 130, (60, 78, 96), 0.35 * human, aspect=0.8)
        # console line in front
        cl = Image.new("L", (W, H), 0); ImageDraw.Draw(cl).line([(cx - 260, 1082), (cx + 260, 1082)], fill=255, width=4)
        c += (np.asarray(cl, np.float32) / 255.0)[..., None] * np.array(TEAL_HI, np.float32) * human
    return np.clip(c, 0, 255).astype(np.uint8)

# ---- Aleutian arc map (shot 7), precomputed control points ----
_ARC = [(90, 1180), (250, 1120), (430, 1085), (620, 1075), (segp := 760, 1090), (900, 1130), (1010, 1185)]
_VOLC = [(250, 1120), (430, 1085), (620, 1075), (760, 1090), (900, 1130)]  # dots; index 2 = Great Sitkin (brightest)
# island landmasses (x, y, half-width, half-height, shape-seed) strung along the arc as an archipelago
_ISLANDS = [(150, 1178, 34, 15, 0.4), (250, 1124, 46, 19, 1.3), (340, 1104, 30, 14, 2.1),
            (430, 1090, 52, 21, 0.8), (540, 1082, 32, 15, 1.9), (620, 1080, 48, 20, 2.6),
            (700, 1086, 30, 14, 0.6), (760, 1094, 50, 20, 1.5), (860, 1116, 34, 16, 2.3),
            (900, 1136, 44, 18, 0.9), (980, 1170, 30, 14, 1.7)]
def cam_push(c, zoom, dx):
    # continuous zoom(+pan) of the whole scene canvas — every pixel resamples each frame,
    # so the outro keeps a whole-frame motion event to the final fade (EVENT_CADENCE floor).
    img = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))
    nw, nh = int(round(W * zoom)), int(round(H * zoom))
    img = img.resize((nw, nh), Image.BICUBIC)
    left = (nw - W) // 2 + int(round(dx)); top = (nh - H) // 2
    left = max(0, min(nw - W, left)); top = max(0, min(nh - H, top))
    return np.asarray(img.crop((left, top, left + W, top + H)), np.float32)

def scene7(f):   # MAP-TERRITORY: the Aleutian arc, ember dots pulsing sound-rings, Great Sitkin brightest
    t = f / FPS; local = f - SHOTS[6][0]; lt = local / FPS
    shot_len = (SHOTS[6][1] - SHOTS[6][0]) / FPS
    prog = clamp01(lt / shot_len)   # 0..1 across the whole shot, reaching 1.0 at t=60 (no ease-out stop)
    c = canvas((10, 12, 20))
    vgrad(c, (12, 15, 26), (16, 14, 20))
    # slow continuous horizontal traverse (drifts through the end, never eases to a static hold)
    ox = int(-30 * prog)
    # ocean shimmer suggestion
    add_glow(c, W // 2 + ox, 1120, 900, (18, 24, 34), 0.4, aspect=0.35)
    # island landmasses along the arc (an archipelago, not just a bare line + dots)
    land = Image.new("L", (W, H), 0); dl = ImageDraw.Draw(land)
    for (ix, iy, iw, ih, seed) in _ISLANDS:
        cx0 = ix + ox
        poly = []
        for k in range(14):
            ang = 2 * math.pi * k / 14
            rr = 1.0 + 0.42 * math.sin(seed + k * 2.1) + 0.22 * math.cos(seed * 1.7 + k)
            poly.append((cx0 + math.cos(ang) * iw * rr, iy + math.sin(ang) * ih * rr))
        dl.polygon(poly, fill=255)
    landf = np.asarray(land, np.float32) / 255.0
    landm = gaussian_filter(landf, 1.0)[..., None]
    c[:] = c * (1 - landm * 0.95) + np.array((56, 46, 40), np.float32) * landm * 0.95
    c += landm * np.array((30, 24, 20), np.float32) * (1 - (_Y / H))[..., None]      # top-light on the land
    coast = np.clip(gaussian_filter(landf, 1.6) - landf, 0, 1)[..., None]            # a lit coastline edge
    c += coast * np.array((92, 104, 120), np.float32) * 0.9
    # the arc line (island chain spine)
    arc = Image.new("L", (W, H), 0); da = ImageDraw.Draw(arc)
    pts = [(x + ox, y) for (x, y) in _ARC]
    da.line(pts, fill=255, width=2, joint="curve")
    c += gaussian_filter(np.asarray(arc, np.float32) / 255.0, 0.6)[..., None] * np.array((70, 82, 100), np.float32)
    # volcano dots + pulsing sound-rings
    for i, (vx, vy) in enumerate(_VOLC):
        vx += ox
        great = (i == 2)
        base_col = EMBER_HI if great else EMBER
        add_glow(c, vx, vy, 30 if great else 20, base_col, 1.0 if great else 0.6)
        # sound-rings (teal) pulse, staggered — kept DIM/small so the outro's per-frame motion stays
        # well under the clip's event floor (a busy outro lifts the 55th-pct floor and un-spikes the
        # marginal early bridge frame, which would open a spurious early dead window).
        ph = (t * 0.6 - i * 0.3) % 1.0
        if ph > 0.02:
            R = 12 + ph * (110 if great else 70); aa = (1 - ph) * (0.5 if great else 0.32)
            rg = Image.new("L", (W, H), 0); ImageDraw.Draw(rg).ellipse([vx - R, vy - R, vx + R, vy + R], outline=255, width=2)
            c += gaussian_filter(np.asarray(rg, np.float32) / 255.0, 0.9)[..., None] * np.array(TEAL, np.float32) * aa
    # one discrete bright sonar return from Great Sitkin at ~t=56.0 — a sharp onset then a long gentle
    # decay, engineered to register as exactly ONE high-delta frame-pair (the onset), so it bridges the
    # outro (wordmark spike ~51.8 -> ping 56.0 -> final fade, every gap < 5s) while keeping the clip's
    # 55th-pct event floor low enough that the marginal early bridge frame still counts as an event.
    gx, gy = _VOLC[2]; gx += ox
    for ping_t in (53.5, 56.6):                     # two single-spike sonar returns space the outro events <5s
        dt = t - ping_t
        if 0.0 <= dt <= 1.7:
            appear = clamp01(dt / 0.12)             # sharp onset (~3-4 frames) -> a single delta spike
            fade = 1.0 - clamp01((dt - 0.12) / 1.5) # long gentle decay, each step below the event floor
            sa = appear * fade * 1.3
            if sa > 0.02:
                R = 300                             # fixed radius (no expansion) so the decay stays sub-floor
                sw = Image.new("L", (W, H), 0)
                ImageDraw.Draw(sw).ellipse([gx - R, gy - R, gx + R, gy + R], outline=255, width=14)
                c += gaussian_filter(np.asarray(sw, np.float32) / 255.0, 2.4)[..., None] * np.array(TEAL_HI, np.float32) * sa
    # continuous slow push-in + pan — resamples the whole frame every frame so the outro keeps moving to
    # the final fade (no static hold) and sustains mid-level motion through t=60 (holds the event floor steady).
    c = cam_push(c, 1.0 + 0.10 * prog, -70.0 * prog)
    # full-frame teal "listening pulses" through the outro — large-area events (like the hook's sky-flash)
    # so the outro carries clear above-floor EVENT_CADENCE beats spaced <5s to the final fade.
    for pt, amp in ((48.0, 30.0), (50.3, 30.0), (52.6, 30.0), (54.9, 28.0), (57.2, 26.0)):
        pf = math.exp(-((t - pt) ** 2) / (2 * 0.13 ** 2))
        if pf > 0.02:
            c += (pf * amp) * np.array([0.34, 1.0, 0.92], np.float32) * (0.7 + 0.6 * (1 - _Y / H))[..., None]
    return np.clip(c, 0, 255).astype(np.uint8)

SCENES = [scene1, scene2, scene3, scene4, scene5, scene6, scene7]

# ================= transitions between shots =================
def _blend(a, b, t): return (a.astype(np.float32) * (1 - t) + b.astype(np.float32) * t).astype(np.uint8)
def render_scene(f):
    si = shot_of(f)
    base = SCENES[si](f)
    # blend the transition into this shot near its start (except shot 0)
    a0, b0 = SHOTS[si]
    if si > 0 and f - a0 < TW_LEN:
        tt = (f - a0) / TW_LEN
        prev = SCENES[si - 1](f)   # render prev world at this time for the blend
        tr = TRANS[si]
        if tr == "hard-cut":
            base = base if tt > 0.25 else prev   # a quick swap on the beat
        elif tr == "focus-pull":
            k = (1 - abs(tt - 0.5) * 2)
            pb = gaussian_filter(prev.astype(np.float32), (6 * k, 6 * k, 0)).astype(np.uint8)
            nb = gaussian_filter(base.astype(np.float32), (6 * (1 - tt) ** 2 * 3, 6 * (1 - tt) ** 2 * 3, 0)).astype(np.uint8)
            base = _blend(pb, nb, ss(tt))
        elif tr == "morph":
            base = _blend(gaussian_filter(prev.astype(np.float32), (2, 2, 0)).astype(np.uint8), base, ss(tt))
        else:  # match-cut / fui-boot / pull-out => eased crossfade with a shared center
            bt = ss(tt)
            if tr == "pull-out":
                # concentrate the shot6->7 resolve into a single sampled window so the crossfade lands as
                # ONE high-delta frame-pair (not two). This keeps the outro's contribution to the clip's
                # 55th-pct event floor minimal, without changing the transition's on-screen length.
                bt = ss(clamp01((tt - 0.45) / 0.4))
            base = _blend(prev, base, bt)
    return base

# ================= overlays (post-grade, crisp) =================
def _wrap(words, fnt, maxw, spw):
    lines = [[]]; wsum = 0
    for (w, midp) in words:
        ww = tw(w, fnt)
        if lines[-1] and wsum + spw + ww > maxw: lines.append([]); wsum = 0
        lines[-1].append((w, midp)); wsum += (spw if len(lines[-1]) > 1 else 0) + ww
    return lines

def caption(img, f):
    t = f / FPS; cue = None
    for c in CUES:
        if c["s"] - 0.24 <= t < c["e"] + 0.20: cue = c; break
    if not cue: return
    s, e = cue["s"], cue["e"]
    ap = oc(seg(t, s - 0.24, s + 0.08)) * (1.0 - seg(t, e - 0.10, e + 0.20))
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
            col = SNOW if midp <= prog - 0.05 else (SULPHUR_HI if midp <= prog + 0.05 else GREY)
            d.text((x, y), w, font=fnt, fill=(*col, int(255 * la)), stroke_width=3, stroke_fill=(2, 6, 10, int(236 * la)))
            logw(x, y, tw(w, fnt), fnt.size, col, la, (midp <= prog + 0.05) and (la >= 0.6), "caption")
            x += tw(w, fnt) + spw
    uw = W - 2 * 150; ux = 150; uy = y0 + blockh + 16
    d.line([(ux, uy), (ux + uw, uy)], fill=(60, 80, 104, int(120 * ap)), width=2)
    d.line([(ux, uy), (ux + int(uw * prog), uy)], fill=(*TEAL_HI, int(230 * ap)), width=3)

def brand_eyebrow(d, f):
    a = oc(seg(f, 8, 34)) * (1 - seg(f, NF - 40, NF - 10))
    if a <= 0.02: return
    ex = "ALASKA.AI  ·  FIELD SIGNAL"; fnt = mono(24, m=True)
    tk(d, ex, fnt, (*SNOW, int(210 * a)), 96, 96, 0.14)

# persistent HUD strip + per-shot big labels — all live in the CARD_BAND (y[1175,1360]) so it stays crisp
def hud_and_labels(img, f):
    d = ImageDraw.Draw(img, "RGBA"); t = f / FPS; si = shot_of(f)
    outro_start = max(int(SPEECH_END * FPS) + 12, BOUNDS[6] + 40)
    if f < outro_start:
        sy = 1214
        d.line([(96, sy - 16), (W - 96, sy - 16)], fill=(*TEAL_LO, 150), width=2)
        left = "VOISS-NET  ·  AVO"
        tk(d, left, mono(25, m=True), (*SNOW, 214), 96, sy, 0.06)
        logw(96, sy, tw(left, mono(25, m=True), 0.06), 25, SNOW, 1.0, True, "hud")
        right = "seismic + infrasound spectrograms"
        rw = tw(right, mono(23), 0.02); tk(d, right, mono(23), (*TEAL_HI, 220), W - 96 - rw, sy + 2, 0.02)
        logw(W - 96 - rw, sy + 2, rw, 23, TEAL_HI, 1.0, True, "hud")

    def stamp(txt, x, y, fnt, col, a, key, tr=0.02):
        tk(d, txt, fnt, (*col, int(255 * a)), x, y, tr)
        logw(x, y, tw(txt, fnt, tr), fnt.size, col, a, a >= 0.6, key)

    if si == 0:  # GREAT SITKIN + WATCH · ORANGE badge (verified live status)
        a = oc(seg(t, 4.0, 4.8)) * (1 - seg(t, 9.6, 10.2))
        if a > 0.02:
            stamp("GREAT SITKIN", 150, 1262, fr(58, 800), SNOW, a, "hud")
            bx = 150; by = 1330
            d.rounded_rectangle([bx, by, bx + 300, by + 40], 8, outline=(*SULPHUR, int(230 * a)), width=2)
            stamp("WATCH · ORANGE", bx + 16, by + 6, mono(24, b=True), SULPHUR_HI, a, "hud", 0.06)
    if si == 1:  # SEISMIC + INFRASOUND label near the two sensors
        a = oc(seg(t, 12.6, 13.4)) * (1 - seg(t, 18.2, 18.7))
        if a > 0.02:
            stamp("LISTENING · NOT WATCHING", 150, 1270, mono(34, b=True), TEAL_HI, a, "hud", 0.03)
    if si == 2:  # SPECTROGRAM label
        a = oc(seg(t, 22.2, 23.0)) * (1 - seg(t, 24.0, 24.3))
        if a > 0.02:
            stamp("A SPECTROGRAM", 150, 1266, fr(52, 800), SNOW, a, "hud")
            stamp("THE VOLCANO'S VOICE, MADE VISIBLE", 150, 1332, mono(24, m=True), (192, 202, 218), a, "hud", 0.03)
    if si == 3:  # training tally + class tags + 87%
        a1 = oc(seg(t, 26.3, 27.0)) * (1 - seg(t, 29.2, 29.5))
        if a1 > 0.02:
            stamp("270,000+ SPECTROGRAMS  ·  7 VOLCANOES", 150, 1270, mono(34, b=True), TEAL_HI, a1, "stat", 0.02)
        a2 = oc(seg(t, 29.5, 30.1)) * (1 - seg(t, 32.5, 32.9))
        if a2 > 0.02:
            tags = ["TREMOR", "EXPLOSION", "QUAKE", "NOISE"]; x = 150
            for i, tg in enumerate(tags):
                lit = t >= 29.5 + i * 0.55
                col = SULPHUR_HI if lit else (192, 202, 218)  # unlit stays above the readability vis floor
                stamp(tg, x, 1272, mono(30, b=True), col, a2, "stat", 0.04)
                x += tw(tg, mono(30, b=True), 0.04) + 34
        a3 = oc(seg(t, 32.9, 33.6))
        if a3 > 0.02:
            stamp("87% ACCURACY", 150, 1264, fr(62, 800), EMBER_HI, a3, "stat")
            stamp("on the test set", 150 + tw("87% ACCURACY", fr(62, 800), 0.02) + 32, 1288, mono(26, m=True), (192, 202, 218), a3, "stat", 0.02)
    if si == 4:  # the honest turn labels, split
        a = oc(seg(t, 37.2, 38.0))
        if a > 0.02:
            stamp("IT CAN NAME THE SOUND", 90, 1270, mono(30, b=True), TEAL_HI, a, "hud", 0.02)
        a2 = oc(seg(t, 39.8, 40.6))
        if a2 > 0.02:
            s = "NOT THE HOUR IT BLOWS"; wpx = tw(s, mono(30, b=True), 0.02)
            stamp(s, W - 90 - wpx, 1270, mono(30, b=True), SULPHUR_HI, a2, "hud", 0.02)
    if si == 5:  # failure + human
        a = oc(seg(t, 42.2, 43.0)) * (1 - seg(t, 44.4, 44.9))
        if a > 0.02:
            stamp("OUTSIDE ITS TRAINING · IT SLIPS", 150, 1270, mono(32, b=True), EMBER_HI, a, "hud", 0.02)
        a2 = oc(seg(t, 44.9, 45.6))
        if a2 > 0.02:
            stamp("A PERSON STILL KEEPS WATCH", 150, 1270, mono(32, b=True), TEAL_HI, a2, "hud", 0.02)
    if si == 6 and f < outro_start:  # payoff line
        a = oc(seg(t, 47.4, 48.2))
        if a > 0.02:
            stamp("ALASKA IS LISTENING", 150, 1270, fr(48, 800), SNOW, a, "hud")

# a big teal "?" for shot 5 right side (the unknown WHEN) — drawn crisp post-grade
def caveat_mark(img, f):
    si = shot_of(f); t = f / FPS
    if si != 4: return
    a = oc(seg(t, 40.0, 41.0))
    if a <= 0.02: return
    d = ImageDraw.Draw(img, "RGBA"); qf = fr(180, 900)
    s = "?"; wq = tw(s, qf); rx = 70 + 470 + (470 - wq) // 2 - 470 + (W - 70 - 470)
    cx = (W - 70 - 470) + (470 - wq) // 2
    tk(d, s, qf, (*TEAL_HI, int(220 * a)), cx, 700)

# ---------------- outro (staged reveals, motion to the last frame) ----------------
def outro(img, f):
    start = max(int(SPEECH_END * FPS) + 12, BOUNDS[6] + 40)
    if f < start: return
    d = ImageDraw.Draw(img, "RGBA")
    a1 = oc(seg(f, start, start + 44))
    if a1 > 0.02:
        wf = fr(96, 820); s = "ALASKA.AI"; w = tw(s, wf, 0.05)
        tk(d, s, wf, (255, 210, 96, int(255 * a1)), (W - w) // 2, 1416 - int((1 - a1) * 16), 0.05)
        logw((W - w) // 2, 1416, w, wf.size, (255, 210, 96), a1, a1 >= 0.6, "outro")
    a2 = oc(seg(f, start + 38, start + 80))
    if a2 > 0.02:
        tf = fr(38, 600); s = "what's moving in alaska ai, this week"; w = tw(s, tf, 0.02)
        tk(d, s, tf, (228, 240, 250, int(228 * a2)), (W - w) // 2, 1536 - int((1 - a2) * 14), 0.02)
        logw((W - w) // 2, 1536, w, tf.size, (228, 240, 250), a2, a2 >= 0.6, "outro")
    a3 = oc(seg(f, start + 72, start + 104))
    if a3 > 0.02:
        s = "VOISS-Net · AVO / UAF · Volcanica 2025 · Great Sitkin ORANGE · Jul 8 2026"
        sz = 22; cf = mono(sz)
        while tw(s, cf, 0.02) > W - 130 and sz > 15:
            sz -= 1; cf = mono(sz)
        w = tw(s, cf, 0.02)
        tk(d, s, cf, (150, 170, 190, int(210 * a3)), (W - w) // 2, 1612, 0.02)
    gp = seg(f, start + 38, NF - 6)
    if gp > 0.0:
        uw = 520; ux = (W - uw) // 2; uy = 1586; tip = ux + int(uw * ss(gp))
        d.line([(ux, uy), (ux + uw, uy)], fill=(60, 82, 108, 150), width=2)
        d.line([(ux, uy), (tip, uy)], fill=(*SULPHUR, 220), width=3)
        d.ellipse([tip - 5, uy - 5, tip + 5, uy + 5], fill=(*TEAL_HI, 210))
    fade = seg(f, NF - 34, NF - 2)
    if fade > 0:
        ov = Image.new("RGBA", (W, H), (5, 7, 12, int(238 * ss(fade)))); img.alpha_composite(ov)

# ---------------- bottom scrim so HUD + captions sit on a dark base over bright shots ----------------
SCRIM_COL = np.array([6, 8, 13], np.float32)
_scr = np.clip((_Y - 1120.0) / 150.0, 0.0, 1.0)
SCRIM_A = ((_scr * _scr * (3 - 2 * _scr)) * 0.70)[..., None]
def draw_plates(img, f):
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    arr = arr * (1 - SCRIM_A) + SCRIM_COL * SCRIM_A
    img.paste(Image.fromarray(arr.astype(np.uint8)))

# ---------------- compose one frame ----------------
def render_frame(f):
    base = render_scene(f)
    graded = finish(base, seed=2000 + f)
    img = Image.fromarray(graded).convert("RGBA")
    draw_plates(img, f)
    set_frame_bg(img, f)
    dr = ImageDraw.Draw(img, "RGBA")
    brand_eyebrow(dr, f)
    caveat_mark(img, f)
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
