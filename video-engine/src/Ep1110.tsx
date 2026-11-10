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
import {Moose, Beluga} from './lib/fauna';
import {IdleFigure} from './lib/figureidle';
import {TakeANumberMachine, Ticket} from './lib/ticket';
import {IDS} from './Ep1110Ids';

// Take a Number, 2026-11-10. Palette roles are art_direction.json. THE TICKET P-15423 is the throughline and the hero is the take-a-number machine.
// Vermilion belongs to the machine and the ticket only. Stamps are ink slate or cream. Fleet blue is the permit tags only. White dots are belugas only.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

export const C = {
  sky: '#3A3354', skyHi: '#54506E', ground: '#2C4A57', groundD: '#1D3440', verm: '#D6372B', vermD: '#8E1F18', paper: '#F2E8D0', white: '#FFFFFF', ink: '#0B1226',
  lemon: '#EEE27A', lemonD: '#C9BC4E', fleet: '#2F6FB5', fleetD: '#1D4A80', whale: '#EAF2F4', brass: '#D9A441', water: '#1E3A55', waterD: '#122638',
  skin: '#E3B48C', skin2: '#B07A55', glass: '#A9BCD0', wood: '#6B4A33', woodD: '#42291A', slate: '#3B4256', spruce: '#16282B', mint: '#9FD0C0',
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
  dark: {fill: '#0B1226', fg: '#F2E8D0', edge: '#F2E8D0'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.vermD, edge: C.vermD},
  glow: {fill: C.lemon, fg: C.ink, edge: C.ink},
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
type Mode = 'shore' | 'sea' | 'room' | 'lemon' | 'wall' | 'chart';
const Frame: React.FC<{p: SP; mode?: Mode; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; warmth?: number; children: React.ReactNode}> =
({p, mode = 'shore', cam, z0 = 1.04, z1 = 1.12, bloom = 0.05, vignette = 0.3, ox = 540, oy = 930, warmth = 0.0, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 40 * Math.sin(p.f / 110) + 24 * t, fy: oy};
  return (
    <AbsoluteFill>
      <Atmos f={p.f} mode={mode} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 4 * Math.sin(p.f / 23)}px, ${jl.y + 5 * Math.sin(p.f / 17 + 1) + 4 * t}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill={C.ink} stroke="#F2E8D0" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F2E8D0">{CHIP}</text>
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

// ---- the worlds ---------------------------------------------------------------------------------------------------------------------------------
const Spruces: React.FC<{y: number; n: number; seed: number; f: number; x0?: number; x1?: number; scale?: number}> = ({y, n, seed, f, x0 = -20, x1 = 1100, scale = 1}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const x = lerp(x0, x1, (i + h01(i, seed)) / n);
      const hgt = (150 + 130 * h01(i, seed + 3)) * scale;
      const sway = 2 * Math.sin(f / 40 + i);
      return (
        <g key={i} transform={`translate(${x} ${y}) skewX(${sway})`}>
          <path d={`M 0,${-hgt} L ${-34 * scale},${-hgt * 0.45} L ${-16 * scale},${-hgt * 0.45} L ${-48 * scale},0 L ${48 * scale},0 L ${16 * scale},${-hgt * 0.45} L ${34 * scale},${-hgt * 0.45} Z`} fill={C.spruce} stroke={C.ink} strokeWidth={3} />
        </g>
      );
    })}
  </g>
);

const Atmos: React.FC<{f: number; mode: Mode}> = ({f, mode}) => {
  const sw = (f % 420) / 420;
  if (mode === 'sea') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="seag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2B5F7A" /><stop offset="0.5" stopColor="#173246" /><stop offset="1" stopColor="#0A1822" /></linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#seag)" />
        {[0, 1, 2, 3, 4].map((i) => <polygon key={i} points={`${120 + i * 220 + 40 * Math.sin(f / 70 + i)},0 ${200 + i * 220},0 ${380 + i * 220 - 60 * Math.sin(f / 90 + i)},1500 ${140 + i * 220},1500`} fill="#BFE6F0" opacity={0.06 + 0.02 * Math.sin(f / 30 + i)} />)}
        {Array.from({length: 26}).map((_, i) => <circle key={i} cx={(i * 83) % 1080} cy={(1500 - ((f * (1 + (i % 4) * 0.6) + i * 97) % 1400))} r={3 + (i % 4) * 2} fill="none" stroke="#DFF4F8" strokeWidth={2} opacity={0.4} />)}
        <path d="M 0,1230 Q 270,1190 540,1230 T 1080,1220 L 1080,1920 L 0,1920 Z" fill="#26404B" stroke="#0B1226" strokeWidth={5} />
        {Array.from({length: 18}).map((_, i) => <ellipse key={i} cx={(i * 131) % 1080} cy={1300 + (i % 5) * 70} rx={26 + (i % 4) * 8} ry={9} fill="#34505C" opacity={0.7} />)}
      </svg>
    );
  }
  if (mode === 'lemon') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <defs><radialGradient id="lamp" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stopColor="#FFFBD0" stopOpacity={0.9} /><stop offset="0.6" stopColor={C.lemon} stopOpacity={0.55} /><stop offset="1" stopColor={C.lemonD} stopOpacity={0} /></radialGradient></defs>
        <rect width={W} height={H} fill="#2E2A3C" />
        <rect data-band="ok" x={60} y={480} width={960} height={1500} rx={16} fill={C.wood} stroke={C.ink} strokeWidth={8} />
        <g data-band="ok">{Array.from({length: 16}).map((_, i) => <path key={i} d={`M 70,${520 + i * 90} H 1010`} stroke={C.woodD} strokeWidth={3} opacity={0.45} />)}</g>
        <ellipse cx={540} cy={940} rx={470} ry={430} fill="url(#lamp)" />
        <rect x={lerp(-300, 1300, sw)} y={0} width={160} height={H} fill="#FFFBD0" opacity={0.05} transform="skewX(-14)" />
      </svg>
    );
  }
  if (mode === 'wall') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <rect width={W} height={H} fill="#2B2744" />
        {Array.from({length: 24}).map((_, i) => <path key={i} d={`M ${i * 46},300 V 1500`} stroke="#313863" strokeWidth={2} opacity={0.5} />)}
        {Array.from({length: 16}).map((_, i) => <path key={`h${i}`} d={`M 0,${360 + i * 72} H 1080`} stroke="#313863" strokeWidth={2} opacity={0.5} />)}
        <rect x={0} y={300} width={W} height={10} fill="#C9D6F0" opacity={0.25} />
      </svg>
    );
  }
  if (mode === 'chart') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <defs><linearGradient id="chg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1B2D49" /><stop offset="1" stopColor="#0F1B30" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#chg)" />
        {Array.from({length: 11}).map((_, i) => <path key={i} d={`M 0,${360 + i * 110 + 6 * Math.sin(f / 30 + i)} Q 270,${340 + i * 110} 540,${360 + i * 110} T 1080,${360 + i * 110}`} stroke="#3F6A8C" strokeWidth={2} fill="none" opacity={0.35} />)}
      </svg>
    );
  }
  if (mode === 'room') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <defs><linearGradient id="rmg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A3354" /><stop offset="1" stopColor="#241F3A" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#rmg)" />
        <rect data-band="ok" x={0} y={1180} width={W} height={740} fill="#2A2440" />
        <rect x={0} y={1176} width={W} height={10} fill="#0B1226" />
        <g data-band="ok">{Array.from({length: 12}).map((_, i) => <path key={i} d={`M ${i * 110 - 120},1920 L ${300 + i * 45},1186`} stroke="#1B1830" strokeWidth={3} opacity={0.6} />)}{Array.from({length: 6}).map((_, i) => <path key={`h${i}`} d={`M 0,${1260 + i * 110} H 1080`} stroke="#1B1830" strokeWidth={3} opacity={0.5} />)}</g>
      </svg>
    );
  }
  // shore
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A2444" /><stop offset="0.5" stopColor={C.sky} /><stop offset="1" stopColor={C.skyHi} /></linearGradient>
        <linearGradient id="watg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2C4A68" /><stop offset="1" stopColor={C.waterD} /></linearGradient>
        <radialGradient id="bounce" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={C.verm} stopOpacity={0.4} /><stop offset="1" stopColor={C.verm} stopOpacity={0} /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#skyg)" />
      {Array.from({length: 40}).map((_, i) => <circle key={i} cx={(i * 211) % 1080} cy={120 + ((i * 97) % 520)} r={1.4 + (i % 3) * 0.7} fill="#F2E8D0" opacity={0.3 + 0.3 * Math.sin(f / 22 + i)} />)}
      <path d="M 0,820 L 120,760 L 260,800 L 380,720 L 520,780 L 660,690 L 720,610 L 780,560 L 840,610 L 900,700 L 1080,740 L 1080,900 L 0,900 Z" fill="#171C38" stroke={C.ink} strokeWidth={4} />
      <path d="M 744,596 L 780,560 L 816,596 L 800,612 L 780,590 L 760,612 Z" fill={C.whale} opacity={0.85} />
      <rect x={0} y={880} width={W} height={310} fill="url(#watg)" />
      {Array.from({length: 12}).map((_, i) => <path key={i} d={`M ${(i * 137 + f * 0.6) % 1200 - 60},${910 + i * 24} h ${80 + (i % 3) * 40}`} stroke="#9FC4DC" strokeWidth={3} opacity={0.22} strokeLinecap="round" />)}
      <rect data-band="ok" x={0} y={1182} width={W} height={738} fill={C.ground} />
      <rect x={0} y={1182} width={W} height={10} fill={C.ink} />
      {Array.from({length: 30}).map((_, i) => <ellipse key={i} cx={(i * 97) % 1080} cy={1250 + ((i * 53) % 320)} rx={14 + (i % 4) * 8} ry={5 + (i % 3) * 2} fill={C.groundD} opacity={0.75} />)}
      <ellipse cx={540} cy={1180} rx={520} ry={150} fill="url(#bounce)" />
      <g data-band="ok">{Array.from({length: 14}).map((_, i) => <ellipse key={`fs${i}`} cx={(i * 173 + 40) % 1100} cy={1560 + ((i * 89) % 330)} rx={40 + (i % 4) * 18} ry={16 + (i % 3) * 6} fill="#24404C" stroke={C.ink} strokeWidth={3} />)}<path d="M 0,1530 Q 540,1490 1080,1540" stroke="#1A2F38" strokeWidth={10} fill="none" opacity={0.6} /></g>
    </svg>
  );
};

