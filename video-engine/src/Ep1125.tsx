import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, ContactShadow} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {MONO, monoW} from './lib/prospect';
import {HeldTravel} from './lib/heldidle';
import {Suit} from './lib/people';
import {Lectern} from './lib/ballot';
import {SurveyStake} from './lib/forest';
import {
  RAIL, SwitchStand, RailLine, Boxcar, Diesel, FreightScale, MailSack, BufferStop, SusitnaBG, SnowBank, Boardroom, WallClock, SignalLamp, Billboard,
} from './lib/rail';
import {IDS} from './Ep1125Ids';

// The Other Track, 2026-11-25. Palette roles are art_direction.json: bone haze over crusted snow at a hard low noon sun, lake-blue ONLY in the
// cast shadows that carry meaning, birch, spruce, rail rust; railway signal AMBER is the only saturated warm and belongs to the switch lamp and
// the land's dates (NOVEMBER 30TH, 30 DAYS); AIDEA-side dates are bone or ink. The faceless switch stand is the protagonist. The DNR branch
// always diverges to frame LEFT and runs off the edge (open); the AIDEA BOARD branch goes RIGHT to a buffer stop (closed). Named people are
// Suits with face={false} and boxed name cards. Nothing data center is ever drawn built; POSSIBLE is an empty siding or an empty car.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
const INK = RAIL.ink;
const C = {ink: INK, paper: RAIL.paper, bg: RAIL.sky1};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** spring 0..1 with overshoot that starts at frame a */
const spr = (f: number, a: number, d = 16) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.exp(-6 * t) * Math.cos(9 * t);
};

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'plate' | 'dark' | 'amber';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  plate: {fill: RAIL.paper, fg: INK, edge: INK},
  dark: {fill: '#2E3436', fg: '#F3EDE0', edge: '#F3EDE0'},
  amber: {fill: RAIL.amber, fg: INK, edge: INK},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> =
({text, displayLines, x = 540, y, size = 32, tone = 'plate', p = 1, rot = 0}) => {
  const ls = displayLines ?? [text ?? ''];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  const fr = useCurrentFrame();
  if (k <= 0.01) return null;
  const sc = (0.88 + 0.12 * Math.min(1, k * 1.15)) * (1 + 0.01 * Math.sin(fr / 11 + x * 0.01));
  return (
    <g opacity={Math.min(1, k * 1.7)} transform={`translate(${x} ${yy}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={t.edge} strokeWidth={4} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; overlay?: React.ReactNode; bg?: string; warmth?: number; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.18, overlay, bg = C.bg, warmth = 0.03, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: 540 + 12 * Math.sin(p.f / 110) + 8 * t, fy: 960};
  const zz = Math.max(1, c.z);
  const fx = Math.max(540 / zz, Math.min(1080 - 540 / zz, c.fx)), fy = Math.max(960 / zz, Math.min(1920 - 960 / zz, c.fy));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: bg}} />
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - fx * zz}px, ${960 - fy * zz}px) scale(${zz})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#2E3436" stroke="#F3EDE0" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F3EDE0">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.05} warmth={warmth} />
    </AbsoluteFill>
  );
};

/**
 * PTrack: a track on the ground plane seen low, from a near point (xn,yn) of gauge wn to a far point (xf,yf) of gauge wf.
 * Ties shrink toward the far end. `shown` 0..1 lays it from the near end. `buffer` draws a buffer stop at the far end.
 */
const PTrack: React.FC<{xn: number; yn: number; wn: number; xf: number; yf: number; wf: number; ties?: number; shown?: number; seed?: number}> =
({xn, yn, wn, xf, yf, wf, ties = 14, shown = 1}) => {
  const dx = xf - xn, dy = yf - yn, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const pt = (t: number, s: number) => {
    const tt = 1 - Math.pow(1 - t, 1.35);
    const w = lerp(wn, wf, tt);
    return [lerp(xn, xf, tt) + nx * s * w / 2, lerp(yn, yf, tt) + ny * s * w / 2] as const;
  };
  const n = Math.max(0, Math.round(ties * clamp01(shown)));
  const tieEls = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / ties;
    const [ax, ay] = pt(t, -1.3), [bx, by] = pt(t, 1.3);
    const th = lerp(13, 4, t);
    tieEls.push(
      <g key={i}>
        <path d={`M ${ax} ${ay + th * 0.4} L ${bx} ${by + th * 0.4}`} stroke="#000" strokeOpacity={0.18} strokeWidth={th} />
        <path d={`M ${ax} ${ay} L ${bx} ${by}`} stroke={RAIL.tie} strokeWidth={th} />
        <path d={`M ${ax} ${ay - th / 2} L ${bx} ${by - th / 2}`} stroke={RAIL.tieL} strokeWidth={1.5} opacity={0.7} />
      </g>,
    );
  }
  const end = clamp01(shown);
  const rails = [-1, 1].map((s) => {
    const pts = Array.from({length: 12}, (_, i) => pt((i / 11) * end, s));
    const d = pts.map((q, i) => `${i ? 'L' : 'M'} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
    return (
      <g key={s}>
        <path d={d} stroke={INK} strokeWidth={13} fill="none" strokeLinecap="round" />
        <path d={d} stroke={RAIL.rust} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d={d} stroke={RAIL.rustL} strokeWidth={2} fill="none" strokeLinecap="round" transform="translate(0 -2)" />
      </g>
    );
  });
  return <g>{tieEls}{rails}</g>;
};

/** the fork, seen low from the south-west: main track from the bottom to the frog, the OPEN DNR branch off the left edge,
 *  the CLOSED AIDEA branch right to a buffer stop with a window card. */
const Fork: React.FC<{f: number; windowCard?: string; windowLit?: number; openShown?: number; frogX?: number; frogY?: number; bufferX?: number; cardTone?: 'bone' | 'amber'; extra?: React.ReactNode}> =
({f, windowCard = 'AIDEA BOARD', windowLit = 1, openShown = 1, frogX = 600, frogY = 1196, bufferX = 900}) => (
  <g>
    <PTrack xn={560} yn={1960} wn={360} xf={frogX} yf={frogY} wf={130} ties={14} />
    <PTrack xn={frogX} yn={frogY} wn={130} xf={-160} yf={1158} wf={58} ties={16} shown={openShown} />
    <PTrack xn={frogX} yn={frogY} wn={130} xf={bufferX} yf={1172} wf={64} ties={7} />
    <BufferStop x={bufferX + 10} y={1178} scale={0.36} f={f} />
    <g transform={`translate(${bufferX + 10} 1050)`}>
      <path d="M -4 0 V 70" stroke={INK} strokeWidth={4} />
      <rect x={-(monoW(windowCard, 20) + 30) / 2} y={-40} width={monoW(windowCard, 20) + 30} height={44} rx={6} fill={windowLit > 0.5 ? '#F6E7C8' : '#C9C3B4'} stroke={INK} strokeWidth={4} />
      {windowLit > 0.5 && <rect x={-(monoW(windowCard, 20) + 50) / 2} y={-50} width={monoW(windowCard, 20) + 50} height={64} rx={10} fill="#F6E7C8" opacity={0.25 + 0.08 * Math.sin(f / 9)} />}
      <text x={0} y={-12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} letterSpacing={1.5} fill={INK}>{windowCard}</text>
    </g>
  </g>
);

