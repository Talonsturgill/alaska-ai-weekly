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
import {DEP, DepotBG, NearDrift, Crate, NuSunTag, TagPost, NuSunOutline, Chip, Calendar, MergerJar, CoinStream, PaperDoc, Sled, PoleLight, Mailroom, CountBox} from './lib/depot';
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

const SOURDOUGH_X = 205, GROUND_Y = 1330;
const Hero: React.FC<{f: number; x?: number; y?: number; s?: number; emotion?: 'proud' | 'confident' | 'faltering' | 'frozen'; glow?: number; facing?: 1 | -1}> = ({f, x = SOURDOUGH_X, y = GROUND_Y, s = 0.74, emotion = 'proud', glow = 1, facing = 1}) => (
  <Sourdough frame={f} x={x} y={y} scale={s} facing={facing} emotion={emotion} glow={glow} />
);

/** a mono label inside its own measured rect so text_fit can pair them (rect first, text centered on it) */
const Lab: React.FC<{x: number; y: number; text: string; size: number; fill: string; ls?: number}> = ({x, y, text, size, fill, ls = 1}) => {
  const w = monoW(text, size, ls) + 28;
  return (
    <g>
      <rect x={x - w / 2} y={y - size} width={w} height={size * 1.3} fill="none" />
      <text x={x} y={y} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={ls} fill={fill}>{text}</text>
    </g>
  );
};
const TagBackTerms: React.FC<{f: number; slot: number; sticker: number; band: number; strike: number; ticket: number}> = ({f, slot, sticker, band, strike, ticket}) => (
  <g>
    <rect x={-162} y={64} width={324} height={64} rx={4} fill={DEP.sky1} stroke={INK} strokeWidth={5} />
    <text x={0} y={110} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} letterSpacing={3} fill={DEP.manila}>SHARES</text>
    <Lab x={-70} y={168} text="SHARE PRICE" size={22} ls={2} fill="#4A3510" />
    <rect x={-150} y={180} width={300} height={104} rx={8} fill="none" stroke={slot > 0 && sticker < 0.5 ? '#1E7F93' : '#7A6020'} strokeWidth={5} strokeDasharray="14 9" strokeDashoffset={-f * 0.5} />
    <g transform={`translate(0,${232 + (1 - sticker) * -80}) rotate(${-4 * sticker}) scale(${0.7 + 0.3 * sticker})`} opacity={clamp01(sticker * 3)}>
      <rect x={-130} y={-44} width={260} height={88} rx={8} fill={DEP.gold} stroke={INK} strokeWidth={5} />
      <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={58} fill={INK}>$9.25</text>
    </g>
    <g opacity={band} transform="translate(-150,296)">
      <rect x={0} y={-5} width={300} height={10} fill={DEP.gold} stroke={INK} strokeWidth={3} />
      <Lab x={150} y={34} text="ABOUT 14.5% BELOW" size={20} ls={1} fill="#4A3510" />
    </g>
    <g opacity={strike} transform={`translate(0,${420 - 14 * (1 - strike)})`}>
      <Lab x={0} y={0} text="$10.82" size={52} fill="#4A3510" />
      <line x1={-100} y1={-18} x2={100} y2={-18} stroke={INK} strokeWidth={6} />
      <Lab x={0} y={34} text="REFERENCE PRICE" size={18} ls={1} fill="#4A3510" />
    </g>
    <g transform={`translate(${40 + 90 * (1 - ticket) * 0},${505 + 4 * Math.sin(f / 7)}) rotate(${5 * Math.sin(f / 9)})`} opacity={ticket}>
      <path d="M -150,-26 L 0,-26 L 0,26 L -150,26 Z" fill={DEP.paper} stroke={INK} strokeWidth={4} strokeDasharray="10 6" />
      <Lab x={-75} y={9} text="HALF WARRANT" size={20} fill={INK} />
    </g>
  </g>
);
// ---- S1: the drop (line 0) -------------------------------------------------------------------------------------------------------------------
const POST_X = 640, POST_TOP = 660, TAG_Y = 740;
const PLANE = '#E4D9B8';
/** the AIDEA condition blocks stapled over the stamped lines of the tag (tag at tx,ty, scale ts) */
const CondChips: React.FC<{tx: number; ty: number; ts?: number; f: number; t0: number}> = ({tx, ty, ts = 1, f, t0}) => (
  <g>
    {['TECHNOLOGY', 'APPROVALS', 'FINANCING', 'HOST COMMUNITIES'].map((c, i) => {
      const k = springy(f, t0 + i * 7, 18);
      const size = Math.round(24 * ts);
      const w = monoW(c, size) + 36;
      const cx = tx - 190 * ts - 14 - w / 2;
      return (
        <g key={c}>
          <line x1={cx + w / 2} y1={ty + (232 + i * 76 - 4) * ts} x2={tx - 190 * ts + 6} y2={ty + (232 + i * 76 - 4) * ts} stroke={INK} strokeWidth={5} opacity={clamp01(k)} />
          <Chip x={cx - (1 - k) * 420} y={ty + (232 + i * 76 - 4) * ts} text={c} size={size} tone="paper" rot={(i % 2 ? 1 : -1) * 1.6} k={clamp01(k * 2)} />
        </g>
      );
    })}
  </g>
);

