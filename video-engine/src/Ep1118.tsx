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
import {Chalky, ChalkLine, ChalkPuff, TripPinCutaway, PaintCan, ChalkMark, Genset, ChainFence, chalkyHook, CHALK} from './lib/chalkline';
import {Moose} from './lib/fauna';
import {Pickup} from './lib/polecam';
import {IDS} from './Ep1118Ids';

// Clear on Size, 2026-11-18. Palette roles are art_direction.json: a sunless mint afterglow over lilac snow, ultramarine chalk
// ONLY on the line, neutral gray ONLY on the chalk at the fence and the swatch, spring green ONLY on the grid pulse. Chalky is the
// only face. Nothing is drawn inside the Eielson fence but snow and spruce.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;

export const C = {
  sky0: '#3E6E78', sky1: '#7DB7AE', sky2: '#BFE3D2', snow: '#EEEAF4', shade: '#B9A9C9', shadeD: '#8E7FA6', fog: '#E4E2EA',
  spruce: '#22433A', spruceL: '#4C6E5E', range: '#5E7F86', rangeD: '#3F5F68', sage: '#A9BE9A', sageD: '#7E9672', sheet: '#F4EBDD',
  river: '#E6E3EA', umber: '#6B4A36', green: '#3FCB73', window: '#FFE9B0', copper: '#B8743A', paper: '#FFF6E3', ink: '#1B1A22',
  line: CHALK.line, gray: CHALK.gray, wood: '#7A5A3C', maroon: '#7A2E3A',
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

type Tone = 'plate' | 'dark' | 'chalk';
const TONES: Record<Tone, {fill: string; fg: string; edge: string; dash?: string}> = {
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  dark: {fill: '#21353A', fg: '#FFF6E3', edge: '#FFF6E3'},
  chalk: {fill: C.paper, fg: C.ink, edge: C.ink, dash: '14 9'},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. 'chalk' tone has a dashed border (recommended). */
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
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={t.edge} strokeWidth={4} strokeDasharray={t.dash} />
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
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.22, ox = 540, oy = 960, overlay, bg = C.sky1, warmth = 0.02, children}) => {
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
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#21353A" stroke="#FFF6E3" strokeWidth={2.4} opacity={0.92} />
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

// ---- the shared world: a sunless Fairbanks afterglow over the Tanana valley ---------------------------------------------------------------------------
/** sky painted from above the frame edge, the Alaska Range under the mint glow, drifting wisps; no sun disc */
const Sky: React.FC<{f: number; horizon: number; seed?: number; fogHaze?: number}> = ({f, horizon, seed = 0, fogHaze = 0}) => {
  const gid = `sky${horizon}${seed}`;
  const ridge = (amp: number, sd: number, dx: number, base: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 16; i++) {
      const x = -140 + i * 90 + dx;
      const y = base - amp * (0.35 + 0.65 * h01(i, sd)) * ((i + sd) % 3 === 0 ? 0.55 : 1);
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
      </defs>
      <rect x={-300} y={-80} width={1680} height={horizon + 140} fill={`url(#${gid})`} />
      {/* high thin wisps in two planes */}
      {[0, 1].map((plane) => Array.from({length: 4}).map((_, i) => {
        const sp = plane ? 0.5 : 0.22;
        const cx = ((h01(i, plane + 5 + seed * 3) * 1500 + f * sp) % 1500) - 210;
        const cy = 120 + plane * 170 + h01(i, 8 + seed) * 130;
        const wv = 170 + h01(i, 9 + seed) * 200;
        return (
          <path key={`${plane}-${i}`} d={`M ${cx} ${cy} q ${wv * 0.25} -26 ${wv * 0.5} -8 q ${wv * 0.25} -22 ${wv * 0.5} 6 Z`}
            fill={plane ? '#E6F3EE' : '#CFE7E0'} stroke={C.ink} strokeWidth={2.5} opacity={plane ? 0.9 : 0.6} />
        );
      }))}
      {/* the Alaska Range, two parallax ridges, snow caps lit mint from behind */}
      <path d={ridge(230, 3 + seed * 7, drift * 0.4, horizon - 20)} fill={C.range} stroke={C.ink} strokeWidth={3} />
      {Array.from({length: 8}).map((_, k) => {
        const i = k * 2;
        const x = -140 + i * 90 + drift * 0.4;
        const y = horizon - 20 - 230 * (0.35 + 0.65 * h01(i, 3 + seed * 7)) * ((i + 3 + seed * 7) % 3 === 0 ? 0.55 : 1);
        return <path key={k} d={`M ${x - 30} ${y + 36} L ${x} ${y} L ${x + 30} ${y + 36} L ${x + 14} ${y + 28} L ${x} ${y + 40} L ${x - 12} ${y + 27} Z`} fill="#F4FBF8" stroke={C.ink} strokeWidth={2} />;
      })}
      <path d={ridge(110, 11 + seed * 5, drift, horizon)} fill={C.rangeD} stroke={C.ink} strokeWidth={3} />
      {fogHaze > 0 && <rect x={-300} y={horizon - 260} width={1680} height={300} fill={C.fog} opacity={fogHaze * 0.6} />}
    </g>
  );
};

/** one black spruce with snow loads */
const Spruce: React.FC<{x: number; y: number; s?: number; f: number; seed?: number}> = ({x, y, s = 1, f, seed = 0}) => {
  const sway = Math.sin(f / 31 + seed) * 1.6;
  const tiers = 6;
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${sway})`}>
      <ContactShadow cx={0} cy={2} rx={34} ry={6} opacity={0.3} />
      <rect x={-4} y={-30} width={8} height={30} fill="#3A2A20" stroke={C.ink} strokeWidth={2} />
      {Array.from({length: tiers}).map((_, i) => {
        const w = 44 - i * 6;
        const yy = -24 - i * 30;
        return (
          <g key={i}>
            <path d={`M ${-w} ${yy} L 0 ${yy - 46} L ${w} ${yy} Z`} fill={C.spruce} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M ${-w * 0.2} ${yy - 30} L 0 ${yy - 46} L ${w * 0.55} ${yy - 12}`} fill="none" stroke={C.spruceL} strokeWidth={4} opacity={0.8} />
            <path d={`M ${-w + 6} ${yy - 2} Q ${-w * 0.3} ${yy - 12} ${w * 0.2} ${yy - 4}`} stroke="#F7F5FB" strokeWidth={6} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

/** spruce ranks on a band, getting bigger toward the viewer */
const SpruceRank: React.FC<{f: number; y: number; n: number; s: number; seed?: number; x0?: number; x1?: number}> = ({f, y, n, s, seed = 0, x0 = -40, x1 = 1120}) => (
  <g data-band="ok">
    {Array.from({length: n}).map((_, i) => (
      <Spruce key={i} x={x0 + ((i + 0.5) / n) * (x1 - x0) + (h01(i, seed) - 0.5) * 40} y={y + h01(i, seed + 3) * 14} s={s * (0.8 + h01(i, seed + 5) * 0.4)} f={f} seed={i + seed} />
    ))}
  </g>
);

