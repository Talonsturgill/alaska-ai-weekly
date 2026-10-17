import React from 'react';
import {Easing, interpolate} from 'remotion';
import {ContactShadow, FormGradient, INK, tones, paleTones} from './lighting';

// THE GRID KIT, 2026-10-17 ("Ten Billion, How Many Megawatts"). Two quantities in unlike units drawn as two kinds of object:
// a tall thin glass gauge with a face (ReserveBar, the thing you read in a unit of height) against a squat heavy block of banknotes
// with a face (CashBlock, the thing you read in weight), a balance scale that refuses to tip between them, and the small cast that
// tells the week (funnel machine, pause button, chairs, calendar, switchbox, plant stacks, a postcard street, a plug, ledger slips).
// Everything is an SVG in the 1080 x 1920 frame at a caller-set x, y and scale, every animated value is passed in, and the only
// strings painted are the ones the caller hands in plus the block's band and the readout's unit.
export const GR = {
  sky: '#E9C9A5', skyHi: '#F6E3C9', skyDeep: '#4F7FA8', snow: '#FBF0E2', snowShade: '#9FB6CF', ice: '#DCEAF0', plaster: '#E9DCC8', plasterDeep: '#C9B89C', dusk: '#142B3D', duskHi: '#1F4259', grid: '#3E6A86',
  cyan: '#25C7E8', cyanDeep: '#0E8FB0', cyanHi: '#A8F0FF', glass: '#E9F6FA', steel: '#1F3A4A', steelHi: '#3C5E73', steelLite: '#7C9AAC',
  orange: '#FF7A1A', orangeDeep: '#B3490A', orangeHi: '#FFC38A', green: '#3E8E5A', greenDeep: '#215A38', greenHi: '#8FD3A4',
  navy: '#14283A', brass: '#C99A3C', brassHi: '#F0D28A', brassDeep: '#7D5E1C', cream: '#F4EEDC', creamShade: '#D9CFB3',
  wood: '#B58A5A', woodDeep: '#7A5632', brick: '#C4553C', brickDeep: '#8A3522', paper: '#FFFDF4',
};
export const MONO = "'JetBrains Mono', monospace";
export const SERIF = 'Fraunces, Georgia, serif';
export const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
export const eo = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const hash = (i: number) => {
  let x = (Math.floor(i) + 1017) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
export const rnd = (i: number) => (hash(i) % 10000) / 10000;

const Grad: React.FC<{id: string; base: string; pale?: boolean; softness?: number}> = ({id, base, pale, softness = 0.7}) => (
  <FormGradient id={id} t={pale ? paleTones(base) : tones(base)} softness={softness} />
);

// ---- the daylit room and the snow street -------------------------------------------------------------------------------
/** An interior with a pale wall, a wood floor and a window throwing a soft shaft. floor is the y where wall meets floor. */
export const DayRoom: React.FC<{f: number; floor?: number; window?: boolean; id?: string; wall?: string; rug?: boolean}> = ({f, floor = 1240, window = true, id = 'dr', wall = GR.plaster, rug = true}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GR.plasterDeep} /><stop offset="1" stopColor={wall} /></linearGradient>
      <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GR.wood} /><stop offset="1" stopColor={GR.woodDeep} /></linearGradient>
      <linearGradient id={`${id}-shaft`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={floor + 40} fill={`url(#${id}-wall)`} />
    <rect data-band="ok" x={-40} y={floor} width={1160} height={760} fill={`url(#${id}-floor)`} />
    <rect data-band="ok" x={-40} y={floor - 14} width={1160} height={30} fill={GR.snowShade} stroke={INK} strokeWidth={4} />
    {Array.from({length: 8}, (_, i) => <rect key={i} data-band="ok" x={-40} y={floor + 70 + i * 100} width={1160} height={4} fill={INK} opacity={0.14} />)}
    {rug && (
      <g data-band="ok">
        <rect x={-60} y={1520} width={1200} height={300} rx={14} fill={GR.brickDeep} stroke={INK} strokeWidth={8} />
        {Array.from({length: 7}, (_, i) => <rect key={i} x={-60} y={1540 + i * 40} width={1200} height={14} fill={i % 2 ? GR.orangeHi : GR.cream} opacity={0.75} />)}
        <path d={`M -40 1900 Q 300 ${1830 + 12 * Math.sin(f / 40)} 640 1890 T 1120 1860`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
        <path d={`M -40 1900 Q 300 ${1830 + 12 * Math.sin(f / 40)} 640 1890 T 1120 1860`} fill="none" stroke={GR.steelLite} strokeWidth={8} strokeLinecap="round" />
      </g>
    )}
    {window && (
      <g>
        <polygon data-band="ok" points="120,60 420,60 700,1200 160,1200" fill={`url(#${id}-shaft)`} opacity={0.5 + 0.08 * Math.sin(f / 40)} />
        <rect x={110} y={40} width={320} height={350} rx={10} fill={GR.skyHi} stroke={INK} strokeWidth={9} />
        <line x1={270} y1={40} x2={270} y2={390} stroke={INK} strokeWidth={7} />
        <line x1={110} y1={215} x2={430} y2={215} stroke={INK} strokeWidth={7} />
        <rect x={96} y={382} width={348} height={26} rx={6} fill={GR.snow} stroke={INK} strokeWidth={6} />
      </g>
    )}
    {Array.from({length: 14}, (_, i) => {
      const px = ((rnd(i + 3) * 1200 + f * (0.3 + rnd(i) * 0.7)) % 1200) - 60;
      return <circle key={i} cx={px} cy={180 + rnd(i + 11) * 900 + 10 * Math.sin(f / 33 + i)} r={1.3 + rnd(i + 5) * 2} fill="#FFFFFF" opacity={0.25 + 0.3 * rnd(i + 8)} />;
    })}
  </g>
);

/** A bright Interior winter noon: ice sky, a low pale ridge, plant steam far off, snow ground with shaded drifts, light snowfall. */
export const SnowDay: React.FC<{f: number; ground?: number; steam?: boolean; snowfall?: boolean; id?: string; seed?: number}> = ({f, ground = 1230, steam = true, snowfall = true, id = 'sd', seed = 0}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GR.skyDeep} /><stop offset="0.5" stopColor="#9DB4C8" /><stop offset="1" stopColor={GR.skyHi} /></linearGradient>
      <linearGradient id={`${id}-gr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GR.snow} /><stop offset="1" stopColor={GR.snowShade} /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={ground + 60} fill={`url(#${id}-sky)`} />
    <path data-band="ok" d={`M -40 ${ground - 140} L 120 ${ground - 230} L 300 ${ground - 160} L 520 ${ground - 270} L 760 ${ground - 170} L 960 ${ground - 250} L 1120 ${ground - 150} L 1120 ${ground} L -40 ${ground} Z`} fill="#8CA5C0" transform={`translate(${8 * Math.sin(f / 90)} 0)`} />
    <path data-band="ok" d={`M -40 ${ground - 70} L 200 ${ground - 120} L 460 ${ground - 60} L 700 ${ground - 110} L 1120 ${ground - 60} L 1120 ${ground} L -40 ${ground} Z`} fill="#B7C8DA" transform={`translate(${16 * Math.sin(f / 70 + 1)} 0)`} />
    <circle data-band="ok" cx={170} cy={ground - 330} r={86} fill="#FFE6B8" opacity={0.75} />
    <circle data-band="ok" cx={170} cy={ground - 330} r={150} fill="#FFD9A0" opacity={0.25} />
    {steam && Array.from({length: 3}, (_, k) => (
      <g key={k} opacity={0.55}>
        <rect data-band="ok" x={150 + k * 340} y={ground - 190} width={26} height={90} fill={GR.steelLite} stroke={INK} strokeWidth={3} />
        {Array.from({length: 5}, (_, i) => {
          const t = ((f / 90 + i / 5 + k * 0.3) % 1);
          return <ellipse key={i} cx={163 + k * 340 + 14 * Math.sin(f / 40 + i + k) + t * 40} cy={ground - 200 - t * 220} rx={22 + t * 40} ry={14 + t * 26} fill="#FFFFFF" opacity={0.5 * (1 - t)} />;
        })}
      </g>
    ))}
    <rect data-band="ok" x={-40} y={ground} width={1160} height={760} fill={`url(#${id}-gr)`} />
    {[0, 1, 2, 3].map((i) => <ellipse key={i} data-band="ok" cx={140 + i * 300 + (i % 2) * 60} cy={ground + 90 + i * 70} rx={240} ry={26} fill={GR.snowShade} opacity={0.5} />)}
    {[0, 1, 2].map((i) => {
      const a = rnd(i * 7 + seed * 13 + 3), b2 = rnd(i * 5 + seed * 11 + 9);
      const top = 1540 + a * 90, w = 380 + b2 * 200;
      return (
        <g key={i} data-band="ok" transform={`translate(${-60 + i * 400 + seed * 50 + 22 * Math.sin(f / 80 + i)} 0)`}>
          <path d={`M 0 1920 Q ${w * 0.1} ${top + 40} ${w * 0.5} ${top} Q ${w * 0.9} ${top + 30} ${w} 1920 Z`} fill={GR.snow} stroke={INK} strokeWidth={5} />
          <path d={`M ${w * 0.1} ${top + 140} Q ${w * 0.5} ${top + 80 + b2 * 40} ${w * 0.95} ${top + 170}`} fill="none" stroke={GR.snowShade} strokeWidth={16} strokeLinecap="round" opacity={0.85} />
          <path d={`M ${w * 0.2} ${top + 260} Q ${w * 0.55} ${top + 210} ${w} ${top + 300}`} fill="none" stroke={GR.snowShade} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
          {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={w * (0.25 + k * 0.17)} cy={top + 120 + (k % 2) * 26} rx={14} ry={6} fill={GR.snowShade} stroke={INK} strokeWidth={2} opacity={0.8} />)}
        </g>
      );
    })}
    {snowfall && Array.from({length: 26}, (_, i) => {
      const py = ((rnd(i + 21) * 1900 + f * (1.2 + rnd(i) * 1.8)) % 2000) - 40;
      return <circle key={i} cx={(rnd(i + 5) * 1200 + 18 * Math.sin(f / 30 + i) - 60)} cy={py} r={2 + rnd(i + 9) * 3} fill="#FFFFFF" opacity={0.5 + 0.4 * rnd(i + 2)} />;
    })}
  </g>
);

// ---- the hero: the ReserveBar ----------------------------------------------------------------------------------------------------
export type BarEmotion = 'calm' | 'puzzled' | 'uneasy' | 'worried' | 'sweating' | 'hopeful' | 'unsure' | 'resolved' | 'happy';
const TUBE_H = 520;
/**
 * The ReserveBar: a glass gauge on boots with a steel head that has a face. mw is the fluid level on a 0 to 60 megawatt scale.
 * The fluid is cyan and nothing else in a film is allowed to be. lines draws the LEVEL 1 (38) and LEVEL 2 (15) marks, the second
 * in hazard orange. walk (0..1) alternates the boots. Origin is the bottom centre of the boots.
 */
export const ReserveBar: React.FC<{
  x: number; y: number; f: number; scale?: number; mw?: number; emotion?: BarEmotion; look?: number; lines?: boolean; tickLabels?: boolean;
  sweat?: number; walk?: number; id?: string; shadow?: boolean; lamp?: number; spare?: number; used?: number;
}> = ({x, y, f, scale = 1, mw = 40, emotion = 'calm', look = 0, lines = true, tickLabels = false, sweat = 0, walk = 0, id = 'rb', shadow = true, lamp = 0, spare = 0, used = 0}) => {
  const blink = Math.sin(f / 37 + x * 0.013) > 0.965 ? 0.12 : 1;
  const wave = (a: number) => a * Math.sin(f / 9 + x * 0.02);
  const fy = -70 - (clamp01(mw / 60)) * TUBE_H;
  const bob = 4 * Math.sin(f / 21 + x * 0.01);
  const step = walk > 0 ? Math.sin(f / 4) : 0;
  const mouth = (() => {
    switch (emotion) {
      case 'hopeful': case 'happy': return 'M -30 28 Q 0 54 30 28';
      case 'resolved': return 'M -28 34 Q 0 42 28 34';
      case 'worried': return 'M -30 44 Q -15 30 0 42 Q 15 54 30 40';
      case 'sweating': return 'M -26 48 Q 0 28 26 48';
      case 'uneasy': return 'M -26 40 Q -8 34 8 42 Q 20 46 28 38';
      case 'unsure': return 'M -26 38 L 26 44';
      case 'puzzled': return 'M -22 40 Q 0 34 22 44';
      default: return 'M -26 34 Q 0 46 26 34';
    }
  })();
  const browTilt = emotion === 'worried' || emotion === 'sweating' || emotion === 'uneasy' ? 14 : emotion === 'hopeful' || emotion === 'happy' ? -8 : emotion === 'puzzled' ? 10 : 0;
  const pupilX = look * 11 + (emotion === 'unsure' ? 8 * Math.sin(f / 18) : 0);
  const pupilY = emotion === 'sweating' || emotion === 'worried' ? 5 : 0;
  const lidDrop = emotion === 'resolved' ? 0.2 : emotion === 'sweating' ? 0.1 : 0;
  return (
    <g transform={`translate(${x} ${y + bob * 0.4}) scale(${scale})`}>
      <defs>
        <Grad id={`${id}-steel`} base={GR.steelHi} />
        <Grad id={`${id}-boot`} base={GR.navy} />
        <clipPath id={`${id}-clip`}><rect x={-68} y={-70 - TUBE_H} width={136} height={TUBE_H} rx={18} /></clipPath>
        <linearGradient id={`${id}-fluid`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={GR.cyanHi} /><stop offset="0.35" stopColor={GR.cyan} /><stop offset="1" stopColor={GR.cyanDeep} /></linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" /><stop offset="0.5" stopColor={GR.glass} stopOpacity="0.55" /><stop offset="1" stopColor="#BFE3EE" stopOpacity="0.75" /></linearGradient>
      </defs>
      {shadow && <ContactShadow cx={0} cy={6} rx={150} ry={24} opacity={0.4} />}
      {/* boots */}
      {[-1, 1].map((s) => {
        const lift = walk > 0 ? Math.max(0, s * step) * 26 * walk : 0;
        return (
          <g key={s} transform={`translate(${s * 62} ${-lift})`}>
            <path d="M -52 0 L -52 -34 Q -52 -52 -30 -52 L 34 -52 Q 56 -52 56 -30 L 60 0 Z" fill={`url(#${id}-boot)`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
            <rect x={-54} y={-10} width={116} height={12} rx={4} fill={GR.steel} opacity={0.6} />
          </g>
        );
      })}
      {/* base collar */}
      <rect x={-96} y={-86} width={192} height={44} rx={14} fill={`url(#${id}-steel)`} stroke={INK} strokeWidth={7} />
      <rect x={-96} y={-86} width={192} height={10} rx={5} fill="#FFFFFF" opacity={0.25} />
      {/* tube body: dark inside, fluid, ticks, glass */}
      <rect x={-68} y={-70 - TUBE_H} width={136} height={TUBE_H} rx={18} fill="#0B1E2B" opacity={0.85} />
      <g clipPath={`url(#${id}-clip)`}>
        {used > 0 && <rect x={-68} y={-70 - TUBE_H * clamp01(used)} width={136} height={TUBE_H * clamp01(used)} fill={GR.steelHi} opacity={0.55} />}
        <path d={`M -80 ${fy + wave(5)} Q -40 ${fy - 9 + wave(5)} 0 ${fy + wave(-4)} Q 40 ${fy + 9 + wave(4)} 80 ${fy + wave(-5)} L 80 0 L -80 0 Z`} fill={`url(#${id}-fluid)`} />
        <path d={`M -80 ${fy + wave(5)} Q -40 ${fy - 9 + wave(5)} 0 ${fy + wave(-4)} Q 40 ${fy + 9 + wave(4)} 80 ${fy + wave(-5)}`} fill="none" stroke={GR.cyanHi} strokeWidth={5} />
        {Array.from({length: 7}, (_, i) => <circle key={i} cx={-40 + rnd(i + 2) * 80} cy={fy + 30 + ((f * (0.6 + rnd(i) * 0.8) + i * 70) % Math.max(40, -fy - 80))} r={3 + rnd(i + 4) * 4} fill="#FFFFFF" opacity={0.35} />)}
      </g>
      {Array.from({length: 13}, (_, i) => {
        const yy = -70 - (i / 12) * TUBE_H;
        return <line key={i} x1={i % 2 === 0 ? 38 : 50} y1={yy} x2={68} y2={yy} stroke={INK} strokeWidth={i % 2 === 0 ? 4 : 3} opacity={0.75} />;
      })}
      {lines && (
        <g>
          <line x1={-98} y1={-70 - (38 / 60) * TUBE_H} x2={98} y2={-70 - (38 / 60) * TUBE_H} stroke={GR.brassHi} strokeWidth={6} strokeDasharray="14 8" />
          <line x1={-98} y1={-70 - (15 / 60) * TUBE_H} x2={98} y2={-70 - (15 / 60) * TUBE_H} stroke={GR.orange} strokeWidth={8} strokeDasharray="14 8" />
          {tickLabels && <>
            <text x={106} y={-70 - (38 / 60) * TUBE_H + 8} fontFamily={MONO} fontWeight={800} fontSize={24} fill={GR.cream}>LEVEL 1</text>
            <text x={106} y={-70 - (15 / 60) * TUBE_H + 8} fontFamily={MONO} fontWeight={800} fontSize={24} fill={GR.orangeHi}>LEVEL 2</text>
          </>}
        </g>
      )}
      {spare > 0 && (
        <g opacity={spare}>
          <path d={`M -112 ${fy - 6} L -112 ${-70 - TUBE_H + 4}`} stroke={INK} strokeWidth={5} strokeDasharray="4 8" />
          <path d={`M -112 ${fy - 6} l 14 0 M -112 ${-70 - TUBE_H + 4} l 14 0`} stroke={INK} strokeWidth={6} />
        </g>
      )}
      <rect x={-68} y={-70 - TUBE_H} width={136} height={TUBE_H} rx={18} fill={`url(#${id}-glass)`} stroke={INK} strokeWidth={9} />
      <rect x={-52} y={-70 - TUBE_H + 20} width={14} height={TUBE_H - 50} rx={7} fill="#FFFFFF" opacity={0.6} />
      {/* head */}
      <g transform={`translate(0 ${-TUBE_H - 100})`}>
        <rect x={-104} y={-84} width={208} height={150} rx={46} fill={`url(#${id}-steel)`} stroke={INK} strokeWidth={8} />
        <path d="M -90 -50 Q 0 -96 90 -50" fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.35} strokeLinecap="round" />
        <rect x={-18} y={-110} width={36} height={32} rx={8} fill={GR.steel} stroke={INK} strokeWidth={6} />
        <circle cx={0} cy={-120} r={14} fill={lamp > 0 ? GR.orange : GR.steelLite} stroke={INK} strokeWidth={5} opacity={lamp > 0 ? 0.6 + 0.4 * Math.sin(f / 4) : 1} />
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * 46} -20)`}>
            <ellipse cx={0} cy={0} rx={30} ry={34 * blink} fill="#F7FBFD" stroke={INK} strokeWidth={5.5} />
            {blink > 0.5 && <>
              <circle cx={pupilX} cy={pupilY} r={13} fill={INK} />
              <circle cx={pupilX + 4} cy={pupilY - 5} r={4} fill="#FFFFFF" />
              {lidDrop > 0 && <path d={`M -30 ${-34 + lidDrop * 70} L 30 ${-34 + lidDrop * 70} L 30 -40 L -30 -40 Z`} fill={GR.steelHi} />}
            </>}
            <path d={`M ${-26} ${-46 + s * browTilt * 0.5 * -1} L ${26} ${-46 + s * browTilt * 0.5}`} stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${s * browTilt * -0.6} 0 -46)`} />
          </g>
        ))}
        <path d={mouth} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" transform="translate(0 18)" />
        {sweat > 0 && Array.from({length: 2}, (_, i) => {
          const t = clamp01(((f / 36 + i * 0.5) % 1));
          return <path key={i} d={`M ${i === 0 ? 96 : -100} ${-40 + t * 110} q 8 14 0 22 q -8 -8 0 -22 Z`} fill="#E9F6FA" stroke={INK} strokeWidth={3} opacity={sweat * (1 - t * 0.5)} />;
        })}
      </g>
    </g>
  );
};

