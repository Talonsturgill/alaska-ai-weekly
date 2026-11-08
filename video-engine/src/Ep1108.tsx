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
import {HeldProp, HeldTravel} from './lib/heldidle';
import {ST, Strand, Knot, Heat, Dial, Ribbon, NumTag} from './lib/strand';
import {IDS} from './Ep1108Ids';

// The Ground Takes Notes, 2026-11-08. Palette roles are art_direction.json (pale overcast, warm stone and umber, bone ice, violet STRAND, pewter instruments,
// black and white newsprint for the separate study, caution yellow ONLY on the dial tape, terracotta ONLY the thaw line and drop, every practical white).
// STRAND is the violet fiber cable with a face (lib/strand.tsx). THE RIBBON is the throughline: printed, fed, narrowed, measured, a sliver, dashed, open.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

export const C = {
  sky: ST.navy, ground: ST.ground, ink: ST.ink, paper: ST.paper, hero: ST.ivory, pulse: ST.cyan, tape: ST.coral, thaw: ST.honey,
  stone: ST.stone, umber: ST.umber, ice: ST.glacier, steel: ST.steel, pewter: ST.brass, road: ST.road,
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
  dark: {fill: '#1C1F2A', fg: '#F4F6F7', edge: '#F4F6F7'},
  plate: {fill: ST.paper, fg: ST.ink, edge: ST.ink},
  warn: {fill: ST.paper, fg: ST.ink, edge: ST.ink},
  glow: {fill: '#FFFFFF', fg: ST.ink, edge: ST.ink},
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
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; warmth?: number; dim?: number; floor?: boolean; children: React.ReactNode}> =
({p, cam, z0 = 1.02, z1 = 1.14, bloom = 0.04, vignette = 0.24, ox = 540, oy = 960, warmth = 0.0, dim = 0, floor = true, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 16 * Math.sin(p.f / 110) + 8 * t, fy: oy};
  return (
    <AbsoluteFill>
      <Atmos f={p.f} />
      {floor && <Floor f={p.f} />}
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 4 * Math.sin(p.f / 23)}px, ${jl.y + 5 * Math.sin(p.f / 17 + 1) + 4 * t}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {dim > 0 && <AbsoluteFill style={{background: '#06080C', opacity: dim}} />}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill={ST.ink} stroke="#F4F6F7" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F4F6F7">{CHIP}</text>
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

// ---- the world -----------------------------------------------------------------------------------------------------------------------
/** pale overcast sky with drifting cloud bands and falling snow specks; a flat neutral field. */
const Atmos: React.FC<{f: number}> = ({f}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#C3CDD7" />
        <stop offset="0.34" stopColor="#E3E8EC" />
        <stop offset="1" stopColor="#D2D9DF" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill="url(#sky)" />
    {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={((i * 331 + f * (0.5 + i * 0.12)) % 1500) - 200} cy={120 + i * 92} rx={300 + i * 30} ry={26 + (i % 2) * 10} fill="#FFFFFF" opacity={0.28} />)}
    {Array.from({length: 36}).map((_, i) => <circle key={`s${i}`} cx={(i * 197 + f * (0.8 + (i % 4) * 0.25) * 0.5) % 1100} cy={(i * 131 + f * (1.3 + (i % 3) * 0.4)) % 1700} r={1.8 + (i % 3)} fill="#FFFFFF" opacity={0.55} />)}
  </svg>
);

/** the desk or ground band under the square: warm umber with grain, stone chips and a soft edge, so the 9:16 never shows a flat lower third. */
const Floor: React.FC<{f: number}> = ({f}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
    <defs><linearGradient id="floorg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A4338" /><stop offset="0.5" stopColor="#3A342B" /><stop offset="1" stopColor="#25211B" /></linearGradient></defs>
    <g data-band="ok">
      <rect x={0} y={1476} width={W} height={444} fill="url(#floorg)" />
      <rect x={0} y={1476} width={W} height={10} fill="#6B6253" />
      {Array.from({length: 16}).map((_, i) => <path key={i} d={`M ${-40 + i * 80},${1500 + (i % 3) * 14} q 40,${10 + (i % 4) * 6} 90,0`} fill="none" stroke="#5E5546" strokeWidth={3} opacity={0.5} />)}
      {Array.from({length: 22}).map((_, i) => <circle key={`c${i}`} cx={(i * 151 + f * 0.3) % 1080} cy={1530 + ((i * 67) % 360)} r={3 + (i % 4)} fill={i % 2 ? '#7A6F5E' : '#1C1814'} opacity={0.45} />)}
      <ellipse cx={540} cy={1480} rx={560} ry={22} fill="#000" opacity={0.18} />
    </g>
  </svg>
);

const ICE: Array<[number, number, number, number]> = [[140, 20, 120, 16], [420, 70, 190, 22], [720, 30, 150, 18], [940, 90, 130, 14], [260, 150, 170, 20], [620, 170, 220, 24], [880, 210, 160, 18], [80, 240, 110, 14], [500, 270, 180, 20], [760, 320, 140, 16]];

/** THE GROUND: horizon town, road slab, stone and umber strata, bone-white ice lenses, one terracotta thaw line. y0 is the road's top. */
const Ground: React.FC<{f: number; y0?: number; glint?: number; thawLine?: number; slabW?: number; slabX?: number}> = ({f, y0 = 600, glint = 1, thawLine = 1, slabW = 1300, slabX = -110}) => {
  const wob = (x: number) => 6 * Math.sin(x / 70 + f / 16) + 3 * Math.sin(x / 31 - f / 11);
  const thawPath = `M -40,${y0 + 150 + wob(0)} ` + Array.from({length: 15}).map((_, i) => `L ${i * 80},${y0 + 150 + wob(i * 80)}`).join(' ') + ` L 1140,${y0 + 150}`;
  return (
    <g>
      <g data-band="ok" opacity={0.85}>
        <polygon points={`-40,${y0 - 6} 60,${y0 - 40} 130,${y0 - 14} 210,${y0 - 52} 300,${y0 - 20} 420,${y0 - 58} 520,${y0 - 24} 640,${y0 - 60} 760,${y0 - 22} 860,${y0 - 54} 960,${y0 - 18} 1120,${y0 - 46} 1120,${y0 - 6}`} fill="#E6EDF1" stroke={ST.ink} strokeWidth={3} opacity={0.8} />
      </g>
      <g data-band="ok" opacity={0.9}>
        {[[60, 40, 70], [170, 34, 54], [260, 52, 86], [360, 36, 60], [880, 46, 76], [990, 38, 58]].map(([x, w, h], i) => (
          <g key={i}><rect x={x} y={y0 - h} width={w} height={h} fill="#9AA4AE" stroke={ST.ink} strokeWidth={3} /><polygon points={`${x - 4},${y0 - h} ${x + w / 2},${y0 - h - 18} ${x + w + 4},${y0 - h}`} fill="#7C8792" stroke={ST.ink} strokeWidth={3} /></g>
        ))}
        <g transform={`translate(930 ${y0 - 4})`}><rect x={-4} y={-110} width={8} height={112} fill="#5E5A55" stroke={ST.ink} strokeWidth={2} /><rect x={-92} y={-132} width={184} height={36} rx={4} fill="#F4F6F7" stroke={ST.ink} strokeWidth={3} /><text y={-107} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={1} fill={ST.ink}>UTQIAGVIK</text></g>
        <rect x={600} y={y0 - 200} width={8} height={200} fill="#7C8792" stroke={ST.ink} strokeWidth={2} />
        <circle cx={604} cy={y0 - 204} r={7} fill="#FFFFFF" stroke={ST.ink} strokeWidth={2} opacity={0.6 + 0.4 * Math.sin(f / 9)} />
      </g>
      <rect x={slabX} y={y0} width={slabW} height={62} rx={4} fill={ST.road} stroke={ST.ink} strokeWidth={6} />
      <rect x={slabX} y={y0} width={slabW} height={10} fill="#FFFFFF" opacity={0.22} />
      {Array.from({length: 14}).map((_, i) => <rect key={i} x={slabX + 30 + i * 100 - ((f * 1.2) % 100)} y={y0 + 26} width={54} height={8} rx={3} fill="#EDEFF1" opacity={0.85} />)}
      <rect x={-60} y={y0 + 62} width={1200} height={90} fill={ST.stone} />
      <rect x={-60} y={y0 + 62} width={1200} height={14} fill="#000" opacity={0.2} />
      <rect x={-60} y={y0 + 152} width={1200} height={300} fill={ST.umber} />
      <rect x={-60} y={y0 + 452} width={1200} height={1000} fill={ST.umberD ?? '#2E2A24'} />
      {Array.from({length: 46}).map((_, i) => <circle key={i} cx={(i * 97) % 1080} cy={y0 + 90 + ((i * 53) % 1200)} r={3 + (i % 4)} fill={i % 3 === 0 ? '#7A6F5E' : '#1C1814'} opacity={0.5} />)}
      {ICE.map(([x, dy, w, h], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y0 + 190 + dy} rx={w / 2} ry={h / 2} fill={ST.glacier} stroke={ST.ink} strokeWidth={3} />
          <ellipse cx={x - w * 0.18} cy={y0 + 186 + dy} rx={w * 0.2} ry={h * 0.18} fill="#FFFFFF" opacity={0.35 + glint * 0.4 * Math.abs(Math.sin(f / 13 + i * 1.7))} />
        </g>
      ))}
      {thawLine > 0 && <path d={thawPath} fill="none" stroke={ST.honey} strokeWidth={5} strokeLinecap="round" opacity={thawLine} />}
    </g>
  );
};

