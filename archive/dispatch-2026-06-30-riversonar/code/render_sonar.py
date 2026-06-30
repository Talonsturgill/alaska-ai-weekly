"""
Alaska.Ai Dispatch — RIVER SONAR (2026-06-30). 9:16 1080x1920, 60s/1800f.

COMPOSITION (out/dispatch/storyboard.json, derived_from: scratch; passes scripts/storyboard_check.py):
the MACHINE'S POV — an imaging-sonar COUNTING SCREEN on the Kenai. A beam fan rises from a transducer at
bottom-center; salmon rise UP it as amber acoustic echoes, trip a COUNT LINE (live tally), then get boxed
and classified by computer vision; a season run-curve climbs toward an escapement goal; the machine
visibly MISSES one; the open/hold-the-nets call stays human. Register: instrument-readout. Color world:
amber echoes on abyssal black + cyan UI + a coral warning. Camera is LOCKED (a real readout does not
dolly) — motion comes from the rising run, the sweep, the reveals.

This is deliberately NOT the beluga (eye-level naturalistic scene, ONE hero swimming HORIZONTALLY,
centered + lower-third) and NOT the permafrost (cross-section split, vertical DESCENT). Shared CRAFT
(type, finish/grade, captions, outro, textlog) is IMPORTED from dispatch_core; the SCENE is authored here.
Scene events ride the VO's OWN beat map (dc.BEATS) so the picture and voice cannot drift apart.
  test:  python render_sonar.py test 60 200 470 560 700 860 1000 1200 1420 1640
  range: python render_sonar.py 0 1800
"""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter
from scipy.interpolate import PchipInterpolator
import easing as E, craft
import dispatch_core as dc
from dispatch_core import W, H, FPS, NF, fr, mono, tw, tk, finish, caption, outro_card

HERE = dc.HERE
FR = os.path.join(HERE, "frames_sonar"); os.makedirs(FR, exist_ok=True)

# ---- scene events ride the VO's own beats (so picture + voice can't drift) ----
B = dc.BEATS                      # [seg1..seg9] start frames
F_MODE = B[1]                     # "too gray to see -> watch with sound"
F_INSTR = B[2]                    # "a sonar since 2010, each fish a bright echo"
F_HAND = B[3]                     # "a person counted by hand"
F_AI = B[4]                       # "computer vision draws a box" (takeover)
F_SPECIES = B[5]                  # "tell a king from a sockeye by length"
F_NET = B[6]                      # "spreading to rivers, BC to Alaska"
F_MISS = B[7]                     # "the machine still misses"
F_DECIDE = B[8]                   # "that call is still ours"
SPEECH_F = int(dc.TIM["speech_end"] * FPS)

# ---- SHOT LIST (the MACRO rhythm): cut between FRAMINGS of the sonar display, riding the VO beats.
# A camera (crop+zoom over the composed display) gives each shot a distinct framing; the brand captions
# ride LOCKED on top. cam=(cx,cy,scale): scale 1.0 = full frame, <1.0 = pushed in, centered on (cx,cy frac).
SHOTS = [
    dict(id=1, start=0,       framing="wide-establish",  transition_in="fade-up",   cam=(0.50, 0.46, 1.00)),  # the whole display powers on
    dict(id=2, start=B[2],    framing="push-detail",     transition_in="push-in",   cam=(0.50, 0.43, 0.62)),  # into the COUNT LINE (sonar since 2010)
    dict(id=3, start=B[3],    framing="alt-vantage",     transition_in="hard-cut",  cam=(0.37, 0.30, 0.72)),  # the operator's reticle, upper beam (by hand)
    dict(id=4, start=B[4],    framing="wide-establish",  transition_in="hard-cut",  cam=(0.50, 0.47, 1.00)),  # AI boxes snap on — see the whole run
    dict(id=5, start=B[6],    framing="map-territory",   transition_in="mask-wipe", cam=(0.50, 0.36, 0.86)),  # the network spreads (BC to Alaska)
    dict(id=6, start=B[7],    framing="push-detail",     transition_in="hard-cut",  cam=(0.50, 0.36, 0.78)),  # THE MISS — push on the unboxed fish
    dict(id=7, start=B[8],    framing="data-panel",      transition_in="push-in",   cam=(0.50, 0.50, 0.70)),  # into the run-curve + the decision
    dict(id=8, start=1616,    framing="subject-portrait",transition_in="crossfade", cam=(0.50, 0.46, 1.00)),  # outro, pull back
]
def camera(f):
    """Which SHOT (framing) is on screen, as a crop (scale, cx, cy). Hard-cuts switch instantly; push-in /
    pull-out / crossfade / focus-pull animate from the previous shot's framing over ~16f. A slow continued
    push within each shot keeps the camera alive."""
    idx = 0
    for i, s in enumerate(SHOTS):
        if f >= s["start"]: idx = i
    cur = SHOTS[idx]; prev = SHOTS[idx - 1] if idx > 0 else None
    cx, cy, sc = cur["cam"]; t_in = f - cur["start"]
    sc = sc - 0.016 * E.out_cubic(min(1.0, t_in / 160.0))                 # slow continued push (living camera)
    cx = cx + math.sin(t_in * 0.016) * 0.006; cy = cy + math.cos(t_in * 0.013) * 0.005
    if prev is not None and cur.get("transition_in") in ("push-in", "pull-out", "crossfade", "focus-pull") and t_in < 16:
        a = E.in_out_sine(t_in / 16.0); pc = prev["cam"]                  # ease from the previous framing
        cx = pc[0] * (1 - a) + cx * a; cy = pc[1] * (1 - a) + cy * a; sc = pc[2] * (1 - a) + sc * a
    return float(max(0.45, min(1.0, sc))), float(cx), float(cy)

