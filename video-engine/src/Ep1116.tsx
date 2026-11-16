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
import {VoteTree, Grove, Thermometer, KettleLake, SurveyStake, FOREST} from './lib/forest';
import {SatelliteEye} from './lib/sensors';
import {Caribou, Mosquito, Ptarmigan} from './lib/fauna';
import {IDS} from './Ep1116Ids';

// The Forest Can't Stand on the Ice, 2026-11-16. Palette roles are art_direction.json. The hero is a troupe of faced decision
// trees (VoteTree, lib/forest.tsx) on tundra where trees don't grow. Radar lime is reserved for the model and the radar,
// fuchsia for lakes that break the temperature rule, the thermometer's red is kept to its bulb. Night only opens and closes.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;

export const C = {
  night: '#1C1A33', nightL: '#2E2A52', star: '#E8E4FF', honey: '#F6C66B', sky: '#9FC3D6', skyL: '#D5E6EE', dusk: '#E89A7A', heather: '#5C4A78',
  rust: '#8A4B2E', ochre: '#A2603A', umber: '#5F4A28', olive: '#7A5A30', snow: '#EEF1F4', snowD: '#C9D2DE', ice: FOREST.ice, water: FOREST.water,
  lime: FOREST.lime, fuchsia: FOREST.magenta, paper: '#FFF6E3', paperD: '#E8DCC0', ink: '#1B1A22', line: '#1B1A22', desk: '#B07A48', deskD: '#7A5030',
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
/** a decaying settle after a landing, for the object itself (never the frame) */
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

type Tone = 'dark' | 'plate' | 'lime' | 'warm';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#1E1B36', fg: '#FFF6E3', edge: '#FFF6E3'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  lime: {fill: '#1E2A12', fg: '#E6FFA0', edge: '#C6F04D'},
  warm: {fill: '#FFF0D6', fg: '#3A2614', edge: '#3A2614'},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'plate', p = 1, rot = 0, drop = 0}) => {
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
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={t.edge} strokeWidth={4} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; overlay?: React.ReactNode; bg?: string; warmth?: number; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.24, ox = 540, oy = 960, overlay, bg = C.night, warmth = 0.04, children}) => {
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
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#1E1B36" stroke="#FFF6E3" strokeWidth={2.4} opacity={0.92} />
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

// ---- the shared world --------------------------------------------------------------------------------------------------------------------------------
type Mode = 'night' | 'day' | 'dusk';
const SKY: Record<Mode, [string, string, string]> = {
  night: ['#120F26', '#1C1A33', '#3A2F5E'],
  day: ['#9FC3D6', '#F2B38A', '#F6C66B'],
  dusk: ['#4A3A6A', '#8E5E86', '#E89A7A'],
};
const GROUND: Record<Mode, string[]> = {
  night: ['#D7DDE8', '#C3CBDA', '#B0B9CC', '#9CA6BC'],
  day: ['#A2603A', '#8A4B2E', '#7A5A30', '#5F4A28'],
  dusk: ['#9A5A44', '#7E4634', '#6A4A36', '#533A2C'],
};

/** the Brooks Range far to the south: snow-capped peaks along the horizon, two parallax ridges */
const Range: React.FC<{mode: Mode; horizon: number; f: number; seed?: number}> = ({mode, horizon, f, seed = 0}) => {
  const far = mode === 'night' ? '#3A3566' : mode === 'day' ? '#B98C7A' : '#7A5A86';
  const near = mode === 'night' ? '#2A2650' : mode === 'day' ? '#8E6450' : '#5E4470';
  const ridge = (amp: number, seed: number, dx: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 14; i++) {
      const x = -120 + i * 100 + dx;
      const y = horizon - amp * (0.45 + 0.55 * h01(i, seed)) * ((i + seed) % 2 ? 0.6 : 1);
      pts.push(`${x} ${y.toFixed(1)}`);
    }
    return `M -120 ${horizon} L ${pts.join(' L ')} L 1300 ${horizon} Z`;
  };
  const drift = Math.sin(f / 90) * 10;
  const peaks = [0, 2, 4, 6, 8, 10, 12, 14];
  return (
    <g data-band="ok">
      <path d={ridge(230, 3 + seed * 7, drift * 0.4)} fill={far} stroke={C.ink} strokeWidth={3} />
      {peaks.map((i) => {
        const x = -120 + i * 100 + drift * 0.4;
        const y = horizon - 230 * (0.45 + 0.55 * h01(i, 3 + seed * 7));
        return <path key={i} d={`M ${x - 34} ${y + 40} L ${x} ${y} L ${x + 34} ${y + 40} L ${x + 16} ${y + 32} L ${x} ${y + 44} L ${x - 14} ${y + 30} Z`} fill={mode === 'night' ? '#C9C6E8' : '#FBF4EA'} stroke={C.ink} strokeWidth={2} />;
      })}
      <path d={ridge(120, 11 + seed * 5, drift)} fill={near} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

/** sky from above the frame edge, clouds in two planes, stars or a low sun, a flat far horizon */
const Sky: React.FC<{f: number; mode: Mode; horizon: number; sunX?: number; seed?: number}> = ({f, mode, horizon, sunX = 860, seed = 0}) => {
  const [a, m, b] = SKY[mode];
  const gid = `sky${mode}${horizon}`;
  return (
    <g data-band="ok">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a} /><stop offset="60%" stopColor={m} /><stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      <rect x={-300} y={-80} width={1680} height={horizon + 120} fill={`url(#${gid})`} />
      {mode === 'night' && Array.from({length: 70}).map((_, i) => (
        <circle key={i} cx={h01(i, 1) * 1180 - 50} cy={h01(i, 2) * (horizon - 60) - 40} r={1.2 + 1.8 * h01(i, 3)} fill={C.star}
          opacity={0.35 + 0.45 * (0.5 + 0.5 * Math.sin(f / (9 + i % 7) + i))} />
      ))}
      <Range mode={mode} horizon={horizon} f={f} seed={seed} />
      {mode !== 'night' && (
        <g>
          <circle cx={sunX} cy={horizon - 70} r={mode === 'day' ? 120 : 150} fill={mode === 'day' ? '#FFE9B0' : '#F7B48A'} opacity={0.35} />
          <circle cx={sunX} cy={horizon - 70} r={58} fill={mode === 'day' ? '#FFF1C4' : '#FFC9A0'} stroke={C.ink} strokeWidth={4} />
        </g>
      )}
      {[0, 1].map((plane) => Array.from({length: 4}).map((_, i) => {
        const sp = plane ? 0.55 : 0.25;
        const cx = ((h01(i, plane + 5 + seed * 3) * 1500 + f * sp) % 1500) - 210;
        const cy = 140 + plane * 150 + h01(i, 8 + seed) * 140;
        const wv = 160 + h01(i, 9 + seed) * 180;
        const col = mode === 'night' ? '#2C2850' : mode === 'day' ? '#F4F7FA' : '#F0B9A8';
        return (
          <path key={`${plane}-${i}`} d={`M ${cx} ${cy} q ${wv * 0.2} -46 ${wv * 0.45} -18 q ${wv * 0.2} -40 ${wv * 0.42} 4 q ${wv * 0.15} 6 ${wv * 0.13} 14 Z`}
            fill={col} stroke={C.ink} strokeWidth={3} opacity={plane ? 0.95 : 0.75} />
        );
      }))}
    </g>
  );
};

/** banded tundra from the horizon to the bottom edge, tussock rows getting bigger toward the viewer, a near plane of sedge */
const Ground: React.FC<{f: number; mode: Mode; horizon: number; ponds?: boolean; near?: boolean; seed?: number}> = ({f, mode, horizon, ponds = true, near = true, seed = 0}) => {
  const g = GROUND[mode];
  const bandH = (1960 - horizon) / 4;
  return (
    <g data-band="ok">
      {g.map((col, i) => (
        <rect key={i} x={-300} y={horizon + i * bandH * (0.6 + i * 0.25) - 2} width={1680} height={1960} fill={col} />
      ))}
      <line x1={-300} x2={1380} y1={horizon} y2={horizon} stroke={C.ink} strokeWidth={4} />
      {/* tussock rows, perspective spacing */}
      {Array.from({length: 7}).map((_, r) => {
        const yy = horizon + 30 + r * r * 16 + r * 24;
        const sz = 4 + r * 2.4;
        return Array.from({length: 14 - r}).map((__, i) => {
          const xx = ((i + 0.5) / (14 - r)) * 1180 - 50 + (h01(i, r) - 0.5) * 60;
          return <ellipse key={`${r}-${i}`} cx={xx} cy={yy} rx={sz * 2.4} ry={sz} fill={mode === 'night' ? '#AEB8CC' : '#4E3A20'} opacity={0.5} />;
        });
      })}
      {ponds && [0, 1, 2, 3, 4].map((i) => (
        <KettleLake key={i} x={80 + i * 230 + h01(i, 4) * 60} y={horizon + 26 + h01(i, 7) * 40} rx={42 + h01(i) * 30} ry={8 + h01(i, 2) * 5} f={f} seed={40 + i}
          ice={mode === 'night' ? 1 : mode === 'dusk' ? 0.7 : 0} detail={false} />
      ))}
      {near && <NearSedge f={f} mode={mode} seed={seed} />}
    </g>
  );
};

/** the near plane under the caption bar: sedge clumps and cottongrass that shiver in the wind */
const NearSedge: React.FC<{f: number; mode: Mode; y?: number; seed?: number}> = ({f, mode, y = 1560, seed = 0}) => (
  <g data-band="ok">
    {mode === 'night' && Array.from({length: 7}).map((_, i) => (
      <path key={`sa${i}`} d={`M ${h01(i, 90 + seed) * 1000 - 40} ${y + 40 + h01(i, 91 + seed) * 300} q 70 -22 160 -6 q 50 10 90 -4`} stroke="#AEB8CC" strokeWidth={6} fill="none" strokeLinecap="round" />
    ))}
    {Array.from({length: 9 + (seed % 4)}).map((_, i) => {
      const x = i * (1080 / (9 + (seed % 4))) - 20 + h01(i, 11 + seed) * 80;
      const yy = y + h01(i, 12 + seed) * 280;
      const s = 0.75 + h01(i, 13 + seed) * 1.0;
      const sway = Math.sin(f / 13 + i) * 6;
      const col = mode === 'night' ? '#E4E9F1' : mode === 'day' ? '#6E7A2E' : '#7A5A3A';
      return (
        <g key={i} transform={`translate(${x},${yy}) scale(${s})`}>
          <ellipse cx={0} cy={6} rx={46} ry={12} fill={C.ink} opacity={0.28} />
          {[-24, -12, 0, 12, 24].map((dx, k) => (
            <path key={k} d={`M ${dx} 0 Q ${dx + sway * 0.6} -40 ${dx * 1.6 + sway} -78`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
          ))}
          {[-24, -12, 0, 12, 24].map((dx, k) => (
            <path key={`c${k}`} d={`M ${dx} 0 Q ${dx + sway * 0.6} -40 ${dx * 1.6 + sway} -78`} stroke={col} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          ))}
          {mode !== 'night' && [-12, 12].map((dx, k) => (
            <circle key={`t${k}`} cx={dx * 1.6 + sway} cy={-82} r={9} fill="#FBF8F0" stroke={C.ink} strokeWidth={2.5} />
          ))}
        </g>
      );
    })}
  </g>
);

const World: React.FC<{f: number; mode: Mode; horizon?: number; ponds?: boolean; near?: boolean; sunX?: number; seed?: number}> = ({f, mode, horizon = 860, ponds, near, sunX, seed = 0}) => (
  <g>
    <Sky f={f} mode={mode} horizon={horizon} sunX={sunX} seed={seed} />
    <Ground f={f} mode={mode} horizon={horizon} ponds={ponds} near={near} seed={seed} />
  </g>
);

/** a field of small lake polygons lighting up across the tundra */
const LakeField: React.FC<{f: number; at: number; y0: number; y1: number; n?: number; ice?: number; glowSet?: number[]; glow?: number; seed?: number; radar?: number}> =
({f, at, y0, y1, n = 64, ice = 1, glowSet = [], glow = 0, seed = 0, radar = 0}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const t = h01(i, seed + 21);
      const yy = lerp(y0, y1, t * t);
      const sc = 0.4 + 1.1 * t;
      const xx = h01(i, seed + 22) * 1160 - 40;
      const lit = clamp01((f - at - h01(i, seed + 23) * 30) / 8);
      if (lit <= 0) return null;
      return (
        <g key={i} opacity={lit}>
          <KettleLake x={xx} y={yy} rx={26 * sc} ry={9 * sc} f={f} seed={seed * 100 + i} ice={ice} detail={false} radar={radar}
            glow={glowSet.includes(i) ? glow : 0} />
        </g>
      );
    })}
  </g>
);

