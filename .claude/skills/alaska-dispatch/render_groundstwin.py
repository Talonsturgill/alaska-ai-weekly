"""render_groundstwin.py — 'THE GROUND'S TWIN' (Dispatch 2026-07-15).

A subsurface-cutaway dimensional film: a Utqiagvik road on frozen ground, a buried fiber-optic
nerve, a luminous indigo digital twin that forecasts the thaw a step ahead, and the honest limit
(it predicts the ground, it cannot freeze it back; one embankment, three years). Authored FRESH to
out/dispatch/storyboard.json — NOT copied from any prior render_*.py. Imports dimensional (3D engine,
now with the EMIT_FN self-illumination hook) + dispatch_core (brand chrome/captions/outro).

Five worlds, re-lit and re-composed per shot:
  1 THE ROAD ON THE ICE      wide-establish · surface-aerial · aerial-descent · overcast
  2 UNDER THE ROAD           push-detail · subsurface-cutaway · dolly-through
  3 THE PULSE BECOMES A TWIN macro-closeup · macro-on-fiber · rack-focus-macro
  4 THE TWIN RUNS AHEAD      two-up · real-vs-twin-diptych · track-follow
  5 IT PREDICTS...           alt-vantage · rise-to-context · rise-reveal + outro

Usage:  DIM_SCALE=1.0 python render_groundstwin.py <start> <end>
        DISPATCH_LOOKDEV=1 python render_groundstwin.py   -> raw probe stills (no captions/VO needed)
Env:    DIM_SCALE (0.4 look-dev, 1.0 ship), DIM_OUT (frame dir), DIM_MANIFEST_UP (manifest to ../).
"""
import os, sys, math, json
import numpy as np
import taichi as ti
import dimensional as dim

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("DIM_OUT") or os.path.join(HERE, "groundstwin_frames")
os.makedirs(OUT, exist_ok=True)
FPS = 30
NF = int(os.environ.get("DIM_NF", "1785"))          # 59.5s
SCALE = float(os.environ.get("DIM_SCALE", "1.0"))
LOOKDEV = os.environ.get("DISPATCH_LOOKDEV") == "1"

# shot frame boundaries (aligned to storyboard beats; 30fps)
SHOT_START = [0, 315, 630, 855, 1215]
SHOT_END   = [315, 630, 855, 1215, NF]
NSHOT = len(SHOT_START)

dim.init(1080, 1920, scale=SCALE)

# ---------------- palette (peat-brown ground · ice-blue lenses · rust thaw · indigo twin) ----------------
C_ACTIVE = ti.Vector([0.16, 0.14, 0.12])     # dark active layer / peat
C_PEAT   = ti.Vector([0.24, 0.19, 0.14])     # frozen peat-brown soil
C_ICE    = ti.Vector([0.55, 0.68, 0.80])     # glacial pale-blue ice lens
C_ICE_D  = ti.Vector([0.30, 0.42, 0.55])     # deeper ice
C_SNOW   = ti.Vector([0.86, 0.90, 0.95])     # bone snow crust
C_GRAVEL = ti.Vector([0.30, 0.29, 0.27])     # road gravel
C_RUST   = ti.Vector([0.62, 0.30, 0.14])     # warm thaw front (rust/ochre)
TWIN_GLOW = ti.Vector([0.36, 0.30, 1.05])    # indigo-violet twin emission
PULSE_GLOW = ti.Vector([0.55, 0.85, 1.15])   # cool cyan-white fiber pulse
WARM_TIP  = ti.Vector([1.10, 0.66, 0.28])    # warm stake tip (the one warm point)
RUST_GLOW = ti.Vector([0.85, 0.34, 0.12])    # emissive thaw-front band


# ================================================================= LIGHTS (one per shot family)
def light_surface():
    # flat, low, shadowless Arctic overcast from a pewter sky
    dim.SUN_DIR = (0.28, 0.42, 0.86); dim.SUN_COL = (0.86, 0.90, 0.98)
    dim.SKY_COL = (0.40, 0.44, 0.50); dim.SKY_HI = (0.62, 0.66, 0.72)
    dim.FOG_DEN = 0.022; dim.FOG_COL = (0.55, 0.58, 0.63); dim.RIM_STR = 0.35