// ---- the CashBlock -------------------------------------------------------------------------------------------------------------------
export type BlockEmotion = 'smug' | 'eager' | 'shrug' | 'puffed';
/** A squat brick of banknotes bound with a paper band, a face and stubby arms. knock (0..1) swings the right arm; squash (0..1) flattens it. */
export const CashBlock: React.FC<{x: number; y: number; f: number; scale?: number; emotion?: BlockEmotion; knock?: number; squash?: number; puff?: number; band?: string; id?: string; shadow?: boolean; tag?: number}> =
({x, y, f, scale = 1, emotion = 'smug', knock = 0, squash = 0, puff = 0, band = '10 BILLION', id = 'cb', shadow = true, tag = 0}) => {
  const sq = 1 + 0.18 * squash, sh = 1 - 0.2 * squash;
  const pf = 1 + 0.08 * puff;
  const breathe = 1 + 0.012 * Math.sin(f / 15 + x * 0.01);
  const armA = lerp(-20, -105, knock) + (knock > 0 ? 14 * Math.sin(f * 1.4) * Math.min(knock, 1 - knock) * 2 : 0);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * sq * pf * breathe} ${scale * sh * pf * breathe})`}>
      <defs>
        <Grad id={`${id}-g`} base={GR.green} />
        <Grad id={`${id}-top`} base={GR.greenHi} />
      </defs>
      {shadow && <ContactShadow cx={0} cy={4} rx={230} ry={26} opacity={0.4} />}
      {/* legs */}
      {[-1, 1].map((s) => <rect key={s} x={s * 90 - 34} y={-30} width={68} height={32} rx={10} fill={GR.greenDeep} stroke={INK} strokeWidth={6} />)}
      {/* body: a stack of notes */}
      <rect x={-210} y={-250} width={420} height={230} rx={22} fill={`url(#${id}-g)`} stroke={INK} strokeWidth={9} />
      <path d="M -196 -250 L -170 -290 L 196 -290 L 210 -250 Z" fill={`url(#${id}-top)`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {Array.from({length: 9}, (_, i) => <line key={i} x1={-206} y1={-40 - i * 22} x2={206} y2={-40 - i * 22} stroke={GR.greenDeep} strokeWidth={2.5} opacity={0.45} />)}
      <path d="M -200 -246 L 200 -246" stroke="#FFFFFF" strokeWidth={5} opacity={0.3} />
      {/* paper band with the figure */}
      <rect x={-210} y={-170} width={420} height={70} fill={GR.cream} stroke={INK} strokeWidth={6} />
      <rect x={-210} y={-170} width={420} height={12} fill="#FFFFFF" opacity={0.35} />
      <text x={0} y={-118} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={38} letterSpacing={3} fill={GR.navy}>{band}</text>
      {/* face above the band */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * 70} -214)`}>
          <ellipse cx={0} cy={0} rx={24} ry={emotion === 'smug' ? 13 : 24} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
          <circle cx={emotion === 'shrug' ? 0 : s * 3 + 6} cy={emotion === 'smug' ? 3 : 0} r={9} fill={INK} />
          {emotion === 'smug' && <path d="M -26 -8 L 26 -8" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
        </g>
      ))}
      <path d={emotion === 'smug' ? 'M -44 -178 Q 0 -150 52 -184' : emotion === 'shrug' ? 'M -30 -176 L 30 -176' : 'M -40 -184 Q 0 -150 40 -184'} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" transform="translate(0 -4)" />
      {emotion === 'smug' && <path d="M 52 -188 l 12 -8" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
      {/* arms */}
      <g transform="translate(-210 -130)"><path d="M 0 0 q -34 10 -36 44" fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" /><path d="M 0 0 q -34 10 -36 44" fill="none" stroke={GR.green} strokeWidth={14} strokeLinecap="round" /><circle cx={-36} cy={46} r={17} fill={GR.cream} stroke={INK} strokeWidth={5} /></g>
      <g transform={`translate(210 -130) rotate(${armA})`}><path d="M 0 0 q 38 6 56 36" fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" /><path d="M 0 0 q 38 6 56 36" fill="none" stroke={GR.green} strokeWidth={14} strokeLinecap="round" /><circle cx={58} cy={38} r={18} fill={GR.cream} stroke={INK} strokeWidth={5} /></g>
      {tag > 0 && (
        <g transform={`translate(214 -120) rotate(${8 * Math.sin(f / 8)} 0 0)`} opacity={clamp01(tag * 3)}>
          <line x1={0} y1={0} x2={0} y2={36} stroke={INK} strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

// ---- the readout and the balance scale ---------------------------------------------------------------------------------------------------
/** A small panel with a blank megawatt readout. blank 0..1 how empty it is, q (0..1) shows a question mark, alarm tints it hazard orange. */
export const MWReadout: React.FC<{x: number; y: number; f: number; scale?: number; q?: number; alarm?: number; id?: string; unit?: string}> = ({x, y, f, scale = 1, q = 0, alarm = 0, id = 'mw', unit = 'MW'}) => {
  const cur = Math.sin(f / 7) > 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><Grad id={`${id}-b`} base={GR.steelHi} /></defs>
      <ContactShadow cx={0} cy={4} rx={130} ry={14} opacity={0.35} />
      <rect x={-130} y={-150} width={260} height={150} rx={18} fill={`url(#${id}-b)`} stroke={INK} strokeWidth={8} />
      <rect x={-108} y={-130} width={216} height={86} rx={10} fill={alarm > 0 ? lerpHex('#0B1E2B', GR.orangeDeep, alarm) : '#0B1E2B'} stroke={INK} strokeWidth={5} />
      <text x={-82} y={-70} fontFamily={MONO} fontWeight={900} fontSize={50} fill={alarm > 0.5 ? GR.orangeHi : GR.cream} letterSpacing={6}>{q > 0.5 ? '?' : '--'}</text>
      {q <= 0.5 && cur && <rect x={26} y={-66} width={34} height={8} fill={GR.cream} />}
      <text x={96} y={-56} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={28} fill={GR.steelLite}>{unit}</text>
      {[-70, -20, 30, 80].map((cx, i) => <circle key={i} cx={cx} cy={-18} r={9} fill={i === 3 && alarm > 0.5 ? GR.orange : GR.steelLite} stroke={INK} strokeWidth={4} />)}
    </g>
  );
};
const hexToRgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const lerpHex = (a: string, b: string, t: number) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  const c = (i: number) => Math.round(lerp(A[i], B[i], clamp01(t))).toString(16).padStart(2, '0');
  return `#${c(0)}${c(1)}${c(2)}`;
};