// ---- S1 a forest where none grows (L0) -----------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b1 = p.b(1), b2 = p.b(2);
  const pop = clamp01((f - b1 + 16) / 46);
  const moss = clamp01((f - b1 - 8) / 14);
  const cam = track([{t: 0, z: 1.3, fx: 560, fy: 1080}, {t: b2, z: 1.22, fx: 560, fy: 1060}, {t: b2 + 60, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.02, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} bg={C.night} vignette={0.3} overlay={
      <g>
        <Plate text="A FOREST? ON THE NORTH SLOPE" x={540} y={560} size={40} tone="dark" p={win(f, b1 + 14, b2)} />
        <Plate text="30,774 LAKES · ALASKA NORTH SLOPE" x={540} y={650} size={38} tone="dark" p={win(f, b2 + 20)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="night" horizon={740} ponds={false}  seed={1} />
        <LakeField f={f} at={b2} y0={770} y1={1300} n={70} ice={1} />
        <KettleLake x={350} y={1230} rx={150} ry={46} f={f} seed={7} ice={1} dim={0.5 * (1 - clamp01((f - b2) / 30))} />
        <HeldTravel f={f} x={180} y={880} w={780} h={340} mode="shadow" seed={11}><Grove x={560} y={1200} f={f} cols={5} rows={3} dx={150} dy={74} scale={0.82} pop={pop} snow={1} emotion={pop < 0.9 ? 'startled' : 'proud'} rim="#B9B4FF" seed={2} /></HeldTravel>
        <g transform={`translate(0 ${settle(f, b1 + 8, 6)})`}>
          <Caribou x={900} y={1250} scale={1.05} f={f} facing={-1} emotion={pop > 0.2 ? 'wary' : 'calm'} />
        </g>
        {/* the moss drops from the caribou's mouth */}
        <g transform={`translate(${812} ${1150 + moss * 96}) rotate(${moss * 70})`} opacity={1 - clamp01((f - b1 - 30) / 10)}>
          <path d="M -14 0 q 6 -12 14 -4 q 8 -10 14 2 q -10 10 -28 2 Z" fill="#7F9A4A" stroke={C.ink} strokeWidth={2.5} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S2 not spruce (L1-L2) -----------------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b3 = p.b(3), b4 = p.b(4), b5 = p.b(5), b6 = p.b(6), b7 = p.b(7);
  const shake = Math.sin(f * 1.1) * 14 * clamp01(1 - (f - b3) / 30) * clamp01((f - b3) / 2);
  const troupe = clamp01((f - b4 + 6) / 40);
  const root = f < b5 ? 0 : f < b5 + 18 ? (f - b5) / 18 : f < b5 + 30 ? 1 - (f - b5 - 18) / 12 : 0;
  const paper = ease(f, b6, 30);
  const flick = f > b7 ? 0.5 + 0.5 * Math.sin((f - b7) / 5) : 1;
  return (
    <Frame p={p} z0={1.0} z1={1.08} oy={1000} bg={C.night} overlay={
      <g>
        <Plate text="NOT SPRUCE" x={540} y={560} size={40} tone="dark" p={win(f, b3 + 6, b4)} />
        <Plate text="RANDOM FOREST · 100 TREES" x={540} y={630} size={38} tone="lime" p={win(f, b4 + 6, b5 + 4)} />
        <Plate text="ONE OF 30,774" x={540} y={700} size={38} tone="plate" p={win(f, b5 + 10, b6)} />
        <Plate text="A NEW PAPER · THE CRYOSPHERE" x={540} y={770} size={36} tone="plate" p={win(f, b6 + 8, b7)} />
        <Plate text="WHEN IT FREEZES · WHEN IT THAWS" x={540} y={840} size={36} tone="plate" p={win(f, b7 + 6)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="night" horizon={760}  seed={2} />
        <Grove x={540} y={1080} f={f} cols={6} rows={2} dx={140} dy={60} scale={0.55} pop={troupe} snow={1} rim="#B9B4FF" seed={9} lookAt={f > b6 ? 820 : undefined} emotion={f > b7 && f < b7 + 30 ? 'startled' : 'calm'} />
        <KettleLake x={760} y={1250} rx={210} ry={62} f={f} seed={11} ice={flick} crack={f > b5 + 8 ? 0.15 + (f > b7 ? 0.2 : 0) : 0} />
        <LakeFlag x={960} y={1270} f={f} pop={ease(f, b5 + 8, 14)} />
        <g transform={`translate(${shake} 0)`}>
          <HeldTravel f={f} x={260} y={880} w={260} h={400} mode="sweep" seed={12}><VoteTree x={380} y={1270} scale={1.55} f={f} seed={1} emotion={f > b5 && f < b5 + 40 ? 'startled' : 'proud'} fork={clamp01((f - b3 - 6) / 10)} rim="#C6F04D"
            snow={1 - clamp01((f - b3) / 14)} look={f > b5 ? 0.8 : 0.2} /></HeldTravel>
        </g>
        {/* snow puffing off the crown */}
        {f > b3 && f < b3 + 24 && [0, 1, 2, 3, 4, 5].map((i) => {
          const t = (f - b3) / 24;
          return <circle key={i} cx={380 + (i - 2.5) * 40 * (1 + t)} cy={1270 - 330 + t * t * 220} r={9 * (1 - t) + 2} fill={C.snow} stroke={C.ink} strokeWidth={1.6} opacity={1 - t} />;
        })}
        {/* the root reaching for the ice */}
        <path d={`M 440 1262 C ${470 + 60 * root} 1268 ${500 + 90 * root} 1262 ${520 + 110 * root} ${1250 - 8 * root}`} stroke={C.ink} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d={`M 440 1262 C ${470 + 60 * root} 1268 ${500 + 90 * root} 1262 ${520 + 110 * root} ${1250 - 8 * root}`} stroke={FOREST.bark} strokeWidth={5} fill="none" strokeLinecap="round" />
        {/* the paper flutters down onto the snow */}
        <g transform={`translate(${lerp(980, 600, paper) + 30 * Math.sin(f / 6) * (1 - paper)} ${lerp(500, 1110, paper)}) rotate(${lerp(-40, -6, paper)})`} opacity={paper > 0 ? 1 : 0}>
          <rect x={-90} y={-60} width={180} height={120} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} />
          <rect x={-90} y={-60} width={180} height={26} fill="#3D5A80" stroke={C.ink} strokeWidth={3} />
          <text x={0} y={-41} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} letterSpacing={1} fill="#FFF6E3">THE CRYOSPHERE</text>
          {[0, 1, 2, 3].map((i) => <line key={i} x1={-72} x2={72 - i * 14} y1={-14 + i * 18} y2={-14 + i * 18} stroke={C.ink} strokeWidth={3} opacity={0.5} />)}
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S3 radar in the dark (L3) -------------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b8 = p.b(8), b9 = p.b(9);
  const glide = easeIO(f, b8 - 10, 70);
  const beam = ease(f, b9, 14);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.06, fx: 540, fy: 900}, {t: p.dur, z: 1.0, fx: 540, fy: 960}])} bg={C.night} overlay={
      <g>
        <Plate text="SENTINEL-1 RADAR · NO SUN NEEDED" x={540} y={960} size={36} tone="lime" p={win(f, b8 + 8, b9 + 30)} />
        <Plate text="SEES THROUGH CLOUD AND POLAR NIGHT" x={540} y={1040} size={36} tone="dark" p={win(f, b9 + 8)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="night" horizon={1060} ponds={false}  seed={3} />
        {/* the orbit arc */}
        <path d="M -100 640 Q 540 470 1180 640" stroke={C.lime} strokeWidth={3} strokeDasharray="10 14" fill="none" opacity={0.6} />
        {/* the beam */}
        {beam > 0.01 && (
          <g opacity={beam}>
            <polygon points={`${lerp(200, 540, glide) + 30},680 ${lerp(200, 540, glide) - 30},680 470,1240 650,1240`} fill={C.lime} opacity={0.22} />
            {[0, 1, 2, 3].map((i) => {
              const yy = 640 + ((f * 9 + i * 150) % 600);
              return <ellipse key={i} cx={lerp(lerp(200, 540, glide), 560, (yy - 620) / 620)} cy={yy} rx={20 + (yy - 620) * 0.12} ry={6} fill="none" stroke={C.lime} strokeWidth={3} opacity={0.7} />;
            })}
          </g>
        )}
        {/* the cloud lid, the beam passes through it */}
        <g data-band="ok">
          {Array.from({length: 9}).map((_, i) => (
            <ellipse key={i} cx={((i * 150 + f * 0.8) % 1350) - 130} cy={860 + Math.sin(i) * 30} rx={150} ry={46} fill="#38335E" stroke={C.ink} strokeWidth={3} opacity={0.92} />
          ))}
        </g>
        <HeldTravel f={f} x={360} y={1180} w={400} h={120} mode="sweep" seed={13}><KettleLake x={560} y={1240} rx={200} ry={56} f={f} seed={11} ice={1} radar={beam} /></HeldTravel>
        <Grove x={540} y={1180} f={f} cols={6} rows={1} dx={150} scale={0.5} snow={1} rim="#C6F04D" seed={14} lookAt={560} />
        <SatelliteEye x={lerp(200, 540, glide)} y={600} scale={2.2} f={f} scanCone={0} lensGlow={0.6 + 0.4 * beam} lensColor={C.lime} dishColor="#E6E0C8" coneColor={C.lime} telemetryColor={C.lime} />
      </SVG>
    </Frame>
  );
};

// ---- S4 the vote (L4-L5) -------------------------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b10 = p.b(10), b11 = p.b(11), b12 = p.b(12);
  const ring = clamp01((f - b10) / 24);
  const half = clamp01((f - b10 - 50) / 14) * 0.45;
  const up = Math.max(half, clamp01((f - b11 + 4) / 22));
  const press = clamp01((f - b12) / 6);
  const spread = clamp01((f - b12 - 4) / 18);
  const pull = easeIO(f, b12 + 18, 40);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: b12 + 18, z: 1.05, fx: 540, fy: 1010}, {t: b12 + 58, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} bg={C.night} overlay={
      <g>
        <Plate text="A LOOK ABOUT EVERY 4 DAYS" x={540} y={560} size={38} tone="lime" p={win(f, b10 + 6, b11)} />
        <Plate text="EACH TREE VOTES" x={540} y={640} size={40} tone="dark" p={win(f, b11 + 6, b12)} />
        <Plate text="MOST TREES LEAN ICE" x={540} y={720} size={40} tone="lime" p={win(f, b12 + 8)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="night" horizon={760}  seed={4} />
        {/* the stamps ripple out across thousands of lakes behind */}
        <g opacity={pull}>
          {Array.from({length: 40}).map((_, i) => {
            const t = h01(i, 61);
            const x = h01(i, 62) * 1100 - 10, y = 905 + t * t * 120;
            const on = clamp01((f - b12 - 20 - t * 30) / 6);
            return (
              <g key={i}>
                <KettleLake x={x} y={y} rx={18 + 20 * t} ry={6 + 6 * t} f={f} seed={300 + i} ice={1} detail={false} />
                {on > 0 && <rect x={x - 10 - 8 * t} y={y - 14 - 4 * t} width={20 + 16 * t} height={10 + 4 * t} rx={2} fill="none" stroke={C.lime} strokeWidth={2.5} opacity={on} />}
              </g>
            );
          })}
        </g>
        <KettleLake x={540} y={1060} rx={260} ry={74} f={f} seed={11} ice={1} radar={f < b11 ? 0.8 : 0.2} />
        <LakeFlag x={820} y={1080} f={f} />
        {[0, 1, 2, 3].map((i) => {
          const a = -Math.PI / 2 + (i / 4) * Math.PI * 2;
          const lit = ring * 4 > i;
          return <circle key={i} cx={540 + Math.cos(a) * 310} cy={1060 + Math.sin(a) * 110} r={lit ? 16 : 11} fill={lit ? C.lime : '#3A3466'} stroke={C.ink} strokeWidth={3} />;
        })}
        {ring > 0 && ring < 1 && (
          <line x1={540} y1={1060} x2={540 + Math.cos(-Math.PI / 2 + ring * Math.PI * 2) * 300} y2={1060 + Math.sin(-Math.PI / 2 + ring * Math.PI * 2) * 104} stroke={C.lime} strokeWidth={5} />
        )}
        <HeldTravel f={f} x={90} y={1000} w={900} h={300} mode="shadow" seed={14}><Grove x={540} y={1290} f={f} cols={5} rows={1} dx={165} dy={70} scale={0.8} paddle="ice" paddleUp={up} fork={clamp01((f - b11) / 10)} rim="#C6F04D" snow={0} seed={21} lookAt={540}
          emotion={press > 0.5 ? 'proud' : 'curious'} /></HeldTravel>
        <VoteTree x={110} y={1180} scale={0.6} f={f} seed={77} paddle="water" paddleUp={up} fork={clamp01((f - b11) / 10)} rim="#C6F04D" snow={0} emotion="puzzled" look={1} />
        <VoteTree x={980} y={1180} scale={0.6} f={f} seed={78} paddle="water" paddleUp={up} fork={clamp01((f - b11) / 10)} rim="#C6F04D" snow={0} emotion="puzzled" look={-1} facing={-1} />
        {/* a pressed label stamp with an ink spread, never a check or a seal */}
        {f > b12 - 8 && (
          <g transform={`translate(540 ${1010 - 60 * (1 - press)}) scale(${1 + 0.08 * (1 - press)},${1 - 0.12 * Math.sin(press * Math.PI)})`}>
            {spread > 0 && <ellipse cx={0} cy={0} rx={100 + 30 * spread} ry={36 + 10 * spread} fill={C.lime} opacity={0.18 * spread} />}
            <rect x={-92} y={-30} width={184} height={60} rx={6} fill="none" stroke={C.lime} strokeWidth={6} opacity={press} />
            <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={3} fill={C.lime} opacity={press}>ICE</text>
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S5 practice answers (L6-L7) -----------------------------------------------------------------------------------------------------------------------
const Easel: React.FC<{x: number; y: number; f: number; land: number; flap: number; lift: number}> = ({x, y, f, land, flap, lift}) => {
  const b = settle(f, land, 8);
  return (
    <g transform={`translate(${x} ${y + b})`}>
      <ContactShadow cx={0} cy={4} rx={120} ry={16} />
      <path d="M -90 0 L -50 -320 M 90 0 L 50 -320 M 0 0 L 0 -300" stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
      <path d="M -90 0 L -50 -320 M 90 0 L 50 -320" stroke={C.desk} strokeWidth={6} strokeLinecap="round" />
      <rect x={-130} y={-330} width={260} height={200} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <text x={-20} y={-238} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={74} fill={C.ink}>94%</text>
      {/* the clear-sky sun icon, seen only once the flap lifts */}
      <g transform="translate(92 -268)" opacity={clamp01(lift)}>
        <circle cx={0} cy={0} r={16} fill="#FFE9A8" stroke={C.ink} strokeWidth={3} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <line key={i} x1={Math.cos(i * 0.785) * 21} y1={Math.sin(i * 0.785) * 21} x2={Math.cos(i * 0.785) * 28} y2={Math.sin(i * 0.785) * 28} stroke={C.ink} strokeWidth={2.5} />)}
      </g>
      <text x={-110} y={-160} fontFamily={MONO} fontWeight={800} fontSize={16} letterSpacing={1} fill={C.ink}>GRADED BY</text>
      <text x={2} y={-160} fontFamily={MONO} fontWeight={800} fontSize={16} letterSpacing={1} fill={C.ink} opacity={clamp01(lift)}>SENTINEL-2</text>
      {flap > 0.01 && (
        <g transform={`translate(-6 -182) scale(1 ${clamp01(flap) * (1 - clamp01(lift))})`}>
          <rect x={0} y={0} width={134} height={34} fill="#E8C46A" stroke={C.ink} strokeWidth={3.5} />
          <text x={67} y={25} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>?</text>
        </g>
      )}
    </g>
  );
};

/** the small flag that marks the film's one kettle lake */
const LakeFlag: React.FC<{x: number; y: number; f: number; s?: number; pop?: number}> = ({x, y, f, s = 1, pop = 1}) => {
  const k = clamp01(pop);
  if (k <= 0.01) return null;
  const sway = Math.sin(f / 14) * 5;
  const label = 'ONE OF 30,774';
  const w = monoW(label, 18) + 22;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k})`}>
      <ContactShadow cx={0} cy={2} rx={14} ry={4} opacity={0.3} blur={3} />
      <line x1={0} y1={0} x2={0} y2={-90} stroke={C.ink} strokeWidth={4} />
      <g transform={`translate(-2 -90) rotate(${sway})`}>
        <rect x={-w} y={0} width={w} height={30} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
        <text x={-w / 2} y={21} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={1} fill={C.ink}>{label}</text>
      </g>
    </g>
  );
};

const S5: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b13 = p.b(13), b14 = p.b(14), b15 = p.b(15), b16 = p.b(16);
  const deal = clamp01((f - b13) / 50);
  const card = ease(f, b15 - 6, 12);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.04, fx: 440, fy: 1000}, {t: b15 - 10, z: 1.04, fx: 470, fy: 1000}, {t: b15 + 30, z: 1.06, fx: 620, fy: 980}, {t: p.dur, z: 1.08, fx: 640, fy: 980}])}
      bg={C.night} overlay={
      <g>
        <Plate text="PRACTICE ANSWERS" x={540} y={560} size={40} tone="dark" p={win(f, b13 + 6, b14)} />
        <Plate text="ABOUT 62% OF LABELS · FROM WEATHER RECORDS" x={540} y={640} size={32} tone="plate" p={win(f, b14 + 6, b15)} />
        <Plate text="94% AGREEMENT" x={540} y={720} size={42} tone="plate" p={win(f, b15 + 8, b16)} />
        <Plate text="WHO GRADED IT?" x={540} y={800} size={40} tone="dark" p={win(f, b16 + 8)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="night" horizon={740}  seed={5} />
        <HeldTravel f={f} x={180} y={880} w={150} h={400} mode="sweep" seed={15}><Thermometer x={250} y={1270} scale={1.25} f={f} glasses level={0.35} point={deal > 0 && deal < 1 ? 0.6 : 0} lean={0.2} /></HeldTravel>
        {/* flashcards dropping onto the snow, most stamped with a thermometer mark */}
        {Array.from({length: 10}).map((_, i) => {
          const t = clamp01(deal * 10 - i);
          if (t <= 0) return null;
          const fan = f > b14 ? clamp01((f - b14) / 20) : 0;
          const x = lerp(300, 420 + i * 52, t) + fan * (i - 5) * 6;
          const y = lerp(1050, 1225 - (i % 2) * 10, t);
          const thermo = ![1, 4, 7, 9].includes(i);
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${(i - 5) * 6 * fan + 20 * (1 - t)})`}>
              <rect x={-30} y={-42} width={60} height={84} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
              {thermo ? (
                <g><rect x={-4} y={-28} width={8} height={40} rx={4} fill="#F3EAD8" stroke={C.ink} strokeWidth={2} /><circle cx={0} cy={18} r={9} fill={FOREST.bulb} stroke={C.ink} strokeWidth={2} /></g>
              ) : (
                <g><circle cx={0} cy={-6} r={16} fill="#BFE3F2" stroke={C.ink} strokeWidth={2} /></g>
              )}
            </g>
          );
        })}
        <Grove x={640} y={1180} f={f} cols={4} rows={2} dx={130} dy={60} scale={0.62} paddle={f > b15 ? 'ice' : null} paddleUp={clamp01((f - b15) / 16) * (0.6 + 0.4 * Math.sin(f / 4))}
          emotion={f > b16 + 4 ? 'puzzled' : 'curious'} snow={0.5} rim="#B9B4FF" seed={31} lookAt={f > b16 ? 850 : 300} />
        {card > 0.01 && <g opacity={card}><Easel x={860} y={1290} f={f} land={b15 + 6} flap={clamp01((f - b16) / 8)} lift={0} /></g>}
      </SVG>
    </Frame>
  );
};

