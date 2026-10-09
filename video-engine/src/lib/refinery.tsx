import React from 'react';
import {tones, FormGradient, RimLight, ContactShadow, INK} from './lighting';
import {vitals} from './motion';
import {BP} from './bioprocess';

/**
 * REFINERY — the "power is the design brief" family (NET-NEW 2026-10-09, "The Design Brief").
 * ======================================================================================
 * The story: a planned microbe bio-refinery whose second AI keeps living cells working as
 * Alaska's power rises and falls. The shelf had the vessel, the twin and the governor from
 * the 08-09 film but NOTHING that makes power itself a visible character, and no way to give
 * the vessel a face. Every piece here is local-coordinate SVG, origin at the floor centre of
 * the object (or the centre of a dial), ink-outlined, form-shaded, casting a contact shadow.
 *
 * COLOUR LICENCE (art_direction.json): EMBER means ONLY electricity (needle, lamp, cable
 * glow). SIM lime means ONLY the model. Nothing else is orange or lime.
 */

export const RF = {
  sky: '#1B2744',
  skyLow: '#3A3F63',
  snow: '#C9D6E6',
  snowShade: '#8696B5',
  ember: '#F08A24',
  emberDeep: '#B5530F',
  emberHot: '#FFC46B',
  paper: '#EDE6D2',
  kraft: '#B79B6B',
  coal: '#2A231F',
  ash: '#76706A',
  ashLight: '#A39C93',
  water: '#2C3E5E',
  waterLight: '#4B6590',
  spruce: '#18302B',
  rust: '#8E4A2A',
  ink: INK,
};

const hash = (a: number, b: number): number => {
  let h = Math.imul(a + 0x7f4a, 0x27d4eb2d) ^ Math.imul(b + 0x1b3f, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0x2545f491);
  return (((h ^ (h >>> 13)) >>> 0) / 4294967295) * 2 - 1;
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);

/* ================================================================== */
/* THE FACE — drawn over the steel vessel's barrel                      */
/* ================================================================== */
export type TankMood = 'calm' | 'worried' | 'strain' | 'relief' | 'wry' | 'gasp' | 'ghost';

/**
 * TankFace — the vessel's eyes, brows and mouth, in the vessel's own local coordinates
 * (origin = floor centre, barrel spans x -96..96, y -232..0). Eyes sit where the sight glass
 * is, so SteelVessel skips the glass when a face is requested. `look` is -1..1 horizontally,
 * `lookY` -1..1 vertically. `sweat` 0..1 draws a drop. `shiver` is a body tremor amplitude
 * in px for the cold/power dip. Blinks on an irrational period.
 */
