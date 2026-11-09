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
import {IDS} from './Ep1109Ids';

// Who Holds the Transcript, 2026-11-09. Palette roles are art_direction.json. REELS is the walnut CourtSmart recorder with two reels for eyes.
// THE PAGE is the throughline: SCRIBBLED (S1), BINNED (S4), STAMPED (S6), BEHIND GLASS (S10), BLANK (S13).
// Cobalt ink is the ink drop, the TF-304 pen line and the AI GENERATED tag only. Seal red is the SEALED, NOT THE OFFICIAL RECORD and NO plates.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

export const C = {
  wall: '#6B1E24', wallD: '#3E0F15', panel: '#8A3A2A', floor: '#3B2315', copper: '#B87333', copperD: '#6E3F1C', brass: '#D9A441', paper: '#F4ECD8', ink: '#14101C',
  cobalt: '#1F4BFF', glass: '#A9BCD0', skin: '#E3B48C', shadow: '#1A0B0D', audio: '#E07A3C', seal: '#C41E3A', glow: '#FFD27A', white: '#FFF8EA', mint: '#C9B6E4',
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

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'dark' | 'plate' | 'warn' | 'glow';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#1A0B0D', fg: '#F4ECD8', edge: '#F4ECD8'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.seal, edge: C.seal},
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
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; warmth?: number; glassSide?: boolean; children: React.ReactNode}> =
({p, cam, z0 = 1.06, z1 = 1.15, bloom = 0.05, vignette = 0.3, ox = 540, oy = 930, warmth = 0.03, glassSide = false, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 50 * Math.sin(p.f / 110) + 30 * t, fy: oy};
  return (
    <AbsoluteFill>
      <Atmos f={p.f} glassSide={glassSide} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 4 * Math.sin(p.f / 23)}px, ${jl.y + 5 * Math.sin(p.f / 17 + 1) + 4 * t}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill={C.ink} stroke="#F4ECD8" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F4ECD8">{CHIP}</text>
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

// ---- the world: an oxblood courtroom after hours, walnut paneling, a brass lamp key from the lower left and a cool green window rim ---------------------------
const Atmos: React.FC<{f: number; glassSide: boolean}> = ({f, glassSide}) => {
  const sw = (f % 360) / 360;
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A1219" /><stop offset="0.45" stopColor={C.wall} /><stop offset="0.8" stopColor="#4F161C" /><stop offset="1" stopColor={C.wallD} />
        </linearGradient>
        <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFD27A" stopOpacity={0.55} /><stop offset="1" stopColor="#FFD27A" stopOpacity={0} /></radialGradient>
        <linearGradient id="rim" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A9BCD0" stopOpacity={glassSide ? 0.5 : 0.3} /><stop offset="1" stopColor="#A9BCD0" stopOpacity={0} /></linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#wallg)" />
      {Array.from({length: 8}).map((_, i) => (
        <g key={i}>
          <rect x={i * 150 - 20} y={300} width={140} height={880} rx={6} fill={C.panel} opacity={0.45} stroke={C.wallD} strokeWidth={5} />
          <rect x={i * 150 + 4} y={330} width={92} height={820} rx={4} fill="none" stroke="#FFD27A" strokeWidth={2} opacity={0.18} />
        </g>
      ))}
      <rect x={0} y={280} width={W} height={26} fill={C.copperD} stroke={C.wallD} strokeWidth={4} />
      <rect x={0} y={1160} width={W} height={22} fill={C.copperD} stroke={C.wallD} strokeWidth={4} />
      <polygon points="1080,0 640,0 1080,760" fill="url(#rim)" />
      <ellipse cx={170} cy={1230} rx={520} ry={340} fill="url(#lamp)" />
      <rect x={lerp(-400, 1500, sw)} y={0} width={220} height={H} fill="#FFD27A" opacity={0.07} transform="skewX(-14)" />
      {Array.from({length: 16}).map((_, i) => <circle key={`m${i}`} cx={(i * 197 + f * (0.5 + (i % 4) * 0.22)) % 1080} cy={320 + ((i * 137) % 1100) + 20 * Math.sin(f / 40 + i)} r={2.5 + (i % 3)} fill="#FFE9B0" opacity={0.28} />)}
      <rect data-band="ok" x={0} y={1182} width={W} height={738} fill={C.floor} />
      <rect x={0} y={1182} width={W} height={12} fill="#1F110A" />
      <g data-band="ok">
        {Array.from({length: 9}).map((_, i) => <path key={i} d={`M ${i * 140 - 40},1920 L ${i * 90 + 300},1194`} stroke="#1F110A" strokeWidth={3} opacity={0.5} />)}
        <path d="M 0,1430 L 1080,1400" stroke="#1F110A" strokeWidth={4} opacity={0.5} />
        <ellipse cx={540} cy={1560} rx={460} ry={20} fill="#000" opacity={0.18} />
        <rect x={0} y={1180} width={W} height={4} fill={C.brass} opacity={0.5} />
      </g>
    </svg>
  );
};

const Idle: React.FC<{f: number; x: number; y: number; seed?: number; amp?: number; children: React.ReactNode}> = ({f, x, y, seed = 0, amp = 2.2, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${1.4 * amp * Math.sin(f / 26 + seed)}) scale(${1 + 0.016 * amp * Math.sin(f / 15 + seed)} ${1 - 0.02 * amp * Math.sin(f / 15 + seed)}) translate(${-x} ${-y})`}>{children}</g>
);
const vis = (f: number, b: (id: number) => number, ks: number[], i: number) => ease(f, b(ks[i]), 14) * (i < ks.length - 1 ? 1 - ease(f, b(ks[i + 1]) - 10, 8) : 1);

// ---- the cast -------------------------------------------------------------------------------------------------------------------------------------
/** REELS: a walnut and copper recorder. Two reels are its eyes, a brass grille is its mouth, the lamp on top blinks as it prints. */
const Reels: React.FC<{f: number; x: number; y: number; s?: number; awake?: number; mood?: 'proud' | 'smug' | 'worried' | 'calm'; print?: number; lamp?: boolean; look?: number}> =
({f, x, y, s = 1, awake = 1, mood = 'calm', print = 0, lamp = true, look = 0}) => {
  const open = clamp01(awake);
  const blink = (f % 130) > 124 ? 0.2 : 1;
  const spin = f * (awake > 0.05 ? 5.5 : 0.4);
  const bob = 3 * Math.sin(f / 19);
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s * (1 + 0.012 * Math.sin(f / 13))} ${s * (1 - 0.015 * Math.sin(f / 13))})`}>
      <ellipse cx={0} cy={150} rx={190} ry={18} fill="#000" opacity={0.4} />
      {[-110, 110].map((fx) => <rect key={fx} x={fx - 24} y={122} width={48} height={26} rx={9} fill={C.copperD} stroke={C.ink} strokeWidth={6} />)}
      <rect x={-170} y={-130} width={340} height={266} rx={34} fill={C.copper} stroke={C.ink} strokeWidth={9} />
      <rect x={-170} y={-130} width={340} height={78} rx={34} fill={C.copperD} stroke={C.ink} strokeWidth={9} />
      <path d="M -150,-48 q 150,22 300,0" fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.25} />
      {[-150, 150].map((sx) => [-110, 112].map((sy) => <circle key={`${sx}${sy}`} cx={sx} cy={sy} r={6} fill={C.brass} stroke={C.ink} strokeWidth={3} />))}
      <g transform="translate(0 -158)">
        <rect x={-18} y={0} width={36} height={32} rx={8} fill={C.copperD} stroke={C.ink} strokeWidth={5} />
        <circle cy={-10} r={15} fill={lamp && f % 36 < 22 ? '#FF6A3C' : '#7A2A18'} stroke={C.ink} strokeWidth={5} />
        {lamp && f % 36 < 22 && <circle cy={-10} r={30} fill="#FF6A3C" opacity={0.28} />}
      </g>
      {[-72, 72].map((ex, i) => (
        <g key={ex} transform={`translate(${ex} -34)`}>
          <circle r={58} fill={C.paper} stroke={C.ink} strokeWidth={7} />
          <g transform={`rotate(${spin * (i ? -1 : 1)})`}>
            {[0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * 50} y2={Math.sin((a * Math.PI) / 180) * 50} stroke={C.ink} strokeWidth={5} opacity={0.55} />)}
            <circle r={13} fill={C.brass} stroke={C.ink} strokeWidth={4} />
          </g>
          <circle cx={look * 10} cy={4} r={14} fill={C.ink} />
          <circle cx={look * 10 + 5} cy={-2} r={4.5} fill="#FFFFFF" />
          <path d={`M -62,${-62 + 124 * (1 - open) * blink} q 62,${-30 - (mood === 'worried' ? -22 : 0)} 124,0 L 62,-70 L -62,-70 Z`} fill={C.copperD} stroke={C.ink} strokeWidth={6} />
          {mood === 'worried' && <path d={`M ${-30 * (i ? -1 : 1)},-76 L ${30 * (i ? -1 : 1)},-92`} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />}
          {mood === 'smug' && <path d="M -44,-64 L 44,-76" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />}
        </g>
      ))}
      <g transform="translate(0 78)">
        <rect x={-92} y={-20} width={184} height={46} rx={14} fill={C.brass} stroke={C.ink} strokeWidth={7} />
        {[-66, -44, -22, 0, 22, 44, 66].map((gx) => <line key={gx} x1={gx} y1={-12} x2={gx} y2={18} stroke={C.ink} strokeWidth={4} opacity={0.6} />)}
        <rect x={-78} y={24} width={156} height={14 + 12 * clamp01(print)} rx={6} fill="#1A0B0D" stroke={C.ink} strokeWidth={4} />
        {mood === 'proud' && <path d="M -48,-34 q 48,-18 96,0" fill="none" stroke={C.ink} strokeWidth={5} opacity={0.5} />}
      </g>
    </g>
  );
};

