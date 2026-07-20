import React from 'react';
import {INK} from './Character';

// =============================================================================
// FX — the juice layer. Speed lines, impact stars, paper storms, dramatic-zoom
// vignette. These are what make a cut FEEL like a show instead of a slideshow.
// All frame-driven, all ink-outlined where visible as objects.
// =============================================================================

// Radial speed lines bursting from a focal point (the IGS dramatic-zoom signature).
export const SpeedLines: React.FC<{cx: number; cy: number; frame: number; intensity?: number; color?: string}> = ({
  cx,
  cy,
  frame: f,
  intensity = 1,
  color = '#ffffff',
}) => (
  <g opacity={0.9 * intensity}>
    {Array.from({length: 18}).map((_, i) => {
      const a = (i / 18) * Math.PI * 2 + (i % 2) * 0.09;
      const jit = 40 * ((i * 37 + f * 13) % 17) / 17;
      const r0 = 430 + jit;
      const r1 = r0 + 190 + 70 * ((i * 53) % 7) / 7;
      const w = 7 + 6 * ((i * 29) % 5) / 5;
      return (
        <line
          key={i}
          x1={cx + r0 * Math.cos(a)}
          y1={cy + r0 * Math.sin(a)}
          x2={cx + r1 * Math.cos(a)}
          y2={cy + r1 * Math.sin(a)}
          stroke={color}
          strokeWidth={w}
          strokeLinecap="round"
          opacity={0.5 + 0.5 * (((i * 7 + f) % 6) / 6)}
        />
      );
    })}
  </g>
);

// Comic impact star (pop-in scale comes from the caller).
export const ImpactStar: React.FC<{cx: number; cy: number; r?: number; color?: string; rot?: number}> = ({
  cx,
  cy,
  r = 60,
  color = '#ffd23e',
  rot = 0,
}) => {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI * i) / 8;
    pts.push(`${rad * Math.cos(a)},${rad * Math.sin(a)}`);
  }
  return (
    <g transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <polygon points={pts.join(' ')} fill={color} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <polygon points={pts.map((p) => p.split(',').map((v) => +v * 0.55).join(',')).join(' ')} fill="#fff" opacity={0.5} />
    </g>
  );
};

// A storm of comment papers flying across the frame (data made physical).
export const PaperStorm: React.FC<{frame: number; count?: number; originX?: number; originY?: number; targetX?: number; targetY?: number; spread?: number}> = ({
  frame: f,
  count = 14,
  originX = -100,
  originY = 1100,
  targetX = 1200,
  targetY = 700,
  spread = 420,
}) => (
  <g>
    {Array.from({length: count}).map((_, i) => {
      const seed = i * 137;
      const speed = 0.55 + ((seed % 13) / 13) * 0.7;
      const t = ((f * speed + seed) % 260) / 260;
      const px = originX + (targetX - originX) * t;
      const arc = -Math.sin(t * Math.PI) * (140 + (seed % spread));
      const py = originY + (targetY - originY) * t + arc + ((seed % 60) - 30);
      const rot = (f * (2 + (seed % 5)) + seed) % 360;
      const s = 0.7 + ((seed % 7) / 7) * 0.7;
      return (
        <g key={i} transform={`translate(${px},${py}) rotate(${rot}) scale(${s})`} opacity={0.95}>
          <rect x={-22} y={-30} width={44} height={60} rx={4} fill="#f4efe4" stroke={INK} strokeWidth={4} />
          <line x1={-12} y1={-14} x2={12} y2={-14} stroke={INK} strokeWidth={3} opacity={0.6} />
          <line x1={-12} y1={-2} x2={12} y2={-2} stroke={INK} strokeWidth={3} opacity={0.6} />
          <line x1={-12} y1={10} x2={6} y2={10} stroke={INK} strokeWidth={3} opacity={0.6} />
        </g>
      );
    })}
  </g>
);

// SmellRings — 2026-07-20 NET-NEW FX. Radial VOC/smoke "smell" rings emanating
// from a sensor's detection point (the Silvanet-network beat): concentric rings
// expand + fade outward, carrying the invisible-detection idea as a visible pulse
// (radial-emanate motion). `progress` 0..1 drives the wave; `hot` tints them toward
// the ember/detection color. Cheap: a handful of stroked circles, deterministic in f.
export const SmellRings: React.FC<{cx: number; cy: number; frame: number; color?: string; count?: number; maxR?: number; intensity?: number}> = ({
  cx, cy, frame: f, color = '#FF7F6B', count = 4, maxR = 360, intensity = 1,
}) => (
  <g opacity={intensity}>
    {Array.from({length: count}).map((_, i) => {
      const phase = ((f / 26) + i / count) % 1;      // each ring offset around the cycle
      const r = 24 + phase * maxR;
      const op = Math.max(0, (1 - phase)) * 0.7;
      const w = 8 * (1 - phase) + 2;
      return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={w} opacity={op * intensity} />;
    })}
    {/* the detecting node core, gently throbbing */}
    <circle cx={cx} cy={cy} r={10 + 3 * Math.sin(f / 6)} fill={color} stroke={INK} strokeWidth={4} opacity={0.9 * intensity} />
  </g>
);

// ScanReticle — 2026-07-20 NET-NEW FX. A thermal-lock targeting reticle for the
// drone's IR vision: rotating corner brackets that SNAP inward and clamp onto a
// target, with a crosshair + a "LOCK" tick. `lock` 0..1 drives the snap (0 = wide
// open + spinning, 1 = clamped tight + steady). Pair with an ImpactStar at lock.
export const ScanReticle: React.FC<{cx: number; cy: number; frame: number; lock?: number; color?: string; size?: number}> = ({
  cx, cy, frame: f, lock = 0, color = '#FFE24A', size = 150,
}) => {
  const k = Math.max(0, Math.min(1, lock));
  const gap = size * (1.0 - 0.55 * k);          // brackets clamp inward as lock rises
  const spin = (1 - k) * ((f * 3) % 360);        // spins while searching, steadies on lock
  const b = size * 0.34;                          // bracket arm length
  const corner = (sx: number, sy: number) => (
    <path d={`M${sx * gap},${sy * gap - sy * b} L${sx * gap},${sy * gap} L${sx * gap - sx * b},${sy * gap}`}
      fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
  );
  return (
    <g transform={`translate(${cx},${cy}) rotate(${spin})`} opacity={0.5 + 0.5 * k}>
      {corner(1, 1)}{corner(-1, 1)}{corner(1, -1)}{corner(-1, -1)}
      {/* crosshair */}
      <line x1={-size * 0.18} y1={0} x2={size * 0.18} y2={0} stroke={color} strokeWidth={3} opacity={0.8} />
      <line x1={0} y1={-size * 0.18} x2={0} y2={size * 0.18} stroke={color} strokeWidth={3} opacity={0.8} />
      <circle r={size * 0.1} fill="none" stroke={color} strokeWidth={3} opacity={0.5 + 0.5 * k} />
    </g>
  );
};

// Darkened-corner vignette that slams in with a dramatic zoom.
export const ZoomVignette: React.FC<{amount: number}> = ({amount}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      boxShadow: `inset 0 0 ${220 * amount}px ${90 * amount}px rgba(8,10,20,${0.75 * amount})`,
    }}
  />
);
