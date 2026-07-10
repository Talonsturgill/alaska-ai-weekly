"""demo_dimensional.py — 'BRISTOL BAY, DAWN': the dimensional engine's proof piece.

An 18s cinematic: a low-poly Alaska river valley at dawn. Ridgelines recede into layered valley
fog (atmospheric perspective), a glacial river S-curves down the valley floor with the sockeye
run beneath the surface, spruce stands hold the banks, and a survey drone rises into a slow
dolly-through with a rack focus. Full filmic finish (depth DOF, halation, split-tone, grain).
Usage:  python demo_dimensional.py <start> <end>
"""
import os, sys, math
import numpy as np
import taichi as ti
import dimensional as dim

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("DIM_OUT") or os.path.join(HERE, "demo3d_frames")
os.makedirs(OUT, exist_ok=True)
FPS = 30
NF = 540  # 18s

dim.init(1080, 1920)

# ---- palette: cold dawn — steel-blue valley, hot amber sun, crimson run ----
dim.SUN_DIR = (0.55, 0.30, 0.72)           # low dawn sun UP-VALLEY so we shoot into the light
dim.SUN_COL = (1.35, 0.90, 0.52)
dim.SKY_COL = (0.22, 0.30, 0.46)
dim.SKY_HI = (0.55, 0.58, 0.72)
dim.FOG_DEN = 0.010
dim.FOG_COL = (0.52, 0.58, 0.70)
dim.RIM_STR = 0.65

RIV_A = 1.6   # river meander amplitude


@ti.func
def _riv_x(z):
    return RIV_A * ti.sin(z * 0.14) + 0.6 * ti.sin(z * 0.31)


@ti.func
def _scene(p, t):
    rx = _riv_x(p.z)
    dx = p.x - rx
    adx = ti.abs(dx)

    # VALLEY FLOOR: banks rise away from the channel; gentle displacement
    chan = ti.math.clamp(1.0 - adx / 3.0, 0.0, 1.0)          # 1 in the channel -> dig it
    ground = p.y + 0.20 + 0.16 * ti.math.clamp(adx - 2.0, 0.0, 8.0) \
        + 0.05 * dim.fbm2(p.x * 0.8, p.z * 0.8) + 0.34 * chan * chan
    d = ground

    # WATER: darker plane slightly below the banks, only inside the channel, softly rippled
    inch = ti.math.clamp(1.0 - adx / 2.1, 0.0, 1.0)
    wat = p.y + 0.34 + 0.012 * ti.sin(p.x * 5.0 + t * 2.0) * ti.sin(p.z * 3.4 - t * 1.5)
    d = ti.min(d, wat + (1.0 - inch) * 30.0)

    # RIDGELINES: three receding ranges with faceted noise
    r1 = dim.sd_ellipsoid(p, ti.Vector([-8.0, -1.6, 16.0]), ti.Vector([10.0, 4.0, 7.0]))
    r2 = dim.sd_ellipsoid(p, ti.Vector([9.0, -1.8, 24.0]), ti.Vector([11.0, 5.4, 8.0]))
    r3 = dim.sd_ellipsoid(p, ti.Vector([-1.0, -2.2, 36.0]), ti.Vector([18.0, 7.5, 10.0]))
    ridge = ti.min(r1, ti.min(r2, r3)) + 0.30 * dim.fbm2(p.x * 0.45 + 3.0, p.z * 0.45)
    d = dim.smin(d, ridge, 0.8)

    # SPRUCE STANDS: proper cones, domain-repeated along both banks
    for sgn in ti.static((-1.0, 1.0)):
        off = rx + sgn * (3.4 + 0.7 * ti.sin(p.z * 0.53))
        q = ti.Vector([p.x - off, p.y, p.z])
        q.z -= 2.3 * ti.round(q.z / 2.3)
        q.x += 0.5 * ti.sin(p.z * 1.7)
        # cone: radius shrinks with height, height ~1.6
        hgt = ti.math.clamp((q.y + 0.25) / 1.25, 0.0, 1.0)
        rad = 0.34 * (1.0 - hgt) + 0.015
        cone = ti.Vector([q.x, q.z]).norm() - rad
        cone = ti.max(cone, ti.abs(q.y + 0.25 - 0.62) - 0.66)
        d = ti.min(d, cone)

    # THE RUN: sockeye forms beneath the surface, swimming up-river
    fz = p.z + t * 0.9
    cell = ti.round(fz / 2.8)
    fxo = 0.55 * ti.sin(cell * 2.1)
    fq = ti.Vector([dx - fxo, p.y, fz - 2.8 * cell])
    fish = dim.sd_ellipsoid(fq, ti.Vector([0.0, -0.36, 0.0]), ti.Vector([0.11, 0.055, 0.30]))
    d = ti.min(d, fish + (1.0 - inch) * 30.0)

    # THE DRONE: crisp hero — flat rounded-box body, 4 thin arms, rotor disks
    rise = ti.math.clamp((t - 3.5) / 3.0, 0.0, 1.0)
    rise = rise * rise * (3.0 - 2.0 * rise)
    dc = ti.Vector([1.9, -0.02 + 1.9 * rise + 0.05 * ti.sin(t * 2.1), 5.2])
    body = dim.sd_rbox(p, dc, ti.Vector([0.15, 0.045, 0.15]), 0.035)
    dr = body
    for i in ti.static(range(4)):
        ax = 0.26 if i % 2 == 0 else -0.26
        az = 0.26 if i < 2 else -0.26
        arm = dim.sd_capsule(p, dc, dc + ti.Vector([ax, 0.02, az]), 0.025)
        disk = dim.sd_ellipsoid(p, dc + ti.Vector([ax, 0.07, az]), ti.Vector([0.10, 0.010, 0.10]))
        dr = ti.min(dr, ti.min(arm, disk))
    d = ti.min(d, dr)
    return d


