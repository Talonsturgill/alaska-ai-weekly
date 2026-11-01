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
import {LayeredLand} from './lib/bench';
import {MountainGoat} from './lib/fauna';
import {RainGauge} from './lib/permit';
import {SeismicStation, SatelliteEye} from './lib/sensors';
import {ThawProbe} from './lib/thaw';
import {AK_PATH} from './lib/akmap';
import {IDS} from './Ep1101Ids';

// The Stand-In, 2026-11-01. Palette roles are art_direction.json. THE STAND-IN is a pale-grey dashed GHOST HILL cased in charcoal, the throughline:
// blank outline (S1), gridded copy (S1), sketched over the map (S2), stale and frozen-grey (S3), beside an unlit socket (S5), tugged onto the slope (S5),
// hollow with dead feeds (S6), sharp near instruments and fog beyond (S7), a faint remnant (S8), sharp beside one lit lamp (S9).
// Lantern-gold is ONLY on listening instruments (S7) and the one lit lamp and the goat's lit rim (S9). Every desk is slate, every plate is cool pale-grey.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

export const C = {
  sky: '#2E3B45', skyLo: '#4A5B58', ground: '#3E5648', moss: '#3F6B63', gold: '#F2C14E', key: '#B9B86A', shadow: '#141B20', timber: '#2B3A3F',
  plate: '#C9D2D2', ink: '#1B2328', rain: '#7FA3B5', ghost: '#EEF2F0', casing: '#1B2328', bronze: '#6E6A58', sat: '#9CC3D8', shake: '#E08A5B', groundw: '#8FBF8A',
  stale: '#8A9496',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
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

type Tone = 'dark' | 'plate' | 'warn' | 'gold';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#16222A', fg: '#E4ECEC', edge: '#E4ECEC'},
  plate: {fill: C.plate, fg: C.ink, edge: C.ink},
  warn: {fill: C.plate, fg: '#7A2E24', edge: '#7A2E24'},
  gold: {fill: C.gold, fg: C.ink, edge: C.ink},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'dark', p = 1, rot = 0, drop = 0}) => {
  const ls = displayLines ?? [text ?? ""];
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

/** a sized label: rect sized by monoW, text centred on it. Used for every in-scene string so text_fit pairs them. */
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

// ---- the shot frame -----------------------------------------------------------------------------------------------------------------------
const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; warmth?: number; sky?: number; breakK?: number; rain?: number; children: React.ReactNode}> =
({p, cam, z0 = 1, z1 = 1.05, bloom = 0.05, vignette = 0.24, ox = 540, oy = 960, warmth = 0.02, sky = 1, breakK = 0, rain = 1, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + 5 * Math.sin(p.f / 23)}px, ${jl.y + 6 * Math.sin(p.f / 17 + 1) + 5 * t}px) rotate(${0.2 * Math.sin(p.f / 31)}deg) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {sky > 0 && <Sky f={p.f} breakK={breakK} />}
        {children}
        {rain > 0 && <Rain f={p.f} amount={rain} />}
      </div>
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill={C.ink} stroke="#C9D2D2" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#C9D2D2">{CHIP}</text>
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

