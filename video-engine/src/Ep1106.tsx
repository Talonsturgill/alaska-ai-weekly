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
      {Array.from({length: 22}).map((_, i) => <circle key={i} cx={(i * 173) % 1080} cy={(i * 97) % 520} r={2 + (i % 3)} fill="#FFE9A8" opacity={0.12 + 0.12 * Math.abs(Math.sin(f / 50 + i))} />)}
      <rect x={lerp(-400, 1500, sw)} y={0} width={240} height={H} fill="#FFF2CC" opacity={0.17} transform="skewX(-14)" />
      <rect x={lerp(1500, -500, ((f + 120) % 420) / 420)} y={0} width={320} height={H} fill="#2A1006" opacity={0.13} transform="skewX(-14)" />
      {Array.from({length: 14}).map((_, i) => <circle key={`m${i}`} cx={(i * 211 + f * (0.6 + (i % 4) * 0.25)) % 1080} cy={300 + ((i * 131) % 1200) + 22 * Math.sin(f / 38 + i)} r={3 + (i % 3)} fill="#FFF2CC" opacity={0.35} />)}
      <rect data-band="ok" x={0} y={1180} width={W} height={740} fill={C.dash} />
      <rect x={0} y={1180} width={W} height={14} fill="#06292C" />
      <rect x={0} y={1194} width={W} height={60} fill="#000" opacity={0.18} />
      <g data-band="ok">
        <path d="M 0,1500 L 1080,1440" stroke="#06292C" strokeWidth={4} opacity={0.5} />
        <path d="M 0,1620 L 1080,1580" stroke="#06292C" strokeWidth={3} opacity={0.4} />
        <path d="M 0,1760 L 1080,1740" stroke="#06292C" strokeWidth={3} opacity={0.35} />
        <polygon points="60,1194 420,1194 640,1920 -120,1920" fill="#FFE9A8" opacity={0.07} />
        <g transform="translate(110 1275) rotate(-5)"><rect x={-70} y={-12} width={140} height={22} rx={3} fill="#E8D9A8" stroke="#1B1230" strokeWidth={3} /><rect x={-64} y={-26} width={140} height={22} rx={3} fill="#F4EBC6" stroke="#1B1230" strokeWidth={3} /></g>
        <g transform="translate(960 1280)"><rect x={-34} y={-44} width={68} height={70} rx={10} fill="#E3175F" stroke="#1B1230" strokeWidth={4} opacity={0.0} /><rect x={-30} y={-40} width={60} height={64} rx={8} fill="#6B7A86" stroke="#1B1230" strokeWidth={4} /><path d="M -14,-40 l -4,-30 M 0,-40 l 2,-34 M 14,-40 l 6,-28" stroke="#FFC36B" strokeWidth={5} strokeLinecap="round" /></g>
        <g transform="translate(540 1510)"><ellipse rx={150} ry={14} fill="#000" opacity={0.2} /></g>
        <g transform="translate(980 1470) rotate(8)"><rect x={-50} y={-9} width={100} height={18} rx={4} fill="#F4EBC6" stroke="#1B1230" strokeWidth={3} /></g>
        <g transform="translate(120 1560)"><rect x={-70} y={-50} width={140} height={22} rx={3} fill="#B7791F" stroke="#1B1230" strokeWidth={4} /><rect x={-60} y={-72} width={124} height={22} rx={3} fill="#2B6CB0" stroke="#1B1230" strokeWidth={4} /><rect x={-66} y={-94} width={128} height={22} rx={3} fill="#C05621" stroke="#1B1230" strokeWidth={4} /></g>
        <g transform="translate(930 1570)"><path d="M -26,0 h 52 l -8,-46 h -36 z" fill="#C05621" stroke="#1B1230" strokeWidth={4} /><path d="M 0,-46 q -50,-30 -34,-76 q 36,16 34,76 M 0,-46 q 50,-30 34,-76 q -36,16 -34,76" fill="#2F855A" stroke="#1B1230" strokeWidth={4} /></g>
        <g transform="translate(90 1520) rotate(-8)"><rect x={-60} y={-10} width={120} height={20} rx={4} fill="#E8D9A8" stroke="#1B1230" strokeWidth={3} /><rect x={-54} y={-26} width={120} height={20} rx={4} fill="#F4EBC6" stroke="#1B1230" strokeWidth={3} /></g>
      </g>
    </svg>
  );
};

const CHIP2 = 'ILLUSTRATION';

