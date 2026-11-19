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
    <text x={900} y={horizon - 124} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill="#FFF6E3" letterSpacing={2}>TED STEVENS ANCHORAGE</text>
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
const Office: React.FC<{f: number; seed?: number; lamp?: number; win?: {x: number; y: number; w: number; h: number}; jet?: boolean}> = ({f, seed = 0, lamp = 1, win: wn = {x: 760, y: 150, w: 300, h: 260}, jet = true}) => (
  <g data-band="ok">
    <rect x={-300} y={-100} width={1680} height={2200} fill={C.wall} />
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
        {jet && <Airliner f={f} x={wn.w * 0.55} y={wn.h * 0.92} scale={0.32} emotion="glum" seed={8} />}
      </svg>
      <path d={`M ${wn.w / 2} 0 L ${wn.w / 2} ${wn.h} M 0 ${wn.h / 2} L ${wn.w} ${wn.h / 2}`} stroke="#6B4A32" strokeWidth={8} />
      <path d={`M 8 ${wn.h - 20} L ${wn.w * 0.3} 12`} stroke="#FFFFFF" strokeWidth={5} opacity={0.35} />
    </g>
    {/* lamp glow */}
    <ellipse cx={540} cy={820} rx={620} ry={520} fill={C.lamp} opacity={0.12 * lamp + 0.03 * Math.sin(f / 37 + seed)} />
  </g>
);

/** the desk edge in the near plane: wood with a mug, a pencil cup and paper, seeded per shot */
const DeskEdge: React.FC<{f: number; seed?: number; y?: number}> = ({f, seed = 0, y = 1500}) => (
  <g data-band="ok">
    <rect x={-300} y={y} width={1680} height={600} fill={C.desk} stroke={C.ink} strokeWidth={4} />
    <rect x={-300} y={y} width={1680} height={22} fill={C.deskL} />
    {Array.from({length: 6}, (_, i) => <path key={i} d={`M -300 ${y + 60 + i * 50} q 400 ${-10 + h01(i, seed) * 20} 900 0 t 900 0`} stroke="#5A3A24" strokeWidth={3} fill="none" opacity={0.5} />)}
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
  </g>
);

/** the night cable vault: pine walls, cable trays, one caged work lamp, cable spools in front */
const Vault: React.FC<{f: number; seed?: number}> = ({f, seed = 0}) => (
  <g data-band="ok">
    <rect x={-300} y={-100} width={1680} height={2200} fill={C.pineD} />
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
      {tag && <Lab text={tag} x={lerp(x0, hx, 0.55)} y={lerp(y0, hy, 0.55) - 44} size={20} />}
    </g>
  );
};

/** a stylised lower-48 outline in a 900 x 520 box (illustrative, not a projection), with 22 dome sites scattered inside */
const L48 = 'M 40 120 L 120 70 L 300 60 L 470 80 L 600 70 L 700 100 L 790 60 L 860 90 L 880 160 L 830 230 L 840 300 L 780 360 L 760 430 L 700 410 L 640 450 L 560 430 L 480 470 L 430 510 L 380 450 L 280 440 L 200 400 L 120 380 L 60 320 L 30 240 Z';
const DOMES: Array<[number, number]> = [[110, 150], [140, 260], [190, 340], [250, 190], [300, 300], [330, 400], [380, 150], [420, 250], [470, 360], [520, 170], [540, 290], [590, 390], [620, 140], [650, 240], [690, 330], [720, 170], [760, 250], [800, 140], [740, 380], [450, 440], [230, 110], [580, 220]];
const Dome: React.FC<{x: number; y: number; on: number; f: number; i: number}> = ({x, y, on, f, i}) => (
  <g transform={`translate(${x},${y - Math.sin(clamp01(on) * Math.PI) * 10})`}>
    <ellipse cx={0} cy={6} rx={22} ry={6} fill="#000" opacity={0.25} />
    <path d="M -18 4 A 18 18 0 0 1 18 4 Z" fill={on > 0.5 ? '#FFE7A8' : '#B9A588'} stroke={C.ink} strokeWidth={3} />
    {on > 0.5 && <circle cx={0} cy={-4} r={30} fill="#FFE7A8" opacity={0.18 + 0.08 * Math.sin(f / 7 + i)} />}
  </g>
);

