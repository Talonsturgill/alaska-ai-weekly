import React from 'react';
import {ContactShadow, tones, RimLight} from './lighting';

// FRONT DESK FAMILY (2026-10-06, "A Desk That Never Sleeps"). The shelf had no front-desk object, and the
// AI in this story IS a front desk, so the hero is a brass desk bell with a face. Shape language: ONE round
// dome against a rectilinear world (counter planks, clipboard rows, plates). Round = the answer-giver,
// rectangle = the written fact it reads. Palette roles are art_direction.json: brass hero, aurora mint means
// "somebody wrote this down", warning red means "nobody did".
export const FD = {
  ink: '#14100D',
  brass: '#C9972F',
  brassHi: '#F4D58A',
  brassDk: '#8A6420',
  mint: '#6FE0B8',
  mintDk: '#2E9C7A',
  red: '#D9482B',
  redDk: '#8F2A16',
  cream: '#E7E5DA',
  creamDk: '#C4C1B2',
  plank: '#8A5E3B',
  plankHi: '#B07E52',
  plankDk: '#4A3426',
  night: '#0F1E2A',
  alarm: '#6FC0FF',
  stove: '#E39A45',
  frost: '#9FB7D9',
  card: '#B58B5A',
  cardDk: '#8A6540',
  felt: '#5B2A36',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type BellEmotion = 'calm' | 'alert' | 'deadpan' | 'refuse' | 'happy' | 'asleep';

/** THE HERO. A domed brass desk bell, round face painted on the dome, a hinged clapper-jaw for a mouth, blinking
 *  lids, a plunger on top that really presses, an optional nightcap, and a translucent-dome cutaway (`cut` 0..1)
 *  that reveals `inside` where the brass was. Origin is the centre of the felt base on the counter. Idle: breath,
 *  blink, a micro sway. `ring` 0..1 presses the plunger and squashes the dome. `talk` 0..1 opens the jaw. */
export const BrassBell: React.FC<{
  x: number; y: number; scale?: number; f: number; emotion?: BellEmotion; ring?: number; talk?: number;
  lean?: number; blink?: number; cap?: number; cut?: number; inside?: React.ReactNode; facing?: 1 | -1;
  rimColor?: string; shadow?: boolean; lamp?: number;
}> = ({x, y, scale = 1, f, emotion = 'calm', ring = 0, talk = 0, lean = 0, blink, cap = 0, cut = 0, inside, facing = 1,
  rimColor = FD.frost, shadow = true, lamp = 1}) => {
  const t = tones(FD.brass);
  const r = clamp01(ring);
  const breath = 1 + Math.sin(f / 26) * 0.012;
  const sway = Math.sin(f / 61) * 0.8 + lean;
  const sq = 1 - r * 0.07;
  const st = 1 + r * 0.05;
  const phase = f % 118;
  const auto = phase > 112 ? Math.sin(((phase - 112) / 6) * Math.PI) : 0;
  const bl = emotion === 'asleep' ? 1 : blink ?? auto;
  const id = `bb${Math.round(x)}${Math.round(y)}`;
  const jaw = clamp01(talk) * 22 + (emotion === 'happy' ? 6 : 0);
  const brow = emotion === 'alert' ? -10 : emotion === 'deadpan' ? 6 : emotion === 'refuse' ? 4 : 0;
  const eyeR = emotion === 'alert' ? 14 : 11;
  const smile = emotion === 'happy' ? 12 : emotion === 'refuse' ? -10 : emotion === 'deadpan' ? 0 : 5;
  const dome = 'M-175,0 C-175,-100 -96,-175 0,-175 C96,-175 175,-100 175,0 Z';
  const domeLit = lamp;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale}) rotate(${sway})`}>
      {shadow && <ContactShadow cx={0} cy={14} rx={190} ry={26} opacity={0.42} blur={10} />}
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={FD.brassHi} />
          <stop offset="0.35" stopColor={FD.brass} />
          <stop offset="1" stopColor={FD.brassDk} />
        </linearGradient>
        <clipPath id={`${id}c`}><path d={dome} /></clipPath>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#FFF4CC" stopOpacity={0.55 * domeLit} />
          <stop offset="1" stopColor="#FFF4CC" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* felt base and brass plate */}
      <ellipse cx={0} cy={6} rx={215} ry={30} fill={FD.felt} stroke={FD.ink} strokeWidth={8} />
      <ellipse cx={0} cy={-2} rx={192} ry={22} fill="#7A3A48" opacity={0.7} />
      <rect x={-195} y={-34} width={390} height={38} rx={14} fill={`url(#${id}d)`} stroke={FD.ink} strokeWidth={8} />
      <rect x={-175} y={-30} width={350} height={8} rx={4} fill={FD.brassHi} opacity={0.6} />
      <g transform={`translate(0,-36) scale(${st},${sq * breath}) translate(0,36)`}>
        {/* the dome */}
        <g transform="translate(0,-34)">
          <path d={dome} fill={`url(#${id}d)`} stroke={FD.ink} strokeWidth={9} />
          {/* inside the translucent dome */}
          {cut > 0.01 && (
            <g clipPath={`url(#${id}c)`}>
              <path d={dome} fill="#FFD27A" opacity={0.85 * clamp01(cut)} />
              <g opacity={clamp01(cut * 1.4 - 0.3)}>{inside}</g>
            </g>
          )}
          <g opacity={1 - clamp01(cut * 1.2)}>
            <path d="M-146,-24 C-144,-92 -88,-146 -20,-158 C-80,-128 -132,-84 -138,-24 Z" fill="#FFFFFF" opacity={0.3} />
            <ellipse cx={0} cy={-84} rx={175} ry={120} fill={`url(#${id}g)`} />
            <RimLight d="M-171,-10 C-171,-98 -92,-171 0,-171" w={6} color={rimColor} opacity={0.65} />
            {/* the face */}
            {[-52, 52].map((ex, i) => (
              <g key={i} transform={`translate(${ex * 1.15},-84)`}>
                <ellipse cx={0} cy={0} rx={eyeR + 8} ry={eyeR + 12} fill={FD.cream} stroke={FD.ink} strokeWidth={6} />
                <circle cx={emotion === 'refuse' ? (i ? -4 : 4) : 3} cy={3} r={eyeR * 0.7} fill={FD.ink} />
                <circle cx={emotion === 'refuse' ? (i ? -2 : 6) : 6} cy={-2} r={3.2} fill="#FFFFFF" />
                {/* the lid that blinks and the brow stroke */}
                <path d={`M-${eyeR + 12},-${eyeR + 14} L${eyeR + 12},-${eyeR + 14} L${eyeR + 12},${-(eyeR + 14) + (eyeR * 2 + 28) * clamp01(bl)} L-${eyeR + 12},${-(eyeR + 14) + (eyeR * 2 + 28) * clamp01(bl)} Z`} fill={FD.brass} stroke={FD.ink} strokeWidth={4} />
                <path d={`M-${eyeR + 14},${-(eyeR + 20) + brow * 0.5} L${eyeR + 14},${-(eyeR + 28) + brow}`} stroke={FD.ink} strokeWidth={7} strokeLinecap="round" transform={i ? 'scale(-1,1)' : undefined} />
              </g>
            ))}
            {/* the plunger nose */}
            <circle cx={0} cy={-46} r={11} fill={FD.brassDk} stroke={FD.ink} strokeWidth={5} />
            {/* the hinged clapper-jaw */}
            <g transform="translate(0,-14)">
              <path d={`M-54,0 Q0,${smile + jaw * 0.2} 54,0 L48,${6 + jaw} Q0,${14 + jaw + smile} -48,${6 + jaw} Z`} fill={FD.ink} stroke={FD.ink} strokeWidth={5} strokeLinejoin="round" />
              {jaw > 4 && <path d={`M-30,${4 + jaw * 0.6} Q0,${10 + jaw} 30,${4 + jaw * 0.6}`} fill="#7A2B22" />}
            </g>
          </g>
        </g>
        {/* the plunger on top, pressing down by `ring` */}
        <g transform={`translate(0,${-232 + r * 20})`}>
          <rect x={-8} y={0} width={16} height={34} rx={5} fill={FD.brassDk} stroke={FD.ink} strokeWidth={5} />
          <ellipse cx={0} cy={-2} rx={34} ry={14} fill={`url(#${id}d)`} stroke={FD.ink} strokeWidth={6} />
          <ellipse cx={-8} cy={-6} rx={14} ry={4} fill="#FFF4CC" opacity={0.7} />
        </g>
        {/* the nightcap, pulled lower with `cap` */}
        {cap > 0.01 && (
          <g transform={`translate(${-6},${-246 + (1 - clamp01(cap)) * -60}) rotate(-10)`}>
            <path d="M-110,40 C-100,-40 -40,-110 40,-80 C100,-60 150,-10 170,60 C120,10 60,-20 -20,30 Z" fill="#E8E2D6" stroke={FD.ink} strokeWidth={7} />
            <rect x={-120} y={30} width={150} height={26} rx={12} fill="#C94A3A" stroke={FD.ink} strokeWidth={6} />
            <circle cx={176} cy={66} r={20} fill="#F6F2E8" stroke={FD.ink} strokeWidth={6} />
          </g>
        )}
      </g>
    </g>
  );
};

