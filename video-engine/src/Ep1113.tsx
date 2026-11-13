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
import {HeldTravel} from './lib/heldidle';
import {IDS} from './Ep1113Ids';

// The Faucet Before the Water, 2026-11-13. Palette roles are art_direction.json. DRIP, a brass spigot with a face, is the hero and the
// throughline (five states). Bucket (a pail) and the Rulebook (a binder) are supporting objects, Marge is a coat check clerk. One overcast
// gravel lot under the Chugach with a pipe in perspective running to the horizon. Brass ONLY on Drip and his fittings, tomato ONLY on the
// Rulebook and circled dates, mint ONLY on the AI slip.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;

export const C = {
  sky: '#8FA39A', skyL: '#D8CFA3', skyD: '#74877F', gravel: '#6B6A5E', gravelL: '#8A897B', gravelD: '#4B4A42', puddle: '#9DB0B3',
  spruce: '#24402F', spruceL: '#35583F', ridge: '#55675F', ridgeS: '#DDE5E1',
  brass: '#C9A24B', brassL: '#EBCB7B', brassD: '#8A6A2A', pail: '#7E868D', pailL: '#B4BBC1', pailD: '#555D64',
  paper: '#D9D0B8', paperD: '#BDB398', ink: '#2A2620', line: '#14120F', tomato: '#D8432F', mint: '#5EEAD0', mintD: '#2FA08C',
  white: '#F4F1EA', wood: '#8A6A50', woodD: '#5A4232', steel: '#7C8791', steelD: '#4A535B', news: '#CFC7B4',
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

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'dark' | 'plate' | 'warn' | 'glow';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#161B16', fg: '#EEF2EC', edge: '#EEF2EC'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.tomato, edge: C.ink},
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

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; overlay?: React.ReactNode; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.04, bloom = 0.04, vignette = 0.22, ox = 540, oy = 930, overlay, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 14 * Math.sin(p.f / 110) + 10 * t, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: C.sky}} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#161B16" stroke="#EEF2EC" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#EEF2EC">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.06} warmth={0.0} />
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

/** visibility of the i-th item of a sequence: in on its beat, out as the next one lands. */
const vis = (f: number, b: (id: number) => number, ks: number[], i: number) => ease(f, b(ks[i]), 12) * (i < ks.length - 1 ? 1 - ease(f, b(ks[i + 1]) - 10, 8) : 1);

// ---- geometry of the one world -------------------------------------------------------------------------------------------------------------------
const DX = 770;            // Drip's x
const GY = 1180;           // the gravel line Drip stands on

const Backdrop: React.FC<{f: number; act?: number}> = ({f, act = 0}) => (
  <g>
    <defs>
      <linearGradient id="sky113" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.skyD} />
        <stop offset="0.6" stopColor={C.sky} />
        <stop offset="1" stopColor={C.skyL} />
      </linearGradient>
    </defs>
    <path d="M -40,300 H 1120 V 1010 H -40 Z" fill="url(#sky113)" />
    {[[160, 520, 150], [520, 470, 190], [860, 560, 170], [300, 650, 120], [720, 660, 140], [980, 470, 110]].map(([cx, cy, r], i) => (
      <g key={`c${i}`} transform={`translate(${cx + 8 * Math.sin(f / 90 + i)} ${cy})`}>
        <ellipse cx={0} cy={0} rx={r} ry={r * 0.32} fill={C.skyL} stroke={C.line} strokeWidth={3} opacity={0.92} />
        <ellipse cx={-r * 0.35} cy={-r * 0.18} rx={r * 0.5} ry={r * 0.26} fill={C.white} stroke={C.line} strokeWidth={3} />
        <ellipse cx={r * 0.25} cy={-r * 0.12} rx={r * 0.42} ry={r * 0.22} fill={C.white} stroke={C.line} strokeWidth={3} />
        <path d={`M ${-r * 0.8},${r * 0.12} Q 0,${r * 0.34} ${r * 0.8},${r * 0.12}`} fill="none" stroke={C.skyD} strokeWidth={6} opacity={0.7} />
      </g>
    ))}
    {/* the Chugach as a long low serrated line with snow caps */}
    <path d="M -40,990 L 90,900 L 190,950 L 330,840 L 430,930 L 560,870 L 700,950 L 840,880 L 960,940 L 1120,900 L 1120,1030 L -40,1030 Z" fill={C.ridge} stroke={C.line} strokeWidth={3} />
    <path d="M 330,840 L 296,880 L 328,870 L 350,894 L 380,868 L 404,884 Z M 560,870 L 530,904 L 558,894 L 580,912 L 606,892 Z M 840,880 L 812,912 L 840,904 L 862,918 L 888,900 Z" fill={C.ridgeS} />
    {/* spruce row with a little life in the tops */}
    {Array.from({length: 22}).map((_, i) => {
      const x = -20 + i * 52 + h01(i) * 14, hh = 70 + h01(i, 3) * 54, sw = 3 * Math.sin(f / 40 + i);
      return (
        <path key={i} d={`M ${x},1030 L ${x + 20 + sw},${1030 - hh} L ${x + 40},1030 Z`} fill={i % 2 ? C.spruce : C.spruceL} stroke={C.line} strokeWidth={2.4} />
      );
    })}
    {/* the lot: wet gravel with puddles */}
    <path d="M -40,1020 L 1120,1020 L 1120,1920 L -40,1920 Z" fill={C.gravel} stroke={C.gravelD} strokeWidth={3} />
    <path d="M -40,1100 Q 400,1070 1120,1090 L 1120,1140 Q 500,1130 -40,1150 Z" fill={C.gravelL} opacity={0.5} />
    {Array.from({length: 5}).map((_, i) => (
      <ellipse key={i} cx={140 + i * 220 + h01(i, act) * 40} cy={1330 + (i % 3) * 90} rx={70 + h01(i, 2) * 30} ry={14} fill={C.puddle} stroke={C.gravelD} strokeWidth={3} opacity={0.75} />
    ))}
    {Array.from({length: 26}).map((_, i) => (
      <ellipse key={`g${i}`} cx={30 + ((i * 97 + act * 53) % 1020)} cy={1180 + ((i * 61) % 520)} rx={10 + (i % 4) * 3} ry={5} fill={i % 2 ? C.gravelL : C.gravelD} opacity={0.7} />
    ))}
    <path d="M -40,1480 Q 300,1450 600,1478 T 1120,1470 L 1120,1506 Q 600,1514 300,1498 T -40,1512 Z" fill={C.gravelD} stroke={C.line} strokeWidth={3} />
    <path d="M -40,1600 Q 300,1570 560,1600 T 1120,1590" fill="none" stroke={C.gravelD} strokeWidth={14} opacity={0.7} />
    <path d="M -40,1760 Q 360,1730 640,1764 T 1120,1750" fill="none" stroke={C.gravelD} strokeWidth={16} opacity={0.7} />
    {Array.from({length: 30}).map((_, i) => {
      const x = 40 + ((i * 137 + act * 71) % 1000), y = 1530 + ((i * 89 + act * 37) % 360), r = 14 + (i % 5) * 5;
      return (
        <g key={`r${i}`}>
          <ellipse cx={x} cy={y} rx={r * 1.5} ry={r} fill={i % 3 ? C.gravelL : C.gravelD} stroke={C.line} strokeWidth={3} />
          <path d={`M ${x - r},${y - r * 0.3} Q ${x},${y - r * 0.9} ${x + r * 0.8},${y - r * 0.4}`} fill="none" stroke={C.white} strokeWidth={3} opacity={0.5} />
        </g>
      );
    })}
  </g>
);

