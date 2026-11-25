import React from 'react';
import {ContactShadow} from './lighting';
import {figureIdle, type FigurePose} from './figureidle';

// ============================================================================================
// RAIL FAMILY (NET-NEW 2026-11-25, "The Other Track").
// The shelf had no railroad and no survey stake with a face. A rail junction is the plainest picture
// there is of "two clocks": ties are countable days, a switch decides which track a thing rides, and a
// boxcar that has already left the yard is a decision made somewhere else. Cast for any story about
// timing, routing, a handoff, a deadline or where a decision really lives.
//   SwitchStand  the FACELESS protagonist: it acts through its lever (posture, a tremble, a hesitation
//                caught mid-throw), its lamp (blink, glow) and a two-sided target disc with labels. No face, ever.
//   RailLine     a straight track between two points with countable ties that lay on one by one
//   Boxcar       a boxcar with a stencilled label, sliding doors, rolling wheels, or a dashed POSSIBLE outline
//   Diesel       a plain FACELESS modern road diesel (grey and bone), pulls a cut of Boxcars; no steam ever
//   FreightScale a platform scale with a needle and a dial word; MailSack a tied canvas sack with a stencil
//   BufferStop   a track-end buffer with a plate
//   SusitnaBG    a late-November Mat-Su noon: lemon low sun, the Talkeetnas, spruce, birch, snow
//   SnowBank     the near plane: ink-outlined drifts with tufts and sparkle, under the caption card
//   Boardroom    a slate boardroom wall, frosted window onto the inlet, wall clock, door with sign, walnut table
//   WallClock    a faceless wall clock with hands driven by a time value
//   SignalLamp   a lamp head on a mast with a lit lens and a word
// People are never characterized here; named people are lib/people.tsx Suits.
// ============================================================================================

const INK = '#22303A';
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const uid = (s: string) => 'rl' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
export const RMONO = "'JetBrains Mono', monospace";
export const rmonoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);

export const RAIL = {
  ink: INK, snow: '#F3F1EA', snowShade: '#9FB6CC', snowDeep: '#6E8496', catchWarm: '#E6D2A6',
  sky0: '#F6E7A8', sky1: '#EFE8D6', sky2: '#D9D6C8', sun: '#FFF3C4',
  birch: '#F2EFE6', lenticel: '#2B2A2A', spruce: '#1E2B24', spruceL: '#34493C',
  stake: '#C9925A', stakeD: '#8C5E36', stakeL: '#E2B47F', amber: '#F2A93B', amberD: '#B8741C', tag: '#FFF4DC',
  iron: '#3B3F44', ironL: '#6A7077', signal: '#F2C230', vermilion: '#C9542E', possible: '#22303A',
  rust: '#8A4B2E', rustL: '#A9785C', tie: '#5B4636', tieL: '#7A604A',
  wall: '#3E4A52', wallL: '#56646D', walnut: '#C9B48A', walnutD: '#8E7650', lamp: '#F6E7C8',
  car: '#7A3B2C', carL: '#9C5240', carD: '#4E241B', paper: '#FBF6EA', lemon: '#F7E27A',
};

// BEAT IDLE: the same contract as lib/forest's beatPose; pass `cues` (frames, usually p.b(id)) and the
// character performs on each one: weight over to the other side 5 frames early, the face answers late.
type BeatPose = {skew: number; dip: number; breath: number; eye: number; tilt: number; on: boolean};
const NO_POSE: BeatPose = {skew: 0, dip: 0, breath: 1, eye: 0, tilt: 0, on: false};
function beatPose(f: number, seed: number, cues: number[] | undefined, gain: number, h: number): BeatPose {
  if (!cues || !cues.length || gain <= 0) return NO_POSE;
  const p: FigurePose = figureIdle(f, seed, gain, cues);
  const skew = (Math.atan2(p.shift * 1.8 * (h / 300), h) * 180) / Math.PI + p.lean * 0.6;
  return {skew, dip: p.dip, breath: p.breath, eye: p.headX * 0.45, tilt: p.headRot, on: true};
}

/**
 * SwitchStand. THE PROTAGONIST, FACELESS. Origin is the foot of the mast on the ground. At scale 1 about 340 tall.
 * It acts through mechanism, never a face:
 *  - throw 0..1   the lever swings over (0 = toward face A's track, 1 = face B's); 0.5 is caught mid-throw
 *  - tremble 0..1 the lever shivers in its quadrant (hesitation); lean -1..1 the whole stand leans on its base
 *  - turn 0..1    the target disc turns from face A (0) to face B (1), edge-on at 0.5
 *  - lamp 0..1    the lamp lights amber; `blink` makes it blink on its own
 *  - cues         beat frames: on each the lever twitches toward its next side, the stand dips, the lamp flares
 *  - shadow       angle (deg) of the disc's long cast shadow across the snow, null for none (the signature shot)
 */
export const SwitchStand: React.FC<{x: number; y: number; scale?: number; f: number; throw?: number; turn?: number; faceA?: string; faceB?: string;
  lamp?: number; blink?: boolean; tremble?: number; lean?: number; cues?: number[]; idleGain?: number; cast?: number; discSize?: number; shadow?: number | null; shadowLen?: number; seed?: number}> =
