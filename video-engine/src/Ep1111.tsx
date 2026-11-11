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
import {IdleFigure} from './lib/figureidle';
import {RoofPuck, PuckMode, PuckEmotion} from './lib/sensors';
import {AK_PATH} from './lib/akmap';
import {IDS} from './Ep1111Ids';

// The Roof Puck, 2026-11-11. Palette roles are art_direction.json. The ROOF PUCK is the hero and the throughline.
// Fairbanks ice-fog noon: pink-gold sun behind milky fog over ice-black ground. Graphite puck body, hoarfrost only on its rim
// and the rime. Amber only on live mechanisms (heater ring, returns, rings, needles). Crimson once, the thought-frame tail light.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

export const C = {
  fog: '#D8D2CF', fogD: '#B9B2AE', sun: '#E9B7A0', ground: '#12161A', groundL: '#1E242A', rime: '#E8E1D2', snow: '#CFC9C0', snowD: '#A9A39B',
  paper: '#D9D0BC', ink: '#2A1426', line: '#0B0E10', amber: '#F2A33A', crimson: '#B3232F', graphite: '#2A2F36', led: '#EEF2F5',
  cream: '#EFE6D2', white: '#F4F1EA', strobe: '#E6E9EC', spruce: '#6E6E72', spruceD: '#4E5156', skin: '#D9A882', skin2: '#9C6B4E', parka: '#4F5A3A',
  wood: '#8A6A50', woodD: '#5A4232', hud: '#F7F5F0',
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
  dark: {fill: '#12161A', fg: '#E8E1D2', edge: '#E8E1D2'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.crimson, edge: C.ink},
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
type Mode = 'fog' | 'kitchen' | 'map' | 'white' | 'under' | 'field' | 'cab' | 'night';
const Frame: React.FC<{p: SP; mode?: Mode; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; warmth?: number; overlay?: React.ReactNode; children: React.ReactNode}> =
({p, mode = 'fog', cam, z0 = 1.03, z1 = 1.09, bloom = 0.05, vignette = 0.26, ox = 540, oy = 930, warmth = 0.0, overlay, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 30 * Math.sin(p.f / 110) + 18 * t, fy: oy};
  return (
    <AbsoluteFill>
      <Atmos f={p.f} mode={mode} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 3 * Math.sin(p.f / 23)}px, ${jl.y + 4 * Math.sin(p.f / 17 + 1) + 3 * t}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#12161A" stroke={C.rime} strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={C.rime}>{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.06} warmth={warmth} />
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
const Spruces: React.FC<{y: number; n: number; seed: number; f: number; x0?: number; x1?: number; scale?: number; fill?: string; o?: number}> =
({y, n, seed, f, x0 = -20, x1 = 1100, scale = 1, fill = C.spruce, o = 1}) => (
  <g opacity={o}>
    {Array.from({length: n}).map((_, i) => {
      const x = lerp(x0, x1, (i + h01(i, seed)) / n);
      const hgt = (150 + 130 * h01(i, seed + 3)) * scale;
      const sway = 1.6 * Math.sin(f / 40 + i);
      return (
        <g key={i} transform={`translate(${x} ${y}) skewX(${sway})`}>
          <path d={`M 0,${-hgt} L ${-30 * scale},${-hgt * 0.62} L ${-14 * scale},${-hgt * 0.6} L ${-40 * scale},${-hgt * 0.3} L ${-18 * scale},${-hgt * 0.3} L ${-48 * scale},0 L ${48 * scale},0 L ${18 * scale},${-hgt * 0.3} L ${40 * scale},${-hgt * 0.3} L ${14 * scale},${-hgt * 0.6} L ${30 * scale},${-hgt * 0.62} Z`} fill={fill} stroke={C.line} strokeWidth={3} />
          <path d={`M ${-26 * scale},${-hgt * 0.6} l ${10 * scale},-6 l ${8 * scale},4 M ${-36 * scale},${-hgt * 0.3} l ${12 * scale},-5 l ${10 * scale},4`} stroke={C.rime} strokeWidth={4} fill="none" opacity={0.8} />
        </g>
      );
    })}
  </g>
);

const Flakes: React.FC<{f: number; n?: number; speed?: number; o?: number; y0?: number; y1?: number}> = ({f, n = 40, speed = 1, o = 0.7, y0 = 300, y1 = 1500}) => (
  <g opacity={o}>
    {Array.from({length: n}).map((_, i) => {
      const x = (i * 197 + 30 * Math.sin(f / 30 + i)) % 1080;
      const y = y0 + ((f * speed * (1 + (i % 4) * 0.4) + i * 113) % (y1 - y0));
      return <circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill={C.white} />;
    })}
  </g>
);

const Atmos: React.FC<{f: number; mode: Mode}> = ({f, mode}) => {
  if (mode === 'kitchen') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <rect width={W} height={H} fill="#CDBFB2" />
        <rect x={120} y={360} width={840} height={620} rx={10} fill={C.fog} stroke={C.line} strokeWidth={10} />
        <rect x={120} y={360} width={840} height={620} rx={10} fill={C.cream} opacity={0.35} />
        <path d="M 540,360 V 980 M 120,670 H 960" stroke={C.line} strokeWidth={8} />
        <circle cx={760} cy={520} r={90} fill={C.sun} opacity={0.75} />
        <circle cx={760} cy={520} r={200} fill={C.sun} opacity={0.2} />
        <rect data-band="ok" x={0} y={1040} width={W} height={880} fill={C.wood} />
        <g data-band="ok">{Array.from({length: 9}).map((_, i) => <path key={i} d={`M 0,${1090 + i * 95} H 1080`} stroke={C.woodD} strokeWidth={3} opacity={0.4} />)}</g>
        <rect x={0} y={1036} width={W} height={10} fill={C.line} />
      </svg>
    );
  }
  if (mode === 'map') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <rect width={W} height={H} fill="#9D968F" />
        <rect data-band="ok" x={40} y={420} width={1000} height={1460} rx={12} fill={C.paper} stroke={C.line} strokeWidth={8} />
        <g data-band="ok">{Array.from({length: 14}).map((_, i) => <path key={i} d={`M 60,${480 + i * 100} H 1020`} stroke="#C2B9A4" strokeWidth={2} />)}{Array.from({length: 10}).map((_, i) => <path key={`v${i}`} d={`M ${80 + i * 100},440 V 1860`} stroke="#C2B9A4" strokeWidth={2} />)}</g>
      </svg>
    );
  }
  if (mode === 'white') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <defs><linearGradient id="whg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9E1D8" /><stop offset="0.45" stopColor="#F3EEE7" /><stop offset="1" stopColor="#E2DAD0" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#whg)" />
        <circle cx={820} cy={560} r={160} fill={C.sun} opacity={0.22} />
        <circle cx={820} cy={560} r={46} fill={C.sun} opacity={0.35} />
        <path d="M 0,700 L 90,640 L 160,690 L 240,610 L 330,680 L 420,630 L 520,690 L 610,620 L 700,680 L 800,640 L 900,690 L 1000,630 L 1080,680 L 1080,760 L 0,760 Z" fill="#D8D0C6" opacity={0.7} />
        {Array.from({length: 34}).map((_, i) => <path key={i} d={`M ${(i * 137 + f * 9) % 1300 - 100},${300 + (i * 61) % 1300} l 120,18`} stroke="#DCD5CC" strokeWidth={6} opacity={0.8} />)}
        {Array.from({length: 22}).map((_, i) => <path key={`n${i}`} d={`M ${(i * 211 + f * 16) % 1400 - 200},${420 + (i * 83) % 1200} l 200,30`} stroke="#FFFFFF" strokeWidth={10} opacity={0.5} />)}
      </svg>
    );
  }
  if (mode === 'under') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <rect width={W} height={H} fill="#1A1F24" />
        <rect data-band="ok" x={0} y={1060} width={W} height={860} fill="#2B3138" />
        <g data-band="ok">{Array.from({length: 22}).map((_, i) => <path key={i} d={`M ${(i * 89) % 1080},${1080 + (i * 53) % 700} l ${30 + (i % 4) * 20},${-12 + (i % 3) * 8} l 20,22`} stroke={C.rime} strokeWidth={3} fill="none" opacity={0.45} />)}</g>
        <rect x={0} y={1056} width={W} height={8} fill={C.line} />
      </svg>
    );
  }
  if (mode === 'field') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <rect width={W} height={H} fill={C.snow} />
        {Array.from({length: 60}).map((_, i) => <path key={i} d={`M ${(i * 173) % 1080},${(i * 211) % 1920} q 40,-10 80,0`} stroke={C.snowD} strokeWidth={3} fill="none" opacity={0.6} />)}
      </svg>
    );
  }
  if (mode === 'cab') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <rect width={W} height={H} fill="#2B3036" />
        <rect data-band="ok" x={0} y={0} width={W} height={1920} fill="#33393F" />
        <g data-band="ok">{Array.from({length: 12}).map((_, i) => <path key={i} d={`M 0,${200 + i * 150} H 1080`} stroke="#2A2F35" strokeWidth={4} />)}</g>
        <rect x={0} y={0} width={W} height={300} fill={C.fog} opacity={0.5} />
      </svg>
    );
  }
  if (mode === 'night') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <rect width={W} height={H} fill="#07090B" />
        <rect data-band="ok" x={0} y={1000} width={W} height={920} fill="#0B0E10" />
      </svg>
    );
  }
  // fog: Fairbanks ice-fog noon
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="fogsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CFC8C5" /><stop offset="0.55" stopColor={C.fog} /><stop offset="1" stopColor="#E3D3CC" /></linearGradient>
        <radialGradient id="fogsun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={C.sun} stopOpacity={0.95} /><stop offset="0.5" stopColor={C.sun} stopOpacity={0.35} /><stop offset="1" stopColor={C.sun} stopOpacity={0} /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#fogsky)" />
      <circle cx={820} cy={600} r={260} fill="url(#fogsun)" />
      <circle cx={820} cy={600} r={60} fill="#F1CDB8" opacity={0.9} />
      {[0, 1, 2].map((i) => <rect key={i} x={-200 + ((f * (0.6 + i * 0.3) + i * 400) % 1500)} y={560 + i * 110} width={700} height={60} rx={30} fill="#E9E4E1" opacity={0.4} />)}
      <rect data-band="ok" x={0} y={1060} width={W} height={860} fill={C.snow} />
      <rect x={0} y={1056} width={W} height={8} fill={C.snowD} />
    </svg>
  );
};

