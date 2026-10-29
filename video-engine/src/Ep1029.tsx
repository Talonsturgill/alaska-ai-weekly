import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK, ContactShadow} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {snap, bump, rnd, MONO, monoW} from './lib/prospect';
import {Sourdough, ServerMachine} from './lib/kit';
import {BushPlane} from './lib/vehicles';
import {CashBlock} from './lib/grid';
import {TallyCounter} from './lib/props';
import {AK_PATH} from './lib/akmap';
import {DEP, DepotBG, NearDrift, Crate, NuSunTag, TagPost, NuSunOutline, Chip, Calendar, MergerJar, CoinStream, PaperDoc} from './lib/depot';
import type {LineState} from './lib/depot';
import {IDS} from './Ep1029Ids';

// The Reactor Is Still a Dotted Line, 2026-10-29. Palette roles are art_direction.json. SOURDOUGH (the ember power plant) is the hero and the NUSUN shipping
// tag is the throughline: four blank ruled lines (S1), flipped to the share terms (S4), stamped NOT STATED (S8), beside AIDEA's conditions (S9), frosted beside
// Oklo and the calendar (S11), blank again at the button (S13). NuSun is ONLY a dashed ice-cyan outline: anything hung on it falls straight through.
// Gold is money only. Stamp red is NOT STATED only. Cyan is the unknown only.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const SERIF = 'Fraunces, Georgia, serif';
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const springy = (f: number, a: number, d = 26) => {
  const k = clamp01((f - a) / d);
  return k <= 0 ? 0 : 1 - Math.exp(-5.5 * k) * Math.cos(k * 9);
};

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'dark' | 'paper' | 'cyan' | 'red' | 'gold';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#1E1230', fg: DEP.manila, edge: DEP.manila},
  paper: {fill: DEP.paper, fg: INK, edge: INK},
  cyan: {fill: '#12202B', fg: DEP.cyan, edge: DEP.cyan},
  red: {fill: '#2B0F14', fg: '#FF9A9A', edge: DEP.red},
  gold: {fill: DEP.gold, fg: INK, edge: INK},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'dark', p = 1, rot = 0, drop = 0}) => {
  const ls = displayLines ?? [text];
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

// ---- the shot frame: a camera that can move to any focus, kick, grade ----------------------------------------------------------------------
const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; dim?: number; warmth?: number; children: React.ReactNode}> =
({p, cam, z0 = 1, z1 = 1.05, bloom = 0.07, vignette = 0.3, ox = 540, oy = 960, tag = true, overlay, tagText = CHIP, dim = 0, warmth = 0.04, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + 7 * Math.sin(p.f / 23)}px, ${jl.y + 9 * Math.sin(p.f / 17 + 1) + 6 * t}px) rotate(${0.3 * Math.sin(p.f / 31)}deg) translate(540px, 960px) scale(${c.z * jl.scale * (1 + 0.008 * Math.sin(p.f / 13))}) translate(${-c.fx}px, ${-c.fy}px)`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {dim > 0 && <div style={{position: 'absolute', inset: 0, background: '#0B0714', opacity: dim}} />}
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#1E1230" stroke={DEP.manila} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={DEP.manila}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={warmth} />
    </AbsoluteFill>
  );
};
const clampCam = (c: Cam): Cam => ({z: c.z, fx: Math.max(540 / c.z, Math.min(1080 - 540 / c.z, c.fx)), fy: Math.max(960 / c.z, Math.min(1920 - 960 / c.z, c.fy))});
const trackRaw = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => {
  if (f <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i].t) {
      const a = keys[i - 1], bk = keys[i];
      const k = Easing.inOut(Easing.cubic)((f - a.t) / Math.max(1, bk.t - a.t));
      return {z: lerp(a.z, bk.z, k), fx: lerp(a.fx, bk.fx, k), fy: lerp(a.fy, bk.fy, k)};
    }
  }
  return keys[keys.length - 1];
};
const track = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => clampCam(trackRaw(keys)(f));

// ---- shared pieces ---------------------------------------------------------------------------------------------------------------------------
/** an interior: plank wall, a window onto the dusk, a warm lamp pool, and a plank counter. kind decides the window and the lamp. */
const Shed: React.FC<{f: number; id: string; lampX?: number; frost?: number; counterY?: number; window?: boolean}> = ({f, id, lampX = 300, frost = 0, counterY = 1250, window = true}) => {
  const flick = 1 + 0.02 * Math.sin(f / 9) + 0.012 * Math.sin(f / 4.7);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A1D2E" /><stop offset="1" stopColor="#4B3328" /></linearGradient>
        <radialGradient id={`${id}l`} cx={lampX / 1080} cy="0.42" r="0.7"><stop offset="0" stopColor="#FFD58A" stopOpacity={0.55 * flick} /><stop offset="0.5" stopColor="#E27A5B" stopOpacity={0.18} /><stop offset="1" stopColor="#000" stopOpacity={0} /></radialGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9B6B47" /><stop offset="1" stopColor="#6A4630" /></linearGradient>
      </defs>
      <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={`url(#${id}w)`} />
      {Array.from({length: 14}, (_, i) => <line key={i} data-band="ok" x1={i * 82} y1={0} x2={i * 82} y2={1960} stroke="#1A1018" strokeWidth={4} opacity={0.5} />)}
      {Array.from({length: 30}, (_, i) => <path key={i} data-band="ok" d={`M ${rnd(i) * 1080},${rnd(i + 3) * counterY} q 20,16 6,40`} stroke="#15101A" strokeWidth={2.5} fill="none" opacity={0.4} />)}
      {window && (
        <g transform="translate(790,560)">
          <rect x={-150} y={-180} width={300} height={360} fill="#2B1B3F" stroke={INK} strokeWidth={9} />
          <rect x={-142} y={-172} width={284} height={344} fill={DEP.band} opacity={0.5} />
          <path d="M-142,60 L142,60 L142,172 L-142,172 Z" fill={DEP.snow} opacity={0.85} />
          <line x1={0} y1={-180} x2={0} y2={180} stroke={INK} strokeWidth={8} />
          <line x1={-150} y1={0} x2={150} y2={0} stroke={INK} strokeWidth={8} />
          {Array.from({length: 14}, (_, i) => <circle key={i} cx={-140 + ((rnd(i) * 280 + f * (0.4 + rnd(i + 2))) % 280)} cy={-170 + ((rnd(i + 5) * 340 + f * 1.4) % 340)} r={2.4} fill="#FFFFFF" opacity={0.7} />)}
          {frost > 0 && <path d="M-150,-180 L-60,-180 Q-100,-100 -150,-60 Z M150,180 L60,180 Q110,100 150,60 Z" fill="#FFFFFF" opacity={0.7 * frost} />}
        </g>
      )}
      <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={`url(#${id}l)`} />
      <rect x={-40} y={counterY} width={1160} height={70} fill={`url(#${id}c)`} stroke={INK} strokeWidth={7} />
      <rect x={-40} y={counterY + 70} width={1160} height={720} fill="#3A2619" stroke={INK} strokeWidth={6} />
      {Array.from({length: 8}, (_, i) => <line key={i} x1={i * 150 - 20} y1={counterY + 74} x2={i * 150 - 20} y2={1960} stroke="#221409" strokeWidth={4} opacity={0.6} />)}
    </g>
  );
};

