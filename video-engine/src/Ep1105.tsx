import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer} from './lib/lighting';
import {VoiceProvider, useVoice} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {MONO, monoW} from './lib/prospect';
import {DiplomaPress} from './lib/credentials';
import {AK_PATH} from './lib/akmap';
import {IDS} from './Ep1105Ids';

// Who Held the Pen, 2026-11-05. Palette roles are art_direction.json. CLICKY is a gunmetal faced counter on the dash of a night cab, the car's own recorder.
// THE DRAFT SHEET is the throughline: it changes state at every act boundary (art_direction.json). Mint is the machine only, yellow is light only.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

export const C = {
  sky: '#2A140E', ground: '#5A3A22', hero: '#8E2434', cuff: '#8E2434', glow: '#FFD23F', accent: '#83D9B1', shadow: '#14080F', paper: '#F1E8D0', ink: '#1A0E14',
  brass: '#B08A4E', chalk: '#E9E4D4', white: '#F4F1EA',
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
const bump = (f: number, a: number, d = 14) => {
  const k = clamp01((f - a) / d);
  return k <= 0 || k >= 1 ? 0 : Math.sin(k * Math.PI) * (1 - k * 0.3);
};

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'dark' | 'plate' | 'warn' | 'glow';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#1A0A10', fg: '#F1E8D0', edge: '#F1E8D0'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.hero, edge: C.hero},
  glow: {fill: C.glow, fg: C.ink, edge: C.ink},
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

/** a sized label: rect sized by monoW, text centred on it. */
const Lab: React.FC<{text: string; x: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> = ({text, x, y, size = 24, tone = 'plate', p = 1, rot = 0}) => {
  if (p <= 0.01) return null;
  const w = monoW(text, size) + 28, h = size + 22;
  const t = TONES[tone];
  return (
    <g opacity={clamp01(p * 1.8)} transform={`translate(${x} ${y}) rotate(${rot}) scale(${0.9 + 0.1 * clamp01(p)})`}>
      <rect x={-w / 2 + 4} y={-h / 2 + 5} width={w} height={h} rx={5} fill="#000" opacity={0.22} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill={t.fill} stroke={t.edge} strokeWidth={3} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={0.8} fill={t.fg}>{text}</text>
    </g>
  );
};



// ---- the room ------------------------------------------------------------------------------------------------------------------------
/** the seminar room behind every shot: paneled wall, a window whose sun slides and sets, an oak floor and table edge. v 'bone' = the fair-case flat key. */
const Room: React.FC<{f: number; v: string; table?: boolean}> = ({f, v, table = true}) => {
  const bone = v === 'bone';
  const sun = 0.5 + 0.5 * Math.sin(f / 260);
  if (v === 'floor') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <defs><linearGradient id="flg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A2D18" /><stop offset="1" stopColor="#2A170C" /></linearGradient></defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#flg)" />
        {Array.from({length: 24}).map((_, i) => <line key={i} x1={0} y1={i * 84} x2={W} y2={i * 84} stroke="#1A0E14" strokeWidth={4} opacity={0.5} />)}
        {Array.from({length: 4}).map((_, i) => <polygon key={i} points={`${-100 + i * 300 + 600 * sun * 0.2},0 ${40 + i * 300},0 ${460 + i * 300},1920 ${300 + i * 300},1920`} fill={C.glow} opacity={0.06 + 0.04 * sun} />)}
      </svg>
    );
  }
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bone ? '#E3D8BB' : '#1E0913'} />
          <stop offset="0.35" stopColor={bone ? C.paper : C.sky} />
          <stop offset="0.75" stopColor={bone ? '#E8DDC0' : '#3A1626'} />
          <stop offset="1" stopColor={bone ? '#D6CAAB' : '#14080F'} />
        </linearGradient>
        <linearGradient id="oakg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7A4E2A" /><stop offset="1" stopColor="#4A2D18" /></linearGradient>
        <linearGradient id="shaft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.glow} stopOpacity={bone ? 0.22 : 0.3} /><stop offset="1" stopColor={C.glow} stopOpacity={0} /></linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#wallg)" />
      {Array.from({length: 9}).map((_, i) => <rect key={i} x={i * 130 - 20} y={300} width={110} height={900} rx={6} fill={bone ? '#000' : '#000'} opacity={bone ? 0.035 : 0.16} />)}
      {Array.from({length: 4}).map((_, i) => <rect key={`t${i}`} x={90 + i * 270} y={150} width={190} height={110} rx={10} fill="none" stroke={bone ? '#B9AC88' : '#5E2A3C'} strokeWidth={5} opacity={0.6} />)}
      <rect x={70} y={380} width={300} height={560} rx={8} fill={bone ? '#EFE4C6' : '#F2B766'} opacity={bone ? 0.5 : 0.28 + 0.2 * sun} stroke={bone ? '#B9AC88' : '#7A4E2A'} strokeWidth={10} />
      <line x1={220} y1={380} x2={220} y2={940} stroke={bone ? '#B9AC88' : '#7A4E2A'} strokeWidth={8} />
      <line x1={70} y1={660} x2={370} y2={660} stroke={bone ? '#B9AC88' : '#7A4E2A'} strokeWidth={8} />
      <polygon points={`370,420 ${760 + 200 * sun},1180 ${520 + 200 * sun},1260 370,900`} fill="url(#shaft)" />
      {table && (
        <g>
          <rect x={0} y={1120} width={W} height={20} fill="#A7703B" />
          <rect data-band="ok" x={0} y={1140} width={W} height={780} fill="url(#oakg)" />
          {Array.from({length: 7}).map((_, i) => <line key={i} x1={0} y1={1190 + i * 90} x2={W} y2={1190 + i * 90} stroke="#2F1A0E" strokeWidth={3} opacity={0.5} />)}
        </g>
      )}
      {Array.from({length: 26}).map((_, i) => <circle key={`d${i}`} cx={(i * 211 + f * 0.4) % 1080} cy={(i * 97 + f * 0.25) % 1500} r={1.6 + (i % 3)} fill={C.glow} opacity={0.12 + 0.14 * Math.abs(Math.sin(f / 50 + i))} />)}
    </svg>
  );
};