/** snow ground from the horizon down: lilac bands, mauve skylight shade under drifts */
const Snow: React.FC<{horizon: number; seed?: number}> = ({horizon, seed = 0}) => (
  <g data-band="ok">
    <rect x={-300} y={horizon} width={1680} height={2000} fill={C.snow} />
    <rect x={-300} y={horizon} width={1680} height={40} fill="#E2DDEC" />
    {Array.from({length: 9}).map((_, r) => {
      const yy = horizon + 60 + r * r * 18 + r * 30;
      return <path key={r} d={`M -100 ${yy} Q ${300 + h01(r, seed) * 200} ${yy - 22 - r * 2} 600 ${yy - 4} T 1300 ${yy - 8}`} stroke={C.shade} strokeWidth={4 + r} fill="none" opacity={0.45} />;
    })}
    <line x1={-300} x2={1380} y1={horizon} y2={horizon} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** the near plane under the caption bar: drifts, spruce trunks, plug-in posts */
const Near: React.FC<{f: number; seed?: number; posts?: boolean; y?: number}> = ({f, seed = 0, posts = true, y = 1500}) => (
  <g data-band="ok">
    {Array.from({length: 5}).map((_, i) => (
      <path key={i} d={`M ${-80 + i * 270} ${y + 140 + h01(i, seed) * 160} q 120 -60 260 -10 q 50 20 110 0 L ${-80 + i * 270 + 380} 2000 L ${-80 + i * 270} 2000 Z`}
        fill="#F6F3FA" stroke={C.ink} strokeWidth={3} />
    ))}
    {Array.from({length: 5}).map((_, i) => (
      <path key={`s${i}`} d={`M ${-40 + i * 270} ${y + 200 + h01(i, seed + 1) * 140} q 120 -40 240 -6`} stroke={C.shade} strokeWidth={8} fill="none" opacity={0.6} />
    ))}
    {[0, 1].map((i) => {
      const x = i ? 1010 - h01(seed, 4) * 40 : 60 + h01(seed, 5) * 40;
      return (
        <g key={`t${i}`}>
          <rect x={x - 26} y={y + 20} width={52} height={500} fill="#3A2A20" stroke={C.ink} strokeWidth={4} />
          <rect x={x - 18} y={y + 20} width={10} height={500} fill="#5A4232" opacity={0.7} />
          <path d={`M ${x - 26} ${y + 120} q 26 -20 52 0`} stroke="#F7F5FB" strokeWidth={8} fill="none" />
        </g>
      );
    })}
    {posts && [300, 760].map((x, i) => (
      <g key={`p${i}`} transform={`translate(${x + h01(seed, i) * 30},${y + 230 + i * 30})`}>
        <ContactShadow cx={0} cy={2} rx={30} ry={6} opacity={0.35} />
        <rect x={-10} y={-120} width={20} height={120} fill={C.wood} stroke={C.ink} strokeWidth={3} />
        <rect x={-18} y={-136} width={36} height={26} rx={4} fill="#5A5F66" stroke={C.ink} strokeWidth={3} />
        <circle cx={0} cy={-123} r={5} fill={C.window} opacity={0.6 + 0.3 * Math.sin(f / 9 + i)} />
      </g>
    ))}
  </g>
);

/** a drifting ice-fog bank */
const FogBank: React.FC<{f: number; x: number; y: number; w: number; h: number; op?: number; seed?: number}> = ({f, x, y, w, h, op = 0.85, seed = 0}) => (
  <g data-band="ok" opacity={op}>
    {Array.from({length: 9}).map((_, i) => {
      const cx = x + ((i / 8) * w) + Math.sin(f / (40 + i * 3) + seed + i) * 26;
      const cy = y + h * (0.3 + 0.5 * h01(i, seed)) + Math.sin(f / 50 + i) * 8;
      return <ellipse key={i} cx={cx} cy={cy} rx={w / 5 + h01(i, seed + 1) * 60} ry={h / 3} fill={C.fog} />;
    })}
  </g>
);

/** a faceless parka figure (no face: a dark hood opening with a fur rim), with idle life, lit like the props */
const Parka: React.FC<{f: number; x: number; y: number; s?: number; seed?: number; cues?: number[]; coat?: string; tag?: string; kneel?: number; reach?: number; carry?: boolean; facing?: 1 | -1; walk?: number}> =
({f, x, y, s = 1, seed = 1, cues = [], coat = '#7A4A2E', tag, kneel = 0, reach = 0, carry = false, facing = 1, walk = 0}) => {
  const hgt = 300 * s;
  const step = Math.sin(walk * 0.35) * 14;
  return (
    <FigureFinish x={x} footY={y} w={140 * s} h={hgt} keySide="left" rimColor="#DFF3EA">
      <IdleFigure f={f} x={x} footY={y} h={hgt} seed={seed} cues={cues}>
        {(pose) => (
          <g transform={`translate(${x},${y}) scale(${s * facing},${s})`}>
            <ContactShadow cx={0} cy={2} rx={62} ry={9} opacity={0.38} />
            {/* legs (knee bends when kneeling) */}
            <path d={`M -18 ${-110 + kneel * 40} L ${-22 + step} -6`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
            <path d={`M -18 ${-110 + kneel * 40} L ${-22 + step} -6`} stroke="#3A3440" strokeWidth={14} strokeLinecap="round" />
            <path d={`M 18 ${-110 + kneel * 40} L ${kneel ? 46 : 22 - step} ${kneel ? -40 : -6}`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
            <path d={`M 18 ${-110 + kneel * 40} L ${kneel ? 46 : 22 - step} ${kneel ? -40 : -6}`} stroke="#3A3440" strokeWidth={14} strokeLinecap="round" />
            <ellipse cx={-22 + step} cy={-4} rx={22} ry={10} fill="#2A2026" stroke={C.ink} strokeWidth={3} />
            <ellipse cx={kneel ? 50 : 22 - step} cy={kneel ? -36 : -4} rx={22} ry={10} fill="#2A2026" stroke={C.ink} strokeWidth={3} />
            <g transform={`translate(${pose.shift * 0.4},${kneel * 40 + pose.dip}) rotate(${pose.lean} 0 -110)`}>
              {/* coat */}
              <path d="M -52 -100 Q -60 -200 -30 -232 L 30 -232 Q 60 -200 52 -100 Q 0 -86 -52 -100 Z" fill={coat} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              <path d="M 0 -228 L 0 -98" stroke={C.ink} strokeWidth={3} opacity={0.5} />
              <path d="M -52 -104 Q 0 -92 52 -104" stroke="#EDE6D8" strokeWidth={8} fill="none" />
              {/* arms: right arm reaches */}
              <path d={`M -40 -214 Q ${-66 + pose.armL * 10} -170 ${-54 + pose.armL * 6} -128`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" />
              <path d={`M -40 -214 Q ${-66 + pose.armL * 10} -170 ${-54 + pose.armL * 6} -128`} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
              <path d={`M 40 -214 Q ${70 + reach * 30} ${-180 + reach * 30} ${carry ? 40 : 58 + reach * 60} ${carry ? -140 : -128 + reach * 40 + pose.armR * 6}`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" />
              <path d={`M 40 -214 Q ${70 + reach * 30} ${-180 + reach * 30} ${carry ? 40 : 58 + reach * 60} ${carry ? -140 : -128 + reach * 40 + pose.armR * 6}`} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
              <circle cx={carry ? 40 : 58 + reach * 60} cy={carry ? -140 : -128 + reach * 40 + pose.armR * 6} r={11} fill="#3A3440" stroke={C.ink} strokeWidth={3} />
              {/* hood: faceless dark opening, fur rim */}
              <g transform={`translate(${pose.headX * 0.4},0) rotate(${pose.headRot} 0 -250)`}>
                <ellipse cx={0} cy={-262} rx={42} ry={46} fill={coat} stroke={C.ink} strokeWidth={5} />
                <ellipse cx={6} cy={-258} rx={26} ry={30} fill="#1E1A24" />
                <ellipse cx={6} cy={-258} rx={30} ry={34} fill="none" stroke="#EDE6D8" strokeWidth={8} strokeDasharray="6 4" />
              </g>
            </g>
          </g>
        )}
      </IdleFigure>
      {tag && <Lab text={tag} x={x} y={y - hgt - 40 * s} size={20} />}
    </FigureFinish>
  );
};

/** Earl: a faceless plugged-in pickup that shivers; cord to a post; load 0..1 pulls the cord taut and spikes the shiver */
const Earl: React.FC<{f: number; x: number; y: number; s?: number; load?: number; fog?: number}> = ({f, x, y, s = 0.9, load = 0, fog = 0}) => {
  const shiver = Math.sin(f * 1.9) * (1.2 + load * 1.4);
  const cordSag = 46 * (1 - load * 0.8);
  return (
    <g>
      <g transform={`translate(${shiver},0)`}>
        <Pickup f={f} x={x} y={y} scale={s} body={C.maroon} lamps={false} plate={false} />
      </g>
      <g transform={`translate(${x + 200 * s},${y})`}>
        <ContactShadow cx={0} cy={2} rx={22} ry={5} opacity={0.35} />
        <rect x={-9} y={-110} width={18} height={110} fill={C.wood} stroke={C.ink} strokeWidth={3} />
        <rect x={-16} y={-126} width={32} height={24} rx={4} fill="#5A5F66" stroke={C.ink} strokeWidth={3} />
      </g>
      <path d={`M ${x + 176 * s} ${y - 62 * s} Q ${x + 188 * s} ${y - 62 * s + cordSag} ${x + 200 * s - 14} ${y - 114}`} stroke={C.ink} strokeWidth={6} fill="none" />
      <path d={`M ${x + 176 * s} ${y - 62 * s} Q ${x + 188 * s} ${y - 62 * s + cordSag} ${x + 200 * s - 14} ${y - 114}`} stroke="#E0A040" strokeWidth={3} fill="none" />
      {/* frost breath from the grille */}
      <circle cx={x + 190 * s + ((f / 2) % 40)} cy={y - 50 * s - ((f / 3) % 30)} r={8 + ((f / 2) % 40) / 4} fill="#FFFFFF" opacity={0.5 * (1 - ((f / 2) % 40) / 40)} />
      {fog > 0 && <rect x={x - 220 * s} y={y - 160 * s} width={460 * s} height={190 * s} fill={C.fog} opacity={fog} rx={60} />}
    </g>
  );
};

/** a dashed hypothetical block outline (never a solid building) */
const DashBlock: React.FC<{x: number; y: number; w: number; h: number; stack?: boolean; plug?: boolean; op?: number}> = ({x, y, w, h, stack = false, plug = false, op = 1}) => (
  <g opacity={op}>
    <rect x={x - w / 2} y={y - h} width={w} height={h} rx={6} fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="20 12" />
    {stack && <rect x={x + w / 2 - 50} y={y - h - 70} width={28} height={70} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="12 8" />}
    {plug && (
      <g transform={`translate(${x - w / 2 - 40},${y - h / 2})`}>
        <rect x={-20} y={-14} width={40} height={28} rx={6} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="8 6" />
        <path d="M -8 -14 L -8 -28 M 8 -14 L 8 -28" stroke={C.ink} strokeWidth={4} />
      </g>
    )}
  </g>
);

/** a dashed RECOMMENDED flag on a stick, popping up with overshoot */
const RecFlag: React.FC<{x: number; y: number; pop: number}> = ({x, y, pop}) => {
  const k = clamp01(pop);
  if (k <= 0.01) return null;
  const up = k < 0.7 ? (k / 0.7) * 1.15 : 1.15 - 0.15 * Math.sin(((k - 0.7) / 0.3) * Math.PI / 2);
  const w = monoW('RECOMMENDED', 18) + 20;
  return (
    <g transform={`translate(${x},${y}) scale(1,${up})`}>
      <path d="M 0 0 L 0 -120" stroke={C.ink} strokeWidth={5} />
      <rect x={0} y={-120} width={w} height={34} fill={C.paper} stroke={C.ink} strokeWidth={3} strokeDasharray="10 6" />
      <text x={10} y={-97} fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>RECOMMENDED</text>
    </g>
  );
};

/** an H-frame GVEA pole */
const HPole: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={2} rx={60} ry={8} opacity={0.3} />
    <rect x={-44} y={-360} width={16} height={360} fill={C.wood} stroke={C.ink} strokeWidth={4} />
    <rect x={28} y={-360} width={16} height={360} fill={C.wood} stroke={C.ink} strokeWidth={4} />
    <rect x={-70} y={-340} width={140} height={16} fill={C.wood} stroke={C.ink} strokeWidth={4} />
    <path d="M -36 -300 L 36 -240 M 36 -300 L -36 -240" stroke={C.ink} strokeWidth={4} />
  </g>
);

/** the GVEA wire with a travelling spring-green pulse (power flowing, never a green light) */
const Wire: React.FC<{f: number; x0: number; y0: number; x1: number; y1: number; sag?: number; pulse?: number; at?: number}> = ({f, x0, y0, x1, y1, sag = 50, pulse = 0, at = 0}) => {
  const mx = (x0 + x1) / 2, my = Math.max(y0, y1) + sag;
  const d = `M ${x0} ${y0} Q ${mx} ${my} ${x1} ${y1}`;
  const t = pulse > 0 ? ((f - at) / 45) % 1 : 0;
  const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1;
  const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;
  return (
    <g>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={7} />
      <path d={d} fill="none" stroke="#3A3440" strokeWidth={3} />
      {pulse > 0.02 && f >= at && <circle cx={px} cy={py} r={13} fill={C.green} stroke={C.ink} strokeWidth={3} opacity={pulse} />}
    </g>
  );
};

/** a borough grid map sheet on the snow; flood 0..1 fills 97 of 100 squares in a fixed random order */
const MapSheet: React.FC<{f: number; x: number; y: number; w: number; h: number; flood: number}> = ({f, x, y, w, h, flood}) => {
  const n = 10;
  const cw = w / n, ch = h / n;
  const dry = new Set([7, 53, 88]);
  const order = Array.from({length: 100}, (_, i) => i).filter((i) => !dry.has(i)).sort((a, b) => h01(a, 4) - h01(b, 4));
  const filled = Math.round(clamp01(flood) * 97);
  const on = new Set(order.slice(0, filled));
  return (
    <g>
      <rect x={x + 10} y={y + 14} width={w} height={h} fill="#000" opacity={0.18} />
      <rect x={x} y={y} width={w} height={h} fill={C.sheet} stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 100}, (_, i) => on.has(i) ? (
        <rect key={i} x={x + (i % n) * cw + 2} y={y + Math.floor(i / n) * ch + 2} width={cw - 4} height={ch - 4} fill={C.sage} opacity={0.92} />
      ) : null)}
      {Array.from({length: n + 1}, (_, i) => <path key={'v' + i} d={`M ${x + i * cw} ${y} L ${x + i * cw} ${y + h}`} stroke="#C9BBA6" strokeWidth={2} />)}
      {Array.from({length: n + 1}, (_, i) => <path key={'h' + i} d={`M ${x} ${y + i * ch} L ${x + w} ${y + i * ch}`} stroke="#C9BBA6" strokeWidth={2} />)}
      {/* the Chena, a frozen pearl ribbon with a dark bank */}
      <path d={`M ${x} ${y + h * 0.62} C ${x + w * 0.3} ${y + h * 0.5}, ${x + w * 0.5} ${y + h * 0.78}, ${x + w} ${y + h * 0.66}`} stroke={C.spruce} strokeWidth={22} fill="none" />
      <path d={`M ${x} ${y + h * 0.62} C ${x + w * 0.3} ${y + h * 0.5}, ${x + w * 0.5} ${y + h * 0.78}, ${x + w} ${y + h * 0.66}`} stroke={C.river} strokeWidth={13} fill="none" />
      <rect x={x + 8} y={y + h - 40} width={monoW('FAIRBANKS NORTH STAR BOROUGH', 18) + 22} height={32} fill={C.sheet} stroke={C.ink} strokeWidth={2} />
      <text x={x + 19} y={y + h - 18} fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>FAIRBANKS NORTH STAR BOROUGH</text>
    </g>
  );
};

// ---- SH1 the snap (L0) --------------------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b1 = p.b(1), b2 = p.b(2);
  const drop = clamp01((f + 4) / 10);
  const snap = easeIO(f, b1 + 4, 14);
  const hk = chalkyHook(250, 1250, 1.05);
  const cam = track([{t: 0, z: 1.14, fx: 520, fy: 1060}, {t: b2, z: 1.08, fx: 560, fy: 1000}, {t: p.dur, z: 1.0, fx: 560, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="A LINE ON SIZE" x={540} y={560} size={42} p={win(f, b1 + 10)} />
        <Plate text="WHERE DOES IT END?" x={540} y={650} size={36} tone="dark" p={win(f, b2 + 6)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={840} seed={1} />
        <Snow horizon={840} seed={1} />
        <SpruceRank f={f} y={880} n={14} s={0.55} seed={2} />
        <SpruceRank f={f} y={960} n={8} s={0.8} seed={5} x0={-80} x1={520} />
        <FogBank f={f} x={760} y={900} w={420} h={260} op={0.9} seed={3} />
        <ChalkLine f={f} id="s1" x1={hk.x} y1={hk.y} x2={1180} y2={1020} draw={snap} sag={6} fadeEnd={0.3} />
        <ChalkPuff x={hk.x + 40} y={hk.y} t={(f - b1 - 4) / 26} f={f} r={70} />
        <ChalkPuff x={760} y={1080} t={(f - b1 - 14) / 30} f={f} r={60} seed={4} />
        <g transform={`translate(0,${(1 - drop) * -420 + settle(f, 6, 10)})`}>
          <HeldTravel f={f} x={130} y={980} w={260} h={280} mode="sweep" seed={3}>
            <Chalky f={f} x={250} y={1250} scale={1.05} emotion={f < b2 ? 'proud' : 'uneasy'} crank={snap * 0.6} look={f > b2 ? 1 : 0} cues={[b1, b2]} seed={2} />
          </HeldTravel>
        </g>
        <Near f={f} seed={1} />
      </SVG>
    </Frame>
  );
};

// ---- SH2 twelve, then eighteen (L1-L2) ------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b3 = p.b(3), b4 = p.b(4), b5 = p.b(5);
  const pull = easeIO(f, b4, 40);
  const mark12 = ease(f, b3 + 14, 12);
  const mark18 = ease(f, b4 + 36, 12);
  const peg = ease(f, b5, 14);
  const off = pull * 220;
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000} overlay={
      <g>
        <Plate text="THE MAYOR ASKED FOR 12 MONTHS" x={540} y={560} size={34} p={win(f, b3 + 6, b4)} /> {/* plate-overlap-ok */}
        <Plate text="COMMISSION RECOMMENDS 18 MONTHS" x={540} y={640} size={34} tone="chalk" p={win(f, b4 + 10)} />
        <Plate text="UNANIMOUS · PER THE NEWS-MINER" x={540} y={720} size={30} p={win(f, b5 + 4)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-100} width={1480} height={2200} fill={C.snow} />
        <Sky f={f} horizon={760} seed={2} />
        <Snow horizon={760} seed={2} />
        <SpruceRank f={f} y={800} n={10} s={0.7} seed={6} />
        {/* the line runs across the snow at ground level; the commission pulls it to the right */}
        <ChalkLine f={f} id="s2" x1={-60} y1={1150} x2={1200} y2={1120} width={14} dash={48} />
        {/* the mayor kneels and presses the mark */}
        <Parka f={f} x={300} y={1290} s={1.05} seed={3} cues={[b3]} coat="#7A4A2E" tag="MAYOR GRIER HOPKINS" kneel={ease(f, b3, 14)} reach={ease(f, b3 + 6, 10)} />
        {/* the commission row pulls the spool */}
        {[0, 1, 2].map((i) => (
          <Parka key={i} f={f} x={720 + i * 110 + (1 - ease(f, b4 - 10, 30)) * 400} y={1290 - i * 10} s={0.92} seed={10 + i} cues={[b4]} coat={['#5E6B3A', '#6E3A5A', '#8A6A2E'][i]}
            tag={i === 1 ? 'PLANNING COMMISSION' : undefined} reach={pull} facing={-1} />
        ))}
        <g transform={`translate(${-off * 0.15},0)`}>
          <g opacity={mark12} transform={`translate(450,1210)`}>
            <path d="M 0 -80 L 0 -40" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
            <path d="M 0 -80 L 0 -40" stroke={C.line} strokeWidth={6} strokeLinecap="round" />
            <text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={54} fill={C.line} stroke={C.ink} strokeWidth={1.5}>12</text>
          </g>
        </g>
        <g opacity={mark18} transform={`translate(${780 - off * 0.15},1200)`}>
          <rect x={-70} y={-110} width={140} height={150} rx={10} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="14 9" />
          <path d="M 0 -70 L 0 -30" stroke={C.line} strokeWidth={8} strokeLinecap="round" />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={54} fill={C.line} stroke={C.ink} strokeWidth={1.5}>18</text>
        </g>
        {/* peg and source slip */}
        <g transform={`translate(560,${1138 - (1 - peg) * 200})`} opacity={peg}>
          <HeldProp f={f} px={0} py={0} w={60} h={90} seed={7} kind="hang">
            <rect x={-10} y={-44} width={20} height={56} rx={5} fill="#C9A46A" stroke={C.ink} strokeWidth={3} />
            <rect x={-60} y={14} width={120} height={60} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
            <path d="M -46 34 L 46 34 M -46 50 L 30 50" stroke={C.ink} strokeWidth={3} opacity={0.6} />
          </HeldProp>
        </g>
        {/* Chalky at the left edge, crank spinning as the commission pulls */}
        <Chalky f={f} x={60} y={1290} scale={0.95} emotion="earnest" crank={pull * 3} cues={[b4]} seed={5} />
        <Near f={f} seed={2} />
      </SVG>
    </Frame>
  );
};

// ---- SH3 not a vote on AI (L3) ---------------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b6 = p.b(6), b7 = p.b(7);
  const board = ease(f, b6, 16);
  const puff = clamp01((f - b7) / 30);
  const block = ease(f, b7 + 8, 18);
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={1020} overlay={
      <g>
        <Plate text="NOT A VOTE ON AI" x={540} y={560} size={44} p={win(f, b6 + 6)} />
        <Plate text="SIZE AND POWER" x={540} y={650} size={38} p={win(f, b7 + 10)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={900} seed={3} />
        <Snow horizon={900} seed={3} />
        <SpruceRank f={f} y={930} n={9} s={0.75} seed={8} />
        {/* the board popping up: a ballot icon, crossed out by a dashed slash */}
        <g transform={`translate(830,${1270 - board * 230 + settle(f, b6 + 16, 10)})`}>
          <HeldProp f={f} px={0} py={0} w={200} h={220} seed={4} kind="rest">
            <rect x={-8} y={0} width={16} height={240} fill={C.wood} stroke={C.ink} strokeWidth={3} />
            <rect x={-100} y={-170} width={200} height={170} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={5} />
            <rect x={-46} y={-130} width={92} height={74} rx={6} fill="#D8D2C4" stroke={C.ink} strokeWidth={4} />
            <path d="M -20 -130 L 20 -130" stroke={C.ink} strokeWidth={6} />
            <path d="M -76 -24 L 76 -150" stroke={C.ink} strokeWidth={8} strokeDasharray="16 10" strokeLinecap="round" />
          </HeldProp>
        </g>
        <ChalkPuff x={330} y={880} t={puff} f={f} r={110} seed={6} />
        <g opacity={block}>
          <DashBlock x={330} y={960} w={230} h={170} plug />
        </g>
        <Chalky f={f} x={460} y={1290} scale={2.0} emotion={f < b7 ? 'earnest' : 'proud'} crank={ease(f, b7 - 4, 20) * 2} look={f < b7 ? 1 : -1} cues={[b6, b7]} seed={6} />
        <Near f={f} seed={3} posts={false} />
      </SVG>
    </Frame>
  );
};

// ---- SH4 proposed thresholds, the cutaway (L4) ------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b8 = p.b(8), b9 = p.b(9);
  const open = ease(f, b8, 22);
  const trip1 = clamp01((f - b9) / 18);
  const bx = lerp(-200, 430, easeIO(f, b9 - 30, 32));
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={980} bg="#2A1A16" overlay={
      <g>
        <Plate text="PROPOSED THRESHOLDS · ANY ONE OF THREE" x={540} y={560} size={30} tone="chalk" p={win(f, b8 + 8)} />
        <Plate text="AT LEAST 5 MW OF POWER" x={540} y={640} size={34} p={win(f, b9 + 12)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-100} width={1480} height={2200} fill="#3A2420" />
        {Array.from({length: 12}).map((_, i) => <circle key={i} data-band="ok" cx={540 + 520 * Math.cos(i / 1.9)} cy={980 + 520 * Math.sin(i / 1.9)} r={10} fill={CHALK.brass} stroke={C.ink} strokeWidth={3} />)}
        <text x={540} y={380} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill="#E8C9A0" opacity={0.7}>FNSB · STANDARD CHALK REEL</text>
        <HeldTravel f={f} x={230} y={700} w={620} h={620} mode="sweep" seed={21}><TripPinCutaway f={f} x={540} y={1010} scale={0.98} open={0.35 + 0.65 * open} tripped={[trip1, 0, 0]} labels={[trip1 > 0.3 ? '5 MW' : '', '', '']} spin={f / 300} /></HeldTravel>
        <g transform={`translate(${bx},0)`}>
          <DashBlock x={0} y={770} w={150} h={110} op={0.9} />
        </g>
        <RecFlag x={200} y={900} pop={clamp01((f - b9 - 6) / 14)} />
        <Chalky f={f} x={900} y={1420} scale={0.7} emotion="proud" crank={f / 60} cues={[b8, b9]} seed={7} />
        <Near f={f} seed={4} posts={false} y={1560} />
      </SVG>
    </Frame>
  );
};

