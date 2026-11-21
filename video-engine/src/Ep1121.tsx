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
import {IdleFigure, FigureFinish, StrikeProp} from './lib/figureidle';
import {Scrollback, LotTag, Gavel, Crate, KitchenBG, CourtBG, AU} from './lib/auction';
import {Phone, ScalePans} from './lib/fiber';
import {Moose} from './lib/fauna';
import {AK_PATH} from './lib/akmap';
import {IDS} from './Ep1121Ids';

// Lot 1, Your Chats, 2026-11-21. Palette roles are art_direction.json: spruce-black night through a spruce window onto the Chugach,
// oiled birch planks, walnut courtroom, a pale mint hero, oxblood velvet, and auction mustard ONLY on the lot tag, the starburst and the
// paddle. Scrollback is the only face. Every person is faceless with a boxed name tag. No SOLD, no tick, the ombudsman never decides.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;

export const C = {
  night: AU.night, spruce: AU.spruce, slate: AU.slate, snow: AU.snow, plank: AU.birch, plankD: AU.birchD, lamp: AU.lamp,
  walnut: AU.walnut, walnutL: AU.walnutL, walnutD: AU.walnutD, plaster: AU.plaster, paper: '#FFF6E3', ink: '#1B1A22',
  wall: AU.birch, brass: AU.brass, mustard: AU.mustard, mustardD: AU.mustardD, velvet: AU.velvet, brick: '#9C3F2A', mint: AU.bubble, carpet: '#5B6B7A', desk: '#7C8A96',
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

type Tone = 'plate' | 'dark' | 'cyan';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  dark: {fill: '#1F4D3A', fg: '#FFF6E3', edge: '#FFF6E3'},
  cyan: {fill: '#13241E', fg: '#E6F4EE', edge: '#CFE6DA'},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'plate', p = 1, rot = 0}) => {
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
    <g opacity={Math.min(1, k * 1.7)} transform={`translate(${x} ${yy}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={t.edge} strokeWidth={4} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

/** a small tag sized to its string, used on figures and props */
const Lab: React.FC<{text: string; x: number; y: number; size?: number; fill?: string; ink?: string; rot?: number}> = ({text, x, y, size = 22, fill = C.paper, ink = C.ink, rot = 0}) => {
  const w = monoW(text, size) + 24;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2} y={-size * 0.75 - 6} width={w} height={size * 1.5 + 4} rx={5} fill={fill} stroke={C.ink} strokeWidth={3} />
      <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} fill={ink}>{text}</text>
    </g>
  );
};

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; overlay?: React.ReactNode; bg?: string; warmth?: number; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.22, ox = 540, oy = 960, overlay, bg = C.wall, warmth = 0.03, children}) => {
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
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#13241E" stroke="#FFF6E3" strokeWidth={2.4} opacity={0.92} />
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

// ---- the shared worlds -----------------------------------------------------------------------------------------------------------------------------
const Suit: React.FC<{f: number; x: number; y: number; s?: number; seed?: number; cues?: number[]; coat?: string; tag?: string; reach?: number; facing?: 1 | -1; walk?: number; tie?: boolean; longHair?: boolean; reachL?: number}> =
({f, x, y, s = 1, seed = 1, cues = [], coat = '#3A4048', tag, reach = 0, facing = 1, walk = 0, tie = true, longHair = false, reachL = 0}) => {
  const hgt = 300 * s;
  const step = Math.sin(walk * 0.35) * 14;
  return (
    <>
    <FigureFinish x={x} footY={y} w={140 * s} h={hgt} keySide="left" rimColor="#FFD7B0">
      <IdleFigure f={f} x={x} footY={y} h={hgt} seed={seed} cues={cues}>
        {(pose) => (
          <g transform={`translate(${x},${y}) scale(${s * facing},${s})`}>
            <ContactShadow cx={0} cy={2} rx={62} ry={9} opacity={0.38} />
            <path d={`M -18 -110 L ${-22 + step} -6`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
            <path d={`M -18 -110 L ${-22 + step} -6`} stroke="#2A2E36" strokeWidth={14} strokeLinecap="round" />
            <path d={`M 18 -110 L ${22 - step} -6`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
            <path d={`M 18 -110 L ${22 - step} -6`} stroke="#2A2E36" strokeWidth={14} strokeLinecap="round" />
            <ellipse cx={-22 + step} cy={-4} rx={22} ry={10} fill="#1A1A20" stroke={C.ink} strokeWidth={3} />
            <ellipse cx={22 - step} cy={-4} rx={22} ry={10} fill="#1A1A20" stroke={C.ink} strokeWidth={3} />
            <g transform={`translate(${pose.shift * 0.4},${pose.dip + Math.sin(f / 11 + seed) * 2.5}) rotate(${pose.lean} 0 -110)`}>
              <path d="M -50 -100 Q -56 -200 -30 -228 L 30 -228 Q 56 -200 50 -100 Q 0 -90 -50 -100 Z" fill={coat} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              <path d="M -16 -226 L 0 -170 L 16 -226 Z" fill="#F2EEE6" stroke={C.ink} strokeWidth={3} />
              {tie && <path d="M -4 -200 L 4 -200 L 6 -150 L 0 -140 L -6 -150 Z" fill={C.brick} stroke={C.ink} strokeWidth={2} />}
              {!tie && <circle cx={0} cy={-206} r={6} fill="#C9A04A" stroke={C.ink} strokeWidth={2} />}
              <path d="M -36 -222 Q -48 -190 -44 -110" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.25} strokeLinecap="round" />
              <path d={`M -40 -214 Q ${-64 + pose.armL * 10 - reachL * 20} ${-170 - reachL * 30} ${-52 + pose.armL * 6 - reachL * 40} ${-128 - reachL * 80}`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" />
              <path d={`M -40 -214 Q ${-64 + pose.armL * 10 - reachL * 20} ${-170 - reachL * 30} ${-52 + pose.armL * 6 - reachL * 40} ${-128 - reachL * 80}`} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
              <path d={`M 40 -214 Q ${70 + reach * 30} ${-190 + reach * 10} ${58 + reach * 70} ${-128 - reach * 70 + pose.armR * 6}`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" />
              <path d={`M 40 -214 Q ${70 + reach * 30} ${-190 + reach * 10} ${58 + reach * 70} ${-128 - reach * 70 + pose.armR * 6}`} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
              <circle cx={58 + reach * 70} cy={-128 - reach * 70 + pose.armR * 6} r={11} fill="#C99A78" stroke={C.ink} strokeWidth={3} />
              <g transform={`translate(${pose.headX * 0.4},0) rotate(${pose.headRot} 0 -250)`}>
                <ellipse cx={0} cy={-262} rx={36} ry={42} fill="#C99A78" stroke={C.ink} strokeWidth={5} />
                <ellipse cx={8} cy={-256} rx={20} ry={24} fill="#9A6E52" opacity={0.6} />
                <path d="M -34 -282 Q 0 -312 34 -282 Q 20 -296 0 -298 Q -20 -296 -34 -282 Z" fill="#4A3A30" stroke={C.ink} strokeWidth={3} />
                {longHair && <path d="M -38 -280 Q -50 -236 -34 -214 L -22 -222 Q -32 -250 -26 -280 Z M 38 -280 Q 50 -236 34 -214 L 22 -222 Q 32 -250 26 -280 Z" fill="#6A4A36" stroke={C.ink} strokeWidth={3} />}
              </g>
            </g>
          </g>
        )}
      </IdleFigure>
    </FigureFinish>
    {tag && <Lab text={tag} x={x} y={y - hgt - 30 * s} size={20} />}
    </>
  );
};

/** a faceless reaching hand and sleeve from off frame; t 0..1 extends it, tag rides the cuff */
const Hand: React.FC<{f: number; x0: number; y0: number; x1: number; y1: number; t: number; tag?: string; sleeve?: string; tap?: number}> = ({f, x0, y0, x1, y1, t, tag, sleeve = '#3A4048', tap = 0}) => {
  const k = clamp01(t);
  const hx = lerp(x0, x1, k), hy = lerp(y0, y1, k) + Math.sin(f / 13) * 3 + Math.sin(clamp01(tap) * Math.PI) * 14;
  const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  return (
    <g>
      <path d={`M ${x0} ${y0} L ${hx} ${hy}`} stroke={C.ink} strokeWidth={56} strokeLinecap="round" />
      <path d={`M ${x0} ${y0} L ${hx} ${hy}`} stroke={sleeve} strokeWidth={46} strokeLinecap="round" />
      <path d={`M ${x0} ${y0} L ${hx} ${hy}`} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.18} transform="translate(0,-12)" />
      <g transform={`translate(${hx},${hy}) rotate(${ang})`}>
        <rect x={-14} y={-26} width={22} height={52} rx={6} fill="#F2EEE6" stroke={C.ink} strokeWidth={4} />
        <path d="M 6 -24 Q 46 -30 58 -12 Q 64 0 58 10 Q 46 26 6 24 Z" fill="#C99A78" stroke={C.ink} strokeWidth={4} />
        <path d="M 56 -10 L 82 -12 Q 88 -6 82 -2 L 56 0" fill="#C99A78" stroke={C.ink} strokeWidth={4} />
        <path d="M 30 18 Q 44 14 52 6" stroke="#9A6E52" strokeWidth={4} fill="none" />
      </g>
      {tag && k > 0.5 && <Lab text={tag} x={Math.min(1080 - monoW(tag, 20) / 2 - 110, hx)} y={hy - 64} size={20} />}
    </g>
  );
};


// ---- shared pieces for this film ---------------------------------------------------------------------------------------------------------------------
/** the near plane of the kitchen table under the caption bar: a mug, a salt shaker and adult mittens, varied by seed */
const TableNear: React.FC<{f: number; seed?: number; y?: number}> = ({f, seed = 0, y = 1560}) => (
  <g>
    <g transform={`translate(${170 + seed * 30},${y + 40})`}>
      <ContactShadow cx={0} cy={86} rx={90} ry={12} opacity={0.4} />
      <rect x={-62} y={-30} width={124} height={118} rx={16} fill="#C9D6CF" stroke={C.ink} strokeWidth={6} />
      <rect x={-56} y={-26} width={22} height={108} rx={8} fill="#E6EEE9" opacity={0.8} />
      <path d="M 62 0 Q 104 6 100 40 Q 96 70 62 64" fill="none" stroke={C.ink} strokeWidth={14} />
      <path d="M 62 0 Q 104 6 100 40 Q 96 70 62 64" fill="none" stroke="#C9D6CF" strokeWidth={7} />
      <ellipse cx={0} cy={-30} rx={62} ry={14} fill="#5A3A24" stroke={C.ink} strokeWidth={5} />
      {[0, 1].map((i) => <path key={i} d={`M ${-14 + i * 24} -50 q ${8 * Math.sin(f / 15 + i)} -24 0 -48`} stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.35} strokeLinecap="round" />)}
    </g>
    <g transform={`translate(${860 - seed * 20},${y + 120})`}>
      <ContactShadow cx={0} cy={16} rx={150} ry={14} opacity={0.38} />
      <path d="M -130 0 Q -140 -60 -96 -70 L -40 -74 Q -10 -76 -6 -40 L -4 6 Z" fill="#8E2E3A" stroke={C.ink} strokeWidth={6} />
      <path d="M -6 6 Q 0 -66 46 -72 L 100 -70 Q 140 -60 132 0 Z" fill="#8E2E3A" stroke={C.ink} strokeWidth={6} />
      <path d="M -126 -20 L -10 -24 M 0 -24 L 128 -20" stroke="#F1E8D6" strokeWidth={8} opacity={0.8} />
    </g>
    <g transform={`translate(${560 + seed * 40},${y + 170})`}>
      <ContactShadow cx={0} cy={6} rx={40} ry={7} opacity={0.4} />
      <rect x={-22} y={-74} width={44} height={78} rx={10} fill="#E8E2D6" stroke={C.ink} strokeWidth={5} />
      <rect x={-22} y={-90} width={44} height={22} rx={6} fill="#9AA3AE" stroke={C.ink} strokeWidth={4} />
    </g>
  </g>
);

/** a plain generic chat app icon: a rounded square with a speech bubble, no brand marks */
const AppIcon: React.FC<{x: number; y: number; s?: number; rot?: number; dizzy?: number; f: number}> = ({x, y, s = 1, rot = 0, dizzy = 0, f}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-70} y={-70} width={140} height={140} rx={34} fill="#3E6E62" stroke={C.ink} strokeWidth={6} />
    <rect x={-62} y={-64} width={60} height={24} rx={12} fill="#FFFFFF" opacity={0.18} />
    <path d="M -40 -26 Q -40 -42 -24 -42 L 26 -42 Q 42 -42 42 -26 L 42 10 Q 42 26 26 26 L -6 26 L -26 44 L -22 26 L -24 26 Q -40 26 -40 10 Z" fill="#F6EEDD" stroke={C.ink} strokeWidth={5} />
    {[0, 1, 2].map((i) => <circle key={i} cx={-18 + i * 18} cy={-8} r={5} fill={C.ink} opacity={0.7} />)}
    {dizzy > 0.05 && [0, 1, 2].map((i) => {
      const a = f / 6 + i * 2.1;
      return <path key={i} d={`M ${Math.cos(a) * 70} ${-86 + Math.sin(a) * 14} l 8 -14 l 8 14 l -16 -5 l 16 0 Z`} fill={C.mustard} stroke={C.ink} strokeWidth={2} opacity={dizzy} />;
    })}
  </g>
);

/** the MODEL hopper: a faceless steel funnel with a screen that glows; its label is drawn by the scene, last */
const Hopper: React.FC<{f: number; x: number; y: number; glow?: number}> = ({f, x, y, glow = 0}) => (
  <g transform={`translate(${x},${y})`}>
    <ContactShadow cx={0} cy={250} rx={130} ry={14} opacity={0.36} />
    <path d="M -150 -60 L 150 -60 L 60 120 L -60 120 Z" fill="#8B96A2" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -140 -54 L -60 116" stroke="#C9D2DA" strokeWidth={8} opacity={0.7} />
    <path d="M 140 -54 L 60 116" stroke="#5E6874" strokeWidth={10} opacity={0.6} />
    <rect x={-70} y={120} width={140} height={130} rx={10} fill="#6E7884" stroke={C.ink} strokeWidth={7} />
    <rect x={-56} y={140} width={112} height={72} rx={8} fill="#1E2A30" stroke={C.ink} strokeWidth={4} />
    <rect x={-56} y={140} width={112} height={72} rx={8} fill="#9FE0C8" opacity={0.15 + 0.5 * glow * (0.7 + 0.3 * Math.sin(f / 4))} />
    {[0, 1, 2, 3].map((i) => <circle key={i} cx={-40 + i * 26} cy={232} r={5} fill={i / 4 < glow ? '#9FE0C8' : '#3A444C'} stroke={C.ink} strokeWidth={2} />)}
  </g>
);

/** a mustard starburst badge with a number, for the starting bid */
const Burst: React.FC<{x: number; y: number; s?: number; text: string; f: number}> = ({x, y, s = 1, text, f}) => {
  const n = 14;
  const pts = Array.from({length: n * 2}).map((_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 + f / 90;
    const r = i % 2 ? 100 : 140;
    return `${Math.cos(a) * r},${Math.sin(a) * r}`;
  }).join(' ');
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <polygon points={pts} fill={C.mustard} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={60} fill={C.ink}>{text}</text>
    </g>
  );
};

/** a faceless walking grey crate with a gear icon and stubby legs (Disney's bid, a technology license, never a brand mark) */
const GreyCrate: React.FC<{f: number; x: number; y: number; s?: number; walk: number}> = ({f, x, y, s = 1, walk}) => {
  const st = Math.sin(walk * 0.45) * 14;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={6} rx={150} ry={12} opacity={0.36} />
      <path d={`M -50 -10 L ${-50 + st} 40`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
      <path d={`M 50 -10 L ${50 - st} 40`} stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
      <g transform={`translate(0,${-Math.abs(Math.sin(walk * 0.45)) * 8 + 36})`}>
        <Crate x={0} y={0} s={0.95} tint="#B9C2CC" shadow={false} />
        <g transform="translate(0,-92)">
          <circle cx={0} cy={0} r={34} fill="#E6EAEE" stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 8}).map((_, i) => <rect key={i} x={-7} y={-48} width={14} height={18} rx={3} fill="#E6EAEE" stroke={C.ink} strokeWidth={4} transform={`rotate(${i * 45 + f * 0.6})`} />)}
          <circle cx={0} cy={0} r={12} fill="#8B96A2" stroke={C.ink} strokeWidth={4} />
        </g>
      </g>
    </g>
  );
};

/** a squaring bubble: a rounded chat bubble that morphs into a square crate as k goes 0 -> 1 */
const SquaringBubble: React.FC<{x: number; y: number; k: number; label: string; s?: number; tint: string}> = ({x, y, k, label, s = 1, tint}) => {
  const kk = clamp01(k);
  if (kk >= 0.98) return <Crate x={x} y={y} s={0.66 * s} label={label} />;
  const w = lerp(160, 158, kk), hh = lerp(70, 112, kk), rx = lerp(35, 4, kk);
  return (
    <g transform={`translate(${x},${y - hh * s / 2 - 4}) scale(${s})`}>
      <rect x={-w / 2} y={-hh / 2} width={w} height={hh} rx={rx} fill={kk < 0.5 ? tint : AU.crate} stroke={C.ink} strokeWidth={6} />
    </g>
  );
};

/** a long paper runway, the privacy policy unrolled: grows from (x0,y0) to (x1,y1) with ruled lines; hi 0..1 highlights one clause */
const Runway: React.FC<{x0: number; y0: number; x1: number; y1: number; t: number; hi?: number; hiAt?: number}> = ({x0, y0, x1, y1, t, hi = 0, hiAt = 0.55}) => {
  const k = clamp01(t);
  const xe = lerp(x0, x1, k), ye = lerp(y0, y1, k);
  const w0 = 150, w1 = 70;
  const we = lerp(w0, w1, k);
  const hx = lerp(x0, x1, hiAt), hy = lerp(y0, y1, hiAt), hw = lerp(w0, w1, hiAt) * 0.4;
  return (
    <g>
      <path d={`M ${x0} ${y0 - w0 / 2} L ${xe} ${ye - we / 2} L ${xe} ${ye + we / 2} L ${x0} ${y0 + w0 / 2} Z`} fill="#FBF6EA" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      {Array.from({length: 18}).map((_, i) => {
        const u = (i + 0.5) / 18;
        if (u > k) return null;
        const xx = lerp(x0, x1, u), yy = lerp(y0, y1, u), ww = lerp(w0, w1, u) * 0.36;
        return <path key={i} d={`M ${xx} ${yy - ww} L ${xx} ${yy + ww}`} stroke={C.ink} strokeWidth={3} opacity={0.28} />;
      })}
      {k > hiAt && hi > 0.01 && <rect x={hx - 26} y={hy - hw} width={52} height={hw * 2} rx={6} fill={C.lamp} opacity={0.75 * hi} stroke={C.ink} strokeWidth={3} />}
      <ellipse cx={xe} cy={ye} rx={22} ry={we / 2} fill="#EDE3CF" stroke={C.ink} strokeWidth={5} />
    </g>
  );
};

/** the giant checked box at the runway's end (the company's argument, labelled by the scene) */
const CheckBox: React.FC<{x: number; y: number; s?: number; rock?: number}> = ({x, y, s = 1, rock = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rock * 4}) scale(${s})`}>
    <ContactShadow cx={0} cy={6} rx={170} ry={14} opacity={0.4} />
    <rect x={-150} y={-300} width={300} height={300} rx={18} fill="#FBF6EA" stroke={C.ink} strokeWidth={9} />
    <rect x={-150} y={-300} width={300} height={40} rx={14} fill="#FFFFFF" opacity={0.6} />
    <path d="M -90 -150 L -24 -80 L 96 -230" fill="none" stroke={C.ink} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** the round privacy seal (Thomson's tool), a wax-style disc with a padlock glyph */
const Seal: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {Array.from({length: 12}).map((_, i) => <circle key={i} cx={Math.cos(i / 12 * Math.PI * 2) * 44} cy={Math.sin(i / 12 * Math.PI * 2) * 44} r={8} fill="#3E6E62" stroke={C.ink} strokeWidth={3} />)}
    <circle cx={0} cy={0} r={44} fill="#3E6E62" stroke={C.ink} strokeWidth={5} />
    <circle cx={0} cy={0} r={34} fill="#4F8576" />
    <rect x={-14} y={-4} width={28} height={22} rx={4} fill="#F6EEDD" stroke={C.ink} strokeWidth={3} />
    <path d="M -9 -4 Q -9 -18 0 -18 Q 9 -18 9 -4" fill="none" stroke="#F6EEDD" strokeWidth={4} />
  </g>
);

/** a walnut bidder stand with a name card; name '' draws a blank card with only a dashed line */
const Stand: React.FC<{x: number; y: number; s?: number; name: string; lit?: number}> = ({x, y, s = 1, name, lit = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={4} rx={110} ry={12} opacity={0.42} />
    {lit > 0.01 && <ellipse cx={0} cy={-2} rx={150} ry={30} fill="#FFE3A8" opacity={0.45 * lit} />}
    <path d="M -70 0 L -50 -200 L 50 -200 L 70 0 Z" fill={C.walnut} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -56 -10 L -40 -190" stroke={C.walnutL} strokeWidth={8} opacity={0.7} />
    <rect x={-96} y={-240} width={192} height={44} rx={6} fill={C.walnutD} stroke={C.ink} strokeWidth={6} />
    <rect x={-110} y={-322} width={220} height={78} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
    {name ? <text x={0} y={-272} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>{name}</text>
      : <path d="M -84 -270 L 84 -270" stroke={C.ink} strokeWidth={3} strokeDasharray="10 6" />}
  </g>
);

/** a weight block with a tag, for the scale's pans */
const Weight: React.FC<{label: string; w?: number}> = ({label, w}) => {
  const ww = w ?? monoW(label, 22) + 30;
  return (
    <g>
      <rect x={-ww / 2} y={-62} width={ww} height={56} rx={8} fill="#8B96A2" stroke={C.ink} strokeWidth={6} />
      <rect x={-ww / 2 + 6} y={-58} width={ww - 12} height={12} rx={5} fill="#B9C2CC" opacity={0.8} />
      <text x={0} y={-24} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.paper}>{label}</text>
    </g>
  );
};

/** a closed binder with a blank cover */
const Binder: React.FC<{x: number; y: number; s?: number; rot?: number; open?: number}> = ({x, y, s = 1, rot = 0, open = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-50} y={-66} width={100} height={132} rx={6} fill="#2E4A5E" stroke={C.ink} strokeWidth={5} />
    <rect x={-50} y={-66} width={16} height={132} rx={4} fill="#22384A" />
    {open > 0.05 && <path d={`M -50 -66 L ${-50 - 96 * open} -60 L ${-50 - 96 * open} 70 L -50 66 Z`} fill="#F6EEDD" stroke={C.ink} strokeWidth={4} />}
  </g>
);

const OUTLINE48 = 'M 40 120 L 120 70 L 300 60 L 470 80 L 600 70 L 700 100 L 790 60 L 860 90 L 880 160 L 830 230 L 840 300 L 780 360 L 760 430 L 700 410 L 640 450 L 560 430 L 480 470 L 430 510 L 380 450 L 280 440 L 200 400 L 120 380 L 60 320 L 30 240 Z';

// ---- SH1 the pop (L0) --------------------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b1 = p.b(1), b2 = p.b(2), b3 = p.b(3);
  const pop = ease(f, b1 + 4, 14);
  const thunk = ease(f, b2 - 3, 8);
  const fog = ease(f, b3 - 6, 16);
  const sq = -0.45 * Math.sin(clamp01((f - b1 - 4) / 14) * Math.PI) + 0.5 * Math.sin(clamp01((f - b2 + 1) / 10) * Math.PI);
  const cam = track([{t: 0, z: 1.1, fx: 540, fy: 1020}, {t: b2, z: 1.05, fx: 540, fy: 990}, {t: p.dur, z: 1.0, fx: 560, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="AN AI APP'S CHATS" x={540} y={560} size={40} p={win(f, b1 + 8)} />
        <Plate text="IN AN AUCTION LOT" x={540} y={650} size={32} tone="dark" p={win(f, b2 + 4, b3)} /> {/* plate-overlap-ok */}
        <Plate text="PLANNED AUCTION" x={540} y={650} size={32} tone="dark" p={win(f, b3 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <KitchenBG f={f} seed={1} />
        <IdleFigure f={f} x={780} footY={900} h={160} seed={4} cues={[b1, b2, b3]}>
          {() => <Moose x={780 - fog * 40} y={900} scale={0.46} f={f} facing={-1} emotion={f > b3 ? 'wary' : 'calm'} alert={fog} />}
        </IdleFigure>
        <ellipse data-band="ok" cx={700} cy={800} rx={70} ry={40} fill="#FFFFFF" opacity={0.35 * fog} />
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#0B1914" opacity={0.6 * (1 - clamp01(f / 9))} />
        <HeldTravel f={f} x={430} y={1150} w={220} h={320} mode="sweep" seed={3}>
          <Phone x={540} y={1300} s={0.7} f={f} glow={1 + pop} rot={-8} />
        </HeldTravel>
        <g opacity={clamp01(0.5 + pop)} transform={`translate(540,1290) scale(${0.55 + 0.45 * pop}) translate(-540,-1290)`}>
          <Scrollback f={f} x={540} y={1290} scale={0.9} emotion={f < b3 ? 'startled' : 'worried'} squash={sq} cues={[b1, b2, b3]} seed={2} look={f > b3 ? 0.7 : 0} />
        </g>
        <g opacity={thunk} transform={`translate(0,${-(1 - thunk) * 260})`}>
          <LotTag f={f} x={650} y={1130} rows={[]} len={30} seed={2} />
        </g>
        <TableNear f={f} seed={0} />
      </SVG>
    </Frame>
  );
};

// ---- SH2 inside the phone (L1) ------------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b4 = p.b(4), b5 = p.b(5), b6 = p.b(6);
  const badge = ease(f, b6, 12);
  const bulge = easeIO(f, b6 + 6, Math.max(20, p.dur - b6 - 6));
  const rows = [
    {side: 1, w: 420, at: b4 + 2}, {side: -1, w: 520, at: b4 + 14}, {side: 1, w: 360, at: b4 + 28},
    {side: -1, w: 480, at: b5, mask: true}, {side: 1, w: 300, at: b5 + 16}, {side: -1, w: 560, at: b6 - 2, ther: true},
  ];
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.06, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} bg="#13241E" overlay={
      <g>
        <Plate text="CHARACTER.AI · CHAT WITH AI CHARACTERS" displayLines={['CHARACTER.AI', 'CHAT WITH AI CHARACTERS']} x={540} y={580} size={34} p={win(f, b4 + 6, b5)} />
        <Plate text="AI CHARACTER" x={540} y={560} size={34} p={win(f, b5 + 4, b6)} /> {/* plate-overlap-ok */}
        <Plate text="CHATBOTS POSING AS THERAPISTS · PER ATTORNEYS GENERAL" displayLines={['CHATBOTS POSING AS THERAPISTS', 'PER ATTORNEYS GENERAL']} x={540} y={590} size={30} tone="dark" p={win(f, b6 + 8)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2400} fill="#13241E" />
        <HeldTravel f={f} x={60} y={250} w={960} h={1500} mode="shadow" seed={22}>
        <rect data-band="ok" x={60} y={250} width={960} height={1500} rx={70} fill="#2A3350" stroke={C.ink} strokeWidth={10} />
        <rect data-band="ok" x={96} y={300} width={888} height={1400} rx={40} fill="#E9EEF0" />
        </HeldTravel>
        <rect x={96} y={300} width={888} height={110} rx={40} fill="#3E6E62" />
        <g transform="translate(160,355)"><AppIcon x={0} y={0} s={0.4} f={f} /></g>
        <rect x={240} y={335} width={260} height={36} rx={18} fill="#F6EEDD" opacity={0.85} />
        {rows.map((r, i) => {
          const k = ease(f, r.at, 12);
          if (k <= 0.01) return null;
          const y = 480 + i * 140;
          const x = r.side > 0 ? 960 - r.w / 2 - 20 : 120 + r.w / 2 + 20;
          const out = (r.side < 0 ? bulge : bulge * 0.6) * (i / rows.length);
          return (
            <g key={i} transform={`translate(${x},${y}) scale(${(0.6 + 0.4 * k) * (1 + out * 0.25)})`} opacity={k}>
              <ContactShadow cx={0} cy={50} rx={r.w * 0.4 * out + 1} ry={8} opacity={0.3 * out} />
              <rect x={-r.w / 2} y={-46} width={r.w} height={92} rx={46} fill={r.side > 0 ? AU.userTint : AU.aiTint} stroke={C.ink} strokeWidth={5} />
              <rect x={-r.w / 2 + 34} y={-14} width={r.w * 0.6} height={8} rx={4} fill={C.ink} opacity={0.25} />
              <rect x={-r.w / 2 + 34} y={6} width={r.w * 0.4} height={8} rx={4} fill={C.ink} opacity={0.25} />
              {r.mask && <path d={`M ${-r.w / 2 + 10} -30 q 26 -22 52 0 q -26 14 -52 0 Z`} fill={C.ink} />}
            </g>
          );
        })}
        <g opacity={badge} transform={`translate(${310},${480 + 5 * 140 - 70}) rotate(${-8 + settle(f, b6 + 8, 6)}) scale(${0.6 + 0.4 * badge})`}>
          <Lab text="THERAPIST?" x={0} y={0} size={26} />
        </g>
        <LotTag f={f} x={920} y={230} rows={[]} len={60} s={0.8} seed={3} />
        <rect data-band="ok" x={-200} y={1760} width={1480} height={400} fill="#8C6A44" />
      </SVG>
    </Frame>
  );
};

// ---- SH3 bubbles into crates (L2) ---------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b7 = p.b(7), b8 = p.b(8), b9 = p.b(9);
  const un = easeIO(f, b7 - 4, 30);
  const labels = ['PRIVATE CHATS', 'VOICE CALLS', 'MENTAL HEALTH'];
  const xs = [470, 690, 910];
  const at = [b7 + 6, b8 - 4, b7 + 20];
  const ride = easeIO(f, b9, 36);
  const glow = ease(f, b9 + 26, 20);
  const cam = track([{t: 0, z: 1.06, fx: 520, fy: 1060}, {t: p.dur, z: 1.0, fx: 560, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="PRIVATE CHATS · VOICE CALLS · MENTAL HEALTH" displayLines={['PRIVATE CHATS · VOICE CALLS', 'MENTAL HEALTH']} x={540} y={560} size={32} p={win(f, b7 + 10, b8)} />
        <Plate text="VOICE CALLS" x={540} y={560} size={34} p={win(f, b8 + 4, b9)} /> {/* plate-overlap-ok */}
        <Plate text="USED TO TRAIN ITS AI · PER THE AGS" x={540} y={560} size={32} tone="dark" p={win(f, b9 + 8)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <KitchenBG f={f} seed={3} winX={120} winY={140} winW={840} winH={520} lamp={0.8} />
        <HeldTravel f={f} x={620} y={700} w={320} h={330} mode="sweep" seed={23}>
          <Hopper f={f} x={780} y={770} glow={glow} />
        </HeldTravel>
        <path d="M 690 1140 Q 640 980 720 930" stroke={C.ink} strokeWidth={34} fill="none" strokeLinecap="round" opacity={ease(f, b9 - 4, 10)} />
        <path d="M 690 1140 Q 640 980 720 930" stroke="#E6E8EE" strokeWidth={22} fill="none" strokeLinecap="round" strokeDasharray="20 14" strokeDashoffset={-f * 2} opacity={ease(f, b9 - 4, 10)} />
        <Scrollback f={f} x={220} y={1290} scale={0.85} emotion={f > b9 ? 'worried' : 'startled'} unspool={un} scarfTo={[700, -60]} cues={[b7, b8, b9]} seed={2} count={3} look={0.8} />
        {xs.map((x, i) => {
          const k = ease(f, at[i], 16);
          const lift = i === 1 ? ride : 0;
          return (
            <g key={i} opacity={clamp01(k * 2) * (1 - (i === 1 ? ease(f, b9 + 30, 8) : 0))} transform={`translate(${lift * 40},${-lift * 330 - (1 - k) * 80})`}>
              <SquaringBubble x={x} y={1290} k={k} label={labels[i]} tint={i % 2 ? AU.userTint : AU.aiTint} />
            </g>
          );
        })}
        <LotTag f={f} x={410} y={1110} rows={[]} len={24} s={0.8} seed={4} />
        <TableNear f={f} seed={2} />
        <Lab text="MODEL" x={780} y={948} size={26} fill="#1E2A30" ink="#E6F4EE" />
      </SVG>
    </Frame>
  );
};

// ---- SH4 the map table (L3-L4) ------------------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b10 = p.b(10), b11 = p.b(11), b12 = p.b(12), b13 = p.b(13);
  const faint = ease(f, b10, 14);
  const flut = ease(f, b11, 18);
  const line = easeIO(f, b12, 40);
  const pin = ease(f, b13, 12);
  const cam = track([{t: 0, z: 1.25, fx: 320, fy: 860}, {t: b12 - 6, z: 1.2, fx: 340, fy: 880}, {t: b12 + 40, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 0.98, fx: 560, fy: 960}]);
  const P0 = {x: 372, y: 757}, P1 = {x: 950, y: 980};
  const qx = 700, qy = 640;
  const bez = (t: number) => ({x: (1 - t) * (1 - t) * P0.x + 2 * (1 - t) * t * qx + t * t * P1.x, y: (1 - t) * (1 - t) * P0.y + 2 * (1 - t) * t * qy + t * t * P1.y});
  const lead = bez(clamp01(line * 1.05));
  return (
    <Frame p={p} cam={cam} bg="#8C6A44" overlay={
      <g>
        <Plate text="BANKRUPT · OCTOBER 12TH" x={540} y={560} size={36} p={win(f, b10 + 8, b11)} />
        <Plate text="LEGAL COSTS · LOSSES IT COULDN'T FUND" displayLines={['LEGAL COSTS', "LOSSES IT COULDN'T FUND"]} x={540} y={580} size={32} tone="dark" p={win(f, b11 + 6, b12)} /> {/* plate-overlap-ok */}
        <Plate text="COULD TRANSFER TO A NEW OWNER" x={540} y={560} size={34} p={win(f, b12 + 10, b13)} /> {/* plate-overlap-ok */}
        <Plate text="AUCTION · DECEMBER 1ST" x={540} y={560} size={36} tone="dark" p={win(f, b13 + 6)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2400} fill="#8C6A44" />
        {Array.from({length: 14}).map((_, i) => <path key={i} d={`M -200 ${100 + i * 140} Q 540 ${80 + i * 146} 1280 ${110 + i * 138}`} stroke="#6E5234" strokeWidth={4} opacity={0.5} fill="none" />)}
        <HeldTravel f={f} x={80} y={480} w={940} h={760} mode="shadow" seed={5}>
          <g>
            <rect x={80} y={480} width={940} height={760} rx={10} fill="#E9DFC4" stroke={C.ink} strokeWidth={7} />
            <rect x={96} y={496} width={908} height={728} rx={6} fill="#CFDCE0" />
            {Array.from({length: 9}).map((_, i) => <path key={i} d={`M 96 ${540 + i * 80} L 1004 ${540 + i * 80}`} stroke="#B8C8CE" strokeWidth={2} />)}
            {Array.from({length: 11}).map((_, i) => <path key={i} d={`M ${140 + i * 84} 496 L ${140 + i * 84} 1224`} stroke="#B8C8CE" strokeWidth={2} />)}
            <path d="M 552 575 L 1004 520 L 1004 935 L 580 925 L 552 800 Z" fill="#DCD5C0" stroke={C.ink} strokeWidth={4} opacity={0.9} />
            <g transform="translate(110,560) scale(0.5)"><path d={AK_PATH} fill="#E8E0C8" stroke={C.ink} strokeWidth={10} /></g>
            <g transform="translate(560,900) scale(0.46)"><path d={OUTLINE48} fill="#E8E0C8" stroke={C.ink} strokeWidth={8} /></g>
            <text x={780} y={760} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill="#8E8670" letterSpacing={6}>CANADA</text>
          </g>
        </HeldTravel>
        <path d={`M ${P0.x} ${P0.y} Q ${qx} ${qy} ${P1.x} ${P1.y}`} stroke={C.ink} strokeWidth={8} fill="none" strokeDasharray="22 14" pathLength={1}
          style={{strokeDasharray: line > 0.99 ? '0.03 0.02' : `${line} 1`}} />
        <g transform={`translate(${P0.x},${P0.y})`}>
          <circle r={18} fill={C.spruce} stroke={C.ink} strokeWidth={5} />
          <path d="M -14 -30 L 0 -48 L 14 -30 Z M -10 -30 L 10 -30 L 10 -14 L -10 -14 Z" fill="#B39A76" stroke={C.ink} strokeWidth={3} />
        </g>
        {[0, 1, 2].map((i) => {
          const t = clamp01(line * 1.05 - i * 0.12);
          if (t <= 0.02) return null;
          const q = bez(t);
          return <Crate key={i} x={q.x} y={q.y + 6} s={0.2} />;
        })}
        <LotTag f={f} x={line > 0.02 ? lead.x - 10 : P0.x - 40} y={(line > 0.02 ? lead.y : P0.y) - 40} rows={[]} len={14} s={0.5} seed={5} />
        <g transform={`translate(${P1.x},${P1.y - pin * 30}) scale(${0.6 + 0.4 * pin})`} opacity={clamp01(line * 3 - 1.5)}>
          <rect x={-46} y={-60} width={92} height={60} fill={C.plaster} stroke={C.ink} strokeWidth={5} />
          <path d="M -56 -60 L 0 -96 L 56 -60 Z" fill={C.walnut} stroke={C.ink} strokeWidth={5} />
          {[-28, -10, 8, 26].map((cx) => <rect key={cx} x={cx - 4} y={-52} width={8} height={48} fill="#CDBFA4" stroke={C.ink} strokeWidth={2} />)}
          <g opacity={pin} transform="translate(56,-120)"><rect x={-6} y={0} width={6} height={60} fill={C.ink} /></g>
        </g>
        <g opacity={1 - ease(f, b12 + 10, 20)}>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${200 + i * 36 + flut * Math.sin(i * 2 + f / 9) * 30},${1120 - i * 6 - flut * (40 + i * 22)}) rotate(${-10 + i * 7 + flut * Math.sin(f / 7 + i) * 18})`}>
              <rect x={-60} y={-40} width={120} height={80} fill="#F8F2E2" stroke={C.ink} strokeWidth={4} />
              {[0, 1, 2].map((r) => <rect key={r} x={-44} y={-24 + r * 16} width={80 - r * 12} height={5} fill={C.ink} opacity={0.25} />)}
            </g>
          ))}
          <AppIcon x={380 - faint * 30} y={1060 + faint * 30} s={0.6} rot={faint * 78} dizzy={faint} f={f} />
          {flut > 0.3 && <Lab text="LEGAL COSTS" x={260} y={900} size={24} fill={C.paper} ink={C.brick} rot={-6} />}
          {flut > 0.3 && <Lab text="LOSSES" x={420} y={950} size={24} fill={C.paper} ink={C.brick} rot={5} />}
        </g>
        {pin > 0.3 && <Lab text="DEC 1ST" x={P1.x - 20} y={P1.y - 170} size={22} />}
        <g transform="translate(860,1600) rotate(-20)">
          <rect x={-200} y={-12} width={400} height={24} rx={8} fill="#E0C25A" stroke={C.ink} strokeWidth={5} />
          <path d="M 200 -12 L 250 0 L 200 12 Z" fill="#F4D6C8" stroke={C.ink} strokeWidth={4} />
        </g>
        <ellipse cx={220} cy={1640} rx={90} ry={86} fill="none" stroke="#5A3A24" strokeWidth={10} opacity={0.35} />
      </SVG>
    </Frame>
  );
};

// ---- SH5 the lot (L5-L6) ------------------------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b14 = p.b(14), b15 = p.b(15), b16 = p.b(16), b17 = p.b(17), b18 = p.b(18);
  const burst = ease(f, b14, 10);
  const box = ease(f, b15 - 4, 10);
  const last = ease(f, b16 - 6, 10);
  const spot = ease(f, b16, 8);
  const walk = clamp01((f - b17 + 4) / 50);
  const stamp = ease(f, b18, 8);
  const duck = ease(f, b14 + 2, 10) * (1 - ease(f, b17, 30));
  const gx = lerp(1260, 820, walk);
  const cam = track([{t: 0, z: 1.04, fx: 540, fy: 1000}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="$10M STARTING BID · APP · MODELS · ACCOUNTS · CHATS" displayLines={['$10M STARTING BID', 'APP · MODELS · ACCOUNTS · CHATS']} x={540} y={580} size={32} p={win(f, b14 + 8, b15)} />
        <Plate text="MODELS" x={540} y={560} size={34} p={win(f, b15 + 4, b16)} /> {/* plate-overlap-ok */}
        <Plate text="ACCOUNTS · CHAT CONTENT" x={540} y={560} size={32} p={win(f, b16 + 4, b17)} /> {/* plate-overlap-ok */}
        <Plate text="DISNEY · $20M · TECH LICENSE · NOT THE CHATS" displayLines={['DISNEY · $20M · TECH LICENSE', 'NOT THE CHATS']} x={540} y={580} size={32} tone="dark" p={win(f, b17 + 8)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1150} seed={1} rail={true} />
        <ellipse data-band="ok" cx={760} cy={890} rx={300} ry={60} fill="#FFE3A8" opacity={0.25 * spot} />
        <Stand x={660} y={890} s={0.55} name="DISNEY" lit={spot} />
        <Stand x={880} y={890} s={0.55} name="" lit={spot} />
        <HeldTravel f={f} x={120} y={900} w={720} h={260} mode="shadow" seed={6}>
          <g>
            <rect x={120} y={1060} width={720} height={90} rx={10} fill={C.walnut} stroke={C.ink} strokeWidth={7} />
            <rect x={120} y={1060} width={720} height={22} rx={8} fill={C.walnutL} />
            <Crate x={260} y={1060} s={0.62} label="PRIVATE CHATS" />
            <Crate x={430} y={1060} s={0.62} label="VOICE CALLS" />
            <Crate x={345} y={955} s={0.62} label="MENTAL HEALTH" />
            <g transform={`translate(0,${-(1 - last) * 90})`} opacity={last}><Crate x={600} y={1060} s={0.62} label="ACCOUNTS" /></g>
            <g transform={`translate(740,${1060 - (1 - box) * 120})`} opacity={box}>
              <rect x={-70} y={-120} width={140} height={120} rx={8} fill="#8B96A2" stroke={C.ink} strokeWidth={6} />
              <rect x={-60} y={-110} width={120} height={18} rx={5} fill="#B9C2CC" />
            </g>
            <g transform="translate(600,920)"><AppIcon x={0} y={0} s={0.42} f={f} /></g>
          </g>
        </HeldTravel>
        <g transform={`translate(0,${duck * 40})`}>
          <Scrollback f={f} x={100} y={1300} scale={0.5} emotion={duck > 0.3 ? 'startled' : 'worried'} cues={[b14, b16, b17]} seed={2} count={3} look={walk > 0.1 ? 1 : 0} shadow={false} />
        </g>
        <LotTag f={f} x={170} y={880} rows={burst > 0.5 ? ['$10M'] : []} len={40} seed={6} />
        <g opacity={burst * (1 - 0.6 * ease(f, b17, 10))} transform={`translate(260,${740 - (1 - burst) * 140}) rotate(${-8 + settle(f, b14 + 10, 6)})`}>
          <Burst x={0} y={0} s={0.6 + 0.1 * Math.sin(clamp01((f - b14) / 10) * Math.PI)} text="$10M" f={f} />
        </g>
        <GreyCrate f={f} x={gx} y={1290} s={0.62} walk={walk < 1 ? f : 0} />
        {walk > 0.05 && <Lab text="$20M" x={gx} y={1100} size={24} fill={C.paper} />}
        <g opacity={stamp} transform={`translate(${gx},1180) rotate(-10) scale(${1.3 - 0.3 * stamp})`}>
          <rect x={-136} y={-28} width={272} height={56} rx={6} fill="none" stroke={C.brick} strokeWidth={7} />
          <text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} fill={C.brick}>NOT THE CHATS</text>
        </g>
        {box > 0.5 && <Lab text="MODELS" x={740} y={990} size={20} fill="#8B96A2" ink={C.paper} />}
      </SVG>
    </Frame>
  );
};

// ---- SH6 forty desks (L7-L8) --------------------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b19 = p.b(19), b44 = p.b(44), b20 = p.b(20);
  const flag = ease(f, b19, 12);
  const cam = track([{t: 0, z: 1.16, fx: 320, fy: 1120}, {t: b20, z: 1.1, fx: 460, fy: 1080}, {t: p.dur, z: 1.08, fx: 560, fy: 1060}]);
  const rows = 5, cols = 8;
  const NY = {r: 1, c: 5};
  return (
    <Frame p={p} cam={cam} bg="#D8CCB4" overlay={
      <g>
        <Plate text="ALASKA JOINED · BIPARTISAN AG COALITION" displayLines={['ALASKA JOINED', 'BIPARTISAN AG COALITION']} x={540} y={580} size={34} p={win(f, b19 + 8, b44)} />
        <Plate text="BIPARTISAN" x={540} y={560} size={36} p={win(f, b44 + 4, b20)} /> {/* plate-overlap-ok */}
        <Plate text="NEW YORK LED · 39 OTHER ATTORNEYS GENERAL" displayLines={['NEW YORK LED', '39 OTHER ATTORNEYS GENERAL']} x={540} y={580} size={34} tone="dark" p={win(f, b20 + 8)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2400} fill="#D8CCB4" />
        <rect x={-200} y={-200} width={1480} height={780} fill="#E6DCC6" />
        {Array.from({length: 9}).map((_, i) => <rect key={i} x={-120 + i * 160} y={120} width={110} height={300} rx={50} fill="#B9CCD8" stroke={C.walnut} strokeWidth={10} />)}
        <HeldTravel f={f} x={770} y={390} w={220} h={150} mode="shadow" seed={21}>
        <g transform="translate(880,470)">
          <rect x={-110} y={-80} width={220} height={150} rx={8} fill="#B07A48" stroke={C.ink} strokeWidth={6} />
          <rect x={-94} y={-64} width={188} height={118} fill="#C8925C" />
          <LotTag f={f} x={0} y={-60} rows={['$10M']} len={18} s={0.7} seed={7} />
        </g>
        </HeldTravel>
        <rect data-band="ok" x={-200} y={580} width={1480} height={1400} fill="#7A6A58" />
        {Array.from({length: rows}).map((_, r) => Array.from({length: cols}).map((__, c) => {
          const depth = r / (rows - 1);
          const s = lerp(0.42, 0.95, depth);
          const x = 540 + (c - (cols - 1) / 2) * lerp(118, 230, depth);
          const y = lerp(720, 1300, depth);
          const d = Math.hypot(r - NY.r, c - NY.c);
          const on = ease(f, b20 + d * 4, 8);
          const isAK = r === rows - 1 && c === 2;
          const up = isAK ? flag : ease(f, b44 + (r * cols + c) * 0.6, 8);
          return (
            <g key={`${r}-${c}`} transform={`translate(${x},${y}) scale(${s})`}>
              <ContactShadow cx={0} cy={4} rx={90} ry={10} opacity={0.35} />
              <rect x={-80} y={-70} width={160} height={70} rx={6} fill={C.desk} stroke={C.ink} strokeWidth={6} />
              <rect x={-80} y={-70} width={160} height={16} rx={5} fill="#A3B0BB" />
              <path d="M 40 -70 L 40 -120 L 60 -136" stroke={C.ink} strokeWidth={6} fill="none" />
              <path d="M 44 -150 L 86 -142 L 70 -118 Z" fill={on > 0.5 ? '#FFE3A8' : '#5E6874'} stroke={C.ink} strokeWidth={4} />
              {on > 0.5 && <ellipse cx={60} cy={-66} rx={r === NY.r && c === NY.c ? 130 : 60} ry={r === NY.r && c === NY.c ? 30 : 14} fill="#FFE3A8" opacity={(r === NY.r && c === NY.c ? 0.7 : 0.4) * on} />}
              <g transform={`translate(-50,${-70 - 40 - up * 40})`}>
                <rect x={-3} y={0} width={6} height={40 + up * 40} fill={C.ink} />
                <rect x={3} y={0} width={56} height={36} fill={isAK ? '#1F3A6E' : ['#9C3F2A', '#3E6E62', '#C9A04A', '#5B6B7A', '#8E2E3A'][(r * cols + c) % 5]} stroke={C.ink} strokeWidth={3} />
                {isAK && [[12, 26], [20, 22], [28, 24], [34, 18], [40, 14], [48, 16], [50, 26], [46, 8]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r={i === 7 ? 3.5 : 2.4} fill="#E0B54A" />)}
              </g>
            </g>
          );
        }))}
        <rect data-band="ok" x={-200} y={1480} width={1480} height={500} fill="#6A5A48" />
        {Array.from({length: 7}).map((_, i) => <rect key={i} x={-120 + i * 190} y={1520} width={150} height={60} rx={8} fill={C.walnut} stroke={C.ink} strokeWidth={5} />)}
        <Lab text="ALASKA" x={540 + (2 - 3.5) * 230} y={1300} size={22} />
        {ease(f, b20, 8) > 0.3 && <Lab text="NEW YORK" x={540 + (5 - 3.5) * lerp(118, 230, 0.25)} y={lerp(720, 1300, 0.25) + 30} size={20} />}
      </SVG>
    </Frame>
  );
};

// ---- SH7 the order (L9) -------------------------------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b21 = p.b(21), b22 = p.b(22), b23 = p.b(23);
  const beam = easeIO(f, b21, Math.max(16, b22 - b21));
  const card = ease(f, b22 + 4, 14);
  const set = ease(f, b23, 14);
  const cam = track([{t: 0, z: 1.1, fx: 620, fy: 940}, {t: b23, z: 1.05, fx: 600, fy: 960}, {t: p.dur, z: 1.0, fx: 560, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="PER ALASKA'S DEPARTMENT OF LAW" x={540} y={560} size={32} p={win(f, b21 + 6, b22)} />
        <Plate text="COURT ORDERS A PRIVACY OMBUDSMAN" x={540} y={560} size={32} p={win(f, b22 + 8, b23)} /> {/* plate-overlap-ok */}
        <Plate text="PRIVACY OMBUDSMAN · AT THE COALITION'S URGING" displayLines={['PRIVACY OMBUDSMAN', "AT THE COALITION'S URGING"]} x={540} y={580} size={32} tone="dark" p={win(f, b23 + 6)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1200} seed={2} benchX={600} />
        <path data-band="ok" d={`M -100 700 L ${lerp(-100, 760, beam)} ${lerp(700, 900, beam)} L ${lerp(-100, 760, beam)} ${lerp(760, 940, beam)} L -100 820 Z`} fill="#FFE3A8" opacity={0.45 * (1 - ease(f, b22 + 20, 30) * 0.6)} />
        <StrikeProp f={f} at={b22} px={760} py={900} lift={150} windup={11} squash={0.22}>
          <Gavel x={760} y={900} s={0.8} rot={-12} />
        </StrikeProp>
        <g opacity={card} transform={`translate(${520 - (1 - card) * 60},${880 - Math.abs(settle(f, b22, 18, 16))})`}>
          <rect x={-150} y={-34} width={300} height={68} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>COURT ORDERS</text>
        </g>
        <g transform={`translate(0,${-(1 - set) * 70})`} opacity={clamp01(set * 2)}>
          <ScalePans x={360} y={890} s={0.42} tilt={Math.sin(f / 8) * 0.12} f={f} />
        </g>
        <g opacity={set * (1 - ease(f, b23 + 30, 14))}>
          <path d={`M 120 640 L ${lerp(120, 300, set)} ${lerp(640, 760, set)}`} stroke={C.ink} strokeWidth={40} strokeLinecap="round" />
          <path d={`M 120 640 L ${lerp(120, 300, set)} ${lerp(640, 760, set)}`} stroke="#4A4048" strokeWidth={30} strokeLinecap="round" />
        </g>
        <HeldTravel f={f} x={880} y={1100} w={160} h={110} mode="shadow" seed={24}>
          <Crate x={960} y={1200} s={0.5} label="CHATS" />
        </HeldTravel>
        <LotTag f={f} x={920} y={440} rows={['$10M']} len={200} s={0.8} seed={8} />
      </SVG>
    </Frame>
  );
};

// ---- SH8 named by the trustee (L10-L11) ---------------------------------------------------------------------------------------------------------------
/** a brass wall peg the lot tag hangs from, so the throughline is never pinned to air */
const Peg: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <rect x={x - 22} y={y - 10} width={44} height={20} rx={6} fill={C.walnutD} stroke={C.ink} strokeWidth={4} />
    <circle cx={x} cy={y} r={8} fill={C.brass} stroke={C.ink} strokeWidth={3} />
  </g>
);

const S8: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b24 = p.b(24), b25 = p.b(25), b26 = p.b(26), b27 = p.b(27);
  const walk = clamp01((f + 10) / 46);
  const pinB = ease(f, b24 + 16, 10);
  const tagS = ease(f, b25, 12);
  const open = ease(f, b26, 14);
  const press = ease(f, b27 - 6, 8);
  const sealOn = f >= b27;
  const fx = lerp(-80, 330, walk);
  const cam = track([{t: 0, z: 1.12, fx: 460, fy: 1000}, {t: b26, z: 1.1, fx: 560, fy: 990}, {t: p.dur, z: 1.14, fx: 600, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="NAMED BY THE U.S. TRUSTEE" x={540} y={560} size={34} p={win(f, b24 + 8, b25)} />
        <Plate text="LUCY L. THOMSON · DATA PRIVACY EXPERT" displayLines={['LUCY L. THOMSON', 'DATA PRIVACY EXPERT']} x={540} y={580} size={34} tone="dark" p={win(f, b25 + 6, b26)} /> {/* plate-overlap-ok */}
        <Plate text="REVIEWS THE SALE · RECOMMENDS SAFEGUARDS" displayLines={['REVIEWS THE SALE', 'RECOMMENDS SAFEGUARDS']} x={540} y={580} size={34} p={win(f, b26 + 6, b27)} /> {/* plate-overlap-ok */}
        <Plate text="RECOMMENDS SAFEGUARDS TO THE COURT" x={540} y={560} size={32} tone="dark" p={win(f, b27 + 6)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1180} seed={3} benchX={620} rail={true} />
        <HeldTravel f={f} x={540} y={640} w={320} h={260} mode="shadow" seed={25}>
          <ScalePans x={700} y={878} s={0.56} tilt={Math.sin(f / 9) * 0.1} f={f} />
        </HeldTravel>
        <Peg x={860} y={700} />
        <LotTag f={f} x={860} y={700} rows={['$10M']} len={40} s={0.9} seed={9} />
        <g opacity={press} transform={`translate(${lerp(420, 920, press)},${lerp(1100, 832, press)}) scale(${sealOn ? 0.55 : 0.8})`}>
          <Seal x={0} y={0} />
        </g>
        <Suit f={f} x={fx} y={1310} s={1.25} seed={6} cues={[b24, b25, b26, b27]} coat="#3E5A6E" tie={false} longHair walk={walk < 1 ? f : 0}
          reach={Math.max(open * 0.5, press) * 0.9} reachL={pinB * (1 - ease(f, b24 + 34, 10))} />
        <Binder x={fx + 100} y={1010} s={1.1} rot={-6} open={open} />
        <g opacity={pinB}><circle cx={fx - 22} cy={1310 - 300 * 1.25 * 0.74} r={13} fill={C.brass} stroke={C.ink} strokeWidth={3} /></g>
        <Scrollback f={f} x={930} y={1310} scale={0.62} emotion={sealOn ? 'hopeful' : 'wary'} cues={[b24, b26, b27]} seed={2} count={4} look={-0.8} />
        <g opacity={tagS}><Lab text="LUCY L. THOMSON" x={Math.max(150, fx)} y={1310 - 300 * 1.25 - 46} size={22} /></g>
        {sealOn && <Lab text="SAFEGUARDS?" x={920} y={900} size={18} fill="#3E6E62" ink="#F6EEDD" />}
      </SVG>
    </Frame>
  );
};

// ---- SH9 the blank card (L12-L13) ---------------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b28 = p.b(28), b29 = p.b(29), b30 = p.b(30);
  const swing = easeIO(f, b28, 36);
  const spot = ease(f, b28 + 30, 8);
  const flipT = clamp01((f - b29) / 16);
  const spin = Math.sin(flipT * Math.PI * 2) * (1 - flipT);
  const tuck = ease(f, b30, 14);
  const snap = Math.sin(clamp01((f - b30 - 10) / 10) * Math.PI);
  const peek = ease(f, b30 + 30, 20);
  const cam = track([{t: 0, z: 1.0, fx: 420, fy: 980}, {t: b28 + 40, z: 1.22, fx: 640, fy: 960}, {t: p.dur, z: 1.3, fx: 650, fy: 950}]);
  const beamX = lerp(300, 700, swing);
  return (
    <Frame p={p} cam={cam} bloom={0.08} overlay={
      <g>
        <Plate text="WHO MADE THE $10M BID?" x={540} y={560} size={36} p={win(f, b28 + 8, b29)} />
        <Plate text="FORMED NOV 13TH · BID FILED NOV 14TH" x={540} y={560} size={30} tone="dark" p={win(f, b29 + 8, b30)} /> {/* plate-overlap-ok */}
        <Plate text="BACKER NOT PUBLIC" x={540} y={560} size={36} p={win(f, b30 + 6)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2400} fill="#4A3424" />
        <rect x={-200} y={-200} width={1480} height={1100} fill={C.plaster} opacity={0.3} />
        {Array.from({length: 7}).map((_, i) => <rect key={i} x={-120 + i * 200} y={640} width={150} height={360} rx={8} fill="#5A4030" stroke={C.ink} strokeWidth={3} opacity={0.6} />)}
        <rect data-band="ok" x={-200} y={1240} width={1480} height={800} fill={C.walnut} />
        {Array.from({length: 9}).map((_, i) => <path key={i} d={`M -200 ${1270 + i * 70} L 1280 ${1260 + i * 72}`} stroke="#3A2A1E" strokeWidth={5} opacity={0.6} />)}
        <path data-band="ok" d={`M ${beamX - 70} 380 L ${beamX + 70} 380 L ${beamX + 220} 1240 L ${beamX - 220} 1240 Z`} fill="#FFF0C8" opacity={0.2} />
        <ellipse data-band="ok" cx={beamX} cy={1240} rx={220} ry={40} fill="#FFE3A8" opacity={0.42} />
        <g><rect x={beamX - 60} y={330} width={120} height={60} rx={8} fill="#2A2A30" stroke={C.ink} strokeWidth={5} /><path d={`M ${beamX - 50} 390 L ${beamX + 50} 390 L ${beamX + 90} 450 L ${beamX - 90} 450 Z`} fill="#3A3A42" stroke={C.ink} strokeWidth={5} /></g>
        <Stand x={300} y={1240} s={1} name="DISNEY" lit={1 - swing} />
        <HeldProp f={f} px={700} py={1240} w={240} h={330} kind="rest" seed={11}>
          <Stand x={700} y={1240} s={1.15} name="" lit={spot} />
        </HeldProp>
        <Peg x={800} y={560} />
        <g transform={`rotate(${spin * 30} 800 560)`}>
          <LotTag f={f} x={800} y={560} rows={flipT >= 0.5 ? ['FORMED NOV 13TH', 'BID FILED NOV 14TH'] : ['$10M']} flip={flipT >= 1 ? 0 : flipT} len={200} s={0.8} seed={10} />
        </g>
        {flipT < 0.5 && <g transform="translate(840,880)"><Seal x={0} y={0} s={0.45} /></g>}
        <g transform={`translate(0,${-snap * 10})`}>
          <Scrollback f={f} x={900} y={1310} scale={0.62} emotion="wary" unspool={1 - tuck} scarfTo={[-220, -40]} squash={0.35 * snap} cues={[b28, b29, b30]} seed={2} count={4} look={-0.6 + 0.4 * peek} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- SH10 the fine print (L14) ------------------------------------------------------------------------------------------------------------------------
/** the company's court filing: a sheet with a big quote mark, never a tick */
const Filing: React.FC<{x: number; y: number; s?: number; rock?: number}> = ({x, y, s = 1, rock = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rock * 4}) scale(${s})`}>
    <ContactShadow cx={0} cy={6} rx={160} ry={14} opacity={0.4} />
    <rect x={-130} y={-340} width={260} height={340} rx={10} fill="#FBF6EA" stroke={C.ink} strokeWidth={8} />
    <rect x={-130} y={-340} width={260} height={50} rx={10} fill="#E9E2D2" stroke={C.ink} strokeWidth={5} />
    <text x={-70} y={-150} fontFamily="Fraunces, serif" fontWeight={900} fontSize={190} fill={C.ink}>"</text>
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-100} y={-120 + i * 22} width={200 - (i % 2) * 40} height={8} rx={4} fill={C.ink} opacity={0.25} />)}
  </g>
);

