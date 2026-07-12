"""render_thefake.py — 'THE FAKE THAT SWAM' (2026-07-12 Dispatch), authored FRESH to the board.

The AI-generated beluga-escape hoax at the Alaska SeaLife Center. Built in the DIMENSIONAL engine
(dimensional.py): five time-gated 3D worlds sharing a low-poly beluga, with dispatch_core brand
chrome (counter, detector readout, correction facts, kinetic captions, wordmark) composited over.

Worlds (frames @30fps):
  S1  0-306    THE REAL      beluga surfaces from a glass silhouette in her tank; camera orbit-reveal
  S2  306-627  THE FEED      the image on a phone slab in a dark void; view-counter climbs to ~6,000,000
  S3  627-990  THE FAKE      the beluga at macro sheds voxel pixels; DETECTOR settles 82.6% LIKELY AI
  S4  990-1365 THE CORRECTION dark grid; SINCE 1998 / 0 ESCAPES plates + red THIS NEVER HAPPENED stamp
  S5  1365-1800 RESTORED     back to the real tank at rest; wordmark resolves; loop-back to S1

Env: DIM_SCALE (0.4 look-dev, 1.0 ship), DISPATCH_OUT (frames dir), DISPATCH_TEXTLOG=1 (readability).
Usage: python render_thefake.py <start> <end>   (one process over the whole range for ship)
"""
import os, sys, math, json
import numpy as np
import taichi as ti

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".claude", "skills", "alaska-dispatch"))
sys.path.insert(0, SKILL)
import dimensional as dim
import dispatch_core as dc
from PIL import Image, ImageDraw
import easing as E

FPS = 30
NF = 1800
OUT = os.environ.get("DISPATCH_OUT") or os.path.join(HERE, "..", "frames_v3")
os.makedirs(OUT, exist_ok=True)
SCALE = float(os.environ.get("DIM_SCALE", "1.0"))

# shot boundaries in frames (VO-aligned)
S = [0, 306, 627, 990, 1365, 1800]
def shot_of(f):
    for i in range(5):
        if S[i] <= f < S[i + 1]:
            return i
    return 4

# ---------------- palette / light (night-practical: lit from within) ----------------
dim.SUN_DIR = (0.35, 0.72, 0.55)          # soft overhead-ish key (a tank toplight)
dim.SUN_COL = (1.15, 1.02, 0.86)
dim.SKY_COL = (0.05, 0.13, 0.16)          # deep aquarium teal ambient
dim.SKY_HI = (0.10, 0.22, 0.28)
dim.FOG_DEN = 0.028
dim.FOG_COL = (0.03, 0.10, 0.13)
dim.RIM_STR = 0.75

# init Taichi FIRST (allocates the G-buffer + lets us declare control fields below)
dim.init(1080, 1920, scale=SCALE)

# ---------------- shared low-poly beluga SDF ----------------
@ti.func
def sd_beluga(p, t, swim, seed):
    # p is already in the beluga's local frame. swim>0 adds tail sway + gentle bob.
    q = ti.Vector([p.x, p.y, p.z])
    # tail sway: phase-lagged along the body (z from head +0.9 to tail -0.9)
    sway = swim * 0.12 * ti.sin(t * 1.6 + q.z * 1.3 + seed)
    q.x -= sway * ti.math.clamp(-q.z, 0.0, 1.0)
    body = dim.sd_ellipsoid(q, ti.Vector([0.0, 0.0, 0.0]), ti.Vector([0.34, 0.32, 0.95]))
    melon = dim.sd_sphere(q, ti.Vector([0.0, 0.06, 0.86]), 0.30)
    d = dim.smin(body, melon, 0.18)
    # fluke (flattened, at the tail)
    fl = dim.sd_ellipsoid(ti.Vector([q.x, q.y, q.z]), ti.Vector([0.0, 0.0, -1.02]), ti.Vector([0.30, 0.05, 0.16]))
    d = dim.smin(d, fl, 0.10)
    # two pectoral fins
    pf1 = dim.sd_ellipsoid(q, ti.Vector([0.30, -0.14, 0.28]), ti.Vector([0.16, 0.04, 0.11]))
    pf2 = dim.sd_ellipsoid(q, ti.Vector([-0.30, -0.14, 0.28]), ti.Vector([0.16, 0.04, 0.11]))
    d = dim.smin(d, ti.min(pf1, pf2), 0.08)
    return d

