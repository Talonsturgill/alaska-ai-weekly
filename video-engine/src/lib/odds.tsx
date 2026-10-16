import React from 'react';
import {Easing, interpolate} from 'remotion';
import {ContactShadow, INK} from './lighting';

// THE ODDS KIT, 2026-10-16 ("The Forecast That Shows Its Work"). A probability drawn as a COUNT of physical things:
// a board of one hundred tiles (TileBoard), a bin of a thousand grains (GrainBin), plus the thermal receipt (Slip) that a
// forecast prints, the dial panel of a published equation, a range of six slots, a pegboard and the night yard that the
// seismic station stands in. Everything is an SVG in the 1080 x 1920 frame; every animated value is passed in.
export const OD = {
  night: '#0A1418', spruce: '#14303A', spruceHi: '#1F4552', snowBlue: '#6F94A6', snowBlueDeep: '#456579', tungsten: '#F2B04A', tungstenHi: '#FFE2A8',
  chalk: '#EDE6D3', chalkShade: '#C9C0A6', alarm: '#E0453A', alarmDeep: '#9A2A22', skeptic: '#8FB5C9', skepticDeep: '#4F7488',
  brass: '#B58A3C', brassHi: '#E3C16F', brassDeep: '#6E5321', tile: '#20414C', tileEdge: '#0F2830', lit: '#C8E04A', litHi: '#F0FFB0', desk: '#3A2B22', deskHi: '#5A4535',
  cork: '#9A7A55', corkDeep: '#6E5439',
};
export const MONO = "'JetBrains Mono', monospace";
export const SERIF = 'Fraunces, Georgia, serif';
export const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
export const eo = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const hash = (i: number) => {
  let x = (Math.floor(i) + 2027) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
export const rnd = (i: number) => (hash(i) % 10000) / 10000;

// ---- the night yard ---------------------------------------------------------------------------------------------------
/** Black-spruce night: stars, a far ridge, spruce silhouettes, muskeg with chalk snow patches, haze. dawn 0..1 warms the sky to snow-blue. */
export const NightYard: React.FC<{f: number; dawn?: number; ground?: number; shake?: number}> = ({f, dawn = 0, ground = 1230, shake = 0}) => {
  const sx = shake * 5 * Math.sin(f * 1.7), sy = shake * 3 * Math.cos(f * 2.3);
  const skyTop = dawn > 0.5 ? '#1B3447' : OD.night;
  return (
    <g transform={`translate(${sx} ${sy})`}>
      <defs>
        <linearGradient id="ny-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} /><stop offset="0.6" stopColor={dawn > 0.5 ? '#456579' : OD.spruce} /><stop offset="1" stopColor={dawn > 0.5 ? '#C7B38F' : '#1F4552'} />
        </linearGradient>
        <linearGradient id="ny-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B3A45" /><stop offset="1" stopColor={OD.night} /></linearGradient>
        <radialGradient id="ny-lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={OD.tungsten} stopOpacity="0.55" /><stop offset="1" stopColor={OD.tungsten} stopOpacity="0" /></radialGradient>
      </defs>
      <rect data-band="ok" x={-60} y={-60} width={1200} height={ground + 80} fill="url(#ny-sky)" />
      {Array.from({length: 46}, (_, i) => {
        const tw = 0.55 + 0.45 * Math.sin(f / (9 + rnd(i) * 14) + i);
        return <circle key={i} cx={rnd(i + 3) * 1080} cy={40 + rnd(i + 9) * (ground - 380)} r={1.2 + rnd(i + 21) * 2.2} fill={OD.chalk} opacity={(0.2 + 0.5 * rnd(i + 5)) * tw * (1 - dawn * 0.8)} />;
      })}
      <path data-band="ok" d={`M -60 ${ground - 150} L 120 ${ground - 330} L 260 ${ground - 230} L 430 ${ground - 400} L 600 ${ground - 250} L 790 ${ground - 360} L 960 ${ground - 230} L 1140 ${ground - 330} L 1140 ${ground} L -60 ${ground} Z`} fill="#10272F" opacity={0.95} />
      {Array.from({length: 26}, (_, i) => {
        const tx = -20 + i * 44 + rnd(i) * 18, th = 120 + rnd(i + 40) * 190, tw = 26 + rnd(i + 70) * 18;
        return <path key={i} data-band="ok" d={`M ${tx - tw} ${ground + 10} L ${tx} ${ground + 10 - th} L ${tx + tw} ${ground + 10} Z`} fill={i % 3 === 0 ? '#0C1E24' : '#0F2830'} />;
      })}
      <rect data-band="ok" x={-60} y={ground - 20} width={1200} height={800} fill="url(#ny-gnd)" />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M ${-80 + i * 230} ${ground + 40 + (i % 3) * 90} q 120 -36 260 0 q -130 40 -260 0`} fill={OD.chalk} opacity={0.14 + 0.05 * (i % 2)} />)}
      {[0, 1, 2].map((i) => <ellipse key={i} cx={((i * 560 + f * (0.4 + i * 0.25)) % 1700) - 300} cy={ground - 60 + i * 50} rx={420} ry={44} fill={OD.snowBlue} opacity={0.08 + 0.04 * i} />)}
      {/* the near plane: snow humps, a tussock and two black spruce trunks that frame the lower third */}
      <path data-band="ok" d={`M -60 ${ground + 330} Q 260 ${ground + 250} 560 ${ground + 320} T 1140 ${ground + 300} L 1140 1960 L -60 1960 Z`} fill="#0B1B21" />
      <path data-band="ok" d={`M -60 ${ground + 420} Q 300 ${ground + 360} 640 ${ground + 430} T 1140 ${ground + 400} L 1140 1960 L -60 1960 Z`} fill={OD.night} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M ${-40 + i * 190} ${ground + 470 + (i % 2) * 40} q 70 -34 150 -4`} fill="none" stroke={OD.chalk} strokeWidth={5} opacity={0.2} strokeLinecap="round" />)}
      <path data-band="ok" d={`M -20 1960 L 20 ${ground - 120} L 60 1960 Z`} fill="#050D11" />
      <path data-band="ok" d={`M 1000 1960 L 1050 ${ground - 60} L 1100 1960 Z`} fill="#050D11" />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} data-band="ok" d={`M ${i < 3 ? -30 : 1010} ${ground + 20 + i * 70} l ${i < 3 ? 120 : -120} 40 l ${i < 3 ? -120 : 120} 20 Z`} fill="#050D11" />)}
      {Array.from({length: 22}, (_, i) => {
        const px = ((rnd(i + 7) * 1300 + f * (2 + rnd(i) * 4)) % 1300) - 110;
        return <rect key={i} x={px} y={ground + 20 + rnd(i + 17) * 640} width={10 + rnd(i + 3) * 20} height={3} rx={1.5} fill={OD.chalk} opacity={0.22 + 0.2 * rnd(i + 9)} />;
      })}
    </g>
  );
};

