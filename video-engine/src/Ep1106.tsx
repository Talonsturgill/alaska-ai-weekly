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
import {StampBot, QuestionToken} from './lib/credentials';
import {AK_PATH} from './lib/akmap';
import {IDS} from './Ep1106Ids';

// Who Wrote the Rules, 2026-11-06. Palette roles are art_direction.json. STAMPBOT is the mint clerk robot, the shelf's credentials.tsx hero.
// THE TOKEN is the throughline, a gold question token whose engraving changes: WHO WROTE THIS? ASK THE CLASS, A PERSON DECIDES, NOT DISCLOSED UNTIL OCT 9TH, WHO WAS THERE? DISCLOSED.
// Raspberry ink is REJECTED, DISCLOSED and HIDDEN? only. Mint is StampBot only. Cream paper is the Plan Sheet and plates.
// (old header follows) The Door Is Yours, 2026-11-02. Palette roles are art_direction.json. CLICKY is a gunmetal faced counter on the dash of a night cab, the car's own recorder.
// THE FOB is the throughline, a nickel key fob whose tag changes: ENROLLED? (S1), ? (S3), NOT ENROLLED (S7), dark (S9), ASK FIRST (S10), YES? (S12), YOUR CALL (S13).
// Amber is LIGHT only. Magenta is ALLEGED, NOT ENROLLED and NO ADMISSION only. Teal is the data stream. Bone paper lives in S8 and S9 only.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

export const C = {
  sky: '#D9641A', ground: '#8F3B12', gun: '#6B7A86', gunD: '#46535C', glow: '#FFC36B', mag: '#E3175F', shadow: '#4A1D08', paper: '#FFF6D6', ink: '#1B1230',
  dash: '#0A4A50', teal: '#0E6B73', fob: '#D9A441', white: '#FFF8EA', cream: '#FFE9A8', mint: '#83D9B1', gold: '#D9A441',
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
  dark: {fill: '#0F0D2B', fg: '#EDE6D3', edge: '#EDE6D3'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.mag, edge: C.mag},
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


const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; warmth?: number; bg?: string; children: React.ReactNode}> =
({p, cam, z0 = 1.02, z1 = 1.2, bloom = 0.05, vignette = 0.28, ox = 540, oy = 960, warmth = 0.02, bg = C.sky, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 50 * Math.sin(p.f / 110) + 30 * t, fy: oy};
  return (
    <AbsoluteFill>
      <Atmos f={p.f} bg={bg} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 4 * Math.sin(p.f / 23)}px, ${jl.y + 5 * Math.sin(p.f / 17 + 1) + 4 * t}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill={C.ink} stroke="#EDE6D3" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#EDE6D3">{CHIP}</text>
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
// ---- the world -----------------------------------------------------------------------------------------------------------------------
/** the daylight office: tangerine wall, a window light bar that drifts once per shot, a teal desk along the bottom. */
const Atmos: React.FC<{f: number; bg: string}> = ({f, bg}) => {
  const sw = ((f % 330) / 330);
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F07A2A" />
          <stop offset="0.35" stopColor={bg} />
          <stop offset="0.8" stopColor="#B24A14" />
          <stop offset="1" stopColor="#8F3B12" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFE9A8" stopOpacity={0.5} /><stop offset="1" stopColor="#FFE9A8" stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#wall)" />
      <ellipse cx={200} cy={170} rx={460} ry={320} fill="url(#sun)" />
      <g opacity={0.9}>
        <rect x={720} y={90} width={270} height={330} rx={10} fill="#F6C98B" stroke="#4A1D08" strokeWidth={8} />
        <path d="M 855,90 V 420 M 720,255 H 990" stroke="#4A1D08" strokeWidth={8} />
        <path d="M 735,110 L 835,110 L 735,230 Z" fill="#FFF2CC" opacity={0.7} />
      </g>
      {Array.from({length: 22}).map((_, i) => <circle key={i} cx={(i * 173) % 1080} cy={(i * 97) % 520} r={2 + (i % 3)} fill="#FFE9A8" opacity={0.12 + 0.12 * Math.abs(Math.sin(f / 50 + i))} />)}
      <rect x={lerp(-400, 1500, sw)} y={0} width={200} height={H} fill="#FFF2CC" opacity={0.07} transform="skewX(-14)" />
      <rect x={0} y={1180} width={W} height={740} fill={C.dash} />
      <rect x={0} y={1180} width={W} height={14} fill="#06292C" />
      <rect x={0} y={1194} width={W} height={60} fill="#000" opacity={0.18} />
    </svg>
  );
};

const CHIP2 = 'ILLUSTRATION';

/** a vertical run of plates that hand off one to the next. items[i] shows from b(k) to b(next k) - 10; the last stays. */
type PI = {k: number; text?: string; lines?: string[]; size?: number; tone?: Tone};
const Seq: React.FC<{f: number; b: (id: number) => number; items: PI[]; ys?: number[]}> = ({f, b, items, ys = [563, 640, 717, 794]}) => (
  <g>
    {items.map((it, i) => {
      const nxt = items[i + 1];
      const pin = ease(f, b(it.k), 14);
      const pout = nxt ? ease(f, b(nxt.k) - 10, 8) : 0;
      return <Plate key={i} x={540} y={ys[i] ?? ys[ys.length - 1]} text={it.text ?? (it.lines ?? []).join(' ')} displayLines={it.lines} size={it.size ?? 30} tone={it.tone ?? 'dark'} p={pin * (1 - pout)} />;
    })}
  </g>
);

const ASSET = (p: string) => p;