def light_under():
    # underground: a dim cool key from above the cut, the rest carried by practical glow (emission)
    dim.SUN_DIR = (0.20, 0.80, 0.30); dim.SUN_COL = (0.42, 0.47, 0.56)
    dim.SKY_COL = (0.10, 0.12, 0.16); dim.SKY_HI = (0.16, 0.19, 0.24)
    dim.FOG_DEN = 0.030; dim.FOG_COL = (0.07, 0.08, 0.11); dim.RIM_STR = 0.45

def light_macro():
    dim.SUN_DIR = (0.35, 0.55, 0.55); dim.SUN_COL = (0.40, 0.44, 0.52)
    dim.SKY_COL = (0.08, 0.09, 0.13); dim.SKY_HI = (0.13, 0.15, 0.20)
    dim.FOG_DEN = 0.026; dim.FOG_COL = (0.06, 0.07, 0.10); dim.RIM_STR = 0.50

def light_diptych():
    dim.SUN_DIR = (0.10, 0.70, 0.40); dim.SUN_COL = (0.44, 0.48, 0.56)
    dim.SKY_COL = (0.09, 0.11, 0.15); dim.SKY_HI = (0.15, 0.17, 0.22)
    dim.FOG_DEN = 0.028; dim.FOG_COL = (0.07, 0.08, 0.12); dim.RIM_STR = 0.45

def light_reveal():
    dim.SUN_DIR = (0.30, 0.40, 0.84); dim.SUN_COL = (0.78, 0.82, 0.92)
    dim.SKY_COL = (0.20, 0.23, 0.29); dim.SKY_HI = (0.40, 0.44, 0.52)
    dim.FOG_DEN = 0.030; dim.FOG_COL = (0.30, 0.33, 0.40); dim.RIM_STR = 0.40


# ================================================================= helpers
@ti.func
def _road_berm(p):
    # a long gravel embankment crossing in x, crowned, centered on z=6
    return dim.sd_rbox(p, ti.Vector([0.0, 0.02, 6.0]), ti.Vector([6.5, 0.30, 1.35]), 0.10)

@ti.func
def _pulse_x(t):
    # a pulse bead sweeping along the fiber, wrapping
    return -2.4 + (ti.math.mod(t * 1.4, 2.0)) * 2.6

# ================================================================= SHOT 1 — THE ROAD ON THE ICE
@ti.func
def sceneA(p, t):
    ground = p.y + 0.32 + 0.05 * dim.fbm2(p.x * 0.7, p.z * 0.7)
    d = ground
    d = dim.smin(d, _road_berm(p), 0.25)                                   # embankment
    stake = dim.sd_capsule(p, ti.Vector([1.7, -0.1, 5.0]), ti.Vector([1.7, 0.66, 5.0]), 0.035)
    d = ti.min(d, stake)
    conduit = dim.sd_capsule(p, ti.Vector([1.7, 0.0, 5.0]), ti.Vector([1.7, -1.1, 5.0]), 0.03)
    d = ti.min(d, conduit)
    return d

@ti.func
def matA(p, n, t):
    col = C_SNOW
    if p.y < 0.30 and dim.sd_rbox(p, ti.Vector([0.0, 0.02, 6.0]), ti.Vector([6.5, 0.30, 1.35]), 0.10) < 0.04:
        col = C_GRAVEL
    st = dim.sd_capsule(p, ti.Vector([1.7, -0.1, 5.0]), ti.Vector([1.7, 0.66, 5.0]), 0.035)
    if st < 0.05:
        col = ti.Vector([0.20, 0.22, 0.26])
        if p.y > 0.56:
            col = WARM_TIP
    return col

@ti.func
def shadowA(p, t):
    return ti.min(p.y + 0.32, _road_berm(p))

@ti.func
def emitA(p, t):
    e = ti.Vector([0.0, 0.0, 0.0])
    if p.y > 0.56 and dim.sd_capsule(p, ti.Vector([1.7, -0.1, 5.0]), ti.Vector([1.7, 0.66, 5.0]), 0.05) < 0.05:
        e = WARM_TIP * 1.4
    return e


