import React from 'react';
import {INK} from './Character';
import {tones, ContactShadow} from './lighting';
import {figureIdle} from './figureidle';

// THE GROUNDSTOP FAMILY (net-new 2026-11-19, "One Thousand Knocks"). An investigation kit for aviation and
// infrastructure stories: SuggestionSlip (a faced folded paper route card with NO HANDS, so it can only
// suggest), a faced Airliner, a faceless rack Router, a cork EvidenceBoard with push pins and strings that go
// taut or slack (never cut), tarps that hide a second suspect, a stopwatch, a magnifying glass, a pie, a coil
// of old copper, a desk calendar and a field of router outlines. Key light is low on screen LEFT (a short
// November day, sun in the south), so forms shade to the right and rim on the left.

export const GS = {
  card: '#F7EFDC', cardD: '#D8C9A6', pencil: '#4A4A52', cheek: '#F09A6A',
  cork: '#B07A48', corkD: '#7E5230', corkL: '#D29A64', frame: '#5A3A22',
  string: '#B8323A', cyan: '#39F0FF', cyanD: '#0FA8C0',
  persimmon: '#E0662B', peach: '#F4B183', brick: '#9C3F2A', ivory: '#F2E8D0', buff: '#C9B48E',
  pine: '#0E5A63', pineD: '#082F35', copper: '#8A5A3A', copperL: '#B57F57',
  jet: '#F4EFE4', jetStripe: '#E0662B', jetTail: '#0E5A63', glass: '#203A44',
  router: '#2B3238', routerL: '#4A555E', led: '#7CFF9A', ledAmber: '#FFB547', peanut: '#F3E7C6', tarp: '#5E6E54', tarpD: '#3E4A38',
  pie: '#D9A25A', pieCrust: '#B87A38', brass: '#C9A04A', paper: '#FFF6E3',
};
const MONO_ = "'JetBrains Mono', monospace";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const uid = (s: string) => 'gs' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const gsMonoW = (s: string, size: number, ls = 1) => s.length * size * 0.602 + ls * Math.max(0, s.length - 1);

export type SlipEmotion = 'calm' | 'worried' | 'scared' | 'hopeful' | 'focused' | 'humble' | 'eager' | 'content' | 'sheepish';

/**
 * SuggestionSlip, the paper route card. Origin (x, y) is the bottom centre of the card (where it rests or is
 * pinned). At scale 1 it is about 210 wide and 160 tall. NO HANDS by design: it can point with its dashed route
 * and slide, never grab.
 *  - fold 0..1     folds itself smaller (fear), squashing toward its crease
 *  - sweat 0..1    an ink bead runs down its temple
 *  - route 0..1    how much of the dashed pencil route on its belly is drawn
 *  - nod 0..1      a small nod (dip and recover)
 *  - tag           a small tab label (SMART / FLYWAYS)
 *  - cues          beat frames it performs on (lib/figureidle)
 */
