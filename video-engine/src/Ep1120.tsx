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
import {IdleFigure, FigureFinish} from './lib/figureidle';
import {Bub, GlassCase, Paddle, LicenseCrate, AuctionHall, Turntable, AuctionHammer, LOT} from './lib/lot';
import {AK_PATH} from './lib/akmap';
import {StrikeProp} from './lib/figureidle';
import {IDS} from './Ep1120Ids';

// Lot 2, 2026-11-20. Palette roles are art_direction.json: honey timber and walnut, claret velvet, gilt bronze, a steel violet rain
// window onto Mount Juneau, cream Bub in frosted glass, aubergine corners, and referee marigold ONLY on the ombudsman, its loupe, its
// folder and the dashed safeguard latches. Bub is the only face. No verdict anywhere: no SOLD, no tick, no gavel strike.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;

export const C = {
  wall: LOT.walnut, paper: '#FFF8EA', ink: '#101423', cream: LOT.cream, claret: LOT.claret, bronze: LOT.bronze, marigold: LOT.marigold,
  aub: LOT.aubergine, dusk: LOT.dusk, timber: LOT.timber, walnut: LOT.walnut, slate: LOT.slate, glass: LOT.glass,
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
  dark: {fill: '#2B1B2E', fg: '#FFF8EA', edge: '#FFF8EA'},
  cyan: {fill: '#3A2A0A', fg: '#FFE7A8', edge: '#F2B632'},
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
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#2B1B2E" stroke="#FFF8EA" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#FFF8EA">{CHIP}</text>
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

/** a faceless figure in a suit (no face: a smooth head with a shadowed hollow), with idle life, lit like the props */
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
              <path d="M -4 -200 L 4 -200 L 6 -150 L 0 -140 L -6 -150 Z" fill={LOT.claret} stroke={C.ink} strokeWidth={2} />
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


// ---- shared set pieces -----------------------------------------------------------------------------------------------------------------------------
/** nickel stanchions with a sagging claret rope in the near plane, under the caption band, with per-shot floor props */
const NearRope: React.FC<{f: number; y?: number; seed?: number; props?: 'paddles' | 'truck' | 'catalogs' | 'none'}> = ({f, y = 1640, seed = 0, props = 'paddles'}) => (
  <g data-band="ok">
    <rect x={-80} y={y - 40} width={1240} height={500} fill={LOT.walnut} opacity={0.35} data-band="ok" />
    {[-40, 360, 760, 1160].map((x, i) => (
      <g key={i} transform={`translate(${x + h01(i, seed) * 30},${y})`}>
        <ContactShadow cx={0} cy={150} rx={60} ry={10} opacity={0.45} />
        <rect x={-10} y={-40} width={20} height={190} rx={8} fill={LOT.bronze} stroke={C.ink} strokeWidth={4} />
        <circle cx={0} cy={-46} r={18} fill={LOT.bronzeL} stroke={C.ink} strokeWidth={4} />
        <ellipse cx={0} cy={150} rx={44} ry={12} fill={LOT.bronzeD} stroke={C.ink} strokeWidth={4} />
      </g>
    ))}
    {[0, 1, 2].map((i) => {
      const x0 = -40 + i * 400, x1 = x0 + 400;
      const sag = 70 + 6 * Math.sin(f / 30 + i + seed);
      return (
        <g key={i}>
          <path d={`M ${x0} ${y - 30} Q ${(x0 + x1) / 2} ${y - 30 + sag} ${x1} ${y - 30}`} stroke={C.ink} strokeWidth={22} fill="none" />
          <path d={`M ${x0} ${y - 30} Q ${(x0 + x1) / 2} ${y - 30 + sag} ${x1} ${y - 30}`} stroke={LOT.claret} strokeWidth={14} fill="none" />
          <path d={`M ${x0 + 20} ${y - 34} Q ${(x0 + x1) / 2} ${y - 34 + sag} ${x1 - 20} ${y - 34}`} stroke={LOT.claretL} strokeWidth={3} fill="none" opacity={0.7} />
        </g>
      );
    })}
    {props === 'paddles' && [0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${180 + i * 330},${y + 170}) rotate(${-14 + i * 12 + Math.sin(f / 40 + i) * 2})`}>
        <rect x={-60} y={-90} width={120} height={90} rx={10} fill={LOT.card} stroke={C.ink} strokeWidth={4} />
        <text x={0} y={-30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} fill={C.ink}>{[17, 42, 8][i]}</text>
        <rect x={-8} y={0} width={16} height={80} fill={LOT.walnut} stroke={C.ink} strokeWidth={3} />
      </g>
    ))}
    {props === 'catalogs' && [0, 1, 2, 3].map((i) => (
      <rect key={i} x={140 + i * 6} y={y + 140 - i * 22} width={220} height={22} rx={3} fill={i % 2 ? LOT.card : LOT.birch} stroke={C.ink} strokeWidth={3} />
    ))}
    {props === 'truck' && (
      <g transform={`translate(860,${y + 150}) rotate(-8)`}>
        <rect x={-10} y={-200} width={20} height={200} fill={LOT.sleeve} stroke={C.ink} strokeWidth={4} />
        <rect x={-70} y={-20} width={120} height={20} fill={LOT.sleeve} stroke={C.ink} strokeWidth={4} />
        <circle cx={-50} cy={10} r={22} fill={C.ink} /><circle cx={-50} cy={10} r={10} fill={LOT.bronze} />
      </g>
    )}
  </g>
);

/** the empty tall referee's chair, with or without its closed marigold folder on the seat */
const RefChair: React.FC<{f: number; x: number; y: number; s?: number; folder?: number}> = ({f, x, y, s = 1, folder = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={4} rx={110} ry={12} opacity={0.45} />
    {[-60, 60].map((dx, i) => <rect key={i} x={dx - 8} y={-240} width={16} height={240} fill={LOT.walnut} stroke={C.ink} strokeWidth={4} />)}
    <rect x={-80} y={-250} width={160} height={24} rx={4} fill={LOT.timber} stroke={C.ink} strokeWidth={4} />
    <rect x={-70} y={-470} width={140} height={220} rx={10} fill={LOT.claret} stroke={C.ink} strokeWidth={5} />
    <rect x={-58} y={-458} width={20} height={196} fill={LOT.claretL} opacity={0.5} />
    {[-60, 60].map((dx, i) => <rect key={i} x={dx - 8} y={-480} width={16} height={240} fill={LOT.walnut} stroke={C.ink} strokeWidth={4} />)}
    <rect x={-50} y={-130} width={100} height={12} fill={LOT.walnut} stroke={C.ink} strokeWidth={3} />
    {folder > 0.01 && (
      <g opacity={clamp01(folder)} transform={`translate(0,${-262 + Math.sin(f / 20) * 1.5}) rotate(-4)`}>
        <rect x={-58} y={-14} width={116} height={20} rx={3} fill={LOT.marigold} stroke={C.ink} strokeWidth={3} />
        <rect x={-58} y={-18} width={40} height={8} rx={2} fill={LOT.marigoldD} stroke={C.ink} strokeWidth={2} />
      </g>
    )}
  </g>
);

/** a projected chat bubble with a little character face, glowing on the velvet interior */
const CharFace: React.FC<{f: number; x: number; y: number; kind: number; pop: number; dim: number; s?: number}> = ({f, x, y, kind, pop, dim, s = 1}) => {
  const k = clamp01(pop);
  if (k <= 0.01) return null;
  const hue = ['#E07A5F', '#C9CFC0', '#F2CC8F', '#B98AA8'][kind % 4];
  const bob = Math.sin(f / 9 + kind) * 3;
  return (
    <g transform={`translate(${x},${y + bob + (1 - k) * 40}) scale(${s * (0.6 + 0.4 * k)})`} opacity={k * (1 - clamp01(dim) * 0.6)}>
      <path d="M -150 -50 Q -150 -80 -120 -80 L 150 -80 Q 180 -80 180 -50 L 180 30 Q 180 60 150 60 L -90 60 L -130 90 L -120 60 Q -150 60 -150 30 Z" fill={LOT.cream} stroke={C.ink} strokeWidth={5} opacity={0.92} />
      <circle cx={-90} cy={-10} r={44} fill={hue} stroke={C.ink} strokeWidth={4} />
      <circle cx={-104} cy={-16} r={5} fill={C.ink} /><circle cx={-76} cy={-16} r={5} fill={C.ink} />
      <path d="M -104 6 Q -90 16 -76 6" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      {kind === 0 && <path d="M -130 -40 L -90 -110 L -50 -40 Z" fill={LOT.claretD} stroke={C.ink} strokeWidth={4} />}
      {kind === 1 && <path d="M -126 -44 L -116 -70 L -104 -48 M -76 -48 L -64 -70 L -54 -44" fill={hue} stroke={C.ink} strokeWidth={4} />}
      {kind === 2 && <rect x={-128} y={-62} width={76} height={20} rx={4} fill={LOT.bronze} stroke={C.ink} strokeWidth={4} />}
      {[0, 1, 2].map((i) => <rect key={i} x={-20} y={-36 + i * 26} width={[150, 120, 90][i]} height={12} rx={6} fill={LOT.claretL} opacity={0.55} />)}
    </g>
  );
};

/** a lectern, origin = floor centre */
const Lectern: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={4} rx={110} ry={12} opacity={0.45} />
    <path d="M -80 0 L -60 -260 L 60 -260 L 80 0 Z" fill={LOT.walnut} stroke={C.ink} strokeWidth={5} />
    <path d="M -70 -10 L -52 -250" stroke={LOT.timberL} strokeWidth={5} opacity={0.5} />
    <path d="M -100 -290 L 100 -290 L 70 -250 L -70 -250 Z" fill={LOT.timber} stroke={C.ink} strokeWidth={5} />
    <circle cx={0} cy={-150} r={30} fill="none" stroke={LOT.bronze} strokeWidth={6} />
  </g>
);

/** the high pale bench of a flat white courtroom, celadon plaster behind */
const Bench: React.FC<{f: number; y?: number}> = ({f, y = 560}) => (
  <g>
    <rect x={-80} y={-80} width={1240} height={y + 120} fill="#C9CFC0" data-band="ok" />
    {Array.from({length: 8}, (_, i) => <rect key={i} x={-40 + i * 150} y={-60} width={90} height={y - 60} rx={6} fill="#B4BBAA" stroke={C.ink} strokeWidth={3} opacity={0.7} />)}
    <rect x={380} y={60} width={320} height={60} rx={8} fill={LOT.bronze} stroke={C.ink} strokeWidth={4} />
    <circle cx={540} cy={90} r={22} fill={LOT.bronzeD} stroke={C.ink} strokeWidth={3} />
    <rect x={60} y={y - 160} width={960} height={220} rx={10} fill="#D9D2C0" stroke={C.ink} strokeWidth={6} />
    <rect x={60} y={y - 160} width={960} height={28} fill="#EFEADF" stroke={C.ink} strokeWidth={4} />
    {Array.from({length: 6}, (_, i) => <rect key={i} x={90 + i * 156} y={y - 110} width={130} height={150} rx={6} fill="none" stroke="#B4AD9A" strokeWidth={4} />)}
    <rect x={60} y={y + 60} width={960} height={20} fill="#A9A28E" />
  </g>
);

/** a faceless judge seen over the bench: shoulders in a black robe, smooth head */
const Judge: React.FC<{f: number; x: number; y: number; s?: number; cues?: number[]; seed?: number}> = ({f, x, y, s = 1, cues = [], seed = 7}) => (
  <IdleFigure f={f} x={x} footY={y} h={200 * s} seed={seed} cues={cues}>
    {(pose) => (
      <g transform={`translate(${x + pose.shift * 0.3},${y + pose.dip}) scale(${s})`}>
        <path d="M -110 0 Q -110 -120 -50 -140 L 50 -140 Q 110 -120 110 0 Z" fill="#1C1A24" stroke={C.ink} strokeWidth={5} />
        <path d="M -20 -140 L 0 -100 L 20 -140 Z" fill="#F2EEE6" stroke={C.ink} strokeWidth={3} />
        <path d="M -90 -20 Q -96 -90 -60 -128" stroke="#FFFFFF" strokeWidth={4} opacity={0.18} fill="none" />
        <g transform={`rotate(${pose.headRot} 0 -170)`}>
          <ellipse cx={0} cy={-190} rx={40} ry={48} fill="#B88A6A" stroke={C.ink} strokeWidth={5} />
          <ellipse cx={10} cy={-184} rx={22} ry={28} fill="#8E6448" opacity={0.6} />
          <path d="M -38 -212 Q 0 -246 38 -212 Q 20 -228 0 -230 Q -20 -228 -38 -212 Z" fill="#9A9AA2" stroke={C.ink} strokeWidth={3} />
        </g>
      </g>
    )}
  </IdleFigure>
);

/** a small nickel key, origin = its bow */
const Key: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <circle cx={0} cy={0} r={22} fill="none" stroke={C.ink} strokeWidth={13} />
    <circle cx={0} cy={0} r={22} fill="none" stroke={LOT.bronzeL} strokeWidth={7} />
    <rect x={18} y={-6} width={90} height={12} rx={4} fill={LOT.bronzeL} stroke={C.ink} strokeWidth={4} />
    <rect x={84} y={4} width={10} height={18} fill={LOT.bronzeL} stroke={C.ink} strokeWidth={3} />
  </g>
);

/** the VOLUNTARY card held by one paper clip; origin = the clip's top */
const ClipCard: React.FC<{f: number; x: number; y: number; s?: number; rot?: number; blank?: boolean; ink?: number; swing?: number}> = ({f, x, y, s = 1, rot = 0, blank = false, ink = 1, swing = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot + Math.sin(f / 13) * 3 + Math.sin(clamp01(swing) * Math.PI * 4) * 14 * (1 - clamp01(swing))}) scale(${s})`}>
    <rect x={-80} y={14} width={160} height={70} rx={4} fill={LOT.card} stroke={C.ink} strokeWidth={4} />
    {!blank && <text x={0} y={58} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink} opacity={clamp01(ink)}>VOLUNTARY</text>}
    <path d="M -10 0 L -10 34 Q -10 44 0 44 Q 10 44 10 34 L 10 6 Q 10 -2 4 -2 Q -2 -2 -2 6 L -2 30" fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <path d="M -10 0 L -10 34 Q -10 44 0 44 Q 10 44 10 34 L 10 6 Q 10 -2 4 -2 Q -2 -2 -2 6 L -2 30" fill="none" stroke={LOT.bronzeL} strokeWidth={3.5} strokeLinecap="round" />
  </g>
);

