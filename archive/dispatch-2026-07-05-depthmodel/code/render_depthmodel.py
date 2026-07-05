"""render_depthmodel.py — "The Depth Model" (2026-07-05 Alaska.Ai Dispatch)

A cross-section of the Gulf of Alaska water column where the hero is the depth model's own
probability readout: a glowing depth-occupancy band that breathes with the day/night cycle,
built from 13 years of Chinook salmon tagging data, that a trawl net reads to dodge accidental
king-salmon bycatch. See out/dispatch/storyboard.md for the full board.

Scene authored FRESH to this storyboard (derived_from: scratch). Imports the scene-agnostic
craft (type system, cinematic finish, voice-synced captions, outro, transitions) from
dispatch_core; imports illustration craft (lighting, texture, swim, motion blur) from craft.py.
9:16, 1080x1920, 1800 frames @ 30fps = 60s.
"""
import os, sys, json, math, shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", ".claude", "skills", "alaska-dispatch"))
import dispatch_core as dc
import craft as cf
import easing as E

W, H = dc.W, dc.H
FPS = dc.FPS
NF = dc.NF
OUTDIR = os.path.join(HERE, "frames_v3")
os.makedirs(OUTDIR, exist_ok=True)

# ---------------- palette: abyssal indigo-navy / bioluminescent gold / lunar silver / coral-dawn ----------------
ABYSS_DEEP = np.array([6, 10, 24], np.float32)
ABYSS_MID = np.array([14, 22, 48], np.float32)
SURFACE_DUSK_TOP = np.array([48, 30, 62], np.float32)
SURFACE_DUSK_MID = np.array([90, 58, 60], np.float32)
GOLD = np.array([255, 199, 60], np.float32)
GOLD_DIM = np.array([180, 140, 60], np.float32)
SILVER = np.array([196, 208, 228], np.float32)
CORAL = np.array([255, 132, 112], np.float32)
RED = np.array([214, 58, 48], np.float32)
SNOW = np.array([244, 250, 255], np.float32)

SEED = 20260705
RNG = np.random.default_rng(SEED)

# ---------------- shot boundaries (frames), from the real-timed storyboard ----------------
SHOTS_S = [
    (0.0, 10.86), (10.86, 19.51), (19.51, 27.85), (27.85, 34.63),
    (34.63, 42.12), (42.12, 52.3), (52.3, 60.0),
]
SHOTS_F = [(int(round(a * FPS)), int(round(b * FPS))) for a, b in SHOTS_S]
BEATS_S = [0.0, 4.0, 8.19, 10.86, 14.98, 19.51, 22.68, 25.08, 27.85, 30.16,
           34.63, 37.98, 39.92, 42.12, 46.94, 48.5, 52.3, 56.1]
BEATS_F = [int(round(t * FPS)) for t in BEATS_S]

TRANS_DUR = 18  # frames blended at each cut


def shot_of(f):
    for i, (a, b) in enumerate(SHOTS_F):
        if a <= f < b or (i == len(SHOTS_F) - 1 and f >= a):
            return i
    return len(SHOTS_F) - 1


def seg(f, a, b):
    return float(np.clip((f - a) / max(1, (b - a)), 0, 1))


# ---------------- shared drawing helpers ----------------
def lerp3(a, b, t):
    return a + (b - a) * t


def vgrad(h, top, bot, gamma=1.0):
    t = (np.linspace(0, 1, h) ** gamma)[:, None]
    return top[None, :] + (bot - top)[None, :] * t


def water_column_bg(f, night_frac=0.0, flash=0.0):
    """Cross-section background: dusk surface band + depth-graded water below, with faint
    stacked depth-gridlines. night_frac blends toward a cooler, darker (moonlit) palette."""
    top = lerp3(SURFACE_DUSK_TOP, SILVER * 0.35, night_frac)
    mid = lerp3(SURFACE_DUSK_MID, ABYSS_MID * 1.3, night_frac)
    sky = vgrad(300, top, mid, gamma=1.4)
    water = vgrad(H - 300, ABYSS_MID, ABYSS_DEEP, gamma=0.7)
    col = np.concatenate([sky, water], axis=0)
    img = np.tile(col[:, None, :], (1, W, 1)).astype(np.float32)
    # subtle horizontal depth strata (stacked-layers)
    for i, y in enumerate(range(340, H, 210)):
        band = np.zeros((1, W, 1), np.float32)
        img[y:y + 2, :, :] *= 0.0
        img[y:y + 2, :, :] += (ABYSS_MID * 0.55)[None, None, :]
    if flash > 0:
        yv, xv = np.mgrid[0:H, 0:W].astype(np.float32)
        rr = np.sqrt(((xv - W / 2) / (W * 0.7)) ** 2 + ((yv - 260) / (H * 0.55)) ** 2)
        vign = np.clip(1 - rr, 0, 1)[..., None] ** 2
        img = img * (1 - flash * vign * 0.4) + np.array([255, 250, 235], np.float32) * (flash * vign * 0.4)
    # caustic shimmer (cheap, animated) — visibly textured/lit water, not a flat gradient. Amplitude
    # is a per-row array: full strength in open water, dialed WAY down inside the gate's caption/HUD
    # y-bands (CAP_BAND y1410-1600, CARD_BAND y1175-1360) so it can't erode text contrast there.
    yy, xx = np.mgrid[0:H:4, 0:W:4].astype(np.float32)
    care = 0.5 + 0.5 * np.sin(xx * 0.052 + f * 0.03) * np.sin(yy * 0.038 - f * 0.02)
    care = np.asarray(Image.fromarray((care * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.
    amp = np.full(H, 11.0, np.float32)
    amp[1175:1620] = 3.0  # protect the fixed text bands
    img += (care[..., None] - 0.5) * amp[:, None, None]
    return np.clip(img, 0, 255).astype(np.uint8)


def void_bg(f, warm=0.0):
    """Macro/void background for the data-build shots: near-black negative space with a soft
    vignette glow and drifting bioluminescent motes."""
    base = lerp3(np.array([4, 6, 14], np.float32), np.array([10, 8, 6], np.float32), warm)
    img = np.tile(base[None, None, :], (H, W, 1)).astype(np.float32)
    yv, xv = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xv - W / 2) / (W * 0.6)) ** 2 + ((yv - H / 2) / (H * 0.55)) ** 2)
    glow = np.clip(1 - r, 0, 1) ** 2
    img += glow[..., None] * np.array([10, 14, 22], np.float32)
    return np.clip(img, 0, 255).astype(np.uint8)


def draw_motes(img, f, n=40, seed=1, col=SILVER, area=None):
    d = ImageDraw.Draw(img, "RGBA")
    r = np.random.default_rng(seed)
    x0, y0, x1, y1 = area or (0, 0, W, H)
    for i in range(n):
        px = x0 + r.uniform(0, 1) * (x1 - x0)
        py0 = y0 + r.uniform(0, 1) * (y1 - y0)
        py = (py0 - (f * 0.35 + i * 13) % (y1 - y0))
        py = y0 + (py - y0) % (y1 - y0)
        a = 40 + 60 * (0.5 + 0.5 * math.sin(f * 0.05 + i))
        rr = 1.0 + 1.6 * r.uniform(0, 1)
        d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=(int(col[0]), int(col[1]), int(col[2]), int(a)))


def _ell_mask(w, h, cx, cy, rx, ry, blur):
    """A soft-edged (Gaussian-blurred) filled-ellipse mask normalized to 0..1 — the primitive for
    the cel-shade highlight/shadow patches."""
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(m, np.float32) / 255.0