// ---- the world: sky, rain, slope, ghost -------------------------------------------------------------------------------------------------------
const Sky: React.FC<{f: number; breakK: number}> = ({f, breakK}) => (
  <svg width={W * 3} height={H * 2} viewBox="-1080 -960 3240 3840" style={{position: 'absolute', left: -1080, top: -960}}>
    <defs>
      <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#26323B" /><stop offset="0.45" stopColor={lerpColor(C.sky, '#5E7580', breakK * 0.6)} /><stop offset="0.7" stopColor={lerpColor(C.skyLo, '#8FA79A', breakK * 0.5)} /><stop offset="1" stopColor="#1C2A28" />
      </linearGradient>
      <radialGradient id="breakg" cx="0.7" cy="0.32" r="0.4"><stop offset="0" stopColor="#E9E7B6" stopOpacity={0.55 * breakK} /><stop offset="1" stopColor="#E9E7B6" stopOpacity={0} /></radialGradient>
    </defs>
    <rect x={-1080} y={-960} width={W * 3} height={H * 2} fill="url(#skyg)" />
    <rect x={-1080} y={-960} width={W * 3} height={H * 2} fill="url(#breakg)" />
    <path d="M -100,640 L 80,470 L 190,560 L 330,400 L 470,540 L 620,430 L 780,570 L 930,440 L 1180,600 L 1180,800 L -100,800 Z" fill="#3A4C54" opacity={0.65} />
    <path d="M 80,470 L 120,505 L 100,520 L 60,505 Z M 330,400 L 372,445 L 340,455 L 305,440 Z M 620,430 L 660,470 L 630,482 L 598,462 Z M 930,440 L 968,480 L 940,490 L 905,470 Z" fill="#C9D2D2" opacity={0.5} />
    {[0, 1, 2].map((i) => (
      <ellipse key={`cl${i}`} cx={((f * (0.6 + i * 0.25) + i * 400) % 1500) - 200} cy={330 + i * 90} rx={300 + i * 50} ry={28} fill="#5A6F76" opacity={0.28} />
    ))}
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M -40,${760 - i * 70} Q 180,${690 - i * 70 + 10 * Math.sin(f / 90 + i)} 360,${740 - i * 70} T 700,${720 - i * 70} T 1120,${750 - i * 70} L 1120,1000 L -40,1000 Z`}
        fill={['#34454A', '#2D3C42', '#27353A'][i]} opacity={0.55 - i * 0.12} />
    ))}
  </svg>
);

const lerpColor = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], clamp01(t))).toString(16).padStart(2, '0')).join('');
};

const Rain: React.FC<{f: number; amount: number}> = ({f, amount}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    {Array.from({length: Math.round(70 * amount)}).map((_, i) => {
      const x0 = (i * 163) % 1180 - 50;
      const sp = 38 + (i % 5) * 7;
      const y = ((i * 97 + f * sp) % 2100) - 100;
      return <line key={i} x1={x0 + y * 0.12} y1={y} x2={x0 + y * 0.12 - 8} y2={y + 34} stroke={C.rain} strokeWidth={2} opacity={0.28} />;
    })}
  </svg>
);

/** THE REAL SLOPE: LayeredLand with a wet overlay, a crack and a slump. soak 0..1, crack 0..1, slump 0..1. x is the slope's centre. */
const Slope: React.FC<{f: number; x: number; y: number; w?: number; h?: number; soak?: number; crack?: number; slump?: number; scar?: number}> = ({f, x, y, w = 640, h = 520, soak = 0, crack = 0, slump = 0, scar = 0}) => (
  <g transform={`translate(${slump * 18} ${slump * 26}) rotate(${slump * 2.2} ${x} ${y})`}>
    <ellipse cx={x + 8} cy={y + 8} rx={w / 2 + 30} ry={18} fill="#000" opacity={0.35} />
    <LayeredLand x={x} y={y} w={w} h={h} f={f} layers={9} />
    <g opacity={0.55 * soak}>
      <rect x={x - w / 2} y={y - h - 20} width={w} height={h + 20} fill={C.rain} opacity={0.5} style={{mixBlendMode: 'multiply'}} />
      {Array.from({length: 8}).map((_, i) => <path key={i} d={`M ${x - w / 2 + 40 + i * (w / 8)},${y - h} q 6,${60 + (i % 3) * 40} -4,${140 + (i % 4) * 50}`} stroke={C.rain} strokeWidth={5} fill="none" opacity={0.6} />)}
    </g>
    {crack > 0 && (
      <path d={`M ${x - 40},${y - h + 20} l 18,${60 * crack} l -26,${70 * crack} l 30,${80 * crack} l -20,${70 * crack}`} stroke={C.ink} strokeWidth={9} fill="none" strokeLinejoin="round" />
    )}
    {scar > 0 && (
      <path d={`M ${x + 40},${y - h + 10} l -26,${50 * scar} l 24,${60 * scar} l -30,${70 * scar} L ${x + 10},${y - h + 10 + 200 * scar} L ${x + 70},${y - h + 10 + 150 * scar} Z`} fill="#241E18" stroke={C.ink} strokeWidth={5} opacity={0.9} />
    )}
  </g>
);

/** THE GHOST HILL: the Stand-In. A pale-grey dashed outline cased in charcoal, with an optional faint grid fill and fog split. */
const GHOST_D = (x: number, y: number, w: number, h: number) =>
  `M ${x - w / 2},${y} L ${x - w / 2 + 40},${y - h * 0.42} L ${x - w * 0.22},${y - h * 0.82} L ${x},${y - h} L ${x + w * 0.2},${y - h * 0.86} L ${x + w * 0.38},${y - h * 0.46} L ${x + w / 2},${y} Z`;
const GhostHill: React.FC<{f: number; x: number; y: number; w?: number; h?: number; draw?: number; grid?: number; stale?: number; hollow?: number; fog?: number; sharp?: number; alpha?: number; id?: string}> =
({f, x, y, w = 640, h = 520, draw = 1, grid = 0, stale = 0, hollow = 0, fog = 0, sharp = 1, alpha = 1, id = 'gh'}) => {
  if (draw <= 0.01) return null;
  const d = GHOST_D(x, y, w, h);
  const col = lerpColor(C.ghost, C.stale, stale);
  const jit = (1 - sharp) * 6 + hollow * 2;
  const dash = `${22 - stale * 8} ${14 + stale * 6}`;
  const len = 2400;
  const off = -(f * 0.9) % 400;
  const cid = `${id}${Math.round(x)}${Math.round(y)}`;
  return (
    <g opacity={alpha} transform={`translate(${jit * Math.sin(f / 5.3)} ${jit * 0.5 * Math.sin(f / 4.1)}) translate(0 ${hollow * 18}) scale(1 ${1 - hollow * 0.06})`} style={{transformOrigin: `${x}px ${y}px`}}>
      <defs>
        <clipPath id={`${cid}c`}><path d={d} /></clipPath>
        <linearGradient id={`${cid}f`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={C.ink} stopOpacity={0} /><stop offset="1" stopColor="#D5DDDA" stopOpacity={0.85} /></linearGradient>
      </defs>
      <g clipPath={`url(#${cid}c)`}>
        <rect x={x - w / 2} y={y - h} width={w} height={h} fill={C.ghost} opacity={0.06 * (1 - hollow)} />
        {grid > 0 && Array.from({length: 12}).map((_, i) => (
          <g key={i} opacity={0.35 * grid * (1 - hollow)}>
            <line x1={x - w / 2 + i * (w / 11)} y1={y - h} x2={x - w / 2 + i * (w / 11)} y2={y} stroke={col} strokeWidth={1.6} />
            <line x1={x - w / 2} y1={y - h + i * (h / 11)} x2={x + w / 2} y2={y - h + i * (h / 11)} stroke={col} strokeWidth={1.6} />
          </g>
        ))}
        {fog > 0 && <rect x={x - w / 2} y={y - h} width={w} height={h} fill={`url(#${cid}f)`} opacity={fog} />}
      </g>
      <path d={d} fill="none" stroke={C.casing} strokeWidth={9} strokeLinejoin="round" strokeDasharray={`${len * draw} ${len}`} opacity={0.85} />
      <path d={d} fill="none" stroke={col} strokeWidth={5} strokeLinejoin="round" strokeDasharray={`${Math.max(1, len * draw)} ${len}`} strokeDashoffset={0} opacity={0.0} />
      <path d={d} fill="none" stroke={col} strokeWidth={5} strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={off} opacity={draw >= 0.99 ? 1 : 0.0} />
      {draw < 0.99 && <path d={d} fill="none" stroke={col} strokeWidth={5} strokeLinejoin="round" pathLength={1} strokeDasharray={`${draw} 1`} />}
    </g>
  );
};

const Goat: React.FC<{f: number; x: number; y: number; scale?: number; facing?: 1 | -1; ghost?: boolean; lag?: number; rim?: number}> = ({f, x, y, scale = 0.6, facing = 1, ghost = false, lag = 0, rim = 0}) => (
  <g opacity={ghost ? 0.5 : 1} style={ghost ? {filter: 'grayscale(1) brightness(1.5)'} : undefined}
    transform={`translate(0 ${(ghost ? lag * 4 : 0) + 3 * Math.sin(f / 9)}) translate(${x} ${y}) scale(${1 + 0.012 * Math.sin(f / 9)} ${1 + 0.022 * Math.sin(f / 9)}) translate(${-x} ${-y})`}>
    <MountainGoat x={x} y={y} scale={scale} f={f} facing={facing} />
    {rim > 0 && <ellipse cx={x + 24 * facing} cy={y - 100 * scale} rx={46 * scale} ry={90 * scale} fill="none" stroke={C.gold} strokeWidth={6} opacity={rim * 0.7} />}
  </g>
);

