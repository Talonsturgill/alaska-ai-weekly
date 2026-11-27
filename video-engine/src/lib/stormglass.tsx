import React from 'react';
import {tones, FormGradient, RimLight, ContactShadow, INK} from './lighting';
import {figureIdle, FigurePose} from './figureidle';
import {MONO, monoW} from './prospect';

/**
 * THE STORM-GLASS FAMILY (2026-11-27, "Trained on 2019").
 *
 * StormGlass is a sealed nineteenth-century weather vial on a brass stand, with a face etched in
 * the glass and feather crystals inside that branch like boosted trees (shape only, never a
 * claim). It is the MODEL: six brass taps on its stand take six weather readings, a crystal tip
 * prints strike marks. Its cap carries an oxblood wax seal whose stamp is the throughline.
 * Lemon (#FFE45C) is LIGHTNING alone: bolts, strike tokens, the glass's inner charge.
 * Oxblood is the seal alone. Every faced character here takes `cues` (the beatPose pattern).
 */
export const SG = {
  plum: '#2E2440', plumL: '#46395E', mauve: '#5B5874', mauveL: '#8A84A6', lilac: '#B7AECB',
  apricot: '#F2A65A', apricotL: '#FFD29A', sedge: '#5E6B34', sedgeL: '#8A9A4C', sedgeD: '#3E4824',
  taiga: '#1D2A22', taigaL: '#2F4234', fireweed: '#C44C82', fireweedL: '#E27FAE', peat: '#3E3226',
  glass: '#CFE4E0', glassD: '#8FB5B0', glassL: '#F0FAF8', crystal: '#F6F1E2', brass: '#B98A3A', brassL: '#E9C46A', brassD: '#7A5820',
  lemon: '#FFE45C', lemonL: '#FFF6B8', lemonD: '#D9B20F', oxblood: '#7E2630', oxbloodL: '#A8424E', oxbloodD: '#4E1219',
  ink: '#1A1424', paper: '#EFE6D2', paperD: '#D3C6A8', wood: '#B27A45', woodL: '#D9A36A', woodD: '#7A4E26', sepia: '#B49A72',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
let UID = 0;
const uid = (s: string) => `${s.replace(/[^a-z0-9]/gi, '')}${(UID++ % 100000).toString(36)}`;

type BeatPose = {skew: number; dip: number; tilt: number; arm: number; on: boolean};
const NO_POSE: BeatPose = {skew: 0, dip: 0, tilt: 0, arm: 0, on: false};
function beatPose(f: number, seed: number, cues: number[] | undefined, h: number): BeatPose {
  if (!cues || !cues.length) return NO_POSE;
  const p: FigurePose = figureIdle(f, seed, 1, cues);
  const skew = (Math.atan2(p.shift * 2.2 * (h / 300), h) * 180) / Math.PI + p.lean * 0.7;
  return {skew, dip: p.dip * 1.4, tilt: p.headRot * 1.6, arm: (p.armL + p.armR) * 1.4, on: true};
}

/** A mono label on a plate sized to its string by arithmetic. */
export const Lab: React.FC<{x: number; y: number; text: string; size?: number; fill?: string; ink?: string; edge?: string; rot?: number}> =
({x, y, text, size = 18, fill = SG.paper, ink = SG.ink, edge = SG.ink, rot = 0}) => {
  const w = monoW(text, size) + 22;
  const h = size + 14;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill={fill} stroke={edge} strokeWidth={3} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1} fill={ink}>{text}</text>
    </g>
  );
};

export type GlassEmotion = 'calm' | 'curious' | 'startled' | 'surprised' | 'worried' | 'proud' | 'sheepish' | 'determined' | 'uneasy';

/** feather crystal fern: a stem with alternating barbs; `g` grows it 0..1 */
const Fern: React.FC<{x: number; y: number; len: number; g: number; ang: number; seed: number; color: string; sway: number}> = ({x, y, len, g, ang, seed, color, sway}) => {
  const L = len * clamp01(g);
  if (L < 4) return null;
  const a = ((ang + sway) * Math.PI) / 180;
  const ex = x + Math.sin(a) * L, ey = y - Math.cos(a) * L;
  const barbs = [];
  const n = Math.floor(L / 16);
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const bx = x + Math.sin(a) * L * t, by = y - Math.cos(a) * L * t;
    const side = i % 2 ? 1 : -1;
    const bl = (1 - t) * 34 * (0.7 + 0.5 * h01(seed, i));
    const ba = a + side * (0.9 + 0.2 * h01(seed + 2, i));
    barbs.push(<path key={i} d={`M ${bx} ${by} L ${bx + Math.sin(ba) * bl} ${by - Math.cos(ba) * bl}`} stroke={color} strokeWidth={2.6} strokeLinecap="round" />);
  }
  return (
    <g>
      <path d={`M ${x} ${y} L ${ex} ${ey}`} stroke={color} strokeWidth={3.6} strokeLinecap="round" />
      {barbs}
    </g>
  );
};

