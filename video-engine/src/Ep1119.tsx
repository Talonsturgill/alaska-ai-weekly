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
import {HeldTravel, HeldProp} from './lib/heldidle';
import {IdleFigure, FigureFinish} from './lib/figureidle';
import {SuggestionSlip, Airliner, Router, CorkBoard, PushPin, BoardString, Tarp, Stopwatch, Magnifier, Pie, CopperCoil, DeskCalendar, RouterField, GS} from './lib/groundstop';
import {BushPlane} from './lib/vehicles';
import {Moose, Raven, BaldEagle} from './lib/fauna';
import {AK_PATH} from './lib/akmap';
import {IDS} from './Ep1119Ids';

// One Thousand Knocks, 2026-11-19. Palette roles are art_direction.json: persimmon low daylight over bone ivory, pine for night and
// the vault, cork for the board, brick-red question strings, and fiber cyan ONLY on the traced mechanism (the router, its pulses,
// the fiber and the string to it). Slip and the jet are the only faces. No tick, no CLEARED, no GUILTY anywhere.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;

export const C = {
  sky0: '#9C3F2A', sky1: '#E0662B', sky2: '#F4B183', snow: GS.ivory, buff: GS.buff, shade: '#B9A588', range: '#7A4A3E', rangeD: '#5A3A34',
  pine: GS.pine, pineD: GS.pineD, wall: '#E8DCC2', wallD: '#CDBB98', desk: '#6B4A32', deskL: '#8E6646', paper: '#FFF6E3', ink: '#1B1A22',
  cyan: GS.cyan, string: GS.string, sun: '#FFE2B0', lamp: '#FFE7A8',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const settle = (f: number, at: number, amp = 1, dur = 22) => {
  const t = f - at;
  if (t < 0 || t > dur) return 0;
  return amp * Math.sin(t * 0.7) * Math.exp(-t / (dur * 0.35));
};
/** visible window: fades in over 6 frames from a, out over 8 before z */
const win = (f: number, a: number, z = 1e9) => Math.min(clamp01((f - a) / 6), clamp01((z - f) / 8));

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'plate' | 'dark' | 'cyan';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  dark: {fill: '#0E3A40', fg: '#FFF6E3', edge: '#FFF6E3'},
  cyan: {fill: '#082F35', fg: '#BFFBFF', edge: GS.cyan},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'plate', p = 1, rot = 0}) => {
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

/** a small tag sized to its string, used on figures and props */
const Lab: React.FC<{text: string; x: number; y: number; size?: number; fill?: string; ink?: string; rot?: number}> = ({text, x, y, size = 22, fill = C.paper, ink = C.ink, rot = 0}) => {
  const w = monoW(text, size) + 24;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2} y={-size * 0.75 - 6} width={w} height={size * 1.5 + 4} rx={5} fill={fill} stroke={C.ink} strokeWidth={3} />
      <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} fill={ink}>{text}</text>
    </g>
  );
};

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; overlay?: React.ReactNode; bg?: string; warmth?: number; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.22, ox = 540, oy = 960, overlay, bg = C.wall, warmth = 0.03, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 12 * Math.sin(p.f / 110) + 8 * t, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: bg}} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#0E3A40" stroke="#FFF6E3" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#FFF6E3">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.05} warmth={warmth} />
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

// ---- the shared worlds -----------------------------------------------------------------------------------------------------------------------------
/** a low November sky painted from above the frame edge: brick zenith to persimmon to peach, a low sun in the south-west, the Chugach in two planes */
const Sky: React.FC<{f: number; horizon: number; seed?: number; sunX?: number}> = ({f, horizon, seed = 0, sunX = 220}) => {
  const gid = `gsky${horizon}${seed}`;
  const ridge = (amp: number, sd: number, dx: number, base: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 16; i++) {
      const x = -140 + i * 90 + dx;
      const y = base - amp * (0.35 + 0.65 * h01(i, sd)) * ((i + sd) % 3 === 0 ? 0.6 : 1);
      pts.push(`${x} ${y.toFixed(1)}`);
    }
    return `M -140 ${base + 4} L ${pts.join(' L ')} L 1320 ${base + 4} Z`;
  };
  const drift = Math.sin(f / 95 + seed) * 12;
  return (
    <g data-band="ok">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.sky0} /><stop offset="55%" stopColor={C.sky1} /><stop offset="100%" stopColor={C.sky2} />
        </linearGradient>
        <radialGradient id={`${gid}s`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFF4D8" /><stop offset="0.4" stopColor={C.sun} stopOpacity={0.8} /><stop offset="1" stopColor={C.sky2} stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={-300} y={-80} width={1680} height={horizon + 140} fill={`url(#${gid})`} />
      <circle cx={sunX + Math.sin(f / 300) * 6} cy={horizon - 150} r={260} fill={`url(#${gid}s)`} opacity={0.9} />
      <circle cx={sunX + Math.sin(f / 300) * 6} cy={horizon - 150} r={46} fill="#FFF1D2" stroke={C.ink} strokeWidth={3} />
      {[0, 1].map((plane) => Array.from({length: 4}).map((_, i) => {
        const sp = plane ? 0.45 : 0.2;
        const cx = ((h01(i, plane + 5 + seed * 3) * 1500 + f * sp) % 1500) - 210;
        const cy = 110 + plane * 160 + h01(i, 8 + seed) * 130;
        const wv = 170 + h01(i, 9 + seed) * 200;
        return (
          <path key={`${plane}-${i}`} d={`M ${cx} ${cy} q ${wv * 0.25} -26 ${wv * 0.5} -8 q ${wv * 0.25} -22 ${wv * 0.5} 6 Z`}
            fill={plane ? '#F7C9A0' : '#EFA27A'} stroke={C.ink} strokeWidth={2.5} opacity={plane ? 0.9 : 0.6} />
        );
      }))}
      <path d={ridge(260, 3 + seed * 7, drift * 0.4, horizon - 20)} fill={C.range} stroke={C.ink} strokeWidth={3} />
      {Array.from({length: 8}).map((_, k) => {
        const i = k * 2;
        const x = -140 + i * 90 + drift * 0.4;
        const y = horizon - 20 - 260 * (0.35 + 0.65 * h01(i, 3 + seed * 7)) * ((i + 3 + seed * 7) % 3 === 0 ? 0.6 : 1);
        return <path key={k} d={`M ${x - 34} ${y + 40} L ${x} ${y} L ${x + 34} ${y + 40} L ${x + 16} ${y + 30} L ${x} ${y + 44} L ${x - 14} ${y + 30} Z`} fill="#FFF0DE" stroke={C.ink} strokeWidth={2} />;
      })}
      <path d={ridge(120, 11 + seed * 5, drift, horizon)} fill={C.rangeD} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

/** the apron: bone snow, taxi lines, a terminal with a jet bridge on the right, light poles */
const Apron: React.FC<{f: number; horizon: number; seed?: number}> = ({f, horizon, seed = 0}) => (
  <g data-band="ok">
    <rect x={-300} y={horizon} width={1680} height={2000} fill={C.snow} />
    <rect x={-300} y={horizon} width={1680} height={36} fill="#E6D8BC" />
    {/* terminal */}
    <rect x={640} y={horizon - 120} width={520} height={130} fill="#C9B8A0" stroke={C.ink} strokeWidth={4} />
    {Array.from({length: 10}, (_, i) => <rect key={i} x={660 + i * 48} y={horizon - 96} width={34} height={44} fill="#3E5A60" stroke={C.ink} strokeWidth={2} opacity={0.9} />)}
    <rect x={640} y={horizon - 140} width={520} height={22} fill={C.pine} stroke={C.ink} strokeWidth={4} />
    {/* light poles */}
    {[120, 470, 1020].map((x, i) => (
      <g key={i}>
        <rect x={x - 4} y={horizon - 210} width={8} height={220} fill="#5A5A60" stroke={C.ink} strokeWidth={2} />
        <rect x={x - 22} y={horizon - 222} width={44} height={14} rx={3} fill="#3A3A40" stroke={C.ink} strokeWidth={2} />
        <ellipse cx={x} cy={horizon - 206} rx={30} ry={8} fill={C.lamp} opacity={0.35 + 0.1 * Math.sin(f / 13 + i)} />
      </g>
    ))}
    {Array.from({length: 7}).map((_, r) => {
      const yy = horizon + 80 + r * r * 16 + r * 34;
      return <path key={r} d={`M -100 ${yy} Q ${300 + h01(r, seed) * 200} ${yy - 18 - r * 2} 600 ${yy - 4} T 1300 ${yy - 8}`} stroke={C.shade} strokeWidth={3 + r} fill="none" opacity={0.35} />;
    })}
    {/* taxi lines */}
    <path d={`M -100 ${horizon + 420} Q 540 ${horizon + 300} 1200 ${horizon + 380}`} stroke="#E8B23A" strokeWidth={8} fill="none" strokeDasharray="40 22" opacity={0.85} />
    <path d={`M 560 ${horizon + 40} L 560 ${horizon + 900}`} stroke="#E8B23A" strokeWidth={6} fill="none" opacity={0.6} />
    <line x1={-300} x2={1380} y1={horizon} y2={horizon} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** snow berms and a row of cones in the near plane under the caption bar, seeded per shot */
const NearApron: React.FC<{f: number; seed?: number; y?: number}> = ({f, seed = 0, y = 1500}) => (
  <g data-band="ok">
    {Array.from({length: 5}).map((_, i) => (
      <path key={i} d={`M ${-80 + i * 270} ${y + 140 + h01(i, seed) * 160} q 120 -60 260 -10 q 50 20 110 0 L ${-80 + i * 270 + 380} 2000 L ${-80 + i * 270} 2000 Z`}
        fill="#FBF4E6" stroke={C.ink} strokeWidth={3} />
    ))}
    {Array.from({length: 4}).map((_, i) => {
      const x = 120 + i * 260 + h01(i, seed + 4) * 60;
      const yy = y + 180 + h01(i, seed + 2) * 80;
      return (
        <g key={`c${i}`} transform={`translate(${x},${yy})`}>
          <ContactShadow cx={0} cy={2} rx={34} ry={7} opacity={0.35} />
          <path d="M -26 0 L -10 -70 L 10 -70 L 26 0 Z" fill={GS.persimmon} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M -17 -34 L 17 -34" stroke="#FFF6E3" strokeWidth={9} />
          <rect x={-34} y={-6} width={68} height={10} rx={3} fill="#3A3A40" stroke={C.ink} strokeWidth={3} />
        </g>
      );
    })}
    <path d={`M -100 ${y + 60} q 300 ${-20 + Math.sin(f / 40 + seed) * 6} 600 0 t 700 0`} stroke="#FFFFFF" strokeWidth={6} fill="none" opacity={0.5} />
  </g>
);

/** the investigation office: buff panelled wall, a window onto the Chugach and the apron, a desk lamp, and the desk edge below */
const Office: React.FC<{f: number; seed?: number; lamp?: number; win?: {x: number; y: number; w: number; h: number}; jet?: boolean; cool?: number}> = ({f, seed = 0, lamp = 1, win: wn = {x: 760, y: 150, w: 300, h: 260}, jet = true, cool = 0}) => (
  <g data-band="ok">
    <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill={C.wall} />
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${-60 + i * 150} -100 L ${-60 + i * 150} 1520`} stroke={C.wallD} strokeWidth={4} opacity={0.6} />)}
    <rect x={-300} y={1300} width={1680} height={30} fill={C.wallD} />
    {/* window with the Chugach and the apron, a little grounded jet at a gate */}
    <g transform={`translate(${wn.x},${wn.y})`}>
      <rect x={-10} y={-10} width={wn.w + 20} height={wn.h + 20} rx={6} fill="#6B4A32" stroke={C.ink} strokeWidth={5} />
      <svg x={0} y={0} width={wn.w} height={wn.h} viewBox={`0 0 ${wn.w} ${wn.h}`} overflow="hidden">
        <rect x={0} y={0} width={wn.w} height={wn.h} fill={C.sky1} />
        <rect x={0} y={0} width={wn.w} height={wn.h * 0.4} fill={C.sky0} opacity={0.6} />
        <circle cx={wn.w * 0.2} cy={wn.h * 0.42} r={18} fill="#FFF1D2" />
        <path d={`M 0 ${wn.h * 0.62} L ${wn.w * 0.15} ${wn.h * 0.36} L ${wn.w * 0.3} ${wn.h * 0.55} L ${wn.w * 0.5} ${wn.h * 0.3} L ${wn.w * 0.7} ${wn.h * 0.52} L ${wn.w * 0.86} ${wn.h * 0.34} L ${wn.w} ${wn.h * 0.5} L ${wn.w} ${wn.h * 0.66} L 0 ${wn.h * 0.66} Z`} fill={C.range} stroke={C.ink} strokeWidth={2} />
        <path d={`M ${wn.w * 0.42} ${wn.h * 0.34} L ${wn.w * 0.5} ${wn.h * 0.3} L ${wn.w * 0.58} ${wn.h * 0.36} Z M ${wn.w * 0.8} ${wn.h * 0.38} L ${wn.w * 0.86} ${wn.h * 0.34} L ${wn.w * 0.92} ${wn.h * 0.4} Z`} fill="#FFF0DE" />
        <rect x={0} y={wn.h * 0.66} width={wn.w} height={wn.h} fill={C.snow} />
        <rect x={0} y={0} width={wn.w} height={wn.h} fill="#3A5A78" opacity={0.55 * cool} />
        {jet && <g transform={`translate(${wn.w * 0.55},${wn.h * 0.86}) scale(0.3)`}><path d="M -260 -40 Q -270 -70 -230 -74 L 200 -80 Q 290 -78 300 -40 Q 290 -6 200 -2 L -220 -2 Q -258 -4 -260 -40 Z" fill={GS.jet} stroke={C.ink} strokeWidth={8} /><path d="M -240 -60 L -300 -170 L -250 -172 L -170 -66 Z" fill={GS.jetTail} stroke={C.ink} strokeWidth={8} /><path d="M -250 -30 L 280 -36" stroke={GS.jetStripe} strokeWidth={10} /></g>}
      </svg>
      <path d={`M ${wn.w / 2} 0 L ${wn.w / 2} ${wn.h} M 0 ${wn.h / 2} L ${wn.w} ${wn.h / 2}`} stroke="#6B4A32" strokeWidth={8} />
      <path d={`M 8 ${wn.h - 20} L ${wn.w * 0.3} 12`} stroke="#FFFFFF" strokeWidth={5} opacity={0.35} />
    </g>
    {/* lamp glow */}
    <ellipse cx={540} cy={820} rx={620} ry={520} fill={C.lamp} opacity={0.12 * lamp + 0.03 * Math.sin(f / 37 + seed)} />
    <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#2A4A66" opacity={0.16 * cool} />
  </g>
);

/** the desk edge in the near plane: wood with a mug, a pencil cup and paper, seeded per shot */
const DeskEdge: React.FC<{f: number; seed?: number; y?: number; kind?: 'mug' | 'pins' | 'letters' | 'files' | 'bare'}> = ({f, seed = 0, y = 1500, kind = 'mug'}) => (
  <g data-band="ok">
    <rect x={-300} y={y} width={1680} height={600} fill={C.desk} stroke={C.ink} strokeWidth={4} />
    <rect x={-300} y={y} width={1680} height={22} fill={C.deskL} />
    {Array.from({length: 6}, (_, i) => <path key={i} d={`M -300 ${y + 60 + i * 50} q 400 ${-10 + h01(i, seed) * 20} 900 0 t 900 0`} stroke="#5A3A24" strokeWidth={3} fill="none" opacity={0.5} />)}
    {kind === 'pins' && (
      <g>
        {Array.from({length: 14}, (_, i) => <g key={i} transform={`translate(${120 + h01(i, seed) * 840},${y + 70 + h01(i, seed + 1) * 160}) rotate(${h01(i, seed + 2) * 360})`}>
          <circle r={9} fill={[GS.brick, '#E8E2D2', GS.persimmon][i % 3]} stroke={C.ink} strokeWidth={2.5} /><path d="M 0 0 L 16 0" stroke="#9A9AA0" strokeWidth={3} /></g>)}
        {Array.from({length: 4}, (_, i) => <path key={`s${i}`} d={`M ${200 + i * 200} ${y + 120 + i * 20} q 40 -30 80 6 t 70 -10`} stroke={GS.string} strokeWidth={4} fill="none" />)}
      </g>
    )}
    {kind === 'letters' && (
      <g transform={`translate(${620},${y + 130}) rotate(-4)`}>
        {[0, 1, 2, 3].map((i) => <g key={i} transform={`translate(${i * 26 - 60},${-i * 10}) rotate(${-6 + i * 5})`}><ContactShadow cx={90} cy={110} rx={90} ry={8} opacity={0.25} /><rect x={0} y={0} width={180} height={120} fill={C.paper} stroke={C.ink} strokeWidth={4} /><path d="M 20 30 L 150 30 M 20 54 L 130 54 M 20 78 L 140 78" stroke={C.ink} strokeWidth={3} opacity={0.45} /></g>)}
        <text x={30} y={-26} fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>OCT 9 LETTER</text>
      </g>
    )}
    {kind === 'files' && (
      <g>
        {[0, 1, 2].map((i) => <g key={i} transform={`translate(${180 + i * 300},${y + 90 + i * 14}) rotate(${-5 + i * 4})`}><ContactShadow cx={110} cy={130} rx={110} ry={8} opacity={0.3} /><rect x={0} y={0} width={220} height={130} rx={6} fill={['#C9A46A', '#B88A52', '#D2B47C'][i]} stroke={C.ink} strokeWidth={4} /><rect x={20} y={-16} width={80} height={20} rx={4} fill={['#C9A46A', '#B88A52', '#D2B47C'][i]} stroke={C.ink} strokeWidth={4} /></g>)}
      </g>
    )}
    {kind === 'mug' && (<>
    <g transform={`translate(${160 + h01(seed, 1) * 120},${y + 150})`}>
      <ContactShadow cx={0} cy={4} rx={56} ry={10} opacity={0.4} />
      <path d="M -40 0 L -36 -90 L 36 -90 L 40 0 Z" fill={GS.pine} stroke={C.ink} strokeWidth={4} />
      <path d="M 38 -70 Q 66 -60 38 -30" stroke={C.ink} strokeWidth={8} fill="none" />
      <path d="M -24 -100 q -6 -14 0 -26 M 0 -104 q -6 -14 0 -26" stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.4 + 0.2 * Math.sin(f / 9)} />
    </g>
    <g transform={`translate(${760 + h01(seed, 2) * 140},${y + 180}) rotate(${-6 + h01(seed, 3) * 10})`}>
      <ContactShadow cx={0} cy={4} rx={130} ry={10} opacity={0.3} />
      <rect x={-120} y={-80} width={240} height={160} fill={C.paper} stroke={C.ink} strokeWidth={4} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M -96 ${-50 + i * 30} L ${60 - i * 20} ${-50 + i * 30}`} stroke={C.ink} strokeWidth={3} opacity={0.4} />)}
    </g>
    </>)}
  </g>
);

