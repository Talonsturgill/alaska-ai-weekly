import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, DayGrade} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {StudyLens, LENS, LensHandSpec} from './lib/scope';
import {PierDawn, StudySheet, BurnBeam, SheetLine, PC, SUN} from './lib/pier';
import {GripHand} from './lib/props';
import {Beluga} from './lib/fauna';

// WHO WRITES THE STUDY, 2026-10-08. Palette roles are art_direction.json. THE LENS is the only saturated yellow round form.
// Hands are identified by cuff: developer dark slate, CBD field green, alliance orange glove, borough navy, authority dotted.
// Every painted string is a claims.json on_screen string, a quote, or a plain label. 'NO LABEL, PICTURE ONLY' is never painted.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const C = {
  ...PC,
  hero: LENS.rim,
  deskShade: '#3D4C52',
  pinLit: '#B9B08C',
  pinDim: '#5E625A',
  cuffDev: '#2B3440',
  cuffCbd: '#4F7A55',
  glove: '#D9742B',
  cuffBor: '#2C4A6B',
  cuffAgency: '#8A8F92',
  phoneGlow: '#EADFB4',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const spring = (f: number, a: number, d = 20) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.pow(2, -9 * t) * Math.cos((t * d - 1.2) * 0.9);
};
const hash = (i: number) => {
  let x = (Math.floor(i) + 1013) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
const rnd = (i: number) => (hash(i) % 10000) / 10000;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const jolt = (f: number, a: number, amp = 1, d = 14) => (f >= a && f < a + d ? amp * Math.sin(((f - a) / d) * Math.PI * 3) * Math.exp(-(f - a) / (d * 0.45)) : 0);
/** a damped pendulum that starts at amp degrees at frame a */
const pend = (f: number, a: number, amp: number, period = 34, decay = 46) => (f < a ? 0 : amp * Math.exp(-(f - a) / decay) * Math.cos(((f - a) / period) * Math.PI * 2));

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'paper' | 'stamp' | 'amber';
const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: C.ink, fg: C.paper},
  paper: {fill: C.paper, fg: C.ink},
  stamp: {fill: C.stamp, fg: C.paper},
  amber: {fill: C.amber, fg: C.ink},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 30, tone = 'ink', p = 1, rot = 0, drop = 0}) => {
  const ls = displayLines ?? [text];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const sc = 0.84 + 0.16 * spring(k * 20, 0, 20);
  return (
    <g opacity={Math.min(1, k * 1.6)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={C.ink} strokeWidth={4} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

/** A boxed quote, serif on paper with the attribution under it. `text` is "quote · attribution". */
const QuotePlate: React.FC<{text: string; x?: number; y: number; size?: number; wrap?: number; p?: number; rot?: number}> =
({text, x = 540, y, size = 34, wrap = 30, p = 1, rot = 0}) => {
  const parts = text.split(' · ');
  const by = parts.length > 1 ? parts.slice(1).join(' · ') : undefined;
  const lines: string[] = [];
  let cur = '';
  parts[0].split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > wrap) { lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const tw = Math.min(1000, Math.max(...lines.map((l) => l.length * size * 0.68), by ? monoW(by, 20) : 0) + 80);
  const th = lines.length * (size + 10) + (by ? 46 : 0) + 36;
  const yy = Math.min(y, CAP_GUARD - th / 2);
  assertCropSafe(lines.join(' '), yy - th / 2, yy + th / 2);
  const sc = 0.6 + 0.4 * spring(k * 18, 0, 18);
  return (
    <g transform={`translate(${x},${yy}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, k * 2)}>
      <rect x={-tw / 2 + 10} y={-th / 2 + 12} width={tw} height={th} fill="#000" opacity={0.3} />
      <rect x={-tw / 2} y={-th / 2} width={tw} height={th} fill={C.paper} stroke={C.ink} strokeWidth={7} />
      <rect x={-tw / 2 + 11} y={-th / 2 + 11} width={tw - 22} height={th - 22} fill="none" stroke={C.ink} strokeWidth={2.2} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-th / 2 + 22 + size * 0.86 + i * (size + 10)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={C.ink}>{l}</text>
      ))}
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={1} fill={C.stamp}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: push, kick, grade ---------------------------------------------------------
type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};
const Frame: React.FC<{p: SP; z0?: number; z1?: number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; day?: number; bloom?: number; vignette?: number; children: React.ReactNode}> =
({p, z0 = 1, z1 = 1.05, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, day = 0.45, bloom = 0.05, vignette = 0.3, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const z = lerp(z0, z1, t);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + lerp(dx0, dx1, t)}px, ${jl.y + lerp(dy0, dy1, t)}px) scale(${z * jl.scale})`, transformOrigin: '540px 960px'}}>
        {children}
      </div>
      {day > 0 && <DayGrade f={p.f} sky="#D8D0B4" bounce="#9A7A52" amount={day} floor={0.3} haze={0.12} sunX={SUN.x} sunY={SUN.y} sunIntensity={0.35} />}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.04} />
    </AbsoluteFill>
  );
};

// ---- the pier: the lens, the sheet, the beam and the hands, parameterised per shot ----------------------------------
type Pose = {x: number; y: number; s: number; rot: number};
type PierProps = {
  f: number;
  view?: 'front' | 'overhead' | 'three';
  lens: Pose;
  handleDeg?: number;
  hands?: LensHandSpec[];
  sheet?: {x: number; y: number; w?: number; h?: number; rot?: number; lines?: SheetLine[]; hang?: number; pulse?: number};
  spot?: {x: number; y: number} | null;
  beam?: number;
  jitter?: number;
  cloud?: number;
  paperWash?: number;
  glass?: React.ReactNode;
  clock?: number;
  children?: React.ReactNode;
  under?: React.ReactNode;
  lensOpacity?: number;
  rimText?: string;
  wedge?: number;
  ring?: number;
  sheetSkew?: number;
};
const R0 = 300;
const GlassInlet: React.FC<{f: number; boat?: boolean}> = ({f, boat = true}) => (
  <g>
    <rect x={-R0} y={-R0} width={2 * R0} height={R0 - 10} fill={C.sky} />
    <circle cx={-140} cy={-110} r={34} fill="#FFF7E6" opacity={0.9} />
    <rect x={-R0} y={-30} width={2 * R0} height={R0 + 40} fill={C.water} />
    <rect x={-R0} y={-30} width={2 * R0} height={22} fill={C.horizon} />
    {Array.from({length: 7}, (_, i) => <rect key={i} x={-120 + i * 26 + 10 * Math.sin(f / 14 + i)} y={-6 + i * 24} width={50 - i * 3} height={4} fill={C.peach} opacity={0.5} />)}
    {boat && (
      <g transform={`translate(70,${44 + 5 * Math.sin(f / 20)}) scale(1.5)`}>
        <path d="M-46,0 L46,0 L36,18 L-34,18 Z" fill={C.slate} stroke={C.ink} strokeWidth={3} />
        <rect x={-12} y={-24} width={26} height={24} fill="#55666C" stroke={C.ink} strokeWidth={3} />
        <path d="M2,-24 L2,-58" stroke={C.ink} strokeWidth={3} />
      </g>
    )}
  </g>
);

const PierShot: React.FC<PierProps> = ({f, view = 'front', lens, handleDeg = 24, hands = [], sheet, spot, beam = 1, jitter = 0, cloud = 0, paperWash = 0, glass, clock, children, under, lensOpacity = 1, rimText, wedge = 0, ring = 1, sheetSkew = 0}) => {
  const Reff = R0 * lens.s;
  return (
    <g>
      <PierDawn f={f} view={view} cloud={cloud} paperWash={paperWash} />
      {under}
      {/* the lens shadow falls to the lower right of the lens onto the deck, beneath the sheet */}
      <g opacity={0.26 * lensOpacity}>
        <ellipse cx={lens.x + 22} cy={view === 'overhead' ? lens.y + 21 : 1362} rx={Reff * 0.95} ry={view === 'overhead' ? Reff * 0.95 : 30} fill="#000" />
      </g>
      {sheet && (
        <g transform={`translate(${sheet.x + (sheet.w ?? 560) / 2} ${sheet.y + (sheet.h ?? 300) / 2}) scale(1 ${1 - 0.22 * sheetSkew}) skewX(${-10 * sheetSkew}) translate(${-(sheet.x + (sheet.w ?? 560) / 2)} ${-(sheet.y + (sheet.h ?? 300) / 2)})`}>
          <StudySheet f={f} {...sheet} />
        </g>
      )}
      {spot && beam > 0 && <BurnBeam f={f} lens={{x: lens.x, y: lens.y, R: Reff}} spot={spot} intensity={beam} jitter={jitter} wisp={beam} />}
      <g opacity={lensOpacity}>
        <StudyLens f={f} x={lens.x} y={lens.y + 3 * Math.sin(f / 23)} s={lens.s} rot={lens.rot + 0.8 * Math.sin(f / 37)} R={R0} handleDeg={handleDeg} HL={520} hands={hands}
          glass={glass ?? <GlassInlet f={f} />} clock={clock} rimText={rimText} wedge={wedge} ring={ring} />
      </g>
      {children}
    </g>
  );
};

// ---- S1: the lens swings in over a blank sheet and the focal spot searches -----------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const swing = ease(f, 0, 30);
  const lens: Pose = {x: lerp(760, 520, swing), y: lerp(380, 830, swing) + 6 * Math.sin(f / 24), s: 0.8, rot: pend(f, 8, 26, 36, 40) + 3};
  const t2 = b(3);
  const sp = clamp01((f - t2) / 60);
  const spot = {x: lerp(330, 760, easeIO(sp * 1, 0, 1) * 0 + sp) + 28 * Math.sin(f / 6), y: 1190 + 70 * Math.sin(sp * Math.PI * 2.5) + 10 * Math.sin(f / 4)};
  const beam = ease(f, 18, 10);
  const plate = ease(f, b(2), 12);
  return (
    <Frame p={p} z0={1.03} z1={1.0}>
      <SVG>
        <PierShot f={f} lens={lens} spot={f > t2 - 10 ? spot : {x: 330, y: 1190}} beam={beam}
          hands={[{kind: 'dev', at: 0.3, side: -1, reach: ease(f, 0, 26), tag: 'DEEPGREEN'}]}
          sheet={{x: 250, y: 1030, w: 560, h: 300, rot: -2, lines: []}} />
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#FFF4DA" opacity={0.55 * Math.max(0, Math.sin(clamp01((f - 3) / 12) * Math.PI))} />
        <Plate text="WHO WRITES THE STUDY" y={520} size={40} tone="paper" p={plate} drop={80} />
      </SVG>
    </Frame>
  );
};

