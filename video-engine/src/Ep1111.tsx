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
        <rect width={W} height={H} fill="#BDB4AA" />
        <rect x={120} y={360} width={840} height={620} rx={10} fill={C.fog} stroke={C.line} strokeWidth={10} />
        <rect x={120} y={360} width={840} height={620} rx={10} fill={C.cream} opacity={0.35} />
        <path d="M 540,360 V 980 M 120,670 H 960" stroke={C.line} strokeWidth={8} />
        <circle cx={760} cy={520} r={90} fill={C.sun} opacity={0.55} />
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
        <rect width={W} height={H} fill={C.hud} />
        {Array.from({length: 30}).map((_, i) => <path key={i} d={`M ${(i * 137 + f * 9) % 1300 - 100},${300 + (i * 61) % 1300} l 120,18`} stroke="#E4E0DA" strokeWidth={6} opacity={0.8} />)}
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
      <circle cx={820} cy={860} r={230} fill="url(#fogsun)" />
      <circle cx={820} cy={860} r={56} fill="#F1CDB8" opacity={0.9} />
      {[0, 1, 2].map((i) => <rect key={i} x={-200 + ((f * (0.6 + i * 0.3) + i * 400) % 1500)} y={780 + i * 70} width={700} height={60} rx={30} fill="#E9E4E1" opacity={0.35} />)}
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

const rise = (up: number, h: number) => (1 - clamp01(up)) * (h + 220);
/** a roadside billboard on two posts; `up` 0..1 rolls it up out of the snowbank. Its lamp is paper-white. */
const Billboard: React.FC<{x: number; y: number; w?: number; h?: number; up: number; f: number; children?: React.ReactNode; shake?: number}> = ({x, y, w = 420, h = 260, up, f, children, shake = 0}) => {
  const k = clamp01(up);
  const rs = rise(k, h);
  return (
    <g transform={`translate(${x + shake * 4 * Math.sin(f * 1.3)} ${y + rs})`} opacity={k > 0.01 ? 1 : 0}>
      {[-w * 0.3, w * 0.3].map((px) => <rect key={px} x={px - 9} y={0} width={18} height={220} fill="#3A424B" stroke={C.line} strokeWidth={4} />)}
      <rect x={-w / 2 - 6} y={-h + 6} width={w} height={h} fill="#000" opacity={0.25} />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill={C.paper} stroke={C.line} strokeWidth={7} />
      <path d={`M ${-w / 2 + 14},${-h + 14} h ${w - 28}`} stroke={C.rime} strokeWidth={6} opacity={0.8} />
      <g transform={`translate(0 ${-h - 22})`}><rect x={-60} y={-8} width={120} height={14} rx={6} fill={C.white} stroke={C.line} strokeWidth={3} /><path d={`M -60,6 L ${-w / 2},${h * 0.5} L ${w / 2},${h * 0.5} L 60,6 Z`} fill={C.white} opacity={0.12} /></g>
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

// ---- bands: the puck tracker on top, six numbered states of the throughline -------------------------------------------------------------------
const PS: Array<{frost: number; cr: number; mode: PuckMode; emo: PuckEmotion; glow: number}> = [
  {frost: 1, cr: 0, mode: 'blind', emo: 'sleepy', glow: 0}, {frost: 0.7, cr: 0.2, mode: 'clear', emo: 'alert', glow: 0}, {frost: 0.15, cr: 1, mode: 'clear', emo: 'relieved', glow: 1},
  {frost: 0.3, cr: 0.6, mode: 'backup', emo: 'determined', glow: 1}, {frost: 0, cr: 1, mode: 'clear', emo: 'chatty', glow: 0.6}, {frost: 0.5, cr: 0.5, mode: 'clear', emo: 'pensive', glow: 0.3},
];
const TOPS = [{k: 3, t: 'RIMED'}, {k: 13, t: 'ONE ARC'}, {k: 20, t: 'HEATED'}, {k: 23, t: 'BACKUP'}, {k: 28, t: 'CLEAN'}, {k: 47, t: 'HALF'}];
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
        <rect x={40} y={118} width={monoW('THE ROOF PUCK · WAYMO SENSOR DOME', 20, 3) + 40} height={46} rx={8} fill="#12161A" opacity={0.85} />
        <text x={60} y={150} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill={C.rime}>THE ROOF PUCK · WAYMO SENSOR DOME</text>
        {TOPS.map((q, i) => {
          const x = 44 + i * 164, on = i <= cur, now = i === cur;
          return (
            <g key={i} transform={`translate(${x} 530)`}>
              <rect x={0} y={-28} width={154} height={56} rx={10} fill={now ? C.paper : on ? '#3A424B' : '#1E242A'} stroke={now ? C.line : C.rime} strokeWidth={now ? 5 : 3} opacity={on ? 0.96 : 0.8} />
              <text x={77} y={7} textAnchor="middle" fontFamily={MONO} fontSize={20} fontWeight={900} fill={now ? C.ink : C.rime}>{q.t}</text>
            </g>
          );
        })}
        <line x1={44} y1={578} x2={1020} y2={578} stroke={C.rime} strokeWidth={3} strokeDasharray="6 10" opacity={0.7} />
        {cur >= 0 && <g transform={`translate(${44 + cur * 164 + 77} 628)`}><RoofPuck x={0} y={0} f={f} scale={0.2} frost={PS[cur].frost} clearRing={PS[cur].cr} mode={PS[cur].mode} emotion={PS[cur].emo} glow={PS[cur].glow} seed={20} /></g>}
      </g>
    </svg>
  );
};