/** plates fade in at their beat and out just before the next. */
const win = (f: number, a: number, nxt: number) => easeIO(f, a + 4, 10) * (nxt < 99999 ? 1 - easeIO(f, nxt - 12, 8) : 1);
// ---- props -----------------------------------------------------------------------------------------------------------------------------
/** the draft sheet: a paper with a header, grey lines, optional cyan machine-written lines, a highlighter pass and an edit mark. */
const Sheet: React.FC<{x: number; y: number; w?: number; h?: number; rot?: number; title?: string; cy?: number; hl?: number; mark?: number; cyLabel?: string; hlText?: string; s?: number}> =
({x, y, w = 420, h = 540, rot = 0, title = 'AI ENGAGED', cy = 0, hl = 0, mark = 0, cyLabel, hlText, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} rx={8} fill="#000" opacity={0.3} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <text x={-w / 2 + 28} y={-h / 2 + 56} fontFamily={MONO} fontWeight={800} fontSize={34} fill={C.ink}>{title}</text>
    <line x1={-w / 2 + 24} y1={-h / 2 + 76} x2={w / 2 - 24} y2={-h / 2 + 76} stroke={C.hero} strokeWidth={6} />
    {Array.from({length: 9}).map((_, i) => {
      const yy = -h / 2 + 118 + i * 44;
      const isCy = i < 3 && cy > 0;
      const wlen = (w - 70) * (0.55 + ((i * 37) % 40) / 100);
      return (
        <g key={i}>
          <rect x={-w / 2 + 28} y={yy} width={wlen} height={12} rx={4} fill={C.ink} opacity={0.22} />
          {isCy && <rect x={-w / 2 + 28} y={yy} width={wlen * clamp01(cy * 3 - i)} height={12} rx={4} fill={C.accent} />}
        </g>
      );
    })}
    {cyLabel && cy > 0.3 && <text x={-w / 2 + 28} y={-h / 2 + 150} fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.accent} opacity={clamp01(cy)}>{cyLabel}</text>}
    {hl > 0 && <rect x={-w / 2 + 14} y={h / 2 - 150} width={(w - 28) * hl} height={46} rx={6} fill={C.glow} opacity={0.75} />}
    {hlText && <text x={-w / 2 + 24} y={h / 2 - 118} fontFamily={MONO} fontWeight={800} fontSize={Math.min(26, (w - 48) / (hlText.length * 0.62))} fill={C.ink}>{hlText}</text>}
    {mark > 0 && <path d={`M ${w / 2 - 40},${-h / 2 + 130} q -30,30 0,60 q 30,30 0,60`} fill="none" stroke={C.hero} strokeWidth={9} strokeLinecap="round" opacity={0.5 + 0.5 * mark} />}
  </g>
);