/** a vertical run of plates that hand off one to the next. items[i] shows from b(k) to b(next k) - 10; the last stays. */
/** continuous idle life for any held figure: breath squash, a sway and a settle nudge. */
const Idle: React.FC<{f: number; x: number; y: number; seed?: number; amp?: number; children: React.ReactNode}> = ({f, x, y, seed = 0, amp = 2.2, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${1.6 * amp * Math.sin(f / 26 + seed)}) scale(${1 + 0.018 * amp * Math.sin(f / 15 + seed)} ${1 - 0.022 * amp * Math.sin(f / 15 + seed)}) translate(${-x} ${-y})`}>{children}</g>
);
const vis = (f: number, b: (id: number) => number, ks: number[], i: number) => ease(f, b(ks[i]), 14) * (i < ks.length - 1 ? 1 - ease(f, b(ks[i + 1]) - 10, 8) : 1);

/** a cream legal-pad sheet with an optional footnote strip. fill 0..1 types the disclosure line, lit lights the bulb. */
const Sheet: React.FC<{x: number; y: number; s?: number; rot?: number; title?: string; strip?: boolean; fill?: number; lit?: boolean; f?: number; pencil?: boolean; thick?: number; smudge?: number; ruled?: boolean}> = ({x, y, s = 1, rot = 0, title = 'AI ENGAGED', strip = true, fill = 0, lit = false, f = 0, pencil = false, thick = 0, smudge = 0, ruled = true}) => {
  const line = 'AI HELPED DRAFT · A PERSON DECIDED';
  const shown = line.slice(0, Math.round(line.length * clamp01(fill)));
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={0} cy={236} rx={190} ry={16} fill="#000" opacity={0.35} />
      {thick > 0.01 && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={-170 + i * 3} y={-230 + i * 3} width={340} height={460} rx={10} fill={C.cream} stroke={C.ink} strokeWidth={4} transform={`translate(${-14 * thick * (i + 1) / 2} ${10 * thick * (i + 1) / 2})`} />)}
      <rect x={-170} y={-230} width={340} height={460} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={7} />
      <rect x={-170} y={-230} width={340} height={46} rx={10} fill={C.cream} stroke={C.ink} strokeWidth={7} />
      <text x={0} y={-198} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={2} fill={C.ink}>{title}</text>
      {smudge > 0.01 && <ellipse cx={128} cy={-196} rx={22 * smudge} ry={9 * smudge} fill="#3B3B46" opacity={0.55} />}
      {ruled && Array.from({length: 8}).map((_, i) => <path key={i} d={`M -140,${-140 + i * 36} H ${i % 3 === 2 ? 60 : 140}`} stroke={C.teal} strokeWidth={5} opacity={0.35} />)}
      {strip && (
        <g transform="translate(0 190)">
          <rect x={-150} y={-24} width={300} height={48} rx={6} fill={fill > 0 ? '#FFFFFF' : 'none'} stroke={pencil ? '#5A5A66' : C.ink} strokeWidth={4} strokeDasharray={fill > 0.98 && !pencil ? '0' : '10 8'} />
          <text x={-140} y={7} fontFamily={MONO} fontWeight={800} fontSize={13} fill={pencil ? '#5A5A66' : C.ink}>{shown}</text>
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
        <text y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={36} fill={C.mag}>CITED</text>
      </g>
    )}
  </g>
);

/** THE CHATBOT: a steel boxy machine with a face and a pencil. sweat 0..1, stamp text shown on its forehead. */
const Chatbot: React.FC<{f: number; x: number; y: number; s?: number; mood?: 'focused' | 'nervous' | 'wry'; sweat?: number; stamp?: number; pencil?: boolean; tag?: number}> = ({f, x, y, s = 1, mood = 'focused', sweat = 0, stamp = 0, pencil = true, tag = 0}) => {
  const blink = (f % 110) > 104 ? 0.15 : 1;
  return (
    <g transform={`translate(${x} ${y + 4 * Math.sin(f / 19)}) scale(${s})`}>
      <ellipse cx={0} cy={118} rx={100} ry={14} fill="#000" opacity={0.35} />
      <rect x={-92} y={-100} width={184} height={210} rx={22} fill={C.gun} stroke={C.ink} strokeWidth={8} />
      <defs><linearGradient id="chatg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} /><stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} /><stop offset="1" stopColor="#000000" stopOpacity={0.4} /></linearGradient></defs>
      <rect x={-92} y={-100} width={184} height={210} rx={22} fill="url(#chatg)" />
      <path d="M -84,-90 v 190" stroke="#FFFFFF" strokeWidth={5} opacity={0.3} />
      {[[-78, -86], [78, -86], [-78, 96], [78, 96]].map(([sx, sy], i) => <circle key={i} cx={sx} cy={sy} r={5} fill="#CFD8DE" stroke={C.ink} strokeWidth={2.5} />)}
      <rect x={-72} y={-80} width={144} height={74} rx={14} fill="#CFD8DE" stroke={C.ink} strokeWidth={5} />
      {[-30, 30].map((ex, i) => <g key={i}><ellipse cx={ex} cy={-44} rx={14} ry={14 * blink} fill={C.white} stroke={C.ink} strokeWidth={3} /><circle cx={ex + (mood === 'wry' ? 5 : 0)} cy={-44} r={5} fill={C.ink} /></g>)}
      <path d={mood === 'nervous' ? 'M -24,-14 q 24,-14 48,0' : mood === 'wry' ? 'M -24,-16 q 24,10 48,-6' : 'M -24,-16 q 24,12 48,0'} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-60} y={12 + i * 22} width={120} height={10} rx={4} fill={C.gunD} stroke={C.ink} strokeWidth={3} />)}
      {pencil && <g transform="translate(78 -76) rotate(24)"><rect x={-6} y={-60} width={12} height={90} rx={3} fill={C.glow} stroke={C.ink} strokeWidth={4} /><path d="M -6,30 L 0,48 L 6,30 Z" fill={C.ink} /></g>}
      {sweat > 0.01 && [0, 1, 2].map((i) => <path key={i} d="M 0,-8 q 9,14 0,22 q -9,-8 0,-22 Z" fill="#9FD7F5" stroke={C.ink} strokeWidth={2.5} transform={`translate(${-96 + i * 16 - 8} ${-70 + ((f * 3 + i * 40) % 90) * sweat})`} opacity={0.85} />)}
      {tag > 0.01 && (
        <g transform={`translate(${lerp(140, 0, tag)} ${lerp(-60, 100, tag)}) rotate(${lerp(20, -4, tag)})`} opacity={clamp01(tag * 2)}>
          <rect x={-96} y={-20} width={192} height={40} rx={5} fill={C.paper} stroke={C.mag} strokeWidth={5} />
          <text y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.mag}>ALSO BUILT ON CLAUDE</text>
        </g>
      )}
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
const HAIR = ['#3A2218', '#1B1230', '#8A5A2B', '#B8B8C0', '#5A2D14'];
const Person: React.FC<{x: number; y: number; s?: number; shirt?: string; skin?: string; arms?: 'crossed' | 'down' | 'up'; label?: string; f?: number; seed?: number; mood?: 'calm' | 'stern'}> = ({x, y, s = 1, shirt = C.teal, skin = '#E7B58F', arms = 'down', label, f = 0, seed = 0, mood = 'calm'}) => {
  const hair = HAIR[Math.abs(Math.round(seed * 3)) % HAIR.length];
  const glasses = Math.abs(Math.round(seed * 5)) % 2 === 1;
  const breathe = 1 + 0.014 * Math.sin(f / 16 + seed);
  const nod = 2.2 * Math.sin(f / 31 + seed * 2);
  const blink = ((f + Math.round(seed * 40)) % 130) > 124 ? 0.15 : 1;
  const sway = arms === 'up' ? 8 * Math.sin(f / 14 + seed) : 3 * Math.sin(f / 22 + seed);
  const gid = `pg${shirt.replace('#', '')}`;
  const sid = `ps${skin.replace('#', '')}`;
  return (
    <g transform={`translate(${x} ${y + 3 * Math.sin(f / 21 + seed)}) scale(${s})`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} /><stop offset="0.45" stopColor={shirt} /><stop offset="1" stopColor="#000000" stopOpacity={0.35} /></linearGradient>
        <radialGradient id={sid} cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} /><stop offset="0.5" stopColor={skin} /><stop offset="1" stopColor="#7A4A2A" stopOpacity={0.45} /></radialGradient>
      </defs>
      <ellipse cx={0} cy={142} rx={66} ry={11} fill="#000" opacity={0.42} />
      <ellipse cx={0} cy={139} rx={44} ry={6} fill="#000" opacity={0.28} />
      <rect x={-34} y={126} width={30} height={16} rx={7} fill="#2A1A2E" stroke={C.ink} strokeWidth={4} />
      <rect x={4} y={126} width={30} height={16} rx={7} fill="#2A1A2E" stroke={C.ink} strokeWidth={4} />
      <g transform={`scale(1 ${breathe})`} style={{transformOrigin: '0px 136px'}}>
        <rect x={-48} y={-10} width={96} height={146} rx={30} fill={shirt} stroke={C.ink} strokeWidth={7} />
        <rect x={-48} y={-10} width={96} height={146} rx={30} fill={`url(#${gid})`} />
        <path d="M -30,-6 q 30,26 60,0" fill="#F4EBC6" stroke={C.ink} strokeWidth={4} />
        <path d="M 0,18 v 100" stroke="#000" strokeWidth={3} opacity={0.18} />
        <path d="M -42,6 q 6,60 4,112" stroke="#FFFFFF" strokeWidth={5} opacity={0.28} fill="none" />
        <path d="M 42,6 q -4,60 -2,112" stroke="#000" strokeWidth={7} opacity={0.22} fill="none" />
        <circle cx={0} cy={48} r={4} fill="#F4EBC6" stroke={C.ink} strokeWidth={2} /><circle cx={0} cy={78} r={4} fill="#F4EBC6" stroke={C.ink} strokeWidth={2} />
      </g>
      {arms === 'down' && [-1, 1].map((d) => (
        <g key={d} transform={`rotate(${d * sway * 0.4} ${d * 50} 6)`}>
          <rect x={d > 0 ? 36 : -62} y={0} width={26} height={96} rx={13} fill={shirt} stroke={C.ink} strokeWidth={6} />
          <rect x={d > 0 ? 36 : -62} y={0} width={26} height={96} rx={13} fill={`url(#${gid})`} />
          <circle cx={d * 49} cy={104} r={13} fill={skin} stroke={C.ink} strokeWidth={5} />
        </g>
      ))}
      <rect x={-12} y={-24} width={24} height={22} rx={8} fill={skin} stroke={C.ink} strokeWidth={5} />
      <g transform={`rotate(${nod} 0 -10)`}>
        <circle cx={-40} cy={-50} r={9} fill={skin} stroke={C.ink} strokeWidth={4} /><circle cx={40} cy={-50} r={9} fill={skin} stroke={C.ink} strokeWidth={4} />
        <circle cy={-52} r={40} fill={skin} stroke={C.ink} strokeWidth={7} />
        <circle cy={-52} r={40} fill={`url(#${sid})`} />
        <path d="M -40,-58 q 40,-52 80,0 q -40,-16 -80,0 Z" fill={hair} stroke={C.ink} strokeWidth={4} />
        <path d="M -24,-84 q 12,-8 26,-6" stroke="#FFFFFF" strokeWidth={4} opacity={0.35} fill="none" />
        <path d="M 0,-48 q 5,10 0,14" stroke={C.ink} strokeWidth={3} fill="none" opacity={0.5} />
        <circle cx={-22} cy={-36} r={6} fill="#E3175F" opacity={0.18} /><circle cx={22} cy={-36} r={6} fill="#E3175F" opacity={0.18} />
        {[-14, 14].map((ex, i) => <ellipse key={i} cx={ex} cy={-50} rx={4.5} ry={4.5 * blink} fill={C.ink} />)}
        {glasses && <g fill="none" stroke={C.ink} strokeWidth={3.5}><circle cx={-14} cy={-50} r={10} /><circle cx={14} cy={-50} r={10} /><path d="M -4,-50 h 8" /></g>}
        <path d={mood === 'stern' ? 'M -12,-28 h 24' : 'M -14,-30 q 14,10 28,0'} stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      {arms === 'crossed' && <g><path d="M -52,30 q 52,28 104,-4" fill="none" stroke={shirt} strokeWidth={26} strokeLinecap="round" /><path d="M -52,30 q 52,28 104,-4" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={0.5} /></g>}
      {arms === 'up' && <g transform={`rotate(${sway} 48 10)`}><path d="M 48,10 L 90,-40" stroke={shirt} strokeWidth={24} strokeLinecap="round" /><circle cx={92} cy={-44} r={13} fill={skin} stroke={C.ink} strokeWidth={4} /></g>}
      {label && <text y={168} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.paper}>{label}</text>}
    </g>
  );
};

