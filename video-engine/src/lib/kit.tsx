import React from 'react';

// =============================================================================
// KIT — shared IGS-style drawing helpers for the Dispatch episode. Ink outlines,
// base+shade+highlight tones, characterized objects with faces. Everything here
// is reused across scenes so the cast + look stay continuous.
// =============================================================================

export const INK = '#101423';
export const RED = '#e8402f';
export const RED_D = '#b52c1e';
export const AMBER = '#ffb531';
export const AMBER_D = '#e0921a';
export const ICE = '#eef6ff';
export const SNOW = '#ffffff';
export const STEEL = '#5d7fae';
export const STEEL_D = '#43608c';
export const STEEL_L = '#7fa1cc';
export const LAND = '#3f7a54';
export const LAND_D = '#2e5c3f';
export const CYAN = '#37e0d8';

export const OUT = 7;

const BOLD = 'Arial Black, Arial, sans-serif';

// starburst polygon points
export function burst(cx: number, cy: number, spikes: number, r1: number, r2: number) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

// A shouty boxed label (the genre's caption card).
export const BoxLabel: React.FC<{
  x: number; y: number; text: string; w?: number; h?: number; fs?: number;
  fill?: string; color?: string; rot?: number; sub?: string;
}> = ({x, y, text, w = 320, h = 74, fs = 40, fill = ICE, color = INK, rot = 0, sub}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={11} fill={fill} stroke={INK} strokeWidth={7} />
    <text x={0} y={sub ? -4 : fs * 0.34} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={fs} fill={color} letterSpacing={1}>
      {text}
    </text>
    {sub && (
      <text x={0} y={h / 2 - 12} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={fs * 0.5} fill={color} opacity={0.8}>
        {sub}
      </text>
    )}
  </g>
);

// Starburst stat badge with a big number + label lines.
export const StatBurst: React.FC<{
  cx: number; cy: number; scale?: number; big: string; lines?: string[];
  fill?: string; rot?: number; big_fs?: number;
}> = ({cx, cy, scale = 1, big, lines = [], fill = AMBER, rot = 0, big_fs = 88}) => (
  <g transform={`translate(${cx},${cy}) scale(${scale}) rotate(${rot})`}>
    <polygon points={burst(0, 0, 14, 172, 132)} fill={fill} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <polygon points={burst(0, 0, 14, 146, 112)} fill="none" stroke={AMBER_D} strokeWidth={5} opacity={0.7} />
    <text x={0} y={lines.length ? -6 : big_fs * 0.34} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={big_fs} fill={INK}>
      {big}
    </text>
    {lines.map((t, i) => (
      <text key={i} x={0} y={34 + i * 34} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={28} fill={INK} letterSpacing={0.5}>
        {t}
      </text>
    ))}
  </g>
);

// A fat outlined arrow along a cubic path (dashed reveal via revealT 0..1).
export const FatArrow: React.FC<{d: string; revealT: number; color?: string; head?: [number, number]; headRot?: number}> = ({
  d, revealT, color = RED, head, headRot = 0,
}) => (
  <g>
    <path d={d} fill="none" stroke={INK} strokeWidth={44} strokeLinecap="round" strokeDasharray={900} strokeDashoffset={900 * (1 - revealT)} />
    <path d={d} fill="none" stroke={color} strokeWidth={28} strokeLinecap="round" strokeDasharray={900} strokeDashoffset={900 * (1 - revealT)} />
    {head && revealT > 0.96 && (
      <g transform={`translate(${head[0]},${head[1]}) rotate(${headRot})`}>
        <path d="M0,-52 L44,26 L12,16 L0,44 L-12,16 L-44,26 Z" fill={color} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      </g>
    )}
  </g>
);

// A wet-ink rubber STAMP that thuds down (scale/settle handled by caller via s).
export const Stamp: React.FC<{cx: number; cy: number; s: number; text: string; rot?: number; color?: string}> = ({
  cx, cy, s, text, rot = -8, color = RED,
}) => (
  <g transform={`translate(${cx},${cy}) rotate(${rot}) scale(${s})`} opacity={Math.min(1, s * 1.4)}>
    <rect x={-300} y={-70} width={600} height={140} rx={12} fill="none" stroke={color} strokeWidth={12} />
    <rect x={-300} y={-70} width={600} height={140} rx={12} fill="none" stroke={color} strokeWidth={3} opacity={0.5} transform="rotate(0.6)" />
    <text x={0} y={26} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={82} fill={color} letterSpacing={6}>
      {text}
    </text>
  </g>
);