CUTS = [sh["start"] for sh in SHOTS[1:]]   # the frames where the shot changes
def scancut(out, f):
    """A brief 'sonar refresh' punctuation on each scene change: a bright scan band sweeps down + a quick
    luma pulse. Reads as the display re-acquiring when the view cuts — it makes the shot change UNMISTAKABLE
    (to the eye and to the SCENE_STRUCTURE gate), so cuts between framings of the same dark display land."""
    for b in CUTS:
        age = f - b
        if 0 <= age <= 6:
            p = age / 6.0; d = ImageDraw.Draw(out, "RGBA")
            yb = int(p * H); bh = 28
            d.rectangle([0, yb - bh, W, yb + bh], fill=(196, 234, 247, int(170 * (1 - p) ** 0.6)))   # bright scan band sweeps down
            pulse = int(48 * math.sin(min(1.0, p * 1.5) * math.pi))                                    # quick luma pulse, peaks early
            if pulse > 2: out.alpha_composite(Image.new("RGBA", (W, H), (120, 150, 168, pulse)))
            return

# ---- the scene's OWN color world ----
AMBER = (255, 176, 78); HOT = (255, 240, 206); ECHO_DIM = (150, 96, 52)
CYAN = (124, 210, 236); CYAN_D = (58, 120, 150)
GOLD = (255, 199, 44); CORAL = (255, 168, 138); INK = (226, 238, 250)   # coral lifted so warning text clears the brightness floor

# ---- beam geometry (fans UP from a transducer near the bottom) ----
TX, TY = W / 2.0, H - 24.0
HALF = math.radians(33.0); A_HALF = math.degrees(HALF)
RMAX = math.hypot(TX, TY) + 60
CL_Y = int(H * 0.43)                                       # the COUNT LINE
ARCS = [430, 760, 1090, 1420, 1740]; ARC_M = [5, 10, 15, 20, 25]

def beam_pt(theta, r):
    return (TX + math.sin(theta) * r, TY - math.cos(theta) * r)

_dx = dc._X - TX; _dy = dc._Y - TY
_R = np.sqrt(_dx * _dx + _dy * _dy); _ANG = np.arctan2(_dx, -_dy)
_INSIDE = (np.abs(_ANG) <= HALF) & (_dy < 0)
_ANGF = np.clip(np.cos(np.clip(_ANG / HALF, -1, 1) * (math.pi / 2)), 0, 1) ** 1.3
_BEAMG = (_INSIDE * _ANGF * np.clip(1 - _R / RMAX, 0, 1) ** 0.55).astype(np.float32)

def build_screen():
    """Static sonar display: abyssal water column + a DARK amber beam wash (so echoes pop) + arcs."""
    img = np.zeros((H, W, 3), np.float32)
    for y in range(H):
        t = y / (H - 1)
        img[y] = np.array([7, 12, 17]) * (1 - t) + np.array([3, 6, 9]) * t
    img += _BEAMG[..., None] * np.array([23, 15, 7], np.float32)            # beam wash — dim, so echoes pop and HUD labels keep contrast
    core = (np.exp(-(_R / (H * 0.42)) ** 2) * _INSIDE).astype(np.float32)
    img += core[..., None] * np.array([15, 9, 4], np.float32)
    img *= (0.965 + 0.035 * (0.5 + 0.5 * np.cos(dc._Y * (math.pi / 3.0))))[..., None]
    base = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(base, "RGBA")
    for rr in ARCS:
        d.arc([TX - rr, TY - rr, TX + rr, TY + rr], 270 - A_HALF, 270 + A_HALF, fill=(*CYAN_D, 55), width=1)
    for thed in (-HALF, HALF):
        d.line([beam_pt(thed, 40), beam_pt(thed, RMAX)], fill=(*CYAN_D, 60), width=1)
    return np.asarray(base.convert("RGB")).astype(np.float32)

# sonar PINGS — a bright pulse flares up the beam every ~2.2s. Each ping is a DISCRETE high-delta event
# (the EVENT_CADENCE gate is percentile-relative, so it needs distinct spikes, not constant motion) AND
# it is exactly what a live imaging sonar looks like. Pre-grade so the pulse blooms.
PINGS = list(range(40, 1722, 60))   # a pulse every ~2s, carried through to the outro
_PMASK = np.clip((1430.0 - dc._Y) / 120.0, 0.0, 1.0).astype(np.float32)   # pings fade out above the caption/outro band (keep text contrast)
def base_with_fx(f):
    arr = BASE
    boot = max(0.0, 1.0 - E.seg(f, 210, 320))
    if boot > 0.01:                                                  # cold-open 'power-on' lift + scanning ring
        rr = (f * 27.0) % (RMAX + 180); band = np.exp(-((_R - rr) / 105.0) ** 2)
        arr = np.clip(arr + ((_BEAMG * (0.42 + 1.35 * band)) * boot)[..., None] * np.array([64, 43, 19], np.float32), 0, 255)
    lift = None
    for pf in PINGS:                                                 # a bright pulse expanding up the cone
        age = f - pf
        if 0 <= age <= 16:
            rr = 50 + (age / 16.0) * (RMAX * 0.92); flare = (1 - age / 16.0) ** 0.7
            l = np.exp(-((_R - rr) / 78.0) ** 2) * _INSIDE * _PMASK * (0.9 * flare)
            lift = l if lift is None else lift + l
    if lift is not None:
        arr = np.clip(arr + lift[..., None] * np.array([66, 44, 20], np.float32), 0, 255)
    return arr