/**
 * StormGlass. Origin (x, y) is the base's ground line, centre. At scale 1 it stands about 600 tall, 240 wide.
 *  grow 0..1     crystals inside branch up
 *  charge 0..1   lemon inner light (a bolt just struck)
 *  seal          'plain' | '2019' | 'test' the wax stamp; sealGlow 0..1, bulge 0..1 (wax bead weeps)
 *  lift 0..1     the cap lifts and tilts (test weather outside)
 *  taps 0..1     the six brass taps open one after another; tapFlow lemon trickles climb
 *  blush 0..1    ember blush from the base up
 *  ribbons 0..2  rosettes pinned on the stand
 *  look -1..1    pupils and lean
 */
export const StormGlass: React.FC<{
  f: number; x: number; y: number; s?: number; emotion?: GlassEmotion; grow?: number; charge?: number; seal?: 'plain' | '2019' | 'test';
  sealGlow?: number; bulge?: number; lift?: number; taps?: number; blush?: number; ribbons?: number; look?: number; cues?: number[]; seed?: number;
  label?: boolean; squash?: number; facing?: 1 | -1;
}> = ({f, x, y, s = 1, emotion = 'calm', grow = 1, charge = 0, seal = 'plain', sealGlow = 0, bulge = 0, lift = 0, taps = 0, blush = 0, ribbons = 0, look = 0, cues, seed = 5, label = true, squash = 0, facing = 1}) => {
  const id = uid(`sg${seed}`);
  const bp = beatPose(f, seed, cues, 520);
  const breath = 1 + 0.018 * Math.sin(f / 13 + seed);
  const blink = ((f + seed * 23) % 97) < 4;
  const tb = tones(SG.brass);
  const sq = clamp01(squash);
  const sway = 3 * Math.sin(f / 29 + seed) + bp.tilt * 0.4;
  const lean = look * 3 + bp.skew * 0.6;
  // crystals
  const ferns = [] as React.ReactNode[];
  const cCol = charge > 0.05 ? SG.lemonL : SG.crystal;
  for (let i = 0; i < 7; i++) {
    const fx = -62 + i * 21;
    const len = 150 + 140 * h01(seed + 9, i);
    const ang = (i - 3) * 9 + (h01(seed, i) - 0.5) * 10;
    ferns.push(<Fern key={i} x={fx} y={-110} len={len} g={grow * (0.75 + 0.25 * h01(seed + 5, i))} ang={ang} seed={seed + i} color={cCol} sway={sway * (0.5 + h01(seed, i + 3))} />);
  }
  const eyeY = -350, mouthY = -292;
  const pup = look * 7;
  const brow: Record<GlassEmotion, [number, number]> = {
    calm: [0, 0], curious: [-6, 4], startled: [-14, -14], surprised: [-12, -12], worried: [8, -10], proud: [-4, -4], sheepish: [6, -6], determined: [10, 10], uneasy: [6, -4],
  };
  const [bl, br] = brow[emotion];
  const mouth: Record<GlassEmotion, string> = {
    calm: `M -20 ${mouthY} q 20 10 40 0`,
    curious: `M -14 ${mouthY + 2} q 14 -6 28 0`,
    startled: `M -12 ${mouthY - 6} a 12 14 0 1 0 24 0 a 12 14 0 1 0 -24 0`,
    surprised: `M -10 ${mouthY - 4} a 10 12 0 1 0 20 0 a 10 12 0 1 0 -20 0`,
    worried: `M -20 ${mouthY + 6} q 20 -12 40 0`,
    proud: `M -24 ${mouthY - 2} q 24 18 48 0`,
    sheepish: `M -18 ${mouthY + 2} q 10 6 18 0 q 10 -4 18 2`,
    determined: `M -20 ${mouthY + 2} L 20 ${mouthY + 2}`,
    uneasy: `M -20 ${mouthY + 4} q 10 -6 20 0 q 10 6 20 0`,
  };
  const capLift = clamp01(lift);
  const tapN = 6;
  const sealText = seal === '2019' ? '2019' : seal === 'test' ? 'TEST' : '';
  const sealText2 = seal === 'test' ? 'OUTSIDE' : '';
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s}) translate(0 ${-bp.dip * 6})`}>
      <defs>
        <FormGradient id={`${id}b`} t={tb} />
        <linearGradient id={`${id}g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={SG.glassL} stopOpacity={0.85} />
          <stop offset="0.35" stopColor={SG.glass} stopOpacity={0.55} />
          <stop offset="1" stopColor={SG.glassD} stopOpacity={0.75} />
        </linearGradient>
        <radialGradient id={`${id}c`} cx="0.5" cy="0.75" r="0.7">
          <stop offset="0" stopColor={SG.lemon} stopOpacity={0.9} />
          <stop offset="1" stopColor={SG.lemon} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}e`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0" stopColor={SG.apricot} stopOpacity={0.8} />
          <stop offset="1" stopColor={SG.apricot} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}k`}><rect x={-96} y={-500} width={192} height={410} rx={90} /></clipPath>
      </defs>
      <ContactShadow cx={0} cy={2} rx={150} ry={20} opacity={0.42} />
      <g transform={`scale(${1 + sq * 0.06} ${1 - sq * 0.08})`}>
        {/* brass stand */}
        <path d="M -120 0 L -104 -70 L 104 -70 L 120 0 Z" fill={`url(#${id}b)`} stroke={SG.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={-112} y={-96} width={224} height={30} rx={8} fill={tb.key} stroke={SG.ink} strokeWidth={5} />
        <path d="M -98 -90 L 98 -90" stroke={SG.brassL} strokeWidth={3} opacity={0.8} />
        {[-100, 100].map((rx) => <circle key={rx} cx={rx * 0.92} cy={-82} r={5} fill={tb.core} stroke={SG.ink} strokeWidth={2} />)}
        {/* six taps */}
        {Array.from({length: tapN}, (_, i) => {
          const tx = -82 + i * 32.8;
          const open = clamp01(taps * tapN - i);
          return (
            <g key={i} transform={`translate(${tx} -36)`}>
              <rect x={-9} y={-12} width={18} height={24} rx={4} fill={tb.base} stroke={SG.ink} strokeWidth={3} />
              <g transform={`rotate(${open * 90})`}><rect x={-12} y={-3} width={24} height={6} rx={3} fill={SG.brassL} stroke={SG.ink} strokeWidth={2} /></g>
              {open > 0.05 && <circle cx={0} cy={0} r={4 + 2 * Math.sin(f / 4 + i)} fill={SG.lemon} opacity={0.6 * open} />}
            </g>
          );
        })}
        {label && <Lab x={0} y={-12 + 0} text="THE MODEL" size={15} fill={SG.paper} />}
        {/* ribbons */}
        {Array.from({length: Math.floor(clamp01(ribbons / 2) * 2 + 0.001)}, (_, i) => (
          <g key={`r${i}`} transform={`translate(${i ? 96 : -96} -60) rotate(${(i ? 8 : -8) + 4 * Math.sin(f / 9 + i)})`}>
            <path d="M -8 10 L -14 46 L -2 38 L 4 50 L 8 12 Z" fill={i ? SG.fireweed : SG.lemonD} stroke={SG.ink} strokeWidth={2.5} />
            {Array.from({length: 10}, (_, k) => {
              const a = (k / 10) * Math.PI * 2;
              return <circle key={k} cx={Math.cos(a) * 14} cy={Math.sin(a) * 14} r={7} fill={i ? SG.fireweedL : SG.lemon} stroke={SG.ink} strokeWidth={2} />;
            })}
            <circle cx={0} cy={0} r={11} fill={SG.paper} stroke={SG.ink} strokeWidth={3} />
          </g>
        ))}
        {/* glass body */}
        <g transform={`translate(0 0) rotate(${lean} 0 -96) scale(1 ${breath})`} style={{transformOrigin: '0px -96px'}}>
          <rect x={-100} y={-504} width={200} height={418} rx={94} fill={SG.plum} opacity={0.22} />
          <g clipPath={`url(#${id}k)`}>
            {ferns}
            {charge > 0.02 && <rect x={-100} y={-504} width={200} height={418} fill={`url(#${id}c)`} opacity={clamp01(charge)} />}
            {blush > 0.02 && <rect x={-100} y={-504 + 418 * (1 - clamp01(blush))} width={200} height={418 * clamp01(blush)} fill={`url(#${id}e)`} />}
          </g>
          <rect x={-100} y={-504} width={200} height={418} rx={94} fill={`url(#${id}g)`} stroke={SG.ink} strokeWidth={6} />
          <RimLight d="M 78 -440 Q 96 -300 80 -150" w={6} color={SG.apricotL} opacity={0.75} />
          <path d="M -70 -430 Q -84 -300 -70 -170" stroke={SG.glassL} strokeWidth={10} strokeLinecap="round" opacity={0.7} />
          <path d="M -54 -440 Q -62 -400 -56 -370" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
          {/* face, etched */}
          <g transform={`translate(${look * 6} 0)`}>
            {[-38, 38].map((ex, i) => (
              <g key={ex}>
                <ellipse cx={ex} cy={eyeY} rx={20} ry={blink ? 2 : emotion === 'startled' || emotion === 'surprised' ? 24 : 20} fill={SG.glassL} stroke={SG.ink} strokeWidth={4} />
                {!blink && <circle cx={ex + pup} cy={eyeY + 2} r={8} fill={SG.ink} />}
                {!blink && <circle cx={ex + pup + 3} cy={eyeY - 2} r={2.6} fill="#FFFFFF" />}
                <path d={`M ${ex - 20} ${eyeY - 30 + (i ? br : bl)} L ${ex + 20} ${eyeY - 30 + (i ? bl : br) * 0.4}`} stroke={SG.ink} strokeWidth={5} strokeLinecap="round" />
              </g>
            ))}
            <path d={mouth[emotion]} stroke={SG.ink} strokeWidth={4.5} fill={emotion === 'startled' || emotion === 'surprised' ? SG.plumL : 'none'} strokeLinecap="round" />
          </g>
          {/* brass cap and wax seal */}
          <g transform={`translate(0 ${-504 - capLift * 46}) rotate(${capLift * -10})`}>
            <rect x={-74} y={-34} width={148} height={40} rx={10} fill={`url(#${id}b)`} stroke={SG.ink} strokeWidth={5} />
            <rect x={-60} y={-46} width={120} height={16} rx={6} fill={tb.key} stroke={SG.ink} strokeWidth={4} />
            <path d="M -66 -24 L 66 -24" stroke={SG.brassL} strokeWidth={2.5} opacity={0.8} />
            <g transform={`translate(0 -56) scale(${1 + 0.12 * clamp01(bulge)})`}>
              {sealGlow > 0.02 && <circle cx={0} cy={0} r={52} fill={SG.oxbloodL} opacity={0.35 * clamp01(sealGlow) * (0.8 + 0.2 * Math.sin(f / 5))} />}
              <path d="M -38 4 C -44 -20 -26 -38 -2 -38 C 24 -40 44 -22 40 2 C 42 22 22 34 0 32 C -22 34 -40 22 -38 4 Z" fill={SG.oxblood} stroke={SG.ink} strokeWidth={4} />
              <ellipse cx={-10} cy={-16} rx={14} ry={7} fill={SG.oxbloodL} opacity={0.7} />
              <circle cx={0} cy={0} r={24} fill="none" stroke={SG.oxbloodD} strokeWidth={3} />
              {sealText && <text x={0} y={sealText2 ? -2 : 7} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={sealText2 ? 13 : 19} fill={SG.paper}>{sealText}</text>}
              {sealText2 && <text x={0} y={13} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={9} fill={SG.paper}>{sealText2}</text>}
              {bulge > 0.1 && <path d={`M 26 22 q 4 ${10 + 26 * clamp01(bulge)} 0 ${18 + 30 * clamp01(bulge)} q -6 -4 -2 -${18 + 30 * clamp01(bulge)}`} fill={SG.oxblood} stroke={SG.ink} strokeWidth={2.5} />}
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};