// ---- S1: the mirror road, a resident's window, the frosted puck wipes a question mark --------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [1, 3, 4, 5];
  const sweep = easeIO(f, b(1), 50);
  const mirror = easeIO(f, b(1) + 30, 40);
  const settle = springy(f, b(3) - 6, 24);
  const wipe = easeIO(f, b(4) - 4, 22);
  const refreeze = easeIO(f, b(5), 30);
  const q = wipe * (1 - refreeze);
  const opened = ease(f, b(4) + 8, 12);
  const handWipe = easeIO(f, 0, 40);
  const blackout = 1 - ease(f, 0, 30);
  return (
    <Frame p={p} overlay={<>
        <Plate x={540} y={1210} text="A FAIRBANKS RESIDENT ASKED" size={36} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={760} text="WAYMO SELF-DRIVING CAR" size={36} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={870} text="DO THEY KNOW?" size={52} tone="glow" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={300} y={1100} text="BLACK ICE" size={34} tone="dark" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="fog" z0={1.05} z1={1.12} oy={1000}>
      <SVG>
        <Spruces y={1062} n={8} seed={2} f={f} x0={-40} x1={380} scale={0.9} fill={C.spruce} o={0.75} />
        <Spruces y={1062} n={7} seed={7} f={f} x0={700} x1={1120} scale={0.8} fill={C.spruce} o={0.75} />
        <Road f={f} speed={0.4} mirror={mirror} glint={sweep} />
        {/* the mirror: the puck's upside-down reflection in the black ice */}
        <g opacity={0.45 * mirror} transform="translate(540 1440) scale(0.9 -0.5)"><CarSil x={0} y={0} s={0.9} f={f} /><RoofPuck x={0} y={-176} f={f} scale={0.55} frost={1} mode="blind" emotion="sleepy" seed={9} /></g>
        <HeldProp f={f} px={540} py={1180} w={500} h={300} seed={1.1} kind="rest">
          <g transform={`translate(0 ${(1 - settle) * -30})`}>
            <CarSil x={540} y={1300} s={0.9} f={f} />
            <RoofPuck x={540} y={1124} f={f} scale={1.1} frost={1} clearRing={0} mode={opened > 0.5 && refreeze < 0.6 ? 'clear' : 'blind'} emotion={refreeze > 0.4 ? 'wary' : opened > 0.5 ? 'startled' : 'sleepy'} qmark={q} look={refreeze > 0.4 ? 0.3 : 0} seed={1} />
          </g>
        </HeldProp>
        {/* the headlight sweep */}
        <path d={`M -60,${1080 + 30 * Math.sin(sweep * 3)} L ${lerp(-200, 1300, sweep)},1500 L ${lerp(-40, 1500, sweep)},1500 Z`} fill={C.white} opacity={0.22 * Math.sin(Math.PI * sweep)} />
        {/* a resident's mittened hand wipes the frosted window in the foreground */}
        <g opacity={1 - ease(f, b(3) - 10, 20)}>
          <rect x={0} y={300} width={1080} height={1010} fill={C.rime} opacity={0.55 * (1 - handWipe * 0.8)} />
          <g transform={`translate(${lerp(120, 860, handWipe)} ${lerp(980, 760, handWipe)}) rotate(${-20 + 30 * handWipe})`}>
            <rect x={-60} y={-50} width={120} height={110} rx={50} fill="#7A5A44" stroke={C.line} strokeWidth={7} />
            <rect x={-74} y={-20} width={36} height={60} rx={18} fill="#7A5A44" stroke={C.line} strokeWidth={6} />
            <rect x={-52} y={56} width={104} height={200} rx={20} fill={C.parka} stroke={C.line} strokeWidth={7} />
            <path d="M -52,70 h 104" stroke={C.rime} strokeWidth={10} />
          </g>
        </g>
        <rect x={0} y={0} width={W} height={H} fill="#000" opacity={0.9 * blackout} />
        <Lab text="ILLUSTRATIVE" x={900} y={1290} size={18} tone="dark" p={mirror} />
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
  const odo = clamp01((f - b(8)) / 30);
  const glow = clamp01(1 - Math.abs(f - b(8) - 6) / 12);
  const scroll = easeIO(f, b(6) + 20, 60);
  return (
    <Frame p={p} overlay={<>
        <Plate x={720} y={730} text="NOVEMBER 5TH" size={40} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={700} y={830} text="THIS SEASON · ALASKA" size={34} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={700} y={960} displayLines={['CLOSED-COURSE TESTS', '· HEAVY SNOWFALL DATA']} text="CLOSED-COURSE TESTS · HEAVY SNOWFALL DATA" size={32} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="kitchen" z0={1.02} z1={1.08} ox={460} oy={980}>
      <SVG>
        {/* the puck, small and graphite, reflected in the window glass */}
        <g opacity={0.55}><CarSil x={780} y={790} s={0.45} f={f} /><RoofPuck x={780} y={702} f={f} scale={0.45} frost={0.8} clearRing={0.1} mode="blind" emotion="sleepy" seed={2} /></g>
        <rect x={120} y={360} width={840} height={620} fill={C.cream} opacity={0.18} />
        <path d="M 160,940 L 400,400" stroke="#FFFFFF" strokeWidth={10} opacity={0.2} />
        <ellipse cx={420} cy={1600} rx={260} ry={40} fill="#000" opacity={0.25} />
        <g transform={`translate(${lerp(-200, 0, slide)} 0)`}>
          <Phone x={400} y={1240} s={1.0} rot={-4}>
            <g transform={`translate(0 ${-40 * scroll})`}>
              <rect x={-150} y={-280} width={300} height={30} rx={6} fill={C.graphite} />
              <rect x={-150} y={-236} width={120} height={34} rx={6} fill={C.paper} stroke={C.line} strokeWidth={3} />
              <text x={-90} y={-212} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>NOV 5</text>
              {[0, 1, 2].map((i) => <rect key={i} x={-150} y={-180 + i * 26} width={300 - i * 50} height={12} rx={6} fill="#B9B2A6" />)}
              <g transform="translate(-130 -80) scale(0.26)"><path d={AK_PATH} fill={C.snow} stroke={C.line} strokeWidth={10} /></g>
              <Pin x={0} y={-10} drop={pin} s={0.7} wide={0.32} />
              <g opacity={cones}>{[0, 1, 2, 3, 4, 5].map((i) => {
                const a = (i / 6) * Math.PI * 2;
                const lit = clamp01(cones * 6 - i);
                return <path key={i} d={`M ${-60 + 50 * Math.cos(a)},${130 + 22 * Math.sin(a)} l 10,-26 l 10,26 Z`} fill={lit > 0.5 ? C.amber : C.snowD} stroke={C.line} strokeWidth={3} />;
              })}</g>
              <g transform="translate(80 140)" opacity={drum > 0.01 ? 1 : 0}>
                <rect x={-40} y={-50} width={80} height={100} rx={16} fill={C.snow} stroke={C.line} strokeWidth={4} />
                <rect x={-36} y={46 - 92 * drum} width={72} height={92 * drum} rx={12} fill={C.white} />
                {[0, 1, 2, 3].map((i) => <circle key={i} cx={-20 + i * 14} cy={-60 - ((f * 2 + i * 20) % 50)} r={4} fill={C.white} stroke={C.snowD} strokeWidth={1.5} />)}
              </g>
            </g>
          </Phone>
        </g>
        <Odometer x={820} y={1200} s={0.6} roll={odo} f={f} glow={glow} />
        <HeldTravel f={f} x={210} y={910} w={380} h={660} seed={2} strength={0.2} rx={20} />
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
  const FX = 600, FY = 900;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: b(11) + 6, z: 1.0, fx: 540, fy: 960}, {t: b(12) + 10, z: 1.45, fx: FX, fy: FY + 40}, {t: p.dur, z: 1.5, fx: FX, fy: FY + 40}]);
  const tap = Math.max(0, Math.sin((f - b(10)) / 4)) * (f > b(10) && f < b(10) + 30 ? 1 : 0);
  return (
    <Frame p={p} overlay={<>
        <Plate x={540} y={730} text="THE POST SAYS ONLY ALASKA" size={36} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={820} text="GOVERNOR'S POST · FAIRBANKS" size={36} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1240} text={'"NO BETTER PROVING GROUND"'} size={22} tone="glow" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="map" cam={cam}>
      <SVG>
        <g transform="translate(80 640) scale(0.92)"><path d={AK_PATH} fill={C.snow} stroke={C.line} strokeWidth={6} /><path d={AK_PATH} fill="none" stroke={C.rime} strokeWidth={14} opacity={0.5} /></g>
        <Pin x={FX - 40} y={FY + 10} drop={drop} s={1.1} wide={1 - snap} />
        {/* the governor's card slides over and its pin snaps to Fairbanks as one dot */}
        <g transform={`translate(${lerp(1300, 820, card)} 1180) rotate(${lerp(10, 4, card)})`}>
          <rect x={-170} y={-110} width={340} height={220} rx={12} fill={C.white} stroke={C.line} strokeWidth={6} />
          <rect x={-170} y={-110} width={340} height={44} rx={12} fill={C.graphite} />
          {[0, 1, 2].map((i) => <rect key={i} x={-140} y={-40 + i * 34} width={280 - i * 40} height={14} rx={7} fill="#B9B2A6" />)}
        </g>
        <circle cx={FX} cy={FY} r={14 * snap} fill={C.ink} stroke={C.white} strokeWidth={4} />
        <circle cx={FX} cy={FY} r={14 + 30 * snap * (0.5 + 0.5 * Math.sin(f / 8))} fill="none" stroke={C.ink} strokeWidth={3} opacity={0.4 * snap} />
        {/* frost-rimmed cloth banner snapping taut */}
        <g transform={`translate(${FX} ${FY - 120}) scale(${banner} 1)`} opacity={clamp01(banner * 2)}>
          <path d={`M -200,-34 Q 0,${-44 + 8 * Math.sin(f / 7)} 200,-34 L 200,34 Q 0,${24 + 8 * Math.sin(f / 7)} -200,34 Z`} fill={C.paper} stroke={C.line} strokeWidth={5} />
          <path d="M -196,-30 l 12,10 l 10,-8 l 12,10 l 10,-8 l 12,10" stroke={C.rime} strokeWidth={4} fill="none" />
        </g>
        <g transform={`translate(240 1250) rotate(${-8 * tap})`}><RoofPuck x={0} y={0} f={f} scale={0.55} frost={0.75} clearRing={0.15} mode="clear" emotion="wary" look={0.8} seed={3} /></g>
        <HeldTravel f={f} x={80} y={640} w={920} h={640} seed={3} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S4: three kinds of work as three lanes, high crane over the fogged road ------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [13, 14, 15, 16, 17];
  const card = easeIO(f, b(13), 22);
  const lane = (i: number) => springy(f, b([14, 15, 16][i]) - 4, 22);
  const l3 = springy(f, b(17) - 4, 22);
  const tapA = Math.max(0, Math.sin((f - b(15)) / 6)) * clamp01((f - b(15)) / 10);
  const cam = track([{t: 0, z: 1.25, fx: 540, fy: 1100}, {t: b(14), z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.04, fx: 540, fy: 980}]);
  return (
    <Frame p={p} overlay={<>
        <Plate x={540} y={1230} text="QUOTED BY TV STATION" size={34} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={730} text="THREE KINDS OF WORK" size={38} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="fog" cam={cam}>
      <SVG>
        <Spruces y={1062} n={10} seed={4} f={f} x0={-40} x1={1120} scale={0.6} o={0.6} />
        {/* three lanes already laid in the road; each fills with its content */}
        <path d="M 380,1062 L 700,1062 L 1080,1700 L 0,1700 Z" fill={C.ground} stroke={C.line} strokeWidth={4} />
        {[0, 1].map((i) => <path key={i} d={`M ${487 + i * 106},1062 L ${360 + i * 360},1700`} stroke={C.rime} strokeWidth={6} strokeDasharray="30 22" />)}
        {[0, 1, 2].map((i) => <path key={i} d={`M ${380 + i * 106},1062 L ${487 + i * 106},1062 L ${360 + i * 360},1700 L ${0 + i * 360},1700 Z`} fill={C.rime} opacity={0.12 * (i < 2 ? lane(i + 1) : l3)} />)}
        <path d="M 380,1062 L 700,1062 L 1080,1700 L 0,1700 Z" fill="none" stroke={C.rime} strokeWidth={3} opacity={0.5 * lane(0)} />
        {/* lane 1: a person at the roadside with a handheld logger */}
        <g opacity={clamp01(lane(1) * 2)} transform={`translate(0 ${(1 - lane(1)) * 60})`}><Person x={170} y={1330} s={0.75} f={f} seed={1.4} armUp={0.5 * tapA} cues={[b(15), b(15) + 20]} /></g>
        {/* lane 2: the car with the puck, a specialist's hands on the wheel (inset) */}
        <g transform={`translate(${lerp(560, 540, card)} 0)`}>
          <CarSil x={540} y={1560} s={0.62} f={f} roll={f / 40} />
          <RoofPuck x={540} y={1440} f={f} scale={0.6} frost={0.7} clearRing={0.2} mode="clear" emotion="alert" seed={4} />
        </g>
        <g opacity={clamp01(lane(2) * 2)} transform="translate(540 1200)"><circle r={86} fill={C.fog} stroke={C.line} strokeWidth={5} /><WheelHands x={0} y={10} s={0.55} on={lane(2)} f={f} /></g>
        {/* lane 3: a closed course of cones */}
        <g opacity={clamp01(l3 * 2)}>{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${820 + i * 40 - 10},${1500 - (i % 2) * 40} l 14,-40 l 14,40 Z`} fill={C.amber} stroke={C.line} strokeWidth={3} transform={`rotate(${4 * Math.sin(f / 9 + i)} ${830 + i * 40} ${1500})`} />)}<path d="M 800,1520 q 100,-70 210,0" stroke={C.rime} strokeWidth={4} strokeDasharray="10 8" fill="none" /></g>
        <Lab text="MANUAL DATA COLLECTION" x={300} y={1120} size={24} p={vis(f, b, K, 2)} />
        <Lab text="SPECIALIST AT THE WHEEL" x={540} y={1060} size={24} p={vis(f, b, K, 3)} />
        <Lab text="LIMITED STRUCTURED TESTING" x={760} y={1300} size={24} p={vis(f, b, K, 4)} />
        <HeldTravel f={f} x={0} y={1062} w={1080} h={640} mode="shadow" seed={4} strength={0.2} rx={20} />
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
    <Frame p={p} overlay={<>
        <Plate x={760} y={730} displayLines={['SIXTH-GENERATION', 'WAYMO DRIVER']} text="SIXTH-GENERATION WAYMO DRIVER" size={32} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={870} text="HEATERS · MICRO-WIPERS" size={34} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1240} text="SENSORS KEPT CLEAR" size={36} tone="dark" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="fog" z0={1.05} z1={1.12} ox={460} oy={900}>
      <SVG>
        <rect x={0} y={300} width={W} height={760} fill={C.fog} opacity={0.6} />
        <HeldProp f={f} px={420} py={940} w={600} h={420} seed={2.2} kind="rest">
          <RoofPuck x={420} y={1080} f={f} scale={2.2} frost={lerp(0.7, 0.15, heat)} clearRing={lerp(0.2, 1, heat)} mode="clear" emotion={open > 0.5 ? 'relieved' : 'alert'} glow={heat} open={0.7 + 0.3 * open} seed={5} />
        </HeldProp>
        {/* the cutaway: the front shell slides off and three sensor layers light inside */}
        <g opacity={part * (1 - ease(f, b(20) - 10, 20))}>
          <path d="M 140,1080 C 140,930 260,830 420,830 C 580,830 700,930 700,1080 Z" fill="#14181D" stroke={C.line} strokeWidth={7} />
          {['CAMERA', 'RADAR', 'LIDAR'].map((t, i) => (
            <g key={t} transform={`translate(420 ${1030 - i * 62})`} opacity={0.4 + 0.6 * layers[i]}>
              <rect x={-200 + i * 30} y={-24} width={400 - i * 60} height={48} rx={18} fill={layers[i] > 0.5 ? C.amber : '#3A424B'} stroke={C.line} strokeWidth={4} />
              <circle cx={-170 + i * 30} cy={0} r={10} fill={C.line} />
            </g>
          ))}
        </g>
        <g transform={`translate(${lerp(420, 980, part)} ${lerp(0, -60, part)}) rotate(${18 * part} 420 1080)`} opacity={1 - ease(f, b(20) - 10, 20)}>
          <path d="M 140,1080 C 140,930 260,830 420,830 C 580,830 700,930 700,1080 Z" transform="translate(-420 0)" fill={C.graphite} stroke={C.line} strokeWidth={7} opacity={part > 0.02 ? 1 : 0} />
        </g>
        {Array.from({length: 14}).map((_, i) => {
          const k = ((f * 0.03 + i / 14) % 1);
          return <path key={i} d={`M ${300 + i * 22},${700 + k * 300} l 8,18`} stroke={C.white} strokeWidth={4} opacity={sleet * (1 - k)} />;
        })}
        <Lab text="CAMERAS · RADAR · LIDAR" x={420} y={1180} size={26} p={vis(f, b, K, 1)} />
        <HeldTravel f={f} x={140} y={820} w={560} h={270} seed={5} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

/** the dot road seen from the puck: returns drawn as dots receding to a white wall. `thin` 0..1 thins them, `drift` steers to the shoulder. */
const DotRoad: React.FC<{f: number; draw: number; thin?: number; drift?: number; wall?: number}> = ({f, draw, thin = 0, drift = 0, wall = 0.5}) => (
  <g>
    {Array.from({length: 16}).map((_, row) => {
      const k = row / 15;
      const y = 1500 - Math.pow(k, 0.8) * 560;
      const half = 420 * (1 - k * 0.85);
      return Array.from({length: 7}).map((__, i) => {
        const keep = h01(row, i) > thin * (0.3 + k);
        const show = clamp01(draw * 16 - row);
        if (!keep) return null;
        const x = 540 + drift * 220 * (1 - k) + (i - 3) / 3 * half;
        return <circle key={`${row}-${i}`} cx={x} cy={y} r={(10 - 7 * k) * (0.85 + 0.15 * Math.sin(f / 6 + row))} fill={C.amber} opacity={show * (1 - k * 0.6)} />;
      });
    })}
    <rect x={0} y={860} width={W} height={110} fill={C.hud} opacity={wall} />
    <path d="M 0,940 H 1080" stroke="#CFCAC2" strokeWidth={4} strokeDasharray="18 14" opacity={wall} />
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

// ---- S6: the puck's own view, the whiteout and the returns that draw the road ----------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [22, 23];
  const white = ease(f, b(22), 12);
  const draw = easeIO(f, b(23) - 4, 40);
  const ring = clamp01((f - b(23)) / 20);
  return (
    <Frame p={p} overlay={<>
        <Plate x={540} y={730} text="CAMERAS IN A WHITEOUT" size={38} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={860} displayLines={['ONE SENSOR BLIND ·', 'ANOTHER BACKS IT UP']} text="ONE SENSOR BLIND · ANOTHER BACKS IT UP" size={34} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="white" z0={1.0} z1={1.0} vignette={0.12}>
      <SVG>
        <rect x={0} y={0} width={W} height={H} fill="#BDB8B2" opacity={1 - white} />
        <DotRoad f={f} draw={draw} wall={0.7} />
        {[0, 1, 2].map((i) => {
          const k = ((f / 36 + i / 3) % 1);
          return <ellipse key={i} cx={540} cy={1500} rx={120 + 600 * k} ry={40 + 200 * k} fill="none" stroke={C.amber} strokeWidth={6 - 4 * k} opacity={ring * (1 - k)} />;
        })}
        <Hood f={f} />
        {/* HUD reticle and the puck inset in its backup state */}
        <g opacity={0.9}><path d="M 70,330 h 60 M 70,330 v 60 M 1010,330 h -60 M 1010,330 v 60" stroke="#8C867E" strokeWidth={5} /></g>
        <g transform="translate(880 1140)"><circle r={120} fill="#2A2F36" opacity={0.15} /><RoofPuck x={0} y={60} f={f} scale={0.6} frost={0.3} clearRing={0.6} mode={ring > 0.05 ? 'backup' : 'blind'} emotion="determined" seed={6} /></g>
        <HeldTravel f={f} x={0} y={860} w={1080} h={640} seed={6} strength={0.2} rx={20} />
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
    <Frame p={p} overlay={<>
        <Plate x={540} y={730} text="TRACTION · EACH WHEEL" size={38} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={830} text="SIMULATED BLACK ICE" size={38} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="under" z0={1.03} z1={1.09} oy={980}>
      <SVG>
        <rect x={0} y={lerp(300, 0, drop)} width={W} height={300} fill={C.graphite} stroke={C.line} strokeWidth={6} />
        {[160, 400, 680, 920].map((wx, i) => (
          <g key={wx}>
            <g transform={`translate(${wx} 1000) rotate(${f * 2 + i * 20})`}><circle r={86} fill="#0B0E10" stroke={C.line} strokeWidth={8} /><circle r={36} fill="#3A424B" /><path d="M -30,0 H 30 M 0,-30 V 30" stroke="#12161A" strokeWidth={6} /></g>
            <path d={`M ${wx - 120},1086 l 30,-8 l 26,12 l 40,-14 l 30,10 l 30,-6`} stroke={C.rime} strokeWidth={4} fill="none" />
            <g transform={`translate(${wx} ${760 + (1 - g[i]) * 40}) scale(${g[i]})`} opacity={clamp01(g[i] * 2)}>
              <circle r={62} fill={C.paper} stroke={C.line} strokeWidth={6} />
              <path d="M -46,10 A 48,48 0 0 1 46,10" stroke={C.snowD} strokeWidth={6} fill="none" />
              <line x1={0} y1={10} x2={44 * Math.cos(-Math.PI / 2 + 0.6 * Math.sin(f / 9 + i))} y2={10 + 44 * Math.sin(-Math.PI / 2 + 0.6 * Math.sin(f / 9 + i))} stroke={C.amber} strokeWidth={7} strokeLinecap="round" />
              <circle cy={10} r={7} fill={C.line} />
            </g>
          </g>
        ))}
        {/* the simulated glass road poured from a grid */}
        <g opacity={clamp01(pour * 3)} transform="translate(0 0)">
          <rect x={190} y={1150} width={700} height={170} rx={8} fill="#1E242A" stroke={C.rime} strokeWidth={4} strokeDasharray="12 8" />
          {Array.from({length: 13}).map((_, i) => <path key={i} d={`M ${190 + i * 58},1150 V 1320`} stroke="#3A424B" strokeWidth={2} />)}
          <rect x={200} y={1300 - 140 * pour} width={680} height={140 * pour} fill="#7F8E9A" opacity={0.55} />
          <path d={`M 200,${1300 - 140 * pour} Q 540,${1290 - 140 * pour + 10 * Math.sin(f / 6)} 880,${1300 - 140 * pour}`} stroke={C.white} strokeWidth={4} fill="none" opacity={0.7} />
          <Lab text="SIMULATION" x={790} y={1180} size={20} tone="dark" p={pour} />
        </g>
        <g transform="translate(160 1240)"><RoofPuck x={0} y={0} f={f} scale={0.42} frost={0.1} clearRing={1} mode="wheel" emotion="alert" look={0.6} seed={7} /></g>
        <HeldTravel f={f} x={100} y={700} w={880} h={130} seed={7} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S8: the weather station, then the pullback to an abstract snow field of pings ----------------------------------------------------------------
const PINGS = Array.from({length: 46}).map((_, i) => ({x: 90 + h01(i, 3) * 900, y: 480 + h01(i, 7) * 820}));
const PATCH = {x: 300, y: 1060, r: 130};
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [28, 29, 30];
  const vane = springy(f, b(28) - 4, 22);
  const pull = easeIO(f, b(29) - 6, 70);
  const tick = clamp01((f - b(30)) / 45);
  const PX = 640, PY = 900;
  const cam = track([{t: 0, z: 2.4, fx: PX, fy: PY - 40}, {t: b(29) - 6, z: 2.4, fx: PX, fy: PY - 40}, {t: b(29) + 64, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.03, fx: 540, fy: 960}]);
  const dark = ease(f, b(30) - 6, 20);
  return (
    <Frame p={p} mode="field" cam={cam} warmth={0.05}
      overlay={<>
        <Plate x={540} y={730} text="MOBILE WEATHER STATION" size={34} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1230} displayLines={['SHARED ACROSS THE FLEET', '· ILLUSTRATIVE']} text="SHARED ACROSS THE FLEET · ILLUSTRATIVE" size={32} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={560} y={880} displayLines={['WAYMO SAYS · TENS OF', 'THOUSANDS OF MILES ·', 'SNOWY REGIONS ELSEWHERE']} text="WAYMO SAYS · TENS OF THOUSANDS OF MILES · SNOWY REGIONS ELSEWHERE" size={30} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        {/* the dark silent patch with the Fairbanks pin */}
        <circle cx={PATCH.x} cy={PATCH.y} r={PATCH.r} fill={C.ground} opacity={0.85 * dark} />
        <g opacity={dark}><Pin x={PATCH.x} y={PATCH.y + 20} drop={1} s={0.8} /><Lab text="FAIRBANKS" x={PATCH.x} y={PATCH.y + 70} size={20} tone="dark" p={dark} /></g>
        {/* pings answering across the field, everywhere except the patch */}
        {PINGS.map((q, i) => {
          if (dark > 0.3 && Math.hypot(q.x - PATCH.x, q.y - PATCH.y) < PATCH.r + 20) return null;
          const k = ((f / 50 + h01(i, 1)) % 1);
          const on = clamp01(pull * 3 - h01(i, 5) * 2);
          return (
            <g key={i} opacity={on}>
              <circle cx={q.x} cy={q.y} r={7} fill={C.amber} />
              <circle cx={q.x} cy={q.y} r={10 + 40 * k} fill="none" stroke={C.amber} strokeWidth={3} opacity={1 - k} />
            </g>
          );
        })}
        {/* drawn mile markers ticking elsewhere, labelled ILLUSTRATIVE, and the blank counter re-seeded in a corner */}
        <g opacity={tick > 0 ? 1 : 0}>
          {[[640, 1180], [760, 1120], [880, 1180], [700, 1260], [820, 1300]].map(([mx, my], i) => (
            <g key={i} transform={`translate(${mx} ${my}) scale(${clamp01(tick * 5 - i)})`}><path d="M 0,-16 L 4,-4 L 16,0 L 4,4 L 0,16 L -4,4 L -16,0 L -4,-4 Z" fill={C.white} stroke={C.line} strokeWidth={3} /></g>
          ))}
          <Lab text="ILLUSTRATIVE" x={780} y={1360} size={18} tone="dark" p={tick} />
          <Odometer x={180} y={1280} s={0.45} roll={tick} f={f} />
        </g>
        {/* the clean warm puck with a vane and a thermometer, pinging */}
        <g transform={`translate(${PX} ${PY})`}>
          <ellipse cx={0} cy={90} rx={130} ry={40} fill={C.sun} opacity={0.35 * (1 - pull)} />
          <CarSil x={0} y={180} s={0.32} f={f} />
          <RoofPuck x={0} y={124} f={f} scale={0.32} frost={0} clearRing={1} mode="clear" emotion="chatty" glow={0.3} seed={8} />
          <g transform={`translate(26 ${82 - 30 * vane}) scale(${vane})`}><path d="M 0,0 V -40" stroke={C.line} strokeWidth={3} /><g transform={`rotate(${f * 6} 0 -40)`}><path d="M -14,-40 H 14 M 0,-54 V -26" stroke={C.line} strokeWidth={3} /></g></g>
          <g transform={`translate(-26 ${82 - 26 * vane}) scale(${vane})`}><rect x={-4} y={-34} width={8} height={30} rx={4} fill={C.white} stroke={C.line} strokeWidth={2} /><circle cy={-4} r={6} fill={C.amber} stroke={C.line} strokeWidth={2} /></g>
          {[0, 1].map((i) => { const k = ((f / 30 + i / 2) % 1); return <circle key={i} cx={0} cy={60} r={20 + 70 * k} fill="none" stroke={C.amber} strokeWidth={3} opacity={vane * (1 - k)} />; })}
        </g>
        <HeldTravel f={f} x={60} y={460} w={960} h={860} mode="shadow" seed={8} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S9: the design folds to paper on the dark patch, then a gust frosts the eye rim ----------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [32, 33];
  const fold = easeIO(f, b(32) - 6, 26);
  const gust = easeIO(f, b(33) - 4, 30);
  return (
    <Frame p={p} overlay={<>
        <Plate x={400} y={730} text="AN ANSWER ON PAPER" size={38} tone="plate" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1240} text="HOLD THAT THOUGHT" size={38} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="fog" z0={1.02} z1={1.06} oy={940}>
      <SVG>
        <Spruces y={1062} n={8} seed={9} f={f + gust * 40} x0={-40} x1={1120} scale={0.7} o={0.6} />
        <path d="M 0,1150 Q 540,1110 1080,1150 L 1080,1920 L 0,1920 Z" fill={C.snow} />
        <ellipse cx={360} cy={1180} rx={250} ry={70} fill={C.ground} />
        {/* the sheet folds down and lands on the dark patch */}
        <g transform={`translate(360 ${lerp(820, 1150, fold)}) rotate(${lerp(-6, 2, fold)}) scale(${lerp(1.3, 1, fold)} ${lerp(1.3, 0.45, fold)})`}>
          <rect x={-170} y={-120} width={340} height={240} rx={6} fill={C.paper} stroke={C.line} strokeWidth={6} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-140} y={-90 + i * 36} width={280 - (i % 2) * 70} height={12} rx={6} fill="#B9B2A6" />)}
          <path d={`M 170,-120 l -40,0 l 40,40 Z`} fill={C.rime} stroke={C.line} strokeWidth={3} transform={`rotate(${8 * Math.sin(f / 7)} 170 -120)`} />
        </g>
        {/* spindrift of the gust */}
        {Array.from({length: 22}).map((_, i) => {
          const k = clamp01(gust * 1.6 - i / 30);
          return <path key={i} d={`M ${lerp(-100, 1180, k)},${700 + (i * 41) % 500} l 90,8`} stroke={C.white} strokeWidth={5} opacity={Math.sin(Math.PI * k) * 0.7} />;
        })}
        <HeldProp f={f} px={780} py={900} w={360} h={300} seed={3.3} kind="rest">
          <RoofPuck x={780} y={1000} f={f} scale={1.25} frost={lerp(0, 0.25, gust)} clearRing={lerp(1, 0.8, gust)} mode="clear" emotion={gust > 0.4 ? 'wary' : 'relieved'} glow={0.2} open={1 - 0.3 * gust} seed={10} />
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
  const cam = track([{t: 0, z: 1.12, fx: 330, fy: 900}, {t: b(36) - 6, z: 1.12, fx: 360, fy: 900}, {t: b(37), z: 1.0, fx: 540, fy: 940}, {t: p.dur, z: 1.03, fx: 560, fy: 940}]);
  return (
    <Frame p={p} overlay={<>
        <Plate x={320} y={1205} text="ONE RESIDENT EXPECTS" size={32} tone="dark" p={ease(f, b(34), 12) * (1 - ease(f, b(35) - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={730} text={'"STALL OUT" · WHAT IF'} size={32} tone="warn" p={ease(f, b(35), 10) * (1 - ease(f, b(36) - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={810} text={'"SHOULDN\'T BE ALLOWED"'} size={28} tone="dark" p={ease(f, b(36), 10) * (1 - ease(f, b(37) - 10, 8))} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1275} text={'THE MAYOR · "A GREAT OPPORTUNITY"'} size={28} tone="dark" p={ease(f, b(37), 12)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="fog" cam={cam}>
      <SVG>
        <Spruces y={1062} n={12} seed={11} f={f} x0={-40} x1={1120} scale={0.7} o={0.55} />
        <path d="M 0,1300 L 1080,1240 L 1080,1400 L 0,1460 Z" fill={C.ground} />
        <Billboard x={300} y={1180} up={up1} f={f} w={440} h={340}>
          {/* the thought-frame: the worry, a car stopped on a shoulder, crimson once, dim white hazards */}
          <g transform={`scale(${frame})`} opacity={clamp01(frame * 2)}>
            <rect x={-190} y={-96} width={380} height={190} rx={70} fill={C.fog} stroke={C.ink} strokeWidth={5} strokeDasharray="16 10" />
            <path d="M -170,60 L 170,40" stroke={C.ground} strokeWidth={30} />
            <CarSil x={-10} y={50} s={0.38} f={f} tail={tail} hazard={frame > 0.5 ? 0.6 : 0} />
          </g>
        </Billboard>
        <Billboard x={760} y={1150} up={up2} f={f} w={400} h={220} />
        <Billboard x={540} y={820} up={up3} f={f} w={420} h={200}>
          <path d={`M 150,-90 q 30,${20 + 10 * Math.sin(f / 5)} 10,60`} stroke={C.ink} strokeWidth={8} fill="none" />
        </Billboard>
        <text x={300} y={880 + rise(up1, 340)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={2} fill={C.ink} opacity={up1 > 0.02 ? 1 : 0}>WHAT IF</text>
        <text x={760} y={1035 + rise(up2, 220)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={C.ink} opacity={up2 > 0.02 ? 1 : 0}>"SHOULDN'T BE</text>
        <text x={760} y={1075 + rise(up2, 220)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={C.ink} opacity={up2 > 0.02 ? 1 : 0}>ALLOWED"</text>
        <text x={540} y={690 + rise(up3, 200)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={2} fill={C.ink} opacity={up3 > 0.02 ? 1 : 0}>THE MAYOR</text>
        <text x={540} y={740 + rise(up3, 200)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={C.ink} opacity={up3 > 0.02 ? 1 : 0}>"A GREAT</text>
        <text x={540} y={778 + rise(up3, 200)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={C.ink} opacity={up3 > 0.02 ? 1 : 0}>OPPORTUNITY"</text>
        <g transform="translate(980 1330)"><RoofPuck x={0} y={0} f={f} scale={0.42} frost={0.25} clearRing={0.8} mode="clear" emotion="tense" look={-0.8} seed={11} /></g>
        <HeldTravel f={f} x={80} y={840} w={920} h={340} seed={10} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S11: when winter wins, back in the puck's view, the gauge crosses its limit and the car pulls over --------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [39, 41];
  const needle = easeIO(f, b(39) + 6, 60);
  const thin = easeIO(f, b(41) - 4, 40);
  const pull = easeIO(f, b(41), 50);
  const leaves = easeIO(f, b(41) + 20, 60);
  // the dolly decelerates to a dead stop as the car pulls over
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: b(41), z: 1.08, fx: 560, fy: 1000}, {t: b(41) + 50, z: 1.1, fx: 600, fy: 1010}, {t: p.dur, z: 1.1, fx: 600, fy: 1010}]);
  const ang = lerp(-60, 50, needle);
  return (
    <Frame p={p} overlay={<>
        <Plate x={540} y={730} displayLines={['WEATHER BEYOND VALIDATED', '· VALIDATED LIMIT']} text="WEATHER BEYOND VALIDATED · VALIDATED LIMIT" size={32} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1250} displayLines={['ITS OWN POST · IN ITS CITIES', '· PAUSE FOR HOURS OR DAYS']} text="ITS OWN POST · IN ITS CITIES · PAUSE FOR HOURS OR DAYS" size={30} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="white" cam={cam} vignette={0.12}>
      <SVG>
        {/* a generic city skyline glimpse behind the dot road (not Fairbanks) */}
        <g opacity={0.35}>{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={150 + i * 100} y={860 - (60 + h01(i, 4) * 140)} width={80} height={60 + h01(i, 4) * 140} fill="#B9B4AD" />)}</g>
        <DotRoad f={f} draw={1} thin={thin} drift={pull} wall={0.6 + 0.3 * thin} />
        {[0, 1, 2].map((i) => {
          const k = ((f / 36 + i / 3) % 1);
          const sz = 1 - 0.7 * thin;
          return <ellipse key={i} cx={540} cy={1500} rx={(120 + 600 * k) * sz} ry={(40 + 200 * k) * sz} fill="none" stroke={C.amber} strokeWidth={6 - 4 * k} opacity={(1 - k) * (1 - 0.5 * thin)} />;
        })}
        <Hood f={f} hazard={pull > 0.6 ? 0.7 : 0} leaves={leaves} />
        <Lab text="CITY SERVICE" x={540} y={830} size={22} tone="dark" p={1} />
        {/* the VALIDATED LIMIT gauge on the HUD */}
        <g transform="translate(860 1070)">
          <circle r={100} fill={C.paper} stroke={C.line} strokeWidth={7} />
          <path d="M -86,30 A 92,92 0 0 1 86,30" stroke={C.snowD} strokeWidth={10} fill="none" />
          <line x1={0} y1={0} x2={98 * Math.sin(Math.PI * 0.2)} y2={-98 * Math.cos(Math.PI * 0.2)} stroke={C.ink} strokeWidth={5} strokeDasharray="10 8" />
          <line x1={0} y1={10} x2={84 * Math.sin(ang * Math.PI / 180)} y2={10 - 84 * Math.cos(ang * Math.PI / 180)} stroke={C.amber} strokeWidth={8} strokeLinecap="round" />
          <circle cy={10} r={10} fill={C.line} />
        </g>
        <Lab text="VALIDATED LIMIT" x={860} y={940} size={20} tone="plate" p={1} />
        <HeldTravel f={f} x={0} y={860} w={1080} h={640} seed={11} strength={0.2} rx={20} />
      </SVG>
    </Frame>
  );
};

// ---- S12: locked overhead on the dashboard clipboard, no count, no dates, a pen that does not write ------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [42, 43, 44, 45, 46];
  const frost = easeIO(f, b(42), 50);
  const flipAway = easeIO(f, b(43) - 24, 18);
  const roll = clamp01((f - b(43)) / 40);
  const calFlip = ease(f, b(43) - 20, 16);
  const thump = springy(f, b(44) - 4, 16);
  const typed = clamp01((f - b(45)) / 50);
  const lower = easeIO(f, b(45) + 10, 40);
  const lift = easeIO(f, b(46) + 10, 30);
  const penY = lerp(lerp(760, 1080, lower), 800, lift);
  const q = 'DRIVERLESS CARS PLANNED?';
  return (
    <Frame p={p} overlay={<>
        <Plate x={540} y={730} text="IS PAPER ENOUGH?" size={40} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={730} text="HOW MANY CARS?" size={40} tone="plate" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={730} text="NO COUNT · NO DATES" size={44} tone="glow" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={730} text="A REPORTER ASKED · DRIVERLESS?" size={32} tone="plate" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={730} text="NOT YET ANSWERED" size={40} tone="dark" p={vis(f, b, K, 4)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>} mode="cab" z0={1.0} z1={1.0}>
      <SVG>
        <path d="M 0,300 H 1080 V 420 Q 540,380 0,420 Z" fill="#20252B" />
        {/* the clipboard, locked overhead */}
        <g transform={`translate(500 ${1010 - 8 * Math.sin(Math.PI * thump)})`}>
          <rect x={-330} y={-300} width={660} height={610} rx={20} fill={C.woodD} stroke={C.line} strokeWidth={8} />
          <rect x={-300} y={-270} width={600} height={560} rx={6} fill={C.white} stroke={C.line} strokeWidth={4} />
          <rect x={-90} y={-322} width={180} height={46} rx={10} fill={C.graphite} stroke={C.line} strokeWidth={5} />
          <Odometer x={-140} y={-150} s={0.9} roll={roll} f={f} />
          <BlankCalendar x={150} y={-130} s={0.75} flip={calFlip} f={f} />
          <rect x={-260} y={60} width={520} height={74} rx={6} fill="none" stroke={C.snowD} strokeWidth={4} />
          <text x={-244} y={110} fontFamily={MONO} fontWeight={800} fontSize={28} fill={C.ink}>{q.slice(0, Math.round(typed * q.length))}</text>
          <path d="M -260,230 H 260" stroke={C.snowD} strokeWidth={4} />
          {/* the paper answer lies on top, frosts over edge to edge, then flips away */}
          <g transform={`scale(1 ${Math.max(0.02, 1 - flipAway)})`} opacity={flipAway > 0.97 ? 0 : 1}>
            <rect x={-290} y={-262} width={580} height={540} rx={6} fill={C.paper} stroke={C.line} strokeWidth={5} />
            {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-250} y={-220 + i * 60} width={500 - (i % 2) * 120} height={16} rx={8} fill="#B9B2A6" />)}
            <rect x={-290} y={-262} width={580 * frost} height={540} fill={C.rime} opacity={0.92} />
            {Array.from({length: 10}).map((_, i) => <path key={i} d={`M ${-290 + 580 * frost},${-250 + i * 52} l -18,14 l 14,8 l -10,12`} stroke="#B9B2A6" strokeWidth={3} fill="none" opacity={frost > 0.05 && frost < 0.98 ? 1 : 0} />)}
          </g>
        </g>
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
  const rise = easeIO(f, b(49) - 4, 90);
  const CX = 330, CY = 1260;
  const cam = track([{t: 0, z: 3.0, fx: CX, fy: CY - 120}, {t: b(49) - 4, z: 3.0, fx: CX, fy: CY - 110}, {t: b(49) + 86, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} mode="night" cam={cam} vignette={0.4}
      overlay={<>
        <Plate x={540} y={1230} text="WAYMO'S POST IS A CLAIM" size={36} tone="dark" p={vis(f, b, K, 0)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={1230} text="THIS WINTER IS THE TEST" size={38} tone="glow" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
        <Plate x={540} y={760} displayLines={['WHAT WOULD YOU', 'WANT PROVEN?']} text="WHAT WOULD YOU WANT PROVEN?" size={44} tone="plate" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: sequenced, one retires before the next lands */}
      </>}>
      <SVG>
        {/* the vast dark road */}
        <path d="M 0,1150 L 1080,1050 L 1080,1500 L 0,1700 Z" fill="#12161A" />
        <path d="M 0,1400 L 1080,1270" stroke="#2A2F36" strokeWidth={6} strokeDasharray="40 30" />
        {/* the lamp: cold hoarfrost LED white, a tight pool around the car */}
        <rect x={CX + 120} y={760} width={12} height={560} fill="#20252B" />
        <path d={`M ${CX + 126},770 h -60`} stroke="#20252B" strokeWidth={10} />
        <rect x={CX + 40} y={762} width={50} height={16} rx={6} fill={C.led} />
        <path d={`M ${CX + 50},778 L ${CX - 200},${CY + 40} L ${CX + 300},${CY + 40} L ${CX + 80},778 Z`} fill={C.led} opacity={0.1} />
        <ellipse cx={CX + 40} cy={CY + 30} rx={260} ry={60} fill={C.led} opacity={0.14} />
        {/* the mirror of frame one: the car reflected upside down in black ice */}
        <g opacity={0.35} transform={`translate(${CX} ${CY + 40}) scale(1 -0.55)`}><CarSil x={0} y={0} s={0.5} f={f} /><RoofPuck x={0} y={-98} f={f} scale={0.3} frost={0.5} clearRing={0.5} mode="clear" emotion="pensive" glow={0.4} seed={12} /></g>
        <CarSil x={CX} y={CY + 30} s={0.5} f={f} />
        <RoofPuck x={CX} y={CY - 68} f={f} scale={0.3} frost={lerp(0.5, 0.7, creep)} clearRing={lerp(0.5, 0.35, creep)} mode="clear" emotion={creep > 0.5 ? 'tense' : 'pensive'} glow={0.4} look={rise > 0.3 ? 0 : 0.6} seed={12} />
        <Flakes f={f} n={50} speed={0.6} o={0.5} />
        <HeldTravel f={f} x={180} y={1150} w={300} h={160} seed={13} strength={0.2} rx={20} />
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
        <Sequence from={0} durationInFrames={end}><Bands beats={bs} /></Sequence>
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
