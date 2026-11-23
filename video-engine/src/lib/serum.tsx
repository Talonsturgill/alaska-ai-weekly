import React from 'react';
import {tones, paleTones, FormGradient, RimLight, ContactShadow} from './lighting';
import {figureIdle, FigurePose} from './figureidle';
import {AK_PATH} from './akmap';
import {MONO, monoW} from './prospect';

/**
 * THE SERUM FAMILY (2026-11-23, "Two Runs Out of Nenana").
 *
 * A pair of faced CLEAR-glass blood sample tubes (FLEW and STAYED, never frosted), a plain cargo drone with NO face, a dashed
 * detect-and-avoid radar that is always PLANNED, a scarlet ribbon that morphs from a loop to a line,
 * a ground station, a sight bubble, a results printer whose tray stays empty, a village with a clinic,
 * a small sample fridge, a 1925 train and a shivering 1925 engine, a dusk world on the river ice and
 * a cream map of Alaska laid on that ice.
 *
 * Palette roles (art_direction.json): scarlet is the ribbon alone; oxblood is blood; phosphor green
 * with a plum keyline is ONLY what is planned or seen by a machine; sepia is ONLY 1925.
 * Cultural rules: the village is roofs, a clinic and a runway, no Native symbols; mushers are plain.
 *
 * Every faced character takes `cues` and commits a beat pose on each (the forest.tsx beatPose pattern).
 */
export const SER = {
  ink: '#20182B', plum: '#3B2B4A', mauve: '#8A6283', apricot: '#F2A779', apricotL: '#FBD3A8',
  snow: '#D9D0E3', snowD: '#A79BB8', peach: '#F6D9C4', spruce: '#1F2621', spruceL: '#33403A',
  glass: '#C8E3F0', blood: '#7E1626', bloodL: '#B0303F', cap: '#F3EBDD', ribbon: '#E0303F', ribbonL: '#FF7480',
  phos: '#2EE86B', phosD: '#13A84A', sepia: '#B98A57', sepiaD: '#7A5634', sepiaL: '#E2C9A0',
  drone: '#9A96A0', droneD: '#5E5A66', map: '#F1E6D2', land: '#B9C3A2', landD: '#8E9A78', water: '#BDB3C8',
  paper: '#FBF6EC', warm: '#FFD27A', steel: '#6E6A78', night: '#1A1424',
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

/** a mono label on a paper plate sized to its string by arithmetic */
export const Tag: React.FC<{x: number; y: number; text: string; size?: number; fill?: string; ink?: string; rot?: number}> = ({x, y, text, size = 22, fill = SER.paper, ink = SER.ink, rot = 0}) => {
  const w = monoW(text, size) + 28;
  const h = size + 18;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 + 4} y={-h / 2 + 5} width={w} height={h} rx={5} fill="#000" opacity={0.25} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill={fill} stroke={ink} strokeWidth={3.5} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.5} fill={ink}>{text}</text>
    </g>
  );
};

export type TubeEmotion = 'eager' | 'nervous' | 'calm' | 'wistful' | 'worried' | 'proud';

/**
 * SampleTube. Origin (x, y) is the bottom of the tube. At scale 1 it is about 84 wide and 300 tall.
 *  - fill 0..1      oxblood level
 *  - goggles        flight goggles over the eyes
 *  - glow 0..1      a cool fridge glow on the glass
 *  - look -1..1     pupils
 *  - label          a paper band (FLEW, STAYED)
 *  - squash 0..1    a landing squash
 */
export const SampleTube: React.FC<{
  f: number; x: number; y: number; scale?: number; emotion?: TubeEmotion; fill?: number; goggles?: boolean;
  glow?: number; look?: number; label?: string; cues?: number[]; seed?: number; squash?: number; tilt?: number; shadow?: boolean;
}> = ({f, x, y, scale = 1, emotion = 'calm', fill = 0.62, goggles = false, glow = 0, look = 0, label, cues, seed = 1, squash = 0, tilt = 0, shadow = true}) => {
  const id = uid(`tube${seed}`);
  const bp = beatPose(f, seed, cues, 300);
  const breathe = 1 + 0.012 * Math.sin(f / 13 + seed);
  const sway = 1.6 * Math.sin(f / 23 + seed * 2) + bp.skew;
  const W = 84, H = 300, r = W / 2;
  const blinkPh = (f + seed * 37) % 104;
  const blink = blinkPh < 4 ? 1 - Math.abs(blinkPh - 2) / 2 : 0;
  const lvl = H - 30 - (H - 70) * clamp01(fill);
  const wob = 3 * Math.sin(f / 7 + seed);
  const g = paleTones(SER.glass);
  const bl = tones(SER.blood);
  const sq = 1 - 0.12 * squash;
  const eyeY = -H * 0.52;
  const mouth = {eager: 'M -16 0 Q 0 16 16 0', proud: 'M -16 0 Q 0 14 16 0', calm: 'M -12 2 Q 0 8 12 2', wistful: 'M -12 4 Q 0 0 12 4',
    nervous: 'M -14 4 q 7 -6 14 0 q 7 6 14 0', worried: 'M -12 6 Q 0 -4 12 6', frosty: 'M -12 3 L 12 3'}[emotion];
  const brow = {eager: -6, proud: -4, calm: 0, wistful: 6, nervous: 9, worried: 10}[emotion];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * (1 + 0.06 * squash)} ${scale * sq * breathe}) rotate(${tilt + sway * 0.4}) translate(0 ${-bp.dip})`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={g.key} stopOpacity={0.95} /><stop offset="0.5" stopColor={g.base} stopOpacity={0.75} /><stop offset="1" stopColor={g.shade} stopOpacity={0.95} />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={SER.bloodL} /><stop offset="0.5" stopColor={bl.base} /><stop offset="1" stopColor={bl.shade} />
        </linearGradient>
        <clipPath id={`${id}-c`}><path d={`M ${-r} ${-H + 40} L ${-r} ${-r} A ${r} ${r} 0 0 0 ${r} ${-r} L ${r} ${-H + 40} Z`} /></clipPath>
      </defs>
      {shadow && <ContactShadow cx={0} cy={2} rx={58} ry={10} opacity={0.42} />}
      {glow > 0 && <ellipse cx={0} cy={-H / 2} rx={90} ry={H * 0.62} fill="#BFE8FF" opacity={0.22 * glow} />}
      <path d={`M ${-r} ${-H + 40} L ${-r} ${-r} A ${r} ${r} 0 0 0 ${r} ${-r} L ${r} ${-H + 40} Z`} fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`}>
        <path d={`M ${-r - 4} ${lvl} Q ${-r / 2} ${lvl - 6 + wob} 0 ${lvl} T ${r + 4} ${lvl} L ${r + 4} 10 L ${-r - 4} 10 Z`} fill={`url(#${id}-b)`} />
        <path d={`M ${-r + 10} ${lvl + 16} L ${-r + 10} ${-r}`} stroke={SER.bloodL} strokeWidth={6} opacity={0.6} strokeLinecap="round" />
        <ellipse cx={-r * 0.45} cy={-H * 0.55} rx={7} ry={H * 0.3} fill="#fff" opacity={0.55} />
      </g>
      <path d={`M ${-r} ${-H + 40} L ${-r} ${-r} A ${r} ${r} 0 0 0 ${r} ${-r} L ${r} ${-H + 40}`} fill="none" stroke={SER.ink} strokeWidth={7} strokeLinejoin="round" />
      {/* cap */}
      <rect x={-r - 8} y={-H} width={W + 16} height={52} rx={10} fill={tones(SER.cap).base} stroke={SER.ink} strokeWidth={6} />
      {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={-r + 2 + i * 20} x2={-r + 2 + i * 20} y1={-H + 8} y2={-H + 44} stroke={tones(SER.cap).core} strokeWidth={4} />)}
      <path d={`M ${-r - 4} ${-H + 8} H ${r + 4}`} stroke="#fff" strokeWidth={4} opacity={0.7} />
      {/* face on the glass */}
      <g transform={`translate(${look * 4} ${eyeY}) rotate(${bp.tilt})`}>
        {[-1, 1].map((s) => (
          <g key={s}>
            <ellipse cx={s * 17} cy={0} rx={13} ry={15 * (1 - blink)} fill="#FFFDF8" stroke={SER.ink} strokeWidth={3.5} />
            <circle cx={s * 17 + look * 5} cy={2} r={6.5 * (1 - blink)} fill={SER.ink} />
            <circle cx={s * 17 + look * 5 - 2} cy={-1} r={2 * (1 - blink)} fill="#fff" />
            <path d={`M ${s * 17 - 12} ${-22 + (s < 0 ? brow : -brow) * 0.3} L ${s * 17 + 12} ${-22 + (s < 0 ? -brow : brow) * 0.3}`} stroke={SER.ink} strokeWidth={4.5} strokeLinecap="round" />
          </g>
        ))}
        <path d={mouth} transform="translate(0 36)" stroke={SER.ink} strokeWidth={4.5} fill={emotion === 'eager' ? '#5A0E18' : 'none'} strokeLinecap="round" />
        {(emotion === 'nervous' || emotion === 'worried') && <path d="M 30 -26 q 5 9 0 14 q -5 -5 0 -14 Z" fill="#BFE8FF" stroke={SER.ink} strokeWidth={2} />}
        {goggles && (
          <g>
            <path d="M -44 -2 H 44" stroke={SER.ink} strokeWidth={9} />
            <path d="M -44 -2 H 44" stroke="#5B3A2A" strokeWidth={5} />
            {[-1, 1].map((s) => <circle key={s} cx={s * 17} cy={0} r={17} fill="#9FD8F0" fillOpacity={0.35} stroke={SER.ink} strokeWidth={5} />)}
            {[-1, 1].map((s) => <path key={`g${s}`} d={`M ${s * 17 - 9} -8 q 5 -5 10 -2`} stroke="#fff" strokeWidth={3} fill="none" />)}
          </g>
        )}
      </g>
      {label && (
        <g transform={`translate(0 ${-H * 0.2})`}>
          <rect x={-r - 3} y={-17} width={W + 6} height={34} fill={SER.paper} stroke={SER.ink} strokeWidth={3.5} />
          <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={Math.min(20, (W - 4) / (label.length * 0.62))} fill={SER.ink}>{label}</text>
        </g>
      )}
      <RimLight d={`M ${r - 4} ${-H + 50} L ${r - 4} ${-r}`} w={4} opacity={0.45} color={SER.apricot} />
    </g>
  );
};