# ================================================================= SHOT 2 — UNDER THE ROAD (cutaway)
# A vertical cut face: everything with z in front of the face is empty; layers by depth (p.y).
ZF = 5.4   # cut-face plane
@ti.func
def _strata(p):
    # the solid ground block behind the cut face
    block = ti.max(ZF - p.z, -(p.y + 2.6))          # keep the block BEHIND the cut face; floor at y=-2.6
    block = ti.max(block, p.y - 0.30)               # top surface (with the road crown just above)
    block = ti.max(block, ti.abs(p.x) - 4.2)        # side walls
    block = ti.max(block, p.z - (ZF + 3.2))         # back wall
    return block

@ti.func
def _ice_wedge(p):
    # a downward ice wedge near x=-1, classic permafrost polygon wedge
    q = ti.Vector([p.x + 1.1, p.y + 0.2, p.z - (ZF + 1.0)])
    w = ti.max(ti.abs(q.x) * 1.4 + q.y * 0.5, -q.y - 1.6)
    return ti.max(w - 0.08, ti.abs(q.z) - 1.4)

@ti.func
def sceneB(p, t):
    d = _strata(p)
    # ice lenses (ellipsoids) embedded, read as slightly proud on the face
    l1 = dim.sd_ellipsoid(p, ti.Vector([0.9, -0.9, ZF + 0.4]), ti.Vector([0.9, 0.16, 0.5]))
    l2 = dim.sd_ellipsoid(p, ti.Vector([-1.8, -1.5, ZF + 0.5]), ti.Vector([0.7, 0.13, 0.5]))
    d = ti.min(d, ti.max(l1, p.z - ZF - 0.02))
    d = ti.min(d, ti.max(l2, p.z - ZF - 0.02))
    # the buried fiber: a thin horizontal cable across the face at y=-0.55
    fib = dim.sd_capsule(p, ti.Vector([-3.6, -0.55, ZF + 0.02]), ti.Vector([3.6, -0.55, ZF + 0.02]), 0.045)
    d = ti.min(d, fib)
    # the travelling pulse bead
    bead = dim.sd_sphere(p, ti.Vector([_pulse_x(t) * 1.4, -0.55, ZF + 0.06]), 0.11)
    d = ti.min(d, bead)
    return d

@ti.func
def matB(p, n, t):
    col = C_PEAT
    if p.y > -0.05:
        col = C_ACTIVE                                  # dark active layer near surface
    if p.y < -1.7:
        col = C_ICE_D                                   # deep ice-rich
    # ice lenses
    l1 = dim.sd_ellipsoid(p, ti.Vector([0.9, -0.9, ZF + 0.4]), ti.Vector([0.9, 0.16, 0.5]))
    l2 = dim.sd_ellipsoid(p, ti.Vector([-1.8, -1.5, ZF + 0.5]), ti.Vector([0.7, 0.13, 0.5]))
    if ti.min(l1, l2) < 0.05:
        col = C_ICE
    if _ice_wedge(p) < 0.06:
        col = C_ICE
    fib = dim.sd_capsule(p, ti.Vector([-3.6, -0.55, ZF + 0.02]), ti.Vector([3.6, -0.55, ZF + 0.02]), 0.05)
    if fib < 0.05:
        col = ti.Vector([0.10, 0.12, 0.16])
    return col

@ti.func
def shadowB(p, t):
    return _strata(p)

@ti.func
def emitB(p, t):
    e = ti.Vector([0.0, 0.0, 0.0])
    fib = dim.sd_capsule(p, ti.Vector([-3.6, -0.55, ZF + 0.02]), ti.Vector([3.6, -0.55, ZF + 0.02]), 0.06)
    if fib < 0.06:
        e = PULSE_GLOW * 0.28                            # faint always-on fiber line
    bead = dim.sd_sphere(p, ti.Vector([_pulse_x(t) * 1.4, -0.55, ZF + 0.06]), 0.14)
    if bead < 0.14:
        e = PULSE_GLOW * 1.8                             # bright travelling pulse
    return e


