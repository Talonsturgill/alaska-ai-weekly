import React from 'react';

// =============================================================================
// FISHCRAFT — the shared fish-realism engine (2026-07-21 fish-mastery session).
// Owner directive: "master the fish artwork... depth and shine and better
// motion graphics; don't settle." Implements the researched spec (sources in
// docs/craft/FISHCRAFT.md): chrome sheen as a layer stack (countershade ramp,
// spine-following specular band, hard waterline glint, iridescence, belly
// bounce), shingle-scale pattern with a region mask, carangiform swim (a
// traveling body wave whose amplitude grows tailward with linear head-to-tail
// phase lag, per PNAS 2021), tail heave+pitch coupling (the figure-8 emerges),
// asymmetric gill pulse, head counter-yaw, buoyancy bob on irrational periods,
// and translucent rippling fin membranes with ray lines.
// Species components in fauna.tsx compose these; each supplies its own body
// profile, skin colors, markings, and head. House style stays: thick ink
// outline around the silhouette, cartoon eye, but the SURFACE is realism-lit.
// =============================================================================

export const FINK = '#101423';

// ---------------------------------------------------------------- the spine
export interface SpineCfg {
  len: number;            // nose-to-tailbase length in local px
  nose: number;           // nose x (tail base at nose-len)
  T?: number;             // tailbeat period, seconds (salmon cruise ~0.5)
  fps?: number;
  swim?: number;          // 0 hold-in-current .. 1 full travel
  ampBL?: number;         // tail amplitude as fraction of len (default 0.10 cartoon-safe)
  lambda?: number;        // body wavelengths on the fish (~1.0 carangiform)
}

export interface Spine {
  sx: (u: number) => number;
  sway: (u: number) => number;      // lateral offset (screen y) at u
  slope: (u: number) => number;     // local sway slope in degrees-ish
  tailAngle: number;                // caudal pitch (lags heave by ~90deg)
  yaw: number;                      // whole-body counter-yaw, degrees
  bobY: number;                     // buoyancy bob offset
  roll: number;                     // slow roll, degrees
  gill: number;                     // 0..1 asymmetric breath pulse
  pecAngle: number;                 // pectoral scull angle, degrees
  phase: number;                    // master wave phase (for sheen coupling)
}

export function makeSpine(f: number, cfg: SpineCfg): Spine {
  const {len, nose, T = 0.5, fps = 30, swim = 1, ampBL = 0.1, lambda = 1.0} = cfg;
  const sw = Math.max(0, Math.min(1, swim));
  const phase = (2 * Math.PI * f) / (fps * (T + 0.35 * (1 - sw)));
  // A(s): small at head, growing ~s^2 tailward (PNAS: ~0.03 -> ~0.3 BL; we run
  // a gentler cartoon envelope so the ink silhouette stays readable)
  const A = (u: number) => len * ampBL * (0.08 + 0.92 * u * u) * (0.25 + 0.75 * sw);
  const sway = (u: number) => A(u) * Math.sin((2 * Math.PI * u) / lambda - phase);
  const slope = (u: number) =>
    (sway(Math.min(1, u + 0.05)) - sway(Math.max(0, u - 0.05))) * (1.3 / (len * 0.1));
  return {
    sx: (u) => nose - len * u,
    sway,
    slope: (u) => slope(u) * 60,
    tailAngle: (16 + 14 * sw) * Math.sin(phase - Math.PI / 2) * -1,
    yaw: 2.6 * Math.sin(phase + Math.PI) * sw,
    bobY: len * 0.014 * Math.sin((2 * Math.PI * f) / (fps * 2.4)),
    roll: 1.4 * Math.sin((2 * Math.PI * f) / (fps * 3.1) + 0.8),
    gill: Math.max(0, Math.sin((2 * Math.PI * f) / (fps * 0.9))),
    pecAngle: 8 * Math.sin((2 * Math.PI * f) / (fps * 1.8) + 0.6),
    phase,
  };
}

