"""render_v3.py — 'THE CLAIM ON THE TUNDRA' (dimensional / Taichi SDF).

A 60s cinematic built to out/dispatch/storyboard.json. ONE _scene(p,t) dispatches by time into
five shot-worlds (0-12 aerial tundra + survey stake, 12-26 worm's-eye turbines assembling, 26-38
macro cost bar in the void, 38-50 paper flood, 50-60 return aerial + ghost campus). Flat North
Slope overcast light; blueprint-cyan register; sage/ochre tundra.

Usage:  python render_v3.py <start> <end>     (defaults 0..NF)
Env:    DIM_SCALE (0.4 look-dev / 1.0 ship), DIM_OUT (frame dir, default frames_v3), DIM_ARCH.
"""
import os, sys, math
import numpy as np
import taichi as ti
import dimensional as dim

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("DIM_OUT", "frames_v3")
os.makedirs(OUT, exist_ok=True)
FPS = 30
NF = 1800  # 60s

dim.init(1080, 1920, scale=float(os.environ.get("DIM_SCALE", "1.0")))

# ---- palette: flat high overcast North Slope daylight, near shadowless silver sky ----
dim.SUN_DIR = (0.26, 0.90, -0.22)      # high + soft => near shadowless
dim.SUN_COL = (0.96, 0.97, 1.00)       # cold white key
dim.SKY_COL = (0.50, 0.54, 0.61)       # cool silver fill (dimmed so ground ambient sits below sky)
dim.SKY_HI  = (0.72, 0.76, 0.83)       # silver zenith (dimmer => sky stays above ground value)
dim.RIM_STR = 0.30
dim.FOG_DEN = 0.009                     # halve the haze so distant ground doesn't wash to sky value
dim.FOG_COL = (0.64, 0.68, 0.75)       # wet-slate haze (dimmed)

# shot time boundaries (seconds)
S1, S2, S3, S4 = 12.0, 26.0, 38.0, 50.0


# ---------------------------------------------------------------- shared geometry helpers
@ti.func
def sd_boxframe(p, c, b, e):
    """IQ box-frame SDF — all 12 edges of a box (the ghost wireframe campus)."""
    q0 = ti.abs(p - c) - b
    w = ti.abs(q0 + e) - e
    px, py, pz = q0.x, q0.y, q0.z
    qx, qy, qz = w.x, w.y, w.z
    d1 = ti.max(ti.Vector([px, qy, qz]), 0.0).norm() + ti.min(ti.max(px, ti.max(qy, qz)), 0.0)
    d2 = ti.max(ti.Vector([qx, py, qz]), 0.0).norm() + ti.min(ti.max(qx, ti.max(py, qz)), 0.0)
    d3 = ti.max(ti.Vector([qx, qy, pz]), 0.0).norm() + ti.min(ti.max(qx, ti.max(qy, pz)), 0.0)
    return ti.min(d1, ti.min(d2, d3))


@ti.func
def _tundra(p):
    # near-flat tundra ground plane at y~0 with gentle low-poly undulation
    return p.y + 0.10 * dim.fbm2(p.x * 0.35, p.z * 0.35) + 0.035 * dim.fbm2(p.x * 1.2 + 5.0, p.z * 1.2)


@ti.func
def _stake(p):
    # the lone survey stake: wood shaft + bent flag box + brass cap
    d = dim.sd_capsule(p, ti.Vector([0.0, 0.0, 0.0]), ti.Vector([0.0, 1.15, 0.0]), 0.035)
    d = ti.min(d, dim.sd_rbox(p, ti.Vector([0.11, 0.98, 0.0]), ti.Vector([0.11, 0.06, 0.008]), 0.005))
    d = ti.min(d, dim.sd_sphere(p, ti.Vector([0.0, 1.17, 0.0]), 0.05))
    return d


@ti.func
def _stake_col(p):
    c = ti.Vector([0.30, 0.22, 0.14])                          # weathered wood
    if dim.sd_rbox(p, ti.Vector([0.11, 0.98, 0.0]), ti.Vector([0.11, 0.06, 0.008]), 0.005) < 0.02:
        c = ti.Vector([0.95, 0.42, 0.10])                      # orange flagging tape
    if dim.sd_sphere(p, ti.Vector([0.0, 1.17, 0.0]), 0.05) < 0.02:
        c = ti.Vector([0.75, 0.68, 0.42])                      # brass cap
    return c