const Hand: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => {
  const fr = useCurrentFrame();
  return (
  <g transform={`translate(${x} ${y}) rotate(${rot + 3 * Math.sin(fr / 12)}) scale(${s})`}>
    <rect x={-34} y={60} width={68} height={120} rx={14} fill={C.dash} stroke={C.ink} strokeWidth={6} />
    <rect x={-30} y={0} width={60} height={90} rx={26} fill="#E7B58F" stroke={C.ink} strokeWidth={6} />
    <path d="M -22,10 q -2,40 0,70" stroke="#FFFFFF" strokeWidth={4} opacity={0.3} fill="none" />
    <rect x={-44} y={-40} width={88} height={64} rx={26} fill="#E7B58F" stroke={C.ink} strokeWidth={6} />
    {[-28, -9, 10, 28].map((fx, i) => <path key={i} d={`M ${fx},-38 v -22`} stroke={C.ink} strokeWidth={3} />)}
  </g>
  );
};

const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color?: string; p?: number}> = ({x1, y1, x2, y2, color = C.ink, p = 1}) => {
  const k = clamp01(p);
  const wob = 6 * Math.sin(useCurrentFrame() / 8);
  const ex = lerp(x1, x2, k) + wob * 0.6, ey = lerp(y1, y2, k) + wob;
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g opacity={clamp01(k * 3)}>
      <path d={`M ${x1},${y1} L ${ex},${ey}`} stroke={color} strokeWidth={22} strokeLinecap="round" />
      <path d={`M ${ex},${ey} l ${-46 * Math.cos(a - 0.5)},${-46 * Math.sin(a - 0.5)} l ${46 * Math.cos(a - 0.5) + 46 * Math.cos(a + 0.5)},${46 * Math.sin(a - 0.5) + 46 * Math.sin(a + 0.5)} Z`} fill={color} stroke={color} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

const Tok: React.FC<{x: number; y: number; s?: number; text: string; glow?: number; rot?: number}> = ({x, y, s = 1, text, glow = 0, rot = 0}) => {
  const rows = text.split('|');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <QuestionToken text="" glow={glow} />
      {rows.map((r, i) => <text key={i} x={0} y={(i - (rows.length - 1) / 2) * 26 + 6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={r.length > 8 ? 13 : 16} fill={C.ink}>{r}</text>)}
    </g>
  );
};

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
const TOPS = [{k: 3, t: 'WHO?'}, {k: 10, t: 'CLASS'}, {k: 12, t: 'PERSON'}, {k: 13, t: 'OP-ED'}, {k: 19, t: 'REBUTTAL'}, {k: 23, t: 'CITED'}, {k: 26, t: 'PROPOSED'}];
const Bands: React.FC<{beats: Beat[]}> = ({beats}) => {
  const f = useCurrentFrame();
  const at = (k: number) => {
    const x = beats.find((y) => y.id === (IDS[k] ?? k));
    return x ? Math.round(x.at * 30) : 99999;
  };
  const cur = TOPS.filter((q) => f >= at(q.k)).length - 1;
  const fill = clamp01((f - at(26)) / Math.max(20, at(40) - at(26)));
  const line = 'AI HELPED DRAFT · A PERSON DECIDED';
  const lit = f >= at(27);
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <g data-band="ok">
        <text x={60} y={150} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill={C.paper} opacity={0.85}>THE TOKEN · WHO WROTE THIS?</text>
        {TOPS.map((q, i) => {
          const x = 44 + i * 138, on = i <= cur, now = i === cur;
          return (
            <g key={i} transform={`translate(${x} 205)`}>
              <rect x={0} y={-34} width={128} height={68} rx={10} fill={now ? C.gold : on ? '#5E2A0C' : '#7A3A14'} stroke={now ? C.ink : C.paper} strokeWidth={now ? 5 : 3} opacity={on ? 1 : 0.8} />
              <text x={64} y={7} textAnchor="middle" fontFamily={MONO} fontSize={22} fontWeight={900} fill={now ? C.ink : C.paper}>{q.t}</text>
            </g>
          );
        })}
        <line x1={44} y1={270} x2={1020} y2={270} stroke={C.paper} strokeWidth={3} strokeDasharray="6 10" opacity={0.6} />
        <circle cx={44 + Math.max(0, cur) * 138 + 64} cy={270} r={9} fill={C.gold} />
        <rect x={60} y={1600} width={960} height={110} rx={8} fill="#06292C" opacity={0.75} />
        <text x={80} y={1632} fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={2} fill={C.paper} opacity={0.9}>{fill > 0 ? 'OUR SUGGESTION · THE PLAN\'S AI USE NOTE' : 'THE PLAN\'S AI USE NOTE'}</text>
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
  const K = [44, 2, 47, 3];
  const slam = ease(f, b(1) - 7, 9);
  const splat = ease(f, b(44), 12);
  const tray = easeIO(f, b(2) - 10, 22);
  const glow = ease(f, b(2), 18);
  const tag = ease(f, b(47), 14);
  const tok = springy(f, b(3), 22);
  return (
    <Frame p={p} z0={1.02} z1={1.06} oy={1000}>
      <SVG>
        <g transform={`translate(0 ${lerp(-520, 0, tray)})`}>
          <rect x={78} y={700} width={780} height={400} rx={14} fill={C.dash} stroke={C.ink} strokeWidth={6} />
          <g transform="translate(126 760)">
            {Array.from({length: 150}).map((_, i) => {
              const cx = (i % 15) * 50, cy = Math.floor(i / 15) * 34;
              const lit = i < 119;
              return <circle key={i} cx={cx} cy={cy} r={lit ? 11 + glow * 2 : 10} fill={lit && glow > 0.2 ? C.glow : C.teal} stroke={C.ink} strokeWidth={3} opacity={0.95} />;
            })}
          </g>
        </g>
        {tag > 0.02 && <g transform={`translate(480 ${lerp(1000, 1042, tag)}) rotate(-3)`} opacity={tag}><rect x={-150} y={-22} width={300} height={44} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={19} fill={C.ink}>CITED FOR MISCONDUCT</text></g>}
        <Essay x={640} y={1170} s={0.7} rejected={slam} />
        {splat > 0.02 && <g opacity={0.9 * (1 - 0.2 * splat)}>
          <circle cx={640} cy={1170} r={30 + 110 * splat} fill={C.mag} opacity={0.22} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={640 + Math.cos(i * 0.9) * 140 * splat} cy={1170 + Math.sin(i * 0.9) * 110 * splat} r={10 + (i % 3) * 7} fill={C.mag} />)}
        </g>}
        <Idle f={f} x={290} y={1095} seed={1}><StampBot f={f} x={290} y={1160} reject={slam} /></Idle>
        <Sheet x={940} y={990} s={0.46} rot={6} title="PLAN" strip f={f} />
        {tok > 0.02 && <Tok x={940} y={lerp(700, 960, tok)} s={0.8} text="WHO WROTE THIS?" glow={tok > 0.9 ? 0.5 : 0} />}
        <Plate x={540} y={568} text="UAA · 119 OF 150 CITED USED AI" size={27} p={vis(f, b, K, 0)} />
        <Plate x={540} y={637} text="119 OF 150 CITED" size={34} p={vis(f, b, K, 1)} />
        <Plate x={540} y={707} text="CITED FOR MISCONDUCT" size={30} p={vis(f, b, K, 2)} />
        <Plate x={540} y={778} text="WHO WROTE THIS?" size={36} tone="glow" p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};