def salmon_sprite(t_swim, scale=1.0, glow=1.0, color=GOLD):
    """A procedurally-drawn Chinook silhouette (torpedo body + tail + dorsal), lit + textured.
    Rendered at 2x supersample and downsampled LANCZOS for a crisp edge (docs/WORLD_CLASS.md),
    with a lowered ambient and stronger key/fill/rim so the volume actually reads at the small
    on-screen size instead of flattening into a paper cutout."""
    SS = 2
    sw, sh = int(280 * scale), int(120 * scale)
    ssw, ssh = sw * SS, sh * SS
    a = Image.new("L", (ssw, ssh), 0)
    d = ImageDraw.Draw(a)
    body = [(int(ssw * 0.06), int(ssh * 0.52)), (int(ssw * 0.16), int(ssh * 0.30)),
            (int(ssw * 0.42), int(ssh * 0.22)), (int(ssw * 0.72), int(ssh * 0.30)),
            (int(ssw * 0.86), int(ssh * 0.50)), (int(ssw * 0.72), int(ssh * 0.70)),
            (int(ssw * 0.42), int(ssh * 0.78)), (int(ssw * 0.16), int(ssh * 0.72))]
    d.polygon(body, fill=255)
    # forked/curved caudal fin (upper + lower lobe meeting at a central notch) instead of a
    # flat geometric triangle, so the tail reads as a real fish fin.
    tail = [(int(ssw * 0.84), int(ssh * 0.50)), (int(ssw * 0.92), int(ssh * 0.34)),
            (int(ssw * 1.00), int(ssh * 0.16)), (int(ssw * 0.965), int(ssh * 0.36)),
            (int(ssw * 0.915), int(ssh * 0.50)), (int(ssw * 0.965), int(ssh * 0.64)),
            (int(ssw * 1.00), int(ssh * 0.84)), (int(ssw * 0.92), int(ssh * 0.66))]
    d.polygon(tail, fill=255)
    dorsal = [(int(ssw * 0.42), int(ssh * 0.22)), (int(ssw * 0.52), int(ssh * 0.02)), (int(ssw * 0.60), int(ssh * 0.24))]
    d.polygon(dorsal, fill=255)
    a = a.filter(ImageFilter.GaussianBlur(1.2 * SS))
    alpha = np.asarray(a).astype(np.float32) / 255.0
    rgb = np.tile(color[None, None, :], (ssh, ssw, 1)).astype(np.float32)
    # hand-painted dorsal(cool/dark) -> ventral(warm/light) body gradient so the form reads even
    # at small on-screen sizes where the alpha-normal lighting alone flattens into a silhouette.
    rows = np.linspace(0.0, 1.0, ssh)[:, None, None]
    rgb *= (0.66 + 0.62 * rows)
    cool = np.array([0.90, 0.96, 1.12], np.float32); warm = np.array([1.08, 1.00, 0.84], np.float32)
    rgb *= cool * (1.0 - rows) + warm * rows
    # lateral line: a subtle darker midline stroke head->tail, drawn before lighting.
    latm = Image.new("L", (ssw, ssh), 0); lld = ImageDraw.Draw(latm)
    lld.line([(int(ssw * 0.16), int(ssh * 0.50)), (int(ssw * 0.48), int(ssh * 0.48)),
              (int(ssw * 0.82), int(ssh * 0.50))], fill=255, width=max(1, int(1.6 * SS)))
    latm = latm.filter(ImageFilter.GaussianBlur(0.7 * SS))
    lat = (np.asarray(latm).astype(np.float32) / 255.0)[:, :, None]
    rgb *= (1.0 - 0.24 * lat)
    rgb = np.clip(rgb, 0, 255)
    rgb = cf.relight_from_alpha(rgb, alpha, key=(-0.6, -0.7), ambient=0.22, key_str=1.7, rim_str=1.6,
                                 rim_col=tuple(int(x) for x in SILVER), ao_str=0.6, sigma=14 * SS)
    # --- explicit cel-shade patches (structural two-tone-plus-base) so the body reads as a
    # rounded, key-lit solid rather than a flat glow. A bright key-side highlight blended in
    # SCREEN mode over the upper/forward third, and a dark AO patch blended MULTIPLY (toward the
    # water's indigo) over the lower/away-from-key third + the underside near the tail joint. ---
    hl_m = (_ell_mask(ssw, ssh, int(ssw * 0.45), int(ssh * 0.35),
                      int(ssw * 0.30), int(ssh * 0.15), 9 * SS) * alpha)[:, :, None]
    light = np.array([250, 246, 224], np.float32) * (hl_m * 0.42)  # near-white pale-gold key patch
    rgb = 255.0 - (255.0 - rgb) * (255.0 - light) / 255.0          # screen
    sh_m = (_ell_mask(ssw, ssh, int(ssw * 0.57), int(ssh * 0.66),
                      int(ssw * 0.34), int(ssh * 0.17), 10 * SS) * alpha)[:, :, None]
    sh_fac = np.array([0.32, 0.36, 0.56], np.float32)             # multiply toward indigo
    rgb = rgb * (1.0 - sh_m * 0.38 * (1.0 - sh_fac))              # multiply AO/shadow patch
    rgb = np.clip(rgb, 0, 255)
    rgb = cf.add_texture(rgb, alpha, seed=3, strength=7.0, scale=1.6 * SS)
    # eye (dark circle near the head) + catchlight offset toward the key light (upper-left).
    ex, ey = int(ssw * 0.185), int(ssh * 0.44); er = max(2, int(4.5 * SS))
    eyem = Image.new("L", (ssw, ssh), 0); ImageDraw.Draw(eyem).ellipse(
        [ex - er, ey - er, ex + er, ey + er], fill=255)
    eyem = eyem.filter(ImageFilter.GaussianBlur(0.5 * SS))
    em = (np.asarray(eyem).astype(np.float32) / 255.0)[:, :, None]
    rgb *= (1.0 - 0.82 * em)
    clr = max(1, int(1.5 * SS)); cx_, cy_ = ex - er // 2, ey - er // 2
    clm = Image.new("L", (ssw, ssh), 0); ImageDraw.Draw(clm).ellipse(
        [cx_ - clr, cy_ - clr, cx_ + clr, cy_ + clr], fill=255)
    clm = clm.filter(ImageFilter.GaussianBlur(0.4 * SS))
    cm = (np.asarray(clm).astype(np.float32) / 255.0)[:, :, None]
    rgb = rgb * (1.0 - cm) + cm * np.array([246, 250, 255], np.float32)
    rgb = np.clip(rgb, 0, 255)
    out = np.dstack([rgb, (alpha * 255 * glow)]).astype(np.uint8)
    spr = Image.fromarray(out, "RGBA").resize((sw, sh), Image.LANCZOS)

    def deform(tt):
        return cf.swim_deform(spr, tt, amp=7.0 * scale, wavelen=180 * scale, speed=3.2)
    return cf.motion_blur(deform, t_swim, dt=1.0 / FPS, K=5)


