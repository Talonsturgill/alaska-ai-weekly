import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {MONO, monoW} from './lib/prospect';
import {HeldProp, HeldTravel} from './lib/heldidle';
import {Raven} from './lib/fauna';
import {IDS} from './Ep1112Ids';

// Fifty Years, One Word Short, 2026-11-12. Palette roles are art_direction.json. THE STAKE TAG is the hero and the throughline,
// the RAVEN is an ordinary supporting witness (no cultural or mythic figure). One locked ground-level view of a survey stake at
// North Slope dusk: the lease cord is a clothesline and every document, tab and chip arrives clipped onto it. Orange ONLY on the
// stake tag and its flagging (fluorescent lime survey flagging), red ONLY on the crate tabs, no lamp pool and no crane-up.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;

export const C = {
  dusk: '#1B3A55', duskM: '#1F4E6B', rose: '#C98A8F', roseL: '#E3B3A8', snow: '#DCE6EE', snowS: '#8FA6BA', snowD: '#6F869B',
  paper: '#D6C9A8', paperD: '#B9AB88', ink: '#1B2230', line: '#0A1620', raven: '#15171D', orange: '#B8F23A', orangeD: '#7FA81F',
  red: '#C0272D', white: '#F4F1EA', wood: '#8A6A50', woodD: '#5A4232', steel: '#6B7A8A', steelD: '#3E4A57', ridge: '#2D4C6B', ridgeS: '#E8EEF4',
  news: '#CFC7B4', lamp: '#F4EBD2', brass: '#B58A3C',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const springy = (f: number, a: number, d = 26) => {
  const k = clamp01((f - a) / d);
  return k <= 0 ? 0 : 1 - Math.exp(-5.5 * k) * Math.cos(k * 9);
};
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'dark' | 'plate' | 'warn' | 'glow';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#0F1B28', fg: '#E8EEF4', edge: '#E8EEF4'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.red, edge: C.ink},
  glow: {fill: C.white, fg: C.ink, edge: C.ink},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'dark', p = 1, rot = 0, drop = 0}) => {
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
    <g opacity={Math.min(1, k * 1.7)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
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
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; overlay?: React.ReactNode; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.04, bloom = 0.04, vignette = 0.22, ox = 540, oy = 930, overlay, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 14 * Math.sin(p.f / 110) + 10 * t, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: C.dusk}} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#0F1B28" stroke="#E8EEF4" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#E8EEF4">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.06} warmth={0.0} />
    </AbsoluteFill>
  );
};

const track = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => {
  const clampC = (c: Cam): Cam => ({z: c.z, fx: Math.max(540 / c.z, Math.min(1080 - 540 / c.z, c.fx)), fy: Math.max(960 / c.z, Math.min(1920 - 960 / c.z, c.fy))});
  if (f <= keys[0].t) return clampC(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i].t) {
      const a = keys[i - 1], bk = keys[i];
      const k = Easing.inOut(Easing.cubic)((f - a.t) / Math.max(1, bk.t - a.t));
      return clampC({z: lerp(a.z, bk.z, k), fx: lerp(a.fx, bk.fx, k), fy: lerp(a.fy, bk.fy, k)});
    }
  }
  return clampC(keys[keys.length - 1]);
};

const vis = (f: number, b: (id: number) => number, ks: number[], i: number) => ease(f, b(ks[i]), 14) * (i < ks.length - 1 ? 1 - ease(f, b(ks[i + 1]) - 10, 8) : 1);

// ---- geometry of the one world ------------------------------------------------------------------------------------------------------------------
const SX = 860;            // the stake
const GROUND = 1290;       // where everything stands
const POST_L = 40;         // left end of the clothesline
const cordY = (x: number, sag = 70) => {
  const t = clamp01((x - POST_L) / (SX - POST_L));
  return lerp(612, 640, t) + sag * 4 * t * (1 - t);
};

// ---- the backdrop: lifted dusk dome, a rose horizon line, ridges, snow, a thin road -------------------------------------------------------------
const Backdrop: React.FC<{f: number; act?: number}> = ({f, act = 0}) => (
  <g>
    <defs>
      <linearGradient id="sky112" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.dusk} />
        <stop offset="0.55" stopColor={C.duskM} />
        <stop offset="0.9" stopColor={C.rose} />
        <stop offset="1" stopColor={C.roseL} />
      </linearGradient>
    </defs>
    <path d="M -40,380 H 1120 V 1040 H -40 Z" fill="url(#sky112)" />
    {/* far ridge with snow caps, the Brooks Range as a long low line */}
    <path d="M -40,1010 L 120,930 L 230,985 L 380,880 L 470,960 L 620,900 L 780,990 L 930,920 L 1120,1000 L 1120,1060 L -40,1060 Z" fill={C.ridge} stroke={C.line} strokeWidth={3} />
    <path d="M 380,880 L 340,918 L 372,908 L 392,930 L 420,906 L 440,922 Z M 620,900 L 590,930 L 618,920 L 640,938 L 664,918 Z M 120,930 L 92,960 L 122,950 L 146,964 Z" fill={C.ridgeS} />
    {/* near snow plain with shadow planes, a thin road */}
    <path d="M -40,1040 Q 300,1010 540,1030 T 1120,1020 L 1120,1920 L -40,1920 Z" fill={C.snow} stroke={C.snowS} strokeWidth={3} />
    <path d="M -40,1110 Q 300,1090 560,1104 T 1120,1096 L 1120,1140 Q 600,1148 300,1150 T -40,1160 Z" fill={C.snowS} opacity={0.55} />
    <path d="M -40,1075 Q 400,1060 1120,1068" stroke={C.snowD} strokeWidth={8} fill="none" opacity={0.7} />
    <path d="M -40,1180 Q 500,1160 1120,1176 L 1120,1250 Q 500,1230 -40,1262 Z" fill={C.snowS} opacity={0.4} />
    {/* the floor: wind-sculpted snow, drifts and trampled steps under the caption bar, varied by act */}
    <path d="M -40,1400 Q 280,1360 560,1392 T 1120,1380 L 1120,1920 L -40,1920 Z" fill={C.snow} stroke={C.snowS} strokeWidth={4} />
    {Array.from({length: 11}).map((_, i) => (
      <path key={i} d={`M -40,${1450 + i * 44} Q ${200 + 60 * Math.sin(i + act)},${1420 + i * 44 + 18 * Math.cos(i * 1.7 + act)} ${560 + 40 * Math.sin(i * 2 + act)},${1456 + i * 44} T 1120,${1446 + i * 44}`} stroke={i % 2 ? C.snowD : C.snowS} strokeWidth={5 + (i % 3)} fill="none" opacity={0.75} />
    ))}
    {Array.from({length: 16}).map((_, i) => (
      <g key={i} transform={`translate(${60 + ((i * 131 + act * 97) % 960)} ${1470 + ((i * 53) % 400)}) rotate(${(i * 37) % 60 - 30})`} opacity={0.8}>
        <ellipse cx={0} cy={0} rx={22} ry={11} fill={C.snowS} stroke={C.snowD} strokeWidth={3} />
        <ellipse cx={34} cy={14} rx={20} ry={10} fill={C.snowS} stroke={C.snowD} strokeWidth={3} />
      </g>
    ))}
    {Array.from({length: 7}).map((_, i) => (
      <path key={i} d={`M ${120 + ((i * 173 + act * 61) % 880)},${1420 + ((i * 97) % 300)} l -10,-34 M 0,0 l 4,-40 M 0,0 l 14,-30`} transform="translate(0 0)" stroke={C.ridge} strokeWidth={4} fill="none" strokeLinecap="round" />
    ))}
    {Array.from({length: 26}).map((_, i) => {
      const x = (i * 197 + 24 * Math.sin(f / 30 + i)) % 1100;
      const y = 520 + ((f * (0.5 + (i % 4) * 0.22) + i * 113) % 760);
      return <circle key={i} cx={x} cy={y} r={1.8 + (i % 3) * 0.8} fill={C.white} opacity={0.55} />;
    })}
  </g>
);