// ======================================================================================================================================================
// ---- SH1 the split apron (L0) ----------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b1 = p.b(1), b2 = p.b(2);
  const slam = ease(f, b1 + 9, 10);
  const stamp = ease(f, b2, 10);
  const lift = easeIO(f, Math.max(4, b2 - 30), 70);
  const cam = track([{t: 0, z: 1.12, fx: 560, fy: 1040}, {t: b2, z: 1.05, fx: 540, fy: 990}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="NOV 13 · NATIONWIDE GROUND STOP" x={540} y={560} size={38} p={win(f, b1 + 10)} />
        <Plate text="FLIGHTS OUT OF ALASKA GROUNDED · PER AN AIRPORT OFFICIAL" displayLines={['FLIGHTS OUT OF ALASKA GROUNDED', 'PER AN AIRPORT OFFICIAL']} x={540} y={680} size={30} tone="dark" p={win(f, b2 + 6)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={860} seed={1} />
        <Apron f={f} horizon={860} seed={1} />
        {/* the jet's half goes pine under the stamp */}
        <rect data-band="ok" x={560} y={860} width={700} height={700} fill={C.pine} opacity={0.18 * stamp} />
        <path d={`M 560 860 L 560 ${860 + 700 * Math.max(0.05, stamp)}`} stroke={C.ink} strokeWidth={4} strokeDasharray="18 12" opacity={stamp} />
        {/* the Super Cub lifts off the left half over the Chugach */}
        <HeldTravel f={f} x={40} y={700} w={420} h={340} mode="sweep" seed={2}>
          <BushPlane f={f} x={220 + lift * 140} y={1180 - lift * 420} scale={1.05} mode={lift > 0.05 ? 'fly' : 'ground'} propSpeed={1.2} body={GS.persimmon} />
        </HeldTravel>
        {/* the jet at its gate on the right, a cone sliding under its nose wheel */}
        <Airliner f={f} x={790} y={1240} scale={0.82} emotion={f < b1 + 10 ? 'calm' : 'wide'} strain={0.6 * slam} look={f > b2 ? -1 : 0} cues={[b1, b2]} seed={3} />
        <g transform={`translate(${1010 - slam * 30 + settle(f, b1 + 19, 6)},1236)`}>
          <ContactShadow cx={0} cy={2} rx={26} ry={6} opacity={0.4} />
          <path d="M -20 0 L -8 -56 L 8 -56 L 20 0 Z" fill={GS.persimmon} stroke={C.ink} strokeWidth={4} />
          <path d="M -13 -28 L 13 -28" stroke="#FFF6E3" strokeWidth={7} />
        </g>
        <g opacity={stamp} transform={`translate(830,1080) rotate(-10) scale(${1.4 - stamp * 0.4})`}>
          <rect x={-170} y={-44} width={340} height={88} rx={8} fill="none" stroke={GS.brick} strokeWidth={9} />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={58} fill={GS.brick} letterSpacing={4}>GROUNDED</text>
        </g>
        <NearApron f={f} seed={1} />
      </SVG>
    </Frame>
  );
};

// ---- SH2 the board (L1) ----------------------------------------------------------------------------------------------------------------------------
/** the Alaska map pinned on the board, in-state strings pulsing between towns, out-of-state strings frozen at the edge */
const MapOnBoard: React.FC<{f: number; x: number; y: number; s: number; freeze: number; pulse: number}> = ({f, x, y, s, freeze, pulse}) => {
  const towns: Array<[string, number, number]> = [['ANCHORAGE', 470, 520], ['BETHEL', 250, 430], ['NOME', 220, 270], ['JUNEAU', 860, 560]];
  const [ax, ay] = [470, 520];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-10} y={-10} width={1020} height={720} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <path d={AK_PATH} fill="#E9D7B4" stroke={C.ink} strokeWidth={5} />
      <path d={AK_PATH} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.4} transform="translate(-4,-4)" />
      {/* in-state strings, pulsing */}
      {towns.slice(1).map(([n, tx, ty], i) => (
        <g key={n}>
          <path d={`M ${ax} ${ay} Q ${(ax + tx) / 2} ${Math.min(ay, ty) - 60} ${tx} ${ty}`} stroke={C.ink} strokeWidth={9} fill="none" />
          <path d={`M ${ax} ${ay} Q ${(ax + tx) / 2} ${Math.min(ay, ty) - 60} ${tx} ${ty}`} stroke={GS.persimmon} strokeWidth={5} fill="none" />
          <circle r={10} fill="#FFF1D2" stroke={C.ink} strokeWidth={3} opacity={pulse}>
            <animateMotion dur="1s" repeatCount="1" path={`M ${ax} ${ay} Q ${(ax + tx) / 2} ${Math.min(ay, ty) - 60} ${tx} ${ty}`} />
          </circle>
          {(() => {
            const t = ((f / 40 + i * 0.33) % 1);
            const qx = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * ((ax + tx) / 2) + t * t * tx;
            const qy = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * (Math.min(ay, ty) - 60) + t * t * ty;
            return <circle cx={qx} cy={qy} r={12} fill="#FFF1D2" stroke={C.ink} strokeWidth={3} opacity={pulse} />;
          })()}
        </g>
      ))}
      {/* out-of-state strings, frozen stiff at the map edge, little plane pins stuck on them */}
      {[[1000, 640], [1000, 420], [700, 700]].map(([ex, ey], i) => (
        <g key={i}>
          <path d={`M ${ax} ${ay} L ${ex} ${ey}`} stroke={C.ink} strokeWidth={9} />
          <path d={`M ${ax} ${ay} L ${ex} ${ey}`} stroke="#6B6E74" strokeWidth={5} strokeDasharray={freeze > 0.5 ? '0' : '14 10'} />
          <g transform={`translate(${lerp(ax, ex, 0.82)},${lerp(ay, ey, 0.82)}) rotate(${Math.atan2(ey - ay, ex - ax) * 180 / Math.PI})`}>
            <path d="M -18 0 L 18 0 M -4 -14 L 6 0 L -4 14 M -16 -6 L -12 0 L -16 6" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          </g>
          <circle cx={ex} cy={ey} r={14} fill={GS.brick} stroke={C.ink} strokeWidth={3} opacity={freeze} />
        </g>
      ))}
      {towns.map(([n, tx, ty]) => (
        <g key={n}>
          <circle cx={tx} cy={ty} r={12} fill={n === 'ANCHORAGE' ? GS.persimmon : C.paper} stroke={C.ink} strokeWidth={4} />
          <text x={tx} y={ty - 22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>{n}</text>
        </g>
      ))}
    </g>
  );
};

const BOARD = {x: 80, y: 420, w: 920, h: 860};
const S2: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b3 = p.b(3), b4 = p.b(4);
  const swing = ease(f, Math.max(0, b3 - 6), 18);
  const freeze = ease(f, b3 + 16, 10);
  const sweep = easeIO(f, b4, 50) * 4;
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={900} overlay={
      <g>
        <Plate text="IN STATE FLIGHTS NOT IMPACTED · PER ALASKA AIRLINES" displayLines={['IN STATE FLIGHTS NOT IMPACTED', 'PER ALASKA AIRLINES']} x={540} y={600} size={32} p={win(f, b3 + 6, b4 + 2)} /> {/* plate-overlap-ok */}
        <Plate text="MORE THAN 4 HOURS · 2ND SINCE 9/11" x={540} y={600} size={34} tone="dark" p={win(f, b4 + 8)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={2} win={{x: 760, y: 120, w: 280, h: 240}} />
        <g transform={`translate(0,${(1 - swing) * -40}) rotate(${(1 - swing) * -3} 540 420)`}>
          <CorkBoard x={BOARD.x} y={BOARD.y} w={BOARD.w} h={BOARD.h} seed={2}>
            <HeldTravel f={f} x={70} y={70} w={720} h={500} mode="shadow" seed={3}>
              <MapOnBoard f={f} x={70} y={80} s={0.7} freeze={freeze} pulse={1} />
            </HeldTravel>
            <PushPin x={80} y={90} drop={swing} /><PushPin x={770} y={90} drop={swing} /><PushPin x={80} y={560} drop={swing} /><PushPin x={770} y={560} drop={swing} />
            <g transform="translate(760,700)">
              <HeldProp f={f} px={0} py={0} w={180} h={200} seed={4} kind="hang">
                <Stopwatch f={f} x={0} y={0} r={74} sweep={sweep + f / 900} />
              </HeldProp>
            </g>
            <PushPin x={760} y={590} drop={ease(f, b4 - 10, 12)} />
            {/* the two tarps, already waiting under the map */}
            <Tarp f={f} x={250} y={820} w={220} h={120} tag="NEW" seed={1} />
            <Tarp f={f} x={520} y={820} w={220} h={120} tag="NEW" seed={2} />
          </CorkBoard>
        </g>
        <DeskEdge f={f} seed={2} />
      </SVG>
    </Frame>
  );
};

// ---- SH3 two new things (L2) -----------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b5 = p.b(5), b6 = p.b(6);
  const bumpL = clamp01((f - b5) / 18), bumpR = clamp01((f - b5 - 8) / 18);
  const spot = easeIO(f, b6 - 4, 18);
  const spotX = lerp(980, 380, spot);
  return (
    <Frame p={p} z0={1.18} z1={1.26} oy={1160} ox={520} overlay={
      <g>
        <Plate text="TWO NEW THINGS THAT WEEK" x={540} y={580} size={38} p={win(f, b5 + 6)} />
        <Plate text="ONE OF THEM WAS AI" x={540} y={670} size={36} tone="dark" p={win(f, b6 + 8)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={3} win={{x: 760, y: 120, w: 280, h: 240}} lamp={0.6} />
        <CorkBoard x={BOARD.x} y={BOARD.y} w={BOARD.w} h={BOARD.h} seed={2}>
          <MapOnBoard f={f} x={70} y={80} s={0.7} freeze={1} pulse={1} />
          <HeldTravel f={f} x={120} y={620} w={600} h={220} mode="shadow" seed={5}>
            <Tarp f={f} x={300} y={820} w={260} h={150} tag="NEW" bump={bumpL} seed={1} />
            <Tarp f={f} x={600} y={820} w={260} h={150} tag="NEW" bump={bumpR} seed={2} />
          </HeldTravel>
          {spot > 0.4 && (
            <g transform={`translate(${380 - BOARD.x + 20},${700 + settle(f, b6 + 10, 10)})`}>
              <path d="M 0 -60 L 0 -20" stroke={C.ink} strokeWidth={3} />
              <rect x={-30} y={-20} width={60} height={36} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={3} transform={`rotate(${Math.sin(f / 9) * 8})`} />
              <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink} transform={`rotate(${Math.sin(f / 9) * 8})`}>AI</text>
            </g>
          )}
        </CorkBoard>
        {/* the desk lamp's spotlight swings across */}
        <path data-band="ok" d={`M 1100 380 L ${spotX - 190} 1320 L ${spotX + 190} 1320 Z`} fill={C.lamp} opacity={0.22 * clamp01(spot * 2)} />
        <ellipse data-band="ok" cx={spotX} cy={1150} rx={200} ry={150} fill={C.lamp} opacity={0.25 * clamp01(spot * 2)} />
        <DeskEdge f={f} seed={3} />
      </SVG>
    </Frame>
  );
};

