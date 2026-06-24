"""
Alaska.Ai Dispatch — "What The Water Says"
Cook Inlet beluga acoustic AI. 1080x1080, 30fps, 900 frames.
Hand-coded PIL/numpy illustration. Locked Alaska.Ai brand tokens.

Render in chunks:  python render.py START END
Single test frames: python render.py test 120 300 450 600 760
"""
import sys, os, math, json, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter
from scipy.interpolate import PchipInterpolator

HERE = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.path.join(HERE, "frames")
FONTS = os.path.join(HERE, "..", "..", ".claude", "skills", "alaska-ai-brief", "fonts")
os.makedirs(FRAMES, exist_ok=True)

W = H = 1080
FPS = 30
NF = 900

# ---------- locked palette ----------
SKY_TOP   = np.array([2, 6, 20], np.float32)      # night sky above surface
FLAGBLUE  = np.array([8, 24, 56], np.float32)     # deep flag-blue water floor
WATER_HI  = np.array([20, 92, 128], np.float32)   # luminous near-surface teal-blue
WATER_MID = np.array([12, 52, 92], np.float32)
GOLD      = (255, 199, 44)
GOLD_HALO = (255, 222, 120)
GREEN     = (26, 229, 164)     # aurora cyan-green
VIOLET    = (123, 91, 255)     # aurora violet
GLACIER   = (150, 205, 235)    # glacier blue
TEAL      = (26, 165, 165)
SNOW      = (244, 250, 255)
CORAL     = (255, 140, 120)
SLATE     = (120, 140, 165)

AUR = [np.array(GREEN, np.float32), np.array([90, 200, 240], np.float32), np.array(VIOLET, np.float32)]

# ---------- fonts ----------
def _fp(name): return os.path.join(FONTS, name)
def fraunces(size, weight=900, opsz=144, italic=False, soft=0):
    f = ImageFont.truetype(_fp("Fraunces-Italic-Var.ttf" if italic else "Fraunces-Var.ttf"), size)
    try: f.set_variation_by_axes([opsz, weight, soft, 0])
    except Exception:
        try: f.set_variation_by_axes([soft, 0, opsz, weight])
        except Exception: pass
    return f
def mono(size, med=False, bold=False):
    n = "JetBrainsMono-Bold.ttf" if bold else ("JetBrainsMono-Medium.ttf" if med else "JetBrainsMono-Regular.ttf")
    return ImageFont.truetype(_fp(n), size)

def tracked(d, text, font, fill, x, y, tr=0.10):
    extra = int(round(font.size*tr)); cur = x
    for ch in text:
        d.text((cur, y), ch, font=font, fill=fill)
        bb = font.getbbox(ch); cur += (bb[2]-bb[0])+extra
    return cur-extra
def tw(text, font, tr=0.10):
    extra = int(round(font.size*tr)); t=0
    for ch in text:
        bb = font.getbbox(ch); t += (bb[2]-bb[0])+extra
    return t-extra

def ease(t): return t*t*(3-2*t)              # smoothstep
def clamp01(x): return max(0.0, min(1.0, x))
def seg_t(f, a, b): return clamp01((f-a)/(b-a))

# =====================================================================
# BACKGROUND  (static, precomputed once)
# =====================================================================
def aurora_band(seed, vc, sp, hf, inten, color, warp, w=W, h=H):
    rng = np.random.default_rng(seed)
    spine = gaussian_filter(rng.standard_normal(w), sigma=hf)
    spine = spine/(np.std(spine)+1e-6)*warp
    streak = gaussian_filter(rng.standard_normal((h, w)), sigma=(2.0, 26.0))
    streak = (streak-streak.min())/(streak.max()-streak.min()+1e-6); streak = streak**1.7
    ys = np.arange(h).reshape(-1,1).astype(np.float32)
    bell = np.exp(-((ys-(vc+spine.reshape(1,-1)))**2)/(2*sp**2))
    field = gaussian_filter(bell*streak*inten, sigma=(8,12))
    return field[:,:,None]*(color/255.0)

SURF = 196   # water surface y

