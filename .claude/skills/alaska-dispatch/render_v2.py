"""
Alaska.Ai Dispatch v2 — "What The Water Says" (Cook Inlet beluga acoustic AI)
1080x1350 (4:5), 30fps, 900 frames. Built to docs/VIDEO_PRODUCTION_STANDARD.md.
Upgrades over v1: 4:5 master, glacial-silt authentic water, mother + GRAY calf,
slow push-in + parallax drift, cinematic finishing (ACES grade, brand split-tone,
bloom, cos4 vignette, subtle CA, luma-only midtone grain, TPDF dither), crisp UI
+ open captions on top.

  test:  python render_v2.py test 60 230 470 620 760 860
  range: python render_v2.py 0 900
"""
import sys, os, math, json, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter
from scipy.interpolate import PchipInterpolator
import easing as E

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, "frames_v2"); os.makedirs(FR, exist_ok=True)
FONTS = os.path.join(HERE, "..", "..", ".claude", "skills", "alaska-ai-brief", "fonts")

W, H = 1080, 1350
FPS = 30; NF = 900
SURF = 250                      # water surface y
MARGIN = 90                     # premium safe margin

# ---- palette ----
SKY_TOP  = np.array([3, 8, 22], np.float32)
SKY_HORZ = np.array([10, 26, 52], np.float32)
# glacial-silt water: steely blue-green, turbid (NOT tropical). green survives, blue dies.
WATER_HI = np.array([34, 84, 92], np.float32)    # near-surface steely teal
WATER_MID= np.array([22, 56, 70], np.float32)
WATER_LO = np.array([12, 30, 44], np.float32)    # deep, silty
B_INF    = np.array([40, 70, 66], np.float32)     # veiling light (green-steel) for haze
GOLD = (255, 199, 44); GOLD_HALO=(255, 222, 120)
GREEN=(26,229,164); VIOLET=(123,91,255); GLACIER=(150,205,235)
SNOW=(244,250,255); CORAL=(255,140,120); SLATE=(120,140,165)
AUR=[np.array(GREEN,np.float32), np.array([90,200,240],np.float32), np.array(VIOLET,np.float32)]

def _fp(n): return os.path.join(FONTS,n)
def fraunces(size, weight=900, opsz=144, italic=False, soft=0):
    f=ImageFont.truetype(_fp("Fraunces-Italic-Var.ttf" if italic else "Fraunces-Var.ttf"), size)
    try: f.set_variation_by_axes([opsz,weight,soft,0])
    except Exception:
        try: f.set_variation_by_axes([soft,0,opsz,weight])
        except Exception: pass
    return f
def mono(size, bold=False, med=False):
    n="JetBrainsMono-Bold.ttf" if bold else ("JetBrainsMono-Medium.ttf" if med else "JetBrainsMono-Regular.ttf")
    return ImageFont.truetype(_fp(n), size)
def tw(text,font,tr=0.0):
    ex=int(round(font.size*tr)); t=0
    for ch in text: bb=font.getbbox(ch); t+=(bb[2]-bb[0])+ex
    return t-ex
def tracked(d,text,font,fill,x,y,tr=0.0):
    ex=int(round(font.size*tr)); cur=x
    for ch in text:
        d.text((cur,y),ch,font=font,fill=fill); bb=font.getbbox(ch); cur+=(bb[2]-bb[0])+ex
    return cur-ex

# ============================ FINISHING ============================
def _srgb2lin(c): return np.where(c<=0.04045, c/12.92, ((c+0.055)/1.055)**2.4)
def _lin2srgb(c): return np.where(c<=0.0031308, c*12.92, 1.055*np.maximum(c,0)**(1/2.4)-0.055)
def _aces(x):
    a,b,c,d,e=2.51,0.03,2.43,0.59,0.14
    return np.clip((x*(a*x+b))/(x*(c*x+d)+e),0,1)

_YY,_XX = np.mgrid[0:H,0:W].astype(np.float32)
_u=( _XX/W*2-1)*(W/H); _v=_YY/H*2-1
_R=np.sqrt(_u*_u+_v*_v); _Rn=_R/_R.max()