/**
 * A brass balance scale. tilt is the beam angle in degrees (positive drops the LEFT pan). left/right are drawn standing on their pans
 * (origin at the pan's top centre). The beam shivers when shiver > 0 so a scale that refuses to tip is visibly trying.
 */
export const BalanceScale: React.FC<{x: number; y: number; f: number; scale?: number; tilt?: number; shiver?: number; left?: React.ReactNode; right?: React.ReactNode; id?: string; half?: number}> =
({x, y, f, scale = 1, tilt = 0, shiver = 0, left, right, id = 'bs', half = 340}) => {
  const ang = tilt + shiver * 1.1 * Math.sin(f / 2.2);
  const r = (ang * Math.PI) / 180;
  const lx = -Math.cos(r) * half, ly = -520 + Math.sin(r) * half; // beam ends relative to post base
  const rx = Math.cos(r) * half, ry = -520 - Math.sin(r) * half;
  const hang = 250;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><Grad id={`${id}-br`} base={GR.brass} /></defs>
      <ContactShadow cx={0} cy={6} rx={330} ry={30} opacity={0.4} />
      {/* post and foot */}
      <path d="M -180 0 L -150 -46 L 150 -46 L 180 0 Z" fill={`url(#${id}-br)`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <rect x={-22} y={-540} width={44} height={500} rx={12} fill={`url(#${id}-br)`} stroke={INK} strokeWidth={8} />
      {/* hangers and pans */}
      {[{ex: lx, ey: ly, c: left, s: -1}, {ex: rx, ey: ry, c: right, s: 1}].map((e, i) => (
        <g key={i}>
          <line x1={e.ex} y1={e.ey} x2={e.ex - 120} y2={e.ey + hang} stroke={INK} strokeWidth={7} />
          <line x1={e.ex} y1={e.ey} x2={e.ex + 120} y2={e.ey + hang} stroke={INK} strokeWidth={7} />
          <g transform={`translate(${e.ex} ${e.ey + hang})`}>
            <ContactShadow cx={0} cy={36} rx={150} ry={10} opacity={0.2} />
            <path d="M -150 0 Q 0 60 150 0 Z" fill={`url(#${id}-br)`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
            <ellipse cx={0} cy={0} rx={150} ry={12} fill={GR.brassHi} stroke={INK} strokeWidth={6} />
            <g>{e.c}</g>
          </g>
          <circle cx={e.ex} cy={e.ey} r={13} fill={GR.brassHi} stroke={INK} strokeWidth={6} />
        </g>
      ))}
      {/* beam */}
      <g>
        <path d={`M ${lx} ${ly} L ${rx} ${ry}`} stroke={INK} strokeWidth={34} strokeLinecap="round" />
        <path d={`M ${lx} ${ly} L ${rx} ${ry}`} stroke={GR.brass} strokeWidth={22} strokeLinecap="round" />
        <path d={`M ${lx} ${ly - 6} L ${rx} ${ry - 6}`} stroke={GR.brassHi} strokeWidth={6} strokeLinecap="round" opacity={0.8} />
      </g>
      <circle cx={0} cy={-520} r={30} fill={GR.brassHi} stroke={INK} strokeWidth={8} />
      <circle cx={0} cy={-520} r={10} fill={GR.brassDeep} />
      {/* pointer */}
      <line x1={0} y1={-520} x2={Math.sin(-r) * 120} y2={-520 + Math.cos(r) * 120} stroke={GR.orange} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
};
/** Where a pan sits for a given tilt, in the scale's own coordinates (post base origin), so a caller can stand things on it. */
export const panPoint = (side: 'left' | 'right', tilt = 0, half = 340) => {
  const r = (tilt * Math.PI) / 180;
  return side === 'left' ? {x: -Math.cos(r) * half, y: -520 + Math.sin(r) * half + 250} : {x: Math.cos(r) * half, y: -520 - Math.sin(r) * half + 250};
};

// ---- the funnel machine -------------------------------------------------------------------------------------------------------------------
/**
 * The machine for "you convert electricity into intelligence": a brass funnel over a gearbox with a spout. bolt (0..1) is a lightning
 * bolt dropping into the mouth, brain (0..1) pops out of the spout, coins (0..1) spill after it, plug (0..1) is the power plug that
 * replaces the bolt in the closing read, tag is a small tag hung on the rim.
 */
export const FunnelMachine: React.FC<{x: number; y: number; f: number; scale?: number; bolt?: number; brain?: number; coins?: number; plug?: number; tag?: string; spin?: number; id?: string; kick?: number}> =
({x, y, f, scale = 1, bolt = 0, brain = 0, coins = 0, plug = 0, tag = '', spin = 1, id = 'fm', kick = 0}) => {
  const gear = (cx: number, cy: number, r: number, dir: number) => (
    <g transform={`translate(${cx} ${cy}) rotate(${dir * f * 3.2 * spin * (1 + 2.5 * kick)})`}>
      {Array.from({length: 10}, (_, i) => <rect key={i} x={-5} y={-r - 8} width={10} height={16} fill={GR.brassDeep} stroke={INK} strokeWidth={3} transform={`rotate(${i * 36})`} />)}
      <circle cx={0} cy={0} r={r} fill={GR.brass} stroke={INK} strokeWidth={6} />
      <circle cx={0} cy={0} r={r * 0.35} fill={GR.brassDeep} stroke={INK} strokeWidth={4} />
    </g>
  );
  const boltY = lerp(-720, -330, bolt);
  const plugY = lerp(-760, -380, plug);
  const brainK = clamp01(brain);
  return (
    <g transform={`translate(${x + kick * 10 * Math.sin(f * 2.3)} ${y - kick * 18 * Math.abs(Math.cos(f * 0.9))}) scale(${scale * (1 + 0.04 * kick)} ${scale * (1 - 0.05 * kick)})`}>
      <defs><Grad id={`${id}-br`} base={GR.brass} /><Grad id={`${id}-st`} base={GR.steelHi} /></defs>
      <ContactShadow cx={0} cy={6} rx={300} ry={26} opacity={0.4} />
      {kick > 0 && Array.from({length: 9}, (_, i) => { const a = (i / 9) * Math.PI * 2, r = (1 - kick) * 170 + 40; return <circle key={i} cx={Math.cos(a) * r} cy={-430 + Math.sin(a) * r * 0.6} r={7 * kick + 2} fill="#FFE45A" stroke={INK} strokeWidth={2} opacity={kick} />; })}
      <rect x={-230} y={-250} width={460} height={250} rx={24} fill={`url(#${id}-st)`} stroke={INK} strokeWidth={9} />
      {[-120, 0, 120].map((rx, i) => <circle key={i} cx={rx} cy={-30} r={9} fill={GR.steelLite} stroke={INK} strokeWidth={4} />)}
      {gear(-110, -140, 52, 1)}{gear(10, -118, 36, -1)}{gear(110, -150, 44, 1)}
      <path d="M -250 -250 L 250 -250 L 130 -420 L -130 -420 Z" fill={`url(#${id}-br)`} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d="M -120 -420 Q 0 -460 120 -420 L 150 -470 Q 0 -520 -150 -470 Z" fill={GR.brassHi} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M -200 -262 L -110 -410" stroke="#FFFFFF" strokeWidth={8} opacity={0.35} strokeLinecap="round" />
      {/* spout */}
      <rect x={230} y={-200} width={150} height={52} rx={16} fill={`url(#${id}-br)`} stroke={INK} strokeWidth={8} />
      <path d="M 380 -208 q 30 0 30 30 l 0 70" fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      {/* the bolt */}
      {bolt > 0 && plug <= 0 && (
        <g transform={`translate(0 ${boltY})`} opacity={clamp01(1 - (bolt - 0.85) * 6)}>
          <path transform="scale(1.6)" d="M 10 -80 L -50 20 L -6 20 L -30 110 L 56 -16 L 8 -16 Z" fill="#FFE45A" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          {Array.from({length: 6}, (_, i) => <circle key={i} cx={-70 + i * 30 + 8 * Math.sin(f / 3 + i)} cy={-30 + 70 * rnd(i + 3)} r={4} fill="#FFF3A0" />)}
        </g>
      )}
      {plug > 0 && (
        <g transform={`translate(0 ${plugY})`}>
          <path d="M 0 -300 L 0 -60" stroke={INK} strokeWidth={26} strokeLinecap="round" />
          <path d="M 0 -300 L 0 -60" stroke={GR.steelLite} strokeWidth={14} strokeLinecap="round" />
          <rect x={-46} y={-60} width={92} height={70} rx={16} fill={GR.navy} stroke={INK} strokeWidth={7} />
          <rect x={-26} y={10} width={12} height={46} fill={GR.brassHi} stroke={INK} strokeWidth={4} />
          <rect x={14} y={10} width={12} height={46} fill={GR.brassHi} stroke={INK} strokeWidth={4} />
        </g>
      )}
      {/* the brain and the coins out of the spout */}
      {brainK > 0 && (
        <g transform={`translate(${lerp(400, 430, brainK)} ${lerp(-210, -330 - 40 * Math.sin(brainK * Math.PI), brainK)}) scale(${0.4 + 0.6 * Math.min(1, brainK * 1.6)})`}>
          <path d="M -62 6 Q -76 -34 -34 -48 Q -10 -76 24 -52 Q 66 -50 62 -8 Q 76 24 36 36 Q 10 56 -24 40 Q -58 44 -62 6 Z" fill="#F4A6B8" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <path d="M -40 -14 Q -16 -30 0 -10 Q 16 10 40 -8 M -22 14 Q 0 28 22 12 M 0 -44 Q -6 -10 4 30" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
          <path d="M -50 -26 Q -30 -44 -8 -52" fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.6} strokeLinecap="round" />
        </g>
      )}
      {coins > 0 && Array.from({length: 9}, (_, i) => {
        const t = clamp01(coins * 1.4 - i * 0.07);
        if (t <= 0) return null;
        const cx0 = 400 + (rnd(i + 7) - 0.3) * 260 * t, cy0 = -130 + 300 * t * t - 150 * Math.sin(t * Math.PI) * rnd(i + 2);
        return (
          <g key={i} transform={`translate(${cx0} ${Math.min(cy0, -10 + 0)}) rotate(${t * 540 * (i % 2 ? 1 : -1)})`}>
            <ellipse cx={0} cy={0} rx={22} ry={22 * Math.abs(Math.cos(t * 9 + i))} fill={GR.brassHi} stroke={INK} strokeWidth={4.5} />
          </g>
        );
      })}
      {tag && (
        <g transform={`translate(-210 -300) rotate(${-8 + 6 * Math.sin(f / 14)} 0 0)`}>
          <line x1={0} y1={-70} x2={0} y2={0} stroke={INK} strokeWidth={4} />
          <rect x={-monoW(tag, 24) / 2 - 18} y={0} width={monoW(tag, 24) + 36} height={48} rx={6} fill={GR.cream} stroke={INK} strokeWidth={5} />
          <text x={0} y={34} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} letterSpacing={1.5} fill={GR.navy}>{tag}</text>
        </g>
      )}
    </g>
  );
};