const Gauge: React.FC<{x: number; y: number; f: number; scale?: number; level?: number; id: string; native?: boolean}> = ({native = false, ...r}) => (
  <g style={native ? undefined : {filter: 'grayscale(0.9) brightness(0.78)'}}><RainGauge {...r} /></g>
);

const Feed: React.FC<{f: number; d: string; color: string; k: number; dead?: number; seed?: number}> = ({f, d, color, k, dead = 0, seed = 0}) => {
  if (k <= 0.01) return null;
  const col = lerpColor(color, '#6A7274', dead);
  return (
    <g opacity={clamp01(k * 1.6)}>
      <path d={d} stroke={C.ink} strokeWidth={11} fill="none" opacity={0.7} strokeLinecap="round" />
      <path d={d} stroke={col} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray="16 14" strokeDashoffset={-(f * (6 - dead * 5) + seed * 9)} />
    </g>
  );
};

const Lamp: React.FC<{x: number; y: number; lit: number; f: number; cone?: number}> = ({x, y, lit, f, cone = 0}) => (
  <g>
    <ellipse cx={x + 6} cy={y + 4} rx={46} ry={10} fill="#000" opacity={0.35} />
    <rect x={x - 9} y={y - 260} width={18} height={260} fill={C.timber} stroke={C.ink} strokeWidth={5} />
    <path d={`M ${x - 40},${y - 250} L ${x + 40},${y - 250} L ${x + 28},${y - 300} L ${x - 28},${y - 300} Z`} fill={C.timber} stroke={C.ink} strokeWidth={5} />
    <circle cx={x} cy={y - 276} r={13} fill={lit > 0.02 ? C.gold : '#3A4A50'} stroke={C.ink} strokeWidth={4} opacity={lit > 0.02 ? 0.5 + 0.5 * lit : 1} />
    {lit > 0.02 && <circle cx={x} cy={y - 276} r={60 + 8 * Math.sin(f / 8)} fill={C.gold} opacity={0.18 * lit} />}
    {cone > 0 && <path d={`M ${x},${y - 276} L ${x - 140 * cone},${y} L ${x + 140 * cone},${y} Z`} fill={C.gold} opacity={0.16 * cone} />}
  </g>
);

const Socket: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <ellipse cx={x + 5} cy={y + 4} rx={40} ry={9} fill="#000" opacity={0.35} />
    <rect x={x - 8} y={y - 200} width={16} height={200} fill={C.timber} stroke={C.ink} strokeWidth={5} />
    <rect x={x - 30} y={y - 222} width={60} height={26} rx={5} fill="#2E3B40" stroke={C.ink} strokeWidth={5} />
    <circle cx={x} cy={y - 209} r={8} fill="#1B2328" stroke="#5A686C" strokeWidth={3} />
  </g>
);

const Coins: React.FC<{x: number; y: number; n: number; k: number; w?: number; id?: string}> = ({x, y, n, k, w = 120, id = 'c'}) => {
  const shown = Math.floor(n * clamp01(k));
  return (
    <g>
      <ellipse cx={x + 6} cy={y + 8} rx={w / 2 + 18} ry={14} fill="#000" opacity={0.4} />
      {Array.from({length: shown}).map((_, i) => (
        <g key={`${id}${i}`} transform={`translate(${x + (i % 2 ? 3 : -3)} ${y - i * 14})`}>
          <ellipse cx={0} cy={0} rx={w / 2} ry={14} fill={C.bronze} stroke={C.ink} strokeWidth={4} />
          <rect x={-w / 2} y={-2} width={w} height={14} fill="#58553F" stroke={C.ink} strokeWidth={0} />
        </g>
      ))}
    </g>
  );
};

/** THE GROUND: wet ground with rain ripples, puddles and dark foreground rocks so the lower frame is never flat fill. */
const Ground: React.FC<{f: number; tint?: string}> = ({f, tint}) => (
  <g>
    <rect data-band="ok" x={-1100} y={1180} width={3280} height={1400} fill={tint ?? C.ground} />
    <g data-band="ok" opacity={0.5}>
      {Array.from({length: 9}).map((_, i) => (
        <path key={i} d={`M -40,${1230 + i * 62} Q 270,${1215 + i * 62 + 6 * Math.sin(f / 30 + i)} 540,${1235 + i * 62} T 1120,${1230 + i * 62}`} stroke="#1B2A26" strokeWidth={3 + (i % 3)} fill="none" opacity={0.6} />
      ))}
    </g>
    {[0, 1, 2, 3, 4].map((i) => {
      const cx = 140 + i * 210 + (i % 2) * 30, cy = 1290 + (i % 3) * 110 + (i > 2 ? 150 : 0);
      const k = ((f + i * 17) % 45) / 45;
      return (
        <g key={i} data-band="ok">
          <ellipse cx={cx} cy={cy} rx={78} ry={13} fill="#22343A" opacity={0.75} />
          <ellipse cx={cx + 20 * Math.sin(i)} cy={cy} rx={10 + 52 * k} ry={2 + 8 * k} fill="none" stroke={C.rain} strokeWidth={2.5} opacity={0.75 * (1 - k)} />
        </g>
      );
    })}
    <g data-band="ok">
      <path d="M -60,1920 L -60,1640 L 90,1590 L 210,1680 L 300,1920 Z" fill="#0F171A" stroke={C.ink} strokeWidth={4} />
      <path d="M 1140,1920 L 1140,1660 L 1010,1610 L 880,1700 L 800,1920 Z" fill="#0F171A" stroke={C.ink} strokeWidth={4} />
      <path d="M 420,1920 L 470,1800 L 560,1780 L 640,1830 L 700,1920 Z" fill="#131E21" stroke={C.ink} strokeWidth={4} opacity={0.9} />
    </g>
  </g>
);

