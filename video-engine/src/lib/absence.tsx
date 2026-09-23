import React from 'react';

// =============================================================================
// ABSENCE — the library's grammar for A THING THAT IS NOT THERE.
// CRAFT ADVANCE 2026-08-05 ("The Net Comes First").
//
// WHY THIS IS A SYSTEM AND NOT A PROP. This shelf has paid for the same lesson
// twice and solved it once, inline, for one animal:
//
//   2026-07-26  records.tsx ThreePipeCutaway drew a capped pipe meaning "no
//               record comes back". TWO panel judges found it did not read as
//               an absence at sampled frames. The manifest still carries that
//               as a live known weakness.
//   2026-07-30  underice.tsx RingedSealGhost solved it properly for a seal:
//               a DASHED contour (a solid outline reads as a style choice, a
//               dashed one reads as not filled in), a TRUE VOID interior with
//               no hatch, and a CALLER-SUPPLIED LABEL so the absence is named
//               rather than inferred.
//
// That solution was correct and it was welded to one species. Any later film
// needing to draw a thing that is not there had to re-improvise it, which is
// exactly how the 07-26 weakness stayed open. So it is generalised here.
//
// THE FOURTH THING, added by this run. The three rules above make an absence
// read as unfilled. They do not stop it reading as UNFINISHED, which is the
// specific way the ThreePipeCutaway failed: a static dashed outline in a world
// of form-shaded solids looks like an asset that did not render. The fix is
// MOTION THAT ONLY AN ABSENCE HAS. The dash phase crawls, and the interior
// carries a slow sparse drift going nowhere. A solid never does that, so the
// eye reads "this one is a different KIND of thing" rather than "this one is
// broken".
//
// The label is a REQUIRED prop, not an optional one. That is deliberate and it
// is the whole 07-30 lesson: an unlabelled absence is indistinguishable from an
// oversight, and a caller who has to type the label has to decide what the
// missing thing IS.
// =============================================================================

const hash = (s: string) => Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
const uid = (s: string) => 'ab' + hash(s).toString(36);

/** the void is never pure black: it is the page showing through, one step down */
export const VOID_TINT = 'rgba(16,26,23,0.10)';

export interface UnnamedProps {
  /** the silhouette, as an SVG path in the caller's own local coordinates */
  d: string;
  /** REQUIRED. What is missing. An unlabelled absence reads as an oversight. */
  label: string;
  f: number;
  x?: number;
  y?: number;
  scale?: number;
  /** contour colour. Defaults to the ink of the world it sits in. */
  color?: string;
  /** 0 = fully dashed (an absence), 1 = solid (a normal outline). Animate it to FILL IN. */
  solid?: number;
  /** 0..1 how much the interior drifts. 0 gives a dead hole, which is the failure mode. */
  drift?: number;
  /** decorrelates the dash crawl and the drift between instances */
  phase?: number;
  /** where the label sits relative to the form's own box */
  labelSide?: 'below' | 'above' | 'right';
  labelSize?: number;
  /** bounding width of the path, so the label can centre itself without measuring */
  wide?: number;
  /** bounding height, for below/above placement */
  tall?: number;
  strokeWidth?: number;
}

/**
 * Render ANY silhouette as a STATED ABSENCE.
 *
 * The contract, and every clause of it is a defect somebody already found:
 *   1. DASHED, never solid, and the dash phase CRAWLS.
 *   2. TRUE VOID interior. No hatch, no fill, no tint beyond the faintest
 *      page-through, because a hatched absence reads as a material.
 *   3. A DRIFT inside the void, slow and sparse and going nowhere.
 *   4. A LABEL, always, supplied by the caller.
 */
