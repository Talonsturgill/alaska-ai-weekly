import React from 'react';
import {INK, ContactShadow, FormGradient, tones} from './lighting';
import {MONO, monoW} from './prospect';

// =============================================================================
// THE BALLOT KIT (NET-NEW 2026-10-26, "Not Yes or No")
//
//   BallotBox : THE HERO. A hard steel-blue box on stubby feet with a lid, a cranberry flag, two eyes and a SLOT
//               for a mouth. It swallows and spits slips. It reacts to the SLIP and to SIZE and to the grid, never
//               to a candidate or a side. Built new because no shelf asset is a box with a slot mouth
//               (Cubby/ServerBox are machines, Plate/Dotty/Folio are signs and paper, ReserveBar is a gauge).
//   Slip      : THE THROUGHLINE. A cream ballot slip with two clicked boxes YES and NO that MELT (melt 0..1) and
//               set into three sliding rails SIZE / PLACE / WHO PAYS. The same slip becomes the blank rule sheet.
//   Rails     : the three rails alone (labels, knob positions 0..1, a pulse per rail), also used off the slip.
//   Lectern   : a faceless lectern (named Lectern because the shelf already has Podium in polecam.tsx) silhouette with a boxed name card; lit, with an optional pennant.
//   Gate      : a padlocked gate. A PAUSE WITH AN END CONDITION: a keyhole and a key (STUDY or FRAMEWORK), never a wall.
//   InTray    : a wooden IN tray with a LATER tab and a lamp; takes a sheet.
//   BillSheet : a paper sheet that can lie face down, flip over, and type its headings.
//
// Draw space: the BallotBox's origin is the base centre (the ground line), +y down, 260 wide and about 330 tall.
// Colour licence: cranberry is ONLY the flag and curtains; aurora green (BAL.aurora) is ONLY electricity.
// =============================================================================
export const BAL = {
  steel: '#5C7FA3', steelHi: '#8FB0CF', steelShade: '#3A5675', cream: '#F6EFDC', creamShade: '#DACDAE', cranberry: '#A8402F',
  navy: '#1E2B4D', honey: '#D9A441', honeyHi: '#F0C566', honeyShade: '#9A6E22', sage: '#BFD1C0', maple: '#E3C183', dusk: '#3F4468', wood: '#A8743F', woodHi: '#C99A62', woodShade: '#6E4724',
  aurora: '#43D17A', ink: INK,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type BoxMood = 'blank' | 'squint' | 'sweat' | 'worried' | 'ask' | 'calm' | 'surprise';

export const BallotBox: React.FC<{
  x?: number; y?: number; s?: number; f: number; mood?: BoxMood; mouth?: number; look?: number; flagDroop?: number; phase?: number; id?: string; facing?: 1 | -1;
}> = ({x = 0, y = 0, s = 1, f, mood = 'blank', mouth = 0, look = 0, flagDroop = 0, phase = 0, id = 'bb', facing = 1}) => {
  const t = tones(BAL.steel);
  const gid = `${id}_g`;
  const breath = 1 + 0.012 * Math.sin(f / 16 + phase) + 0.004 * Math.sin(f / 6.3 + phase * 2);
  const sway = 1.4 * Math.sin(f / 27 + phase) + 0.6 * Math.sin(f / 11.7 + phase * 1.6);
  const blink = ((f + Math.floor(phase * 41)) % 94) < 5;
  // a TALL UPRIGHT box (200 x 300) with a SLANTED HINGED LID, the deposit slot on top, a carry handle and stubby legs.
  const W = 200, Hh = 300, feet = 24;
  const top = -feet - Hh;
  const squint = mood === 'squint' ? 0.4 : mood === 'sweat' ? 0.8 : mood === 'calm' ? 0.7 : 1;
  const eyeR = mood === 'surprise' ? 22 : 18;
  const ex = 44;
  const ey = top + 74;
  const lx = Math.max(-7, Math.min(7, look));
  const mY = top + 176;
  const mw = 124;
  const mh = 12 + 50 * clamp01(mouth);
  const brow = (sx: number) => {
    const a = mood === 'worried' || mood === 'sweat' ? -12 : mood === 'squint' ? 12 : mood === 'ask' ? -7 : mood === 'surprise' ? -16 : 0;
    return `M ${sx * ex - 22},${ey - 32 + (sx < 0 ? a * 0.5 : 0)} L ${sx * ex + 22},${ey - 32 + (sx > 0 ? a * 0.5 : 0)}`;
  };
  const droop = clamp01(flagDroop);
  const tail = 6 * Math.sin(f / 9 + phase) * (1 - droop * 0.7);
  return (
    <g transform={`translate(${x},${y}) rotate(${sway}) scale(${s * facing * (1 + (breath - 1) * 0.5)},${s * breath})`}>
      <defs><FormGradient id={gid} t={t} /></defs>
      <ContactShadow cx={0} cy={4} rx={W * 0.55} ry={12} opacity={0.34} blur={8} />
      {[-1, 1].map((sx) => (
        <rect key={sx} x={sx * 66 - 24} y={-feet} width={48} height={feet} rx={7} fill={BAL.steelShade} stroke={INK} strokeWidth={5} />
      ))}
      <rect x={-W / 2} y={top} width={W} height={Hh} rx={14} fill={`url(#${gid})`} stroke={INK} strokeWidth={7} />
      <rect x={-W / 2 + 9} y={top + 26} width={12} height={Hh - 40} rx={5} fill={BAL.steelHi} opacity={0.5} />
      {/* the slanted hinged lid, slot on top, carry handle */}
      <path d={`M ${-W / 2 - 14},${top + 6} L ${-W / 2 + 22},${top - 52} L ${W / 2 - 22},${top - 52} L ${W / 2 + 14},${top + 6} Z`} fill={BAL.cream} stroke={INK} strokeWidth={6.4} strokeLinejoin="round" />
      <path d={`M ${-W / 2 - 4},${top + 1} L ${W / 2 + 4},${top + 1}`} stroke={BAL.creamShade} strokeWidth={6} />
      <path d={`M ${-W / 2 + 36},${top - 46} L ${W / 2 - 36},${top - 46}`} stroke="#fff" strokeWidth={4} opacity={0.6} />
      <path d={`M -50,${top - 24} L 50,${top - 24} L 46,${top - 14} L -46,${top - 14} Z`} fill={INK} />
      <rect x={-8} y={top + 2} width={16} height={9} rx={3} fill={BAL.steelShade} stroke={INK} strokeWidth={3.4} />
      <path d={`M -34,${top - 56} Q -34,${top - 98} 0,${top - 98} Q 34,${top - 98} 34,${top - 56}`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d={`M -34,${top - 56} Q -34,${top - 98} 0,${top - 98} Q 34,${top - 98} 34,${top - 56}`} fill="none" stroke={BAL.honey} strokeWidth={6} strokeLinecap="round" />
      {/* the brick-red seal ribbon (brick red is ONLY this and the curtains) */}
      <g transform={`translate(${W / 2 + 6},${top + 8})`}>
        <rect x={-14} y={-6} width={28} height={14} rx={3} fill={BAL.cranberry} stroke={INK} strokeWidth={4} />
        <path d={`M -9,8 q ${-4 + tail},${28 + droop * 28} ${-2 + tail * 0.5},${58 + droop * 40} l 12,${-6} q ${4 + tail * 0.4},${-26} ${8},${-52} Z`} fill={BAL.cranberry} stroke={INK} strokeWidth={4.4} strokeLinejoin="round" />
      </g>
      {/* rivets */}
      {[-1, 1].map((sx) => [0, 1].map((r) => (
        <circle key={`${sx}${r}`} cx={sx * (W / 2 - 16)} cy={top + 36 + r * 190} r={5.4} fill={BAL.steelShade} stroke={INK} strokeWidth={2.6} />
      )))}
      {/* the face: eyes above, a return slot for a mouth */}
      {[-1, 1].map((sx) => (
        <g key={sx} transform={`translate(${sx * ex},${ey})`}>
          <ellipse cx={0} cy={0} rx={eyeR} ry={blink ? 2.6 : eyeR * squint + 2} fill="#fff" stroke={INK} strokeWidth={4.4} />
          {!blink && <circle cx={lx} cy={mood === 'sweat' ? 3 : 0} r={eyeR * 0.46} fill={INK} />}
          {!blink && <circle cx={lx + 4} cy={-3} r={3.2} fill="#fff" />}
        </g>
      ))}
      {[-1, 1].map((sx) => <path key={sx} d={brow(sx)} stroke={INK} strokeWidth={6.5} strokeLinecap="round" fill="none" />)}
      {mood === 'sweat' && <path d={`M ${ex + 30},${ey - 8} q 10,16 0,26 q -12,-8 0,-26 Z`} fill="#BFE3F2" stroke={INK} strokeWidth={3} />}
      <rect x={-mw / 2} y={mY - mh / 2} width={mw} height={mh} rx={Math.min(16, mh / 2)} fill="#0E1426" stroke={INK} strokeWidth={5.4} />
      <rect x={-mw / 2 + 8} y={mY - mh / 2 + 3} width={mw - 16} height={3.4} rx={1.7} fill={BAL.steelHi} opacity={0.35} />
      {mood === 'worried' && <path d={`M ${-mw / 2 - 4},${mY + mh / 2 + 12} q 16,-12 32,0 t 32,0 t 32,0 t 32,0`} stroke={INK} strokeWidth={4} fill="none" opacity={0.5} />}
      <rect x={-52} y={top + Hh - 52} width={104} height={24} rx={5} fill={BAL.cream} stroke={INK} strokeWidth={3.6} />
      <text x={0} y={top + Hh - 34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} letterSpacing={2} fill={INK}>BALLOTS</text>
    </g>
  );
};

// ----------------------------------------------------------------------------------------------------------------------------------------
export type RailSet = {labels?: [string, string, string]; vals: [number, number, number]; pulse?: [number, number, number]; show?: number; w?: number; id?: string; onlyIdx?: number};

/** three rails with knobs. vals are 0..1 along each rail. pulse (0..1) swells a knob. show fades the set. onlyIdx draws one rail only. */
export const Rails: React.FC<{x?: number; y?: number; s?: number; f: number} & RailSet> = ({x = 0, y = 0, s = 1, f, labels = ['SIZE', 'PLACE', 'WHO PAYS'], vals, pulse = [0, 0, 0], show = 1, w = 300, onlyIdx}) => {
  if (show <= 0.01) return null;
  const rows = onlyIdx === undefined ? [0, 1, 2] : [onlyIdx];
  const gap = 96;
  const knobT = tones(BAL.honey);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={clamp01(show)}>
      {rows.map((i, r) => {
        const yy = r * gap;
        const kx = -w / 2 + 28 + (w - 56) * clamp01(vals[i]);
        const p = clamp01(pulse[i]);
        return (
          <g key={i} transform={`translate(0,${yy})`}>
            <text x={-w / 2} y={-30} fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={2} fill={INK}>{labels[i]}</text>
            <rect x={-w / 2} y={-8} width={w} height={20} rx={10} fill={BAL.navy} stroke={INK} strokeWidth={4} />
            <rect x={-w / 2 + 6} y={-4} width={w - 12} height={5} rx={2.5} fill="#fff" opacity={0.18} />
            {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={-w / 2 + 28 + ((w - 56) / 4) * k - 1.5} y={16} width={3} height={10} fill={INK} opacity={0.6} />)}
            <g transform={`translate(${kx},${2}) scale(${1 + 0.28 * p})`}>
              <ellipse cx={3} cy={5} rx={22} ry={9} fill="#000" opacity={0.28} />
              <circle cx={0} cy={0} r={22} fill={knobT.base} stroke={INK} strokeWidth={5} />
              <path d="M -13,-8 A 17,17 0 0 1 8,-15" stroke={BAL.honeyHi} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.85} />
              <circle cx={0} cy={0} r={6.5} fill={knobT.core} stroke={INK} strokeWidth={2.6} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

// ----------------------------------------------------------------------------------------------------------------------------------------
/**
 * THE SLIP. Draw space: centre origin, 380 wide, 520 tall. melt 0 = two clicked boxes YES / NO, melt 1 = the boxes have dripped
 * away and three rails stand in their place. `blank` turns it into a blank rule sheet headed `head`.
 */
export const Slip: React.FC<{
  x?: number; y?: number; s?: number; rot?: number; f: number; melt?: number; head?: string; vals?: [number, number, number]; pulse?: [number, number, number];
  blank?: boolean; headSize?: number; penAt?: number; id?: string; tick?: 'none' | 'yes' | 'no';
}> = ({x = 0, y = 0, s = 1, rot = 0, f, melt = 0, head = 'DATA CENTERS?', vals = [0.5, 0.5, 0.5], pulse = [0, 0, 0], blank = false, headSize = 30, penAt, id = 'sl'}) => {
  const t = tones(BAL.cream);
  const gid = `${id}_g`;
  const W = 380, H = 520;
  const m = clamp01(melt);
  const boxFade = 1 - clamp01((m - 0.55) / 0.3);
  const sag = m * 70;
  const flutter = 2.2 * Math.sin(f / 13 + x * 0.01) + 0.8 * Math.sin(f / 5.3);
  const box = (cx: number, label: string, i: number) => {
    const h = 130 + m * 64 * (i % 2 === 0 ? 1 : 1.3);
    const drip = m * (48 + 26 * i);
    return (
      <g key={label} opacity={boxFade} transform={`translate(${cx},${-60 + m * 40})`}>
        <path d={`M -62,${-65} L 62,${-65} Q 70,${-65} 70,-57 L 70,${h - 90} Q 70,${h - 90 + 20 * m} 46,${h - 90 + drip * 0.55} Q 38,${h - 90 + drip} 30,${h - 90 + drip * 0.6} Q 20,${h - 90 + 12 * m} -2,${h - 90 + drip * 0.9} Q -16,${h - 90 + drip} -26,${h - 90 + drip * 0.5} Q -50,${h - 90 + 16 * m} -70,${h - 90} L -70,-57 Q -70,-65 -62,-65 Z`}
          fill={BAL.cream} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d={`M -56,${-58} L 56,${-58}`} stroke="#fff" strokeWidth={5} opacity={0.6} />
        <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} letterSpacing={2} fill={INK} transform={`translate(0,${m * 18}) scale(1,${1 + m * 0.5})`}>{label}</text>
      </g>
    );
  };
  return (
    <g transform={`translate(${x},${y}) rotate(${rot + flutter}) scale(${s})`}>
      <defs><FormGradient id={gid} t={t} softness={0.5} /></defs>
      <rect x={-W / 2 + 10} y={-H / 2 + 12} width={W} height={H} rx={10} fill="#000" opacity={0.28} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={10} fill={`url(#${gid})`} stroke={INK} strokeWidth={7} />
      <rect x={-W / 2 + 12} y={-H / 2 + 12} width={W - 24} height={H - 24} rx={5} fill="none" stroke={BAL.navy} strokeWidth={2.4} opacity={0.5} />
      {/* header band */}
      <rect x={-W / 2 + 24} y={-H / 2 + 28} width={W - 48} height={64} rx={5} fill={BAL.navy} stroke={INK} strokeWidth={4} />
      <text x={0} y={-H / 2 + 70} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={headSize} letterSpacing={2} fill={BAL.cream}>{head}</text>
      {!blank && <>
        {box(-92, 'YES', 0)}
        {box(92, 'NO', 1)}
        {m > 0.5 && <Rails x={0} y={-60 + sag * 0.2} s={0.95} f={f} vals={vals} pulse={pulse} show={clamp01((m - 0.55) / 0.3)} w={300} />}
      </>}
      {blank && <>
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-W / 2 + 40} y={-H / 2 + 150 + i * 56} width={W - 80} height={6} rx={3} fill={BAL.navy} opacity={0.35} />)}
        <path d={`M ${-W / 2 + 46},${-H / 2 + 150 + 3 * 56 - 22} q 10,-12 22,0`} stroke={BAL.navy} strokeWidth={2.4} fill="none" opacity={0.0} />
      </>}
      {penAt !== undefined && (
        <g transform={`translate(${penAt},${blank ? 40 : -40 + 60 * Math.sin(f / 7)}) rotate(${-28 + 12 * Math.sin(f / 7)})`}>
          <ellipse cx={4} cy={118} rx={20} ry={6} fill="#000" opacity={0.2} />
          <rect x={-9} y={-90} width={18} height={168} rx={7} fill={BAL.navy} stroke={INK} strokeWidth={4.4} />
          <rect x={-9} y={-90} width={18} height={26} rx={7} fill={BAL.cranberry} stroke={INK} strokeWidth={4.4} />
          <path d="M -9,78 L 0,112 L 9,78 Z" fill={BAL.creamShade} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M -3,102 L 0,112 L 3,102 Z" fill={INK} />
        </g>
      )}
    </g>
  );
};

// ----------------------------------------------------------------------------------------------------------------------------------------
/** a faceless lectern with a boxed name card. Draw space: base centre origin, 170 wide, ~300 tall (silhouette bust included). */
export const Lectern: React.FC<{
  x?: number; y?: number; s?: number; f: number; card?: string; lit?: number; bust?: boolean; pennant?: string; pennantK?: number; phase?: number; hop?: number; id?: string; cardSize?: number;
}> = ({x = 0, y = 0, s = 1, f, card = '', lit = 0, bust = true, pennant, pennantK = 0, phase = 0, hop = 0, id = 'pd', cardSize = 17}) => {
  const t = tones(BAL.wood);
  const gid = `${id}_g`;
  const bob = 2.4 * Math.sin(f / 19 + phase) - hop * 28;
  const sway = 1.2 * Math.sin(f / 31 + phase * 1.3);
  const L = clamp01(lit);
  const cw = Math.max(110, monoW(card, cardSize) + 22);
  return (
    <g transform={`translate(${x},${y + bob}) rotate(${sway}) scale(${s})`}>
      <defs><FormGradient id={gid} t={t} /></defs>
      <ContactShadow cx={0} cy={6 + hop * 28} rx={86} ry={11} opacity={0.34 - hop * 0.12} blur={7} />
      {bust && (
        <g>
          <path d="M -46,-196 Q -48,-262 0,-264 Q 48,-262 46,-196 Z" fill={BAL.navy} stroke={INK} strokeWidth={5.4} />
          <circle cx={0} cy={-300} r={31} fill={BAL.navy} stroke={INK} strokeWidth={5.4} />
          <path d="M -26,-312 Q -10,-324 14,-322" stroke={BAL.steelHi} strokeWidth={4} fill="none" opacity={0.5} />
        </g>
      )}
      <path d="M -70,-190 L 70,-190 L 82,-176 L 82,-6 Q 82,0 76,0 L -76,0 Q -82,0 -82,-6 L -82,-176 Z" fill={`url(#${gid})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-76} y={-196} width={152} height={22} rx={7} fill={BAL.honey} stroke={INK} strokeWidth={5} />
      <rect x={-70} y={-193} width={140} height={5} rx={2.5} fill={BAL.honeyHi} opacity={0.8} />
      {/* the name card, lit by L */}
      <g transform="translate(0,-112)">
        <rect x={-cw / 2 + 4} y={-22} width={cw} height={44} rx={5} fill="#000" opacity={0.25} />
        <rect x={-cw / 2} y={-26} width={cw} height={44} rx={5} fill={L > 0.5 ? BAL.cream : BAL.creamShade} stroke={INK} strokeWidth={4.2} />
        {L > 0.02 && <rect x={-cw / 2 - 5} y={-31} width={cw + 10} height={54} rx={8} fill="none" stroke={BAL.honeyHi} strokeWidth={4} opacity={L * 0.9} />}
        <text x={0} y={-26 + 29} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={cardSize} letterSpacing={1.2} fill={INK}>{card}</text>
      </g>
      <rect x={-60} y={-60} width={120} height={8} rx={4} fill={BAL.woodShade} opacity={0.45} />
      {pennant && pennantK > 0.02 && (
        <g transform={`translate(34,-196) scale(${clamp01(pennantK)})`}>
          <rect x={-3} y={-110} width={7} height={112} rx={3} fill={BAL.creamShade} stroke={INK} strokeWidth={3.6} />
          <path d={`M 4,-108 L 92,-86 L 4,-62 Z`} transform={`skewY(${3 * Math.sin(f / 7 + phase)})`} fill={BAL.cream} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <text x={36} y={-80} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={15} fill={INK}>{pennant}</text>
        </g>
      )}
    </g>
  );
};

// ----------------------------------------------------------------------------------------------------------------------------------------
/** A padlocked gate: a pause with an END CONDITION. keyK 0..1 slides the key toward the keyhole, open 0..1 swings the gate. dashedKey draws the key as an empty dashed outline. */
export const Gate: React.FC<{
  x?: number; y?: number; s?: number; f: number; keyLabel?: string; keyK?: number; open?: number; dashedKey?: boolean; id?: string; keyShow?: number;
}> = ({x = 0, y = 0, s = 1, f, keyLabel = 'STUDY', keyK = 0, open = 0, dashedKey = false, id = 'gt', keyShow = 1}) => {
  const t = tones(BAL.wood);
  const gid = `${id}_g`;
  const w = 380, h = 250;
  const swing = open * 38;
  const sway = 1.3 * Math.sin(f / 17);
  const kx = 250 - 190 * clamp01(keyK);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <defs><FormGradient id={gid} t={t} /></defs>
      <ContactShadow cx={0} cy={6} rx={230} ry={13} opacity={0.3} blur={9} />
      {[-1, 1].map((sx) => (
        <g key={sx}>
          <rect x={sx * (w / 2 + 16) - 20} y={-h - 40} width={40} height={h + 40} rx={7} fill={`url(#${gid})`} stroke={INK} strokeWidth={6} />
          <rect x={sx * (w / 2 + 16) - 26} y={-h - 52} width={52} height={20} rx={7} fill={BAL.woodShade} stroke={INK} strokeWidth={5} />
        </g>
      ))}
      <g transform={`translate(${-w / 2},${-h}) skewY(${-swing * 0.25 + sway * 0.1})`}>
        <g transform={`scale(${1 - open * 0.28},1)`}>
          <rect x={0} y={0} width={w} height={h} rx={9} fill="none" stroke={INK} strokeWidth={6} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={20 + i * 52} y={10} width={26} height={h - 20} rx={6} fill={`url(#${gid})`} stroke={INK} strokeWidth={5} />)}
          <rect x={4} y={h * 0.3} width={w - 8} height={24} rx={6} fill={BAL.woodShade} stroke={INK} strokeWidth={5} />
          <rect x={4} y={h * 0.68} width={w - 8} height={24} rx={6} fill={BAL.woodShade} stroke={INK} strokeWidth={5} />
        </g>
      </g>
      {/* the padlock on the latch post */}
      <g transform={`translate(${w / 2 - 12},${-h * 0.5 + open * 40}) rotate(${open * 24})`}>
        <path d="M -17,-22 L -17,-44 Q -17,-72 0,-72 Q 17,-72 17,-44 L 17,-22" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
        <path d="M -17,-22 L -17,-44 Q -17,-72 0,-72 Q 17,-72 17,-44 L 17,-22" fill="none" stroke={BAL.steelHi} strokeWidth={6} strokeLinecap="round" />
        <rect x={-34} y={-24} width={68} height={58} rx={11} fill={BAL.honey} stroke={INK} strokeWidth={6} />
        <rect x={-26} y={-18} width={52} height={11} rx={5} fill={BAL.honeyHi} opacity={0.85} />
        <circle cx={0} cy={6} r={7} fill={INK} /><rect x={-3} y={6} width={6} height={16} rx={3} fill={INK} />
      </g>
      {/* the key (or its empty dashed outline) with its label */}
      {keyShow > 0.02 && (
        <g transform={`translate(${kx},${-h * 0.5 + 36}) rotate(${-10 + 10 * clamp01(keyK)})`} opacity={clamp01(keyShow)}>
          <circle cx={0} cy={0} r={26} fill={dashedKey ? 'none' : BAL.honeyHi} stroke={INK} strokeWidth={6} strokeDasharray={dashedKey ? '10 8' : undefined} />
          <circle cx={0} cy={0} r={9} fill={dashedKey ? 'none' : BAL.honeyShade} stroke={INK} strokeWidth={4} strokeDasharray={dashedKey ? '6 5' : undefined} />
          <rect x={-130} y={-7} width={104} height={14} rx={4} fill={dashedKey ? 'none' : BAL.honey} stroke={INK} strokeWidth={5.4} strokeDasharray={dashedKey ? '10 8' : undefined} />
          <path d="M -128,7 l 0,18 l 14,0 l 0,-18 M -104,7 l 0,12 l 12,0 l 0,-12" fill={dashedKey ? 'none' : BAL.honey} stroke={INK} strokeWidth={5} strokeDasharray={dashedKey ? '8 6' : undefined} />
          <g transform="translate(-88,-48)">
            <rect x={-monoW(keyLabel, 18) / 2 - 12} y={-16} width={monoW(keyLabel, 18) + 24} height={30} rx={5} fill={BAL.cream} stroke={INK} strokeWidth={4} />
            <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={1.5} fill={INK}>{keyLabel}</text>
          </g>
        </g>
      )}
    </g>
  );
};