/** a lamp that hangs from the top: warm head and a swinging cord */
const Lamp: React.FC<{x: number; f: number; y?: number}> = ({x, f, y = 120}) => {
  const sw = 3 * Math.sin(f / 45);
  return (
    <g transform={`translate(${x},0) rotate(${sw} 0 0)`}>
      <line x1={0} y1={0} x2={0} y2={y} stroke={INK} strokeWidth={5} />
      <path d={`M -64,${y + 70} Q -40,${y} 0,${y} Q 40,${y} 64,${y + 70} Z`} fill="#3E7A5E" stroke={INK} strokeWidth={6} />
      <ellipse cx={0} cy={y + 72} rx={64} ry={12} fill="#FFE9A8" stroke={INK} strokeWidth={4} />
    </g>
  );
};

const StampMark: React.FC<{text: string; x: number; y: number; rot?: number; p: number; size?: number; color?: string}> = ({text, x, y, rot = -8, p, size = 34, color = DEP.red}) => {
  const k = clamp01(p);
  if (k <= 0.02) return null;
  const w = monoW(text, size, 2) + 36;
  const sc = 1.7 - 0.7 * Math.min(1, k * 1.25) + 0.05 * Math.sin(k * 9);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, k * 2)}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.7} rx={5} fill="none" stroke={color} strokeWidth={5} />
      <text x={0} y={size * 0.3} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={2} fill={color}>{text}</text>
    </g>
  );
};