// ---- the cast --------------------------------------------------------------------------------------------------------------------------------------
/** THE PIPE: a fat brass-flanged tube in perspective, from the near end at (x1,y1) back toward the horizon. grow 0..1 sets its length. */
const Pipe: React.FC<{x1?: number; grow?: number; tilt?: number; drip?: boolean}> = ({x1 = DX - 40, grow = 1, tilt = 0}) => {
  const x0 = lerp(x1 - 40, -80, grow);
  const yTop = (x: number) => lerp(1050, 1095, (x - x0) / Math.max(1, x1 - x0)) + tilt * (1 - (x - x0) / Math.max(1, x1 - x0)) * 90;
  const yBot = (x: number) => lerp(1060, 1190, (x - x0) / Math.max(1, x1 - x0)) + tilt * (1 - (x - x0) / Math.max(1, x1 - x0)) * 90;
  const flanges = [0.15, 0.4, 0.7, 0.92];
  return (
    <g>
      <path d={`M ${x0},${yTop(x0)} L ${x1},${yTop(x1)} L ${x1},${yBot(x1)} L ${x0},${yBot(x0)} Z`} fill={C.steel} stroke={C.line} strokeWidth={5} />
      <path d={`M ${x0},${yTop(x0) + 4} L ${x1},${yTop(x1) + 10} L ${x1},${yTop(x1) + 30} L ${x0},${yTop(x0) + 8} Z`} fill={C.pailL} opacity={0.6} />
      <path d={`M ${x0},${yBot(x0) - 4} L ${x1},${yBot(x1) - 14} L ${x1},${yBot(x1)} L ${x0},${yBot(x0)} Z`} fill={C.steelD} opacity={0.7} />
      {flanges.map((t, i) => {
        const x = lerp(x0, x1, t);
        return <path key={i} d={`M ${x - 7},${yTop(x) - 8} L ${x + 7},${yTop(x) - 8} L ${x + 7},${yBot(x) + 8} L ${x - 7},${yBot(x) + 8} Z`} fill={C.brass} stroke={C.line} strokeWidth={4} />;
      })}
    </g>
  );
};

/** DRIP: a brass yard spigot with a face. state 1..5, cough 0..1, handle -1..1 (raised brow), bead 0..1 hanging on the lip. */
const Drip: React.FC<{f: number; x?: number; y?: number; scale?: number; state?: number; cough?: number; brow?: number; bead?: number; worry?: number}> =
({f, x = DX, y = GY, scale = 1, state = 1, cough = 0, brow = 0, bead = 1, worry = 0}) => {
  const bob = 3 * Math.sin(f / 18);
  const blink = Math.sin(f / 47) > 0.96 ? 0.15 : 1;
  const puff = cough * 26;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${scale})`}>
      <ellipse cx={20} cy={8} rx={120} ry={20} fill="#000" opacity={0.28} />
      {/* base flange + riser */}
      <path d="M -70,0 L 90,0 L 70,-30 L -50,-30 Z" fill={C.brass} stroke={C.line} strokeWidth={5} />
      <path d="M -40,-30 L 60,-30 L 50,-210 L -30,-210 Z" fill={C.brass} stroke={C.line} strokeWidth={5} />
      <path d="M -40,-30 L -14,-30 L -6,-210 L -30,-210 Z" fill={C.brassD} opacity={0.55} />
      <path d="M 28,-40 L 46,-40 L 38,-200 L 26,-200 Z" fill={C.brassL} opacity={0.7} />
      {/* the neck curls over to the left, ending in the lip */}
      <path d="M -30,-210 Q -30,-300 -110,-300 L -190,-300 L -190,-262 L -120,-262 Q -72,-262 -72,-210 Z" fill={C.brass} stroke={C.line} strokeWidth={5} />
      <path d="M -190,-300 L -214,-300 L -214,-250 L -190,-250 Z" fill={C.brassD} stroke={C.line} strokeWidth={5} />
      {/* face on the riser */}
      <g transform="translate(10 -150)">
        <ellipse cx={-14} cy={0} rx={17} ry={22 * blink} fill={C.white} stroke={C.line} strokeWidth={4} />
        <ellipse cx={30} cy={0} rx={17} ry={22 * blink} fill={C.white} stroke={C.line} strokeWidth={4} />
        <circle cx={-14 + 4 * Math.sin(f / 60) - 6 * worry} cy={4} r={7} fill={C.ink} />
        <circle cx={30 + 4 * Math.sin(f / 60) - 6 * worry} cy={4} r={7} fill={C.ink} />
        <path d={`M -34,${-26 - 6 * brow} L -2,${-30 - 10 * brow}`} stroke={C.line} strokeWidth={5} strokeLinecap="round" />
        <path d={`M 12,${-30 - 10 * brow} L 48,${-26 - 6 * brow + 8 * worry}`} stroke={C.line} strokeWidth={5} strokeLinecap="round" />
        <path d={`M -10,40 Q 8,${46 + 10 * brow - 14 * worry} 26,40`} stroke={C.line} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      {/* handle lever as a brow, on top of the neck */}
      <g transform={`translate(-100 -304) rotate(${-16 + 34 * brow})`}>
        <path d="M -8,0 L 120,-8 L 120,8 L -8,16 Z" fill={C.brassL} stroke={C.line} strokeWidth={5} />
        <circle cx={120} cy={0} r={14} fill={C.brass} stroke={C.line} strokeWidth={5} />
      </g>
      {/* ribbon on a brand new tap */}
      {state === 1 && (
        <g transform="translate(40 -90)">
          <path d="M 0,0 L 40,30 L 22,10 L 52,-4 L 20,-4 Z" fill={C.tomato} stroke={C.line} strokeWidth={3} />
        </g>
      )}
      {/* the bead of water or dust on the lip */}
      <ellipse cx={-202} cy={-232 + 6 * Math.sin(f / 20)} rx={9 * bead} ry={13 * bead} fill={C.skyL} stroke={C.line} strokeWidth={3} opacity={bead > 0.05 ? 0.95 : 0} />
      {/* the cough: a puff of dust */}
      {cough > 0.02 && Array.from({length: 6}).map((_, i) => (
        <circle key={i} cx={-226 - puff * (1 + i * 0.4)} cy={-250 + (i - 3) * 8 * cough + i * 3} r={8 + i * 3} fill={C.paperD} opacity={0.6 * (1 - cough * 0.4)} />
      ))}
    </g>
  );
};

/** BUCKET: a dented galvanized pail with a tired kind face. */
const Bucket: React.FC<{f: number; x: number; y: number; scale?: number; brow?: number; tilt?: number}> = ({f, x, y, scale = 1, brow = 0, tilt = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${tilt})`}>
    <ellipse cx={4} cy={6} rx={78} ry={14} fill="#000" opacity={0.28} />
    <path d="M -60,-130 L 60,-130 L 48,0 L -48,0 Z" fill={C.pail} stroke={C.line} strokeWidth={5} />
    <path d="M -60,-130 L -38,-130 L -28,0 L -48,0 Z" fill={C.pailD} opacity={0.5} />
    <path d="M 20,-120 L 36,-120 L 30,-10 L 18,-10 Z" fill={C.pailL} opacity={0.7} />
    <path d="M -60,-130 Q 0,-150 60,-130" fill="none" stroke={C.line} strokeWidth={5} />
    <path d="M -56,-128 Q 0,-196 56,-128" fill="none" stroke={C.steelD} strokeWidth={6} />
    <path d="M -50,-90 L 52,-90 M -46,-40 L 48,-40" stroke={C.line} strokeWidth={3} opacity={0.5} />
    <g transform="translate(0 -66)">
      <ellipse cx={-18} cy={0} rx={10} ry={12} fill={C.white} stroke={C.line} strokeWidth={3} />
      <ellipse cx={18} cy={0} rx={10} ry={12} fill={C.white} stroke={C.line} strokeWidth={3} />
      <circle cx={-16} cy={3} r={4} fill={C.ink} />
      <circle cx={20} cy={3} r={4} fill={C.ink} />
      <path d={`M -30,${-18 - 8 * brow} L -8,-18`} stroke={C.line} strokeWidth={4} strokeLinecap="round" />
      <path d="M 8,-18 L 30,-14" stroke={C.line} strokeWidth={4} strokeLinecap="round" />
      <path d="M -10,24 Q 0,18 10,24" stroke={C.line} strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  </g>
);