// ---- the pause button and the chairs ------------------------------------------------------------------------------------------------------------
/** A big round button. play (0..1) turns the two pause bars into a play triangle. */
export const PauseButton: React.FC<{x: number; y: number; f: number; scale?: number; play?: number; glow?: number; press?: number; id?: string}> = ({x, y, f, scale = 1, play = 0, glow = 1, press = 0, id = 'pb'}) => {
  const k = clamp01(play);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><Grad id={`${id}-o`} base={k > 0.5 ? GR.green : GR.orange} /><Grad id={`${id}-r`} base={GR.steelHi} /></defs>
      <ContactShadow cx={0} cy={118} rx={170} ry={20} opacity={0.4} />
      <circle cx={0} cy={0} r={150 + 8 * glow * Math.sin(f / 9)} fill={k > 0.5 ? GR.greenHi : GR.orangeHi} opacity={0.25 * glow} />
      <ellipse cx={0} cy={86} rx={150} ry={50} fill={`url(#${id}-r)`} stroke={INK} strokeWidth={8} />
      <g transform={`translate(0 ${press * 22})`}>
        <path d="M -128 40 L -128 -10 Q -128 -112 0 -112 Q 128 -112 128 -10 L 128 40 Q 128 100 0 100 Q -128 100 -128 40 Z" fill={`url(#${id}-o)`} stroke={INK} strokeWidth={9} />
        <path d="M -100 -30 Q -90 -90 -20 -96" fill="none" stroke="#FFFFFF" strokeWidth={8} opacity={0.45} strokeLinecap="round" />
        <g opacity={1 - k}>
          <rect x={-58 + 14 * k} y={-52} width={34} height={104} rx={8} fill={GR.cream} stroke={INK} strokeWidth={6} />
          <rect x={24 - 14 * k} y={-52} width={34} height={104} rx={8} fill={GR.cream} stroke={INK} strokeWidth={6} />
        </g>
        <path d="M -34 -58 L 62 0 L -34 58 Z" fill={GR.cream} stroke={INK} strokeWidth={7} strokeLinejoin="round" opacity={k} />
      </g>
    </g>
  );
};