# ================================================================= SHOT 3 — THE PULSE BECOMES A TWIN
@ti.func
def sceneC(p, t):
    assemble = ti.math.clamp((t - 21.5) / 4.5, 0.0, 1.0)
    # macro fiber cable across the lower frame
    fib = dim.sd_capsule(p, ti.Vector([-3.0, -0.7, 6.2]), ti.Vector([3.0, -0.7, 6.2]), 0.10)
    d = fib
    # the node (a small box) where the pulse arrives
    node = dim.sd_rbox(p, ti.Vector([0.0, -0.7, 6.2]), ti.Vector([0.18, 0.14, 0.14]), 0.03)
    d = ti.min(d, node)
    # the twin lattice: a 3D grid of small spheres growing upward from the node
    q = p - ti.Vector([0.0, -0.4, 6.2])
    q.x -= 0.62 * ti.round(q.x / 0.62)
    q.y -= 0.62 * ti.round(ti.math.clamp(q.y, 0.0, 2.4) / 0.62)
    q.z -= 0.62 * ti.round(q.z / 0.62)
    latr = 0.05 + 0.05 * assemble
    lat = ti.Vector([q.x, q.y, q.z]).norm() - latr
    # bound the lattice volume so it reads as a block above the node
    latbound = ti.max(ti.abs(p.x) - 1.5 * assemble - 0.1, ti.max((p.y + 0.4) - 2.4 * assemble, -(p.y + 0.4)))
    lat = ti.max(lat, latbound)
    d = ti.min(d, lat)
    return d

@ti.func
def matC(p, n, t):
    col = ti.Vector([0.12, 0.13, 0.17])
    if p.y > -0.5:
        col = TWIN_GLOW * 0.4
    return col

@ti.func
def shadowC(p, t):
    return dim.sd_capsule(p, ti.Vector([-3.0, -0.7, 6.2]), ti.Vector([3.0, -0.7, 6.2]), 0.10)

@ti.func
def emitC(p, t):
    assemble = ti.math.clamp((t - 21.5) / 4.5, 0.0, 1.0)
    e = ti.Vector([0.0, 0.0, 0.0])
    node = dim.sd_rbox(p, ti.Vector([0.0, -0.7, 6.2]), ti.Vector([0.18, 0.14, 0.14]), 0.03)
    if node < 0.06:
        e = PULSE_GLOW * 2.0
    if p.y > -0.5:
        q = p - ti.Vector([0.0, -0.4, 6.2])
        q.x -= 0.62 * ti.round(q.x / 0.62)
        q.y -= 0.62 * ti.round(ti.math.clamp(q.y, 0.0, 2.4) / 0.62)
        q.z -= 0.62 * ti.round(q.z / 0.62)
        if ti.Vector([q.x, q.y, q.z]).norm() - (0.05 + 0.05 * assemble) < 0.05:
            e = TWIN_GLOW * (1.2 + 0.6 * assemble)
    return e


# ================================================================= SHOT 4 — THE TWIN RUNS AHEAD (diptych)
@ti.func
def _thaw_y(t):
    # thaw front descends across the shot (28.5..40.5s)
    return 0.2 - 1.6 * ti.math.clamp((t - 29.0) / 8.0, 0.0, 1.0)

@ti.func
def sceneD(p, t):
    # two ground blocks: real (x<-0.15) cold, twin (x>0.15) luminous
    real = ti.max(ti.abs(p.x + 1.7) - 1.4, ti.max(p.y - 0.4, -(p.y + 2.2)))
    real = ti.max(real, ti.abs(p.z - 6.0) - 1.0)
    twin = ti.max(ti.abs(p.x - 1.7) - 1.4, ti.max(p.y - 0.4, -(p.y + 2.2)))
    twin = ti.max(twin, ti.abs(p.z - 6.0) - 1.0)
    return ti.min(real, twin)

@ti.func
def matD(p, n, t):
    ty = _thaw_y(t)
    col = C_PEAT
    if p.x < 0.0:                                   # REAL side, cold blue-ish frozen
        col = C_ICE_D * 0.7 + C_PEAT * 0.3
        if p.y < ty - 0.25:                         # real front trails the twin
            col = C_RUST
    else:                                           # TWIN side
        col = TWIN_GLOW * 0.45
        if p.y < ty:                                # twin front leads
            col = C_RUST
    return col

