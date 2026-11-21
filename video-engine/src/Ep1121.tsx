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
import {Scrollback, LotTag, Gavel, Crate, BidPaddle, Curtain, KitchenBG, CourtBG, AU} from './lib/auction';
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
  wall: AU.birch, mustard: AU.mustard, mustardD: AU.mustardD, velvet: AU.velvet, brick: '#9C3F2A', mint: AU.bubble, carpet: '#5B6B7A', desk: '#7C8A96',
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
const Suit: React.FC<{f: number; x: number; y: number; s?: number; seed?: number; cues?: number[]; coat?: string; tag?: string; reach?: number; facing?: 1 | -1; walk?: number}> =
({f, x, y, s = 1, seed = 1, cues = [], coat = '#3A4048', tag, reach = 0, facing = 1, walk = 0}) => {
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
              <path d="M -4 -200 L 4 -200 L 6 -150 L 0 -140 L -6 -150 Z" fill={C.brick} stroke={C.ink} strokeWidth={2} />
              <path d="M -36 -222 Q -48 -190 -44 -110" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.25} strokeLinecap="round" />
              <path d={`M -40 -214 Q ${-64 + pose.armL * 10} -170 ${-52 + pose.armL * 6} -128`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" />
              <path d={`M -40 -214 Q ${-64 + pose.armL * 10} -170 ${-52 + pose.armL * 6} -128`} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
              <path d={`M 40 -214 Q ${70 + reach * 30} ${-190 + reach * 10} ${58 + reach * 70} ${-128 - reach * 70 + pose.armR * 6}`} stroke={C.ink} strokeWidth={22} fill="none" strokeLinecap="round" />
              <path d={`M 40 -214 Q ${70 + reach * 30} ${-190 + reach * 10} ${58 + reach * 70} ${-128 - reach * 70 + pose.armR * 6}`} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
              <circle cx={58 + reach * 70} cy={-128 - reach * 70 + pose.armR * 6} r={11} fill="#C99A78" stroke={C.ink} strokeWidth={3} />
              <g transform={`translate(${pose.headX * 0.4},0) rotate(${pose.headRot} 0 -250)`}>
                <ellipse cx={0} cy={-262} rx={36} ry={42} fill="#C99A78" stroke={C.ink} strokeWidth={5} />
                <ellipse cx={8} cy={-256} rx={20} ry={24} fill="#9A6E52" opacity={0.6} />
                <path d="M -34 -282 Q 0 -312 34 -282 Q 20 -296 0 -298 Q -20 -296 -34 -282 Z" fill="#4A3A30" stroke={C.ink} strokeWidth={3} />
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
/** the near plane of the kitchen table under the caption bar: a mug, a salt shaker, adult mittens and a folded napkin, varied by seed */
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
      <path d="M -100 -56 Q -70 -66 -30 -64" stroke="#B34A58" strokeWidth={6} fill="none" opacity={0.8} />
    </g>
    <g transform={`translate(${560 + seed * 40},${y + 170})`}>
      <ContactShadow cx={0} cy={6} rx={40} ry={7} opacity={0.4} />
      <rect x={-22} y={-74} width={44} height={78} rx={10} fill="#E8E2D6" stroke={C.ink} strokeWidth={5} />
      <rect x={-22} y={-90} width={44} height={22} rx={6} fill="#9AA3AE" stroke={C.ink} strokeWidth={4} />
      {[0, 1, 2].map((i) => <circle key={i} cx={-8 + i * 8} cy={-80} r={2} fill={C.ink} />)}
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

/** the MODEL hopper: a faceless steel funnel with a glow that hums */
const Hopper: React.FC<{f: number; x: number; y: number; glow?: number}> = ({f, x, y, glow = 0}) => (
  <g transform={`translate(${x},${y})`}>
    <ContactShadow cx={0} cy={250} rx={130} ry={14} opacity={0.36} />
    <path d="M -150 -60 L 150 -60 L 60 120 L -60 120 Z" fill="#8B96A2" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -140 -54 L -60 116" stroke="#C9D2DA" strokeWidth={8} opacity={0.7} />
    <path d="M 140 -54 L 60 116" stroke="#5E6874" strokeWidth={10} opacity={0.6} />
    <rect x={-70} y={120} width={140} height={130} rx={10} fill="#6E7884" stroke={C.ink} strokeWidth={7} />
    <rect x={-50} y={150} width={100} height={60} rx={8} fill="#1E2A30" stroke={C.ink} strokeWidth={4} />
    <rect x={-50} y={150} width={100} height={60} rx={8} fill="#9FE0C8" opacity={0.15 + 0.5 * glow * (0.7 + 0.3 * Math.sin(f / 4))} />
    <text x={0} y={190} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill="#E6F4EE">MODEL</text>
    {[0, 1, 2, 3].map((i) => <circle key={i} cx={-40 + i * 26} cy={232} r={5} fill={i / 4 < glow ? '#9FE0C8' : '#3A444C'} stroke={C.ink} strokeWidth={2} />)}
  </g>
);

/** a mustard starburst badge with a number, for the starting bid */
const Burst: React.FC<{x: number; y: number; s?: number; text: string; f: number}> = ({x, y, s = 1, text, f}) => {
  const n = 14;
  const pts = Array.from({length: n * 2}).map((_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 + f / 90;
    const r = i % 2 ? 92 : 130;
    return `${Math.cos(a) * r},${Math.sin(a) * r}`;
  }).join(' ');
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <polygon points={pts} fill={C.mustard} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      <polygon points={pts} fill="#FFF3C0" opacity={0.25} transform="scale(0.8) translate(-8,-8)" />
      <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={66} fill={C.ink}>{text}</text>
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
      {kk >= 0.5 && <path d={`M ${-w / 2} ${-hh / 2 + hh * 0.33} L ${w / 2} ${-hh / 2 + hh * 0.33} M ${-w / 2} ${-hh / 2 + hh * 0.66} L ${w / 2} ${-hh / 2 + hh * 0.66}`} stroke={AU.crateD} strokeWidth={3} opacity={0.7} />}
    </g>
  );
};

