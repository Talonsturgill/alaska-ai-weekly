"""
Alaska.Ai Dispatch v3 — 9:16 (1080x1920), 60s/1800f, NEW STANDARD.
Swimming mother + gray calf (craft swim + 180deg motion blur), depth-of-field,
aurora-rich glacial water (not flat blue), open captions, cinematic finishing.
  test:  python render_v3.py test 60 500 900 1300 1600
  range: python render_v3.py 0 1800
"""
import sys, os, math, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy.ndimage import gaussian_filter
from scipy.interpolate import PchipInterpolator
import easing as E, craft

HERE=os.path.dirname(os.path.abspath(__file__)); FR=os.path.join(HERE,"frames_v3"); os.makedirs(FR,exist_ok=True)
FONTS=os.path.join(HERE,"..","..",".claude","skills","alaska-ai-brief","fonts")
W,H=1080,1920; FPS=30; NF=1800; SURF=330; MARGIN=96
GOLD=(255,199,44); GREEN=(26,229,164); VIOLET=(123,91,255); SNOW=(244,250,255); SLATE=(120,140,165)
def fr(sz,wt=900,op=144,it=False,sf=0):
    f=ImageFont.truetype(os.path.join(FONTS,"Fraunces-Italic-Var.ttf" if it else "Fraunces-Var.ttf"),sz)
    try:f.set_variation_by_axes([op,wt,sf,0])
    except Exception:pass
    return f
def mono(sz,b=False,m=False): return ImageFont.truetype(os.path.join(FONTS,"JetBrainsMono-Bold.ttf" if b else ("JetBrainsMono-Medium.ttf" if m else "JetBrainsMono-Regular.ttf")),sz)
def tw(t,f,tr=0.0):
    ex=int(round(f.size*tr));s=0
    for c in t: b=f.getbbox(c);s+=(b[2]-b[0])+ex
    return s-ex
def tk(d,t,f,fill,x,y,tr=0.0):
    ex=int(round(f.size*tr));c=x
    for ch in t: d.text((c,y),ch,font=f,fill=fill);b=f.getbbox(ch);c+=(b[2]-b[0])+ex

TIM=json.load(open(os.path.join(HERE,"audio","timing60.json"))); BEATS=TIM["beats"]  # 9
CUES=json.load(open(os.path.join(HERE,"audio","words60.json")))["words"]  # voice-synced phrase captions
# ---------- background: aurora + glacial water (DoF-softened) ----------
def aur(seed,vc,sp,hf,inten,color,warp,h=SURF+50):
    rng=np.random.default_rng(seed); sp_=gaussian_filter(rng.standard_normal(W),hf); sp_=sp_/(np.std(sp_)+1e-6)*warp
    st=gaussian_filter(rng.standard_normal((h,W)),(2,26)); st=(st-st.min())/(st.max()-st.min()+1e-6); st=st**1.7
    ys=np.arange(h).reshape(-1,1).astype(np.float32); bell=np.exp(-((ys-(vc+sp_.reshape(1,-1)))**2)/(2*sp**2))
    return gaussian_filter(bell*st*inten,(8,12))[:,:,None]*(np.array(color,np.float32)/255.)