# ---- the fish echo (acoustic): a salmon silhouette, head UP, soft + hot-cored ----
def fish_echo(scale=1.0):
    s = 2; L = int(128 * scale); Wd = int(46 * scale); SW, SH = Wd * s, (L + 22) * s; cx = SW / 2.0
    t = np.linspace(0, 1, 200)
    wt = np.array([0, .07, .16, .30, .46, .60, .74, .87, .95, 1.0])
    wv = np.array([2.5, 7, 13, 20, 23, 22, 17, 11, 6, 3]) * scale * s
    half = PchipInterpolator(wt, wv)(t)
    top_y = 9 * s; bot_y = SH - 11 * s; ys = bot_y - t * (bot_y - top_y)
    pts = [(cx - half[i], ys[i]) for i in range(len(t))] + [(cx + half[i], ys[i]) for i in range(len(t) - 1, -1, -1)]
    mask = Image.new("L", (SW, SH), 0); md = ImageDraw.Draw(mask); md.polygon(pts, fill=255)
    ty = bot_y
    md.polygon([(cx - 3 * s, ty - 7 * s), (cx - 14 * s, ty + 7 * s), (cx - 4 * s, ty - 15 * s),
                (cx, ty - 9 * s), (cx + 4 * s, ty - 15 * s), (cx + 14 * s, ty + 7 * s), (cx + 3 * s, ty - 7 * s)], fill=255)
    md.polygon([(cx - 5 * s, ys[int(.5 * len(t))]), (cx - 17 * s, ys[int(.46 * len(t))] - 5 * s),
                (cx - 6 * s, ys[int(.40 * len(t))])], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(2.1 * s)); al = np.array(mask, np.float32) / 255.
    yy, xx = np.mgrid[0:SH, 0:SW].astype(np.float32); col = np.zeros((SH, SW, 3), np.float32); col[:] = AMBER
    cyk = ys[int(0.60 * len(t))]
    coreg = np.exp(-(((yy - cyk) / (22 * s)) ** 2 + ((xx - cx) / (13 * s)) ** 2))
    col = np.clip(col + (coreg[..., None] ** 0.8) * (np.array(HOT, np.float32) - np.array(AMBER, np.float32)), 0, 255)
    spr = Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8), "RGBA").resize((Wd, L + 22), Image.LANCZOS)
    a = np.array(spr); rgb = craft.add_texture(a[..., :3].astype(np.float32), a[..., 3].astype(np.float32) / 255., 9, 1.4, 2.0)
    return Image.fromarray(np.dstack([rgb, a[..., 3]]).astype(np.uint8), "RGBA")

def echo_glow(spr):
    al = np.array(spr)[..., 3].astype(np.float32); g = gaussian_filter(al, 5); g = (g / (g.max() + 1e-6) * 58).astype(np.uint8)
    c = np.zeros((*g.shape, 4), np.uint8); c[..., 0] = AMBER[0]; c[..., 1] = AMBER[1]; c[..., 2] = AMBER[2]; c[..., 3] = g
    return Image.fromarray(c, "RGBA")

KING = fish_echo(1.35); SOCK = fish_echo(0.86)
KING_G = echo_glow(KING); SOCK_G = echo_glow(SOCK)

# ---- the run: a deterministic stream of ~72 rising fish ----
_rng = np.random.default_rng(7)
FISH = []
for i in range(120):                                                      # a DENSE run -> continuous motion the whole way (EVENT_CADENCE)
    f0 = float(40 + i * 14.0 + _rng.uniform(-5, 5))                       # entries through ~f1706 so echoes stay dense to the very end
    spd = float(_rng.uniform(7.2, 11.6)); lane = float(_rng.uniform(-0.82, 0.82))
    king = _rng.random() < 0.32
    conf = float(_rng.uniform(0.86, 0.97) if king else _rng.uniform(0.80, 0.95))
    swayA = float(_rng.uniform(5, 13)); swayP = float(_rng.uniform(0, 6.28))
    f_cross = f0 + (TY - CL_Y) / spd
    FISH.append(dict(f0=f0, spd=spd, lane=lane, king=king, conf=conf, swayA=swayA, swayP=swayP, f_cross=f_cross, missed=False))
_miss = sorted([k for k in FISH if (F_MISS - 33) <= k["f_cross"] <= (F_MISS + 137)], key=lambda k: k["f_cross"])[:3]
for k in _miss:
    k["missed"] = True

GOAL = 1_000_000
def esc(f):
    return 250_000 + (0.905 * GOAL - 250_000) * E.in_out_sine(min(f, F_DECIDE) / float(F_DECIDE))

def fish_pos(k, f):
    age = f - k["f0"]
    if age < 0: return None
    y = TY - age * k["spd"]; dyk = max(1.0, TY - y); hw = dyk * math.tan(HALF)
    x = TX + k["lane"] * hw * 0.9 + k["swayA"] * math.sin(f * 0.05 + k["swayP"])
    return x, y, hw

def draw_run(img, f):
    vis = []
    for k in FISH:
        p = fish_pos(k, f)
        if p is None: continue
        x, y, hw = p
        if y < 30 or y > H + 120: continue                                 # gone once it exits the top
        vis.append((y, k, x))
    vis.sort(key=lambda t: t[0])
    for y, k, x in vis:
        spr = KING if k["king"] else SOCK; gl = KING_G if k["king"] else SOCK_G
        age = f - k["f0"]
        topf = E.seg(y, 40, 190)                                           # fade out as it nears the top edge (no "flame")
        a = E.out_cubic(min(1.0, age / 10.0)) * topf
        a = max(0.0, min(1.0, a))
        if a <= 0.02: continue
        px = int(x - spr.width / 2); py = int(y - spr.height / 2)
        def fade(im, aa):
            ar = np.array(im).copy(); ar[..., 3] = (ar[..., 3] * aa).astype(np.uint8); return Image.fromarray(ar, "RGBA")
        img.alpha_composite(fade(gl, a * 0.9), (px, py)); img.alpha_composite(fade(spr, a), (px, py))