const Idle: React.FC<{f: number; x: number; y: number; seed?: number; amp?: number; children: React.ReactNode}> = ({f, x, y, seed = 0, amp = 2.2, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${1.4 * amp * Math.sin(f / 26 + seed)}) scale(${1 + 0.016 * amp * Math.sin(f / 15 + seed)} ${1 - 0.02 * amp * Math.sin(f / 15 + seed)}) translate(${-x} ${-y})`}>{children}</g>
);
const vis = (f: number, b: (id: number) => number, ks: number[], i: number) => ease(f, b(ks[i]), 14) * (i < ks.length - 1 ? 1 - ease(f, b(ks[i + 1]) - 10, 8) : 1);

// ---- the cast -----------------------------------------------------------------------------------------------------------------------------------
/** the road in perspective: ice-black with snowbanks, lane dashes that travel. */
const Road: React.FC<{f: number; y0?: number; speed?: number; mirror?: number; glint?: number}> = ({f, y0 = 1060, speed = 1, mirror = 0, glint = 0}) => (
  <g>
    <path d={`M 470,${y0} L 610,${y0} L 1180,1920 L -100,1920 Z`} fill={C.ground} stroke={C.line} strokeWidth={4} />
    {mirror > 0.01 && <path d={`M 470,${y0} L 610,${y0} L 1180,1920 L -100,1920 Z`} fill="#3A4652" opacity={0.35 * mirror} />}
    {Array.from({length: 7}).map((_, i) => {
      const k = ((i / 7 + f * 0.004 * speed) % 1);
      const yy = y0 + Math.pow(k, 2.2) * (1920 - y0);
      const hh = 10 + 90 * Math.pow(k, 2);
      return <rect key={i} x={540 - 3 - 10 * k} y={yy} width={6 + 20 * k} height={hh} fill={C.rime} opacity={0.7} />;
    })}
    {glint > 0.01 && <path d={`M ${lerp(-200, 1200, glint)},${y0 + 40} L ${lerp(-120, 1280, glint)},${y0 + 40} L ${lerp(100, 1500, glint)},1920 L ${lerp(-60, 1340, glint)},1920 Z`} fill={C.white} opacity={0.35 * Math.sin(Math.PI * glint)} />}
    <path d={`M 0,${y0 + 60} Q 200,${y0 + 20} 470,${y0} L -100,1920 L 0,1920 Z`} fill={C.snow} stroke={C.snowD} strokeWidth={3} />
    <path d={`M 1080,${y0 + 60} Q 880,${y0 + 20} 610,${y0} L 1180,1920 L 1080,1920 Z`} fill={C.snow} stroke={C.snowD} strokeWidth={3} />
  </g>
);

/** a dark rounded car silhouette, side view, drawn at its ground line. Set dressing only. */
const CarSil: React.FC<{x: number; y: number; s?: number; f: number; tail?: number; hazard?: number; flip?: number; roll?: number}> = ({x, y, s = 1, f, tail = 0, hazard = 0, flip = 1, roll = 0}) => {
  const strobe = hazard > 0.01 && Math.floor(f / 9) % 2 === 0 ? hazard : 0;
  const wheelRot = roll * 360;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
      <ellipse cx={0} cy={6} rx={250} ry={22} fill="#000" opacity={0.35} />
      <path d="M -240,-40 Q -240,-90 -190,-100 L -120,-110 Q -70,-190 30,-196 Q 130,-196 180,-118 L 230,-104 Q 260,-96 258,-50 L 254,-30 Q 252,-14 236,-14 L -228,-14 Q -242,-14 -240,-40 Z" fill={C.graphite} stroke={C.line} strokeWidth={7} />
      <path d="M -96,-112 Q -54,-176 26,-180 Q 104,-180 150,-120 Z" fill="#3A424B" stroke={C.line} strokeWidth={5} />
      <path d="M 26,-180 V -114" stroke={C.line} strokeWidth={5} />
      <path d="M -220,-70 H 236" stroke="#3A424B" strokeWidth={4} />
      {[-150, 150].map((wx) => (
        <g key={wx} transform={`translate(${wx} -14) rotate(${wheelRot})`}>
          <circle r={46} fill="#0B0E10" stroke={C.line} strokeWidth={6} />
          <circle r={20} fill="#3A424B" />
          <path d="M -18,0 H 18 M 0,-18 V 18" stroke="#12161A" strokeWidth={4} />
        </g>
      ))}
      <rect x={244} y={-80} width={14} height={20} rx={4} fill={C.white} opacity={0.85} />
      <rect x={-246} y={-80} width={12} height={22} rx={4} fill={tail > 0.01 ? C.crimson : '#3A1E22'} />
      {tail > 0.01 && <circle cx={-246} cy={-70} r={40 * tail} fill={C.crimson} opacity={0.35 * tail} />}
      {strobe > 0 && [-246, 246].map((hx) => <circle key={hx} cx={hx} cy={-44} r={22} fill={C.strobe} opacity={0.75 * strobe} />)}
    </g>
  );
};

const HAIR = ['#3A2218', '#14101C', '#8A5A2B', '#B8B8C0', '#5A2D14'];
/** a person in a parka, drawn through IdleFigure; `armUp` raises the right arm (the logger tap). */
const Person: React.FC<{x: number; y: number; s?: number; skin?: string; f?: number; seed?: number; flip?: number; armUp?: number; look?: number; cues?: number[]; col?: string}> =
({x, y, s = 1, skin = C.skin, f = 0, seed = 0, flip = 1, armUp = 0, look = 0, cues = [], col = C.parka}) => {
  const breathe = 1 + 0.014 * Math.sin(f / 16 + seed);
  const nod = 2.2 * Math.sin(f / 31 + seed * 2);
  const blink = ((f + Math.round(seed * 40)) % 130) > 124 ? 0.15 : 1;
  const hair = HAIR[Math.abs(Math.round(seed * 3)) % HAIR.length];
  return (
    <g transform={`translate(${x} ${y + 3 * Math.sin(f / 21 + seed)}) scale(${s * flip} ${s})`}>
      <IdleFigure f={f} x={0} footY={142} h={234} seed={seed} cues={cues}>
      <ellipse cx={0} cy={142} rx={66} ry={11} fill="#000" opacity={0.3} />
      <rect x={-34} y={126} width={30} height={16} rx={7} fill="#14101C" stroke={C.line} strokeWidth={4} />
      <rect x={4} y={126} width={30} height={16} rx={7} fill="#14101C" stroke={C.line} strokeWidth={4} />
      <g transform={`scale(1 ${breathe})`}>
        <rect x={-50} y={-10} width={100} height={146} rx={32} fill={col} stroke={C.line} strokeWidth={7} />
        <path d="M -46,30 h 92 M -46,62 h 92 M -46,94 h 92" stroke="#2E3522" strokeWidth={4} opacity={0.7} />
        <path d="M 0,-6 V 134" stroke="#2E3522" strokeWidth={4} />
        <path d="M -42,6 q 6,60 4,112" stroke="#FFFFFF" strokeWidth={5} opacity={0.2} fill="none" />
      </g>
      <rect x={-64} y={0} width={26} height={96} rx={13} fill={col} stroke={C.line} strokeWidth={6} />
      <circle cx={-51} cy={104} r={14} fill="#3A2A22" stroke={C.line} strokeWidth={5} />
      <g transform={`rotate(${-armUp * 70} 49 6)`}>
        <rect x={38} y={0} width={26} height={96} rx={13} fill={col} stroke={C.line} strokeWidth={6} />
        <circle cx={51} cy={104} r={14} fill="#3A2A22" stroke={C.line} strokeWidth={5} />
        <g transform="translate(51 118)"><rect x={-20} y={-6} width={40} height={56} rx={6} fill={C.graphite} stroke={C.line} strokeWidth={4} /><rect x={-13} y={2} width={26} height={18} rx={3} fill={C.amber} opacity={0.4 + 0.5 * armUp} /></g>
      </g>
      <rect x={-12} y={-24} width={24} height={22} rx={8} fill={skin} stroke={C.line} strokeWidth={5} />
      <g transform={`rotate(${nod + look * 6} 0 -10)`}>
        <circle cy={-52} r={54} fill="#5B6346" stroke={C.line} strokeWidth={7} />
        <path d="M -48,-60 q 48,-40 96,0" fill="none" stroke={C.rime} strokeWidth={9} strokeLinecap="round" />
        <circle cy={-50} r={38} fill={skin} stroke={C.line} strokeWidth={6} />
        <path d="M -30,-70 q 30,-20 60,0" fill={hair} stroke={C.line} strokeWidth={3} />
        {[-13, 13].map((ex, i) => <ellipse key={i} cx={ex + look * 3} cy={-50} rx={4.5} ry={4.5 * blink} fill={C.line} />)}
        <path d="M -12,-30 q 12,8 24,0" stroke={C.line} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      </IdleFigure>
    </g>
  );
};

/** a pair of gloved hands on (or an inch off) a wheel arc. */
const WheelHands: React.FC<{x: number; y: number; s?: number; on: number; f: number}> = ({x, y, s = 1, on, f}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={110} fill="none" stroke={C.line} strokeWidth={22} />
    <circle r={110} fill="none" stroke="#3A424B" strokeWidth={12} />
    <path d="M -100,10 Q 0,40 100,10" stroke="#3A424B" strokeWidth={14} fill="none" />
    {[-1, 1].map((side) => (
      <g key={side} transform={`translate(${side * 100} ${-20 - 40 * (1 - on) + 2 * Math.sin(f / 10 + side)})`}>
        <rect x={-26} y={-20} width={52} height={64} rx={20} fill="#1E242A" stroke={C.line} strokeWidth={5} />
        <rect x={-30} y={38} width={60} height={120} rx={16} fill="#3B4552" stroke={C.line} strokeWidth={5} />
      </g>
    ))}
  </g>
);

const rise = (up: number, h: number) => (1 - Math.min(1.12, Math.max(0, up))) * (h + 220);
/** a roadside billboard on two posts; `up` 0..1 rolls it up out of the snowbank. Its lamp is paper-white. */
const Billboard: React.FC<{x: number; y: number; w?: number; h?: number; up: number; f: number; children?: React.ReactNode; shake?: number; post?: number}> = ({x, y, w = 420, h = 260, up, f, children, shake = 0, post = 220}) => {
  const k = clamp01(up);
  const rs = rise(up, h);
  return (
    <g transform={`translate(${x + shake * 4 * Math.sin(f * 1.3)} ${y + rs}) rotate(${0.8 * Math.sin(f / 23 + x)})`} opacity={k > 0.01 ? 1 : 0}>
      <path d={`M ${-w / 2},${post} L ${w / 2},${post} L ${w / 2 + 160},${post + 40} L ${-w / 2 + 160},${post + 40} Z`} fill={C.line} opacity={0.18} />
      {[-w * 0.3, w * 0.3].map((px) => <g key={px}><rect x={px - 14} y={0} width={28} height={post} fill="#3A424B" stroke={C.line} strokeWidth={5} /><rect x={px + 4} y={0} width={8} height={post} fill="#252B31" /></g>)}
      <rect x={-w / 2 + 14} y={-h + 14} width={w} height={h} rx={6} fill="#252B31" stroke={C.line} strokeWidth={5} />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill={C.paper} stroke={C.line} strokeWidth={8} />
      <rect x={-w / 2 + 10} y={-h + 10} width={w - 20} height={h - 20} rx={4} fill="none" stroke="#B9B09B" strokeWidth={3} />
      <path d={`M ${-w / 2 - 4},${-h + 2} ${Array.from({length: 12}).map((_, i) => `q ${w / 24},${-14 - 6 * Math.abs(Math.sin(i * 2.1))} ${w / 12},0`).join(' ')}`} fill={C.rime} stroke={C.line} strokeWidth={3} />
      <g transform={`translate(0 ${-h - 22})`}><rect x={-60} y={-8} width={120} height={14} rx={6} fill={C.white} stroke={C.line} strokeWidth={3} /><path d={`M -60,6 L ${-w / 2},${h * 0.5} L ${w / 2},${h * 0.5} L 60,6 Z`} fill={C.white} opacity={0.12} /></g>
      <path d={`M ${w / 2},${-h} l -46,0 l 46,${36 + 10 * Math.sin(f / 5 + x)} Z`} fill={C.rime} stroke={C.line} strokeWidth={3} transform={`rotate(${10 * Math.sin(f / 4 + x)} ${w / 2} ${-h})`} />
      <g transform={`translate(0 ${-h / 2})`}>{children}</g>
    </g>
  );
};

/** a blank odometer: five drums that roll and land on blanks. `glow` 0..1 lifts a soft halo. */
const Odometer: React.FC<{x: number; y: number; s?: number; roll: number; f: number; glow?: number}> = ({x, y, s = 1, roll, f, glow = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow > 0.01 && <rect x={-150} y={-62} width={300} height={124} rx={20} fill={C.white} opacity={0.5 * glow} />}
    <rect x={-130} y={-46} width={260} height={92} rx={14} fill={C.graphite} stroke={C.line} strokeWidth={6} />
    {[0, 1, 2, 3, 4].map((i) => {
      const spin = roll > 0 && roll < 1 ? ((f * (2 + i)) % 40) - 20 : 0;
      return (
        <g key={i}>
          <rect x={-112 + i * 46} y={-32} width={40} height={64} rx={6} fill={C.paper} stroke={C.line} strokeWidth={4} />
          {spin !== 0 && <path d={`M ${-104 + i * 46},${spin} h 24`} stroke={C.ink} strokeWidth={6} />}
          <path d={`M ${-104 + i * 46},-2 h 24`} stroke={C.snowD} strokeWidth={3} opacity={roll >= 1 ? 1 : 0.3} />
        </g>
      );
    })}
  </g>
);

const BlankCalendar: React.FC<{x: number; y: number; s?: number; flip: number; f: number}> = ({x, y, s = 1, flip, f}) => (
  <g transform={`translate(${x} ${y}) rotate(${1.5 * Math.sin(f / 20)}) scale(${s})`}>
    <rect x={-90} y={-100} width={180} height={190} rx={8} fill={C.paper} stroke={C.line} strokeWidth={6} />
    <rect x={-90} y={-100} width={180} height={44} rx={8} fill={C.graphite} stroke={C.line} strokeWidth={6} />
    {[-50, 0, 50].map((rx) => <circle key={rx} cx={rx} cy={-100} r={8} fill={C.rime} stroke={C.line} strokeWidth={3} />)}
    <g transform={`scale(1 ${Math.max(0.05, Math.abs(Math.cos(clamp01(1 - flip) * Math.PI)))})`}>
      {Array.from({length: 12}).map((_, i) => <rect key={i} x={-74 + (i % 4) * 38} y={-40 + Math.floor(i / 4) * 40} width={30} height={30} rx={3} fill="none" stroke={C.snowD} strokeWidth={3} />)}
    </g>
  </g>
);

const Phone: React.FC<{x: number; y: number; s?: number; rot?: number; lit?: number; children?: React.ReactNode}> = ({x, y, s = 1, rot = 0, lit = 1, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-190} y={-330} width={380} height={660} rx={46} fill="#14181D" stroke={C.line} strokeWidth={9} />
    <rect x={-166} y={-296} width={332} height={592} rx={20} fill={lit > 0.5 ? C.white : '#0B0E10'} />
    <rect x={-40} y={-318} width={80} height={12} rx={6} fill="#2A2F36" />
    <g>{children}</g>
  </g>
);

/** a pin: round head on a needle, the head flattens when it lands */
const Pin: React.FC<{x: number; y: number; drop: number; s?: number; color?: string; wide?: number}> = ({x, y, drop, s = 1, color = C.ink, wide = 0}) => (
  <g transform={`translate(${x} ${y - (1 - clamp01(drop)) * 260}) scale(${s})`} opacity={clamp01(drop * 3)}>
    {wide > 0.01 && <ellipse cx={0} cy={0} rx={260 * wide} ry={150 * wide} fill={C.ink} opacity={0.12} stroke={C.ink} strokeWidth={4} strokeDasharray="14 10" />}
    <path d="M 0,0 L 0,-60" stroke={C.line} strokeWidth={6} />
    <circle cy={-70} r={22} fill={color} stroke={C.line} strokeWidth={5} />
    <circle cx={-7} cy={-77} r={6} fill="#FFFFFF" opacity={0.5} />
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

/** a powerline crossing the top of the frame: poles with crossbars and sagging, frosted wires. */
const Powerline: React.FC<{f: number; xs: number[]; top?: number; base?: number}> = ({f, xs, top = 470, base = 1062}) => (
  <g>
    {xs.map((x) => <g key={x}><rect x={x - 9} y={top} width={18} height={base - top} fill="#4E5156" stroke={C.line} strokeWidth={4} /><rect x={x - 60} y={top + 20} width={120} height={14} fill="#4E5156" stroke={C.line} strokeWidth={3} />{[-50, 0, 50].map((dx) => <circle key={dx} cx={x + dx} cy={top + 16} r={6} fill={C.rime} stroke={C.line} strokeWidth={2} />)}</g>)}
    {xs.slice(0, -1).map((x, i) => [-50, 0, 50].map((dx) => <path key={`${i}${dx}`} d={`M ${x + dx},${top + 16} Q ${(x + xs[i + 1]) / 2 + dx + 14 * Math.sin(f / 13 + i)},${top + 90 + 18 * Math.sin(f / 17 + i + dx)} ${xs[i + 1] + dx},${top + 16}`} stroke={C.line} strokeWidth={3} fill="none" />))}
    {[-1200, 2280].map((x) => [-50, 0, 50].map((dx) => <path key={`e${x}${dx}`} d={`M ${x < 0 ? xs[0] + dx : xs[xs.length - 1] + dx},${top + 16} Q ${x < 0 ? xs[0] / 2 + dx : (xs[xs.length - 1] + 1080) / 2 + dx},${top + 80} ${x < 0 ? -20 : 1100},${top + 30}`} stroke={C.line} strokeWidth={3} fill="none" />))}
  </g>
);

// ---- shared set pieces ------------------------------------------------------------------------------------------------------------------------------
/** a frosted window frame seen from inside a Fairbanks home: jagged rime fringe across the top and down the sides. */
const FrostWindow: React.FC<{f: number; o?: number}> = ({f, o = 1}) => (
  <g opacity={o}>
    <path d={`M 0,300 H 1080 V 470 ${Array.from({length: 18}).map((_, i) => `L ${1080 - (i + 0.5) * 60},${470 + 40 + 60 * Math.abs(Math.sin(i * 1.7 + 0.4)) + 6 * Math.sin(f / 30 + i)} L ${1080 - (i + 1) * 60},${470 + 10 * Math.abs(Math.sin(i))}`).join(' ')} L 0,470 Z`} fill={C.rime} opacity={0.92} />
    {Array.from({length: 18}).map((_, i) => <path key={i} d={`M ${30 + i * 60},480 l 10,30 l -14,12 l 18,26`} stroke="#B9B2A6" strokeWidth={3} fill="none" />)}
    <path d={`M 0,470 ${Array.from({length: 10}).map((_, i) => `L ${36 + 30 * Math.abs(Math.sin(i * 2.3))},${520 + i * 70} L 0,${555 + i * 70}`).join(' ')} Z`} fill={C.rime} opacity={0.85} />
    <path d={`M 1080,470 ${Array.from({length: 10}).map((_, i) => `L ${1044 - 30 * Math.abs(Math.sin(i * 1.9))},${520 + i * 70} L 1080,${555 + i * 70}`).join(' ')} Z`} fill={C.rime} opacity={0.85} />
    <rect x={0} y={292} width={1080} height={16} fill={C.woodD} />
  </g>
);

// ---- S1: the hook. A frosted puck wipes a question mark, the camera pulls back to the mirror road ----------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [1, 3, 4, 5];
  const wipe = easeIO(f, 8, 26);
  const arm = f < 8 ? -12 * Math.sin((f / 8) * Math.PI / 2) : -12 + 192 * springy(f, 8, 30);
  const sweep = easeIO(f, 10, 60);
  const mirror = easeIO(f, 40, 50);
  const opened = ease(f, b(4) + 4, 12);
  const refreeze = easeIO(f, b(5), 34);
  const q = wipe * (1 - refreeze);
  const handWipe = easeIO(f, 46, 60);
  const cam = track([{t: 0, z: 2.1, fx: 540, fy: 1070}, {t: 40, z: 2.1, fx: 540, fy: 1070}, {t: 100, z: 1.05, fx: 540, fy: 1000}, {t: b(4), z: 1.08, fx: 540, fy: 1010},
    {t: b(4) + 20, z: 1.35, fx: 540, fy: 1060}, {t: b(5), z: 1.4, fx: 540, fy: 1060}, {t: b(5) + 30, z: 1.75, fx: 540, fy: 1080}, {t: p.dur, z: 1.8, fx: 540, fy: 1080}]);
  return (
    <Frame p={p} mode="fog" cam={cam} overlay={<>
        <FrostWindow f={f} o={1 - 0.5 * ease(f, b(4), 30)} />
        <Lab text="ILLUSTRATIVE" x={900} y={1290} size={18} tone="dark" p={ease(f, b(3), 12) * (1 - ease(f, b(5) - 10, 8))} />
        <Plate x={540} y={1210} text="A FAIRBANKS RESIDENT ASKED" size={36} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={760} text="DO THEY KNOW?" size={56} tone="glow" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1210} text="BLACK ICE" size={44} tone="dark" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <Spruces y={1062} n={9} seed={2} f={f} x0={-40} x1={400} scale={1.9} o={0.8} />
        <Spruces y={1062} n={7} seed={7} f={f} x0={680} x1={1120} scale={1.75} o={0.8} />
        <Powerline f={f} xs={[330, 900]} top={600} base={1062} />
        <Road f={f} speed={0.4} mirror={mirror} glint={sweep} />
        {/* the mirror: car and puck reflected upside down from the ground line */}
        <g opacity={0.42 * mirror} transform="translate(540 1300) scale(1 -0.55)"><CarSil x={0} y={0} s={0.9} f={f} /><RoofPuck x={0} y={-176} f={f} scale={1.1} frost={1} mode="blind" emotion="sleepy" qmark={q} seed={9} /></g>
        <HeldProp f={f} px={540} py={1180} w={500} h={300} seed={1.1} kind="rest">
          <CarSil x={540} y={1300} s={0.9} f={f} />
          <RoofPuck x={540} y={1124} f={f} scale={1.1} frost={1} clearRing={0.08 * Math.sin(f / 9) ** 2} mode={opened > 0.5 && refreeze < 0.6 ? 'clear' : 'blind'} emotion={refreeze > 0.4 ? 'wary' : opened > 0.5 ? 'startled' : 'sleepy'} qmark={q} look={refreeze > 0.4 ? 0.4 : 0} rimGlow={0.4} seed={1} />
        </HeldProp>
        {/* the micro wiper: a big blade sweeps the dome, winds back first, overshoots and settles; frost sprays off its tip */}
        <g transform={`translate(540 1060) rotate(${arm - 90})`} opacity={1 - ease(f, 90, 20)}>
          <rect x={-8} y={-8} width={150} height={16} rx={8} fill="#14181D" stroke={C.line} strokeWidth={4} />
          <rect x={60} y={-14} width={84} height={10} rx={5} fill="#3A424B" />
          <circle r={12} fill="#3A424B" stroke={C.line} strokeWidth={4} />
        </g>
        {Array.from({length: 18}).map((_, i) => {
          const k = clamp01((f - 8 - i * 1.2) / 24);
          const a = ((arm - 90 + 20 - i * 6) * Math.PI) / 180;
          return <circle key={i} cx={540 + Math.cos(a) * (150 + 120 * k)} cy={1060 + Math.sin(a) * (150 + 120 * k) + 60 * k * k} r={6 - 4 * k} fill={C.rime} opacity={k > 0 && k < 1 ? 1 - k : 0} />;
        })}
        <path d={`M -60,${1080 + 30 * Math.sin(sweep * 3)} L ${lerp(-200, 1300, sweep)},1500 L ${lerp(-40, 1500, sweep)},1500 Z`} fill={C.white} opacity={0.24 * Math.sin(Math.PI * sweep)} />
        {/* the resident's mittened hand wiping the window in the foreground */}
        <g transform={`translate(${lerp(-60, 210, handWipe)} ${lerp(1060, 880, handWipe) + 20 * Math.sin(f / 7) * (1 - handWipe)}) rotate(${-30 + 40 * handWipe})`} opacity={1 - ease(f, b(4), 20)}>
          <rect x={-60} y={-50} width={120} height={110} rx={50} fill="#7A5A44" stroke={C.line} strokeWidth={7} />
          <rect x={-74} y={-20} width={36} height={60} rx={18} fill="#7A5A44" stroke={C.line} strokeWidth={6} />
          <rect x={-52} y={56} width={104} height={260} rx={20} fill={C.parka} stroke={C.line} strokeWidth={7} />
          <path d="M -52,70 h 104" stroke={C.rime} strokeWidth={10} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S2: the post on a phone in a fog-lit kitchen, the puck small in the window glass -------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [6, 7, 8];
  const slide = easeIO(f, b(6) - 14, 26);
  const pin = springy(f, b(7) - 6, 22);
  const cones = ease(f, b(8) - 4, 26);
  const drum = easeIO(f, b(8) + 30, 40);
  const odo = clamp01((f - b(8)) / 24);
  const glow = clamp01(1 - Math.abs(f - b(8) - 6) / 12);
  const steam = (f % 90) / 90;
  return (
    <Frame p={p} mode="kitchen" z0={1.02} z1={1.07} ox={460} oy={960} overlay={<>
        <Plate x={770} y={1120} text="NOVEMBER 5TH" size={40} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={770} y={1120} text="THIS SEASON · ALASKA" size={34} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={770} y={1120} displayLines={['CLOSED-COURSE TESTS ·', 'HEAVY SNOWFALL DATA']} text="CLOSED-COURSE TESTS · HEAVY SNOWFALL DATA" size={32} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <g opacity={0.6}><CarSil x={780} y={800} s={0.45} f={f} /><RoofPuck x={780} y={712} f={f} scale={0.45} frost={0.8} clearRing={0.1} mode="blind" emotion="sleepy" seed={2} /></g>
        <clipPath id="kwin"><rect x={124} y={364} width={832} height={612} /></clipPath>
        <g clipPath="url(#kwin)"><Spruces y={990} n={9} seed={21} f={f} x0={100} x1={980} scale={1.5} o={0.55} /><Flakes f={f} n={24} speed={0.7} o={0.6} y0={360} y1={980} /></g>
        <path d={`M 120,368 ${Array.from({length: 20}).map((_, i) => `l 21,${26 + 22 * Math.abs(Math.sin(i * 1.9))} l 21,${-26 - 22 * Math.abs(Math.sin(i * 1.9))}`).join(' ')}`} fill={C.rime} stroke="#B9B2A6" strokeWidth={2} />
        <path d="M 160,940 L 400,400" stroke="#FFFFFF" strokeWidth={10} opacity={0.2} />
        {/* a mug steaming on the sill: the room is warm */}
        <g transform="translate(250 1010)"><rect x={-40} y={-60} width={80} height={70} rx={10} fill="#8C7B6A" stroke={C.line} strokeWidth={5} /><path d="M 40,-44 q 26,6 0,30" stroke={C.line} strokeWidth={6} fill="none" />{[0, 1].map((i) => <path key={i} d={`M ${-10 + i * 20},${-70 - steam * 60} q 10,-14 0,-28`} stroke={C.white} strokeWidth={5} fill="none" opacity={1 - steam} />)}</g>
        <ellipse cx={380} cy={1330} rx={220} ry={34} fill="#000" opacity={0.25} />
        <g transform={`translate(${lerp(-200, 0, slide)} 0)`}>
          <Phone x={370} y={1010} s={0.9} rot={-4}>
            <rect x={-150} y={-280} width={300} height={30} rx={6} fill={C.graphite} />
            <text x={0} y={-218} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>NOVEMBER 5TH</text>
            {[0, 1].map((i) => <rect key={i} x={-150} y={-190 + i * 26} width={300 - i * 60} height={12} rx={6} fill="#B9B2A6" />)}
            <g transform="translate(-130 -130) scale(0.26)"><path d={AK_PATH} fill={C.snow} stroke={C.line} strokeWidth={10} /></g>
            <Pin x={0} y={-30} drop={pin} s={0.6} wide={0.5} />
            <text x={0} y={70} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink} opacity={pin}>ALASKA</text>
            <g opacity={cones}>{[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2;
              const lit = clamp01(cones * 6 - i);
              return <path key={i} d={`M ${-80 + 50 * Math.cos(a)},${150 + 22 * Math.sin(a)} l 10,-26 l 10,26 Z`} fill={lit > 0.5 ? C.amber : C.snowD} stroke={C.line} strokeWidth={3} />;
            })}</g>
            <g transform="translate(70 150)" opacity={drum > 0.01 ? 1 : 0}>
              <rect x={-40} y={-50} width={80} height={100} rx={16} fill={C.snow} stroke={C.line} strokeWidth={4} />
              <rect x={-36} y={46 - 92 * drum} width={72} height={92 * drum} rx={12} fill={C.white} />
              {[0, 1, 2, 3].map((i) => <circle key={i} cx={-20 + i * 14} cy={-60 - ((f * 2 + i * 20) % 50)} r={4} fill={C.white} stroke={C.snowD} strokeWidth={1.5} />)}
            </g>
            {/* the loop-one plant: a small blank counter in the post, it rolls and glows once */}
            <Odometer x={0} y={250} s={0.5} roll={odo} f={f} glow={glow} />
          </Phone>
        </g>
        <HeldTravel f={f} x={200} y={710} w={340} h={600} seed={2} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S3: Alaska and Fairbanks on a paper map, the camera cranes down to one dot ---------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [10, 11, 12];
  const drop = springy(f, b(10) - 8, 22);
  const card = easeIO(f, b(11) - 12, 24);
  const snap = springy(f, b(11) + 6, 18);
  const banner = springy(f, b(12) - 4, 26);
  const FX = 600, FY = 730;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: b(11) + 6, z: 1.0, fx: 540, fy: 960}, {t: b(12) + 10, z: 1.2, fx: 620, fy: 840}, {t: p.dur, z: 1.22, fx: 620, fy: 840}]);
  const tap = Math.max(0, Math.sin((f - b(10)) / 4)) * (f > b(10) && f < b(10) + 30 ? 1 : 0);
  return (
    <Frame p={p} mode="map" cam={cam} overlay={<>
        <Plate x={540} y={1250} text="THE POST SAYS ONLY ALASKA" size={36} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1250} text="GOVERNOR'S POST · FAIRBANKS" size={36} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1250} text={'"NO BETTER PROVING GROUND"'} size={30} tone="glow" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <g transform="translate(80 470) scale(0.92)"><path d={AK_PATH} fill={C.snow} stroke={C.line} strokeWidth={6} /><path d={AK_PATH} fill="none" stroke={C.rime} strokeWidth={14} opacity={0.5} /></g>
        <Pin x={lerp(560, FX, snap)} y={lerp(830, FY, snap)} drop={drop} s={1.1} wide={1 - snap} />
        {/* the governor's card, painted metal with a bevel */}
        <g transform={`translate(${lerp(1300, 820, card)} 1000) rotate(${lerp(10, 4, card)})`}>
          <rect x={-146} y={-94} width={300} height={200} rx={12} fill="#252B31" />
          <rect x={-150} y={-100} width={300} height={200} rx={12} fill="#5E6670" stroke={C.line} strokeWidth={6} />
          <rect x={-136} y={-86} width={272} height={172} rx={8} fill={C.white} stroke="#3A424B" strokeWidth={3} />
          <rect x={-136} y={-86} width={272} height={36} rx={8} fill={C.graphite} />
          {[0, 1, 2].map((i) => <rect key={i} x={-116} y={-34 + i * 32} width={232 - i * 40} height={12} rx={6} fill="#B9B2A6" />)}
          {[-136, 124].map((sx) => <circle key={sx} cx={sx + 6} cy={-80} r={5} fill="#9AA2AC" stroke={C.line} strokeWidth={2} />)}
        </g>
        <circle cx={FX} cy={FY} r={14 * snap} fill={C.ink} stroke={C.white} strokeWidth={4} />
        <circle cx={FX} cy={FY} r={14 + 30 * snap * (0.5 + 0.5 * Math.sin(f / 8))} fill="none" stroke={C.ink} strokeWidth={3} opacity={0.4 * snap} />
        {/* frost-rimmed cloth banner with fold shading, carrying the governor's post */}
        <g transform={`translate(${FX} ${FY - 140}) scale(${banner} 1)`} opacity={clamp01(banner * 2)}>
          <path d={`M -280,-40 Q 0,${-52 + 8 * Math.sin(f / 7)} 280,-40 L 280,40 Q 0,${28 + 8 * Math.sin(f / 7)} -280,40 Z`} fill={C.paper} stroke={C.line} strokeWidth={6} />
          {[-210, -110, 0, 110, 210].map((fx, i) => <path key={fx} d={`M ${fx},-44 Q ${fx + 18},0 ${fx},40`} stroke={i % 2 ? '#B9AF98' : '#E8E0CC'} strokeWidth={14} fill="none" opacity={0.6} />)}
          <path d="M -276,-36 l 14,12 l 12,-10 l 14,12 l 12,-10 l 14,12 l 12,-10 M 276,-36 l -14,12 l -12,-10 l -14,12 l -12,-10" stroke={C.rime} strokeWidth={5} fill="none" />
          {[-250, 250].map((cx) => <path key={cx} d={`M ${cx},28 l 4,-10 l 4,10 l -10,-6 h 12 Z`} fill={C.rime} stroke="#B9B2A6" strokeWidth={1.5} />)}
          <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} letterSpacing={1} fill={C.ink}>GOVERNOR'S POST · FAIRBANKS</text>
        </g>
        <g transform={`translate(330 1060) rotate(${-8 * tap})`}><RoofPuck x={0} y={0} f={f} scale={0.55} frost={0.75} clearRing={0.15} mode="clear" emotion="wary" look={0.8} seed={3} /></g>
        <HeldTravel f={f} x={80} y={470} w={920} h={640} seed={3} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S4: three kinds of work as three lanes under an overhead gantry -----------------------------------------------------------------------------
const HZ = 860;
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [13, 14, 15, 16, 17];
  const l1 = springy(f, b(15) - 4, 22), l2 = springy(f, b(16) - 4, 22), l3 = springy(f, b(17) - 4, 22);
  const gantry = springy(f, b(14) - 6, 24);
  const tapA = Math.max(0, Math.sin((f - b(15)) / 6)) * clamp01((f - b(15)) / 10);
  const cam = track([{t: 0, z: 1.25, fx: 540, fy: 1100}, {t: b(14), z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.04, fx: 540, fy: 960}]);
  const lit = [l1, l2, l3];
  return (
    <Frame p={p} mode="fog" cam={cam} overlay={<>
        <Plate x={540} y={800} text="QUOTED BY TV STATION" size={34} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={800} text="THREE KINDS OF WORK" size={38} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={800} text="MANUAL DATA COLLECTION" size={34} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={800} text="SPECIALIST AT THE WHEEL" size={34} tone="plate" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={800} text="LIMITED STRUCTURED TESTING" size={32} tone="plate" p={vis(f, b, K, 4)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <rect x={0} y={HZ} width={W} height={1060} fill={C.snow} />
        <Spruces y={HZ} n={12} seed={4} f={f} x0={-40} x1={1120} scale={0.75} o={0.7} />
        <path d={`M 430,${HZ} L 650,${HZ} L 1200,1700 L -120,1700 Z`} fill={C.ground} stroke={C.line} strokeWidth={4} />
        {[0, 1].map((i) => <path key={i} d={`M ${503 + i * 74},${HZ} L ${320 + i * 440},1700`} stroke={C.rime} strokeWidth={7} strokeDasharray="34 24" strokeDashoffset={-f * 3} />)}
        {[0, 1, 2].map((i) => <path key={i} d={`M ${430 + i * 74},${HZ} L ${503 + i * 74},${HZ} L ${320 + i * 440},1700 L ${-120 + i * 440},1700 Z`} fill={C.rime} opacity={0.14 * lit[i]} />)}
        {/* the overhead gantry: three lane signs that light as each lane fills */}
        <g transform={`translate(0 ${(1 - gantry) * -260})`}>
          {[70, 1010].map((gx) => <g key={gx}><rect x={gx - 16} y={470} width={32} height={HZ - 470} fill="#3A424B" stroke={C.line} strokeWidth={5} /><rect x={gx + 4} y={470} width={8} height={HZ - 470} fill="#252B31" /></g>)}
          <rect x={40} y={462} width={1000} height={36} fill="#3A424B" stroke={C.line} strokeWidth={5} />
          {[0, 1, 2].map((i) => {
            const on = lit[i];
            const cx = 220 + i * 320;
            return (
              <g key={i} transform={`translate(${cx} 590)`}>
                <rect x={-140} y={-80} width={280} height={160} rx={10} fill={on > 0.5 ? C.white : '#5E6670'} stroke={C.line} strokeWidth={6} />
                <rect x={-130} y={-70} width={260} height={140} rx={6} fill="none" stroke={on > 0.5 ? '#B9B09B' : '#4A525C'} strokeWidth={3} />
                {i === 0 && <g stroke={C.ink} strokeWidth={6} fill="none"><circle cx={-10} cy={-30} r={18} /><path d="M -10,-12 V 40 M -10,0 L 30,-10" /><rect x={28} y={-30} width={26} height={36} rx={4} /></g>}
                {i === 1 && <g stroke={C.ink} strokeWidth={8} fill="none"><circle r={44} /><path d="M -44,0 H 44 M 0,0 V 44" /></g>}
                {i === 2 && <g fill={C.ink}>{[-50, 0, 50].map((cxx) => <path key={cxx} d={`M ${cxx - 16},40 L ${cxx},-30 L ${cxx + 16},40 Z`} />)}</g>}
                <rect x={-140} y={-80} width={280} height={160} rx={10} fill={C.white} opacity={on > 0.5 ? 0.12 + 0.08 * Math.sin(f / 7) : 0} />
              </g>
            );
          })}
        </g>
        {/* lane 1: a person at the roadside with a handheld logger */}
        <g opacity={clamp01(l1 * 2)} transform={`translate(0 ${(1 - l1) * 60})`}><Person x={200} y={1040} s={0.95} f={f} seed={1.4} armUp={0.5 + 0.3 * tapA} cues={[b(15), b(15) + 20, b(15) + 40]} /></g>
        {/* lane 2: the car with the puck, a specialist's hands on the wheel */}
        <CarSil x={560} y={1230} s={0.62} f={f} roll={f / 40} />
        <RoofPuck x={560} y={1112} f={f} scale={0.6} frost={0.7} clearRing={0.2} mode="clear" emotion="alert" seed={4} />
        <g opacity={clamp01(l2 * 2)} transform="translate(560 960)"><circle r={92} fill={C.fog} stroke={C.line} strokeWidth={6} /><WheelHands x={0} y={10} s={0.6} on={l2} f={f} /></g>
        {/* lane 3: a closed course of cones */}
        <g opacity={clamp01(l3 * 2)} transform="translate(860 1180) scale(1.6)">{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${i * 30 - 70},${-(i % 2) * 30} l 12,-34 l 12,34 Z`} fill={C.amber} stroke={C.line} strokeWidth={3} transform={`rotate(${4 * Math.sin(f / 9 + i)} ${i * 30 - 58} 0)`} />)}<path d="M -80,14 q 80,-56 170,0" stroke={C.rime} strokeWidth={4} strokeDasharray="10 8" fill="none" /></g>
        <HeldTravel f={f} x={0} y={HZ} w={1080} h={640} mode="shadow" seed={4} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S5: inside the puck, the cutaway with three sensor layers and the heater ring ---------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [18, 19, 20, 21];
  const part = easeIO(f, b(18), 30);
  const layers = [0, 1, 2].map((i) => ease(f, b(19) + i * 12, 12));
  const heat = ease(f, b(20) - 4, 40);
  const open = ease(f, b(21) - 4, 14);
  const sleet = clamp01((f - b(21)) / 10);
  return (
    <Frame p={p} mode="fog" z0={1.03} z1={1.08} ox={460} oy={900} overlay={<>
        <Plate x={800} y={560} displayLines={['SIXTH-GENERATION', 'WAYMO DRIVER']} text="SIXTH-GENERATION WAYMO DRIVER" size={32} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1250} text="HEATERS · MICRO-WIPERS" size={36} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1250} text="SENSORS KEPT CLEAR" size={38} tone="dark" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <HeldProp f={f} px={420} py={840} w={700} h={420} seed={2.2} kind="rest">
          <RoofPuck x={420} y={960} f={f} scale={3.0} frost={lerp(0.7, 0.15, heat)} clearRing={lerp(0.2, 1, heat)} mode="clear" emotion={open > 0.5 ? 'relieved' : 'alert'} glow={heat} open={0.7 + 0.3 * open} seed={5} />
        </HeldProp>
        <g transform="translate(420 960) scale(1.3636) translate(-420 -1080)">
          <g opacity={part * (1 - ease(f, b(20) - 10, 20))}>
            <path d="M 140,1080 C 140,930 260,830 420,830 C 580,830 700,930 700,1080 Z" fill="#14181D" stroke={C.line} strokeWidth={7} />
            {['CAMERA', 'RADAR', 'LIDAR'].map((t, i) => (
              <g key={t} transform={`translate(420 ${1030 - i * 62})`} opacity={0.4 + 0.6 * layers[i]}>
                <rect x={-200 + i * 30} y={-24} width={400 - i * 60} height={48} rx={18} fill={layers[i] > 0.5 ? C.amber : '#3A424B'} stroke={C.line} strokeWidth={4} />
                <rect x={-190 + i * 30} y={-20} width={380 - i * 60} height={12} rx={6} fill="#FFFFFF" opacity={0.2} />
                <circle cx={-170 + i * 30} cy={0} r={10} fill={C.line} />
              </g>
            ))}
          </g>
          <g transform={`translate(${lerp(420, 980, part)} ${lerp(0, -60, part)}) rotate(${18 * part} 420 1080)`} opacity={1 - ease(f, b(20) - 10, 20)}>
            <path d="M 140,1080 C 140,930 260,830 420,830 C 580,830 700,930 700,1080 Z" transform="translate(-420 0)" fill={C.graphite} stroke={C.line} strokeWidth={7} opacity={part > 0.02 ? 1 : 0} />
          </g>
        </g>
        {Array.from({length: 14}).map((_, i) => {
          const k = ((f * 0.03 + i / 14) % 1);
          return <path key={i} d={`M ${200 + i * 32},${560 + k * 300} l 8,18`} stroke={C.white} strokeWidth={4} opacity={sleet * (1 - k)} />;
        })}
        <Lab text="CAMERAS · RADAR · LIDAR" x={420} y={1080} size={26} p={vis(f, b, K, 1)} />
        <HeldTravel f={f} x={40} y={680} w={760} h={360} seed={5} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

