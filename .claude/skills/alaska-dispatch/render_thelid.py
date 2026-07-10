"""render_thelid.py — Dispatch 'The Lid' (UAF wildfire-smoke ML bias-correction).

Authored FRESH to out/dispatch/storyboard.json (derived_from: scratch). Six distinct dimensional
worlds, one render process, the kernel re-JITs per shot so each shot is a genuinely different world
(SCENE_STRUCTURE): aerial smoke valley -> side-on cross-section -> ground-level community ->
forecast panel -> macro cloud with a hidden ember -> rise-reveal outro. dim.post() grades each
frame; dispatch_core composites the brand chrome (captions/HUD/data overlays) razor-sharp on top.

Usage:  DIM_SCALE=1.0 python render_thelid.py <start> <end>
Env:    DIM_SCALE (0.4 look-dev, 1.0 ship), DIM_OUT (frame dir), DIM_MANIFEST_UP (manifest to ../).
"""
import os, sys, math, json
import numpy as np
import taichi as ti
import dimensional as dim
import dispatch_core as dc
from PIL import Image, ImageDraw, ImageFilter
import easing as E

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("DIM_OUT") or os.path.join(HERE, "thelid_frames")
os.makedirs(OUT, exist_ok=True)
FPS = 30
W, H = 1080, 1920
NF = int(os.environ.get("DIM_NF", "1755"))            # 58.5s
SCALE = float(os.environ.get("DIM_SCALE", "1.0"))

TIM = json.load(open(os.path.join(HERE, "audio", "timing60.json")))
SB = json.load(open(os.path.abspath(os.path.join(HERE, "..", "..", "..", "out", "dispatch", "storyboard.json"))))
SPEECH_END = TIM["speech_end"]
BOUNDS = TIM["shot_bounds"]                            # [15,329,643,793,1196,1452]
# shot frame ranges: shot 0 starts at 0; each next at BOUNDS[i]; last ends at NF
SHOT_START = [0] + BOUNDS[1:]                          # [0,329,643,793,1196,1452]
SHOT_END = BOUNDS[1:] + [NF]                           # [329,643,793,1196,1452,NF]
NSHOT = len(SHOT_START)

dim.init(1080, 1920, scale=SCALE)

# ============================================================ shared SDF helpers (scene-local)
@ti.func
def ridge_field(p, cx, cz, sx, sy, sz, seed):
    return dim.sd_ellipsoid(p, ti.Vector([cx, -1.0, cz]), ti.Vector([sx, sy, sz])) \
        + 0.34 * dim.fbm2(p.x * 0.4 + seed, p.z * 0.4)

# ============================================================ WORLD A — aerial smoke valley (shots 0 & 5)
RIVA = 1.4
@ti.func
def _rivx(z): return RIVA * ti.sin(z * 0.12) + 0.5 * ti.sin(z * 0.29)

@ti.func
def sceneA(p, t):
    rx = _rivx(p.z); dx = p.x - rx; adx = ti.abs(dx)
    chan = ti.math.clamp(1.0 - adx / 3.0, 0.0, 1.0)
    ground = p.y + 0.10 + 0.16 * ti.math.clamp(adx - 2.0, 0.0, 9.0) \
        + 0.05 * dim.fbm2(p.x * 0.8, p.z * 0.8) + 0.30 * chan * chan
    d = ground
    # three receding ridgelines (recession into fog is the whole point of an aerial smoke valley)
    r1 = ridge_field(p, -8.0, 15.0, 10.0, 4.2, 7.0, 3.0)
    r2 = ridge_field(p, 9.0, 23.0, 11.0, 5.6, 8.0, 7.0)
    r3 = ridge_field(p, -1.0, 34.0, 18.0, 7.8, 10.0, 1.0)
    d = dim.smin(d, ti.min(r1, ti.min(r2, r3)), 0.8)
    # soot-brown spruce stands along the banks (domain-repeated cones)
    for sgn in ti.static((-1.0, 1.0)):
        off = rx + sgn * (3.2 + 0.6 * ti.sin(p.z * 0.5))
        q = ti.Vector([p.x - off, p.y, p.z]); q.z -= 2.4 * ti.round(q.z / 2.4)
        hgt = ti.math.clamp((q.y + 0.15) / 1.15, 0.0, 1.0); rad = 0.30 * (1.0 - hgt) + 0.015
        cone = ti.Vector([q.x, q.z]).norm() - rad
        cone = ti.max(cone, ti.abs(q.y + 0.15 - 0.55) - 0.62)
        d = ti.min(d, cone)
    # a small community: two cabins on the valley floor near the river
    cab1 = dim.sd_rbox(p, ti.Vector([rx + 1.6, -0.02, 6.0]), ti.Vector([0.22, 0.16, 0.30]), 0.02)
    cab2 = dim.sd_rbox(p, ti.Vector([rx - 1.9, -0.03, 7.6]), ti.Vector([0.20, 0.14, 0.26]), 0.02)
    d = ti.min(d, ti.min(cab1, cab2))
    return d