/** A row of folding chairs. face (0..1) swivels them toward the stage, lit lights the chair with the name tag. */
export const ChairRow: React.FC<{x: number; y: number; f: number; scale?: number; face?: number; lit?: number; n?: number; tag?: string; id?: string}> = ({x, y, f, scale = 1, face = 1, lit = 0, n = 5, tag = '', id = 'ch'}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><Grad id={`${id}-m`} base={GR.steelHi} /><Grad id={`${id}-w`} base={GR.wood} /></defs>
    {Array.from({length: n}, (_, i) => {
      const cx = (i - (n - 1) / 2) * 170, sway = 2 * Math.sin(f / 19 + i * 1.3);
      const isLit = i === Math.floor(n / 2);
      const squeeze = lerp(0.82, 1, face);
      return (
        <g key={i} transform={`translate(${cx} 0) scale(${squeeze} 1) rotate(${sway})`}>
          <ContactShadow cx={0} cy={4} rx={86} ry={11} opacity={0.35} />
          <path d="M -62 0 L -34 -150 M 62 0 L 34 -150" stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <path d="M -62 0 L -34 -150 M 62 0 L 34 -150" stroke={GR.steelLite} strokeWidth={6} strokeLinecap="round" />
          <rect x={-62} y={-176} width={124} height={34} rx={10} fill={`url(#${id}-w)`} stroke={INK} strokeWidth={7} />
          <rect x={-56} y={-330} width={112} height={132} rx={14} fill={isLit && lit > 0 ? lerpHex(GR.wood, GR.orangeHi, lit * 0.4) : `url(#${id}-m)`} stroke={INK} strokeWidth={7} />
          <rect x={-40} y={-316} width={80} height={14} rx={7} fill="#FFFFFF" opacity={0.25} />
          {isLit && tag && lit > 0 && (
            <g transform={`translate(0 ${-250}) rotate(${6 * Math.sin(f / 10)})`} opacity={clamp01(lit * 2)}>
              <rect x={-50} y={-22} width={100} height={44} rx={5} fill={GR.cream} stroke={INK} strokeWidth={5} />
              <rect x={-36} y={-6} width={72} height={6} fill={INK} opacity={0.7} /><rect x={-36} y={8} width={46} height={5} fill={INK} opacity={0.5} />
            </g>
          )}
        </g>
      );
    })}
  </g>
);

// ---- the wall set: calendar and switchbox -----------------------------------------------------------------------------------------------------------
/** A wall calendar with a big day number. day interpolates visually between two numbers; flip (0..1) is the leaf turning. */
export const WallCalendar: React.FC<{x: number; y: number; f: number; scale?: number; from?: number; to?: number; flip?: number; month?: string; id?: string}> = ({x, y, f, scale = 1, from = 14, to = 12, flip = 0, month = 'OCTOBER', id = 'wc'}) => {
  const k = clamp01(flip);
  const day = k < 0.5 ? from : to;
  const lean = Math.abs(Math.sin(k * Math.PI));
  return (
    <g transform={`translate(${x} ${y}) rotate(${1.2 * Math.sin(f / 31)}) scale(${scale})`}>
      <ContactShadow cx={14} cy={290} rx={150} ry={12} opacity={0.18} />
      <rect x={-150} y={-180} width={300} height={440} rx={14} fill={GR.cream} stroke={INK} strokeWidth={8} />
      <rect x={-150} y={-180} width={300} height={90} rx={14} fill={GR.brick} stroke={INK} strokeWidth={8} />
      <text x={0} y={-118} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={44} letterSpacing={4} fill={GR.cream}>{month}</text>
      {[-90, 90].map((cx) => <circle key={cx} cx={cx} cy={-186} r={13} fill={GR.steelLite} stroke={INK} strokeWidth={5} />)}
      <g transform={`translate(0 ${-lean * 22}) scale(${1 - 0.04 * lean} ${1 - 0.22 * lean})`}>
        <text x={0} y={110} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={230} fill={GR.navy}>{day}</text>
      </g>
      <path d={`M -130 -80 L 130 -80`} stroke={INK} strokeWidth={4} opacity={0.4} />
      {k > 0 && k < 1 && <path d={`M 150 ${-80 + 340 * k} q ${-60 * lean} 10 ${-150} 30`} fill="none" stroke={INK} strokeWidth={3} opacity={0.3} />}
    </g>
  );
};