def build_base():
    img=np.zeros((H,W,3),np.float32)
    for y in range(SURF):
        t=(y/max(1,SURF-1))**1.3; img[y]=np.array([3,8,22])*(1-t)+np.array([12,30,54])*t
    glow=np.zeros((SURF+50,W,3),np.float32)
    glow+=aur(7,86,46,60,160,GREEN,46); glow+=aur(19,60,32,90,120,(90,200,240),55); glow+=aur(31,120,60,40,110,VIOLET,34)
    img[:SURF]=np.clip(img[:SURF]+glow[:SURF],0,255)
    # water: steely teal -> deep, with a violet/green cast (not flat blue)
    hi=np.array([30,84,92],np.float32); mid=np.array([20,54,74],np.float32); lo=np.array([10,26,44],np.float32)
    for y in range(SURF,H):
        t=(y-SURF)/(H-SURF); c=hi*(1-min(t*2,1))+mid*min(t*2,1) if t<0.5 else mid*(1-(t-.5)*2)+lo*((t-.5)*2); img[y]=c
    refl=glow[:SURF][::-1]*0.13; rh=min(refl.shape[0],H-SURF); img[SURF:SURF+rh]=np.clip(img[SURF:SURF+rh]+refl[:rh],0,255)
    rays=np.zeros((H,W),np.float32)
    for cx,wid,s_ in [(360,160,0.5),(640,220,0.62),(800,150,0.46)]:
        for y in range(SURF,H):
            t=(y-SURF)/(H-SURF);half=wid*(0.4+1.6*t);x0=max(0,int(cx-t*120-half));x1=min(W,int(cx-t*120+half));rays[y,x0:x1]+=s_*(1-t)**1.7*0.5
    img+=gaussian_filter(rays,(8,30))[:,:,None]*np.array([34,80,88],np.float32)
    # violet aurora-reflection haze deeper (color richness)
    z=np.clip((np.mgrid[0:H,0:W][0]-SURF)/(H-SURF),0,1)[:,:,None]
    img=img*(1-0.28*(1-np.exp(-1.3*z)))+np.array([38,58,74],np.float32)*(0.28*(1-np.exp(-1.3*z)))
    img=np.clip(img,0,255)
    img=craft.depth_blur(img,sigma=3.2)                          # DoF on the whole bed (lighter — keep acuity)
    return img
_Y,_X=np.mgrid[0:H,0:W].astype(np.float32); _R=np.sqrt(((_X-W/2)/(W/2))**2+((_Y-H/2)/(H/2))**2)
def finish(u8,seed):
    f=u8.astype(np.float32)/255.;a,b,c,d,e=2.51,.03,2.43,.59,.14;g=np.clip((f*(a*f+b))/(f*(c*f+d)+e),0,1)
    g=np.clip(g+(g-.5)*.05,0,1);lum=(0.2126*g[...,0]+0.7152*g[...,1]+0.0722*g[...,2])[...,None]
    sh=(1-lum)**2;hi=lum**2;g=np.clip(g+(np.array([12,30,54])/255-.5)*.08*sh+(np.array([255,205,110])/255-.5)*.06*hi,0,1)
    lb=np.clip(lum[...,0]-.72,0,1)/.28;sm=lb[::4,::4]
    glow=np.asarray(Image.fromarray((np.clip(gaussian_filter(sm,2.5)+.6*gaussian_filter(sm,6),0,1)*255).astype(np.uint8)).resize((W,H),Image.BILINEAR),np.float32)/255.
    g=1-(1-g)*(1-np.clip(glow[...,None]*np.array([1,.85,.6])*.12,0,1))
    g=g*(0.85+0.15*(1/(1+(_R*1.45)**2)**2))[...,None]
    rng=np.random.default_rng(seed);n=gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),1.1);n/=n.std()+1e-6
    g=g+(n*np.exp(-((lum[...,0]-.4)**2)/(2*.25**2))*(8/255.))[...,None]
    g=np.clip(g+(rng.random((H,W,1))+rng.random((H,W,1))-1)/255.,0,1)
    return (g*255).astype(np.uint8)