/** a small hanging label for the gags */
const SmallTag: React.FC<{x: number; y: number; text: string; rot?: number; size?: number; op?: number}> = ({x, y, text, rot = 0, size = 24, op = 1}) => {
  const w = monoW(text, size) + 36;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`} opacity={op}>
      <rect x={-w / 2 + 5} y={-size * 0.9 + 7} width={w} height={size * 1.8} rx={4} fill="#000" opacity={0.3} />
      <path d={`M ${-w / 2},${-size * 0.9} L ${w / 2 - 14},${-size * 0.9} L ${w / 2},${-size * 0.9 + 14} L ${w / 2},${size * 0.9} L ${-w / 2},${size * 0.9} Z`} fill={DEP.manila} stroke={INK} strokeWidth={4} />
      <circle cx={w / 2 - 14} cy={-size * 0.9 + 14} r={4} fill={INK} />
      <text x={-4} y={size * 0.32} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.2} fill={INK}>{text}</text>
    </g>
  );
};

/** the share certificate: paper with a gold seal and ruled lines */
const Certificate: React.FC<{x: number; y: number; rot?: number; s?: number; f: number; text?: string}> = ({x, y, rot = 0, s = 1, f, text = 'SHARES'}) => (
  <g transform={`translate(${x},${y}) rotate(${rot + 1.2 * Math.sin(f / 21)}) scale(${s})`}>
    <rect x={-176} y={-114} width={360} height={232} rx={6} fill="#000" opacity={0.28} />
    <rect x={-180} y={-120} width={360} height={232} rx={6} fill={DEP.paper} stroke={INK} strokeWidth={7} />
    <rect x={-160} y={-100} width={320} height={192} fill="none" stroke={DEP.goldDeep} strokeWidth={3} />
    <text x={0} y={-48} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={54} fill={INK}>{text}</text>
    {[0, 1, 2].map((i) => <rect key={i} x={-130} y={-14 + i * 24} width={i === 2 ? 130 : 260} height={9} rx={4} fill="#3A2E1B" opacity={0.25} />)}
    <circle cx={110} cy={62} r={34} fill={DEP.gold} stroke={INK} strokeWidth={5} />
    <circle cx={110} cy={62} r={22} fill="none" stroke={DEP.goldDeep} strokeWidth={3} />
  </g>
);

/** the back of the NUSUN tag: share terms */
const TagBack: React.FC<{f: number; sticker: number; band: number; ticket: number; terms?: number}> = ({f, sticker, band, ticket, terms = 1}) => (
  <g>
    <rect x={-162} y={64} width={324} height={64} rx={4} fill={DEP.sky1} stroke={INK} strokeWidth={5} />
    <text x={0} y={110} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} letterSpacing={3} fill={DEP.manila}>SHARES</text>
    <text x={-150} y={190} fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={2} fill="#4A3510">REFERENCE PRICE</text>
    <text x={-150} y={250} fontFamily={MONO} fontWeight={800} fontSize={60} fill="#4A3510">$10.82</text>
    <line x1={-150} y1={236} x2={86} y2={236} stroke={DEP.red} strokeWidth={6} opacity={0.35 + 0.65 * sticker} />
    <g transform={`translate(30,${300 - 56 * sticker}) rotate(${-6 + 6 * (1 - sticker)}) scale(${1}, ${0.2 + 0.8 * sticker})`} opacity={clamp01(sticker * 3)}>
      <rect x={-110} y={-4} width={230} height={88} rx={8} fill={DEP.gold} stroke={INK} strokeWidth={5} />
      <text x={5} y={64} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={56} fill={INK}>$9.25</text>
    </g>
    <g opacity={band} transform={`translate(${-150},${400})`}>
      <rect x={0} y={-4} width={300} height={10} fill={DEP.gold} stroke={INK} strokeWidth={3} />
      <text x={0} y={42} fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={1} fill="#4A3510">ABOUT 14.5% BELOW</text>
    </g>
    <g transform={`translate(${60 + 160 * (1 - ticket) * 0},${470 + 4 * Math.sin(f / 7)}) rotate(${(1 - ticket) * 0 + 5 * Math.sin(f / 9)})`} opacity={ticket}>
      <path d="M -150,-26 L 0,-26 L 0,26 L -150,26 Z" fill={DEP.paper} stroke={INK} strokeWidth={4} strokeDasharray="10 6" />
      <text x={-75} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={INK}>HALF WARRANT</text>
    </g>
  </g>
);

const SOURDOUGH_X = 205, GROUND_Y = 1330;
const Hero: React.FC<{f: number; x?: number; y?: number; s?: number; emotion?: 'proud' | 'confident' | 'faltering' | 'frozen'; glow?: number; facing?: 1 | -1}> = ({f, x = SOURDOUGH_X, y = GROUND_Y, s = 0.74, emotion = 'proud', glow = 1, facing = 1}) => (
  <Sourdough frame={f} x={x} y={y} scale={s} facing={facing} emotion={emotion} glow={glow} />
);

// ---- S1: the drop (line 0) -------------------------------------------------------------------------------------------------------------------
const POST_X = 640, POST_TOP = 716;
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t1 = b(1), t2 = b(2), t3 = b(3);
  const px = lerp(-180, 1300, easeIO(f, 0, Math.max(60, t2 + 70)));
  const fall = clamp01((f - (t2 - 26)) / 26);
  const crateY = lerp(520, GROUND_Y + 10, fall * fall);
  const crateX = lerp(px * 0.62 + 120, 420, fall);
  const land = f >= t2 - 2 ? bump(f, t2 - 2, 20) : 0;
  const flip = f < t2 ? 0.5 : 0.5 * (1 - springy(f, t2, 30));
  const asked: LineState[] = f > t3 ? ['asked', 'asked', 'asked', 'asked'] : ['blank', 'blank', 'blank', 'blank'];
  const cam = track([{t: 0, z: 1.12, fx: 540, fy: 1040}, {t: p.dur, z: 1.0, fx: 560, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="$25M FROM ALASKA" y={600} size={42} tone="gold" p={ease(f, t1 + 8, 10)} />
        <Plate x={540} text="NOT A REACTOR · A COMPANY" y={690} size={28} tone="cyan" p={ease(f, t3, 8)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s1" />
        <TagPost x={POST_X} y={GROUND_Y + 10} top={POST_TOP} />
        <NuSunTag x={POST_X} y={660} s={0.85} f={f} flip={flip} states={asked} id="s1t" />
        <Hero f={f} emotion={f > t2 ? 'proud' : 'proud'} glow={0.8 + 0.2 * land} />
        {f < t2 + 4 && (
          <g transform={`translate(${crateX},${crateY - 120 * 0}) rotate(${(1 - fall) * 18})`} opacity={f > t2 - 40 ? 1 : 0}>
            <Crate x={0} y={0} s={0.8} f={f} lid={0} thump={0} />
          </g>
        )}
        {f >= t2 + 4 && <Crate x={420} y={GROUND_Y + 10} s={0.8} f={f} lid={ease(f, t2 + 10, 14)} thump={land} />}
        <BushPlane x={px} y={lerp(560, 470, ease(f, 0, 140))} scale={0.7} f={f} facing={1} mode="fly" propSpeed={1.2} />
        <NearDrift f={f} seed={1} />
      </SVG>
    </Frame>
  );
};

// ---- S2: announced (line 1) --------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t4 = b(4), t5 = b(5), t6 = b(6);
  const slide = ease(f, t4 - 6, 22);
  const cam = track([{t: 0, z: 1.12, fx: 540, fy: 1040}, {t: p.dur, z: 1.02, fx: 540, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="OCT 19TH · NUCUBE ENERGY · IDAHO" y={560} size={30} tone="dark" p={ease(f, t4 + 4, 8)} />
        <Plate x={540} displayLines={['AIDEA · ALASKA INDUSTRIAL', 'DEVELOPMENT AND EXPORT AUTHORITY']} text="AIDEA · ALASKA INDUSTRIAL DEVELOPMENT AND EXPORT AUTHORITY" y={668} size={26} tone="gold" p={ease(f, t6 + 2, 8)} />
      </>}>
      <SVG>
        <Shed f={f + p.from} id="s2" lampX={540} />
        <Lamp x={540} f={f} />
        <g transform={`translate(540,${lerp(-300, 1000, slide)})`}>
          <PaperDoc x={0} y={0} w={560} h={640} rot={-2} head="PRESS RELEASE" rows={9} f={f} />
          <StampMark text="ANNOUNCED" x={-90} y={150} rot={-9} p={ease(f, t5, 8)} size={40} />
          <g transform="translate(130,-100)" opacity={ease(f, t6, 8)}>
            <circle r={78 + 6 * Math.sin(f / 5)} fill={DEP.gold} stroke={INK} strokeWidth={7} />
            <circle r={58} fill="none" stroke={DEP.goldDeep} strokeWidth={4} />
            <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={2} fill={INK}>AIDEA</text>
          </g>
        </g>
        <NearDrift f={f} seed={2} y={1760} />
      </SVG>
    </Frame>
  );
};

// ---- S3: four questions (line 2) ----------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t7 = b(7), t8 = b(8), t9 = b(9), t10 = b(10), t11 = b(11);
  const st = (t: number): LineState => (f >= t ? 'asked' : 'blank');
  const states: LineState[] = [st(t8), st(t9), st(t10), st(t11)];
  const draw = ease(f, t7, 50);
  const fall = clamp01((f - t10) / 40);
  const tagY = lerp(760, 1360, fall * fall);
  const tagX = 880 + 10 * Math.sin(f / 4) * (1 - fall);
  const cam = track([{t: 0, z: 1.1, fx: 560, fy: 1040}, {t: p.dur, z: 1.02, fx: 640, fy: 1010}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} displayLines={['NUSUN', 'SOLID-STATE, HEAT-PIPE-COOLED']} text="NUSUN · SOLID-STATE, HEAT-PIPE-COOLED" y={560} size={28} tone="cyan" p={ease(f, t7 + 10, 8)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s3" />
        <TagPost x={POST_X - 150} y={GROUND_Y + 10} top={POST_TOP} />
        <NuSunTag x={POST_X - 150} y={660} s={0.85} f={f} states={states} id="s3t" />
        <NuSunOutline x={880} y={1320} s={0.92} f={f} k={draw} label={draw > 0.9} name="NUSUN" />
        <Hero f={f} x={170} emotion={f > t10 + 20 ? 'faltering' : 'proud'} s={0.8} />
        {f >= t10 - 20 && <SmallTag x={tagX} y={tagY} text="PRICE" rot={-8 + 20 * fall} op={clamp01((f - (t10 - 20)) / 10)} />}
        {f >= t10 + 40 && <g transform="translate(880,1345)"><path d="M-70,0 q70,-14 140,0" stroke={DEP.snowShade} strokeWidth={8} fill="none" opacity={0.7} /></g>}
        <NearDrift f={f} seed={3} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the share terms (line 3) ------------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t12 = b(12), t13 = b(13), t14 = b(14), t15 = b(15);
  const flip = easeIO(f, t12, 22);
  const sticker = springy(f, t13, 24);
  const band = ease(f, t14, 14);
  const ticket = ease(f, t15, 14);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: Math.max(40, t13), z: 1.24, fx: 540, fy: 960}, {t: p.dur, z: 1.18, fx: 560, fy: 1010}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="$9.25 A SHARE" y={540} size={44} tone="gold" p={ease(f, t13 + 2, 8)} />
        <Plate x={540} displayLines={['ABOUT 14.5% BELOW THE', '$10.82 REFERENCE PRICE']} text="ABOUT 14.5% BELOW THE $10.82 REFERENCE PRICE" y={1190} size={26} tone="dark" p={ease(f, t14, 8)} />
        <Plate x={540} displayLines={['HALF A WARRANT A SHARE', '$11.50 · 5 YEARS']} text="HALF A WARRANT A SHARE · $11.50 · 5 YEARS" y={1190} size={26} tone="paper" p={ease(f, t15 + 4, 8) * (1 - ease(f, t15 + 9999, 8))} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s4" dim={0.18} />
        <TagPost x={540} y={GROUND_Y + 60} top={1000} />
        <NuSunTag x={540} y={400} s={1.12} f={f} flip={flip} sway={0.5} back={<TagBack f={f} sticker={sticker} band={band} ticket={ticket} />} id="s4t" />
        <NearDrift f={f} seed={4} y={1780} />
      </SVG>
    </Frame>
  );
};

// ---- S5: the merger jar (line 4) ----------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t16 = b(16), t17 = b(17), t18 = b(18);
  const slide = ease(f, t16 - 6, 22);
  const pour = clamp01((f - t17) / 60);
  const aid = springy(f, t18, 26);
  const fill = Math.min(0.1, 0.1 * pour) * (f < t18 ? 1 : 0) + (f >= t18 ? 0.1 + 0.23 * aid : 0);
  const cam = track([{t: 0, z: 1.14, fx: 600, fy: 1040}, {t: p.dur, z: 1.02, fx: 560, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="MERGER WITH LAUNCH TWO" y={540} size={30} tone="dark" p={ease(f, t16 + 6, 8)} />
        <Plate x={540} text="$75M CASH TO CLOSE" y={620} size={40} tone="gold" p={ease(f, t17, 8)} />
        <Plate x={540} text="AIDEA'S $25M COUNTS" y={1160} size={34} tone="paper" p={ease(f, t18 + 4, 8)} />
      </>}>
      <SVG>
        <Shed f={f + p.from} id="s5" lampX={620} counterY={1260} />
        <Lamp x={620} f={f} />
        <g transform={`translate(${lerp(1400, 600, slide)},0)`}>
          <MergerJar x={0} y={1255} s={1.15} f={f} fill={fill} aidea={0} />
          <text x={0} y={1180} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={2} fill={INK} opacity={0.8}>LAUNCH TWO MERGER</text>
          {/* the $75M mark on the rim */}
          <g transform="translate(176,790)">
            <rect x={0} y={-16} width={86} height={32} rx={4} fill={DEP.gold} stroke={INK} strokeWidth={4} opacity={ease(f, t17, 10)} />
            <text x={43} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={INK} opacity={ease(f, t17, 10)}>$75M</text>
          </g>
          <CoinStream x={0} y0={620} y1={1220 - 380 * fill} f={f} on={f > t17 && f < t18 + 6 ? 1 : 0} seed={3} />
          {f >= t18 && (
            <g transform={`translate(0,${lerp(-500, 0, aid)})`}>
              <rect x={-130} y={1075} width={260} height={110} rx={8} fill="#FFE08A" stroke={INK} strokeWidth={6} />
              <text x={0} y={1140} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={INK}>AIDEA</text>
            </g>
          )}
        </g>
        <Hero f={f} x={190} y={1262} s={0.62} emotion="confident" />
        <NearDrift f={f} seed={5} y={1770} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the AI count (line 5) -----------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t19 = b(19), t20 = b(20), t21 = b(21);
  const slide = ease(f, t19 - 4, 20);
  const one = f >= t20;
  const sweep = ease(f, t21 - 6, 40);
  const droop = ease(f, t21, 30);
  const cam = track([{t: 0, z: 1.1, fx: 500, fy: 1000}, {t: p.dur, z: 1.04, fx: 540, fy: 1010}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="NUCUBE'S FILING" y={540} size={32} tone="dark" p={ease(f, t19 + 6, 8)} />
        <Plate x={540} displayLines={['AI DATA CENTER ENERGY DEMAND', 'ONCE']} text={`NUCUBE'S FILING · "AI DATA CENTER ENERGY DEMAND" · ONCE`} y={640} size={26} tone="gold" p={ease(f, t20, 8) * (1 - ease(f, t21 - 4, 6))} />
        <Plate x={540} text="ALASKA PARAGRAPHS · AI 0" y={640} size={34} tone="cyan" p={ease(f, t21, 8)} />
      </>}>
      <SVG>
        <Shed f={f + p.from} id="s6" lampX={430} window={false} counterY={1500} />
        <Lamp x={430} f={f} />
        <g transform={`translate(${lerp(-400, 440, slide)},1020)`}>
          <PaperDoc x={0} y={0} w={640} h={760} rot={-1} head="NUCUBE FILING" rows={0} f={f} />
          <rect x={-290} y={-130} width={580} height={250} rx={4} fill="#EFE2B8" stroke={INK} strokeWidth={3} />
          <text x={-270} y={-100} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill="#6B4E1B">MARKET TRENDS</text>
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-270} y={-76 + i * 38} width={i === 3 ? 260 : 540} height={13} rx={4} fill={i === 1 ? DEP.gold : '#3A2E1B'} opacity={i === 1 ? 0.95 : 0.22} />)}
          <rect x={-290} y={150} width={580} height={190} rx={4} fill="#E3E8F4" stroke={INK} strokeWidth={3} />
          <text x={-270} y={178} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill="#2B3F6A">ALASKA</text>
          {[0, 1, 2].map((i) => <rect key={i} x={-270} y={202 + i * 36} width={i === 2 ? 220 : 540} height={13} rx={4} fill="#3A2E1B" opacity={0.2} />)}
          <rect x={-290 + 580 * sweep - 6} y={150} width={12} height={190} fill={DEP.cyan} opacity={0.7 * (sweep > 0 && sweep < 1 ? 1 : 0.0)} />
        </g>
        <g transform="translate(870,1160)">
          <TallyCounter x={0} y={0} s={0.9} f={f} variant="clicker" count={one ? '0001' : '0000'} spin={one ? clamp01((f - t20) / 20) : 1} />
          <text x={0} y={190} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={60} fill={DEP.paper}>{one && f < t21 + 10 ? '1' : f >= t21 + 10 ? '0' : '0'}</text>
        </g>
        <g transform={`translate(${920 - 20 * droop},${620 + 90 * droop}) scale(${0.5 - 0.06 * droop})`} opacity={clamp01((f - t19) / 14)}>
          <ServerMachine frame={f} emotion="ghost" x={0} y={0} scale={1} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S7: AIDEA's list (line 6) -------------------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t22 = b(22), t23 = b(23), t24 = b(24);
  const cam = track([{t: 0, z: 1.12, fx: 540, fy: 1020}, {t: p.dur, z: 1.02, fx: 540, fy: 1000}]);
  const names = ['MINING', 'SEAFOOD', 'MANUFACTURING', 'DATA CENTERS'];
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="AIDEA · RELEASE" y={540} size={30} tone="dark" p={ease(f, t22, 8)} />
        <Plate x={540} displayLines={['AIDEA · MINING · SEAFOOD ·', 'MANUFACTURING · DATA CENTERS']} text="AIDEA · MINING · SEAFOOD · MANUFACTURING · DATA CENTERS" y={1190} size={26} tone="paper" p={ease(f, t23 + 8, 8) * (1 - ease(f, t24 - 2, 6))} />
        <Plate x={540} text="AI · NOT SAID" y={1190} size={34} tone="red" p={ease(f, t24 + 4, 8)} />
      </>}>
      <SVG>
        <Shed f={f + p.from} id="s7" lampX={540} window={false} counterY={1500} />
        <Lamp x={540} f={f} />
        {names.map((n, i) => {
          const k = ease(f, t22 + i * 7, 14);
          const hot = i === 3 && f >= t23;
          return <Chip key={n} x={540 + (1 - k) * (i % 2 ? 500 : -500)} y={720 + i * 112} text={n} size={42} tone={hot ? 'gold' : 'paper'} rot={(i - 1.5) * 2} k={k} />;
        })}
        <g transform="translate(540,1170)" opacity={ease(f, t24 - 4, 8)}>
          <rect x={-130} y={-48} width={260} height={96} rx={10} fill="none" stroke={DEP.cyan} strokeWidth={6} strokeDasharray="16 10" strokeDashoffset={-f * 0.8} />
          <text x={0} y={18} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={56} fill={DEP.cyan} opacity={0.55}>AI</text>
        </g>
        <StampMark text="NOT SAID" x={620} y={1060} rot={-10} p={ease(f, t24, 8)} size={34} />
      </SVG>
    </Frame>
  );
};