/** the night cable vault: pine walls, cable trays, one caged work lamp, cable spools in front */
const Vault: React.FC<{f: number; seed?: number}> = ({f, seed = 0}) => (
  <g data-band="ok">
    <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill={C.pineD} />
    <rect x={-300} y={-100} width={1680} height={1340} fill={C.pine} />
    {Array.from({length: 7}, (_, i) => <path key={i} d={`M -300 ${120 + i * 160} L 1380 ${120 + i * 160}`} stroke="#0A4248" strokeWidth={5} />)}
    {[180, 380].map((yy, i) => (
      <g key={i}>
        <rect x={-300} y={yy} width={1680} height={26} fill="#3A4A4E" stroke={C.ink} strokeWidth={3} />
        {Array.from({length: 14}, (_, k) => <path key={k} d={`M ${-280 + k * 120} ${yy + 26} q 60 ${40 + h01(k, i + seed) * 30} 120 0`} stroke={['#2A2A30', '#5A3A2A', '#2E4A3A'][k % 3]} strokeWidth={10} fill="none" />)}
      </g>
    ))}
    {/* caged work lamp */}
    <g transform="translate(540,120)">
      <path d="M 0 -220 L 0 -10" stroke="#2A2A30" strokeWidth={6} />
      <path d="M -40 -10 L 40 -10 L 30 40 L -30 40 Z" fill="#3A3A40" stroke={C.ink} strokeWidth={4} />
      <circle cx={0} cy={50} r={20} fill={C.lamp} stroke={C.ink} strokeWidth={3} />
      <path d="M -26 30 L -26 70 M 0 30 L 0 76 M 26 30 L 26 70 M -30 60 Q 0 80 30 60" stroke="#2A2A30" strokeWidth={4} fill="none" />
    </g>
    <path d={`M 540 170 L ${-100 + Math.sin(f / 50) * 10} 1400 L ${1180 + Math.sin(f / 50) * 10} 1400 Z`} fill={C.lamp} opacity={0.1} />
    <rect x={-300} y={1240} width={1680} height={20} fill="#06262B" />
    <line x1={-300} x2={1380} y1={1240} y2={1240} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** cable spools in the vault's near plane */
const NearSpools: React.FC<{f: number; seed?: number; y?: number}> = ({f, seed = 0, y = 1500}) => (
  <g data-band="ok">
    {[0, 1, 2].map((i) => {
      const x = 160 + i * 380 + h01(i, seed) * 60;
      const r = 150 + h01(i, seed + 1) * 50;
      return (
        <g key={i} transform={`translate(${x},${y + 260})`}>
          <ContactShadow cx={0} cy={r} rx={r * 1.1} ry={14} opacity={0.4} />
          <circle cx={0} cy={0} r={r} fill="#5A3A24" stroke={C.ink} strokeWidth={5} />
          <circle cx={0} cy={0} r={r * 0.72} fill={i === 1 ? '#0E5A63' : GS.copper} stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 6}, (_, k) => <circle key={k} cx={0} cy={0} r={r * (0.3 + k * 0.07)} fill="none" stroke="#000" strokeWidth={2} opacity={0.25} />)}
          <circle cx={0} cy={0} r={r * 0.22} fill="#3A2A20" stroke={C.ink} strokeWidth={4} />
          <path d={`M ${-r * 0.7} ${-r * 0.4} A ${r * 0.8} ${r * 0.8} 0 0 1 ${-r * 0.2} ${-r * 0.75}`} stroke="#FFFFFF" strokeWidth={4} fill="none" opacity={0.25 + 0.05 * Math.sin(f / 20 + i)} />
        </g>
      );
    })}
  </g>
);

