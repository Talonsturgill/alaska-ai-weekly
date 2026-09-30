import React from 'react';
import {FormGradient, tones} from './lighting';

/**
 * THE STACK KIT (2026-09-30, "The Answer Was on Top").
 * Net-new: Binder (the one thick still bound text), DateTag (the orange throughline tab,
 * with a state that can be turned to cream so orange keeps ONE meaning: the wrong answer),
 * AnswerCard (the orange card and its lockstep twin), LabelSheet (a thin summary sheet with a
 * face), and HandSil (a silhouette hand, for the private individual who is never drawn with
 * a face). SummaryStack is deliberately a thin composite of LabelSheets, not the hero.
 */
export const P = {
  fog: '#A9B7C0', fogHi: '#C4CFD5', fogLo: '#8797A1',
  peat: '#2B211A', peatHi: '#4A3A2E', peatLo: '#160F0B',
  orange: '#E8590C', orangeHi: '#F58A46', orangeLo: '#A93E06',
  lichen: '#8C9A86', lichenLo: '#5F6C5B',
  paper: '#ECEEEA', paper2: '#DCE0E1', paper3: '#C8CED1', paper4: '#B0B8BD', paper5: '#939DA3',
  ink: '#141A1F', lamp: '#D9B37A', cream: '#F4F2EA', slate: '#4A5F6E',
};
export const MONO = 'JetBrains Mono, monospace';
export const SERIF = 'Fraunces, Georgia, serif';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Silhouette hand, wrist at (0,0), fingers up (-y). `curl` 0..1 closes the fingers,
 *  `tap` dips the whole hand. Dark fill with a cream rim on the upper-left edge. */
export const HandSil: React.FC<{
  x: number; y: number; rot?: number; s?: number; curl?: number; flip?: boolean; sleeve?: boolean;
  fill?: string;
}> = ({x, y, rot = 0, s = 1, curl = 0, flip = false, sleeve = true, fill = P.ink}) => {
  const fingers = [
    {x: -44, len: 104, w: 27}, {x: -14, len: 122, w: 28}, {x: 16, len: 116, w: 28}, {x: 45, len: 92, w: 26},
  ];
  const hand = (col: string) => (
    <g fill={col}>
      <rect x={-64} y={-128} width={128} height={132} rx={40} />
      {fingers.map((f, i) => (
        <rect key={i} x={f.x - f.w / 2} y={-128 - f.len * (1 - 0.55 * curl)} width={f.w}
          height={f.len * (1 - 0.35 * curl) + 40} rx={f.w / 2} />
      ))}
      <rect x={-96} y={-96} width={34} height={92} rx={17} transform={`rotate(${-34 + 18 * curl} -78 -20)`} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip ? -s : s},${s})`}>
      {sleeve && <path d="M-68,-6 L-100,300 L100,300 L68,-6 Z" fill={fill} />}
      {sleeve && <path d="M-66,60 L-96,300 L-70,300 L-52,60 Z" fill={P.cream} opacity={0.18} />}
      <g transform="translate(-4,-4)" opacity={0.85}>{hand(P.cream)}</g>
      {hand(fill)}
    </g>
  );
};

/** The orange answer card. Slams in with `land` 0..1. The twin is the same component. */
export const AnswerCard: React.FC<{
  x: number; y: number; w?: number; land?: number; wobble?: number; rot?: number; small?: boolean;
  label?: string; text?: string[];
}> = ({x, y, w = 420, land = 1, wobble = 0, rot = 0, small = false, label = 'AI ANSWER', text = ['SEASON BEGAN', 'SEPT 1']}) => {
  const h = w * 0.52;
  const t = tones(P.orange);
  const uid = React.useId().replace(/:/g, '');
  const k = clamp01(land);
  const over = 1 + (1 - k) * 0.3;
  return (
    <g transform={`translate(${x},${y - (1 - k) * 90}) rotate(${rot + wobble}) scale(${over})`} opacity={Math.min(1, k * 3)}>
      <defs><FormGradient id={`ac${uid}`} t={t} /></defs>
      <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} rx={16} fill={P.ink} opacity={0.32} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill={`url(#ac${uid})`} stroke={P.ink} strokeWidth={4} />
      <path d={`M${-w / 2 + 14},${-h / 2 + 8} H${w / 2 - 14}`} stroke={P.orangeHi} strokeWidth={3} opacity={0.8} />
      {!small && (
        <text x={-w / 2 + 26} y={-h / 2 + 40} fontFamily={MONO} fontWeight={800} fontSize={20}
          letterSpacing={2} fill={P.cream} opacity={0.9}>{label}</text>
      )}
      {text.map((tx, i) => (
        <text key={i} x={0} y={(small ? 6 : 26) + i * (small ? 34 : Math.round(w * 0.13)) - (text.length - 1) * (small ? 14 : Math.round(w * 0.05))}
          textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={small ? 30 : Math.round(w * 0.098)} fill={P.cream}
          stroke={P.orangeLo} strokeWidth={2} paintOrder="stroke">{tx}</text>
      ))}
    </g>
  );
};

