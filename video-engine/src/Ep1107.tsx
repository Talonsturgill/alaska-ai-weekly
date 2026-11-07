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
import {IDS} from './Ep1107Ids';
import {HeldTravel} from './lib/heldidle';

// What's In The Box, 2026-11-07. Palette roles are art_direction.json. GRID is an ice-white glass gauge on boots (ReserveBar's silhouette, hand-drawn here), golden fluid.
// THE CHART is the throughline, a wooden height chart: blank, ladder and sixteen tick, three lock plates, two green and GRID dark, pencil hovering.
// Slate-violet is the tarp over the unknown load. Rust is the cannery. Crimson is the FAILED stamp only. Green is a test the utility's plan answered.
const W = 1080, H = 1920;
const PY = 604;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

export const C = {
  sky: '#B9C9CF', ground: '#2E4640', water: '#5E8A94', hero: '#F4F8FA', glass: '#6E828A', fluid: '#E8B800', crimson: '#C8102E', green: '#2E9E5B',
  tarp: '#7A6AB0', tarpD: '#51447F', cannery: '#8A4A2B', canneryD: '#5C2F1A', plank: '#6B5A44', paper: '#F3EEDD', ink: '#14222A', shadow: '#1C2B2B', iron: '#B7B0A0', steel: '#6B7A86', rain: '#DDE8EC',
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

const World: React.FC<{children: React.ReactNode}> = ({children}) => <g transform="translate(540 1352) scale(1.2) translate(-540 -1240)">{children}</g>;

type Tone = 'dark' | 'plate' | 'warn' | 'glow';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#14222A', fg: '#F3EEDD', edge: '#F3EEDD'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.crimson, edge: C.crimson},
  glow: {fill: C.fluid, fg: C.ink, edge: C.ink},
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



/** overcast rain world: a graded silver sky, far ridges, a water band and rain streaks so no frame is flat. */
const Atmos: React.FC<{f: number; bg: string}> = ({f, bg}) => {
  const dark = bg === C.ground || bg === C.shadow;
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="atm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dark ? '#1C2B2B' : '#DCE6EA'} />
          <stop offset="0.35" stopColor={bg} />
          <stop offset="0.8" stopColor={dark ? '#14201F' : '#9FB4BB'} />
          <stop offset="1" stopColor={dark ? '#0C1514' : '#7E979F'} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#atm)" />
      <path d="M0,640 L120,560 L260,610 L420,520 L600,600 L760,540 L920,610 L1080,560 L1080,760 L0,760 Z" fill={dark ? '#0F1B1A' : '#7E9690'} opacity={0.55} />
      <path d="M0,700 L180,640 L330,690 L520,630 L720,700 L900,650 L1080,700 L1080,820 L0,820 Z" fill={dark ? '#0B1514' : '#5F7C74'} opacity={0.6} />
      {[120, 330, 560, 790, 980].map((px, i) => <g key={i}><rect x={px} y={1500 + (i % 2) * 40} width={30} height={460} fill={C.canneryD} stroke={C.ink} strokeWidth={5} opacity={0.85} /><ellipse cx={px + 15} cy={1500 + (i % 2) * 40} rx={22} ry={8} fill={C.plank} stroke={C.ink} strokeWidth={4} /></g>)}
      {Array.from({length: 10}).map((_, i) => <path key={i} d={`M ${-40 + i * 130},${1560 + (i % 4) * 90} q 40,-12 80,0 t 80,0`} fill="none" stroke="#EAF2F4" strokeWidth={4} opacity={0.22 + 0.1 * Math.sin(f / 15 + i)} />)}
      {Array.from({length: 46}).map((_, i) => {
        const x = (i * 97 + f * 3.2) % 1180 - 50, y = ((i * 211 + f * 26) % 2100) - 100;
        return <line key={i} x1={x} y1={y} x2={x - 9} y2={y + 36} stroke={C.rain} strokeWidth={2} opacity={0.22} />;
      })}
    </svg>
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
// ---- shared drawing -----------------------------------------------------------------------------------------------------------------------
const Shadow: React.FC<{x: number; y: number; w?: number; o?: number}> = ({x, y, w = 120, o = 0.32}) => <ellipse cx={x} cy={y} rx={w} ry={w * 0.16} fill={C.shadow} opacity={o} />;

/** GRID, the town's power system: an ice-white glass gauge on boots. level 0..1 is the golden fluid, band draws the dashed CAPACITY NOT SETTLED zone. */
const Grid: React.FC<{f: number; x: number; y: number; s?: number; level?: number; mood?: 'worried' | 'steady' | 'puzzled' | 'hopeful' | 'uneasy' | 'proud'; look?: number; band?: number; pending?: number; pencil?: number; rot?: number; walk?: number}> =
({f, x, y, s = 1, level = 0.62, mood = 'worried', look = 0, band = 0, pending = 0, pencil = 0, rot = 0, walk = 0}) => {
  const sl = Math.sin(f / 7) * 5, bob = Math.sin(f / 13) * 3 + Math.abs(Math.sin(walk * 0.4)) * 6 * (walk ? 1 : 0);
  const tubeH = 300, tubeW = 120;
  const fillH = tubeH * level;
  const eyeY = -tubeH - 44;
  const brow = mood === 'worried' || mood === 'uneasy' ? -8 : mood === 'puzzled' ? 6 : 0;
  return (
    <g transform={`translate(${x} ${y - bob}) rotate(${rot}) scale(${s})`}>
      <Shadow x={0} y={bob + 4} w={110} />
      <ellipse cx={-34} cy={-4} rx={30} ry={16} fill={C.canneryD} stroke={C.ink} strokeWidth={6} />
      <ellipse cx={34} cy={-4} rx={30} ry={16} fill={C.canneryD} stroke={C.ink} strokeWidth={6} />
      <rect x={-tubeW / 2 - 10} y={-tubeH - 14} width={tubeW + 20} height={26} rx={10} fill={C.steel} stroke={C.ink} strokeWidth={6} />
      <rect x={-tubeW / 2} y={-tubeH} width={tubeW} height={tubeH} rx={22} fill={C.glass} stroke={C.ink} strokeWidth={7} />
      <rect x={-tubeW / 2 + 8} y={-fillH - 2 + sl * 0.2} width={tubeW - 16} height={fillH} rx={14} fill={C.fluid} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={0} cy={-fillH - 2 + sl * 0.2} rx={tubeW / 2 - 8} ry={7 + Math.abs(sl) * 0.4} fill="#FFE27A" stroke={C.ink} strokeWidth={3} />
      <rect x={-tubeW / 2 + 14} y={-tubeH + 14} width={12} height={tubeH - 50} rx={6} fill="#FFFFFF" opacity={0.55} />
      {band > 0.02 && <g opacity={band}>
        <rect x={-tubeW / 2 - 4} y={-tubeH - 4} width={tubeW + 8} height={92} rx={14} fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="12 9" />
        <text x={tubeW / 2 + 22} y={-tubeH + 46} fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>?</text>
      </g>}
      {pending > 0.02 && <g transform={`translate(${-tubeW / 2 - 52} ${-tubeH + 40}) rotate(${f * 6})`} opacity={pending}>
        <circle r={22} fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="14 10" />
        <circle r={4} fill={C.ink} />
      </g>}
      <rect x={-46} y={eyeY - 6} width={92} height={62} rx={24} fill={C.hero} stroke={C.ink} strokeWidth={6} />
      <ellipse cx={-18 + look * 8} cy={eyeY + 20} rx={11} ry={Math.sin(f / 6.3) > 0.96 ? 2 : 11} fill={C.ink} />
      <ellipse cx={18 + look * 8} cy={eyeY + 20} rx={11} ry={Math.sin(f / 6.3) > 0.96 ? 2 : 11} fill={C.ink} />
      <circle cx={-14 + look * 8} cy={eyeY + 16} r={3.5} fill="#fff" />
      <circle cx={22 + look * 8} cy={eyeY + 16} r={3.5} fill="#fff" />
      <line x1={-30} y1={eyeY + 2 + brow * 0.2} x2={-8} y2={eyeY + 2 + brow} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <line x1={30} y1={eyeY + 2 + brow * 0.2} x2={8} y2={eyeY + 2 + brow} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <path d={mood === 'steady' || mood === 'proud' || mood === 'hopeful' ? `M -14,${eyeY + 44} q 14,10 28,0` : `M -14,${eyeY + 48} q 14,-8 28,0`} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <path d={`M ${tubeW / 2 + 4},-200 q 40,${20 - pencil * 70} 64,${-pencil * 120}`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <path d={`M ${-tubeW / 2 - 4},-200 q -36,34 -48,66`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      {pencil > 0.02 && <g transform={`translate(${tubeW / 2 + 68} ${-pencil * 120 - 6}) rotate(-30)`}><rect x={-4} y={-46} width={8} height={52} fill={C.fluid} stroke={C.ink} strokeWidth={3} /><polygon points="-4,6 4,6 0,18" fill={C.ink} /></g>}
    </g>
  );
};

/** the unknown load: a blocky crate under a slate-violet tarp, two eyes peeking from the hem. */
const Crate: React.FC<{f: number; x: number; y: number; s?: number; flinch?: number; blink?: number; tarp2?: number; small?: boolean}> = ({f, x, y, s = 1, flinch = 0, blink = 0, tarp2 = 0, small = false}) => {
  const sc = small ? 0.62 : 1;
  const br = Math.sin(f / 15) * 3 + flinch * -8;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * sc})`}>
      <Shadow x={0} y={4} w={150} />
      <g transform={`translate(0 ${br})`}>
        <path d="M -140,0 L -150,-24 L -122,-210 L 122,-210 L 150,-24 L 140,0 Z" fill={C.tarp} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
        <path d="M -122,-210 L 122,-210 L 100,-232 L -100,-232 Z" fill={C.tarpD} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
        <path d="M -70,-206 L -86,-8 M 10,-210 L 6,-4 M 74,-206 L 92,-10" stroke={C.tarpD} strokeWidth={6} fill="none" opacity={0.85} />
        <path d="M -118,-30 q 24,22 50,0 q 24,22 50,0 q 24,22 50,0 q 24,22 50,0" fill="none" stroke={C.ink} strokeWidth={4} opacity={0.6} />
        {blink > 0.02 && <g opacity={blink}>
          <ellipse cx={-34} cy={-20} rx={17} ry={Math.max(2, 14 * (1 - 0.8 * (Math.sin(f / 5) > 0.92 ? 1 : 0)))} fill="#fff" stroke={C.ink} strokeWidth={4} />
          <ellipse cx={34} cy={-20} rx={17} ry={Math.max(2, 14 * (1 - 0.8 * (Math.sin(f / 5) > 0.92 ? 1 : 0)))} fill="#fff" stroke={C.ink} strokeWidth={4} />
          <circle cx={-30} cy={-19} r={6} fill={C.ink} /><circle cx={38} cy={-19} r={6} fill={C.ink} />
        </g>}
        {tarp2 > 0.02 && <g opacity={tarp2}><path d="M -126,-218 L 126,-218 L 150,-24 L -150,-24 Z" fill="#8F80C4" stroke={C.ink} strokeWidth={6} /><text x={0} y={-130} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>NOT IN THE RECORD</text></g>}
      </g>
    </g>
  );
};

/** the wooden height chart: unnumbered ticks, optional ladder, lit plates and a pencil. h is the visible height, marks are y offsets up from the base. */
const Chart: React.FC<{f: number; x: number; y: number; s?: number; h?: number; marks?: number[]; ladder?: number; pencilAt?: number | null; tremble?: number}> = ({f, x, y, s = 1, h = 620, marks = [], ladder = 0, pencilAt = null, tremble = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Shadow x={0} y={4} w={90} />
    <rect x={-44} y={-h} width={88} height={h} rx={8} fill={C.plank} stroke={C.ink} strokeWidth={7} />
    <rect x={-34} y={-h + 10} width={14} height={h - 20} fill="#FFFFFF" opacity={0.14} />
    {Array.from({length: 13}).map((_, i) => <line key={i} x1={-44} y1={-h * (i + 1) / 14} x2={i % 3 === 0 ? 4 : -12} y2={-h * (i + 1) / 14} stroke={C.ink} strokeWidth={4} />)}
    {marks.map((m, i) => <g key={i}><line x1={-44} y1={-m} x2={44} y2={-m} stroke={C.crimson} strokeWidth={0} /><rect x={-50} y={-m - 5} width={100} height={10} rx={3} fill={C.paper} stroke={C.ink} strokeWidth={3} /></g>)}
    {ladder > 0.02 && <g opacity={ladder} transform={`translate(78 0)`}>
      <line x1={0} y1={0} x2={0} y2={-h * ladder} stroke={C.ink} strokeWidth={8} /><line x1={46} y1={0} x2={46} y2={-h * ladder} stroke={C.ink} strokeWidth={8} />
      {Array.from({length: Math.floor((h * ladder) / 50)}).map((_, i) => <line key={i} x1={0} y1={-24 - i * 50} x2={46} y2={-24 - i * 50} stroke={C.ink} strokeWidth={6} />)}
    </g>}
    {pencilAt !== null && <g transform={`translate(${-60 + tremble * Math.sin(f * 1.3)} ${-pencilAt}) rotate(35)`}><rect x={-5} y={-48} width={10} height={60} fill={C.fluid} stroke={C.ink} strokeWidth={3} /><polygon points="-5,12 5,12 0,26" fill={C.ink} /></g>}
  </g>
);

/** a padlock on a post: body, shackle, label. state: dotted (outline only), solid, green (answered, shackle shut), dark (unresolved). */
const Padlock: React.FC<{x: number; y: number; s?: number; label?: string; state?: 'dotted' | 'solid' | 'green' | 'dark'; p?: number}> = ({x, y, s = 1, label, state = 'solid', p = 1}) => {
  if (p <= 0.01) return null;
  const col = state === 'green' ? C.iron : state === 'dark' ? C.shadow : state === 'dotted' ? 'none' : C.iron;
  const dash = state === 'dotted' ? '9 8' : undefined;
  return (
    <g transform={`translate(${x} ${y + (1 - clamp01(p)) * -40}) scale(${s * (0.8 + 0.2 * clamp01(p))})`} opacity={clamp01(p * 1.6)}>
      <path d="M -26,-52 q 0,-46 26,-46 q 26,0 26,46" fill="none" stroke={C.ink} strokeWidth={11} strokeDasharray={dash} strokeLinecap="round" />
      <rect x={-48} y={-54} width={96} height={78} rx={14} fill={col} stroke={state === 'green' ? C.green : C.ink} strokeWidth={state === 'green' ? 11 : 7} strokeDasharray={dash} />
      {state !== 'dotted' && <circle cx={0} cy={-18} r={9} fill={state === 'dark' ? C.ink : C.paper} stroke={C.ink} strokeWidth={4} />}
      {state === 'green' && <path d="M -20,4 l 14,14 l 26,-30" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />}
      {label && <text x={0} y={56} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink} stroke={C.paper} strokeWidth={5} paintOrder="stroke">{label}</text>}
    </g>
  );
};

/** an Assembly figure: parka body, round head, optional raised arms. */
const Figure: React.FC<{x: number; y: number; s?: number; coat?: string; arms?: 'down' | 'push' | 'hold' | 'up'; face?: number; seed?: number; f: number}> = ({x, y, s = 1, coat = '#4A6C86', arms = 'down', face = 1, seed = 0, f}) => {
  const idle = Math.sin(f / 18 + seed) * 3;
  return (
    <g transform={`translate(${x} ${y + idle * 0.3}) scale(${s * face} ${s})`}>
      <Shadow x={0} y={2} w={52} o={0.28} />
      <path d="M -42,0 L -34,-120 Q 0,-142 34,-120 L 42,0 Z" fill={coat} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -34,-120 Q 0,-102 34,-120" fill="none" stroke={C.ink} strokeWidth={4} opacity={0.5} />
      <circle cx={0} cy={-156} r={30} fill="#E8B896" stroke={C.ink} strokeWidth={6} />
      <path d="M -30,-162 Q 0,-196 30,-162 Q 22,-176 0,-178 Q -22,-176 -30,-162 Z" fill={seed % 2 ? '#2A2018' : '#6A4A2A'} stroke={C.ink} strokeWidth={4} />
      <circle cx={-10} cy={-154} r={4} fill={C.ink} /><circle cx={12} cy={-154} r={4} fill={C.ink} />
      <path d="M -8,-138 q 8,6 16,0" fill="none" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />
      {arms === 'down' && <><path d="M -34,-112 q -12,40 -4,80" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" /><path d="M 34,-112 q 12,40 4,80" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" /></>}
      {arms === 'push' && <><path d="M 34,-110 q 42,-8 70,-28" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" /><path d="M -34,-112 q -12,40 -4,80" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" /></>}
      {arms === 'hold' && <><path d="M 34,-110 q 40,-30 62,-70" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" /><path d="M -34,-112 q -12,40 -4,80" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" /></>}
      {arms === 'up' && <><path d="M 34,-112 q 20,-30 20,-80" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" /><path d="M -34,-112 q -20,-30 -20,-80" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" /></>}
    </g>
  );
};

const Raven: React.FC<{x: number; y: number; s?: number; f: number; tilt?: number; flap?: number}> = ({x, y, s = 1, f, tilt = 0, flap = 0}) => (
  <g transform={`translate(${x} ${y + Math.sin(f / 10) * 2}) scale(${s}) rotate(${tilt})`}>
    <Shadow x={0} y={6} w={34} o={0.25} />
    <path d="M -34,-10 Q -30,-44 8,-48 Q 34,-48 40,-30 L 62,-26 L 40,-18 Q 30,6 -6,6 Q -30,6 -34,-10 Z" fill="#1E242C" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M -30,-20 Q -60,${-30 - flap * 40} -64,${-4 - flap * 20} Q -44,-10 -30,-4 Z`} fill="#2A323C" stroke={C.ink} strokeWidth={4} />
    <circle cx={26} cy={-34} r={4} fill="#fff" /><circle cx={27} cy={-34} r={1.8} fill={C.ink} />
    <line x1={-8} y1={6} x2={-8} y2={20} stroke={C.ink} strokeWidth={4} /><line x1={8} y1={6} x2={8} y2={20} stroke={C.ink} strokeWidth={4} />
  </g>
);

/** the Ocean Beauty cannery: rust-brown shed with a pitched roof, vent, windows, sign. */
const Cannery: React.FC<{f: number; x: number; y: number; s?: number; sign?: boolean; steam?: boolean}> = ({f, x, y, s = 1, sign = true, steam = true}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Shadow x={0} y={4} w={230} />
    <rect x={-210} y={-230} width={420} height={230} fill={C.cannery} stroke={C.ink} strokeWidth={8} />
    <polygon points="-230,-230 0,-330 230,-230" fill={C.canneryD} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
    {Array.from({length: 4}).map((_, i) => <rect key={i} x={-170 + i * 90} y={-190} width={54} height={60} rx={6} fill="#9FB4BB" stroke={C.ink} strokeWidth={5} />)}
    <rect x={-40} y={-120} width={80} height={120} fill={C.canneryD} stroke={C.ink} strokeWidth={6} />
    <rect x={150} y={-300} width={34} height={90} fill={C.steel} stroke={C.ink} strokeWidth={6} />
    {steam && Array.from({length: 4}).map((_, i) => <circle key={i} cx={166 + Math.sin(f / 9 + i) * 10} cy={-320 - ((f * 1.4 + i * 30) % 120)} r={14 + i * 4} fill="#F3F7F8" opacity={0.5 - ((f * 1.4 + i * 30) % 120) / 300} />)}
    {sign && <g><rect x={-160} y={-262} width={220} height={34} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={4} /><text x={-50} y={-238} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>OCEAN BEAUTY</text></g>}
  </g>
);

const Transformer: React.FC<{x: number; y: number; s?: number; tag?: string; tagP?: number; lit?: number}> = ({x, y, s = 1, tag, tagP = 0, lit = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Shadow x={0} y={4} w={100} />
    <rect x={-80} y={-170} width={160} height={170} rx={10} fill={C.steel} stroke={C.ink} strokeWidth={7} />
    {Array.from({length: 4}).map((_, i) => <line key={i} x1={-66} y1={-140 + i * 36} x2={66} y2={-140 + i * 36} stroke={C.ink} strokeWidth={5} opacity={0.55} />)}
    {[-44, 0, 44].map((dx, i) => <g key={i}><rect x={dx - 8} y={-212} width={16} height={46} fill={C.paper} stroke={C.ink} strokeWidth={5} />{lit > 0.02 && <circle cx={dx} cy={-218} r={12 + 6 * lit} fill={C.fluid} opacity={0.6 * lit} />}</g>)}
    {tagP > 0.02 && <g opacity={clamp01(tagP * 1.6)} transform={`translate(88 -120) rotate(${8 + Math.sin(tagP * 10) * 3})`}><line x1={0} y1={0} x2={0} y2={20} stroke={C.ink} strokeWidth={3} /><rect x={-4} y={20} width={Math.max(60, monoW(tag ?? '', 16) + 14)} height={34} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} /><text x={Math.max(60, monoW(tag ?? '', 16) + 14) / 2 - 4} y={43} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.ink}>{tag}</text></g>}
  </g>
);