/** Thunderhead: a cumulonimbus with an anvil. Origin is the base of the cloud's centre. flash 0..1 lights it from inside. */
export const Thunderhead: React.FC<{f: number; x: number; y: number; w?: number; flash?: number; seed?: number; anvil?: boolean}> = ({f, x, y, w = 900, flash = 0, seed = 2, anvil = true}) => {
  const id = uid(`th${seed}`);
  const k = w / 900;
  const puffs = [] as React.ReactNode[];
  for (let i = 0; i < 14; i++) {
    const px = -380 + i * 58 + (h01(seed, i) - 0.5) * 40;
    const py = -60 - 160 * Math.sin((i / 13) * Math.PI) - 60 * h01(seed + 1, i);
    const r = 70 + 50 * h01(seed + 2, i) + 18 * Math.sin(f / (40 + i * 3) + i);
    puffs.push(<circle key={i} cx={px} cy={py} r={r} />);
  }
  const fl = clamp01(flash);
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={SG.lilac} />
          <stop offset="0.55" stopColor={SG.mauveL} />
          <stop offset="1" stopColor={SG.mauve} />
        </linearGradient>
      </defs>
      {anvil && <path d={`M -560 -330 Q -300 -420 0 -430 Q 320 -420 600 -360 Q 420 -330 200 -320 Q 0 -300 -260 -320 Z`} fill={SG.mauveL} stroke={SG.ink} strokeWidth={5} opacity={0.95} />}
      <g fill={`url(#${id}g)`} stroke={SG.ink} strokeWidth={5}>{puffs}</g>
      <g fill={`url(#${id}g)`}>{puffs}</g>
      <path d="M -440 -20 Q 0 30 440 -20 L 440 10 Q 0 60 -440 10 Z" fill={SG.mauve} stroke={SG.ink} strokeWidth={5} />
      {Array.from({length: 7}, (_, i) => <path key={i} d={`M ${-360 + i * 120} 20 q ${10 + 8 * Math.sin(f / 20 + i)} 90 -6 ${160 + 40 * h01(seed, i)}`} stroke={SG.mauveL} strokeWidth={14} strokeLinecap="round" opacity={0.35} />)}
      {fl > 0.02 && <ellipse cx={-60 + 140 * h01(seed, Math.floor(f / 6))} cy={-140} rx={260} ry={150} fill={SG.lemonL} opacity={0.55 * fl} />}
      <path d="M -300 -200 Q -200 -250 -120 -220" stroke={SG.apricotL} strokeWidth={6} fill="none" opacity={0.6} />
    </g>
  );
};