({x, y, scale = 1, f, throw: th = 0, turn = 0, faceA = '', faceB = '', lamp = 0, blink = false, tremble = 0, lean = 0, cues, idleGain = 1, cast = -1.2, discSize = 22, shadow = null, shadowLen = 1, seed = 2}) => {
  const bp = beatPose(f, seed, cues, idleGain, 340);
  // a cue: the lever twitches 7 degrees and settles, the lamp flares
  let cueK = 0;
  for (const c of cues ?? []) { const d = f - (c - 5); if (d >= 0 && d < 22) cueK = Math.max(cueK, Math.exp(-d / 6) * Math.sin((d / 22) * Math.PI * 2.5)); }
  const lever = -62 + 124 * clamp01(th) + tremble * 5 * Math.sin(f * 1.9) + cueK * 7 * idleGain + bp.skew * 0.8;
  const tilt = lean * 4 + bp.skew * 0.5 + Math.sin(f / 37 + seed) * 0.6;
  const a = Math.cos(Math.PI * clamp01(turn));
  const isB = clamp01(turn) > 0.5;
  const face = isB ? faceB : faceA;
  const dr = Math.max(64, (rmonoW(face || 'X', discSize) + 34) / 2);
  const lampK = clamp01(lamp) * (blink ? (Math.sin(f / 4) > 0 ? 1 : 0.25) : 1) + cueK * 0.5;
  const id = uid(`sw${x}${y}`);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={cast * 160} cy={6} rx={Math.abs(cast) * 170} ry={10} fill={RAIL.snowShade} opacity={0.5} />
      {shadow !== null && (
        <g transform={`rotate(${shadow}) scale(1 ${shadowLen})`}>
          <path d={`M 0 4 L ${-dr * 0.6} 6 L ${-dr * 0.9} 520 L ${dr * 0.9} 520 L ${dr * 0.6} 6 Z`} fill={RAIL.snowShade} opacity={0.0} />
          <rect x={-8} y={0} width={16} height={560} fill={RAIL.snowShade} opacity={0.45} />
          <ellipse cx={0} cy={620} rx={dr * 1.1 * Math.max(0.15, Math.abs(a))} ry={dr * 0.5} fill={RAIL.snowShade} opacity={0.5} />
        </g>
      )}
      <ContactShadow cx={0} cy={4} rx={80} ry={12} opacity={0.4} />
      <defs>
        <linearGradient id={`${id}i`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#24272B" /><stop offset="0.6" stopColor={RAIL.iron} /><stop offset="1" stopColor={RAIL.ironL} />
        </linearGradient>
      </defs>
      <g transform={`rotate(${tilt}) translate(0 ${bp.dip * 3})`}>
        {/* base box with rivets and a lever quadrant */}
        <rect x={-70} y={-60} width={140} height={60} rx={6} fill={`url(#${id}i)`} stroke={INK} strokeWidth={5} />
        {[-52, -18, 18, 52].map((rx) => <circle key={rx} cx={rx} cy={-30} r={4} fill={RAIL.ironL} stroke={INK} strokeWidth={1.5} />)}
        <path d="M -20 -60 A 52 52 0 0 1 80 -60" fill="none" stroke={INK} strokeWidth={4} />
        <path d="M -12 -62 L -4 -72 M 72 -62 L 64 -72" stroke={RAIL.paper} strokeWidth={5} strokeLinecap="round" />
        {/* lever: the one diagonal in the world */}
        <g transform={`translate(30 -56) rotate(${lever})`}>
          <rect x={-7} y={-140} width={14} height={140} rx={5} fill={`url(#${id}i)`} stroke={INK} strokeWidth={4} />
          <rect x={-10} y={-40} width={20} height={14} rx={3} fill={RAIL.ironL} stroke={INK} strokeWidth={2.5} />
          <circle cx={0} cy={-144} r={13} fill={RAIL.ironL} stroke={INK} strokeWidth={4} />
          <circle cx={-4} cy={-148} r={4} fill="#FFFFFF" opacity={0.7} />
        </g>
        {/* mast */}
        <rect x={-12} y={-300} width={24} height={244} fill={`url(#${id}i)`} stroke={INK} strokeWidth={5} />
        <path d="M 7 -294 V -64" stroke="#8C949C" strokeWidth={3} opacity={0.7} />
        {/* target disc: face A signal yellow with a black bar, face B bone with an amber ring */}
        <g transform={`translate(0 -250) scale(${Math.max(0.06, Math.abs(a))} 1)`}>
          <circle cx={6} cy={8} r={dr} fill="#000" opacity={0.22} />
          <circle cx={0} cy={0} r={dr} fill={RAIL.paper} stroke={INK} strokeWidth={6} />
          {!isB && <rect x={-dr + 8} y={-dr * 0.34} width={(dr - 8) * 2} height={dr * 0.68} fill={INK} />}
          {isB && <circle cx={0} cy={0} r={dr - 10} fill="none" stroke={RAIL.amber} strokeWidth={8} />}
          {face && <text x={0} y={discSize * 0.36} textAnchor="middle" fontFamily={RMONO} fontWeight={900} fontSize={discSize} letterSpacing={1.5} fill={isB ? INK : RAIL.paper}>{face}</text>}
          <path d={`M ${-dr * 0.7} ${-dr * 0.5} q ${dr * 0.4} ${-dr * 0.35} ${dr * 0.9} ${-dr * 0.4}`} stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.45} />
        </g>
        {/* lamp */}
        <g transform="translate(0 -318)">
          <rect x={-26} y={-30} width={52} height={44} rx={8} fill={`url(#${id}i)`} stroke={INK} strokeWidth={4} />
          <circle cx={0} cy={-8} r={13} fill={lampK > 0.05 ? RAIL.amber : '#5E6066'} stroke={INK} strokeWidth={3} />
          {lampK > 0.05 && <circle cx={0} cy={-8} r={34 + 4 * Math.sin(f / 6)} fill={RAIL.amber} opacity={0.28 * Math.min(1, lampK)} />}
          <path d="M -30 -32 h 60 l -8 -12 h -44 Z" fill={RAIL.iron} stroke={INK} strokeWidth={3} />
        </g>
      </g>
    </g>
  );
};

/**
 * TrackFork. One point splitting into two angles: a single track from (x, y) running up-screen to the frog, then
 * a CLOSED short branch to the left ending at a buffer stop, and an OPEN branch to the right that runs off frame.
 * Side-perspective (rails converge toward `vy`). `ties` and `shownL`/`shownR` count ties on each branch.
 */
export const TrackFork: React.FC<{f: number; x: number; y: number; frogY: number; endL: [number, number]; endR: [number, number]; tiesL: number; tiesR: number;
  shownL?: number; shownR?: number; gauge?: number; labelsL?: Record<number, string>; labelsR?: Record<number, string>; emptyR?: number}> =
({x, y, frogY, endL, endR, tiesL, tiesR, shownL, shownR, gauge = 70, labelsL, labelsR, emptyR = 0}) => (
  <g>
    <RailLine x0={x} y0={y} x1={x} y1={frogY} ties={6} gauge={gauge} />
    <RailLine x0={x} y0={frogY} x1={endL[0]} y1={endL[1]} ties={tiesL} shown={shownL} gauge={gauge * 0.8} tieLabels={labelsL} />
    <RailLine x0={x} y0={frogY} x1={endR[0]} y1={endR[1]} ties={tiesR} shown={shownR} gauge={gauge * 0.8} tieLabels={labelsR} dashedFrom={undefined} emptyFirst={emptyR} />
  </g>
);

/**
 * RailLine. A straight track from (x0,y0) to (x1,y1). `ties` is how many ties the line holds, `shown` 0..ties lays
 * them on one by one from the start (the rails draw on with them). `gauge` is rail spacing in px. Ties are drawn
 * perpendicular to the track. `tieLabels` maps a tie index to a short string painted beside it.
 */
export const RailLine: React.FC<{x0: number; y0: number; x1: number; y1: number; ties: number; shown?: number; gauge?: number; tieLen?: number;
  dashedFrom?: number; color?: string; tieLabels?: Record<number, string>; labelSize?: number; f?: number; glowTie?: number; emptyFirst?: number}> =