/** a cream legal-pad sheet with an optional footnote strip. fill 0..1 types the disclosure line, lit lights the bulb. */
const Sheet: React.FC<{x: number; y: number; s?: number; rot?: number; title?: string; strip?: boolean; fill?: number; lit?: boolean; f?: number}> = ({x, y, s = 1, rot = 0, title = 'AI ENGAGED', strip = true, fill = 0, lit = false, f = 0}) => {
  const line = 'DRAFTED WITH AI · DECIDED BY PEOPLE';
  const shown = line.slice(0, Math.round(line.length * clamp01(fill)));
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={0} cy={236} rx={190} ry={16} fill="#000" opacity={0.35} />
      <rect x={-170} y={-230} width={340} height={460} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={7} />
      <rect x={-170} y={-230} width={340} height={46} rx={10} fill={C.cream} stroke={C.ink} strokeWidth={7} />
      <text x={0} y={-198} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={2} fill={C.ink}>{title}</text>
      {Array.from({length: 8}).map((_, i) => <path key={i} d={`M -140,${-140 + i * 36} H ${i % 3 === 2 ? 60 : 140}`} stroke={C.teal} strokeWidth={5} opacity={0.35} />)}
      {strip && (
        <g transform="translate(0 190)">
          <rect x={-150} y={-24} width={300} height={48} rx={6} fill={fill > 0 ? '#FFFFFF' : 'none'} stroke={C.ink} strokeWidth={4} strokeDasharray={fill > 0.98 ? '0' : '10 8'} />
          <text x={-140} y={7} fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.ink}>{shown}</text>
          <g transform="translate(170 -34)">
            <circle r={16} fill={lit ? C.glow : '#8B8B8B'} stroke={C.ink} strokeWidth={4} />
            {lit && <circle r={30 + 4 * Math.sin(f / 5)} fill={C.glow} opacity={0.35} />}
          </g>
        </g>
      )}
    </g>
  );
};

/** a student essay: lined sheet, optional red-lined REJECTED stamp. */
const Essay: React.FC<{x: number; y: number; s?: number; rot?: number; rejected?: number; foot?: boolean}> = ({x, y, s = 1, rot = -4, rejected = 0, foot = false}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={150} rx={150} ry={12} fill="#000" opacity={0.35} />
    <rect x={-120} y={-150} width={240} height={300} rx={6} fill={C.white} stroke={C.ink} strokeWidth={6} />
    <text x={-100} y={-110} fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>ESSAY 101</text>
    {Array.from({length: 7}).map((_, i) => <path key={i} d={`M -100,${-70 + i * 28} H ${i === 6 ? 20 : 100}`} stroke={C.ink} strokeWidth={4} opacity={0.4} />)}
    {foot && <text x={-100} y={132} fontFamily={MONO} fontWeight={800} fontSize={11} fill={C.teal}>DRAFTED WITH AI</text>}
    {rejected > 0.01 && (
      <g transform={`rotate(-14) scale(${0.8 + 0.2 * clamp01(rejected)})`} opacity={clamp01(rejected * 2)}>
        <rect x={-100} y={-34} width={200} height={68} rx={6} fill="none" stroke={C.mag} strokeWidth={8} />
        <text y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={36} fill={C.mag}>REJECTED</text>
      </g>
    )}
  </g>
);

/** THE CHATBOT: a steel boxy machine with a face and a pencil. sweat 0..1, stamp text shown on its forehead. */
const Chatbot: React.FC<{f: number; x: number; y: number; s?: number; mood?: 'focused' | 'nervous' | 'wry'; sweat?: number; stamp?: number; pencil?: boolean}> = ({f, x, y, s = 1, mood = 'focused', sweat = 0, stamp = 0, pencil = true}) => {
  const blink = (f % 110) > 104 ? 0.15 : 1;
  return (
    <g transform={`translate(${x} ${y + 4 * Math.sin(f / 19)}) scale(${s})`}>
      <ellipse cx={0} cy={118} rx={100} ry={14} fill="#000" opacity={0.35} />
      <rect x={-92} y={-100} width={184} height={210} rx={22} fill={C.gun} stroke={C.ink} strokeWidth={8} />
      <rect x={-72} y={-80} width={144} height={74} rx={14} fill="#CFD8DE" stroke={C.ink} strokeWidth={5} />
      {[-30, 30].map((ex, i) => <g key={i}><ellipse cx={ex} cy={-44} rx={14} ry={14 * blink} fill={C.white} stroke={C.ink} strokeWidth={3} /><circle cx={ex + (mood === 'wry' ? 5 : 0)} cy={-44} r={5} fill={C.ink} /></g>)}
      <path d={mood === 'nervous' ? 'M -24,-14 q 24,-14 48,0' : mood === 'wry' ? 'M -24,-16 q 24,10 48,-6' : 'M -24,-16 q 24,12 48,0'} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-60} y={12 + i * 22} width={120} height={10} rx={4} fill={C.gunD} stroke={C.ink} strokeWidth={3} />)}
      {pencil && <g transform="translate(78 -76) rotate(24)"><rect x={-6} y={-60} width={12} height={90} rx={3} fill={C.glow} stroke={C.ink} strokeWidth={4} /><path d="M -6,30 L 0,48 L 6,30 Z" fill={C.ink} /></g>}
      {sweat > 0.01 && [0, 1, 2].map((i) => <path key={i} d="M 0,-8 q 9,14 0,22 q -9,-8 0,-22 Z" fill="#9FD7F5" stroke={C.ink} strokeWidth={2.5} transform={`translate(${-96 + i * 16 - 8} ${-70 + ((f * 3 + i * 40) % 90) * sweat})`} opacity={0.85} />)}
      {stamp > 0.01 && (
        <g transform={`translate(0 -112) rotate(-8) scale(${0.7 + 0.3 * clamp01(stamp)})`} opacity={clamp01(stamp * 2)}>
          <rect x={-104} y={-24} width={208} height={48} rx={6} fill={C.paper} stroke={C.mag} strokeWidth={6} />
          <text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={21} fill={C.mag}>BUILT ON CLAUDE</text>
        </g>
      )}
    </g>
  );
};

