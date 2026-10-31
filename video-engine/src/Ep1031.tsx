import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {MONO, monoW} from './lib/prospect';
import {FIB, Pip, PipBand, ChartBG, CableRun, Phone, Sign, Doc, ScalePans, Magnifier, Keyhole, Postcard, Gauge, Chronometer, DeskNear, AlaskaShape, WestCoast, Pin} from './lib/fiber';
import {IDS} from './Ep1031Ids';

// A Ceiling Is Not a Cable, 2026-10-31. Palette roles are art_direction.json. PIP (a faced brass question token) is the hero and the throughline: its
// engraving band reads ? (S1), VIA LOWER 48 (S4), UP TO $75M (S6), WHICH WAY? (S8), ASIA? (S11), WHO SIGNS? (S12), ? again in the phone (S13).
// Cobalt is the sea only. Vermilion is the two locks, the clock and the date only. Anything undecided is dashed graphite and never filled.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

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

type Tone = 'dark' | 'paper' | 'verm' | 'gold' | 'sea';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#0B1636', fg: '#FBF5E1', edge: '#FBF5E1'},
  paper: {fill: '#FBF5E1', fg: '#0B1636', edge: '#0B1636'},
  verm: {fill: '#FBF5E1', fg: '#B4442C', edge: '#E2512D'},
  gold: {fill: '#F2C766', fg: '#0B1636', edge: '#0B1636'},
  sea: {fill: '#12234D', fg: '#F2C766', edge: '#F2C766'},
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
const Lab: React.FC<{text: string; x: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> = ({text, x, y, size = 24, tone = 'paper', p = 1, rot = 0}) => {
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

// ---- the shot frame: a camera that can move to any focus, kick, grade ----------------------------------------------------------------------
const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; warmth?: number; children: React.ReactNode}> =
({p, cam, z0 = 1, z1 = 1.05, bloom = 0.05, vignette = 0.22, ox = 540, oy = 960, tag = true, overlay, tagText = CHIP, warmth = 0.03, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + 6 * Math.sin(p.f / 23)}px, ${jl.y + 8 * Math.sin(p.f / 17 + 1) + 6 * t}px) rotate(${0.25 * Math.sin(p.f / 31)}deg) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill={FIB.ink} stroke={FIB.brassL} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={FIB.brassL}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.04} warmth={warmth} />
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
/** the cobalt sea cutaway, a window onto the water cut into the chart. */
const SeaWindow: React.FC<{f: number; x: number; y: number; w: number; h: number; k?: number; id: string}> = ({f, x, y, w, h, k = 1, id}) => {
  if (k <= 0.01) return null;
  const hh = h * k;
  return (
    <g data-band="ok">
      <defs>
        <linearGradient id={`sw${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={FIB.seaLt} /><stop offset="0.4" stopColor={FIB.sea} /><stop offset="1" stopColor={FIB.deep} />
        </linearGradient>
        <clipPath id={`swc${id}`}><rect x={x} y={y} width={w} height={hh} rx={10} /></clipPath>
      </defs>
      <rect x={x - 8} y={y - 8} width={w + 16} height={hh + 16} rx={14} fill={FIB.ink} />
      <g clipPath={`url(#swc${id})`}>
        <rect x={x} y={y} width={w} height={hh} fill={`url(#sw${id})`} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${x - 20},${y + 22 + i * 12} ${Array.from({length: 12}).map((_, n) => `Q${x + n * 100 + 40 + 12 * Math.sin(f / 16 + n + i)},${y + 8 + i * 12 + (n % 2 ? 10 : -10)} ${x + n * 100 + 90},${y + 22 + i * 12}`).join(' ')}`}
            fill="none" stroke="#fff" strokeWidth={3 - i * 0.6} opacity={0.4 - i * 0.1} />
        ))}
        {Array.from({length: 8}).map((_, i) => <circle key={i} cx={x + ((i * 131 + f * (0.5 + (i % 3) * 0.3)) % w)} cy={y + hh - ((i * 97 + f * (0.9 + (i % 2) * 0.5)) % Math.max(10, hh))} r={3 + (i % 3)} fill="#fff" opacity={0.18} />)}
      </g>
    </g>
  );
};

const Pencil: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-120,-9 L96,-9 L132,0 L96,9 L-120,9 Z" fill={FIB.brassL} stroke={FIB.ink} strokeWidth={4} />
    <path d="M96,-9 L132,0 L96,9 Z" fill={FIB.land} stroke={FIB.ink} strokeWidth={3} />
    <path d="M122,-2 L134,0 L122,2" stroke={FIB.pencil} strokeWidth={3} />
    <rect x={-140} y={-9} width={20} height={18} fill={FIB.verm} stroke={FIB.ink} strokeWidth={3} />
  </g>
);

const FIVE: Array<{d: string; label: string; pin: [number, number]}> = [
  {d: 'M 380,1110 C 470,1180 700,1100 838,1022', label: 'WA', pin: [838, 1022]},
  {d: 'M 360,1100 C 480,1230 720,1180 824,1134', label: 'OR', pin: [824, 1134]},
  {d: 'M 340,1090 C 460,1260 700,1250 820,1196', label: 'OR', pin: [820, 1196]},
  {d: 'M 320,1080 C 440,1300 690,1320 826,1254', label: 'OR', pin: [826, 1254]},
];
const LAND_ROUTE = 'M 520,880 C 700,880 780,900 800,960';
const PENCIL_D = 'M 330,1090 C 420,1160 520,1200 610,1250';
const PENCIL_TIP: [number, number] = [610, 1250];
const ASIA_DOTS = 'M 610,1250 C 440,1330 250,1270 112,1180';

/** the unfinished graphite pencil line out from Alaska. draw 0..1. It has no endpoint, only a tip. */
const PencilLine: React.FC<{draw: number; f: number; tip?: boolean; erase?: number}> = ({draw, f, tip = true, erase = 0}) => {
  if (draw <= 0.01) return null;
  const L = 1000;
  return (
    <g opacity={1 - erase}>
      <path d={PENCIL_D} fill="none" stroke={FIB.pencil} strokeWidth={9} strokeLinecap="round" pathLength={L} strokeDasharray={`${L * draw} ${L}`} />
      <path d={PENCIL_D} fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" pathLength={L} strokeDasharray={`${L * draw} ${L}`} opacity={0.35} transform="translate(0 -2)" />
      {tip && draw > 0.02 && (
        <g transform={`translate(${lerp(330, PENCIL_TIP[0], draw)} ${lerp(1090, PENCIL_TIP[1], draw)}) rotate(${24 + 2 * Math.sin(f / 5)})`}>
          <path d="M0,0 L40,-9 L120,-9 L120,9 L40,9 Z" fill={FIB.brassL} stroke={FIB.ink} strokeWidth={4} />
          <path d="M0,0 L40,-9 L40,9 Z" fill={FIB.land} stroke={FIB.ink} strokeWidth={3} />
          <rect x={120} y={-9} width={18} height={18} fill={FIB.verm} stroke={FIB.ink} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

const Chart: React.FC<{f: number; id: string; draw?: number; pins?: number; land?: number; wall?: number; hot?: number; pulse?: boolean; asia?: number; dots?: number; pencil?: number; pencilTip?: boolean; erase?: number}> =
({f, id, draw = 1, pins = 1, land = 1, wall = 0, hot = 0, pulse = true, asia = 0, dots = 0, pencil = 0, pencilTip = false, erase = 0}) => (
  <g>
    <ChartBG f={f} id={id} />
    <g data-band="ok"><rect x={0} y={840} width={1080} height={620} fill={FIB.sea} opacity={0.24} /></g>
    <AlaskaShape x={60} y={820} s={0.5} />
    <text x={170} y={1010} fontFamily={MONO} fontWeight={900} fontSize={26} fill={FIB.ink} opacity={0.7}>ALASKA</text>
    <WestCoast f={f} />
    <g opacity={asia}>
      <path d="M-40,1000 L120,1000 Q150,1100 110,1180 Q140,1260 100,1330 L-40,1330 Z" fill={FIB.land} stroke={FIB.ink} strokeWidth={7} />
      <text x={40} y={1170} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={FIB.ink}>ASIA</text>
    </g>
    {land > 0.01 && <CableRun id={`lr${id}`} d={LAND_ROUTE} f={f} draw={land} w={11} color={FIB.landD} pulse={false} />}
    {FIVE.map((c, i) => <CableRun key={i} id={`${id}${i}`} d={c.d} f={f + i * 7} draw={clamp01(draw * 1.4 - i * 0.12)} w={13} pulse={pulse} />)}
    {FIVE.map((c, i) => <Pin key={i} x={c.pin[0]} y={c.pin[1]} f={f} p={clamp01(pins * 1.3 - i * 0.2)} />)}
    <PencilLine draw={pencil} f={f} tip={pencilTip} erase={erase} />
    {dots > 0.01 && <path d={ASIA_DOTS} fill="none" stroke={FIB.pencil} strokeWidth={7} strokeLinecap="round" strokeDasharray="2 16" pathLength={1000} style={{strokeDasharray: `2 16`}} opacity={dots} strokeDashoffset={-f * 0.5} />}
    <g opacity={wall}>
      <rect data-band="ok" x={74} y={940} width={26} height={430} rx={6} fill="#fff" opacity={0.22} stroke={FIB.sea} strokeWidth={4} />
      <path d={`M80,${960 + ((f * 3) % 380)} L96,${940 + ((f * 3) % 380)}`} stroke="#fff" strokeWidth={6} opacity={0.8 + hot * 0.2} strokeLinecap="round" />
    </g>
  </g>
);

// ---- S1: the send (line 0) ---------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t1 = b(1), t2 = b(2), t3 = b(3);
  const popK = ease(f, t1 + 4, 26);
  const leap = clamp01((f - t2) / 28);
  const sea = ease(f, t2 - 24, 30);
  const along = clamp01((f - t3) / Math.max(40, p.dur - t3 - 10));
  let px = lerp(250, 540, popK), py = lerp(1000, 1180, popK) - 140 * Math.sin(Math.min(1, popK) * Math.PI);
  if (f >= t2) { px = lerp(540, 620, leap); py = lerp(1180, 1300, leap) - 260 * Math.sin(leap * Math.PI); }
  if (f >= t3) { px = lerp(160, 940, along); py = 1330 + 28 * Math.sin(along * 7); }
  const cam = track([{t: 0, z: 1.25, fx: 380, fy: 1080}, {t: Math.max(40, t2), z: 1.1, fx: 540, fy: 1160}, {t: p.dur, z: 1.0, fx: 540, fy: 1100}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="A CHATBOT QUESTION · ALASKA.AI'S FRAMING" y={520} size={34} tone="gold" p={ease(f, t1 + 6, 8) * (1 - ease(f, t2, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="OUT OF ALASKA" y={600} size={34} tone="paper" p={ease(f, t2, 8) * (1 - ease(f, t3, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="ONE CABLE SOUTH" y={680} size={34} tone="sea" p={ease(f, t3, 8)} />
      </>}>
      <SVG>
        <ChartBG f={f + p.from} id="s1" />
        <Phone x={250} y={1090} s={1.05} f={f} glow={f < t2 ? 1 : 0.3} />
        <SeaWindow f={f} x={60} y={1150} w={960} h={330} k={sea} id="s1" />
        {sea > 0.3 && <CableRun id="s1c" d="M 70,1330 C 300,1290 500,1370 720,1320 S 960,1300 1010,1340" f={f} draw={ease(f, t2 + 6, 30)} w={16} />}
        <Pip x={px} y={py} s={lerp(0.55, 0.95, popK)} rot={f >= t3 ? 8 : 24 * (1 - popK)} f={f} emotion="curious" squash={bump(f, t2 + 26, 10) * 0.8} glow={f >= t3 ? 0.8 : 0} look={0.6} />
        {f > t1 + 40 && f < t2 + 10 && <PipBand x={px} y={py + 118} text="?" s={0.9} p={ease(f, t1 + 40, 10)} />}
        <DeskNear f={f} seed={1} />
      </SVG>
    </Frame>
  );
};

// ---- S2: four cables (line 1) -------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t4 = b(4), t5 = b(5), t6 = b(6), t37 = b(37);
  const draw = ease(f, t4 + 6, 70);
  const pins = ease(f, t5 - 6, 36);
  const bonk = bump(f, t6 + 30, 14);
  const roll = easeIO(f, t6 - 10, 40);
  const px = f < t6 - 10 ? 590 : lerp(590, 168, roll) + 8 * bonk * Math.sin(f);
  const cam = track([{t: 0, z: 2.1, fx: 380, fy: 1050}, {t: Math.max(50, t4 + 80), z: 1.0, fx: 540, fy: 1040}, {t: p.dur, z: 1.04, fx: 520, fy: 1030}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="4 SUBSEA CABLES" y={520} size={34} tone="gold" p={ease(f, t4 + 10, 8) * (1 - ease(f, t37 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="1 LAND ROUTE · PER AIDEA" y={600} size={34} tone="paper" p={ease(f, t37 + 6, 8) * (1 - ease(f, t5 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="3 OREGON · 1 WASHINGTON" y={680} size={34} tone="paper" p={ease(f, t5, 8)} />
      </>}>
      <SVG>
        <Chart f={f + p.from} id="s2" draw={draw} pins={pins} land={ease(f, t37, 30)} wall={ease(f, t6 - 20, 20)} hot={bonk} />
        <Pip x={px} y={1290} s={0.8} f={f} emotion={f > t6 ? 'puzzled' : 'curious'} look={-0.8} squash={bonk} rot={-6 * bonk} />
        <Pencil x={880} y={1620} rot={-10} />
        <DeskNear f={f} seed={2} />
      </SVG>
    </Frame>
  );
};

// ---- S3: nineteen ninety nine (line 2) ---------------------------------------------------------------------------------------------------------
const Hat: React.FC<{x: number; y: number; r?: number}> = ({x, y, r = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <path d="M-34,0 L0,-96 L34,0 Z" fill={FIB.verm} stroke={FIB.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-22,-30 L22,-30 M-14,-58 L14,-58" stroke="#fff" strokeWidth={5} opacity={0.8} />
    <circle cy={-100} r={11} fill={FIB.brassL} stroke={FIB.ink} strokeWidth={4} />
  </g>
);
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t7 = b(7), t8 = b(8), t9 = b(9);
  const hatIn = springy(f, t7, 26);
  const cam = track([{t: 0, z: 1.2, fx: 520, fy: 1120}, {t: p.dur, z: 1.0, fx: 540, fy: 1090}]);
  const pipX = lerp(-60, 1000, easeIO(f, t7 - 10, 200));
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="ALASKA UNITED EAST 1999" y={520} size={34} tone="sea" p={ease(f, t7 + 8, 8) * (1 - ease(f, t8 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="AIDEA · STATE DEVELOPMENT AUTHORITY" y={600} size={32} tone="paper" p={ease(f, t8, 8) * (1 - ease(f, t9 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['TYPICAL DESIGN LIFE · ABOUT 25 YEARS', 'PER AIDEA']} text="TYPICAL DESIGN LIFE · ABOUT 25 YEARS PER AIDEA" y={680} size={32} tone="gold" p={ease(f, t9, 8)} />
      </>}>
      <SVG>
        <ChartBG f={f + p.from} id="s3" />
        <SeaWindow f={f} x={40} y={700} w={1000} h={700} id="s3" />
        <CableRun id="s3a" d="M -40,1010 C 200,960 420,1060 640,1000 S 980,980 1120,1030" f={f} w={20} />
        <CableRun id="s3b" d="M -40,1150 C 220,1190 460,1100 680,1150 S 960,1200 1120,1140" f={f + 20} w={20} />
        <g opacity={hatIn} transform={`translate(0 ${(1 - hatIn) * -160})`}>
          <Hat x={320} y={968} r={-8} /><Hat x={720} y={1112} r={9} />
        </g>
        <Lab text="ALASKA UNITED EAST 1999" x={300} y={880} size={22} tone="paper" p={ease(f, t7 + 10, 10)} rot={-3} />
        <Lab text="ALASKA COMMUNICATIONS 1999" x={760} y={1250} size={22} tone="paper" p={ease(f, t7 + 14, 10)} rot={2} />
        <g transform={`translate(120 ${lerp(900, 1210, ease(f, t8, 14))})`} opacity={ease(f, t8, 8)}>
          <rect x={-90} y={-60} width={180} height={120} rx={8} fill={FIB.paper2} stroke={FIB.ink} strokeWidth={5} transform={`rotate(${-4 + 3 * bump(f, t8 + 12, 16)})`} />
          <text x={0} y={-12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={FIB.ink}>AIDEA</text>
          <path d="M-60,16 L60,16 M-60,34 L30,34" stroke={FIB.pencil} strokeWidth={4} />
        </g>
        <g transform="translate(540 1230)" opacity={ease(f, t9, 10)}>
          <ellipse cx={0} cy={72} rx={120} ry={14} fill="#000" opacity={0.25} />
          <rect x={-100} y={-6} width={200} height={72} rx={10} fill={FIB.paper2} stroke={FIB.ink} strokeWidth={6} />
          <rect x={-100} y={-6} width={200} height={26} rx={10} fill={FIB.brassL} stroke={FIB.ink} strokeWidth={6} />
          <rect x={-5} y={-48} width={10} height={44} fill={FIB.land} stroke={FIB.ink} strokeWidth={3} />
          <ellipse cx={0} cy={-64} rx={9} ry={15} fill={FIB.brassL} stroke={FIB.verm} strokeWidth={3} />
        </g>
        <Pip x={pipX} y={820 + 30 * Math.sin(f / 22)} s={0.55} f={f} emotion="wry" look={0.7} rot={-8} seed={3} />
        <DeskNear f={f} seed={3} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the cul-de-sac (line 3) ----------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t10 = b(10), t11 = b(11), t12 = b(12);
  const rise = ease(f, t10, 30);
  const lap = clamp01((f - (t10 + 26)) / 72);
  const ang = lap * Math.PI * 2 + Math.PI / 2;
  const onRoad = f >= t10 + 26 && f < t10 + 100;
  const roll = easeIO(f, t11 - 6, 44);
  let px = 780, py = 1330;
  if (f >= t10 && f < t10 + 26) { px = lerp(780, 540 + 250, ease(f, t10 + 6, 20)); py = 1340; }
  if (onRoad) { px = 540 + 250 * Math.cos(ang); py = 1300 + 70 * Math.sin(ang); }
  if (f >= t10 + 100 && f < t11 - 6) { px = lerp(790, 700, ease(f, t10 + 100, 20)); py = 1330; }
  if (f >= t11 - 6) { px = lerp(700, 150, roll); py = 1330; }
  const bonk = bump(f, t11 + 36, 14);
  const flipK = ease(f, t12, 12);
  const cam = track([{t: 0, z: 1.15, fx: 560, fy: 1050}, {t: p.dur, z: 1.0, fx: 540, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text={'"A DIGITAL CUL-DE-SAC" · AIDEA'} y={520} size={34} tone="paper" p={ease(f, t10 + 14, 8) * (1 - ease(f, t10 + 100, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['NO CABLE FROM ALASKA', 'REACHES ASIA DIRECTLY', 'PER AIDEA']} text="NO CABLE FROM ALASKA REACHES ASIA DIRECTLY PER AIDEA" y={700} size={32} tone="verm" p={ease(f, t11 + 6, 8) * (1 - ease(f, t12 + 20, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="HOLD THAT THOUGHT" y={860} size={34} tone="gold" p={ease(f, t12, 8)} />
      </>}>
      <SVG>
        <ChartBG f={f + p.from} id="s4" />
        <g data-band="ok">
          <ellipse cx={540} cy={1330} rx={330} ry={96} fill="#5B6376" stroke={FIB.ink} strokeWidth={8} />
          <ellipse cx={540} cy={1330} rx={150} ry={36} fill={FIB.paper} stroke={FIB.ink} strokeWidth={6} />
          <rect data-band="ok" x={640} y={1288} width={540} height={92} fill="#5B6376" stroke={FIB.ink} strokeWidth={7} />
          <path d="M650,1334 L1100,1334" stroke={FIB.paper2} strokeWidth={5} strokeDasharray="30 22" />
        </g>
        <Sign x={300} y={1220} text="A DIGITAL CUL-DE-SAC" sub="AIDEA" f={f} rise={rise} s={0.9} w={560} />
        <g opacity={ease(f, t11 + 6, 14)}>
          <rect x={64} y={880} width={26} height={430} rx={6} fill="#fff" opacity={0.25 + 0.2 * bonk} stroke={FIB.sea} strokeWidth={4} />
        </g>
        <Pip x={px} y={py} s={0.8} f={f} emotion={f >= t11 ? 'puzzled' : 'curious'} look={f >= t11 - 6 ? -0.8 : 0.5} squash={bonk} rot={f >= t11 - 6 ? -10 : 8 * Math.sin(lap * 6)} />
        <PipBand x={px} y={py + 100} text="VIA LOWER 48" s={0.8} p={flipK} />
        <DeskNear f={f} seed={4} />
      </SVG>
    </Frame>
  );
};

// ---- S5: the vote (line 4) -----------------------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t13 = b(13), t14 = b(14), t15 = b(15);
  const swing = f < t13 - 18 ? -50 : f < t13 ? lerp(-50, 8, easeIO(f, t13 - 18, 18)) : lerp(8, 0, ease(f, t13, 14));
  const hit = bump(f, t13, 12);
  const pen = ease(f, t14, 80);
  const ring = clamp01((f - t13) / 40);
  const cam = track([{t: 0, z: 1.3, fx: 420, fy: 1200}, {t: p.dur, z: 1.05, fx: 540, fy: 1130}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['OCT 21ST · AIDEA BOARD', 'RESOLUTION G26-11']} text="OCT 21ST · AIDEA BOARD RESOLUTION G26-11" y={540} size={32} tone="paper" p={ease(f, t13 + 6, 8) * (1 - ease(f, t14 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="NORTHSTAR FIBER DEVELOPMENT LLC" y={640} size={30} tone="gold" p={ease(f, t14 + 8, 8) * (1 - ease(f, t15 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="OWNED BY AIDEA" y={740} size={34} tone="paper" p={ease(f, t15, 8)} />
      </>}>
      <SVG>
        <ChartBG f={f + p.from} id="s5" />
        <g data-band="ok"><rect x={0} y={840} width={1080} height={620} fill={FIB.sea} opacity={0.2} /></g>
        <AlaskaShape x={60} y={820} s={0.5} />
        <PencilLine draw={pen} f={f} tip />
        <g opacity={ease(f, t14 + 30, 14)} transform="translate(470 1190) rotate(24)">
          <Lab text="NORTHSTAR FIBER DEVELOPMENT LLC" x={0} y={-40} size={20} tone="paper" p={1} />
        </g>
        <g opacity={ease(f, t15, 10)} transform="translate(470 1190) rotate(24)">
          <path d="M-190,-76 L-190,-84 L190,-84 L190,-76 M-190,-4 L-190,4 L190,4 L190,-4" fill="none" stroke={FIB.ink} strokeWidth={6} strokeLinecap="round" />
        </g>
        <g transform="translate(250 1250)">
          <ellipse cx={0} cy={50} rx={150} ry={18} fill="#000" opacity={0.25} />
          <circle cx={0} cy={20} r={ring * 120} fill="none" stroke={FIB.brassD} strokeWidth={4} opacity={(1 - ring) * 0.6} />
          <rect x={-120} y={-10} width={240} height={52} rx={8} fill={FIB.wood} stroke={FIB.ink} strokeWidth={7} transform={`translate(0 ${hit * 3})`} />
          <g transform={`translate(0 -34) rotate(${swing} 70 60)`}>
            <rect x={-70} y={-48} width={150} height={64} rx={10} fill={FIB.woodD} stroke={FIB.ink} strokeWidth={7} />
            <rect x={-12} y={14} width={150} height={20} rx={8} fill={FIB.wood} stroke={FIB.ink} strokeWidth={6} />
          </g>
        </g>
        <Pip x={lerp(880, 700, pen)} y={lerp(1330, 1300, pen)} s={0.65} f={f} emotion="reading" look={-0.6} seed={5} />
        <DeskNear f={f} seed={5} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the ceiling (line 5) --------------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t16 = b(16), t17 = b(17), t18 = b(18);
  const rise = ease(f, t16, 34);
  const climb = easeIO(f, t16 + 20, Math.max(30, t17 - t16 - 10));
  const bonkK = bump(f, t17 - 2, 16);
  const pipY = lerp(1330, 800, climb) - 18 * bonkK;
  const pipX = lerp(190, 560, climb);
  const cam = track([{t: 0, z: 1.1, fx: 540, fy: 1100}, {t: t17 - 4, z: 1.9, fx: 480, fy: 860}, {t: t17 + 70, z: 1.0, fx: 540, fy: 1040}, {t: p.dur, z: 1.04, fx: 540, fy: 1030}]);
  const chrono = ease(f, t18 - 6, 22);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="UP TO $75 MILLION" y={520} size={36} tone="gold" p={ease(f, t16 + 10, 8) * (1 - ease(f, t17, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="A CEILING · NOT A CHECK" y={600} size={34} tone="paper" p={ease(f, t17 + 14, 8) * (1 - ease(f, t18 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="ONE DATE" y={690} size={34} tone="verm" p={ease(f, t18, 8)} />
      </>}>
      <SVG>
        <ChartBG f={f + p.from} id="s6" />
        <SeaWindow f={f} x={40} y={600} w={740} h={840} id="s6" />
        <Gauge x={400} y={1420} s={0.92} f={f} rise={rise} mark={ease(f, t17, 10)} />
        <rect x={64} y={1396} width={692} height={5} fill="#fff" opacity={0.5} data-band="ok" />
        <Pip x={pipX} y={pipY} s={0.62} f={f} emotion="wry" look={0.3} seed={6} squash={bonkK * 0.6} />
        {f > t17 && <PipBand x={pipX + 150} y={pipY + 20} text="UP TO $75M" s={0.8} p={ease(f, t17, 10)} />}
        <g opacity={chrono} transform={`translate(0 ${(1 - chrono) * -120})`}>
          <Chronometer x={915} y={980} s={0.48} f={f} lid={0} />
        </g>
        <DeskNear f={f} seed={6} />
      </SVG>
    </Frame>
  );
};

// ---- S7: what the list says (line 6) ------------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t19 = b(19), t39 = b(39), t20 = b(20), t21 = b(21);
  const unroll = ease(f, t19, 36);
  const swoop = easeIO(f, t20 - 40, 40);
  const pin = bump(f, t20, 14);
  const erase = ease(f, t21 + 30, 40);
  const cam = track([{t: 0, z: 1.1, fx: 540, fy: 1020}, {t: p.dur, z: 1.02, fx: 540, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="PACIFIC COAST FIRST" y={520} size={34} tone="paper" p={ease(f, t39, 8) * (1 - ease(f, t20 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="MUST LAND IN ALASKA" y={600} size={34} tone="verm" p={ease(f, t20, 8) * (1 - ease(f, t21 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="NO PROJECT · NO PARTNER · NO ROUTE" y={680} size={32} tone="paper" p={ease(f, t21, 8)} />
      </>}>
      <SVG>
        <ChartBG f={f + p.from} id="s7" />
        <g transform="translate(540 1000)">
          <rect x={-330} y={-220} width={660} height={440 * unroll} rx={10} fill={FIB.paper2} stroke={FIB.ink} strokeWidth={7} />
          {unroll > 0.85 && (
            <g>
              <Lab text="1  ALASKA TO THE PACIFIC COAST" x={0} y={-150} size={26} tone={f > t39 ? 'gold' : 'paper'} p={1} />
              <rect x={-290} y={-70} width={380} height={16} rx={6} fill={FIB.pencil} opacity={0.35} />
              <rect x={-290} y={-40} width={260} height={16} rx={6} fill={FIB.pencil} opacity={0.25} />
              <rect x={-290} y={30} width={460} height={16} rx={6} fill={FIB.pencil} opacity={0.35} />
              <rect x={-290} y={60} width={300} height={16} rx={6} fill={FIB.pencil} opacity={0.25} />
              <Pencil x={160 + 10 * Math.sin(f / 7)} y={-110 + (f > t39 ? 0 : -30)} rot={-20} s={0.7} />
            </g>
          )}
        </g>
        <g transform={`translate(0 ${(1 - swoop) * -120})`} opacity={ease(f, t20 - 40, 10) * (1 - erase)}>
          <CableRun id="s7c" d="M -40,1330 C 260,1290 520,1380 800,1300 S 1000,1340 1120,1300" f={f} w={16} />
        </g>
        <g opacity={ease(f, t20 - 6, 10) * (1 - erase)} transform={`translate(840 ${1260 + pin * 6})`}>
          <rect x={-70} y={-70} width={140} height={78} rx={6} fill={FIB.verm} stroke={FIB.ink} strokeWidth={6} />
          <rect x={-18} y={8} width={36} height={66} rx={5} fill={FIB.wood} stroke={FIB.ink} strokeWidth={6} />
        </g>
        {[0, 1, 2].map((i) => {
          const sl = ease(f, t21 + i * 8, 20);
          return <g key={i} transform={`translate(${lerp(i % 2 ? 1300 : -300, 220 + i * 320, sl)} ${1260 + (i % 2) * 22})`} opacity={clamp01(sl * 2)}>
            <rect x={-130} y={-50} width={260} height={100} rx={8} fill={FIB.paper2} stroke={FIB.pencil} strokeWidth={5} strokeDasharray="12 8" />
            <text x={0} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={FIB.pencil}>{['NO PROJECT', 'NO PARTNER', 'NO ROUTE'][i]}</text>
          </g>;
        })}
        <Chronometer x={930} y={620} s={0.36} f={f} lid={0} />
        <Pip x={lerp(900, 640, erase)} y={lerp(1120, 1290, erase)} s={0.55} f={f} emotion={erase > 0.6 ? 'puzzled' : 'reading'} look={-0.7} seed={7} />
        <DeskNear f={f} seed={7} />
      </SVG>
    </Frame>
  );
};

// ---- S8: the case against our own spin (line 7), on the chart desk ------------------------------------------------------------------------------
const WordTag: React.FC<{text: string; x: number; y: number; rot?: number; s?: number; ghost?: boolean}> = ({text, x, y, rot = 0, s = 1, ghost = false}) => {
  const w = monoW(text, 22) + 26;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2} y={-22} width={w} height={44} rx={5} fill={ghost ? 'none' : FIB.paper2} stroke={ghost ? FIB.pencil : FIB.ink} strokeWidth={4} strokeDasharray={ghost ? '10 7' : undefined} />
      <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={ghost ? FIB.pencil : FIB.ink}>{text}</text>
    </g>
  );
};
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t22 = b(22), t23 = b(23), t40 = b(40), t41 = b(41), t24 = b(24);
  const docIn = ease(f, t22, 30);
  const sweep = clamp01((f - t23) / Math.max(30, t40 - t23));
  const mx = f < t40 ? lerp(230, 560, sweep) : 560;
  const my = f < t40 ? 1020 + 40 * Math.sin(sweep * 9) : 1040;
  const ringK = ease(f, t40, 14);
  const fall = (i: number) => clamp01((f - t41 - i * 6) / 34);
  const chip = ease(f, t24, 20);
  const cam = track([{t: 0, z: 1.15, fx: 540, fy: 1060}, {t: p.dur, z: 1.04, fx: 560, fy: 1060}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="THE CASE AGAINST OUR OWN SPIN" y={520} size={32} tone="gold" p={ease(f, t22 + 6, 8) * (1 - ease(f, t40, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="AI · ONLY INSIDE AIDEA" y={600} size={34} tone="paper" p={ease(f, t40 + 8, 8) * (1 - ease(f, t41, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['AI · DATA CENTER · COMPUTE', 'NOT IN EITHER DOCUMENT']} text="AI DATA CENTER COMPUTE NOT IN EITHER DOCUMENT" y={700} size={32} tone="verm" p={ease(f, t41 + 6, 8)} />
        {/* plate-overlap-ok */}<Plate x={540} text="ALASKA.AI'S FRAMING" y={830} size={34} tone="paper" p={ease(f, t24 + 6, 8)} />
      </>}>
      <SVG>
        <ChartBG f={f + p.from} id="s8" />
        <g data-band="ok"><ellipse cx={540} cy={1040} rx={520} ry={330} fill="#fff" opacity={0.12} /></g>
        <g transform={`translate(0 ${(1 - docIn) * -500})`} opacity={clamp01(docIn * 2)}>
          <Doc x={330} y={1060} s={1.45} title="RELEASE" lines={7} />
          <Doc x={760} y={1060} s={1.45} title="RESOLUTION" rot={3} lines={7} />
          <Lab text="AIDEA" x={330} y={1130} size={26} tone="paper" p={1} />
        </g>
        <g opacity={ringK}>
          <ellipse cx={316} cy={1130} rx={30} ry={26} fill="none" stroke={FIB.pencil} strokeWidth={5} transform="rotate(-6 316 1130)" />
        </g>
        {[0, 1, 2].map((i) => {
          const k = fall(i);
          return k > 0 && <g key={i} opacity={1 - k}><WordTag text={['AI', 'DATA CENTER', 'COMPUTE'][i]} x={420 + i * 150} y={900 + 520 * k * k} rot={-8 + i * 8} ghost /></g>;
        })}
        <g transform={`translate(${mx} ${my})`}><Magnifier x={0} y={0} s={1.1} rot={-28} /></g>
        <g opacity={chip} transform={`translate(${lerp(900, 316, chip)} ${lerp(800, 1180, chip)})`}>
          <Lab text="ALASKA.AI'S FRAMING" x={0} y={0} size={20} tone="gold" p={1} />
        </g>
        <Chronometer x={940} y={640} s={0.36} f={f} lid={0} />
        <Pip x={130} y={1250} s={0.6} f={f} emotion="wry" look={0.9} seed={8} rot={-6} />
        <DeskNear f={f} seed={8} />
      </SVG>
    </Frame>
  );
};

// ---- S9: borrowed numbers (line 8), on a top-down chart table -----------------------------------------------------------------------------------
const FlagTiny: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-2} y={-40} width={5} height={44} fill={FIB.ink} />
    <rect x={3} y={-40} width={26} height={18} fill={FIB.brassL} stroke={FIB.ink} strokeWidth={2.4} />
    <rect x={3} y={-40} width={13} height={9} fill={FIB.sea} />
  </g>
);
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t25 = b(25), t42 = b(42), t26 = b(26);
  const drop = ease(f, t25 - 6, 26);
  const laid = easeIO(f, t26 - 24, 40);
  const slid = ease(f, t26 + 56, 30);
  const bx = lerp(lerp(860, 440, laid), 1000, slid), by = lerp(lerp(560, 1010, laid), 1010, slid);
  const cam = track([{t: 0, z: 1.3, fx: 520, fy: 1060}, {t: p.dur, z: 1.08, fx: 520, fy: 1050}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="STUDIES CITED" y={520} size={34} tone="paper" p={ease(f, t25 + 6, 8) * (1 - ease(f, t26 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['NORDIC AND EUROPEAN', 'NOT ALASKA']} text="NORDIC AND EUROPEAN NOT ALASKA" y={640} size={34} tone="verm" p={ease(f, t26, 8)} />
      </>}>
      <SVG>
        <ChartBG f={f + p.from} id="s9" />
        <AlaskaShape x={90} y={780} s={0.78} dashed />
        <g transform={`translate(${bx} ${by - (1 - drop) * 360}) rotate(${lerp(-10, 3, laid) + 6 * bump(f, t26 + 30, 20)})`} opacity={clamp01(drop * 2)}>
          <rect x={-130} y={-170} width={260} height={340} rx={10} fill={FIB.sea} stroke={FIB.ink} strokeWidth={8} />
          <rect x={-130} y={-170} width={34} height={340} fill={FIB.deep} stroke={FIB.ink} strokeWidth={6} />
          <path d="M-70,-110 Q-30,-150 10,-100 Q50,-70 30,-20 Q60,20 20,60 Q-10,100 -50,70 Q-90,40 -60,0 Q-100,-40 -70,-110 Z" fill="none" stroke={FIB.cream} strokeWidth={6} />
          {f > t42 && [0, 1, 2].map((i) => <FlagTiny key={i} x={-60 + i * 70} y={-176 - 10 * ease(f, t42 + i * 5, 12)} />)}
        </g>
        <Pip x={lerp(900, 520, easeIO(f, t26 - 10, 40))} y={lerp(1250, 1300, easeIO(f, t26 - 10, 40))} s={0.6} f={f} emotion="wry" look={-0.7} seed={9} rot={-14 * bump(f, t26 + 40, 20)} />
        <DeskNear f={f} seed={9} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the scale, one weight per beat (line 9) ----------------------------------------------------------------------------------------------
const Stage: React.FC<{f: number; id: string}> = ({f, id}) => (
  <g>
    <ChartBG f={f} id={id} grid={false} />
    <g data-band="ok">
      <ellipse cx={540} cy={1380} rx={620} ry={120} fill={FIB.wood} stroke={FIB.ink} strokeWidth={8} />
      <ellipse cx={540} cy={1380} rx={560} ry={96} fill={FIB.woodD} opacity={0.4} />
      <path d="M200,1420 Q540,1470 880,1420" stroke={FIB.woodD} strokeWidth={4} fill="none" />
    </g>
    <path d="M540,0 L300,1300 L780,1300 Z" fill="#fff" opacity={0.07} data-band="ok" />
  </g>
);
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t27 = b(27), t43 = b(43), t47 = b(47), t28 = b(28);
  const roll = ease(f, t27 - 10, 30);
  const w1 = ease(f, t43, 22), w2 = ease(f, t47, 24), w3 = ease(f, t28, 22);
  const sink = ease(f, t27 + 18, 20);
  const tilt = -0.85 * sink + 0.4 * w1 + 0.45 * w2 + 0.1 * w3;
  const left = (
    <g transform={`translate(0 ${(1 - ease(f, t27 + 6, 14)) * -300})`}>
      <rect x={-52} y={-60} width={104} height={130} rx={7} fill={FIB.sea} stroke={FIB.ink} strokeWidth={5} />
      <rect x={-52} y={-60} width={16} height={130} fill={FIB.deep} stroke={FIB.ink} strokeWidth={4} />
      <FlagTiny x={20} y={-62} />
    </g>
  );
  const right = (
    <g>
      <g transform={`translate(-30 ${-40 - (1 - w1) * 240})`} opacity={clamp01(w1 * 2)}><WordTag text="UP TO $75M" x={0} y={0} s={0.8} /></g>
      {[0, 1, 2].map((i) => <g key={i} transform={`translate(${-96 + i * 62} ${-78 - 30 * i % 2 - (1 - w2) * 260})`} opacity={clamp01(w2 * 2)}><rect x={-20} y={-8} width={40} height={30} rx={5} fill={FIB.verm} stroke={FIB.ink} strokeWidth={4} /><path d="M-11,-8 Q-11,-30 0,-30 Q11,-30 11,-8" fill="none" stroke={FIB.ink} strokeWidth={5} /></g>)}
      <g transform={`translate(70 ${-80 - (1 - w2) * 220})`} opacity={clamp01(w2 * 2)}><rect x={-46} y={-20} width={92} height={36} rx={5} fill={FIB.cream} stroke={FIB.verm} strokeWidth={4} /><text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={14} fill={FIB.verm}>MUST LAND</text></g>
      <g transform={`translate(-10 ${-130 - (1 - w3) * 260})`} opacity={clamp01(w3 * 2)}><rect x={-46} y={-20} width={92} height={40} rx={5} fill={FIB.land} stroke={FIB.ink} strokeWidth={4} /><text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={FIB.ink}>1999</text></g>
    </g>
  );
  const cam = track([{t: 0, z: 1.12, fx: 540, fy: 1060}, {t: t43, z: 1.0, fx: 540, fy: 1040}, {t: p.dur, z: 1.0, fx: 540, fy: 1040}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['CONDITIONS ·', 'LANDING RULE']} text="CONDITIONS LANDING RULE" y={540} size={34} tone="gold" p={ease(f, t47 + 4, 8) * (1 - ease(f, t28 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="A DOCUMENTED NEED" y={680} size={34} tone="paper" p={ease(f, t28 + 4, 8)} />
      </>}>
      <SVG>
        <Stage f={f + p.from} id="s10" />
        <Chronometer x={920} y={700} s={0.36} f={f} lid={0} />
        <g transform={`translate(0 ${(1 - roll) * 500})`} opacity={clamp01(roll * 2)}>
          <ScalePans x={540} y={1330} s={0.92} tilt={tilt} f={f} left={left} right={right} labels={['THE DOUBTS', 'THE CASE FOR']} />
          <Pip x={540} y={880} s={0.66} f={f} emotion="determined" look={0} seed={10} rot={tilt * 11} />
          <PipBand x={540} y={982} text="WHICH WAY?" s={0.8} p={1} />
        </g>
        <DeskNear f={f} seed={10} />
      </SVG>
    </Frame>
  );
};

// ---- S11: Asia is third (line 10) ---------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t29 = b(29), t30 = b(30);
  const roll = easeIO(f, t29 + 10, 60);
  const bonk = bump(f, t29 + 72, 14);
  const asia = ease(f, t30 + 20, 30);
  const dots = ease(f, t30, 50);
  const cam = track([{t: 0, z: 1.9, fx: 540, fy: 1140}, {t: 80, z: 1.0, fx: 540, fy: 1040}, {t: p.dur, z: 1.1, fx: 380, fy: 1100}]);
  return (
    <Frame p={p} cam={cam} warmth={0.09}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="THE GLASS TO THE WEST" y={520} size={34} tone="paper" p={ease(f, t29 + 20, 8) * (1 - ease(f, t30 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['3 · ASIA ·', '"EXPLORE AND COLLABORATE"']} text='3 ASIA EXPLORE AND COLLABORATE' y={640} size={32} tone="gold" p={ease(f, t30 + 8, 8)} />
      </>}>
      <SVG>
        <Chart f={f + p.from} id="s11" wall={1} hot={bonk} asia={asia} dots={dots} pencil={1} />
        <Pip x={lerp(600, 190, roll)} y={1290} s={0.8} f={f} emotion="puzzled" look={-0.8} squash={bonk} rot={-8 * bonk} />
        <DeskNear f={f} seed={11} />
      </SVG>
    </Frame>
  );
};

// ---- S12: two locks and the chronometer (line 11) ----------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t31 = b(31), t32 = b(32), t33 = b(33);
  const lit = ease(f, t31, 16);
  const card = ease(f, t32 - 14, 20);
  const off = ease(f, t32 + 14, 24);
  const lid = ease(f, t33, 26);
  const cam = track([{t: 0, z: 2.3, fx: 610, fy: 1230}, {t: t33 - 6, z: 2.1, fx: 610, fy: 1210}, {t: t33 + 90, z: 1.0, fx: 540, fy: 1040}, {t: p.dur, z: 1.04, fx: 540, fy: 1030}]);
  return (
    <Frame p={p} cam={cam} warmth={0.1}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['FINANCE PLAN ·', 'BINDING CUSTOMER COMMITMENTS']} text="FINANCE PLAN BINDING CUSTOMER COMMITMENTS" y={540} size={30} tone="verm" p={ease(f, t31 + 6, 8) * (1 - ease(f, t32 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="BINDING · NOT JUST INTEREST" y={640} size={34} tone="paper" p={ease(f, t32, 8) * (1 - ease(f, t33 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} displayLines={['AUTHORITY ENDS DEC 31ST, 2028', 'UNLESS EXTENDED']} text="AUTHORITY ENDS DEC 31ST 2028 UNLESS EXTENDED" y={760} size={32} tone="verm" p={ease(f, t33 + 8, 8)} />
      </>}>
      <SVG>
        <Chart f={f + p.from} id="s12" wall={1} pencil={1} pulse />
        <Keyhole x={430} y={1280} s={0.62} lit={lit} label="FINANCE PLAN" f={f} />
        <Keyhole x={800} y={1280} s={0.62} lit={lit} label="BINDING CUSTOMERS" f={f} />
        <g transform={`translate(${lerp(1100, 800, card) + 90 * off} ${1200 + 60 * off}) rotate(${12 * off})`} opacity={clamp01(card * 2) * (1 - off * 0.2)}>
          <Postcard x={0} y={0} s={0.55} text="INTEREST" />
        </g>
        <Chronometer x={905} y={640} s={0.62} f={f} lid={lid} />
        <Pip x={610} y={1170} s={0.5} f={f} emotion="thoughtful" look={0} seed={12} />
        <PipBand x={610} y={1240} text="WHO SIGNS?" s={0.6} p={ease(f, t31, 12)} />
        <DeskNear f={f} seed={12} />
      </SVG>
    </Frame>
  );
};

// ---- S13: the button (line 12) ------------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t34 = b(34), t45 = b(45), t35 = b(35), t36 = b(36);
  const flag = springy(f, t34, 26);
  const out = easeIO(f, t35, 26);
  const dive = easeIO(f, t36 - 6, 26);
  const ride = clamp01((f - t36 - 20) / Math.max(40, p.dur - t36 - 24));
  const px = f < t36 - 6 ? lerp(250, 560, out) : lerp(560, 640, dive) + 220 * ride;
  const py = f < t36 - 6 ? lerp(1000, 1160, out) - 150 * Math.sin(out * Math.PI) : lerp(1160, 1296, dive) + 8 * Math.sin(ride * 14);
  const sea = ease(f, t36 - 30, 24);
  const cam = track([{t: 0, z: 1.15, fx: 540, fy: 1100}, {t: p.dur, z: 1.0, fx: 540, fy: 1060}]);
  return (
    <Frame p={p} cam={cam} warmth={0.1}
      overlay={<>
        {/* plate-overlap-ok */}<Plate x={540} text="A STARTING GUN · NOT A FINISH LINE" y={520} size={32} tone="gold" p={ease(f, t34 + 8, 8) * (1 - ease(f, t45 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="BINDING CUSTOMER COMMITMENT" y={600} size={34} tone="verm" p={ease(f, t45, 8) * (1 - ease(f, t35 - 4, 6))} />
        {/* plate-overlap-ok */}<Plate x={540} text="ALASKA'S TRAFFIC LEAVES ON THE SAME CABLES" y={680} size={32} tone="paper" p={ease(f, t35, 8)} />
      </>}>
      <SVG>
        <ChartBG f={f + p.from} id="s13" />
        <Phone x={250} y={1090} s={1.05} f={f} glow={1} />
        <g transform="translate(420 40)">
          <PencilLine draw={1} f={f} tip={false} />
        </g>
        <g transform={`translate(${(PENCIL_TIP[0] + 420)} ${PENCIL_TIP[1] + 40 - 70})`}>
          <rect x={-3} y={-10} width={7} height={90} fill={FIB.ink} />
          <path d={`M4,-10 L${70 + 10 * Math.sin(f / 5) * flag},${10} L4,${30} Z`} fill={FIB.brassL} stroke={FIB.ink} strokeWidth={4} opacity={flag} />
        </g>
        <g opacity={ease(f, t45 - 6, 10)} transform="translate(720 860)">
          <path d="M-210,0 L210,0" stroke={FIB.ink} strokeWidth={6} />
          <Lab text="BINDING CUSTOMER COMMITMENT" x={0} y={-44} size={20} tone="paper" p={1} />
          <Pencil x={60 + 8 * Math.sin(f / 6)} y={-18} rot={-26} s={0.8} />
        </g>
        {sea > 0.01 && (
          <g>
            <SeaWindow f={f} x={380} y={1150} w={640} h={190} k={sea} id="s13" />
            <CableRun id="s13a" d="M 400,1260 C 560,1230 760,1290 1000,1250" f={f} w={14} ghost={sea} />
            <g opacity={sea}><Hat x={560} y={1236} r={-6} /><Hat x={840} y={1264} r={7} /></g>
          </g>
        )}
        <Pip x={px} y={py} s={lerp(0.75, 0.5, dive)} f={f} emotion="curious" look={0.6} seed={13} rot={out < 1 ? 10 : 0} />
        <PipBand x={px} y={py + 102} text="?" s={0.7} p={1 - ease(f, t36, 8)} />
        <DeskNear f={f} seed={13} />
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const Rough: React.FC<{n: number; p: SP}> = ({n}) => (
  <AbsoluteFill style={{backgroundColor: FIB.paper, color: INK, fontFamily: MONO, fontSize: 60, padding: 80}}>SHOT {n}</AbsoluteFill>
);

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
  return Comp ? <Comp p={p} /> : <Rough n={n} p={p} />;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1031Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1031Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1031: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 7, 16, 26, 34, 42, 52, 64, 77, 85, 94, 101, 111, 120].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: FIB.paper}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#0B1636" ink="#FBF5E1" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