const Dock: React.FC<{y?: number; f: number}> = ({y = 1240, f}) => (
  <g>
    <rect data-band="ok" x={-20} y={y + 70} width={1120} height={620} fill={C.water} />
    {Array.from({length: 8}).map((_, i) => <path key={i} d={`M ${-20 + i * 150},${y + 120 + (i % 3) * 40} q 40,-14 80,0 t 80,0`} fill="none" stroke="#EAF2F4" strokeWidth={4} opacity={0.28 + 0.1 * Math.sin(f / 18 + i)} />)}
    <rect x={-20} y={y - 6} width={1120} height={90} fill={C.plank} stroke={C.ink} strokeWidth={7} />
    {Array.from({length: 12}).map((_, i) => <line key={i} x1={20 + i * 96} y1={y - 6} x2={20 + i * 96} y2={y + 84} stroke={C.ink} strokeWidth={4} opacity={0.5} />)}
    <rect x={-20} y={y + 84} width={1120} height={24} fill={C.canneryD} stroke={C.ink} strokeWidth={5} />
  </g>
);

const GenStack: React.FC<{x: number; y: number; s?: number; cold?: number; f: number; walk?: number}> = ({x, y, s = 1, cold = 0, f, walk = 0}) => (
  <g transform={`translate(${x} ${y - Math.abs(Math.sin(walk * 0.5)) * 6 * (walk ? 1 : 0)}) scale(${s})`}>
    <Shadow x={0} y={4} w={80} />
    <rect x={-52} y={-120} width={104} height={120} rx={10} fill={cold > 0.5 ? '#9FB4BB' : C.steel} stroke={C.ink} strokeWidth={7} />
    <rect x={-34} y={-190} width={68} height={72} rx={8} fill={cold > 0.5 ? '#B8CBD2' : '#7E8C97'} stroke={C.ink} strokeWidth={6} />
    <path d="M -44,-190 Q 0,-232 44,-190 Z" fill={C.fluid} stroke={C.ink} strokeWidth={6} />
    <rect x={-50} y={-194} width={100} height={12} rx={5} fill={C.fluid} stroke={C.ink} strokeWidth={5} />
    <circle cx={-14} cy={-160} r={7} fill="#fff" stroke={C.ink} strokeWidth={3} /><circle cx={14} cy={-160} r={7} fill="#fff" stroke={C.ink} strokeWidth={3} />
    <circle cx={-12} cy={-159} r={3} fill={C.ink} /><circle cx={16} cy={-159} r={3} fill={C.ink} />
    <line x1={-52} y1={-80} x2={52} y2={-80} stroke={C.ink} strokeWidth={4} opacity={0.5} />
    {cold < 0.5 && Array.from({length: 3}).map((_, i) => <circle key={i} cx={10 + i * 8} cy={-236 - ((f * 1.2 + i * 24) % 70)} r={8 + i * 3} fill="#3A4650" opacity={0.5 - ((f * 1.2 + i * 24) % 70) / 160} />)}
  </g>
);

