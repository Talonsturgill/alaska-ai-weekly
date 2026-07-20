import React from 'react';

// =============================================================================
// STAGE3D — TRUE 2.5D depth engine (UPGRADE_BACKLOG #1).
// -----------------------------------------------------------------------------
// The old look was flat vector art with a lighting pass; parallax was faked by
// drifting each background layer at a hand-tuned rate. Judges kept reading big
// fills and maps as "clip-art / slide." This module replaces that with a REAL
// shared virtual camera and genuine Z separation, using the browser's own 3D
// projection (Remotion renders through Chrome, so CSS 3D transforms are real):
//
//   * Stage3D    — a perspective viewport + a single world transformed by ONE
//                  virtual camera (dolly / truck / boom / orbit / roll). Every
//                  layer is projected by the SAME camera, so parallax, scale
//                  foreshortening, and "push THROUGH a layer" are automatic and
//                  physically consistent, not per-layer guesswork.
//   * Plane      — content placed at a depth z (px into the screen). Optionally
//                  `fill` pre-scales it to cover the 1080x1920 frame at that
//                  depth, so a far ridgeline still fills the frame but parallaxes
//                  slowly, while a near element parallaxes fast — for free.
//   * Extrude    — turns a flat silhouette into a SOLID dimensional form (a stack
//                  of darkening depth-slices + a lit front face), so it reads as a
//                  volume with real thickness when the camera moves, not a sticker.
//   * CastShadow3D — projects a silhouette onto the ground along the light dir
//                  (flatten + skew + blur), a real cast shadow, not a contact
//                  ellipse.
//
// Authoring stays 2D: each Plane's children are ordinary SVG/HTML laid out in the
// 1080x1920 canvas. Depth, parallax, and the camera are the new layer on top.
// =============================================================================

export interface Camera {
  x?: number;      // truck (world px, +right)
  y?: number;      // boom  (world px, +down)
  z?: number;      // dolly (world px, +toward the scene / into the screen)
  rotY?: number;   // orbit / pan (deg)
  rotX?: number;   // tilt (deg)
  rotZ?: number;   // roll (deg)
}

export const PERSPECTIVE = 1400;   // camera focal feel; larger = flatter/longer lens

const W = 1080, H = 1920;

// The camera transform is the INVERSE of the camera pose applied to the world:
// move the world opposite the camera. Rotations first (orbit about the world),
// then translate. Order chosen so a positive z dollies INTO the scene.
function worldTransform(cam: Camera): string {
  const {x = 0, y = 0, z = 0, rotY = 0, rotX = 0, rotZ = 0} = cam;
  return [
    `translateZ(${z}px)`,
    `rotateX(${-rotX}deg)`,
    `rotateY(${-rotY}deg)`,
    `rotateZ(${-rotZ}deg)`,
    `translateX(${-x}px)`,
    `translateY(${-y}px)`,
  ].join(' ');
}

export const Stage3D: React.FC<{
  camera?: Camera;
  perspective?: number;
  background?: string;
  children: React.ReactNode;
}> = ({camera = {}, perspective = PERSPECTIVE, background, children}) => (
  <div style={{
    position: 'absolute', inset: 0, width: W, height: H, overflow: 'hidden',
    background, perspective: `${perspective}px`, perspectiveOrigin: '50% 50%',
  }}>
    <div style={{
      position: 'absolute', inset: 0, width: W, height: H,
      transformStyle: 'preserve-3d', transform: worldTransform(camera),
    }}>
      {children}
    </div>
  </div>
);

// A depth layer. `z` is world depth (positive = deeper into the screen). `fill`
// pre-scales the content so it covers the frame at that depth (for skies /
// ridgelines / ground). Without fill, content keeps its authored size and simply
// sits at depth z (for props and heroes that should shrink with distance).
// OVERSCAN: fill planes are drawn larger than the frame so camera trucks/orbits
// never reveal the empty edge beyond a layer.
const OVERSCAN = 1.9;

export const Plane: React.FC<{
  z?: number; fill?: boolean; opacity?: number; children: React.ReactNode;
}> = ({z = 0, fill = false, opacity, children}) => {
  const s = fill ? ((PERSPECTIVE + z) / PERSPECTIVE) * OVERSCAN : 1;
  return (
    <div style={{
      position: 'absolute', inset: 0, width: W, height: H, opacity,
      transformStyle: 'preserve-3d',
      transform: `translateZ(${-z}px) scale(${s})`,
      transformOrigin: '50% 50%',
    }}>
      {children}
    </div>
  );
};

