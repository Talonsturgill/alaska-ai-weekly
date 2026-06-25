"""
post_grade.py — cinematic finishing pass over a rendered RGB frame.
Filmic tone curve + brand split-tone + bloom/halation + film grain + vignette
+ subtle chromatic aberration. numpy/scipy/PIL only. Tunable; values are a
tasteful default that the research pass will refine.
"""
import numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image

def _aces(x):
    # Narkowicz ACES filmic approximation (subtle, keeps highlights from clipping ugly)
    a,b,c,d,e = 2.51,0.03,2.43,0.59,0.14
    return np.clip((x*(a*x+b))/(x*(c*x+d)+e),0,1)

def grade(rgb_u8, strength=1.0, seed=0,
          shadow_tint=(8,24,56), highlight_tint=(255,210,120),
          bloom_thr=0.72, bloom_strength=0.16, grain=0.020,
          vignette=0.22, ca=1.4):
    f = rgb_u8.astype(np.float32)/255.0
    H,W,_ = f.shape

    # 1) filmic tone map + gentle contrast S
    g = _aces(f*1.05)
    g = g + (g-0.5)*0.06            # mild contrast
    g = np.clip(g,0,1)

    # 2) split-tone: push shadows toward brand flag-blue, highlights toward gold
    luma = (0.2126*g[...,0]+0.7152*g[...,1]+0.0722*g[...,2])[...,None]
    sh = (1-luma)**2.0; hi = luma**2.0
    st = (np.array(shadow_tint,np.float32)/255.0-0.5)*0.10*sh
    ht = (np.array(highlight_tint,np.float32)/255.0-0.5)*0.07*hi
    g = np.clip(g+st+ht,0,1)

    # 3) bloom + halation (threshold highlights, blur, screen back)
    lb = np.clip(luma[...,0]-bloom_thr,0,1)/(1-bloom_thr+1e-6)
    hl = g*lb[...,None]
    blo = np.dstack([gaussian_filter(hl[...,c],sigma=9) for c in range(3)])
    halo = np.dstack([gaussian_filter(hl[...,c],sigma=22) for c in range(3)])*np.array([1.0,0.5,0.35])
    add = (blo+halo*0.6)*bloom_strength
    g = 1-(1-g)*(1-np.clip(add,0,1))    # screen

    # 4) chromatic aberration (radial, edges only)
    if ca>0:
        yy,xx = np.mgrid[0:H,0:W].astype(np.float32)
        cx,cy=W/2,H/2
        rx=(xx-cx)/cx; ry=(yy-cy)/cy
        rr=(rx*rx+ry*ry)
        shift=ca*rr
        def warp(ch,s):
            xs=np.clip((xx+rx*s).astype(np.int32),0,W-1); ys=np.clip((yy+ry*s).astype(np.int32),0,H-1)
            return ch[ys,xs]
        g[...,0]=warp(g[...,0], shift); g[...,2]=warp(g[...,2], -shift)

    # 5) vignette
    yy,xx = np.mgrid[0:H,0:W].astype(np.float32)
    r=np.sqrt(((xx-W/2)/(W/2))**2+((yy-H/2)/(H/2))**2)
    vig=1-np.clip((r-0.6)*vignette*2.2,0,vignette)
    g*=vig[...,None]

    # 6) film grain (luma-weighted, a touch more in shadows)
    rng=np.random.default_rng(seed)
    n=rng.standard_normal((H,W,1)).astype(np.float32)
    n=gaussian_filter(n,sigma=(0.5,0.5,0))     # soften to filmic, not digital
    gw=(0.6+0.8*(1-luma))
    g=np.clip(g+n*grain*gw,0,1)

    out = (g*255).astype(np.uint8)
    if strength<1.0:
        out=(rgb_u8.astype(np.float32)*(1-strength)+out.astype(np.float32)*strength).astype(np.uint8)
    return out

if __name__=="__main__":
    import sys
    src=sys.argv[1] if len(sys.argv)>1 else "frames/frame_00470.png"
    im=np.array(Image.open(src).convert("RGB"))
    gr=grade(im, seed=470)
    # side-by-side before/after
    sbs=np.concatenate([im,gr],axis=1)
    Image.fromarray(sbs).save("test/grade_ba.png")
    Image.fromarray(gr).save("test/grade_after.png")
    print("wrote test/grade_ba.png (before|after) and test/grade_after.png")
