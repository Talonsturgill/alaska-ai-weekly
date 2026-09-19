/**
 * THE FORECAST GRAMMAR — how this engine draws A CLAIM ABOUT A TIME,
 * and how it draws that claim being CHECKED.
 * =============================================================================
 * CRAFT ADVANCE 2026-09-19 ("AURORA-AI", the Cordova islanded-grid dispatch).
 *
 * WHY THIS IS NOT simulation.tsx. That file already owns "how do you draw a thing
 * that is not real yet": a model, made of arithmetic, with a required `fidelity`.
 * It draws A MODEL OF A THING. This draws A CLAIM ABOUT A TIME, which is a
 * different claim and needs a different grammar, and the difference is the whole
 * argument of the film it was built for.
 *
 *   ABSENCE says:    this should be here and is not.
 *   SIMULATION says: this is here, it is exact, and it is made of arithmetic.
 *   FORECAST says:   this HAS NOT HAPPENED YET, and here is how wrong it might be.
 *
 * THE CONTRACT. Four clauses, each one a way this picture lies if you skip it.
 *
 *   1. NOW IS ALWAYS DRAWN. A forecast without a visible present is just a line.
 *      The component takes `now` and marks it, because everything the picture
 *      means depends on which side of that mark you are reading.
 *
 *   2. UNCERTAINTY WIDENS WITH DISTANCE, ALWAYS. A prediction drawn as a single
 *      confident stroke out to the horizon is a lie about forecasting itself, and
 *      it is the single most common chart crime in this subject. `spread` is
 *      REQUIRED and the cone it draws is monotonically widening. There is no prop
 *      to switch it off.
 *
 *   3. A FORECAST IS WORTH NOTHING UNTIL IT IS RECONCILED. `Reconcile` is the
 *      component that goes back and checks, and its `settled` prop starts at ZERO,
 *      where it draws an EMPTY slot with the error unmeasured. An unreconciled
 *      forecast must look unreconciled. On the film this was built for, that empty
 *      slot IS the honest counterpoint: the project starts in October and no
 *      prediction has been checked against anything yet.
 *
 *   4. THE PREDICTED SIDE NEVER CASTS AND NEVER CONTACTS, same as simulation.tsx.
 *      A cast shadow is the strongest cue that a thing is physically present, so
 *      the future does not get one. There is no prop for it.
 *
 * DETERMINISM: every wobble is an imul hash of (index, frame bucket, seed).
 * Never Math.random, so a re-render produces the identical frame.
 */
import React from 'react';
import {INK} from './lighting';

/** the cool blue of a stated future. Deliberately NOT simulation's acid green:
 *  the two appear together and a viewer has to be able to tell a model of a thing
 *  from a claim about a time. */