@ti.func
def _tundra_mat(p):
    # darker/warmer than the silver sky, with high-contrast fbm+polygon mottling so vast terrain
    # READS from above instead of washing to a cream void
    a = 0.5 + 0.5 * dim.fbm2(p.x * 0.5, p.z * 0.5)
    b = 0.5 + 0.5 * dim.fbm2(p.x * 1.7 + 3.0, p.z * 1.7)
    m = ti.math.clamp(a * 0.7 + b * 0.3, 0.0, 1.0)
    c = ti.Vector([0.11, 0.12, 0.07]) * (1.0 - m) + ti.Vector([0.30, 0.25, 0.13]) * m       # peat sage<->dry ochre
    patch = ti.math.clamp(0.5 + 0.5 * dim.fbm2(p.x * 3.0 + 9.0, p.z * 3.0), 0.0, 1.0)        # frost-heave polygons
    if patch < 0.34:
        c = c * 0.55
    return c


# ---------------------------------------------------------------- per-world ramps (shared by scene+mat)
@ti.func
def _t_rise(t):
    r = ti.math.clamp((t - 12.0) / 8.0, 0.0, 1.0)              # turbines assemble t12->t20
    return r * r * (3.0 - 2.0 * r)


@ti.func
def _bar_h(t):
    leap = ti.math.clamp((t - 35.5) / 1.2, 0.0, 1.0)           # low tick -> leaps to ~6x
    leap = leap * leap * (3.0 - 2.0 * leap)
    bh = 0.5 + 2.4 * leap                                      # smaller so it reads as a BAR, not a wall
    bh += 0.10 * bh * ti.sin(t * 7.0) * leap                   # unstable at the top
    bh += 0.03 * ti.sin(t * 11.0)                              # never fully settles
    return bh


@ti.func
def _p_ramp(t):
    r = ti.math.clamp((t - 38.0) / 9.0, 0.0, 1.0)             # paper piles up
    return r * r * (3.0 - 2.0 * r)


# ---------------------------------------------------------------- world SDFs
@ti.func
def _turbines(p, t):
    rise = _t_rise(t)
    d = 1e9
    for i in ti.static(range(4)):
        cx = -1.6 if i % 2 == 0 else 1.6
        cz = 1.5 if i < 2 else 4.5
        h = (6.0 + 0.6 * i) * rise + 0.15
        d = ti.min(d, dim.sd_rbox(p, ti.Vector([cx, h * 0.5, cz]), ti.Vector([0.16, h * 0.5, 0.16]), 0.04))
        d = ti.min(d, dim.sd_rbox(p, ti.Vector([cx, h, cz]), ti.Vector([0.30, 0.11, 0.24]), 0.03))  # turbine crown/stack top
    flare_h = 6.0 * rise + 0.15                                # crown of column 0
    d = ti.min(d, dim.sd_ellipsoid(p, ti.Vector([-1.6, flare_h + 0.05, 1.5]), ti.Vector([0.28, 0.40, 0.28])))
    return d


@ti.func
def _costbar(p, t):
    bh = _bar_h(t)
    bar = dim.sd_rbox(p, ti.Vector([0.0, bh * 0.5, 0.0]), ti.Vector([0.24, bh * 0.5, 0.24]), 0.03)
    return ti.min(bar, p.y)                                    # bar on a flat gridline plane at y=0


@ti.func
def _paper(p, t):
    ramp = _p_ramp(t)
    hL = 0.4 + 3.2 * ramp
    hR = 0.30
    # LEFT: a mound (wide base + narrower cap) reads as a MOUNTAIN of paper, not a flat panel
    d = dim.sd_rbox(p, ti.Vector([-1.25, hL * 0.5, 0.0]), ti.Vector([0.95, hL * 0.5, 0.62]), 0.02)
    d = ti.min(d, dim.sd_rbox(p, ti.Vector([-1.05, hL * 0.82, 0.0]), ti.Vector([0.55, hL * 0.20, 0.42]), 0.02))
    d = ti.min(d, dim.sd_rbox(p, ti.Vector([1.35, hR * 0.5, 0.0]), ti.Vector([0.50, hR * 0.5, 0.50]), 0.02))  # short right stack
    d = ti.min(d, dim.sd_rbox(p, ti.Vector([0.0, 0.15, 0.0]), ti.Vector([0.012, 0.15, 0.62]), 0.0))  # center seam
    for i in ti.static(range(6)):                             # discrete slips tumbling onto the left pile
        ph = t * 0.8 + i * 1.3
        fx = -1.2 + 0.7 * ti.sin(ph * 1.3 + i)
        fz = -0.25 + 0.45 * ti.cos(ph + i)
        fy = hL + 1.9 - (ph - 3.0 * ti.floor(ph / 3.0)) * 0.9
        d = ti.min(d, dim.sd_rbox(p, ti.Vector([fx, fy, fz]), ti.Vector([0.17, 0.01, 0.12]), 0.005))
    return ti.min(d, _tundra(p))


