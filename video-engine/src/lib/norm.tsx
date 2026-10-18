import React from 'react';
import {Easing, interpolate} from 'remotion';
import {ContactShadow, FormGradient, INK, tones, paleTones} from './lighting';

// THE NORM KIT, 2026-10-18 ("What Norm Learns"). One idea drawn as one object: a mint jelly dome with a face that remembers the shape
// of whatever is pressed into it (a dent), and glows alarm red where the real thing no longer fits. Around him the small cast that
// tells the week: a ski boot, a phone app, a ski slope, a home floor plan with sensors and a button, a compressor and its dashed
// digital twin, a pipeline, a clipboard, proof cards and the 2019 desk mold. Everything is an SVG in the 1080 x 1920 frame at a
// caller-set x, y and scale, every animated value is passed in, and the only strings painted are the ones the caller hands in.
export const NM = {
  mint: '#5FD6B8', mintDeep: '#1E8C7A', mintHi: '#C8FFF0', mintPale: '#CFEFE4', alarm: '#FF4D2E', alarmDeep: '#B3260F', alarmHi: '#FFB09F',
  indigo: '#2B2A5C', violet: '#7A5AA0', rose: '#E58AA0', roseDeep: '#A8506A', lilac: '#8E8AB8', lilacHi: '#C9C5E6', paperSnow: '#F2E6D2', snowShade: '#B9B0D2',
  felt: '#D9A441', feltDeep: '#9A6E22', feltHi: '#F2CE80', plum: '#3A2A44', plumHi: '#5A4264', amber: '#F6B65A', amberHi: '#FFE2A8',
  steel: '#5B6B7E', steelDeep: '#34404F', steelHi: '#9FB0C2', brass: '#C99A3C', brassHi: '#F0D28A', brassDeep: '#7D5E1C',
  navy: '#14213D', cream: '#F4EEDC', creamShade: '#D9CFB3', paper: '#FFFDF4', lamp: '#FFF4DC',
};
export const MONO = "'JetBrains Mono', monospace";
export const SERIF = 'Fraunces, Georgia, serif';
export const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
export const eo = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const hash = (i: number) => {
  let x = (Math.floor(i) + 1018) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
export const rnd = (i: number) => (hash(i) % 10000) / 10000;

const Grad: React.FC<{id: string; base: string; pale?: boolean; softness?: number}> = ({id, base, pale, softness = 0.7}) => (
  <FormGradient id={id} t={pale ? paleTones(base) : tones(base)} softness={softness} />
);

// ---- the hero ----------------------------------------------------------------------------------------------------------------------
export type NormEmotion = 'blank' | 'grin' | 'alarm' | 'proud' | 'worried' | 'sweat' | 'ask' | 'calm' | 'wobbly';
export type NormDent = 'none' | 'boot' | 'turn' | 'ring' | 'heart';
const BOOT_D = 'M -50 -122 L 30 -122 L 36 -52 Q 100 -42 114 -8 L 114 22 L -64 22 L -64 -50 Z';
const DOME = 'M -180 0 C -188 -150 -110 -300 0 -304 C 110 -300 188 -150 180 0 Q 0 24 -180 0 Z';

/**
 * Norm: a soft mint jelly dome with a face. Origin is the bottom centre of the base. sq (0..1) flattens him on an impact, wob scales
 * the continuous jelly wobble (0 = set firm), dent picks the imprint on his belly and dentK (0..1) is how deep it has pressed in,
 * red (0..1) lights the part of the dent that no longer fits in alarm red at redAt ('toe' | 'side' | 'dip'), unset (0..1) paints the
 * pale unset patch on his flank, look turns the eyes, setK (0..1) firms and deepens him, tint recolours the jelly for the mold.
 */
export const Norm: React.FC<{
  x: number; y: number; f: number; scale?: number; emotion?: NormEmotion; sq?: number; wob?: number; dent?: NormDent; dentK?: number;
  red?: number; redAt?: 'toe' | 'side' | 'dip'; unset?: number; look?: number; setK?: number; id?: string; shadow?: boolean; flip?: boolean; heartK?: number;
}> = ({x, y, f, scale = 1, emotion = 'calm', sq = 0, wob = 1, dent = 'none', dentK = 0, red = 0, redAt = 'toe', unset = 0, look = 0, setK = 0, id = 'nm', shadow = true, flip = false, heartK = 1}) => {
  const ph = x * 0.013;
  const w = Math.sin(f / 4.6 + ph) * 0.016 * wob * (1 - setK * 0.85);
  const w2 = Math.sin(f / 7.3 + ph + 1) * 0.011 * wob * (1 - setK * 0.85);
  const sx = 1 + 0.18 * sq + w, sy = 1 - 0.24 * sq - w2;
  const skew = 2.2 * Math.sin(f / 9 + ph) * wob * (1 - setK * 0.8);
  const blink = Math.sin(f / 41 + ph) > 0.968 ? 0.12 : 1;
  const base = setK > 0 ? '#3FBFA0' : NM.mint;
  const pupilX = look * 12;
  const pupilY = emotion === 'worried' || emotion === 'sweat' ? 6 : emotion === 'ask' ? -4 : 0;
  const browUp = emotion === 'alarm' ? -26 : emotion === 'ask' ? -14 : emotion === 'proud' ? -6 : emotion === 'worried' || emotion === 'sweat' ? 8 : 0;
  const browTilt = emotion === 'alarm' ? -10 : emotion === 'worried' || emotion === 'sweat' ? 14 : emotion === 'proud' ? -6 : 0;
  const mouth = (() => {
    switch (emotion) {
      case 'grin': return 'M -44 -146 Q 0 -100 44 -146';
      case 'proud': return 'M -34 -142 Q 0 -112 34 -142';
      case 'alarm': return 'M -26 -126 Q 0 -160 26 -126 Q 0 -138 -26 -126';
      case 'worried': return 'M -32 -122 Q -16 -140 0 -126 Q 16 -112 32 -128';
      case 'sweat': return 'M -30 -122 Q 0 -146 30 -122';
      case 'ask': return 'M -20 -132 Q 0 -140 22 -128';
      case 'wobbly': return 'M -32 -128 Q -16 -144 0 -128 Q 16 -112 32 -128';
      case 'blank': return 'M -22 -130 L 22 -130';
      default: return 'M -34 -134 Q 0 -114 34 -134';
    }
  })();
  const dk = clamp01(dentK);
  const dentShape = (() => {
    switch (dent) {
      case 'boot': return <path d={BOOT_D} transform="translate(-6 -22) scale(1.18)" />;
      case 'turn': return <path d="M -96 -250 C -20 -206 64 -172 -6 -122 C -78 -72 -36 -30 52 -6" fill="none" strokeWidth={34} strokeLinecap="round" />;
      case 'ring': return <ellipse cx={0} cy={-104} rx={124} ry={66} fill="none" strokeWidth={24} strokeDasharray="30 14" strokeDashoffset={-f * 0.6} />;
      case 'heart': return <path d="M -150 -100 L -84 -100 L -58 -164 L -22 -52 L 12 -150 L 34 -100 L 150 -100" fill="none" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(heartK)} />;
      default: return null;
    }
  })();
  const redSpot = redAt === 'toe' ? {cx: 104, cy: -20, r: 56} : redAt === 'side' ? {cx: 122, cy: -102, r: 58} : {cx: -30, cy: -120, r: 52};
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * scale} ${scale})`}>
      <defs>
        <Grad id={`${id}-j`} base={base} softness={0.9} />
        <clipPath id={`${id}-c`}><path d={DOME} /></clipPath>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={NM.alarm} stopOpacity="0.95" /><stop offset="0.6" stopColor={NM.alarm} stopOpacity="0.45" /><stop offset="1" stopColor={NM.alarm} stopOpacity="0" /></radialGradient>
      </defs>
      {shadow && <ContactShadow cx={0} cy={10} rx={220} ry={26} opacity={0.42} />}
      <g transform={`scale(${sx} ${sy}) skewX(${skew})`}>
        <path d={DOME} fill={`url(#${id}-j)`} stroke="none" />
        <g clipPath={`url(#${id}-c)`}>
          {/* jelly depth: a translucent inner core, drifting bubbles and a bright upper-left sheen */}
          <ellipse cx={20} cy={-120} rx={118} ry={104} fill={NM.mintHi} opacity={0.18} />
          {Array.from({length: 5}, (_, i) => {
            const t = ((f * (0.35 + rnd(i) * 0.5) + i * 61) % 240) / 240;
            return <circle key={i} cx={-100 + rnd(i + 3) * 200 + 6 * Math.sin(f / 20 + i)} cy={-10 - t * 250} r={4 + rnd(i + 8) * 7} fill="#FFFFFF" opacity={0.3 * (1 - t)} />;
          })}
          {/* the dent: a pressed-in hollow, shaded inside with a lit lower lip */}
          {dent !== 'none' && dk > 0 && (
            <g opacity={clamp01(dk * 1.3)} transform={`translate(0 ${(1 - dk) * 6}) scale(${lerp(1.08, 1, dk)})`}>
              <g fill={NM.mintDeep} stroke={NM.mintDeep} opacity={0.62}>{dentShape}</g>
              <g fill="none" stroke={NM.mintHi} strokeWidth={5} opacity={0.65} transform="translate(5 6)">
                {dent === 'boot' ? <path d={BOOT_D} transform="translate(-6 -22) scale(1.18)" fill="none" /> : null}
              </g>
              <g fill={NM.mintDeep} stroke={NM.mintDeep} opacity={0.35} transform="translate(-4 -4)">{dentShape}</g>
            </g>
          )}
          {/* the red: only where the real thing does not match the shape Norm remembered */}
          {red > 0 && (
            <g opacity={clamp01(red)} style={{mixBlendMode: 'normal'}}>
              <circle cx={redSpot.cx} cy={redSpot.cy} r={redSpot.r * (1.1 + 0.12 * Math.sin(f / 3.2))} fill={`url(#${id}-glow)`} />
            </g>
          )}
          {/* the pale unset patch on his flank: where the proof would go */}
          {unset > 0 && (
            <g opacity={clamp01(unset)}>
              <ellipse cx={-120} cy={-86} rx={50} ry={62} fill={NM.mintPale} opacity={0.95} />
              <ellipse cx={-120} cy={-86} rx={50} ry={62} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="10 8" strokeDashoffset={-f * 0.5} opacity={0.7} />
            </g>
          )}
          <path d="M -140 -60 C -150 -180 -90 -262 -20 -276" fill="none" stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" opacity={0.5} />
          <path d="M -120 -40 C -130 -70 -128 -100 -122 -120" fill="none" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" opacity={0.4} />
          <rect x={-190} y={-34} width={380} height={44} fill={NM.mintDeep} opacity={0.35} />
        </g>
        <path d={DOME} fill="none" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        {/* face */}
        <g transform={`translate(0 ${emotion === 'blank' ? 6 : 0})`}>
          {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${s * 54} -204)`}>
              <ellipse cx={0} cy={0} rx={35} ry={40 * blink} fill="#FFFFFF" stroke={INK} strokeWidth={5.5} />
              {blink > 0.5 && <>
                <circle cx={pupilX} cy={pupilY} r={15} fill={INK} />
                <circle cx={pupilX + 5} cy={pupilY - 6} r={5} fill="#FFFFFF" />
              </>}
              <path d="M -30 -50 L 30 -50" stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`translate(0 ${browUp}) rotate(${s * browTilt} 0 -50)`} />
            </g>
          ))}
          <path d={mouth} fill={emotion === 'alarm' ? INK : 'none'} stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          {emotion === 'sweat' && <path d={`M 96 ${-200 + ((f / 3) % 70)} q 9 16 0 24 q -9 -8 0 -24 Z`} fill="#E9F6FA" stroke={INK} strokeWidth={3} />}
        </g>
      </g>
    </g>
  );
};

// ---- props that press into him ---------------------------------------------------------------------------------------------------
/** A ski boot, side view, hard angular plastic: shaft with a cuff, two buckles, a toe box and a lugged sole. redK lights the toe. */
export const SkiBoot: React.FC<{x: number; y: number; f: number; scale?: number; rot?: number; redK?: number; id?: string; shadow?: boolean}> = ({x, y, f, scale = 1, rot = 0, redK = 0, id = 'sb', shadow = false}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <defs>
      <Grad id={`${id}-sh`} base={NM.steel} />
      <Grad id={`${id}-to`} base={NM.rose} />
    </defs>
    {shadow && <ContactShadow cx={20} cy={26} rx={150} ry={16} opacity={0.35} />}
    <path d={BOOT_D} fill={`url(#${id}-sh)`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M 36 -52 Q 100 -42 114 -8 L 114 22 L 30 22 Z" fill={`url(#${id}-to)`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <rect x={-56} y={-132} width={92} height={24} rx={6} fill={NM.cream} stroke={INK} strokeWidth={6} />
    {[-92, -62].map((yy) => <g key={yy}><rect x={-44} y={yy + 10} width={80} height={10} rx={3} fill={NM.brass} stroke={INK} strokeWidth={4} /><rect x={24} y={yy + 6} width={18} height={18} rx={3} fill={NM.brassHi} stroke={INK} strokeWidth={4} /></g>)}
    <rect x={-70} y={22} width={192} height={20} rx={5} fill={NM.navy} stroke={INK} strokeWidth={6} />
    {Array.from({length: 7}, (_, i) => <rect key={i} x={-58 + i * 28} y={26} width={12} height={12} fill={NM.steelDeep} />)}
    <path d="M -52 -118 L 28 -118" stroke="#FFFFFF" strokeWidth={5} opacity={0.4} />
    {redK > 0 && <circle cx={104} cy={6} r={44 + 6 * Math.sin(f / 3)} fill={NM.alarm} opacity={0.5 * clamp01(redK)} />}
  </g>
);

/** A phone with the FlowLine screen: a clip of a skier on a slope, three grade bars and a drill arrow chip. grade is how many bars lit (0..3). */
export const PhoneApp: React.FC<{x: number; y: number; f: number; scale?: number; rot?: number; grade?: number; drill?: number; play?: number; title?: string; id?: string; buzz?: number}> = ({x, y, f, scale = 1, rot = 0, grade = 0, drill = 0, play = 1, title = 'FLOWLINE', id = 'ph', buzz = 0}) => {
  const jig = buzz > 0 ? 5 * Math.sin(f * 1.7) * buzz : 0;
  const t = (f / 60) % 1;
  return (
    <g transform={`translate(${x + jig} ${y}) rotate(${rot}) scale(${scale})`}>
      <defs><Grad id={`${id}-b`} base={NM.navy} /></defs>
      <ContactShadow cx={0} cy={236} rx={150} ry={16} opacity={0.3} />
      <rect x={-130} y={-230} width={260} height={470} rx={36} fill={`url(#${id}-b)`} stroke={INK} strokeWidth={9} />
      <rect x={-112} y={-206} width={224} height={420} rx={22} fill={NM.paper} stroke={INK} strokeWidth={4} />
      <rect x={-112} y={-206} width={224} height={44} rx={22} fill={NM.indigo} />
      <rect x={-112} y={-176} width={224} height={14} fill={NM.indigo} />
      <text x={0} y={-176} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={2} fill={NM.cream}>{title}</text>
      {/* the clip */}
      <g>
        <rect x={-100} y={-150} width={200} height={170} rx={10} fill="#8FA3D6" stroke={INK} strokeWidth={4} />
        <path d="M -100 -40 L 100 -110 L 100 20 L -100 20 Z" fill={NM.paperSnow} stroke={INK} strokeWidth={3} />
        <path d="M -90 -34 C -40 -50 -10 -30 20 -60 S 70 -80 94 -96" fill="none" stroke={NM.lilac} strokeWidth={5} strokeDasharray="8 7" />
        <g transform={`translate(${lerp(-70, 70, t)} ${lerp(-44, -88, t) + 4 * Math.sin(f / 5)}) rotate(${-18 + 6 * Math.sin(f / 7)})`}>
          <ellipse cx={0} cy={-14} rx={11} ry={15} fill={NM.rose} stroke={INK} strokeWidth={3} />
          <circle cx={0} cy={-34} r={8} fill={NM.cream} stroke={INK} strokeWidth={3} />
          <rect x={-18} y={0} width={36} height={5} rx={2} fill={NM.navy} />
        </g>
        {play > 0 && <circle cx={72} cy={-126} r={9} fill={NM.alarm} opacity={0.85} />}
      </g>
      {/* three grade bars */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${-88 + i * 64} 48)`}>
          <rect x={0} y={0} width={52} height={20} rx={6} fill={NM.creamShade} stroke={INK} strokeWidth={3} />
          <rect x={0} y={0} width={52 * clamp01(grade - i)} height={20} rx={6} fill={NM.mintDeep} stroke={INK} strokeWidth={3} opacity={clamp01(grade - i) > 0 ? 1 : 0} />
        </g>
      ))}
      {/* drill chip with an arrow */}
      <g opacity={clamp01(drill)} transform={`translate(0 ${(1 - clamp01(drill)) * 14})`}>
        <rect x={-100} y={88} width={200} height={86} rx={12} fill={NM.cream} stroke={INK} strokeWidth={4} />
        <path d="M -70 140 C -40 100 10 160 56 112" fill="none" stroke={NM.indigo} strokeWidth={9} strokeLinecap="round" />
        <path d="M 40 100 L 66 108 L 54 134" fill="none" stroke={NM.indigo} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

/** A small skier in a puffy suit seen from the side on skis, leaning into a turn. lean -1..1. */
export const Skier: React.FC<{x: number; y: number; f: number; scale?: number; lean?: number; id?: string}> = ({x, y, f, scale = 1, lean = 0, id = 'sk'}) => (
  <g transform={`translate(${x} ${y}) rotate(${lean * 18}) scale(${scale})`}>
    <defs><Grad id={`${id}-s`} base={NM.rose} /></defs>
    <rect x={-70} y={-6} width={140} height={11} rx={5} fill={NM.navy} stroke={INK} strokeWidth={4} transform="rotate(-4)" />
    <path d="M -22 -8 L -30 -70 L 8 -70 L 22 -8 Z" fill={NM.indigo} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d={`M -40 -70 Q -52 -150 -10 -168 Q 34 -160 38 -70 Z`} fill={`url(#${id}-s)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -30 -122 L 26 -122" stroke={INK} strokeWidth={4} opacity={0.5} />
    <circle cx={0} cy={-190} r={24} fill={NM.cream} stroke={INK} strokeWidth={5} />
    <path d="M -24 -192 Q 0 -222 24 -192 L 24 -184 L -24 -184 Z" fill={NM.navy} stroke={INK} strokeWidth={4} />
    <rect x={2} y={-196} width={24} height={12} rx={5} fill="#8FA3D6" stroke={INK} strokeWidth={3} />
    <path d="M 28 -120 L 76 -92" stroke={INK} strokeWidth={9} strokeLinecap="round" />
    <path d="M 76 -92 L 96 -6" stroke={NM.steelDeep} strokeWidth={5} strokeLinecap="round" />
  </g>
);

// ---- worlds ------------------------------------------------------------------------------------------------------------------------
/** The mustard felt workbench under a lamp pool: where Norm is pressed. floor is the table-edge y. */
export const Workbench: React.FC<{f: number; floor?: number; id?: string; lamp?: number}> = ({f, floor = 1250, id = 'wb', lamp = 1}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={NM.plum} /><stop offset="1" stopColor="#5A4264" /></linearGradient>
      <linearGradient id={`${id}-felt`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={NM.feltHi} /><stop offset="1" stopColor={NM.felt} /></linearGradient>
      <radialGradient id={`${id}-pool`} cx="0.5" cy="0.4" r="0.6"><stop offset="0" stopColor={NM.lamp} stopOpacity="0.75" /><stop offset="1" stopColor={NM.lamp} stopOpacity="0" /></radialGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={floor + 40} fill={`url(#${id}-wall)`} />
    {Array.from({length: 9}, (_, i) => <rect key={i} data-band="ok" x={-40} y={110 + i * 130} width={1160} height={4} fill="#000" opacity={0.12} />)}
    {/* pegboard of outlines: the shapes that have been pressed before */}
    {[0, 1, 2, 3].map((i) => (
      <g key={i} data-band="ok" transform={`translate(${130 + i * 250} ${300 + (i % 2) * 70}) rotate(${(i - 1.5) * 4})`} opacity={0.5}>
        <rect x={-70} y={-60} width={140} height={120} rx={8} fill="none" stroke={NM.lilacHi} strokeWidth={4} strokeDasharray="12 9" />
        {i === 0 && <path d={BOOT_D} transform="scale(0.5)" fill="none" stroke={NM.lilacHi} strokeWidth={5} />}
        {i === 1 && <path d="M -46 -30 C -10 -50 10 -10 46 -30" fill="none" stroke={NM.lilacHi} strokeWidth={6} strokeLinecap="round" />}
        {i === 2 && <ellipse cx={0} cy={0} rx={44} ry={26} fill="none" stroke={NM.lilacHi} strokeWidth={6} />}
        {i === 3 && <path d="M -46 0 L -20 0 L -8 -30 L 10 24 L 22 0 L 46 0" fill="none" stroke={NM.lilacHi} strokeWidth={6} strokeLinejoin="round" />}
      </g>
    ))}
    <ellipse data-band="ok" cx={540} cy={floor - 120} rx={620} ry={560} fill={`url(#${id}-pool)`} opacity={lamp} />
    <rect data-band="ok" x={-40} y={floor} width={1160} height={760} fill={`url(#${id}-felt)`} />
    <rect data-band="ok" x={-40} y={floor - 12} width={1160} height={26} fill={NM.feltDeep} stroke={INK} strokeWidth={5} />
    {Array.from({length: 9}, (_, i) => <line key={i} data-band="ok" x1={540 + (i - 4) * 80} y1={floor + 14} x2={540 + (i - 4) * 240} y2={1960} stroke={NM.feltDeep} strokeWidth={2.5} opacity={0.5} />)}
    {Array.from({length: 18}, (_, i) => <circle key={i} data-band="ok" cx={((i * 197 + f * (0.3 + (i % 3) * 0.2)) % 1200) - 60} cy={160 + ((i * 131) % 900)} r={2 + (i % 3)} fill={NM.lamp} opacity={0.22} />)}
  </g>
);

/** The blue-hour ski slope: indigo sky, rose alpenglow ridge, lilac snow, a drift fence in the near plane. */
export const SlopeBG: React.FC<{f: number; ground?: number; id?: string}> = ({f, ground = 1180, id = 'sl'}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={NM.indigo} /><stop offset="0.55" stopColor={NM.violet} /><stop offset="1" stopColor={NM.rose} /></linearGradient>
      <linearGradient id={`${id}-sn`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={NM.paperSnow} /><stop offset="1" stopColor={NM.snowShade} /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={ground + 60} fill={`url(#${id}-sky)`} />
    {Array.from({length: 26}, (_, i) => <circle key={i} data-band="ok" cx={rnd(i + 4) * 1080} cy={40 + rnd(i + 17) * 640} r={1.6 + rnd(i) * 2} fill="#FFFFFF" opacity={0.25 + 0.5 * rnd(i + 9) * (0.6 + 0.4 * Math.sin(f / 20 + i))} />)}
    <path data-band="ok" d={`M -40 ${ground - 200} L 140 ${ground - 330} L 320 ${ground - 230} L 560 ${ground - 400} L 800 ${ground - 250} L 980 ${ground - 340} L 1120 ${ground - 220} L 1120 ${ground} L -40 ${ground} Z`} fill="#5B4A86" transform={`translate(${8 * Math.sin(f / 90)} 0)`} />
    <path data-band="ok" d={`M 560 ${ground - 400} L 640 ${ground - 330} L 590 ${ground - 320} L 520 ${ground - 340} Z`} fill={NM.rose} opacity={0.8} transform={`translate(${8 * Math.sin(f / 90)} 0)`} />
    <path data-band="ok" d={`M -40 ${ground - 90} L 200 ${ground - 150} L 480 ${ground - 80} L 720 ${ground - 140} L 1120 ${ground - 70} L 1120 ${ground} L -40 ${ground} Z`} fill="#8A78B8" transform={`translate(${16 * Math.sin(f / 70 + 1)} 0)`} />
    {Array.from({length: 14}, (_, i) => <path key={i} data-band="ok" d={`M ${i * 86 - 20} ${ground - 20} l 14 -70 l 14 70 Z`} fill="#2E2A5E" stroke={INK} strokeWidth={3} transform={`translate(${16 * Math.sin(f / 70 + 1)} 0)`} />)}
    <path data-band="ok" d={`M -40 ${ground - 40} Q 300 ${ground - 120} 700 ${ground - 20} T 1120 ${ground - 60} L 1120 1960 L -40 1960 Z`} fill={`url(#${id}-sn)`} />
    <path data-band="ok" d={`M -40 ${ground + 160} Q 400 ${ground + 80} 1120 ${ground + 220}`} fill="none" stroke={NM.snowShade} strokeWidth={26} strokeLinecap="round" opacity={0.7} />
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i} data-band="ok" transform={`translate(${60 + i * 240 + 24 * Math.sin(f / 75 + i)} 1600)`}>
        <rect x={0} y={0} width={14} height={140} fill={NM.felt} stroke={INK} strokeWidth={5} />
        <rect x={14} y={14} width={200} height={20} fill={NM.feltDeep} stroke={INK} strokeWidth={4} />
        <rect x={14} y={60} width={200} height={20} fill={NM.feltDeep} stroke={INK} strokeWidth={4} />
      </g>
    ))}
  </g>
);

/** A plum night room with an amber window: the home. */
export const NightRoom: React.FC<{f: number; id?: string; floor?: number}> = ({f, id = 'nr', floor = 1240}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A1E34" /><stop offset="1" stopColor={NM.plumHi} /></linearGradient>
      <linearGradient id={`${id}-win`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={NM.amberHi} stopOpacity="0.6" /><stop offset="1" stopColor={NM.amber} stopOpacity="0" /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={floor + 40} fill={`url(#${id}-w)`} />
    <rect data-band="ok" x={-40} y={floor} width={1160} height={760} fill="#4B3656" />
    <rect data-band="ok" x={-40} y={floor - 12} width={1160} height={24} fill="#2A1E34" stroke={INK} strokeWidth={4} />
    <rect data-band="ok" x={620} y={300} width={300} height={380} rx={8} fill={NM.amber} stroke={INK} strokeWidth={8} />
    <path data-band="ok" d="M 770 300 L 770 680 M 620 490 L 920 490" stroke={INK} strokeWidth={8} />
    <path data-band="ok" d="M 620 680 L 300 1240 L 940 1240 L 920 680 Z" fill={`url(#${id}-win)`} opacity={0.6} />
    {Array.from({length: 10}, (_, i) => <circle key={i} data-band="ok" cx={640 + rnd(i + 5) * 260} cy={320 + ((rnd(i) * 360 + f * 0.4) % 340)} r={2 + (i % 3)} fill="#FFFFFF" opacity={0.5} />)}
    <rect data-band="ok" x={-40} y={floor + 250} width={1160} height={8} fill="#2A1E34" opacity={0.5} />
    <path data-band="ok" d="M 80 1860 C 300 1790 520 1900 780 1830 S 1000 1800 1100 1850" fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" />
    <path data-band="ok" d="M 80 1860 C 300 1790 520 1900 780 1830 S 1000 1800 1100 1850" fill="none" stroke={NM.steelHi} strokeWidth={8} strokeLinecap="round" />
  </g>
);

/** The paper test set: plain cream with a hard overhead lamp and a faint ruled grid. Deliberately empty so the clipboard carries it. */
export const PaperSet: React.FC<{f: number; id?: string; floor?: number}> = ({f, id = 'ps', floor = 1250}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9DDC4" /><stop offset="1" stopColor={NM.cream} /></linearGradient>
      <radialGradient id={`${id}-p`} cx="0.5" cy="0.35" r="0.55"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.8" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={floor + 40} fill={`url(#${id}-w)`} />
    {Array.from({length: 22}, (_, i) => <line key={i} data-band="ok" x1={i * 56 - 20} y1={-40} x2={i * 56 - 20} y2={floor} stroke={NM.creamShade} strokeWidth={2} opacity={0.6} />)}
    {Array.from({length: 24}, (_, i) => <line key={i} data-band="ok" x1={-40} y1={i * 56 - 10} x2={1120} y2={i * 56 - 10} stroke={NM.creamShade} strokeWidth={2} opacity={0.6} />)}
    <ellipse data-band="ok" cx={540} cy={floor - 260} rx={560} ry={520} fill={`url(#${id}-p)`} />
    <rect data-band="ok" x={-40} y={floor} width={1160} height={760} fill={NM.felt} />
    <rect data-band="ok" x={-40} y={floor - 12} width={1160} height={24} fill={NM.feltDeep} stroke={INK} strokeWidth={5} />
    {Array.from({length: 8}, (_, i) => <circle key={i} data-band="ok" cx={((i * 211 + f * 0.35) % 1200) - 60} cy={200 + ((i * 177) % 800)} r={2.5} fill="#FFFFFF" opacity={0.5} />)}
  </g>
);

// ---- the home floor plan (ANCHOR) --------------------------------------------------------------------------------------------------
/**
 * A top-down plan of a small home: walls, a doorway, sensor pucks that pulse, one big brass button on a table, Norm's learned band
 * (mint) around the usual path, and a day-trace that follows it. dev (0..1) makes today's trace drift off the band and across the
 * threshold line in alarm red. Origin is the plan centre. Nothing in the plan names a routine.
 */
export const FloorPlan: React.FC<{x: number; y: number; f: number; scale?: number; sensors?: number; button?: number; band?: number; trace?: number; dev?: number; id?: string; press?: number}> = ({x, y, f, scale = 1, sensors = 1, button = 1, band = 0, trace = 0, dev = 0, id = 'fp', press = 0}) => {
  const usual = 'M -250 150 L -250 40 L -110 40 L -110 -110 L 80 -110 L 80 -10 L 230 -10 L 230 140';
  const today = 'M -250 150 L -250 40 L -110 40 L -110 -110 L 80 -110 L 80 -10 L 40 40 L 40 190';
  const pucks = [[-250, 150], [-110, 40], [80, -110], [230, 140]];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={270} rx={400} ry={26} opacity={0.35} />
      <rect x={-330} y={-200} width={660} height={460} rx={14} fill="#6B4F78" stroke={INK} strokeWidth={12} />
      <rect x={-316} y={-186} width={632} height={432} rx={8} fill="#8A6B96" stroke={INK} strokeWidth={4} />
      {/* rooms */}
      <path d="M -316 -20 L -60 -20 L -60 -186 M 150 -186 L 150 90 L 316 90 M -60 -20 L -60 246" fill="none" stroke={INK} strokeWidth={10} />
      <rect x={-72} y={104} width={26} height={74} fill="#8A6B96" />
      <rect x={138} y={0} width={26} height={74} fill="#8A6B96" />
      {/* wood plank hints */}
      {Array.from({length: 6}, (_, i) => <line key={i} x1={-312} y1={-150 + i * 80} x2={312} y2={-150 + i * 80} stroke="#000" strokeWidth={2} opacity={0.12} />)}
      {/* the learned band: Norm's remembered normal */}
      <path d={usual} fill="none" stroke={NM.mint} strokeWidth={86} strokeLinecap="round" strokeLinejoin="round" opacity={0.38 * clamp01(band)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(band)} />
      <path d={usual} fill="none" stroke={NM.mintHi} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 10" opacity={clamp01(band)} />
      {/* the threshold line */}
      <path d={usual} fill="none" stroke={NM.cream} strokeWidth={96} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 11" pathLength={1000} opacity={0.0} />
      {band > 0 && <path d="M 24 20 L 120 20 L 120 -60 M 24 20 L 24 150" fill="none" stroke={NM.cream} strokeWidth={5} strokeDasharray="12 9" strokeDashoffset={-f * 0.5} opacity={clamp01(band)} />}
      {/* today's trace */}
      <path d={dev > 0 ? today : usual} fill="none" stroke={NM.navy} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(trace)} />
      {dev > 0 && <path d="M 80 -10 L 40 40 L 40 190" fill="none" stroke={NM.alarm} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(dev)} />}
      {/* sensors */}
      {pucks.map(([px, py], i) => (
        <g key={i} transform={`translate(${px} ${py})`} opacity={clamp01(sensors * 2 - i * 0.3)}>
          {[0, 1].map((k) => {
            const t = ((f / 40 + k * 0.5 + i * 0.2) % 1);
            return <circle key={k} cx={0} cy={0} r={14 + t * 44} fill="none" stroke={NM.amberHi} strokeWidth={4} opacity={0.7 * (1 - t) * clamp01(sensors)} />;
          })}
          <circle cx={0} cy={0} r={15} fill={NM.cream} stroke={INK} strokeWidth={6} />
          <circle cx={0} cy={0} r={6} fill={NM.brass} />
        </g>
      ))}
      {/* the one big button on its little table */}
      <g transform="translate(-196 -112)" opacity={clamp01(button)}>
        <ContactShadow cx={0} cy={36} rx={64} ry={10} opacity={0.4} />
        <rect x={-54} y={-4} width={108} height={46} rx={10} fill={NM.feltDeep} stroke={INK} strokeWidth={6} />
        <ellipse cx={0} cy={-6 + press * 6} rx={44} ry={26} fill={NM.brassDeep} stroke={INK} strokeWidth={6} />
        <ellipse cx={0} cy={-18 + press * 8} rx={40} ry={24} fill={NM.brass} stroke={INK} strokeWidth={6} />
        <ellipse cx={-10} cy={-26 + press * 8} rx={16} ry={7} fill={NM.brassHi} opacity={0.8} />
      </g>
    </g>
  );
};

