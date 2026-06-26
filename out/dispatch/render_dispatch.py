"""
Alaska.Ai Dispatch 2026-06-26 — XPRIZE Wildfire
Field-HUD thermal drone POV, 9:16 (1080x1920), 60s/1800f
Dark navy + thermal (teal->amber->red) + cyan AI elements.

Usage:
  python render_dispatch.py           # all 1800 frames
  python render_dispatch.py 0 600     # range (inclusive)
  python render_dispatch.py test 0 60 180 480 900 1200 1500 1740
"""
import sys, os, math, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter
from scipy.interpolate import PchipInterpolator

HERE = os.path.dirname(os.path.abspath(__file__))
DISP_SKILLS = os.path.join(HERE, "..", "..", ".claude", "skills", "alaska-dispatch")
sys.path.insert(0, DISP_SKILLS)
import easing as E

FR = os.path.join(HERE, "frames_v3"); os.makedirs(FR, exist_ok=True)
FONTS = os.path.join(HERE, "..", "..", ".claude", "skills", "alaska-ai-brief", "fonts")
W, H = 1080, 1920; FPS = 30; NF = 1800

# Palette — field-HUD thermal
NAVY     = np.array([8,  12,  28],  np.float32)
NAVY2    = np.array([14, 20,  42],  np.float32)
COOL     = np.array([0,  175, 198], np.float32)   # thermal-cool teal
WARM     = np.array([255,145,  0],  np.float32)   # thermal warm
HOT      = np.array([255, 50,  0],  np.float32)   # thermal hot
CYAN_AI  = np.array([0,  235, 220], np.float32)   # drone/AI overlay
GOLD     = np.array([255,199,  44], np.float32)
WHITE    = np.array([240,248, 255], np.float32)
DIM      = np.array([80, 110, 140], np.float32)
RED_A    = np.array([255, 55,  35], np.float32)
GRN_OK   = np.array([26,  229,164], np.float32)

def _c(a): return tuple(int(x) for x in a)

def fr_font(sz, wt=700, op=144, it=False):
    f = ImageFont.truetype(os.path.join(FONTS, "Fraunces-Italic-Var.ttf" if it else "Fraunces-Var.ttf"), sz)
    try: f.set_variation_by_axes([op, wt, 0, 0])
    except Exception: pass
    return f

def mono(sz, b=False, m=False):
    n = "JetBrainsMono-Bold.ttf" if b else ("JetBrainsMono-Medium.ttf" if m else "JetBrainsMono-Regular.ttf")
    return ImageFont.truetype(os.path.join(FONTS, n), sz)

def tw(txt, f):
    bb = f.getbbox(txt); return bb[2] - bb[0]

# ── Load audio timings ──────────────────────────────────────────────────────
AUD = os.path.join(HERE, "audio")
TIM = json.load(open(os.path.join(AUD, "timing60.json")))
BEATS = TIM["beats"]   # list of 9 frame numbers
CUES  = json.load(open(os.path.join(AUD, "words60.json")))["words"]
SPEECH_END = TIM["speech_end"]

# ── Pre-compute static terrain ──────────────────────────────────────────────
def build_terrain():
    rng = np.random.default_rng(77)
    field = np.zeros((H, W), np.float32)
    for scale, amp in [(60, 0.50), (120, 0.26), (240, 0.14), (480, 0.07), (900, 0.03)]:
        rows = H // scale + 3; cols = W // scale + 3
        n = rng.standard_normal((rows, cols)).astype(np.float32)
        n_up = np.asarray(Image.fromarray(n).resize((W, H), Image.BICUBIC), np.float32)
        field += n_up * amp
    field = (field - field.min()) / (field.max() - field.min() + 1e-6)
    # Ridge lines: sharpen mid-range values
    field = np.clip(gaussian_filter(field, 1.8), 0, 1)
    return field

TERRAIN = build_terrain()

# Pre-compute expensive per-frame constants
_vy, _vx = np.mgrid[0:H, 0:W].astype(np.float32)
_VR = np.sqrt(((_vx - W/2)/(W/2))**2 + ((_vy - H/2)/(H/2))**2)
VIGNETTE = (0.82 + 0.18 * (1/(1+(_VR*1.5)**2)**2)).astype(np.float32)  # HxW