// ---- S8: the blanks (line 7) -------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t25 = b(25), t26 = b(26), t27 = b(27), t28 = b(28), t29 = b(29);
  const flip = 0.5 * (1 - ease(f, t25 - 12, 24)) + 0 * f;
  const stamps = [ease(f, t26, 10), ease(f, t27, 10), ease(f, t28, 10), ease(f, t29, 10)];
  const states: LineState[] = stamps.map((s) => (s > 0.1 ? 'stamped' : 'blank'));
  const dimGlow = 1 - 0.65 * ease(f, t26, 90);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.1, fx: 540, fy: 940}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} displayLines={['SIZE · SITE · PRICE · DATE', 'NOT STATED']} text="SIZE · SITE · PRICE · DATE · NOT STATED" y={1170} size={28} tone="red" p={ease(f, t29 + 6, 10)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s8" dim={0.12} />
        <Hero f={f} x={150} y={1330} s={0.72} emotion="faltering" glow={dimGlow} />
        <NuSunOutline x={900} y={1330} s={0.78} f={f} k={1} alpha={0.9} />
        <TagPost x={500} y={GROUND_Y + 20} top={1000} />
        <NuSunTag x={500} y={400} s={1.15} f={f} flip={flip} states={states} stampP={stamps} sway={0.45} id="s8t" />
        <NearDrift f={f} seed={8} y={1780} />
      </SVG>
    </Frame>
  );
};

