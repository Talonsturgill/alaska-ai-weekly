/**
 * FOCAL-PLANE DEPTH OF FIELD (craft advance, 2026-09-30).
 *
 * Every layered scene used to hand-set a blur per plane, so the blur never followed the
 * camera: a sheet the camera had not reached stayed as sharp as the one it was on. These
 * are pure functions of a plane's depth and the current focal depth, so any stacked or
 * Stage3D scene derives blur and value from the same two numbers. Pure on purpose: the
 * test seam (blurAt, valueLadder, passAlpha) needs no React and no frame.
 */

/** Gaussian blur radius in px for a plane at depth `z` when the focal plane sits at `focusZ`.
 *  Zero inside the `sharp` band, then grows linearly with the distance, capped at `max`. */
export const blurAt = (z: number, focusZ: number, aperture = 1.6, sharp = 0.35, max = 9, pinned = false): number => {
  if (pinned) return 0; // a pinned plane (the binder) is always in focus
  const d = Math.max(0, Math.abs(z - focusZ) - sharp);
  return Math.min(max, d * aperture);
};

/** Value (0 = darkest, 1 = brightest) for plane `i` of `n` on the enforced ladder: the top
 *  plane is brightest and the last is darkest, stepping evenly, so N planes never collapse
 *  into one mid grey. */
export const valueLadder = (i: number, n: number, top = 1.0, bottom = 0.62): number =>
  n <= 1 ? top : top + (bottom - top) * (i / (n - 1));

/** Opacity for a plane the camera is passing through. A plane is fully drawn while it is in
 *  front of the camera (d >= 0), and fades out over `span` as the camera goes through it. */
export const passAlpha = (d: number, span = 0.35): number =>
  d >= 0 ? 1 : Math.max(0, 1 + d / span);

/** Perspective scale for a plane `d` plane-spacings in front of the camera. d = 0 is the
 *  plane the camera is on (largest); larger d recedes toward the vanishing point. */
export const perspScale = (d: number, k = 0.34): number => 1 / (1 + k * Math.max(-0.6, d));
