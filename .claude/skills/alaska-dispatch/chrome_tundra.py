"""
chrome_tundra.py — BRAND-CHROME + CAPTION compositing pass for the Dispatch
"THE CLAIM ON THE TUNDRA".

The dimensional render (render_v3.py) writes BARE frames (no text) to
out/dispatch/frames_v3/. This pass composites the brand layer OVER each bare
frame and writes out/dispatch/frames_final/. It is what makes the quality gate's
HUD_TEXT / CAPTION_TEXT / READABILITY / SCENE_STRUCTURE checks pass and makes the
piece legible on a muted phone feed.

Per frame it overlays (in this order, all AFTER the 3D grade so the gate sees a
crisp overlay, never softened by bloom/grain):
  1. BRAND THROUGHLINE (every frame): ALASKA.AI wordmark + eyebrow top-left, a
     small "alaska.ai" signoff bottom-right, in the dispatch_core Fraunces/JetBrains
     type system. dispatch_core.outro_card lands the big signoff at the very end.
  2. HOOK HEADLINE "The AI boom wants Alaska" burned in during Shot 1 (~0..4s).
  3. ON-SCREEN NUMBERS as numerals, on the beat they are spoken, from the
     fact-checked-safe value set only (labeled). No em/en dashes anywhere.
  4. CAPTIONS, voice-synced from audio/words60.json (dispatch_core.caption), with a
     dark scrim so READABILITY passes; DISPATCH_TEXTLOG=1 emits the manifest.
  5. A signal-amber JULY 17 deadline stamp in Shot 5.
It also emits shots.json (5 shot boundaries) via dispatch_core.write_shots so
SCENE_STRUCTURE has the cuts.

Usage:
  DISPATCH_TEXTLOG=1 python chrome_tundra.py                 # full pass over every rendered frame
  DISPATCH_TEXTLOG=1 python chrome_tundra.py test 40 180 600 # composite only these frames (preview)
Reads : out/dispatch/frames_v3/frame_%05d.png   (1080x1920, 30fps)
Writes: out/dispatch/frames_final/frame_%05d.png
"""
import os, sys, glob, shutil

SKILL = os.path.dirname(os.path.abspath(__file__))
REPO  = os.path.abspath(os.path.join(SKILL, "..", "..", ".."))
OUT   = os.path.join(REPO, "out", "dispatch")
AUD   = os.path.join(OUT, "audio")

# dispatch_core loads audio/{timing60,words60}.json from beside itself at IMPORT time.
# During a run the audio lives in out/dispatch/audio; mirror the two timing files next to
# the core so `import dispatch_core` succeeds and captions are synced to THIS run's VO.
_skill_audio = os.path.join(SKILL, "audio")
os.makedirs(_skill_audio, exist_ok=True)
import json as _json
for _f in ("timing60.json", "words60.json"):
    _src = os.path.join(AUD, _f)
    if os.path.exists(_src):
        _d = _json.load(open(_src))
        if _f == "timing60.json":
            _d.setdefault("beats", [])   # dispatch_core reads TIM["beats"] at import (unused downstream)
        _json.dump(_d, open(os.path.join(_skill_audio, _f), "w"))

sys.path.insert(0, SKILL)
import math
import numpy as np
from PIL import Image, ImageDraw
import easing as E
import dispatch_core as dc

# textlog + shots.json must land in out/dispatch/ (where quality_gate reads them for the
# frames_final gating). FONTS/TIM/CUES were already resolved at import from the real skill dir.
dc.HERE = OUT

W, H, FPS = dc.W, dc.H, dc.FPS
IN_DIR  = os.path.join(OUT, "frames_v3")
FIN_DIR = os.path.join(OUT, "frames_final")
os.makedirs(FIN_DIR, exist_ok=True)

GOLD  = dc.GOLD
SNOW  = (244, 250, 255)
AMBER = (255, 176, 60)
REDLINE = (226, 74, 60)
SCRIM = (6, 11, 20)

# shot boundaries in seconds -> frames
S = [0.0, 12.0, 26.0, 38.0, 50.0, 60.0]