// ---- S9: the case for blanks (line 8) -----------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t30 = b(30), t31 = b(31), t32 = b(32);
  const walk = ease(f, t30 - 8, 30);
  const cam = track([{t: 0, z: 1.1, fx: 580, fy: 1010}, {t: p.dur, z: 1.02, fx: 540, fy: 990}]);
  const cond = ['TECHNOLOGY', 'APPROVALS', 'FINANCING', 'HOST COMMUNITIES'];
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="THE CASE FOR BLANKS" y={540} size={36} tone="dark" p={ease(f, t30 + 4, 8)} />
        <Plate x={540} displayLines={['DEPENDS ON · TECHNOLOGY · APPROVALS ·', 'FINANCING · HOST COMMUNITIES']} text="DEPENDS ON · TECHNOLOGY · APPROVALS · FINANCING · HOST COMMUNITIES" y={1160} size={24} tone="paper" p={ease(f, t31 + 18, 8) * (1 - ease(f, t32 + 20, 8))} />
        <Plate x={540} displayLines={['A DISCOUNT IS WHAT', 'AN EARLY BLANK COSTS']} text="A DISCOUNT IS WHAT AN EARLY BLANK COSTS" y={1170} size={30} tone="gold" p={ease(f, t32 + 22, 8)} />
      </>}>
      <SVG>
        <Shed f={f + p.from} id="s9" lampX={560} window={false} counterY={1280} />
        <Lamp x={560} f={f} />
        <rect x={150} y={640} width={780} height={330} rx={8} fill="#6A4630" stroke={INK} strokeWidth={8} />
        <text x={540} y={684} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={3} fill={DEP.manila}>DEPENDS ON</text>
        {cond.map((c, i) => <Chip key={c} x={i % 2 ? 735 : 345} y={760 + Math.floor(i / 2) * 100} text={c} size={26} tone="paper" rot={(i % 2 ? 1 : -1) * 1.6} k={ease(f, t31 + i * 6, 12)} />)}
        <Hero f={f} x={180} y={1290} s={0.6} emotion="faltering" glow={0.5} />
        <g transform={`translate(${lerp(1300, 780, walk)},1290)`}>
          <CashBlock x={0} y={0} f={f} scale={0.62} emotion="smug" id="s9cb" band="EARLY" knock={f > t31 ? 0.4 : 0} />
          <g transform={`translate(-150,-170) rotate(${10 * Math.sin(f / 9)} 0 -30)`} opacity={ease(f, t32, 10)}>
            <line x1={0} y1={-60} x2={0} y2={-6} stroke={INK} strokeWidth={4} />
            <SmallTag x={0} y={30} text="DISCOUNT" size={26} />
          </g>
        </g>
        <NearDrift f={f} seed={9} y={1790} />
      </SVG>
    </Frame>
  );
};