/**
 * CargoDrone, a plain twin-engine high-wing cargo drone. NO face, no eyes, no decals.
 * view 'side': origin at the main gear contact point, about 520 long at scale 1.
 * view 'top': origin at the centre, wingspan about 620 at scale 1 (a silhouette or shadow on a map).
 */
export const CargoDrone: React.FC<{
  f: number; x: number; y: number; scale?: number; facing?: 1 | -1; view?: 'side' | 'top'; prop?: number; rot?: number;
  shadowOnly?: boolean; gear?: boolean; rim?: string; groundY?: number; doors?: number;
}> = ({f, x, y, scale = 1, facing = 1, view = 'side', prop = 1, rot = 0, shadowOnly = false, gear = true, rim = SER.apricot, groundY, doors = 0}) => {
  const id = uid('drone');
  const t = tones(SER.drone);
  if (view === 'top') {
    const c = shadowOnly ? SER.ink : t.base;
    const op = shadowOnly ? 0.35 : 1;
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={op}>
        <path d="M -40 -20 L 230 -16 Q 262 0 230 16 L -40 20 L -236 10 L -236 -10 Z" fill={c} stroke={shadowOnly ? 'none' : SER.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={-10} y={-310} width={86} height={620} rx={18} fill={c} stroke={shadowOnly ? 'none' : SER.ink} strokeWidth={6} />
        <path d="M -230 -90 L -170 -90 L -170 90 L -230 90 Z" fill={c} stroke={shadowOnly ? 'none' : SER.ink} strokeWidth={5} />
        {[-130, 130].map((s) => (
          <g key={s}>
            <rect x={46} y={s - 18} width={86} height={36} rx={14} fill={shadowOnly ? c : t.core} stroke={shadowOnly ? 'none' : SER.ink} strokeWidth={5} />
            {!shadowOnly && <ellipse cx={138} cy={s} rx={10} ry={58} fill="#fff" opacity={0.4} transform={`rotate(${(f * 47) % 30 - 15} 138 ${s})`} />}
          </g>
        ))}
        {!shadowOnly && <path d="M 0 -296 L 0 296" stroke={t.key} strokeWidth={6} opacity={0.6} />}
      </g>
    );
  }
  const spin = (f * 61 * prop) % 360;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale * facing} ${scale})`}>
      <defs><FormGradient id={`${id}-b`} t={t} /></defs>
      {groundY !== undefined && <ContactShadow cx={0} cy={(groundY - y) / scale} rx={240} ry={18} opacity={0.4} />}
      {/* tail */}
      <path d="M -270 -96 L -232 -96 L -208 -40 L -250 -40 Z" fill={t.core} stroke={SER.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -286 -52 L -196 -52 L -196 -42 L -286 -42 Z" fill={t.shade} stroke={SER.ink} strokeWidth={5} />
      {/* the far engine, behind the fuselage */}
      <rect x={50} y={-92} width={92} height={26} rx={12} fill={t.shade} stroke={SER.ink} strokeWidth={5} />
      <ellipse cx={152} cy={-79} rx={7} ry={34} fill="#fff" opacity={0.18 + 0.15 * prop} />
      {/* fuselage pod: a windowless cargo body with a sensor ball at the nose */}
      <path d="M -250 -60 L 150 -78 Q 236 -72 250 -36 Q 246 -6 200 0 L -60 0 L -250 -40 Z" fill={`url(#${id}-b)`} stroke={SER.ink} strokeWidth={7} strokeLinejoin="round" />
      <path d="M 226 -24 L 246 -24 L 246 -6 L 226 -6 Z" fill={t.shade} stroke={SER.ink} strokeWidth={3} />
      {[-170, -90, -10, 70].map((dx) => <path key={dx} d={`M ${dx} ${-70 + (dx + 250) * 0.02} L ${dx + 6} ${-4}`} stroke={t.core} strokeWidth={3} />)}
      <path d={`M -150 -6 L -10 -6`} stroke={SER.ink} strokeWidth={4} />
      <rect x={-140} y={-10 + doors * 10} width={120} height={10} rx={3} fill={t.core} stroke={SER.ink} strokeWidth={3} />
      {[-200, -120, -40, 40, 120].map((dx) => <circle key={`r${dx}`} cx={dx} cy={-58 + (dx + 250) * 0.02} r={2.6} fill={SER.ink} opacity={0.5} />)}
      {/* high wing, seen edge on, with struts */}
      <path d="M -80 -112 L 160 -116 L 170 -94 L -80 -90 Z" fill={t.key} stroke={SER.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -60 -90 L -60 -76 M 140 -94 L 140 -78" stroke={SER.ink} strokeWidth={5} />
      {/* the near engine nacelle slung UNDER the high wing, prop disc */}
      <rect x={20} y={-96} width={110} height={32} rx={15} fill={t.core} stroke={SER.ink} strokeWidth={6} />
      <ellipse cx={140} cy={-80} rx={9} ry={42} fill="#fff" opacity={0.28 + 0.2 * prop} stroke={SER.ink} strokeWidth={2} strokeOpacity={0.5} />
      <line x1={140} y1={-80 - 38 * Math.cos((spin * Math.PI) / 180)} x2={140} y2={-80 + 38 * Math.cos((spin * Math.PI) / 180)} stroke={SER.ink} strokeWidth={5} opacity={prop > 0.6 ? 0.25 : 0.9} />
      <circle cx={140} cy={-80} r={7} fill={SER.steel} stroke={SER.ink} strokeWidth={3} />
      {/* gear */}
      {gear && (
        <g>
          <path d="M -10 0 L -24 -2 L -30 0 M -20 -2 L -20 -12" stroke={SER.ink} strokeWidth={6} />
          <circle cx={-26} cy={-14} r={15} fill="#2A2630" stroke={SER.ink} strokeWidth={4} transform="translate(0 14)" />
          <path d="M 196 -2 L 196 -14" stroke={SER.ink} strokeWidth={6} />
          <circle cx={196} cy={0} r={12} fill="#2A2630" stroke={SER.ink} strokeWidth={4} />
        </g>
      )}
      <RimLight d="M -250 -60 L 150 -78 Q 236 -72 250 -36" w={4} opacity={0.6} color={rim} />
      <RimLight d="M -80 -112 L 160 -116" w={3} opacity={0.6} color={rim} />
    </g>
  );
};