// ---- S2: the regents ------------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [4, 33, 5, 6];
  const flip = ease(f, b(4), 16);
  const pin = springy(f, b(5), 22);
  const eject = easeIO(f, b(6), 30);
  const byline = ease(f, b(33) + 20, 18);
  return (
    <Frame p={p} z0={1.03} z1={1.12} oy={960}>
      <SVG>
        <g transform="translate(40 560)">
          <path d={AK_PATH} fill="#F6C98B" stroke={C.ink} strokeWidth={4} opacity={0.95} />
          <path d={AK_PATH} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.5} transform="translate(5 6)" />
        </g>
        <g transform="translate(240 1010)">
          <rect x={-110} y={-120} width={220} height={240} rx={14} fill={C.white} stroke={C.ink} strokeWidth={7} />
          <rect x={-110} y={-120} width={220} height={52} rx={14} fill={C.mag} stroke={C.ink} strokeWidth={7} />
          <g transform={`scale(1 ${Math.max(0.05, Math.abs(Math.cos(flip * Math.PI)))})`}>
            <text y={30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={flip > 0.5 ? 72 : 66} fill={C.ink}>{flip > 0.5 ? 'MAY' : 'APR'}</text>
          </g>
        </g>
        {[0, 1, 2, 3].map((i) => <g key={i} transform={`translate(${470 + i * 80} 1130) scale(${ease(f, b(33) + i * 5, 12)})`}><rect x={-26} y={-46} width={52} height={64} rx={13} fill={C.teal} stroke={C.ink} strokeWidth={5} /><rect x={-30} y={18} width={60} height={14} rx={6} fill={C.dash} stroke={C.ink} strokeWidth={4} /></g>)}
        {byline > 0.02 && <g transform={`translate(640 1000) scale(${Math.max(0.05, Math.abs(Math.cos(byline * Math.PI)))} 1)`}><rect x={-70} y={-50} width={140} height={100} rx={6} fill={byline > 0.5 ? C.white : C.paper} stroke={C.ink} strokeWidth={5} /><text y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>{byline > 0.5 ? 'BYLINE?' : 'PLAN'}</text></g>}
        <g transform={`translate(${545} ${lerp(500, 735, pin)})`} opacity={clamp01(pin * 3)}>
          <path d="M 0,0 C -34,-40 -34,-84 0,-84 C 34,-84 34,-40 0,0 Z" fill={C.mag} stroke={C.ink} strokeWidth={5} />
          <circle cy={-60} r={10} fill={C.white} />
        </g>
        <g transform="translate(850 1070)">
          <rect x={-110} y={-70} width={220} height={140} rx={16} fill={C.gun} stroke={C.ink} strokeWidth={7} />
          <rect x={-84} y={-12} width={168} height={14} rx={4} fill={C.ink} />
          <circle cx={-84} cy={-44} r={9} fill={C.mint} stroke={C.ink} strokeWidth={3} />
          <g transform={`translate(0 ${lerp(0, -170, eject)})`}><Sheet x={0} y={-10} s={0.32} title="AI ENGAGED" strip /></g>
        </g>
        <Plate x={540} y={574} text="ASKED IN MAY" size={38} p={vis(f, b, K, 0)} />
        <Plate x={540} y={647} text="THE BOARD OF REGENTS" size={32} p={vis(f, b, K, 1)} />
        <Plate x={540} y={718} text="REGENTS · FAIRBANKS" size={34} p={vis(f, b, K, 2)} />
        <Plate x={540} y={793} text="AI ENGAGED" size={40} tone="glow" p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};