// ---- SH5 any one of three, on the snow (L5-L6) ------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b10 = p.b(10), b11 = p.b(11), b12 = p.b(12);
  const s1 = easeIO(f, b10 - 26, 28), s2 = easeIO(f, b11 - 26, 28), s3 = easeIO(f, b12 - 20, 22);
  const pulse = f > b12 ? 0.5 + 0.5 * Math.sin((f - b12) / 4) : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.04} oy={1000} overlay={
      <g>
        <Plate text="OR 40,000 SQ FT" x={540} y={560} size={36} p={win(f, b10 + 8, b12 + 4)} /> {/* plate-overlap-ok */}
        <Plate text="OR 5 MW MADE ON SITE" x={540} y={640} size={36} p={win(f, b11 + 8, b12 + 4)} /> {/* plate-overlap-ok */}
        <Plate text="ANY ONE · PROPOSED · NOT LAW" x={540} y={720} size={36} tone="chalk" p={win(f, b12 + 6)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={820} seed={4} />
        <Snow horizon={820} seed={4} />
        <SpruceRank f={f} y={860} n={12} s={0.6} seed={9} />
        <ChalkLine f={f} id="s5" x1={-60} y1={1180} x2={1200} y2={1150} width={12} />
        <HeldTravel f={f} x={100} y={900} w={900} h={280} mode="shadow" seed={22}><g opacity={0.6 + 0.4 * (1 - pulse * 0.4)}>
          <g transform={`translate(${lerp(1300, 300, s1)},0)`}><DashBlock x={0} y={1160} w={300} h={130} /></g>
          <g transform={`translate(${lerp(1400, 640, s2)},0)`}><DashBlock x={0} y={1150} w={180} h={150} stack /></g>
          <g transform={`translate(${lerp(1500, 900, s3)},0)`}><DashBlock x={0} y={1145} w={110} h={230} /></g>
        </g></HeldTravel>
        <RecFlag x={180} y={1160} pop={clamp01((f - b10 - 2) / 14)} />
        <RecFlag x={560} y={1150} pop={clamp01((f - b11 - 2) / 14)} />
        <RecFlag x={860} y={1145} pop={clamp01((f - b12 - 2) / 14)} />
        <Near f={f} seed={5} />
      </SVG>
    </Frame>
  );
};