// ----------------------------------------------------------------------------------------------------------------------------------------
/** A paper sheet. face = false draws it face down (blank back). typed 0..1 types the two headings. stamp shows SENATE PASSED. Draw space: centre origin, 300 x 400. */
export const BillSheet: React.FC<{
  x?: number; y?: number; s?: number; rot?: number; f: number; face?: boolean; flip?: number; typed?: number; lines?: [string, string]; stamp?: number; id?: string; title?: string;
}> = ({x = 0, y = 0, s = 1, rot = 0, f, face = true, flip, typed = 1, lines = ['UTILITY POWER USE', 'DECOMMISSIONING PLANS'], stamp = 0, id = 'bs', title = 'DATA CENTER BILL'}) => {
  const t = tones(BAL.cream);
  const gid = `${id}_g`;
  const W = 300, H = 400;
  const fl = flip === undefined ? (face ? 1 : 0) : clamp01(flip);
  const sx = Math.cos(fl * Math.PI);
  const showFace = fl > 0.5;
  const shown = (str: string, k: number) => str.slice(0, Math.round(str.length * clamp01(k)));
  const bob = 1.6 * Math.sin(f / 21 + x * 0.02);
  return (
    <g transform={`translate(${x},${y + bob}) rotate(${rot}) scale(${s})`}>
      <defs><FormGradient id={gid} t={t} softness={0.5} /></defs>
      <g transform={`scale(${Math.abs(sx) < 0.04 ? 0.04 : Math.abs(sx)},1)`}>
        <rect x={-W / 2 + 9} y={-H / 2 + 11} width={W} height={H} rx={8} fill="#000" opacity={0.26} />
        <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={8} fill={`url(#${gid})`} stroke={INK} strokeWidth={6.4} />
        {showFace ? (
          <g>
            <rect x={-W / 2 + 22} y={-H / 2 + 24} width={W - 44} height={46} rx={4} fill={BAL.navy} stroke={INK} strokeWidth={3.6} />
            <text x={0} y={-H / 2 + 56} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={1.6} fill={BAL.cream}>{title}</text>
            {[0, 1].map((i) => (
              <g key={i} transform={`translate(0,${-H / 2 + 120 + i * 96})`}>
                <circle cx={-W / 2 + 46} cy={0} r={20} fill={i === 0 ? BAL.aurora : BAL.honey} stroke={INK} strokeWidth={4.4} opacity={clamp01(typed * 3 - i)} />
                {i === 0 ? <path d={`M ${-W / 2 + 38},-6 l 0,-8 M ${-W / 2 + 54},-6 l 0,-8 M ${-W / 2 + 34},-5 l 24,0 l -4,12 l -16,0 Z`} stroke={INK} strokeWidth={3.4} fill="none" opacity={clamp01(typed * 3 - i)} />
                  : <path d={`M ${-W / 2 + 36},10 l 0,-18 l 12,0 l 8,-8 l 4,6 l -8,6 l 0,14 Z`} fill={INK} opacity={clamp01(typed * 3 - i) * 0.9} />}
                <text x={-W / 2 + 80} y={9} fontFamily={MONO} fontWeight={800} fontSize={lines[i].length > 18 ? 17.5 : 21} letterSpacing={0.6} fill={INK}>{shown(lines[i], clamp01(typed * 2 - i))}</text>
              </g>
            ))}
            {[0, 1, 2].map((i) => <rect key={i} x={-W / 2 + 34} y={-H / 2 + 250 + i * 30} width={W - 68 - (i === 2 ? 90 : 0)} height={5} rx={2.5} fill={BAL.navy} opacity={0.3} />)}
            {stamp > 0.02 && (
              <g transform={`translate(40,${H / 2 - 70}) rotate(-12) scale(${1 + 0.4 * (1 - clamp01(stamp))})`} opacity={clamp01(stamp * 2)}>
                <rect x={-96} y={-26} width={192} height={52} rx={6} fill="none" stroke={BAL.navy} strokeWidth={5} />
                <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={25} letterSpacing={2} fill={BAL.navy}>SENATE PASSED</text>
              </g>
            )}
          </g>
        ) : (
          <g opacity={0.8}>
            <rect x={-W / 2 + 28} y={-H / 2 + 28} width={W - 56} height={H - 56} rx={4} fill="none" stroke={BAL.creamShade} strokeWidth={3} strokeDasharray="10 8" />
            <path d={`M ${-W / 2 + 28},${-H / 2 + 28} L ${W / 2 - 28},${H / 2 - 28}`} stroke={BAL.creamShade} strokeWidth={2} opacity={0.6} />
          </g>
        )}
      </g>
    </g>
  );
};