# Pre-generate grain bank (30 frames, pre-blurred)
print("Pre-computing grain bank...")
_GRAIN_BANK = []
for _gi in range(30):
    _rng = np.random.default_rng(_gi * 77)
    _n = gaussian_filter(_rng.standard_normal((H, W)).astype(np.float32), 0.9)
    _n /= _n.std() + 1e-6
    _GRAIN_BANK.append(_n)
print("Grain bank ready.")

def thermal_lut():
    """5-stop thermal color ramp: cold-black → teal → amber → orange → red-white."""
    lut = np.zeros((256, 3), np.float32)
    stops = [
        (0,   [8,  12,  28]),
        (60,  [10, 60,  80]),
        (100, [0,  170, 195]),
        (150, [255,130,  0]),
        (200, [255, 50,  0]),
        (230, [255,120, 30]),
        (255, [255,240,200]),
    ]
    xs = [s[0] for s in stops]; ys = np.array([s[1] for s in stops], np.float32)
    for ch in range(3):
        interp = PchipInterpolator(xs, ys[:, ch])
        lut[:, ch] = np.clip(interp(np.arange(256)), 0, 255)
    return lut.astype(np.uint8)

LUT = thermal_lut()

def apply_thermal(field, hot_mask=None, hot_strength=0.0):
    """Apply thermal colormap to 0-1 field. hot_mask adds extra heat."""
    f = field.copy()
    if hot_mask is not None:
        f = np.clip(f + hot_mask * hot_strength, 0, 1)
    idx = (np.clip(f, 0, 1) * 255).astype(np.uint8)
    return LUT[idx]   # HxWx3 uint8

# ── Fire hotspot ────────────────────────────────────────────────────────────
FIRE_X, FIRE_Y = int(W * 0.55), int(H * 0.38)   # upper-right zone of terrain
FIRE_APPEAR_F = BEATS[3] if len(BEATS) > 3 else 450   # frame when fire detected (seg 4)

def fire_hot_mask(frame):
    """Return additive heat blob for fire detection event, grows after FIRE_APPEAR_F."""
    if frame < FIRE_APPEAR_F:
        return None, 0.0
    prog = min(1.0, (frame - FIRE_APPEAR_F) / 120.0)
    strength = E.out_quint(prog) * 0.72
    max_r = 90 + 40 * prog
    ys, xs = np.mgrid[0:H, 0:W]
    dist = np.sqrt((xs - FIRE_X)**2 + (ys - FIRE_Y)**2).astype(np.float32)
    core  = np.exp(-(dist / (max_r * 0.25))**2)
    outer = np.exp(-(dist / max_r)**2) * 0.4
    pulse = 0.06 * math.sin(frame * 0.22)
    return np.clip(core + outer + pulse, 0, 1), strength

# ── Drone paths ─────────────────────────────────────────────────────────────
DRONE_STARTS_F = BEATS[3] if len(BEATS) > 3 else 450

def _path_pts(seed):
    rng = np.random.default_rng(seed)
    n = rng.integers(4, 7)
    xs = rng.uniform(0.1, 0.9, n) * W
    ys = rng.uniform(0.08, 0.72, n) * H
    return list(zip(xs.tolist(), ys.tolist()))

DRONE_PATHS = [_path_pts(s) for s in [11, 22, 33, 44]]

def draw_drone_paths(d, frame):
    if frame < DRONE_STARTS_F:
        return
    prog = min(1.0, (frame - DRONE_STARTS_F) / 300.0)
    alpha_p = E.out_quint(min(1.0, (frame - DRONE_STARTS_F) / 60.0))
    col = _c(CYAN_AI * alpha_p)
    for path_i, pts in enumerate(DRONE_PATHS):
        delay = path_i * 40
        p2 = E.out_quint(min(1.0, max(0.0, (frame - DRONE_STARTS_F - delay) / 280.0)))
        if p2 <= 0: continue
        total_len = sum(math.hypot(pts[i+1][0]-pts[i][0], pts[i+1][1]-pts[i][1]) for i in range(len(pts)-1))
        target = p2 * total_len; so_far = 0.0
        for i in range(len(pts)-1):
            seg_len = math.hypot(pts[i+1][0]-pts[i][0], pts[i+1][1]-pts[i][1])
            if so_far + seg_len >= target:
                t_ = (target - so_far) / max(seg_len, 1e-6)
                ex = pts[i][0] + t_ * (pts[i+1][0] - pts[i][0])
                ey = pts[i][1] + t_ * (pts[i+1][1] - pts[i][1])
                seg_pts = pts[:i+1] + [(ex, ey)]
                if len(seg_pts) >= 2:
                    d.line([(int(x), int(y)) for x, y in seg_pts], fill=col, width=2)
                # Drone icon: small diamond
                d.ellipse([int(ex)-5, int(ey)-5, int(ex)+5, int(ey)+5], outline=col, width=2)
                break
            so_far += seg_len