@ti.func
def beluga_world_pos(p, cx, cy, cz, scl):
    return ti.Vector([(p.x - cx) / scl, (p.y - cy) / scl, (p.z - cz) / scl])

# dissolve amount for S3 (0 -> 1 across the shot); set per-frame via module global
DISSOLVE = ti.field(ti.f32, shape=())
CTX = ti.field(ti.f32, shape=())     # which world (0..4) as float
RISE = ti.field(ti.f32, shape=())    # S4 grid rise 0..1

@ti.func
def sd_tank(p, t):
    # tank interior: back wall, floor, faint side — gives real depth recession
    back = 7.5 - p.z
    floor = p.y + 2.1 + 0.06 * dim.fbm2(p.x * 0.6, p.z * 0.6)
    d = ti.min(back, floor)
    return d

@ti.func
def _scene(p, t):
    c = CTX[None]
    d = 1e9
    if c < 0.5:                                   # S1 THE REAL (tank + beluga)
        d = sd_tank(p, t)
        bp = beluga_world_pos(p, 0.0, 0.05 + 0.05 * ti.sin(t * 0.9), 2.6, 1.0)
        d = ti.min(d, sd_beluga(bp, t, 1.0, 0.0))
    elif c < 1.5:                                 # S2 THE FEED (dark room; the phone is PIL chrome)
        d = sd_tank(p, t)                          # enclosure (back wall + floor) -> real depth
        # a faint receding light-rail on the floor for texture + parallax
        gp = dim.op_rep2(ti.Vector([p.x, p.y + 2.05, p.z]), 1.2)
        rail = dim.sd_box(gp, ti.Vector([0.0, 0.0, 0.0]), ti.Vector([0.015, 0.015, 0.6]))
        d = ti.min(d, rail)
        # NEAR-FIELD depth: two floating slabs close to the lens at the frame edges (defocused
        # foreground bokeh) so the depth buffer spans near->far, not just the back wall
        f1 = dim.sd_rbox(p, ti.Vector([-1.35, 0.5 + 0.06 * ti.sin(t * 0.8), 0.55]), ti.Vector([0.30, 0.42, 0.03]), 0.03)
        f2 = dim.sd_rbox(p, ti.Vector([1.4, -0.15 + 0.05 * ti.sin(t * 0.6 + 2.0), 0.8]), ti.Vector([0.26, 0.36, 0.03]), 0.03)
        d = ti.min(d, ti.min(f1, f2))
    elif c < 2.5:                                 # S3 THE FAKE (3/4 profile whale; tail sheds voxel cubes)
        diss = DISSOLVE[None]
        d = sd_tank(p, t)                          # dark enclosure -> depth + backdrop
        bp = beluga_world_pos(p, 0.0, 0.0, 2.6, 1.15)
        whale = sd_beluga(bp, t, 0.45, 1.7)        # RECOGNIZABLE beluga in profile
        d = ti.min(d, whale)
        # the TAIL dissolves into distinct voxel cubes: gated to a sphere around the tail, growing +
        # drifting with dissolve so a muted viewer reads "the fake breaking into pixels"
        tailr = (ti.Vector([p.x, p.y, p.z - 1.75])).norm()
        near_tail = ti.math.clamp(1.0 - tailr / 1.5, 0.0, 1.0)
        vp = ti.Vector([p.x - 0.3 * diss, p.y - 0.3 * diss, p.z])
        rep = dim.op_rep2(vp, 0.4)
        cube = dim.sd_box(rep, ti.Vector([0.0, 0.0, 0.0]), ti.Vector([0.10, 0.10, 0.10]))
        cube += (1.0 - near_tail * diss) * 30.0
        d = ti.min(d, cube)
    elif c < 3.5:                                 # S4 THE CORRECTION (dark room; a low fact-monolith rises)
        r = RISE[None]
        d = sd_tank(p, t)                          # enclosure (back wall + floor) -> depth + dark stage
        # a low pedestal/monolith rising, centered, reads as the institution's plinth
        yy = -1.9 + r * 0.9
        mon = dim.sd_rbox(p, ti.Vector([0.0, yy, 2.7]), ti.Vector([1.2, 0.5, 0.35]), 0.06)
        d = ti.min(d, mon)
        # sinking leftover voxels of the fake (falling cubes) beside the plinth
        vp = ti.Vector([p.x, p.y + r * 2.2, p.z - 2.4])
        rep = dim.op_rep2(vp, 0.55)
        cube = dim.sd_box(rep, ti.Vector([0.0, 0.0, 0.0]), ti.Vector([0.05, 0.05, 0.05]))
        side = ti.math.clamp((ti.abs(p.x) - 1.3) / 0.8, 0.0, 1.0)      # only out at the sides
        cube += (1.0 - side * (1.0 - r * 0.7)) * 30.0
        d = ti.min(d, cube)
    else:                                         # S5 RESTORED (tank + beluga at rest)
        d = sd_tank(p, t)
        bp = beluga_world_pos(p, 0.0, 0.02 + 0.03 * ti.sin(t * 0.6), 2.7, 1.0)
        d = ti.min(d, sd_beluga(bp, t, 0.35, 0.0))
    return d