/** continuous idle life for any held figure. */
const Idle: React.FC<{f: number; x: number; y: number; seed?: number; amp?: number; children: React.ReactNode}> = ({f, x, y, seed = 0, amp = 2.2, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${1.6 * amp * Math.sin(f / 26 + seed)}) scale(${1 + 0.018 * amp * Math.sin(f / 15 + seed)} ${1 - 0.022 * amp * Math.sin(f / 15 + seed)}) translate(${-x} ${-y})`}>{children}</g>
);
const vis = (f: number, b: (id: number) => number, ks: number[], i: number) => ease(f, b(ks[i]), 14) * (i < ks.length - 1 ? 1 - ease(f, b(ks[i + 1]) - 10, 8) : 1);

/** a typewriter that reveals rows over k 0..1. */
const Typed: React.FC<{x: number; y: number; rows: string[]; k: number; size?: number; fill?: string}> = ({x, y, rows, k, size = 28, fill = ST.ink}) => {
  const total = rows.join('').length;
  let left = Math.round(total * clamp01(k));
  return (
    <g>
      {rows.map((r, i) => {
        const n = Math.max(0, Math.min(r.length, left));
        left -= r.length;
        return <text key={i} x={x} y={y + i * (size + 14)} fontFamily={MONO} fontWeight={800} fontSize={size} fill={fill}>{r.slice(0, n)}</text>;
      })}
    </g>
  );
};

/** pewter field instruments ------------------------------------------------------------------------------------------------------------ */
const Interrogator: React.FC<{x: number; y: number; s?: number; lamp?: number; f: number}> = ({x, y, s = 1, lamp = 0, f}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={118} rx={170} ry={16} fill="#000" opacity={0.28} />
    <rect x={-150} y={-100} width={300} height={210} rx={22} fill={ST.steelD} stroke={ST.ink} strokeWidth={8} />
    <rect x={-140} y={-90} width={280} height={190} rx={18} fill={ST.steel} />
    <rect x={-140} y={-90} width={280} height={60} rx={18} fill="#fff" opacity={0.14} />
    <rect x={-110} y={-50} width={150} height={60} rx={8} fill="#1C1F2A" stroke={ST.ink} strokeWidth={4} />
    <path d={`M -100,-20 ${Array.from({length: 12}).map((_, i) => `L ${-100 + i * 12},${-20 + 14 * Math.sin(i * 1.3 + f / 6)}`).join(' ')}`} fill="none" stroke="#EDE6FF" strokeWidth={4} />
    <circle cx={92} cy={-24} r={16} fill={lamp > 0.5 ? '#FFFFFF' : '#59606A'} stroke={ST.ink} strokeWidth={5} />
    {lamp > 0.5 && <circle cx={92} cy={-24} r={30 + 5 * Math.sin(f / 6)} fill="#FFFFFF" opacity={0.28} />}
    <rect x={-132} y={50} width={264} height={36} rx={6} fill="#2B3038" />
    <text x={0} y={76} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1} fill="#F4F6F7">INTERROGATOR</text>
  </g>
);

const Jar: React.FC<{x: number; y: number; k: number; f: number}> = ({x, y, k, f}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-34} y={-52} width={68} height={104} rx={14} fill="#E9EEF0" stroke={ST.ink} strokeWidth={5} opacity={0.9} />
    <rect x={-28} y={-6 - 36 * k} width={56} height={46 + 36 * k} rx={10} fill="#FFFFFF" opacity={0.25 + 0.6 * k + 0.1 * Math.sin(f / 8) * k} />
    <rect x={-40} y={-64} width={80} height={16} rx={6} fill={ST.steelD} stroke={ST.ink} strokeWidth={4} />
  </g>
);

/** a needle dial with an uncertainty arc. arc 0..1 is how wide the pale wedge is, 1 = wide. */
const Needle: React.FC<{x: number; y: number; r?: number; f: number; arc: number; label: string; phase?: number}> = ({x, y, r = 150, f, arc, label, phase = 0}) => {
  const mid = -90 + 18 * Math.sin(f / 21 + phase);
  const half = 10 + 62 * arc;
  const sw = mid + (half * 0.55) * Math.sin(f / (5 + 3 * arc) + phase) * (0.35 + arc);
  const pt = (a: number, rr: number) => `${Math.cos((a * Math.PI) / 180) * rr},${Math.sin((a * Math.PI) / 180) * rr}`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={4} cy={r + 36} rx={r * 0.85} ry={14} fill="#000" opacity={0.24} />
      <circle r={r + 12} fill={ST.steelD} stroke={ST.ink} strokeWidth={8} />
      <circle r={r} fill={ST.paper} stroke={ST.ink} strokeWidth={5} />
      <path d={`M 0,0 L ${pt(mid - half, r - 14)} A ${r - 14} ${r - 14} 0 0 1 ${pt(mid + half, r - 14)} Z`} fill="#BFC7CC" stroke={ST.ink} strokeWidth={3} opacity={0.9} />
      {Array.from({length: 13}).map((_, i) => { const a = -180 + i * 15; return <line key={i} x1={Math.cos((a * Math.PI) / 180) * (r - 30)} y1={Math.sin((a * Math.PI) / 180) * (r - 30)} x2={Math.cos((a * Math.PI) / 180) * (r - 8)} y2={Math.sin((a * Math.PI) / 180) * (r - 8)} stroke={ST.ink} strokeWidth={4} />; })}
      <line x1={0} y1={0} x2={Math.cos((sw * Math.PI) / 180) * (r - 24)} y2={Math.sin((sw * Math.PI) / 180) * (r - 24)} stroke={ST.ink} strokeWidth={9} strokeLinecap="round" />
      <circle r={12} fill={ST.ink} />
      <text y={r * 0.5} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={Math.max(16, r * 0.12)} letterSpacing={1.5} fill={ST.ink}>{label}</text>
    </g>
  );
};

const TOPS = [{k: 4, t: 'STUB'}, {k: 15, t: 'FED'}, {k: 28, t: 'MEASURED'}, {k: 42, t: 'HAIRLINE'}, {k: 48, t: 'SLIVER'}, {k: 51, t: 'DASHED'}, {k: 55, t: 'OPEN'}];
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
        <text x={60} y={150} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill="#1C1F2A" opacity={0.85}>THE RECORD RIBBON</text>
        {TOPS.map((q, i) => {
          const x = 44 + i * 138, on = i <= cur, now = i === cur;
          return (
            <g key={i} transform={`translate(${x} 205)`}>
              <rect x={0} y={-34} width={128} height={68} rx={10} fill={now ? ST.ink : on ? '#B8BEC4' : '#E9ECEF'} stroke={ST.ink} strokeWidth={now ? 5 : 3} opacity={on ? 1 : 0.85} />
              <text x={64} y={7} textAnchor="middle" fontFamily={MONO} fontSize={q.t.length > 7 ? 17 : 22} fontWeight={900} fill={now ? '#FFFFFF' : ST.ink}>{q.t}</text>
            </g>
          );
        })}
        <line x1={44} y1={270} x2={1020} y2={270} stroke={ST.ink} strokeWidth={3} strokeDasharray="14 9" opacity={0.5} />
        <circle cx={44 + Math.max(0, cur) * 138 + 64} cy={270} r={9} fill={ST.ink} stroke={ST.ink} strokeWidth={3} />
      </g>
    </svg>
  );
};

// ---- S1: the wake ---------------------------------------------------------------------------------------------------------------------------
const Hold: React.FC<{f: number; x: number; y: number; w: number; h: number; seed?: number; mode?: 'sweep' | 'shadow'; period?: number}> = ({f, x, y, w, h, seed = 0, mode = 'sweep', period = 2.6}) => (
  <HeldTravel f={f} x={x} y={y} w={w} h={h} mode={mode} period={period} seed={seed} color="#FFFFFF" />
);

const Ruler: React.FC<{x: number; y: number; w: number; f: number; lit?: number; label?: string; p?: number}> = ({x, y, w, f, lit = 0, label = '1 KM', p = 1}) => (
  <g opacity={clamp01(p * 2)}>
    <rect x={x} y={y - 22} width={w * clamp01(p)} height={44} rx={5} fill="#D9D5CB" stroke={ST.ink} strokeWidth={5} />
    {Array.from({length: 11}).map((_, i) => <line key={i} x1={x + (w * i) / 10} y1={y - 22} x2={x + (w * i) / 10} y2={y + (i % 5 === 0 ? 4 : -2)} stroke={ST.ink} strokeWidth={i % 5 === 0 ? 5 : 3} opacity={p > i / 10 ? 1 : 0} />)}
    {lit > 0 && <rect x={x + 3} y={y - 19} width={w * 0.1 - 6} height={38} rx={3} fill="#FFFFFF" opacity={0.5 + 0.3 * Math.sin(f / 7)} />}
    <text x={x + w} y={y + 52} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={2} fill={ST.ink} opacity={p > 0.9 ? 1 : 0}>{label}</text>
  </g>
);

const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [1, 3, 4];
  const drop = clamp01((f - 4) / 16);
  const dropY = lerp(440, 884, drop * drop);
  const mood = f < 20 ? 'calm' : f < 46 ? 'startled' : f < b(3) + 30 ? 'calm' : 'proud';
  const bd = ease(f, b(3), 34);
  const slide = ease(f, b(4) + 4, 30);
  const rk = ease(f, b(4), 22);
  return (
    <Frame p={p} floor={false} cam={track([{t: 0, z: 1.55, fx: 600, fy: 930}, {t: 70, z: 1.3, fx: 600, fy: 940}, {t: 170, z: 1.06, fx: 560, fy: 950}, {t: 400, z: 1.1, fx: 580, fy: 950}])}>
      <SVG>
        <Ground f={f} y0={600} glint={1} thawLine={1} />
        <Strand x={800} y={1070} f={f} len={860} draw={bd} face={false} dim={bd} seed={2} />
        <HeldProp f={f} px={800} py={1010} w={150} h={130} seed={1} kind="rest" gain={0.6}>
          <Strand x={800} y={940} f={f} len={1000} mood={mood} look={0.6} seed={1} />
        </HeldProp>
        {drop < 1 && <ellipse cx={800} cy={dropY} rx={9} ry={14} fill={ST.honey} stroke={ST.ink} strokeWidth={3} />}
        {drop >= 1 && f < 34 && <circle cx={800} cy={884} r={16 + (f - 20) * 1.4} fill="none" stroke={ST.honey} strokeWidth={3} opacity={clamp01(1 - (f - 20) / 14)} />}
        <Ribbon x={880} y={940} w={Math.max(1, 190 * slide)} h={58} f={f} ticks={0} label={false} />
        <Ruler x={100} y={1190} w={880} f={f} p={rk} />
        <Plate x={660} y={520} text="UTQIAGVIK ROAD EMBANKMENT" size={30} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={660} y={520} text="2 CABLES" size={30} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={660} y={520} text="1 KM EACH" size={30} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

// ---- S2: the field station --------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [5, 7, 8, 9];
  const ticks = clamp01((f - b(5)) / Math.max(30, b(7) + 40 - b(5)));
  const penK = ease(f, b(5) + 40, 26);
  const cal = springy(f, b(8), 22);
  const dim = 1 - 0.65 * ease(f, b(8) + 6, 20);
  const dial = springy(f, b(9), 28);
  const seg = Array.from({length: 18}).map((_, i) => `L ${560 + i * 24},${985 - 18 + 16 * Math.sin(i * 1.4 + f / 5)}`).join(' ');
  return (
    <Frame p={p} z0={1.03} z1={1.1} ox={540} oy={960} floor={false}>
      <SVG>
        <Ground f={f} y0={640} glint={0.6} thawLine={0} />
        <rect data-band="ok" x={-40} y={1040} width={1160} height={300} fill="#4B5057" stroke={ST.ink} strokeWidth={6} />
        <rect x={-40} y={1040} width={1160} height={22} fill="#7A8087" />
        <path d="M 294,1120 C 340,1120 330,1100 330,1050" fill="none" stroke={ST.ink} strokeWidth={40} strokeLinecap="round" />
        <path d="M 294,1120 C 340,1120 330,1100 330,1050" fill="none" stroke={ST.ivory} strokeWidth={28} strokeLinecap="round" />
        <Strand x={210} y={1125} f={f} len={300} mood="curious" look={1} seed={3} />
        <HeldProp f={f} px={330} py={1045} w={320} h={230} seed={2} kind="rest" gain={0.7}>
          <Interrogator x={330} y={925} s={1.1} lamp={ease(f, b(5), 10)} f={f} />
        </HeldProp>
        <Ribbon x={560} y={985} w={450} h={58} f={f} ticks={ticks} label={false} />
        <path d={`M 560,985 ${seg}`} fill="none" stroke={ST.ink} strokeWidth={4} opacity={0.0} />
        <path d={`M 562,985 ${seg}`} fill="none" stroke={ST.ink} strokeWidth={5} strokeLinecap="round" pathLength={100} strokeDasharray={`${100 * penK} 100`} transform="translate(0 -62)" />
        <g transform={`translate(${560 + 410 * penK} 905)`} opacity={penK > 0.02 && penK < 0.99 ? 1 : 0}><rect x={-6} y={-70} width={12} height={74} fill="#2B3038" stroke={ST.ink} strokeWidth={3} /><polygon points="-6,4 6,4 0,18" fill={ST.ink} /></g>
        <Ruler x={90} y={1262} w={900} f={f} p={ease(f, b(7), 22)} label="1 KM" />
        <g opacity={dim}><rect x={180} y={1240} width={810} height={44} rx={5} fill="#4B5057" opacity={0.0} /></g>
        <rect x={180} y={1236} width={812} height={52} fill="#4B5057" opacity={ease(f, b(8) + 6, 20) * 0.6} />
        <g transform={`translate(0 ${lerp(-200, 0, cal)})`} opacity={clamp01(cal * 3)}>
          <rect x={86} y={1218} width={10} height={86} fill={ST.steel} stroke={ST.ink} strokeWidth={3} />
          <rect x={174} y={1218} width={10} height={86} fill={ST.steel} stroke={ST.ink} strokeWidth={3} />
          <rect x={86} y={1210} width={98} height={12} fill={ST.steelD} stroke={ST.ink} strokeWidth={3} />
        </g>
        <g transform={`translate(905 ${lerp(300, 600, dial)}) scale(0.95)`} opacity={clamp01(dial * 3)}>
          <Dial x={0} y={0} f={f} tape={1} hang />
        </g>
        <Plate x={540} y={520} text="FIELD STATION" size={30} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={520} text="SEPT 2021 TO JUNE 2024" size={30} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="100 METERS" size={30} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="?" size={44} tone="dark" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

// ---- S3: who built it --------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [13];
  const draw = ease(f, b(10), 56);
  const swing = easeIO(f, b(13), 30);
  const dx = lerp(880, 700, swing), dy = lerp(620, 1010, swing), ds = lerp(0.8, 1.0, swing);
  const press = bump(f, b(13) + 95, 16);
  const peek = ease(f, b(13) + 8, 20) * (1 - ease(f, b(14) + 12, 16));
  const pl = (k: number) => ease(f, b(k), 16);
  return (
    <Frame p={p} z0={1.02} z1={1.07} oy={960}>
      <SVG>
        <rect data-band="ok" x={-60} y={380} width={1200} height={1000} fill="#CDD3D8" />
        {Array.from({length: 7}).map((_, i) => <line key={i} x1={-60} y1={440 + i * 140} x2={1140} y2={440 + i * 140} stroke="#B3BBC2" strokeWidth={3} />)}
        <rect x={850} y={640} width={150} height={620} rx={6} fill="#1C1F2A" stroke={ST.ink} strokeWidth={8} />
        <rect x={860} y={650} width={130} height={600} fill="#0E1020" />
        <path d="M -30,1180 C 260,1180 330,860 560,840 S 800,900 940,980" fill="none" stroke={ST.ink} strokeWidth={36} strokeLinecap="round" pathLength={100} strokeDasharray={`${100 * draw} 100`} />
        <path d="M -30,1180 C 260,1180 330,860 560,840 S 800,900 940,980" fill="none" stroke={ST.paper} strokeWidth={26} strokeLinecap="round" pathLength={100} strokeDasharray={`${100 * draw} 100`} />
        <Plate x={400} y={640} text="PENN STATE · DIGITAL TWIN" size={28} p={pl(10)} drop={60} />
        <Plate x={400} y={735} text="DMITRY NICOLSKY" size={28} p={pl(11)} drop={60} />
        <Plate x={400} y={830} text="UNIVERSITY OF ALASKA FAIRBANKS" size={22} p={pl(12)} drop={60} />
        {[640, 735, 830].map((y, i) => <circle key={i} cx={400 + (i === 0 ? 245 : i === 1 ? 175 : 250)} cy={y} r={9} fill={ST.paper} stroke={ST.ink} strokeWidth={4} opacity={pl(10 + i)} />)}
        <rect x={470} y={1262} width={140} height={26} rx={6} fill="#1C1F2A" />
        <Strand x={540} y={1300 - 80 * peek} f={f} len={60} mood="curious" look={0.8} draw={0.1} pulse={false} dim={clamp01(peek * 3)} seed={4} />
        <HeldProp f={f} px={dx} py={dy + 120} w={240} h={260} seed={3} kind="hang" gain={0.8}>
          <Dial x={dx} y={dy} s={ds} f={f} tape={1} hang={swing < 0.98} wobble={1 - swing * 0.9} rot={-press * 6} />
        </HeldProp>
        <Plate x={540} y={520} text="HOW CLOSE DOES IT GET?" size={28} tone="glow" p={vis(f, b, K, 0)} />
      </SVG>
    </Frame>
  );
};

// ---- S4: network in solver ---------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [15, 16, 17, 18];
  const feed = ease(f, b(15) + 4, 44);
  const kn = springy(f, b(16), 22);
  const j1 = ease(f, b(17), 18), j2 = ease(f, b(18), 18);
  return (
    <Frame p={p} z0={1.02} z1={1.1} oy={960}>
      <SVG>
        <rect data-band="ok" x={-60} y={380} width={1200} height={1000} fill="#B8C0C8" />
        <rect data-band="ok" x={-60} y={1230} width={1200} height={160} fill="#8F979F" />
        <Ribbon x={lerp(-780, -600, feed) + 0} y={905} w={820} h={58} f={f} ticks={1} label={false} />
        <HeldProp f={f} px={540} py={1180} w={760} h={600} seed={5} kind="rest" gain={0.5}>
          <Heat x={540} y={880} s={1.45} f={f} needle={0.4 + 0.3 * j1 + 0.2 * j2} label="HEAT SOLVER">
            <g transform={`translate(0 ${lerp(-230, 0, kn)}) scale(1.5)`} opacity={clamp01(kn * 3)}><Knot x={0} y={0} f={f} guess={0.1 + 0.3 * j2} wave={bump(f, b(16) + 14, 20)} /></g>
          </Heat>
        </HeldProp>
        <Needle x={270} y={540} r={72} f={f} arc={0.6} label="" phase={1} />
        <Jar x={150} y={560} k={j1} f={f} />
        <Needle x={810} y={540} r={72} f={f} arc={0.6} label="" phase={2} />
        <Jar x={930} y={560} k={j2} f={f} />
        <Plate x={540} y={1236} text="HEAT TRANSFER SOLVER" size={30} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={1236} text="NEURAL NETWORK" size={30} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={1236} text="UNFROZEN WATER" size={30} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={1236} text="THERMAL CONDUCTIVITY" size={30} tone="dark" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

// ---- S5: it adjusts ----------------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [19, 21, 23];
  const narrow = ease(f, b(21), 54) * 0.7 + 0.3 * springy(f, b(21) + 60, 14);
  const arc = 1 - narrow;
  const by = ease(f, b(20), 22);
  const tag = springy(f, b(23), 26);
  const named = bump(f, b(23) + 70, 30);
  const beads = Array.from({length: 9}).map((_, i) => {
    const t0 = b(21) + i * 7;
    const x = 140 + clamp01((f - t0) / 70) * 720;
    return {x, on: f > t0 && f < t0 + 80};
  });
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={960}>
      <SVG>
        <rect data-band="ok" x={-60} y={380} width={1200} height={1000} fill="#C9CFD4" />
        <rect x={-60} y={380} width={1200} height={8} fill="#A9B1B8" />
        <Needle x={290} y={820} r={190} f={f} arc={arc} label="UNFROZEN WATER" phase={0.5} />
        <Needle x={790} y={820} r={190} f={f} arc={arc} label="CONDUCTIVITY" phase={2.4} />
        <HeldProp f={f} px={540} py={1170} w={830} h={70} seed={5} kind="rest" gain={0.8}><Ribbon x={130} y={1130} w={820} h={58} f={f} ticks={1} label={false} /></HeldProp>
        {beads.map((q, i) => q.on && <circle key={i} cx={q.x} cy={1130} r={9} fill="#FFFFFF" stroke={ST.ink} strokeWidth={3} />)}
        <g transform={`translate(0 ${lerp(-420, 0, by)})`} opacity={clamp01(by * 2) * (1 - ease(f, b(23) - 6, 8))}><Lab text="XIAO · PUBLISHED ESSAY" x={540} y={1030} size={24} /></g>
        <Lab text="EOS EDITORS" x={540} y={640} size={26} p={ease(f, 6, 14) * (1 - ease(f, b(20) - 8, 8))} />
        <NumTag x={540} y={620} s={0.72} text="?" drop={tag} f={f} />
        <g transform="translate(540 905) rotate(-8)" opacity={clamp01(named * 1.6)}><Lab text="NAMED" x={0} y={0} size={26} tone="glow" /></g>
        <Plate x={540} y={1236} text="UNCERTAIN SOIL PROPERTIES" size={28} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={1236} text="NEW DATA IN · MODEL ADJUSTS" size={28} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={1236} text="ONE MORE NUMBER" size={30} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

// ---- S6: three witnesses -----------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [25, 26, 27];
  const l1 = ease(f, b(25), 20), l2 = ease(f, b(26), 20), l3 = ease(f, b(27), 20);
  const slide = ease(f, 0, 30);
  const peek = ease(f, 6, 22);
  const glow = (k: number, x: number, y: number, r: number) => k > 0.02 && <circle cx={x} cy={y} r={r * (0.7 + 0.3 * k)} fill="#FFFFFF" opacity={0.35 * k + 0.1 * Math.sin(f / 7) * k} />;
  const wig = `M 100,1130 ${Array.from({length: 40}).map((_, i) => `L ${100 + i * 22},${1130 + 14 * Math.sin(i * 0.9)}`).join(' ')}`;
  return (
    <Frame p={p} z0={1.02} z1={1.08} oy={960}>
      <SVG>
        <rect data-band="ok" x={-60} y={380} width={1200} height={1000} fill="#D3D8DC" />
        <rect x={-60} y={1000} width={1200} height={330} fill="#A9B1B8" />
        <rect x={-60} y={1000} width={1200} height={10} fill="#8A929A" />
        <g transform={`translate(${lerp(-300, 0, slide)} 0)`}>
          {glow(l1, 200, 820, 190)}
          <ellipse cx={200} cy={1010} rx={130} ry={16} fill="#000" opacity={0.26} />
          <rect x={90} y={720} width={220} height={290} rx={16} fill={ST.steelD} stroke={ST.ink} strokeWidth={7} />
          <ellipse cx={200} cy={720} rx={110} ry={26} fill={ST.steel} stroke={ST.ink} strokeWidth={6} />
          <rect x={110} y={760} width={180} height={190} rx={6} fill={ST.paper} stroke={ST.ink} strokeWidth={4} />
          <path d={`M 118,855 ${Array.from({length: 11}).map((_, i) => `L ${118 + i * 16},${855 + 40 * Math.sin(i * 1.1 + f / 7) * (0.4 + l1)}`).join(' ')}`} fill="none" stroke={ST.ink} strokeWidth={4} />
          <circle cx={282} cy={745} r={9} fill={l1 > 0.5 ? '#FFFFFF' : '#59606A'} stroke={ST.ink} strokeWidth={4} />
        </g>
        <g transform={`translate(0 ${lerp(300, 0, slide)})`}>
          {glow(l2, 540, 800, 200)}
          <ellipse cx={540} cy={1010} rx={90} ry={14} fill="#000" opacity={0.26} />
          <rect x={526} y={600} width={28} height={410} rx={8} fill={ST.steel} stroke={ST.ink} strokeWidth={6} />
          {Array.from({length: 8}).map((_, i) => <circle key={i} cx={540} cy={650 + i * 48} r={15} fill={l2 * 8 > i ? '#FFFFFF' : '#59606A'} stroke={ST.ink} strokeWidth={4} />)}
          <rect x={470} y={590} width={140} height={22} rx={6} fill={ST.steelD} stroke={ST.ink} strokeWidth={5} />
        </g>
        <g transform={`translate(${lerp(300, 0, slide)} 0)`}>
          {glow(l3, 880, 840, 190)}
          <ellipse cx={880} cy={1010} rx={130} ry={16} fill="#000" opacity={0.26} />
          <rect x={770} y={720} width={220} height={290} rx={18} fill={ST.steelD} stroke={ST.ink} strokeWidth={7} />
          <rect x={792} y={760} width={176} height={150} rx={10} fill="#1C1F2A" stroke={ST.ink} strokeWidth={5} />
          <rect x={800} y={768} width={160} height={134} rx={6} fill="#FFFFFF" opacity={0.15 + 0.7 * l3} />
          <circle cx={960} cy={740} r={8} fill={l3 > 0.5 ? '#FFFFFF' : '#59606A'} stroke={ST.ink} strokeWidth={3} />
        </g>
        <g transform={`translate(${lerp(-760, 0, slide)} 0)`}>
          <HeldProp f={f} px={540} py={1170} w={890} h={60} seed={6} kind="rest" gain={0.8}><Ribbon x={100} y={1130} w={880} h={50} f={f} ticks={1} label={false} /></HeldProp>
          <path d={wig} fill="none" stroke={ST.ink} strokeWidth={4} opacity={0.7} transform="translate(0 0)" />
        </g>
        <Strand x={540} y={1300 - 80 * peek} f={f} len={60} mood="proud" look={0.6} draw={0.1} pulse={false} dim={clamp01(peek * 3)} seed={5} />
        <Plate x={540} y={520} text="SEISMIC" size={36} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={520} text="BOREHOLE" size={36} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="LAB" size={36} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

// ---- S7: the one road ruler --------------------------------------------------------------------------------------------------------------
const coastPts = Array.from({length: 61}).map((_, i) => {
  const x = -18000 + i * 600;
  return [x, 560 + 460 * Math.sin(x / 2300) + 280 * Math.sin(x / 870 + 1) + 120 * Math.sin(x / 311)] as [number, number];
});
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [28, 29, 30, 31, 32];
  const k = easeIO(f, 0, Math.max(60, b(32) + 40));
  const sc = lerp(2.4, 0.045, Math.pow(k, 0.62));
  const caliper = springy(f, b(29), 22);
  const town = springy(f, b(30), 24);
  const therm = ease(f, b(31), 24);
  const fail = springy(f, b(32), 20);
  const coast = `M ${coastPts[0][0]},${coastPts[0][1]} ` + coastPts.slice(1).map(([x, y]) => `L ${x},${y}`).join(' ');
  return (
    <Frame p={p} z0={1.0} z1={1.04} oy={960}>
      <SVG>
        <g transform={`translate(540 900) scale(${sc}) translate(-540 -900)`}>
          <path d={`${coast} L 18000,3000 L -18000,3000 Z`} fill="#9FB3C2" />
          <path d={`${coast} L 18000,-3000 L -18000,-3000 Z`} fill="#EEF2F2" />
          <path d={coast} fill="none" stroke={ST.ink} strokeWidth={3} vectorEffect="non-scaling-stroke" />
          {Array.from({length: 90}).map((_, i) => <path key={`t${i}`} d={`M ${-3200 + ((i * 713) % 6400)},${640 + ((i * 97) % 260)} q 14,-18 28,0`} fill="none" stroke={ST.ink} strokeWidth={2} vectorEffect="non-scaling-stroke" opacity={0.45} />)}
          <rect x={320} y={924} width={440} height={60} fill={ST.stone} stroke={ST.ink} strokeWidth={3} vectorEffect="non-scaling-stroke" />
          <rect x={340} y={880} width={400} height={44} rx={4} fill={ST.road} stroke={ST.ink} strokeWidth={3} vectorEffect="non-scaling-stroke" />
          <rect x={340} y={896} width={400} height={5} fill="#EDEFF1" opacity={0.9} />
          {Array.from({length: 40}).map((_, i) => <polygon key={i} points={`${-12000 + i * 600},${620 + 40 * Math.sin(i)} ${-12000 + i * 600 + 260},${560 + 40 * Math.sin(i)} ${-12000 + i * 600 + 420},${640 + 30 * Math.sin(i * 2)}`} fill="#F4F6F7" stroke={ST.ink} strokeWidth={2} vectorEffect="non-scaling-stroke" opacity={0.85} />)}
          <g opacity={caliper}>
            <rect x={340} y={850} width={400} height={14} fill="#FFFFFF" stroke={ST.ink} strokeWidth={3} vectorEffect="non-scaling-stroke" />
            <rect x={334} y={850} width={12} height={86} fill={ST.steel} stroke={ST.ink} strokeWidth={3} vectorEffect="non-scaling-stroke" />
            <rect x={734} y={850} width={12} height={86} fill={ST.steel} stroke={ST.ink} strokeWidth={3} vectorEffect="non-scaling-stroke" />
          </g>
          <circle cx={540} cy={820} r={30 / Math.max(0.2, sc)} fill="#FFFFFF" stroke={ST.ink} strokeWidth={3} vectorEffect="non-scaling-stroke" opacity={town * 0.9} />
        </g>
        <rect x={0} y={1110} width={1080} height={190} fill={ST.umber} stroke={ST.ink} strokeWidth={6} />
        <rect x={0} y={1110} width={1080} height={14} fill={ST.stone} />
        <HeldProp f={f} px={180} py={1180} w={240} h={40} seed={7} kind="rest" gain={0.8}><Ribbon x={60} y={1160} w={240} h={36} f={f} ticks={0.8 + 0.2 * therm} label={false} /></HeldProp>
        <Strand x={820} y={1235} f={f} len={760} s={0.95} mood={f > b(30) && f < b(32) + 40 ? 'sag' : 'calm'} sag={bump(f, b(30), 40)} look={0.5} seed={6} />
        <HeldProp f={f} px={940} py={880} w={80} h={270} seed={8} kind="rest" gain={0.8}><g transform="translate(940 760)" opacity={therm}>
          <rect x={-14} y={-130} width={28} height={230} rx={14} fill="#FFFFFF" stroke={ST.ink} strokeWidth={5} />
          <circle cx={0} cy={110} r={30} fill="#FFFFFF" stroke={ST.ink} strokeWidth={5} />
          <rect x={-7} y={110 - 200 * therm} width={14} height={200 * therm} fill={ST.ink} />
        </g></HeldProp>
        <g transform={`translate(300 ${lerp(640, 1070, town)})`} opacity={clamp01(town * 2)}><Lab text="ONE TOWN" x={0} y={0} size={26} /></g>
        <g transform={`translate(540 ${lerp(640, 1050, fail)})`} opacity={clamp01(fail * 2)}>
          <Lab text="ROAD FAILURE" x={0} y={0} size={28} />
          <line x1={-140} y1={0} x2={140} y2={0} stroke={ST.ink} strokeWidth={8} />
        </g>
        <Plate x={540} y={520} text="THE FAIR CASE AGAINST IT" size={28} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={520} text="ONE ROAD" size={36} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="ONE TOWN" size={36} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="TEMPERATURE" size={36} tone="dark" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="NOT ROAD FAILURE" size={32} tone="dark" p={vis(f, b, K, 4)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

// ---- S8: the empty window ----------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [33, 34, 35, 36, 38];
  const roll = easeIO(f, 0, 34);
  const dx = lerp(1260, 540, roll);
  const peel = ease(f, b(36), 110);
  const tape = 1;
  const clear = ease(f, b(38), 16);
  const tremble = ease(f, b(34), 30);
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={960}>
      <SVG>
        <rect data-band="ok" x={-60} y={380} width={1200} height={1000} fill="#2B3036" />
        <defs><radialGradient id="pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.62} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></radialGradient></defs>
        <ellipse cx={540} cy={900} rx={480} ry={520} fill="url(#pool)" />
        <ellipse cx={540} cy={1130} rx={300} ry={26} fill="#000" opacity={0.3} />
        <HeldProp f={f} px={dx} py={1090} w={420} h={420} seed={8} kind="hang" gain={0.7}>
          <Dial x={dx} y={880} s={1.7} f={f} tape={1} peel={peel} hang={false} wobble={0.3 + tremble * 1.2} rot={(dx - 540) * 0.08} />
        </HeldProp>
        <HeldTravel f={f} x={340} y={680} w={400} h={400} mode="sweep" period={3.8} seed={9} color="#FFFFFF" clipD="M 340,880 a 200,200 0 1,0 400,0 a 200,200 0 1,0 -400,0" strength={0.22} />
        {clear > 0 && <ellipse cx={540} cy={880 + 85 * 1.7 * 0.0 + 52} rx={88 * clear} ry={34 * clear} fill="#FFFFFF" opacity={0.45 + 0.2 * Math.sin(f / 9)} />}
        <Ribbon x={60} y={1260} w={300} h={36} f={f} ticks={0.9} label={false} />
        <Plate x={540} y={520} text="RESEARCH FRAMEWORK" size={30} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={520} text="NO DEPLOYMENT REPORTED" size={28} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="ACCURACY" size={38} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="NO ACCURACY NUMBER IN PUBLIC SUMMARIES" displayLines={["NO ACCURACY NUMBER", "IN PUBLIC SUMMARIES"]} size={26} tone="dark" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="NOT IN PUBLIC SUMMARIES" size={30} tone="glow" p={vis(f, b, K, 4)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

// ---- S9: small claim -----------------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [40, 41];
  const hover = ease(f, 2, 22);
  const snap = springy(f, b(40), 16);
  const small = springy(f, b(41), 22);
  const fy = lerp(-120, 880, hover) + lerp(0, 0, snap);
  const fw = lerp(240, 100, snap);
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={960}>
      <SVG>
        <rect data-band="ok" x={-60} y={380} width={1200} height={1000} fill="#D6DBDF" />
        <ellipse cx={540} cy={1060} rx={460} ry={24} fill="#000" opacity={0.18} />
        <HeldProp f={f} px={540} py={1040} w={960} h={220} seed={9} kind="rest" gain={0.5}>
          <Ribbon x={120} y={930} w={840} h={110} f={f} ticks={1} label />
        </HeldProp>
        <Ruler x={120} y={1120} w={840} f={f} lit={snap} label="1 KM" />
        <g transform={`translate(${120 + (fw / 2) - 0} ${fy})`}>
          <rect x={-fw / 2} y={-80} width={fw} height={170} rx={10} fill="none" stroke={ST.steel} strokeWidth={14} />
          <rect x={-fw / 2} y={-80} width={fw} height={170} rx={10} fill="none" stroke={ST.ink} strokeWidth={4} />
          {[-1, 1].flatMap((sx) => [-1, 1].map((sy) => <circle key={`${sx}${sy}`} cx={sx * (fw / 2 - 7)} cy={sy * 74 + 5} r={5} fill={ST.steelD} stroke={ST.ink} strokeWidth={2} />))}
        </g>
        <Plate x={540} y={520} text="HOLDS UP AS A METHOD" size={32} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={520} text="THE CLAIM STAYS SMALL" size={32} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

// ---- S10: a separate clock ---------------------------------------------------------------------------------------------------------------
const X0 = 150, X1 = 930, Y0 = 1090, YT = 640;
const yrX = (yr: number) => X0 + ((yr - 2020) / 80) * (X1 - X0);
const pctY = (pc: number) => Y0 - (pc / 100) * (Y0 - YT);
const CURVE: Array<[number, number]> = [[2020, 2], [2030, 3], [2040, 5], [2050, 8], [2060, 20], [2070, 42], [2080, 65], [2095, 80]];
const Card: React.FC<{k: number; f: number; cliff: number; bars: [number, number, number]; labels?: boolean}> = ({k, f, cliff, bars, labels = true}) => {
  const pts = CURVE.filter(([y]) => y <= 2050 + cliff * 45).map(([y, v]) => [yrX(y), pctY(v)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x},${y}`).join(' ');
  return (
    <g opacity={clamp01(k * 2)} transform={`translate(0 ${lerp(60, 0, clamp01(k))})`}>
      <rect x={60} y={470} width={960} height={730} rx={12} fill="#E4E6E7" stroke={ST.ink} strokeWidth={14} />
      <line x1={X0} y1={Y0} x2={X1 + 30} y2={Y0} stroke={ST.ink} strokeWidth={5} />
      <line x1={X0} y1={Y0} x2={X0} y2={YT - 20} stroke={ST.ink} strokeWidth={5} />
      {[2020, 2040, 2060, 2080, 2100].map((yr) => <g key={yr}><line x1={yrX(yr)} y1={Y0} x2={yrX(yr)} y2={Y0 + 12} stroke={ST.ink} strokeWidth={4} /><text x={yrX(yr)} y={Y0 + 40} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={ST.ink}>{yr}</text></g>)}
      {[0, 50, 100].map((pc) => <g key={pc}><line x1={X0 - 10} y1={pctY(pc)} x2={X0} y2={pctY(pc)} stroke={ST.ink} strokeWidth={4} /><text x={X0 - 18} y={pctY(pc) + 7} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={18} fill={ST.ink}>{pc}%</text></g>)}
      {labels && <line x1={X0} y1={pctY(10)} x2={yrX(2050)} y2={pctY(10)} stroke={ST.ink} strokeWidth={3} />}
      <path d={d} fill="none" stroke={ST.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      {[[yrX(2091), bars[0], 80, '1'], [yrX(2095), bars[1], 60, '2'], [yrX(2099), bars[2], 90, '3']].map(([x, h, val, n], i) => {
        const hh = ((val as number) / 100) * (Y0 - YT) * (h as number);
        return <g key={i}><rect x={(x as number) - 14} y={Y0 - hh} width={28} height={hh} fill="#C9CDD0" stroke={ST.ink} strokeWidth={4} />{Array.from({length: Math.max(0, Math.floor(hh / 16) - 1)}).map((_, j) => <line key={j} x1={(x as number) - 14} y1={Y0 - hh + j * 16 + 20} x2={(x as number) + 14} y2={Y0 - hh + j * 16 + 10} stroke={ST.ink} strokeWidth={2} opacity={0.5} />)}{(h as number) > 0.95 && <text x={x as number} y={Y0 - hh - 10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={ST.ink}>~{val as number}%</text>}<text x={x as number} y={Y0 + 70} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={ST.ink} opacity={(h as number) > 0.05 ? 1 : 0.35}>{n as string}</text></g>;
      })}
      <g opacity={clamp01(bars[0] * 2)} transform="translate(190 930)">
        <rect x={-10} y={-34} width={380} height={128} rx={6} fill="#F1F2F3" stroke={ST.ink} strokeWidth={3} />
        {['1 BUILDINGS ~80%', '2 ROADS ~60%', '3 PIPELINES ~90%'].map((t, i) => <text key={i} x={6} y={i * 38} fontFamily={MONO} fontWeight={800} fontSize={22} fill={ST.ink}>{t}</text>)}
      </g>
    </g>
  );
};
const S10a: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [42, 45, 47];
  const k = ease(f, b(42), 26);
  const flat = ease(f, b(45), 40);
  const cliff = ease(f, b(47), 36);
  const bars: [number, number, number] = [cliff, 0, 0];
  const mc = ease(f, b(45) + 80, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.08} oy={960}>
      <SVG>
        <HeldProp f={f} px={540} py={1200} w={960} h={730} seed={10} kind="rest" gain={0.4}>
          <Card k={k} f={f} cliff={cliff * 0 + (flat > 0.5 ? cliff : 0)} bars={bars} labels={flat > 0.1} />
        </HeldProp>
        <line x1={yrX(2050)} y1={Y0} x2={yrX(2050)} y2={YT - 10} stroke={ST.ink} strokeWidth={4} opacity={mc} />
        <Lab text="MID CENTURY" x={yrX(2050)} y={YT - 36} size={20} p={mc} />
        <g transform="translate(250 560) rotate(-6)" opacity={clamp01(k * 3)}><rect x={-200} y={-30} width={400} height={60} fill="none" stroke={ST.ink} strokeWidth={6} /><rect x={-190} y={-22} width={380} height={44} fill="none" stroke={ST.ink} strokeWidth={2} /><text y={10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} letterSpacing={3} fill={ST.ink}>SEPARATE STUDY</text></g>
        <Lab text="NOT THE TWIN" x={800} y={560} size={24} p={ease(f, b(43), 14)} tone="glow" rot={4} />
        <g transform="translate(400 790) rotate(-3)" opacity={ease(f, b(44), 14)}><rect x={-190} y={-26} width={380} height={52} fill="none" stroke={ST.ink} strokeWidth={5} /><text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} letterSpacing={2} fill={ST.ink}>HIGH EMISSIONS ONLY</text></g>
        <rect x={72} y={Y0 + 70} width={54 * k} height={10} fill={ST.paper} stroke={ST.ink} strokeWidth={3} />
        <Plate x={540} y={1250} text="SEPARATE STUDY · ARCTIC COASTAL PLAIN" size={22} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={1250} text="UNDER 10% AT RISK" size={30} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={1250} text="2090S · 80% BUILDINGS" size={28} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