// ---- the federal docket desk -----------------------------------------------------------------------------------
const DeskWorld: React.FC<{f: number; top?: number}> = ({f, top = 1010}) => (
  <g>
    <defs>
      <linearGradient id="dkWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#566871" /><stop offset="1" stopColor="#33424A" /></linearGradient>
      <linearGradient id="dkTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8A6643" /><stop offset="1" stopColor="#4A3523" /></linearGradient>
      <radialGradient id="dkLamp" cx="0.5" cy="0" r="1"><stop offset="0" stopColor={C.peach} stopOpacity="0.55" /><stop offset="1" stopColor={C.peach} stopOpacity="0" /></radialGradient>
      <linearGradient id="dkWin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9C79A" /><stop offset="1" stopColor={C.peach} /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={top + 40} fill="url(#dkWall)" />
    <rect x={-40} y={top - 150} width={1160} height={150} fill="#2D3A41" />
    <rect x={-40} y={top - 156} width={1160} height={10} fill="#718087" />
    <rect x={-30} y={190} width={290} height={470} fill="url(#dkWin)" stroke={C.ink} strokeWidth={8} />
    <path d="M115,190 V660 M-30,425 H260" stroke={C.ink} strokeWidth={8} />
    <circle cx={60} cy={540} r={70} fill="#FFF4DA" opacity={0.85} />
    <polygon points="-30,660 260,660 520,1000 120,1000" fill={C.peach} opacity={0.1} />
    <rect x={-30} y={656} width={300} height={16} fill="#2A353B" />
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${470 + i * 190},300) rotate(${i % 2 ? 1.4 : -1.1})`}>
        <rect x={0} y={0} width={150} height={190} fill="#E8E4D4" stroke={C.ink} strokeWidth={5} />
        {[0, 1, 2, 3, 4, 5].map((k) => <path key={k} d={`M16,${34 + k * 24} H${100 + (k % 3) * 20}`} stroke={C.ink} strokeWidth={4} opacity={0.35} />)}
      </g>
    ))}
    <rect data-band="ok" x={-40} y={top} width={1160} height={1000} fill="url(#dkTop)" />
    <rect x={-40} y={top} width={1160} height={10} fill="#A3814F" />
    {Array.from({length: 16}, (_, i) => <path key={i} d={`M${-20 + i * 76},${top + 14 + rnd(i) * 30} l${40 + rnd(i + 3) * 70},${rnd(i + 5) * 12 - 6}`} stroke="#3A2A1B" strokeWidth={2.5} opacity={0.3} />)}
    {/* the lamp, slate shaded, with a peach pool of light */}
    <g transform="translate(900,0)">
      <polygon points="-70,600 70,600 260,1180 -260,1180" fill="url(#dkLamp)" opacity={0.7} />
      <path d="M0,640 L0,900 L-34,940 M-34,940 L-34,1004 H34 V940 L0,900" fill="none" stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
      <path d="M-82,640 Q0,540 82,640 Z" fill={C.deskShade} stroke={C.ink} strokeWidth={7} />
      <path d="M-60,624 Q0,566 60,624" fill="none" stroke="#7E919A" strokeWidth={5} opacity={0.8} />
      <ellipse cx={0} cy={1010} rx={90} ry={16} fill="#000" opacity={0.3} />
    </g>
  </g>
);

const BlotterAndPens: React.FC<{f: number; jump?: number}> = ({f, jump = 0}) => (
  <g>
    <rect x={120} y={1060} width={820} height={270} fill="#E4DFCD" stroke={C.ink} strokeWidth={5} />
    <rect x={120} y={1060} width={820} height={14} fill="#fff" opacity={0.35} />
    <ellipse cx={200} cy={1380} rx={100} ry={14} fill="#000" opacity={0.22} />
    <g transform={`translate(190,${1312 - 20 * jump}) rotate(${-8 + 16 * jump})`}>
      <rect x={-70} y={-9} width={140} height={18} rx={9} fill={C.stamp} stroke={C.ink} strokeWidth={4} />
      <rect x={52} y={-9} width={22} height={18} rx={4} fill="#C9C3B0" stroke={C.ink} strokeWidth={3} />
    </g>
    <g transform={`translate(260,${1346 - 16 * jump}) rotate(${6 - 12 * jump})`}>
      <rect x={-60} y={-8} width={120} height={16} rx={8} fill={C.deskShade} stroke={C.ink} strokeWidth={4} />
    </g>
  </g>
);

const Folder: React.FC<{x: number; y: number; s?: number; rot?: number; tab?: string; tone?: string; stamped?: number; permit?: number; f?: number}> = ({x, y, s = 1, rot = 0, tab = 'DEEPGREEN', tone = C.cuffDev, stamped = 0, permit = 0, f = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={14} cy={170} rx={250} ry={20} fill="#000" opacity={0.3} />
    <path d="M-230,-140 H-60 L-30,-176 H70 L96,-140 H230 V150 H-230 Z" fill={tone} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-222,-132 H222" stroke="#fff" strokeWidth={4} opacity={0.18} />
    <rect x={-220} y={110} width={440} height={30} fill="#000" opacity={0.16} />
    <rect x={-26} y={-168} width={96} height={30} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <text x={22} y={-146} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={Math.min(20, 90 / (tab.length * 0.62))} fill={C.ink}>{tab}</text>
    {stamped > 0 && (
      <g transform={`rotate(-7) scale(${1 + 0.16 * (1 - stamped)})`} opacity={clamp01(stamped * 1.4)}>
        <rect x={-212} y={-62} width={424} height={100} fill="none" stroke={C.stamp} strokeWidth={8} />
        <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={64} letterSpacing={4} fill={C.stamp}>ACCEPTED</text>
      </g>
    )}
    {permit > 0 && (
      <g transform={`translate(${lerp(420, 150, permit)},${lerp(-50, 118, permit)}) rotate(${lerp(18, -2, permit)}) scale(0.82)`}>
        <rect x={-150} y={-62} width={300} height={124} fill={C.paper} stroke={C.ink} strokeWidth={5} />
        <rect x={-150} y={-62} width={300} height={22} fill={C.stamp} />
        <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={46} letterSpacing={2} fill={C.ink}>STUDY</text>
        <path d="M-150,-62 V-96 H-110 V-62" fill="none" stroke="#9AA3A6" strokeWidth={6} />
      </g>
    )}
  </g>
);

/** a hand stamp: wooden knob, shaft and a base plate, hanging from above on an arm */
const HandStamp: React.FC<{x: number; y: number; s?: number; label?: string; inked?: boolean}> = ({x, y, s = 1, label, inked = true}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={150} ry={18} fill="#000" opacity={0.0} />
    <rect x={-24} y={-250} width={48} height={150} rx={20} fill="#6A4E33" stroke={C.ink} strokeWidth={6} />
    <rect x={-14} y={-244} width={10} height={130} rx={5} fill="#B79468" opacity={0.7} />
    <rect x={-18} y={-110} width={36} height={60} fill="#2E3A40" stroke={C.ink} strokeWidth={5} />
    <path d="M-150,-52 H150 V0 H-150 Z" fill="#2E3A40" stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-140,-44 H140" stroke="#7E919A" strokeWidth={4} opacity={0.7} />
    {inked && <rect x={-146} y={-4} width={292} height={8} fill={C.stamp} />}
    {label && <text x={0} y={-16} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={4} fill="#C9D3D6">{label}</text>}
  </g>
);

const Dust: React.FC<{x: number; y: number; t: number; n?: number; col?: string}> = ({x, y, t, n = 9, col = '#D9CDB0'}) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <g opacity={1 - t}>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + rnd(i) * 0.6;
        const d = 30 + 90 * t * (0.6 + rnd(i + 4));
        return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d * 0.5 - 30 * t} r={5 + 8 * rnd(i + 2) * (1 - t)} fill={col} />;
      })}
    </g>
  );
};

// ---- S2: the DeepGreen folder slides in and the ACCEPTED stamp slams ----------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slide = ease(f, 0, 40);
  const fx = lerp(-340, 540, slide) + (f > 36 && f < 50 ? -10 * Math.sin(((f - 36) / 14) * Math.PI) : 0);
  const hit = b(5);
  const rise = easeIO(f, hit - 34, 24);
  const drop = ease(f, hit - 9, 9);
  const stampY = lerp(760, 470, rise) + (1 - 0) * 0;
  const sy = f < hit - 9 ? stampY : lerp(470, 922, drop);
  const jl = jolt(f, hit, 6, 16);
  const mark = clamp01((f - hit) / 6);
  const platep = ease(f, hit + 8, 12);
  const dust = (f - hit) / 22;
  const sw = f < hit - 30 ? 8 * Math.sin(f / 9) : 0;
  return (
    <Frame p={p} z0={1.02} z1={1.07} dx0={-24} dx1={26} day={0.3}>
      <SVG>
        <DeskWorld f={f} />
        <BlotterAndPens f={f} jump={f >= hit && f < hit + 12 ? Math.sin(((f - hit) / 12) * Math.PI) : 0} />
        <g transform={`translate(0,${jl * 3})`}>
          <Folder x={fx} y={1180} s={1.02} tab="DEEPGREEN" stamped={mark} f={f} />
        </g>
        <g transform={`translate(${sw},0)`}><HandStamp x={540} y={sy} s={1.05} /></g>
        <Dust x={540} y={1160} t={dust} />
        <Plate text="DEEPGREEN" y={560} size={30} tone="paper" p={ease(f, 12, 12)} />
        <Plate text="FERC ACCEPTED THE FILING · SEPTEMBER 1ST" displayLines={['FERC ACCEPTED THE FILING', 'SEPTEMBER 1ST']} y={780} size={30} tone="stamp" p={platep} drop={40} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the APPROVED stamp sits unused while the STUDY card clips on --------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const clip = ease(f, b(12) - 6, 22);
  const bounce = jolt(f, b(12) + 14, 5, 14);
  const dustY = (f * 1.3) % 120;
  return (
    <Frame p={p} z0={1.0} z1={1.09} day={0.3}>
      <SVG>
        <DeskWorld f={f} top={980} />
        <rect x={80} y={1010} width={920} height={300} fill="#E4DFCD" stroke={C.ink} strokeWidth={5} />
        <g transform={`translate(0,${bounce})`}><Folder x={400} y={1130} s={0.95} tab="DEEPGREEN" stamped={1} permit={clip} f={f} /></g>
        {/* the tray: an unused APPROVED stamp beside a dry pad */}
        <g transform="translate(790,1140)">
          <path d="M-210,-70 H210 V70 H-210 Z" fill="#2C373D" stroke={C.ink} strokeWidth={6} />
          <path d="M-196,-56 H196 V56 H-196 Z" fill="#1F2A30" />
          <ellipse cx={0} cy={86} rx={220} ry={14} fill="#000" opacity={0.3} />
          <rect x={-170} y={-30} width={130} height={70} rx={8} fill="#D9D5C6" stroke={C.ink} strokeWidth={5} />
          <text x={-105} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill="#8D8B80">DRY</text>
          <g transform="translate(70,-6) scale(0.62)"><HandStamp x={0} y={0} label="APPROVED" inked={false} /></g>
        </g>
        <circle cx={800} cy={600 + dustY} r={4} fill="#E3D9C0" opacity={0.7} />
        <circle cx={850} cy={680 + ((dustY + 40) % 120)} r={3} fill="#E3D9C0" opacity={0.6} />
        <Plate text="ACCEPTED NOT APPROVED" y={540} size={32} tone="paper" p={ease(f, 8, 12)} drop={50} />
        <Plate text="APPLICATION FOR A STUDY PERMIT · NO CONSTRUCTION AUTHORITY" displayLines={['APPLICATION FOR A STUDY PERMIT', 'NO CONSTRUCTION AUTHORITY']} y={760} size={30} tone="stamp" p={ease(f, b(12) + 14, 12)} drop={40} />
      </SVG>
    </Frame>
  );
};

// ---- the water column: proposal hardware drawn dashed and shadowless -----------------------------------------------
const DASH = '16 11';
const Rotor: React.FC<{x: number; y: number; s?: number; f: number; spin?: number; lit?: number}> = ({x, y, s = 1, f, spin = 1, lit = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={0.5 + 0.5 * lit}>
    <path d="M0,70 V230 M-56,230 H56" fill="none" stroke={C.glow} strokeWidth={8} strokeLinecap="round" strokeDasharray={DASH} />
    <circle r={70} fill="none" stroke={C.glow} strokeWidth={6} strokeDasharray={DASH} />
    <g transform={`rotate(${f * 3.2 * spin})`}>
      {[0, 120, 240].map((a) => <path key={a} d="M0,0 Q22,-19 18,-62 Q-16,-54 -18,-12 Z" transform={`rotate(${a})`} fill={C.glow} fillOpacity={0.14 + 0.2 * lit} stroke={C.glow} strokeWidth={4} />)}
    </g>
    <circle r={12} fill={C.pinLit} stroke={C.ink} strokeWidth={4} />
  </g>
);
const Hive: React.FC<{x: number; y: number; s?: number; lit?: number; f?: number}> = ({x, y, s = 1, lit = 0, f = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-70,-44 L0,-82 L70,-44 V44 L0,82 L-70,44 Z" fill={C.glow} fillOpacity={0.07 + 0.12 * lit} stroke={C.glow} strokeWidth={5} strokeDasharray={DASH} />
    <path d="M-44,-40 H44 V40 H-44 Z" fill="none" stroke={C.glow} strokeWidth={3} strokeDasharray="9 8" opacity={0.7} />
    {[-22, 22].map((cx, i) => <circle key={i} cx={cx} cy={-8} r={9} fill={lit > 0.3 ? C.pinLit : C.pinDim} opacity={0.5 + 0.5 * lit * (0.75 + 0.25 * Math.sin(f / 5 + i))} />)}
  </g>
);

const WaterWorld: React.FC<{f: number; seabed?: number; ray?: number}> = ({f, seabed = 1180, ray = 1}) => (
  <g>
    <defs>
      <linearGradient id="wcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C8056" /><stop offset="0.28" stopColor={C.water} /><stop offset="1" stopColor="#262A18" /></linearGradient>
      <linearGradient id="wcr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.peach} stopOpacity="0.5" /><stop offset="1" stopColor={C.peach} stopOpacity="0" /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="url(#wcg)" />
    {[0, 1, 2, 3].map((i) => <polygon key={i} points={`${120 + i * 250 + 20 * Math.sin(f / 40 + i)},0 ${190 + i * 250 + 20 * Math.sin(f / 40 + i)},0 ${60 + i * 250},1100 ${-60 + i * 250},1100`} fill="url(#wcr)" opacity={0.2 * ray} />)}
    <path d={`M-40,${seabed} Q200,${seabed - 70} 420,${seabed - 20} T820,${seabed - 40} T1120,${seabed - 90} V1960 H-40 Z`} fill="#3A3A22" stroke="#1D1E10" strokeWidth={5} />
    <path d={`M-40,${seabed + 40} Q300,${seabed + 6} 600,${seabed + 50} T1120,${seabed + 20} V1960 H-40 Z`} fill="#2C2D18" />
    {Array.from({length: 26}, (_, i) => <circle key={i} cx={(rnd(i * 5) * 1200 + f * (0.2 + rnd(i) * 0.4)) % 1200 - 60} cy={(rnd(i * 7) * 1100 + 1100 - f * (0.4 + rnd(i + 2) * 0.8) * 0.5) % 1100 + 80} r={2 + rnd(i + 9) * 4} fill="#C7C29A" opacity={0.28} />)}
  </g>
);

// ---- S3: one rotor spins up, a hundred megawatts, sixty-six hives, the array pulls back across the throat -----------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pull = easeIO(f, b(9) - 30, 96);
  const zoom = lerp(2.4, 1, pull);
  const start = ease(f, 0, 20);
  const units = clamp01((f - b(8)) / 70);
  const count = Math.floor(66 * units);
  const reel = Math.min(100, Math.round(100 * ease(f, b(7), 26)));
  const bracket = ease(f, b(10), 40);
  const rows = [0, 1, 2];
  return (
    <Frame p={p} z0={1.0} z1={1.05} day={0.2}>
      <SVG>
        <WaterWorld f={f} />
        <g transform={`translate(540,760) scale(${zoom}) translate(-540,-760)`}>
          {/* the throat: shore on both sides, the array between */}
          <path d="M-40,520 Q160,640 260,860 L260,1180 H-40 Z" fill="#33331D" opacity={0.0} />
          {rows.map((r) => (
            Array.from({length: 7}, (_, i) => {
              const ix = 160 + i * 130 + r * 28;
              const iy = 880 + r * 120;
              const appear = clamp01((f - b(9) + 10 - (r * 7 + i * 3)) / 14);
              if (r === 0 && i === 3) return null;
              return <Rotor key={`${r}${i}`} x={ix} y={iy} s={0.42 + r * 0.06} f={f + i * 7} lit={start} spin={appear} />;
            })
          ))}
          <Rotor x={540} y={880} s={0.5} f={f} lit={start} />
          {Array.from({length: 66}, (_, i) => {
            const col = i % 11, row = Math.floor(i / 11);
            const hx = 120 + col * 84 + (row % 2) * 40;
            const hy = 1078 + row * 20 - 0;
            return <Hive key={i} x={hx} y={hy + row * 4} s={0.22} lit={i < count ? 1 : 0} f={f + i} />;
          })}
        </g>
        {/* the tight rotor at the open, before the pull back */}
        <g opacity={1 - pull}><Rotor x={540} y={860} s={2.6 * (1 - pull) + 0.6} f={f} lit={start} /></g>
        {/* three mile bracket across the throat */}
        <g opacity={bracket}>
          <path d={`M${lerp(540, 150, bracket)},470 H${lerp(540, 930, bracket)} M${lerp(540, 150, bracket)},450 V490 M${lerp(540, 930, bracket)},450 V490`} stroke={C.paper} strokeWidth={6} strokeLinecap="round" />
        </g>
        <Plate text="PROPOSED · 100 MW" y={560} size={32} tone="paper" p={ease(f, b(7), 10)} drop={40} />
        <g opacity={ease(f, b(7), 8) * (reel < 100 ? 1 : 0)}><rect x={440} y={600} width={200} height={50} fill={C.ink} stroke={C.paper} strokeWidth={3} /><text x={540} y={638} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} fill={C.paper}>{reel}</text></g>
        {f >= b(8) && <Plate text="66 HIVES" x={300} y={660} size={32} tone="ink" p={ease(f, b(8), 10)} />}
        {f >= b(9) && <Plate text="UP TO 350 TURBINES" x={680} y={760} size={30} tone="paper" p={ease(f, b(9) + 30, 12)} />}
        {f >= b(10) && <Plate text="ABOUT 3 MILES · NARROWEST POINT OF THE INLET · PER ADN" displayLines={['ABOUT 3 MILES', 'NARROWEST POINT OF THE INLET · PER ADN']} y={940} size={26} tone="ink" p={ease(f, b(10) + 14, 12)} />}
      </SVG>
    </Frame>
  );
};

// ---- pier shared state: the sheet keeps its lines from shot to shot ---------------------------------------------------
const LENS_Y = 830;
const LENS_FRONT: Pose = {x: 520, y: LENS_Y, s: 0.8, rot: 0};
const SHEET_FRONT = {x: 230, y: 1062, w: 620, h: 272, rot: -2};
const lineY = (n: number) => SHEET_FRONT.y + 86 + n * ((SHEET_FRONT.h - 120) / 4) + 32;
const SLOT_AT = 1.0;
/** the sheet's lines at global frame g: line one burned by the CBD tilt, line two by the orange glove, line three pencilled */
const sheetLines = (g: number, bt: (id: number) => number): SheetLine[] => [
  {text: 'TURBINE NOISE', burn: clamp01((g - bt(18)) / 45), cool: clamp01((g - bt(18) - 40) / 70)},
  {text: '1,300+ PERMITS', burn: clamp01((g - bt(22) - 8) / 45), cool: clamp01((g - bt(22) - 50) / 70)},
  {text: 'NOTICE', pencil: clamp01((g - bt(24)) / 40)},
];
const filers = (r: [number, number, number], t = 1): LensHandSpec[] => [
  {kind: 'dev', at: 0.0, side: -1, reach: 1, tag: 'DEEPGREEN'},
  {kind: 'cbd', at: 0.22, side: 1, reach: r[0] * t, tag: 'CBD'},
  {kind: 'alliance', at: 0.44, side: -1, reach: r[1] * t, tag: 'ALLIANCE'},
  {kind: 'borough', at: 0.66, side: 1, reach: r[2] * t, tag: 'BOROUGH'},
];
const GlassCBD: React.FC<{f: number; k: number}> = ({f, k}) => (
  <g>
    <rect x={-R0} y={-R0} width={2 * R0} height={2 * R0} fill={C.water} />
    <rect x={-R0} y={-R0} width={2 * R0} height={120} fill="#7C8056" opacity={0.7} />
    <g transform="translate(-60,-30) scale(0.55)"><Rotor x={0} y={0} s={1} f={f} lit={1} /></g>
    {[0, 1, 2, 3].map((i) => {
      const r = ((f * 1.6 + i * 34) % 140) * k;
      return <circle key={i} cx={-60} cy={-30} r={40 + r * 1.6} fill="none" stroke={C.glow} strokeWidth={4} opacity={Math.max(0, 0.7 - r / 160)} />;
    })}
    <g transform={`translate(110,70) scale(0.62)`}>
      <ellipse cx={0} cy={0} rx={96} ry={50} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      <path d={`M-60,-18 Q-30,-70 18,-58 Q54,-46 60,-12`} fill="#E6E4DA" stroke={C.ink} strokeWidth={4} />
      <circle cx={46 + 4 * Math.sin(f / 9)} cy={-4} r={7} fill={C.ink} />
      <path d="M72,8 q14,4 26,-6" fill="none" stroke={C.ink} strokeWidth={4} />
    </g>
  </g>
);

const AEATray: React.FC<{x: number; y: number; s?: number; f?: number}> = ({x, y, s = 1, f = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={58} rx={140} ry={13} fill="#000" opacity={0.28} />
    <path d="M-124,30 L-104,-26 H104 L124,30 V54 H-124 Z" fill={C.deskShade} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-100,-14 H100 L112,24 H-112 Z" fill="#1E2A30" stroke={C.ink} strokeWidth={4} />
    <path d="M-96,-10 H96" stroke="#7E919A" strokeWidth={4} opacity={0.5} />
    <path d="M-70,-26 V-62 H70 V-26" fill="none" stroke={C.ink} strokeWidth={6} />
    <rect x={-44} y={32} width={88} height={14} rx={3} fill="#8A969B" opacity={0.7} />
    <rect x={-100} y={58} width={200} height={4} fill="#fff" opacity={0.05} />
  </g>
);

const EmptySlot: React.FC<{x: number; y: number; rot: number; glow: number; f: number}> = ({x, y, rot, glow, f}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`} opacity={0.5 + 0.5 * glow}>
    <rect x={-34} y={-46} width={68} height={92} rx={14} fill={C.phoneGlow} fillOpacity={0.12 * glow + 0.04 * Math.sin(f / 5) * glow} stroke={C.phoneGlow} strokeWidth={5} strokeDasharray="10 9" />
  </g>
);

