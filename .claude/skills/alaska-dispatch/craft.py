"""
craft.py — world-class illustration craft layer (reusable).
Turns flat hand-coded sprites into LIT, TEXTURED, MOVING, motion-blurred heroes.
numpy/PIL/scipy only. See docs/WORLD_CLASS.md.

  relight_from_alpha  — fake-normal volumetric lighting (key/fill/rim/AO) from the sprite's alpha
  add_texture         — subtle material/skin texture inside the alpha
  swim_deform         — traveling-wave body undulation (real secondary animation)
  motion_blur         — 180-degree shutter via sub-frame accumulation of a deform fn
  depth_blur          — depth-of-field blur for non-hero planes
"""
import numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image

def relight_from_alpha(rgb, alpha, key=(-0.5,-0.85), ambient=0.45, key_str=1.05,
                       rim_str=0.9, rim_col=(160,210,238), ao_str=0.55, sigma=24):
    """Light an RGBA sprite's color using a pseudo-normal derived from its alpha.
    rgb float32 HxWx3 (0-255), alpha float32 HxW (0-1). Returns lit rgb.
    sigma sets the 'thickness' of the form: large -> a broad body-wide dome (not just rim)."""
    a = gaussian_filter(alpha.astype(np.float32), sigma)        # broad dome height field
    gy, gx = np.gradient(a)
    nz = 0.45
    ln = np.sqrt(gx*gx+gy*gy+nz*nz)+1e-6
    nx, ny, nzn = -gx/ln, -gy/ln, nz/ln
    kx, ky = key; kl = (kx*kx+ky*ky)**0.5+1e-6; kx, ky = kx/kl, ky/kl
    lam = np.clip(nx*kx+ny*ky, 0, 1)                            # 2D Lambert toward key
    shade = ambient + key_str*lam                              # key + fill(ambient)
    out = rgb*shade[...,None]
    # rim/back light on the top edges
    grad = np.hypot(gx, gy); grad = grad/(grad.max()+1e-6)
    rim = np.clip(grad*np.clip(-ny,0,1), 0, 1)
    out = out + rim_str*(rim[...,None])*np.array(rim_col,np.float32)
    # ambient occlusion in the interior (low gradient, low height-edge) toward belly
    ao = np.clip(1-grad,0,1)*np.clip(ny,0,1)                    # downward-facing, flat = occluded
    out = out*(1-ao_str*0.35*ao[...,None])
    return np.clip(out,0,255)

def add_texture(rgb, alpha, seed=0, strength=10.0, scale=2.0):
    """Subtle achromatic material texture inside the alpha (skin/ice/metal feel)."""
    rng = np.random.default_rng(seed)
    H,W = alpha.shape
    n = rng.standard_normal((H,W)).astype(np.float32)
    n = gaussian_filter(n, scale); n /= n.std()+1e-6
    fine = rng.standard_normal((H,W)).astype(np.float32)*0.4
    tex = (n+fine)*strength*(alpha)                            # only on the body
    return np.clip(rgb+tex[...,None],0,255)

def swim_deform(sprite, t, amp=16.0, wavelen=460.0, speed=2.3, head_frac=0.18):
    """Traveling vertical sine along x (head->tail) so the body undulates = swimming.
    Amplitude grows toward the tail. `sprite` is RGBA PIL; returns RGBA PIL same size."""
    arr = np.asarray(sprite)
    H,W = arr.shape[:2]
    xs = np.arange(W).astype(np.float32)
    ampx = amp*np.clip((xs/W - head_frac)/(1-head_frac),0,1)**1.4   # ~0 at head, max at tail
    shift = np.round(ampx*np.sin(2*np.pi*xs/wavelen - speed*t)).astype(int)
    out = np.empty_like(arr)
    for x in range(W):
        out[:,x,:] = np.roll(arr[:,x,:], shift[x], axis=0)
    return Image.fromarray(out, "RGBA")

def motion_blur(deform_fn, t, dt, K=6):
    """180-degree shutter: average K sub-frame renders of deform_fn across the shutter window.
    deform_fn(tt)->RGBA PIL (same size). Returns the averaged RGBA PIL."""
    acc = None
    for k in range(K):
        tt = t + (k/K)*dt*0.5                                  # 180deg = half the frame interval
        a = np.asarray(deform_fn(tt)).astype(np.float32)
        acc = a if acc is None else acc+a
    return Image.fromarray((acc/K).astype(np.uint8),"RGBA")

def depth_blur(rgb, sigma=6.0):
    """Depth-of-field: blur a (background) plane so the sharp hero pops."""
    return np.dstack([gaussian_filter(rgb[...,c], sigma) for c in range(3)])