/** TAGALONG: a small mint AI notetaker bot, a clip mic on its head and a notebook in its hand. scruff lifts it by the collar, stache is a fake mustache. */
const Tagalong: React.FC<{f: number; x: number; y: number; s?: number; scruff?: number; stache?: boolean; rot?: number; flip?: number}> = ({f, x, y, s = 1, scruff = 0, stache = false, rot = 0, flip = 1}) => {
  const paddle = scruff > 0.05 ? 16 * Math.sin(f / 2.2) : 6 * Math.sin(f / 7);
  return (
    <g transform={`translate(${x} ${y - 70 * scruff}) rotate(${rot + 6 * scruff * Math.sin(f / 5)}) scale(${s * flip} ${s})`}>
      <ellipse cx={0} cy={118 + 70 * scruff} rx={70 - 28 * scruff} ry={10} fill="#000" opacity={0.38} />
      {[-24, 24].map((lx, i) => <rect key={lx} x={lx - 10} y={74} width={20} height={44 + (i ? paddle : -paddle) * 0.6} rx={9} fill={C.glass} stroke={C.ink} strokeWidth={5} />)}
      <rect x={-52} y={-14} width={104} height={96} rx={26} fill={C.mint} stroke={C.ink} strokeWidth={7} />
      <rect x={-64} y={-84} width={128} height={86} rx={30} fill={C.mint} stroke={C.ink} strokeWidth={7} />
      <path d="M -50,-70 q 40,-14 80,0" fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.4} />
      {[-26, 26].map((ex) => <g key={ex}><circle cx={ex} cy={-42} r={15} fill={C.paper} stroke={C.ink} strokeWidth={4} /><circle cx={ex + 3} cy={-40} r={6} fill={C.ink} /></g>)}
      <path d="M -20,-12 q 20,12 40,0" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      {stache && <path d="M -34,-24 q 16,-14 34,0 q 18,-14 34,0 q -10,18 -34,8 q -24,10 -34,-8 Z" fill="#3A2218" stroke={C.ink} strokeWidth={4} />}
      <g transform="translate(40 -92)"><rect x={-5} y={-30} width={10} height={36} rx={4} fill={C.brass} stroke={C.ink} strokeWidth={4} /><circle cy={-34} r={9} fill={C.seal} stroke={C.ink} strokeWidth={3} /></g>
      <g transform={`translate(-62 24) rotate(${-16 + 5 * Math.sin(f / 9)})`}>
        <rect x={-30} y={-30} width={46} height={62} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={5} />
        {[-16, -4, 8, 20].map((ly) => <path key={ly} d={`M -22,${ly} h 30`} stroke={C.cobalt} strokeWidth={3} opacity={0.65} />)}
        <circle cx={-34} cy={20} r={11} fill={C.mint} stroke={C.ink} strokeWidth={4} />
      </g>
    </g>
  );
};

const Hand: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => {
  const fr = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + 3 * Math.sin(fr / 12)}) scale(${s})`}>
      <rect x={-34} y={60} width={68} height={200} rx={14} fill="#2B3F6B" stroke={C.ink} strokeWidth={6} />
      <rect x={-30} y={0} width={60} height={90} rx={26} fill={C.skin} stroke={C.ink} strokeWidth={6} />
      <rect x={-44} y={-40} width={88} height={64} rx={26} fill={C.skin} stroke={C.ink} strokeWidth={6} />
      {[-28, -9, 10, 28].map((fx, i) => <path key={i} d={`M ${fx},-38 v -22`} stroke={C.ink} strokeWidth={3} />)}
    </g>
  );
};

/** a person: round head, coloured shirt, optional crossed arms. */
const HAIR = ['#3A2218', '#14101C', '#8A5A2B', '#B8B8C0', '#5A2D14'];
const Person: React.FC<{x: number; y: number; s?: number; shirt?: string; skin?: string; robe?: boolean; f?: number; seed?: number; mood?: 'calm' | 'stern'; label?: string}> =
({x, y, s = 1, shirt = '#2B3F6B', skin = C.skin, robe = false, f = 0, seed = 0, mood = 'calm', label}) => {
  const hair = HAIR[Math.abs(Math.round(seed * 3)) % HAIR.length];
  const breathe = 1 + 0.014 * Math.sin(f / 16 + seed);
  const nod = 2.2 * Math.sin(f / 31 + seed * 2);
  const blink = ((f + Math.round(seed * 40)) % 130) > 124 ? 0.15 : 1;
  const col = robe ? '#16121F' : shirt;
  return (
    <g transform={`translate(${x} ${y + 3 * Math.sin(f / 21 + seed)}) scale(${s})`}>
      <ellipse cx={0} cy={142} rx={66} ry={11} fill="#000" opacity={0.42} />
      <rect x={-34} y={126} width={30} height={16} rx={7} fill="#2A1A2E" stroke={C.ink} strokeWidth={4} />
      <rect x={4} y={126} width={30} height={16} rx={7} fill="#2A1A2E" stroke={C.ink} strokeWidth={4} />
      <g transform={`scale(1 ${breathe})`}>
        <rect x={-48} y={-10} width={96} height={146} rx={30} fill={col} stroke={C.ink} strokeWidth={7} />
        <path d="M -30,-6 q 30,26 60,0" fill={robe ? C.paper : '#F4EBC6'} stroke={C.ink} strokeWidth={4} />
        <path d="M -42,6 q 6,60 4,112" stroke="#FFFFFF" strokeWidth={5} opacity={0.22} fill="none" />
        <path d="M 42,6 q -4,60 -2,112" stroke="#000" strokeWidth={7} opacity={0.22} fill="none" />
      </g>
      {[-1, 1].map((d) => (
        <g key={d}>
          <rect x={d > 0 ? 36 : -62} y={0} width={26} height={96} rx={13} fill={col} stroke={C.ink} strokeWidth={6} />
          <circle cx={d * 49} cy={104} r={13} fill={skin} stroke={C.ink} strokeWidth={5} />
        </g>
      ))}
      <rect x={-12} y={-24} width={24} height={22} rx={8} fill={skin} stroke={C.ink} strokeWidth={5} />
      <g transform={`rotate(${nod} 0 -10)`}>
        <circle cy={-52} r={40} fill={skin} stroke={C.ink} strokeWidth={7} />
        <path d="M -40,-58 q 40,-52 80,0 q -40,-16 -80,0 Z" fill={hair} stroke={C.ink} strokeWidth={4} />
        <path d="M -24,-84 q 12,-8 26,-6" stroke="#FFFFFF" strokeWidth={4} opacity={0.35} fill="none" />
        {[-14, 14].map((ex, i) => <ellipse key={i} cx={ex} cy={-50} rx={4.5} ry={4.5 * blink} fill={C.ink} />)}
        <path d={mood === 'stern' ? 'M -12,-28 h 24' : 'M -14,-30 q 14,10 28,0'} stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      {label && <text y={170} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.paper}>{label}</text>}
    </g>
  );
};

/** THE PAGE: the throughline transcript page. crumple 0..1, stamp text, tag (cobalt AI GENERATED), thread reaches toward (tx,ty). */
const Page: React.FC<{x: number; y: number; s?: number; rot?: number; crumple?: number; stamp?: string; stampK?: number; tag?: number; scrawl?: boolean; blank?: boolean}> =
({x, y, s = 1, rot = 0, crumple = 0, stamp = '', stampK = 0, tag = 0, scrawl = false, blank = false}) => {
  const cr = clamp01(crumple);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + 40 * cr}) scale(${s * (1 - 0.45 * cr)} ${s * (1 - 0.3 * cr)})`}>
      <ellipse cx={0} cy={118} rx={80} ry={9} fill="#000" opacity={0.35} />
      <path d={cr > 0.1 ? 'M -60,-80 L -20,-92 L 30,-76 L 62,-84 L 70,-20 L 56,40 L 66,92 L 10,104 L -40,92 L -64,100 L -70,30 L -58,-30 Z' : 'M -62,-86 H 62 V 96 H -62 Z'} fill={C.paper} stroke={C.ink} strokeWidth={6} />
      {!blank && Array.from({length: 7}).map((_, i) => <path key={i} d={`M -44,${-58 + i * 20} h ${i % 3 === 2 ? 52 : 88}`} stroke={scrawl ? C.cobalt : C.ink} strokeWidth={scrawl ? 4 : 5} opacity={scrawl ? 0.7 : 0.4} strokeLinecap="round" strokeDasharray={scrawl ? '14 6 22 5' : undefined} />)}
      {tag > 0.02 && (
        <g transform={`translate(30 ${-96 - 8 * tag}) rotate(6)`} opacity={clamp01(tag * 2)}>
          <rect x={-60} y={-16} width={120} height={32} rx={5} fill={C.cobalt} stroke={C.ink} strokeWidth={4} />
          <text y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={15} fill="#FFFFFF">AI GENERATED</text>
        </g>
      )}
      {stampK > 0.02 && (
        <g transform={`translate(0 24) rotate(-12) scale(${0.7 + 0.3 * clamp01(stampK)})`} opacity={clamp01(stampK * 2)}>
          <rect x={-90} y={-30} width={180} height={60} rx={5} fill="none" stroke={C.seal} strokeWidth={5} />
          <text y={-4} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={15} fill={C.seal}>{stamp.split('|')[0]}</text>
          <text y={18} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={15} fill={C.seal}>{stamp.split('|')[1] ?? ''}</text>
        </g>
      )}
    </g>
  );
};

