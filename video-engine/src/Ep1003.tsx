import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, DayGrade, ContactShadow, tones} from './lib/lighting';
import {VoiceProvider, useVoice} from './lib/voice';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {Character} from './lib/Character';
import {Moose, Raven} from './lib/fauna';
import {ImpactStar} from './lib/FX';
import {NewsAgent, LeadSlot, PriceTag, Ream, StorySheet, NEWS, monoW} from './lib/newsroom';

// THE CHOOSING ISN'T, 2026-10-03.
// Palette roles are art_direction.json: warm newsprint cream and spruce under daylight, ONE
// cadmium amber that only ever means the top slot and the act of choosing, oxblood stamps.
// Named real people are plates only: no faces, no hands, no bodies (claims c6, c7, c9). The
// founders' plates hang on the ALASKA NEWS masthead and never on the LEAD slot. Every painted
// string is a claims.json on_screen string or the storyboard annotation for its beat.
const W = 1080, H = 1920;
const CAPTION_TOP = 1330;
const CAP_GUARD = CAPTION_TOP - 34;
type Beat = {id: number; at: number; label: string};

const C = {...NEWS, wall: '#EFE5CF', wallHi: '#F8F1E1', wallLo: '#D9CBAE', floor: '#B98A55', floorLo: '#8F653A', sand: '#E9C98C', sandLo: '#C9A266'};
const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
/** anticipation, overshoot, settle. For pops and landings only, never for travel. */
const spring = (f: number, a: number, d = 20) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.pow(2, -9 * t) * Math.cos((t * d - 1.2) * 0.9);
};
/** a travel ease with a small decaying settle at the end (DISPATCH_STANDARD 9: springs are not for travel) */
const land = (f: number, a: number, d = 24) => {
  const k = ease(f, a, d);
  const after = f - (a + d);
  return after > 0 ? 1 + 0.04 * Math.sin(after / 2.2) * Math.exp(-after / 6) : k;
};
const hash = (i: number) => Math.imul(i + 1013, 2654435761) >>> 0;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

const plateW = (text: string, size: number, ls = 1.5) => monoW(text, size, ls) + 56;

/** A mono plate, sized to its string by arithmetic, kept out of the caption band and crop lines. */
const Plate: React.FC<{text: string; x?: number; y: number; size?: number; tone?: 'ink' | 'cream' | 'amber' | 'kraft' | 'oxblood'; p?: number; rot?: number}> =
({text, x = 540, y, size = 30, tone = 'ink', p = 1, rot = 0}) => {
  const w = plateW(text, size), h = size + 30;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(text, yy - h / 2, yy + h / 2);
  const fill = {ink: C.ink, cream: C.cream, amber: C.amber, kraft: C.kraft, oxblood: C.oxblood}[tone];
  const fg = tone === 'ink' || tone === 'oxblood' ? C.cream : C.ink;
  const k = clamp01(p);
  if (k <= 0.01) return null;
  return (
    <g opacity={Math.min(1, k * 1.6)} transform={`translate(${x} ${yy}) rotate(${rot}) scale(${0.86 + 0.14 * spring(k * 20, 0, 20)})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 7} width={w} height={h} rx={6} fill="#000" opacity={0.22} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={fill} stroke={C.ink} strokeWidth={4} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
        fontSize={size} letterSpacing={1.5} fill={fg}>{text}</text>
    </g>
  );
};

/** A big boxed quote: serif type on cream, an ink frame, a small attribution line under it.
 *  The claim and its attribution are ONE plate (DISPATCH_STANDARD 9). */
const QuotePlate: React.FC<{lines: string[]; by?: string; x?: number; y: number; size?: number; p?: number; rot?: number}> =
({lines, by, x = 540, y, size = 52, p = 1, rot = 0}) => {
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const tw = Math.max(...lines.map((l) => l.length * size * 0.56), by ? monoW(by, 22) : 0) + 70;
  const th = lines.length * (size + 10) + (by ? 46 : 0) + 40;
  assertCropSafe(lines.join(' '), y - th / 2, y + th / 2);
  const s = 0.6 + 0.4 * spring(k * 18, 0, 18);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={Math.min(1, k * 2)}>
      <rect x={-tw / 2 + 10} y={-th / 2 + 12} width={tw} height={th} fill="#000" opacity={0.25} />
      <rect x={-tw / 2} y={-th / 2} width={tw} height={th} fill={C.paper} stroke={C.ink} strokeWidth={8} />
      <rect x={-tw / 2 + 12} y={-th / 2 + 12} width={tw - 24} height={th - 24} fill="none" stroke={C.ink} strokeWidth={2.5} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-th / 2 + 26 + size * 0.86 + i * (size + 10)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={C.ink}>{l}</text>
      ))}
      {by && <text x={0} y={th / 2 - 26} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={1} fill={C.oxblood}>{by}</text>}
    </g>
  );
};

/** Loose sheets fluttering across a set: the always-running ambient layer every newsroom shot carries. */
const Flutter: React.FC<{f: number; n?: number; y0?: number; y1?: number; op?: number; seed?: number; s?: number}> =
({f, n = 9, y0 = 360, y1 = 1300, op = 0.9, seed = 0, s = 0.42}) => (
  <g opacity={op}>
    {Array.from({length: n}, (_, i) => {
      const h = hash(i * 13 + seed);
      const span = y1 - y0;
      const speed = 0.9 + ((h >>> 7) % 60) / 60;
      let yy = y0 + ((h >>> 3) % span) + ((f * speed) % span);
      if (yy > y1) yy -= span;
      const xx = (h % 1080) + Math.sin(f / (22 + (h % 20)) + i) * 60;
      const rot = Math.sin(f / (11 + (h % 9)) + i) * 40;
      return <g key={i} transform={`translate(${xx},${yy}) rotate(${rot}) scale(${s * (0.7 + ((h >>> 11) % 50) / 100)}, ${s * Math.max(0.25, Math.abs(Math.cos(f / 9 + i)))})`}>
        <rect x={-60} y={-80} width={120} height={160} fill={C.paper} stroke={C.ink} strokeWidth={6} />
        <rect x={-44} y={-62} width={88} height={12} fill={C.ink} opacity={0.7} />
      </g>;
    })}
  </g>
);

/** Dust motes in daylight, the second ambient layer. */
const Motes: React.FC<{f: number; n?: number; y0?: number; y1?: number; op?: number; color?: string}> = ({f, n = 30, y0 = 300, y1 = 1500, op = 0.35, color = '#FFF7DC'}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const h = hash(i * 7 + 3);
      const span = y1 - y0;
      const x = (h % 1080) + Math.sin(f / (40 + (h % 40)) + i) * 18;
      let y = y0 + ((h >>> 9) % span) - ((f * (0.15 + ((h >>> 5) % 60) / 200)) % span);
      if (y < y0) y += span;
      return <circle key={i} cx={x} cy={y} r={1.6 + ((h >>> 17) % 3)} fill={color} opacity={op * (0.4 + ((h >>> 21) % 60) / 100)} />;
    })}
  </g>
);

/** The newsroom: tall daylight windows, plaster wall, board floor from `floorY` down. */
const Newsroom: React.FC<{f: number; id: string; floorY?: number; windows?: boolean; top?: number}> = ({f, id, floorY = 1500, windows = true, top = 0}) => {
  const wt = tones(C.wall);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0.2" y2="1">
          <stop stopColor={C.wallHi} /><stop offset="0.7" stopColor={C.wall} /><stop offset="1" stopColor={C.wallLo} />
        </linearGradient>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#8EC2E2" /><stop offset="1" stopColor="#D6EAF4" />
        </linearGradient>
        <linearGradient id={`${id}fl`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={C.floor} /><stop offset="1" stopColor={C.floorLo} />
        </linearGradient>
      </defs>
      <rect x={0} y={top} width={W} height={H - top} fill={`url(#${id}w)`} />
      {windows && [90, 410, 730].map((wx, i) => (
        <g key={i}>
          <rect x={wx} y={top + 110} width={260} height={520} fill={`url(#${id}sky)`} stroke={C.ink} strokeWidth={8} />
          {/* a far ridge and a cloud drifting through the window */}
          <path d={`M${wx},${top + 520} L${wx + 70},${top + 470} L${wx + 150},${top + 500} L${wx + 260},${top + 450} L${wx + 260},${top + 630} L${wx},${top + 630} Z`} fill="#7FA59A" opacity={0.8} />
          <ellipse cx={wx + ((f * 0.4 + i * 90) % 360) - 50} cy={top + 230 + i * 20} rx={60} ry={18} fill="#FFFFFF" opacity={0.8} />
          <line x1={wx + 130} y1={top + 110} x2={wx + 130} y2={top + 630} stroke={C.ink} strokeWidth={6} />
          <line x1={wx} y1={top + 370} x2={wx + 260} y2={top + 370} stroke={C.ink} strokeWidth={6} />
          <rect x={wx - 14} y={top + 626} width={288} height={20} fill={wt.shade} stroke={C.ink} strokeWidth={5} />
          {/* daylight falling from the window onto the wall below */}
          <path d={`M${wx},${top + 646} L${wx + 260},${top + 646} L${wx + 330},${floorY} L${wx + 60},${floorY} Z`} fill="#FFF6DA" opacity={0.18} />
        </g>
      ))}
      {/* wainscot rail */}
      <rect x={0} y={floorY - 260} width={W} height={14} fill={wt.shade} stroke={C.ink} strokeWidth={4} />
      <rect x={0} y={floorY - 246} width={W} height={246} fill={wt.core} opacity={0.35} />
      <rect x={0} y={floorY} width={W} height={H - floorY} fill={`url(#${id}fl)`} />
      {Array.from({length: 9}, (_, i) => <line key={i} x1={0} y1={floorY + 18 + i * i * 6} x2={W} y2={floorY + 18 + i * i * 6} stroke={C.floorLo} strokeWidth={3} opacity={0.6} />)}
      <line x1={0} y1={floorY} x2={W} y2={floorY} stroke={C.ink} strokeWidth={6} />
    </g>
  );
};

/** The near lip of a paper stack across the bottom of frame: the foreground plane. */
const PaperLip: React.FC<{f: number; y?: number}> = ({f, y = 1560}) => (
  <g>
    {Array.from({length: 6}, (_, i) => (
      <Ream key={i} x={90 + i * 190} y={y + 140 + (i % 2) * 14} w={230} h={110 + (i % 3) * 22} lean={((i * 37) % 9) - 4} curl={0.4 + 0.3 * Math.sin(f / 20 + i)} seed={i} band={i % 2 === 0} />
    ))}
  </g>
);

const CAPS = ({rows}: {rows: string[]}) => rows;
// --- captions: break by sense, hold across sub-0.15 s gaps (DISPATCH_STANDARD 9) ---
const DANGLE = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'from', 'with', 'by',
  'as', 'that', 'than', 'if', 'its', 'his', 'her', 'their', 'this', 'these', 'is', 'was', 'are', 'were', 'it', 'not',
  'no', 'into', 'about', 'over', 'under', 'each', 'every', 'more', 'most', 'only', 'next', 'very', 'so', 'what', 'where',
  'who', 'one', 'two', 'four', 'hundred', 'thousand', 'million', "it's", "news's", "walter's", "alaska's"]);