// smooth a point list into a quadratic-through-midpoints path
export function smoothPath(pts: Array<[number, number]>, close = false): string {
  if (!pts.length) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0]},${pts[i][1]} ${mx},${my}`;
  }
  const L = pts[pts.length - 1];
  d += ` L${L[0]},${L[1]}`;
  return close ? d + ' Z' : d;
}

// build body outline + reusable sampled rails from a spine + depth profiles
export function bodyGeom(sp: Spine, dTop: (u: number) => number, dBot: (u: number) => number, N = 14) {
  const top: Array<[number, number]> = [];
  const bot: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    top.push([sp.sx(u), sp.sway(u) - dTop(u)]);
    bot.push([sp.sx(u), sp.sway(u) + dBot(u)]);
  }
  const rail = (v: number, u0 = 0, u1 = 1): Array<[number, number]> =>
    Array.from({length: N + 1}, (_, i) => {
      const u = u0 + ((u1 - u0) * i) / N;
      const yTop = sp.sway(u) - dTop(u);
      const yBot = sp.sway(u) + dBot(u);
      return [sp.sx(u), yTop + (yBot - yTop) * v];
    });
  // ONE closed subpath. Two concatenated open subpaths (the old form) each
  // auto-close with a straight chord: phantom lines + an unfilled wedge.
  const outline = smoothPath([...top, ...[...bot].reverse()], true);
  return {top, bot, rail, outline};
}

// ---------------------------------------------------------------- skins
export interface FishSkin {
  back: string;        // dark dorsal
  shoulder: string;    // upper flank
  flank: string;       // bright mid (the mirror)
  preBelly: string;
  belly: string;
  irid1?: string;      // iridescence hues (gill puddle)
  irid2?: string;
  irid3?: string;
  scaleEdge?: string;  // scale shadow tint
  sheenGain?: number;  // 0..1 overall specular strength (chrome fish ~1)
  scaleAmp?: number;   // 0..1 scale visibility
}

export const CHROME_SKIN: FishSkin = {
  back: '#24404f', shoulder: '#5f7688', flank: '#cfdae0', preBelly: '#eef3f5', belly: '#fbfdfe',
  irid1: '#39d0c8', irid2: '#5a7bf0', irid3: '#e56ab0',
  scaleEdge: '#0a1a24', sheenGain: 1, scaleAmp: 0.55,
};

// ---------------------------------------------------------------- defs + layers
// All-in-one: gradient defs, clip, countershaded body, scale field, form
// shadow, specular band + glint, iridescence, belly bounce, rim, caustics.
// Children render OVER the sheen inside the clip (markings), siblings outside.
export const FishSurface: React.FC<{
  uid: string;
  sp: Spine;
  dTop: (u: number) => number;
  dBot: (u: number) => number;
  skin: FishSkin;
  caustics?: boolean;
  outlineW?: number;
  children?: React.ReactNode;   // markings, clipped to the body
}> = ({uid, sp, dTop, dBot, skin, caustics = false, outlineW = 6, children}) => {
  const g = bodyGeom(sp, dTop, dBot);
  const gain = skin.sheenGain ?? 1;
  const scaleAmp = skin.scaleAmp ?? 0.5;
  // spine-following bands (the specular ribbon lives ~22-40% down from the top).
  // Sub-ranged: real chrome dies out over the caudal wrist; a full-length band
  // reads as a white rod skewering the peduncle (v7 taste-loop finding).
  const specTop = smoothPath(g.rail(0.2, 0.08, 0.8));
  const specMid = smoothPath(g.rail(0.3, 0.06, 0.88));
  const glint = smoothPath(g.rail(0.26, 0.1, 0.72));
  // iridescence puddle drifts with yaw (grazing-angle behavior)
  const iridX = sp.sx(0.16) + 6 * Math.sin(sp.phase * 0.5);
  return (
    <g>
      <defs>
        <clipPath id={`${uid}_clip`}><path d={g.outline} /></clipPath>
        <linearGradient id={`${uid}_formshadow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1420" stopOpacity={0} />
          <stop offset="0.5" stopColor="#0a1420" stopOpacity={0.11} />
          <stop offset="0.8" stopColor="#0a1420" stopOpacity={0.05} />
          <stop offset="1" stopColor="#0a1420" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${uid}_counter`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skin.back} />
          <stop offset="0.34" stopColor={skin.shoulder} />
          <stop offset="0.52" stopColor={skin.flank} />
          <stop offset="0.74" stopColor={skin.preBelly} />
          <stop offset="1" stopColor={skin.belly} />
        </linearGradient>
        <radialGradient id={`${uid}_irid`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={skin.irid1 ?? '#39d0c8'} stopOpacity={0.5 * gain} />
          <stop offset="0.5" stopColor={skin.irid2 ?? '#5a7bf0'} stopOpacity={0.32 * gain} />
          <stop offset="0.8" stopColor={skin.irid3 ?? '#e56ab0'} stopOpacity={0.26 * gain} />
          <stop offset="1" stopColor={skin.irid3 ?? '#e56ab0'} stopOpacity={0} />
        </radialGradient>
        <pattern id={`${uid}_scales`} width="13" height="10" patternUnits="userSpaceOnUse"
          patternTransform="skewX(-7)">
          <path d="M0,5 a6.5,5 0 0 1 13,0" fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.5} />
          <path d="M1,5.6 a5.5,4 0 0 0 11,0" fill="none" stroke={skin.scaleEdge ?? '#0a1a24'} strokeWidth={1} opacity={0.35} />
          <g transform="translate(6.5,5)">
            <path d="M0,5 a6.5,5 0 0 1 13,0" fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.5} />
            <path d="M1,5.6 a5.5,4 0 0 0 11,0" fill="none" stroke={skin.scaleEdge ?? '#0a1a24'} strokeWidth={1} opacity={0.35} />
          </g>
        </pattern>
        <linearGradient id={`${uid}_scalemask`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.25} />
          <stop offset="0.3" stopColor="#fff" stopOpacity={0.15} />
          <stop offset="0.55" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.85" stopColor="#fff" stopOpacity={0.2} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${uid}_smask`}><path d={g.outline} fill={`url(#${uid}_scalemask)`} /></mask>
        <filter id={`${uid}_soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <linearGradient id={`${uid}_specfade`} gradientUnits="userSpaceOnUse"
          x1={sp.sx(0)} y1={0} x2={sp.sx(1)} y2={0}>
          <stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="0.14" stopColor="#ffffff" stopOpacity={1} />
          <stop offset="0.58" stopColor="#ffffff" stopOpacity={0.8} />
          <stop offset="0.9" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* L1: countershaded body inside the ink silhouette */}
      <path d={g.outline} fill={`url(#${uid}_counter)`} stroke={FINK} strokeWidth={outlineW} strokeLinejoin="round" />
      <g clipPath={`url(#${uid}_clip)`}>
        {/* scales: shingle lattice, masked to whisper except the raking mid-flank */}
        <g mask={`url(#${uid}_smask)`} opacity={scaleAmp}>
          <path d={g.outline} fill={`url(#${uid}_scales)`} />
        </g>
        {/* form shadow: a filled lower-flank band with its own soft vertical
            gradient (a stroke+filter here rendered as a hard bar; fills are safe) */}
        <path d={smoothPath([...g.rail(0.64), ...[...g.rail(0.97)].reverse()], true)}
          fill={`url(#${uid}_formshadow)`} />
        {/* L2: soft specular band following the spine (screen = adds light);
            stroked with the head-to-tail fade so it never reaches the wrist */}
        <path d={specMid} fill="none" stroke={`url(#${uid}_specfade)`} strokeWidth={dTop(0.45) * 0.62}
          opacity={0.34 * gain} strokeLinecap="round" style={{mixBlendMode: 'screen'} as any} filter={`url(#${uid}_soft)`} />
        {/* L3: the hard waterline glint (crisp vs the soft band = wet metal) */}
        <path d={glint} fill="none" stroke={`url(#${uid}_specfade)`} strokeWidth={3.2}
          opacity={0.8 * gain} strokeLinecap="round" style={{mixBlendMode: 'screen'} as any} />
        <path d={specTop} fill="none" stroke={`url(#${uid}_specfade)`} strokeWidth={1.8}
          opacity={0.35 * gain} strokeLinecap="round" style={{mixBlendMode: 'screen'} as any} />
        {/* L4: iridescent film over the gill/shoulder, drifting with yaw
            (kept OFF the belly: low placement read as a bruise in look-dev) */}
        <ellipse cx={iridX} cy={sp.sway(0.16) - dTop(0.3) * 0.25} rx={dTop(0.3) * 2.1} ry={dTop(0.3) * 1.05}
          fill={`url(#${uid}_irid)`} style={{mixBlendMode: 'overlay'} as any} />
        {/* L5: warm belly bounce light */}
        <path d={smoothPath(g.rail(0.94))} fill="none" stroke="#fff6e8" strokeWidth={dBot(0.5) * 0.5}
          opacity={0.35} strokeLinecap="round" style={{mixBlendMode: 'soft-light'} as any} filter={`url(#${uid}_soft)`} />
        {/* caustic dapples: the underwater seller */}
        {caustics && [0, 1, 2, 3, 4].map((i) => {
          const cx = sp.sx(0.12 + i * 0.2) + 14 * Math.sin(sp.phase * 0.35 + i * 1.7);
          const cy = sp.sway(0.12 + i * 0.2) - dTop(0.12 + i * 0.2) * 0.2 + 8 * Math.sin(sp.phase * 0.22 + i);
          const sxx = 1 + 0.3 * Math.sin(sp.phase * 0.3 + i * 2.1);
          return (
            <ellipse key={i} cx={cx} cy={cy} rx={16 * sxx} ry={9 / sxx}
              fill="#ffffff" opacity={0.16} style={{mixBlendMode: 'screen'} as any} filter={`url(#${uid}_soft)`} />
          );
        })}
        {/* species markings render inside the clip, over the sheen */}
        {children}
      </g>
      {/* rim/backlight along the dorsal edge (outside clip so it kisses the ink) */}
      <path d={smoothPath(g.top)} fill="none" stroke="#eef6ff" strokeWidth={2.6}
        opacity={0.55 * gain} strokeLinecap="round" style={{mixBlendMode: 'screen'} as any} />
    </g>
  );
};