/** a long paper runway, the privacy policy unrolled: grows from (x0,y0) to (x1,y1) with ruled lines */
const Runway: React.FC<{f: number; x0: number; y0: number; x1: number; y1: number; t: number}> = ({x0, y0, x1, y1, t}) => {
  const k = clamp01(t);
  const xe = lerp(x0, x1, k), ye = lerp(y0, y1, k);
  const w0 = 150, w1 = 70;
  const we = lerp(w0, w1, k);
  return (
    <g>
      <path d={`M ${x0} ${y0 - w0 / 2} L ${xe} ${ye - we / 2} L ${xe} ${ye + we / 2} L ${x0} ${y0 + w0 / 2} Z`} fill="#FBF6EA" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      {Array.from({length: 18}).map((_, i) => {
        const u = (i + 0.5) / 18;
        if (u > k) return null;
        const xx = lerp(x0, x1, u), yy = lerp(y0, y1, u), ww = lerp(w0, w1, u) * 0.36;
        return <path key={i} d={`M ${xx} ${yy - ww} L ${xx} ${yy + ww}`} stroke={C.ink} strokeWidth={3} opacity={0.28} />;
      })}
      <ellipse cx={xe} cy={ye} rx={22} ry={we / 2} fill="#EDE3CF" stroke={C.ink} strokeWidth={5} />
    </g>
  );
};

