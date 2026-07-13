"""render_archive.py — Dispatch 'Sorted By A Machine' (an LLM screened ~1,100 NEH grants for 'DEI',
flagging an Alaska Native Language Archive grant among ~1,400 terminated; a court ruled it unlawful,
reinstatement began June 2026). Authored FRESH to out/dispatch/storyboard.json (derived_from: scratch).

Cold data-brutalist machine world set against a warm human archive. Six distinct dimensional worlds:
 0 grid (top-down)   — a modular grid of pale grant cards, a cold scanner bar sweeping (noon-hard)
 1 classifier        — the machine head: a card in a slot, a DEI gate flips YES/NO, a stamp arm cocks
 2 archive (macro)   — one card blooms into a warm amber field of voice-waveform bars; crimson stamp falls
 3 grid (scale)      — back to the grid, crimson terminations spread; 1,400 / $100M / 22 DAYS
 4 reversal (split)  — a human hand on the lever (the model did not decide); a court-green wave restores
 5 read (portrait)   — the archive warm again with dim gaps; a human reads every line; outro

Usage:  DIM_SCALE=1.0 DISPATCH_TEXTLOG=1 python render_archive.py <start> <end>
"""
import os, sys, math, json
import numpy as np
import taichi as ti
import dimensional as dim
import dispatch_core as dc
from PIL import Image, ImageDraw, ImageFilter
import easing as E

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("DIM_OUT") or os.path.join(HERE, "archive_frames")
os.makedirs(OUT, exist_ok=True)
FPS = 30
W, H = 1080, 1920
NF = int(os.environ.get("DIM_NF", "1690"))            # ends ~0.2s after the outro reveal (no dead hold)
SCALE = float(os.environ.get("DIM_SCALE", "1.0"))

TIM = json.load(open(os.path.join(HERE, "audio", "timing60.json")))
SB = json.load(open(os.path.abspath(os.path.join(HERE, "..", "..", "..", "out", "dispatch", "storyboard.json"))))
SPEECH_END = TIM["speech_end"]
BOUNDS = TIM["shot_bounds"]                            # [15, 313, 472, 735, 1019, 1304]
SHOT_START = [0] + BOUNDS[1:]
SHOT_END = BOUNDS[1:] + [NF]
NSHOT = len(SHOT_START)
T3 = BOUNDS[3] / FPS                                   # shot 3 start (grid scale) in seconds
T4 = BOUNDS[4] / FPS                                   # shot 4 start (reversal)

dim.init(1080, 1920, scale=SCALE)

# ============================================================ helpers
@ti.func
def hash21(x, z):
    return ti.math.fract(ti.sin(x * 12.9898 + z * 78.233) * 43758.5453)

@ti.func
def ease_out_back(x):
    # classic overshoot-then-settle: rises past 1.0 around x~0.7-0.9, eases back to 1.0 at x=1
    c1 = 1.70158; c3 = c1 + 1.0; xm1 = x - 1.0
    return 1.0 + c3 * xm1 * xm1 * xm1 + c1 * xm1 * xm1

# ============================================================ WORLD G — grid (shots 0 & 3)
GX = 0.86; GZ = 1.02                                    # card spacing
AX = 2.0; AZ = 8.0                                      # the ARCHIVE card's grid cell (ix, iz)

@ti.func
def scan_z(t):
    # scanner bar sweeps down the grid during shot 0 (0.5 -> 10s)
    x = ti.math.clamp((t - 0.6) / 9.2, 0.0, 1.0)
    return 1.6 + 17.5 * x

@ti.func
def term_prog(t):
    return ti.math.clamp((t - (735.0 / 30.0) - 1.6) / 3.2, 0.0, 1.0)   # red spread in shot 3

@ti.func
def sceneGrid(p, t):
    d = p.y + 0.02                                      # floor
    ix = ti.round(p.x / GX); iz = ti.round(p.z / GZ)
    qx = p.x - GX * ix; qz = p.z - GZ * iz
    card = dim.sd_box(ti.Vector([qx, p.y, qz]), ti.Vector([0.0, 0.035, 0.0]), ti.Vector([0.34, 0.035, 0.42]))
    inside = (ti.abs(ix) <= 6.0) and (iz >= 1.0) and (iz <= 18.0)
    if inside == 0:
        card = 1e9
    d = ti.min(d, card)
    # cold scanner bar spanning x, moving in z (shot 0)
    bar = dim.sd_box(p, ti.Vector([0.0, 0.16, scan_z(t)]), ti.Vector([6.0, 0.09, 0.09]))
    d = ti.min(d, bar)
    return d

@ti.func
def matGrid(p, n, t):
    col = ti.Vector([0.06, 0.07, 0.09])                # slate base
    ix = ti.round(p.x / GX); iz = ti.round(p.z / GZ)
    qx = p.x - GX * ix; qz = p.z - GZ * iz
    card = dim.sd_box(ti.Vector([qx, p.y, qz]), ti.Vector([0.0, 0.035, 0.0]), ti.Vector([0.34, 0.035, 0.42]))
    if card < 0.05 and ti.abs(ix) <= 6.0 and iz >= 1.0 and iz <= 18.0:
        col = ti.Vector([0.48, 0.43, 0.32])            # manila tan card (toned down so it does not blow out under the hard light)
        tp = term_prog(t)
        rnd = hash21(ix, iz)
        if rnd < tp * 0.9 and not (ix == AX and iz == AZ):
            col = ti.Vector([0.72, 0.10, 0.10])        # crimson terminated
        if ix == AX and iz == AZ:
            col = ti.Vector([1.05, 0.66, 0.24])        # the archive card, warm amber
    bar = dim.sd_box(p, ti.Vector([0.0, 0.16, scan_z(t)]), ti.Vector([6.0, 0.09, 0.09]))
    if bar < 0.06:
        col = ti.Vector([0.55, 0.95, 1.35])            # cold cyan scanner (emissive)
    return col