/** The orange date tag. `state` orange is the wrong answer, cream is the corrected/blank tag,
 *  `tear` 0..1 tears the lower-right corner off, `crease` folds it. */
export const DateTag: React.FC<{
  x: number; y: number; s?: number; rot?: number; text?: string; state?: 'orange' | 'cream';
  crease?: number; tear?: number; fade?: number;
}> = ({x, y, s = 1, rot = 0, text = '', state = 'orange', crease = 0, tear = 0, fade = 0}) => {
  const base = state === 'orange' ? P.orange : P.paper;
  const edge = state === 'orange' ? P.orangeLo : P.peat;
  const txt = state === 'orange' ? P.cream : P.peat;
  const w = 220, h = 96;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={1 - 0.45 * fade}>
      <path d={`M${-w / 2 + 6},${-h / 2 + 10} h${w} v${h} h${-w} z`} fill={P.ink} opacity={0.28} />
      <path d={`M${-w / 2},${-h / 2} h${w - 34} l34,34 v${h - 34 - 34 * tear} h${-34 - 20 * tear} z`}
        fill={base} stroke={edge} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M${-w / 2},${-h / 2} h${w - 34} l34,34 v20 h${-w + 34}z`} fill={P.cream} opacity={state === 'orange' ? 0.14 : 0.35} />
      <circle cx={-w / 2 + 26} cy={0} r={9} fill={P.ink} opacity={0.6} />
      {crease > 0 && (
        <path d={`M${-30},${-h / 2} l${16 * crease},${h * 0.5} l${-10 * crease},${h * 0.5}`} fill="none"
          stroke={edge} strokeWidth={3} opacity={0.75 * crease} />
      )}
      {text && <text x={12} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30}
        letterSpacing={1} fill={txt}>{text}</text>}
      {tear > 0 && (
        <g transform={`translate(${w / 2 - 6},${h / 2 - 30 * tear}) rotate(${30 * tear})`} opacity={clamp01(tear * 2)}>
          <path d="M0,0 l-38,0 l0,-30 l38,-4 z" fill={base} stroke={edge} strokeWidth={3} transform={`translate(${20 * tear},${60 * tear * tear})`} />
        </g>
      )}
    </g>
  );
};

/** A thin labelled summary sheet. `face` picks what is drawn on it. Sheets are only lightly
 *  translucent over a cream underlay so the binder never bleeds through the value ladder. */
export const LabelSheet: React.FC<{
  x: number; y: number; w?: number; h?: number; fill?: string; rot?: number; opacity?: number;
  label?: string; stamp?: string; lines?: number; children?: React.ReactNode; ink?: string;
}> = ({x, y, w = 640, h = 420, fill = P.paper, rot = 0, opacity = 1, label, stamp, lines = 5, children, ink = P.ink}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`} opacity={opacity}>
    <rect x={-w / 2 + 6} y={-h / 2 + 12} width={w} height={h} fill={P.ink} opacity={0.26} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={P.cream} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={fill} opacity={0.9} stroke={P.ink} strokeWidth={3} />
    <path d={`M${-w / 2 + 4},${-h / 2 + 3} H${w / 2 - 4}`} stroke={P.cream} strokeWidth={3} opacity={0.9} />
    {label && (
      <text x={-w / 2 + 28} y={-h / 2 + 52} fontFamily={MONO} fontWeight={800} fontSize={30}
        letterSpacing={1.5} fill={ink}>{label}</text>
    )}
    {Array.from({length: lines}, (_, i) => (
      <rect key={i} x={-w / 2 + 28} y={-h / 2 + 92 + i * 34} width={(w - 56) * (0.55 + ((i * 37) % 40) / 100)} height={10}
        rx={5} fill={P.slate} opacity={0.32} />
    ))}
    {stamp && (
      <g transform={`translate(${w / 4},${h / 4}) rotate(-8)`}>
        <rect x={-150} y={-32} width={300} height={64} fill="none" stroke={P.peat} strokeWidth={5} opacity={0.82} />
        <text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34}
          letterSpacing={3} fill={P.peat} opacity={0.85}>{stamp}</text>
      </g>
    )}
    {children}
  </g>
);

/**
 * BINDER: the one thick still bound text. Face-on cover (0,0 top-left of the cover) with an
 * oblique thickness: a page-block edge on the top and right, a rounded spine strip on the left
 * with a stitched head band, and a HARD contact shadow (sheets only get a soft float shadow).
 * `open` 0..1 swings the cover about the spine; the page beneath carries `title` and lines.
 * The binder is peat, never orange: orange means the wrong answer and nothing else.
 */