// ---- SH4 twenty two centers (L3) -------------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
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
        <Plate text="3 DAYS LATER" x={540} y={680} size={44} p={win(f, b9 + 8)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill={C.pine} />
        {Array.from({length: 40}, (_, i) => <circle key={i} data-band="ok" cx={h01(i, 1) * 1080} cy={h01(i, 2) * 500} r={1.5 + h01(i, 3) * 2} fill="#FFF6E3" opacity={0.3 + 0.3 * Math.sin(f / 20 + i)} />)}
        {/* the radar-room table the map lies on */}
        <rect data-band="ok" x={-100} y={760} width={1280} height={900} fill="#0A3E44" stroke={C.ink} strokeWidth={4} />
        <HeldTravel f={f} x={80} y={800} w={920} h={560} mode="shadow" seed={6}>
          <g transform="translate(90,820)">
            <path d={L48} fill="#E9D7B4" stroke={C.ink} strokeWidth={5} />
            <path d={L48} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.4} transform="translate(-4,-4)" />
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
        {/* calendars: NOV 13 on the right, the left one flipping back to NOV 10 */}
        <DeskCalendar f={f} x={300} y={760} scale={0.9} page="13" next="10" flip={flip} />
        <DeskCalendar f={f} x={800} y={760} scale={0.9} page="13" />
        <g opacity={arrow}>
          <path d={`M 380 520 Q 540 ${420 - arrow * 30} ${lerp(400, 720, arrow)} 520`} stroke={C.ink} strokeWidth={30} fill="none" strokeLinecap="round" />
          <path d={`M 380 520 Q 540 ${420 - arrow * 30} ${lerp(400, 720, arrow)} 520`} stroke={GS.persimmon} strokeWidth={20} fill="none" strokeLinecap="round" />
          <path d={`M ${lerp(400, 720, arrow) - 30} 500 L ${lerp(400, 720, arrow) + 10} 530 L ${lerp(400, 720, arrow) - 30} 560`} fill={GS.persimmon} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        </g>
        {/* near plane: the table edge and a radio */}
        <g data-band="ok">
          <rect x={-100} y={1500} width={1280} height={500} fill="#062E33" stroke={C.ink} strokeWidth={4} />
          <rect x={720} y={1540} width={240} height={120} rx={10} fill="#3A3A40" stroke={C.ink} strokeWidth={4} />
          <circle cx={780} cy={1600} r={30} fill="#1A1A20" stroke={C.ink} strokeWidth={3} />
          {Array.from({length: 4}, (_, i) => <rect key={i} x={830} y={1570 + i * 20} width={100} height={8} fill="#5A5A60" />)}
          <circle cx={940} cy={1560} r={6} fill={GS.led} opacity={0.5 + 0.5 * Math.sin(f / 5)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- SH5 it only suggests (L4) ---------------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b10 = p.b(10), b11 = p.b(11);
  const route = easeIO(f, b10 + 6, 40);
  const slide = easeIO(f, b11, 26);
  const hand = easeIO(f, b11 + 18, 20);
  const icons = ['cloud', 'clock', 'plane', 'snow', 'wind', 'list'];
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={980} overlay={
      <g>
        <Plate text="AI THAT PREDICTS CONGESTION" x={540} y={570} size={38} p={win(f, b10 + 8, b11)} /> {/* plate-overlap-ok */}
        <Plate text="IT ADVISES · PEOPLE DECIDE" x={540} y={570} size={40} tone="dark" p={win(f, b11 + 10)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#123F45" />
        <ellipse data-band="ok" cx={540} cy={900} rx={600} ry={520} fill={C.lamp} opacity={0.1} />
        {/* a desk top the slip stands on */}
        <rect data-band="ok" x={-300} y={1180} width={1680} height={900} fill={C.desk} stroke={C.ink} strokeWidth={4} />
        <rect data-band="ok" x={-300} y={1180} width={1680} height={20} fill={C.deskL} />
        {/* data streams pouring into the slip's folds */}
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
        {/* the slip, opened as a cutaway (a lighter window into its folds) */}
        <g transform={`translate(${lerp(470, 640, slide)},0)`}>
          <HeldTravel f={f} x={260} y={900} w={420} h={340} mode="sweep" seed={7}>
            <SuggestionSlip f={f} x={0 + 470 - 470} y={1190} scale={1.7} emotion={f < b11 ? 'focused' : 'humble'} route={route} look={f > b11 ? 1 : 0} cues={[b10, b11]} seed={4} tag="SMART" />
          </HeldTravel>
          <g transform="translate(0,1190)">
            <path d="M -120 -150 Q -80 -200 -20 -170 L -40 -110 Q -90 -120 -120 -150 Z" fill="#FFFDF4" stroke={C.ink} strokeWidth={4} strokeDasharray="10 6" opacity={0.8} />
          </g>
        </g>
        {/* a faceless controller's hand reaches in from the right and picks the route up */}
        <Hand f={f} x0={1240} y0={1060} x1={lerp(1240, 900, hand)} y1={lerp(1060, 1050, hand)} t={hand} tag="FAA STAFF" />
        <g data-band="ok">
          <rect x={-300} y={1520} width={1680} height={500} fill="#4A3222" />
          {Array.from({length: 5}, (_, i) => <path key={i} d={`M -300 ${1560 + i * 60} q 500 ${-10 + h01(i, 5) * 20} 1000 0 t 1000 0`} stroke="#3A2618" strokeWidth={3} fill="none" opacity={0.6} />)}
        </g>
      </SVG>
    </Frame>
  );
};

// ---- SH6 the denials (L5-L6) -----------------------------------------------------------------------------------------------------------------------
/** the board in its investigation state, reused by SH6, SH7, SH8 and SH12 */
const InvestigationBoard: React.FC<{f: number; pinned: number; quote1: number; quote2: number; coilIn: number; coilSlide?: number; coilOff?: number; fold?: number; sweat?: number;
  slack?: number; cyan?: number; finalTag?: number; snapshot?: number; tags?: number; fog?: number; letters?: number; cues?: number[]; emotion?: 'scared' | 'worried' | 'hopeful' | 'sheepish'; tarpLift?: number; tarpBump?: number}> =
({f, pinned, quote1, quote2, coilIn, coilSlide = 0, coilOff = 0, fold = 0, sweat = 0, slack = 0.08, cyan = 0, finalTag = 0, snapshot = 0, tags = 0, fog = 0, letters = 0, cues = [], emotion = 'scared', tarpLift = 0, tarpBump = 0}) => {
  const cxp = 460, cyp = 560;
  const anchors: Array<[number, number]> = [[110, 130], [810, 130], [110, 760], [810, 760]];
  return (
    <CorkBoard x={BOARD.x} y={BOARD.y} w={BOARD.w} h={BOARD.h} seed={6}>
      {/* the map, now small at the top left */}
      <g transform="translate(60,60) scale(0.28)">
        <rect x={-10} y={-10} width={1020} height={720} fill={C.paper} stroke={C.ink} strokeWidth={10} />
        <path d={AK_PATH} fill="#E9D7B4" stroke={C.ink} strokeWidth={10} />
      </g>
      {/* question strings to the slip, never cut */}
      {anchors.map(([ax, ay], i) => <BoardString key={i} f={f} x1={ax} y1={ay} x2={cxp} y2={cyp - 60} slack={slack} draw={pinned} />)}
      {anchors.map(([ax, ay], i) => <PushPin key={`p${i}`} x={ax} y={ay} drop={pinned} />)}
      {/* the slip pinned at the center */}
      {pinned > 0.01 && (
        <g transform={`translate(0,${(1 - pinned) * -200})`}>
          <SuggestionSlip f={f} x={cxp} y={cyp + 60} scale={1.0} emotion={emotion} fold={fold} sweat={sweat} cues={cues} seed={6} tag="SMART" shadow={false} />
          <PushPin x={cxp} y={cyp - 70} drop={pinned} color="#E8E2D2" size={1.2} />
        </g>
      )}
      {/* quote plates beside it, no checks; source tags swing below them */}
      {quote1 > 0.01 && (
        <g transform={`translate(${130},${330 + settle(f, 0, 0)}) rotate(-4)`} opacity={quote1}>
          <rect x={0} y={0} width={230} height={120} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
          <text x={115} y={44} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>"NOT A RESULT"</text>
          <text x={115} y={74} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>"OF SMART"</text>
          <PushPin x={115} y={10} />
          {tags > 0.01 && <g transform={`translate(115,${120}) rotate(${Math.sin(f / 10) * 6 * tags})`} opacity={tags}><path d="M 0 0 L 0 26" stroke={C.ink} strokeWidth={3} /><Lab text="THE MAKER" x={0} y={44} size={18} /></g>}
        </g>
      )}
      {quote2 > 0.01 && (
        <g transform="translate(560,330) rotate(4)" opacity={quote2}>
          <rect x={0} y={0} width={230} height={120} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
          <text x={115} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>"COMPLETELY</text>
          <text x={115} y={80} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>DISCONNECTED"</text>
          <PushPin x={115} y={10} />
          {tags > 0.01 && <g transform={`translate(115,120) rotate(${-Math.sin(f / 10) * 6 * tags})`} opacity={tags}><path d="M 0 0 L 0 26" stroke={C.ink} strokeWidth={3} /><Lab text="DUFFY" x={0} y={44} size={18} /></g>}
        </g>
      )}
      {/* the snapshot of a dark dispatch desk */}
      {snapshot > 0.01 && (
        <g transform={`translate(700,${600 + (1 - snapshot) * -160}) rotate(${6 + Math.sin(f / 12) * 2})`} opacity={snapshot}>
          <rect x={0} y={0} width={150} height={120} fill="#F2EEE6" stroke={C.ink} strokeWidth={4} />
          <rect x={10} y={10} width={130} height={86} fill="#122A2E" />
          <rect x={30} y={30} width={60} height={36} fill="#1E4A50" stroke="#0A1A1C" strokeWidth={2} />
          <path d="M 96 70 Q 110 56 122 64" stroke="#C99A78" strokeWidth={6} fill="none" opacity={0.6} />
          <PushPin x={75} y={8} drop={snapshot} />
        </g>
      )}
      {/* the letters and their fog */}
      {letters > 0.01 && (
        <g transform={`translate(${120 + (1 - letters) * -300},600) rotate(-6)`}>
          {[0, 1, 2].map((i) => <rect key={i} x={i * 8} y={-i * 8} width={180} height={130} fill={C.paper} stroke={C.ink} strokeWidth={4} />)}
          <path d="M 30 40 L 150 40 M 30 66 L 130 66 M 30 92 L 140 92" stroke={C.ink} strokeWidth={3} opacity={0.5} transform="translate(16,-16)" />
          <PushPin x={100} y={-6} />
        </g>
      )}
      {fog > 0.01 && Array.from({length: 7}, (_, i) => (
        <ellipse key={i} cx={100 + i * 120 + Math.sin(f / 30 + i) * 30 - (1 - fog) * 400} cy={640 + Math.sin(f / 40 + i * 2) * 30} rx={160} ry={90} fill="#D8D4CC" opacity={0.55 * fog} />
      ))}
      {/* the second tarp, still waiting at the bottom right */}
      <Tarp f={f} x={700} y={830} w={200} h={110} tag="NEW" seed={3} bump={tarpBump} lift={tarpLift} />
      {/* the cyan string to the router and the final tag */}
      {cyan > 0.01 && <BoardString f={f} x1={cxp} y1={cyp - 70} x2={1100} y2={900} slack={0} draw={cyan} color={GS.cyan} width={6} glow twang={clamp01(1.4 - cyan)} />}
      {finalTag > 0.01 && (
        <g transform={`translate(${cxp + 120},${cyp - 140}) rotate(${Math.sin(f / 14) * 8})`} opacity={finalTag}>
          <path d="M -120 70 L 0 0" stroke={C.ink} strokeWidth={3} />
          <rect x={-10} y={-26} width={220} height={60} rx={6} fill={C.paper} stroke={GS.cyan} strokeWidth={4} />
          <text x={100} y={-2} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>WHY IT FAILED</text>
          <text x={100} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink} opacity={0.75}>NOT YET FINAL</text>
        </g>
      )}
    </CorkBoard>
  );
};