export const SuggestionSlip: React.FC<{
  f: number; x: number; y: number; scale?: number; emotion?: SlipEmotion; fold?: number; sweat?: number; route?: number;
  nod?: number; look?: number; tag?: string; cues?: number[]; idleGain?: number; seed?: number; rot?: number; shadow?: boolean;
}> = ({f, x, y, scale = 1, emotion = 'calm', fold = 0, sweat = 0, route = 1, nod = 0, look = 0, tag, cues, idleGain = 1, seed = 5, rot = 0, shadow = true}) => {
  const pose = cues && cues.length && idleGain > 0 ? figureIdle(f, seed, idleGain, cues) : null;
  const lean = rot + (pose ? pose.lean * 0.9 + pose.shift * 0.06 : 0) + Math.sin(f / 23 + seed) * 1.2;
  const breath = 1 + 0.02 * Math.sin(f / 11 + seed) + (pose ? (pose.breath - 1) * 0.6 : 0);
  const fd = clamp01(fold);
  const sx = (1 - fd * 0.38) * breath, sy = (1 - fd * 0.22) * (2 - breath);
  const nd = Math.sin(clamp01(nod) * Math.PI) * 9;
  const blink = ((f + seed * 19) % 109) < 4;
  const id = uid(`slip${x}${y}${seed}`);
  const C = tones(GS.card);
  const eyeX = look * 5 + (pose ? pose.headX * 0.4 : 0);
  const brow = {calm: 0, worried: 5, scared: 8, hopeful: -4, focused: 3, humble: 2, eager: -5, content: -3, sheepish: 3}[emotion];
  const mouth = {
    calm: 'M -12 30 Q 0 37 12 30', worried: 'M -12 36 Q 0 29 12 36', scared: 'M -8 32 Q 0 44 8 32 Q 0 27 -8 32', hopeful: 'M -14 29 Q 0 41 14 29',
    focused: 'M -11 33 L 11 33', humble: 'M -10 32 Q 0 37 10 31', eager: 'M -15 28 Q 0 44 15 28', content: 'M -13 30 Q 0 39 13 30', sheepish: 'M -11 34 Q 3 39 12 30',
  }[emotion];
  const W = 104, H = 150;
  const rd = clamp01(route);
  const routeD = 'M -78 -40 Q -40 -78 -4 -52 T 72 -96';
  return (
    <g transform={`translate(${x},${y}) rotate(${lean}) scale(${scale})`}>
      {shadow && <ContactShadow cx={0} cy={4} rx={96 * sx} ry={11} opacity={0.38} />}
      <g transform={`translate(0,${nd}) scale(${sx},${sy})`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0" stopColor={C.key} /><stop offset="0.6" stopColor={GS.card} /><stop offset="1" stopColor={GS.cardD} />
          </linearGradient>
        </defs>
        {/* back flap (the fold), peeking up behind */}
        <path d={`M ${-W + 10} ${-H + 8} L ${W - 22} ${-H - 14} L ${W - 8} ${-H + 18} Z`} fill={GS.cardD} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* body: a chubby card with rounded, slightly curled corners */}
        <path d={`M ${-W} -12 Q ${-W} 0 ${-W + 14} 0 L ${W - 14} 0 Q ${W} 0 ${W} -12 L ${W + 4} ${-H + 16} Q ${W + 2} ${-H + 2} ${W - 14} ${-H + 4} L ${-W + 12} ${-H} Q ${-W - 4} ${-H + 2} ${-W - 2} ${-H + 16} Z`}
          fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* crease and paper fibre */}
        <path d={`M ${-W + 8} ${-H * 0.52} Q 0 ${-H * 0.56} ${W - 4} ${-H * 0.5}`} stroke={GS.cardD} strokeWidth={4} fill="none" opacity={0.85} />
        <path d={`M ${W - 6} ${-H + 22} L ${W - 6} -16`} stroke={C.shade} strokeWidth={8} opacity={0.35} />
        <path d={`M ${-W + 6} ${-H + 22} L ${-W + 6} -20`} stroke="#FFFDF4" strokeWidth={4} opacity={0.8} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${-80 + i * 46} -14 l 10 -4`} stroke={GS.cardD} strokeWidth={2} opacity={0.7} />)}
        {/* corner curl */}
        <path d={`M ${W - 30} -2 Q ${W - 6} -6 ${W - 2} -30 Q ${W - 20} -26 ${W - 30} -2 Z`} fill={C.shade} stroke={INK} strokeWidth={3} />
        {/* the dashed pencil route on its belly, with a start dot and an arrowhead */}
        <path d={routeD} fill="none" stroke={GS.pencil} strokeWidth={5} strokeDasharray="12 9" strokeLinecap="round" pathLength={1}
          style={{strokeDasharray: rd >= 0.999 ? '0.05 0.035' : `${rd} 1`}} opacity={0.9} />
        <circle cx={-78} cy={-40} r={6} fill={GS.pencil} />
        {rd > 0.95 && <path d="M 60 -102 L 76 -98 L 66 -86" fill="none" stroke={GS.pencil} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
        {/* face, low on the card so the route sits above it like a thought */}
        <g transform={`translate(${eyeX},-62)`}>
          <ellipse cx={-26} cy={0} rx={13} ry={blink ? 2 : 16} fill="#FFFDF6" stroke={INK} strokeWidth={4} />
          <ellipse cx={24} cy={0} rx={13} ry={blink ? 2 : 16} fill="#FFFDF6" stroke={INK} strokeWidth={4} />
          {!blink && <circle cx={-23 + look * 4} cy={3} r={6.5} fill={INK} />}
          {!blink && <circle cx={27 + look * 4} cy={3} r={6.5} fill={INK} />}
          {!blink && <circle cx={-20 + look * 4} cy={0} r={2.2} fill="#fff" />}
          {!blink && <circle cx={30 + look * 4} cy={0} r={2.2} fill="#fff" />}
          <path d={`M -40 ${-24 - brow} Q -26 ${-30 + brow * 0.4} -12 ${-22 + brow}`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <path d={`M 10 ${-22 + brow} Q 24 ${-30 + brow * 0.4} 38 ${-24 - brow}`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <path d={mouth} fill={emotion === 'scared' ? '#5A1E16' : 'none'} stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={-44} cy={22} rx={10} ry={6} fill={GS.cheek} opacity={0.55} />
          <ellipse cx={42} cy={22} rx={10} ry={6} fill={GS.cheek} opacity={0.55} />
          {sweat > 0.01 && (
            <path d={`M 50 ${-10 + clamp01(sweat) * 26} q 6 10 0 16 q -6 -6 0 -16 Z`} fill={GS.pencil} stroke={INK} strokeWidth={2} opacity={clamp01(sweat * 2)} />
          )}
        </g>
        {tag && (
          <g transform={`translate(${-W + 30},${-H - 6}) rotate(-6)`}>
            <rect x={-6} y={-20} width={gsMonoW(tag, 18) + 20} height={30} rx={4} fill={GS.paper} stroke={INK} strokeWidth={3} />
            <text x={4} y={1} fontFamily={MONO_} fontWeight={800} fontSize={18} fill={INK}>{tag}</text>
          </g>
        )}
      </g>
    </g>
  );
};

export type JetEmotion = 'calm' | 'wince' | 'wide' | 'hopeful' | 'glum';

/**
 * Airliner, a faced jet in three-quarter side view. Origin (x, y) is the ground under the main gear. At scale 1 it
 * is about 560 long and 200 tall. Eyes are the cockpit windscreen. facing 1 = nose to screen right.
 *  - strain 0..1  leans forward against its chocks
 *  - roll px      taxi offset along its axis
 */
export const Airliner: React.FC<{f: number; x: number; y: number; scale?: number; facing?: 1 | -1; emotion?: JetEmotion; strain?: number; look?: number; cues?: number[]; seed?: number; idleGain?: number}> =
({f, x, y, scale = 1, facing = 1, emotion = 'calm', strain = 0, look = 0, cues, seed = 2, idleGain = 1}) => {
  const pose = cues && cues.length && idleGain > 0 ? figureIdle(f, seed, idleGain, cues) : null;
  const tilt = -strain * 2.5 + (pose ? pose.lean * 0.25 : 0);
  const bob = Math.sin(f / 19 + seed) * 1.5 + (pose ? pose.dip * 0.3 : 0);
  const J = tones(GS.jet);
  const T = tones(GS.jetTail);
  const id = uid(`jet${x}${y}${seed}`);
  const blink = ((f + seed * 23) % 113) < 4;
  const lid = {calm: 0, wince: 10, wide: -5, hopeful: -2, glum: 7}[emotion];
  const pupil = emotion === 'wide' ? 5 : 7;
  return (
    <g transform={`translate(${x},${y}) scale(${facing * scale},${scale})`}>
      <ContactShadow cx={20} cy={2} rx={250} ry={16} opacity={0.4} />
      {/* gear */}
      {[-140, 60, 80].map((gx, i) => (
        <g key={i}>
          <path d={`M ${gx} -58 L ${gx} -18`} stroke={INK} strokeWidth={9} />
          <circle cx={gx} cy={-14} r={14} fill="#2A2A2E" stroke={INK} strokeWidth={4} />
          <circle cx={gx} cy={-14} r={5} fill="#8A8A90" />
        </g>
      ))}
      <g transform={`translate(0,${bob}) rotate(${tilt} 200 -70)`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={J.key} /><stop offset="0.55" stopColor={GS.jet} /><stop offset="1" stopColor={J.shade} />
          </linearGradient>
        </defs>
        {/* tail fin */}
        <path d="M -240 -110 L -300 -230 L -250 -232 L -170 -112 Z" fill={T.base} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M -282 -214 L -258 -216 L -200 -128" stroke={T.key} strokeWidth={5} fill="none" opacity={0.7} />
        {/* far wing */}
        <path d="M -40 -96 L -130 -150 L -96 -152 L 30 -100 Z" fill={J.shade} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* fuselage */}
        <path d="M -270 -96 Q -280 -130 -230 -134 L 190 -140 Q 280 -140 300 -100 Q 290 -62 200 -58 L -220 -58 Q -262 -60 -270 -96 Z"
          fill={`url(#${id})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* persimmon cheat line and teal belly */}
        <path d="M -262 -86 L 280 -94" stroke={GS.jetStripe} strokeWidth={9} strokeLinecap="round" />
        <path d="M -230 -62 L 200 -62" stroke={T.base} strokeWidth={6} opacity={0.6} />
        {/* passenger windows */}
        {Array.from({length: 18}, (_, i) => <rect key={i} x={-200 + i * 20} y={-118} width={9} height={12} rx={4} fill={GS.glass} stroke={INK} strokeWidth={2} />)}
        <path d="M -60 -138 L -60 -60 M 120 -140 L 120 -60" stroke={J.shade} strokeWidth={3} opacity={0.7} />
        {/* near wing and engine */}
        <path d="M -20 -72 L -150 -10 L -100 -8 L 60 -70 Z" fill={J.base} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <g transform="translate(-50,-30)">
          <ellipse cx={0} cy={0} rx={50} ry={22} fill={J.shade} stroke={INK} strokeWidth={5} />
          <ellipse cx={44} cy={0} rx={10} ry={20} fill="#2A2A2E" stroke={INK} strokeWidth={4} />
          <path d={`M 44 -14 L 44 14`} stroke="#8A8A90" strokeWidth={3} transform={`rotate(${f * 6} 44 0)`} />
          <path d="M -40 -14 Q 0 -20 40 -14" stroke={J.key} strokeWidth={4} fill="none" />
        </g>
        {/* cockpit windscreen as eyes */}
        <g transform="translate(250,-112)">
          <path d="M -30 -10 Q -14 -24 6 -22 L 8 2 L -28 4 Z" fill="#FFFDF6" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M 14 -21 Q 34 -18 40 -2 L 14 2 Z" fill="#FFFDF6" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {!blink && <circle cx={-10 + look * 4} cy={-6} r={pupil} fill={INK} />}
          {!blink && <circle cx={26 + look * 4} cy={-6} r={pupil - 1} fill={INK} />}
          <path d={`M -32 ${-14 + lid} Q -12 ${-28 + lid} 8 ${-24 + lid}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d={`M 12 ${-24 + lid} Q 30 ${-22 + lid} 42 ${-8 + lid}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
          {blink && <path d="M -28 -4 L 6 -4 M 16 -4 L 38 -4" stroke={INK} strokeWidth={4} />}
          <path d={emotion === 'wince' || emotion === 'glum' ? 'M 8 30 Q 22 24 34 30' : emotion === 'wide' ? 'M 14 26 Q 22 38 30 26 Q 22 22 14 26' : 'M 8 26 Q 22 34 36 26'}
            fill={emotion === 'wide' ? '#5A1E16' : 'none'} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </g>
        <path d="M -250 -120 Q -60 -132 230 -136" stroke="#FFFFFF" strokeWidth={4} fill="none" opacity={0.7} />
      </g>
    </g>
  );
};

/**
 * Router, a faceless rack box. Origin (x, y) is the bottom centre. At scale 1 about 300 wide and 120 tall.
 *  - leds 0..1     how frantic the LED row is (0 = calm green blink, 1 = strobing amber)
 *  - peanuts       packing peanuts still stuck on it
 *  - fragile       a FRAGILE sticker
 *  - boxed 0..1    the cardboard box flaps still around it (1 = half in its box)
 */
export const Router: React.FC<{f: number; x: number; y: number; scale?: number; leds?: number; peanuts?: boolean; fragile?: boolean; boxed?: number; glow?: number}> =
({f, x, y, scale = 1, leds = 0.2, peanuts = true, fragile = true, boxed = 0, glow = 0}) => {
  const R = tones(GS.router);
  const id = uid(`rt${x}${y}`);
  const fr = clamp01(leds);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={3} rx={170} ry={12} opacity={0.45} />
      {glow > 0.01 && <ellipse cx={0} cy={-60} rx={210} ry={110} fill={GS.cyan} opacity={0.12 * glow} />}
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={R.key} /><stop offset="1" stopColor={R.shade} />
        </linearGradient>
      </defs>
      {boxed > 0.01 && (
        <g opacity={clamp01(boxed * 1.4)}>
          <path d="M -170 -10 L -170 -70 L -150 -96 L 150 -96 L 170 -70 L 170 -10 Z" fill="#C49A62" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M -170 -70 L ${-220 * boxed} ${-120 - 20 * boxed} L -150 -96 Z`} fill="#D8B07A" stroke={INK} strokeWidth={4} />
          <path d={`M 170 -70 L ${220 * boxed} ${-120 - 20 * boxed} L 150 -96 Z`} fill="#D8B07A" stroke={INK} strokeWidth={4} />
        </g>
      )}
      <rect x={-150} y={-120} width={300} height={116} rx={10} fill={`url(#${id})`} stroke={INK} strokeWidth={6} />
      <rect x={-140} y={-112} width={280} height={14} rx={4} fill={GS.routerL} opacity={0.7} />
      {/* port grid */}
      {Array.from({length: 12}, (_, i) => (
        <g key={i}>
          <rect x={-128 + i * 21} y={-76} width={15} height={13} rx={2} fill="#14181C" stroke={INK} strokeWidth={2} />
          <rect x={-128 + i * 21} y={-56} width={15} height={13} rx={2} fill="#14181C" stroke={INK} strokeWidth={2} />
        </g>
      ))}
      {/* LED row */}
      {Array.from({length: 12}, (_, i) => {
        const on = h01(i, Math.floor(f * (0.3 + fr * 1.8))) > 0.45 - fr * 0.3;
        return <circle key={i} cx={-121 + i * 21} cy={-28} r={4.5} fill={on ? (fr > 0.5 && i % 3 === 0 ? GS.ledAmber : GS.led) : '#203028'} stroke={INK} strokeWidth={1.5} />;
      })}
      <path d="M -150 -20 L 150 -20" stroke={R.shade} strokeWidth={3} />
      <path d="M -146 -116 L -146 -10" stroke={R.key} strokeWidth={3} opacity={0.6} />
      {fragile && (
        <g transform="translate(70,-100) rotate(-8)">
          <rect x={-46} y={-14} width={92} height={26} rx={3} fill="#E8402E" stroke={INK} strokeWidth={3} />
          <text x={0} y={6} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={16} fill="#FFF6E3">FRAGILE</text>
        </g>
      )}
      {peanuts && [[-120, -122, 20], [-60, -126, -30], [10, -121, 50], [118, -60, 80], [-138, -40, 10]].map(([px, py, r], i) => (
        <path key={i} d="M -9 0 Q -9 -7 -2 -6 Q 0 -10 5 -7 Q 10 -6 9 0 Q 9 6 2 5 Q 0 9 -5 6 Q -10 5 -9 0 Z" fill={GS.peanut} stroke={INK} strokeWidth={2}
          transform={`translate(${px},${py + Math.sin(f / 7 + i) * fr * 3}) rotate(${r})`} />
      ))}
    </g>
  );
};

/** the cork board: frame, cork texture and a top header strip. (x, y) is its top-left corner */
export const CorkBoard: React.FC<{x: number; y: number; w: number; h: number; seed?: number; children?: React.ReactNode}> = ({x, y, w, h, seed = 1, children}) => {
  const id = uid(`cork${x}${y}${w}`);
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={10} y={14} width={w} height={h} rx={10} fill="#000" opacity={0.28} />
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={GS.corkL} /><stop offset="0.5" stopColor={GS.cork} /><stop offset="1" stopColor={GS.corkD} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w} height={h} rx={10} fill={GS.frame} stroke={INK} strokeWidth={6} />
      <rect x={18} y={18} width={w - 36} height={h - 36} rx={4} fill={`url(#${id})`} stroke={INK} strokeWidth={3} />
      {Array.from({length: Math.floor((w * h) / 2600)}, (_, i) => (
        <circle key={i} cx={24 + h01(i, seed) * (w - 48)} cy={24 + h01(i, seed + 3) * (h - 48)} r={1.6 + h01(i, seed + 7) * 2.2} fill={h01(i, 9) > 0.5 ? GS.corkD : GS.corkL} opacity={0.6} />
      ))}
      <path d={`M 18 22 L ${w - 18} 22`} stroke="#E8B884" strokeWidth={3} opacity={0.6} />
      {children}
    </g>
  );
};

/** a push pin; drop 0..1 brings it in from above with a bounce */
export const PushPin: React.FC<{x: number; y: number; color?: string; drop?: number; size?: number}> = ({x, y, color = GS.string, drop = 1, size = 1}) => {
  const d = clamp01(drop);
  if (d <= 0.01) return null;
  const dy = d < 0.7 ? -(1 - d / 0.7) * 60 : -Math.sin(((d - 0.7) / 0.3) * Math.PI) * 6;
  const T = tones(color);
  return (
    <g transform={`translate(${x},${y + dy}) scale(${size})`}>
      <ellipse cx={4} cy={6} rx={10} ry={4} fill="#000" opacity={0.3} />
      <circle cx={0} cy={0} r={11} fill={T.base} stroke={INK} strokeWidth={3.5} />
      <circle cx={-3.5} cy={-3.5} r={3.5} fill={T.key} />
    </g>
  );
};

/**
 * A string between two pins. slack 0..1 sags it (0 = taut, 1 = a deep loose loop); draw 0..1 grows it from the
 * first pin; twang 0..1 is a decaying vibration on tightening. Never cut: a slack string stays pinned at both ends.
 */
export const BoardString: React.FC<{f: number; x1: number; y1: number; x2: number; y2: number; slack?: number; draw?: number; color?: string; width?: number; twang?: number; glow?: boolean}> =
({f, x1, y1, x2, y2, slack = 0.1, draw = 1, color = GS.string, width = 4, twang = 0, glow = false}) => {
  const dr = clamp01(draw);
  if (dr <= 0.01) return null;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const vib = twang > 0 ? Math.sin(f * 1.7) * 14 * clamp01(twang) : 0;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + clamp01(slack) * len * 0.35 + vib + Math.sin(f / 31 + x1) * 2 * (0.3 + slack);
  const ex = x1 + (x2 - x1) * dr, ey = y1 + (y2 - y1) * dr;
  const cx = x1 + (mx - x1) * dr, cy = y1 + (my - y1) * dr;
  const d = `M ${x1} ${y1} Q ${cx} ${cy} ${ex} ${ey}`;
  return (
    <g>
      {glow && <path d={d} stroke={color} strokeWidth={width * 4} fill="none" opacity={0.25} strokeLinecap="round" />}
      <path d={d} stroke={INK} strokeWidth={width + 3} fill="none" strokeLinecap="round" opacity={0.85} />
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** a lumpy tarp over a hidden shape. (x, y) bottom centre; bump 0..1 a jolt from underneath; lift 0..1 yanks it off up-right */
export const Tarp: React.FC<{f: number; x: number; y: number; w?: number; h?: number; bump?: number; lift?: number; tag?: string; seed?: number}> =
({f, x, y, w = 220, h = 150, bump = 0, lift = 0, tag, seed = 1}) => {
  const lf = clamp01(lift);
  if (lf >= 0.999) return null;
  const T = tones(GS.tarp);
  const b = Math.sin(clamp01(bump) * Math.PI) * 18 + Math.sin(f / (9 + seed) + seed) * 2.5;
  const ox = lf * 520, oy = -lf * 380, rot = lf * 38;
  const top = -h - b;
  return (
    <g transform={`translate(${x + ox},${y + oy}) rotate(${rot})`} opacity={1 - lf * 0.4}>
      <ContactShadow cx={0} cy={3} rx={w * 0.55 * (1 - lf)} ry={10} opacity={0.35} />
      <path d={`M ${-w / 2 - 10} 0 Q ${-w / 2} ${top * 0.6} ${-w * 0.22} ${top} Q 0 ${top - 10 - b * 0.5} ${w * 0.24} ${top + 4} Q ${w / 2} ${top * 0.5} ${w / 2 + 12} 0 Q 0 10 ${-w / 2 - 10} 0 Z`}
        fill={T.base} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M ${-w * 0.18} ${top + 8} Q ${-w * 0.1} ${top * 0.4} ${-w * 0.2} -6`} stroke={T.shade} strokeWidth={6} fill="none" opacity={0.7} />
      <path d={`M ${w * 0.18} ${top + 10} Q ${w * 0.26} ${top * 0.4} ${w * 0.3} -6`} stroke={T.shade} strokeWidth={6} fill="none" opacity={0.7} />
      <path d={`M ${-w * 0.32} ${top * 0.55} Q ${-w * 0.22} ${top + 6} ${-w * 0.06} ${top - 4}`} stroke={T.key} strokeWidth={4} fill="none" opacity={0.8} />
      {[-0.4, 0.4].map((k) => <circle key={k} cx={w * k} cy={-6} r={6} fill={GS.brass} stroke={INK} strokeWidth={2.5} />)}
      {tag && (
        <g transform={`translate(${w * 0.18},${top * 0.45}) rotate(${6 + Math.sin(f / 13 + seed) * 4})`}>
          <path d="M 0 -26 L 0 -6" stroke={INK} strokeWidth={2.5} />
          <rect x={-6} y={-6} width={gsMonoW(tag, 18) + 20} height={30} rx={4} fill={GS.paper} stroke={INK} strokeWidth={3} />
          <text x={4} y={15} fontFamily={MONO_} fontWeight={800} fontSize={18} fill={INK}>{tag}</text>
        </g>
      )}
    </g>
  );
};

/** a brass stopwatch; sweep is revolutions of the hand (continuous), r the dial radius */
export const Stopwatch: React.FC<{f: number; x: number; y: number; r?: number; sweep?: number; marks?: number; accent?: string}> = ({f, x, y, r = 70, sweep = 0, marks = 12, accent = GS.persimmon}) => {
  const B = tones(GS.brass);
  const a = sweep * Math.PI * 2 - Math.PI / 2;
  return (
    <g transform={`translate(${x},${y})`}>
      <ContactShadow cx={6} cy={r + 6} rx={r * 0.8} ry={8} opacity={0.3} />
      <rect x={-12} y={-r - 30} width={24} height={20} rx={4} fill={B.base} stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={-r - 36} r={10} fill={B.key} stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={0} r={r + 10} fill={B.base} stroke={INK} strokeWidth={6} />
      <path d={`M ${-r - 4} -20 A ${r + 6} ${r + 6} 0 0 1 -20 ${-r - 4}`} stroke={B.key} strokeWidth={5} fill="none" opacity={0.8} />
      <circle cx={0} cy={0} r={r} fill={GS.paper} stroke={INK} strokeWidth={4} />
      {Array.from({length: marks}, (_, i) => {
        const t = (i / marks) * Math.PI * 2;
        return <path key={i} d={`M ${Math.cos(t) * (r - 6)} ${Math.sin(t) * (r - 6)} L ${Math.cos(t) * (r - 16)} ${Math.sin(t) * (r - 16)}`} stroke={INK} strokeWidth={i % 3 === 0 ? 4 : 2} />;
      })}
      <path d={`M 0 0 L ${Math.cos(a) * (r - 14)} ${Math.sin(a) * (r - 14)}`} stroke={accent} strokeWidth={6} strokeLinecap="round" />
      <path d={`M 0 0 L ${Math.cos(a) * (r - 14)} ${Math.sin(a) * (r - 14)}`} stroke={INK} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      <circle cx={0} cy={0} r={7} fill={INK} />
    </g>
  );
};

/** a magnifying glass; hover adds a drift that never lands. (x, y) is the lens centre */
export const Magnifier: React.FC<{f: number; x: number; y: number; scale?: number; hover?: number; tag?: string}> = ({f, x, y, scale = 1, hover = 1, tag}) => {
  const hx = Math.sin(f / 17) * 18 * hover, hy = Math.sin(f / 11 + 1) * 10 * hover - Math.abs(Math.sin(f / 29)) * 14 * hover;
  return (
    <g transform={`translate(${x + hx},${y + hy}) scale(${scale}) rotate(${-14 + Math.sin(f / 23) * 5 * hover})`}>
      <path d="M 70 70 L 170 170" stroke={INK} strokeWidth={30} strokeLinecap="round" />
      <path d="M 70 70 L 170 170" stroke="#6B3E22" strokeWidth={20} strokeLinecap="round" />
      <path d="M 86 80 L 160 154" stroke="#9A6440" strokeWidth={6} strokeLinecap="round" />
      <circle cx={0} cy={0} r={100} fill="#BFE6EE" opacity={0.22} />
      <circle cx={0} cy={0} r={100} fill="none" stroke={INK} strokeWidth={22} />
      <circle cx={0} cy={0} r={100} fill="none" stroke={GS.brass} strokeWidth={13} />
      <path d="M -62 -50 Q -30 -82 10 -80" stroke="#FFFFFF" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8} />
      {tag && (
        <g transform="translate(130,190) rotate(14)">
          <rect x={-6} y={-20} width={gsMonoW(tag, 20) + 20} height={32} rx={4} fill={GS.paper} stroke={INK} strokeWidth={3} />
          <text x={4} y={3} fontFamily={MONO_} fontWeight={800} fontSize={20} fill={INK}>{tag}</text>
        </g>
      )}
    </g>
  );
};

/** an uncut pie on a plate. (x, y) the plate's resting point */
export const Pie: React.FC<{f: number; x: number; y: number; scale?: number; tag?: string}> = ({f, x, y, scale = 1, tag}) => {
  const P = tones(GS.pie);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={110} ry={10} opacity={0.35} />
      <ellipse cx={0} cy={-6} rx={104} ry={22} fill="#EDEAE2" stroke={INK} strokeWidth={4} />
      <path d="M -86 -14 Q -84 -54 0 -60 Q 84 -54 86 -14 Q 0 6 -86 -14 Z" fill={P.base} stroke={INK} strokeWidth={5} />
      <path d="M -70 -36 Q 0 -60 70 -36" stroke={GS.pieCrust} strokeWidth={5} fill="none" />
      {[-40, -12, 16, 44].map((k) => <path key={k} d={`M ${k} -46 l 8 8`} stroke={P.shade} strokeWidth={4} strokeLinecap="round" />)}
      <path d="M -60 -44 Q -40 -56 -10 -56" stroke={P.key} strokeWidth={4} fill="none" opacity={0.8} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${-24 + i * 22} -66 q -8 -14 0 -26 q 8 -12 0 -24`} stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round"
          opacity={0.35 + 0.25 * Math.sin(f / 9 + i)} transform={`translate(0,${-((f * 0.6 + i * 9) % 18)})`} />
      ))}
      {tag && (
        <g transform="translate(60,-8) rotate(8)">
          <path d="M 0 -30 L 0 -10" stroke={INK} strokeWidth={2.5} />
          <rect x={-6} y={-10} width={gsMonoW(tag, 18) + 20} height={30} rx={4} fill={GS.paper} stroke={INK} strokeWidth={3} />
          <text x={4} y={11} fontFamily={MONO_} fontWeight={800} fontSize={18} fill={INK}>{tag}</text>
        </g>
      )}
    </g>
  );
};