const Idle: React.FC<{f: number; x: number; y: number; seed?: number; amp?: number; children: React.ReactNode}> = ({f, x, y, seed = 0, amp = 2.2, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${1.4 * amp * Math.sin(f / 26 + seed)}) scale(${1 + 0.016 * amp * Math.sin(f / 15 + seed)} ${1 - 0.02 * amp * Math.sin(f / 15 + seed)}) translate(${-x} ${-y})`}>{children}</g>
);
const vis = (f: number, b: (id: number) => number, ks: number[], i: number) => ease(f, b(ks[i]), 14) * (i < ks.length - 1 ? 1 - ease(f, b(ks[i + 1]) - 10, 8) : 1);

// ---- the cast -----------------------------------------------------------------------------------------------------------------------------------
const HAIR = ['#3A2218', '#14101C', '#8A5A2B', '#B8B8C0', '#5A2D14'];
type Dress = 'suit' | 'parka' | 'jacket' | 'clerk' | 'cap' | 'plain';
/** a person: round head, dressed by role. hood for the parka, visor for the clerk, cap for the fleet hand, case in hand for the applicant. */
const Person: React.FC<{x: number; y: number; s?: number; dress?: Dress; skin?: string; f?: number; seed?: number; mood?: 'calm' | 'stern' | 'surprised'; flip?: number; armUp?: number; look?: number; cues?: number[]}> =
({x, y, s = 1, dress = 'plain', skin = C.skin, f = 0, seed = 0, mood = 'calm', flip = 1, armUp = 0, look = 0, cues = []}) => {
  const hair = HAIR[Math.abs(Math.round(seed * 3)) % HAIR.length];
  const breathe = 1 + 0.014 * Math.sin(f / 16 + seed);
  const nod = 2.2 * Math.sin(f / 31 + seed * 2);
  const blink = ((f + Math.round(seed * 40)) % 130) > 124 ? 0.15 : 1;
  const col = dress === 'suit' ? '#1F2A44' : dress === 'parka' ? '#7A3B2A' : dress === 'jacket' ? '#4F6B3A' : dress === 'clerk' ? '#5B6A8C' : dress === 'cap' ? '#2F6FB5' : '#3B4256';
  const shirt = dress === 'suit' || dress === 'clerk' ? '#F2E8D0' : '#B8B8C0';
  return (
    <g transform={`translate(${x} ${y + 3 * Math.sin(f / 21 + seed)}) scale(${s * flip} ${s})`}>
      <IdleFigure f={f} x={0} footY={142} h={234} seed={seed} cues={cues}>
      <ellipse cx={0} cy={142} rx={66} ry={11} fill="#000" opacity={0.42} />
      <rect x={-34} y={126} width={30} height={16} rx={7} fill="#14101C" stroke={C.ink} strokeWidth={4} />
      <rect x={4} y={126} width={30} height={16} rx={7} fill="#14101C" stroke={C.ink} strokeWidth={4} />
      <g transform={`scale(1 ${breathe})`}>
        <rect x={-48} y={-10} width={96} height={146} rx={30} fill={col} stroke={C.ink} strokeWidth={7} />
        <path d="M -30,-6 q 30,26 60,0" fill={shirt} stroke={C.ink} strokeWidth={4} />
        {dress === 'suit' && <path d="M 0,10 l -8,22 l 8,60 l 8,-60 Z" fill={C.verm} stroke={C.ink} strokeWidth={3} />}
        {dress === 'parka' && <g><path d="M -46,30 h 92 M -46,62 h 92 M -46,94 h 92" stroke="#4A1E14" strokeWidth={4} opacity={0.7} /><path d="M 10,-8 q 40,70 26,142 L 48,136 L 48,-6 Z" fill="#000" opacity={0.22} /><path d="M 0,-6 V 134" stroke="#4A1E14" strokeWidth={4} /></g>}
        <path d="M -42,6 q 6,60 4,112" stroke="#FFFFFF" strokeWidth={5} opacity={0.2} fill="none" />
      </g>
      <g>
        <rect x={-62} y={0} width={26} height={96} rx={13} fill={col} stroke={C.ink} strokeWidth={6} />
        <circle cx={-49} cy={104} r={13} fill={skin} stroke={C.ink} strokeWidth={5} />
        <g transform={`rotate(${-armUp * 70} 49 6)`}>
          <rect x={36} y={0} width={26} height={96} rx={13} fill={col} stroke={C.ink} strokeWidth={6} />
          <circle cx={49} cy={104} r={13} fill={skin} stroke={C.ink} strokeWidth={5} />
        </g>
      </g>
      <rect x={-12} y={-24} width={24} height={22} rx={8} fill={skin} stroke={C.ink} strokeWidth={5} />
      <g transform={`rotate(${nod + look * 6} 0 -10)`}>
        {dress === 'parka' && <circle cy={-52} r={52} fill="#5A2A1E" stroke={C.ink} strokeWidth={7} />}
        <circle cy={-52} r={40} fill={skin} stroke={C.ink} strokeWidth={7} />
        {dress !== 'parka' && <path d="M -40,-58 q 40,-52 80,0 q -40,-16 -80,0 Z" fill={hair} stroke={C.ink} strokeWidth={4} />}
        {dress === 'cap' && <g><path d="M -42,-70 q 42,-40 84,0 Z" fill="#14101C" stroke={C.ink} strokeWidth={5} /><rect x={-4} y={-72} width={56} height={9} rx={4} fill="#14101C" stroke={C.ink} strokeWidth={4} /></g>}
        {dress === 'clerk' && <rect x={-40} y={-76} width={80} height={14} rx={4} fill="#9FD0C0" stroke={C.ink} strokeWidth={4} />}
        {[-14, 14].map((ex, i) => <ellipse key={i} cx={ex + look * 3} cy={-50} rx={4.5} ry={4.5 * blink} fill={C.ink} />)}
        <path d={mood === 'stern' ? 'M -12,-28 h 24' : mood === 'surprised' ? 'M -6,-30 q 6,10 12,0 q -6,-8 -12,0' : 'M -14,-30 q 14,10 28,0'} stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      </IdleFigure>
    </g>
  );
};

/** a flat ghost silhouette for the queue: dashed cream outline over translucent slate. */
const Ghost: React.FC<{x: number; y: number; s?: number; f: number; seed?: number; o?: number}> = ({x, y, s = 1, f, seed = 0, o = 0.6}) => (
  <g transform={`translate(${x} ${y + 2 * Math.sin(f / 19 + seed)}) scale(${s})`} opacity={o}>
    <ellipse cx={0} cy={118} rx={44} ry={8} fill="#000" opacity={0.35} />
    <rect x={-34} y={0} width={68} height={118} rx={26} fill="#171C38" stroke={C.paper} strokeWidth={4} strokeDasharray="10 8" />
    <circle cy={-34} r={30} fill="#171C38" stroke={C.paper} strokeWidth={4} strokeDasharray="10 8" />
  </g>
);

const Posts: React.FC<{x1: number; x2: number; y: number; f: number; sway?: number}> = ({x1, x2, y, f, sway = 1}) => (
  <g>
    {[x1, x2].map((px) => (
      <g key={px}>
        <ellipse cx={px} cy={y + 6} rx={26} ry={7} fill="#000" opacity={0.4} />
        <rect x={px - 9} y={y - 180} width={18} height={180} rx={6} fill={C.brass} stroke={C.ink} strokeWidth={5} />
        <circle cx={px} cy={y - 188} r={16} fill={C.brass} stroke={C.ink} strokeWidth={5} />
      </g>
    ))}
    <path d={`M ${x1},${y - 150} Q ${(x1 + x2) / 2},${y - 100 + 12 * Math.sin(f / 21) * sway} ${x2},${y - 150}`} fill="none" stroke={C.verm} strokeWidth={12} strokeLinecap="round" />
  </g>
);

const Clock: React.FC<{x: number; y: number; s?: number; hand: number; f: number}> = ({x, y, s = 1, hand, f}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={120} fill={C.paper} stroke={C.ink} strokeWidth={9} />
    {Array.from({length: 12}).map((_, i) => <line key={i} x1={0} y1={-98} x2={0} y2={-112} stroke={C.ink} strokeWidth={6} transform={`rotate(${i * 30})`} />)}
    <line x1={0} y1={0} x2={0} y2={-64} stroke={C.ink} strokeWidth={9} strokeLinecap="round" transform={`rotate(${150})`} />
    <line x1={0} y1={0} x2={0} y2={-96} stroke={C.ink} strokeWidth={6} strokeLinecap="round" transform={`rotate(${lerp(-90, 0, hand) + 2 * Math.sin(f / 4) * (1 - hand)})`} />
    <circle r={9} fill={C.ink} />
  </g>
);

/** the tide as a rounded curve behind glass: one curve in a frame of rectangles. */
const Tide: React.FC<{x: number; y: number; w: number; h: number; f: number; fill?: string}> = ({x, y, w, h, f, fill = '#2C4A68'}) => (
  <g>
    <clipPath id={`tide${Math.round(x)}${Math.round(y)}`}><rect x={x} y={y} width={w} height={h} /></clipPath>
    <g clipPath={`url(#tide${Math.round(x)}${Math.round(y)})`}>
      <rect x={x} y={y} width={w} height={h * 0.5} fill="#3A3354" />
      <rect x={x} y={y + h * 0.5} width={w} height={h * 0.5} fill={fill} />
      <path d={`M ${x},${y + h * 0.5} ${Array.from({length: 9}).map((_, i) => `Q ${x + (i + 0.5) * w / 8},${y + h * 0.5 + 12 * Math.sin(f / 14 + i)} ${x + (i + 1) * w / 8},${y + h * 0.5}`).join(' ')} L ${x + w},${y + h} L ${x},${y + h} Z`} fill="#3F6A8C" opacity={0.7} />
    </g>
  </g>
);

const GlassWindow: React.FC<{x: number; y: number; w: number; h: number; f: number; tide?: boolean; lampOn?: boolean}> = ({x, y, w, h, f, tide = true, lampOn = true}) => (
  <g>
    {tide ? <Tide x={x} y={y} w={w} h={h} f={f} /> : <rect x={x} y={y} width={w} height={h} fill="#0F1B30" />}
    <rect x={x} y={y} width={w} height={h} fill="none" stroke={C.ink} strokeWidth={10} />
    <rect x={x} y={y} width={w} height={h} fill={C.glass} opacity={0.1} />
    <path d={`M ${x + 20},${y + h - 14} L ${x + 120},${y + 14}`} stroke="#FFFFFF" strokeWidth={6} opacity={0.18} />
    {lampOn && <rect x={x + w / 2 - 70} y={y - 40} width={140} height={22} rx={8} fill="#E8F2FF" stroke={C.ink} strokeWidth={5} opacity={0.95} />}
  </g>
);

const Counter: React.FC<{x: number; y: number; w?: number; label?: string}> = ({x, y, w = 760, label = 'FERC'}) => (
  <g>
    <rect x={x - w / 2} y={y} width={w} height={30} rx={6} fill={C.wood} stroke={C.ink} strokeWidth={7} />
    <rect x={x - w / 2 + 14} y={y + 30} width={w - 28} height={260} fill="#2A2038" stroke={C.ink} strokeWidth={7} />
    <text x={x} y={y + 190} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={40} letterSpacing={6} fill="#F2E8D0" opacity={0.85}>{label}</text>
  </g>
);

const Mailbox: React.FC<{x: number; y: number; s?: number; open?: number; f: number; flag?: number}> = ({x, y, s = 1, open = 0, f, flag = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={70} ry={10} fill="#000" opacity={0.4} />
    <rect x={-12} y={-150} width={24} height={150} rx={6} fill={C.woodD} stroke={C.ink} strokeWidth={6} />
    <g transform="translate(0 -190)">
      <path d="M -90,40 V -10 Q -90,-60 0,-60 Q 90,-60 90,-10 V 40 Z" fill="#7A8296" stroke={C.ink} strokeWidth={7} />
      <g transform={`translate(-90 -4) rotate(${-open * 80} 0 0)`}>
        <rect x={0} y={-4} width={14} height={50} rx={4} fill="#5A6074" stroke={C.ink} strokeWidth={5} />
      </g>
      {open > 0.5 && <path d="M -70,34 H 70" stroke="#0B1226" strokeWidth={8} opacity={0.7} />}
      <g transform={`translate(96 -20) rotate(${-flag * 70 + 10 * Math.sin(f / 9) * flag})`}><rect x={-4} y={-50} width={8} height={56} fill={C.verm} stroke={C.ink} strokeWidth={4} /><rect x={-4} y={-56} width={28} height={18} fill={C.verm} stroke={C.ink} strokeWidth={4} /></g>
    </g>
  </g>
);

const Tray: React.FC<{x: number; y: number; s?: number; f: number}> = ({x, y, s = 1, f}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${1.2 * Math.sin(f / 22)})`}>
    <rect x={-100} y={-16} width={200} height={50} rx={8} fill="#7A8296" stroke={C.ink} strokeWidth={6} />
    <rect x={-84} y={-8} width={168} height={14} rx={4} fill="#0B1226" opacity={0.55} />
  </g>
);

const Phone: React.FC<{x: number; y: number; s?: number; rot?: number; lit?: number}> = ({x, y, s = 1, rot = 0, lit = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-36} y={-70} width={72} height={140} rx={14} fill="#14101C" stroke={C.ink} strokeWidth={6} />
    <rect x={-28} y={-58} width={56} height={104} rx={6} fill={lit > 0.5 ? '#9FC4DC' : '#0B1226'} />
    <circle cy={58} r={6} fill="#3B4256" />
  </g>
);

const Hand: React.FC<{x: number; y: number; s?: number; rot?: number; sleeve?: string}> = ({x, y, s = 1, rot = 0, sleeve = '#1F2A44'}) => {
  const fr = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + 3 * Math.sin(fr / 12)}) scale(${s})`}>
      <rect x={-34} y={60} width={68} height={200} rx={14} fill={sleeve} stroke={C.ink} strokeWidth={6} />
      <rect x={-30} y={0} width={60} height={90} rx={26} fill={C.skin} stroke={C.ink} strokeWidth={6} />
      <rect x={-44} y={-40} width={88} height={64} rx={26} fill={C.skin} stroke={C.ink} strokeWidth={6} />
      {[-28, -9, 10, 28].map((fx, i) => <path key={i} d={`M ${fx},-38 v -22`} stroke={C.ink} strokeWidth={3} />)}
    </g>
  );
};