const S6: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b12 = p.b(12), b13 = p.b(13), b14 = p.b(14), b15 = p.b(15);
  const pinned = ease(f, b12, 14);
  const q1 = ease(f, b13 + 4, 10), q2 = ease(f, b14 + 22, 10);
  const walk = clamp01((f - b14 + 10) / 24);
  const coil = ease(f, b15, 14);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={980} overlay={
      <g>
        <Plate text="THE QUESTION · IS IT THE AI?" x={540} y={560} size={36} p={win(f, b12 + 8, b13)} /> {/* plate-overlap-ok */}
        <Plate text={'"NOT BASED ON OR A RESULT OF THE SMART SYSTEM" · PER ASI'} displayLines={['"NOT BASED ON OR A RESULT', 'OF THE SMART SYSTEM" · PER ASI']} x={540} y={600} size={30} p={win(f, b13 + 6, b14)} /> {/* plate-overlap-ok */}
        <Plate text={'"COMPLETELY DISCONNECTED" · DUFFY'} x={540} y={560} size={34} p={win(f, b14 + 8, b15)} /> {/* plate-overlap-ok */}
        <Plate text={'"1980S LITTLE COPPER LINES" · DUFFY SAID'} x={540} y={560} size={32} tone="dark" p={win(f, b15 + 8)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={6} win={{x: 760, y: 120, w: 280, h: 240}} />
        <HeldTravel f={f} x={BOARD.x} y={BOARD.y} w={BOARD.w} h={BOARD.h} mode="shadow" seed={8}>
          <InvestigationBoard f={f} pinned={pinned} quote1={q1} quote2={q2} coilIn={coil} fold={0.2 + 0.2 * Math.sin(f / 30)} cues={[b12, b13, b14, b15]} emotion={f < b14 ? 'scared' : 'worried'} />
        </HeldTravel>
        {/* the Duffy figure walks in from the right and pins the second plate */}
        <Suit f={f} x={lerp(1180, 900, walk)} y={1420} s={1.0} seed={9} cues={[b14, b15]} tag="SEC. SEAN DUFFY" reach={ease(f, b14 + 16, 10) * (1 - ease(f, b15, 20))} facing={-1} walk={walk < 1 ? f : 0} />
        {/* the copper coil drops beside the board onto a CLAIM card, never on the board */}
        <g transform={`translate(0,${(1 - coil) * -500})`}>
          <g transform="translate(200,1400)">
            <rect x={-110} y={-20} width={220} height={40} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
            <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>CLAIM</text>
          </g>
          <CopperCoil f={f} x={200} y={1380} scale={0.9} slide={clamp01((f - b15 - 14) / 30)} />
        </g>
        <DeskEdge f={f} seed={6} y={1520} />
      </SVG>
    </Frame>
  );
};

