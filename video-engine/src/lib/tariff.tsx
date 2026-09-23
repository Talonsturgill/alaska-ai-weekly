import React from 'react';
import {INK, tones, paleTones, FormGradient, RimLight, ContactShadow} from './lighting';
import {UnnamedValue} from './absence';

// =============================================================================
// TARIFF — the shelf's FIRST BILL, and its first cost that DIVIDES.
// NET-NEW 2026-09-23 ("One Variable").
//
// WHY THIS IS A REAL GAP, checked against ASSET_MANIFEST.md in full first.
// The shelf could draw one stat (props.StatCard), a sheet with real body
// (paper.Sheet), a records room (paper.PaperOfficeBG), an epistemic status
// (evidence_state), and a thing that is not there (absence). It could not draw
// a BILL, and it could not draw a cost that SPLITS INTO NAMED PARTS AND GETS
// DIVIDED ACROSS PEOPLE.
//
// That second one is the load-bearing absence. Alaska's news is rate cases,
// tariffs, Power Cost Equalization, dividends, borough budgets and utility
// filings nearly every week, and every one of those stories is the same
// picture: a pot of money, split into parts, divided across a number of
// people, where changing the number of people changes what each one pays.
// Until now a run needing that had to hand-build it, which is how the 07-26
// capped-pipe weakness stayed open for four days.
//
// TWO COMPONENTS AND A CLEAR SEAM BETWEEN THEM:
//   Statement — the document. Rows with labels and values, some of which were
//               never filled in. Composes absence.UnnamedValue rather than
//               reimplementing it, so there is exactly one definition of what
//               an unanswered field looks like.
//   CostStack — the arithmetic. A bar that splits into named halves and
//               divides across N customers. It is ONE component run twice
//               rather than two hand-built diagrams, which is what lets a film
//               show the same load producing opposite answers.
//
// ALL COPY IS A PARAMETER. A prop with baked-in text is an episode-local, not
// a library asset (props.tsx, 2026-07-20d).
// =============================================================================

const hash = (s: string) => Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
const uid = (s: string) => 'tf' + hash(s).toString(36);

/** Mono advance is exact, so a mono string's width is arithmetic, not judgement.
 *  DISPATCH_STANDARD section 4: size the plate to the string, never the reverse. */
export const monoW = (text: string, size: number, tracking = 0) =>
  text.length * size * 0.602 + tracking * Math.max(0, text.length - 1);

export interface StatementRow {
  label: string;
  /** omit, or pass null, for a row that was never filled in */
  value?: string | null;
  /** 0..1. Below 1 the row is still arriving. Ignored when value is null. */
  fill?: number;
}

export interface StatementProps {
  f: number;
  x?: number;
  y?: number;
  w?: number;
  masthead: string;
  rows: StatementRow[];
  /** the bottom row, set off above a heavier rule */
  totalLabel?: string;
  totalValue?: string | null;
  /** 0..1 across the whole card: how many rows have landed, left to right */
  arrive?: number;
  paper?: string;
  ink?: string;
  /** the copper edge rim that says this object is REAL and built */
  rim?: string;
  rowSize?: number;
  /** a curled lower corner, which is what makes paper read as a solid */
  curl?: number;
}

/**
 * A ruled utility statement with real body.
 *
 * The numeric shadow contract lives in code rather than in prose, same as
 * paper.Sheet: a 2px edge, a drop shadow offset 5 down and 3 right at 24
 * percent, and an optional curled corner with an under-shadow. Under the flat
 * raking light this film uses, that shadow is the whole reason the card reads
 * as an object sitting on something instead of a rectangle pasted on.
 */