/** the house hammer seen in every hall shot: bracket at top right, head over the case */
const HallHammer: React.FC<{f: number; x?: number; y?: number; s?: number; bx?: number; by?: number; glint?: number; card?: number; dip?: number; weight?: number}> = ({f, x = 640, y = 560, s = 0.9, bx = 1040, by = 300, glint = 0, card = 0, dip = 0, weight = 0}) => (
  <HeldProp f={f} px={x} py={y} w={200} h={200} seed={4} kind="hang">
    <AuctionHammer f={f} x={x} y={y} bx={bx} by={by} scale={s} glint={glint} card={card} cardText="SALE HEARING · DEC 3RD AND 4TH" dip={dip} weight={weight} />
  </HeldProp>
);

/** the watchdog's marigold tag knotted onto the case's ring; k 0..1 drops it in */
const RefTag: React.FC<{f: number; x: number; y: number; k: number; s?: number}> = ({f, x, y, k, s = 1}) => (
  k > 0.01 ? (
    <g transform={`translate(${x},${y + (1 - clamp01(k)) * -160}) rotate(${Math.sin(f / 12) * 6}) scale(${s})`} opacity={clamp01(k * 2)}>
      <path d="M 0 0 L 0 26" stroke={C.ink} strokeWidth={4} />
      <path d="M -96 26 L 80 26 L 104 50 L 80 74 L -96 74 Z" fill={C.marigold} stroke={C.ink} strokeWidth={4} />
      <circle cx={88} cy={50} r={6} fill={C.ink} />
      <text x={-6} y={58} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={C.ink}>OMBUDSMAN ORDERED</text>
    </g>
  ) : null
);