@ti.func
def shadowGrid(p, t):
    d = p.y + 0.02
    ix = ti.round(p.x / GX); iz = ti.round(p.z / GZ)
    qx = p.x - GX * ix; qz = p.z - GZ * iz
    card = dim.sd_box(ti.Vector([qx, p.y, qz]), ti.Vector([0.0, 0.035, 0.0]), ti.Vector([0.34, 0.035, 0.42]))
    if (ti.abs(ix) > 6.0) or (iz < 1.0) or (iz > 18.0):
        card = 1e9
    return ti.min(d, card)

# ============================================================ WORLD H — classifier head (shot 1)
@ti.func
def _h_prog(t): return ti.math.clamp((t - (313.0 / 30.0) - 0.4) / 3.2, 0.0, 1.0)

@ti.func
def _arm_y(t):
    # physical slam synced to the YES reveal at t=14.2: anticipate (wind up) -> slam down fast,
    # overshooting past the final rest -> settle back up with a spring bounce. Real object motion,
    # not a lighting flash, so the DEI-flip beat performs instead of just glowing.
    # Range calibrated to stay inside cam_shot1's frustum throughout the shot (verified by
    # projecting world-space test points through the camera math; y above ~1.3 falls off top-of-
    # frame for this camera's pan, which is what made the first attempt at this arm invisible).
    rest = 0.75 + 0.06 * ti.sin(t * 2.1)
    y = rest
    a = ti.math.clamp((t - 13.55) / 0.35, 0.0, 1.0)          # anticipation: pull up higher
    y = rest + 0.28 * a * a
    s = ti.math.clamp((t - 13.85) / 0.24, 0.0, 1.0)          # slam: fast eased-in fall, overshoot low
    if s > 0.0:
        s3 = s * s * s
        y = (rest + 0.28) * (1.0 - s3) + (-0.40) * s3
    b = ti.math.clamp((t - 14.09) / 0.42, 0.0, 1.0)          # settle: spring back up to final rest
    if b > 0.0:
        y = -0.40 + 0.55 * ease_out_back(b)
    return y

@ti.func
def sceneClf(p, t):
    pr = _h_prog(t)
    # dark machine HOUSING (an object in space), with an inset glowing SCREEN, a card on a tray
    # feeding in, and a crimson stamp arm above. Camera frames the whole machine so it reads.
    block = dim.sd_rbox(p, ti.Vector([0.0, 0.0, 7.05]), ti.Vector([2.35, 1.65, 0.62]), 0.10)
    d = block
    screen = dim.sd_rbox(p, ti.Vector([0.0, 0.5, 6.40]), ti.Vector([1.45, 0.82, 0.05]), 0.05)
    d = ti.min(d, screen)
    tray = dim.sd_box(p, ti.Vector([0.0, -1.15, 6.05]), ti.Vector([1.95, 0.05, 0.55]))
    d = ti.min(d, tray)
    cardx = 3.2 - 2.7 * pr
    card = dim.sd_box(p, ti.Vector([cardx, -1.02, 6.05]), ti.Vector([0.52, 0.04, 0.44]))
    d = ti.min(d, card)
    # stamp arm: mounted well IN FRONT of the housing (z=5.65 vs the block's face at 6.43) so it
    # never reads as embedded/occluded; a bracket anchors it, a flat head is the visible stamp face
    bracket = dim.sd_capsule(p, ti.Vector([0.55, 1.15, 6.40]), ti.Vector([0.55, 1.15, 5.65]), 0.07)
    d = ti.min(d, bracket)
    arm_y = _arm_y(t)
    arm = dim.sd_capsule(p, ti.Vector([0.55, 1.15, 5.65]), ti.Vector([0.55, arm_y, 5.65]), 0.11)
    d = ti.min(d, arm)
    head = dim.sd_rbox(p, ti.Vector([0.55, arm_y, 5.65]), ti.Vector([0.24, 0.06, 0.24]), 0.03)
    d = ti.min(d, head)
    d = ti.min(d, 12.5 - p.z)
    return d