/** a coil of old copper wire with an oversized luggage-style tag that can slide down it (slide 0..1) and flutter off (off 0..1) */
export const CopperCoil: React.FC<{f: number; x: number; y: number; scale?: number; tag?: string; slide?: number; off?: number}> = ({f, x, y, scale = 1, tag = 'DUFFY SAID', slide = 0, off = 0}) => {
  const C = tones(GS.copper);
  const sl = clamp01(slide), of = clamp01(off);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={90} ry={10} opacity={0.38} />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={i} cx={(i - 2) * 6} cy={-40 - i * 4} rx={72 - i * 2} ry={30} fill="none" stroke={INK} strokeWidth={13} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={`c${i}`} cx={(i - 2) * 6} cy={-40 - i * 4} rx={72 - i * 2} ry={30} fill="none" stroke={i % 2 ? C.base : C.core} strokeWidth={7} />
      ))}
      <path d="M -50 -70 Q -20 -86 20 -84" stroke={GS.copperL} strokeWidth={4} fill="none" opacity={0.9} />
      <path d="M 66 -40 Q 110 -30 120 -4" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M 66 -40 Q 110 -30 120 -4" stroke={C.base} strokeWidth={5} fill="none" strokeLinecap="round" />
      {of < 0.999 && (
        <g transform={`translate(${70 + sl * 40 + of * 160},${-64 + sl * 50 - of * 120}) rotate(${12 + sl * 20 + of * 160 + Math.sin(f / 10) * 5})`} opacity={1 - of}>
          <path d="M 0 0 L -10 -24" stroke={INK} strokeWidth={3} />
          <path d={`M 0 0 L ${gsMonoW(tag, 22) + 30} 0 L ${gsMonoW(tag, 22) + 30} 40 L 0 40 L -12 20 Z`} fill="#E9C46A" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={4} cy={20} r={4} fill={INK} />
          <text x={16} y={28} fontFamily={MONO_} fontWeight={800} fontSize={22} fill={INK}>{tag}</text>
        </g>
      )}
    </g>
  );
};

