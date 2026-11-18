import React from 'react';
import {INK} from './Character';
import {tones, ContactShadow} from './lighting';
import {figureIdle} from './figureidle';

// THE CHALKLINE FAMILY (net-new 2026-11-18, "Clear on Size"). A surveyor's chalk-line reel that snaps a
// line through the world, the line itself (dashed chalk, never paint, with a gray end where it can't be
// read), the reel opened as a cutaway of trip pins, sealed paint cans, an unticked parcel slip, a faced
// diesel genset and a chain-link fence. Key light is low on screen RIGHT (a Fairbanks noon sun), so every
// form shades to the left and rims on the right.

export const CHALK = {
  reel: '#E8582A', reelD: '#9C3418', reelRim: '#FFC9A8', brass: '#C9A04A', brassD: '#8A6A26',
  hat: '#5E7A3A', fleece: '#EEEAF4', line: '#2F5FD0', lineL: '#7FA2F0', gray: '#8F9096', grayL: '#C4C5CA',
  canBlack: '#16181D', canWhite: '#F7F7F2', slip: '#EBD9B4', steel: '#6B4A36', genset: '#C98A2E', soot: '#2B2622',
};
const MONO_ = "'JetBrains Mono', monospace";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const uid = (s: string) => 'ck' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const ckMonoW = (s: string, size: number, ls = 1) => s.length * size * 0.602 + ls * Math.max(0, s.length - 1);

export type ChalkyEmotion = 'proud' | 'uneasy' | 'earnest' | 'puzzled' | 'startled' | 'braced' | 'determined' | 'hopeful' | 'sheepish' | 'calm' | 'curious' | 'wary';

/** where Chalky's string leaves his hook, for a reel at (x, y) foot, scale s, facing */
export const chalkyHook = (x: number, y: number, s = 1, facing: 1 | -1 = 1) => ({x: x + 118 * s * facing, y: y - 112 * s});

/**
 * Chalky, the reel. Origin (x, y) is between his boots on the ground. At scale 1 he is about 240 wide and 250 tall.
 *  - crank: turns of the crank handle (continuous, 1 = a full turn)
 *  - skid 0..1: boots braced and sliding, body leaning back against a pull
 *  - sneeze 0..1: a sneeze (squash, then a puff from the hook)
 *  - hop 0..1: a small hop (lift and settle)
 *  - cues: beat frames he performs on (lib/figureidle), like the forest family
 */
