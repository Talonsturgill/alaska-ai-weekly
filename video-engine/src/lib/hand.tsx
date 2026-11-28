import React from 'react';
import {tones, Tones, ContactShadow} from './lighting';

/**
 * HAND, the shelf's articulated working hand (machine pass 2026-11-28, queue lib-hand-asset, with the
 * 11-26 doctor's hand it grew out of).
 *
 * Why it exists: Motion was the lowest axis on 33 of 39 judge cards from 11-15 to 11-28, and on 11-28
 * seat 1 named the cause in one line: both CheckHands "are flat single-tone polygons that translate
 * rigidly, with no wrist or finger articulation and no anticipation, press, recoil or settle". On 11-26
 * the doctor's hand was "a sleeveless mitten with no contact shadow". Every episode drew its own hand
 * as ONE path, so a stamp, a tap or a strike could only move the whole silhouette.
 *
 * What it draws: a sleeve and cuff, a tapered forearm, a palm, four two-segment fingers jointed at the
 * knuckle and the middle joint, and a two-segment thumb, every segment inked and two-tone shaded (a
 * key face and a core-shadow side) with a crease at each joint, plus a contact shadow at the work
 * point that darkens on the press. The hand turns about its WRIST, separately from the forearm.
 *
 * Origin: the WORK POINT, the tip of the tool for grip 'tool' (children are drawn with their tip at
 * 0,0 pointing down, the hand closing around them about 60 to 170 px up) and the index fingertip for
 * grip 'point'. Place the work point and the hand follows, so a pen's tip sits on its mark.
 *
 * How it acts: `cues` are frame numbers where the work point strikes. Around each cue `handAction`
 * runs anticipation (the wrist cocks back and the hand lifts, fingers loosen), a fast strike that
 * overshoots into the surface, a press hold (fingers tighten, palm squashes), a recoil and a damped
 * settle. Between cues, holdLife keeps the wrist and a finger ripple alive, scaled by `gain`, so gain 0
 * is a true statue and a held hand is never one frozen pose across a judge's eight-frame strip.
 * `handAction` is exported so a caller can sync a stamp mark, a tick or a recoil to the same envelope.
 *
 * Measured by scripts/hand_check.py on HandLook (src/HandLook.tsx).
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
const rad = (d: number) => (d * Math.PI) / 180;

export interface HandAction {
  /** work-point travel along the hand's own axis in px, negative = lifted off the surface */
  lift: number;
  /** wrist turn in degrees relative to the forearm, negative = cocked back */
  wrist: number;
  /** added finger curl, -0.3 (loosened) .. +0.3 (clenched on the press) */
  curl: number;
  /** 0..1 contact, 1 for the frames the work point is pressed into the surface */
  press: number;
  /** -1 before the nearest cue's window, 0..1 phase through it, 2 after */
  phase: number;
}

/** frames of each part of the strike, at 30 fps; scaled for other rates */
export const HAND_TIMING = {anticipate: 10, strike: 2, hold: 3, recoil: 5, settle: 16};

/**
 * The strike envelope around the nearest cue. Pure arithmetic of the frame, so a caller's mark lands on
 * the same frame the hand presses: press is 1 from the cue to the end of the hold.
 */