/** a desk calendar with a big page; flip 0..1 turns the top page up and away, from `page` to `next` */
export const DeskCalendar: React.FC<{f: number; x: number; y: number; scale?: number; page: string; next?: string; flip?: number}> = ({f, x, y, scale = 1, page, next, flip = 0}) => {
  const fl = clamp01(flip);
  const show = fl > 0.5 && next ? next : page;
  const sq = Math.abs(Math.cos(fl * Math.PI));
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={130} ry={10} opacity={0.35} />
      <path d="M -120 0 L -100 -200 L 100 -200 L 120 0 Z" fill={GS.pine} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-96} y={-196} width={192} height={190} rx={6} fill={GS.paper} stroke={INK} strokeWidth={4} />
      <g transform={`translate(0,-196) scale(1,${Math.max(0.04, sq)})`}>
        <rect x={-96} y={0} width={192} height={190} rx={6} fill={GS.paper} stroke={INK} strokeWidth={4} />
        <rect x={-96} y={0} width={192} height={44} rx={6} fill={GS.persimmon} stroke={INK} strokeWidth={4} />
        <text x={0} y={33} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={28} fill="#FFF6E3">NOV</text>
        <text x={0} y={140} textAnchor="middle" fontFamily={MONO_} fontWeight={800} fontSize={86} fill={INK}>{show}</text>
      </g>
      {[-60, 0, 60].map((k) => <rect key={k} x={k - 6} y={-212} width={12} height={26} rx={5} fill="#9A9AA2" stroke={INK} strokeWidth={3} />)}
    </g>
  );
};