/** a person: round head, coloured shirt, optional crossed arms, optional held paper. */
const Person: React.FC<{x: number; y: number; s?: number; shirt?: string; skin?: string; arms?: 'crossed' | 'down' | 'up'; label?: string; f?: number; seed?: number; mood?: 'calm' | 'stern'}> = ({x, y, s = 1, shirt = C.teal, skin = '#E7B58F', arms = 'down', label, f = 0, seed = 0, mood = 'calm'}) => (
  <g transform={`translate(${x} ${y + 3 * Math.sin(f / 21 + seed)}) scale(${s})`}>
    <ellipse cx={0} cy={140} rx={62} ry={10} fill="#000" opacity={0.35} />
    <rect x={-48} y={-10} width={96} height={146} rx={30} fill={shirt} stroke={C.ink} strokeWidth={7} />
    <circle cy={-52} r={40} fill={skin} stroke={C.ink} strokeWidth={7} />
    <path d="M -40,-66 q 40,-44 80,0 q -40,-14 -80,0 Z" fill="#3A2218" stroke={C.ink} strokeWidth={4} />
    {[-14, 14].map((ex, i) => <circle key={i} cx={ex} cy={-50} r={4.5} fill={C.ink} />)}
    <path d={mood === 'stern' ? 'M -12,-30 h 24' : 'M -14,-32 q 14,10 28,0'} stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
    {arms === 'crossed' && <g><path d="M -52,30 q 52,28 104,-4" fill="none" stroke={shirt} strokeWidth={26} strokeLinecap="round" /><path d="M -52,30 q 52,28 104,-4" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={0.5} /></g>}
    {arms === 'up' && <path d="M 48,10 L 90,-40" stroke={shirt} strokeWidth={24} strokeLinecap="round" />}
    {label && <text y={168} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.paper}>{label}</text>}
  </g>
);

const Hand: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-30} y={0} width={60} height={160} rx={26} fill="#E7B58F" stroke={C.ink} strokeWidth={6} />
    <rect x={-44} y={-40} width={88} height={64} rx={26} fill="#E7B58F" stroke={C.ink} strokeWidth={6} />
    {[-28, -9, 10, 28].map((fx, i) => <path key={i} d={`M ${fx},-38 v -22`} stroke={C.ink} strokeWidth={3} />)}
  </g>
);

const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color?: string; p?: number}> = ({x1, y1, x2, y2, color = C.ink, p = 1}) => {
  const k = clamp01(p);
  const ex = lerp(x1, x2, k), ey = lerp(y1, y2, k);
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g opacity={clamp01(k * 3)}>
      <path d={`M ${x1},${y1} L ${ex},${ey}`} stroke={color} strokeWidth={22} strokeLinecap="round" />
      <path d={`M ${ex},${ey} l ${-46 * Math.cos(a - 0.5)},${-46 * Math.sin(a - 0.5)} l ${46 * Math.cos(a - 0.5) + 46 * Math.cos(a + 0.5)},${46 * Math.sin(a - 0.5) + 46 * Math.sin(a + 0.5)} Z`} fill={color} stroke={color} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

const Tok: React.FC<{x: number; y: number; s?: number; text: string; glow?: number; rot?: number}> = ({x, y, s = 1, text, glow = 0, rot = 0}) => (
  <g><QuestionToken x={x} y={y} scale={s} rot={rot} text={text} glow={glow} /></g>
);

/** the typewriter: reveals `text` over time, wrapped to rows. */
const Typed: React.FC<{x: number; y: number; rows: string[]; k: number; size?: number; fill?: string}> = ({x, y, rows, k, size = 24, fill = C.ink}) => {
  const total = rows.join('').length;
  let left = Math.round(total * clamp01(k));
  return (
    <g>
      {rows.map((r, i) => {
        const n = Math.max(0, Math.min(r.length, left));
        left -= r.length;
        return <text key={i} x={x} y={y + i * (size + 12)} fontFamily={MONO} fontWeight={800} fontSize={size} fill={fill}>{r.slice(0, n)}</text>;
      })}
    </g>
  );
};

// ---- bands: the throughline strip on top, the missing footnote strip at the bottom --------------------------------------------------------
const TOPS = [{k: 3, t: 'WHO WROTE THIS?'}, {k: 10, t: 'ASK THE CLASS'}, {k: 12, t: 'A PERSON DECIDES'}, {k: 15, t: 'NOT DISCLOSED'}, {k: 19, t: 'WHO WAS THERE?'}, {k: 31, t: 'DISCLOSED'}];
const Bands: React.FC<{beats: Beat[]}> = ({beats}) => {
  const f = useCurrentFrame();
  const at = (k: number) => {
    const x = beats.find((y) => y.id === (IDS[k] ?? k));
    return x ? Math.round(x.at * 30) : 99999;
  };
  const cur = TOPS.filter((q) => f >= at(q.k)).length - 1;
  const fill = clamp01((f - at(26)) / Math.max(20, at(40) - at(26)));
  const line = 'DRAFTED WITH AI · DECIDED BY PEOPLE';
  const lit = f >= at(40);
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <g data-band="ok">
        <text x={60} y={150} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill={C.paper} opacity={0.85}>THE TOKEN · WHO WROTE THIS?</text>
        {TOPS.map((q, i) => {
          const x = 60 + i * 160, on = i <= cur, now = i === cur;
          return (
            <g key={i} transform={`translate(${x} 205)`}>
              <rect x={0} y={-34} width={146} height={68} rx={10} fill={now ? C.gold : on ? '#5E2A0C' : '#7A3A14'} stroke={now ? C.ink : C.paper} strokeWidth={now ? 5 : 3} opacity={on ? 1 : 0.8} />
              <text x={73} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={q.t.length > 13 ? 13 : 16} fill={now ? C.ink : C.paper}>{q.t}</text>
            </g>
          );
        })}
        <line x1={60} y1={270} x2={1020} y2={270} stroke={C.paper} strokeWidth={3} strokeDasharray="6 10" opacity={0.6} />
        <circle cx={60 + Math.max(0, cur) * 160 + 73} cy={270} r={9} fill={C.gold} />
        <rect x={60} y={1600} width={960} height={110} rx={8} fill="#06292C" opacity={0.75} />
        <text x={80} y={1632} fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={2} fill={C.paper} opacity={0.9}>THE PLAN'S AI USE NOTE</text>
        <rect x={80} y={1648} width={860} height={44} rx={6} fill={fill > 0 ? '#FFFFFF' : 'none'} stroke={C.paper} strokeWidth={4} strokeDasharray={fill > 0.98 ? '0' : '12 9'} />
        <text x={96} y={1678} fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>{line.slice(0, Math.round(line.length * fill))}</text>
        <circle cx={985} cy={1670} r={20} fill={lit ? C.glow : '#6B6B6B'} stroke={C.ink} strokeWidth={4} />
        {lit && <circle cx={985} cy={1670} r={34 + 4 * Math.sin(f / 5)} fill={C.glow} opacity={0.3} />}
      </g>
    </svg>
  );
};