// ---- the cast -----------------------------------------------------------------------------------------------------------------------------------
/** the stake: wood post, a short arm, survey flagging at the top, a contact shadow; leans from its base. */
const Stake: React.FC<{f: number; lean: number}> = ({f, lean}) => {
  const flutter = 5 * Math.sin(f / 7) + 3 * Math.sin(f / 3.1);
  return (
    <g>
      <ellipse cx={SX + 6} cy={GROUND + 6} rx={90} ry={16} fill={C.line} opacity={0.35} />
      <g transform={`rotate(${-lean} ${SX} ${GROUND})`}>
        <path d={`M ${SX - 20},${GROUND} L ${SX - 18},610 L ${SX + 18},604 L ${SX + 20},${GROUND} Z`} fill={C.wood} stroke={C.line} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M ${SX + 4},${GROUND} L ${SX + 6},608 L ${SX + 18},604 L ${SX + 20},${GROUND} Z`} fill={C.woodD} opacity={0.65} />
        <path d={`M ${SX - 12},700 v 80 M ${SX - 4},900 v 120 M ${SX - 10},1100 v 100`} stroke={C.woodD} strokeWidth={3} opacity={0.6} />
        <path d={`M ${SX - 18},604 L ${SX - 2},590 L ${SX + 18},604 Z`} fill={C.wood} stroke={C.line} strokeWidth={5} strokeLinejoin="round" />
        {/* survey flagging: the one orange thing on the stake besides the tag */}
        <path d={`M ${SX + 16},616 q 40,${-10 + flutter} 70,${6 + flutter} q -30,4 -40,${22 - flutter} q -16,-6 -30,${-4} Z`} fill={C.orange} stroke={C.line} strokeWidth={4} strokeLinejoin="round" />
        <rect x={SX - 60} y={844} width={64} height={14} rx={5} fill={C.wood} stroke={C.line} strokeWidth={5} />
      </g>
    </g>
  );
};

/** the tag: the throughline. States: blank spinning, stamped, second cord, slips snagged, empty IN RETURN line. */
const Tag: React.FC<{f: number; b: (id: number) => number; lean: number}> = ({f, b, lean}) => {
  const spin = Math.sin((f - b(1)) / 5) * Math.exp(-Math.max(0, f - b(1)) / 26) * 0.9 * (f >= b(1) ? 1 : 0);
  const stampDrop = easeIO(f, b(2) - 14, 14);
  const stampHit = springy(f, b(2), 18);
  const stamped = f >= b(2);
  const turn = easeIO(f, b(40), 20);          // the tag turns toward the camera, showing the IN RETURN line
  const bend = easeIO(f, b(28), 30);
  const tap = Math.max(0, Math.sin(Math.PI * clamp01((f - b(42)) / 14)));
  const sx = Math.abs(Math.cos(turn * Math.PI * 1.0)) * (turn < 0.5 ? 1 : 1) * 0.9 + 0.1;
  const x = SX - 30, y = 1040;
  const sway = (1 - bend * 0.6) * 2 * Math.sin(f / 19);
  return (
    <g transform={`rotate(${-lean} ${SX} ${GROUND})`}>
      <path d={`M ${SX - 28},858 Q ${SX - 34},900 ${x - 6},${y - 150}`} stroke={C.orangeD} strokeWidth={6} fill="none" strokeLinecap="round" />
      <g transform={`translate(${x} ${y}) rotate(${sway + 10 * spin + 4 * bend})`}>
        <g transform={`scale(${turn > 0.02 && turn < 0.98 ? sx : 1} 1)`}>
          <rect x={-86} y={-134} width={196} height={288} rx={14} fill="#000" opacity={0.28} transform="translate(8 10)" />
          <rect x={-100} y={-146} width={196} height={288} rx={14} fill={C.orange} stroke={C.line} strokeWidth={7} />
          <rect x={-100} y={-146} width={72} height={288} rx={14} fill={C.orangeD} opacity={0.42} />
          <circle cx={0} cy={-120} r={11} fill={C.line} />
          <circle cx={0} cy={-120} r={5} fill={C.orange} />
          <path d="M -80,-96 H 80" stroke={C.line} strokeWidth={4} opacity={0.5} />
          {/* the one stamp */}
          <g opacity={stamped ? 1 : 0} transform={`translate(0 ${-18 + 4 * stampHit})`}>
            <rect x={-78} y={-62} width={156} height={104} rx={8} fill="none" stroke={C.line} strokeWidth={6} />
            <text x={0} y={-12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={44} fill={C.line}>50</text>
            <text x={0} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} letterSpacing={2} fill={C.line}>YEARS</text>
          </g>
          {/* the acreage band, added when the survey flags close around the stake */}
          <g opacity={f >= b(7) && turn < 0.5 ? ease(f, b(7), 14) : 0}>
            <rect x={-80} y={62} width={160} height={44} rx={5} fill="none" stroke={C.line} strokeWidth={5} />
            <text x={0} y={92} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} letterSpacing={2} fill={C.line}>715 AC</text>
          </g>
          {/* the empty IN RETURN line, added by the turn at the button */}
          <g opacity={turn > 0.5 ? 1 : 0}>
            <text x={0} y={74} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={19} letterSpacing={1.5} fill={C.line}>IN RETURN</text>
            <path d="M -76,118 H 76" stroke={C.line} strokeWidth={6} strokeLinecap="round" />
            <path d={`M 40,${118 - 6 * tap} l 10,-18 l -22,10`} stroke={C.line} strokeWidth={4} fill="none" opacity={0.0} />
          </g>
          <path d="M -90,-136 Q -40,-150 20,-140" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.35} />
        </g>
        {/* the stamp itself, a block that slams from above */}
        {f > b(2) - 16 && f < b(2) + 20 && (
          <g transform={`translate(0 ${lerp(-420, -30, stampDrop)})`} opacity={1 - clamp01((f - b(2) - 6) / 14)}>
            <rect x={-60} y={-70} width={120} height={70} rx={10} fill={C.steelD} stroke={C.line} strokeWidth={6} />
            <rect x={-18} y={-150} width={36} height={86} rx={12} fill={C.wood} stroke={C.line} strokeWidth={6} />
          </g>
        )}
      </g>
    </g>
  );
};

/** the clothesline: the lease cord. It tightens when stamped, sags when slips snag, and carries the cards. */
const Clothesline: React.FC<{f: number; b: (id: number) => number; lean: number}> = ({f, b, lean}) => {
  const taut = easeIO(f, b(2), 20);
  const load = easeIO(f, b(20), 80) * 0.6 + easeIO(f, b(28), 40) * 0.4;
  const sag = lerp(110, 54, taut) + 40 * load;
  const pts = Array.from({length: 17}).map((_, i) => {
    const x = lerp(POST_L, SX, i / 16);
    return `${x},${cordY(x, sag)}`;
  });
  return (
    <g>
      <g>
        <path d={`M ${POST_L - 14},${GROUND} V 590`} stroke={C.line} strokeWidth={22} strokeLinecap="round" />
        <path d={`M ${POST_L - 14},${GROUND} V 590`} stroke={C.wood} strokeWidth={14} strokeLinecap="round" />
        <ellipse cx={POST_L - 8} cy={GROUND + 6} rx={50} ry={10} fill={C.line} opacity={0.3} />
      </g>
      <polyline points={pts.join(' ')} fill="none" stroke={C.line} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pts.join(' ')} fill="none" stroke={C.orange} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** a card clipped to the clothesline at x, hanging from it */
const Card: React.FC<{x: number; w: number; h: number; sag?: number; tilt?: number; tone?: string; dy?: number; children?: React.ReactNode}> = ({x, w, h, sag = 54, tilt = 0, tone = C.paper, dy = 0, children}) => {
  const top = cordY(x, sag) + 28 + dy;
  return (
    <g transform={`translate(${x} ${top}) rotate(${tilt})`}>
      <rect x={-w / 2 + 8} y={10} width={w} height={h} rx={8} fill="#000" opacity={0.22} />
      <rect x={-w / 2} y={0} width={w} height={h} rx={8} fill={tone} stroke={C.line} strokeWidth={6} />
      <rect x={-w / 2 + 6} y={h - 14} width={w - 12} height={8} rx={4} fill={C.paperD} opacity={0.6} />
      {children}
      {[-w * 0.3, w * 0.3].map((cx, i) => (
        <g key={i} transform={`translate(${cx} 0)`}>
          <rect x={-9} y={-30} width={18} height={44} rx={5} fill={C.steel} stroke={C.line} strokeWidth={4} />
          <circle cx={0} cy={-26} r={3} fill={C.line} />
        </g>
      ))}
    </g>
  );
};

const Ink: React.FC<{x: number; y: number; w: number; n?: number; gap?: number; o?: number}> = ({x, y, w, n = 5, gap = 28, o = 0.5}) => (
  <g>
    {Array.from({length: n}).map((_, i) => <rect key={i} x={x} y={y + i * gap} width={w - (i % 3) * 46} height={10} rx={5} fill={C.ink} opacity={o} />)}
  </g>
);

// ---- the world, every element a function of the shot's local frame f and the beats b(key) ---------------------------------------------------------
type WP = {f: number; b: (id: number) => number};
const flick = (f: number, t: number) => easeIO(f, t, 18);

const NoticeCard: React.FC<WP> = ({f, b}) => {
  // two windows on the line: the first carries the date, case number and highlights, the second is the page the reticle sweeps
  const win1 = f < b(12) - 8 + 24;
  const tin = win1 ? b(4) - 10 : b(32) - 16;
  const tout = win1 ? b(12) - 8 : b(35) - 8;
  if (f < tin || f > tout + 24) return null;
  const inn = ease(f, tin, 22);
  const out = flick(f, tout);
  const cx = lerp(-380, 430, inn);
  const hi1 = easeIO(f, b(9), 16), hi2 = easeIO(f, b(10), 16);
  const dig = clamp01((f - b(6)) / 22);
  const code = '422741';
  const shownCode = code.split('').map((ch, i) => (dig > (i + 1) / 7 ? ch : String((Math.floor(f / 2) * (i + 3)) % 10))).join('');
  return (
    <g transform={`translate(${cx - 430} ${-900 * out}) rotate(${-26 * out} 430 760)`}>
      <HeldProp f={f} px={430} py={950} w={480} h={420} seed={2.1} kind="hang">
        <Card x={430} w={480} h={430} tilt={1.2 * Math.sin(f / 40)}>
          <rect x={-200} y={34} width={190} height={34} rx={5} fill={C.paperD} stroke={C.ink} strokeWidth={3} />
          <text x={-105} y={59} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={C.ink}>NOV 10</text>
          <Ink x={-200} y={92} w={380} n={2} gap={32} o={0.35} />
          <rect x={-206} y={150 - 6} width={392 * (win1 ? hi1 : 1)} height={36} rx={4} fill="#FFE66B" opacity={win1 ? 0.78 : 0.0} />
          <rect x={-210} y={144} width={420} height={44} fill="none" />
          <text x={-196} y={176} fontFamily={MONO} fontWeight={800} fontSize={25} fill={C.ink}>GAS-POWERED DATA CENTER</text>
          <Ink x={-200} y={206} w={380} n={1} gap={32} o={0.35} />
          <rect x={-206} y={240 - 6} width={410 * (win1 ? hi2 : 1)} height={36} rx={4} fill="#FFE66B" opacity={win1 ? 0.78 : 0.0} />
          <rect x={-210} y={234} width={420} height={44} fill="none" />
          <text x={-196} y={266} fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>HIGH-PERFORMANCE COMPUTING</text>
          <Ink x={-200} y={302} w={380} n={2} gap={30} o={0.35} />
          <rect x={-200} y={372} width={228} height={38} rx={5} fill={C.ink} />
          <text x={-86} y={398} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={3} fill={C.paper}>ADL {shownCode}</text>
        </Card>
      </HeldProp>
    </g>
  );
};

const HollowCard: React.FC<WP> = ({f, b}) => {
  const inn = ease(f, b(3) - 6, 18);
  if (inn <= 0.01) return null;
  const glow = Math.max(clamp01(1 - Math.abs(f - b(3) - 6) / 14), clamp01(1 - Math.abs(f - b(11) - 6) / 14), Math.max(clamp01(1 - Math.abs(f - b(19) - 14) / 14), clamp01(1 - Math.abs(f - b(28) - 10) / 14)));
  return (
    <g transform={`translate(${lerp(-200, 0, inn)} 0)`}>
      <Card x={108} w={150} h={200} sag={110} tilt={2 * Math.sin(f / 33)}>
        <path d="M -42,58 h 84 v 32 h -84 Z" fill={C.dusk} stroke={C.ink} strokeWidth={4} strokeDasharray="10 6" />
        <rect x={-48} y={50} width={96} height={48} rx={6} fill="none" stroke={C.ink} strokeWidth={3} opacity={0.0} />
        <Ink x={-52} y={118} w={104} n={2} gap={26} o={0.3} />
        <rect x={-75} y={0} width={150} height={200} rx={8} fill="none" stroke={C.lamp} strokeWidth={8} opacity={glow * 0.9} />
      </Card>
    </g>
  );
};

const MapTab: React.FC<WP> = ({f, b}) => {
  const inn = ease(f, b(8) - 8, 20);
  const out = flick(f, b(12) - 8);
  if (inn <= 0.01 || out >= 0.99) return null;
  const line = clamp01((f - b(8)) / 26);
  return (
    <g transform={`translate(${lerp(300, 0, inn)} ${-900 * out}) rotate(${-20 * out} 745 760)`}>
      <Card x={745} w={150} h={190} sag={30} tilt={-2 + 2 * Math.sin(f / 31)}>
        <path d="M -52,100 L -40,62 L -10,50 L 20,56 L 46,76 L 40,112 L 4,128 L -34,122 Z" fill={C.snow} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={-6} cy={74} r={6} fill={C.ink} />
        <path d={`M -6,74 V ${74 + 44 * line}`} stroke={C.ink} strokeWidth={5} strokeDasharray="8 5" />
        <circle cx={-6} cy={74 + 44 * line} r={6} fill={C.orangeD} stroke={C.line} strokeWidth={2} opacity={0} />
        <Ink x={-52} y={142} w={100} n={1} gap={20} o={0.35} />
      </Card>
    </g>
  );
};

const CompanySign: React.FC<WP> = ({f, b}) => {
  const k = springy(f, b(5), 22);
  if (f < b(5) - 2) return null;
  const out = flick(f, b(8) + 20);
  if (out >= 0.99) return null;
  return (
    <g transform={`translate(0 ${-(1 - k) * 260 - 700 * out})`} opacity={1 - out}>
      <g transform="translate(960 1290)">
        <ellipse cx={0} cy={44} rx={80} ry={12} fill={C.line} opacity={0.35} />
        <rect x={-6} y={-24} width={12} height={70} fill={C.woodD} stroke={C.line} strokeWidth={4} />
        <rect x={-96} y={-96} width={192} height={74} rx={6} fill={C.white} stroke={C.line} strokeWidth={6} />
        <text x={0} y={-48} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={2} fill={C.ink}>STAK</text>
        <text x={0} y={-30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} letterSpacing={3} fill={C.ink}>ENERGY</text>
      </g>
    </g>
  );
};

const Flags: React.FC<WP> = ({f, b}) => {
  const out = flick(f, b(12) - 8);
  if (f < b(7) - 4 || out >= 0.99) return null;
  const sq = clamp01((f - b(7) - 10) / 36);
  const pts: Array<[number, number]> = [[300, 1180], [620, 1180], [680, 1262], [250, 1262]];
  return (
    <g opacity={1 - out}>
      <path d={`M ${pts[0][0]},${pts[0][1]} L ${lerp(pts[0][0], pts[1][0], clamp01(sq * 4))},${lerp(pts[0][1], pts[1][1], clamp01(sq * 4))}
        ${sq > 0.25 ? `L ${lerp(pts[1][0], pts[2][0], clamp01(sq * 4 - 1))},${lerp(pts[1][1], pts[2][1], clamp01(sq * 4 - 1))}` : ''}
        ${sq > 0.5 ? `L ${lerp(pts[2][0], pts[3][0], clamp01(sq * 4 - 2))},${lerp(pts[2][1], pts[3][1], clamp01(sq * 4 - 2))}` : ''}
        ${sq > 0.75 ? `L ${lerp(pts[3][0], pts[0][0], clamp01(sq * 4 - 3))},${lerp(pts[3][1], pts[0][1], clamp01(sq * 4 - 3))}` : ''}`}
        stroke={C.line} strokeWidth={5} fill="none" strokeDasharray="14 10" />
      {pts.map(([x, y], i) => {
        const k = springy(f, b(7) + i * 5, 18);
        return (
          <g key={i} transform={`translate(${x} ${y - (1 - k) * 220})`} opacity={k > 0.01 ? 1 : 0}>
            <ellipse cx={0} cy={4} rx={26} ry={6} fill={C.line} opacity={0.3} />
            <path d="M 0,4 V -70" stroke={C.line} strokeWidth={6} />
            <path d={`M 0,-70 l 40,${8 + 3 * Math.sin(f / 6 + i)} l -40,14 Z`} fill={C.rose} stroke={C.line} strokeWidth={4} strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
};

/** the gas cutaway card: pipe into a generator hall, a gauge, a dashed cable that lunges at a Railbelt socket and stops short */
const CutawayCard: React.FC<WP> = ({f, b}) => {
  const inn = ease(f, b(12) - 14, 24);
  const out = flick(f, b(17) - 8);
  if (inn <= 0.01 || out >= 0.99) return null;
  const needle = springy(f, b(13), 28);
  const lunge = springy(f, b(14) - 4, 20);
  const badge = ease(f, b(13) - 2, 14);
  const tab1 = ease(f, b(15), 16), tab2 = ease(f, b(16), 14);
  const hum = 2 * Math.sin(f / 3);
  return (
    <g transform={`translate(${lerp(-420, 0, inn)} ${-900 * out}) rotate(${-22 * out} 430 760)`}>
      <HeldProp f={f} px={430} py={960} w={520} h={470} seed={4.4} kind="hang">
        <Card x={430} w={520} h={460} tilt={1.2 * Math.sin(f / 36)} tone={C.snow}>
          <rect x={-240} y={30} width={480} height={400} rx={6} fill="#B9C9D6" stroke={C.line} strokeWidth={4} />
          <path d="M -240,330 H 240 V 430 H -240 Z" fill={C.snowS} />
          {/* the gas pipe in from the left, glowing a work-lamp pale, and a flame tick */}
          <rect x={-250} y={290} width={190} height={26} fill={C.steel} stroke={C.line} strokeWidth={5} />
          <rect x={-250} y={296} width={190} height={8} fill="#A9B8C5" opacity={0.8} />
          <path d={`M -150,290 v -30 q 10,-24 -2,-40 q 22,14 10,40 z`} fill={C.lamp} stroke={C.line} strokeWidth={3} opacity={0.9} />
          {/* the generator hall */}
          <rect x={-60} y={160} width={200} height={170} rx={8} fill={C.steel} stroke={C.line} strokeWidth={6} />
          <rect x={-60} y={160} width={200} height={34} rx={8} fill={C.steelD} stroke={C.line} strokeWidth={6} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-44 + i * 46} y={206} width={30} height={100} rx={4} fill="#9DAEBE" stroke={C.line} strokeWidth={3} />)}
          <rect x={90} y={96} width={34} height={70} fill={C.steelD} stroke={C.line} strokeWidth={5} />
          <ellipse cx={107 + hum} cy={78} rx={26} ry={16} fill={C.white} opacity={0.5} />
          {/* gauge and ADN newsprint badge */}
          <g transform="translate(-170 130)">
            <circle r={52} fill={C.white} stroke={C.line} strokeWidth={6} />
            <path d="M -38,16 A 44,44 0 0 1 38,16" stroke={C.snowD} strokeWidth={8} fill="none" />
            <line x1={0} y1={6} x2={40 * Math.sin(lerp(-1.2, 0.9, needle))} y2={6 - 40 * Math.cos(lerp(-1.2, 0.9, needle))} stroke={C.line} strokeWidth={6} strokeLinecap="round" />
            <circle cy={6} r={7} fill={C.line} />
          </g>
          <g transform={`translate(-170 ${200 - 10 * (1 - badge)})`} opacity={badge}>
            <rect x={-44} y={0} width={88} height={34} rx={4} fill={C.news} stroke={C.line} strokeWidth={4} />
            <text x={0} y={24} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} letterSpacing={2} fill={C.ink}>ADN</text>
          </g>
          {/* the dashed cable: lunges toward the utility-pole socket at the right edge and stops a hand-width short */}
          <rect x={196} y={90} width={14} height={300} fill={C.woodD} stroke={C.line} strokeWidth={5} />
          <rect x={160} y={226} width={50} height={46} rx={6} fill={C.white} stroke={C.line} strokeWidth={5} />
          <circle cx={178} cy={249} r={5} fill={C.line} /><circle cx={194} cy={249} r={5} fill={C.line} />
          <path d={`M 140,${280} Q ${lerp(140, 112, lunge)},${lerp(300, 262, lunge)} ${lerp(140, 112, lunge)},${lerp(290, 252, lunge)}`} stroke={C.line} strokeWidth={9} strokeDasharray="14 9" fill="none" />
          <rect x={lerp(120, 104, lunge)} y={lerp(266, 238, lunge)} width={26} height={24} rx={4} fill={C.steelD} stroke={C.line} strokeWidth={4} />
          {/* tabs clipped to the card's lower edge */}
          <g transform={`translate(-110 ${400 - 28 * (1 - tab1)})`} opacity={tab1}>
            <rect x={-96} y={0} width={190} height={46} rx={5} fill={C.white} stroke={C.line} strokeWidth={4} />
            <text x={0} y={31} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={C.ink}>STAK SAYS</text>
          </g>
          <g transform={`translate(120 ${400 - 28 * (1 - tab2)}) rotate(${6 * tab2})`} opacity={tab2}>
            <rect x={-80} y={0} width={160} height={46} rx={5} fill={C.paperD} stroke={C.line} strokeWidth={4} />
            <text x={0} y={31} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={2} fill={C.ink}>CLAIM</text>
          </g>
        </Card>
      </HeldProp>
    </g>
  );
};

const Clipping: React.FC<WP> = ({f, b}) => {
  const inn = ease(f, b(17) - 14, 22);
  const out = flick(f, b(20) - 10);
  if (inn <= 0.01 || out >= 0.99) return null;
  const clock = ease(f, b(19), 16);
  return (
    <g transform={`translate(${lerp(-400, 0, inn)} ${-900 * out}) rotate(${-24 * out} 430 760)`}>
      <HeldProp f={f} px={430} py={940} w={480} h={420} seed={6.1} kind="hang">
        <Card x={430} w={480} h={410} tilt={-1.2 * Math.sin(f / 38)} tone={C.news}>
          <rect x={-210} y={30} width={420} height={56} fill={C.ink} />
          <text x={0} y={70} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={6} fill={C.news}>WORLD OIL</text>
          <rect x={-210} y={96} width={140} height={32} rx={4} fill={C.paperD} stroke={C.ink} strokeWidth={3} />
          <text x={-140} y={119} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>NOV 5</text>
          <Ink x={-210} y={150} w={420} n={6} gap={30} o={0.42} />
          <rect x={-210} y={150} width={140} height={110} fill={C.snowS} stroke={C.ink} strokeWidth={3} opacity={0.0} />
        </Card>
      </HeldProp>
      <g transform={`translate(${lerp(430, 430, clock)} 0)`} opacity={0} />
    </g>
  );
};

/** the second cord: clipped to the tag, running left to a coil in the snow with a clock opening at its end */
const SecondCord: React.FC<WP> = ({f, b}) => {
  const inn = easeIO(f, b(18) - 4, 26);
  if (inn <= 0.01) return null;
  const clock = ease(f, b(19), 18);
  const hand = (f - b(19)) / 7;
  const ex = lerp(780, 400, inn);
  const ey = lerp(1130, 1250, inn);
  return (
    <g>
      <path d={`M 790,1120 Q ${lerp(790, 590, inn)},${lerp(1140, 1290, inn)} ${ex},${ey}`} stroke={C.line} strokeWidth={11} fill="none" strokeLinecap="round" />
      <path d={`M 790,1120 Q ${lerp(790, 590, inn)},${lerp(1140, 1290, inn)} ${ex},${ey}`} stroke="#9AA9B8" strokeWidth={6} fill="none" strokeLinecap="round" />
      <g transform={`translate(${ex} ${ey})`}>
        {[0, 1, 2].map((i) => <ellipse key={i} cx={-4 - i * 3} cy={4 + i * 2} rx={32 - i * 7} ry={14 - i * 3} fill="none" stroke={C.line} strokeWidth={7} />)}
        {[0, 1, 2].map((i) => <ellipse key={i} cx={-4 - i * 3} cy={4 + i * 2} rx={32 - i * 7} ry={14 - i * 3} fill="none" stroke="#9AA9B8" strokeWidth={3} />)}
      </g>
      <g transform={`translate(${ex - 4} ${ey - 150}) scale(${clock})`} opacity={clock * (1 - flick(f, b(20) - 12))}>
        <circle r={72} fill={C.white} stroke={C.line} strokeWidth={7} />
        {Array.from({length: 12}).map((_, i) => <line key={i} x1={Math.sin(i * Math.PI / 6) * 58} y1={-Math.cos(i * Math.PI / 6) * 58} x2={Math.sin(i * Math.PI / 6) * 66} y2={-Math.cos(i * Math.PI / 6) * 66} stroke={C.line} strokeWidth={4} />)}
        <line x1={0} y1={0} x2={Math.sin(hand) * 50} y2={-Math.cos(hand) * 50} stroke={C.line} strokeWidth={6} strokeLinecap="round" />
        <line x1={0} y1={0} x2={Math.sin(hand / 12) * 32} y2={-Math.cos(hand / 12) * 32} stroke={C.line} strokeWidth={8} strokeLinecap="round" />
        <circle r={7} fill={C.line} />
        <path d="M 0,72 V 128" stroke={C.line} strokeWidth={5} />
      </g>
    </g>
  );
};

/** the comments arrive as paper snow: slips fall out of the dusk onto the clothesline and the snow, a tally counts them, red tabs fill a crate */
const PaperFall: React.FC<WP> = ({f, b}) => {
  if (f < b(20) - 6) return null;
  const gone = flick(f, b(28) + 70);
  if (gone >= 0.99) return null;
  const tally = easeIO(f, b(21), 70);
  const count = Math.round(1205 * tally);
  const digs = String(count).padStart(4, '0');
  const tabbed = easeIO(f, b(23), 50);
  const N = 130;
  return (
    <g opacity={1 - gone}>
      {Array.from({length: N}).map((_, i) => {
        const t0 = b(20) + i * 0.8 * (1 - 0.3 * h01(i, 3));
        const k = clamp01((f - t0) / 40);
        if (k <= 0) return null;
        const lx = 190 + 580 * h01(i, 1);
        const onCord = h01(i, 9) > 0.78;
        const ly = onCord ? cordY(lx, 80) + 26 : GROUND - 6 - 64 * h01(i, 2) * (0.4 + 0.6 * Math.sin((lx / 800) * Math.PI));
        const x0 = lx + 90 * Math.sin(i * 1.3) - 80;
        const x1 = lerp(x0, lx, easeIO(k, 0, 1)) + 20 * Math.sin(k * 11 + i);
        const y1 = lerp(380, ly, k);
        const rot = h01(i, 5) * 80 - 40 + 90 * (1 - k) * Math.sin(i);
        const inCrate = tabbed > h01(i, 7) && h01(i, 8) > 0.55 && !onCord;
        if (inCrate) return null;
        return (
          <g key={i} transform={`translate(${x1} ${y1}) rotate(${rot})`}>
            <rect x={-22} y={-15} width={44} height={30} rx={3} fill={C.paper} stroke={C.line} strokeWidth={3} />
            <path d="M -14,-5 h 28 M -14,3 h 20" stroke={C.ink} strokeWidth={3} opacity={0.5} />
            {i % 3 !== 0 && tabbed > h01(i, 4) && <rect x={-22} y={-15} width={44} height={9} rx={3} fill={C.red} stroke={C.line} strokeWidth={2} />}
          </g>
        );
      })}
      {/* the crate: red tabs only here, a visible minority of pale slips stay untabbed */}
      <g opacity={ease(f, b(22), 14)} transform={`translate(0 ${-14 * (1 - ease(f, b(22), 14))})`}>
        <g transform="translate(240 1214)">
          <ellipse cx={0} cy={82} rx={92} ry={12} fill={C.line} opacity={0.3} />
          <rect x={-86} y={0} width={172} height={80} rx={6} fill={C.woodD} stroke={C.line} strokeWidth={6} />
          {Array.from({length: 14}).map((_, i) => {
            const vis = tabbed * 14 > i;
            return vis ? (
              <g key={i} transform={`translate(${-60 + (i % 7) * 20} ${-8 - Math.floor(i / 7) * 10 - 3 * (i % 3)}) rotate(${(i % 5) * 4 - 8})`}>
                <rect x={-14} y={-10} width={28} height={36} rx={2} fill={C.paper} stroke={C.line} strokeWidth={3} />
                {i % 4 !== 3 && <rect x={-14} y={-10} width={28} height={10} rx={2} fill={C.red} stroke={C.line} strokeWidth={2} />}
              </g>
            ) : null;
          })}
          <rect x={-86} y={26} width={172} height={54} rx={4} fill={C.wood} stroke={C.line} strokeWidth={5} />
        </g>
      </g>
      {/* the tally counter on its own small post */}
      <g opacity={ease(f, b(21) - 4, 12) * (1 - flick(f, b(24) - 12))} transform="translate(520 1010)">
        <rect x={-8} y={44} width={16} height={240} fill={C.wood} stroke={C.line} strokeWidth={5} />
        <rect x={-92} y={-44} width={184} height={88} rx={10} fill={C.steelD} stroke={C.line} strokeWidth={6} />
        {digs.split('').map((d, i) => (
          <g key={i} transform={`translate(${-66 + i * 44} 0)`}>
            <rect x={-18} y={-28} width={36} height={56} rx={4} fill={C.white} stroke={C.line} strokeWidth={3} />
            <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={44} fill={C.ink}>{d}</text>
          </g>
        ))}
      </g>
    </g>
  );
};

/** the governor-elect's card hangs on its own small post beside the stake, with no line to the lease tag at all */
const GovCard: React.FC<WP> = ({f, b}) => {
  const inn = ease(f, b(24) - 10, 26);
  if (inn <= 0.01) return null;
  const out = easeIO(f, b(28) - 4, 26);
  if (out >= 0.99) return null;
  const tab = ease(f, b(26), 16);
  const x = lerp(-200, 560, inn);
  const y = 960 + 8 * Math.sin(f / 13);
  return (
    <g transform={`translate(0 ${-800 * out})`}>
      <ellipse cx={x} cy={GROUND + 4} rx={56} ry={10} fill={C.line} opacity={0.3} />
      <rect x={x - 8} y={y - 120} width={16} height={GROUND - y + 120} fill={C.wood} stroke={C.line} strokeWidth={5} />
      <path d={`M ${x},${y - 120} V ${y - 100}`} stroke={C.line} strokeWidth={6} />
      <g transform={`translate(${x} ${y}) rotate(${3 * Math.sin(f / 11 + 1)})`}>
        <rect x={-96} y={-94} width={200} height={236} rx={8} fill="#000" opacity={0.22} transform="translate(8 10)" />
        <rect x={-104} y={-104} width={200} height={236} rx={8} fill={C.paper} stroke={C.line} strokeWidth={6} />
        <text x={-4} y={-52} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={21} letterSpacing={1.5} fill={C.ink}>GOVERNOR-</text>
        <text x={-4} y={-26} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={21} letterSpacing={1.5} fill={C.ink}>ELECT</text>
        <Ink x={-84} y={-4} w={160} n={4} gap={26} o={0.35} />
        <g transform={`translate(-4 ${132 - 8 * (1 - tab)})`} opacity={tab}>
          <rect x={-80} y={0} width={160} height={44} rx={5} fill={C.white} stroke={C.line} strokeWidth={4} />
          <text x={0} y={29} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={15} fill={C.ink}>NOT AN ACTION</text>
        </g>
      </g>
    </g>
  );
};

/** the seasonal markers: small pennants hung along the lease cord when the real tension lands */
const Markers: React.FC<WP> = ({f, b}) => {
  const k = easeIO(f, b(31) - 10, 40);
  if (k <= 0.01) return null;
  const load = easeIO(f, b(28), 40);
  const sag = lerp(110, 54, 1) + 26 * load;
  return (
    <g>
      {Array.from({length: 11}).map((_, i) => {
        const x = lerp(740, 190, (i + 0.5) / 11);
        if ((740 - x) / 550 > k) return null;
        const y = cordY(x, sag);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${4 * Math.sin(f / 9 + i)})`}>
            <path d="M 0,0 L 30,60 L -30,60 Z" fill={i % 2 ? C.paper : C.snowS} stroke={C.line} strokeWidth={4} strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
};