/** a faceless figure in a suit (no face: a smooth head with a shadowed hollow), with idle life, lit like the props */
const Suit: React.FC<{f: number; x: number; y: number; s?: number; seed?: number; cues?: number[]; coat?: string; tag?: string; reach?: number; facing?: 1 | -1; walk?: number}> =
({f, x, y, s = 1, seed = 1, cues = [], coat = '#3A4048', tag, reach = 0, facing = 1, walk = 0}) => {
  const hgt = 300 * s;
  const step = Math.sin(walk * 0.35) * 14;
  return (
    <>
    <FigureFinish x={x} footY={y} w={140 * s} h={hgt} keySide="left" rimColor="#FFD7B0">
      <IdleFigure f={f} x={x} footY={y} h={hgt} seed={seed} cues={cues}>
        {(pose) => (
          <g transform={`translate(${x},${y}) scale(${s * facing},${s})`}>
            <ContactShadow cx={0} cy={2} rx={62} ry={9} opacity={0.38} />
            <path d={`M -18 -110 L ${-22 + step} -6`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
            <path d={`M -18 -110 L ${-22 + step} -6`} stroke="#2A2E36" strokeWidth={14} strokeLinecap="round" />
            <path d={`M 18 -110 L ${22 - step} -6`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
            <path d={`M 18 -110 L ${22 - step} -6`} stroke="#2A2E36" strokeWidth={14} strokeLinecap="round" />
            <ellipse cx={-22 + step} cy={-4} rx={22} ry={10} fill="#1A1A20" stroke={C.ink} strokeWidth={3} />
            <ellipse cx={22 - step} cy={-4} rx={22} ry={10} fill="#1A1A20" stroke={C.ink} strokeWidth={3} />
            <g transform={`translate(${pose.shift * 0.4},${pose.dip + Math.sin(f / 11 + seed) * 2.5}) rotate(${pose.lean} 0 -110)`}>
              <path d="M -50 -100 Q -56 -200 -30 -228 L 30 -228 Q 56 -200 50 -100 Q 0 -90 -50 -100 Z" fill={coat} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              <path d="M -16 -226 L 0 -170 L 16 -226 Z" fill="#F2EEE6" stroke={C.ink} strokeWidth={3} />
              <path d="M -4 -200 L 4 -200 L 6 -150 L 0 -140 L -6 -150 Z" fill={GS.brick} stroke={C.ink} strokeWidth={2} />
              <path d="M -36 -222 Q -48 -190 -44 -110" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.25} strokeLinecap="round" />
              <path d={`M -40 -214 Q ${-64 + pose.armL * 10} -170 ${-52 + pose.armL * 6} -128`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" />
              <path d={`M -40 -214 Q ${-64 + pose.armL * 10} -170 ${-52 + pose.armL * 6} -128`} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
              <path d={`M 40 -214 Q ${70 + reach * 30} ${-190 + reach * 10} ${58 + reach * 70} ${-128 - reach * 70 + pose.armR * 6}`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" />
              <path d={`M 40 -214 Q ${70 + reach * 30} ${-190 + reach * 10} ${58 + reach * 70} ${-128 - reach * 70 + pose.armR * 6}`} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
              <circle cx={58 + reach * 70} cy={-128 - reach * 70 + pose.armR * 6} r={11} fill="#C99A78" stroke={C.ink} strokeWidth={3} />
              <g transform={`translate(${pose.headX * 0.4},0) rotate(${pose.headRot} 0 -250)`}>
                <ellipse cx={0} cy={-262} rx={36} ry={42} fill="#C99A78" stroke={C.ink} strokeWidth={5} />
                <ellipse cx={8} cy={-256} rx={20} ry={24} fill="#9A6E52" opacity={0.6} />
                <path d="M -34 -282 Q 0 -312 34 -282 Q 20 -296 0 -298 Q -20 -296 -34 -282 Z" fill="#4A3A30" stroke={C.ink} strokeWidth={3} />
              </g>
            </g>
          </g>
        )}
      </IdleFigure>
    </FigureFinish>
    {tag && <Lab text={tag} x={x} y={y - hgt - 30 * s} size={20} />}
    </>
  );
};

/** a faceless reaching hand and sleeve from off frame; t 0..1 extends it, tag rides the cuff */
const Hand: React.FC<{f: number; x0: number; y0: number; x1: number; y1: number; t: number; tag?: string; sleeve?: string; tap?: number}> = ({f, x0, y0, x1, y1, t, tag, sleeve = '#3A4048', tap = 0}) => {
  const k = clamp01(t);
  const hx = lerp(x0, x1, k), hy = lerp(y0, y1, k) + Math.sin(f / 13) * 3 + Math.sin(clamp01(tap) * Math.PI) * 14;
  const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  return (
    <g>
      <path d={`M ${x0} ${y0} L ${hx} ${hy}`} stroke={C.ink} strokeWidth={56} strokeLinecap="round" />
      <path d={`M ${x0} ${y0} L ${hx} ${hy}`} stroke={sleeve} strokeWidth={46} strokeLinecap="round" />
      <path d={`M ${x0} ${y0} L ${hx} ${hy}`} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.18} transform="translate(0,-12)" />
      <g transform={`translate(${hx},${hy}) rotate(${ang})`}>
        <rect x={-14} y={-26} width={22} height={52} rx={6} fill="#F2EEE6" stroke={C.ink} strokeWidth={4} />
        <path d="M 6 -24 Q 46 -30 58 -12 Q 64 0 58 10 Q 46 26 6 24 Z" fill="#C99A78" stroke={C.ink} strokeWidth={4} />
        <path d="M 56 -10 L 82 -12 Q 88 -6 82 -2 L 56 0" fill="#C99A78" stroke={C.ink} strokeWidth={4} />
        <path d="M 30 18 Q 44 14 52 6" stroke="#9A6E52" strokeWidth={4} fill="none" />
      </g>
      {tag && k > 0.5 && <Lab text={tag} x={Math.min(1080 - monoW(tag, 20) / 2 - 110, hx)} y={hy - 64} size={20} />}
    </g>
  );
};

/** a stylised lower-48 outline in a 900 x 520 box (illustrative, not a projection), with 22 dome sites scattered inside */
const L48 = 'M 40 120 L 120 70 L 300 60 L 470 80 L 600 70 L 700 100 L 790 60 L 860 90 L 880 160 L 830 230 L 840 300 L 780 360 L 760 430 L 700 410 L 640 450 L 560 430 L 480 470 L 430 510 L 380 450 L 280 440 L 200 400 L 120 380 L 60 320 L 30 240 Z';
// 20 lower-48 centers plus Anchorage and Honolulu, which sit in their own insets
const DOMES: Array<[number, number]> = [[110, 150], [140, 260], [190, 340], [250, 190], [300, 300], [330, 400], [380, 150], [420, 250], [470, 360], [520, 170], [540, 290], [590, 390], [620, 140], [650, 240], [690, 330], [720, 170], [760, 250], [800, 140], [740, 380], [450, 440], [100, 470], [250, 495]];
const Dome: React.FC<{x: number; y: number; on: number; f: number; i: number}> = ({x, y, on, f, i}) => (
  <g transform={`translate(${x},${y - Math.sin(clamp01(on) * Math.PI) * 10})`}>
    <ellipse cx={0} cy={6} rx={22} ry={6} fill="#000" opacity={0.25} />
    <path d="M -18 4 A 18 18 0 0 1 18 4 Z" fill={on > 0.5 ? '#FFE7A8' : '#B9A588'} stroke={C.ink} strokeWidth={3} />
    {on > 0.5 && <circle cx={0} cy={-4} r={30} fill="#FFE7A8" opacity={0.18 + 0.08 * Math.sin(f / 7 + i)} />}
  </g>
);

// ---- SH1 the split apron (L0) ----------------------------------------------------------------------------------------------------------------------
const Cone: React.FC<{x: number; y: number; slide?: number}> = ({x, y, slide = 0}) => (
  <g transform={`translate(${x - slide * 30},${y})`}>
    <ContactShadow cx={0} cy={2} rx={26} ry={6} opacity={0.4} />
    <path d="M -20 0 L -8 -56 L 8 -56 L 20 0 Z" fill={GS.persimmon} stroke={C.ink} strokeWidth={4} />
    <path d="M -13 -28 L 13 -28" stroke="#FFF6E3" strokeWidth={7} />
  </g>
);
const Beacon: React.FC<{f: number; x: number; y: number; on: number}> = ({f, x, y, on}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-10} y={-8} width={20} height={14} rx={3} fill="#3A3A40" stroke={C.ink} strokeWidth={3} />
    <path d="M -9 -8 Q 0 -26 9 -8 Z" fill="#FFB547" stroke={C.ink} strokeWidth={3} />
    {on > 0.01 && <path d={`M 0 -16 L ${Math.cos(f / 3) * 90} ${-16 + Math.sin(f / 3) * 30} L ${Math.cos(f / 3 + 0.4) * 90} ${-16 + Math.sin(f / 3 + 0.4) * 30} Z`} fill="#FFB547" opacity={0.35 * on} />}
  </g>
);

const S1: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b1 = p.b(1), b49 = p.b(49), b2 = p.b(2);
  const slam = ease(f, b1 + 9, 10);
  const lean = ease(f, b49, 12);
  const stamp = ease(f, b2, 10);
  const lift = easeIO(f, b2 + 4, 60);
  const cam = track([{t: 0, z: 1.12, fx: 560, fy: 1040}, {t: b2, z: 1.05, fx: 540, fy: 990}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="NOV 13 · NATIONWIDE GROUND STOP" x={540} y={560} size={38} p={win(f, b1 + 10)} />
        <Plate text="TED STEVENS ANCHORAGE" x={540} y={650} size={30} p={win(f, b49 + 6, b2)} /> {/* plate-overlap-ok */}
        <Plate text="FLIGHTS OUT OF ALASKA GROUNDED · PER AN AIRPORT OFFICIAL" displayLines={['FLIGHTS OUT OF ALASKA GROUNDED', 'PER AN AIRPORT OFFICIAL']} x={540} y={680} size={30} tone="dark" p={win(f, b2 + 6)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={860} seed={1} />
        <Apron f={f} horizon={860} seed={1} />
        <rect data-band="ok" x={560} y={860} width={700} height={700} fill={C.pine} opacity={0.18 * stamp} />
        <path d={`M 560 860 L 560 ${860 + 700 * Math.max(0.05, stamp)}`} stroke={C.ink} strokeWidth={4} strokeDasharray="18 12" opacity={stamp} />
        <HeldTravel f={f} x={40} y={700} w={420} h={340} mode="sweep" seed={2}>
          <BushPlane f={f} x={220 + lift * 140} y={1180 - lift * 420} scale={1.05} mode={lift > 0.05 ? 'fly' : 'ground'} propSpeed={1.2} body={GS.persimmon} />
        </HeldTravel>
        <Beacon f={f} x={1050} y={1000} on={Math.max(lean, 1 - clamp01(f / 14))} />
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#FFF1D2" opacity={0.75 * (1 - clamp01(f / 12))} />
        <Airliner f={f} x={790 + lean * 10} y={1240} scale={0.82} emotion={f < b1 + 10 ? 'calm' : 'wide'} strain={0.4 * slam + 0.5 * lean} look={f > b2 ? -1 : 0} cues={[b1, b49, b2]} seed={3} />
        <Cone x={1010 + settle(f, b1 + 19, 6)} y={1236} slide={slam} />
        <g opacity={stamp} transform={`translate(830,1080) rotate(-10) scale(${1.4 - stamp * 0.4})`}>
          <rect x={-180} y={-44} width={360} height={88} rx={8} fill="none" stroke={GS.brick} strokeWidth={9} />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={58} fill={GS.brick} letterSpacing={4}>GROUNDED</text>
        </g>
        <NearApron f={f} seed={1} />
      </SVG>
    </Frame>
  );
};

// ---- SH2 the board, the map and the two tarps (L1-L2) ---------------------------------------------------------------------------------------------
/** the Alaska map pinned on the board, in-state strings pulsing between towns, out-of-state strings frozen at the edge until they thaw */
const MapOnBoard: React.FC<{f: number; x: number; y: number; s: number; freeze: number}> = ({f, x, y, s, freeze}) => {
  const towns: Array<[string, number, number]> = [['ANCHORAGE', 470, 520], ['BETHEL', 250, 430], ['NOME', 220, 270], ['JUNEAU', 860, 560]];
  const [ax, ay] = [470, 520];
  const q = (t: number, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) =>
    [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-10} y={-10} width={1020} height={720} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <path d={AK_PATH} fill="#E9D7B4" stroke={C.ink} strokeWidth={5} />
      <path d={AK_PATH} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.4} transform="translate(-4,-4)" />
      {towns.slice(1).map(([n, tx, ty], i) => {
        const cy = Math.min(ay, ty) - 60, cx = (ax + tx) / 2;
        const [px, py] = q((f / 40 + i * 0.33) % 1, ax, ay, cx, cy, tx, ty);
        return (
          <g key={n}>
            <path d={`M ${ax} ${ay} Q ${cx} ${cy} ${tx} ${ty}`} stroke={C.ink} strokeWidth={9} fill="none" />
            <path d={`M ${ax} ${ay} Q ${cx} ${cy} ${tx} ${ty}`} stroke={GS.persimmon} strokeWidth={5} fill="none" />
            <circle cx={px} cy={py} r={12} fill="#FFF1D2" stroke={C.ink} strokeWidth={3} />
          </g>
        );
      })}
      {[[1000, 640], [1000, 420], [700, 700]].map(([ex, ey], i) => {
        const t = (f / 50 + i * 0.3) % 1;
        return (
          <g key={i}>
            <path d={`M ${ax} ${ay} L ${ex} ${ey}`} stroke={C.ink} strokeWidth={9} />
            <path d={`M ${ax} ${ay} L ${ex} ${ey}`} stroke={freeze > 0.5 ? '#6B6E74' : GS.persimmon} strokeWidth={5} />
            {freeze > 0.5
              ? <g transform={`translate(${lerp(ax, ex, 0.82)},${lerp(ay, ey, 0.82)}) rotate(${Math.atan2(ey - ay, ex - ax) * 180 / Math.PI})`}>
                  <path d="M -18 0 L 18 0 M -4 -14 L 6 0 L -4 14 M -16 -6 L -12 0 L -16 6" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
                </g>
              : <circle cx={lerp(ax, ex, t)} cy={lerp(ay, ey, t)} r={12} fill="#FFF1D2" stroke={C.ink} strokeWidth={3} />}
            <circle cx={ex} cy={ey} r={14} fill={GS.brick} stroke={C.ink} strokeWidth={3} opacity={freeze} />
          </g>
        );
      })}
      {towns.map(([n, tx, ty]) => (
        <g key={n}>
          <circle cx={tx} cy={ty} r={12} fill={n === 'ANCHORAGE' ? GS.persimmon : C.paper} stroke={C.ink} strokeWidth={4} />
          <text x={tx} y={ty - 30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink} stroke={C.paper} strokeWidth={6} paintOrder="stroke">{n}</text>
        </g>
      ))}
    </g>
  );
};

const BOARD = {x: 80, y: 420, w: 920, h: 860};
/** the board scaled 0.8 about the frame centre line so its top sits at y 600, under the plates; every frontal board shot uses it */
const BOARD_T = 'translate(108,264) scale(0.8)';
const S2: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b3 = p.b(3), b4 = p.b(4), b5 = p.b(5), b6 = p.b(6);
  const swing = ease(f, Math.max(0, b3 - 6), 18);
  const freeze = ease(f, b3 + 16, 10) * (1 - ease(f, b4 + 44, 10));
  const sweep = easeIO(f, b4, 50) * 4;
  const bumpL = clamp01((f - b5) / 18), bumpR = clamp01((f - b5 - 8) / 18);
  const spot = easeIO(f, b6 - 4, 18);
  const spotX = lerp(980, 330, spot);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 900}, {t: b5 - 6, z: 1.05, fx: 540, fy: 920}, {t: b5 + 20, z: 1.22, fx: 500, fy: 1140}, {t: p.dur, z: 1.28, fx: 480, fy: 1160}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="IN STATE FLIGHTS NOT IMPACTED · PER ALASKA AIRLINES" displayLines={['IN STATE FLIGHTS NOT IMPACTED', 'PER ALASKA AIRLINES']} x={540} y={550} size={30} p={win(f, b3 + 6, b4 + 2)} /> {/* plate-overlap-ok */}
        <Plate text="MORE THAN 4 HOURS · 2ND SINCE 9/11" x={540} y={545} size={34} tone="dark" p={win(f, b4 + 8, b5)} /> {/* plate-overlap-ok */}
        <Plate text="TWO NEW THINGS THAT WEEK" x={540} y={545} size={36} p={win(f, b5 + 6, b6 + 4)} /> {/* plate-overlap-ok */}
        <Plate text="ONE OF THEM WAS AI" x={540} y={545} size={36} tone="dark" p={win(f, b6 + 8)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={2} win={{x: 760, y: 120, w: 280, h: 240}} />
        <g transform={`translate(0,${(1 - swing) * -40}) rotate(${(1 - swing) * -3} 540 420) ${BOARD_T}`}>
          <CorkBoard x={BOARD.x} y={BOARD.y} w={BOARD.w} h={BOARD.h} seed={2}>
            <HeldTravel f={f} x={70} y={190} w={660} h={460} mode="shadow" seed={3}>
              <MapOnBoard f={f} x={80} y={200} s={0.62} freeze={freeze} />
            </HeldTravel>
            <PushPin x={90} y={210} drop={swing} /><PushPin x={700} y={210} drop={swing} /><PushPin x={90} y={640} drop={swing} /><PushPin x={700} y={640} drop={swing} />
            <g transform="translate(790,700)">
              <HeldProp f={f} px={0} py={0} w={160} h={180} seed={4} kind="hang">
                <Stopwatch f={f} x={0} y={0} r={64} sweep={sweep + f / 900} />
              </HeldProp>
            </g>
            <PushPin x={790} y={600} drop={ease(f, b4 - 10, 12)} />
            <Tarp f={f} x={250} y={830} w={250} h={140} tag="NEW" bump={bumpL} seed={1} />
            <Tarp f={f} x={540} y={830} w={250} h={140} tag="NEW" bump={bumpR} seed={2} />
            <g transform={`translate(300,${40 - (1 - ease(f, b6 + 4, 12)) * 120})`} opacity={ease(f, b6 + 4, 12)}>
              <rect x={0} y={0} width={320} height={56} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
              <text x={160} y={38} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={GS.brick}>IS IT THE AI?</text>
              <PushPin x={20} y={14} /><PushPin x={300} y={14} />
            </g>
            {spot > 0.4 && (
              <g transform={`translate(250,${700 + settle(f, b6 + 10, 10)})`}>
                <path d="M 0 -50 L 0 -20" stroke={C.ink} strokeWidth={3} />
                <g transform={`rotate(${Math.sin(f / 9) * 8})`}>
                  <rect x={-32} y={-20} width={64} height={36} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
                  <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>AI</text>
                </g>
              </g>
            )}
          </CorkBoard>
        </g>
        <path data-band="ok" d={`M 1100 380 L ${spotX - 190} 1320 L ${spotX + 190} 1320 Z`} fill={C.lamp} opacity={0.22 * clamp01(spot * 2)} />
        <ellipse data-band="ok" cx={spotX} cy={1170} rx={200} ry={130} fill={C.lamp} opacity={0.25 * clamp01(spot * 2)} />
        <DeskEdge f={f} seed={2} />
      </SVG>
    </Frame>
  );
};