// ---- S6 the open season (L8-L9) ------------------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b17 = p.b(17), b18 = p.b(18), b19 = p.b(19), b20 = p.b(20);
  const sunX = lerp(160, 940, clamp01(f / p.dur));
  const iceAmt = f < b18 ? 1 : f < b19 ? 1 - clamp01((f - b18) / 20) : clamp01((f - b19) / 30);
  const crack = clamp01((f - b18 + 4) / 16);
  const ribbon = ease(f, b20, 30);
  const mosq = f > b18 - 30 && f < b19 + 20;
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1000} bg={SKY.day[1]} warmth={0.1} overlay={
      <g>
        <Plate text="WHAT DID THE LAKES SAY?" x={540} y={560} size={40} tone="dark" p={win(f, b17 + 4, b18)} />
        <Plate text="ICE OUT · AVERAGE JUNE 8TH" x={540} y={640} size={40} tone="plate" p={win(f, b18 + 6, b19)} />
        <Plate text="ICE ON · AVERAGE SEPT 30TH" x={540} y={720} size={40} tone="plate" p={win(f, b19 + 6, b20)} />
        <Plate text="ABOUT 114 DAYS OF OPEN WATER" x={540} y={800} size={40} tone="warm" p={win(f, b20 + 8)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="day" horizon={780} sunX={sunX}  seed={6} />
        <HeldTravel f={f} x={200} y={1010} w={680} h={220} mode="shadow" seed={16}><KettleLake x={540} y={1120} rx={320} ry={92} f={f} seed={11} ice={iceAmt} crack={f < b19 ? crack : 0} /></HeldTravel>
        {/* ice shards drifting apart at breakup */}
        {f > b18 && f < b19 && [0, 1, 2, 3, 4].map((i) => {
          const t = clamp01((f - b18) / 40);
          return <polygon key={i} points="-30,-8 26,-14 34,8 -24,14" transform={`translate(${400 + i * 70 + (i - 2) * 30 * t} ${1110 + (i % 2 ? 12 : -12) * t}) rotate(${(i - 2) * 12 * t})`}
            fill={C.ice} stroke={C.ink} strokeWidth={2.5} opacity={1 - t * 0.7} />;
        })}
        {/* the ribbon runs along the near shore from the JUNE mark to the SEPT mark */}
        <g transform="translate(0 1260)">
          <rect x={200} y={-14} width={680 * ribbon} height={28} rx={8} fill={C.water} stroke={C.ink} strokeWidth={3.5} />
          {[['JUN', 200], ['SEP', 880]].map(([l, x]) => (
            <g key={l as string} transform={`translate(${x} 0)`} opacity={ribbon > 0.02 || f > b18 ? 1 : 0}>
              <line x1={0} y1={-34} x2={0} y2={30} stroke={C.ink} strokeWidth={5} />
              <rect x={-40} y={-74} width={80} height={36} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
              <text x={0} y={-48} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>{l}</text>
            </g>
          ))}
        </g>
        <HeldTravel f={f} x={60} y={880} w={960} h={130} mode="shadow" seed={20}><Grove x={540} y={1000} f={f} cols={6} rows={1} dx={170} scale={0.48} rim="#FFD98A" seed={41} emotion={mosq ? 'startled' : 'calm'} lookAt={540} cast={-0.7} /></HeldTravel>
        {mosq && [0, 1, 2, 3, 4].map((i) => (
          <Mosquito key={i} x={260 + i * 120 + 20 * Math.sin(f / 5 + i)} y={1180 - (i % 2) * 40 + 14 * Math.cos(f / 4 + i)} scale={0.5} f={f + i * 7} facing={i % 2 ? -1 : 1} />
        ))}
      </SVG>
    </Frame>
  );
};