@ti.func
def matA(p, n, t):
    rx = _rivx(p.z); dx = p.x - rx; adx = ti.abs(dx)
    inch = ti.math.clamp(1.0 - adx / 2.1, 0.0, 1.0)
    col = ti.Vector([0.20, 0.16, 0.12]) + 0.04 * ti.math.clamp(1.4 - adx * 0.4, 0.0, 1.0)  # dun valley floor
    if p.y < -0.18 and inch > 0.35:
        col = ti.Vector([0.10, 0.11, 0.10])                      # dim glacial channel
    if p.y > 0.5:
        col = ti.Vector([0.24, 0.20, 0.17])                      # ridge rock, brown in smoke
        if n.y > 0.72 and p.y > 1.5:
            col = ti.Vector([0.40, 0.34, 0.30])                  # dim snow, smoke-stained
    # spruce
    spr = 9.9
    for sgn in ti.static((-1.0, 1.0)):
        off = rx + sgn * (3.2 + 0.6 * ti.sin(p.z * 0.5))
        q = ti.Vector([p.x - off, p.y, p.z]); q.z -= 2.4 * ti.round(q.z / 2.4)
        hgt = ti.math.clamp((q.y + 0.15) / 1.15, 0.0, 1.0); rad = 0.30 * (1.0 - hgt) + 0.015
        c2 = ti.Vector([q.x, q.z]).norm() - rad
        c2 = ti.max(c2, ti.abs(q.y + 0.15 - 0.55) - 0.62)
        spr = ti.min(spr, c2)
    if spr < 0.05:
        col = ti.Vector([0.06, 0.09, 0.06])                      # near-black spruce silhouette in smoke
    # cabins: dark wood, one warm lit window in the outro world (handled by lit-window overlay in PIL)
    cab1 = dim.sd_rbox(p, ti.Vector([rx + 1.6, -0.02, 6.0]), ti.Vector([0.22, 0.16, 0.30]), 0.02)
    cab2 = dim.sd_rbox(p, ti.Vector([rx - 1.9, -0.03, 7.6]), ti.Vector([0.20, 0.14, 0.26]), 0.02)
    if ti.min(cab1, cab2) < 0.04:
        col = ti.Vector([0.14, 0.10, 0.08])
    return col

@ti.func
def shadowA(p, t):
    rx = _rivx(p.z); dx = p.x - rx; adx = ti.abs(dx)
    chan = ti.math.clamp(1.0 - adx / 3.0, 0.0, 1.0)
    d = p.y + 0.10 + 0.16 * ti.math.clamp(adx - 2.0, 0.0, 9.0) + 0.30 * chan * chan
    r1 = ridge_field(p, -8.0, 15.0, 10.0, 4.2, 7.0, 3.0)
    r2 = ridge_field(p, 9.0, 23.0, 11.0, 5.6, 8.0, 7.0)
    r3 = ridge_field(p, -1.0, 34.0, 18.0, 7.8, 10.0, 1.0)
    d = dim.smin(d, ti.min(r1, ti.min(r2, r3)), 0.8)
    return d

# ============================================================ WORLD B — cross-section (shot 1)
# A side-on schematic: a ground bar, a THIN TALL model plume (left) and a SQUAT THICK real plume
# (right), a horizontal inversion-lid slab overhead. Cooler diagram light. Assemble progress drives
# the lid + plumes drawing in.
@ti.func
def _b_prog(t): return ti.math.clamp((t - 11.2) / 3.4, 0.0, 1.0)