// ---- the machine (compressor and its dashed twin) ------------------------------------------------------------------------
/**
 * A gas compressor skid: base slab, two cylinders with pistons, a big flywheel, intake and outlet pipes and a gauge. ghost draws it as a
 * dashed cream wireframe (the digital twin) instead of the steel one, with a scan line when scan is 0..1.
 */
export const Compressor: React.FC<{x: number; y: number; f: number; scale?: number; ghost?: boolean; scan?: number; id?: string; run?: number; glow?: number}> = ({x, y, f, scale = 1, ghost = false, scan = -1, id = 'cp', run = 1, glow = 0}) => {
  const st = ghost ? NM.cream : INK;
  const sw = ghost ? 5 : 8;
  const dash = ghost ? '16 10' : undefined;
  const dOff = ghost ? -f * 0.9 : 0;
  const fill = (g: string) => (ghost ? 'none' : `url(#${id}-${g})`);
  const ang = f * 3.4 * run;
  const pis = 14 * Math.sin(ang * Math.PI / 180);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={ghost ? 0.95 : 1}>
      <defs>
        <Grad id={`${id}-s`} base={NM.steel} />
        <Grad id={`${id}-d`} base={NM.steelDeep} />
        <Grad id={`${id}-b`} base={NM.brass} />
        <clipPath id={`${id}-clip`}><rect x={-300} y={-420} width={600} height={440} /></clipPath>
      </defs>
      {!ghost && <ContactShadow cx={0} cy={14} rx={330} ry={26} opacity={0.4} />}
      {glow > 0 && <ellipse cx={0} cy={-170} rx={330} ry={240} fill={NM.amberHi} opacity={0.14 * glow} />}
      <g stroke={st} strokeWidth={sw} strokeDasharray={dash} strokeDashoffset={dOff} strokeLinejoin="round" strokeLinecap="round">
        <rect x={-300} y={-40} width={600} height={50} rx={8} fill={fill('d')} />
        {/* crankcase */}
        <rect x={-230} y={-190} width={460} height={156} rx={12} fill={fill('s')} />
        {/* two cylinders */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <rect x={s * 150 - 56} y={-330 + pis * s * 0.5} width={112} height={150} rx={10} fill={fill('s')} />
            <rect x={s * 150 - 20} y={-380 + pis * s * 0.5} width={40} height={60} rx={6} fill={fill('b')} />
            <rect x={s * 150 - 70} y={-340} width={140} height={22} rx={5} fill={fill('d')} />
          </g>
        ))}
        {/* flywheel */}
        <circle cx={0} cy={-112} r={92} fill={fill('b')} />
        <circle cx={0} cy={-112} r={34} fill={fill('d')} />
        <g transform={`rotate(${ang} 0 -112)`}>
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-6} y={-196} width={12} height={58} rx={4} fill={ghost ? 'none' : NM.steelDeep} transform={`rotate(${i * 60} 0 -112)`} />)}
        </g>
        {/* pipes */}
        <path d="M -230 -120 L -330 -120 L -330 -250" fill="none" strokeWidth={ghost ? 5 : 34} stroke={ghost ? NM.cream : NM.steelHi} />
        <path d="M 230 -120 L 330 -120 L 330 -250" fill="none" strokeWidth={ghost ? 5 : 34} stroke={ghost ? NM.cream : NM.steelHi} />
        {!ghost && <>
          <path d="M -230 -120 L -330 -120 L -330 -250" fill="none" strokeWidth={34} stroke={INK} style={{mixBlendMode: 'normal'}} opacity={0} />
        </>}
      </g>
      {!ghost && <>
        <path d="M -230 -120 L -330 -120 L -330 -250 M 230 -120 L 330 -120 L 330 -250" fill="none" stroke={INK} strokeWidth={42} strokeLinecap="round" strokeLinejoin="round" opacity={0.0} />
        <circle cx={-110} cy={-170} r={26} fill={NM.cream} stroke={INK} strokeWidth={6} />
        <path d={`M -110 -170 L ${-110 + 16 * Math.cos((ang / 12) * 0.2)} ${-170 - 16 * Math.abs(Math.sin(ang / 40))}`} stroke={NM.alarm} strokeWidth={4} />
      </>}
      {scan >= 0 && (
        <g clipPath={`url(#${id}-clip)`} opacity={0.9}>
          <rect x={-310} y={-420 + 440 * clamp01(scan)} width={620} height={8} fill={NM.cream} opacity={0.8} />
          <rect x={-310} y={-420 + 440 * clamp01(scan) - 40} width={620} height={40} fill={NM.cream} opacity={0.12} />
        </g>
      )}
    </g>
  );
};