/** a side door with a brass knob. brick 0..1 fills it row by row, open swings it, label sits above. */
const Door: React.FC<{x: number; y: number; s?: number; open?: number; brick?: number; label?: string; f: number}> = ({x, y, s = 1, open = 0, brick = 0, label, f}) => {
  const rows = 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-110} y={-210} width={220} height={420} rx={10} fill="#1F0C0F" stroke={C.ink} strokeWidth={7} />
      <g transform={`translate(-100 0) scale(${1 - 0.55 * open} 1)`} style={{transformOrigin: '0 0'}}>
        <rect x={0} y={-198} width={200} height={396} rx={6} fill={C.panel} stroke={C.ink} strokeWidth={7} />
        <rect x={22} y={-170} width={156} height={150} rx={5} fill="none" stroke={C.wallD} strokeWidth={6} />
        <rect x={22} y={0} width={156} height={170} rx={5} fill="none" stroke={C.wallD} strokeWidth={6} />
        <circle cx={168} cy={20} r={12} fill={C.brass} stroke={C.ink} strokeWidth={4} />
      </g>
      {brick > 0.01 && Array.from({length: rows}).map((_, r) => {
        const on = clamp01(brick * rows - (rows - 1 - r));
        return on > 0.01 ? (
          <g key={r} opacity={on}>
            {[0, 1, 2].map((cI) => <rect key={cI} x={-104 + cI * 70 + (r % 2 ? -34 : 0) + (r % 2 && cI === 0 ? 34 : 0)} y={-200 + r * 50 - (1 - on) * 40} width={r % 2 && cI === 0 ? 36 : 68} height={46} fill="#A44A2E" stroke={C.ink} strokeWidth={4} />)}
          </g>
        ) : null;
      })}
      {label && <Lab text={label} x={0} y={-250} size={20} tone="dark" p={1} />}
      <ellipse cx={0} cy={214} rx={130} ry={12} fill="#000" opacity={0.3 + 0.05 * Math.sin(f / 12)} />
    </g>
  );
};

const Binder: React.FC<{x: number; y: number; s?: number; rot?: number; sweat?: number; f: number; title?: string}> = ({x, y, s = 1, rot = 0, sweat = 0, f, title = 'AI POLICY'}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={166} rx={170} ry={14} fill="#000" opacity={0.4} />
    <rect x={-140} y={-170} width={280} height={336} rx={14} fill="#2F4A3F" stroke={C.ink} strokeWidth={8} />
    <rect x={-140} y={-170} width={40} height={336} rx={14} fill="#1F3329" stroke={C.ink} strokeWidth={8} />
    <rect x={-80} y={-120} width={190} height={110} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
    <text x={15} y={-76} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={25} fill={C.ink}>{title}</text>
    <text x={15} y={-44} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.ink}>ALASKA COURTS</text>
    <text x={15} y={-24} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.ink}>VERSION 1.2</text>
    {[0, 1, 2].map((i) => <path key={i} d={`M -78,${24 + i * 26} h ${150 - i * 18 + 6 * Math.sin(f / 9 + i)}`} stroke={C.paper} strokeWidth={5} opacity={0.5} strokeLinecap="round" />)}
    {sweat > 0.01 && [0, 1].map((i) => <path key={i} d="M 0,-8 q 9,14 0,22 q -9,-8 0,-22 Z" fill="#9FD7F5" stroke={C.ink} strokeWidth={2.5} transform={`translate(${130 + i * 22} ${-150 + ((f * 3 + i * 40) % 90) * sweat})`} opacity={0.85} />)}
  </g>
);

const Key: React.FC<{x: number; y: number; s?: number; tag?: string; flip?: number; f: number}> = ({x, y, s = 1, tag = '', flip = 0, f}) => {
  const fl = clamp01(flip);
  const face = fl > 0.5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${5 * Math.sin(f / 22)}) scale(${s})`}>
      <path d="M 0,-70 V 0" stroke={C.ink} strokeWidth={5} />
      <circle cx={0} cy={-76} r={10} fill={C.brass} stroke={C.ink} strokeWidth={4} />
      <g transform={`translate(0 30) scale(${Math.max(0.05, Math.abs(Math.cos(fl * Math.PI)))} 1)`}>
        <rect x={-110} y={-26} width={220} height={78} rx={8} fill={face ? C.paper : '#C9B98E'} stroke={C.ink} strokeWidth={6} />
        {face && <text y={22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={tag.length > 14 ? 17 : 20} fill={C.ink}>{tag}</text>}
      </g>
      <g transform="translate(0 120)">
        <circle r={32} fill={C.brass} stroke={C.ink} strokeWidth={6} />
        <circle r={12} fill={C.ink} />
        <rect x={-10} y={28} width={20} height={90} fill={C.brass} stroke={C.ink} strokeWidth={5} />
        <rect x={10} y={80} width={26} height={12} fill={C.brass} stroke={C.ink} strokeWidth={4} /><rect x={10} y={102} width={20} height={12} fill={C.brass} stroke={C.ink} strokeWidth={4} />
      </g>
    </g>
  );
};

const Cassette: React.FC<{x: number; y: number; s?: number; rot?: number; f: number}> = ({x, y, s = 1, rot = 0, f}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={58} rx={110} ry={9} fill="#000" opacity={0.35} />
    <rect x={-100} y={-56} width={200} height={112} rx={10} fill={C.audio} stroke={C.ink} strokeWidth={6} />
    <rect x={-72} y={-40} width={144} height={48} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    {[-40, 40].map((cx, i) => <g key={cx} transform={`translate(${cx} -16) rotate(${f * (i ? -4 : 4)})`}><circle r={15} fill={C.ink} /><path d="M -15,0 h 30 M 0,-15 v 30" stroke={C.paper} strokeWidth={3} /></g>)}
    <path d="M -64,38 L -48,16 H 48 L 64,38 Z" fill="#8F6414" stroke={C.ink} strokeWidth={4} />
  </g>
);

const Form: React.FC<{x: number; y: number; s?: number; rot?: number; ink?: number}> = ({x, y, s = 1, rot = 0, ink = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={110} rx={96} ry={8} fill="#000" opacity={0.3} />
    <rect x={-80} y={-100} width={160} height={208} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={5} />
    <rect x={-66} y={-86} width={132} height={26} fill={C.ink} />
    <text y={-67} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={C.paper}>FORM TF-304</text>
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M -62,${-36 + i * 30} h 124`} stroke={C.ink} strokeWidth={3} opacity={0.4} />)}
    <path d={`M -58,40 q 30,-26 52,0 q 24,26 ${54 * clamp01(ink)},-4`} fill="none" stroke={C.cobalt} strokeWidth={5} strokeLinecap="round" />
  </g>
);