export const Chalky: React.FC<{
  f: number; x: number; y: number; scale?: number; facing?: 1 | -1; emotion?: ChalkyEmotion; crank?: number;
  skid?: number; sneeze?: number; hop?: number; look?: number; cues?: number[]; idleGain?: number; seed?: number; hat?: boolean;
}> = ({f, x, y, scale = 1, facing = 1, emotion = 'calm', crank = 0, skid = 0, sneeze = 0, hop = 0, look = 0, cues, idleGain = 1, seed = 3, hat = true}) => {
  const pose = cues && cues.length && idleGain > 0 ? figureIdle(f, seed, idleGain, cues) : null;
  const lean = (pose ? pose.lean * 0.8 + pose.shift * 0.05 : 0) - skid * 14;
  const breath = 1 + 0.022 * Math.sin(f / 12 + seed) + (pose ? (pose.breath - 1) * 0.6 : 0);
  const sn = clamp01(sneeze);
  const snSq = sn < 0.5 ? 1 - 0.12 * Math.sin(sn * 2 * Math.PI) : 1 + 0.08 * Math.sin((sn - 0.5) * 2 * Math.PI);
  const hp = clamp01(hop);
  const lift = -Math.sin(hp * Math.PI) * 60;
  const blink = ((f + seed * 17) % 103) < 4;
  const T = tones(CHALK.reel);
  const B = tones(CHALK.brass);
  const H = tones(CHALK.hat);
  const id = uid(`ch${x}${y}${seed}`);
  const R = 96;
  const cy = -132;
  const eyeX = look * 5 + (pose ? pose.headX * 0.4 : 0);
  const brow = {proud: -3, uneasy: 4, earnest: -1, puzzled: 3, startled: -7, braced: 5, determined: 6, hopeful: -4, sheepish: 2, calm: 0, curious: -3, wary: 4}[emotion];
  const mouth = {
    proud: 'M -16 30 Q 0 44 16 30', uneasy: 'M -12 36 Q 0 30 12 37', earnest: 'M -12 32 Q 0 40 12 32', puzzled: 'M -13 35 Q -2 31 13 37',
    startled: 'M -7 30 Q 0 46 7 30 Q 0 26 -7 30', braced: 'M -14 34 L 14 34', determined: 'M -14 33 Q 0 30 14 33', hopeful: 'M -14 30 Q 0 42 14 30',
    sheepish: 'M -12 34 Q 2 40 12 31', calm: 'M -11 32 Q 0 38 11 32', curious: 'M -8 33 Q 0 40 8 33', wary: 'M -12 36 Q 0 32 12 35',
  }[emotion];
  const ang = crank * Math.PI * 2;
  const hx = 70 * Math.cos(ang), hy = 70 * Math.sin(ang);
  const legL = skid * 22, legR = skid * 30;
  return (
    <g transform={`translate(${x},${y + lift}) scale(${facing * scale},${scale})`}>
      <defs>
        <radialGradient id={id} cx="0.62" cy="0.34" r="0.8">
          <stop offset="0" stopColor={T.key} /><stop offset="0.55" stopColor={T.base} /><stop offset="1" stopColor={T.shade} />
        </radialGradient>
      </defs>
      <ContactShadow cx={0} cy={2} rx={110 * (1 - hp * 0.4)} ry={13} opacity={0.42 * (1 - hp * 0.5)} />
      {/* boots, planted; they splay forward when he braces */}
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${side * 44 + (side < 0 ? legL : legR) * 0.4},0)`}>
          <path d={`M ${-6 + (side < 0 ? legL : legR) * 0.5} -46 L 6 -10`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <path d={`M ${-6 + (side < 0 ? legL : legR) * 0.5} -46 L 6 -10`} stroke="#4A3A2C" strokeWidth={8} strokeLinecap="round" />
          <path d="M -26 0 Q -28 -22 0 -24 Q 30 -24 34 -6 L 34 0 Z" fill="#5A3E2A" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M -18 -18 Q 4 -22 24 -14" stroke="#8A6448" strokeWidth={3} fill="none" />
        </g>
      ))}
      <g transform={`translate(0,${cy}) rotate(${lean}) scale(${breath * (2 - snSq)},${breath * snSq})`}>
        {/* case: a fat disc with a dent */}
        <path d={`M ${-R} 0 A ${R} ${R} 0 1 1 ${R} 0 A ${R} ${R} 0 1 1 ${-R} 0 Z`} fill={`url(#${id})`} stroke={INK} strokeWidth={6} />
        <path d="M -70 -52 Q -58 -60 -48 -54 Q -56 -44 -70 -52 Z" fill={T.shade} stroke={INK} strokeWidth={2.5} opacity={0.9} />
        <path d={`M ${R - 10} -30 A ${R - 8} ${R - 8} 0 0 1 ${R - 26} 52`} stroke={CHALK.reelRim} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.85} />
        <path d={`M ${-R + 14} 26 A ${R - 10} ${R - 10} 0 0 0 -20 ${R - 8}`} stroke={T.shade} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.6} />
        {/* rivets */}
        {[30, 100, 170, 240, 310].map((a) => (
          <circle key={a} cx={(R - 14) * Math.cos((a * Math.PI) / 180)} cy={(R - 14) * Math.sin((a * Math.PI) / 180)} r={4} fill={B.base} stroke={INK} strokeWidth={2} />
        ))}
        {/* hook nose-tip at the front, the string's exit */}
        <g transform={`translate(${R + 6},20)`}>
          <rect x={-10} y={-10} width={22} height={20} rx={4} fill={B.base} stroke={INK} strokeWidth={4} />
          <path d="M 12 0 Q 30 0 28 16 Q 26 26 16 22" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <path d="M 12 0 Q 30 0 28 16 Q 26 26 16 22" fill="none" stroke={B.key} strokeWidth={3.5} strokeLinecap="round" />
        </g>
        {/* face */}
        <g transform={`translate(${eyeX},-6)`}>
          <ellipse cx={-28} cy={-6} rx={15} ry={blink ? 2 : 18} fill="#FFFDF6" stroke={INK} strokeWidth={4} />
          <ellipse cx={26} cy={-6} rx={15} ry={blink ? 2 : 18} fill="#FFFDF6" stroke={INK} strokeWidth={4} />
          {!blink && <circle cx={-24 + look * 4} cy={-2} r={7} fill={INK} />}
          {!blink && <circle cx={30 + look * 4} cy={-2} r={7} fill={INK} />}
          {!blink && <circle cx={-21 + look * 4} cy={-5} r={2.4} fill="#fff" />}
          {!blink && <circle cx={33 + look * 4} cy={-5} r={2.4} fill="#fff" />}
          <path d={`M -44 ${-32 - brow} L -14 ${-30 + brow}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d={`M 12 ${-30 + brow} L 42 ${-32 - brow}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          {/* frost on the brows */}
          <path d={`M -42 ${-36 - brow} L -18 ${-34 + brow}`} stroke="#F4F8FF" strokeWidth={2.5} strokeLinecap="round" opacity={0.9} />
          <path d={`M 16 ${-34 + brow} L 40 ${-36 - brow}`} stroke="#F4F8FF" strokeWidth={2.5} strokeLinecap="round" opacity={0.9} />
          <path d={mouth} fill={emotion === 'startled' ? '#5A1E16' : 'none'} stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={-46} cy={18} rx={10} ry={6} fill="#F28C7A" opacity={0.55} />
          <ellipse cx={44} cy={18} rx={10} ry={6} fill="#F28C7A" opacity={0.55} />
        </g>
        {/* spindle and crank arm on the near side */}
        <circle cx={0} cy={56} r={13} fill={B.base} stroke={INK} strokeWidth={4} />
        <g transform="translate(0,56)">
          <path d={`M 0 0 L ${hx * 0.8} ${hy * 0.5 + 10}`} stroke={INK} strokeWidth={12} strokeLinecap="round" />
          <path d={`M 0 0 L ${hx * 0.8} ${hy * 0.5 + 10}`} stroke={B.base} strokeWidth={6} strokeLinecap="round" />
          <rect x={hx * 0.8 - 8} y={hy * 0.5 + 2} width={16} height={26} rx={6} fill="#3A2A20" stroke={INK} strokeWidth={4} />
        </g>
        {/* earflap hat */}
        {hat && (
          <g transform="translate(0,-78)">
            <path d="M -70 10 Q -66 -46 0 -50 Q 66 -46 70 10 Q 40 -4 0 -4 Q -40 -4 -70 10 Z" fill={H.base} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d="M 40 -38 Q 60 -26 64 2" stroke={H.key} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
            <path d="M -72 6 Q -78 40 -64 56 Q -54 40 -56 10 Z" fill={CHALK.fleece} stroke={INK} strokeWidth={4} transform={`rotate(${Math.sin(f / 9 + seed) * 6} -64 6)`} />
            <path d="M 72 6 Q 78 40 64 56 Q 54 40 56 10 Z" fill={CHALK.fleece} stroke={INK} strokeWidth={4} transform={`rotate(${-Math.sin(f / 9 + seed + 1) * 6} 64 6)`} />
            <circle cx={0} cy={-52} r={13} fill={CHALK.fleece} stroke={INK} strokeWidth={4} />
            <path d="M -66 4 Q 0 -14 66 4" stroke={CHALK.fleece} strokeWidth={9} fill="none" strokeLinecap="round" />
          </g>
        )}
      </g>
      {sn > 0.45 && sn < 1 && <ChalkPuff x={130} y={-112} t={(sn - 0.45) / 0.55} color={CHALK.gray} r={50} f={f} />}
    </g>
  );
};