const Calendar: React.FC<{x: number; y: number; s?: number; rot?: number; f: number; line1: string; line2: string; flip?: number}> = ({x, y, s = 1, rot = 0, f, line1, line2, flip = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot + 1.5 * Math.sin(f / 20)}) scale(${s})`}>
    <rect x={-90} y={-100} width={180} height={190} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <rect x={-90} y={-100} width={180} height={44} rx={8} fill={C.slate} stroke={C.ink} strokeWidth={6} />
    <g transform={`scale(1 ${Math.max(0.05, Math.abs(Math.cos(clamp01(1 - flip) * Math.PI)))})`}>
      <text y={-68} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={C.paper}>{line1}</text>
      <text y={20} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={C.ink}>{line2}</text>
    </g>
  </g>
);

const Lever: React.FC<{x: number; y: number; s?: number; lock: number; tug?: number; f: number}> = ({x, y, s = 1, lock, tug = 0, f}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-60} y={-14} width={120} height={160} rx={12} fill={C.slate} stroke={C.ink} strokeWidth={7} />
    <rect x={-10} y={0} width={20} height={120} rx={8} fill="#0B1226" />
    <g transform={`rotate(${-8 * tug * Math.sin(f / 2)} 0 120)`}>
      <rect x={-12} y={-34 + 30 * (1 - lock)} width={24} height={110} rx={10} fill={C.brass} stroke={C.ink} strokeWidth={6} />
      <circle cx={0} cy={-40 + 30 * (1 - lock)} r={20} fill={C.brass} stroke={C.ink} strokeWidth={6} />
    </g>
    <g transform={`translate(0 ${70 + 8 * Math.sin(f / 9) * lock}) rotate(${lock > 0.5 ? 0 : -30})`} opacity={clamp01(lock * 3)}>
      <rect x={-26} y={-6} width={52} height={44} rx={8} fill={C.brass} stroke={C.ink} strokeWidth={6} />
      <path d="M -14,-6 V -26 Q -14,-46 0,-46 Q 14,-46 14,-26 V -6" fill="none" stroke={C.ink} strokeWidth={7} />
    </g>
    <text y={-62} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={3} fill={C.paper}>BUILD</text>
  </g>
);

const Binder: React.FC<{x: number; y: number; s?: number; rot?: number; title?: string; blank?: boolean; pages?: number; w?: number}> = ({x, y, s = 1, rot = 0, title = 'STUDY', blank = false, pages = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={118} rx={140} ry={12} fill="#000" opacity={0.35} />
    <rect x={-120} y={-100} width={240} height={210} rx={10} fill={blank ? C.paper : C.slate} stroke={C.ink} strokeWidth={7} />
    <rect x={-120} y={-100} width={36} height={210} rx={8} fill={C.ink} opacity={0.5} />
    <g>{Array.from({length: Math.round(pages * 5)}).map((_, i) => <rect key={i} x={-70 + i * 5} y={-86 + i * 2} width={160} height={190} rx={4} fill={C.white} stroke={C.ink} strokeWidth={3} opacity={0.9} />)}</g>
    {!blank && <text x={20} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} letterSpacing={3} fill={C.paper}>{title}</text>}
  </g>
);

const Magnifier: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={44} y={44} width={22} height={120} rx={10} fill={C.woodD} stroke={C.ink} strokeWidth={6} transform="rotate(-45 55 55)" />
    <circle r={70} fill="#FFFFFF" fillOpacity={0.22} stroke={C.ink} strokeWidth={10} />
    <circle r={58} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.5} />
  </g>
);

const Folder: React.FC<{x: number; y: number; s?: number; rot?: number; tab: string}> = ({x, y, s = 1, rot = 0, tab}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -90,-70 H -20 L 0,-90 H 90 V 80 H -90 Z" fill="#D8C68A" stroke={C.ink} strokeWidth={6} />
    <rect x={-20} y={-100} width={110} height={30} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
    <text x={35} y={-78} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={17} fill={C.ink}>{tab}</text>
  </g>
);

const Pencil: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-8} y={-130} width={16} height={130} fill={C.brass} stroke={C.ink} strokeWidth={5} />
    <path d="M -8,0 L 0,34 L 8,0 Z" fill="#E3C79A" stroke={C.ink} strokeWidth={4} />
    <rect x={-8} y={-146} width={16} height={18} rx={4} fill="#C75A5A" stroke={C.ink} strokeWidth={4} />
  </g>
);

const Chair: React.FC<{x: number; y: number; s?: number; out?: number; label: string; rot?: number}> = ({x, y, s = 1, out = 0, label, rot = 0}) => (
  <g transform={`translate(${x} ${y + 150 * out}) rotate(${rot * out}) scale(${s})`}>
    <ellipse cx={0} cy={16} rx={90} ry={14} fill="#000" opacity={0.35} />
    <rect x={-70} y={-70} width={140} height={90} rx={22} fill={C.slate} stroke={C.ink} strokeWidth={7} />
    <rect x={-60} y={-8} width={120} height={20} rx={8} fill="#3A3354" stroke={C.ink} strokeWidth={5} />
    <rect x={-46} y={-52} width={92} height={32} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    <text y={-30} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={label.length > 7 ? 15 : 18} fill={C.ink}>{label}</text>
  </g>
);

const BlueTag: React.FC<{x: number; y: number; s?: number; o?: number; rot?: number}> = ({x, y, s = 1, o = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <rect x={-17} y={-11} width={34} height={22} rx={4} fill={C.fleet} stroke={C.ink} strokeWidth={3} />
    <circle cx={-9} cy={0} r={3.2} fill={C.ink} opacity={0.7} />
  </g>
);

const wrapText = (t: string, n: number) => {
  const out: string[] = [];
  let cur = '';
  for (const w of t.split(' ')) {
    if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  return out;
};
/** a quote card sized to its lines by arithmetic; `typed` 0..1 reveals the characters in order. */
const QuoteCard: React.FC<{text: string; head: string; x: number; y: number; size?: number; wrap?: number; typed?: number; p?: number}> = ({text, head, x, y, size = 30, wrap = 28, typed = 1, p = 1}) => {
  const ls = wrapText(text, wrap);
  const w = Math.max(...ls.map((l) => monoW(l, size, 0))) + 56;
  const h = ls.length * (size + 14) + 90;
  let left = Math.round(clamp01(typed) * text.length);
  if (p <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp01(p * 1.6)}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={12} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={7} />
      <rect x={-w / 2} y={-h / 2} width={w} height={40} rx={12} fill={C.slate} stroke={C.ink} strokeWidth={7} />
      <text x={0} y={-h / 2 + 28} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} letterSpacing={3} fill={C.paper}>{head}</text>
      {ls.map((l, i) => {
        const take = Math.max(0, Math.min(l.length, left));
        left -= l.length + 1;
        return <text key={i} x={-w / 2 + 28} y={-h / 2 + 76 + i * (size + 14)} fontFamily={MONO} fontWeight={800} fontSize={size} fill={C.ink}>{l.slice(0, take)}</text>;
      })}
    </g>
  );
};

// ---- bands: the ticket tracker on top, six states of the throughline -----------------------------------------------------------------------------
const TOPS = [{k: 2, t: 'PRINTED'}, {k: 6, t: 'FILED'}, {k: 12, t: 'IN LINE'}, {k: 17, t: 'PINNED'}, {k: 28, t: 'UNDER LENS'}, {k: 35, t: 'SPLIT'}];
const Bands: React.FC<{beats: Beat[]}> = ({beats}) => {
  const f = useCurrentFrame();
  const at = (k: number) => {
    const x = beats.find((y) => y.id === (IDS[k] ?? k));
    return x ? Math.round(x.at * 30) : 99999;
  };
  const cur = TOPS.filter((q) => f >= at(q.k)).length - 1;
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <g data-band="ok">
        <text x={60} y={150} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill={C.paper} opacity={0.85}>THE TICKET · FERC P-15423</text>
        {TOPS.map((q, i) => {
          const x = 44 + i * 164, on = i <= cur, now = i === cur;
          return (
            <g key={i} transform={`translate(${x} 205)`}>
              <rect x={0} y={-34} width={154} height={68} rx={10} fill={now ? C.paper : on ? '#3B4256' : '#232842'} stroke={now ? C.ink : C.paper} strokeWidth={now ? 5 : 3} opacity={on ? 1 : 0.8} />
              <text x={77} y={7} textAnchor="middle" fontFamily={MONO} fontSize={q.t.length > 8 ? 17 : 20} fontWeight={900} fill={now ? C.ink : C.paper}>{q.t}</text>
            </g>
          );
        })}
        {f >= at(8) && <rect x={48} y={296} width={monoW('PROPOSED · FERC HAS NOT RULED', 20, 2) + 26} height={32} rx={6} fill="#0B1226" opacity={0.92} />}
        {f >= at(8) && <text x={60} y={318} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill={C.lemon} opacity={0.95}>PROPOSED · FERC HAS NOT RULED</text>}
        <line x1={44} y1={270} x2={1020} y2={270} stroke={C.paper} strokeWidth={3} strokeDasharray="6 10" opacity={0.6} />
        <circle cx={44 + Math.max(0, cur) * 164 + 77} cy={270} r={9} fill={C.paper} />
      </g>
    </svg>
  );
};

// ---- S1: the dispenser, low behind the queue rope --------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [1, 2, 3];
  const flip = ease(f, b(1) + 4, 14);
  const pr = ease(f, b(2) - 8, 18);
  const tk = ease(f, b(2) + 6, 22);
  const nxt = ease(f, b(3) - 6, 20);
  return (
    <Frame p={p} mode="shore" z0={1.06} z1={1.16} oy={1010}>
      <SVG>
        <Spruces y={1180} n={9} seed={2} f={f} x0={-40} x1={420} scale={1.1} />
        <Spruces y={1180} n={7} seed={7} f={f} x0={660} x1={1120} scale={0.9} />
        <g transform="translate(980 1160)" opacity={0.9}><Moose x={0} y={0} scale={0.42} f={f} facing={-1} emotion="calm" /></g>
        <HeldProp f={f} px={540} py={1190} w={360} h={470} seed={1.3} kind="rest">
          <TakeANumberMachine f={f} x={540} y={1270} s={1.25} head="APPLIED FOR" flip={flip} print={pr} shake={Math.max(0, 1 - ease(f, b(1), 18)) * (f > b(1) ? 1 : 0)} sign="P-15423" />
        </HeldProp>
        <Ticket x={lerp(540, 700, tk)} y={lerp(1230, 1300, tk) + 10 * Math.sin(f / 10)} s={0.46} rot={lerp(0, 14, tk)} curl={1 - tk} />
        <g transform={`translate(${lerp(540, 260, nxt)} ${lerp(1040, 1220, nxt)})`} opacity={nxt}><Ticket s={0.34} num="NEXT" rot={-10} /></g>
        <Posts x1={130} x2={950} y={1500} f={f} />
        <Posts x1={150} x2={420} y={1360} f={f + 10} />
        <HeldTravel f={f} x={378} y={910} w={324} h={350} mode="sweep" seed={1} strength={0.16} rx={30} />
        <Plate x={540} y={585} text="COOK INLET" size={44} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} displayLines={['PRELIMINARY PERMIT', '· FERC P-15423']} text="PRELIMINARY PERMIT · FERC P-15423" size={34} tone="glow" p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="NEXT?" size={52} p={vis(f, b, K, 2)} />
      </SVG>
    </Frame>
  );
};

// ---- S2: the counter, interior, eye-level through the window glass ----------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [4, 43, 5, 6, 7];
  const arrive = easeIO(f, b(4) - 10, 40);
  const slide = easeIO(f, b(4) + 18, 36);
  const rise = ease(f, b(43), 26);
  const glance = ease(f, b(5), 14);
  const stampDown = springy(f, b(6) - 6, 16);
  const sunk = easeIO(f, b(7), 46);
  return (
    <Frame p={p} mode="room" z0={1.04} z1={1.09} oy={980}>
      <SVG>
        <GlassWindow x={150} y={600} w={800} h={520} f={f} />
        <g transform="translate(0 0)">
          <Posts x1={760} x2={900} y={1090} f={f} />
          <g transform={`translate(540 ${lerp(980, 1130, sunk)})`} opacity={1 - 0.2 * sunk}>
            <rect x={-130} y={-70} width={260} height={110} fill="none" stroke={C.paper} strokeWidth={6} strokeDasharray="16 10" />
            {[-80, -26, 28, 82].map((hx) => <rect key={hx} x={hx - 20} y={-44} width={40} height={64} fill="none" stroke={C.paper} strokeWidth={4} strokeDasharray="8 6" />)}
          </g>
        </g>
        <Counter x={540} y={1130} />
        <g transform={`translate(${lerp(120, 320, arrive)} 960)`}>
          <Person x={0} y={0} s={1.05} dress="suit" f={f} seed={2.1} armUp={slide * 0.4} cues={[b(4), b(6)]} />
          <g transform="translate(78 150)"><rect x={-44} y={0} width={88} height={64} rx={8} fill={C.wood} stroke={C.ink} strokeWidth={6} /><rect x={-26} y={-14} width={52} height={16} rx={5} fill="none" stroke={C.ink} strokeWidth={5} /><Lab text="NEEDHAM MA" x={0} y={106} size={16} tone="plate" p={1} /></g>
        </g>
        <g transform={`translate(760 ${lerp(1010, 880, rise)})`} opacity={clamp01(rise * 3)}>
          <Person x={0} y={0} s={1.0} dress="clerk" f={f} seed={5.3} look={-glance} armUp={stampDown * 0.7} mood="stern" />
        </g>
        <Ticket x={lerp(400, 640, slide)} y={lerp(1090, 1090, slide) + 30 * Math.sin(slide * 3.14)} s={0.42} stamps={stampDown > 0.2 ? ['PRELIMINARY PERMIT'] : []} stampK={stampDown} rot={lerp(-8, 0, slide)} />
        <g transform={`translate(660 ${lerp(900, 1040, stampDown)})`} opacity={rise}><rect x={-40} y={-14} width={80} height={40} rx={8} fill={C.slate} stroke={C.ink} strokeWidth={6} /><rect x={-10} y={-64} width={20} height={52} rx={6} fill={C.woodD} stroke={C.ink} strokeWidth={5} /></g>
        <g transform="translate(240 760)" opacity={0.9}><TakeANumberMachine f={f} x={0} y={0} s={0.28} head="APPLIED FOR" sign="P-15423" /></g>
        <Plate x={540} y={585} displayLines={['DEEPGREEN', 'COOK INLET SPV LLC']} text="DEEPGREEN COOK INLET SPV LLC" size={32} p={vis(f, b, K, 0)} />
        <Plate x={540} y={690} text="FEDERAL REGULATORS" size={34} p={vis(f, b, K, 1)} />
        <Plate x={540} y={772} text="FERC" size={50} tone="glow" p={vis(f, b, K, 2)} />
        <Plate x={540} y={854} text="PRELIMINARY PERMIT" size={38} tone="plate" p={vis(f, b, K, 3)} />
        <Plate x={540} y={940} displayLines={['PROPOSED ·', 'UNDERWATER DATA CENTER']} text="PROPOSED · UNDERWATER DATA CENTER" size={32} p={vis(f, b, K, 4)} />
        <HeldTravel f={f} x={160} y={610} w={780} h={500} mode="sweep" seed={2} strength={0.12} />
      </SVG>
    </Frame>
  );
};

// ---- S3: the seabed -------------------------------------------------------------------------------------------------------------------------------
const Pod: React.FC<{x: number; y: number; s?: number; draw: number; f: number; seed: number}> = ({x, y, s = 1, draw, f, seed}) => (
  <g transform={`translate(${x} ${y + 3 * Math.sin(f / 21 + seed)}) scale(${s})`} opacity={clamp01(draw * 2)}>
    <path d="M -70,-44 L 0,-82 L 70,-44 V 44 L 0,82 L -70,44 Z" fill="#2B5F86" fillOpacity={0.5 * draw} stroke={C.paper} strokeWidth={8} strokeDasharray="16 9" strokeDashoffset={(1 - draw) * 200} />
    <path d="M -44,-40 H 44 V 40 H -44 Z" fill="none" stroke={C.paper} strokeWidth={3.5} strokeDasharray="10 7" opacity={0.8} />
  </g>
);
const Turbine: React.FC<{x: number; y: number; s?: number; up: number; f: number; seed: number}> = ({x, y, s = 1, up, f, seed}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp01(up * 2.2)}>
    <path d={`M 0,${180 - 140 * up} V 190 M -40,190 H 40`} stroke={C.paper} strokeWidth={8} strokeLinecap="round" strokeDasharray="14 9" />
    <g transform={`translate(0 ${60 + 120 * (1 - up)})`}>
      <circle r={52} fill="none" stroke={C.paper} strokeWidth={5} strokeDasharray="12 8" />
      <g transform={`rotate(${f * (3 + seed % 3) * up})`}>{[0, 120, 240].map((a) => <path key={a} d="M0 0Q16-14 13-45Q-12-39-13-9Z" transform={`rotate(${a})`} fill={C.paper} fillOpacity={0.18} stroke={C.paper} strokeWidth={3.5} />)}</g>
      <circle r={9} fill={C.ink} stroke={C.paper} strokeWidth={3} />
    </g>
  </g>
);
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [8, 38, 9, 51];
  const dive = easeIO(f, b(8), 60);
  const draw = (i: number) => ease(f, b(38) + i * 3, 24);
  const up = (i: number) => ease(f, b(9) + i * 4, 30);
  const pods = Array.from({length: 18}).map((_, i) => ({x: 150 + (i % 6) * 150, y: 1080 + Math.floor(i / 6) * 100, i}));
  return (
    <Frame p={p} mode="sea" cam={track([{t: 0, z: 1.05, fx: 540, fy: 760}, {t: 70, z: 1.1, fx: 540, fy: 1080}, {t: Math.max(80, p.dur), z: 1.16, fx: 560, fy: 1100}])}>
      <SVG>
        <g opacity={1 - dive}><rect x={0} y={560} width={1080} height={8} fill="#BFE6F0" /></g>
        {pods.map((q) => <Pod key={q.i} x={q.x} y={q.y} s={0.62} draw={draw(q.i)} f={f} seed={q.i} />)}
        {pods.filter((q) => q.i % 3 === 0).map((q, j) => <Turbine key={q.i} x={q.x + 40} y={q.y - 190} s={0.7} up={up(j)} f={f} seed={j} />)}
        <Lab text="66 PROPOSED PODS" x={540} y={1300} size={22} tone="dark" p={ease(f, b(38), 18)} />
        <HeldTravel f={f} x={150} y={1000} w={760} h={60} mode="runner" seed={3} path={[[150, 1030], [910, 1030]]} />
        <Plate x={540} y={585} text="PROPOSED · 66 SUBSEA PODS" size={34} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="PODS ON THE SEABED" size={36} p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="PROPOSED · 330 TO 350 TURBINES" size={32} p={vis(f, b, K, 2)} />
        <Plate x={540} y={832} text="PROPOSED TIDAL TURBINES" size={36} p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the cable chart, a real chart with a shore, contours and a route through the lower third ---------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [10, 39, 11];
  const needle = springy(f, b(10), 30);
  const bar = easeIO(f, b(39), 34);
  const cab = easeIO(f, b(11), 60);
  const pulse = clamp01((f - b(11) - 60) / 40) % 1;
  const path = 'M 230,1250 C 380,1200 520,1300 680,1210 S 840,1120 880,1090';
  return (
    <Frame p={p} mode="chart" cam={(fr: number) => ({z: 1.08, fx: lerp(420, 700, easeIO(fr, b(11), 60)), fy: lerp(900, 1000, easeIO(fr, b(39), 60))})}>
      <SVG>
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M -20,${980 + i * 90} C 200,${940 + i * 90} 420,${1020 + i * 90} 640,${960 + i * 92} S 760,${900 + i * 80} 800,${860 + i * 70}`} fill="none" stroke="#5B8DB0" strokeWidth={3} opacity={0.5 - i * 0.06} strokeDasharray={i % 2 ? '10 8' : undefined} />)}
        <path data-band="ok" d="M 760,1920 L 790,1500 Q 820,1220 880,1060 Q 940,900 1080,820 L 1080,1920 Z" fill="#E8D9A8" stroke={C.ink} strokeWidth={6} />
        <path data-band="ok" d="M 800,1920 L 826,1520 Q 856,1240 914,1080 Q 970,930 1080,862 L 1080,1920 Z" fill={C.ground} stroke={C.ink} strokeWidth={5} />
        <Spruces y={1080} n={5} seed={4} f={f} x0={930} x1={1080} scale={0.45} />
        <g transform="translate(540 700) scale(1.3)">
          <path d="M -170,0 A 170,170 0 0 1 170,0" fill={C.paper} stroke={C.ink} strokeWidth={8} />
          {Array.from({length: 9}).map((_, i) => <line key={i} x1={0} y1={-130} x2={0} y2={-150} stroke={C.ink} strokeWidth={5} transform={`rotate(${-80 + i * 20})`} />)}
          <path d="M -150,-6 A 150,150 0 0 1 150,-6" fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="12 9" opacity={0.5} />
          <line x1={0} y1={0} x2={0} y2={-128} stroke={C.vermD} strokeWidth={9} strokeLinecap="round" transform={`rotate(${lerp(-80, 8, needle) + 2.5 * Math.sin(f / 3) * needle})`} />
          <circle r={14} fill={C.ink} />
          <rect x={-170} y={0} width={340} height={26} fill={C.ink} />
          <text y={20} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={16} fill={C.paper}>MW · PROPOSED</text>
        </g>
        {[0, 1, 2].map((i) => <Pod key={i} x={180 + i * 70} y={1170 + i * 26} s={0.5} draw={1} f={f} seed={i} />)}
        <g>
          <rect x={150} y={1060} width={300} height={22} rx={8} fill="none" stroke={C.paper} strokeWidth={4} strokeDasharray="10 7" />
          <rect x={152} y={1062} width={296 * bar} height={18} rx={6} fill={C.paper} opacity={0.9} />
          <Lab text="LOAD" x={120} y={1071} size={14} tone="dark" p={1} />
        </g>
        <path d={path} fill="none" stroke={C.ink} strokeWidth={24} strokeLinecap="round" pathLength={100} strokeDasharray={`${cab * 100} 100`} />
        <path d={path} fill="none" stroke={C.paper} strokeWidth={10} strokeLinecap="round" pathLength={100} strokeDasharray={`${cab * 7} 6`} strokeDashoffset={-f * 0.5} opacity={cab > 0.02 ? 1 : 0} />
        {cab > 0.98 && <circle cx={lerp(230, 880, pulse)} cy={lerp(1250, 1090, pulse) + 40 * Math.sin(pulse * 3.14)} r={14} fill={C.lemon} stroke={C.ink} strokeWidth={4} />}
        <g transform="translate(880 1080)" opacity={ease(f, b(11) + 30, 18)}><circle r={22} fill={C.verm} stroke={C.ink} strokeWidth={6} /><circle r={7} fill={C.paper} /><Lab text="NIKISKI" x={60} y={-54} size={20} tone="dark" p={1} /></g>
        <HeldTravel f={f} x={230} y={1080} w={650} h={200} mode="runner" seed={4} path={[[230, 1250], [380, 1220], [520, 1280], [680, 1210], [880, 1090]]} />
        <Plate x={540} y={850} text="ABOUT 100 MW" size={44} tone="glow" p={vis(f, b, K, 0)} />
        <Plate x={540} y={930} text="MOSTLY THE DATA CENTER" size={32} p={vis(f, b, K, 1)} />
        <Plate x={540} y={1005} text="ABOUT 3.5 MILES · NIKISKI" size={32} p={vis(f, b, K, 2)} />
      </SVG>
    </Frame>
  );
};