@ti.func
def _mat(p, n, t):
    rx = _riv_x(p.z)
    dx = p.x - rx
    adx = ti.abs(dx)
    inch = ti.math.clamp(1.0 - adx / 2.1, 0.0, 1.0)
    # valley floor: cold sage gravel, lighter at the waterline
    col = ti.Vector([0.26, 0.25, 0.19]) + 0.05 * ti.math.clamp(1.4 - adx * 0.4, 0.0, 1.0)
    if p.y < -0.22 and inch > 0.15:
        col = ti.Vector([0.15, 0.15, 0.12])               # damp gravel at the waterline
    if p.y < -0.315 and p.y > -0.42 and inch > 0.45:
        col = ti.Vector([0.06, 0.15, 0.21])               # glacial water
    # the run: crimson only within the fish's own skin (proximity to the fish field)
    fz = p.z + t * 0.9
    cell = ti.round(fz / 2.8)
    fxo = 0.55 * ti.sin(cell * 2.1)
    fq = ti.Vector([dx - fxo, p.y, fz - 2.8 * cell])
    ff = dim.sd_ellipsoid(fq, ti.Vector([0.0, -0.36, 0.0]), ti.Vector([0.11, 0.055, 0.30]))
    if ff < 0.03 and inch > 0.4:
        col = ti.Vector([0.50, 0.10, 0.08])
    if p.y > 0.55:
        col = ti.Vector([0.34, 0.33, 0.38])               # ridge rock
        if n.y > 0.72 and p.y > 1.6:
            col = ti.Vector([0.78, 0.80, 0.84])           # snow on the high flats
    # spruce: recompute the cone field; anything within its skin is deep green
    spr = 9.9
    for sgn in ti.static((-1.0, 1.0)):
        off = rx + sgn * (3.4 + 0.7 * ti.sin(p.z * 0.53))
        q = ti.Vector([p.x - off, p.y, p.z])
        q.z -= 2.3 * ti.round(q.z / 2.3)
        q.x += 0.5 * ti.sin(p.z * 1.7)
        hgt = ti.math.clamp((q.y + 0.25) / 1.25, 0.0, 1.0)
        rad = 0.34 * (1.0 - hgt) + 0.015
        c2 = ti.Vector([q.x, q.z]).norm() - rad
        c2 = ti.max(c2, ti.abs(q.y + 0.25 - 0.62) - 0.66)
        spr = ti.min(spr, c2)
    if spr < 0.05:
        col = ti.Vector([0.07, 0.17, 0.11])
    # drone: recompute its SDF; material only within its skin (no leaking bands)
    rise = ti.math.clamp((t - 3.5) / 3.0, 0.0, 1.0)
    rise = rise * rise * (3.0 - 2.0 * rise)
    dc = ti.Vector([1.9, -0.02 + 1.9 * rise + 0.05 * ti.sin(t * 2.1), 5.2])
    ddr = dim.sd_rbox(p, dc, ti.Vector([0.15, 0.045, 0.15]), 0.035)
    for i in ti.static(range(4)):
        ax = 0.26 if i % 2 == 0 else -0.26
        az = 0.26 if i < 2 else -0.26
        ddr = ti.min(ddr, dim.sd_ellipsoid(p, dc + ti.Vector([ax, 0.07, az]), ti.Vector([0.10, 0.010, 0.10])))
    if ddr < 0.04:
        col = ti.Vector([0.86, 0.86, 0.88])
        if (p - dc).norm() < 0.14:
            col = ti.Vector([0.95, 0.70, 0.22])           # gold canopy core
    return col


dim.SCENE_FN = _scene
dim.MAT_FN = _mat
dim.init_kernels()

# ---- the shot: slow dolly down the valley, rising; rack focus river -> drone ----
A = ((-2.6, 1.30, -5.5), (0.6, 0.85, 6.0))
B = ((-0.5, 2.05, -1.4), (1.9, 1.90, 5.2))

def cam_at(f):
    t = f / FPS
    x = min(1.0, f / (NF * 0.85))
    pos, look = dim.dolly(A, B, x)
    dxx, dyy, dzz = dim.drift(f, amp=0.016)
    pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    rack = dim.ease_io(max(0.0, (t - 6.5) / 2.5))
    fnear = 6.5
    fdrone = math.dist(pos, (1.9, 1.9, 5.2))
    focus = fnear * (1 - rack) + fdrone * rack
    return dim.Cam(pos, look, fov=1.30, focus=focus, fstop=4.5)

def main(s, e):
    from PIL import Image
    for f in range(s, e):
        cam = cam_at(f)
        rgb, z = dim.render_frame(cam, t=f / FPS)
        out = dim.post(rgb, z, cam, f=f)
        Image.fromarray(out).save(os.path.join(OUT, f"frame_{f:05d}.png"), compress_level=1)
    print(f"rendered [{s},{e})")

if __name__ == "__main__":
    s = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    e = int(sys.argv[2]) if len(sys.argv) > 2 else NF
    main(s, e)
