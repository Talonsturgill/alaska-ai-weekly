"""
dispatch_core.py — the scene-AGNOSTIC craft shared by EVERY Alaska.Ai Dispatch.

IMPORT these helpers; never copy a scene file. This module is the answer to the cookie-cutter failure:
the proven CRAFT (the type system, the cinematic finish/grade, the voice-synced caption engine, the
readability manifest, the branded outro, the 60s timeline) lives here so a new Dispatch reuses it by
`import dispatch_core as dc` — while the COMPOSITION (background, hero staging, camera/POV, layout,
on-screen furniture, motion vector) is authored FRESH in each render_<concept>.py to that run's
storyboard. If you find yourself copying a render_*.py to start a new video, stop: the thing you wanted
to reuse is in here.

Brand throughlines that DO carry every run (and live here): the Fraunces + JetBrains type system, the
ALASKA.AI wordmark/eyebrow + "alaska.ai" signoff + tagline outro, lower-third voice-synced captions,
and the cinematic finishing chain. Everything else is the scene's call.
"""
import os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter
import easing as E

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "..", ".claude", "skills", "alaska-ai-brief", "fonts")
W, H = 1080, 1920
FPS = 30
NF = 1800
# brand accents (a scene picks its OWN color world; these are only the brand-locked type accents)
GOLD = (255, 199, 44); SNOW = (244, 250, 255)

# ---------------- type system (Fraunces Black + JetBrains Mono) ----------------
def fr(sz, wt=900, op=144, it=False, sf=0):
    f = ImageFont.truetype(os.path.join(FONTS, "Fraunces-Italic-Var.ttf" if it else "Fraunces-Var.ttf"), sz)
    try: f.set_variation_by_axes([op, wt, sf, 0])
    except Exception: pass
    return f

def mono(sz, b=False, m=False):
    return ImageFont.truetype(os.path.join(FONTS, "JetBrainsMono-Bold.ttf" if b else ("JetBrainsMono-Medium.ttf" if m else "JetBrainsMono-Regular.ttf")), sz)

def tw(t, f, tr=0.0):
    ex = int(round(f.size * tr)); s = 0
    for c in t:
        b = f.getbbox(c); s += (b[2] - b[0]) + ex
    return s - ex

def tk(d, t, f, fill, x, y, tr=0.0):
    ex = int(round(f.size * tr)); c = x
    for ch in t:
        d.text((c, y), ch, font=f, fill=fill); b = f.getbbox(ch); c += (b[2] - b[0]) + ex

# ---------------- readability manifest for the READABILITY gate ----------------
# Per-word brightness + contrast vs the (post-grade) background, so the gate can prove every word that
# MUST be readable clears a floor. State is internal to this module; a scene drives it per frame via
# set_frame_bg() -> draw text (calling logw for its own HUD strings) -> flush_textlog().
LOGTEXT = os.environ.get("DISPATCH_TEXTLOG") == "1"
TEXTLOG = []
BGLUMA = None

def _lum(a):
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

def set_frame_bg(rgba_or_rgb, f):
    """Call right after the grade, before drawing any text. Captures the background luma the text sits
    on (every 6th frame, matching the gate's sampling) and clears the per-frame log."""
    global BGLUMA, TEXTLOG
    if LOGTEXT and f % 6 == 0:
        TEXTLOG = []
        img = rgba_or_rgb.convert("RGB") if rgba_or_rgb.mode != "RGB" else rgba_or_rgb
        BGLUMA = _lum(np.asarray(img).astype(np.float32))
    else:
        BGLUMA = None

def logw(x, y, w_px, h_px, col, alpha, target, kind):
    """Log a drawn word: its fill brightness, the background behind it, and whether it must be readable now."""
    if not LOGTEXT or BGLUMA is None:
        return
    x0 = max(0, int(x)); y0 = max(0, int(y)); x1 = min(W, int(x + w_px)); y1 = min(H, int(y + h_px))
    if x1 <= x0 or y1 <= y0:
        return
    bg = float(BGLUMA[y0:y1, x0:x1].mean()); fl = float(0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2])
    # a word "must be readable now" only once it is actually PRESENTED (>=62% faded in) — a word still
    # easing in at half opacity is mid-animation, not the read-state. It is still checked at full alpha.
    TEXTLOG.append({"kind": kind, "alpha": round(float(alpha), 3), "fill_luma": round(fl, 1),
                    "bg_luma": round(bg, 1), "vis": round(fl / 255.0 * float(alpha), 3),
                    "target": bool(target) and float(alpha) >= 0.62})

def flush_textlog(f):
    if LOGTEXT and f % 6 == 0:
        d = os.path.join(HERE, "textlog"); os.makedirs(d, exist_ok=True)
        json.dump(TEXTLOG, open(os.path.join(d, f"frame_{f:05d}.json"), "w"))

# ---------------- cinematic finishing chain (linear ACES + brand split-tone + bloom + grain + dither + vignette) ----------------
_Y, _X = np.mgrid[0:H, 0:W].astype(np.float32)
_R = np.sqrt(((_X - W / 2) / (W / 2)) ** 2 + ((_Y - H / 2) / (H / 2)) ** 2)