/** a hand and forearm. color cream or cyan; reach 0..1 extends the fingers toward `dir` (+1 pointing right, -1 left). */
const Hand: React.FC<{x: number; y: number; s?: number; rot?: number; color?: string; reach?: number; glow?: number}> = ({x, y, s = 1, rot = 0, color = '#E6B896', reach = 0, glow = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {glow > 0 && <circle cy={-40} r={150} fill={C.accent} opacity={0.2 * glow} />}
    <rect x={-46} y={30 - reach * 20} width={92} height={420} rx={40} fill={color} stroke={C.ink} strokeWidth={7} />
    <rect x={-60} y={300} width={120} height={150} fill="#7B2A3C" stroke={C.ink} strokeWidth={6} />
    <rect x={-62} y={-52 - reach * 28} width={124} height={116} rx={44} fill={color} stroke={C.ink} strokeWidth={7} />
    {[-40, -14, 12, 38].map((fx, i) => <rect key={i} x={fx - 12} y={-122 - reach * 34 + Math.abs(i - 1.5) * 9} width={26} height={84} rx={13} fill={color} stroke={C.ink} strokeWidth={6} />)}
    <rect x={-96} y={-4} width={40} height={74} rx={18} fill={color} stroke={C.ink} strokeWidth={6} transform="rotate(-32 -76 30)" />
    <path d="M -34,-20 q 34,-16 68,0" fill="none" stroke={C.ink} strokeWidth={3} opacity={0.18} />
  </g>
);

/** a pen: nib at the local origin, body rising up-left from there. */
const Pen: React.FC<{x: number; y: number; rot?: number; s?: number; color?: string}> = ({x, y, rot = -30, s = 1, color = C.brass}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={4} cy={6} rx={22} ry={7} fill="#000" opacity={0.3} />
    <path d="M 0,0 L -12,-44 L 12,-44 Z" fill="#D8D2C0" stroke={C.ink} strokeWidth={5} />
    <rect x={-14} y={-300} width={28} height={256} rx={12} fill={color} stroke={C.ink} strokeWidth={6} />
    <rect x={-6} y={-292} width={8} height={170} rx={4} fill="#F3CF73" opacity={0.7} />
    <rect x={-14} y={-130} width={28} height={14} fill={C.ink} opacity={0.5} />
    <rect x={8} y={-290} width={8} height={120} rx={4} fill="#7A4E2A" opacity={0.6} />
  </g>
);

/** a calendar card. flip 0..1 falls it into place. */
const Calendar: React.FC<{x: number; y: number; s?: number; top: string; big: string; sub?: string; rot?: number; flip?: number}> = ({x, y, s = 1, top, big, sub, rot = 0, flip = 1}) => {
  const k = clamp01(flip);
  if (k <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y - (1 - k) * 160}) rotate(${rot + (1 - k) * 18}) scale(${s} ${s * (0.2 + 0.8 * k)})`} opacity={clamp01(k * 2)}>
      <rect x={-8 - 150 + 12} y={-110 + 14} width={300} height={220} rx={12} fill="#000" opacity={0.28} />
      <rect x={-150} y={-110} width={300} height={220} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={6} />
      <rect x={-150} y={-110} width={300} height={62} rx={12} fill={C.hero} stroke={C.ink} strokeWidth={6} />
      <text y={-64} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={2} fill={C.paper}>{top}</text>
      <text y={44} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={big.length > 5 ? 56 : 92} fill={C.ink}>{big}</text>
      {sub && <text y={90} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.hero}>{sub}</text>}
    </g>
  );
};

const Gavel: React.FC<{x: number; y: number; s?: number; hit?: number}> = ({x, y, s = 1, hit = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${-34 + 34 * clamp01(hit)}) scale(${s})`}>
    <ellipse cx={0} cy={40} rx={110} ry={14} fill="#000" opacity={0.3} />
    <rect x={-8} y={-30} width={190} height={34} rx={14} fill="#A7703B" stroke={C.ink} strokeWidth={6} />
    <rect x={-60} y={-86} width={110} height={110} rx={16} fill="#7A4E2A" stroke={C.ink} strokeWidth={7} />
    <rect x={-54} y={-76} width={20} height={90} rx={8} fill="#B9814A" opacity={0.7} />
  </g>
);

/** a floor lamp with a sun glow. */
const Lamp: React.FC<{x: number; y: number; s?: number; on?: number}> = ({x, y, s = 1, on = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cy={-250} r={210} fill={C.glow} opacity={0.2 * on} />
    <rect x={-8} y={-210} width={16} height={290} fill={C.brass} stroke={C.ink} strokeWidth={5} />
    <ellipse cx={0} cy={86} rx={64} ry={14} fill={C.brass} stroke={C.ink} strokeWidth={6} />
    <path d="M -80,-220 L 80,-220 L 50,-310 L -50,-310 Z" fill={C.glow} stroke={C.ink} strokeWidth={6} opacity={0.4 + 0.6 * on} />
  </g>
);

/** a stack of draft pages with a cyan edge when `machine`. n pages. */
const Stack: React.FC<{x: number; y: number; n: number; machine?: boolean; badge?: string; rot?: number; label?: string}> = ({x, y, n, machine = false, badge, rot = 0, label}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <ellipse cx={0} cy={22} rx={190} ry={20} fill="#000" opacity={0.3} />
    {Array.from({length: Math.max(1, Math.floor(n))}).map((_, i) => (
      <g key={i} transform={`translate(${(i % 3 - 1) * 4} ${-i * 15})`}>
        <rect x={-160} y={-12} width={320} height={26} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} />
        {machine && <rect x={-160} y={4} width={320} height={6} fill={C.accent} opacity={0.9} />}
      </g>
    ))}
    {badge && (
      <g transform={`translate(0 ${-Math.max(1, Math.floor(n)) * 15 - 36})`}>
        <circle r={44} fill={C.hero} stroke={C.ink} strokeWidth={6} />
        <text y={13} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={36} fill={C.paper}>{badge}</text>
      </g>
    )}
    {label && <Lab text={label} x={0} y={64} size={20} tone="plate" />}
  </g>
);