export type RowState = 'lit' | 'dim' | 'blank' | 'filled' | 'bad' | 'human';

/** THE THROUGHLINE OBJECT. A clipboard page of ruled rows. A `lit` row glows aurora mint (a fact somebody wrote
 *  down), a `dim` row is written but not in play, a `blank` row is the red-rimmed cell nobody wrote, a `filled`
 *  row is a blank one a human just wrote in, a `bad` row is ink in the wrong colour (an invented answer).
 *  Origin is the clipboard's centre. Rows carry no readable text on purpose, plates carry the words. */
export const CallSheet: React.FC<{
  x: number; y: number; scale?: number; f: number; rows: RowState[]; w?: number; rowH?: number; rot?: number;
  glow?: number; nail?: boolean; fillT?: number; fillRow?: number; pulse?: number;
}> = ({x, y, scale = 1, f, rows, w = 360, rowH = 64, rot = 0, glow = 1, nail = false, fillT = 0, fillRow = -1, pulse = 1}) => {
  const h = rows.length * rowH + 130;
  const sw = nail ? Math.sin(f / 44) * 1.4 : 0;
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${rot + sw})`}>
      <ContactShadow cx={6} cy={h / 2 + 12} rx={w / 2 + 20} ry={14} opacity={0.35} blur={10} />
      <rect x={-w / 2 - 22 + 12} y={-h / 2 - 8 + 14} width={w + 44} height={h + 16} rx={14} fill="#000" opacity={0.3} />
      <rect x={-w / 2 - 22} y={-h / 2 - 8} width={w + 44} height={h + 16} rx={14} fill={FD.plankHi} stroke={FD.ink} strokeWidth={8} />
      <rect x={-w / 2 - 14} y={-h / 2 - 2} width={w + 28} height={10} rx={5} fill={FD.plank} opacity={0.6} />
      <rect x={-w / 2} y={-h / 2 + 34} width={w} height={h - 54} fill={FD.cream} stroke={FD.ink} strokeWidth={5} />
      {/* the clip */}
      <rect x={-64} y={-h / 2 - 22} width={128} height={56} rx={12} fill="#B9B3A6" stroke={FD.ink} strokeWidth={7} />
      <rect x={-48} y={-h / 2 - 12} width={96} height={12} rx={5} fill="#E9E5DC" />
      {nail && <circle cx={0} cy={-h / 2 - 34} r={9} fill="#8C8A84" stroke={FD.ink} strokeWidth={5} />}
      {/* header rule */}
      <rect x={-w / 2 + 22} y={-h / 2 + 52} width={w * 0.5} height={10} fill={FD.ink} opacity={0.55} />
      {rows.map((s, i) => {
        const ry = -h / 2 + 90 + i * rowH;
        const fillRowNow = i === fillRow;
        const eff: RowState = fillRowNow && fillT > 0.5 ? 'human' : s;
        const bp = 0.55 + 0.45 * Math.abs(Math.sin(f / 14)) * pulse;
        const lit = eff === 'lit' || eff === 'filled';
        return (
          <g key={i}>
            <rect x={-w / 2 + 14} y={ry} width={w - 28} height={rowH - 14} rx={8}
              fill={lit ? FD.mint : eff === 'bad' ? '#EFF3F6' : eff === 'blank' ? '#F7E1D8' : eff === 'human' ? '#F1EFE6' : FD.cream}
              stroke={eff === 'blank' ? FD.red : FD.ink} strokeWidth={eff === 'blank' ? 6 : 4}
              strokeDasharray={eff === 'blank' ? '14 9' : undefined}
              opacity={eff === 'blank' ? bp : 1} />
            {lit && <rect x={-w / 2 + 14} y={ry} width={w - 28} height={rowH - 14} rx={8} fill="#FFFFFF" opacity={0.18 * glow} />}
            {eff === 'blank' && <rect x={-w / 2 + 40} y={ry + 16} width={w - 120} height={rowH - 46} rx={6} fill={FD.red} opacity={0.35 * bp} />}
            {eff === 'human' && (
              <g transform={`translate(${-w / 2 + 64},${ry + (rowH - 14) / 2})`} opacity={0.5 + 0.5 * clamp01(fillT * 2)}>
                <circle cx={0} cy={-12} r={8} fill="none" stroke={FD.ink} strokeWidth={4} />
                <path d="M0,-4 L0,14 M-12,4 L12,4 M0,14 L-9,26 M0,14 L9,26" stroke={FD.ink} strokeWidth={4} strokeLinecap="round" fill="none" />
                <path d="M28,-6 L28,16 M24,-6 L32,-6 M24,16 L32,16" stroke={FD.ink} strokeWidth={3} fill="none" />
              </g>
            )}
            {eff !== 'blank' && eff !== 'human' && [0, 1].map((l) => (
              <rect key={l} x={-w / 2 + 34} y={ry + 12 + l * 20} width={(w - 130) * (l ? 0.55 : 0.85)} height={9} rx={4}
                fill={eff === 'bad' ? '#7C93A8' : FD.ink} opacity={lit ? 0.7 : 0.35} />
            ))}
            {fillRowNow && s === 'blank' && fillT > 0 && (
              <rect x={-w / 2 + 34} y={ry + 12} width={(w - 130) * clamp01(fillT * 1.6)} height={9} rx={4} fill={FD.ink} opacity={0.75} />
            )}
          </g>
        );
      })}
      {anyLit(rows) && glow > 0 && <rect x={-w / 2 - 30} y={-h / 2 - 20} width={w + 60} height={h + 40} rx={20} fill={FD.mint} opacity={0.08 * glow} />}
    </g>
  );
};
const anyLit = (rows: RowState[]) => rows.some((r) => r === 'lit' || r === 'filled');

/** THE FREE WIDGET. A faceless cardboard cutout of a bell, crooked, with a FREE tag on a string. It answers
 *  confidently (`answer` 0..1) by unrolling a ribbon of invented ink. Nothing behind it. */
export const CardboardBell: React.FC<{x: number; y: number; scale?: number; f: number; answer?: number; rot?: number}> = ({
  x, y, scale = 1, f, answer = 0, rot = -7,
}) => {
  const a = clamp01(answer);
  const wob = Math.sin(f / 9) * a * 2.5;
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${rot + wob})`}>
      <ContactShadow cx={0} cy={10} rx={150} ry={20} opacity={0.35} blur={9} />
      <path d="M-130,0 C-130,-100 -70,-170 0,-170 C70,-170 130,-100 130,0 Z" fill={FD.card} stroke={FD.ink} strokeWidth={8} />
      <path d="M-100,-20 C-98,-86 -60,-140 -8,-152" fill="none" stroke={FD.cardDk} strokeWidth={10} opacity={0.6} />
      <rect x={-146} y={-6} width={292} height={34} rx={8} fill={FD.cardDk} stroke={FD.ink} strokeWidth={7} />
      {/* corrugation */}
      {[-90, -50, -10, 30, 70].map((cx) => <line key={cx} x1={cx} y1={-2} x2={cx} y2={22} stroke={FD.ink} strokeWidth={3} opacity={0.35} />)}
      <rect x={-6} y={-196} width={12} height={28} rx={4} fill={FD.cardDk} stroke={FD.ink} strokeWidth={5} />
      <ellipse cx={0} cy={-198} rx={26} ry={10} fill={FD.card} stroke={FD.ink} strokeWidth={5} />
      {/* the FREE tag on its string */}
      <path d="M96,-120 C120,-90 126,-60 116,-30" fill="none" stroke={FD.ink} strokeWidth={4} />
      <g transform="translate(116,-14) rotate(8)">
        <rect x={-34} y={-18} width={68} height={40} rx={6} fill={FD.cream} stroke={FD.ink} strokeWidth={5} />
        <text x={0} y={10} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={22} fill={FD.red}>FREE</text>
      </g>
      {/* the invented answer, a ribbon that curls up and unrolls off the counter */}
      {a > 0.02 && (
        <g>
          <path d={`M0,-170 C${40 + 30 * a},${-230 - 60 * a} ${-60 - 40 * a},${-300 - 80 * a} ${20 + 10 * a},${-380 - 100 * a}`}
            fill="none" stroke="#7C93A8" strokeWidth={30} strokeLinecap="round" opacity={0.85} strokeDasharray={`${34 * a + 1} 3`} />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={-40 + k * 14} y={-250 - k * 52 * a} width={90 - k * 10} height={7} rx={3} fill={FD.ink} opacity={0.5 * a} transform={`rotate(${-10 + k * 8})`} />
          ))}
        </g>
      )}
    </g>
  );
};