/** a chalk puff blooming on contact: t 0..1 */
export const ChalkPuff: React.FC<{x: number; y: number; t: number; color?: string; r?: number; f: number; seed?: number}> = ({x, y, t, color = CHALK.lineL, r = 60, f, seed = 1}) => {
  const k = clamp01(t);
  if (k <= 0 || k >= 1) return null;
  const grow = 1 - Math.pow(1 - k, 3);
  const op = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
  return (
    <g transform={`translate(${x},${y})`} opacity={op * 0.85}>
      {Array.from({length: 9}, (_, i) => {
        const a = h01(i, seed) * Math.PI * 2;
        const d = r * grow * (0.4 + h01(i, seed + 3) * 0.8);
        const rr = r * 0.32 * (0.6 + h01(i, seed + 7)) * (0.5 + grow * 0.7);
        return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d * 0.6 - grow * 14 - Math.sin(f / 7 + i) * 2} r={rr} fill={color} stroke={INK} strokeWidth={2} strokeOpacity={0.25} />;
      })}
    </g>
  );
};

/**
 * ChalkLine: a snapped chalk string from (x1,y1) to (x2,y2), drawn DASHED (a recommendation, never paint).
 *  - draw 0..1: how far the snap has travelled from x1 toward x2 (whip wave decays behind the front)
 *  - grayFrom 0..1: fraction of the length after which the chalk turns gray and fuzzy (1 = none)
 *  - sag: px the string droops at its middle (a slack line); taut lines use 0
 *  - fadeEnd 0..1: the last part fades out (lost in fog)
 */