// ---- S11: the sliver ------------------------------------------------------------------------------------------------------------------------
const S10b: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [48, 49];
  const shrink = easeIO(f, b(48), 70);
  const r1 = ease(f, b(48), 30), r2 = ease(f, b(49), 30);
  const rw = lerp(840, 34, shrink);
  const bw = [1, r1, r2];
  const ax = (yr: number) => 100 + ((yr - 2020) / 80) * 880;
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={960}>
      <SVG>
        <rect data-band="ok" x={-60} y={380} width={1200} height={1000} fill="#E4E6E7" />
        <line x1={100} y1={1060} x2={1010} y2={1060} stroke={ST.ink} strokeWidth={6} />
        {[2020, 2040, 2060, 2080, 2100].map((yr) => <g key={yr}><line x1={ax(yr)} y1={1060} x2={ax(yr)} y2={1080} stroke={ST.ink} strokeWidth={5} /><text x={ax(yr)} y={1116} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={ST.ink}>{yr}</text></g>)}
        <HeldProp f={f} px={140} py={1070} w={120} h={70} seed={11} kind="rest" gain={0.8}><g transform="translate(100 1060)">
          <rect x={0} y={-44} width={rw} height={36} fill={ST.paper} stroke={ST.ink} strokeWidth={4} />
          {shrink > 0.9 && <rect x={-6} y={-50} width={rw + 12} height={48} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.5 + 0.4 * Math.sin(f / 6)} />}
        </g></HeldProp>
        {[[890, 80, '1'], [930, 60, '2'], [970, 90, '3']].map(([x, val, n], i) => {
          const hh = ((val as number) / 100) * 520 * bw[i];
          return <g key={i}><rect x={(x as number) - 16} y={1060 - hh} width={32} height={hh} fill="#C9CDD0" stroke={ST.ink} strokeWidth={4} />{bw[i] > 0.9 && <text x={x as number} y={1060 - hh - 12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={ST.ink}>~{val as number}%</text>}<text x={x as number} y={1160} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={ST.ink}>{n as string}</text></g>;
        })}
        <g transform="translate(110 700)">
          <rect x={-10} y={-34} width={420} height={130} rx={6} fill="#F1F2F3" stroke={ST.ink} strokeWidth={3} />
          {['1 BUILDINGS ~80%', '2 ROADS ~60%', '3 PIPELINES ~90%'].map((t, i) => <text key={i} x={6} y={i * 38} fontFamily={MONO} fontWeight={800} fontSize={24} fill={ST.ink}>{t}</text>)}
        </g>
        <g transform="translate(540 640)"><rect x={-300} y={-26} width={600} height={52} fill="none" stroke={ST.ink} strokeWidth={5} /><text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={2} fill={ST.ink}>SEPARATE STUDY · HIGH EMISSIONS ONLY</text></g>
        <Plate x={540} y={520} text="60% ROADS" size={34} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={520} text="90% PIPELINES" size={34} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

const S10: React.FC<SceneProps> = ({p}) => (p.f < p.b(48) ? <S10a p={p} /> : <S10b p={p} />);

// ---- S12: ten more years -----------------------------------------------------------------------------------------------------------------
const QUOTE = ['"IF WE HAVE, SAY, 10 MORE', 'YEARS OF DATA, THAT WOULD', 'BE EXTREMELY VALUABLE."'];
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [50, 51, 53];
  const typed = ease(f, b(50), Math.max(40, b(51) - b(50) - 8)) * 1;
  const ext = ease(f, b(51), 50);
  const lit = ease(f, b(51) + 70, 60);
  const tag = springy(f, Math.max(6, b(53) - 70), 24);
  const flip = ease(f, b(53), 12);
  const lock = springy(f, b(53), 18);
  return (
    <Frame p={p} z0={1.04} z1={1.1} oy={960}>
      <SVG>
        <rect data-band="ok" x={-60} y={380} width={1200} height={1000} fill="#D6DBDF" />
        <Typed x={90} y={640} rows={QUOTE} k={typed} size={36} />
        <HeldProp f={f} px={540} py={1040} w={960} h={140} seed={12} kind="rest" gain={0.5}>
          <Ribbon x={70} y={960} w={940} h={90} f={f} ticks={1} ext={ext} label />
        </HeldProp>
        {Array.from({length: 10}).map((_, i) => {
          const on = clamp01(lit * 10 - i);
          const n = 33, cell = (940 * 0.72) / n;
          const x = 70 + 14 + n * cell + 8 + i * (940 * 0.28 / 10);
          return <rect key={i} x={x} y={960 - 35} width={Math.max(3, 940 * 0.28 / 10 - 8)} height={70} rx={2} fill="#FFFFFF" opacity={on * 0.9} />;
        })}
        <g transform={`translate(0 0)`}>
          <NumTag x={880} y={1160} s={0.9 + 0.3 * bump(f, b(53), 22)} text={flip > 0.5 ? '10' : '?'} drop={tag} lock={lock} f={f} />
        </g>
        <Dial x={190} y={1150} s={0.5} f={f} tape={0} peel={0} hang={false} wobble={0.2} />
        <Plate x={540} y={520} text="PENN STATE · XIAO" size={32} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={520} text="10 MORE YEARS OF DATA" size={30} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="THE OTHER NUMBER" size={36} tone="glow" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
      </SVG>
    </Frame>
  );
};

