import React from 'react';
import {INK, ICE, SNOW, RED} from './kit';

// =============================================================================
// PROPS — the generalized physical-prop kit (asset-library session #2,
// 2026-07-20d). These began as episode-locals (07-18 land giveaway, 07-19
// turbine) with story copy hardcoded; promoted here with every label/line a
// param so any run can cast them. Same conventions as fauna/vehicles: local
// coords, base near y=0, caller passes frame f where the prop animates.
// Text-bearing props take their copy as props — a prop with baked-in story
// text is an episode-local, not a library asset.
// =============================================================================

const BOLD = 'Arial Black, Arial, sans-serif';
const WOOD = '#8a6239';
const WOOD_D = '#5c4326';
const BIRCH = '#efe6d0';
const MOSS = '#6b7a4a';
const CRIMSON = '#c0392b';
const GRAPHITE_D = '#232c34';

// A big loud stat chip: one number/phrase, optional sub line.
export const StatCard: React.FC<{x: number; y: number; big: string; sub?: string; op?: number; scale?: number; color?: string}> = ({x, y, big, sub, op = 1, scale = 1, color = CRIMSON}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`} opacity={op}>
    <rect x={-260} y={-64} width={520} height={sub ? 128 : 96} rx={16} fill={color} stroke={INK} strokeWidth={8} />
    <text x={0} y={sub ? -12 : big.length > 10 ? 10 : 16} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={sub ? 58 : 46} fill={SNOW} letterSpacing={1} stroke={INK} strokeWidth={2.5} paintOrder="stroke">{big}</text>
    {sub && <text x={0} y={38} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={SNOW} opacity={0.9}>{sub}</text>}
  </g>
);

// A small identity plate (institution, place, person).
export const Nameplate: React.FC<{x: number; y: number; text: string; sub?: string; op?: number; subColor?: string}> = ({x, y, text, sub, op = 1, subColor = '#e0921a'}) => (
  <g transform={`translate(${x},${y})`} opacity={op}>
    <rect x={-150} y={-40} width={300} height={sub ? 88 : 60} rx={10} fill={ICE} stroke={INK} strokeWidth={6} />
    <text x={0} y={sub ? -8 : 10} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={36} fill={INK} letterSpacing={1.5} stroke={ICE} strokeWidth={3} paintOrder="stroke">{text}</text>
    {sub && <text x={0} y={30} textAnchor="middle" fontFamily={BOLD} fontWeight={700} fontSize={20} fill={subColor}>{sub}</text>}
  </g>
);

// A hanging sign swinging on its post. 1-3 lines; last line can be dimmed as a
// date/attribution via `dimLast`.
export const SwingSign: React.FC<{x: number; y: number; f: number; lines: string[]; op?: number; dimLast?: boolean}> = ({x, y, f, lines, op = 1, dimLast = false}) => {
  const swing = 6 * Math.sin(f / 18);
  const hh = 28 + lines.length * 30;
  return (
    <g transform={`translate(${x},${y})`} opacity={op}>
      <line x1={0} y1={-60} x2={0} y2={-10} stroke={INK} strokeWidth={5} />
      {/* pivot at the post tip (the episode version set a CSS transformOrigin in
          page px inside a translated group, which double-offset the pivot) */}
      <g transform={`rotate(${swing} 0 -60)`}>
        <rect x={-190} y={-10} width={380} height={hh} rx={10} fill={BIRCH} stroke={INK} strokeWidth={6} />
        {lines.map((ln, i) => (
          <text key={i} x={0} y={20 + i * 30} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={24}
            fill={dimLast && i === lines.length - 1 ? '#8a8274' : GRAPHITE_D}
            textLength={ln.length > 23 ? 360 : undefined} lengthAdjust="spacingAndGlyphs">{ln}</text>
        ))}
      </g>
    </g>
  );
};

// An industrial lever on a panel; `pulled` 0..1 throws it, optional denial
// badge (X + label) fades in as it lands.
export const GearLever: React.FC<{x: number; y: number; pulled: number; deniedLabel?: string}> = ({x, y, pulled, deniedLabel}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-80} y={-12} width={160} height={50} rx={12} fill="#8b93a0" stroke={INK} strokeWidth={6} />
    <circle cx={-46} cy={14} r={11} fill={GRAPHITE_D} stroke={INK} strokeWidth={4} />
    <g transform={`rotate(${-40 + 40 * pulled} -46 14)`}>
      <rect x={-53} y={-4} width={13} height={78} rx={6.5} fill="#c9cfd8" stroke={INK} strokeWidth={5} />
      <circle cx={-46} cy={-6} r={14} fill={RED} stroke={INK} strokeWidth={5} />
    </g>
    {deniedLabel && (
      <g transform="translate(56,-52)" opacity={pulled}>
        <circle r={26} fill={ICE} stroke={INK} strokeWidth={6} />
        <line x1={-14} y1={-14} x2={14} y2={14} stroke={CRIMSON} strokeWidth={6} strokeLinecap="round" />
        <line x1={14} y1={-14} x2={-14} y2={14} stroke={CRIMSON} strokeWidth={6} strokeLinecap="round" />
        <text x={0} y={44} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={INK} stroke={ICE} strokeWidth={4} paintOrder="stroke">{deniedLabel}</text>
      </g>
    )}
  </g>
);

// A driven survey stake; `settle` 0..1 drops it in. Optional red claim tag.
export const SurveyStake: React.FC<{x: number; y: number; s?: number; settle: number; tag?: boolean}> = ({x, y, s = 1, settle, tag = true}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={48} ry={10} fill={INK} opacity={0.25} />
    <g transform={`translate(0,${-40 * (1 - settle)})`} opacity={Math.min(1, settle * 1.6)}>
      <path d="M-14,0 L-14,-160 L0,-186 L14,-160 L14,0 Z" fill={WOOD} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M4,-160 L14,-160 L14,0 L4,0 Z" fill={WOOD_D} opacity={0.7} />
      {[-40, -80, -120].map((yy, i) => <line key={i} x1={-14} y1={yy} x2={14} y2={yy} stroke={INK} strokeWidth={2.5} opacity={0.35} />)}
      {tag && <rect x={-20} y={-210} width={40} height={40} rx={4} fill={CRIMSON} stroke={INK} strokeWidth={5} />}
    </g>
  </g>
);

// A surveyor's chain paying out between two points; `taut` 0..1 (sags until
// taut), the distance tag flips up past 0.5.
export const MeasuringChain: React.FC<{x1: number; y1: number; x2: number; y2: number; taut: number; label?: string}> = ({x1, y1, x2, y2, taut, label}) => {
  const n = 18;
  const links: React.ReactNode[] = [];
  for (let i = 0; i < n * taut; i++) {
    const t = i / n;
    const sag = (1 - taut) * 30 * Math.sin(t * Math.PI);
    links.push(<circle key={i} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t + sag} r={7} fill="none" stroke="#9aa2ad" strokeWidth={4} />);
  }
  const tagT = Math.min(1, taut * 1.2);
  return (
    <g>
      {links}
      {label && tagT > 0.5 && (
        <g transform={`translate(${x1 + (x2 - x1) * 0.5},${y1 + (y2 - y1) * 0.5 + 6}) rotate(${4 * Math.sin(tagT * 8)})`} opacity={tagT}>
          <path d="M-30,-4 L0,-24 L30,-4 L18,30 L-18,30 Z" fill={CRIMSON} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <text x={0} y={14} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill={SNOW} stroke={INK} strokeWidth={2} paintOrder="stroke">{label}</text>
        </g>
      )}
    </g>
  );
};

// A pen hovering over a document, trembling, never signing — the unsigned-deal
// image. Optional nameplate names the party.
export const PenAndDocument: React.FC<{x: number; y: number; hover: number; f: number; plate?: string}> = ({x, y, hover, f, plate}) => {
  const tremble = 1.4 * Math.sin(f / 3);
  const settle = Math.min(1, hover * 1.4);
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-130} y={0} width={260} height={180} rx={8} fill={SNOW} stroke={INK} strokeWidth={6} />
      <path d="M-130,0 h260 v14 h-260 Z" fill="#e7e0cc" opacity={0.6} />
      {[36, 62, 88, 114, 140, 160].map((yy, i) => <line key={i} x1={-100} y1={yy} x2={100} y2={yy} stroke="#c9c2ad" strokeWidth={3} />)}
      <g transform={`translate(${18 + tremble},${-26}) scale(${settle}) rotate(-28)`} opacity={settle}>
        <path d="M-7,0 L-7,-118 L7,-118 L7,0 Z" fill="#2b2f38" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M0,-118 L-9,-138 L9,-138 Z" fill="#c9cfd8" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <rect x={-7} y={-30} width={14} height={22} fill={CRIMSON} opacity={0.9} />
        <line x1={0} y1={0} x2={0} y2={26} stroke={INK} strokeWidth={2} strokeDasharray="3 4" opacity={0.35} />
      </g>
      {plate && <Nameplate x={280} y={40} text={plate} op={0.95} />}
    </g>
  );
};

// A trail marker post with a two-line sign (e.g. a date: "AUG" / "19").
export const TrailPost: React.FC<{x: number; y: number; s?: number; top?: string; bottom?: string}> = ({x, y, s = 1, top, bottom}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={44} ry={9} fill={INK} opacity={0.25} />
    <path d="M-16,0 L-16,-220 L16,-220 L16,0 Z" fill={WOOD} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M4,-220 L16,-220 L16,0 L4,0 Z" fill={WOOD_D} opacity={0.7} />
    <path d="M-16,-40 q16,-10 32,0" stroke={MOSS} strokeWidth={10} fill="none" opacity={0.8} />
    {(top || bottom) && <rect x={-34} y={-198} width={68} height={64} rx={6} fill={BIRCH} stroke={INK} strokeWidth={5} />}
    {top && <text x={0} y={-174} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill={GRAPHITE_D} stroke={BIRCH} strokeWidth={3} paintOrder="stroke">{top}</text>}
    {bottom && <text x={0} y={-144} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={34} fill={GRAPHITE_D} stroke={BIRCH} strokeWidth={3} paintOrder="stroke">{bottom}</text>}
  </g>
);

// A glowing boundary tracing itself in (`revealT` 0..1) around any closed path,
// with an optional labeled town marker inside. `d` MUST be a closed path;
// `perim` is its approximate length (drives the dash reveal).
export const BoundaryReveal: React.FC<{revealT: number; d: string; perim?: number; accent?: string; town?: {x: number; y: number; label: string}}> = ({revealT, d, perim = 2600, accent = '#ffb531', town}) => (
  <g>
    <path d={d} fill="none" stroke={INK} strokeWidth={14} strokeDasharray={perim} strokeDashoffset={perim * (1 - revealT)} strokeLinejoin="round" />
    <path d={d} fill={accent} opacity={0.14 * revealT} />
    <path d={d} fill="none" stroke={accent} strokeWidth={7} strokeDasharray={perim} strokeDashoffset={perim * (1 - revealT)} strokeLinejoin="round" />
    {town && revealT > 0.3 && (
      <g transform={`translate(${town.x},${town.y})`} opacity={Math.min(1, (revealT - 0.3) * 2)}>
        <rect x={-30} y={-18} width={60} height={36} rx={4} fill={BIRCH} stroke={INK} strokeWidth={4} />
        <path d="M-34,-18 L0,-38 L34,-18 Z" fill={CRIMSON} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <text x={0} y={54} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill={INK} stroke={SNOW} strokeWidth={3} paintOrder="stroke">{town.label}</text>
      </g>
    )}
  </g>
);