const Chair: React.FC<{x: number; y: number; s?: number; tag?: string; lit?: number; dim?: boolean}> = ({x, y, s = 1, tag, lit = 0, dim = false}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={dim ? 0.62 : 1}>
    <ellipse cx={0} cy={70} rx={64} ry={14} fill="#000" opacity={0.3} />
    {lit > 0 && <circle cy={-10} r={110} fill={C.glow} opacity={0.3 * lit} />}
    <rect x={-44} y={-96} width={88} height={92} rx={16} fill={lit > 0.5 ? '#B9506A' : C.hero} stroke={C.ink} strokeWidth={6} />
    <rect x={-52} y={-8} width={104} height={34} rx={12} fill="#A7703B" stroke={C.ink} strokeWidth={6} />
    <path d="M -38,26 L -44,70 M 38,26 L 44,70" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
    {tag && <Lab text={tag} x={0} y={-130} size={20} tone="plate" />}
  </g>
);

const TOKEN_Y = 1210;

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; warmth?: number; bg?: string; children: React.ReactNode}> =
({p, cam, z0 = 1.02, z1 = 1.2, bloom = 0.05, vignette = 0.28, ox = 540, oy = 960, warmth = 0.02, bg = 'wall', children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 50 * Math.sin(p.f / 110) + 30 * t, fy: oy};
  return (
    <AbsoluteFill>
      <Room f={p.f} v={bg} table={bg !== 'floor'} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 4 * Math.sin(p.f / 23)}px, ${jl.y + 5 * Math.sin(p.f / 17 + 1) + 4 * t}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill={C.ink} stroke="#F1E8D0" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F1E8D0">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.07} warmth={warmth} />
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


// ---- S1: the press, the first mint line, the calendar --------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const write = clamp01((f - b(2)) / 70);
  const slide = easeIO(f, b(28), 30);
  const cal = ease(f, b(3), 26);
  const card = springy(f, b(39), 22);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.0, fx: 560, fy: 960}, {t: p.dur, z: 1.07, fx: 560, fy: 980}])}>
      <SVG>
<g transform="translate(0 60)">
        <DiplomaPress f={f} x={660} y={930} scale={0.9} pull={0.1 + 0.05 * Math.sin(f / 18) + 0.1 * bump(f, b(2), 40)} tokenText="WHO WROTE IT?" dieText="AI ENGAGED" machine />
        {write > 0 && <path d="M 975,770 C 800,640 520,640 330,800" fill="none" stroke={C.accent} strokeWidth={5} strokeDasharray="14 12" strokeDashoffset={-f * 3} opacity={0.8 * Math.sin(Math.PI * clamp01(write))} />}
        <Sheet x={lerp(280, 270, slide)} y={lerp(930, 1010, slide)} w={380} h={500} rot={lerp(-4, -6, slide)} title="AI ENGAGED" cy={write} cyLabel={write > 0.5 ? 'CLAUDE?' : undefined} s={1 - 0.08 * slide} />
        <Calendar x={870} y={1215} s={0.62} top="NOVEMBER" big="MEETING" flip={cal} />
        <g transform={`translate(480 ${lerp(1180, 1256, card)})`} opacity={clamp01(card * 2)}>
          <path d="M -150,0 L 150,0 L 134,-62 L -134,-62 Z" fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={-20} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={2} fill={C.ink}>REGENTS</text>
        </g>
        </g>
        <Plate text={'AI ENGAGED'} x={540} y={600} size={30} p={win(f, b(1), b(2))} /> {/* plate-overlap-ok */}
        <Plate text={'TWO PROFESSORS SAY CLAUDE WROTE THE FIRST DRAFT'} displayLines={['TWO PROFESSORS SAY', 'CLAUDE WROTE THE FIRST DRAFT']} x={540} y={600} size={26} p={win(f, b(2), b(28))} /> {/* plate-overlap-ok */}
        <Plate text={'THE PLAN ABOUT CHATBOTS'} x={540} y={600} size={28} p={win(f, b(28), b(3))} /> {/* plate-overlap-ok */}
        <Plate text={'REGENTS · NOVEMBER MEETING'} x={540} y={600} size={28} p={win(f, b(3), b(39))} /> {/* plate-overlap-ok */}
        <Plate text={'BOARD OF REGENTS'} x={540} y={600} size={30} p={win(f, b(39), 99999)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S2: the pen between two hands -------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const swing = Math.sin(f / 16) * (1 - ease(f, b(5), 10));
  const reachH = 0.8 * bump(f, b(29), 50) + 0.1;
  const reachM = ease(f, b(5) - 10, 18);
  const cal = ease(f, b(6), 24);
  const hush = easeIO(f, b(6), 36);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.08, fx: 520, fy: 980}])}>
      <SVG>