/** the giant YES box: a checkbox standing on the floor, checked, with no hand anywhere near it */
const YesBox: React.FC<{x: number; y: number; s?: number; rock?: number}> = ({x, y, s = 1, rock = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rock * 4}) scale(${s})`}>
    <ContactShadow cx={0} cy={6} rx={170} ry={14} opacity={0.4} />
    <rect x={-150} y={-300} width={300} height={300} rx={18} fill="#FBF6EA" stroke={C.ink} strokeWidth={9} />
    <rect x={-150} y={-300} width={300} height={40} rx={14} fill="#FFFFFF" opacity={0.6} />
    <path d="M -90 -150 L -24 -80 L 96 -230" fill="none" stroke={C.ink} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
    <text x={0} y={-12 + 70} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.ink}>YES</text>
  </g>
);

/** the round privacy seal (Thomson's tool), a wax-style disc with a padlock glyph and a question mark */
const Seal: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <circle cx={0} cy={0} r={44} fill="#3E6E62" stroke={C.ink} strokeWidth={5} />
    {Array.from({length: 12}).map((_, i) => <circle key={i} cx={Math.cos(i / 12 * Math.PI * 2) * 44} cy={Math.sin(i / 12 * Math.PI * 2) * 44} r={7} fill="#3E6E62" stroke={C.ink} strokeWidth={3} />)}
    <circle cx={0} cy={0} r={34} fill="#4F8576" />
    <rect x={-14} y={-4} width={28} height={22} rx={4} fill="#F6EEDD" stroke={C.ink} strokeWidth={3} />
    <path d="M -9 -4 Q -9 -18 0 -18 Q 9 -18 9 -4" fill="none" stroke="#F6EEDD" strokeWidth={4} />
    <text x={0} y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill="#F6EEDD">SAFEGUARDS?</text>
  </g>
);

/** a dashed ghost hand: a hypothetical, drawn as an outline only */
const GhostHand: React.FC<{x: number; y: number; s?: number; f: number}> = ({x, y, s = 1, f}) => (
  <g transform={`translate(${x},${y + Math.sin(f / 14) * 8}) scale(${s})`} opacity={0.85}>
    <path d="M -40 120 L -40 10 Q -40 -10 -24 -10 L -24 -70 Q -24 -86 -10 -86 Q 4 -86 4 -70 L 4 -20 L 10 -60 Q 12 -76 26 -74 Q 40 -72 38 -56 L 34 -14 L 44 -46 Q 48 -60 60 -56 Q 72 -52 68 -38 L 56 20 Q 50 70 20 120 Z"
      fill="none" stroke={C.ink} strokeWidth={6} strokeDasharray="16 12" strokeLinejoin="round" />
  </g>
);

const OUTLINE48 = 'M 40 120 L 120 70 L 300 60 L 470 80 L 600 70 L 700 100 L 790 60 L 860 90 L 880 160 L 830 230 L 840 300 L 780 360 L 760 430 L 700 410 L 640 450 L 560 430 L 480 470 L 430 510 L 380 450 L 280 440 L 200 400 L 120 380 L 60 320 L 30 240 Z';

// ---- SH1 the pop (L0) --------------------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b1 = p.b(1), b2 = p.b(2);
  const pop = ease(f, b1 + 6, 16);
  const thunk = ease(f, b2 - 2, 8);
  const sq = -0.45 * Math.sin(clamp01((f - b1 - 6) / 14) * Math.PI) + 0.5 * Math.sin(clamp01((f - b2 + 1) / 10) * Math.PI);
  const cam = track([{t: 0, z: 1.1, fx: 540, fy: 1020}, {t: b2, z: 1.04, fx: 540, fy: 980}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="CHATS IN AN AUCTION LOT" x={540} y={560} size={40} p={win(f, b1 + 10)} />
        <Plate text="AUCTION LOT" x={540} y={650} size={30} tone="dark" p={win(f, b2 + 6)} />
      </g>
    }>
      <SVG>
        <KitchenBG f={f} seed={1} />
        <IdleFigure f={f} x={760} footY={860} h={150} seed={4} cues={[b1, b2]}>
          {() => <Moose x={760} y={860} scale={0.42} f={f} facing={-1} emotion={f > b2 ? 'wary' : 'calm'} alert={thunk} />}
        </IdleFigure>
        <rect data-band="ok" x={-300} y={-100} width={1680} height={2200} fill="#0B1914" opacity={0.7 * (1 - clamp01(f / 10))} />
        <HeldTravel f={f} x={430} y={1150} w={220} h={320} mode="sweep" seed={3}>
          <Phone x={540} y={1300} s={0.7} f={f} glow={1 + pop} rot={-8} />
        </HeldTravel>
        <g opacity={clamp01(pop * 3)} transform={`translate(540,${1290 + (1 - pop) * 160}) scale(${0.4 + 0.6 * pop}) translate(-540,-1290)`}>
          <Scrollback f={f} x={540} y={1290} scale={0.9} emotion={f < b2 ? 'startled' : 'worried'} squash={sq} cues={[b1, b2]} seed={2} look={f > b2 ? 0.6 : 0} />
        </g>
        <g opacity={thunk}>
          <LotTag f={f} x={640} y={1130 - (1 - thunk) * 260} rows={[]} s={1} len={30} seed={2} />
        </g>
        <TableNear f={f} seed={0} />
      </SVG>
    </Frame>
  );
};

// ---- SH2 two voices (L1) ------------------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b3 = p.b(3), b4 = p.b(4);
  const badge = ease(f, b4, 14);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.08, fx: 560, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="CHARACTER.AI · CHAT WITH AI CHARACTERS" displayLines={['CHARACTER.AI', 'CHAT WITH AI CHARACTERS']} x={540} y={580} size={34} p={win(f, b3 + 6, b4)} />
        <Plate text="CHATBOTS POSING AS THERAPISTS · PER THE STATE AGS" displayLines={['CHATBOTS POSING AS THERAPISTS', 'PER THE STATE AGS']} x={540} y={600} size={32} tone="dark" p={win(f, b4 + 8)} />
      </g>
    }>
      <SVG>
        <KitchenBG f={f} seed={2} winX={60} winY={180} winW={960} winH={760} />
        <AppIcon x={250} y={1000} s={0.7} f={f} rot={-6 + Math.sin(f / 18) * 2} />
        <path d="M 300 1000 Q 380 960 420 980" stroke={C.ink} strokeWidth={5} fill="none" strokeDasharray="10 8" opacity={ease(f, b3, 12)} />
        <Scrollback f={f} x={600} y={1300} scale={1.45} emotion={f > b4 ? 'wary' : 'calm'} cues={[b3, b4]} seed={2} count={4} look={f > b4 ? -0.8 : 0.2} />
        <g opacity={badge} transform={`translate(${470},${1300 - 1.45 * (40 + 58 * 2)}) rotate(${-8 + settle(f, b4 + 10, 6)}) scale(${0.6 + 0.4 * badge})`}>
          <rect x={-88} y={-22} width={176} height={44} rx={8} fill="#FBF6EA" stroke={C.ink} strokeWidth={4} />
          <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>THERAPIST?</text>
        </g>
        <LotTag f={f} x={770} y={1180} rows={[]} len={26} seed={3} />
        <TableNear f={f} seed={1} />
      </SVG>
    </Frame>
  );
};

// ---- SH3 bubbles into crates (L2) ---------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b5 = p.b(5), b6 = p.b(6);
  const un = easeIO(f, b5 - 4, 30);
  const labels = ['PRIVATE CHATS', 'VOICE CALLS', 'MENTAL HEALTH'];
  const xs = [470, 690, 910];
  const ride = easeIO(f, b6, 36);
  const glow = ease(f, b6 + 26, 20);
  const cam = track([{t: 0, z: 1.06, fx: 520, fy: 1060}, {t: p.dur, z: 1.0, fx: 560, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="PRIVATE CHATS · VOICE CALLS · MENTAL HEALTH" displayLines={['PRIVATE CHATS · VOICE CALLS', 'MENTAL HEALTH']} x={540} y={560} size={32} p={win(f, b5 + 10, b6)} />
        <Plate text="USED TO TRAIN ITS AI · PER THE AGS" x={540} y={560} size={32} tone="dark" p={win(f, b6 + 8)} />
      </g>
    }>
      <SVG>
        <KitchenBG f={f} seed={3} winX={120} winY={140} winW={840} winH={520} lamp={0.8} />
        <Hopper f={f} x={760} y={770} glow={glow} />
        <path d={`M 690 1140 Q 640 980 700 920`} stroke={C.ink} strokeWidth={34} fill="none" strokeLinecap="round" opacity={ease(f, b6 - 4, 10)} />
        <path d={`M 690 1140 Q 640 980 700 920`} stroke={C.mustardD} strokeWidth={0} fill="none" />
        <path d={`M 690 1140 Q 640 980 700 920`} stroke="#E6E8EE" strokeWidth={22} fill="none" strokeLinecap="round" strokeDasharray="20 14" strokeDashoffset={-f * 2} opacity={ease(f, b6 - 4, 10)} />
        <Scrollback f={f} x={220} y={1290} scale={0.85} emotion={f > b6 ? 'worried' : 'startled'} unspool={un} scarfTo={[700, -60]} cues={[b5, b6]} seed={2} count={3} look={0.8} />
        {xs.map((x, i) => {
          const k = ease(f, b5 + 6 + i * 7, 16);
          const lift = i === 1 ? ride : 0;
          return (
            <g key={i} opacity={clamp01(k * 2)} transform={`translate(${-lift * 20},${-lift * 330 - (1 - k) * 80})`}>
              <SquaringBubble x={x} y={1290} k={k} label={labels[i]} tint={i % 2 ? AU.userTint : AU.aiTint} />
            </g>
          );
        })}
        <LotTag f={f} x={300} y={1100} rows={[]} len={24} seed={4} />
        <TableNear f={f} seed={2} />
      </SVG>
    </Frame>
  );
};

// ---- SH4 the map table (L3-L4) ------------------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b7 = p.b(7), b8 = p.b(8), b9 = p.b(9), b10 = p.b(10);
  const faint = ease(f, b7, 14);
  const flut = ease(f, b8, 18);
  const line = easeIO(f, b9, 40);
  const pin = ease(f, b10, 12);
  const cam = track([{t: 0, z: 1.25, fx: 320, fy: 860}, {t: b9 - 6, z: 1.2, fx: 340, fy: 880}, {t: b9 + 40, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 0.98, fx: 560, fy: 960}]);
  const P0 = {x: 270, y: 1020}, P1 = {x: 900, y: 1060};
  const qx = 590, qy = 760;
  const bez = (t: number) => ({x: (1 - t) * (1 - t) * P0.x + 2 * (1 - t) * t * qx + t * t * P1.x, y: (1 - t) * (1 - t) * P0.y + 2 * (1 - t) * t * qy + t * t * P1.y});
  return (
    <Frame p={p} cam={cam} bg="#8C6A44" overlay={
      <g>
        <Plate text="BANKRUPT · OCTOBER 12TH" x={540} y={560} size={36} p={win(f, b7 + 8, b8)} />
        <Plate text="LEGAL COSTS · NO PROFIT" x={540} y={560} size={34} tone="dark" p={win(f, b8 + 6, b9)} />
        <Plate text="COULD TRANSFER TO A NEW OWNER" x={540} y={560} size={34} p={win(f, b9 + 10, b10)} />
        <Plate text="AUCTION · DECEMBER 1ST" x={540} y={560} size={36} tone="dark" p={win(f, b10 + 6)} />
      </g>
    }>
      <SVG>
        <rect x={-200} y={-200} width={1480} height={2400} fill="#8C6A44" />
        {Array.from({length: 14}).map((_, i) => <path key={i} d={`M -200 ${100 + i * 140} Q 540 ${80 + i * 146} 1280 ${110 + i * 138}`} stroke="#6E5234" strokeWidth={4} opacity={0.5} fill="none" />)}
        <HeldTravel f={f} x={80} y={640} w={940} h={600} mode="shadow" seed={5}>
          <g>
            <rect x={80} y={640} width={940} height={600} rx={10} fill="#E9DFC4" stroke={C.ink} strokeWidth={7} />
            <rect x={96} y={656} width={908} height={568} rx={6} fill="#CFDCE0" />
            <g transform="translate(110,760) scale(0.34)"><path d={AK_PATH} fill="#E8E0C8" stroke={C.ink} strokeWidth={10} /></g>
            <g transform="translate(520,800) scale(0.52)"><path d={OUTLINE48} fill="#E8E0C8" stroke={C.ink} strokeWidth={8} /></g>
          </g>
        </HeldTravel>
        <path d={`M ${P0.x} ${P0.y} Q ${qx} ${qy} ${P1.x} ${P1.y}`} stroke={C.ink} strokeWidth={8} fill="none" strokeDasharray="22 14" pathLength={1}
          style={{strokeDasharray: line > 0.99 ? '0.03 0.02' : `${line} 1`}} />
        <g transform={`translate(${P0.x},${P0.y})`}>
          <circle r={18} fill={C.spruce} stroke={C.ink} strokeWidth={5} />
          <path d="M -14 -30 L 0 -48 L 14 -30 Z M -10 -30 L 10 -30 L 10 -14 L -10 -14 Z" fill="#B39A76" stroke={C.ink} strokeWidth={3} />
        </g>
        <LotTag f={f} x={P0.x - 40} y={P0.y + 30} rows={[]} len={22} s={0.7} seed={5} />
        {[0, 1, 2].map((i) => {
          const t = clamp01(line * 1.05 - i * 0.12);
          if (t <= 0.02) return null;
          const q = bez(t);
          return <Crate key={i} x={q.x} y={q.y + 6} s={0.18} />;
        })}
        <g transform={`translate(${P1.x},${P1.y - pin * 30}) scale(${0.6 + 0.4 * pin})`} opacity={clamp01(line * 3 - 1.5)}>
          <rect x={-46} y={-60} width={92} height={60} fill={C.plaster} stroke={C.ink} strokeWidth={5} />
          <path d="M -56 -60 L 0 -96 L 56 -60 Z" fill={C.walnut} stroke={C.ink} strokeWidth={5} />
          {[-28, -10, 8, 26].map((cx) => <rect key={cx} x={cx - 4} y={-52} width={8} height={48} fill="#CDBFA4" stroke={C.ink} strokeWidth={2} />)}
          <g opacity={pin} transform="translate(56,-120)">
            <rect x={-6} y={0} width={6} height={60} fill={C.ink} />
            <rect x={0} y={0} width={86} height={40} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} />
            <text x={43} y={27} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>DEC 1</text>
          </g>
        </g>
        <g opacity={1 - ease(f, b9 + 10, 20)}>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${200 + i * 36 + flut * Math.sin(i * 2 + f / 9) * 30},${1120 - i * 6 - flut * (40 + i * 22)}) rotate(${-10 + i * 7 + flut * Math.sin(f / 7 + i) * 18})`}>
              <rect x={-60} y={-40} width={120} height={80} fill="#F8F2E2" stroke={C.ink} strokeWidth={4} />
              {i % 2 === 0 && flut > 0.2 && <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.brick}>LEGAL COSTS</text>}
            </g>
          ))}
          <AppIcon x={360 - faint * 30} y={1080 + faint * 30} s={0.6} rot={faint * 78} dizzy={faint} f={f} />
        </g>
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
  const b11 = p.b(11), b12 = p.b(12), b13 = p.b(13), b14 = p.b(14);
  const burst = ease(f, b11, 10);
  const last = ease(f, b12 - 6, 10);
  const walk = clamp01((f - b13 + 4) / (p.dur - b13 + 4));
  const stamp = ease(f, b14, 8);
  const duck = ease(f, b11 + 2, 10) * (1 - ease(f, b13, 30));
  const cam = track([{t: 0, z: 1.04, fx: 540, fy: 1000}, {t: p.dur, z: 1.0, fx: 520, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="$10M STARTING BID · APP · MODELS · ACCOUNTS · CHATS" displayLines={['$10M STARTING BID', 'APP · MODELS · ACCOUNTS · CHATS']} x={540} y={580} size={32} p={win(f, b11 + 8, b12)} />
        <Plate text="ACCOUNTS · CHAT CONTENT" x={540} y={560} size={32} p={win(f, b12 + 4, b13)} />
        <Plate text="DISNEY · $20M · TECH LICENSE · NOT THE CHATS" displayLines={['DISNEY · $20M · TECH LICENSE', 'NOT THE CHATS']} x={540} y={580} size={32} tone="dark" p={win(f, b13 + 8)} />
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1150} seed={1} rail={true} />
        <HeldTravel f={f} x={150} y={900} w={780} h={260} mode="shadow" seed={6}>
          <g>
            <rect x={150} y={1060} width={780} height={90} rx={10} fill={C.walnut} stroke={C.ink} strokeWidth={7} />
            <rect x={150} y={1060} width={780} height={22} rx={8} fill={C.walnutL} />
            <Crate x={300} y={1060} s={0.62} label="PRIVATE CHATS" />
            <Crate x={470} y={1060} s={0.62} label="VOICE CALLS" />
            <Crate x={385} y={955} s={0.62} label="MENTAL HEALTH" />
            <g transform={`translate(0,${-(1 - last) * 90})`} opacity={last}><Crate x={640} y={1060} s={0.62} label="ACCOUNTS" /></g>
            <g transform="translate(800,1060)">
              <rect x={-70} y={-120} width={140} height={120} rx={8} fill="#8B96A2" stroke={C.ink} strokeWidth={6} />
              <text x={0} y={-52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill="#F1F4F6">MODELS</text>
            </g>
            <g transform="translate(640,920)"><AppIcon x={0} y={0} s={0.42} f={f} /></g>
          </g>
        </HeldTravel>
        <g transform={`translate(0,${duck * 40})`}>
          <Scrollback f={f} x={560} y={1140} scale={0.55} emotion={duck > 0.3 ? 'startled' : 'worried'} cues={[b11, b12, b13]} seed={2} count={3} look={walk > 0.1 ? 1 : 0} shadow={false} />
        </g>
        <LotTag f={f} x={210} y={880} rows={burst > 0.5 ? ['$10M'] : []} len={40} seed={6} />
        <g opacity={burst} transform={`translate(280,${770 - (1 - burst) * 140}) rotate(${-8 + settle(f, b11 + 10, 6)})`}>
          <Burst x={0} y={0} s={0.62 + 0.1 * Math.sin(clamp01((f - b11) / 10) * Math.PI)} text="$10M" f={f} />
        </g>
        <GreyCrate f={f} x={lerp(1260, -200, walk)} y={1290} s={0.75} walk={f} />
        <g opacity={stamp} transform={`translate(${lerp(1260, -200, walk) - 10},1150) rotate(-10) scale(${1.4 - 0.4 * stamp})`}>
          <rect x={-120} y={-28} width={240} height={56} rx={6} fill="none" stroke={C.brick} strokeWidth={7} />
          <text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.brick}>NOT THE CHATS</text>
        </g>
      </SVG>
    </Frame>
  );
};

