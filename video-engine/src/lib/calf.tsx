import React from 'react';
import {Easing, interpolate} from 'remotion';
import {ContactShadow, FormGradient, INK, RimLight, tones, paleTones} from './lighting';

// THE CALF KIT, 2026-10-21 ("The Count and the Calf"). One idea drawn as one animal and one rectangle. The hero is a tawny walrus calf
// who looks, for a few seconds, like one more dull grey mound on a gravel beach, and a survey-orange frame that begins as a counting
// mark and ends as a window. Around them: the dull carcass mounds being counted, a pewter-lilac Chukchi beach, a lamp-lit cabin, an
// orbit view with a dotted grid, a trail camera with a photo that humans mark in solid orange and a network guesses at in dotted pale.
// Everything is SVG in the 1080 x 1920 frame at a caller-set x, y and scale, every animated value is passed in, and the only strings
// painted are the ones the caller hands in.
export const CAL = {
  skyTop: '#9AA3A6', skyLow: '#C0C6C6', haze: '#DCDFDB',
  sea: '#2A5568', seaHi: '#3F7A86', seaDeep: '#1B3C4B',
  gravel: '#CFC4AE', gravelShade: '#8A7F6C', gravelHi: '#E4DAC4', stone: '#7C7364',
  calf: '#B8765A', calfShade: '#8A4F3C', calfKey: '#E1A584', pad: '#F2E6D0', tusk: '#F0EAD8',
  mound: '#6F6359', moundShade: '#51473F', moundHi: '#A8A3A0',
  orange: '#FF8C1A', orangeDeep: '#B85A00', orangeHi: '#FFBE6B',
  pale: '#CFE3EE', navy: '#121A33', navyHi: '#26335C',
  wood: '#4A3A30', woodDeep: '#2A211C', woodHi: '#6E5646', amber: '#F2E2B0', amberHi: '#FBF1CF',
  violet: '#7A3B5E', slate: '#4B5D73', ink: INK, cream: '#F4EEDC', paper: '#FFFDF4',
};
export const MONO = "'JetBrains Mono', monospace";
export const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
export const eo = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const hash = (i: number) => {
  let x = (Math.floor(i) + 1021) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
export const rnd = (i: number) => (hash(i) % 10000) / 10000;
/** an overshooting snap from 0 to 1 starting at frame a */
export const snap = (f: number, a: number, d = 10) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.pow(1 - t, 3) * Math.cos(t * 6.2);
};

const Grad: React.FC<{id: string; base: string; pale?: boolean; softness?: number}> = ({id, base, pale, softness = 0.7}) => (
  <FormGradient id={id} t={pale ? paleTones(base) : tones(base)} softness={softness} />
);

// ---- the hero ----------------------------------------------------------------------------------------------------------------------
export type CalfMood = 'calm' | 'afraid' | 'sad' | 'content' | 'sleep' | 'wake';

/**
 * WalrusCalf: a tawny walrus pup seen in profile, lying on its belly. Origin is the ground contact point under the middle of the body,
 * the head is on the +x side (facing -1 mirrors). breath (0..1) is how much the flank rises and falls, eyes (0..1) is how open they
 * are, raise (0..1) lifts the head and chest on the fore flippers, call (0..1) is a hoo-hoo, a throat pulse with the mouth open,
 * mood sets the brow, shiver (0..1) is fear, sq flattens it on an impact, dull (0..1) desaturates it toward the carcass grey so it can
 * read as one more mound before it breathes.
 */
