import React from 'react';
import {INK} from './Character';
import {tones, ContactShadow} from './lighting';
import {figureIdle} from './figureidle';

// THE AUCTION KIT (net-new 2026-11-21, "Lot 1, Your Chats"). A kit for stories where data, accounts or a
// company's assets go up for sale: Scrollback (a faced chat history drawn as an accordion of rounded chat
// bubbles with a trailing scarf of older messages that can unspool), a LotTag on a string with swappable
// faces, a walnut Gavel with a brass band, a stencilled Crate, a round BidPaddle, a two-candle Cake whose
// flames gutter, a velvet Curtain that parts, and two worlds: a night KitchenBG with a window onto a
// mountain range, and a walnut CourtBG with a bench. Key light: warm, high and screen LEFT; a cool rim
// from the right. Rounded = what people said, square = what it is sold as; mustard is ONLY money.

export const AU = {
  night: '#13241E', spruce: '#1F4D3A', spruceL: '#2A5A46', slate: '#5B6B7A', slateL: '#7D8C9A', snow: '#DCE3EA',
  birch: '#A68C68', birchD: '#8E7A5C', birchDD: '#8E7A5C', lamp: '#FFE3A8',
  walnut: '#6E4A2E', walnutL: '#9C6F45', walnutD: '#3A2A1E', plaster: '#EDE3CF', plasterD: '#CDBFA4',
  bubble: '#CFE6DA', userTint: '#F6EEDD', aiTint: '#E6E8EE', cheek: '#E7A69A',
  mustard: '#E0A526', mustardD: '#A8761A', mustardL: '#F3C960',
  crate: '#A57A4E', crateD: '#7A5634', crateL: '#C49A6A', grey: '#B9C2CC', greyD: '#8B96A2',
  velvet: '#6B2232', velvetD: '#45131F', velvetL: '#8E3446', frost: '#F4D6C8', brass: '#C9A04A', paper: '#FFF6E3',
};
const MONO_ = "'JetBrains Mono', monospace";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const uid = (s: string) => 'au' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
export const auMonoW = (s: string, size: number, ls = 1) => s.length * size * 0.602 + ls * Math.max(0, s.length - 1);

export type ScrollEmotion = 'calm' | 'worried' | 'shy' | 'startled' | 'hopeful' | 'wary' | 'relieved';

const BUBBLES = [
  {w: 150, h: 92, tint: AU.bubble, side: 0},
  {w: 176, h: 70, tint: AU.userTint, side: 1},
  {w: 166, h: 66, tint: AU.aiTint, side: -1},
  {w: 184, h: 70, tint: AU.userTint, side: 1},
  {w: 172, h: 66, tint: AU.aiTint, side: -1},
  {w: 190, h: 72, tint: AU.userTint, side: 1},
];

/** one rounded chat bubble with a tail on one side, ink outline, key-side highlight and a core shade */
const Bubble: React.FC<{w: number; h: number; tint: string; side: number; lines?: number; id: string}> = ({w, h, tint, side, lines = 2, id}) => {
  const T = tones(tint);
  const r = h / 2;
  const tail = side === 0 ? '' : side > 0 ? `M ${w / 2 - 26} ${h / 2 - 8} q 18 14 30 16 q -10 -12 -8 -22 Z` : `M ${-w / 2 + 26} ${h / 2 - 8} q -18 14 -30 16 q 10 -12 8 -22 Z`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={T.key} /><stop offset="0.55" stopColor={tint} /><stop offset="1" stopColor={T.shade} />
        </linearGradient>
      </defs>
      {tail && <path d={tail} fill={`url(#${id})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={`url(#${id})`} stroke={INK} strokeWidth={5.5} />
      <path d={`M ${-w / 2 + r * 0.6} ${-h / 2 + 8} Q ${-w / 4} ${-h / 2 + 3} ${w / 6} ${-h / 2 + 7}`} stroke="#FFFFFF" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.75} />
      <path d={`M ${w / 2 - 10} ${-h / 4} Q ${w / 2 - 4} ${h / 6} ${w / 2 - r * 0.7} ${h / 2 - 6}`} stroke={T.core} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.45} />
      {Array.from({length: lines}).map((_, i) => (
        <rect key={i} x={-w / 2 + r * 0.7} y={-h / 2 + 22 + i * 16} width={(w - r * 1.4) * (i === lines - 1 ? 0.62 : 0.92)} height={6} rx={3} fill={INK} opacity={0.22} />
      ))}
    </g>
  );
};