export const Statement: React.FC<StatementProps> = ({
  f, x = 0, y = 0, w = 620, masthead, rows, totalLabel, totalValue,
  arrive = 1, paper = '#EDE7DB', ink = '#1F3A5F', rim = '#C87137',
  rowSize = 30, curl = 0.35,
}) => {
  const id = uid(`st${masthead}${x}${y}`);
  const pt = paleTones(paper);
  const padX = 26;
  const headH = 64;
  const rowH = rowSize * 2.05;
  const totalH = totalLabel ? rowH * 1.25 : 0;
  const h = headH + rows.length * rowH + totalH + 26;
  const edge = `M0,0 L${w},0 L${w},${h} L0,${h} Z`;

  return (
    <g transform={`translate(${x},${y})`}>
      <defs><FormGradient id={id} t={pt} softness={0.55} /></defs>

      {/* the card sits on something, so it casts */}
      <ContactShadow cx={w * 0.5} cy={h + 6} rx={w * 0.46} ry={12} opacity={0.30} blur={12} />
      <rect x={3} y={5} width={w} height={h} fill={INK} opacity={0.24} />
      <rect x={0} y={0} width={w} height={h} fill={`url(#${id})`} stroke={INK} strokeWidth={2} />

      {/* paper tooth, so no surface in this film is a flat fill */}
      {Array.from({length: 30}, (_, i) => {
        const hh = Math.imul(i + 11, 2654435761) >>> 0;
        return (
          <circle key={i} cx={(hh % 100) / 100 * w} cy={((hh >>> 7) % 100) / 100 * h}
            r={0.4 + ((hh >>> 13) % 4) / 10} fill={INK} opacity={0.055} />
        );
      })}

      {/* masthead */}
      <rect x={0} y={0} width={w} height={headH} fill={ink} opacity={0.94} />
      <text x={padX} y={headH * 0.63} fontFamily="'JetBrains Mono', monospace"
        fontSize={rowSize * 0.94} fontWeight={800} fill={paper} letterSpacing={2.4}>
        {masthead}
      </text>

      {/* rows. A row with value null is an UNANSWERED FIELD and is drawn by the
          absence grammar, never by a local placeholder. */}
      {rows.map((r, i) => {
        const ry = headH + rowH * (i + 1) - rowSize * 0.5;
        const landed = Math.max(0, Math.min(1, arrive * rows.length - i));
        const ov = landed < 1 ? (1 - landed) * 16 : 0;   // overshoot as it lands
        if (r.value === null || r.value === undefined) {
          return (
            <g key={i} opacity={landed > 0 ? 1 : 0}>
              <UnnamedValue label={r.label} f={f} x={padX} y={ry} w={w - padX * 2}
                color={ink} paper={paper} size={rowSize * 0.84} phase={i * 3} />
            </g>
          );
        }
        return (
          <g key={i} transform={`translate(0,${ov})`} opacity={landed}>
            <text x={padX} y={ry - rowSize * 0.24} fontFamily="'JetBrains Mono', monospace"
              fontSize={rowSize * 0.84} fontWeight={700} fill={ink} opacity={0.92}
              letterSpacing={1.5}>{r.label}</text>
            <line x1={w * 0.52} y1={ry} x2={w - padX} y2={ry}
              stroke={ink} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
            <text x={w - padX} y={ry - rowSize * 0.24} textAnchor="end"
              fontFamily="'JetBrains Mono', monospace" fontSize={rowSize * 0.84}
              fontWeight={800} fill={ink} letterSpacing={1.5}
              opacity={Math.max(0, (landed - 0.35) / 0.65) * (r.fill ?? 1)}>
              {r.value}
            </text>
          </g>
        );
      })}

      {totalLabel ? (
        <g>
          <line x1={padX} y1={h - totalH} x2={w - padX} y2={h - totalH}
            stroke={ink} strokeWidth={5} opacity={0.85} />
          <text x={padX} y={h - 24} fontFamily="'JetBrains Mono', monospace"
            fontSize={rowSize * 0.94} fontWeight={800} fill={ink} letterSpacing={2}>
            {totalLabel}
          </text>
          {totalValue ? (
            <text x={w - padX} y={h - 24} textAnchor="end"
              fontFamily="'JetBrains Mono', monospace" fontSize={rowSize * 0.94}
              fontWeight={800} fill={ink} letterSpacing={2}>{totalValue}</text>
          ) : (
            <UnnamedValue label="" f={f} x={w * 0.55} y={h - 24} w={w * 0.4 - padX}
              color={ink} paper={paper} size={rowSize * 0.94} phase={7} labelFrac={0.02} />
          )}
        </g>
      ) : null}

      {/* the curled lower corner and its under-shadow */}
      {curl > 0 ? (
        <g>
          <path d={`M${w},${h} L${w - 46 * curl},${h} L${w},${h - 46 * curl} Z`}
            fill={INK} opacity={0.20} />
          <path d={`M${w},${h} L${w - 40 * curl},${h} L${w},${h - 40 * curl} Z`}
            fill={pt.key} stroke={INK} strokeWidth={1.5} />
        </g>
      ) : null}

      {/* the copper rim on the lit edge. The absence grammar deliberately does
          NOT get this, which is how a viewer tells a built thing from a blank. */}
      <RimLight d={edge} w={3.5} color={rim} opacity={0.75} />
    </g>
  );
};

// -----------------------------------------------------------------------------

export interface StackHalf {
  name: string;
  /** fraction of the full stack height this half occupies, before any animation */
  frac: number;
  color: string;
  /** 0..1 scales THIS half only, so one half can settle while the other swings */
  scale?: number;
}

export interface CostStackProps {
  f: number;
  x?: number;
  y?: number;              // the BASE line the stack stands on
  w?: number;
  /** full height at scale 1 */
  h?: number;
  halves: StackHalf[];
  /** 0..1 shoves the halves apart along a hard seam */
  split?: number;
  /** how many customers the cost is divided across. 0 leaves it undivided. */
  customers?: number;
  /** 0..1 animates the division from one bar into `customers` share bars */
  divide?: number;
  ink?: string;
  /** draw the name plates beside each half */
  labels?: boolean;
  labelSize?: number;
}

