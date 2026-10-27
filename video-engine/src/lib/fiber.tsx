import React from 'react';
import {INK, ContactShadow, FormGradient, tones} from './lighting';
import {MONO, monoW} from './prospect';

// =============================================================================
// THE FIBER KIT (NET-NEW 2026-10-27, "The Blank Line")
//
//   Reel      : THE HERO. A cable spool on a two-wheeled cart, with a face on its hub, a crank, a trailing cable and an
//               optional raised arm. Round on purpose (flanges, hub, eyes): the film's ROUND hero among ORTHOGONAL props.
//   SigLine   : THE THROUGHLINE. A dotted signature line with an X and a label, on the contract sheet. fill 0..1 is how
//               much sticky paper covers it; the film never shows it signed.
//   Sticky    : a butter sticky note with a word on it (INTEREST, MOU, FORECAST). Pale, tilted, curled corner.
//   DataBox   : a small faced server box, a petitioner holding a sticky note. Not the antagonist, no vents.
//   Clip      : the SEC. 9 bouncer, a clipboard with a face, crossed arms and a stamp.
//   Pen       : a pen whose origin is its nib (so a hand or a line can put it on the mark).
//   Hen, Egg  : the standoff pair for the fair case against the rule.
//
// Draw space: every component's origin is its base centre (the ground line), +y down.
// Colour licence: saffron is ONLY the Reel. Tomato is ONLY rejection stamps and the cut spark. Butter is ONLY sticky notes.
// =============================================================================
export const FIB = {
  saffron: '#F2C230', saffronHi: '#FADF7A', saffronShade: '#B88A12', cable: '#23262F', cableHi: '#4A5060', tracer: '#E8743B',
  lilac: '#B9B4E0', lilacHi: '#DAD6F2', lilacDeep: '#8F89C4', blush: '#EBD9E6', teal: '#1F6F78', tealHi: '#3A9AA3', tealDeep: '#14474D',
  tan: '#C9A06A', tanHi: '#E2BE8C', tanShade: '#8F6B3C', cream: '#F4EEDC', creamShade: '#D8CDB0', ink: INK, tomato: '#E4492F',
  tomatoDeep: '#9E2A18', butter: '#F4E9A8', butterShade: '#D2C272', paper: '#F1EEF8', box: '#8497AE', boxHi: '#B0C0D2', boxShade: '#55667E', plum: '#3A3466', plumHi: '#5A5398', ochre: '#C98A3A', rose: '#C4707E', leaf: '#4BAE6A',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export type ReelMood = 'calm' | 'hope' | 'worry' | 'ask' | 'surprise' | 'smile' | 'firm';

/** Hand anchor of the Reel's raised arm in the Reel's own space, so a Pen can be parented to it. */
export const reelHand = (raise: number, s: number, x: number, y: number) => {
  const k = clamp01(raise);
  return {x: x + (150 + 90 * k) * s, y: y - (210 + 40 * k) * s};
};

export const Reel: React.FC<{
  x?: number; y?: number; s?: number; f: number; mood?: ReelMood; mouth?: number; look?: number; crank?: number; tail?: number;
  raise?: number; phase?: number; id?: string; facing?: 1 | -1; jolt?: number;
}> = ({x = 0, y = 0, s = 1, f, mood = 'calm', mouth = 0, look = 0, crank = 0, tail = 0, raise = 0, phase = 0, id = 'rl', facing = 1, jolt = 0}) => {
  const breath = 1 + 0.012 * Math.sin(f / 16 + phase);
  const sway = 1.2 * Math.sin(f / 27 + phase) + 0.5 * Math.sin(f / 11.7 + phase * 1.6);
  const roll = crank * 40 + f * 0.9;
  const blink = ((f + Math.floor(phase * 41)) % 96) < 5;
  const lx = Math.max(-6, Math.min(6, look));
  const eyeR = mood === 'surprise' ? 21 : 17;
  const squint = mood === 'worry' ? 0.8 : mood === 'firm' ? 0.65 : 1;
  const brow = (sx: number) => {
    const a = mood === 'worry' ? -14 : mood === 'ask' ? -8 : mood === 'surprise' ? -16 : mood === 'firm' ? 11 : mood === 'hope' ? -6 : 0;
    return `M ${sx * 40 - 22},${-282 + (sx < 0 ? a * 0.5 : 0)} L ${sx * 40 + 22},${-282 + (sx > 0 ? a * 0.5 : 0)}`;
  };
  const mh = 8 + 40 * clamp01(mouth) + (mood === 'smile' || mood === 'hope' ? 6 : 0);
  const k = clamp01(raise);
  const tl = 150 + 260 * clamp01(tail);
  const tf = tones(FIB.saffron);
  return (
    <g transform={`translate(${x},${y - jolt * 10}) rotate(${sway}) scale(${s * facing * (1 + (breath - 1) * 0.5)},${s * breath})`}>
      <defs>
        <FormGradient id={`${id}_f`} t={tf} />
        <FormGradient id={`${id}_h`} t={tones(FIB.saffronHi)} />
        <FormGradient id={`${id}_c`} t={tones(FIB.tan)} />
      </defs>
      <ContactShadow cx={0} cy={6} rx={210} ry={16} opacity={0.38} blur={9} />
      {/* the cart: a plank deck, an axle and two wheels, a handle bar */}
      <rect x={-170} y={-52} width={340} height={30} rx={8} fill={`url(#${id}_c)`} stroke={INK} strokeWidth={6} />
      <rect x={-166} y={-50} width={332} height={8} rx={4} fill="#fff" opacity={0.3} />
      {[-1, 1].map((sx) => (
        <g key={sx} transform={`translate(${sx * 120},-22) rotate(${roll * 0.7 * sx})`}>
          <circle r={36} fill={FIB.cableHi} stroke={INK} strokeWidth={6} />
          <circle r={14} fill={FIB.tan} stroke={INK} strokeWidth={4} />
          {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={0} y1={0} x2={29 * Math.cos((i * Math.PI) / 3)} y2={29 * Math.sin((i * Math.PI) / 3)} stroke={INK} strokeWidth={3.4} />)}
        </g>
      ))}
      <path d="M -170,-48 L -214,-150 L -196,-158" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d="M -170,-48 L -214,-150 L -196,-158" fill="none" stroke={FIB.tanHi} strokeWidth={6} strokeLinecap="round" />
      {/* the trailing cable: leaves the bottom of the drum and runs out along the deck */}
      <path d={`M -80,-86 Q -120,-30 ${-190 - tl * 0.2},-18 T ${-190 - tl},-6`} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
      <path d={`M -80,-86 Q -120,-30 ${-190 - tl * 0.2},-18 T ${-190 - tl},-6`} fill="none" stroke={FIB.cable} strokeWidth={16} strokeLinecap="round" />
      <path d={`M -80,-86 Q -120,-30 ${-190 - tl * 0.2},-18 T ${-190 - tl},-6`} fill="none" stroke={FIB.tracer} strokeWidth={4} strokeLinecap="round" strokeDasharray="14 12" strokeDashoffset={-roll} />
      {/* the spool: a back flange, the wound cable band, the front flange with the face */}
      <g transform="translate(0,-232)">
        <circle r={160} fill={FIB.saffronShade} stroke={INK} strokeWidth={7} />
        <circle r={134} fill={FIB.cable} stroke={INK} strokeWidth={5} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} r={108 + i * 3.7} fill="none" stroke={FIB.cableHi} strokeWidth={1.6} opacity={0.45} />)}
        <circle r={122} fill="none" stroke={FIB.tracer} strokeWidth={5} strokeDasharray="22 26" strokeDashoffset={-roll * 2.4} />
        <circle r={96} fill="none" stroke={FIB.tracer} strokeWidth={4} strokeDasharray="14 20" strokeDashoffset={roll * 2} opacity={0.8} />
        {/* front flange, a ring, so the wound cable shows through the window */}
        <circle r={160} fill="none" stroke={`url(#${id}_f)`} strokeWidth={26} />
        <circle r={174} fill="none" stroke={INK} strokeWidth={6} />
        <circle r={147} fill="none" stroke={INK} strokeWidth={5} />
        {Array.from({length: 8}).map((_, i) => {
          const a = (i * Math.PI) / 4 + 0.2;
          return <circle key={i} cx={160 * Math.cos(a)} cy={160 * Math.sin(a)} r={7} fill={FIB.saffronHi} stroke={INK} strokeWidth={3.4} />;
        })}
        <path d="M -150,-60 A 160,160 0 0 1 -60,-148" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.5} />
        {/* the hub, which is the face */}
        <circle r={86} fill={`url(#${id}_h)`} stroke={INK} strokeWidth={7} />
        <circle r={86} fill="none" stroke={FIB.saffronShade} strokeWidth={5} opacity={0.5} transform="scale(0.92)" />
        {[-1, 1].map((sx) => (
          <g key={sx}>
            <ellipse cx={sx * 38} cy={-26} rx={eyeR + 5} ry={(eyeR + 5) * (blink ? 0.12 : squint)} fill={FIB.cream} stroke={INK} strokeWidth={5} />
            {!blink && <circle cx={sx * 38 + lx} cy={-26} r={eyeR * 0.52} fill={INK} />}
            {!blink && <circle cx={sx * 38 + lx + 4} cy={-31} r={4} fill="#fff" />}
            <path d={brow(sx).replace(/-282/g, '-62')} stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
          </g>
        ))}
        <path d={`M -34,28 Q 0,${28 + mh} 34,28 Q 0,${28 + (mood === 'worry' ? -6 : 4)} -34,28 Z`} fill={mood === 'worry' ? FIB.saffronShade : '#6C1F18'} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <circle r={14} cx={0} cy={66} fill={FIB.saffronShade} stroke={INK} strokeWidth={4} />
        {/* the crank on the hub's rim */}
        <g transform={`rotate(${roll * 0.6},0,0)`}>
          <line x1={0} y1={0} x2={0} y2={-120} stroke={INK} strokeWidth={15} strokeLinecap="round" />
          <line x1={0} y1={0} x2={0} y2={-120} stroke={FIB.cableHi} strokeWidth={7} strokeLinecap="round" />
          <circle cx={0} cy={-124} r={17} fill={FIB.saffronHi} stroke={INK} strokeWidth={5} />
        </g>
      </g>
      {/* a mitten arm, raised by `raise`: it leaves the flange's right edge and ends in a round hand */}
      <g>
        <path d={`M 150,-232 Q ${176 + 30 * k},${-232 - 40 * k} ${150 + 90 * k},${-210 - 40 * k}`} fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
        <path d={`M 150,-232 Q ${176 + 30 * k},${-232 - 40 * k} ${150 + 90 * k},${-210 - 40 * k}`} fill="none" stroke={FIB.saffron} strokeWidth={18} strokeLinecap="round" />
        <circle cx={150 + 90 * k} cy={-210 - 40 * k} r={22} fill={FIB.saffronHi} stroke={INK} strokeWidth={5} />
      </g>
    </g>
  );
};