export const FCAST = '#7FD4FF';
export const FCAST_DEEP = '#2E6F99';
/** the amber of what actually happened. Observed and predicted must never share a hue. */
export const OBSERVED = '#FFB531';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** deterministic signed hash noise in -1..1 */
function wob(i: number, bucket: number, seed: number): number {
  let h = Math.imul(i + 1, 0x27d4eb2d) ^ Math.imul(bucket + 1, 0x165667b1) ^ Math.imul(seed + 1, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= h >>> 13;
  return ((h >>> 0) % 2000) / 1000 - 1;
}

export interface ForecastTraceProps {
  /** plotted left to right in the caller's own local coordinates */
  observed: Array<[number, number]>;
  /** continues where `observed` ends; the first point should be the last observed point */
  predicted: Array<[number, number]>;
  /**
   * REQUIRED. Half-width in px of the uncertainty cone AT THE FAR END of the
   * predicted run. Clause 2: it widens from zero at `now` to this at the horizon,
   * and there is no way to draw a prediction here without stating it.
   */
  spread: number;
  f: number;
  /** 0..1, how much of the predicted run has been drawn yet. Animate it. */
  drawn?: number;
  /** 0..1, how much of the observed run has been drawn yet. */
  observedDrawn?: number;
  x?: number;
  y?: number;
  scale?: number;
  phase?: number;
  strokeWidth?: number;
  /** label printed at the NOW mark. Keep it to a word or two. */
  nowLabel?: string;
}

const poly = (pts: Array<[number, number]>) =>
  pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(2)},${py.toFixed(2)}`).join(' ');

/** how many points of `pts` exist at progress t, as a path (never fewer than 2 once t>0) */
function partial(pts: Array<[number, number]>, t: number): string {
  if (pts.length < 2 || t <= 0) return '';
  const span = (pts.length - 1) * clamp01(t);
  const whole = Math.floor(span);
  const frac = span - whole;
  const out = pts.slice(0, whole + 1);
  if (frac > 0 && whole + 1 < pts.length) {
    const [ax, ay] = pts[whole];
    const [bx, by] = pts[whole + 1];
    out.push([ax + (bx - ax) * frac, ay + (by - ay) * frac]);
  }
  return out.length >= 2 ? poly(out) : '';
}

/**
 * An observed run in amber, continuing into a predicted run in blue, with NOW
 * marked between them and a widening uncertainty cone around the prediction.
 */
export const ForecastTrace: React.FC<ForecastTraceProps> = ({
  observed, predicted, spread, f, drawn = 1, observedDrawn = 1,
  x = 0, y = 0, scale = 1, phase = 0, strokeWidth = 5, nowLabel,
}) => {
  const uid = `fc${Math.round(x)}_${Math.round(y)}_${Math.round(phase * 97)}`;
  const dr = clamp01(drawn);
  const bucket = Math.floor(f / 6.7);

  // Clause 2. The cone is built from the predicted run itself, so it can never
  // drift off the line it is supposed to be describing.
  const upper: Array<[number, number]> = [];
  const lower: Array<[number, number]> = [];
  predicted.forEach(([px, py], i) => {
    const t = predicted.length > 1 ? i / (predicted.length - 1) : 0;
    // widening, and slightly super-linear because error compounds
    const w = spread * Math.pow(t, 1.35);
    // the cone edges hunt a little, so the picture reads as being computed
    const hunt = w * 0.12 * wob(i, bucket, 5);
    upper.push([px, py - w + hunt]);
    lower.push([px, py + w - hunt]);
  });
  const conePts = upper.concat(lower.slice().reverse());
  const coneD = conePts.length > 2 ? `${poly(conePts)} Z` : '';

  const nowPt = predicted.length ? predicted[0] : observed[observed.length - 1];

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${uid}cone`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={FCAST} stopOpacity={0.30} />
          <stop offset="1" stopColor={FCAST} stopOpacity={0.06} />
        </linearGradient>
        <clipPath id={`${uid}clip`}>
          {/* the cone is revealed left to right with the prediction, never before it */}
          <rect
            x={nowPt ? nowPt[0] - 2 : 0}
            y={-4000}
            width={Math.max(0, (predicted.length ? predicted[predicted.length - 1][0] - predicted[0][0] : 0) * dr) + 2}
            height={8000}
          />
        </clipPath>
      </defs>

      {coneD && (
        <g clipPath={`url(#${uid}clip)`}>
          <path d={coneD} fill={`url(#${uid}cone)`} stroke="none" />
          <path d={poly(upper)} fill="none" stroke={FCAST} strokeWidth={2} opacity={0.5} strokeDasharray="9 7" />
          <path d={poly(lower)} fill="none" stroke={FCAST} strokeWidth={2} opacity={0.5} strokeDasharray="9 7" />
        </g>
      )}

      {/* what actually happened: solid, confident, amber */}
      <path
        d={partial(observed, observedDrawn)}
        fill="none"
        stroke={OBSERVED}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* what is claimed: dashed, crawling, blue. Clause 4, no shadow and no contact. */}
      <path
        d={partial(predicted, dr)}
        fill="none"
        stroke={FCAST}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="15 11"
        strokeDashoffset={-(f * 1.1 + phase * 41) % 4000}
      />

      {/* Clause 1. NOW is always drawn. */}
      {nowPt && (
        <g>
          <path d={`M${nowPt[0]},${nowPt[1] - spread - 46} V${nowPt[1] + spread + 46}`} stroke={INK} strokeWidth={4} opacity={0.55} />
          <circle cx={nowPt[0]} cy={nowPt[1]} r={9} fill={OBSERVED} stroke={INK} strokeWidth={4} />
          {nowLabel && (
            <text
              x={nowPt[0]}
              y={nowPt[1] - spread - 58}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize={26}
              fontWeight={700}
              fill={INK}
            >
              {nowLabel}
            </text>
          )}
        </g>
      )}
    </g>
  );
};