const PREP = new Set(['in', 'on', 'at', 'into', 'onto', 'from', 'with', 'by', 'under', 'over', 'as', 'like', 'to', 'for', 'of']);
const WH = new Set(['where', 'what', 'when', 'who', 'which', 'how', 'why', 'if', 'because', 'while', 'whether']);
const captionRows = (text: string, max = 34): string[] => {
  if (text.length <= max) return [text];
  const w = text.split(' ');
  let best = -1, bestCost = Infinity;
  for (let k = 1; k < w.length; k++) {
    const r1 = w.slice(0, k).join(' '), r2 = w.slice(k).join(' ');
    if (r1.length > max || r2.length > max) continue;
    const last = w[k - 1].toLowerCase().replace(/[,.;:?!]+$/, '');
    let cost = Math.abs(r1.length - r2.length);
    if (/^[\d.,]+$/.test(last)) cost += 80; else if (DANGLE.has(last)) cost += 40;
    if (/[,;:.?]$/.test(w[k - 1])) cost -= 30;
    if (PREP.has(w[k].toLowerCase()) || WH.has(w[k].toLowerCase())) cost -= 15;
    if (cost < bestCost) { bestCost = cost; best = k; }
  }
  if (best > 0) return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
  const rows: string[] = [];
  let row = '';
  for (const x of w) {
    if ((row + ' ' + x).trim().length > max && row) { rows.push(row); row = x; } else row = (row + ' ' + x).trim();
  }
  if (row) rows.push(row);
  return rows;
};
void CAPS;

const Captions: React.FC<{cues: {t: number; d: number; text: string}[]}> = ({cues}) => {
  const t = useCurrentFrame() / 30;
  const c = cues.find((x, i) => {
    const nx = cues[i + 1];
    const end = nx && nx.t - (x.t + x.d) < 0.15 ? nx.t : x.t + x.d;
    return t >= x.t && t < end;
  });
  if (!c) return null;
  const rows = captionRows(c.text);
  const fs = rows.length >= 4 ? 27 : rows.length === 3 ? 32 : 39;
  const step = rows.length >= 4 ? 30 : rows.length === 3 ? 37 : 49;
  const y0 = rows.length === 1 ? 1420 : rows.length === 2 ? 1390 : rows.length === 3 ? 1378 : 1366;
  return (
    <SVG>
      <rect x={68} y={1336} width={944} height={136} rx={16} fill={C.ink} stroke={C.cream} strokeWidth={3} opacity={0.94} data-band="ok" />
      {rows.map((s, i) => (
        <text key={i} x={540} y={y0 + i * step} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={fs} fill={C.cream} data-band="ok">{s}</text>
      ))}
    </SVG>
  );
};

/** A plain wooden desk top across the frame, for Walter and the home office. */
const DeskTop: React.FC<{y: number}> = ({y}) => {
  const t = tones('#A8754A');
  return (
    <g>
      <rect x={-20} y={y} width={W + 40} height={H - y} fill={t.core} />
      <rect x={-20} y={y} width={W + 40} height={46} fill={t.base} stroke={C.ink} strokeWidth={7} />
      <rect x={-20} y={y + 4} width={W + 40} height={10} fill={t.key} opacity={0.6} />
      {Array.from({length: 6}, (_, i) => <path key={i} d={`M0,${y + 70 + i * 60} C300,${y + 60 + i * 60} 700,${y + 90 + i * 60} 1080,${y + 72 + i * 60}`} fill="none" stroke={t.shade} strokeWidth={3} opacity={0.5} />)}
    </g>
  );
};

/** A record plate (a document with a tab): what Walter eats. */
const RecordPlate: React.FC<{x: number; y: number; label: string; rot?: number; s?: number}> = ({x, y, label, rot = 0, s = 1}) => {
  const w = monoW(label, 24) + 50;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2 + 6} y={-46 + 8} width={w} height={96} fill="#000" opacity={0.18} />
      <rect x={-w / 2} y={-46} width={w} height={96} fill={C.cream} stroke={C.ink} strokeWidth={5} />
      <rect x={-w / 2} y={-46} width={w} height={30} fill={C.sky} stroke={C.ink} strokeWidth={5} />
      <text x={0} y={-24} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1.5} fill={C.ink} dy={10}>{label}</text>
      {[0, 1].map((r) => <rect key={r} x={-w / 2 + 16} y={4 + r * 18} width={w - 32 - r * 40} height={7} fill={C.newsprint} />)}
    </g>
  );
};