/** THE RULEBOOK: a thin three-ring binder with one eye, always arriving last. */
const Rulebook: React.FC<{f: number; x: number; y: number; scale?: number; run?: number}> = ({f, x, y, scale = 1, run = 0}) => {
  const flap = run * 12 * Math.sin(f / 3);
  return (
    <g transform={`translate(${x} ${y + (run > 0 ? -6 * Math.abs(Math.sin(f / 3)) : 0)}) scale(${scale})`}>
      <ellipse cx={2} cy={6} rx={56} ry={10} fill="#000" opacity={0.28} />
      <path d="M -44,-150 L 44,-150 L 44,0 L -44,0 Z" fill={C.tomato} stroke={C.line} strokeWidth={5} />
      <path d="M -44,-150 L -28,-150 L -28,0 L -44,0 Z" fill="#9C2B1D" opacity={0.6} />
      {[-120, -80, -40].map((yy, i) => (
        <path key={i} d={`M -52,${yy} q -${14 + flap} ${-4} -${14 + flap} ${12}`} fill="none" stroke={C.steelD} strokeWidth={5} />
      ))}
      <rect x={-28} y={-136} width={60} height={50} rx={4} fill={C.paper} stroke={C.line} strokeWidth={4} />
      <ellipse cx={2} cy={-62} rx={13} ry={16} fill={C.white} stroke={C.line} strokeWidth={4} />
      <circle cx={4 + 2 * Math.sin(f / 30)} cy={-60} r={6} fill={C.ink} />
      <path d="M -10,-30 Q 4,-24 18,-30" stroke={C.line} strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
};

const CommingSoon: React.FC<{f: number; suffix?: string; x?: number; y?: number}> = ({f, suffix = '', x = 230, y = 1130}) => {
  const sw = 4 * Math.sin(f / 30);
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M -4,0 L 4,0 L 4,-170 L -4,-170 Z" fill={C.wood} stroke={C.line} strokeWidth={4} />
      <g transform={`translate(0 -170) rotate(${sw})`}>
        <path d="M -110,-70 L 110,-70 L 110,10 L -110,10 Z" fill={C.paper} stroke={C.line} strokeWidth={5} />
        <text x={0} y={-40} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink} letterSpacing={1}>COMING SOON</text>
        {suffix && <text x={0} y={-12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.tomato} letterSpacing={1}>{suffix}</text>}
      </g>
    </g>
  );
};

/** A paper card on a post or hung from the pipe. */
const Card: React.FC<{x: number; y: number; w: number; h: number; tilt?: number; tone?: string; sway?: number; children?: React.ReactNode}> = ({x, y, w, h, tilt = 0, tone = C.paper, sway = 0, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt + sway})`}>
    <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={5} fill="#000" opacity={0.28} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill={tone} stroke={C.line} strokeWidth={5} />
    {children}
  </g>
);

const Lines: React.FC<{x: number; y: number; w: number; n?: number; gap?: number; o?: number}> = ({x, y, w, n = 4, gap = 22, o = 0.45}) => (
  <g opacity={o}>{Array.from({length: n}).map((_, i) => <path key={i} d={`M ${x},${y + i * gap} h ${w * (i === n - 1 ? 0.6 : 1)}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />)}</g>
);

/** A wall calendar with an optional red ring on a date. */
const Calendar: React.FC<{x: number; y: number; month: string; ring?: number; ringAt?: number; f: number; sway?: number; scale?: number}> = ({x, y, month, ring = 0, ringAt = 0, f, sway = 0, scale = 1}) => {
  const k = clamp01(ring);
  return (
    <g transform={`translate(${x} ${y}) rotate(${sway}) scale(${scale})`}>
      <rect x={-130 + 8} y={-150 + 10} width={260} height={300} rx={8} fill="#000" opacity={0.28} />
      <rect x={-130} y={-150} width={260} height={300} rx={8} fill={C.paper} stroke={C.line} strokeWidth={6} />
      <rect x={-130} y={-150} width={260} height={64} rx={8} fill={C.tomato} stroke={C.line} strokeWidth={6} />
      <text x={0} y={-104} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} fill={C.white} letterSpacing={3}>{month}</text>
      {Array.from({length: 28}).map((_, i) => {
        const cx = -96 + (i % 7) * 32, cy = -52 + Math.floor(i / 7) * 50;
        return <rect key={i} x={cx - 11} y={cy - 14} width={22} height={28} rx={3} fill="none" stroke={C.ink} strokeWidth={2.4} opacity={0.5} />;
      })}
      {k > 0.02 && (
        <ellipse cx={-96 + (ringAt % 7) * 32} cy={-52 + Math.floor(ringAt / 7) * 50} rx={26 * k} ry={30 * k} fill="none" stroke={C.tomato} strokeWidth={8} strokeDasharray={`${180 * k} 200`} />
      )}
    </g>
  );
};

/** a hanging meeting stub / date stub on the pipe */
const Stub: React.FC<{x: number; y: number; label?: string; p: number; sway?: number}> = ({x, y, label = '', p, sway = 0}) => (
  <g opacity={p} transform={`translate(${x} ${y + (1 - p) * -40}) rotate(${sway})`}>
    <path d="M 0,-20 L 0,0" stroke={C.line} strokeWidth={4} />
    <rect x={-30} y={0} width={60} height={46} rx={4} fill={C.paper} stroke={C.line} strokeWidth={4} />
    {label && <text x={0} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>{label}</text>}
  </g>
);

/** a roadside sign on a post */
const Sign: React.FC<{x: number; y: number; w?: number; h?: number; lines: string[]; p: number; f: number; tone?: string; fg?: string}> = ({x, y, w = 300, h = 150, lines, p, f, tone = C.paper, fg = C.ink}) => {
  const k = clamp01(p);
  const sw = (1 - k) * 28 + 2.5 * Math.sin(f / 26);
  if (k <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={Math.min(1, k * 2)}>
      <path d="M -6,0 L 6,0 L 6,-120 L -6,-120 Z" fill={C.wood} stroke={C.line} strokeWidth={4} />
      <g transform={`translate(0 -120) rotate(${sw})`}>
        <rect x={-w / 2 + 6} y={-h + 8} width={w} height={h} rx={6} fill="#000" opacity={0.28} />
        <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill={tone} stroke={C.line} strokeWidth={5} />
        {lines.map((l, i) => <text key={i} x={0} y={-h + 46 + i * 36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={fg} letterSpacing={1}>{l}</text>)}
      </g>
    </g>
  );
};

// ---- the shared world ------------------------------------------------------------------------------------------------------------------------------
type WP = {f: number; b: (id: number) => number};

/** the padlock on Drip's handle */
const Padlock: React.FC<{p: number; f: number}> = ({p, f}) => {
  if (p <= 0.02) return null;
  return (
    <g transform={`translate(${DX - 100 + 118} ${GY - 304 + 40 + (1 - p) * -60}) rotate(${(1 - p) * 40 + 2 * Math.sin(f / 9)})`} opacity={Math.min(1, p * 2)}>
      <path d="M -14,-6 Q -14,-34 0,-34 Q 14,-34 14,-6" fill="none" stroke={C.steelD} strokeWidth={7} />
      <rect x={-20} y={-6} width={40} height={34} rx={5} fill={C.steel} stroke={C.line} strokeWidth={5} />
      <circle cx={0} cy={9} r={5} fill={C.line} />
    </g>
  );
};

/** light flurry, the only snow in the film */
const Flurry: React.FC<{f: number; amt: number}> = ({f, amt}) => {
  if (amt <= 0.02) return null;
  return (
    <g opacity={Math.min(1, amt)}>
      {Array.from({length: 46}).map((_, i) => {
        const sx = (i * 61 + h01(i) * 400) % 1080, sy = (f * (2.2 + h01(i, 2) * 2.4) + i * 83) % 1300;
        return <circle key={i} cx={sx + 14 * Math.sin(f / 30 + i)} cy={380 + sy} r={2.2 + h01(i, 5) * 2.4} fill={C.white} opacity={0.55 + h01(i, 7) * 0.4} />;
      })}
    </g>
  );
};

const Lot: React.FC<WP & {act?: number; pipe?: number; tilt?: number; state?: number; cough?: number; brow?: number; bead?: number; worry?: number; suffix?: string; showSign?: boolean;
  tag?: boolean; rb?: number; lock?: number; flurry?: number; bucket?: boolean; drip?: boolean; dull?: number; children?: React.ReactNode}> =
({f, act = 0, pipe = 1, tilt = 0, state = 1, cough = 0, brow = 0, bead = 1, worry = 0, suffix = '', showSign = true, tag = true, rb = 0, lock = 0, flurry = 0, bucket = true, drip = true, children}) => (
  <g>
    <Backdrop f={f} act={act} />
    <Pipe grow={pipe} tilt={tilt} />
    {showSign && <CommingSoon f={f} suffix={suffix} />}
    {/* the Rulebook, a tiny red speck walking in from the spruce row, bigger every time we return */}
    {rb > 0.001 && <Rulebook f={f} x={lerp(110, 470, rb)} y={lerp(1040, 1300, rb)} scale={lerp(0.1, 1.0, rb)} run={rb > 0.95 ? 1 : 0} />}
    {drip && <Drip f={f} state={state} cough={cough} brow={brow} bead={bead} worry={worry} />}
    {drip && state >= 2 && (
      <g transform={`translate(${DX - 150} ${1112})`}>
        <path d="M -18,-30 L 18,-30 L 18,30 L -18,30 Z" fill={C.brassL} stroke={C.line} strokeWidth={4} />
        <circle cx={0} cy={0} r={11} fill={C.brass} stroke={C.line} strokeWidth={4} />
      </g>
    )}
    {drip && <Padlock p={lock} f={f} />}
    {drip && tag && state >= 3 && (
      <g transform={`translate(${DX - 40} ${GY - 150}) rotate(${6 * Math.sin(f / 22)})`}>
        <path d="M 0,0 L 0,24" stroke={C.line} strokeWidth={3} />
        <rect x={-70} y={24} width={140} height={40} rx={4} fill={C.paper} stroke={C.line} strokeWidth={4} />
        <text x={0} y={50} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.ink}>NO OFFERINGS</text>
      </g>
    )}
    {bucket && <Bucket f={f} x={DX - 208} y={GY + 24} scale={0.9} brow={worry * 0.8} tilt={0} />}
    {children}
    <HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={30 + act} strength={0.4} rx={20} mode="sweep" />
    <Flurry f={f} amt={flurry} />
  </g>
);