/**
 * Scrollback, a faced chat history. Origin (x, y) is the bottom centre of the stack where it rests. At scale 1
 * the stack is about 200 wide and 400 tall. The top bubble carries the face; the stack below it alternates the
 * user's tint and the AI's tint, so it reads as a two-voice conversation.
 *  - emotion       calm / worried / shy / startled / hopeful / wary / relieved
 *  - squash        -1..1 accordion compress (+) or stretch (-), for pops and landings
 *  - unspool 0..1  the trailing scarf of small older-message bubbles streams out to the right (scarfTo)
 *  - blush 0..1    rose cheeks
 *  - look          -1..1 eye direction
 *  - count         how many bubbles under the head (0..5)
 *  - cues          beat frames it performs on (lib/figureidle): a hip commit, a head follow and a bounce
 */
export const Scrollback: React.FC<{
  f: number; x: number; y: number; scale?: number; emotion?: ScrollEmotion; squash?: number; unspool?: number; blush?: number;
  look?: number; count?: number; cues?: number[]; idleGain?: number; seed?: number; rot?: number; shadow?: boolean; scarfTo?: [number, number];
  sweat?: number;
}> = ({f, x, y, scale = 1, emotion = 'calm', squash = 0, unspool = 0, blush = 0, look = 0, count = 5, cues, idleGain = 1, seed = 3, rot = 0, shadow = true, scarfTo = [260, -40], sweat = 0}) => {
  const pose = idleGain > 0 ? figureIdle(f, seed, idleGain, cues ?? []) : null;
  const lean = rot + (pose ? pose.lean * 1.1 + pose.shift * 0.08 : 0) + Math.sin(f / 21 + seed) * 1.4;
  const breath = Math.sin(f / 12 + seed) * 0.03 + (pose ? pose.perform * 0.05 : 0);
  const sq = squash + breath;
  const blink = ((f + seed * 23) % 113) < 4;
  const id = uid(`sb${x}${y}${seed}`);
  const n = Math.max(0, Math.min(5, Math.round(count)));
  // stack positions from the bottom up, compressed by squash
  const gap = 58 * (1 - sq * 0.35);
  const sway = (i: number) => Math.sin(f / 15 + i * 0.9 + seed) * (3 + i * 1.2) + (pose ? pose.headX * 0.15 * i : 0);
  const stack = Array.from({length: n}).map((_, k) => {
    const i = n - k; // 5..1, bottom first
    return {b: BUBBLES[i], y: -40 - k * gap, x: sway(k) * 0.6, k};
  });
  const headY = -40 - n * gap - 30 * (1 - sq * 0.3);
  const headX = sway(n) + (pose ? pose.headX * 0.4 : 0);
  const eyeX = look * 6 + (pose ? pose.headX * 0.3 : 0);
  const brow = {calm: 0, worried: 6, shy: 3, startled: -8, hopeful: -4, wary: 5, relieved: -2}[emotion];
  const eyeR = emotion === 'startled' ? 17 : emotion === 'shy' ? 11 : 14;
  const mouth = {
    calm: 'M -14 26 Q 0 34 14 26', worried: 'M -14 32 Q 0 24 14 32', shy: 'M -9 28 Q 2 32 10 27', startled: 'M -9 26 Q 0 44 9 26 Q 0 20 -9 26',
    hopeful: 'M -16 25 Q 0 39 16 25', wary: 'M -12 29 L 12 29', relieved: 'M -15 26 Q 0 36 15 26',
  }[emotion];
  // the scarf: small bubbles strung along a curve from the stack's mid-left to scarfTo, streaming as unspool grows
  const u = clamp01(unspool);
  const scarfN = 9;
  const sx0 = -70, sy0 = -40 - Math.max(1, n - 1) * gap * 0.5;
  return (
    <g transform={`translate(${x},${y}) rotate(${lean}) scale(${scale})`}>
      {shadow && <ContactShadow cx={0} cy={4} rx={110 * (1 + sq * 0.2)} ry={13} opacity={0.4} />}
      {/* the trailing scarf of older messages (drawn behind the stack) */}
      {Array.from({length: scarfN}).map((_, i) => {
        const t = (i + 1) / scarfN;
        const tt = t * (0.12 + 0.88 * u);
        const px = sx0 + (scarfTo[0] - sx0) * tt + Math.sin(f / 9 + i) * 4;
        const py = sy0 + (scarfTo[1] - sy0) * tt - Math.sin(tt * Math.PI) * 70 + Math.cos(f / 11 + i * 0.7) * 5;
        const s = 0.32 - i * 0.012;
        const tint = i % 2 ? AU.userTint : AU.aiTint;
        return (
          <g key={i} transform={`translate(${px},${py}) rotate(${Math.sin(f / 13 + i) * 8}) scale(${s})`} opacity={i === 0 || u > 0.02 || i < 3 ? 1 : 0}>
            <Bubble w={150} h={66} tint={tint} side={i % 2 ? 1 : -1} lines={1} id={`${id}s${i}`} />
          </g>
        );
      })}
      {stack.map(({b, y: by, x: bx, k}) => (
        <g key={k} transform={`translate(${bx},${by}) scale(${1 + sq * 0.06},${1 - sq * 0.18})`}>
          <Bubble w={b.w} h={b.h} tint={b.tint} side={b.side} id={`${id}b${k}`} />
        </g>
      ))}
      {/* the head bubble with the face */}
      <g transform={`translate(${headX},${headY}) scale(${1 + sq * 0.05},${1 - sq * 0.12})`}>
        <Bubble w={BUBBLES[0].w} h={BUBBLES[0].h + 34} tint={AU.bubble} side={0} lines={0} id={`${id}h`} />
        <g transform={`translate(${eyeX},-8)`}>
          <ellipse cx={-28} cy={0} rx={eyeR * 0.82} ry={blink ? 2 : eyeR} fill="#FFFDF6" stroke={INK} strokeWidth={4} />
          <ellipse cx={28} cy={0} rx={eyeR * 0.82} ry={blink ? 2 : eyeR} fill="#FFFDF6" stroke={INK} strokeWidth={4} />
          {!blink && <circle cx={-26 + look * 4} cy={3} r={6.5} fill={INK} />}
          {!blink && <circle cx={30 + look * 4} cy={3} r={6.5} fill={INK} />}
          {!blink && <circle cx={-23 + look * 4} cy={0} r={2.3} fill="#fff" />}
          {!blink && <circle cx={33 + look * 4} cy={0} r={2.3} fill="#fff" />}
          <path d={`M -42 ${-24 + brow * 0.5} Q -28 ${-31 - brow * 0.3} -14 ${-24 - brow}`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <path d={`M 14 ${-24 - brow} Q 28 ${-31 - brow * 0.3} 42 ${-24 + brow * 0.5}`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <path d={mouth} fill={emotion === 'startled' ? '#5A1E16' : 'none'} stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={-50} cy={22} rx={12} ry={7} fill={AU.cheek} opacity={0.35 + 0.6 * clamp01(blush)} />
          <ellipse cx={50} cy={22} rx={12} ry={7} fill={AU.cheek} opacity={0.35 + 0.6 * clamp01(blush)} />
          {sweat > 0.01 && <path d={`M 62 ${-12 + clamp01(sweat) * 24} q 6 10 0 16 q -6 -6 0 -16 Z`} fill="#9FC6E0" stroke={INK} strokeWidth={2} opacity={clamp01(sweat * 2)} />}
        </g>
        {/* typing dots on the crown, alive */}
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={-18 + i * 18} cy={-52 - Math.max(0, Math.sin(f / 5 - i * 0.9)) * 5} r={5} fill={INK} opacity={0.55} />
        ))}
      </g>
    </g>
  );
};
/** where the top of Scrollback's head is, in its parent's px, for staging tags and plates */
export const scrollbackTop = (y: number, scale = 1, count = 5) => y - scale * (40 + count * 58 + 30 + 63);