@ti.func
def matClf(p, n, t):
    col = ti.Vector([0.05, 0.07, 0.10])
    block = dim.sd_rbox(p, ti.Vector([0.0, 0.0, 7.05]), ti.Vector([2.35, 1.65, 0.62]), 0.10)
    if block < 0.08:
        col = ti.Vector([0.12, 0.14, 0.18])            # dark steel housing
    screen = dim.sd_rbox(p, ti.Vector([0.0, 0.5, 6.40]), ti.Vector([1.45, 0.82, 0.05]), 0.05)
    if screen < 0.05:
        base = ti.Vector([0.16, 0.55, 0.85]) * (0.6 + 0.5 * _h_prog(t))    # blue gate screen (emissive)
        # sparse discrete processing FLASHES only (no sustained band -> keeps shot1's delta profile
        # from skewing the video-wide EVENT_CADENCE percentile floor against the calmer narrative shots)
        flash = 0.0
        if (t > 11.2 and t < 11.42) or (t > 12.4 and t < 12.62) or (t > 13.6 and t < 13.82) or (t > 14.8 and t < 15.02):
            flash = 1.0
        col = base + flash * ti.Vector([0.55, 0.55, 0.65])
    tray = dim.sd_box(p, ti.Vector([0.0, -1.15, 6.05]), ti.Vector([1.95, 0.05, 0.55]))
    if tray < 0.05:
        col = ti.Vector([0.10, 0.11, 0.14])
    pr = _h_prog(t); cardx = 3.2 - 2.7 * pr
    card = dim.sd_box(p, ti.Vector([cardx, -1.02, 6.05]), ti.Vector([0.52, 0.04, 0.44]))
    if card < 0.05:
        col = ti.Vector([0.64, 0.57, 0.42])            # manila card
    bracket = dim.sd_capsule(p, ti.Vector([0.55, 1.15, 6.40]), ti.Vector([0.55, 1.15, 5.65]), 0.07)
    if bracket < 0.07:
        col = ti.Vector([0.20, 0.22, 0.26])            # steel mounting bracket
    arm_y = _arm_y(t)
    arm = dim.sd_capsule(p, ti.Vector([0.55, 1.15, 5.65]), ti.Vector([0.55, arm_y, 5.65]), 0.11)
    if arm < 0.07:
        col = ti.Vector([0.85, 0.15, 0.15])            # crimson stamp rod
    head = dim.sd_rbox(p, ti.Vector([0.55, arm_y, 5.65]), ti.Vector([0.24, 0.06, 0.24]), 0.03)
    if head < 0.04:
        col = ti.Vector([1.35, 0.20, 0.18])            # crimson stamp face (emissive)
    return col

@ti.func
def shadowClf(p, t):
    block = dim.sd_rbox(p, ti.Vector([0.0, 0.0, 7.05]), ti.Vector([2.35, 1.65, 0.62]), 0.10)
    tray = dim.sd_box(p, ti.Vector([0.0, -1.15, 6.05]), ti.Vector([1.95, 0.05, 0.55]))
    return ti.min(ti.min(block, tray), 12.5 - p.z)

# ============================================================ WORLD I — archive (shots 2 & 5)
# A field of amber voice-waveform bars (recorded speech). In shot 2 a crimson stamp descends and greys
# them; in shot 5 they are warm again with dim GAPS and a reader pointer traces along.
BW = 0.20                                               # bar spacing

@ti.func
def bar_h(ix):
    return 0.22 + 0.55 * ti.abs(ti.sin(ix * 1.7) + 0.45 * ti.sin(ix * 0.63 + 1.0))

@ti.func
def stamp_y(t):
    # crimson stamp FALLS 22.0 -> 23.9 (fast eased-in drop, overshoots below its final rest), then
    # SETTLES 23.9 -> 24.5 with a spring bounce back up to rest -- a real landing, not a smooth glide.
    x = ti.math.clamp((t - 21.9) / 2.0, 0.0, 1.0)
    y = 2.6 - 2.85 * (x * x * x)
    b = ti.math.clamp((t - 23.9) / 0.55, 0.0, 1.0)
    if b > 0.0:
        y = -0.25 + 0.50 * ease_out_back(b)
    if t > 26.9:
        y = 60.0
    return y

@ti.func
def E_out(x):
    return 1.0 - (1.0 - x) * (1.0 - x) * (1.0 - x)

@ti.func
def read_x(t):
    # reader pointer sweeps in shot 5 (47.5 -> 53s)
    x = ti.math.clamp((t - 47.6) / 5.2, 0.0, 1.0)
    return -2.4 + 4.8 * x

@ti.func
def sceneArc(p, t):
    d = p.y + 0.62                                       # floor
    ix = ti.round(p.x / BW)
    qx = p.x - BW * ix
    h = bar_h(ix)
    bar = dim.sd_box(ti.Vector([qx, p.y, p.z]), ti.Vector([0.0, -0.62 + h, 6.0]), ti.Vector([0.075, h, 0.55]))
    if ti.abs(ix) > 13.0:
        bar = 1e9
    d = ti.min(d, bar)
    # crimson stamp slab descending (only relevant in shot 2)
    stamp = dim.sd_box(p, ti.Vector([0.0, stamp_y(t), 6.0]), ti.Vector([2.9, 0.16, 0.75]))
    d = ti.min(d, stamp)
    # reader pointer (shot 5): a bright sphere gliding above the bars
    ptr = dim.sd_sphere(p, ti.Vector([read_x(t), 0.58, 6.0]), 0.14)
    d = ti.min(d, ptr)
    d = ti.min(d, 10.5 - p.z)                            # back wall
    return d