// ---- S5: the ticket, tearing, the queue, the dark license window, the lock -------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [12, 13, 44, 15, 14];
  const grow = ease(f, b(12) - 4, 26);
  const tear = easeIO(f, b(12) + 6, 26) * 0.3 * (1 - easeIO(f, b(13) + 4, 24));
  const front = easeIO(f, b(13), 40);
  const reach = easeIO(f, b(44), 40);
  const quote = ease(f, b(15), 24);
  const type = clamp01((f - b(15) - 12) / 90);
  const lock = springy(f, b(14), 18);
  const QUOTE = `"A preliminary permit doesn't give us permission to build anything." LOUIS WOLFSON, DEEPGREEN`;
  return (
    <Frame p={p} mode="room" z0={1.03} z1={1.1} oy={980}>
      <SVG>
        <rect data-band="ok" x={0} y={1150} width={1080} height={770} fill="#3A2E3E" />
        {Array.from({length: 8}).map((_, i) => <path key={`cb${i}`} d={`M 0,${1180 + i * 90} H 1080`} stroke="#2A2030" strokeWidth={4} />)}
        {[0, 1, 2, 3, 4].map((i) => <Ghost key={i} x={lerp(330 + i * 50, 250 + i * 40, front) + 8 * Math.sin(f / 9 + i)} y={930} s={0.8} f={f} seed={i} o={0.5} />)}
        <g transform={`translate(${lerp(400, 300, front)} 940)`}>
          <Person x={0} y={0} s={0.8} dress="suit" f={f} seed={2.1} />
        </g>
        <g opacity={clamp01(quote < 0.5 ? 1 - quote * 2 : 0)}>
          <g transform={`translate(760 ${lerp(860, 820, grow)})`} opacity={1}>
            {tear < 0.02 && f > b(12) + 40 ? <Ticket x={0} y={0} s={2.6} /> : (
            <g>
            <g transform={`translate(${-34 * tear} 0) rotate(${-5 * tear})`}>
              <clipPath id="t5l"><rect x={-180} y={-250} width={180} height={500} /></clipPath>
              <g clipPath="url(#t5l)"><Ticket x={0} y={0} s={2.6} /></g>
              <rect x={-170} y={214} width={160} height={46} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} opacity={tear} />
              <text x={-90} y={246} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} fill={C.ink} opacity={tear}>STUDY</text>
            </g>
            <g transform={`translate(${34 * tear} 0) rotate(${5 * tear})`}>
              <clipPath id="t5r"><rect x={0} y={-250} width={180} height={500} /></clipPath>
              <g clipPath="url(#t5r)"><Ticket x={0} y={0} s={2.6} /></g>
              <rect x={10} y={214} width={170} height={46} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} opacity={tear} />
              <text x={95} y={244} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={16} fill={C.ink} opacity={tear}>PLACE IN LINE</text>
            </g>
            </g>
            )}
          </g>
        </g>
        <g transform={`translate(${lerp(990, 940, reach)} 860)`} opacity={ease(f, b(44) - 6, 16)}>
          <rect x={-90} y={-130} width={180} height={230} rx={8} fill="#0B1226" stroke={C.paper} strokeWidth={6} />
          <text y={-60} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={3} fill={C.paper} opacity={0.5}>LICENSE</text>
          <path d="M -60,0 H 60" stroke={C.paper} strokeWidth={4} strokeDasharray="8 8" opacity={0.4} />
        </g>
        <g transform={`translate(${lerp(820, 940, reach)} ${lerp(1150, 1190, reach)})`} opacity={front > 0.2 ? 1 : 0}><Ticket s={0.34} rot={-8} /></g>
        <QuoteCard text={QUOTE} head="THE COMPANY'S WORDS" x={540} y={lerp(1090, 1020, quote)} size={32} wrap={27} typed={type} p={quote} />
        <g transform="translate(160 840)" opacity={ease(f, b(14) - 10, 16)}><Lever x={0} y={0} s={0.9} lock={lock} f={f} /></g>
        <Plate x={305} y={585} text="STUDY PRIORITY ONLY" size={28} p={vis(f, b, K, 0)} />
        <Plate x={305} y={668} text="FIRST PLACE IN LINE" size={28} tone="glow" p={vis(f, b, K, 1)} />
        <Plate x={315} y={750} text="LICENSE · APPLY LATER" size={26} p={vis(f, b, K, 2)} />
        <Plate x={540} y={832} text="THE COMPANY'S OWN WORDS" size={34} p={vis(f, b, K, 3)} />
        <Plate x={540} y={1240} text="BUILD · LOCKED" size={44} tone="plate" p={vis(f, b, K, 4)} />
        <HeldTravel f={f} x={513} y={464} w={414} h={552} mode="sweep" seed={5} strength={0.16} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the docket window, the shutter, the deadline ------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [50, 16, 17];
  const hand = ease(f, b(16) - 4, 12) * 0.9 + 0.1 * ease(f, b(16), 20);
  const leaf = ease(f, b(16), 14);
  const shut = springy(f, b(17) + 2, 12);
  const slip = easeIO(f, b(17) - 18, 20);
  const dead = 1 - clamp01(shut);
  const rise = easeIO(f, b(50), 60);
  return (
    <Frame p={p} mode="room" z0={1.03} z1={1.08} oy={980}>
      <SVG>
        <GlassWindow x={420} y={640} w={520} h={480} f={f} lampOn={dead > 0.4} />
        <g transform={`translate(0 ${-480 * (1 - clamp01(shut))})`}>
          <rect x={414} y={640 - 0} width={532} height={490} fill="#3A3354" stroke={C.ink} strokeWidth={9} />
          {Array.from({length: 10}).map((_, i) => <rect key={i} x={420} y={650 + i * 46} width={520} height={22} fill="#4A4466" opacity={0.8} />)}{Array.from({length: 10}).map((_, i) => <line key={`l${i}`} x1={420} y1={680 + i * 46} x2={940} y2={680 + i * 46} stroke={C.ink} strokeWidth={4} opacity={0.6} />)}
          <text x={680} y={870} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={44} letterSpacing={4} fill={C.paper} opacity={0.7}>OBJECTIONS</text><text x={680} y={930} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={44} letterSpacing={4} fill={C.paper} opacity={0.7}>CLOSED</text><rect x={414} y={1110} width={532} height={22} fill={C.slate} stroke={C.ink} strokeWidth={6} />
        </g>
        <g transform="translate(830 1000)" opacity={clamp01(shut * 3)}><Ticket s={0.34} rot={-6} /></g>
        <Clock x={270} y={960} s={0.85} hand={lerp(0, hand, 1) * (f < b(16) - 6 ? rise * 0.6 : 1)} f={f} />
        <g transform="translate(160 1150)"><circle r={44} fill="#173246" stroke={C.ink} strokeWidth={7} /><path d={`M -40,0 Q -20,${-18 + 14 * Math.sin(f / 12)} 0,0 T 40,0`} fill="none" stroke="#9FC4DC" strokeWidth={6} /><Lab text="TIDE" x={0} y={78} size={16} tone="dark" p={1} /></g>
        <Calendar x={290} y={1230} s={0.55} f={f} line1="NOVEMBER" line2="2ND" flip={leaf} />
        <g transform="translate(560 1200)"><rect x={-120} y={-34} width={240} height={68} rx={8} fill={shut > 0.5 ? C.brass : C.paper} stroke={C.ink} strokeWidth={6} /><text y={-8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={14} letterSpacing={2} fill={C.ink}>OBJECTIONS</text><text y={20} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={C.ink}>{shut > 0.5 && f > b(17) + 14 ? 'DEADLINE PASSED' : 'OPEN'}</text></g>
        <g transform="translate(900 1260)"><TakeANumberMachine f={f} x={0} y={0} s={0.5} head="APPLIED FOR" sign={'P-15423'} /></g>
        <g transform="translate(780 1230)" opacity={0.95}><Ticket s={0.24} num="NEXT" rot={-8} /></g>
        <g transform={`translate(${lerp(1160, 700, slip)} ${lerp(1010, 1050, slip)})`} opacity={slip > 0.02 && shut < 0.6 ? 1 : 0}><BlueTag x={0} y={0} s={1.8} rot={-10} /><Folder x={60} y={30} s={0.5} rot={8} tab="INTERVENE" /></g>
        <Plate x={540} y={585} text="DEADLINE FOR OBJECTIONS" size={34} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="5 PM EASTERN" size={46} p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="DEADLINE · NOVEMBER 2ND" size={38} tone="warn" p={vis(f, b, K, 2)} />
        <HeldTravel f={f} x={420} y={650} w={520} h={470} mode="shadow" seed={6} />
      </SVG>
    </Frame>
  );
};