// ---- SH4 twenty two centers (L3) -------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b7 = p.b(7), b8 = p.b(8), b9 = p.b(9);
  const flip = easeIO(f, b7, 22);
  const arrow = ease(f, b9, 18);
  const cam = track([{t: 0, z: 1.08, fx: 540, fy: 1000}, {t: b8, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.04, fx: 560, fy: 960}]);
  return (
    <Frame p={p} cam={cam} bg={C.pine} overlay={
      <g>
        <Plate text="NOV 10 · ALL 22 CENTERS" x={540} y={560} size={38} p={win(f, b7 + 10)} />
        <Plate text="SMART · BUILT BY AIR SPACE INTELLIGENCE" displayLines={['SMART', 'BUILT BY AIR SPACE INTELLIGENCE']} x={540} y={680} size={32} tone="dark" p={win(f, b8 + 6, b9)} /> {/* plate-overlap-ok */}
        <Plate text="3 DAYS LATER · NO OFFICIAL LINK" x={540} y={680} size={38} p={win(f, b9 + 8)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill={C.pine} />
        {Array.from({length: 40}, (_, i) => <circle key={i} data-band="ok" cx={h01(i, 1) * 1080} cy={h01(i, 2) * 500} r={1.5 + h01(i, 3) * 2} fill="#FFF6E3" opacity={0.3 + 0.3 * Math.sin(f / 20 + i)} />)}
        <rect data-band="ok" x={-100} y={760} width={1280} height={900} fill="#0A3E44" stroke={C.ink} strokeWidth={4} />
        <HeldTravel f={f} x={80} y={800} w={920} h={560} mode="shadow" seed={6}>
          <g transform="translate(90,820)">
            <path d={L48} fill="#E9D7B4" stroke={C.ink} strokeWidth={5} />
            <path d={L48} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.4} transform="translate(-4,-4)" />
            {/* the Alaska and Hawaii insets, boxed like an atlas page */}
            <g>
              <rect x={20} y={415} width={170} height={100} rx={4} fill="#0E4A50" stroke={C.ink} strokeWidth={3} />
              <g transform="translate(36,425) scale(0.13)"><path d={AK_PATH} fill="#E9D7B4" stroke={C.ink} strokeWidth={14} /></g>
              <rect x={200} y={455} width={110} height={60} rx={4} fill="#0E4A50" stroke={C.ink} strokeWidth={3} />
              {[[222, 480, 7], [242, 486, 5], [262, 492, 6], [284, 500, 9]].map(([hx, hy, r], k) => <circle key={k} cx={hx} cy={hy} r={r} fill="#E9D7B4" stroke={C.ink} strokeWidth={2} />)}
            </g>
            {DOMES.map(([x, y], i) => {
              const on = clamp01((f - b8 + 12 - i * 2.2) / 8);
              return (
                <g key={i}>
                  <Dome x={x} y={y} on={on} f={f} i={i} />
                  {on > 0 && on < 1 && <rect x={x - 10} y={y - 40 - (1 - on) * 60} width={20} height={14} rx={2} fill={GS.card} stroke={C.ink} strokeWidth={2} />}
                </g>
              );
            })}
          </g>
        </HeldTravel>
        <rect data-band="ok" x={-100} y={500} width={1280} height={18} fill="#5A3A24" stroke={C.ink} strokeWidth={3} />
        <DeskCalendar f={f} x={330} y={500} scale={0.8} page="13" next="10" flip={flip} />
        <DeskCalendar f={f} x={790} y={500} scale={0.8} page="13" />
        <g opacity={arrow}>
          <path d={`M 420 300 Q 560 ${220 - arrow * 30} ${lerp(440, 700, arrow)} 300`} stroke={C.ink} strokeWidth={30} fill="none" strokeLinecap="round" />
          <path d={`M 420 300 Q 560 ${220 - arrow * 30} ${lerp(440, 700, arrow)} 300`} stroke={GS.persimmon} strokeWidth={20} fill="none" strokeLinecap="round" />
          <path d={`M ${lerp(440, 700, arrow) - 30} 280 L ${lerp(440, 700, arrow) + 10} 310 L ${lerp(440, 700, arrow) - 30} 340`} fill={GS.persimmon} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        </g>
        <g data-band="ok">
          <rect x={-100} y={1500} width={1280} height={500} fill="#062E33" stroke={C.ink} strokeWidth={4} />
          <rect x={720} y={1540} width={240} height={120} rx={10} fill="#3A3A40" stroke={C.ink} strokeWidth={4} />
          <circle cx={780} cy={1600} r={30} fill="#1A1A20" stroke={C.ink} strokeWidth={3} />
          {Array.from({length: 4}, (_, i) => <rect key={i} x={830} y={1570 + i * 20} width={100} height={8} fill="#5A5A60" />)}
          <circle cx={940} cy={1560} r={6} fill={GS.led} opacity={0.5 + 0.5 * Math.sin(f / 5)} />
          {/* a controller's desk in the near plane: flight strips in a bay and a headset */}
          {Array.from({length: 5}, (_, i) => <rect key={`st${i}`} x={110} y={1540 + i * 26} width={260} height={20} rx={3} fill={i === 2 ? GS.card : '#E8DCC2'} stroke={C.ink} strokeWidth={2.5} transform={`rotate(${-2 + i} 240 1600)`} />)}
          <path d="M 470 1640 A 60 60 0 0 1 590 1640" stroke="#2A2A30" strokeWidth={12} fill="none" />
          <rect x={455} y={1630} width={30} height={46} rx={10} fill="#3A3A40" stroke={C.ink} strokeWidth={3} />
          <rect x={575} y={1630} width={30} height={46} rx={10} fill="#3A3A40" stroke={C.ink} strokeWidth={3} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- SH5 it only suggests (L4) ---------------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b10 = p.b(10), b11 = p.b(11);
  const route = easeIO(f, b10 + 6, 40);
  const slide = easeIO(f, b11, 26);
  const hand = easeIO(f, b11 + 6, 18);
  const take = easeIO(f, b11 + 40, 22);
  const over = settle(f, b11 + 26, 18, 24);
  const icons = ['cloud', 'clock', 'plane', 'snow', 'wind', 'list'];
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={980} bg="#123F45" overlay={
      <g>
        <Plate text="AI THAT PREDICTS CONGESTION" x={540} y={570} size={38} p={win(f, b10 + 8, b11)} /> {/* plate-overlap-ok */}
        <Plate text="IT ADVISES · PEOPLE DECIDE · PER THE FAA" displayLines={['IT ADVISES · PEOPLE DECIDE', 'PER THE FAA']} x={540} y={600} size={36} tone="dark" p={win(f, b11 + 10)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#123F45" />
        <ellipse data-band="ok" cx={540} cy={900} rx={600} ry={520} fill={C.lamp} opacity={0.1} />
        <rect data-band="ok" x={-300} y={1180} width={1680} height={900} fill={C.desk} stroke={C.ink} strokeWidth={4} />
        <rect data-band="ok" x={-300} y={1180} width={1680} height={20} fill={C.deskL} />
        {/* data ribbons: every input converges on the slip */}
        {icons.map((ic, i) => {
          const sx = 120 + (i % 3) * 420, sy = 460 + Math.floor(i / 3) * 80;
          return <path key={`r${ic}`} d={`M ${sx} ${sy} Q ${(sx + 470) / 2} ${sy + 260} 470 1000`} stroke={['#9FB8C0', '#E8DCC2', GS.card][i % 3]} strokeWidth={10} fill="none" opacity={0.35} strokeDasharray="26 14" strokeDashoffset={-f * 3} />;
        })}
        {icons.map((ic, i) => {
          const t = ((f / 34 + i / icons.length) % 1);
          const sx = 120 + (i % 3) * 420, sy = 460 + Math.floor(i / 3) * 80;
          const x = lerp(sx, 470, t * t), y = lerp(sy, 1000, t);
          return (
            <g key={ic} transform={`translate(${x},${y}) scale(${1 - t * 0.6})`} opacity={1 - t * 0.7}>
              <circle r={30} fill={C.paper} stroke={C.ink} strokeWidth={4} />
              {ic === 'cloud' && <path d="M -16 6 Q -18 -8 -4 -8 Q 0 -18 10 -10 Q 20 -10 18 4 Z" fill="#9FB8C0" stroke={C.ink} strokeWidth={2} />}
              {ic === 'clock' && <path d="M 0 -14 L 0 0 L 10 6" stroke={C.ink} strokeWidth={4} fill="none" />}
              {ic === 'plane' && <path d="M -14 0 L 14 0 M -2 -10 L 6 0 L -2 10" stroke={C.ink} strokeWidth={4} fill="none" />}
              {ic === 'snow' && <path d="M 0 -14 L 0 14 M -12 -7 L 12 7 M -12 7 L 12 -7" stroke={C.ink} strokeWidth={3} />}
              {ic === 'wind' && <path d="M -14 -4 Q 4 -12 12 -4 M -14 6 Q 6 0 14 8" stroke={C.ink} strokeWidth={3} fill="none" />}
              {ic === 'list' && <path d="M -12 -8 L 12 -8 M -12 0 L 12 0 M -12 8 L 6 8" stroke={C.ink} strokeWidth={3} />}
            </g>
          );
        })}
        <g transform={`translate(${lerp(470, 640, slide) + over},0)`}>
          <HeldTravel f={f} x={-210} y={900} w={420} h={340} mode="sweep" seed={7}>
            <SuggestionSlip f={f} x={0} y={1190} scale={1.7} emotion={f < b11 ? 'focused' : 'humble'} route={route} look={f > b11 ? 1 : 0} cues={[b10, b11]} seed={4} tag="SMART" />
          </HeldTravel>
          <path d="M -120 1040 Q -80 990 -20 1020 L -40 1080 Q -90 1070 -120 1040 Z" fill="#FFFDF4" stroke={C.ink} strokeWidth={4} strokeDasharray="10 6" opacity={0.8} />
        </g>
        {/* the hand takes the route card the slip offers, and carries it off */}
        <g transform={`translate(${lerp(560, 900 + 260 * take, clamp01(hand * 1.2))},${lerp(1000, 1030, hand)}) rotate(${-8 + 14 * take})`} opacity={hand > 0.02 ? 1 : 0}>
          <rect x={-60} y={-36} width={120} height={72} rx={6} fill={GS.card} stroke={C.ink} strokeWidth={4} />
          <path d="M -40 14 Q -10 -26 40 -10" stroke={GS.persimmon} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
        <Hand f={f} x0={1240} y0={1060} x1={lerp(1240, 900, hand) + 260 * take} y1={lerp(1060, 1050, hand)} t={hand} tag="FAA STAFF" />
        <g data-band="ok">
          <rect x={-300} y={1520} width={1680} height={500} fill="#4A3222" />
          {Array.from({length: 5}, (_, i) => <path key={i} d={`M -300 ${1560 + i * 60} q 500 ${-10 + h01(i, 5) * 20} 1000 0 t 1000 0`} stroke="#3A2618" strokeWidth={3} fill="none" opacity={0.6} />)}
          {/* the controller's console: a scope, a strip bay and a mug */}
          <ellipse cx={260} cy={1640} rx={150} ry={70} fill="#0A2A2E" stroke={C.ink} strokeWidth={5} />
          <ellipse cx={260} cy={1640} rx={110} ry={50} fill="none" stroke="#3E7A80" strokeWidth={3} />
          <path d={`M 260 1640 L ${260 + Math.cos(f / 12) * 110} ${1640 + Math.sin(f / 12) * 50}`} stroke="#7FD0C0" strokeWidth={4} />
          {Array.from({length: 4}, (_, i) => <rect key={`b${i}`} x={520} y={1560 + i * 24} width={240} height={18} rx={3} fill={i === 1 ? GS.card : '#E8DCC2'} stroke={C.ink} strokeWidth={2.5} />)}
          <path d="M 880 1640 L 884 1560 L 950 1560 L 954 1640 Z" fill={GS.pine} stroke={C.ink} strokeWidth={4} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- the investigation board, reused by SH6, SH8, SH9, SH10 and SH12 -------------------------------------------------------------------------------
const SNAP_C = {x: 240, y: 300};
const InvestigationBoard: React.FC<{f: number; pinned: number; quote1: number; quote2: number; maker?: number; fold?: number; sweat?: number;
  routerStr?: number; envelope?: number; snapshot?: number; snapCenter?: number; tags?: number; fog?: number; letters?: number; letterStr?: number; cues?: number[];
  emotion?: 'scared' | 'worried' | 'hopeful' | 'sheepish'; tarpLift?: number; tarpBump?: number; tug?: number; fade?: number; tilt?: number; tarpTag?: boolean; envFade?: boolean; noLink?: number}> =
({f, pinned, quote1, quote2, maker = 1, fade = 0, tilt = 0, tarpTag = true, envFade = true, noLink = 0, fold = 0, sweat = 0, routerStr = 0, envelope = 0, snapshot = 0, snapCenter = 0, tags = 0, fog = 0, letters = 0, letterStr = 0, cues = [], emotion = 'scared', tarpLift = 0, tarpBump = 0, tug = 0}) => {
  const cxp = 460, cyp = 560;
  // the fourth question pin sits on the board's right edge, well clear of the router photo and its string (editor, cut 3)
  const anchors: Array<[number, number]> = [[110, 160], [810, 160], [110, 760], [890, 660]];
  const snapX = lerp(700, SNAP_C.x, snapCenter), snapY = lerp(600, SNAP_C.y + 380, snapCenter);
  return (
    <CorkBoard x={BOARD.x} y={BOARD.y} w={BOARD.w} h={BOARD.h} seed={6}>
      {/* the header card that plants the question */}
      {/* from the raven's tug on, one pin has let go and the header hangs tilted: the question is still up, less sure of itself */}
      <g transform={`translate(300,40) rotate(${tilt * (9 + Math.sin(f / 21) * 1.5)} 20 14)`}>
        <rect x={0} y={0} width={320} height={56} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
        <text x={160} y={38} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={GS.brick}>IS IT THE AI?</text>
        <PushPin x={20} y={14} />{tilt < 0.5 && <PushPin x={300} y={14} />}
      </g>
      {/* the answer the record gives so far, pinned under the question once it is spoken */}
      {noLink > 0.01 && (
        <g transform={`translate(640,${92 - (1 - noLink) * 40}) rotate(3)`} opacity={noLink}>
          <rect x={0} y={0} width={240} height={50} rx={5} fill={GS.card} stroke={C.ink} strokeWidth={4} />
          <text x={120} y={33} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={19} fill={C.ink}>NO OFFICIAL LINK</text>
          <PushPin x={120} y={8} />
        </g>
      )}
      <g transform="translate(60,60) scale(0.2)">
        <rect x={-10} y={-10} width={1020} height={720} fill={C.paper} stroke={C.ink} strokeWidth={12} />
        <path d={AK_PATH} fill="#E9D7B4" stroke={C.ink} strokeWidth={12} />
      </g>
      {/* question strings to the slip: brick-red, taut, never cut, never slack */}
      {anchors.map(([ax, ay], i) => <BoardString key={i} f={f} x1={ax} y1={ay} x2={cxp} y2={cyp - 60} slack={0.08 + (i === 2 ? tug * 0.3 : 0)} draw={pinned} />)}
      {anchors.map(([ax, ay], i) => <PushPin key={`p${i}`} x={ax} y={ay} drop={pinned} />)}
      {pinned > 0.01 && (
        <g transform={`translate(0,${(1 - pinned) * -200})`}>
          <SuggestionSlip f={f} x={cxp} y={cyp + 60} scale={1.0} emotion={emotion} fold={fold} sweat={sweat} cues={cues} seed={6} tag="SMART" shadow={false} />
          <PushPin x={cxp} y={cyp - 70} drop={pinned} color="#E8E2D2" size={1.2} />
          {maker > 0.01 && (
            <g transform={`translate(${cxp},${cyp + 64}) rotate(${Math.sin(f / 11) * 4})`} opacity={maker * (1 - fade)}>
              <path d="M 0 0 L 0 10" stroke={C.ink} strokeWidth={2.5} />
              <g transform="translate(-88,10)"><rect x={0} y={-4} width={176} height={44} rx={4} fill={GS.card} stroke={C.ink} strokeWidth={3} />
                <text x={88} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.ink}>MADE BY</text>
                <text x={88} y={32} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.ink}>AIR SPACE INTEL.</text></g>
            </g>
          )}
        </g>
      )}
      {quote1 > 0.01 && (
        <g transform="translate(110,300) rotate(-4)" opacity={quote1}>
          <rect x={0} y={0} width={230} height={120} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
          <text x={115} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>NOT A RESULT</text>
          <text x={115} y={80} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.ink}>OF SMART, ASI SAYS</text>
          <PushPin x={115} y={10} />
          {tags > 0.01 && <g transform={`translate(115,120) rotate(${Math.sin(f / 10) * 6 * tags})`} opacity={tags}><path d="M 0 0 L 0 26" stroke={C.ink} strokeWidth={3} /><Lab text="THE MAKER" x={0} y={44} size={18} /></g>}
          <text x={115} y={108} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={GS.brick}>A DENIAL</text>
        </g>
      )}
      {quote2 > 0.01 && (
        <g transform={`translate(580,${300 - (1 - quote2) * 60}) rotate(4)`} opacity={clamp01(quote2 * 2)}>
          <rect x={0} y={0} width={230} height={120} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
          <text x={115} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>"COMPLETELY</text>
          <text x={115} y={80} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>DISCONNECTED"</text>
          <PushPin x={115} y={10} />
          {tags > 0.01 && <g transform={`translate(115,120) rotate(${-Math.sin(f / 10) * 6 * tags})`} opacity={tags}><path d="M 0 0 L 0 26" stroke={C.ink} strokeWidth={3} /><Lab text="DUFFY" x={0} y={44} size={18} /></g>}
          <text x={115} y={108} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={GS.brick}>A DENIAL</text>
        </g>
      )}
      {letters > 0.01 && (
        <g transform={`translate(${130 + (1 - letters) * -300},630) rotate(-6)`}>
          {[0, 1, 2].map((i) => <rect key={i} x={i * 8} y={-i * 8} width={170} height={120} fill={C.paper} stroke={C.ink} strokeWidth={4} />)}
          <path d="M 30 40 L 140 40 M 30 66 L 120 66 M 30 92 L 130 92" stroke={C.ink} strokeWidth={3} opacity={0.5} transform="translate(16,-16)" />
          <PushPin x={95} y={-6} />
        </g>
      )}
      {letterStr > 0.01 && <BoardString f={f} x1={230} y1={630} x2={cxp - 10} y2={cyp - 50} slack={0.05} draw={letterStr} twang={clamp01(1.3 - letterStr)} />}
      {fog > 0.01 && Array.from({length: 7}, (_, i) => {
        const ex = 860 - i * 110 + Math.sin(f / 30 + i) * 30;
        return <ellipse key={i} cx={ex + (1 - fog) * 500} cy={660 + Math.sin(f / 40 + i * 2) * 30} rx={150} ry={80} fill="#D8D4CC" opacity={0.5 * fog * (Math.abs(ex - snapX) < 120 || Math.abs(ex - cxp) < 300 ? 0.15 : 1)} />;
      })}
      {snapshot > 0.01 && (
        <g transform={`translate(${snapX - 75},${snapY - 60 + (1 - snapshot) * -200}) rotate(${4 + Math.sin(f / 12) * 2}) scale(${1 + snapCenter * 0.25})`} opacity={snapshot}>
          <rect x={0} y={0} width={150} height={120} fill="#F2EEE6" stroke={C.ink} strokeWidth={4} />
          <rect x={10} y={10} width={130} height={86} fill="#122A2E" />
          <rect x={30} y={30} width={60} height={36} fill="#1E4A50" stroke="#0A1A1C" strokeWidth={2} />
          <path d={`M 96 ${70 + Math.sin(f / 5) * 3 * snapCenter} Q 110 56 122 64`} stroke="#C99A78" strokeWidth={6} fill="none" opacity={0.7} />
          <PushPin x={75} y={8} drop={snapshot} />
        </g>
      )}
      <Tarp f={f} x={640} y={840} w={200} h={110} tag={tarpTag ? 'NEW' : undefined} seed={3} bump={tarpBump} lift={tarpLift} />
      {routerStr > 0.01 && (
        <g>
          <g transform="translate(760,760) rotate(5)">
            <rect x={-80} y={-60} width={160} height={120} fill="#F2EEE6" stroke={C.ink} strokeWidth={4} />
            <rect x={-68} y={-48} width={136} height={86} fill={C.pine} />
            <Router f={f} x={0} y={30} scale={0.36} leds={0.6} peanuts={false} fragile={false} glow={0.6} />
            <PushPin x={0} y={-50} />
          </g>
          {/* the second string starts at the reporting, never at the slip */}
          <g transform="translate(720,560) rotate(-3)">
            <rect x={-100} y={-24} width={200} height={48} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
            <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={15} fill={C.ink}>CBS·FAA·L3HARRIS</text>
            <PushPin x={0} y={-18} />
          </g>
          <BoardString f={f} x1={724} y1={584} x2={760} y2={706} slack={0.06} draw={routerStr} />
        </g>
      )}
      {envelope > 0.01 && (
        <g transform={`translate(${cxp - 150},${cyp + 140 + (1 - envelope) * -160}) scale(1.3)`} opacity={clamp01(envelope * 2) * (envFade ? 1 - fade : 1)}>
          <ContactShadow cx={96} cy={110} rx={90} ry={8} opacity={0.3} />
          <rect x={0} y={0} width={190} height={110} rx={4} fill="#EBD9B4" stroke={C.ink} strokeWidth={4} />
          <path d="M 0 0 L 95 60 L 190 0" fill="#DCC69A" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={95} cy={60} r={14} fill={GS.brick} stroke={C.ink} strokeWidth={3} />
          <text x={95} y={98} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={15} fill={C.ink}>FINAL FINDINGS</text>
          <PushPin x={95} y={4} />
          <g transform={`translate(196,20) rotate(${10 + Math.sin(f / 14) * 9})`}>
            <path d="M 0 0 L 20 24" stroke={C.ink} strokeWidth={2.5} />
            <rect x={0} y={24} width={152} height={46} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
            <text x={76} y={43} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.ink}>WHY IT FAILED</text>
            <text x={76} y={62} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.ink}>NOT YET FINAL</text>
          </g>
        </g>
      )}
    </CorkBoard>
  );
};