/** A forked lightning bolt from (x1,y1) to (x2,y2). p 0..1: 0..0.3 strikes down, then fades. */
export const Bolt: React.FC<{x1: number; y1: number; x2: number; y2: number; p: number; seed?: number; width?: number; branches?: number}> = ({x1, y1, x2, y2, p, seed = 1, width = 14, branches = 2}) => {
  if (p <= 0 || p >= 1) return null;
  const n = 9;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const jx = i === 0 || i === n ? 0 : (h01(seed, i) - 0.5) * 90;
    pts.push([x1 + (x2 - x1) * t + jx, y1 + (y2 - y1) * t]);
  }
  const reach = clamp01(p / 0.18);
  const m = Math.max(1, Math.round(reach * n));
  const d = 'M ' + pts.slice(0, m + 1).map((q) => `${q[0]} ${q[1]}`).join(' L ');
  const fade = p < 0.3 ? 1 : clamp01(1 - (p - 0.3) / 0.7);
  const br = [] as React.ReactNode[];
  for (let b = 0; b < branches; b++) {
    const i0 = 2 + Math.floor(h01(seed + 7, b) * (n - 4));
    if (i0 > m) continue;
    const [bx, by] = pts[i0];
    const dir = h01(seed + 3, b) < 0.5 ? -1 : 1;
    br.push(<path key={b} d={`M ${bx} ${by} l ${dir * 50} 60 l ${dir * -16} 30 l ${dir * 46} 70`} stroke={SG.lemon} strokeWidth={width * 0.45} fill="none" strokeLinejoin="round" />);
  }
  return (
    <g opacity={fade}>
      <path d={d} stroke={SG.lemon} strokeWidth={width * 3} fill="none" strokeLinejoin="round" opacity={0.25} />
      <path d={d} stroke={SG.ink} strokeWidth={width + 6} fill="none" strokeLinejoin="round" />
      <path d={d} stroke={SG.lemon} strokeWidth={width} fill="none" strokeLinejoin="round" />
      <path d={d} stroke="#FFFFFF" strokeWidth={width * 0.35} fill="none" strokeLinejoin="round" />
      {br}
    </g>
  );
};