/** The ambulance: a box-body rig with a sky-blue and oxblood light bar (art direction: no amber). */
const Ambulance: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => {
  const body = tones('#F4F1EA');
  const lit = Math.sin(f / 3) > 0;
  return (
    <g transform={`translate(${x},${y})`}>
      <ContactShadow cx={0} cy={6} rx={360} ry={26} opacity={0.35} />
      <rect x={-330} y={-400} width={420} height={330} rx={14} fill={body.base} stroke={C.ink} strokeWidth={8} />
      <rect x={-330} y={-400} width={420} height={40} rx={10} fill={body.key} />
      <path d="M90,-300 L230,-300 Q300,-290 320,-200 L330,-70 L90,-70 Z" fill={body.base} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <path d="M120,-280 L220,-280 Q270,-270 286,-200 L120,-200 Z" fill="#9CC7E0" stroke={C.ink} strokeWidth={6} />
      <rect x={-330} y={-200} width={660} height={34} fill={C.oxblood} stroke={C.ink} strokeWidth={5} />
      <rect x={-330} y={-166} width={660} height={16} fill={C.sky} stroke={C.ink} strokeWidth={4} />
      {/* star of life, as a plain cross shape */}
      <g transform="translate(-120,-300)">
        <rect x={-14} y={-48} width={28} height={96} fill={C.sky} stroke={C.ink} strokeWidth={4} />
        <rect x={-48} y={-14} width={96} height={28} fill={C.sky} stroke={C.ink} strokeWidth={4} />
      </g>
      {/* light bar */}
      <rect x={-250} y={-430} width={220} height={32} rx={8} fill={C.ink} />
      <rect x={-244} y={-426} width={100} height={24} rx={6} fill={lit ? '#7FC8F0' : '#2C4E62'} />
      <rect x={-136} y={-426} width={100} height={24} rx={6} fill={!lit ? '#C0473A' : '#4A1E18'} />
      {[-230, 210].map((wx) => (
        <g key={wx} transform={`translate(${wx},-60)`}>
          <circle r={62} fill="#222" stroke={C.ink} strokeWidth={8} />
          <circle r={30} fill="#9A9A92" stroke={C.ink} strokeWidth={5} />
        </g>
      ))}
    </g>
  );
};

/** A desk phone with a ring that visibly hops on its own clock. Origin at its base. */
const DeskPhone: React.FC<{x: number; y: number; f: number; ringing: boolean; lifted?: number}> = ({x, y, f, ringing, lifted = 0}) => {
  const hop = ringing ? Math.abs(Math.sin(f * 0.9)) * 8 : 0;
  const shake = ringing ? Math.sin(f * 2.1) * 4 : 0;
  const t = tones('#2F5D50');
  return (
    <g transform={`translate(${x},${y - hop}) rotate(${shake})`}>
      <ContactShadow cx={0} cy={hop + 4} rx={80} ry={10} opacity={0.3} />
      <path d="M-74,0 L-58,-60 L58,-60 L74,0 Z" fill={t.base} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={0} cy={-32} r={18} fill={C.cream} stroke={C.ink} strokeWidth={4} />
      <g transform={`translate(0,${-74 - lifted * 140}) rotate(${-lifted * 30})`}>
        <path d="M-80,0 Q-80,-24 -56,-24 L56,-24 Q80,-24 80,0 L60,6 L-60,6 Z" fill={t.key} stroke={C.ink} strokeWidth={6} />
      </g>
      {ringing && [0, 1, 2].map((i) => (
        <path key={i} d={`M${-100 - i * 22},${-90 - i * 8} q-14,24 0,48 M${100 + i * 22},${-90 - i * 8} q14,24 0,48`} fill="none" stroke={C.ink} strokeWidth={5} opacity={0.6 + 0.4 * Math.sin(f / 2 + i)} />
      ))}
    </g>
  );
};