/** a mustard auction tag on a string. Origin is the string's top (the knot). face text in up to 2 rows; sig draws a signature line. */
export const LotTag: React.FC<{f: number; x: number; y: number; s?: number; rows?: string[]; sig?: boolean; swing?: number; flip?: number; seed?: number; len?: number}> =
({f, x, y, s = 1, rows = [], sig = false, swing = 1, flip = 0, seed = 1, len = 70}) => {
  const size = 24;
  const w = Math.max(150, ...rows.map((r) => auMonoW(r, size) + 44));
  const h = 30 + rows.length * (size + 10) + (sig ? 34 : 0);
  const rot = Math.sin(f / 17 + seed) * 6 * swing;
  const fx = Math.cos(clamp01(flip) * Math.PI);
  const T = tones(AU.mustard);
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${rot})`}>
      <path d={`M 0 0 Q 8 ${len * 0.5} 0 ${len}`} stroke={INK} strokeWidth={3} fill="none" />
      <g transform={`translate(0,${len}) scale(${Math.abs(fx) < 0.08 ? 0.08 : fx},1)`}>
        <path d={`M ${-w / 2 + 22} 0 L ${w / 2} 0 L ${w / 2} ${h} L ${-w / 2} ${h} L ${-w / 2} 22 Z`} fill={T.base} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M ${-w / 2 + 6} 26 L ${-w / 2 + 6} ${h - 6}`} stroke={T.key} strokeWidth={5} opacity={0.8} />
        <path d={`M ${w / 2 - 7} 8 L ${w / 2 - 7} ${h - 6}`} stroke={T.core} strokeWidth={8} opacity={0.4} />
        <circle cx={-w / 2 + 22} cy={16} r={7} fill={AU.paper} stroke={INK} strokeWidth={3} />
        {fx > 0 && rows.map((r, i) => (
          <text key={i} x={6} y={34 + i * (size + 10) + size * 0.4} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={size} fill={INK}>{r}</text>
        ))}
        {fx > 0 && sig && <path d={`M ${-w / 2 + 26} ${h - 16} L ${w / 2 - 20} ${h - 16}`} stroke={INK} strokeWidth={3} strokeDasharray="10 6" />}
      </g>
    </g>
  );
};