// ---- the shots --------------------------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cough = clamp01(1 - Math.abs(f - b(1) - 16) / 14) * ease(f, b(1), 6);
  const cam = track([{t: 0, z: 1.02, fx: 700, fy: 960}, {t: p.dur, z: 1.0, fx: 560, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate displayLines={['ALASKA BUILT THE', 'FAUCET FIRST']} text="ALASKA BUILT THE FAUCET FIRST" x={540} y={620} size={50} tone="glow" p={ease(f, 0, 10) * (1 - ease(f, b(2) - 6, 8))} />
        <Plate text="NOTHING COMING OUT YET" x={540} y={760} size={36} tone="dark" p={ease(f, b(1), 12) * (1 - ease(f, b(2) - 6, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="A PIPE TO THE HORIZON" x={540} y={680} size={38} tone="plate" p={ease(f, b(2), 12) * (1 - ease(f, b(3) - 6, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="WAITING ON THE FIRST DROP" x={540} y={680} size={36} tone="warn" p={ease(f, b(3), 12)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        <Lot f={f} b={b} pipe={0.25 + 0.75 * easeIO(f, b(2), 40)} cough={cough} brow={ease(f, b(1) - 4, 10)} worry={ease(f, b(3), 14) * 0.5} rb={0.02 + 0.05 * easeIO(f, 0, p.dur)} suffix="" />
      </SVG>
    </Frame>
  );
};

const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.0, fx: 520, fy: 960}, {t: p.dur, z: 1.06, fx: 560, fy: 980}]);
  const thump = ease(f, b(4), 10);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate text="NOV 9 INVESTNORTH" x={540} y={620} size={44} tone="glow" p={vis(f, b, [4, 5, 6], 0)} />
        <Plate displayLines={['STATE-SPONSORED', 'FINANCING PLATFORM']} text="STATE-SPONSORED FINANCING PLATFORM" x={540} y={620} size={38} tone="dark" p={vis(f, b, [4, 5, 6], 1)} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="PITCHED AT DATA CENTERS" x={540} y={620} size={36} tone="plate" p={vis(f, b, [4, 5, 6], 2)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        {/* an empty press hall interior, warm paper light, a window onto the lot */}
        <path d="M -40,300 H 1120 V 1920 H -40 Z" fill={C.paperD} />
        <path d="M -40,300 H 1120 V 1090 H -40 Z" fill={C.paper} stroke={C.line} strokeWidth={4} />
        <path d="M -40,1090 H 1120 V 1920 H -40 Z" fill={C.woodD} stroke={C.line} strokeWidth={4} />
        {Array.from({length: 9}).map((_, i) => <path key={i} d={`M ${-40 + i * 150},1090 L ${-120 + i * 190},1920`} stroke={C.wood} strokeWidth={4} opacity={0.6} />)}
        <Calendar x={200} y={760 - 60 * (1 - thump)} month="NOVEMBER" ring={ease(f, b(4) + 8, 14)} ringAt={8} f={f} sway={(1 - thump) * -8} scale={0.9} />
        {/* the window opens onto the lot */}
        <g transform="translate(830 760)">
          <rect x={-170} y={-190} width={340} height={380} fill={C.sky} stroke={C.line} strokeWidth={8} />
          <g opacity={ease(f, b(6), 14)}>
            <path d="M -170,40 L 170,40 L 170,190 L -170,190 Z" fill={C.gravel} />
            <path d="M -170,40 L -100,-30 L -30,30 L 60,-50 L 170,20 L 170,40 L -170,40 Z" fill={C.ridge} stroke={C.line} strokeWidth={3} />
            <g opacity={0.6 * ease(f, b(6) + 6, 14)}>
              <rect x={20} y={-30} width={90} height={60} fill={C.skyL} stroke={C.line} strokeWidth={3} />
              {Array.from({length: 5}).map((_, i) => <rect key={i} x={30 + i * 15} y={-20 + (i % 2) * 10} width={8} height={32} fill={C.steelD} />)}
            </g>
          </g>
          <rect x={-170} y={-190} width={340} height={380} fill="none" stroke={C.woodD} strokeWidth={14} />
          <path d="M 0,-190 V 190 M -170,0 H 170" stroke={C.woodD} strokeWidth={8} />
        </g>
        <HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={32} strength={0.4} rx={20} mode="sweep" />
        {/* a press podium with a state seal on an empty floor */}
        <g transform={`translate(${520} ${1290 - 140 * (1 - thump)})`}>
          <ellipse cx={0} cy={6} rx={150} ry={18} fill="#000" opacity={0.3} />
          <path d="M -100,0 L 100,0 L 80,-250 L -80,-250 Z" fill={C.wood} stroke={C.line} strokeWidth={6} />
          <path d="M -100,0 L -70,0 L -56,-250 L -80,-250 Z" fill={C.woodD} opacity={0.5} />
          <rect x={-110} y={-290} width={220} height={52} rx={6} fill={C.woodD} stroke={C.line} strokeWidth={6} />
          <circle cx={0} cy={-150} r={44} fill={C.brass} stroke={C.line} strokeWidth={5} />
          <circle cx={0} cy={-150} r={28} fill="none" stroke={C.brassD} strokeWidth={4} />
          <path d="M 80,-290 q 20,-60 60,-70" stroke={C.steelD} strokeWidth={6} fill="none" />
          <circle cx={146} cy={-362} r={10} fill={C.steel} stroke={C.line} strokeWidth={4} />
          {/* a brass banner drops from the podium front and swings open */}
          <g transform={`translate(0 ${-70 + 40 * (1 - ease(f, b(5), 14))}) rotate(${(1 - ease(f, b(5), 18)) * 14})`} opacity={ease(f, b(5), 8)}>
            <rect x={-92} y={-30} width={184} height={74} rx={5} fill={C.paper} stroke={C.line} strokeWidth={5} />
            <text x={0} y={0} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>INVESTNORTH</text>
            <text x={0} y={28} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.ink}>STATE-SPONSORED</text>
          </g>
        </g>
      </SVG>
    </Frame>
  );
};

const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.0, fx: 300, fy: 980}, {t: p.dur, z: 1.06, fx: 520, fy: 990}]);
  const bagsAt = (i: number) => b(10) + i * 5;
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate text="AIDEA" x={300} y={620} size={46} tone="glow" p={ease(f, b(7), 12) * (1 - ease(f, b(8) - 8, 8))} />
        <Plate text="ALASKA DATA CORP" x={540} y={620} size={40} tone="dark" p={ease(f, b(8), 12) * (1 - ease(f, b(9) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="JANUARY" x={540} y={620} size={56} tone="plate" p={ease(f, b(9), 12) * (1 - ease(f, b(10) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="$20 MILLION" x={540} y={620} size={56} tone="glow" p={ease(f, b(10), 12) * (1 - ease(f, b(45) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="TO RUN ON" x={540} y={620} size={46} tone="warn" p={ease(f, b(45), 12)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        <Lot f={f} b={b} act={2} state={1} showSign={false} rb={0.12} bucket={false}>
          {/* pump house with an AIDEA flag */}
          <g transform={`translate(${250} ${1130 - 90 * (1 - ease(f, b(7), 14))})`}>
            <rect x={-90} y={-130} width={180} height={130} fill={C.wood} stroke={C.line} strokeWidth={5} />
            <path d="M -100,-130 L 0,-190 L 100,-130 Z" fill={C.woodD} stroke={C.line} strokeWidth={5} />
            <path d="M 0,-190 L 0,-290" stroke={C.line} strokeWidth={5} />
            <path d={`M 0,-290 l ${54 + 8 * Math.sin(f / 8)},14 l -${6 * Math.sin(f / 8)},22 l -${48},-6 Z`} fill={C.brass} stroke={C.line} strokeWidth={4} />
            <text x={0} y={-60} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.paper}>AIDEA</text>
          </g>
          {/* the booth with a funnel, a calendar page flips to January, bags drop in */}
          <g transform={`translate(${520} ${1150 - 110 * (1 - ease(f, b(8), 14))})`}>
            <rect x={-80} y={-120} width={160} height={120} fill={C.paper} stroke={C.line} strokeWidth={5} />
            <path d="M -70,-120 L 70,-120 L 40,-170 L -40,-170 Z" fill={C.steel} stroke={C.line} strokeWidth={5} />
            <text x={0} y={-60} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={C.ink}>ALASKA</text>
            <text x={0} y={-36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={C.ink}>DATA CORP</text>
            <g transform={`translate(-30 -96) scale(1 ${Math.abs(Math.cos(clamp01((f - b(9)) / 14) * Math.PI))})`} opacity={ease(f, b(9) - 4, 6)}>
              <rect x={-36} y={-24} width={72} height={48} fill={C.white} stroke={C.line} strokeWidth={4} />
              <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.tomato}>JAN</text>
            </g>
            <circle cx={60} cy={-90} r={20} fill={C.paper} stroke={C.line} strokeWidth={4} />
            <path d={`M 60,-90 L ${60 + 12 * Math.cos(-1.2 + ease(f, b(45), 20) * 1.6)},${-90 + 12 * Math.sin(-1.2 + ease(f, b(45), 20) * 1.6)}`} stroke={C.line} strokeWidth={4} />
          </g>
          {Array.from({length: 20}).map((_, i) => {
            const t = clamp01((f - bagsAt(i)) / 10);
            if (t <= 0 || f > bagsAt(i) + 16) return null;
            return <rect key={i} x={500 + (i % 5) * 6} y={780 + t * 340} width={34} height={30} rx={6} fill={C.brassL} stroke={C.line} strokeWidth={4} transform={`rotate(${(i % 4) * 8 - 12})`} />;
          })}
          {Array.from({length: 20}).map((_, i) => (
            f > bagsAt(i) + 16 ? <rect key={`s${i}`} x={448 + (i % 10) * 16} y={1090 - Math.floor(i / 10) * 14} width={14} height={12} rx={3} fill={C.brassL} stroke={C.line} strokeWidth={2} /> : null
          ))}
        </Lot>
      </SVG>
    </Frame>
  );
};

const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.12, fx: 640, fy: 1000}, {t: p.dur, z: 1.26, fx: 600, fy: 1020}]);
  const cough = clamp01(1 - Math.abs(f - b(11) - 14) / 14) * ease(f, b(11), 6);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate text="SAN FRANCISCO" x={540} y={620} size={46} tone="dark" p={vis(f, b, [11, 12], 0)} />
        <Plate text="BUILT WITH PLURAL" x={540} y={620} size={44} tone="glow" p={vis(f, b, [11, 12], 1)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        <Lot f={f} b={b} act={3} state={2} showSign={false} cough={cough} brow={cough * 0.5} rb={0.2} bucket={false}>
          {/* the cable car clamp slides onto the pipe */}
          <g transform={`translate(${lerp(120, 480, easeIO(f, b(11) - 6, 16))} ${1128})`}>
            <rect x={-80} y={-60} width={160} height={110} rx={14} fill={C.tomato} stroke={C.line} strokeWidth={5} />
            <rect x={-62} y={-44} width={44} height={40} rx={4} fill={C.skyL} stroke={C.line} strokeWidth={4} />
            <rect x={-8} y={-44} width={44} height={40} rx={4} fill={C.skyL} stroke={C.line} strokeWidth={4} />
            <path d="M -60,-60 L -60,-100 M 40,-60 L 40,-100 M -70,-100 L 50,-100" stroke={C.line} strokeWidth={5} />
            <circle cx={-44} cy={56} r={14} fill={C.steelD} stroke={C.line} strokeWidth={4} />
            <circle cx={44} cy={56} r={14} fill={C.steelD} stroke={C.line} strokeWidth={4} />
            <circle cx={62} cy={-106} r={12} fill={C.brassL} stroke={C.line} strokeWidth={4} transform={`rotate(${10 * Math.sin(f / 4)} 62 -106)`} />
          </g>
          <Bucket f={f} x={DX - 208} y={GY + 24} scale={0.9} brow={ease(f, b(12), 10)} tilt={-10 * ease(f, b(12), 10)} />
        </Lot>
      </SVG>
    </Frame>
  );
};

const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.08, fx: 540, fy: 990}]);
  const peel = ease(f, b(13), 18);
  const tk = ease(f, b(14), 12);
  const slide = easeIO(f, b(15), 16);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate text="TOKENIZATION" x={540} y={600} size={50} tone="glow" p={vis(f, b, [13, 14, 15], 0)} />
        <Plate displayLines={['A RECORD OF WHO', 'OWNS A STAKE']} text="A RECORD OF WHO OWNS A STAKE" x={540} y={620} size={40} tone="dark" p={vis(f, b, [13, 14, 15], 1)} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="THE TICKET IS THE RECORD" x={540} y={600} size={38} tone="plate" p={vis(f, b, [13, 14, 15], 2)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        <Backdrop f={f} act={4} />
        <HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={34} strength={0.4} rx={20} mode="sweep" />
        <g transform="translate(540 1150)">
          <rect x={-260} y={-360} width={520} height={360} fill={C.paper} stroke={C.line} strokeWidth={6} />
          <rect x={-250} y={-350} width={500} height={340} fill={C.paperD} opacity={0.5} />
          <g transform={`translate(${-260 - 20 * peel} 0) scale(${1 - 0.9 * peel} 1)`}><rect x={0} y={-360} width={260} height={360} fill={C.wood} stroke={C.line} strokeWidth={6} /></g>
          <g transform={`translate(${260 + 20 * peel} 0) scale(${-(1 - 0.9 * peel)} 1)`}><rect x={0} y={-360} width={260} height={360} fill={C.wood} stroke={C.line} strokeWidth={6} /></g>
          {Array.from({length: 12}).map((_, i) => (
            <g key={i} transform={`translate(${-200 + (i % 6) * 80} ${-300 + Math.floor(i / 6) * 70})`} opacity={peel}>
              <circle r={7} fill={C.steelD} stroke={C.line} strokeWidth={3} />
              <path d="M 0,6 L 0,30" stroke={C.line} strokeWidth={4} />
            </g>
          ))}
          {/* a single sample coat stays on its hook */}
          <g transform={`translate(${-120} ${-250})`} opacity={peel}>
            <path d="M -36,0 L 36,0 L 52,90 L -52,90 Z" fill={C.tomato} stroke={C.line} strokeWidth={5} />
            <path d="M -36,0 L -60,50 L -46,56 M 36,0 L 60,50 L 46,56" stroke={C.line} strokeWidth={5} fill="none" />
            <circle cx={0} cy={-6} r={16} fill={C.paperD} stroke={C.line} strokeWidth={4} />
          </g>
          <rect x={-250} y={-90} width={500} height={90} fill={C.woodD} stroke={C.line} strokeWidth={6} />
          <g transform="translate(120 -90)" opacity={peel}>
            <path d="M -50,0 L -42,-100 Q 0,-130 42,-100 L 50,0 Z" fill={C.steel} stroke={C.line} strokeWidth={5} />
            <circle cx={0} cy={-132} r={34} fill={C.paperD} stroke={C.line} strokeWidth={5} />
            <circle cx={-12} cy={-136} r={5} fill={C.ink} /><circle cx={12} cy={-136} r={5} fill={C.ink} />
            <path d="M -10,-118 L 10,-118" stroke={C.line} strokeWidth={4} />
            <path d="M -40,-150 Q 0,-188 40,-150 L 40,-142 L -40,-142 Z" fill={C.steelD} stroke={C.line} strokeWidth={4} />
          </g>
          <g transform="translate(-60 -100)" opacity={peel}>
            <rect x={-70} y={-16} width={140} height={20} fill={C.white} stroke={C.line} strokeWidth={4} />
            <path d={`M -56,-6 H ${-56 + 100 * easeIO(f, b(14), 14)}`} stroke={C.ink} strokeWidth={4} />
          </g>
          {/* the ticket slides across the counter to Bucket */}
          <g transform={`translate(${lerp(-10, -170, slide)} ${-130 + 20 * slide - 10 * Math.sin(f / 14)}) rotate(${-8 + 6 * tk})`} opacity={tk}>
            <rect x={-72} y={-24} width={144} height={48} rx={6} fill={C.brassL} stroke={C.line} strokeWidth={4} />
            <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>No. 0417</text>
          </g>
        </g>
        <Bucket f={f} x={250} y={1300} scale={1.1} brow={slide * 0.8} tilt={-6 * slide} />
      </SVG>
    </Frame>
  );
};