// ---- S3: the plan, then a hundred desks --------------------------------------------------------------------------------------------------
const SIGNS = ['NO AI', 'AI OK', 'ASK ME', 'CITE IT', 'AI HELP', 'NO AI', 'AI OK', 'DRAFTS OK', 'AI OK', 'NO AI'];
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [7, 8, 9, 34, 10];
  const pull = easeIO(f, b(10), 34);
  const bad = (i: number) => ease(f, b(7) + i * 6, 14);
  const coins = ease(f, b(8), 18);
  const one = ease(f, b(34), 20) * (1 - pull);
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={940}>
      <SVG>
        <g opacity={1 - pull}>
          <Sheet x={540} y={1010} s={1.0} title="" strip={false} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = bad(i);
            const bx = 420 + (i % 2) * 240, by = 900 + Math.floor(i / 2) * 110;
            return a > 0.01 ? <g key={i} transform={`translate(${bx} ${by}) scale(${a})`}><circle r={44} fill={C.gold} stroke={C.ink} strokeWidth={6} /><circle r={34} fill="none" stroke={C.ink} strokeWidth={3} /><text y={13} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} fill={C.ink}>{i + 1}</text></g> : null;
          })}
          <g transform="translate(830 1190)">{[0, 1, 2, 3].map((i) => <ellipse key={i} cx={0} cy={-i * 26 * coins} rx={66} ry={20} fill={C.gold} stroke={C.ink} strokeWidth={5} opacity={coins} />)}</g>
          {[0, 1, 2, 3, 4].map((i) => {
            const k = ease(f, b(9) + i * 7, 12);
            return <g key={i} transform={`translate(240 ${860 + i * 80})`} opacity={k}><rect x={-26} y={-26} width={52} height={52} rx={6} fill={C.white} stroke={C.ink} strokeWidth={5} /><path d={`M -14,0 l 10,12 l 20,-24`} fill="none" stroke={C.teal} strokeWidth={8} strokeLinecap="round" strokeDasharray="60" strokeDashoffset={60 * (1 - k)} /></g>;
          })}
        </g>
        {one > 0.02 && <g transform={`translate(${lerp(1200, 860, one)} 1040)`}><rect x={-60} y={10} width={120} height={36} rx={6} fill={C.teal} stroke={C.ink} strokeWidth={5} /><rect x={-50} y={-50} width={100} height={52} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text y={-16} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>NO AI</text></g>}
        <g opacity={pull} transform={`translate(540 880) scale(${lerp(2.2, 1, pull)}) translate(-540 -880)`}>
          {Array.from({length: 35}).map((_, i) => {
            const cx = 150 + (i % 7) * 130, cy = 640 + Math.floor(i / 7) * 110;
            const sg = SIGNS[(i * 3) % SIGNS.length];
            const ask = i === 17;
            return <g key={i} transform={`translate(${cx} ${cy})`}>
              <ellipse cx={0} cy={44} rx={50} ry={7} fill="#000" opacity={0.3} />
              <rect x={-48} y={6} width={96} height={34} rx={5} fill={C.teal} stroke={C.ink} strokeWidth={4} />
              <rect x={-44} y={-34} width={88} height={40} rx={4} fill={ask ? C.glow : C.paper} stroke={C.ink} strokeWidth={4} />
              <text y={-8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.ink}>{ask ? 'ASK ME' : sg}</text>
            </g>;
          })}
        </g>
        <Tok x={900} y={1240} s={0.8} text={pull > 0.3 ? 'ASK THE|CLASS' : 'WHO WROTE|THIS?'} />
        <Plate x={540} y={572} text="6 PRINCIPLES" size={34} p={vis(f, b, K, 0)} />
        <Plate x={540} y={642} text="4 INVESTMENT PRIORITIES" size={30} p={vis(f, b, K, 1)} />
        <Plate x={540} y={709} text="5 EXPECTATIONS PER CAMPUS" size={28} p={vis(f, b, K, 2)} />
        <Plate x={540} y={774} text="UNTIL NOW · EACH CLASS ITS OWN" size={26} p={vis(f, b, K, 3)} />
        <Plate x={540} y={844} text="CLASS BY CLASS" size={38} tone="glow" p={vis(f, b, K, 4)} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the chatbot recommends, a person decides -----------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [35, 42, 11, 12];
  const card = springy(f, b(35), 20);
  const smudge = ease(f, b(35) + 12, 20);
  const idea = ease(f, b(42), 16);
  const slide = easeIO(f, b(11), 30);
  const stampK = springy(f, b(12), 14);
  const noteX = lerp(300, 790, slide);
  return (
    <Frame p={p} z0={1.04} z1={1.12} oy={980}>
      <SVG>
        <Chatbot f={f} x={190} y={1020} s={1.0} mood="focused" />
        <g transform={`translate(270 ${lerp(1180, 1235, card)})`} opacity={ease(f, b(35), 8)}><rect x={-130} y={-34} width={260} height={68} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text y={-4} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>ERICKSON</text><text y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={12} fill={C.teal}>SPECIAL PROJECTS LEAD</text></g>
        
        {idea > 0.02 && <g transform={`translate(350 ${lerp(930, 882, idea)})`} opacity={idea}><rect x={-120} y={-30} width={240} height={60} rx={8} fill={C.glow} stroke={C.ink} strokeWidth={5} /><text y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>THE CORE IDEA</text></g>}
        <g transform={`translate(${noteX} ${1090 + 5 * Math.sin(f / 7)}) rotate(${lerp(-6, 4, slide)})`} opacity={slide > 0.01 ? 1 : 0}>
          <rect x={-90} y={-50} width={180} height={100} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink} opacity={1 - clamp01(stampK * 2.5)}>RECOMMEND</text>
          <path d="M -60,16 H 60 M -60,34 H 30" stroke={C.teal} strokeWidth={4} opacity={0.5 * (1 - clamp01(stampK * 2.5))} />
          {stampK > 0.05 && <g transform={`scale(${stampK}) rotate(-10)`}><rect x={-70} y={-16} width={140} height={34} rx={5} fill="none" stroke={C.teal} strokeWidth={5} /><text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.teal}>HUMAN CALL</text></g>}
        </g>
        <Hand x={lerp(930, 790, stampK)} y={lerp(580, 880, Math.min(1, stampK))} s={1.05} rot={180} />
        {stampK > 0.2 && <Tok x={190} y={640} s={0.8} rot={-8} text="A PERSON|DECIDES" />}
        <Plate x={540} y={567} text="STEPHANIE ERICKSON · UA SPECIAL PROJECTS LEAD" size={24} p={vis(f, b, K, 0)} />
        <Plate x={540} y={636} text="THE CORE IDEA" size={38} p={vis(f, b, K, 1)} />
        <Plate x={540} y={712} text="AI RECOMMENDS" size={38} p={vis(f, b, K, 2)} />
        <Plate x={540} y={788} text="A PERSON DECIDES" size={38} tone="glow" p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};