@ti.func
def _ghostbox(p):
    return sd_boxframe(p, ti.Vector([0.0, 1.6, 16.0]), ti.Vector([3.2, 1.5, 2.2]), 0.05)


# ---------------------------------------------------------------- dispatchers
@ti.func
def _scene(p, t):
    d = 1e9
    if t < S1:
        d = ti.min(_tundra(p), _stake(p))
    elif t < S2:
        d = ti.min(_tundra(p), _turbines(p, t))
    elif t < S3:
        d = _costbar(p, t)
    elif t < S4:
        d = _paper(p, t)
    else:
        d = ti.min(ti.min(_tundra(p), _stake(p)), _ghostbox(p))
    return d


@ti.func
def _mat(p, n, t):
    col = ti.Vector([0.34, 0.33, 0.22])
    if t < S1:                                                 # aerial tundra + stake
        col = _tundra_mat(p)
        ax = ti.abs(p.x) - 1.7                                 # parcel claim: signal-red outline on the land
        az = ti.abs(p.z) - 2.3
        if ti.abs(ax) < 0.06:
            if az < 0.02:
                col = ti.Vector([1.60, 0.10, 0.08])
        if ti.abs(az) < 0.06:
            if ax < 0.02:
                col = ti.Vector([1.60, 0.10, 0.08])
        if _stake(p) < 0.03:
            col = _stake_col(p)
    elif t < S2:                                               # worm's-eye turbines
        col = _tundra_mat(p) * 0.7                             # ghosted gravel pad
        if _turbines(p, t) < 0.05:
            col = ti.Vector([0.18, 0.62, 0.78])               # blueprint-cyan steel edges
        flare_h = 6.0 * _t_rise(t) + 0.15
        if dim.sd_ellipsoid(p, ti.Vector([-1.6, flare_h + 0.05, 1.5]), ti.Vector([0.28, 0.40, 0.28])) < 0.05:
            col = ti.Vector([2.60, 1.15, 0.22])               # sodium-orange flare (emissive)
    elif t < S3:                                               # cost bar in the void
        col = ti.Vector([0.05, 0.06, 0.08])                   # dark void floor
        if p.y < 0.02 and ti.min(ti.abs(p.x - ti.round(p.x)), ti.abs(p.z - ti.round(p.z))) < 0.03:
            col = ti.Vector([0.10, 0.45, 0.60])               # glowing cyan gridlines
        bh = _bar_h(t)
        if dim.sd_rbox(p, ti.Vector([0.0, bh * 0.5, 0.0]), ti.Vector([0.24, bh * 0.5, 0.24]), 0.03) < 0.04:
            col = ti.Vector([0.20, 0.85, 1.00])               # blueprint-cyan bar
    elif t < S4:                                               # paper flood
        col = ti.Vector([0.56, 0.54, 0.47])                   # warm off-white paper (lower exposure => reads vs sky)
        e = p.y - 0.09 * ti.floor(p.y / 0.09)                 # sheet edges: dark gap every ~0.09 => reads as stacked slips
        if e < 0.02:
            col = col * 0.55
        if _tundra(p) < 0.03:
            col = ti.Vector([0.20, 0.20, 0.16])               # dark readable ground under the drifts
        if dim.sd_rbox(p, ti.Vector([0.0, 0.15, 0.0]), ti.Vector([0.012, 0.15, 0.62]), 0.0) < 0.03:
            col = ti.Vector([0.10, 0.11, 0.13])               # dark center seam
    else:                                                     # return aerial + ghost campus
        col = _tundra_mat(p)
        ax = ti.abs(p.x) - 1.7                                 # the claim persists on the returning land
        az = ti.abs(p.z) - 2.3
        if ti.abs(ax) < 0.06:
            if az < 0.02:
                col = ti.Vector([1.30, 0.09, 0.07])
        if ti.abs(az) < 0.06:
            if ax < 0.02:
                col = ti.Vector([1.30, 0.09, 0.07])
        if _stake(p) < 0.03:
            col = _stake_col(p)
        if _ghostbox(p) < 0.06:
            col = ti.Vector([0.18, 0.45, 0.55])               # faint ghost-cyan wireframe
    return col