// ---- the scenes -------------------------------------------------------------------------------------------------------------------------------------
/** S1, This is for sale: the case under the raised hammer, Bub jolts awake as a paddle snaps up and its shadow crosses the glass */
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b1 = b(1), b2 = b(2);
  const snap = ease(f, 6, 12);
  const py = lerp(1900, 1140, snap) + settle(f, 18, -26, 20);
  const shadowX = lerp(-500, 420, easeIO(f, 8, 40));
  const awake = clamp01((f - 9) / 6);
  return (
    <Frame p={p} z0={1.0} z1={1.07} ox={520} oy={960} bloom={0.07} bg={C.walnut}>
      <SVG>
        <AuctionHall f={f} seed={1} showWindow={false} winX={120} winW={500} winY={300} spotX={500} spotY={1300} />
        <Turntable f={f} x={500} y={1300} w={620} />
        <HeldTravel f={f} x={300} y={600} w={400} h={700} mode="sweep">
          <GlassCase f={f} x={500} y={1290} scale={1.14} frost={0.3}>
            <Bub f={f} x={0} y={-150} scale={0.92} emotion={awake < 1 ? 'calm' : 'shocked'} asleep={1 - awake} ellipsis={awake} cues={[b1, b2]} seed={3} look={f > b2 ? 0.6 : 0} />
          </GlassCase>
        </HeldTravel>
        <HallHammer f={f} x={620} y={520} glint={win(f, b2)} />
        <path d={`M ${shadowX} 640 L ${shadowX + 220} 640 L ${shadowX + 300} 1200 L ${shadowX + 80} 1200 Z`} fill={C.ink} opacity={0.22 * clamp01(f / 10)} />
        <Paddle f={f} x={170} y={py} rot={-12 + settle(f, 18, 8, 22)} label="2" sub="LOT" />
        <NearRope f={f} seed={1} props="paddles" />
      </SVG>
      <SVG>
        <Plate text="AUCTION · DECEMBER 1ST" x={540} y={760} p={win(f, b1 + 4)} /> {/* plate-overlap-ok */}
        <Plate text="ITS CHATS MAY GO TOO" x={540} y={840} p={win(f, b2)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S2, the app: a kitchen table at night, a faceless hand opens the CHARACTER.AI app and chat bubbles lift off the phone until a court notice stalls them */
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b3 = b(3), b4 = b(4), b5 = b(5);
  const stall = clamp01((f - b4) / 16);
  const notice = ease(f, b4, 16);
  const tag = ease(f, b5, 14);
  const lift = (i: number) => clamp01((f - b3 - i * 8) / 50) * (1 - stall * 0.6);
  return (
    <Frame p={p} z0={1.02} z1={1.07} oy={1000} bloom={0.09} bg="#151622">
      <SVG>
        <rect x={-80} y={-80} width={1240} height={2080} fill="#1B1D2C" data-band="ok" />
        {/* the kitchen behind: cabinets, a dark window, a kettle */}
        {Array.from({length: 4}, (_, i) => <rect key={i} x={-40 + i * 290} y={120} width={250} height={300} rx={8} fill="#24263A" stroke={C.ink} strokeWidth={4} />)}
        {Array.from({length: 4}, (_, i) => <circle key={i} cx={190 + i * 290} cy={300} r={8} fill={LOT.bronze} />)}
        <rect x={-80} y={420} width={1240} height={30} fill="#2E3046" />
        <g transform="translate(860,560)"><path d="M -60 0 Q -60 -90 0 -90 Q 60 -90 60 0 Z" fill="#3A3C52" stroke={C.ink} strokeWidth={4} /><path d="M 60 -50 Q 110 -40 100 0" stroke={C.ink} strokeWidth={8} fill="none" /></g>
        <rect x={-80} y={600} width={1240} height={1400} fill="#3A2A26" data-band="ok" />
        {Array.from({length: 6}, (_, i) => <rect key={i} x={-80} y={640 + i * 140} width={1240} height={4} fill="#2A1E1A" opacity={0.6} data-band="ok" />)}
        <ellipse cx={540} cy={1060} rx={460} ry={300} fill="#8FB4C8" opacity={0.12 + 0.03 * Math.sin(f / 20)} />
        {/* the hand and the phone */}
        <g transform={`translate(540,${1120 + Math.sin(f / 18) * 4}) rotate(-8)`}>
          <ContactShadow cx={20} cy={300} rx={240} ry={20} opacity={0.4} />
          <path d="M -150 120 Q -190 180 -170 320 L 120 340 Q 170 220 150 120 Z" fill="#B88A6A" stroke={C.ink} strokeWidth={5} />
          <rect x={-130} y={-260} width={260} height={480} rx={34} fill="#14141C" stroke={C.ink} strokeWidth={6} />
          <rect x={-114} y={-236} width={228} height={432} rx={20} fill={LOT.velvet} />
          <rect x={-100} y={-220} width={200} height={40} rx={8} fill={LOT.claret} />
          <text x={0} y={-192} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={LOT.cream}>CHARACTER.AI</text>
          {[0, 1, 2].map((i) => <rect key={i} x={i % 2 ? -20 : -96} y={-150 + i * 70} width={116} height={46} rx={14} fill={LOT.cream} opacity={0.85} />)}
          <path d="M -150 120 Q -110 60 -60 80 Q -40 100 -70 130" fill="#B88A6A" stroke={C.ink} strokeWidth={5} />
          <ellipse cx={-30} cy={40 - ease(f, b3 - 8, 8) * 10} rx={30} ry={18} fill="#C99A78" stroke={C.ink} strokeWidth={4} />
          {/* the court notice sliding down over the screen */}
          <g transform={`translate(0,${lerp(-700, -40, notice)})`} opacity={notice > 0 ? 1 : 0}>
            <rect x={-104} y={-120} width={208} height={150} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} />
            {Array.from({length: 4}, (_, k) => <rect key={k} x={-86} y={-92 + k * 24} width={k === 3 ? 90 : 170} height={8} rx={4} fill="#B9B0A0" />)}
            <StrikeProp f={f} at={b4 + 10} px={60} py={-120}>
              <g transform="translate(60,-120)">
                <rect x={-52} y={-20} width={104} height={40} rx={6} fill={LOT.claretL} stroke={C.ink} strokeWidth={4} />
                <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={LOT.cream}>CH. 11</text>
              </g>
            </StrikeProp>
          </g>
        </g>
        {/* the bubbles lifting off the screen */}
        <CharFace f={f} x={360} y={lerp(980, 640, lift(0))} kind={0} pop={ease(f, b3, 12)} dim={stall} s={0.7} />
        <CharFace f={f} x={740} y={lerp(1000, 720, lift(1))} kind={1} pop={ease(f, b3 + 8, 12)} dim={stall} s={0.7} />
        <CharFace f={f} x={420} y={lerp(1020, 820, lift(2))} kind={2} pop={ease(f, b3 + 16, 12)} dim={stall} s={0.7} />
        {/* the FOR SALE tag swinging over the phone */}
        <g transform={`translate(780,${lerp(-200, 900, tag) + settle(f, b5 + 14, 14, 22)}) rotate(${Math.sin(f / 11) * 6})`}>
          <path d="M 0 -900 L 0 -40" stroke={C.ink} strokeWidth={4} />
          <path d="M -70 -40 L 50 -40 L 80 0 L 50 40 L -70 40 Z" fill={LOT.birch} stroke={C.ink} strokeWidth={5} />
          <circle cx={60} cy={0} r={8} fill="#1B1D2C" stroke={C.ink} strokeWidth={3} />
          <text x={-12} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>FOR SALE</text>
        </g>
        <rect x={-80} y={1480} width={1240} height={520} fill="#2A1E1A" data-band="ok" />
        <g data-band="ok"><circle cx={200} cy={1640} r={70} fill="#E9E2D6" stroke={C.ink} strokeWidth={5} /><circle cx={200} cy={1640} r={44} fill="#5A3A2A" /></g>
      </SVG>
      <SVG>
        <Plate text="CHARACTER.AI · CHAT WITH AI CHARACTERS" x={540} y={560} p={win(f, b3)} /> {/* plate-overlap-ok */}
        <Plate text="BANKRUPTCY · OCTOBER" x={540} y={640} p={win(f, b4)} /> {/* plate-overlap-ok */}
        <Plate text="TO SELL ITSELF" x={540} y={720} p={win(f, b5)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S3, two bids: the gear crate rolls on under Disney's paddle, its card flips, a LICENSE sleeve slides on, a pane drops between the bids */
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b6 = b(6), b7 = b(7), b42 = b(42), b8 = b(8);
  const roll = ease(f, b6 - 10, 30);
  const paddle = ease(f, b6, 16);
  const sleeve = ease(f, b42, 16);
  const pane = interpolate(f, [b8 - 6, b8 + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const pinch = clamp01(1 - Math.abs(f - b8 - 4) / 10);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.08, fx: 540, fy: 900}, {t: p.dur, z: 1.0, fx: 540, fy: 960}])} bloom={0.06} bg={C.walnut}>
      <SVG>
        <AuctionHall f={f} seed={3} showWindow={false} winX={140} winW={400} winY={300} spotX={760} spotY={1280} />
        <HallHammer f={f} x={720} y={540} bx={1060} by={320} s={0.75} />
        <rect x={120} y={1180} width={360} height={110} rx={8} fill={LOT.claret} stroke={C.ink} strokeWidth={5} />
        <rect x={110} y={1280} width={380} height={24} rx={4} fill={LOT.walnut} stroke={C.ink} strokeWidth={4} />
        <HeldTravel f={f} x={160} y={880} w={300} h={310} mode="sweep">
          <g>
            <LicenseCrate f={f} x={lerp(-260, 300, roll)} y={1180} scale={0.78} spin={roll} sleeve="LICENSE" />
            <rect x={lerp(-260, 300, roll) - 125} y={1180 - 0.78 * 280} width={250} height={50} fill={C.walnut} opacity={0.0001} />
          </g>
        </HeldTravel>
        {/* the sleeve sliding down over the crate */}
        <g opacity={sleeve} transform={`translate(0,${(1 - sleeve) * -120})`}>
          <rect x={185} y={1180 - 0.78 * 220} width={230} height={0.78 * 220} rx={6} fill={LOT.sleeve} opacity={0.35} stroke={C.ink} strokeWidth={3} />
        </g>
        <Paddle f={f} x={300} y={lerp(1600, 1010, paddle) + settle(f, b6 + 16, -18, 20)} label={f < b7 + 4 ? '?' : '$20M'} sub="DISNEY" rot={-6} />
        <Turntable f={f} x={780} y={1290} w={380} />
        <GlassCase f={f} x={780} y={1290} scale={0.8} frost={0.3} glint={0.4}>
          <Bub f={f} x={0} y={-150} scale={0.9} emotion={f > b8 ? 'startled' : 'anxious'} pinch={pinch} ellipsis={0.8} cues={[b6, b8]} seed={6} look={-0.8} />
        </GlassCase>
        <StrikeProp f={f} at={b8 + 4} px={560} py={1300}>
          <g transform={`translate(0,${(1 - pane) * -1300})`}>
            <rect x={540} y={420} width={40} height={880} fill={C.glass} opacity={0.55} stroke={C.ink} strokeWidth={5} />
            <rect x={546} y={430} width={8} height={860} fill="#FFFFFF" opacity={0.6} />
            <rect x={530} y={400} width={60} height={28} rx={4} fill={LOT.bronze} stroke={C.ink} strokeWidth={4} />
          </g>
        </StrikeProp>
        <NearRope f={f} seed={3} props="truck" />
      </SVG>
      <SVG>
        <Plate text="DISNEY OPENS" x={540} y={600} p={win(f, b6)} /> {/* plate-overlap-ok */}
        <Plate text="$20 MILLION" x={540} y={680} p={win(f, b7)} /> {/* plate-overlap-ok */}
        <Plate text="ONLY A LICENSE · SOME TECHNOLOGY" x={540} y={760} p={win(f, b42)} /> {/* plate-overlap-ok */}
        <Plate text="NO CHATS IN THE DISNEY DEAL" x={540} y={840} p={win(f, b8)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S4, another bid: a reverse from inside the frosted case, Bub's ellipsis in the foreground, a PER PPC LAND paddle rising beyond the glass, a lot tie cinching across the lens */
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b9 = b(9), b44 = b(44), b34 = b(34), b10 = b(10);
  const rise = ease(f, b9, 16);
  const face = ease(f, b44, 12);
  const crate = ease(f, b10, 18);
  const tie = ease(f, b10 + 6, 20);
  return (
    <Frame p={p} z0={1.0} z1={1.04} ox={540} oy={960} bloom={0.07} bg={LOT.velvet}>
      <SVG>
        {/* beyond the glass: the hall, soft and dim */}
        <g opacity={0.75}>
          <AuctionHall f={f} seed={4} showWindow={false} winX={100} winW={420} winY={300} spotX={540} spotY={1260} floorY={1240} />
        </g>
        <g transform={`translate(${lerp(1300, 860, crate)},1260)`}>
          <LicenseCrate f={f} x={0} y={0} scale={0.5} spin={crate} sleeve="APP · MODELS" />
        </g>
        <g transform={`translate(420,${lerp(1700, 1000, rise) + settle(f, b9 + 16, -16, 20)}) rotate(${lerp(8, -4, face)}) scale(${1 + face * 0.2})`}>
          <Paddle f={f} x={0} y={0} label={f < b34 + 3 ? ' ' : '$10M'} sub="OPENING BID" sash="PER PPC LAND" sashFix={0.6} />
        </g>
        {/* the frost and the curved glass between us and the hall */}
        <rect x={-80} y={-80} width={1240} height={2080} fill={LOT.frost} opacity={0.22} data-band="ok" />
        <path d="M -20 1920 L -20 400 Q 540 120 1100 400 L 1100 1920" fill="none" stroke="#FFFFFF" strokeWidth={14} opacity={0.35} />
        <path d="M 60 1700 L 60 520 Q 300 330 520 300" fill="none" stroke="#FFFFFF" strokeWidth={8} opacity={0.4} />
        {/* the nickel lot tie cinching across the glass in front of the lens */}
        {tie > 0.01 && <path d={`M -80 ${980 + (1 - tie) * 80} Q 540 ${1060 - tie * 60} 1160 ${940 + (1 - tie) * 80}`} stroke={C.ink} strokeWidth={22} fill="none" strokeDasharray={`${tie * 1600} 3000`} />}
        {tie > 0.01 && <path d={`M -80 ${980 + (1 - tie) * 80} Q 540 ${1060 - tie * 60} 1160 ${940 + (1 - tie) * 80}`} stroke={LOT.bronzeL} strokeWidth={14} fill="none" strokeDasharray={`${tie * 1600} 3000`} />}
        {/* Bub from behind, its ellipsis in the foreground */}
        <g transform="translate(540,1900) scale(2.4)">
          <ellipse cx={0} cy={-120} rx={180} ry={130} fill={LOT.cream} stroke={C.ink} strokeWidth={4} />
          <path d="M 120 -150 A 180 130 0 0 1 60 -10 A 160 120 0 0 0 120 -150 Z" fill={LOT.creamD} opacity={0.6} />
          {[0, 1, 2].map((k) => <circle key={k} cx={(k - 1) * 34} cy={-150 - Math.sin(f * (0.2 + rise * 0.25) - k * 0.9) * 10} r={12} fill={LOT.walnut} stroke={C.ink} strokeWidth={2.5} />)}
        </g>
        <rect x={-80} y={1700} width={1240} height={300} fill={LOT.claret} stroke={C.ink} strokeWidth={6} data-band="ok" />
      </SVG>
      <SVG>
        <Plate text="PER PPC LAND" x={540} y={600} p={win(f, b9)} /> {/* plate-overlap-ok */}
        <Plate text="ANOTHER OPENING BID" x={540} y={680} p={win(f, b44)} /> {/* plate-overlap-ok */}
        <Plate text="$10 MILLION" x={540} y={760} p={win(f, b34)} /> {/* plate-overlap-ok */}
        <Plate text="APP · MODELS · USER DATA" x={540} y={840} p={win(f, b10)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S5, what's inside: straight down on the case in a dark void, labels etch through the frost, tiny bubbles pour out until the case is one dot, a spotlight irises onto the case and the empty chair */
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b11 = b(11), b35 = b(35), b12 = b(12), b43 = b(43), b13 = b(13);
  const frost = ease(f, b11, 14);
  const etch = [0, 1].map((i) => ease(f, b35 + i * 14, 12));
  const pour = clamp01((f - b12) / 90);
  const kid = ease(f, b43, 14);
  const iris = ease(f, b13, 16);
  const zoomOut = lerp(1, 0.45, easeIO(f, b12, 120));
  const N = Math.floor(pour * 220);
  return (
    <Frame p={p} z0={1.0} z1={1.02} bloom={0.08} bg="#0E0A12">
      <SVG>
        <rect x={-80} y={-80} width={1240} height={2080} fill="#0E0A12" data-band="ok" />
        <g transform={`translate(540,960) scale(${zoomOut}) translate(-540,-960)`}>
          {/* the bubble field */}
          {Array.from({length: N}, (_, i) => {
            const ang = h01(i, 3) * Math.PI * 2, rad = 180 + Math.sqrt(h01(i, 5)) * 1100 * Math.min(1, pour * 1.6);
            const x = 540 + Math.cos(ang) * rad, y = 960 + Math.sin(ang) * rad * 1.1;
            const small = Math.hypot(x - 540, y - 960) < 420;
            const r = 9 + (small ? 0 : 0) + kid * 0;
            return (
              <g key={i} transform={`translate(${x},${y + Math.sin(f / 9 + i) * 2})`}>
                <ellipse cx={0} cy={0} rx={r * 1.4} ry={r} fill={LOT.cream} stroke={C.ink} strokeWidth={2.5} />
                <circle cx={-r * 0.4} cy={-1} r={1.8} fill={C.ink} /><circle cx={r * 0.4} cy={-1} r={1.8} fill={C.ink} />
              </g>
            );
          })}
          {/* the case from above: plinth square, round dome, Bub as a soft silhouette */}
          <rect x={360} y={780} width={360} height={360} rx={18} fill={LOT.claret} stroke={C.ink} strokeWidth={6} />
          <circle cx={540} cy={960} r={160} fill={LOT.velvet} stroke={C.ink} strokeWidth={6} />
          <g opacity={1 - frost * 0.5}><ellipse cx={540} cy={960} rx={90} ry={74} fill={LOT.cream} stroke={C.ink} strokeWidth={4} /><circle cx={512} cy={940} r={8} fill={C.ink} /><circle cx={568} cy={940} r={8} fill={C.ink} /></g>
          {[0, 1, 2].map((i) => <circle key={i} cx={510 + i * 30} cy={990} r={6} fill={LOT.walnut} opacity={1 - frost * 0.4} />)}
          <circle cx={540} cy={960} r={160} fill={LOT.frost} opacity={frost * 0.45} />
          <circle cx={540} cy={960} r={160} fill="none" stroke="#FFFFFF" strokeWidth={8} opacity={0.4} />
          {['MENTAL HEALTH', 'RELATIONSHIPS'].map((l, i) => (
            <g key={l} opacity={frost} transform={`translate(540,${880 + i * 150})`}>
              <rect x={-monoW(l, 26) / 2 - 18} y={-24} width={monoW(l, 26) + 36} height={44} rx={22} fill="#FFFFFF" opacity={0.8} />
              <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={LOT.channel} opacity={etch[i]}>{l}</text>
            </g>
          ))}
          {/* the empty referee chair beside it, seen from above, with its closed folder */}
          <g transform="translate(860,960)">
            <rect x={-70} y={-70} width={140} height={140} rx={10} fill={LOT.claret} stroke={C.ink} strokeWidth={5} />
            <rect x={-70} y={-70} width={140} height={30} fill={LOT.walnut} stroke={C.ink} strokeWidth={4} />
            <rect x={-46} y={-20} width={92} height={60} rx={4} fill={C.marigold} stroke={C.ink} strokeWidth={4} />
          </g>
        </g>
        {/* the iris */}
        {iris > 0.01 && (
          <path d={`M -80 -80 L 1160 -80 L 1160 2000 L -80 2000 Z M ${540 + 520 * (1 - iris * 0.55)} 960 A ${520 * (1 - iris * 0.55)} ${520 * (1 - iris * 0.55)} 0 1 0 ${540 - 520 * (1 - iris * 0.55)} 960 A ${520 * (1 - iris * 0.55)} ${520 * (1 - iris * 0.55)} 0 1 0 ${540 + 520 * (1 - iris * 0.55)} 960 Z`} fill="#000" fillRule="evenodd" opacity={0.75 * iris} />
        )}
      </SVG>
      <SVG>
        <Plate text="PER ALASKA DEPT. OF LAW" x={540} y={600} p={win(f, b11, b12)} /> {/* plate-overlap-ok */}
        <Plate text="OVER 2 MILLION ACCOUNTS · COMPANY FIGURES" x={540} y={680} p={win(f, b12, b43)} /> {/* plate-overlap-ok */}
        <Plate text="OVER 2 MILLION MINORS' ACCOUNTS · COMPANY FIGURES" displayLines={["OVER 2 MILLION MINORS' ACCOUNTS", 'COMPANY FIGURES']} x={540} y={780} p={win(f, b43)} /> {/* plate-overlap-ok */}
        <Plate text="WHO'S WATCHING?" x={540} y={1260} p={win(f, b13)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S6, Juneau: an Alaska Department of Law office at blue hour, Alaska's card slides into the fan of state cards, a marigold band snaps around them */
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b14 = b(14), b15 = b(15), b41 = b(41);
  const lamp = ease(f, b14, 8);
  const ak = ease(f, b15, 18);
  const square = ease(f, b41, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.06} ox={540} oy={1000} bloom={0.07} bg="#1E2233">
      <SVG>
        <rect x={-80} y={-80} width={1240} height={2080} fill="#2A2F45" data-band="ok" />
        {/* the window onto Mount Juneau and the channel, rain stopped */}
        <rect x={140} y={180} width={800} height={640} rx={10} fill={LOT.walnut} stroke={C.ink} strokeWidth={6} />
        <svg x={160} y={200} width={760} height={600} viewBox="0 0 760 600" overflow="hidden">
          <rect x={0} y={0} width={760} height={600} fill={LOT.dusk} />
          <rect x={0} y={0} width={760} height={200} fill="#3A4562" />
          {[0, 1].map((i) => <ellipse key={i} cx={((f * 0.3 + i * 300) % 1000) - 120} cy={90 + i * 60} rx={200} ry={26} fill={LOT.slate} opacity={0.4} />)}
          <path d="M -20 470 L 140 250 L 260 170 L 380 120 L 500 210 L 640 240 L 780 300 L 780 600 L -20 600 Z" fill="#33415A" stroke={C.ink} strokeWidth={4} />
          <path d="M 260 170 L 380 120 L 450 175 L 400 172 L 350 196 L 310 180 Z" fill="#E8EEF5" stroke={C.ink} strokeWidth={2.5} />
          {Array.from({length: 18}, (_, i) => { const tx = h01(i, 2) * 760, ty = 330 + h01(i, 4) * 110; return <path key={i} d={`M ${tx} ${ty - 34} L ${tx + 12} ${ty} L ${tx - 12} ${ty} Z`} fill="#1E3A34" stroke={C.ink} strokeWidth={1.5} />; })}
          <rect x={0} y={460} width={760} height={140} fill={LOT.channel} />
          {Array.from({length: 14}, (_, i) => <circle key={i} cx={20 + i * 54} cy={455} r={4} fill="#FFD98A" opacity={0.6 + 0.4 * Math.sin(f / 9 + i)} />)}
          {Array.from({length: 6}, (_, i) => <path key={i} d={`M ${i * 140 - ((f * 0.5) % 140)} ${500 + i * 12} l 80 0`} stroke={LOT.rain} strokeWidth={2} opacity={0.5} />)}
        </svg>
        <rect x={536} y={200} width={8} height={600} fill={LOT.walnut} />
        {/* the desk, lamp pool and the fan of state cards */}
        <rect x={-80} y={1000} width={1240} height={1000} fill={LOT.walnut} data-band="ok" />
        <rect x={-80} y={1000} width={1240} height={24} fill={LOT.timberL} />
        <ellipse cx={560} cy={1150} rx={420} ry={150} fill="#FFE7B8" opacity={0.28 * lamp} />
        <g transform="translate(860,1000)">
          <path d="M 0 0 L 30 -230 L -80 -330" stroke={C.ink} strokeWidth={14} fill="none" strokeLinecap="round" />
          <path d="M 0 0 L 30 -230 L -80 -330" stroke={LOT.bronze} strokeWidth={8} fill="none" strokeLinecap="round" />
          <path d="M -150 -300 L -40 -360 L -10 -300 Z" fill={LOT.claret} stroke={C.ink} strokeWidth={5} />
          <circle cx={-90} cy={-300} r={14} fill="#FFF0C8" opacity={lamp} />
          <ellipse cx={0} cy={6} rx={60} ry={14} fill={LOT.bronzeD} stroke={C.ink} strokeWidth={4} />
        </g>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const isAK = i === 3;
          const k = isAK ? ak : 1;
          const fanA = -45 + i * 18;
          const a = lerp(fanA, -6 + i * 2.4, square);
          const ty = isAK ? lerp(-300, 0, k) : 0;
          return (
            <g key={i} opacity={isAK ? k : 1} transform={`translate(520,${1200 + ty}) rotate(${a}) translate(0,-150)`}>
              <rect x={-60} y={-80} width={120} height={150} rx={8} fill={isAK ? LOT.cream : '#E8E0CF'} stroke={C.ink} strokeWidth={4} />
              {isAK ? <path d={AK_PATH} transform="translate(-48,-56) scale(0.096)" fill={LOT.channel} stroke={C.ink} strokeWidth={12} />
                : <path d={`M -30 -40 L 30 -44 L 34 ${20 + i * 4} L -26 30 Z`} fill="#B8AE98" stroke={C.ink} strokeWidth={2} />}
            </g>
          );
        })}
        {square > 0.6 && <rect x={440} y={1050} width={160} height={22} rx={6} fill={LOT.bronzeL} stroke={C.ink} strokeWidth={3} opacity={clamp01((square - 0.6) * 2.5)} />}
        <rect x={-80} y={1500} width={1240} height={500} fill={LOT.walnutD} data-band="ok" />
        <rect x={120} y={1540} width={300} height={36} rx={4} fill={LOT.card} stroke={C.ink} strokeWidth={3} data-band="ok" />
      </SVG>
      <SVG>
        <Plate text="OCTOBER · STATE ATTORNEYS GENERAL" x={540} y={880} p={win(f, b14)} /> {/* plate-overlap-ok */}
        <Plate text="ALASKA JOINED · BIPARTISAN STATES" x={540} y={960} p={win(f, b15)} /> {/* plate-overlap-ok */}
        <Plate text="PROTECTIONS IN ANY SALE" x={540} y={1300} p={win(f, b41)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S7, the rule: from above, a law book falls open and a paper hammer pops up held by three paper tabs */
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b16 = b(16), b17 = b(17);
  const open = ease(f, b16, 16);
  const pop = ease(f, b17, 20);
  const tabs = [ease(f, b17 + 24, 12), ease(f, b17 + 52, 12), ease(f, b17, 12)];
  return (
    <Frame p={p} z0={1.0} z1={1.05} bloom={0.05} bg={LOT.walnutD}>
      <SVG>
        <rect x={-80} y={-80} width={1240} height={2080} fill={LOT.walnut} data-band="ok" />
        {Array.from({length: 9}, (_, i) => <rect key={i} x={-80} y={-60 + i * 230} width={1240} height={4} fill={LOT.walnutD} opacity={0.5} data-band="ok" />)}
        <ellipse cx={420} cy={900} rx={620} ry={520} fill="#FFF3DE" opacity={0.16} />
        {/* the reading stand and the book */}
        <rect x={140} y={1180} width={800} height={60} rx={10} fill={LOT.timber} stroke={C.ink} strokeWidth={5} />
        <g transform={`translate(540,1180)`}>
          <ContactShadow cx={0} cy={20} rx={420} ry={24} opacity={0.4} />
          <path d={`M 0 0 L ${-380 * open - 20} ${-30 - 20 * open} L ${-380 * open - 20} ${-560} L 0 -530 Z`} fill="#F3EBDA" stroke={C.ink} strokeWidth={5} />
          <path d={`M 0 0 L ${380} ${-30 - 20 * open} L 380 -560 L 0 -530 Z`} fill="#F7F0E2" stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 10}, (_, i) => <rect key={i} x={-360 * open} y={-490 + i * 40} width={300 * open} height={9} rx={4} fill="#C9C0AE" />)}
          {Array.from({length: 10}, (_, i) => <rect key={i} x={50} y={-490 + i * 40} width={i === 9 ? 160 : 300} height={9} rx={4} fill="#C9C0AE" opacity={1 - pop * 0.8} />)}
          <rect x={-8} y={-540} width={16} height={540} fill="#D9CFBA" />
          <text x={210} y={-500} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink} opacity={open}>§ 363</text>
          {/* the paper pop-up: three steps up to a paper hammer */}
          <g transform={`translate(210,-120) scale(1,${pop})`}>
            {[0, 1, 2].map((i) => {
              const lbl = ['OMBUDSMAN', 'HEARING', 'JUDGE'][i];
              const tw = monoW(lbl, 18) + 16;
              const sx = -150 + i * 100, sh = 70 + i * 70;
              return (
                <g key={i} opacity={tabs[i]}>
                  <rect x={sx} y={-sh} width={100} height={sh} fill="#F7F0E2" stroke={C.ink} strokeWidth={4} />
                  <rect x={sx} y={-sh} width={100} height={12} fill="#FFFFFF" stroke={C.ink} strokeWidth={2} />
                  <rect x={sx + 50 - tw / 2} y={-sh + 22} width={tw} height={28} rx={4} fill="#FFFFFF" stroke={C.ink} strokeWidth={2.5} />
                  <text x={sx + 50} y={-sh + 42} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>{lbl}</text>
                </g>
              );
            })}
            <g transform="translate(110,-260) rotate(-20)" opacity={tabs[2]}>
              <rect x={-8} y={-10} width={16} height={110} rx={6} fill="#F7F0E2" stroke={C.ink} strokeWidth={4} />
              <rect x={-55} y={-50} width={110} height={46} rx={16} fill="#F7F0E2" stroke={C.ink} strokeWidth={5} />
            </g>
          </g>
        </g>
        <rect x={-80} y={1480} width={1240} height={520} fill={LOT.walnutD} data-band="ok" />
        <rect x={180} y={1560} width={140} height={14} rx={6} fill={LOT.bronze} stroke={C.ink} strokeWidth={3} data-band="ok" />
      </SVG>
      <SVG>
        <Plate text="FEDERAL LAW · 11 U.S.C. 363" x={540} y={580} p={win(f, b16)} />
      </SVG>
    </Frame>
  );
};

