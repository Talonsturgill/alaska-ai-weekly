import React from 'react';
import {spring, interpolate} from 'remotion';

// =============================================================================
// MOTION — the animation-principles layer (squash & stretch, anticipation,
// overshoot, secondary follow-through). Every judge pass on the first episodes
// said some version of "sprites scale but don't articulate; nothing follows
// through." This module fixes that at the KIT level so every element inherits
// real animation physics instead of a linear scale-in.
//
//   entrance()      one-call juiced entrance: anticipation dip -> overshoot ->
//                   settle, with volume-preserving squash/stretch and a vertical
//                   velocity you can feed straight into lighting.MotionBlur.
//   followThrough() damped oscillation for attached parts (flags, arms, tags,
//                   antennae) that keeps moving after the parent stops.
//   squashStretch() volume-preserving deformation from a velocity scalar.
//   accentKick()    a short punch (scale or rotation) at an exact frame — built
//                   for VO emphasis accents (see lib/voice.tsx).
//
// All pure functions of frame -> deterministic under Remotion's parallel render.
// =============================================================================

export type SpringPreset = {damping: number; stiffness: number; mass?: number};
export const POP: SpringPreset = {damping: 10, stiffness: 160};      // snappy UI pop
export const SNAP: SpringPreset = {damping: 14, stiffness: 220};     // hard smash-in
export const SETTLE: SpringPreset = {damping: 16, stiffness: 90};    // gentle ease

export interface Entrance {
  /** overall scale to apply (includes overshoot) */
  scale: number;
  /** volume-preserving deform: use transform scale(sx, sy) AFTER `scale` */
  sx: number;
  sy: number;
  /** vertical offset px (drop-in travel), 0 when settled */
  dy: number;
  /** per-frame vertical velocity px — feed to MotionBlur vy */
  vy: number;
  /** 0..1 progress (spring value, overshoots past 1) */
  t: number;
  /** true once visually present (skip rendering before to save nodes) */
  on: boolean;
}

/**
 * The one-call juiced entrance. Anticipation (small pre-dip), spring overshoot,
 * squash on arrival, stretch during fast travel, settle. Drop-in distance and
 * spring preset tunable. Usage:
 *   const e = entrance(f, fps, 20, {drop: 140});
 *   <MotionBlur vy={e.vy}><g transform={`translate(0,${e.dy}) scale(${e.scale})
 *     scale(${e.sx},${e.sy})`}>...</g></MotionBlur>
 */
export function entrance(
  frame: number, fps: number, delay: number,
  opts: {drop?: number; preset?: SpringPreset; anticipation?: boolean} = {},
): Entrance {
  const {drop = 0, preset = POP, anticipation = true} = opts;
  const f = frame - delay;
  if (f < -8) return {scale: 0, sx: 1, sy: 1, dy: drop, vy: 0, t: 0, on: false};
  // anticipation: tiny shrink in the 8 frames before launch (only when visible from 0)
  if (f < 0) {
    const a = anticipation ? interpolate(f, [-8, 0], [1, 0.92]) : 1;
    return {scale: drop > 0 ? 0 : a, sx: 1, sy: 1, dy: drop, vy: 0, t: 0, on: drop === 0};
  }
  const t = spring({frame: f, fps, config: preset});
  const tPrev = spring({frame: Math.max(0, f - 1), fps, config: preset});
  const dy = drop * (1 - t);
  const vy = drop * (t - tPrev); // px per frame of travel
  // squash/stretch from normalized velocity: stretch while moving, squash at impact
  const v = Math.min(1, Math.abs(vy) / 28);
  const impact = Math.max(0, t - 1); // overshoot amount = arrival energy
  const k = v * 0.18 - impact * 0.35; // + stretch in flight, - squash on overshoot
  const sy = 1 + k;
  const sx = 1 / Math.max(0.6, sy); // preserve area
  return {scale: Math.min(t, 1) + impact * 0.6, sx, sy, dy, vy, t, on: true};
}

/** Volume-preserving squash/stretch from a signed velocity scalar (px/frame). */
export function squashStretch(v: number, gain = 0.012): {sx: number; sy: number} {
  const k = Math.max(-0.3, Math.min(0.3, v * gain));
  const sy = 1 + k;
  return {sx: 1 / Math.max(0.7, sy), sy};
}

/**
 * Damped oscillation for SECONDARY MOTION: a part attached to something that
 * just moved keeps swinging and settles late. Returns an angle (deg) or offset
 * you multiply into a rotate/translate of the attached part.
 *   const swing = followThrough(f, fps, delay, {amp: 14});
 *   <g transform={`rotate(${swing} ${pivotX} ${pivotY})`}>flag</g>
 */
export function followThrough(
  frame: number, fps: number, delay: number,
  opts: {amp?: number; freq?: number; decay?: number} = {},
): number {
  const {amp = 12, freq = 2.6, decay = 2.2} = opts;
  const t = (frame - delay) / fps;
  if (t <= 0) return 0;
  return amp * Math.exp(-decay * t) * Math.sin(2 * Math.PI * freq * t);
}

/**
 * A short accent kick at an exact frame (for VO emphasis beats): rises fast,
 * decays over ~0.4s. Returns 0..1; scale/rotate/glow by it.
 */
export function accentKick(frame: number, fps: number, atFrame: number, dur = 0.42): number {
  const t = (frame - atFrame) / fps;
  if (t < 0 || t > dur) return 0;
  const up = Math.min(1, t / 0.06);
  const down = 1 - (t - 0.06) / (dur - 0.06);
  return Math.max(0, Math.min(up, down));
}

/** Continuous idle sway (breeze/breath) with per-instance phase, cheap + organic. */
export function idleSway(frame: number, phase = 0, amp = 2.5, period = 46): number {
  return amp * Math.sin((frame + phase * 13.7) / period * 2 * Math.PI)
    + amp * 0.4 * Math.sin((frame + phase * 7.3) / (period * 0.37) * 2 * Math.PI);
}

/** Soft drop shadow group for HUD chips so they sit IN the lit scene (manifest note). */
export const ChipShadow: React.FC<{dx?: number; dy?: number; opacity?: number; children: React.ReactNode}> = ({
  dx = 5, dy = 9, opacity = 0.28, children,
}) => (
  <g>
    <g transform={`translate(${dx},${dy})`} opacity={opacity} style={{filter: 'brightness(0)'} as any}>
      {children}
    </g>
    {children}
  </g>
);