// ---- SH6 the maker and the denials (L5-L6) ---------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b12 = p.b(12), b13 = p.b(13), b14 = p.b(14), b42 = p.b(42), b15 = p.b(15);
  const pinned = ease(f, b12, 14);
  const maker = ease(f, b12 + 16, 12);
  const q1 = ease(f, b13 + 4, 10), q2 = ease(f, b42, 8);
  const walk = clamp01((f - b14 + 4) / 26);
  const drop = easeIO(f, b15, 14);
  const twitch = f > b12 + 20 && f < b12 + 60 ? Math.abs(Math.sin((f - b12) / 5)) : 0;
  const fx = lerp(1180, 900, walk);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={980} overlay={
      <g>
        <Plate text="MADE BY AIR SPACE INTELLIGENCE" x={540} y={560} size={36} p={win(f, b12 + 10, b13)} /> {/* plate-overlap-ok */}
        <Plate text={'"NOT BASED ON OR A RESULT OF THE SMART SYSTEM" · PER ASI'} displayLines={['"NOT BASED ON OR A RESULT', 'OF THE SMART SYSTEM" · PER ASI']} x={540} y={600} size={30} p={win(f, b13 + 6, b14)} /> {/* plate-overlap-ok */}
        <Plate text="TRANSPORTATION SECRETARY SEAN DUFFY" x={540} y={560} size={32} p={win(f, b14 + 6, b42)} /> {/* plate-overlap-ok */}
        <Plate text={'"COMPLETELY DISCONNECTED" · DUFFY'} x={540} y={560} size={34} p={win(f, b42 + 6, b15)} /> {/* plate-overlap-ok */}
        <Plate text={'"1980S LITTLE COPPER LINES" · DUFFY SAID'} x={540} y={560} size={32} tone="dark" p={win(f, b15 + 8)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={6} win={{x: 760, y: 120, w: 280, h: 240}} cool={0.2} />
        <g transform={BOARD_T}><HeldTravel f={f} x={BOARD.x} y={BOARD.y} w={BOARD.w} h={BOARD.h} mode="shadow" seed={8}>
          <InvestigationBoard f={f} pinned={pinned} maker={maker} quote1={q1} quote2={q2} fold={0.2 + 0.2 * Math.sin(f / 30)} tarpBump={twitch} cues={[b12, b13, b14, b42, b15]} emotion={f < b14 ? 'scared' : 'worried'} />
        </HeldTravel></g>
        <Suit f={f} x={fx} y={1420} s={1.0} seed={9} cues={[b14, b42, b15]} tag={walk > 0.92 ? "SEC. SEAN DUFFY" : undefined} reach={ease(f, b42 - 8, 10) * (1 - ease(f, b42 + 14, 10)) + ease(f, b15 - 10, 8) * (1 - drop)} facing={-1} walk={walk < 1 ? f : 0} />
        {/* the coil leaves the Duffy figure's hand and drops beside the board onto a CLAIM card, never on the board */}
        <g transform="translate(200,1262)" opacity={ease(f, b15 - 4, 8)}>
          <rect x={-110} y={-20} width={220} height={40} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>CLAIM</text>
        </g>
        {f > b15 - 12 && (
          <g transform={`translate(${lerp(fx - 420, 0, drop)},${lerp(-160, 0, drop) + settle(f, b15 + 14, 8)})`}>
            <CopperCoil f={f} x={200} y={1238} scale={0.75} slide={clamp01((f - b15 - 14) / 30)} />
          </g>
        )}
        <DeskEdge f={f} seed={6} y={1330} kind="bare" />
      </SVG>
    </Frame>
  );
};