/** the glass at the counter: a pane with a brass frame and a rim glint. */
const GlassPane: React.FC<{x: number; y: number; w: number; h: number; f: number; frost?: number}> = ({x, y, w, h, f, frost = 0}) => (
  <g>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill={C.glass} opacity={0.2 + 0.5 * frost} stroke={C.brass} strokeWidth={9} />
    <path d={`M ${x - w / 2 + 30},${y - h / 2 + 30} L ${x - w / 2 + 110},${y - h / 2 + 30} L ${x - w / 2 + 30},${y - h / 2 + 130} Z`} fill="#FFFFFF" opacity={0.2 + 0.06 * Math.sin(f / 14)} />
    <path d={`M ${x + w / 2 - 60},${y - h / 2 + 30} L ${x + w / 2 - 30},${y - h / 2 + 30} L ${x + w / 2 - 110},${y - h / 2 + 130} L ${x + w / 2 - 140},${y - h / 2 + 130} Z`} fill="#FFFFFF" opacity={0.12} />
  </g>
);

const Tumbler: React.FC<{x: number; y: number; s?: number; ink?: number; f: number}> = ({x, y, s = 1, ink = 0, f}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={134} rx={110} ry={11} fill="#000" opacity={0.38} />
    <path d="M -90,-110 H 90 L 70,128 H -70 Z" fill="#CFE9E6" opacity={0.55} stroke={C.ink} strokeWidth={7} />
    <path d="M -84,-40 H 84 L 72,124 H -72 Z" fill="#8CC6D8" opacity={0.7} />
    <path d="M -66,-60 q 66,14 132,0" fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.5} />
    {ink > 0.01 && (
      <g opacity={0.95}>
        <circle cx={0} cy={lerp(-70, 20, clamp01(ink * 1.4))} r={10 + 70 * clamp01((ink - 0.25) * 1.4)} fill={C.cobalt} opacity={0.5 + 0.4 * (1 - clamp01((ink - 0.25) * 1.2))} />
        {ink > 0.3 && [0, 1, 2, 3, 4].map((i) => <path key={i} d={`M 0,20 q ${(i - 2) * 24},${30 + i * 12} ${(i - 2) * 38 + 8 * Math.sin(f / 18 + i)},${68 + i * 6}`} fill="none" stroke={C.cobalt} strokeWidth={9 - i} opacity={0.5 * clamp01((ink - 0.3) * 1.8)} strokeLinecap="round" />)}
      </g>
    )}
    <path d="M -90,-110 H 90" stroke="#FFFFFF" strokeWidth={5} opacity={0.6} />
  </g>
);

const InkBottle: React.FC<{x: number; y: number; s?: number; tilt?: number}> = ({x, y, s = 1, tilt = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
    <ellipse cx={0} cy={60} rx={60} ry={8} fill="#000" opacity={0.35} />
    <rect x={-44} y={-30} width={88} height={88} rx={16} fill="#1B1F2E" stroke={C.ink} strokeWidth={6} />
    <rect x={-20} y={-56} width={40} height={30} rx={6} fill={C.ink} stroke={C.ink} strokeWidth={4} />
    <rect x={-30} y={0} width={60} height={34} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} /><rect x={-26} y={22} width={52} height={7} fill={C.cobalt} />
    <path d="M -34,-20 q 0,30 6,60" stroke="#FFFFFF" strokeWidth={5} opacity={0.4} fill="none" />
  </g>
);

const Tweezers: React.FC<{x: number; y: number; rot?: number; s?: number; close?: number}> = ({x, y, rot = 0, s = 1, close = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d={`M -${14 - 10 * close},0 L -3,${160} M ${14 - 10 * close},0 L 3,${160}`} stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
    <path d={`M -${14 - 10 * close},0 L -3,160 M ${14 - 10 * close},0 L 3,160`} stroke="#C9CED6" strokeWidth={7} strokeLinecap="round" />
  </g>
);

const SealStamp: React.FC<{x: number; y: number; s?: number; rot?: number; press?: number}> = ({x, y, s = 1, rot = 0, press = 0}) => (
  <g transform={`translate(${x} ${y + 20 * press}) rotate(${rot}) scale(${s})`}>
    <rect x={-20} y={-120} width={40} height={90} rx={10} fill={C.copper} stroke={C.ink} strokeWidth={6} />
    <rect x={-80} y={-34} width={160} height={50} rx={8} fill={C.seal} stroke={C.ink} strokeWidth={6} />
    <text y={0} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} fill={C.paper}>SEALED</text>
  </g>
);