// ---------------------------------------------------------------- fins
// Translucent membrane with ray lines, a bright trailing edge, and a rippling
// margin that lags its root (finEdge wave). AO smudge glues it to the body.
export const FinMembrane: React.FC<{
  x: number; y: number; rot: number; f: number;
  length: number; depth: number;      // root chord along the body; membrane drop
  color: string; dark: string;
  rays?: number; phase?: number; sweep?: number;  // sweep: how far the tip trails aft (0..1)
  opacity?: number;
}> = ({x, y, rot, f, length, depth, color, dark, rays = 4, phase = 0, sweep = 0.6, opacity = 0.94}) => {
  // fan: root-front (0,0) -> tip (aft+down) -> rippled trailing edge -> root-aft
  const tipX = length * (0.35 + 0.5 * sweep);
  const tipY = depth;
  const wob = (u: number) => depth * 0.12 * Math.sin(2 * Math.PI * u - f / 3.4 - phase) * (0.3 + 0.7 * u);
  const edge: Array<[number, number]> = Array.from({length: 5}, (_, i) => {
    const u = i / 4; // tip -> root-aft
    return [tipX + (length - tipX) * u, tipY * (1 - u * 0.82) + wob(1 - u)];
  });
  const d = `M0,0 Q${tipX * 0.3},${tipY * 0.65} ${tipX},${tipY} ${smoothPath(edge)} L${length},${depth * 0.16} Q${length * 0.5},${-2} 0,0 Z`;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <ellipse cx={length * 0.4} cy={1} rx={length * 0.42} ry={3.5} fill="#000" opacity={0.16} />
      <path d={d} fill={color} stroke={FINK} strokeWidth={3.5} strokeLinejoin="round" opacity={opacity} />
      {Array.from({length: rays}).map((_, i) => {
        const u = (i + 1) / (rays + 1);
        return <line key={i} x1={length * 0.3 * u} y1={1} x2={tipX + (length - tipX) * (1 - u) * 0.5} y2={tipY * (0.4 + 0.6 * (1 - u * 0.6))}
          stroke={dark} strokeWidth={1.5} opacity={0.5} />;
      })}
      <path d={smoothPath(edge)} fill="none" stroke="#ffffff" strokeWidth={1.8}
        opacity={0.4} style={{mixBlendMode: 'screen'} as any} />
    </g>
  );
};