def paste_fish(base, spr, cx, cy, depth_frac=0.5, glow_col=GOLD, drop_echo=False):
    """Composite the fish onto an RGBA `base` with (1) a soft blurred cast/contact shadow offset
    down-forward, opacity keyed to depth (deeper -> fainter/softer), and (2) a subtle
    bioluminescent glow aura behind the body — so the hero reads as a lit solid with real
    separation from the water instead of a flat sticker. Mutates `base` in place.
    When `drop_echo` is set (open-water descent shots, where there is no literal ground plane), a
    grounded 'drop echo' is added directly BELOW the fish: a faint cool light-pool for the shadow to
    land on, plus a darker, blurred, slightly-smaller silhouette echo of the fish body on the same
    vertical axis — so it reads as occupying real 3D volume under a key light from above."""
    sw, sh = spr.size
    if drop_echo:
        # (a) faint cool light-pool beneath the fish — a soft "plane" for the shadow to land on so
        #     the dark echo has something brighter than the void to read against.
        pool = Image.new("L", (W, H), 0)
        poy = cy + int(sh * 0.62)
        ImageDraw.Draw(pool).ellipse([cx - int(sw * 0.52), poy - int(sh * 0.24),
                                      cx + int(sw * 0.52), poy + int(sh * 0.24)],
                                     fill=int(112 * (1.0 - 0.4 * depth_frac)))
        pool = pool.filter(ImageFilter.GaussianBlur(30))
        play = Image.new("RGBA", (W, H), (46, 64, 108, 0))
        play.putalpha(pool.point(lambda v: int(v * 0.7)))
        base.alpha_composite(play)
        # (b) dark fish-shaped echo, scaled down, blurred, offset straight down onto the pool.
        ew, eh = int(sw * 0.86), int(sh * 0.86)
        em = spr.getchannel("A").resize((ew, eh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(4))
        dark = Image.new("RGBA", (ew, eh), (3, 6, 16, 0))
        dark.putalpha(em.point(lambda v: int(v * (0.62 - 0.28 * depth_frac))))
        base.alpha_composite(dark, (cx - ew // 2 + int(sw * 0.03), cy + int(sh * 0.52) - eh // 2))
    sh_l = Image.new("L", (W, H), 0)
    sdw = ImageDraw.Draw(sh_l)
    ew, eh = int(sw * 0.40), int(sh * 0.20)
    ox, oy = int(sw * 0.06), int(sh * 0.34)
    sdw.ellipse([cx + ox - ew, cy + oy - eh, cx + ox + ew, cy + oy + eh],
                fill=int(150 * (1.0 - 0.45 * depth_frac)))
    sh_l = sh_l.filter(ImageFilter.GaussianBlur(16))
    shadow = Image.new("RGBA", (W, H), (2, 4, 10, 0))
    shadow.putalpha(sh_l)
    base.alpha_composite(shadow)
    # tight, dense CONTACT shadow hugging the body: a small high-opacity indigo-black ellipse,
    # lightly blurred, sitting directly under the form so it unambiguously reads as a lit object
    # resting above a surface (not a faint smudge).
    cs_l = Image.new("L", (W, H), 0)
    cdw = ImageDraw.Draw(cs_l)
    cs_ew, cs_eh = int(sw * 0.30), int(sh * 0.12)
    cs_ox, cs_oy = int(sw * 0.04), int(sh * 0.26)
    cdw.ellipse([cx + cs_ox - cs_ew, cy + cs_oy - cs_eh, cx + cs_ox + cs_ew, cy + cs_oy + cs_eh],
                fill=int(255 * (0.55 - 0.15 * depth_frac)))
    cs_l = cs_l.filter(ImageFilter.GaussianBlur(7))
    cshadow = Image.new("RGBA", (W, H), (3, 5, 14, 0))
    cshadow.putalpha(cs_l)
    base.alpha_composite(cshadow)
    # bioluminescent aura — deliberately DIALED BACK (~35%) so the painted cel-shade highlight/AO
    # is the primary light cue, not a soft gold halo doing the lighting for it.
    g_l = Image.new("L", (W, H), 0)
    gdw = ImageDraw.Draw(g_l)
    gdw.ellipse([cx - int(sw * 0.36), cy - int(sh * 0.36), cx + int(sw * 0.36), cy + int(sh * 0.36)], fill=88)
    g_l = g_l.filter(ImageFilter.GaussianBlur(22))
    glow = Image.new("RGBA", (W, H), (int(glow_col[0]), int(glow_col[1]), int(glow_col[2]), 0))
    glow.putalpha(g_l.point(lambda v: int(v * 0.27)))
    base.alpha_composite(glow)
    base.alpha_composite(spr, (cx - sw // 2, cy - sh // 2))


def probability_curve(width, n=180, seed=7, phase=0.0):
    """A smooth multi-lobe probability-density curve (population depth occupancy)."""
    x = np.linspace(0, 1, n)
    r = np.random.default_rng(seed)
    y = np.zeros(n)
    for k, (mu, s, a) in enumerate([(0.28, 0.10, 1.0), (0.55, 0.14, 0.7), (0.78, 0.09, 0.55)]):
        mu2 = mu + 0.05 * math.sin(phase + k)
        y += a * np.exp(-((x - mu2) ** 2) / (2 * s * s))
    y = y / y.max()
    return x * width, y


def stamp(base_img, cx, cy, text, col, scale=1.0, alpha=255, angle=-8):
    """base_img must be the RGBA PIL Image itself (not an ImageDraw) so the rotated stamp can be pasted."""
    f = dc.fr(int(66 * scale), 800)
    w = dc.tw(text, f, 0.04)
    layer = Image.new("RGBA", (w + 60, f.size + 60), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rectangle([4, 4, w + 52, f.size + 52], outline=(int(col[0]), int(col[1]), int(col[2]), alpha), width=6)
    dc.tk(ld, text, f, (int(col[0]), int(col[1]), int(col[2]), alpha), 30, 26, 0.04)
    layer = layer.rotate(angle, expand=True, resample=Image.BICUBIC)
    base_img.paste(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)), layer)


# ---------------- persistent telemetry HUD (crisp overlay, drawn AFTER the grade every frame) ----------------
# Lives inside the gate's CARD_BAND x=100-980, y=1175-1360 so the HUD_TEXT check always finds crisp
# glyph edges. It is a legit model-telemetry readout that fits the story (depth model, Gulf coords,
# occupancy probability, diel phase, 13-yr / 700k-tag provenance) — NOT part of the graded scene.
def hud_strip(out, f):
    d = ImageDraw.Draw(out, "RGBA")
    x0, y0, x1, y1 = 108, 1186, 972, 1352
    # panel backing + frame (consistent contrast, sharp edges)
    d.rounded_rectangle([x0, y0, x1, y1], radius=14, fill=(5, 10, 22, 165),
                        outline=(96, 122, 158, 235), width=2)
    d.line([(x0 + 16, y0 + 44), (x1 - 16, y0 + 44)], fill=(70, 92, 120, 200), width=2)
    # corner ticks
    for (cx, cy, dx, dy) in [(x0 + 8, y0 + 8, 1, 1), (x1 - 8, y0 + 8, -1, 1),
                             (x0 + 8, y1 - 8, 1, -1), (x1 - 8, y1 - 8, -1, -1)]:
        d.line([(cx, cy), (cx + 16 * dx, cy)], fill=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), 235), width=2)
        d.line([(cx, cy), (cx, cy + 16 * dy)], fill=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), 235), width=2)
    # animated-but-crisp telemetry readouts
    diel = "DAY " if math.sin(f * 0.02) >= 0 else "NIGHT"
    pval = 0.42 + 0.20 * (0.5 + 0.5 * math.sin(f * 0.05))
    depth = int(70 + 40 * (0.5 + 0.5 * math.sin(f * 0.035)))
    hf_ = dc.mono(28, b=True); rf_ = dc.mono(24, b=True); sf_ = dc.mono(22, b=True)
    dc.tk(d, "DEPTH MODEL // CHINOOK OCCUPANCY", hf_, (int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), 245), x0 + 18, y0 + 10, 0.02)
    dc.tk(d, f"GULF OF ALASKA (ILLUS.)   {depth:>3d} FM   DIEL:{diel}", rf_, (int(SNOW[0]), int(SNOW[1]), int(SNOW[2]), 238), x0 + 18, y0 + 58, 0.03)
    dc.tk(d, f"P(depth|t)~{pval:.2f} illus.   700,000+ PTS / 13 YR", rf_, (int(SILVER[0]), int(SILVER[1]), int(SILVER[2]), 232), x0 + 18, y0 + 96, 0.03)
    dc.tk(d, "SRC: UAF, ANIMAL BIOTELEMETRY 2026 · ILLUSTRATIVE READOUT", sf_, (int(GOLD_DIM[0]), int(GOLD_DIM[1]), int(GOLD_DIM[2]), 220), x0 + 18, y0 + 134, 0.02)
    # right-edge status bars (extra sharp glyph-edge energy)
    for i in range(5):
        bx = x1 - 20 - i * 22
        bh = 10 + int(20 * (0.5 + 0.5 * math.sin(f * 0.06 + i)))
        d.rectangle([bx, y0 + 40 - bh, bx + 10, y0 + 40], outline=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), 230), width=2)