/** one strike token: a lemon hexagonal chip with a bolt glyph. dashed draws the outline only. fill 0..1 a partial (a sliver). */
export const StrikeToken: React.FC<{x: number; y: number; w?: number; dashed?: boolean; fill?: number; today?: boolean}> = ({x, y, w = 120, dashed = false, fill = 1, today = false}) => {
  const h = w * 0.34;
  const d = `M ${-w / 2} 0 L ${-w / 2 + h * 0.5} ${-h / 2} L ${w / 2 - h * 0.5} ${-h / 2} L ${w / 2} 0 L ${w / 2 - h * 0.5} ${h / 2} L ${-w / 2 + h * 0.5} ${h / 2} Z`;
  const id = uid('tk');
  if (dashed) {
    return <g transform={`translate(${x} ${y})`}><path d={d} fill={SG.lemon} fillOpacity={0.08} stroke={SG.lemon} strokeWidth={4} strokeDasharray="10 7" /></g>;
  }
  const fw = w * clamp01(fill);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><clipPath id={id}><rect x={-w / 2} y={-h} width={fw} height={h * 2} /></clipPath></defs>
      <path d={d} transform={`translate(0 ${h * 0.22})`} fill={SG.lemonD} stroke={SG.ink} strokeWidth={4} clipPath={`url(#${id})`} />
      <path d={d} fill={today ? SG.paper : SG.lemon} stroke={SG.ink} strokeWidth={4} clipPath={`url(#${id})`} />
      {fill > 0.6 && <path d={`M ${-6} ${-h * 0.32} L ${6} ${-2} L ${-2} ${-2} L ${6} ${h * 0.32}`} stroke={today ? SG.lemonD : SG.ink} strokeWidth={3.5} fill="none" strokeLinejoin="round" />}
      {fill < 0.99 && <path d={`M ${-w / 2 + fw} ${-h / 2} L ${-w / 2 + fw} ${h / 2}`} stroke={SG.ink} strokeWidth={3} />}
    </g>
  );
};