# ---- post-grade UI helpers (crisp, after finish) ----
def _pill(d, x0, y0, x1, y1, a, fill=(4, 10, 16)):
    d.rounded_rectangle([x0, y0, x1, y1], 6, fill=(*fill, int(150 * a)))

def detbox(d, x, y, w, h, label, conf, a, col=CYAN):
    if a <= 0.02: return
    x, y, w, h = int(x), int(y), int(w), int(h); al = int(240 * a); k = int(max(11, min(w, h) * 0.24))
    for cx, cy, sx, sy in [(x, y, 1, 1), (x + w, y, -1, 1), (x, y + h, 1, -1), (x + w, y + h, -1, -1)]:
        d.line([(cx, cy), (cx + sx * k, cy)], fill=(*col, al), width=3); d.line([(cx, cy), (cx, cy + sy * k)], fill=(*col, al), width=3)
    if label:
        lf = mono(20, True); lw = tw(label, lf)
        _pill(d, x - 2, y - 34, x + lw + 6, y - 10, a); d.text((x + 2, y - 33), label, font=lf, fill=(*INK, al))
        dc.logw(x + 2, y - 33, lw, 20, INK, a, a >= 0.5, "hud")
    if conf:
        cf = mono(18, True); cw = tw(conf, cf)
        _pill(d, x + w - cw - 4, y + h + 4, x + w + 4, y + h + 26, a)
        ccol = AMBER if col == CYAN else INK
        d.text((x + w - cw, y + h + 6), conf, font=cf, fill=(*ccol, al))

def draw_missed(d, x, y, w, h, a):
    """A coral 'UNDETECTED' marker on the fish the machine misses — links the -25% flag to its cause."""
    if a <= 0.02: return
    x, y, w, h = int(x), int(y), int(w), int(h); al = int(235 * a); c = (*CORAL, al); k = int(max(9, min(w, h) * 0.2))
    for cx, cy, sx, sy in [(x, y, 1, 1), (x + w, y, -1, 1), (x, y + h, 1, -1), (x + w, y + h, -1, -1)]:
        d.line([(cx, cy), (cx + sx * k, cy)], fill=c, width=2); d.line([(cx, cy), (cx, cy + sy * k)], fill=c, width=2)
    lf = mono(18, True); lw = tw("UNDETECTED", lf)
    _pill(d, x - 2, y - 26, x + lw + 6, y - 3, a, fill=(40, 10, 6)); d.text((x + 2, y - 25), "UNDETECTED", font=lf, fill=c)
    dc.logw(x + 2, y - 25, lw, 18, CORAL, a, a >= 0.5, "hud")

