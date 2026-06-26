"""
Alaska.Ai Dispatch v3 — 9:16 (1080x1920), 60s/1800f.
STORY: a physics-informed AI "digital twin" watches permafrost thaw under a road in
Utqiagvik, Alaska, and forecasts where the frozen ground is going.
ARCHETYPE: vertical CROSS-SECTION of the earth (tundra -> road embankment -> active layer ->
permafrost -> ice wedges), a fiber-optic cable threading the embankment, a glowing gold digital-
twin lattice, and a hot coral thaw-front isotherm that descends through the layers over time.
PALETTE: thermal duotone — frozen ice-indigo base, warm ochre active layer, coral thaw front, gold AI.
  test:  python render_v3.py test 60 300 620 800 1000 1400 1700
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
W,H=1080,1920; FPS=30; NF=1800; MARGIN=96
# thermal-duotone palette (deliberately NOT default blue; warm active layer dominates the cold base)
GOLD=(255,199,44); CORAL=(255,106,61); AMBER=(196,132,58); RUST=(150,74,40)
ICE=(150,196,224); FROZEN_HI=(36,78,108); FROZEN_LO=(12,30,50); SNOW=(244,250,255); SLATE=(150,168,190)
ASPH=(58,62,70)
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

TIM=json.load(open(os.path.join(HERE,"audio","timing60.json"))); BEATS=TIM["beats"]; SPEECH_END=TIM.get("speech_end",50.0)
CUES=json.load(open(os.path.join(HERE,"audio","words60.json")))["words"]
OUTRO_F=int((SPEECH_END+0.5)*FPS)          # branded outro begins just after the voice ends
# ---- text manifest for the READABILITY gate (brightness + contrast of every readable word) ----
LOGTEXT=os.environ.get("DISPATCH_TEXTLOG")=="1"; TEXTLOG=[]; BGLUMA=None
def _lum(a): return 0.2126*a[...,0]+0.7152*a[...,1]+0.0722*a[...,2]
def _logw(x,y,w_px,h_px,col,alpha,target,kind):
    if not LOGTEXT or BGLUMA is None: return
    x0=max(0,int(x));y0=max(0,int(y));x1=min(W,int(x+w_px));y1=min(H,int(y+h_px))
    if x1<=x0 or y1<=y0: return
    bg=float(BGLUMA[y0:y1,x0:x1].mean()); fl=float(0.2126*col[0]+0.7152*col[1]+0.0722*col[2])
    TEXTLOG.append({"kind":kind,"alpha":round(float(alpha),3),"fill_luma":round(fl,1),
                    "bg_luma":round(bg,1),"vis":round(fl/255.0*float(alpha),3),"target":bool(target)})

# ---------- geometry of the cross-section ----------
HORIZON=300            # sky band above
SURF=470              # ground surface line (road sits here)
ACTIVE0=470; ACTIVE1=660   # active layer (thaws): warm ochre band
# permafrost runs ACTIVE1 .. H
EMB_CX=540; EMB_TOP_W=520; EMB_BOT_W=760; EMB_H=120   # road embankment trapezoid above SURF
ICE_WEDGES=[(250,0.9),(470,1.1),(720,0.85),(910,1.0)]  # x, scale — vertical ice wedges in permafrost

def build_base():
    """Static cross-section: cold sky, road embankment, active layer, permafrost with ice wedges + texture + lighting."""
    img=np.zeros((H,W,3),np.float32)
    # sky / cold tundra air
    for y in range(HORIZON):
        t=(y/max(1,HORIZON-1))
        img[y]=np.array([26,34,44])*(1-t)+np.array([78,96,112])*t
    # thin tundra ground strip between horizon and surface (snowy ochre)
    for y in range(HORIZON,SURF):
        t=(y-HORIZON)/max(1,SURF-HORIZON)
        img[y]=np.array([120,120,118])*(1-t)+np.array([150,120,80])*t
    # active layer — warm ochre/amber (the part that thaws)
    for y in range(ACTIVE0,ACTIVE1):
        t=(y-ACTIVE0)/max(1,ACTIVE1-ACTIVE0)
        img[y]=np.array([176,120,58])*(1-t)+np.array([120,74,40])*t
    # permafrost — frozen ice-indigo, darkening with depth
    for y in range(ACTIVE1,H):
        t=(y-ACTIVE1)/max(1,H-ACTIVE1)
        img[y]=np.array(FROZEN_HI,np.float32)*(1-t)+np.array(FROZEN_LO,np.float32)*t
    # ice wedges: lighter wedge-shaped intrusions in the permafrost
    wedge=np.zeros((H,W),np.float32)
    for (wx,sc) in ICE_WEDGES:
        for y in range(ACTIVE1,H):
            t=(y-ACTIVE1)/(H-ACTIVE1); half=(46*sc)*(1.0-0.7*t)  # widest near the top, taper down
            x0=int(wx-half); x1=int(wx+half)
            if x1>x0: wedge[y,max(0,x0):min(W,x1)]+= (1-t)*0.7
    img+=gaussian_filter(wedge,(3,2))[:,:,None]*np.array([20,40,54],np.float32)
    # ground texture (tactile soil + ice grit) only below the surface — two scales for material feel
    rng=np.random.default_rng(11)
    tex=gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),1.4); tex/=tex.std()+1e-6
    fine=gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),0.6); fine/=fine.std()+1e-6
    mask=np.zeros((H,W),np.float32); mask[SURF:]=1.0; mask=gaussian_filter(mask,6)
    img+=((tex*11.0+fine*5.0)*mask)[:,:,None]
    # geological STRATA: faint horizontal sediment/ice bands give the ground real depth (not a flat fill)
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    strata=np.zeros((H,W),np.float32)
    for sy,amp,wob in [(560,1.0,0.5),(640,0.8,0.7),(760,1.0,0.4),(900,0.9,0.6),(1080,0.8,0.5),(1320,0.7,0.45),(1600,0.7,0.4)]:
        band=sy+18*np.sin(xx/220.0+wob*6)+9*np.sin(xx/70.0+wob)
        strata+=amp*np.exp(-((yy-band)/9.0)**2)
    strata=gaussian_filter(strata,(1.2,2.0))
    img[SURF:]+=(strata[SURF:,:,None]*np.array([22,16,8],np.float32))      # darker seams
    img[SURF:]-=(strata[SURF:,:,None]*np.array([0,0,0],np.float32))
    # depth-aware lighting: soft key from upper-left, gentle ambient occlusion deepening with depth
    key=np.clip(1.0-((xx-330)**2/(900**2)+(yy-SURF)**2/(560**2)),0,1)*0.18
    img[SURF:]+=(key[SURF:,:,None]*np.array([66,44,18],np.float32))
    ao=np.clip((yy-SURF)/(H-SURF),0,1)[:,:,None]                            # darken with depth (AO)
    img[SURF:]=img[SURF:]*(1-0.18*ao[SURF:])
    # ice-wedge bright cores (rim-lit ice) for material contrast
    wcore=np.zeros((H,W),np.float32)
    for (wx,sc) in ICE_WEDGES:
        for y in range(ACTIVE1,H):
            t=(y-ACTIVE1)/(H-ACTIVE1); half=(46*sc)*(1.0-0.7*t)
            cx0=int(wx-half*0.35); cx1=int(wx+half*0.35)
            if cx1>cx0: wcore[y,max(0,cx0):min(W,cx1)]+=(1-t)*0.5
    img+=gaussian_filter(wcore,(3,2))[:,:,None]*np.array([26,44,56],np.float32)
    # road embankment trapezoid (asphalt) sitting on the surface
    emb=Image.new("L",(W,H),0); ed=ImageDraw.Draw(emb)
    ed.polygon([(EMB_CX-EMB_TOP_W//2,SURF-EMB_H),(EMB_CX+EMB_TOP_W//2,SURF-EMB_H),
                (EMB_CX+EMB_BOT_W//2,SURF),(EMB_CX-EMB_BOT_W//2,SURF)],fill=255)
    em=np.array(emb,np.float32)/255.
    road=np.zeros((H,W,3),np.float32); road[:]=np.array(ASPH,np.float32)
    # asphalt vertical shade + a lit crown
    road+= (0.5-np.abs((xx-EMB_CX)/(EMB_BOT_W/2)))[:,:,None]*np.array([26,26,28],np.float32)
    img=img*(1-em[:,:,None])+road*em[:,:,None]
    # rim/key light on the embankment: bright lit crown on the top edge, soft shade down the right face
    edge=np.zeros((H,W),np.float32)
    ed.line([(EMB_CX-EMB_TOP_W//2,SURF-EMB_H),(EMB_CX+EMB_TOP_W//2,SURF-EMB_H)],fill=0)  # noop keep ed alive
    top_y=SURF-EMB_H
    rim=np.exp(-((yy-top_y)/4.0)**2)*(np.abs(xx-EMB_CX)<EMB_TOP_W//2)
    img+=gaussian_filter(rim,(1.0,1.0))[:,:,None]*np.array([70,74,82],np.float32)
    # contact shadow / ambient occlusion where the slab sits on the ground (just below SURF)
    cshad=np.exp(-((yy-(SURF+10))/22.0)**2)*(np.abs(xx-EMB_CX)<EMB_BOT_W//2)*np.clip(1-np.abs(xx-EMB_CX)/(EMB_BOT_W*0.6),0,1)
    img-=gaussian_filter(cshad,(4,8))[:,:,None]*np.array([40,30,18],np.float32)
    img=np.clip(img,0,255)
    img=craft.depth_blur(img,sigma=2.0)        # gentle DoF on the static bed; overlays stay crisp
    return img.astype(np.float32)

_Y,_X=np.mgrid[0:H,0:W].astype(np.float32); _R=np.sqrt(((_X-W/2)/(W/2))**2+((_Y-H/2)/(H/2))**2)
def finish(u8,seed):
    """linear-light ACES + warm/cool thermal split-tone + bloom + cos^4 vignette + luma grain + dither."""
    f=u8.astype(np.float32)/255.;a,b,c,d,e=2.51,.03,2.43,.59,.14;g=np.clip((f*(a*f+b))/(f*(c*f+d)+e),0,1)
    g=np.clip(g+(g-.5)*.06,0,1);lum=(0.2126*g[...,0]+0.7152*g[...,1]+0.0722*g[...,2])[...,None]
    sh=(1-lum)**2;hi=lum**2
    # shadows toward frozen blue, highlights toward warm amber (the thermal world)
    g=np.clip(g+(np.array([18,40,64])/255-.5)*.085*sh+(np.array([255,196,120])/255-.5)*.07*hi,0,1)
    lb=np.clip(lum[...,0]-.70,0,1)/.30;sm=lb[::4,::4]
    glow=np.asarray(Image.fromarray((np.clip(gaussian_filter(sm,2.5)+.6*gaussian_filter(sm,6),0,1)*255).astype(np.uint8)).resize((W,H),Image.BILINEAR),np.float32)/255.
    g=1-(1-g)*(1-np.clip(glow[...,None]*np.array([1,.82,.5])*.13,0,1))
    g=g*(0.86+0.14*(1/(1+(_R*1.4)**2)**2))[...,None]
    rng=np.random.default_rng(seed);n=gaussian_filter(rng.standard_normal((H,W)).astype(np.float32),1.05);n/=n.std()+1e-6
    g=g+(n*np.exp(-((lum[...,0]-.4)**2)/(2*.25**2))*(4.6/255.))[...,None]
    g=np.clip(g+(rng.random((H,W,1))+rng.random((H,W,1))-1)/255.,0,1)
    return (g*255).astype(np.uint8)

# ---------- the thaw-front isotherm (the descending prediction) ----------
def thaw_front_y(f):
    """The coral isotherm that the twin pushes downward over time (eased). Returns y in px.
    Starts clearly inside the blue permafrost (below the amber active layer) so it reads, and descends."""
    p=E.in_out_cubic(E.seg(f,BEATS[5]-40,1500))      # begins at beat6, descends through to the end
    return ACTIVE1+26 + p*250

def draw_thaw_front(d,f,alpha,xa,xb,predicted=False):
    y0=thaw_front_y(f); pts=[]
    for i in range(0,61):
        x=xa+(xb-xa)*i/60.0
        wob=8*math.sin(x/120.0 + f/22.0) + 5*math.sin(x/47.0 - f/30.0)
        pts.append((x,y0+wob))
    col=CORAL
    for wd,al in [(15,int(70*alpha)),(8,int(170*alpha)),(3,int(255*alpha))]:
        d.line(pts,fill=(*col,al),width=wd,joint="curve")
    # a small "THAW FRONT" tag rides the left end so the viewer knows what the coral line is
    if alpha>0.6:
        tf=mono(15,b=True); d.text((xa+6,y0-26),"THAW FRONT",font=tf,fill=(*CORAL,int(220*alpha)))
    if predicted:                                    # dotted forecast extension below the proven line
        for i in range(0,61,3):
            x=xa+(xb-xa)*i/60.0; yy=y0+38+10*math.sin(x/90.0+f/18.0)
            d.ellipse([x-2,yy-2,x+2,yy+2],fill=(*GOLD,int(190*alpha)))

print("precompute base...",file=sys.stderr)
BASE=build_base()
# fiber-optic cable path along the embankment base (gentle catenary across the section)
CABLE=[(70+ i*(W-140)/60.0, SURF+22 + 26*math.sin(i/60.0*math.pi)) for i in range(61)]
def cable_xy(s):  # s in 0..1 along the cable
    i=s*60.0; i0=int(i); i1=min(60,i0+1); t=i-i0
    x=CABLE[i0][0]*(1-t)+CABLE[i1][0]*t; y=CABLE[i0][1]*(1-t)+CABLE[i1][1]*t; return x,y
# --- continuous motion for the EVENT_CADENCE gate ---
# (1) a thermal/seismic PULSE spreads outward through the ground from a sensor on the cable every ~2s,
#     across the WHOLE timeline (large-area change = a reliable on-screen event every < 5s).
PULSE=list(range(300,1705,62))
# (2) drifting frost/ice motes give ambient living motion everywhere.
_pr=np.random.default_rng(42)
MOTES=[dict(x=float(_pr.random()*W),y=float(_pr.random()*H),z=float(_pr.random()),ph=float(_pr.random()*6.283)) for _ in range(95)]
def draw_motes(img,t):
    d=ImageDraw.Draw(img,"RGBA")
    for p in MOTES:
        z=p["z"]
        y=(p["y"]+t*(8+z*30))%(H+40)-20; x=p["x"]+math.sin(t*0.5+p["ph"])*(5+z*14)
        if y<SURF:                                    # airborne frost above ground: bright, drifting
            r=1.0+z*2.0; d.ellipse([x-r,y-r,x+r,y+r],fill=(210,226,240,int(20+z*52)))
        else:                                         # suspended sediment/ice IN the ground: dim, earthen, tiny
            r=0.8+z*1.3; col=(150,120,78) if (p["ph"]>3.14) else (130,168,196)
            d.ellipse([x-r,y-r,x+r,y+r],fill=(*col,int(10+z*22)))
def draw_pulses(d,f):
    ox,oy=cable_xy(0.5)
    for pf in PULSE:
        age=f-pf
        if 0<=age<=52:
            p=age/52.0; rr=14+p*300; al=int(140*(1-p)**1.5)
            if al>4:
                col=CORAL if p>0.5 else ICE
                d.ellipse([ox-rr,oy-rr*0.7,ox+rr,oy+rr*0.7],outline=(*col,al),width=2)

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
        if c["s"]-0.28<=t<c["e"]+0.18: cue=c; break
    if not cue: return
    s,e=cue["s"],cue["e"]
    ap=E.out_cubic(E.seg(t,s-0.28,s+0.06))*(1.0-E.seg(t,e-0.16,e+0.18))
    if ap<=0.02: return
    prog=max(0.0,min(1.0,(t-s)/max(0.25,(e-s))))
    raw=cue["w"].split(); tot=max(1,sum(len(w)+1 for w in raw)); acc=0; words=[]
    for w in raw:
        mid=(acc+(len(w)+1)/2.0)/tot; acc+=len(w)+1; words.append((w,mid))
    fnt=fr(56,650); maxw=W-2*104; spw=int(fnt.size*0.30)
    lines=_wrap(words,fnt,maxw,spw)
    if len(lines)>3: fnt=fr(45,650); spw=int(fnt.size*0.30); lines=_wrap(words,fnt,maxw,spw)
    nl=len(lines); lh=int(fnt.size*1.18); blockh=lh*nl; y0=1496-blockh//2; d=ImageDraw.Draw(out)
    for li,ln in enumerate(lines):
        lr=E.out_cubic(max(0.0,min(1.0,(prog-li/max(1,nl))/0.16)))
        la=ap*lr
        if la<=0.02: continue
        rise=int((1-lr)*12)
        lwf=sum(tw(w,fnt) for w,_ in ln)+spw*(len(ln)-1); x=(W-lwf)//2; y=y0+li*lh+rise
        for (w,mid) in ln:
            col=SNOW if mid<=prog-0.05 else (GOLD if mid<=prog+0.05 else (150,170,196))
            d.text((x,y),w,font=fnt,fill=(*col,int(255*la)),stroke_width=3,stroke_fill=(4,10,18,int(232*la)))
            _logw(x,y,tw(w,fnt),fnt.size,col,la,(mid<=prog+0.05) and (la>=0.6),"caption")
            x+=tw(w,fnt)+spw
    uw=W-2*150; ux=150; uy=y0+blockh+16
    d.line([(ux,uy),(ux+uw,uy)],fill=(70,90,116,int(110*ap)),width=2)
    d.line([(ux,uy),(ux+int(uw*prog),uy)],fill=(*GOLD,int(225*ap)),width=3)

def outro_card(out,f):
    if f<OUTRO_F: return
    d=ImageDraw.Draw(out,"RGBA")
    # dark plate so the outro reads on any background (readability)
    pa=E.out_cubic(E.seg(f,OUTRO_F,OUTRO_F+40))
    if pa>0.02:
        d.rounded_rectangle([90,1380,W-90,1640],26,fill=(6,14,26,int(150*pa)),outline=(*GOLD,int(70*pa)),width=2)
    a1=E.out_cubic(E.seg(f,OUTRO_F+8,OUTRO_F+56))
    if a1>0.02:
        wf=fr(80,800,144); s="ALASKA.AI"; w=tw(s,wf,0.05)
        tk(d,s,wf,(255,222,120,int(255*a1)),(W-w)//2,1430-int((1-a1)*16),0.05)
        _logw((W-w)//2,1430,w,wf.size,(255,222,120),a1,a1>=0.6,"outro")
    a2=E.out_cubic(E.seg(f,OUTRO_F+52,OUTRO_F+92))
    if a2>0.02:
        tf=fr(38,600,144); s="what's moving in alaska ai, this week"; w=tw(s,tf,0.02)
        tk(d,s,tf,(228,240,250,int(232*a2)),(W-w)//2,1536-int((1-a2)*14),0.02)
        _logw((W-w)//2,1536,w,tf.size,(228,240,250),a2,a2>=0.6,"outro")
    a3=E.out_cubic(E.seg(f,OUTRO_F+84,OUTRO_F+120))
    if a3>0.02:
        cf=mono(17,m=True); s="SOURCE: PENN STATE + UAF  ·  JGR EARTH SURFACE"; w=tw(s,cf,0.06)
        tk(d,s,cf,(176,198,220,int(210*a3)),(W-w)//2,1590,0.06)
        _logw((W-w)//2,1590,w,cf.size,(176,198,220),a3,a3>=0.6,"outro")

# ---------- thermal HUD card (temperature-vs-depth profile, FORECAST vs FIELD) ----------
SPW,SPH=884,182;SPX,SPY=(W-SPW)//2,1172
def _profile(shift):
    """temperature-vs-depth curve: warm near surface, crossing 0C into frozen depth. shift moves the 0C crossing."""
    u=np.linspace(0,1,80)            # u = depth (0 surface -> 1 deep)
    temp=0.62-1.5*u + 0.06*np.sin(u*7) + shift   # normalized; >0 = above freezing (thawed)
    return u,np.clip(temp,-0.8,0.8)
def draw_hud(img,f):
    a=E.out_cubic(E.seg(f,BEATS[3],BEATS[3]+40))     # appears at beat4 (data->HUD)
    if a<=0.01: return
    card=Image.new("RGBA",(SPW,SPH),(0,0,0,0));d=ImageDraw.Draw(card)
    d.rounded_rectangle([0,0,SPW-1,SPH-1],16,fill=(6,16,30,236),outline=(150,196,224,120),width=2)
    pad=16;iy=pad+14;iw,ih=SPW-2*pad,SPH-pad-iy-22
    # zero-degree axis
    zx0=pad; zx1=pad+iw; zy=iy+ih*0.5
    d.line([(zx0,zy),(zx1,zy)],fill=(150,196,224,90),width=1)
    d.text((zx0+2,zy-18),"0°",font=mono(14,m=True),fill=(176,210,236,150))
    # FIELD curve (measured, snow/ice colored) and FORECAST curve (gold, shifted warmer = thaw advancing)
    fieldshift=0.0; fore=E.seg(f,BEATS[4],1480)*0.26   # forecast pushes the warm zone deeper over time
    for (sh,al,co,wd,nm,lab) in [(fieldshift,210,ICE,2,"field","FIELD"),(fore,235,GOLD,3,"fore","FORECAST")]:
        u,tp=_profile(sh); pts=[(pad+ (0.5+tp[i]*0.5)*iw*0.0 + (i/79.0)*iw, iy+u[i]*ih) for i in range(len(u))]
        # map: x = depth axis across, y position from depth; encode temperature as horizontal wobble
        pts=[(pad + (i/79.0)*iw, iy + (0.12+0.76*(i/79.0))*ih - tp[i]*22) for i in range(len(u))]
        n=max(2,int(len(pts)*E.out_cubic(E.seg(f,BEATS[3]+ (0 if nm=="field" else 30), BEATS[3]+90))))
        if nm=="fore" and n>2:                          # forecast uncertainty FAN widens with depth (de-claims)
            band=[(pts[i][0],pts[i][1]-(2+i*0.20)) for i in range(n)]+[(pts[i][0],pts[i][1]+(2+i*0.20)) for i in range(n-1,-1,-1)]
            d.polygon(band,fill=(*GOLD,int(34*a)))
        if n>1: d.line(pts[:n],fill=(*co,al),width=wd,joint="curve")
    # scrubbing playhead (continuous motion every frame -> event cadence)
    phase=((f-BEATS[3])/(2.4*FPS))%1.0; px=pad+phase*iw
    d.line([(px,iy),(px,iy+ih)],fill=(255,228,150,120),width=2)
    # labels
    d.text((pad,SPH-24),"DIGITAL TWIN · PERMAFROST",font=mono(15,m=True),fill=(150,196,224,180))
    d.text((SPW-pad-250,SPH-24),"THERMAL + SEISMIC · FIBER",font=mono(15,m=True),fill=(150,205,170,160))
    # legend chips
    d.text((pad+150,pad-2),"FIELD",font=mono(14,b=True),fill=(*ICE,int(a*235)))
    d.text((pad+250,pad-2),"FORECAST",font=mono(14,b=True),fill=(*GOLD,int(a*235)))
    d.text((SPW-pad-180,pad-2),"SEP 2021 → JUN 2024",font=mono(14,m=True),fill=(214,230,245,int(a*180)))
    ta=np.array(card);ta[...,3]=(ta[...,3]*a).astype(np.uint8);img.alpha_composite(Image.fromarray(ta,"RGBA"),(SPX,SPY))
    # log a couple of HUD words for readability (on the dark card)
    _logw(SPX+pad+150,SPY+pad-2,tw("FIELD",mono(14,b=True)),14,ICE,a,a>=0.6,"hud")
    _logw(SPX+pad+250,SPY+pad-2,tw("FORECAST",mono(14,b=True)),14,GOLD,a,a>=0.6,"hud")

# ---------- the digital-twin lattice (gold wireframe replica that builds over the ground) ----------
def draw_twin(d,f):
    a=E.out_cubic(E.seg(f,BEATS[4],BEATS[4]+60))     # builds at beat5
    if a<=0.01: return
    gx0,gx1=120,W-120; gy0,gy1=ACTIVE1-6,ACTIVE1+250
    cols=9; rows=5
    build=E.out_cubic(E.seg(f,BEATS[4],BEATS[4]+110))
    nshow=int(build*cols)+1
    ym=(gy0+gy1)/2
    for ci in range(min(cols+1,nshow+1)):
        x=gx0+(gx1-gx0)*ci/cols; wob=6*math.sin(f/26.0+ci)
        d.line([(x+wob,gy0),(x+wob*1.3,ym)],fill=(*GOLD,int(54*a)),width=1)      # confident near the surface
        d.line([(x+wob*1.3,ym),(x+wob*1.6,gy1)],fill=(*GOLD,int(20*a)),width=1)  # sparse + dim in the deep
    for ri in range(rows+1):
        y=gy0+(gy1-gy0)*ri/rows; fade=1.0-0.62*(ri/rows)                         # confidence falls with depth
        pts=[(gx0+(gx1-gx0)*i/40.0, y+5*math.sin(i/40.0*math.pi*2+f/24.0+ri)) for i in range(41)]
        nn=max(2,int(len(pts)*build))
        d.line(pts[:nn],fill=(*GOLD,int(62*a*fade)),width=1)
    # a "DIGITAL TWIN" tag + scanning highlight line sweeping down the lattice (continuous motion)
    if a>0.6:
        d.text((gx0+4,gy0-24),"DIGITAL TWIN",font=mono(15,b=True),fill=(*GOLD,int(200*a)))
    sy=gy0+((f%90)/90.0)*(gy1-gy0)
    d.line([(gx0,sy),(gx1,sy)],fill=(*GOLD,int(115*a)),width=2)

def render_frame(f):
    t=f/FPS
    img=Image.fromarray(BASE.astype(np.uint8)).convert("RGBA"); d=ImageDraw.Draw(img,"RGBA")
    # --- x-ray scan reveal (opening): a bright line sweeps DOWN through the ground, revealing the
    #     cross-section, and giving continuous motion through the first beats ---
    xr=E.seg(f,12,210)
    if 0<xr<1:
        sy=int(SURF + xr*(H-SURF)); gl=int(150*(1-abs(0.5-xr)*1.1))
        if gl>6:
            d.line([(0,sy),(W,sy)],fill=(150,205,235,min(220,gl+70)),width=3)
            d.rectangle([0,sy,W,min(H,sy+60)],fill=(150,205,235,int(gl*0.18)))
    # --- road crack (the hook): a fissure on the embankment that opens early and widens slightly ---
    ck=E.out_cubic(E.seg(f,8,70))
    if ck>0:
        cx=EMB_CX+58; gap=2+4*ck+1.4*math.sin(f/40.0)
        seg=[(cx,SURF-EMB_H+8)]
        for k in range(1,7):
            seg.append((cx+ (gap*0.7)*math.sin(k*1.7)+ (k%2)*gap, SURF-EMB_H+8+k*(EMB_H+10)/6))
        d.line(seg,fill=(8,10,14,int(230*ck)),width=int(2+2*ck),joint="curve")
    # --- fiber-optic cables threading the embankment (appear beat3) + traveling sensor pulses ---
    ca=E.out_cubic(E.seg(f,BEATS[2],BEATS[2]+50))
    if ca>0:
        for off in (-7,7):
            pts=[(x,y+off) for (x,y) in CABLE]
            d.line(pts,fill=(150,205,235,int(150*ca)),width=2,joint="curve")
        # pulses of light run along the glass every ~2s (continuous motion / event cadence)
        for k in range(4):
            ph=((f-BEATS[2])/(2.0*FPS) + k*0.25)%1.0
            x,y=cable_xy(ph); al=int(220*ca*(1-abs(0.5-ph)*1.2))
            if al>6:
                d.ellipse([x-5,y-5,x+5,y+5],fill=(*GOLD,al))
                d.ellipse([x-11,y-11,x+11,y+11],outline=(*GOLD,int(al*0.5)),width=2)
    # thermal/seismic pulse rings spread through the ground the whole timeline (event cadence)
    draw_pulses(d,f)
    # --- digital twin lattice (beat5) ---
    draw_twin(d,f)
    # --- thaw front isotherm: proven segment + predicted dotted extension (beat6/7) ---
    tf=E.out_cubic(E.seg(f,BEATS[5],BEATS[5]+40))
    if tf>0:
        draw_thaw_front(d,f,tf,150,W-150,predicted=(f>=BEATS[6]))
    # --- caveat (beat7) THE CLIMAX: a 'drill' probe descends fast, decelerates, and CLAMPS at the
    #     proof line. Everything the twin forecasts BELOW that line is unprovable. ---
    if f>=BEATS[6]:
        dx=EMB_CX-150; STOPY=ACTIVE1+150                    # the proof line the drill cannot cross
        a_desc=E.out_cubic(E.seg(f,BEATS[6],BEATS[6]+40))**1.6   # fast, then a hard decel into the clamp
        rb=E.seg(f,BEATS[6]+34,BEATS[6]+62); recoil=math.sin(rb*math.pi)*9*(1-rb)   # mechanical recoil tick
        dtip=(SURF-30) + a_desc*(STOPY-(SURF-30)) - recoil
        dv=E.out_cubic(E.seg(f,BEATS[6],BEATS[6]+24))
        d.line([(dx,SURF-34),(dx,dtip)],fill=(222,232,244,int(238*dv)),width=5)
        d.polygon([(dx-8,dtip-2),(dx+8,dtip-2),(dx,dtip+17)],fill=(222,232,244,int(244*dv)))
        clamp=E.out_cubic(E.seg(f,BEATS[6]+38,BEATS[6]+70))
        if clamp>0.02:
            for xx0 in range(int(dx-130),int(dx+280),14):    # dashed PROOF LINE the drill clamps onto
                d.line([(xx0,STOPY),(xx0+7,STOPY)],fill=(255,150,120,int(180*clamp)),width=2)
            d.line([(dx-15,STOPY-13),(dx-15,STOPY+13)],fill=(255,150,120,int(225*clamp)),width=3)
            d.text((dx+16,STOPY+9),"UNVERIFIED BELOW",font=mono(16,b=True),fill=(255,150,120,int(238*clamp)))
    draw_motes(img,t)          # drifting frost/ice motes (ambient living motion, in front)
    # ---- push-in + finishing ----
    prog=E.in_out_sine(f/(NF-1)); sc=1.0+0.045*prog; cw,ch=int(W/sc),int(H/sc)
    cyoff=0.42+0.05*math.sin(t*0.20)
    sceneimg=img.convert("RGB").crop(((W-cw)//2,int((H-ch)*cyoff),(W-cw)//2+cw,int((H-ch)*cyoff)+ch)).resize((W,H),Image.LANCZOS)
    out=Image.fromarray(finish(np.asarray(sceneimg),3000+f))
    out=out.filter(ImageFilter.UnsharpMask(radius=2.4,percent=96,threshold=2)).convert("RGBA"); du=ImageDraw.Draw(out,"RGBA")
    # --- dark scrims behind text zones, drawn BEFORE the readability sample so on-screen text always
    #     clears the contrast floor (and so the scrims are what the gate measures as the background) ---
    sd=ImageDraw.Draw(out,"RGBA")
    numv=E.out_cubic(E.seg(f,BEATS[5],BEATS[5]+44))*(1.0-0.55*E.seg(f,1140,1230))   # matches the count's reveal+recede
    if numv>0.02:                                      # number-zone scrim follows the count's visibility
        sd.rounded_rectangle([W-MARGIN-336,134,W-MARGIN+14,348],18,fill=(5,12,24,int(232*numv)))
    cue_now=any(c["s"]-0.30<=f/FPS<c["e"]+0.20 for c in CUES)
    if cue_now:                                        # caption lower-third scrim (only while a line is up)
        for i,yy in enumerate(range(1392,1612,2)):     # soft vertical gradient (dark in the middle)
            edge=abs((yy-1502)/110.0); al=int(170*max(0.0,1-edge*edge))
            sd.line([(70,yy),(W-70,yy)],fill=(5,11,20,al),width=2)
    global BGLUMA
    if LOGTEXT and f%6==0: TEXTLOG.clear(); BGLUMA=_lum(np.asarray(out.convert("RGB")).astype(np.float32))
    else: BGLUMA=None
    # eyebrow
    eb=E.out_cubic(E.seg(f,6,30))
    if eb>0:
        tk(du,"ALASKA.AI",mono(18,True),(255,222,120,int(220*eb)),MARGIN,70,0.14)
        tk(du,"/  FIELD SIGNAL",mono(18),(214,230,245,int(150*eb)),MARGIN+tw("ALASKA.AI",mono(18,True),.14)+16,70,0.14)
    # location tag
    lc=E.out_cubic(E.seg(f,20,54))
    if lc>0:
        s="UTQIAGVIK, ALASKA"; lf=mono(17,m=True)
        tk(du,s,lf,(214,230,245,int(180*lc)),MARGIN,104,0.12)
    # big number on a dark plate (beat6): ~2°F per decade (sources: 'up to almost 2°F/decade')
    cc=E.out_cubic(E.seg(f,BEATS[5],BEATS[5]+44))*(1.0-0.55*E.seg(f,1140,1230))   # lands, then recedes
    if cc>0:
        nx=W-MARGIN-300; ny=150
        du.rounded_rectangle([nx-26,ny-14,W-MARGIN+8,ny+178],18,fill=(6,14,26,int(180*cc)),outline=(*CORAL,int(90*cc)),width=2)
        nf=fr(110,900,144); s_="~2°F"; sw=tw(s_,nf); sx=W-MARGIN-sw
        tk(du,s_,nf,(255,222,120,int(240*cc)),sx,ny)
        tk(du,"PER DECADE",mono(18,b=True),(255,160,120,int(210*cc)),sx+2,ny+120,0.10)
        tk(du,"PERMAFROST WARMING",mono(15,m=True),(214,230,245,int(180*cc)),sx+2,ny+150,0.10)
        _logw(sx,ny,sw,nf.size,(255,222,120),cc,cc>=0.6,"count")
        _logw(sx+2,ny+120,tw("PER DECADE",mono(18,b=True),0.10),18,(255,160,120),cc,cc>=0.6,"label")
    draw_hud(out,f)
    caption(out,f)
    outro_card(out,f)
    # footer signoff (hands off to the outro card)
    so=E.out_cubic(E.seg(f,8,34))
    if so>0 and f<OUTRO_F:
        sf=fr(36,900,144); tk(du,"alaska.ai",sf,(255,255,255,int(150*so)),(W-tw("alaska.ai",sf))//2,1712)
    # opening fade-in + closing cinematic fade-out (motion runs to the final frame)
    fin=E.seg(f,0,14)
    if fin<1: out.alpha_composite(Image.new("RGBA",(W,H),(0,0,0,int(255*(1-E.out_cubic(fin))))))
    outf=E.seg(f,1715,1800)
    if outf>0: out.alpha_composite(Image.new("RGBA",(W,H),(0,0,0,int(248*E.in_out_sine(outf)))))
    if LOGTEXT and f%6==0:
        os.makedirs(os.path.join(HERE,"textlog"),exist_ok=True)
        json.dump(TEXTLOG,open(os.path.join(HERE,"textlog",f"frame_{f:05d}.json"),"w"))
    return out.convert("RGB")

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