// ---- SH7 the glass that never lowers (L7) ----------------------------------------------------------------------------------------------------------
const Corridor: React.FC<{f: number}> = ({f}) => (
  <g data-band="ok">
    <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#C9C2B0" />
    <path d="M -300 -100 L 380 700 L 700 700 L 1380 -100 Z" fill="#DCD5C2" />
    <path d="M -300 2100 L 380 1180 L 700 1180 L 1380 2100 Z" fill="#8A7A62" />
    <rect x={380} y={700} width={320} height={480} fill="#B9B09A" stroke={C.ink} strokeWidth={4} />
    <rect x={470} y={820} width={140} height={360} fill="#6B4A32" stroke={C.ink} strokeWidth={4} />
    <rect x={480} y={830} width={120} height={150} fill="#FFE7A8" opacity={0.7} />
    <path d="M 380 700 L -300 -100 M 700 700 L 1380 -100 M 380 1180 L -300 2100 M 700 1180 L 1380 2100" stroke={C.ink} strokeWidth={3} opacity={0.5} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={480 - 90 * (i + 1) * 0.4} y={560 - i * 120} width={120 + 72 * (i + 1) * 0.4} height={18} fill="#FFFBEA" opacity={0.85 + 0.1 * Math.sin(f / 7 + i)} />)}
    {[0, 1].map((i) => (
      <g key={i} transform={`translate(${i ? 880 : 140},${1260 + i * 30})`}>
        <rect x={-120} y={-40} width={240} height={26} rx={6} fill="#6B4A32" stroke={C.ink} strokeWidth={4} />
        <rect x={-110} y={-14} width={14} height={60} fill="#3A2A20" /><rect x={96} y={-14} width={14} height={60} fill="#3A2A20" />
      </g>
    ))}
    <rect x={-300} y={1500} width={1680} height={600} fill="#6E604C" />
    <rect x={-60} y={1540} width={1200} height={50} rx={10} fill="#5A3A24" stroke={C.ink} strokeWidth={5} />
    {/* the light falls off away from the one lit doorway */}
    <defs><radialGradient id="corrFall" cx="0.5" cy="0.47" r="0.62"><stop offset="0.3" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#1A1410" stopOpacity={0.55} /></radialGradient></defs>
    <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="url(#corrFall)" />
  </g>
);
const S6: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b16 = p.b(16), b17 = p.b(17);
  const lift = ease(f, b16, 20);
  const tags = ease(f, b17, 14);
  const cam = track([{t: 0, z: 1.06, fx: 540, fy: 1060}, {t: p.dur, z: 1.16, fx: 560, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} bg="#C9C2B0" warmth={-0.02} overlay={
      <g>
        <Plate text={'"CAN\'T RULE OUT ANYTHING AT THIS POINT" · MULLIN'} displayLines={['"CAN\'T RULE OUT ANYTHING', 'AT THIS POINT" · MULLIN']} x={540} y={600} size={32} p={win(f, b16 + 8)} />
      </g>
    }>
      <SVG>
        <Corridor f={f} />
        {/* the photo of Slip with the two denial quotes clipped to it, held up in the figure's left hand */}
        <g transform={`translate(${382 + 35 * (1 - lift)},${1151 + 70 * (1 - lift) + Math.sin(f / 19) * 4})`}>
          <HeldProp f={f} px={0} py={0} w={300} h={260} seed={16} kind="hang">
            <rect x={-150} y={-130} width={300} height={260} fill="#F2EEE6" stroke={C.ink} strokeWidth={5} />
            <rect x={-136} y={-116} width={272} height={200} fill={GS.cork} />
            {/* the photo is of the two denial cards and the open question, not of the AI */}
            {[[-140, -110, -3], [-140, -52, 3]].map(([x, y, r], i) => (
              <g key={`d${i}`} transform={`translate(${x},${y}) rotate(${r})`}>
                <rect x={0} y={0} width={100} height={50} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
                <path d="M 12 14 L 88 14 M 12 26 L 78 26" stroke={C.ink} strokeWidth={3} opacity={0.5} />
                <text x={50} y={43} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={11} fill={GS.brick}>DENIAL</text>
              </g>
            ))}
            <text x={70} y={34} textAnchor="middle" fontFamily="Fraunces" fontWeight={900} fontSize={110} fill={GS.brick} stroke={C.ink} strokeWidth={3}>?</text>
            {[[-140, 10, 'THE MAKER'], [-140, 46, 'DUFFY']].map(([x, y, t], i) => (
              <g key={i} transform={`translate(${x},${y}) rotate(${(i ? -1 : 1) * Math.sin(f / 10) * 4 * tags})`} opacity={tags}>
                <rect x={0} y={0} width={100} height={28} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
                <text x={50} y={19} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.ink}>{t as string}</text>
              </g>
            ))}
          </HeldProp>
        </g>
        <Suit f={f} x={760} y={1480} s={1.25} seed={17} cues={[b16, b17]} tag="SEC. MARKWAYNE MULLIN" reach={0.8 * lift} facing={-1} />
        {/* the glass is in his hand: lens = hand - 0.8*(206,124), handle end on the hand, raised with the arm onto the question mark */}
        <Magnifier f={f} x={760 - 1.25 * (58 + 56 * lift) - 165} y={1480 - 1.25 * (128 + 56 * lift) - 99} scale={0.8} hover={0.1} />
      </SVG>
    </Frame>
  );
};

// ---- SH8 snapshot, fog and pie, side-on (L8-L9) ----------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b18 = p.b(18), b19 = p.b(19), b43 = p.b(43), b20 = p.b(20), b21 = p.b(21), b22 = p.b(22);
  const snap = ease(f, b18, 16);
  const center = ease(f, b18, 10) * (1 - easeIO(f, b20 + 40, 24));
  const letters = ease(f, b19, 18), lstr = easeIO(f, b43, 10), fog = easeIO(f, b20 - 6, 30);
  const hand = easeIO(f, b21, 30) * (1 - 0.25 * ease(f, b22, 12));
  return (
    <Frame p={p} z0={1.0} z1={1.05} ox={520} oy={940} overlay={
      <g>
        <Plate text="OCT · MORE THAN 2 DOZEN LAWMAKERS ASKED FOR A PAUSE" displayLines={['OCT · MORE THAN 2 DOZEN LAWMAKERS', 'ASKED FOR A PAUSE']} x={540} y={600} size={30} p={win(f, b19 + 8, b18)} /> {/* plate-overlap-ok */}
        <Plate text="A DISPATCH DESK NEAR SEATTLE" x={540} y={560} size={34} p={win(f, b18 + 10, b43)} /> {/* plate-overlap-ok */}
        <Plate text="THE LETTER · OCTOBER 9TH" x={540} y={560} size={36} p={win(f, b43 + 6, b20)} /> {/* plate-overlap-ok */}
        <Plate text={'"EGREGIOUS LACK OF TRANSPARENCY"'} x={540} y={560} size={34} tone="dark" p={win(f, b20 + 6, b21)} /> {/* plate-overlap-ok */}
        <Plate text="FAA SEEKS A STAKE IN ASI" x={540} y={560} size={38} p={win(f, b21 + 8, b22)} /> {/* plate-overlap-ok */}
        <Plate text="NO DEAL CONFIRMED" x={540} y={560} size={40} tone="dark" p={win(f, b22 + 6)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={8} win={{x: 610, y: 400, w: 430, h: 300}} cool={0.45} />
        {/* the board seen side-on: skewed into depth on the left */}
        <g transform="translate(0,230) matrix(0.55,0.15,0,0.8,0,0)">
          <InvestigationBoard f={f} pinned={1} quote1={1} quote2={1} fold={0.3} tags={1} tarpTag={false} snapshot={snap} snapCenter={center} letters={letters} letterStr={lstr} fog={fog} cues={[b19, b18, b21]} emotion="worried" />
        </g>
        {/* fog drifting off the letters across the board's lower left */}
        {Array.from({length: 6}, (_, i) => (
          <ellipse key={`fg${i}`} data-band="ok" cx={60 + i * 90 + Math.sin(f / 26 + i) * 30 + (1 - fog) * -300} cy={1190 + (i % 3) * 36 + Math.sin(f / 33 + i) * 10} rx={150} ry={50} fill="#EDE8DE" opacity={0.55 * fog} />
        ))}
        {/* the windowsill in the foreground with the uncut pie */}
        <rect data-band="ok" x={600} y={1180} width={600} height={34} fill="#6B4A32" stroke={C.ink} strokeWidth={4} />
        <rect data-band="ok" x={600} y={1212} width={600} height={300} fill="#5A3A24" />
        <HeldProp f={f} px={820} py={1180} w={360} h={200} seed={12} kind="rest">
          <g transform={`translate(${ease(f, b22, 6) * Math.sin(f / 2) * 2},0)`}><Pie f={f} x={820} y={1180} scale={1.7} tag="ASI" /></g>
        </HeldProp>
        <Hand f={f} x0={1240} y0={980} x1={lerp(1240, 1000, hand)} y1={lerp(980, 1060, hand)} t={hand} tag="FAA" />
        <DeskEdge f={f} seed={8} y={1520} kind="letters" />
      </SVG>
    </Frame>
  );
};

// ---- SH9 the raven tugs (L10) ----------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b23 = p.b(23);
  const hop = ease(f, b23, 16);
  const tug = Math.max(0, Math.sin(clamp01((f - b23 - 18) / 30) * Math.PI));
  const turn = f > b23 + 50 ? -1 : 1;
  const twitch = f > b23 + 46 ? Math.abs(Math.sin((f - b23) / 4)) : 0;
  const cam = track([{t: 0, z: 1.75, fx: 330, fy: 1130}, {t: p.dur, z: 1.6, fx: 360, fy: 1110}]);
  const tilt = ease(f, b23 + 30, 14);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="NO OFFICIAL HAS LINKED SMART TO THE OUTAGE" displayLines={['NO OFFICIAL HAS LINKED', 'SMART TO THE OUTAGE']} x={540} y={600} size={36} p={win(f, b23 + 8)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={9} win={{x: 760, y: 120, w: 280, h: 240}} cool={0.7} />
        <g transform={BOARD_T}><HeldTravel f={f} x={BOARD.x} y={BOARD.y} w={BOARD.w} h={BOARD.h} mode="shadow" seed={19}>
          <InvestigationBoard f={f} pinned={1} quote1={1} quote2={0} fold={0.3} tags={1} tarpTag={false} snapshot={1} letters={1} letterStr={1} fog={0.25} tarpBump={twitch} tug={tug} tilt={tilt} noLink={ease(f, b23 + 12, 14)} cues={[b23]} emotion="worried" />
        </HeldTravel></g>
        <g transform={`translate(${lerp(120, 262, hop)},${lerp(1320, 1240, hop) - Math.sin(hop * Math.PI) * 60})`}>
          <g transform={`translate(${tug * 14},0)`}><Raven f={f} x={0} y={0} scale={1.15} facing={turn as 1 | -1} mode="perch" /></g>
        </g>
        <DeskEdge f={f} seed={9} y={1290} kind="pins" />
      </SVG>
    </Frame>
  );
};

// ---- SH10 the other new thing (L11) ----------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b24 = p.b(24), b44 = p.b(44), b25 = p.b(25), b26 = p.b(26);
  const yank = easeIO(f, b24, 16);
  const dive = easeIO(f, b24 + 8, 40);
  const crumple = ease(f, b44, 12);
  const slide = ease(f, b25, 18);
  const str = easeIO(f, b26, 14);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={980} bg={C.pine} overlay={
      <g>
        <Plate text="PER CBS · CITING THE FAA AND L3HARRIS" x={540} y={560} size={34} p={win(f, b24 + 12)} />
        <Plate text="THE OTHER NEW THING" x={540} y={650} size={36} tone="dark" p={win(f, b44 + 6, b25)} /> {/* plate-overlap-ok */}
        <Plate text="A NEW ROUTER · EL DORADO, ARKANSAS" x={540} y={650} size={36} tone="dark" p={win(f, b25 + 8, b26 + 4)} /> {/* plate-overlap-ok */}
        <Plate text="WHERE THE TRACE POINTS" x={540} y={650} size={38} tone="dark" p={win(f, b26 + 12)} />
      </g>
    }>
      <SVG>
        <Vault f={f} seed={10} />
        {/* a long cable run receding to the vault while the camera dives */}
        <g opacity={dive}>
          <path d={`M 540 ${-200 + dive * 100} L 540 900`} stroke={C.ink} strokeWidth={30} />
          <path d={`M 540 ${-200 + dive * 100} L 540 900`} stroke="#2A3A40" strokeWidth={20} />
          <g transform={`translate(${lerp(-260, 0, slide)},0)`}>
            <HeldTravel f={f} x={290} y={980} w={500} h={240} mode="shadow" seed={11}>
              <Router f={f} x={540} y={1180} scale={1.5} leds={0.3 + 0.6 * str} peanuts fragile glow={str} />
            </HeldTravel>
          </g>
          <rect x={250} y={1180} width={580} height={30} fill="#3A3A40" stroke={C.ink} strokeWidth={4} />
          {/* the board photo's cork edge stays at the frame's top left, and a red string runs from it to the router */}
          <g data-band="ok">
            <path d="M -40 380 L 210 380 L 210 -40" stroke={GS.cork} strokeWidth={36} fill="none" />
            <path d="M -40 398 L 228 398 L 228 -40" stroke={C.ink} strokeWidth={5} fill="none" />
          </g>
          <BoardString f={f} x1={200} y1={370} x2={520} y2={1060} slack={0.04} draw={str} twang={clamp01(1.6 - str)} width={6} />
          <PushPin x={200} y={370} drop={str} />
          <Lab text="EL DORADO, ARKANSAS" x={540} y={1260} size={22} fill="#0E3A40" ink="#FFF6E3" />
          {/* the yanked tarp lands crumpled on the vault floor */}
          <g transform={`translate(${880},${lerp(700, 1236, crumple)}) rotate(${(1 - crumple) * 40})`} opacity={crumple > 0 ? 1 : 0}>
            <path d="M -90 0 Q -70 -60 -10 -50 Q 40 -80 90 -30 Q 100 -10 90 0 Z" fill={GS.tarp} stroke={C.ink} strokeWidth={5} />
          </g>
        </g>
        <g opacity={1 - dive}>
          <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill={C.wall} />
          <g transform={`translate(${540 - 540 * (1 + dive * 2.5)},${960 - 960 * (1 + dive * 2.5)}) scale(${1 + dive * 2.5})`}>
            <InvestigationBoard f={f} pinned={1} quote1={1} quote2={1} fold={0.3} tags={1} snapshot={1} letters={1} letterStr={1} fog={0.15} tarpLift={yank} tilt={1} noLink={1} emotion="worried" cues={[b24]} />
          </g>
        </g>
        <NearSpools f={f} seed={10} />
      </SVG>
    </Frame>
  );
};