const handleAt = (lens: Pose, hd: number, at: number) => {
  const R = R0 * lens.s;
  const d = (150 + at * 260) * lens.s;
  const a = ((hd + lens.rot) * Math.PI) / 180;
  const sx = lens.x + (R - 6 * lens.s) * Math.cos(a), sy = lens.y + (R - 6 * lens.s) * Math.sin(a);
  return {x: sx + d * Math.cos(a), y: sy + d * Math.sin(a)};
};

// ---- S5: the sheet drops, the beam hovers over the first blank line and trembles ----------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const drop = spring(f, 0, 34);
  const sy = lerp(-420, 880, drop);
  const sheetRot = lerp(14, -1.5, drop);
  const tremble = 2.2 * Math.sin(f * 0.9) * ease(f, b(14), 20);
  const lens: Pose = {x: 500, y: 640, s: 0.95, rot: 2 + tremble + 3 * Math.sin(f / 30)};
  const cl = easeIO(f, b(15) - 14, 26) - easeIO(f, b(15) + 36, 30) * 0.4;
  const beam = ease(f, b(14), 18) * (1 - 0.85 * cl);
  const lx = 250 + 72 + 120 + 40 * Math.sin(f / 23);
  const ly = 880 + 86 + 47 + 2 * Math.sin(f * 1.1);
  return (
    <Frame p={p} z0={1.04} z1={1.0} day={0.3}>
      <SVG>
        <PierShot f={f} view="overhead" lens={lens} handleDeg={24} hands={[{kind: 'dev', at: 0.0, side: -1, reach: ease(f, 8, 24), tag: 'DEEPGREEN'}]}
          sheet={{x: 250, y: sy, w: 580, h: 330, rot: sheetRot, lines: [], pulse: 0}} spot={f > b(14) - 10 ? {x: lx, y: ly} : null} beam={beam}
          lensOpacity={1} />
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#2B2A30" opacity={0.34 * cl} />
        <Plate text="WHO PUTS THEM IN" y={1262} size={30} tone="paper" p={ease(f, b(15), 10)} drop={30} />
      </SVG>
    </Frame>
  );
};