// ---- SH6 forty desks (L7-L8) --------------------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b15 = p.b(15), b16 = p.b(16);
  const flag = ease(f, b15, 16);
  const cam = track([{t: 0, z: 1.14, fx: 300, fy: 1100}, {t: b16, z: 1.06, fx: 420, fy: 1020}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  const rows = 5, cols = 8;
  const NY = {r: 2, c: 5};
  return (
    <Frame p={p} cam={cam} bg="#D8CCB4" overlay={
      <g>
        <Plate text="ALASKA JOINED · BIPARTISAN AG COALITION" displayLines={['ALASKA JOINED', 'BIPARTISAN AG COALITION']} x={540} y={580} size={34} p={win(f, b15 + 8, b16)} />
        <Plate text="40 ATTORNEYS GENERAL · NEW YORK LED" displayLines={['40 ATTORNEYS GENERAL', 'NEW YORK LED']} x={540} y={580} size={34} tone="dark" p={win(f, b16 + 8)} />
      </g>
    }>
      <SVG>
        <rect x={-200} y={-200} width={1480} height={2400} fill="#D8CCB4" />
        <rect x={-200} y={-200} width={1480} height={780} fill="#E6DCC6" />
        {Array.from({length: 9}).map((_, i) => <rect key={i} x={-120 + i * 160} y={120} width={110} height={300} rx={50} fill="#B9CCD8" stroke={C.walnut} strokeWidth={10} />)}
        <g transform="translate(830,470)">
          <rect x={-120} y={-80} width={240} height={150} rx={8} fill="#B07A48" stroke={C.ink} strokeWidth={6} />
          <rect x={-104} y={-64} width={208} height={118} fill="#C8925C" />
          <LotTag f={f} x={0} y={-60} rows={['$10M']} len={18} s={0.7} seed={7} />
        </g>
        <rect x={-200} y={580} width={1480} height={1400} fill="#7A6A58" />
        {Array.from({length: rows}).map((_, r) => Array.from({length: cols}).map((__, c) => {
          const depth = r / (rows - 1);
          const s = lerp(0.42, 0.95, depth);
          const x = 540 + (c - (cols - 1) / 2) * lerp(118, 230, depth);
          const y = lerp(720, 1360, depth);
          const d = Math.hypot(r - NY.r, c - NY.c);
          const on = ease(f, b16 + d * 4, 8);
          const isAK = r === rows - 1 && c === 0;
          return (
            <g key={`${r}-${c}`} transform={`translate(${x},${y}) scale(${s})`}>
              <ContactShadow cx={0} cy={4} rx={90} ry={10} opacity={0.35} />
              <rect x={-80} y={-70} width={160} height={70} rx={6} fill={C.desk} stroke={C.ink} strokeWidth={6} />
              <rect x={-80} y={-70} width={160} height={16} rx={5} fill="#A3B0BB" />
              <path d={`M 40 -70 L 40 -120 L 60 -136`} stroke={C.ink} strokeWidth={6} fill="none" />
              <path d="M 44 -150 L 86 -142 L 70 -118 Z" fill={on > 0.5 ? '#FFE3A8' : '#5E6874'} stroke={C.ink} strokeWidth={4} />
              {on > 0.5 && <ellipse cx={60} cy={-66} rx={60} ry={14} fill="#FFE3A8" opacity={0.4 * on} />}
              <g transform={`translate(-50,${-70 - (isAK ? flag * 60 : 40)})`}>
                <rect x={-3} y={0} width={6} height={isAK ? 40 + flag * 60 : 40} fill={C.ink} />
                <rect x={3} y={0} width={56} height={36} fill={isAK ? '#1F3A6E' : ['#9C3F2A', '#3E6E62', '#C9A04A', '#5B6B7A', '#8E2E3A'][(r * cols + c) % 5]} stroke={C.ink} strokeWidth={3} />
                {isAK && [[12, 26], [20, 22], [28, 24], [34, 18], [40, 14], [48, 16], [50, 26], [46, 8]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r={i === 7 ? 3.5 : 2.4} fill="#E0B54A" />)}
              </g>
              {(r === NY.r && c === NY.c) && on > 0.3 && <rect x={-60} y={-40} width={120} height={28} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />}
              {(r === NY.r && c === NY.c) && on > 0.3 && <text x={0} y={-20} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>NEW YORK</text>}
              {isAK && <rect x={-56} y={-44} width={112} height={28} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />}
              {isAK && <text x={0} y={-24} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>ALASKA</text>}
            </g>
          );
        }))}
        <rect x={-200} y={1480} width={1480} height={500} fill="#6A5A48" />
        {Array.from({length: 7}).map((_, i) => <rect key={i} x={-120 + i * 190} y={1520} width={150} height={60} rx={8} fill={C.walnut} stroke={C.ink} strokeWidth={5} />)}
      </SVG>
    </Frame>
  );
};

// ---- SH7 the order (L9-L10) ---------------------------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b17 = p.b(17), b18 = p.b(18), b19 = p.b(19);
  const card = ease(f, b17 + 4, 14);
  const walk = clamp01((f - b18 + 10) / 50);
  const cam = track([{t: 0, z: 1.12, fx: 640, fy: 940}, {t: b18, z: 1.05, fx: 580, fy: 980}, {t: p.dur, z: 1.0, fx: 540, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="COURT ORDERS A PRIVACY OMBUDSMAN" displayLines={['COURT ORDERS A PRIVACY OMBUDSMAN', "PER ALASKA'S DEPARTMENT OF LAW"]} x={540} y={580} size={32} p={win(f, b17 + 8, b18)} />
        <Plate text="OMBUDSMAN · LUCY L. THOMSON" x={540} y={560} size={34} tone="dark" p={win(f, b18 + 10, b19)} />
        <Plate text="NAMED BY THE U.S. TRUSTEE" x={540} y={560} size={34} p={win(f, b19 + 6)} />
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1200} seed={2} benchX={600} />
        <StrikeProp f={f} at={b17} px={760} py={900}>
          <Gavel x={760} y={900} s={0.8} rot={-12} />
        </StrikeProp>
        <rect x={640} y={890} width={260} height={14} rx={4} fill="#3A2A1E" opacity={0.5} />
        <g opacity={card} transform={`translate(${560 - (1 - card) * 60},${880})`}>
          <rect x={-130} y={-34} width={260} height={68} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>COURT ORDERS</text>
        </g>
        <g transform="translate(950,1200)">
          <Crate x={0} y={0} s={0.5} label="CHATS" />
          <LotTag f={f} x={-40} y={-86} rows={['$10M']} len={20} s={0.75} seed={8} />
        </g>
        <Suit f={f} x={lerp(-60, 330, walk)} y={1440} s={0.9} seed={5} cues={[b18, b19]} coat="#3E5A6E" walk={walk < 1 ? f : 0} reach={ease(f, b19, 10) * 0.4} />
        <g transform={`translate(${lerp(-60, 330, walk) + 70},${1250})`}>
          <rect x={-34} y={-46} width={68} height={92} rx={6} fill="#2E4A5E" stroke={C.ink} strokeWidth={5} />
          <rect x={-26} y={-38} width={52} height={20} rx={3} fill={C.paper} />
        </g>
        <Lab text="LUCY L. THOMSON" x={lerp(-60, 330, walk)} y={1440 - 300 * 0.9 - 40} size={20} />
      </SVG>
    </Frame>
  );
};

// ---- SH8 the empty scale (L11) ------------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b20 = p.b(20), b21 = p.b(21);
  const set = ease(f, b20, 14);
  const press = ease(f, b21 - 6, 8);
  const sealOn = f >= b21;
  const cam = track([{t: 0, z: 1.02, fx: 560, fy: 1000}, {t: p.dur, z: 1.08, fx: 620, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="REVIEWS THE SALE · RECOMMENDS SAFEGUARDS" displayLines={['REVIEWS THE SALE', 'RECOMMENDS SAFEGUARDS']} x={540} y={580} size={34} p={win(f, b20 + 8, b21)} />
        <Plate text="RECOMMENDS SAFEGUARDS TO THE COURT" x={540} y={560} size={32} tone="dark" p={win(f, b21 + 6)} />
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1220} seed={3} benchX={560} />
        <g transform={`translate(0,${-(1 - set) * 60})`} opacity={clamp01(set * 2)}>
          <ScalePans x={620} y={918} s={0.5} tilt={Math.sin(f / 9) * 0.08 * (1 - set * 0.5)} f={f} />
        </g>
        <Suit f={f} x={250} y={1460} s={0.95} seed={6} cues={[b20, b21]} coat="#3E5A6E" reach={Math.max(set * (1 - ease(f, b20 + 20, 14)), press) * 0.8} />
        <Lab text="LUCY L. THOMSON" x={250} y={1460 - 300 * 0.95 - 40} size={20} />
        <Scrollback f={f} x={880} y={1460} scale={0.62} emotion={sealOn ? 'hopeful' : 'wary'} cues={[b20, b21]} seed={2} count={4} look={-0.8} />
        <LotTag f={f} x={790} y={1290} rows={['$10M']} len={24} s={0.8} seed={9} />
        <g opacity={press} transform={`translate(${lerp(420, 800, press)},${lerp(1150, 1365, press)}) scale(${sealOn ? 1 : 1.2})`}>
          <Seal x={0} y={0} s={0.8} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- SH9 behind the curtain (L12-L13) -----------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b22 = p.b(22), b23 = p.b(23), b24 = p.b(24);
  const part = easeIO(f, b22, 30);
  const flip = clamp01((f - b23) / 12);
  const tuck = ease(f, b24, 24);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.1, fx: 540, fy: 940}]);
  return (
    <Frame p={p} cam={cam} bloom={0.08} overlay={
      <g>
        <Plate text="WHO MADE THE $10M BID?" x={540} y={560} size={36} p={win(f, b22 + 8, b23)} />
        <Plate text="FORMED NOV 13 · BID FILED NOV 14 · BACKER NOT PUBLIC" displayLines={['FORMED NOV 13 · BID FILED NOV 14']} x={540} y={560} size={32} tone="dark" p={win(f, b23 + 8, b24)} />
        <Plate text="BACKER NOT PUBLIC" x={540} y={560} size={36} p={win(f, b24 + 6)} />
      </g>
    }>
      <SVG>
        <rect x={-200} y={-200} width={1480} height={2400} fill="#3A2A1E" />
        <rect x={-200} y={1240} width={1480} height={800} fill={C.walnut} />
        {Array.from({length: 9}).map((_, i) => <path key={i} d={`M -200 ${1270 + i * 70} L 1280 ${1260 + i * 72}`} stroke="#4A3424" strokeWidth={5} opacity={0.6} />)}
        <ellipse cx={540} cy={1240} rx={360} ry={46} fill="#FFE3A8" opacity={0.28 * part} />
        <g transform="translate(540,1240)">
          <ContactShadow cx={0} cy={2} rx={110} ry={14} opacity={0.45} />
          <rect x={-60} y={-24} width={120} height={24} rx={6} fill={C.walnutD} stroke={C.ink} strokeWidth={5} />
          <HeldProp f={f} px={0} py={0} w={200} h={340} kind="rest" seed={11}>
            <BidPaddle x={0} y={-20} s={0.95} />
          </HeldProp>
          <g transform="translate(0,-60)">
            <rect x={-110} y={-30} width={220} height={60} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
            <path d="M -86 10 L 86 10" stroke={C.ink} strokeWidth={3} strokeDasharray="10 6" />
          </g>
        </g>
        <Curtain f={f} x={120} y={300} w={840} h={1000} part={part} />
        <LotTag f={f} x={900} y={860} rows={flip >= 0.5 ? ['FORMED NOV 13', 'BID FILED NOV 14'] : ['$10M']} flip={flip >= 1 ? 0 : flip} len={40} s={0.9} seed={10} />
        <Scrollback f={f} x={170} y={1500} scale={0.55} emotion={f > b24 ? 'wary' : 'worried'} unspool={1 - tuck} scarfTo={[300, -30]} cues={[b22, b23, b24]} seed={2} count={3} look={0.8} />
      </SVG>
    </Frame>
  );
};

