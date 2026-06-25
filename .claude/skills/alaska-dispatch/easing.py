"""
easing.py — Penner/easings.net curves + closed-form spring, vectorized.
All take t in [0,1] -> p (back/elastic exceed [0,1] by design).
Apply: value = start + (end-start)*p.  At 30fps, t = frame_i/(N-1).
Sourced: easings.net, Robert Penner, Material 3, Apple WWDC23 springs.
"""
import numpy as np

PI = np.pi
_c1 = 1.70158; _c2 = _c1*1.525; _c3 = _c1+1; _c4 = (2*PI)/3; _c5 = (2*PI)/4.5

def _arr(t): return np.asarray(t, dtype=np.float64)
def clamp01(t): return np.clip(t,0,1)

# --- decelerate (entrances) ---
def out_sine(t):  t=_arr(t); return np.sin((t*PI)/2)
def out_cubic(t): t=_arr(t); return 1-(1-t)**3
def out_quart(t): t=_arr(t); return 1-(1-t)**4
def out_quint(t): t=_arr(t); return 1-(1-t)**5
def out_expo(t):  t=_arr(t); return np.where(t>=1,1.0,1-np.power(2.0,-10*t))
def out_circ(t):  t=_arr(t); return np.sqrt(np.clip(1-(t-1)**2,0,1))

# --- accelerate (exits) ---
def in_cubic(t): t=_arr(t); return t**3
def in_quart(t): t=_arr(t); return t**4
def in_expo(t):  t=_arr(t); return np.where(t<=0,0.0,np.power(2.0,10*t-10))

# --- symmetric (camera / between rest states) ---
def in_out_sine(t): t=_arr(t); return -(np.cos(PI*t)-1)/2
def in_out_cubic(t):
    t=_arr(t); return np.where(t<0.5, 4*t**3, 1-np.power(-2*t+2,3)/2)
def in_out_quart(t):
    t=_arr(t); return np.where(t<0.5, 8*t**4, 1-np.power(-2*t+2,4)/2)
def in_out_quint(t):
    t=_arr(t); return np.where(t<0.5, 16*t**5, 1-np.power(-2*t+2,5)/2)
def in_out_expo(t):
    t=_arr(t)
    return np.select([t<=0,t>=1,t<0.5],
        [0.0,1.0,np.power(2.0,20*t-10)/2], default=(2-np.power(2.0,-20*t+10))/2)

# --- overshoot / anticipation (tunable) ---
def out_back(t, overshoot=0.10):
    t=_arr(t); c1=overshoot/0.0588; c3=c1+1
    return 1+c3*np.power(t-1,3)+c1*np.power(t-1,2)
def in_back(t, overshoot=0.10):
    t=_arr(t); c1=overshoot/0.0588; c3=c1+1
    return c3*t**3-c1*t**2

def out_elastic(t):
    t=_arr(t)
    return np.select([t<=0,t>=1],[0.0,1.0],
        default=np.power(2.0,-10*t)*np.sin((t*10-0.75)*_c4)+1)

def _bounce_out(t):
    t=_arr(t).copy(); n1,d1=7.5625,2.75; o=np.empty_like(t)
    m1=t<1/d1; m2=(t>=1/d1)&(t<2/d1); m3=(t>=2/d1)&(t<2.5/d1); m4=t>=2.5/d1
    o[m1]=n1*t[m1]**2
    tt=t[m2]-1.5/d1;   o[m2]=n1*tt*tt+0.75
    tt=t[m3]-2.25/d1;  o[m3]=n1*tt*tt+0.9375
    tt=t[m4]-2.625/d1; o[m4]=n1*tt*tt+0.984375
    return o
def out_bounce(t): return _bounce_out(t)

# --- closed-form spring (underdamped), evaluated on a frame grid ---
def spring(n_frames, fps=30, zeta=0.7, response=0.42, x0=1.0, v0=0.0):
    """Return progress array len n_frames easing 0->1 with one weighted overshoot.
    zeta=damping ratio (0.7~4.6% overshoot, 1.0 none); response=natural period (s)."""
    omega0 = 2*PI/response
    t = np.arange(n_frames)/fps
    if zeta < 1:
        wd = omega0*np.sqrt(1-zeta**2)
        x = np.exp(-zeta*omega0*t)*(x0*np.cos(wd*t)+((v0+zeta*omega0*x0)/wd)*np.sin(wd*t))
    else:
        x = np.exp(-omega0*t)*(x0+(v0+omega0*x0)*t)
    return 1-x  # x is displacement-from-target -> progress

# --- helpers ---
def lerp(a,b,p): return a+(b-a)*p
def seg(frame,a,b): return clamp01((frame-a)/max(1e-9,(b-a)))
def hold_then(frame,start,dur,ease=out_quint):
    """progress for a move that begins at `start` over `dur` frames, clamped/held."""
    return ease(clamp01((frame-start)/dur))

if __name__=="__main__":
    for fn in [out_quint,in_out_cubic,out_back,out_expo]:
        s=fn(np.linspace(0,1,6)); print(fn.__name__, np.round(s,3))
    print("spring", np.round(spring(18,zeta=0.7),3))