def draw_boxes(d, f):
    intro = E.out_cubic(E.seg(f, F_AI, F_AI + 58))
    if intro <= 0.02: return
    show_species = E.out_cubic(E.seg(f, F_SPECIES, F_SPECIES + 60))
    dim = 1.0 - 0.45 * E.out_cubic(E.seg(f, F_DECIDE + 12, F_DECIDE + 86))   # AI recedes at the human-decision beat (but stays alive = motion)
    dim *= 1.0 - 0.12 * (E.seg(f, F_NET, F_NET + 46) * (1 - E.seg(f, F_MISS - 50, F_MISS - 10)))
    for k in FISH:
        p = fish_pos(k, f)
        if p is None: continue
        x, y, hw = p
        if y < 180 or y > CL_Y + 40: continue                            # box the darker upper beam (labels keep contrast)
        if k["missed"] and (F_MISS - 33) <= f <= (F_MISS + 147):            # THE MISS: mark it, don't box it
            spr = KING if k["king"] else SOCK; bw, bh = spr.width * 0.98, spr.height * 0.88
            draw_missed(d, x - bw / 2, y - bh / 2, bw, bh, intro * dim * (0.6 + 0.4 * math.sin(f * 0.5)))
            continue
        spr = KING if k["king"] else SOCK; bw, bh = spr.width * 0.92, spr.height * 0.82
        lab = ("KING" if k["king"] else "SOCKEYE") if show_species > 0.5 else ""
        cf = k["conf"]
        if k["missed"] and f >= (F_MISS + 27): cf = 0.71 if (f // 6) % 2 else 0.79
        detbox(d, x - bw / 2, y - bh / 2, bw, bh, lab, f"{cf:.2f}", intro * dim)

_ret = sorted([k for k in FISH if F_HAND <= k["f_cross"] <= (F_AI + 58)], key=lambda k: k["f_cross"])[:4]
def draw_reticle(d, f):
    a = E.out_cubic(E.seg(f, F_HAND, F_HAND + 40)) * (1.0 - E.seg(f, F_AI - 14, F_AI + 12))
    if a <= 0.02 or not _ret: return
    step = max(1, (F_AI - F_HAND) // len(_ret))
    seg = max(0, min(len(_ret) - 1, int((f - F_HAND) / step)))
    k = _ret[seg]; p = fish_pos(k, f)
    if p is None: return
    tx, ty = p[0], p[1]; loc = E.out_cubic(min(1.0, ((f - F_HAND) % step) / 16.0))
    r = 34 - 6 * loc; al = int(235 * a)
    d.ellipse([tx - r, ty - r, tx + r, ty + r], outline=(*CYAN, al), width=2)
    for ang in (0, 90, 180, 270):
        ex = tx + math.cos(math.radians(ang)) * r; ey = ty + math.sin(math.radians(ang)) * r
        ix = tx + math.cos(math.radians(ang)) * (r - 9); iy = ty + math.sin(math.radians(ang)) * (r - 9)
        d.line([(ix, iy), (ex, ey)], fill=(*CYAN, al), width=2)
    if loc > 0.6:
        _pill(d, tx + r + 4, ty - 12, tx + r + 96, ty + 12, a)
        d.text((tx + r + 9, ty - 10), "+1  BY HAND", font=mono(15, True), fill=(*CYAN, al))

def draw_countline(d, f):
    a = E.out_cubic(E.seg(f, 60, 120))
    if a <= 0.02: return
    pulse = 0.5 + 0.5 * math.sin(f * 0.16); xl, xr = 96, W - 96
    d.line([(xl, CL_Y), (xr, CL_Y)], fill=(*CYAN, int((120 + 70 * pulse) * a)), width=2)
    lf = mono(16, True); _pill(d, xl, CL_Y - 26, xl + tw("COUNT LINE", lf) + 8, CL_Y - 4, a)
    d.text((xl + 4, CL_Y - 25), "COUNT LINE", font=lf, fill=(*CYAN, int(220 * a)))
    dc.logw(xl + 4, CL_Y - 25, tw("COUNT LINE", lf), 16, CYAN, a, a >= 0.5, "hud")
    for k in FISH:
        if k["missed"]: continue
        if abs(f - k["f_cross"]) <= 7:
            p = fish_pos(k, f)
            if p is None: continue
            fa = (1 - abs(f - k["f_cross"]) / 7.0) * a; rr = 8 + (1 - fa) * 26
            d.ellipse([p[0] - rr, CL_Y - rr, p[0] + rr, CL_Y + rr], outline=(*GOLD, int(220 * fa)), width=2)
            d.text((p[0] + 12, CL_Y - 26), "+1", font=mono(18, True), fill=(*GOLD, int(235 * fa)))

def draw_sweep(d, f):
    phase = (f % 96) / 96.0; rr = 120 + phase * (RMAX - 120); al = int(120 * (1 - phase) ** 1.3)
    if al > 4:
        d.arc([TX - rr, TY - rr, TX + rr, TY + rr], 270 - A_HALF, 270 + A_HALF, fill=(*CYAN, al), width=2)

def draw_range_labels(d, f):
    a = E.out_cubic(E.seg(f, F_INSTR + 3, F_INSTR + 63))
    if a <= 0.02: return
    for rr, m in zip(ARCS, ARC_M):
        px, py = beam_pt(HALF, rr)
        if py < 120: continue
        d.text((px + 8, py - 9), f"{m} m", font=mono(15, m=True), fill=(*CYAN_D, int(200 * a)))

def draw_tally(d, f):
    a = E.out_cubic(E.seg(f, 70, 130))
    if a <= 0.02: return
    n = int(round(esc(f))); s = f"{n:,}"; nf = fr(86, 900, 144); nx = W - 96 - tw(s, nf); ny = 150
    tk(d, s, nf, (*GOLD, int(240 * a)), nx, ny); dc.logw(nx, ny, tw(s, nf), nf.size, GOLD, a, a >= 0.6, "count")
    lab = "ESCAPEMENT  ·  season, est."; lf = mono(16, m=True); lw = tw(lab, lf, 0.04)
    tk(d, lab, lf, (*INK, int(195 * a)), W - 96 - lw, ny + 98, 0.04); dc.logw(W - 96 - lw, ny + 98, lw, 16, INK, a, a >= 0.6, "label")
    em = E.out_cubic(E.seg(f, F_MISS + 11, F_MISS + 45)) * (1 - E.seg(f, F_MISS + 147, F_DECIDE))
    if em > 0.02:
        s2 = "≈ 23%  ERROR"; mf = mono(22, True); mw = tw(s2, mf)
        _pill(d, W - 96 - mw - 6, ny + 124, W - 90, ny + 156, em, fill=(40, 10, 6))
        d.text((W - 96 - mw, ny + 126), s2, font=mf, fill=(*CORAL, int(235 * em))); dc.logw(W - 96 - mw, ny + 126, mw, 22, CORAL, em, em >= 0.5, "hud")

def runcurve(d, f):
    a = E.out_cubic(E.seg(f, F_INSTR + 3, F_INSTR + 65))
    if a <= 0.02: return
    big = E.out_cubic(E.seg(f, F_DECIDE - 82, F_DECIDE - 14))
    gw = int(300 + big * 250); gh = int(150 + big * 150)
    gx = int((W - 96 - gw) * (1 - big) + (W - gw) / 2 * big); gy = int(300 + big * 250)
    _pill(d, gx - 12, gy - 30, gx + gw + 12, gy + gh + 16, a * (0.6 + 0.4 * big), fill=(6, 12, 18))
    d.text((gx, gy - 26), "RUN  vs  ESCAPEMENT GOAL", font=mono(15, True), fill=(*CYAN, int(210 * a)))
    dc.logw(gx, gy - 26, tw("RUN  vs  ESCAPEMENT GOAL", mono(15, True)), 15, CYAN, a, a >= 0.5 and big > 0.3, "hud")
    gyl = gy + int(gh * 0.16)
    for xx in range(gx, gx + gw, 16):
        d.line([(xx, gyl), (xx + 9, gyl)], fill=(*GOLD, int(180 * a)), width=2)
    if big > 0.3:
        d.text((gx + gw - 92, gyl - 20), "GOAL", font=mono(15, True), fill=(*GOLD, int(220 * a)))
    N = 60; pts = []
    for i in range(N + 1):
        ff = f * i / N; pts.append((gx + gw * i / N, gy + gh * (1 - esc(ff) / GOAL)))
    if len(pts) > 1:
        d.line(pts, fill=(*AMBER, int(235 * a)), width=3, joint="curve")
        d.ellipse([pts[-1][0] - 4, pts[-1][1] - 4, pts[-1][0] + 4, pts[-1][1] + 4], fill=(*HOT, int(240 * a)))

def draw_decision(d, f):
    a = E.out_cubic(E.seg(f, F_DECIDE + 12, F_DECIDE + 66)) * (1 - E.seg(f, SPEECH_F - 6, SPEECH_F + 22))
    if a <= 0.02: return
    q = "HOW MANY BEFORE THE NETS OPEN?"; qf = fr(46, 800, 144); qw = tw(q, qf, 0.0); qx = (W - qw) // 2; qy = 982
    _pill(d, qx - 18, qy - 8, qx + qw + 18, qy + 58, a, fill=(5, 11, 17))
    tk(d, q, qf, (*INK, int(245 * a)), qx, qy, 0.0); dc.logw(qx, qy, qw, qf.size, INK, a, a >= 0.6, "thesis")
    tgy = qy + 96; bw = 150; ox = W // 2 - bw - 8; hx = W // 2 + 8
    d.rounded_rectangle([ox, tgy, ox + bw, tgy + 46], 8, outline=(*CYAN_D, int(175 * a)), width=2)
    d.text((ox + 44, tgy + 10), "OPEN", font=mono(22, True), fill=(*CYAN_D, int(195 * a)))
    d.rounded_rectangle([hx, tgy, hx + bw, tgy + 46], 8, fill=(*GOLD, int(28 * a)), outline=(*GOLD, int(248 * a)), width=3)
    d.text((hx + 46, tgy + 10), "HOLD", font=mono(22, True), fill=(*GOLD, int(250 * a)))
    dc.logw(hx + 46, tgy + 10, tw("HOLD", mono(22, True)), 22, GOLD, a, a >= 0.6, "hud")
    ht = "HUMAN CALL"; hf = mono(16, True); hw2 = tw(ht, hf, 0.1)
    tk(d, ht, hf, (*GOLD, int(225 * a)), (W - hw2) // 2, tgy + 56, 0.1); dc.logw((W - hw2) // 2, tgy + 56, hw2, 16, GOLD, a, a >= 0.6, "hud")

def draw_network(img, d, f):
    a = E.seg(f, F_NET, F_NET + 58) * (1 - E.seg(f, F_MISS - 35, F_MISS)); a = max(0.0, min(1.0, a))
    if a <= 0.02: return
    img.alpha_composite(Image.new("RGBA", (W, H), (2, 5, 8, int(34 * a))))   # barely dim — keep the run bright (motion) under the grid
    cols, rows = 8, 2; cw, ch = 150, 96; gapx, gapy = 16, 18
    tot_w = cols * cw + (cols - 1) * gapx; x0 = (W - tot_w) // 2; y0 = 560
    n_lit = int(E.out_cubic(min(1.0, (f - F_NET) / 150.0)) * 16); idx = 0
    for r in range(rows):
        for c in range(cols):
            bx = x0 + c * (cw + gapx); by = y0 + r * (ch + gapy)
            lit = idx < n_lit; col = CYAN if lit else CYAN_D; aa = a * (1.0 if lit else 0.5)
            d.rounded_rectangle([bx, by, bx + cw, by + ch], 6, outline=(*col, int(210 * aa)), width=2)
            mtx, mty = bx + cw / 2, by + ch - 10
            for th in (-0.5, 0.5):
                d.line([(mtx, mty), (mtx + math.sin(th) * ch * 0.8, mty - math.cos(th) * ch * 0.8)], fill=(*col, int(120 * aa)), width=1)
            if lit:
                d.ellipse([mtx - 3, by + ch * 0.4, mtx + 3, by + ch * 0.4 + 6], fill=(*AMBER, int(220 * aa)))
            idx += 1
    s = "RIVERS  ·  BC TO ALASKA  ·  500K+ LABELED FRAMES"; sf = mono(22, True); sw = tw(s, sf, 0.02)
    tk(d, s, sf, (*INK, int(235 * a)), (W - sw) // 2, y0 - 50, 0.02); dc.logw((W - sw) // 2, y0 - 50, sw, sf.size, INK, a, a >= 0.6, "hud")

def murk_alpha(f):
    return max(0.0, min(1.0, E.seg(f, F_MODE, F_MODE + 38) * (1 - E.seg(f, F_MODE + 107, F_INSTR - 7))))

def draw_murk(d, f):
    """Beat 2 'too gray to see' — a translucent gray haze + a dimming sun-disc (its OWN scene layer)."""
    a = murk_alpha(f)
    if a <= 0.02: return
    d.rectangle([0, 0, W, H], fill=(86, 90, 84, int(60 * a)))
    sun_y = int(150 + 70 * (1 - a)); d.ellipse([W / 2 - 50, sun_y - 50, W / 2 + 50, sun_y + 50], fill=(170, 168, 138, int(88 * a)))

def draw_sonar_stamp(d, f):
    md = E.out_cubic(E.seg(f, F_MODE + 35, F_MODE + 95)) * (1 - E.seg(f, F_INSTR - 7, F_INSTR + 43))
    if md > 0.02:
        s = "SONAR"; sf = mono(20, True); _pill(d, 96, 116, 96 + tw(s, sf) + 12, 144, md)
        d.text((102, 118), s, font=sf, fill=(*AMBER, int(235 * md)))

def draw_estamp(d, f):
    a = E.out_cubic(E.seg(f, F_INSTR + 3, F_INSTR + 65)) * (1 - E.seg(f, F_HAND - 9, F_HAND + 31))
    if a <= 0.02: return
    s = "ARIS  ·  KENAI RIVER  ·  imaging sonar since 2010"; sf = mono(17, m=True)
    tk(d, s, sf, (*CYAN, int(210 * a)), 96, 470, 0.0); dc.logw(96, 470, tw(s, sf), 17, CYAN, a, a >= 0.6, "hud")

def draw_transducer(d, f):
    """A small device housing + pulsing emitter at the beam origin — names the source as hardware."""
    a = E.out_cubic(E.seg(f, 18, 64))
    if a <= 0.02: return
    d.rounded_rectangle([TX - 27, TY - 11, TX + 27, TY + 12], 4, fill=(10, 16, 22, int(205 * a)), outline=(*CYAN, int(205 * a)), width=2)
    pulse = 0.5 + 0.5 * math.sin(f * 0.3)
    d.ellipse([TX - 5, TY - 4, TX + 5, TY + 6], fill=(*AMBER, int((150 + 95 * pulse) * a)))

def hud_backing(out, f):
    """Dark chips behind every TARGET HUD label, drawn INTO the scene (pre-grade) so the readability
    gate measures the real backed contrast the viewer sees — not the bare beam/fish behind the chip.
    Mirrors the label positions in the draw_* functions."""
    bd = ImageDraw.Draw(out, "RGBA"); DK = (4, 9, 14, 232)
    def rk(x0, y0, x1, y1): bd.rounded_rectangle([int(x0), int(y0), int(max(x1, x0 + 2)), int(y1)], 5, fill=DK)
    if E.seg(f, 8, 34) > 0.3: rk(90, 66, 402, 98)                                        # eyebrow
    if E.seg(f, 70, 130) > 0.3:                                                          # tally + label
        nf = fr(86, 900, 144); rk(W - 96 - tw(f"{int(round(esc(f))):,}", nf) - 4, 146, W - 80, 270)
    if E.seg(f, 60, 120) > 0.3: rk(94, CL_Y - 29, 216, CL_Y - 2)                         # COUNT LINE
    if 40 <= f < 1600:                                                                   # bottom chrome
        rk(90, 1368, 266, 1394); lv = f"LIVE  ▸  00:{int(f / FPS):02d}"; rk(W - 96 - tw(lv, mono(16, m=True), 0.02) - 8, 1368, W - 86, 1394)
    if E.seg(f, F_INSTR + 3, F_INSTR + 65) > 0.3 and E.seg(f, F_HAND - 9, F_HAND + 31) < 0.7:
        rk(92, 465, 104 + tw("ARIS  ·  KENAI RIVER  ·  imaging sonar since 2010", mono(17, m=True)), 492)  # estamp
    if E.seg(f, F_INSTR + 3, F_INSTR + 65) > 0.3:                                        # run-curve header (+GOAL)
        big = E.out_cubic(E.seg(f, F_DECIDE - 82, F_DECIDE - 14)); gw = int(300 + big * 250); gh = int(150 + big * 150)
        gx = int((W - 96 - gw) * (1 - big) + (W - gw) / 2 * big); gy = int(300 + big * 250)
        rk(gx - 4, gy - 29, gx + tw("RUN  vs  ESCAPEMENT GOAL", mono(15, True)) + 6, gy - 5)
        if big > 0.3: rk(gx + gw - 98, gy + int(gh * 0.16) - 22, gx + gw - 38, gy + int(gh * 0.16) + 2)
    if E.seg(f, F_NET, F_NET + 58) > 0.3 and E.seg(f, F_MISS - 35, F_MISS) < 0.7:        # network label
        sw = tw("RIVERS  ·  BC TO ALASKA  ·  500K+ LABELED FRAMES", mono(22, True), 0.02); rk((W - sw) // 2 - 8, 506, (W + sw) // 2 + 8, 540)
    if E.seg(f, F_DECIDE + 12, F_DECIDE + 66) > 0.3 and E.seg(f, SPEECH_F - 6, SPEECH_F + 22) < 0.7:
        qw = tw("HOW MANY BEFORE THE NETS OPEN?", fr(46, 800, 144)); qx = (W - qw) // 2
        rk(qx - 20, 972, qx + qw + 20, 1042); rk(W // 2 - 170, 1076, W // 2 + 170, 1126)  # question + toggle
        hw2 = tw("HUMAN CALL", mono(16, True), 0.1); rk((W - hw2) // 2 - 6, 1132, (W + hw2) // 2 + 6, 1160)
    if f >= F_AI:                                                                        # dynamic box + missed labels
        miss_on = (F_MISS - 33) <= f <= (F_MISS + 147); spec_on = E.seg(f, F_SPECIES, F_SPECIES + 60) > 0.5
        for k in FISH:
            p = fish_pos(k, f)
            if p is None: continue
            x, y, hw = p
            if y < 180 or y > CL_Y + 40: continue
            spr = KING if k["king"] else SOCK; bw, bh = spr.width * 0.92, spr.height * 0.82
            if k["missed"] and miss_on:
                bw2, bh2 = spr.width * 0.98, spr.height * 0.88; rk(x - bw2 / 2 - 2, y - bh2 / 2 - 28, x - bw2 / 2 + 118, y - bh2 / 2 - 4)
            elif spec_on:
                lab = "KING" if k["king"] else "SOCKEYE"; rk(x - bw / 2 - 2, y - bh / 2 - 36, x - bw / 2 + tw(lab, mono(20, True)) + 8, y - bh / 2 - 10)

def render_display(f):
    """The SONAR DISPLAY — everything the camera frames (scene + instrument HUD). NO captions / outro /
    footer / scrim / fades; those ride LOCKED on top AFTER the camera in render_frame. Returns full-res RGBA."""
    img = Image.fromarray(base_with_fx(f).astype(np.uint8)).convert("RGBA")
    draw_run(img, f)
    draw_network(img, ImageDraw.Draw(img, "RGBA"), f)
    out = Image.fromarray(finish(np.asarray(img.convert("RGB")), 4000 + f))
    out = out.filter(ImageFilter.UnsharpMask(radius=2.4, percent=92, threshold=2)).convert("RGBA")
    if murk_alpha(f) > 0.02:                                              # scene-atmosphere blends with the grade
        mlay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); draw_murk(ImageDraw.Draw(mlay, "RGBA"), f)
        out = Image.alpha_composite(out, mlay)
    hud_backing(out, f)                            # dark chips behind the instrument labels, INTO the bg luma (real contrast)
    dc.set_frame_bg(out, f, clear=True)            # capture bg for the INSTRUMENT-label logw (pass 1 of 2)
    ui = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ui, "RGBA")
    eb = E.out_cubic(E.seg(f, 8, 34))
    if eb > 0:
        tk(d, "ALASKA.AI", mono(18, True), (255, 222, 120, int(220 * eb)), 96, 70, 0.14)
        tk(d, "/  RIVER SONAR", mono(18), (*CYAN, int(160 * eb)), 96 + tw("ALASKA.AI", mono(18, True), .14) + 16, 70, 0.14)
    draw_sweep(d, f); draw_range_labels(d, f); draw_sonar_stamp(d, f); draw_estamp(d, f)
    draw_transducer(d, f)
    draw_countline(d, f); draw_reticle(d, f); draw_boxes(d, f); runcurve(d, f)
    draw_tally(d, f); draw_decision(d, f)
    cl = E.out_cubic(E.seg(f, 40, 90))
    if cl > 0 and f < 1600:
        tk(d, "ARIS · KENAI", mono(16, m=True), (*CYAN, int(170 * cl)), 96, 1372, 0.02)
        lv = f"LIVE  ▸  00:{int(f / FPS):02d}"; lf = mono(16, m=True)
        tk(d, lv, lf, (*AMBER, int(180 * cl)), W - 96 - tw(lv, lf, 0.02), 1372, 0.02)
    return Image.alpha_composite(out, ui)

def render_frame(f):
    display = render_display(f)
    sc, cx, cy = camera(f)
    framed = dc.reframe(display, cx, cy, sc) if sc < 0.999 else display   # the SHOT framing (camera crop+zoom)
    # ---- LOCKED brand layer ON TOP of the camera (always full-frame + razor-sharp): scrim + captions + outro + footer ----
    framed = Image.alpha_composite(framed, SCRIM_IMG)
    dc.set_frame_bg(framed, f, clear=False)        # update bg for the CAPTION logw (pass 2 of 2; keep instrument log)
    lui = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lui, "RGBA")
    so = E.out_cubic(E.seg(f, 8, 34)); endb = E.out_cubic(E.seg(f, 1560, 1640))
    if so > 0 and f < 1600:
        sf = fr(38, 900, 144); tk(ld, "alaska.ai", sf, (255, 255, 255, int((140 + 95 * endb) * so)), (W - tw("alaska.ai", sf)) // 2, 1700)
    caption(lui, f); outro_card(lui, f)
    framed = Image.alpha_composite(framed, lui)
    scancut(framed, f)                             # transition punctuation on each scene change (topmost)
    fin = E.seg(f, 0, 14)
    if fin < 1: framed.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - E.out_cubic(fin))))))
    outf = E.seg(f, 1748, 1800)                    # short, late fade so the scene stays live almost to the final frame
    if outf > 0: framed.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(248 * E.in_out_sine(outf)))))
    dc.flush_textlog(f)
    return framed.convert("RGB")