/** the dot road seen from the puck: returns drawn as dots receding to a white wall. `thin` 0..1 thins them, `drift` steers to the shoulder. */
const DotRoad: React.FC<{f: number; draw: number; thin?: number; drift?: number; wall?: number; far?: number; pulse?: number}> = ({f, draw, thin = 0, drift = 0, wall = 0.5, far = 720, pulse = 0}) => (
  <g>
    {/* the road surface under the returns: ruts and drift, so the lower third is a place */}
    {[-3, -1.6, -0.5, 0.5, 1.6, 3].map((k, i) => <path key={i} d={`M ${540 + k * 8},${far + 30} L ${540 + k * 190},1700`} stroke="#D9D2C8" strokeWidth={10 + Math.abs(k) * 4} opacity={0.55} />)}
    {Array.from({length: 14}).map((_, i) => <path key={`d${i}`} d={`M ${(i * 151 + f * 1.5) % 1180 - 60},${1300 + (i * 37) % 360} q 50,-14 110,0`} stroke="#D2CBC1" strokeWidth={7} fill="none" opacity={0.7} />)}
    {Array.from({length: 16}).map((_, row) => {
      const k = row / 15;
      const y = 1500 - Math.pow(k, 0.8) * (1500 - far - 40);
      const half = 420 * (1 - k * 0.85);
      return Array.from({length: 7}).map((__, i) => {
        const keep = h01(row, i) > thin * (0.3 + k);
        const show = clamp01(draw * 16 - row);
        if (!keep) return null;
        const x = 540 + drift * 220 * (1 - k) + (i - 3) / 3 * half;
        const wave = pulse * Math.max(0, 1 - Math.abs(((f / 2.2) % 22) - row) / 2.5);
        return <circle key={`${row}-${i}`} cx={x} cy={y} r={(10 - 7 * k) * (0.85 + 0.15 * Math.sin(f / 6 + row) + 0.9 * wave)} fill={C.amber} opacity={show * Math.min(1, (1 - k * 0.6) + wave)} />;
      });
    })}
    <rect x={0} y={far - 80} width={W} height={130} fill={C.hud} opacity={wall} />
    <path d={`M 0,${far} H 1080`} stroke="#CFCAC2" strokeWidth={4} strokeDasharray="18 14" opacity={wall} />
  </g>
);