({x0, y0, x1, y1, ties, shown, gauge = 60, tieLen, dashedFrom, color = RAIL.rust, tieLabels = {}, labelSize = 20, glowTie = -1, emptyFirst = 0}) => {
  const n = shown === undefined ? ties : Math.max(0, Math.min(ties, shown));
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const tl = tieLen ?? gauge * 1.7;
  const step = L / ties;
  const endL = Math.min(L, step * n);
  const ex = x0 + ux * endL, ey = y0 + uy * endL;
  const tiesEl = [];
  for (let i = 0; i < Math.ceil(n); i++) {
    const frac = Math.min(1, n - i);
    const cx = x0 + ux * step * (i + 0.5), cy = y0 + uy * step * (i + 0.5);
    const dashed = dashedFrom !== undefined && i >= dashedFrom;
    if (i < emptyFirst) {
      tiesEl.push(<path key={i} d={`M ${cx - nx * tl / 2} ${cy - ny * tl / 2} L ${cx + nx * tl / 2} ${cy + ny * tl / 2}`} stroke={RAIL.snowShade} strokeWidth={step * 0.42} strokeDasharray="6 10" opacity={0.7 * frac} />);
      continue;
    }
    tiesEl.push(
      <g key={i} opacity={frac}>
        <path d={`M ${cx - nx * tl / 2 + 3} ${cy - ny * tl / 2 + 5} L ${cx + nx * tl / 2 + 3} ${cy + ny * tl / 2 + 5}`} stroke="#000" strokeOpacity={0.18} strokeWidth={step * 0.42} />
        <path d={`M ${cx - nx * tl / 2} ${cy - ny * tl / 2} L ${cx + nx * tl / 2} ${cy + ny * tl / 2}`} stroke={i === glowTie ? RAIL.amber : dashed ? 'none' : RAIL.tie} strokeWidth={step * 0.42} strokeLinecap="butt" />
        {dashed && <path d={`M ${cx - nx * tl / 2} ${cy - ny * tl / 2} L ${cx + nx * tl / 2} ${cy + ny * tl / 2}`} stroke={RAIL.tie} strokeWidth={step * 0.42} strokeDasharray="10 8" opacity={0.65} />}
        <path d={`M ${cx - nx * tl / 2} ${cy - ny * tl / 2} L ${cx + nx * tl / 2} ${cy + ny * tl / 2}`} stroke={INK} strokeWidth={2} fill="none" opacity={0.6} transform={`translate(${ux * step * 0.21} ${uy * step * 0.21})`} />
        {tieLabels[i] && (
          <text x={cx + nx * (tl / 2 + 16)} y={cy + ny * (tl / 2 + 16) + labelSize * 0.36} textAnchor={nx >= 0 ? 'start' : 'end'} fontFamily={RMONO} fontWeight={800} fontSize={labelSize} fill={INK}>{tieLabels[i]}</text>
        )}
      </g>,
    );
  }
  return (
    <g>
      {tiesEl}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M ${x0 + ux * step * emptyFirst + nx * s * gauge / 2} ${y0 + uy * step * emptyFirst + ny * s * gauge / 2} L ${ex + nx * s * gauge / 2} ${ey + ny * s * gauge / 2}`} stroke={INK} strokeWidth={11} strokeLinecap="round" opacity={n > emptyFirst ? 1 : 0} />
          <path d={`M ${x0 + ux * step * emptyFirst + nx * s * gauge / 2} ${y0 + uy * step * emptyFirst + ny * s * gauge / 2} L ${ex + nx * s * gauge / 2} ${ey + ny * s * gauge / 2}`} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={n > emptyFirst ? 1 : 0} />
          <path d={`M ${x0 + nx * s * gauge / 2} ${y0 + ny * s * gauge / 2} L ${ex + nx * s * gauge / 2} ${ey + ny * s * gauge / 2}`} stroke={RAIL.rustL} strokeWidth={2} strokeLinecap="round" transform={`translate(${-nx * 1.5} ${-ny * 1.5})`} />
        </g>
      ))}
    </g>
  );
};

/**
 * Boxcar, side view. Origin is the centre of the car at rail-top height. w defaults 420.
 *  - lines     stencil lines on the side (sized by arithmetic to the car)
 *  - doors 0..1 the sliding door opens to show the interior; `inside` draws in the doorway
 *  - travel    px travelled (drives wheel spin)
 *  - dashed    draws a POSSIBLE outline: no fill, ice-blue dashes, no shadow
 *  - brake 0..1 a squash forward
 */
export const Boxcar: React.FC<{x: number; y: number; w?: number; f: number; lines?: string[]; doors?: number; travel?: number; dashed?: boolean;
  brake?: number; color?: string; inside?: React.ReactNode; size?: number; flat?: boolean}> =
({x, y, w = 420, f, lines = [], doors = 0, travel = 0, dashed = false, brake = 0, color = RAIL.car, inside, size = 26, flat = false}) => {
  const h = flat ? 40 : 190;
  const sway = Math.sin(f / 7 + x * 0.01) * 1.2;
  const rot = travel * 0.9;
  const doorW = w * 0.3;
  const id = uid(`bx${x}${w}${color}`);
  const fs = lines.length ? Math.min(size, ...lines.map((l) => ((w - 50) / (l.length * 0.602 + 0.05)))) : size;
  if (dashed) {
    return (
      <g transform={`translate(${x} ${y})`}>
        <rect x={-w / 2} y={-h - 34} width={w} height={h} rx={6} fill={RAIL.possible} fillOpacity={0.08} stroke={RAIL.possible} strokeWidth={5} strokeDasharray="18 12" />
        {[-w * 0.32, w * 0.32].map((wx) => <circle key={wx} cx={wx} cy={-14} r={22} fill="none" stroke={RAIL.possible} strokeWidth={4} strokeDasharray="8 7" />)}
        {lines.map((l, i) => <text key={i} x={0} y={-h - 34 + h / 2 + (i - (lines.length - 1) / 2) * (fs + 10) + fs * 0.36} textAnchor="middle" fontFamily={RMONO} fontWeight={800} fontSize={fs} letterSpacing={1.5} fill={RAIL.possible} stroke={INK} strokeWidth={0.8}>{l}</text>)}
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${sway * 0.3}) skewX(${-brake * 6})`}>
      <ContactShadow cx={0} cy={4} rx={w * 0.5} ry={10} opacity={0.35} />
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={RAIL.carL} /><stop offset="0.6" stopColor={color} /><stop offset="1" stopColor={RAIL.carD} />
        </linearGradient>
      </defs>
      {/* trucks and wheels */}
      {[-w * 0.32, w * 0.32].map((wx) => (
        <g key={wx}>
          <rect x={wx - 46} y={-30} width={92} height={18} rx={4} fill={RAIL.iron} stroke={INK} strokeWidth={4} />
          {[-24, 24].map((o) => (
            <g key={o} transform={`translate(${wx + o} -12) rotate(${rot})`}>
              <circle r={18} fill="#2A2D31" stroke={INK} strokeWidth={4} />
              <path d="M -14 0 H 14 M 0 -14 V 14" stroke="#6A7077" strokeWidth={3} />
              <circle r={5} fill="#8C949C" />
            </g>
          ))}
        </g>
      ))}
      {/* body */}
      <rect x={-w / 2} y={-h - 34} width={w} height={h} rx={5} fill={`url(#${id}c)`} stroke={INK} strokeWidth={6} />
      {!flat && Array.from({length: Math.floor(w / 36)}, (_, i) => <path key={i} d={`M ${-w / 2 + 18 + i * 36} ${-h - 30} V ${-38}`} stroke={RAIL.carD} strokeWidth={2} opacity={0.55} />)}
      <rect x={-w / 2} y={-h - 34} width={w} height={10} fill={RAIL.carD} opacity={0.6} />
      {!flat && (
        <g>
          <rect x={-doorW / 2} y={-h - 24} width={doorW} height={h - 18} fill="#2A1712" stroke={INK} strokeWidth={4} />
          {doors > 0.02 && <g>{inside}</g>}
          <g transform={`translate(${doors * doorW * 1.02} 0)`}>
            <rect x={-doorW / 2} y={-h - 24} width={doorW} height={h - 18} fill={color} stroke={INK} strokeWidth={5} />
            <path d={`M ${-doorW / 2 + 10} ${-h - 14} L ${doorW / 2 - 10} -50 M ${doorW / 2 - 10} ${-h - 14} L ${-doorW / 2 + 10} -50`} stroke={RAIL.carD} strokeWidth={3} opacity={0.6} />
          </g>
        </g>
      )}
      {lines.length > 0 && (
        <g>
          {lines.map((l, i) => {
            const ty = -h - 34 + (flat ? h / 2 : h * 0.3) + (i - (lines.length - 1) / 2) * (fs + 10);
            const tw = rmonoW(l, fs) + 22;
            return (
              <g key={i}>
                <rect x={-tw / 2} y={ty - fs * 0.62} width={tw} height={fs + 10} rx={3} fill={RAIL.paper} stroke={INK} strokeWidth={3} />
                <text x={0} y={ty + fs * 0.36 - 2} textAnchor="middle" fontFamily={RMONO} fontWeight={900} fontSize={fs} letterSpacing={1.5} fill={INK}>{l}</text>
              </g>
            );
          })}
        </g>
      )}
      <path d={`M ${-w / 2 + 6} ${-h - 28} H ${w / 2 - 6}`} stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={4} />
    </g>
  );
};