// ---- S6: three hands grip, the CBD hand tilts the lens and the beam writes TURBINE NOISE on line one ---------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b, from, bt} = p;
  const g = f + from;
  const r: [number, number, number] = [spring(f, b(16) + 2, 22), spring(f, b(16) + 9, 22), spring(f, b(16) + 16, 22)];
  const tilt = ease(f, b(17), 22);
  const lens: Pose = {x: 520, y: 830, s: 0.8, rot: 11 * tilt + jolt(f, b(16) + 10, 2.2, 16)};
  const spotX = lerp(560, 340 + 150 * clamp01((g - bt(18)) / 45), tilt);
  const spot = {x: spotX, y: lineY(0) - 10};
  const glassK = ease(f, b(17), 20);
  return (
    <Frame p={p} z0={1.1} z1={1.0} dy0={-20} dy1={0} day={0.4}>
      <SVG>
        <PierShot f={g} lens={lens} hands={filers(r)} sheet={{...SHEET_FRONT, lines: sheetLines(g, bt)}} spot={spot} beam={ease(f, 0, 6)}
          glass={tilt > 0.05 ? <GlassCBD f={f} k={glassK} /> : <GlassInlet f={f} />} />
        {f < b(18) - 10 && <Plate text="3 MOTIONS TO INTERVENE · PER ADN" y={500} size={27} tone="paper" p={ease(f, b(16) + 10, 10)} drop={40} />}
        {f >= b(18) - 6 &&  <Plate text="" displayLines={['CBD MOTION', 'NOISE COULD INTERFERE WITH BELUGA FEEDING']} y={592} size={24} tone="paper" p={ease(f, b(18) - 6, 12)} drop={40} />}
      </SVG>
    </Frame>
  );
};