export const Unnamed: React.FC<UnnamedProps> = ({
  d, label, f, x = 0, y = 0, scale = 1, color = '#101A17',
  solid = 0, drift = 1, phase = 0, labelSide = 'below', labelSize = 22,
  wide = 200, tall = 120, strokeWidth = 3,
}) => {
  const id = uid(`${label}${x}${y}`);
  // The dash crawl is deliberately on an irrational period against the drift so
  // the two never re-phase and the form never reads as a loop.
  const crawl = -(f * 0.55 + phase * 37) % 1000;
  // solid=1 collapses the gap to zero, so the SAME path can animate from an
  // absence into a filled outline without swapping components mid-shot.
  const dashOn = 11 + solid * 40;
  const dashOff = Math.max(0, 9 * (1 - solid));

  // Three interior motes on coprime-ish periods. They are the only thing inside.
  const motes = [0, 1, 2].map((i) => {
    const p = phase * 1.7 + i * 2.3;
    return {
      cx: Math.sin(f / (61 + i * 13) + p) * wide * 0.22,
      cy: Math.cos(f / (73 + i * 11) + p * 1.4) * tall * 0.18,
      r: 2.2 + i * 0.5,
      o: (0.28 - i * 0.06) * drift,
    };
  });

  const labelY = labelSide === 'below' ? tall * 0.5 + labelSize + 10
    : labelSide === 'above' ? -(tall * 0.5 + 12) : 0;
  const labelX = labelSide === 'right' ? wide * 0.5 + 14 : 0;
  const anchor = labelSide === 'right' ? 'start' : 'middle';

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={d} />
        </clipPath>
      </defs>

      {/* 2. the interior is a TRUE VOID. This is the page showing through, not a fill. */}
      <path d={d} fill={VOID_TINT} />

      {/* 3. the drift. Without this the void is a dead hole and reads as unrendered. */}
      {drift > 0 && (
        <g clipPath={`url(#${id}-clip)`}>
          {motes.map((m, i) => (
            <circle key={i} cx={m.cx} cy={m.cy} r={m.r} fill={color} opacity={m.o} />
          ))}
        </g>
      )}

      {/* 1. the DASHED contour, crawling */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={`${dashOn} ${dashOff}`}
        strokeDashoffset={crawl}
        opacity={0.86}
      />

      {/* 4. the LABEL. Required, so the absence is named rather than inferred. */}
      <text
        x={labelX}
        y={labelY}
        textAnchor={anchor}
        fill={color}
        opacity={0.8}
        style={{font: `700 ${labelSize}px "JetBrains Mono", ui-monospace, monospace`, letterSpacing: 1}}
      >
        {label}
      </text>
    </g>
  );
};

/**
 * A FIELD of absences, for the beat where the missing thing is a POPULATION
 * rather than one item.
 *
 * Deterministic imul-free hash scatter, never Math.random, so the field is
 * identical on every frame and every re-render. The whole point of the shot it
 * was built for is that the field runs off the top of frame, so `rows` is
 * allowed to overflow the box on purpose.
 */
export const UnnamedField: React.FC<{
  d: string;
  f: number;
  count: number;
  x: number;
  y: number;
  w: number;
  h: number;
  cell?: number;
  color?: string;
  scale?: number;
  /** 0..1, how many of them have resolved into named solids (from the left) */
  resolved?: number;
}> = ({d, f, count, x, y, w, h, cell = 86, color = '#101A17', scale = 0.34, resolved = 0}) => {
  const cols = Math.max(1, Math.floor(w / cell));
  const items = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const j = hash(`f${i}`);
    const jx = ((j % 17) - 8) * 0.9;
    const jy = ((Math.floor(j / 17) % 17) - 8) * 0.9;
    const isSolid = i / count < resolved;
    items.push(
      <g key={i} transform={`translate(${c * cell + jx},${r * cell + jy}) scale(${scale})`}>
        <path
          d={d}
          fill={isSolid ? color : VOID_TINT}
          stroke={color}
          strokeWidth={isSolid ? 6 : 11}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={isSolid ? undefined : '30 24'}
          strokeDashoffset={isSolid ? undefined : -(f * 0.5 + i * 13) % 1000}
          opacity={isSolid ? 0.95 : 0.88}
        />
      </g>,
    );
  }
  return <g transform={`translate(${x},${y})`} clipPath={undefined}>{items}</g>;
};

// =============================================================================
// CRAFT ADVANCE 2026-09-23 ("One Variable") — A MISSING *VALUE*.
//
// Everything above draws a missing OBJECT: a silhouette that is not filled in.
// That is the right grammar for "the seal that was not there" and the wrong one
// for "the row on the form that was never filled in", which is the image this
// film is built on.
//
// The difference is not cosmetic. A dashed outline drawn AROUND empty space
// reads as a BOX, and a box is a thing. A viewer sees an empty container and
// concludes the container is the subject. What an unanswered field actually
// looks like is a RULE with nothing sitting on it: the baseline is there,
// waiting, and the value never arrives. So the dash goes on the BASELINE, not
// around the slot, and the eye reads "this was meant to be written on" instead
// of "here is an empty rectangle".
//
// The four clauses of the Unnamed contract carry over unchanged, and each is
// still a defect somebody already found:
//   (1) DASHED and CRAWLING, because a solid rule reads as a design choice.
//   (2) A TRUE VOID above the rule. No hatch, no fill, no placeholder glyph.
//       A placeholder ("--", "TBD", "N/A") is an ANSWER and this is not one.
//   (3) A slow sparse DRIFT in the slot, so it cannot read as unrendered.
//   (4) A REQUIRED label, because an unlabelled blank is indistinguishable
//       from an oversight, and a caller who has to name it has to decide what
//       is missing.
//
// `solid` 0..1 resolves the SAME row into a filled one without swapping
// components mid-shot, which is what lets a film show a value arriving.
// =============================================================================