export const WalrusCalf: React.FC<{
  x: number; y: number; f: number; scale?: number; facing?: 1 | -1; mood?: CalfMood; breath?: number; eyes?: number; raise?: number;
  call?: number; shiver?: number; sq?: number; dull?: number; look?: number; id?: string; shadow?: boolean; snoutDown?: number;
}> = ({x, y, f, scale = 1, facing = 1, mood = 'calm', breath = 1, eyes = 1, raise = 0, call = 0, shiver = 0, sq = 0, dull = 0, look = 0, id = 'wc', shadow = true, snoutDown = 0}) => {
  const ph = x * 0.013;
  const base = dull > 0.5 ? CAL.mound : CAL.calf;
  const t = tones(base);
  const tm = tones(CAL.mound);
  const mix = clamp01(dull);
  const heave = Math.sin(f / 19 + ph) * breath;           // the slow flank breath
  const heave2 = Math.sin(f / 7 + ph) * 0.25 * breath * (mood === 'afraid' ? 1 : 0.2);
  const trem = shiver * (Math.sin(f * 1.7 + ph) * 2.2 + Math.sin(f * 2.9) * 1.1);
  const sx = 1 + 0.1 * sq, sy = 1 - 0.16 * sq;
  const blink = Math.sin(f / 41 + ph) > 0.972 ? 0.1 : 1;
  const ey = clamp01(eyes) * blink * (mood === 'sleep' ? 0.08 : mood === 'content' ? 0.55 : 1);
  const brow = mood === 'afraid' ? -9 : mood === 'sad' ? 9 : mood === 'wake' ? -3 : 0;
  const twitch = Math.sin(f / 5 + ph) * 1.3;
  const r = raise * 22;
  const callK = clamp01(call);
  const pulse = callK * (0.5 + 0.5 * Math.sin(f * 0.9));
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const eyeOpenH = 13 * ey + 1.5;
  const hx = 148 + raise * 6 + look * 10, hy = -62 - r * 1.4 + snoutDown * 18;
  return (
    <g transform={`translate(${x + trem},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={`${gid}b`} t={t} softness={0.62} />
      <FormGradient id={`${gid}m`} t={tm} softness={0.62} />
      {shadow && <ContactShadow cx={4} cy={4} rx={176} ry={19} opacity={0.34} blur={11} />}
      <g transform={`scale(${sx},${sy})`}>
        {/* rear flippers, a lazy fan that twitches */}
        <g transform={`translate(-150,-10) rotate(${-6 + twitch})`}>
          <path d="M0,0 q-22,-8 -40,-26 q12,-8 26,-4 q-2,-14 8,-22 q10,6 12,20 q12,-10 24,-4 q-6,22 -30,36 Z" fill={`url(#${gid}${mix > 0.5 ? 'm' : 'b'})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
        {/* the body bean, the flank rises with the breath */}
        <g transform={`translate(0,0) scale(1,${1 + 0.035 * heave + 0.01 * heave2})`} style={{transformOrigin: '0px 0px'}}>
          <path d="M-152,-6 C-164,-72 -92,-122 -8,-122 C72,-122 134,-100 154,-52 C164,-26 142,-4 110,-2 C40,8 -84,8 -152,-6 Z"
            fill={`url(#${gid}${mix > 0.5 ? 'm' : 'b'})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          {/* belly crease and skin folds */}
          <path d="M-120,-28 q70,16 158,2" fill="none" stroke={mix > 0.5 ? CAL.moundShade : CAL.calfShade} strokeWidth={4} opacity={0.55} strokeLinecap="round" />
          {[[-98, -84, 36], [-52, -102, 40], [-4, -108, 38]].map(([fx, fy, fw], i) => (
            <path key={i} d={`M${fx},${fy} q${(fw as number) / 2},${8 + i * 2} ${fw},0`} fill="none" stroke={mix > 0.5 ? CAL.moundShade : CAL.calfShade} strokeWidth={3.6} opacity={0.5} strokeLinecap="round" />
          ))}
          {/* wet sheen, not on a carcass */}
          {mix < 0.5 && <path d="M-70,-104 q40,-14 86,-10" fill="none" stroke={CAL.calfKey} strokeWidth={7} opacity={0.55} strokeLinecap="round" />}
          <RimLight d="M-120,-96 q40,-22 112,-22 q56,0 100,18" w={3.4} opacity={0.5} />
        </g>
        {/* the head and neck: rotates about the shoulder when raised */}
        <g transform={`translate(96,-44) rotate(${-raise * 16 + look * 4}) translate(-96,44)`}>
          <path d={`M104,${-12 - r} C100,${-86 - r} 150,${-112 - r} 192,${-88 - r} C228,${-68 - r} 232,${-26 - r} 204,${-6 - r} C170,${10 - r} 126,${8 - r} 104,${-12 - r} Z`}
            fill={`url(#${gid}${mix > 0.5 ? 'm' : 'b'})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" transform={`translate(${raise * 6},${snoutDown * 14})`} />
          <g transform={`translate(${raise * 6},${snoutDown * 14})`}>
            {/* whisker pad */}
            <g transform={`translate(${twitch * 0.5},0)`}>
              <path d={`M178,${-48 - r} q34,-6 48,16 q6,16 -10,26 q-22,10 -44,-4 q-14,-12 -8,-26 Z`} fill={mix > 0.5 ? '#B5A89C' : CAL.pad} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
              {[[196, -34], [208, -30], [220, -30], [202, -22], [214, -20], [190, -26], [224, -22]].map(([bx, by], i) => (
                <circle key={i} cx={bx} cy={(by as number) - r} r={1.9} fill={INK} opacity={0.75} />
              ))}
              {/* nostril */}
              <ellipse cx={218} cy={-48 - r} rx={5} ry={3} fill={INK} opacity={0.8} />
            </g>
            {/* tusk buds */}
            <path d={`M196,${-14 - r} q-2,12 -1,20 q6,2 8,-4 q0,-8 -2,-16 Z`} fill={CAL.tusk} stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
            <path d={`M212,${-14 - r} q0,12 2,18 q6,0 6,-6 q-2,-8 -4,-12 Z`} fill="#E0D8C2" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
            {/* mouth: a small line, an open oval when it calls */}
            {callK > 0.05 ? (
              <ellipse cx={206} cy={-8 - r} rx={9 + 4 * pulse} ry={5 + 8 * pulse} fill="#4A1F1F" stroke={INK} strokeWidth={3} />
            ) : (
              <path d={mood === 'sad' ? `M192,${-9 - r} q10,-6 22,0` : `M192,${-10 - r} q10,6 22,-1`} fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
            )}
            {/* the eye: big, wet, with a catchlight */}
            <g transform={`translate(176,${-70 - r})`}>
              <ellipse cx={0} cy={0} rx={15} ry={eyeOpenH} fill={ey < 0.2 ? INK : '#1A1620'} stroke={INK} strokeWidth={3.2} />
              {ey > 0.3 && <circle cx={4} cy={-4 * ey} r={4.8} fill="#FFFFFF" opacity={0.95} />}
              {ey > 0.3 && <circle cx={-5} cy={4} r={2} fill="#FFFFFF" opacity={0.55} />}
              <path d={`M-18,${-16 + brow * 0.3} q14,${-8 + brow * 0.6} 34,${brow * 0.25}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
            </g>
            <RimLight d={`M118,${-70 - r} q30,-34 74,-30`} w={3.2} opacity={0.5} />
          </g>
        </g>
        {/* fore flipper */}
        <g transform={`translate(88,-8) rotate(${raise * -10 + twitch * 0.6})`}>
          <path d="M0,0 q-4,-22 16,-30 q22,-4 30,12 q4,16 -12,22 q-18,6 -34,-4 Z" fill={`url(#${gid}${mix > 0.5 ? 'm' : 'b'})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
      </g>
    </g>
  );
};

/** CarcassMound: a dull grey-brown adult walrus carcass, a still mound with closed eye and tusks, no breath. Origin is the ground under the middle. */
export const CarcassMound: React.FC<{x: number; y: number; scale?: number; facing?: 1 | -1; f?: number; id?: string; variant?: number; shadow?: boolean}> =
({x, y, scale = 1, facing = 1, f = 0, id = 'cm', variant = 0, shadow = true}) => {
  const t = tones(CAL.mound);
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const w = [1, 0.92, 1.1][variant % 3];
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing * w},${scale})`}>
      <FormGradient id={gid} t={t} softness={0.6} />
      {shadow && <ContactShadow cx={4} cy={4} rx={190} ry={20} opacity={0.34} blur={12} />}
      <path d="M-170,-4 C-182,-70 -110,-128 -10,-130 C84,-132 156,-104 176,-52 C184,-26 160,-2 124,0 C50,10 -100,10 -170,-4 Z" fill={`url(#${gid})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {[[-120, -88, 44], [-66, -108, 50], [-8, -116, 46], [48, -104, 40]].map(([fx, fy, fw], i) => (
        <path key={i} d={`M${fx},${fy} q${(fw as number) / 2},${9 + i} ${fw},0`} fill="none" stroke={CAL.moundShade} strokeWidth={4} opacity={0.55} strokeLinecap="round" />
      ))}
      {/* a slumped head with closed eye, whisker pad and two long tusks */}
      <path d="M126,-16 C122,-76 164,-100 200,-82 C232,-66 238,-28 212,-12 C180,6 140,4 126,-16 Z" fill={`url(#${gid})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <path d="M170,-60 q10,6 22,2" fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
      <path d="M190,-44 q30,-4 42,14 q4,14 -12,20 q-20,6 -34,-6 Z" fill="#B5A89C" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M198,-10 q4,24 -1,40 q-7,-2 -8,-8 q-2,-18 2,-32 Z" fill="#DCD4BE" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M214,-10 q5,22 0,36 q-7,-2 -8,-7 q-2,-16 2,-29 Z" fill="#CFC6AE" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <RimLight d="M-140,-96 q50,-26 130,-26 q70,0 130,22" w={3.2} opacity={0.4} />
      {/* a hair of wind lifting a loose skin edge keeps the still life from reading as a cut-out */}
      <path d={`M-150,-30 q${6 + 2 * Math.sin(f / 17)},-10 ${14 + 2 * Math.sin(f / 13)},-4`} fill="none" stroke={CAL.moundHi} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
    </g>
  );
};

/** BearPrints: a short line of bear tracks across gravel. */
export const BearPrints: React.FC<{x: number; y: number; scale?: number; n?: number; k?: number; rot?: number}> = ({x, y, scale = 1, n = 5, k = 1, rot = -4}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
    {Array.from({length: n}).map((_, i) => {
      const a = clamp01(k * n - i);
      if (a <= 0) return null;
      const px = i * 78, py = (i % 2 ? 12 : -8);
      return (
        <g key={i} transform={`translate(${px},${py})`} opacity={a}>
          <ellipse cx={0} cy={0} rx={22} ry={14} fill={CAL.gravelShade} stroke={INK} strokeWidth={2.6} opacity={0.85} />
          {[-16, -6, 6, 16].map((tx, j) => <ellipse key={j} cx={tx} cy={-18 - (j === 1 || j === 2 ? 3 : 0)} rx={4.2} ry={5.6} fill={CAL.gravelShade} stroke={INK} strokeWidth={2.2} opacity={0.85} />)}
          {[-16, -6, 6, 16].map((tx, j) => <path key={`c${j}`} d={`M${tx},${-24 - (j === 1 || j === 2 ? 3 : 0)} l0,-6`} stroke={INK} strokeWidth={2} opacity={0.7} />)}
        </g>
      );
    })}
  </g>
);

// ---- the throughline: THE FRAME ----------------------------------------------------------------------------------------------------
export type FrameMode = 'bracket' | 'box' | 'dotted' | 'window';
/**
 * ViewFrame: the film's counting rectangle in survey orange. bracket is a viewfinder's four corners, box is a closed label box, dotted is
 * a network's guess (pale, dashed), and window is the same rectangle with mullions and a sill, the frame at its last state. Origin is
 * the centre. k (0..1) snaps it in with an overshoot, lock (0..1) draws a small centre cross and a corner tick, label rides a tag on the
 * top edge sized to its string, glow lights the glass amber for the window.
 */
export const ViewFrame: React.FC<{
  x: number; y: number; w: number; h: number; f: number; mode?: FrameMode; k?: number; lock?: number; label?: string; labelSize?: number;
  color?: string; sw?: number; glow?: number; dim?: number; id?: string; sill?: boolean;
}> = ({x, y, w, h, f, mode = 'bracket', k = 1, lock = 0, label, labelSize = 22, color, sw, glow = 0, dim = 0, id = 'vf', sill = true}) => {
  const kk = Math.max(0, k);
  if (kk <= 0.001) return null;
  const col = color ?? (mode === 'dotted' ? CAL.pale : CAL.orange);
  const lw = sw ?? (mode === 'dotted' ? 5 : 9);
  const over = 1 + (1 - Math.min(1, kk)) * 0.5;
  const ww = w * over, hh = h * over;
  const L = Math.min(ww, hh) * 0.26;
  const breathe = 1 + 0.006 * Math.sin(f / 15 + x * 0.01);
  const opacity = Math.min(1, kk * 3) * (1 - dim);
  const dash = mode === 'dotted' ? `${lw * 1.6} ${lw * 1.4}` : undefined;
  const dOff = mode === 'dotted' ? -f * 0.7 : 0;
  const tagW = label ? monoW(label, labelSize) + 28 : 0;
  const hl = ww / 2, hv = hh / 2;
  const corner = (sx2: number, sy2: number) => `M${sx2 * hl},${sy2 * (hv - L)} L${sx2 * hl},${sy2 * hv} L${sx2 * (hl - L)},${sy2 * hv}`;
  return (
    <g transform={`translate(${x},${y}) scale(${breathe})`} opacity={opacity}>
      {mode === 'window' ? (
        <g>
          <rect x={-hl} y={-hv} width={ww} height={hh} fill={CAL.navy} opacity={0.9} />
          <rect x={-hl} y={-hv} width={ww} height={hh} fill={CAL.amber} opacity={0.12 * glow} />
          <path d={`M0,${-hv} L0,${hv} M${-hl},${-hv * 0.05} L${hl},${-hv * 0.05}`} stroke={col} strokeWidth={lw * 0.8} />
          <rect x={-hl} y={-hv} width={ww} height={hh} fill="none" stroke={INK} strokeWidth={lw + 8} />
          <rect x={-hl} y={-hv} width={ww} height={hh} fill="none" stroke={col} strokeWidth={lw} />
          {sill && <rect x={-hl - 26} y={hv - 2} width={ww + 52} height={26} fill={CAL.woodHi} stroke={INK} strokeWidth={5} />}
        </g>
      ) : mode === 'bracket' ? (
        <g fill="none" strokeLinecap="square">
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx2, sy2], i) => <path key={`o${i}`} d={corner(sx2, sy2)} stroke={INK} strokeWidth={lw + 7} />)}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx2, sy2], i) => <path key={i} d={corner(sx2, sy2)} stroke={col} strokeWidth={lw} />)}
        </g>
      ) : (
        <g>
          {mode === 'box' && <rect x={-hl} y={-hv} width={ww} height={hh} fill="none" stroke={INK} strokeWidth={lw + 6} />}
          <rect x={-hl} y={-hv} width={ww} height={hh} fill={mode === 'dotted' ? CAL.pale : col} opacity={0.0} />
          <rect x={-hl} y={-hv} width={ww} height={hh} fill="none" stroke={col} strokeWidth={lw} strokeDasharray={dash} strokeDashoffset={dOff} />
        </g>
      )}
      {lock > 0.01 && (
        <g opacity={clamp01(lock)} stroke={col} strokeWidth={4} strokeLinecap="round">
          <path d="M-16,0 L16,0 M0,-16 L0,16" />
          <circle cx={0} cy={0} r={22 * (1.4 - 0.4 * clamp01(lock))} fill="none" />
        </g>
      )}
      {label && mode !== 'window' && (
        <g transform={`translate(${-hl},${-hv - 4})`}>
          <rect x={0} y={-labelSize - 14} width={tagW} height={labelSize + 14} fill={mode === 'dotted' ? '#26335C' : CAL.orange} stroke={INK} strokeWidth={3.4} />
          <text x={14} y={-10} fontFamily={MONO} fontWeight={800} fontSize={labelSize} letterSpacing={1.5} fill={mode === 'dotted' ? CAL.pale : INK}>{label}</text>
        </g>
      )}
    </g>
  );
};

// ---- sets --------------------------------------------------------------------------------------------------------------------------
/** BeachBG: a pewter-lilac Chukchi beach: sky, a teal sea band with drifting swell, a bone gravel shore, stones and a driftwood log. horizon is the sea's top edge. */
export const BeachBG: React.FC<{f: number; horizon?: number; shore?: number; id?: string; far?: boolean; gulls?: boolean; dusk?: number; dark?: number}> =
({f, horizon = 930, shore = 1130, id = 'bb', far = true, gulls = true, dusk = 0, dark = 0}) => {
  const swell = (i: number) => 6 * Math.sin(f / 31 + i * 1.7);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dusk > 0 ? '#5E6490' : CAL.skyTop} />
          <stop offset="0.6" stopColor={dusk > 0 ? '#9A92B8' : CAL.skyLow} />
          <stop offset="1" stopColor={CAL.haze} />
        </linearGradient>
        <linearGradient id={`${id}sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CAL.seaHi} />
          <stop offset="1" stopColor={CAL.seaDeep} />
        </linearGradient>
        <linearGradient id={`${id}gr`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CAL.gravelHi} />
          <stop offset="0.5" stopColor={CAL.gravel} />
          <stop offset="1" stopColor={CAL.gravelShade} />
        </linearGradient>
      </defs>
      <rect x={-40} y={0} width={1160} height={horizon + 4} fill={`url(#${id}sky)`} />
      {/* soft cloud bands drifting on an irrational period */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <ellipse key={i} cx={100 + i * 150 + 70 * Math.sin(f / (140 + i * 23) + i)} cy={140 + i * 78 + rnd(i + 11) * 40} rx={230 - i * 12 + rnd(i) * 70} ry={20 + i * 3.2} fill={i % 3 === 0 ? '#7F8A90' : '#FFFFFF'} opacity={0.17 - i * 0.012} />
      ))}
      <path d={`M-40,${horizon} L90,${horizon - 34} L230,${horizon - 14} L380,${horizon - 52} L520,${horizon - 20} L690,${horizon - 44} L850,${horizon - 16} L1000,${horizon - 38} L1120,${horizon} Z`} fill="#6F7F88" opacity={0.55} />
      {gulls && [0, 1, 2].map((i) => {
        const gx = ((f * (0.6 + i * 0.25) + i * 400) % 1300) - 100;
        const gy = 300 + i * 90 + 14 * Math.sin(f / (21 + i * 5));
        const fl = Math.sin(f / (5 + i)) * 7;
        return <path key={i} d={`M${gx - 22},${gy + fl} Q${gx - 10},${gy - 8} ${gx},${gy} Q${gx + 10},${gy - 8} ${gx + 22},${gy + fl}`} fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" opacity={0.7} />;
      })}
      <rect x={-40} y={horizon} width={1160} height={shore - horizon + 12} fill={`url(#${id}sea)`} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M-40,${horizon + 22 + i * ((shore - horizon) / 6.2) + swell(i)} q140,${-9 - i} 280,0 t280,0 t280,0 t280,0`} fill="none" stroke="#FFFFFF" strokeWidth={3 + i * 0.4} opacity={0.12 + i * 0.03} />
      ))}
      {far && Array.from({length: 11}).map((_, i) => (
        <ellipse key={i} cx={30 + i * 100 + rnd(i) * 40} cy={horizon + 12} rx={9 + rnd(i + 20) * 7} ry={4} fill={CAL.moundShade} opacity={0.5} />
      ))}
      <rect x={-40} y={shore} width={1160} height={1960 - shore} fill={`url(#${id}gr)`} />
      <path d={`M-40,${shore} q160,-14 300,0 t300,0 t300,0 t300,0`} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.35 + 0.1 * Math.sin(f / 25)} />
      {/* stones in rows that grow toward the camera */}
      {Array.from({length: 46}).map((_, i) => {
        const row = i % 4;
        const sy = shore + 40 + row * 150 + rnd(i) * 90;
        const sc = 0.5 + row * 0.55;
        return <ellipse key={i} cx={rnd(i + 7) * 1160 - 40} cy={sy} rx={(10 + rnd(i + 3) * 16) * sc} ry={(6 + rnd(i + 5) * 8) * sc} fill={rnd(i) > 0.5 ? CAL.stone : CAL.gravelShade} stroke={INK} strokeWidth={1.8 + sc * 0.6} opacity={0.75} />;
      })}
      {/* driftwood */}
      <g transform={`translate(70,${shore + 170}) rotate(-3)`}>
        <rect x={0} y={0} width={330} height={26} rx={12} fill="#6B5848" stroke={INK} strokeWidth={4} />
        <path d="M40,6 l80,0 M150,14 l100,0" stroke={INK} strokeWidth={2} opacity={0.4} />
      </g>
      {dark > 0 && <rect x={-40} y={0} width={1160} height={1960} fill="#101423" opacity={dark} />}
    </g>
  );
};