/** A rotary phone that rings: the whole body wobbles, the handset jitters on its cradle. */
export const RotaryPhone: React.FC<{x: number; y: number; scale?: number; f: number; ring?: number; glow?: number}> = ({
  x, y, scale = 1, f, ring = 1, glow = 0,
}) => {
  const j = ring > 0 ? Math.sin(f * 1.7) * 3 * ring : 0;
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${j * 0.4})`}>
      <ContactShadow cx={0} cy={6} rx={130} ry={16} opacity={0.4} blur={8} />
      {glow > 0 && <circle cx={0} cy={-60} r={170} fill={FD.alarm} opacity={0.18 * glow * (0.6 + 0.4 * Math.sin(f / 4))} />}
      <path d="M-120,0 C-120,-70 -70,-96 0,-96 C70,-96 120,-70 120,0 Z" fill="#2C2622" stroke={FD.ink} strokeWidth={8} />
      <circle cx={0} cy={-46} r={50} fill="#EDE6D2" stroke={FD.ink} strokeWidth={6} />
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 1.6 + 0.5;
        return <circle key={i} cx={Math.cos(a) * 34} cy={-46 + Math.sin(a) * 34} r={7} fill="#2C2622" />;
      })}
      <g transform={`translate(0,${-100 + j * 0.6}) rotate(${j})`}>
        <rect x={-100} y={-24} width={200} height={34} rx={17} fill="#3A322C" stroke={FD.ink} strokeWidth={7} />
        <rect x={-110} y={-14} width={42} height={42} rx={14} fill="#3A322C" stroke={FD.ink} strokeWidth={6} />
        <rect x={68} y={-14} width={42} height={42} rx={14} fill="#3A322C" stroke={FD.ink} strokeWidth={6} />
      </g>
    </g>
  );
};

/** A tiny walking resident for the true-scale crowd: a coat, a hat, a head, a stride. Not the Character rig,
 *  because 100 of the rig would be 100 rigs. `go` 0..1 slides it toward its door. */
export const Walker: React.FC<{x: number; y: number; s?: number; f: number; coat?: string; hat?: string; phase?: number; facing?: 1 | -1}> = ({
  x, y, s = 1, f, coat = '#2F7D6B', hat = '#C98A2A', phase = 0, facing = 1,
}) => {
  const st = Math.sin(f / 5 + phase) * 7;
  return (
    <g transform={`translate(${x},${y}) scale(${s * facing},${s})`}>
      <ellipse cx={0} cy={2} rx={15} ry={4} fill="#000" opacity={0.35} />
      <rect x={-6} y={-22 + Math.abs(st) * 0.2} width={5} height={24} rx={2} fill="#2A2F3A" transform={`rotate(${st} -3 -22)`} />
      <rect x={1} y={-22 + Math.abs(st) * 0.2} width={5} height={24} rx={2} fill="#2A2F3A" transform={`rotate(${-st} 3 -22)`} />
      <rect x={-10} y={-56} width={20} height={36} rx={8} fill={coat} stroke={FD.ink} strokeWidth={2.5} />
      <circle cx={0} cy={-66} r={9} fill="#E8B48C" stroke={FD.ink} strokeWidth={2.5} />
      <path d="M-10,-70 Q0,-84 10,-70 Z" fill={hat} stroke={FD.ink} strokeWidth={2.5} />
    </g>
  );
};

/** A paper question card, the awkward hyper-local kind, sized to carry a small icon (never text). */
export const IconCard: React.FC<{x: number; y: number; s?: number; rot?: number; icon: 'boot' | 'fish' | 'moose' | 'plane' | 'snow' | 'qmark'; op?: number}> = ({
  x, y, s = 1, rot = 0, icon, op = 1,
}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={op}>
    <rect x={-70 + 8} y={-90 + 10} width={140} height={180} rx={10} fill="#000" opacity={0.28} />
    <rect x={-70} y={-90} width={140} height={180} rx={10} fill={FD.cream} stroke={FD.ink} strokeWidth={6} />
    <rect x={-52} y={-66} width={104} height={10} rx={4} fill={FD.ink} opacity={0.35} />
    {icon === 'boot' && <g transform="translate(0,16)"><path d="M-26,-34 L10,-34 L10,-4 L40,10 L40,34 L-26,34 Z" fill="#6A4A32" stroke={FD.ink} strokeWidth={5} /><rect x={-26} y={22} width={66} height={12} fill="#2A2018" /></g>}
    {icon === 'fish' && <g transform="translate(0,14)"><path d="M-40,0 Q-6,-34 30,0 Q-6,34 -40,0 Z" fill="#C0453A" stroke={FD.ink} strokeWidth={5} /><path d="M30,0 L50,-18 L50,18 Z" fill="#C0453A" stroke={FD.ink} strokeWidth={5} /><circle cx={-22} cy={-4} r={4} fill={FD.ink} /></g>}
    {icon === 'moose' && <g transform="translate(0,14)"><rect x={-24} y={-8} width={44} height={30} rx={12} fill="#5A4632" stroke={FD.ink} strokeWidth={5} /><path d="M-30,-14 L-52,-40 M-22,-14 L-34,-42 M20,-14 L42,-40 M12,-14 L26,-42" stroke="#5A4632" strokeWidth={8} strokeLinecap="round" /></g>}
    {icon === 'plane' && <g transform="translate(0,14)"><path d="M-44,0 L40,-10 L46,2 L-40,10 Z" fill="#E4E0D4" stroke={FD.ink} strokeWidth={5} /><path d="M-6,-26 L8,-8 L-2,0 Z" fill="#C0453A" stroke={FD.ink} strokeWidth={4} /></g>}
    {icon === 'snow' && <g transform="translate(0,14)"><circle cx={0} cy={0} r={32} fill="#DCEBF4" stroke={FD.ink} strokeWidth={5} />{[0, 60, 120].map((a) => <line key={a} x1={-24} y1={0} x2={24} y2={0} stroke="#7FA6C4" strokeWidth={5} transform={`rotate(${a})`} />)}</g>}
    {icon === 'qmark' && <text x={0} y={46} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight={900} fontSize={110} fill={FD.red}>?</text>}
  </g>
);