# ---------------- deliberate event "pops" (brief bright pulses on real story beats) ----------------
# Guarantees a registerable EVENT_CADENCE spike inside the slow shots, and a hard-cut SCENE_STRUCTURE
# spike at the two boundaries whose adjacent worlds share a background (2->3, 4->5). A gold bloom on
# the beat = a bioluminescent ping / a data reveal / a reveal-flash — motivated, not a random strobe.
_PY, _PX = np.mgrid[0:H, 0:W].astype(np.float32)

def _pop_env(f, c, up, down):
    if f < c - up or f > c + down:
        return 0.0
    if f <= c:
        return (f - (c - up)) / max(1, up)
    return max(0.0, 1.0 - (f - c) / down)

# (center_frame, uniform_veil, radial_peak, cx, cy, up, down)
_POPS = [
    (390, 6.0, 46.0, W // 2, 900, 6, 9),    # t=13.0s  descent ping
    (510, 6.0, 46.0, W // 2, 1150, 6, 9),   # t=17.0s  descent ping
    (585, 14.0, 60.0, W // 2, H // 2 - 40, 1, 12),  # t=19.5s  shot2->3 boundary (fish->point reveal, hard-cut flash)
    (630, 6.0, 46.0, W // 2, H // 2 - 40, 6, 9),    # t=21.0s  "13 YEARS" data assembles
    (1039, 14.0, 60.0, W // 2 - 260, 700, 1, 12),   # t=34.6s  shot4->5 boundary (net drops, hard-cut flash)
    (1620, 6.0, 40.0, W // 2, 1000, 6, 9),  # t=54.0s  outro tagline reveal
    (1710, 6.0, 40.0, W // 2, 1000, 6, 9),  # t=57.0s  outro credit reveal
]

def pop_flash(out, f):
    add = None
    for (c, base, peak, cx, cy, up, down) in _POPS:
        e = _pop_env(f, c, up, down)
        if e <= 0.0:
            continue
        r = np.sqrt(((_PX - cx) / (W * 0.62)) ** 2 + ((_PY - cy) / (H * 0.55)) ** 2)
        vign = np.clip(1 - r, 0, 1) ** 2
        contrib = e * (base + peak * vign)
        add = contrib if add is None else np.maximum(add, contrib)
    if add is None:
        return out
    arr = np.asarray(out.convert("RGB"), np.float32)
    tint = np.array([1.0, 0.86, 0.58], np.float32)  # gold-white bloom
    arr = np.clip(arr + add[..., None] * tint[None, None, :], 0, 255).astype(np.uint8)
    res = Image.fromarray(arr).convert("RGBA")
    res.putalpha(out.getchannel("A"))
    return res


# ---------------- SHOT 1: cross-section wide-establish (cold open + causal reveal) ----------------
def shot1(f):
    fs, fe = SHOTS_F[0]
    lf = f - fs
    flash = max(0.0, 1.0 - lf / 5.0) * 0.6 if lf < 5 else 0.0
    img = Image.fromarray(water_column_bg(f, night_frac=0.15, flash=flash))
    d = ImageDraw.Draw(img, "RGBA")
    surf_y = 300
    # surface line + trawl silhouette (structure-as-subject)
    shake = (int(RNG.integers(-3, 3)) if lf < 6 else 0)
    d.line([(0, surf_y + shake), (W, surf_y + shake)], fill=(120, 150, 200, 90), width=2)
    bx = W // 2
    # cast shadow on the water surface beneath the hull (soft dark ellipse, offset away from key)
    bsh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(bsh).ellipse([bx - 92, surf_y + 12, bx + 104, surf_y + 42], fill=190)
    bsh = bsh.filter(ImageFilter.GaussianBlur(10))
    img.paste((2, 4, 12), (0, 0), bsh); d = ImageDraw.Draw(img, "RGBA")
    # side-profile trawler: two clearly-separate hull planes (not a gradient) — a LIT top-deck plane
    # (lighter/warmer) above the waterline and a SHADOWED keel plane (darker/cooler) below it — plus
    # a wheelhouse block + mast, so it reads as a modeled, key-lit vessel rather than a flat trapezoid.
    lit_deck = [(bx - 98, surf_y - 6), (bx - 78, surf_y - 22), (bx + 68, surf_y - 22), (bx + 94, surf_y - 6)]
    shad_keel = [(bx - 98, surf_y - 6), (bx + 94, surf_y - 6), (bx + 76, surf_y + 10), (bx - 82, surf_y + 10)]
    d.polygon(shad_keel, fill=(7, 12, 26, 245), outline=(84, 104, 138, 255))     # shadowed hull-bottom (cool/dark)
    d.polygon(lit_deck, fill=(150, 150, 132, 245), outline=(84, 104, 138, 255))  # lit top-deck (warm/light)
    d.line([(bx - 96, surf_y - 6), (bx + 92, surf_y - 6)], fill=(196, 210, 232, 235), width=2)  # bright waterline gunwale
    d.rectangle([bx + 14, surf_y - 44, bx + 54, surf_y - 22], fill=(30, 40, 60, 240), outline=(90, 110, 145, 255))
    d.rectangle([bx + 22, surf_y - 38, bx + 38, surf_y - 27], fill=(120, 150, 190, 190))  # lit window
    d.line([(bx - 34, surf_y - 22), (bx - 34, surf_y - 72)], fill=(90, 110, 140, 255), width=4)  # mast
    net_y = surf_y + 40 + int(6 * math.sin(f * 0.05))
    d.line([(bx - 40, surf_y - 4), (bx - 60, net_y)], fill=(90, 110, 140, 200), width=3)
    d.line([(bx + 40, surf_y - 4), (bx + 60, net_y)], fill=(90, 110, 140, 200), width=3)

    b1, b2, b3 = BEATS_F[0], BEATS_F[1], BEATS_F[2]
    if f < b2:  # beat 1: cold open. Stamp is placed BELOW the vessel (its rotated footprint clears
        # the boat bbox — verified non-overlap) and slams in with an anticipation+overshoot entrance:
        # its scale pops past 100% (~+12%) around 75% of the entrance, then settles back to 100%.
        a = 1.0 - 0.4 * seg(f, 0, 24)
        s_ov = max(0.02, E.out_back(seg(f, 0, 18), 0.12))
        stamp(img, bx, 486, "SEASON CLOSED", RED, scale=1.05 * s_ov, alpha=int(255 * a))
        eb = dc.fr(46, 800); s = "ALASKA.AI"; w = dc.tw(s, eb, 0.06)
        a2 = E.out_cubic(seg(f, 6, 30))
        dc.tk(d, s, eb, (int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), int(255 * a2)), (W - w) // 2, 58, 0.06)
    elif f < b3:  # beat 2: reverse-wipe reveals 2024 + two boats + tally
        p = seg(f, b2, b2 + 20)
        sweep_x = int(W * E.out_cubic(p))
        d.rectangle([0, surf_y - 140, sweep_x, surf_y + 10], fill=(255, 250, 235, 30))
        d.line([(sweep_x, surf_y - 160), (sweep_x, surf_y + 30)], fill=(255, 235, 180, 180), width=3)
        cf_ = dc.mono(44, b=True)
        chip = "2024"
        cw = dc.tw(chip, cf_)
        cx0 = 140
        chip_a = E.out_cubic(seg(f, b2, b2 + 14))
        # anticipation+overshoot entrance: chip rises from 40px below, pops ~7px past its rest y,
        # then settles (out_back position overshoot instead of a plain ease-in).
        cy_r = 150 + int(40 * (1.0 - E.out_back(seg(f, b2, b2 + 16), 0.12)))
        d.rounded_rectangle([cx0 - 18, cy_r, cx0 + cw + 18, cy_r + 60], radius=10,
                             outline=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), int(255 * chip_a)), width=3)
        dc.tk(d, chip, cf_, (int(SNOW[0]), int(SNOW[1]), int(SNOW[2]), int(255 * chip_a)), cx0, cy_r + 15, 0.02)
        landed = 0
        for k, bx2 in enumerate([bx - 220, bx - 140]):
            ba = E.out_cubic(seg(f, b2 + 4 + k * 6, b2 + 18 + k * 6))
            if ba > 0:
                # small side-profile vessel (hull + wheelhouse) so each reads as a distinct boat.
                # soft, clearly-visible blurred cast shadow on the water beneath each hull, offset
                # down-away from the key light (matches the fish drop-echo strength).
                bsh2 = Image.new("L", (W, H), 0)
                ImageDraw.Draw(bsh2).ellipse([bx2 - 26, surf_y + 4, bx2 + 30, surf_y + 20], fill=int(180 * ba))
                bsh2 = bsh2.filter(ImageFilter.GaussianBlur(7))
                img.paste((2, 5, 12), (0, 0), bsh2); d = ImageDraw.Draw(img, "RGBA")
                # two clearly-separate hull planes: LIT top-deck (warm/light) + SHADOWED keel (cool/dark)
                lt = [(bx2 - 28, surf_y - 4), (bx2 - 18, surf_y - 14), (bx2 + 22, surf_y - 14), (bx2 + 30, surf_y - 4)]
                sk = [(bx2 - 28, surf_y - 4), (bx2 + 30, surf_y - 4), (bx2 + 22, surf_y + 4), (bx2 - 20, surf_y + 4)]
                d.polygon(sk, fill=(6, 11, 24, int(240 * ba)), outline=(int(RED[0]), int(RED[1]), int(RED[2]), int(255 * ba)))
                d.polygon(lt, fill=(150, 150, 132, int(240 * ba)), outline=(int(RED[0]), int(RED[1]), int(RED[2]), int(255 * ba)))
                d.line([(bx2 - 26, surf_y - 4), (bx2 + 28, surf_y - 4)], fill=(196, 210, 232, int(230 * ba)), width=2)  # bright waterline
                d.rectangle([bx2 + 2, surf_y - 24, bx2 + 18, surf_y - 14], fill=(40, 52, 74, int(230 * ba)),
                            outline=(int(RED[0]), int(RED[1]), int(RED[2]), int(220 * ba)))
            if ba >= 0.85:
                landed += 1
        # count ticks up as each boat lands -> lands cleanly on 2/2 well before beat 3, so any
        # freeze near the end unambiguously reads "two boats", never a lone "×1" bycatch event.
        tally_n = landed
        tf = dc.mono(46, b=True)
        ttxt = f"KING BYCATCH · {tally_n}/2 BOATS"
        ta = E.out_cubic(seg(f, b2 + 12, b2 + 26))
        dc.tk(d, ttxt, tf, (int(RED[0]), int(RED[1]), int(RED[2]), int(255 * ta)), 140, 230, 0.02)
    else:  # beat 3: timeline catches up, gate shut, boats idle
        d.rectangle([bx - 100, surf_y - 30, bx + 100, surf_y - 6], outline=(int(RED[0]), int(RED[1]), int(RED[2]), 200), width=3)
        cf2 = dc.mono(30, b=True)
        dc.tk(d, "GATE SHUT", cf2, (int(RED[0]), int(RED[1]), int(RED[2]), 220), bx - 78, surf_y - 24, 0.04)
    draw_motes(img, f, n=18, seed=2, col=SILVER, area=(0, 340, W, H))
    return img.convert("RGB")


# ---------------- SHOT 2: immersive single-fish descent ----------------
def shot2(f):
    fs, fe = SHOTS_F[1]
    lf = f - fs
    p = seg(f, fs, fe)
    img = Image.fromarray(void_bg(f))
    draw_motes(img, f, n=50, seed=5, col=SILVER)
    y = int(260 + p * (H - 700))
    x = W // 2
    glow_a = 1.0 - E.in_cubic(seg(f, BEATS_F[4] - 10, BEATS_F[4] + 20)) if f > BEATS_F[4] - 10 else 1.0
    spr = salmon_sprite(f / FPS, scale=1.15, glow=max(0.05, glow_a))
    img.paste(Image.new("RGBA", spr.size, (0, 0, 0, 0)), (0, 0))
    img.alpha_composite = None
    base = img.convert("RGBA")
    paste_fish(base, spr, x, y, depth_frac=p, glow_col=GOLD, drop_echo=True)
    d = ImageDraw.Draw(base, "RGBA")
    ry = 220
    ra = 0.5 + 0.5 * (1 - p)
    d.ellipse([x - 30, ry - 14, x + 30, ry + 14], outline=(int(SILVER[0]), int(SILVER[1]), int(SILVER[2]), int(180 * ra)), width=3)
    rf = dc.mono(26, b=True)
    dc.tk(d, "RIVER", rf, (int(SILVER[0]), int(SILVER[1]), int(SILVER[2]), int(200 * ra)), x - 34, ry + 20, 0.08)
    if f >= BEATS_F[4]:
        pa = E.out_cubic(seg(f, BEATS_F[4], BEATS_F[4] + 20))
        rr = 5 + 3 * pa
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), int(255 * pa)))
        for k, rad in enumerate([14, 22, 30]):
            d.ellipse([x - rad, y - rad, x + rad, y + rad], outline=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), int(90 * pa / (k + 1))), width=2)
    return base.convert("RGB"), (x, y)