export const ChalkLine: React.FC<{
  f: number; x1: number; y1: number; x2: number; y2: number; draw?: number; grayFrom?: number; sag?: number; fadeEnd?: number;
  width?: number; dash?: number; id?: string; wiggle?: number;
}> = ({f, x1, y1, x2, y2, draw = 1, grayFrom = 1, sag = 0, fadeEnd = 0, width = 9, dash = 34, id = 'cl', wiggle = 0}) => {
  const d = clamp01(draw);
  if (d <= 0.001) return null;
  const N = 48;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    if (u > d + 0.0001) break;
    const behind = d - u;
    const whip = Math.sin(behind * 26) * Math.exp(-behind * 7) * 34 * (d < 1 ? 1 : Math.max(0, 1 - (d - 1)));
    const live = Math.sin(f / 5 + u * 9) * wiggle;
    pts.push([x1 + (x2 - x1) * u, y1 + (y2 - y1) * u + sag * 4 * u * (1 - u) + whip + live]);
  }
  if (pts.length < 2) return null;
  const path = (a: number, b: number) => pts.slice(a, b + 1).map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const gi = Math.min(pts.length - 1, Math.round(grayFrom * N));
  const fi = Math.round((1 - fadeEnd) * N);
  const mid = uid(id + x1 + y2);
  return (
    <g>
      <defs>
        <linearGradient id={mid} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset={Math.max(0, 1 - fadeEnd).toFixed(3)} stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={fadeEnd > 0 ? 0 : 1} />
        </linearGradient>
        <mask id={mid + 'm'}><rect x={-2000} y={-2000} width={6000} height={6000} fill={`url(#${mid})`} /></mask>
      </defs>
      <g mask={fadeEnd > 0 ? `url(#${mid}m)` : undefined}>
        {/* the string under the chalk */}
        <path d={path(0, pts.length - 1)} fill="none" stroke={INK} strokeWidth={width * 0.5} strokeLinecap="round" opacity={0.55} />
        {/* ultramarine chalk dashes */}
        <path d={path(0, gi)} fill="none" stroke={INK} strokeWidth={width + 4} strokeDasharray={`${dash} ${dash * 0.5}`} strokeLinecap="round" />
        <path d={path(0, gi)} fill="none" stroke={CHALK.line} strokeWidth={width} strokeDasharray={`${dash} ${dash * 0.5}`} strokeLinecap="round" />
        <path d={path(0, gi)} fill="none" stroke={CHALK.lineL} strokeWidth={width * 0.3} strokeDasharray={`${dash * 0.6} ${dash * 0.9}`} strokeLinecap="round" opacity={0.8} transform="translate(0,-2)" />
        {/* the gray end: fuzzy, softer, no hard ink */}
        {gi < pts.length - 1 && (
          <>
            <path d={path(gi, pts.length - 1)} fill="none" stroke={CHALK.gray} strokeWidth={width * 2.4} strokeDasharray={`${dash} ${dash * 0.5}`} strokeLinecap="round" opacity={0.28} />
            <path d={path(gi, pts.length - 1)} fill="none" stroke={CHALK.gray} strokeWidth={width} strokeDasharray={`${dash} ${dash * 0.5}`} strokeLinecap="round" opacity={0.9} />
            {pts.slice(gi).filter((_, i) => i % 2 === 0).map((p, i) => (
              <circle key={i} cx={p[0] + Math.sin(f / 11 + i) * 6} cy={p[1] - 8 - ((f / 2 + i * 13) % 26)} r={4 + (i % 3)} fill={CHALK.grayL} opacity={0.5} />
            ))}
          </>
        )}
        {/* chalk dust specks on the blue part */}
        {pts.slice(0, gi + 1).filter((_, i) => i % 3 === 1).map((p, i) => (
          <circle key={'d' + i} cx={p[0] + h01(i, 4) * 10 - 5} cy={p[1] + 9 + h01(i, 5) * 6} r={2.2} fill={CHALK.lineL} opacity={0.6} />
        ))}
      </g>
      {fi < 0 ? null : null}
    </g>
  );
};