/** CabinBG: a one-room plank cabin at night: wall planks, a window at (wx, wy), a floor, an old broken door at the left and an amber lamp pool. */
export const CabinBG: React.FC<{f: number; wx?: number; wy?: number; ww?: number; wh?: number; floor?: number; lamp?: number; id?: string; door?: boolean; windowGlass?: boolean}> =
({f, wx = 700, wy = 760, ww = 300, wh = 360, floor = 1180, lamp = 1, id = 'cb', door = true, windowGlass = true}) => {
  const flick = 1 + 0.03 * Math.sin(f / 5) + 0.02 * Math.sin(f / 11);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}lamp`} cx="0.3" cy="0.62" r="0.8">
          <stop offset="0" stopColor={CAL.amberHi} stopOpacity={0.55 * lamp * flick} />
          <stop offset="0.45" stopColor={CAL.amber} stopOpacity={0.22 * lamp * flick} />
          <stop offset="1" stopColor={CAL.woodDeep} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-40} y={0} width={1160} height={floor + 10} fill={CAL.wood} />
      {Array.from({length: 14}).map((_, i) => (
        <g key={i}>
          <rect x={-40 + i * 90} y={0} width={86} height={floor} fill={i % 2 ? '#4F3E33' : '#453529'} stroke={INK} strokeWidth={2.4} opacity={0.95} />
          <path d={`M${-40 + i * 90 + 20},${200 + rnd(i) * 300} l0,${160 + rnd(i + 4) * 200}`} stroke={CAL.woodDeep} strokeWidth={3} opacity={0.4} />
        </g>
      ))}
      {/* the window: cold night fill with a few stars */}
      {windowGlass && (
        <g>
          <rect x={wx - ww / 2} y={wy - wh / 2} width={ww} height={wh} fill="#16203F" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={wx - ww / 2 + 30 + rnd(i + 40) * (ww - 60)} cy={wy - wh / 2 + 24 + rnd(i + 50) * (wh - 150)} r={1.6 + rnd(i) * 1.6} fill="#FFFFFF" opacity={0.5 + 0.4 * Math.sin(f / (9 + i) + i)} />)}
          <rect x={wx - ww / 2} y={wy + wh / 2 - 120} width={ww} height={120} fill="#0E1530" />
        </g>
      )}
      {door && (
        <g transform="translate(40,300)">
          <rect x={0} y={0} width={230} height={880} fill="#35271F" stroke={INK} strokeWidth={6} />
          <path d="M0,0 L230,0" stroke={INK} strokeWidth={6} />
          {/* the old broken door: split panel and a hole */}
          <path d="M30,120 l170,0 l0,300 l-170,0 Z M30,470 l170,0 l0,340 l-170,0 Z" fill="none" stroke={CAL.woodDeep} strokeWidth={5} />
          <path d="M120,470 l-30,60 l50,40 l-40,70 l60,50" fill="none" stroke="#0E0A08" strokeWidth={6} strokeLinejoin="round" />
          <circle cx={190} cy={500} r={10} fill="#8A8A90" stroke={INK} strokeWidth={3} />
          <path d="M-60,880 L-60,0" stroke={INK} strokeWidth={0} />
        </g>
      )}
      {/* the floor */}
      <rect x={-40} y={floor} width={1160} height={1960 - floor} fill="#3A2C22" />
      {Array.from({length: 7}).map((_, i) => <path key={i} d={`M-40,${floor + 30 + i * 90} L1120,${floor + 30 + i * 90}`} stroke={INK} strokeWidth={2.4 + i * 0.3} opacity={0.5} />)}
      <rect x={-40} y={0} width={1160} height={1960} fill={`url(#${id}lamp)`} />
    </g>
  );
};