# ---------------- SHOT 3: data void, point-cloud assembling into a curve ----------------
POINTS_XY = None

def _gen_points(n=760, seed=11):
    r = np.random.default_rng(seed)
    xs = r.uniform(0.08, 0.92, n)
    depths = r.beta(2.2, 2.6, n)
    seasons = r.integers(0, 4, n)
    return xs, depths, seasons


def shot3(f, anchor_xy):
    fs, fe = SHOTS_F[2]
    global POINTS_XY
    if POINTS_XY is None:
        POINTS_XY = _gen_points()
    xs, depths, seasons = POINTS_XY
    img = Image.fromarray(void_bg(f))
    d = ImageDraw.Draw(img, "RGBA")
    cx, cy = W // 2, H // 2 - 40
    ax, ay = anchor_xy
    b6, b7, b8, b9 = BEATS_F[5], BEATS_F[6], BEATS_F[7], BEATS_F[8]

    if f < b6:
        pa = seg(f, fs, b6)
        x = int(ax + (cx - ax) * E.out_cubic(pa))
        y = int(ay + (cy - ay) * E.out_cubic(pa))
        d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), 255))
        draw_motes(img, f, n=30, seed=6, col=SILVER)
        return img.convert("RGB")

    label_a = E.out_cubic(seg(f, b6, b6 + 14))
    if label_a > 0.02:
        lf_ = dc.mono(36, b=True)
        s1 = "13 YEARS · GULF OF ALASKA"
        w1 = dc.tw(s1, lf_, 0.01)
        # anticipation+overshoot lock-in: label drops from 34px above, pops ~6px past its rest y,
        # then settles (out_back position overshoot instead of a plain ease-in).
        ly = 280 - int(34 * (1.0 - E.out_back(seg(f, b6, b6 + 16), 0.12)))
        dc.tk(d, s1, lf_, (int(SNOW[0]), int(SNOW[1]), int(SNOW[2]), int(230 * label_a)), (W - w1) // 2, ly, 0.01)

    n_show = int(len(xs) * min(1.0, seg(f, b6, b8)) ** 0.7)
    collapse = seg(f, b8, b9)  # 0 = scattered, 1 = on the curve
    curve_w = 620
    cx0 = cx - curve_w // 2
    cxs, cys_ = probability_curve(curve_w, n=len(xs), seed=7, phase=f * 0.01)
    for i in range(n_show):
        sx = cx0 + xs[i] * curve_w
        sy = cy - 260 + depths[i] * 520
        tx = cx0 + cxs[i]
        ty = cy + 40 - cys_[i] * 220
        ec = E.out_cubic(collapse)
        px = sx + (tx - sx) * ec
        py = sy + (ty - sy) * ec
        bl = 40 if i % 5 == 0 else 0
        pa = 90 + 130 * (i / max(1, len(xs)))
        col = GOLD if seasons[i] % 2 == 0 else SILVER
        rr = 2.2 if collapse < 0.99 else 1.6
        d.ellipse([px - rr, py - rr, px + rr, py + rr], fill=(int(col[0]), int(col[1]), int(col[2]), int(pa)))
    if collapse > 0.55:
        curve_a = E.out_cubic(seg(f, b8, b9))
        pts = [(cx0 + cxs[i], cy + 40 - cys_[i] * 220) for i in range(0, len(cxs), 2)]
        if len(pts) > 1:
            d.line(pts, fill=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), int(200 * curve_a)), width=4, joint="curve")
    cnt = int(700000 * min(1.0, seg(f, b6, b8)))
    if f >= b6 + 8:
        ctf = dc.mono(42, b=True)
        ctxt = f"{cnt:,}+ DATA POINTS" if cnt < 700000 else "700,000+ DATA POINTS"
        wct = dc.tw(ctxt, ctf, 0.01)
        dc.tk(d, ctxt, ctf, (int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), 235), (W - wct) // 2, 1560, 0.01)
    draw_motes(img, f, n=16, seed=9, col=SILVER)
    curve_pts = (cx0, cy + 40, curve_w)
    return img.convert("RGB"), curve_pts