const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t1 = b(1), t2 = b(2), t3 = b(3);
  const px = lerp(60, 1300, easeIO(f, 0, Math.max(60, t2 + 70)));
  const fall = clamp01((f - (t2 - 26)) / 26);
  const crateY = lerp(540, GROUND_Y + 10, fall * fall);
  const crateX = lerp(px * 0.62 + 120, 420, fall);
  const land = f >= t2 - 2 ? bump(f, t2 - 2, 20) : 0;
  const flip = f < t2 ? 0.5 : 0.5 * (1 - springy(f, t2, 30));
  const asked: LineState[] = f > t3 ? ['asked', 'asked', 'asked', 'asked'] : ['blank', 'blank', 'blank', 'blank'];
  const cam = track([{t: 0, z: 1.08, fx: 540, fy: 1040}, {t: p.dur, z: 1.0, fx: 560, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="$25M OF A REACTOR COMPANY" y={520} size={34} tone="gold" p={ease(f, t1 + 4, 8) * (1 - ease(f, t3 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="NOT A REACTOR · A COMPANY" y={520} size={34} tone="cyan" p={ease(f, t3, 8)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s1" />
        <TagPost x={POST_X} y={GROUND_Y + 10} top={POST_TOP} />
        <NuSunTag x={POST_X} y={TAG_Y} s={0.85} f={f} flip={flip} states={asked} id="s1t" />
        <NuSunOutline x={915} y={GROUND_Y + 6} s={0.62} f={f} k={ease(f, 0, 20)} alpha={0.9} />
        <Hero f={f} x={230} emotion="proud" glow={0.8 + 0.2 * land} />
        {f < t2 + 4 && (
          <g transform={`translate(${crateX},${crateY}) rotate(${(1 - fall) * 18})`} opacity={f > t2 - 40 ? 1 : 0}>
            <Crate x={0} y={0} s={0.8} f={f} lid={0} thump={0} />
          </g>
        )}
        {f >= t2 + 4 && <Crate x={420} y={GROUND_Y + 10} s={0.8} f={f} lid={0.12 * springy(f, t2 + 4, 14)} thump={land} />}
        <BushPlane x={px} y={lerp(640, 560, ease(f, 0, 140))} scale={0.7} f={f} facing={1} mode="fly" propSpeed={1.2} body={PLANE} />
        <NearDrift f={f} seed={1} />
      </SVG>
    </Frame>
  );
};

// ---- S2: announced (line 1) --------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t4 = b(4), t5 = b(5), t6 = b(6);
  const slap = ease(f, t4 - 4, 14);
  const cam = track([{t: 0, z: 1.06, fx: 540, fy: 1020}, {t: p.dur, z: 1.0, fx: 540, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="OCT 19TH · NUCUBE ENERGY · IDAHO" y={510} size={30} tone="dark" p={ease(f, t4 + 4, 8) * (1 - ease(f, t6 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['AIDEA · ALASKA INDUSTRIAL', 'DEVELOPMENT AND EXPORT AUTHORITY']} text="AIDEA · ALASKA INDUSTRIAL DEVELOPMENT AND EXPORT AUTHORITY" y={528} size={26} tone="paper" p={ease(f, t6 + 2, 8)} />
      </>}>
      <SVG>
        <Mailroom f={f + p.from} id="s2" />
        <g transform={`translate(540,${lerp(300, 1000, slap)}) rotate(${(1 - slap) * -6})`}>
          <PaperDoc x={0} y={0} w={520} h={600} rot={-1.5} head="PRESS RELEASE" rows={8} f={f} />
          {[-1, 1].map((sx) => <circle key={sx} cx={sx * 200} cy={-270} r={13} fill={DEP.manila} stroke={INK} strokeWidth={4} />)}
          <StampMark text="ANNOUNCED" x={-60} y={150} rot={-9} p={ease(f, t5, 8)} size={38} color={INK} />
          <g transform="translate(120,-60)" opacity={ease(f, t6, 8)} >
            <circle r={74 + 5 * Math.sin(f / 5)} fill="none" stroke={INK} strokeWidth={8} />
            <circle r={56} fill={INK} opacity={0.88} />
            <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={36} letterSpacing={2} fill={DEP.manila}>AIDEA</text>
          </g>
        </g>
        <rect x={-40} y={1500} width={1160} height={460} fill="#3F486A" stroke={INK} strokeWidth={6} data-band="ok" />
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
  const draw = ease(f, t7, 40);
  const fall = clamp01((f - t10) / 40);
  const tagY = lerp(900, 1380, fall * fall);
  const tagX = 880 + 8 * Math.sin(f / 4) * (1 - fall);
  const cam = track([{t: 0, z: 1.06, fx: 560, fy: 1040}, {t: p.dur, z: 1.0, fx: 600, fy: 1010}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['NUSUN', 'SOLID-STATE, HEAT-PIPE-COOLED']} text="NUSUN · SOLID-STATE, HEAT-PIPE-COOLED" y={520} size={28} tone="cyan" p={ease(f, t7 + 8, 8)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s3" />
        <TagPost x={POST_X - 140} y={GROUND_Y + 10} top={POST_TOP} />
        <NuSunTag x={POST_X - 140} y={TAG_Y} s={0.85} f={f} states={states} id="s3t" />
        <NuSunOutline x={880} y={GROUND_Y + 6} s={0.9} f={f} k={draw} label={draw > 0.9} name="NUSUN" />
        <Hero f={f} x={190} emotion={f > t10 + 20 ? 'faltering' : 'proud'} s={0.78} />
        {f >= t10 - 20 && <SmallTag x={tagX} y={tagY} text="PRICE" rot={-8 + 20 * fall} op={clamp01((f - (t10 - 20)) / 10)} />}
        <NearDrift f={f} seed={3} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the share terms (line 3) ------------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t12 = b(12), t44 = b(44), t13 = b(13), t14 = b(14), t47 = b(47), t15 = b(15);
  const flip = easeIO(f, t12, 20);
  const slot = ease(f, t44, 10);
  const sticker = springy(f, t13, 22);
  const band = ease(f, t14, 12);
  const strike = ease(f, t47, 12);
  const ticket = ease(f, t15, 14);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: Math.max(40, t13), z: 1.2, fx: 540, fy: 960}, {t: p.dur, z: 1.14, fx: 560, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="THE SHARE TERMS" y={1170} size={34} tone="dark" p={ease(f, t12 + 4, 8) * (1 - ease(f, t44 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="SHARE PRICE" y={1170} size={34} tone="dark" p={ease(f, t44 + 2, 8) * (1 - ease(f, t13 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="$9.25 A SHARE" y={1170} size={44} tone="gold" p={ease(f, t13 + 2, 8) * (1 - ease(f, t14 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="~14.5% BELOW" y={1170} size={38} tone="dark" p={ease(f, t14 + 2, 8) * (1 - ease(f, t47 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="$10.82 REFERENCE PRICE" y={1170} size={32} tone="dark" p={ease(f, t47 + 2, 8) * (1 - ease(f, t15 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['HALF A WARRANT A SHARE', '$11.50 · 5 YEARS']} text="HALF A WARRANT A SHARE · $11.50 · 5 YEARS" y={1190} size={28} tone="paper" p={ease(f, t15 + 4, 8)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s4" dim={0.18} />
        <TagPost x={540} y={GROUND_Y + 60} top={1000} />
        <NuSunTag x={540} y={400} s={1.12} f={f} flip={flip} sway={0.5} back={<TagBackTerms f={f} slot={slot} sticker={sticker} band={band} strike={strike} ticket={ticket} />} id="s4t" />
        <NearDrift f={f} seed={4} y={1780} />
      </SVG>
    </Frame>
  );
};

// ---- S5: the merger jar (line 4) ----------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t16 = b(16), t17 = b(17), t18 = b(18);
  const slide = ease(f, t16 - 4, 24);
  const pour = clamp01((f - t17) / 60);
  const aid = springy(f, t18, 26);
  const fill = f < t18 ? 0.1 * pour : 0.1 + 0.23 * aid;
  const jx = lerp(1300, 600, slide);
  const heroX = lerp(-120, 215, slide) + 6 * Math.sin(f / 9) * (1 - slide);
  const planeX = 560 + (f - t17) * 14;
  const cam = track([{t: 0, z: 1.06, fx: 600, fy: 1040}, {t: p.dur, z: 1.0, fx: 560, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="MERGER WITH LAUNCH TWO" y={520} size={30} tone="dark" p={ease(f, t16 + 6, 8) * (1 - ease(f, t17 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="$75M CASH TO CLOSE" y={520} size={40} tone="gold" p={ease(f, t17, 8) * (1 - ease(f, t18 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="AIDEA'S $25M COUNTS" y={520} size={36} tone="paper" p={ease(f, t18 + 4, 8)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s5" />
        <PoleLight x={96} y={GROUND_Y + 10} f={f} />
        <TagPost x={940} y={GROUND_Y + 10} top={POST_TOP} />
        <NuSunTag x={940} y={TAG_Y + 60} s={0.66} f={f} flip={1} sway={1.2} back={<TagBackTerms f={f} slot={1} sticker={1} band={1} strike={1} ticket={1} />} id="s5t" />
        <g transform={`translate(${jx},0)`}>
          <Sled x={0} y={GROUND_Y + 12} f={f} w={380}>
            <g transform="translate(0,0) scale(0.84)"><MergerJar x={0} y={0} f={f} fill={fill} aidea={0} /></g>
          </Sled>
          <text x={0} y={1235} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={2} fill={INK} opacity={0.8}>LAUNCH TWO MERGER</text>
          <g transform="translate(160,938)">
            <rect x={-6} y={-16} width={98} height={32} rx={4} fill={DEP.gold} stroke={INK} strokeWidth={4} opacity={ease(f, t17, 10)} />
            <text x={43} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={INK} opacity={ease(f, t17, 10)}>$75M</text>
          </g>
          <CoinStream x={0} y0={680} y1={1280 - 340 * fill} f={f} on={f > t17 && f < t18 + 6 ? 1 : 0} seed={3} />
          {f >= t18 && (
            <g transform={`translate(0,${lerp(-420, 0, aid)})`}>
              <rect x={-120} y={1100} width={240} height={96} rx={8} fill="#FFE08A" stroke={INK} strokeWidth={6} />
              <text x={0} y={1162} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} fill={INK}>AIDEA</text>
            </g>
          )}
        </g>
        {f > t17 - 40 && f < t17 + 120 && <BushPlane x={planeX} y={660} scale={0.62} f={f} facing={1} mode="fly" propSpeed={1.2} body={PLANE} />}
        <path d={`M ${heroX + 70},${GROUND_Y - 110} Q ${(heroX + jx) / 2},${GROUND_Y - 40 + 24 * (1 - slide)} ${jx - 215},${GROUND_Y - 24}`} stroke={DEP.manilaDeep} strokeWidth={9} fill="none" strokeLinecap="round" />
        <path d={`M ${heroX + 70},${GROUND_Y - 110} Q ${(heroX + jx) / 2},${GROUND_Y - 40 + 24 * (1 - slide)} ${jx - 215},${GROUND_Y - 24}`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Hero f={f} x={heroX} y={GROUND_Y} s={0.66} emotion={f > t18 ? 'proud' : 'confident'} />
        <NearDrift f={f} seed={5} y={1770} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the AI count (line 5) -----------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t19 = b(19), t20 = b(20), t21 = b(21);
  const slide = ease(f, t19 - 4, 16);
  const one = f >= t20;
  const sweep1 = ease(f, t20 - 8, 30);
  const sweep2 = ease(f, t21 - 6, 40);
  const droop = ease(f, t21, 30);
  const cam = track([{t: 0, z: 1.06, fx: 520, fy: 1000}, {t: p.dur, z: 1.02, fx: 540, fy: 1010}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="NUCUBE'S FILING" y={520} size={32} tone="dark" p={ease(f, t19 + 6, 8) * (1 - ease(f, t20 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['AI DATA CENTER ENERGY DEMAND', 'ONCE']} text={`NUCUBE'S FILING · "AI DATA CENTER ENERGY DEMAND" · ONCE`} y={535} size={26} tone="gold" p={ease(f, t20, 8) * (1 - ease(f, t21 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="ALASKA PARAGRAPHS · AI 0" y={520} size={34} tone="cyan" p={ease(f, t21, 8)} />
      </>}>
      <SVG>
        <Shed f={f + p.from} id="s6" lampX={430} window={false} counterY={1500} />
        <Lamp x={430} f={f} />
        <g transform={`translate(${lerp(-400, 440, slide)},960)`}>
          <PaperDoc x={0} y={0} w={640} h={700} rot={-1} head="NUCUBE FILING" rows={0} f={f} />
          <rect x={-290} y={-130} width={580} height={250} rx={4} fill="#EFE2B8" stroke={INK} strokeWidth={3} />
          <text x={-270} y={-100} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill="#6B4E1B">MARKET TRENDS</text>
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-270} y={-76 + i * 38} width={i === 3 ? 260 : 540} height={13} rx={4} fill="#3A2E1B" opacity={0.22} />)}
          <rect x={-270} y={-45} width={540 * sweep1} height={22} fill={INK} opacity={0.22} />
          <rect x={-270} y={-45} width={Math.min(300, 540 * sweep1)} height={22} fill="none" stroke={INK} strokeWidth={3} opacity={sweep1 > 0.05 ? 0.9 : 0} />
          <rect x={-290} y={150} width={580} height={190} rx={4} fill="#E3E8F4" stroke={INK} strokeWidth={3} />
          <text x={-270} y={178} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill="#2B3F6A">ALASKA</text>
          {[0, 1, 2].map((i) => <rect key={i} x={-270} y={202 + i * 36} width={i === 2 ? 220 : 540} height={13} rx={4} fill="#3A2E1B" opacity={0.2} />)}
          <rect x={-270} y={198} width={540 * sweep2} height={20} fill={INK} opacity={0.12} />
          <rect x={-290 + 580 * sweep2 - 6} y={150} width={12} height={190} fill={DEP.cyan} opacity={sweep2 > 0 && sweep2 < 1 ? 0.7 : 0} />
        </g>
        <CountBox x={880} y={1190} s={0.9} f={f} digit={one ? '1' : '0'} label="AI COUNT" pop={bump(f, t20, 14)} />
        <g transform={`translate(${900 - 20 * droop},${650 + 90 * droop}) scale(${0.5 - 0.06 * droop})`} opacity={clamp01((f - t19) / 14)}>
          <ServerMachine frame={f} emotion="ghost" x={0} y={0} scale={1} />
        </g>
        <g transform="translate(820,560)" opacity={clamp01((f - t19 - 8) / 12) * (1 - droop)}>
          <text x={0} y={0} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={90} fill={DEP.cyan} opacity={0.8}>?</text>
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S7: AIDEA's list (line 6) -------------------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t22 = b(22), t23 = b(23), t24 = b(24);
  const cam = track([{t: 0, z: 1.06, fx: 540, fy: 1020}, {t: p.dur, z: 1.0, fx: 540, fy: 1000}]);
  const names = ['MINING', 'SEAFOOD', 'MANUFACTURING', 'DATA CENTERS'];
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="AIDEA · RELEASE" y={510} size={30} tone="dark" p={ease(f, t22, 8) * (1 - ease(f, t23 + 6, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['AIDEA · MINING · SEAFOOD ·', 'MANUFACTURING · DATA CENTERS']} text="AIDEA · MINING · SEAFOOD · MANUFACTURING · DATA CENTERS" y={530} size={26} tone="paper" p={ease(f, t23 + 8, 8) * (1 - ease(f, t24 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="AI · NOT SAID" y={520} size={34} tone="dark" p={ease(f, t24 + 4, 8)} />
      </>}>
      <SVG>
        <Shed f={f + p.from} id="s7" lampX={760} counterY={1500} />
        <Lamp x={760} f={f} />
        <rect x={150} y={620} width={780} height={640} rx={8} fill="#6A4630" stroke={INK} strokeWidth={8} opacity={0.96} />
        {[0, 1, 2, 3].map((i) => <circle key={i} cx={540} cy={700 + i * 120} r={9} fill="#8A8F99" stroke={INK} strokeWidth={3} />)}
        {names.map((n, i) => {
          const k = springy(f, t22 + i * 6, 22);
          const hot = i === 3 && f >= t23;
          const rise = hot ? 14 * Math.sin(clamp01((f - t23) / 12) * Math.PI) : 0;
          return (
            <g key={n} transform={`translate(${540 + (1 - k) * (i % 2 ? 600 : -600) + 4 * Math.sin(f / 17 + i)},${0})`}>
              <Chip x={0} y={730 + i * 120 - rise} text={n} size={40} tone={hot ? 'dark' : 'paper'} rot={(i - 1.5) * 1.6 + 1.2 * Math.sin(f / 13 + i)} k={clamp01(k * 2)} />
            </g>
          );
        })}
        <g transform="translate(540,1218)" opacity={ease(f, t24 - 4, 8)}>
          <rect x={-130} y={-40} width={260} height={80} rx={10} fill="none" stroke={DEP.cyan} strokeWidth={6} strokeDasharray="16 10" strokeDashoffset={-f * 0.8} />
          <text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={50} fill={DEP.cyan} opacity={0.55}>AI</text>
        </g>
        <StampMark text="NOT SAID" x={650} y={1150} rot={-10} p={ease(f, t24, 8)} size={32} color={INK} />
      </SVG>
    </Frame>
  );
};

// ---- S8: the blanks (line 7), the signature shot ---------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t25 = b(25), t26 = b(26), t27 = b(27), t48 = b(48);
  const flip = 0.5 * (1 - ease(f, t25 - 12, 24));
  const stamps = [ease(f, t26, 10), ease(f, t27, 10), ease(f, t27 + 12, 10), ease(f, t27 + 24, 10)];
  const states: LineState[] = stamps.map((s) => (s > 0.1 ? 'stamped' : 'blank'));
  const dimGlow = 1 - 0.55 * ease(f, t26, 60) - 0.3 * ease(f, t48, 30);
  const cam = track([{t: 0, z: 1.02, fx: 540, fy: 1000}, {t: Math.max(30, t26 - 20), z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.0, fx: 540, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['SIZE · SITE · PRICE · DATE', 'NOT STATED']} text="SIZE · SITE · PRICE · DATE · NOT STATED" y={520} size={30} tone="red" p={ease(f, t27 + 30, 10)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s8" dim={0.12} />
        <Hero f={f} x={190} y={GROUND_Y} s={0.72} emotion="faltering" glow={dimGlow} />
        <NuSunOutline x={915} y={GROUND_Y + 6} s={0.74} f={f} k={1} alpha={0.9} />
        <TagPost x={555} y={GROUND_Y + 20} top={POST_TOP} />
        <NuSunTag x={555} y={TAG_Y} s={1.0} f={f} flip={flip} states={states} stampP={stamps} sway={0.4} id="s8t" />
        <NearDrift f={f} seed={8} y={1780} />
      </SVG>
    </Frame>
  );
};

// ---- S9: the case for blanks (line 8) -----------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t30 = b(30), t31 = b(31), t32 = b(32);
  const walk = ease(f, t30 - 8, 36);
  const cam = track([{t: 0, z: 1.06, fx: 580, fy: 1030}, {t: p.dur, z: 1.0, fx: 560, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="THE CASE FOR BLANKS" y={520} size={36} tone="dark" p={ease(f, t30 + 4, 8) * (1 - ease(f, t31 + 8, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['DEPENDS ON · TECHNOLOGY · APPROVALS ·', 'FINANCING · HOST COMMUNITIES']} text="DEPENDS ON · TECHNOLOGY · APPROVALS · FINANCING · HOST COMMUNITIES" y={535} size={24} tone="paper" p={ease(f, t31 + 18, 8) * (1 - ease(f, t32 + 14, 8))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['A DISCOUNT IS WHAT', 'AN EARLY BLANK COSTS']} text="A DISCOUNT IS WHAT AN EARLY BLANK COSTS" y={538} size={30} tone="gold" p={ease(f, t32 + 16, 8)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s9" dim={0.22} />
        <PoleLight x={330} y={GROUND_Y + 10} f={f} on={f < 2 ? 0 : 1} />
        <TagPost x={660} y={GROUND_Y + 20} top={POST_TOP} />
        <NuSunTag x={660} y={TAG_Y} s={1.0} f={f} states={['stamped', 'stamped', 'stamped', 'stamped']} stampP={[1, 1, 1, 1]} sway={0.5} id="s9t" />
        <CondChips tx={660} ty={TAG_Y} f={f} t0={t31} />
        <Hero f={f} x={965} y={GROUND_Y} s={0.5} emotion="faltering" glow={0.5} facing={-1} />
        <g transform={`translate(${lerp(-300, 112, walk)},${GROUND_Y + 8})`}>
          <CashBlock x={0} y={0} f={f} scale={0.44} emotion="smug" id="s9cb" band="EARLY" knock={f > t31 ? 0.4 : 0} />
          <g transform={`translate(34,-290) rotate(${10 * Math.sin(f / 9)} 0 -30)`} opacity={ease(f, t32, 10)}>
            <line x1={0} y1={-60} x2={0} y2={-6} stroke={INK} strokeWidth={4} />
            <SmallTag x={0} y={30} text="HALF WARRANT" size={20} />
            <rect x={-92} y={44} width={184} height={12} fill={DEP.gold} stroke={INK} strokeWidth={3} />
          </g>
        </g>
        <NearDrift f={f} seed={9} y={1790} />
      </SVG>
    </Frame>
  );
};

// ---- S10: Oklo at Eielson (line 9) -------------------------------------------------------------------------------------------------------------
const PIN: [number, number] = [560, 300];
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t33 = b(33), t34 = b(34), t35 = b(35), t45 = b(35) + 22;
  const cam = track([{t: 0, z: 1.5, fx: 560, fy: 1180}, {t: Math.max(30, t33 + 40), z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.05, fx: 540, fy: 1010}]);
  const spin = f - t35;
  const sink = ease(f, t45, 30);
  const trem = bump(f, t45, 22) * 4 * Math.sin(f * 1.7);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['OKLO · EIELSON', 'AIR FORCE BASE']} text="OKLO · EIELSON AIR FORCE BASE" y={500} size={30} tone="dark" p={ease(f, t33 + 20, 8) * (1 - ease(f, t34 + 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['AT LEAST 5 MW ELECTRIC', 'EARLY 2030s · OKLO']} text="AT LEAST 5 MW ELECTRIC · EARLY 2030s · OKLO" y={510} size={28} tone="paper" p={ease(f, t34 + 4, 8) * (1 - ease(f, t35 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['BOREHOLE DRILLING', 'LATE 2026 · OKLO']} text="BOREHOLE DRILLING · LATE 2026 · OKLO" y={510} size={28} tone="gold" p={ease(f, t35 + 2, 8)} />
      </>}>
      <SVG>
        <g transform={`translate(${trem},0)`}>
          <rect x={0} y={0} width={W} height={H} fill="#2A1D3A" />
          <rect data-band="ok" x={0} y={620} width={W} height={860} fill="#E7DDC2" stroke={INK} strokeWidth={8} />
          {Array.from({length: 9}, (_, i) => <line key={i} x1={0} y1={620 + i * 100} x2={W} y2={620 + i * 100} stroke="#B8AD90" strokeWidth={2.5} opacity={0.6} />)}
          <g transform="translate(60,660) scale(0.95)">
            <path d={AK_PATH} fill="#BFCBE6" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <g transform={`translate(${PIN[0]},${PIN[1]})`}>
              <circle r={18 + 5 * Math.sin(f / 6)} fill={INK} stroke={DEP.paper} strokeWidth={5} />
              <circle r={44} fill="none" stroke={INK} strokeWidth={4} opacity={0.4 + 0.3 * Math.sin(f / 8)} />
            </g>
          </g>
          <text x={540} y={1490} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill="#6B5B3A">SCHEMATIC MAP · NOT A SITE PLAN</text>
          <g transform="translate(700,1130)">
            <NuSunOutline x={0} y={0} s={0.5} f={f} k={ease(f, t33 + 24, 40)} alpha={0.95} label name="OKLO" variant="oklo" />
            <g opacity={ease(f, t34, 10)}><SmallTag x={-4} y={-250} text="EARLY 2030s" size={24} rot={-4} /></g>
          </g>
          <g transform={`translate(420,${1090 + 50 * sink})`} opacity={ease(f, t35 - 10, 10)}>
            <rect x={-8} y={-130} width={16} height={130} fill="#8A8F99" stroke={INK} strokeWidth={4} />
            <g transform={`rotate(${(spin * 20) % 360} 0 0)`}><rect x={-40} y={-6} width={80} height={12} fill="#6D7280" stroke={INK} strokeWidth={4} /></g>
            <path d="M-10,0 L10,0 L0,40 Z" fill="#8A8F99" stroke={INK} strokeWidth={4} />
          </g>
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S11: two clocks (line 10) ---------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t46 = b(46), t49 = b(49), t36 = b(36), t37 = b(37);
  const wall = ease(f, t46 - 4, 18);
  const hang = f < t49 ? 0 : springy(f, t49 - 2, 22);
  const cross = ease(f, t36, 80);
  const frost = ease(f, t37, 90);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.06, fx: 560, fy: 1010}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="ENSTAR'S PRESIDENT" y={500} size={30} tone="dark" p={ease(f, t46 + 6, 8) * (1 - ease(f, t36 - 2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['ENSTAR · WINTER GAS SHORTAGE', '18 DAYS · 3 BCF']} text="ENSTAR · WINTER GAS SHORTAGE · 18 DAYS · 3 BCF" y={520} size={28} tone="dark" p={ease(f, t36, 8) * (1 - ease(f, t37 + 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="NO DATE REACHES THIS WINTER" y={510} size={30} tone="cyan" p={ease(f, t37 + 8, 8)} />
      </>}>
      <SVG>
        <g transform={`translate(${(1 - wall) * 600},0)`}>
          <Shed f={f + p.from} id="s11" lampX={540} frost={frost} counterY={1400} />
          <rect x={544} y={560} width={14} height={40} fill="#8A8F99" stroke={INK} strokeWidth={4} />
        </g>
        <Calendar x={560} y={1200} s={1.0} f={f} n={18} slam={hang} frost={frost * 0.8} cross={cross} />
        <g transform="translate(930,760)" opacity={ease(f, t37, 12)}>
          <NuSunTag x={0} y={0} s={0.4} f={f} states={['stamped', 'stamped', 'stamped', 'stamped']} stampP={[1, 1, 1, 1]} sway={0.8} id="s11t" />
          <rect x={-76} y={0} width={152} height={70} fill="#FFFFFF" opacity={0.45 * frost} />
        </g>
        <g transform="translate(450,1400)" opacity={ease(f, t37, 12)}>
          <NuSunOutline x={0} y={0} s={0.34} f={f} k={1} alpha={0.9} />
        </g>
        <g transform="translate(700,1400)" opacity={ease(f, t37 + 6, 12)}>
          <NuSunOutline x={0} y={0} s={0.34} f={f} k={1} alpha={0.9} variant="oklo" />
          <SmallTag x={0} y={-150} text="EARLY 2030s" size={18} rot={3} />
        </g>
        <Hero f={f} x={170} y={1400} s={0.58} emotion={cross > 0.3 ? 'faltering' : 'confident'} glow={1 - 0.8 * cross} />
      </SVG>
    </Frame>
  );
};

// ---- S12: shares, not a reactor (line 11) -------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t38 = b(38), t39 = b(39), t40 = b(40);
  const open = ease(f, t38 - 10, 22);
  const rise = easeIO(f, t38 + 6, 30);
  const flip = ease(f, t39 - 4, 22);
  const toOutline = easeIO(f, t40 - 14, 34);
  const fall = clamp01((f - (t40 + 14)) / 44);
  const cx = lerp(330 + 40, 900, toOutline);
  const cy = lerp(lerp(1250, 940, rise), 1380, fall * fall);
  const cam = track([{t: 0, z: 1.04, fx: 560, fy: 1040}, {t: p.dur, z: 1.1, fx: 620, fy: 1030}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="SHARES, NOT A REACTOR" y={520} size={34} tone="gold" p={ease(f, t38 + 4, 8) * (1 - ease(f, t39 + 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="THE TERMS ARE FILLED IN" y={520} size={34} tone="paper" p={ease(f, t39 + 6, 8) * (1 - ease(f, t40 - 6, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['THE REACTOR IS', 'STILL A DOTTED LINE']} text="THE REACTOR IS STILL A DOTTED LINE" y={535} size={34} tone="cyan" p={ease(f, t40 + 2, 10)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s12" />
        <TagPost x={640} y={GROUND_Y + 10} top={POST_TOP} />
        <NuSunTag x={640} y={TAG_Y} s={0.8} f={f} flip={flip} back={<TagBackTerms f={f} slot={1} sticker={1} band={1} strike={1} ticket={1} />} id="s12t" />
        <Hero f={f} x={170} emotion={f > t40 + 40 ? 'faltering' : 'confident'} s={0.7} />
        <NuSunOutline x={915} y={GROUND_Y + 6} s={0.9} f={f} k={1} label />
        <g>
          <Crate x={400} y={GROUND_Y + 10} s={0.8} f={f} lid={0.12 + 0.88 * open} />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${340 + i * 28},${1130} q ${i % 2 ? 14 : -14},-30 ${i * 4 - 8},-60`} stroke="#D9C37A" strokeWidth={5} fill="none" strokeLinecap="round" opacity={open} />)}
        </g>
        <Certificate x={cx} y={cy} rot={-6 + 14 * fall} s={0.62} f={f} />
        <NearDrift f={f} seed={12} />
      </SVG>
    </Frame>
  );
};

// ---- S13: the button (line 12) ----------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t41 = b(41), t42 = b(42), t43 = b(43);
  const out = ease(f, p.dur - 16, 14);
  const px = lerp(150, 1300, easeIO(f, 0, 150));
  const flip = 0.5 * (1 - springy(f, t43, 30));
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.0, fx: 540, fy: 1000}]);
  const boxes = ['SIZE', 'SITE', 'PRICE', 'DATE'];
  return (
    <Frame p={p} cam={cam} dim={out}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['WHAT SHOULD AIDEA PUBLISH,', 'AND BY WHEN?']} text="WHAT SHOULD AIDEA PUBLISH, AND BY WHEN?" y={500} size={32} tone="dark" p={ease(f, t41 + 6, 8)} />
      </>}>
      <SVG>
        <DepotBG f={f + p.from} id="s13" />
        <TagPost x={POST_X} y={GROUND_Y + 10} top={POST_TOP} />
        <NuSunTag x={POST_X} y={TAG_Y} s={0.85} f={f} flip={Math.max(0, flip)} states={['stamped', 'stamped', 'stamped', 'stamped']} stampP={[1, 1, 1, 1]} flutter={ease(f, t43, 20) * 0.5} id="s13t" />
        <CondChips tx={POST_X} ty={TAG_Y} ts={0.85} f={f} t0={-60} />
        <Hero f={f} x={990} s={0.62} emotion="confident" facing={-1} />
        <Crate x={290} y={GROUND_Y + 24} s={0.62} f={f} lid={0.15} />
        {boxes.map((n, i) => (
          <g key={n} transform={`translate(${440 + i * 130},${lerp(640, 676 + 5 * Math.sin(f / 6 + i), ease(f, t42 + i * 6, 14))})`} opacity={ease(f, t42 + i * 6, 8)}>
            <rect x={-54} y={-40} width={108} height={80} rx={8} fill="none" stroke={DEP.cyan} strokeWidth={5} strokeDasharray="12 9" strokeDashoffset={-f * 0.7} />
            <text x={0} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={DEP.cyan}>{n}</text>
            <text x={0} y={28} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} fill={DEP.cyan}>?</text>
          </g>
        ))}
        <BushPlane x={px} y={lerp(640, 560, ease(f, 0, 140))} scale={0.7} f={f} facing={1} mode="fly" propSpeed={1.2} body={PLANE} />
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