const Pins: React.FC<{dim: number; x: number; y: number; w: number; h: number}> = ({dim, x, y, w, h}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={0} y={0} width={w} height={h} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={5} />
    <path d={`M${w * 0.14},${h * 0.42} L${w * 0.3},${h * 0.2} L${w * 0.52},${h * 0.26} L${w * 0.7},${h * 0.18} L${w * 0.88},${h * 0.34} L${w * 0.78},${h * 0.52} L${w * 0.64},${h * 0.5} L${w * 0.56},${h * 0.78} L${w * 0.46},${h * 0.58} L${w * 0.3},${h * 0.62} Z`}
      fill="#CFC9B2" stroke={C.ink} strokeWidth={3} />
    {[[0.32, 0.4], [0.5, 0.34], [0.66, 0.34], [0.78, 0.4]].map(([px, py], i) => (
      <circle key={i} cx={w * px} cy={h * py} r={9} fill={i === 1 ? (dim > 0.5 ? C.pinDim : C.pinLit) : C.pinLit} stroke={C.ink} strokeWidth={3} opacity={i === 1 ? lerp(1, 0.55, dim) : 1} />
    ))}
  </g>
);

// ---- S9: a dotted hand reaches three times and never closes, a dark phone sits on the planks ------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b, from, bt} = p;
  const g = f + from;
  const reach = (t: number) => Math.max(0, Math.sin(clamp01((t) / 40) * Math.PI)) * 0.8;
  const t0 = b(26) + 8;
  const rch = f < t0 ? 0 : f < t0 + 40 ? reach(f - t0) : f < t0 + 80 ? reach(f - t0 - 40) : f < t0 + 120 ? reach(f - t0 - 80) : 0;
  const snap = ease(f, b(27), 10) * (1 - ease(f, b(27) + 16, 10));
  const lens: Pose = {x: 520, y: 860, s: 0.8, rot: 3 * Math.sin(f / 27)};
  const hands: LensHandSpec[] = [...filers([1, 1, 1]), {kind: 'agency', at: 0.9, side: 1, reach: Math.max(rch, 0.45 * snap), dotted: true}];
  const chip = ease(f, b(28), 14);
  return (
    <Frame p={p} z0={1.0} z1={1.07} dx0={20} dx1={-20} day={0.35}>
      <SVG>
        <PierShot f={g} lens={lens} hands={hands} sheet={{...SHEET_FRONT, lines: sheetLines(g, bt)}} spot={{x: 480, y: lineY(3) - 10}} beam={0.0}
          under={<AEATray x={165} y={1292} s={0.78} f={f} />}>
          <EmptySlot {...handleAt(lens, 24, SLOT_AT)} rot={24 + 90} glow={snap} f={f} />
        </PierShot>
        {f < b(28) - 4 && <Plate text="STATE ENERGY AUTHORITY · SAID IT WOULD INTERVENE" y={500} size={23} tone="paper" p={ease(f, b(26), 12)} drop={40} />}
        {f >= b(28) - 4 && <Plate text="AEA · NO CONTACT FROM DEEPGREEN · AUGUST · PER ADN" y={560} size={22} tone="ink" p={chip} drop={40} />}
      </SVG>
    </Frame>
  );
};

// ---- S12: too many hands, the lens stalls, the beam writes nothing and the sheet slides off the plank -------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b, from, bt} = p;
  const g = f + from;
  const grip = ease(f, 0, 8);
  const shake = Math.sin(f * 1.7) * 2.4 * (1 - ease(f, 30, 40));
  const slide = easeIO(f, b(34) + 22, 60);
  const lens: Pose = {x: 500, y: 790, s: 0.92, rot: shake};
  const sx = 250, sy = lerp(1020, 1160, slide);
  const pin = ease(f, b(35), 16);
  const lines = sheetLines(g, bt);
  return (
    <Frame p={p} z0={1.02} z1={1.06} day={0.3}>
      <SVG>
        <PierShot f={g} view="overhead" lens={lens} hands={filers([1, 1, 1], 1).map((h) => ({...h, reach: 1 - 0.05 * Math.sin(f * 2.4) * grip}))}
          sheet={{x: sx, y: sy, w: 580, h: 330, rot: lerp(-1, 7, slide), lines, hang: slide * 0.4}} spot={{x: 330 + 12 * Math.sin(f * 2.1), y: 960 + 14 * Math.cos(f * 1.7)}} beam={0.7} jitter={1}
          under={<g><rect data-band="ok" x={-40} y={1250} width={1160} height={720} fill={C.water} /><rect x={-40} y={1236} width={1160} height={20} fill={C.pierDk} />{Array.from({length: 8}, (_, i) => <rect key={i} x={40 + i * 140} y={1300 + (i % 3) * 40} width={80} height={4} fill={C.peach} opacity={0.35} />)}</g>} />
        <Pins x={800} y={560} w={230} h={170} dim={pin} />
        <Plate text="PUSH IN TOO EARLY · DEVELOPERS MAY SKIP ALASKA" y={496} size={22} tone="paper" p={pin} drop={30} />
      </SVG>
    </Frame>
  );
};

// ---- S15: the filers' hands stay, an orange glove drags the sheet back, one empty cuff slot gleams ------------------
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b, from, bt} = p;
  const g = f + from;
  const pull = easeIO(f, b(41) + 4, 50);
  const sx = 250, sy = lerp(1130, 1030, pull);
  const lens: Pose = {x: 520, y: 830, s: 0.8, rot: 2 * Math.sin(f / 31)};
  const glow = 0.5 + 0.5 * Math.sin(f / 9);
  const hands: LensHandSpec[] = [...filers([1, 1, 1]), {kind: 'agency', at: 0.9, side: 1, reach: 0.5 + 0.08 * Math.sin(f / 13), dotted: true}];
  const gloveX = sx - 6 - 40 * (1 - pull);
  return (
    <Frame p={p} z0={1.0} z1={1.05} dx0={14} dx1={-14} day={0.35}>
      <SVG>
        <PierShot f={g} lens={lens} hands={hands} sheet={{x: sx, y: sy, w: 560, h: 300, rot: lerp(5, -2, pull), lines: sheetLines(g, bt), hang: (1 - pull) * 0.2}}
          spot={{x: 560, y: lineY(3) - 10}} beam={0.0} under={<AEATray x={165} y={1292} s={0.78} f={f} />}>
          <EmptySlot {...handleAt(lens, 24, SLOT_AT)} rot={24 + 90} glow={glow} f={f} />
          <g transform={`translate(${gloveX},${sy + 170}) rotate(180) scale(0.8)`}>
            <path d="M630,-56 L2000,-56 L2000,64 L630,64 Z" fill={C.glove} stroke={C.ink} strokeWidth={5} />
            <GripHand x={0} y={0} reach={1} scale={1} cuffColor={C.glove} skin={C.glove} />
          </g>
        </PierShot>
      </SVG>
    </Frame>
  );
};

// ---- S17: the handle is offered, the beam settles on the one blank line, the camera eases back to the first frame ------
const S17: React.FC<SceneProps> = ({p}) => {
  const {f, b, from, bt, dur} = p;
  const g = f + from;
  const away = ease(f, b(45) + 24, 20);
  const turn = easeIO(f, b(46), 26);
  const back = easeIO(f, dur - 62, 56);
  const wedge = turn * (1 - back);
  const ring = lerp(lerp(1, 0.6, turn), 1, back);
  const lens: Pose = {x: lerp(lerp(520, 470, turn), 520, back), y: lerp(lerp(830, 770, turn), 830, back), s: 0.8, rot: lerp(lerp(0, -14, turn), 3, back)};
  const settle = ease(f, b(47), 20);
  const slideT = clamp01((f - (dur - 62)) / 60);
  const lines = sheetLines(g, bt);
  const sheetSkew = (1 - back) * (0.4 + 0.6 * turn);
  const spot = f < dur - 62
    ? {x: lerp(560, 400 + 30 * Math.sin(f / 7), settle), y: lerp(lineY(2) + 10, lineY(3) - 12, settle)}
    : {x: lerp(330, 760, slideT) + 28 * Math.sin(f / 6), y: 1190 + 70 * Math.sin(slideT * Math.PI * 2.5) + 10 * Math.sin(f / 4)};
  const hands = filers([1, 1, 1], 1 - away).map((h, i) => (i === 0 ? {...h, reach: 1 - away} : h));
  return (
    <Frame p={p} z0={1.02} z1={1.0} dx0={0} dx1={0} day={0.4}>
      <SVG>
        <PierShot f={g} lens={lens} hands={hands} sheet={{...SHEET_FRONT, lines, pulse: settle * (1 - back)}} spot={spot} beam={1}
          glass={<GlassInlet f={g} />} wedge={wedge} ring={ring} sheetSkew={sheetSkew} />
      </SVG>
    </Frame>
  );
};

