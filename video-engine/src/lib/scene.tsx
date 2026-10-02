import React, {createContext, useContext} from 'react';
import {Easing, interpolate, spring as rspring} from 'remotion';
import {ContactShadow, MotionBlur} from './lighting';
import {ImpactStar, PaperStorm, SpeedLines, ZoomVignette} from './FX';
import {POP, SETTLE, SNAP, SpringPreset} from './motion';

/**
 * THE SCENE GRAMMAR (2026-10-02, the cost project).
 *
 * A Dispatch episode used to be 15 to 67 KB of hand-written TSX per run, and most of that code
 * was the same craft rules written again in different words: an entrance with anticipation,
 * overshoot and settle, a slow push on every held shot, parallax across depth planes, a contact
 * shadow under anything grounded, a snap-zoom at the emotional peak, a motivated transition.
 * Every rewrite was a chance to get one of them wrong, and the panel paid to find it.
 *
 * Now an episode is a scene spec (out/dispatch/scene_spec.json), and scripts/scene_compile.py
 * turns it into an ordinary episode file that calls the pieces below. The craft lives here,
 * once, at the bar, and every episode gets it for free. Bespoke art still exists: a run builds
 * its hero illustrations as reusable components in lib/ and the spec stages them.
 *
 * Every function is a pure function of the frame, so parallel chunk renders stay
 * bit-identical. Times passed in are FRAMES in the shot's local timeline.
 */

export const SCENE_FPS = 30;
export const SCENE_W = 1080;
export const SCENE_H = 1920;
const c01 = (x: number) => Math.max(0, Math.min(1, x));

// --------------------------------------------------------------------------- timing
/** Fast out, long settle. The house ease for anything that arrives. */
export const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
/** Symmetric in and out, for camera ramps and moves between two held states. */
export const EZIO = Easing.bezier(0.45, 0, 0.25, 1);

/** 0 before `a`, eased to 1 over `d` frames, mapped onto from..to. */
export const ease = (f: number, a: number, d = 24, from = 0, to = 1): number => {
  if (d <= 0) return f >= a ? to : from;
  const t = interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
  return from + (to - from) * t;
};

/** A slam: reaches its target in about four frames, overshoots and rings out over `d`. */
export const spring = (f: number, a: number, d = 20, from = 0, to = 1): number => {
  const t = c01((f - a) / Math.max(1, d));
  if (t <= 0) return from;
  const v = 1 - Math.pow(2, -9 * t) * Math.cos((t * d - 1.2) * 0.9);
  return from + (to - from) * v;
};

/** A physical spring from Remotion, with the motion kit's presets. Slower and rounder than spring(). */
export const settle = (f: number, a: number, preset: 'pop' | 'snap' | 'settle' = 'pop', from = 0, to = 1): number => {
  if (f < a) return from;
  const cfg: SpringPreset = preset === 'snap' ? SNAP : preset === 'settle' ? SETTLE : POP;
  return from + (to - from) * rspring({frame: f - a, fps: SCENE_FPS, config: cfg});
};

/** Eased in and out from `a` to `b`. A move between two held states. */
export const ramp = (f: number, a: number, b: number, from = 0, to = 1): number => {
  if (b <= a) return f >= a ? to : from;
  const t = interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZIO});
  return from + (to - from) * t;
};

/** Held states: the value of the last step whose frame has been reached. */
export function steps<T>(f: number, init: T, pts: Array<[number, T]>): T {
  let v = init;
  for (const [a, x] of pts) if (f >= a) v = x;
  return v;
}

/** A damped ring after an impact at `a`: amplitude `amp`, decay `decay` frames. */
export const wobble = (f: number, a: number, amp = 3, decay = 16, period = 2.6): number =>
  f < a ? 0 : Math.sin((f - a) / period) * Math.exp(-(f - a) / decay) * amp;

/** Idle life: a sine of `period` frames. */
export const osc = (f: number, period = 60, amp = 1, phase = 0): number =>
  Math.sin((2 * Math.PI * f) / Math.max(1, period) + phase) * amp;