// ---- S5: the fight --------------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [13, 45, 14, 15];
  const paper = springy(f, b(13), 22);
  const cal = springy(f, b(13) + 8, 22);
  const head = springy(f, b(45), 14);
  const tag = ease(f, b(14), 22);
  const crack = ease(f, b(15), 14);
  return (
    <Frame p={p} z0={1.03} z1={1.12} oy={960}>
      <SVG>
        <Person x={210} y={940} s={1.1} shirt="#2B6CB0" arms="up" mood="stern" f={f} seed={0} label="HARTLEY" />
        <Person x={460} y={940} s={1.1} shirt="#7A3FA0" arms="down" mood="calm" f={f} seed={1.7} label="POTTER" />
        <g transform={`translate(${lerp(170, 300, paper)} ${lerp(1250, 740, paper)}) rotate(${lerp(10, -5, paper)})`} opacity={clamp01(paper * 2)}>
          <rect x={-100} y={-70} width={200} height={140} rx={6} fill={C.white} stroke={C.ink} strokeWidth={6} />
          <text y={-34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>OP-ED</text>
          <path d="M -80,-10 H 80 M -80,10 H 80 M -80,30 H 40" stroke={C.ink} strokeWidth={5} opacity={0.35} />
          {head > 0.05 && <g transform={`scale(${head}) rotate(-6)`}><rect x={-84} y={-24} width={168} height={14} rx={4} fill={C.mag} opacity={0.0} /></g>}
        </g>
        <g transform={`translate(${lerp(640, 520, cal)} ${lerp(1250, 760, cal)}) rotate(3)`} opacity={clamp01(cal * 2)}>
          <rect x={-80} y={-70} width={160} height={140} rx={8} fill={C.white} stroke={C.ink} strokeWidth={6} />
          <rect x={-80} y={-70} width={160} height={36} rx={8} fill={C.mag} stroke={C.ink} strokeWidth={6} />
          <text y={50} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={64} fill={C.ink}>9</text>
          <circle cy={32} r={44} fill="none" stroke={C.mag} strokeWidth={6} />
        </g>
        <Chatbot f={f} x={830} y={980} s={1.0} mood="focused" pencil={false} />
        <g transform="translate(930 1140) rotate(-18)" opacity={tag}><rect x={-60} y={-5} width={120} height={10} rx={3} fill={C.glow} stroke={C.ink} strokeWidth={3} /></g>
        <Tok x={830} y={1230} s={crack > 0.5 ? 0.9 : 0.75} rot={crack > 0.5 ? -6 : 0} text={crack > 0.5 ? 'OP-ED CLAIM|OCT 9TH' : 'WHO WROTE|THIS?'} />
        <Plate x={540} y={570} text="OP-ED · UAA PROFESSORS" size={30} p={vis(f, b, K, 0)} />
        <Plate x={540} y={641} text="THE OP-ED SAYS" size={36} p={vis(f, b, K, 1)} />
        <Plate x={540} y={727} displayLines={['CLAUDE · FIRST DRAFT, PER THE OP-ED', 'THIS FILM IS ALSO BUILT ON CLAUDE']} text="CLAUDE FIRST DRAFT PER THE OP-ED THIS FILM IS ALSO BUILT ON CLAUDE" size={22} tone="warn" p={vis(f, b, K, 2)} />
        <Plate x={540} y={831} displayLines={['OP-ED CLAIM', 'NOT DISCLOSED UNTIL OCT 9TH']} text="OP-ED CLAIM NOT DISCLOSED UNTIL OCT 9TH" size={28} tone="warn" p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the quote types itself, a balance tips toward the chatbot ---------------------------------------------------------------------------
const QUOTE = ['"Allowing AI to speak', 'first sets the harmful', 'precedent of favoring a', "chatbot's authority over", 'human wisdom."'];
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [16, 43, 36, 17];
  const type = clamp01((f - b(16)) / 120);
  const speak = springy(f, b(43), 18);
  const bal = ease(f, b(17), 30);
  const ul = ease(f, b(36), 14);
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={950}>
      <SVG>
        <Sheet x={540} y={960} s={1.45} title="" strip={false} ruled={false} />
        <Typed x={318} y={885} rows={QUOTE} k={type} size={31} fill={C.ink} />
        <text x={318} y={1092} fontFamily={MONO} fontWeight={800} fontSize={19} fill={C.teal}>HARTLEY AND POTTER · ADN OP-ED</text>
        {ul > 0.02 && <rect x={318} y={977} width={168 * ul} height={8} rx={3} fill={C.ink} />}
        <g transform={`translate(860 ${lerp(1500, 760, speak)}) scale(0.55)`}><Chatbot f={f} x={0} y={0} mood="wry" /></g>
        <Idle f={f} x={215} y={1100} seed={1}><StampBot f={f} x={215} y={1100} reject={0} /></Idle>
        {bal > 0.02 && <g transform="translate(560 1190) scale(1.15)" opacity={bal}>
          <path d="M 0,0 V 70" stroke={C.ink} strokeWidth={10} />
          <g transform={`rotate(${lerp(0, 9, bal)})`}>
            <path d="M -200,0 H 200" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
            <g transform="translate(-190 20)"><rect x={-60} y={0} width={120} height={14} rx={6} fill={C.gold} stroke={C.ink} strokeWidth={4} /><g transform="translate(0 -44) scale(0.32)"><Chatbot f={f} x={0} y={0} mood="focused" pencil={false} /></g></g>
            <g transform="translate(190 20)"><rect x={-60} y={0} width={120} height={14} rx={6} fill={C.gold} stroke={C.ink} strokeWidth={4} /><g transform="translate(0 -44) scale(0.45)"><Hand x={0} y={-20} s={0.8} rot={0} /></g></g>
          </g>
        </g>}
        <Plate x={540} y={567} text="HARTLEY AND POTTER · OP-ED QUOTE" size={24} p={vis(f, b, K, 0)} />
        <Plate x={540} y={635} text="AI SPEAKS FIRST" size={36} p={vis(f, b, K, 1)} />
        <Plate x={540} y={706} text={'"THE HARMFUL PRECEDENT"'} size={30} p={vis(f, b, K, 2)} />
        <Plate x={540} y={771} text="CHATBOT'S AUTHORITY · HUMAN WISDOM" size={24} tone="glow" p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};

// ---- S7: the rebuttal, then a neutral hallway ---------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [18, 37, 19, 20, 48];
  const room = ease(f, b(18), 20);
  const draft = easeIO(f, b(37), 30);
  const bubble = ease(f, b(19), 18);
  const pull = easeIO(f, b(20), 36);
  const type = clamp01((f - b(19)) / 60);
  const taped = ease(f, b(19) + 10, 20);
  const marks = ease(f, b(48), 16);
  const shirts = ['#2F855A', '#B7791F', '#C05621', '#0E6B73', '#8F3B12'];
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={960} warmth={0.06}>
      <SVG>
        <g opacity={1 - pull * 0.9} transform={`translate(540 960) scale(${lerp(1.1, 0.62, pull)}) translate(-540 -960)`}>
          <ellipse cx={540} cy={1120} rx={440} ry={70} fill="#7A3A14" stroke={C.ink} strokeWidth={6} />
          <rect x={150} y={1070} width={780} height={40} rx={10} fill="#C27A3A" stroke={C.ink} strokeWidth={6} />
          {shirts.map((c, i) => <g key={i} opacity={room}><Person x={190 + i * 175} y={900 + (i % 2) * 18 - (i % 3) * 8} s={0.74 + (i % 3) * 0.06} shirt={c} f={f} seed={i * 1.3} arms={i === 2 ? 'up' : 'down'} /></g>)}
          <g transform={`translate(${lerp(240, 760, draft)} 1090)`} opacity={draft > 0.01 ? 1 : 0}>
            <rect x={-60} y={-34} width={120} height={68} rx={4} fill={C.white} stroke={C.ink} strokeWidth={4} />
            <path d="M -42,-12 H 42 M -42,6 H 42 M -42,22 H 10" stroke={C.ink} strokeWidth={3} opacity={0.4} />
            <path d="M 18,-24 l 30,10 M 6,0 l 36,8" stroke={C.glow} strokeWidth={5 + 4 * marks} />
          </g>
        </g>
        <g opacity={pull}>
          {Array.from({length: 24}).map((_, i) => {
            const cx = 160 + (i % 8) * 108, cy = 780 + Math.floor(i / 8) * 150;
            const filled = true;
            return <g key={i} transform={`translate(${cx} ${cy})`}><rect x={-32} y={-34} width={64} height={58} rx={12} fill={C.teal} stroke={C.ink} strokeWidth={5} /><rect x={-26} y={22} width={52} height={14} rx={5} fill={C.dash} stroke={C.ink} strokeWidth={4} />{filled && <circle cy={-48} r={22} fill="#E7B58F" stroke={C.ink} strokeWidth={4} />}</g>;
          })}

        </g>
        <Lab text="REBUTTAL · 5 UA FACULTY · NOV 5TH" x={540} y={1225} size={20} tone="plate" p={room * (1 - pull)} />
        {taped > 0.02 && <g opacity={taped}><Tok x={140} y={1240} s={0.6} text="WHO WAS|THERE?" /></g>}
        <Plate x={540} y={567} text="REBUTTAL · 5 UA FACULTY · NOV 5TH" size={24} p={vis(f, b, K, 0)} />
        <Plate x={540} y={632} text="THEY SAY · IN PLAIN SIGHT" size={30} p={vis(f, b, K, 1)} />
        <Plate x={540} y={719} displayLines={['"IN THIS CASE, AI USE WAS', 'NOT CONCEALED."']} text="IN THIS CASE AI USE WAS NOT CONCEALED" size={26} p={vis(f, b, K, 2)} />
        <Plate x={540} y={827} displayLines={['ANYONE WHO MET WITH', 'ADMINISTRATORS KNEW']} text="ANYONE WHO MET WITH ADMINISTRATORS KNEW" size={28} tone="glow" p={vis(f, b, K, 3)} />
        <Plate x={540} y={900} text="THE FIRST DRAFT" size={34} tone="glow" p={vis(f, b, K, 4)} />
      </SVG>
    </Frame>
  );
};