@ti.func
def sceneB(p, t):
    pr = _b_prog(t)
    ground = p.y + 1.9
    d = ground
    # model plume: thin, tall (a vertical capsule) on the left
    mh = 3.0 * pr
    modl = dim.sd_capsule(p, ti.Vector([-1.5, -1.9, 6.0]), ti.Vector([-1.5, -1.9 + mh, 6.0]), 0.16)
    d = ti.min(d, modl)
    # real plume: squat, thick (a fat low ellipsoid) on the right
    rh = 1.0 * pr
    realp = dim.sd_ellipsoid(p, ti.Vector([1.5, -1.5, 6.0]), ti.Vector([0.62, 0.55 + rh * 0.2, 0.5]))
    d = ti.min(d, realp)
    # inversion lid: a thin wide horizontal slab that slides down into place
    lidy = 0.7 + (1.0 - pr) * 3.0
    lid = dim.sd_box(p, ti.Vector([0.0, lidy, 6.0]), ti.Vector([3.4, 0.05, 1.2]))
    d = ti.min(d, lid)
    return d

@ti.func
def matB(p, n, t):
    col = ti.Vector([0.10, 0.12, 0.15])                          # cool slate ground
    modl = dim.sd_capsule(p, ti.Vector([-1.5, -1.9, 6.0]), ti.Vector([-1.5, 1.1, 6.0]), 0.16)
    if modl < 0.04:
        col = ti.Vector([0.55, 0.60, 0.66])                      # pale thin model plume (too clean)
    realp = dim.sd_ellipsoid(p, ti.Vector([1.5, -1.5, 6.0]), ti.Vector([0.62, 0.75, 0.5]))
    if realp < 0.05:
        col = ti.Vector([0.42, 0.24, 0.16])                      # thick brown real smoke
    lid = dim.sd_box(p, ti.Vector([0.0, 0.7, 6.0]), ti.Vector([3.4, 0.05, 1.2]))
    if lid < 0.06:
        col = ti.Vector([1.4, 1.2, 0.7])                         # glowing bone-grey warning lid (emissive)
    return col

@ti.func
def shadowB(p, t):
    return ti.min(p.y + 1.9, dim.sd_box(p, ti.Vector([0.0, 0.7, 6.0]), ti.Vector([3.4, 0.05, 1.2])))

# ============================================================ WORLD C — ground-level community (shot 2)
@ti.func
def sceneC(p, t):
    ground = p.y + 1.2 + 0.06 * dim.fbm2(p.x * 0.9, p.z * 0.9)
    d = ground
    # a cabin close by, right of frame
    cab = dim.sd_rbox(p, ti.Vector([1.2, -0.55, 5.5]), ti.Vector([0.9, 0.65, 0.8]), 0.04)
    roof = dim.sd_box(p, ti.Vector([1.2, 0.18, 5.5]), ti.Vector([1.05, 0.06, 0.95]))
    d = ti.min(d, ti.min(cab, roof))
    # a small standing figure (person) center-left
    body = dim.sd_capsule(p, ti.Vector([-0.5, -1.2, 4.4]), ti.Vector([-0.5, -0.45, 4.4]), 0.14)
    head = dim.sd_sphere(p, ti.Vector([-0.5, -0.30, 4.4]), 0.13)
    d = ti.min(d, ti.min(body, head))
    # spruce silhouettes behind, domain-repeated
    q = ti.Vector([p.x + 3.0, p.y, p.z]); q.x -= 2.6 * ti.round(q.x / 2.6)
    hgt = ti.math.clamp((q.y + 0.2) / 1.6, 0.0, 1.0); rad = 0.34 * (1.0 - hgt) + 0.02
    cone = ti.max(ti.Vector([q.x, p.z - 9.0]).norm() - rad, ti.abs(q.y + 0.2 - 0.7) - 0.9)
    d = ti.min(d, cone)
    return d