// ---- SH6 at least 3,000 homes (L7) ----------------------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b13 = p.b(13), b14 = p.b(14);
  const lit = clamp01((f - b14 + 4) / 50);
  const load = f > b13 ? clamp01((f - b13) / 20) : 0;
  const cam = track([{t: 0, z: 1.25, fx: 700, fy: 1000}, {t: b14, z: 1.18, fx: 640, fy: 1000}, {t: b14 + 70, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  const houses = Array.from({length: 66}, (_, i) => ({x: 40 + (i % 11) * 92 + (h01(i, 2) - 0.5) * 30, y: 940 + Math.floor(i / 11) * 70 + (h01(i, 3) - 0.5) * 16, r: h01(i, 5)}));
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="5 MW · PER THE PLANNING DIRECTOR" x={540} y={560} size={32} p={win(f, b13 + 8, b14)} /> {/* plate-overlap-ok */}
        <Plate text="5 MW · AT LEAST 3,000 HOMES" x={540} y={640} size={38} p={win(f, b14 + 8)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={800} seed={5} />
        <Snow horizon={800} seed={5} />
        <SpruceRank f={f} y={840} n={16} s={0.45} seed={11} />
        {/* the frozen Chena through town */}
        <path data-band="ok" d="M -100 1340 C 200 1300, 500 1400, 1200 1330" stroke={C.spruce} strokeWidth={34} fill="none" />
        <path data-band="ok" d="M -100 1340 C 200 1300, 500 1400, 1200 1330" stroke={C.river} strokeWidth={22} fill="none" />
        <HeldTravel f={f} x={0} y={880} w={1080} h={440} mode="shadow" seed={23}><g>{houses.map((hh, i) => {
          const on = hh.r < lit;
          return (
            <g key={i} transform={`translate(${hh.x},${hh.y})`}>
              <path d="M -26 0 L -26 -30 L 0 -50 L 26 -30 L 26 0 Z" fill="#8A6A5A" stroke={C.ink} strokeWidth={3} />
              <path d="M -30 -28 L 0 -54 L 30 -28" fill="none" stroke="#F7F5FB" strokeWidth={6} strokeLinecap="round" />
              <rect x={-9} y={-24} width={18} height={16} fill={on ? C.window : '#4A4450'} stroke={C.ink} strokeWidth={2} />
              {on && <rect x={-16} y={-30} width={32} height={28} fill={C.window} opacity={0.25} />}
            </g>
          );
        })}</g></HeldTravel>
        <HPole x={150} y={940} s={0.8} />
        <HPole x={560} y={930} s={0.8} />
        <Wire f={f} x0={98} y0={672} x1={508} y1={662} sag={40} pulse={load} at={b13} />
        <Wire f={f} x0={508} y0={662} x1={900} y1={760} sag={40} pulse={load} at={b13 + 22} />
        <DashBlock x={960} y={900} w={190} h={140} />
        <Earl f={f} x={300} y={1720} load={load * (1 - lit * 0.3)} />
      </SVG>
    </Frame>
  );
};

// ---- SH7 anything goes (L8-L9) --------------------------------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b15 = p.b(15), b16 = p.b(16), b17 = p.b(17), b18 = p.b(18), b19 = p.b(19);
  const flood = easeIO(f, b15, 60);
  const hop = clamp01((f - b16) / 18);
  const moose = easeIO(f, b17 - 10, 90);
  const bwalk = easeIO(f, b18 - 20, 30);
  const bubble = ease(f, b19, 14);
  return (
    <Frame p={p} z0={1.0} z1={1.03} bg={C.snow} overlay={
      <g>
        <Plate text="GENERAL USE ZONE · 97% OF THE BOROUGH" displayLines={['GENERAL USE ZONE · 97% OF THE BOROUGH', 'PER THE NEWS-MINER']} x={540} y={580} size={30} p={win(f, b15 + 10, b17)} /> {/* plate-overlap-ok */}
        <Plate text="AND THE LINE?" x={540} y={700} size={34} tone="dark" p={win(f, b16 + 4, b17 + 6)} /> {/* plate-overlap-ok */}
        <Plate text={'"ANYTHING GOES IN GENERAL USE"'} x={540} y={780} size={32} p={win(f, b17 + 6, b19 + 2)} /> {/* plate-overlap-ok */}
        <Plate text="WHEN DOES IT TURN TO PAINT?" x={540} y={860} size={34} tone="chalk" p={win(f, b19 + 4)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-100} width={1480} height={2200} fill={C.snow} />
        {Array.from({length: 14}).map((_, i) => <circle key={i} data-band="ok" cx={h01(i, 7) * 1080} cy={h01(i, 8) * 1920} r={30 + h01(i, 9) * 60} fill={C.shade} opacity={0.18} />)}
        <HeldTravel f={f} x={90} y={620} w={900} h={760} mode="shadow" seed={24}><MapSheet f={f} x={90} y={620} w={900} h={760} flood={flood} /></HeldTravel>
        <ChalkLine f={f} id="s7" x1={60} y1={1330} x2={1020} y2={700} width={8} dash={26} />
        {/* the dry corners stay bone; a hot dog cart and an outhouse on the map */}
        <g transform="translate(330,1000)"><rect x={-30} y={-40} width={60} height={40} fill="#C94A3A" stroke={C.ink} strokeWidth={3} /><circle cx={-16} cy={4} r={8} fill={C.ink} /><circle cx={16} cy={4} r={8} fill={C.ink} /><path d="M -34 -40 Q 0 -66 34 -40" fill="#F2D06A" stroke={C.ink} strokeWidth={3} /></g>
        <g transform="translate(780,1220)"><rect x={-26} y={-70} width={52} height={70} fill={C.wood} stroke={C.ink} strokeWidth={3} /><path d="M -32 -70 L 0 -92 L 32 -70 Z" fill="#5A4232" stroke={C.ink} strokeWidth={3} /><path d="M -4 -54 l 8 0" stroke={C.ink} strokeWidth={4} /></g>
        <IdleFigure f={f} x={lerp(1200, -200, moose)} footY={1150} h={160} seed={61} cues={[b17]}>
          <g transform={`translate(${lerp(1200, -200, moose)},0)`}>
            <Moose x={0} y={1150} scale={0.55} f={f} facing={-1} />
          </g>
        </IdleFigure>
        {/* Chalky stands on the map edge and hops onto his line */}
        <g transform={`translate(0,${-Math.sin(hop * Math.PI) * 50})`}>
          <Chalky f={f} x={200} y={1330 - hop * 26} scale={0.6} emotion={hop > 0 && hop < 1 ? 'startled' : 'calm'} hop={0} cues={[b15, b16]} seed={8} />
        </g>
        {/* the builder walks in, reads the line, nods; then the bubble */}
        <Parka f={f} x={lerp(1150, 860, bwalk)} y={1330} s={0.78} seed={21} cues={[b18, b19]} coat="#8A6A2E" tag={bwalk > 0.6 ? 'ANY BUILDER' : undefined} walk={f * (1 - bwalk)} facing={-1} />
        <g opacity={bubble} transform={`translate(780,${880 - bubble * 20}) scale(${0.6 + 0.4 * bubble})`}>
          <path d="M -120 -60 Q -130 -150 0 -150 Q 130 -150 120 -60 Q 110 10 0 10 Q -40 10 -60 0 L -90 40 L -80 -4 Q -120 -20 -120 -60 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <rect x={-90} y={-110} width={24} height={80} rx={6} fill="#F4F4F8" stroke={C.ink} strokeWidth={3} transform="rotate(-20 -78 -70)" />
          <g transform="translate(40,-60)">
            <rect x={-30} y={-40} width={60} height={70} rx={6} fill="#B0B0B0" stroke={C.ink} strokeWidth={4} />
            <ellipse cx={0} cy={-40} rx={30} ry={8} fill="#D0D0D0" stroke={C.ink} strokeWidth={3} />
          </g>
          <path d="M 26 -136 Q 26 -156 42 -156 Q 58 -156 58 -140 Q 58 -128 44 -122 L 44 -110 M 44 -100 L 44 -96" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
        <FogBank f={f} x={-100} y={380} w={1300} h={200} op={0.7} seed={7} />
        <Near f={f} seed={14} />
      </SVG>
    </Frame>
  );
};

// ---- SH8 follow the line (L10) ----------------------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b20 = p.b(20), b21 = p.b(21);
  const walk = easeIO(f, b20, p.dur - b20);
  const fog = easeIO(f, b21 - 10, 40);
  const cx = lerp(180, 640, walk);
  return (
    <Frame p={p} z0={1.0} z1={1.05} ox={cx + 100} oy={1040} overlay={
      <g>
        <Plate text="CLEAR ON SIZE" x={540} y={560} size={40} p={win(f, b20 + 6, b21)} /> {/* plate-overlap-ok */}
        <Plate text="WHERE IT REACHES?" x={540} y={640} size={38} tone="dark" p={win(f, b21 + 6)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={980} seed={6} fogHaze={fog * 0.5} />
        <Snow horizon={980} seed={6} />
        <SpruceRank f={f} y={1010} n={9} s={0.95} seed={13} />
        <HPole x={260} y={1060} s={1.0} />
        <HPole x={860} y={1040} s={0.95} />
        <Spruce x={980} y={1120} s={2.4} f={f} seed={7} />
        <Spruce x={60} y={1100} s={2.2} f={f} seed={8} />
        <Wire f={f} x0={196} y0={720} x1={796} y1={713} sag={50} />
        <ChalkLine f={f} id="s8" x1={-80} y1={1250} x2={1300} y2={1170} width={12} fadeEnd={0.25 + fog * 0.3} />
        <FogBank f={f} x={560 + (1 - fog) * 500} y={980} w={700} h={380} op={0.5 + fog * 0.45} seed={8} />
        <HeldTravel f={f} x={cx - 160} y={940} w={320} h={330} mode="sweep" seed={25}><Chalky f={f} x={cx} y={1260} scale={1.15} emotion={f < b21 ? 'determined' : 'uneasy'} crank={walk * 4} look={1} cues={[b20, b21]} seed={9} /></HeldTravel>
        <Near f={f} seed={6} />
      </SVG>
    </Frame>
  );
};

// ---- SH9 the fence and the board (L11-L12) --------------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b22 = p.b(22), b23 = p.b(23), b24 = p.b(24), b25 = p.b(25);
  const rise = ease(f, b22, 18);
  const gray = easeIO(f, b23, 26);
  const board = ease(f, b24, 16);
  const write = clamp01((f - b24 - 6) / 40);
  const turn = f > b25 ? Math.sin((f - b25) / 9) * 26 * Math.exp(-(f - b25) / 60) : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.04} oy={1000} bg={C.fog} overlay={
      <g>
        <Plate text="INSIDE THE FENCE · LIKELY NOT BOROUGH ZONING" displayLines={['INSIDE THE FENCE', 'LIKELY NOT BOROUGH ZONING']} x={540} y={580} size={34} p={win(f, b23 + 8, b24)} /> {/* plate-overlap-ok */}
        <Plate text="HOPKINS BELIEVES · PURELY GOVERNMENT PURPOSE" displayLines={['HOPKINS BELIEVES', 'PURELY GOVERNMENT PURPOSE']} x={540} y={700} size={32} p={win(f, b24 + 10, b25)} /> {/* plate-overlap-ok */}
        <Plate text={'"NOT SUBJECT" TO THE PAUSE · NOT A RULING'} displayLines={['"NOT SUBJECT" TO THE PAUSE', 'NOT A RULING']} x={540} y={820} size={32} p={win(f, b25 + 6)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={940} seed={7} fogHaze={0.7} />
        <Snow horizon={940} seed={7} />
        {/* behind the wire: only snow and spruce */}
        <SpruceRank f={f} y={960} n={11} s={0.7} seed={15} />
        <Spruce x={900} y={980} s={2.3} f={f} seed={9} />
        <Spruce x={130} y={970} s={2.0} f={f} seed={10} />
        <FogBank f={f} x={-100} y={880} w={1300} h={300} op={0.75} seed={9} />
        <g transform={`translate(0,${(1 - rise) * 500})`}>
          <HeldTravel f={f} x={0} y={740} w={1080} h={520} mode="shadow" seed={26}><ChainFence f={f} x1={-40} x2={1120} top={760} bottom={1240} post={240} sway={f > b25 ? 0.4 : 0} /></HeldTravel>
          <g transform="translate(250,1060)">
            <rect x={-170} y={-30} width={340} height={56} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} />
            <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>EIELSON AIR FORCE BASE</text>
          </g>
        </g>
        {/* the line comes from the near plane and stops at the outside face of the wire, gray and slack */}
        <ChalkLine f={f} id="s9" x1={120} y1={1640} x2={640} y2={1236} width={14} grayFrom={1 - gray * 0.38} sag={gray * 60} />
        <g opacity={gray}>
          <ellipse cx={650} cy={1238} rx={90 * gray} ry={22} fill={CHALK.gray} stroke={C.ink} strokeWidth={2} strokeOpacity={0.4} />
          <ellipse cx={640} cy={1222} rx={54 * gray} ry={16} fill={CHALK.grayL} />
        </g>
        {/* the pencilled board on the outside of the wire */}
        <g transform={`translate(760,${820 + (1 - board) * -300}) rotate(${turn})`} opacity={board}>
          <path d="M -60 -60 L 0 -10 L 60 -60" stroke="#6A5A44" strokeWidth={3} fill="none" />
          <rect x={-120} y={-10} width={240} height={150} rx={6} fill="#EDE3CC" stroke={C.ink} strokeWidth={4} />
          {[0, 1, 2].map((i) => <path key={i} d={`M -96 ${26 + i * 34} L ${-96 + 190 * clamp01(write * 3 - i)} ${26 + i * 34}`} stroke="#5A5650" strokeWidth={5} strokeLinecap="round" />)}
          <path d={`M ${-96 + 190 * clamp01(write * 3 - Math.min(2, Math.floor(write * 3)))} ${26 + Math.min(2, Math.floor(write * 3)) * 34} l 26 -36 l 8 6 l -26 36 Z`} fill="#E8C060" stroke={C.ink} strokeWidth={2} opacity={write > 0 && write < 1 ? 1 : 0} />
        </g>
        <Near f={f} seed={7} posts={false} />
      </SVG>
    </Frame>
  );
};

// ---- SH10 the gray swatch, low along the slack line (L13-L14) -------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b26 = p.b(26), b27 = p.b(27), b28 = p.b(28);
  const card = ease(f, b26, 16);
  const sw = ease(f, b27, 14);
  const dust = clamp01((f - b28) / 40);
  return (
    <Frame p={p} cam={(ff) => ({z: 1.02, fx: 540 + Math.sin(ff / 60) * 20 + ff * 0.2, fy: 1000})} bg={C.fog} overlay={
      <g>
        <Plate text={'PRIVATE USE · "MIGHT BE DIFFERENT"'} x={540} y={560} size={32} p={win(f, b26 + 8, b27)} /> {/* plate-overlap-ok */}
        <Plate text={'"TURN THAT GRAY AREA BLACK AND WHITE"'} x={540} y={640} size={30} p={win(f, b27 + 6)} />
        <Plate text="RESEARCH UNDER WAY · NO ANSWER YET" x={540} y={720} size={30} tone="dark" p={win(f, b28 + 4)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-100} width={1480} height={2200} fill="#D9D6E2" />
        {/* the wire, close, filling the top half; snow and spruce beyond */}
        <SpruceRank f={f} y={760} n={7} s={1.0} seed={17} />
        <FogBank f={f} x={-100} y={600} w={1300} h={300} op={0.7} seed={11} />
        <ChainFence f={f} x1={-60} x2={1140} top={500} bottom={1180} post={300} sway={dust > 0 ? 0.5 : 0} />
        <rect data-band="ok" x={-200} y={1180} width={1480} height={900} fill={C.snow} />
        <path data-band="ok" d="M -200 1180 L 1300 1180" stroke={C.ink} strokeWidth={3} />
        {/* the slack gray line runs from us to the wire and lies on the snow */}
        <ChalkLine f={f} id="s10" x1={-40} y1={1700} x2={560} y2={1186} width={22} dash={60} grayFrom={0.35} sag={120} />
        <ellipse cx={570} cy={1190} rx={120} ry={22} fill={CHALK.gray} />
        {/* dotted board, below the first (off frame above) */}
        <g transform={`translate(300,${920 + (1 - card) * -260}) rotate(${Math.sin(f / 13) * 4})`} opacity={card}>
          <rect x={-120} y={-60} width={240} height={130} rx={6} fill="#EDE3CC" stroke={C.ink} strokeWidth={4} strokeDasharray="12 8" />
          <path d="M -16 -20 Q -16 -44 4 -44 Q 24 -44 24 -24 Q 24 -8 6 0 L 6 16 M 6 30 L 6 34" stroke="#6E6A60" strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
        {/* the swatch: blank black and white halves, gray middle; dust settles only on the gray */}
        <g transform={`translate(780,${820 - (1 - sw) * 40})`} opacity={sw}>
          <HeldProp f={f} px={0} py={0} w={260} h={170} seed={9} kind="hang">
            <rect x={-130} y={-80} width={260} height={160} rx={6} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
            <rect x={-118} y={-68} width={70} height={136} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="8 6" />
            <rect x={48} y={-68} width={70} height={136} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="8 6" />
            <rect x={-40} y={-68} width={80} height={136} fill={CHALK.gray} stroke={C.ink} strokeWidth={3} />
            {Array.from({length: 10}).map((_, i) => <circle key={i} cx={-30 + h01(i, 3) * 60} cy={-60 + dust * 120 * h01(i, 4)} r={3} fill={CHALK.grayL} opacity={dust} />)}
          </HeldProp>
        </g>
        <Near f={f} seed={8} posts={false} y={1540} />
      </SVG>
    </Frame>
  );
};

// ---- SH11 the fair test (L15-L16) -------------------------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b29 = p.b(29), b46 = p.b(46), b30 = p.b(30);
  const land = clamp01((f + 2) / 10);
  const walkIn = easeIO(f, b46 - 6, 34);
  const lift = easeIO(f, b30 + 10, 40);
  const hk = chalkyHook(260, 1270, 1.15);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1020} overlay={
      <g>
        <Plate text="THE FAIR TEST · REASONS FOR TIME" x={540} y={560} size={34} p={win(f, b29 + 4, b30)} /> {/* plate-overlap-ok */}
        <Plate text="REAL REASONS" x={540} y={640} size={38} p={win(f, b46 + 4, b30 + 4)} /> {/* plate-overlap-ok */}
        <Plate text="DIESEL GENERATORS · A COMMISSIONER'S WORRY" x={540} y={720} size={30} p={win(f, b30 + 10)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={880} seed={8} />
        <Snow horizon={880} seed={8} />
        <SpruceRank f={f} y={910} n={12} s={0.65} seed={19} />
        {/* the slack line, lifted by the rope as the commissioner pulls */}
        <ChalkLine f={f} id="s11" x1={hk.x} y1={hk.y} x2={1200} y2={1180} width={13} sag={lerp(170, 30, lift)} />
        {/* rope from the line up to the commissioner's hands, tag with a genset icon */}
        <g opacity={clamp01((f - b30) / 8)}>
          <path d={`M 700 ${lerp(1330, 1210, lift)} Q 760 ${lerp(1180, 1080, lift)} 820 ${lerp(1060, 1000, lift)}`} stroke="#B98A4A" strokeWidth={10} fill="none" />
          <path d={`M 700 ${lerp(1330, 1210, lift)} Q 760 ${lerp(1180, 1080, lift)} 820 ${lerp(1060, 1000, lift)}`} stroke={C.ink} strokeWidth={2} fill="none" strokeDasharray="6 8" />
          <g transform={`translate(752,${lerp(1240, 1130, lift)})`}>
            <rect x={-44} y={-30} width={88} height={60} rx={4} fill="#EBD9B4" stroke={C.ink} strokeWidth={3} />
            <g transform="translate(0,14) scale(0.16)"><Genset f={f} x={0} y={0} puff={0.5} /></g>
          </g>
        </g>
        {/* the commissioner walks in with the first coil, then pulls */}
        <Parka f={f} x={lerp(1200, 880, walkIn)} y={1270} s={1.0} seed={31} cues={[b46, b30]} coat="#5E6B3A" tag="A COMMISSIONER" walk={f * (1 - walkIn)} facing={-1} reach={lift} carry={f < b30} />
        {f < b30 + 10 && (
          <g transform={`translate(${lerp(1200, 880, walkIn) - 50},1120)`}>
            {[0, 1, 2].map((i) => <ellipse key={i} cx={0} cy={i * 6} rx={34 - i * 4} ry={14} fill="none" stroke="#B98A4A" strokeWidth={8} />)}
          </g>
        )}
        <HeldTravel f={f} x={100} y={950} w={330} h={330} mode="sweep" seed={27}><Chalky f={f} x={260} y={1270 + (1 - land) * -300} scale={1.15} emotion="braced" skid={0.4 + 0.4 * lift} crank={-lift * 0.5} cues={[b29, b46, b30]} seed={10} /></HeldTravel>
        <Near f={f} seed={9} />
      </SVG>
    </Frame>
  );
};