/** a pen with its NIB at the origin, pointing down-left; rot turns it. */
export const Pen: React.FC<{x: number; y: number; s?: number; rot?: number; f?: number; body?: string}> = ({x, y, s = 1, rot = 28, f = 0, body = '#2C3A8C'}) => (
  <g transform={`translate(${x},${y}) rotate(${rot + 1.6 * Math.sin(f / 9)}) scale(${s})`}>
    <path d="M 0,0 L -9,-34 L 9,-34 Z" fill={FIB.creamShade} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M 0,-2 L -2.6,-12 L 2.6,-12 Z" fill={INK} />
    <rect x={-11} y={-190} width={22} height={158} rx={9} fill={body} stroke={INK} strokeWidth={5} />
    <rect x={-6} y={-184} width={5} height={140} rx={2.5} fill="#fff" opacity={0.32} />
    <rect x={-13} y={-124} width={26} height={9} rx={3} fill={FIB.cream} stroke={INK} strokeWidth={3} />
    <path d="M 8,-188 q 20,6 16,40" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
  </g>
);

/** the throughline: a dotted signature line with an X. cover 0..1 is how much of it is papered over (clipped from the left). */
export const SigLine: React.FC<{x: number; y: number; w?: number; f: number; label?: string; pulse?: number; ink?: string; size?: number}> = ({x, y, w = 300, f, label = 'BINDING CUSTOMER', pulse = 0, ink = INK, size = 18}) => (
  <g transform={`translate(${x},${y})`}>
    <text x={-w / 2} y={-6} fontFamily={MONO} fontWeight={800} fontSize={34} fill={ink}>X</text>
    <line x1={-w / 2 + 34} y1={0} x2={w / 2} y2={0} stroke={ink} strokeWidth={5 + 2 * pulse} strokeLinecap="round" strokeDasharray="2 12" strokeDashoffset={-(f / 3) % 14} />
    <text x={0} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.5} fill={ink} opacity={0.8}>{label}</text>
    {pulse > 0.05 && <rect x={-w / 2 - 8} y={-30} width={w + 16} height={44} rx={8} fill="none" stroke={FIB.saffronShade} strokeWidth={4} opacity={0.7 * pulse} />}
  </g>
);