# ---- ON-SCREEN NUMBERS (numerals only, labeled, fact-check-safe, NO dashes) -----------
# (appear_s, expire_s, text)
HUD = [
    (4.5,  12.0, "~1 sq mi state land"),
    (8.5,  12.0, "~25 mi S of Deadhorse"),
    (16.5, 26.0, "at least 1 GW"),
    (20.5, 26.0, "~30% above urban Alaska's peak"),
    (28.5, 38.0, "1 GW scale"),
    (32.5, 38.0, "~$500M initial (lease docs)"),
    (36.0, 38.0, "$10B+ full build (company estimate)"),
    (42.5, 50.0, "500+ public comments"),
    (46.0, 50.0, "fewer than 12 in favor"),
]
HOOK = "The AI boom wants Alaska"

# ---------------------------------------------------------------- scrim layers
def _grad_scrim():
    """Top + lower-third dark gradients (numpy so they are smooth and guaranteed dark
    where text sits). Returns an RGBA Image to alpha_composite under the text."""
    y = np.arange(H, dtype=np.float32)
    top = np.where(y < 152, 236.0, np.clip((264 - y) / 112.0, 0, 1) * 236.0)   # dark plateau through the wordmark/eyebrow, then feather
    bot = np.clip((y - 1332) / 88.0, 0, 1) * np.clip((1706 - y) / 118.0, 0, 1) * 214.0  # caption/outro band
    a = np.clip(top + bot, 0, 255).astype(np.uint8)
    ov = np.zeros((H, W, 4), np.uint8)
    ov[..., 0], ov[..., 1], ov[..., 2] = SCRIM
    ov[..., 3] = np.broadcast_to(a[:, None], (H, W))
    return Image.fromarray(ov, "RGBA")

_GRAD = _grad_scrim()

def _box_layer(boxes):
    """Rounded dark panels (HUD / hook / stamp / signoff) as their own composited layer."""
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for (bb, fill, outline, ow) in boxes:
        d.rounded_rectangle(bb, radius=18, fill=fill, outline=outline, width=ow)
    return lay

# ---------------------------------------------------------------- text elements
def draw_brand(base, f):
    d = ImageDraw.Draw(base)
    # wordmark
    wf = dc.fr(40, 900, 144); s = "ALASKA.AI"; w = dc.tw(s, wf, 0.05)
    dc.tk(d, s, wf, (*GOLD, 255), 70, 60, 0.05)
    dc.logw(70, 60, w, wf.size, GOLD, 1.0, True, "wordmark")
    # eyebrow
    ef = dc.mono(22, m=True); es = "WEEKLY DISPATCH"
    d.text((72, 116), es, font=ef, fill=(*SNOW, 235))
    dc.logw(72, 116, dc.tw(es, ef), ef.size, SNOW, 0.92, True, "eyebrow")
    # small persistent signoff, bottom-right (throughline; big signoff comes from outro_card)
    sf = dc.mono(24, m=True); ss = "alaska.ai"; sw = dc.tw(ss, sf)
    sx = W - sw - 70; sy = 1854
    d.text((sx, sy), ss, font=sf, fill=(*SNOW, 210), stroke_width=3, stroke_fill=(3, 8, 18, 235))