/** S8, the watchdog: the ombudsman walks in, ties the first marigold cord to the raised hammer, and stops the turntable with one hand */
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b18 = b(18), b45 = b(45), b36 = b(36), b19 = b(19);
  const walk = ease(f, b18 - 20, 40);
  const x = lerp(1160, 720, walk) + Math.sin(clamp01((f - b19) / 120) * Math.PI) * -90;
  const cord = ease(f, b36, 14);
  const reach = Math.max(ease(f, b45, 12) * (1 - clamp01((f - b36 - 30) / 20)), cord * (1 - clamp01((f - b36 - 30) / 20)));
  return (
    <Frame p={p} z0={1.0} z1={1.05} ox={560} oy={960} bloom={0.06} bg={C.walnut}>
      <SVG>
        <AuctionHall f={f} seed={8} showWindow={false} winX={120} winW={460} winY={300} spotX={360} spotY={1290} />
        <HallHammer f={f} x={520} y={520} bx={1040} by={300} s={0.82} />
        <Turntable f={f} x={360} y={1300} w={420} />
        <GlassCase f={f} x={360} y={1290} scale={0.86} frost={0.3}>
          <Bub f={f} x={0} y={-150} scale={0.9} emotion={f > b19 ? 'hopeful' : 'calm'} ellipsis={f > b19 ? 0.15 : 0.35} cues={[b18, b36, b19]} seed={10} look={0.8} />
        </GlassCase>
        <RefTag f={f} x={360 + 0.86 * 120} y={1290 - 0.86 * 156} k={cord} s={0.9} />
        <Suit f={f} x={x} y={1300} s={0.95} seed={21} cues={[b18, b36, b19]} coat="#3A3448" reach={reach} facing={-1} walk={f * (1 - walk)} />
        <rect x={x - 70} y={1300 - 0.95 * 205} width={42} height={18} rx={4} fill={C.marigold} stroke={C.ink} strokeWidth={3} />
        {/* the small key at its belt, glinting once */}
        <g transform={`translate(${x + 30},${1300 - 0.95 * 110})`}>
          <Key x={0} y={0} s={0.35} rot={80} />
          <circle cx={0} cy={0} r={10} fill="#FFFFFF" opacity={win(f, b19 + 6, b19 + 20) * 0.8} />
        </g>
        <NearRope f={f} seed={8} props="paddles" />
      </SVG>
      <SVG>
        {f >= b36 && <Lab text="CONSUMER PRIVACY OMBUDSMAN" x={Math.min(820, x)} y={960} size={20} />}
        <Plate text="AT THE STATES' URGING" x={540} y={600} p={win(f, b18)} /> {/* plate-overlap-ok */}
        <Plate text="PER ALASKA DEPT. OF LAW" x={540} y={680} p={win(f, b45)} /> {/* plate-overlap-ok */}
        <Plate text="COURT ORDERS A PRIVACY OMBUDSMAN" x={540} y={760} p={win(f, b36)} /> {/* plate-overlap-ok */}
        <Plate text="REVIEWS THE SALE" x={540} y={840} p={win(f, b19)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S9, the paper clip: back in the Juneau office from the desk's side, Mills lifts a card held by a single paper clip, and a quote plate drops on 'sold' */
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b20 = b(20), b37 = b(37);
  const lift = ease(f, b20 + 10, 18);
  const flip = ease(f, b37, 10);
  return (
    <Frame p={p} z0={1.0} z1={1.06} ox={560} oy={960} bloom={0.06} bg="#1E2233">
      <SVG>
        <rect x={-80} y={-80} width={1240} height={2080} fill="#2A2F45" data-band="ok" />
        <rect x={620} y={160} width={420} height={620} rx={10} fill={LOT.walnut} stroke={C.ink} strokeWidth={6} />
        <svg x={640} y={180} width={380} height={580} viewBox="0 0 380 580" overflow="hidden">
          <rect x={0} y={0} width={380} height={580} fill={LOT.dusk} />
          <path d="M -20 420 L 120 200 L 230 150 L 400 260 L 400 580 L -20 580 Z" fill="#33415A" stroke={C.ink} strokeWidth={4} />
          <path d="M 180 172 L 230 150 L 270 180 Z" fill="#E8EEF5" />
          <rect x={0} y={450} width={380} height={130} fill={LOT.channel} />
          {Array.from({length: 7}, (_, i) => <circle key={i} cx={20 + i * 54} cy={446} r={4} fill="#FFD98A" opacity={0.6 + 0.4 * Math.sin(f / 9 + i)} />)}
        </svg>
        <g transform="translate(240,330)">
          <rect x={-150} y={-110} width={300} height={220} rx={6} fill={LOT.walnut} stroke={C.ink} strokeWidth={6} />
          <rect x={-132} y={-92} width={264} height={184} fill="#EFEADF" />
          <path d={AK_PATH} transform="translate(-114,-80) scale(0.23)" fill="#C9D6CC" stroke={C.ink} strokeWidth={5} />
        </g>
        <rect x={-80} y={1000} width={1240} height={1000} fill={LOT.walnut} data-band="ok" />
        <rect x={-80} y={1000} width={1240} height={24} fill={LOT.timberL} />
        <ellipse cx={520} cy={1120} rx={380} ry={130} fill="#F3E6CC" opacity={0.22} />
        <Suit f={f} x={330} y={1290} s={1.05} seed={23} cues={[b20, b37]} coat="#4A3A52" facing={1} reach={lift} />
        <g transform={`translate(${lerp(560, 520, lift)},${lerp(1010, 780, lift) + Math.sin(clamp01((f - b20 - 40) / 18) * Math.PI) * 50})`}>
          {flip < 0.5 ? <ClipCard f={f} x={0} y={0} s={1.2} rot={-6} blank /> : <ClipCard f={f} x={0} y={0} s={1.2} rot={-6} blank />}
        </g>
        <StrikeProp f={f} at={b37 + 3} px={760} py={1010}>
          <g transform="translate(760,1010)" opacity={win(f, b37)}>
            <rect x={-150} y={-30} width={300} height={60} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
            <rect x={-130} y={-12} width={260} height={8} rx={4} fill="#B9B0A0" /><rect x={-130} y={6} width={180} height={8} rx={4} fill="#B9B0A0" />
          </g>
        </StrikeProp>
        <rect x={-80} y={1500} width={1240} height={500} fill={LOT.walnutD} data-band="ok" />
        <rect x={680} y={1540} width={260} height={36} rx={4} fill={LOT.card} stroke={C.ink} strokeWidth={3} data-band="ok" />
      </SVG>
      <SVG>
        <Lab text="CORI MILLS" x={330} y={920} size={20} />
        <Plate text="CORI MILLS · ACTING ATTORNEY GENERAL" x={540} y={600} p={win(f, b20)} /> {/* plate-overlap-ok */}
        <Plate text={'"SOLD TO THE HIGHEST BIDDER"'} x={540} y={680} p={win(f, b37)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S10, the bolt: the same VOLUNTARY card clipped to the case's bolt, a dashed FUTURE BUYER paddle rises and hovers, never touching */
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b21 = b(21), b46 = b(46), b38 = b(38);
  const ghost = ease(f, b38, 20);
  const gy = lerp(1500, 1000, ghost) + Math.sin(f / 9) * 6;
  return (
    <Frame p={p} z0={1.0} z1={1.05} ox={540} oy={960} bloom={0.06} bg={LOT.aubergine}>
      <SVG>
        <rect x={-80} y={-80} width={1240} height={2080} fill={LOT.aubergine} data-band="ok" />
        <GlassCase f={f} x={460} y={2300} scale={2.6} frost={0.4} bolt={1 - ease(f, b21, 6)} />
        <ClipCard f={f} x={700} y={1890 - 2.6 * 150 + 40} s={1.3} rot={4} ink={ease(f, b46, 14)} swing={clamp01((f - b21 - 4) / 40)} />
        {/* the raking light along the ring */}
        <path d="M -80 1330 L 1160 1240" stroke="#FFFFFF" strokeWidth={6} opacity={0.15 + 0.1 * Math.sin(f / 12)} />
        {/* the dashed ghost paddle */}
        <g transform={`translate(880,${gy}) rotate(-14)`} opacity={0.85 * ghost}>
          <rect x={-90} y={-230} width={180} height={150} rx={14} fill="none" stroke={LOT.cream} strokeWidth={5} strokeDasharray="14 10" />
          <rect x={-10} y={-80} width={20} height={140} rx={8} fill="none" stroke={LOT.cream} strokeWidth={4} strokeDasharray="10 8" />
          <text x={0} y={-162} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={LOT.cream}>FUTURE</text>
          <text x={0} y={-132} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={LOT.cream}>BUYER</text>
        </g>
        <rect x={-80} y={1480} width={1240} height={520} fill={LOT.claretD} data-band="ok" />
      </SVG>
      <SVG>
        <Plate text="LIMITS ON MINORS" x={540} y={600} p={win(f, b21)} /> {/* plate-overlap-ok */}
        <Plate text="VOLUNTARY" x={540} y={680} p={win(f, b46)} /> {/* plate-overlap-ok */}
        <Plate text={'"COULD BE ... REVERSED BY A FUTURE BUYER"'} x={540} y={760} p={win(f, b38)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S11, the other side: flat white house light, the company's own padlock on the dome, the CEO's declaration pinned to the plinth */
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b22 = b(22), b23 = b(23), b24 = b(24);
  const flat = ease(f, b22, 6);
  const lock = ease(f, b23, 16);
  const sheet = ease(f, b24, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.04} oy={980} bloom={0.03} bg={C.walnut} warmth={0.0}>
      <SVG>
        <AuctionHall f={f} seed={11} showWindow={false} winX={140} winW={480} winY={300} spot={1 - flat} spotX={540} spotY={1300} />
        <rect x={-80} y={-80} width={1240} height={2080} fill="#EEF1F2" opacity={0.22 * flat} data-band="ok" />
        {[220, 540, 860].map((x, i) => <rect key={i} x={x - 120} y={40} width={240} height={26} rx={6} fill="#F4F8FA" opacity={flat} stroke={C.ink} strokeWidth={3} />)}
        <HallHammer f={f} x={660} y={500} bx={1050} by={290} s={0.8} dip={sheet * 0.6} weight={sheet} />
        <RefChair f={f} x={140} y={1290} s={0.6} />
        <Turntable f={0} x={540} y={1300} w={560} />
        <GlassCase f={f} x={540} y={1290} scale={1.12} frost={0.3}>
          <Bub f={f} x={0} y={-150} scale={0.92} emotion="calm" ellipsis={0.2} cues={[b22, b23, b24]} seed={11} look={0.3} />
        </GlassCase>
        {/* the company's padlock hung on the dome ring */}
        <g transform={`translate(${540 + 120},${1290 - 1.12 * 156 + lerp(-300, 0, lock)})`} opacity={lock > 0 ? 1 : 0}>
          <g transform={`rotate(${Math.sin(clamp01((f - b23 - 16) / 40) * Math.PI * 3) * 8 * (1 - clamp01((f - b23 - 16) / 40))})`}>
            <path d="M -22 0 L -22 -30 Q -22 -54 0 -54 Q 22 -54 22 -30 L 22 0" fill="none" stroke={C.ink} strokeWidth={12} />
            <path d="M -22 0 L -22 -30 Q -22 -54 0 -54 Q 22 -54 22 -30 L 22 0" fill="none" stroke={LOT.bronzeL} strokeWidth={6} />
            <rect x={-38} y={0} width={76} height={64} rx={8} fill={LOT.bronze} stroke={C.ink} strokeWidth={5} />
            <circle cx={0} cy={28} r={8} fill={C.ink} />
            <path d="M 30 50 L 70 90" stroke={C.ink} strokeWidth={3} />

          </g>
        </g>
        <RefTag f={f} x={540 + 1.12 * 100} y={1290 - 1.12 * 156} k={1} s={0.9} />
        <Suit f={f} x={lerp(1180, 880, ease(f, b23 - 20, 30))} y={1300} s={0.95} seed={29} cues={[b23, b24]} coat="#55606A" reach={Math.max(lock * (1 - clamp01((f - b23 - 24) / 16)), ease(f, b24 - 6, 12))} facing={-1} />
        <NearRope f={f} seed={11} props="catalogs" />
      </SVG>
      <SVG>
        <Lab text="THE COMPANY" x={880} y={940} size={20} />
        <Plate text="THE OTHER SIDE" x={540} y={600} p={win(f, b22)} /> {/* plate-overlap-ok */}
        <Plate text="STILL PROTECTED · PER THE COMPANY" x={540} y={680} p={win(f, b23)} /> {/* plate-overlap-ok */}
        <Plate text="LEGAL COSTS · STRUGGLING TO PROFIT · PER THE CEO" x={540} y={760} p={win(f, b24)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S12, the key: from the floor of a flat celadon courtroom, the judge sets down the rule book, the key rests unturned in an open hand */
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b25 = b(25), b39 = b(39), b26 = b(26), b27 = b(27);
  const slide = ease(f, b39, 18);
  const reach = ease(f, b26, 22);
  const give = ease(f, b27, 20);
  const kx = lerp(760, 560, give), ky = lerp(1080, 880, give);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.02, fx: 540, fy: 1000}, {t: p.dur, z: 1.08, fx: 560, fy: 920}])} bloom={0.03} bg="#C9CFC0" warmth={0.0}>
      <SVG>
        <Bench f={f} y={940} />
        <Judge f={f} x={540} y={820} s={1.3} cues={[b25, b39, b27]} seed={33} />
        <StrikeProp f={f} at={b25 + 4} px={330} py={790}>
          <g transform="translate(330,790)" opacity={win(f, b25 - 8)}>
            <rect x={-90} y={-40} width={180} height={40} rx={4} fill={LOT.claretD} stroke={C.ink} strokeWidth={4} />
            <rect x={-84} y={-36} width={168} height={8} fill={LOT.bronze} />
          </g>
        </StrikeProp>
        {[0, 1, 2, 3].map((i) => <rect key={i} x={260 + i * 3 + slide * (440 + i * 20)} y={746 - i * 12} width={150} height={12} rx={2} fill={i % 2 ? C.paper : '#EFE6D2'} stroke={C.ink} strokeWidth={2.5} />)}
        <g transform={`translate(560,${880 + Math.sin(f / 14) * 1.5})`}>
          <path d="M -60 -40 L -20 0" stroke={C.ink} strokeWidth={44} strokeLinecap="round" />
          <path d="M -60 -40 L -20 0" stroke="#1C1A24" strokeWidth={34} strokeLinecap="round" />
          <ellipse cx={0} cy={8} rx={46} ry={20} fill="#B88A6A" stroke={C.ink} strokeWidth={4} />
          {[-24, -8, 8, 24].map((dx, i) => <path key={i} d={`M ${dx} 0 q 4 -16 2 -26`} stroke={C.ink} strokeWidth={3} fill="none" />)}
        </g>
        <rect x={-80} y={1000} width={1240} height={1000} fill="#B4BBAA" data-band="ok" />
        <Suit f={f} x={820} y={1320} s={1.1} seed={25} cues={[b26, b27]} coat="#3A3448" reach={reach * (1 - give * 0.4)} facing={-1} />
        <rect x={820 - 72} y={1320 - 1.1 * 205} width={44} height={20} rx={4} fill={C.marigold} stroke={C.ink} strokeWidth={3} />
        {reach > 0.05 && <Key x={kx} y={ky} s={0.9} rot={-30 + give * 20} />}
        <g data-band="ok">
          <rect x={-80} y={1560} width={1240} height={40} rx={6} fill="#D9D2C0" stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 12}, (_, i) => <rect key={i} x={-40 + i * 100} y={1600} width={22} height={320} fill="#A9A28E" stroke={C.ink} strokeWidth={3} />)}
        </g>
      </SVG>
      <SVG>
        <Lab text="JUDGE" x={540} y={470} size={20} />
        <Plate text="THE JUDGE · AUCTION RULES APPROVED" x={540} y={1060} p={win(f, b25)} /> {/* plate-overlap-ok */}
        <Plate text="OVER STATE AGS' OBJECTIONS" x={540} y={1140} p={win(f, b39)} /> {/* plate-overlap-ok */}
        <Plate text="CAN'T BLOCK THE SALE" x={540} y={600} p={win(f, b26)} /> {/* plate-overlap-ok */}
        <Plate text="ADVISES · THE JUDGE DECIDES" x={540} y={680} p={win(f, b27)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S13, 2015: from above under a cold strip light, a drawer slides open, an FTC letter lands on a RadioShack receipt, a pencil underlines the promise */
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b28 = b(28), b40 = b(40), b29 = b(29);
  const slide = ease(f, b28 - 6, 26);
  const letter = ease(f, b40, 16);
  const pencil = ease(f, b29, 26);
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.06, fx: 540, fy: 1000}])} bloom={0.04} bg="#2E3436" warmth={0.0}>
      <SVG>
        <rect x={-80} y={-80} width={1240} height={2080} fill="#3A4244" data-band="ok" />
        <rect x={-80} y={20} width={1240} height={40} fill="#E8F0F2" opacity={0.85} />
        <rect x={-80} y={60} width={1240} height={500} fill="#E8F0F2" opacity={0.06} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={60 + i * 330} y={160} width={300} height={260} rx={8} fill="#5A6264" stroke={C.ink} strokeWidth={5} />
            <rect x={150 + i * 330} y={260} width={120} height={36} rx={6} fill={LOT.bronze} stroke={C.ink} strokeWidth={3} />
            <text x={210 + i * 330} y={236} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill="#C9D2D4">{['2013', '2014', '2016'][i]}</text>
          </g>
        ))}
        <HeldTravel f={f} x={200} y={600} w={680} h={760} mode="shadow">
          <g transform={`translate(540,${lerp(560, 1000, slide)})`}>
            <rect x={-340} y={-380} width={680} height={760} rx={10} fill="#6A7274" stroke={C.ink} strokeWidth={6} />
            <rect x={-320} y={-360} width={640} height={720} rx={6} fill="#2E3436" stroke={C.ink} strokeWidth={3} />
            <rect x={-120} y={340} width={240} height={50} rx={8} fill={LOT.bronze} stroke={C.ink} strokeWidth={4} />
            <text x={0} y={376} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} fill={C.ink}>2015</text>
            {Array.from({length: 14}, (_, i) => <circle key={i} cx={-280 + h01(i, 3) * 560} cy={-300 + ((f * 1.5 + h01(i, 4) * 600) % 600)} r={2.5} fill="#E8F0F2" opacity={0.5 * slide} />)}
            <g transform="translate(-20,-80)" opacity={slide}>
              <rect x={-190} y={-200} width={380} height={400} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} />
              <rect x={-190} y={-200} width={380} height={56} fill={LOT.claret} />
              <text x={0} y={-162} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} fill={LOT.cream}>RADIOSHACK</text>
              {Array.from({length: 6}, (_, i) => <rect key={i} x={-160} y={-120 + i * 30} width={240} height={10} rx={4} fill="#B9B0A0" />)}
              <rect x={-160} y={80} width={320} height={10} rx={4} fill="#8A8070" />
              <rect x={-160} y={98} width={320 * pencil} height={5} rx={2} fill={C.ink} />
            </g>
            <g transform={`translate(${lerp(500, 120, letter)},${lerp(-500, 20, letter)}) rotate(${lerp(30, 8, letter)})`} opacity={letter > 0 ? 1 : 0}>
              <rect x={-120} y={-80} width={240} height={160} rx={4} fill="#F4F6F2" stroke={C.ink} strokeWidth={4} />
              <text x={-60} y={-36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>FTC</text>
              {Array.from({length: 4}, (_, i) => <rect key={i} x={-100} y={-8 + i * 20} width={190} height={8} rx={3} fill="#B9B0A0" />)}
            </g>
            <g transform={`translate(${-180 + pencil * 320},${-80 + 100}) rotate(-35)`} opacity={pencil > 0 ? 1 : 0}>
              <rect x={0} y={-8} width={180} height={16} rx={3} fill="#E8B84A" stroke={C.ink} strokeWidth={3} />
              <path d="M 0 -8 L -24 0 L 0 8 Z" fill="#E9D2AE" stroke={C.ink} strokeWidth={3} />
            </g>
          </g>
        </HeldTravel>
        <rect x={-80} y={1480} width={1240} height={520} fill="#4A5254" data-band="ok" />
        {[0, 1, 2].map((i) => <rect key={i} x={90 + i * 330} y={1560} width={240} height={40} rx={8} fill={LOT.bronze} stroke={C.ink} strokeWidth={4} data-band="ok" />)}
      </SVG>
      <SVG>
        <Plate text="PRECEDENT · 2015" x={540} y={600} p={win(f, b28)} /> {/* plate-overlap-ok */}
        <Plate text="FTC · RADIOSHACK'S COURT" x={540} y={680} p={win(f, b40)} /> {/* plate-overlap-ok */}
        <Plate text={'"PROMISES NOT TO SELL" · FTC, 2015'} x={540} y={760} p={win(f, b29)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

/** S14, still raised: the folder opens to blank pages, a court card clips onto the hammer's catch, the camera rises as the paddle's shadow crosses the glass */
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const b30 = b(30), b31 = b(31), b32 = b(32), b33 = b(33);
  const slide = ease(f, b30, 30);
  const fold = ease(f, b31, 24);
  const card = ease(f, b32, 16);
  const ask = ease(f, b33 + 6, 20) * (1 - ease(f, p.dur - 14, 12));
  const shadowX = lerp(-500, 760, easeIO(f, b33 + 10, 60));
  return (
    <Frame p={p} cam={track([{t: 0, z: 1.1, fx: 640, fy: 1040}, {t: Math.max(1, b33 - 4), z: 1.06, fx: 600, fy: 980}, {t: p.dur, z: 1.0, fx: 540, fy: 920}])} bloom={0.08} bg={C.walnut}>
      <SVG>
        <AuctionHall f={f} seed={14} showWindow={false} winX={120} winW={380} winY={300} spotX={lerp(160, 640, slide)} spotY={1300} />
        <g opacity={1 - slide * 0.4}>
          <rect x={30} y={1200} width={260} height={100} rx={8} fill={LOT.claret} stroke={C.ink} strokeWidth={5} />
          <LicenseCrate f={f} x={160} y={1200} scale={0.5} spin={0.5} />
          <g transform={`translate(${Math.sin(clamp01((f - b30) / 12) * Math.PI * 3) * 4 * (1 - clamp01((f - b30) / 12))},0)`}><rect x={330} y={640} width={26} height={660} fill={C.glass} opacity={0.45} stroke={C.ink} strokeWidth={4} /></g>
        </g>
        <HallHammer f={f} x={640} y={560} bx={1060} by={330} s={0.9} card={card} dip={0.3} weight={1} />
        <Turntable f={f} x={640} y={1300} w={460} />
        <HeldTravel f={f} x={480} y={700} w={320} h={600} mode="sweep">
          <GlassCase f={f} x={640} y={1290} scale={0.92} frost={0.25}>
            <Bub f={f} x={0} y={-150} scale={0.9} emotion={ask > 0.5 ? 'wondering' : 'hopeful'} ask={ask} ellipsis={0.4} cues={[b30, b31, b32, b33]} seed={14} look={-0.3} />
          </GlassCase>
        </HeldTravel>
        <RefTag f={f} x={640 + 0.92 * 100} y={1290 - 0.92 * 156} k={1} s={0.85} />
        <RefChair f={f} x={1010} y={1290} s={0.55} folder={1 - fold} />
        <Suit f={f} x={900} y={1300} s={0.82} seed={27} cues={[b31, b33]} coat="#3A3448" reach={0.4 + fold * 0.3} facing={-1} />
        <rect x={900 - 54} y={1300 - 0.82 * 205} width={34} height={16} rx={4} fill={C.marigold} stroke={C.ink} strokeWidth={3} />
        <g transform={`translate(830,${1090 - fold * 40})`} opacity={fold > 0.02 ? 1 : 0}>
          <rect x={-60 - fold * 50} y={-20} width={120 + fold * 100} height={30 + fold * 80} rx={4} fill={C.marigold} stroke={C.ink} strokeWidth={4} />
          <rect x={-50 - fold * 44} y={-10} width={100 + fold * 88} height={20 + fold * 64} rx={3} fill={C.paper} opacity={fold} stroke={C.ink} strokeWidth={2} />
          {fold > 0.6 && <text x={0} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.ink} opacity={clamp01((fold - 0.6) * 2.5)}>SAFEGUARDS · DUE TO THE COURT</text>}
        </g>
        <path d={`M ${shadowX} 700 L ${shadowX + 200} 700 L ${shadowX + 280} 1220 L ${shadowX + 80} 1220 Z`} fill={C.ink} opacity={0.2 * clamp01((f - b33 - 10) / 10)} />
        <NearRope f={f} seed={14} props="paddles" />
      </SVG>
      <SVG>
        <Plate text="THE DISNEY BID SKIPPED THE CHATS" x={540} y={600} p={win(f, b30, b31)} /> {/* plate-overlap-ok */}
        <Plate text="THE REVIEW COVERS THE CHATS" x={540} y={680} p={win(f, b31)} /> {/* plate-overlap-ok */}
        <Plate text="SALE HEARING · DECEMBER 3RD AND 4TH" x={540} y={760} p={win(f, b32)} /> {/* plate-overlap-ok */}
        <Plate text="WHICH SAFEGUARDS HOLD · UP TO THE JUDGE" x={540} y={840} p={win(f, b33)} /> {/* plate-overlap-ok */}
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

export const ep1120Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1120Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1120: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 6.7, 14.66, 22.48, 30.76, 43.22, 49.1, 54.5, 65.84, 72.64, 78.18, 87.6, 96.74, 105.2, 117].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#2B1B2E" ink="#FFF8EA" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