// ---- S1: the slam ---------------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slam = ease(f, b(1) - 7, 9);
  const splat = ease(f, b(1) + 2, 12);
  const glow = ease(f, b(2), 18);
  const sheet = easeIO(f, b(3), 24);
  return (
    <Frame p={p} z0={1.03} z1={1.14} oy={900}>
      <SVG>
        <g transform="translate(150 480)">
          {Array.from({length: 150}).map((_, i) => {
            const cx = (i % 15) * 52, cy = Math.floor(i / 15) * 40;
            const lit = i < 119;
            return <circle key={i} cx={cx} cy={cy} r={lit ? 11 + glow * 2 : 10} fill={lit && glow > 0.2 ? C.glow : C.teal} stroke={C.ink} strokeWidth={3} opacity={0.9} />;
          })}
        </g>
        <Essay x={640} y={1010} s={1.05} rejected={slam} />
        {splat > 0.02 && <g opacity={0.9 * (1 - 0.2 * splat)}>
          <circle cx={640} cy={1010} r={30 + 150 * splat} fill={C.mag} opacity={0.22} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={640 + Math.cos(i * 0.9) * 190 * splat} cy={1010 + Math.sin(i * 0.9) * 150 * splat} r={10 + (i % 3) * 7} fill={C.mag} />)}
        </g>}
        <StampBot f={f} x={290} y={1010} reject={slam} />
        <g transform={`translate(${lerp(1350, 800, sheet)} 780)`} opacity={sheet}><Sheet x={0} y={0} s={0.62} rot={6} title="PLAN" strip /></g>
        <Tok x={lerp(1350, 800, sheet)} y={780} s={0.9} text="WHO WROTE THIS?" glow={sheet > 0.9 ? 0.5 : 0} />
        <Seq f={f} b={b} items={[{k: 1, text: 'UAA · 119 OF 150 CITED USED AI', size: 27}, {k: 2, text: '119 OF 150 CITED', size: 34}, {k: 3, text: 'WHO WROTE THIS?', size: 36, tone: 'glow'}]} ys={[563, 563, 563]} />
      </SVG>
    </Frame>
  );
};

// ---- S2: the regents ------------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const flip = ease(f, b(4), 16);
  const pin = springy(f, b(5), 22);
  const eject = easeIO(f, b(6), 30);
  return (
    <Frame p={p} z0={1.03} z1={1.12} oy={960}>
      <SVG>
        <g transform="translate(40 560)">
          <path d={AK_PATH} fill="#F6C98B" stroke={C.ink} strokeWidth={4} opacity={0.95} />
          <path d={AK_PATH} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.5} transform="translate(5 6)" />
        </g>
        <g transform="translate(220 1010)">
          <rect x={-120} y={-130} width={240} height={260} rx={14} fill={C.white} stroke={C.ink} strokeWidth={7} />
          <rect x={-120} y={-130} width={240} height={56} rx={14} fill={C.mag} stroke={C.ink} strokeWidth={7} />
          <g transform={`scale(1 ${Math.max(0.05, Math.abs(Math.cos(flip * Math.PI)))})`}>
            <text y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={flip > 0.5 ? 76 : 70} fill={C.ink}>{flip > 0.5 ? 'MAY' : 'APR'}</text>
          </g>
        </g>
        {[0, 1, 2, 3].map((i) => <g key={i} transform={`translate(${620 + i * 90} 1100) scale(${ease(f, b(33) + i * 5, 12)})`}><rect x={-30} y={-50} width={60} height={70} rx={14} fill={C.teal} stroke={C.ink} strokeWidth={5} /><rect x={-34} y={20} width={68} height={16} rx={6} fill={C.dash} stroke={C.ink} strokeWidth={4} /></g>)}
        <g transform={`translate(${545} ${lerp(500, 735, pin)})`} opacity={clamp01(pin * 3)}>
          <path d="M 0,0 C -34,-40 -34,-84 0,-84 C 34,-84 34,-40 0,0 Z" fill={C.mag} stroke={C.ink} strokeWidth={5} />
          <circle cy={-60} r={10} fill={C.white} />
          <circle cy={4} r={14 + 22 * Math.max(0, pin - 0.9) * 10} fill="none" stroke={C.mag} strokeWidth={4} opacity={pin > 0.9 ? 0.6 : 0} />
        </g>
        <g transform="translate(830 1070)">
          <rect x={-120} y={-70} width={240} height={140} rx={16} fill={C.gun} stroke={C.ink} strokeWidth={7} />
          <rect x={-90} y={-12} width={180} height={14} rx={4} fill={C.ink} />
          <circle cx={-90} cy={-44} r={9} fill={C.mint} stroke={C.ink} strokeWidth={3} />
          <g transform={`translate(0 ${lerp(0, -170, eject)})`}><Sheet x={0} y={-10} s={0.34} title="AI ENGAGED" strip /></g>
        </g>
        <Seq f={f} b={b} items={[{k: 4, text: 'ASKED IN MAY', size: 38}, {k: 33, text: 'THE BOARD OF REGENTS', size: 32}, {k: 5, text: 'REGENTS · FAIRBANKS', size: 34}, {k: 6, text: 'AI ENGAGED', size: 40, tone: 'glow'}]} ys={[563, 563, 563, 563]} />
      </SVG>
    </Frame>
  );
};

