import React from 'react';

// =============================================================================
// HeldProp + propIdle(): THE HELD-OBJECT IDLE RIG (machine pass 2026-10-15)
//
// WHY THIS EXISTS. Five films in a row had a panel name a HELD PROP as frozen: boats, chair, phone,
// pencil and lens on 10-08 (1.3 to 2 percent change); pen, barge, news card and bench on 10-09 (0.6
// to 1.3); held beats again on 10-10 and 10-11; and on 10-15 the guide, the clinic box, the four
// dials and the condition plate at 1.9 to 3.4 percent, named by all three judges. Every run fixed
// it by hand with a one-off `Math.sin(f / k)` on each prop, and 10-15 added a whole-frame camera
// drift. The camera drift is why those beats measured 2 to 3 percent and still read frozen: moving
// the lens is not the object being alive, and motion_registered.json solves the camera out.
//
// Characters already get life for free (humanIdle() in Character). Props had nothing, so every
// scene had to remember. HeldProp gives any prop the same treatment by wrapping it:
//
//   <HeldProp f={f} px={540} py={1130} w={260} h={220} seed={3}>
//     <ClinicBox x={540} y={1130} ... />        // drawn exactly as before, same coordinates
//   </HeldProp>
//
// What it adds, all deterministic (no Math.random, so renders reproduce):
//   - a CONTINUOUS low rock about the prop's own pivot on two incommensurate periods, so frame 1
//     and frame 8 of any evidence strip differ on the prop itself, not just the camera;
//   - irregular SETTLE EVENTS (seeded 1.6 to 4.2 s apart): a small nudge that leaves fast,
//     overshoots once and arrives slow, the asymmetry humanIdle() uses for bodies;
//   - a SHEEN: a soft specular hotspot that crosses the prop's silhouette on each event, done as an
//     SVG lighting filter on the prop's own alpha, so it never paints outside the drawing and never
//     duplicates its text (a masked copy would put every <text> in the DOM twice for the text gates).
//
// kind sets the pivot: 'rest' (on a surface, rocks about its base centre), 'hang' (a plate or sign,
// swings about its top centre), 'float' (a token or card, bobs about its centre). gain 0 freezes it
// for a deliberate held-breath beat; stillness that is the point stays available.
//
// The rig moves the prop by a few pixels. It does not move a label off its art or a plate off its
// anchor by more than ~4 px at the default gain, which is inside every plate gate's tolerance, but
// wrap the prop AND the label it carries together so they stay locked.
// =============================================================================

export type HeldKind = 'rest' | 'hang' | 'float';

export interface PropIdle {
  /** px offsets */
  dx: number;
  dy: number;
  /** degrees about the pivot */
  rot: number;
  /** uniform scale multiplier about the pivot */
  scale: number;
  /** 0..1 progress of the current sheen pass across the silhouette, or -1 between passes */
  sheen: number;
}