/** A lamp pool: the one motivated tungsten key. */
export const LampPool: React.FC<{x: number; y: number; r?: number; f: number; k?: number}> = ({x, y, r = 380, f, k = 1}) => (
  <circle cx={x} cy={y} r={r * (1 + 0.025 * Math.sin(f / 21))} fill="url(#ny-lamp)" opacity={k * (0.9 + 0.1 * Math.sin(f / 13))} />
);

// ---- the Slip ---------------------------------------------------------------------------------------------------------
export type SlipLine = {text: string; p: number; tone?: 'ink' | 'rust'; small?: boolean};
/**
 * THE SLIP, the film's throughline: a thermal receipt printed by the seismic station. `out` 0..1 is how much of it has come out of the
 * slot, `lines` print with a stepper stutter (p 0..1), `tape` 0..1 wraps the last line (READ LAST), `peel` 0..1 lifts that tape about a pivot,
 * `box` 0 blank / 1 filled draws the clock box, `tab` swings the NEXT UPDATE tab, `stamp` lands a mono stamp.
 */
export const Slip: React.FC<{
  x: number; y: number; f: number; scale?: number; rot?: number; out?: number; lines?: SlipLine[]; tape?: number; peel?: number; tapeLine?: string;
  box?: number; boxShown?: boolean; tab?: number; stamp?: {text: string; k: number; tone?: 'ink' | 'rust'}; curl?: number; header?: string; lineGap?: number;
}> = ({x, y, f, scale = 1, rot = 0, out = 1, lines = [], tape = 0, peel = 0, tapeLine = '', box = 0, boxShown = false, tab = 0, stamp, curl = 1, header = '', lineGap = 60}) => {
  const W = 330;
  const tapeRows = tapeLine ? tapeLine.split('|') : [];
  const H = Math.max(120, 90 + lines.length * lineGap + (tapeLine ? 24 + tapeRows.length * 24 : 0) + (boxShown ? 150 : 0));
  const shown = H * clamp01(out);
  const sway = Math.sin(f / 19) * 1.2 * curl;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + sway}) scale(${scale})`}>
      <ContactShadow cx={8} cy={shown + 6} rx={W * 0.55} ry={16} opacity={0.42} />
      <clipPath id={`slipclip${Math.round(x)}${Math.round(y)}`}><rect x={-W / 2 - 20} y={-10} width={W + 40} height={shown + 24} /></clipPath>
      <g clipPath={`url(#slipclip${Math.round(x)}${Math.round(y)})`}>
        <rect x={-W / 2} y={0} width={W} height={H} fill={OD.chalk} stroke={INK} strokeWidth={5} />
        <rect x={-W / 2} y={0} width={12} height={H} fill={OD.chalkShade} opacity={0.5} />
        {Array.from({length: Math.ceil(H / 14)}, (_, i) => <line key={i} x1={-W / 2 + 6} y1={i * 14 + 7} x2={W / 2 - 6} y2={i * 14 + 7} stroke={OD.chalkShade} strokeWidth={1} opacity={0.35} />)}
        {header && <text x={0} y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={2} fill={INK}>{header}</text>}
        {header && <line x1={-W / 2 + 18} y1={48} x2={W / 2 - 18} y2={48} stroke={INK} strokeWidth={2.5} strokeDasharray="6 5" />}
        {lines.map((l, i) => {
          const yy = 96 + i * lineGap;
          const k = clamp01(l.p);
          if (k <= 0) return null;
          const n = Math.max(1, Math.floor(l.text.length * (k < 1 ? Math.round(k * 10) / 10 : 1)));
          const col = l.tone === 'rust' ? OD.alarm : INK;
          const sz = l.small ? 20 : 30;
          return <text key={i} x={-W / 2 + 22} y={yy} fontFamily={MONO} fontWeight={800} fontSize={sz} letterSpacing={1} fill={col}>{l.text.slice(0, n)}</text>;
        })}
        {tapeLine && (
          <g transform={`translate(0 ${96 + lines.length * lineGap})`}>
            {tapeRows.map((r, i) => <text key={i} x={-W / 2 + 20} y={i * 24} fontFamily={MONO} fontWeight={800} fontSize={16} letterSpacing={0.5} fill={OD.alarm} opacity={peel}>{r}</text>)}
          </g>
        )}
        {tape > 0.01 && (
          <g transform={`translate(${peel * 150} ${96 + lines.length * lineGap - 26 + peel * 150}) rotate(${peel * 32} ${W / 2} 0)`} opacity={tape * (1 - Math.max(0, peel - 0.55) * 2.2)}>
            <rect x={-W / 2 - 6} y={-6} width={W + 12} height={58} fill="#CBB892" stroke={INK} strokeWidth={3.5} />
            <text x={0} y={34} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={3} fill={OD.alarmDeep}>READ LAST</text>
          </g>
        )}
        {boxShown && (
          <g transform={`translate(0 ${H - 96})`}>
            <rect x={-62} y={-52} width={124} height={104} rx={8} fill="none" stroke={INK} strokeWidth={4} strokeDasharray={box > 0.5 ? undefined : '8 6'} />
            {box > 0.01 && (
              <g opacity={box}>
                <circle cx={0} cy={0} r={38} fill={OD.chalk} stroke={INK} strokeWidth={4} />
                {Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={-32} x2={0} y2={i % 3 === 0 ? -24 : -28} stroke={INK} strokeWidth={2.5} transform={`rotate(${i * 30})`} />)}
                <circle r={6} fill={INK} />
              </g>
            )}
            {box <= 0.01 && <text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} fill={INK} opacity={0.4}>?</text>}
          </g>
        )}
      </g>
      {tab > 0.01 && (
        <g transform={`translate(${-W / 2 + 70} ${H - 40}) rotate(${Math.sin(f / 7) * 5 * tab})`} opacity={clamp01(tab * 3)}>
          <line x1={0} y1={-18} x2={0} y2={0} stroke={INK} strokeWidth={3} />
          <rect x={-100} y={0} width={200} height={50} rx={4} fill={OD.brassHi} stroke={INK} strokeWidth={4} />
          <text x={0} y={33} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={2} fill={INK}>NEXT UPDATE</text>
        </g>
      )}
      {stamp && stamp.k > 0.01 && (() => {
        const w = monoW(stamp.text, 26, 3) + 44, col = stamp.tone === 'rust' ? OD.alarm : OD.skepticDeep;
        const land = 1.5 - 0.5 * Math.min(1, stamp.k * 4);
        return (
          <g transform={`translate(0 ${H * 0.58}) rotate(-7) scale(${land})`} opacity={Math.min(1, stamp.k * 4)}>
            <rect x={-w / 2} y={-30} width={w} height={60} rx={5} fill={OD.chalk} opacity={0.9} />
            <rect x={-w / 2} y={-30} width={w} height={60} rx={5} fill="none" stroke={col} strokeWidth={5} />
            <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} letterSpacing={3} fill={col}>{stamp.text}</text>
          </g>
        );
      })()}
    </g>
  );
};