// ---- S3: the plan, then a hundred desks --------------------------------------------------------------------------------------------------
const SIGNS = ['NO AI', 'AI OK', 'ASK ME', 'CITE IT', 'AI HELP', 'NO AI', 'AI OK', 'ONLY DRAFTS', 'AI OK', 'NO AI'];
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pull = easeIO(f, b(10), 34);
  const bad = (i: number) => ease(f, b(7) + i * 6, 14);
  const coins = ease(f, b(8), 18);
  const doors = ease(f, b(9), 18);
  const one = ease(f, b(34), 20) * (1 - pull);
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={940}>
      <SVG>
        <g opacity={1 - pull}>
          <Sheet x={540} y={880} s={1.15} title="AI ENGAGED" strip={false} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = bad(i);
            const bx = 540 + (i % 2 ? 190 : -190), by = 740 + Math.floor(i / 2) * 130;
            return a > 0.01 ? <g key={i} transform={`translate(${bx} ${by}) scale(${a})`}><circle r={46} fill={C.gold} stroke={C.ink} strokeWidth={6} /><circle r={36} fill="none" stroke={C.ink} strokeWidth={3} /><text y={13} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={36} fill={C.ink}>{i + 1}</text></g> : null;
          })}
          <g transform="translate(860 1080)">{[0, 1, 2, 3].map((i) => <ellipse key={i} cx={0} cy={-i * 26 * coins} rx={70} ry={20} fill={C.gold} stroke={C.ink} strokeWidth={5} opacity={coins} />)}</g>
          <g transform="translate(540 1110)">{[0, 1, 2, 3, 4].map((i) => <g key={i} transform={`translate(${(i - 2) * 92} 0)`} opacity={doors}><rect x={-34} y={-70} width={68} height={100} rx={8} fill={C.teal} stroke={C.ink} strokeWidth={5} /><rect x={-14} y={-12} width={28} height={24} rx={4} fill={C.gold} stroke={C.ink} strokeWidth={3} /></g>)}</g>
        </g>
        {one > 0.02 && <g transform={`translate(${lerp(1200, 880, one)} 1040)`}><rect x={-60} y={10} width={120} height={36} rx={6} fill={C.teal} stroke={C.ink} strokeWidth={5} /><rect x={-50} y={-50} width={100} height={52} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text y={-16} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>NO AI</text></g>}
        <g opacity={pull} transform={`translate(540 880) scale(${lerp(2.2, 1, pull)}) translate(-540 -880)`}>
          {Array.from({length: 100}).map((_, i) => {
            const cx = 120 + (i % 10) * 94, cy = 600 + Math.floor(i / 10) * 56;
            const sg = SIGNS[(i * 7) % SIGNS.length];
            const ask = i === 53;
            return <g key={i} transform={`translate(${cx} ${cy})`}>
              <rect x={-30} y={4} width={60} height={22} rx={4} fill={C.teal} stroke={C.ink} strokeWidth={3} />
              <rect x={-26} y={-24} width={52} height={26} rx={3} fill={ask ? C.glow : C.paper} stroke={C.ink} strokeWidth={3} />
              <text y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={8} fill={C.ink}>{ask ? 'ASK ME' : sg}</text>
            </g>;
          })}
        </g>
        <Tok x={880} y={640} s={0.8} text={pull > 0.3 ? 'ASK THE CLASS' : 'WHO WROTE THIS?'} />
        <Seq f={f} b={b} items={[{k: 7, text: '6 PRINCIPLES', size: 34}, {k: 8, text: '4 INVESTMENT PRIORITIES', size: 30}, {k: 9, text: '5 EXPECTATIONS PER CAMPUS', size: 28}, {k: 34, text: 'UNTIL NOW · EACH CLASS ITS OWN', size: 26}, {k: 10, text: 'CLASS BY CLASS', size: 38, tone: 'glow'}]} ys={[500, 500, 500, 500, 500]} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the chatbot recommends, a person decides -----------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slide = easeIO(f, b(11), 30);
  const stampK = springy(f, b(12), 14);
  const noteX = lerp(300, 760, slide);
  return (
    <Frame p={p} z0={1.04} z1={1.12} oy={980}>
      <SVG>
        <Chatbot f={f} x={190} y={1000} s={1.05} mood="focused" />
        <g transform={`translate(${noteX} ${1070 + 5 * Math.sin(f / 7)}) rotate(${lerp(-6, 4, slide)})`}>
          <rect x={-90} y={-50} width={180} height={100} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>RECOMMEND</text>
          <path d="M -60,16 H 60 M -60,34 H 30" stroke={C.teal} strokeWidth={4} opacity={0.5} />
          {stampK > 0.05 && <g transform={`scale(${stampK}) rotate(-10)`}><rect x={-70} y={-16} width={140} height={34} rx={5} fill="none" stroke={C.mag} strokeWidth={5} /><text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.mag}>DECIDED</text></g>}
        </g>
        <Hand x={lerp(900, 770, stampK)} y={lerp(560, 840, Math.min(1, stampK))} s={1.1} rot={180} />
        <StampBot f={f} x={860} y={1040} reject={stampK > 0.5 ? 0 : 0} />
        <g transform={`translate(540 ${lerp(600, 770, springy(f, b(35), 20))})`} opacity={ease(f, b(35), 8)}><rect x={-150} y={-34} width={300} height={68} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text y={-4} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>ERICKSON</text><text y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.teal}>SPECIAL PROJECTS LEAD</text></g>
        <Seq f={f} b={b} items={[{k: 35, text: 'STEPHANIE ERICKSON · UA SPECIAL PROJECTS LEAD', size: 24}, {k: 42, text: 'THE CORE IDEA', size: 38}, {k: 11, text: 'AI RECOMMENDS', size: 38}, {k: 12, text: 'A PERSON DECIDES', size: 38, tone: 'glow'}]} ys={[563, 563, 563, 563]} />
      </SVG>
    </Frame>
  );
};