@ti.func
def matC(p, n, t):
    col = ti.Vector([0.18, 0.14, 0.10])
    cab = dim.sd_rbox(p, ti.Vector([1.2, -0.55, 5.5]), ti.Vector([0.9, 0.65, 0.8]), 0.04)
    roof = dim.sd_box(p, ti.Vector([1.2, 0.18, 5.5]), ti.Vector([1.05, 0.06, 0.95]))
    if cab < 0.05:
        col = ti.Vector([0.16, 0.11, 0.08])                      # dark cabin wall
    if roof < 0.05:
        col = ti.Vector([0.12, 0.09, 0.07])
    body = dim.sd_capsule(p, ti.Vector([-0.5, -1.2, 4.4]), ti.Vector([-0.5, -0.45, 4.4]), 0.14)
    head = dim.sd_sphere(p, ti.Vector([-0.5, -0.30, 4.4]), 0.13)
    if ti.min(body, head) < 0.05:
        col = ti.Vector([0.09, 0.09, 0.10])                      # figure, dark silhouette
    return col

@ti.func
def shadowC(p, t):
    cab = dim.sd_rbox(p, ti.Vector([1.2, -0.55, 5.5]), ti.Vector([0.9, 0.65, 0.8]), 0.04)
    return ti.min(p.y + 1.2, cab)

# ============================================================ WORLD D — forecast panel (shot 3)
# 3D-staged: a curved RIBBON (the forecast curve) bending DOWN over time, a measured-curve reference
# line below, receding into an instrument void so DEPTH_FIELD is real. A CNN block sits behind.
@ti.func
def _d_prog(t): return ti.math.clamp((t - (BOUNDS[3] / FPS) - 0.6) / 3.6, 0.0, 1.0)

@ti.func
def sceneD(p, t):
    pr = _d_prog(t)
    d = 1e9
    # measured (truth) curve: a low horizontal tube, fixed
    meas = dim.sd_capsule(p, ti.Vector([-2.6, -0.9, 6.5]), ti.Vector([2.6, -0.9, 6.5]), 0.045)
    d = ti.min(d, meas)
    # forecast curve: a tube whose right end starts HIGH and is pulled DOWN toward meas as pr->1
    endy = 1.3 - 1.9 * pr
    fc = dim.sd_capsule(p, ti.Vector([-2.6, -0.5, 6.0]), ti.Vector([2.6, endy, 6.0]), 0.075)
    d = ti.min(d, fc)
    # end markers on the curve so the bend reads
    d = ti.min(d, dim.sd_sphere(p, ti.Vector([2.6, endy, 6.0]), 0.12))
    # CNN block: a rounded slab set BACK in z (depth), left
    cnn = dim.sd_rbox(p, ti.Vector([-3.0, 0.6, 8.5]), ti.Vector([0.55, 0.55, 0.2]), 0.05)
    d = ti.min(d, cnn)
    # back wall plane at z=13 (surface faces the camera; positive in front)
    d = ti.min(d, 13.0 - p.z)
    return d

@ti.func
def matD(p, n, t):
    col = ti.Vector([0.09, 0.12, 0.16])                          # instrument back wall, cool
    meas = dim.sd_capsule(p, ti.Vector([-2.6, -0.9, 6.0]), ti.Vector([2.6, -0.9, 6.0]), 0.05)
    if meas < 0.05:
        col = ti.Vector([0.42, 0.50, 0.58])                      # measured reference, cool grey
    pr = _d_prog(t); endy = 1.3 - 1.9 * pr
    fc = dim.sd_capsule(p, ti.Vector([-2.6, -0.5, 6.0]), ti.Vector([2.6, endy, 6.0]), 0.075)
    if fc < 0.09 or (p - ti.Vector([2.6, endy, 6.0])).norm() < 0.14:
        col = ti.Vector([0.20, 1.60, 1.05])                      # mint forecast curve (emissive)
    cnn = dim.sd_rbox(p, ti.Vector([-3.0, 0.6, 8.5]), ti.Vector([0.55, 0.55, 0.2]), 0.05)
    if cnn < 0.05:
        col = ti.Vector([0.16, 0.26, 0.34])
    return col

@ti.func
def shadowD(p, t):
    return ti.min(13.0 - p.z, dim.sd_rbox(p, ti.Vector([-3.0, 0.6, 8.5]), ti.Vector([0.55, 0.55, 0.2]), 0.05))