// ---- S8: both sides agree ---------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [21, 38, 22];
  const a1 = ease(f, b(21), 20);
  const a2 = ease(f, b(38), 20);
  const a3 = ease(f, b(22), 20);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={960}>
      <SVG>
        <Chatbot f={f} x={540} y={930} s={1.25} mood="focused" pencil />
        <Lab text="USED" x={540} y={1130} size={34} tone="plate" p={a1} />
        <Arrow x1={160} y1={820} x2={400} y2={880} color={C.teal} p={a1} />
        <Arrow x1={920} y1={820} x2={680} y2={880} color={C.gold} p={a2} />
        <Lab text="PROFESSORS" x={250} y={740} size={22} p={a1} />
        <Lab text="FACULTY" x={830} y={740} size={22} p={a2} />
        <Arrow x1={640} y1={1040} x2={790} y2={1110} color={C.mag} p={a3} />
        <g transform="translate(880 1170)" opacity={a3}>
          <rect x={-100} y={-55} width={200} height={110} rx={10} fill="none" stroke={C.mag} strokeWidth={6} strokeDasharray="14 10" />
          <text y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={56} fill={C.mag}>?</text>
        </g>
        <Plate x={540} y={573} text="THE FAIR PART" size={36} p={vis(f, b, K, 0)} />
        <Plate x={540} y={642} text="BOTH SIDES AGREE · AI WAS USED" size={26} p={vis(f, b, K, 1)} />
        <Plate x={540} y={715} text="HIDDEN?" size={44} tone="warn" p={vis(f, b, K, 2)} />
      </SVG>
    </Frame>
  );
};