// ---- SH10 the fine print (L14) ------------------------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b25 = p.b(25), b26 = p.b(26);
  const roll = easeIO(f, b25, Math.max(20, b26 - b25));
  const rock = settle(f, b26, 1, 30);
  const cam = track([{t: 0, z: 1.08, fx: 400, fy: 1080}, {t: p.dur, z: 1.0, fx: 600, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="THE COMPANY'S SIDE" x={540} y={560} size={36} p={win(f, b25 + 6, b26)} />
        <Plate text={'"POLICY ALREADY PERMITTED THE SALE" · PER THE COMPANY'} displayLines={['"POLICY ALREADY PERMITTED THE SALE"', 'PER THE COMPANY']} x={540} y={580} size={30} tone="dark" p={win(f, b26 + 6)} />
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1060} seed={4} benchX={620} />
        <Runway f={f} x0={300} y0={1360} x1={830} y1={1180} t={roll} />
        <YesBox x={880} y={1220} s={0.72} rock={rock} />
        <g transform="translate(860,980)">
          <Crate x={0} y={0} s={0.42} label="CHATS" />
          <LotTag f={f} x={-30} y={-72} rows={['FORMED NOV 13', 'BID FILED NOV 14']} len={14} s={0.6} seed={12} />
        </g>
        <Suit f={f} x={220} y={1440} s={0.9} seed={7} cues={[b25, b26]} coat="#4A4048" reach={0.3 + 0.3 * roll} />
        <Lab text="COMPANY LAWYER" x={220} y={1440 - 300 * 0.9 - 40} size={20} />
      </SVG>
    </Frame>
  );
};