# ── Detection event ─────────────────────────────────────────────────────────
def draw_detection_circle(d, frame):
    if frame < FIRE_APPEAR_F:
        return
    prog = min(1.0, (frame - FIRE_APPEAR_F) / 90.0)
    r = int(E.out_quint(prog) * 120)
    if r < 4: return
    alpha = E.out_expo(min(1.0, (frame - FIRE_APPEAR_F) / 30.0))
    pulse = 0.15 * math.sin(frame * 0.35)
    a = int(max(0, min(1, alpha + pulse)) * 220)
    col = (255, 55, 35, a)
    d.ellipse([FIRE_X-r, FIRE_Y-r, FIRE_X+r, FIRE_Y+r], outline=col, width=3)
    d.ellipse([FIRE_X-r//3, FIRE_Y-r//3, FIRE_X+r//3, FIRE_Y+r//3], outline=(255,160,50,a), width=2)

# ── Scan grid ───────────────────────────────────────────────────────────────
def draw_scan_grid(d, frame):
    a = int(min(1.0, frame / 60.0) * 22)
    if a <= 0: return
    col = (0, 235, 220, a)
    GSTEP = 90
    scan_h = int(H * 0.76)
    for x in range(0, W, GSTEP):
        d.line([(x, 0), (x, scan_h)], fill=col, width=1)
    for y in range(0, scan_h, GSTEP):
        d.line([(0, y), (W, y)], fill=col, width=1)
    # Moving active-scan line: sweeps top→bottom every 3s, forces cadence spikes.
    # 50px tall × full width × alpha 200 → delta ~7 per 6-frame gate sample (well above p55 floor).
    scan_period = int(3 * FPS)
    scan_y = int((frame % scan_period) / scan_period * scan_h)
    d.rectangle([(0, scan_y), (W, min(scan_h, scan_y + 50))],
                fill=(0, 235, 220, 200))

# ── Top HUD bar ─────────────────────────────────────────────────────────────
def seg_for_frame(frame):
    """Return 0-based segment index for this frame."""
    for i, b in enumerate(reversed(BEATS)):
        if frame >= b:
            return len(BEATS) - 1 - i
    return 0

STATES = ["INITIALIZING", "SCANNING", "SCANNING", "SCANNING", "DETECTING...",
          "FIRE CONFIRMED", "TRACKING", "RESULTS PENDING", "ANALYSIS COMPLETE", "COMPLETE"]

def draw_top_hud(d, frame):
    seg = seg_for_frame(frame)
    f_small = mono(22, m=True)
    f_tiny  = mono(18)
    # Top bar bg (subtle)
    d.rectangle([(0, 0), (W, 72)], fill=(8, 12, 32, 180))
    # Left: XPRIZE label
    d.text((24, 14), "XPRIZE WILDFIRE", font=mono(20, b=True), fill=_c(GOLD))
    d.text((24, 42), "AUTONOMOUS WILDFIRE RESPONSE", font=mono(16), fill=_c(DIM))
    # Center: state machine
    state = STATES[min(seg + 1, len(STATES)-1)]
    col_s = _c(RED_A) if "DETECT" in state or "FIRE" in state else (_c(CYAN_AI) if "SCAN" in state else _c(GRN_OK))
    sw = tw(state, mono(18, b=True))
    d.text((W//2 - sw//2, 26), state, font=mono(18, b=True), fill=col_s)
    # Right: clock timer
    t_sec = frame / FPS
    timer_val = max(0.0, 600.0 - t_sec * (600.0 / 60.0))  # counts down from 10:00
    mm = int(timer_val // 60); ss = int(timer_val % 60)
    timer_str = f"{mm:02d}:{ss:02d}"
    timer_col = _c(RED_A) if mm == 0 and ss < 30 else _c(WHITE)
    d.text((W - 110, 22), timer_str, font=mono(30, b=True), fill=timer_col)

# ── Data card (CARD_BAND y=1175..1360) ─────────────────────────────────────
def draw_data_card(d, frame, words60=None):
    seg = seg_for_frame(frame)
    # Card background
    d.rectangle([(60, 1182), (W-60, 1355)], fill=(8, 14, 34, 220))
    d.rectangle([(60, 1182), (W-60, 1182)], fill=_c(CYAN_AI * 0.7) + (180,))  # top border
    # Row 1: competition stats
    f_label = mono(18)
    f_val   = mono(22, b=True)
    cols4 = [(90, 1200), (310, 1200), (560, 1200), (780, 1200)]
    labels = ["COMPETITION", "TEST ZONE", "RESPONSE", "TEAMS"]
    vals   = ["$11M / 4 YRS", "1,000 km²", "10 MIN",    "130+" if seg >= 5 else "4 FINALISTS"]
    for (lx, ly), lab, val in zip(cols4, labels, vals):
        d.text((lx, ly), lab, font=f_label, fill=_c(DIM))
        d.text((lx, ly + 24), val, font=f_val, fill=_c(WHITE))
    # Divider
    d.line([(60, 1270), (W-60, 1270)], fill=_c(DIM * 0.5) + (120,), width=1)
    # Row 2: location + date + detection status
    d.text((90, 1280), "LOCATION", font=f_label, fill=_c(DIM))
    d.text((90, 1302), "NEAR NENANA, AK", font=f_val, fill=_c(WHITE))
    d.text((340, 1280), "DATES", font=f_label, fill=_c(DIM))
    d.text((340, 1302), "JUNE 15-25, 2026", font=f_val, fill=_c(WHITE))
    d.text((640, 1280), "DETECTION", font=f_label, fill=_c(DIM))
    det_col = _c(RED_A) if seg >= 4 else _c(DIM)
    det_val = "FIRE CONFIRMED" if seg >= 5 else ("DETECTED" if seg >= 4 else "SCANNING...")
    d.text((640, 1302), det_val, font=mono(20, b=True), fill=det_col)

# ── Caption band (CAP_BAND y=1410..1600) ────────────────────────────────────
def draw_captions(d, frame, cues):
    t_now = frame / FPS
    active = [c for c in cues if c["s"] <= t_now <= c["e"] + 0.06]
    if not active: return
    t_start = active[0]["s"]
    window = [c for c in cues if abs(c["s"] - t_start) < 2.2]
    if not window: window = active

    f_cap = fr_font(44, wt=600)
    MAX_W = W - 100
    phrase = " ".join(c["w"] for c in window).strip()

    # Word-wrap into lines
    parts = phrase.split()
    lines = []; cur = []
    for w2 in parts:
        test = " ".join(cur + [w2])
        if tw(test, f_cap) <= MAX_W: cur.append(w2)
        else:
            if cur: lines.append(" ".join(cur))
            cur = [w2]
    if cur: lines.append(" ".join(cur))
    lines = lines[:3]  # max 3 lines

    LINE_H = 52
    d.rectangle([(0, 1400), (W, 1610)], fill=(4, 8, 20, 210))
    y0 = 1425 - max(0, (len(lines)-1)*LINE_H//2)
    for li, ln in enumerate(lines):
        lw = tw(ln, f_cap)
        x0 = max(50, W//2 - lw//2)
        d.text((x0, y0 + li*LINE_H), ln, font=f_cap, fill=_c(WHITE))

# ── Side panel (segs 1-6: story context) ────────────────────────────────────
def draw_side_panel(d, frame):
    seg = seg_for_frame(frame)
    if seg < 0: return
    prog = min(1.0, (frame - BEATS[min(seg, len(BEATS)-1)]) / 45.0)
    a = int(E.out_quint(prog) * 255)
    if a <= 0: return
    f_sm = mono(20, m=True)
    # Context items per segment
    items = {
        0: [("2026-06-15", "FINALS BEGIN"), ("4 TEAMS", "QUALIFYING ROUND"), ("NENANA AK", "TEST SITE")],
        1: [("10 MIN", "RESPONSE WINDOW"), ("0 HUMANS", "IN THE LOOP"), ("1 FIRE", "PER RUN")],
        2: [("$11M", "PRIZE POOL"), ("4 YEARS", "COMPETITION"), ("2022-2026", "TIMELINE")],
        3: [("1,000 km²", "SCAN ZONE"), ("BOREAL", "TERRAIN TYPE"), ("AUTONOMOUS", "NAVIGATION")],
        4: [("ML DETECT", "THERMAL SENSOR"), ("AI DISPATCH", "SWARM COORD"), ("ANDURIL", "FINALIST")],
        5: [("DRYAD", "FINALIST"), ("FIRESWARM", "FINALIST"), ("WILDFIRE QUEST", "FINALIST")],
        6: [("RESULTS", "Q3 2026"), ("WINNER", "TBD"), ("NO DEPLOY", "NOT YET")],
        7: [("DEPLOY", "YEARS AWAY"), ("STATE SCALE", "663,000 mi²"), ("UAF / ACUASI", "GROUND OPS")],
        8: [("TESTED IN", "ALASKA"), ("STANDARD", "SET HERE"), ("alaska.ai", "DISPATCH")],
    }
    row_items = items.get(seg, [])
    for ri, (val, lab) in enumerate(row_items):
        y = 200 + ri * 70
        col_v = _c(np.clip(WHITE * (a/255.), 0, 255))
        col_l = _c(np.clip(DIM * (a/255.), 0, 255))
        d.text((36, y), val, font=mono(22, b=True), fill=col_v)
        d.text((36, y + 26), lab, font=f_sm, fill=col_l)

# ── Title / overlay cards ───────────────────────────────────────────────────
def draw_title_card(d, frame):
    seg = seg_for_frame(frame)
    # Seg 2 overlay: animated $11M counter + year range
    if seg == 2:
        dur_seg = max(1, BEATS[3] - BEATS[2])
        p_seg = min(1.0, (frame - BEATS[2]) / dur_seg)
        prog = E.out_quint(min(1.0, (frame - BEATS[2]) / 45.0))
        a = int(prog * 255)
        if a > 0:
            d.rectangle([(100, 680), (980, 900)], fill=(8, 14, 34, int(200 * prog)))
            # Animated counter: 0 to 11,000,000
            count_val = int(E.in_out_cubic(min(1.0, p_seg * 1.6)) * 11_000_000)
            count_str = f"${count_val:,}"
            d.text((W//2 - tw(count_str, mono(54, b=True))//2, 700),
                   count_str, font=mono(54, b=True), fill=_c(GOLD * prog))
            # Label below
            label_a = int(min(1.0, (frame - BEATS[2] - 20) / 30.0) * 255 * prog)
            if label_a > 0:
                sub = "XPRIZE WILDFIRE  |  2022 to 2026  |  4 YEARS"
                d.text((W//2 - tw(sub, mono(22, m=True))//2, 780),
                       sub, font=mono(22, m=True), fill=_c(DIM) + (label_a,))
            # Progress bar (fills left to right as counter counts)
            bar_w = int(760 * p_seg)
            d.rectangle([(160, 826), (160 + bar_w, 834)], fill=_c(GOLD * prog))
            d.rectangle([(160, 826), (920, 834)], outline=_c(DIM * 0.5) + (100,))
    # Seg 8 (final): "TESTED HERE."
    if seg >= 8:
        prog = E.out_quint(min(1.0, (frame - BEATS[8]) / 60.0))
        a = int(prog * 255)
        if a > 0:
            headline = "TESTED HERE."
            subline  = "ALASKA SET THE STANDARD."
            hf = fr_font(88, wt=800)
            sf = fr_font(46, wt=600)
            hw = tw(headline, hf); sw2 = tw(subline, sf)
            cx = W // 2
            d.text((cx - hw//2, 820), headline, font=hf, fill=_c(GOLD * prog))
            d.text((cx - sw2//2, 930), subline, font=sf, fill=_c(WHITE * prog))

# ── Alaska.Ai watermark ──────────────────────────────────────────────────────
def draw_watermark(d, frame):
    f = mono(22, m=True)
    t_fade = max(0.0, (frame - NF + 60)) / 60.0
    base = 0.35 + 0.15 * math.sin(frame * 0.03)
    a = int(min(1.0, base + t_fade) * 200)
    label = "alaska.ai"
    d.text((W - tw(label, f) - 24, H - 42), label, font=f, fill=_c(DIM) + (a,))

# ── ACES + cinematic finish ──────────────────────────────────────────────────
def finish(u8, frame):
    f = u8.astype(np.float32) / 255.0
    # ACES Hill filmic
    a2, b2, c2, d2, e2 = 2.51, 0.03, 2.43, 0.59, 0.14
    g = np.clip((f * (a2*f + b2)) / (f * (c2*f + d2) + e2), 0, 1)
    # Split tone: cold shadows, warm highlights (override to thermal theme)
    lum = (0.2126*g[...,0] + 0.7152*g[...,1] + 0.0722*g[...,2])[...,None]
    sh = (1-lum)**2; hi = lum**2
    g = np.clip(g + (np.array([8, 14, 34])/255 - 0.5)*0.12*sh
                   + (np.array([255,145,60])/255 - 0.5)*0.07*hi, 0, 1)
    # Mild bloom (fast: downsample only, no gaussian_filter)
    lb = np.clip(lum[...,0] - 0.72, 0, 1) / 0.28
    sm = lb[::8, ::8]
    glow_sm = np.asarray(Image.fromarray((sm.clip(0,1)*255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.0
    g = 1 - (1-g) * (1 - np.clip(glow_sm[...,None] * np.array([1.0, 0.7, 0.5]) * 0.08, 0, 1))
    # Vignette (pre-computed)
    g = g * VIGNETTE[...,None]
    # Film grain (pre-computed bank, no per-frame gaussian)
    n = _GRAIN_BANK[frame % 30]
    g = g + (n * np.exp(-((lum[...,0] - 0.45)**2)/(2*0.28**2)) * (5/255.))[...,None]
    # Dither
    rng2 = np.random.default_rng((frame + 900) % 1800)
    g = np.clip(g + (rng2.random((H, W, 1)) + rng2.random((H, W, 1)) - 1) / 255., 0, 1)
    return (g * 255).astype(np.uint8)

# ── Fade in/out ──────────────────────────────────────────────────────────────
def apply_fade(u8, frame):
    fade_in  = 20
    fade_out = 40
    a = 1.0
    if frame < fade_in:
        a = frame / fade_in
    elif frame >= NF - fade_out:
        a = (NF - frame) / fade_out
    if a >= 1.0: return u8
    return (u8.astype(np.float32) * max(0.0, a)).astype(np.uint8)

# ── Render one frame ─────────────────────────────────────────────────────────
def render_frame(frame):
    # 1. Build thermal terrain
    hot_mask, hot_str = fire_hot_mask(frame)
    terrain_rgb = apply_thermal(TERRAIN, hot_mask, hot_str)   # HxWx3 uint8
    base = terrain_rgb.astype(np.float32)

    # Slight ambient darkening on non-fire pixels
    base = base * 0.72 + NAVY * 0.28

    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # 2. Scan grid
    draw_scan_grid(d, frame)
    # 3. Drone paths
    draw_drone_paths(d, frame)
    # 4. Detection circle
    draw_detection_circle(d, frame)
    # 5. Top HUD
    draw_top_hud(d, frame)
    # 6. Side panel
    draw_side_panel(d, frame)
    # 7. Data card
    draw_data_card(d, frame, CUES)
    # 8. Title card
    draw_title_card(d, frame)
    # 9. Captions
    draw_captions(d, frame, CUES)
    # 10. Watermark
    draw_watermark(d, frame)

    img = Image.alpha_composite(img, overlay).convert("RGB")
    u8 = np.asarray(img, np.uint8)
    u8 = finish(u8, frame)
    u8 = apply_fade(u8, frame)
    return u8

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    args = sys.argv[1:]
    if args and args[0] == "test":
        frames = [int(x) for x in args[1:]]
        print(f"TEST MODE: rendering {len(frames)} frames")
    elif len(args) == 2:
        frames = list(range(int(args[0]), int(args[1]) + 1))
        print(f"RANGE {args[0]}-{args[1]}: {len(frames)} frames")
    else:
        frames = list(range(NF))
        print(f"FULL RENDER: {NF} frames")

    for fi in frames:
        u8 = render_frame(fi)
        path = os.path.join(FR, f"frame_{fi:05d}.png")
        Image.fromarray(u8).save(path)
        if fi % 180 == 0:
            print(f"  frame {fi}/{NF-1}")
    print(f"Done. Wrote {len(frames)} frames to {FR}/")

if __name__ == "__main__":
    main()