// ---- S7: the mayor, the empty mailbox, the queue already formed ----------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [18, 19, 20];
  const open = ease(f, b(18) + 6, 20);
  const shake = Math.sin(clamp01((f - b(19)) / 30) * Math.PI * 4) * (1 - clamp01((f - b(19) - 30) / 10)) * (f > b(19) ? 1 : 0);
  const phone = easeIO(f, b(20), 36);
  const turn = easeIO(f, b(20) + 75, 30);
  const QUOTE2 = `"Sloppy is the way I would describe this approach" MAYOR PETER MICCICHE`;
  return (
    <Frame p={p} mode="shore" z0={1.04} z1={1.1} oy={1000}>
      <SVG>
        <Spruces y={1180} n={8} seed={5} f={f} x0={-20} x1={1100} scale={0.9} />
        <Posts x1={90} x2={330} y={1170} f={f} />
        {[0, 1, 2, 3].map((i) => <Ghost key={i} x={120 + i * 56} y={1040} s={0.62} f={f} seed={i} o={0.35 + 0.5 * turn} />)}
        <g transform="translate(150 1030)" opacity={0.35 + 0.6 * turn}><Ticket s={0.28} /></g>
        <g transform={`translate(620 790)`}>
          <Person x={0} y={0} s={1.55} dress="parka" skin={C.skin2} f={f} seed={1.1} cues={[b(18), b(19), b(20), b(20) + 75]} flip={turn > 0.5 ? -1 : 1} armUp={open * 0.5} mood={turn > 0.4 ? 'surprised' : 'stern'} look={-shake} />
        </g>
        <Mailbox x={900} y={990} s={1.35} open={open} f={f} />
        <Tray x={900} y={860} s={1.1} f={f} />
        <g transform={`translate(${lerp(700, 830, phone)} ${lerp(1180, 1030, easeIO(f, b(20), 20)) + 60 * clamp01((f - b(20) - 30) / 20)})`}><Phone x={0} y={0} s={0.55} rot={-8 * phone} lit={0} /></g>
        <g transform="translate(560 1190)"><rect x={-60} y={-12} width={120} height={80} rx={6} fill="#D8C68A" stroke={C.ink} strokeWidth={5} transform={`rotate(${-4 + 4 * shake})`} /></g>
        <QuoteCard text={QUOTE2} head="THE MAYOR" x={540} y={1230} size={22} wrap={36} typed={clamp01((f - b(19)) / 50)} p={ease(f, b(19) - 4, 14)} />
        <Plate x={540} y={585} text="MAYOR PETER MICCICHE" size={34} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="CALLED IT SLOPPY" size={44} tone="warn" p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} displayLines={['NO EMAIL, LETTER', 'OR CALL, HE SAYS']} text="NO EMAIL, LETTER OR CALL, HE SAYS" size={34} p={vis(f, b, K, 2)} />
        <HeldTravel f={f} x={800} y={720} w={200} h={240} mode="sweep" seed={7} strength={0.08} rx={40} />
      </SVG>
    </Frame>
  );
};