// ---- SH11 the latch (L15) -----------------------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b27 = p.b(27);
  const ghost = ease(f, b27 + 6, 18);
  const rat = Math.sin(f / 2.4) * 3 * ease(f, b27, 10);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.07, fx: 520, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="LIMITS ON MINORS · VOLUNTARY · COULD BE REVERSED" displayLines={['LIMITS ON MINORS · VOLUNTARY', 'COULD BE REVERSED', "PER ALASKA'S DEPARTMENT OF LAW"]} x={540} y={600} size={30} p={win(f, b27 + 8)} />
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1500} seed={5} rail={false} benchX={540} />
        <HeldTravel f={f} x={200} y={760} w={680} h={560} mode="shadow" seed={13}>
          <Crate x={540} y={1330} s={2.6} />
        </HeldTravel>
        <g transform={`translate(${540 + rat},1050)`}>
          <rect x={-90} y={-50} width={180} height={100} rx={12} fill="#B89A6A" stroke={C.ink} strokeWidth={7} />
          <rect x={-70} y={-30} width={140} height={20} rx={6} fill="#D8C08E" />
          <circle cx={0} cy={18} r={14} fill={C.ink} />
          <path d="M -60 -50 Q -60 -110 0 -110 Q 60 -110 60 -50" fill="none" stroke="#8C7A5C" strokeWidth={16} />
          <path d="M -60 -50 Q -60 -110 0 -110 Q 60 -110 60 -50" fill="none" stroke={C.ink} strokeWidth={4} />
        </g>
        <g transform="translate(540,1200) rotate(-3)">
          <rect x={-170} y={-26} width={340} height={52} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>LIMITS ON MINORS</text>
        </g>
        <g opacity={ghost}>
          <GhostHand x={760} y={880} s={1.1} f={f} />
          <Lab text="IF A BUYER CHOSE" x={800} y={1160} size={20} />
        </g>
        <LotTag f={f} x={260} y={900} rows={['FORMED NOV 13', 'BID FILED NOV 14']} len={30} s={0.7} seed={14} />
      </SVG>
    </Frame>
  );
};