// ---- SH12 on the page (L17-L18) ---------------------------------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b31 = p.b(31), b32 = p.b(32), b33 = p.b(33);
  const step = easeIO(f, b31 - 8, 24);
  const balloon = ease(f, b32, 20);
  const res = ease(f, b33, 22);
  const tight = easeIO(f, b31 + 10, 30);
  return (
    <Frame p={p} z0={1.0} z1={1.04} bg={C.snow} overlay={
      <g>
        <Plate text="ANOTHER COMMISSIONER · HEARING ANXIETY" x={540} y={560} size={30} p={win(f, b31 + 6, b33)} /> {/* plate-overlap-ok */}
        <Plate text={'"ANXIETY ... OVER AI IN GENERAL"'} x={540} y={640} size={34} p={win(f, b32 + 8, b33 + 4)} /> {/* plate-overlap-ok */}
        <Plate text={'"IT\'S SMART TO TAKE THE TIME"'} x={540} y={720} size={34} p={win(f, b33 + 8)} />
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-100} width={1480} height={2200} fill={C.snow} />
        {/* the big newspaper page laid on the snow, seen from above */}
        <g transform="translate(540,1150) rotate(-4)">
          <HeldTravel f={f} x={-380} y={-300} w={760} h={600} mode="shadow" seed={13}>
            <g>
              <rect x={-380} y={-300} width={760} height={600} fill="#F2EEE4" stroke={C.ink} strokeWidth={5} />
              <text x={0} y={-248} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight={900} fontSize={36} fill={C.ink}>FAIRBANKS DAILY NEWS-MINER</text>
              <path d="M -350 -228 L 350 -228" stroke={C.ink} strokeWidth={3} />
              <text x={0} y={-180} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight={900} fontSize={40} fill={C.ink}>AI DATA CENTERS AROUND THE NATION</text>
              {Array.from({length: 14}).map((_, i) => <path key={i} d={`M ${i % 2 ? 20 : -350} ${-120 + Math.floor(i / 2) * 50} L ${i % 2 ? 350 : -20} ${-120 + Math.floor(i / 2) * 50}`} stroke="#B9B2A4" strokeWidth={8} />)}
            </g>
          </HeldTravel>
        </g>
        {/* the line crosses the top of the frame, held up by ropes */}
        <ChalkLine f={f} id="s12" x1={-60} y1={560 + 0} x2={1200} y2={540} width={11} sag={lerp(90, 20, tight)} />
        <path d={`M 300 ${lerp(1150, 1140, tight)} L 300 ${lerp(640, 580, tight)}`} stroke="#B98A4A" strokeWidth={9} opacity={step} />
        <path d={`M 860 1300 L 860 ${lerp(640, 570, res)}`} stroke="#B98A4A" strokeWidth={9} opacity={res} />
        <Parka f={f} x={300} y={lerp(1480, 1360, step)} s={0.75} seed={41} cues={[b31, b32]} coat="#6E3A5A" tag="ANOTHER COMMISSIONER" reach={tight} />
        <g opacity={balloon} transform={`translate(640,${820 - balloon * 20}) scale(${0.5 + 0.5 * balloon})`}>
          <path d="M -150 -50 Q -160 -140 0 -140 Q 160 -140 150 -50 Q 140 20 0 20 Q -30 20 -60 10 L -40 60 L -100 0 Q -150 -10 -150 -50 Z" fill={C.paper} stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 5}).map((_, i) => <path key={i} d={`M ${-90 + i * 40} -70 q 10 -20 20 0 q 10 20 20 0`} stroke={C.ink} strokeWidth={4} fill="none" />)}
        </g>
        <Parka f={f} x={860} y={lerp(1600, 1500, res)} s={0.75} seed={43} cues={[b33]} coat="#8A4A2E" tag="A RESIDENT" reach={res} />
        <FogBank f={f} x={-100} y={300} w={1300} h={160} op={0.6} seed={13} />
        <Near f={f} seed={15} posts={false} y={1560} />
      </SVG>
    </Frame>
  );
};