/** the reel opened: three labelled trip pins on a spool; tripped[i] 0..1 swings pin i */
export const TripPinCutaway: React.FC<{f: number; x: number; y: number; scale?: number; open?: number; tripped?: number[]; labels?: string[]; spin?: number}> =
({f, x, y, scale = 1, open = 1, tripped = [0, 0, 0], labels = ['5 MW', '40,000 SQ FT', '5 MW ON SITE'], spin = 0}) => {
  const o = clamp01(open);
  if (o <= 0.01) return null;
  const T = tones(CHALK.reel);
  const B = tones(CHALK.brass);
  const R = 300;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * (0.6 + 0.4 * o)})`} opacity={Math.min(1, o * 1.6)}>
      <circle r={R + 18} fill={T.shade} stroke={INK} strokeWidth={8} />
      <circle r={R} fill="#2A1A16" stroke={INK} strokeWidth={6} />
      <circle r={R - 12} fill="none" stroke={T.base} strokeWidth={10} opacity={0.5} />
      {/* spool with wound ultramarine string */}
      <g transform={`rotate(${spin * 360})`}>
        <circle r={120} fill={CHALK.line} stroke={INK} strokeWidth={6} />
        {Array.from({length: 14}, (_, i) => <circle key={i} r={40 + i * 6} fill="none" stroke={i % 2 ? CHALK.lineL : '#22479E'} strokeWidth={2.5} opacity={0.8} />)}
        {[0, 60, 120, 180, 240, 300].map((a) => <path key={a} d="M 0 0 L 0 -120" stroke={INK} strokeWidth={3} opacity={0.4} transform={`rotate(${a})`} />)}
        <circle r={34} fill={B.base} stroke={INK} strokeWidth={5} />
      </g>
      {/* three pins on the rim at left, top, right */}
      {[-140, -90, -40].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const px = (R - 64) * Math.cos(a), py = (R - 64) * Math.sin(a);
        const t = clamp01(tripped[i] ?? 0);
        const sw = t < 0.6 ? (t / 0.6) * 38 : 38 - 8 * Math.sin(((t - 0.6) / 0.4) * Math.PI);
        const lab = labels[i] ?? '';
        const size = 26;
        const w = ckMonoW(lab, size) + 30;
        const lx = (R + 110) * Math.cos(a), ly = (R + 70) * Math.sin(a) - 10;
        return (
          <g key={i}>
            <g transform={`translate(${px},${py}) rotate(${deg + 90 + sw})`}>
              <rect x={-12} y={-70} width={24} height={86} rx={8} fill={B.base} stroke={INK} strokeWidth={5} />
              <rect x={-5} y={-64} width={6} height={70} rx={3} fill={B.key} opacity={0.8} />
              <circle cx={0} cy={-74} r={16} fill={t > 0.3 ? '#F0B54A' : B.shade} stroke={INK} strokeWidth={5} />
            </g>
            <circle cx={px} cy={py} r={9} fill="#3A2A20" stroke={INK} strokeWidth={3} />
            <g transform={`translate(${lx},${ly})`}>
              <rect x={-w / 2} y={-26} width={w} height={46} rx={6} fill={t > 0.3 ? '#FFF6E3' : '#E8DCC0'} stroke={INK} strokeWidth={4} />
              <text x={0} y={7} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={size} fill={INK}>{lab}</text>
            </g>
          </g>
        );
      })}
      {/* the string leaving the reel at the right */}
      <path d={`M 120 0 L ${R + 18} 0`} stroke={INK} strokeWidth={8} />
      <path d={`M 120 0 L ${R + 18} 0`} stroke={CHALK.line} strokeWidth={4} strokeDasharray="18 9" strokeDashoffset={-f * 2} />
    </g>
  );
};

/** a sealed paint can; lid stays on (the gray area isn't answered) */
export const PaintCan: React.FC<{f: number; x: number; y: number; scale?: number; color?: 'black' | 'white'; label?: string; drop?: number; seed?: number}> =
({f, x, y, scale = 1, color = 'black', label, drop = 1, seed = 1}) => {
  const k = clamp01(drop);
  if (k <= 0.001) return null;
  const fall = k < 0.7 ? (1 - k / 0.7) * -420 : 0;
  const sq = k >= 0.7 ? 1 - 0.14 * Math.sin(((k - 0.7) / 0.3) * Math.PI) : 1;
  const base = color === 'black' ? CHALK.canBlack : CHALK.canWhite;
  const T = tones(color === 'black' ? '#3A3E48' : '#E8E8E0');
  const rock = Math.sin(f / 23 + seed) * 1.2;
  const lab = label ?? (color === 'black' ? 'BLACK' : 'WHITE');
  return (
    <g transform={`translate(${x},${y + fall}) scale(${scale * (2 - sq)},${scale * sq}) rotate(${rock})`}>
      <ContactShadow cx={0} cy={2} rx={66} ry={10} opacity={0.4} />
      <path d="M -56 -6 L -56 -126 Q 0 -140 56 -126 L 56 -6 Q 0 8 -56 -6 Z" fill={base} stroke={INK} strokeWidth={5} />
      <path d="M 30 -120 L 30 -10" stroke={T.key} strokeWidth={8} opacity={color === 'black' ? 0.35 : 0.5} />
      <path d="M -44 -116 L -44 -14" stroke={T.shade} strokeWidth={10} opacity={0.4} />
      <ellipse cx={0} cy={-128} rx={56} ry={13} fill={T.base} stroke={INK} strokeWidth={5} />
      <ellipse cx={0} cy={-130} rx={40} ry={8} fill={T.key} stroke={INK} strokeWidth={3} />
      <path d="M -56 -110 Q -78 -150 0 -164 Q 78 -150 56 -110" fill="none" stroke={INK} strokeWidth={4} />
      <rect x={-42} y={-90} width={84} height={44} rx={4} fill={color === 'black' ? '#F4EFE2' : '#1E2026'} stroke={INK} strokeWidth={3} />
      <text x={0} y={-61} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={20} fill={color === 'black' ? INK : '#F7F7F2'}>{lab}</text>
      <path d="M -22 -134 L 22 -134" stroke={INK} strokeWidth={3} opacity={0.6} />
    </g>
  );
};

/** a parcel slip tied on a string: an empty tick box and a pencil question mark (never ticked) */
export const ParcelSlip: React.FC<{f: number; x: number; y: number; text: string; scale?: number; swing?: number; seed?: number; size?: number}> =
({f, x, y, text, scale = 1, swing = 0, seed = 2, size = 30}) => {
  const w = Math.max(240, ckMonoW(text, size) + 120);
  const rot = Math.sin(f / 17 + seed) * 4 + swing * 18 * Math.sin(f / 5);
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${rot})`}>
      <path d={`M 0 0 L 0 34`} stroke="#6A5A44" strokeWidth={4} />
      <path d={`M ${-w / 2} 34 L ${w / 2 - 26} 34 L ${w / 2} 60 L ${w / 2} 120 L ${-w / 2} 120 Z`} fill={CHALK.slip} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={w / 2 - 30} cy={58} r={8} fill="#fff" stroke={INK} strokeWidth={3} />
      <rect x={-w / 2 + 18} y={56} width={42} height={42} rx={4} fill="#FFFDF6" stroke={INK} strokeWidth={4} />
      <text x={-w / 2 + 39} y={90} textAnchor="middle" fontFamily={MONO_} fontWeight={700} fontSize={34} fill="#6E6A60">?</text>
      <text x={-w / 2 + 76} y={88} fontFamily={MONO_} fontWeight={800} fontSize={size} fill={INK}>{text}</text>
    </g>
  );
};