/** a butter sticky note with a word; origin top-centre, so it sits on a surface when placed at the surface edge. */
export const Sticky: React.FC<{x: number; y: number; s?: number; rot?: number; text: string; f?: number; size?: number; heart?: boolean; flap?: number}> = ({x, y, s = 1, rot = 0, text, f = 0, size = 22, heart = false, flap = 0}) => {
  const w = Math.max(104, monoW(text, size) + 30), h = 96;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot + 2 * Math.sin(f / 13 + x * 0.01) + flap * 6 * Math.sin(f / 3)}) scale(${s})`}>
      <rect x={-w / 2 + 5} y={7} width={w} height={h} fill="#000" opacity={0.22} />
      <path d={`M ${-w / 2},0 L ${w / 2},0 L ${w / 2},${h - 22} L ${w / 2 - 22},${h} L ${-w / 2},${h} Z`} fill={FIB.butter} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M ${w / 2},${h - 22} L ${w / 2 - 22},${h - 22} L ${w / 2 - 22},${h} Z`} fill={FIB.butterShade} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-w / 2} y={0} width={w} height={14} fill={FIB.butterShade} opacity={0.5} />
      <text x={0} y={h / 2 + 10} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1} fill={INK}>{text}</text>
      {heart && <path d="M 36,30 q -9,-14 -17,-3 q -3,11 17,24 q 20,-13 17,-24 q -8,-11 -17,3 Z" fill={FIB.rose} stroke={INK} strokeWidth={2.4} transform="scale(0.5) translate(40,-4)" />}
    </g>
  );
};