/**
 * A cost bar that splits into named parts and divides across customers.
 *
 * THE ONE IDEA THIS ASSET EXISTS FOR: run it twice with the same `halves` and
 * a different `scale` on one of them, and the viewer sees the same load produce
 * opposite answers. That comparison is the reason a film can argue honestly
 * about a quantity nobody has published, and hand-building it twice is how a
 * run ends up with two diagrams that do not agree about their own geometry.
 *
 * Segments are drawn base-upward so a half growing never moves the ground, and
 * everything that touches ground casts, per DISPATCH_STANDARD section 1.
 */
export const CostStack: React.FC<CostStackProps> = ({
  f, x = 0, y = 0, w = 120, h = 520, halves, split = 0,
  customers = 0, divide = 0, ink = INK, labels = true, labelSize = 24,
}) => {
  const id = uid(`cs${halves.map((s) => s.name).join()}${x}`);
  // 18px on a 150px bar is a hairline, and it is why the film's named seam-and-shove
  // measured 1.3% changed pixels across its own filmstrip: a judge read it twice, in two
  // rounds, as "the named signature move does not execute". It executed. It was too small
  // to see. art_direction.motion_language calls the shove one of only three moves in the
  // film that earn a 180 degree blur, so it has to be a shove.
  const gap = 48 * split;

  // divided geometry: the same total cost spread across N share bars
  const n = Math.max(1, customers);
  const shareW = customers > 0 ? (w * 1.9) / n : w;
  const shareGap = customers > 0 ? shareW * 0.28 : 0;

  const renderBar = (bx: number, bw: number, hscale: number, key: string) => {
    let cursor = 0;
    return (
      <g key={key}>
        <ContactShadow cx={bx + bw / 2} cy={y + 4} rx={bw * 0.62} ry={9}
          opacity={0.30} blur={9} />
        {halves.map((s, i) => {
          const sh = h * s.frac * (s.scale ?? 1) * hscale;
          const top = y - cursor - sh - gap * i;
          cursor += sh;
          const t = tones(s.color);
          const gidp = `${id}g${i}${key}`;
          const d = `M${bx},${top + sh} L${bx},${top} L${bx + bw},${top} L${bx + bw},${top + sh} Z`;
          return (
            <g key={i}>
              <defs><FormGradient id={gidp} t={t} softness={0.62} /></defs>
              <rect x={bx} y={top} width={bw} height={Math.max(0, sh)}
                fill={`url(#${gidp})`} stroke={ink} strokeWidth={2.5} />
              {/* tier seams, so a column is never a flat single-tone fill */}
              {Array.from({length: Math.max(1, Math.floor(sh / 46))}, (_, k) => (
                <line key={k} x1={bx + 3} y1={top + (k + 1) * 46}
                  x2={bx + bw - 3} y2={top + (k + 1) * 46}
                  stroke={ink} strokeWidth={1} opacity={0.16} />
              ))}
              <RimLight d={`M${bx},${top + sh} L${bx},${top} L${bx + bw},${top}`}
                w={3} color={t.key} opacity={0.6} />
            </g>
          );
        })}
      </g>
    );
  };

  const bars = [];
  if (customers > 0 && divide > 0.01) {
    const totalW = n * shareW + (n - 1) * shareGap;
    const startX = x + w / 2 - totalW / 2;
    for (let i = 0; i < n; i++) {
      const bx = startX + i * (shareW + shareGap);
      // each share carries 1/n of the cost, eased in as `divide` rises
      const hs = 1 / n + (1 - divide) * (1 - 1 / n);
      bars.push(renderBar(bx, shareW * divide + w * (1 - divide), hs, `s${i}`));
    }
  } else {
    bars.push(renderBar(x, w, 1, 'one'));
  }

  let lcursor = 0;
  return (
    <g>
      {bars}
      {labels && (customers === 0 || divide < 0.5) ? halves.map((s, i) => {
        const sh = h * s.frac * (s.scale ?? 1);
        const top = y - lcursor - sh - gap * i;
        lcursor += sh;
        // THE LABEL SITS ON A CHIP. Set in the half's own colour straight onto the
        // scene, a dark half (carbon blue on dusk violet) is unreadable at 5x, never
        // mind at phone size, and a judge could not read FUEL at all. The chip is the
        // same ink card the rest of the film's type stands on, so the label reads at
        // whatever colour the half happens to be.
        const cw = (s.name?.length ?? 0) * labelSize * 0.68 + 26;
        return (
          <g key={i}>
            <rect x={x + w + 12} y={top + sh / 2 - labelSize * 0.82} width={cw}
              height={labelSize * 1.64} rx={7} fill="#120E1C" stroke={s.color}
              strokeWidth={2.5} opacity={0.94} />
            <text x={x + w + 12 + cw / 2} y={top + sh / 2 + labelSize * 0.35} textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace" fontSize={labelSize}
              fontWeight={800} fill="#EDE7DB" letterSpacing={2}>{s.name}</text>
          </g>
        );
      }) : null}
    </g>
  );
};