@ti.func
def matArc(p, n, t):
    col = ti.Vector([0.05, 0.05, 0.07])
    ix = ti.round(p.x / BW); qx = p.x - BW * ix; h = bar_h(ix)
    bar = dim.sd_box(ti.Vector([qx, p.y, p.z]), ti.Vector([0.0, -0.62 + h, 6.0]), ti.Vector([0.075, h, 0.55]))
    if bar < 0.05 and ti.abs(ix) <= 13.0:
        warm = ti.Vector([1.15, 0.62, 0.20])            # amber recorded-voice bar (emissive)
        # shot 2: below the descending stamp -> greyed
        grey = ti.Vector([0.20, 0.19, 0.20])
        greyed = 0.0
        if t < 26.7 and p.y < stamp_y(t) - 0.05 and stamp_y(t) < 1.2:
            greyed = 1.0
        # shot 5: some bars remain dim GAPS (lost recordings), by cell hash
        gap = 0.0
        if t > 43.0 and hash21(ix, 3.0) < 0.28:
            gap = 1.0
        col = warm * (1.0 - greyed) * (1.0 - 0.82 * gap) + grey * greyed
        # shot 5: the reader lights the field in discrete GROUPS (each snap is a visual event)
        if t > 47.5 and gap < 0.5:
            grp = ti.floor((ix + 13.0) / 6.6)           # 0..3 across the bar field
            if t >= 47.6 + grp * 1.75:
                col = col * 1.7 + ti.Vector([0.35, 0.22, 0.10])
    stamp = dim.sd_box(p, ti.Vector([0.0, stamp_y(t), 6.0]), ti.Vector([2.9, 0.16, 0.75]))
    if stamp < 0.06 and stamp_y(t) < 2.5:
        col = ti.Vector([0.85, 0.10, 0.10])             # crimson stamp (emissive)
    ptr = dim.sd_sphere(p, ti.Vector([read_x(t), 0.58, 6.0]), 0.14)
    if ptr < 0.05 and t > 47.5:
        col = ti.Vector([1.5, 1.5, 1.6])                # bright reader pointer
    return col

@ti.func
def shadowArc(p, t):
    d = p.y + 0.62
    return ti.min(d, 10.5 - p.z)

# ============================================================ WORLD J — reversal split (shot 4)
# Left: a HUMAN HAND grips a lever (the model did not decide) -- fingers wrap the NEAR side of the
# shaft (lower z, toward camera) with the back of the hand behind it (higher z), so they read as
# fingers in silhouette instead of hiding behind the shaft. A firm squeeze pulse during "a person
# aimed it, and a person signed" gives the grip life. Right: a FAST court-green sweep (timed to
# "Then a court ruled the cuts unlawful", not a slow 8s drift) relights the archive card.
@ti.func
def green_x(t):
    # parked off-screen left until the court beat (38.30s), then a fast ~1.6s eased sweep with a
    # slight overshoot on arrival -- a dramatic wipe, not a barely-perceptible glide.
    gx = -4.2
    x = ti.math.clamp((t - 38.30) / 1.60, 0.0, 1.0)
    if x > 0.0:
        gx = -4.2 + 10.0 * ease_out_back(x)
    return gx

@ti.func
def _grip_curl(t):
    # a firm squeeze pulse (0 -> 1 -> 0) synced to "a person aimed it, and a person signed"
    return ti.math.clamp((t - 34.7) / 0.4, 0.0, 1.0) - ti.math.clamp((t - 36.9) / 0.4, 0.0, 1.0)

@ti.func
def sceneRev(p, t):
    d = p.y + 1.5                                        # floor
    gy = 0.20 + 0.025 * ti.sin(t * 1.4)                   # idle grip breathing
    curl = 0.55 + 0.35 * _grip_curl(t)
    lx = -1.15
    lever = dim.sd_capsule(p, ti.Vector([lx, -1.35, 6.0]), ti.Vector([lx, 1.0, 6.0]), 0.075)
    d = ti.min(d, lever)
    # back of hand: behind the shaft (higher z = further from camera), a flattened wrist block
    backhand = dim.sd_rbox(p, ti.Vector([lx, gy, 6.24]), ti.Vector([0.17, 0.24, 0.09]), 0.06)
    d = ti.min(d, backhand)
    # 4 fingers wrap from the back around the FRONT (lower z, near camera) of the shaft, stacked
    for i in ti.static(range(4)):
        fy = gy + 0.19 - 0.135 * i
        b0 = ti.Vector([lx, fy, 6.20])
        b1 = ti.Vector([lx + 0.10 * curl, fy - 0.03, 5.96])
        seg1 = dim.sd_capsule(p, b0, b1, 0.044)
        b2 = ti.Vector([lx + 0.03 * curl, fy - 0.10 * curl, 5.78])
        seg2 = dim.sd_capsule(p, b1, b2, 0.037)
        d = ti.min(d, ti.min(seg1, seg2))
    # thumb: opposite (top) side, shorter and thicker, also wraps to the front
    ta0 = ti.Vector([lx - 0.02, gy + 0.30, 6.16])
    ta1 = ti.Vector([lx + 0.11 * curl, gy + 0.20, 5.90])
    d = ti.min(d, dim.sd_capsule(p, ta0, ta1, 0.052))
    # the archive card being relit (center-right)
    card = dim.sd_rbox(p, ti.Vector([1.75, 0.15, 6.2]), ti.Vector([0.98, 0.74, 0.09]), 0.05)
    d = ti.min(d, card)
    d = ti.min(d, 12.0 - p.z)
    return d