/** a faced diesel genset on skids: puff 0..1 coughs a soot cloud; cues like the rest of the family */
export const Genset: React.FC<{f: number; x: number; y: number; scale?: number; puff?: number; roll?: number; seed?: number}> =
({f, x, y, scale = 1, puff = 0, roll = 0, seed = 5}) => {
  const pose = null as null | {lean: number};
  const T = tones(CHALK.genset);
  const rumble = Math.sin(f * 1.7) * 1.2;
  const lean = pose ? pose.lean * 0.6 : 0;
  const pf = clamp01(puff);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={2} rx={170} ry={14} opacity={0.45} />
      <g transform={`translate(0,${rumble}) rotate(${lean} 0 0)`}>
        <rect x={-170} y={-22} width={340} height={22} rx={4} fill="#4A4F57" stroke={INK} strokeWidth={5} />
        {[-130, 130].map((wx) => <circle key={wx} cx={wx} cy={-4} r={20} fill="#1E2228" stroke={INK} strokeWidth={4} transform={`rotate(${roll} ${wx} -4)`} />)}
        <rect x={-150} y={-190} width={300} height={170} rx={14} fill={T.base} stroke={INK} strokeWidth={6} />
        <rect x={-150} y={-190} width={300} height={34} rx={14} fill={T.key} stroke={INK} strokeWidth={4} />
        <path d="M 120 -150 L 120 -40" stroke={T.shade} strokeWidth={12} opacity={0.5} />
        {Array.from({length: 6}, (_, i) => <path key={i} d={`M -120 ${-140 + i * 16} L -60 ${-140 + i * 16}`} stroke={INK} strokeWidth={4} opacity={0.6} />)}
        {/* control panel (faceless: only the hero has a face) */}
        <rect x={-10} y={-130} width={110} height={60} rx={6} fill="#2E3238" stroke={INK} strokeWidth={4} />
        <circle cx={20} cy={-100} r={10} fill="#F7F7F2" stroke={INK} strokeWidth={3} />
        <circle cx={60} cy={-100} r={10} fill="#F7F7F2" stroke={INK} strokeWidth={3} />
        <path d={`M 20 -100 L ${20 + 7 * Math.cos(f / 6)} ${-100 + 7 * Math.sin(f / 6)}`} stroke={INK} strokeWidth={2.5} />
        <path d="M 0 -60 L 120 -60" stroke={CHALK.soot} strokeWidth={10} opacity={0.5} />
        {/* exhaust stack */}
        <rect x={100} y={-250} width={26} height={64} rx={4} fill="#5A5F66" stroke={INK} strokeWidth={4} />
        {Array.from({length: 4}, (_, i) => {
          const t = ((f / 40 + i / 4) % 1);
          return <circle key={i} cx={113 + t * 40 + Math.sin(f / 9 + i) * 8} cy={-258 - t * 120} r={12 + t * 30 + pf * 18} fill={CHALK.soot} opacity={(0.55 + pf * 0.3) * (1 - t)} />;
        })}
      </g>
    </g>
  );
};