export const Binder: React.FC<{
  x: number; y: number; w?: number; h?: number; depth?: number; open?: number; title?: string;
  s?: number; rot?: number; pageBlur?: number; tab?: string; tabOut?: number; showPage?: boolean;
}> = ({x, y, w = 560, h = 720, depth = 46, open = 0, title = '', s = 1, rot = 0, pageBlur = 0, tab = '', tabOut = 0, showPage = true}) => {
  const t = tones(P.peat);
  const uid = React.useId().replace(/:/g, '');
  const dx = depth * 0.75, dy = depth * 0.62;
  const coverScaleX = Math.cos(clamp01(open) * Math.PI * 0.92);
  const flipped = coverScaleX < 0;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <defs>
        <FormGradient id={`bd${uid}`} t={t} />
        <filter id={`pb${uid}`}><feGaussianBlur stdDeviation={pageBlur} /></filter>
      </defs>
      {/* hard contact shadow */}
      <path d={`M${-6},${h + 4} L${w + dx + 30},${h + 4} L${w + dx + 60},${h + 30} L${dx - 30},${h + 30} Z`} fill={P.ink} opacity={0.55} />
      {/* page block edge, top and right */}
      <path d={`M0,0 L${dx},${-dy} L${w + dx},${-dy} L${w},0 Z`} fill={P.cream} stroke={P.ink} strokeWidth={3} />
      <path d={`M${w},0 L${w + dx},${-dy} L${w + dx},${h - dy} L${w},${h} Z`} fill={P.paper2} stroke={P.ink} strokeWidth={3} />
      {Array.from({length: 9}, (_, i) => (
        <path key={i} d={`M${w + 2},${8 + i * (h / 9)} L${w + dx - 2},${8 + i * (h / 9) - dy}`} stroke={P.paper4} strokeWidth={1.6} opacity={0.7} />
      ))}
      {/* the page under the cover */}
      {showPage && (
        <g filter={pageBlur > 0 ? `url(#pb${uid})` : undefined}>
          <rect x={6} y={6} width={w - 12} height={h - 12} fill={P.paper} stroke={P.ink} strokeWidth={2} />
          {title && (
            <g>
              <rect x={30} y={40} width={w - 60} height={96} fill={P.peat} />
              <text x={w / 2} y={100} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={title.length > 22 ? 26 : 34}
                letterSpacing={1.5} fill={P.cream}>{title}</text>
            </g>
          )}
          {Array.from({length: 12}, (_, i) => (
            <rect key={i} x={32} y={176 + i * 40} width={(w - 64) * (0.62 + ((i * 53) % 35) / 100)} height={11} rx={5.5}
              fill={P.slate} opacity={0.34} />
          ))}
        </g>
      )}
      {/* cover, swung about the spine at x=0 */}
      <g transform={`scale(${coverScaleX},1)`}>
        <rect x={0} y={0} width={w} height={h} rx={10} fill={flipped ? P.peatHi : `url(#bd${uid})`} stroke={P.ink} strokeWidth={5} />
        {!flipped && (
          <g>
            <rect x={44} y={34} width={w - 76} height={h - 68} rx={6} fill="none" stroke={P.peatHi} strokeWidth={4} opacity={0.9} />
            <rect x={78} y={h * 0.30} width={w - 144} height={110} rx={6} fill={P.peatHi} stroke={P.ink} strokeWidth={3} />
            <path d={`M6,6 H${w - 6}`} stroke={P.paper} strokeWidth={2} opacity={0.35} />
          </g>
        )}
      </g>
      {/* rounded spine and stitched head band */}
      <rect x={-22} y={-4} width={44} height={h + 8} rx={18} fill={P.peatLo} stroke={P.ink} strokeWidth={5} />
      <path d={`M-10,10 V${h - 10}`} stroke={P.peatHi} strokeWidth={3} opacity={0.8} />
      {Array.from({length: 13}, (_, i) => (
        <path key={i} d={`M-16,${18 + i * ((h - 40) / 12)} h32`} stroke={P.lichen} strokeWidth={2} opacity={0.55} />
      ))}
      <rect x={-22} y={-4} width={w * 0.5} height={12} rx={6} fill={P.peatLo} stroke={P.ink} strokeWidth={3} />
      {tab && (
        <g transform={`translate(${w + dx - 6 + 210 * tabOut - 210},${h * 0.52})`} opacity={clamp01(tabOut * 3)}>
          <rect x={0} y={-30} width={420} height={60} rx={6} fill={P.paper} stroke={P.ink} strokeWidth={3} />
          <text x={16} y={11} fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={1} fill={P.peat}>{tab}</text>
        </g>
      )}
    </g>
  );
};