/** An ECG heartbeat line across w px, drawn left to right by k (0..1) with a travelling blip. */
export const Ecg: React.FC<{x: number; y: number; f: number; w?: number; k?: number; color?: string; sw?: number; amp?: number}> = ({x, y, f, w = 700, k = 1, color = NM.alarmHi, sw = 8, amp = 1}) => {
  const unit = w / 5;
  let d = `M 0 0`;
  for (let i = 0; i < 5; i++) {
    const o = i * unit;
    d += ` L ${o + unit * 0.3} 0 L ${o + unit * 0.38} ${-34 * amp} L ${o + unit * 0.46} ${46 * amp} L ${o + unit * 0.54} ${-96 * amp} L ${o + unit * 0.62} ${24 * amp} L ${o + unit * 0.7} 0 L ${o + unit} 0`;
  }
  const blip = ((f / 60) % 1) * w;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={d} fill="none" stroke={INK} strokeWidth={sw + 8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(k)} />
      <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(k)} />
      {k > 0.95 && <circle cx={blip} cy={0} r={11} fill={NM.cream} stroke={INK} strokeWidth={4} opacity={0.9} />}
    </g>
  );
};

/** The blue-hour compressor yard with a pipeline run snaking away across the lilac tundra. */
export const YardBG: React.FC<{f: number; ground?: number; id?: string; pipe?: number}> = ({f, ground = 1240, id = 'yd', pipe = 0}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={NM.indigo} /><stop offset="0.6" stopColor="#5B4A86" /><stop offset="1" stopColor={NM.rose} /></linearGradient>
      <linearGradient id={`${id}-gr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9B8EC2" /><stop offset="1" stopColor={NM.snowShade} /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={ground + 60} fill={`url(#${id}-sky)`} />
    {Array.from({length: 22}, (_, i) => <circle key={i} data-band="ok" cx={rnd(i + 31) * 1080} cy={30 + rnd(i + 7) * 520} r={1.5 + rnd(i) * 2} fill="#FFFFFF" opacity={0.3 + 0.4 * rnd(i + 9)} />)}
    <path data-band="ok" d={`M -40 ${ground - 120} L 200 ${ground - 230} L 460 ${ground - 150} L 740 ${ground - 260} L 1120 ${ground - 130} L 1120 ${ground} L -40 ${ground} Z`} fill="#4A3C78" transform={`translate(${8 * Math.sin(f / 90)} 0)`} />
    <rect data-band="ok" x={-40} y={ground} width={1160} height={760} fill={`url(#${id}-gr)`} />
    {/* the pipeline: a fat pipe on supports snaking toward the horizon, drawn on by pipe */}
    {pipe > 0 && (
      <g data-band="ok">
        <path d={`M -40 ${ground + 40} C 300 ${ground + 10} 420 ${ground + 120} 700 ${ground + 70} S 1000 ${ground - 20} 1120 ${ground - 40}`} fill="none" stroke={INK} strokeWidth={46} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(pipe)} />
        <path d={`M -40 ${ground + 40} C 300 ${ground + 10} 420 ${ground + 120} 700 ${ground + 70} S 1000 ${ground - 20} 1120 ${ground - 40}`} fill="none" stroke={NM.steelHi} strokeWidth={30} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(pipe)} />
        <path d={`M -40 ${ground + 30} C 300 ${ground} 420 ${ground + 110} 700 ${ground + 60} S 1000 ${ground - 30} 1120 ${ground - 50}`} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.5 * clamp01(pipe)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(pipe)} />
      </g>
    )}
    {[0, 1, 2].map((i) => <ellipse key={i} data-band="ok" cx={160 + i * 380} cy={ground + 150 + i * 90} rx={260} ry={26} fill={NM.snowShade} opacity={0.5} />)}
  </g>
);