export function handAction(f: number, cues: number[] = [], fps = 30, strength = 1): HandAction {
  const k = fps / 30;
  const T = HAND_TIMING;
  const A = T.anticipate * k, S = T.strike * k, H = T.hold * k, R = T.recoil * k, Z = T.settle * k;
  const rest: HandAction = {lift: 0, wrist: 0, curl: 0, press: 0, phase: -1};
  if (!cues.length) return rest;
  let c = cues[0];
  for (const q of cues) if (Math.abs(f - q) < Math.abs(f - c)) c = q;
  const d = f - c;
  const LIFT = -26 * strength, COCK = -14 * strength, DIG = 5 * strength, BOUNCE = -11 * strength;
  if (d < -(A + S)) return rest;
  if (d > H + R + Z) return {...rest, phase: 2};
  const span = A + S + H + R + Z;
  const phase = (d + A + S) / span;
  if (d < -S) {
    // anticipation: lift and cock the wrist back, fingers loosen
    const u = easeOut((d + A + S) / A);
    return {lift: LIFT * u, wrist: COCK * u, curl: -0.22 * u, press: 0, phase};
  }
  if (d < 0) {
    // strike: fast, overshooting into the surface
    const u = (d + S) / S;
    const v = u * u;
    return {lift: LIFT + (DIG - LIFT) * v, wrist: COCK + (6 - COCK) * v, curl: -0.22 + 0.5 * v, press: v > 0.85 ? 1 : 0, phase};
  }
  if (d < H) {
    // press hold: dug in, clenched
    const u = d / H;
    return {lift: DIG * (1 - 0.3 * u), wrist: 6 - 2 * u, curl: 0.28, press: 1, phase};
  }
  if (d < H + R) {
    // recoil: the hand comes up off the mark
    const u = easeOut((d - H) / R);
    return {lift: DIG * 0.7 + (BOUNCE - DIG * 0.7) * u, wrist: 4 - 9 * u, curl: 0.28 - 0.36 * u, press: 0, phase};
  }
  // settle: damped oscillation back to rest
  const t = (d - H - R) / Z;
  const env = Math.exp(-3.4 * t) * Math.cos(t * Math.PI * 2.4);
  return {lift: BOUNCE * env, wrist: -5 * env, curl: -0.08 * env, press: 0, phase};
}

/** the between-cue life of a held hand: wrist drift, a finger ripple, a small breath of travel */
export function handHold(f: number, seed = 0, gain = 1, fps = 30) {
  const t = f / fps;
  const s = seed * 2.399963 + 0.7;
  const wrist = gain * (4.2 * Math.sin(t * 2.1 + s) + 2.0 * Math.sin(t * 3.7 + s * 1.9));
  const lift = gain * (-5 * (0.5 + 0.5 * Math.sin(t * 1.6 + s * 0.6)));
  const ripple = (i: number) => gain * 0.14 * Math.sin(t * 3.1 - i * 0.9 + s);
  return {wrist, lift, ripple};
}

type V = [number, number];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const dir = (deg: number, len: number): V => [Math.cos(rad(deg)) * len, Math.sin(rad(deg)) * len];