const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.12, fx: 500, fy: 1040}, {t: p.dur, z: 1.0, fx: 600, fy: 1000}]);
  const lock = ease(f, b(18), 8);
  const peelL = ease(f, b(17), 16);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate displayLines={['SOME DEALS MAY BE', 'ALASKANS ONLY']} text="SOME DEALS MAY BE ALASKANS ONLY" x={540} y={620} size={36} tone="glow" p={ease(f, b(16), 12) * (1 - ease(f, b(17) - 8, 8))} />
        <Plate text="MAY" x={540} y={620} size={72} tone="warn" p={ease(f, b(17), 12) * (1 - ease(f, b(18) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="NO OFFERINGS YET" x={540} y={620} size={42} tone="dark" p={ease(f, b(18), 12) * (1 - ease(f, b(19) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="TERMS NOT DECIDED" x={540} y={620} size={42} tone="warn" p={ease(f, b(19), 12)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        <Lot f={f} b={b} act={5} state={ f > b(18) ? 3 : 2 } brow={ease(f, b(18), 10) * 0.7} worry={ease(f, b(19), 12)} lock={lock} showSign={false} rb={0.3} tag={false}>
          {/* a dog-door sized window in the pipe wall with a stenciled word, daylight honest */}
          <g transform={`translate(${380} ${1118})`}>
            <rect x={-60} y={-44} width={120} height={88} rx={10} fill={C.gravelD} stroke={C.line} strokeWidth={5} />
            <rect x={-48} y={-32 - 28 * (1 - ease(f, b(16), 16))} width={96} height={64} rx={6} fill={C.skyL} stroke={C.line} strokeWidth={4} />
            <g transform="translate(0 -120)">
              <rect x={-90} y={-50} width={180} height={70} rx={6} fill={C.paper} stroke={C.line} strokeWidth={4} />
              <text x={-34} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.ink}>M</text>
              <text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.ink}>A</text>
              <text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.ink} transform={`translate(${34 + 8 * peelL} ${200 * peelL * peelL}) rotate(${70 * peelL})`} opacity={1 - 0.7 * peelL}>Y</text>
            </g>
          </g>
          {/* the torn price tag swings from the padlock */}
          <g transform={`translate(${DX - 40} ${GY - 150}) rotate(${10 * Math.sin(f / 16)})`} opacity={ease(f, b(19) - 6, 10)}>
            <path d="M 0,0 L 0,26" stroke={C.line} strokeWidth={3} />
            <path d="M -40,26 L 40,26 L 46,66 L 30,58 L 14,70 L -4,58 L -26,68 L -40,60 Z" fill={C.paper} stroke={C.line} strokeWidth={4} />
          </g>
        </Lot>
      </SVG>
    </Frame>
  );
};

const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.0, fx: 420, fy: 980}, {t: p.dur, z: 1.04, fx: 520, fy: 990}]);
  const glassX = lerp(160, 520, easeIO(f, b(24), 30));
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate displayLines={['PLURAL CEO', 'THE PITCH']} text="PLURAL CEO · THE PITCH" x={540} y={620} size={38} tone="glow" p={ease(f, b(21), 12) * (1 - ease(f, b(22) - 8, 8))} />
        <Plate displayLines={['ONE OF THE LARGEST CAPITAL', 'NEEDS IN A GENERATION']} text="ONE OF THE LARGEST CAPITAL NEEDS IN A GENERATION" x={540} y={620} size={30} tone="dark" p={ease(f, b(22), 12) * (1 - ease(f, b(23) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="THAT'S THE PITCH" x={540} y={620} size={46} tone="plate" p={ease(f, b(23), 12) * (1 - ease(f, b(24) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="NO AI PROJECT NAMED" x={540} y={620} size={44} tone="warn" p={ease(f, b(24), 12) * (1 - ease(f, b(25) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate displayLines={['IN SOURCES', 'REVIEWED HERE']} text="IN SOURCES REVIEWED HERE" x={540} y={620} size={40} tone="glow" p={ease(f, b(25), 12)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        <Lot f={f} b={b} act={6} state={3} lock={1} showSign={false} rb={0.4} worry={ease(f, b(25), 10) * 0.5}>
          {/* a billboard on the pipe with a speech balloon */}
          <g transform={`translate(${300} ${1100 - 360 * (1 - ease(f, b(21), 16))})`}>
            <path d="M -10,0 L 10,0 L 10,-110 L -10,-110 Z M 230,0 L 250,0 L 250,-110 L 230,-110 Z" fill={C.woodD} stroke={C.line} strokeWidth={4} />
            <rect x={-40} y={-300} width={320} height={200} rx={8} fill={C.paper} stroke={C.line} strokeWidth={6} />
            <path d={`M 40,-120 L 20,-90 L 80,-120 Z`} fill={C.paper} stroke={C.line} strokeWidth={5} />
            <g transform={`scale(${1 + 0.06 * ease(f, b(22), 10)} ${1 + 0.06 * ease(f, b(22), 10)})`}>
              <Lines x={-10} y={-260} w={260} n={4} gap={36} o={0.5} />
            </g>
          </g>
          {/* the mint slip glows up out of the paperwork first, then the glass finds it blank */}
          <g transform="translate(560 1230)">
            <rect x={-130} y={-20} width={260} height={46} fill={C.paper} stroke={C.line} strokeWidth={4} transform="rotate(-2)" />
            <rect x={-110} y={-44} width={230} height={32} fill={C.white} stroke={C.line} strokeWidth={4} transform="rotate(3)" />
            <g opacity={ease(f, b(23), 12)}>
              <rect x={-96} y={-64 - 50 * ease(f, b(23), 16)} width={190} height={30} rx={4} fill={C.mint} stroke={C.mintD} strokeWidth={4} />
              <rect x={-110} y={-78 - 50 * ease(f, b(23), 16)} width={218} height={58} rx={8} fill="none" stroke={C.mint} strokeWidth={4} opacity={0.35 + 0.2 * Math.sin(f / 6)} />
            </g>
          </g>
          <g transform={`translate(${glassX} ${1170 - 20 * Math.sin(f / 12)})`} opacity={ease(f, b(24) - 8, 10)}>
            <circle r={52} fill={C.skyL} fillOpacity={0.35} stroke={C.line} strokeWidth={8} />
            <path d="M 36,36 L 90,90" stroke={C.line} strokeWidth={14} strokeLinecap="round" />
            <path d="M 36,36 L 90,90" stroke={C.brass} strokeWidth={7} strokeLinecap="round" />
          </g>
        </Lot>
      </SVG>
    </Frame>
  );
};

const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.05, fx: 540, fy: 1000}, {t: p.dur, z: 1.0, fx: 540, fy: 1000}]);
  const rings = [[330, 1010], [420, 1090], [560, 1030], [660, 1100], [760, 1020], [490, 1150], [600, 1170]];
  const nRings = rings.filter((_, i) => f > b(28) + i * 7).length;
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate text="THE DAILY NEWS" x={540} y={620} size={46} tone="glow" p={vis(f, b, [26, 27, 28], 0)} />
        <Plate text="FIRST MET JUNE 2025" x={540} y={620} size={42} tone="dark" p={vis(f, b, [26, 27, 28], 1)} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="AT LEAST 7 MEETINGS" x={540} y={620} size={46} tone="warn" p={vis(f, b, [26, 27, 28], 2)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        <Backdrop f={f} act={7} />
        <HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={37} strength={0.4} rx={20} mode="sweep" />
        <g transform="translate(540 1220)">
          <rect x={-420} y={-30} width={840} height={110} fill={C.woodD} stroke={C.line} strokeWidth={6} />
          <path d="M -380,-30 L -330,-300 L 330,-300 L 380,-30 Z" fill={C.paperD} stroke={C.line} strokeWidth={6} />
          {/* a plain ledger page, ruled */}
          <rect x={-300} y={-280} width={600} height={240} fill={C.paper} stroke={C.line} strokeWidth={5} />
          {Array.from({length: 6}).map((_, i) => <path key={i} d={`M -280,${-250 + i * 36} H 280`} stroke={C.ink} strokeWidth={2.4} opacity={0.35} />)}
          {rings.map(([rx, ry], i) => {
            const t = ease(f, b(28) + i * 7, 8);
            if (t <= 0.02) return null;
            return (
              <g key={i} transform={`translate(${rx - 540} ${ry - 1220 - 100 * (1 - t)})`} opacity={t}>
                <circle r={34} fill="none" stroke={C.woodD} strokeWidth={9} strokeDasharray={i === 6 ? '90 40' : undefined} />
                <circle r={22} fill="none" stroke={C.woodD} strokeWidth={3} opacity={0.5} />
              </g>
            );
          })}
        </g>
        {/* the masthead and two cup nameplates */}
        <g transform={`translate(${200} ${1160 - 140 * (1 - ease(f, b(26), 14))}) rotate(-4)`} opacity={ease(f, b(26), 8)}>
          <rect x={-120} y={-42} width={240} height={84} fill={C.news} stroke={C.line} strokeWidth={5} />
          <text x={0} y={-8} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight={900} fontSize={26} fill={C.ink}>THE DAILY NEWS</text>
          <Lines x={-100} y={8} w={200} n={2} gap={14} o={0.5} />
        </g>
        {[['GOVERNOR', 780], ['PLURAL CEO', 930]].map(([lab, cx], i) => (
          <g key={i} transform={`translate(${cx} ${1160 - 100 * (1 - ease(f, b(27) + i * 6, 10))}) rotate(${i ? 6 : -4})`} opacity={ease(f, b(27) + i * 6, 8)}>
            <rect x={-62} y={-30} width={124} height={50} rx={5} fill={C.paper} stroke={C.line} strokeWidth={5} />
            <text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.ink}>{lab as string}</text>
            <path d="M -30,20 Q 0,60 30,20" fill={C.brassL} stroke={C.line} strokeWidth={4} />
          </g>
        ))}
        {/* Drip in the corner, his brass dulling a notch with each ring */}
        <g opacity={0.97}>
          <g transform={`translate(0 0)`}>
            <Drip f={f} x={930} y={1630} scale={0.55} state={3} worry={0.5 + 0.1 * nRings} brow={-0.3} bead={1} />
          </g>
        </g>
      </SVG>
    </Frame>
  );
};

const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lift = easeIO(f, b(29), 80);
  const cam = track([{t: 0, z: 1.18, fx: 700, fy: 1020}, {t: p.dur, z: 1.0, fx: 540, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate displayLines={['A CRITIC', 'THE DAILY NEWS']} text="A CRITIC · THE DAILY NEWS" x={540} y={620} size={40} tone="glow" p={ease(f, b(29), 12) * (1 - ease(f, b(43) - 8, 8))} />
        <Plate displayLines={['ADVOCACY GROUP', 'FOUNDER']} text="ADVOCACY GROUP FOUNDER" x={540} y={620} size={40} tone="plate" p={ease(f, b(43), 12) * (1 - ease(f, b(30) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate displayLines={['CRITIC · HUNDREDS', 'OF MILLIONS']} text="CRITIC · HUNDREDS OF MILLIONS" x={540} y={620} size={40} tone="warn" p={ease(f, b(30), 12) * (1 - ease(f, b(31) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate displayLines={['CRITIC · LOWER 48', 'CORPORATIONS']} text="CRITIC · LOWER 48 CORPORATIONS" x={540} y={620} size={40} tone="dark" p={ease(f, b(31), 12)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        <Backdrop f={f} act={8} />
        <HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={38} strength={0.4} rx={20} mode="sweep" />
        {/* the Lower 48 outline on the ground plane at the left, with a crate */}
        <g transform="translate(150 1260)" opacity={ease(f, b(30) - 20, 20)}>
          <path d="M -150,0 L -90,-30 L 20,-26 L 130,-34 L 150,10 L 90,36 L -20,26 L -100,36 Z" fill={C.paperD} stroke={C.line} strokeWidth={5} />
          <rect x={-40 + 40 * ease(f, b(31), 16)} y={-100} width={90} height={64} fill={C.wood} stroke={C.line} strokeWidth={5} />
        </g>
        <Pipe grow={1} tilt={lift * 0.9} />
        {/* the bags in the booth lean after the pipe's far end */}
        <g transform={`translate(${160} ${1150}) rotate(${-8 * lift} 0 0)`}>
          <rect x={-60} y={-90} width={120} height={90} fill={C.paper} stroke={C.line} strokeWidth={5} />
          {Array.from({length: 8}).map((_, i) => <rect key={i} x={-48 + (i % 4) * 26} y={-34 - Math.floor(i / 4) * 24 - 4 * lift * i} width={22} height={20} rx={4} fill={C.brassL} stroke={C.line} strokeWidth={3} />)}
        </g>
        {/* the far flange gets a name tab */}
        <g opacity={ease(f, b(43), 10)} transform={`translate(${200} ${1020 + 60 * lift})`}>
          <rect x={-70} y={-18} width={140} height={36} rx={4} fill={C.paper} stroke={C.line} strokeWidth={4} />
          <Lines x={-54} y={-4} w={108} n={2} gap={12} o={0.5} />
        </g>
        <Drip f={f} state={3} worry={0.4 + 0.5 * ease(f, b(31), 14)} brow={-0.3} />
        <Padlock p={1} f={f} />
        <Bucket f={f} x={DX - 208} y={GY + 24} scale={0.9} brow={0.6} />
        <Rulebook f={f} x={430} y={1290} scale={0.5} run={0} />
        {/* Drip turns to watch his own pipe point away */}
      </SVG>
    </Frame>
  );
};

const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.0, fx: 500, fy: 980}, {t: p.dur, z: 1.06, fx: 560, fy: 990}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate text="AIDEA BOARD" x={540} y={620} size={46} tone="glow" p={ease(f, b(32), 12) * (1 - ease(f, b(33) - 8, 8))} />
        <Plate displayLines={['AT LEAST ONE MORE', 'MEETING DEC 4']} text="AT LEAST ONE MORE MEETING DEC 4" x={540} y={620} size={38} tone="warn" p={ease(f, b(33), 12) * (1 - ease(f, b(34) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="DATA CENTERS HERE" x={540} y={620} size={42} tone="dark" p={ease(f, b(34), 12) * (1 - ease(f, b(35) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate displayLines={['OUTGOING GOVERNOR', 'DO IT RIGHT']} text="OUTGOING GOVERNOR · DO IT RIGHT" x={540} y={620} size={38} tone="plate" p={ease(f, b(35), 12)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        {/* an empty boardroom, cool top light, chairs dropping in */}
        <path d="M -40,300 H 1120 V 1920 H -40 Z" fill={C.paperD} />
        <path d="M -40,300 H 1120 V 1060 H -40 Z" fill={C.skyL} stroke={C.line} strokeWidth={4} />
        <path d="M -40,1060 H 1120 V 1920 H -40 Z" fill={C.woodD} stroke={C.line} strokeWidth={4} />
        <Calendar x={250} y={930} month="DECEMBER" ring={ease(f, b(33), 14)} ringAt={3} f={f} sway={0} scale={0.95} />
        <g transform="translate(640 1260)">
          <rect x={-300} y={-40} width={600} height={50} fill={C.wood} stroke={C.line} strokeWidth={6} />
          <path d="M -260,10 L -260,120 M 260,10 L 260,120" stroke={C.line} strokeWidth={10} />
          {[-210, -70, 70, 210].map((cx, i) => (
            <g key={i} transform={`translate(${cx} ${-90 - 220 * (1 - ease(f, b(32) + i * 6, 12))})`} opacity={ease(f, b(32) + i * 6, 6)}>
              <rect x={-36} y={-70} width={72} height={80} rx={8} fill={C.pail} stroke={C.line} strokeWidth={5} />
              <rect x={-30} y={10} width={60} height={14} fill={C.steelD} stroke={C.line} strokeWidth={4} />
            </g>
          ))}
        </g>
        <HeldTravel f={f} x={0} y={700} w={1080} h={600} seed={40} strength={0.4} rx={20} mode="sweep" />
        <HeldTravel f={f} x={0} y={1100} w={1080} h={500} seed={41} strength={0.4} rx={20} mode="sweep" />
        {/* a roadside sign swings into the boardroom window, two planks */}
        <Sign x={880} y={1010} w={300} h={110} lines={['DATA CENTERS', 'HERE']} p={ease(f, b(34), 14)} f={f} />
        <Sign x={880} y={1110} w={300} h={90} lines={['DO IT RIGHT']} p={ease(f, b(35), 12)} f={f} tone={C.brassL} />
        {/* Drip waits in the window and his handle lifts at the second plank */}
        <Drip f={f} x={930} y={1560} scale={0.5} state={3} brow={ease(f, b(35), 10)} worry={0.3} />
      </SVG>
    </Frame>
  );
};

const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cam = track([{t: 0, z: 1.0, fx: 560, fy: 990}, {t: p.dur, z: 1.05, fx: 520, fy: 1000}]);
  const rip = ease(f, b(44), 14);
  const flick = Math.sin(f / 3) > 0.1 ? 1 : 0.3;
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate text="NEW GOVERNOR DEC 7" x={540} y={620} size={44} tone="glow" p={ease(f, b(36), 12) * (1 - ease(f, b(44) - 8, 8))} />
        <Plate text="KREISS-TOMKINS · GOVERNOR" x={540} y={620} size={32} tone="dark" p={ease(f, b(44), 12) * (1 - ease(f, b(37) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="WOULD SUPPORT A PAUSE" x={540} y={620} size={42} tone="dark" p={ease(f, b(37), 12) * (1 - ease(f, b(38) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate displayLines={['UNTIL COMPREHENSIVE', 'RULES']} text="UNTIL COMPREHENSIVE RULES" x={540} y={620} size={40} tone="plate" p={ease(f, b(38), 12)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        <Lot f={f} b={b} act={10} state={ f > b(37) ? 4 : 3 } lock={1} brow={ease(f, b(37), 14) * 0.5} worry={0.4} showSign={false} tag={false} rb={0.4 + 0.6 * easeIO(f, b(36) - 30, 50)} flurry={ease(f, b(36), 30)}>
          <g transform={`translate(${290} ${900})`}>
            <Calendar x={0} y={0} month="DECEMBER" ring={ease(f, b(36) + 8, 14)} ringAt={6} f={f} sway={-6 * rip + 4} scale={0.8} />
          </g>
          <g transform={`translate(${470} ${1100 - 60 * (1 - ease(f, b(44), 12))})`} opacity={ease(f, b(44), 8)}>
            <rect x={-90} y={-24} width={180} height={48} rx={5} fill={C.brassL} stroke={C.line} strokeWidth={5} />
            <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.ink}>GOVERNOR</text>
          </g>
          <Sign x={660} y={1040} w={300} h={170} lines={['WOULD SUPPORT', 'A PAUSE']} p={ease(f, b(37), 14)} f={f} />
          <g opacity={ease(f, b(38), 10)} transform={`translate(${660} ${1060 + 6 * Math.sin(f / 10)})`}>
            <rect x={-90} y={-18} width={180} height={36} rx={4} fill={C.wood} stroke={C.line} strokeWidth={4} />
            <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.paper}>UNTIL RULES</text>
          </g>
          {/* the stenciled MAY flickers back on the dog-door window */}
          <g transform={`translate(${380} ${1118})`} opacity={ease(f, b(38), 10)}>
            <text x={-20} y={-90} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.ink} letterSpacing={4}>MA</text>
            <text x={14} y={-90} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.ink} transform={`translate(${60 * (1 - easeIO(f, b(38), 22))} ${180 * (1 - easeIO(f, b(38), 22))})`}>Y</text>
          </g>
        </Lot>
      </SVG>
    </Frame>
  );
};

const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pull = easeIO(f, b(40) - 20, 70);
  const cam = track([{t: 0, z: 1.6, fx: DX - 70, fy: 1290}, {t: b(40) - 10, z: 1.5, fx: DX - 70, fy: 1250}, {t: b(41) + 20, z: 1.12, fx: 600, fy: 1050}, {t: p.dur, z: 1.0, fx: 560, fy: 1000}]);
  const out = ease(f, p.dur - 10, 8);
  return (
    <Frame p={p} cam={cam} overlay={<>
        <Plate displayLines={['BUILD VS PAUSE']} text="BUILD VS PAUSE" x={540} y={620} size={50} tone="glow" p={ease(f, b(39), 12) * (1 - ease(f, b(40) - 8, 8))} />
        <Plate text="ORDER" x={540} y={620} size={80} tone="dark" p={ease(f, b(40), 12) * (1 - ease(f, b(41) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate text="RULES FIRST" x={540} y={620} size={60} tone="plate" p={ease(f, b(41), 12) * (1 - ease(f, b(42) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
        <Plate displayLines={['RULES FIRST,', 'OR MONEY FIRST']} text="RULES FIRST, OR MONEY FIRST" x={540} y={620} size={46} tone="warn" p={ease(f, b(42), 12)} /> {/* plate-overlap-ok: sequenced */}
      </>}>
      <SVG>
        <Lot f={f} b={b} act={11} state={ f > b(42) ? 5 : 4 } lock={1} brow={ease(f, b(41), 14) * 0.8} bead={1} showSign={f > b(41) + 22} suffix="(RULES?)" worry={0.2} rb={1} flurry={1} tag={false}>
          <Sign x={470} y={1100} w={220} h={110} lines={['DATA CENTERS', 'HERE']} p={ease(f, b(41) + 18, 10)} f={f} />
          <Sign x={700} y={1110} w={220} h={110} lines={['WOULD SUPPORT', 'A PAUSE']} p={ease(f, b(41) + 18, 10)} f={f} />
          {/* the padlock key drops at Drip's feet beside the pail */}
          <g transform={`translate(${DX - 70} ${lerp(980, 1290, ease(f, b(39), 10))}) rotate(${ease(f, b(39), 10) * 25})`} opacity={ease(f, b(39), 4)}>
            <circle r={18} fill="none" stroke={C.brassL} strokeWidth={9} />
            <path d="M 18,0 H 60 M 46,0 V 14 M 56,0 V 12" stroke={C.brassL} strokeWidth={8} strokeLinecap="round" />
          </g>
          <g transform={`translate(${380} ${1118})`}>
            <text x={-20} y={-90} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.ink} letterSpacing={4}>MAY</text>
          </g>
        </Lot>
      </SVG>
      <SVG>
        <path d="M 0,0 H 1080 V 1920 H 0 Z" fill="#000" opacity={out} />
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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

export const ep1113Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1113Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1113: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 9.9, 20.2, 32.5, 37.2, 43.7, 55.0, 69.9, 78.7, 90.4, 101.4, 112.4, 119.2].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#161B16" ink="#EEF2EC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