const S10: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b31 = p.b(31), b32 = p.b(32), b33 = p.b(33);
  const roll = easeIO(f, b31, Math.max(24, b33 - b31));
  const stamp = ease(f, b32, 8);
  const hi = ease(f, b33 - 4, 10);
  const rock = settle(f, b33 + 14, 1, 30);
  const cam = track([{t: 0, z: 1.1, fx: 380, fy: 1060}, {t: b33, z: 1.06, fx: 560, fy: 1040}, {t: p.dur, z: 1.1, fx: 760, fy: 1020}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="THE COMPANY'S SIDE" x={540} y={560} size={36} p={win(f, b31 + 6, b32)} />
        <Plate text="TOLD THE COURT · PER THE COMPANY" x={540} y={560} size={32} p={win(f, b32 + 6, b33)} /> {/* plate-overlap-ok */}
        <Plate text={'"POLICY ALREADY PERMITTED THE SALE" · PER THE COMPANY'} displayLines={['"POLICY ALREADY PERMITTED THE SALE"', 'PER THE COMPANY']} x={540} y={580} size={30} tone="dark" p={win(f, b33 + 6)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1000} seed={4} benchX={640} />
        <Runway x0={300} y0={1240} x1={900} y1={1120} t={roll} hi={hi} hiAt={0.62} />
        <g opacity={stamp} transform={`translate(560,1170) rotate(-8) scale(${1.3 - 0.3 * stamp})`}>
          <rect x={-140} y={-30} width={280} height={60} rx={6} fill="none" stroke={C.brick} strokeWidth={7} />
          <text x={0} y={11} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} fill={C.brick}>TOLD THE COURT</text>
        </g>
        <HeldTravel f={f} x={750} y={760} w={260} h={360} mode="shadow" seed={26}>
          <Filing x={870} y={1110} s={0.95} rock={rock} />
        </HeldTravel>
        <Suit f={f} x={250} y={1310} s={1.3} seed={7} cues={[b31, b32, b33]} coat="#4A4048" reach={0.4 + 0.3 * roll + 0.3 * hi} reachL={0.3 + 0.4 * roll * (1 - hi)} />
        <Lab text="COMPANY LAWYER" x={250} y={1310 - 300 * 1.3 - 46} size={22} />
        {hi > 0.3 && <Lab text="PER THE COMPANY" x={870} y={1150} size={20} />}
      </SVG>
    </Frame>
  );
};