// ---- S1: the slope --------------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const k1 = ease(f, b(1), 20);
  const pull = easeIO(f, b(3), 40);
  const scar = ease(f, b(2), 26);
  const grid = ease(f, b(4), 30);
  const jit = bump(f, b(5), 30);
  const q = ease(f, b(6), 24);
  const sit = springy(f, b(2) + 14, 22);
  const camZ = lerp(1.0, 0.62, pull) + 0.02 * ease(f, b(5), 40) - 0.06 * ease(f, b(4), 30) * pull;
  return (
    <Frame p={p} cam={(ff) => ({z: lerp(1.08, 0.78, easeIO(ff, b(3), 44)) + 0.0 * camZ, fx: 540, fy: lerp(980, 1010, easeIO(ff, b(3), 44))})} breakK={0}>
      {pull > 0.3 && Array.from({length: 5}).map((_, i) => (
        <g key={i} opacity={clamp01((pull - 0.3) * 1.6)}>
          <LayeredLand x={-150 + i * 280} y={1130 + (i % 2) * 24} w={420} h={300 + (i % 3) * 60} f={f} layers={6} />
        </g>
      ))}
      <SVG>
        <Slope f={f} x={330} y={1180} soak={0.7 + 0.2 * Math.sin(f / 30)} scar={scar} />
        <Goat f={f} x={250} y={668} scale={0.8} />
        <g transform={`translate(0 ${sit * 0})`} />
        <Ground f={f} />
        <path d={`M 0,1180 L 1080,1180`} stroke={C.ink} strokeWidth={6} />
        <GhostHill f={f} x={780} y={1180} w={560} h={500} draw={k1} grid={grid} alpha={1} id="s1" />
        <Goat f={f} x={700} y={800} scale={0.66} ghost lag={(1 - sit) * 10} />
        <Plate x={540} text="A COPY OF A SLOPE · A PLAN" y={rv(1)} p={k1 * (1 - ease(f, b(2), 10))} size={30} />
        <Plate x={540} text="SLIDES HAVE KILLED PEOPLE" y={rv(2)} p={ease(f, b(2), 18) * (1 - ease(f, b(3), 10))} tone="warn" size={30} />
        <Plate x={540} text="SOUTHEAST ALASKA" y={rv(3)} p={ease(f, b(3), 18) * (1 - ease(f, b(4), 10))} size={30} />
        <Plate x={540} text="A COMPUTER COPY · PLANNED" y={rv(4)} p={ease(f, b(4), 18) * (1 - ease(f, b(5), 10))} size={28} />
        <Plate x={540} text="A PLAN TO KEEP UP" y={rv(5)} p={ease(f, b(5), 18) * (1 - ease(f, b(6), 10))} size={28} rot={jit * 2} />
        <Plate x={540} text="CAN THAT CARTOON KEEP UP WITH A REAL MOUNTAIN?" displayLines={['CAN THAT CARTOON KEEP UP', 'WITH A REAL MOUNTAIN?']} y={1130} p={q} size={30} />
      </SVG>
    </Frame>
  );
};
// vertical rack for the S1 stacked plates, one at a time so they never overlap
const rv = (n: number) => ({1: 560, 2: 560, 3: 560, 4: 560, 5: 560}[n] ?? 560);

// ---- S2: Fairbanks relief map ---------------------------------------------------------------------------------------------------------------
const Relief: React.FC<{f: number; x: number; y: number; k: number}> = ({f, x, y, k}) => {
  const layers = 14;
  return (
    <g transform={`translate(${x} ${y + (1 - k) * 260}) scale(0.9)`} opacity={clamp01(k * 2)}>
      <ellipse cx={0} cy={470} rx={420} ry={34} fill="#000" opacity={0.4} />
      {Array.from({length: layers}).map((_, i) => (
        <path key={i} d={AK_PATH} transform={`translate(-540 ${(layers - i) * 3 - 20}) scale(1.2)`} fill={i === layers - 1 ? '#4B6359' : '#243238'} stroke={C.ink} strokeWidth={i === layers - 1 ? 4 : 1} />
      ))}
    </g>
  );
};
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rise = easeIO(f, b(7) - 6, 34);
  const pin = springy(f, b(8), 22);
  const coins = ease(f, b(9), 40);
  const road = ease(f, b(10), 40);
  const ghost = ease(f, b(12), 36);
  const cardP = ease(f, b(11), 18);
  const cnt = Math.round(1772170 * coins);
  return (
    <Frame p={p} z0={1.0} z1={1.07} breakK={0}>
      <SVG>
        <Ground f={f} />
        <Relief f={f} x={540} y={820} k={rise} />
        <g transform={`translate(${470} ${900 - (1 - pin) * 200})`} opacity={clamp01(pin * 3)}>
          <circle cx={0} cy={0} r={13} fill="#7A2E24" stroke={C.ink} strokeWidth={4} />
          <line x1={0} y1={0} x2={0} y2={36} stroke={C.ink} strokeWidth={5} />
          <circle cx={0} cy={0} r={20 + 8 * Math.sin(f / 7)} fill="none" stroke="#C9D2D2" strokeWidth={3} opacity={0.6} />
        </g>
        <Coins x={680} y={1160} n={16} k={coins} id="uaf" />
        <rect x={150} y={1060} width={640 * road} height={26} rx={10} fill="#2A383C" stroke={C.ink} strokeWidth={4} />
        <rect x={150} y={1060} width={Math.max(0, 640 * road * 0.07)} height={26} rx={10} fill={C.groundw} />
        <GhostHill f={f} x={520} y={780} w={300} h={220} draw={ghost} grid={ghost} id="s2" />
        <Plate x={540} text="NSF AWARD RECORD 2608510" displayLines={['NSF AWARD RECORD', '2608510']} y={560} p={ease(f, b(7), 16) * (1 - ease(f, b(11), 10))} size={28} />
        <Plate x={540} text="UNIVERSITY OF ALASKA FAIRBANKS" y={640} p={ease(f, b(8), 16) * (1 - ease(f, b(12), 10))} size={24} />
        <Plate x={540} text="$1,772,170 · UAF" y={1010} p={ease(f, b(9), 14)} size={28} />
        <Plate x={540} text="AUG 1ST 2026 TO JULY 31ST 2032" y={1120} p={ease(f, b(10), 14)} size={24} />
        <Plate x={540} text="PI CARL TAPE · UAF" y={700} p={cardP * (1 - ease(f, b(12), 10))} size={26} />
        <Plate x={540} text="DIGITAL TWIN · A STAND-IN" y={1210} p={ease(f, b(12), 16)} size={26} />
      </SVG>
    </Frame>
  );
};