// ---- S5: the fight --------------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const paper = springy(f, b(13), 22);
  const sweat = ease(f, b(14), 20);
  const crack = ease(f, b(15), 14);
  return (
    <Frame p={p} z0={1.03} z1={1.12} oy={960}>
      <SVG>
        <Person x={230} y={940} s={1.15} shirt="#2B6CB0" arms="crossed" mood="stern" f={f} seed={0} label="HARTLEY" />
        <Person x={470} y={940} s={1.15} shirt="#7A3FA0" arms="crossed" mood="stern" f={f} seed={1.7} label="POTTER" />
        <g transform={`translate(350 ${lerp(1250, 780, paper)}) rotate(${lerp(10, -3, paper)})`} opacity={clamp01(paper * 2)}>
          <rect x={-190} y={-120} width={380} height={240} rx={6} fill={C.white} stroke={C.ink} strokeWidth={6} />
          <text y={-76} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>OP-ED</text>
          <path d="M -160,-50 H 160 M -160,-26 H 160 M -160,-2 H 120 M -160,22 H 160 M -160,46 H 90" stroke={C.ink} strokeWidth={5} opacity={0.35} />
        </g>
        <Chatbot f={f} x={830} y={980} s={1.05} mood={sweat > 0.1 ? 'nervous' : 'focused'} sweat={sweat} />
        <Tok x={830} y={1130} s={crack > 0.5 ? 1.0 : 0.8} text={crack > 0.5 ? 'NOT DISCLOSED' : 'WHO WROTE THIS?'} rot={crack > 0.5 ? -6 : 0} />
        {crack > 0.02 && <path d="M 810,1080 l 12,22 l -10,14 l 14,28" stroke={C.mag} strokeWidth={5} fill="none" opacity={crack} />}
        <Seq f={f} b={b} items={[{k: 13, text: 'OP-ED · UAA PROFESSORS', size: 30}, {k: 14, text: "THE OP-ED'S CLAIM", size: 36}, {k: 15, lines: ['OP-ED CLAIM', 'NOT DISCLOSED UNTIL OCT 9TH'], size: 28, tone: 'warn'}]} ys={[563, 563, 590]} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the quote types itself, the ghost text has no author -------------------------------------------------------------------------
const QUOTE = ['"Allowing AI to speak', 'first sets the harmful', "precedent of favoring a", "chatbot's authority over", 'human wisdom."'];
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const type = clamp01((f - b(16)) / 120);
  const ghost = ease(f, b(17), 26);
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={950}>
      <SVG>
        <Sheet x={540} y={900} s={1.5} title="OP-ED QUOTE" strip={false} />
        <Typed x={300} y={760} rows={QUOTE} k={type} size={31} fill={C.ink} />
        {ghost > 0.02 && <g opacity={0.55 * ghost}>
          {[0, 1, 2].map((i) => <rect key={i} x={300} y={1030 + i * 30} width={260 - i * 40 + 20 * Math.sin(f / 9 + i)} height={14} rx={4} fill={C.teal} opacity={0.6} />)}
          <text x={300} y={1150} fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.mag}>BY: ???</text>
        </g>}
        {ease(f, b(36), 14) > 0.02 && <rect x={300} y={852} width={168 * ease(f, b(36), 14)} height={8} rx={3} fill={C.mag} />}
        <g transform={`translate(860 ${lerp(1500, 760, springy(f, b(43), 18))}) scale(0.55)`}><Chatbot f={f} x={0} y={0} mood="wry" /></g>
        <StampBot f={f} x={880} y={1060} reject={0} />
        <g transform={`translate(${lerp(1100, 760, ghost)} ${lerp(1300, 1060, ghost)}) rotate(-20)`} opacity={ghost}>
          <circle r={58} fill="#CFE8F2" fillOpacity={0.35} stroke={C.ink} strokeWidth={9} />
          <path d="M 40,40 L 100,100" stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
        </g>
        <Seq f={f} b={b} items={[{k: 16, text: 'HARTLEY AND POTTER · OP-ED QUOTE', size: 24}, {k: 43, text: 'AI SPEAKS FIRST', size: 36}, {k: 36, text: '"THE HARMFUL PRECEDENT"', size: 30}, {k: 17, text: 'NO AUTHOR LINE', size: 38, tone: 'warn'}]} ys={[563, 563, 563, 563]} />
      </SVG>
    </Frame>
  );
};