@ti.func
def _mat(p, n, t):
    c = CTX[None]
    col = ti.Vector([0.10, 0.16, 0.18])
    if c < 0.5 or c > 3.5:                         # tank worlds
        col = ti.Vector([0.05, 0.11, 0.13])        # deep teal wall
        if p.y < -1.9:
            col = ti.Vector([0.07, 0.13, 0.14])     # floor
        # the beluga: pearl white where near its skin
        cz = 2.6 if c < 0.5 else 2.7
        bp = beluga_world_pos(p, 0.0, 0.03, cz, 1.0)
        if sd_beluga(bp, t, 0.5, 0.0) < 0.05:
            col = ti.Vector([0.82, 0.86, 0.90])     # pearl skin
            if bp.z > 0.7 and bp.y > 0.05:
                col = ti.Vector([0.90, 0.93, 0.96]) # bright melon crown
    elif c < 1.5:                                  # feed: cold dark screen-room (phone drawn by PIL)
        col = ti.Vector([0.06, 0.09, 0.15])         # slate-blue wall (distinct from teal tank)
        if p.y < -1.9:
            col = ti.Vector([0.04, 0.06, 0.11])     # darker floor
        gp = dim.op_rep2(ti.Vector([p.x, p.y + 2.05, p.z]), 1.2)
        if dim.sd_box(gp, ti.Vector([0.0, 0.0, 0.0]), ti.Vector([0.015, 0.015, 0.6])) < 0.03:
            col = ti.Vector([0.16, 0.34, 0.55])     # glowing floor rail
        if p.z < 1.1:
            col = ti.Vector([0.10, 0.16, 0.26])     # near-field slabs: dim cool screens
    elif c < 2.5:                                  # fabrication: pearl whale + softer magenta cubes
        diss = DISSOLVE[None]
        col = ti.Vector([0.05, 0.11, 0.13])         # dark teal wall
        if p.y < -1.9:
            col = ti.Vector([0.06, 0.12, 0.13])
        bp = beluga_world_pos(p, 0.0, 0.0, 2.6, 1.15)
        if sd_beluga(bp, t, 0.45, 1.7) < 0.05:      # pearl whale
            col = ti.Vector([0.82, 0.86, 0.90])
            if bp.z > 0.7 and bp.y > 0.05:
                col = ti.Vector([0.90, 0.93, 0.96])
        vp = ti.Vector([p.x - 0.3 * diss, p.y - 0.3 * diss, p.z])
        rep = dim.op_rep2(vp, 0.4)
        if dim.sd_box(rep, ti.Vector([0.0, 0.0, 0.0]), ti.Vector([0.10, 0.10, 0.10])) < 0.05:
            col = ti.Vector([0.95, 0.28, 0.92])     # synthetic magenta voxels (toned down)
            if (ti.Vector([p.x, p.y, p.z - 1.75])).norm() > 1.0:
                col = ti.Vector([0.55, 0.72, 1.05]) # far cubes cool to cyan (depth cue)
    else:                                          # correction: dark charcoal room + lit plinth
        r = RISE[None]
        col = ti.Vector([0.05, 0.07, 0.10])         # charcoal wall
        if p.y < -1.9:
            col = ti.Vector([0.04, 0.05, 0.08])
        yy = -1.9 + r * 0.9
        if dim.sd_rbox(p, ti.Vector([0.0, yy, 2.7]), ti.Vector([1.2, 0.5, 0.35]), 0.06) < 0.06:
            col = ti.Vector([0.78, 0.82, 0.88])     # lit institutional plinth (text drawn by PIL)
        if ti.abs(p.x) > 1.3 and p.y > -1.7:
            col = ti.Vector([0.85, 0.26, 0.95])     # sinking magenta cubes at the sides
    return col