@ti.func
def shadowD(p, t):
    real = ti.max(ti.abs(p.x + 1.7) - 1.4, ti.max(p.y - 0.4, -(p.y + 2.2)))
    twin = ti.max(ti.abs(p.x - 1.7) - 1.4, ti.max(p.y - 0.4, -(p.y + 2.2)))
    return ti.min(real, twin)

@ti.func
def emitD(p, t):
    ty = _thaw_y(t)
    e = ti.Vector([0.0, 0.0, 0.0])
    if p.x > 0.15:
        e = TWIN_GLOW * 0.5
        if p.y < ty and p.y > ty - 0.22:            # bright leading forecast band (with tolerance)
            e = RUST_GLOW * 1.6
    if p.x < -0.15 and p.y < ty - 0.25 and p.y > ty - 0.5:
        e = RUST_GLOW * 0.7                          # real front, dimmer, trailing
    return e


# ================================================================= SHOT 5 — RISE-REVEAL + OUTRO
@ti.func
def sceneE(p, t):
    ground = p.y + 0.34 + 0.06 * dim.fbm2(p.x * 0.5, p.z * 0.5)
    d = ground
    d = dim.smin(d, _road_berm(p), 0.25)
    stake = dim.sd_capsule(p, ti.Vector([1.7, -0.1, 5.0]), ti.Vector([1.7, 0.6, 5.0]), 0.035)
    d = ti.min(d, stake)
    return d

@ti.func
def matE(p, n, t):
    col = C_SNOW * 0.7
    if dim.sd_rbox(p, ti.Vector([0.0, 0.02, 6.0]), ti.Vector([6.5, 0.30, 1.35]), 0.10) < 0.05 and p.y < 0.30:
        col = C_GRAVEL
    if dim.sd_capsule(p, ti.Vector([1.7, -0.1, 5.0]), ti.Vector([1.7, 0.6, 5.0]), 0.05) < 0.06 and p.y > 0.5:
        col = WARM_TIP
    return col

@ti.func
def shadowE(p, t):
    return ti.min(p.y + 0.34, _road_berm(p))

@ti.func
def emitE(p, t):
    e = ti.Vector([0.0, 0.0, 0.0])
    if dim.sd_capsule(p, ti.Vector([1.7, -0.1, 5.0]), ti.Vector([1.7, 0.6, 5.0]), 0.06) < 0.06 and p.y > 0.5:
        e = WARM_TIP * 1.5
    # a faint rust thaw-front glow line advancing past the stake into the dark
    if p.y < -0.15 and p.y > -0.35 and p.x > 1.9:
        e = RUST_GLOW * 0.5
    return e


SHOTS = [
    dict(scene=sceneA, mat=matA, shadow=shadowA, emit=emitA, light=light_surface),
    dict(scene=sceneB, mat=matB, shadow=shadowB, emit=emitB, light=light_under),
    dict(scene=sceneC, mat=matC, shadow=shadowC, emit=emitC, light=light_macro),
    dict(scene=sceneD, mat=matD, shadow=shadowD, emit=emitD, light=light_diptych),
    dict(scene=sceneE, mat=matE, shadow=shadowE, emit=emitE, light=light_reveal),
]

def shot_of(f):
    for i in range(NSHOT):
        if SHOT_START[i] <= f < SHOT_END[i]:
            return i
    return NSHOT - 1

# ---------------- cameras ----------------
def camA(f):
    x = (f - SHOT_START[0]) / max(1, SHOT_END[0] - SHOT_START[0])
    A = ((0.4, 4.6, -1.2), (0.5, 0.1, 6.0)); B = ((0.5, 1.9, 1.4), (0.6, -0.1, 6.0))
    pos, look = dim.dolly(A, B, dim.ease_io(x)); dx, dy, dz = dim.drift(f, 0.014)
    return dim.Cam((pos[0]+dx, pos[1]+dy, pos[2]+dz), look, fov=1.26, focus=22 - 15*x, fstop=5.0)

def camB(f):
    x = (f - SHOT_START[1]) / max(1, SHOT_END[1] - SHOT_START[1])
    A = ((0.0, 0.7, 1.4), (0.0, -0.7, 6.0)); B = ((0.2, -0.2, 3.0), (0.1, -0.8, 6.0))
    pos, look = dim.dolly(A, B, dim.ease_io(x)); dx, dy, dz = dim.drift(f, 0.012)
    focus = 4.4 - 1.4*x
    return dim.Cam((pos[0]+dx, pos[1]+dy, pos[2]+dz), look, fov=1.22, focus=focus, fstop=3.0)

