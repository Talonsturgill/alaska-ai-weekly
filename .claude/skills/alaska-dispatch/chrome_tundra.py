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
    (20.5, 26.0, "~30% of urban Alaska's peak"),
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
    ap = E.out_cubic(E.seg(f, 9, 34)) * (1.0 - E.seg(f, 118, 132))   # ~0.3s..4.4s
    if ap <= 0.02: return
    d = ImageDraw.Draw(base)
    hf = dc.fr(78, 900, 144); w = dc.tw(HOOK, hf, 0.01)
    x = (W - w) // 2; y = 1058 - int((1 - ap) * 14)
    d.text((x, y), HOOK, font=hf, fill=(*SNOW, int(255 * ap)), stroke_width=4, stroke_fill=(3, 8, 18, int(235 * ap)))
    dc.logw(x, y, w, hf.size, SNOW, ap, ap >= 0.6, "hook")

def draw_hud(base, f, t):
    active = [(a, e, s) for (a, e, s) in HUD if a - 0.15 <= t < e]
    if not active: return
    d = ImageDraw.Draw(base)
    fnt = dc.mono(30, m=True); lh = 46; n = len(active)
    y_base = 1352 - n * lh
    for i, (a, e, s) in enumerate(active):
        la = E.out_cubic(E.seg(t, a, a + 0.40))
        y = y_base + i * lh
        w = dc.tw(s, fnt); x = (W - w) // 2
        # gold tick, then label
        d.rectangle([x - 26, y + 6, x - 16, y + fnt.size - 2], fill=(*GOLD, int(255 * la)))
        d.text((x, y), s, font=fnt, fill=(*SNOW, int(255 * la)), stroke_width=3, stroke_fill=(3, 8, 18, int(220 * la)))
        dc.logw(x, y, w, fnt.size, SNOW, la, la >= 0.6, "hud")

def draw_stamp(base, f, t):
    if t < 54.5 - 0.2: return
    ap = E.out_cubic(E.seg(t, 54.5, 55.0))
    if ap <= 0.02: return
    d = ImageDraw.Draw(base)
    sf = dc.fr(96, 900, 144); s = "JULY 17"; w = dc.tw(s, sf, 0.04)
    x = (W - w) // 2; y = 1176
    d.text((x, y), s, font=sf, fill=(*AMBER, int(255 * ap)), stroke_width=5, stroke_fill=(80, 14, 8, int(235 * ap)))
    dc.logw(x, y, w, sf.size, AMBER, ap, ap >= 0.6, "stamp")
    lf = dc.mono(30, m=True); ls = "public comment closes"; lw = dc.tw(ls, lf)
    lx = (W - lw) // 2; ly = 1300
    d.text((lx, ly), ls, font=lf, fill=(*SNOW, int(240 * ap)), stroke_width=3, stroke_fill=(3, 8, 18, int(220 * ap)))
    dc.logw(lx, ly, lw, lf.size, SNOW, ap, ap >= 0.6, "stamp")

# ---------------------------------------------------------------- per-frame compositor
def _hud_box(t):
    active = [h for h in HUD if h[0] - 0.15 <= t < h[1]]
    if not active: return None
    n = len(active); fnt = dc.mono(30, m=True); lh = 46
    maxw = max(dc.tw(h[2], fnt) for h in active)
    y_base = 1352 - n * lh
    return [W // 2 - maxw // 2 - 40, y_base - 16, W // 2 + maxw // 2 + 34, 1352 + 6]

def _hook_box(f):
    if not (9 <= f <= 132): return None
    hf = dc.fr(78, 900, 144); w = dc.tw(HOOK, hf, 0.01)
    return [W // 2 - w // 2 - 34, 1044, W // 2 + w // 2 + 34, 1170]

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