export interface UnnamedValueProps {
  /** REQUIRED. The field name. An unlabelled blank reads as an oversight. */
  label: string;
  f: number;
  x?: number;
  y?: number;
  /** total row width, label plus slot */
  w?: number;
  /** the value that WOULD go here, revealed as `solid` rises. Omit for never. */
  value?: string;
  /** 0 = unanswered (dashed crawling baseline, void slot), 1 = filled */
  solid?: number;
  /** fraction of the row width given to the label column */
  labelFrac?: number;
  color?: string;
  paper?: string;
  size?: number;
  /** decorrelates the crawl and drift between rows */
  phase?: number;
  /** 0..1 how much the void drifts. 0 gives a dead slot, the failure mode. */
  drift?: number;
}

/** A ruled data row whose VALUE was never supplied. */
export const UnnamedValue: React.FC<UnnamedValueProps> = ({
  label, f, x = 0, y = 0, w = 520, value, solid = 0, labelFrac = 0.52,
  color = '#1F3A5F', paper = '#EDE7DB', size = 30, phase = 0, drift = 1,
}) => {
  const uidv = uid(`uv${label}${x}${y}`);
  const labW = w * labelFrac;
  const slotX = labW + 18;
  const slotW = w - slotX;
  const base = 0;                       // the baseline sits at local y = 0
  const crawl = -((f * 0.55 + phase * 37) % 1000);
  // the slot's clear height above the rule, where a value would sit
  const clear = size * 1.15;

  // three drifting motes, deterministic, never Math.random
  const motes = drift > 0 ? [0, 1, 2].map((i) => {
    const h = hash(`${label}${i}`);
    const px = (h % 100) / 100;
    const sp = 0.10 + ((h >>> 5) % 7) / 90;
    const t = (f * sp + phase * 11 + i * 37) % 100;
    return {
      cx: slotX + 10 + px * Math.max(8, slotW - 20),
      cy: base - 6 - ((t / 100) * (clear - 10)),
      o: 0.20 * (1 - Math.abs(t / 50 - 1)),
      r: 1.6 + ((h >>> 9) % 3) * 0.5,
    };
  }) : [];

  return (
    <g transform={`translate(${x},${y})`}>
      {/* the label column. It is ALWAYS solid: what is missing is the value,
          not the question, and blurring that would be a different claim. */}
      <text x={0} y={-size * 0.28} fontFamily="'JetBrains Mono', monospace"
        fontSize={size} fontWeight={700} fill={color} opacity={0.92}
        letterSpacing={1.5}>{label}</text>

      {/* THE VOID ABOVE THE RULE IS GENUINELY EMPTY. The first build tinted it
          with VOID_TINT and the look-dev still showed exactly the failure this
          file's own docstring warns about: a filled slot reads as a BOX, and a
          box is a thing, so the eye sees an empty container rather than an
          unanswered question. There is no rect here on purpose. The page shows
          through, and the dashed baseline plus the drift carry the whole
          reading. Do not put a fill back. */}
      {motes.map((m, i) => (
        <circle key={i} cx={m.cx} cy={m.cy} r={m.r} fill={color}
          opacity={Math.max(0, m.o) * (1 - solid)} />
      ))}

      {/* THE BASELINE. Dashed and crawling while unanswered, solid once filled. */}
      <line x1={slotX} y1={base} x2={slotX + slotW} y2={base}
        stroke={color} strokeWidth={solid > 0.5 ? 3 : 5}
        strokeLinecap="round"
        strokeDasharray={solid > 0.5 ? undefined : '22 16'}
        strokeDashoffset={solid > 0.5 ? undefined : crawl}
        opacity={0.55 + 0.35 * solid} />

      {/* the value, if one ever arrives */}
      {value ? (
        <text x={slotX + slotW} y={-size * 0.28} textAnchor="end"
          fontFamily="'JetBrains Mono', monospace" fontSize={size} fontWeight={800}
          fill={color} opacity={Math.max(0, (solid - 0.45) / 0.55)}
          letterSpacing={1.5}>{value}</text>
      ) : null}
      <desc>{uidv}</desc>
    </g>
  );
};