// ---- the boat, the fish and the permit card (episode-local, palette only: no shelf reds) ---------------------------
const FleetBoat: React.FC<{x: number; y: number; s?: number; f: number; rock?: number; flip?: boolean}> = ({x, y, s = 1, f, rock = 1, flip = false}) => (
  <g transform={`translate(${x},${y + 4 * rock * Math.sin(f / 17 + x)}) rotate(${2.2 * rock * Math.sin(f / 21 + x * 0.1)}) scale(${flip ? -s : s},${s})`}>
    <ellipse cx={0} cy={44} rx={150} ry={14} fill="#000" opacity={0.22} />
    <path d="M-150,0 L150,0 L118,56 L-112,56 Z" fill={C.slate} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-146,8 L146,8" stroke={C.peach} strokeWidth={5} opacity={0.75} />
    <path d="M-112,40 L118,40" stroke="#26343A" strokeWidth={8} opacity={0.6} />
    <rect x={-40} y={-74} width={92} height={74} fill="#5C6C72" stroke={C.ink} strokeWidth={6} />
    <rect x={-26} y={-58} width={30} height={26} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    <rect x={14} y={-58} width={24} height={26} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    <path d="M60,0 L60,-150 M60,-150 L120,-40" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M-40,-74 H52" stroke={C.peach} strokeWidth={4} opacity={0.6} />
  </g>
);
const FishSil: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-70,0 Q-30,-30 30,-18 Q70,-8 84,-28 L82,28 Q66,8 30,16 Q-30,28 -70,0 Z" fill="#9CA79F" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-60,-2 Q-10,-14 40,-6" fill="none" stroke={C.paper} strokeWidth={4} opacity={0.7} />
    <circle cx={-48} cy={-4} r={4} fill={C.ink} />
  </g>
);
const PermitCard: React.FC<{x: number; y: number; rot?: number; s?: number; tint?: number}> = ({x, y, rot = 0, s = 1, tint = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-46} y={-30} width={92} height={60} fill={tint ? '#DCD8C6' : C.paper} stroke={C.ink} strokeWidth={4} />
    <path d="M-34,-12 H20 M-34,2 H34 M-34,16 H10" stroke={C.ink} strokeWidth={3} opacity={0.5} />
    <rect x={20} y={-24} width={20} height={14} fill={C.stamp} opacity={0.75} />
  </g>
);
const SeaOnly: React.FC<{f: number}> = ({f}) => (
  <g>
    <PierDawn f={f} view="front" />
    <defs><linearGradient id="seaOnly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.water} /><stop offset="1" stopColor={C.waterDk} /></linearGradient></defs>
    <rect data-band="ok" x={-40} y={970} width={1160} height={1000} fill="url(#seaOnly)" />
    {Array.from({length: 26}, (_, i) => <path key={i} d={`M${(rnd(i * 3) * 1300 + f * (0.2 + rnd(i) * 0.3)) % 1300 - 100},${1000 + rnd(i * 5) * 880} q40,-10 80,0`} fill="none" stroke="#8A8E69" strokeWidth={3} opacity={0.4} />)}
  </g>
);

// ---- S7: one boat, 1,300 permits pour into a fleet, then the camera cranes down to the pier and a glove tilts the lens --------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b, from, bt} = p;
  const g = f + from;
  const pour = b(20);
  const zoom = lerp(1.5, 0.5, easeIO(f, pour + 22, 90));
  const crane = easeIO(f, b(22) - 6, 26);
  const cards = Array.from({length: 120}, (_, i) => i);
  const rows = [0, 1, 2, 3, 4];
  const tilt = ease(f, b(22) + 2, 22);
  const lens: Pose = {x: 520, y: 830, s: 0.8, rot: lerp(11, -9, tilt)};
  const spotX = 340 + 140 * clamp01((g - bt(22) - 8) / 45);
  return (
    <Frame p={p} z0={1.0} z1={1.03} day={0.3}>
      <SVG>
        <g style={{filter: `blur(${9 * Math.sin(Math.PI * crane)}px)`}}>
        <g transform={`translate(0,${-1250 * crane})`}>
          <SeaOnly f={f} />
          <g transform={`translate(540,1060) scale(${zoom}) translate(-540,-1060)`}>
            {rows.map((r) => Array.from({length: 11}, (_, i) => {
              if (r === 2 && i === 5) return null;
              const bx = 540 + (i - 5) * 200 + (r % 2) * 100, by = 760 + r * 120;
              const vis = clamp01((f - pour - 36 - (r * 4 + Math.abs(i - 5) * 2)) / 10);
              return (
                <g key={`${r}${i}`} opacity={vis}>
                  <FleetBoat x={bx} y={by} s={0.5} f={f + i * 5} />
                  <PermitCard x={bx - 10} y={by - 36} s={0.5} rot={-6 + i} />
                </g>
              );
            }))}
            <FleetBoat x={540} y={1040} s={1.0} f={f} />
            {cards.map((i) => {
              const t0 = pour - 8 + i * 0.55;
              const k = clamp01((f - t0) / 22);
              if (k <= 0) return null;
              const tx = 540 + (rnd(i * 7) - 0.5) * 460 * (0.6 + 0.4 * Math.min(1, i / 40)) + Math.sin(i) * 40;
              const ty = 980 - Math.min(i, 100) * 3 + rnd(i * 3) * 60;
              const yy = lerp(-200, ty, k * k);
              return <PermitCard key={i} x={tx + Math.sin(k * 6 + i) * 30 * (1 - k)} y={yy} rot={(rnd(i) - 0.5) * 70 + 30 * (1 - k)} s={1.05} tint={i % 3} />;
            })}
            <FishSil x={lerp(250, 830, clamp01((f - b(21)) / 46))} y={lerp(1180, 1180, 0) - Math.sin(clamp01((f - b(21)) / 46) * Math.PI) * 330} s={1.4} rot={lerp(-40, 40, clamp01((f - b(21)) / 46))} />
          </g>
        </g>
        <g transform={`translate(0,${1250 * (1 - crane)})`}>
          <PierShot f={g} lens={lens} hands={filers([1, 1, 1])} sheet={{...SHEET_FRONT, lines: sheetLines(g, bt)}} spot={{x: spotX, y: lineY(1) - 10}} beam={tilt > 0.1 ? 1 : 0} />
        </g>
        </g>
        {crane < 0.4 && <Plate text="" displayLines={['1,300+ ACTIVE PERMITS NOT ASSESSED', 'THE ALLIANCE SAYS']} y={520} size={27} tone="paper" p={ease(f, pour + 8, 12) * (1 - ease(f, b(21) - 6, 8))} drop={40} />}
        {crane < 0.4 && <Plate text="" displayLines={['NEARLY $10 MILLION IN REGIONAL REVENUE', "THE ALLIANCE'S MOTION"]} y={660} size={26} tone="ink" p={ease(f, b(21), 12)} drop={40} />}
      </SVG>
    </Frame>
  );
};