// ---- S13: who lays the next cable --------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const K = [54, 55, 56, 57];
  const drop = clamp01((f - 6) / 16);
  const dropY = lerp(440, 884, drop * drop);
  const cur = ease(f, b(55), 20);
  const cab = ease(f, b(56), 40);
  const wo = springy(f, b(57), 24);
  return (
    <Frame p={p} z0={1.02} z1={1.1} oy={960} floor={false}>
      <SVG>
        <Ground f={f} y0={600} glint={1} thawLine={1} />
        <Strand x={800} y={1070} f={f} len={860} face={false} dim={1} seed={2} />
        <HeldProp f={f} px={800} py={1010} w={150} h={130} seed={13} kind="rest" gain={0.6}>
          <Strand x={800} y={940} f={f} len={1000} mood={f > b(56) ? 'hopeful' : 'calm'} look={f > b(56) ? 0 : 0.6} seed={1} />
        </HeldProp>
        {drop < 1 && <ellipse cx={800} cy={dropY} rx={9} ry={14} fill={ST.honey} stroke={ST.ink} strokeWidth={3} />}
        <path d="M 884,940 L 1120,940" fill="none" stroke={ST.ink} strokeWidth={34} strokeLinecap="round" opacity={ease(f, b(54), 20)} />
        <path d="M 884,940 L 1120,940" fill="none" stroke={ST.paper} strokeWidth={24} strokeLinecap="round" strokeDasharray="14 9" opacity={ease(f, b(54), 20)} />
        <rect x={1010} y={915} width={10} height={50} fill={ST.ink} opacity={cur * (0.4 + 0.6 * (Math.floor(f / 10) % 2))} />
        <path d="M 1100,1180 L 1100,1180" />
        <path d={`M 480,1170 L ${480 + 450 * cab},${1170}`} fill="none" stroke={ST.ink} strokeWidth={30} strokeLinecap="round" opacity={cab} />
        <path d={`M 480,1170 L ${480 + 450 * cab},${1170}`} fill="none" stroke={ST.ivory} strokeWidth={20} strokeLinecap="round" strokeDasharray="14 9" opacity={cab} />
        <Ruler x={100} y={1260} w={760} f={f} lit={1} p={1} label="1 KM" />
        <g transform={`translate(930 ${lerp(900, 1130, wo)}) rotate(${6 * Math.sin(f / 9) * (1 - wo * 0.5)})`} opacity={clamp01(wo * 2)}>
          <path d="M0,-60 V-4" stroke={ST.ink} strokeWidth={4} />
          <rect x={-52} y={-4} width={104} height={92} rx={8} fill={ST.paper} stroke={ST.ink} strokeWidth={5} />
          <text y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} letterSpacing={1} fill={ST.ink}>WORK ORDER</text>
          {[0, 1, 2].map((i) => <line key={i} x1={-38} y1={40 + i * 16} x2={38} y2={40 + i * 16} stroke={ST.ink} strokeWidth={2} strokeDasharray="4 4" />)}
        </g>
        <Plate x={540} y={520} text="THE MODEL ISN'T THE HARD PART" size={28} tone="dark" p={vis(f, b, K, 0)} />
        <Plate x={540} y={520} text="THE RECORD IS" size={34} tone="dark" p={vis(f, b, K, 1)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="WHO LAYS THE NEXT CABLE?" size={32} tone="dark" p={vis(f, b, K, 2)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
        <Plate x={540} y={520} text="AND WHO PAYS?" size={36} tone="glow" p={vis(f, b, K, 3)} /> {/* plate-overlap-ok: hand-off run, each plate retires before the next lands */}
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

export const ep1108Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1108Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}`}</style>
);

export const Ep1108: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 10.82, 20.32, 34.12, 43.94, 58.0, 63.62, 74.78, 87.38, 92.78, 109.48, 120.62, 127.88].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1C1F2A" ink="#F4F6F7" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