/** OrbitBG: the cold top-down view: a navy sea, a gravel coast and a dotted satellite grid. Origin is the full frame. */
export const OrbitBG: React.FC<{f: number; id?: string; grid?: number; cells?: number; drift?: number}> = ({f, id = 'ob', grid = 1, cells = 9, drift = 0}) => {
  const d = drift + Math.sin(f / 90) * 8;
  return (
    <g>
      <rect x={-40} y={0} width={1160} height={1960} fill={CAL.navy} />
      {Array.from({length: 40}).map((_, i) => <circle key={i} cx={rnd(i) * 1080} cy={rnd(i + 90) * 700} r={0.8 + rnd(i + 3) * 1.8} fill="#FFFFFF" opacity={0.2 + 0.5 * Math.abs(Math.sin(f / (18 + i) + i))} />)}
      <g transform={`translate(${d},0)`}>
        <path d={`M-60,760 C120,700 260,820 420,790 C560,760 640,880 780,860 C900,840 1000,900 1160,880 L1160,1960 L-60,1960 Z`} fill="#3F4A3E" stroke={INK} strokeWidth={5} />
        <path d={`M-60,790 C120,730 260,850 420,820 C560,790 640,910 780,890 C900,870 1000,930 1160,910 L1160,1960 L-60,1960 Z`} fill={CAL.gravel} opacity={0.88} />
        <path d={`M-60,820 C120,760 260,880 420,850 C560,820 640,940 780,920 C900,900 1000,960 1160,940`} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.4} />
        {/* the lagoon and its spit */}
        <path d="M120,960 C260,920 420,940 520,990 C440,1030 260,1040 120,960 Z" fill={CAL.sea} stroke={INK} strokeWidth={4} opacity={0.95} />
        {/* specks of walrus mounds on the shore */}
        {Array.from({length: 18}).map((_, i) => <ellipse key={i} cx={560 + rnd(i) * 440} cy={1100 + rnd(i + 30) * 420} rx={7 + rnd(i + 2) * 5} ry={4} fill={CAL.moundShade} opacity={0.9} />)}
      </g>
      {grid > 0 && (
        <g opacity={clamp01(grid)} stroke={CAL.pale} strokeWidth={2.4} fill="none">
          {Array.from({length: cells + 1}).map((_, i) => <path key={`v${i}`} d={`M${i * (1080 / cells)},560 L${i * (1080 / cells)},1700`} opacity={0.5} />)}
          {Array.from({length: 8}).map((_, i) => <path key={`h${i}`} d={`M0,${560 + i * 163} L1080,${560 + i * 163}`} opacity={0.5} />)}
        </g>
      )}
    </g>
  );
};

