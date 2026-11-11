import React from 'react';
import {humanIdle} from './motion';

// =============================================================================
// figureIdle + IdleFigure + strike + StrikeProp: A HELD FIGURE PERFORMS ON THE BEAT
// (engine advance, machine pass 2026-11-09)
//
// WHY THIS EXISTS. Held-figure motion is the panel's most repeated finding: Motion was the lowest
// axis on 10 of 15 judge cards from 10-28 to 11-09, and on 11-09 every seat scored it 6.5 to 6.8
// with 44 of 51 strips under 6 percent, camera solved out, writing "held figures show no weight
// shift" and "props slide rather than act". The shared rig (Character + humanIdle) has had a real
// weight shift since August, but no film since 10-24 drew a Character: every episode hand-rolls a
// flat `Person` in its own house style, and every one of those (Ep1106, Ep1109) animates with
// `1 + 0.014 * Math.sin(f / 16)`, a breathing balloon. And the shots that DID carry a rig carried a
// light sweep on a prop (HeldTravel), which lifts the measure and leaves the figure a statue.
//
// Two facts set the design:
//   1. Evidence strips are cut ON THE BEAT. build_evidence centres each 8-frame strip on the board
//      beat's time (start 0.13 s before it), and so does held_beat_check --source. humanIdle's
//      weight shifts land on a seeded schedule 2.6 to 8 s apart, so about one strip in eight
//      happens to catch one. A figure that PERFORMS on its beats (commits to the other hip, the
//      head follows late, the off arm lifts) is moving inside every strip a judge reads.
//   2. An episode keeps its own figure style. So this is a WRAPPER and a pose function, not a new
//      character: IdleFigure skews any figure about its own foot line (the feet stay planted, the
//      head travels), and a render-prop child receives the pose to move its own head and arms.
//
//   <IdleFigure f={f} x={540} footY={1180} h={300} seed={2} cues={[p.b(12), p.b(14)]}>
//     {(pose) => <Person x={540} y={1040} f={f} headX={pose.headX} armL={pose.armL} ... />}
//   </IdleFigure>
//   // or, with no hooks inside the figure, just wrap it:
//   <IdleFigure f={f} x={540} footY={1180} h={300} cues={beats}><Person ... /></IdleFigure>
//
// strike() is the other half of "props slide rather than act": a stamp, a gavel, a binder slap or a
// door that LANDS. Anticipation (it rises and stretches before contact), contact (it squashes wide
// and flat on the frame of impact) and settle (one overshoot, arriving slow). The strip around the
// contact frame therefore spans the whole drop and squash instead of a prop easing into place.
//
// Deterministic, no Math.random. gain={0} freezes the figure for a held-breath beat whose
// stillness is the point, and figure_rig_check accepts it as a decision.
// =============================================================================

export interface FigurePose {
  /** -1..1, which hip carries the weight now */
  weight: number;
  /** lateral travel of the head relative to the planted feet, in figure px (h = 300) */
  shift: number;
  /** degrees of lean, positive leans right */
  lean: number;
  /** px the body sinks as the hip drops */
  dip: number;
  /** vertical breath multiplier about the feet */
  breath: number;
  /** head offset in figure px, lagging the torso */
  headX: number;
  headY: number;
  /** head tilt in degrees */
  headRot: number;
  /** arm swing in degrees about each shoulder; the off arm lifts on a cue */
  armL: number;
  armR: number;
  blink: boolean;
  /** 0..1, how far into the current cue's performance the figure is (0 between cues) */
  perform: number;
}

function settle(u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const e = Math.exp(-4.2 * u) * Math.cos(5.6 * u);
  const e1 = Math.exp(-4.2) * Math.cos(5.6);
  return (1 - e) / (1 - e1);
}