# ---------- beluga (parametric, lit) ----------
def beluga(scale=1.0,body=(244,250,255),belly=(150,188,214),rim=(220,242,252)):
    s=2;W0=int(640*scale);H0=int(360*scale);SW,SH=W0*s,H0*s;cy=int(178*scale)*s;x0=int(40*scale)*s;L=int(540*scale)*s
    tx=np.array([0,.03,.08,.14,.22,.32,.45,.58,.70,.80,.88,.94,1.]);top=np.array([26,60,86,92,88,82,75,66,56,44,32,23,19])*scale*s;bot=np.array([14,44,60,70,79,81,77,69,57,43,31,21,17])*scale*s
    xs=np.linspace(0,1,240);X=x0+xs*L;YT=cy-PchipInterpolator(tx,top)(xs);YB=cy+PchipInterpolator(tx,bot)(xs)
    pts=[(X[i],YT[i]) for i in range(len(xs))]+[(X[i],YB[i]) for i in range(len(xs)-1,-1,-1)]
    mask=Image.new("L",(SW,SH),0);md=ImageDraw.Draw(mask);md.polygon(pts,fill=255)
    md.polygon([(x0+L*.93,cy-26*s),(x0+L*1.06,cy-112*s),(x0+L*1.10,cy-92*s),(x0+L*1.005,cy-6*s),(x0+L*1.10,cy+88*s),(x0+L*1.06,cy+110*s),(x0+L*.93,cy+24*s)],fill=255)
    md.polygon([(x0+L*.205,cy+58*s),(x0+L*.20,cy+116*s),(x0+L*.25,cy+132*s),(x0+L*.295,cy+96*s),(x0+L*.28,cy+64*s)],fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(1.2));al=np.array(mask,np.float32)/255.
    yy,xx=np.mgrid[0:SH,0:SW].astype(np.float32);col=np.zeros((SH,SW,3),np.float32);col[:]=body
    g=np.clip((yy-(cy-90*s))/(190*s),0,1);col=np.clip(col+(1-g)[...,None]*np.array([10,16,22])+g[...,None]*(np.array(belly,np.float32)-np.array(body,np.float32)),0,255)
    sheen=np.exp(-((yy-(cy-58*s))/(34*s))**2)*np.clip(1-np.abs(xx-(x0+L*.42))/(L*.55),0,1);col=np.clip(col+sheen[...,None]*np.array([26,28,32]),0,255)
    spr=Image.fromarray(np.dstack([col,al*255]).astype(np.uint8),"RGBA")
    rl=Image.new("RGBA",(SW,SH),(0,0,0,0));rd=ImageDraw.Draw(rl);rd.line([(X[i],YT[i]) for i in range(len(xs))],fill=(*rim,225),width=int(3*s),joint="curve")
    rl=rl.filter(ImageFilter.GaussianBlur(1.4*s));ra=np.array(rl);ra[...,3]=(ra[...,3]*al).astype(np.uint8);spr=Image.alpha_composite(spr,Image.fromarray(ra,"RGBA"))
    dd=ImageDraw.Draw(spr);ex,ey=x0+74*s,cy-6*s;dd.ellipse([ex-6*s,ey-6*s,ex+6*s,ey+6*s],fill=(14,20,30,255))
    mxs=np.linspace(x0+6*s,x0+84*s,20);mys=cy+22*s+14*s*np.sin(np.linspace(.2,1.05,20));dd.line(list(zip(mxs,mys)),fill=(70,96,120,160),width=int(1.6*s))
    spr=spr.resize((W0,H0),Image.LANCZOS);a=np.array(spr);rgb=craft.add_texture(a[...,:3].astype(np.float32),a[...,3].astype(np.float32)/255.,7,2.0,3.0)
    return Image.fromarray(np.dstack([rgb,a[...,3]]).astype(np.uint8),"RGBA")
def glow(spr,colr=(20,80,100)):
    al=np.array(spr)[...,3].astype(np.float32);g=gaussian_filter(al,18);g=(g/g.max()*120).astype(np.uint8)
    c=np.zeros((*g.shape,4),np.uint8);c[...,0]=colr[0];c[...,1]=colr[1];c[...,2]=colr[2];c[...,3]=g;return Image.fromarray(c,"RGBA")
# ---------- captions: voice-synced kinetic phrases (from words60.json) ----------
def _wrap(words,fnt,maxw,spw):
    lines=[[]]
    for wd in words:
        cur=lines[-1]; width=sum(tw(x[0],fnt) for x in cur)+spw*len(cur)+tw(wd[0],fnt)
        if cur and width>maxw: lines.append([wd])
        else: cur.append(wd)
    return lines