// ---- S3: the chain --------------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const strip = easeIO(f, b(13), 22);
  const soak = ease(f, b(14), 40);
  const crack = ease(f, b(15), 24);
  const slump = ease(f, b(16), 26);
  const stale = ease(f, b(16), 40);
  const panelX = (i: number) => 190 + i * 350;
  return (
    <Frame p={p} z0={1.0} z1={1.05} breakK={0}>
      <SVG>
        <Ground f={f} />
        <g transform={`translate(${(1 - strip) * 700} 0)`}>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={panelX(i) - 165} y={640} width={330} height={560} rx={12} fill="#2C3A41" stroke={C.ink} strokeWidth={5} />
              <g transform={`translate(${panelX(i) - 165} 640) scale(0.5)`}>
                <Slope f={f} x={190} y={1020} w={420} h={380} soak={i === 0 ? soak : i === 1 ? 1 : 1} crack={i === 1 ? crack : i === 2 ? 1 : 0} slump={i === 2 ? slump : 0} />
                <GhostHill f={f} x={520} y={1020} w={360} h={340} id={`s3${i}`} grid={0.8} stale={i === 2 ? stale : 0} alpha={0.95} />
              </g>
            </g>
          ))}
        </g>
        <Gauge x={panelX(0) + 100} y={1180} f={f} scale={0.28} level={0.1 + 0.8 * soak} id="s3g" />
        <g opacity={ease(f, b(15), 8) * 0.9 + 0.1}><SeismicStation x={panelX(1) + 120} y={1190} f={f} scale={0.4} emotion={crack > 0.1 ? 'straining' : 'listening'} lamp={0} /></g>
        <g opacity={ease(f, b(16), 14)}>
          <ellipse cx={panelX(2)} cy={620} rx={150} ry={46} fill="#3A4B52" stroke={C.ink} strokeWidth={5} />
          <ellipse cx={panelX(2) - 70} cy={600} rx={90} ry={36} fill="#445760" stroke={C.ink} strokeWidth={5} />
        </g>
        <Plate x={540} text="THE CHAIN PER THE AWARD ABSTRACT" displayLines={['THE CHAIN', 'PER THE AWARD ABSTRACT']} y={500} p={ease(f, b(13), 14)} size={26} />
        <Plate x={260} text="1 · RAIN SOAKS THE HILL" y={1110} p={ease(f, b(14), 12) * (1 - ease(f, b(15), 12))} size={20} />
        <Plate x={540} text="2 · A QUAKE WEAKENS IT" y={1170} p={ease(f, b(15), 12) * (1 - ease(f, b(16), 12))} size={20} />
        <Plate x={790} text="3 · A LATER STORM BRINGS IT DOWN" y={1230} p={ease(f, b(16), 12)} size={18} />
        <Plate x={540} text="A COPY WITH NO READINGS" y={1010} p={ease(f, b(16) + 20, 16)} size={22} tone="warn" />
      </SVG>
    </Frame>
  );
};

// ---- S4: Haines and Wrangell, the hush ---------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lvl = ease(f, b(18), 50) * 0.95;
  const drain = ease(f, b(21), 90);
  const rainAmt = 1 + 0.8 * ease(f, b(45), 40);
  return (
    <Frame p={p} z0={1.0} z1={1.18} oy={1020} rain={rainAmt} breakK={0} vignette={0.38}>
      <SVG>
        <rect data-band="ok" x={-1100} y={-1000} width={3280} height={4000} fill="#10171B" opacity={0.6} />
        <Gauge x={260} y={1160} f={f} scale={0.95} level={Math.max(0.02, lvl - drain * 0.6)} id="s4g" />
        <g opacity={0.8}>
          <ellipse cx={720} cy={1190} rx={340} ry={16} fill="#000" opacity={0.4} />
          <Slope f={f} x={720} y={1180} w={560} h={480} soak={0.5 + 0.5 * ease(f, b(17), 40)} scar={ease(f, b(17), 50) * 0.7 + 0.3 * ease(f, b(20), 40)} crack={ease(f, b(20) + 20, 30)} slump={ease(f, b(21), 50)} />
        </g>
        <rect data-band="ok" x={-1100} y={1180} width={3280} height={1400} fill="#0C1215" opacity={0.7} />
        <Plate x={750} text="HAINES DEC 2020" displayLines={['HAINES', 'DEC 2020']} y={800} size={34} p={ease(f, b(17), 18) * (1 - ease(f, b(20) - 4, 8))} />
        <Plate x={540} text="AT LEAST 8 IN OF RAIN IN 2 DAYS · PER KHNS" y={620} size={22} p={ease(f, b(18), 16) * (1 - ease(f, b(20) - 4, 8))} />
        <Plate x={750} text="TWO KILLED" y={1090} size={34} p={ease(f, b(19), 20) * (1 - ease(f, b(20) - 4, 8))} tone="warn" />
        <Plate x={750} text="WRANGELL NOV 20TH 2023" displayLines={['WRANGELL', 'NOV 2023']} y={930} size={34} p={ease(f, b(20), 20)} />
        <Plate x={750} text="SIX KILLED" y={1190} size={34} p={ease(f, b(21), 20)} tone="warn" />
      </SVG>
    </Frame>
  );
};