def finish(u8, seed):
    f = u8.astype(np.float32) / 255.; a, b, c, d, e = 2.51, .03, 2.43, .59, .14
    g = np.clip((f * (a * f + b)) / (f * (c * f + d) + e), 0, 1)
    g = np.clip(g + (g - .5) * .05, 0, 1); lum = (0.2126 * g[..., 0] + 0.7152 * g[..., 1] + 0.0722 * g[..., 2])[..., None]
    sh = (1 - lum) ** 2; hi = lum ** 2
    g = np.clip(g + (np.array([12, 30, 54]) / 255 - .5) * .08 * sh + (np.array([255, 205, 110]) / 255 - .5) * .06 * hi, 0, 1)
    lb = np.clip(lum[..., 0] - .72, 0, 1) / .28; sm = lb[::4, ::4]
    glow = np.asarray(Image.fromarray((np.clip(gaussian_filter(sm, 2.5) + .6 * gaussian_filter(sm, 6), 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.
    g = 1 - (1 - g) * (1 - np.clip(glow[..., None] * np.array([1, .85, .6]) * .12, 0, 1))
    g = g * (0.85 + 0.15 * (1 / (1 + (_R * 1.45) ** 2) ** 2))[..., None]
    rng = np.random.default_rng(seed); n = gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 1.1); n /= n.std() + 1e-6
    g = g + (n * np.exp(-((lum[..., 0] - .4) ** 2) / (2 * .25 ** 2)) * (4.0 / 255.))[..., None]
    g = np.clip(g + (rng.random((H, W, 1)) + rng.random((H, W, 1)) - 1) / 255., 0, 1)
    return (g * 255).astype(np.uint8)

# ---------------- audio timing + voice word-timings (shared 60s timeline) ----------------
TIM = json.load(open(os.path.join(HERE, "audio", "timing60.json")))
BEATS = TIM["beats"]
CUES = json.load(open(os.path.join(HERE, "audio", "words60.json")))["words"]

# ---------------- captions: voice-synced kinetic phrases (lower third, brand throughline) ----------------
def _wrap(words, fnt, maxw, spw):
    lines = [[]]
    for wd in words:
        cur = lines[-1]; width = sum(tw(x[0], fnt) for x in cur) + spw * len(cur) + tw(wd[0], fnt)
        if cur and width > maxw: lines.append([wd])
        else: cur.append(wd)
    return lines

def caption(out, f):
    t = f / FPS; cue = None
    for c in CUES:
        if c["s"] - 0.28 <= t < c["e"] + 0.14: cue = c; break
    if not cue: return
    s, e = cue["s"], cue["e"]
    ap = E.out_cubic(E.seg(t, s - 0.28, s + 0.06)) * (1.0 - E.seg(t, e - 0.16, e + 0.14))
    if ap <= 0.02: return
    prog = max(0.0, min(1.0, (t - s) / max(0.25, (e - s))))
    raw = cue["w"].split(); tot = max(1, sum(len(w) + 1 for w in raw)); acc = 0; words = []
    for w in raw:
        mid = (acc + (len(w) + 1) / 2.0) / tot; acc += len(w) + 1; words.append((w, mid))
    fnt = fr(58, 650); maxw = W - 2 * 104; spw = int(fnt.size * 0.30)
    lines = _wrap(words, fnt, maxw, spw)
    if len(lines) > 3: fnt = fr(46, 650); spw = int(fnt.size * 0.30); lines = _wrap(words, fnt, maxw, spw)
    nl = len(lines); lh = int(fnt.size * 1.18); blockh = lh * nl; y0 = 1500 - blockh // 2; d = ImageDraw.Draw(out)
    for li, ln in enumerate(lines):
        lr = E.out_cubic(max(0.0, min(1.0, (prog - li / max(1, nl)) / 0.16)))
        la = ap * lr
        if la <= 0.02: continue
        rise = int((1 - lr) * 12)
        lwf = sum(tw(w, fnt) for w, _ in ln) + spw * (len(ln) - 1); x = (W - lwf) // 2; y = y0 + li * lh + rise
        for (w, mid) in ln:
            col = (244, 250, 255) if mid <= prog - 0.05 else (GOLD if mid <= prog + 0.05 else (148, 168, 194))
            d.text((x, y), w, font=fnt, fill=(*col, int(255 * la)), stroke_width=3, stroke_fill=(3, 8, 18, int(225 * la)))
            logw(x, y, tw(w, fnt), fnt.size, col, la, (mid <= prog + 0.05) and (la >= 0.6), "caption")
            x += tw(w, fnt) + spw
    uw = W - 2 * 150; ux = 150; uy = y0 + blockh + 16
    d.line([(ux, uy), (ux + uw, uy)], fill=(70, 90, 116, int(110 * ap)), width=2)
    d.line([(ux, uy), (ux + int(uw * prog), uy)], fill=(*GOLD, int(225 * ap)), width=3)

def outro_card(out, f):
    """Branded sign-off, staged reveals that begin just after the VO ends (adaptive to this run's
    speech length, so it never collides with the last caption). Keeps the outro alive = event cadence."""
    start = max(1600, int(TIM["speech_end"] * FPS) + 14)
    if f < start: return
    d = ImageDraw.Draw(out)
    a1 = E.out_cubic(E.seg(f, start, start + 48))
    if a1 > 0.02:
        wf = fr(78, 800, 144); s = "ALASKA.AI"; w = tw(s, wf, 0.05)
        tk(d, s, wf, (255, 222, 120, int(255 * a1)), (W - w) // 2, 1444 - int((1 - a1) * 16), 0.05)
        logw((W - w) // 2, 1444, w, wf.size, (255, 222, 120), a1, a1 >= 0.6, "outro")
    a2 = E.out_cubic(E.seg(f, start + 44, start + 84))
    if a2 > 0.02:
        tf = fr(40, 600, 144); s = "what's moving in alaska ai, this week"; w = tw(s, tf, 0.02)
        tk(d, s, tf, (228, 240, 250, int(228 * a2)), (W - w) // 2, 1552 - int((1 - a2) * 14), 0.02)
        logw((W - w) // 2, 1552, w, tf.size, (228, 240, 250), a2, a2 >= 0.6, "outro")