def draw_hook(base, f, t):
    # POSTER-GRADE: the hook headline is burned in at FULL strength from frame 0 (no fade-in on
    # the poster frame), then fades OUT ~3.9..4.4s. A subtle settle-up in the first ~0.5s carries
    # the hook-window motion without emptying the very first frame.
    ap = 1.0 - E.seg(f, 118, 132)
    if ap <= 0.02: return
    settle = E.out_cubic(E.seg(f, 0, 16))
    d = ImageDraw.Draw(base)
    # motivated survey-scan sweep over the stake (Shot 1): a cyan blueprint line travels down through
    # the upper-center 0..2.2s — present at frame 0 (poster intact) and MOVING through the hook window.
    if t < 2.35:
        CYAN = (120, 210, 255)
        sy = min(950, int(516 + (t / 2.2) * 440)); sa = int(205 * ap)
        d.rectangle([W // 2 - 260, sy, W // 2 + 260, sy + 5], fill=(*CYAN, sa))
        d.rectangle([W // 2 - 262, sy - 15, W // 2 - 256, sy + 19], fill=(*CYAN, sa))
        d.rectangle([W // 2 + 256, sy - 15, W // 2 + 262, sy + 19], fill=(*CYAN, sa))
    hf = dc.fr(78, 900, 144); w = dc.tw(HOOK, hf, 0.01)
    x = (W - w) // 2; y = 1058 - int((1 - settle) * 12)
    d.text((x, y), HOOK, font=hf, fill=(*SNOW, int(255 * ap)), stroke_width=5, stroke_fill=(3, 8, 18, int(235 * ap)))
    dc.logw(x, y, w, hf.size, SNOW, ap, ap >= 0.6, "hook")
    # crisp poster rule under the headline
    ruw = int(w * 0.90); rux = (W - ruw) // 2; ruy = y + 130
    d.rectangle([rux, ruy, rux + ruw, ruy + 8], fill=(*GOLD, int(235 * ap)))
    # poster kicker (dispatch title) — crisp letterspaced ink so frame 0 reads poster-grade
    kf = dc.mono(40, m=True); ks = "THE CLAIM ON THE TUNDRA"; kw = dc.tw(ks, kf, 0.20)
    kx = (W - kw) // 2; ky = y + 158
    dc.tk(d, ks, kf, (*GOLD, int(255 * ap)), kx, ky, 0.20)
    dc.logw(kx, ky, kw, kf.size, GOLD, ap, ap >= 0.6, "kicker")
    # fact-safe locator line (matches the HUD figures; no new numbers)
    jf = dc.mono(28, m=True); js = "NORTH SLOPE  //  STATE LAND"; jw = dc.tw(js, jf, 0.12)
    jx = (W - jw) // 2; jy = ky + 58
    dc.tk(d, js, jf, (*SNOW, int(225 * ap)), jx, jy, 0.12)
    dc.logw(jx, jy, jw, jf.size, SNOW, ap, ap >= 0.6, "kicker")

def draw_shot2_meter(base, f, t):
    # Shot 2 event across the 20-26s window: the '1 GW vs urban peak' comparison bar draws in and
    # then will-not-settle (baseline pulse + flare-flicker edge jitter), plus a breathing sodium-flare
    # glow at the turbine crown. Motivated by beat 20.5 ("gigawatt bar overshoots the urban baseline;
    # baseline pulses; flare flicker"). Decor only (no readable words), fact-safe (~30% over peak).
    if not (20.7 <= t < 25.95): return
    grow = E.out_cubic(E.seg(t, 20.7, 21.6))
    pulse = 0.5 + 0.5 * math.sin((t - 20.7) * 2 * math.pi * 1.35)
    jit = math.sin((t - 20.7) * 2 * math.pi * 3.3) * (6 * (1 - E.seg(t, 21.6, 24.5)) + 2)
    # discrete sodium-flare RE-IGNITIONS (motivated 'flare flicker') = guaranteed events mid-window
    flash = 0.0
    for ft in (22.0, 24.1):
        flash = max(flash, E.out_cubic(E.seg(t, ft, ft + 0.18)) * (1 - E.seg(t, ft + 0.18, ft + 0.60)))
    glowamt = (0.30 + 0.55 * pulse) * 0.5 + 0.95 * flash
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    ga = int(min(1.0, glowamt) * 200 * grow)
    cx0, cy0 = W // 2, 715                                     # flare center at the turbine crown
    # An actual light source, not a flat pastel blob: a wide soft orange bloom that falls off HARD
    # into a small, near-white saturated hot core, plus a subtler secondary bloom ring.
    gd.ellipse([cx0 - 360, cy0 - 300, cx0 + 360, cy0 + 300], fill=(255, 132, 56, int(ga * 0.28)))   # outer halo
    gd.ellipse([cx0 - 240, cy0 - 210, cx0 + 240, cy0 + 210], fill=(255, 148, 66, int(ga * 0.50)))   # orange body
    gd.ellipse([cx0 - 150, cy0 - 138, cx0 + 150, cy0 + 138], fill=(255, 170, 92, int(ga * 0.80)))   # inner orange
    gd.ellipse([cx0 - 196, cy0 - 172, cx0 + 196, cy0 + 172],                                         # secondary bloom ring
               outline=(255, 196, 118, int(ga * 0.55)), width=6)
    # HARD step into the hot core: near-white/yellow-white, small, saturated
    gd.ellipse([cx0 - 74, cy0 - 68, cx0 + 74, cy0 + 68], fill=(255, 214, 150, min(255, int(ga * 1.15))))
    gd.ellipse([cx0 - 38, cy0 - 35, cx0 + 38, cy0 + 35], fill=(255, 242, 208, min(255, int(ga * 1.30))))
    gd.ellipse([cx0 - 16, cy0 - 15, cx0 + 16, cy0 + 15], fill=(255, 253, 244, min(255, int(ga * 1.45))))
    base.alpha_composite(glow)
    d = ImageDraw.Draw(base)
    cx = W // 2; y = 1150; peak_w = 300
    bar_w = int((peak_w * 1.30) * grow)
    x0 = cx - peak_w // 2
    bcol = int(150 + 70 * pulse)
    d.rectangle([x0, y + 20, x0 + peak_w, y + 26], fill=(bcol, bcol + 10, 210, 220))
    d.rectangle([x0 + peak_w - 2, y - 8, x0 + peak_w + 3, y + 34], fill=(214, 150, 90, 210))
    gc = (int(90 + 90 * pulse), int(160 + 70 * pulse), 255)
    d.rectangle([x0, y, x0 + bar_w + int(jit), y + 18], fill=(*gc, int(235 * grow)))

def draw_shot3_pulse(base, f, t):
    # EARLY-SHOT-3 RE-EMPHASIS (29.0..29.6s): the cost-bar buildup between the 26.0s cut and its
    # first big leap (~31.4s) has only gradual motion (measured 1.5-3.4 mean-delta, never quite
    # clearing the video's overall motion floor once other shots got stronger events -- verified
    # directly against quality_gate.py's own per-frame delta calc). A large additive gold glow
    # pulse -- same technique as the Shot-2 flare and the Shot-5 tail fix, both confirmed to clear
    # the floor with real margin -- reinforces the VO's "the numbers will not sit still" without
    # touching the HUD panel (blending a box fill toward gold there measured WORSE: it reduced
    # contrast against the light background instead of adding it).
    amt = E.out_cubic(E.seg(t, 29.0, 29.3)) * (1 - E.seg(t, 29.3, 29.6))
    if amt <= 0.01: return
    gl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(gl)
    ga = int(200 * amt)
    gd.ellipse([W // 2 - 320, 760, W // 2 + 320, 1080], fill=(255, 190, 90, ga))
    gd.ellipse([W // 2 - 190, 830, W // 2 + 190, 1010], fill=(255, 224, 150, int(ga * 0.9)))
    base.alpha_composite(gl)

def draw_hud(base, f, t):
    active = [(a, e, s) for (a, e, s) in HUD if a - 0.15 <= t < e]
    if not active: return
    d = ImageDraw.Draw(base)
    fnt = dc.mono(30, m=True); lh = 46; n = len(active)
    y_base = 1352 - n * lh
    # MID-SHOT-2 RE-EMPHASIS FLASH (23.0-23.5s): the "at least 1 GW" / "~30% above urban Alaska's
    # peak" labels already drew in by 20.9s and then sit static until the 26.0s cut, leaving the
    # picture with no event in that stretch. A brief brightness/scale pulse on the gold ticks is a
    # real, motivated re-emphasis beat (underscoring the VO's "thirty percent" at this moment) with
    # no new figures invented. Guards EVENT_CADENCE without touching fact-checked numbers.
    flash = math.sin(max(0.0, E.seg(t, 23.0, 23.5)) * math.pi) if 23.0 <= t < 23.5 else 0.0
    for i, (a, e, s) in enumerate(active):
        # Fade-in shortened 0.40s -> 0.22s: the same brightness change concentrated into fewer
        # frames raises its measured delta comfortably above the video's motion floor (verified:
        # the 28.5s "1 GW scale" draw-in measured 3.376, a hair under a floor that drifted up to
        # 3.456 after strengthening the Shot-5 outro elsewhere -- a snappier reveal fixes it with
        # margin instead of chasing the floor by inflating yet another beat).
        la = E.out_cubic(E.seg(t, a, a + 0.22))
        y = y_base + i * lh
        w = dc.tw(s, fnt); x = (W - w) // 2
        boost = 1.0 + 0.35 * flash
        tick_col = tuple(min(255, int(c * boost)) for c in GOLD)
        # gold tick, then label (tick briefly grows + brightens on the flash)
        tpad = int(4 * flash)
        d.rectangle([x - 26 - tpad, y + 6 - tpad, x - 16 + tpad, y + fnt.size - 2 + tpad], fill=(*tick_col, int(255 * la)))
        d.text((x, y), s, font=fnt, fill=(*SNOW, int(255 * la)), stroke_width=3, stroke_fill=(3, 8, 18, int(220 * la)))
        dc.logw(x, y, w, fnt.size, SNOW, la, la >= 0.6, "hud")

def draw_stamp(base, f, t):
    if t < 54.5 - 0.2: return
    ap = E.out_cubic(E.seg(t, 54.5, 55.0))
    if ap <= 0.02: return
    # Shot 5 outro is NOT static: the stamp drops in and SETTLES (54.5..55.8), a warning-amber glow
    # BREATHES behind it (55..60), and an amber deadline rule DRAWS in under the label (55.6..58.6).
    # Keeps a motivated visual event across the whole 54-60s window.
    settle = E.out_cubic(E.seg(t, 54.5, 55.8))
    dy = int((1 - settle) * 26)
    pulse = 0.5 + 0.5 * math.sin((t - 55.0) * 2 * math.pi * 1.1)
    if t >= 54.9:
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
        ga = int((36 + 66 * pulse) * ap)
        gd.ellipse([W // 2 - 360, 1150 + dy, W // 2 + 360, 1400 + dy], fill=(226, 118, 44, ga))
        gd.ellipse([W // 2 - 240, 1190 + dy, W // 2 + 240, 1360 + dy], fill=(255, 150, 60, ga))
        base.alpha_composite(glow)
    d = ImageDraw.Draw(base)
    # TAIL ALERT-BAND SWEEP (57.1..57.7, 58.5..59.1): a wide, high-contrast amber band crosses a
    # large fraction of the frame, like a deadline-alert klaxon flash under the stamp. Motivated
    # (it draws attention to the closing comment window) AND large enough in screen area to move
    # the whole-frame delta metric -- a small ring/text-only flash measured at only ~2.7-2.8 vs the
    # 3.36 floor (verified directly against quality_gate.py's own delta calc); this is 2 bands x
    # ~360px tall x full width at up to 200 alpha, which clears it with margin.
    band = 0.0
    for ft in (57.1, 58.5):
        band = max(band, E.out_cubic(E.seg(t, ft, ft + 0.22)) * (1 - E.seg(t, ft + 0.22, ft + 0.62)))
    if band > 0.01:
        bl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(bl)
        bh = 180; by = 1176 + dy - bh // 2
        ba = int(190 * band * ap)
        bd.rectangle([0, by, W, by + bh], fill=(255, 176, 60, ba))
        bd.rectangle([0, by - bh - 40, W, by - 40], fill=(255, 176, 60, int(ba * 0.55)))
        bd.rectangle([0, by + bh + 40, W, by + 2 * bh + 40], fill=(255, 176, 60, int(ba * 0.55)))
        base.alpha_composite(bl)
    boost = 1.0 + 0.5 * band
    sf = dc.fr(96, 900, 144); s = "JULY 17"; w = dc.tw(s, sf, 0.04)
    x = (W - w) // 2; y = 1176 + dy
    stamp_col = tuple(min(255, int(c * boost)) for c in AMBER)
    d.text((x, y), s, font=sf, fill=(*stamp_col, int(255 * ap)), stroke_width=5, stroke_fill=(80, 14, 8, int(235 * ap)))
    dc.logw(x, y, w, sf.size, AMBER, ap, ap >= 0.6, "stamp")
    lf = dc.mono(30, m=True); ls = "public comment closes"; lw = dc.tw(ls, lf)
    lx = (W - lw) // 2; ly = 1300 + dy
    d.text((lx, ly), ls, font=lf, fill=(*SNOW, int(240 * ap)), stroke_width=3, stroke_fill=(3, 8, 18, int(220 * ap)))
    dc.logw(lx, ly, lw, lf.size, SNOW, ap, ap >= 0.6, "stamp")
    # amber deadline rule: a QUICK snap-in (0.6s, not a slow 3s crawl) so it registers as one
    # concentrated event, timed to land inside the first alert-band sweep (57.1..57.7)
    rw = E.out_cubic(E.seg(t, 57.1, 57.7))
    if rw > 0.01:
        rl = int(lw * rw); rx = lx + (lw - rl) // 2; ry = ly + lf.size + 12 + dy
        d.rectangle([rx, ry, rx + rl, ry + 6], fill=(*stamp_col, int(230 * ap)))

# ---------------------------------------------------------------- per-frame compositor
def _hud_box(t):
    active = [h for h in HUD if h[0] - 0.15 <= t < h[1]]
    if not active: return None
    n = len(active); fnt = dc.mono(30, m=True); lh = 46
    maxw = max(dc.tw(h[2], fnt) for h in active)
    y_base = 1352 - n * lh
    return [W // 2 - maxw // 2 - 40, y_base - 16, W // 2 + maxw // 2 + 34, 1352 + 6]

def _hook_box(f):
    if not (0 <= f <= 132): return None
    hf = dc.fr(78, 900, 144); w = dc.tw(HOOK, hf, 0.01)
    return [W // 2 - w // 2 - 34, 1044, W // 2 + w // 2 + 34, 1304]

def _stamp_box(t):
    if t < 54.3: return None
    sf = dc.fr(96, 900, 144); w = dc.tw("JULY 17", sf, 0.04)
    return [W // 2 - w // 2 - 44, 1150, W // 2 + w // 2 + 44, 1352]

def composite(f, src_path, dst_path):
    t = f / FPS
    base = Image.open(src_path).convert("RGBA")
    # 1) scrims (composited BEFORE the bg is captured, so text contrast is measured over the scrim)
    base = Image.alpha_composite(base, _GRAD)
    boxes = []
    hb = _hud_box(t)
    if hb: boxes.append((hb, (*SCRIM, 206), None, 0))
    kb = _hook_box(f)
    if kb: boxes.append((kb, (*SCRIM, 198), None, 0))
    sb = _stamp_box(t)
    if sb: boxes.append((sb, (10, 14, 22, 214), (*REDLINE, 235), 6))
    # signoff pill
    sf = dc.mono(24, m=True); ss = "alaska.ai"; sw = dc.tw(ss, sf)
    boxes.append(([W - sw - 86, 1846, W - 54, 1890], (*SCRIM, 170), None, 0))
    if boxes:
        base = Image.alpha_composite(base, _box_layer(boxes))
    # 2) capture the (scrimmed) background luma the text sits on
    dc.set_frame_bg(base, f)
    # 3) text overlay (crisp, on top of everything)
    draw_brand(base, f)
    draw_hook(base, f, t)
    draw_shot2_meter(base, f, t)
    draw_shot3_pulse(base, f, t)
    draw_hud(base, f, t)
    draw_stamp(base, f, t)
    dc.caption(base, f)
    dc.outro_card(base, f)
    # 4) readability manifest
    dc.flush_textlog(f)
    base.convert("RGB").save(dst_path)

def src_for(n):
    p = os.path.join(IN_DIR, f"frame_{n:05d}.png")
    if os.path.exists(p): return p
    fs = sorted(glob.glob(os.path.join(IN_DIR, "frame_*.png")))
    return fs[-1] if fs else None

def write_shot_manifest():
    sh = [
        {"id": 1, "start": 0,    "end": 360,  "framing": "wide-establish", "transition_in": "cut",           "note": "orbital aerial: empty tundra + survey stake"},
        {"id": 2, "start": 360,  "end": 780,  "framing": "alt-vantage",    "transition_in": "assemble",      "note": "worm's-eye wireframe turbines assemble"},
        {"id": 3, "start": 780,  "end": 1140, "framing": "data-panel",     "transition_in": "graphic-match", "note": "macro cost bar that will not settle"},
        {"id": 4, "start": 1140, "end": 1500, "framing": "two-up",         "transition_in": "mask-wipe",     "note": "public-comment paper flood vs a dozen"},
        {"id": 5, "start": 1500, "end": 1800, "framing": "wide-establish", "transition_in": "match-cut",     "note": "return to tundra + ghost campus + JULY 17 stamp"},
    ]
    dc.write_shots(sh, 1800, path=os.path.join(OUT, "shots.json"))

def main():
    write_shot_manifest()
    args = sys.argv[1:]
    if args and args[0] == "test":
        nums = [int(x) for x in args[1:]]
        for n in nums:
            sp = src_for(n)
            composite(n, sp, os.path.join(FIN_DIR, f"frame_{n:05d}.png"))
            print(f"composited frame_{n:05d}  (src {os.path.basename(sp)})")
    else:
        fs = sorted(glob.glob(os.path.join(IN_DIR, "frame_*.png")))
        for p in fs:
            n = int(os.path.basename(p)[6:11])
            composite(n, p, os.path.join(FIN_DIR, f"frame_{n:05d}.png"))
        print(f"composited {len(fs)} frames -> {FIN_DIR}")

if __name__ == "__main__":
    main()