// ---- S5: the loop ---------------------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rise = easeIO(f, b(22), 30);
  const tug = springy(f, b(29), 40);
  const fx = (key: number) => ease(f, b(key), 18);
  const sharp = 1 - 0.6 * (1 - tug);
  const brk = ease(f, b(29), 60);
  const gx = lerp(840, 700, tug);
  return (
    <Frame p={p} z0={1.0} z1={1.05} breakK={brk} warmth={0.02 + 0.05 * brk}
      cam={track([{t: 0, z: 1.12, fx: 700, fy: 980}, {t: b(22) + 40, z: 0.92, fx: 600, fy: 1000}, {t: p.dur, z: 1.0, fx: 600, fy: 1000}])}>
      <SVG>
        <Ground f={f} />
        <Slope f={f} x={300} y={1180} w={560} h={500} soak={0.8} />
        <GhostHill f={f} x={gx} y={1180} w={520} h={470} draw={rise} grid={0.6 + 0.4 * tug} fog={0.5 * (1 - tug)} sharp={sharp} id="s5" />
        <Lamp x={1000} y={1180} lit={0} f={f} />
        <Goat f={f} x={560} y={1175} scale={0.5} />
        <SeismicStation x={150} y={1195} f={f} scale={0.62} emotion="listening" lamp={0} />
        <g opacity={fx(24)}>
          <SatelliteEye x={540} y={620} scale={0.8} f={f} lensGlow={0.1} lensColor={C.sat} dishColor="#6E8088" coneColor={C.sat} telemetryColor={C.sat} />
        </g>
        <g opacity={fx(25)}><Gauge x={900} y={1150} f={f} scale={0.5} level={0.7} id="s5g" /></g>
        <g opacity={fx(26)}><ThawProbe x={460} y={1180} depth={30} f={f} len={380} ftPx={90} id="s5p" /></g>
        <Feed f={f} d={`M 180,1040 C 330,900 560,980 ${gx - 120},980`} color={C.shake} k={fx(23)} seed={0} />
        <Feed f={f} d={`M 540,660 C 600,760 ${gx - 60},860 ${gx - 20},880`} color={C.sat} k={fx(24)} seed={1} />
        <Feed f={f} d={`M 900,900 C 880,900 ${gx + 120},900 ${gx + 120},980`} color={C.rain} k={fx(25)} seed={2} />
        <Feed f={f} d={`M 470,1160 C 520,1230 ${gx - 100},1240 ${gx - 60},1140`} color={C.groundw} k={fx(26)} seed={3} />
        {fx(27) > 0.02 && [0, 1, 2, 3].map((i) => (
          <g key={i} opacity={fx(27)}>
            <circle cx={150 + i * 250} cy={560} r={46} fill="#16222A" stroke={C.plate} strokeWidth={5} />
            <line x1={150 + i * 250} y1={560} x2={150 + i * 250 + 30 * Math.cos(f / (6 + i * 3))} y2={560 + 30 * Math.sin(f / (6 + i * 3))} stroke={C.plate} strokeWidth={5} />
          </g>
        ))}
        {ease(f, b(28), 14) > 0.02 && (
          <g opacity={ease(f, b(28), 14)}>
            <rect x={90} y={620} width={240} height={140} rx={10} fill="#2C3A41" stroke={C.ink} strokeWidth={5} />
            <circle cx={210} cy={690} r={34} fill="none" stroke={C.plate} strokeWidth={6} />
            <line x1={210} y1={690} x2={210 + 30 * Math.cos(f / 9)} y2={690 + 30 * Math.sin(f / 9)} stroke={C.plate} strokeWidth={6} />
          </g>
        )}
        <Plate x={540} text="WHICH SLOPE?" y={500} p={fx(22) * (1 - ease(f, b(23), 10))} size={30} />
        <Plate x={180} text="SHAKING" y={1030} p={fx(23) * (1 - ease(f, b(24), 10))} size={28} />
        <Plate x={540} text="SATELLITE PICTURES" y={760} p={fx(24) * (1 - ease(f, b(25), 10))} size={28} />
        <Plate x={900} text="WEATHER" y={990} p={fx(25) * (1 - ease(f, b(26), 10))} size={28} />
        <Plate x={460} text="GROUNDWATER" y={1140} p={fx(26) * (1 - ease(f, b(27), 10))} size={28} />
        <Plate x={540} text="SEPARATE SYSTEMS RARELY WORK TOGETHER" displayLines={['SEPARATE SYSTEMS', 'RARELY WORK TOGETHER']} y={660} p={fx(27) * (1 - ease(f, b(28), 10))} size={26} />
        <Plate x={540} text="SURROGATE MODEL · FAST STAND-IN FOR SLOW PHYSICS" y={890} p={fx(28) * (1 - ease(f, b(29), 10))} size={24} />
        <Plate x={540} text="EACH NEW READING WOULD TUG IT CLOSER" y={580} p={ease(f, b(29), 14)} size={26} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the fair case, it happens to the ghost, alone on a void -----------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const hol = ease(f, b(30), 40);
  const dead = (key: number) => ease(f, b(31) + key * 8, 20);
  const lone = ease(f, b(32), 20);
  const fork = ease(f, b(33), 30);
  const test = ease(f, b(46), 24);
  const lean = ease(f, b(46) + 6, 30) * (1 - 0.0);
  return (
    <Frame p={p} z0={1.0} z1={1.07} breakK={0} sky={0} vignette={0.4}>
      <SVG>
        <rect data-band="ok" x={-1100} y={-1000} width={3280} height={4000} fill="#141C20" />
        <rect data-band="ok" x={-1100} y={1180} width={3280} height={1400} fill="#10171B" />
        <path d="M -100,860 L 150,700 L 330,790 L 560,640 L 820,770 L 1100,690 L 1180,960 L -100,960 Z" fill="#1B272C" stroke={C.ink} strokeWidth={4} opacity={0.9} />
        <path d="M -100,960 L 120,820 L 380,900 L 640,780 L 900,890 L 1180,820 L 1180,1180 L -100,1180 Z" fill="#212F34" stroke={C.ink} strokeWidth={4} />
        <g opacity={0.45}><Gauge x={110} y={1180} f={f} scale={0.5} level={0.3} id="s6d" /></g>
        <g opacity={0.45}><SeismicStation x={1000} y={1190} f={f} scale={0.5} emotion="missing" lamp={0} /></g>
        <GhostHill f={f} x={520 + 40 * lean} y={1180} w={520} h={470} hollow={hol} grid={1} fog={0.2} id="s6" />
        {[0, 1, 2, 3].map((i) => (
          <Feed key={i} f={f} d={`M ${-40 + i * 40},${700 + (i % 2) * 90} C ${200 + i * 60},${900 + i * 20} ${380},${980} ${520 + (i - 1.5) * 50},${980}`} color={[C.shake, C.sat, C.rain, C.groundw][i]} k={1} dead={dead(i)} seed={i} />
        ))}
        {lone > 0.02 && (
          <g opacity={lone}>
            <path d={`M 520,980 C 600,900 660,860 700,840`} stroke={C.plate} strokeWidth={5} fill="none" strokeDasharray="14 10" strokeDashoffset={-f * 4} />
            <rect x={686} y={840} width={28} height={340} fill={C.timber} stroke={C.ink} strokeWidth={5} />
            <ellipse cx={700} cy={1186} rx={44} ry={9} fill="#000" opacity={0.4} />
          </g>
        )}
        <Lab text="THE AWARD RECORD" x={540} y={790} size={20} p={lone} />
        {fork > 0.02 && (
          <g opacity={fork}>
            <path d={`M 714,860 C 800,800 870,780 900,${1180 - 280 * fork}`} stroke={C.plate} strokeWidth={5} fill="none" strokeDasharray="14 10" strokeDashoffset={-f * 4} />
            <path d={`M 714,860 C 820,760 960,740 1010,${1180 - 470 * fork}`} stroke={C.plate} strokeWidth={5} fill="none" strokeDasharray="14 10" strokeDashoffset={-f * 4} />
            <rect x={886} y={1180 - 280 * fork} width={28} height={280 * fork} fill={C.timber} stroke={C.ink} strokeWidth={5} />
            <rect x={996} y={1180 - 470 * fork} width={28} height={470 * fork} fill={C.timber} stroke={C.ink} strokeWidth={5} />
            <ellipse cx={900} cy={1186} rx={44} ry={9} fill="#000" opacity={0.4} />
            <ellipse cx={1010} cy={1186} rx={44} ry={9} fill="#000" opacity={0.4} />
          </g>
        )}
        <Lab text="UAF $1,772,170" x={870} y={1180 - 280 * fork - 30} size={18} p={fork} />
        <Lab text="UW $2,209,093" x={900} y={1180 - 470 * fork - 30} size={18} p={fork} />
        <Lab text="EARTHSCOPE $449,448" x={760} y={1250} size={16} p={fork} />
        <g opacity={test}>
          <path d={`M 90,880 L 230,840 L 270,980 L 120,1030 Z`} fill="none" stroke={C.plate} strokeWidth={4} strokeDasharray="12 8" />
        </g>
        <Plate x={540} text="THE FAIR CASE" y={500} p={ease(f, b(30), 14) * (1 - ease(f, b(31), 10))} size={30} />
        <Plate x={520} text="NOT BUILT" y={1080} p={ease(f, b(31), 14) * (1 - ease(f, b(32), 10))} size={34} tone="warn" />
        <Plate x={760} text="ONE PUBLIC SOURCE THE AWARD RECORD" displayLines={['ONE PUBLIC SOURCE', 'THE AWARD RECORD']} y={760} p={ease(f, b(32), 14) * (1 - ease(f, b(33), 10))} size={28} />
        <Plate x={700} text="PARTNER AWARDS UW $2,209,093 · UAF $1,772,170" displayLines={['PARTNER AWARDS', 'UW $2,209,093 · UAF $1,772,170']} y={620} p={ease(f, b(33), 14) * (1 - ease(f, b(46), 10))} size={24} />
        <Plate x={540} text="TESTS PLANNED · ALASKA + PACIFIC NORTHWEST" y={1260} p={ease(f, b(46), 14) * (1 - ease(f, b(34), 10))} size={20} />
        <Plate x={230} text="NO RESULTS" y={1150} p={ease(f, b(34), 14)} size={34} tone="warn" />
      </SVG>
    </Frame>
  );
};

