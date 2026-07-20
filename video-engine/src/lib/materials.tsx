import React from 'react';

// =============================================================================
// MATERIALS — surfaces that read as SUBSTANCES, not flat fills (Stage3D backlog
// item (d), 2026-07-20d). A vocabulary of deterministic SVG patterns overlaid
// on any silhouette: draw the base shape with its lit color, then re-draw the
// SAME path with fill={matFill('tarmac')} and the surface reads as a material.
// All texture is generated from seeded integer loops — no Math.random (banned
// for Remotion determinism).
//
// Usage:
//   <MaterialDefs />                      // once per <svg>, emits the patterns
//   <path d={d} fill={t.core} />          // the lit base
//   <path d={d} fill={matFill('bark')} /> // the substance overlay
//
// In Stage3D Extrude render callbacks: front faces take any material overlay;
// side slices usually stay flat-shaded (the light model carries them), but a
// low-opacity overlay on the first 2-3 slices sells thickness on close-ups.
// =============================================================================

export type MaterialName =
  | 'brushedMetal' | 'tarmac' | 'bark' | 'planks'
  | 'granite' | 'snowpack' | 'ice' | 'corrugated';

export const matFill = (m: MaterialName) => `url(#mat-${m})`;

// deterministic pseudo-random in [0,1) from integer seeds. The multiply is
// followed by an xorshift-style fold BEFORE the modulo: a bare (i*C)%1000 left
// low-order correlation that rendered as a visible diagonal lattice in the
// tarmac/granite speckle (taste pass 1).
const pr = (i: number, k: number) => {
  // Math.imul keeps the multiplies in 32-bit space: a bare `h * bigC >>> 0`
  // exceeds float53 precision and the low bits collapse (granite/ice went
  // blank in taste pass 2).
  let h = (Math.imul(i, 2654435761) + Math.imul(k, 40503)) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 11;
  return (h % 1000) / 1000;
};