// ---- S8: the counter again, TOO EARLY ----------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [21, 47, 22];
  const turn = easeIO(f, b(21), 34);
  const nxt = ease(f, b(47), 20);
  const pencil = clamp01((f - b(22)) / 70);
  const band = ease(f, b(22) + 54, 12);
  return (
    <Frame p={p} mode="room" z0={1.06} z1={1.12} oy={1000}>
      <SVG>
        <GlassWindow x={560} y={640} w={440} h={400} f={f} />
        <g transform="translate(830 1000)"><Mailbox x={0} y={0} s={0.55} open={0} f={f} /></g>
        <Counter x={540} y={1130} w={900} label="PUBLIC COUNTER" />
        <g transform="translate(330 960)"><Person x={0} y={0} s={1.15} dress="suit" f={f} seed={2.1} armUp={turn * 0.5} /></g>
        <g transform={`translate(${lerp(820, 420, easeIO(f, 0, 40))} ${lerp(1010, 1000, easeIO(f, 0, 40))})`}><Ticket s={0.34} rot={-6} /></g>
        <g transform={`translate(560 ${lerp(980, 930, turn)})`}><Calendar x={0} y={0} s={1.15} f={f} line1="LATER" line2="TOO EARLY" flip={turn} /></g>
        <g transform={`translate(${lerp(1060, 920, nxt)} 1100)`} opacity={nxt}><rect x={-40} y={-10} width={110} height={26} rx={6} fill={C.slate} stroke={C.ink} strokeWidth={5} /><Ticket x={10} y={-70} s={0.3} num="NEXT" rot={-6} /></g>
        <g transform="translate(620 1180)">
          <rect x={-150} y={-40} width={300} height={70} rx={10} fill="#C9D6F0" stroke={C.ink} strokeWidth={6} transform="rotate(-2)" />
          <path d={`M -130,-10 L ${-130 + 240 * pencil},${-10 + 14 * Math.sin(pencil * 12)}`} stroke={C.ink} strokeWidth={4} />
          <g opacity={band}><rect x={-20} y={-52} width={40} height={94} fill="none" stroke={C.verm} strokeWidth={0} /><path d="M -40,-48 H 40 M -40,36 H 40" stroke="#C75A5A" strokeWidth={8} strokeLinecap="round" /></g>
          <Pencil x={-130 + 240 * pencil} y={-10} rot={28} s={0.6} />
        </g>
        <Plate x={540} y={585} displayLines={['COMPANY SAYS TOO EARLY', 'TO CONTACT OFFICIALS']} text="COMPANY SAYS TOO EARLY TO CONTACT OFFICIALS" size={32} p={vis(f, b, K, 0)} />
        <Plate x={540} y={690} text="NEXT?" size={50} p={vis(f, b, K, 1)} />
        <Plate x={540} y={800} text="ON PAPER FIRST" size={46} p={vis(f, b, K, 2)} />
        <HeldTravel f={f} x={560} y={640} w={440} h={400} mode="sweep" seed={8} strength={0.12} />
      </SVG>
    </Frame>
  );
};