def finish(rgb_u8, seed):
    f=rgb_u8.astype(np.float32)/255.0
    lin=_srgb2lin(f)
    g=_aces(lin*0.85)                      # filmic tonemap in linear
    g=_lin2srgb(g)
    g=np.clip(g+(g-0.5)*0.05,0,1)          # gentle S
    luma=(0.2126*g[...,0]+0.7152*g[...,1]+0.0722*g[...,2])[...,None]
    sh=(1-luma)**2; hi=luma**2
    g=np.clip(g+(np.array([10,26,54],np.float32)/255-0.5)*0.085*sh
                +(np.array([255,205,110],np.float32)/255-0.5)*0.06*hi,0,1)
    # bloom + halation (fast: single-channel, downscaled 4x, warm-tinted)
    lb=np.clip(luma[...,0]-0.72,0,1)/0.28
    small=lb[::4,::4]
    glow_s=np.clip(gaussian_filter(small,2.5)+0.6*gaussian_filter(small,6.0),0,2)
    glow=np.asarray(Image.fromarray((np.clip(glow_s,0,1)*255).astype(np.uint8)).resize((W,H),Image.BILINEAR),np.float32)/255.0
    g=1-(1-g)*(1-np.clip(glow[...,None]*np.array([1.0,0.85,0.6],np.float32)*0.18,0,1))
    # chromatic aberration (radial, subtle)
    k=0.0028
    sx=np.clip((_XX+ (_XX-W/2)*k).astype(np.int32),0,W-1)
    sy=np.clip((_YY+ (_YY-H/2)*k).astype(np.int32),0,H-1)
    sx2=np.clip((_XX-(_XX-W/2)*k).astype(np.int32),0,W-1)
    sy2=np.clip((_YY-(_YY-H/2)*k).astype(np.int32),0,H-1)
    g[...,0]=g[sy,sx,0]; g[...,2]=g[sy2,sx2,2]
    # cos4 vignette
    vig=1.0/(1.0+(_R/2.6)**2)**2
    g=g*(0.86+0.14*vig)[...,None]
    # luma-only film grain, midtone bell, per-frame
    rng=np.random.default_rng(seed)
    n=gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),1.1); n/=n.std()+1e-6
    amp=np.exp(-((luma[...,0]-0.40)**2)/(2*0.25**2))
    g=g+(n*amp*(9/255.0))[...,None]
    # TPDF dither before 8-bit
    d=(rng.random((H,W,1))+rng.random((H,W,1))-1.0)/255.0
    g=np.clip(g+d,0,1)
    return (g*255).astype(np.uint8)

# ============================ AURORA / WATER ============================
def aurora_band(seed,vc,sp,hf,inten,color,warp,h=SURF+40):
    rng=np.random.default_rng(seed)
    spine=gaussian_filter(rng.standard_normal(W),hf); spine=spine/(np.std(spine)+1e-6)*warp
    streak=gaussian_filter(rng.standard_normal((h,W)),(2.0,26.0))
    streak=(streak-streak.min())/(streak.max()-streak.min()+1e-6); streak=streak**1.7
    ys=np.arange(h).reshape(-1,1).astype(np.float32)
    bell=np.exp(-((ys-(vc+spine.reshape(1,-1)))**2)/(2*sp**2))
    return gaussian_filter(bell*streak*inten,(8,12))[:,:,None]*(color/255.0)