// ---- SH7 the glass that never lands (L7-L8) --------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b16 = p.b(16), b17 = p.b(17), b18 = p.b(18);
  const glass = ease(f, b16, 20);
  const tags = ease(f, b17, 14);
  const snap = ease(f, b18, 16);
  const cam = track([{t: 0, z: 1.45, fx: 540, fy: 960}, {t: b17, z: 1.32, fx: 540, fy: 940}, {t: b18 + 10, z: 1.25, fx: 640, fy: 1000}, {t: p.dur, z: 1.22, fx: 620, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text={'"CAN\'T RULE OUT ANYTHING AT THIS POINT" · MULLIN'} displayLines={['"CAN\'T RULE OUT ANYTHING', 'AT THIS POINT" · MULLIN']} x={540} y={600} size={32} p={win(f, b16 + 8, b17)} /> {/* plate-overlap-ok */}
        <Plate text="A DENIAL · NOT A FINDING" x={540} y={560} size={38} tone="dark" p={win(f, b17 + 8, b18 + 4)} /> {/* plate-overlap-ok */}
        <Plate text="A DISPATCH DESK NEAR SEATTLE" x={540} y={560} size={34} p={win(f, b18 + 12)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={7} win={{x: 760, y: 120, w: 280, h: 240}} lamp={0.8} />
        <InvestigationBoard f={f} pinned={1} quote1={1} quote2={1} coilIn={1} fold={0.35} sweat={clamp01((f - b16 - 10) / 40)} tags={tags} snapshot={snap} cues={[b16, b17, b18]} emotion="worried" />
        <g opacity={glass}>
          <Magnifier f={f} x={540 + (1 - glass) * 400} y={880} scale={1.1} hover={1} tag="MULLIN" />
        </g>
        <DeskEdge f={f} seed={7} y={1520} />
      </SVG>
    </Frame>
  );
};

// ---- SH8 fog and pie (L9-L10) ----------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b19 = p.b(19), b20 = p.b(20), b21 = p.b(21), b22 = p.b(22);
  const letters = ease(f, b19, 18), fog = easeIO(f, b20 - 6, 30);
  const hand = easeIO(f, b21, 30) * (1 - 0.25 * ease(f, b22, 12));
  return (
    <Frame p={p} z0={0.98} z1={1.05} ox={560} oy={940} overlay={
      <g>
        <Plate text="OCT · MORE THAN 2 DOZEN LAWMAKERS ASKED FOR A PAUSE" displayLines={['OCT · MORE THAN 2 DOZEN LAWMAKERS', 'ASKED FOR A PAUSE']} x={540} y={600} size={30} p={win(f, b19 + 8, b20)} /> {/* plate-overlap-ok */}
        <Plate text={'"EGREGIOUS LACK OF TRANSPARENCY"'} x={540} y={560} size={34} tone="dark" p={win(f, b20 + 6, b21)} /> {/* plate-overlap-ok */}
        <Plate text="FAA SEEKS A STAKE IN ASI" x={540} y={560} size={38} p={win(f, b21 + 8, b22)} /> {/* plate-overlap-ok */}
        <Plate text="NO DEAL CONFIRMED" x={540} y={560} size={40} tone="dark" p={win(f, b22 + 6)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={8} win={{x: 690, y: 110, w: 360, h: 280}} />
        {/* the windowsill in front of the window, with the uncut pie */}
        <rect data-band="ok" x={670} y={400} width={400} height={26} fill="#6B4A32" stroke={C.ink} strokeWidth={4} />
        <HeldProp f={f} px={860} py={398} w={220} h={120} seed={12} kind="rest">
          <Pie f={f} x={860} y={398} scale={0.85} tag="ASI" />
        </HeldProp>
        <g transform="translate(-40,40) scale(0.96)">
          <InvestigationBoard f={f} pinned={1} quote1={1} quote2={1} coilIn={1} fold={0.3} tags={1} snapshot={1} letters={letters} fog={fog} cues={[b19, b21]} emotion="worried" />
        </g>
        {/* a faceless FAA hand slides in through the window and stops short of the pie */}
        <Hand f={f} x0={1240} y0={250} x1={lerp(1240, 940, hand)} y1={lerp(250, 330, hand)} t={hand} tag="FAA" />
        <DeskEdge f={f} seed={8} y={1520} />
      </SVG>
    </Frame>
  );
};

// ---- SH9 the gallery (L11) -------------------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b23 = p.b(23);
  const lean = ease(f, b23, 24);
  const twitch = clamp01(Math.sin(Math.max(0, f - b23 - 20) / 6) * 0.8 + 0.2) * (f > b23 + 20 ? 1 : 0);
  const cam = track([{t: 0, z: 1.12, fx: 540, fy: 1120}, {t: p.dur, z: 1.04, fx: 540, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="NO OFFICIAL HAS LINKED SMART TO THE OUTAGE" displayLines={['NO OFFICIAL HAS LINKED', 'SMART TO THE OUTAGE']} x={540} y={600} size={36} p={win(f, b23 + 8)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={9} win={{x: 80, y: 130, w: 300, h: 240}} />
        {/* the board seen from low, its second tarp twitching */}
        <g transform="translate(260,-120) scale(0.7)">
          <InvestigationBoard f={f} pinned={1} quote1={1} quote2={1} coilIn={1} fold={0.3} tags={1} snapshot={1} letters={1} fog={0.3} tarpBump={twitch} cues={[b23]} emotion="worried" />
        </g>
        {/* the gallery bench */}
        <g data-band="ok">
          <rect x={-100} y={1200} width={1280} height={40} rx={8} fill="#7A5236" stroke={C.ink} strokeWidth={5} />
          <rect x={-100} y={1236} width={1280} height={20} fill="#5A3A24" stroke={C.ink} strokeWidth={4} />
          {[60, 520, 980].map((x) => <rect key={x} x={x - 16} y={1250} width={32} height={260} fill="#5A3A24" stroke={C.ink} strokeWidth={4} />)}
        </g>
        <IdleFigure f={f} x={260} footY={1200} h={300} seed={21} cues={[b23]}>
          <g transform={`rotate(${lean * 8} 260 1200)`}><Moose f={f} x={260} y={1200} scale={0.95} facing={1} emotion="wary" alert={lean} /></g>
        </IdleFigure>
        <g transform={`rotate(${lean * 12} 560 1200)`}><Raven f={f} x={560} y={1200} scale={1.1} facing={1} mode="perch" /></g>
        <g transform={`rotate(${lean * 10} 800 1200)`}><BaldEagle f={f} x={800} y={1200} scale={1.0} facing={-1} /></g>
        <rect data-band="ok" x={-100} y={1500} width={1280} height={500} fill="#4A3222" />
        {Array.from({length: 5}, (_, i) => <path key={i} data-band="ok" d={`M -300 ${1540 + i * 60} q 500 ${-10 + h01(i, 9) * 20} 1000 0 t 1000 0`} stroke="#3A2618" strokeWidth={3} fill="none" opacity={0.6} />)}
      </SVG>
    </Frame>
  );
};

// ---- SH10 the other new thing (L12) ----------------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b24 = p.b(24), b25 = p.b(25), b26 = p.b(26);
  const yank = easeIO(f, b24, 16);
  const grow = easeIO(f, b24 + 10, 26);
  const slide = ease(f, b25, 18);
  const str = easeIO(f, b26, 14);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={980} bg={C.pine} overlay={
      <g>
        <Plate text="PER CBS · CITING THE FAA AND L3HARRIS" x={540} y={560} size={34} p={win(f, b24 + 12)} />
        <Plate text="A NEW ROUTER · EL DORADO, ARKANSAS" x={540} y={650} size={36} tone="cyan" p={win(f, b25 + 8, b26 + 4)} /> {/* plate-overlap-ok */}
        <Plate text="WHERE THE TRACE POINTS" x={540} y={650} size={38} tone="cyan" p={win(f, b26 + 12)} />
      </g>
    }>
      <SVG>
        <Vault f={f} seed={10} />
        {/* the photo on the board grows into the vault: a paper frame shrinks away as the vault takes over */}
        <g opacity={1 - grow}>
          <Office f={f} seed={10} win={{x: 760, y: 120, w: 280, h: 240}} jet={false} />
          <g transform={`translate(${540 - 540 * (1 + grow * 2)},${960 - 960 * (1 + grow * 2)}) scale(${1 + grow * 2})`}>
            <InvestigationBoard f={f} pinned={1} quote1={1} quote2={1} coilIn={1} fold={0.3} tags={1} snapshot={1} letters={1} fog={0.2} tarpLift={yank} emotion="worried" cues={[b24]} />
          </g>
        </g>
        <g opacity={grow}>
          <g transform={`translate(${lerp(-260, 0, slide)},0)`}>
            <HeldTravel f={f} x={290} y={980} w={500} h={240} mode="sweep" seed={11}>
              <Router f={f} x={540} y={1180} scale={1.5} leds={0.3 + 0.6 * str} peanuts fragile glow={str} />
            </HeldTravel>
          </g>
          <rect x={250} y={1180} width={580} height={30} fill="#3A3A40" stroke={C.ink} strokeWidth={4} />
          <BoardString f={f} x1={540} y1={-40} x2={540} y2={1000} slack={0} draw={str} color={GS.cyan} width={7} glow twang={clamp01(1.6 - str)} />
          <Lab text="EL DORADO, ARKANSAS" x={540} y={1260} size={22} fill="#0E3A40" ink="#FFF6E3" />
        </g>
        <NearSpools f={f} seed={10} />
      </SVG>
    </Frame>
  );
};

// ---- SH11 one thousand knocks (L13-L14) ------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b27 = p.b(27), b28 = p.b(28), b29 = p.b(29), b30 = p.b(30);
  const splice = easeIO(f, b27, 30);
  const pour = clamp01((f - b28) / 20);
  // the counting hold: 0 to 1,000 over one 4.5 second (135 frame) sweep that ends on b30
  const holdStart = b30 - 135;
  const count = Math.round(1000 * clamp01((f - holdStart) / 135));
  const sweepT = clamp01((f - holdStart) / 135);
  const jam = ease(f, b30, 10);
  const pulses = Array.from({length: 26}, (_, i) => i);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={960} bg={C.pineD} overlay={
      <g>
        <Plate text="COPPER TO FIBER UPGRADE · DUFFY SAID" x={540} y={560} size={34} p={win(f, b27 + 8, b28)} /> {/* plate-overlap-ok */}
        <Plate text="PER THE FAA" x={540} y={560} size={38} tone="cyan" p={win(f, b28 + 6, b29)} /> {/* plate-overlap-ok */}
        <Plate text="1,000 TRIES EVERY 4 TO 5 SECONDS" x={540} y={560} size={38} tone="cyan" p={win(f, b29 + 6, b30)} /> {/* plate-overlap-ok */}
        <Plate text={'"OVERWHELMING THE OLDER SYSTEM" · MULLIN SAID'} displayLines={['"OVERWHELMING THE OLDER SYSTEM"', 'MULLIN SAID']} x={540} y={600} size={32} p={win(f, b30 + 6)} />
      </g>
    }>
      <SVG>
        <Vault f={f} seed={11} />
        {/* cross-section: copper spliced into fiber on the left */}
        <g>
          <path d="M -100 760 L 200 760" stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
          <path d="M -100 760 L 200 760" stroke={GS.copper} strokeWidth={20} strokeLinecap="round" />
          <path d={`M 200 760 L ${200 + splice * 120} 760`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
          <path d={`M 200 760 L ${200 + splice * 120} 760`} stroke={GS.cyan} strokeWidth={12} strokeLinecap="round" />
          {splice > 0.2 && splice < 0.95 && Array.from({length: 5}, (_, i) => <path key={i} d={`M 204 760 l ${Math.cos(i * 1.3 + f) * 30} ${Math.sin(i * 1.3 + f) * 30}`} stroke="#FFE7A8" strokeWidth={4} />)}
          <Hand f={f} x0={-120} y0={980} x1={180} y1={800} t={easeIO(f, b27 - 10, 16) * (1 - easeIO(f, b28, 20))} sleeve="#2E4A3A" />
          <path d="M 320 760 Q 360 760 380 900" stroke={C.ink} strokeWidth={22} fill="none" />
          <path d="M 320 760 Q 360 760 380 900" stroke={GS.cyan} strokeWidth={12} fill="none" />
        </g>
        {/* the router at the centre, strobing */}
        <HeldTravel f={f} x={300} y={880} w={480} h={220} mode="sweep" seed={12}>
          <Router f={f} x={540} y={1080} scale={1.3} leds={0.5 + 0.5 * pour} peanuts={pour < 0.6} fragile glow={pour} />
        </HeldTravel>
        {/* the cable to the older system's single intake slot on the right */}
        <path d="M 740 1020 Q 860 1020 900 900" stroke={C.ink} strokeWidth={26} fill="none" />
        <path d="M 740 1020 Q 860 1020 900 900" stroke="#2A3A40" strokeWidth={16} fill="none" />
        <g transform="translate(900,820)">
          <rect x={-90} y={-160} width={180} height={240} rx={8} fill="#5A5048" stroke={C.ink} strokeWidth={5} />
          <rect x={-70} y={-140} width={140} height={60} fill="#3A3430" stroke={C.ink} strokeWidth={3} />
          <text x={0} y={-104} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill="#E8DCC2">OLDER SYSTEM</text>
          <rect x={-30} y={50} width={60} height={14} rx={3} fill="#14181C" stroke={C.ink} strokeWidth={3} />
          <g transform={`translate(0,${-20}) scale(${1 + jam * 0.08 + settle(f, b30, 0.05, 30)},${1 - jam * 0.04})`}>
            <rect x={-60} y={-60} width={120} height={110} rx={4} fill="#6E6258" stroke={C.ink} strokeWidth={4} />
            <circle cx={40} cy={0} r={6} fill="#C9A04A" stroke={C.ink} strokeWidth={2} />
          </g>
        </g>
        {/* the flood of cyan pulses down the cable, piling at the slot */}
        {pulses.map((i) => {
          const t = ((f * (0.02 + pour * 0.05) + i / pulses.length) % 1);
          const x = lerp(740, 900, t), y = lerp(1020, 880, t * t);
          return <circle key={i} cx={x} cy={y} r={9} fill={GS.cyan} stroke="#E8FFFF" strokeWidth={2} opacity={pour} />;
        })}
        {Array.from({length: Math.round(18 * jam + 6 * pour)}, (_, i) => (
          <circle key={`j${i}`} cx={870 + (i % 6) * 12 + Math.sin(f / 4 + i) * 2} cy={880 - Math.floor(i / 6) * 12} r={8} fill={GS.cyan} stroke="#E8FFFF" strokeWidth={2} />
        ))}
        {/* the counter and its stopwatch: one full sweep while it climbs to 1,000 */}
        <g transform="translate(300,1260)">
          <rect x={-170} y={-60} width={340} height={110} rx={10} fill="#082F35" stroke={GS.cyan} strokeWidth={5} />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={68} fill="#BFFBFF">{count.toLocaleString('en-US')}</text>
        </g>
        <Stopwatch f={f} x={780} y={1270} r={70} sweep={sweepT} accent={GS.cyan} />
        <NearSpools f={f} seed={11} />
      </SVG>
    </Frame>
  );
};

// ---- SH12 not yet final (L15-L16) ------------------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b31 = p.b(31), b32 = p.b(32), b33 = p.b(33);
  const off = easeIO(f, b31 + 6, 40);
  const slack = lerp(0.08, 0.9, easeIO(f, b32, 30));
  const tag = ease(f, b33, 16);
  const cam = track([{t: 0, z: 1.28, fx: 540, fy: 960}, {t: b32, z: 1.12, fx: 540, fy: 960}, {t: p.dur, z: 1.18, fx: 600, fy: 900}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="COPPER GOT BLAMED" x={540} y={560} size={40} p={win(f, b31 + 8, b32)} /> {/* plate-overlap-ok */}
        <Plate text="THE TRACE POINTS AT ITS REPLACEMENT" x={540} y={560} size={34} tone="cyan" p={win(f, b32 + 8, b33)} /> {/* plate-overlap-ok */}
        <Plate text="WHY IT FAILED · NOT YET FINAL" x={540} y={560} size={38} p={win(f, b33 + 10)} />
      </g>
    }>
      <SVG>
        <Office f={f} seed={12} win={{x: 760, y: 120, w: 280, h: 240}} />
        <InvestigationBoard f={f} pinned={1} quote1={1} quote2={1} coilIn={1} fold={lerp(0.3, 0.05, off)} tags={1} snapshot={1} letters={1} fog={0} slack={slack} cyan={1} finalTag={tag} tarpLift={1} cues={[b31, b32, b33]} emotion={f < b33 ? 'worried' : 'hopeful'} />
        {/* the copper coil beside the board: its DUFFY SAID tag flutters off */}
        <g transform="translate(200,1400)">
          <rect x={-110} y={-20} width={220} height={40} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>CLAIM</text>
        </g>
        <CopperCoil f={f} x={200} y={1380} scale={0.9} slide={1} off={off} />
        {/* the router photo the cyan string runs to, pinned at the right edge */}
        <g transform="translate(860,1180) rotate(6)">
          <rect x={-90} y={-70} width={180} height={140} fill="#F2EEE6" stroke={C.ink} strokeWidth={4} />
          <rect x={-78} y={-58} width={156} height={100} fill={C.pine} />
          <Router f={f} x={0} y={30} scale={0.4} leds={0.6} peanuts={false} fragile={false} glow={0.5} />
        </g>
        <DeskEdge f={f} seed={12} y={1520} />
      </SVG>
    </Frame>
  );
};

// ---- SH13 sixty nine of 3,648 (L17) ----------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b34 = p.b(34), b35 = p.b(35);
  const pull = easeIO(f, b34, 60);
  const litT = clamp01((f - b35 + 6) / 40);
  const z = lerp(5.5, 1.0, pull);
  const cam = (fr: number): Cam => ({z: lerp(5.5, 1.0, easeIO(fr, b34, 60)), fx: 540, fy: 1000});
  return (
    <Frame p={p} cam={cam} bg={C.pineD} overlay={
      <g>
        <Plate text="3,648 ROUTERS · PER THE CONTRACTOR VIA SENATE COMMERCE DEMOCRATS" displayLines={['3,648 ROUTERS · PER THE CONTRACTOR', 'VIA SENATE COMMERCE DEMOCRATS']} x={540} y={600} size={30} p={win(f, b34 + 20, b35)} /> {/* plate-overlap-ok */}
        <Plate text="400 INSTALLED · 69 RUNNING" x={540} y={560} size={40} tone="cyan" p={win(f, b35 + 8)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill={C.pineD} />
        <ellipse data-band="ok" cx={540} cy={1000} rx={700} ry={600} fill={C.pine} opacity={0.6} />
        {/* 3,648 = 76 x 48 outlines */}
        <RouterField f={f} x={46} y={700} cols={76} rows={48} cell={13} installed={400} lit={69} litT={litT} />
        <rect data-band="ok" x={40} y={694} width={1000} height={634} fill="none" stroke="#2C4448" strokeWidth={3} />
        {z > 2 && <circle cx={540} cy={1000} r={8} fill={GS.cyan} />}
        <g data-band="ok">
          <rect x={-100} y={1520} width={1280} height={500} fill="#041C20" />
          {Array.from({length: 12}, (_, i) => <rect key={i} x={i * 96} y={1560 + (i % 3) * 30} width={70} height={30} rx={3} fill="#0A2A2E" stroke="#1E4448" strokeWidth={2} />)}
        </g>
      </SVG>
    </Frame>
  );
};

// ---- SH14 the dispatcher decides (L18-L20) ---------------------------------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b36 = p.b(36), b37 = p.b(37), b38 = p.b(38), b39 = p.b(39);
  const lights = ease(f, b36, 16);
  const fan = easeIO(f, b37, 24);
  const hand = easeIO(f, b38 - 14, 18);
  const tap = clamp01((f - b38) / 10);
  const gauge = easeIO(f, b39, 40);
  const routes = ['M 260 860 Q 420 700 820 760', 'M 260 860 Q 480 800 820 760', 'M 260 860 Q 520 960 820 760'];
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={960} bg="#122A2E" warmth={0.05} overlay={
      <g>
        <Plate text="ALASKA AIRLINES · FLYWAYS · SINCE 2021" x={540} y={560} size={34} p={win(f, b36 + 8, b37)} /> {/* plate-overlap-ok */}
        <Plate text="IT SUGGESTS BETTER ROUTES" x={540} y={560} size={38} p={win(f, b37 + 8, b38)} /> {/* plate-overlap-ok */}
        <Plate text="THE DISPATCHER DECIDES · PER ALASKA'S OPS CHIEF VIA NPR" displayLines={['THE DISPATCHER DECIDES', "PER ALASKA'S OPS CHIEF VIA NPR"]} x={540} y={600} size={32} tone="dark" p={win(f, b38 + 6, b39)} /> {/* plate-overlap-ok */}
        <Plate text="ABOUT 1 MILLION GALLONS A YEAR · PER ALASKA AIRLINES" displayLines={['ABOUT 1 MILLION GALLONS A YEAR', 'PER ALASKA AIRLINES']} x={540} y={600} size={32} p={win(f, b39 + 8)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#122A2E" />
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#2E5A60" opacity={0.5 * lights} />
        {/* a rain-flecked window near Seattle, a jet's tail lights beyond */}
        <g data-band="ok">
          <rect x={120} y={140} width={840} height={280} rx={6} fill="#1E3A40" stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 18}, (_, i) => <path key={i} d={`M ${140 + h01(i, 3) * 800} ${150 + ((f * 3 + i * 40) % 260)} l -4 22`} stroke="#9FC3CC" strokeWidth={2} opacity={0.5} />)}
          <path d="M 120 380 L 960 360" stroke="#0A2024" strokeWidth={30} />
          <circle cx={700} cy={330} r={6} fill={GS.persimmon} opacity={0.5 + 0.5 * Math.sin(f / 8)} />
        </g>
        {/* the desk and its screen */}
        <rect data-band="ok" x={-100} y={1180} width={1280} height={400} fill={C.desk} stroke={C.ink} strokeWidth={4} />
        <rect data-band="ok" x={-100} y={1180} width={1280} height={20} fill={C.deskL} />
        <g>
          <rect x={150} y={560} width={780} height={560} rx={14} fill="#0A1A1C" stroke={C.ink} strokeWidth={8} />
          <rect x={174} y={584} width={732} height={512} rx={6} fill="#0E3A40" opacity={0.4 + 0.6 * lights} />
          <path d="M 500 1120 L 470 1180 L 610 1180 L 580 1120 Z" fill="#3A3A40" stroke={C.ink} strokeWidth={4} />
          {/* a map fragment on the screen: Alaska at top left, Seattle at bottom right */}
          <g opacity={lights} transform="translate(190,600) scale(0.24)"><path d={AK_PATH} fill="#2E5A60" stroke="#9FC3CC" strokeWidth={8} /></g>
          <circle cx={260} cy={860} r={10} fill={GS.persimmon} stroke={C.ink} strokeWidth={3} opacity={lights} />
          <circle cx={820} cy={760} r={10} fill={C.paper} stroke={C.ink} strokeWidth={3} opacity={lights} />
          {routes.map((d, i) => (
            <path key={i} d={d} stroke={i === 1 && tap > 0.5 ? '#FFF1D2' : GS.card} strokeWidth={i === 1 && tap > 0.5 ? 8 : 5} fill="none" strokeDasharray="14 10"
              pathLength={1} style={{strokeDasharray: `${clamp01(fan * 1.2 - i * 0.1)} 1`}} opacity={lights * (tap > 0.5 && i !== 1 ? 0.35 : 1)} />
          ))}
          <HeldTravel f={f} x={180} y={900} w={300} h={200} mode="sweep" seed={14}>
            <SuggestionSlip f={f} x={330} y={1080} scale={0.9} emotion={tap > 0.5 ? 'content' : 'eager'} nod={clamp01((f - b38 - 4) / 14)} tag="FLYWAYS" cues={[b36, b37, b38]} seed={11} />
          </HeldTravel>
        </g>
        {/* the dispatcher's faceless hand comes in from the bottom right and taps the second route */}
        <Hand f={f} x0={1200} y0={1500} x1={lerp(1200, 560, hand)} y1={lerp(1500, 850, hand)} t={hand} tap={tap} sleeve="#2E4A3A" tag="DISPATCHER" />
        {/* the fuel gauge on the desk */}
        <g transform="translate(860,1350)">
          <ContactShadow cx={0} cy={60} rx={90} ry={10} opacity={0.4} />
          <circle cx={0} cy={0} r={70} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <path d="M -50 30 A 58 58 0 1 1 50 30" stroke={C.ink} strokeWidth={4} fill="none" />
          <path d={`M 0 0 L ${Math.cos(Math.PI * (0.8 + gauge * 1.4)) * 50} ${Math.sin(Math.PI * (0.8 + gauge * 1.4)) * 50}`} stroke={GS.persimmon} strokeWidth={7} strokeLinecap="round" />
          <circle cx={0} cy={0} r={7} fill={C.ink} />
          <text x={0} y={46} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.ink}>FUEL</text>
        </g>
        <g data-band="ok">
          <rect x={-100} y={1520} width={1280} height={500} fill="#4A3222" />
          <rect x={120} y={1560} width={420} height={60} rx={8} fill="#2A2A30" stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 12}, (_, i) => <rect key={i} x={132 + i * 34} y={1572} width={26} height={16} rx={3} fill="#4A4A52" />)}
        </g>
      </SVG>
    </Frame>
  );
};