/** A grey wall switchbox with a lamp. lamp (0..1) turns the lamp hazard orange and pulsing; stamp is a text lid label set by the caller. */
export const Switchbox: React.FC<{x: number; y: number; f: number; scale?: number; lamp?: number; id?: string; wires?: boolean}> = ({x, y, f, scale = 1, lamp = 0, id = 'sw', wires = true}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><Grad id={`${id}-g`} base={GR.steelLite} pale /></defs>
    <ContactShadow cx={10} cy={250} rx={170} ry={12} opacity={0.2} />
    {wires && [-110, 0, 110].map((wx, i) => <path key={i} d={`M ${wx} -200 q ${10 * Math.sin(f / 18 + i)} -80 ${wx * 0.3} -300`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />)}
    <rect x={-190} y={-200} width={380} height={450} rx={22} fill={`url(#${id}-g)`} stroke={INK} strokeWidth={9} />
    <rect x={-160} y={-170} width={320} height={110} rx={12} fill={GR.steel} stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={-115} r={40} fill={lamp > 0 ? lerpHex(GR.steelLite, GR.orange, lamp) : GR.steelLite} stroke={INK} strokeWidth={7} />
    {lamp > 0 && <circle cx={0} cy={-115} r={56 + 14 * Math.sin(f / 4)} fill={GR.orange} opacity={0.3 * lamp} />}
    {Array.from({length: 5}, (_, i) => <path key={i} d={`M ${-170 + i * 78} 250 l 40 -50 l 38 0 l -40 50 Z`} fill={i % 2 ? GR.navy : GR.orangeHi} stroke={INK} strokeWidth={3} opacity={0.9} />)}
    <rect x={-160} y={-30} width={320} height={160} rx={10} fill={GR.cream} stroke={INK} strokeWidth={5} opacity={0.0} />
    <rect x={-110} y={-30} width={220} height={20} rx={4} fill={INK} opacity={0.5} /><rect x={-110} y={10} width={150} height={14} rx={4} fill={INK} opacity={0.35} />
  </g>
);

// ---- the plant yard ----------------------------------------------------------------------------------------------------------------------------------
export type StackState = 'run' | 'off' | 'maint';
/** A generator hall with a tall stack. run steams, off is dark with a hazard lamp and a cooling tick, maint wears a hard hat. hat (0..1) drops the hat in. */
export const GenStack: React.FC<{x: number; y: number; f: number; scale?: number; state?: StackState; hat?: number; id?: string; seed?: number; steamK?: number}> =
({x, y, f, scale = 1, state = 'run', hat = 0, id = 'gs', seed = 0, steamK = 1}) => {
  const off = state === 'off';
  const cold = off || (state === 'maint' && hat > 0.5);
  const body = off ? '#7A8C98' : GR.brick;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><Grad id={`${id}-b`} base={body} /><Grad id={`${id}-s`} base={GR.steelHi} /></defs>
      <ContactShadow cx={0} cy={6} rx={200} ry={22} opacity={0.4} />
      <rect x={-170} y={-210} width={340} height={210} rx={14} fill={`url(#${id}-b)`} stroke={INK} strokeWidth={9} />
      <rect x={-170} y={-210} width={340} height={22} rx={10} fill="#FFFFFF" opacity={0.2} />
      {[-90, 0, 90].map((wx, i) => <rect key={i} x={wx - 28} y={-150} width={56} height={70} rx={8} fill={cold ? '#2B3A45' : GR.skyHi} stroke={INK} strokeWidth={6} />)}
      <rect x={-34} y={-70} width={68} height={70} fill={GR.navy} stroke={INK} strokeWidth={6} />
      <rect x={-30} y={-430} width={60} height={230} fill={`url(#${id}-s)`} stroke={INK} strokeWidth={9} />
      <rect x={-40} y={-452} width={80} height={30} rx={6} fill={GR.steel} stroke={INK} strokeWidth={7} />
      {[0, 1, 2].map((i) => <rect key={i} x={-30} y={-410 + i * 62} width={60} height={12} fill={i % 2 ? '#FFFFFF' : GR.orangeHi} opacity={0.8} />)}
      {/* lamp */}
      <circle cx={0} cy={-232} r={14} fill={off ? GR.orange : GR.cyanHi} stroke={INK} strokeWidth={5} opacity={off ? 0.55 + 0.45 * Math.sin(f / 5) : 0.9} />
      {/* steam */}
      {!cold && Array.from({length: 6}, (_, i) => {
        const t = ((f / 80 + i / 6 + seed * 0.17) % 1);
        return <ellipse key={i} cx={10 * Math.sin(f / 30 + i + seed) + t * 56} cy={-468 - t * 260} rx={(26 + t * 56) * steamK} ry={(18 + t * 36) * steamK} fill="#FFFFFF" stroke={INK} strokeWidth={t < 0.3 ? 3 : 0} opacity={0.9 * (1 - t) * steamK} />;
      })}
      {off && Array.from({length: 2}, (_, i) => <ellipse key={i} cx={6 + i * 6} cy={-470 - ((f / 120 + i * 0.5) % 1) * 120} rx={18} ry={10} fill="#9AB0BC" opacity={0.3 * (1 - ((f / 120 + i * 0.5) % 1))} />)}
      {/* hard hat */}
      {state === 'maint' && (
        <g transform={`translate(0 ${-470 - (1 - clamp01(hat)) * 360}) rotate(${(1 - hat) * 20 + 4 * Math.sin(f / 13)})`} opacity={clamp01(hat * 4)}>
          <path d="M -70 0 Q -70 -62 0 -66 Q 70 -62 70 0 Z" fill={GR.orangeHi} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <rect x={-86} y={-4} width={172} height={18} rx={9} fill={GR.orange} stroke={INK} strokeWidth={6} />
          <rect x={-10} y={-64} width={20} height={56} fill={GR.orange} stroke={INK} strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

// ---- the postcard street --------------------------------------------------------------------------------------------------------------------------------
/** A postcard that unfolds (open 0..1) into a street of small houses with porch lights (lit 0..n windows). check (0..1) drops a rebate check on a roof. */
export const PostcardStreet: React.FC<{x: number; y: number; f: number; scale?: number; open?: number; lit?: number; check?: number; id?: string; n?: number}> = ({x, y, f, scale = 1, open = 1, lit = 0, check = 0, id = 'ps', n = 5}) => {
  const k = clamp01(open);
  const w = lerp(380, 920, k);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={210} rx={w / 2 + 20} ry={20} opacity={0.35} />
      <g transform={`scale(1 ${lerp(0.4, 1, k)})`}>
        <rect x={-w / 2} y={-220} width={w} height={440} rx={14} fill={GR.cream} stroke={INK} strokeWidth={9} />
        <rect x={-w / 2 + 16} y={-204} width={w - 32} height={408} rx={8} fill={GR.sky} stroke={INK} strokeWidth={3.5} />
        <rect x={-w / 2 + 16} y={80} width={w - 32} height={124} fill={GR.snow} />
        {k > 0.25 && Array.from({length: n}, (_, i) => {
          const hx = lerp(-w / 2 + 80, w / 2 - 80, n === 1 ? 0.5 : i / (n - 1));
          const show = clamp01((k - 0.25 - i * 0.07) * 4);
          const h = 120 + (i % 2) * 24;
          const isLit = i < lit;
          return (
            <g key={i} transform={`translate(${hx} 90) scale(${show})`}>
              <rect x={-52} y={-h} width={104} height={h} fill={i % 2 ? '#D9A066' : '#C4755C'} stroke={INK} strokeWidth={6} />
              <path d={`M -66 ${-h} L 0 ${-h - 62} L 66 ${-h} Z`} fill="#6B7C88" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
              <path d={`M -58 ${-h - 6} L 0 ${-h - 56} L 58 ${-h - 6} L 50 ${-h - 18} L 0 ${-h - 44} L -50 ${-h - 18} Z`} fill="#FFFFFF" opacity={0.8} />
              <rect x={-34} y={-h + 26} width={30} height={34} fill={isLit ? GR.brassHi : GR.navy} stroke={INK} strokeWidth={4} />
              <rect x={8} y={-h + 26} width={30} height={34} fill={isLit ? GR.brassHi : GR.navy} stroke={INK} strokeWidth={4} />
              {isLit && <circle cx={0} cy={-h + 44} r={44 + 6 * Math.sin(f / 7 + i)} fill={GR.brassHi} opacity={0.18} />}
              <rect x={-14} y={-46} width={28} height={46} fill={GR.brickDeep} stroke={INK} strokeWidth={4} />
              <circle cx={-26} cy={-30} r={6} fill={isLit ? GR.brassHi : GR.steelLite} stroke={INK} strokeWidth={3} />
            </g>
          );
        })}
        {k < 0.4 && <rect x={w / 2 - 110} y={-190} width={80} height={96} fill={GR.brick} stroke={INK} strokeWidth={5} opacity={1 - k * 2} />}
      </g>
      {check > 0 && (
        <g transform={`translate(${lerp(120, 40, eo(check * 100, 0, 60))} ${lerp(-420, -100, eo(check * 100, 0, 60)) + 14 * Math.sin(check * 16) * (1 - check)}) rotate(${-14 + 24 * Math.sin(check * 9) * (1 - check)})`}>
          <rect x={-70} y={-34} width={140} height={68} rx={4} fill={GR.paper} stroke={INK} strokeWidth={5} />
          <rect x={-56} y={-20} width={60} height={7} fill={INK} opacity={0.5} /><rect x={-56} y={-6} width={40} height={6} fill={INK} opacity={0.35} />
          <circle cx={42} cy={8} r={13} fill={GR.green} stroke={INK} strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

// ---- the plug, the ledger slips and the spare tire -------------------------------------------------------------------------------------------------------------
/** A power plug on its own long cord. cord (0..1) is how far the cord has paid out from the edge it enters; tag is the small tag. */
export const OwnPlug: React.FC<{x: number; y: number; f: number; scale?: number; cord?: number; tag?: string; q?: number; id?: string; dir?: 1 | -1}> = ({x, y, f, scale = 1, cord = 1, tag = '', q = 0, id = 'op', dir = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale * dir} ${scale})`}>
    <path d={`M 0 0 C ${300 * cord} ${-80 + 30 * Math.sin(f / 15)} ${600 * cord} ${120} ${1000 * cord} ${40 + 40 * Math.sin(f / 19)}`} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
    <path d={`M 0 0 C ${300 * cord} ${-80 + 30 * Math.sin(f / 15)} ${600 * cord} ${120} ${1000 * cord} ${40 + 40 * Math.sin(f / 19)}`} fill="none" stroke={GR.steelLite} strokeWidth={14} strokeLinecap="round" />
    <g transform="translate(0 0)">
      <rect x={-24} y={-56} width={108} height={112} rx={20} fill={GR.navy} stroke={INK} strokeWidth={8} />
      <rect x={84} y={-34} width={52} height={14} fill={GR.brassHi} stroke={INK} strokeWidth={4} />
      <rect x={84} y={20} width={52} height={14} fill={GR.brassHi} stroke={INK} strokeWidth={4} />
      <rect x={-10} y={-44} width={14} height={86} rx={6} fill="#FFFFFF" opacity={0.25} />
      {tag && (
        <g transform={`translate(${dir === -1 ? 30 - monoW(tag, 22) - 60 : 30} 70) scale(${dir} 1) rotate(${8 * Math.sin(f / 12)} 0 0)`}>
          <line x1={0} y1={-14} x2={0} y2={20} stroke={INK} strokeWidth={4} />
          <rect x={-monoW(tag, 22) / 2 - 16} y={20} width={monoW(tag, 22) + 32} height={46} rx={6} fill={GR.cream} stroke={INK} strokeWidth={5} />
          <text x={0} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={1.5} fill={GR.navy}>{tag}</text>
          {q > 0 && <text x={monoW(tag, 22) / 2 + 40} y={74} fontFamily={SERIF} fontWeight={900} fontSize={80 * clamp01(q)} fill={GR.orange} stroke={INK} strokeWidth={3} paintOrder="stroke">?</text>}
        </g>
      )}
    </g>
  </g>
);

/** A ledger slip with a label and an optional stamp. p (0..1) is how far it has landed. */
export const LedgerSlip: React.FC<{x: number; y: number; scale?: number; label: string; stamp?: string; p?: number; stampK?: number; rot?: number; f?: number}> = ({x, y, scale = 1, label, stamp = 'MW?', p = 1, stampK = 0, rot = 0, f = 0}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  const w = Math.max(520, monoW(label, 34) + 260);
  const land = 1 - Math.pow(1 - k, 3);
  return (
    <g transform={`translate(${x} ${y - (1 - land) * 160}) rotate(${rot + (1 - land) * -8}) scale(${scale * (0.9 + 0.1 * land)})`} opacity={Math.min(1, k * 3)}>
      <rect x={-w / 2 + 8} y={-52} width={w} height={116} rx={6} fill="#000" opacity={0.25} />
      <rect x={-w / 2} y={-60} width={w} height={116} rx={6} fill={GR.paper} stroke={INK} strokeWidth={6} />
      <text x={-w / 2 + 30} y={-4} fontFamily={MONO} fontWeight={800} fontSize={34} letterSpacing={2} fill={GR.navy}>{label}</text>
      <line x1={-w / 2 + 30} y1={20} x2={w / 2 - 180} y2={20} stroke={INK} strokeWidth={2.5} strokeDasharray="6 7" opacity={0.5} />
      {stampK > 0 && (
        <g transform={`translate(${w / 2 - 100} -2) rotate(${-8 + 12 * (1 - stampK)}) scale(${1 + 0.6 * (1 - clamp01(stampK * 3))})`} opacity={clamp01(stampK * 4)}>
          <rect x={-72} y={-38} width={144} height={76} rx={6} fill="none" stroke={GR.orange} strokeWidth={7} />
          <text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={48} fill={GR.orange}>{stamp}</text>
        </g>
      )}
    </g>
  );
};

/** A spare tire on a hook. */
export const SpareTire: React.FC<{x: number; y: number; f: number; scale?: number; id?: string}> = ({x, y, f, scale = 1, id = 'sp'}) => (
  <g transform={`translate(${x} ${y}) rotate(${3 * Math.sin(f / 24)} 0 -120) scale(${scale})`}>
    <ContactShadow cx={6} cy={150} rx={90} ry={8} opacity={0.15} />
    <path d="M 0 -150 L 0 -110" stroke={INK} strokeWidth={8} /><path d="M -22 -150 q 22 -26 44 0" fill="none" stroke={INK} strokeWidth={8} />
    <circle cx={0} cy={0} r={110} fill="#242B33" stroke={INK} strokeWidth={9} />
    {Array.from({length: 16}, (_, i) => <line key={i} x1={Math.cos((i * Math.PI) / 8) * 92} y1={Math.sin((i * Math.PI) / 8) * 92} x2={Math.cos((i * Math.PI) / 8) * 110} y2={Math.sin((i * Math.PI) / 8) * 110} stroke="#5A6672" strokeWidth={6} />)}
    <circle cx={0} cy={0} r={62} fill={GR.steelLite} stroke={INK} strokeWidth={7} />
    <circle cx={0} cy={0} r={22} fill={GR.steelHi} stroke={INK} strokeWidth={5} />
    {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 40} cy={Math.sin((a * Math.PI) / 180) * 40} r={6} fill={INK} />)}
    <path d="M -84 -40 Q -64 -84 -20 -92" fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.3} strokeLinecap="round" />
  </g>
);

/** A hall front with a door for the knock. open (0..1) cracks the door. */
export const HallFront: React.FC<{x: number; y: number; f: number; scale?: number; knock?: number; id?: string; plaque?: string}> = ({x, y, f, scale = 1, knock = 0, id = 'hf', plaque = ''}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><Grad id={`${id}-w`} base="#C99F72" /></defs>
    <ContactShadow cx={0} cy={6} rx={380} ry={24} opacity={0.35} />
    <rect x={-380} y={-620} width={760} height={620} fill={`url(#${id}-w)`} stroke={INK} strokeWidth={9} />
    {Array.from({length: 12}, (_, i) => <line key={i} x1={-380} y1={-600 + i * 50} x2={380} y2={-600 + i * 50} stroke={INK} strokeWidth={2.5} opacity={0.2} />)}
    <path d="M -420 -620 L 0 -760 L 420 -620 Z" fill="#6B7C88" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -380 -630 L 0 -748 L 380 -630 L 360 -650 L 0 -730 L -360 -650 Z" fill="#FFFFFF" opacity={0.85} />
    <rect x={-96} y={-330} width={192} height={330} rx={8} fill={GR.woodDeep} stroke={INK} strokeWidth={9} transform={`rotate(${1.2 * Math.sin(knock * 40) * (knock > 0 && knock < 1 ? 1 : 0)} 0 0)`} />
    <rect x={-70} y={-306} width={64} height={130} rx={4} fill="#8A6540" stroke={INK} strokeWidth={4} /><rect x={6} y={-306} width={64} height={130} rx={4} fill="#8A6540" stroke={INK} strokeWidth={4} />
    <circle cx={64} cy={-150} r={9} fill={GR.brassHi} stroke={INK} strokeWidth={4} />
    {plaque && <g><rect x={-46} y={-330 + 4} width={92} height={30} rx={4} fill={GR.brassHi} stroke={INK} strokeWidth={4} /><text x={0} y={-330 + 26} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={17} letterSpacing={1} fill={GR.brassDeep}>{plaque}</text></g>}
    {[-250, 250].map((wx) => <g key={wx}><rect x={wx - 62} y={-420} width={124} height={140} rx={6} fill={GR.skyHi} stroke={INK} strokeWidth={7} /><line x1={wx} y1={-420} x2={wx} y2={-280} stroke={INK} strokeWidth={5} /></g>)}
    <rect x={-130} y={-350} width={260} height={26} fill={GR.snow} stroke={INK} strokeWidth={5} />
    {Array.from({length: 4}, (_, i) => { const t = ((f / 70 + i * 0.25) % 1); return <circle key={i} cx={-120 + i * 80 + 4 * Math.sin(f / 10 + i)} cy={-324 + t * 40} r={3.5} fill="#FFFFFF" opacity={0.7 * (1 - t)} />; })}
  </g>
);

// ---- 2026-10-17 second pass: the height chart, the remote and the date drum (replacing the scale, the chairs and the wall calendar) -------------------------
/** A wooden growth chart marked in megawatts. mark (MW) draws a pencil line at that height with a label; pencil (0..1) brings the pencil in. */
export const HeightChart: React.FC<{x: number; y: number; f: number; scale?: number; mark?: number; markLabel?: string; markK?: number; pencil?: number; id?: string; top?: number}> = ({x, y, f, scale = 1, mark = 40, markLabel = '? MW', markK = 0, pencil = 0, id = 'hc', top = 60}) => {
  const H = 900, W2 = 190;
  const my = -H * (mark / top) - 40;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><Grad id={`${id}-w`} base={GR.wood} /></defs>
      <ContactShadow cx={0} cy={4} rx={150} ry={14} opacity={0.3} />
      <rect x={-W2 / 2} y={-H - 70} width={W2} height={H + 70} rx={10} fill={`url(#${id}-w)`} stroke={INK} strokeWidth={9} />
      <rect x={-W2 / 2 + 10} y={-H - 60} width={14} height={H + 50} fill="#FFFFFF" opacity={0.18} />
      <rect x={-W2 / 2 - 14} y={-H - 98} width={W2 + 28} height={44} rx={8} fill={GR.cream} stroke={INK} strokeWidth={7} />
      <text x={0} y={-H - 64} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={32} letterSpacing={4} fill={GR.navy}>MW</text>
      {Array.from({length: 13}, (_, i) => {
        const yy = -40 - (H / 12) * i;
        const major = i % 4 === 0;
        return (
          <g key={i}>
            <line x1={-W2 / 2 + 10} y1={yy} x2={-W2 / 2 + (major ? 78 : 46)} y2={yy} stroke={INK} strokeWidth={major ? 6 : 4} />
          </g>
        );
      })}
      {markK > 0 && (
        <g opacity={clamp01(markK * 3)}>
          <line x1={-W2 / 2 - 40} y1={my} x2={lerp(-W2 / 2 - 40, W2 / 2 + 40, clamp01(markK))} y2={my} stroke={GR.orange} strokeWidth={9} strokeLinecap="round" />
          <g transform={`translate(${W2 / 2 + 60} ${my})`} opacity={clamp01((markK - 0.6) * 4)}>
            <rect x={0} y={-30} width={monoW(markLabel, 34) + 34} height={60} rx={6} fill={GR.cream} stroke={GR.orange} strokeWidth={6} />
            <text x={17} y={12} fontFamily={MONO} fontWeight={900} fontSize={34} fill={GR.orangeDeep} letterSpacing={1.5}>{markLabel}</text>
          </g>
        </g>
      )}
      {pencil > 0 && (
        <g transform={`translate(${lerp(-W2 / 2 - 220, -W2 / 2 - 28, clamp01(markK || pencil))} ${my + 6 * Math.sin(f / 5)}) rotate(-24)`} opacity={clamp01(pencil * 3)}>
          <rect x={-170} y={-12} width={150} height={24} fill="#F2C94C" stroke={INK} strokeWidth={5} />
          <path d="M -20 -12 L 18 0 L -20 12 Z" fill={GR.cream} stroke={INK} strokeWidth={4} strokeLinejoin="round" /><path d="M 8 -3 L 18 0 L 8 3 Z" fill={INK} />
          <rect x={-190} y={-12} width={22} height={24} fill={GR.brick} stroke={INK} strokeWidth={5} />
        </g>
      )}
    </g>
  );
};

export type RemoteBtn = 'pause' | 'rewind' | 'play' | 'none';
/** A big horizontal TV remote. active lights one button (a brass glow and a press); land (0..1) drops it in with a bounce. */
export const RemoteControl: React.FC<{x: number; y: number; f: number; scale?: number; active?: RemoteBtn; press?: number; id?: string; rot?: number}> = ({x, y, f, scale = 1, active = 'none', press = 0, id = 'rc', rot = 0}) => {
  const btn = (kind: Exclude<RemoteBtn, 'none'>, cx: number) => {
    const on = active === kind;
    const dn = on ? press * 12 : 0;
    return (
      <g key={kind} transform={`translate(${cx} ${dn})`}>
        {on && <circle cx={0} cy={0} r={96 + 22 * Math.abs(Math.sin(f / 5)) + press * 30} fill={GR.brassHi} opacity={0.35 + 0.15 * press} />}
        <circle cx={0} cy={8} r={78} fill={INK} opacity={0.35} />
        <circle cx={0} cy={0} r={78} fill={on ? lerpHex(GR.steelHi, GR.brassHi, 0.6) : GR.steelLite} stroke={INK} strokeWidth={8} />
        <path d="M -52 -30 Q -40 -62 -8 -66" fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.4} strokeLinecap="round" />
        {kind === 'pause' && <><rect x={-30} y={-34} width={20} height={68} rx={5} fill={GR.navy} /><rect x={10} y={-34} width={20} height={68} rx={5} fill={GR.navy} /></>}
        {kind === 'play' && <path d="M -22 -38 L 40 0 L -22 38 Z" fill={GR.navy} strokeLinejoin="round" />}
        {kind === 'rewind' && <><path d="M 2 -34 L -32 0 L 2 34 Z" fill={GR.navy} /><path d="M 40 -34 L 6 0 L 40 34 Z" fill={GR.navy} /></>}
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y + press * 14}) rotate(${rot + 1.4 * Math.sin(f / 26) + press * 1.2}) scale(${scale * (1 - 0.012 * press)})`}>
      <defs><Grad id={`${id}-b`} base={GR.steelHi} /></defs>
      <ContactShadow cx={0} cy={150} rx={400} ry={22} opacity={0.4} />
      <rect x={-420} y={-140} width={840} height={280} rx={70} fill={`url(#${id}-b)`} stroke={INK} strokeWidth={10} />
      <rect x={-396} y={-124} width={792} height={26} rx={13} fill="#FFFFFF" opacity={0.22} />
      <circle cx={-350} cy={-90} r={13} fill={active === 'none' ? GR.steelLite : GR.brassHi} stroke={INK} strokeWidth={4} />
      {btn('rewind', -230)}{btn('pause', 0)}{btn('play', 230)}
    </g>
  );
};

/** A brass date drum, an odometer for the day of the month. roll (0..1) spins it from `from` back to `to`. */
export const DateDrum: React.FC<{x: number; y: number; f: number; scale?: number; from?: number; to?: number; roll?: number; month?: string; id?: string}> = ({x, y, f, scale = 1, from = 14, to = 12, roll = 0, month = 'OCT', id = 'dd'}) => {
  const days = Array.from({length: from - to + 1}, (_, i) => to + i); // to .. from
  const idx = from - lerp(0, from - to, clamp01(roll)); // current numeric value
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><Grad id={`${id}-b`} base={GR.brass} /><clipPath id={`${id}-c`}><rect x={-20} y={-90} width={230} height={180} rx={14} /></clipPath></defs>
      <ContactShadow cx={0} cy={140} rx={290} ry={18} opacity={0.35} />
      <rect x={-290} y={-150} width={580} height={290} rx={36} fill={`url(#${id}-b)`} stroke={INK} strokeWidth={10} />
      <rect x={-264} y={-128} width={528} height={246} rx={22} fill={GR.dusk} stroke={INK} strokeWidth={6} />
      <text x={-230} y={44} fontFamily={MONO} fontWeight={900} fontSize={110} fill={GR.cream} letterSpacing={6}>{month}</text>
      <rect x={-20} y={-90} width={230} height={180} rx={14} fill={GR.cream} stroke={INK} strokeWidth={6} />
      <g clipPath={`url(#${id}-c)`}>
        {days.map((d) => (
          <text key={d} x={95} y={50 + (d - idx) * 190 * -1 * -1} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={170} fill={GR.navy} transform={`translate(0 ${(d - idx) * -190 * -1})`} />
        ))}
        {days.map((d) => (
          <text key={`n${d}`} x={95} y={50 + (idx - d) * 190} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={170} fill={GR.navy}>{d}</text>
        ))}
      </g>
      <rect x={-20} y={-90} width={230} height={50} rx={14} fill="#000" opacity={0.12} />
      <rect x={-20} y={40} width={230} height={50} rx={14} fill="#000" opacity={0.12} />
    </g>
  );
};