/** FreightScale: a platform scale with a dial; `needle` 0..1 sweeps the dial; `word` paints the dial label. Origin foot centre. */
export const FreightScale: React.FC<{x: number; y: number; scale?: number; f: number; needle?: number; word?: string; children?: React.ReactNode}> =
({x, y, scale = 1, f, needle = 0, word = '', children}) => {
  const a = -120 + 240 * clamp01(needle) + Math.sin(f / 3) * 2 * clamp01(needle);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={230} ry={14} opacity={0.4} />
      <rect x={-210} y={-50} width={420} height={50} rx={6} fill={RAIL.iron} stroke={INK} strokeWidth={5} />
      <rect x={-200} y={-64} width={400} height={18} rx={4} fill={RAIL.ironL} stroke={INK} strokeWidth={4} />
      {children}
      <rect x={200} y={-300} width={20} height={250} fill={RAIL.iron} stroke={INK} strokeWidth={4} />
      <g transform="translate(210 -330)">
        <circle r={88} fill={RAIL.paper} stroke={INK} strokeWidth={7} />
        {Array.from({length: 13}, (_, i) => {
          const t = (-120 + i * 20) * Math.PI / 180;
          return <path key={i} d={`M ${Math.sin(t) * 70} ${-Math.cos(t) * 70} L ${Math.sin(t) * 80} ${-Math.cos(t) * 80}`} stroke={INK} strokeWidth={i % 3 === 0 ? 4 : 2} />;
        })}
        <path d="M 0 0 L 0 -66" stroke={RAIL.vermilion} strokeWidth={6} strokeLinecap="round" transform={`rotate(${a})`} />
        <circle r={8} fill={INK} />
        {word && <text x={0} y={44} textAnchor="middle" fontFamily={RMONO} fontWeight={800} fontSize={Math.min(18, 140 / (word.length * 0.602))} fill={INK}>{word}</text>}
      </g>
    </g>
  );
};

/** MailSack: tied canvas sack with a stencil. Origin is the bottom centre. `drop` 0..1 falls from above and squashes. */
export const MailSack: React.FC<{x: number; y: number; scale?: number; f: number; drop?: number; text?: string; seed?: number}> = ({x, y, scale = 1, f, drop = 1, text = '', seed = 1}) => {
  const k = clamp01(drop);
  if (k <= 0) return null;
  const fall = k < 0.6 ? (1 - k / 0.6) * -700 : 0;
  const s2 = k < 0.6 ? 1 : 1 - 0.2 * Math.exp(-6 * (k - 0.6) / 0.4) * Math.cos(12 * (k - 0.6) / 0.4);
  const lean = (h01(seed) - 0.5) * 16 + Math.sin(f / 31 + seed) * 1.5;
  return (
    <g transform={`translate(${x} ${y + fall}) rotate(${lean}) scale(${scale / Math.sqrt(s2)} ${scale * s2})`}>
      <ContactShadow cx={0} cy={2} rx={70} ry={10} opacity={0.35} />
      <path d="M -70 0 Q -82 -80 -40 -120 L -18 -150 L 18 -150 L 40 -120 Q 82 -80 70 0 Z" fill="#CDB98E" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M -40 -40 Q -58 -80 -30 -112" stroke="#A8936A" strokeWidth={4} fill="none" />
      <path d="M 60 -20 Q 70 -70 40 -110" stroke="#F0E2BC" strokeWidth={5} fill="none" opacity={0.8} />
      <path d="M -24 -150 Q 0 -140 24 -150 M -10 -150 L -22 -176 M 10 -150 L 24 -174" stroke={INK} strokeWidth={4} fill="none" />
      {text && <text x={0} y={-60} textAnchor="middle" fontFamily={RMONO} fontWeight={900} fontSize={20} fill={INK} opacity={0.8}>{text}</text>}
    </g>
  );
};