// ---------------------------------------------------------------- Extrude (per-face lit)
// Extrude a flat silhouette into a SOLID form with real thickness and a REAL face
// light model (task: replace the naive darkening stack).
//
// The light model, tied to the same global key as lib/lighting.tsx (low screen-left,
// warm key / cool shade):
//   * FRONT face (i === 0): the hero surface — render() draws it fully lit/detailed.
//   * SIDE WALL (the slice stack): each slice's brightness comes from which way the
//     wall FACES relative to the key. As the camera orbits +rotY, the revealed wall
//     faces screen-left (toward the key) => slices render with the WARM lit side
//     color; orbit the other way and the wall faces away => COOL shaded side color.
//     The caller passes `camRotY` (the current camera orbit) so the wall responds to
//     the actual camera, like a real solid under a fixed sun.
//   * AO: the last few back slices darken further (contact occlusion at the rear),
//     and a cool ambient floor keeps the darkest slice from going dead black.
//
// render(face, t, i): face is 'front' | 'side'; t is 0 (front) -> 1 (back); the
// callback fills the silhouette with the provided fill color for side slices via
// the second arg of makeFill, or draws the full detailed art for the front.
export type ExtrudeFace = 'front' | 'side';

export interface SideLight {
  warm: string;   // wall color when facing the key (screen-left)
  cool: string;   // wall color when facing away
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `#${((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0')}`;
}

export const Extrude: React.FC<{
  depth?: number; slices?: number;
  /** current camera orbit (deg); drives which side of the wall is revealed + lit */
  camRotY?: number;
  /** side-wall palette; default derives a plausible warm/cool pair from `base` */
  base?: string; side?: SideLight;
  render: (face: ExtrudeFace, shade: string, t: number, i: number) => React.ReactNode;
}> = ({depth = 60, slices = 10, camRotY = 0, base = '#8C99A8', side, render}) => {
  const sideLight: SideLight = side ?? {
    warm: mixHex(base, '#ffe8c4', 0.35),   // toward the dawn key
    cool: mixHex(base, '#1c2740', 0.55),   // away, into the cool sky fill
  };
  // Which way does the revealed wall face? Positive camera orbit (camera moves
  // screen-right, world apparently rotates left) reveals the form's RIGHT flank,
  // which faces AWAY from the screen-left key => cool. Negative orbit reveals the
  // LEFT flank => warm. Smoothly blend through zero so small orbits stay subtle.
  const facing = Math.max(-1, Math.min(1, camRotY / 22));    // -1 warm .. +1 cool
  const wallBase = mixHex(sideLight.warm, sideLight.cool, (facing + 1) / 2);
  const layers = [];
  for (let i = slices; i >= 1; i--) {
    const t = i / slices;                        // 1 = back, ->0 front
    const zoff = -t * depth;
    // AO toward the back + a cool ambient floor (never dead black)
    const ao = t > 0.66 ? (t - 0.66) / 0.34 : 0;
    const shade = mixHex(wallBase, '#0d1220', ao * 0.55);
    layers.push(
      <div key={i} style={{
        position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
        transform: `translateZ(${zoff}px)`,
      }}>
        {render('side', shade, t, i)}
      </div>
    );
  }
  // front face last (closest to camera)
  layers.push(
    <div key="front" style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: 'translateZ(0px)'}}>
      {render('front', base, 0, 0)}
    </div>
  );
  return <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>{layers}</div>;
};

// ---------------------------------------------------------------- depth atmosphere
// Aerial perspective: real air between the camera and a far plane. Wrap a Plane's
// content in <Atmosphere z={...}> and distance desaturates, cools toward the sky
// color, and loses contrast — the strongest single depth cue after parallax.
// Cheap: one CSS filter + one tint overlay per plane, no per-pixel work.
export const Atmosphere: React.FC<{
  z: number;                 // the plane's depth (same value you passed to Plane)
  skyTint?: string;          // the air color distance fades toward
  strength?: number;         // overall effect gain (1 = default)
  children: React.ReactNode;
}> = ({z, skyTint = '#2a3f66', strength = 1, children}) => {
  // haze ramps in from ~400px depth and saturates around ~2200px
  const a = Math.max(0, Math.min(1, ((z - 400) / 1800))) * strength;
  if (a <= 0.01) return <>{children}</>;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{
        position: 'absolute', inset: 0,
        filter: `saturate(${1 - 0.45 * a}) brightness(${1 + 0.08 * a}) contrast(${1 - 0.28 * a})`,
      }}>
        {children}
      </div>
      {/* the air itself: a sky-colored veil over the plane */}
      <div style={{position: 'absolute', inset: 0, background: skyTint, opacity: 0.34 * a, pointerEvents: 'none'}} />
    </div>
  );
};

// Project a silhouette onto the ground as a real cast shadow: flatten (scaleY),
// skew toward the light, darken, blur. `children` is the silhouette to cast.
export const CastShadow3D: React.FC<{
  x: number; y: number; scaleX?: number; lean?: number; squash?: number;
  blur?: number; opacity?: number; children: React.ReactNode;
}> = ({x, y, scaleX = 1, lean = 0.6, squash = 0.26, blur = 12, opacity = 0.34, children}) => (
  <div style={{
    position: 'absolute', left: x, top: y, transformOrigin: 'bottom center',
    transform: `skewX(${lean * 34}deg) scale(${scaleX}, ${squash})`,
    filter: `blur(${blur}px) brightness(0)`, opacity, pointerEvents: 'none',
  }}>
    {children}
  </div>
);
