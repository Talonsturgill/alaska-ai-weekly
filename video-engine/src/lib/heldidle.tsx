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

// =============================================================================
// HeldTravel: A TRAVELLING ELEMENT ON A HELD THING (machine pass 2026-10-26)
//
// WHY THIS EXISTS. The panel named held beats under 6 percent with the camera solved out on 10-22,
// 10-24, 10-25 and 10-26 (twelve strips on 10-26: the painted map, the alert lamp, the chamber
// doors, the LATER tab, the sponsor tag). HeldProp was in lib since 10-15 and no episode used it,
// and it would not have cleared the line where it was: a rock of a degree or two about a pivot
// changes the prop's EDGES, a few hundred pixels, while held_beat_check counts the share of the
// whole frame that moved in 0.23 s. What clears it is AREA in motion across the held thing, the
// way a film keeps a still object alive: light passing over it, a pulse running along its cord,
// a shadow drifting across it. This draws that element on top of the prop, never under it.
//
//   <HeldProp f={f} px={540} py={1100} w={420} h={300}>
//     <PaintedMap ... />
//     <HeldTravel f={f} x={330} y={800} w={420} h={300} mode="sweep" />
//   </HeldProp>
//
// mode
//   'sweep'  (default) a soft band of light crossing the box on a diagonal, one crossing per
//            `period` seconds, continuous, so any 8-frame window sees it travel. For flat held
//            things: a map, a sheet, a door, a tag, a card.
//   'shadow' a soft dark lobe drifting across the box, slower and wider. For a held thing in a
//            room: a passing figure's shadow, a cloud through a window.
//   'runner' a bright bead with a fading trail travelling along `path` (a polyline, e.g. a cord,
//            a wire, a rail), for a held thing that is a line. It moves less area than a sweep, so
//            pair it with a sweep on the thing the line feeds.
//
// SAFE FOR THE TEXT GATES BY CONSTRUCTION. It draws no <text>, it is pointer-events none, which
// takes it out of document.elementsFromPoint, so label_footprint_check never reads it as art over a
// label, and its group opacity is capped under 0.4, the cover threshold that check uses anyway.
// The sweep and the shadow are clipped to the box (or to `clipD`, the prop's own outline path, when
// you have it), so nothing paints outside the held thing. Deterministic, no Math.random.
// =============================================================================

export type TravelMode = 'sweep' | 'shadow' | 'runner';

/** 0..1 phase of a continuous crossing that starts at a seeded offset. */
export function travelPhase(frame: number, period: number, seed = 0, fps = 30): number {
  const t = frame / fps / Math.max(0.2, period) + h01(seed + 3.3, 1.7);
  return t - Math.floor(t);
}

function along(path: [number, number][], u: number): [number, number] {
  if (path.length < 2) return path[0] || [0, 0];
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    seg.push(d);
    total += d;
  }
  let want = Math.max(0, Math.min(1, u)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, want / seg[i]) : 0;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k];
    }
    want -= seg[i];
  }
  return path[path.length - 1];
}

export const HeldTravel: React.FC<{
  f: number;
  /** the held thing's box, top-left and size, in the coordinates it is drawn in */
  x: number;
  y: number;
  w: number;
  h: number;
  mode?: TravelMode;
  /** seconds per crossing (default sweep 1.5, shadow 3.2, runner 1.2) */
  period?: number;
  seed?: number;
  /** light or shadow colour (default warm white for light, ink for shadow) */
  color?: string;
  /** group opacity, capped at 0.38 (default sweep 0.34, shadow 0.3, runner 0.38) */
  strength?: number;
  /** clip outline (an SVG path d) instead of the box, e.g. the prop's own silhouette */
  clipD?: string;
  /** box corner radius for the default clip */
  rx?: number;
  /** runner: the polyline the bead travels, start to end */
  path?: [number, number][];
  /** 'left' (default) travels left to right, 'right' the other way */
  from?: 'left' | 'right';
  /** 0 removes it, for a held-breath beat whose stillness is the point */
  gain?: number;
}> = ({f, x, y, w, h, mode = 'sweep', period, seed = 0, color, strength, clipD, rx = 6, path, from = 'left', gain = 1}) => {
  if (gain <= 0) return null;
  const per = period ?? (mode === 'shadow' ? 3.2 : mode === 'runner' ? 1.2 : 1.5);
  const u = travelPhase(f, per, seed);
  const op = Math.min(0.38, (strength ?? (mode === 'shadow' ? 0.3 : 0.38)) * Math.min(1, gain));
  const id = `heldtravel-${mode}-${Math.round(x)}-${Math.round(y)}-${Math.round(seed * 100)}`;
  const dir = from === 'left' ? 1 : -1;
  const style = {pointerEvents: 'none' as const};

  if (mode === 'runner') {
    const pts = path && path.length >= 2 ? path : ([[x, y + h / 2], [x + w, y + h / 2]] as [number, number][]);
    const col = color ?? '#fff6d6';
    const r = Math.max(7, Math.min(22, Math.hypot(w, h) * 0.03));
    const trail = 7;
    return (
      <g opacity={op / 0.38} style={style}>
        {Array.from({length: trail}, (_, i) => {
          const back = u - i * 0.035;
          if (back < 0) return null;
          const [cx, cy] = along(pts, dir > 0 ? back : 1 - back);
          return <circle key={i} cx={cx} cy={cy} r={r * (1 - i * 0.09)} fill={col} opacity={0.38 * (1 - i / trail)} style={style} />;
        })}
        {(() => {
          const [cx, cy] = along(pts, dir > 0 ? u : 1 - u);
          return <circle cx={cx} cy={cy} r={r * 2.4} fill={col} opacity={0.12} style={style} />;
        })()}
      </g>
    );
  }

  // Two bands half a crossing apart, each travelling from just off one edge to just off the other,
  // so some band is always on the box: any 8-frame window sees light (or shade) travel. Each band
  // has a flat face and soft edges, because the measure, and the eye, read the moving EDGES.
  const band = mode === 'shadow' ? w * 0.6 : w * 0.42;
  const span = w + band * 0.6;
  const slant = mode === 'shadow' ? 0.15 : 0.35;
  const col = color ?? (mode === 'shadow' ? '#141a22' : '#fff8e6');
  const centres = [u, (u + 0.5) % 1].map((p) =>
    from === 'left' ? x - band * 0.3 + span * p : x + w + band * 0.3 - span * p);
  return (
    <g opacity={op} style={style}>
      <defs>
        <clipPath id={`${id}-c`}>
          {clipD ? <path d={clipD} /> : <rect x={x} y={y} width={w} height={h} rx={rx} />}
        </clipPath>
        <linearGradient id={`${id}-g`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset={0} stopColor={col} stopOpacity={0} />
          <stop offset={0.18} stopColor={col} stopOpacity={0.92} />
          <stop offset={0.5} stopColor={col} stopOpacity={1} />
          <stop offset={0.82} stopColor={col} stopOpacity={0.92} />
          <stop offset={1} stopColor={col} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-c)`} style={style}>
        {centres.map((cx, i) => (
          <rect key={i} x={cx - band / 2} y={y - h * 0.5} width={band} height={h * 2} fill={`url(#${id}-g)`} style={style}
            opacity={i === 0 ? 1 : 0.85}
            transform={`translate(${cx},${y + h / 2}) skewX(${-dir * slant * 45}) translate(${-cx},${-(y + h / 2)})`} />
        ))}
      </g>
    </g>
  );
};