// ---- the council room ------------------------------------------------------------------------------------------------
const Chair: React.FC<{x: number; y: number; s?: number; tone?: string; rot?: number}> = ({x, y, s = 1, tone = C.cuffBor, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={118} ry={16} fill="#000" opacity={0.3} />
    <path d="M-86,-6 L-90,-250 Q-90,-300 -40,-300 H40 Q90,-300 90,-250 L86,-6 Z" fill={tone} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-70,-24 L-72,-240" stroke="#fff" strokeWidth={5} opacity={0.16} />
    <path d="M-100,-6 H100 V28 H-100 Z" fill="#26384D" stroke={C.ink} strokeWidth={7} />
    <path d="M-86,28 L-92,96 M86,28 L92,96" stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
  </g>
);
const CouncilWorld: React.FC<{f: number; swing?: number; warm?: number}> = ({f, swing = 1, warm = 0.8}) => {
  const a = 7 * swing * Math.sin(f / 24);
  return (
    <g>
      <defs>
        <linearGradient id="crWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4D5E69" /><stop offset="1" stopColor="#2E3D45" /></linearGradient>
        <linearGradient id="crTable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8A6643" /><stop offset="1" stopColor="#523A26" /></linearGradient>
        <radialGradient id="crLamp" cx="0.5" cy="0" r="1"><stop offset="0" stopColor="#FFD9A8" stopOpacity="0.7" /><stop offset="1" stopColor="#FFD9A8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="url(#crWall)" />
      <rect x={-40} y={760} width={1160} height={520} fill="#34444D" />
      <rect x={-40} y={752} width={1160} height={12} fill="#6C8087" />
      {[0, 1, 2].map((i) => (
        <g key={i}><rect x={80 + i * 360} y={500} width={150} height={190} fill="#E8E4D4" stroke={C.ink} strokeWidth={5} opacity={0.0} /></g>
      ))}
      <rect data-band="ok" x={-40} y={980} width={1160} height={1000} fill="#2A2A30" />
      <g transform={`translate(540,0) rotate(${a}) translate(-540,0)`}>
        <path d="M540,-60 V470" stroke={C.ink} strokeWidth={6} />
        <polygon points="540,470 130,1060 950,1060" fill="url(#crLamp)" opacity={warm} />
        <path d="M440,520 Q540,410 640,520 Z" fill={C.deskShade} stroke={C.ink} strokeWidth={7} />
        <ellipse cx={540} cy={522} rx={100} ry={12} fill="#FFE7C2" opacity={0.9 * warm} />
      </g>
    </g>
  );
};
const Table: React.FC<{y?: number}> = ({y = 1000}) => (
  <g>
    <ellipse cx={540} cy={y + 340} rx={500} ry={22} fill="#000" opacity={0.3} />
    <path d={`M-20,${y} H1100 V${y + 40} H-20 Z`} fill="url(#crTable)" stroke={C.ink} strokeWidth={6} />
    <rect data-band="ok" x={-20} y={y + 40} width={1120} height={1000} fill="#5A402A" stroke={C.ink} strokeWidth={6} />
    {Array.from({length: 7}, (_, i) => <path key={`g${i}`} d={`M-10,${y + 140 + i * 70} H1090`} stroke="#3A2A1B" strokeWidth={3} opacity={0.35} />)}
    <ellipse cx={540} cy={y + 190} rx={460} ry={60} fill="#FFD9A8" opacity={0.1} />
    <path d={`M-10,${y + 6} H1090`} stroke="#B58F5C" strokeWidth={5} opacity={0.7} />
    {Array.from({length: 10}, (_, i) => <path key={i} d={`M${rnd(i) * 1000},${y + 12} l${60 + rnd(i + 3) * 90},${rnd(i + 5) * 6}`} stroke="#3C2A1B" strokeWidth={2.5} opacity={0.35} />)}
  </g>
);
const DeskPhone: React.FC<{x: number; y: number; s?: number; lit?: number; f?: number}> = ({x, y, s = 1, lit = 0, f = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={50} rx={130} ry={12} fill="#000" opacity={0.3} />
    <path d="M-118,40 Q-118,-32 -42,-36 H42 Q118,-32 118,40 Z" fill={C.cuffBor} stroke={C.ink} strokeWidth={6} />
    <rect x={-92} y={-26} width={184} height={28} rx={13} fill={lit > 0 ? C.phoneGlow : '#1B2530'} />
    {lit > 0 && <ellipse cx={0} cy={-8} rx={150 + 20 * Math.sin(f / 6)} ry={56} fill={C.phoneGlow} opacity={0.22 * lit} />}
    {[-56, -22, 12, 46].map((px, i) => <circle key={i} cx={px} cy={20} r={9} fill="#8FA0AE" stroke={C.ink} strokeWidth={3} />)}
    <path d="M-108,-46 Q0,-92 108,-46" fill="none" stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
    <path d="M-108,-46 Q0,-92 108,-46" fill="none" stroke="#3E5A78" strokeWidth={8} strokeLinecap="round" />
  </g>
);

// ---- S8: the council table, one empty chair, the borough's faint pencil line, the mayor's demand ----------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b, from, bt} = p;
  const g = f + from;
  const settle = ease(f, 0, 24);
  const pencil = b(24);
  const nub = f < pencil ? 0 : clamp01((f - pencil) / 16);
  const nubY = lerp(-120, 0, nub * nub) - (f > pencil + 14 && f < pencil + 24 ? 18 * Math.sin(((f - pencil - 14) / 10) * Math.PI) : 0);
  const rest = spring(f, 6, 26);
  return (
    <Frame p={p} z0={1.0} z1={1.07} dx0={0} dx1={-12} day={0.3}>
      <SVG>
        <CouncilWorld f={g} />
        <Chair x={300} y={1010} s={1.1} />
        <Chair x={820} y={1010} s={1.1} tone="#2A3E52" rot={0} />
        <g opacity={0.0} />
        <Table y={1000} />
        <StudySheet f={g} x={SHEET_FRONT.x} y={SHEET_FRONT.y + 10} w={560} h={300} rot={-1} lines={sheetLines(g, bt)} />
        <g transform={`translate(${lerp(1300, 760, rest)},1120) rotate(180) scale(0.8)`}>
          <path d="M630,-56 L2000,-56 L2000,64 L630,64 Z" fill={C.cuffBor} stroke={C.ink} strokeWidth={5} />
          <GripHand x={0} y={0} reach={1} scale={1} cuffColor={C.cuffBor} />
        </g>
        <g transform={`translate(${SHEET_FRONT.x + 300 + 6 * Math.sin(f)},${SHEET_FRONT.y + 168 + nubY}) rotate(${-24 + 14 * Math.sin(Math.min(1, nub) * 5)})`} opacity={nub > 0 ? 1 : 0}>
          <rect x={-46} y={-8} width={92} height={16} rx={7} fill={C.glow} stroke={C.ink} strokeWidth={4} />
          <path d="M46,-8 L74,0 L46,8 Z" fill="#B58F5C" stroke={C.ink} strokeWidth={3} />
        </g>
        <Plate text="" displayLines={['ASKS FOR NOTICE', 'AND A CHANCE TO COMMENT']} y={520} size={28} tone="paper" p={ease(f, 8, 12) * (1 - ease(f, b(25) - 8, 8))} drop={40} />
        <QuotePlate text={'"WE DEMAND CONTACT AND DISCUSSION" · MAYOR PETER MICCICHE'} y={640} size={34} wrap={22} p={ease(f, b(25), 14)} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the borough's chair stays empty, a blank calendar hangs beside it, then the lens swings into the foreground -----------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const flip = ease(f, b(30), 18);
  const lensIn = easeIO(f, b(30) - 4, 30);
  const lens: Pose = {x: lerp(1380, 640, lensIn), y: 1000 + 10 * Math.sin(f / 20), s: lerp(1.5, 1.4, lensIn), rot: pend(f, b(30) + 10, 14, 34, 40)};
  const sway = 3 * Math.sin(f / 26);
  return (
    <Frame p={p} z0={1.0} z1={1.08} day={0.3}>
      <SVG>
        <CouncilWorld f={f + 200} swing={0.9} warm={0.6} />
        <Chair x={430} y={1130} s={2.1} />
        <Table y={1130} />
        <g transform={`translate(790,${700 + sway}) rotate(${sway * 0.4})`}>
          <rect x={-120} y={-150} width={240} height={300} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <rect x={-120} y={-150} width={240} height={52} fill={C.stamp} stroke={C.ink} strokeWidth={6} />
          {Array.from({length: 5}, (_, r) => Array.from({length: 4}, (_, c) => <rect key={`${r}${c}`} x={-100 + c * 50} y={-78 + r * 46} width={42} height={36} fill="none" stroke={C.ink} strokeWidth={2.5} opacity={0.4} />))}
        </g>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={C.paper} opacity={0.2 * flip} />
        <g opacity={lensIn > 0 ? 1 : 0}>
          <StudyLens f={f} x={lens.x} y={lens.y} s={lens.s} rot={lens.rot} R={R0} handleDeg={24} HL={520}
            glass={<g><rect x={-R0} y={-R0} width={2 * R0} height={2 * R0} fill="#3A4A53" /><circle cx={0} cy={-120} r={60} fill="#FFE7C2" opacity={0.8} /><rect x={-R0} y={60} width={2 * R0} height={R0} fill="#5A402A" /></g>} />
        </g>
        <Plate text="THE BEST CASE AGAINST" y={520} size={34} tone="paper" p={ease(f, b(30), 12)} drop={50} />
      </SVG>
    </Frame>
  );
};

// ---- S11: two cases at a hard seam, the developer's cuff pulls the lens toward its folder -------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pull = easeIO(f, 6, 70);
  const lens: Pose = {x: lerp(560, 440, pull), y: 780, s: 0.8, rot: lerp(0, -6, pull)};
  const brk = easeIO(f, b(31), 80);
  const q = ease(f, b(33), 14);
  return (
    <Frame p={p} z0={1.0} z1={1.05} day={0.25}>
      <SVG>
        {/* left half: the seabed survey */}
        <g>
          <svg x={0} y={0} width={540} height={1920} viewBox="0 0 540 1920" overflow="hidden">
            <rect data-band="ok" x={0} y={0} width={540} height={1920} fill="#33361F" />
            <rect x={0} y={0} width={540} height={500} fill="#6D7148" />
            {Array.from({length: 9}, (_, i) => <path key={`v${i}`} d={`M${i * 70 + 10},520 V1330`} stroke={C.glow} strokeWidth={3} strokeDasharray="12 10" opacity={0.6} />)}
            {Array.from({length: 7}, (_, i) => <path key={`h${i}`} d={`M0,${560 + i * 120} H540`} stroke={C.glow} strokeWidth={3} strokeDasharray="12 10" opacity={0.6} />)}
            <g stroke={C.paper} strokeWidth={6} fill="none">
              <path d={`M${lerp(20, 130, brk)},640 H${lerp(520, 410, brk)} M${lerp(20, 130, brk)},620 V660 M${lerp(520, 410, brk)},620 V660`} />
              <path d={`M${lerp(20, 130, brk)},1180 H${lerp(520, 410, brk)} M${lerp(20, 130, brk)},1160 V1200 M${lerp(520, 410, brk)},1160 V1200`} />
            </g>
            <g transform="translate(270,900) scale(0.5)"><Hive x={0} y={0} s={1} lit={1} f={f} /></g>
            <g transform="translate(190,1040) scale(0.4)"><Rotor x={0} y={0} s={1} f={f} lit={1} /></g>
          </svg>
          {/* right half: a fishing deck with a card that quivers and a boat that rocks */}
          <svg x={540} y={0} width={540} height={1920} viewBox="540 0 540 1920" overflow="hidden">
            <rect data-band="ok" x={540} y={0} width={540} height={1920} fill={C.water} />
            <rect x={540} y={0} width={540} height={620} fill={C.sky} />
            <rect x={540} y={620} width={540} height={20} fill={C.horizon} />
            <rect data-band="ok" x={540} y={980} width={540} height={1000} fill="#6B4E33" />
            {Array.from({length: 8}, (_, i) => <rect key={i} x={540} y={990 + i * 80} width={540} height={4} fill={C.pierDk} />)}
            <FleetBoat x={800} y={860} s={0.62} f={f} />
            <g transform={`translate(${860 + 3 * Math.sin(f * 1.6)},1150) rotate(${6 * Math.sin(f * 1.3)})`}><PermitCard x={0} y={0} s={1.5} /></g>
            <g transform="translate(980,1180)"><FishSil x={0} y={0} s={0.7} rot={-8} /></g>
          </svg>
          <rect data-band="ok" x={534} y={0} width={12} height={1920} fill={C.ink} />
          {[420, 880, 1300].map((y) => <circle key={y} cx={540} cy={y} r={7} fill="#6B7C84" stroke={C.ink} strokeWidth={3} />)}
        </g>
        <g transform={`translate(${lerp(1180, 920, ease(f, 0, 30))},980)`}>
          <g transform="translate(-60,0) rotate(160) scale(0.62)" />
        </g>
        <StudyLens f={f} x={lens.x} y={lens.y} s={lens.s} rot={lens.rot} R={R0} handleDeg={24} HL={520}
          hands={[{kind: 'dev', at: 0.1, side: -1, reach: ease(f, 0, 20), tag: 'DEEPGREEN'}]}
          glass={<GlassInlet f={f} boat={false} />} />
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={C.paper} opacity={0.22} />
        <Plate text="A PRELIMINARY PERMIT LETS A DEVELOPER STUDY A SITE" y={500} size={22} tone="paper" p={ease(f, 4, 12)} drop={40} />
        <QuotePlate text={'"A PRELIMINARY PERMIT DOESN\'T GIVE US PERMISSION TO BUILD ANYTHING" · LOUIS WOLFSON, DEEPGREEN, PER ADN'} y={1150} size={26} wrap={34} p={q} rot={-1} />
      </SVG>
    </Frame>
  );
};

// ---- S13: the fishery under the glass, a beluga and a permit card lit as specimens ---------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const q = ease(f, b(37), 40);
  const lens: Pose = {x: 540, y: 900, s: 1.2, rot: 3 * Math.sin(f / 33)};
  return (
    <Frame p={p} z0={1.0} z1={1.06} day={0.2}>
      <SVG>
        <WaterWorld f={f} seabed={1500} />
        <StudyLens f={f} x={lens.x} y={lens.y} s={lens.s} rot={lens.rot} R={R0} handleDeg={62} HL={520} mag={1.05}
          glass={
            <g>
              <rect x={-R0} y={-R0} width={2 * R0} height={2 * R0} fill="#4D5232" />
              <polygon points={`-60,-${R0} 60,-${R0} 140,${R0} -140,${R0}`} fill={C.peach} opacity={0.22} />
              <g transform={`translate(-20,40) rotate(${-6 + 4 * Math.sin(f / 15)})`}><FishSil x={0} y={0} s={2.6} rot={0} /></g>
              <g transform="translate(-150,150)"><FleetBoat x={0} y={0} s={0.4} f={f} /></g>
              <g transform={`translate(110,-140) rotate(${10 * Math.sin(f / 18)})`}><PermitCard x={0} y={0} s={1.5} /></g>
              <g transform={`translate(${60 + 20 * q},${-40 - 160 * q})`} opacity={q}>
                <circle r={40} fill={C.phoneGlow} fillOpacity={0.35} stroke={C.phoneGlow} strokeWidth={5} />
                <text y={16} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={52} fill={C.ink}>?</text>
              </g>
            </g>
          } />
        <Plate text="" displayLines={['THE FISHERY\'S CASE', 'NOT A TEST SUBJECT']} y={500} size={30} tone="paper" p={ease(f, 6, 12)} drop={40} />
      </SVG>
    </Frame>
  );
};

// ---- S14: the borough's own chair, the second chair skids in, the phone lights, a calendar page lands -----------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pullC = easeIO(f, 4, 40);
  const c2 = f < b(39) ? 0 : spring(f, b(39) - 4, 26);
  const c2x = lerp(1400, 640, clamp01(c2));
  const lit = ease(f, b(39) + 8, 16);
  const page = f < b(40) ? 0 : clamp01((f - b(40)) / 24);
  return (
    <Frame p={p} z0={1.0} z1={1.07} dx0={16} dx1={-16} day={0.3}>
      <SVG>
        <CouncilWorld f={f + 400} swing={0.4} warm={0.5 + 0.5 * lit} />
        <rect x={840} y={420} width={170} height={210} fill={C.paper} stroke={C.ink} strokeWidth={6} />
        <rect x={840} y={420} width={170} height={44} fill={C.stamp} stroke={C.ink} strokeWidth={6} />
        <Chair x={lerp(380, 300, pullC)} y={1010} s={1.1} />
        <Chair x={c2x} y={1010} s={1.1} tone="#2A3E52" />
        <Dust x={c2x} y={1030} t={(f - b(39)) / 22} />
        <Table y={1000} />
        <g transform={`translate(${lerp(925, 800, page)},${lerp(520, 1050, page * page)}) rotate(${lerp(0, 8, page)})`} opacity={f < b(40) ? 0 : 1}>
          <rect x={-100} y={-90} width={200} height={180} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <rect x={-100} y={-90} width={200} height={34} fill={C.stamp} />
          <text x={0} y={-8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={C.ink}>MEETING</text>
          <text x={0} y={26} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={C.ink}>SCHEDULED</text>
        </g>
        <Plate text="" displayLines={['DEEPGREEN REACHED OUT', 'MEETING SCHEDULED · PER ADN']} y={520} size={28} tone="paper" p={ease(f, b(39) + 4, 12)} drop={40} />
      </SVG>
    </Frame>
  );
};

// ---- S16: the deadline desk, three motions thud onto a stack beneath a wall clock ---------------------------------------------------------
const S16: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tones = [C.cuffCbd, C.glove, C.cuffBor];
  const tabs = ['CBD', 'ALLIANCE', 'BOROUGH'];
  const minute = lerp(-90, 270, ease(f, b(44), 8)) ;
  const tag = f < b(44) ? 0 : 1;
  return (
    <Frame p={p} z0={1.04} z1={1.0} dx0={-14} dx1={14} day={0.3}>
      <SVG>
        <DeskWorld f={f} top={1050} />
        <g transform="translate(540,640)">
          <circle r={152} fill={C.paper} stroke={C.ink} strokeWidth={10} />
          <circle r={138} fill="none" stroke={C.ink} strokeWidth={3} />
          {Array.from({length: 12}, (_, i) => <path key={i} d="M0,-132 L0,-112" stroke={C.ink} strokeWidth={i % 3 === 0 ? 8 : 4} transform={`rotate(${i * 30})`} />)}
          <path d="M0,0 L0,-84" stroke={C.ink} strokeWidth={10} strokeLinecap="round" transform="rotate(150)" />
          <path d="M0,0 L0,-118" stroke={C.stamp} strokeWidth={7} strokeLinecap="round" transform={`rotate(${minute + 90 - 90})`} />
          <circle r={10} fill={C.ink} />
        </g>
        <g transform="translate(540,0)"><path d="M0,0 V480" stroke={C.ink} strokeWidth={6} opacity={0.0} /></g>
        <rect x={110} y={1100} width={820} height={230} fill="#E4DFCD" stroke={C.ink} strokeWidth={5} />
        {tones.map((tn, i) => {
          const t0 = b(43) - 8 + i * 9;
          const k = f < t0 ? 0 : spring(f, t0, 16);
          const yy = lerp(-300, 1220 - i * 32, clamp01(k)) + (f >= t0 && f < t0 + 18 ? 0 : 0);
          return (
            <g key={i}>
              <Folder x={540 + (i - 1) * 26} y={yy} s={0.78} rot={(i - 1) * 4} tab={tabs[i]} tone={tn} />
              {f >= t0 + 6 && f < t0 + 26 && <Dust x={540} y={1260 - i * 32} t={(f - t0 - 6) / 20} n={7} />}
            </g>
          );
        })}
        <g transform={`translate(${760 + 60 * Math.sin(f / 9) * tag},1020) rotate(${10 * Math.sin(f / 7) * tag})`} opacity={tag}>
          <path d="M0,0 L-20,-60" stroke={C.ink} strokeWidth={4} />
          <rect x={-120} y={0} width={240} height={50} fill={C.paper} stroke={C.ink} strokeWidth={4} />
          <text x={0} y={33} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.ink}>FERCONLINE.FERC.GOV</text>
        </g>
        <Plate text="" displayLines={['DUE NOVEMBER 2ND', '5 PM EASTERN']} y={870} size={34} tone="stamp" p={ease(f, 0, 6)} drop={20} />
      </SVG>
    </Frame>
  );
};