// =============================================================================
// SERVER MACHINE — the antagonist hero, characterized with a face + emotions.
// Draw space local ~ 360 wide x 520 tall, base at (0,0). Emotions:
//   'greedy'   — hungry eyes, grin, drool
//   'nervous'  — worried eyes, wavy mouth, sweat, fast red LEDs
//   'shock'    — wide eyes, open mouth
//   'ghost'    — dashed unbuilt outline, hollow (the honest caveat)
// =============================================================================
export type MachineEmotion = 'greedy' | 'nervous' | 'shock' | 'ghost';

export const ServerMachine: React.FC<{
  frame: number; emotion?: MachineEmotion; x?: number; y?: number; scale?: number;
  facing?: 1 | -1; lookX?: number;
}> = ({frame: f, emotion = 'greedy', x = 0, y = 0, scale = 1, facing = 1, lookX = 0}) => {
  const ghost = emotion === 'ghost';
  const body = ghost ? 'none' : STEEL;
  const stroke = ghost ? '#9fb2d6' : INK;
  const dash = ghost ? '16 12' : undefined;
  const blink = ((f + 20) % 96) < 5 && emotion !== 'shock';
  const ledRed = emotion === 'nervous';
  const ledOn = (i: number) => (ledRed ? (f / 4 + i) % 3 < 1 : (f / 7 + i) % 5 < 1.6);
  const sweat = emotion === 'nervous';

  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      {/* ground shadow */}
      {!ghost && <ellipse cx={0} cy={6} rx={185} ry={30} fill={INK} opacity={0.3} />}
      {/* body */}
      <rect x={-165} y={-470} width={330} height={470} rx={34} fill={body} stroke={stroke} strokeWidth={OUT + 2} strokeDasharray={dash} />
      {!ghost && (
        <>
          <path d="M70,-462 h64 a26,26 0 0 1 26,26 v418 a26,26 0 0 1 -26,26 h-64 Z" fill={STEEL_D} opacity={0.8} />
          <rect x={-150} y={-452} width={48} height={168} rx={20} fill={STEEL_L} opacity={0.65} />
          {/* rack seams */}
          <path d="M-158,-250 h300" stroke={INK} strokeWidth={5} opacity={0.7} />
          <path d="M-158,-170 h300" stroke={INK} strokeWidth={5} opacity={0.7} />
          {/* side vents */}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={-150} y={-150 + i * 40} width={120} height={17} rx={8} fill={STEEL_D} stroke={INK} strokeWidth={4} />
          ))}
          {/* LED row */}
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={-120 + i * 44} cy={-206} r={11} fill={ledOn(i) ? (ledRed ? RED : AMBER) : '#2b3a55'} stroke={INK} strokeWidth={4} />
          ))}
        </>
      )}
      {ghost && (
        <>
          {/* empty chip slot + empty customer port, labeled */}
          <rect x={-96} y={-250} width={190} height={70} rx={8} fill="none" stroke="#9fb2d6" strokeWidth={5} strokeDasharray="10 8" />
          <text x={0} y={-208} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={30} fill="#9fb2d6">?</text>
          <rect x={-96} y={-150} width={190} height={60} rx={8} fill="none" stroke="#9fb2d6" strokeWidth={5} strokeDasharray="10 8" />
          <text x={0} y={-108} textAnchor="middle" fontFamily={BOLD} fontWeight={900} fontSize={26} fill="#9fb2d6">?</text>
        </>
      )}
      {/* ---- FACE ---- */}
      {(() => {
        const ex = lookX; // pupils track
        const eyeFill = ghost ? 'none' : ICE;
        const es = ghost ? '#9fb2d6' : INK;
        return (
          <g>
            {/* eye whites */}
            <ellipse cx={-64} cy={-360} rx={54} ry={emotion === 'shock' ? 66 : 58} fill={eyeFill} stroke={es} strokeWidth={OUT} strokeDasharray={dash} />
            <ellipse cx={64} cy={-360} rx={54} ry={emotion === 'shock' ? 66 : 58} fill={eyeFill} stroke={es} strokeWidth={OUT} strokeDasharray={dash} />
            {!ghost && !blink && (
              <>
                <circle cx={-64 + ex} cy={-352} r={emotion === 'shock' ? 16 : 21} fill={INK} />
                <circle cx={64 + ex} cy={-352} r={emotion === 'shock' ? 16 : 21} fill={INK} />
                <circle cx={-58 + ex} cy={-360} r={7} fill={ICE} />
                <circle cx={70 + ex} cy={-360} r={7} fill={ICE} />
              </>
            )}
            {!ghost && blink && (
              <>
                <rect x={-112} y={-372} width={96} height={26} rx={12} fill={STEEL} stroke={INK} strokeWidth={5} />
                <rect x={16} y={-372} width={96} height={26} rx={12} fill={STEEL} stroke={INK} strokeWidth={5} />
              </>
            )}
            {/* brows */}
            {emotion === 'greedy' && (
              <g>
                <path d={`M-118,-410 q54,${-12 - 3 * Math.sin(f / 18)} 104,8`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
                <path d={`M14,-402 q54,${-20 - 3 * Math.sin(f / 18)} 104,-10`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
              </g>
            )}
            {emotion === 'nervous' && (
              <g>
                <path d="M-118,-420 q50,-22 100,-4" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
                <path d="M118,-420 q-50,-22 -100,-4" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
              </g>
            )}
            {/* mouth */}
            {emotion === 'greedy' && (
              <g>
                <path d="M-70,-286 q70,64 140,0 q-12,72 -70,72 q-58,0 -70,-72 Z" fill="#5b1b1b" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
                {[0, 1, 2, 3].map((i) => (
                  <path key={i} d={`M${-52 + i * 36},${-280 + (i === 1 || i === 2 ? 8 : 2)} l12,20 l12,-16 Z`} fill={SNOW} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
                ))}
                {/* drool */}
                <path d={`M74,-238 q9,${14 + 5 * Math.sin(f / 10)} 0,${26 + 5 * Math.sin(f / 10)} q-9,-11 0,-26 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={3.4} />
              </g>
            )}
            {emotion === 'nervous' && (
              <path d={`M-64,-250 q32,-20 64,0 q32,20 64,0`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" transform="translate(-32,0)" />
            )}
            {emotion === 'shock' && <ellipse cx={0} cy={-250} rx={34} ry={44} fill="#5b1b1b" stroke={INK} strokeWidth={OUT} />}
            {ghost && <path d="M-56,-250 q56,0 112,0" fill="none" stroke="#9fb2d6" strokeWidth={7} strokeLinecap="round" strokeDasharray="10 8" />}
            {/* sweat beads */}
            {sweat && (
              <g>
                <path d={`M120,-392 q11,${14 + 5 * Math.sin(f / 7)} 0,${28 + 5 * Math.sin(f / 7)} q-11,-13 0,-28 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={4} />
                <path d={`M-120,-380 q-10,${12 + 4 * Math.cos(f / 8)} 0,${24 + 4 * Math.cos(f / 8)} q10,-11 0,-24 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={4} />
              </g>
            )}
          </g>
        );
      })()}
    </g>
  );
};

// A compact Alaska landmass with a pulsing North Slope pin (reused hook + map).
export const AlaskaMini: React.FC<{frame: number; x: number; y: number; scale?: number; pin?: boolean; pinLabel?: string}> = ({
  frame: f, x, y, scale = 1, pin = true, pinLabel,
}) => {
  const pinPulse = 1 + 0.22 * Math.sin(f / 9);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path
        d="M30,120 L95,78 L150,88 L172,58 L215,66 L238,40 L268,52 L310,46 L355,64 L420,58
           L465,88 L448,118 L400,130 L418,162 L378,172 L360,214 L308,224 L280,202 L252,232
           L212,222 L182,254 L152,232 L120,254 L90,222 L108,182 L64,172 L84,142 L30,132 Z"
        fill={LAND} stroke={INK} strokeWidth={OUT} strokeLinejoin="round"
      />
      <path d="M310,46 L355,64 L420,58 L465,88 L448,118 L400,130 L418,162 L378,172 L360,214 L308,224 L280,202 L300,150 L285,100 Z" fill={LAND_D} opacity={0.5} />
      {[[150, 150, 30], [200, 145, 38], [255, 152, 32]].map(([mx, my, s], i) => (
        <g key={i}>
          <path d={`M${mx - s},${my + s * 0.9} L${mx},${my - s} L${mx + s},${my + s * 0.9} Z`} fill="#6b7f8f" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M${mx - s * 0.32},${my - s * 0.3} L${mx},${my - s} L${mx + s * 0.32},${my - s * 0.3} L${mx + s * 0.14},${my - s * 0.12} L${mx},${my - s * 0.28} L${mx - s * 0.16},${my - s * 0.1} Z`} fill={SNOW} stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {pin && (
        <>
          <g transform={`translate(300,64) scale(${pinPulse})`}>
            <circle r={24} fill="none" stroke={RED} strokeWidth={5} opacity={Math.max(0, 1.3 - pinPulse)} />
          </g>
          <g transform="translate(300,64)">
            <path d="M0,26 C -20,2 -20,-16 0,-24 C 20,-16 20,2 0,26 Z" fill={RED} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
            <circle cx={0} cy={-6} r={7.5} fill={ICE} stroke={INK} strokeWidth={4} />
          </g>
        </>
      )}
    </g>
  );
};