def build_base():
    img=np.zeros((H,W,3),np.float32)
    for y in range(SURF):
        t=(y/max(1,SURF-1))**1.3; img[y]=SKY_TOP*(1-t)+SKY_HORZ*t
    glow=np.zeros((SURF+40,W,3),np.float32)
    glow+=aurora_band(7,70,46,60,150,AUR[0],46)
    glow+=aurora_band(19,52,34,90,120,AUR[1],55)
    glow+=aurora_band(31,96,58,40,95,AUR[2],34)
    img[:SURF]=np.clip(img[:SURF]+glow[:SURF],0,255)
    # water: steely teal near surface -> deep silty, with mid stop
    for y in range(SURF,H):
        t=(y-SURF)/(H-SURF)
        if t<0.5: c=WATER_HI*(1-t*2)+WATER_MID*(t*2)
        else: c=WATER_MID*(1-(t-0.5)*2)+WATER_LO*((t-0.5)*2)
        img[y]=c
    # aurora reflection bleed
    refl=glow[:SURF][::-1]*0.14; rh=min(refl.shape[0],H-SURF)
    img[SURF:SURF+rh]=np.clip(img[SURF:SURF+rh]+refl[:rh],0,255)
    # surface shimmer
    xs=np.arange(W); sline=np.zeros((H,W),np.float32)
    for dy in range(-12,12):
        a=math.exp(-(dy/6.0)**2); wob=(np.sin(xs/26.0)+np.sin(xs/61.0+1.3))*1.6
        yy=(SURF+dy+wob).astype(int); m=(yy>=0)&(yy<H); sline[yy[m],xs[m]]+=a
    img+=(sline[:,:,None]*np.array([90,150,150],np.float32))*0.5
    # god-rays (turbid, soft)
    rays=np.zeros((H,W),np.float32)
    for cx,wid,st in [(360,150,0.5),(560,210,0.62),(770,130,0.46),(900,180,0.4)]:
        for y in range(SURF,H):
            t=(y-SURF)/(H-SURF); half=wid*(0.4+1.6*t)
            x0=max(0,int(cx-t*120-half)); x1=min(W,int(cx-t*120+half)); rays[y,x0:x1]+=st*(1-t)**1.7*0.5
    rays=gaussian_filter(rays,(7,28)); img+=rays[:,:,None]*np.array([40,90,90],np.float32)
    # turbidity haze toward B_inf with depth (Beer-Lambert-ish), heavier deep
    z=np.clip((_YY-SURF)/(H-SURF),0,1)[:,:,None]
    fog=1-np.exp(-1.4*z); img=img*(1-0.35*fog)+B_INF*(0.35*fog)
    # central hero brightening
    r=np.sqrt(((_XX-540)/640)**2+((_YY-660)/560)**2); halo=np.clip(1-r,0,1)**2.2
    img+=halo[:,:,None]*np.array([16,46,52],np.float32)
    return np.clip(img,0,255)

# ============================ BELUGA (parametric color/scale) ============================
def build_beluga(scale=1.0, body=(244,250,255), belly=(150,188,214), rim=(225,248,255)):
    s=2; W0=int(680*scale); H0=int(400*scale); SW,SH=W0*s,H0*s
    cy=int(196*scale)*s; x0=int(44*scale)*s; L=int(568*scale)*s
    tx=np.array([0,.03,.08,.14,.22,.32,.45,.58,.70,.80,.88,.94,1.0])
    top=np.array([26,60,86,92,88,82,75,66,56,44,32,23,19])*scale*s
    bot=np.array([14,44,60,70,79,81,77,69,57,43,31,21,17])*scale*s
    xs=np.linspace(0,1,260); X=x0+xs*L
    YT=cy-PchipInterpolator(tx,top)(xs); YB=cy+PchipInterpolator(tx,bot)(xs)
    body_pts=[(X[i],YT[i]) for i in range(len(xs))]+[(X[i],YB[i]) for i in range(len(xs)-1,-1,-1)]
    mask=Image.new("L",(SW,SH),0); md=ImageDraw.Draw(mask); md.polygon(body_pts,fill=255)
    pedx=x0+L*0.93; tipx=x0+L*1.06
    md.polygon([(pedx,cy-26*s),(tipx,cy-118*s),(x0+L*1.10,cy-96*s),(x0+L*1.005,cy-6*s),
                (x0+L*1.10,cy+92*s),(tipx,cy+116*s),(pedx,cy+24*s)],fill=255)
    md.polygon([(x0+L*0.205,cy+58*s),(x0+L*0.20,cy+118*s),(x0+L*0.25,cy+134*s),
                (x0+L*0.295,cy+96*s),(x0+L*0.28,cy+64*s)],fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(1.2)); alpha=np.array(mask,np.float32)/255.0
    yy,xx=np.mgrid[0:SH,0:SW].astype(np.float32)
    col=np.zeros((SH,SW,3),np.float32); col[:]=body
    g=np.clip((yy-(cy-90*s))/(190*s),0,1)
    col=np.clip(col+(1-g)[...,None]*np.array([8,12,18],np.float32)+g[...,None]*(np.array(belly,np.float32)-np.array(body,np.float32)),0,255)
    sheen=np.exp(-((yy-(cy-58*s))/(34*s))**2)*np.clip(1-np.abs(xx-(x0+L*0.42))/(L*0.55),0,1)
    col=np.clip(col+sheen[...,None]*np.array([24,26,30],np.float32),0,255)
    spr=Image.fromarray(np.dstack([col,alpha*255]).astype(np.uint8),"RGBA")
    rim_l=Image.new("RGBA",(SW,SH),(0,0,0,0)); rd=ImageDraw.Draw(rim_l)
    rd.line([(X[i],YT[i]) for i in range(len(xs))],fill=(*rim,230),width=int(3*s),joint="curve")
    rim_l=rim_l.filter(ImageFilter.GaussianBlur(1.4*s)); ra=np.array(rim_l)
    ra[...,3]=(ra[...,3].astype(np.float32)*alpha).astype(np.uint8)
    spr=Image.alpha_composite(spr,Image.fromarray(ra,"RGBA"))
    dd=ImageDraw.Draw(spr)
    mxs=np.linspace(x0+6*s,x0+90*s,30); mys=cy+22*s+16*s*np.sin(np.linspace(0.2,1.05,30))
    dd.line(list(zip(mxs,mys)),fill=(70,96,120,170),width=int(1.6*s),joint="curve")
    ex,ey=x0+78*s,cy-6*s
    dd.ellipse([ex-6*s,ey-6*s,ex+6*s,ey+6*s],fill=(14,20,30,255))
    dd.ellipse([ex-2*s,ey-3*s,ex+1*s,ey+0*s],fill=(180,210,230,220))
    spr=spr.resize((W0,H0),Image.LANCZOS)
    return spr,(int((x0+10*s)/s/ (1)) , int(cy/s))  # melon anchor approx in sprite px (pre-scale handled)