// ---- S7: the meeting everyone was in, then the hallway of empty chairs ----------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const room = ease(f, b(18), 20);
  const bubble = ease(f, b(19), 18);
  const pull = easeIO(f, b(20), 36);
  const type = clamp01((f - b(19)) / 60);
  const shirts = ['#2B6CB0', '#7A3FA0', '#2F855A', '#B7791F', '#C05621'];
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={960} warmth={0.06}>
      <SVG>
        <g opacity={1 - pull * 0.9} transform={`translate(540 960) scale(${lerp(1.18, 0.62, pull)}) translate(-540 -960)`}>
          <ellipse cx={540} cy={1120} rx={440} ry={70} fill="#7A3A14" stroke={C.ink} strokeWidth={6} />
          <rect x={150} y={1070} width={780} height={40} rx={10} fill="#C27A3A" stroke={C.ink} strokeWidth={6} />
          {shirts.map((c, i) => <Person key={i} x={190 + i * 175} y={900 + (i % 2) * 18} s={0.82} shirt={c} f={f} seed={i * 1.3} arms={i === 2 ? 'up' : 'down'} />)}
          <Sheet x={540} y={1060} s={0.3} title="AI ENGAGED" strip={false} />
          <g transform="translate(540 650)" opacity={bubble}>
            <rect x={-330} y={-76} width={660} height={140} rx={34} fill={C.paper} stroke={C.ink} strokeWidth={6} />
            <path d="M -30,64 l 20,40 l 30,-40 Z" fill={C.paper} stroke={C.ink} strokeWidth={6} />
            <Typed x={-300} y={-22} rows={['"In this case, AI use was not', "'concealed.'\""]} k={type} size={28} />
          </g>
        </g>
        <g opacity={pull}>
          {Array.from({length: 24}).map((_, i) => {
            const cx = 120 + (i % 8) * 120, cy = 760 + Math.floor(i / 8) * 150;
            return <g key={i} transform={`translate(${cx} ${cy})`}><rect x={-34} y={-36} width={68} height={60} rx={12} fill={C.teal} stroke={C.ink} strokeWidth={5} /><rect x={-28} y={24} width={56} height={14} rx={5} fill={C.dash} stroke={C.ink} strokeWidth={4} /></g>;
          })}
          <Lab text="EVERYONE ELSE" x={540} y={1180} size={28} tone="warn" p={pull} />
        </g>
        <g transform={`rotate(${6 * Math.sin(Math.max(0, f - b(37)) / 5) * (1 - ease(f, b(37) + 40, 10))} 880 1030)`}><StampBot f={f} x={880} y={1030} reject={0} /></g>
        <Seq f={f} b={b} items={[{k: 18, text: '5 FACULTY · THE MEETING EVERYONE WAS IN', size: 24}, {k: 37, text: 'FIVE FACULTY ANSWER', size: 32}, {k: 19, lines: ['"IN THIS CASE, AI USE WAS', "NOT 'CONCEALED.'\""], size: 26}, {k: 20, lines: ['ANYONE WHO MET WITH', 'ADMINISTRATORS KNEW'], size: 28, tone: 'glow'}]} ys={[500, 500, 505, 505]} />
      </SVG>
    </Frame>
  );
};

// ---- S8: both sides agree ---------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const a1 = ease(f, b(21), 20);
  const a3 = ease(f, b(22), 20);
  const a2 = ease(f, b(38), 20);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={960}>
      <SVG>
        <Chatbot f={f} x={540} y={930} s={1.25} mood="focused" pencil />
        <Lab text="USED" x={540} y={1130} size={34} tone="plate" p={a1} />
        <Arrow x1={110} y1={820} x2={400} y2={880} color={C.teal} p={a1} />
        <Arrow x1={970} y1={820} x2={680} y2={880} color={C.gold} p={a2} />
        <Lab text="PROFESSORS" x={170} y={760} size={22} p={a1} />
        <Lab text="FACULTY" x={910} y={760} size={22} p={a2} />
        <Arrow x1={540} y1={1250} x2={540} y2={1420} color={C.mag} p={a3} />
        <g transform="translate(540 1490)" opacity={a3}>
          <rect x={-120} y={-50} width={240} height={90} rx={10} fill="none" stroke={C.mag} strokeWidth={6} strokeDasharray="14 10" />
          <text y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={48} fill={C.mag}>?</text>
        </g>
        <Seq f={f} b={b} items={[{k: 21, text: 'THE FAIR PART', size: 36}, {k: 38, text: 'BOTH SIDES AGREE · AI WAS USED', size: 26}, {k: 22, text: 'HIDDEN?', size: 44, tone: 'warn'}]} ys={[500, 500, 500]} />
      </SVG>
    </Frame>
  );
};

