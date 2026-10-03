// =============================================================================
// ACTING — the held-gesture performance of lib/Character.tsx, as pure functions.
//
// Kept out of the .tsx (no React, no JSX) so a check can evaluate it in plain Node:
// scripts/held_gesture_check.mjs measures it, and scripts/rig_check.py --only life runs that.
//
// WHY (2026-10-02 machine pass, queue item held-gesture-idle). All three judges read the S11
// manager's point on CATCH LIMITS as ONE frozen silhouette across the windows they sampled
// (88.6, 90.8, 92.6 s) although every idle channel in the rig was running. Measured on
// RigHoldLook, that figure alone with the film's props and the sway registered out, the 88.6 and
// 92.6 s silhouettes differed by 0.31 percent beyond a 3 px tolerance. The idle channels are
// continuous sines of a few degrees: a window two seconds later lands on nearly the same pose,
// and continuous small motion is what a judge discounts as wobble anyway.
//
// So a settled point is performed POSE TO POSE, the way an animator keeps a hold alive: the
// pointing arm re-aims, the forearm gives a quick beat, the free hand moves between hanging,
// resting on the hip with the elbow out and resting at the belt, and the head checks between the
// target and the viewer. Every channel holds, then commits to a DIFFERENT pose (never a re-pick),
// leaving fast and settling with one small overshoot, the grammar of motion.humanIdle.
// =============================================================================

/** Deterministic 0..1 from two numbers (no Math.random: renders must reproduce). */
export function h01(a: number, b: number): number {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/** Overshooting arrival: 0 at u=0, passes 1 once, lands exactly on 1 at u=1. */
export function settle01(u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const e = Math.exp(-4.2 * u) * Math.cos(5.6 * u);
  const e1 = Math.exp(-4.2) * Math.cos(5.6);
  return (1 - e) / (1 - e1);
}

export interface Hold { a: number; b: number; k: number; }

/** Which of `n` poses a channel is leaving (a) and heading to (b), and how far it has got (k).
 *  Holds last minGap..maxGap seconds, seeded; a pose is never re-picked. */
export function holdSchedule(t: number, seed: number, minGap: number, maxGap: number, n: number, dur: number): Hold {
  let evT = 0, a = 0, b = 0, start = -999, d = dur;
  for (let i = 0; i < 240; i++) {
    const gap = minGap + (maxGap - minGap) * h01(seed, i);
    if (evT + gap > t) break;
    evT += gap;
    a = b;
    let nb = Math.floor(h01(seed + 7.7, i) * n) % n;
    if (nb === b) nb = (nb + 1) % n;
    b = nb;
    start = evT;
    d = dur * (0.85 + 0.4 * h01(seed + 3.1, i));
  }
  return {a, b, k: settle01((t - start) / d)};
}

export const holdLerp = (vals: number[], s: Hold) => vals[s.a] + (vals[s.b] - vals[s.a]) * s.k;

/** The poses a held point moves between. Angles are the rig's armChain degrees. */
export const HELD = {
  /** pointing arm re-aims: [shoulder, elbow] offsets, degrees */
  aimUp: [0, -6, 4, 8],
  aimFore: [0, 6, -6, 3],
  /** the free arm: hanging, on the hip with the elbow out, resting at the belt */
  offUp: [-4, -31, 14],
  offFore: [20, 50, 56],
  /** +1 at the target, 0 at the viewer, -0.4 a half look away */
  gaze: [1, 0, 0.6, -0.4],
};

export interface HeldPerformance {
  aimUp: number; aimFore: number; offUp: number; offFore: number; gaze: number; beat: number;
}

/** The performance at time t (s) for a figure seeded `seed`, engaged by `held` (0 = none, 1 = a
 *  settled point, up to 1.25 for a figure the scene runs livelier). offUp/offFore are offsets
 *  from the hanging arm (-4, 20). */
export function heldPerformance(t: number, seed: number, held: number): HeldPerformance {
  if (held <= 0) return {aimUp: 0, aimFore: 0, offUp: 0, offFore: 0, gaze: 0, beat: 0};
  const w = Math.min(1, held);
  const aimS = holdSchedule(t, seed + 3.3, 1.4, 3.2, 4, 0.42);
  const offS = holdSchedule(t, seed + 5.7, 2.2, 4.6, 3, 0.55);
  const gazeS = holdSchedule(t, seed + 13.7, 1.6, 3.4, 4, 0.3);
  // the beat: a quick dip of the pointing forearm every 2.4..4.8 s
  let beatAt = -999, evT = 0;
  for (let i = 0; i < 240; i++) {
    const gap = 2.4 + 2.4 * h01(seed + 17.9, i);
    if (evT + gap > t) break;
    evT += gap; beatAt = evT;
  }
  const u = t - beatAt;
  return {
    aimUp: held * holdLerp(HELD.aimUp, aimS),
    aimFore: held * holdLerp(HELD.aimFore, aimS),
    offUp: w * (holdLerp(HELD.offUp, offS) - HELD.offUp[0]),
    offFore: w * (holdLerp(HELD.offFore, offS) - HELD.offFore[0]),
    gaze: w * holdLerp(HELD.gaze, gazeS),
    beat: u < 0.5 ? held * Math.sin(Math.PI * Math.min(1, u / 0.5)) * Math.exp(-u * 1.6) : 0,
  };
}