export type BoxMood = 'hope' | 'shy' | 'sweat' | 'cheer' | 'blank' | 'shock' | 'smug';

/** a small faced server box (petitioner). 120 wide, 150 tall; origin base centre. */
export const DataBox: React.FC<{x?: number; y?: number; s?: number; f: number; mood?: BoxMood; phase?: number; id?: string; hop?: number; look?: number; hat?: boolean; ghost?: boolean; faceless?: boolean}> = ({x = 0, y = 0, s = 1, f, mood = 'hope', phase = 0, id = 'db', hop = 0, look = 0, hat = false, ghost = false, faceless = false}) => {
  const bob = 2.4 * Math.sin(f / 11 + phase) + 1.4 * Math.sin(f / 5.3 + phase * 1.4);
  const blink = ((f + Math.floor(phase * 53)) % 88) < 4;
  const lx = Math.max(-4, Math.min(4, look));
  const eyeH = blink ? 0.12 : mood === 'sweat' ? 0.7 : 1;
  const t = tones(FIB.box);
  const led = [0, 1, 2].map((i) => 0.5 + 0.5 * Math.sin(f / 6 + i * 2 + phase));
  return (
    <g transform={`translate(${x},${y - hop * 30 + bob * 0.4}) scale(${s})`} opacity={ghost ? 0.55 : 1}>
      <defs><FormGradient id={`${id}_g`} t={t} /></defs>
      <ContactShadow cx={0} cy={4} rx={70} ry={9} opacity={0.34} blur={7} />
      {[-1, 1].map((sx) => <rect key={sx} x={sx * 36 - 14} y={-14} width={28} height={14} rx={4} fill={FIB.boxShade} stroke={INK} strokeWidth={4} />)}
      <rect x={-60} y={-150} width={120} height={138} rx={4} fill={ghost ? 'none' : `url(#${id}_g)`} stroke={INK} strokeWidth={6} strokeDasharray={ghost ? '14 10' : undefined} />
      <rect x={-52} y={-144} width={104} height={9} rx={4} fill="#fff" opacity={0.3} />
      {[0, 1, 2].map((i) => <circle key={i} cx={-38 + i * 14} cy={-124} r={4.4} fill={led[i] > 0.5 ? FIB.cream : FIB.boxShade} stroke={INK} strokeWidth={2.2} />)}
      {!faceless && [-1, 1].map((sx) => (
        <g key={sx}>
          <ellipse cx={sx * 24} cy={-92} rx={14} ry={14 * eyeH} fill={FIB.cream} stroke={INK} strokeWidth={4} />
          {!blink && <circle cx={sx * 24 + lx} cy={-92} r={6.5} fill={INK} />}
        </g>
      ))}
      {!faceless && mood === 'sweat' && <path d="M 52,-118 q 7,12 0,18 q -7,-6 0,-18 Z" fill="#9FD2F2" stroke={INK} strokeWidth={2.6} />}
      {!faceless && <path d={mood === 'shy' || mood === 'sweat' ? 'M -20,-56 Q 0,-62 20,-56' : mood === 'shock' ? 'M -12,-62 Q 0,-42 12,-62 Q 0,-70 -12,-62 Z' : 'M -22,-62 Q 0,-42 22,-62'} fill={mood === 'shock' ? '#6C1F18' : 'none'} stroke={INK} strokeWidth={5} strokeLinecap="round" />}
      {faceless && [0, 1].map((i) => <rect key={i} x={-40} y={-98 + i * 26} width={80} height={10} rx={2} fill={FIB.boxShade} stroke={INK} strokeWidth={2.6} opacity={0.8} />)}
      {!faceless && mood === 'cheer' && <path d="M -46,-70 q 8,-6 16,0 M 30,-70 q 8,-6 16,0" stroke={FIB.rose} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.55} />}
      <rect x={-40} y={-44} width={80} height={14} rx={4} fill={FIB.boxShade} stroke={INK} strokeWidth={3.4} opacity={0.85} />
      {hat && (
        <g transform="translate(0,-150)">
          <path d="M -28,0 L 0,-52 L 28,0 Z" fill={FIB.teal} stroke={INK} strokeWidth={4.4} strokeLinejoin="round" />
          <circle cx={0} cy={-54} r={7} fill={FIB.butter} stroke={INK} strokeWidth={3.4} />
        </g>
      )}
    </g>
  );
};