// ---- SH11 the sticky note (L15) -----------------------------------------------------------------------------------------------------------------------
/** a big modelled chat crate: planks with seams and end-grain, nail heads, a lit top edge, a stencil and a hard shadow */
const BigCrate: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => (
  <g>
    <ellipse cx={x} cy={y + 8} rx={w * 0.56} ry={18} fill="#000" opacity={0.42} />
    <rect x={x - w / 2} y={y - h} width={w} height={h} rx={8} fill={AU.crate} stroke={C.ink} strokeWidth={8} />
    {Array.from({length: 5}).map((_, i) => (
      <g key={i}>
        <path d={`M ${x - w / 2} ${y - h + (i + 1) * h / 6} L ${x + w / 2} ${y - h + (i + 1) * h / 6}`} stroke={AU.crateD} strokeWidth={4} />
        <path d={`M ${x - w / 2 + 40} ${y - h + i * h / 6 + 12} q 80 6 160 0 M ${x + 30} ${y - h + i * h / 6 + 26} q 70 -5 140 2`} stroke={AU.crateD} strokeWidth={2} fill="none" opacity={0.5} />
      </g>
    ))}
    <rect x={x - w / 2} y={y - h} width={w} height={18} rx={6} fill={AU.crateL} stroke={C.ink} strokeWidth={4} />
    <rect x={x - w / 2} y={y - h} width={46} height={h} fill={AU.crateL} stroke={C.ink} strokeWidth={5} opacity={0.95} />
    <rect x={x + w / 2 - 46} y={y - h} width={46} height={h} fill={AU.crateD} stroke={C.ink} strokeWidth={5} />
    {[[x - w / 2 + 23, y - h + 30], [x + w / 2 - 23, y - h + 30], [x - w / 2 + 23, y - 30], [x + w / 2 - 23, y - 30]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={6} fill={C.ink} opacity={0.7} />)}
    <text x={x} y={y - 40} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.ink} opacity={0.6} letterSpacing={4}>PRIVATE CHATS</text>
    <path d={`M ${x + w / 2 - 6} ${y - h + 120} q 30 0 30 30 q 0 30 -30 30`} fill="none" stroke={C.ink} strokeWidth={10} />
  </g>
);