/** 0, up to 1 and back to 0 across `d` frames from `a`. Flashes, glints, breaths. */
export const bump = (f: number, a: number, d = 12, amp = 1): number => {
  const t = (f - a) / Math.max(1, d);
  return t < 0 || t > 1 ? 0 : Math.sin(Math.PI * t) * amp;
};

/** Text that types itself in at `cps` characters a second from `a`. */
export const typed = (f: number, a: number, text: string, cps = 16): string =>
  text.slice(0, Math.max(0, Math.min(text.length, Math.floor(((f - a) / SCENE_FPS) * cps))));

/** A deterministic hash, for seeded scatter. Never Math.random. */
export const hash = (i: number) => Math.imul(i + 1013, 2654435761) >>> 0;

// --------------------------------------------------------------------------- camera
type CamState = {scale: number; drift: number};
const CamCtx = createContext<CamState>({scale: 1, drift: 0});
export const useCam = () => useContext(CamCtx);

export type Snap = {
  /** frame the snap fires */
  at: number;
  /** focal point in canvas coordinates */
  x: number;
  y: number;
  /** peak zoom, 2.5 for a face at the emotional peak, 1.3 to 1.6 for an object */
  zoom?: number;
  /** frames to arrive */
  dur?: number;
  /** frames held at the peak, then `release` frames back to the push. 0 release holds to the cut. */
  hold?: number;
  release?: number;
  /** the juice that sells it: speed lines and a vignette slam */
  lines?: boolean;
  color?: string;
};
export type Shake = {at: number; px?: number; dur?: number};

const snapAmount = (f: number, s: Snap): number => {
  const arrive = spring(f, s.at, s.dur ?? 12);
  if (!s.release) return arrive;
  const leave = ease(f, s.at + (s.dur ?? 12) + (s.hold ?? 20), s.release);
  return arrive * (1 - leave);
};

/**
 * The shot's camera. A slow push across the whole shot (static frames are banned), a drift
 * that the depth planes read for parallax, snap-zooms at the beats that earn them, and
 * impact shake. Everything inside is scaled about the frame centre, and a snap also carries
 * its focal point toward the centre so a face fills the frame rather than sliding off it.
 */