/**
 * StrikeStack: TODAY token at the bottom (paper, one unit), then `solid` lemon tokens (fractional
 * last one is a sliver), then dashed outlines up to `ceil` units in total. Units are multiples of
 * today's lightning: +116% is 2.16 units, +594% is 6.94. pop 0..1 drops the solid tokens in.
 */
export const StrikeStack: React.FC<{f: number; x: number; y: number; w?: number; today?: number; solid?: number; ceil?: number; pop?: number; tower?: number; wobble?: number}> =
({f, x, y, w = 120, today = 1, solid = 0, ceil = 0, pop = 1, tower = 1, wobble = 1}) => {
  const h = w * 0.34 + 6;
  const out = [] as React.ReactNode[];
  if (today > 0.01) out.push(<StrikeToken key="t" x={0} y={-h / 2} w={w} today fill={1} />);
  const solidN = Math.ceil(solid - 1e-6);
  for (let i = 0; i < solidN; i++) {
    const k = clamp01(pop * solidN - i);
    if (k <= 0) continue;
    const drop = (1 - k) * -260;
    const fr = i === solidN - 1 && solid % 1 > 1e-6 ? solid % 1 : 1;
    out.push(<StrikeToken key={`s${i}`} x={0} y={-h * (i + 1.5) + drop} w={w} fill={fr} />);
  }
  const ceilN = Math.max(0, Math.ceil(ceil - 1e-6) - 1);
  for (let i = solidN; i < ceilN; i++) {
    const k = clamp01(tower * (ceilN - solidN) - (i - solidN));
    if (k <= 0) continue;
    const sw = wobble * 6 * Math.sin(f / 13 + i * 0.7) * ((i - solidN + 1) / 6);
    out.push(<g key={`d${i}`} opacity={k} transform={`translate(${sw} 0)`}><StrikeToken x={0} y={-h * (i + 1.5)} w={w} dashed /></g>);
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <ContactShadow cx={0} cy={2} rx={w * 0.6} ry={9} opacity={0.4} />
      {out}
    </g>
  );
};