// ---- S7 farther north (L10-L11) ------------------------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b21 = p.b(21), b22 = p.b(22), b23 = p.b(23), b24 = p.b(24);
  const tilt = easeIO(f, b21, 30);
  const shrink = clamp01((f - b22) / 40);
  const hop = ease(f, b23, 18);
  const cup = f > b24 ? Math.sin((f - b24) * 1.3) * 10 * Math.exp(-(f - b24) / 30) : 0;
  const bands = [0, 1, 2, 3];
  return (
    <Frame p={p} z0={1.0} z1={1.04} oy={980} bg={SKY.day[1]} warmth={0.08} overlay={
      <g>
        <Plate text="FARTHER NORTH" x={540} y={560} size={40} tone="dark" p={win(f, b21 + 6, b22)} />
        <Plate text="ABOUT 23 FEWER DAYS PER DEGREE NORTH" x={540} y={640} size={34} tone="warm" p={win(f, b22 + 6, b23)} />
        <Plate text="TEMPERATURE LED" x={540} y={720} size={40} tone="plate" p={win(f, b23 + 6, b24)} />
        <Plate text="SHAPE AND SIZE · ABOUT 2% MORE" x={540} y={800} size={38} tone="plate" p={win(f, b24 + 6)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="day" horizon={700} sunX={900} near={true}  seed={7} />
        {/* the tundra tilts up into a painted map: four latitude bands, north at the top */}
        <HeldTravel f={f} x={110} y={860} w={860} h={420} mode="shadow" seed={21}><g transform={`translate(540 1180) scale(1 ${lerp(0.35, 1, tilt)}) translate(-540 -1180)`}>
          <polygon points="230,860 850,860 990,1290 90,1290" fill="#E8D6AE" stroke={C.ink} strokeWidth={5} />
          <polygon points="230,860 850,860 856,880 224,880" fill="#C9B48A" />
          {bands.map((i) => {
            const yy = 900 + i * 96;
            const w0 = 300 + i * 90;
            const w = lerp(w0, w0 - (3 - i) * 60, shrink * 0) ;
            const north = 3 - i;
            const len = (w0) * (1 - 0.18 * north * shrink);
            const kk = 0.74 + 0.26 * (i / 3);
            return (
              <g key={i} transform={`translate(540 ${yy + 34}) scale(${kk}) translate(-540 ${-(yy + 34)})`}>
                <line x1={130} x2={950} y1={yy + 70} y2={yy + 70} stroke={C.ink} strokeWidth={2} strokeDasharray="8 10" opacity={0.5} />
                {[0, 1, 2].map((k) => <KettleLake key={k} x={170 + k * 70} y={yy + 34} rx={26} ry={12} f={f} seed={60 + i * 3 + k} ice={0} detail={false} />)}
                <rect x={400} y={yy + 18} width={len * 0.9} height={30} rx={8} fill={C.water} stroke={C.ink} strokeWidth={3} />
                {i === 0 && <text x={950} y={yy + 4} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>71° N</text>}
                {i === 3 && <text x={950} y={yy + 4} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>69° N</text>}
                {w > 0 && null}
              </g>
            );
          })}
        </g></HeldTravel>
        <g transform={`translate(${lerp(1160, 900, hop)} 0)`}>
          <Thermometer x={0} y={1290 - 40 * Math.sin(Math.PI * clamp01((f - b23) / 18))} scale={1.15} f={f} level={0.4 + 0.45 * hop} emotion={hop > 0.5 ? 'proud' : 'calm'} cast={-0.6} />
        </g>
        {/* shape and size rattle a tiny tin cup */}
        <g transform={`translate(230 1250) scale(1.9)`} opacity={f > b24 - 6 ? 1 : 0}>
          <KettleLake x={-40} y={-10} rx={34} ry={14} f={f} seed={91} ice={0} />
          <KettleLake x={60} y={-14} rx={22} ry={18} f={f} seed={92} ice={0} />
          <g transform={`translate(10 -60) rotate(${cup})`}>
            <path d="M -24 -30 L 24 -30 L 18 20 L -18 20 Z" fill="#B8C0C8" stroke={C.ink} strokeWidth={3.5} />
            <text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.ink}>2%</text>
          </g>
          {f > b24 + 8 && [0, 1].map((i) => {
            const t = clamp01((f - b24 - 8 - i * 4) / 14);
            return <circle key={i} cx={30 + i * 18 + 20 * t} cy={-40 + 50 * t * t} r={7} fill="#E8C46A" stroke={C.ink} strokeWidth={2} />;
          })}
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S8 why care (L12) ---------------------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b25 = p.b(25), b26 = p.b(26);
  const bub = (side: number, open: boolean) => Array.from({length: 16}).map((_, i) => {
    const per = 46 + (i % 3) * 12;
    const t = ((f + i * 23) % per) / per;
    const x = side + (h01(i, side) - 0.5) * 200 + Math.sin(f / 8 + i) * 6;
    const y = lerp(1140, open ? 850 : 930, t);
    const popped = open && t > 0.9;
    const flat = !open && t > 0.85;
    return (
      <g key={i}>
        {flat ? <ellipse cx={x} cy={928} rx={14} ry={5} fill="#E9F6F4" stroke={C.ink} strokeWidth={2} />
          : <circle cx={x} cy={y} r={popped ? 16 : 6 + 6 * t} fill={popped ? 'none' : '#E9F6F4'} stroke={C.ink} strokeWidth={2.5} opacity={popped ? 1 - (t - 0.9) / 0.1 : 0.9} />}
        {popped && f > b26 && <path d={`M ${x} ${y - 20} q 12 -40 0 -90`} stroke="#C9C2B4" strokeWidth={4} fill="none" opacity={0.6} />}
      </g>
    );
  });
  const half = 540;
  return (
    <Frame p={p} z0={1.0} z1={1.03} oy={980} bg={SKY.day[1]} warmth={0.06} overlay={
      <g>
        <Plate text="WHY CARE?" x={540} y={560} size={42} tone="dark" p={win(f, b25 + 4, b26)} />
        <Plate text="METHANE · OPEN-WATER SEASON" x={540} y={640} size={36} tone="plate" p={win(f, b26 + 6)} />
      </g>
    }>
      <SVG>
        <Sky f={f} mode="day" horizon={660} sunX={300} />
        <g transform="translate(0 -200)">
        {/* the right half of the sky is October dusk */}
        <rect x={half} y={-80} width={700} height={1040} fill="#5C4A78" opacity={0.55} data-band="ok" />
        <g data-band="ok">
          <rect data-band="ok" x={-100} y={860} width={1280} height={1500} fill="#6A4A30" />
          <rect x={-100} y={860} width={1280} height={40} fill="#8A4B2E" stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 26}).map((_, i) => <circle key={i} cx={h01(i, 31) * 1080} cy={1360 + h01(i, 32) * 540} r={6 + h01(i, 33) * 10} fill="#5A3E28" />)}
        </g>
        {/* the same kettle lake cut open: June on the left, October on the right */}
        <HeldTravel f={f} x={120} y={890} w={840} h={270} mode="sweep" seed={23}><path d="M 120 890 Q 540 1420 960 890 Z" fill={C.water} stroke={C.ink} strokeWidth={5} /></HeldTravel>
        <clipPath id="octHalf"><rect data-band="ok" x={half} y={860} width={600} height={600} /></clipPath>
        <g clipPath="url(#octHalf)">
          <path d="M 120 890 Q 540 1420 960 890 Z" fill="#3E6E78" />
          <rect x={half} y={882} width={408} height={44} fill={C.ice} stroke={C.ink} strokeWidth={4} />
        </g>
        <line x1={half} y1={860} x2={half} y2={1180} stroke={C.ink} strokeWidth={4} strokeDasharray="12 10" />
        <g clipPath="url(#junHalf)">{bub(360, true)}</g>
        <clipPath id="junHalf"><rect data-band="ok" x={0} y={700} width={half} height={800} /></clipPath>
        <g clipPath="url(#octHalf2)">{bub(720, false)}</g>
        <clipPath id="octHalf2"><rect data-band="ok" x={half} y={700} width={600} height={800} /></clipPath>
        <rect x={200} y={1220} width={120} height={44} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={3} />
        <text x={260} y={1251} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>JUNE</text>
        <rect x={760} y={1220} width={120} height={44} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={3} />
        <text x={820} y={1251} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>OCT</text>
        <LakeFlag x={1000} y={1020} f={f} s={0.9} />
        <VoteTree x={160} y={872} scale={0.55} f={f} seed={51} emotion="curious" look={0.8} cast={-0.6} />
      </g>
      </SVG>
    </Frame>
  );
};