// ---- the machine side -------------------------------------------------------------------------------------------------------------
/** TrailCam: a camouflage-green box strapped to a post with a lens, a red IR LED that blinks and a small cone of view. */
export const TrailCam: React.FC<{x: number; y: number; f: number; scale?: number; id?: string; cone?: number}> = ({x, y, f, scale = 1, id = 'tc', cone = 0}) => {
  const t = tones('#5C6B49');
  const led = Math.sin(f / 9) > 0.5 ? 1 : 0.2;
  const gid = `${id}${Math.round(x)}`;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <FormGradient id={gid} t={t} softness={0.6} />
      <ContactShadow cx={0} cy={4} rx={70} ry={10} opacity={0.3} blur={8} />
      <rect x={-12} y={-250} width={24} height={250} fill="#6B5848" stroke={INK} strokeWidth={5} />
      {cone > 0.02 && <path d={`M-70,-300 L-480,${-340 - 160 * cone} L-480,${-300 + 120 * cone} Z`} fill={CAL.pale} opacity={0.18 * cone} />}
      <rect x={-78} y={-380} width={156} height={130} rx={14} fill={`url(#${gid})`} stroke={INK} strokeWidth={6} />
      <circle cx={-22} cy={-312} r={30} fill="#1A1620" stroke={INK} strokeWidth={5} />
      <circle cx={-22} cy={-312} r={13} fill="#26335C" stroke={INK} strokeWidth={3} />
      <circle cx={-14} cy={-320} r={4.4} fill="#FFFFFF" opacity={0.8} />
      <circle cx={42} cy={-338} r={7} fill="#F2E6D0" opacity={led} />
      <rect x={20} y={-300} width={44} height={14} rx={4} fill="#2A2F25" stroke={INK} strokeWidth={3} />
      <path d="M-78,-330 q-12,40 0,80 M78,-330 q12,40 0,80" fill="none" stroke="#3A3A3A" strokeWidth={9} />
    </g>
  );
};