//@@SCENES

// ---- placeholders: every shot gets a crude version first (the rough cut) ---------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p} day={0}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill="#2B3A40" />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.paper}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);

const TITLES: Record<number, string> = {2: 'DOCKET DESK', 3: 'ARRAY', 4: 'UNUSED STAMP', 5: 'BLANK LINE', 6: 'FOUR HANDS', 7: 'FLEET', 8: 'COUNCIL', 9: 'DOTTED HAND', 10: 'CALL', 11: 'SPLIT', 12: 'STALL', 13: 'SPECIMEN', 14: 'CHAIR', 15: 'HANDS STAY', 16: 'DEADLINE DESK', 17: 'OFFER'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1
, 2: S2, 3: S3, 4: S4
, 5: S5, 6: S6, 9: S9, 12: S12, 15: S15, 17: S17
, 7: S7, 8: S8, 10: S10, 11: S11, 13: S13, 14: S14, 16: S16
//@@ROUTER
};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]; kicks: number[]}> = ({n, from, dur, beats, kicks}) => {
  const f = useCurrentFrame();
  const b = (id: number) => {
    const x = beats.find((y) => y.id === id);
    return x ? Math.round(x.at * 30) - from : 0;
  };
  const Comp = SHOTS[n];
  const bt = (id: number) => {
    const x = beats.find((y) => y.id === id);
    return x ? Math.round(x.at * 30) : 0;
  };
  const p = {f, from, dur, b, kicks, bt};
  return Comp ? <Comp p={p} /> : <Rough n={n} title={TITLES[n] ?? ''} p={p} />;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1008Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1008Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:100 900;font-display:block;}`}</style>
);

export const Ep1008: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 4.54, 11.28, 25.46, 29.35, 35.64, 44.92, 56.1, 65.92, 73.48, 78.8, 86.24, 90.64, 96.08, 101.24, 105.92, 110.1, 118.64].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.ink}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#10181C" ink="#F4F2EA" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