print("precompute sonar screen...", file=sys.stderr)
BASE = build_screen()
# lower-third scrim — a soft dark gradient under the caption + outro band so text always clears the
# contrast floor (READABILITY gate). Composited before BGLUMA capture so the measured contrast is honest.
_scrim_prof = np.clip(160.0 * np.exp(-((np.arange(H, dtype=np.float32) - 1500.0) / 150.0) ** 2), 0, 255).astype(np.uint8)
SCRIM = np.zeros((H, W, 4), np.uint8); SCRIM[..., 0] = 4; SCRIM[..., 1] = 8; SCRIM[..., 2] = 12; SCRIM[..., 3] = _scrim_prof[:, None]
SCRIM_IMG = Image.fromarray(SCRIM, "RGBA")

def _emit_shots():
    """Write shots.json — the SHOT MANIFEST the SCENE_STRUCTURE gate verifies (each shot's end = next start)."""
    sl = [{"id": sh["id"], "start": sh["start"], "end": (SHOTS[i + 1]["start"] if i + 1 < len(SHOTS) else NF),
           "framing": sh["framing"], "transition_in": sh["transition_in"]} for i, sh in enumerate(SHOTS)]
    dc.write_shots(sl, NF); return sl

def main():
    a = sys.argv[1:]
    if a and a[0] == "test":
        _emit_shots()
        td = os.path.join(HERE, "test_sonar"); os.makedirs(td, exist_ok=True)
        for f in [int(x) for x in a[1:]]:
            render_frame(f).save(os.path.join(td, f"t_{f:05d}.png")); print("test", f, file=sys.stderr)
        return
    s, e = int(a[0]), int(a[1])
    if s == 0: _emit_shots()                       # write the manifest once (the first parallel chunk)
    for f in range(s, e):
        render_frame(f).save(os.path.join(FR, f"frame_{f:05d}.png"))
        if f % 50 == 0: print("frame", f, file=sys.stderr)
    print("done", file=sys.stderr)

if __name__ == "__main__":
    main()