export const CameraRig: React.FC<{
  f: number; dur: number; push?: [number, number]; drift?: number; snaps?: Snap[]; shakes?: Shake[];
  children: React.ReactNode;
}> = ({f, dur, push = [1.0, 1.06], drift = 5, snaps = [], shakes = [], children}) => {
  const base = interpolate(f, [0, Math.max(1, dur)], push, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dx = Math.sin(f / 71.3) * drift;
  let scale = base;
  let tx = dx;
  let ty = 0;
  let vignette = 0;
  const overlays: React.ReactNode[] = [];
  snaps.forEach((s, i) => {
    const k = snapAmount(f, s);
    if (k <= 0.001) return;
    const z = 1 + ((s.zoom ?? 1.6) - 1) * k;
    scale *= z;
    // carry the focal point 60% of the way to the centre at full snap
    tx += -(s.x - 540) * scale * 0.6 * k;
    ty += -(s.y - 960) * scale * 0.6 * k;
    const since = f - s.at;
    if (s.lines !== false && since >= 0 && since < 16) {
      const fade = 1 - since / 16;
      overlays.push(<SpeedLines key={`sl${i}`} cx={540} cy={960} frame={f} intensity={fade} color={s.color ?? '#ffffff'} />);
      vignette = Math.max(vignette, 0.55 * fade);
    }
  });
  for (const sh of shakes) {
    const t = f - sh.at;
    const d = sh.dur ?? 10;
    if (t >= 0 && t < d) {
      const k = (1 - t / d) * (sh.px ?? 3);
      tx += Math.sin(t * 2.7 + sh.at) * k;
      ty += Math.cos(t * 3.3 + sh.at) * k;
    }
  }
  return (
    <CamCtx.Provider value={{scale, drift: dx}}>
      <div style={{position: 'absolute', inset: 0, transformOrigin: '540px 960px',
        transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${scale.toFixed(4)})`}}>
        {children}
      </div>
      {overlays.length > 0 && (
        <svg width={SCENE_W} height={SCENE_H} viewBox="0 0 1080 1920"
          style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
          {overlays}
        </svg>
      )}
      {vignette > 0.01 && <ZoomVignette amount={vignette} />}
    </CamCtx.Provider>
  );
};

// --------------------------------------------------------------------------- transitions
export type TransitionKind = 'cut' | 'match' | 'whip-left' | 'whip-right' | 'wipe-left' | 'wipe-right' | 'iris' | 'flash' | 'dip' | 'rise';

/**
 * The incoming shot's half of a cut. It wraps the picture, so a whip moves the actual frame
 * and an iris opens on it. The outgoing shot needs nothing: a hard cut is the other half.
 */
export const TransitionIn: React.FC<{
  f: number; kind?: TransitionKind; dur?: number; x?: number; y?: number; color?: string; children: React.ReactNode;
}> = ({f, kind = 'cut', dur = 9, x = 540, y = 960, color = '#F4F2EA', children}) => {
  if (kind === 'cut' || kind === 'match' || f >= dur) return <>{children}</>;
  const t = c01(f / Math.max(1, dur));
  const e = EZ(t);
  if (kind === 'whip-left' || kind === 'whip-right') {
    const sign = kind === 'whip-left' ? 1 : -1;
    const off = sign * SCENE_W * 0.55 * (1 - e);
    const blur = 14 * (1 - e);
    return (
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${off.toFixed(1)}px)`, filter: `blur(${blur.toFixed(1)}px)`}}>
        {children}
      </div>
    );
  }
  if (kind === 'wipe-left' || kind === 'wipe-right') {
    // a sheet of paper sweeps across and leaves the new shot behind it
    const edge = SCENE_W * e;
    const clip = kind === 'wipe-left' ? `inset(0 0 0 ${SCENE_W - edge}px)` : `inset(0 ${SCENE_W - edge}px 0 0)`;
    const bandX = kind === 'wipe-left' ? SCENE_W - edge - 46 : edge - 46;
    return (
      <>
        <div style={{position: 'absolute', inset: 0, clipPath: clip}}>{children}</div>
        <div style={{position: 'absolute', top: 0, bottom: 0, left: bandX, width: 92, background: color,
          boxShadow: '0 0 40px rgba(0,0,0,0.45)', transform: `skewX(${kind === 'wipe-left' ? -6 : 6}deg)`}} />
      </>
    );
  }
  if (kind === 'iris') {
    const r = 2300 * e;
    return <div style={{position: 'absolute', inset: 0, clipPath: `circle(${r.toFixed(0)}px at ${x}px ${y}px)`}}>{children}</div>;
  }
  if (kind === 'rise') {
    const off = SCENE_H * 0.18 * (1 - e);
    return <div style={{position: 'absolute', inset: 0, transform: `translateY(${off.toFixed(1)}px)`, opacity: 0.4 + 0.6 * e}}>{children}</div>;
  }
  const over = kind === 'flash' ? '#FFFFFF' : '#05070C';
  const amount = kind === 'flash' ? 0.85 * (1 - t) : 1 - e;
  return (
    <>
      {children}
      <div style={{position: 'absolute', inset: 0, background: over, opacity: amount, pointerEvents: 'none'}} />
    </>
  );
};

// --------------------------------------------------------------------------- layers
export type EnterStyle = 'none' | 'fade' | 'pop' | 'drop' | 'slam' | 'rise' | 'slide-left' | 'slide-right'
  | 'whip-left' | 'whip-right' | 'unfold' | 'grow';
export type ExitStyle = 'none' | 'fade' | 'drop' | 'lift' | 'slide-left' | 'slide-right' | 'whip-left' | 'whip-right' | 'shrink';
export type IdleKind = 'none' | 'breathe' | 'bob' | 'sway' | 'float' | 'flicker' | 'jitter';