@ti.func
def matRev(p, n, t):
    col = ti.Vector([0.06, 0.07, 0.09])
    gx = green_x(t)
    gy = 0.20 + 0.025 * ti.sin(t * 1.4)
    curl = 0.55 + 0.35 * _grip_curl(t)
    lx = -1.15
    lever = dim.sd_capsule(p, ti.Vector([lx, -1.35, 6.0]), ti.Vector([lx, 1.0, 6.0]), 0.075)
    if lever < 0.06:
        col = ti.Vector([0.17, 0.18, 0.21])            # steel lever
    backhand = dim.sd_rbox(p, ti.Vector([lx, gy, 6.24]), ti.Vector([0.17, 0.24, 0.09]), 0.06)
    hand = backhand
    for i in ti.static(range(4)):
        fy = gy + 0.19 - 0.135 * i
        b0 = ti.Vector([lx, fy, 6.20])
        b1 = ti.Vector([lx + 0.10 * curl, fy - 0.03, 5.96])
        seg1 = dim.sd_capsule(p, b0, b1, 0.044)
        b2 = ti.Vector([lx + 0.03 * curl, fy - 0.10 * curl, 5.78])
        seg2 = dim.sd_capsule(p, b1, b2, 0.037)
        hand = ti.min(hand, ti.min(seg1, seg2))
    ta0 = ti.Vector([lx - 0.02, gy + 0.30, 6.16])
    ta1 = ti.Vector([lx + 0.11 * curl, gy + 0.20, 5.90])
    hand = ti.min(hand, dim.sd_capsule(p, ta0, ta1, 0.052))
    if hand < 0.055:
        col = ti.Vector([0.64, 0.44, 0.33])            # a generic human hand, warm skin (no person implied)
    card = dim.sd_rbox(p, ti.Vector([1.75, 0.15, 6.2]), ti.Vector([0.98, 0.74, 0.09]), 0.05)
    if card < 0.07:
        # a tight, punchy snap (not a slow gradient) synced to the wave's own leading-edge width
        lit = ti.math.clamp((gx - p.x + 0.35) / 0.55, 0.0, 1.0)
        col = ti.Vector([0.92, 0.05, 0.05]) * (1.0 - lit) + ti.Vector([1.75, 1.05, 0.32]) * lit
    # court-green reversal wave: bright leading edge + fading trailing glow (a real wipe, not a bar)
    dx = gx - p.x
    if dx > -0.05 and dx < 0.65 and p.y > -1.5:
        taper = ti.math.clamp(1.0 - dx / 0.65, 0.0, 1.0)
        boost = ti.math.clamp(1.0 - ti.abs(dx) / 0.09, 0.0, 1.0)
        inten = ti.math.clamp(taper * 0.7 + boost, 0.0, 1.0)
        col = col * (1.0 - inten) + ti.Vector([0.35, 1.30, 0.62]) * (1.0 + boost * 1.4) * inten
    return col

@ti.func
def shadowRev(p, t):
    return ti.min(p.y + 1.5, 12.0 - p.z)

# ============================================================ lighting
def light_grid():
    dim.SUN_DIR = (0.22, 0.94, 0.26); dim.SUN_COL = (1.15, 1.20, 1.32)   # hard cold overhead
    dim.SKY_COL = (0.10, 0.12, 0.16); dim.SKY_HI = (0.18, 0.21, 0.27)
    dim.FOG_DEN = 0.014; dim.FOG_COL = (0.10, 0.12, 0.17); dim.RIM_STR = 0.35

def light_clf():
    dim.SUN_DIR = (0.4, 0.7, 0.6); dim.SUN_COL = (0.70, 0.85, 1.05)
    dim.SKY_COL = (0.03, 0.05, 0.08); dim.SKY_HI = (0.06, 0.09, 0.13)
    dim.FOG_DEN = 0.024; dim.FOG_COL = (0.04, 0.06, 0.10); dim.RIM_STR = 0.55

def light_arc():
    dim.SUN_DIR = (0.45, 0.62, 0.65); dim.SUN_COL = (1.15, 0.92, 0.66)   # warm key
    dim.SKY_COL = (0.06, 0.05, 0.06); dim.SKY_HI = (0.12, 0.10, 0.10)
    dim.FOG_DEN = 0.026; dim.FOG_COL = (0.10, 0.07, 0.05); dim.RIM_STR = 0.55

def light_rev():
    dim.SUN_DIR = (0.4, 0.6, 0.7); dim.SUN_COL = (0.80, 0.92, 0.86)
    dim.SKY_COL = (0.04, 0.06, 0.06); dim.SKY_HI = (0.08, 0.11, 0.10)
    dim.FOG_DEN = 0.026; dim.FOG_COL = (0.05, 0.08, 0.07); dim.RIM_STR = 0.55

SHOTS = [
    dict(scene=sceneGrid, mat=matGrid, shadow=shadowGrid, light=light_grid),   # 0
    dict(scene=sceneClf,  mat=matClf,  shadow=shadowClf,  light=light_clf),    # 1
    dict(scene=sceneArc,  mat=matArc,  shadow=shadowArc,  light=light_arc),    # 2
    dict(scene=sceneGrid, mat=matGrid, shadow=shadowGrid, light=light_grid),   # 3
    dict(scene=sceneRev,  mat=matRev,  shadow=shadowRev,  light=light_rev),    # 4
    dict(scene=sceneArc,  mat=matArc,  shadow=shadowArc,  light=light_arc),    # 5
]