// ---- paper props for the test ---------------------------------------------------------------------------------------------------
/** A clipboard with a brass clip and a sheet of ruled rows. rows are {text, k, tone}: k (0..1) is how far the row has been stamped. */
export const Clipboard: React.FC<{x: number; y: number; f: number; scale?: number; rows: {text: string; k: number}[]; head?: string; id?: string; size?: number}> = ({x, y, f, scale = 1, rows, head = '', id = 'cb', size = 30}) => {
  const rw = 580;
  const rh = 92;
  const H = 150 + rows.length * rh;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={H / 2 + 16} rx={rw / 2 + 40} ry={16} opacity={0.35} />
      <rect x={-rw / 2 - 30} y={-H / 2} width={rw + 60} height={H} rx={20} fill={NM.feltDeep} stroke={INK} strokeWidth={9} />
      <rect x={-rw / 2} y={-H / 2 + 44} width={rw} height={H - 70} rx={6} fill={NM.paper} stroke={INK} strokeWidth={5} />
      <rect x={-96} y={-H / 2 - 20} width={192} height={64} rx={14} fill={NM.brass} stroke={INK} strokeWidth={7} />
      <rect x={-96} y={-H / 2 - 20} width={192} height={14} rx={7} fill="#FFFFFF" opacity={0.3} />
      <circle cx={0} cy={-H / 2 + 12} r={10} fill={NM.brassDeep} stroke={INK} strokeWidth={4} />
      {head && <text x={0} y={-H / 2 + 100} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} letterSpacing={2} fill={NM.navy}>{head}</text>}
      {rows.map((r, i) => {
        const ry = -H / 2 + 138 + i * rh;
        const k = clamp01(r.k);
        const sc = 1.5 - 0.5 * Math.min(1, k * 1.4);
        return (
          <g key={i}>
            <line x1={-rw / 2 + 24} y1={ry + 36} x2={rw / 2 - 24} y2={ry + 36} stroke={NM.creamShade} strokeWidth={3} />
            <rect x={-rw / 2 + 28} y={ry - 22} width={40} height={40} rx={5} fill="none" stroke={INK} strokeWidth={5} />
            {k > 0 && <g opacity={Math.min(1, k * 2)} transform={`translate(${-rw / 2 + 98} ${ry}) scale(${sc})`} style={{transformOrigin: 'left center'}}>
              <text x={0} y={size * 0.36} fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.5} fill={NM.navy}>{r.text}</text>
            </g>}
          </g>
        );
      })}
    </g>
  );
};