/** a chain-link fence run from x1 to x2 with posts; nothing is drawn behind it */
export const ChainFence: React.FC<{f: number; x1: number; x2: number; top: number; bottom: number; post?: number; sway?: number}> =
({f, x1, x2, top, bottom, post = 220, sway = 0}) => {
  const step = 34;
  const wob = sway * Math.sin(f / 3) * 3;
  const lines: React.ReactNode[] = [];
  const h = bottom - top;
  for (let x = x1 - h; x < x2; x += step) {
    lines.push(<path key={'a' + x} d={`M ${x} ${bottom} L ${x + h} ${top + wob}`} stroke="#8D96A2" strokeWidth={2.4} opacity={0.85} />);
    lines.push(<path key={'b' + x} d={`M ${x} ${top + wob} L ${x + h} ${bottom}`} stroke="#8D96A2" strokeWidth={2.4} opacity={0.85} />);
  }
  const posts: number[] = [];
  for (let x = x1; x <= x2; x += post) posts.push(x);
  return (
    <g>
      <defs><clipPath id={uid(`fc${x1}${top}`)}><rect x={x1} y={top - 4} width={x2 - x1} height={h + 8} /></clipPath></defs>
      <g clipPath={`url(#${uid(`fc${x1}${top}`)})`}>{lines}</g>
      <path d={`M ${x1} ${top + wob} L ${x2} ${top + wob}`} stroke={INK} strokeWidth={6} />
      <path d={`M ${x1} ${top + wob} L ${x2} ${top + wob}`} stroke="#9A7458" strokeWidth={3} />
      {posts.map((px) => (
        <g key={px}>
          <ContactShadow cx={px} cy={bottom + 2} rx={22} ry={5} opacity={0.4} />
          <rect x={px - 7} y={top - 18} width={14} height={h + 20} rx={4} fill={CHALK.steel} stroke={INK} strokeWidth={4} />
          <rect x={px + 1} y={top - 14} width={3} height={h + 10} fill="#9A7458" opacity={0.7} />
        </g>
      ))}
    </g>
  );
};

/** an unstruck chalk mark waiting on the snow: a dashed outline box with its words, draw 0..1 presses it in */
export const ChalkMark: React.FC<{f: number; x: number; y: number; text: string; draw?: number; size?: number; seed?: number}> =
({f, x, y, text, draw = 1, size = 30, seed = 1}) => {
  const k = clamp01(draw);
  if (k <= 0.001) return null;
  const w = ckMonoW(text, size) + 70;
  const h = size + 40;
  const per = 2 * (w + h);
  return (
    <g transform={`translate(${x},${y}) skewX(-8)`} opacity={0.6 + 0.4 * k}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="#FFFFFF" opacity={0.25} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="none" stroke={CHALK.line} strokeWidth={6} strokeDasharray="22 14"
        strokeDashoffset={per * (1 - k)} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={size} fill="#1B1A22" opacity={k}>{text}</text>
      <circle cx={-w / 2 + 6} cy={-h / 2 - 8 - ((f / 3 + seed * 7) % 12)} r={3} fill={CHALK.lineL} opacity={0.6} />
    </g>
  );
};