def camC(f):
    x = (f - SHOT_START[2]) / max(1, SHOT_END[2] - SHOT_START[2])
    pos = (0.0, -0.2, 3.9 + 0.5*x); look = (0.0, -0.35, 6.2)
    dx, dy, dz = dim.drift(f, 0.016)
    rack = dim.ease_io(min(1.0, x*1.3))
    focus = 2.4*(1-rack) + 3.7*rack                 # rack cable(near) -> lattice(far)
    return dim.Cam((pos[0]+dx, pos[1]+dy, pos[2]+dz), look, fov=1.30, focus=focus, fstop=2.2)

def camD(f):
    x = (f - SHOT_START[3]) / max(1, SHOT_END[3] - SHOT_START[3])
    pos = (0.0, 0.35 - 0.5*x, 2.4); look = (0.0, -0.35 - 0.4*x, 6.0)   # track the descending front
    dx, dy, dz = dim.drift(f, 0.010)
    return dim.Cam((pos[0]+dx, pos[1]+dy, pos[2]+dz), look, fov=1.24, focus=4.0, fstop=3.2)

def camE(f):
    x = (f - SHOT_START[4]) / max(1, SHOT_END[4] - SHOT_START[4])
    A = ((1.4, 0.3, 3.2), (1.5, -0.2, 5.4)); B = ((0.4, 5.2, -2.0), (0.5, 0.2, 6.2))
    pos, look = dim.dolly(A, B, dim.ease_io(x)); dx, dy, dz = dim.drift(f, 0.014)
    return dim.Cam((pos[0]+dx, pos[1]+dy, pos[2]+dz), look, fov=1.26, focus=3.0 + 17*x, fstop=5.0)

CAMS = [camA, camB, camC, camD, camE]

# ---------------- kernel management ----------------
_cur = -1
def ensure_shot(si):
    global _cur
    if si == _cur:
        return
    s = SHOTS[si]; s["light"]()
    dim.SCENE_FN = s["scene"]; dim.MAT_FN = s["mat"]; dim.SHADOW_FN = s["shadow"]; dim.EMIT_FN = s["emit"]
    dim.init_kernels()
    _cur = si

# ============================================================ BRAND CHROME (PIL, over the grade)
# Two-phase per shot: a PLATE pass bakes the caption scrim + label chips into the picture BEFORE
# dc.set_frame_bg samples luma (so READABILITY measures what the viewer sees), then a TEXT pass
# draws the ink + logs each word. Composited OVER dim.post() so captions/HUD stay razor sharp.
from PIL import Image, ImageDraw, ImageFilter
BONE = (232, 236, 240); INDIGO = (150, 140, 245); AMBER = (255, 170, 90); DIMW = (196, 204, 218)
CHIPC = (10, 12, 20)
_dc = None
def dc_mod():
    global _dc
    if _dc is None:
        import dispatch_core as _m; _dc = _m
    return _dc

_SCRIM = None
def caption_scrim(out):
    global _SCRIM
    if _SCRIM is None:
        y = np.arange(1920, dtype=np.float32)[:, None]
        up = np.clip((y - 1300.0) / 170.0, 0.0, 1.0); dn = 1.0 - 0.45 * np.clip((y - 1620.0) / 300.0, 0.0, 1.0)
        aa = (up * dn * 0.55 * 255.0).astype(np.uint8)
        rgba = np.zeros((1920, 1080, 4), np.uint8); rgba[..., 0] = 6; rgba[..., 1] = 8; rgba[..., 2] = 14
        rgba[..., 3] = np.repeat(aa, 1080, axis=1); _SCRIM = Image.fromarray(rgba, "RGBA")
    out.alpha_composite(_SCRIM)

def chip(out, x, y, w, h, a, padx=20, pady=12, rad=12):
    if a <= 0.02 or w <= 0:
        return
    aa = min(1.0, a); lead = min(1.0, a * 1.6); op = 0.78 + 0.15 * (1.0 - aa)
    layer = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    d.rounded_rectangle([x - padx, y - pady, x + w + padx, y + h + pady], radius=rad, fill=(*CHIPC, int(255 * op * lead)))
    out.alpha_composite(layer.filter(ImageFilter.GaussianBlur(1.5)))