function h01(a: number, b: number): number {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** frames the performance starts before the cue, so the strip (cue-4 .. cue+3) sees it travel */
export const CUE_LEAD = 5;
/** frames a performed weight commit takes to land */
export const CUE_DUR = 14;

/**
 * The pose of a held figure at frame f. `cues` are frames (the beats the figure plays to, usually
 * `p.b(id)` for each beat it is on screen for). Without cues it is humanIdle's schedule, which is
 * already better than a sine; with cues the figure commits to the other hip on every beat.
 */
export function figureIdle(f: number, seed = 0, gain = 1, cues: number[] = [], fps = 30): FigurePose {
  const base = humanIdle(f, seed, gain, fps);
  const s = seed * 2.399963 + 0.7;
  const sorted = cues.filter((c) => Number.isFinite(c)).slice().sort((a, b) => a - b);
  let weight = base.weight;
  let perform = 0;
  let headTurn = 0;
  let armLift = 0;
  if (sorted.length && gain > 0) {
    // Each cue commits to a hip. Alternate, starting from a seeded side, and never re-pick the
    // hip the figure is already on, so every cue is a visible move.
    let prev = h01(s, 1) < 0.5 ? -0.6 : 0.6;
    let cur = prev;
    let start = -1e9;
    let k = -1;
    for (let i = 0; i < sorted.length; i++) {
      const t0 = sorted[i] - CUE_LEAD;
      if (t0 > f) break;
      prev = cur;
      cur = -Math.sign(prev || 1) * (0.75 + 0.25 * h01(s + 3.1, i));
      start = t0;
      k = i;
    }
    const u = (f - start) / CUE_DUR;
    const committed = prev + (cur - prev) * settle(u);
    // the cue owns the hip; humanIdle's own schedule rides on top at a third, so long holds
    // between beats still breathe and drift like a person, not a held pose
    weight = 0.85 * committed + 0.35 * base.weight;
    if (k >= 0 && u >= 0 && u < 2.2) {
      perform = u < 1 ? settle(u) : Math.max(0, 1 - (u - 1) / 1.2);
      // the head answers late (0.1 s) and overshoots a turn toward the new hip, then eases back
      const uh = (f - start - 3) / CUE_DUR;
      const turn = uh <= 0 ? 0 : uh < 1 ? Math.sin(Math.PI * settle(uh)) : 0;
      headTurn = Math.sign(cur) * turn;
      // the off arm (the side the weight left) lifts and falls: a hand to a hip, a small gesture
      armLift = Math.sin(Math.PI * Math.min(1, Math.max(0, u / 1.6)));
    }
  }
  const g = gain;
  const shift = g * 13 * weight;
  const lean = g * 3.2 * weight;
  const dip = g * 2.4 * Math.abs(weight) - base.bob;
  const off = weight >= 0 ? -1 : 1;
  return {
    weight,
    shift,
    lean,
    dip,
    breath: base.breath,
    headX: base.headX + g * 7 * headTurn,
    headY: base.headY - g * 1.5 * Math.abs(headTurn),
    headRot: g * (1.6 * weight + 6 * headTurn),
    armL: g * (2.5 * weight + (off < 0 ? 16 : 4) * armLift),
    armR: g * (-2.5 * weight - (off > 0 ? 16 : 4) * armLift),
    blink: base.blink,
    perform,
  };
}

/** SVG transform for a head drawn about its own neck point (cx, cy), from a pose. */
export function headTransform(p: FigurePose, cx: number, cy: number, scale = 1): string {
  return `translate(${p.headX * scale} ${p.headY * scale}) rotate(${p.headRot} ${cx} ${cy})`;
}

/**
 * Wrap any figure. (x, footY) is the middle of the foot line in the coordinates the figure is drawn
 * in, h its drawn height there. The feet stay planted: the body skews over them, sinks a little as
 * the hip drops and breathes from the floor up. A function child receives the pose for head and arms.
 */
export const IdleFigure: React.FC<{
  f: number;
  x: number;
  footY: number;
  /** drawn height of the figure in the parent's px (default 300) */
  h?: number;
  seed?: number;
  gain?: number;
  /** frames the figure performs on, usually p.b(id) for its beats */
  cues?: number[];
  children: React.ReactNode | ((pose: FigurePose) => React.ReactNode);
}> = ({f, x, footY, h = 300, seed = 0, gain = 1, cues = [], children}) => {
  const pose = figureIdle(f, seed, gain, cues);
  const k = h / 300;
  const skew = (Math.atan2(pose.shift * k, h) * 180) / Math.PI + pose.lean * 0.35;
  const tf = `translate(${x} ${footY}) skewX(${skew}) scale(1 ${pose.breath}) translate(0 ${pose.dip * k}) translate(${-x} ${-footY})`;
  return <g transform={tf}>{typeof children === 'function' ? (children as (p: FigurePose) => React.ReactNode)(pose) : children}</g>;
};

export interface StrikeState {
  /** px offset along the strike axis (negative is up, away from the surface) */
  dy: number;
  /** scale about the contact point */
  sx: number;
  sy: number;
  /** degrees of wobble */
  rot: number;
  /** 0..1 contact flash, peaks on the impact frame and dies in ~6 frames (an ink spread, dust) */
  hit: number;
  /** 0 before the strike begins, 1 once it has landed and settled */
  landed: number;
}

/**
 * A prop that lands on frame `at`. `lift` is how high it rises in anticipation (px), `windup` the
 * frames it spends rising, `squash` the contact squash (0.14 = 14 percent flatter). Several strikes:
 * pass an array; the state is the most recent strike that has begun.
 */
export function strike(f: number, at: number | number[], lift = 70, windup = 9, squash = 0.14, settleFrames = 14): StrikeState {
  const ats = (Array.isArray(at) ? at : [at]).filter((a) => Number.isFinite(a)).sort((a, b) => a - b);
  let a = ats[0] ?? 0;
  for (const x of ats) if (x - windup <= f) a = x;
  const t = f - a;
  if (t < -windup) return {dy: 0, sx: 1, sy: 1, rot: 0, hit: 0, landed: 0};
  if (t < 0) {
    // anticipation: rise slow, hang, then the fast drop of the last third
    const u = (t + windup) / windup;
    const rise = u < 0.66 ? Math.sin((Math.PI / 2) * (u / 0.66)) : 1 - Math.pow((u - 0.66) / 0.34, 2);
    return {dy: -lift * rise, sx: 1 - 0.04 * rise, sy: 1 + 0.08 * rise, rot: -2.5 * rise, hit: 0, landed: 0};
  }
  // contact and settle: squash on the impact frame, one overshoot, arrive slow
  const u = Math.min(1, t / settleFrames);
  const ring = Math.exp(-5 * u) * Math.cos(9 * u);
  return {
    dy: -3 * Math.max(0, Math.sin(Math.PI * Math.min(1, t / 5))) * (1 - u),
    sx: 1 + squash * 0.7 * ring,
    sy: 1 - squash * ring,
    rot: 1.5 * ring,
    hit: Math.max(0, 1 - t / 6),
    landed: u >= 1 ? 1 : u,
  };
}

/** Wrap a striking prop. (px, py) is its contact point (a stamp's face, a gavel's head) in its own coordinates. */
export const StrikeProp: React.FC<{
  f: number;
  at: number | number[];
  px: number;
  py: number;
  lift?: number;
  windup?: number;
  squash?: number;
  children: React.ReactNode;
}> = ({f, at, px, py, lift = 70, windup = 9, squash = 0.14, children}) => {
  const s = strike(f, at, lift, windup, squash);
  return (
    <g transform={`translate(0 ${s.dy}) rotate(${s.rot} ${px} ${py}) translate(${px} ${py}) scale(${s.sx} ${s.sy}) translate(${-px} ${-py})`}>
      {children}
    </g>
  );
};

// =============================================================================
// FigureFinish: A HAND-ROLLED FIGURE GETS THE PROPS' LIGHT (engine advance, machine pass 2026-11-11)
//
// WHY THIS EXISTS. "Figures plainer than props" is the panel's standing illustration finding: named
// on 11-06 ("humans below prop finish"), 11-07, 11-10 ("character finish lags the props", three
// seats) and 11-11 ("figures, trees and road flat fills", "parka figure plainer than props", every
// round), with Illustration craft 6.5 to 7.0. The props carry a key light, a rim and a contact
// shadow because each episode's asset kit drew them; every episode's `Person` is a flat fill with an
// outline, so the cast reads a finish level below the set. This wraps ANY figure (drawn unchanged,
// same coordinates, like IdleFigure) and lights it from the house key through an SVG filter on the
// figure's own alpha, so it never paints outside the drawing and never duplicates a <text>:
//   - a RIM: a thin warm band just inside the outline on the key side (`outline` sets the inset);
//   - a CORE SHADE: a soft dark falloff across the far side, so a flat torso turns into a form;
//   - a CONTACT SHADOW: a soft ellipse on the floor under the feet, drawn behind the figure.
//
//   <FigureFinish x={540} footY={1180} w={200} h={300}>
//     <IdleFigure f={f} x={540} footY={1180} h={300} cues={beats}>{(pose) => <Person ... />}</IdleFigure>
//   </FigureFinish>
//
// keySide is the house key (left) unless the scene's light is on the right. rim and shade are
// strengths 0..1 (defaults 0.7 and 0.42); contact 0 drops the floor shadow for a figure that is
// already standing in one. Deterministic, no hooks, no Math.random.
// =============================================================================

export const FigureFinish: React.FC<{
  /** foot line centre and drawn size of the figure, in the parent's px */
  x: number;
  footY: number;
  w: number;
  h: number;
  keySide?: 'left' | 'right';
  rim?: number;
  shade?: number;
  contact?: number;
  rimColor?: string;
  shadeColor?: string;
  /** the figure's outline width in the parent's px; the rim sits just inside it (default w * 0.05) */
  outline?: number;
  children: React.ReactNode;
}> = ({x, footY, w, h, keySide = 'left', rim = 0.7, shade = 0.42, contact = 0.5, rimColor = '#FFE7B8', shadeColor = '#0E0A16', outline, children}) => {
  const dir = keySide === 'left' ? 1 : -1;
  const inset = outline ?? Math.max(2, w * 0.05);
  const rimW = Math.max(3, Math.min(9, w * 0.03));
  const coreW = Math.max(12, w * 0.32);
  const id = `figfinish-${Math.round(x)}-${Math.round(footY)}-${Math.round(w)}`;
  const pad = Math.max(w, h) * 0.2;
  return (
    <g>
      {contact > 0 && (
        <g style={{pointerEvents: 'none'}}>
          <ellipse cx={x + dir * w * 0.12} cy={footY + 2} rx={w * 0.62} ry={Math.max(6, w * 0.07)} fill={shadeColor} opacity={0.22 * contact} />
          <ellipse cx={x + dir * w * 0.05} cy={footY + 1} rx={w * 0.38} ry={Math.max(4, w * 0.04)} fill={shadeColor} opacity={0.45 * contact} />
        </g>
      )}
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x={x - w / 2 - pad} y={footY - h - pad} width={w + 2 * pad} height={h + 2 * pad} colorInterpolationFilters="sRGB">
          {/* key-side rim: a thin band just INSIDE the outline on the key side, never outside the drawing.
              band = (alpha out alpha shifted inset+rimW away from the key) out (alpha out alpha shifted inset) */}
          <feOffset in="SourceAlpha" dx={dir * inset} dy={inset * 0.5} result="inShift" />
          <feComposite in="SourceAlpha" in2="inShift" operator="out" result="inEdge" />
          <feOffset in="SourceAlpha" dx={dir * (inset + rimW)} dy={(inset + rimW) * 0.5} result="rimShift" />
          <feComposite in="SourceAlpha" in2="rimShift" operator="out" result="outEdge" />
          <feComposite in="outEdge" in2="inEdge" operator="out" result="rimBand" />
          <feGaussianBlur in="rimBand" stdDeviation={0.8} result="rimBlur" />
          <feComposite in="rimBlur" in2="SourceAlpha" operator="in" result="rimSoft" />
          <feFlood floodColor={rimColor} floodOpacity={rim} />
          <feComposite in2="rimSoft" operator="in" result="rimLit" />
          {/* far side: the silhouette minus itself shifted toward the key, blurred into a falloff */}
          <feOffset in="SourceAlpha" dx={-dir * coreW} dy={0} result="coreShift" />
          <feComposite in="SourceAlpha" in2="coreShift" operator="out" result="coreBand" />
          <feGaussianBlur in="coreBand" stdDeviation={coreW * 0.45} result="coreSoft" />
          <feComposite in="coreSoft" in2="SourceAlpha" operator="in" result="coreClip" />
          <feFlood floodColor={shadeColor} floodOpacity={shade} />
          <feComposite in2="coreClip" operator="in" result="coreDark" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="coreDark" />
            <feMergeNode in="rimLit" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{children}</g>
    </g>
  );
};