/** A paper proof card with an empty tick box that stays empty. */
export const ProofCard: React.FC<{x: number; y: number; f: number; scale?: number; lines: string[]; p?: number; rot?: number; size?: number}> = ({x, y, f, scale = 1, lines, p = 1, rot = 0, size = 30}) => {
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const w = Math.max(...lines.map((l) => monoW(l, size, 1.2))) + 150;
  const h = lines.length * (size + 14) + 70;
  const bob = 4 * Math.sin(f / 15 + x * 0.01);
  return (
    <g transform={`translate(${x + (1 - k) * 700} ${y + bob}) rotate(${rot + (1 - k) * 8}) scale(${scale})`} opacity={Math.min(1, k * 2)}>
      <rect x={-w / 2 + 10} y={-h / 2 + 12} width={w} height={h} fill="#000" opacity={0.28} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={NM.paper} stroke={INK} strokeWidth={7} />
      <rect x={-w / 2} y={-h / 2} width={w} height={14} fill={NM.felt} stroke={INK} strokeWidth={4} />
      <rect x={-w / 2 + 22} y={-18} width={40} height={40} rx={5} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="9 6" strokeDashoffset={-f * 0.5} />
      {lines.map((l, i) => <text key={i} x={-w / 2 + 84} y={-h / 2 + 50 + i * (size + 14) + size * 0.34} fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.2} fill={NM.navy}>{l}</text>)}
    </g>
  );
};