// ---- S7: where the sensors are (the signature shot) ----------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lit = ease(f, b(35), 24);
  const sync = ease(f, b(36), 20);
  const dis = ease(f, b(37), 30);
  const brk = 0.5 + 0.5 * lit;
  return (
    <Frame p={p} z0={1.04} z1={1.0} breakK={brk} warmth={0.05}
      cam={track([{t: 0, z: 1.12, fx: 540, fy: 1100}, {t: b(35) + 50, z: 1.0, fx: 540, fy: 1020}, {t: p.dur, z: 1.04, fx: 540, fy: 1000}])}>
      <SVG>
        <Ground f={f} />
        <Slope f={f} x={540} y={1180} w={1000} h={560} soak={0.5} />
        <GhostHill f={f} x={380} y={1180} w={760} h={540} draw={1} grid={0.9} fog={0.5} id="s7a" />
        <rect x={700} y={560} width={400} height={640} fill="url(#fogs)" opacity={0.55 + 0.4 * ease(f, b(37), 30)} />
        <defs><linearGradient id="fogs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8FA29B" stopOpacity={0} /><stop offset="0.4" stopColor="#8FA29B" stopOpacity={0.75} /><stop offset="1" stopColor="#8FA29B" stopOpacity={0.9} /></linearGradient></defs>
        <g opacity={lit}>
          <circle cx={200} cy={1000} r={110} fill={C.gold} opacity={0.14} />
          <circle cx={400} cy={1010} r={110} fill={C.gold} opacity={0.14} />
          <circle cx={600} cy={1000} r={110} fill={C.gold} opacity={0.14} />
          <path d={`M 400,860 L 260,1180 L 540,1180 Z`} fill={C.gold} opacity={0.1} />
        </g>
        <Gauge native x={200} y={1180} f={f} scale={0.5} level={0.5} id="s7g" />
        <SeismicStation x={400} y={1190} f={f} scale={0.55} emotion="heard" lamp={lit} />
        <ThawProbe x={600} y={1180} depth={30} f={f} len={380} ftPx={90} id="s7p" />
        <g opacity={lit * 0.9}><rect x={590} y={760} width={22} height={400} fill="none" stroke={C.gold} strokeWidth={5} opacity={0.5} /></g>
        <g opacity={1}><Goat f={f} x={lerp(430, 900, dis)} y={lerp(690, 800, dis)} scale={0.55} rim={lit * (1 - dis)} /></g>
        <g opacity={1 - 0.95 * dis}><Goat f={f} x={430 + 60 * dis} y={690} scale={0.55} ghost lag={dis * 10} /></g>
        <Plate x={540} text="SHARP WHERE INSTRUMENTS ARE" y={500} p={ease(f, b(35), 14) * (1 - ease(f, b(36), 10))} size={28} />
        <Plate x={540} text="IN SYNC NEAR INSTRUMENTS" y={570} p={ease(f, b(36), 14) * (1 - ease(f, b(37), 10))} size={28} />
        <Plate x={540} text="COULD KEEP UP WHERE THERE ARE SENSORS NOWHERE ELSE" displayLines={['COULD KEEP UP WHERE THERE ARE SENSORS', 'NOWHERE ELSE']} y={700} p={ease(f, b(37), 14)} size={26} />
      </SVG>
    </Frame>
  );
};