/** the SEC. 9 bouncer: a clipboard with a face and crossed arms. 150 wide, 250 tall; origin base centre. */
export const Clip: React.FC<{x?: number; y?: number; s?: number; f: number; mood?: 'firm' | 'smug' | 'ask' | 'calm'; stamp?: number; id?: string; phase?: number}> = ({x = 0, y = 0, s = 1, f, mood = 'firm', stamp = 0, id = 'cl', phase = 0}) => {
  const sway = 1.6 * Math.sin(f / 23 + phase);
  const blink = ((f + 17) % 100) < 4;
  const t = tones('#E9E2CF');
  const sl = clamp01(stamp);
  return (
    <g transform={`translate(${x},${y}) rotate(${sway}) scale(${s})`}>
      <defs><FormGradient id={`${id}_g`} t={t} /><FormGradient id={`${id}_p`} t={tones(FIB.cream)} /></defs>
      <ContactShadow cx={0} cy={4} rx={86} ry={11} opacity={0.36} blur={8} />
      {[-1, 1].map((sx) => <rect key={sx} x={sx * 30 - 13} y={-30} width={26} height={30} rx={5} fill={FIB.cable} stroke={INK} strokeWidth={5} />)}
      <rect x={-72} y={-270} width={144} height={246} rx={4} fill={`url(#${id}_g)`} stroke={INK} strokeWidth={7} />
      <rect x={-58} y={-240} width={116} height={204} rx={6} fill={`url(#${id}_p)`} stroke={INK} strokeWidth={4} />
      <rect x={-36} y={-290} width={72} height={34} rx={4} fill={FIB.teal} stroke={INK} strokeWidth={6} />
      <rect x={-22} y={-298} width={44} height={14} rx={6} fill={FIB.creamShade} stroke={INK} strokeWidth={4} />
      {[0, 1, 2, 3].map((i) => <line key={i} x1={-46} y1={-218 + i * 18} x2={46 - (i % 2) * 22} y2={-218 + i * 18} stroke={INK} strokeWidth={3} opacity={0.4} />)}
      {[-1, 1].map((sx) => (
        <g key={sx}>
          <ellipse cx={sx * 24} cy={-172} rx={12} ry={blink ? 1.6 : 13} fill={FIB.cream} stroke={INK} strokeWidth={4} />
          {!blink && <circle cx={sx * 24} cy={-170} r={5.6} fill={INK} />}
          <path d={`M ${sx * 24 - 15},${-192 + (mood === 'firm' ? -sx * 4 + 4 : 0)} L ${sx * 24 + 15},${-192 + (mood === 'firm' ? sx * 4 + 4 : 0)}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      <path d={mood === 'smug' ? 'M -22,-132 Q 0,-122 22,-136' : mood === 'ask' ? 'M -16,-132 Q 0,-140 16,-132' : 'M -22,-134 L 22,-134'} fill="none" stroke={INK} strokeWidth={5.4} strokeLinecap="round" />
      {/* crossed arms */}
      <path d="M -72,-112 Q -20,-70 60,-100" fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
      <path d="M -72,-112 Q -20,-70 60,-100" fill="none" stroke={FIB.tealHi} strokeWidth={14} strokeLinecap="round" />
      <path d="M 72,-112 Q 20,-62 -60,-96" fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
      <path d="M 72,-112 Q 20,-62 -60,-96" fill="none" stroke={FIB.teal} strokeWidth={14} strokeLinecap="round" />
      {/* the stamp that comes down on the sheet */}
      {sl > 0.02 && (
        <g transform={`translate(0,${-250 + 90 * sl})`} opacity={clamp01(sl * 3)}>
          <rect x={-18} y={-60} width={36} height={52} rx={8} fill={FIB.tomatoDeep} stroke={INK} strokeWidth={5} />
          <rect x={-30} y={-12} width={60} height={16} rx={4} fill={FIB.tomato} stroke={INK} strokeWidth={5} />
        </g>
      )}
    </g>
  );
};

export type HenMood = 'firm' | 'sweat' | 'ask' | 'calm';
/** the customer hen in a hard hat; 150 wide, 200 tall; origin base centre; faces right by default. */
export const Hen: React.FC<{x?: number; y?: number; s?: number; f: number; mood?: HenMood; facing?: 1 | -1; phase?: number; id?: string; tap?: number}> = ({x = 0, y = 0, s = 1, f, mood = 'firm', facing = 1, phase = 0, id = 'hn', tap = 0}) => {
  const bob = 3 * Math.sin(f / 14 + phase);
  const blink = ((f + 31) % 110) < 5;
  const t = tones('#F4EAD4');
  return (
    <g transform={`translate(${x},${y + bob * 0.3}) scale(${s * facing},${s})`}>
      <defs><FormGradient id={`${id}_g`} t={t} /></defs>
      <ContactShadow cx={0} cy={4} rx={86} ry={11} opacity={0.36} blur={8} />
      <path d="M -66,-30 Q -90,-90 -62,-130 Q -20,-210 40,-170 Q 86,-120 70,-60 Q 56,-8 0,-6 Q -40,-6 -66,-30 Z" fill={`url(#${id}_g)`} stroke={INK} strokeWidth={6} />
      <path d="M -62,-92 Q -108,-110 -96,-60 Q -78,-34 -46,-52 Z" fill="#E7D8B8" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {[-1, 1].map((sx) => <path key={sx} d={`M ${sx * 22},-8 L ${sx * 22},0 M ${sx * 22 - 12},2 L ${sx * 22 + 12},2`} stroke={FIB.ochre} strokeWidth={6} strokeLinecap="round" />)}
      <path d="M 66,-132 L 100,-120 L 68,-108 Z" fill={FIB.ochre} stroke={INK} strokeWidth={4.4} strokeLinejoin="round" />
      <path d="M 40,-184 q 6,-22 20,-14 q 6,-24 20,-8 q 10,-6 8,18 Z" fill={FIB.rose} stroke={INK} strokeWidth={4} />
      <ellipse cx={46} cy={-136} rx={11} ry={blink ? 1.5 : 12} fill={FIB.cream} stroke={INK} strokeWidth={4} />
      {!blink && <circle cx={49} cy={-135} r={5} fill={INK} />}
      <path d={`M 32,-158 L 62,${mood === 'firm' ? -150 : -158}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      {mood === 'sweat' && <path d="M 8,-168 q 7,12 0,18 q -7,-6 0,-18 Z" fill="#9FD2F2" stroke={INK} strokeWidth={2.6} />}
      {/* the hard hat */}
      <path d="M 14,-176 Q 30,-218 70,-186 L 78,-172 L 6,-168 Z" fill={FIB.tealHi} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={0} y={-174} width={84} height={9} rx={4} fill={FIB.teal} stroke={INK} strokeWidth={4} />
      {tap > 0.02 && <circle cx={-40} cy={-60} r={8 + 10 * tap} fill="none" stroke={FIB.cableHi} strokeWidth={4} opacity={1 - tap} />}
    </g>
  );
};

/** the egg: the next length of cable that won't hatch until a customer signs. 110 wide, 140 tall; origin base centre. */
export const Egg: React.FC<{x?: number; y?: number; s?: number; f: number; mood?: 'ask' | 'sweat' | 'calm'; crack?: number; phase?: number; id?: string}> = ({x = 0, y = 0, s = 1, f, mood = 'ask', crack = 0, phase = 0, id = 'eg'}) => {
  const rock = 2.2 * Math.sin(f / 19 + phase);
  const t = tones('#EFE3CB');
  return (
    <g transform={`translate(${x},${y}) rotate(${rock},0,0) scale(${s})`}>
      <defs><FormGradient id={`${id}_g`} t={t} /></defs>
      <ContactShadow cx={0} cy={4} rx={60} ry={9} opacity={0.34} blur={7} />
      <path d="M 0,-4 Q -54,-8 -52,-70 Q -50,-146 0,-146 Q 50,-146 52,-70 Q 54,-8 0,-4 Z" fill={`url(#${id}_g)`} stroke={INK} strokeWidth={6} />
      <path d="M -36,-100 Q -34,-130 -12,-136" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.6} />
      {[-1, 1].map((sx) => (
        <g key={sx}><ellipse cx={sx * 18} cy={-76} rx={9} ry={11} fill={FIB.cream} stroke={INK} strokeWidth={3.6} /><circle cx={sx * 18 + 1} cy={-75} r={4} fill={INK} /></g>
      ))}
      <path d={mood === 'sweat' ? 'M -12,-46 Q 0,-52 12,-46' : 'M -12,-48 Q 0,-40 12,-48'} fill="none" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
      {mood === 'sweat' && <path d="M 34,-110 q 6,10 0,15 q -6,-5 0,-15 Z" fill="#9FD2F2" stroke={INK} strokeWidth={2.4} />}
      <path d="M -20,-146 L -8,-128 L -22,-118 L -6,-102" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={clamp01(crack)} />
    </g>
  );
};