// ---- S9: 10,500 dots, 119 of them glow, the camera pulls back ---------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pullback = easeIO(f, b(24) - 12, 40);
  const card = springy(f, b(25), 20);
  const sc = lerp(2.6, 1, easeIO(f, b(23), 40) ) * lerp(1, 1, pullback);
  const gl = ease(f, b(39), 18);
  return (
    <Frame p={p} z0={1.02} z1={1.06} oy={960} bg="#7A3A14">
      <SVG>
        <g transform={`translate(540 880) scale(${sc}) translate(-540 -880)`}>
          {Array.from({length: 52 * 30}).map((_, i) => {
            const cx = 70 + (i % 52) * 18.5, cy = 560 + Math.floor(i / 52) * 17;
            const inBox = (i % 52) >= 22 && (i % 52) < 33 && Math.floor(i / 52) >= 12 && Math.floor(i / 52) < 23;
            const lit = inBox && ((i * 7) % 11 < 10);
            return <circle key={i} cx={cx} cy={cy} r={lit && gl > 0.3 ? 6.5 : 5} fill={lit && gl > 0.3 ? C.glow : C.teal} opacity={0.9} />;
          })}
        </g>
        <g transform={`translate(540 ${lerp(1500, 1080, card)}) scale(${card})`} opacity={clamp01(card * 2)}>
          <rect x={-290} y={-52} width={580} height={104} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>CITED CASES</text>
          <text y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.mag}>NOT ALL CASES</text>
        </g>
        <Seq f={f} b={b} items={[{k: 23, text: '10,500+ UAA STUDENTS', size: 32}, {k: 39, text: '119 CITED', size: 38}, {k: 24, text: '119 = 1.1%', size: 40, tone: 'glow'}, {k: 25, text: 'CITED CASES, NOT ALL CASES', size: 26}]} ys={[500, 500, 500, 500]} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the footnote fills, DISCLOSED -------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const fill = clamp01((f - b(26)) / Math.max(20, b(40) - b(26)));
  const stampK = springy(f, b(27), 14);
  const loop = ease(f, b(28), 26);
  return (
    <Frame p={p} z0={1.04} z1={1.12} oy={960}>
      <SVG>
        <Sheet x={620} y={900} s={1.35} title="AI ENGAGED" strip fill={fill} lit={f >= b(40)} f={f} />
        <StampBot f={f} x={190} y={1030} reject={stampK > 0.2 ? 1 : 0} />
        {stampK > 0.05 && <g transform={`translate(620 1090) rotate(-9) scale(${stampK})`}><rect x={-190} y={-44} width={380} height={88} rx={8} fill="none" stroke={C.mag} strokeWidth={10} /><text y={20} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={58} fill={C.mag}>DISCLOSED</text></g>}
        <g opacity={loop}>
          <path d="M 330,1180 C 100,1300 80,820 300,760" fill="none" stroke={C.glow} strokeWidth={10} strokeDasharray="18 12" />
          <g transform="translate(250 740) rotate(-6)"><rect x={-110} y={-30} width={220} height={60} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>AI RECOMMENDS</text></g>
        </g>
        <Tok x={920} y={680} s={0.9} text={fill > 0.98 ? 'DISCLOSED' : 'WHO WROTE THIS?'} glow={fill > 0.98 ? 1 : 0} />
        <Seq f={f} b={b} items={[{k: 26, lines: ['DRAFTED WITH AI', 'DECIDED BY PEOPLE'], size: 30}, {k: 40, text: 'ONE PLAIN LINE', size: 38}, {k: 27, text: 'DISCLOSED', size: 44, tone: 'warn'}, {k: 28, text: "THE PLAN'S OWN RULE", size: 32, tone: 'glow'}]} ys={[500, 500, 500, 500]} />
      </SVG>
    </Frame>
  );
};

// ---- S11: our own label -----------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tag = ease(f, b(29), 16);
  const st = springy(f, b(30), 14);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={960}>
      <SVG>
        <Sheet x={230} y={920} s={0.78} title="AI ENGAGED" strip fill={1} lit f={f} />
        <StampBot f={f} x={540} y={1060} reject={ease(f, b(41), 14) * 0.5} />
        <g transform={`translate(${230 + 10 * Math.sin(f / 15)} ${lerp(500, 630, tag)}) rotate(${4 * Math.sin(f / 18)})`} opacity={tag}>
          <path d="M 0,-80 V 0" stroke={C.ink} strokeWidth={5} />
          <rect x={-150} y={0} width={300} height={70} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={44} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={21} fill={C.ink}>NO DECISION REPORTED</text>
        </g>
        <Chatbot f={f} x={800} y={960} s={1.25} mood={st > 0.3 ? 'wry' : 'focused'} stamp={st} />
        <Seq f={f} b={b} items={[{k: 29, text: 'NO DECISION REPORTED', size: 30}, {k: 41, text: 'ONE MORE DISCLOSURE', size: 34}, {k: 30, text: 'THIS FILM · BUILT ON CLAUDE', size: 28, tone: 'warn'}]} ys={[500, 500, 500]} />
      </SVG>
    </Frame>
  );
};

// ---- S12: the loop ----------------------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const drop = springy(f, b(31), 24);
  const lift = ease(f, b(32), 18);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={960}>
      <SVG>
        <g transform={`translate(0 ${lerp(-600, 0, drop)})`} opacity={clamp01(drop * 2)}><Sheet x={330} y={900} s={1.1} title="AI ENGAGED" strip fill={1} lit f={f} /></g>
        <Tok x={330} y={620} s={1.0} text="DISCLOSED" glow={0.8 + 0.2 * Math.sin(f / 7)} />
        <Essay x={780} y={1060} s={0.95} foot />
        <g transform={`translate(0 ${-40 * lift})`}><StampBot f={f} x={780} y={820} reject={0} /></g>
        <Seq f={f} b={b} items={[{k: 31, lines: ['ONE LINE', 'OR WHO WAS THERE?'], size: 34, tone: 'glow'}, {k: 32, text: 'SHOWS ITS WORK', size: 34}]} ys={[500, 500]} />
      </SVG>
    </Frame>
  );
};


const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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

export const ep1106Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1106Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1106: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 9.5, 18.5, 31.5, 40.5, 52.5, 63.0, 82.0, 89.0, 100.0, 108.5, 116.0, 121.0].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><Bands beats={bs} /></Sequence>
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#2A1006" ink="#FFF6D6" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