/** a walnut gavel with a NEUTRAL brass band (never the accent mustard). Origin is the strike face's bottom centre. Wrap in StrikeProp to land it. */
export const Gavel: React.FC<{x: number; y: number; s?: number; rot?: number; glint?: number}> = ({x, y, s = 1, rot = 0, glint = 0}) => {
  const T = tones(AU.walnut);
  const B = tones('#B89A6A'); // neutral brass: the court never wears the money's mustard
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-12} y={-150} width={24} height={150} rx={10} fill={T.base} stroke={INK} strokeWidth={5} transform="rotate(-70 0 -75) translate(80 -40)" />
      <rect x={-90} y={-92} width={180} height={88} rx={20} fill={T.base} stroke={INK} strokeWidth={6} />
      <rect x={-90} y={-92} width={180} height={30} rx={14} fill={T.key} opacity={0.6} />
      <rect x={-84} y={-34} width={168} height={26} rx={10} fill={T.core} opacity={0.55} />
      <rect x={-22} y={-96} width={44} height={96} rx={6} fill={B.base} stroke={INK} strokeWidth={5} />
      <rect x={-18} y={-92} width={12} height={88} rx={4} fill={B.key} opacity={0.8} />
      {glint > 0.01 && <path d="M 8 -80 l 6 -16 l 6 16 l 16 6 l -16 6 l -6 16 l -6 -16 l -16 -6 Z" fill="#FFF6D0" opacity={clamp01(glint)} />}
      {[-90, 90].map((ex) => <rect key={ex} x={ex - (ex > 0 ? 14 : 0)} y={-96} width={14} height={96} rx={6} fill={T.shade} stroke={INK} strokeWidth={4} />)}
    </g>
  );
};