<g transform="translate(0 60)">
        <Sheet x={360} y={1000} w={520} h={660} title="AI ENGAGED" cy={ease(f, b(5), 40)} cyLabel="CLAUDE" />
        <Hand x={150} y={1230} s={1} rot={14} reach={reachH} color="#C98F6B" />
        <Hand x={880} y={1200} s={1} rot={-14} reach={reachM} color={C.accent} glow={reachM} />
        <Pen x={lerp(360, 470, 0.5 + 0.5 * swing)} y={lerp(880, 1010, reachM)} rot={22 + 14 * swing} s={1.1} />
        <Calendar x={820} y={720} s={0.8} top="OCTOBER" big="9" flip={cal} />
        <g transform={`translate(360 ${lerp(900, 640, hush)}) rotate(-6)`} opacity={cal * (1 - hush * 0.7)}>
          <rect x={-110} y={-36} width={220} height={72} rx={10} fill={C.hero} stroke={C.ink} strokeWidth={6} />
          <text y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} fill={C.paper}>HUSH</text>
        </g>
        </g>
        <Plate text={'WHO HELD THE PEN?'} x={540} y={600} size={34} p={win(f, b(4), b(29))} /> {/* plate-overlap-ok */}
        <Plate text={'HUMAN OR MACHINE?'} x={540} y={600} size={32} p={win(f, b(29), b(5))} /> {/* plate-overlap-ok */}
        <Plate text={'THEY SAY · CLAUDE'} x={540} y={600} size={30} p={win(f, b(5), b(6))} /> {/* plate-overlap-ok */}
        <Plate text={'OCT 9TH · THEY SAY'} x={540} y={600} size={30} p={win(f, b(6), 99999)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S3: two stacks, the lamp, the empty note card ----------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const grow = 1 + 7 * clamp01((f - b(7)) / 60);
  const slip = springy(f, b(8), 22);
  const merge = easeIO(f, b(9), 26);
  const bubble = ease(f, b(10), 14);
  const flare = bump(f, b(40), 22);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.0, fx: 540, fy: 990}, {t: p.dur, z: 1.1, fx: 540, fy: 1000}])}>
      <SVG>
<g transform="translate(0 60)">
        <Lamp x={110} y={1100} s={1.05 + 0.1 * flare} on={0.7 + 0.5 * flare} />
        <Sheet x={930} y={1180} w={200} h={260} rot={6} title="AI ENGAGED" s={0.6} />
        <Stack x={lerp(400, 470, merge)} y={1130} n={grow} badge="UA" label={merge < 0.1 ? 'UA TECH CHIEF · SUMMER' : undefined} />
        <Stack x={lerp(830, 640, merge)} y={1130} n={4} machine rot={4} label={merge < 0.1 ? 'CLAUDE · THEY SAY' : undefined} />
        <g transform={`translate(${lerp(520, 270, slip)} ${lerp(700, 930, slip)}) rotate(${lerp(-20, -6, slip)})`} opacity={clamp01(slip * 2)}>
          <rect x={-130} y={-34} width={260} height={68} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.hero}>REGENTS' REQUEST</text>
        </g>
        <Sheet x={540} y={lerp(880, 800, merge)} w={300} h={390} s={merge * 0.7} title="AI ENGAGED" cy={0} />
        <g transform={`translate(540 ${700 - 18 * bubble}) scale(${bubble})`} opacity={bubble}>
          <rect x={-120} y={-62} width={240} height={124} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={72} fill={C.ink} opacity={0.25 + 0.5 * Math.abs(Math.sin(f / 10))}>?</text>
        </g>
        </g>
        <Plate text={'UA TECH CHIEF DRAFTED OVER THE SUMMER'} displayLines={['UA TECH CHIEF', 'DRAFTED OVER THE SUMMER']} x={540} y={600} size={28} p={win(f, b(7), b(40))} /> {/* plate-overlap-ok */}
        <Plate text={'OVER THE SUMMER'} x={540} y={600} size={30} p={win(f, b(40), b(8))} /> {/* plate-overlap-ok */}
        <Plate text="AT THE REGENTS' REQUEST" x={540} y={600} size={28} p={win(f, b(8), b(9))} /> {/* plate-overlap-ok */}
        <Plate text={'BOTH CAN BE TRUE'} x={540} y={600} size={30} p={win(f, b(9), b(10))} /> {/* plate-overlap-ok */}
        <Plate text={'WE FOUND NO UA RESPONSE'} x={540} y={600} size={28} p={win(f, b(10), 99999)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S4: the wall of 150 name tags, the rise ------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tags = Array.from({length: 150});
  const bar = easeIO(f, b(13), 40);
  const lab = springy(f, b(31), 20);
  const src = ease(f, b(30), 14);
  return (
    <Frame p={p} cam={track([{t: 0, z: 2.6, fx: 100, fy: 700}, {t: 24, z: 1.0, fx: 540, fy: 920}, {t: p.dur, z: 1.08, fx: 540, fy: 1000}])}>
      <SVG>
<g transform="translate(0 60)">
        <rect x={50} y={680} width={980} height={380} rx={10} fill="#3B1F14" stroke={C.ink} strokeWidth={6} />
        {tags.map((_, i) => {
          const col = i % 15, row = Math.floor(i / 15);
          const x = 76 + col * 62, y = 704 + row * 34;
          const flip = clamp01((f - b(12) - (col + row * 1.3) * 2.4) / 14);
          const on = i < 119 && flip > 0;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <rect width={54} height={27} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} transform={`scale(1 ${1 - 0.4 * Math.sin(flip * Math.PI)})`} />
              <rect x={5} y={8} width={30} height={4} fill={C.ink} opacity={0.35} />
              {on && <rect x={4} y={21} width={46 * flip} height={4} fill={C.accent} />}
            </g>
          );
        })}
        <g opacity={src} transform="translate(330 1090)"><Lab text="VIA ADN · UAA REPORT" x={0} y={0} size={22} p={src} /></g>
        <g opacity={bar} transform="translate(0 0)">
          <line x1={220} y1={1330} x2={860} y2={1330} stroke={C.ink} strokeWidth={6} />
          <rect x={300} y={1330 - 150} width={170} height={150} fill={C.chalk} stroke={C.ink} strokeWidth={6} />
          <text x={385} y={1318} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>YEAR BEFORE</text>
          <rect x={620} y={1330 - 150 * (1 + 0.73 * bar)} width={170} height={150 * (1 + 0.73 * bar)} fill={C.chalk} stroke={C.ink} strokeWidth={6} />
          <line x1={300} y1={1180} x2={860} y2={1180} stroke={C.glow} strokeWidth={4} strokeDasharray="10 8" />
        </g>
        <g transform={`translate(880 1180) scale(${lab})`} opacity={clamp01(lab * 2)}><Lab text="+73%" x={0} y={0} size={34} tone="glow" /><Lab text="LAST YEAR" x={0} y={50} size={20} tone="plate" /></g>
        <Sheet x={950} y={1190} w={200} h={260} rot={8} title="AI ENGAGED" s={0.6} />
        </g>
        <Plate text={'150 STUDENTS CITED UAA REPORT'} displayLines={['150 STUDENTS CITED', 'UAA REPORT']} x={540} y={610} size={28} p={win(f, b(11), b(42))} /> {/* plate-overlap-ok */}
        <Plate text={'CITED FOR MISCONDUCT'} x={540} y={610} size={28} p={win(f, b(42), b(12))} /> {/* plate-overlap-ok */}
        <Plate text={'119 OF 150 CITED USED AI'} displayLines={['119 OF 150 CITED', 'USED AI']} x={540} y={610} size={30} p={win(f, b(12), b(30))} /> {/* plate-overlap-ok */}
        <Plate text={'VIA ADN · UAA REPORT'} x={540} y={610} size={28} p={win(f, b(30), b(13))} /> {/* plate-overlap-ok */}
        <Plate text={'AI PLAGIARISM · UP 73% LAST YEAR'} displayLines={['AI PLAGIARISM · UP 73%', 'LAST YEAR']} x={540} y={610} size={28} p={win(f, b(13), b(31))} /> {/* plate-overlap-ok */}
        <Plate text={'+73% · LAST YEAR'} x={540} y={610} size={30} p={win(f, b(31), 99999)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S5: the printed map on the table, three campus flags ----------------------------------------------------------------------------------
const FLAGS = [{n: 'ANCHORAGE', x: 470, y: 760}, {n: 'FAIRBANKS', x: 620, y: 700}, {n: 'JUNEAU', x: 800, y: 900}];
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const band = easeIO(f, b(15), 34);
  const merge = easeIO(f, b(32), 26);
  const pts = FLAGS.map((q) => `${q.x},${q.y - 20}`);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.1, fx: 560, fy: 960}])}>
      <SVG>