const Calendar: React.FC<{x: number; y: number; s?: number; rot?: number; f: number}> = ({x, y, s = 1, rot = 0, f}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot + 1.5 * Math.sin(f / 20)}) scale(${s})`}>
    <rect x={-90} y={-100} width={180} height={190} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <rect x={-90} y={-100} width={180} height={44} rx={8} fill={C.seal} stroke={C.ink} strokeWidth={6} />
    <text y={-68} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={C.paper}>FALL</text>
    <text y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill="#7A7A82">SHOULD</text>
    <text y={22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill="#7A7A82">BE READY</text>
    <path d="M -50,52 l 20,20 l 50,-40" fill="none" stroke="#7A7A82" strokeWidth={7} strokeDasharray="8 10" strokeLinecap="round" />
  </g>
);

const Ribbon: React.FC<{x: number; y: number; len: number; k: number; tilt?: number; lines?: number; f: number}> = ({x, y, len, k, tilt = 0, lines = 6, f}) => {
  const L = len * clamp01(k);
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <rect x={0} y={-60} width={Math.max(0, L)} height={120} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={5} strokeDasharray="14 8" opacity={clamp01(k * 4)} />
      {Array.from({length: lines}).map((_, i) => <path key={i} d={`M 14,${-42 + i * 15} h ${Math.max(0, Math.min(L - 28, 60 + (i * 37) % 70))}`} stroke={C.ink} strokeWidth={4} opacity={0.4} strokeLinecap="round" />)}
      <path d={`M ${L},-60 q 16,60 0,120`} stroke={C.ink} strokeWidth={4} fill="none" opacity={clamp01(k * 4) * (0.5 + 0.5 * Math.sin(f / 5))} />
    </g>
  );
};

const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color?: string; p?: number}> = ({x1, y1, x2, y2, color = C.ink, p = 1}) => {
  const k = clamp01(p);
  const ex = lerp(x1, x2, k), ey = lerp(y1, y2, k);
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g opacity={clamp01(k * 3)}>
      <path d={`M ${x1},${y1} L ${ex},${ey}`} stroke={color} strokeWidth={18} strokeLinecap="round" />
      <path d={`M ${ex},${ey} l ${-40 * Math.cos(a - 0.5)},${-40 * Math.sin(a - 0.5)} M ${ex},${ey} l ${-40 * Math.cos(a + 0.5)},${-40 * Math.sin(a + 0.5)}`} stroke={color} strokeWidth={18} strokeLinecap="round" />
    </g>
  );
};

const Laptop: React.FC<{x: number; y: number; s?: number; f: number; note?: number; wipe?: number}> = ({x, y, s = 1, f, note = 0, wipe = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={12} rx={190} ry={12} fill="#000" opacity={0.4} />
    <rect x={-150} y={-190} width={300} height={190} rx={12} fill="#2A2F3A" stroke={C.ink} strokeWidth={7} />
    <rect x={-132} y={-172} width={264} height={154} rx={6} fill="#0E1A2B" />
    <rect x={-120} y={-160} width={120} height={64} rx={6} fill="#1E5FA8" stroke={C.ink} strokeWidth={3} />
    <text x={-60} y={-122} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill="#FFFFFF">ZOOM</text>
    <rect x={8} y={-160} width={116} height={64} rx={6} fill="#1E5FA8" stroke={C.ink} strokeWidth={3} />
    <circle cx={66} cy={-132} r={14} fill={C.skin} />
    <rect x={-120} y={-84} width={244} height={60} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={3} opacity={clamp01(note * 3)} />
    {[0, 1, 2].map((i) => <path key={i} d={`M -108,${-70 + i * 17} h ${Math.max(0, (60 + ((i * 53) % 80)) * clamp01(note * 1.4 - i * 0.2))}`} stroke={C.cobalt} strokeWidth={5} strokeLinecap="round" opacity={1 - wipe} />)}
    {note > 0.05 && <text x={2} y={-34} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={13} fill={C.cobalt} opacity={1 - wipe}>AI LOG NOTE</text>}
    {wipe > 0.01 && <rect x={-120 + 250 * (1 - wipe)} y={-84} width={250 * wipe} height={60} rx={4} fill="#0E1A2B" />}
    <path d="M -190,0 L -150,-6 H 150 L 190,0 Z" fill="#3A404C" stroke={C.ink} strokeWidth={6} />
  </g>
);

// ---- bands: the page tracker on top, five states of the throughline ------------------------------------------------------------------------------
const TOPS = [{k: 1, t: 'SCRIBBLED'}, {k: 17, t: 'BINNED'}, {k: 25, t: 'STAMPED'}, {k: 37, t: 'INSIDE'}, {k: 45, t: 'BLANK'}];
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
        <text x={60} y={150} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill={C.paper} opacity={0.85}>THE PAGE · WHO HOLDS THE TRANSCRIPT?</text>
        {TOPS.map((q, i) => {
          const x = 44 + i * 196, on = i <= cur, now = i === cur;
          return (
            <g key={i} transform={`translate(${x} 205)`}>
              <rect x={0} y={-34} width={184} height={68} rx={10} fill={now ? C.paper : on ? '#5A2A1A' : '#4A1A20'} stroke={now ? C.ink : C.paper} strokeWidth={now ? 5 : 3} opacity={on ? 1 : 0.8} />
              <text x={92} y={7} textAnchor="middle" fontFamily={MONO} fontSize={22} fontWeight={900} fill={now ? C.ink : C.paper}>{q.t}</text>
            </g>
          );
        })}
        {f >= at(19) && f < at(42) && <text x={60} y={318} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill={C.glow} opacity={0.95}>COURTSMART TRANSCRIPTS · A PLAN · NOT CONFIRMED LIVE</text>}
        <line x1={44} y1={270} x2={1020} y2={270} stroke={C.paper} strokeWidth={3} strokeDasharray="6 10" opacity={0.6} />
        <circle cx={44 + Math.max(0, cur) * 196 + 92} cy={270} r={9} fill={C.paper} />
      </g>
    </svg>
  );
};

// ---- S1: the side door ----------------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [2, 3, 4];
  const reach = ease(f, b(47), 20);
  const enter = easeIO(f, b(1) - 4, 34);
  const scr = ease(f, b(2) - 6, 10);
  const back = easeIO(f, b(2) + 8, 32);
  const tagX = lerp(lerp(190, 560, enter), 190, back);
  const dOpen = ease(f, b(1) - 16, 14) * (1 - ease(f, b(2) + 34, 10));
  const note = ease(f, b(3), 40);
  const wipe = easeIO(f, b(4), 14);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={980}>
      <SVG>
        <Door x={170} y={960} s={0.95} open={dOpen * 0.85} f={f} />
        <HeldProp f={f} px={620} py={1130} w={200} h={180} seed={1.2} kind="rest"><Reels f={f} x={620} y={1010} s={0.6} awake={0} mood="calm" lamp={false} /></HeldProp>
        <Person x={850} y={930} s={0.9} f={f} seed={2.4} label="" />
        <Laptop x={840} y={1170} s={1.1} f={f} note={note} wipe={wipe} />
        <Tagalong f={f} x={tagX} y={1060} s={1.15} scruff={scr * (1 - back)} flip={enter < 0.98 || back > 0.02 ? 1 : 1} />
        {reach > 0.02 && <g opacity={1 - back}><Hand x={tagX + 4} y={lerp(300, 520, reach) + 240 * scr} s={1.0} rot={180} /><Lab text="COURT STAFF" x={tagX + 150} y={lerp(360, 560, reach) + 200 * scr} size={20} tone="dark" p={reach} /></g>}
        <Page x={tagX - 90} y={1020 + 40 * back} s={0.5} rot={-12} scrawl />
        <HeldTravel f={f} x={720} y={960} w={260} h={190} mode="sweep" seed={1} />
        <Plate x={540} y={585} text="NO DIY AI TRANSCRIPTS" size={36} tone="warn" p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="ZOOM AI LOG NOTE" size={34} p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="NO ZOOM AI NOTES" size={36} tone="warn" p={vis(f, b, K, 2)} />
      </SVG>
    </Frame>
  );
};

// ---- S2: the policy lands -------------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [5, 6, 7, 8];
  const drop = springy(f, b(5), 22);
  const crowd = ease(f, b(6), 24);
  const tag = ease(f, b(8) - 6, 16);
  const key = ease(f, b(9), 22);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={980}>
      <SVG>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} opacity={crowd}><Person x={140 + i * 190} y={lerp(1010, 960, crowd)} s={0.74} robe={i === 2} shirt={['#2B3F6B', '#6B3F2B', '#3F6B4A', '#6B2B55', '#2B6B66'][i]} f={f} seed={i + 0.6} /></g>
        ))}
        <g transform={`translate(0 ${lerp(-700, 0, drop)})`}>
          <HeldProp f={f} px={540} py={1140} w={300} h={340} seed={2} kind="rest"><Binder x={540} y={980} s={1.25} rot={-3} f={f} /></HeldProp>
        </g>
        <g opacity={tag}><Lab text="AS PUBLISHED BY LAWSITES" x={540} y={1190} size={22} tone="glow" p={tag} /></g>
        <g opacity={key} transform={`translate(0 ${lerp(-40, 0, key)})`}><Key x={930} y={760} s={0.85} tag="" flip={0} f={f} /></g>
        <Plate x={540} y={585} text="AI POLICY · ALASKA COURT SYSTEM" size={26} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="ALL STAFF + JUDICIAL OFFICERS" size={30} p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="VERSION 1.2 · JUNE 2026" size={34} tone="glow" p={vis(f, b, K, 2)} />
        <Plate x={540} y={832} text="WHO GETS THE KEY?" size={34} tone="warn" p={ease(f, b(9), 14)} />
        <HeldTravel f={f} x={400} y={810} w={280} h={330} mode="shadow" seed={2} />
      </SVG>
    </Frame>
  );
};

// ---- S3: everything else is a yes, with homework ---------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [10, 11, 12];
  const yes = springy(f, b(10), 20);
  const mag = ease(f, b(11), 22);
  const snap = springy(f, b(12), 14);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={980}>
      <SVG>
        <HeldProp f={f} px={300} py={1160} w={300} h={380} seed={3} kind="rest"><Page x={300} y={1000} s={1.9} rot={-3} tag={0} /></HeldProp>
        <g transform={`translate(${lerp(560, 380, mag)} ${lerp(1100, 960, mag)}) rotate(${-18 + 6 * Math.sin(f / 9)})`} opacity={mag}>
          <circle r={74} fill="#BFE3E8" opacity={0.45} stroke={C.ink} strokeWidth={9} /><path d="M 52,52 L 130,130" stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
          <path d="M -34,2 l 20,22 l 44,-48" fill="none" stroke="#1D7A3C" strokeWidth={13} strokeLinecap="round" />
        </g>
        <g transform={`translate(${760} ${1000}) scale(${0.6 + 0.4 * yes})`} opacity={clamp01(yes * 2)}>
          <rect x={-130} y={-70} width={260} height={140} rx={14} fill="#1D7A3C" stroke={C.ink} strokeWidth={8} />
          <text y={22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={70} fill={C.paper}>YES</text>
          <text y={-34} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={C.paper}>EVERYTHING ELSE</text>
        </g>
        <g transform="translate(910 1250)">
          <rect x={-100} y={-90} width={200} height={140} rx={8} fill="#B88A3E" stroke={C.ink} strokeWidth={7} transform={`rotate(${snap * -4})`} />
          <text y={-20} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={C.ink}>CONFIDENTIAL</text>
          <g transform={`translate(0 ${-110 + 22 * (1 - snap)}) rotate(${-12 * (1 - snap)})`}><rect x={-100} y={-12} width={200} height={34} rx={6} fill="#CC9D4A" stroke={C.ink} strokeWidth={6} /></g>
          {snap > 0.3 && <g><path d="M -60,-130 l -10,-34 l 22,12 l 8,-40 l 16,36 l 28,-18 l -8,40" fill="none" stroke={C.glow} strokeWidth={7} strokeLinejoin="round" /></g>}
        </g>
        <Plate x={540} y={585} text="EVERYTHING ELSE IS A YES" size={30} tone="glow" p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="VERIFY ALL OUTPUT" size={36} p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="NEVER ENTER CONFIDENTIAL INFO" size={28} tone="warn" p={vis(f, b, K, 2)} />
        <HeldTravel f={f} x={160} y={800} w={280} h={360} mode="sweep" seed={3} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the side doors close, then the building pulls back ------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [13, 14, 15, 16, 17];
  const phone = ease(f, b(13), 20);
  const down = ease(f, b(14), 20);
  const code = ease(f, b(15), 20);
  const interp = springy(f, b(16), 16);
  const crum = ease(f, b(17), 18);
  const pull = easeIO(f, b(18) - 6, 46);
  const bricks = [ease(f, b(13) + 12, 28), ease(f, b(14) + 12, 28), ease(f, b(16) + 10, 28)];
  const S = lerp(1, 0.62, pull);
  return (
    <Frame p={p} z0={1.02} z1={1.06} oy={980}>
      <SVG>
        <g transform={`translate(540 ${lerp(960, 1010, pull)}) scale(${S}) translate(-540 -960)`}>
          <Door x={190} y={960} s={0.78} brick={bricks[0]} label="PERSONAL" f={f} />
          <Door x={540} y={960} s={0.78} brick={bricks[1]} label="DOWNLOADS" f={f} />
          <Door x={890} y={960} s={0.78} brick={bricks[2]} label="INTERPRETING" f={f} />
          <g transform={`translate(${lerp(120, 190, phone)} ${lerp(1100, 990, phone) + 8 * Math.sin(f / 4) * (1 - bricks[0])})`} opacity={phone * (1 - 0.9 * bricks[0])}>
            <rect x={-26} y={-46} width={52} height={92} rx={9} fill="#2A2F3A" stroke={C.ink} strokeWidth={5} />
            <path d="M -22,0 q 11,-16 22,-2 q 11,-14 22,2 q -6,14 -22,6 q -16,8 -22,-6 Z" fill="#3A2218" stroke={C.ink} strokeWidth={3} />
            {[-8, 8].map((ex) => <circle key={ex} cx={ex} cy={-18} r={5} fill={C.paper} stroke={C.ink} strokeWidth={2} />)}
          </g>
          <g transform={`translate(${540} ${lerp(760, 1060, down)})`} opacity={down * (1 - 0.9 * bricks[1])}>
            <path d="M -22,-30 V 14 H -42 L 0,56 L 42,14 H 22 V -30 Z" fill={C.cobalt} stroke={C.ink} strokeWidth={5} />
          </g>
          <g transform="translate(540 1130)" opacity={code}>
            <HeldProp f={f} px={0} py={80} w={160} h={170} seed={4} kind="float"><Page x={0} y={0} s={0.8} /></HeldProp>
            <path d="M -86,70 l 24,28 l 60,-60" fill="none" stroke="#1D7A3C" strokeWidth={12} strokeLinecap="round" opacity={code} />
          </g>
          <g transform={`translate(890 ${lerp(1130, 1160, interp)}) scale(${0.5 + 0.5 * interp})`} opacity={interp}>
            <circle r={52} fill={C.seal} stroke={C.ink} strokeWidth={8} /><path d="M -34,-34 L 34,34" stroke={C.paper} strokeWidth={13} strokeLinecap="round" />
          </g>
          <g transform={`translate(${190 + 520 * crum} ${lerp(1190, 1200, crum)})`} opacity={0}><circle r={1} /></g>
        </g>
        <g transform={`translate(${lerp(540, 540, crum)} ${lerp(1230, 1190, crum)})`} opacity={crum > 0.02 ? 1 : 0}>
          <Page x={0} y={0} s={0.55} crumple={crum} scrawl />
          <rect x={-64} y={14} width={128} height={74} rx={6} fill="#26383E" stroke={C.ink} strokeWidth={5} opacity={0.8} />
        </g>
        <Plate x={540} y={585} text="NO PERSONAL AI ACCOUNTS" size={32} tone="warn" p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} displayLines={['NO AI DOWNLOADS', 'ON COURT DEVICES']} text="NO AI DOWNLOADS ON COURT DEVICES" size={30} p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="HUMAN REVIEWS THE CODE" size={32} p={vis(f, b, K, 2)} />
        <Plate x={540} y={832} text="NO AI INTERPRETING" size={34} tone="warn" p={vis(f, b, K, 3)} />
        <Plate x={540} y={914} text="DISCIPLINE UP TO DISMISSAL" size={30} tone="warn" p={vis(f, b, K, 4) * (1 - ease(f, b(18) + 36, 10))} />
      </SVG>
    </Frame>
  );
};

// ---- S5: Reels wakes, every hearing feeds one recorder ---------------------------------------------------------------------------------------------
const ROOMS: Array<[number, number]> = [[170, 840], [540, 800], [910, 840], [120, 1080], [960, 1080], [250, 1230], [830, 1230]];
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [19, 48, 20, 21, 22];
  const wake = ease(f, b(19), 26);
  const prt = ease(f, b(20), 34);
  const pull = easeIO(f, b(21) - 4, 40);
  const glassIn = ease(f, b(22), 22);
  const S = lerp(1.2, 0.62, pull);
  return (
    <Frame p={p} z0={1.02} z1={1.07} oy={1000}>
      <SVG>
        {ROOMS.map(([rx, ry], i) => {
          const o = clamp01(pull * 1.6 - i * 0.1);
          return (
            <g key={i} opacity={o}>
              <path d={`M ${rx},${ry} L 540,1050`} stroke={C.brass} strokeWidth={5} strokeDasharray="10 12" strokeDashoffset={-f * 1.4} opacity={0.8} />
              <rect x={rx - 70} y={ry - 50} width={140} height={100} rx={8} fill="#2A0F14" stroke={C.paper} strokeWidth={4} />
              <circle cx={rx - 20} cy={ry} r={14} fill={C.skin} stroke={C.ink} strokeWidth={3} /><circle cx={rx + 22} cy={ry + 4} r={12} fill="#C9A878" stroke={C.ink} strokeWidth={3} />
              <path d={`M ${rx - 60},${ry + 40} h 120`} stroke={C.brass} strokeWidth={4} />
            </g>
          );
        })}
        <g transform={`translate(540 1050) scale(${S}) translate(-540 -1050)`}>
          <HeldProp f={f} px={540} py={1210} w={440} h={400} seed={5} kind="rest" gain={0.8}><Reels f={f} x={540} y={1060} s={1} awake={wake} mood={wake > 0.6 ? 'proud' : 'calm'} print={prt} /></HeldProp>
          <Ribbon x={700} y={1130} len={300} k={prt} tilt={-6} f={f} />
        </g>
        <g transform="translate(990 900)"><Key x={0} y={0} s={0.5} tag="" flip={0} f={f} /></g>
        <g opacity={glassIn} transform={`translate(0 ${lerp(30, 0, glassIn)})`}>
          <Tumbler x={150} y={1090} s={0.5} f={f} />
          <InkBottle x={270} y={1128} s={0.7} />
        </g>
        <Plate x={540} y={585} text="THE COURT'S OWN RECORDER" size={32} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="STAFF AND JUDGES" size={38} p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} displayLines={['AI TRANSCRIPTS', 'OF ALL HEARINGS']} text="AI TRANSCRIPTS OF ALL HEARINGS" size={34} tone="glow" p={vis(f, b, K, 2)} />
        <Plate x={540} y={850} text="EVERY HEARING" size={38} p={vis(f, b, K, 3)} />
        <Plate x={540} y={934} text="WHO GETS TO READ THEM?" size={34} tone="warn" p={vis(f, b, K, 4)} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the transcript, labeled, tied to the tape --------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [23, 24, 25, 26];
  const open = ease(f, b(23), 18);
  const cal = springy(f, b(24), 22);
  const tg = ease(f, b(25) - 20, 14);
  const stampK = springy(f, b(25), 14);
  const thread = easeIO(f, b(26), 30);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={1000}>
      <SVG>
        <HeldProp f={f} px={290} py={1215} w={400} h={400} seed={6} kind="rest"><Reels f={f} x={290} y={1060} s={0.95} awake={1} mood="proud" print={1} /></HeldProp>
        <Lab text="COURTSMART" x={290} y={1240} size={24} tone="glow" p={open} />
        <g opacity={clamp01(1 - cal * 0.1)}>
          <path d={`M 40,1010 q 20,-${40 * Math.sin(f / 6)} 40,0 t 40,0 t 40,0`} stroke={C.audio} strokeWidth={6} fill="none" opacity={0.7 * open} />
        </g>
        <HeldProp f={f} px={780} py={1215} w={250} h={290} seed={7} kind="hang"><Page x={780} y={1050} s={1.55} tag={tg} stamp="NOT THE|OFFICIAL RECORD" stampK={stampK} /></HeldProp>
        <path d={`M 450,1040 C 560,${1010 + 30 * Math.sin(f / 9)} 640,1000 ${lerp(450, 770, thread)},${lerp(1040, 1040, thread)}`} stroke={C.brass} strokeWidth={6} fill="none" opacity={thread} strokeDasharray="14 8" />
        <g transform={`translate(${lerp(940, 900, cal)} ${lerp(700, 790, cal)})`} opacity={cal}><Calendar x={0} y={0} s={0.75} f={f} /></g>
        <g transform="translate(900 1170)" opacity={thread}>
          <rect x={-40} y={-34} width={80} height={68} rx={10} fill={C.audio} stroke={C.ink} strokeWidth={6} />
          {[0, 1, 2].map((i) => <circle key={i} cx={0} cy={-14 + i * 18} r={5 + (i === 1 ? 4 : 0)} fill={C.ink} />)}
        </g>
        <Plate x={540} y={585} text="COURTSMART" size={40} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="SHOULD BE READY BY FALL" size={30} tone="glow" p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="NOT THE OFFICIAL RECORD" size={32} tone="warn" p={vis(f, b, K, 2)} />
        <Plate x={540} y={832} text="LINKS TO OFFICIAL AUDIO" size={32} p={vis(f, b, K, 3)} />
        <HeldTravel f={f} x={700} y={960} w={160} h={190} mode="shadow" seed={6} />
      </SVG>
    </Frame>
  );
};

// ---- S7: one hearing, two people at a counter cut by glass ---------------------------------------------------------------------------------------------
const Monitor: React.FC<{x: number; y: number; f: number; scroll: number}> = ({x, y, f, scroll}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={96} rx={90} ry={9} fill="#000" opacity={0.35} />
    <rect x={-100} y={-90} width={200} height={150} rx={10} fill="#1B1F2A" stroke={C.ink} strokeWidth={7} />
    <rect x={-86} y={-76} width={172} height={122} rx={4} fill={C.paper} />
    {Array.from({length: 8}).map((_, i) => <path key={i} d={`M -72,${-64 + ((i * 16 + scroll * 90) % 112)} h ${50 + ((i * 37) % 70)}`} stroke={C.ink} strokeWidth={5} opacity={0.5} strokeLinecap="round" />)}
    <rect x={-20} y={60} width={40} height={30} fill="#3A404C" stroke={C.ink} strokeWidth={5} />
  </g>
);
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [27, 28, 29, 30];
  const win = ease(f, b(27), 24);
  const scroll = (f - b(28)) / 20;
  const form = easeIO(f, b(29), 40);
  const cas = easeIO(f, b(30) - 14, 26);
  const clack = Math.max(0, Math.sin(clamp01((f - b(30) - 12) / 10) * Math.PI)) * 14;
  return (
    <Frame p={p} z0={1.03} z1={1.09} oy={1000} glassSide>
      <SVG>
        <g opacity={win}>
          <rect x={0} y={1130} width={1080} height={50} fill="#5A3A22" stroke={C.ink} strokeWidth={6} />
          <rect x={0} y={1130} width={1080} height={10} fill={C.brass} />
        </g>
        <Person x={210} y={960} s={0.95} robe f={f} seed={1.1} />
        <HeldProp f={f} px={380} py={1130} w={220} h={200} seed={8} kind="rest"><Monitor x={380} y={1030} f={f} scroll={clamp01(scroll) * 0 + Math.max(0, scroll)} /></HeldProp>
        <GlassPane x={560} y={960} w={46} h={470} f={f} frost={0.1} />
        <g transform="translate(1010 800)"><Key x={0} y={0} s={0.45} tag="" flip={0} f={f} /></g>
        <Person x={860} y={960} s={0.95} shirt="#3F6B4A" f={f} seed={4.2} />
        <g transform={`translate(${lerp(820, 420, form)} ${1100 - 6 * Math.sin(form * Math.PI)})`} opacity={clamp01(form * 3) * (1 - 0.0)}><Form x={0} y={0} s={0.55} rot={-8 + 8 * form} ink={form} /></g>
        <g transform={`translate(${lerp(400, 790, cas)} ${1085 - 70 * Math.sin(cas * Math.PI) + clack * 0})`} opacity={clamp01(cas * 3)}><Cassette x={0} y={0} s={0.6} rot={lerp(-20, 6, cas)} f={f} /></g>
        <Plate x={540} y={585} text="ONE HEARING · TWO PEOPLE" size={32} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="AI TRANSCRIPT" size={32} tone="glow" p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="FORM TF-304" size={42} p={vis(f, b, K, 2)} />
        <Plate x={540} y={832} text="OFFICIAL AUDIO" size={38} p={vis(f, b, K, 3)} />
        <HeldTravel f={f} x={290} y={930} w={180} h={170} mode="sweep" seed={8} />
      </SVG>
    </Frame>
  );
};

// ---- S8: the velvet rope ----------------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [31, 32];
  const rope = springy(f, b(31), 20);
  const press = ease(f, b(32), 14);
  return (
    <Frame p={p} z0={1.03} z1={1.09} oy={1000} glassSide>
      <SVG>
        <rect x={0} y={1130} width={1080} height={50} fill="#5A3A22" stroke={C.ink} strokeWidth={6} />
        <HeldProp f={f} px={250} py={1210} w={340} h={340} seed={9} kind="rest"><Reels f={f} x={250} y={1060} s={0.85} awake={1} mood="calm" print={1} /></HeldProp>
        <Ribbon x={380} y={1085} len={150} k={1} tilt={-4} f={f} />
        <GlassPane x={700} y={960} w={420} h={470} f={f} frost={0.55} />
        <g transform={`translate(${lerp(940, 760, press)} ${lerp(1040, 960, press)})`} opacity={clamp01(press * 3)}><Hand x={0} y={0} s={0.8} rot={-90} /></g>
        {[460, 940].map((px) => <g key={px}><rect x={px - 10} y={900} width={20} height={250} fill={C.brass} stroke={C.ink} strokeWidth={5} /><circle cx={px} cy={896} r={20} fill={C.brass} stroke={C.ink} strokeWidth={5} /><ellipse cx={px} cy={1152} rx={40} ry={9} fill="#000" opacity={0.35} /></g>)}
        <path d={`M 460,912 Q 700,${lerp(840, 1010, rope)} 940,912`} stroke={C.seal} strokeWidth={22} fill="none" strokeLinecap="round" />
        <path d={`M 460,906 Q 700,${lerp(834, 1004, rope)} 940,906`} stroke="#FF7A8A" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
        <Plate x={540} y={585} text="INTERNAL ONLY" size={44} tone="warn" p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="NOT FOR THE PUBLIC" size={38} p={vis(f, b, K, 1)} />
        <HeldTravel f={f} x={130} y={920} w={240} h={200} mode="sweep" seed={9} />
      </SVG>
    </Frame>
  );
};

// ---- S9: the ink drop (the court's stated worry, felt) ----------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [33, 34, 49, 35];
  const glass = ease(f, b(33), 24);
  const ink = easeIO(f, b(34) - 6, 80);
  const tilt = ease(f, b(34) - 22, 16) * (1 - ease(f, b(34) + 4, 12));
  const stampK = springy(f, b(35), 16);
  const tw = ease(f, b(49), 24);
  const tw2 = easeIO(f, b(35) + 40, 30);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={1000} glassSide>
      <SVG>
        <g opacity={glass} transform={`translate(0 ${lerp(30, 0, glass)})`}>
          <HeldProp f={f} px={540} py={1190} w={340} h={340} seed={10} kind="rest" gain={0.6}><Tumbler x={540} y={1030} s={1.6} ink={ink} f={f} /></HeldProp>
        </g>
        <g transform={`translate(${lerp(840, 640, tilt)} ${lerp(820, 680, tilt)})`} opacity={clamp01(glass * (1 - ease(f, b(34) + 14, 12)))}><InkBottle x={0} y={0} s={1.0} tilt={lerp(0, 120, tilt)} /></g>
        <g transform={`translate(${lerp(1160, 760, tw) + 60 * tw2} ${lerp(900, 1000, tw) - 20 * tw2})`} opacity={clamp01(tw * 3)}><Tweezers x={0} y={0} rot={lerp(-70, -40, tw) + 12 * Math.sin(f / 4) * tw2} close={tw2} s={1.2} /></g>
        <g transform={`translate(170 ${lerp(640, 760, stampK)})`} opacity={clamp01(stampK * 2)}><SealStamp x={0} y={0} s={1.15} rot={-6} press={stampK} /></g>
        <Plate x={540} y={585} text="THE POLICY'S STATED WORRY" size={30} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="CAN'T BE PULLED BACK" size={38} tone="warn" p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="COULDN'T BE REMOVED" size={34} p={vis(f, b, K, 2)} />
        <Plate x={540} y={832} text="SEALED LATER" size={42} tone="glow" p={vis(f, b, K, 3)} />
        <HeldTravel f={f} x={400} y={800} w={280} h={400} mode="shadow" seed={10} />
      </SVG>
    </Frame>
  );
};

// ---- S10: containment, not a fix -------------------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [36, 37, 38];
  const flip = easeIO(f, b(37), 18);
  const cas = easeIO(f, b(38), 30);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={1000} glassSide>
      <SVG>
        <rect x={0} y={1130} width={1080} height={50} fill="#5A3A22" stroke={C.ink} strokeWidth={6} />
        <HeldProp f={f} px={250} py={1205} w={320} h={300} seed={11} kind="rest"><Reels f={f} x={250} y={1075} s={0.8} awake={1} mood="smug" print={1} /></HeldProp>
        <HeldProp f={f} px={500} py={1200} w={150} h={170} seed={16} kind="float"><Page x={500} y={1120} s={0.85} tag={1} stamp="NOT THE|OFFICIAL RECORD" stampK={1} /></HeldProp>
        <GlassPane x={540} y={960} w={46} h={470} f={f} frost={0.2} />
        <g transform="translate(330 830)"><Key x={0} y={0} s={0.85} tag="STAFF SIDE ONLY" flip={flip} f={f} /></g>
        <Person x={860} y={960} s={0.95} shirt="#3F6B4A" f={f} seed={4.2} />
        <g transform={`translate(${lerp(760, 640, cas)} ${lerp(1100, 1010, cas) - 30 * Math.sin(cas * Math.PI)})`} opacity={clamp01(cas * 3)}><Cassette x={0} y={0} s={0.62} rot={lerp(-14, 4, cas)} f={f} /></g>
        <Plate x={540} y={585} text="CONTAINMENT, NOT A FIX" size={34} tone="glow" p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="STAFF SIDE ONLY" size={40} p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} text="THE PARTY CAN REQUEST THE TAPE" size={30} tone="warn" p={vis(f, b, K, 2)} />
        <HeldTravel f={f} x={130} y={930} w={240} h={200} mode="sweep" seed={11} />
      </SVG>
    </Frame>
  );
};

// ---- S11: the turn, drawn as a floor plan: side doors closed, one front door ------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [39, 50, 40, 41];
  const pull = easeIO(f, b(39), 40);
  const cl = [0, 1, 2, 3].map((i) => ease(f, b(40) + i * 9, 22));
  const front = ease(f, b(41), 20);
  const S = lerp(1.5, 1, pull);
  const sides: Array<[number, number, boolean]> = [[140, 880, true], [140, 1060, true], [940, 880, true], [940, 1060, true]];
  return (
    <Frame p={p} z0={1.02} z1={1.06} oy={1000}>
      <SVG>
        <g transform={`translate(540 1000) scale(${S}) translate(-540 -1000)`}>
          <rect x={140} y={720} width={800} height={460} rx={8} fill="#2A0F14" stroke={C.paper} strokeWidth={8} />
          <rect x={360} y={820} width={360} height={260} rx={8} fill="#3E0F15" stroke={C.brass} strokeWidth={6} />
          <HeldProp f={f} px={540} py={1030} w={150} h={140} seed={15} kind="rest"><g transform="translate(540 960)"><Reels f={f} x={0} y={0} s={0.42} awake={1} mood="proud" print={1} /></g></HeldProp>
          <HeldTravel f={f} x={470} y={860} w={140} h={150} mode="sweep" seed={15} />
          {sides.map(([sx, sy], i) => (
            <g key={i}>
              <rect x={sx - 12} y={sy - 40} width={24} height={80} fill={cl[i] > 0.5 ? '#A44A2E' : '#6B1E24'} stroke={C.ink} strokeWidth={4} />
              {cl[i] > 0.05 && <rect x={sx - 12} y={sy - 40 + 80 * (1 - cl[i])} width={24} height={80 * cl[i]} fill="#A44A2E" stroke={C.ink} strokeWidth={4} />}
              <path d={`M ${sx < 540 ? sx - 70 : sx + 70},${sy} H ${sx < 540 ? sx - 14 : sx + 14}`} stroke={C.brass} strokeWidth={8} strokeDasharray="10 8" opacity={1 - cl[i]} />
            </g>
          ))}
          <g opacity={front}>
            <rect x={470} y={1166} width={140} height={28} fill={C.glow} stroke={C.ink} strokeWidth={5} />
            <ellipse cx={540} cy={1230} rx={150} ry={60} fill={C.glow} opacity={0.3 + 0.1 * Math.sin(f / 6)} />
            <Lab text="A PLAN" x={700} y={1262} size={22} tone="glow" p={front} />
            <path d="M 540,1260 V 1090" stroke={C.glow} strokeWidth={14} strokeLinecap="round" strokeDasharray="22 14" strokeDashoffset={-f * 2} />
          </g>
        </g>
        <Plate x={540} y={585} displayLines={['NOT BANNING', 'DECIDING WHO HOLDS']} text="NOT BANNING DECIDING WHO HOLDS" size={32} p={vis(f, b, K, 0)} />
        <Plate x={540} y={690} text="WHO HOLDS THEM" size={40} p={vis(f, b, K, 1)} />
        <Plate x={540} y={772} text="SIDE DOORS CLOSED" size={36} tone="warn" p={vis(f, b, K, 2)} />
        <Plate x={540} y={854} text="ONE FRONT DOOR" size={42} tone="glow" p={vis(f, b, K, 3)} />
      </SVG>
    </Frame>
  );
};

// ---- S12: the policy admits one thing about itself --------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [42, 51, 43, 44];
  const sweat = ease(f, b(42), 30);
  const comb = easeIO(f, b(43), 50);
  const combIn = ease(f, b(51), 20);
  const tidy = clamp01(comb);
  return (
    <Frame p={p} z0={1.03} z1={1.1} oy={1000}>
      <SVG>
        <HeldProp f={f} px={560} py={1290} w={420} h={430} seed={12} kind="rest"><Binder x={560} y={1110} s={1.3} rot={lerp(-4, 0, tidy)} sweat={sweat * (1 - tidy)} f={f} /></HeldProp>
        <g transform={`translate(${lerp(900, 330, easeIO(f, b(51), 24))} ${lerp(980, 1000 + 190 * comb + 30 * Math.sin(comb * 9), comb)}) rotate(${lerp(30, 80, comb)})`} opacity={combIn}>
          <rect x={-60} y={-14} width={120} height={28} rx={6} fill={C.mint} stroke={C.ink} strokeWidth={5} />
          {[-44, -28, -12, 4, 20, 36].map((tx) => <path key={tx} d={`M ${tx},14 v 22`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />)}
          <circle cx={0} cy={-34} r={16} fill={C.mint} stroke={C.ink} strokeWidth={5} /><circle cx={-5} cy={-36} r={3} fill={C.ink} /><circle cx={6} cy={-36} r={3} fill={C.ink} />
        </g>
        <Plate x={540} y={585} text="THE POLICY ADMITS ONE THING" size={30} p={vis(f, b, K, 0)} />
        <Plate x={540} y={668} text="THE COURT ASKED AN AI TOOL" size={30} p={vis(f, b, K, 1)} />
        <Plate x={540} y={750} displayLines={['AI HELPED FORMAT', 'AN EARLY DRAFT']} text="AI HELPED FORMAT AN EARLY DRAFT" size={34} tone="glow" p={vis(f, b, K, 2)} />
        <Plate x={540} y={836} text="FORMATTING ONLY" size={42} tone="warn" p={vis(f, b, K, 3)} />
        <HeldTravel f={f} x={380} y={820} w={320} h={380} mode="sweep" seed={12} />
      </SVG>
    </Frame>
  );
};

// ---- S13: the question, and the loop back to the side door --------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [45, 46];
  const q = ease(f, b(45), 20);
  const pop = springy(f, b(46), 20);
  return (
    <Frame p={p} z0={1.03} z1={1.08} oy={1000} glassSide>
      <SVG>
        <rect x={0} y={1130} width={1080} height={50} fill="#5A3A22" stroke={C.ink} strokeWidth={6} />
        <HeldProp f={f} px={290} py={1205} w={340} h={320} seed={13} kind="rest"><Reels f={f} x={290} y={1070} s={0.85} awake={1} mood="worried" print={0.6} look={1} /></HeldProp>
        <GlassPane x={560} y={960} w={46} h={470} f={f} frost={0.1} />
        <Person x={830} y={960} s={0.95} shirt="#3F6B4A" f={f} seed={4.2} />
        <g transform={`translate(${lerp(900, 780, ease(f, b(45), 20))} 1100)`} opacity={ease(f, b(45), 12)}><Cassette x={0} y={0} s={0.5} rot={-4} f={f} /></g>
        <HeldProp f={f} px={610} py={1130} w={150} h={150} seed={14} kind="float"><Page x={610} y={1040} s={0.75} blank /></HeldProp>
        <g transform={`translate(${900} ${lerp(1180, 1110, q)})`} opacity={q}><Hand x={0} y={0} s={0.7} rot={-90} /></g>
        <g transform={`translate(110 ${lerp(1300, 1090, pop)})`}>
          <rect x={-70} y={36} width={140} height={90} rx={8} fill="#4A2A18" stroke={C.ink} strokeWidth={6} /><rect x={-44} y={0} width={90} height={26} rx={6} fill={C.brass} stroke={C.ink} strokeWidth={5} />
          <Tagalong f={f} x={0} y={-4} s={0.6} />
        </g>
        <Plate x={540} y={585} displayLines={['SHOULD A PARTY GET', 'THE AI DRAFT?']} text="SHOULD A PARTY GET THE AI DRAFT" size={36} tone="glow" p={vis(f, b, K, 0)} />
        <Plate x={540} y={706} text="THEIR OWN HEARING" size={36} p={vis(f, b, K, 1)} />
        <HeldTravel f={f} x={740} y={880} w={200} h={280} mode="shadow" seed={13} />
      </SVG>
    </Frame>
  );
};

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

export const ep1109Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1109Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1109: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 11.5, 21.0, 30.0, 41.5, 52.0, 64.0, 76.0, 81.5, 91.5, 100.5, 110.0, 119.5, 124.0].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><Bands beats={bs} /></Sequence>
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1A0B0D" ink="#F4ECD8" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