/** MapTile: one square of tundra map lifted out with an edge thickness and a grid of half-degree cells. */
export const MapTile: React.FC<{f: number; x: number; y: number; size?: number; rise?: number; cells?: number; marks?: number; seed?: number; children?: React.ReactNode}> =
({f, x, y, size = 300, rise = 0, cells = 4, marks = 0, seed = 3, children}) => {
  const r = clamp01(rise);
  const lift = r * 40;
  const rot = -3 * Math.sin(f / 31 + seed) * r;
  const cs = size / cells;
  const dots = [] as React.ReactNode[];
  const nM = Math.floor(clamp01(marks) * 14);
  for (let i = 0; i < nM; i++) {
    const mx = -size / 2 + 20 + h01(seed, i) * (size - 40), my = -size / 2 + 20 + h01(seed + 1, i) * (size - 40);
    dots.push(<path key={i} d={`M ${mx - 4} ${my - 9} L ${mx + 4} ${my - 1} L ${mx - 1} ${my - 1} L ${mx + 5} ${my + 9}`} stroke={SG.lemonD} strokeWidth={3.5} fill="none" />);
  }
  return (
    <g transform={`translate(${x} ${y - lift}) rotate(${rot})`}>
      {r > 0.02 && <ContactShadow cx={0} cy={size * 0.3 + lift} rx={size * 0.6} ry={size * 0.08} opacity={0.35 * r} />}
      <path d={`M ${-size / 2} ${-size * 0.3} L ${size / 2} ${-size * 0.3} L ${size / 2} ${size * 0.3} L ${-size / 2} ${size * 0.3} Z`} transform="translate(0 16)" fill={SG.peat} stroke={SG.ink} strokeWidth={5} />
      <path d={`M ${-size / 2} ${-size * 0.3} L ${size / 2} ${-size * 0.3} L ${size / 2} ${size * 0.3} L ${-size / 2} ${size * 0.3} Z`} fill={SG.sedge} stroke={SG.ink} strokeWidth={5} />
      {Array.from({length: 18}, (_, i) => <circle key={`n${i}`} cx={-size / 2 + 16 + h01(seed + 4, i) * (size - 32)} cy={-size * 0.3 + 12 + h01(seed + 6, i) * (size * 0.6 - 24)} r={5 + 5 * h01(seed, i)} fill={SG.sedgeL} opacity={0.7} />)}
      {Array.from({length: cells - 1}, (_, i) => <path key={`v${i}`} d={`M ${-size / 2 + cs * (i + 1)} ${-size * 0.3} L ${-size / 2 + cs * (i + 1)} ${size * 0.3}`} stroke={SG.ink} strokeWidth={1.6} opacity={0.5} />)}
      {Array.from({length: 2}, (_, i) => <path key={`h${i}`} d={`M ${-size / 2} ${-size * 0.3 + (size * 0.6 / 3) * (i + 1)} L ${size / 2} ${-size * 0.3 + (size * 0.6 / 3) * (i + 1)}`} stroke={SG.ink} strokeWidth={1.6} opacity={0.5} />)}
      {dots}
      {children}
    </g>
  );
};