/** the near plane under the caption card: a snowy tie pile, a spike keg and a rail end, varied by seed */
const NearProps: React.FC<{f: number; seed?: number}> = ({f, seed = 1}) => {
  const kind = seed % 3;
  const left = seed % 2 === 0;
  const fence = (
    <g transform={`translate(${left ? 60 : 640} 1720)`}>
      {Array.from({length: 6}, (_, i) => (
        <g key={i} transform={`translate(${i * 70} ${Math.sin(i + seed) * 6})`}>
          <ContactShadow cx={0} cy={60} rx={24} ry={6} opacity={0.35} />
          <rect x={-6} y={-90} width={12} height={150} fill="#6B4A32" stroke={INK} strokeWidth={3} transform={`rotate(${(i % 2 ? 4 : -3)})`} />
        </g>
      ))}
      <path d="M -10 -50 L 360 -60 M -10 0 L 360 -8" stroke="#8A6A4A" strokeWidth={8} />
      <path d="M -20 60 Q 170 20 380 54" stroke={RAIL.snow} strokeWidth={30} fill="none" />
    </g>
  );
  const ties = (
    <g transform={`translate(${left ? 150 : 880} 1690)`}>
      <ContactShadow cx={0} cy={60} rx={170} ry={16} opacity={0.35} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${(i % 2) * 22 - 11} ${-i * 34})`}>
          <rect x={-150} y={0} width={300} height={34} rx={3} fill={RAIL.tie} stroke={INK} strokeWidth={4} />
          <path d={`M -140 10 h 120 M 20 22 h 110`} stroke={RAIL.tieL} strokeWidth={2} opacity={0.7} />
        </g>
      ))}
      <path d="M -160 -100 Q 0 -140 160 -100 L 150 -96 Q 0 -126 -150 -96 Z" fill={RAIL.snow} stroke={INK} strokeWidth={3} />
    </g>
  );
  const keg = (
    <g transform={`translate(${left ? 870 : 210} 1720)`}>
      <ContactShadow cx={0} cy={40} rx={70} ry={10} opacity={0.35} />
      <path d="M -50 40 L -56 -60 Q 0 -76 56 -60 L 50 40 Z" fill="#6B4A32" stroke={INK} strokeWidth={4} />
      {[-30, 0, 30].map((y) => <path key={y} d={`M -54 ${y} H 54`} stroke={RAIL.iron} strokeWidth={6} />)}
      <ellipse cx={0} cy={-62} rx={56} ry={12} fill={RAIL.snow} stroke={INK} strokeWidth={3} />
      {[-20, 0, 18].map((x, i) => <path key={i} d={`M ${x} -64 l ${4 + Math.sin(f / 30 + i) * 2} -26`} stroke={RAIL.iron} strokeWidth={5} strokeLinecap="round" />)}
    </g>
  );
  const lamp = (
    <g transform={`translate(${left ? 880 : 180} 1760)`}>
      <ContactShadow cx={0} cy={4} rx={50} ry={8} opacity={0.35} />
      <rect x={-8} y={-240} width={16} height={244} fill={RAIL.iron} stroke={INK} strokeWidth={3} />
      <rect x={-30} y={-300} width={60} height={62} rx={8} fill={RAIL.iron} stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={-268} r={16} fill={RAIL.lemon} opacity={0.6 + 0.2 * Math.sin(f / 11 + seed)} stroke={INK} strokeWidth={2} />
      <path d="M -60 0 Q 0 -30 60 0" stroke={RAIL.snow} strokeWidth={20} fill="none" />
    </g>
  );
  const rail = (
    <g transform={`translate(540 ${1640 + (seed % 3) * 20}) rotate(${left ? -4 : 4})`}>
      <path d="M -200 0 L 200 -30" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d="M -200 0 L 200 -30" stroke={RAIL.rust} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
  return (
    <g data-band="ok">
      {kind === 0 && <>{fence}{lamp}</>}
      {kind === 1 && <>{ties}{keg}{rail}</>}
      {kind === 2 && <>{rail}{lamp}{ties}</>}
    </g>
  );
};

/** a boxed name card on a short stake (named people are never characterized) */
const NameCard: React.FC<{x: number; y: number; text: string; size?: number; f: number}> = ({x, y, text, size = 22, f}) => {
  const w = monoW(text, size) + 30;
  return (
    <g transform={`translate(${x} ${y}) rotate(${Math.sin(f / 27 + x) * 1.2})`}>
      <ContactShadow cx={0} cy={2} rx={20} ry={5} opacity={0.35} />
      <rect x={-4} y={-70} width={8} height={72} fill={RAIL.tie} stroke={INK} strokeWidth={2.5} />
      <rect x={-w / 2} y={-70 - size - 22} width={w} height={size + 22} rx={5} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
      <text x={0} y={-70 - 11 + size * 0.36 - size / 2 + 2} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={size} letterSpacing={1.5} fill={INK}>{text}</text>
    </g>
  );
};

/** a station slat board on a post that clacks its slats over to a new string */
const SlatBoard: React.FC<{x: number; y: number; from: string; to: string; k: number; f: number}> = ({x, y, from, to, k, f}) => {
  const s = clamp01(k);
  const txt = s > 0.5 ? to : from;
  const w = Math.max(monoW(from, 40), monoW(to, 40)) + 50;
  const flipA = Math.abs(Math.cos(Math.PI * s));
  return (
    <g transform={`translate(${x} ${y})`}>
      <ContactShadow cx={0} cy={4} rx={30} ry={6} opacity={0.4} />
      <rect x={-8} y={-300} width={16} height={302} fill={RAIL.iron} stroke={INK} strokeWidth={4} />
      <rect x={-w / 2 - 10} y={-400} width={w + 20} height={110} rx={8} fill="#2E3436" stroke={INK} strokeWidth={5} />
      <g transform={`translate(0 -345) scale(1 ${Math.max(0.08, flipA)})`}>
        <rect x={-w / 2} y={-40} width={w} height={80} rx={4} fill={RAIL.paper} stroke={INK} strokeWidth={3} />
        <path d={`M ${-w / 2} 0 H ${w / 2}`} stroke={INK} strokeWidth={2} opacity={0.5} />
        <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={40} letterSpacing={2} fill={INK}>{txt}</text>
      </g>
      {s > 0.05 && s < 0.95 && <path d={`M ${-w / 2} -385 h ${w}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.6 * Math.sin(f)} />}
    </g>
  );
};

/** a tall train-order hoop on a post: a Y fork that holds a paper order */
const OrderHoop: React.FC<{x: number; y: number; paper: number; f: number}> = ({x, y, paper, f}) => {
  const k = clamp01(paper);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ContactShadow cx={0} cy={4} rx={36} ry={7} opacity={0.4} />
      <rect x={-7} y={-380} width={14} height={382} fill={RAIL.tie} stroke={INK} strokeWidth={4} />
      <path d="M 0 -380 L -60 -500 M 0 -380 L 60 -500" stroke={RAIL.iron} strokeWidth={9} strokeLinecap="round" />
      <path d="M -60 -500 L 60 -500" stroke={RAIL.iron} strokeWidth={5} strokeDasharray="2 10" />
      {k > 0.01 && (
        <g transform={`translate(0 -470) rotate(${Math.sin(f / 7) * 5 * k}) scale(${0.6 + 0.4 * k})`} opacity={Math.min(1, k * 2)}>
          <rect x={-48} y={-36} width={96} height={70} rx={3} fill={RAIL.paper} stroke={INK} strokeWidth={3} />
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M -36 ${-22 + i * 14} h ${60 - i * 6}`} stroke={INK} strokeWidth={3} opacity={0.6} />)}
        </g>
      )}
    </g>
  );
};

/** a water tower at a whistle stop: a wooden tank on legs with a spout and a slow drip */
const WaterTower: React.FC<{x: number; y: number; s?: number; f: number}> = ({x, y, s = 1, f}) => {
  const dp = (f % 40) / 40;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={4} rx={160} ry={14} opacity={0.35} />
      {[-110, -40, 40, 110].map((lx) => <path key={lx} d={`M ${lx} 0 L ${lx * 0.8} -300`} stroke={RAIL.tie} strokeWidth={16} />)}
      <path d="M -100 -60 L 100 -200 M 100 -60 L -100 -200" stroke={RAIL.tie} strokeWidth={6} />
      <rect x={-130} y={-520} width={260} height={230} rx={14} fill="#8A6A4A" stroke={INK} strokeWidth={6} />
      {Array.from({length: 7}, (_, i) => <path key={i} d={`M ${-110 + i * 36} -516 V -294`} stroke="#6E5236" strokeWidth={3} />)}
      {[-470, -400, -330].map((by) => <path key={by} d={`M -132 ${by} H 132`} stroke={RAIL.iron} strokeWidth={7} />)}
      <path d="M -150 -520 L 0 -600 L 150 -520 Z" fill="#5B4636" stroke={INK} strokeWidth={6} />
      <path d="M -140 -522 Q 0 -560 140 -522" stroke={RAIL.snow} strokeWidth={14} fill="none" />
      <path d="M 120 -330 L 220 -300 L 214 -280" stroke={RAIL.iron} strokeWidth={14} fill="none" strokeLinecap="round" />
      {[-90, -30, 40, 100].map((ix, i) => <path key={ix} d={`M ${ix} -292 l 6 ${26 + i * 7} l 6 ${-26 - i * 7}`} fill="#E8F2F6" stroke={INK} strokeWidth={2} />)}
      <circle cx={216} cy={-270 + dp * 90} r={6} fill="#BFD3DC" stroke={INK} strokeWidth={1.5} opacity={1 - dp} />
    </g>
  );
};

/** a covered pie on a plate (the day after Thanksgiving) */
const Pie: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => (
  <g transform={`translate(${x} ${y})`}>
    <ContactShadow cx={0} cy={4} rx={80} ry={10} opacity={0.4} />
    <ellipse cx={0} cy={0} rx={84} ry={18} fill="#F2EFE6" stroke={INK} strokeWidth={4} />
    <path d="M -64 -2 Q -60 -44 0 -48 Q 60 -44 64 -2 Z" fill="#D6DCE0" stroke={INK} strokeWidth={4} />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${-44 + i * 28} -10 l 10 -30`} stroke="#FFFFFF" strokeWidth={3} opacity={0.6 + 0.2 * Math.sin(f / 9 + i)} />)}
  </g>
);

/** a large standing card that slaps down onto a surface */
const TableCard: React.FC<{x: number; y: number; lines: string[]; k: number; size?: number}> = ({x, y, lines, k, size = 26}) => {
  const s = clamp01(k);
  if (s <= 0) return null;
  const w = Math.max(...lines.map((l) => monoW(l, size))) + 40;
  const h = lines.length * (size + 12) + 26;
  return (
    <g transform={`translate(${x} ${lerp(y - 300, y, Math.min(1, s))}) rotate(${(1 - Math.min(1, s)) * -14})`}>
      <ContactShadow cx={0} cy={4} rx={w * 0.5} ry={8} opacity={0.4} />
      <path d={`M ${-w / 2} 0 L ${-w / 2 + 14} ${-h} L ${w / 2 + 14} ${-h} L ${w / 2} 0 Z`} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
      {lines.map((l, i) => <text key={i} x={7} y={-h + 18 + (i + 0.5) * (size + 12) + size * 0.3} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={size} fill={INK}>{l}</text>)}
    </g>
  );
};