# ============================================================ WORLD E — macro cloud + hidden ember (shot 4)
@ti.func
def sceneE(p, t):
    # a big soft cloud (lumpy ellipsoid) centered, filling frame
    cl = dim.sd_ellipsoid(p, ti.Vector([0.0, 0.6, 6.0]), ti.Vector([2.4, 1.2, 1.6])) \
        + 0.35 * dim.fbm2(p.x * 1.1 + t * 0.05, p.z * 1.1)
    d = cl
    # the hidden ember: a small sphere BELOW the cloud, pulsing
    pu = 0.5 + 0.5 * ti.sin(t * 3.0)
    emb = dim.sd_sphere(p, ti.Vector([0.1, -0.9, 6.0]), 0.22 + 0.06 * pu)
    d = ti.min(d, emb)
    # a hint of dark ground far below
    d = ti.min(d, p.y + 2.4)
    return d

@ti.func
def matE(p, n, t):
    col = ti.Vector([0.06, 0.06, 0.08])
    if p.y < -2.2:
        col = ti.Vector([0.07, 0.05, 0.05])
    cl = dim.sd_ellipsoid(p, ti.Vector([0.0, 0.6, 6.0]), ti.Vector([2.4, 1.2, 1.6])) \
        + 0.35 * dim.fbm2(p.x * 1.1 + t * 0.05, p.z * 1.1)
    if cl < 0.05:
        col = ti.Vector([0.50, 0.45, 0.42])                      # soft grey-brown cloud, lit
    pu = 0.5 + 0.5 * ti.sin(t * 3.0)
    emb = dim.sd_sphere(p, ti.Vector([0.1, -0.9, 6.0]), 0.28)
    if emb < 0.06:
        col = ti.Vector([2.6, 0.85, 0.18]) * (0.7 + 0.7 * pu)    # ember glow (emissive, pulsing)
    return col

@ti.func
def shadowE(p, t):
    return ti.min(p.y + 2.6, dim.sd_ellipsoid(p, ti.Vector([0.0, 0.6, 6.0]), ti.Vector([2.4, 1.2, 1.6])))

# ============================================================ per-shot config: hooks + lighting + camera
def light_valley():
    # low blood-orange sun near the look axis so the disk sits in frame; moderate smoke fog
    dim.SUN_DIR = (0.10, 0.13, 0.99); dim.SUN_COL = (1.70, 0.66, 0.26)
    dim.SKY_COL = (0.34, 0.21, 0.13); dim.SKY_HI = (0.60, 0.36, 0.20)
    dim.FOG_DEN = 0.030; dim.FOG_COL = (0.46, 0.30, 0.19); dim.RIM_STR = 0.40

def light_diagram():
    dim.SUN_DIR = (0.45, 0.55, 0.70); dim.SUN_COL = (1.15, 1.22, 1.30)
    dim.SKY_COL = (0.09, 0.12, 0.16); dim.SKY_HI = (0.18, 0.22, 0.28)
    dim.FOG_DEN = 0.016; dim.FOG_COL = (0.12, 0.15, 0.20); dim.RIM_STR = 0.5

def light_ground():
    dim.SUN_DIR = (0.30, 0.28, 0.90); dim.SUN_COL = (1.25, 0.55, 0.24)
    dim.SKY_COL = (0.34, 0.22, 0.14); dim.SKY_HI = (0.46, 0.30, 0.18)
    dim.FOG_DEN = 0.11; dim.FOG_COL = (0.42, 0.29, 0.20); dim.RIM_STR = 0.4

def light_panel():
    dim.SUN_DIR = (0.4, 0.6, 0.7); dim.SUN_COL = (0.7, 0.9, 1.0)
    dim.SKY_COL = (0.03, 0.05, 0.07); dim.SKY_HI = (0.06, 0.09, 0.12)
    dim.FOG_DEN = 0.03; dim.FOG_COL = (0.04, 0.06, 0.09); dim.RIM_STR = 0.6

def light_macro():
    dim.SUN_DIR = (0.35, 0.65, 0.67); dim.SUN_COL = (1.05, 0.98, 1.02)
    dim.SKY_COL = (0.05, 0.05, 0.08); dim.SKY_HI = (0.12, 0.11, 0.14)
    dim.FOG_DEN = 0.028; dim.FOG_COL = (0.10, 0.08, 0.09); dim.RIM_STR = 0.55