// ---- S9 the exam room on the shore (L13-L14) -----------------------------------------------------------------------------------------------------------
const Desk: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={4} rx={90} ry={14} />
    <path d="M -70 0 L -64 -70 M 70 0 L 64 -70" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    <rect x={-90} y={-92} width={180} height={26} rx={4} fill={C.desk} stroke={C.ink} strokeWidth={4} />
  </g>
);
/** the empty teacher's desk with its unused red pen */
const EmptyDesk: React.FC<{x: number; y: number; s?: number; f: number; card?: number; cardAt?: number}> = ({x, y, s = 1, f, card = 0, cardAt = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <HeldTravel f={f} x={-110} y={-130} w={220} h={140} mode="shadow" seed={6}>
      <g>
        <ContactShadow cx={0} cy={4} rx={110} ry={16} />
        <path d="M -80 0 L -74 -84 M 80 0 L 74 -84" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        <rect x={-100} y={-110} width={200} height={30} rx={4} fill={C.desk} stroke={C.ink} strokeWidth={4} />
        <rect x={-100} y={-82} width={200} height={50} fill={C.deskD} stroke={C.ink} strokeWidth={4} />
        <rect x={-34} y={-124} width={68} height={9} rx={3} fill={FOREST.bulb} stroke={C.ink} strokeWidth={2} transform="rotate(-8 0 -120)" />
      </g>
    </HeldTravel>
    {card > 0.01 && (
      <g transform={`translate(0 -60) rotate(${settle(f, cardAt, 8)})`} opacity={card}>
        <circle cx={0} cy={-10} r={6} fill="#E8C46A" stroke={C.ink} strokeWidth={2} />
        <rect x={-46} y={-4} width={92} height={40} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
        <line x1={-30} x2={30} y1={16} y2={16} stroke={C.ink} strokeWidth={3} />
      </g>
    )}
  </g>
);

const S9: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b27 = p.b(27), b28 = p.b(28), b29 = p.b(29), b30 = p.b(30);
  const land = ease(f, b27, 12);
  const lift = clamp01((f - b28) / 12);
  const slide = ease(f, b29, 26);
  const pin = ease(f, b30, 10);
  const cloud = ((f * 2.2) % 520) - 260;
  const eyeOpen = Math.abs(cloud) > 110 && !(f > b30 && f < b30 + 30) ? 1 : 0.15;
  const reach = f < b29 + 20 ? 0 : f < b29 + 44 ? (f - b29 - 20) / 24 : 1;
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.03, fx: 540, fy: 1000}, {t: b29, z: 1.05, fx: 560, fy: 990}, {t: p.dur, z: 1.07, fx: 600, fy: 990}])}
      bg={SKY.dusk[1]} warmth={0.08} overlay={
      <g>
        <Plate text="THE FAIR TEST" x={540} y={560} size={42} tone="dark" p={win(f, b27 + 6, b28)} />
        <Plate text="SENTINEL-2 · CLEAR DAYS ONLY" x={540} y={640} size={38} tone="plate" p={win(f, b28 + 10, b29 + 20)} />
        <Plate text="NOT ANYONE ON THE ICE" x={540} y={720} size={40} tone="dark" p={win(f, b29 + 8, b30)} />
        <Plate text="NO FIELD CHECK · PER THE PAPER" x={540} y={800} size={38} tone="plate" p={win(f, b30 + 8)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="dusk" horizon={740} sunX={180}  seed={8} />
        {/* the lake ice beyond the shore, empty but for one desk */}
        <KettleLake x={600} y={1010} rx={470} ry={110} f={f} seed={11} ice={1} />
        <EmptyDesk x={lerp(1320, 700, slide)} y={1050} s={0.85} f={f} card={pin} cardAt={b30 + 10} />
        {/* the shore line in front of the lake */}
        <path d="M -100 1150 Q 300 1120 600 1150 T 1200 1140 L 1200 1960 L -100 1960 Z" fill="#7E4634" stroke={C.ink} strokeWidth={4} data-band="ok" />
        <NearSedge f={f} mode="dusk" seed={9} y={1500} />
        {/* one root stretches toward the ice and stops at the line */}
        <path d={`M 360 1250 C ${380 + 60 * reach} 1240 ${400 + 110 * reach} 1200 ${420 + 150 * reach} ${1180 - 20 * reach}`} stroke={C.ink} strokeWidth={9} fill="none" strokeLinecap="round" opacity={reach > 0 ? 1 : 0} />
        <path d={`M 360 1250 C ${380 + 60 * reach} 1240 ${400 + 110 * reach} 1200 ${420 + 150 * reach} ${1180 - 20 * reach}`} stroke={FOREST.bark} strokeWidth={4} fill="none" strokeLinecap="round" opacity={reach > 0 ? 1 : 0} />
                {/* the forest at desks on the shore, paddles up like hands */}
        <g transform={`translate(0 ${(1 - land) * -160})`} opacity={land}>
          {[0, 1, 2].map((i) => (
            <VoteTree key={i} x={170 + i * 170} y={1240} scale={0.6} f={f} seed={60 + i} emotion={lift > 0.5 ? 'curious' : 'calm'}
              look={f > b29 ? 1 : f > b28 ? 0.6 : 0.3} rim="#F7B48A" rimSide={-1} paddle="ice" paddleUp={f < b30 + i * 6 ? 0.75 : 0.05} cast={0.4} />
          ))}
          {[0, 1, 2].map((i) => <Desk key={i} x={170 + i * 170} y={1300} s={0.8} />)}
        </g>
<Easel x={900} y={1290} f={f} land={b27 + 10} flap={1} lift={lift} />
        {/* the clear-sky grader in a sun visor: its eye shuts each time a cloud drifts over */}
        {lift > 0.01 && (
          <g opacity={lift} transform={`translate(905 ${470 + settle(f, b28 + 10, 6)})`}>
            <SatelliteEye x={0} y={0} scale={0.85} f={f} lensGlow={0.15 + 0.85 * eyeOpen} lensColor="#FFF1C4" dishColor="#E6E0C8" coneColor="#FFF1C4" />
            <path d="M -60 -40 Q 0 -80 60 -40 L 70 -30 L -70 -30 Z" fill="#F6C66B" stroke={C.ink} strokeWidth={3} />
            {eyeOpen < 0.5 && <path d="M -20 30 Q 0 40 20 30" stroke={C.ink} strokeWidth={5} fill="none" />}
            <ellipse cx={cloud} cy={40} rx={100} ry={30} fill="#C8A6C4" stroke={C.ink} strokeWidth={3} opacity={0.95} />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S10 the ribbon of days (L15-L16) ------------------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b31 = p.b(31), b32 = p.b(32), b33 = p.b(33), b34 = p.b(34);
  const deal = clamp01((f - b31) / 40);
  const pin = ease(f, b32, 12);
  const slideT = easeIO(f, b33, 26);
  const fill = clamp01((f - b34) / 30);
  const RX = 110, RW = 860, RY = 1040;
  const slots = 20;
  return (
    <Frame p={p} z0={1.0} z1={1.04} oy={1000} bg="#EEF1F4" warmth={0.06} overlay={
      <g>
        <Plate text="MOST ANSWERS FROM WEATHER" x={540} y={560} size={38} tone="dark" p={win(f, b31 + 6, b32)} />
        <Plate text="AND TEMPERATURE LED" x={540} y={640} size={40} tone="plate" p={win(f, b32 + 6, b33)} />
        <Plate text="ONLY LONG DEEP COLD OR REAL WARMTH" x={540} y={720} size={34} tone="plate" p={win(f, b33 + 8, b34)} />
        <Plate text="THE IN-BETWEEN WEEKS" x={540} y={800} size={40} tone="lime" p={win(f, b34 + 6)} />
      </g>
    }>
      <SVG>
        {/* overhead: snow with wind ripples, dusk light raking from the left */}
        <g data-band="ok">
          <rect data-band="ok" x={-100} y={-80} width={1280} height={2080} fill="#E9ECF3" />
          {Array.from({length: 30}).map((_, i) => (
            <path key={i} d={`M ${-60 + (i % 5) * 260 + ((f * 0.4) % 60)} ${100 + Math.floor(i / 5) * 320} q 60 -14 120 0 t 120 0`} stroke="#C9D2DE" strokeWidth={4} fill="none" />
          ))}
          <rect data-band="ok" x={-100} y={-80} width={1280} height={2080} fill="#F7B48A" opacity={0.12} />
        </g>
        {Array.from({length: 14}).map((_, i) => {
          const top = i < 8;
          const x = 80 + (i % (top ? 8 : 6)) * (top ? 130 : 180) + h01(i, 51) * 50;
          const y = top ? 440 + h01(i, 52) * 360 : 1590 + h01(i, 53) * 60;
          return <KettleLake key={i} x={x} y={y} rx={46 + h01(i, 54) * 36} ry={30 + h01(i, 55) * 24} f={f} seed={500 + i} ice={i % 4 === 1 ? 0.3 : 1} />;
        })}
        {/* the ribbon of days, deep winter at both ends, summer in the middle */}
        <defs>
          <linearGradient id="yearRib" x1="0" x2="1">
            <stop offset="0%" stopColor="#BFD6EA" /><stop offset="35%" stopColor="#E9E4D0" /><stop offset="50%" stopColor="#FBE3A8" />
            <stop offset="65%" stopColor="#E9E4D0" /><stop offset="100%" stopColor="#BFD6EA" />
          </linearGradient>
        </defs>
        <rect x={RX - 6} y={RY - 6} width={RW + 12} height={132} rx={14} fill="#000" opacity={0.15} />
        <HeldTravel f={f} x={RX} y={RY} w={RW} h={120} mode="shadow" seed={22}><rect x={RX} y={RY} width={RW} height={120} rx={12} fill="url(#yearRib)" stroke={C.ink} strokeWidth={5} /></HeldTravel>
        {Array.from({length: slots + 1}).map((_, i) => <line key={i} x1={RX + (i * RW) / slots} x2={RX + (i * RW) / slots} y1={RY} y2={RY + 120} stroke={C.ink} strokeWidth={1.5} opacity={0.35} />)}
        {/* the cards: dealt in a heap, then slid to deep winter (frost) and high summer (sun) */}
        {Array.from({length: 10}).map((_, i) => {
          const t = clamp01(deal * 10 - i);
          if (t <= 0) return null;
          const frost = i % 2 === 0;
          const heapX = 300 + (i % 5) * 18, heapY = 820 + i * 4;
          const slot = frost ? (i < 5 ? i / 2 : slots - 1 - (i - 5) / 2) : 9 + (i % 3);
          const tx = RX + (Math.round(slot) + 0.5) * (RW / slots);
          const x = lerp(lerp(160, heapX, t), tx, slideT);
          const y = lerp(lerp(700, heapY, t), RY + 60, slideT);
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${(1 - slideT) * (i - 5) * 6})`}>
              <rect x={-20} y={-28} width={40} height={56} rx={4} fill={frost ? '#D6E6F2' : '#FBE3A8'} stroke={C.ink} strokeWidth={2.5} />
              {frost ? <path d="M 0 -14 L 0 14 M -12 -7 L 12 7 M -12 7 L 12 -7" stroke="#2A4A6A" strokeWidth={2.5} /> : <circle cx={0} cy={0} r={9} fill="#F6C66B" stroke={C.ink} strokeWidth={2} />}
            </g>
          );
        })}
        {/* the shoulder weeks: blank, then a few clear-sky cards and many lime radar ticks */}
        {slideT > 0.9 && [3, 4, 5, 6, 7, 13, 14, 15, 16].map((sl, k) => {
          const x = RX + (sl + 0.5) * (RW / slots);
          const clear = sl === 5 || sl === 15;
          const on = clamp01(fill * 9 - k);
          return (
            <g key={sl}>
              <rect x={x - 19} y={RY + 8} width={38} height={104} rx={4} fill="none" stroke="#7A8494" strokeWidth={2.5} strokeDasharray="6 6" opacity={0.8} />
              {on > 0 && (clear
                ? <g opacity={on}><rect x={x - 16} y={RY + 34} width={32} height={46} rx={4} fill="#FFF1C4" stroke={C.ink} strokeWidth={2} /><text x={x} y={RY + 63} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.ink}>S2</text></g>
                : <g opacity={on}><text x={x} y={RY + 76} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill="#7A8494">?</text></g>)}
            </g>
          );
        })}
        {/* the TEMPERATURE LED card pinned beside the deck, side by side */}
        {pin > 0.01 && (
          <g transform={`translate(${lerp(330, 780, pin)} ${lerp(830, 930, pin)}) rotate(${-3 + settle(f, b32 + 12, 6)}) scale(${lerp(0.3, 1, pin)})`} opacity={pin}>
            <rect x={-130} y={-40} width={260} height={80} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={3.5} />
            <circle cx={0} cy={-34} r={6} fill="#E8C46A" stroke={C.ink} strokeWidth={2} />
            <rect x={-104} y={-14} width={10} height={36} rx={5} fill={FOREST.bulb} />
            <path d="M -78 0 h 180 M -78 18 h 120" stroke={C.ink} strokeWidth={4} />
          </g>
        )}
        <HeldTravel f={f} x={100} y={1010} w={110} h={290} mode="sweep" seed={19}><Thermometer x={150} y={1290} scale={0.85} f={f} level={0.55} glasses point={deal > 0 && deal < 1 ? 0.7 : 0} rim="#F7B48A" rimSide={-1} /></HeldTravel>
        <Grove x={760} y={1300} f={f} cols={3} rows={1} dx={150} scale={0.55} seed={71} lookAt={540} emotion={fill > 0.3 ? 'proud' : 'curious'} rim="#F7B48A" />
        <HeldTravel f={f} x={40} y={1560} w={1000} h={300} mode="shadow" seed={24}><Grove x={540} y={1840} f={f} cols={6} rows={1} dx={180} scale={0.85} seed={73} lookAt={540} snow={1} rim="#F7B48A" rimSide={-1} cast={0.4} /></HeldTravel>

      </SVG>
    </Frame>
  );
};

// ---- S11 other lakes, other years (L17) ----------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b35 = p.b(35), b36 = p.b(36);
  const pay = ease(f, b35, 30);
  const tag = ease(f, b36, 20);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1020} bg={SKY.dusk[1]} warmth={0.08} overlay={
      <g>
        <Plate text="FIELD-INSTRUMENTED LAKES · 80 TO 110 DAYS" x={540} y={560} size={32} tone="plate" p={win(f, b35 + 8, b36 + 40)} />
        <Plate text="DIFFERENT LAKES · DIFFERENT YEARS" x={540} y={650} size={36} tone="dark" p={win(f, b36 + 10)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="dusk" horizon={740} sunX={160}  seed={9} />
        {/* the instrumented lake and its logger on a stake at the waterline */}
        <KettleLake x={300} y={1180} rx={240} ry={70} f={f} seed={95} ice={0} />
        <g transform="translate(470 1200)">
          <ContactShadow cx={0} cy={2} rx={24} ry={6} />
          <rect x={-7} y={-150} width={14} height={152} fill="#C9A46A" stroke={C.ink} strokeWidth={3.5} />
          <rect x={-34} y={-200} width={68} height={56} rx={6} fill="#E8E2D0" stroke={C.ink} strokeWidth={4} />
          <circle cx={-14} cy={-172} r={6} fill={f % 30 < 15 ? '#E8443A' : '#5A2A2A'} stroke={C.ink} strokeWidth={2} />
          <rect x={0} y={-184} width={24} height={24} rx={3} fill="#3A4A3A" stroke={C.ink} strokeWidth={2} />
          <line x1={0} y1={-60} x2={-60} y2={-20} stroke={C.ink} strokeWidth={3} />
        </g>
        {/* the study's ribbon on top */}
        <HeldTravel f={f} x={140} y={880} w={660} h={100} mode="sweep" seed={3}>
          <g>
            <rect x={160} y={900} width={627} height={56} rx={12} fill={C.water} stroke={C.ink} strokeWidth={4} />
            <text x={470} y={938} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} fill="#F4FBFA">THIS STUDY · ABOUT 114</text>
          </g>
        </HeldTravel>
        {/* the logger pays out its ribbon, which slides up under the 114 ribbon: a range with two ends */}
        <g transform={`translate(0 ${lerp(220, 0, pay)})`} opacity={pay > 0.02 ? 1 : 0}>
          <rect x={160} y={1000} width={440} height={56} rx={12} fill="#5E9AA0" stroke={C.ink} strokeWidth={4} />
          <rect x={600} y={1000} width={165} height={56} fill="#5E9AA0" stroke={C.ink} strokeWidth={4} strokeDasharray="12 8" opacity={0.6} />
          {[['80', 600], ['110', 765]].map(([l, x]) => (
            <g key={l as string}><line x1={x as number} x2={x as number} y1={984} y2={1072} stroke={C.ink} strokeWidth={5} />
              <text x={x as number} y={1102} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill="#FFF6E3">{l}</text></g>
          ))}
        </g>
        {tag > 0.01 && (
          <g transform={`translate(860 ${lerp(820, 990, tag)}) rotate(${settle(f, b36 + 20, 10) + 3 * Math.sin(f / 15)})`}>
            <line x1={0} y1={-120} x2={0} y2={0} stroke={C.ink} strokeWidth={3} />
            <rect x={-56} y={0} width={112} height={56} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={3.5} />
            <path d="M -30 28 h 60 M -30 40 h 40" stroke={C.ink} strokeWidth={3} />
          </g>
        )}
        <VoteTree x={900} y={1300} scale={0.8} f={f} seed={81} emotion="curious" look={-0.8} facing={-1} rim="#F7B48A" rimSide={-1} cast={0.5} />
      </SVG>
    </Frame>
  );
};

// ---- S12 the ducklings (L18-L19), the signature shot ---------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b37 = p.b(37), b38 = p.b(38), b39 = p.b(39);
  const rise = clamp01((f - b37 + 12) / 30);
  const step = ease(f, b38, 30);
  const rebels = [0, 5, 11, 16];
  const crane = easeIO(f, b39 + 40, 60);
  const cam = track([{t: 0, z: 1.06, fx: 560, fy: 1080}, {t: b39 + 40, z: 1.02, fx: 550, fy: 1020}, {t: b39 + 100, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} bg={SKY.dusk[1]} warmth={0.08} overlay={
      <g>
        <Plate text="THE PAPER'S TEMPERATURE MODEL" x={540} y={560} size={36} tone="plate" p={win(f, b37 + 8, b38)} />
        <Plate text="TEMPERATURE MODEL · ICE OUT 82% · ICE ON 75%" x={540} y={640} size={30} tone="warm" p={win(f, b38 - 4, b39 + 30)} />
        <Plate text="THE LAKES THAT BREAK THE RULE" x={540} y={720} size={36} tone="dark" p={win(f, b39 + 10)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="dusk" horizon={740} sunX={140}  seed={10} />
        {/* the crane up: the whole slope, about one lake in five flagged */}
        <g opacity={crane}>
          {Array.from({length: 50}).map((_, i) => {
            const t = h01(i, 71);
            return <KettleLake key={i} x={h01(i, 72) * 1100 - 10} y={860 + t * t * 160} rx={14 + 16 * t} ry={5 + 5 * t} f={f} seed={400 + i} ice={0.5} detail={false} glow={i % 5 === 2 ? 1 : 0} />;
          })}
        </g>
        <HeldTravel f={f} x={70} y={940} w={130} h={320} mode="sweep" seed={17}><Thermometer x={210} y={1120} scale={1.0} f={f} level={0.6} emotion="proud" point={0.5} rim="#F7B48A" rimSide={-1} cast={0.4} /></HeldTravel>
        {/* twenty lakes waddle into line behind the thermometer, the flagged kettle lake hopping in last */}
        {Array.from({length: 20}).map((_, j) => {
          const i = j === 19 ? 0 : j + 1;
          const isRebel = rebels.includes(i);
          const kettle = i === 0;
          const order = kettle ? 19 : i - 1;
          const tLocal = clamp01(rise * 1.5 - order * 0.04);
          if (tLocal <= 0) return null;
          const slot = kettle ? 19 : order;
          const k = slot / 19;
          const lineX = lerp(360, 1000, k);
          const lineY = lerp(1140, 1300, k);
          const scatterX = 160 + h01(i, 41) * 820;
          const scatterY = 1060 + h01(i, 42) * 240;
          const offX = isRebel ? -20 : 0, offY = isRebel ? -(130 + (i % 3) * 25) : 0;
          let x = lerp(scatterX, lineX + offX, step);
          let y = lerp(scatterY, lineY + offY, step) - 6 * Math.abs(Math.sin(f / 5 + i));
          const out = isRebel ? clamp01((f - b39 - (kettle ? 0 : 6 + rebels.indexOf(i) * 6)) / 14) : 0;
          if (isRebel) { y -= out * 30; }
          const sc = (0.9 + 1.4 * (slot / 19)) * (0.7 + 0.3 * tLocal);
          return (
            <g key={i} opacity={tLocal} transform={`translate(${x} ${y}) scale(${sc})`}>
              <KettleLake x={0} y={0} rx={kettle ? 34 : 28} ry={kettle ? 13 : 11} f={f} seed={100 + i} ice={0.6} glow={out} />
              <path d={`M -9 13 l -6 ${8 + 4 * Math.sin(f / 3 + i)} M 9 13 l 6 ${8 - 4 * Math.sin(f / 3 + i)}`} stroke="#E8A040" strokeWidth={4} strokeLinecap="round" />
              {kettle && <LakeFlag x={30} y={4} f={f} s={0.7} />}
            </g>
          );
        })}
        <HeldTravel f={f} x={520} y={880} w={480} h={130} mode="shadow" seed={18}><Grove x={760} y={1000} f={f} cols={5} rows={1} dx={100} scale={0.4} seed={91} lookAt={f > b39 ? 640 : 160} emotion={f > b39 ? 'startled' : 'curious'} rim="#F7B48A" rimSide={-1} cast={0.3} /></HeldTravel>
      </SVG>
    </Frame>
  );
};

// ---- S13 the radar's own view (L20) --------------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b40 = p.b(40), b41 = p.b(41), b42 = p.b(42);
  const snapIn = 0.55 + 0.45 * ease(f, b40, 12);
  const split = easeIO(f, b41, 18);
  const widen = easeIO(f, b42, 26);
  const N = 18, cell = 50, ox = 90, oy = 640;
  const lakeF = (cx: number, cy: number) => {
    const dx = (cx - 9) / 7.2, dy = (cy - 9) / 5.2;
    const jag = 0.12 * Math.sin(cx * 1.7 + cy * 2.3);
    return dx * dx + dy * dy < 1 + jag;
  };
  const splitX = lerp(1080, 540, split) - 540 * widen;
  return (
    <Frame p={p} z0={1.0} z1={1.02} oy={960} bg="#10131A" warmth={0.0} overlay={
      <g>
        <Plate text="MAYBE SHORELINES · PER THE PAPER" x={540} y={560} size={36} tone="plate" p={win(f, b40 + 8, b41)} />
        <Plate text="OR THOSE LAKES REALLY DIFFER" x={740} y={1180} size={26} tone="dark" p={win(f, b41 + 14, b42)} />
        <Plate text="A FIELD CHECK WOULD SETTLE IT" x={540} y={1260} size={38} tone="plate" p={win(f, b42 + 6)} />
      </g>
    }>
      <SVG>
        {/* the radar's pixel view: a lime grid, land pixels bleeding into water along the jagged shore */}
        <g data-band="ok"><rect x={-100} y={-80} width={1280} height={2080} fill="#10131A" /></g>
        <g opacity={snapIn * (1 - widen)} transform={`translate(0 ${(1 - snapIn) * 40})`}>
          {Array.from({length: N * N}).map((_, k) => {
            const cx = k % N, cy = Math.floor(k / N);
            const inLake = lakeF(cx, cy);
            const edge = inLake !== lakeF(cx + 1, cy) || inLake !== lakeF(cx, cy + 1) || inLake !== lakeF(cx - 1, cy) || inLake !== lakeF(cx, cy - 1);
            const bleed = edge ? 0.5 + 0.5 * Math.sin(f / 6 + k) : 0;
            const col = inLake ? (edge ? `rgba(198,240,77,${0.25 + 0.3 * bleed})` : '#1F4A50') : edge ? `rgba(122,90,48,${0.6 + 0.3 * bleed})` : '#3A2C1E';
            const hot = edge && f > b40 + 14 ? 0.5 + 0.5 * Math.sin((f - b40) / 4 + cx * 0.4) : 0;
            return <rect key={k} x={ox + cx * cell} y={oy + cy * cell} width={cell - 3} height={cell - 3} fill={col} stroke={hot > 0 ? '#E6FFA0' : 'none'} strokeWidth={3} strokeOpacity={hot} />;
          })}
          <rect x={ox - 6} y={oy - 6} width={N * cell + 9} height={N * cell + 9} fill="none" stroke={C.lime} strokeWidth={4} />
          <text x={ox} y={oy - 18} fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.lime}>RADAR VIEW · ILLUSTRATIVE</text>
        </g>
        {/* the clean drawing of a lake that really differs, with its own ribbon off-length */}
        <clipPath id="cleanHalf"><rect data-band="ok" x={splitX} y={-80} width={1300} height={2080} /></clipPath>
        <g clipPath="url(#cleanHalf)">
          <g data-band="ok"><rect x={0} y={-80} width={1080} height={2080} fill="#3A2F5E" /></g>
          <Sky f={f} mode="dusk" horizon={740} sunX={160} />
          <Ground f={f} mode="dusk" horizon={740} ponds={false} />
          <KettleLake x={widen > 0.1 ? 540 : 810} y={1050} rx={widen > 0.1 ? 300 : 200} ry={widen > 0.1 ? 90 : 64} f={f} seed={11} ice={0.4} glow={widen > 0.1 ? 0.9 : 0.4} />
          {widen < 0.1 && <rect x={680} y={1160} width={200} height={26} rx={8} fill={C.water} stroke={C.ink} strokeWidth={3} />}
          {widen > 0.1 && <g opacity={widen}><LakeField f={f} at={-60} y0={770} y1={960} n={22} ice={0.4} seed={5} glowSet={[2, 9, 15]} glow={0.8} /><EmptyDesk x={560} y={1060} s={0.75} f={f} card={1} cardAt={-100} /><Grove x={540} y={1300} f={f} cols={5} rows={1} dx={190} scale={0.6} seed={95} lookAt={560} emotion="curious" rim="#F7B48A" rimSide={-1} cast={0.4} /></g>}
        </g>
        {split > 0.01 && widen < 0.98 && <line x1={splitX} x2={splitX} y1={500} y2={1330} stroke="#FFF6E3" strokeWidth={6} />}
      </SVG>
    </Frame>
  );
};

// ---- S14 someone will have to (L21) --------------------------------------------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b43 = p.b(43), b44 = p.b(44);
  const sink = clamp01((f - b43) / 70);
  const walk = clamp01((f - b43) / 120);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.1, fx: 600, fy: 1080}, {t: p.dur, z: 1.0, fx: 540, fy: 980}])} bg={C.night} vignette={0.32} overlay={
      <g>
        <Plate text="THE FOREST CAN'T STAND ON THE ICE" x={540} y={560} size={36} tone="dark" p={win(f, b43 + 6, b44)} />
        <Plate text="NOT YET CHECKED" x={540} y={650} size={42} tone="plate" p={win(f, b44 + 6)} />
      </g>
    }>
      <SVG>
        <World f={f} mode="night" horizon={740} ponds={false}  seed={11} />
        <LakeField f={f} at={-40} y0={770} y1={1000} n={26} ice={1} seed={3} />
        {/* the caribou crosses behind the lake */}
        <Caribou x={lerp(1150, 840, walk)} y={1040} scale={0.6} f={f} facing={-1} trot={walk < 1 ? 0.5 : 0} emotion={f > b44 ? 'wary' : 'calm'} />
        <KettleLake x={680} y={1170} rx={260} ry={74} f={f} seed={11} ice={1} glow={0.9} />
        <EmptyDesk x={690} y={1190} s={0.85} f={f} card={1} cardAt={-100} />
        <LakeFlag x={930} y={1210} f={f} s={0.9} />
        {/* the forest on the shore sinks back into the snow */}
        <path d="M -100 1250 Q 300 1220 600 1260 T 1200 1250 L 1200 1960 L -100 1960 Z" fill="#C3CBDA" stroke={C.ink} strokeWidth={4} data-band="ok" />
        <Grove x={330} y={1320} f={f} cols={4} rows={1} dx={150} scale={0.62} pop={1 - sink} snow={1} rim="#B9B4FF" seed={2} lookAt={690} emotion="calm" />
        <NearSedge f={f} mode="night" />
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

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

export const ep1116Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1116Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1116: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 7.9, 19.9, 25.6, 34.2, 46.2, 57.0, 67.3, 73.6, 84.1, 96.3, 101.9, 114.5, 121.9, 127.0].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.night}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1E1B36" ink="#FFF6E3" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