export const TankFace: React.FC<{
  f: number; mood?: TankMood; look?: number; lookY?: number; sweat?: number; phase?: number;
}> = ({f, mood = 'calm', look = 0, lookY = 0, sweat = 0, phase = 0}) => {
  const blinkT = (f + phase * 53) % 151;
  const blink = blinkT < 5 ? Math.sin((blinkT / 5) * Math.PI) : 0;
  const lid = {calm: 0.28, worried: 0.12, strain: 0.55, relief: 0.4, wry: 0.45, gasp: 0, ghost: 0.2}[mood];
  const lidAmt = Math.max(lid, blink);
  const browTilt = {calm: 0, worried: -16, strain: 14, relief: -4, wry: 8, gasp: -22, ghost: -6}[mood];
  const browLift = {calm: 0, worried: -6, strain: 6, relief: 0, wry: -3, gasp: -12, ghost: 0}[mood];
  const px = look * 6.5, py = lookY * 5;
  const eyes = [-1, 1].map((s) => {
    const wink = mood === 'wry' && s === 1 ? 0.78 : 0;
    const l = Math.max(lidAmt, wink);
    return (
      <g key={s} transform={`translate(${s * 31},-168)`}>
        <ellipse cx={0} cy={0} rx={19} ry={22} fill="#F4EFE2" stroke={INK} strokeWidth={4} />
        <circle cx={px} cy={py + 1} r={mood === 'gasp' ? 5.2 : 8} fill={INK} />
        <circle cx={px - 2.4} cy={py - 2.6} r={2.4} fill="#fff" />
        {/* the lid: a steel plate that comes down from the brow */}
        <path d={`M -21 -24 L 21 -24 L 21 ${-24 + 46 * l} Q 0 ${-24 + 46 * l + (s * browTilt) * 0.12 + 6} -21 ${-24 + 46 * l} Z`}
          fill={BP.steel} stroke={INK} strokeWidth={3.4} />
        <path d={`M ${-22} ${browLift - 32} L ${22} ${browLift - 32 + s * browTilt * 0.5}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      </g>
    );
  });
  let mouth: React.ReactNode;
  if (mood === 'calm') mouth = <path d="M -22 -104 Q 0 -94 22 -104" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  else if (mood === 'relief') mouth = <path d="M -26 -108 Q 0 -86 26 -108" fill="#3A1E18" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  else if (mood === 'wry') mouth = <path d="M -24 -102 Q -4 -102 8 -106 Q 18 -110 26 -118" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  else if (mood === 'gasp') mouth = <ellipse cx={0} cy={-100} rx={13} ry={17 + 2 * Math.sin(f / 3)} fill="#3A1E18" stroke={INK} strokeWidth={5} />;
  else if (mood === 'strain')
    mouth = (
      <g>
        <rect x={-28} y={-114} width={56} height={22} rx={5} fill="#EDE6D2" stroke={INK} strokeWidth={4.5} />
        {[-14, 0, 14].map((x) => <path key={x} d={`M ${x} -114 L ${x} -92`} stroke={INK} strokeWidth={2.6} />)}
      </g>
    );
  else mouth = <path d={`M -22 -98 Q -8 ${-110 + 2 * Math.sin(f / 5)} 0 -98 Q 8 ${-86 - 2 * Math.sin(f / 5)} 22 -98`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  return (
    <g opacity={mood === 'ghost' ? 0.85 : 1}>
      {eyes}
      {mouth}
      {sweat > 0.02 && (
        <g transform={`translate(${66},${-196 + 36 * sweat})`} opacity={Math.min(1, sweat * 2)}>
          <path d="M 0 -14 Q 9 0 0 9 Q -9 0 0 -14 Z" fill="#9CD0EE" stroke={INK} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

/* ================================================================== */
/* POWER GAUGE                                                          */
/* ================================================================== */
/**
 * PowerGauge — a round dial on a short post. `value` 0..1 is where the needle points
 * (left = no power, right = plenty). `jitter` is needle tremor amplitude in degrees.
 * `glow` 0..1 lights the ember lamp on top. `plate` is the strip under the dial, sized to
 * its string by arithmetic. The needle is the film's throughline object.
 */
export const PowerGauge: React.FC<{
  f: number; x: number; y: number; scale?: number;
  value: number; jitter?: number; glow?: number; plate?: string; plateTone?: 'ink' | 'ember' | 'paper';
  phase?: number; pinned?: boolean;
}> = ({f, x, y, scale = 1, value, jitter = 0, glow = 1, plate, plateTone = 'ink', phase = 0, pinned = false}) => {
  const T = tones(BP.steelDeep);
  const uid = `pg${Math.round(x)}${Math.round(y)}`;
  const ang = -118 + clamp01(value) * 236 + jitter * (Math.sin(f / 2.9 + phase) * 0.6 + Math.sin(f / 1.7 + phase * 2) * 0.4);
  const pw = plate ? Math.max(120, monoW(plate, 17) + 30) : 0;
  const pc = plateTone === 'ember' ? {bg: RF.ember, fg: INK} : plateTone === 'paper' ? {bg: RF.paper, fg: INK} : {bg: '#10151F', fg: RF.paper};
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs><FormGradient id={uid} t={T} softness={0.85} /></defs>
      <ContactShadow cx={0} cy={0} rx={70} ry={11} opacity={0.5} />
      {/* post and foot */}
      <path d="M -56 0 L -44 -24 L 44 -24 L 56 0 Z" fill={`url(#${uid})`} stroke={INK} strokeWidth={5} />
      <rect x={-14} y={-92} width={28} height={70} fill={`url(#${uid})`} stroke={INK} strokeWidth={5} />
      {/* the lamp on top */}
      <g transform="translate(0,-296)">
        <circle r={22 + 20 * glow} fill={RF.emberHot} opacity={0.2 * glow} />
        <rect x={-14} y={-4} width={28} height={16} fill={T.shade} stroke={INK} strokeWidth={3.4} />
        <path d="M -16 -4 Q -16 -30 0 -30 Q 16 -30 16 -4 Z" fill={glow > 0.15 ? RF.emberHot : '#5B5662'} stroke={INK} strokeWidth={4} opacity={0.6 + 0.4 * glow} />
      </g>
      {/* the dial */}
      <g transform="translate(0,-168)">
        <circle r={112} fill={`url(#${uid})`} stroke={INK} strokeWidth={7} />
        <circle r={94} fill={RF.paper} stroke={INK} strokeWidth={4} />
        {/* the low-power zone, a worry band */}
        <path d="M -81 36 A 94 94 0 0 1 -57 -76" fill="none" stroke={RF.emberDeep} strokeWidth={9} opacity={0.7} />
        {Array.from({length: 13}, (_, i) => {
          const a = -118 + (i / 12) * 236;
          return <path key={i} d="M 0 -88 L 0 -73" stroke={INK} strokeWidth={i % 3 === 0 ? 5 : 3} transform={`rotate(${a})`} />;
        })}
        <text x={0} y={46} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={17} letterSpacing={2} fill={INK}>POWER</text>
        <g transform={`rotate(${ang})`}>
          <path d="M -5 14 L 0 -80 L 5 14 Z" fill={RF.ember} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
          <circle r={9} fill={INK} />
          <circle r={3.4} fill={RF.emberHot} />
        </g>
        {pinned && <rect x={-18} y={-104} width={36} height={14} fill="#10151F" stroke={INK} strokeWidth={3} transform={`rotate(${clamp01(value) < 0.5 ? -118 : 118})`} />}
        <path d="M -70 -62 Q -30 -96 20 -88" fill="none" stroke="#fff" strokeWidth={5} opacity={0.35} strokeLinecap="round" />
      </g>
      {plate && (
        <g transform="translate(0,26)">
          <rect x={-pw / 2 + 4} y={-1} width={pw} height={36} rx={5} fill="#000" opacity={0.3} />
          <rect x={-pw / 2} y={-5} width={pw} height={36} rx={5} fill={pc.bg} stroke={INK} strokeWidth={4} />
          <text x={0} y={19} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={17} letterSpacing={1.5} fill={pc.fg}>{plate}</text>
        </g>
      )}
    </g>
  );
};

/** A power cable from (x0,y0) to (x1,y1) that sags, with a travelling ember pulse. */
export const Cable: React.FC<{
  f: number; x0: number; y0: number; x1: number; y1: number; sag?: number; live?: number; dashed?: boolean; w?: number;
}> = ({f, x0, y0, x1, y1, sag = 60, live = 1, dashed = false, w = 9}) => {
  const mx = (x0 + x1) / 2, my = Math.max(y0, y1) + sag;
  const d = `M ${x0} ${y0} Q ${mx} ${my} ${x1} ${y1}`;
  const t = (f / 40) % 1;
  const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1;
  const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 6} strokeLinecap="round" opacity={0.9} />
      <path d={d} fill="none" stroke={dashed ? '#6C7A94' : '#2D3548'} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? '14 10' : undefined} />
      {live > 0.02 && (
        <>
          <path d={d} fill="none" stroke={RF.ember} strokeWidth={2.6} opacity={0.45 * live} strokeLinecap="round" />
          <circle cx={px} cy={py} r={9} fill={RF.emberHot} opacity={0.85 * live} />
          <circle cx={px} cy={py} r={4} fill="#fff" opacity={0.9 * live} />
        </>
      )}
    </g>
  );
};

/* ================================================================== */
/* ASH HEAP                                                             */
/* ================================================================== */
/**
 * AshHeap — a mound of coal refuse and ash with a hang tag on a stake. `flip` 0..1 turns the
 * tag from WASTE to FEEDSTOCK? through edge-on. `eyes` gives it two small hopeful eyes.
 */
export const AshHeap: React.FC<{
  f: number; x: number; y: number; scale?: number; flip?: number; tagA?: string; tagB?: string;
  eyes?: boolean; look?: number; scoop?: number; glint?: number; phase?: number;
}> = ({f, x, y, scale = 1, flip = 0, tagA = 'WASTE', tagB = 'FEEDSTOCK?', eyes = false, look = 0, scoop = 0, glint = 1, phase = 0}) => {
  const T = tones(RF.ash);
  const uid = `ah${Math.round(x)}${Math.round(y)}`;
  const v = vitals(f, phase, 0.3);
  const turn = Math.cos(flip * Math.PI);
  const w = Math.max(104, monoW(tagB, 18) + 28);
  const chunks = Array.from({length: 26}, (_, i) => {
    const t = (i + 0.5) / 26;
    const cx = -150 + t * 300 + hash(i, 3) * 14;
    const top = -130 * Math.sin(Math.PI * t) ** 0.8;
    const cy = top * (0.15 + 0.85 * ((i * 37) % 11) / 11) + 4;
    return {cx, cy, r: 8 + Math.abs(hash(i, 8)) * 13, rot: hash(i, 9) * 60, k: i};
  });
  return (
    <g transform={`translate(${x},${y + v.bob * 0.15}) scale(${scale})`}>
      <defs><FormGradient id={uid} t={T} softness={0.9} /></defs>
      <ContactShadow cx={0} cy={6} rx={190} ry={20} opacity={0.5} />
      <path d="M -180 4 Q -150 -20 -96 -66 Q -40 -128 8 -132 Q 64 -128 112 -70 Q 160 -22 184 4 Z" fill={`url(#${uid})`} stroke={INK} strokeWidth={6} />
      {chunks.map((c) => (
        <g key={c.k} transform={`translate(${c.cx},${c.cy}) rotate(${c.rot})`}>
          <path d={`M ${-c.r} 0 L ${-c.r * 0.4} ${-c.r * 0.8} L ${c.r * 0.7} ${-c.r * 0.5} L ${c.r} ${c.r * 0.3} L 0 ${c.r * 0.6} Z`} fill={c.k % 3 === 0 ? RF.coal : RF.ashLight} stroke={INK} strokeWidth={2.6} />
        </g>
      ))}
      {glint > 0 && [0, 1, 2, 3].map((i) => (
        <circle key={i} cx={-70 + i * 52 + hash(i, 20) * 12} cy={-40 - (i % 2) * 36} r={3 + 2 * Math.sin(f / 9 + i * 2)} fill={RF.emberHot} opacity={glint * (0.5 + 0.4 * Math.sin(f / 7 + i * 1.9))} />
      ))}
      <RimLight d="M -96 -66 Q -40 -128 8 -132" w={5} opacity={0.55} />
      {eyes && [-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * 34 + 6},-82)`}>
          <ellipse rx={14} ry={17} fill="#F4EFE2" stroke={INK} strokeWidth={3.6} />
          <circle cx={look * 4} cy={2} r={6} fill={INK} />
          <circle cx={look * 4 - 2} cy={-1} r={2} fill="#fff" />
        </g>
      ))}
      {/* the stake and its hang tag */}
      <g transform="translate(-196,-6)">
        <rect x={-5} y={-190} width={10} height={192} fill="#7B5E3B" stroke={INK} strokeWidth={3.6} />
        <g transform={`translate(0,-176) rotate(${3 * Math.sin(f / 21 + phase)})`}>
          <g transform={`translate(${w / 2 - 6},40) scale(${Math.abs(turn) < 0.07 ? 0.07 : turn},1)`}>
            <path d={`M ${-w / 2} -44 L ${-w / 2} 4`} stroke={INK} strokeWidth={0} />
            <rect x={-w / 2} y={-22} width={w} height={44} rx={4} fill={turn > 0 ? RF.paper : RF.kraft} stroke={INK} strokeWidth={4} />
            {Math.abs(turn) > 0.35 && (
              <text x={0} y={7} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={18} fill={INK}>{turn > 0 ? tagA : tagB}</text>
            )}
          </g>
        </g>
      </g>
      {scoop > 0 && (
        <g opacity={scoop}>
          {[0, 1, 2, 3, 4].map((i) => {
            const t = (f / 50 + i / 5) % 1;
            return <circle key={i} cx={30 + t * 110} cy={-120 - 80 * Math.sin(t * Math.PI)} r={5} fill={RF.coal} stroke={INK} strokeWidth={2} />;
          })}
        </g>
      )}
    </g>
  );
};

/* ================================================================== */
/* BARGE + CHEAP SUN                                                    */
/* ================================================================== */
export const Barge: React.FC<{
  f: number; x: number; y: number; scale?: number; sign?: string; loaded?: number; horn?: number; phase?: number; eyes?: boolean;
}> = ({f, x, y, scale = 1, sign = 'SHIP IT', loaded = 1, horn = 0, phase = 0, eyes = true}) => {
  const T = tones(RF.rust);
  const uid = `bg${Math.round(x)}${Math.round(y)}`;
  const bob = 5 * Math.sin(f / 24 + phase) + 2 * Math.sin(f / 9.7 + phase);
  const rot = 1.3 * Math.sin(f / 31 + phase);
  const sw = Math.max(150, monoW(sign, 22) + 40);
  return (
    <g transform={`translate(${x},${y + bob}) rotate(${rot}) scale(${scale})`}>
      <defs><FormGradient id={uid} t={T} softness={0.85} /></defs>
      {/* wake */}
      <path d="M -300 14 Q -150 28 0 14 Q 150 0 300 14" fill="none" stroke="#fff" strokeWidth={5} opacity={0.35} strokeDasharray="22 18" strokeDashoffset={-f * 1.4} />
      <path d="M -270 -4 L 270 -4 L 230 70 L -230 70 Z" fill={`url(#${uid})`} stroke={INK} strokeWidth={7} />
      <path d="M -262 12 L 262 12" stroke={INK} strokeWidth={3.4} opacity={0.6} />
      {[-200, -120, -40, 40, 120, 200].map((rx, i) => <circle key={i} cx={rx} cy={36} r={5} fill={T.shade} stroke={INK} strokeWidth={2.4} />)}
      {/* the deck load: ash sacks */}
      {loaded > 0 && (
        <g opacity={loaded}>
          {Array.from({length: 11}, (_, i) => {
            const row = i < 6 ? 0 : 1;
            const col = row === 0 ? i : i - 6;
            const sx = -190 + col * 66 + (row ? 33 : 0);
            return (
              <g key={i} transform={`translate(${sx},${-4 - row * 44})`}>
                <path d="M -30 0 L -26 -40 Q 0 -50 26 -40 L 30 0 Z" fill={i % 2 ? RF.ashLight : RF.ash} stroke={INK} strokeWidth={4} />
                <path d="M -18 -40 L 0 -52 L 18 -40" fill="none" stroke={INK} strokeWidth={3} />
              </g>
            );
          })}
        </g>
      )}
      {/* wheelhouse */}
      <g transform="translate(200,-4)">
        <rect x={-40} y={-92} width={80} height={90} fill={RF.paper} stroke={INK} strokeWidth={5} />
        <rect x={-30} y={-78} width={24} height={26} fill="#6C95C8" stroke={INK} strokeWidth={3.4} />
        <rect x={4} y={-78} width={24} height={26} fill="#6C95C8" stroke={INK} strokeWidth={3.4} />
        <rect x={-46} y={-100} width={92} height={14} fill={RF.rust} stroke={INK} strokeWidth={4} />
        <rect x={20} y={-132} width={14} height={34} fill={T.shade} stroke={INK} strokeWidth={4} />
        {horn > 0 && [0, 1, 2].map((i) => <circle key={i} cx={27 + horn * 18 * (i + 1)} cy={-140 - horn * 20 * (i + 1)} r={10 + 6 * i} fill="#fff" opacity={0.5 - 0.14 * i} />)}
      </g>
      {/* the mast sign */}
      <g transform="translate(-14,-120)">
        <rect x={-4} y={0} width={8} height={110} fill="#6B4E2E" stroke={INK} strokeWidth={3.4} />
        <rect x={-sw / 2 + 4} y={-44} width={sw} height={52} rx={4} fill="#000" opacity={0.3} />
        <rect x={-sw / 2} y={-48} width={sw} height={52} rx={4} fill={RF.kraft} stroke={INK} strokeWidth={4.4} />
        <text x={0} y={-12} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={22} letterSpacing={1.5} fill={INK}>{sign}</text>
      </g>
      {eyes && (
        <g transform="translate(-246,24)">
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${i * 40},0)`}>
              <ellipse rx={13} ry={15} fill="#F4EFE2" stroke={INK} strokeWidth={3.4} />
              <circle cx={4} cy={1} r={5.5} fill={INK} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
};

/** A low sun that is brighter than the tank's lamp, with a label tag. */
export const CheapSun: React.FC<{f: number; x: number; y: number; scale?: number; label?: string; pull?: number}> = ({f, x, y, scale = 1, label = 'CHEAP POWER', pull = 0}) => {
  const w = monoW(label, 22) + 44;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {Array.from({length: 16}, (_, i) => (
        <path key={i} d="M 0 -150 L 11 -118 L -11 -118 Z" fill={RF.emberHot} opacity={0.5} transform={`rotate(${i * 22.5 + f * 0.3})`} />
      ))}
      <circle r={104} fill={RF.emberHot} stroke={INK} strokeWidth={7} />
      <circle r={78} fill={RF.ember} opacity={0.35} />
      <circle cx={-26} cy={-30} r={26} fill="#fff" opacity={0.35} />
      <g transform={`translate(${pull * -30},150)`}>
        <rect x={-w / 2 + 5} y={-24} width={w} height={46} rx={5} fill="#000" opacity={0.3} />
        <rect x={-w / 2} y={-28} width={w} height={46} rx={5} fill={RF.paper} stroke={INK} strokeWidth={4.4} />
        <text x={0} y={5} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={22} letterSpacing={1.5} fill={INK}>{label}</text>
      </g>
    </g>
  );
};

/* ================================================================== */
/* THE ROUND TABLE, THE PIE, THE ENVELOPE, THE JARS, THE TARP           */
/* ================================================================== */
export const NameChair: React.FC<{x: number; y: number; scale?: number; label: string; tone?: string; arrive?: number; join?: boolean; face?: number}> = ({x, y, scale = 1, label, tone = '#5B6C8F', arrive = 1, join = false, face = 1}) => {
  const T = tones(tone);
  const uid = `nc${Math.round(x)}${label.length}`;
  const w = Math.max(110, monoW(label, 18) + 28);
  const k = clamp01(arrive);
  return (
    <g transform={`translate(${x + (1 - k) * 260},${y}) scale(${scale})`} opacity={Math.min(1, k * 3)}>
      <defs><FormGradient id={uid} t={T} softness={0.85} /></defs>
      <ContactShadow cx={0} cy={2} rx={78} ry={11} opacity={0.5} />
      <rect x={-60} y={-168} width={120} height={104} rx={14} fill={`url(#${uid})`} stroke={INK} strokeWidth={6} />
      <rect x={-72} y={-70} width={144} height={30} rx={8} fill={`url(#${uid})`} stroke={INK} strokeWidth={6} />
      <rect x={-52} y={-40} width={12} height={42} fill={T.shade} stroke={INK} strokeWidth={4} />
      <rect x={40} y={-40} width={12} height={42} fill={T.shade} stroke={INK} strokeWidth={4} />
      <g transform="translate(0,-240)">
        <rect x={-w / 2 + 4} y={-2} width={w} height={40} rx={4} fill="#000" opacity={0.3} />
        <rect x={-w / 2} y={-6} width={w} height={40} rx={4} fill={join ? RF.ember : RF.paper} stroke={INK} strokeWidth={4} />
        <text x={0} y={21} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={18} letterSpacing={1} fill={INK}>{label}</text>
      </g>
      <g opacity={face} transform="translate(0,-122)">
        {[-1, 1].map((s) => <g key={s} transform={`translate(${s * 20},0)`}><ellipse rx={11} ry={13} fill="#F4EFE2" stroke={INK} strokeWidth={3} /><circle cx={2} cy={1} r={4.4} fill={INK} /></g>)}
        <path d="M -12 28 Q 0 36 12 28" fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
      </g>
    </g>
  );
};

/** A pie of three NSF award records drawn to true proportion. `cut` pulls the UAF wedge out. */
export const AwardPie: React.FC<{f: number; x: number; y: number; scale?: number; cut?: number; grow?: number}> = ({f, x, y, scale = 1, cut = 0, grow = 1}) => {
  // shares of the three NSF award records: UAA 3,824,575 / Montana Tech 1,260,800 / UAF 913,037 of 5,998,412
  const shares = [0.6376, 0.2102, 0.1522];
  const cols = ['#5E7AA8', '#7C9C8C', RF.ember];
  const R = 150;
  let a0 = -Math.PI / 2;
  const wedges = shares.map((s, i) => {
    const a1 = a0 + s * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    const off = i === 2 ? 56 * cut : 0;
    const p = `M ${Math.cos(mid) * off} ${Math.sin(mid) * off} L ${Math.cos(a0) * R + Math.cos(mid) * off} ${Math.sin(a0) * R + Math.sin(mid) * off} A ${R} ${R} 0 ${s > 0.5 ? 1 : 0} 1 ${Math.cos(a1) * R + Math.cos(mid) * off} ${Math.sin(a1) * R + Math.sin(mid) * off} Z`;
    a0 = a1;
    return <path key={i} d={p} fill={cols[i]} stroke={INK} strokeWidth={6} strokeLinejoin="round" />;
  });
  return (
    <g transform={`translate(${x},${y}) scale(${scale * grow})`}>
      <ContactShadow cx={0} cy={R + 30} rx={170} ry={18} opacity={0.4} />
      <circle r={R + 12} fill="#E9E1CB" stroke={INK} strokeWidth={6} />
      {wedges}
      <circle r={R - 4} fill="none" stroke="#fff" strokeWidth={4} opacity={0.12} />
    </g>
  );
};

export const Envelope: React.FC<{f: number; x: number; y: number; scale?: number; open?: number; lines?: string[]; stamp?: string; rot?: number}> = ({f, x, y, scale = 1, open = 0, lines = [], stamp, rot = 0}) => {
  const k = clamp01(open);
  const w = Math.max(...lines.map((l) => monoW(l, 22)), 260) + 52;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
      <ContactShadow cx={0} cy={110} rx={150} ry={14} opacity={0.35} />
      {k > 0.05 && (
        <g transform={`translate(0,${-150 * k})`}>
          <rect x={-w / 2} y={-30} width={w} height={40 + lines.length * 40} fill={RF.paper} stroke={INK} strokeWidth={5} />
          {lines.map((l, i) => (
            <text key={i} x={0} y={14 + i * 40} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={22} letterSpacing={1} fill={INK}>{l}</text>
          ))}
        </g>
      )}
      <rect x={-130} y={-70} width={260} height={180} fill={RF.kraft} stroke={INK} strokeWidth={6} />
      <path d={`M -130 -70 L 0 ${20 - 120 * k} L 130 -70 Z`} fill="#C8AC7A" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -130 110 L -20 20 M 130 110 L 20 20" stroke={INK} strokeWidth={4} fill="none" />
      {stamp && k < 0.2 && (
        <g transform="translate(0,60) rotate(-8)">
          <rect x={-100} y={-22} width={200} height={44} fill="none" stroke="#8E1B3A" strokeWidth={5} />
          <text x={0} y={8} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={900} fontSize={22} letterSpacing={2} fill="#8E1B3A">{stamp}</text>
        </g>
      )}
    </g>
  );
};

/** Three sample jars on a shelf, each with a coal-refuse or ash sample and a rank flag. */
export const SampleJars: React.FC<{f: number; x: number; y: number; scale?: number; rank?: number}> = ({f, x, y, scale = 1, rank = 0}) => {
  const fills = [RF.ashLight, RF.coal, RF.ash];
  const fillH = [0.62, 0.8, 0.5];
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={250} ry={14} opacity={0.4} />
      <rect x={-250} y={-6} width={500} height={22} fill="#6B4E2E" stroke={INK} strokeWidth={5} />
      {[0, 1, 2].map((i) => {
        const cx = -150 + i * 150;
        const h = 150;
        return (
          <g key={i} transform={`translate(${cx},-6)`}>
            <rect x={-44} y={-h} width={88} height={h} rx={14} fill="#CFE3EE" fillOpacity={0.35} stroke={INK} strokeWidth={5} />
            <rect x={-38} y={-h * fillH[i]} width={76} height={h * fillH[i] - 6} rx={9} fill={fills[i]} stroke={INK} strokeWidth={3} />
            <rect x={-48} y={-h - 16} width={96} height={18} rx={6} fill={BP.steel} stroke={INK} strokeWidth={4} />
            {[0, 1, 2, 3].map((g) => <circle key={g} cx={-18 + g * 12 + hash(g, i) * 6} cy={-30 - g * 14} r={3} fill={RF.emberHot} opacity={0.5 + 0.4 * Math.sin(f / 8 + g + i)} />)}
            {rank > 0 && (
              <g transform={`translate(0,${-h - 70 + 10 * (1 - clamp01(rank))})`} opacity={clamp01(rank)}>
                <circle r={22} fill={[RF.emberHot, RF.paper, RF.paper][i]} stroke={INK} strokeWidth={4.4} />
                <text y={8} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={900} fontSize={24} fill={INK}>{i === 0 ? 1 : i === 1 ? 3 : 2}</text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** A heavy tarp over a shape. `pull` 0..1 drags it off to the right and up. */
export const Tarp: React.FC<{x: number; y: number; w: number; h: number; pull: number; f: number}> = ({x, y, w, h, pull, f}) => {
  const k = clamp01(pull);
  if (k >= 1) return null;
  const T = tones('#5C6F5A');
  const uid = `tp${Math.round(x)}`;
  return (
    <g transform={`translate(${x + k * (w + 260)},${y - k * 120}) rotate(${k * 24})`} opacity={1 - k * 0.2}>
      <defs><FormGradient id={uid} t={T} softness={0.85} /></defs>
      <path d={`M ${-w / 2} 0 Q ${-w / 2 - 14} ${-h * 0.6} ${-w * 0.3} ${-h * 0.95} Q 0 ${-h * 1.12 + 6 * Math.sin(f / 13)} ${w * 0.3} ${-h * 0.95} Q ${w / 2 + 14} ${-h * 0.6} ${w / 2} 0 Q ${w * 0.25} 24 0 14 Q ${-w * 0.25} 24 ${-w / 2} 0 Z`} fill={`url(#${uid})`} stroke={INK} strokeWidth={6} />
      {[-0.28, 0, 0.28].map((s, i) => <path key={i} d={`M ${s * w} ${-h * 0.9} Q ${s * w * 1.1} ${-h * 0.4} ${s * w * 1.2} 6`} fill="none" stroke={INK} strokeWidth={3} opacity={0.4} />)}
    </g>
  );
};

/** A laptop whose screen carries the virtual pilot plant. Children are drawn in screen space (640x400). */
export const Monitor: React.FC<{f: number; x: number; y: number; scale?: number; children?: React.ReactNode; glow?: number}> = ({f, x, y, scale = 1, children, glow = 1}) => {
  const T = tones('#3B4560');
  const uid = `mn${Math.round(x)}`;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <FormGradient id={uid} t={T} softness={0.85} />
        <clipPath id={`${uid}c`}><rect x={-300} y={-420} width={600} height={360} rx={6} /></clipPath>
      </defs>
      <ContactShadow cx={0} cy={4} rx={360} ry={18} opacity={0.45} />
      <path d="M -380 0 L -340 -34 L 340 -34 L 380 0 Z" fill={`url(#${uid})`} stroke={INK} strokeWidth={6} />
      <rect x={-326} y={-446} width={652} height={412} rx={22} fill={`url(#${uid})`} stroke={INK} strokeWidth={8} />
      <rect x={-300} y={-420} width={600} height={360} rx={6} fill="#0D1522" />
      <g clipPath={`url(#${uid}c)`}>
        <g transform="translate(0,-240)">{children}</g>
        {Array.from({length: 18}, (_, i) => <path key={i} d={`M -300 ${-420 + i * 20} L 300 ${-420 + i * 20}`} stroke="#000" strokeWidth={1.2} opacity={0.18} />)}
        <rect x={-300} y={-420} width={600} height={360} fill="#C6F24A" opacity={0.04 * glow} />
      </g>
      <circle cx={0} cy={-18} r={5} fill={T.shade} stroke={INK} strokeWidth={2} />
    </g>
  );
};

/** Falling snow, deterministic, cheap. */
export const Snowfall: React.FC<{f: number; n?: number; speed?: number; opacity?: number; height?: number}> = ({f, n = 70, speed = 1, opacity = 0.8, height = 1920}) => (
  <g opacity={opacity} data-band="ok">
    {Array.from({length: n}, (_, i) => {
      const sx = (hash(i, 1) * 0.5 + 0.5) * 1180 - 50;
      const sp = 0.7 + (hash(i, 2) * 0.5 + 0.5) * 1.6;
      const sy = ((hash(i, 3) * 0.5 + 0.5) * height + f * sp * 1.6 * speed) % (height + 40) - 20;
      const dx = 18 * Math.sin(f / 38 + i);
      return <circle key={i} cx={sx + dx} cy={sy} r={1.6 + (i % 4) * 0.9} fill="#fff" opacity={0.5 + 0.4 * ((i % 3) / 3)} />;
    })}
  </g>
);

/**
 * FrostYardDusk — the film's home set: indigo dusk, a lit-ember horizon, parallax ridges and
 * spruce rows, a snow floor to the bottom edge, and a utility pole with a line that sags to
 * the vessel. `power` 0..1 drives the pole lamp and the horizon glow so the WORLD answers the
 * gauge. `ground` is the y of the snow line. Draws full-bleed (0..1080 x 0..1920).
 */
export const FrostYardDusk: React.FC<{f: number; power?: number; ground?: number; pole?: boolean; shift?: number; snow?: boolean}> = ({f, power = 1, ground = 1180, pole = true, shift = 0, snow = true}) => {
  const stars = Array.from({length: 46}, (_, i) => ({x: (hash(i, 5) * 0.5 + 0.5) * 1080, y: (hash(i, 6) * 0.5 + 0.5) * (ground - 420), r: 1 + (i % 3) * 0.7, p: i}));
  const ridge = (seed: number, base: number, amp: number, col: string, par: number) => {
    let d = `M -60 ${ground + 8} L -60 ${base}`;
    for (let i = 0; i <= 14; i++) d += ` L ${-60 + i * 90 - shift * par} ${base - amp * (0.5 + 0.5 * hash(i, seed))}`;
    d += ` L 1200 ${ground + 8} Z`;
    return <path d={d} fill={col} stroke={INK} strokeWidth={4} />;
  };
  const trees = Array.from({length: 16}, (_, i) => ({x: -40 + i * 76 + hash(i, 12) * 22 - shift * 0.9, s: 0.8 + (hash(i, 13) * 0.5 + 0.5) * 0.7}));
  return (
    <g>
      <defs>
        <linearGradient id="fyd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={RF.sky} />
          <stop offset="0.7" stopColor={RF.skyLow} />
          <stop offset="1" stopColor={power > 0.5 ? '#9A5D6E' : '#59526F'} />
        </linearGradient>
        <linearGradient id="fyd-snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={RF.snow} />
          <stop offset="1" stopColor={RF.snowShade} />
        </linearGradient>
      </defs>
      <rect data-band="ok" x={-20} y={-20} width={1120} height={ground + 40} fill="url(#fyd-sky)" />
      {stars.map((s) => <circle key={s.p} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.35 + 0.35 * Math.sin(f / 23 + s.p)} />)}
      <ellipse cx={600 - shift * 0.2} cy={ground - 20} rx={520} ry={110 + 40 * power} fill={RF.ember} opacity={0.1 + 0.2 * power} />
      {ridge(1, ground - 230, 90, '#2A3555', 0.25)}
      {ridge(2, ground - 150, 70, '#1F2B49', 0.5)}
      {trees.map((t, i) => (
        <g key={i} transform={`translate(${t.x},${ground - 6}) scale(${t.s})`}>
          <path d="M 0 -170 L 30 -100 L 14 -100 L 40 -46 L 18 -46 L 46 0 L -46 0 L -18 -46 L -40 -46 L -14 -100 L -30 -100 Z" fill={RF.spruce} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      <rect data-band="ok" x={-20} y={ground - 6} width={1120} height={1960 - ground} fill="url(#fyd-snow)" />
      <path d={`M -20 ${ground + 4} Q 300 ${ground - 12} 560 ${ground + 2} T 1100 ${ground + 4}`} fill="none" stroke="#fff" strokeWidth={4} opacity={0.5} />
      {pole && (
        <g transform={`translate(${900 - shift * 0.9},${ground + 30})`}>
          <ContactShadow cx={0} cy={0} rx={50} ry={9} opacity={0.5} />
          <rect x={-11} y={-560} width={22} height={560} fill="#6B4E2E" stroke={INK} strokeWidth={5} />
          <rect x={-90} y={-540} width={180} height={16} fill="#6B4E2E" stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={-566} r={26 + 26 * power} fill={RF.emberHot} opacity={0.22 * power} />
          <circle cx={0} cy={-566} r={13} fill={power > 0.2 ? RF.emberHot : '#5B5662'} stroke={INK} strokeWidth={4} opacity={0.4 + 0.6 * power} />
          {[-80, 80].map((ix) => <circle key={ix} cx={ix} cy={-546} r={8} fill="#CFE3EE" stroke={INK} strokeWidth={3.4} />)}
        </g>
      )}
    </g>
  );
};