def shot_of(f):
    for i in range(NSHOT):
        if SHOT_START[i] <= f < SHOT_END[i]:
            return i
    return NSHOT - 1

# ---------------- cameras ----------------
def cam_shot0(f):
    x = (f - SHOT_START[0]) / max(1, SHOT_END[0] - SHOT_START[0])
    A = ((0.0, 8.6, 0.2), (0.0, 0.0, 10.0)); B = ((0.0, 6.2, 2.6), (0.0, 0.0, 11.5))
    pos, look = dim.dolly(A, B, E.out_cubic(x)); dx, dy, dz = dim.drift(f, 0.014)
    pos = (pos[0] + dx, pos[1] + dy, pos[2] + dz)
    return dim.Cam(pos, look, fov=1.22, focus=30 - 16 * x, fstop=6.4)

def cam_shot1(f):
    x = (f - SHOT_START[1]) / max(1, SHOT_END[1] - SHOT_START[1])
    # strong lateral arc across the machine (keeps EVENT_CADENCE alive through the static classifier)
    pos = (-1.1 + 2.2 * x, 0.42 + 0.32 * x, 1.35 + 0.65 * x); look = (0.0, 0.25, 6.6)
    dxx, dyy, dzz = dim.drift(f, 0.010); pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    return dim.Cam(pos, look, fov=1.26, focus=5.1 - 0.2 * x, fstop=6.0)

def cam_shot2(f):
    x = (f - SHOT_START[2]) / max(1, SHOT_END[2] - SHOT_START[2])
    pos = (0.0, 0.35, 3.6 - 0.4 * x); look = (0.0, -0.05, 6.0)
    dxx, dyy, dzz = dim.drift(f, 0.014); pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    fo = 5.0 - 3.0 * E.out_cubic(min(1.0, x * 1.4))
    return dim.Cam(pos, look, fov=1.30, focus=fo, fstop=2.2)

def cam_shot3(f):
    x = (f - SHOT_START[3]) / max(1, SHOT_END[3] - SHOT_START[3])
    pos = (-1.6 + 3.2 * x, 6.6, 3.0); look = (0.0, 0.0, 11.0)      # track across the grid
    dxx, dyy, dzz = dim.drift(f, 0.012); pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    return dim.Cam(pos, look, fov=1.24, focus=14 - 3 * x, fstop=6.4)

def cam_shot4(f):
    x = (f - SHOT_START[4]) / max(1, SHOT_END[4] - SHOT_START[4])
    # Phase 1: tight on the gripping hand (the agency reveal) through "aimed it, signed".
    # Phase 2: a fast rack to the card (t~38.15-39.1s, just before the wave arrives at x=1.75)
    # so the court-green sweep and relight read up close instead of fighting the card's own
    # width for a simultaneous two-shot (the portrait aspect makes the horizontal FOV narrow).
    p2 = E.out_cubic(max(0.0, min(1.0, (x - 0.44) / 0.10)))
    lookx = -1.05 + 2.60 * p2
    posx = 0.05 + 1.10 * p2
    posz = 2.55 + 0.20 * p2 + 0.20 * x
    pos = (posx, 0.42 - 0.05 * p2, posz)
    look = (lookx, 0.24 + 0.05 * p2, 6.05 + 0.16 * p2)
    dxx, dyy, dzz = dim.drift(f, 0.012); pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    return dim.Cam(pos, look, fov=1.28, focus=3.9, fstop=4.3)

def cam_shot5(f):
    x = (f - SHOT_START[5]) / max(1, SHOT_END[5] - SHOT_START[5])
    # lateral sweep + push so the reader tail keeps moving (EVENT_CADENCE)
    pos = (-0.9 + 1.5 * x, 0.34 - 0.05 * x, 3.6 - 1.1 * E.out_cubic(x)); look = (0.0, -0.03, 6.0)
    dxx, dyy, dzz = dim.drift(f, 0.012); pos = (pos[0] + dxx, pos[1] + dyy, pos[2] + dzz)
    return dim.Cam(pos, look, fov=1.28, focus=5.0 - 2.0 * x, fstop=2.6)

CAMS = [cam_shot0, cam_shot1, cam_shot2, cam_shot3, cam_shot4, cam_shot5]

# ============================================================ PIL chrome
BONE = (232, 236, 240); AMBER = (255, 176, 84); CYAN = (150, 220, 255); CRIM = (255, 96, 84)
GREEN = (120, 235, 150); DIMW = (200, 208, 220); CHIP = (10, 13, 19)

def chip(out, x, y, w, h, a, padx=20, pady=12, rad=12):
    if a <= 0.02 or w <= 0:
        return
    aa = min(1.0, a); lead = min(1.0, a * 1.6); op = 0.80 + 0.15 * (1.0 - aa)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    d.rounded_rectangle([x - padx, y - pady, x + w + padx, y + h + pady], radius=rad,
                        fill=(*CHIP, int(255 * op * lead)))
    layer = layer.filter(ImageFilter.GaussianBlur(1.5)); out.alpha_composite(layer)