def caption(out,f):
    t=f/FPS; cue=None
    for c in CUES:
        if c["s"]-0.28<=t<c["e"]+0.14: cue=c; break
    if not cue: return
    s,e=cue["s"],cue["e"]
    ap=E.out_cubic(E.seg(t,s-0.28,s+0.06))*(1.0-E.seg(t,e-0.16,e+0.14))
    if ap<=0.02: return
    prog=max(0.0,min(1.0,(t-s)/max(0.25,(e-s))))               # karaoke fill, tied to spoken time
    raw=cue["w"].split(); tot=max(1,sum(len(w)+1 for w in raw)); acc=0; words=[]
    for w in raw:
        mid=(acc+(len(w)+1)/2.0)/tot; acc+=len(w)+1; words.append((w,mid))
    fnt=fr(58,650); maxw=W-2*104; spw=int(fnt.size*0.30)
    lines=_wrap(words,fnt,maxw,spw)
    if len(lines)>3: fnt=fr(46,650); spw=int(fnt.size*0.30); lines=_wrap(words,fnt,maxw,spw)
    nl=len(lines); lh=int(fnt.size*1.18); blockh=lh*nl; y0=1500-blockh//2; d=ImageDraw.Draw(out)
    for li,ln in enumerate(lines):
        lr=E.out_cubic(max(0.0,min(1.0,(prog-li/max(1,nl))/0.16)))   # each line reveals as the VO reaches it
        la=ap*lr
        if la<=0.02: continue
        rise=int((1-lr)*12)                                          # slight settle-up on entry
        lwf=sum(tw(w,fnt) for w,_ in ln)+spw*(len(ln)-1); x=(W-lwf)//2; y=y0+li*lh+rise
        for (w,mid) in ln:
            col=(244,250,255) if mid<=prog-0.05 else (GOLD if mid<=prog+0.05 else (148,168,194))
            d.text((x,y),w,font=fnt,fill=(*col,int(255*la)),stroke_width=3,stroke_fill=(3,8,18,int(225*la)))
            x+=tw(w,fnt)+spw
    uw=W-2*150; ux=150; uy=y0+blockh+16                         # brand progress underline = spoken time
    d.line([(ux,uy),(ux+uw,uy)],fill=(70,90,116,int(110*ap)),width=2)
    d.line([(ux,uy),(ux+int(uw*prog),uy)],fill=(*GOLD,int(225*ap)),width=3)