/**
 * A field of router outlines in a grid. total cells drawn, the first `installed` outlined in ivory, the first `lit`
 * glowing cyan (lit pops on one after another as `litT` runs 0..1). (x, y) is the top-left; cell the pitch.
 */
export const RouterField: React.FC<{f: number; x: number; y: number; cols: number; rows: number; cell?: number; installed?: number; lit?: number; litT?: number; seed?: number}> =
({f, x, y, cols, rows, cell = 13, installed = 0, lit = 0, litT = 1, seed = 4}) => {
  const n = cols * rows;
  const order = React.useMemo(() => Array.from({length: n}, (_, i) => i).sort((a, b) => h01(a, seed) - h01(b, seed)), [n, seed]);
  const rank = React.useMemo(() => {
    const r = new Array(n);
    order.forEach((idx, k) => { r[idx] = k; });
    return r;
  }, [order, n]);
  const litN = Math.round(lit * clamp01(litT));
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const cx = x + (i % cols) * cell, cy = y + Math.floor(i / cols) * cell;
    const k = rank[i];
    const isLit = k < litN, isIn = k < installed;
    cells.push(<rect key={i} x={cx} y={cy} width={cell - 3} height={cell * 0.55} rx={1.5}
      fill={isLit ? GS.cyan : isIn ? '#3B4A50' : '#14262A'} stroke={isLit ? '#E8FFFF' : isIn ? GS.ivory : '#2C4448'} strokeWidth={isLit ? 1.4 : isIn ? 1 : 0.8}
      opacity={isLit ? 0.75 + 0.25 * Math.sin(f / 6 + i) : 1} />);
  }
  return <g>{cells}</g>;
};