// ---- SH15 back to the apron (L21) ------------------------------------------------------------------------------------------------------------------
const S15: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b40 = p.b(40), b41 = p.b(41);
  const out = easeIO(f, b40, 50);
  const bank = (f / 60) % 1;
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
        {/* the terminal's office window, with the board small inside, Slip still pinned */}
        <g transform="translate(860,500)">
          <rect x={-70} y={-60} width={160} height={120} rx={4} fill="#6B4A32" stroke={C.ink} strokeWidth={4} />
          <rect x={-60} y={-50} width={140} height={100} fill={C.wall} />
          <rect x={-50} y={-44} width={120} height={86} fill={GS.cork} stroke={C.ink} strokeWidth={2} />
          <SuggestionSlip f={f} x={10} y={20} scale={0.22} emotion="hopeful" look={-1} cues={[b41]} seed={14} shadow={false} />
          <rect x={22} y={-36} width={40} height={14} fill={C.paper} stroke={GS.cyan} strokeWidth={1.5} />
          <path d="M -60 -50 L 80 -50 L 80 50" stroke="#000" strokeWidth={3} opacity={0.2} fill="none" />
        </g>
        <rect data-band="ok" x={780} y={440} width={4} height={60} fill="#5A5A60" />
        {/* the Cub banking over the Chugach, the jet waiting by its cone */}
        <g transform={`translate(${200 + Math.sin(bank * Math.PI * 2) * 40},${560 + Math.cos(bank * Math.PI * 2) * 20}) rotate(${Math.sin(bank * Math.PI * 2) * 8})`}>
          <BushPlane f={f} x={0} y={0} scale={0.8} mode="fly" propSpeed={1.2} body={GS.persimmon} />
        </g>
        <Airliner f={f} x={790} y={1240} scale={0.82} emotion="glum" look={-1} cues={[b40, b41]} seed={3} />
        <g transform="translate(1010,1236)">
          <ContactShadow cx={0} cy={2} rx={26} ry={6} opacity={0.4} />
          <path d="M -20 0 L -8 -56 L 8 -56 L 20 0 Z" fill={GS.persimmon} stroke={C.ink} strokeWidth={4} />
          <path d="M -13 -28 L 13 -28" stroke="#FFF6E3" strokeWidth={7} />
        </g>
        <rect data-band="ok" x={560} y={860} width={700} height={700} fill={C.pine} opacity={0.12 * out} />
        <NearApron f={f} seed={5} />
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

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
  const starts = [0, 5, 10, 15, 24, 29, 41, 52, 61, 67, 77, 89, 96, 101, 114, 120].map((x) => Math.round(x * 30));
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