/** a boxcar seen from straight above, along a track direction (deg) */
const TopCar: React.FC<{x: number; y: number; rot: number; w?: number; label: string; f: number; tail?: React.ReactNode}> = ({x, y, rot, w = 300, label, f, tail}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-w / 2 + 10} y={-48} width={w} height={104} rx={8} fill="#000" opacity={0.22} />
    <rect x={-w / 2} y={-56} width={w} height={112} rx={8} fill={RAIL.car} stroke={INK} strokeWidth={6} />
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${-w / 2 + 18 + i * ((w - 36) / 8)} -52 V 52`} stroke={RAIL.carD} strokeWidth={2} opacity={0.6} />)}
    <rect x={-w / 2} y={-8} width={w} height={16} fill={RAIL.carL} opacity={0.7} />
    <rect x={-monoW(label, 22) / 2 - 12} y={-22} width={monoW(label, 22) + 24} height={44} rx={4} fill={RAIL.paper} stroke={INK} strokeWidth={3} />
    <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK}>{label}</text>
    <circle cx={-w / 2 + 6} cy={0} r={8 + 2 * Math.sin(f / 3)} fill={RAIL.amber} stroke={INK} strokeWidth={2} />
    {tail}
  </g>
);

// ================================================================== SCENES ==================================================================

// ---- S1: THE FORK (low and wide at noon; the lever slams toward the closed branch, the window card glows, the shadow swings to the open branch)
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slam = spr(f, 4, 14);
  const throwV = lerp(0.62, 0, slam);
  const flare = ease(f, b(3) - 2, 14);
  const mile = spr(f, b(3) + 4, 16);
  const puff = clamp01((f - 10) / 26);
  const gust = clamp01((f - b(40)) / 40);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.06, easeIO(fr, 0, p.dur)), fx: 560, fy: lerp(1020, 990, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <SusitnaBG f={f} ground={1150} seed={3} drift={-f * 0.25} birches={[60, 150, 980]} />
        <Fork f={f} windowLit={ease(f, b(2), 8) + (f > b(40) && f < b(40) + 20 && Math.sin(f) > 0 ? 0.6 : 0)} />
        <HeldTravel f={f} x={300} y={880} w={280} h={460} mode="sweep" seed={1}>
          <SwitchStand x={430} y={1300} scale={1.3} f={f} throw={throwV} turn={0} lamp={0.2 + 0.8 * flare} cues={[b(1) + 6, b(2), b(3)]} shadow={84} shadowLen={lerp(0.7, 1.35, easeIO(f, b(3), 26))} />
        </HeldTravel>
        {puff > 0 && puff < 1 && [0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={560 + (i - 2.5) * 40 * (1 + puff)} cy={1250 - 60 * puff * (1 - puff) * 3 - i % 2 * 10} r={10 * (1 - puff) + 4} fill="#FFFFFF" stroke={INK} strokeWidth={1.5} opacity={1 - puff} />
        ))}
        {gust > 0 && gust < 1 && Array.from({length: 14}, (_, i) => (
          <circle key={`g${i}`} cx={1100 - gust * 1300 + i * 40 + 30 * Math.sin(i)} cy={1180 + (i % 5) * 30 - 40 * Math.sin(gust * 3 + i)} r={5 + (i % 3) * 3} fill="#FFFFFF" opacity={0.7 * (1 - gust)} />
        ))}
        <SnowBank f={f} y={1560} seed={4} drift={f * 0.1} />
        <NearProps f={f} seed={1} />
        <g transform={`translate(130 1150) rotate(${(1 - Math.min(1, mile)) * -80})`} opacity={mile > 0.01 ? 1 : 0}>
          <rect x={-6} y={-150} width={12} height={152} fill={RAIL.tie} stroke={INK} strokeWidth={3} />
          <rect x={-8} y={-200} width={150} height={56} rx={5} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
          <text x={67} y={-178} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>DNR</text>
          <text x={67} y={-154} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={15} fill={INK}>STATE LAND</text>
        </g>
        <Plate x={540} text="12 DAYS TO THE HANDOFF" y={580} p={ease(f, 6, 10)} />
        <Plate x={540} text="NEAR HOUSTON · MAT-SU" y={650} size={28} p={ease(f, b(40) + 4, 10) * (1 - ease(f, b(3), 8))} />
        <Plate x={760} text="AIDEA BOARD" y={720} size={28} p={ease(f, b(2) + 2, 10) * (1 - ease(f, b(3), 8))} />
        <Plate x={420} text="DNR · STATE LAND NEAR HOUSTON" y={790} size={30} tone="amber" p={ease(f, b(3) + 6, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S2: THE REQUEST (the platform; the Suit walks in, the slat board clacks to DEC 7TH, the order goes in the hoop, the brass plate swings out)
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const walkK = easeIO(f, 0, Math.max(10, b(4) + 20));
  const sx = lerp(-80, 470, walkK) - 60 * ease(f, b(6) + 26, 20);
  const reach = ease(f, b(6) - 8, 16) * (1 - ease(f, b(6) + 40, 20));
  const brass = spr(f, b(7), 18);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.02, 1.07, easeIO(fr, 0, p.dur)), fx: lerp(500, 580, easeIO(fr, 0, p.dur)), fy: 980})}>
      <SVG>
        <SusitnaBG f={f} ground={1120} seed={5} drift={-f * 0.3} birches={[90, 1000]} />
        {/* the platform deck and the AIDEA BOARD track in front of it */}
        <g data-band="ok">
          <rect x={-100} y={1250} width={1300} height={70} fill="#7A604A" stroke={INK} strokeWidth={5} />
          {Array.from({length: 18}, (_, i) => <path key={i} d={`M ${-100 + i * 76} 1252 V 1318`} stroke="#5B4636" strokeWidth={3} />)}
          <rect x={-100} y={1248} width={1300} height={10} fill="#F3F1EA" />
        </g>
        <RailLine x0={-100} y0={1420} x1={1200} y1={1420} ties={22} gauge={40} />
        <SlatBoard x={230} y={1252} from="NOV 25TH" to="DEC 7TH" k={easeIO(f, b(5) - 4, 14)} f={f} />
        <OrderHoop x={860} y={1252} paper={ease(f, b(6) + 6, 12)} f={f} />
        <g transform={`translate(860 900) rotate(${(1 - Math.min(1, brass)) * -70})`}>
          <path d="M 0 0 h 40" stroke={RAIL.iron} strokeWidth={6} />
          <rect x={40} y={-34} width={150} height={60} rx={6} fill="#C9A24A" stroke={INK} strokeWidth={4} opacity={brass > 0.02 ? 1 : 0} />
          <text x={115} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={INK} opacity={brass > 0.02 ? 1 : 0}>AIDEA</text>
        </g>
        <Suit f={f} x={sx} y={1252} s={1.2} seed={4} cues={[b(4), b(5), b(6), b(7)]} coat="#3E4A58" face={false} walk={walkK < 1 ? f : 0} reach={reach} />
        <NameCard x={sx - 130} y={1252} text="KREISS-TOMKINS" f={f} />
        <SnowBank f={f} y={1540} seed={6} drift={-f * 0.15} />
        <NearProps f={f} seed={2} />
        <Plate x={540} text="GOVERNOR-ELECT · JONATHAN KREISS-TOMKINS" y={560} size={30} p={ease(f, b(4) + 4, 10)} />
        <Plate x={540} text="TAKES OFFICE DECEMBER 7TH" y={640} p={ease(f, b(5) + 6, 10) * (1 - ease(f, b(6), 8))} />
        <Plate x={540} text={'"POSTPONE FURTHER ACTION"'} y={720} p={ease(f, b(6) + 8, 10)} />
        <Plate x={540} text="AIDEA · A PUBLIC CORPORATION OF THE STATE" y={800} size={30} p={ease(f, b(7) + 6, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S3: CLOSED SESSION (the boardroom; the door shuts, the clock spins 10 to 3, a RESUMES FRIDAY card slaps down by a pie)
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const shut = ease(f, b(8), 14);
  const hours = lerp(10, 15, easeIO(f, b(9) - 18, 26)) + 0.004 * f;
  return (
    <Frame p={p} warmth={0.05} cam={(fr) => ({z: lerp(1.02, 1.08, easeIO(fr, 0, p.dur)), fx: lerp(560, 600, easeIO(fr, 0, p.dur)), fy: 920})}>
      <SVG>
        <Boardroom f={f} table={1250} doorSign={shut > 0.5 ? 'CLOSED SESSION' : 'BOARD ROOM'} doorOpen={1 - shut} chairs={5} />
        <HeldTravel f={f} x={380} y={380} w={200} h={200} mode="sweep" seed={3}>
          <WallClock x={480} y={470} r={86} hours={hours} f={f} />
        </HeldTravel>
        <Pie x={830} y={1262} f={f} />
        <g data-band="ok">
          {[[220, 1560, -6], [620, 1620, 4], [880, 1700, -3]].map(([px, py, r], i) => (
            <g key={i} transform={`translate(${px} ${py}) rotate(${r})`}>
              <rect x={-120} y={-80} width={240} height={160} rx={3} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
              {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M -96 ${-52 + k * 26} h ${170 - k * 12}`} stroke={INK} strokeWidth={3} opacity={0.45} />)}
            </g>
          ))}
          <g transform="translate(420 1760)"><ellipse cx={0} cy={40} rx={60} ry={12} fill="#000" opacity={0.25} /><rect x={-44} y={-50} width={88} height={92} rx={10} fill="#F2EFE6" stroke={INK} strokeWidth={4} /><path d="M 44 -24 q 34 0 34 26 q 0 26 -34 26" stroke={INK} strokeWidth={6} fill="none" /><ellipse cx={0} cy={-50} rx={44} ry={10} fill="#6B4A32" stroke={INK} strokeWidth={3} />{[0, 1].map((k) => <path key={k} d={`M ${-10 + k * 18} -64 q 8 -20 0 -40`} stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.5 + 0.3 * Math.sin(f / 9 + k)} />)}</g>
        </g>
        <TableCard x={420} y={1262} lines={['RESUMES', 'FRIDAY']} k={spr(f, b(10), 14)} />
        <Plate x={540} text="CLOSED SESSION" y={960} p={ease(f, b(8) + 6, 10)} />
        <Plate x={540} text="10 A.M. TO 3 P.M. · NO ACTION" y={1040} p={ease(f, b(9) + 4, 10)} />
        <Plate x={540} text="RESUMES FRIDAY · NOVEMBER 27TH · 10 A.M." y={1120} size={30} p={ease(f, b(10) + 6, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S4: THE AGENDA (the grey diesel pulls ANWR, AMBLER and PORT MACKENZIE along the closed branch; the lever trembles; an empty flatcar)
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const v = 11;
  const lastX = 330 - v * (f - b(13));
  const tremble = ease(f, b(12) - 10, 10) * (1 - ease(f, b(13) + 20, 20));
  return (
    <Frame p={p} cam={(fr) => ({z: 1.03 + 0.03 * easeIO(fr, 0, p.dur), fx: 540, fy: 1000})}>
      <SVG>
        <SusitnaBG f={f} ground={1110} seed={7} drift={-f * 0.4} birches={[40, 1040]} />
        <RailLine x0={-200} y0={1300} x1={1300} y1={1300} ties={30} gauge={36} />
        <BufferStop x={960} y={1300} scale={0.6} f={f} plate={f > b(13) ? 'NO DATA CENTER ITEM' : ''} plateSize={22} />
        <g transform={`translate(${lastX + 210} 1240) rotate(${Math.sin(f / 4) * 18 * clamp01((f - b(13) + 20) / 20)})`}>
          <path d="M 0 0 L 40 6" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <circle cx={44} cy={6} r={10} fill={RAIL.iron} stroke={INK} strokeWidth={3} />
        </g>
        <Boxcar x={lastX} y={1290} w={400} f={f} lines={Math.abs((lastX) - 540) < 330 ? ['PORT MACKENZIE'] : []} travel={-f * v} />
        <Boxcar x={lastX - 430} y={1290} w={400} f={f} lines={Math.abs((lastX - 430) - 540) < 330 ? ['AMBLER'] : []} travel={-f * v} />
        <Boxcar x={lastX - 860} y={1290} w={400} f={f} lines={Math.abs((lastX - 860) - 540) < 330 ? ['ARCTIC REFUGE (ANWR)'] : []} travel={-f * v} size={22} />
        <Diesel x={lastX - 1320} y={1290} w={480} f={f} travel={-f * v} dir={-1} puff={((f % 30) / 30)} />
        <SwitchStand x={110} y={1470} scale={1.05} f={f} throw={0.5} tremble={tremble} lamp={0.4} cues={[b(11), b(12), b(13)]} />
        <SnowBank f={f} y={1560} seed={8} drift={-f * 0.2} />
        <NearProps f={f} seed={3} />
        <Plate x={600} text="PENDING AGENDA" y={580} p={ease(f, b(11) + 4, 10)} />
        <Plate x={600} text="ANWR · AMBLER · PORT MACKENZIE" y={660} p={ease(f, b(12) + 4, 10)} />
        <Plate x={600} text="NO DATA CENTER ITEM" y={740} tone="dark" p={ease(f, b(13) + 4, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S5: ALREADY GONE (from above, the ALASKA DATA CORP car far down the open branch, a $20M sack lands on its tail)
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const carT = 0.44 + 0.0014 * f;
  const x0 = 80, y0 = 1700, x1 = 1220, y1 = 520;
  const cx = lerp(x0, x1, carT), cy = lerp(y0, y1, carT);
  const rot = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  const sack = spr(f, b(15), 16);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.12, 1.02, easeIO(fr, 0, p.dur)), fx: lerp(560, 520, easeIO(fr, 0, p.dur)), fy: lerp(1000, 960, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <rect x={-100} y={-60} width={1280} height={2040} fill={RAIL.snow} data-band="ok" />
        {Array.from({length: 40}, (_, i) => <path key={i} d={`M ${h01(i, 1) * 1100} ${h01(i, 2) * 1900} q 40 -8 90 0`} stroke="#CFC6B4" strokeWidth={5} fill="none" opacity={0.6} data-band="ok" />)}
        {Array.from({length: 22}, (_, i) => (
          <g key={`t${i}`} transform={`translate(${h01(i, 3) < 0.5 ? h01(i, 4) * 300 : 760 + h01(i, 4) * 320} ${200 + h01(i, 5) * 1500})`} data-band="ok">
            <ellipse cx={-40} cy={26} rx={52} ry={14} fill={RAIL.snowShade} opacity={0.55} />
            {[1, 0.66, 0.36].map((k, j) => (
              <polygon key={j} points={Array.from({length: 16}, (_, q) => { const r = (q % 2 ? 0.55 : 1) * (30 + h01(i, 6) * 14) * k; const an = (q / 16) * Math.PI * 2 + i; return `${(Math.cos(an) * r).toFixed(1)},${(Math.sin(an) * r).toFixed(1)}`; }).join(' ')}
                fill={j === 1 ? RAIL.spruceL : RAIL.spruce} stroke={INK} strokeWidth={j === 0 ? 3 : 1.5} />
            ))}
            <circle r={5} fill={RAIL.snow} opacity={0.8} />
          </g>
        ))}
        <RailLine x0={x0} y0={y0} x1={x1} y1={y1} ties={34} gauge={56} />
        <RailLine x0={-200} y0={1500} x1={420} y1={1200} ties={10} gauge={56} />
        <RailLine x0={-200} y0={1650} x1={300} y1={1400} ties={8} gauge={56} />
        <g transform="translate(150 1080)"><rect x={-90} y={-24} width={180} height={44} rx={5} fill={RAIL.paper} stroke={INK} strokeWidth={3} /><text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>AIDEA YARD</text></g>
        <HeldTravel f={f} x={cx - 240} y={cy - 160} w={480} h={320} mode="shadow" seed={21}>
        <TopCar x={cx} y={cy} rot={rot} label="ALASKA DATA CORP" f={f} tail={sack > 0.01 ? (
          <g transform={`translate(${170} ${lerp(-260, 0, Math.min(1, sack))}) scale(${0.8 + 0.2 * Math.min(1, sack)})`}>
            <circle r={40} fill="#CDB98E" stroke={INK} strokeWidth={4} />
            <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>$20M</text>
          </g>) : null} />
        </HeldTravel>
        <Plate x={540} text="ALASKA DATA CORP · AIDEA-OWNED · FORMED IN MARCH" y={600} size={28} p={ease(f, b(14) + 4, 10)} />
        <Plate x={540} text="$20M · BOARD VOTE · PER ADN" y={680} p={ease(f, b(15) + 8, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S6: THE PITCH (low beside the open track, a billboard rises with the Plural CEO's line; THE PITCH stamp slams on)
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rise = spr(f, b(16), 22);
  const stamp = spr(f, b(17), 10);
  const bolt = spr(f, b(41), 10);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.06, easeIO(fr, 0, p.dur)), fx: 540, fy: lerp(1000, 960, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <SusitnaBG f={f} ground={1160} seed={9} drift={-f * 0.2} birches={[70, 1010]} />
        <g data-band="ok">
          <rect x={-100} y={1290} width={1300} height={70} fill="#7A604A" stroke={INK} strokeWidth={5} /> {/* caption-band-ok */}
          {Array.from({length: 18}, (_, i) => <path key={i} d={`M ${-100 + i * 76} 1292 V 1358`} stroke="#5B4636" strokeWidth={3} />)}
          <rect x={-100} y={1288} width={1300} height={10} fill="#F3F1EA" />
        </g>
        <g transform={`translate(0 ${lerp(480, 0, Math.min(1, rise))})`}>
          <HeldTravel f={f} x={160} y={700} w={760} h={420} mode="sweep" seed={6}>
            <Billboard x={540} y={1290} scale={0.95} f={f} lines={(() => { const all = ['"ONE OF THE LARGEST', 'CAPITAL NEEDS', 'IN A GENERATION"']; const words = all.join(' ').split(' '); const n = Math.floor(words.length * clamp01((f - b(41)) / 40)); let k = 0; return all.map((l) => l.split(' ').map((w) => (k++ < n ? w : ' '.repeat(w.length))).join(' ')); })()} attrib="PLURAL CEO, ON AI" size={40} stamp={stamp > 0.3 ? 'THE PITCH' : ''} />
          </HeldTravel>
        </g>
        <g transform={`translate(${540 - 0.95 * 0.3 * 700} ${lerp(980, 1160, Math.min(1, bolt))})`} opacity={bolt > 0.01 ? 1 : 0}>
          <rect x={-14} y={-14} width={28} height={28} rx={4} fill={RAIL.ironL} stroke={INK} strokeWidth={3} />
          <path d="M -8 0 H 8 M 0 -8 V 8" stroke={INK} strokeWidth={3} />
        </g>
        <SnowBank f={f} y={1560} seed={10} drift={f * 0.1} />
        <NearProps f={f} seed={4} />
        <Plate x={540} text="PLURAL CEO · STATE'S PLATFORM PARTNER" y={560} size={30} p={ease(f, b(16) + 10, 10) * (1 - ease(f, b(41), 8))} />
        <Plate x={540} text={'"ONE OF THE LARGEST CAPITAL NEEDS IN A GENERATION" · PLURAL CEO, ON AI'} displayLines={['"ONE OF THE LARGEST CAPITAL NEEDS', 'IN A GENERATION" · PLURAL CEO, ON AI']} y={660} size={28} p={ease(f, b(41) + 30, 10)} />
        <Plate x={540} text="THE PITCH · NOT A PROJECT" y={770} tone="amber" p={ease(f, b(17) + 6, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S7: THE LAND (a land plat by the tracks; nearly 20,000 acres pencilled, an eraser shrinks it to 6,800 near Houston)
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const unroll = easeIO(f, 0, 18);
  const shrink = 0;
  const sc = Math.sqrt(6800 / 19950);
  const er = false;
  const pinK = (i: number) => spr(f, b(19) + i * 6, 10);
  const parcel = 'M -170 -150 L 150 -170 L 190 -20 L 160 160 L -60 190 L -200 60 Z';
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.04, 1.12, easeIO(fr, 0, p.dur)), fx: 540, fy: 1000})}>
      <SVG>
        <SusitnaBG f={f} ground={1240} seed={11} drift={-f * 0.15} birches={[50, 1030]} range={false} />
        <HeldTravel f={f} x={160} y={690} w={760} h={420} mode="shadow" seed={22}>
        <g transform="translate(540 1010)">
          {[-300, 300].map((px) => <rect key={px} x={px - 10} y={60} width={20} height={300} fill={RAIL.tie} stroke={INK} strokeWidth={4} />)}
          <rect x={-380} y={-320} width={760} height={400} rx={8} fill="#7A604A" stroke={INK} strokeWidth={6} />
          <g transform={`scale(1 ${Math.max(0.05, unroll)})`} transform-origin="0 -120">
            <rect x={-350} y={-300} width={700} height={360} fill="#F5EEDC" stroke={INK} strokeWidth={4} />
            <path d="M -350 -60 C -200 -120 -120 20 40 -40 S 260 -180 350 -150" stroke="#9FB6CC" strokeWidth={14} fill="none" />
            <path d="M -330 20 L 330 -260" stroke={INK} strokeWidth={4} strokeDasharray="14 6" opacity={0.7} />
            <path d="M -340 -220 L 340 30" stroke="#B69A72" strokeWidth={6} opacity={0.8} />
            <g transform="translate(150 -150)">
              <circle r={10} fill={INK} />
              <text x={18} y={8} fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK}>HOUSTON</text>
            </g>
            <g transform={`translate(-60 -110) scale(${sc * 0.62})`}>
              <path d={parcel} fill="#CFC6B4" fillOpacity={0.55} stroke="#4A4A4A" strokeWidth={6 / (sc * 0.62)} strokeLinejoin="round" />
            </g>
            {shrink > 0.02 && (
              <g transform="translate(-60 -110) scale(0.62)" opacity={1 - shrink}>
                <path d={parcel} fill="none" stroke="#4A4A4A" strokeWidth={4} opacity={0.5} />
              </g>
            )}
            {er && (
              <g transform={`translate(${-60 + 120 * Math.cos(f / 3)} ${-110 + 70 * Math.sin(f / 2.2)}) rotate(-20)`}>
                <rect x={-34} y={-20} width={68} height={40} rx={6} fill="#E7A1A8" stroke={INK} strokeWidth={4} />
                <rect x={-34} y={-20} width={24} height={40} rx={6} fill="#5E7C94" stroke={INK} strokeWidth={4} />
              </g>
            )}
          </g>
          {[[-330, -290], [330, -290], [-330, 50], [330, 50]].map(([px, py], i) => {
            const k = pinK(i);
            return k > 0.01 ? <g key={i} transform={`translate(${px} ${py - 40 * (1 - Math.min(1, k))}) scale(${1.4 - 0.4 * Math.min(1, k)})`}><circle r={13} fill={RAIL.amber} stroke={INK} strokeWidth={3} /><circle cx={-4} cy={-4} r={4} fill="#FFFFFF" opacity={0.7} /></g> : null;
          })}
        </g>
        </HeldTravel>
        <RailLine x0={-200} y0={1380} x1={1300} y1={1380} ties={26} gauge={30} />
        <SnowBank f={f} y={1570} seed={12} drift={-f * 0.1} />
        <NearProps f={f} seed={5} />
        <Plate x={540} text="DNR · NOVEMBER 10TH" y={560} p={ease(f, 8, 10)} />
        <Plate x={540} text="6,800 ACRES · NEAR HOUSTON · NO COST · DNR, NOVEMBER 10TH" displayLines={['6,800 ACRES · NEAR HOUSTON · NO COST', 'DNR, NOVEMBER 10TH']} y={650} size={30} p={ease(f, b(19) + 14, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S8: COULD HOST (three use cards pop up on the parcel; the switch points slide toward an empty open siding)
const UseCard: React.FC<{x: number; y: number; text: string; k: number; f: number; seed: number}> = ({x, y, text, k, f, seed}) => {
  const s = spr(0, -1, 1) * 0 + clamp01(k);
  if (s <= 0) return null;
  const w = monoW(text, 22) + 30;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.4 + 0.6 * s}) rotate(${Math.sin(f / 21 + seed) * 2})`}>
      <ContactShadow cx={0} cy={4} rx={w * 0.4} ry={8} opacity={0.35} />
      <rect x={-5} y={-90} width={10} height={92} fill={RAIL.tie} stroke={INK} strokeWidth={3} />
      <rect x={-w / 2} y={-140} width={w} height={54} rx={6} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
      <text x={0} y={-104} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK}>{text}</text>
    </g>
  );
};
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pts = ease(f, b(21) - 4, 20);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.08, 1.02, easeIO(fr, 0, p.dur)), fx: 540, fy: lerp(1000, 980, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <SusitnaBG f={f} ground={900} seed={13} drift={-f * 0.15} birches={[]} />
        {/* the parcel on the snow, marked by stakes and string */}
        <g data-band="ok">
          <path d="M 160 1000 L 900 960 L 980 1160 L 820 1300 L 240 1310 L 100 1150 Z" fill="#E9E3D4" stroke="#6E6658" strokeWidth={4} />
          {[[160, 1000], [900, 960], [980, 1160], [820, 1300], [240, 1310], [100, 1150]].map(([sx, sy], i) => (
            <g key={i}><rect x={sx - 4} y={sy - 40} width={8} height={42} fill={RAIL.tie} stroke={INK} strokeWidth={2} /><ContactShadow cx={sx} cy={sy} rx={12} ry={4} opacity={0.4} /></g>
          ))}
        </g>
        <HeldTravel f={f} x={200} y={960} w={720} h={280} mode="shadow" seed={23}>
        <UseCard x={330} y={1180} text="LOGISTICS" k={spr(f, b(20), 14)} f={f} seed={1} />
        <UseCard x={560} y={1120} text="MANUFACTURING" k={spr(f, b(20) + 10, 14)} f={f} seed={2} />
        <UseCard x={790} y={1200} text={'"SCALABLE DATA CENTERS"'} k={spr(f, b(20) + 20, 14)} f={f} seed={3} />
        </HeldTravel>
        {/* the empty open siding in front, points sliding toward it */}
        <PTrack xn={540} yn={1960} wn={300} xf={560} yf={1420} wf={180} ties={8} />
        <PTrack xn={560} yn={1420} wn={180} xf={lerp(820, 160, pts)} yf={1360} wf={110} ties={6} />
        <g transform="translate(60 1380)">{[0, 1, 2].map((i) => <rect key={i} x={i * 30 - 20} y={-260 - i * 20} width={18} height={270 + i * 20} fill={RAIL.birch} stroke={INK} strokeWidth={3} />)}<ellipse cx={20} cy={0} rx={90} ry={16} fill={RAIL.snow} stroke={INK} strokeWidth={3} /></g>
        <SwitchStand x={860} y={1560} scale={0.9} f={f} throw={pts} lamp={0.3 + 0.5 * pts} cues={[b(20), b(21)]} />
        <Plate x={540} text={'LOGISTICS · MANUFACTURING · "SCALABLE DATA CENTERS" · AIDEA, JULY · PER ALASKA BEACON'} displayLines={['LOGISTICS · MANUFACTURING', '"SCALABLE DATA CENTERS" · AIDEA, JULY', 'PER ALASKA BEACON']} y={600} size={30} p={ease(f, b(20) + 24, 10)} />
        <Plate x={540} text="COULD HOST" y={720} tone="amber" p={ease(f, b(21) + 6, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S9: THE LAND'S CLOCK, THE SIGNATURE (low and wide at noon: the lever throws, the disc's long shadow sweeps and settles on the open track)
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const th = spr(f, b(22) + 2, 18);
  const shadowA = lerp(-20, 92, easeIO(f, b(22) + 2, 26));
  const flare = ease(f, b(22) + 10, 10);
  const sign = spr(f, b(23), 20);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.05, easeIO(fr, 0, p.dur)), fx: 540, fy: 1020})}>
      <SVG>
        <SusitnaBG f={f} ground={1140} seed={14} drift={-f * 0.2} birches={[40, 130, 1020]} />
        <Fork f={f} windowLit={1} />
        <HeldTravel f={f} x={340} y={840} w={300} h={480} mode="sweep" seed={9}>
          <SwitchStand x={480} y={1320} scale={1.45} f={f} throw={Math.min(1.08, th)} turn={0.5 + 0.5 * th} lamp={0.3 + 0.7 * flare} cues={[b(22) + 2, b(23)]} shadow={shadowA} />
        </HeldTravel>
        {/* the amber station sign on the DNR side, swinging down on its chains */}
        <g transform={`translate(240 ${lerp(500, 820, Math.min(1, sign))}) rotate(${(1 - Math.min(1, sign)) * 12 + Math.sin(f / 13) * 1.5})`} opacity={sign > 0.01 ? 1 : 0}>
          <path d="M -120 -160 L -100 -40 M 120 -160 L 100 -40" stroke={INK} strokeWidth={4} strokeDasharray="6 4" />
          <rect x={-170} y={-40} width={340} height={110} rx={8} fill={RAIL.amber} stroke={INK} strokeWidth={5} />
          <text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={INK}>NOVEMBER 30TH</text>
          <text x={0} y={46} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} fill={INK}>THEN 30 DAYS</text>
        </g>
        <SnowBank f={f} y={1570} seed={15} drift={f * 0.12} />
        <NearProps f={f} seed={6} />
        <Plate x={700} text="THE LAND'S CLOCK" y={580} tone="amber" p={ease(f, b(22) + 14, 10)} />
        <Plate x={540} text="RECONSIDERATION DUE NOVEMBER 30TH · DNR HAS 30 DAYS" displayLines={['RECONSIDERATION DUE NOVEMBER 30TH', 'DNR HAS 30 DAYS']} y={710} size={30} p={ease(f, b(23) + 12, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S10: COUNT THE TIES (from above: 12 ties to the AIDEA buffer at DECEMBER 7TH; 5 bare then 30 ties on the DNR branch run past the mark)
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const step = 58, x0 = 90;
  const markX = x0 + 12 * step;
  const aShown = 12 * easeIO(f, b(24), 36);
  const dShown = 35 * easeIO(f, b(25), 66);
  const lamp = ease(f, b(26), 10);
  const pan = easeIO(f, b(25) + 20, 80);
  return (
    <Frame p={p} cam={(fr) => ({z: 1.08, fx: lerp(560, 760, pan) + 0 * fr, fy: 960})}>
      <SVG>
        <rect x={-200} y={-60} width={2600} height={2040} fill={RAIL.snow} data-band="ok" />
        {Array.from({length: 40}, (_, i) => <path key={i} d={`M ${h01(i, 7) * 2200 - 100} ${h01(i, 8) * 1900} q 50 -8 110 0`} stroke="#CFC6B4" strokeWidth={5} fill="none" opacity={0.55} data-band="ok" />)}
        <g data-band="ok">
          <rect x={x0 - 20} y={436 + 60} width={36 * step + 40} height={76} rx={6} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
          {Array.from({length: 36}, (_, i) => {
            const dx = x0 + (i + 0.5) * step;
            const lab = i === 0 ? 'NOV 25' : i === 5 ? 'NOV 30' : i === 12 ? 'DEC 7' : i === 35 ? 'DEC 30' : '';
            const am = i >= 5;
            return (
              <g key={i}>
                <path d={`M ${dx} ${500} V ${lab ? 530 : 516}`} stroke={am ? RAIL.amberD : INK} strokeWidth={lab ? 4 : 2} />
                {lab && <text x={dx} y={560} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={i === 12 ? INK : am ? RAIL.amberD : INK}>{lab}</text>}
              </g>
            );
          })}
        </g>
        <text x={x0} y={700} fontFamily={MONO} fontWeight={900} fontSize={26} fill={INK}>AIDEA BOARD</text>
        <HeldTravel f={f} x={x0} y={730} w={12 * step} h={100} mode="shadow" seed={24}>
          <RailLine x0={x0} y0={780} x1={x0 + 12 * step} y1={780} ties={12} shown={aShown} gauge={50} />
        </HeldTravel>
        <BufferStop x={markX + 40} y={810} scale={0.4} f={f} />
        <text x={x0} y={1160} fontFamily={MONO} fontWeight={900} fontSize={26} fill={INK}>DNR</text>
        <HeldTravel f={f} x={x0} y={1030} w={35 * step} h={100} mode="shadow" seed={25}>
          <RailLine x0={x0} y0={1080} x1={x0 + 35 * step} y1={1080} ties={35} shown={dShown} gauge={50} emptyFirst={5} />
        </HeldTravel>
        <text x={x0 + 5 * step} y={1170} fontFamily={MONO} fontWeight={900} fontSize={24} fill={RAIL.amberD}>NOVEMBER 30TH</text>
        <path d={`M ${markX} 650 V 1200`} stroke={INK} strokeWidth={5} />
        <rect x={markX - 110} y={600} width={220} height={46} rx={6} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
        <text x={markX} y={632} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>DECEMBER 7TH</text>
        <SignalLamp x={markX + 90} y={980} scale={0.7} f={f} lit={lamp} word="COULD" />
        <Plate x={600} text="12 DAYS TO DECEMBER 7TH" y={880} size={28} p={ease(f, b(24) + 10, 10) * (1 - ease(f, b(25), 8))} />
        <Plate x={540} text="30 DAYS FROM NOVEMBER 30TH" y={1240} tone="amber" p={ease(f, b(25) + 10, 10)} />
        <Plate x={600} text="COULD LAND UNDER THE NEXT GOVERNOR" y={980} size={26} p={ease(f, b(26) + 6, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S11: MORATORIUM (the Suit steps past the DECEMBER 7TH post and lifts a card; a parcel stake with a blank question tag)
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const walkK = easeIO(f, 0, Math.max(10, b(27) + 14));
  const sx = lerp(80, 560, walkK);
  const lift = ease(f, b(27) + 4, 16);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.02, 1.07, easeIO(fr, 0, p.dur)), fx: lerp(500, 580, easeIO(fr, 0, p.dur)), fy: 980})}>
      <SVG>
        <SusitnaBG f={f} ground={1150} seed={16} drift={-f * 0.25} birches={[120, 990]} />
        <RailLine x0={-200} y0={1340} x1={1300} y1={1330} ties={28} gauge={34} />
        <SwitchStand x={110} y={1180} scale={0.45} f={f} throw={1} turn={1} lamp={1} blink cues={[b(27)]} />
        <g transform="translate(330 1300)">
          <ContactShadow cx={0} cy={4} rx={30} ry={6} opacity={0.4} />
          <rect x={-9} y={-260} width={18} height={262} fill={RAIL.tie} stroke={INK} strokeWidth={4} />
          <rect x={-110} y={-300} width={220} height={50} rx={6} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
          <text x={0} y={-266} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>DECEMBER 7TH</text>
        </g>
        <HeldTravel f={f} x={800} y={1060} w={140} h={260} mode="shadow" seed={4}>
          <SurveyStake x={880} y={1300} scale={1.2} f={f} tag="?" tagSize={30} />
        </HeldTravel>
        <Suit f={f} x={sx} y={1300} s={1.2} seed={7} cues={[b(27), b(28)]} coat="#3E4A58" face={false} walk={walkK < 1 ? f : 0} reach={lift} facing={f > b(28) ? 1 : 1} />
        <g transform={`translate(${sx + 90} ${1300 - 300 - 80 * lift}) rotate(${Math.sin(f / 15) * 2})`} opacity={lift > 0.05 ? 1 : 0}>
          <rect x={-120} y={-44} width={240} height={88} rx={6} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
          <text x={0} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>MORATORIUM</text>
          <text x={0} y={26} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>UNTIL RULES</text>
        </g>
        <NameCard x={sx - 140} y={1300} text="KREISS-TOMKINS" f={f} />
        <SnowBank f={f} y={1560} seed={17} drift={-f * 0.12} />
        <NearProps f={f} seed={7} />
        <Plate x={540} text="MORATORIUM UNTIL RULES · PER ADN" y={580} p={ease(f, b(27) + 10, 10)} />
        <Plate x={540} text="REVERSE THE TRANSFER? HIS TEAM HASN'T SAID" y={680} size={30} p={ease(f, b(28) + 6, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S12: DUE DILIGENCE (at the AIDEA buffer stop under the lit window card, the RUARO Suit sets down a binder stack and squares it)
const Binders: React.FC<{x: number; y: number; k: number; f: number; tabs: number}> = ({x, y, k, f, tabs}) => {
  const s = clamp01(k);
  if (s <= 0) return null;
  const cols = ['#3E6E8E', '#8A4B2E', '#5B6B3A', '#3E4A58', '#8A6A4A'];
  return (
    <g transform={`translate(${x} ${lerp(y - 240, y, Math.min(1, s))})`}>
      <ContactShadow cx={0} cy={4} rx={110} ry={10} opacity={0.4} />
      {cols.map((c, i) => (
        <g key={i} transform={`translate(${(i % 2) * 6 - 3} ${-i * 34})`}>
          <rect x={-100} y={-32} width={200} height={32} rx={4} fill={c} stroke={INK} strokeWidth={3} />
          <rect x={-100} y={-28} width={12} height={24} fill="#F3F1EA" opacity={0.8} />
          {[0, 1, 2].map((t) => <rect key={t} x={60 + t * 12} y={-40 - 6 * tabs * Math.max(0, Math.sin(f / 3 + t + i))} width={9} height={14} fill={['#F2A93B', '#F3F1EA', '#9FB6CC'][t]} stroke={INK} strokeWidth={1.5} />)}
        </g>
      ))}
    </g>
  );
};
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const set = spr(f, b(29) + 6, 18);
  const tabs = clamp01((f - b(42)) / 10) * (1 - clamp01((f - b(42) - 30) / 14));
  const square = Math.sin(clamp01((f - b(42)) / 30) * Math.PI);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.06, easeIO(fr, 0, p.dur)), fx: 560, fy: lerp(1000, 980, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <SusitnaBG f={f} ground={1160} seed={18} drift={-f * 0.2} birches={[60, 1020]} />
        <RailLine x0={-200} y0={1300} x1={760} y1={1300} ties={22} gauge={36} />
        <BufferStop x={760} y={1300} scale={1.0} f={f} />
        <g transform="translate(760 880)">
          <path d="M -4 0 V 130" stroke={INK} strokeWidth={5} />
          <rect x={-120} y={-56} width={240} height={64} rx={8} fill="#F6E7C8" stroke={INK} strokeWidth={4} />
          <rect x={-136} y={-70} width={272} height={92} rx={12} fill="#F6E7C8" opacity={0.25 + 0.08 * Math.sin(f / 9)} />
          <text x={0} y={-14} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} fill={INK}>AIDEA BOARD</text>
        </g>
        <HeldTravel f={f} x={640} y={900} w={240} h={220} mode="shadow" seed={14}>
          <Binders x={760} y={1110} k={set} f={f} tabs={tabs} />
        </HeldTravel>
        <Suit f={f} x={470} y={1300} s={1.25} seed={9} cues={[b(29), b(42)]} coat="#4A4048" face={false} reach={0.55 * Math.min(1, set) + 0.25 * square} facing={1} />
        <NameCard x={300} y={1300} text="RANDY RUARO" f={f} />
        <SnowBank f={f} y={1560} seed={19} drift={f * 0.1} />
        <NearProps f={f} seed={8} />
        <Plate x={540} text="RANDY RUARO · AIDEA EXECUTIVE DIRECTOR" y={580} size={30} p={ease(f, b(29) + 10, 10)} />
        <Plate x={540} text={'"NOT RAPIDLY MOVING THROUGH PROJECTS WITHOUT DUE DILIGENCE" · RANDY RUARO'} displayLines={['"NOT RAPIDLY MOVING THROUGH PROJECTS', 'WITHOUT DUE DILIGENCE" · RANDY RUARO']} y={680} size={28} p={ease(f, b(42) + 2, 8)} />
      </SVG>
    </Frame>
  );
};

// ---- S13: CUT AND TIED BACK (three ACRES flatcars uncouple to one, which rolls back on a REVERSION CLAUSE chain toward a STATE OF ALASKA post)
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const away = easeIO(f, b(31) + 6, 50);
  const back = easeIO(f, b(32), 20);
  const carX = 640;
  const stampK = spr(f, b(46), 10);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.03, 1.07, easeIO(fr, 0, p.dur)), fx: 560, fy: 1000})}>
      <SVG>
        <SusitnaBG f={f} ground={1120} seed={20} drift={-f * 0.25} birches={[90, 1040]} />
        <RailLine x0={-200} y0={1300} x1={1300} y1={1300} ties={30} gauge={36} />
        <Boxcar x={carX - 420 - 900 * away} y={1290} w={380} f={f} lines={['ACRES']} flat travel={-900 * away} />
        <Boxcar x={carX - 820 - 900 * away} y={1290} w={380} f={f} lines={['ACRES']} flat travel={-900 * away} />
        <HeldTravel f={f} x={carX - 200} y={1180} w={400} h={120} mode="sweep" seed={8}>
          <Boxcar x={carX} y={1290} w={380} f={f} lines={['ACRES']} flat travel={0} />
        </HeldTravel>
        {/* the state post and the chain */}
        <g transform="translate(980 1300)">
          <ContactShadow cx={0} cy={4} rx={30} ry={6} opacity={0.4} />
          <rect x={-10} y={-250} width={20} height={252} fill={RAIL.tie} stroke={INK} strokeWidth={4} />
          <rect x={-90} y={-300} width={180} height={64} rx={6} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
          <text x={0} y={-274} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>STATE OF</text>
          <text x={0} y={-250} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>ALASKA</text>
        </g>
        <path d={`M ${carX + 190} 1270 Q ${(carX + 190 + 970) / 2} ${1300 - 60 * (1 - back)} 970 1200`} stroke={RAIL.iron} strokeWidth={6} strokeDasharray="10 6" fill="none" opacity={back > 0.02 ? 1 : 0} />
        {back > 0.02 && (
          <g transform={`translate(${(carX + 1160) / 2} ${1180 - 30 * back})`}>
            <rect x={-110} y={-22} width={220} height={40} rx={5} fill={RAIL.paper} stroke={INK} strokeWidth={3} />
            <text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>REVERSION CLAUSE</text>
          </g>
        )}
        <g transform={`translate(${carX} 1150)`}>
          <rect x={-90} y={-60} width={180} height={110} rx={4} fill={RAIL.paper} stroke={INK} strokeWidth={3} />
          <path d="M -70 -30 L 40 -40 L 60 10 L -50 30 Z" fill="#CFC6B4" stroke="#4A4A4A" strokeWidth={3} />
          {stampK > 0.01 && (
            <g transform={`translate(0 ${-10 - 120 * (1 - Math.min(1, stampK))}) rotate(-8) scale(${1.3 - 0.3 * Math.min(1, stampK)})`}>
              <rect x={-90} y={-24} width={180} height={48} rx={6} fill="none" stroke={RAIL.amberD} strokeWidth={5} />
              <text x={0} y={-2} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={RAIL.amberD}>THE TRANSFER</text>
              <text x={0} y={18} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={14} fill={RAIL.amberD}>NOT THE USE</text>
            </g>
          )}
        </g>
        <SnowBank f={f} y={1560} seed={21} drift={-f * 0.15} />
        <NearProps f={f} seed={9} />
        <Plate x={540} text="NEARLY 20,000 TO 6,800 ACRES" y={600} p={ease(f, b(31) + 10, 10)} />
        <Plate x={540} text="REVERSION CLAUSE · BACK TO THE STATE IF NOT DEVELOPED" displayLines={['REVERSION CLAUSE', 'BACK TO THE STATE IF NOT DEVELOPED']} y={700} size={30} p={ease(f, b(32) + 10, 10) * (1 - ease(f, b(46), 8))} />
        <Plate x={540} text="THE TRANSFER · NOT THE USE · DNR, PER MAT-SU SENTINEL" displayLines={['THE TRANSFER · NOT THE USE', 'DNR, PER MAT-SU SENTINEL']} y={830} tone="amber" size={30} p={ease(f, b(46) + 6, 8)} />
      </SVG>
    </Frame>
  );
};

// ---- S14: THE OTHER SIDE (mail sacks drop onto a freight scale; a MAT-SU BOROUGH envelope lands; the switch stands lit far behind)
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const k0 = b(33);
  const needle = clamp01((f - k0) / 70) * 0.82 + (f > b(43) ? 0.12 * Math.exp(-(f - b(43)) / 10) * Math.sin((f - b(43)) / 2) : 0);
  const env = spr(f, b(34), 16);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.25, 1.0, easeIO(fr, k0 + 10, 70)), fx: lerp(480, 540, easeIO(fr, k0 + 10, 70)), fy: lerp(1150, 980, easeIO(fr, k0 + 10, 70))})}>
      <SVG>
        <SusitnaBG f={f} ground={1120} seed={22} drift={-f * 0.15} birches={[60, 1030]} />
        <g data-band="ok">
          <rect x={-100} y={1200} width={1300} height={60} fill="#7A604A" stroke={INK} strokeWidth={5} />
          <rect x={-100} y={1198} width={1300} height={8} fill="#F3F1EA" />
        </g>
        {Array.from({length: 16}, (_, i) => (
          <MailSack key={`row${i}`} x={-40 + (i % 8) * 74 + (i > 7 ? 36 : 0)} y={1200 - (i > 7 ? 46 : 0)} scale={0.42} f={f} drop={clamp01((f - k0 - 30 - i * 3) / 20)} seed={i + 20} />
        ))}
        <SwitchStand x={900} y={1300} scale={0.85} f={f} throw={1} turn={1} lamp={1} tremble={ease(f, b(34), 10)} cues={[b(33), b(34)]} />
        <HeldTravel f={f} x={250} y={860} w={620} h={460} mode="sweep" seed={26}>
        <FreightScale x={480} y={1300} f={f} needle={needle} word="MOSTLY OPPOSED">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <MailSack key={i} x={-150 + i * 60 + (i % 2) * 10} y={-64 - (i > 3 ? 70 : 0)} scale={0.62} f={f} drop={clamp01((f - k0 - i * 9) / 22)} text="MAIL" seed={i + 1} />
          ))}
          {env > 0.01 && (
            <g transform={`translate(${lerp(-400, 0, Math.min(1, env))} -230) rotate(${(1 - Math.min(1, env)) * -30})`}>
              <rect x={-90} y={-40} width={180} height={84} rx={4} fill={RAIL.paper} stroke={INK} strokeWidth={4} />
              <path d="M -90 -40 L 0 10 L 90 -40" stroke={INK} strokeWidth={3} fill="none" />
              <text x={0} y={32} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={16} fill={INK}>MAT-SU BOROUGH</text>
              {env > 0.9 && <g opacity={clamp01((f - b(34) - 16) / 10)}><path d="M -40 -50 q -60 -50 -130 -60" stroke={RAIL.amberD} strokeWidth={5} fill="none" /><path d="M -170 -110 l 22 -4 l -4 20" stroke={RAIL.amberD} strokeWidth={5} fill="none" /><rect x={-330} y={-170} width={290} height={40} rx={5} fill={RAIL.paper} stroke={RAIL.amberD} strokeWidth={3} /><text x={-185} y={-143} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={RAIL.amberD}>POINT MACKENZIE INSTEAD</text></g>}
            </g>
          )}
        </FreightScale>
        </HeldTravel>
        <SnowBank f={f} y={1560} seed={23} drift={f * 0.1} />
        <NearProps f={f} seed={10} />
        <Plate x={540} text="2,300+ COMMENTS · MOSTLY OPPOSED" displayLines={['2,300+ COMMENTS']} y={580} p={ease(f, b(33) + 10, 10)} />
        <Plate x={540} text="MOSTLY OPPOSED" y={670} tone="dark" size={28} p={ease(f, b(43) + 4, 8) * (1 - ease(f, b(34), 8))} />
        <Plate x={540} text="MAT-SU BOROUGH · REQUEST TO RECONSIDER" y={760} size={30} p={ease(f, b(34) + 12, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S15: NOTHING INSIDE (an empty boxcar on the open siding rolls its doors open on nothing; RULES ties lay ahead of it as it waits)
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const doors = easeIO(f, b(35), 28);
  const rules = clamp01((f - b(36)) / 50) * 6;
  const puffK = clamp01((f - b(44)) / 30);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.02, 1.08, easeIO(fr, 0, p.dur)), fx: lerp(600, 520, easeIO(fr, b(36), 40)), fy: 1000})}>
      <SVG>
        <SusitnaBG f={f} ground={1110} seed={24} drift={-f * 0.2} birches={[80, 1020]} />
        <RailLine x0={-200} y0={1300} x1={1300} y1={1300} ties={26} gauge={36} />
        <Boxcar x={1180} y={1290} w={380} f={f} lines={['ACRES']} flat />
        <HeldTravel f={f} x={430} y={1050} w={560} h={250} mode="shadow" seed={10}>
          <Boxcar x={700} y={1290} w={540} f={f} doors={doors} inside={(
            <g>{Array.from({length: 8}, (_, i) => <circle key={i} cx={-60 + h01(i, 9) * 120} cy={-200 + h01(i, 10) * 140 + 8 * Math.sin(f / 13 + i)} r={2.5} fill="#E8D9B8" opacity={0.6} />)}</g>
          )} />
        </HeldTravel>
        {/* RULES ties laid ahead of the car, one by one */}
        {Array.from({length: 6}, (_, i) => {
          const k = clamp01(rules - i);
          if (k <= 0) return null;
          const tx = 380 - i * 66;
          return (
            <g key={i} transform={`translate(${tx} ${lerp(1180, 1300, Math.min(1, k * 1.2))})`} opacity={Math.min(1, k * 2)}>
              <rect x={-38} y={-12} width={76} height={26} fill={RAIL.tie} stroke={INK} strokeWidth={3} />
              <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={13} fill={RAIL.paper}>RULES</text>
            </g>
          );
        })}
        {[0, 1].map((i) => <circle key={i} cx={430 + i * 10} cy={1250 - ((f + i * 15) % 30)} r={8 + ((f + i * 15) % 30) / 4} fill="#FFFFFF" opacity={0.5 - ((f + i * 15) % 30) / 60} />)}
        {puffK > 0 && puffK < 1 && [0, 1, 2, 3].map((i) => <circle key={`p${i}`} cx={520 + puffK * 360 + i * 30} cy={1180 - i * 18 - puffK * 30} r={18 + puffK * 30 + i * 6} fill="#E8EAEC" stroke={INK} strokeWidth={2} opacity={0.75 * (1 - puffK)} />)}
        <SnowBank f={f} y={1560} seed={25} drift={-f * 0.1} />
        <NearProps f={f} seed={11} />
        <Plate x={540} text="NO TENANT · NO POWER SOURCE · NO COOLING · NO SCHEDULE · AIDEA, JULY" displayLines={['NO COMMITTED TENANT · NO POWER SOURCE', 'NO COOLING · NO SCHEDULE · AIDEA, JULY']} y={600} size={28} p={ease(f, b(35) + 16, 10)} />
        <Plate x={540} text={'"HAS NOT IDENTIFIED A SPECIFIC PROJECT" · AIDEA'} y={720} size={28} p={ease(f, b(36) + 10, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S16: WHICH FIRST (low where the open branch splits again: a second switch swings slowly and stops caught mid-throw)
const S16: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t0 = b(45), t1 = b(38);
  const lean = clamp01((f - t0) / Math.max(1, t1 - t0));
  const sw = f < t0 ? 0.5 : f < t1 ? 0.5 - 0.42 * Math.sin(lean * Math.PI * 0.9) : 0.5 + 0.06 * Math.exp(-(f - t1) / 12) * Math.sin((f - t1) / 2);
  const fri = ease(f, b(37), 6);
  const nov = spr(f, b(45), 16);
  return (
    <Frame p={p} cam={() => ({z: 1.0, fx: 540, fy: 960})}>
      <SVG>
        <SusitnaBG f={f} ground={1080} seed={26} drift={-f * 0.2} birches={[40, 1040]} />
        {/* far off: the main stand, still on DNR, and the FRIDAY window card on the closed branch */}
        <SwitchStand x={330} y={1100} scale={0.42} f={f} throw={1} turn={1} lamp={1} cues={[b(37)]} />
        <g transform="translate(900 1040)">
          <rect x={-70} y={-26} width={140} height={40} rx={5} fill={fri > 0.5 ? '#F6E7C8' : '#C9C3B4'} stroke={INK} strokeWidth={3} />
          {fri > 0.5 && <rect x={-84} y={-36} width={168} height={60} rx={8} fill="#F6E7C8" opacity={0.3} />}
          <text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>FRIDAY</text>
          <path d="M 0 14 V 60" stroke={INK} strokeWidth={4} />
        </g>
        <g transform={`translate(150 1020) rotate(${f > b(45) ? 7 * Math.sin((f - b(45)) / 5) * Math.exp(-(f - b(45)) / 20) : 0})`}>
          <path d="M 0 -60 V 80" stroke={INK} strokeWidth={4} />
          <rect x={-110} y={-40} width={220} height={48} rx={6} fill={nov > 0.3 ? RAIL.amber : '#C9C3B4'} stroke={INK} strokeWidth={4} />
          <text x={0} y={-8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK}>NOVEMBER 30TH</text>
        </g>
        {/* the open branch comes in from far left and splits at the near frog */}
        <PTrack xn={540} yn={1300} wn={150} xf={-120} yf={1110} wf={50} ties={14} />
        <PTrack xn={540} yn={1300} wn={150} xf={60} yf={1960} wf={330} ties={10} />
        <PTrack xn={540} yn={1300} wn={150} xf={1060} yf={1960} wf={330} ties={0} />
        {[0, 1, 2, 3, 4].map((i) => {
          const t = (i + 0.5) / 5;
          const x = lerp(540, 60, t) - 40, y = lerp(1300, 1900, t);
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <rect x={-90 - 60 * t} y={-10 - 6 * t} width={180 + 120 * t} height={20 + 12 * t} fill={RAIL.tie} stroke={INK} strokeWidth={3} />
              <text x={0} y={6 + 3 * t} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={14 + 8 * t} fill={RAIL.paper}>RULES</text>
            </g>
          );
        })}
        <g transform="translate(900 1560) scale(0.85)"><Boxcar x={0} y={0} w={420} f={f} doors={1} /></g>
        <g transform="translate(250 1270)"><rect x={-100} y={-26} width={200} height={40} rx={5} fill={RAIL.paper} stroke={INK} strokeWidth={3} /><text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>RULES FIRST</text></g>
        <g transform="translate(860 1290)"><rect x={-110} y={-26} width={220} height={40} rx={5} fill={RAIL.paper} stroke={INK} strokeWidth={3} /><text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>TENANT FIRST</text></g>
        <HeldTravel f={f} x={440} y={830} w={260} h={470} mode="sweep" seed={12}>
          <SwitchStand x={560} y={1290} scale={1.25} f={f} throw={sw} turn={0.5} lamp={0.7} tremble={f > t1 ? 0.5 : 0} cues={[b(45), b(38), b(39)]} seed={5} shadow={88} />
        </HeldTravel>
        <Plate x={540} text="FRIDAY" y={580} p={ease(f, b(37) + 8, 10)} />
        <Plate x={540} text="NOVEMBER 30TH" y={660} tone="amber" p={ease(f, b(45) + 8, 10)} />
        <Plate x={540} text="RULES OR A TENANT?" y={750} size={36} tone="amber" p={ease(f, b(38) + 6, 10)} />
        <Plate x={540} text="WHICH FIRST?" y={840} p={ease(f, b(39) + 2, 10)} />
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15, 16: S16};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

type Beat = {id: number; at: number; label: string};
const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]; kicks: number[]}> = ({n, from, dur, beats, kicks}) => {
  const f = useCurrentFrame();
  const b = (id: number) => {
    const x = beats.find((y) => y.id === (IDS[id] ?? id));
    return x ? Math.round(x.at * 30) - from : 0;
  };
  const bt = (id: number) => {
    const x = beats.find((y) => y.id === (IDS[id] ?? id));
    return x ? Math.round(x.at * 30) : 0;
  };
  const Comp = SHOTS[n];
  const p = {f, from, dur, b, kicks, bt};
  return Comp ? <Comp p={p} /> : null;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1125Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1125Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1125: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 8, 18, 25, 32, 40, 48, 56, 62, 70, 78, 86, 93, 100, 107, 116, 125].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.bg}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#2E3436" ink="#F3EDE0" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