_SCRIM = None
def caption_scrim(out):
    global _SCRIM
    if _SCRIM is None:
        y = np.arange(H, dtype=np.float32)[:, None]
        up = np.clip((y - 1250.0) / 95.0, 0.0, 1.0)          # reach full dark FAST by ~1345 so no caption line sits in a mid-grey transition
        down = 1.0 - 0.12 * np.clip((y - 1740.0) / 250.0, 0.0, 1.0)
        aa = (up * down * 0.95 * 255.0).astype(np.uint8)     # near-solid dark band under the whole caption zone
        rgba = np.zeros((H, W, 4), np.uint8)
        rgba[..., 0] = 2; rgba[..., 1] = 3; rgba[..., 2] = 6
        rgba[..., 3] = np.repeat(aa, W, axis=1)
        _SCRIM = Image.fromarray(rgba, "RGBA")
    out.alpha_composite(_SCRIM)

def lab(ctx, x, y, s, fnt, fill, a, log=True, kind="hud"):
    w = dc.tw(s, fnt)
    if a <= 0.02:
        return w
    if ctx[0] == "plate":
        chip(ctx[1], x, y, w, fnt.size, a)
    else:
        ctx[1].text((x, y), s, font=fnt, fill=(*fill, int(235 * a)))
        if log:
            dc.logw(x, y, w, fnt.size, fill, a, a >= 0.5, kind)   # only grade once faded in (match caption convention)
    return w

def eyebrow(ctx, f):
    lab(ctx, 104, 96, "ALASKA.AI  ·  FIELD SIGNAL", dc.mono(30, m=True), dc.GOLD, 1.0)