// ---- SH11 one thousand knocks (L12-L13) ------------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b27 = p.b(27), b45 = p.b(45), b28 = p.b(28), b46 = p.b(46), b29 = p.b(29), b30 = p.b(30);
  const splice = easeIO(f, b27, 30);
  const sparks = f > b45 && f < b45 + 24;
  const pour = clamp01((f - b28) / 20);
  // THE COUNTING HOLD: one 4.5 second (135 frame) stopwatch sweep, from the click on "thousand" to the landing on 1,000
  const sweepT = clamp01((f - b46) / 135);
  const count = Math.round(1000 * sweepT);
  const land = b46 + 135;
  const jam = ease(f, land, 10);
  const knock = sweepT > 0 && sweepT < 1 ? Math.abs(Math.sin(f * (0.6 + sweepT * 2.4))) : 0;
  const pulses = Array.from({length: 26}, (_, i) => i);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.1, fx: 470, fy: 900}, {t: 70, z: 1.04, fx: 520, fy: 960}, {t: p.dur, z: 1.06, fx: 560, fy: 960}])} bg={C.pineD} overlay={
      <g>
        <Plate text="COPPER TO FIBER UPGRADE · DUFFY SAID" x={540} y={560} size={34} p={win(f, b27 + 8, b45)} /> {/* plate-overlap-ok */}
        <Plate text="DUFFY'S SATURDAY ACCOUNT · PER NBC" x={540} y={560} size={34} p={win(f, b45 + 6, b28)} /> {/* plate-overlap-ok */}
        <Plate text="PER THE FAA" x={540} y={560} size={38} tone="dark" p={win(f, b28 + 6, b46)} /> {/* plate-overlap-ok */}
        <Plate text="4 TO 5 SECONDS · COUNT IT" x={540} y={560} size={38} tone="dark" p={win(f, b46 + 4, b29)} /> {/* plate-overlap-ok */}
        <Plate text="1,000 TRIES EVERY 4 TO 5 SECONDS" x={540} y={560} size={38} tone="dark" p={win(f, b29 + 4, b30)} /> {/* plate-overlap-ok */}
        <Plate text="1,000 TRIES EVERY 4 TO 5 SECONDS · PER THE FAA" displayLines={['1,000 TRIES EVERY 4 TO 5 SECONDS', 'PER THE FAA']} x={540} y={600} size={32} p={win(f, b30 + 6)} />
      </g>
    }>
      <SVG>
        <Vault f={f} seed={11} />
        {/* the overhead patch panel the old lines run out of */}
        <g data-band="ok">
          <rect x={-60} y={470} width={1200} height={130} rx={6} fill="#2A3438" stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 2}, (_, r) => Array.from({length: 22}, (_, i) => (
            <g key={`pp${r}-${i}`}>
              <rect x={-30 + i * 52} y={490 + r * 52} width={36} height={28} rx={3} fill="#14181C" stroke="#5A6066" strokeWidth={2} />
              <circle cx={-12 + i * 52} cy={526 + r * 52} r={4} fill="#FFB547" opacity={h01(i, r) > 0.4 ? 0.4 + 0.6 * Math.abs(Math.sin(f / (4 + h01(i, r + 2) * 6) + i)) : 0.15} />
            </g>
          )))}
          {Array.from({length: 9}, (_, i) => <path key={`pc${i}`} d={`M ${-12 + i * 120} 600 q 20 ${60 + h01(i, 7) * 50} 60 ${120 + h01(i, 8) * 40}`} stroke={['#2A2A30', GS.copper, '#5A3A2A'][i % 3]} strokeWidth={9} fill="none" />)}
        </g>
        {/* copper spliced into a plain glass fiber, equal weight, neither one the accent */}
        <g>
          <path d="M -100 760 L 200 760" stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
          <path d="M -100 760 L 200 760" stroke={GS.copper} strokeWidth={20} strokeLinecap="round" />
          <path d={`M 200 760 L ${200 + splice * 120} 760`} stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
          <path d={`M 200 760 L ${200 + splice * 120} 760`} stroke="#CFE3E0" strokeWidth={20} strokeLinecap="round" />
          {sparks && Array.from({length: 7}, (_, i) => <path key={i} d={`M 204 760 l ${Math.cos(i * 1.3 + f) * 40} ${Math.sin(i * 1.3 + f) * 40}`} stroke="#FFE7A8" strokeWidth={4} />)}
          <Hand f={f} x0={-120} y0={980} x1={180} y1={800} t={easeIO(f, b27 - 10, 16) * (1 - easeIO(f, b28, 20))} sleeve="#2E4A3A" />
          <path d="M 320 760 Q 360 760 380 900" stroke={C.ink} strokeWidth={30} fill="none" />
          <path d="M 320 760 Q 360 760 380 900" stroke="#CFE3E0" strokeWidth={20} fill="none" />
        </g>
        <HeldTravel f={f} x={300} y={880} w={480} h={220} mode="shadow" seed={12}>
          <Router f={f} x={540} y={1080} scale={1.3} leds={0.5 + 0.5 * pour} peanuts={pour < 0.6} fragile glow={pour} />
        </HeldTravel>
        <path d="M 740 1020 Q 860 1020 900 900" stroke={C.ink} strokeWidth={26} fill="none" />
        <path d="M 740 1020 Q 860 1020 900 900" stroke="#2A3A40" strokeWidth={16} fill="none" />
        <g transform="translate(900,820)">
          <rect x={-90} y={-160} width={180} height={240} rx={8} fill="#5A5048" stroke={C.ink} strokeWidth={5} />
          <rect x={-76} y={-140} width={152} height={60} fill="#3A3430" stroke={C.ink} strokeWidth={3} />
          <text x={0} y={-114} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={15} fill="#E8DCC2">OLDER SYSTEM</text>
          <text x={0} y={-92} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill="#E8DCC2">MULLIN SAID</text>
          <rect x={-30} y={50} width={60} height={14} rx={3} fill="#14181C" stroke={C.ink} strokeWidth={3} />
          <g transform={`translate(${knock * 3},-20) scale(${1 + jam * 0.08 + settle(f, land, 0.05, 30)},${1 - jam * 0.04})`}>
            <rect x={-60} y={-60} width={120} height={110} rx={4} fill="#6E6258" stroke={C.ink} strokeWidth={4} />
            <circle cx={40} cy={0} r={6} fill="#C9A04A" stroke={C.ink} strokeWidth={2} />
          </g>
        </g>
        {pulses.map((i) => {
          const t = ((f * (0.02 + pour * 0.05 + sweepT * 0.04) + i / pulses.length) % 1);
          const x = lerp(740, 900, t), y = lerp(1020, 880, t * t);
          return <circle key={i} cx={x} cy={y} r={9} fill={GS.cyan} stroke="#E8FFFF" strokeWidth={2} opacity={pour} />;
        })}
        {Array.from({length: Math.round(18 * jam + 4 * sweepT + 4 * pour)}, (_, i) => (
          <circle key={`j${i}`} cx={870 + (i % 6) * 12 + Math.sin(f / 4 + i) * 2} cy={880 - Math.floor(i / 6) * 12} r={8} fill={GS.cyan} stroke="#E8FFFF" strokeWidth={2} />
        ))}
        <g transform="translate(300,1260)">
          <rect x={-170} y={-60} width={340} height={110} rx={10} fill="#082F35" stroke="#E8DCC2" strokeWidth={5} />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={68} fill="#FFF6E3">{count.toLocaleString('en-US')}</text>
        </g>
        <Stopwatch f={f} x={780} y={1270} r={70} sweep={sweepT} accent={GS.persimmon} />
        <Lab text="ONE SWEEP · ABOUT 4.5 SEC" x={760} y={1168} size={18} fill="#082F35" ink="#FFF6E3" />
        <NearSpools f={f} seed={11} />
      </SVG>
    </Frame>
  );
};

// ---- SH12 the envelope (L14-L15) -------------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b31 = p.b(31), b32 = p.b(32), b33 = p.b(33);
  const off = easeIO(f, b31 + 6, 40);
  const rstr = easeIO(f, b32 - 10, 16);
  const env = ease(f, b33, 16);
  const crane = easeIO(f, p.dur - 40, 40);
  const cam = (fr: number): Cam => {
    // after the envelope drops the camera settles on it (about (528,1105) after the high-angle transform)
    const base = track([{t: 0, z: 1.2, fx: 540, fy: 940}, {t: b32, z: 1.08, fx: 540, fy: 950}, {t: b33 + 10, z: 1.1, fx: 560, fy: 990}, {t: p.dur - 40, z: 1.4, fx: 560, fy: 1040}])(fr);
    const k = easeIO(fr, p.dur - 40, 40);
    // the router photo after the high-angle transform: (0.8*840+108, 0.66*1180+323)
    return {z: lerp(base.z, 2.4, k), fx: lerp(base.fx, 780, k), fy: lerp(base.fy, 1102, k)};
  };
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="COPPER GOT BLAMED" x={540} y={560} size={40} p={win(f, b31 + 8, b32)} /> {/* plate-overlap-ok */}
        <Plate text="THE TRACE POINTS AT ITS REPLACEMENT" x={540} y={560} size={34} tone="dark" p={win(f, b32 + 8, b33)} /> {/* plate-overlap-ok */}
        <Plate text="WHY IT FAILED · NOT YET FINAL" x={540} y={560} size={38} p={win(f, b33 + 10, p.dur - 30)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={12} win={{x: 760, y: 120, w: 280, h: 240}} cool={1} />
        {/* seen from high above the desk: the board foreshortened, the desk filling the low frame */}
        <DeskEdge f={f} seed={12} y={1160} kind="files" />
        <g transform="translate(108,323) scale(0.8,0.66)"><HeldTravel f={f} x={BOARD.x} y={BOARD.y} w={BOARD.w} h={BOARD.h} mode="shadow" seed={21}>
          <InvestigationBoard f={f} pinned={1} quote1={1} quote2={1} fold={lerp(0.3, 0.1, off)} tags={1} snapshot={1} letters={1} letterStr={1} routerStr={rstr} envelope={env} tarpLift={1} fade={clamp01(crane * 4)} noLink={1} tilt={1} cues={[b31, b32, b33]} emotion={f < b33 ? 'worried' : 'hopeful'} />
        </HeldTravel></g>
        <g transform="translate(220,1262)">
          <rect x={-110} y={-20} width={220} height={40} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>CLAIM</text>
        </g>
        <CopperCoil f={f} x={220} y={1240} scale={0.75} slide={1} off={off} />
      </SVG>
    </Frame>
  );
};