// ---- SH13 the extra eight (L19) ---------------------------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b34 = p.b(34), b35 = p.b(35), b36 = p.b(36);
  const coil = easeIO(f, b34, 30);
  const bwalk = easeIO(f, b34 + 10, 40);
  const flag10 = clamp01((f - b35) / 14), flag18 = clamp01((f - b36) / 14);
  const brk = easeIO(f, b36 + 6, 24);
  const x10 = 420, x18 = 900;
  return (
    <Frame p={p} cam={(ff) => ({z: 1.02, fx: 520 + ff * 0.35, fy: 1000})} overlay={
      <g>
        <Plate text="THE OPPOSITE VIEW IS FAIR TOO" x={540} y={560} size={34} p={win(f, b34 + 6, b36)} /> {/* plate-overlap-ok */}
        <Plate text="RESEARCH DUE · MONTH 10" x={540} y={640} size={34} p={win(f, b35 + 6, b36 + 4)} /> {/* plate-overlap-ok */}
        <Plate text="THE EXTRA 8 MONTHS · NEITHER OUTLET SAYS WHY" displayLines={['THE EXTRA 8 MONTHS', 'NEITHER OUTLET SAYS WHY']} x={540} y={740} size={32} p={win(f, b36 + 8)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={860} seed={9} />
        <Snow horizon={860} seed={9} />
        <SpruceRank f={f} y={890} n={12} s={0.6} seed={21} />
        {/* the frozen Chena along the far edge */}
        <path data-band="ok" d="M -100 960 C 300 940, 700 990, 1200 950" stroke={C.spruce} strokeWidth={18} fill="none" />
        <path data-band="ok" d="M -100 960 C 300 940, 700 990, 1200 950" stroke={C.river} strokeWidth={11} fill="none" />
        {/* the month strip on the snow */}
        <rect x={0} y={1236} width={1080} height={34} fill="#EBD9B4" stroke={C.ink} strokeWidth={3} />
        {Array.from({length: 19}).map((_, i) => <path key={i} d={`M ${i * 52 + 20} 1236 L ${i * 52 + 20} ${i % 6 === 0 ? 1270 : 1256}`} stroke={C.ink} strokeWidth={3} />)}
        {/* the line, taut on the left (held by the ropes off frame), then running on into an unheld slack coil */}
        <ChalkLine f={f} id="s13a" x1={-60} y1={1050} x2={x10} y2={1060} width={12} />
        <ChalkLine f={f} id="s13b" x1={x10} y1={1060} x2={x18 + 120} y2={1200} width={12} sag={coil * 130} />
        <HeldTravel f={f} x={760} y={1160} w={300} h={90} mode="shadow" seed={28}><g opacity={coil}>
          {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={x18 - 60 + i * 16} cy={1214 - i * 4} rx={90 - i * 10} ry={20} fill="none" stroke={C.line} strokeWidth={9} strokeDasharray="26 14" />)}
        </g></HeldTravel>
        <RecFlag x={x10} y={1236} pop={flag10} />
        <g opacity={flag10}><Lab text="10" x={x10} y={1086} size={26} /></g>
        <g transform={`translate(${x18},1236)`} opacity={flag18}>
          <path d="M 0 0 L 0 -120" stroke={C.ink} strokeWidth={5} transform={`scale(1,${flag18})`} />
          <Lab text="18" x={-10} y={-196} size={26} />
        </g>
        <path d={`M ${x10} 1310 L ${x10} 1290 L ${lerp(x10, x18, brk)} 1290 L ${lerp(x10, x18, brk)} 1310`} stroke={C.ink} strokeWidth={5} fill="none" strokeDasharray="12 8" opacity={brk} />
        {/* the builder walks in from the right, lifts the coil's end and looks along it */}
        <Parka f={f} x={lerp(1250, 930, bwalk)} y={1236} s={0.9} seed={51} cues={[b34, b36]} coat="#8A6A2E" tag={bwalk > 0.6 ? 'ANY BUILDER' : undefined} walk={f * (1 - bwalk)} facing={-1} reach={easeIO(f, b34 + 40, 20)} />
        <Near f={f} seed={10} />
      </SVG>
    </Frame>
  );
};