// ---- S10: Oklo at Eielson (line 9) -------------------------------------------------------------------------------------------------------------
const PIN: [number, number] = [440, 175];
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t33 = b(33), t34 = b(34), t35 = b(35);
  const cam = track([{t: 0, z: 1.55, fx: 560, fy: 1180}, {t: Math.max(30, t33 + 40), z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.06, fx: 540, fy: 1010}]);
  const spin = f - t35;
  const sink = ease(f, t35, 40);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} displayLines={['OKLO · EIELSON', 'AIR FORCE BASE']} text="OKLO · EIELSON AIR FORCE BASE" y={500} size={30} tone="dark" p={ease(f, t33 + 20, 8)} />
        <Plate x={540} displayLines={['AT LEAST 5 MW ELECTRIC', 'EARLY 2030s · OKLO']} text="AT LEAST 5 MW ELECTRIC · EARLY 2030s · OKLO" y={1170} size={28} tone="cyan" p={ease(f, t34 + 10, 8) * (1 - ease(f, t35 + 12, 8))} />
        <Plate x={540} displayLines={['BOREHOLE DRILLING', 'LATE 2026 · OKLO']} text="BOREHOLE DRILLING · LATE 2026 · OKLO" y={1170} size={28} tone="gold" p={ease(f, t35 + 16, 8)} />
      </>}>
      <SVG>
        <rect x={0} y={0} width={W} height={H} fill="#2A1D3A" />
        <rect x={0} y={420} width={W} height={1100} fill="#E7DDC2" stroke={INK} strokeWidth={8} />
        {Array.from({length: 10}, (_, i) => <line key={i} x1={0} y1={420 + i * 110} x2={W} y2={420 + i * 110} stroke="#B8AD90" strokeWidth={2.5} opacity={0.6} />)}
        <g transform="translate(70,640) scale(1.15)">
          <path d={AK_PATH} fill="#BFCBE6" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <g transform={`translate(${PIN[0]},${PIN[1]})`}>
            <circle r={18 + 5 * Math.sin(f / 6)} fill={DEP.red} stroke={INK} strokeWidth={5} />
            <circle r={44} fill="none" stroke={DEP.red} strokeWidth={4} opacity={0.4 + 0.3 * Math.sin(f / 8)} />
          </g>
        </g>
        <text x={540} y={1470} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill="#6B5B3A">SCHEMATIC MAP · NOT A SITE PLAN</text>
        <g transform="translate(700,1100)">
          <NuSunOutline x={0} y={0} s={0.55} f={f} k={ease(f, t33 + 24, 40)} alpha={0.95} label name="OKLO" />
          <g opacity={ease(f, t34, 10)}><SmallTag x={-4} y={-250} text="EARLY 2030s" size={24} rot={-4} /></g>
        </g>
        <g transform={`translate(330,${1000 + 60 * sink})`} opacity={ease(f, t35 - 10, 10)}>
          <rect x={-8} y={-130} width={16} height={130} fill="#8A8F99" stroke={INK} strokeWidth={4} />
          <g transform={`rotate(${spin * 20 % 360} 0 0)`}><rect x={-40} y={-6} width={80} height={12} fill="#6D7280" stroke={INK} strokeWidth={4} /></g>
          <path d="M-10,0 L10,0 L0,40 Z" fill="#8A8F99" stroke={INK} strokeWidth={4} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S11: two clocks (line 10) ---------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t36 = b(36), t37 = b(37);
  const slam = f < t36 - 24 ? 0 : springy(f, t36 - 24, 24);
  const frost = ease(f, t37, 90);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.1, fx: 540, fy: 1010}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} displayLines={['ENSTAR · WINTER GAS SHORTAGE', '18 DAYS · 3 BCF']} text="ENSTAR · WINTER GAS SHORTAGE · 18 DAYS · 3 BCF" y={520} size={28} tone="dark" p={ease(f, t36, 8)} />
        <Plate x={540} text="NO DATE REACHES THIS WINTER" y={1170} size={30} tone="cyan" p={ease(f, t37 + 6, 8)} />
      </>}>
      <SVG>
        <Shed f={f + p.from} id="s11" lampX={540} frost={frost} counterY={1380} />
        <Calendar x={540} y={1180} s={1.18} f={f} n={18} slam={slam} frost={frost * 0.8} />
        <g transform="translate(190,1360)" opacity={ease(f, t37, 12)}>
          <NuSunOutline x={0} y={0} s={0.45} f={f} k={1} alpha={0.9} />
          <SmallTag x={0} y={-230} text="NO DATE" size={22} rot={-3} />
          <rect x={-110} y={-260} width={220} height={60} fill="#FFFFFF" opacity={0.5 * frost} />
        </g>
        <g transform="translate(890,1360)" opacity={ease(f, t37 + 6, 12)}>
          <NuSunOutline x={0} y={0} s={0.45} f={f} k={1} alpha={0.9} />
          <SmallTag x={0} y={-230} text="EARLY 2030s" size={22} rot={3} />
          <rect x={-110} y={-260} width={220} height={60} fill="#FFFFFF" opacity={0.5 * frost} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S12: shares, not a reactor (line 11) -------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t38 = b(38), t39 = b(39), t40 = b(40);
  const slideIn = ease(f, t38 - 4, 24);
  const flip = ease(f, t39 - 4, 22);
  const fall = clamp01((f - (t40 + 10)) / 46);
  const cx = lerp(lerp(-200, 520, slideIn), 880, ease(f, t40 - 10, 40));
  const cy = lerp(1010, 1480, fall * fall);
  const cam = track([{t: 0, z: 1.06, fx: 560, fy: 1040}, {t: p.dur, z: 1.14, fx: 620, fy: 1030}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="SHARES, NOT A REACTOR" y={540} size={34} tone="gold" p={ease(f, t38 + 4, 8) * (1 - ease(f, t39 + 4, 6))} />
        <Plate x={540} text="THE TERMS ARE FILLED IN" y={540} size={34} tone="paper" p={ease(f, t39 + 6, 8) * (1 - ease(f, t40 - 6, 6))} />
        <Plate x={540} displayLines={['THE REACTOR IS', 'STILL A DOTTED LINE']} text="THE REACTOR IS STILL A DOTTED LINE" y={1150} size={36} tone="cyan" p={ease(f, t40 + 2, 10)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s12" />
        <TagPost x={400} y={GROUND_Y + 10} top={POST_TOP} />
        <NuSunTag x={400} y={660} s={0.8} f={f} flip={flip} back={<TagBack f={f} sticker={1} band={1} ticket={1} />} id="s12t" />
        <Hero f={f} x={140} emotion={f > t40 + 40 ? 'faltering' : 'confident'} s={0.7} />
        <NuSunOutline x={880} y={1320} s={0.95} f={f} k={1} label />
        <Certificate x={cx} y={cy} rot={-8 + 18 * fall} s={0.7} f={f} />
        <NearDrift f={f} seed={12} />
      </SVG>
    </Frame>
  );
};

// ---- S13: the button (line 12) ----------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t41 = b(41), t42 = b(42), t43 = b(43);
  const out = ease(f, p.dur - 14, 12);
  const px = lerp(-180, 1300, easeIO(f, 0, 150));
  const flip = 0.5 * (1 - springy(f, t43, 30)) + (f < t43 ? 0.5 : 0);
  const cam = track([{t: 0, z: 1.12, fx: 540, fy: 1040}, {t: p.dur, z: 1.0, fx: 560, fy: 1000}]);
  const boxes = ['SIZE', 'SITE', 'PRICE', 'DATE'];
  return (
    <Frame p={p} cam={cam} dim={out}
      overlay={<>
        <Plate x={540} displayLines={['WHAT SHOULD AIDEA PUBLISH,', 'AND BY WHEN?']} text="WHAT SHOULD AIDEA PUBLISH, AND BY WHEN?" y={560} size={32} tone="dark" p={ease(f, t41 + 6, 8)} />
        <Plate x={540} text="STILL BLANK" y={1150} size={34} tone="cyan" p={ease(f, t43 + 10, 8)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s13" />
        <TagPost x={POST_X} y={GROUND_Y + 10} top={POST_TOP} />
        <NuSunTag x={POST_X} y={660} s={0.85} f={f} flip={Math.max(0, flip)} flutter={ease(f, t43, 20) * 0.5} id="s13t" />
        <Hero f={f} emotion="proud" />
        <Crate x={420} y={GROUND_Y + 10} s={0.8} f={f} lid={1} />
        {boxes.map((n, i) => (
          <g key={n} transform={`translate(${340 + i * 130},${lerp(-100, 520 + 8 * Math.sin(f / 6 + i), ease(f, t42 + i * 4, 14))})`} opacity={ease(f, t42 + i * 4, 8)}>
            <rect x={-54} y={-48} width={108} height={96} rx={8} fill="none" stroke={DEP.cyan} strokeWidth={5} strokeDasharray="12 9" strokeDashoffset={-f * 0.7} />
            <text x={0} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={DEP.cyan}>{n}</text>
            <text x={0} y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} fill={DEP.cyan}>?</text>
          </g>
        ))}
        <BushPlane x={px} y={lerp(540, 470, ease(f, 0, 140))} scale={0.7} f={f} facing={1} mode="fly" propSpeed={1.2} />
        <NearDrift f={f} seed={13} />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={DEP.sky1} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={DEP.manila}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'THE DROP', 2: 'ANNOUNCED', 3: 'FOUR QUESTIONS', 4: 'THE SHARE TERMS', 5: 'THE MERGER JAR', 6: 'THE AI COUNT', 7: 'AIDEA LIST', 8: 'THE BLANKS', 9: 'THE CASE FOR BLANKS', 10: 'OKLO AT EIELSON', 11: 'TWO CLOCKS', 12: 'SHARES NOT A REACTOR', 13: 'THE BUTTON'};
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
  return Comp ? <Comp p={p} /> : <Rough n={n} title={TITLES[n] ?? ''} p={p} />;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1029Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1029Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1029: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 8, 14, 22, 36, 46, 56, 64, 72, 84, 96, 108, 116, 124].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: DEP.sky0}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1E1230" ink="#F3EBD7" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