// ----------------------------------------------------------------------------------------------------------------------------------------
/** A wooden IN tray with a LATER tab (tabText) and a lamp. Draw space: base centre origin, 440 wide, ~120 tall. children draw sheets standing in it, behind the front wall. */
export const InTray: React.FC<{
  x?: number; y?: number; s?: number; f: number; lamp?: number; tab?: number; id?: string; archLabel?: string; dust?: number; tabText?: string; children?: React.ReactNode;
}> = ({x = 0, y = 0, s = 1, f, lamp = 0, tab = 0, id = 'it', archLabel, dust = 0, tabText = 'LATER', children}) => {
  const t = tones(BAL.wood);
  const gid = `${id}_g`;
  const L = clamp01(lamp);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <defs><FormGradient id={gid} t={t} /></defs>
      <ContactShadow cx={0} cy={6} rx={260} ry={14} opacity={0.34} blur={9} />
      {archLabel && (
        <g transform="translate(0,-330)">
          <path d="M -230,0 Q -230,-70 0,-70 Q 230,-70 230,0 L 230,8 L -230,8 Z" fill={BAL.cream} stroke={INK} strokeWidth={6} />
          <text x={0} y={-8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={4} fill={INK}>{archLabel}</text>
        </g>
      )}
      {/* back wall, then whatever stands in the tray, then the front wall over its lower part */}
      <path d="M -214,-150 L 214,-150 L 226,-96 L -226,-96 Z" fill={BAL.woodShade} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {children}
      <path d="M -226,-100 L 226,-100 L 244,0 L -244,0 Z" fill={`url(#${gid})`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-236} y={-112} width={472} height={26} rx={9} fill={BAL.woodHi} stroke={INK} strokeWidth={6} />
      <rect x={-224} y={-108} width={448} height={5} rx={2.5} fill="#fff" opacity={0.4} />
      <g transform={`translate(-150,-48) rotate(${-4 + 14 * Math.max(0, 1 - tab) * Math.sin(f / 3)})`}>
        <rect x={-54} y={-17} width={108} height={34} rx={5} fill={BAL.cream} stroke={INK} strokeWidth={4.4} />
        <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={21} letterSpacing={2} fill={INK}>{tabText}</text>
      </g>
      <g transform="translate(208,-122)">
        <rect x={-5} y={-70} width={10} height={70} rx={3} fill={BAL.steelShade} stroke={INK} strokeWidth={4} />
        <path d="M -30,-70 L 30,-70 L 18,-100 L -18,-100 Z" fill={BAL.steel} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={0} cy={-64} r={12 + 4 * L} fill={BAL.aurora} opacity={0.25 + 0.7 * L} />
        {L > 0.05 && <path d="M -26,-62 L -90,10 L 90,10 L 26,-62 Z" fill={BAL.aurora} opacity={0.1 * L} />}
      </g>
      {dust > 0.02 && [0, 1, 2, 3, 4].map((i) => <circle key={i} cx={-120 + i * 60 + 8 * Math.sin(f / 9 + i)} cy={-160 - ((f * 0.6 + i * 17) % 46) * dust} r={3.4} fill={BAL.creamShade} opacity={0.55 * dust} />)}
    </g>
  );
};