/** a stencilled pine crate. Origin bottom centre. label in mono stencil. */
export const Crate: React.FC<{x: number; y: number; s?: number; label?: string; tint?: string; rot?: number; shadow?: boolean}> = ({x, y, s = 1, label, tint = AU.crate, rot = 0, shadow = true}) => {
  const T = tones(tint);
  const w = 240, h = 170;
  const size = label ? Math.min(28, (w - 76) / Math.max(1, label.length * 0.64)) : 28;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      {shadow && <ContactShadow cx={0} cy={4} rx={w * 0.58} ry={12} opacity={0.38} />}
      <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill={T.base} stroke={INK} strokeWidth={6} />
      {[0, 1, 2].map((i) => <path key={i} d={`M ${-w / 2} ${-h + 10 + i * 54} L ${w / 2} ${-h + 10 + i * 54}`} stroke={T.core} strokeWidth={3} opacity={0.7} />)}
      <rect x={-w / 2} y={-h} width={26} height={h} fill={T.key} stroke={INK} strokeWidth={4} />
      <rect x={w / 2 - 26} y={-h} width={26} height={h} fill={T.shade} stroke={INK} strokeWidth={4} />
      <path d={`M ${-w / 2 + 26} ${-h + 6} L ${w / 2 - 26} -6`} stroke={T.core} strokeWidth={10} opacity={0.35} />
      {label && <text x={0} y={-h / 2 + size * 0.36} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={size} fill={INK} opacity={0.82} letterSpacing={1}>{label}</text>}
      {[[-w / 2 + 13, -h + 14], [w / 2 - 13, -h + 14], [-w / 2 + 13, -14], [w / 2 - 13, -14]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={4} fill={INK} opacity={0.6} />)}
    </g>
  );
};

/** a round mustard bid paddle on a handle. Origin is the grip (bottom of the handle). face text optional. */
export const BidPaddle: React.FC<{x: number; y: number; s?: number; rot?: number; text?: string}> = ({x, y, s = 1, rot = 0, text}) => {
  const T = tones(AU.mustard);
  const H = tones(AU.walnut);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-11} y={-150} width={22} height={150} rx={9} fill={H.base} stroke={INK} strokeWidth={5} />
      <rect x={-7} y={-146} width={6} height={140} rx={3} fill={H.key} opacity={0.7} />
      <circle cx={0} cy={-230} r={92} fill={T.base} stroke={INK} strokeWidth={6} />
      <path d="M -70 -270 Q -40 -310 10 -312" stroke={T.key} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.8} />
      <path d="M 82 -200 Q 70 -160 30 -146" stroke={T.core} strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.45} />
      {text && <text x={0} y={-218} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={44} fill={INK}>{text}</text>}
    </g>
  );
};

/** a small frosted cake with two candles whose flames gutter (gutter 0..1 dims and leans them). Origin bottom centre. */
export const Cake: React.FC<{f: number; x: number; y: number; s?: number; gutter?: number; seed?: number}> = ({f, x, y, s = 1, gutter = 0, seed = 1}) => {
  const T = tones(AU.frost);
  const P = tones('#C98A5A');
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={4} rx={150} ry={12} opacity={0.36} />
      <ellipse cx={0} cy={-6} rx={150} ry={22} fill="#E9E2D2" stroke={INK} strokeWidth={5} />
      <path d="M -110 -20 L -110 -130 Q 0 -160 110 -130 L 110 -20 Q 0 4 -110 -20 Z" fill={P.base} stroke={INK} strokeWidth={6} />
      <path d="M -110 -120 Q 0 -150 110 -120 L 110 -96 Q 80 -76 60 -100 Q 30 -70 0 -98 Q -30 -70 -60 -100 Q -86 -74 -110 -96 Z" fill={T.base} stroke={INK} strokeWidth={5} />
      <path d="M -96 -128 Q -20 -150 40 -142" stroke={T.key} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8} />
      <path d="M 100 -60 L 100 -28" stroke={P.core} strokeWidth={14} opacity={0.4} strokeLinecap="round" />
      {[-34, 34].map((cx, i) => {
        const g = clamp01(gutter + 0.25 * Math.max(0, Math.sin(f / 7 + i * 2 + seed)) * gutter);
        const lean = Math.sin(f / 5 + i) * (4 + 18 * g);
        return (
          <g key={i} transform={`translate(${cx},-138)`}>
            <rect x={-8} y={-62} width={16} height={62} rx={4} fill={AU.mustard} stroke={INK} strokeWidth={4} />
            <path d="M -4 -58 L -4 -6" stroke={AU.mustardL} strokeWidth={4} />
            <g transform={`translate(0,-66) rotate(${lean}) scale(${1 - 0.7 * g})`} opacity={1 - 0.75 * g}>
              <path d="M 0 -34 Q 14 -12 0 0 Q -14 -12 0 -34 Z" fill="#FFC94A" stroke={INK} strokeWidth={3} />
              <path d="M 0 -20 Q 6 -8 0 -2 Q -6 -8 0 -20 Z" fill="#FFF3C0" />
            </g>
            {g > 0.5 && <path d={`M 0 -70 q ${8 * Math.sin(f / 6)} -20 0 -40`} stroke="#9AA3AE" strokeWidth={3} fill="none" opacity={g - 0.4} />}
          </g>
        );
      })}
    </g>
  );
};