// ---- SH12 advises, decides (L16-L17), the signature shot ----------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b28 = p.b(28), b29 = p.b(29), b30 = p.b(30);
  const drop = ease(f, b28, 12);
  const tilt = settle(f, b28 + 10, 0.5, 40);
  const slideR = easeIO(f, b29 - 4, 20);
  const g = easeIO(f, b30, 34);
  const flip = clamp01((f - b29) / 12);
  const cam = track([{t: 0, z: 1.08, fx: 560, fy: 1040}, {t: b30, z: 1.04, fx: 560, fy: 1000}, {t: p.dur, z: 0.98, fx: 540, fy: 950}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="PRIVACY POLICY · LOSSES OR GAINS · ALTERNATIVES" displayLines={['PRIVACY POLICY · LOSSES OR GAINS', 'ALTERNATIVES']} x={540} y={600} size={30} p={win(f, b28 + 8, b29)} />
        <Plate text="THE OMBUDSMAN ADVISES" x={540} y={600} size={34} tone="dark" p={win(f, b29 + 6, b30)} />
        <Plate text="SALE NEEDS COURT APPROVAL" x={540} y={600} size={36} p={win(f, b30 + 10)} />
      </g>
    }>
      <SVG>
        <CourtBG f={f} benchY={1240} seed={6} benchX={560} />
        <path d={`M 120 ${-100} L 330 ${-100} L 900 1240 L 520 1240 Z`} fill="#FFF0C8" opacity={0.18 + 0.2 * g} />
        <ScalePans x={640} y={940} s={0.5} tilt={tilt} f={f}
          left={<g opacity={drop} transform={`translate(0,${-(1 - drop) * 200})`}><rect x={-60} y={-60} width={120} height={56} rx={8} fill="#8B96A2" stroke={C.ink} strokeWidth={6} /><text x={0} y={-22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.paper}>LOSSES?</text></g>}
          right={<g opacity={drop} transform={`translate(0,${-(1 - drop) * 240})`}><rect x={-60} y={-60} width={120} height={56} rx={8} fill="#8B96A2" stroke={C.ink} strokeWidth={6} /><text x={0} y={-22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.paper}>GAINS?</text></g>} />
        <LotTag f={f} x={900} y={760} rows={flip >= 0.5 ? ['UNDER REVIEW'] : ['FORMED NOV 13', 'BID FILED NOV 14']} flip={flip >= 1 ? 0 : flip} len={30} s={0.8} seed={15} />
        <Suit f={f} x={250} y={1470} s={0.95} seed={6} cues={[b28, b29, b30]} coat="#3E5A6E" reach={0.3 + 0.5 * slideR} />
        <Lab text="LUCY L. THOMSON" x={250} y={1470 - 300 * 0.95 - 40} size={20} />
        <g transform={`translate(${lerp(330, 430, slideR)},${lerp(1100, 990, slideR)}) rotate(${-6 + 6 * slideR})`}>
          <rect x={-60} y={-40} width={120} height={80} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          {[0, 1, 2].map((i) => <rect key={i} x={-44} y={-24 + i * 16} width={88 - i * 14} height={6} rx={3} fill={C.ink} opacity={0.3} />)}
          <text x={0} y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.ink}>REPORT</text>
        </g>
        <g transform={`translate(0,${lerp(-500, 0, g)})`}>
          <Gavel x={640} y={600} s={1.25} rot={-6 + Math.sin(f / 30) * 2} />
          <rect data-band="ok" x={520} y={430} width={250} height={60} fill="#000" opacity={0.18} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- SH13 back to the kitchen (L18) -------------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b31 = p.b(31), b32 = p.b(32), b33 = p.b(33);
  const flip = clamp01((f - b32) / 12);
  const out = easeIO(f, b33 - 10, 40);
  const cam = track([{t: 0, z: 1.02, fx: 560, fy: 1000}, {t: b33 - 10, z: 1.0, fx: 560, fy: 980}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="THE OMBUDSMAN ADVISES · THE COURT DECIDES" displayLines={['THE OMBUDSMAN ADVISES', 'THE COURT DECIDES']} x={540} y={580} size={34} p={win(f, b31 + 6, b32)} />
        <Plate text="COURT DECIDES" x={540} y={560} size={38} tone="dark" p={win(f, b32 + 6, b33)} />
        <Plate text="MONEY BEHIND THE BID · NOT PUBLIC" x={540} y={560} size={32} p={win(f, b33 + 12)} />
      </g>
    }>
      <SVG>
        <g opacity={1 - out} transform={`translate(540,960) scale(${1 - 0.55 * out}) translate(-540,-960)`}>
          <CourtBG f={f} benchY={1240} seed={7} benchX={560} />
          <ScalePans x={640} y={940} s={0.5} tilt={0} f={f} />
          <Gavel x={640} y={600} s={1.25} rot={-6} />
          <Suit f={f} x={250} y={1470} s={0.95} seed={6} cues={[b31, b32]} coat="#3E5A6E" />
          <g transform="translate(250,1080)"><rect x={-110} y={-24} width={220} height={48} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>ADVISES</text></g>
          <g transform="translate(640,430)"><rect x={-110} y={-24} width={220} height={48} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>DECIDES</text></g>
        </g>
        <g opacity={out}>
          <KitchenBG f={f} seed={1} />
          <Phone x={540} y={1300} s={0.7} f={f} glow={0.8} rot={-8} />
          <Scrollback f={f} x={400} y={1290} scale={0.8} emotion="wary" cues={[b33]} seed={2} look={0.5} />
          <TableNear f={f} seed={3} />
        </g>
        <LotTag f={f} x={lerp(900, 500, out)} y={lerp(800, 1110, out)} rows={flip >= 0.5 ? ['COURT DECIDES'] : ['UNDER REVIEW']} sig={flip >= 0.5} flip={flip >= 1 ? 0 : flip} len={30} s={lerp(0.9, 0.8, out)} seed={16} />
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