/** SensDial: a brass half-dial 0..40 percent per degree. value drives the needle; band [lo,hi] shaded at bandK. */
export const SensDial: React.FC<{f: number; x: number; y: number; r?: number; value: number; band?: [number, number]; bandK?: number; jump?: number}> =
({f, x, y, r = 300, value, band = [8, 17], bandK = 0, jump = 0}) => {
  const tb = tones(SG.brass);
  const id = uid('sd');
  const ang = (v: number) => Math.PI + (Math.max(0, Math.min(40, v)) / 40) * Math.PI;
  const pt = (v: number, rr: number): [number, number] => [Math.cos(ang(v)) * rr, Math.sin(ang(v)) * rr];
  const ticks = [] as React.ReactNode[];
  for (let v = 0; v <= 40; v += 2) {
    const [ax, ay] = pt(v, r * 0.86), [bx, by] = pt(v, r * (v % 10 === 0 ? 0.72 : 0.79));
    ticks.push(<path key={v} d={`M ${ax} ${ay} L ${bx} ${by}`} stroke={SG.ink} strokeWidth={v % 10 === 0 ? 5 : 2.5} />);
    if (v % 10 === 0) {
      const [lx, ly] = pt(v, r * 0.6);
      ticks.push(<text key={`l${v}`} x={lx} y={ly + 9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={SG.ink}>{v}</text>);
    }
  }
  const bk = clamp01(bandK);
  const [b0x, b0y] = pt(band[0], r * 0.88), [b1x, b1y] = pt(band[1], r * 0.88), [c1x, c1y] = pt(band[1], r * 0.66), [c0x, c0y] = pt(band[0], r * 0.66);
  const [nx, ny] = pt(value, r * 0.8);
  const j = clamp01(jump);
  return (
    <g transform={`translate(${x} ${y - j * 14 * Math.exp(-0) })`}>
      <defs><FormGradient id={`${id}b`} t={tb} /></defs>
      <ContactShadow cx={0} cy={44} rx={r * 1.05} ry={16} opacity={0.4} />
      <rect x={-r - 30} y={0} width={2 * r + 60} height={44} rx={10} fill={`url(#${id}b)`} stroke={SG.ink} strokeWidth={6} />
      <path d={`M ${-r - 20} 0 A ${r + 20} ${r + 20} 0 0 1 ${r + 20} 0 Z`} fill={`url(#${id}b)`} stroke={SG.ink} strokeWidth={6} />
      <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 Z`} fill={SG.paper} stroke={SG.ink} strokeWidth={4} />
      {bk > 0.02 && <path d={`M ${b0x} ${b0y} A ${r * 0.88} ${r * 0.88} 0 0 1 ${b1x} ${b1y} L ${c1x} ${c1y} A ${r * 0.66} ${r * 0.66} 0 0 0 ${c0x} ${c0y} Z`} fill={SG.mauveL} opacity={0.75 * bk} stroke={SG.ink} strokeWidth={3} />}
      {ticks}
      <path d={`M 0 0 L ${nx} ${ny}`} stroke={SG.ink} strokeWidth={14} strokeLinecap="round" />
      <path d={`M 0 0 L ${nx} ${ny}`} stroke={SG.oxblood} strokeWidth={7} strokeLinecap="round" />
      <circle cx={0} cy={0} r={22} fill={tb.key} stroke={SG.ink} strokeWidth={5} />
      <text x={0} y={-r * 0.3} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={SG.ink}>% PER °C</text>
    </g>
  );
};

/** AverageRuler: a plain wooden ruler with a sleepy face. roll is its lazy travel along x already applied by the caller. */
export const AverageRuler: React.FC<{f: number; x: number; y: number; s?: number; emotion?: 'sleepy' | 'smug' | 'yawn'; cues?: number[]; seed?: number}> =
({f, x, y, s = 1, emotion = 'sleepy', cues, seed = 11}) => {
  const id = uid('ru');
  const bp = beatPose(f, seed, cues, 80);
  const tw = tones(SG.wood);
  const yawn = emotion === 'yawn';
  return (
    <g transform={`translate(${x} ${y - bp.dip * 4}) scale(${s}) rotate(${bp.skew * 0.3})`}>
      <defs><FormGradient id={`${id}w`} t={tw} /></defs>
      <ContactShadow cx={0} cy={22} rx={250} ry={14} opacity={0.4} />
      <rect x={-240} y={-30} width={480} height={52} rx={6} fill={`url(#${id}w)`} stroke={SG.ink} strokeWidth={5} />
      {Array.from({length: 25}, (_, i) => <path key={i} d={`M ${-228 + i * 19} -30 L ${-228 + i * 19} ${i % 5 === 0 ? -8 : -18}`} stroke={SG.ink} strokeWidth={2.5} />)}
      <path d="M -236 14 L 236 14" stroke={SG.woodL} strokeWidth={3} opacity={0.8} />
      <g transform="translate(150 0)">
        <path d={`M -30 -2 q 10 ${emotion === 'smug' ? -4 : 5} 20 0`} stroke={SG.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d={`M 10 -2 q 10 ${emotion === 'smug' ? -4 : 5} 20 0`} stroke={SG.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
        {yawn ? <ellipse cx={0} cy={12} rx={9} ry={7} fill={SG.plumL} stroke={SG.ink} strokeWidth={3} /> : <path d={`M -10 12 q 10 ${emotion === 'smug' ? 8 : 3} 20 0`} stroke={SG.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" />}
      </g>
      <text x={-60} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={SG.ink}>AVERAGE</text>
      {emotion !== 'smug' && <text x={210} y={-44 - 6 * Math.sin(f / 10)} fontFamily={MONO} fontWeight={800} fontSize={20} fill={SG.paper} opacity={0.8}>z</text>}
    </g>
  );
};

/** ModelRacer: a faceless generic machine-learning model runner (a stack of three boxes on legs), unlabelled. run 0..1 gait phase speed; stall slumps it. */
export const ModelRacer: React.FC<{f: number; x: number; y: number; s?: number; run?: number; stall?: number; seed?: number; tint?: string}> = ({f, x, y, s = 1, run = 1, stall = 0, seed = 1, tint = SG.mauveL}) => {
  const ph = f * 0.45 * run + seed;
  const st = clamp01(stall);
  const tt = tones(tint);
  const leg = (o: number) => 26 * Math.sin(ph + o) * (1 - st);
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${st * 12})`}>
      <ContactShadow cx={0} cy={2} rx={46} ry={8} opacity={0.4} />
      <path d={`M -12 -60 L ${-12 + leg(0)} 0 M 12 -60 L ${12 + leg(Math.PI)} 0`} stroke={SG.ink} strokeWidth={8} strokeLinecap="round" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={-34 + i * 3} y={-60 - (i + 1) * 40 + st * i * 8} width={68 - i * 6} height={38} rx={6} fill={i === 1 ? tt.key : tt.base} stroke={SG.ink} strokeWidth={4} />
      ))}
      {[0, 1, 2].map((i) => <circle key={`d${i}`} cx={-14 + i * 14} cy={-120} r={4} fill={SG.ink} opacity={0.6} />)}
      {st > 0.3 && <path d="M 30 -190 q 6 -12 0 -22" stroke={SG.glassL} strokeWidth={4} fill="none" opacity={st} />}
    </g>
  );
};