@ti.func
def _shadow(p, t):
    c = CTX[None]
    d = 1e9
    if c < 0.5 or c > 3.5:
        d = sd_tank(p, t)
        cz = 2.6 if c < 0.5 else 2.7
        bp = beluga_world_pos(p, 0.0, 0.03, cz, 1.0)
        d = ti.min(d, sd_beluga(bp, t, 0.0, 0.0))
    elif c < 1.5:
        d = sd_tank(p, t)
    elif c < 2.5:
        bp = beluga_world_pos(p, 0.0, 0.0, 2.6, 1.15)
        d = ti.min(sd_tank(p, t), sd_beluga(bp, t, 0.0, 1.7))
    else:
        r = RISE[None]
        d = sd_tank(p, t)
        yy = -1.9 + r * 0.9
        d = ti.min(d, dim.sd_rbox(p, ti.Vector([0.0, yy, 2.7]), ti.Vector([1.2, 0.5, 0.35]), 0.06))
    return d

# ---------------- camera per shot ----------------
def cam_at(f):
    t = f / FPS
    si = shot_of(f)
    dxx, dyy, dzz = dim.drift(f, amp=0.014)
    if si == 0:                                   # orbit-reveal around the beluga
        u = (f - S[0]) / (S[1] - S[0])
        ang = -0.5 + 1.0 * dim.ease_io(u)
        pos = dim.orbit((0.0, 0.15, 2.6), 3.1, 0.55, ang)
        look = (0.0, 0.1, 2.6)
        focus = 7.0 * (1 - dim.ease_io(u)) + 3.2 * dim.ease_io(u)
        cam = dim.Cam((pos[0] + dxx, pos[1] + dyy, pos[2] + dzz), look, fov=1.28, focus=focus, fstop=4.0)
    elif si == 1:                                 # rack-focus onto the phone slab
        u = (f - S[1]) / (S[2] - S[1])
        pos = (0.0 + 0.25 * math.sin(u * 1.2), 0.45, -0.25 + 0.2 * u)
        look = (0.0, 0.4, 2.4)
        focus = 4.5 * (1 - dim.ease_io(u)) + 1.9 * dim.ease_io(u)
        cam = dim.Cam((pos[0] + dxx, pos[1] + dyy, pos[2] + dzz), look, fov=1.20, focus=focus, fstop=2.6)
    elif si == 2:                                 # 3/4 side profile, slow dolly-in on the fabrication
        u = (f - S[2]) / (S[3] - S[2])
        pos = (-2.45 + 0.7 * dim.ease_io(u), 0.4 - 0.12 * u, 0.7 + 0.35 * u)
        look = (0.0, 0.0, 2.55)
        cam = dim.Cam((pos[0] + dxx, pos[1] + dyy, pos[2] + dzz), look, fov=1.32, focus=3.0, fstop=3.0)
    elif si == 3:                                 # rise-reveal over the fact grid
        u = (f - S[3]) / (S[4] - S[3])
        pos = (0.0, -0.7 + 1.0 * dim.ease_io(u), -0.3)
        look = (0.0, 0.2 + 0.3 * u, 2.6)
        cam = dim.Cam((pos[0] + dxx, pos[1] + dyy, pos[2] + dzz), look, fov=1.30, focus=5.5, fstop=4.5)
    else:                                         # locked-drift, restored tank (3/4 view, loops to S1)
        u = (f - S[4]) / (S[5] - S[4])
        ang = 0.5 - 0.06 * dim.ease_io(min(1.0, u * 1.4))   # settle near S1's closing 3/4 angle
        pos = dim.orbit((0.0, 0.12, 2.7), 3.0, 0.5, ang)
        look = (0.0, 0.08, 2.7)
        cam = dim.Cam((pos[0] + dxx * 1.3, pos[1] + dyy * 1.3, pos[2] + dzz * 1.3),
                      look, fov=1.26, focus=3.2, fstop=4.0)
    return cam

def set_ctx(f):
    si = shot_of(f)
    CTX[None] = float(si)
    DISSOLVE[None] = dim.ease_io((f - S[2]) / (S[3] - S[2])) if si == 2 else 0.0
    RISE[None] = dim.ease_io((f - S[3]) / (S[4] - S[3])) if si == 3 else (1.0 if si > 3 else 0.0)