/**
 * RadarEye: detect-and-avoid as PLANNED. Drawn ENTIRELY in phosphor dashes with a plum keyline, one eye,
 * and a PLANNED tag in every frame. Origin at the base. About 160 tall at scale 1.
 *  - march 0..1  the dashes march (time is enough; this adds a push)
 *  - sweep 0..1  a dashed scan arc opens from the dish
 *  - ghost 0..1  fades the whole thing (it passes through things)
 */
export const RadarEye: React.FC<{f: number; x: number; y: number; scale?: number; emotion?: 'eager' | 'shy' | 'steady'; cues?: number[]; seed?: number; sweep?: number; ghost?: number; tag?: boolean; onSnow?: boolean; look?: number}> =
({f, x, y, scale = 1, emotion = 'steady', cues, seed = 5, sweep = 0, ghost = 1, tag = true, onSnow = false, look = 0}) => {
  const bp = beatPose(f, seed, cues, 160);
  const g = onSnow ? SER.phosD : SER.phos;
  const off = -((f * 1.6) % 22);
  const dash = (d: string, w = 5) => (
    <g>
      <path d={d} fill="none" stroke={SER.ink} strokeWidth={w + 6} strokeDasharray="12 10" strokeDashoffset={off} strokeLinecap="round" />
      <path d={d} fill="none" stroke={g} strokeWidth={w} strokeDasharray="12 10" strokeDashoffset={off} strokeLinecap="round" />
    </g>
  );
  const tilt = -14 + 10 * Math.sin(f / 21 + seed) + bp.tilt;
  const blink = ((f + seed * 29) % 96) < 4 ? 0.2 : 1;
  return (
    <g transform={`translate(${x} ${y - bp.dip}) scale(${scale}) rotate(${bp.skew * 0.5})`} opacity={ghost}>
      {dash('M -40 0 L 40 0', 7)}
      {dash('M 0 0 L 0 -70', 8)}
      <g transform={`translate(0 -78) rotate(${tilt})`}>
        <path d="M -80 -20 Q 0 70 80 -20 Z" fill={g} opacity={0.28} />
        <path d="M -80 -20 Q 0 70 80 -20 Z" fill="none" stroke={SER.ink} strokeWidth={12} strokeDasharray="14 9" strokeDashoffset={off} strokeLinejoin="round" />
        <path d="M -80 -20 Q 0 70 80 -20 Z" fill="none" stroke={g} strokeWidth={6} strokeDasharray="14 9" strokeDashoffset={off} strokeLinejoin="round" />
        <g transform={`translate(${look * 6} 14)`}>
          <circle cx={0} cy={0} r={15} fill={SER.paper} opacity={0.9} />
          <circle cx={0} cy={0} r={15} fill="none" stroke={SER.ink} strokeWidth={5} />
          <circle cx={look * 4} cy={1} r={7 * blink} fill={SER.ink} />
          {emotion === 'eager' && <path d="M -12 -22 L 12 -24" stroke={SER.ink} strokeWidth={4} strokeLinecap="round" />}
          {emotion === 'shy' && <path d="M -12 -24 L 12 -20" stroke={SER.ink} strokeWidth={4} strokeLinecap="round" />}
        </g>
        {sweep > 0 && (
          <g>
            <path d={`M 0 -20 L ${-120 * sweep} ${-20 - 230 * sweep} A ${260 * sweep} ${260 * sweep} 0 0 1 ${120 * sweep} ${-20 - 230 * sweep} Z`} fill={g} opacity={0.16} />
            {dash(`M ${-120 * sweep} ${-20 - 230 * sweep} A ${260 * sweep} ${260 * sweep} 0 0 1 ${120 * sweep} ${-20 - 230 * sweep}`, 4)}
          </g>
        )}
      </g>
      {tag && <Tag x={0} y={36} text="PLANNED" size={20} fill={SER.paper} />}
    </g>
  );
};

/** points on a closed loop (an ellipse) starting at angle a0 */
export function loopPts(cx: number, cy: number, rx: number, ry: number, n = 48, a0 = Math.PI / 2): [number, number][] {
  return Array.from({length: n}, (_, i) => {
    const a = a0 + (i / (n - 1)) * Math.PI * 2;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as [number, number];
  });
}
/** points along a straight line */
export function linePts(x0: number, y0: number, x1: number, y1: number, n = 48): [number, number][] {
  return Array.from({length: n}, (_, i) => [x0 + ((x1 - x0) * i) / (n - 1), y0 + ((y1 - y0) * i) / (n - 1)] as [number, number]);
}
/** blend two equal-length point lists */
export function morphPts(a: [number, number][], b: [number, number][], t: number): [number, number][] {
  return a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t] as [number, number]);
}

/**
 * Ribbon: the scarlet throughline, a thick inked strip along a polyline.
 *  - reveal 0..1   how much of it is drawn from the start
 *  - dashFrom 0..1 the fraction past which it is drawn dashed (PLANNED), 1 = all solid
 *  - fray          a frayed end at the tip
 */