// ---- S9: the permit wall ------------------------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [23, 24, 25];
  const cols = 16, rows = 10;
  const gap = easeIO(f, b(24), 30);
  const fold = easeIO(f, b(25), 40);
  const total = cols * rows;
  const pinned = (i: number) => ease(f, b(23) + (i % cols) * 1.5 + Math.floor(i / cols) * 3, 8);
  const inGap = (c: number, r: number) => c >= 6 && c <= 10 && r >= 4 && r <= 6;
  return (
    <Frame p={p} mode="wall" cam={track([{t: 0, z: 1.05, fx: 400, fy: 940}, {t: Math.max(60, p.dur), z: 1.1, fx: 680, fy: 940}])}>
      <SVG>
        <rect x={70} y={620} width={940} height={640} rx={12} fill="#3B4256" stroke={C.ink} strokeWidth={8} />
        {Array.from({length: 24 * 14}).map((_, i) => <circle key={i} cx={110 + (i % 24) * 38} cy={660 + Math.floor(i / 24) * 42} r={3.5} fill="#241F3A" />)}
        {Array.from({length: total}).map((_, i) => {
          const c = i % cols, r = Math.floor(i / cols);
          if (inGap(c, r)) return null;
          return <BlueTag key={i} x={130 + c * 55} y={682 + r * 54} s={1.15} o={pinned(i)} rot={(h01(i) - 0.5) * 8} />;
        })}
        <g opacity={gap}><rect x={130 + 6 * 55 - 32} y={682 + 4 * 54 - 30} width={5 * 55 + 4} height={3 * 54 + 6} fill="none" stroke={C.paper} strokeWidth={5} strokeDasharray="14 10" strokeDashoffset={-f} />
          {Array.from({length: 15}).map((_, i) => <circle key={i} cx={130 + (6 + (i % 5)) * 55} cy={682 + (4 + Math.floor(i / 5)) * 54} r={5} fill="none" stroke={C.paper} strokeWidth={2} opacity={0.7} />)}
          <Lab text="NOT ASSESSED" x={130 + 8 * 55} y={682 + 5 * 54} size={16} tone="dark" p={1} /></g>
        <path d="M 90,1210 Q 270,1170 450,1210 T 810,1210 T 990,1200" fill="none" stroke="#9FC4DC" strokeWidth={5} opacity={0.6} />
        <g transform="translate(160 640) rotate(-5)"><Ticket s={0.4} /></g>
        <g transform="translate(910 700)" opacity={ease(f, b(23) + 20, 18)}><circle r={60} fill={C.paper} stroke={C.ink} strokeWidth={7} /><text y={12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={C.ink}>1,300+</text></g>
        <g transform={`translate(${lerp(1160, 700, fold)} 1000)`} opacity={fold > 0.01 ? 1 : 0}><Person x={0} y={0} s={0.9} dress="jacket" f={f} seed={4.2} armUp={fold * 0.7} look={-1} /></g>
        <g transform={`translate(${lerp(960, 810, fold)} ${lerp(960, 880, fold)})`} opacity={fold}><Folder x={0} y={0} s={0.7} rot={-6} tab="INTERVENE" /></g>
        <Plate x={540} y={585} displayLines={['1,300+ ACTIVE PERMITS', '· FISHERIES ALLIANCE']} text="1,300+ ACTIVE PERMITS · FISHERIES ALLIANCE" size={32} p={vis(f, b, K, 0)} />
        <Plate x={540} y={690} text="ALLIANCE SAYS NOT ASSESSED" size={34} p={vis(f, b, K, 1)} />
        <Plate x={540} y={820} displayLines={['CENTER FOR BIOLOGICAL DIVERSITY', '· FILED TO INTERVENE']} text="CENTER FOR BIOLOGICAL DIVERSITY · FILED TO INTERVENE" size={30} p={vis(f, b, K, 2)} />
        <HeldTravel f={f} x={70} y={620} w={940} h={640} mode="sweep" seed={9} strength={0.1} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the Test, a lemon desk from above ------------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [26, 27, 28];
  const slide = easeIO(f, b(26), 40);
  const pages = easeIO(f, b(27), 70);
  const tug = clamp01((f - b(28) - 6) / 24) * (1 - clamp01((f - b(28) - 30) / 16));
  return (
    <Frame p={p} mode="lemon" z0={1.02} z1={1.06} oy={940}>
      <SVG>
        {Array.from({length: 18}).map((_, i) => <circle key={`m${i}`} cx={300 + ((i * 97 + f * (0.6 + (i % 3) * 0.3)) % 480)} cy={620 + ((i * 131) % 560) + 14 * Math.sin(f / 30 + i)} r={2 + (i % 3)} fill="#FFFBD0" opacity={0.5} />)}
        <rect x={120} y={540} width={260} height={200} rx={8} fill="#9FC4DC" stroke={C.ink} strokeWidth={8} />
        <Tide x={128} y={548} w={244} h={184} f={f} />
        <g transform={`translate(${lerp(340, 540, slide)} 950)`}><Binder x={0} y={0} s={1.3} pages={pages} title="STUDY" /></g>
        <g transform="translate(540 1110)">
          <rect x={-250} y={-120} width={500} height={230} rx={10} fill={C.white} stroke={C.ink} strokeWidth={6} />
          {Array.from({length: 7}).map((_, i) => <path key={`c${i}`} d={`M -240,${-90 + i * 28} Q -120,${-130 + i * 30} 0,${-80 + i * 26} T 240,${-100 + i * 30}`} fill="none" stroke="#5B8DB0" strokeWidth={2.5} opacity={0.7} />)}
          {Array.from({length: 40}).map((_, i) => <circle key={`g${i}`} cx={-240 + h01(i, 2) * 480} cy={-110 + h01(i, 5) * 210} r={1.4} fill={C.slate} opacity={0.35} />)}
          {Array.from({length: 24}).map((_, i) => <circle key={i} cx={-220 + (i % 8) * 62} cy={-80 + Math.floor(i / 8) * 70} r={8} fill={C.slate} opacity={clamp01(pages * 3 - i / 8)} />)}
        </g>
        <g transform={`translate(${lerp(300, 760, easeIO(f, b(27), 80))} ${lerp(1080, 1130, easeIO(f, b(27), 80))})`}><Magnifier x={0} y={0} s={1.0} rot={-20} /></g>
        <g transform={`translate(${lerp(230, 760, easeIO(f, b(27) + 50, 40))} ${lerp(1030, 1130, easeIO(f, b(27) + 50, 40))})`}><Ticket s={0.3} rot={-10} /></g>
        <g transform="translate(900 960)"><Lever x={0} y={0} s={0.8} lock={1} tug={tug} f={f} /></g>
        <g transform="translate(900 720)"><rect x={-70} y={-60} width={140} height={110} rx={6} fill="#0B1226" stroke={C.ink} strokeWidth={6} /><text y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} letterSpacing={2} fill={C.paper} opacity={0.5}>LICENSE</text></g>
        <g transform={`translate(${lerp(850, 880, tug)} ${lerp(990, 960, tug)})`}><Hand x={0} y={0} s={0.45} rot={60} /></g>
        <g transform="translate(790 930)"><Person x={0} y={0} s={0.75} dress="suit" f={f} seed={2.1} armUp={0.3 + 0.5 * tug} cues={[b(26), b(27), b(28)]} /></g>
        <Plate x={540} y={585} text="THE COMPANY'S BEST CASE" size={36} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="A STUDY IS HOW YOU GET ANSWERS" size={30} tone="dark" p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="PERMIT ALLOWS NO CONSTRUCTION" size={32} tone="dark" p={vis(f, b, K, 2)} />
        <HeldTravel f={f} x={384} y={820} w={312} h={280} mode="sweep" seed={10} strength={0.16} />
      </SVG>
    </Frame>
  );
};

// ---- S11: the dots, two labelled 1,300s that are not the same ------------------------------------------------------------------------------------------
const FIELD = Array.from({length: 1300}).map((_, i) => {
  const c = i % 50, r = Math.floor(i / 50);
  const bc = i % 19, br = Math.floor(i / 19);
  return {fx: 100 + c * 17.5 + (h01(i, 1) - 0.5) * 9, fy: 660 + r * 15.5 + (h01(i, 2) - 0.5) * 8, bx: 150 + bc * 13, by: 700 + br * 13, keep: i < 331, o: h01(i, 3)};
});
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [29, 48, 30, 31, 32];
  const drain = easeIO(f, b(30), 80);
  const ghost = ease(f, b(31), 22);
  const div = springy(f, b(32), 16);
  const patch = ease(f, b(29), 18);
  const lens = 1 - ease(f, b(48) + 10, 20);
  const turn = easeIO(f, b(48) - 4, 20);
  const field = ease(f, b(48) + 8, 24);
  const tags = ease(f, b(48) + 30, 30);
  return (
    <Frame p={p} mode="chart" z0={1.02} z1={1.06} oy={960}>
      <SVG>
        <defs><linearGradient id="col11" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2B5F78" /><stop offset="1" stopColor="#152A3E" /></linearGradient></defs>
        <rect data-band="ok" x={60} y={600} width={960} height={1300} rx={14} fill="url(#col11)" stroke={C.ink} strokeWidth={6} />
        <g data-band="ok">{Array.from({length: 6}).map((_, i) => <path key={`sc${i}`} d={`M 80,${1500 + i * 60} Q 540,${1470 + i * 60} 1000,${1500 + i * 60}`} stroke="#3F6A8C" strokeWidth={3} fill="none" opacity={0.5} />)}</g>
        <g transform="translate(540 860)" opacity={patch * lens}>
          <circle r={210} fill="#122638" stroke={C.ink} strokeWidth={10} />
          <circle r={210} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.4} />
          <g transform={`translate(${-30 + 40 * Math.sin(f / 40)} 10) scale(${lerp(1, -1, turn)} 1)`}><Beluga x={0} y={0} scale={1.0} f={f} facing={1} /></g>
        </g>
        {FIELD.map((d, i) => {
          const stay = d.keep ? 1 : Math.max(0.16, 1 - clamp01(drain * 1.6 - d.o * 0.6));
          const x = d.keep ? lerp(d.fx, d.bx, drain) : d.fx;
          const y = d.keep ? lerp(d.fy, d.by, drain) : d.fy;
          return <circle key={i} cx={x} cy={y} r={d.keep && drain > 0.6 ? 5.6 : 5} fill={C.whale} opacity={field * stay * (lens < 0.3 ? 1 : 0)} />;
        })}
        <g opacity={field * (lens < 0.3 ? 1 : 0)}><Lab text="1979 · ABOUT 1,300 WHALES" x={250} y={1082} size={18} tone="dark" p={1} /></g>
        <g opacity={ghost}><rect x={92} y={652} width={50 * 17.5 + 6} height={26 * 15.5 + 6} fill="none" stroke={C.paper} strokeWidth={4} strokeDasharray="14 10" strokeDashoffset={-f} opacity={0.7} /></g>
        <g opacity={drain > 0.8 ? 1 : 0}><rect x={142} y={692} width={19 * 13 + 8} height={18 * 13 + 8} fill="none" stroke={C.lemon} strokeWidth={4} /><Lab text="331 · NOAA BEST ESTIMATE" x={530} y={760} size={18} tone="glow" p={1} /></g>
        <g><rect x={70} y={1100} width={940 * div} height={14} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} /></g>
        <g opacity={tags}>
          {Array.from({length: 5 * 26}).map((_, i) => <BlueTag key={i} x={120 + (i % 26) * 33} y={1150 + Math.floor(i / 26) * 28} s={0.8} rot={(h01(i, 7) - 0.5) * 10} />)}
          <Lab text="1,300+ ACTIVE PERMITS · FISHERIES ALLIANCE" x={540} y={1300} size={16} tone="dark" p={1} />
        </g>
        <g transform="translate(960 640)"><Ticket s={0.22} rot={-6} /></g>
        <Plate x={540} y={585} text="COOK INLET BELUGAS" size={36} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="ENDANGERED SINCE 2008" size={38} tone="warn" p={vis(f, b, K, 1)} />
        <Plate x={540} y={840} text="331 WHALES · RANGE 290 TO 386" size={34} tone="glow" p={vis(f, b, K, 2)} />
        <Plate x={540} y={922} text="ABOUT 1,300 IN 1979" size={38} p={vis(f, b, K, 3)} />
        <Plate x={540} y={1004} text="NOT THE SAME 1,300" size={40} tone="plate" p={vis(f, b, K, 4)} />
        <HeldTravel f={f} x={70} y={1120} w={940} h={160} mode="sweep" seed={11} strength={0.1} />
      </SVG>
    </Frame>
  );
};