def depthglow(spr,colr=(20,80,100)):
    a=np.array(spr)[...,3].astype(np.float32); g=gaussian_filter(a,16); g=(g/g.max()*110).astype(np.uint8)
    c=np.zeros((*g.shape,4),np.uint8); c[...,0]=colr[0]; c[...,1]=colr[1]; c[...,2]=colr[2]; c[...,3]=g
    return Image.fromarray(c,"RGBA")

def build_mooring():
    sw,sh=150,900; im=Image.new("RGBA",(sw,sh),(0,0,0,0)); d=ImageDraw.Draw(im); cx=86
    for y in range(8,sh-70,2):
        wob=math.sin(y/55.0)*4; d.line([(cx+wob,y),(cx+wob,y+2)],fill=(150,175,195,140),width=2)
    d.ellipse([cx-22,6,cx+22,50],fill=(255,199,44,255),outline=(255,228,150,255),width=2)
    iy=560; d.rounded_rectangle([cx-17,iy,cx+17,iy+78],radius=8,fill=(36,52,74,255),outline=(150,205,235,255),width=2)
    d.ellipse([cx-7,iy+12,cx+7,iy+26],fill=(26,229,164,255))
    d.polygon([(cx-26,sh-60),(cx+26,sh-60),(cx+16,sh-18),(cx-16,sh-18)],fill=(60,76,98,255),outline=(120,140,165,255))
    return im,(cx,iy+19)

# ---- spectrogram (compact, lower third) ----
SPEC_W,SPEC_H=860,150; SPEC_X,SPEC_Y=(W-SPEC_W)//2, 998
def whistle_path(n=120):
    u=np.linspace(0,1,n); x=0.34+u*0.32
    fy=0.64-0.40*np.sin(u*math.pi)**0.9-0.05*np.sin(u*11)*np.exp(-((u-0.5)*3)**2)
    return x,np.clip(fy,0.07,0.93)