// ---- SH13 sixty nine of 3,648 (L16) ----------------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b34 = p.b(34), b47 = p.b(47), b35 = p.b(35);
  const litT = clamp01((f - b47) / 40);
  const n69 = Math.round(69 * litT);
  // the router photo from the board grows past the frame edges at once, and the field is already rising behind it
  const grow = easeIO(f, 0, 26);
  const cam = (fr: number): Cam => {
    const k1 = easeIO(fr, 0, Math.max(20, b35 - 10));
    const k2 = easeIO(fr, b35 - 10, 30);
    return {z: lerp(lerp(2.6, 1.5, k1), 1.0, k2), fx: 540, fy: lerp(1060, 960, k2)};
  };
  return (
    <Frame p={p} cam={cam} bg={C.pineD} overlay={
      <g>
        <Plate text="PER THE CONTRACTOR VIA SENATE COMMERCE DEMOCRATS" displayLines={['PER THE CONTRACTOR', 'VIA SENATE COMMERCE DEMOCRATS']} x={540} y={600} size={32} p={win(f, b34 + 16, b47)} /> {/* plate-overlap-ok */}
        <Plate text="69 RUNNING · PER THE CONTRACTOR" displayLines={['69 RUNNING', 'PER THE CONTRACTOR']} x={540} y={590} size={38} tone="dark" p={win(f, b47 + 6)} />
        <Plate text="OF 400 INSTALLED · 3,648 PLANNED" displayLines={['OF 400 INSTALLED', '3,648 PLANNED']} x={540} y={760} size={34} p={win(f, b35 + 8)} />
        <g transform="translate(900,1230)" opacity={win(f, b47)}>
          <rect x={-90} y={-36} width={180} height={64} rx={8} fill="#082F35" stroke="#E8DCC2" strokeWidth={4} />
          <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} fill="#FFF6E3">{n69}</text>
        </g>
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill={C.pineD} />
        {/* a far wall of rack silhouettes fading into pine haze at the horizon */}
        <g data-band="ok">
          {Array.from({length: 18}, (_, i) => <rect key={i} x={-40 + i * 64} y={300 + h01(i, 4) * 40} width={52} height={210} fill="#0A3A40" stroke="#123E44" strokeWidth={2} />)}
          {Array.from({length: 18}, (_, i) => Array.from({length: 6}, (_, k) => <rect key={`${i}-${k}`} x={-34 + i * 64} y={320 + h01(i, 4) * 40 + k * 30} width={40} height={6} fill="#14464C" />))}
          <rect x={-300} y={420} width={1680} height={160} fill={C.pineD} opacity={0.55} />
        </g>
        <HeldTravel f={f} x={0} y={520} w={1080} h={810} mode="shadow" seed={23}>
          <RouterField f={f} x={0} y={540} w={1080} h={790} persp cols={76} rows={48} installed={Math.round(400 * clamp01((f - b35 + 20) / 30))} lit={69} litT={litT} />
        </HeldTravel>
        {/* cyan light rising off the lit units into the haze */}
        {Array.from({length: 12}, (_, i) => (
          <ellipse key={`g${i}`} data-band="ok" cx={80 + h01(i, 9) * 920} cy={560 + h01(i, 10) * 600} rx={70} ry={180} fill={GS.cyan} opacity={0.06 * litT * (0.6 + 0.4 * Math.sin(f / 9 + i))} />
        ))}
        {/* rack tops in the near plane */}
        <g data-band="ok">
          {Array.from({length: 7}, (_, i) => (
            <g key={i} transform={`translate(${-60 + i * 180},1360)`}>
              <rect x={0} y={0} width={160} height={600} fill="#041C20" stroke="#0E3238" strokeWidth={3} />
              <rect x={10} y={14} width={140} height={14} fill="#0A2A2E" />
              <circle cx={140} cy={44} r={5} fill={GS.cyan} opacity={(i % 3 === 0 ? 0.8 : 0.2) * litT} />
            </g>
          ))}
        </g>
        {/* the router photo from the board, growing past the frame as the camera rises out of it */}
        {grow < 0.999 && (
          <g opacity={1 - grow} transform={`translate(540,1060) scale(${lerp(1, 9, grow)})`}>
            <rect x={-40} y={-30} width={80} height={60} fill="#F2EEE6" stroke={C.ink} strokeWidth={2} />
            <rect x={-34} y={-24} width={68} height={42} fill={C.pine} />
            <Router f={f} x={0} y={14} scale={0.18} leds={0.6} peanuts={false} fragile={false} glow={0.6} />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- SH14 the dispatcher decides (L17-L19) ---------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b36 = p.b(36), b48 = p.b(48), b37 = p.b(37), b38 = p.b(38), b39 = p.b(39);
  const lights = ease(f, b36 + 6, 16);
  const frameOut = easeIO(f, 0, 24);
  const rise = ease(f, b48, 14);
  const fan = easeIO(f, b37, 24);
  const hand = easeIO(f, b38 - 14, 18);
  const tap = clamp01((f - b38) / 10);
  const gauge = easeIO(f, b39, 40);
  const routes = ['M 260 860 Q 420 700 820 760', 'M 260 860 Q 480 800 820 760', 'M 260 860 Q 520 960 820 760'];
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={960} bg="#122A2E" warmth={0.05} overlay={
      <g>
        <Plate text="ALASKA AIRLINES · FLYWAYS · SINCE 2021" x={540} y={560} size={34} p={win(f, b36 + 8, b48)} /> {/* plate-overlap-ok */}
        <Plate text="SAME MAKER · AIR SPACE INTELLIGENCE" x={540} y={560} size={34} p={win(f, b48 + 6, b37)} /> {/* plate-overlap-ok */}
        <Plate text="IT SUGGESTS BETTER ROUTES" x={540} y={560} size={38} p={win(f, b37 + 8, b38)} /> {/* plate-overlap-ok */}
        <Plate text="THE DISPATCHER DECIDES · PER ALASKA'S OPS CHIEF VIA NPR" displayLines={['THE DISPATCHER DECIDES', "PER ALASKA'S OPS CHIEF VIA NPR"]} x={540} y={600} size={32} tone="dark" p={win(f, b38 + 6, b39)} /> {/* plate-overlap-ok */}
        <Plate text="ABOUT 1 MILLION GALLONS A YEAR · PER ALASKA AIRLINES" displayLines={['ABOUT 1 MILLION GALLONS A YEAR', 'PER ALASKA AIRLINES']} x={540} y={600} size={32} p={win(f, b39 + 8)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#122A2E" />
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#2E5A60" opacity={0.5 * lights} />
        <g data-band="ok">
          <rect x={120} y={140} width={840} height={280} rx={6} fill="#1E3A40" stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 18}, (_, i) => <path key={i} d={`M ${140 + h01(i, 3) * 800} ${150 + ((f * 3 + i * 40) % 260)} l -4 22`} stroke="#9FC3CC" strokeWidth={2} opacity={0.5} />)}
          {/* runway lights and a dim city through the rain */}
          {Array.from({length: 14}, (_, i) => <circle key={`bk${i}`} cx={160 + i * 56} cy={330 - (i % 4) * 6} r={9 + (i % 3) * 4} fill={i % 5 === 0 ? GS.persimmon : '#FFE7A8'} opacity={0.25 + 0.15 * Math.sin(f / 13 + i)} />)}
          {Array.from({length: 9}, (_, i) => <rect key={`cy${i}`} x={150 + i * 90} y={230 + h01(i, 6) * 60} width={60} height={110 - h01(i, 6) * 60} fill="#16323A" opacity={0.8} />)}
          <path d="M 120 380 L 960 360" stroke="#0A2024" strokeWidth={30} />
          <circle cx={700} cy={330} r={6} fill={GS.persimmon} opacity={0.5 + 0.5 * Math.sin(f / 8)} />
        </g>
        <rect data-band="ok" x={-100} y={1180} width={1280} height={400} fill={C.desk} stroke={C.ink} strokeWidth={4} />
        <rect data-band="ok" x={-100} y={1180} width={1280} height={20} fill={C.deskL} />
        <g>
          <rect x={150} y={560} width={780} height={560} rx={14} fill="#0A1A1C" stroke={C.ink} strokeWidth={8} />
          <rect x={174} y={584} width={732} height={512} rx={6} fill="#0E3A40" opacity={0.4 + 0.6 * lights} />
          <path d="M 500 1120 L 470 1180 L 610 1180 L 580 1120 Z" fill="#3A3A40" stroke={C.ink} strokeWidth={4} />
          <g opacity={lights} transform="translate(190,600) scale(0.24)"><path d={AK_PATH} fill="#2E5A60" stroke="#9FC3CC" strokeWidth={8} /></g>
          <circle cx={260} cy={860} r={10} fill={GS.persimmon} stroke={C.ink} strokeWidth={3} opacity={lights} />
          <circle cx={820} cy={760} r={10} fill={C.paper} stroke={C.ink} strokeWidth={3} opacity={lights} />
          {routes.map((d, i) => (
            <path key={i} d={d} stroke={i === 1 && tap > 0.5 ? '#FFF1D2' : GS.card} strokeWidth={i === 1 && tap > 0.5 ? 8 : 5} fill="none"
              pathLength={1} style={{strokeDasharray: `${clamp01(fan * 1.6 - i * 0.3)} 1`}} opacity={lights * (tap > 0.5 && i !== 1 ? 0.35 : 0.75 + 0.25 * Math.sin(f / 5 + i * 2))} />
          ))}
          <HeldTravel f={f} x={180} y={900} w={300} h={200} mode="sweep" seed={14}>
            <SuggestionSlip f={f} x={330 + Math.sin(f / 14) * 10 * (1 - tap)} y={1080 + (1 - rise) * 60 - Math.abs(Math.sin(f / 9)) * 8 * fan * (1 - tap)} scale={0.9} emotion={tap > 0.5 ? 'content' : 'eager'} nod={clamp01((f - b38 - 4) / 14)} rot={-8 * Math.sin(rise * Math.PI)} tag="FLYWAYS" cues={[b36, b48, b37, b38]} seed={11} />
          </HeldTravel>
        </g>
        <Hand f={f} x0={1150} y0={1250} x1={lerp(1150, 560, hand)} y1={lerp(1250, 850, hand)} t={hand} tap={tap} sleeve="#2E4A3A" tag="DISPATCHER" />
        <g transform="translate(860,1240) scale(0.85)">
          <ContactShadow cx={0} cy={60} rx={90} ry={10} opacity={0.4} />
          <circle cx={0} cy={0} r={70} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <path d="M -50 30 A 58 58 0 1 1 50 30" stroke={C.ink} strokeWidth={4} fill="none" />
          <path d={`M 0 0 L ${Math.cos(Math.PI * (0.8 + gauge * 1.4)) * 50} ${Math.sin(Math.PI * (0.8 + gauge * 1.4)) * 50}`} stroke={GS.persimmon} strokeWidth={7} strokeLinecap="round" />
          <circle cx={0} cy={0} r={7} fill={C.ink} />
          <text x={0} y={46} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.ink}>FUEL</text>
        </g>
        <g data-band="ok">
          <rect x={-100} y={1520} width={1280} height={500} fill="#4A3222" />
          <ellipse cx={540} cy={1530} rx={520} ry={60} fill="#2E5A60" opacity={0.35 * lights} />
          <rect x={120} y={1560} width={420} height={60} rx={8} fill="#2A2A30" stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 2}, (_, r) => Array.from({length: 11}, (_, i) => <rect key={`kc${r}${i}`} x={132 + i * 37} y={1600 + r * 34} width={30} height={26} rx={4} fill="#5A5A62" stroke={C.ink} strokeWidth={2} />))}
          <g transform="translate(720,1600) rotate(-6)"><rect x={0} y={0} width={200} height={130} fill={C.paper} stroke={C.ink} strokeWidth={4} /><path d="M 20 30 L 170 30 M 20 56 L 150 56 M 20 82 L 160 82" stroke={C.ink} strokeWidth={3} opacity={0.4} /><circle cx={160} cy={100} r={22} fill="none" stroke="#8E6646" strokeWidth={4} opacity={0.6} /></g>
          <path d="M 960 1660 L 964 1580 L 1030 1580 L 1034 1660 Z" fill={GS.persimmon} stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 12}, (_, i) => <rect key={i} x={132 + i * 34} y={1572} width={26} height={16} rx={3} fill="#4A4A52" />)}
        </g>
        {/* the shot opens on the board, then pushes into the corner snapshot until it fills the frame */}
        {f < 26 && (
          <g opacity={1 - easeIO(f, 8, 16)}>
            <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill={C.wall} />
            <g transform={`translate(${540 - 855 * lerp(1.0, 4.2, easeIO(f, 0, 22))},${960 - 1080 * lerp(1.0, 4.2, easeIO(f, 0, 22))}) scale(${lerp(1.0, 4.2, easeIO(f, 0, 22))})`}>
              <InvestigationBoard f={f} pinned={1} quote1={1} quote2={1} fold={0.1} tags={1} snapshot={1} letters={1} letterStr={1} routerStr={1} envelope={1} tarpLift={1} tilt={1} noLink={1} emotion="hopeful" cues={[b36]} />
            </g>
          </g>
        )}
        {/* the snapshot's paper border, which the camera has just pushed through */}
        {frameOut < 0.999 && (
          <g data-band="ok" opacity={1 - frameOut}>
            <rect x={-300} y={-100} width={1680} height={260 - frameOut * 360} fill="#F2EEE6" />
            <rect x={-300} y={1700 + frameOut * 400} width={1680} height={500} fill="#F2EEE6" />
            <rect data-band="ok" x={-300} y={-100} width={260 - frameOut * 560} height={2200} fill="#F2EEE6" />
            <rect data-band="ok" x={1120 + frameOut * 400} y={-100} width={300} height={2200} fill="#F2EEE6" />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- SH15 back to the apron (L20) ------------------------------------------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b40 = p.b(40), b41 = p.b(41);
  const bank = (f / 60) % 1;
  const look = ease(f, b41, 14);
  const cam = (fr: number): Cam => {
    const k = easeIO(fr, b40, 50);
    return {z: lerp(3.2, 1.0, k), fx: lerp(900, 540, k), fy: lerp(560, 960, k)};
  };
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="BLAME CAN WAIT FOR THE FINDINGS" x={540} y={560} size={38} p={win(f, b40 + 30)} />
        <Plate text="GETTING THE CUTOVER RIGHT CAN'T" x={540} y={650} size={38} tone="dark" p={win(f, b41 + 6)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={860} seed={1} />
        <Apron f={f} horizon={860} seed={2} />
        {/* the investigation office is a lit window in the terminal's upper wall */}
        <rect data-band="ok" x={700} y={360} width={420} height={380} fill="#C9B8A0" stroke={C.ink} strokeWidth={4} />
        {Array.from({length: 5}, (_, i) => <path key={`w${i}`} d={`M 700 ${400 + i * 70} L 1120 ${400 + i * 70}`} stroke="#B3A286" strokeWidth={3} />)}
        <g transform="translate(860,500)">
          <rect x={-70} y={-60} width={160} height={120} rx={4} fill="#6B4A32" stroke={C.ink} strokeWidth={4} />
          <rect x={-60} y={-50} width={140} height={100} fill={C.wall} />
          <rect x={-50} y={-44} width={120} height={86} fill={GS.cork} stroke={C.ink} strokeWidth={2} />
          <SuggestionSlip f={f} x={0} y={20} scale={0.22} emotion="hopeful" look={-look} rot={-8 * look} cues={[b41]} seed={14} shadow={false} />
          <rect x={18} y={-2} width={40} height={24} fill="#EBD9B4" stroke={C.ink} strokeWidth={1.5} />
        </g>
        <g transform={`translate(${320 + Math.sin(bank * Math.PI * 2) * 60},${300 + Math.cos(bank * Math.PI * 2) * 30}) rotate(${Math.sin(bank * Math.PI * 2) * 8})`}>
          <BushPlane f={f} x={0} y={0} scale={0.8} mode="fly" propSpeed={1.2} body={GS.persimmon} />
        </g>
        <Airliner f={f} x={790} y={1240} scale={0.82} emotion="hopeful" look={-1} cues={[b40, b41]} seed={3} />
        <Cone x={1110} y={1300} />
        {/* the cutover: a cable crew's junction box at the apron edge, its router lights the only cyan */}
        <g transform="translate(300,1290)">
          <ContactShadow cx={0} cy={4} rx={110} ry={10} opacity={0.4} />
          <rect x={-90} y={-130} width={180} height={130} rx={8} fill="#5A6066" stroke={C.ink} strokeWidth={5} />
          <rect x={-70} y={-110} width={140} height={60} fill="#1E2A30" stroke={C.ink} strokeWidth={3} />
          {Array.from({length: 6}, (_, i) => <circle key={i} cx={-55 + i * 22} cy={-80} r={5} fill={GS.cyan} opacity={0.5 + 0.5 * Math.sin(f / 5 + i)} />)}
          <path d="M 90 -40 Q 160 -40 200 20" stroke={C.ink} strokeWidth={14} fill="none" />
          <path d="M 90 -40 Q 160 -40 200 20" stroke="#CFE3E0" strokeWidth={7} fill="none" />
        </g>
        <Suit f={f} x={460} y={1300} s={0.75} seed={31} cues={[b40, b41]} coat="#E0662B" tag="CABLE CREW" reach={0.5} facing={-1} />
        <NearApron f={f} seed={5} />
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

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

export const ep1119Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1119Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1119: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 7, 18, 26, 33, 49, 55, 68, 71, 80, 94, 102, 108, 123, 128].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.wall}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#0E3A40" ink="#FFF6E3" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