// ---- S9: 10,500 dots, 119 of them glow, the camera pulls back ---------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [23, 39, 24, 25];
  const card = springy(f, b(25), 20);
  const sc = lerp(2.6, 1, easeIO(f, b(23), 40));
  const gl = ease(f, b(39), 18);
  const blank = ease(f, b(25), 16);
  return (
    <Frame p={p} z0={1.02} z1={1.06} oy={960} bg="#7A3A14">
      <SVG>
        <clipPath id="screen9"><rect x={0} y={470} width={1080} height={860} /></clipPath>
        <g clipPath="url(#screen9)"><g transform={`translate(540 880) scale(${sc}) translate(-540 -880)`}>
          <defs><pattern id="field" x="0" y="0" width="6.8" height="6.8" patternUnits="userSpaceOnUse"><circle cx="3.4" cy="3.4" r="1.8" fill={C.teal} /></pattern></defs>
          <rect x={70} y={600} width={940} height={520} rx={6} fill="url(#field)" />
          {Array.from({length: 119}).map((_, i) => {
            const cx = 82 + ((i * 337) % 910), cy = 612 + ((i * 211 + (i % 7) * 53) % 495);
            return <circle key={i} cx={cx} cy={cy} r={gl > 0.3 ? 5.5 + 1.8 * Math.sin(f / 5 + i) : 1.7} fill={gl > 0.3 ? C.glow : C.teal} stroke={gl > 0.3 ? C.ink : 'none'} strokeWidth={1.5} />;
          })}
        </g></g>
        {blank > 0.02 && <g transform="translate(880 1180)" opacity={blank}><Tok x={0} y={0} s={0.7} text="?" /></g>}
        <g transform={`translate(520 ${lerp(1500, 1080, card)}) scale(${card})`} opacity={clamp01(card * 2)}>
          <rect x={-290} y={-52} width={580} height={104} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>CITED CASES</text>
          <text y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>NOT ALL CASES</text>
        </g>
        <Plate x={540} y={571} text="10,500+ UAA STUDENTS" size={32} p={vis(f, b, K, 0)} />
        <Plate x={540} y={644} text="119 CITED" size={38} p={vis(f, b, K, 1)} />
        <Plate x={540} y={714} text="119 OF 10,500+ · ABOUT 1.1%" size={26} tone="glow" p={vis(f, b, K, 2)} />
        <Plate x={540} y={778} text="NOT A RATE OF MISUSE" size={30} p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the footnote fills, DISCLOSED -------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [26, 40, 27, 28];
  const fill = clamp01((f - b(26)) / Math.max(20, b(40) - b(26)));
  const stampK = springy(f, b(27), 14);
  const loop = ease(f, b(28), 26);
  const back = easeIO(f, b(40), 30);
  return (
    <Frame p={p} z0={1.04} z1={1.12} oy={960}>
      <SVG>
        <Sheet x={620} y={900} s={lerp(1.3, 0.85, back)} title="" strip fill={fill} pencil={fill < 1} lit={f >= b(27)} thick={back} f={f} />
        <Idle f={f} x={170} y={1030} seed={5}><StampBot f={f} x={170} y={1030} reject={stampK > 0.2 ? 1 : 0} /></Idle>
        {stampK > 0.05 && <g transform={`translate(${lerp(660, 620, back)} ${lerp(1010, 930, back)}) rotate(-7) scale(${stampK * lerp(1, 0.8, back)})`}><rect x={-170} y={-52} width={340} height={104} rx={6} fill="#FFE27A" stroke={C.ink} strokeWidth={6} /><text y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} fill={C.ink}>OUR SUGGESTION</text><text y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.mag}>OUR WORDING</text></g>}
        <g opacity={loop}>
          <path d="M 300,1150 C 80,1300 70,860 230,770" fill="none" stroke={C.glow} strokeWidth={10} strokeDasharray="18 12" />
          <g transform="translate(240 730) rotate(-6)"><rect x={-110} y={-30} width={220} height={60} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>AI RECOMMENDS</text></g>
        </g>
        <Tok x={900} y={640} s={0.85} glow={fill > 0.98 ? 1 : 0} text={fill > 0.98 ? 'PROPOSED' : '?'} />
        <Plate x={540} y={587} displayLines={['OUR SUGGESTION', 'AI HELPED DRAFT · A PERSON DECIDED']} text="OUR SUGGESTION AI HELPED DRAFT A PERSON DECIDED" size={24} p={vis(f, b, K, 0)} />
        <Plate x={540} y={679} text="ONE LINE" size={44} p={vis(f, b, K, 1)} />
        <Plate x={540} y={761} text="ONE LINE, DISCLOSED" size={34} tone="warn" p={vis(f, b, K, 2)} />
        <Plate x={540} y={837} text="THE DRAFT'S OWN RULE" size={32} tone="glow" p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};

// ---- S11: our own label -----------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [29, 46, 41, 30];
  const tag = ease(f, b(29), 16);
  const fillTxt = ease(f, b(46), 30);
  const st = springy(f, b(30), 14);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={960}>
      <SVG>
        <Sheet x={250} y={940} s={0.74} title="" strip f={f} />
        <g transform={`translate(${250 + 8 * Math.sin(f / 15)} ${lerp(1060, 1130, tag)}) rotate(${4 * Math.sin(f / 18)})`} opacity={tag}>
          <path d="M 0,-24 V 0" stroke={C.ink} strokeWidth={5} />
          <rect x={-130} y={0} width={260} height={92} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text y={36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={C.ink}>{fillTxt > 0.3 ? 'NO DECISION' : ''}</text>
          <text y={64} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={C.ink}>{fillTxt > 0.7 ? 'REPORTED' : ''}</text>
        </g>
        <Idle f={f} x={560} y={1060} seed={4}><StampBot f={f} x={560} y={1060} reject={ease(f, b(41), 14) * 0.5} /></Idle>
        <Chatbot f={f} x={850} y={960} s={1.15} mood="focused" stamp={st} />
        <Plate x={540} y={570} text="NO DECISION REPORTED" size={30} p={vis(f, b, K, 0)} />
        <Plate x={540} y={638} text="NO RESULT ON THE PLAN" size={30} p={vis(f, b, K, 1)} />
        <Plate x={540} y={708} text="ONE MORE DISCLOSURE" size={34} p={vis(f, b, K, 2)} />
        <Plate x={540} y={777} text="THIS FILM · BUILT ON CLAUDE" size={28} tone="warn" p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};

// ---- S12: the loop, shot 1's composition with one footnote added ---------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [31, 32];
  const drop = springy(f, b(31), 24);
  const lift = ease(f, b(32), 18);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={900}>
      <SVG>
        <Essay x={640} y={1170} s={0.7} />
        <g transform={`translate(0 ${-60 * lift})`}><Idle f={f} x={290} y={1095} seed={1}><StampBot f={f} x={290} y={1160} reject={0} /></Idle></g>
        <g transform={`translate(0 ${lerp(-600, 0, drop)})`} opacity={clamp01(drop * 2)}><Sheet x={880} y={1000} s={0.5} rot={6} title="PLAN" strip fill={1} pencil f={f} /></g>
        <Tok x={880} y={700} s={0.9} glow={0.5 + 0.5 * Math.sin(f / 7)} text="ONE|LINE?" />
        <Plate x={540} y={597} displayLines={['ONE LINE', 'OR WHO WAS THERE?']} text="ONE LINE OR WHO WAS THERE?" size={34} tone="glow" p={vis(f, b, K, 0)} />
        <Plate x={540} y={694} text="SHOWS ITS WORK" size={34} p={vis(f, b, K, 1)} />
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