/** A school desk in mustard felt with a steel bell mold stamped with a year: where Norm first set. The mold's inside is Norm's dome. */
export const DeskMold: React.FC<{x: number; y: number; f: number; scale?: number; year?: string; fill?: number; id?: string}> = ({x, y, f, scale = 1, year = '2019', fill = 0, id = 'dm'}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><Grad id={`${id}-f`} base={NM.felt} /><Grad id={`${id}-st`} base={NM.steel} /></defs>
    <ContactShadow cx={0} cy={14} rx={330} ry={22} opacity={0.4} />
    <rect x={-300} y={-150} width={600} height={40} rx={10} fill={`url(#${id}-f)`} stroke={INK} strokeWidth={8} />
    {[-250, 250].map((lx) => <rect key={lx} x={lx - 14} y={-110} width={28} height={110} fill={NM.feltDeep} stroke={INK} strokeWidth={6} />)}
    <rect x={-230} y={-232} width={460} height={84} rx={14} fill={`url(#${id}-st)`} stroke={INK} strokeWidth={8} />
    <rect x={-220} y={-222} width={440} height={14} fill="#FFFFFF" opacity={0.2} />
    <text x={0} y={-174} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={42} letterSpacing={6} fill={NM.cream}>{year}</text>
    {/* the bell: a steel shell around Norm's own dome, open at the front so he can sit in it */}
    <g transform="translate(0 -232) scale(1.14 1.12)">
      <path d={DOME} fill={NM.mint} opacity={0.28 * clamp01(fill)} />
      <path d={DOME} fill="none" stroke={INK} strokeWidth={26} strokeLinejoin="round" />
      <path d={DOME} fill="none" stroke={NM.steelHi} strokeWidth={14} strokeLinejoin="round" strokeDasharray="520 40" />
    </g>
  </g>
);