const Hood: React.FC<{f: number; hazard?: number; leaves?: number}> = ({f, hazard = 0, leaves = 0}) => {
  const strobe = hazard > 0.01 && Math.floor(f / 9) % 2 === 0 ? hazard : 0;
  return (
    <g>
      <path d="M -40,1700 Q 540,1540 1120,1700 L 1120,1920 L -40,1920 Z" fill={C.graphite} stroke={C.line} strokeWidth={8} />
      <path d="M 80,1680 Q 540,1570 1000,1680" stroke="#3A424B" strokeWidth={6} fill="none" />
      {strobe > 0 && [60, 1020].map((hx) => <circle key={hx} cx={hx} cy={1660} r={46} fill={C.strobe} opacity={0.7 * strobe} />)}
      {Array.from({length: Math.round(leaves * 14)}).map((_, i) => (
        <g key={i} transform={`translate(${300 + (i % 7) * 70 + 10 * Math.sin(i)} ${1640 - Math.floor(i / 7) * 16}) rotate(${-8 + (i * 37) % 16})`}>
          <rect x={-30} y={-22} width={60} height={44} rx={4} fill={C.paper} stroke={C.line} strokeWidth={3} />
          <rect x={-30} y={-22} width={60} height={10} rx={3} fill={C.graphite} />
        </g>
      ))}
    </g>
  );
};