export const MaterialDefs: React.FC = () => (
  <defs>
    {/* BRUSHED METAL: fine horizontal grain, occasional bright strand */}
    <pattern id="mat-brushedMetal" width={64} height={22} patternUnits="userSpaceOnUse">
      {Array.from({length: 11}).map((_, i) => (
        <rect key={i} x={0} y={i * 2} width={64} height={1}
          fill={pr(i, 7) > 0.82 ? '#ffffff' : i % 2 ? '#ffffff' : '#0a1020'}
          opacity={pr(i, 7) > 0.82 ? 0.22 : i % 2 ? 0.07 : 0.08} />
      ))}
    </pattern>
    {/* TARMAC: coarse aggregate speckle + faint seam cracks */}
    <pattern id="mat-tarmac" width={90} height={90} patternUnits="userSpaceOnUse">
      {Array.from({length: 52}).map((_, i) => (
        <circle key={i} cx={pr(i, 1) * 90} cy={pr(i, 2) * 90} r={1 + pr(i, 3) * 2.2}
          fill={pr(i, 4) > 0.5 ? '#ffffff' : '#000000'} opacity={pr(i, 4) > 0.5 ? 0.2 : 0.3} />
      ))}
      <path d={`M8,64 q22,6 34,22 M60,10 q8,18 24,26`} fill="none" stroke="#000" strokeWidth={1.2} opacity={0.14} />
    </pattern>
    {/* SPRUCE BARK: vertical broken ridges */}
    <pattern id="mat-bark" width={46} height={80} patternUnits="userSpaceOnUse">
      {Array.from({length: 9}).map((_, i) => {
        const x = 3 + i * 5.2 + pr(i, 5) * 2;
        const y0 = pr(i, 6) * 30;
        return (
          <path key={i} d={`M${x},${y0} q${1.5 - pr(i, 8) * 3},${16 + pr(i, 9) * 18} 0,${34 + pr(i, 10) * 24}`}
            fill="none" stroke="#000" strokeWidth={1.6 + pr(i, 11)} opacity={0.2} strokeLinecap="round" />
        );
      })}
      {Array.from({length: 4}).map((_, i) => (
        <path key={`h${i}`} d={`M${4 + pr(i, 12) * 30},${16 + i * 18} q6,2 10,0`} fill="none" stroke="#fff" strokeWidth={1} opacity={0.09} />
      ))}
    </pattern>
    {/* WOOD PLANKS: boards, seams, knots */}
    <pattern id="mat-planks" width={120} height={56} patternUnits="userSpaceOnUse">
      {[0, 28].map((y, r) => (
        <g key={r}>
          <rect x={0} y={y} width={120} height={1.6} fill="#000" opacity={0.22} />
          <rect x={r ? 66 : 22} y={y + 2} width={1.4} height={24} fill="#000" opacity={0.18} />
          {Array.from({length: 3}).map((_, i) => (
            <path key={i} d={`M${8 + i * 38 + r * 14},${y + 8 + pr(i + r, 13) * 10} q14,${2 - pr(i, 14) * 4} 26,0`}
              fill="none" stroke="#000" strokeWidth={0.9} opacity={0.12} />
          ))}
          <ellipse cx={r ? 30 : 92} cy={y + 15} rx={3.2} ry={2.1} fill="none" stroke="#000" strokeWidth={1} opacity={0.2} />
        </g>
      ))}
    </pattern>
    {/* GRANITE: multi-tone mineral speckle */}
    <pattern id="mat-granite" width={70} height={70} patternUnits="userSpaceOnUse">
      {Array.from({length: 60}).map((_, i) => (
        <circle key={i} cx={pr(i, 15) * 70} cy={pr(i, 16) * 70} r={0.9 + pr(i, 17) * 2}
          fill={pr(i, 18) > 0.66 ? '#ffffff' : pr(i, 18) > 0.33 ? '#000000' : '#b88a5a'}
          opacity={pr(i, 18) > 0.66 ? 0.28 : 0.22} />
      ))}
    </pattern>
    {/* SNOWPACK: sparse sparkle + wind-drift striae */}
    <pattern id="mat-snowpack" width={110} height={70} patternUnits="userSpaceOnUse">
      {Array.from({length: 10}).map((_, i) => (
        <circle key={i} cx={pr(i, 19) * 110} cy={pr(i, 20) * 70} r={0.9} fill="#ffffff" opacity={0.5} />
      ))}
      {Array.from({length: 4}).map((_, i) => (
        <path key={`d${i}`} d={`M${pr(i, 21) * 60},${12 + i * 16} q26,${3 - pr(i, 22) * 6} 48,0`}
          fill="none" stroke="#5a7ba8" strokeWidth={1.1} opacity={0.13} strokeLinecap="round" />
      ))}
    </pattern>
    {/* GLACIAL ICE: diagonal facet streaks + bright fractures */}
    <pattern id="mat-ice" width={84} height={84} patternUnits="userSpaceOnUse">
      {Array.from({length: 10}).map((_, i) => (
        <path key={i} d={`M${pr(i, 23) * 60 - 10},${pr(i, 24) * 84} l${18 + pr(i, 25) * 22},${-(24 + pr(i, 26) * 20)}`}
          stroke={pr(i, 27) > 0.6 ? '#ffffff' : '#1a4a7a'} strokeWidth={pr(i, 27) > 0.6 ? 1.6 : 2.6}
          opacity={pr(i, 27) > 0.6 ? 0.5 : 0.25} strokeLinecap="round" />
      ))}
    </pattern>
    {/* CORRUGATED STEEL: vertical rib shading */}
    <pattern id="mat-corrugated" width={26} height={40} patternUnits="userSpaceOnUse">
      <rect x={0} y={0} width={5} height={40} fill="#fff" opacity={0.12} />
      <rect x={9} y={0} width={6} height={40} fill="#000" opacity={0.16} />
      <rect x={18} y={0} width={4} height={40} fill="#fff" opacity={0.07} />
    </pattern>
  </defs>
);

// Convenience: base + material in one call for simple rect/path surfaces.
export const Surface: React.FC<{d: string; base: string; material: MaterialName; opacity?: number}> = ({d, base, material, opacity = 1}) => (
  <g opacity={opacity}>
    <path d={d} fill={base} />
    <path d={d} fill={matFill(material)} />
  </g>
);