def build_background():
    img = np.zeros((H, W, 3), np.float32)
    # sky above surface
    for y in range(SURF):
        t = (y/max(1,SURF-1))**1.3
        img[y] = SKY_TOP*(1-t) + np.array([6,18,46],np.float32)*t
    # aurora above the surface (brand signature), reflected hint below
    glow = np.zeros_like(img)
    glow += aurora_band(7,  60, 42, 60, 150, AUR[0], 46)
    glow += aurora_band(19, 44, 30, 90, 120, AUR[1], 55)
    glow += aurora_band(31, 84, 54, 40, 95,  AUR[2], 34)
    img[:SURF] = np.clip(img[:SURF] + glow[:SURF], 0, 255)
    # water below surface: luminous teal -> deep flag blue
    for y in range(SURF, H):
        t = ((y-SURF)/(H-SURF))**1.15
        img[y] = WATER_HI*(1-t) + FLAGBLUE*t
    # faint aurora reflection bleeding into the top of the water
    refl = glow[:SURF][::-1]*0.16
    rh = min(refl.shape[0], H-SURF)
    img[SURF:SURF+rh] = np.clip(img[SURF:SURF+rh] + refl[:rh], 0, 255)
    # surface shimmer line
    sline = np.zeros((H,W),np.float32)
    xs = np.arange(W)
    band = 14
    for dy in range(-band, band):
        a = math.exp(-(dy/7.0)**2)
        wob = (np.sin(xs/26.0)+np.sin(xs/61.0+1.3))*1.6
        yy = (SURF+dy+wob).astype(int)
        m = (yy>=0)&(yy<H)
        sline[yy[m], xs[m]] += a
    img += (sline[:,:,None]*np.array([120,180,210],np.float32))*0.5
    # hero radial brightening behind whale centre
    yy,xx = np.mgrid[0:H,0:W]
    r = np.sqrt(((xx-512)/640.0)**2 + ((yy-560)/520.0)**2)
    halo = np.clip(1-r,0,1)**2.2
    img += halo[:,:,None]*np.array([18,60,80],np.float32)
    # baked god-rays from surface
    rays = np.zeros((H,W),np.float32)
    for cx, wid, st in [(360,150,0.55),(560,200,0.7),(760,120,0.5),(900,170,0.45)]:
        for y in range(SURF, H):
            t=(y-SURF)/(H-SURF)
            half=wid*(0.4+1.5*t)
            x0=int(cx- t*120 - half); x1=int(cx - t*120 + half)
            x0=max(0,x0); x1=min(W,x1)
            rays[y, x0:x1] += st*(1-t)**1.6*0.5
    rays = gaussian_filter(rays,(6,26))
    img += rays[:,:,None]*np.array([60,120,150],np.float32)
    # vignette
    r2 = np.sqrt(((xx-540)/760.0)**2+((yy-540)/760.0)**2)
    vig = np.clip(1-(r2-0.55)*0.9,0.35,1.0)
    img *= vig[:,:,None]
    img = np.clip(img,0,255)
    return Image.fromarray(img.astype(np.uint8)).convert("RGBA")

# one extra animated god-ray beam sprite (pasted with pulsing alpha)
def build_beam():
    s = Image.new("L",(W,H),0); d=ImageDraw.Draw(s)
    d.polygon([(540,SURF),(470,H),(640,H)], fill=90)
    s = s.filter(ImageFilter.GaussianBlur(40))
    beam = Image.new("RGBA",(W,H),(0,0,0,0))
    arr = np.array(s)
    col = np.zeros((H,W,4),np.uint8)
    col[...,0]=120; col[...,1]=180; col[...,2]=205; col[...,3]=arr
    return Image.fromarray(col,"RGBA")