def lab(ctx, x, y, s, fnt, fill, a, log=True, kind="hud", tr=0.0):
    dc = dc_mod(); w = dc.tw(s, fnt, tr)
    if a <= 0.02:
        return w
    if ctx[0] == "plate":
        chip(ctx[1], x, y, w, fnt.size, a)
    else:
        dc.tk(ctx[1], s, fnt, (*fill, int(235 * a)), x, y, tr)
        if log:
            dc.logw(x, y, w, fnt.size, fill, a, True, kind)
    return w

def eyebrow(ctx, f):
    lab(ctx, 104, 96, "ALASKA.AI  ·  FIELD SIGNAL", dc_mod().mono(30, m=True), dc_mod().GOLD, 1.0)

def _appear(t, t0, d=1.6):
    import easing as E
    return E.out_cubic(max(0.0, min(1.0, (t - t0) / d)))

# per-shot HUD (approved on-screen numbers; numerals; no dashes)
def chrome0(ctx, f, t):
    dc = dc_mod(); eyebrow(ctx, f)
    lab(ctx, 104, 152, "UTQIAGVIK, ALASKA", dc.mono(30, b=True), BONE, _appear(t, 0.8))

def chrome1(ctx, f, t):
    dc = dc_mod(); eyebrow(ctx, f)
    a = _appear(t, 15.0)
    lab(ctx, 104, 152, "BURIED FIBER OPTIC SENSOR", dc.mono(28, m=True), INDIGO, a)
    if a > 0.02:
        nf = dc.fr(66, 900); s = "2 CABLES  ·  1 KM EACH"; w = dc.tw(s, nf, 0.01)
        lab(ctx, (1080 - w) // 2, 980, s, nf, BONE, a, tr=0.01)

def chrome2(ctx, f, t):
    dc = dc_mod(); eyebrow(ctx, f)
    a = _appear(t, 20.5)
    lab(ctx, 104, 152, "THE DIGITAL TWIN", dc.mono(30, b=True), INDIGO, a)
    lab(ctx, 104, 200, "PHYSICS + MACHINE LEARNING", dc.mono(26), DIMW, a)
    a2 = _appear(t, 24.0)
    lab(ctx, 104, 1236, "LIVE DATA  ·  SEPT 2021 TO JUNE 2024", dc.mono(27, m=True), BONE, a2)

def chrome3(ctx, f, t):
    dc = dc_mod(); eyebrow(ctx, f)
    a = _appear(t, 28.8)
    lf = dc.mono(30, b=True)
    lab(ctx, 150, 1236, "TWIN", lf, INDIGO, a)
    rt = "REAL"; wr = dc.tw(rt, lf); lab(ctx, 1080 - 150 - wr, 1236, rt, lf, BONE, a)
    a2 = _appear(t, 32.0)
    s = "FORECAST  ·  A STEP AHEAD"; sf = dc.mono(28, m=True); w = dc.tw(s, sf)
    lab(ctx, (1080 - w) // 2, 300, s, sf, AMBER, a2)

def chrome4(ctx, f, t):
    dc = dc_mod(); eyebrow(ctx, f)
    a = _appear(t, 41.0)
    s = "IT PREDICTS  ·  IT CANNOT STOP IT"; sf = dc.mono(30, b=True); w = dc.tw(s, sf)
    lab(ctx, (1080 - w) // 2, 200, s, sf, AMBER, a)
    a2 = _appear(t, 45.0)
    s2 = "ONE ROAD  ·  THREE YEARS OF DATA"; sf2 = dc.mono(27, m=True); w2 = dc.tw(s2, sf2)
    lab(ctx, (1080 - w2) // 2, 252, s2, sf2, DIMW, a2)

CHROME = [chrome0, chrome1, chrome2, chrome3, chrome4]

def render_range(s, e, save_dir=OUT):
    import time as _t; _t0 = _t.time()
    dc = dc_mod()
    for f in range(s, e):
        si = shot_of(f); ensure_shot(si)
        if f % 30 == 0:
            el = _t.time() - _t0; done = max(1, f - s)
            print(f"[render] f{f}/{e} shot{si} el={el:.0f}s eta={el/done*(e-f):.0f}s", flush=True)
        cam = CAMS[si](f); t = f / FPS
        rgb, z = dim.render_frame(cam, t=t)
        u8 = dim.post(rgb, z, cam, f=f)
        out = Image.fromarray(u8).convert("RGBA")
        caption_scrim(out)
        CHROME[si](("plate", out), f, t)           # PLATE: bake scrim + chips, then sample luma
        dc.set_frame_bg(out, f)
        dr = ImageDraw.Draw(out)
        CHROME[si](("text", dr), f, t)             # TEXT: ink + logw
        dc.caption(out, f)
        dc.outro_card(out, f)
        dc.flush_textlog(f)
        Image.fromarray(np.asarray(out.convert("RGB"))).save(os.path.join(save_dir, f"frame_{f:05d}.png"), compress_level=1)
    mpath = os.path.join(save_dir, "..", "render_manifest.json") if os.environ.get("DIM_MANIFEST_UP") else os.path.join(save_dir, "render_manifest.json")
    try:
        old = json.load(open(mpath)).get("samples", [])
        seen = {q["f"] for q in dim.MANIFEST}
        dim.MANIFEST.extend(q for q in old if q["f"] not in seen)
        dim.MANIFEST.sort(key=lambda q: q["f"])
    except Exception:
        pass
    dim.write_manifest(mpath, NF, extra={"dispatch": "the-grounds-twin", "shots": NSHOT})

def emit_shots():
    dc = dc_mod()
    fr = ["wide-establish", "push-detail", "macro-closeup", "two-up", "alt-vantage"]
    tr = ["", "push-in", "carried-element", "match-action", "pull-out"]
    notes = ["the road on the ice, warm-lit stake", "cutaway: strata, ice lenses, buried fiber + pulse",
             "macro: sensor node blooms the digital-twin lattice", "diptych: twin leads, real trails the thaw front",
             "rise-reveal to one instrumented road in the vast Arctic, outro"]
    dc.write_shots([{"id": i + 1, "start": SHOT_START[i], "end": SHOT_END[i], "framing": fr[i],
                     "transition_in": tr[i], "note": notes[i]} for i in range(NSHOT)], NF)

def lookdev():
    """Raw probe stills (no captions) to validate geometry/light/palette before the full build."""
    from PIL import Image
    d = os.path.join(HERE, "lookdev_gt"); os.makedirs(d, exist_ok=True)
    probes = [(0, 120), (1, 470), (2, 740), (3, 1000), (4, 1500)]
    for si, f in probes:
        ensure_shot(si)
        cam = CAMS[si](f); t = f / FPS
        rgb, z = dim.render_frame(cam, t=t)
        u8 = dim.post(rgb, z, cam, f=f)
        Image.fromarray(u8).save(os.path.join(d, f"probe_shot{si}_{f:05d}.png"), compress_level=3)
        print(f"probe shot{si} f{f} -> {d}", flush=True)

def _load_shot_bounds():
    """Align shot boundaries to the ACTUAL VO (audio/timing60.json shot_bounds), so the picture
    cuts where the narration turns. Falls back to the storyboard defaults if timing is absent."""
    global SHOT_START, SHOT_END
    try:
        tb = json.load(open(os.path.join(HERE, "audio", "timing60.json"))).get("shot_bounds")
        if tb and len(tb) == NSHOT:
            SHOT_START = [0] + tb[1:]
            SHOT_END = tb[1:] + [NF]
            print("shot bounds from VO:", list(zip(SHOT_START, SHOT_END)), flush=True)
    except Exception as ex:
        print("shot bounds: using storyboard defaults (", ex, ")", flush=True)

if __name__ == "__main__":
    if LOOKDEV:
        lookdev()
    else:
        _load_shot_bounds()
        s = int(sys.argv[1]) if len(sys.argv) > 1 else 0
        e = int(sys.argv[2]) if len(sys.argv) > 2 else NF
        emit_shots()
        render_range(s, e)
        print(f"rendered [{s},{e}) scale={SCALE} arch={dim.ARCH}")