/** A banner on a stage with three small project tiles (ski, home, machine). tiles is 0..3 how many have popped. */
export const SymposiumStage: React.FC<{x: number; y: number; f: number; scale?: number; tiles?: number; id?: string; label?: string}> = ({x, y, f, scale = 1, tiles = 0, id = 'ss', label = 'A I SYMPOSIUM'}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs><Grad id={`${id}-b`} base={NM.indigo} /></defs>
    <ContactShadow cx={0} cy={14} rx={420} ry={22} opacity={0.4} />
    <rect x={-420} y={-60} width={840} height={64} rx={8} fill={NM.felt} stroke={INK} strokeWidth={8} />
    <rect x={-390} y={-420} width={780} height={150} rx={10} fill={`url(#${id}-b)`} stroke={INK} strokeWidth={8} />
    <rect x={-390} y={-420} width={780} height={16} rx={8} fill="#FFFFFF" opacity={0.2} />
    <text x={0} y={-326} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={56} fill={NM.cream}>{label}</text>
    {[0, 1, 2].map((i) => {
      const k = clamp01(tiles - i);
      const sp = k <= 0 ? 0 : 1 - Math.pow(2, -9 * k) * Math.cos(k * 14);
      return (
        <g key={i} transform={`translate(${-240 + i * 240} ${-150 - (1 - sp) * 90}) scale(${0.4 + 0.6 * sp})`} opacity={clamp01(k * 3)}>
          <rect x={-100} y={-100} width={200} height={170} rx={16} fill={NM.paper} stroke={INK} strokeWidth={7} />
          {i === 0 && <path d="M -62 40 C -30 -60 10 20 62 -50" fill="none" stroke={NM.indigo} strokeWidth={12} strokeLinecap="round" />}
          {i === 1 && <><rect x={-60} y={-50} width={120} height={90} fill="none" stroke={NM.indigo} strokeWidth={9} /><circle cx={0} cy={-6} r={16} fill={NM.brass} stroke={INK} strokeWidth={5} /></>}
          {i === 2 && <><circle cx={0} cy={-6} r={46} fill="none" stroke={NM.indigo} strokeWidth={10} /><path d="M -62 24 L -34 24 L -22 -30 L -4 52 L 8 24 L 62 24" fill="none" stroke={NM.alarm} strokeWidth={7} /></>}
        </g>
      );
    })}
  </g>
);