type Motion = {dx: number; dy: number; sx: number; sy: number; rot: number; alpha: number; vx: number; vy: number; on: boolean};

const enterMotion = (f: number, s: EnterStyle, at: number, dur: number, dist: number): Motion => {
  const m: Motion = {dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, alpha: 1, vx: 0, vy: 0, on: true};
  if (s === 'none') return m;
  if (s === 'fade') {
    m.alpha = ease(f, at, dur);
    m.on = f >= at;
    return m;
  }
  // anticipation: a small dip in the frames before launch, only for things already on screen
  if (s === 'pop' || s === 'grow' || s === 'unfold') {
    if (f < at) {
      m.on = false;
      return m;
    }
    const k = s === 'grow' ? ease(f, at, dur) : spring(f, at, dur);
    if (s === 'unfold') {
      m.sy = Math.max(0, k);
      m.sx = 1 + 0.06 * Math.max(0, k - 1);
    } else {
      m.sx = m.sy = Math.max(0, k);
    }
    m.alpha = c01(k * 3);
    return m;
  }
  const dir = s === 'drop' || s === 'slam' ? [0, -1] : s === 'rise' ? [0, 1]
    : s === 'slide-left' || s === 'whip-left' ? [-1, 0] : [1, 0];
  if (f < at) {
    m.on = false;
    return m;
  }
  const fast = s === 'slam' || s.startsWith('whip');
  const k = fast ? spring(f, at, dur) : settle(f, at, 'pop');
  const kPrev = fast ? spring(f - 1, at, dur) : settle(f - 1, at, 'pop');
  const travel = 1 - k;
  m.dx = dir[0] * dist * travel;
  m.dy = dir[1] * dist * travel;
  m.vx = dir[0] * dist * (kPrev - k);
  m.vy = dir[1] * dist * (kPrev - k);
  // stretch along the travel in flight, squash on the overshoot
  const v = Math.min(1, Math.hypot(m.vx, m.vy) / 28);
  const impact = Math.max(0, k - 1);
  const stretch = 1 + v * 0.16 - impact * 0.3;
  if (dir[1] !== 0) {
    m.sy = stretch;
    m.sx = 1 / Math.max(0.6, stretch);
  } else {
    m.sx = stretch;
    m.sy = 1 / Math.max(0.6, stretch);
  }
  m.alpha = c01((f - at + 1) / 3);
  return m;
};

const exitMotion = (f: number, s: ExitStyle, at: number, dur: number, dist: number, m: Motion): Motion => {
  if (s === 'none' || f < at) return m;
  const k = ease(f, at, dur);
  if (k >= 1 && s !== 'shrink') {
    m.on = false;
    return m;
  }
  if (s === 'fade') m.alpha *= 1 - k;
  else if (s === 'shrink') {
    m.sx *= 1 - k;
    m.sy *= 1 - k;
    if (k >= 1) m.on = false;
  } else {
    const dir = s === 'drop' ? [0, 1] : s === 'lift' ? [0, -1] : s === 'slide-left' || s === 'whip-left' ? [-1, 0] : [1, 0];
    const kk = k * k;
    m.dx += dir[0] * dist * kk;
    m.dy += dir[1] * dist * kk;
    m.vx += dir[0] * dist * 0.1;
    m.vy += dir[1] * dist * 0.1;
  }
  return m;
};

const idleMotion = (f: number, kind: IdleKind, amp: number, period: number, phase: number, m: Motion): Motion => {
  if (kind === 'breathe') {
    const b = osc(f, period, 0.012 * amp, phase);
    m.sy *= 1 + b;
    m.sx *= 1 - b * 0.4;
  } else if (kind === 'bob') m.dy += osc(f, period, 6 * amp, phase);
  else if (kind === 'sway') m.rot += osc(f, period, 1.6 * amp, phase);
  else if (kind === 'float') {
    m.dy += osc(f, period, 9 * amp, phase);
    m.dx += osc(f, period * 1.7, 5 * amp, phase + 1.3);
    m.rot += osc(f, period * 2.3, 0.8 * amp, phase);
  } else if (kind === 'flicker') m.alpha *= 0.86 + 0.14 * (((hash(Math.floor(f / 2)) % 100) / 100) * amp);
  else if (kind === 'jitter') {
    m.dx += ((hash(f * 3 + 1) % 100) / 100 - 0.5) * 2 * amp;
    m.dy += ((hash(f * 5 + 2) % 100) / 100 - 0.5) * 2 * amp;
  }
  return m;
};