/** BufferStop: a track-end buffer with a plate. Origin foot centre. */
export const BufferStop: React.FC<{x: number; y: number; scale?: number; plate?: string; plateSize?: number; f: number}> = ({x, y, scale = 1, plate = '', plateSize = 24, f}) => {
  const pw = plate ? rmonoW(plate, plateSize) + 30 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={140} ry={12} opacity={0.4} />
      <path d="M -120 0 L -80 -150 L 80 -150 L 120 0 Z" fill={RAIL.tie} stroke={INK} strokeWidth={5} />
      <rect x={-110} y={-190} width={220} height={52} rx={6} fill={RAIL.vermilion} stroke={INK} strokeWidth={5} />
      {[-70, 70].map((bx) => <g key={bx}><rect x={bx - 22} y={-176} width={44} height={24} rx={10} fill={RAIL.iron} stroke={INK} strokeWidth={3} /><circle cx={bx} cy={-164} r={6} fill={RAIL.ironL} /></g>)}
      {[-1, 0, 1].map((i) => <path key={i} d={`M ${i * 60 - 20} -138 l 40 0`} stroke={RAIL.paper} strokeWidth={6} />)}
      {plate && (
        <g transform={`translate(0 -232) rotate(${Math.sin(f / 29) * 1.2})`}>
          <path d="M -30 0 V 40 M 30 0 V 40" stroke={INK} strokeWidth={4} />
          <rect x={-pw / 2} y={-plateSize - 14} width={pw} height={plateSize + 26} rx={6} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
          <text x={0} y={-plateSize / 2 + plateSize * 0.36} textAnchor="middle" fontFamily={RMONO} fontWeight={900} fontSize={plateSize} letterSpacing={1.5} fill={INK}>{plate}</text>
        </g>
      )}
    </g>
  );
};

/** a birch trunk with lenticels and a little crown of bare twigs. Origin foot. */
export const Birch: React.FC<{x: number; y: number; h?: number; seed?: number; f: number; lean?: number}> = ({x, y, h = 520, seed = 1, f, lean = 0}) => {
  const sw = Math.sin(f / 40 + seed) * 1.2 + lean;
  const w = 16 + h01(seed) * 10;
  return (
    <g transform={`translate(${x} ${y}) rotate(${sw})`}>
      <path d={`M ${-w / 2} 0 L ${-w / 2 + 3} ${-h} L ${w / 2 - 3} ${-h} L ${w / 2} 0 Z`} fill={RAIL.birch} stroke={INK} strokeWidth={4} />
      <path d={`M ${-w / 2 + 3} 0 L ${-w / 2 + 5} ${-h}`} stroke={RAIL.snowShade} strokeWidth={w * 0.35} opacity={0.6} />
      {Array.from({length: Math.floor(h / 34)}, (_, i) => (
        <path key={i} d={`M ${-w / 2 + 2 + h01(i, seed) * 4} ${-20 - i * 34 - h01(i, seed + 2) * 14} h ${w * (0.3 + h01(i, seed + 4) * 0.4)}`} stroke={RAIL.lenticel} strokeWidth={3 + h01(i, seed + 5) * 2} strokeLinecap="round" />
      ))}
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M 0 ${-h + 10} q ${(i - 1.5) * 40} -60 ${(i - 1.5) * 70} ${-110 - i * 10}`} stroke="#6B5A55" strokeWidth={3} fill="none" opacity={0.8} />)}
    </g>
  );
};

/** a spruce silhouette (ink-outlined stacked tiers with a snow load). Origin foot. */
export const Spruce: React.FC<{x: number; y: number; h?: number; seed?: number; snow?: boolean; tone?: string}> = ({x, y, h = 260, seed = 1, snow = true, tone = RAIL.spruce}) => {
  const tiers = 6;
  const w = h * 0.34;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-5} y={-20} width={10} height={24} fill="#3B2A20" stroke={INK} strokeWidth={2} />
      {Array.from({length: tiers}, (_, i) => {
        const ty = -20 - (i * (h - 30)) / tiers, tw = w * (1 - i / (tiers + 1)) * (0.9 + h01(i, seed) * 0.2);
        return (
          <g key={i}>
            <path d={`M ${-tw} ${ty} L 0 ${ty - h / tiers * 1.5} L ${tw} ${ty} Z`} fill={tone} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            {snow && <path d={`M ${-tw * 0.8} ${ty - 2} q ${tw * 0.4} -10 ${tw * 0.8} -6 q ${tw * 0.4} 4 ${tw * 0.7} -4`} stroke={RAIL.snow} strokeWidth={6} fill="none" strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
  );
};

/**
 * SusitnaBG. The exterior: sky from lemon horizon to lake slate, the low sun, the Talkeetnas, a far spruce line,
 * birch, and the snow ground from `ground` y down. `drift` is a parallax offset (px). `seed` varies the range.
 */
export const SusitnaBG: React.FC<{f: number; ground?: number; seed?: number; drift?: number; sunX?: number; birches?: number[]; dim?: number; range?: boolean}> =
({f, ground = 1180, seed = 1, drift = 0, sunX = 860, birches = [], dim = 0, range = true}) => {
  const id = uid(`sus${seed}${ground}`);
  const peaks = Array.from({length: 9}, (_, i) => ({x: -80 + i * 160 + h01(i, seed) * 60, y: ground - 300 - h01(i, seed + 1) * 260}));
  const range1 = `M -100 ${ground - 120} ` + peaks.map((p, i) => `L ${p.x - 70} ${p.y + 120 + h01(i, seed + 3) * 40} L ${p.x} ${p.y}`).join(' ') + ` L 1200 ${ground - 140} L 1200 ${ground} L -100 ${ground} Z`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={RAIL.sky2} /><stop offset="0.55" stopColor={RAIL.sky1} /><stop offset="0.92" stopColor={RAIL.sky0} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E7EDF1" /><stop offset="1" stopColor={RAIL.snow} />
        </linearGradient>
        <radialGradient id={`${id}sun`}>
          <stop offset="0" stopColor={RAIL.sun} stopOpacity={1} /><stop offset="0.3" stopColor={RAIL.sun} stopOpacity={0.6} /><stop offset="1" stopColor={RAIL.sun} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-200} y={-60} width={1480} height={ground + 80} fill={`url(#${id}s)`} data-band="ok" />
      <circle cx={sunX + drift * 0.1} cy={ground - 200} r={220} fill={`url(#${id}sun)`} data-band="ok" />
      <circle cx={sunX + drift * 0.1} cy={ground - 200} r={36} fill={RAIL.sun} stroke="#F1D98A" strokeWidth={3} data-band="ok" />
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={((i * 420 + f * (0.25 + i * 0.1) + seed * 90) % 1500) - 200} cy={ground - 620 - i * 160} rx={170 + i * 30} ry={26} fill="#FFFFFF" opacity={0.35} data-band="ok" />
      ))}
      {range && (
        <g transform={`translate(${drift * 0.2} 0)`} data-band="ok">
          <path d={range1} fill="#9DB3C4" stroke={INK} strokeWidth={3} strokeLinejoin="round" opacity={0.95} />
          {peaks.map((p, i) => <path key={i} d={`M ${p.x} ${p.y} L ${p.x - 40} ${p.y + 70} L ${p.x - 10} ${p.y + 58} L ${p.x + 18} ${p.y + 82} L ${p.x + 44} ${p.y + 62} Z`} fill="#F7F7F2" stroke={INK} strokeWidth={2} />)}
          {peaks.map((p, i) => <path key={`s${i}`} d={`M ${p.x} ${p.y} L ${p.x - 70} ${p.y + 120}`} stroke="#7F97AA" strokeWidth={10} opacity={0.5} />)}
        </g>
      )}
      <g transform={`translate(${drift * 0.45} 0)`} data-band="ok">
        {Array.from({length: 24}, (_, i) => (
          <Spruce key={i} x={-120 + i * 58 + h01(i, seed + 7) * 30} y={ground + 6} h={110 + h01(i, seed + 8) * 90} seed={i + seed} tone={i % 3 ? RAIL.spruce : RAIL.spruceL} />
        ))}
      </g>
      <rect x={-200} y={ground} width={1480} height={1920 - ground + 60} fill={`url(#${id}g)`} data-band="ok" />
      {Array.from({length: 18}, (_, i) => (
        <path key={i} d={`M ${-100 + h01(i, seed + 9) * 1300} ${ground + 40 + h01(i, seed + 10) * (1880 - ground)} q 60 -10 120 0`} stroke={RAIL.snowShade} strokeWidth={4} fill="none" opacity={0.45} data-band="ok" />
      ))}
      <g transform={`translate(${drift * 0.7} 0)`} data-band="ok">
        {birches.map((bx, i) => <Birch key={i} x={bx} y={ground + 30 + h01(i, seed + 11) * 40} h={440 + h01(i, seed + 12) * 180} seed={i + seed * 3} f={f} />)}
      </g>
      {Array.from({length: 26}, (_, i) => {
        const tw = Math.sin(f / 5 + i * 1.7);
        return tw > 0.6 ? <path key={`sp${i}`} d={`M ${h01(i, seed + 13) * 1080} ${ground + 30 + h01(i, seed + 14) * (1900 - ground)} m -6 0 h 12 m -6 -6 v 12`} stroke="#FFFFFF" strokeWidth={2.5} opacity={(tw - 0.6) * 2.5} data-band="ok" /> : null;
      })}
      {dim > 0 && <rect x={-200} y={-60} width={1480} height={2040} fill="#1A2530" opacity={dim} data-band="ok" />}
    </g>
  );
};