# =====================================================================
# BELUGA  (precomputed sprite, faces left)
# =====================================================================
def build_beluga():
    s = 2
    W0, H0 = 680, 400
    SW, SH = W0*s, H0*s
    cy = 196*s
    x0 = 44*s
    L  = 568*s
    tx  = np.array([0.00,0.03,0.08,0.14,0.22,0.32,0.45,0.58,0.70,0.80,0.88,0.94,1.00])
    top = np.array([26,60,86,92,88,82,75,66,56,44,32,23,19])*s
    bot = np.array([14,44,60,70,79,81,77,69,57,43,31,21,17])*s
    xs = np.linspace(0,1,260)
    X = x0+xs*L
    YT = cy - PchipInterpolator(tx, top)(xs)
    YB = cy + PchipInterpolator(tx, bot)(xs)
    body = [(X[i],YT[i]) for i in range(len(xs))] + [(X[i],YB[i]) for i in range(len(xs)-1,-1,-1)]

    # mask (supersampled)
    mask = Image.new("L",(SW,SH),0); md=ImageDraw.Draw(mask)
    md.polygon(body, fill=255)
    # fluke (two lobes, concave trailing edge, centre notch) at tail
    pedx = x0+L*0.93
    tipx = x0+L*1.06
    md.polygon([(pedx, cy-26*s),(tipx, cy-118*s),(x0+L*1.10, cy-96*s),
                (x0+L*1.005, cy-6*s),
                (x0+L*1.10, cy+92*s),(tipx, cy+116*s),(pedx, cy+24*s)], fill=255)
    # pectoral flipper (small rounded paddle, set low and forward)
    md.polygon([(x0+L*0.205, cy+58*s),(x0+L*0.20,cy+118*s),(x0+L*0.25,cy+134*s),
                (x0+L*0.295, cy+96*s),(x0+L*0.28, cy+64*s)], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    alpha = np.array(mask, np.float32)/255.0

    # shading
    yy, xx = np.mgrid[0:SH,0:SW].astype(np.float32)
    base = np.zeros((SH,SW,3),np.float32)
    base[:] = SNOW
    # vertical light: lit top -> shaded glacier belly
    g = np.clip((yy-(cy-90*s))/(190*s),0,1)
    shade = (1-g)[...,None]*np.array([10,16,22],np.float32) + g[...,None]*(np.array([150,188,214],np.float32)-SNOW)
    col = np.clip(base+shade,0,255)
    # soft sheen highlight along upper back
    sheen = np.exp(-((yy-(cy-58*s))/(34*s))**2)*np.clip(1-np.abs(xx-(x0+L*0.42))/(L*0.55),0,1)
    col = np.clip(col + sheen[...,None]*np.array([28,30,34],np.float32),0,255)
    # melon front glow
    melon = np.exp(-(((xx-(x0+24*s))/(90*s))**2+((yy-(cy-30*s))/(120*s))**2))
    col = np.clip(col + melon[...,None]*np.array([24,34,40],np.float32),0,255)

    sprite = np.dstack([col, alpha*255]).astype(np.uint8)
    spr = Image.fromarray(sprite,"RGBA")

    # rim light (top edge) — bright cyan-white stroke
    rim = Image.new("RGBA",(SW,SH),(0,0,0,0)); rd=ImageDraw.Draw(rim)
    rd.line([(X[i],YT[i]) for i in range(len(xs))], fill=(225,248,255,235), width=int(3.2*s), joint="curve")
    rim = rim.filter(ImageFilter.GaussianBlur(1.4*s))
    # clip rim to body alpha
    ra = np.array(rim); ra[...,3]=(ra[...,3].astype(np.float32)*alpha).astype(np.uint8)
    spr = Image.alpha_composite(spr, Image.fromarray(ra,"RGBA"))

    dd = ImageDraw.Draw(spr)
    # mouth (gentle beluga smile)
    mxs = np.linspace(x0+6*s, x0+90*s, 30)
    mys = cy+22*s + 16*s*np.sin(np.linspace(0.2,1.05,30))
    dd.line(list(zip(mxs,mys)), fill=(70,96,120,180), width=int(1.6*s), joint="curve")
    # melon crease
    dd.arc([x0+34*s, cy-86*s, x0+150*s, cy+70*s], 120, 210, fill=(120,150,176,120), width=int(1.4*s))
    # eye
    ex, ey = x0+78*s, cy-6*s
    dd.ellipse([ex-6*s,ey-6*s,ex+6*s,ey+6*s], fill=(14,20,30,255))
    dd.ellipse([ex-2*s,ey-3*s,ex+1*s,ey+0*s], fill=(180,210,230,220))

    # downsample
    spr = spr.resize((W0,H0), Image.LANCZOS)
    melon_anchor = (int((x0+10*s)/s), int(cy/s))  # ring origin near nose
    return spr, melon_anchor

def build_depthglow(beluga):
    a = np.array(beluga)[...,3].astype(np.float32)
    g = gaussian_filter(a,18)
    g = (g/g.max()*120).astype(np.uint8)
    col = np.zeros((*g.shape,4),np.uint8)
    col[...,0]=20; col[...,1]=80; col[...,2]=120; col[...,3]=g
    return Image.fromarray(col,"RGBA")

# =====================================================================
# MOORING (hydrophone on a cable) — faces right side
# =====================================================================
def build_mooring():
    sw, sh = 150, 760
    im = Image.new("RGBA",(sw,sh),(0,0,0,0)); d=ImageDraw.Draw(im)
    cx = 86
    # cable
    for y in range(8, sh-70, 2):
        wob = math.sin(y/55.0)*4
        d.line([(cx+wob, y),(cx+wob, y+2)], fill=(150,175,195,150), width=2)
    # surface float (gold buoy) near top
    d.ellipse([cx-22,6,cx+22,50], fill=(255,199,44,255), outline=(255,228,150,255), width=2)
    d.ellipse([cx-9,16,cx+1,28], fill=(255,236,180,220))
    # instrument cylinder (the hydrophone) mid
    iy = 470
    d.rounded_rectangle([cx-17, iy, cx+17, iy+78], radius=8, fill=(36,52,74,255), outline=(150,205,235,255), width=2)
    d.ellipse([cx-7, iy+12, cx+7, iy+26], fill=(26,229,164,255))   # sensor eye (green)
    d.line([(cx-17,iy+44),(cx+17,iy+44)], fill=(150,205,235,160), width=1)
    # anchor weight at bottom
    d.polygon([(cx-26,sh-60),(cx+26,sh-60),(cx+16,sh-18),(cx-16,sh-18)], fill=(60,76,98,255), outline=(120,140,165,255))
    return im, (cx, iy+19)   # sensor world-anchor offset

# =====================================================================
# SPECTROGRAM CARD (bottom) — ship-noise + beluga whistle + detect box
# =====================================================================
SPEC_W, SPEC_H = 768, 150
SPEC_X, SPEC_Y = (W-SPEC_W)//2, 858

def whistle_path(n=120):
    # a beluga "whistle" contour, localized to the centre of the card so the
    # detection box snaps tight around one call (pulled out of the roar)
    u = np.linspace(0,1,n)
    x = 0.34 + u*0.32                                  # centre 34%-66% of card
    fy = 0.64 - 0.40*np.sin(u*math.pi)**0.9 - 0.05*np.sin(u*11)*np.exp(-((u-0.5)*3)**2)
    return x, np.clip(fy,0.07,0.93)

def build_spec_base():
    im = Image.new("RGBA",(SPEC_W,SPEC_H),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle([0,0,SPEC_W-1,SPEC_H-1], radius=14, fill=(6,16,38,236), outline=(150,205,235,90), width=1)
    # faint frequency gridlines
    for i in range(1,5):
        y=int(SPEC_H*i/5); d.line([(10,y),(SPEC_W-10,y)], fill=(120,160,200,26), width=1)
    return im

def draw_spec(img, f):
    """draw animated spectrogram card onto img (RGBA). returns nothing."""
    card = SPEC_BASE.copy(); d = ImageDraw.Draw(card)
    pad = 12
    iw, ih = SPEC_W-2*pad, SPEC_H-2*pad
    # --- ship noise smear (low freq, bottom), grows then persists ---
    a3 = seg_t(f,361,420); a4 = seg_t(f,540,600)
    ship = max(a3*0.8, a4)            # present in act3, returns/holds in act4
    if ship>0.01:
        rng = np.random.default_rng(7)
        noise = np.zeros((ih,iw),np.float32)
        ph = f*0.06
        yy,xx = np.mgrid[0:ih,0:iw].astype(np.float32)
        for k in range(6):
            noise += (0.6/(k+1))*np.abs(np.sin(xx/(20+8*k)+ph+k))*np.exp(-((yy-ih*(0.74-0.07*k))/(ih*0.22))**2)
        noise = gaussian_filter(noise,(3,6)); noise/=noise.max()+1e-6
        layer = np.zeros((ih,iw,4),np.uint8)
        c = np.array(VIOLET,np.float32)*0.55+np.array(SLATE,np.float32)*0.45
        layer[...,0]=c[0]; layer[...,1]=c[1]; layer[...,2]=c[2]
        layer[...,3]=(noise*172*ship).astype(np.uint8)
        card.alpha_composite(Image.fromarray(layer,"RGBA"),(pad,pad))
    # --- playhead sweep ---
    sweep = (f*5) % iw
    d.line([(pad+sweep,pad),(pad+sweep,pad+ih)], fill=(150,205,235,70), width=1)
    # --- beluga whistle contour draws in during act3 ---
    draw_in = seg_t(f,372,470)
    if draw_in>0:
        t,fy = WPATH
        npt = max(2,int(len(t)*ease(draw_in)))
        pts = [(pad+ t[i]*iw, pad+ fy[i]*ih) for i in range(npt)]
        if len(pts)>1:
            for wdt,al in [(7,70),(4,150),(2,255)]:
                col = GOLD if wdt==2 else GREEN
                d.line(pts, fill=(*col,al), width=wdt, joint="curve")
    # --- detection box snaps on, holds, labelled ---
    box = seg_t(f,452,470)
    hold = 1.0 if 452<=f<=660 else (1-seg_t(f,660,700) if f>660 else 0)
    if box>0 and hold>0:
        t,fy = WPATH
        xs0 = pad+ t.min()*iw - 6; xs1 = pad+ t.max()*iw + 6
        ys0 = pad+ (fy.min())*ih - 10; ys1 = pad+ (fy.max())*ih + 10
        # animate snap from slightly larger
        e = ease(box); grow=(1-e)*22
        bx0,by0,bx1,by1 = xs0-grow, ys0-grow, xs1+grow, ys1+grow
        al=int(255*hold)
        d.rounded_rectangle([bx0,by0,bx1,by1], radius=6, outline=(*GOLD,al), width=2)
        # corner ticks
        for cxp,cyp in [(bx0,by0),(bx1,by0),(bx0,by1),(bx1,by1)]:
            d.line([(cxp,cyp),(cxp+(8 if cxp==bx0 else -8),cyp)],fill=(*GOLD,al),width=2)
            d.line([(cxp,cyp),(cxp,cyp+(8 if cyp==by0 else -8))],fill=(*GOLD,al),width=2)
        lf = mono(15, bold=True)
        d.text((bx0, by0-20), "BELUGA CALL", font=lf, fill=(*GOLD,al))
        cf = mono(13)
        conf = "0.97" if f<540 else ("0.97" if (f//6)%2 else "0.71")  # flickers uncertain in act4
        d.text((bx1-34, by1+4), conf, font=cf, fill=(*GREEN,al))
    # label corner
    d.text((pad, SPEC_H-pad-2-13), "PASSIVE ACOUSTIC", font=mono(12), fill=(150,205,235,150))
    d.text((SPEC_W-pad-92, pad-1), "COOK INLET", font=mono(12), fill=(150,205,235,150))
    img.alpha_composite(card,(SPEC_X,SPEC_Y))

# =====================================================================
# small sprites: plane, rings
# =====================================================================
def build_plane():
    im = Image.new("RGBA",(110,54),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.polygon([(8,27),(78,20),(96,27),(78,34)], fill=(235,242,250,255))      # fuselage
    d.polygon([(40,24),(58,4),(64,6),(52,25)], fill=(210,220,235,255))       # wing up
    d.polygon([(40,30),(58,50),(64,48),(52,29)], fill=(190,202,220,255))     # wing down
    d.polygon([(10,27),(22,18),(24,27),(22,36)], fill=(210,220,235,255))     # tail
    return im

def rings(d, ox, oy, f, emits, maxr=300):
    for ef in emits:
        age = (f-ef)
        if age<0 or age>54: continue
        p = age/54.0
        r = 10+ p*maxr
        al = int(150*(1-p)**1.4)
        if al<4: continue
        col = GREEN if p<0.5 else VIOLET
        for dr,da in [(0,al),(5,al//2)]:
            d.ellipse([ox-(r+dr), oy-(r+dr)*0.82, ox+(r+dr), oy+(r+dr)*0.82],
                      outline=(*col, max(0,da)), width=2)

# call emission frames (more during act3)
EMITS = [40, 120, 210, 300, 372, 410, 452, 690, 760, 820]

# =====================================================================
# precompute
# =====================================================================
print("precomputing...", file=sys.stderr)
BG = build_background()
BEAM = build_beam()
BELUGA, MELON = build_beluga()
BDEPTH = build_depthglow(BELUGA)
MOORING, MSENSOR = build_mooring()
SPEC_BASE = build_spec_base()
WPATH = whistle_path()
PLANE = build_plane()
random.seed(11)
SNOWP = [(random.randint(0,W), random.randint(SURF,H), random.uniform(0.6,2.2),
          random.uniform(4,12), random.randint(40,120)) for _ in range(150)]

EYE = mono(15, med=True)

def render_frame(f):
    img = BG.copy()
    d = ImageDraw.Draw(img, "RGBA")

    # animated god-ray shimmer
    pulse = 0.35+0.25*math.sin(f/40.0)
    beam = BEAM.copy()
    if pulse!=1.0:
        ba=np.array(beam); ba[...,3]=(ba[...,3].astype(np.float32)*pulse).astype(np.uint8); beam=Image.fromarray(ba,"RGBA")
    img.alpha_composite(beam, (int(20*math.sin(f/90.0)),0))

    # marine snow
    for (px,py,sz,sp,br) in SNOWP:
        yy = SURF + (py-SURF + f*sp*0.18) % (H-SURF)
        d.ellipse([px-sz,yy-sz,px+sz,yy+sz], fill=(200,225,240,int(br*0.5)))

    # ---- whale (bob + slight drift) ----
    bob = math.sin(f/46.0)*10
    drift = math.sin(f/120.0)*16
    appear = ease(seg_t(f,4,40))
    bx = int(512 - BELUGA.width//2 + drift)
    by = int(548 - BELUGA.height//2 + bob)
    if appear>0:
        gl = BDEPTH.copy()
        if appear<1:
            ga=np.array(gl); ga[...,3]=(ga[...,3].astype(np.float32)*appear).astype(np.uint8); gl=Image.fromarray(ga,"RGBA")
        img.alpha_composite(gl,(bx,by))
        wh = BELUGA
        if appear<1:
            wa=np.array(wh).copy(); wa[...,3]=(wa[...,3].astype(np.float32)*appear).astype(np.uint8); wh=Image.fromarray(wa,"RGBA")
        img.alpha_composite(wh,(bx,by))

    # melon anchor (world)
    ox = bx+MELON[0]; oy = by+MELON[1]

    # ---- sound rings ----
    rings(d, ox, oy, f, EMITS)

    # ---- mooring (act2 reveal, slides down) ----
    if f>=178:
        rev = ease(seg_t(f,178,250))
        mx = 902
        my = int(SURF-30 - (1-rev)*60)
        mo = MOORING
        if rev<1:
            ma=np.array(mo).copy(); ma[...,3]=(ma[...,3].astype(np.float32)*rev).astype(np.uint8); mo=Image.fromarray(ma,"RGBA")
        img.alpha_composite(mo,(mx,my))
        # listening pulse from sensor
        sx,sy = mx+MSENSOR[0], my+MSENSOR[1]
        for ef in [250,320]:
            age=f-ef
            if 0<=age<46:
                p=age/46.0; r=6+p*120; al=int(110*(1-p))
                d.ellipse([sx-r,sy-r*0.82,sx+r,sy+r*0.82], outline=(150,205,235,al), width=2)
        if rev>0.5:
            tracked(d,"HYDROPHONE",mono(13),(150,205,235,int(170*rev)),mx-6,my+560,0.12)

    # ---- spectrogram card (act3+) ----
    if f>=358:
        ca = ease(seg_t(f,358,378))
        if ca>=1: draw_spec(img,f)
        else:
            tmp=Image.new("RGBA",(W,H),(0,0,0,0)); draw_spec(tmp,f)
            ta=np.array(tmp); ta[...,3]=(ta[...,3].astype(np.float32)*ca).astype(np.uint8)
            img.alpha_composite(Image.fromarray(ta,"RGBA"))

    # ---- plane (act5, surface) ----
    if 664<=f<=864:
        pp = seg_t(f,664,864)
        px = int(-120 + pp*(W+240)); py = 120 + int(8*math.sin(f/30.0))
        # dashed survey path
        for xx in range(0, px, 26):
            d.line([(xx,py+30),(xx+13,py+30)], fill=(255,222,120,90), width=2)
        img.alpha_composite(PLANE,(px,py))
        tracked(d,"AERIAL SURVEY",mono(12),(255,222,120,150),px-6,py-22,0.12)

    # ================= CHROME =================
    # eyebrow top-left
    eb = ease(seg_t(f,6,30))
    if eb>0:
        a=int(220*eb)
        tracked(d,"ALASKA.AI",mono(16,bold=True),(255,222,120,a),46,40,0.14)
        wlen=tw("ALASKA.AI",mono(16,bold=True),0.14)
        tracked(d,"/  FIELD SIGNAL",mono(16),(214,230,245,int(160*eb)),46+wlen+14,40,0.14)

    # hero count (act1+), uncertainty wobble in act4
    cc = ease(seg_t(f,40,80))
    if cc>0:
        a=int(235*cc)
        unc = 1.0 if f<512 else 0.55+0.45*math.sin(f/5.0)  # flickers in act4
        nf = fraunces(96, weight=900, opsz=144)
        s_= "≈ 330"
        nx, ny = 720, 250
        tracked(d,s_,nf,(255,222,120,int(a*unc)),nx,ny,0.0)
        tracked(d,"BELUGAS LEFT",mono(15,med=True),(235,245,252,int(180*cc)),nx+4,ny+108,0.18)
        if f>=512:  # the honest "can't count" — a faint ? beside the number
            tracked(d,"?",fraunces(82,weight=900,opsz=144),(255,140,120,int(150*(1-unc+0.4))),nx+214,ny+8,0.0)

    # signoff bottom-centre
    so = ease(seg_t(f,8,34))
    end_boost = ease(seg_t(f,820,880))
    if so>0:
        sf = fraunces(34, weight=900, opsz=144)
        s_="alaska.ai"; wls=tw(s_,sf,0.04)
        a=int(150+95*end_boost)
        tracked(d,s_,sf,(255,255,255,int(a*so)),(W-wls)//2,1018,0.04)

    # caption line under spectro in act3/act4 (tiny honest tag)
    # (kept minimal; narration carries it)

    # fade-in from black
    fin = seg_t(f,0,14)
    if fin<1:
        ov=Image.new("RGBA",(W,H),(0,0,0,int(255*(1-ease(fin)))))
        img.alpha_composite(ov)

    return img.convert("RGB")

def main():
    args = sys.argv[1:]
    if args and args[0]=="test":
        td=os.path.join(HERE,"test"); os.makedirs(td,exist_ok=True)
        for fr in [int(x) for x in args[1:]]:
            render_frame(fr).save(os.path.join(td,f"t_{fr:05d}.png"))
            print("test frame", fr, file=sys.stderr)
        return
    a = int(args[0]); b = int(args[1])
    for f in range(a,b):
        render_frame(f).save(os.path.join(FRAMES,f"frame_{f:05d}.png"))
        if f%50==0: print("frame",f,file=sys.stderr)
    print(f"done {a}-{b}",file=sys.stderr)

if __name__=="__main__":
    main()