const Slips2: React.FC<WP> = ({f, b}) => {
  // slips snag on the stake's strings and the tag once the lean begins
  const k = easeIO(f, b(28), 30);
  if (k <= 0.01) return null;
  return (
    <g>
      {Array.from({length: 22}).map((_, i) => {
        const a = h01(i, 11);
        const x = SX - 190 + 330 * a;
        const y = 1160 + 130 * h01(i, 12) - 200 * (1 - k);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${h01(i, 13) * 90 - 45})`} opacity={k}>
            <rect x={-20} y={-14} width={40} height={28} rx={3} fill={C.paper} stroke={C.line} strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
};

const Reticle: React.FC<WP> = ({f, b}) => {
  const inn = ease(f, b(32), 16);
  if (inn <= 0.01 || f > b(35) - 8) return null;
  const lock = easeIO(f, b(34) - 8, 16);
  const flyer = ease(f, b(44) - 6, 18);
  const sweep = easeIO(f, b(32) + 4, 40);
  const rx = 640 + 10 * Math.sin(f / 9) * (1 - lock);
  const ry = lerp(780, 1040, sweep) + 14 * Math.cos(f / 12) * (1 - lock);
  const r = lerp(70, 62, lock);
  return (
    <g>
      {/* the advocacy group's flyer, its own card at the right end of the line, with the phrase on it */}
      <g transform={`translate(${lerp(300, 0, flyer)} 0)`} opacity={flyer}>
        <Card x={790} w={140} h={250} sag={30} tilt={2 * Math.sin(f / 29)}>
          <rect x={-64} y={34} width={128} height={38} rx={4} fill={C.dusk} />
          <text x={0} y={59} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={14} letterSpacing={0.6} fill={C.white}>ADVOCACY</text>
          <text x={0} y={112} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={12} fill={C.ink}>AI COMPUTING</text>
          <Ink x={-56} y={134} w={110} n={3} gap={26} o={0.35} />
        </Card>
      </g>
      {/* the marker stick held in the raven's beak, and the reticle ring on the notice */}
      <path d={`M 604,1218 L ${rx + r * 0.8},${ry + r * 0.8}`} stroke={C.line} strokeWidth={10} strokeLinecap="round" />
      <path d={`M 604,1218 L ${rx + r * 0.8},${ry + r * 0.8}`} stroke={C.wood} strokeWidth={5} strokeLinecap="round" />
      <circle cx={rx} cy={ry} r={r} fill="none" stroke={C.line} strokeWidth={14} />
      <circle cx={rx} cy={ry} r={r} fill="none" stroke={C.paper} strokeWidth={7} strokeDasharray={lock > 0.5 ? '0' : '18 10'} />
      <path d={`M ${rx - r - 18},${ry} H ${rx - r + 22} M ${rx + r - 22},${ry} H ${rx + r + 18} M ${rx},${ry - r - 18} V ${ry - r + 22} M ${rx},${ry + r - 22} V ${ry + r + 18}`} stroke={C.line} strokeWidth={6} />
      <g opacity={lock} transform={`translate(${rx} ${ry - r - 44})`}>
        <rect x={-92} y={-26} width={184} height={52} rx={6} fill={C.white} stroke={C.line} strokeWidth={5} />
        <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} letterSpacing={1} fill={C.ink}>0 MATCHES</text>
      </g>
    </g>
  );
};

/** the ruler: both cords laid along it at the same scale, fifteen ticks against fifty, both fully in frame */
const RulerWorld: React.FC<WP> = ({f, b}) => {
  const inn = easeIO(f, b(35) - 6, 30);
  if (inn <= 0.01) return null;
  const unit = 14;                 // px per tick
  const x1 = 790;                  // both cords start at the tag side and run left
  const long = easeIO(f, b(36), 50);
  const short = easeIO(f, b(37), 30);
  const sway = Math.sin(f / 6) * 3 * short;
  return (
    <g opacity={inn} transform={`translate(0 ${(1 - inn) * 80})`}>
      <ellipse cx={420} cy={1272} rx={420} ry={14} fill={C.line} opacity={0.28} />
      {/* the ruler plank */}
      <rect x={x1 - 50 * unit - 20} y={1200} width={50 * unit + 40} height={64} rx={6} fill={C.paper} stroke={C.line} strokeWidth={6} />
      {Array.from({length: 51}).map((_, i) => {
        const x = x1 - i * unit;
        const tall = i % 10 === 0 ? 40 : i % 5 === 0 ? 30 : 20;
        return <line key={i} x1={x} y1={1200} x2={x} y2={1200 + tall} stroke={C.ink} strokeWidth={i % 5 === 0 ? 4 : 2.5} />;
      })}
      {/* the lease cord, all fifty ticks, orange only because it is the cord on the tag */}
      <path d={`M ${x1},1154 H ${x1 - 50 * unit * long}`} stroke={C.line} strokeWidth={18} strokeLinecap="round" />
      <path d={`M ${x1},1154 H ${x1 - 50 * unit * long}`} stroke={C.orange} strokeWidth={10} strokeLinecap="round" />
      {/* the gas cord, fifteen ticks, ending in an unfinished knot */}
      <path d={`M ${x1},1110 H ${x1 - 15 * unit * short}`} stroke={C.line} strokeWidth={18} strokeLinecap="round" />
      <path d={`M ${x1},1110 H ${x1 - 15 * unit * short}`} stroke="#9AA9B8" strokeWidth={10} strokeLinecap="round" />
      {short > 0.9 && (
        <g transform={`translate(${x1 - 15 * unit} 1110)`}>
          <path d="M 0,0 H -60" stroke={C.line} strokeWidth={8} strokeDasharray="12 10" strokeLinecap="round" opacity={0.7} />
          <g transform="translate(24 -62)">
            <rect x={-72} y={0} width={144} height={34} rx={4} fill={C.news} stroke={C.line} strokeWidth={4} />
            <text x={0} y={24} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={14} letterSpacing={2} fill={C.ink}>REPORTED</text>
          </g>
        </g>
      )}
      {/* the tag's end of each cord */}
      <rect x={x1 - 6} y={1098} width={14} height={70} rx={4} fill={C.steelD} stroke={C.line} strokeWidth={4} />
    </g>
  );
};

const CalendarTab: React.FC<WP> = ({f, b}) => {
  const inn = ease(f, b(39) - 10, 22);
  if (inn <= 0.01) return null;
  const ring = easeIO(f, b(39) + 6, 24);
  return (
    <g transform={`translate(${lerp(-300, 0, inn)} 0)`}>
      <Card x={420} w={300} h={320} sag={54} tilt={1.2 * Math.sin(f / 31)}>
        <rect x={-130} y={34} width={260} height={46} fill={C.ink} />
        <text x={0} y={66} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} letterSpacing={6} fill={C.paper}>NOV</text>
        {Array.from({length: 30}).map((_, i) => {
          const cx = -108 + (i % 7) * 36, cy = 118 + Math.floor(i / 7) * 42;
          return <text key={i} x={cx} y={cy} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={C.ink}>{i + 1}</text>;
        })}
        {/* the 30th, in the last row, third column */}
        <ellipse cx={-108 + 1 * 36} cy={118 + 4 * 42 - 6} rx={19 * ring + 1} ry={17 * ring + 1} fill="none" stroke={C.lamp} strokeWidth={6} opacity={ring > 0.02 ? 1 : 0} />
        <ellipse cx={-108 + 1 * 36} cy={118 + 4 * 42 - 6} rx={19 * ring + 1} ry={17 * ring + 1} fill="none" stroke={C.line} strokeWidth={2} opacity={ring > 0.02 ? 0.7 : 0} />
      </Card>
    </g>
  );
};

/** the raven: ordinary fauna, a supporting witness with one job per act */
const RavenJob: React.FC<WP> = ({f, b}) => {
  const hop = Math.max(0, Math.sin(Math.PI * clamp01((f - b(1)) / 14))) * 18;
  const peck = f >= b(1) && f < b(1) + 30 ? 10 * Math.max(0, Math.sin((f - b(1)) / 3)) : 0;
  const tap = 12 * Math.max(0, Math.sin(Math.PI * clamp01((f - b(42)) / 16)));
  const dropSlip = easeIO(f, b(29), 22);
  const x = f >= b(42) - 12 ? lerp(640, 760, easeIO(f, b(42) - 14, 14)) : 640;
  return (
    <g>
      <g transform={`translate(${x - 640} ${-hop - tap})`}>
        <Raven x={640 - peck * 0.6} y={GROUND - 4} scale={0.92} f={f} facing={-1} mode="perch" />
      </g>
      {f >= b(29) - 4 && f < b(29) + 26 && (
        <g transform={`translate(${lerp(590, 520, dropSlip)} ${lerp(1190, 640, dropSlip * 0.0 + dropSlip)}) rotate(${30 * dropSlip})`} opacity={1 - clamp01((f - b(29) - 18) / 8)}>
          <rect x={-22} y={-15} width={44} height={30} rx={3} fill={C.paper} stroke={C.line} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

/** the highlighter marker the raven holds to the notice card */
const Marker: React.FC<WP> = ({f, b}) => {
  const on = ease(f, b(9) - 6, 10) * (1 - ease(f, b(11) + 10, 10));
  if (on <= 0.02) return null;
  const hi = f < b(10) ? easeIO(f, b(9), 16) : 1 + easeIO(f, b(10), 14);
  const ty = lerp(850, 930, clamp01(hi - 1)) + 0;
  const tx = 270 + 160 * (hi % 1 || (hi >= 1 ? 1 : 0));
  return (
    <g opacity={on}>
      <path d={`M 600,1215 L ${tx},${ty}`} stroke={C.line} strokeWidth={12} strokeLinecap="round" />
      <path d={`M 600,1215 L ${tx},${ty}`} stroke="#FFE66B" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

const World: React.FC<WP> = ({f, b}) => {
  const lean = 7 * easeIO(f, b(28), 40) + 3 * easeIO(f, b(38), 30);
  return (
    <g>
      <Backdrop f={f} act={(f >= b(12) ? 1 : 0) + (f >= b(20) ? 1 : 0) + (f >= b(32) ? 1 : 0)} />
      <Clothesline f={f} b={b} lean={lean} />
      <Markers f={f} b={b} />
      <HollowCard f={f} b={b} />
      <NoticeCard f={f} b={b} />
      <MapTab f={f} b={b} />
      <CutawayCard f={f} b={b} />
      <Clipping f={f} b={b} />
      <CalendarTab f={f} b={b} />
      <Flags f={f} b={b} />
      <CompanySign f={f} b={b} />
      <Stake f={f} lean={lean} />
      <SecondCord f={f} b={b} />
      <Tag f={f} b={b} lean={lean} />
      <GovCard f={f} b={b} />
      <PaperFall f={f} b={b} />
      <Slips2 f={f} b={b} />
      <Marker f={f} b={b} />
      <Reticle f={f} b={b} />
      <RavenJob f={f} b={b} />
    </g>
  );
};

/** the overhead stage: a table-top view of the snow with the ruler laid out, both cords along it, the stake seen from above with its shadow */
const TopView: React.FC<WP> = ({f, b}) => {
  const lean = easeIO(f, b(38), 36);
  const shadowLen = 120 + 150 * lean;
  return (
    <g>
      <path d="M -40,420 H 1120 V 1920 H -40 Z" fill={C.snow} />
      {Array.from({length: 13}).map((_, i) => (
        <path key={i} d={`M -40,${520 + i * 110} Q 300,${500 + i * 110 + 20 * Math.sin(i)} 560,${530 + i * 110} T 1120,${520 + i * 110}`} stroke={C.snowS} strokeWidth={5} fill="none" opacity={0.5} />
      ))}
      {Array.from({length: 14}).map((_, i) => (
        <ellipse key={i} cx={120 + i * 66} cy={1000 + 20 * Math.sin(i * 1.7)} rx={16} ry={9} fill={C.snowS} opacity={0.4} />
      ))}
      <path d={`M 860,1140 L ${860 - shadowLen},1180 L ${860 - shadowLen + 6},1200 L 872,1160 Z`} fill={C.line} opacity={0.3} />
      <circle cx={860} cy={1140} r={30} fill={C.wood} stroke={C.line} strokeWidth={7} />
      <circle cx={860} cy={1140} r={12} fill={C.woodD} />
      <path d="M 872,1124 q 40,-10 62,6 q -26,6 -34,18 Z" fill={C.orange} stroke={C.line} strokeWidth={4} strokeLinejoin="round" />
      <rect x={796} y={1096} width={30} height={90} rx={5} fill={C.orange} stroke={C.line} strokeWidth={5} />
      <RulerWorld f={f} b={b} />
      <g transform={`translate(0 ${-8 * easeIO(f, b(38), 20)})`}>
        <Raven x={300} y={1060} scale={0.62} f={f} facing={-1} mode="perch" />
      </g>
    </g>
  );
};

// ---- the shots: one locked world, the camera barely drifts, plates on the beats -----------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [1, 2, 3];
  const cam = track([{t: 0, z: 1.0, fx: 640, fy: 930}, {t: p.dur, z: 1.05, fx: 700, fy: 950}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate x={540} y={620} displayLines={['ONE WORD NOT', 'IN THE NOTICE']} text="ONE WORD NOT IN THE NOTICE" size={52} tone="glow" p={ease(f, 0, 10) * (1 - ease(f, b(3) + 20, 10))} />
        <Plate x={540} y={1180} text="50-YEAR LEASE" size={46} tone="dark" p={ease(f, b(2), 12) * (1 - ease(f, b(3) - 4, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1180} text="NEAR DEADHORSE" size={40} tone="plate" p={ease(f, b(3), 12)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><World f={f} b={b} /><HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={21} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.0, fx: 600, fy: 940}, {t: p.dur, z: 1.04, fx: 560, fy: 950}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate x={540} y={620} text="APPROVED NOV 10" size={44} tone="glow" p={ease(f, b(4), 12) * (1 - ease(f, b(5) - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={620} text="STAK ENERGY" size={46} tone="dark" p={ease(f, b(5), 12) * (1 - ease(f, b(6) - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={620} text="ADL 422741" size={50} tone="glow" p={ease(f, b(6), 12)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><World f={f} b={b} /><HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={22} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.0, fx: 560, fy: 960}, {t: p.dur, z: 1.04, fx: 520, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate x={540} y={600} text="ABOUT 715 ACRES" size={46} tone="glow" p={ease(f, b(7), 12) * (1 - ease(f, b(8) - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate displayLines={['26 MILES SOUTH', 'OF DEADHORSE']} text="26 MILES SOUTH OF DEADHORSE" x={800} y={560} size={30} tone="plate" p={ease(f, b(8), 12)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><World f={f} b={b} /><HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={23} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [9, 10, 11];
  const cam = track([{t: 0, z: 1.4, fx: 560, fy: 1000}, {t: p.dur, z: 1.46, fx: 566, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate x={540} y={520} text="GAS-POWERED DATA CENTER · STATE NOTICE" size={30} tone="glow" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={520} text="HIGH-PERFORMANCE COMPUTING · STATE NOTICE" size={28} tone="glow" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={520} text="STILL NO SUCH WORD" size={40} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><World f={f} b={b} /><HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={24} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [12, 13, 14, 15, 16];
  const cam = track([{t: 0, z: 1.4, fx: 560, fy: 1000}, {t: p.dur, z: 1.46, fx: 566, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate x={540} y={600} text="NORTH SLOPE GAS · ADN" size={36} tone="glow" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={600} text="1 TO 3 GW · ADN" size={44} tone="glow" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={600} text="OFF-GRID · ADN" size={46} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={600} displayLines={['STAK SAYS NO IMPACT', 'PUBLIC GRID']} text="STAK SAYS NO IMPACT · PUBLIC GRID" size={36} tone="plate" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={600} text="A COMPANY CLAIM" size={42} tone="warn" p={vis(f, b, K, 4)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><World f={f} b={b} /><HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={25} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [17, 18, 19];
  const cam = track([{t: 0, z: 1.0, fx: 560, fy: 960}, {t: p.dur, z: 1.05, fx: 580, fy: 990}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate displayLines={['WORLD OIL', 'REPORTED NOV 5']} text="WORLD OIL · REPORTED NOV 5" x={540} y={600} size={36} tone="glow" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate displayLines={['15-YR GAS SALE AGREEMENT', 'REPORTED']} text="15-YR GAS SALE AGREEMENT · REPORTED" x={540} y={600} size={34} tone="glow" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={600} text="HOW LONG?" size={56} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><World f={f} b={b} /><HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={26} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [20, 21, 22, 23];
  const cam = track([{t: 0, z: 1.12, fx: 440, fy: 1060}, {t: p.dur, z: 1.18, fx: 470, fy: 1060}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate x={540} y={600} text="THE PUBLIC COMMENTED" size={36} tone="glow" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate displayLines={['1,205 COMMENTS', 'ENV. CENTER COUNT']} text="1,205 COMMENTS · ENV. CENTER COUNT" x={540} y={600} size={36} tone="glow" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={600} text="ANCHORAGE DAILY NEWS" size={36} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={600} text="MOSTLY OPPOSED · ADN" size={40} tone="warn" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><World f={f} b={b} /><HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={27} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [24, 25, 26, 27];
  const cam = track([{t: 0, z: 1.0, fx: 600, fy: 980}, {t: p.dur, z: 1.04, fx: 640, fy: 990}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate displayLines={['GOV-ELECT WOULD SUPPORT', 'DATA CENTER MORATORIUM · ADN']} text="GOV-ELECT WOULD SUPPORT DATA CENTER MORATORIUM · ADN" x={540} y={580} size={30} tone="glow" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={580} text="DATA CENTER CONSTRUCTION" size={34} tone="glow" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate displayLines={['STATEMENT OF SUPPORT', 'NOT AN ACTION']} text="STATEMENT OF SUPPORT · NOT AN ACTION" x={540} y={580} size={34} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={580} text="NOT TIED TO THIS LEASE · ADN" size={34} tone="dark" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><World f={f} b={b} /><HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={28} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [28, 29, 31];
  const cam = track([{t: 0, z: 1.0, fx: 520, fy: 950}, {t: p.dur, z: 1.05, fx: 560, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate x={540} y={560} text="THE REAL TENSION" size={46} tone="glow" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={560} text="IF IT POWERS ITSELF · OFF-GRID PER ADN" size={29} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={560} text="50 YEARS · ABOUT 715 ACRES" size={40} tone="glow" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><World f={f} b={b} /><HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={29} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [32, 44, 33, 34];
  const cam = track([{t: 0, z: 1.4, fx: 560, fy: 1000}, {t: p.dur, z: 1.46, fx: 566, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate x={540} y={500} text="THE MISSING WORD" size={46} tone="glow" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={500} text="NORTHERN ALASKA ENV. CENTER" size={30} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate displayLines={['ADVOCACY GROUP LISTS', '"ARTIFICIAL INTELLIGENCE COMPUTING"']} text={'ADVOCACY GROUP LISTS "ARTIFICIAL INTELLIGENCE COMPUTING"'} x={540} y={500} size={30} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={500} text={'NOTICE TEXT · NO "AI"'} size={44} tone="glow" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><World f={f} b={b} /><HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={30} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [35, 36, 37, 38];
  const cam = track([{t: 0, z: 1.0, fx: 600, fy: 960}, {t: b(37), z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.0, fx: 500, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate displayLines={['LAND · GAS ·', 'HALF A CENTURY']} text="LAND · GAS · HALF A CENTURY" x={540} y={560} size={40} tone="glow" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={560} text="HALF A CENTURY" size={46} tone="glow" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate displayLines={['15-YR GAS SALE AGREEMENT', 'REPORTED']} text="15-YR GAS SALE AGREEMENT · REPORTED" x={540} y={560} size={34} tone="glow" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={560} text="50-YEAR LEASE" size={48} tone="dark" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG><TopView f={f} b={b} /><HeldTravel f={f} x={0} y={1000} w={1080} h={300} seed={31} strength={0.4} rx={20} mode="shadow" /></SVG>
    </Frame>
  );
};

const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [39, 45, 40, 42, 43];
  const cam = track([{t: 0, z: 1.0, fx: 640, fy: 960}, {t: b(40), z: 1.1, fx: 760, fy: 1030}, {t: p.dur, z: 1.14, fx: 780, fy: 1050}]);
  const black = ease(f, b(43) + 24, 6);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate x={540} y={520} text="RECONSIDERATION DUE NOV 30" size={32} tone="glow" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={520} text="ONE QUESTION" size={52} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={520} text="WHAT SHOULD ALASKA ASK?" size={40} tone="glow" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={520} text="IN RETURN" size={52} tone="plate" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={520} text="50 YEARS OF STATE LAND" size={38} tone="dark" p={vis(f, b, K, 4)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <World f={f} b={b} />
        <HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={32} strength={0.4} rx={20} mode="shadow" />
        <path d="M -100,-100 H 1200 V 2000 H -100 Z" fill="#000" opacity={black} />
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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

export const ep1112Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1112Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1112: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 9, 17, 22, 27, 36, 50, 58, 68, 78, 90, 102, 115].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.dusk}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#0F1B28" ink="#E8EEF4" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