/** an oxblood velvet curtain pair across a box; part 0..1 opens it from the middle. */
export const Curtain: React.FC<{f: number; x: number; y: number; w: number; h: number; part?: number}> = ({f, x, y, w, h, part = 0}) => {
  const T = tones(AU.velvet);
  const p = clamp01(part);
  const half = (w / 2) * (1 - 0.72 * p);
  const folds = 6;
  const side = (dir: 1 | -1) => {
    const x0 = dir < 0 ? x : x + w;
    const x1 = dir < 0 ? x + half : x + w - half;
    return (
      <g>
        <path d={`M ${x0} ${y} L ${x1} ${y} Q ${x1 + dir * -10 + Math.sin(f / 19) * 6} ${y + h * 0.6} ${x1 - dir * 30 * p} ${y + h} L ${x0} ${y + h} Z`} fill={T.base} stroke={INK} strokeWidth={6} />
        {Array.from({length: folds}).map((_, i) => {
          const fx = x0 + (x1 - x0) * ((i + 0.5) / folds);
          return <path key={i} d={`M ${fx} ${y + 8} Q ${fx + Math.sin(f / 23 + i) * 8} ${y + h * 0.55} ${fx - dir * 14 * p} ${y + h - 6}`} stroke={i % 2 ? T.core : T.key} strokeWidth={i % 2 ? 12 : 6} fill="none" opacity={i % 2 ? 0.55 : 0.5} />;
        })}
      </g>
    );
  };
  return (
    <g>
      <rect x={x - 20} y={y - 36} width={w + 40} height={44} rx={8} fill={AU.brass} stroke={INK} strokeWidth={5} />
      {side(-1)}
      {side(1)}
      <path d={`M ${x - 20} ${y + 6} Q ${x + w / 2} ${y + 40} ${x + w + 20} ${y + 6}`} fill={T.shade} stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** the night kitchen: wall, window onto a mountain range under a moon, a pendant lamp pool and a table top. */
export const KitchenBG: React.FC<{f: number; tableY?: number; seed?: number; snow?: number; winX?: number; winY?: number; winW?: number; winH?: number; lamp?: number}> =
({f, tableY = 1330, seed = 0, snow = 1, winX = 150, winY = 300, winW = 780, winH = 640, lamp = 1}) => {
  const W = tones(AU.birch);
  const T = tones('#B98E5E');
  const id = uid(`kit${seed}${winX}`);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}l`} cx="0.45" cy="0.72" r="0.62">
          <stop offset="0" stopColor={AU.lamp} stopOpacity={0.55 * lamp} /><stop offset="1" stopColor={AU.lamp} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B1914" /><stop offset="1" stopColor="#24443A" />
        </linearGradient>
        <clipPath id={`${id}c`}><rect x={winX} y={winY} width={winW} height={winH} rx={10} /></clipPath>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2400} fill={W.base} />
      <rect x={-200} y={-200} width={1480} height={2400} fill={`url(#${id}l)`} />
      {/* beadboard lines */}
      {Array.from({length: 26}).map((_, i) => <path key={i} d={`M ${-120 + i * 52} ${winY + winH + 30} L ${-120 + i * 52} ${tableY}`} stroke={W.core} strokeWidth={2} opacity={0.35} />)}
      {/* the window onto the range */}
      <g clipPath={`url(#${id}c)`}>
        <rect x={winX} y={winY} width={winW} height={winH} fill={`url(#${id}s)`} />
        <circle cx={winX + winW * 0.78} cy={winY + 110} r={42} fill="#F4F1E4" />
        <circle cx={winX + winW * 0.78} cy={winY + 110} r={70} fill="#F4F1E4" opacity={0.12} />
        {Array.from({length: 18}).map((_, i) => <circle key={i} cx={winX + ((i * 137 + seed * 53) % winW)} cy={winY + 20 + ((i * 71) % 180)} r={1.8} fill="#F4F1E4" opacity={0.7} />)}
        <path d={`M ${winX} ${winY + winH * 0.62} L ${winX + 90} ${winY + 300} L ${winX + 170} ${winY + 360} L ${winX + 300} ${winY + 220} L ${winX + 420} ${winY + 330} L ${winX + 520} ${winY + 250} L ${winX + 640} ${winY + 340} L ${winX + winW} ${winY + 280} L ${winX + winW} ${winY + winH} L ${winX} ${winY + winH} Z`} fill={AU.slate} />
        <path d={`M ${winX + 300} ${winY + 220} L ${winX + 340} ${winY + 262} L ${winX + 318} ${winY + 300} L ${winX + 360} ${winY + 330} L ${winX + 420} ${winY + 330} L ${winX + 300} ${winY + 220} Z M ${winX + 520} ${winY + 250} L ${winX + 560} ${winY + 290} L ${winX + 545} ${winY + 318} L ${winX + 640} ${winY + 340} Z`} fill={AU.snow} />
        <path d={`M ${winX} ${winY + winH * 0.74} Q ${winX + winW / 2} ${winY + winH * 0.66} ${winX + winW} ${winY + winH * 0.76} L ${winX + winW} ${winY + winH} L ${winX} ${winY + winH} Z`} fill="#C9D4DE" />
        {Array.from({length: 9}).map((_, i) => {
          const tx = winX + 30 + i * (winW / 9);
          const ty = winY + winH * 0.8 + (i % 2) * 14;
          return <path key={i} d={`M ${tx} ${ty - 70} L ${tx + 22} ${ty} L ${tx - 22} ${ty} Z`} fill={AU.spruce} stroke={INK} strokeWidth={2} />;
        })}
        {snow > 0 && Array.from({length: 40}).map((_, i) => {
          const sx = winX + ((i * 89 + seed * 31) % winW) + Math.sin(f / 20 + i) * 10;
          const sy = winY + ((i * 53 + f * (1.2 + (i % 3) * 0.4)) % winH);
          return <circle key={i} cx={sx} cy={sy} r={2 + (i % 3)} fill="#FFFFFF" opacity={0.8 * snow} />;
        })}
      </g>
      <rect x={winX} y={winY} width={winW} height={winH} rx={10} fill="none" stroke={AU.spruce} strokeWidth={26} />
      <rect x={winX} y={winY} width={winW} height={winH} rx={10} fill="none" stroke={INK} strokeWidth={5} />
      <path d={`M ${winX + winW / 2} ${winY} L ${winX + winW / 2} ${winY + winH} M ${winX} ${winY + winH / 2} L ${winX + winW} ${winY + winH / 2}`} stroke={AU.spruce} strokeWidth={14} />
      <rect x={winX - 30} y={winY + winH} width={winW + 60} height={34} rx={6} fill={T.base} stroke={INK} strokeWidth={5} />
      {/* the table top */}
      <rect x={-200} y={tableY} width={1480} height={700} fill={T.base} />
      <rect x={-200} y={tableY} width={1480} height={14} fill={T.key} />
      {Array.from({length: 6}).map((_, i) => <path key={i} d={`M -200 ${tableY + 60 + i * 80} Q 540 ${tableY + 40 + i * 84} 1280 ${tableY + 70 + i * 78}`} stroke={T.core} strokeWidth={3} opacity={0.35} fill="none" />)}
      <rect x={140} y={tableY + 30} width={800} height={600} fill={AU.spruceL} opacity={0.55} />
      {Array.from({length: 10}).map((_, i) => <path key={i} d={`M ${160 + i * 80} ${tableY + 30} L ${160 + i * 80} ${tableY + 630}`} stroke={AU.birch} strokeWidth={3} opacity={0.25} />)}
    </g>
  );
};

/** the courtroom: plaster wall, a tall window, a walnut bench across mid-frame and a rail in the foreground. */
export const CourtBG: React.FC<{f: number; benchY?: number; seed?: number; rail?: boolean; benchX?: number}> = ({f, benchY = 1180, seed = 0, rail = true, benchX = 540}) => {
  const P = tones(AU.plaster);
  const T = tones(AU.walnut);
  const id = uid(`ct${seed}${benchY}`);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={P.key} /><stop offset="1" stopColor={P.shade} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF3D6" stopOpacity={0.5} /><stop offset="1" stopColor="#FFF3D6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2400} fill={`url(#${id}w)`} />
      {/* wainscot */}
      <rect x={-200} y={benchY - 420} width={1480} height={60} fill={T.base} />
      {Array.from({length: 12}).map((_, i) => <rect key={i} x={-160 + i * 130} y={benchY - 350} width={110} height={300} rx={6} fill={T.core} opacity={0.25} stroke={INK} strokeWidth={2} />)}
      {/* tall window, high left, with its light shaft */}
      <rect x={70} y={200} width={220} height={480} rx={100} fill="#C9D9E6" stroke={T.base} strokeWidth={18} />
      <path d="M 180 200 L 180 680 M 70 440 L 290 440" stroke={T.base} strokeWidth={10} />
      {Array.from({length: 7}).map((_, i) => <path key={i} d={`M ${90 + i * 30} ${640 - (i % 2) * 30} l 18 -36`} stroke="#FFFFFF" strokeWidth={3} opacity={0.6} />)}
      <path d={`M 70 680 L 290 680 L 760 ${benchY + 100} L 330 ${benchY + 100} Z`} fill={`url(#${id}g)`} opacity={0.8 + 0.1 * Math.sin(f / 40)} />
      {/* the seal disc on the wall, deliberately generic */}
      <circle cx={benchX + 200} cy={430} r={96} fill={AU.brass} stroke={INK} strokeWidth={6} />
      <circle cx={benchX + 200} cy={430} r={70} fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />
      <path d={`M ${benchX + 200} ${384} L ${benchX + 214} ${420} L ${benchX + 252} ${420} L ${benchX + 222} ${442} L ${benchX + 232} ${478} L ${benchX + 200} ${456} L ${benchX + 168} ${478} L ${benchX + 178} ${442} L ${benchX + 148} ${420} L ${benchX + 186} ${420} Z`} fill={INK} opacity={0.45} />
      {/* the bench */}
      <rect x={benchX - 470} y={benchY - 300} width={940} height={300} rx={10} fill={T.base} stroke={INK} strokeWidth={7} />
      <rect x={benchX - 470} y={benchY - 300} width={940} height={36} rx={8} fill={T.key} stroke={INK} strokeWidth={5} />
      {Array.from({length: 5}).map((_, i) => <rect key={i} x={benchX - 440 + i * 180} y={benchY - 240} width={150} height={210} rx={6} fill="none" stroke={T.core} strokeWidth={5} />)}
      <rect x={benchX + 420} y={benchY - 300} width={50} height={300} fill={T.shade} opacity={0.6} />
      <rect x={-200} y={benchY} width={1480} height={900} fill="#5B6B7A" />
      <rect x={-200} y={benchY} width={1480} height={10} fill={T.shade} />
      {Array.from({length: 8}).map((_, i) => <path key={i} d={`M -200 ${benchY + 50 + i * 60} L 1280 ${benchY + 40 + i * 62}`} stroke="#4C5B69" strokeWidth={3} opacity={0.6} />)}
      {rail && (
        <g>
          <rect x={-200} y={benchY + 260} width={1480} height={30} rx={8} fill={T.base} stroke={INK} strokeWidth={6} />
          {Array.from({length: 16}).map((_, i) => <rect key={i} x={-170 + i * 92} y={benchY + 290} width={22} height={300} rx={8} fill={i % 2 ? T.core : T.base} stroke={INK} strokeWidth={4} />)}
          <rect x={-200} y={benchY + 560} width={1480} height={400} fill={T.shade} />
        </g>
      )}
    </g>
  );
};
