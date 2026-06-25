"""
demo_craft.py — proves the world-class craft bar on the beluga hero:
volumetric lighting + material texture + a real SWIM cycle + 180-degree motion blur
+ depth-of-field background + cinematic finishing. Self-contained.
  test:  python demo_craft.py test 30 60 90
  range: python demo_craft.py 0 120
"""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter
from scipy.interpolate import PchipInterpolator
import craft

HERE=os.path.dirname(os.path.abspath(__file__)); FR=os.path.join(HERE,"frames_demo"); os.makedirs(FR,exist_ok=True)
FONTS=os.path.join(HERE,"..","..",".claude","skills","alaska-ai-brief","fonts")
W=H=1080; FPS=30
GOLD=(255,199,44)
def mono(s,b=False): return ImageFont.truetype(os.path.join(FONTS,"JetBrainsMono-Bold.ttf" if b else "JetBrainsMono-Regular.ttf"),s)

# ---------- background (deep teal water, god-rays) + DoF ----------
def build_bg():
    img=np.zeros((H,W,3),np.float32)
    top=np.array([22,70,82],np.float32); bot=np.array([6,22,36],np.float32)
    for y in range(H):
        t=(y/H)**1.2; img[y]=top*(1-t)+bot*t
    rays=np.zeros((H,W),np.float32)
    for cx,wid,st in [(360,150,0.6),(620,200,0.7),(820,140,0.5)]:
        for y in range(H):
            t=y/H; half=wid*(0.4+1.6*t); x0=max(0,int(cx-t*120-half)); x1=min(W,int(cx-t*120+half)); rays[y,x0:x1]+=st*(1-t)**1.7*0.5
    rays=gaussian_filter(rays,(8,30)); img+=rays[:,:,None]*np.array([34,80,82],np.float32)
    img=craft.depth_blur(np.clip(img,0,255),sigma=7.0)            # DoF: soft background
    # marine snow (sharp specks read against soft bg = depth)
    rng=np.random.default_rng(3)
    for _ in range(90):
        x=rng.integers(0,W); y=rng.integers(0,H); b=rng.integers(30,90)
        img[y,x]=np.minimum(img[y,x]+b,255)
    return np.clip(img,0,255)

# ---------- beluga (parametric), facing left ----------
def build_beluga(scale=1.0, body=(244,250,255)):
    s=2; W0=int(640*scale); H0=int(360*scale); SW,SH=W0*s,H0*s
    cy=int(178*scale)*s; x0=int(40*scale)*s; L=int(540*scale)*s
    tx=np.array([0,.03,.08,.14,.22,.32,.45,.58,.70,.80,.88,.94,1.0])
    top=np.array([26,60,86,92,88,82,75,66,56,44,32,23,19])*scale*s
    bot=np.array([14,44,60,70,79,81,77,69,57,43,31,21,17])*scale*s
    xs=np.linspace(0,1,260); X=x0+xs*L
    YT=cy-PchipInterpolator(tx,top)(xs); YB=cy+PchipInterpolator(tx,bot)(xs)
    pts=[(X[i],YT[i]) for i in range(len(xs))]+[(X[i],YB[i]) for i in range(len(xs)-1,-1,-1)]
    mask=Image.new("L",(SW,SH),0); md=ImageDraw.Draw(mask); md.polygon(pts,fill=255)
    pedx=x0+L*0.93; tipx=x0+L*1.06
    md.polygon([(pedx,cy-26*s),(tipx,cy-112*s),(x0+L*1.10,cy-92*s),(x0+L*1.005,cy-6*s),
                (x0+L*1.10,cy+88*s),(tipx,cy+110*s),(pedx,cy+24*s)],fill=255)
    md.polygon([(x0+L*0.205,cy+58*s),(x0+L*0.20,cy+116*s),(x0+L*0.25,cy+132*s),
                (x0+L*0.295,cy+96*s),(x0+L*0.28,cy+64*s)],fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(1.2)); alpha=np.array(mask,np.float32)/255.0
    yy,xx=np.mgrid[0:SH,0:SW].astype(np.float32)
    col=np.zeros((SH,SW,3),np.float32); col[:]=body
    g=np.clip((yy-(cy-90*s))/(190*s),0,1)                         # lit top -> glacier belly
    col=np.clip(col+(1-g)[...,None]*np.array([10,16,22],np.float32)
                +g[...,None]*(np.array([150,188,214],np.float32)-np.array(body,np.float32)),0,255)
    sheen=np.exp(-((yy-(cy-58*s))/(34*s))**2)*np.clip(1-np.abs(xx-(x0+L*0.42))/(L*0.55),0,1)
    col=np.clip(col+sheen[...,None]*np.array([26,28,32],np.float32),0,255)         # back sheen
    spr=Image.fromarray(np.dstack([col,alpha*255]).astype(np.uint8),"RGBA")
    rim=Image.new("RGBA",(SW,SH),(0,0,0,0)); rd=ImageDraw.Draw(rim)               # rim light
    rd.line([(X[i],YT[i]) for i in range(len(xs))],fill=(220,242,252,225),width=int(3*s),joint="curve")
    rim=rim.filter(ImageFilter.GaussianBlur(1.4*s)); ra=np.array(rim); ra[...,3]=(ra[...,3]*alpha).astype(np.uint8)
    spr=Image.alpha_composite(spr,Image.fromarray(ra,"RGBA"))
    dd=ImageDraw.Draw(spr)
    ex,ey=x0+74*s,cy-6*s; dd.ellipse([ex-6*s,ey-6*s,ex+6*s,ey+6*s],fill=(14,20,30,255))
    dd.ellipse([ex-2*s,ey-3*s,ex+1*s,ey],fill=(185,212,232,210))
    mxs=np.linspace(x0+6*s,x0+84*s,24); mys=cy+22*s+14*s*np.sin(np.linspace(0.2,1.05,24))
    dd.line(list(zip(mxs,mys)),fill=(70,96,120,160),width=int(1.6*s))
    spr=spr.resize((W0,H0),Image.LANCZOS)
    a=np.array(spr); rgb=a[...,:3].astype(np.float32); al=a[...,3].astype(np.float32)/255.0
    rgb=craft.add_texture(rgb,al,seed=7,strength=2.0,scale=3.0)   # very subtle skin texture
    return Image.fromarray(np.dstack([rgb,al*255]).astype(np.uint8),"RGBA")