/**
 * One staged element: where it sits, how it arrives, how it leaves, the life it has while it
 * holds, the depth plane it lives on, and the contact shadow that grounds it.
 *
 * `x, y` place the element's local origin. `ox, oy` are the pivot its entrance scales and
 * rotates about, in local coordinates, so a card can unfold from its top edge or a stamp can
 * squash against the paper it hits. `z` is depth, 0 the far plane and 1 the nearest: the
 * camera's drift moves near planes more than far ones, which is what reads as a world rather
 * than a collage. `shadow` draws a contact shadow at the element's resting ground, which stays
 * on the ground while the element drops into it.
 */
export const Layer: React.FC<{
  f: number;
  x?: number; y?: number; scale?: number; rot?: number; opacity?: number;
  z?: number; ox?: number; oy?: number;
  enter?: {style: EnterStyle; at: number; dur?: number; dist?: number};
  exit?: {style: ExitStyle; at: number; dur?: number; dist?: number};
  idle?: {kind: IdleKind; amp?: number; period?: number; phase?: number};
  shadow?: {rx: number; ry?: number; dx?: number; dy?: number; opacity?: number};
  blur?: number;
  children?: React.ReactNode;
}> = ({f, x = 0, y = 0, scale = 1, rot = 0, opacity = 1, z = 0.5, ox = 0, oy = 0, enter, exit, idle, shadow, blur = 0, children}) => {
  const cam = useCam();
  let m: Motion = enter
    ? enterMotion(f, enter.style, enter.at, enter.dur ?? 14, enter.dist ?? 220)
    : {dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, alpha: 1, vx: 0, vy: 0, on: true};
  if (exit) m = exitMotion(f, exit.style, exit.at, exit.dur ?? 12, exit.dist ?? 260, m);
  if (!m.on || opacity <= 0.001) return null;
  if (idle && idle.kind !== 'none') m = idleMotion(f, idle.kind, idle.amp ?? 1, idle.period ?? 70, idle.phase ?? 0, m);
  // parallax: the near planes travel further than the far ones under the same drift
  const px = cam.drift * (z - 0.5) * 2.4;
  const alpha = Math.max(0, Math.min(1, opacity * m.alpha));
  const body = (
    <g transform={`translate(${(m.dx).toFixed(2)},${(m.dy).toFixed(2)}) translate(${ox},${oy}) rotate(${m.rot.toFixed(3)}) scale(${m.sx.toFixed(4)},${m.sy.toFixed(4)}) translate(${-ox},${-oy})`}>
      {children}
    </g>
  );
  const landed = enter && (enter.style === 'drop' || enter.style === 'slam') ? c01(1 - Math.abs(m.dy) / Math.max(1, enter.dist ?? 220)) : 1;
  return (
    <g transform={`translate(${(x + px).toFixed(2)},${y.toFixed(2)}) rotate(${rot}) scale(${scale})`} opacity={alpha}
      style={blur > 0.3 ? {filter: `blur(${blur.toFixed(1)}px)`} : undefined}>
      {shadow && (
        <ContactShadow cx={shadow.dx ?? 0} cy={shadow.dy ?? 0} rx={shadow.rx * (0.6 + 0.4 * landed)} ry={shadow.ry}
          opacity={(shadow.opacity ?? 0.45) * (0.3 + 0.7 * landed)} />
      )}
      {Math.abs(m.vx) + Math.abs(m.vy) > 1.5 ? <MotionBlur vx={m.vx} vy={m.vy} gain={0.45}>{body}</MotionBlur> : body}
    </g>
  );
};