/** a small inset of the puck itself in the HUD corner, so its state stays on screen in the first-person shots. */
const PuckInset: React.FC<{f: number; frost: number; mode: PuckMode; emo: PuckEmotion; seed: number}> = ({f, frost, mode, emo, seed}) => (
  <g transform="translate(880 1150)">
    <circle r={124} fill="#2A2F36" opacity={0.18} />
    <circle r={124} fill="none" stroke="#8C867E" strokeWidth={4} />
    <RoofPuck x={0} y={60} f={f} scale={0.62} frost={frost} clearRing={1 - frost} mode={mode} emotion={emo} rimGlow={0.5} seed={seed} />
  </g>
);

// ---- S6: the puck's own view, the whiteout and the returns that draw the road ----------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [22, 23];
  const white = ease(f, b(22), 12);
  const draw = easeIO(f, b(23) - 4, 40);
  const ring = clamp01((f - b(23)) / 20);
  const creep = easeIO(f, 0, p.dur);
  return (
    <Frame p={p} mode="white" z0={1.0} z1={1.03} vignette={0.12} overlay={<>
        <Plate x={540} y={1250} text="CAMERAS IN A WHITEOUT" size={38} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1250} displayLines={['ONE SENSOR BLIND ·', 'ANOTHER BACKS IT UP']} text="ONE SENSOR BLIND · ANOTHER BACKS IT UP" size={34} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <rect x={0} y={0} width={W} height={H} fill="#BDB8B2" opacity={1 - white} />
        <DotRoad f={f} draw={draw} wall={0.7} far={720} pulse={ring} />
        {Array.from({length: 26}).map((_, i) => <path key={i} d={`M ${(i * 173 + f * 22) % 1500 - 300},${440 + (i * 97) % 1200} l 260,46`} stroke="#FFFFFF" strokeWidth={8 + (i % 3) * 4} opacity={0.6} strokeLinecap="round" />)}
        {[0, 1, 2].map((i) => {
          const k = ((f / 36 + i / 3) % 1);
          return <ellipse key={i} cx={540} cy={1500} rx={120 + 600 * k} ry={40 + 200 * k} fill="none" stroke={C.amber} strokeWidth={6 - 4 * k} opacity={ring * (1 - k)} />;
        })}
        <Flakes f={f} n={60} speed={2.2} o={0.8} y0={420} y1={1700} />
        <Hood f={f} />
        <g opacity={0.9}><path d="M 70,470 h 60 M 70,470 v 60 M 1010,470 h -60 M 1010,470 v 60" stroke="#8C867E" strokeWidth={5} /></g>
        <PuckInset f={f} frost={lerp(0.3, 0.5, creep)} mode={ring > 0.05 ? 'backup' : 'blind'} emo="determined" seed={6} />
        <HeldTravel f={f} x={0} y={720} w={1080} h={780} seed={6} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S7: under each wheel, then the simulated glass road ---------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [25, 27];
  const drop = easeIO(f, b(25) - 10, 26);
  const g = [0, 1, 2, 3].map((i) => springy(f, b(25) + 20 + i * 10, 18));
  const pour = easeIO(f, b(27) - 4, 50);
  return (
    <Frame p={p} mode="under" z0={1.03} z1={1.08} oy={960} overlay={<>
        <Plate x={540} y={760} text="TRACTION · EACH WHEEL" size={38} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={760} text="SIMULATED BLACK ICE" size={38} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        {/* the underside: chassis, axles and exhaust, lit from the snow below */}
        <g transform={`translate(0 ${lerp(-200, 0, drop)})`}>
          <rect x={-20} y={300} width={1120} height={250} fill={C.graphite} stroke={C.line} strokeWidth={6} />
          <rect x={-20} y={520} width={1120} height={30} fill="#3A424B" />
          {[160, 400, 680, 920].map((ax) => <rect key={ax} x={ax - 20} y={420} width={40} height={160} fill="#3A424B" stroke={C.line} strokeWidth={4} />)}
          <rect x={100} y={470} width={880} height={26} rx={12} fill="#4A525C" stroke={C.line} strokeWidth={4} />
          <rect x={380} y={360} width={320} height={70} rx={14} fill="#252B31" stroke={C.line} strokeWidth={4} />
          {Array.from({length: 8}).map((_, i) => <circle key={i} cx={420 + i * 36} cy={395} r={6} fill="#5E6670" />)}
        </g>
        {[160, 400, 680, 920].map((wx, i) => (
          <g key={wx}>
            <g transform={`translate(${wx} 900) rotate(${f * 2 + i * 20})`}><circle r={86} fill="#0B0E10" stroke={C.line} strokeWidth={8} /><circle r={36} fill="#3A424B" /><path d="M -30,0 H 30 M 0,-30 V 30" stroke="#12161A" strokeWidth={6} /></g>
            <ellipse cx={wx} cy={990} rx={100} ry={14} fill="#000" opacity={0.4} />
            <path d={`M ${wx - 120},986 l 30,-8 l 26,12 l 40,-14 l 30,10 l 30,-6`} stroke={C.rime} strokeWidth={4} fill="none" />
            <g transform={`translate(${wx} ${620 + (1 - g[i]) * 40}) scale(${g[i]})`} opacity={clamp01(g[i] * 2)}>
              <circle r={66} fill="#252B31" />
              <circle r={62} fill={C.paper} stroke={C.line} strokeWidth={6} />
              <path d="M -46,10 A 48,48 0 0 1 46,10" stroke={C.snowD} strokeWidth={6} fill="none" />
              <line x1={0} y1={10} x2={44 * Math.cos(-Math.PI / 2 + 0.6 * Math.sin(f / 9 + i))} y2={10 + 44 * Math.sin(-Math.PI / 2 + 0.6 * Math.sin(f / 9 + i))} stroke={C.amber} strokeWidth={7} strokeLinecap="round" />
              <circle cy={10} r={7} fill={C.line} />
              <path d="M -40,-36 A 54,54 0 0 1 30,-46" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.5} />
            </g>
          </g>
        ))}
        <g opacity={clamp01(pour * 3)}>
          <rect x={190} y={1070} width={700} height={170} rx={8} fill="#1E242A" stroke={C.rime} strokeWidth={4} strokeDasharray="12 8" />
          {Array.from({length: 13}).map((_, i) => <path key={i} d={`M ${190 + i * 58},1070 V 1240`} stroke="#3A424B" strokeWidth={2} />)}
          <rect x={200} y={1230 - 150 * pour} width={680} height={150 * pour} fill="#7F8E9A" opacity={0.55} />
          <path d={`M 200,${1230 - 150 * pour} Q 540,${1220 - 150 * pour + 10 * Math.sin(f / 6)} 880,${1230 - 150 * pour}`} stroke={C.white} strokeWidth={4} fill="none" opacity={0.7} />
          <Lab text="SIMULATION" x={790} y={1100} size={20} tone="dark" p={pour} />
        </g>
        <g transform="translate(110 1200)"><RoofPuck x={0} y={0} f={f} scale={0.42} frost={0.1} clearRing={1} mode="wheel" emotion="alert" look={0.6} rimGlow={0.4} seed={7} /></g>
        <HeldTravel f={f} x={100} y={560} w={880} h={130} seed={7} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S8: the weather station, then the pullback to an abstract snow field of pings ----------------------------------------------------------------
const PINGS = Array.from({length: 46}).map((_, i) => ({x: 90 + h01(i, 3) * 900, y: 480 + h01(i, 7) * 820, far: h01(i, 9) > 0.55}));
const PATCH = {x: 300, y: 1060, r: 130};
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [28, 29, 30];
  const vane = springy(f, b(28) - 4, 22);
  const pull = easeIO(f, b(29) - 6, 70);
  const tick = clamp01((f - b(30)) / 45);
  const PX = 640, PY = 900;
  const cam = track([{t: 0, z: 2.8, fx: PX, fy: PY + 120}, {t: b(29) - 6, z: 2.8, fx: PX, fy: PY + 110}, {t: b(29) + 64, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.03, fx: 540, fy: 960}]);
  const dark = ease(f, b(30) - 6, 20);
  const near = 26 * pull;
  return (
    <Frame p={p} mode="field" cam={cam} warmth={0.05}
      overlay={<>
        <Plate x={540} y={1250} text="MOBILE WEATHER STATION" size={34} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1250} displayLines={['SHARED ACROSS THE FLEET ·', 'ILLUSTRATIVE']} text="SHARED ACROSS THE FLEET · ILLUSTRATIVE" size={32} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={560} y={600} displayLines={['WAYMO SAYS · TENS OF', 'THOUSANDS OF MILES ·', 'SNOWY REGIONS ELSEWHERE']} text="WAYMO SAYS · TENS OF THOUSANDS OF MILES · SNOWY REGIONS ELSEWHERE" size={30} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        {/* far layer of the field: smaller, fainter pings with slow parallax */}
        <g transform={`translate(${-20 * pull} ${-10 * pull})`} opacity={0.55}>
          {PINGS.filter((q) => q.far).map((q, i) => {
            const k = ((f / 60 + h01(i, 2)) % 1);
            return <g key={i} opacity={clamp01(pull * 3 - h01(i, 5) * 2)}><circle cx={q.x} cy={q.y} r={4} fill={C.amber} /><circle cx={q.x} cy={q.y} r={6 + 24 * k} fill="none" stroke={C.amber} strokeWidth={2} opacity={1 - k} /></g>;
          })}
        </g>
        <circle cx={PATCH.x} cy={PATCH.y} r={PATCH.r} fill={C.ground} opacity={0.85 * dark} />
        <g opacity={dark}><Pin x={PATCH.x} y={PATCH.y + 20} drop={1} s={0.8} /></g>
        <g transform={`translate(${near} ${near * 0.5})`}>{PINGS.filter((q) => !q.far).map((q, i) => {
          if (dark > 0.3 && Math.hypot(q.x - PATCH.x, q.y - PATCH.y) < PATCH.r + 20) return null;
          const k = ((f / 50 + h01(i, 1)) % 1);
          const on = clamp01(pull * 3 - h01(i, 5) * 2);
          return (
            <g key={i} opacity={on}>
              <circle cx={q.x} cy={q.y + 6} r={9} fill={C.line} opacity={0.25} />
              <circle cx={q.x} cy={q.y} r={9} fill={C.amber} stroke={C.line} strokeWidth={2} />
              <circle cx={q.x} cy={q.y} r={12 + 46 * k} fill="none" stroke={C.amber} strokeWidth={3} opacity={1 - k} />
            </g>
          );
        })}</g>
        <defs><radialGradient id="pvig" cx={PATCH.x / 1080} cy={PATCH.y / 1920} r="0.75"><stop offset="0.18" stopColor={C.line} stopOpacity={0} /><stop offset="1" stopColor={C.line} stopOpacity={0.45} /></radialGradient></defs>
        <rect x={0} y={0} width={1080} height={1330} fill="url(#pvig)" opacity={dark} />
        <g opacity={tick > 0 ? 1 : 0}>
          {[[640, 1100], [760, 1040], [880, 1100], [700, 1180], [820, 1220]].map(([mx, my], i) => (
            <g key={i} transform={`translate(${mx} ${my}) scale(${clamp01(tick * 5 - i)})`}><path d="M 0,-16 L 4,-4 L 16,0 L 4,4 L 0,16 L -4,4 L -16,0 L -4,-4 Z" fill={C.white} stroke={C.line} strokeWidth={3} /></g>
          ))}
          <Lab text="ILLUSTRATIVE" x={780} y={980} size={18} tone="dark" p={tick} />
        </g>
        <g transform={`translate(${PX} ${PY})`}>
          <ellipse cx={0} cy={90} rx={130} ry={40} fill={C.sun} opacity={0.35 * (1 - pull)} />
          <CarSil x={0} y={180} s={0.32} f={f} />
          <RoofPuck x={0} y={124} f={f} scale={0.32} frost={0} clearRing={1} mode="clear" emotion="chatty" glow={0.3} seed={8} />
          <g transform={`translate(26 ${82 - 30 * vane}) scale(${vane})`}><path d="M 0,0 V -40" stroke={C.line} strokeWidth={3} /><g transform={`rotate(${f * 6} 0 -40)`}><path d="M -14,-40 H 14 M 0,-54 V -26" stroke={C.line} strokeWidth={3} /></g></g>
          <g transform={`translate(-26 ${82 - 26 * vane}) scale(${vane})`}><rect x={-4} y={-34} width={8} height={30} rx={4} fill={C.white} stroke={C.line} strokeWidth={2} /><circle cy={-4} r={6} fill={C.amber} stroke={C.line} strokeWidth={2} /></g>
          {[0, 1].map((i) => { const k = ((f / 30 + i / 2) % 1); return <circle key={i} cx={0} cy={60} r={20 + 70 * k} fill="none" stroke={C.amber} strokeWidth={3} opacity={vane * (1 - k)} />; })}
        </g>
        <Flakes f={f} n={30} speed={0.8} o={0.6} y0={420} y1={1500} />
        <HeldTravel f={f} x={60} y={460} w={960} h={860} mode="shadow" seed={8} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S9: the design folds to paper on the dark patch, then a gust frosts the eye rim ----------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [32, 33];
  const fold = easeIO(f, b(32) - 6, 24);
  const gust = easeIO(f, b(33) - 4, 30);
  return (
    <Frame p={p} mode="fog" z0={1.02} z1={1.06} oy={940} overlay={<>
        <Plate x={400} y={1250} text="AN ANSWER ON PAPER" size={38} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1250} text="HOLD THAT THOUGHT" size={38} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <Spruces y={1062} n={8} seed={9} f={f + gust * 40} x0={-40} x1={1120} scale={1.25} o={0.7} />
        <Powerline f={f + gust * 60} xs={[140, 620]} top={480} />
        <path d="M 0,1150 Q 540,1110 1080,1150 L 1080,1920 L 0,1920 Z" fill={C.snow} />
        <ellipse cx={360} cy={1180} rx={250} ry={70} fill={C.ground} />
        <g transform={`translate(360 ${lerp(700, 1150, fold)}) rotate(${lerp(-6, 2, fold)}) scale(${lerp(1.3, 1, fold)} ${lerp(1.3, 0.45, fold)})`}>
          <rect x={-170} y={-120} width={340} height={240} rx={6} fill={C.paper} stroke={C.line} strokeWidth={6} />
          <path d="M 0,-120 V 120" stroke="#B9AF98" strokeWidth={6} opacity={0.7} />
          <rect x={0} y={-120} width={170} height={240} fill="#000" opacity={0.06} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-140} y={-90 + i * 36} width={280 - (i % 2) * 70} height={12} rx={6} fill="#B9B2A6" />)}
          <path d={`M 170,-120 l -40,0 l 40,40 Z`} fill={C.rime} stroke={C.line} strokeWidth={3} transform={`rotate(${8 * Math.sin(f / 7)} 170 -120)`} />
        </g>
        {Array.from({length: 22}).map((_, i) => {
          const k = clamp01(gust * 1.6 - i / 30);
          return <path key={i} d={`M ${lerp(-100, 1180, k)},${600 + (i * 41) % 500} l 90,8`} stroke={C.white} strokeWidth={5} opacity={Math.sin(Math.PI * k) * 0.7} />;
        })}
        <CarSil x={800} y={1062} s={1.35} f={f} />
        <HeldProp f={f} px={780} py={740} w={420} h={300} seed={3.3} kind="rest">
          <RoofPuck x={780} y={820} f={f} scale={1.6} frost={lerp(0, 0.3, gust)} clearRing={lerp(1, 0.75, gust)} mode="clear" emotion={gust > 0.4 ? 'wary' : 'relieved'} glow={0.2} open={1 - 0.3 * gust} seed={10} />
        </HeldProp>
        <HeldTravel f={f} x={190} y={1050} w={340} h={200} seed={9} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the test, three roadside billboards and the skeptic's thought-frame ----------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const up1 = springy(f, b(34) - 6, 26);
  const frame = springy(f, b(35) - 4, 16);
  const tail = clamp01(1 - Math.abs(f - b(35) - 6) / 8);
  const up2 = springy(f, b(36) - 6, 18);
  const up3 = springy(f, b(37) - 8, 26);
  const cam = track([{t: 0, z: 1.12, fx: 330, fy: 960}, {t: b(36) - 6, z: 1.12, fx: 380, fy: 960}, {t: b(37), z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.03, fx: 560, fy: 960}]);
  return (
    <Frame p={p} mode="fog" cam={cam} overlay={<>
        <Plate x={540} y={1260} text="ONE RESIDENT EXPECTS" size={34} tone="dark" p={ease(f, b(34), 12) * (1 - ease(f, b(35) - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1260} text={'"STALL OUT" · WHAT IF'} size={34} tone="warn" p={ease(f, b(35), 10) * (1 - ease(f, b(36) - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1260} text={'"SHOULDN\'T BE ALLOWED"'} size={30} tone="dark" p={ease(f, b(36), 10) * (1 - ease(f, b(37) - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <Spruces y={1062} n={12} seed={11} f={f} x0={-40} x1={1120} scale={0.9} o={0.55} />
        <Powerline f={f} xs={[300, 960]} top={450} base={900} />
        <path d="M -20,860 Q 300,800 540,820 T 1100,850 L 1100,1062 L -20,1062 Z" fill={C.snow} stroke={C.snowD} strokeWidth={3} />
        <path d="M 0,1300 L 1080,1240 L 1080,1400 L 0,1460 Z" fill={C.ground} />
        <Billboard x={540} y={780} up={up3} f={f} w={400} h={200} post={60} />
        <text x={540} y={640 + rise(up3, 200)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={2} fill={C.ink} opacity={up3 > 0.02 ? 1 : 0}>THE MAYOR</text>
        <text x={540} y={690 + rise(up3, 200)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={C.ink} opacity={up3 > 0.02 ? 1 : 0}>"A GREAT</text>
        <text x={540} y={730 + rise(up3, 200)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={C.ink} opacity={up3 > 0.02 ? 1 : 0}>OPPORTUNITY"</text>
        <Billboard x={270} y={1170} up={up1} f={f} w={420} h={300} post={170}>
          <g transform={`scale(${frame})`} opacity={clamp01(frame * 2)}>
            <rect x={-180} y={-80} width={360} height={150} rx={60} fill={C.fog} stroke={C.ink} strokeWidth={5} strokeDasharray="16 10" />
            <path d="M -160,48 L 160,32" stroke={C.ground} strokeWidth={26} />
            <CarSil x={-10} y={40} s={0.34} f={f} tail={tail} hazard={frame > 0.5 ? 0.6 : 0} />
          </g>
        </Billboard>
        <text x={270} y={900 + rise(up1, 300)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={2} fill={C.ink} opacity={up1 > 0.02 ? 1 : 0}>WHAT IF</text>
        <text x={270} y={1150 + rise(up1, 300)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} fill={C.ink} opacity={frame > 0.3 ? 1 : 0}>"STALL OUT"</text>
        <Billboard x={810} y={1170} up={up2} f={f} w={380} h={230} post={170} />
        <text x={790} y={1045 + rise(up2, 230)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={C.ink} opacity={up2 > 0.02 ? 1 : 0}>"SHOULDN'T BE</text>
        <text x={790} y={1085 + rise(up2, 230)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={C.ink} opacity={up2 > 0.02 ? 1 : 0}>ALLOWED"</text>
        <g transform="translate(990 1300)"><RoofPuck x={0} y={0} f={f} scale={0.42} frost={0.5} clearRing={0.5} mode="clear" emotion="tense" look={-0.8} rimGlow={0.6} seed={11} /></g>
        <HeldTravel f={f} x={60} y={580} w={960} h={600} seed={10} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

/** a skyline glimpse modelled as lit buildings with side faces and windows (generic, not Fairbanks). */
const Skyline: React.FC<{y: number; f: number}> = ({y, f}) => (
  <g>
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const x = 130 + i * 106, h = 90 + h01(i, 4) * 170, w = 74;
      return (
        <g key={i}>
          <rect x={x + w} y={y - h + 10} width={22} height={h - 10} fill="#9C958D" />
          <rect x={x} y={y - h} width={w} height={h} fill="#B9B2A9" stroke="#8C867E" strokeWidth={3} />
          <path d={`M ${x},${y - h} l 22,10 h ${w} l -22,-10 Z`} fill="#CFC8BF" />
          {Array.from({length: Math.floor(h / 30)}).map((_, r) => [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={x + 10 + c * 22} y={y - h + 14 + r * 30} width={12} height={14} fill={h01(i * 7 + r, c) > 0.6 ? '#E9D9B8' : '#A39C93'} opacity={0.9} />))}
        </g>
      );
    })}
  </g>
);

// ---- S11: when winter wins, back in the puck's view, the gauge crosses its limit and the car pulls over --------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [39, 41];
  const needle = easeIO(f, b(39) + 6, 60);
  const thin = easeIO(f, b(41) - 4, 40);
  const pull = easeIO(f, b(41), 50);
  const leaves = easeIO(f, b(41) + 20, 60);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: b(41), z: 1.08, fx: 560, fy: 1000}, {t: b(41) + 50, z: 1.1, fx: 600, fy: 1010}, {t: p.dur, z: 1.1, fx: 600, fy: 1010}]);
  const ang = lerp(-60, 50, needle);
  return (
    <Frame p={p} mode="white" cam={cam} vignette={0.12} overlay={<>
        <Plate x={540} y={1240} displayLines={['WEATHER BEYOND VALIDATED ·', 'VALIDATED LIMIT']} text="WEATHER BEYOND VALIDATED · VALIDATED LIMIT" size={32} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1220} displayLines={['ITS OWN POST', 'IN ITS CITIES', 'PAUSE FOR HOURS OR DAYS']} text="ITS OWN POST · IN ITS CITIES · PAUSE FOR HOURS OR DAYS" size={30} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <g opacity={0.8}><Skyline y={700} f={f} /></g>
        <DotRoad f={f} draw={1} thin={thin} drift={pull} wall={0.5 + 0.3 * thin} far={720} />
        {[0, 1, 2].map((i) => {
          const k = ((f / 36 + i / 3) % 1);
          const sz = 1 - 0.7 * thin;
          return <ellipse key={i} cx={540} cy={1500} rx={(120 + 600 * k) * sz} ry={(40 + 200 * k) * sz} fill="none" stroke={C.amber} strokeWidth={6 - 4 * k} opacity={(1 - k) * (1 - 0.5 * thin)} />;
        })}
        <Flakes f={f} n={50} speed={2} o={0.7} y0={420} y1={1700} />
        <Hood f={f} hazard={pull > 0.6 ? 0.7 : 0} leaves={leaves} />
        <Lab text="CITY SERVICE" x={540} y={490} size={22} tone="dark" p={1} />
        {/* the VALIDATED LIMIT gauge, a lit instrument with a bezel and depth */}
        <g transform="translate(880 900)">
          <circle cx={10} cy={14} r={112} fill="#000" opacity={0.25} />
          <circle r={112} fill="#3A424B" stroke={C.line} strokeWidth={6} />
          <circle r={96} fill={C.paper} stroke={C.line} strokeWidth={4} />
          <path d="M -78,28 A 84,84 0 0 1 78,28" stroke={C.snowD} strokeWidth={10} fill="none" />
          <path d={`M ${84 * Math.sin(Math.PI * 0.2)},${-84 * Math.cos(Math.PI * 0.2)} A 84,84 0 0 1 78,28`} stroke={C.amber} strokeWidth={10} fill="none" opacity={0.5} />
          <line x1={0} y1={0} x2={90 * Math.sin(Math.PI * 0.2)} y2={-90 * Math.cos(Math.PI * 0.2)} stroke={C.ink} strokeWidth={5} strokeDasharray="10 8" />
          <line x1={0} y1={10} x2={76 * Math.sin(ang * Math.PI / 180)} y2={10 - 76 * Math.cos(ang * Math.PI / 180)} stroke={C.amber} strokeWidth={8} strokeLinecap="round" />
          <circle cy={10} r={10} fill={C.line} />
          <path d="M -70,-50 A 86,86 0 0 1 20,-84" stroke="#FFFFFF" strokeWidth={8} fill="none" opacity={0.45} />
        </g>
        <Lab text="VALIDATED LIMIT" x={880} y={760} size={20} tone="plate" p={1} />
        <PuckInset f={f} frost={lerp(0.5, 0.75, thin)} mode={thin > 0.6 ? 'blind' : 'backup'} emo="flat" seed={13} />
        <HeldTravel f={f} x={0} y={720} w={1080} h={780} seed={11} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S12: locked overhead on the dashboard clipboard, no count, no dates, a pen that does not write ------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const frost = easeIO(f, b(42), 40);
  const flipAway = easeIO(f, b(42) + 44, 16);
  const roll = clamp01((f - b(42) - 50) / 40);
  const calFlip = ease(f, b(42) + 56, 16);
  const thump = springy(f, b(44) - 4, 16);
  const typed = clamp01((f - b(45)) / 50);
  const lower = easeIO(f, b(45) + 10, 40);
  const lift = easeIO(f, b(46) + 10, 30);
  const penY = lerp(lerp(760, 1080, lower), 800, lift);
  const q = 'DRIVERLESS CARS PLANNED?';
  const s1 = b(42) + 48;
  return (
    <Frame p={p} mode="cab" z0={1.0} z1={1.0} overlay={<>
        <Plate x={540} y={560} text="IS PAPER ENOUGH?" size={40} tone="dark" p={ease(f, b(42), 12) * (1 - ease(f, s1 - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={560} text="NO COUNT · NO DATES" size={44} tone="glow" p={ease(f, s1, 12) * (1 - ease(f, b(45) - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={560} text="A REPORTER ASKED · DRIVERLESS?" size={32} tone="plate" p={ease(f, b(45), 12) * (1 - ease(f, b(46) - 8, 6))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={560} text="NOT YET ANSWERED" size={40} tone="dark" p={f >= b(46) ? 1 : 0} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        {/* the windshield above the dash: fog daylight and the road ahead */}
        <rect x={0} y={300} width={W} height={360} fill={C.fog} />
        <circle cx={820} cy={430} r={70} fill={C.sun} opacity={0.6} />
        <path d="M 470,660 L 610,660 L 760,500 L 560,440 Z" fill={C.ground} opacity={0.5} />
        <path d="M 0,520 Q 300,480 540,500 T 1080,520 L 1080,660 L 0,660 Z" fill={C.snow} opacity={0.8} />
        {[0, 1].map((i) => <path key={i} d={`M ${200 + i * 420},650 l 260,-40`} stroke={C.line} strokeWidth={10} strokeLinecap="round" />)}
        <path d="M 0,640 Q 540,600 1080,640 L 1080,720 L 0,720 Z" fill="#20252B" stroke={C.line} strokeWidth={6} />
        <g transform={`translate(500 ${1010 - 8 * Math.sin(Math.PI * thump)})`}>
          <rect x={-330} y={-300} width={660} height={610} rx={20} fill={C.woodD} stroke={C.line} strokeWidth={8} />
          <rect x={-300} y={-270} width={600} height={560} rx={6} fill={C.white} stroke={C.line} strokeWidth={4} />
          <rect x={-90} y={-322} width={180} height={46} rx={10} fill={C.graphite} stroke={C.line} strokeWidth={5} />
          <Odometer x={-140} y={-150} s={0.9} roll={roll} f={f} />
          <BlankCalendar x={150} y={-130} s={0.75} flip={calFlip} f={f} />
          <rect x={-260} y={60} width={520} height={74} rx={6} fill="none" stroke={C.snowD} strokeWidth={4} />
          <text x={-244} y={110} fontFamily={MONO} fontWeight={800} fontSize={28} fill={C.ink}>{q.slice(0, Math.round(typed * q.length))}</text>
          <path d="M -260,230 H 260" stroke={C.snowD} strokeWidth={4} />
          <g transform={`scale(1 ${Math.max(0.02, 1 - flipAway)})`} opacity={flipAway > 0.97 ? 0 : 1}>
            <rect x={-290} y={-262} width={580} height={540} rx={6} fill={C.paper} stroke={C.line} strokeWidth={5} />
            <path d="M 0,-262 V 278" stroke="#B9AF98" strokeWidth={6} opacity={0.6} />
            {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-250} y={-220 + i * 60} width={500 - (i % 2) * 120} height={16} rx={8} fill="#B9B2A6" />)}
            <rect x={-290} y={-262} width={580 * frost} height={540} fill={C.rime} opacity={0.92} />
            {Array.from({length: 10}).map((_, i) => <path key={i} d={`M ${-290 + 580 * frost},${-250 + i * 52} l -18,14 l 14,8 l -10,12`} stroke="#B9B2A6" strokeWidth={3} fill="none" opacity={frost > 0.05 && frost < 0.98 ? 1 : 0} />)}
          </g>
        </g>
        <Lab text="HOW MANY CARS?" x={360} y={790} size={22} tone="plate" p={ease(f, b(43), 10)} />
        <g transform={`translate(660 ${penY}) rotate(28)`}>
          <rect x={-10} y={-170} width={20} height={170} rx={6} fill={C.graphite} stroke={C.line} strokeWidth={4} />
          <path d="M -10,0 L 0,26 L 10,0 Z" fill={C.ink} />
          <rect x={-22} y={-300} width={44} height={160} rx={20} fill="#1E242A" stroke={C.line} strokeWidth={5} />
        </g>
        <HeldTravel f={f} x={170} y={710} w={660} h={610} seed={12} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S13: the button, one cold lamp, the half-frosted puck, the crane up to one small car mirrored in black ice -------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [47, 48, 49];
  const creep = easeIO(f, b(48) - 4, 60);
  const rise2 = easeIO(f, b(49) - 4, 90);
  const CX = 330, CY = 1260;
  const cam = track([{t: 0, z: 3.0, fx: CX, fy: CY + 10}, {t: b(49) - 34, z: 3.0, fx: CX, fy: CY + 20}, {t: b(49) + 56, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} mode="night" cam={cam} vignette={0.4}
      overlay={<>
        <Plate x={540} y={1230} text="WAYMO'S POST IS A CLAIM" size={36} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1230} text="THIS WINTER IS THE TEST" size={38} tone="glow" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={760} displayLines={['WHAT WOULD YOU', 'WANT PROVEN?']} text="WHAT WOULD YOU WANT PROVEN?" size={44} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        <path d="M 0,1150 L 1080,1050 L 1080,1500 L 0,1700 Z" fill="#12161A" />
        <path d="M 0,1400 L 1080,1270" stroke="#2A2F36" strokeWidth={6} strokeDasharray="40 30" />
        <rect x={CX + 120} y={560} width={14} height={760} fill="#20252B" />
        <path d={`M ${CX + 127},570 h -70`} stroke="#20252B" strokeWidth={12} />
        <rect x={CX + 30} y={562} width={56} height={18} rx={6} fill={C.led} />
        <path d={`M ${CX + 40},580 L ${CX - 220},${CY + 40} L ${CX + 320},${CY + 40} L ${CX + 76},580 Z`} fill={C.led} opacity={0.1} />
        <ellipse cx={CX + 50} cy={CY + 30} rx={280} ry={64} fill={C.led} opacity={0.16} />
        <g opacity={0.35} transform={`translate(${CX} ${CY + 30}) scale(1 -0.55)`}><CarSil x={0} y={0} s={0.5} f={f} /><RoofPuck x={0} y={-98} f={f} scale={0.3} frost={0.5} clearRing={0.5} mode="clear" emotion="pensive" glow={0.4} seed={12} /></g>
        <CarSil x={CX} y={CY + 30} s={0.5} f={f} />
        <RoofPuck x={CX} y={CY - 68} f={f} scale={0.3} frost={lerp(0.5, 0.7, creep)} clearRing={lerp(0.5, 0.35, creep)} mode="clear" emotion={creep > 0.5 ? 'tense' : 'pensive'} glow={0.5} rimGlow={1} look={rise2 > 0.3 ? 0 : 0.6} seed={12} />
        <g opacity={0.55}><Powerline f={f} xs={[80, 1000]} top={470} base={1150} /></g>
        <Flakes f={f} n={70} speed={0.6} o={0.6} />
        <HeldTravel f={f} x={180} y={1150} w={300} h={160} seed={13} strength={0.2} rx={20} color={C.led} />
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

export const ep1111Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1111Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1111: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 8.66, 18.42, 27.56, 42.12, 54.2, 61.14, 68.94, 82.34, 87.0, 97.56, 106.62, 120.46, 131.1].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.fog}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#12161A" ink="#E8E1D2" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