// ---- SH14 not law yet (L20) -----------------------------------------------------------------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b37 = p.b(37), b38 = p.b(38), b39 = p.b(39);
  const crack = clamp01((f - b37) / 12);
  const sign = ease(f, b38, 12);
  const winOn = f > b38 + 4 ? 1 : 0.25;
  const rattle = f > b38 ? Math.sin((f - b38) * 2.2) * 5 * Math.exp(-(f - b38) / 14) : 0;
  const ghost = clamp01((f - b39) / 40);
  const ghostA = -90 + ghost * 360;
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={980} overlay={
      <g>
        <Plate text="NOT LAW YET" x={540} y={560} size={44} p={win(f, b37 + 6)} />
        <Plate text="ASSEMBLY VOTE · LIKELY JAN 14TH" x={540} y={650} size={34} p={win(f, b38 + 6)} />
        <Plate text="THE CLOCK WOULD START AT THE VOTE" x={540} y={730} size={30} tone="chalk" p={win(f, b39 + 6)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={760} seed={10} />
        <Snow horizon={760} seed={10} />
        {/* the borough building */}
        <g data-band="ok">
          <rect x={560} y={560} width={560} height={720} fill="#B6A48E" stroke={C.ink} strokeWidth={5} />
          <rect x={560} y={540} width={560} height={40} fill="#8A7A66" stroke={C.ink} strokeWidth={4} />
          <path d="M 560 540 L 1120 540" stroke="#F7F5FB" strokeWidth={10} />
          <rect x={840 - (monoW('FAIRBANKS NORTH STAR BOROUGH', 22) + 30) / 2} y={818} width={monoW('FAIRBANKS NORTH STAR BOROUGH', 22) + 30} height={38} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <text x={840} y={845} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>FAIRBANKS NORTH STAR BOROUGH</text>
          {[0, 1, 2].map((i) => <rect key={i} x={600 + i * 160} y={660} width={110} height={130} fill={i === 1 ? (winOn > 0.5 ? C.window : '#4A4450') : '#4A4450'} stroke={C.ink} strokeWidth={4} />)}
          {winOn > 0.5 && <rect x={720} y={650} width={150} height={150} fill={C.window} opacity={0.25} />}
          <rect x={770} y={960} width={150} height={320} fill="#5A4232" stroke={C.ink} strokeWidth={5} />
          <rect x={730} y={900} width={230} height={18} fill="#3A3440" stroke={C.ink} strokeWidth={3} />
        </g>
        {/* the vote sign drops onto the door bracket */}
        <g transform={`translate(845,${910 - (1 - sign) * 300 + settle(f, b38 + 12, 6)})`} opacity={sign}>
          <rect x={-110} y={0} width={220} height={60} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} />
          <path d="M -80 22 L 80 22 M -80 40 L 40 40" stroke={C.ink} strokeWidth={4} opacity={0.6} />
        </g>
        {/* the frosted copper stopwatch on a spruce post, hand at zero */}
        <rect x={360} y={760} width={30} height={520} fill={C.wood} stroke={C.ink} strokeWidth={4} />
        <g transform="translate(375,900)">
          <HeldProp f={f} px={0} py={0} w={300} h={320} seed={11} kind="hang">
            <rect x={-20} y={-180} width={40} height={30} rx={6} fill={C.copper} stroke={C.ink} strokeWidth={4} />
            <circle r={150} fill={C.copper} stroke={C.ink} strokeWidth={6} />
            <circle r={126} fill="#FBF9F4" stroke={C.ink} strokeWidth={4} />
            {Array.from({length: 12}).map((_, i) => <path key={i} d="M 0 -118 L 0 -100" stroke={C.ink} strokeWidth={4} transform={`rotate(${i * 30})`} />)}
            <path d="M 0 0 L 0 -104" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
            {ghost > 0 && ghost < 1 && <path d={`M 0 0 L ${104 * Math.cos((ghostA * Math.PI) / 180)} ${104 * Math.sin((ghostA * Math.PI) / 180)}`} stroke={C.ink} strokeWidth={6} strokeDasharray="10 8" opacity={0.6 * Math.sin(ghost * Math.PI)} />}
            <circle r={9} fill={C.ink} />
            {/* frost cracking off the face */}
            <g opacity={1 - crack}>
              <circle r={126} fill="#E8F2F6" opacity={0.75} />
              {Array.from({length: 6}).map((_, i) => <path key={i} d={`M 0 0 L ${120 * Math.cos(i)} ${120 * Math.sin(i)}`} stroke="#B8D0DA" strokeWidth={3} />)}
            </g>
            {crack > 0 && crack < 1 && Array.from({length: 8}).map((_, i) => <path key={i} d="M -8 -6 L 8 -4 L 4 8 Z" fill="#E8F2F6" stroke={C.ink} strokeWidth={1.5} transform={`translate(${Math.cos(i) * (60 + crack * 120)},${Math.sin(i) * 60 + crack * 200})`} />)}
          </HeldProp>
        </g>
        {/* two sealed paint cans at the foot of the post */}
        <g transform={`translate(${rattle},0)`}><PaintCan f={f} x={300} y={1290} scale={0.9} color="black" /></g>
        <g transform={`translate(${-rattle},0)`}><PaintCan f={f} x={460} y={1290} scale={0.9} color="white" seed={2} /></g>
        <Near f={f} seed={11} posts={false} />
      </SVG>
    </Frame>
  );
};