/** HaulPhoto: a photo of a gravel haulout with N tiny walrus mounds. Human solid boxes appear with `marks` (0..n), the network's dotted guesses
 *  start offset and shrink onto the same mounds as `learn` goes 0..1. Origin is the top-left of the photo. */
export const HaulPhoto: React.FC<{
  x: number; y: number; w: number; h: number; f: number; n?: number; marks?: number; guess?: number; learn?: number; id?: string; tilt?: number; seed?: number;
}> = ({x, y, w, h, f, n = 8, marks = 0, guess = 0, learn = 0, id = 'hp', tilt = 0, seed = 0}) => {
  const pts = Array.from({length: n}).map((_, i) => ({
    px: 70 + rnd(i * 3 + seed) * (w - 160), py: 100 + rnd(i * 3 + 1 + seed) * (h - 190), s: 0.7 + rnd(i * 3 + 2 + seed) * 0.6,
  }));
  return (
    <g transform={`translate(${x},${y}) rotate(${tilt})`}>
      <rect x={8} y={12} width={w} height={h} fill="#000" opacity={0.3} />
      <rect x={0} y={0} width={w} height={h} fill={CAL.paper} stroke={INK} strokeWidth={6} />
      <clipPath id={`${id}c`}><rect x={12} y={12} width={w - 24} height={h - 24} /></clipPath>
      <g clipPath={`url(#${id}c)`}>
        <rect x={12} y={12} width={w - 24} height={(h - 24) * 0.32} fill={CAL.skyLow} />
        <rect x={12} y={12 + (h - 24) * 0.3} width={w - 24} height={(h - 24) * 0.14} fill={CAL.sea} />
        <rect x={12} y={12 + (h - 24) * 0.44} width={w - 24} height={(h - 24) * 0.56} fill={CAL.gravel} />
        {pts.map((p, i) => (
          <g key={i} transform={`translate(${p.px},${p.py}) scale(${p.s})`}>
            <ellipse cx={0} cy={0} rx={34} ry={17} fill={CAL.mound} stroke={INK} strokeWidth={3} />
            <ellipse cx={24} cy={-4} rx={11} ry={9} fill={CAL.moundHi} stroke={INK} strokeWidth={2.4} />
            <path d="M26,2 l-2,12 M32,0 l-1,11" stroke="#F0EAD8" strokeWidth={3} strokeLinecap="round" />
          </g>
        ))}
        {pts.map((p, i) => {
          const a = clamp01(marks - i);
          if (a <= 0) return null;
          const bw = 92 * p.s, bh = 56 * p.s;
          return <rect key={`h${i}`} x={p.px - bw / 2 - 4} y={p.py - bh / 2 - 4} width={bw} height={bh} fill="none" stroke={CAL.orange} strokeWidth={5.5} opacity={a} strokeDasharray={a < 1 ? '14 10' : undefined} />;
        })}
        {pts.map((p, i) => {
          const a = clamp01(guess * n - i * 0.5);
          if (a <= 0) return null;
          const bw = 92 * p.s, bh = 56 * p.s;
          const err = (1 - clamp01(learn)) * (46 + 40 * rnd(i + 90));
          const ang = rnd(i + 120) * 6.28 + f / 22;
          const gx = p.px - bw / 2 - 4 + Math.cos(ang) * err * 0.7;
          const gy = p.py - bh / 2 - 4 + Math.sin(ang) * err * 0.5;
          const gw = bw * (1 + (1 - learn) * 0.35 * Math.sin(ang * 2)), gh = bh * (1 + (1 - learn) * 0.3 * Math.cos(ang));
          return <rect key={`g${i}`} x={gx} y={gy} width={gw} height={gh} fill="none" stroke={CAL.pale} strokeWidth={4.6} strokeDasharray="11 9" strokeDashoffset={-f * 0.8} opacity={Math.min(1, a) * 0.95} />;
        })}
      </g>
    </g>
  );
};