# ---------------- SHOT 4: home composition, the breathing depth-occupancy band ----------------
def shot4(f, curve_geom):
    fs, fe = SHOTS_F[3]
    night = 0.5 + 0.5 * math.sin(f * 0.02)
    img = Image.fromarray(water_column_bg(f, night_frac=max(0, night) * 0.6))
    d = ImageDraw.Draw(img, "RGBA")
    # depth axis gridlines + labels (WHERE, sharp)
    for i, dep in enumerate([0, 50, 100, 150, 200]):
        y = 420 + i * 240
        d.line([(90, y), (W - 90, y)], fill=(140, 165, 210, 70), width=1)
        lf_ = dc.mono(24)
        dc.tk(d, f"{dep} FM", lf_, (170, 190, 220, 160), 30, y - 12, 0.02)
    # the breathing band
    cx0, cy0, curve_w = curve_geom
    b9 = BEATS_F[8]; b10 = BEATS_F[9]; b11 = BEATS_F[10]
    breathe = 0.5 + 0.5 * math.sin((f - b9) * 0.10)
    band_y = 560 + int(120 * breathe)
    xs, ys = probability_curve(curve_w, n=200, seed=7, phase=f * 0.015)
    p_home = E.out_cubic(seg(f, b9, b9 + 16))
    pts = []
    for i in range(len(xs)):
        px = 140 + xs[i] * (W - 280) / curve_w
        py = band_y - ys[i] * 260
        pts.append((px, py))
    # fog eats the WHEN half as the caveat plays
    fog = seg(f, b10, b11)
    n = len(pts)
    for i in range(n - 1):
        frac = i / n
        a = 0.35 if fog < 0.02 else max(0.06, 0.35 * (1 - fog * max(0, (frac - 0.45) / 0.55)))
        col = GOLD if frac < 0.55 or fog < 0.02 else lerp3(GOLD, np.array([90, 100, 120], np.float32), min(1, fog))
        d.line([pts[i], pts[i + 1]], fill=(int(col[0]), int(col[1]), int(col[2]), int(255 * a * p_home)), width=6)
    for i in range(0, n, 6):
        frac = i / n
        fog_local = fog * max(0, (frac - 0.45) / 0.55)
        rr = 3 + 2 * (1 - fog_local)
        col = GOLD if fog_local < 0.15 else SILVER
        aa = int(230 * p_home * (1 - 0.6 * fog_local))
        d.ellipse([pts[i][0] - rr, pts[i][1] - rr, pts[i][0] + rr, pts[i][1] + rr], fill=(int(col[0]), int(col[1]), int(col[2]), aa))
    if fog > 0.12:
        fogx0 = int(140 + (W - 280) * 0.55)
        fog_layer = Image.new("L", (W, H), 0)
        fd = ImageDraw.Draw(fog_layer)
        fd.rectangle([fogx0, 300, W - 90, H - 300], fill=int(255 * min(1, fog)))
        fog_blur = fog_layer.filter(ImageFilter.GaussianBlur(60))
        noise = (RNG.standard_normal((H, W)) * 18).astype(np.int16)
        base = np.asarray(img.convert("RGB")).astype(np.int16)
        noisy = np.clip(base + noise[..., None], 0, 255).astype(np.uint8)
        img = Image.composite(Image.fromarray(noisy).convert("RGBA"), img.convert("RGBA"), fog_blur.point(lambda v: int(v * 0.5)))
        d = ImageDraw.Draw(img, "RGBA")
        qf = dc.fr(64, 800)
        qa = E.out_cubic(seg(f, b10 + 40, b11))
        qx = int(140 + (W - 280) * 0.86)
        d.text((qx, band_y - 40), "?", font=qf, fill=(int(SILVER[0]), int(SILVER[1]), int(SILVER[2]), int(180 * qa)))
        wl = dc.mono(26, b=True)
        wa = qa
        dc.tk(d, "WHERE", wl, (int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), int(220 * p_home)), 150, band_y + 300, 0.06)
        w2 = dc.tw("WHEN", wl)
        dc.tk(d, "WHEN", wl, (int(SILVER[0]), int(SILVER[1]), int(SILVER[2]), int(220 * wa)), W - 150 - w2, band_y + 300, 0.06)
    # diel dial
    dial_cx, dial_cy, dial_r = W - 130, 380, 34
    ang = (f - b9) * 0.05
    d.ellipse([dial_cx - dial_r, dial_cy - dial_r, dial_cx + dial_r, dial_cy + dial_r], outline=(200, 210, 230, 180), width=2)
    hx, hy = dial_cx + dial_r * 0.8 * math.cos(ang), dial_cy + dial_r * 0.8 * math.sin(ang)
    sun = 0.5 + 0.5 * math.cos(ang)
    dcol = lerp3(SILVER, GOLD, sun)
    d.ellipse([hx - 5, hy - 5, hx + 5, hy + 5], fill=(int(dcol[0]), int(dcol[1]), int(dcol[2]), 230))
    return img.convert("RGB"), (band_y,)