// ---- SH15 reel it in (L21-L22) ---------------------------------------------------------------------------------------------------------------------------------------
const S15: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b40 = p.b(40), b41 = p.b(41), b42 = p.b(42), b43 = p.b(43);
  const reel = easeIO(f, b40, p.dur - b40);
  const ropes = easeIO(f, b41, 50);
  const endOut = ease(f, b42, 20);
  const fog = 1 - easeIO(f, b40, 80) * 0.6;
  const hk = chalkyHook(300, 1290, 1.25);
  const endX = lerp(1250, 820, endOut);
  return (
    <Frame p={p} cam={(ff) => ({z: 1.0 + reel * 0.05, fx: 540 + reel * 40, fy: 1020 - reel * 20})} overlay={
      <g>
        <Plate text="READINESS, NOT REFUSAL, IF..." x={540} y={560} size={36} p={win(f, b40 + 6, b42)} /> {/* plate-overlap-ok */}
        <Plate text="ONLY IF IT ENDS WITH" x={540} y={640} size={34} tone="dark" p={win(f, b41 + 6, b42 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={960} seed={11} fogHaze={fog * 0.4} />
        <Snow horizon={960} seed={11} />
        <SpruceRank f={f} y={990} n={8} s={1.0} seed={23} />
        <Spruce x={120} y={1060} s={2.4} f={f} seed={11} />
        <Spruce x={1000} y={1040} s={2.2} f={f} seed={12} />
        <ChalkLine f={f} id="s15" x1={hk.x} y1={hk.y} x2={endX} y2={1190} width={13} dash={40} />
        {/* the three tagged ropes ride the line onto the spool */}
        {[0, 1, 2].map((i) => {
          const along = clamp01(ropes * 1.4 - i * 0.2);
          const x = lerp(560 + i * 140, hk.x + 10, along);
          return along < 0.98 ? (
            <g key={i} transform={`translate(${x},${lerp(hk.y + 20, 1180, 1 - along) - 20})`}>
              <path d="M 0 0 L 0 -80" stroke="#B98A4A" strokeWidth={8} />
              <rect x={-30} y={-110} width={60} height={34} rx={4} fill="#EBD9B4" stroke={C.ink} strokeWidth={3} />
            </g>
          ) : null;
        })}
        {/* the bare frayed end */}
        <g transform={`translate(${endX},1190)`} opacity={endOut}>
          {[-14, -6, 2, 10].map((a, i) => <path key={i} d={`M 0 0 q 18 ${a * 0.6} 30 ${a}`} stroke={C.line} strokeWidth={4} fill="none" />)}
        </g>
        <FogBank f={f} x={700} y={1000} w={600} h={340} op={fog * 0.9} seed={15} />
        <ChalkMark f={f} x={420} y={1440} text="RULES A BUILDER CAN MEET" draw={ease(f, b42 + 6, 24)} size={26} />
        <ChalkMark f={f} x={690} y={1560} text="AN ANSWER AT THE FENCE" draw={ease(f, b43, 24)} size={26} seed={2} />
        <HeldTravel f={f} x={130} y={930} w={350} h={370} mode="sweep" seed={29}><Chalky f={f} x={300} y={1290} scale={1.25} emotion={f < b42 ? 'determined' : 'hopeful'} crank={reel * 9} skid={0.2} cues={[b40, b41, b42, b43]} seed={11} /></HeldTravel>
      </SVG>
    </Frame>
  );
};

// ---- SH16 clear on size, the crane-up and the re-snap (L23) ------------------------------------------------------------------------------------------------------------
const S16: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b44 = p.b(44), b45 = p.b(45);
  const snap = easeIO(f, b45 + 4, 14);
  const hk = chalkyHook(330, 1260, 0.8);
  const cam = track([{t: 0, z: 1.6, fx: 360, fy: 1180}, {t: b44 + 6, z: 1.55, fx: 380, fy: 1160}, {t: b44 + 70, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="CLEAR ON SIZE · STILL CHALK" x={540} y={560} size={38} p={win(f, b44 + 10, b45)} /> {/* plate-overlap-ok */}
        <Plate text="WHERE DOES IT REACH?" x={540} y={640} size={40} tone="dark" p={win(f, b45 + 6)} />
      </g>
    }>
      <SVG>
        <Sky f={f} horizon={840} seed={12} />
        <Snow horizon={840} seed={12} />
        <SpruceRank f={f} y={880} n={16} s={0.5} seed={25} />
        {/* the far fence, small, in its thin fog pocket, umber wire kept dark */}
        <FogBank f={f} x={760} y={900} w={360} h={160} op={0.55} seed={17} />
        <ChainFence f={f} x1={780} x2={1120} top={930} bottom={1010} post={90} />
        <ChalkLine f={f} id="s16a" x1={hk.x} y1={hk.y} x2={800} y2={1008} width={10} grayFrom={0.86} sag={20} />
        <ellipse cx={806} cy={1010} rx={50} ry={12} fill={CHALK.gray} stroke={C.ink} strokeWidth={2} strokeOpacity={0.4} />
        {/* the re-snap: a fresh line from the same spruce */}
        <ChalkLine f={f} id="s16b" x1={hk.x} y1={hk.y} x2={1180} y2={1080} draw={f > b45 ? snap : 0} fadeEnd={0.3} />
        <ChalkPuff x={hk.x + 30} y={hk.y} t={(f - b45 - 4) / 24} f={f} r={50} />
        <HeldTravel f={f} x={130} y={900} w={330} h={370} mode="sweep" seed={30}><Spruce x={200} y={1250} s={1.2} f={f} seed={4} /></HeldTravel>
        <Chalky f={f} x={330} y={1260} scale={0.8} emotion={f < b45 ? 'calm' : 'proud'} crank={snap * 0.6} cues={[b44, b45]} seed={12} />
        <Earl f={f} x={640} y={1720} load={0.3} />
        <Near f={f} seed={12} />
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

export const ep1118Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1118Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1118: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 5.5, 14.5, 18.4, 24.8, 31.3, 37.2, 47.2, 52.8, 65.1, 73.3, 82.3, 90.4, 97.3, 104.1, 113.2, 119.9].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.sky1}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#21353A" ink="#FFF6E3" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