const S11: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b34 = p.b(34), b46 = p.b(46), b35 = p.b(35);
  const flapK = Math.max(0, Math.sin(clamp01((f - b46) / 18) * Math.PI)) * 22;
  const shake = Math.sin(f / 2.4) * 3 * ease(f, b34, 10) * (1 - ease(f, b34 + 30, 20));
  const lift = Math.max(0, Math.sin(clamp01((f - b34) / 26) * Math.PI)) * 12;
  const ghost = ease(f, b35, 18);
  const cam = track([{t: 0, z: 1.02, fx: 540, fy: 1000}, {t: p.dur, z: 1.08, fx: 540, fy: 990}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="ALASKA'S SIDE · ALASKA ARGUES" x={540} y={560} size={34} p={win(f, b34 + 6, b46)} />
        <Plate text="LIMITS ON MINORS · VOLUNTARY" x={540} y={560} size={34} p={win(f, b46 + 4, b35)} /> {/* plate-overlap-ok */}
        <Plate text="A FUTURE BUYER COULD REVERSE THEM" displayLines={['A FUTURE BUYER COULD REVERSE THEM', "PER ALASKA'S DEPARTMENT OF LAW"]} x={540} y={580} size={30} tone="dark" p={win(f, b35 + 6)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1330} seed={5} rail={true} benchX={540} />
        <g transform={`translate(${shake},0)`}>
          <HeldTravel f={f} x={200} y={720} w={680} h={520} mode="shadow" seed={13}>
            <BigCrate x={540} y={1240} w={680} h={500} />
          </HeldTravel>
          <g opacity={ghost} transform={`translate(${540 + 250 + ghost * 40},${900 - 120 - ghost * 40}) rotate(${10 + ghost * 10})`}>
            <path d="M -110 -80 L 110 -80 L 110 80 L -110 80 Z" fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="16 12" />
          </g>
          <g transform={`translate(540,920) rotate(${-4 - lift * 0.4})`}>
            <path d={`M -170 -110 L 170 -110 L 170 ${110 - lift - flapK} L ${-170} 110 Z`} fill="#F3D86A" stroke={C.ink} strokeWidth={6} />
            <path d="M -170 -110 L 170 -110 L 170 -84 L -170 -84 Z" fill="#E6C850" />
            <text x={0} y={-12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>LIMITS ON MINORS</text>
            <text x={0} y={36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>VOLUNTARY</text>
          </g>
          <circle cx={268} cy={800} r={10} fill={C.brass} stroke={C.ink} strokeWidth={3} />
          <LotTag f={f} x={268} y={800} rows={['$10M']} len={40} s={0.75} seed={14} />
        </g>
        <Lab text="PER ALASKA" x={760} y={1060} size={20} />
      </SVG>
    </Frame>
  );
};

// ---- SH12 advises (L16-L17), the signature shot -------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b45 = p.b(45), b36 = p.b(36), b37 = p.b(37), b38 = p.b(38), b39 = p.b(39), b40 = p.b(40);
  const w1 = ease(f, b36, 10), w2 = ease(f, b37, 10), w3 = ease(f, b37 + 12, 10), w4 = ease(f, b38, 10);
  const tilt = 0.16 * Math.sin(f / 7) + 0.1 * Math.sin(f / 11 + 1) + (w1 + w2 - w3 - w4) * 0.12;
  const tray = easeIO(f, b39 - 4, 20);
  const g = easeIO(f, b40, 34);
  const back = ease(f, b39 + 18, 16);
  const walk = clamp01((f + 6) / 30);
  const reach = Math.max(ease(f, b45, 8) * (1 - w1), (w1 - w2 * 0.5) * 0.7, w2 * (1 - w4) * 0.8, w4 * (1 - tray) * 0.6, tray * (1 - back));
  const fx = lerp(120, 280, walk) - back * 50;
  const cam = track([{t: 0, z: 1.08, fx: 540, fy: 1000}, {t: b40, z: 1.04, fx: 540, fy: 980}, {t: p.dur, z: 0.94, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="BY LAW" x={540} y={560} size={36} p={win(f, b45 + 4, b36)} />
        <Plate text="PRIVACY POLICY" x={540} y={560} size={36} p={win(f, b36 + 4, b37)} /> {/* plate-overlap-ok */}
        <Plate text="WHAT USERS COULD LOSE OR GAIN" x={540} y={560} size={32} tone="dark" p={win(f, b37 + 6, b38)} /> {/* plate-overlap-ok */}
        <Plate text="ALTERNATIVES" x={540} y={560} size={36} p={win(f, b38 + 4, b39)} /> {/* plate-overlap-ok */}
        <Plate text="SHE DOESN'T DECIDE THE SALE" x={540} y={560} size={34} tone="dark" p={win(f, b39 + 6, b40)} /> {/* plate-overlap-ok */}
        <Plate text="SALE NEEDS COURT APPROVAL · AFTER A HEARING" displayLines={['SALE NEEDS COURT APPROVAL', 'AFTER A HEARING']} x={540} y={580} size={34} p={win(f, b40 + 10)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1200} seed={6} benchX={240} />
        <path data-band="ok" d="M 220 -100 L 440 -100 L 960 1200 L 600 1200 Z" fill="#FFF0C8" opacity={0.14 + 0.18 * g} />
        <HeldTravel f={f} x={430} y={640} w={440} h={340} mode="shadow" seed={27}>
          <ScalePans x={640} y={910} s={0.7} tilt={tilt} f={f}
            left={<g>{w1 > 0.01 && <g opacity={w1} transform={`translate(-50,${-(1 - w1) * 80}) scale(1.6)`}><Weight label="POLICY" /></g>}{w2 > 0.01 && <g opacity={w2} transform={`translate(40,${-74 - (1 - w2) * 80}) scale(1.6)`}><Weight label="LOSSES?" /></g>}</g>}
            right={<g>{w3 > 0.01 && <g opacity={w3} transform={`translate(-30,${-(1 - w3) * 80}) scale(1.6)`}><Weight label="GAINS?" /></g>}{w4 > 0.01 && <g opacity={w4} transform={`translate(30,${-74 - (1 - w4) * 80}) scale(1.6)`}><Weight label="ALTERNATIVES?" /></g>}</g>} />
        </HeldTravel>
        <g transform="translate(880,1200)">
          <rect x={-100} y={-34} width={200} height={34} rx={4} fill={C.brass} stroke={C.ink} strokeWidth={5} />
          <rect x={-90} y={-30} width={180} height={8} rx={3} fill="#E3C98A" />
        </g>
        <ellipse cx={820} cy={1180} rx={140} ry={20} fill="#000" opacity={0.25 * g} />
        <g transform={`translate(${lerp(fx + 110, 880, tray)},${lerp(1010, 1180, tray)}) rotate(${lerp(-10, 80, tray)})`}>
          <Binder x={0} y={0} s={0.9} />
        </g>
        <Peg x={990} y={700} />
        <LotTag f={f} x={990} y={700} rows={['$10M']} len={40} s={0.8} seed={15} />
        <Suit f={f} x={fx} y={1310} s={1.25} seed={6} cues={[b45, b36, b37, b38, b39, b40]} coat="#3E5A6E" tie={false} longHair walk={walk < 1 ? f : 0} reach={reach} />
        <g transform={`translate(0,${lerp(-600, 0, g)})`}>
          <Gavel x={800} y={560} s={1.3} rot={-6 + Math.sin(f / 30) * 2} />
        </g>
        <Lab text="LUCY L. THOMSON" x={Math.max(150, fx)} y={1310 - 300 * 1.25 - 46} size={22} />
      </SVG>
    </Frame>
  );
};

// ---- SH13 back to the kitchen (L18) -------------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b41 = p.b(41), b42 = p.b(42), b43 = p.b(43);
  const flip = clamp01((f - b42) / 12);
  const turn = ease(f, b43, 14);
  const rise = easeIO(f, b43 + 6, Math.max(20, p.dur - b43 - 6));
  const cam = track([{t: 0, z: 1.06, fx: 560, fy: 1080}, {t: b43, z: 1.02, fx: 560, fy: 1040}, {t: p.dur, z: 1.0, fx: 540, fy: lerp(1040, 960, 1)}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="THE OMBUDSMAN ADVISES" x={540} y={560} size={36} p={win(f, b41 + 4, b42)} />
        <Plate text="COURT DECIDES" x={540} y={560} size={38} tone="dark" p={win(f, b42 + 6, b43)} /> {/* plate-overlap-ok */}
        <Plate text="THE MONEY BEHIND THE BID · NOT PUBLIC SO FAR" displayLines={['THE MONEY BEHIND THE BID', 'NOT PUBLIC SO FAR']} x={540} y={580} size={32} p={win(f, b43 + 8)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <g transform={`translate(0,${rise * 260})`}>
          <KitchenBG f={f} seed={1} winY={180} winH={760} />
          <g transform="translate(940,1080)">
            <rect x={-80} y={-110} width={160} height={180} rx={6} fill="#FBF6EA" stroke={C.ink} strokeWidth={5} />
            <rect x={-80} y={-110} width={160} height={36} rx={6} fill="#8E2E3A" />
            {Array.from({length: 20}).map((_, i) => <rect key={i} x={-66 + (i % 5) * 28} y={-62 + Math.floor(i / 5) * 30} width={18} height={18} fill="#E9E2D2" />)}
            <circle cx={-66 + 0 * 28 + 9} cy={-62 + 3 * 30 + 9} r={16} fill="none" stroke={C.ink} strokeWidth={5} />
          </g>
          <HeldTravel f={f} x={500} y={1160} w={200} h={300} mode="sweep" seed={28}>
            <Phone x={600} y={1300} s={0.7} f={f} glow={0.8 + turn} rot={-8} />
          </HeldTravel>
          <Scrollback f={f} x={400} y={1290} scale={0.8} emotion="wary" cues={[b41, b42, b43]} seed={2} look={-0.3 + turn * 1.2} />
          <LotTag f={f} x={480} y={1110} rows={flip >= 0.5 ? ['COURT DECIDES'] : ['$10M']} sig={flip >= 0.5} flip={flip >= 1 ? 0 : flip} len={30} s={0.8} seed={16} />
          <TableNear f={f} seed={3} />
          <g opacity={turn} transform={`translate(604,1230) rotate(-8) scale(${0.7 + 0.3 * turn})`}>
            <rect x={-56} y={-50} width={112} height={92} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={4} />
            <rect x={-56} y={-50} width={112} height={30} rx={8} fill={C.mustard} stroke={C.ink} strokeWidth={4} />
            <text x={0} y={-28} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>$10M</text>
            <path d="M -40 18 L 40 18" stroke={C.ink} strokeWidth={3} strokeDasharray="8 5" />
          </g>
          <Lab text="DEC 1ST" x={940} y={1110} size={18} />
        </g>
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

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

export const ep1121Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1121Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1121: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 6, 12, 20, 30, 42, 50, 58, 66, 76, 84, 90, 106, 122].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#13241E" ink="#FFF6E3" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