@ti.func
def _shadow(p, t):
    # CHEAP shadow SDF: only the big silhouette per world (overcast => shadows barely read)
    d = 1e9
    if t < S1:
        d = ti.min(_tundra(p), dim.sd_capsule(p, ti.Vector([0.0, 0.0, 0.0]), ti.Vector([0.0, 1.15, 0.0]), 0.05))
    elif t < S2:
        d = ti.min(_tundra(p), _turbines(p, t))
    elif t < S3:
        d = _costbar(p, t)
    elif t < S4:
        hL = 0.4 + 3.2 * _p_ramp(t)
        d = ti.min(_tundra(p), dim.sd_rbox(p, ti.Vector([-1.25, hL * 0.5, 0.0]), ti.Vector([0.95, hL * 0.5, 0.62]), 0.02))
    else:
        d = ti.min(_tundra(p), dim.sd_capsule(p, ti.Vector([0.0, 0.0, 0.0]), ti.Vector([0.0, 1.15, 0.0]), 0.05))
    return d


dim.SCENE_FN = _scene
dim.MAT_FN = _mat
dim.SHADOW_FN = _shadow
dim.init_kernels()


# ---------------------------------------------------------------- camera: per-shot moves from the storyboard
def cam_at(f):
    t = f / FPS
    if t < S1:                                                 # S1 rise-reveal aerial
        x = dim.ease_io(t / 12.0)
        pos, look = dim.dolly(((0.0, 3.0, -4.0), (0.0, 0.6, 0.2)),
                              ((0.0, 6.8, -5.2), (0.0, 0.1, 0.2)), x)   # cap the rise: stake keeps scale, land fills frame
        focus = math.dist(pos, (0.0, 0.6, 0.0)); fov, fstop = 1.25, 5.6
    elif t < S2:                                               # S2 dolly-through, low looking up
        x = dim.ease_io((t - 12.0) / 14.0)
        pos, look = dim.dolly(((0.2, 0.35, -4.5), (0.0, 3.5, 1.5)),
                              ((-0.3, 1.1, -1.2), (0.2, 6.0, 3.0)), x)
        focus = 4.5 * (1 - x) + 2.5 * x; fov, fstop = 1.45, 3.2
    elif t < S3:                                               # S3 rack-focus-macro push-in
        x = dim.ease_io((t - 26.0) / 12.0)
        pos, look = dim.dolly(((0.0, 2.9, -8.0), (0.0, 1.2, 0.0)),
                              ((0.0, 2.6, -6.4), (0.0, 1.4, 0.0)), x)   # pulled back: BAR with headroom + top edge
        focus = 8.0 * (1 - x) + 6.4 * x; fov, fstop = 1.15, 2.6     # rack far -> onto the bar
    elif t < S4:                                               # S4 dolly-through the paper
        x = dim.ease_io((t - 38.0) / 12.0)
        pos, look = dim.dolly(((0.6, 1.5, -5.0), (-0.4, 1.1, 0.0)),
                              ((-0.4, 1.7, -2.0), (-1.0, 1.3, 0.0)), x)
        focus = math.dist(pos, (-1.25, 1.4, 0.0)); fov, fstop = 1.35, 2.8
    else:                                                     # S5 locked-drift aerial (loopback)
        x = dim.ease_io((t - 50.0) / 10.0)
        pos, look = dim.dolly(((0.0, 6.5, -5.0), (0.0, 0.2, 0.2)),
                              ((0.20, 6.7, -5.4), (0.0, 0.1, 0.2)), x)   # match Shot 1 height: readable land + stake
        focus = math.dist(pos, (0.0, 0.6, 0.0)); fov, fstop = 1.25, 6.3
    dxx, dyy, dzz = dim.drift(f, amp=0.012)
    pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    return dim.Cam(pos, look, fov=fov, focus=focus, fstop=fstop)


def main(s, e):
    from PIL import Image
    for f in range(s, e):
        cam = cam_at(f)
        rgb, z = dim.render_frame(cam, t=f / FPS)
        out = dim.post(rgb, z, cam, f=f)
        Image.fromarray(out).save(os.path.join(OUT, f"frame_{f:05d}.png"), compress_level=1)
    dim.write_manifest(os.path.join(OUT, "render_manifest.json"), NF)
    print(f"rendered [{s},{e})")


if __name__ == "__main__":
    s = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    e = int(sys.argv[2]) if len(sys.argv) > 2 else NF
    main(s, e)