# ---------------- PIL brand chrome (composited over the 3D render) ----------------
GOLD = (255, 199, 44); SNOW = (244, 250, 255); RED = (232, 66, 66); CYAN = (120, 210, 255); MAG = (235, 90, 220)

def draw_chrome(base, f):
    """base: RGB uint8 HxWx3 numpy. Returns composited RGB uint8. Also drives readability manifest."""
    im = Image.fromarray(base).convert("RGB")
    dc.set_frame_bg(im, f)                         # capture bg luma for readability
    d = ImageDraw.Draw(im, "RGBA")
    t = f / FPS; si = shot_of(f)
    W, Hh = dc.W, dc.H

    # drifting particulate/mote layer — atmosphere + distributed motion across the frame so every
    # 2s window carries multiple disjoint moving regions (LIVING_SCREEN). Faint; sits under the HUD.
    mcol = (150, 90, 200) if si == 2 else ((120, 150, 190) if si in (1, 3) else (150, 200, 230))
    for i in range(30):
        bx = (i * 137) % W; by = (i * 311 + 90) % (Hh - 200) + 100
        ox = 46 * math.sin(t * (0.5 + (i % 5) * 0.13) + i)
        oy = 30 * math.sin(t * (0.4 + (i % 4) * 0.11) + i * 1.7)
        r = 2 + (i % 3)
        a = int(46 + 30 * (0.5 + 0.5 * math.sin(t * 1.3 + i)))
        d.ellipse([bx + ox - r, by + oy - r, bx + ox + r, by + oy + r], fill=(*mcol, a))

    # persistent eyebrow wordmark (top) — brand throughline + a small always-moving tick
    ef = dc.mono(30, m=True)
    d.text((104, 96), "ALASKA.AI", font=dc.mono(34, b=True), fill=(*SNOW, 235))
    d.text((104, 138), "DISPATCH", font=ef, fill=(*GOLD, 220))
    # top-right live telemetry (always animating => a disjoint motion region for LIVING_SCREEN)
    tel = f"SEC {t:04.1f}"
    tw = dc.tw(tel, ef); d.text((W - 104 - tw, 96), tel, font=ef, fill=(150, 176, 196, 210))
    barx = W - 104 - 150
    d.rectangle([barx, 138, barx + 150, 146], fill=(40, 60, 80, 160))
    d.rectangle([barx, 138, barx + int(150 * (f / NF)), 146], fill=(*GOLD, 210))
    # a small pulsing corner node (2nd guaranteed motion region, away from center + captions)
    pr = 8 + int(5 * (0.5 + 0.5 * math.sin(t * 6.0)))
    d.ellipse([W - 150 - pr, 176 - pr, W - 150 + pr, 176 + pr], outline=(*CYAN, 180), width=2)

    # ---- HOOK: burned-in headline for the first ~2.4s (and frame-0 poster) ----
    if si == 0:
        ha = 1.0 if f < 4 else E.out_cubic(E.seg(f, 2, 20)) * (1.0 - E.seg(f, 60, 78))
        if ha > 0.02:
            kf = dc.mono(30, b=True); kt = "A TRUE STORY ABOUT A FAKE"
            kw = dc.tw(kt, kf); d.text(((W - kw) // 2, 252), kt, font=kf,
                                       fill=(*GOLD, int(240 * ha)), stroke_width=2, stroke_fill=(3, 8, 18, int(220 * ha)))
            hf = dc.fr(78, 800, 144)
            for i, ln in enumerate(["AI FAKED THIS", "WHALE'S ESCAPE"]):
                w = dc.tw(ln, hf, 0.02); x = (W - w) // 2; y = 312 + i * 96
                d.text((x, y), ln, font=hf, fill=(247, 251, 255, int(255 * ha)),
                       stroke_width=4, stroke_fill=(3, 8, 18, int(235 * ha)))
            # crisp rule + end ticks under the headline (poster-grade ink for FIRST_FRAME)
            ry = 312 + 2 * 96 + 22; rx0, rx1 = 190, W - 190
            d.line([(rx0, ry), (rx1, ry)], fill=(*GOLD, int(230 * ha)), width=4)
            for rx in (rx0, rx1):
                d.line([(rx, ry - 12), (rx, ry + 12)], fill=(*GOLD, int(230 * ha)), width=4)
            # warning-red hairline framing the frame like a feed about to lie
            m = 46
            d.rectangle([m, m, W - m, Hh - m], outline=(*RED, int(170 * ha)), width=4)
            d.rectangle([m + 10, m + 10, W - m - 10, Hh - m - 10], outline=(*RED, int(90 * ha)), width=2)

    # ---- S2 THE FEED: a phone showing the FAKE image, going viral (counter in CARD_BAND) ----
    if si == 1:
        u = (f - S[1]) / (S[2] - S[1])
        bootw = E.out_cubic(min(1.0, u * 3.0))       # phone/screen boots in
        px0, py0, px1, py1 = 300, 300, 780, 1372     # phone bezel
        sx0, sy0, sx1, sy1 = px0 + 18, py0 + 26, px1 - 18, py1 - 26   # screen
        # bezel + screen
        d.rounded_rectangle([px0, py0, px1, py1], radius=46, fill=(12, 16, 24, int(235 * bootw)), outline=(60, 82, 110, int(220 * bootw)), width=3)
        # --- the FAKE image (upper screen): faux open ocean + escaping whale + a small calf ahead ---
        img_b = min(sy1 - 6, 1150)
        for yy in range(sy0 + 6, img_b, 3):          # cheap vertical ocean gradient
            fr_ = (yy - sy0) / max(1, (img_b - sy0))
            cc = (int(18 + 30 * fr_), int(60 + 70 * fr_), int(96 + 60 * fr_), int(255 * bootw))
            d.line([(sx0 + 6, yy), (sx1 - 6, yy)], fill=cc, width=3)
        if bootw > 0.5:
            # the fabricated 'escaped' beluga (pale) drifting toward a small calf ahead
            wx = sx0 + 120 + int(30 * math.sin(t * 1.3)); wy = 720
            d.ellipse([wx, wy, wx + 250, wy + 120], fill=(214, 226, 236, 240))   # body
            d.ellipse([wx + 200, wy - 26, wx + 300, wy + 70], fill=(222, 232, 240, 240))  # melon/head
            cxx = sx1 - 150 + int(16 * math.sin(t * 1.3 + 1)); cyy = 640
            d.ellipse([cxx, cyy, cxx + 96, cyy + 52], fill=(206, 220, 232, 230))  # the calf ahead
            d.ellipse([cxx + 78, cyy - 10, cxx + 118, cyy + 34], fill=(212, 224, 234, 230))
        # red 'ESCAPED' banner + a recording hairline
        bf = dc.mono(38, b=True); bt = "BELUGA ESCAPES SEWARD"
        bw = dc.tw(bt, bf); d.rectangle([sx0 + 6, sy0 + 6, sx1 - 6, sy0 + 66], fill=(150, 26, 30, int(220 * bootw)))
        d.text((sx0 + (sx1 - sx0 - bw) // 2, sy0 + 14), bt, font=bf, fill=(*SNOW, int(245 * bootw)))
        d.rounded_rectangle([sx0, sy0, sx1, sy1], radius=30, outline=(*RED, int(150 * bootw)), width=3)
        # --- the view counter on the post (lower screen, inside CARD_BAND 1175-1360) ---
        d.rectangle([sx0 + 6, 1176, sx1 - 6, sy1 - 6], fill=(8, 12, 20, int(235 * bootw)))
        target = 5_940_000
        shown = int(target * min(1.0, E.out_cubic(min(1.0, u * 1.5))))
        cf = dc.mono(78, b=True); cs = f"{shown:,}"
        cw = dc.tw(cs, cf); d.text(((W - cw) // 2, 1196), cs, font=cf, fill=(*SNOW, int(248 * bootw)))
        lf = dc.mono(30, m=True); lab = "VIEWS  ·  ONE POST"
        lw = dc.tw(lab, lf); d.text(((W - lw) // 2, 1288), lab, font=lf, fill=(150, 178, 200, int(230 * bootw)))
        il = dc.mono(22); ilt = "ILLUSTRATIVE · reported by Alaska Public Media"
        iw = dc.tw(ilt, il); d.text(((W - iw) // 2, 1330), ilt, font=il, fill=(150, 130, 90, 220) if (f // 8) % 2 else (120, 105, 70, 150))
        # like/share stutter row (an extra disjoint motion region)
        for k in range(3):
            bx = sx0 + 40 + k * 130; on = ((f // 6) % 3) >= k
            d.ellipse([bx, 1150, bx + 18, 1168], fill=(*RED, 230) if on else (60, 40, 44, 150))
        # THE SPREAD (16.2s->20.5s): reshare ghost-cards pop in around the phone one after another,
        # the post multiplying across the feed — a real story-advancing event mid-shot
        tspread = t - 16.2
        if tspread > 0:
            cards = [(96, 470, 0.0), (830, 620, 0.55), (60, 950, 1.1), (816, 1030, 1.65),
                     (150, 250, 2.2), (760, 300, 2.75), (96, 1240, 3.3)]
            cf2 = dc.mono(22, m=True)
            for (cx0, cy0, dt_) in cards:
                a2 = E.out_cubic(E.seg(tspread, dt_, dt_ + 0.30))
                if a2 <= 0.02:
                    continue
                pop = 1.0 + 0.16 * (1.0 - a2)
                wgt, hgt = int(150 * pop), int(96 * pop)
                d.rounded_rectangle([cx0, cy0 - int((1 - a2) * 18), cx0 + wgt, cy0 + hgt],
                                    radius=10, fill=(14, 20, 32, int(200 * a2)),
                                    outline=(*RED, int(190 * a2)), width=2)
                d.ellipse([cx0 + 10, cy0 + 10, cx0 + 30, cy0 + 30], fill=(200, 210, 224, int(160 * a2)))
                d.line([(cx0 + 40, cy0 + 20), (cx0 + wgt - 12, cy0 + 20)], fill=(120, 140, 160, int(150 * a2)), width=4)
                d.line([(cx0 + 10, cy0 + 48), (cx0 + wgt - 12, cy0 + 48)], fill=(90, 110, 130, int(130 * a2)), width=4)
                d.text((cx0 + 10, cy0 + hgt - 32), "RESHARED", font=cf2, fill=(*RED, int(210 * a2)))
        # counter LOCK flash at ~18.9s: one soft red full-frame pulse (the moment it goes viral)
        lk = E.seg(t, 18.85, 19.05) * (1.0 - E.seg(t, 19.05, 19.55))
        if lk > 0.02:
            d.rectangle([46, 46, W - 46, Hh - 46], outline=(*RED, int(200 * lk)), width=10)

    # ---- S3 THE FAKE: DETECTOR readout settling to 82.6% LIKELY AI (CARD_BAND) ----
    if si == 2:
        u = (f - S[2]) / (S[3] - S[2])
        d.rounded_rectangle([150, 1180, 930, 1352], radius=18, fill=(14, 10, 20, 205), outline=(120, 70, 130, 180), width=2)
        scan = E.out_cubic(min(1.0, u * 2.2))
        pct = 82.6 * scan
        pf = dc.mono(84, b=True); ps = f"{pct:4.1f}% LIKELY AI"
        pw = dc.tw(ps, pf); d.text(((W - pw) // 2, 1200), ps, font=pf, fill=(245, 190, 90, 245))
        lf = dc.mono(32, m=True); lab = "DETECTOR: HIVE MODERATION"
        lw = dc.tw(lab, lf); d.text(((W - lw) // 2, 1300), lab, font=lf, fill=(160, 150, 170, 220))
        if scan > 0.9:
            nf = dc.mono(30, b=True); nt = "LIKELY  ≠  PROOF"
            nw = dc.tw(nt, nf); d.text(((W - nw) // 2, 1340), nt, font=nf, fill=(*RED, 230))
        # scan line sweeping the card (motion region)
        sx = 150 + int(780 * (0.5 + 0.5 * math.sin(t * 3.0)))
        d.line([(sx, 1182), (sx, 1350)], fill=(245, 190, 90, 120), width=3)
        # SINCE 1998 plate begins to draw in late in the shot
        if u > 0.55:
            fa = E.out_cubic((u - 0.55) / 0.4)
            ff = dc.mono(40, b=True); s1 = "SINCE 1998"
            d.text((150, 1120 - int((1 - fa) * 10)), s1, font=ff, fill=(*SNOW, int(230 * fa)))

    # ---- S4 THE CORRECTION: fact plates + stamp, then the fake-vs-proof race ----
    if si == 3:
        u = (f - S[3]) / (S[4] - S[3])
        # fact labels on the three rising plates (their 3D y ~ maps to screen; keep in CARD_BAND band)
        fa = E.out_cubic(min(1.0, u * 1.6))
        facts = [("SINCE", "1998"), ("ESCAPES", "0"), ("STATUS", "FALSE")]
        for i, (a, b) in enumerate(facts):
            cx = 245 + i * 297; yy = 1250 + int((1 - fa) * 40)
            af = dc.mono(30, m=True); bf = dc.mono(66, b=True)
            aw = dc.tw(a, af); d.text((cx - aw // 2, yy - 44), a, font=af, fill=(150, 176, 196, int(220 * fa)))
            bw = dc.tw(b, bf); d.text((cx - bw // 2, yy), b, font=bf, fill=(247, 251, 255, int(245 * fa)))
        # red THIS NEVER HAPPENED stamp slams in around the payoff (~37.3s => u~0.35)
        if u > 0.30:
            sa = E.out_cubic(min(1.0, (u - 0.30) / 0.14))
            rot = -8
            sf = dc.fr(64, 800, 144); st = "THIS NEVER HAPPENED"
            stamp = Image.new("RGBA", (900, 150), (0, 0, 0, 0)); sd = ImageDraw.Draw(stamp)
            sd.rounded_rectangle([6, 6, 894, 144], radius=12, outline=(*RED, int(240 * sa)), width=6)
            sw = dc.tw(st, sf); dc.tk(sd, st, sf, (*RED, int(250 * sa)), (900 - sw) // 2, 40, 0.0)
            stamp = stamp.rotate(rot, expand=True, resample=Image.BICUBIC)
            im.paste(stamp, ((W - stamp.width) // 2, 980 - int((1 - sa) * 30)), stamp)
        # the caveat RACE (last ~4s of the shot): red FAKE line outruns grey PROOF bar
        if u > 0.62:
            rr = (u - 0.62) / 0.34
            yb = 1130
            fx = 150 + int(760 * min(1.0, rr * 1.8))
            d.line([(150, yb), (fx, yb)], fill=(*RED, 235), width=8)
            d.ellipse([fx - 9, yb - 9, fx + 9, yb + 9], fill=(*RED, 245))
            px = 150 + int(760 * min(1.0, rr * 0.7))
            d.line([(150, yb + 34), (px, yb + 34)], fill=(150, 160, 172, 220), width=6)
            lf = dc.mono(26, m=True)
            d.text((fx + 14, yb - 16), "FAKE", font=lf, fill=(*RED, 230))
            d.text((px + 14, yb + 22), "PROOF", font=lf, fill=(150, 160, 172, 220))

    # ---- kinetic voice-synced captions (brand throughline; drives READABILITY) ----
    dc.caption(im, f)
    # branded outro (adaptive; begins after the VO)
    dc.outro_card(im, f)
    dc.flush_textlog(f)
    return np.asarray(im.convert("RGB"))

# ---------------- assemble + render ----------------
dim.SCENE_FN = _scene
dim.MAT_FN = _mat
dim.SHADOW_FN = _shadow
dim.init_kernels()

def render_range(s, e):
    for f in range(s, e):
        set_ctx(f)
        cam = cam_at(f)
        rgb, z = dim.render_frame(cam, t=f / FPS)
        u8 = dim.post(rgb, z, cam, f=f)
        out = draw_chrome(u8, f)
        Image.fromarray(out).save(os.path.join(OUT, f"frame_{f:05d}.png"), compress_level=1)
    dim.write_manifest(os.path.join(OUT, "..", "render_manifest.json"), NF,
                       extra={"concept": "THE FAKE THAT SWAM", "shots": len(S) - 1})

def write_shots():
    shots = [
        {"id": 1, "start": S[0], "end": S[1], "framing": "subject-portrait", "transition_in": "", "note": "the real beluga in her tank"},
        {"id": 2, "start": S[1], "end": S[2], "framing": "data-panel", "transition_in": "fui-boot", "note": "the feed + view counter"},
        {"id": 3, "start": S[2], "end": S[3], "framing": "macro-closeup", "transition_in": "morph", "note": "the fabrication shedding pixels + detector"},
        {"id": 4, "start": S[3], "end": S[4], "framing": "two-up", "transition_in": "hard-cut", "note": "the correction facts + stamp"},
        {"id": 5, "start": S[4], "end": S[5], "framing": "wide-establish", "transition_in": "crossfade", "note": "restored tank, loop-back"},
    ]
    dc.write_shots(shots, NF, path=os.path.join(OUT, "..", "shots.json"))

if __name__ == "__main__":
    s = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    e = int(sys.argv[2]) if len(sys.argv) > 2 else NF
    if s == 0:
        write_shots()
    render_range(s, e)
    print(f"rendered [{s},{e}) scale={SCALE} -> {OUT}")