<g transform="translate(0 60)">
        <rect x={110} y={560} width={860} height={640} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={6} transform="rotate(-1.5 540 880)" />
        <g transform="translate(150 590) scale(0.8)"><path d={AK_PATH} fill="#D9C79B" stroke={C.ink} strokeWidth={4} /></g>
        <polygon points={pts.join(' ')} fill="none" stroke={C.accent} strokeWidth={7} strokeDasharray="800" strokeDashoffset={800 * (1 - band)} opacity={band} />
        {FLAGS.map((q, i) => {
          const pop = springy(f, b(14) + i * 6, 18);
          const book = ease(f, b(14) + 10 + i * 6, 14) * (1 - merge);
          return (
            <g key={q.n} transform={`translate(${lerp(q.x, 620, merge * 0.0)} ${q.y})`}>
              <line x1={0} y1={0} x2={0} y2={-60 * pop} stroke={C.ink} strokeWidth={6} />
              <rect x={0} y={-60 * pop} width={46} height={30} fill={C.hero} stroke={C.ink} strokeWidth={4} />
              <rect x={-34} y={10} width={34} height={44} rx={3} fill={C.chalk} stroke={C.ink} strokeWidth={4} opacity={book} transform={`rotate(${-8 + 6 * Math.sin(f / 10 + i)} -17 30)`} />
              <Lab text={q.n} x={0} y={86} size={18} p={pop} />
            </g>
          );
        })}
        <g transform={`translate(640 800) scale(${merge})`} opacity={merge}>
          <rect x={-70} y={-40} width={140} height={86} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} fill={C.ink}>ONE PLAN</text>
        </g>
        <Sheet x={880} y={1130} w={220} h={290} rot={6} title="AI ENGAGED" s={0.62} />
        </g>
        <Plate text={'NO SINGLE AI POLICY TODAY'} x={540} y={600} size={28} p={win(f, b(14), b(37))} /> {/* plate-overlap-ok */}
        <Plate text={'3 CAMPUSES'} x={540} y={600} size={30} p={win(f, b(37), b(15))} /> {/* plate-overlap-ok */}
        <Plate text={'IF APPROVED ALL 3 CAMPUSES NEED A PLAN'} displayLines={['IF APPROVED', 'ALL 3 CAMPUSES NEED A PLAN']} x={540} y={600} size={26} p={win(f, b(15), b(32))} /> {/* plate-overlap-ok */}
        <Plate text={'ONE PLAN · THREE CAMPUSES'} x={540} y={600} size={28} p={win(f, b(32), 99999)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S6: THE FAIR CASE, the signature shot -----------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pull = easeIO(f, b(17), 26) * 0.4;
  const brake = ease(f, b(18) - 4, 8);
  const hum = bump(f, b(33), 40);
  const glint = ease(f, b(18) - 2, 10);
  const card = springy(f, b(19), 22);
  return (
    <Frame p={p} bg="bone" cam={track([{t: 0, z: 1.0, fx: 560, fy: 950}, {t: b(18) + 6, z: 1.12, fx: 570, fy: 980}, {t: p.dur, z: 1.12, fx: 570, fy: 980}])}>
      <SVG>
<g transform="translate(0 60)">
        {hum > 0 && <circle cx={420} cy={880} r={150 * hum + 40} fill={C.glow} opacity={0.25 * hum} />}
        <DiplomaPress f={f} x={700} y={940} scale={0.85} pull={pull} brake={brake} tokenText="WHO WROTE IT?" dieText="AI ENGAGED" machine examiner />
        {glint > 0 && <circle cx={405} cy={880} r={60} fill={C.glow} opacity={0.4 * glint * (1 - 0.5 * Math.sin(f / 5) ** 2)} />}
        <Sheet x={930} y={1200} w={200} h={260} rot={6} title="AI ENGAGED" s={0.6} mark={ease(f, b(33), 20)} />
        <g transform={`translate(300 ${lerp(1180, 1060, card)}) rotate(-4)`} opacity={clamp01(card * 2)}>
          <rect x={-170} y={-70} width={340} height={140} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={-14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>"BE DELIBERATE"</text>
          <text y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.hero}>UA OFFICIAL</text>
        </g>
        </g>
        <Plate text={'THE FAIR CASE'} x={540} y={600} size={36} tone="plate" p={win(f, b(16), b(33))} /> {/* plate-overlap-ok */}
        <Plate text={'HUMAN IN THE LOOP'} x={540} y={600} size={30} tone="plate" p={win(f, b(33), b(17))} /> {/* plate-overlap-ok */}
        <Plate text={'AI COULD RECOMMEND'} x={540} y={600} size={30} tone="plate" p={win(f, b(17), b(18))} /> {/* plate-overlap-ok */}
        <Plate text={'BUT A HUMAN DECIDES'} x={540} y={600} size={32} tone="plate" p={win(f, b(18), b(19))} /> {/* plate-overlap-ok */}
        <Plate text={'"BE DELIBERATE" · UA OFFICIAL'} x={540} y={600} size={26} tone="plate" p={win(f, b(19), 99999)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S7: the empty room from above -----------------------------------------------------------------------------------------------------------------
const TopChair: React.FC<{x: number; y: number; rot?: number; tag?: string; dim?: boolean; tip?: number}> = ({x, y, rot = 0, tag, dim = false, tip = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot + tip})`} opacity={dim ? 0.7 : 1}>
    <ellipse cx={4} cy={8} rx={56} ry={50} fill="#000" opacity={0.3} />
    <rect x={-48} y={-44} width={96} height={88} rx={20} fill={dim ? '#5A2A32' : C.cuff} stroke={C.ink} strokeWidth={6} />
    <rect x={-48} y={-54} width={96} height={26} rx={12} fill="#6E1A29" stroke={C.ink} strokeWidth={6} />
  </g>
);
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pass = clamp01((f - b(34)) / 70);
  const mark = ease(f, b(21), 12);
  const dim = ease(f, b(22), 20);
  const tip = bump(f, b(35), 24) * 10;
  const seats = [[330, 770, 0], [540, 770, 0], [750, 770, 0], [250, 1000, 90], [830, 1000, -90], [330, 1230, 180], [540, 1230, 180], [750, 1230, 180]] as const;
  const penAt = Math.min(2, Math.floor(pass * 3));
  const pa = seats[[0, 1, 2][penAt]];
  return (
    <Frame p={p} bg="floor" cam={track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.1, fx: 540, fy: 1020}])}>
      <SVG>
<g transform="translate(0 60)">
        <rect x={290} y={830} width={500} height={340} rx={30} fill="#A7703B" stroke={C.ink} strokeWidth={8} />
        <rect x={310} y={850} width={460} height={300} rx={20} fill="#B9814A" opacity={0.7} />
        {seats.map((s, i) => <TopChair key={i} x={s[0]} y={s[1]} rot={s[2]} dim={i === 5 || i === 7} tip={(i === 5 ? 1 : i === 7 ? -1 : 0) * tip} />)}
        <Lab text="FACULTY" x={330} y={1310} size={24} tone="plate" p={ease(f, b(22), 12)} />
        <Lab text="STUDENTS" x={750} y={1310} size={24} tone="plate" p={ease(f, b(22), 12)} />
        <Sheet x={540} y={1000} w={260} h={320} rot={-6} title="AI ENGAGED" s={0.8} mark={mark} />
        <Pen x={pa[0]} y={pa[1] + 70} rot={-20} s={0.8} />
        </g>
        <Plate text="A FIRST DRAFT ISN'T A FLAW" x={540} y={600} size={28} p={win(f, b(20), b(34))} /> {/* plate-overlap-ok */}
        <Plate text={'WHO READS IT?'} x={540} y={600} size={30} p={win(f, b(34), b(21))} /> {/* plate-overlap-ok */}
        <Plate text={'WHO GETS TO CHANGE IT?'} x={540} y={600} size={28} p={win(f, b(21), b(22))} /> {/* plate-overlap-ok */}
        <Plate text={'SUMMER DRAFT TOO LITTLE FEEDBACK'} displayLines={['SUMMER DRAFT', 'TOO LITTLE FEEDBACK']} x={540} y={600} size={28} p={win(f, b(22), b(35))} /> {/* plate-overlap-ok */}
        <Plate text={'FACULTY · STUDENTS'} x={540} y={600} size={30} p={win(f, b(35), 99999)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S8: the highlight, the drop stamp, the quote card ---------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const hl = easeIO(f, b(23), 26);
  const words = ease(f, b(38), 10);
  const drop = ease(f, b(24), 12);
  const card = springy(f, b(25), 20);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.08, fx: 520, fy: 990}])}>
      <SVG>
<g transform="translate(0 60)">
        <Sheet x={380} y={1000} w={560} h={720} title="AI ENGAGED" mark={1} hl={hl} hlText={words > 0.5 ? 'WHOEVER HELD THE PEN' : undefined} />
        <g transform="translate(380 760) rotate(-12)" opacity={0.6 * drop}>
          <text textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={84} fill="none" stroke={C.ink} strokeWidth={5}>DROP IT</text>
        </g>
        <g transform={`translate(760 ${lerp(1330, 1180, card)}) rotate(5)`} opacity={clamp01(card * 2)}>
          <rect x={-190} y={-84} width={380} height={168} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={-10} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={32} fill={C.ink}>"WRONG APPROACH"</text>
          <text y={40} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.hero}>HARTLEY AND POTTER</text>
        </g>
        </g>
        <Plate text={'THE PART TO WATCH'} x={540} y={600} size={30} p={win(f, b(23), b(38))} /> {/* plate-overlap-ok */}
        <Plate text={'WHOEVER HELD THE PEN'} x={540} y={600} size={30} p={win(f, b(38), b(24))} /> {/* plate-overlap-ok */}
        <Plate text={'DROP THE PLAN · THEY SAY'} x={540} y={600} size={28} p={win(f, b(24), 99999)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S9: the button, an unsigned sheet before two dark chairs -----------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const still = ease(f, b(26), 14);
  const lit = ease(f, b(36), 18);
  const land = easeIO(f, b(27), 30);
  const lift = bump(f, b(41), 40);
  const dusk = clamp01((f - b(41)) / Math.max(1, p.dur - b(41)));
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.1, fx: 560, fy: 1020}])}>
      <SVG>
<g transform="translate(0 60)">
        <DiplomaPress f={f} x={220} y={960} scale={0.5} pull={0.1 * (1 - still)} machine tokenText="WHO WROTE IT?" dieText="AI ENGAGED" />
        {lit > 0 && <circle cx={330} cy={800} r={120} fill={C.accent} opacity={0.3 * lit} />}
        <Sheet x={650} y={lerp(980, 1040, land)} w={380} h={500} title="AI ENGAGED" mark={1} s={1 - 0.06 * land} />
        <g transform="translate(650 1150)">
          <line x1={-150} y1={0} x2={150} y2={0} stroke={C.ink} strokeWidth={6} />
          <text y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill={C.paper}>SIGNATURE</text>
        </g>
        <Pen x={760} y={1120 - 70 * lift - 0} rot={-24 + 10 * lift} s={0.9} />
        <Chair x={860} y={1060} s={0.75} tag="FACULTY" dim />
        <Chair x={990} y={1060} s={0.75} tag="STUDENTS" dim />
        <rect data-band="ok" x={-100} y={-100} width={1300} height={2200} fill={C.shadow} opacity={0.5 * dusk} />
        </g>
        <Plate text={'A HUMAN DECIDES THE UNIVERSITY SAYS'} displayLines={['A HUMAN DECIDES', 'THE UNIVERSITY SAYS']} x={540} y={600} size={28} p={win(f, b(26), b(41))} /> {/* plate-overlap-ok */}
        <Plate text={'UNSIGNED'} x={540} y={600} size={30} p={win(f, b(41), b(36))} /> {/* plate-overlap-ok */}
        <Plate text={'WHO WROTE IT?'} x={540} y={600} size={30} p={win(f, b(36), b(27))} /> {/* plate-overlap-ok */}
        <Plate text={'WHO WAS ASKED?'} x={540} y={600} size={36} tone="glow" p={win(f, b(27), 99999)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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

export const ep1105Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1105Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1105: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 13.68, 26.36, 40.92, 57.06, 68.24, 82.82, 96.58, 106.06, 113.96].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.sky}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1A0A10" ink="#F1E8D0" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