// ---- the tile board ----------------------------------------------------------------------------------------------------
/** One hundred enamel tiles in a brass frame. `lit` is a COUNT (fractional allowed: the last tile fills partway), lit in a serpentine order. */
export const TileBoard: React.FC<{x: number; y: number; f: number; scale?: number; lit?: number; tint?: string; frame?: boolean; label?: string; rise?: number; ghost?: number; flash?: number}> =
({x, y, f, scale = 1, lit = 0, tint = OD.lit, frame = true, label = '', rise = 1, ghost = 0, flash = 0}) => {
  const T = 56, G = 6, N = 10;
  const side = N * (T + G) - G;
  const order = (i: number) => { const r = Math.floor(i / N), c = i % N; return r * N + (r % 2 === 0 ? c : N - 1 - c); };
  const idxOf: number[] = [];
  for (let i = 0; i < N * N; i++) idxOf[order(i)] = i;
  const yy = y + (1 - clamp01(rise)) * 420;
  return (
    <g transform={`translate(${x} ${yy}) scale(${scale})`} opacity={clamp01(rise * 2.4)}>
      <ContactShadow cx={6} cy={side / 2 + 40} rx={side * 0.62} ry={22} opacity={0.5} />
      {frame && (
        <g>
          <rect x={-side / 2 - 30} y={-side / 2 - 30} width={side + 60} height={side + 60} rx={14} fill={OD.brass} stroke={INK} strokeWidth={7} />
          <rect x={-side / 2 - 30} y={-side / 2 - 30} width={side + 60} height={10} rx={5} fill={OD.brassHi} opacity={0.6} />
          <rect x={-side / 2 - 14} y={-side / 2 - 14} width={side + 28} height={side + 28} rx={6} fill={OD.tileEdge} stroke={INK} strokeWidth={4} />
        </g>
      )}
      {Array.from({length: N * N}, (_, i) => {
        const r = Math.floor(i / N), c = i % N;
        const k = clamp01(lit - idxOf[i]);
        const cx = -side / 2 + c * (T + G) + T / 2, cy = -side / 2 + r * (T + G) + T / 2;
        const pop = k > 0 && k < 1 ? 1 + 0.12 * Math.sin(k * Math.PI) : 1;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${pop})`}>
            <rect x={-T / 2} y={-T / 2} width={T} height={T} rx={9} fill={OD.tile} stroke={INK} strokeWidth={3} />
            <rect x={-T / 2 + 5} y={-T / 2 + 5} width={T - 10} height={8} rx={4} fill="#FFFFFF" opacity={0.07} />
            {k > 0.001 && <rect x={-T / 2 + 3} y={-T / 2 + 3 + (T - 6) * (1 - k)} width={T - 6} height={(T - 6) * k} rx={7} fill={tint} stroke={INK} strokeWidth={2.5} />}
            {k > 0.999 && <rect x={-T / 2 + 8} y={-T / 2 + 8} width={T - 16} height={9} rx={4} fill={OD.litHi} opacity={0.65 + 0.2 * Math.sin(f / 9 + i)} />}
            {ghost > 0 && k < 0.01 && <rect x={-T / 2 + 3} y={-T / 2 + 3} width={T - 6} height={T - 6} rx={7} fill="none" stroke={OD.skeptic} strokeWidth={2} strokeDasharray="5 5" opacity={ghost} />}
          </g>
        );
      })}
      {flash > 0 && <rect x={-side / 2 - 30} y={-side / 2 - 30} width={side + 60} height={side + 60} rx={14} fill="#fff" opacity={0.25 * flash} />}
      {label && (() => {
        const w = monoW(label, 24, 2) + 44;
        return (
          <g transform={`translate(0 ${-side / 2 - 78})`}>
            <rect x={-w / 2} y={-26} width={w} height={52} rx={5} fill={OD.night} stroke={OD.chalk} strokeWidth={3.5} />
            <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={2} fill={OD.chalk}>{label}</text>
          </g>
        );
      })()}
    </g>
  );
};

/** A glass bin of 1,000 grains: ten layers of ten by ten dots in perspective. One grain glows, drawn a little smaller. */
export const GrainBin: React.FC<{x: number; y: number; f: number; scale?: number; glow?: number; layers?: number}> = ({x, y, f, scale = 1, glow = 1, layers = 10}) => {
  const rows = 10, cols = 10;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={330} rx={420} ry={26} opacity={0.5} />
      <rect x={-330} y={-240} width={660} height={560} rx={16} fill="#1B3A45" stroke={INK} strokeWidth={8} opacity={0.9} />
      {Array.from({length: layers}, (_, L) => {
        const li = layers - 1 - L;
        const s = 1 - li * 0.045, oy = -200 + li * 46 - 40;
        return (
          <g key={L} transform={`translate(0 ${oy + 340}) scale(${s} ${s * 0.42})`} opacity={0.55 + 0.45 * (1 - li / layers)}>
            {Array.from({length: rows * cols}, (_, i) => {
              const r = Math.floor(i / cols), c = i % cols;
              return <circle key={i} cx={-270 + c * 60} cy={-270 + r * 60} r={13} fill={OD.tile} stroke={OD.tileEdge} strokeWidth={3} />;
            })}
          </g>
        );
      })}
      <g transform={`translate(${-60 + 3 * 0} ${232})`} opacity={glow}>
        <circle r={46 + 6 * Math.sin(f / 8)} fill={OD.lit} opacity={0.22} />
        <circle r={9} fill={OD.lit} stroke={INK} strokeWidth={2.5} />
        <circle r={3} cx={-2} cy={-2} fill={OD.litHi} />
      </g>
      <rect x={-330} y={-240} width={660} height={22} rx={10} fill="#fff" opacity={0.1} />
      <path d="M -300 -220 L -230 -220 L -330 300 L -330 300 Z" fill="#fff" opacity={0.07} />
      <path d="M 190 -220 L 230 -220 L 150 300 L 110 300 Z" fill="#fff" opacity={0.06} />
      <rect x={-330} y={290} width={660} height={30} rx={12} fill={OD.brass} stroke={INK} strokeWidth={6} />
      <rect x={-330} y={-240} width={660} height={560} rx={16} fill="none" stroke={OD.skeptic} strokeWidth={3} opacity={0.4} />
    </g>
  );
};

// ---- the dial panel ----------------------------------------------------------------------------------------------------
/** A brass panel of four dials labelled a b c p. `seat` 0..1 settles the needles, `wobble` 0..1 wobbles p, `sync` 1 = in sync, 0 = out of sync. */
export const DialPanel: React.FC<{x: number; y: number; f: number; scale?: number; seat?: number; wobble?: number; sync?: number; plate?: string; on?: number}> =
({x, y, f, scale = 1, seat = 1, wobble = 0, sync = 1, plate = '', on = 1}) => {
  const names = ['a', 'b', 'c', 'p'];
  const base = [-40, 20, -12, 34];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={clamp01(on * 2.4)}>
      <ContactShadow cx={0} cy={250} rx={430} ry={24} opacity={0.5} />
      <rect x={-420} y={-210} width={840} height={460} rx={20} fill={OD.brass} stroke={INK} strokeWidth={8} />
      <rect x={-420} y={-210} width={840} height={14} rx={7} fill={OD.brassHi} opacity={0.6} />
      <rect x={-392} y={-182} width={784} height={404} rx={12} fill="#1A2D33" stroke={INK} strokeWidth={5} />
      {names.map((n, i) => {
        const cx = -294 + i * 196;
        const dis = (1 - sync) * (i % 2 === 0 ? 1 : -1) * (24 + 10 * Math.sin(f / 4 + i));
        const ang = lerp(-90, base[i], seat) + dis + (i === 3 ? wobble * 22 * Math.sin(f / 2.4) : 0);
        return (
          <g key={n} transform={`translate(${cx} 20)`}>
            <circle r={78} fill={OD.chalk} stroke={INK} strokeWidth={6} />
            {Array.from({length: 13}, (_, k) => <line key={k} x1={0} y1={-70} x2={0} y2={k % 3 === 0 ? -54 : -62} stroke={INK} strokeWidth={k % 3 === 0 ? 4 : 2.5} transform={`rotate(${-90 + k * 15})`} />)}
            <line x1={0} y1={0} x2={0} y2={-62} stroke={OD.alarmDeep} strokeWidth={6} strokeLinecap="round" transform={`rotate(${ang})`} />
            <circle r={9} fill={OD.brassDeep} stroke={INK} strokeWidth={3} />
            <text x={0} y={128} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={54} fill={OD.chalk}>{n}</text>
          </g>
        );
      })}
      {plate && (() => {
        const w = Math.min(780, monoW(plate, 22, 2) + 50);
        return (
          <g transform="translate(0 -250)">
            <rect x={-w / 2} y={-28} width={w} height={56} rx={5} fill={OD.night} stroke={OD.chalk} strokeWidth={3.5} />
            <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={2} fill={OD.chalk}>{plate}</text>
          </g>
        );
      })()}
    </g>
  );
};

/** A ledger sheet that feeds into the panel: chalk paper with ruled rows, `tone` skeptic for the past, tungsten for this one. */
export const Ledger: React.FC<{x: number; y: number; rot?: number; scale?: number; tone?: 'past' | 'now'; label?: string}> = ({x, y, rot = 0, scale = 1, tone = 'past', label = ''}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <ContactShadow cx={6} cy={106} rx={120} ry={10} opacity={0.4} />
    <rect x={-100} y={-90} width={200} height={190} fill={tone === 'now' ? OD.tungstenHi : OD.chalk} stroke={INK} strokeWidth={5} />
    {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={-76} y1={-48 + i * 32} x2={76 - (i % 2) * 24} y2={-48 + i * 32} stroke={INK} strokeWidth={3} opacity={0.5} />)}
    {label && <text x={0} y={-62} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={15} letterSpacing={2} fill={INK}>{label}</text>}
  </g>
);

// ---- clock -------------------------------------------------------------------------------------------------------------
/** A round wall clock. `hands` false = a dark face with no hands. `h`, `m` are angles in degrees; `ghost` adds a dashed second hand pair. */
export const ClockFace: React.FC<{x: number; y: number; f: number; scale?: number; hands?: boolean; h?: number; m?: number; dark?: boolean; tone?: 'warm' | 'cool'; pip?: boolean; qmark?: number; crack?: number}> =
({x, y, f, scale = 1, hands = true, h = 0, m = 0, dark = false, tone = 'warm', pip = false, qmark = 0, crack = 0}) => {
  const rim = tone === 'cool' ? OD.skeptic : OD.brass;
  const face = dark ? '#0C1B21' : OD.chalk;
  const fg = dark ? OD.snowBlue : INK;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={236} rx={190} ry={16} opacity={0.5} />
      <circle r={210} fill={rim} stroke={INK} strokeWidth={9} />
      <circle r={178} fill={face} stroke={INK} strokeWidth={6} />
      <circle r={178} fill="none" stroke="#fff" strokeWidth={4} opacity={0.12} strokeDasharray="120 400" transform="rotate(-140)" />
      {Array.from({length: 60}, (_, i) => <line key={i} x1={0} y1={-166} x2={0} y2={i % 5 === 0 ? -138 : -152} stroke={fg} strokeWidth={i % 5 === 0 ? 7 : 3} opacity={dark ? 0.55 : 0.9} transform={`rotate(${i * 6})`} />)}
      {pip && <circle cx={0} cy={-100} r={11 + 2 * Math.sin(f / 5)} fill={OD.alarm} stroke={INK} strokeWidth={3} />}
      {hands && (
        <g>
          <line x1={0} y1={0} x2={0} y2={-112} stroke={fg} strokeWidth={14} strokeLinecap="round" transform={`rotate(${h})`} />
          <line x1={0} y1={0} x2={0} y2={-150} stroke={fg} strokeWidth={8} strokeLinecap="round" transform={`rotate(${m})`} />
          <circle r={14} fill={OD.alarmDeep} stroke={INK} strokeWidth={3} />
        </g>
      )}
      {qmark > 0.01 && (
        <text x={0} y={52 - 30 * (1 - qmark)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={190} fill={OD.tungsten} opacity={qmark} stroke={INK} strokeWidth={5} paintOrder="stroke">?</text>
      )}
      {crack > 0.01 && <path d="M -60 -150 L -20 -90 L -48 -40 L 8 10 L -22 70" fill="none" stroke={OD.chalk} strokeWidth={4} opacity={crack} />}
    </g>
  );
};

// ---- range slots, token, clicker ----------------------------------------------------------------------------------------
/** Six slots 0..5 under a dashed bracket. `open` 0..1 grows the bracket, `label` 0..1 lights the numerals, `drop` 0..1 drops a chalk token into slot 1. */
export const RangeSlots: React.FC<{x: number; y: number; f: number; scale?: number; open?: number; label?: number; drop?: number; count?: number}> = ({x, y, f, scale = 1, open = 1, label = 1, drop = 0, count = 0}) => {
  const w = 138, N = 6, total = N * w;
  const dropY = interpolate(drop, [0, 0.62, 0.8, 1], [-420, 0, -34, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bw = total * clamp01(open);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={120} rx={total * 0.55} ry={20} opacity={0.5} />
      {Array.from({length: N}, (_, i) => (
        <g key={i} transform={`translate(${-total / 2 + i * w + w / 2} 0)`}>
          <rect x={-w / 2 + 8} y={-70} width={w - 16} height={150} rx={12} fill="#0F2229" stroke={INK} strokeWidth={5} />
          <rect x={-w / 2 + 14} y={-64} width={w - 28} height={12} rx={6} fill="#fff" opacity={0.07} />
          <text x={0} y={124} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={64} fill={OD.chalk} opacity={label}>{i}</text>
        </g>
      ))}
      <g transform={`translate(${-total / 2 + w + w / 2} ${dropY - 6})`} opacity={drop > 0.01 ? 1 : 0}>
        <ellipse cx={0} cy={50} rx={34} ry={8} fill={INK} opacity={0.3} />
        <circle r={36} fill={OD.chalk} stroke={INK} strokeWidth={5} />
        <circle r={22} fill="none" stroke={OD.chalkShade} strokeWidth={3} />
        <text x={0} y={12} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={32} fill={INK}>1</text>
      </g>
      <g opacity={clamp01(open * 3)}>
        <path d={`M ${-bw / 2} -118 L ${-bw / 2} -150 L ${bw / 2} -150 L ${bw / 2} -118`} fill="none" stroke={OD.chalk} strokeWidth={8} strokeDasharray="22 12" strokeLinecap="round" strokeDashoffset={-f * 0.8} />
      </g>
      <g transform="translate(0 214)" opacity={clamp01(count * 3)}>
        <rect x={-110} y={-34} width={220} height={68} rx={8} fill={OD.brass} stroke={INK} strokeWidth={5} />
        <rect x={-92} y={-22} width={184} height={44} rx={4} fill="#101B1F" />
        <text x={0} y={13} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={38} letterSpacing={6} fill={OD.lit}>{`00${count >= 1 ? 1 : 0}`}</text>
      </g>
    </g>
  );
};

// ---- the pegboard -------------------------------------------------------------------------------------------------------
/** A top-down pegboard. The marble falls row by row through a fixed path and lands in a slot; `k` 0..1 is the fall. */
export const Pegboard: React.FC<{x: number; y: number; f: number; scale?: number; k?: number; seed?: number; tone?: string}> = ({x, y, f, scale = 1, k = 0, seed = 3, tone = OD.skeptic}) => {
  const rows = 9, gap = 70, rowH = 62;
  let px = 0;
  const path: [number, number][] = [[0, -rowH]];
  for (let r = 0; r < rows; r++) { px += rnd(seed * 31 + r) > 0.5 ? gap / 2 : -gap / 2; path.push([px, r * rowH]); }
  const seg = path.length - 1;
  const t = clamp01(k) * seg;
  const i0 = Math.min(seg - 1, Math.floor(t)), fr = t - i0;
  const bx = lerp(path[i0][0], path[i0 + 1][0], fr);
  const by = lerp(path[i0][1], path[i0 + 1][1], fr) - 22 * Math.sin(fr * Math.PI) * (k < 1 ? 1 : 0);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={rows * rowH + 130} rx={400} ry={20} opacity={0.45} />
      <rect x={-380} y={-120} width={760} height={rows * rowH + 230} rx={14} fill="#16313A" stroke={tone} strokeWidth={6} />
      {Array.from({length: rows}, (_, r) =>
        Array.from({length: r + 3}, (_, c) => {
          const cx = (c - (r + 2) / 2) * gap, cy = r * rowH;
          return <circle key={`${r}-${c}`} cx={cx} cy={cy} r={8} fill={OD.chalk} stroke={INK} strokeWidth={2.5} opacity={0.85} />;
        })
      )}
      {Array.from({length: 9}, (_, i) => <rect key={i} x={-360 + i * 80} y={rows * rowH + 60} width={72} height={70} rx={6} fill="#0C1B21" stroke={tone} strokeWidth={3} />)}
      {k > 0.001 && <circle cx={bx} cy={by} r={18} fill={OD.tungsten} stroke={INK} strokeWidth={4} />}
    </g>
  );
};

// ---- the map plate ------------------------------------------------------------------------------------------------------
/** A bone map plate: a grid, a coast-free plain, a pin and a disc. `disc` 0..1 grows a giant disc over the plate. Sizes are stated not to scale. */
export const MapPlate: React.FC<{x: number; y: number; f: number; scale?: number; pin?: number; disc?: number; ticks?: number; zoom?: number}> = ({x, y, f, scale = 1, pin = 1, disc = 0, ticks = 0, zoom = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale * zoom})`}>
    <ContactShadow cx={0} cy={420} rx={470} ry={24} opacity={0.5} />
    <rect x={-470} y={-380} width={940} height={800} rx={14} fill="#C9D3D0" stroke={INK} strokeWidth={8} />
    <clipPath id="mapclip"><rect x={-462} y={-372} width={924} height={784} rx={10} /></clipPath>
    <g clipPath="url(#mapclip)">
      {Array.from({length: 13}, (_, i) => <line key={`v${i}`} x1={-462 + i * 77} y1={-372} x2={-462 + i * 77} y2={412} stroke={OD.skepticDeep} strokeWidth={2} opacity={0.3} transform={`translate(${Math.sin(f / 40) * 3} 0)`} />)}
      {Array.from({length: 11}, (_, i) => <line key={`h${i}`} x1={-462} y1={-372 + i * 78} x2={462} y2={-372 + i * 78} stroke={OD.skepticDeep} strokeWidth={2} opacity={0.3} />)}
      <rect x={-462} y={-372} width={924} height={784} fill="#9DB8C0" />
      <path d="M -462 -372 L 140 -372 Q 60 -250 160 -120 Q 260 20 120 150 Q 20 260 -120 330 Q -260 400 -462 412 Z" fill="#A9B79A" stroke={INK} strokeWidth={6} />
      <path d="M -300 -300 Q -230 -200 -300 -100 M -200 -60 Q -120 40 -210 150" fill="none" stroke="#6F8466" strokeWidth={5} opacity={0.6} />
      <circle cx={0} cy={0} r={520} fill="none" stroke={OD.skepticDeep} strokeWidth={2} opacity={0.2} />
      {disc > 0.001 && (
        <g opacity={clamp01(disc * 2)}>
          <circle cx={30} cy={20} r={lerp(30, 620, disc)} fill={OD.skeptic} opacity={0.55} stroke={INK} strokeWidth={7} />
          <circle cx={30} cy={20} r={lerp(20, 520, disc)} fill="none" stroke={OD.skepticDeep} strokeWidth={5} strokeDasharray="14 12" />
        </g>
      )}
      <g transform={`translate(${-250} ${-130})`} opacity={pin}>
        <circle r={26 + 8 * Math.sin(f / 6)} fill={OD.alarm} opacity={0.22} />
        <circle r={14} fill={OD.alarm} stroke={INK} strokeWidth={4} />
      </g>
    </g>
    {ticks > 0.01 && (
      <g transform="translate(330 -300)" opacity={clamp01(ticks * 3)}>
        <circle r={58} fill={OD.chalk} stroke={INK} strokeWidth={5} />
        {[0, 1].map((i) => <circle key={i} cx={-20 + i * 40} cy={0} r={11} fill={ticks * 2 > i + 0.5 ? OD.alarm : 'none'} stroke={INK} strokeWidth={3} />)}
      </g>
    )}
  </g>
);

// ---- cork wall of felt reports ------------------------------------------------------------------------------------------
/** A cork wall of small report slips. `n` is how many are pinned (0..103). */
export const CorkWall: React.FC<{x: number; y: number; f: number; scale?: number; n?: number}> = ({x, y, f, scale = 1, n = 103}) => {
  const cols = 13, rows = 8;
  const shown = Math.floor(n);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={330} rx={520} ry={22} opacity={0.5} />
      <rect x={-500} y={-310} width={1000} height={620} rx={14} fill={OD.cork} stroke={INK} strokeWidth={8} />
      <rect x={-500} y={-310} width={1000} height={12} rx={6} fill="#C9A87C" opacity={0.6} />
      {Array.from({length: cols * rows}, (_, i) => {
        if (i >= shown) return null;
        const r = Math.floor(i / cols), c = i % cols;
        const age = shown - i;
        const land = Math.min(1, age / 6);
        const cx = -440 + c * 73 + (rnd(i) - 0.5) * 8, cy = -250 + r * 72 + (rnd(i + 5) - 0.5) * 8;
        const rot = (rnd(i + 11) - 0.5) * 12 + (1 - land) * 24;
        return (
          <g key={i} transform={`translate(${cx} ${cy - (1 - land) * 60}) rotate(${rot})`} opacity={land}>
            <rect x={-27} y={-30} width={54} height={60} fill={OD.chalk} stroke={INK} strokeWidth={3} />
            <line x1={-17} y1={-14} x2={17} y2={-14} stroke={INK} strokeWidth={2.5} opacity={0.6} />
            <line x1={-17} y1={-2} x2={11} y2={-2} stroke={INK} strokeWidth={2.5} opacity={0.6} />
            <circle cx={0} cy={-27} r={5} fill={OD.alarm} stroke={INK} strokeWidth={1.5} />
          </g>
        );
      })}
    </g>
  );
};

/** A row of dominoes (tiles) that topple in sequence; `k` 0..1 is how far the cascade has run. */
export const Dominoes: React.FC<{x: number; y: number; scale?: number; k?: number; n?: number}> = ({x, y, scale = 1, k = 0, n = 12}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={26} rx={n * 28} ry={10} opacity={0.4} />
    {Array.from({length: n}, (_, i) => {
      const ti = clamp01(k * (n + 4) - i);
      const ang = ti * 78;
      return (
        <g key={i} transform={`translate(${-n * 26 + i * 52} 20) rotate(${ang})`}>
          <rect x={-14} y={-90} width={28} height={90} rx={4} fill={i === 0 ? OD.alarm : OD.tile} stroke={INK} strokeWidth={4} />
          <rect x={-8} y={-84} width={6} height={30} fill="#fff" opacity={0.1} />
        </g>
      );
    })}
  </g>
);