/** Phone: a held phone with a lens glint, origin at the grip. */
export const Phone: React.FC<{x: number; y: number; scale?: number; rot?: number; flash?: number}> = ({x, y, scale = 1, rot = 0, flash = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
    <rect x={-18} y={-52} width={36} height={64} rx={7} fill="#1B2030" stroke={INK} strokeWidth={4} />
    <rect x={-13} y={-46} width={26} height={44} rx={3} fill="#3B4A6B" />
    <circle cx={8} cy={-44} r={3.2} fill="#FFFFFF" opacity={0.7} />
    {flash > 0.02 && <circle cx={0} cy={-24} r={40 * flash} fill="#FFFFFF" opacity={0.6 * (1 - flash)} />}
  </g>
);

/** Pool: a small tiled rehabilitation pool seen from the side. Origin is the pool's bottom centre; the water line is at y=-top. */
export const Pool: React.FC<{x: number; y: number; w?: number; h?: number; f: number; id?: string}> = ({x, y, w = 560, h = 230, f, id = 'pl'}) => (
  <g transform={`translate(${x},${y})`}>
    <defs>
      <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6FB4C4" /><stop offset="1" stopColor="#2A5568" />
      </linearGradient>
    </defs>
    <rect x={-w / 2} y={-h} width={w} height={h} fill={`url(#${id}w)`} stroke={INK} strokeWidth={7} />
    {[0, 1, 2].map((i) => <path key={i} d={`M${-w / 2 + 8},${-h + 26 + i * 18} q${w / 8},${-8 + 3 * Math.sin(f / 14 + i)} ${w / 4},0 t${w / 4},0 t${w / 4},0 t${w / 4},0`} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.5 - i * 0.12} />)}
    <rect x={-w / 2 - 16} y={-h - 18} width={w + 32} height={22} fill="#D8D2C2" stroke={INK} strokeWidth={5} />
    {Array.from({length: 7}).map((_, i) => <path key={i} d={`M${-w / 2 + i * (w / 6)},${-h + 4} l0,${h - 4}`} stroke="#FFFFFF" strokeWidth={2} opacity={0.18} />)}
  </g>
);

/** Kennel: a heavy-duty grey plastic transport crate with vent slots and a latch. Origin is the bottom centre. */
export const Kennel: React.FC<{x: number; y: number; scale?: number; f: number; door?: number; id?: string}> = ({x, y, scale = 1, f, door = 0, id = 'kn'}) => {
  const t = tones('#7C8590');
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <FormGradient id={`${id}g`} t={t} softness={0.6} />
      <ContactShadow cx={0} cy={4} rx={190} ry={16} opacity={0.34} blur={10} />
      <path d="M-180,0 L-180,-150 Q-180,-190 -140,-190 L140,-190 Q180,-190 180,-150 L180,0 Z" fill={`url(#${id}g)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {[-110, -70, -30, 10].map((vx, i) => <rect key={i} x={vx} y={-160} width={22} height={90} rx={9} fill="#2A2F36" stroke={INK} strokeWidth={3} />)}
      <rect x={110} y={-170} width={52} height={150} fill="#5A646E" stroke={INK} strokeWidth={5} />
      <rect x={120 - 44 * door} y={-110} width={14} height={30} fill="#C9D2D8" stroke={INK} strokeWidth={3} />
      <rect x={-196} y={-26} width={392} height={12} fill="#3D454D" stroke={INK} strokeWidth={4} />
      <path d={`M-170,-186 Q0,${-208 + 2 * Math.sin(f / 20)} 170,-186`} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.35} />
    </g>
  );
};

// ---- small props ------------------------------------------------------------------------------------------------------------------
export const BRASS = '#C99A3C';
/** Tally: a brass hand clicker with a two-digit window. n is the shown count, roll (0..1) is how far the next digit has turned, so a stuck digit sits at roll 0.5 and shivers. Origin is the bottom centre. */
export const Tally: React.FC<{x: number; y: number; scale?: number; n?: number; roll?: number; f: number; shiver?: number; id?: string}> = ({x, y, scale = 1, n = 0, roll = 0, f, shiver = 0, id = 'ty'}) => {
  const t = tones(BRASS);
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const sh = shiver * Math.sin(f * 1.9) * 2.2;
  const dg = (v: number) => String(v % 100).padStart(2, '0');
  return (
    <g transform={`translate(${x + sh},${y}) scale(${scale})`}>
      <FormGradient id={gid} t={t} softness={0.6} />
      <ContactShadow cx={0} cy={4} rx={70} ry={11} opacity={0.34} blur={8} />
      <rect x={-66} y={-170} width={132} height={170} rx={26} fill={`url(#${gid})`} stroke={INK} strokeWidth={6} />
      <rect x={-48} y={-142} width={96} height={52} rx={8} fill="#1B1D22" stroke={INK} strokeWidth={4} />
      <clipPath id={`${gid}c`}><rect x={-48} y={-142} width={96} height={52} rx={8} /></clipPath>
      <g clipPath={`url(#${gid}c)`} fontFamily={MONO} fontWeight={800} fontSize={44} fill="#F2E6D0" textAnchor="middle">
        <text x={0} y={-100 - 52 * roll}>{dg(n)}</text>
        <text x={0} y={-100 + 52 - 52 * roll}>{dg(n + 1)}</text>
      </g>
      <rect x={-34} y={-250 + 26 * roll} width={68} height={86} rx={20} fill={`url(#${gid})`} stroke={INK} strokeWidth={6} />
      <path d="M-30,-232 q30,-10 60,0" fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
    </g>
  );
};

/** QMark: the big question mark glyph in survey orange with an ink outline. Origin is the centre. outline draws it as a hollow mark. */
export const QMark: React.FC<{x: number; y: number; size?: number; f: number; k?: number; outline?: boolean; rot?: number; glow?: number}> = ({x, y, size = 400, f, k = 1, outline = false, rot = 0, glow = 0}) => {
  const kk = clamp01(k);
  if (kk <= 0.01) return null;
  const over = 1 + (1 - kk) * 1.2;
  const pulse = 1 + 0.025 * Math.sin(f / 9);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${over * pulse})`} opacity={Math.min(1, kk * 2.4)}>
      {glow > 0 && <circle cx={0} cy={0} r={size * 0.58} fill="none" stroke={CAL.orange} strokeWidth={6} strokeDasharray="10 14" opacity={0.7 * glow} />}
      <text x={6} y={size * 0.36 + 10} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight={900} fontSize={size} fill="#000" opacity={0.28}>?</text>
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight={900} fontSize={size}
        fill={outline ? 'none' : CAL.orange} stroke={outline ? CAL.orange : INK} strokeWidth={outline ? Math.max(4, size * 0.04) : size * 0.03} paintOrder="stroke">?</text>
    </g>
  );
};

/** NeuralStack: four stacked pale glass layers with dotted links, lit one by one with `lit` (0..4). Origin is the centre. dim (0..1) dims it. */
export const NeuralStack: React.FC<{x: number; y: number; scale?: number; f: number; lit?: number; dim?: number}> = ({x, y, scale = 1, f, lit = 4, dim = 0}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`} opacity={1 - 0.65 * dim}>
    {[0, 1, 2, 3].map((i) => {
      const a = clamp01(lit - i);
      const yy = 150 - i * 100;
      return (
        <g key={i} transform={`translate(0,${yy})`}>
          <path d="M-170,0 L120,0 L170,-50 L-120,-50 Z" fill={CAL.pale} opacity={0.18 + 0.26 * a} stroke={CAL.pale} strokeWidth={4} />
          {[-90, -30, 30, 90].map((nx, j) => <circle key={j} cx={nx + 10 - 20 * (i % 2)} cy={-24} r={9} fill={CAL.pale} opacity={0.3 + 0.7 * a * (0.7 + 0.3 * Math.sin(f / 7 + i + j))} stroke={INK} strokeWidth={2.4} />)}
        </g>
      );
    })}
    {[0, 1, 2].map((i) => [-90, -30, 30, 90].map((nx, j) => (
      <path key={`${i}${j}`} d={`M${nx + 10 - 20 * (i % 2)},${126 - i * 100} L${nx + 10 - 20 * ((i + 1) % 2) + 20 * (j % 2 ? -1 : 1)},${26 - i * 100}`} stroke={CAL.pale} strokeWidth={2.4} strokeDasharray="6 8" strokeDashoffset={-f * 0.8} opacity={0.5 * clamp01(lit - i - 0.5)} fill="none" />
    )))}
  </g>
);