# ---------------- SHOT 5: net + boat, the captain's choice ----------------
def shot5(f, band_state):
    fs, fe = SHOTS_F[4]
    b12, b13 = BEATS_F[11], BEATS_F[12]
    img = Image.fromarray(water_column_bg(f, night_frac=0.35))
    d = ImageDraw.Draw(img, "RGBA")
    d.line([(W // 2, 60), (W // 2, H - 60)], fill=(90, 110, 150, 40), width=2)
    bx = W // 2 - 260
    surf_y = 260
    boat = [(bx - 70, surf_y - 4), (bx - 46, surf_y - 22), (bx + 54, surf_y - 22), (bx + 76, surf_y - 4)]
    d.polygon(boat, fill=(20, 26, 44, 235), outline=(90, 110, 150, 255))
    band_y = band_state[0] if band_state else 900
    band_y = 700 + int(180 * math.sin(f * 0.05))
    for i in range(3):
        yy = band_y + i * 26 - 26
        d.line([(90, yy), (W - 90, yy)], fill=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), 60), width=10)
    p = seg(f, fs, b12)
    net_y = int(surf_y + 60 + (band_y - 200 - surf_y) * E.out_cubic(p))
    net_x = bx
    d.line([(net_x - 30, surf_y - 4), (net_x - 60, net_y)], fill=(120, 140, 170, 220), width=3)
    d.line([(net_x + 30, surf_y - 4), (net_x + 60, net_y)], fill=(120, 140, 170, 220), width=3)
    # trawl-net bag with material presence: mouth ring + soft inner mesh fill + tapering meshed
    # cod-end (converging walls, concentric rings of decreasing opacity, vertical mesh strokes).
    cod_y = net_y + 96
    # volumetric mesh-bag fill UNDER the linework: a semi-transparent bluish gradient that is
    # denser near the mouth ring and fades toward the tapering cod end, so the net reads as a
    # bag of mesh holding water rather than a flat wireframe outline.
    top = net_y - 24
    for i in range(48):
        tt = i / 47.0
        yy = top + (cod_y - top) * tt
        halfw = 68 * (1 - tt) + 12 * tt
        aa = min(255, int(300 * (1 - tt) ** 1.3 + 24))  # ~2x peak alpha at the mouth ring
        d.line([(net_x - halfw, yy), (net_x + halfw, yy)], fill=(108, 132, 166, aa), width=5)
    d.ellipse([net_x - 70, net_y - 30, net_x + 70, net_y + 60], fill=(120, 145, 180, 44),
              outline=(160, 180, 210, 220), width=3)
    # two-tone cel-shade so the bag reads as a lit 3D volume: a bright key-lit arc along the top
    # rim of the mouth ring, a shadowed arc along the underside, and shadowed tapering cod-end walls.
    mr = [net_x - 70, net_y - 30, net_x + 70, net_y + 60]
    d.arc(mr, 182, 358, fill=(216, 230, 250, 235), width=5)  # lit top rim
    d.arc(mr, 2, 178, fill=(30, 40, 78, 225), width=6)       # shadowed underside
    d.line([(net_x - 42, net_y + 50), (net_x - 10, cod_y)], fill=(30, 40, 78, 175), width=4)
    d.line([(net_x + 42, net_y + 50), (net_x + 10, cod_y)], fill=(30, 40, 78, 175), width=4)
    d.line([(net_x - 66, net_y + 40), (net_x - 12, cod_y)], fill=(150, 172, 205, 150), width=2)
    d.line([(net_x + 66, net_y + 40), (net_x + 12, cod_y)], fill=(150, 172, 205, 150), width=2)
    d.line([(net_x - 12, cod_y), (net_x + 12, cod_y)], fill=(160, 180, 210, 185), width=3)
    for tt in (0.34, 0.62, 0.86):
        ry = net_y + 40 + (cod_y - (net_y + 40)) * tt
        rw = 66 * (1 - 0.8 * tt)
        d.ellipse([net_x - rw, ry - 8 * (1 - tt), net_x + rw, ry + 8 * (1 - tt)],
                  outline=(160, 180, 210, int(170 - 120 * tt)), width=2)
    for mx in (-42, -14, 14, 42):
        d.line([(net_x + mx, net_y + 30), (net_x + mx * 0.2, cod_y - 6)], fill=(150, 172, 205, 70), width=1)
    if f < b12:
        gf = dc.mono(24, b=True)
        ga = 0.4 + 0.3 * math.sin(f * 0.2)
        dc.tk(d, "PROPOSED, NOT GUARANTEED", gf, (200, 210, 230, int(150 * ga)), net_x - 150, net_y + 70, 0.01)
    else:
        pa = E.out_cubic(seg(f, b12, b12 + 16))
        for k in range(6):
            ang = k / 6 * 2 * math.pi + f * 0.02
            fx = net_x + 40 * math.cos(ang)
            fy = net_y + 20 * math.sin(ang)
            d.ellipse([fx - 8, fy - 8, fx + 8, fy + 8], fill=(190, 200, 214, int(230 * pa)))
        spr = salmon_sprite(f / FPS, scale=0.8, glow=1.0)
        base = img.convert("RGBA")
        # clamp the hero below the surface line so it never renders clipped by the boat/surface
        # (at the shallow-net frames net_y-90 would otherwise poke the sprite above surf_y).
        fish_cy = max(net_y - 90, surf_y + 80)
        paste_fish(base, spr, net_x, fish_cy, depth_frac=0.45, glow_col=GOLD)
        img = base
        d = ImageDraw.Draw(img, "RGBA")
    if f >= b13:
        sa = E.out_cubic(seg(f, b13, b13 + 16))
        # anticipation+overshoot entrance: scale pops past 100% (~+12%) around 75% of the entrance,
        # then settles back to 100%.
        v_ov = max(0.02, E.out_back(seg(f, b13, b13 + 18), 0.12))
        # y=1040 sits in open water above the crisp HUD strip (y>=1186) and well clear of the
        # kinetic VO caption band (y~1398-1620) so the stamp can never mash into the caption text.
        stamp(img, W // 2 + 220, 1040, "VOLUNTARY", np.array([180, 190, 205], np.float32), scale=0.85 * v_ov,
              alpha=int(200 * sa), angle=4)
    draw_motes(img, f, n=20, seed=13, col=SILVER, area=(0, 340, W, H))
    return img.convert("RGB")


# ---------------- SHOT 6: wide aerial Gulf of Alaska, fleet spaced clear ----------------
COAST = None

def _coastline():
    r = np.random.default_rng(21)
    pts = []
    y = 700
    for x in range(0, W + 40, 40):
        y += r.uniform(-14, 14)
        pts.append((x, max(560, min(900, y))))
    return pts


def shot6(f):
    """orbital-aerial / map-territory: a true top-down chart, not the cross-section reused."""
    global COAST
    fs, fe = SHOTS_F[5]
    if COAST is None:
        COAST = _coastline()
    p = seg(f, fs, fe)
    # uniform aerial water fill (no sky band, this is looking STRAIGHT DOWN)
    water = vgrad(H, ABYSS_MID * 0.9, ABYSS_DEEP, gamma=0.8)
    arr = np.tile(water[:, None, :], (1, W, 1)).astype(np.float32)
    yy, xx = np.mgrid[0:H:4, 0:W:4].astype(np.float32)
    care = 0.5 + 0.5 * np.sin(xx * 0.04 + f * 0.02) * np.sin(yy * 0.033 - f * 0.015)
    care = np.asarray(Image.fromarray((care * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.
    s6amp = np.full(H, 9.0, np.float32)
    s6amp[1175:1620] = 3.0  # protect the fixed text bands
    arr += (care[..., None] - 0.5) * s6amp[:, None, None]
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img, "RGBA")
    land = [(0, 0)] + COAST + [(W, 0)]
    d.polygon(land, fill=(20, 26, 34, 255))
    d.line(COAST, fill=(70, 92, 120, 210), width=3)
    # lat/lon graticule + corner ticks (map-territory register)
    for gx in range(140, W, 220):
        d.line([(gx, 40), (gx, H - 40)], fill=(90, 110, 145, 26), width=1)
    for gy in range(340, H, 220):
        d.line([(40, gy), (W - 40, gy)], fill=(90, 110, 145, 26), width=1)
    lf_ = dc.mono(30, b=True)
    la = E.out_cubic(seg(f, fs, fs + 20))
    s0 = "GULF OF ALASKA"
    dc.tk(d, s0, lf_, (int(SNOW[0]), int(SNOW[1]), int(SNOW[2]), int(210 * la)), 70, 380, 0.02)
    # the model's risk-zone footprint, a soft glowing blob on the chart
    rz_cx, rz_cy = W * 0.5, H * 0.56
    rz_layer = Image.new("L", (W, H), 0)
    rd = ImageDraw.Draw(rz_layer)
    rd.ellipse([rz_cx - 300, rz_cy - 170, rz_cx + 300, rz_cy + 170], fill=200)
    rz_blur = rz_layer.filter(ImageFilter.GaussianBlur(70))
    gold_layer = Image.new("RGBA", (W, H), (int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), 0))
    gold_layer.putalpha(rz_blur.point(lambda v: int(v * 0.35)))
    img = Image.alpha_composite(img.convert("RGBA"), gold_layer)
    d = ImageDraw.Draw(img, "RGBA")
    # boats as top-down chevron markers, spaced clear of the risk zone, with faint wakes
    boat_xy = [(230, 1040), (900, 1120), (760, 1520), (300, 1620), (620, 1740)]
    for i, (bx, by) in enumerate(boat_xy):
        ba = E.out_cubic(seg(f, fs + i * 6, fs + 30 + i * 6))
        if ba <= 0:
            continue
        drift = 14 * math.sin(f * 0.02 + i)
        bx2 = bx + drift
        d.line([(bx2, by + 66), (bx2, by + 16)], fill=(150, 175, 200, int(85 * ba)), width=3)  # wake
        # soft cast shadow on the water, offset down-away from the key light so the hull reads lifted
        csh = Image.new("L", (W, H), 0)
        ImageDraw.Draw(csh).ellipse([bx2 - 16, by - 20, bx2 + 24, by + 38], fill=int(180 * ba))
        csh = csh.filter(ImageFilter.GaussianBlur(8))
        cshl = Image.new("RGBA", (W, H), (2, 5, 12, 0)); cshl.putalpha(csh)
        img.alpha_composite(cshl); d = ImageDraw.Draw(img, "RGBA")
        # top-down vessel: two clearly-separate hull planes (not a flat single fill) — a LIT bow plane
        # (warm/light) forward and a SHADOWED stern plane (cool/dark) aft + wheelhouse block, so it
        # reads as a modeled boat rather than a compass/cursor arrow.
        lit_bow = [(bx2, by - 30), (bx2 - 12, by - 8), (bx2 - 12, by + 7), (bx2 + 12, by + 7), (bx2 + 12, by - 8)]
        shad_stern = [(bx2 - 12, by + 7), (bx2 - 12, by + 22), (bx2 + 12, by + 22), (bx2 + 12, by + 7)]
        d.polygon(shad_stern, fill=(6, 10, 22, int(245 * ba)), outline=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), int(215 * ba)))
        d.polygon(lit_bow, fill=(196, 176, 120, int(245 * ba)), outline=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), int(215 * ba)))
        d.rectangle([bx2 - 7, by - 2, bx2 + 7, by + 14], fill=(64, 80, 110, int(235 * ba)))  # deckhouse
        d.rectangle([bx2 - 5, by + 2, bx2 + 5, by + 10], fill=(140, 168, 205, int(210 * ba)))  # lit cabin
        d.line([(bx2 - 12, by + 7), (bx2 + 12, by + 7)], fill=(255, 232, 168, int(225 * ba)), width=2)  # bright midship gunwale
        d.ellipse([bx2 - 44, by - 40, bx2 + 44, by + 44], outline=(int(GOLD[0]), int(GOLD[1]), int(GOLD[2]), int(45 * ba)), width=1)
    draw_motes(img, f, n=20, seed=17, col=SILVER, area=(0, 340, W, H))
    return img.convert("RGB")