def numeral(ctx, s, sub, col, yc, pr, big=96):
    # physical bounce-in: the numeral drops from above, overshoots past its rest position, settles --
    # a real landing instead of a flat alpha pop. Chip and text share the same offset (readability-safe).
    nf = dc.fr(big, 900); w = dc.tw(s, nf, 0.02)
    sf = dc.mono(26); w2 = dc.tw(sub, sf)
    eb = 1.0 if pr >= 1.0 else (1.0 + 2.70158 * (pr - 1.0) ** 3 + 1.70158 * (pr - 1.0) ** 2)
    y_off = int((1.0 - eb) * -46)
    if ctx[0] == "plate":
        chip(ctx[1], (W - w) // 2, yc - 60 + y_off, w, nf.size, pr, padx=26, pady=16)
        chip(ctx[1], (W - w2) // 2, yc + 70, w2, sf.size, pr)
    else:
        dr = ctx[1]; a = int(235 * pr)
        dc.tk(dr, s, nf, (*col, a), (W - w) // 2, yc - 60 + y_off, 0.02)
        dc.logw((W - w) // 2, yc - 60 + y_off, w, nf.size, col, pr, True, "hud")
        dr.text(((W - w2) // 2, yc + 70), sub, font=sf, fill=(*DIMW, int(210 * pr)))
        dc.logw((W - w2) // 2, yc + 70, w2, sf.size, DIMW, 0.82 * pr, True, "hud")

def chrome_shot0(ctx, f, t):
    eyebrow(ctx, f)
    lab(ctx, 104, 152, "NEH GRANT REVIEW  ·  SPRING 2025", dc.mono(28), BONE, 0.9)
    ar = min(1.0, max(0.0, t - 5.2))
    lab(ctx, 150, 1210, "PROMPT:  DOES THIS RELATE, AT ALL, TO DEI ?", dc.mono(27, m=True), CYAN, ar)

def chrome_shot1(ctx, f, t):
    eyebrow(ctx, f)
    lab(ctx, 150, 1210, "ONE MODEL  ·  ONE WORD BACK", dc.mono(28, m=True), CYAN, min(1.0, max(0.0, t - 10.8)))
    # the DEI? prompt sits on the machine screen, then flips to a hard NO / YES
    q = min(1.0, max(0.0, (t - 10.8) / 1.0)) * (1.0 - min(1.0, max(0.0, (t - 14.0) / 0.4)))
    if q > 0.02:
        qf = dc.fr(88, 900); s = "DEI  ?"; w = dc.tw(s, qf, 0.04)
        if ctx[0] == "plate":
            chip(ctx[1], (W - w) // 2, 700, w, qf.size, q, padx=28, pady=18)
        else:
            dc.tk(ctx[1], s, qf, (150, 220, 255, int(235 * q)), (W - w) // 2, 700, 0.04)
            dc.logw((W - w) // 2, 700, w, qf.size, CYAN, q, True, "hud")
    pr = min(1.0, max(0.0, (t - 14.2) * 3.0))          # snap the YES/NO in fast (never graded mid-fade)
    if pr > 0.02:
        yf = dc.fr(84, 900)
        if ctx[0] == "plate":
            chip(ctx[1], W // 2 - 300, 710, dc.tw("NO", yf), yf.size, pr, padx=24, pady=16)
            chip(ctx[1], W // 2 + 130, 710, dc.tw("YES", yf), yf.size, pr, padx=24, pady=16)
        else:
            dr = ctx[1]
            dc.tk(dr, "NO", yf, (150, 160, 175, int(180 * pr)), W // 2 - 300, 710, 0.02)
            dc.tk(dr, "YES", yf, (255, 110, 96, int(240 * pr)), W // 2 + 130, 710, 0.02)
            dc.logw(W // 2 + 130, 710, dc.tw("YES", yf), yf.size, CRIM, pr, True, "hud")

def chrome_shot2(ctx, f, t):
    eyebrow(ctx, f)
    ar = min(1.0, max(0.0, t - 16.2))
    lab(ctx, 150, 300, "ALASKA NATIVE LANGUAGE ARCHIVE", dc.mono(28, m=True), AMBER, ar)
    lab(ctx, 150, 1210, "DECADES OF RECORDED VOICES", dc.mono(27), BONE, min(1.0, max(0.0, t - 19.6)))
    tp = min(1.0, max(0.0, t - 24.6))
    if tp > 0.02:
        lab(ctx, (W - dc.tw("TERMINATED", dc.fr(72, 900))) // 2, 640, "TERMINATED", dc.fr(72, 900), CRIM, tp)

def chrome_shot3(ctx, f, t):
    eyebrow(ctx, f)
    p1 = min(1.0, max(0.0, (t - 27.4) * 3.0))          # snap the numerals in fast (never graded mid-fade)
    if p1 > 0.02:
        numeral(ctx, "1,400", "GRANTS TERMINATED", CRIM, 470, p1, big=108)
    p2 = min(1.0, max(0.0, (t - 30.7) * 3.0))
    if p2 > 0.02:
        numeral(ctx, "$100M  ·  22 DAYS", "ACROSS THE COUNTRY", DIMW, 1140, p2, big=72)

def chrome_shot4(ctx, f, t):
    eyebrow(ctx, f)
    lab(ctx, 150, 300, "THE MODEL DID NOT DECIDE", dc.mono(28, m=True), BONE, min(1.0, max(0.0, t - 34.2)))
    lab(ctx, 150, 360, "A PERSON AIMED IT  ·  A PERSON SIGNED", dc.mono(26), DIMW, min(1.0, max(0.0, t - 35.4)))
    gr = min(1.0, max(0.0, t - 39.0))
    lab(ctx, (W - dc.tw("COURT: UNLAWFUL  ·  OFFERED BACK JUNE 2026", dc.mono(27, m=True))) // 2, 1210,
        "COURT: UNLAWFUL  ·  OFFERED BACK JUNE 2026", dc.mono(27, m=True), GREEN, gr)

def chrome_shot5(ctx, f, t):
    eyebrow(ctx, f)
    lab(ctx, 104, 152, "OFFERED BACK IS NOT RESTORED", dc.mono(28, m=True), AMBER, min(1.0, max(0.0, t - 43.6)))
    lab(ctx, (W - dc.tw("A HUMAN READS EVERY LINE", dc.mono(28, m=True))) // 2, 1210,
        "A HUMAN READS EVERY LINE", dc.mono(28, m=True), BONE, min(1.0, max(0.0, t - 47.8)))

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
        caption_scrim(out)
        CHROME[si](("plate", out), f, t)
        dc.set_frame_bg(out, f)
        dr = ImageDraw.Draw(out)
        CHROME[si](("text", dr), f, t)
        dc.caption(out, f)
        dc.outro_card(out, f)
        dc.flush_textlog(f)
        Image.fromarray(np.asarray(out.convert("RGB"))).save(os.path.join(OUT, f"frame_{f:05d}.png"), compress_level=1)
    mpath = os.path.join(OUT, "..", "render_manifest.json") if os.environ.get("DIM_MANIFEST_UP") else os.path.join(OUT, "render_manifest.json")
    try:
        old = json.load(open(mpath)).get("samples", [])
        seen = {sm["f"] for sm in dim.MANIFEST}
        dim.MANIFEST.extend(sm for sm in old if sm["f"] not in seen)
        dim.MANIFEST.sort(key=lambda sm: sm["f"])
    except Exception:
        pass
    dim.write_manifest(mpath, NF, extra={"dispatch": "sorted-by-a-machine", "shots": NSHOT})

def emit_shots():
    dc.write_shots([
        {"id": 1, "start": SHOT_START[0], "end": SHOT_END[0], "framing": "map-territory",
         "transition_in": "", "note": "top-down grid of grant cards, cold scanner sweeping"},
        {"id": 2, "start": SHOT_START[1], "end": SHOT_END[1], "framing": "data-panel",
         "transition_in": "fui-boot", "note": "classifier head: card in slot, DEI gate flips YES/NO, stamp arm"},
        {"id": 3, "start": SHOT_START[2], "end": SHOT_END[2], "framing": "macro-closeup",
         "transition_in": "focus-pull", "note": "archive card blooms into amber waveforms; crimson stamp descends; TERMINATED"},
        {"id": 4, "start": SHOT_START[3], "end": SHOT_END[3], "framing": "map-territory",
         "transition_in": "pull-out", "note": "grid: crimson spreads; 1,400 / $100M / 22 DAYS"},
        {"id": 5, "start": SHOT_START[4], "end": SHOT_END[4], "framing": "two-up",
         "transition_in": "mask-wipe", "note": "human hand on the lever; court-green wave restores the archive card"},
        {"id": 6, "start": SHOT_START[5], "end": SHOT_END[5], "framing": "subject-portrait",
         "transition_in": "crossfade", "note": "archive warm with dim gaps; a reader traces every line; outro"},
    ], NF)

def main():
    s = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    e = int(sys.argv[2]) if len(sys.argv) > 2 else NF
    emit_shots()
    render_range(s, e)
    print(f"rendered [{s},{e}) scale={SCALE} arch={dim.ARCH}")

if __name__ == "__main__":
    main()