SHOTS = [
    dict(scene=sceneA, mat=matA, shadow=shadowA, light=light_valley),   # 0
    dict(scene=sceneB, mat=matB, shadow=shadowB, light=light_diagram),  # 1
    dict(scene=sceneC, mat=matC, shadow=shadowC, light=light_ground),   # 2
    dict(scene=sceneD, mat=matD, shadow=shadowD, light=light_panel),    # 3
    dict(scene=sceneE, mat=matE, shadow=shadowE, light=light_macro),    # 4
    dict(scene=sceneA, mat=matA, shadow=shadowA, light=light_valley),   # 5 (outro, same world, new camera+state)
]

def shot_of(f):
    for i in range(NSHOT):
        if SHOT_START[i] <= f < SHOT_END[i]:
            return i
    return NSHOT - 1

# ---------------- cameras (one per shot) ----------------
def cam_shot0(f):
    x = (f - SHOT_START[0]) / max(1, SHOT_END[0] - SHOT_START[0])
    A = ((0.4, 6.5, -7.0), (0.6, 1.2, 8.0)); B = ((0.2, 3.2, -3.0), (0.6, 0.4, 8.0))
    pos, look = dim.dolly(A, B, x); dx, dy, dz = dim.drift(f, 0.018)
    pos = (pos[0] + dx, pos[1] + dy, pos[2] + dz)
    return dim.Cam(pos, look, fov=1.28, focus=30 - 22 * x, fstop=5.6)

def cam_shot1(f):
    x = (f - SHOT_START[1]) / max(1, SHOT_END[1] - SHOT_START[1])
    pos = (0.0, -0.25, -1.8 + 0.5 * x); look = (0.0, -0.35, 6.0)     # side-on, both plumes + lid framed
    dxx, dyy, dzz = dim.drift(f, 0.010); pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    return dim.Cam(pos, look, fov=1.18, focus=7.8 - 1.5 * x, fstop=4.0)

def cam_shot2(f):
    x = (f - SHOT_START[2]) / max(1, SHOT_END[2] - SHOT_START[2])
    pos = (-0.3, -0.35 + 0.05 * x, 1.6 + 0.3 * x); look = (0.1, -0.35, 5.0)
    dxx, dyy, dzz = dim.drift(f, 0.02); pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    return dim.Cam(pos, look, fov=1.34, focus=5.5 - 1.0 * x, fstop=2.6)

def cam_shot3(f):
    x = (f - SHOT_START[3]) / max(1, SHOT_END[3] - SHOT_START[3])
    pos = (0.0 - 0.6 * x, 0.2, 1.2 + 1.2 * x); look = (0.0, -0.5, 6.5)
    dxx, dyy, dzz = dim.drift(f, 0.01); pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    return dim.Cam(pos, look, fov=1.30, focus=7.0 - 3.0 * x, fstop=3.0)

def cam_shot4(f):
    x = (f - SHOT_START[4]) / max(1, SHOT_END[4] - SHOT_START[4])
    pos = (0.0, 0.1, 2.6 + 0.6 * x); look = (0.05, 0.0, 6.0)
    dxx, dyy, dzz = dim.drift(f, 0.016); pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    # rack focus: cloud (far) -> ember (near) as x rises
    return dim.Cam(pos, look, fov=1.32, focus=6.6 - 4.0 * E.out_cubic(min(1.0, x * 1.3)), fstop=2.2)

def cam_shot5(f):
    x = (f - SHOT_START[5]) / max(1, SHOT_END[5] - SHOT_START[5])
    A = ((-0.2, 2.6, -2.4), (0.6, 0.4, 8.0)); B = ((0.6, 6.8, -7.6), (0.6, 1.4, 9.0))
    pos, look = dim.dolly(A, B, E.out_cubic(x)); dx, dy, dz = dim.drift(f, 0.016)
    pos = (pos[0] + dx, pos[1] + dy, pos[2] + dz)
    return dim.Cam(pos, look, fov=1.28, focus=8 + 22 * x, fstop=5.6)

CAMS = [cam_shot0, cam_shot1, cam_shot2, cam_shot3, cam_shot4, cam_shot5]

# ============================================================ PIL chrome per shot (composited over grade)
BONE = (232, 236, 240); MINT = (90, 240, 190); AMBER = (255, 150, 60); DIMW = (150, 160, 172)