// ---- S12: the table from above, a lamp spill, three empty chairs pulled out ---------------------------------------------------------------------------
const TopChair: React.FC<{x: number; y: number; out: number; label: string}> = ({x, y, out, label}) => (
  <g transform={`translate(${x} ${y + 34 * out}) rotate(${(x - 540) * 0.02 * out})`}>
    <ellipse cx={8} cy={14} rx={92} ry={74} fill="#000" opacity={0.3} />
    <rect x={-80} y={-60} width={160} height={120} rx={22} fill="#59607A" stroke={C.ink} strokeWidth={7} />
    <rect x={-66} y={-46} width={132} height={70} rx={14} fill="#6B7390" stroke={C.ink} strokeWidth={4} />
    <rect x={-90} y={40} width={180} height={36} rx={14} fill="#3B4256" stroke={C.ink} strokeWidth={7} />
    <path d="M -60,-30 h 120 M -60,0 h 120" stroke="#FFFFFF" strokeWidth={3} opacity={0.2} />
    <g transform="translate(0 -96)"><rect x={-70} y={-20} width={140} height={40} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={label.length > 6 ? 20 : 24} fill={C.ink}>{label}</text></g>
  </g>
);
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [33, 40, 34, 49];
  const slide = easeIO(f, b(33) - 30, 40);
  const land = springy(f, b(40) - 4, 18);
  const out = easeIO(f, b(34), 30);
  const write = clamp01((f - b(49)) / 60);
  const words = 'STUDY TERMS';
  return (
    <Frame p={p} mode="room" cam={track([{t: 0, z: 1.04, fx: 540, fy: 940}, {t: Math.max(60, p.dur), z: 1.09, fx: 540, fy: 980}])}>
      <SVG>
        <g data-band="ok">{Array.from({length: 14}).map((_, i) => <rect key={i} x={0} y={380 + i * 110} width={1080} height={106} fill={i % 2 ? '#3C3550' : '#433B58'} />)}</g>
        <ellipse cx={540} cy={940} rx={560} ry={520} fill={C.lemon} opacity={0.12} />
        <g transform={`translate(${lerp(260, 540, slide)} 920)`}>
          <ellipse cx={14} cy={20} rx={470} ry={400} fill="#000" opacity={0.25} />
          <rect x={-440} y={-380} width={880} height={720} rx={20} fill={C.wood} stroke={C.ink} strokeWidth={10} />
          {Array.from({length: 11}).map((_, i) => <path key={i} d={`M -430,${-340 + i * 64} H 430`} stroke={C.woodD} strokeWidth={3} opacity={0.45} />)}
          <path d="M -420,-360 h 840" stroke="#FFFFFF" strokeWidth={5} opacity={0.15} />
          <g transform={`translate(0 ${lerp(-500, 60, land)}) rotate(${lerp(-12, -2, land)})`}>
            <rect x={-200} y={-140} width={400} height={280} rx={10} fill={C.white} stroke={C.ink} strokeWidth={7} />
            <rect x={-4} y={-140} width={8} height={280} fill={C.ink} opacity={0.4} />
            {Array.from({length: 6}).map((_, i) => <path key={i} d={`M 30,${-90 + i * 36} h 140`} stroke="#9AA3B8" strokeWidth={3} />)}
            <text x={-100} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={110} fill={C.ink} opacity={0.5 * (1 - write)}>?</text>
            <g opacity={write > 0.01 && write < 1 ? 1 : 0}><Pencil x={30 + 140 * write} y={-30} rot={30} s={0.8} /></g>
            <text x={100} y={-60} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} fill={C.ink}>{words.slice(0, Math.round(write * words.length))}</text>
          </g>
          <g transform="translate(-330 -290)"><Ticket s={0.3} rot={-8} /></g>
          <TopChair x={-280} y={290} out={out} label="BOROUGH" />
          <TopChair x={0} y={290} out={out} label="FLEET" />
          <TopChair x={280} y={290} out={out} label="NOAA" />
        </g>
        <g transform={`translate(${lerp(300, 880, slide)} ${lerp(1100, 640, slide)})`}>
          <ellipse cx={0} cy={0} rx={96} ry={92} fill="#122638" stroke="#9FC4DC" strokeWidth={5} />
          <path d="M -90,10 q 20,-14 40,0 t 40,0 t 40,0 t 40,0" fill="none" stroke="#9FC4DC" strokeWidth={3} opacity={0.6} />
          {Array.from({length: 331}).map((_, i) => <circle key={i} cx={(i % 19) * 7 - 63} cy={Math.floor(i / 19) * 7 - 60} r={2.8} fill={C.whale} />)}
        </g>
        <Plate x={540} y={585} text="331 WHALES" size={40} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="NOT WHETHER, WHO" size={44} tone="glow" p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="WHO'S IN THE ROOM?" size={44} p={vis(f, b, K, 2)} />
        <Plate x={540} y={500} text="WHEN THE STUDY IS DESIGNED" size={30} p={vis(f, b, K, 3)} />
        <HeldTravel f={f} x={340} y={840} w={400} h={280} mode="sweep" seed={12} strength={0.14} />
      </SVG>
    </Frame>
  );
};

// ---- S13: the button, the shore from frame one -----------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [36, 41, 35, 37];
  const hover = ease(f, b(36), 20);
  const walk = easeIO(f, b(41), 40);
  const split = easeIO(f, b(35), 36);
  const moose = easeIO(f, b(37), 60);
  const clack = ease(f, b(37) + 30, 10);
  const head = moose > 0.4 ? 'NOW SERVING' : 'FERC RULING';
  return (
    <Frame p={p} mode="shore" z0={1.05} z1={1.1} oy={1010}>
      <SVG>
        <Spruces y={1180} n={7} seed={2} f={f} x0={-40} x1={360} scale={1.1} />
        <Spruces y={1180} n={6} seed={7} f={f} x0={700} x1={1120} scale={0.9} />
        <HeldProp f={f} px={300} py={1190} w={320} h={430} seed={2.3} kind="rest">
          <TakeANumberMachine f={f} x={300} y={1312} s={1.0} flip={ease(f, b(36), 24) * (hover > 0.3 ? 1 : 0.3)} head={head} sign={moose > 0.4 ? 'NEXT' : 'NOT YET'} shake={clack > 0.1 && clack < 0.9 ? 1 : 0} />
        </HeldProp>
        <g transform={`translate(${lerp(1240, 1030, moose)} 1400)`} opacity={moose > 0.02 ? 1 : 0}><Moose x={0} y={0} scale={0.42} f={f} facing={-1} emotion="calm" /></g>
        <Posts x1={90} x2={960} y={1500} f={f} />
        <g transform={`translate(${lerp(300, 690, ease(f, b(35) - 20, 30))} ${lerp(1240, 1050, ease(f, b(35) - 20, 30))})`} opacity={ease(f, b(35) - 20, 12)}>
          <Ticket x={0} y={0} s={0.85} split={split} rot={lerp(-4, 0, split)} />
        </g>
        <g transform="translate(300 1300)" opacity={ease(f, b(41), 20)}><Ticket s={0.24} num="NEXT" rot={-8} ghost /></g>
        {[{dx: 0, d: 'parka' as Dress}, {dx: 70, d: 'cap' as Dress}, {dx: 140, d: 'jacket' as Dress}].map((q, i) => (
          <g key={i} transform={`translate(${lerp(1260, 860 + q.dx * 0.9, walk)} 1180)`} opacity={walk > 0.02 ? 1 : 0}>
            <Person x={0} y={0} s={0.6} dress={q.d} skin={i === 0 ? C.skin2 : C.skin} f={f + i * 7} seed={i * 1.7 + 1} flip={-1} cues={[b(41), b(37)]} />
          </g>
        ))}
        <Plate x={540} y={585} text="FERC HAS NOT RULED" size={40} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="BOROUGH · FLEET · NOAA" size={38} tone="glow" p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="STUDY + OUTREACH" size={44} p={vis(f, b, K, 2)} />
        <Plate x={540} y={832} displayLines={['WHO HELPS WRITE', 'THE TERMS?']} text="WHO HELPS WRITE THE TERMS?" size={42} tone="plate" p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};
const nxt = (f: number, b: (id: number) => number) => ease(f, b(41), 20);

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

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

export const ep1110Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1110Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1110: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 3.8, 12.62, 20.66, 28.24, 41.84, 47.36, 57.04, 64.36, 75.56, 82.9, 95.72, 104.52, 115.2].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#0B1226" ink="#F2E8D0" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