export const Ribbon: React.FC<{f: number; pts: [number, number][]; w?: number; reveal?: number; dashFrom?: number; fray?: boolean; seed?: number; wobble?: number}> =
({f, pts, w = 16, reveal = 1, dashFrom = 1, fray = false, seed = 1, wobble = 2}) => {
  const P = pts.map(([px, py], i) => [px + wobble * Math.sin(f / 9 + i * 0.7 + seed), py + wobble * Math.cos(f / 11 + i * 0.5 + seed)] as [number, number]);
  const n = Math.max(2, Math.round(P.length * clamp01(reveal)));
  const cut = Math.max(1, Math.round(n * clamp01(dashFrom)));
  const toD = (arr: [number, number][]) => arr.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const solid = P.slice(0, cut);
  const dashed = P.slice(cut - 1, n);
  const tip = P[n - 1];
  const prev = P[Math.max(0, n - 2)];
  const ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
  return (
    <g>
      <path d={toD(P.slice(0, n))} fill="none" stroke="#000" strokeOpacity={0.25} strokeWidth={w + 6} transform="translate(5 7)" strokeLinejoin="round" strokeLinecap="round" />
      {solid.length > 1 && (
        <g>
          <path d={toD(solid)} fill="none" stroke={SER.ink} strokeWidth={w + 7} strokeLinejoin="round" strokeLinecap="round" />
          <path d={toD(solid)} fill="none" stroke={SER.ribbon} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
          <path d={toD(solid)} fill="none" stroke={SER.ribbonL} strokeWidth={w * 0.22} strokeLinejoin="round" opacity={0.8} transform={`translate(${-w * 0.18} ${-w * 0.18})`} />
        </g>
      )}
      {n > cut && dashed.length > 1 && (
        <g>
          <path d={toD(dashed)} fill="none" stroke={SER.ink} strokeWidth={w + 7} strokeDasharray={`${w * 1.6} ${w * 1.1}`} strokeLinecap="round" />
          <path d={toD(dashed)} fill="none" stroke={SER.ribbon} strokeWidth={w} strokeDasharray={`${w * 1.6} ${w * 1.1}`} strokeLinecap="round" opacity={0.85} />
        </g>
      )}
      {fray && (
        <g transform={`translate(${tip[0]} ${tip[1]}) rotate(${(ang * 180) / Math.PI})`}>
          {[-1, 0, 1].map((k) => (
            <path key={k} d={`M 0 ${k * w * 0.3} q ${w * 0.8} ${k * w * 0.4 + 3 * Math.sin(f / 5 + k)} ${w * 1.4} ${k * w * 0.7}`} stroke={SER.ribbon} strokeWidth={w * 0.28} fill="none" strokeLinecap="round" />
          ))}
        </g>
      )}
    </g>
  );
};

/** SightBubble: a dome of what the pilot can see, phosphor dashed edge and a faint fill. Origin at the dome's base centre. */
export const SightBubble: React.FC<{f: number; cx: number; cy: number; r: number; p?: number; squash?: number; onSnow?: boolean; strain?: number}> =
({f, cx, cy, r, p = 1, squash = 0.62, onSnow = false, strain = 0}) => {
  const g = onSnow ? SER.phosD : SER.phos;
  const R = r * clamp01(p);
  const pulse = 1 + 0.012 * Math.sin(f / 10) + 0.05 * strain * Math.sin(f / 2.2);
  const d = `M ${-R} 0 A ${R} ${R * squash} 0 0 1 ${R} 0`;
  const off = -((f * 1.2) % 30);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${pulse})`} opacity={clamp01(p * 2)}>
      <path d={`${d} Z`} fill={g} opacity={0.1} />
      <path d={d} fill="none" stroke={SER.ink} strokeWidth={10} strokeDasharray="18 12" strokeDashoffset={off} />
      <path d={d} fill="none" stroke={g} strokeWidth={5} strokeDasharray="18 12" strokeDashoffset={off} />
      <ellipse cx={0} cy={0} rx={R} ry={R * 0.12} fill="none" stroke={g} strokeWidth={3} strokeDasharray="10 10" opacity={0.7} />
    </g>
  );
};

/** ResultTray: a small lab results printer whose output tray stays EMPTY. Origin at the base centre, about 300 wide. */
export const ResultTray: React.FC<{f: number; x: number; y: number; s?: number; hum?: number; seed?: number}> = ({f, x, y, s = 1, hum = 1, seed = 4}) => {
  const id = uid('tray');
  const t = paleTones('#E9E4DA');
  const lamp = ((f + seed * 11) % 40) < 20 ? 1 : 0.35;
  const jig = hum * 1.2 * Math.sin(f / 2.3);
  return (
    <g transform={`translate(${x} ${y + jig}) scale(${s})`}>
      <defs><FormGradient id={`${id}-b`} t={t} /></defs>
      <ContactShadow cx={0} cy={0} rx={170} ry={16} opacity={0.45} />
      <rect x={-150} y={-170} width={300} height={170} rx={18} fill={`url(#${id}-b)`} stroke={SER.ink} strokeWidth={7} />
      <rect x={-110} y={-150} width={220} height={18} rx={9} fill="#2A2630" stroke={SER.ink} strokeWidth={4} />
      <rect x={-96} y={-146} width={192} height={6} fill="#000" />
      <circle cx={118} cy={-104} r={9} fill={lamp > 0.5 ? SER.warm : '#6B5A3A'} stroke={SER.ink} strokeWidth={3} />
      <rect x={-120} y={-96} width={150} height={40} rx={6} fill="#3E4A5E" stroke={SER.ink} strokeWidth={4} />
      {[0, 1, 2].map((k) => <rect key={k} x={-108 + k * 46} y={-82} width={34} height={12} rx={3} fill="#BFE8FF" opacity={0.25 + 0.15 * lamp} />)}
      {/* the empty tray */}
      <path d="M -120 -12 L 120 -12 L 150 30 L -150 30 Z" fill={t.core} stroke={SER.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -112 -4 L 112 -4" stroke="#fff" strokeWidth={4} opacity={0.6} />
      <RimLight d="M -150 -150 L -150 -10" w={4} opacity={0.5} color={SER.warm} />
    </g>
  );
};