# ---------- compact cinematic finishing ----------
_YY,_XX=np.mgrid[0:H,0:W].astype(np.float32); _R=np.sqrt(((_XX-W/2)/(W/2))**2+((_YY-H/2)/(H/2))**2)
def finish(u8,seed):
    f=u8.astype(np.float32)/255.0
    a,b,c,d,e=2.51,0.03,2.43,0.59,0.14; g=np.clip((f*(a*f+b))/(f*(c*f+d)+e),0,1)  # ACES
    g=np.clip(g+(g-0.5)*0.05,0,1)
    lum=(0.2126*g[...,0]+0.7152*g[...,1]+0.0722*g[...,2])[...,None]
    lb=np.clip(lum[...,0]-0.72,0,1)/0.28; small=lb[::4,::4]
    glow=np.asarray(Image.fromarray((np.clip(gaussian_filter(small,2.5)+0.6*gaussian_filter(small,6),0,1)*255).astype(np.uint8)).resize((W,H),Image.BILINEAR),np.float32)/255.0
    g=1-(1-g)*(1-np.clip(glow[...,None]*np.array([1,.85,.6],np.float32)*0.16,0,1))
    g=g*(0.86+0.14*(1/(1+(_R*1.4)**2)**2))[...,None]              # vignette
    rng=np.random.default_rng(seed); n=gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),1.1); n/=n.std()+1e-6
    amp=np.exp(-((lum[...,0]-0.4)**2)/(2*0.25**2)); g=g+(n*amp*(8/255.0))[...,None]
    g=np.clip(g+(rng.random((H,W,1))+rng.random((H,W,1))-1)/255.0,0,1)
    return (g*255).astype(np.uint8)

print("precompute...",file=sys.stderr)
BG=build_bg(); HERO=build_beluga(1.18)
def hero_glow(spr):
    al=np.array(spr)[...,3].astype(np.float32); gl=gaussian_filter(al,18); gl=(gl/gl.max()*120).astype(np.uint8)
    c=np.zeros((*gl.shape,4),np.uint8); c[...,0]=20;c[...,1]=80;c[...,2]=100;c[...,3]=gl; return Image.fromarray(c,"RGBA")
HGLOW=hero_glow(HERO)

def render_frame(f):
    t=f/FPS
    img=Image.fromarray(BG.astype(np.uint8)).convert("RGBA")
    # hero: swim + 180deg motion blur, gentle glide + breathing
    blurred=craft.motion_blur(lambda tt: craft.swim_deform(HERO,tt,amp=17,wavelen=470,speed=2.4), t, 1/FPS, K=6)
    drift=int(math.sin(t*0.5)*22); bob=int(math.sin(t*1.1)*8)
    hx=W//2-HERO.width//2+drift; hy=H//2-HERO.height//2+bob-30
    img.alpha_composite(HGLOW,(hx,hy)); img.alpha_composite(blurred,(hx,hy))
    out=Image.fromarray(finish(np.asarray(img.convert("RGB")),seed=2000+f)).convert("RGBA")
    d=ImageDraw.Draw(out,"RGBA")
    d.text((46,40),"ALASKA.AI",font=mono(16,True),fill=(255,222,120,220))
    d.text((150,40)," /  CRAFT TEST — swim · light · texture · motion-blur · DoF",font=mono(14),fill=(214,230,245,150))
    sf=mono(22,True); d.text((W//2-46,H-60),"alaska.ai",font=sf,fill=(255,255,255,200))
    return out.convert("RGB")

def main():
    a=sys.argv[1:]
    if a and a[0]=="test":
        td=os.path.join(HERE,"test_demo"); os.makedirs(td,exist_ok=True)
        for fr in [int(x) for x in a[1:]]: render_frame(fr).save(os.path.join(td,f"t_{fr:05d}.png")); print("test",fr,file=sys.stderr)
        return
    s,e=int(a[0]),int(a[1])
    for f in range(s,e):
        render_frame(f).save(os.path.join(FR,f"frame_{f:05d}.png"))
        if f%20==0: print("frame",f,file=sys.stderr)
    print("done",file=sys.stderr)

if __name__=="__main__": main()