// --------------------------------------------------------------------------- effects
export type FxKind = 'impact' | 'speed' | 'paper' | 'glint' | 'rings' | 'puff' | 'motes';

/**
 * The juice a beat earns, drawn in canvas coordinates inside the shot's picture. Each one is
 * a pure function of the frame and is gone when its moment is over, so nothing lingers.
 */
export const Fx: React.FC<{
  f: number; kind: FxKind; at?: number; dur?: number; x?: number; y?: number; r?: number;
  tx?: number; ty?: number; color?: string; count?: number; y0?: number; y1?: number; opacity?: number;
}> = ({f, kind, at = 0, dur = 14, x = 540, y = 960, r = 90, tx = 540, ty = 960, color = '#FFD23E', count = 26, y0 = 480, y1 = 1300, opacity = 0.22}) => {
  if (kind === 'motes') {
    return (
      <g>
        {Array.from({length: count}, (_, i) => {
          const h = hash(i * 7 + 3);
          const mx = (h % 1080) + Math.sin(f / (50 + (h % 40)) + i) * 14;
          const span = Math.max(1, y1 - y0);
          let my = y0 + ((h >>> 9) % span) - ((f * (0.2 + ((h >>> 5) % 30) / 100)) % span);
          if (my < y0) my += span;
          return <circle key={i} cx={mx} cy={my} r={1.4 + ((h >>> 17) % 3) * 0.6} fill={color} opacity={opacity * (0.5 + ((h >>> 21) % 50) / 100)} />;
        })}
      </g>
    );
  }
  const t = f - at;
  if (t < 0 || t > dur) return null;
  const k = t / Math.max(1, dur);
  if (kind === 'impact') {
    const s = spring(f, at, 10) * (1 - k * 0.4);
    return (
      <g opacity={1 - k * k}>
        <g transform={`translate(${x},${y}) scale(${s.toFixed(3)}) translate(${-x},${-y})`}>
          <ImpactStar cx={x} cy={y} r={r} color={color} rot={at * 7} />
        </g>
        {Array.from({length: 8}, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const d = r * (0.9 + 1.6 * k);
          return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d * 0.5} r={6 * (1 - k)} fill="#F4F2EA" opacity={0.7 * (1 - k)} />;
        })}
      </g>
    );
  }
  if (kind === 'puff') {
    return (
      <g opacity={0.55 * (1 - k)}>
        {Array.from({length: 6}, (_, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          const d = r * (0.3 + 1.2 * k) * (0.7 + (i % 3) * 0.2);
          return <ellipse key={i} cx={x + side * d} cy={y - 8 * k * (i % 3)} rx={18 + 26 * k} ry={10 + 12 * k} fill={color} />;
        })}
      </g>
    );
  }
  if (kind === 'speed') return <SpeedLines cx={x} cy={y} frame={f} intensity={1 - k} color={color} />;
  if (kind === 'paper') return <PaperStorm frame={t} originX={x} originY={y} targetX={tx} targetY={ty} count={count} spread={r} />;
  if (kind === 'glint') {
    const g = bump(f, at, dur);
    return (
      <g transform={`translate(${x},${y}) rotate(${(t * 6) % 360}) scale(${(0.4 + 0.8 * g).toFixed(3)})`} opacity={g}>
        <path d={`M0,${-r * 0.5} L${r * 0.08},0 L0,${r * 0.5} L${-r * 0.08},0 Z`} fill={color} />
        <path d={`M${-r * 0.5},0 L0,${r * 0.08} L${r * 0.5},0 L0,${-r * 0.08} Z`} fill={color} />
      </g>
    );
  }
  // rings
  return (
    <g fill="none" stroke={color}>
      {[0, 1, 2].map((i) => {
        const kk = c01(k * 1.4 - i * 0.2);
        return kk > 0 ? <circle key={i} cx={x} cy={y} r={r * (0.3 + 1.4 * kk)} strokeWidth={6 * (1 - kk)} opacity={0.8 * (1 - kk)} /> : null;
      })}
    </g>
  );
};