/** GroundStation: a console desk with two screens and a mug (mug 0 steaming .. 1 iced). Origin at the floor under the desk centre. */
export const GroundStation: React.FC<{f: number; x: number; y: number; s?: number; mug?: number; clock?: string; loopK?: number; seed?: number}> =
({f, x, y, s = 1, mug = 0, clock = '', loopK = 1, seed = 2}) => {
  const id = uid('gs');
  const d = tones('#4A4456');
  const scr = (f + seed) % 60 < 30 ? 1 : 0.92;
  const lp = loopPts(0, 0, 70, 46, 40, -Math.PI / 2).slice(0, Math.max(2, Math.round(40 * clamp01(loopK))));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><FormGradient id={`${id}-d`} t={d} /></defs>
      <ContactShadow cx={0} cy={0} rx={330} ry={22} opacity={0.5} />
      <rect x={-300} y={-260} width={600} height={40} rx={8} fill={d.key} stroke={SER.ink} strokeWidth={7} />
      <rect x={-280} y={-220} width={560} height={220} fill={`url(#${id}-d)`} stroke={SER.ink} strokeWidth={7} />
      {[-200, 0, 200].map((dx) => <rect key={dx} x={dx - 60} y={-190} width={120} height={70} rx={6} fill={d.core} stroke={SER.ink} strokeWidth={4} />)}
      {/* screens */}
      {[-150, 150].map((dx, i) => (
        <g key={dx} transform={`translate(${dx} -380)`}>
          <rect x={-128} y={-96} width={256} height={176} rx={10} fill="#2A2630" stroke={SER.ink} strokeWidth={7} />
          <rect x={-114} y={-84} width={228} height={150} rx={4} fill={i === 0 ? '#1E3326' : '#2B2340'} opacity={scr} />
          <rect x={-10} y={80} width={20} height={40} fill={d.core} stroke={SER.ink} strokeWidth={4} />
          {i === 0 ? (
            <g>
              <path d={lp.map((p, k) => `${k ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ')} fill="none" stroke={SER.ribbon} strokeWidth={10} strokeLinecap="round" />
              <circle cx={0} cy={46} r={7} fill={SER.warm} stroke={SER.ink} strokeWidth={2} />
              <text x={0} y={-60} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={15} fill="#CFE8D6">NENANA</text>
            </g>
          ) : (
            <g>
              {[0, 1, 2, 3].map((k) => <rect key={k} x={-96} y={-66 + k * 30} width={60 + 80 * h01(k + Math.floor(f / 20), seed)} height={14} fill="#8FD0FF" opacity={0.55} />)}
              {clock && <text x={0} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill="#FFE7B0">{clock}</text>}
            </g>
          )}
        </g>
      ))}
      {/* mug */}
      <g transform="translate(220 -260)">
        <path d="M -24 0 L -20 -52 L 20 -52 L 24 0 Z" fill="#C85A3A" stroke={SER.ink} strokeWidth={5} />
        {mug < 0.5 && <ellipse cx={0} cy={-48} rx={18} ry={4} fill="#4A2416" />}
        <path d="M 22 -40 q 18 0 16 16 q -2 12 -18 10" fill="none" stroke={SER.ink} strokeWidth={5} />
        {mug < 0.5 && [0, 1, 2].map((k) => (
          <path key={k} d={`M ${-10 + k * 10} -58 q ${6 * Math.sin(f / 8 + k)} -16 0 -32`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.6 * (1 - mug * 2)} />
        ))}
        {mug >= 0.5 && <path d="M -18 -8 L 18 -8" stroke="#5A2E1E" strokeWidth={4} opacity={0.6} />}
      </g>
      <RimLight d="M -300 -260 L 300 -260" w={4} opacity={0.5} color={SER.apricot} />
    </g>
  );
};

/** Village: a row of snow roofs, a clinic with a warm window and a CLINIC sign, a short runway with edge markers. Origin at ground centre. */
export const Village: React.FC<{f: number; x: number; y: number; s?: number; glow?: number; seed?: number; runway?: boolean; sign?: boolean; lit?: boolean}> = ({f, x, y, s = 1, glow = 1, seed = 7, runway = true, sign = true, lit = true}) => {
  const houses = [-420, -300, -170, 190, 320, 440];
  const cols = ['#6E4A55', '#4F5A6A', '#7A5A3E', '#5A4A6A', '#6A5048', '#4E5E58'];
  const flick = 0.9 + 0.1 * Math.sin(f / 7 + seed);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {runway && (
        <g>
          <path d="M -520 40 L 520 40 L 600 120 L -600 120 Z" fill="#B8A9C4" stroke={SER.ink} strokeWidth={5} />
          {[-480, -320, -160, 0, 160, 320, 480].map((dx) => <circle key={dx} cx={dx} cy={56} r={6} fill={lit ? SER.warm : 'none'} opacity={lit ? 0.6 + 0.4 * Math.sin(f / 6 + dx) : 0.9} stroke={lit ? SER.ink : SER.phosD} strokeWidth={lit ? 2 : 3} strokeDasharray={lit ? undefined : '4 3'} />)}
        </g>
      )}
      {houses.map((hx, i) => {
        const w = 96 + 20 * h01(i, seed), h = 70 + 16 * h01(i + 3, seed);
        return (
          <g key={hx} transform={`translate(${hx} 0)`}>
            <ContactShadow cx={0} cy={0} rx={w * 0.7} ry={8} opacity={0.35} />
            <rect x={-w / 2} y={-h} width={w} height={h} fill={cols[i]} stroke={SER.ink} strokeWidth={5} />
            <path d={`M ${-w / 2 - 14} ${-h} L 0 ${-h - 52} L ${w / 2 + 14} ${-h} Z`} fill="#EEE8F4" stroke={SER.ink} strokeWidth={5} strokeLinejoin="round" />
            <rect x={-16} y={-h + 18} width={30} height={26} fill={SER.warm} opacity={0.75 * flick} stroke={SER.ink} strokeWidth={3} />
            <rect x={w / 4 - 6} y={-h - 64} width={14} height={30} fill="#5A5060" stroke={SER.ink} strokeWidth={3} />
            <path d={`M ${w / 4 + 1} ${-h - 70} q ${8 * Math.sin(f / 9 + i)} -20 0 -40`} stroke="#EEE" strokeWidth={6} fill="none" opacity={0.5} />
          </g>
        );
      })}
      {/* the clinic */}
      <g>
        <ContactShadow cx={0} cy={0} rx={140} ry={12} opacity={0.4} />
        <rect x={-110} y={-140} width={220} height={140} fill="#E9DFCF" stroke={SER.ink} strokeWidth={6} />
        <path d="M -128 -140 L 0 -196 L 128 -140 Z" fill="#EEE8F4" stroke={SER.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={-84} y={-104} width={70} height={56} fill={SER.warm} stroke={SER.ink} strokeWidth={4} opacity={0.95} />
        <rect x={-84} y={-104} width={70} height={56} fill="#FFF3C0" opacity={0.35 * glow * flick} />
        <ellipse cx={-49} cy={-76} rx={120 * glow} ry={70 * glow} fill={SER.warm} opacity={0.14 * glow} />
        <rect x={20} y={-90} width={56} height={90} fill="#6E5A4A" stroke={SER.ink} strokeWidth={4} />
        {sign && <Tag x={0} y={-166} text="CLINIC" size={18} />}
      </g>
    </g>
  );
};

/** SampleFridge: a small lab fridge with a glass door and a cool glow; children sit on its shelf (shelf at local y -150). Origin at the floor. */
export const SampleFridge: React.FC<{f: number; x: number; y: number; s?: number; open?: number; children?: React.ReactNode}> = ({f, x, y, s = 1, open = 0, children}) => {
  const id = uid('fr');
  const t = paleTones('#E6E9EE');
  const hum = 0.6 * Math.sin(f / 3.1);
  return (
    <g transform={`translate(${x} ${y + hum}) scale(${s})`}>
      <defs><FormGradient id={`${id}-b`} t={t} /></defs>
      <ContactShadow cx={0} cy={0} rx={150} ry={14} opacity={0.45} />
      <rect x={-130} y={-420} width={260} height={420} rx={18} fill={`url(#${id}-b)`} stroke={SER.ink} strokeWidth={7} />
      <rect x={-108} y={-396} width={216} height={330} rx={8} fill="#203A4A" stroke={SER.ink} strokeWidth={5} />
      <rect x={-108} y={-396} width={216} height={330} rx={8} fill="#9FE0FF" opacity={0.18 + 0.04 * Math.sin(f / 9)} />
      <path d="M -108 -150 H 108" stroke="#CFE8F4" strokeWidth={6} />
      <g>{children}</g>
      <rect x={-108} y={-396} width={216} height={330} rx={8} fill="#DFF4FF" opacity={0.12} transform={`skewY(${-open * 8})`} />
      <path d="M -96 -380 L -40 -380" stroke="#fff" strokeWidth={6} opacity={0.5} />
      <rect x={90} y={-300} width={10} height={90} rx={5} fill={SER.steel} stroke={SER.ink} strokeWidth={3} />
      <Tag x={0} y={-30} text="KEEP ON GROUND" size={16} />
    </g>
  );
};

/** Train1925: a sepia locomotive and one car, side view. Origin at the rail under the front wheel. */
export const Train1925: React.FC<{f: number; x: number; y: number; s?: number; speed?: number}> = ({f, x, y, s = 1, speed = 1}) => {
  const rot = (f * 9 * speed) % 360;
  const wheel = (cx: number, r: number) => (
    <g transform={`translate(${cx} ${-r})`}>
      <circle r={r} fill={SER.sepiaD} stroke={SER.ink} strokeWidth={5} />
      <g transform={`rotate(${rot})`}>{[0, 60, 120].map((a) => <line key={a} x1={0} y1={-r + 4} x2={0} y2={r - 4} stroke={SER.sepiaL} strokeWidth={3} transform={`rotate(${a})`} />)}</g>
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -520 0 H 140" stroke={SER.ink} strokeWidth={6} />
      <rect x={-500} y={-150} width={230} height={120} rx={6} fill={SER.sepia} stroke={SER.ink} strokeWidth={6} />
      <text x={-385} y={-82} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={SER.ink} opacity={0.7}>ALASKA RR</text>
      {wheel(-460, 24)}{wheel(-310, 24)}
      <rect x={-240} y={-130} width={240} height={90} rx={30} fill={SER.sepia} stroke={SER.ink} strokeWidth={6} />
      <rect x={-250} y={-200} width={90} height={160} fill={SER.sepiaD} stroke={SER.ink} strokeWidth={6} />
      <rect x={-60} y={-190} width={40} height={64} fill={SER.sepiaD} stroke={SER.ink} strokeWidth={6} />
      <path d="M 0 -40 L 60 0 L 0 0 Z" fill={SER.sepiaD} stroke={SER.ink} strokeWidth={5} />
      {wheel(-200, 34)}{wheel(-120, 34)}{wheel(-40, 22)}
      {[0, 1, 2, 3].map((k) => {
        const ph = ((f * 0.04 * speed + k * 0.25) % 1);
        return <circle key={k} cx={-40 - 160 * ph} cy={-200 - 120 * ph} r={18 + 40 * ph} fill={SER.sepiaL} opacity={0.7 * (1 - ph)} stroke={SER.ink} strokeWidth={2} strokeOpacity={0.3 * (1 - ph)} />;
      })}
    </g>
  );
};

/** Engine1925: a little old engine on a stand that shivers; drop 0..1 a sweat drop falls and freezes into an icicle mid-air. Origin at the stand base. */
export const Engine1925: React.FC<{f: number; x: number; y: number; s?: number; drop?: number; shiver?: number}> = ({f, x, y, s = 1, drop = 0, shiver = 1}) => {
  const jx = shiver * 3 * Math.sin(f * 1.7);
  const dy = 60 * Math.min(1, drop * 1.6);
  const frozen = drop > 0.62;
  return (
    <g transform={`translate(${x + jx} ${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={0} rx={130} ry={12} opacity={0.4} />
      <path d="M -90 0 L -70 -60 L 70 -60 L 90 0 Z" fill={SER.sepiaD} stroke={SER.ink} strokeWidth={6} />
      <circle cx={0} cy={-150} r={96} fill={SER.sepiaD} stroke={SER.ink} strokeWidth={7} />
      <circle cx={0} cy={-150} r={86} fill={SER.sepia} stroke={SER.ink} strokeWidth={5} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => {
        const a = (k / 9) * Math.PI * 2;
        return <g key={k} transform={`rotate(${(a * 180) / Math.PI} 0 -150)`}><rect x={-18} y={-150 - 116} width={36} height={46} rx={16} fill={SER.sepiaL} stroke={SER.ink} strokeWidth={4} />{[0, 1, 2].map((q) => <line key={q} x1={-16} x2={16} y1={-150 - 106 + q * 12} y2={-150 - 106 + q * 12} stroke={SER.sepiaD} strokeWidth={3} />)}</g>;
      })}
      <circle cx={0} cy={-150} r={30} fill={SER.sepiaD} stroke={SER.ink} strokeWidth={5} />
      <g transform={`rotate(${shiver * 4 * Math.sin(f / 3)} 0 -150)`}>
        <path d="M -14 -150 Q -34 -290 0 -330 Q 30 -290 14 -150 Z" fill="#6A4A2C" stroke={SER.ink} strokeWidth={6} />
        <path d="M -14 -150 Q -34 -10 0 30 Q 30 -10 14 -150 Z" fill="#6A4A2C" stroke={SER.ink} strokeWidth={6} />
        <path d="M -6 -300 Q -12 -230 -6 -170" stroke={SER.sepiaL} strokeWidth={4} fill="none" />
      </g>
      <circle cx={0} cy={-150} r={12} fill={SER.ink} />
      {[-40, -10, 22, 50].map((ix, k) => <path key={k} d={`M ${ix} -66 l 6 ${18 + 10 * h01(k)} l 6 ${-18 - 10 * h01(k)}`} fill="#EAF2F8" stroke={SER.ink} strokeWidth={2.5} />)}
      {drop > 0 && (frozen ? (
        <path d={`M 60 ${-120 + dy} l 8 0 l -4 26 Z`} fill="#DFF2FF" stroke={SER.ink} strokeWidth={2.5} />
      ) : (
        <path d={`M 64 ${-126 + dy} q 6 10 0 14 q -6 -4 0 -14 Z`} fill="#BFE8FF" stroke={SER.ink} strokeWidth={2.5} />
      ))}
    </g>
  );
};

/**
 * DuskWorld: the long Interior dusk on the river ice. Sky apricot low to plum high, the Alaska Range,
 * a spruce line, ice to the bottom of the frame with drifts. `horizon` is the ice line in frame px.
 */
export type NearKind = 'stakes' | 'rails' | 'ruts' | 'gravel' | 'sastrugi' | 'lights' | 'berm' | 'none';
export const DuskWorld: React.FC<{f: number; seed?: number; horizon?: number; sun?: number; stars?: number; drifts?: boolean; summer?: boolean; near?: NearKind; children?: React.ReactNode}> =
({f, seed = 1, horizon = 1060, sun = 1, stars = 0.6, drifts = true, summer = false, near = 'stakes', children}) => {
  const id = uid(`dusk${seed}`);
  const range = Array.from({length: 13}, (_, i) => {
    const x = -60 + i * 100;
    const h = 120 + 150 * h01(i, seed);
    return `L ${x} ${horizon - 40 - h} L ${x + 50} ${horizon - 40 - h * 0.55}`;
  }).join(' ');
  const drift = 14 * Math.sin(f / 90 + seed);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={SER.night} /><stop offset="0.38" stopColor={SER.plum} /><stop offset="0.66" stopColor={SER.mauve} />
          <stop offset="0.86" stopColor={SER.apricot} /><stop offset="1" stopColor={SER.apricotL} />
        </linearGradient>
        <linearGradient id={`${id}-ice`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={summer ? '#C9B07A' : SER.peach} /><stop offset="0.35" stopColor={summer ? '#8FA36A' : SER.snow} /><stop offset="1" stopColor={summer ? '#5E7A48' : SER.snowD} />
        </linearGradient>
      </defs>
      <rect x={-60} y={-60} width={1200} height={horizon + 60} fill={`url(#${id}-sky)`} data-band="ok" />
      {Array.from({length: 40}, (_, i) => (
        <circle key={i} cx={h01(i, seed) * 1080} cy={h01(i + 50, seed) * horizon * 0.45} r={1.4 + 1.6 * h01(i + 9, seed)} fill="#FFF6E8"
          opacity={stars * (0.4 + 0.6 * Math.abs(Math.sin(f / 30 + i)))} />
      ))}
      {sun > 0 && <ellipse cx={240 + drift} cy={horizon - 60} rx={260} ry={90} fill={SER.apricotL} opacity={0.35 * sun} />}
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M ${-100 + ((f * (0.3 + k * 0.15) + k * 400) % 1300)} ${horizon * (0.28 + k * 0.12)} q 90 -24 180 0 q 60 -14 120 4`} fill="none" stroke={SER.apricotL} strokeWidth={10 - k * 2} opacity={0.25} strokeLinecap="round" />
      ))}
      <path d={`M -60 ${horizon - 40} ${range} L 1140 ${horizon - 40} Z`} fill="#6E5B80" stroke={SER.ink} strokeWidth={4} opacity={0.95} transform={`translate(${drift * 0.3} 0)`} />
      {!summer && <path d={`M -60 ${horizon - 40} ${range} L 1140 ${horizon - 40} Z`} fill="#F6E6F0" opacity={0.35} transform={`translate(${drift * 0.3} 0) scale(1 1)`} clipPath={`inset(0 0 60% 0)`} />}
      {Array.from({length: 34}, (_, i) => {
        const x = -40 + i * 34 + 10 * h01(i, seed);
        const h = 40 + 46 * h01(i + 20, seed);
        return <path key={i} d={`M ${x} ${horizon} L ${x + 14} ${horizon - h} L ${x + 28} ${horizon} Z`} fill={summer ? (i % 4 === 0 ? '#6E8A3A' : '#2F5A3A') : SER.spruce} stroke={SER.ink} strokeWidth={2} transform={`translate(${drift * 0.6} 0)`} />;
      })}
      <rect x={-60} y={horizon} width={1200} height={1920 - horizon + 60} fill={`url(#${id}-ice)`} data-band="ok" />
      {Array.from({length: 7}, (_, i) => (
        <path key={i} d={`M ${-40 + i * 170} ${horizon + 60 + i * 37 % 120} q 90 -8 180 0`} stroke="#fff" strokeWidth={3} opacity={0.35} fill="none" />
      ))}
      {children}
      {drifts && Array.from({length: 6}, (_, i) => {
        const x = -60 + i * 190 + 70 * h01(i, seed + 3);
        const w = 150 + 120 * h01(i + 2, seed);
        const yy = 1770 + 70 * h01(i + 4, seed);
        const fill = summer ? (i % 2 ? '#4E6A3A' : '#5E7A48') : (i % 2 ? '#E7E0EE' : '#D9D0E3');
        return (
          <g key={i} data-band="ok">
            <path d={`M ${x} 1960 Q ${x + w * 0.3} ${yy} ${x + w * 0.6} ${yy + 10} Q ${x + w * 0.85} ${yy + 18} ${x + w} 1960 Z`} fill={fill} stroke={SER.ink} strokeWidth={3} />
            {[0, 1].map((k) => <path key={k} d={`M ${x + w * (0.35 + k * 0.2)} ${yy + 14} q ${3 + 2 * Math.sin(f / 20 + k + i)} -18 ${5} -${summer ? 30 : 20}`} stroke={summer ? '#8FA36A' : SER.spruceL} strokeWidth={3} fill="none" />)}
          </g>
        );
      })}
      {drifts && near !== 'none' && (
        <g data-band="ok">
          {near === 'stakes' && Array.from({length: 4}, (_, i) => {
            const x = 120 + i * 280 + 40 * h01(i, seed + 7), y0 = 1570 + 30 * h01(i + 1, seed + 7);
            return <g key={i}><path d={`M ${x} ${y0} L ${x + 4} ${y0 - 110}`} stroke={SER.ink} strokeWidth={9} strokeLinecap="round" /><path d={`M ${x} ${y0} L ${x + 4} ${y0 - 110}`} stroke="#6E5A4A" strokeWidth={5} /></g>;
          })}
          {near === 'rails' && (
            <g>
              {Array.from({length: 12}, (_, i) => <rect key={i} x={-60 + i * 100} y={1580 + (i % 2) * 4} width={70} height={22} rx={3} fill="#6A4A2C" stroke={SER.ink} strokeWidth={3} transform={`skewX(-20)`} />)}
              <path d="M -60 1585 L 1140 1585 M -60 1610 L 1140 1610" stroke={SER.ink} strokeWidth={8} />
              <path d="M -60 1585 L 1140 1585 M -60 1610 L 1140 1610" stroke="#9A8A7A" strokeWidth={4} />
            </g>
          )}
          {near === 'ruts' && (
            <g>
              {[0, 1].map((k) => <path key={k} d={`M -60 ${1560 + k * 34} C 300 ${1530 + k * 30}, 700 ${1610 + k * 30}, 1140 ${1570 + k * 34}`} stroke={SER.snowD} strokeWidth={12} fill="none" />)}
              {Array.from({length: 5}, (_, i) => <path key={i} d={`M ${-40 + i * 260} 1700 l 60 -50 l 50 30 l 70 -40 l 40 60 Z`} fill="#E9E2F0" stroke={SER.ink} strokeWidth={3} />)}
            </g>
          )}
          {near === 'gravel' && (
            <g>
              <path d="M -60 1520 L 1140 1520 L 1140 1600 L -60 1600 Z" fill="#9A8E86" stroke={SER.ink} strokeWidth={3} />
              {Array.from({length: 40}, (_, i) => <circle key={i} cx={h01(i, seed) * 1100} cy={1530 + h01(i + 3, seed) * 60} r={3 + 3 * h01(i + 6, seed)} fill={i % 2 ? '#7A6E68' : '#B8ACA4'} stroke={SER.ink} strokeWidth={1.5} />)}
              {Array.from({length: 9}, (_, i) => {
                const x = 40 + i * 120 + 30 * h01(i, seed + 2), y0 = 1660 + 40 * h01(i + 1, seed + 2), sw = 3 * Math.sin(f / 18 + i);
                return <g key={`fw${i}`}><path d={`M ${x} ${y0} q ${sw} -50 ${sw * 2} -96`} stroke="#3E6A3A" strokeWidth={4} fill="none" />{[0, 1, 2, 3].map((k) => <circle key={k} cx={x + sw * 2 * (k / 4 + 0.6)} cy={y0 - 60 - k * 10} r={6} fill="#D0508A" stroke={SER.ink} strokeWidth={1.5} />)}</g>;
              })}
            </g>
          )}
          {near === 'sastrugi' && (
            <g>
              {Array.from({length: 7}, (_, i) => <path key={i} d={`M ${-80 + i * 180} 1640 q 60 -40 140 -10 q 40 14 80 -4 l 0 40 Z`} fill="#E6E0EE" stroke={SER.ink} strokeWidth={3} />)}
              {Array.from({length: 24}, (_, i) => <path key={`sp${i}`} d={`M ${(h01(i, seed) * 1300 + f * 9) % 1300 - 100} ${1560 + h01(i + 2, seed) * 160} q 30 -6 70 0`} stroke="#FFFFFF" strokeWidth={3} opacity={0.7} fill="none" />)}
            </g>
          )}
          {near === 'lights' && (
            <g>
              {Array.from({length: 6}, (_, i) => <g key={i}><ellipse cx={60 + i * 200} cy={1600} rx={80} ry={20} fill={SER.warm} opacity={0.22 + 0.06 * Math.sin(f / 7 + i)} /><rect x={52 + i * 200} y={1560} width={16} height={36} rx={4} fill="#3A3040" stroke={SER.ink} strokeWidth={3} /><circle cx={60 + i * 200} cy={1556} r={9} fill={SER.warm} stroke={SER.ink} strokeWidth={2} /></g>)}
            </g>
          )}
          {near === 'berm' && (
            <g>
              <path d="M -60 1600 Q 300 1520 640 1560 T 1140 1540 L 1140 1700 L -60 1700 Z" fill="#E4DDEC" stroke={SER.ink} strokeWidth={4} />
              {Array.from({length: 10}, (_, i) => <ellipse key={i} cx={420 + i * 46} cy={1640 + (i % 2) * 10} rx={10} ry={5} fill={SER.snowD} />)}
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/**
 * MAP_PT: town positions on AK_PATH's 1000 x 700 draw box. AK_PATH is STYLISED, so these are placed by
 * feature (Nenana a little south-west of Fairbanks in the Interior, Nome on the south shore of the Seward
 * Peninsula, Anchorage at the head of Cook Inlet), never by coordinate.
 */
export const MAP_PT: Record<string, [number, number]> = {
  NENANA: [506, 300], FAIRBANKS: [548, 286], NOME: [236, 404], ANCHORAGE: [494, 424],
};

/** the 1925 trail Nenana to Nome on the map box, a gently wandering polyline along the river country */
export function trailPts(n = 48): [number, number][] {
  const [x0, y0] = MAP_PT.NENANA, [x1, y1] = MAP_PT.NOME;
  return Array.from({length: n}, (_, i) => {
    const t = i / (n - 1);
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + 22 * Math.sin(t * Math.PI * 2.2) * (1 - t * 0.4)] as [number, number];
  });
}

/**
 * MapBoard: a cream paper map of Alaska laid on the ice, seen from above. Draws in the 1000 x 700 map box
 * transformed by (x, y, s). Children are drawn in map-box coordinates (use MAP_PT).
 */
export const MapBoard: React.FC<{f: number; x: number; y: number; s: number; rot?: number; seed?: number; children?: React.ReactNode}> = ({f, x, y, s, rot = 0, seed = 3, children}) => {
  const id = uid('map');
  const curl = 3 * Math.sin(f / 40 + seed);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <defs><clipPath id={`${id}-ak`}><path d={AK_PATH} /></clipPath></defs>
      <rect x={-30} y={-20} width={1060} height={760} rx={6} fill="#000" opacity={0.28} transform="translate(14 18)" />
      <path d={`M -30 -20 L 1030 ${-20 + curl} L 1030 740 L -30 ${740 - curl} Z`} fill={SER.map} stroke={SER.ink} strokeWidth={6 / s} />
      {Array.from({length: 9}, (_, i) => <path key={i} d={`M -30 ${60 + i * 80} H 1030`} stroke={SER.water} strokeWidth={1.5 / s} opacity={0.5} />)}
      {Array.from({length: 13}, (_, i) => <path key={`v${i}`} d={`M ${50 + i * 80} -20 V 740`} stroke={SER.water} strokeWidth={1.5 / s} opacity={0.5} />)}
      <path d={AK_PATH} fill={SER.land} stroke={SER.ink} strokeWidth={5 / s} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-ak)`}>
        <path d="M 870 250 Q 700 230 560 300 Q 420 360 300 400 Q 250 430 210 480" fill="none" stroke={SER.water} strokeWidth={10} opacity={0.9} />
        <path d="M 870 250 Q 700 230 560 300 Q 420 360 300 400 Q 250 430 210 480" fill="none" stroke={SER.sepiaD} strokeWidth={2} opacity={0.5} />
        <path d="M 640 360 Q 580 330 520 305" fill="none" stroke={SER.water} strokeWidth={7} />
        {[[620, 380], [700, 400], [760, 380], [560, 420]].map(([mx, my], i) => <path key={i} d={`M ${mx - 40} ${my} L ${mx} ${my - 34} L ${mx + 40} ${my}`} fill={SER.landD} stroke={SER.ink} strokeWidth={2.5} opacity={0.8} />)}
        <path d={AK_PATH} fill="none" stroke={SER.landD} strokeWidth={22} opacity={0.35} />
      </g>
      <text x={720} y={180} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} fill={SER.ink} opacity={0.35} letterSpacing={6}>ALASKA</text>
      {children}
    </g>
  );
};

/** a map pin with a ring, origin at the point it marks; label drawn by the caller as a Tag */
export const MapPin: React.FC<{f: number; x: number; y: number; s?: number; color?: string; pulse?: number}> = ({f, x, y, s = 1, color = SER.paper, pulse = 1}) => {
  const k = 1 + 0.25 * pulse * ((f % 40) / 40);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={22 * k} fill="none" stroke={SER.ink} strokeWidth={3} opacity={pulse * (1 - (f % 40) / 40)} />
      <circle r={12} fill={color} stroke={SER.ink} strokeWidth={5} />
      <circle r={4} fill={SER.ink} />
    </g>
  );
};

/**
 * Poles: a line of telegraph or power poles with sagging wires across the top of an exterior, so the
 * top of the 1:1 square (master y 420 to 690) carries the set. `sepia` draws the 1925 line.
 */
export const Poles: React.FC<{f: number; y?: number; top?: number; n?: number; x0?: number; gapX?: number; sepia?: boolean; birds?: boolean}> = ({f, y = 1150, top = 470, n = 5, x0 = 60, gapX = 260, sepia = false, birds = true}) => {
  const wood = sepia ? SER.sepiaD : '#4A3C3A';
  const xs = Array.from({length: n}, (_, i) => x0 + i * gapX);
  const sway = 3 * Math.sin(f / 40);
  return (
    <g>
      {[0, 1, 2].map((w) => (
        <path key={w} d={xs.map((x, i) => (i ? `Q ${x - gapX / 2} ${top + 36 + w * 16 + 40 + sway} ${x} ${top + 30 + w * 16}` : `M ${x - gapX} ${top + 30 + w * 16 + 6} Q ${x - gapX / 2} ${top + 76 + w * 16 + sway} ${x} ${top + 30 + w * 16}`)).join(' ')}
          fill="none" stroke={SER.ink} strokeWidth={3} opacity={0.85} />
      ))}
      {xs.map((x, i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={22} ry={6} fill={SER.ink} opacity={0.3} />
          <path d={`M ${x} ${y} L ${x + 3} ${top}`} stroke={SER.ink} strokeWidth={14} strokeLinecap="round" />
          <path d={`M ${x} ${y} L ${x + 3} ${top}`} stroke={wood} strokeWidth={8} strokeLinecap="round" />
          <rect x={x - 46} y={top + 22} width={96} height={12} rx={3} fill={wood} stroke={SER.ink} strokeWidth={3} />
          <rect x={x - 34} y={top + 40} width={72} height={10} rx={3} fill={wood} stroke={SER.ink} strokeWidth={3} />
          {[-38, -12, 14, 40].map((dx) => <circle key={dx} cx={x + dx} cy={top + 20} r={4} fill={sepia ? SER.sepiaL : '#9FB8C0'} stroke={SER.ink} strokeWidth={2} />)}
        </g>
      ))}
      {birds && [0, 1, 2].map((k) => {
        const bx = xs[1] + 40 + k * 26, by = top + 54 + 26 + 4 * Math.sin(f / 20 + k);
        return <path key={`b${k}`} d={`M ${bx - 8} ${by} q 8 ${-8 - 3 * Math.sin(f / 4 + k)} 16 0`} fill={SER.ink} stroke={SER.ink} strokeWidth={2} />;
      })}
    </g>
  );
};
