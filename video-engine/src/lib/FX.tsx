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