WPATH=whistle_path()
def spec_base():
    im=Image.new("RGBA",(SPEC_W,SPEC_H),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle([0,0,SPEC_W-1,SPEC_H-1],radius=14,fill=(6,16,30,232),outline=(150,205,235,90),width=1)
    for i in range(1,5):
        y=int(SPEC_H*i/5); d.line([(10,y),(SPEC_W-10,y)],fill=(120,160,200,24),width=1)
    return im
SPEC_BASE=spec_base()
def draw_spec(img,f):
    card=SPEC_BASE.copy(); d=ImageDraw.Draw(card); pad=12; iw,ih=SPEC_W-2*pad,SPEC_H-2*pad
    a3=E.seg(f,361,420); a4=E.seg(f,540,600); ship=max(a3*0.8,a4)
    if ship>0.01:
        rng=np.random.default_rng(7); ph=f*0.06; yy,xx=np.mgrid[0:ih,0:iw].astype(np.float32); noise=np.zeros((ih,iw),np.float32)
        for k in range(6): noise+=(0.6/(k+1))*np.abs(np.sin(xx/(20+8*k)+ph+k))*np.exp(-((yy-ih*(0.74-0.07*k))/(ih*0.22))**2)
        noise=gaussian_filter(noise,(3,6)); noise/=noise.max()+1e-6
        lay=np.zeros((ih,iw,4),np.uint8); c=np.array(VIOLET,np.float32)*0.55+np.array(SLATE,np.float32)*0.45
        lay[...,0]=c[0]; lay[...,1]=c[1]; lay[...,2]=c[2]; lay[...,3]=(noise*168*ship).astype(np.uint8)
        card.alpha_composite(Image.fromarray(lay,"RGBA"),(pad,pad))
    d.line([(pad+(f*5)%iw,pad),(pad+(f*5)%iw,pad+ih)],fill=(150,205,235,70),width=1)
    di=E.seg(f,372,470)
    if di>0:
        t,fy=WPATH; npt=max(2,int(len(t)*E.out_cubic(di))); pts=[(pad+t[i]*iw,pad+fy[i]*ih) for i in range(npt)]
        if len(pts)>1:
            for wdt,al,col in [(7,70,GREEN),(4,150,GREEN),(2,255,GOLD)]: d.line(pts,fill=(*col,al),width=wdt,joint="curve")
    box=E.seg(f,452,470); hold=1.0 if 452<=f<=660 else (1-E.seg(f,660,700) if f>660 else 0)
    if box>0 and hold>0:
        t,fy=WPATH; xs0=pad+t.min()*iw-8; xs1=pad+t.max()*iw+8; ys0=pad+fy.min()*ih-10; ys1=pad+fy.max()*ih+10
        e=E.out_cubic(box); grow=(1-e)*22; al=int(255*hold)
        d.rounded_rectangle([xs0-grow,ys0-grow,xs1+grow,ys1+grow],radius=6,outline=(*GOLD,al),width=2)
        d.text((xs0,ys0-22),"BELUGA CALL",font=mono(15,bold=True),fill=(*GOLD,al))
        conf="0.97" if f<540 else ("0.97" if (f//6)%2 else "0.71")
        d.text((xs1-34,ys1+4),conf,font=mono(13),fill=(*GREEN,al))
    d.text((pad,SPEC_H-pad-14),"PASSIVE ACOUSTIC",font=mono(12),fill=(150,205,235,150))
    d.text((SPEC_W-pad-92,pad-1),"COOK INLET",font=mono(12),fill=(150,205,235,150))
    img.alpha_composite(card,(SPEC_X,SPEC_Y))

# ---- captions (phrase-level, synced to VO segment windows) ----
CAPS=[(15,170,"Cook Inlet has its own belugas."),
      (174,360,"Scientists filled the inlet with microphones."),
      (361,505,"An A.I. learned to pull one call from a ship's roar."),
      (508,655,"It hears them. It can't count them."),
      (657,840,"The sound just says: they're still here.")]
def draw_caption(img,f):
    txt=None
    for a,b,t in CAPS:
        if a<=f<=b: txt=t; ap=E.out_cubic(E.seg(f,a,a+8))*(1-E.seg(f,b-8,b)); break
    if not txt: return
    fnt=mono(38,bold=True); maxw=W-2*150
    words=txt.split(); lines=[]; cur=""
    for w in words:
        if tw((cur+" "+w).strip(),fnt)<=maxw: cur=(cur+" "+w).strip()
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    lh=52; tot=lh*len(lines); y0=1180
    bw=max(tw(l,fnt) for l in lines)+48; bx0=(W-bw)//2; by0=y0-14; by1=y0+tot+6
    box=Image.new("RGBA",(W,H),(0,0,0,0)); bd=ImageDraw.Draw(box)
    a=int(150*ap)
    bd.rounded_rectangle([bx0,by0,bx0+bw,by1],radius=14,fill=(6,14,26,int(165*ap)),outline=(*GOLD,int(70*ap)),width=1)
    img.alpha_composite(box)
    d=ImageDraw.Draw(img)
    for i,l in enumerate(lines):
        lw=tw(l,fnt); d.text(((W-lw)//2,y0+i*lh),l,font=fnt,fill=(245,250,255,int(255*ap)),
                              stroke_width=3,stroke_fill=(4,10,20,int(220*ap)))

# ============================ precompute ============================
print("precompute...",file=sys.stderr)
BASE=build_base()
ADULT,_=build_beluga(1.0, body=(244,250,255), belly=(150,188,214))
CALF,_ =build_beluga(0.46, body=(120,134,150), belly=(78,92,110), rim=(150,175,196))  # gray calf
AGLOW=depthglow(ADULT); CGLOW=depthglow(CALF,(16,60,80))
MOOR,MSEN=build_mooring()
random.seed(11)
SNOWP=[(random.randint(0,W),random.randint(SURF,H),random.uniform(0.6,2.4),random.uniform(4,13),random.randint(40,120),random.uniform(0.3,1.0)) for _ in range(170)]
EMITS=[40,120,210,300,372,410,452,690,760,820]
MELON_ADULT=(70,300)  # world-ish anchor offset within adult sprite (approx, tuned)

def render_frame(f):
    scene=BASE.copy()
    # animated god-ray shimmer via mild brightness pulse on upper water
    pulse=0.5+0.18*math.sin(f/42.0)
    img=Image.fromarray(scene.astype(np.uint8)).convert("RGBA")
    d=ImageDraw.Draw(img,"RGBA")
    # marine snow (parallax by depth factor)
    for (px,py,sz,sp,br,depth) in SNOWP:
        yy=SURF+((py-SURF)+f*sp*0.18*depth)%(H-SURF)
        d.ellipse([px-sz,yy-sz,px+sz,yy+sz],fill=(200,225,235,int(br*0.45)))
    # whales: adult + gray calf, gentle bob/drift (parallax: calf slightly different phase)
    appear=E.out_cubic(E.seg(f,4,40))
    abx=int(516-ADULT.width//2+math.sin(f/120.0)*14); aby=int(640-ADULT.height//2+math.sin(f/46.0)*9)
    cbx=int(740-CALF.width//2+math.sin(f/110.0+1.1)*10); cby=int(792-CALF.height//2+math.sin(f/50.0+0.7)*7)
    capp=E.out_cubic(E.seg(f,24,70))
    def paste(spr,gl,x,y,al):
        if al<=0: return
        if al<1:
            g=np.array(gl).copy(); g[...,3]=(g[...,3]*al).astype(np.uint8); gl=Image.fromarray(g,"RGBA")
            w=np.array(spr).copy(); w[...,3]=(w[...,3]*al).astype(np.uint8); spr=Image.fromarray(w,"RGBA")
        img.alpha_composite(gl,(x,y)); img.alpha_composite(spr,(x,y))
    paste(CGLOW,CGLOW,cbx,cby,capp) if False else None
    # calf behind adult (drawn first)
    paste(CALF,CGLOW,cbx,cby,capp)
    paste(ADULT,AGLOW,abx,aby,appear)
    ox=abx+MELON_ADULT[0]; oy=aby+MELON_ADULT[1]
    # sound rings from adult melon
    for ef in EMITS:
        age=f-ef
        if 0<=age<=54:
            p=age/54.0; r=10+p*300; al=int(150*(1-p)**1.4)
            if al>4:
                col=GREEN if p<0.5 else VIOLET
                for dr,da in [(0,al),(5,al//2)]:
                    d.ellipse([ox-(r+dr),oy-(r+dr)*0.82,ox+(r+dr),oy+(r+dr)*0.82],outline=(*col,max(0,da)),width=2)
    # mooring (reveal act2)
    if f>=178:
        rev=E.out_cubic(E.seg(f,178,250)); mx=952; my=int(SURF-30-(1-rev)*60)
        mo=MOOR
        if rev<1:
            ma=np.array(mo).copy(); ma[...,3]=(ma[...,3]*rev).astype(np.uint8); mo=Image.fromarray(ma,"RGBA")
        img.alpha_composite(mo,(mx,my))
        sx,sy=mx+MSEN[0],my+MSEN[1]
        for ef in [250,320]:
            age=f-ef
            if 0<=age<46:
                p=age/46.0; r=6+p*120; al=int(110*(1-p)); d.ellipse([sx-r,sy-r*0.82,sx+r,sy+r*0.82],outline=(150,205,235,al),width=2)

    # ---- push-in (Ken Burns 4% eased) applied to SCENE only ----
    prog=E.in_out_sine(f/(NF-1))
    scale=1.0+0.045*prog
    cw,ch=int(W/scale),int(H/scale); cx0=(W-cw)//2; cy0=int((H-ch)*0.42)  # bias up toward whale
    scene_img=img.convert("RGB").crop((cx0,cy0,cx0+cw,cy0+ch)).resize((W,H),Image.LANCZOS)

    # ---- finishing ----
    out=Image.fromarray(finish(np.asarray(scene_img),seed=1000+f)).convert("RGBA")
    du=ImageDraw.Draw(out,"RGBA")

    # ---- crisp UI on top ----
    eb=E.out_cubic(E.seg(f,6,30))
    if eb>0:
        tracked(du,"ALASKA.AI",mono(16,bold=True),(255,222,120,int(220*eb)),MARGIN,60,0.14)
        wl=tw("ALASKA.AI",mono(16,bold=True),0.14)
        tracked(du,"/  FIELD SIGNAL",mono(16),(214,230,245,int(160*eb)),MARGIN+wl+14,60,0.14)
    cc=E.out_cubic(E.seg(f,40,80))
    if cc>0:
        unc=1.0 if f<512 else 0.55+0.45*math.sin(f/5.0)
        nf=fraunces(104,900,144); s_="≈ 330"; nx=W-MARGIN-tw(s_,nf); ny=150
        tracked(du,s_,nf,(255,222,120,int(235*cc*unc)),nx,ny)
        tracked(du,"BELUGAS LEFT",mono(15,med=True),(235,245,252,int(185*cc)),nx+4,ny+116,0.18)
        if f>=512: tracked(du,"?",fraunces(86,900,144),(255,140,120,int(150*(1-unc+0.4))),nx+tw(s_,nf)+10,ny+8)
    if f>=358:
        ca=E.out_cubic(E.seg(f,358,378))
        if ca>=1: draw_spec(out,f)
        else:
            tmp=Image.new("RGBA",(W,H),(0,0,0,0)); draw_spec(tmp,f); ta=np.array(tmp); ta[...,3]=(ta[...,3]*ca).astype(np.uint8); out.alpha_composite(Image.fromarray(ta,"RGBA"))
    if 664<=f<=864:
        pp=E.seg(f,664,864); px=int(-120+pp*(W+240)); py=140+int(8*math.sin(f/30.0))
        for xx in range(0,px,26): du.line([(xx,py+30),(xx+13,py+30)],fill=(255,222,120,90),width=2)
        # tiny plane
        du.polygon([(px+8,py+27),(px+78,py+20),(px+96,py+27),(px+78,py+34)],fill=(235,242,250,255))
        du.polygon([(px+40,py+24),(px+58,py+6),(px+64,py+8),(px+52,py+25)],fill=(210,220,235,255))
        tracked(du,"AERIAL SURVEY",mono(12),(255,222,120,150),px-6,py-22,0.12)
    draw_caption(out,f)
    so=E.out_cubic(E.seg(f,8,34)); endb=E.out_cubic(E.seg(f,820,880))
    if so>0:
        sf=fraunces(34,900,144); s_="alaska.ai"; wls=tw(s_,sf); a=int(150+95*endb)
        tracked(du,s_,sf,(255,255,255,int(a*so)),(W-wls)//2,1292)
    fin=E.seg(f,0,14)
    if fin<1:
        ov=Image.new("RGBA",(W,H),(0,0,0,int(255*(1-E.out_cubic(fin))))); out.alpha_composite(ov)
    return out.convert("RGB")

def main():
    a=sys.argv[1:]
    if a and a[0]=="test":
        td=os.path.join(HERE,"test_v2"); os.makedirs(td,exist_ok=True)
        for fr in [int(x) for x in a[1:]]:
            render_frame(fr).save(os.path.join(td,f"t_{fr:05d}.png")); print("test",fr,file=sys.stderr)
        return
    s,e=int(a[0]),int(a[1])
    for f in range(s,e):
        render_frame(f).save(os.path.join(FR,f"frame_{f:05d}.png"))
        if f%50==0: print("frame",f,file=sys.stderr)
    print(f"done {s}-{e}",file=sys.stderr)

if __name__=="__main__": main()