def sun_disk(out, cx, cy, r, glow=1.0):
    """Composite a soft blood-orange smoke-dimmed sun disk into the sky (additive-ish soft light)."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    for i in range(10, 0, -1):
        rr = int(r * i / 4.0); a = int(26 * glow * (i / 10.0) ** 1.6)
        ld.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(255, 120, 48, a))
    ld.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 150, 70, int(150 * glow)))
    layer = layer.filter(ImageFilter.GaussianBlur(18))
    out.alpha_composite(layer)

def eyebrow_wordmark(dr, f):
    fnt = dc.mono(30, m=True); s = "ALASKA.AI  ·  FIELD SIGNAL"
    dr.text((104, 96), s, font=fnt, fill=(*dc.GOLD, 235))
    dc.logw(104, 96, dc.tw(s, fnt), fnt.size, dc.GOLD, 1.0, True, "hud")

def chrome_shot0(dr, f, t):
    # eyebrow + a quiet locator
    eyebrow_wordmark(dr, f)
    fnt = dc.mono(28); s = "INTERIOR ALASKA  ·  FIRE SEASON 2026"
    dr.text((104, 140), s, font=fnt, fill=(*BONE, 200))
    dc.logw(104, 140, dc.tw(s, fnt), fnt.size, BONE, 0.9, True, "hud")

def chrome_shot1(dr, f, t):
    eyebrow_wordmark(dr, f)
    pr = max(0.0, min(1.0, (t - 14.0) / 2.0))
    # labels for the two plumes
    lf = dc.mono(30, b=True)
    dr.text((150, 1120), "MODEL", font=lf, fill=(*BONE, int(235 * min(1, (t - 11.5)))))
    dr.text((760, 1120), "REAL", font=lf, fill=(*AMBER, int(235 * min(1, (t - 11.5)))))
    dc.logw(150, 1120, dc.tw("MODEL", lf), lf.size, BONE, min(1, max(0, t - 11.5)), True, "hud")
    dc.logw(760, 1120, dc.tw("REAL", lf), lf.size, AMBER, min(1, max(0, t - 11.5)), True, "hud")
    # 5x gap bracket + numeral, snaps in at ~14.5s
    if pr > 0.02:
        a = int(235 * pr); x0, x1 = 470, 610; y = 900
        dr.line([(x0, 760), (x0, 1040)], fill=(*BONE, a), width=4)
        nf = dc.fr(96, 900); s = "5x"; w = dc.tw(s, nf, 0.02)
        dc.tk(dr, s, nf, (255, 220, 130, a), (W - w) // 2, y - 60, 0.02)
        dc.logw((W - w) // 2, y - 60, w, nf.size, (255, 220, 130), pr, pr > 0.6, "hud")
        sf = dc.mono(26); s2 = "SURFACE SMOKE UNDERCOUNT"
        dr.text(((W - dc.tw(s2, sf)) // 2, y + 70), s2, font=sf, fill=(*DIMW, int(210 * pr)))

def chrome_shot2(dr, f, t):
    eyebrow_wordmark(dr, f)
    # a small pointer at the floating model plume (up high) vs the figure (down low)
    sf = dc.mono(28, m=True)
    a = int(220 * min(1.0, max(0.0, (t - 22.0))))
    dr.text((150, 360), "MODEL SAYS: THIN + HIGH", font=sf, fill=(*DIMW, a))
    dr.text((150, 1120), "HERE IS WHERE WE BREATHE", font=sf, fill=(*BONE, a))
    dc.logw(150, 1120, dc.tw("HERE IS WHERE WE BREATHE", sf), sf.size, BONE, min(1.0, max(0.0, t - 22.0)), True, "hud")

def chrome_shot3(dr, f, t):
    eyebrow_wordmark(dr, f)
    lf = dc.mono(30, b=True)
    dr.text((150, 1120), "HRRR-SMOKE", font=lf, fill=(*DIMW, 225))
    dr.text((760, 1120), "CNN", font=lf, fill=(*MINT, 235))
    dc.logw(760, 1120, dc.tw("CNN", lf), lf.size, MINT, 1.0, True, "hud")
    # 5x -> 2x collapse numeral near end of shot
    tc = (BOUNDS[3] / FPS)
    if t > tc + 7.0:
        pr = min(1.0, (t - (tc + 7.0)) / 2.0)
        nf = dc.fr(92, 900)
        s = "5x" if pr < 0.5 else "2x"
        col = (255, 210, 120) if pr < 0.5 else MINT
        w = dc.tw(s, nf, 0.02); dc.tk(dr, s, nf, (*col, 235), (W - w) // 2, 820, 0.02)
        dc.logw((W - w) // 2, 820, w, nf.size, col, 1.0, True, "hud")
        sf = dc.mono(26); s2 = "UNDERCOUNT, CORRECTED"
        dr.text(((W - dc.tw(s2, sf)) // 2, 930), s2, font=sf, fill=(*DIMW, 210))

def chrome_shot4(dr, f, t):
    eyebrow_wordmark(dr, f)
    # a detection reticle that sweeps and returns empty
    cx, cy = W // 2, 780; x = (f - SHOT_START[4]) / max(1, SHOT_END[4] - SHOT_START[4])
    r = int(120 + 40 * math.sin(t * 2.0)); a = 210
    dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(*MINT, a), width=3)
    dr.line([(cx - r - 20, cy), (cx - r + 6, cy)], fill=(*MINT, a), width=3)
    dr.line([(cx + r - 6, cy), (cx + r + 20, cy)], fill=(*MINT, a), width=3)
    sf = dc.mono(28, m=True); s = "DETECTION: NONE"
    dr.text(((W - dc.tw(s, sf)) // 2, 1120), s, font=sf, fill=(*AMBER, 230))
    dc.logw((W - dc.tw(s, sf)) // 2, 1120, dc.tw(s, sf), sf.size, AMBER, 1.0, True, "hud")
    s2 = "FIRE HIDDEN UNDER CLOUD"
    dr.text(((W - dc.tw(s2, dc.mono(26))) // 2, 1164), s2, font=dc.mono(26), fill=(*DIMW, 210))

def chrome_shot5(dr, f, t):
    eyebrow_wordmark(dr, f)
    sf = dc.mono(28, m=True); s = "FORECAST: CLOSER, SOONER"
    a = int(225 * min(1.0, max(0.0, (t - 52.5))))
    dr.text((104, 140), s, font=sf, fill=(*MINT, a))

CHROME = [chrome_shot0, chrome_shot1, chrome_shot2, chrome_shot3, chrome_shot4, chrome_shot5]

# ============================================================ render
_cur_shot = -1
def ensure_shot(si):
    global _cur_shot
    if si == _cur_shot:
        return
    s = SHOTS[si]; s["light"]()
    dim.SCENE_FN = s["scene"]; dim.MAT_FN = s["mat"]; dim.SHADOW_FN = s["shadow"]
    dim.init_kernels()
    _cur_shot = si

def render_range(s, e):
    import time as _t; _t0 = _t.time()
    for f in range(s, e):
        si = shot_of(f); ensure_shot(si)
        if f % 30 == 0:
            el = _t.time() - _t0; done = max(1, f - s)
            print(f"[render] frame {f}/{e} shot{si} elapsed={el:.0f}s eta={el/done*(e-f):.0f}s", flush=True)
        cam = CAMS[si](f); t = f / FPS
        rgb, z = dim.render_frame(cam, t=t)
        u8 = dim.post(rgb, z, cam, f=f)
        out = Image.fromarray(u8).convert("RGBA")
        if si == 0:
            sun_disk(out, W // 2, 560, 120, glow=1.0)
        elif si == 5:
            sun_disk(out, int(W * 0.62), 470, 105, glow=0.85)
        dc.set_frame_bg(out, f)
        dr = ImageDraw.Draw(out)
        CHROME[si](dr, f, t)
        dc.caption(out, f)
        dc.outro_card(out, f)
        dc.flush_textlog(f)
        Image.fromarray(np.asarray(out.convert("RGB"))).save(os.path.join(OUT, f"frame_{f:05d}.png"), compress_level=1)
    mpath = os.path.join(OUT, "..", "render_manifest.json") if os.environ.get("DIM_MANIFEST_UP") else os.path.join(OUT, "render_manifest.json")
    dim.write_manifest(mpath, NF, extra={"dispatch": "the-lid", "shots": NSHOT})

def main():
    s = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    e = int(sys.argv[2]) if len(sys.argv) > 2 else NF
    render_range(s, e)
    print(f"rendered [{s},{e}) scale={SCALE} arch={dim.ARCH}")

if __name__ == "__main__":
    main()