export interface ReconcileProps {
  /** the value that was claimed */
  predicted: number;
  /** what actually happened. Ignored entirely while `settled` is 0. */
  actual: number;
  /**
   * REQUIRED, 0..1. Clause 3. At 0 this draws an EMPTY slot: the claim is on the
   * board and nothing has been checked against it. Animate toward 1 for the moment
   * the future arrives and the error becomes a measured number.
   */
  settled: number;
  f: number;
  x?: number;
  y?: number;
  scale?: number;
  /** what the numbers are, e.g. "GALLONS" — printed under the pair */
  unit?: string;
  /** printed in the empty slot while settled is 0 */
  pendingLabel?: string;
  /** rounds the printed values; 0 for integers */
  decimals?: number;
}

/**
 * THE RECONCILIATION. Two slots side by side, CLAIMED and MEASURED, and the gap
 * between them drawn as a bracket that only exists once the check has happened.
 *
 * This is the component that makes the grammar honest. A film may draw as many
 * confident forecasts as it likes, and this is the thing that asks whether anybody
 * went back and looked.
 */
export const Reconcile: React.FC<ReconcileProps> = ({
  predicted, actual, settled, f, x = 0, y = 0, scale = 1,
  unit, pendingLabel = 'NOT YET MEASURED', decimals = 0,
}) => {
  const s = clamp01(settled);
  const bucket = Math.floor(f / 6.7);
  const fmt = (v: number) => v.toFixed(decimals);
  // the measured value counts in as the check completes, and lands rather than slides
  const shown = predicted + (actual - predicted) * (s * s * (3 - 2 * s));
  const W = 210, H = 112, GAP = 42;

  const slot = (cx: number, label: string, body: React.ReactNode, dashed: boolean) => (
    <g>
      <rect
        x={cx - W / 2} y={-H / 2} width={W} height={H} rx={12}
        fill={dashed ? 'none' : '#FFFFFF'}
        stroke={dashed ? FCAST : INK}
        strokeWidth={dashed ? 3 : 5}
        strokeDasharray={dashed ? '12 9' : undefined}
        strokeDashoffset={dashed ? -(f * 0.8) % 4000 : undefined}
        opacity={dashed ? 0.85 : 1}
      />
      <text
        x={cx} y={-H / 2 - 16} textAnchor="middle"
        fontFamily="JetBrains Mono, monospace" fontSize={24} fontWeight={700} fill={INK}
      >
        {label}
      </text>
      {body}
    </g>
  );

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* CLAIMED. Always present, always the prediction blue, never solid. */}
      {slot(
        -(W + GAP) / 2,
        'CLAIMED',
        <text
          x={-(W + GAP) / 2}
          y={14}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize={52}
          fontWeight={800}
          fill={FCAST_DEEP}
        >
          {fmt(predicted)}
        </text>,
        true,
      )}

      {/* MEASURED. Clause 3: empty until somebody checks. */}
      {slot(
        (W + GAP) / 2,
        'MEASURED',
        s < 0.02 ? (
          <g>
            {/* an empty slot, with the hatching that means nothing is recorded here */}
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M${(W + GAP) / 2 - W / 2 + 14 + i * 42},${H / 2 - 12} l28,-${H - 24}`}
                stroke={INK}
                strokeWidth={3}
                opacity={0.16}
              />
            ))}
            <text
              x={(W + GAP) / 2}
              y={10}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize={21}
              fontWeight={700}
              fill={INK}
              opacity={0.62}
            >
              {pendingLabel}
            </text>
          </g>
        ) : (
          <text
            x={(W + GAP) / 2 + wob(3, bucket, 9) * (1 - s) * 5}
            y={14}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize={52}
            fontWeight={800}
            fill={OBSERVED}
          >
            {fmt(shown)}
          </text>
        ),
        false,
      )}

      {/* the error bracket only exists once the check has happened */}
      {s > 0.45 && (
        <g opacity={clamp01((s - 0.45) / 0.4)}>
          <path
            d={`M${-(W + GAP) / 2},${H / 2 + 22} V${H / 2 + 40} H${(W + GAP) / 2} V${H / 2 + 22}`}
            fill="none"
            stroke={INK}
            strokeWidth={4}
          />
          <text
            x={0} y={H / 2 + 76} textAnchor="middle"
            fontFamily="JetBrains Mono, monospace" fontSize={28} fontWeight={800} fill={INK}
          >
            {`ERROR ${fmt(Math.abs(actual - predicted))}${unit ? ' ' + unit : ''}`}
          </text>
        </g>
      )}

      {unit && s < 0.02 && (
        <text
          x={0} y={H / 2 + 44} textAnchor="middle"
          fontFamily="JetBrains Mono, monospace" fontSize={24} fontWeight={700} fill={INK} opacity={0.7}
        >
          {unit}
        </text>
      )}
    </g>
  );
};