const House: React.FC<{x: number; y: number; s?: number; lit?: number}> = ({x, y, s = 1, lit = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Shadow x={0} y={4} w={90} o={0.25} />
    <rect x={-70} y={-110} width={140} height={110} fill="#C9B79A" stroke={C.ink} strokeWidth={6} />
    <polygon points="-86,-110 0,-176 86,-110" fill={C.canneryD} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-22} y={-76} width={44} height={44} rx={4} fill={lit > 0.1 ? C.fluid : '#9FB4BB'} stroke={C.ink} strokeWidth={5} />
  </g>
);

// ---- S1: the dock --------------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const shade = ease(f, 0, 70);
  const walkIn = easeIO(f, b(2) - 8, 46);
  const tw = Math.max(bump(f, 14, 22), bump(f, b(3) - 4, 22));
  const blink = ease(f, 6, 8);
  return (
    <Frame p={p} z0={1.04} z1={1.14} oy={1000}>
      <SVG>
        <World>
        <Dock f={f} />
        <g transform="translate(310 1240)">
          <rect x={-8} y={-300} width={16} height={300} fill={C.plank} stroke={C.ink} strokeWidth={6} />
          <rect x={-170} y={-420} width={340} height={190} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={7} />
          <text x={0} y={-290} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={150} fill={C.ink}>0</text>
          <text x={0} y={-248} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={C.ink}>DATA CENTERS</text>
          <Shadow x={0} y={4} w={80} />
        </g>
        <polygon points={`${830 - 44},1240 ${830 + 44},1240 ${lerp(830, 250, shade)},1240 ${lerp(830, 300, shade)},1190`} fill={C.shadow} opacity={0.0} />
        <path d={`M 786,1236 L ${lerp(786, 120, shade)},1236 L ${lerp(786, 120, shade)},1222 L 786,1190 Z`} fill={C.shadow} opacity={0.38 * shade} />
        <Chart f={f} x={830} y={1240} h={640} />
        <Crate f={f} x={720} y={1240} s={0.95} flinch={tw} blink={blink} />
        <Grid f={f} x={480} y={1240} s={1.25} mood="worried" look={-1} rot={-3} level={0.62} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const tx = 70 + i * 62;
          return <Figure key={i} f={f} x={lerp(-90 - i * 40, tx, walkIn)} y={1318} s={0.5} seed={i} coat={['#4A6C86', '#6A5A8A', '#5A7A5A', '#8A5A4A', '#4A6C86', '#7A6A3A'][i]} />;
        })}
        </World>
        <HeldTravel f={f} x={500} y={1010} w={270} h={230} mode="sweep" seed={0.37} />
        <g>
        <Plate x={540} y={PY} text={"DATA CENTERS IN PETERSBURG TODAY \u00b7 0"} displayLines={["DATA CENTERS IN PETERSBURG", "TODAY \u00b7 0"]} size={30} tone="dark" p={ease(f, b(1), 12) * (1 - ease(f, b(2) - 6, 6))} />
        <Plate x={540} y={PY} text={"PETERSBURG ASSEMBLY \u00b7 WRITING RULES"} size={26} tone="dark" p={ease(f, b(2), 12) * (1 - ease(f, b(3) - 6, 6))} />
        <Plate x={540} y={PY} text={"WHAT WOULD IT RUN?"} size={38} tone="glow" p={ease(f, b(3), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S2: the cannery -----------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const drop = springy(f, b(4) - 6, 20);
  const tagP = ease(f, b(4) + 6, 12);
  const named = ease(f, b(5), 12);
  const land = springy(f, b(6) - 8, 18);
  const roll = easeIO(f, b(7) - 4, 50);
  const set = springy(f, b(8) - 6, 20);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={980}>
      <SVG>
        <World>
        <Dock f={f} />
        <Cannery f={f} x={300} y={1240} s={0.95} steam={false} />
        <Raven f={f} x={lerp(40, 280, land)} y={lerp(560, 902, land)} s={0.8} flap={1 - land} />
                <g transform={`translate(${lerp(0, 230, roll)} 0)`}>
          <g transform="translate(700 1240)"><rect x={-80} y={-90} width={160} height={90} fill={C.plank} stroke={C.ink} strokeWidth={6} /><Shadow x={0} y={4} w={70} /></g>
        </g>
        <g transform={`translate(${lerp(960, 985, roll)} ${1246 - roll * 4}) rotate(${Math.sin(f / 14) * 2})`}>
          <path d="M -110,-30 L 110,-30 L 80,40 L -80,40 Z" fill="#E4EAEC" stroke={C.ink} strokeWidth={6} /><rect x={-14} y={-110} width={90} height={80} fill={C.cannery} stroke={C.ink} strokeWidth={6} />
        </g>
        <g transform={`translate(0 ${lerp(-90, 0, set)})`}><Crate f={f} x={760} y={1240} s={0.8} small /></g>
        <g transform={`translate(0 ${lerp(-420, 0, drop)})`}><Transformer x={500} y={1240} tag={named > 0.5 ? 'MAZZELLA ALASKA' : '2 MW'} tagP={tagP} /></g>
        </World>
        <HeldTravel f={f} x={90} y={910} w={420} h={330} mode="sweep" seed={0.74} />
        <g>
        <Plate x={540} y={PY} text={"2 MW TRANSFORMER PRIVATELY OWNED"} displayLines={["2 MW TRANSFORMER", "PRIVATELY OWNED"]} size={30} tone="dark" p={ease(f, b(4), 12) * (1 - ease(f, b(5) - 6, 6))} />
        <Plate x={540} y={PY} text={"MAZZELLA ALASKA PRIVATE COMPANY"} displayLines={["MAZZELLA ALASKA", "PRIVATE COMPANY"]} size={30} tone="dark" p={ease(f, b(5), 12) * (1 - ease(f, b(6) - 6, 6))} />
        <Plate x={540} y={PY} text={"OLD OCEAN BEAUTY CANNERY"} size={28} tone="dark" p={ease(f, b(6), 12) * (1 - ease(f, b(7) - 6, 6))} />
        <Plate x={540} y={PY} text={"GREENSPARC DEAL NOT FINALIZED"} displayLines={["GREENSPARC DEAL", "NOT FINALIZED"]} size={30} tone="dark" p={ease(f, b(7), 12) * (1 - ease(f, b(8) - 6, 6))} />
        <Plate x={540} y={PY} text={"STILL PURSUING A SMALL PROJECT"} displayLines={["STILL PURSUING", "A SMALL PROJECT"]} size={30} tone="dark" p={ease(f, b(8), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S3: the meter ---------------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const roll = easeIO(f, b(9), Math.max(30, b(43) - b(9)));
  const val = Math.round(1064400 * roll);
  const txt = val.toLocaleString('en-US');
  const bp = ease(f, b(37), 24);
  const lamp = ease(f, b(46), 10);
  const chip = ease(f, b(43), 12);
  return (
    <Frame p={p} z0={1.05} z1={1.12} oy={980} bg={C.shadow}>
      <SVG>
        <World>
        <rect data-band="ok" x={0} y={1180} width={W} height={260} fill="#0F1B1A" stroke={C.ink} strokeWidth={6} />
        {bp > 0.02 && <g opacity={0.5 * bp} transform="translate(540 1180) scale(1.6)"><rect x={-210} y={-230} width={420} height={230} fill="none" stroke={C.paper} strokeWidth={4} strokeDasharray="10 8" /><polygon points="-230,-230 0,-330 230,-230" fill="none" stroke={C.paper} strokeWidth={4} strokeDasharray="10 8" /></g>}
        <g transform="translate(540 960)">
          <Shadow x={0} y={290} w={230} />
          <circle r={250} fill="#B98B2E" stroke={C.ink} strokeWidth={9} /><circle r={214} fill="#F3E3B0" stroke={C.ink} strokeWidth={6} />
          {Array.from({length: 24}).map((_, i) => <line key={i} x1={Math.cos(i * 0.2618) * 184} y1={Math.sin(i * 0.2618) * 184} x2={Math.cos(i * 0.2618) * 206} y2={Math.sin(i * 0.2618) * 206} stroke={C.ink} strokeWidth={5} />)}
          <rect x={-170} y={-52} width={340} height={96} rx={10} fill={C.ink} stroke={C.ink} strokeWidth={5} />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={58} fill="#F3EEDD">{txt}</text>
          <text x={0} y={-90} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>kWh</text>
          <line x1={0} y1={120} x2={Math.cos(-2.2 + roll * 3.6) * 120} y2={120 + Math.sin(-2.2 + roll * 3.6) * 120 - 120 * 0} stroke={C.crimson} strokeWidth={0} />
        </g>
        <circle cx={880} cy={800} r={22 + 6 * lamp} fill={C.fluid} stroke={C.ink} strokeWidth={5} opacity={0.4 + 0.6 * lamp} />
        {chip > 0.02 && <Lab text="PER THE UTILITY'S FAQ" x={540} y={1330} size={24} p={chip} />}
        </World>
        <HeldTravel f={f} x={290} y={710} w={500} h={500} mode="sweep" seed={1.11} />
        <g>
        <Plate x={540} y={PY} text={"CANNERY \u00b7 2015"} size={34} tone="dark" p={ease(f, b(9), 12) * (1 - ease(f, b(37) - 6, 6))} />
        <Plate x={540} y={PY} text={"THE WHOLE CANNERY"} size={34} tone="dark" p={ease(f, b(37), 12) * (1 - ease(f, b(43) - 6, 6))} />
        <Plate x={540} y={PY} text={"1,064,400 kWh"} size={38} tone="glow" p={ease(f, b(43), 12) * (1 - ease(f, b(46) - 6, 6))} />
        <Plate x={540} y={PY} text={"1,064,400 kWh \u00b7 IN 2015"} size={30} tone="dark" p={ease(f, b(46), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S4: the climb -------------------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lad = easeIO(f, b(10) - 6, 40);
  const climb = easeIO(f, b(10), Math.max(40, b(12) - b(10)));
  const tick1 = ease(f, b(10) + 18, 10);
  const tick2 = ease(f, b(39), 12);
  const drain = easeIO(f, b(11) - 4, 40);
  const stack = easeIO(f, b(12) - 6, 46);
  const gy = lerp(1230, 960, climb);
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={1060} cam={track([{t: 0, z: 1.04, fx: 540, fy: 1180}, {t: p.dur, z: 1.1, fx: 560, fy: 880}])}>
      <SVG>
        <World>
        <path d="M 0,560 L 160,480 L 300,540 L 1080,430 L 1080,1500 L 0,1500 Z" fill="#7E9690" stroke={C.ink} strokeWidth={6} opacity={0.5} />
        <Dock f={f} y={1280} />
        {Array.from({length: 16}).map((_, i) => {
          const pr = clamp01(stack * 16 - i);
          return <g key={i} transform={`translate(${210} ${1262 - i * 50 - (1 - pr) * 140})`} opacity={pr}><rect x={-90} y={-46} width={180} height={46} fill={C.cannery} stroke={C.ink} strokeWidth={5} /><polygon points="-96,-46 0,-76 96,-46" fill={C.canneryD} stroke={C.ink} strokeWidth={4} /></g>;
        })}
        <Chart f={f} x={720} y={1280} h={700} ladder={lad} marks={[tick1 > 0.5 ? 120 : -999, tick2 > 0.5 ? 330 : -999].filter((m) => m > 0)} pencilAt={null} />
        <Crate f={f} x={470} y={1280} s={0.55} small />
        <path d={`M 470,1260 Q 560,1330 620,${gy + 20}`} fill="none" stroke={C.ink} strokeWidth={9} strokeDasharray={drain > 0.02 ? '0' : '2 14'} opacity={drain > 0.02 ? 1 : 0.4} />
        <Grid f={f} x={620} y={gy} s={1.0} level={lerp(0.74, 0.34, drain)} mood={drain > 0.5 ? 'uneasy' : 'hopeful'} band={1} pencil={climb} />
        </World>
        <HeldTravel f={f} x={676} y={580} w={88} h={700} mode="sweep" seed={1.48} />
        <g>
        <Plate x={540} y={PY} text={"CANNERY \u00b7 1,064,400 kWh"} size={28} tone="dark" p={ease(f, b(10), 12) * (1 - ease(f, b(39) - 6, 6))} />
        <Plate x={540} y={PY} text={"1 MW \u00b7 8.5 MILLION kWh PER THE UTILITY'S FAQ"} displayLines={["1 MW \u00b7 8.5 MILLION kWh", "PER THE UTILITY'S FAQ"]} size={28} tone="dark" p={ease(f, b(39), 12) * (1 - ease(f, b(47) - 6, 6))} />
        <Plate x={540} y={PY} text={"FULL 2 MW BUILD PER THE UTILITY'S FAQ"} displayLines={["FULL 2 MW BUILD", "PER THE UTILITY'S FAQ"]} size={28} tone="dark" p={ease(f, b(47), 12) * (1 - ease(f, b(11) - 6, 6))} />
        <Plate x={540} y={PY} text={"FULL 2 MW BUILD \u00b7 17,000,000 kWh PER THE UTILITY'S FAQ"} displayLines={["FULL 2 MW BUILD \u00b7 17,000,000 kWh", "PER THE UTILITY'S FAQ"]} size={24} tone="dark" p={ease(f, b(11), 12) * (1 - ease(f, b(12) - 6, 6))} />
        <Plate x={540} y={PY} text={"ABOUT 16X THE CANNERY FULL 2 MW BUILD"} displayLines={["ABOUT 16X THE CANNERY", "FULL 2 MW BUILD"]} size={34} tone="glow" p={ease(f, b(12), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S5: three to three --------------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const jam = bump(f, b(13) + 4, 30);
  const plate1 = ease(f, b(40), 12);
  const stamp = springy(f, b(14) - 4, 14);
  const card = easeIO(f, b(15) - 6, 18);
  const strain = Math.sin(f * 0.8) * 3 * (f > b(13) ? 1 : 0) * (1 - ease(f, b(14), 8));
  return (
    <Frame p={p} z0={1.03} z1={1.08} oy={980} bg={C.ground}>
      <SVG>
        <World>
        <rect data-band="ok" x={0} y={1280} width={W} height={300} fill="#1F312D" stroke={C.ink} strokeWidth={6} />
        <rect x={80} y={620} width={200} height={300} fill="#9FB4BB" stroke={C.ink} strokeWidth={7} opacity={0.5} />
        <rect x={800} y={620} width={200} height={300} fill="#9FB4BB" stroke={C.ink} strokeWidth={7} opacity={0.5} />
        <Chart f={f} x={540} y={1280} h={560} />
        <g transform={`translate(540 ${760 + jam * 6}) rotate(${jam * 4})`}>
          <path d="M -50,40 L -50,-20 Q -50,-70 0,-70 Q 50,-70 50,-20 L 50,40" fill="none" stroke={C.ink} strokeWidth={10} strokeDasharray="12 9" strokeLinecap="round" />
        </g>
        {[0, 1, 2].map((i) => <Figure key={i} f={f} x={210 + i * 96 + strain} y={1330} s={0.82} seed={i} coat={['#4A6C86', '#6A5A8A', '#5A7A5A'][i]} arms="push" />)}
        {[0, 1, 2].map((i) => <Figure key={i} f={f} x={870 - i * 96 - strain} y={1330} s={0.82} seed={i + 3} coat={['#8A5A4A', '#4A6C86', '#7A6A3A'][i]} arms="hold" face={-1} />)}
        {plate1 > 0.02 && <g transform={`translate(540 ${880 - jam * 0}) rotate(${Math.sin(f / 9) * 2})`} opacity={plate1}><line x1={0} y1={-40} x2={0} y2={0} stroke={C.ink} strokeWidth={4} /><rect x={-150} y={0} width={300} height={56} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text x={0} y={38} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>1 YEAR PAUSE</text></g>}
        {stamp > 0.02 && <g transform={`translate(540 1130) rotate(-10) scale(${lerp(2.2, 1, Math.min(1, stamp))})`} opacity={clamp01(stamp * 2)}><rect x={-140} y={-44} width={280} height={88} rx={6} fill="none" stroke={C.crimson} strokeWidth={10} /><text x={0} y={20} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={60} fill={C.crimson}>FAILED</text></g>}
        <g transform={`translate(${lerp(1400, 540, card)} 1470)`}>
          <rect x={-24} y={-90} width={48} height={90} fill={C.plank} stroke={C.ink} strokeWidth={5} />
        </g>
        </World>
        <HeldTravel f={f} x={496} y={720} w={88} h={560} mode="sweep" seed={1.85} />
        <g>
        <Plate x={540} y={PY} text={"SEPT 21 3 TO 3"} displayLines={["SEPT 21", "3 TO 3"]} size={38} tone="glow" p={ease(f, b(13), 12) * (1 - ease(f, b(40) - 6, 6))} />
        <Plate x={540} y={PY} text={"1 YEAR PAUSE"} size={36} tone="dark" p={ease(f, b(40), 12) * (1 - ease(f, b(14) - 6, 6))} />
        <Plate x={540} y={PY} text={"1 YEAR PAUSE FAILED"} displayLines={["1 YEAR PAUSE", "FAILED"]} size={36} tone="warn" p={ease(f, b(14), 12) * (1 - ease(f, b(15) - 6, 6))} />
        <Plate x={540} y={PY} text={"\"A SOLUTION IN SEARCH OF A PROBLEM\" JEIGH STANTON GREGOR \u00b7 VICE MAYOR"} displayLines={["\"A SOLUTION IN SEARCH OF A PROBLEM\"", "JEIGH STANTON GREGOR \u00b7 VICE MAYOR"]} size={22} tone="dark" p={ease(f, b(15), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S6: the noticeboard ----------------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const sheet = springy(f, b(16) - 8, 20);
  const nod = bump(f, b(52), 40);
  const cal = springy(f, b(17) - 6, 20);
  const q = ease(f, b(48), 12);
  const tag = springy(f, b(18) - 4, 22);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={980} bg="#C8B692">
      <SVG>
        <World>
        <rect data-band="ok" x={110} y={640} width={860} height={720} rx={14} fill="#C2A06A" stroke={C.ink} strokeWidth={9} />
        {Array.from({length: 60}).map((_, i) => <circle key={i} cx={140 + (i * 137) % 800} cy={670 + (i * 71) % 660} r={3} fill="#9E7C46" opacity={0.7} />)}
        <g transform={`translate(380 ${lerp(500, 960, sheet)}) rotate(${-3 + (1 - sheet) * 14})`}>
          <rect x={-190} y={-250} width={380} height={500} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <circle cx={0} cy={-232} r={11} fill={C.crimson} stroke={C.ink} strokeWidth={4} />
          <text x={0} y={-160} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={58} fill={C.ink} transform="rotate(-6)">DRAFT</text>
          {[0, 1, 2].map((i) => <Padlock key={i} x={-110 + i * 110} y={20} s={0.62} state="dotted" />)}
          {[0, 1, 2, 3].map((i) => <line key={i} x1={-150} y1={120 + i * 26} x2={150 - (i === 3 ? 90 : 0)} y2={120 + i * 26} stroke={C.ink} strokeWidth={4} opacity={0.55} />)}
        </g>
        <g transform={`translate(${lerp(1300, 760, cal)} 900) rotate(${3 + (1 - cal) * 10})`}>
          <rect x={-170} y={-150} width={340} height={300} rx={6} fill="#fff" stroke={C.ink} strokeWidth={6} />
          <rect x={-170} y={-150} width={340} height={56} rx={6} fill={C.crimson} stroke={C.ink} strokeWidth={6} />
          <text x={0} y={-110} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.paper}>NOV 2</text>
          {[0, 1, 2].map((i) => <g key={i}><rect x={-150 + i * 104} y={-60} width={92} height={150} rx={6} fill={i === 0 ? '#E8F1D8' : '#fff'} stroke={C.ink} strokeWidth={5} strokeDasharray={i === 0 ? '0' : '8 7'} /></g>)}
          <text x={-104} y={36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={78} fill={C.ink} opacity={q}>?</text>
        </g>
        <g transform={`translate(760 ${lerp(1030, 1120, tag)}) rotate(${Math.sin(f / 10) * 5})`} opacity={tag}>
          <line x1={0} y1={-70} x2={0} y2={-10} stroke={C.ink} strokeWidth={4} />
          <rect x={-140} y={-10} width={280} height={50} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text x={0} y={24} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={19} fill={C.ink}>NO OUTCOME REPORTED</text>
        </g>
        {[0, 1, 2, 3, 4, 5].map((i) => <Figure key={i} f={f} x={140 + i * 160} y={1372} s={0.62} seed={i} coat={['#4A6C86', '#6A5A8A', '#5A7A5A', '#8A5A4A', '#4A6C86', '#7A6A3A'][i]} />)}
        <g transform={`translate(0 ${-nod * 8})`} />
        </World>
        <HeldTravel f={f} x={110} y={640} w={860} h={720} mode="shadow" seed={2.22} />
        <g>
        <Plate x={540} y={PY} text={"OCT 5 \u00b7 UNANIMOUS DRAFT A 9-MONTH PAUSE"} displayLines={["OCT 5 \u00b7 UNANIMOUS", "DRAFT A 9-MONTH PAUSE"]} size={30} tone="dark" p={ease(f, b(16), 12) * (1 - ease(f, b(52) - 6, 6))} />
        <Plate x={540} y={PY} text={"ALL SIX AGREE DRAFT ONLY"} displayLines={["ALL SIX AGREE", "DRAFT ONLY"]} size={34} tone="dark" p={ease(f, b(52), 12) * (1 - ease(f, b(17) - 6, 6))} />
        <Plate x={540} y={PY} text={"NOV 2 FIRST OF THREE READINGS"} displayLines={["NOV 2", "FIRST OF THREE READINGS"]} size={30} tone="dark" p={ease(f, b(17), 12) * (1 - ease(f, b(48) - 6, 6))} />
        <Plate x={540} y={PY} text={"READING 1 OF 3"} size={36} tone="glow" p={ease(f, b(48), 12) * (1 - ease(f, b(18) - 6, 6))} />
        <Plate x={540} y={PY} text={"NO OUTCOME REPORTED"} size={30} tone="dark" p={ease(f, b(18), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S7: three tests --------------------------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const sheet = ease(f, b(44), 14);
  const fill = ease(f, b(44) + 24, 20);
  const l1 = springy(f, b(19) - 4, 16), l2 = springy(f, b(20) - 4, 16), l3 = springy(f, b(21) - 4, 16);
  const gen = springy(f, b(20) - 10, 22);
  const hose = ease(f, b(21) - 8, 14);
  return (
    <Frame p={p} z0={1.04} z1={1.12} oy={1000}>
      <SVG>
        <World>
        <Dock f={f} y={1300} />
        <rect x={500} y={650} width={80} height={650} fill={C.plank} stroke={C.ink} strokeWidth={8} />
        <g transform={`translate(${lerp(1300, 760, sheet)} 800)`}>
          <rect x={-130} y={-120} width={260} height={240} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          {[0, 1, 2].map((i) => <Padlock key={i} x={-74 + i * 74} y={20} s={0.42} state={fill > 0.6 ? 'solid' : 'dotted'} />)}
          <text x={0} y={-72} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>THE DRAFT</text>
        </g>
        <Padlock x={540} y={760} s={1.2} label="GRID CAPACITY" state="solid" p={l1} />
        <Padlock x={540} y={980} s={1.2} label="GENERATORS" state="solid" p={l2} />
        <Padlock x={540} y={1210} s={1.2} label="UNCONTAINED COOLING" state="solid" p={l3} />
        <g transform={`translate(${lerp(-120, 250, gen)} 0)`}><GenStack x={0} y={1290} f={f} walk={gen < 1 ? f : 0} /></g>
        {hose > 0.02 && <g transform="translate(860 1290)"><Shadow x={0} y={4} w={60} /><path d="M 0,0 q -10,-80 30,-120 q 30,-30 70,-20" fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" opacity={hose} />{[0, 1, 2].map((i) => <circle key={i} cx={100 + Math.sin(f / 6 + i) * 8} cy={-150 - ((f * 1.5 + i * 25) % 90)} r={14 + i * 3} fill="#F3F7F8" opacity={0.55 * hose} />)}</g>}
        </World>
        <HeldTravel f={f} x={500} y={650} w={80} h={650} mode="sweep" seed={2.59} />
        <g>
        <Plate x={540} y={PY} text={"THE DRAFT'S THREE TESTS"} displayLines={["THE DRAFT'S", "THREE TESTS"]} size={36} tone="dark" p={ease(f, b(44), 12) * (1 - ease(f, b(19) - 6, 6))} />
        <Plate x={540} y={PY} text={"GRID CAPACITY"} size={40} tone="glow" p={ease(f, b(19), 12) * (1 - ease(f, b(20) - 6, 6))} />
        <Plate x={540} y={PY} text={"GENERATORS"} size={40} tone="glow" p={ease(f, b(20), 12) * (1 - ease(f, b(21) - 6, 6))} />
        <Plate x={540} y={PY} text={"UNCONTAINED COOLING"} size={36} tone="glow" p={ease(f, b(21), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S8: the utility's case ---------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const brk = springy(f, b(22) - 4, 14);
  const lit = ease(f, b(22) + 6, 20);
  const tags = ease(f, b(23), 16);
  const bars = ease(f, b(24), 22);
  const cash = easeIO(f, b(25), 60);
  const shrink = ease(f, b(26), 26);
  const homes = [520, 720, 920];
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={1000} cam={track([{t: 0, z: 1.03, fx: 430, fy: 1010}, {t: p.dur, z: 1.08, fx: 650, fy: 1010}])}>
      <SVG>
        <World>
        <rect data-band="ok" x={-20} y={1260} width={1120} height={420} fill="#34524A" stroke={C.ink} strokeWidth={7} />
        <rect x={-20} y={1260} width={1120} height={22} fill="#6B5A44" />
        <Transformer x={190} y={1260} s={0.95} lit={lit} />
        <path d={`M 190,1050 L ${lerp(190, 1000, lit)},${lerp(1050, 1020, lit)}`} stroke={C.ink} strokeWidth={0} />
        <line x1={270} y1={1075} x2={900} y2={1050} stroke={C.ink} strokeWidth={6} />
        <line x1={270} y1={1075} x2={900} y2={1050} stroke={C.fluid} strokeWidth={4} opacity={lit} strokeDasharray="14 10" strokeDashoffset={-f * 3} />
        {[330, 560, 800].map((x, i) => <g key={i}><rect x={x - 8} y={1040 + i * -8} width={16} height={220 + i * 8} fill={C.plank} stroke={C.ink} strokeWidth={5} /><line x1={x - 40} y1={1048 + i * -8} x2={x + 40} y2={1048 + i * -8} stroke={C.ink} strokeWidth={6} /></g>)}
        {homes.map((x, i) => <House key={i} x={x} y={1260} s={0.62} lit={lit} />)}
        {homes.map((x, i) => <g key={i} transform={`translate(${x} ${1100 - i * 8})`}><polygon points={`-18,0 18,0 0,${lerp(54, 20, shrink)}`} fill={C.crimson} stroke={C.ink} strokeWidth={4} opacity={0.9} /></g>)}
        <g transform={`translate(${lerp(300, 880, cash)} ${1050 - cash * 8})`} opacity={cash > 0.01 && cash < 0.99 ? 1 : cash >= 0.99 ? 0.2 : 0}>
          {[0, 1, 2].map((i) => <rect key={i} x={-i * 36 - 22} y={-30} width={30} height={26} rx={3} fill={C.green} stroke={C.ink} strokeWidth={4} />)}
        </g>
        {tags > 0.02 && [0, 1].map((i) => <g key={i} transform={`translate(${i ? 700 : 520} ${1060 + (1 - tags) * -40}) rotate(${Math.sin(f / 12 + i) * 4})`} opacity={tags}><line x1={0} y1={0} x2={0} y2={26} stroke={C.ink} strokeWidth={3} /><rect x={-70} y={26} width={140} height={42} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} /><text x={0} y={55} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>{i ? 'AK ~30¢' : '12.2¢'}</text></g>)}
        {bars > 0.02 && <g transform="translate(130 1260)"><rect x={0} y={-90 * bars} width={70} height={90 * bars} fill={C.fluid} stroke={C.ink} strokeWidth={5} /><rect x={90} y={-250 * bars} width={70} height={250 * bars} fill={C.steel} stroke={C.ink} strokeWidth={5} /></g>}
        <Chart f={f} x={1010} y={1262} h={420} marks={[90, 220]} ladder={1} />
        <Figure f={f} x={330} y={1336} s={0.9} coat="#D98A2B" arms={f > b(22) - 4 && f < b(22) + 20 ? 'push' : f > b(26) ? 'push' : 'down'} seed={7} />
        <g transform={`translate(260 1160) rotate(${lerp(-60, 0, brk)})`}><rect x={-6} y={-60} width={12} height={60} fill={C.crimson} stroke={C.ink} strokeWidth={4} /></g>
        </World>
        <HeldTravel f={f} x={110} y={1050} w={160} h={210} mode="sweep" seed={2.96} />
        <g>
        <Plate x={540} y={PY} text={"THE UTILITY'S FAQ FROM APRIL"} displayLines={["THE UTILITY'S FAQ", "FROM APRIL"]} size={32} tone="dark" p={ease(f, b(22), 12) * (1 - ease(f, b(23) - 6, 6))} />
        <Plate x={540} y={PY} text={"RESIDENTIAL \u00b7 12.2 CENTS PER THE UTILITY'S FAQ"} displayLines={["RESIDENTIAL \u00b7 12.2 CENTS", "PER THE UTILITY'S FAQ"]} size={30} tone="dark" p={ease(f, b(23), 12) * (1 - ease(f, b(24) - 6, 6))} />
        <Plate x={540} y={PY} text={"ALASKA AVERAGE \u00b7 NEAR 30 CENTS UTILITY FIGURE"} displayLines={["ALASKA AVERAGE \u00b7 NEAR 30 CENTS", "UTILITY FIGURE"]} size={28} tone="dark" p={ease(f, b(24), 12) * (1 - ease(f, b(25) - 6, 6))} />
        <Plate x={540} y={PY} text={"OVER $2M A YEAR \u00b7 UTILITY ESTIMATE ORIGINAL PLAN"} displayLines={["OVER $2M A YEAR \u00b7 UTILITY ESTIMATE", "ORIGINAL PLAN"]} size={26} tone="dark" p={ease(f, b(25), 12) * (1 - ease(f, b(26) - 6, 6))} />
        <Plate x={540} y={PY} text={"SMALLER RATE INCREASES UTILITY CLAIM"} displayLines={["SMALLER RATE INCREASES", "UTILITY CLAIM"]} size={32} tone="dark" p={ease(f, b(26), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S9: two answered ----------------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const walk = easeIO(f, b(45), 40);
  const turned = ease(f, b(27), 20);
  const rad = ease(f, b(28), 16);
  const g2 = ease(f, b(29), 14);
  const band = ease(f, b(30), 14);
  const gx = lerp(-100, 330, walk) - turned * 150;
  const cold = turned > 0.5 ? 1 : 0;
  return (
    <Frame p={p} z0={1.05} z1={1.12} oy={1000}>
      <SVG>
        <World>
        <Dock f={f} y={1300} />
        <rect x={80} y={760} width={300} height={540} fill={C.cannery} stroke={C.ink} strokeWidth={8} />
        <rect x={160} y={1020} width={140} height={280} fill={C.canneryD} stroke={C.ink} strokeWidth={7} />
        <GenStack x={gx} y={1296} f={f} walk={walk < 1 ? f : 0} cold={cold} />
        <g transform="translate(430 1296)">
          <Crate f={f} x={0} y={0} s={0.55} small />
          {rad > 0.02 && <g opacity={rad} transform="translate(60 -60)"><rect x={-34} y={-44} width={68} height={88} rx={6} fill={C.steel} stroke={C.ink} strokeWidth={6} />{Array.from({length: 5}).map((_, i) => <line key={i} x1={-28} y1={-34 + i * 18} x2={28} y2={-34 + i * 18} stroke={C.ink} strokeWidth={4} />)}{[0, 1, 2].map((i) => <circle key={i} cx={Math.sin(f / 5 + i) * 6} cy={-70 - ((f * 1.4 + i * 22) % 80)} r={10 + i * 3} fill="#F3F7F8" opacity={0.6 - ((f * 1.4 + i * 22) % 80) / 160} />)}</g>}
        </g>
        <rect x={790} y={700} width={80} height={600} fill={C.plank} stroke={C.ink} strokeWidth={8} />
        <Padlock x={830} y={840} s={0.8} label="GRID CAPACITY" state="dark" />
        <Padlock x={830} y={1000} s={0.8} label="GENERATORS" state={turned > 0.9 && g2 > 0.5 ? 'green' : 'solid'} />
        <Padlock x={830} y={1160} s={0.8} label="COOLING" state={rad > 0.5 && g2 > 0.5 ? 'green' : 'solid'} />
        <Grid f={f} x={620} y={1296} s={1.0} level={0.5} band={1} pending={band} mood={band > 0.5 ? 'worried' : 'steady'} pencil={band * 0.3} />
        </World>
        <HeldTravel f={f} x={80} y={760} w={300} h={540} mode="shadow" seed={3.33} />
        <g>
        <Plate x={540} y={PY} text={"THE ORIGINAL PLAN PER THE UTILITY'S FAQ"} displayLines={["THE ORIGINAL PLAN", "PER THE UTILITY'S FAQ"]} size={32} tone="dark" p={ease(f, b(45), 12) * (1 - ease(f, b(27) - 6, 6))} />
        <Plate x={540} y={PY} text={"NO DIESEL GENERATORS ON SITE PER FAQ \u00b7 TOWN GRID HAS BACKUP"} displayLines={["NO DIESEL GENERATORS ON SITE", "PER FAQ \u00b7 TOWN GRID HAS BACKUP"]} size={26} tone="dark" p={ease(f, b(27), 12) * (1 - ease(f, b(28) - 6, 6))} />
        <Plate x={540} y={PY} text={"CLOSED LOOP COOLING PER FAQ"} displayLines={["CLOSED LOOP COOLING", "PER FAQ"]} size={32} tone="dark" p={ease(f, b(28), 12) * (1 - ease(f, b(29) - 6, 6))} />
        <Plate x={540} y={PY} text={"2 OF 3 \u00b7 GREENSPARC PLAN NOT FINALIZED"} displayLines={["2 OF 3 \u00b7 GREENSPARC PLAN", "NOT FINALIZED"]} size={28} tone="dark" p={ease(f, b(29), 12) * (1 - ease(f, b(54) - 6, 6))} />
        <Plate x={540} y={PY} text={"GRID CAPACITY"} size={40} tone="glow" p={ease(f, b(54), 12) * (1 - ease(f, b(30) - 6, 6))} />
        <Plate x={540} y={PY} text={"GRID CAPACITY \u00b7 NOT SETTLED"} size={28} tone="glow" p={ease(f, b(30), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S10: under the tarp ---------------------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const yank = springy(f, b(31) - 6, 16);
  const chip = springy(f, b(32) - 4, 18);
  const slide = ease(f, b(32) + 20, 20);
  const peck = bump(f, b(42), 24);
  const blow = ease(f, b(42) + 12, 26);
  return (
    <Frame p={p} z0={1.05} z1={1.13} oy={1020}>
      <SVG>
        <World>
        <Dock f={f} y={1300} />
        <Crate f={f} x={640} y={1300} s={1.35} tarp2={yank} />
        <g transform={`translate(${lerp(780, 1100, 0)} ${lerp(1300, 1300, 0)})`} />
        <g transform={`translate(${lerp(380, 280, yank)} 1300)`}><Grid f={f} x={0} y={0} s={1.15} mood={yank > 0.5 ? 'puzzled' : 'worried'} look={1} rot={yank > 0.5 ? 4 : 0} level={0.5} band={0.6} /></g>
        <g transform={`translate(${lerp(980, 900, chip)} ${lerp(760, 940, chip)}) rotate(${lerp(8, -4, chip)})`} opacity={chip}>
          <rect x={-120} y={-170} width={240} height={340} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={6} /><text x={0} y={-124} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>GREENSPARC</text>
          <rect x={-100} y={-70} width={200} height={50} rx={8} fill={C.fluid} stroke={C.ink} strokeWidth={4} opacity={1 - blow} transform={`translate(${blow * 400} ${-blow * 120}) rotate(${blow * 40})`} />
          <text x={0} y={-36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.ink} opacity={1 - blow} transform={`translate(${blow * 400} ${-blow * 120}) rotate(${blow * 40})`}>AI COMPUTE</text>
        </g>
        <g transform={`translate(${lerp(960, 780, slide)} 0)`} />
        <Raven f={f} x={lerp(1010, 905, ease(f, b(42) - 14, 16))} y={750 + peck * 20} s={0.9} tilt={peck * 20} />
        </World>
        <HeldTravel f={f} x={470} y={1010} w={340} h={290} mode="sweep" seed={3.70} />
        <g>
        <Plate x={540} y={PY} text={"WHAT IT RUNS NOT IN THE RECORD"} displayLines={["WHAT IT RUNS", "NOT IN THE RECORD"]} size={34} tone="glow" p={ease(f, b(31), 12) * (1 - ease(f, b(32) - 6, 6))} />
        <Plate x={540} y={PY} text={"VENDOR PITCH HIGH-DENSITY AI COMPUTE"} displayLines={["VENDOR PITCH", "HIGH-DENSITY AI COMPUTE"]} size={32} tone="dark" p={ease(f, b(32), 12) * (1 - ease(f, b(42) - 6, 6))} />
        <Plate x={540} y={PY} text={"NOTHING IN THE RECORD"} size={34} tone="dark" p={ease(f, b(42), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S11: how big -------------------------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const wipe = easeIO(f, b(53) - 4, 26);
  const turn = easeIO(f, b(33), 30);
  const br = ease(f, b(51), 16);
  const up = easeIO(f, b(34), 70);
  const ladder = 1;
  const pen = ease(f, b(35), 20);
  const lean = ease(f, b(36) - 6, 16);
  const tremble = lean * 2.5;
  return (
    <Frame p={p} z0={1.04} z1={1.04} oy={1000} cam={track([{t: 0, z: 1.05, fx: 540, fy: 1050}, {t: b(34), z: 1.05, fx: 540, fy: 1050}, {t: p.dur, z: 1.02, fx: 540, fy: 800}])}>
      <SVG>
        <World>
        <g>
          {Array.from({length: 22}).map((_, i) => <rect key={i} x={20 + i * 50} y={1180 - (i * 37) % 70} width={34} height={60 + (i * 37) % 70} fill="#31484A" stroke={C.ink} strokeWidth={3} opacity={0.9} />)}
          {Array.from({length: 22}).map((_, i) => <rect key={i} x={30 + i * 50} y={1190 - (i * 37) % 70 + 8} width={10} height={10} fill={C.fluid} opacity={up * (0.4 + 0.5 * Math.abs(Math.sin(f / 20 + i)))} />)}
          <circle cx={780} cy={1160} r={14} fill={C.shadow} stroke={C.ink} strokeWidth={4} opacity={up} />
        </g>
        <Dock f={f} />
        <g transform="translate(310 1240)"><rect x={-8} y={-300} width={16} height={300} fill={C.plank} stroke={C.ink} strokeWidth={6} /><rect x={-170} y={-420} width={340} height={190} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={7} /><text x={0} y={-290} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={150} fill={C.ink}>0</text></g>
        <Chart f={f} x={830} y={1240} h={640} marks={[120, 330]} ladder={ladder} pencilAt={lerp(300, 560, pen)} tremble={tremble} />
        {br > 0.02 && <g transform="translate(700 800)" opacity={br}><path d="M -50,40 L -50,-20 Q -50,-70 0,-70 Q 50,-70 50,-20 L 50,40" fill="none" stroke={C.ink} strokeWidth={10} strokeDasharray="12 9" strokeLinecap="round" /><text x={0} y={90} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>?</text></g>}
        <Crate f={f} x={560} y={1240} s={0.7} small blink={1} />
        <Grid f={f} x={430} y={1240} s={1.1} mood={up > 0.5 ? 'steady' : 'puzzled'} level={0.6} band={1} look={lean ? 1 : 0} pencil={pen * 0.4} />
        {[0, 1, 2, 3, 4, 5].map((i) => <Figure key={i} f={f} x={80 + i * 70 + lerp(0, 24 * (i - 2.5) * -0.2, turn)} y={1330} s={0.5} seed={i} face={turn > 0.5 ? 1 : -1} coat={['#4A6C86', '#6A5A8A', '#5A7A5A', '#8A5A4A', '#4A6C86', '#7A6A3A'][i]} />)}
        <g transform={`translate(${lerp(-400, 1500, wipe)} 0)`} opacity={wipe > 0.01 && wipe < 0.99 ? 1 : 0}><path d="M 0,420 L 420,420 Q 460,900 380,1500 L 0,1500 Z" fill={C.tarp} stroke={C.ink} strokeWidth={8} /></g>
        </World>
        <HeldTravel f={f} x={786} y={600} w={88} h={640} mode="sweep" seed={4.07} />
        <g>
        <Plate x={540} y={PY} text={"THE DRAFT \u00b7 3 TESTS"} size={34} tone="dark" p={ease(f, b(53), 12) * (1 - ease(f, b(33) - 6, 6))} />
        <Plate x={540} y={PY} text={"GRID \u00b7 GENERATORS \u00b7 COOLING"} size={28} tone="dark" p={ease(f, b(33), 12) * (1 - ease(f, b(51) - 6, 6))} />
        <Plate x={540} y={PY} text={"NONE ASKS WHAT IT RUNS"} size={30} tone="dark" p={ease(f, b(51), 12) * (1 - ease(f, b(34) - 6, 6))} />
        <Plate x={540} y={PY} text={"HOW BIG A CUSTOMER?"} size={38} tone="glow" p={ease(f, b(34), 12) * (1 - ease(f, b(35) - 6, 6))} />
        <Plate x={540} y={PY} text={"WHAT IT COMPUTES?"} size={34} tone="dark" p={ease(f, b(35), 12) * (1 - ease(f, b(36) - 6, 6))} />
        <Plate x={540} y={PY} text={"OR WHAT IT DRAWS?"} size={34} tone="glow" p={ease(f, b(36), 12)} />
        </g>
      </SVG>
    </Frame>
  );
};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

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

export const ep1107Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1107Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1107: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 8.14, 22.16, 30.98, 44.68, 56.16, 66.7, 73.42, 89.68, 100.6, 107.6, 126.1].map((x) => Math.round(x * 30));
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
                <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#14222A" ink="#F3EEDD" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