/** CalfInset: a small tawny calf held in its own orange corners, breathing, for the machine stretch. */
export const CalfInset: React.FC<{x: number; y: number; scale?: number; f: number; id?: string}> = ({x, y, scale = 0.4, f, id = 'ci'}) => (
  <g>
    <rect x={x - 230 * scale * 1.6 + 0} y={y - 190 * scale * 1.5} width={460 * scale * 1.6} height={230 * scale * 1.5 + 20} fill="#101423" opacity={0.28} rx={10} />
    <WalrusCalf x={x} y={y} f={f} scale={scale} mood="calm" breath={1.4} id={id} />
    <ViewFrame x={x} y={y - 78 * scale * 1.6} w={470 * scale * 1.6} h={250 * scale * 1.6} f={f} mode="bracket" k={1} sw={7} id={`${id}f`} />
  </g>
);

/** Gauge: a thin comparison needle gauge with an empty arc. v (0..1) is the needle, where 0 is 'matches'. Origin is the dial centre. */
export const Gauge: React.FC<{x: number; y: number; scale?: number; v: number; f: number}> = ({x, y, scale = 1, v, f}) => {
  const ang = -80 + 160 * clamp01(v) + Math.sin(f / 4) * 2.2 * clamp01(v);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path d="M-150,0 A150,150 0 0 1 150,0" fill="#1B1D22" stroke={INK} strokeWidth={6} />
      <path d="M-150,0 A150,150 0 0 1 150,0" fill="none" stroke={CAL.pale} strokeWidth={5} strokeDasharray="4 10" opacity={0.7} />
      <path d="M0,0 L0,-128" stroke={CAL.orange} strokeWidth={8} strokeLinecap="round" transform={`rotate(${ang})`} />
      <circle cx={0} cy={0} r={14} fill={CAL.cream} stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** Skiff: a small open boat in side view. Origin is the waterline centre. Figures are caller-drawn. */
export const Skiff: React.FC<{x: number; y: number; scale?: number; f: number; facing?: 1 | -1; id?: string}> = ({x, y, scale = 1, f, facing = 1, id = 'sk'}) => {
  const t = tones('#8A8F94');
  const bob = Math.sin(f / 11) * 5;
  const gid = `${id}${Math.round(x)}`;
  return (
    <g transform={`translate(${x},${y + bob}) scale(${scale * facing},${scale}) rotate(${Math.sin(f / 17) * 1.6})`}>
      <FormGradient id={gid} t={t} softness={0.6} />
      <path d="M-210,-40 L210,-52 L170,18 L-170,18 Z" fill={`url(#${gid})`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M-196,-30 L198,-42" stroke="#FFFFFF" strokeWidth={4} opacity={0.4} />
      <rect x={-196} y={-24} width={380} height={12} fill="#2A2F36" opacity={0.6} />
      <rect x={-232} y={-96} width={44} height={80} rx={8} fill="#4A4F55" stroke={INK} strokeWidth={5} />
      <path d="M-240,20 q20,-8 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0" fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.5} />
    </g>
  );
};

/** CabinDoor: the old broken plank door of the camp cabin, swinging on a left hinge. open (0..1). Origin is the bottom of the hinge side. */
export const CabinDoor: React.FC<{x: number; y: number; scale?: number; open?: number; f: number}> = ({x, y, scale = 1, open = 0, f}) => {
  const w = 190 * Math.cos(open * 1.25);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-18} y={-420} width={230} height={420} fill="#14100E" stroke={INK} strokeWidth={6} />
      <g transform={`rotate(${Math.sin(f / 13) * open * 1.5})`}>
        <rect x={0} y={-410} width={w} height={410} fill="#35271F" stroke={INK} strokeWidth={6} />
        <path d={`M${w * 0.33},-400 L${w * 0.33},0 M${w * 0.66},-400 L${w * 0.66},0`} stroke={CAL.woodDeep} strokeWidth={5} />
        <path d={`M${w * 0.5},-250 l${-w * 0.16},40 l${w * 0.22},30 l${-w * 0.14},50`} fill="none" stroke="#0E0A08" strokeWidth={8} strokeLinejoin="round" />
        <circle cx={w * 0.86} cy={-200} r={9} fill="#8A8A90" stroke={INK} strokeWidth={3} />
      </g>
    </g>
  );
};