/** An office chair seen from the front, empty unless told otherwise. Origin at the floor. */
const Chair: React.FC<{x: number; y: number; rock?: number}> = ({x, y, rock = 0}) => {
  const t = tones('#6B4A35');
  return (
    <g transform={`translate(${x},${y}) rotate(${rock})`}>
      <ContactShadow cx={0} cy={4} rx={110} ry={14} opacity={0.3} />
      <rect x={-8} y={-140} width={16} height={130} fill="#333" stroke={C.ink} strokeWidth={4} />
      <path d="M-90,-6 L90,-6" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
      <rect x={-100} y={-170} width={200} height={40} rx={14} fill={t.base} stroke={C.ink} strokeWidth={6} />
      <rect x={-86} y={-380} width={172} height={200} rx={26} fill={t.base} stroke={C.ink} strokeWidth={6} />
      <rect x={-70} y={-362} width={60} height={160} rx={18} fill={t.key} opacity={0.4} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------
const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]}> = ({n, from, dur, beats}) => {
  const f = useCurrentFrame();
  const voice = useVoice();
  const bAt = (id: number) => {
    const b = beats.find((x) => x.id === id);
    return b ? b.at * 30 - from : 0;
  };
  const q = (id: number, d = 20) => ease(f, bAt(id), d);
  const pop = (id: number, d = 18) => spring(f, bAt(id), d);
  const since = (id: number) => f - bAt(id);
  const drift = Math.sin(f / 71.3);
  const acc = voice.accentAt ? voice.accentAt(from + f) : 0;
  const blink = (seed: number) => {
    const p = (f + seed * 37) % 97;
    return p < 4 ? Math.sin((p / 4) * Math.PI) : 0;
  };
  let picture: React.ReactNode = null;
  let zoom = interpolate(f, [0, dur], [1.0, 1.06], {extrapolateRight: 'clamp'});
  let dy = 0;
  let shaft = 0;
  const kick = Math.min(1, beats.reduce((a, b) => {
    const d = f - (b.at * 30 - from);
    return d >= 0 && d < 22 && b.at * 30 >= from && b.at * 30 < from + dur ? a + Math.exp(-d / 6) : a;
  }, 0));

  if (n === 1) {
    // HOOK. Rise off the paper lip to the empty LEAD slot; the hatch slams and a stub drops in at
    // 1.0 s; the kraft price tag swings out asking WHAT'S EXPENSIVE NOW?
    const rise = 1 - ease(f, 0, 30);
    const hatch = f < bAt(2) ? ease(f, bAt(2) - 8, 6) : 1 - ease(f, bAt(2) + 4, 10);
    const drop = ease(f, bAt(2), 9);
    const tagIn = land(f, bAt(3), 18);
    picture = (
      <SVG>
        <Newsroom f={f} id="s1" />
        <Flutter f={f} seed={1} />
        <LeadSlot x={540} y={820} f={f} state={f >= bAt(2) ? 'stub' : 'empty'} hatch={hatch} drop={drop} />
        {since(2) >= 0 && since(2) < 10 && <ImpactStar cx={540} cy={760} r={70 + since(2) * 12} color={C.amber} />}
        <PriceTag x={830} y={600} f={f} scale={tagIn > 0.01 ? 1 : 0.001} front={['WHAT\'S', 'EXPENSIVE', 'NOW?']} back={['CHOOSING']}
          swing={(1 - clamp01(since(3) / 30)) * 30 * Math.sin(since(3) / 3)} size={28} />
        <Plate text="WRITING IT UP · CHEAP" y={1200} size={30} p={ease(f, bAt(2) + 6, 12)} />
        <PaperLip f={f} y={1590} />
        <Motes f={f} />
      </SVG>
    );
    dy = rise * 260;
  } else if (n === 2) {
    // MEET WALTER. Low angle, push in. Walter wakes; record plates drop into its funnel; stories whip out.
    const wake = ease(f, bAt(4), 14);
    const slam = since(8) >= 0 && since(8) < 14 ? since(8) / 14 : 0;
    const slam2 = since(5) >= 0 && since(5) < 12 ? since(5) / 12 : 0;
    const plates = ['MEETINGS', 'NOTICES', 'FILINGS'];
    const gulp = plates.reduce((a, _, i) => {
      const d = f - (bAt(7) + i * 9 + 14);
      return a + (d >= 0 && d < 10 ? Math.sin((d / 10) * Math.PI) : 0);
    }, 0);
    const eject = (i: number) => clamp01((f - bAt(8) - i * 7) / 22);
    picture = (
      <SVG>
        <Newsroom f={f} id="s2" floorY={1640} />
        <DeskTop y={1180} />
        <Flutter f={f} seed={2} n={6} y1={1100} />
        <NewsAgent x={540} y={1210} scale={1.12} f={f} emotion={f < bAt(4) ? 'thoughtful' : since(8) > 0 ? 'focused' : 'happy'}
          blink={f < bAt(4) ? 1 - wake : blink(1)} carriage={Math.max(slam, slam2 * 0.5)} gulp={clamp01(gulp)}
          tongue={0.3 + 0.5 * ease(f, bAt(6), 20)} look={Math.sin(f / 40) * 0.4} nameplate={f >= bAt(5) ? 'ALASKA NEWS' : undefined} />
        {plates.map((p, i) => {
          const a = bAt(7) + i * 9;
          const k = clamp01((f - a) / 16);
          if (k <= 0 || k >= 1) return null;
          const yy = lerp(260, 640, k * k);
          return <RecordPlate key={p} x={lerp(240 + i * 300, 540, k)} y={yy} label={p} rot={(1 - k) * (i - 1) * 20} s={1 - 0.5 * k} />;
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const k = eject(i);
          if (k <= 0) return null;
          return <StorySheet key={i} x={540 + (i - 2) * 190 * k} y={1090 + 260 * k * k} rot={(i - 2) * 30 * k} s={0.8} />;
        })}
        <Plate text="WALTER · AI AGENT" y={480} size={34} p={ease(f, bAt(4) + 4, 12)} tone="ink" />
        <Plate text="MEETINGS · NOTICES · FILINGS" y={540} size={26} p={ease(f, bAt(7), 10) * (1 - ease(f, bAt(8) + 20, 10))} tone="cream" />
        <Motes f={f} />
      </SVG>
    );
    zoom = interpolate(f, [0, dur], [1.0, 1.1], {extrapolateRight: 'clamp'});
  } else if (n === 3) {
    // SIGNATURE. The stories avalanche into nine soft reams; the camera rises with the top ream to
    // the jammed LEAD slot; ALASKA NEWS SAYS stamps the 4,500+.
    const grow = ease(f, bAt(9), 70);
    const reams = 9;
    const topY = 1500 - grow * (reams * 104);
    const rise = ease(f, bAt(9) + 10, Math.max(30, bAt(11) - bAt(9)));
    const stamp = pop(11, 14);
    picture = (
      <g>
        <SVG>
          <Newsroom f={f} id="s3" top={-900} floorY={2150} />
        </SVG>
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${lerp(-760, 0, 1 - rise)}px)`}}>
          <SVG>
            <NewsAgent x={540} y={2250} scale={1.0} f={f} emotion="focused" blink={blink(2)} tongue={0.9} carriage={(f % 18) / 18 < 0.3 ? 0.4 : 0} />
            {Array.from({length: reams}, (_, i) => {
              const k = clamp01(grow * reams - i);
              if (k <= 0) return null;
              const yy = 1500 - i * 104;
              return <Ream key={i} x={540 + Math.sin(i * 1.7) * 14} y={yy + (1 - k) * 60} w={420 - i * 6} h={100} lean={Math.sin(i * 2.1) * 3 * k} curl={0.6} seed={i} />;
            })}
            {Array.from({length: 14}, (_, i) => {
              const h = hash(i * 5 + 1);
              const t = ((f + (h % 40)) % 40) / 40;
              return <StorySheet key={i} x={300 + (h % 480)} y={topY - 40 + t * 380} rot={(h % 60) - 30 + t * 90} s={0.5} />;
            })}
            <LeadSlot x={540} y={480 - 760} f={f} state="jammed" jam={ease(f, bAt(10), 40)} accent={1 - 0.6 * ease(f, bAt(10), 40)} page={false} />
          </SVG>
        </div>
        <SVG>
          <Plate text="FROM THE PUBLIC RECORD" y={1160} size={28} p={ease(f, bAt(9), 12) * (1 - ease(f, bAt(10), 10))} tone="cream" />
          {/* ONE hero treatment for the figure, its attribution riding on it */}
          {since(10) >= 0 && (
            <g transform={`translate(540,${880}) scale(${0.7 + 0.3 * pop(10, 16)})`}>
              <rect x={-250} y={-100} width={500} height={150} fill={C.paper} stroke={C.ink} strokeWidth={8} />
              <text x={0} y={0} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={96} fill={C.ink}>4,500+</text>
              <text x={0} y={36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={2} fill={C.ink}>STORIES</text>
            </g>
          )}
          {stamp > 0.01 && (
            <g transform={`translate(700,1010) rotate(-10) scale(${1.6 - 0.6 * stamp})`} opacity={clamp01(stamp * 2)}>
              <rect x={-170} y={-34} width={340} height={68} fill={C.paper} stroke={C.oxblood} strokeWidth={7} />
              <text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={32} letterSpacing={1.5} fill={C.oxblood}>ALASKA NEWS SAYS</text>
            </g>
          )}
          <Motes f={f} />
        </SVG>
      </g>
    );
    zoom = 1.0 + 0.02 * Math.sin(f / 30);
  } else if (n === 4) {
    // THE INTERVIEW. A chat window titled with Herz's name types itself (no hands, no face); his
    // line slams on screen; the sieve beside the monitor lets everything fall through equally.
    const boot = ease(f, bAt(12), 14);
    const quote = pop(14, 16);
    const sieveShake = since(15) >= 0 ? Math.sin(f * 1.4) * 10 * Math.exp(-Math.max(0, since(15) - 30) / 40) : Math.sin(f / 9) * 2;
    const bubbles = [
      {who: 'P', text: 'WHAT DO YOU DO?', at: bAt(12) + 18},
      {who: 'W', text: 'RECORD-BASED REPORTING', at: bAt(13)},
      {who: 'W', text: 'NOTICES · FILINGS', at: bAt(13) + 22},
    ];
    picture = (
      <SVG>
        <Newsroom f={f} id="s4" windows={true} floorY={1700} />
        <DeskTop y={1130} />
        {/* monitor */}
        <g transform="translate(470,700)">
          <ContactShadow cx={0} cy={445} rx={220} ry={20} opacity={0.3} />
          <rect x={-40} y={330} width={80} height={110} fill="#3C3C36" stroke={C.ink} strokeWidth={6} />
          <rect x={-150} y={430} width={300} height={22} rx={8} fill="#3C3C36" stroke={C.ink} strokeWidth={6} />
          <rect x={-380} y={-300} width={760} height={640} rx={26} fill="#2B2B27" stroke={C.ink} strokeWidth={9} />
          <rect x={-350} y={-270} width={700} height={580} rx={10} fill={boot > 0.5 ? '#ECE7DA' : '#1A1A17'} stroke={C.ink} strokeWidth={4} />
          {boot > 0.5 && (
            <g>
              <rect x={-350} y={-270} width={700} height={64} fill={C.spruceDk} />
              {(() => { assertCropSafe('NAT HERZ · ANCHORAGE PRESS', 700 - 270, 700 - 206); return null; })()}
              <text x={-320} y={-228} fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={1.5} fill={C.cream}>NAT HERZ · ANCHORAGE PRESS</text>
              {bubbles.map((b, i) => {
                const k = ease(f, b.at, 10);
                if (k <= 0) return null;
                const bw = monoW(b.text, 24) + 40;
                const scroll = Math.max(0, (f - bAt(14)) * 0) ;
                const by = -170 + i * 84 - scroll;
                const bx = b.who === 'P' ? -320 : 320 - bw;
                return <g key={i} opacity={k} transform={`translate(0,${(1 - k) * 30})`}>
                  <rect x={bx} y={by} width={bw} height={58} rx={18} fill={b.who === 'P' ? '#FFFFFF' : C.sky} stroke={C.ink} strokeWidth={4} />
                  <text x={bx + bw / 2} y={by + 38} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.ink}>{b.text}</text>
                </g>;
              })}
              {since(16) >= 0 && (
                <g transform="translate(220,150)">
                  <rect x={-70} y={-26} width={140} height={52} rx={18} fill={C.sky} stroke={C.ink} strokeWidth={4} />
                  {[0, 1, 2].map((i) => <circle key={i} cx={-30 + i * 30} cy={-Math.abs(Math.sin((f + i * 6) / 5)) * 8} r={9} fill={C.ink} />)}
                </g>
              )}
            </g>
          )}
        </g>
        <Plate text="VIA DISCORD" x={300} y={1050} size={26} p={ease(f, bAt(13), 10)} tone="kraft" />
        {/* the sieve, on its own stand at the right, everything falls through equally */}
        <g transform={`translate(${880 + sieveShake},980)`}>
          <ContactShadow cx={0} cy={150} rx={120} ry={14} opacity={0.3} />
          <path d="M-60,150 L-30,40 M60,150 L30,40" stroke={C.ink} strokeWidth={10} />
          <ellipse cx={0} cy={0} rx={140} ry={40} fill="#C7BDA4" stroke={C.ink} strokeWidth={8} />
          <ellipse cx={0} cy={0} rx={118} ry={30} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="6 6" />
          {Array.from({length: 12}, (_, i) => {
            const h = hash(i * 9 + 4);
            const t = ((f * 1.3 + (h % 60)) % 60) / 60;
            const isWheat = i % 2 === 0;
            return <g key={i} transform={`translate(${(h % 200) - 100},${40 + t * 240}) rotate(${t * 180})`} opacity={since(15) > -10 ? 1 : 0.4}>
              {isWheat ? <ellipse rx={7} ry={14} fill="#D9A441" stroke={C.ink} strokeWidth={2.5} /> : <path d="M-8,0 L8,-3 L6,4 Z" fill="#B7A27A" stroke={C.ink} strokeWidth={2} />}
            </g>;
          })}
        </g>
        <Plate text="NOTHING RISES" x={850} y={760} size={26} p={ease(f, bAt(15), 10)} tone="oxblood" />
        <QuotePlate lines={['"WHEAT FROM', 'THE CHAFF"']} by="NAT HERZ, TO WALTER" y={560} p={quote * (1 - ease(f, bAt(16) + 30, 10))} rot={-3} />
        <Motes f={f} />
      </SVG>
    );
  } else if (n === 5) {
    // HIERARCHY. Walter's carriage slams and prints its answer; the camera rises up a three-tier
    // rack as every tier fills with identical sheets, the top tier no bigger.
    const slam = since(17) >= 0 && since(17) < 14 ? since(17) / 14 : 0;
    const fillK = ease(f, bAt(18), 60);
    const rise = ease(f, 0, dur);
    picture = (
      <g>
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${lerp(0, 380, rise)}px)`}}>
          <SVG>
            <Newsroom f={f} id="s5" top={-400} floorY={1700} />
            {/* the rack */}
            {[0, 1, 2].map((tier) => {
              const ty = 1300 - tier * 330;
              return <g key={tier}>
                <rect x={130} y={ty} width={820} height={26} fill="#8F653A" stroke={C.ink} strokeWidth={6} />
                <rect x={130} y={ty + 26} width={820} height={10} fill="#000" opacity={0.15} />
                {Array.from({length: 5}, (_, i) => {
                  const k = clamp01(fillK * 15 - (tier * 5 + i));
                  if (k <= 0) return null;
                  return <StorySheet key={i} x={220 + i * 160} y={ty - 96 + (1 - k) * -200} rot={(1 - k) * 30 + Math.sin(i + tier) * 3} s={1.0} />;
                })}
                <text x={110} y={ty + 20} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>{['BOTTOM', 'MIDDLE', 'TOP'][tier]}</text>
              </g>;
            })}
            {[130, 950].map((px) => <rect key={px} x={px - 8} y={600} width={16} height={1100} fill="#7A5430" stroke={C.ink} strokeWidth={5} />)}
          </SVG>
        </div>
        <SVG>
          <NewsAgent x={190} y={1290} scale={0.5} f={f} emotion="earnest" blink={blink(5)} carriage={slam} tongue={0.9} />
          {since(17) >= 0 && (() => {
            const k = clamp01(since(17) / 20);
            return <g transform={`translate(${lerp(190, 540, k)},${lerp(1200, 560, k)}) rotate(${(1 - k) * 25}) scale(${0.4 + 0.6 * k})`}>
              <rect x={-300} y={-90} width={600} height={180} fill={C.paper} stroke={C.ink} strokeWidth={8} />
              <text x={0} y={-12} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={58} fill={C.ink}>"HIERARCHY,</text>
              <text x={0} y={54} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={58} fill={C.ink}>NOT THROUGHPUT"</text>
            </g>;
          })()}
          <Plate text="TOP · MIDDLE · BOTTOM" y={760} size={26} p={ease(f, bAt(18) + 20, 10)} tone="cream" />
          <Motes f={f} />
        </SVG>
      </g>
    );
    zoom = 1.0;
  } else if (n === 6) {
    // THE HEADLINE. Walter's EMS headline slams into the LEAD window in small official type; the
    // dashed EMPTY box draws itself; PENDING stamps the corner on the word; the push fills the box.
    const head = land(f, bAt(19), 10);
    picture = (
      <SVG>
        <Newsroom f={f} id="s6" />
        <Flutter f={f} seed={6} n={5} />
        <LeadSlot x={540} y={820} f={f} state="headline" scale={1.08}
          headline={["ALASKA'S EMS COMPACT TAKES", 'EFFECT SUNDAY; THE NATIONAL', 'COMMISSION STILL LISTS THE', 'STATE AS PENDING']}
          seal={ease(f, bAt(21), 8)} box={f >= bAt(20) ? 'empty' : 'none'} boxPulse={0.5 + 0.5 * Math.sin(f / 6)} />
        {head < 1 && <rect x={0} y={0} width={W} height={H} fill={C.paper} opacity={1 - head} />}
        <PriceTag x={860} y={560} f={f} front={['WHAT\'S', 'EXPENSIVE', 'NOW?']} back={['CHOOSING']} size={24} swing={since(20) >= 0 ? 12 * Math.sin(since(20) / 4) * Math.exp(-since(20) / 20) : 0} />
        <Plate text="WALTER'S HEADLINE" y={480} size={28} p={ease(f, bAt(19) + 6, 10) * (1 - ease(f, bAt(21), 8))} tone="ink" />
        <Plate text="STILL LISTED PENDING" y={480} size={28} p={ease(f, bAt(21) + 6, 10)} tone="oxblood" />
        <Plate text="WHAT'S MISSING?" y={1220} size={34} p={ease(f, bAt(22), 12)} tone="cream" />
        <Motes f={f} />
      </SVG>
    );
    // push into the dashed box from the last beat
    const push = ease(f, bAt(22), Math.max(20, dur - bAt(22)));
    zoom = 1.0 + 0.05 * (f / dur) + 0.5 * push;
    dy = -330 * push;
  } else if (n === 7) {
    // CAN MEDICS USE IT. An unnamed medic beside an ambulance reads it on a phone, squints, shrugs;
    // on the phone Walter's small face goes sheepish; the medic pockets it. The box stays empty.
    const shrug = ease(f, bAt(24), 10) * (1 - ease(f, bAt(24) + 40, 14));
    const pocket = ease(f, bAt(26), 16);
    const truck = interpolate(f, [0, dur], [40, -40]);
    const MX = 650, MY = 1240, MS = 1.15;
    const fist = {x: MX + 120 * MS * -1, y: MY - 190 * MS};
    const phoneY = lerp(fist.y, MY - 120 * MS, pocket);
    const sweep = (Math.sin(f / 3) + 1) / 2;
    picture = (
      <SVG>
        <g transform={`translate(${truck},0)`}>
          <defs>
            <linearGradient id="s7sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#94C5E3" /><stop offset="1" stopColor="#DCEEF5" /></linearGradient>
          </defs>
          <rect x={-100} y={0} width={W + 200} height={H} fill="url(#s7sky)" />
          <path d="M-100,820 L180,700 L420,780 L700,660 L1180,760 L1180,1000 L-100,1000 Z" fill="#7FA59A" stroke={C.ink} strokeWidth={5} />
          <rect x={-100} y={980} width={W + 200} height={360} fill="#C9C1AE" />
          <rect x={-100} y={1300} width={W + 200} height={H - 1300} fill="#A9A08C" />
          <line x1={-100} y1={1300} x2={W + 100} y2={1300} stroke={C.ink} strokeWidth={6} />
          {/* bay door */}
          <rect x={-60} y={640} width={420} height={660} fill="#BFB6A1" stroke={C.ink} strokeWidth={8} />
          {Array.from({length: 10}, (_, i) => <line key={i} x1={-60} y1={700 + i * 60} x2={360} y2={700 + i * 60} stroke="#8E8572" strokeWidth={4} />)}
          <Ambulance x={250} y={1300} f={f} />
          {/* the sweeping light bar's moving rim across the bay */}
          <path d={`M${lerp(-100, 1200, sweep)},600 L${lerp(-100, 1200, sweep) + 140},600 L${lerp(-100, 1200, sweep) + 400},1300 L${lerp(-100, 1200, sweep) + 200},1300 Z`} fill={Math.sin(f / 3) > 0 ? '#7FC8F0' : '#C0473A'} opacity={0.12} />
        </g>
        <Character frame={f} x={MX} y={MY} scale={MS} facing={-1} pose={shrug > 0.05 ? 'panic' : 'carry'} gesture={shrug > 0.05 ? shrug : 1}
          emotion={since(23) > 10 && f < bAt(26) ? 'worried' : 'neutral'} outfit="suit" trim={C.sky} headgear="cap" look={-8} />
        {/* the phone in the medic's fist, Walter's small face on it */}
        {shrug < 0.3 && (
          <g transform={`translate(${fist.x - 6},${phoneY - 40}) rotate(-8)`}>
            <rect x={-46} y={-80} width={92} height={160} rx={14} fill="#1C1C1A" stroke={C.ink} strokeWidth={5} />
            <rect x={-38} y={-68} width={76} height={128} rx={8} fill={since(25) >= 0 ? C.screen : C.paper} />
            {since(25) >= 0 ? (
              <g>
                <rect x={-24} y={-26} width={14} height={8} rx={3} fill={C.glyph} />
                <rect x={10} y={-26} width={14} height={8} rx={3} fill={C.glyph} />
                <ellipse cx={-22} cy={-6} rx={8} ry={4} fill="#E88A7A" />
                <ellipse cx={22} cy={-6} rx={8} ry={4} fill="#E88A7A" />
                <path d="M-12,14 Q0,8 12,16" stroke={C.glyph} strokeWidth={4} fill="none" />
              </g>
            ) : (
              <g>{[0, 1, 2, 3, 4].map((r) => <rect key={r} x={-30} y={-58 + r * 22} width={r === 0 ? 60 : 48} height={r === 0 ? 10 : 6} fill={r === 0 ? C.ink : C.newsprint} />)}</g>
            )}
          </g>
        )}
        {/* a big inset of the phone so the face reads */}
        {since(25) >= 0 && f < bAt(26) + 6 && (
          <g transform={`translate(330,620) scale(${0.6 + 0.4 * pop(25, 14)})`}>
            <circle r={150} fill={C.paper} stroke={C.ink} strokeWidth={8} />
            <NewsAgent x={0} y={170} scale={0.5} f={f} emotion="sheepish" shadow={false} blink={blink(7)} tongue={0.2} />
          </g>
        )}
        <Plate text="NOTHING FALSE" y={480} size={30} p={ease(f, bAt(23) + 6, 10) * (1 - ease(f, bAt(24), 8))} tone="cream" />
        <Plate text="MEDICS?" x={800} y={560} size={40} p={ease(f, bAt(24), 8) * (1 - ease(f, bAt(25), 8))} tone="oxblood" />
        <Plate text="WALTER · SHOULD HAVE SAID IT" y={480} size={26} p={ease(f, bAt(25) + 4, 10)} tone="ink" />
        <Plate text="EMS" x={250} y={1060} size={24} p={ease(f, bAt(26), 10)} tone="cream" />
        <Motes f={f} op={0.2} />
      </SVG>
    );
    zoom = 1.02;
  } else if (n === 8) {
    // THE TEST. Crane down into a council chamber Walter never enters: a transcript ribbon feeds out
    // of a wall slot toward an off-screen hopper, a phone rings at the empty PRESS chair, stamps
    // land, then an unnamed reporter walks in and answers.
    const crane = 1 - ease(f, 0, 40);
    const ringing = f < bAt(30) + 6;
    const walk = clamp01((f - bAt(30) + 30) / 40);
    const RX = lerp(1200, 690, walk);
    const answered = ease(f, bAt(30) + 14, 10);
    const panel = tones('#8A5F3E');
    picture = (
      <SVG>
        <rect width={W} height={H} fill={panel.core} />
        {Array.from({length: 7}, (_, i) => <rect key={i} x={i * 160 - 20} y={300} width={140} height={900} fill={panel.base} stroke={C.ink} strokeWidth={5} />)}
        {/* high windows */}
        {[160, 540, 920].map((wx) => <rect key={wx} x={wx - 80} y={140} width={160} height={140} fill="#D6EAF4" stroke={C.ink} strokeWidth={6} />)}
        {/* the dais */}
        <rect x={60} y={720} width={960} height={140} fill={panel.shade} stroke={C.ink} strokeWidth={8} />
        {[220, 420, 660, 860].map((cx) => <g key={cx}><rect x={cx - 6} y={650} width={12} height={70} fill="#333" /><circle cx={cx} cy={644} r={14} fill="#333" /></g>)}
        {/* the transcript ribbon feeding out of a wall slot to an off-screen hopper */}
        <rect x={930} y={430} width={120} height={30} fill="#222" stroke={C.ink} strokeWidth={5} />
        <path d={`M990,460 C1000,560 1060,600 1120,640`} fill="none" stroke={C.paper} strokeWidth={26} />
        <path d={`M990,460 C1000,560 1060,600 1120,640`} fill="none" stroke={C.ink} strokeWidth={30} strokeDasharray={`2 ${24}`} strokeDashoffset={-f * 2} opacity={0.5} />
        {/* floor */}
        <rect x={0} y={1200} width={W} height={H - 1200} fill="#6E4C33" />
        <line x1={0} y1={1200} x2={W} y2={1200} stroke={C.ink} strokeWidth={6} />
        {/* press table */}
        <rect x={300} y={1010} width={560} height={30} fill={panel.key} stroke={C.ink} strokeWidth={6} />
        <rect x={320} y={1040} width={20} height={170} fill={panel.shade} />
        <rect x={820} y={1040} width={20} height={170} fill={panel.shade} />
        <Chair x={560} y={1290} rock={answered > 0.5 ? 0 : Math.sin(f / 4) * 2 * (ringing ? 1 : 0)} />
        <DeskPhone x={430} y={1010} f={f} ringing={ringing} lifted={answered} />
        {/* the PRESS card on the table */}
        <g transform="translate(700,990)">
          <path d="M-70,0 L-50,-50 L50,-50 L70,0 Z" fill={C.cream} stroke={C.ink} strokeWidth={5} />
          <text x={0} y={-16} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>PRESS</text>
        </g>
        {/* the reporter: walks in, stops at the table, answers, writes */}
        {walk > 0 && (
          <Character frame={f} x={RX} y={1300} scale={1.05} facing={-1} walking={walk < 1} walkPhase={walk * 7}
            pose={answered > 0.5 ? 'carry' : 'stand'} emotion="neutral" outfit="flannel" headgear="bare" hairStyle="long" hair="#5A3A22" look={-6} />
        )}
        {[0, 1, 2].map((i) => {
          const k = pop(29, 12);
          const kk = clamp01(spring(f, bAt(29) + i * 8, 14));
          return kk > 0.01 ? <g key={i} transform={`translate(540,${560 + i * 92}) rotate(${-8 + i * 5}) scale(${1.5 - 0.5 * kk})`} opacity={clamp01(kk * 2) * (1 - ease(f, bAt(30), 12)) * (k > 0 ? 1 : 1)}>
            {(() => { const t = ['NO CALLS', 'NO MEETINGS', 'NO INTERVIEWS'][i]; const w = monoW(t, 40) + 50; return <g>
              <rect x={-w / 2} y={-32} width={w} height={64} fill="none" stroke={C.oxblood} strokeWidth={7} />
              <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={2} fill={C.oxblood}>{t}</text></g>; })()}
          </g> : null;
        })}
        <Plate text="THE CASE AGAINST" y={480} size={34} p={ease(f, bAt(27) + 8, 12) * (1 - ease(f, bAt(29), 8))} tone="ink" />
        <Plate text="REPORTING STILL TAKES PEOPLE" y={480} size={28} p={ease(f, bAt(30) + 10, 12)} tone="amber" />
        {since(31) >= 0 && <Plate text="NOTES" x={850} y={900} size={24} p={ease(f, bAt(31), 8)} tone="kraft" />}
        <Motes f={f} op={0.25} />
      </SVG>
    );
    dy = -crane * 300;
    zoom = 1.0 + 0.05 * (f / dur);
  } else if (n === 9) {
    // UP FIRST, CHECKED AFTER. Overhead belt: stories ride past NO HUMAN BEFORE straight into the
    // LEAD slot; a CHECKED AFTER stamp drops from off frame onto one already in; another slides on top.
    const belt = f * 4;
    const stampK = pop(33, 12);
    picture = (
      <SVG>
        <rect width={W} height={H} fill="#9E9580" />
        {Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={i * 170} x2={W} y2={i * 170} stroke="#8A826E" strokeWidth={4} />)}
        {/* belt */}
        <rect x={-20} y={760} width={W + 40} height={220} fill="#3A3A34" stroke={C.ink} strokeWidth={8} />
        {Array.from({length: 16}, (_, i) => <line key={i} x1={((i * 80 + belt) % 1280) - 100} y1={764} x2={((i * 80 + belt) % 1280) - 100} y2={976} stroke="#55554C" strokeWidth={6} />)}
        {/* the gate, arm UP: nobody stops anything */}
        <g transform="translate(330,760)">
          <rect x={-20} y={-160} width={40} height={160} fill={C.spruce} stroke={C.ink} strokeWidth={6} />
          <rect x={-10} y={-420} width={20} height={270} fill="#D8D2C2" stroke={C.ink} strokeWidth={5} transform="rotate(8)" />
        </g>
        {Array.from({length: 6}, (_, i) => {
          const xx = ((i * 230 + belt * 1.0) % 1380) - 260;
          if (xx > 770) return null;
          return <StorySheet key={i} x={xx} y={870} rot={-90 + Math.sin(i) * 6} s={0.95} />;
        })}
        {/* the same LEAD slot at the end of the belt, filled with nobody choosing */}
        <LeadSlot x={880} y={870} f={f} state="story" page={false} scale={0.62} />
        <StorySheet x={880} y={870 - 12 * ease(f, bAt(34), 12)} rot={-90} s={1.05} checked={since(33) >= 0 ? stampK : 0} />
        {since(34) >= 0 && <StorySheet x={lerp(700, 880, ease(f, bAt(34), 16))} y={850} rot={-86} s={1.05} />}
        {/* the stamp, from off frame (no hand) */}
        {since(33) > -16 && (
          <g transform={`translate(880,${lerp(-200, 760, ease(f, bAt(33) - 16, 16)) - (since(33) > 4 ? ease(f, bAt(33) + 4, 14) * 900 : 0)})`}>
            <rect x={-70} y={-160} width={140} height={120} rx={14} fill={C.spruceDk} stroke={C.ink} strokeWidth={6} />
            <rect x={-90} y={-40} width={180} height={40} fill={C.oxblood} stroke={C.ink} strokeWidth={6} />
          </g>
        )}
        <Plate text="NO HUMAN BEFORE" x={330} y={520} size={30} p={ease(f, bAt(32), 10)} tone="oxblood" />
        <Plate text="CALE GREEN · EDITOR · AFTER" x={600} y={1160} size={28} p={ease(f, bAt(33) + 6, 10)} tone="ink" />
        <Plate text="NEXT STORY" x={640} y={680} size={26} p={ease(f, bAt(34), 8)} tone="cream" />
        <Motes f={f} op={0.15} />
      </SVG>
    );
    zoom = 1.0 + 0.04 * (f / dur);
  } else if (n === 10) {
    // HERZ'S COUNTER, at full strength. A moose labelled REPORTERS WHO DISCOUNT AI has its head in
    // the sand; the quote plaque (attributed to Herz, set apart from the animal) slams down; a sheet
    // lands on the moose's back and it pulls its head out and blinks at the paper.
    const out = ease(f, bAt(37) + 6, 16);
    const sheetK = ease(f, bAt(37) - 20, 22);
    const rise = ease(f, 0, dur);
    picture = (
      <SVG>
        <defs>
          <linearGradient id="s10sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7DB8DE" /><stop offset="1" stopColor="#E2F0F4" /></linearGradient>
          <radialGradient id="s10sun" cx="0.5" cy="0.5" r="0.5"><stop stopColor="#FFF6C8" /><stop offset="1" stopColor="#FFF6C8" stopOpacity={0} /></radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#s10sky)" />
        <circle cx={880} cy={300} r={260} fill="url(#s10sun)" />
        <circle cx={880} cy={300} r={70} fill="#FFF3B8" stroke={C.ink} strokeWidth={5} />
        <path d="M-50,1080 C200,920 420,980 620,900 C820,820 980,900 1130,860 L1130,1920 L-50,1920 Z" fill={C.sandLo} />
        <path d="M-50,1200 C260,1060 520,1120 760,1060 C900,1020 1020,1060 1130,1040 L1130,1920 L-50,1920 Z" fill={C.sand} stroke={C.ink} strokeWidth={6} />
        {Array.from({length: 7}, (_, i) => <path key={i} d={`M${80 + i * 140},${1200 + (i % 2) * 30} q30,-50 60,0`} fill="none" stroke={C.sandLo} strokeWidth={4} />)}
        {/* grass tufts swaying */}
        {[120, 940, 1000].map((gx, i) => <path key={gx} d={`M${gx},1180 q${8 + Math.sin(f / 9 + i) * 8},-60 ${20 + Math.sin(f / 9 + i) * 10},-90 M${gx + 10},1180 q${-6 + Math.sin(f / 10 + i) * 6},-50 ${-14},-70`} fill="none" stroke="#6F8A4A" strokeWidth={6} strokeLinecap="round" />)}
        <g transform={`translate(0,${-out * 40})`}>
          <Moose x={470} y={1250} scale={1.25} f={f} facing={1} emotion={out > 0.5 ? 'wary' : 'calm'} alert={out} />
        </g>
        {/* the sand mound over the head until it comes out */}
        <g opacity={1 - out}>
          <path d="M610,1180 C640,1050 820,1040 860,1180 Z" fill={C.sand} stroke={C.ink} strokeWidth={6} />
          {Array.from({length: 5}, (_, i) => <circle key={i} cx={650 + i * 45} cy={1170 - ((f * 2 + i * 13) % 60)} r={4} fill={C.sandLo} />)}
        </g>
        {out > 0.01 && Array.from({length: 8}, (_, i) => <circle key={i} cx={740 + i * 12} cy={1060 + out * 120 + i * 9} r={5} fill={C.sandLo} opacity={1 - out * 0.6} />)}
        {/* the sheet blown off the belt, landing on the moose's back */}
        <StorySheet x={lerp(-80, 430, sheetK)} y={lerp(600, 1000, sheetK) - Math.sin(sheetK * Math.PI) * 120} rot={lerp(-60, 8, sheetK)} s={0.7} />
        <Plate text="REPORTERS WHO DISCOUNT AI" x={420} y={1240} size={26} p={ease(f, bAt(35) + 4, 10)} tone="cream" />
        <QuotePlate lines={['"BURYING THEIR HEADS', 'IN THE SAND"']} by="NAT HERZ, ANCHORAGE PRESS EDITOR" y={560} size={48} p={pop(36, 16)} rot={2} />
        <Plate text="HEAD OUT" x={830} y={880} size={26} p={ease(f, bAt(37) + 8, 10)} tone="kraft" />
        <Motes f={f} color="#FFF0C0" />
      </SVG>
    );
    dy = lerp(60, -60, rise);
    zoom = 1.0 + 0.03 * rise;
  } else if (n === 11) {
    // THE HARD PART. A fat amber arrow swings off Walter's endless pile onto the single LEAD slot;
    // the one hard sun shaft lands on the slot alone, and the price tag flips to CHOOSING.
    const sw = land(f, bAt(38), 26);
    const flip = ease(f, bAt(39), 14);
    shaft = ease(f, bAt(39) - 4, 12);
    const ang = lerp(-60, 0, sw);
    picture = (
      <SVG>
        <Newsroom f={f} id="s11" />
        {/* the endless pile on the left, slumping */}
        {Array.from({length: 7}, (_, i) => <Ream key={i} x={220} y={1500 - i * 92 + ease(f, bAt(38), 20) * i * 4} w={300} h={90} lean={Math.sin(i * 1.3) * 4} seed={i + 20} />)}
        <NewsAgent x={220} y={1500 - 7 * 92} scale={0.42} f={f} emotion="focused" blink={blink(11)} shadow={false} />
        <LeadSlot x={760} y={820} f={f} state="empty" scale={0.78} shaft={shaft} accent={0.6 + 0.4 * shaft} />
        <PriceTag x={960} y={540} f={f} front={['WHAT\'S', 'EXPENSIVE', 'NOW?']} back={['CHOOSING', 'THE TOP', 'STORY']} flip={flip} size={26} />
        {/* the fat arrow, pivoting from the pile toward the slot */}
        <g transform={`translate(300,1060) rotate(${ang})`} opacity={ease(f, bAt(38) - 4, 6)}>
          <path d="M0,-34 L300,-34 L300,-74 L400,0 L300,74 L300,34 L0,34 Z" fill={C.amber} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
          <path d="M10,-22 L290,-22" stroke="#FFFFFF" strokeWidth={8} opacity={0.4} />
        </g>
        <Plate text="WRITING · CHEAP" x={240} y={1200} size={26} p={ease(f, bAt(38), 10)} tone="cream" />
        <Plate text="CHOOSING THE TOP STORY" x={640} y={1210} size={30} p={ease(f, bAt(39) + 10, 12)} tone="amber" />
        <Motes f={f} n={40} op={0.4 + 0.4 * shaft} />
      </SVG>
    );
    dy = 0;
    zoom = 1.0 + 0.04 * (f / dur);
  } else if (n === 12) {
    // A REAL TRUST BURDEN. Across the room from the slot: the ALASKA NEWS masthead takes the two
    // plates the Press reported, level and still; Walter looks up, its screen prints its own words,
    // and its gaze turns to the empty slot off frame.
    const plates = ease(f, bAt(40), 16);
    const settle = since(41) >= 0 ? Math.sin(since(41) / 4) * 6 * Math.exp(-since(41) / 14) : (plates < 1 ? (1 - plates) * 10 : 0);
    const typed = ease(f, bAt(42), 50);
    const turn = ease(f, bAt(43), 20);
    picture = (
      <SVG>
        <Newsroom f={f} id="s12" windows={false} />
        <DeskTop y={1250} />
        {/* the masthead sign on wires */}
        <g transform="translate(540,470)">
          <line x1={-300} y1={-200} x2={-300} y2={-40} stroke={C.ink} strokeWidth={4} />
          <line x1={300} y1={-200} x2={300} y2={-40} stroke={C.ink} strokeWidth={4} />
          <rect x={-380} y={-40} width={760} height={110} fill={C.paper} stroke={C.ink} strokeWidth={8} />
          <text x={0} y={34} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={68} fill={C.ink}>ALASKA NEWS</text>
          {[{t: 'CONSERVATIVE POLLSTER', x: -190}, {t: "GOVERNOR'S SPOKESPERSON", x: 190}].map((p, i) => {
            const k = clamp01(plates * 2 - i * 0.6);
            if (k <= 0) return null;
            const w = monoW(p.t, 22) + 30;
            return <g key={p.t} transform={`translate(${p.x},${70}) rotate(${settle * (i ? -1 : 1)})`} opacity={k}>
              <line x1={-w / 3} y1={0} x2={-w / 3} y2={60} stroke={C.ink} strokeWidth={3} />
              <line x1={w / 3} y1={0} x2={w / 3} y2={60} stroke={C.ink} strokeWidth={3} />
              <rect x={-w / 2} y={60} width={w} height={44} fill={C.cream} stroke={C.ink} strokeWidth={4} />
              <text x={0} y={90} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>{p.t}</text>
            </g>;
          })}
        </g>
        <Plate text="PER THE ANCHORAGE PRESS" y={740} size={26} p={ease(f, bAt(41), 10)} tone="kraft" />
        <NewsAgent x={540} y={1280} scale={0.9} f={f} emotion={since(42) >= 0 ? 'earnest' : 'thoughtful'} blink={blink(12)}
          lookY={since(42) < 0 ? -1 : 0} look={lerp(0, 1, turn)} screenText={since(42) >= 0 && typed < 1.2 && since(43) < 0 ? ['A REAL', 'TRUST', 'BURDEN'] : undefined} typed={typed}
          carriage={since(42) >= 0 && since(42) < 14 ? since(42) / 14 : 0} tongue={0.4} />
        <Plate text={'"A REAL TRUST BURDEN"'} y={860} size={34} p={ease(f, bAt(42) + 30, 12)} tone="cream" />
        <Plate text="WALTER, TO THE PRESS" y={940} size={24} p={ease(f, bAt(42) + 40, 12)} tone="ink" />
        <Motes f={f} />
      </SVG>
    );
    zoom = 1.0 + 0.06 * (f / dur);
  } else if (n === 13) {
    // BUTTON. Rising pull-back to the whole 4,500 pile under the one sunlit slot; a single sheet rises
    // into it; the dashed box fills CAN MEDICS USE IT YET?; the medic steps in, pulls the sheet, nods;
    // the hatch clanks and drops a new stub: frame 1 again.
    const pull = ease(f, 0, 60);
    const sheetUp = ease(f, bAt(44), 50);
    const fillK = ease(f, bAt(47), 8);
    const walk = clamp01((f - bAt(45) + 20) / 36);
    const MX = lerp(1200, 820, walk);
    const pullOut = ease(f, bAt(47) + 18, 14);
    const hatch = since(47) > 10 ? Math.sin(clamp01((since(47) - 10) / 14) * Math.PI) : 0;
    shaft = 1;
    picture = (
      <SVG>
        <Newsroom f={f} id="s13" />
        {Array.from({length: 4}, (_, c) => Array.from({length: 6}, (_, r) => (
          <Ream key={`${c}${r}`} x={150 + c * 260} y={1560 - r * 86} w={240} h={84} lean={Math.sin(c * 3 + r) * 3} seed={c * 7 + r} band={(c + r) % 2 === 0} />
        )))}
        <LeadSlot x={540} y={760} f={f} state="headline" scale={0.86} shaft={shaft}
          headline={["ALASKA'S EMS COMPACT TAKES", 'EFFECT SUNDAY; THE NATIONAL', 'COMMISSION STILL LISTS THE', 'STATE AS PENDING']}
          box={fillK > 0.01 ? 'filled' : 'empty'} question={['CAN MEDICS USE IT YET?']} fill={fillK} hatch={hatch}
          boxPulse={0.5 + 0.5 * Math.sin(f / 6)} />
        {/* the one sheet rising out of the pile toward the slot */}
        {sheetUp > 0.01 && fillK < 0.99 && <StorySheet x={540} y={lerp(1100, 960, sheetUp)} s={0.7} rot={Math.sin(f / 8) * 4} />}
        {walk > 0 && (
          <Character frame={f} x={MX} y={1500} scale={0.95} facing={-1} walking={walk < 1} walkPhase={walk * 6}
            pose={pullOut > 0.1 ? 'carry' : 'point'} gesture={pullOut > 0.1 ? 1 : ease(f, bAt(46), 14)} emotion={pullOut > 0.3 ? 'smug' : 'neutral'}
            outfit="suit" trim={C.sky} headgear="cap" look={-14} />
        )}
        {pullOut > 0.1 && <StorySheet x={MX - 120 * 0.95} y={1500 - 190 * 0.95 - 40} s={0.55} rot={-10} />}
        <Plate text="WHAT ALASKANS READ FIRST" y={480} size={28} p={ease(f, bAt(44) + 8, 12) * (1 - ease(f, bAt(46), 10))} tone="ink" />
        <Plate text="ONE STORY ON TOP" x={300} y={1180} size={26} p={ease(f, bAt(45), 10) * (1 - ease(f, bAt(47), 8))} tone="amber" />
        <Plate text="THE WRITING'S CHEAP" y={480} size={28} p={ease(f, bAt(46) + 4, 10) * (1 - ease(f, bAt(47) + 30, 10))} tone="cream" />
        <Motes f={f} n={40} op={0.6} />
      </SVG>
    );
    zoom = lerp(1.18, 1.0, pull);
    dy = lerp(-140, 0, pull);
  }

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${drift * 6 + Math.sin(f * 2.3) * 3 * kick}px, ${dy + Math.cos(f * 1.9) * 2.4 * kick}px) scale(${zoom * (1 + 0.02 * kick)})`}}>
        {picture}
      </div>
      <DayGrade f={f} amount={0.85} haze={0.2} sunX={shaft > 0 ? 760 : undefined} sunY={shaft > 0 ? 300 : undefined} sunIntensity={0.25 + 0.35 * shaft} />
      <GradeLayer f={f} bloom={0.05 + acc * 0.06 + shaft * 0.05} vignette={0.24} grain={0.04} warmth={0.05} />
    </AbsoluteFill>
  );
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1003Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1003Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:100 900;font-display:block;}`}</style>
);

export const Ep1003: React.FC<Props> = ({captions: cues = [], scenes, beats, credits, mouth = [], accents = []}) => {
  const fallback = [0, 7.26, 18.23, 26.1, 39.72, 44.94, 55.99, 65.98, 79.07, 86.41, 94.81, 101.09, 114.71, 126.0]
    .map((x) => Math.round(x * 30));
  const slots = scenes ?? fallback.slice(0, -1).map((from, i) => ({from, dur: fallback[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  void Raven;
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.wall}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={i + 1} from={s.from} dur={s.dur} beats={bs} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><Captions cues={cues} /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