/** SnowBank: the near plane, ink-outlined drifts with tufts and sparkle, from y down to the frame bottom. */
export const SnowBank: React.FC<{f: number; y?: number; seed?: number; drift?: number; tufts?: boolean; railEnds?: boolean}> = ({f, y = 1500, seed = 2, drift = 0, tufts = true, railEnds = false}) => {
  const pts = Array.from({length: 9}, (_, i) => ({x: -120 + i * 170 + h01(i, seed) * 50, y: y - 20 - h01(i, seed + 1) * 60}));
  const d = `M -200 1990 L -200 ${y} ` + pts.map((p) => `Q ${p.x - 60} ${p.y - 30} ${p.x} ${p.y}`).join(' ') + ` Q 1200 ${y - 40} 1300 ${y} L 1300 1990 Z`;
  return (
    <g transform={`translate(${drift} 0)`} data-band="ok">
      <path d={d} fill={RAIL.snow} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {pts.map((p, i) => <path key={i} d={`M ${p.x - 70} ${p.y + 40} q 50 30 120 6`} stroke={RAIL.snowShade} strokeWidth={10} fill="none" opacity={0.55} />)}
      {pts.map((p, i) => <path key={`c${i}`} d={`M ${p.x - 30} ${p.y + 6} q 30 -12 60 -2`} stroke={RAIL.catchWarm} strokeWidth={5} fill="none" opacity={0.7} />)}
      {tufts && pts.map((p, i) => i % 2 === 0 ? (
        <g key={`t${i}`} transform={`translate(${p.x + 30} ${p.y + 4})`}>
          {[-8, 0, 8].map((o, j) => <path key={j} d={`M ${o} 0 q ${2 + Math.sin(f / 17 + i + j) * 3} -20 ${o * 0.6 + 4} -38`} stroke="#8C7A55" strokeWidth={3} fill="none" strokeLinecap="round" />)}
        </g>
      ) : null)}
      {railEnds && [300, 760].map((rx) => <g key={rx}><path d={`M ${rx} 1990 L ${rx + 40} ${y + 30}`} stroke={INK} strokeWidth={14} /><path d={`M ${rx} 1990 L ${rx + 40} ${y + 30}`} stroke={RAIL.rust} strokeWidth={8} /></g>)}
      {Array.from({length: 14}, (_, i) => {
        const tw = Math.sin(f / 4 + i * 2.1);
        return tw > 0.5 ? <path key={`s${i}`} d={`M ${h01(i, seed + 5) * 1080} ${y + 60 + h01(i, seed + 6) * 300} m -7 0 h 14 m -7 -7 v 14`} stroke="#FFFFFF" strokeWidth={3} opacity={(tw - 0.5) * 2} /> : null;
      })}
    </g>
  );
};

/** WallClock: a FACELESS wall clock. `hours` is clock time as a decimal (10.5 = 10:30). Origin centre. */
export const WallClock: React.FC<{x: number; y: number; r?: number; hours: number; f: number}> = ({x, y, r = 90, hours, f}) => {
  const hA = ((hours % 12) / 12) * 360, mA = ((hours % 1) * 360);
  return (
    <g transform={`translate(${x} ${y}) rotate(${Math.sin(f / 50) * 0.6})`}>
      <circle cx={6} cy={8} r={r + 10} fill="#000" opacity={0.25} />
      <circle r={r + 10} fill={RAIL.walnut} stroke={INK} strokeWidth={6} />
      <circle r={r} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
      {Array.from({length: 12}, (_, i) => {
        const t = (i * 30 * Math.PI) / 180;
        return <path key={i} d={`M ${Math.sin(t) * r * 0.78} ${-Math.cos(t) * r * 0.78} L ${Math.sin(t) * r * 0.92} ${-Math.cos(t) * r * 0.92}`} stroke={INK} strokeWidth={i % 3 === 0 ? 6 : 3} />;
      })}
      <path d={`M 0 0 L 0 ${-r * 0.5}`} stroke={INK} strokeWidth={9} strokeLinecap="round" transform={`rotate(${hA})`} />
      <path d={`M 0 0 L 0 ${-r * 0.78}`} stroke={INK} strokeWidth={5} strokeLinecap="round" transform={`rotate(${mA})`} />
      <circle r={8} fill={RAIL.vermilion} stroke={INK} strokeWidth={2} />
      <path d={`M ${-r * 0.6} ${-r * 0.55} q ${r * 0.3} ${-r * 0.3} ${r * 0.7} ${-r * 0.32}`} stroke="#FFFFFF" strokeWidth={6} fill="none" opacity={0.5} />
    </g>
  );
};