// ---- S8: Barry Arm, opens at fjord scale, the slope is a tiny matched silhouette at its foot -------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const ruler = ease(f, b(40), 40);
  const rip = ease(f, b(41), 40);
  const mark = ease(f, b(39), 30);
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={1000} breakK={0} sky={1} vignette={0.38}>
      <SVG>
        <rect data-band="ok" x={-1100} y={-1000} width={3280} height={4000} fill="#0F161A" opacity={0.4} />
        <g>
          <LayeredLand x={540} y={1180} w={1300} h={820} f={f} layers={13} />
          <rect x={-100} y={300} width={1280} height={900} fill="#0F161A" opacity={0.62} />
          {Array.from({length: 7}).map((_, i) => <path key={i} d={`M ${40 + i * 160},${420 + (i % 3) * 40} q 30,160 -10,${380 + (i % 4) * 60}`} stroke="#0A1114" strokeWidth={10} fill="none" opacity={0.55} />)}
          <path d={`M 110,400 L 110,360 L 150,360 M 560,360 L 600,360 L 600,400 M 110,740 L 110,780 L 150,780 M 600,740 L 600,780 L 560,780`} fill="none" stroke={C.plate} strokeWidth={7} opacity={mark} />
        </g>
        <rect data-band="ok" x={-1100} y={1180} width={3280} height={1400} fill="#16282B" />
        {[0, 1, 2, 3].map((i) => <path key={`w${i}`} data-band="ok" d={`M -20,${1230 + i * 90} Q 270,${1200 + i * 90 + (10 + 22 * rip) * Math.sin(f / 12 + i)} 540,${1230 + i * 90} T 1100,${1230 + i * 90}`} stroke={C.rain} strokeWidth={5} fill="none" opacity={0.45} />)}
        {[0, 1, 2].map((i) => <path key={i} d={`M -20,${1220 + i * 70} Q 270,${1190 + i * 70 + 8 * Math.sin(f / 20 + i)} 540,${1220 + i * 70} T 1100,${1220 + i * 70}`} stroke={C.rain} strokeWidth={4} fill="none" opacity={0.4} />)}
        <g transform="translate(330 1180) scale(0.2)"><Slope f={f} x={0} y={0} w={640} h={520} soak={0.4} /></g>
        <g transform={`translate(${420 + 20 * Math.sin(f / 40)} ${1245 + 5 * Math.sin(f / 14)})`}>
          <path d="M -34,0 L 34,0 L 22,16 L -22,16 Z" fill="#C9D2D2" stroke={C.ink} strokeWidth={3} />
          <rect x={-3} y={-30} width={6} height={30} fill={C.ink} />
        </g>
        <path d="M -100,330 L 120,250 L 260,330 L 420,200 L 600,310 L 780,220 L 1180,330 L 1180,420 L -100,420 Z" fill="#162126" opacity={0.8} />
        <rect x={680} y={380 + (1 - ruler) * 800} width={36} height={800 * ruler} fill="#C9D2D2" stroke={C.ink} strokeWidth={5} opacity={clamp01(ruler * 2)} />
        {Array.from({length: 9}).map((_, i) => <line key={`t${i}`} x1={716} y1={1180 - i * 100 * ruler} x2={750} y2={1180 - i * 100 * ruler} stroke="#C9D2D2" strokeWidth={5} opacity={clamp01(ruler * 2)} />)}
        <g opacity={rip * 0.9}>
          {[0, 1, 2].map((i) => <ellipse key={i} cx={520} cy={1240} rx={90 + i * 220 * rip} ry={14 + i * 34 * rip} fill="none" stroke={C.rain} strokeWidth={5} opacity={0.7 - i * 0.2} />)}
        </g>
        <Plate x={540} text="NO ALASKA SLOPE NAMED AWARD ABSTRACT" displayLines={['NO ALASKA SLOPE NAMED', 'AWARD ABSTRACT']} y={500} p={ease(f, b(38), 14) * (1 - ease(f, b(39), 10))} size={26} />
        <Plate x={540} text="BARRY ARM STATE GEOLOGISTS TRACK IT" displayLines={['BARRY ARM', 'STATE GEOLOGISTS TRACK IT']} y={650} p={ease(f, b(39), 14) * (1 - ease(f, b(40), 10))} size={28} />
        <Plate x={380} text="ROUGHLY 500 MILLION CUBIC METERS" y={800} p={ease(f, b(40), 14) * (1 - ease(f, b(41), 10))} size={22} />
        <Plate x={540} text="IF IT FAILED FAST LIFE-THREATENING WAVES" displayLines={['IF IT FAILED FAST', 'LIFE-THREATENING WAVES']} y={950} p={ease(f, b(41), 14)} size={28} tone="warn" />
      </SVG>
    </Frame>
  );
};

// ---- S9: the button -------------------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lit = ease(f, b(42), 20);
  const lean = ease(f, b(43), 18);
  const step = easeIO(f, b(43) + 25, 55);
  const brk = 0.7;
  return (
    <Frame p={p} z0={1.0} z1={1.06} breakK={brk} warmth={0.05}>
      <SVG>
        <Ground f={f} />
        <Slope f={f} x={300} y={1180} w={560} h={500} soak={0.3} />
        <GhostHill f={f} x={760} y={1180} w={480} h={430} grid={0.8} fog={0.5} id="s9" />
        <Lamp x={560} y={1180} lit={lit} f={f} cone={lit * 0.8} />
        <Lamp x={960} y={1180} lit={0} f={f} />
        <Goat f={f} x={lerp(540, 880, step)} y={1170} scale={0.6} rim={1 - step} />
        <Plate x={540} text="WHICH SLOPE?" y={520} p={ease(f, b(42), 14) * (1 - ease(f, b(43), 10))} size={30} />
        <Plate x={540} text="NOBODY'S SAID" y={610} p={ease(f, b(43), 14) * (1 - ease(f, b(44) - 12, 8))} size={30} />
        <Plate x={540} text="WHICH SLOPE WOULD YOU PICK?" y={700} p={ease(f, b(44), 14)} size={30} />
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

export const ep1101Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1101Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1101: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 13.8, 32.5, 43.2, 59.6, 79.7, 93.9, 101.7, 115.9, 121.4].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#16222A" ink="#E4ECEC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