def outro_card(out,f):
    """Branded sign-off that keeps the outro alive after speech (staged reveals = event cadence)."""
    if f<1616: return
    d=ImageDraw.Draw(out)
    a1=E.out_cubic(E.seg(f,1616,1664))                          # wordmark in
    if a1>0.02:
        wf=fr(78,800,144); s="ALASKA.AI"; w=tw(s,wf,0.05)
        tk(d,s,wf,(255,222,120,int(255*a1)),(W-w)//2,1444-int((1-a1)*16),0.05)
    a2=E.out_cubic(E.seg(f,1660,1700))                          # tagline in (finishes as the fade begins)
    if a2>0.02:
        tf=fr(40,600,144); s="what's moving in alaska ai, this week"; w=tw(s,tf,0.02)
        tk(d,s,tf,(228,240,250,int(228*a2)),(W-w)//2,1552-int((1-a2)*14),0.02)

print("precompute...",file=sys.stderr)
BASE=build_base();ADULT=beluga(1.12);CALF=beluga(0.5,(120,134,150),(78,92,110),(150,175,196))
AG=glow(ADULT);CG=glow(CALF,(16,60,80))
EMITS=list(range(120,1730,88))     # a sonar "call" pulses out every ~3s — denser cadence
# --- continuous in-scene life: marine snow + a distant pod ---
_pr=np.random.default_rng(42)
PART=[dict(x=float(_pr.random()*W),y=float(_pr.random()*H),z=float(_pr.random()),ph=float(_pr.random()*6.283)) for _ in range(130)]
_dp=beluga(0.34,(76,114,142),(50,76,100),(120,150,180))
_dpa=np.asarray(_dp).astype(np.float32);_dpa[...,:3]=craft.depth_blur(_dpa[...,:3],2.6)
DPOD=Image.fromarray(_dpa.astype(np.uint8),"RGBA")
CROSS=[(70,560,-260,W+140,470),(980,1800,W+140,-260,560)]   # 2nd crossing drifts through the entire outro
def draw_particles(img,t):
    d=ImageDraw.Draw(img,"RGBA")
    for p in PART:
        z=p["z"];sp=10+z*40;amp=6+z*16;r=1.0+z*2.4;al=int(26+z*72)
        y=(p["y"]+t*sp)%(H+40)-20; x=p["x"]+math.sin(t*0.6+p["ph"])*amp
        d.ellipse([x-r,y-r,x+r,y+r],fill=(212,234,248,al))
def draw_pod(img,f):
    for (a,b,x0,x1,y0) in CROSS:
        for k in range(3):
            pr=E.seg(f,a+k*46,b-(2-k)*46)
            if pr<=0 or pr>=1: continue
            fade=min(1.0,pr*4)*min(1.0,(1-pr)*4)*0.5
            px=int(x0+(x1-x0)*pr); py=int(y0+k*48+math.sin(f/20.0+k)*7)
            sp=craft.swim_deform(DPOD,f/FPS+k*0.7,amp=5,wavelen=168,speed=1.8)
            sa=np.asarray(sp).astype(np.float32);sa[...,3]*=fade
            img.alpha_composite(Image.fromarray(sa.astype(np.uint8),"RGBA"),(px,py))
def render_frame(f):
    t=f/FPS;img=Image.fromarray(BASE.astype(np.uint8)).convert("RGBA");d=ImageDraw.Draw(img,"RGBA")
    draw_pod(img,f)                 # distant pod swims behind the heroes
    app=E.out_cubic(E.seg(f,6,46))
    # adult: swim + motion blur; calf: gentler swim
    ab=craft.motion_blur(lambda tt: craft.swim_deform(ADULT,tt,amp=16,wavelen=470,speed=2.3),t,1/FPS,K=5)
    cb=craft.swim_deform(CALF,t*1.0,amp=9,wavelen=300,speed=2.0)
    drift=math.sin(t*0.42)*26;adx=int(W//2-ADULT.width//2+drift);ady=int(720-ADULT.height//2+math.sin(t*1.0)*9)
    cdx=int(W//2-CALF.width//2+150+math.sin(t*0.5+1)*16);cdy=int(880-CALF.height//2+math.sin(t*1.1+.7)*7)
    def put(spr,gl,x,y,a):
        if a<=0:return
        if a<1:
            ga=np.array(gl).copy();ga[...,3]=(ga[...,3]*a).astype(np.uint8);gl=Image.fromarray(ga,"RGBA")
            sa=np.array(spr).copy();sa[...,3]=(sa[...,3]*a).astype(np.uint8);spr=Image.fromarray(sa,"RGBA")
        img.alpha_composite(gl,(x,y));img.alpha_composite(spr,(x,y))
    put(cb,CG,cdx,cdy,E.out_cubic(E.seg(f,30,80)));put(ab,AG,adx,ady,app)
    ox=adx+70;oy=ady+ADULT.height//2
    for ef in EMITS:
        age=f-ef
        if 0<=age<=60:
            p=age/60;r=12+p*340;al=int(150*(1-p)**1.4)
            if al>4:
                col=GREEN if p<0.5 else VIOLET
                d.ellipse([ox-r,oy-r*.82,ox+r,oy+r*.82],outline=(*col,al),width=2)
    # mooring (seg4 ~ f497)
    if f>=500:
        rev=E.out_cubic(E.seg(f,500,580));mx=946;my=int(SURF-30-(1-rev)*60)
        d.line([(mx+86,my+8),(mx+86,my+560)],fill=(150,175,195,int(150*rev)),width=2)
        d.ellipse([mx+64,my+6,mx+108,my+50],fill=(255,199,44,int(255*rev)),outline=(255,228,150,int(255*rev)),width=2)
        d.rounded_rectangle([mx+69,my+470,mx+103,my+548],8,fill=(36,52,74,int(255*rev)),outline=(150,205,235,int(255*rev)),width=2)
        d.ellipse([mx+79,my+482,mx+93,my+496],fill=(26,229,164,int(255*rev)))
    draw_particles(img,t)          # marine snow, always drifting (in front)
    # ---- push-in + finishing ----
    prog=E.in_out_sine(f/(NF-1));sc=1.0+0.05*prog;cw,ch=int(W/sc),int(H/sc)
    cyoff=0.4+0.05*math.sin(t*0.22)                                          # slow vertical camera float
    sceneimg=img.convert("RGB").crop(((W-cw)//2,int((H-ch)*cyoff),(W-cw)//2+cw,int((H-ch)*cyoff)+ch)).resize((W,H),Image.LANCZOS)
    out=Image.fromarray(finish(np.asarray(sceneimg),2000+f))                 # graded RGB
    out=out.filter(ImageFilter.UnsharpMask(radius=2.4,percent=92,threshold=2)).convert("RGBA");du=ImageDraw.Draw(out,"RGBA")
    eb=E.out_cubic(E.seg(f,6,30))
    if eb>0:
        tk(du,"ALASKA.AI",mono(18,True),(255,222,120,int(220*eb)),MARGIN,70,0.14)
        tk(du,"/  FIELD SIGNAL",mono(18),(214,230,245,int(150*eb)),MARGIN+tw("ALASKA.AI",mono(18,True),.14)+16,70,0.14)
    cc=E.out_cubic(E.seg(f,46,90))
    if cc>0:
        unc=1.0 if f<1126 else .55+.45*math.sin(f/5.)
        nf=fr(118,900,144);s_="~330";nx=W-MARGIN-tw(s_,nf);ny=150
        tk(du,s_,nf,(255,222,120,int(235*cc*unc)),nx,ny);tk(du,"BELUGAS LEFT",mono(16,m=True),(235,245,252,int(185*cc)),nx+4,ny+128,0.18)
        if f>=1126: tk(du,"?",fr(96,900,144),(255,140,120,int(150*(1-unc+.4))),nx+tw(s_,nf)+12,ny+8)
    if f>=680: draw_spec(out,f)    # chart HUD — crisp, composited AFTER the grade (stays razor-sharp)
    caption(out,f)
    outro_card(out,f)              # branded sign-off keeps the outro alive (event cadence)
    so=E.out_cubic(E.seg(f,8,34));endb=E.out_cubic(E.seg(f,1560,1640))
    if so>0 and f<1600:           # footer hands off to the outro card
        sf=fr(38,900,144);tk(du,"alaska.ai",sf,(255,255,255,int((150+95*endb)*so)),(W-tw("alaska.ai",sf))//2,1700)
    fin=E.seg(f,0,14)
    if fin<1: out.alpha_composite(Image.new("RGBA",(W,H),(0,0,0,int(255*(1-E.out_cubic(fin))))))
    outf=E.seg(f,1700,1800)        # cinematic fade-out from ~56.7s — carries motion across the whole outro
    if outf>0: out.alpha_composite(Image.new("RGBA",(W,H),(0,0,0,int(245*E.in_out_sine(outf)))))
    return out.convert("RGB")
# spectrogram card — crisp HUD, bigger legible labels, continuous scrubbing playhead
SPW,SPH=884,182;SPX,SPY=(W-SPW)//2,1170
def whistle():
    u=np.linspace(0,1,120);x=.34+u*.32;fy=.64-.40*np.sin(u*math.pi)**.9;return x,np.clip(fy,.07,.93)
WP=whistle()
def draw_spec(img,f):
    card=Image.new("RGBA",(SPW,SPH),(0,0,0,0));d=ImageDraw.Draw(card)
    d.rounded_rectangle([0,0,SPW-1,SPH-1],16,fill=(6,16,30,236),outline=(150,205,235,120),width=2)
    a=E.out_cubic(E.seg(f,680,720))
    ship=max(E.seg(f,700,760)*.8,E.seg(f,1339,1420))
    pad=16;iy=pad+12;iw,ih=SPW-2*pad,SPH-pad-iy-22
    if ship>.01:
        rng=np.random.default_rng(7);yy,xx=np.mgrid[0:ih,0:iw].astype(np.float32);noise=np.zeros((ih,iw),np.float32);ph=f*.06
        for k in range(6): noise+=(.6/(k+1))*np.abs(np.sin(xx/(20+8*k)+ph+k))*np.exp(-((yy-ih*(.74-.07*k))/(ih*.22))**2)
        noise=gaussian_filter(noise,(3,6));noise/=noise.max()+1e-6
        lay=np.zeros((ih,iw,4),np.uint8);c=np.array(VIOLET)*.55+np.array(SLATE)*.45;lay[...,0]=c[0];lay[...,1]=c[1];lay[...,2]=c[2];lay[...,3]=(noise*168*ship).astype(np.uint8)
        card.alpha_composite(Image.fromarray(lay,"RGBA"),(pad,iy))
    di=E.seg(f,720,860)
    if di>0:
        x,fy=WP;n=max(2,int(len(x)*E.out_cubic(di)));pts=[(pad+x[i]*iw,iy+fy[i]*ih) for i in range(n)]
        if len(pts)>1:
            for wd,al,co in [(8,70,GREEN),(5,150,GREEN),(2,255,GOLD)]: d.line(pts,fill=(*co,al),width=wd,joint="curve")
    if f>=700:                                                  # continuous scrubbing playhead = motion every frame
        phase=((f-700)/(2.6*FPS))%1.0; px=pad+phase*iw
        d.line([(px,iy),(px,iy+ih)],fill=(255,228,150,120),width=2)
        x,fy=WP;xi=min(len(x)-1,int(phase*(len(x)-1)));cxp=pad+x[xi]*iw
        if abs(px-cxp)<7: d.ellipse([px-5,iy+fy[xi]*ih-5,px+5,iy+fy[xi]*ih+5],fill=(*GOLD,235))
    box=E.seg(f,940,965);hold=1.0 if 940<=f<=1460 else (1-E.seg(f,1460,1520) if f>1460 else 0)
    if box>0 and hold>0:
        x,fy=WP;xs0=pad+x.min()*iw-9;xs1=pad+x.max()*iw+9;ys0=iy+fy.min()*ih-11;ys1=iy+fy.max()*ih+11;al=int(255*hold)
        gr=(1-E.out_cubic(box))*22;d.rounded_rectangle([xs0-gr,ys0-gr,xs1+gr,ys1+gr],7,outline=(*GOLD,al),width=3)
        d.text((xs0,ys0-28),"BELUGA CALL",font=mono(20,True),fill=(*GOLD,al))
        conf="0.97" if f<1126 else ("0.97" if (f//6)%2 else "0.71")
        d.text((xs1-48,ys1+6),conf,font=mono(19,True),fill=(*GREEN,al))
    d.text((pad,SPH-24),"PASSIVE ACOUSTIC  ·  COOK INLET",font=mono(15,m=True),fill=(150,205,235,175))
    d.text((SPW-pad-178,SPH-24),"DETECTOR v2 · LIVE",font=mono(15,m=True),fill=(120,205,170,160))
    ta=np.array(card);ta[...,3]=(ta[...,3]*a).astype(np.uint8);img.alpha_composite(Image.fromarray(ta,"RGBA"),(SPX,SPY))
def main():
    a=sys.argv[1:]
    if a and a[0]=="test":
        td=os.path.join(HERE,"test_v3");os.makedirs(td,exist_ok=True)
        for f in [int(x) for x in a[1:]]: render_frame(f).save(os.path.join(td,f"t_{f:05d}.png"));print("test",f,file=sys.stderr)
        return
    s,e=int(a[0]),int(a[1])
    for f in range(s,e):
        render_frame(f).save(os.path.join(FR,f"frame_{f:05d}.png"))
        if f%50==0:print("frame",f,file=sys.stderr)
    print("done",file=sys.stderr)
if __name__=="__main__": main()