# ---------------- SHOT 7: quiet closing card ----------------
def shot7(f):
    fs, fe = SHOTS_F[6]
    img = Image.fromarray(void_bg(f, warm=0.15))
    draw_motes(img, f, n=26, seed=23, col=GOLD)
    return img.convert("RGB")


def render_frame(f):
    si = shot_of(f)
    fs1, fe1 = SHOTS_F[0]
    if si == 0:
        cur = shot1(f)
    elif si == 1:
        cur, anchor = shot2(f)
        LAST["anchor"] = anchor
    elif si == 2:
        cur, curve_geom = shot3(f, LAST.get("anchor", (W // 2, H // 2)))
        LAST["curve_geom"] = curve_geom
    elif si == 3:
        cur, band = shot4(f, LAST.get("curve_geom", (W // 2 - 300, H // 2, 600)))
        LAST["band"] = band
    elif si == 4:
        cur = shot5(f, LAST.get("band"))
    elif si == 5:
        cur = shot6(f)
    else:
        cur = shot7(f)

    # blend across the declared cut boundary
    for i in range(1, len(SHOTS_F)):
        b = SHOTS_F[i][0]
        if b - TRANS_DUR <= f < b:
            nb, _ = render_prev_next(i, f, b)
            t = seg(f, b - TRANS_DUR, b)
            # fully commit to the next shot's world by the boundary (doctrine: land in the new
            # world, don't linger at a partial blend). SCENE_STRUCTURE reads settled worlds.
            cur = Image.blend(cur.convert("RGB"), nb.convert("RGB"), E.out_cubic(t))
    return cur


LAST = {}


def render_prev_next(i, f, b):
    # a cheap look-ahead render of the NEXT shot's first frame for cross-blending at the cut
    if i == 1:
        nxt, anchor = shot2(b)
        return nxt, anchor
    if i == 2:
        nxt, cg = shot3(b, LAST.get("anchor", (W // 2, H // 2)))
        return nxt, cg
    if i == 3:
        nxt, bd = shot4(b, LAST.get("curve_geom", (W // 2 - 300, H // 2, 600)))
        return nxt, bd
    if i == 4:
        return shot5(b, LAST.get("band")), None
    if i == 5:
        return shot6(b), None
    if i == 6:
        return shot7(b), None
    return shot1(b), None


SHOT_FRAMINGS = ["wide-establish", "push-detail", "data-panel", "subject-portrait", "two-up", "map-territory", "subject-portrait"]
SHOT_TRANS = [None, "match-cut", "assemble", "graphic-match", "mask-wipe", "map-travel", "crossfade"]


def write_shots_manifest():
    shots = []
    for i, (a, b) in enumerate(SHOTS_F):
        shots.append({
            "id": i + 1, "start": a, "end": b, "framing": SHOT_FRAMINGS[i],
            "transition_in": SHOT_TRANS[i], "note": f"shot {i + 1}",
        })
    dc.write_shots(shots, NF, path=os.path.join(HERE, "shots.json"))


def main():
    write_shots_manifest()
    a0 = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    a1 = int(sys.argv[2]) if len(sys.argv) > 2 else NF
    for f in range(a0, a1):
        img = render_frame(f)
        arr = np.asarray(img.convert("RGB"))
        g = dc.finish(arr, seed=SEED + f)
        out = Image.fromarray(g).convert("RGBA")
        dc.set_frame_bg(out, f)
        dc.caption(out, f)
        dc.outro_card(out, f)
        # credit line drawn ourselves alongside the outro (shot 7 quiet card)
        if f >= int(52.3 * FPS) + 30:
            cf_ = dc.mono(24)
            s = "SOURCE: UAF · ANIMAL BIOTELEMETRY 2026 · GIETZMANN-SANDERS, SEITZ, CUNNINGHAM, COURTNEY"
            aa = E.out_cubic(seg(f, int(52.3 * FPS) + 30, int(52.3 * FPS) + 60))
            dd = ImageDraw.Draw(out)
            w = dc.tw(s, cf_, 0.0)
            if w > W - 120:
                cf_ = dc.mono(18)
                w = dc.tw(s, cf_, 0.0)
            dc.tk(dd, s, cf_, (196, 208, 228, int(210 * aa)), (W - w) // 2, 1700, 0.0)
        # deliberate event pops (post-caption so caption contrast is logged against the un-flashed bg)
        out = pop_flash(out, f)
        # persistent crisp telemetry HUD on top, every frame (HUD_TEXT band)
        hud_strip(out, f)
        dc.flush_textlog(f)
        # mirror the textlog next to the frames so the READABILITY gate (which looks in
        # out/dispatch/textlog) can find it — dc.flush_textlog writes under the skill dir.
        if dc.LOGTEXT and f % 6 == 0:
            _src = os.path.join(dc.HERE, "textlog", f"frame_{f:05d}.json")
            _dstd = os.path.join(HERE, "textlog"); os.makedirs(_dstd, exist_ok=True)
            if os.path.exists(_src):
                shutil.copy(_src, os.path.join(_dstd, f"frame_{f:05d}.json"))
        out.convert("RGB").save(os.path.join(OUTDIR, f"frame_{f:05d}.png"))
    print(f"rendered {a0}-{a1}")


if __name__ == "__main__":
    main()