/** a capsule from p along deg for len, width w, two-tone shaded (key face toward the light, up-left) */
const Segment: React.FC<{p: V; deg: number; len: number; w: number; t: Tones; ink: string; inkW: number; nail?: boolean; crease?: boolean}> =
({p, deg, len, w, t, ink, inkW, nail = false, crease = true}) => {
  const r = w / 2;
  return (
    <g transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)}) rotate(${deg.toFixed(2)})`}>
      <rect x={-r * 0.6} y={-r} width={len + r * 1.6} height={w} rx={r} fill={t.base} stroke={ink} strokeWidth={inkW} />
      {/* core-shadow side, then the key face */}
      <rect x={-r * 0.2} y={r * 0.15} width={len + r * 0.8} height={r * 0.7} rx={r * 0.35} fill={t.core} opacity={0.9} />
      <rect x={r * 0.2} y={-r * 0.62} width={len * 0.7} height={r * 0.36} rx={r * 0.18} fill={t.key} opacity={0.7} />
      {nail && <path d={`M ${len - r * 0.2} ${-r * 0.55} q ${r * 0.85} ${r * 0.1} ${r * 0.85} ${r * 0.55}`} stroke={t.shade} strokeWidth={Math.max(1.5, inkW * 0.55)} fill="none" strokeLinecap="round" />}
      {crease && <path d={`M ${-r * 0.1} ${-r * 0.55} q ${-r * 0.35} ${r * 0.55} 0 ${r * 1.1}`} stroke={t.shade} strokeWidth={Math.max(1.5, inkW * 0.6)} fill="none" strokeLinecap="round" />}
    </g>
  );
};

export interface HandProps {
  f: number;
  x: number;
  y: number;
  s?: number;
  /** whole-hand rotation in degrees; 0 = tool pointing straight down, sleeve leaving straight up */
  angle?: number;
  /** strike frames (see handAction) */
  cues?: number[];
  fps?: number;
  /** strike size, 1 = a firm stamp, 0.4 = a light tap */
  strength?: number;
  /** 'tool' closes around children drawn tip-down at 0,0; 'point' extends the index to 0,0 */
  grip?: 'tool' | 'point';
  /** resting finger curl 0..1 (tool grip default 0.8, point grip default 0.9 for the folded fingers) */
  curl?: number;
  /** extra press 0..1 a caller can drive directly (added to the cue envelope) */
  press?: number;
  /** between-cue life; 0 = a statue */
  gain?: number;
  seed?: number;
  skin?: string;
  sleeve?: string;
  cuff?: string;
  ink?: string;
  /** forearm and sleeve length in px before the frame edge, 0 hides them */
  arm?: number;
  /** +1 a right hand, -1 mirrors to a left hand */
  side?: 1 | -1;
  /** contact shadow at the work point */
  shadow?: boolean;
  children?: React.ReactNode;
}

// Rest geometry, local frame, origin at the work point, tool pointing down (+y), sleeve up (-y).
const WRIST: V = [26, -196];
const KNUCKLES: V[] = [[30, -160], [34, -136], [34, -113], [30, -92]];
const L1 = [40, 44, 41, 33];
const L2 = [30, 32, 30, 25];
const FW = [21, 21, 20, 17];
/** the extended index of grip 'point': its knuckle angle and its length against a curled finger */
const POINT_DEG = 132, POINT_LEN = 1.25;

export const Hand: React.FC<HandProps> = ({
  f, x, y, s = 1, angle = 0, cues = [], fps = 30, strength = 1, grip = 'tool', curl, press = 0,
  gain = 1, seed = 0, skin = '#C98E6A', sleeve = '#5E6E7A', cuff, ink = '#15161D', arm = 300,
  side = 1, shadow = true, children,
}) => {
  const act = handAction(f, cues, fps, strength);
  const hold = handHold(f, seed, act.phase >= 0 && act.phase <= 1 ? gain * 0.3 : gain, fps);
  const pr = clamp01(act.press + press);
  const tk = tones(skin);
  const tSleeve = tones(sleeve);
  const tCuff = tones(cuff || tSleeve.key);
  const back: Tones = {key: tk.base, base: tk.core, core: tk.shade, shade: tk.shade};
  const point = grip === 'point';
  const baseCurl = curl ?? (point ? 1 : 0.8);
  const inkW = 4;

  // finger kinematics: proximal turns at the knuckle, distal at the middle joint
  const fingers = KNUCKLES.map((k, i) => {
    const extended = point && i === 0;
    const c = extended ? clamp01(0.05 + act.curl * 0.3 + hold.ripple(i) * 0.3) : clamp01(baseCurl + act.curl + hold.ripple(i));
    const a1 = extended ? POINT_DEG : 186 - 34 * c;
    const a2 = a1 - (extended ? 10 + 25 * c : 30 + 95 * c);
    const l1 = extended ? L1[i] * POINT_LEN : L1[i], l2 = extended ? L2[i] * POINT_LEN : L2[i];
    const j = add(k, dir(a1, l1));
    const tip = add(j, dir(a2, l2));
    return {k, a1, a2, j, tip, i, l1, l2};
  });

  // grip 'point' puts the index fingertip on the work point
  // taken from the REST pose, so the wrist and the strike move the fingertip rather than being cancelled
  const restTip = add(add(KNUCKLES[0], dir(POINT_DEG, L1[0] * POINT_LEN)), dir(POINT_DEG - 10 - 25 * 0.05, L2[0] * POINT_LEN));
  const shift: V = point ? [-restTip[0], -restTip[1]] : [0, 0];
  const thumbC = clamp01(baseCurl * 0.8 + act.curl * 0.8);
  const tb: V = [12, -176];
  const ta1 = 168 - 24 * thumbC;
  const tj = add(tb, dir(ta1, 30));
  const ta2 = ta1 - 20 - 40 * thumbC;

  const wristDeg = act.wrist + hold.wrist;
  const lift = act.lift + hold.lift;
  const sq = pr * 0.05;

  const palm = `M ${tb[0] - 4} ${tb[1] - 6} C ${tb[0] + 6} ${WRIST[1] - 6} ${WRIST[0] + 34} ${WRIST[1] - 2} ${WRIST[0] + 40} ${WRIST[1] + 26}
    C ${WRIST[0] + 50} -140 ${WRIST[0] + 46} -100 ${KNUCKLES[3][0] + 14} -78 C ${KNUCKLES[3][0] + 4} -70 ${KNUCKLES[3][0] - 10} -74 ${KNUCKLES[3][0] - 8} -86
    L ${KNUCKLES[0][0] - 10} -156 C ${KNUCKLES[0][0] - 14} -166 ${tb[0] - 2} -168 ${tb[0] - 4} ${tb[1] - 6} Z`;

  return (
    <g transform={`translate(${x} ${y}) scale(${s * side} ${s}) rotate(${angle})`}>
      {shadow && <ContactShadow cx={4} cy={4} rx={20 + 10 * pr} ry={5 + 2 * pr} opacity={0.18 + 0.22 * pr - Math.min(0.12, Math.max(0, -lift) * 0.004)} />}
      <g transform={`translate(${shift[0].toFixed(2)} ${(shift[1] + lift).toFixed(2)})`}>
        {/* forearm and sleeve: they ride the lift but not the wrist turn */}
        {arm > 0 && (() => {
          // the forearm leaves up and to the right of the grip, 28 degrees off the tool, so a held
          // tool clears it; widths are taken square to the arm
          const ax = Math.sin(rad(28)), ay = -Math.cos(rad(28));
          const nx = -ay, ny = ax;
          const W0: V = [WRIST[0] + 4, WRIST[1] + 4];
          const C0: V = [W0[0] + ax * 14, W0[1] + ay * 14];
          const E: V = [W0[0] + ax * arm, W0[1] + ay * arm];
          const q = (p: V, w: number): string => `${(p[0] + nx * w).toFixed(1)} ${(p[1] + ny * w).toFixed(1)}`;
          return (
            <g>
              <path d={`M ${q(W0, -30)} L ${q(E, -40)} L ${q(E, 40)} L ${q(W0, 30)} Z`} fill={tk.core} stroke={ink} strokeWidth={inkW} strokeLinejoin="round" />
              <path d={`M ${q(C0, -38)} L ${q(E, -50)} L ${q(E, 50)} L ${q(C0, 38)} Z`} fill={tSleeve.base} stroke={ink} strokeWidth={inkW + 1} strokeLinejoin="round" />
              <path d={`M ${q([C0[0] + ax * 12, C0[1] + ay * 12], -26)} L ${q(E, -34)}`} stroke={tSleeve.key} strokeWidth={10} opacity={0.7} />
              <path d={`M ${q([C0[0] + ax * 12, C0[1] + ay * 12], 26)} L ${q(E, 36)}`} stroke={tSleeve.shade} strokeWidth={12} opacity={0.8} />
              {[70, 140].map((dd) => {
                const m: V = [W0[0] + ax * dd, W0[1] + ay * dd];
                return <path key={dd} d={`M ${q(m, -18)} Q ${q([m[0] - ax * 8, m[1] - ay * 8], 0)} ${q(m, 22)}`} stroke={tSleeve.shade} strokeWidth={3} fill="none" />;
              })}
              <path d={`M ${q(C0, -42)} L ${q(C0, 42)} L ${q([C0[0] + ax * 20, C0[1] + ay * 20], 44)} L ${q([C0[0] + ax * 20, C0[1] + ay * 20], -44)} Z`}
                fill={tCuff.base} stroke={ink} strokeWidth={inkW} strokeLinejoin="round" />
              <path d={`M ${q([C0[0] + ax * 6, C0[1] + ay * 6], -34)} L ${q([C0[0] + ax * 6, C0[1] + ay * 6], 34)}`} stroke={tCuff.key} strokeWidth={5} opacity={0.8} />
            </g>
          );
        })()}
        {/* everything below turns about the wrist */}
        <g transform={`rotate(${wristDeg.toFixed(2)} ${WRIST[0]} ${WRIST[1]})`}>
          <g>
            {!point && <g transform={`translate(0 ${(pr * 2).toFixed(2)})`}>{children}</g>}
            {/* the far fingers' backs, seen past the palm */}
            {fingers.slice(1).reverse().map((g) => (
              <g key={`b${g.i}`} opacity={0.95}>
                <Segment p={add(g.k, [4, 3])} deg={g.a1} len={L1[g.i] * 0.6} w={FW[g.i]} t={back} ink={ink} inkW={inkW - 1} crease={false} />
              </g>
            ))}
            {/* palm, squashing on the press */}
            <g transform={`translate(${WRIST[0]} ${WRIST[1]}) scale(${1 + sq} ${1 - sq}) translate(${-WRIST[0]} ${-WRIST[1]})`}>
              <path d={palm} fill={tk.base} stroke={ink} strokeWidth={inkW + 1} strokeLinejoin="round" />
              <path d={`M ${WRIST[0] + 30} ${WRIST[1] + 28} C ${WRIST[0] + 38} -140 ${WRIST[0] + 34} -104 ${KNUCKLES[3][0] + 8} -84`} stroke={tk.core} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.85} />
              <path d={`M ${tb[0] + 6} ${tb[1] - 4} C ${WRIST[0] + 4} ${WRIST[1] + 4} ${WRIST[0] + 22} ${WRIST[1] + 8} ${WRIST[0] + 28} ${WRIST[1] + 30}`} stroke={tk.key} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.9} />
              {/* tendons and the knuckle ridge */}
              {KNUCKLES.map((k, i) => <path key={`t${i}`} d={`M ${WRIST[0] + 10 + i * 4} ${WRIST[1] + 18 + i * 2} L ${k[0] + 4} ${k[1] - 4}`} stroke={tk.core} strokeWidth={2.5} opacity={0.55} fill="none" />)}
            </g>
            {/* thumb, two segments over the grip */}
            <Segment p={tb} deg={ta1} len={30} w={24} t={tk} ink={ink} inkW={inkW} crease={false} />
            <Segment p={tj} deg={ta2} len={24} w={21} t={tk} ink={ink} inkW={inkW} nail />
            {/* the fingers, pinky first so the index sits on top */}
            {fingers.slice().reverse().map((g) => (
              <g key={`f${g.i}`}>
                <Segment p={g.k} deg={g.a1} len={g.l1} w={FW[g.i]} t={tk} ink={ink} inkW={inkW} crease={false} />
                <Segment p={g.j} deg={g.a2} len={g.l2} w={FW[g.i] - 2} t={tk} ink={ink} inkW={inkW} nail />
                <circle cx={g.k[0]} cy={g.k[1]} r={FW[g.i] * 0.32} fill={tk.key} opacity={0.75} />
              </g>
            ))}
          </g>
        </g>
      </g>
    </g>
  );
};

/** a plain pencil drawn tip-down at the origin, the default tool for a Hand that writes or ticks */
export const HandPencil: React.FC<{color?: string; colorL?: string; ink?: string}> = ({color = '#E0662A', colorL = '#F59060', ink = '#15161D'}) => (
  <g>
    <path d="M 0 0 L -9 -34 L 9 -34 Z" fill="#E7C9A0" stroke={ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M 0 0 L -3 -11 L 3 -11 Z" fill={color} />
    <rect x={-10} y={-210} width={20} height={178} fill={color} stroke={ink} strokeWidth={4} />
    <path d="M -3 -200 L -3 -40" stroke={colorL} strokeWidth={3} />
  </g>
);