/** Deterministic 0..1 from two numbers. */
function h01(a: number, b: number): number {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** 0 at u=0, exactly 1 at u=1: leaves fast, overshoots once, arrives slow (same law as humanIdle). */
function settle(u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const e = Math.exp(-4.2 * u) * Math.cos(5.6 * u);
  const e1 = Math.exp(-4.2) * Math.cos(5.6);
  return (1 - e) / (1 - e1);
}

const KIND_GAIN: Record<HeldKind, {rock: number; lift: number; breath: number}> = {
  rest: {rock: 0.9, lift: 1.2, breath: 0.007},
  hang: {rock: 1.6, lift: 0.4, breath: 0.004},
  float: {rock: 0.7, lift: 4.0, breath: 0.010},
};

export function propIdle(frame: number, seed = 0, gain = 1, kind: HeldKind = 'rest', fps = 30): PropIdle {
  const t = frame / fps;
  const s = seed * 2.399963 + 0.9;
  const k = KIND_GAIN[kind];

  // continuous: two incommensurate periods (about 2.3 s and 3.7 s), never re-phasing into a loop
  const a = Math.sin(t * 2.71 + s);
  const b = Math.sin(t * 1.69 + s * 1.37);
  let rot = k.rock * (0.75 * a + 0.45 * b);
  let dy = -k.lift * (0.6 * b + 0.4 * Math.sin(t * 4.3 + s * 0.7));
  let dx = 0.6 * k.lift * Math.sin(t * 1.13 + s * 2.1);

  // events: irregular settles, each with a sheen pass
  let sheen = -1;
  let evT = 0;
  for (let i = 0; i < 96; i++) {
    const gap = 1.6 + 2.6 * h01(s + 4.4, i);
    const start = evT + gap;
    if (start > t) break;
    evT = start;
    const u = (t - start) / 0.55;
    if (u < 1.6) {
      const dir = h01(s + 9.1, i) < 0.5 ? -1 : 1;
      const amp = 1.4 + 1.2 * h01(s + 2.3, i);
      // a nudge out and back: the settle curve up, then the same curve home
      const out = u < 0.5 ? settle(u / 0.5) : 1 - settle((u - 0.5) / 1.1);
      rot += dir * amp * k.rock * out;
      dy += -2.2 * k.lift * out;
    }
    const v = (t - start) / 0.8;
    if (v >= 0 && v <= 1) sheen = v;
  }
  const breath = 1 + k.breath * (0.6 * b + 0.4 * a);
  return {dx: gain * dx, dy: gain * dy, rot: gain * rot, scale: 1 + gain * (breath - 1), sheen: gain > 0 ? sheen : -1};
}

/**
 * Wrap a held prop. (px, py) is the pivot in the same coordinates the prop is drawn in; w and h are
 * the prop's rough size, used for the sheen's path. Children are drawn unchanged.
 */
export const HeldProp: React.FC<{
  f: number;
  px: number;
  py: number;
  w: number;
  h: number;
  seed?: number;
  gain?: number;
  kind?: HeldKind;
  /** sheen strength 0..1 (default 0.22); 0 turns the light pass off */
  sheen?: number;
  /** the key light side, so the hotspot travels away from it (default left, the house key) */
  keySide?: 'left' | 'right';
  children: React.ReactNode;
}> = ({f, px, py, w, h, seed = 0, gain = 1, kind = 'rest', sheen = 0.22, keySide = 'left', children}) => {
  const m = propIdle(f, seed, gain, kind);
  // centre of the drawing relative to the pivot, by kind
  const cy = kind === 'rest' ? py - h / 2 : kind === 'hang' ? py + h / 2 : py;
  const id = `heldsheen-${Math.round(px)}-${Math.round(py)}-${Math.round(seed * 100)}`;
  const on = sheen > 0 && m.sheen >= 0;
  const dir = keySide === 'left' ? 1 : -1;
  // the hotspot crosses from the key side to the far side and dips a little as it goes
  const lx = px - dir * w * 0.75 + dir * w * 1.5 * m.sheen;
  const ly = cy - h * 0.35 + h * 0.3 * m.sheen;
  const amt = on ? sheen * Math.sin(Math.PI * m.sheen) : 0;
  return (
    <g transform={`translate(${m.dx},${m.dy}) rotate(${m.rot},${px},${py}) translate(${px},${py}) scale(${m.scale}) translate(${-px},${-py})`}>
      {on && (
        <defs>
          <filter id={id} x={px - w} y={cy - h} width={w * 2} height={h * 2} filterUnits="userSpaceOnUse">
            <feGaussianBlur in="SourceAlpha" stdDeviation={Math.max(3, Math.min(w, h) * 0.04)} result="b" />
            <feSpecularLighting in="b" surfaceScale={1.5} specularConstant={0.9} specularExponent={48}
              lightingColor="#fff6e0" result="s">
              <fePointLight x={lx} y={ly} z={Math.max(w, h) * 0.9} />
            </feSpecularLighting>
            <feComposite in="s" in2="SourceAlpha" operator="in" result="sm" />
            <feComposite in="SourceGraphic" in2="sm" operator="arithmetic" k1={0} k2={1} k3={amt} k4={0} />
          </filter>
        </defs>
      )}
      <g filter={on ? `url(#${id})` : undefined}>{children}</g>
    </g>
  );
};