/** Boardroom: a slate wall from the top edge, a frosted window onto the inlet, a door with a sign, a walnut table front. */
export const Boardroom: React.FC<{f: number; table?: number; doorSign?: string; doorOpen?: number; windowLit?: number; chairs?: number}> =
({f, table = 1260, doorSign = '', doorOpen = 0, windowLit = 1, chairs = 5}) => {
  const id = uid(`br${table}`);
  return (
    <g data-band="ok">
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F3A41" /><stop offset="1" stopColor={RAIL.wallL} /></linearGradient>
        <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FC3D6" /><stop offset="0.7" stopColor={RAIL.sky0} /><stop offset="1" stopColor="#D9E6EC" /></linearGradient>
        <radialGradient id={`${id}l`}><stop offset="0" stopColor={RAIL.lamp} stopOpacity={0.55} /><stop offset="1" stopColor={RAIL.lamp} stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={-200} y={-60} width={1480} height={table + 80} fill={`url(#${id}w)`} />
      {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${-40 + i * 140} -60 V ${table}`} stroke="#2A343A" strokeWidth={3} opacity={0.5} />)}
      {/* window onto the inlet */}
      <g transform="translate(180 560)">
        <rect x={-10} y={-10} width={420} height={360} rx={6} fill={RAIL.walnutD} stroke={INK} strokeWidth={6} />
        <rect x={0} y={0} width={400} height={340} fill={`url(#${id}v)`} />
        <path d="M 0 210 L 70 150 L 120 180 L 190 110 L 250 170 L 320 130 L 400 190 L 400 340 L 0 340 Z" fill="#B7C9D6" stroke={INK} strokeWidth={2} />
        <path d="M 0 260 H 400 V 340 H 0 Z" fill="#7FA2B8" opacity={0.85} />
        {[0, 1, 2].map((i) => <path key={i} d={`M ${30 + i * 130 + Math.sin(f / 30 + i) * 6} 290 h 60`} stroke="#E5F0F5" strokeWidth={3} opacity={0.7} />)}
        <path d="M 200 0 V 340 M 0 170 H 400" stroke={RAIL.walnutD} strokeWidth={10} />
        <path d="M 0 0 L 90 0 Q 40 30 0 80 Z M 400 340 L 300 340 Q 360 300 400 250 Z" fill="#FFFFFF" opacity={0.55 * windowLit} />
      </g>
      {/* door */}
      <g transform="translate(760 560)">
        <rect x={-10} y={-10} width={220} height={710} fill={RAIL.walnutD} stroke={INK} strokeWidth={6} />
        <rect x={0} y={0} width={200} height={690} fill="#1E2428" />
        <g transform={`translate(${doorOpen * 0} 0) scale(${1 - doorOpen * 0.7} 1)`}>
          <rect x={0} y={0} width={200} height={690} fill={RAIL.walnut} stroke={INK} strokeWidth={5} />
          <rect x={24} y={40} width={152} height={250} rx={4} fill="none" stroke={RAIL.walnutD} strokeWidth={4} />
          <rect x={24} y={340} width={152} height={300} rx={4} fill="none" stroke={RAIL.walnutD} strokeWidth={4} />
          <circle cx={172} cy={330} r={10} fill={RAIL.lemon} stroke={INK} strokeWidth={3} />
        </g>
        {doorSign && (
          <g transform={`translate(100 180) rotate(${Math.sin(f / 13) * 2})`}>
            <path d="M -40 -60 L 0 -90 L 40 -60" stroke={INK} strokeWidth={3} fill="none" />
            <rect x={-(rmonoW(doorSign, 22) + 28) / 2} y={-60} width={rmonoW(doorSign, 22) + 28} height={52} rx={6} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
            <text x={0} y={-34 + 8} textAnchor="middle" fontFamily={RMONO} fontWeight={900} fontSize={22} fill={INK}>{doorSign}</text>
          </g>
        )}
      </g>
      <circle cx={540} cy={table - 60} r={420} fill={`url(#${id}l)`} />
      {/* chairs behind the table */}
      {Array.from({length: chairs}, (_, i) => (
        <g key={i} transform={`translate(${170 + i * (740 / Math.max(1, chairs - 1))} ${table - 40})`}>
          <rect x={-46} y={-150} width={92} height={150} rx={18} fill="#2B2F35" stroke={INK} strokeWidth={4} />
          <rect x={-36} y={-140} width={30} height={120} rx={10} fill="#3C424A" opacity={0.8} />
        </g>
      ))}
      {/* table front */}
      <rect x={-200} y={table} width={1480} height={1990 - table} fill={RAIL.walnutD} />
      <rect x={-200} y={table} width={1480} height={46} fill={RAIL.walnut} stroke={INK} strokeWidth={6} />
      {Array.from({length: 7}, (_, i) => <path key={i} d={`M ${-100 + i * 200} ${table + 70} q 80 10 180 -4`} stroke="#6E5A3C" strokeWidth={4} fill="none" opacity={0.6} />)}
      <path d={`M -200 ${table + 6} H 1280`} stroke="#F6E7C8" strokeWidth={4} opacity={0.7} />
    </g>
  );
};

/** SignalLamp: a lamp head on a mast with a lit lens and a word under it. Origin foot. */
export const SignalLamp: React.FC<{x: number; y: number; scale?: number; f: number; lit?: number; word?: string; color?: string}> = ({x, y, scale = 1, f, lit = 0, word = '', color = RAIL.amber}) => {
  const k = clamp01(lit);
  const ww = word ? rmonoW(word, 26) + 30 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={40} ry={8} opacity={0.4} />
      <rect x={-8} y={-230} width={16} height={230} fill={RAIL.iron} stroke={INK} strokeWidth={4} />
      <rect x={-40} y={-300} width={80} height={80} rx={14} fill={RAIL.iron} stroke={INK} strokeWidth={5} />
      <circle cx={0} cy={-260} r={26} fill={k > 0.05 ? color : '#4A4D52'} stroke={INK} strokeWidth={4} />
      {k > 0.05 && <circle cx={0} cy={-260} r={60 + 6 * Math.sin(f / 5)} fill={color} opacity={0.28 * k} />}
      <path d="M -44 -300 h 88 l -12 -16 h -64 Z" fill={RAIL.iron} stroke={INK} strokeWidth={3} />
      {word && k > 0.05 && (
        <g opacity={k}>
          <rect x={-ww / 2} y={-200} width={ww} height={46} rx={6} fill={color} stroke={INK} strokeWidth={4} />
          <text x={0} y={-168} textAnchor="middle" fontFamily={RMONO} fontWeight={900} fontSize={26} letterSpacing={2} fill="#FFFFFF">{word}</text>
        </g>
      )}
    </g>
  );
};

/** Billboard: a painted board on two posts with a quote and an attribution line, sized by arithmetic. Origin foot centre. */
export const Billboard: React.FC<{x: number; y: number; scale?: number; f: number; lines: string[]; attrib?: string; size?: number; stamp?: string}> = ({x, y, scale = 1, f, lines, attrib = '', size = 30, stamp = ''}) => {
  const w = Math.max(...lines.map((l) => rmonoW(l, size)), attrib ? rmonoW(attrib, 20) : 0) + 70;
  const h = lines.length * (size + 14) + (attrib ? 50 : 20) + 30;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={w * 0.45} ry={12} opacity={0.35} />
      {[-w * 0.3, w * 0.3].map((px) => <rect key={px} x={px - 10} y={-260} width={20} height={262} fill={RAIL.tie} stroke={INK} strokeWidth={4} />)}
      <g transform={`translate(0 ${-240 - h / 2}) rotate(${Math.sin(f / 37) * 0.5})`}>
        <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} rx={6} fill="#000" opacity={0.25} />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={RAIL.paper} stroke={INK} strokeWidth={6} />
        <text x={-w / 2 + 24} y={-h / 2 + 58} fontFamily="Fraunces, serif" fontWeight={900} fontSize={64} fill={RAIL.amber}>"</text>
        {lines.map((l, i) => (
          <text key={i} x={0} y={-h / 2 + 30 + (i + 0.5) * (size + 14) + size * 0.36} textAnchor="middle" fontFamily={RMONO} fontWeight={900} fontSize={size} letterSpacing={1.5} fill={INK}>{l}</text>
        ))}
        {attrib && <text x={0} y={h / 2 - 22} textAnchor="middle" fontFamily={RMONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#5A6670">{attrib}</text>}
        {stamp && (
          <g transform={`translate(${w / 2 - 70} ${-h / 2 - 6}) rotate(10)`}>
            <rect x={-(rmonoW(stamp, 22) + 24) / 2} y={-22} width={rmonoW(stamp, 22) + 24} height={44} rx={6} fill="none" stroke={RAIL.vermilion} strokeWidth={5} />
            <text x={0} y={8} textAnchor="middle" fontFamily={RMONO} fontWeight={900} fontSize={22} fill={RAIL.vermilion}>{stamp}</text>
          </g>
        )}
      </g>
    </g>
  );
};

/** Diesel: a plain faceless modern road diesel, side view, facing `dir` (1 = right). Origin is centre at rail-top. */
export const Diesel: React.FC<{x: number; y: number; w?: number; f: number; travel?: number; dir?: 1 | -1; puff?: number; label?: string}> = ({x, y, w = 460, f, travel = 0, dir = 1, puff = 0, label = ''}) => {
  const rot = travel * 0.9;
  const id = uid(`ds${x}${w}`);
  const sway = Math.sin(f / 6 + x * 0.01) * 0.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${dir} 1) rotate(${sway})`}>
      <ContactShadow cx={0} cy={4} rx={w * 0.5} ry={10} opacity={0.35} />
      <defs><linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C838B" /><stop offset="0.55" stopColor={RAIL.iron} /><stop offset="1" stopColor="#24272B" /></linearGradient></defs>
      {[-w * 0.3, w * 0.3].map((wx) => (
        <g key={wx}>
          <rect x={wx - 70} y={-34} width={140} height={22} rx={5} fill="#2A2D31" stroke={INK} strokeWidth={4} />
          {[-44, 0, 44].map((o) => (
            <g key={o} transform={`translate(${wx + o} -12) rotate(${rot})`}><circle r={18} fill="#2A2D31" stroke={INK} strokeWidth={4} /><path d="M -13 0 H 13 M 0 -13 V 13" stroke="#6A7077" strokeWidth={3} /></g>
          ))}
        </g>
      ))}
      <rect x={-w / 2} y={-62} width={w} height={26} rx={4} fill="#2F3338" stroke={INK} strokeWidth={5} />
      <path d={`M ${-w / 2 + 10} -62 L ${-w / 2 + 10} -190 L ${w * 0.22} -190 L ${w * 0.22} -232 L ${w / 2 - 30} -232 Q ${w / 2 - 6} -232 ${w / 2 - 6} -206 L ${w / 2 - 6} -62 Z`} fill={`url(#${id}b)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-w / 2 + 10} y={-120} width={w * 0.72 + w / 2 - 10 - 10} height={18} fill={RAIL.paper} opacity={0.9} />
      <rect x={w * 0.26} y={-222} width={w / 2 - 30 - w * 0.26 - 10} height={46} rx={4} fill="#BFD3DC" stroke={INK} strokeWidth={4} />
      <path d={`M ${w * 0.28} -218 l 20 0 l -30 38`} stroke="#FFFFFF" strokeWidth={4} opacity={0.5} fill="none" />
      {Array.from({length: 6}, (_, i) => <rect key={i} x={-w / 2 + 30 + i * 44} y={-176} width={30} height={40} rx={3} fill="#4A5056" stroke={INK} strokeWidth={2} />)}
      <circle cx={w / 2 - 10} cy={-90} r={10} fill={RAIL.lemon} stroke={INK} strokeWidth={3} />
      <path d={`M ${-w / 2 + 10} -186 H ${w * 0.22}`} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={4} />
      {label && <text x={-w * 0.1} y={-140} textAnchor="middle" fontFamily={RMONO} fontWeight={900} fontSize={24} letterSpacing={2} fill={RAIL.paper} transform={dir < 0 ? `scale(-1 1) translate(${w * 0.2} 0)` : undefined}>{label}</text>}
      {puff > 0.02 && [0, 1, 2].map((i) => (
        <circle key={i} cx={-w * 0.05 + i * 16} cy={-200 - puff * 60 - i * 20} r={14 + puff * 20 + i * 6} fill="#E8EAEC" stroke={INK} strokeWidth={2} opacity={(1 - puff) * 0.8} />
      ))}
    </g>
  );
};
