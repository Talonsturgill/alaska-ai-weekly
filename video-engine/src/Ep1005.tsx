import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, DayGrade, ContactShadow, tones} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {Character} from './lib/Character';
import {Raven} from './lib/fauna';
import {ImpactStar} from './lib/FX';
import {HandSil} from './lib/stack';
import {ClassroomDoor, Glyph, HandbookPlate, HallWall, COR, corW, GlyphKind} from './lib/corridor';

// EVERY DOOR, 2026-10-05.
// Palette roles are art_direction.json: seafoam corridor, dusty-blue lockers, PLUM doors, navy ink,
// brushed-nickel hardware, a speckled gray-green VCT floor, and ONE coral accent that only ever
// means an AI rule applied or counted (the glyph on a sign, a citation slip under it, the +73%
// delta, the sparks). The same coral AI glyph rides every sign; only the navy verdict mark beside
// it differs. Named people are plates only (Stephanie Erickson), no face, no body. Every painted
// string is a claims.json on_screen string, the quote, or the closing question.
const W = 1080, H = 1920;
const CAPTION_TOP = 1330;
const CAP_GUARD = CAPTION_TOP - 34;
type Beat = {id: number; at: number; label: string};

const C = {...COR, navy: COR.ink, lockerHi: '#8FB0C9', wood: '#4A3A44', woodHi: '#6A5560', board: '#2B3A4A', peach: '#FFE2C8', peachDk: '#FFB9A0'};
const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
/** anticipation, overshoot, settle. For pops and landings only, never for travel. */
const spring = (f: number, a: number, d = 20) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.pow(2, -9 * t) * Math.cos((t * d - 1.2) * 0.9);
};
/** a travel ease with a small decaying settle at the end */
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

type Tone = 'ink' | 'enamel' | 'coral' | 'slip' | 'nickel' | 'plum';
const plateW = (text: string, size: number, ls = 1.5) => corW(text, size, ls) + 56;

/** A mono plate, sized to its string by arithmetic, kept out of the caption band and crop lines. */
const Plate: React.FC<{text: string; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> =
({text, x = 540, y, size = 30, tone = 'ink', p = 1, rot = 0}) => {
  const w = plateW(text, size), h = size + 30;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(text, yy - h / 2, yy + h / 2);
  const fill = {ink: C.navy, enamel: C.paper, coral: C.coral, slip: C.slip, nickel: C.brass, plum: C.oak}[tone];
  const fg = tone === 'ink' || tone === 'plum' ? C.paper : C.navy;
  const k = clamp01(p);
  if (k <= 0.01) return null;
  return (
    <g opacity={Math.min(1, k * 1.6)} transform={`translate(${x} ${yy}) rotate(${rot}) scale(${0.86 + 0.14 * spring(k * 20, 0, 20)})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 7} width={w} height={h} rx={6} fill="#000" opacity={0.22} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={fill} stroke={C.navy} strokeWidth={4} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
        fontSize={size} letterSpacing={1.5} fill={fg}>{text}</text>
    </g>
  );
};

/** A big boxed quote: serif type on enamel, a navy frame, the attribution under it. The claim and
 *  its attribution are ONE plate (DISPATCH_STANDARD 9). Serif caps run about 0.68 em a character. */
const QuotePlate: React.FC<{lines: string[]; by?: string; x?: number; y: number; size?: number; p?: number; rot?: number}> =
({lines, by, x = 540, y, size = 46, p = 1, rot = 0}) => {
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const tw = Math.max(...lines.map((l) => l.length * size * 0.68), by ? corW(by, 22) : 0) + 90;
  const th = lines.length * (size + 10) + (by ? 46 : 0) + 40;
  assertCropSafe(lines.join(' '), y - th / 2, y + th / 2);
  const s = 0.6 + 0.4 * spring(k * 18, 0, 18);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={Math.min(1, k * 2)}>
      <rect x={-tw / 2 + 10} y={-th / 2 + 12} width={tw} height={th} fill="#000" opacity={0.25} />
      <rect x={-tw / 2} y={-th / 2} width={tw} height={th} fill={C.paper} stroke={C.navy} strokeWidth={8} />
      <rect x={-tw / 2 + 12} y={-th / 2 + 12} width={tw - 24} height={th - 24} fill="none" stroke={C.navy} strokeWidth={2.5} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-th / 2 + 26 + size * 0.86 + i * (size + 10)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={C.navy}>{l}</text>
      ))}
      {by && <text x={0} y={th / 2 - 26} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={1} fill={C.coralDk}>{by}</text>}
    </g>
  );
};

/** Dust motes in tube light, the always-running ambient layer. */
const Motes: React.FC<{f: number; n?: number; y0?: number; y1?: number; op?: number; color?: string}> = ({f, n = 26, y0 = 300, y1 = 1500, op = 0.3, color = '#F4FFF8'}) => (
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

/** The near plane: a nickel-framed bench with backpacks along the lower frame, moving at 1.35 x the camera. */
const NearBench: React.FC<{cam: number; y?: number; seed?: number}> = ({cam, y = 1560, seed = 0}) => {
  const items = [0, 1, 2, 3];
  const sp = 760;
  const off = ((cam * 1.35) % sp + sp) % sp;
  return (
    <g>
      {items.map((i) => {
        const bx = -200 + i * sp - off;
        const h = hash(i + seed);
        return (
          <g key={i} transform={`translate(${bx},${y})`}>
            <ContactShadow cx={200} cy={190} rx={260} ry={22} opacity={0.35} blur={10} />
            <rect x={0} y={60} width={420} height={26} fill={C.oakDk} stroke={C.navy} strokeWidth={6} />
            <rect x={0} y={66} width={420} height={8} fill={C.oak} opacity={0.8} />
            {[18, 380].map((lx) => <rect key={lx} x={lx} y={86} width={22} height={104} fill={C.brass} stroke={C.navy} strokeWidth={5} />)}
            <g transform={`translate(${70 + (h % 160)},0)`}>
              <rect x={0} y={-12} width={96} height={74} rx={26} fill={C.locker} stroke={C.navy} strokeWidth={6} />
              <rect x={14} y={14} width={68} height={34} rx={10} fill={C.lockerDk} stroke={C.navy} strokeWidth={4} />
              <circle cx={48} cy={-14} r={9} fill={C.lockerDk} stroke={C.navy} strokeWidth={4} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

// --- a row of doors in WORLD space, scaled about the floor line ------------------------------
const DOOR_GAP = 330;
const doorX = (i: number) => 200 + i * DOOR_GAP;

type DoorOpts = {glyph?: GlyphKind; flip?: number; state?: 'shut' | 'ajar' | 'open' | 'dark' | 'glow'; swing?: number; lamp?: number; eyes?: number; slip?: number; inside?: React.ReactNode};

const DoorRow: React.FC<{f: number; cam: number; k: number; floorY: number; n: number; opts: (i: number, sx: number) => DoorOpts; x0?: number}> =
({f, cam, k, floorY, n, opts, x0 = 0}) => (
  <g transform={`translate(540,${floorY}) scale(${k}) translate(${-cam},0)`}>
    {Array.from({length: n}, (_, i) => {
      const wx = x0 + doorX(i);
      const sx = 540 + (wx - cam) * k;
      if (sx < -420 || sx > W + 420) return null;
      return <ClassroomDoor key={i} x={wx} y={0} scale={1} f={f} phase={i * 0.37} {...opts(i, sx)} />;
    })}
  </g>
);

/** The verdict mark that rides next to the one coral glyph (the glyph is always the same). */
const VERDICTS: GlyphKind[] = ['ok', 'ban', 'ask', 'none', 'ban', 'ok', 'ask', 'none'];

// --- the wall of lockers, slips and the flip-board ---------------------------------------------
const LockerBank: React.FC<{x: number; y: number; w: number; h: number; cols?: number; rows?: number; dim?: number}> = ({x, y, w, h, cols = 10, rows = 4, dim = 0}) => {
  const cw = w / cols, ch = h / rows;
  const lk = tones(C.locker);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={lk.shade} stroke={C.navy} strokeWidth={6} />
      {Array.from({length: cols * rows}, (_, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        return (
          <g key={i}>
            <rect x={x + c * cw + 3} y={y + r * ch + 3} width={cw - 6} height={ch - 6} fill={r % 2 ? lk.base : lk.key} stroke={C.navy} strokeWidth={3.5} opacity={1 - dim * 0.5} />
            <rect x={x + c * cw + cw * 0.2} y={y + r * ch + 12} width={cw * 0.6} height={4} fill={lk.shade} opacity={0.8} />
            <circle cx={x + c * cw + cw * 0.78} cy={y + r * ch + ch * 0.55} r={3.5} fill={C.paper} stroke={C.navy} strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
};

/** A citation slip: butter paper with a text-free rule line and, when `hit`, one coral dot (an AI rule applied). */
const Slip: React.FC<{x: number; y: number; rot?: number; s?: number; hit?: number; op?: number}> = ({x, y, rot = 0, s = 1, hit = 0, op = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={op}>
    <rect x={-22} y={-29} width={44} height={58} fill="#000" opacity={0.2} transform="translate(4,5)" />
    <rect x={-22} y={-29} width={44} height={58} fill={C.slip} stroke={C.navy} strokeWidth={3} />
    <rect x={-14} y={-18} width={28} height={4} fill={C.navy} opacity={0.5} />
    <rect x={-14} y={-9} width={20} height={4} fill={C.navy} opacity={0.5} />
    {hit > 0.02 && <circle cx={7} cy={14} r={8 * Math.min(1.25, 0.5 + hit)} fill={C.coral} stroke={C.navy} strokeWidth={2.5} />}
  </g>
);

/** A wall flip-board tally: three digit cards on a nickel frame that count up and lock with a hard clack. */
const FlipBoard: React.FC<{x: number; y: number; s?: number; value: number; clack?: number}> = ({x, y, s = 1, value, clack = 0}) => {
  const v = Math.max(0, Math.round(value));
  const digits = String(v).padStart(3, ' ').split('');
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${clack * Math.sin(clack * 40) * 0.8})`}>
      <rect x={-210} y={-120} width={420} height={240} rx={14} fill={C.brass} stroke={C.navy} strokeWidth={8} />
      <rect x={-196} y={-106} width={392} height={212} rx={8} fill={C.board} stroke={C.navy} strokeWidth={4} />
      {digits.map((d, i) => (
        <g key={i} transform={`translate(${-132 + i * 132},0)`}>
          <rect x={-52} y={-80} width={104} height={160} rx={8} fill="#F4F2EA" stroke={C.navy} strokeWidth={5} />
          <line x1={-52} y1={0} x2={52} y2={0} stroke={C.navy} strokeWidth={5} />
          <text x={0} y={46} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={128} fill={C.navy}>{d}</text>
          <rect x={-52} y={-80} width={104} height={20} rx={6} fill="#FFFFFF" opacity={0.25} />
        </g>
      ))}
    </g>
  );
};

/** A faceless hand (stack.tsx HandSil, navy sleeve) used for the tape, the pen and the chalk. */
const Hand: React.FC<{x: number; y: number; rot?: number; s?: number; curl?: number}> = ({x, y, rot = 0, s = 0.8, curl = 0}) => {
  // a held hand still breathes: a slow weight shift, a micro-press and a finger settle
  const hf = useCurrentFrame();
  return <HandSil x={x + Math.sin(hf / 21) * 4} y={y + Math.sin(hf / 15) * 5} rot={rot + Math.sin(hf / 19) * 2.2} s={s} curl={clamp01(curl + Math.sin(hf / 13) * 0.07)} fill={C.navy} />;
};

// --- the regents folder, one object used in S7, S8 and S13 -------------------------------------
const Folder: React.FC<{x: number; y: number; s?: number; tape?: number; open?: number; glyph?: boolean; rot?: number}> = ({x, y, s = 1, tape = 1, open = 0, glyph = true, rot = 0}) => {
  const ff = useCurrentFrame();
  const o = clamp01(open);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot + Math.sin(ff / 40) * 0.5}) scale(${s * (1 + Math.sin(ff / 28) * 0.006)})`}>
      <rect x={-250 + 14} y={-180 + 18} width={500} height={360} fill="#000" opacity={0.28} />
      {/* the inside leaf */}
      <rect x={-250} y={-180} width={500} height={360} fill={C.slip} stroke={C.navy} strokeWidth={8} />
      <rect x={-230} y={-160} width={460} height={320} fill={C.paper} stroke={C.navy} strokeWidth={3} opacity={o} />
      {/* the cover, hinged on the left, foreshortening as it opens */}
      <g transform={`translate(-250,0) scale(${1 - 1.3 * o},1)`}>
        <rect x={0} y={-180} width={500} height={360} fill="#EAD98C" stroke={C.navy} strokeWidth={8} />
        <rect x={0} y={-180} width={500} height={34} fill="#F6E7A1" opacity={0.9} />
        <rect x={20} y={-120} width={420} height={6} fill={C.navy} opacity={0.25} />
        {glyph && o < 0.6 && <g transform="translate(250,10)"><Glyph kind="none" s={1.5} /></g>}
      </g>
      {tape > 0.02 && (
        <g opacity={tape}>
          {[-90, 90].map((tx) => (
            <g key={tx}>
              <rect x={tx - 20} y={-196} width={40} height={392} fill="#F4FFF8" opacity={0.7} stroke={C.navy} strokeWidth={3} />
              <rect x={tx - 20} y={-196} width={14} height={392} fill="#FFFFFF" opacity={0.5} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
};

// --- captions go through lib/captions; the card palette is the film's ---------------------------

const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]; kicks: number[]}> = ({n, from, dur, beats, kicks}) => {
  const f = useCurrentFrame();
  const bAt = (id: number) => {
    const b = beats.find((x) => x.id === id);
    return b ? b.at * 30 - from : 0;
  };
  const q = (id: number, d = 20) => ease(f, bAt(id), d);
  const pop = (id: number, d = 18) => spring(f, bAt(id), d);
  const since = (id: number) => f - bAt(id);
  const drift = Math.sin(f / 71.3);
  let picture: React.ReactNode = null;
  let zoom = interpolate(f, [0, dur], [1.0, 1.05], {extrapolateRight: 'clamp'});
  let dy = 0;
  let flood = 0;
  const jolt = kickTransform(f, cameraKick(f, from, dur, kicks));
  const FLOOR = 1310;

  if (n === 1) {
    // HOOK. A dark hall, one tube ticking; the tubes clang on and each lamp blinks; the SAME coral
    // glyph slaps onto every sign with a different navy mark; the banner drops on its chain.
    const lit = f < bAt(2) ? 0 : ease(f, bAt(2), 6);
    const tick = f < bAt(2) ? (Math.floor(f / 7) % 4 === 0 ? 0.35 : 0.08) : 1;
    const cam = f * 0.9;
    const bn = land(f, bAt(4), 22);
    const swing = 3 * Math.sin(f / 14) * Math.exp(-Math.max(0, f - bAt(4) - 20) / 60);
    picture = (
      <SVG>
        <HallWall f={f} cam={cam} floorY={FLOOR} id="s1" window flicker={1} />
        <DoorRow f={f} cam={cam} k={1.2} floorY={FLOOR} n={7} x0={-60} opts={(i, sx) => ({
          glyph: VERDICTS[i % 8],
          flip: spring(f, bAt(3) + i * 5, 14),
          lamp: clamp01((f - bAt(2) - i * 4) / 4) > 0 ? 1 : 0,
          eyes: 0, state: 'shut', swing: 0 * sx,
        })} />
        <rect width={W} height={H} fill="#0B1020" opacity={(1 - lit) * 0.78 + (1 - tick) * 0.04 * (f < bAt(2) ? 1 : 0)} />
        <g transform={`translate(540,${lerp(-300, 640, bn)}) rotate(${swing})`}>
          {[-260, 260].map((rx) => <line key={rx} x1={rx} y1={-700} x2={rx} y2={-40} stroke={C.navy} strokeWidth={7} />)}
          <g>
            <rect x={-330 + 8} y={-52 + 12} width={660} height={104} fill="#000" opacity={0.25} />
            <rect x={-330} y={-52} width={660} height={104} rx={10} fill={C.paper} stroke={C.navy} strokeWidth={8} />
            <text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={1.5} fill={C.navy}>NO SYSTEMWIDE AI RULE</text>
          </g>
        </g>
        <Plate text="PER ADN" y={760} size={26} p={ease(f, bAt(4) + 10, 10)} tone="slip" />
        <NearBench cam={cam} />
        <Motes f={f} />
      </SVG>
    );
    zoom = interpolate(f, [0, dur], [1.0, 1.06], {extrapolateRight: 'clamp'});
  } else if (n === 2) {
    // THE ONE SENTENCE. The first door's sign rectangle grows into the dashed box on the plate; a
    // magnifier reads the sentence and a Raven cocks its head at the empty box.
    const grow = ease(f, 0, 14);
    const lensK = easeIO(f, bAt(7), 70);
    const lensX = f < bAt(8) ? lerp(250, 830, lensK) : f < bAt(9) ? lerp(760, 600, ease(f, bAt(8), 14)) : lerp(600, 540, ease(f, bAt(9), 16));
    const lensY = f < bAt(8) ? 670 : f < bAt(9) ? 760 : lerp(760, 872, ease(f, bAt(9), 16));
    const lensOn = ease(f, bAt(7) - 6, 10);
    const ravenIn = ease(f, bAt(9), 26);
    const fog = f >= bAt(9) + 16 ? clamp01((f - bAt(9) - 16) / 30) * 0.6 : 0;
    picture = (
      <SVG>
        <HallWall f={f} cam={f * 0.5} floorY={1560} id="s2" tubes />
        <HandbookPlate x={540} y={760} f={f} lines={['"DEVICES NOT AUTHORIZED', 'BY THE FACULTY MEMBER"']} tab="UAA STUDENT HANDBOOK" size={48}
          p={ease(f, 0, 6)} drop={land(f, 0, 22)} dashed={ease(f, 0, 12)} />
        {/* the first door's sign rectangle, growing out into the plate's box (match cut from S1) */}
        {grow < 0.98 && (
          <g transform={`translate(${lerp(540, 540, grow)},${lerp(1060, 872, grow)}) scale(${lerp(1.4, 1, grow)})`} opacity={1 - grow}>
            <rect x={-62} y={-24} width={124} height={48} rx={8} fill={C.paper} stroke={C.navy} strokeWidth={5} />
          </g>
        )}
        {/* the nickel pointer settling on FACULTY MEMBER */}
        {f >= bAt(8) && (
          <g transform={`translate(${lerp(980, 842, spring(f, bAt(8), 14))},${lerp(700, 812, ease(f, bAt(8), 10))}) rotate(-28)`}>
            <path d="M0,0 L-70,22 L-70,-22 Z" fill={C.brass} stroke={C.navy} strokeWidth={5} strokeLinejoin="round" />
            <rect x={0} y={-12} width={110} height={24} rx={6} fill={C.brass} stroke={C.navy} strokeWidth={5} />
          </g>
        )}
        {/* the magnifier */}
        <g opacity={lensOn} transform={`translate(${lensX},${lensY})`}>
          <circle cx={0} cy={0} r={86} fill="#F4FFF8" opacity={0.28 + fog} />
          <circle cx={0} cy={0} r={86} fill="none" stroke={C.navy} strokeWidth={12} />
          <circle cx={0} cy={0} r={86} fill="none" stroke={C.brass} strokeWidth={5} />
          <path d="M-52,-34 A62,62 0 0 1 -6,-62" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
          <line x1={62} y1={62} x2={140} y2={140} stroke={C.navy} strokeWidth={22} strokeLinecap="round" />
          <line x1={62} y1={62} x2={140} y2={140} stroke={C.oak} strokeWidth={10} strokeLinecap="round" />
        </g>
        {ravenIn > 0.01 && (
          <g transform={`translate(${lerp(1300, 880, ravenIn)},${lerp(520, 922, ravenIn)}) rotate(${Math.sin(f / 6) * (1 - ravenIn) * 8})`}>
            <Raven x={0} y={0} scale={1.3} f={f} facing={-1} mode={ravenIn < 0.95 ? 'fly' : 'perch'} />
          </g>
        )}
        <Plate text="NO MENTION OF AI" y={1200} size={28} p={ease(f, bAt(9) + 10, 12)} tone="slip" />
        <Motes f={f} />
      </SVG>
    );
    zoom = interpolate(f, [0, dur], [1.0, 1.1], {extrapolateRight: 'clamp'});
    dy = lerp(30, -20, f / dur);
  } else if (n === 3) {
    // THE DOOR DOLLY. A wide view of the whole row with one dark door and a coral arrow at the far
    // end, then a parallel truck past eight doors, each sign flipping as it crosses x 900, held on
    // the dark door.
    const k = lerp(0.42, 1.25, easeIO(f, 56, 28));
    const camWide = lerp(1355, 540, easeIO(f, 56, 28));
    const truck = easeIO(f, 78, 82);
    const cam = f < 56 ? 1355 + f * 0.4 : lerp(camWide, 2510, truck);
    const flipOf = (sx: number) => clamp01((960 - sx) / 70);
    const arrow = 8 * Math.sin(f / 5);
    const farHold = since(13) > 0;
    picture = (
      <SVG>
        <HallWall f={f} cam={cam} floorY={FLOOR} id="s3" window flicker={1} />
        <DoorRow f={f} cam={cam} k={k} floorY={FLOOR} n={8} opts={(i, sx) => (i === 7
          ? {glyph: 'none', flip: 0, state: 'dark', lamp: since(13) > 30 && Math.floor(f / 6) % 5 === 0 ? 1 : 0, sign: false}
          : {glyph: VERDICTS[i], flip: f < 56 ? 1 : spring(Math.round(flipOf(sx) * 14), 6, 8) * clamp01(flipOf(sx) * 4), lamp: 1})} />
        {/* the coral arrow over the far dark door, in world space */}
        <g transform={`translate(540,${FLOOR}) scale(${k}) translate(${-cam},0)`}>
          <g transform={`translate(${doorX(7)},${-560 + arrow}) scale(${Math.min(2.4, 1 / (k * 1.1))})`}>
            <path d="M0,60 L-44,0 L-18,0 L-18,-60 L18,-60 L18,0 L44,0 Z" fill={C.coral} stroke={C.navy} strokeWidth={7} strokeLinejoin="round" />
          </g>
        </g>
        <Plate text="RULES SET COURSE BY COURSE" y={560} size={34} p={ease(f, bAt(11), 10) * (1 - ease(f, bAt(13) - 14, 8))} tone="enamel" />
        <Plate text="PER ADN" y={640} size={26} p={ease(f, bAt(12), 10) * (1 - ease(f, bAt(13) - 14, 8))} tone="slip" />
        <NearBench cam={cam} />
        {farHold && <Motes f={f} op={0.2} />}
        <Motes f={f} />
      </SVG>
    );
    zoom = 1.0 + 0.02 * (f / dur);
  } else if (n === 4) {
    // THE SLIPS. 150 butter slips rain onto a locker wall; 119 flip coral one by one while the wall
    // flip-board counts up and locks at 119 with a hard clack.
    const COLS = 15, ROWS = 10;
    const slips = Array.from({length: 150}, (_, i) => i);
    const hitK = (i: number) => (i < 119 ? clamp01((f - bAt(16) - i * 0.9) / 8) : 0);
    const count = clamp01((f - bAt(16)) / 108) * 119;
    const clack = since(17) >= 0 && since(17) < 12 ? since(17) / 12 : 0;
    picture = (
      <SVG>
        <rect width={W} height={H} fill={C.wall} />
        <LockerBank x={20} y={575} w={1040} h={725} cols={12} rows={5} />
        {slips.map((i) => {
          const c = i % COLS, r = Math.floor(i / COLS);
          const h = hash(i);
          const start = bAt(14) + (h % 46);
          const fall = clamp01((f - start) / 22);
          const tx = 78 + c * 66, ty = 615 + r * 64;
          const y = lerp(-80, ty, fall * fall);
          const flutter = Math.sin(f / 5 + i) * (1 - fall) * 30;
          const jitter = ((h >>> 8) % 7) - 3;
          const shuffle = (i >= 119 && f > bAt(16)) ? Math.min(1, (f - bAt(16)) / 90) * 5 : 0;
          return <Slip key={i} x={tx + flutter + shuffle} y={y} rot={jitter * 2 + flutter * 0.4} hit={hitK(i)} op={fall > 0 ? 1 : 0} />;
        })}
        <g transform="translate(0,0)" opacity={ease(f, bAt(16) - 6, 10)}>
          <FlipBoard x={540} y={1100} s={0.8} value={count} clack={clack} />
        </g>
        <Plate text="150 STUDENTS CITED" y={600} size={34} p={ease(f, bAt(14), 10) * (1 - ease(f, bAt(17), 8))} tone="slip" />
        <Plate text="119 OF 150" y={525} size={44} p={ease(f, bAt(17), 8)} tone="coral" />
        <Plate text="PER ADN, FROM A UAA DEAN OF STUDENTS REPORT" y={1262} size={24} p={ease(f, bAt(17), 10)} tone="slip" />
        <Motes f={f} y0={380} y1={1300} op={0.2} />
      </SVG>
    );
    zoom = 1.0 + 0.03 * (f / dur);
  } else if (n === 5) {
    // THE REPORT. A folder skids onto a bare desk, a real rubber stamp lifts, slams and leaves its
    // ink, and a plain block on the wall grows by three quarters of its own height with a coral delta.
    const slide = ease(f, 0, 18);
    const sd = since(19);
    // anticipation (a lift), the slam, a squash and a settle
    const stampY = sd < -24 ? 470 : sd < 0 ? lerp(470, 400, ease(f, bAt(19) - 24, 24)) : sd < 7 ? lerp(400, 1010, clamp01(sd / 7) ** 2) : 1010 - 6 * Math.sin((sd - 7) / 2.4) * Math.exp(-(sd - 7) / 8);
    const squash = sd >= 7 && sd < 14 ? 1 - 0.1 * Math.sin(((sd - 7) / 7) * Math.PI) : 1;
    const stampHit = sd > 6 ? 1 : 0;
    const pad = sd > 6 && sd < 18 ? 10 * Math.sin(((sd - 6) / 12) * Math.PI) : 0;
    const grow = ease(f, bAt(20), 44);
    const BW = 240, BH = 230;
    picture = (
      <SVG>
        <rect width={W} height={H} fill={C.wall} />
        <rect x={0} y={0} width={W} height={150} fill={tones(C.wall).shade} stroke={C.navy} strokeWidth={6} />
        {/* the wall block that grows: an unlabeled base, then the same block's own height times 0.73 on top */}
        <g transform="translate(220,870)">
          <ContactShadow cx={0} cy={6} rx={170} ry={14} opacity={0.35} blur={9} />
          <rect x={-BW / 2} y={-BH} width={BW} height={BH} fill={C.locker} stroke={C.navy} strokeWidth={8} />
          <rect x={-BW / 2 + 10} y={-BH + 10} width={22} height={BH - 20} fill="#FFFFFF" opacity={0.18} />
          <rect x={-BW / 2} y={-BH - BH * 0.73 * grow} width={BW} height={BH * 0.73 * grow} fill={C.coral} stroke={C.navy} strokeWidth={8} />
          {grow > 0.02 && <line x1={-BW / 2 - 30} y1={-BH} x2={BW / 2 + 30} y2={-BH} stroke={C.navy} strokeWidth={4} strokeDasharray="10 8" />}
        </g>
        {/* the desk */}
        <rect data-band="ok" x={-20} y={880} width={W + 40} height={1040} fill={C.wood} />
        <rect data-band="ok" x={-20} y={880} width={W + 40} height={46} fill={C.woodHi} stroke={C.navy} strokeWidth={7} />
        {Array.from({length: 6}, (_, i) => <path key={i} d={`M0,${960 + i * 120} C300,${950 + i * 120} 700,${975 + i * 120} 1080,${962 + i * 120}`} fill="none" stroke={C.woodHi} strokeWidth={3} opacity={0.5} />)}
        <g transform={`translate(${lerp(1400, 660, slide)},${1070 + pad})`}>
          <ContactShadow cx={0} cy={190} rx={330} ry={26} opacity={0.4} blur={11} />
          <rect x={-300 + 12} y={-190 + 16} width={600} height={380} fill="#000" opacity={0.25} />
          <rect x={-300} y={-190} width={600} height={380} fill="#EAD98C" stroke={C.navy} strokeWidth={9} />
          <rect x={-300} y={-190} width={600} height={40} fill="#F6E7A1" />
          <rect x={-250} y={-120} width={320} height={64} fill={C.paper} stroke={C.navy} strokeWidth={5} />
          <text x={-90} y={-79} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1} fill={C.navy}>UAA DEAN OF STUDENTS</text>
          <rect x={-250} y={-30} width={500} height={7} fill={C.navy} opacity={0.3} />
          <rect x={-250} y={-6} width={420} height={7} fill={C.navy} opacity={0.3} />
          {stampHit > 0 && (
            <g transform="translate(0,90) rotate(-8)" opacity={0.95}>
              <rect x={-250} y={-48} width={500} height={96} fill="none" stroke={C.coralDk} strokeWidth={8} />
              <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} letterSpacing={1} fill={C.coralDk}>"TAKEN OVER THE MAJORITY"</text>
            </g>
          )}
        </g>
        {/* the rubber stamp: a turned wooden handle and knob, a plate and a rubber face, squashing on impact */}
        <g transform={`translate(700,${stampY}) scale(1,${squash})`}>
          <ContactShadow cx={0} cy={22} rx={120} ry={12} opacity={0.3} blur={8} />
          <rect x={-20} y={-300} width={40} height={140} rx={14} fill={C.oak} stroke={C.navy} strokeWidth={7} />
          <circle cx={0} cy={-320} r={44} fill={C.oak} stroke={C.navy} strokeWidth={7} />
          <circle cx={-12} cy={-332} r={12} fill="#FFFFFF" opacity={0.3} />
          <rect x={-110} y={-164} width={220} height={52} rx={10} fill={C.brass} stroke={C.navy} strokeWidth={7} />
          <rect x={-100} y={-112} width={200} height={44} rx={6} fill={C.navy} stroke={C.navy} strokeWidth={6} />
          <rect x={-96} y={-160} width={60} height={10} fill="#FFFFFF" opacity={0.5} />
        </g>
        {stampHit > 0 && sd < 16 && <ImpactStar cx={700} cy={1110} r={50 + sd * 7} color={C.coral} />}
        {stampHit > 0 && Array.from({length: 7}, (_, i) => <circle key={i} cx={560 + i * 40 + Math.sin(i) * 20} cy={1080 + Math.sin(i * 3) * 30 + Math.min(40, sd * 3)} r={4} fill={C.coralDk} opacity={0.8 * (1 - clamp01((sd - 6) / 20))} />)}
        <Plate text="UAA DEAN OF STUDENTS REPORT, VIA ADN" x={650} y={505} size={24} p={ease(f, bAt(18) + 6, 10)} tone="slip" />
        <Plate text="AI PLAGIARISM +73%" x={560} y={640} size={28} p={ease(f, bAt(20) + 30, 10)} tone="coral" />
        <Motes f={f} y0={200} y1={1000} op={0.2} />
      </SVG>
    );
    zoom = 1.0 + 0.04 * (f / dur);
  } else if (n === 6) {
    // THE FIELD, TO SCALE. 10,500 students are one dot each at 11.5 px spacing over a 1000 x 1400
    // field; the 119 are a 15 x 8 patch of that same grid, so 119 of 10,500 is a true 1.1% sliver.
    // The 31 slips that aren't in the 119 fall away first; the other dots stay hollow rings, so the
    // field reads unknown, not innocent; the coral dots go dashed (counted, not proven) at the end.
    const CELL = 11.5;
    const away = ease(f, 0, 30);
    const pull = easeIO(f, 6, 64);
    const kk = lerp(7.5, 1.0, pull);
    const hollow = ease(f, bAt(23), 40);
    const slipsK = clamp01((kk - 3) / 2);
    const OX = 540 - (15 * CELL) / 2, OY = 900 - (10 * CELL) / 2;
    picture = (
      <SVG>
        <defs>
          <pattern id="dotfield" x="40" y="250" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <circle cx={CELL / 2} cy={CELL / 2} r={3.3} fill="none" stroke={C.lockerDk} strokeWidth={1.5} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill={C.wall} />
        <g transform={`translate(540,900) scale(${kk}) translate(-540,-900)`}>
          <rect data-band="ok" x={40} y={250} width={1000} height={1400} fill="url(#dotfield)" opacity={ease(f, 0, 8)} />
          <rect data-band="ok" x={40} y={250} width={1000} height={1400} fill="none" stroke={C.locker} strokeWidth={2.5 / kk} opacity={clamp01((1.9 - kk) * 1.2)} />
          <rect x={OX - 10} y={OY - 10} width={15 * CELL + 20} height={10 * CELL + 20} rx={6} fill="none" stroke={C.coral} strokeWidth={3 / kk} opacity={clamp01((2.4 - kk) * 1.5)} />
          {Array.from({length: 150}, (_, i) => {
            const cc = i % 15, rr = Math.floor(i / 15);
            const x = OX + cc * CELL + CELL / 2, y = OY + rr * CELL + CELL / 2;
            const keep = i < 119;
            if (!keep) {
              const dd = hash(i);
              return (
                <g key={i} transform={`translate(${x},${y + away * (500 + (dd % 300))}) rotate(${away * ((dd % 90) - 45)}) scale(${0.12})`} opacity={1 - away}>
                  <Slip x={0} y={0} />
                </g>
              );
            }
            return (
              <g key={i}>
                <g opacity={slipsK * (1 - hollow)} transform={`translate(${x},${y}) scale(0.19)`}><Slip x={0} y={0} hit={1} /></g>
                <circle cx={x} cy={y} r={3.9} fill={C.coral} stroke={C.navy} strokeWidth={0.8} opacity={(1 - slipsK) * (1 - hollow)} />
                <circle cx={x} cy={y} r={4.4} fill="none" stroke={C.coral} strokeWidth={1.5} strokeDasharray="2.4 1.6" opacity={hollow} />
              </g>
            );
          })}
        </g>
        <Plate text="119 OF 150" y={525} size={40} p={ease(f, 0, 8) * (1 - ease(f, 34, 10))} tone="coral" />
        <Plate text="1.1% OF 10,500+ STUDENTS" y={600} size={40} p={ease(f, bAt(22) + 8, 12)} tone="ink" />
        <Plate text="PER ADN" y={680} size={26} p={ease(f, bAt(22) + 14, 10)} tone="slip" />
        <line x1={540} y1={712} x2={540} y2={840} stroke={C.navy} strokeWidth={4} strokeDasharray="8 6" opacity={ease(f, bAt(22) + 16, 12)} />
        <g opacity={0.3} transform={`translate(${lerp(-500, 1500, (f % 190) / 190)},0) skewX(-18)`}><rect data-band="ok" x={0} y={0} width={200} height={H} fill="#F4FFF8" /></g>
        <Motes f={f} op={0.15} />
      </SVG>
    );
    zoom = 1.0 + 0.02 * (f / dur);
  } else if (n === 7) {
    // THE FOLDER. A taped folder with the coral glyph on its cover under a cool pendant; a
    // faceless hand smooths the tape; a plate says it was presented in September.
    const rise = ease(f, 0, 20);
    const sw = 4 * Math.sin(f / 22);
    const smooth = since(25) >= 0 ? Math.sin(clamp01(since(25) / 70) * Math.PI * 3) : 0;
    picture = (
      <SVG>
        <rect width={W} height={H} fill={C.board} />
        <rect x={0} y={0} width={W} height={720} fill="#33465A" />
        {/* the cool pendant and its cone */}
        <g transform={`translate(540,0) rotate(${sw * 0.4})`}>
          <line x1={0} y1={0} x2={0} y2={300} stroke={C.navy} strokeWidth={7} />
          <path d="M-90,380 L90,380 L40,300 L-40,300 Z" fill={C.brass} stroke={C.navy} strokeWidth={6} />
          <path d={`M-90,380 L-420,1180 L420,1180 L90,380 Z`} fill="#F4FFF8" opacity={0.12} />
        </g>
        <rect data-band="ok" x={-20} y={940} width={W + 40} height={980} fill={C.wood} />
        <rect x={-20} y={940} width={W + 40} height={50} fill={C.woodHi} stroke={C.navy} strokeWidth={7} />
        <g transform={`translate(540,${lerp(1500, 1040, rise)})`}>
          <ContactShadow cx={0} cy={200} rx={330} ry={26} opacity={0.4} blur={11} />
          <Folder x={0} y={0} s={1.15} tape={1} />
        </g>
        <Hand x={lerp(980, 700, ease(f, bAt(25) - 12, 20))} y={lerp(1700, 1110, ease(f, bAt(25) - 12, 20))} rot={-28 + smooth * 8} s={0.7} curl={0.2} />
        <Plate text="DRAFT PRESENTED IN SEPTEMBER" y={640} size={30} p={ease(f, bAt(25), 12)} tone="slip" />
        <Plate text="PER ADN" y={560} size={26} p={ease(f, bAt(24) + 10, 10)} tone="enamel" />
        <Motes f={f} y0={400} y1={1100} op={0.25} />
      </SVG>
    );
    zoom = interpolate(f, [0, dur], [1.0, 1.08], {extrapolateRight: 'clamp'});
  } else if (n === 8) {
    // THE NAMEPLATE. The same table from the side: a STEPHANIE ERICKSON nameplate at a chair, the
    // faceless hand resting on the taped folder, the DELIBERATE quote slams down and the hand
    // lifts the tape edge on "just happen to us".
    const plateIn = land(f, 0, 20);
    const handOn = ease(f, bAt(27) - 10, 20);
    const lift = ease(f, bAt(28) + 84, 20);
    const sw = 3 * Math.sin(f / 24);
    picture = (
      <SVG>
        <rect width={W} height={H} fill={C.board} />
        <rect x={0} y={0} width={W} height={760} fill="#33465A" />
        <rect x={60} y={200} width={300} height={420} fill="#3B5167" stroke={C.navy} strokeWidth={6} />
        <rect x={720} y={240} width={300} height={380} fill="#3B5167" stroke={C.navy} strokeWidth={6} />
        <g transform={`translate(540,0) rotate(${sw * 0.4})`}>
          <line x1={0} y1={0} x2={0} y2={260} stroke={C.navy} strokeWidth={7} />
          <path d="M-90,340 L90,340 L40,260 L-40,260 Z" fill={C.brass} stroke={C.navy} strokeWidth={6} />
          <path d="M-90,340 L-440,1180 L440,1180 L90,340 Z" fill="#F4FFF8" opacity={0.1} />
        </g>
        {/* the chair behind the nameplate */}
        <g transform={`translate(${770 + Math.sin(f / 40) * 3},880)`}>
          <rect x={-70} y={-170} width={140} height={190} rx={22} fill={C.lockerDk} stroke={C.navy} strokeWidth={7} />
          <rect x={-60} y={-160} width={120} height={60} rx={14} fill={C.locker} opacity={0.8} />
          <rect x={-8} y={20} width={16} height={90} fill={C.brass} stroke={C.navy} strokeWidth={5} />
        </g>
        <rect data-band="ok" x={-20} y={960} width={W + 40} height={960} fill={C.wood} />
        <rect x={-20} y={960} width={W + 40} height={54} fill={C.woodHi} stroke={C.navy} strokeWidth={7} />
        <g transform={`translate(${lerp(400, 360, plateIn)},${1190})`}>
          <Folder x={0} y={0} s={0.8} tape={1 - lift} rot={-3} />
        </g>
        {/* the nameplate */}
        <g transform={`translate(${lerp(1300, 760, plateIn)},1000)`} opacity={clamp01(plateIn * 3)}>
          <ContactShadow cx={0} cy={50} rx={230} ry={14} opacity={0.4} blur={8} />
          <rect x={-215} y={-18} width={430} height={66} fill={C.brass} stroke={C.navy} strokeWidth={6} />
          <rect x={-203} y={-8} width={406} height={46} fill={C.paper} stroke={C.navy} strokeWidth={2.5} />
          <text x={0} y={25} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={25} letterSpacing={1.5} fill={C.navy}>STEPHANIE ERICKSON</text>
        </g>
        <Hand x={lerp(1100, 360, handOn)} y={lerp(1500, 1200 - lift * 30, handOn)} rot={-76 - lift * 6} s={0.62} curl={0.1 + lift * 0.6} />
        <Plate text="PER ADN" x={760} y={1120 + 20} size={22} p={ease(f, 10, 10)} tone="slip" />
        <QuotePlate lines={['"DELIBERATE ...', 'INSTEAD OF LETTING IT', 'JUST HAPPEN TO US"']} by="STEPHANIE ERICKSON · PER ADN" y={560} size={42}
          p={ease(f, bAt(28), 12)} rot={-1.5} />
        <Motes f={f} y0={400} y1={1100} op={0.22} />
      </SVG>
    );
    zoom = 1.0 + 0.03 * (f / dur);
    dy = lerp(20, -10, f / dur);
  } else if (n === 9) {
    // THE WRITING DOOR. Split frame: a big ban sign on the left wall and the open writing door on
    // the right where the AI glyph fills a blank essay while the pencil lies idle.
    const writing = clamp01((f - bAt(30)) / 70);
    const sw = ease(f, 0, 24);
    picture = (
      <SVG>
        <rect width={W} height={H} fill={C.wall} />
        {/* left half: the wall and the big sign */}
        <rect x={0} y={0} width={540} height={H} fill={C.wallLo} />
        <rect data-band="ok" x={0} y={1250} width={540} height={670} fill={C.lino} />
        <g transform={`translate(270,800) rotate(${Math.sin(f / 26) * 0.8})`}>
          <rect x={-150 + 12} y={-190 + 16} width={300} height={380} rx={22} fill="#000" opacity={0.25} />
          <rect x={-150} y={-190} width={300} height={380} rx={22} fill={C.paper} stroke={C.navy} strokeWidth={9} />
          <rect x={-26} y={-208} width={52} height={22} fill="#FFFFFF" opacity={0.75} stroke={C.navy} strokeWidth={3} />
          <g transform="translate(0,-10)"><Glyph kind="ban" s={2.3} f={f} pop={spring(f, 8, 16)} /></g>
        </g>
        {/* right half: the open writing door onto a classroom, drawn big so the room reads */}
        <rect x={540} y={0} width={540} height={1300} fill="#D6E7EC" />
        <rect data-band="ok" x={540} y={1300} width={540} height={620} fill={C.lino} />
        <g transform="translate(800,1300)">
          <ClassroomDoor x={0} y={0} scale={1.75} f={f} glyph="ban" flip={1} state="open" swing={sw} lamp={1} sign={false} shadow
            inside={
              <g>
                <rect x={-95} y={-420} width={190} height={420} fill="#DCEBEF" />
                <rect x={-80} y={-380} width={72} height={100} fill="#F4FFF8" stroke={C.navy} strokeWidth={4} />
                <rect x={10} y={-370} width={70} height={90} fill="#F4FFF8" stroke={C.navy} strokeWidth={4} />
                <rect x={-95} y={-100} width={190} height={100} fill={C.wood} />
                <rect x={-95} y={-106} width={190} height={14} fill={C.woodHi} stroke={C.navy} strokeWidth={4} />
                <rect x={-30} y={-330} width={60} height={30} fill={C.board} opacity={0.0} />
              </g>
            } />
        </g>
        {/* the desk, essay sheet and idle pencil in front of the door */}
        <g transform="translate(780,1270)">
          <ContactShadow cx={0} cy={200} rx={260} ry={20} opacity={0.35} blur={10} />
          <rect x={-240} y={0} width={480} height={34} fill={C.woodHi} stroke={C.navy} strokeWidth={7} />
          <rect x={-210} y={34} width={22} height={150} fill={C.brass} stroke={C.navy} strokeWidth={5} />
          <rect x={188} y={34} width={22} height={150} fill={C.brass} stroke={C.navy} strokeWidth={5} />
          <g transform="translate(-40,-240)">
            <rect x={-150 + 8} y={10} width={300} height={240} fill="#000" opacity={0.2} />
            <rect x={-150} y={0} width={300} height={240} fill={C.paper} stroke={C.navy} strokeWidth={5} />
            {Array.from({length: 7}, (_, i) => (
              <rect key={i} x={-120} y={26 + i * 30} width={Math.max(0, Math.min(240, (writing * 7 - i) * 240))} height={10} fill={C.navy} opacity={0.9} />
            ))}
          </g>
          <g transform={`translate(160,-6) rotate(${-14 + Math.sin(f / 30) * 3})`}>
            <rect x={-70} y={-7} width={130} height={14} fill="#E8C56A" stroke={C.navy} strokeWidth={4} />
            <path d="M60,-7 L84,0 L60,7 Z" fill="#F0DFC0" stroke={C.navy} strokeWidth={3} />
            <rect x={-70} y={-7} width={18} height={14} fill={C.coralDk} stroke={C.navy} strokeWidth={4} />
          </g>
        </g>
        {/* the AI glyph hovering over the page, writing */}
        <g transform={`translate(${750 + Math.sin(f / 9) * 6},${860 + Math.sin(f / 7) * 5})`} opacity={ease(f, bAt(30) - 8, 10)}>
          <Glyph kind="none" s={1.2} f={f} />
          <path d={`M10,40 Q${30 + Math.sin(f / 4) * 10},${80} ${40},${120}`} fill="none" stroke={C.navy} strokeWidth={6} strokeLinecap="round" />
        </g>
        {/* the hard seam */}
        <rect x={536} y={0} width={8} height={H} fill={C.navy} />
        <Plate text="RULES SET COURSE BY COURSE" y={505} size={30} p={ease(f, 6, 10)} tone="enamel" />
        <Plate text="PER ADN" y={585} size={24} p={ease(f, 10, 10)} tone="slip" />
        <Motes f={f} op={0.2} />
      </SVG>
    );
    zoom = interpolate(f, [0, dur], [1.0, 1.07], {extrapolateRight: 'clamp'});
  } else if (n === 10) {
    // THE LAST DOOR. The camera pushes down the hall to the far door, its plate hangs, the door
    // cracks and peach light widens line by line, and at "There, AI is the subject" it swings open
    // and the camera pushes through to the lecture board.
    const push = easeIO(f, 0, 56);
    const k = lerp(1.25, 2.3, push);
    const cam = lerp(2200, doorX(7), push);
    const crack = f >= bAt(32) + 26 ? 0.14 + 0.3 * ease(f, bAt(32) + 26, 120) : 0;
    const open = f >= bAt(34) ? 0.4 + 0.6 * easeIO(f, bAt(34), 20) : crack;
    flood = clamp01(open * 1.3);
    const through = easeIO(f, bAt(34) + 30, 50);
    const board = ease(f, bAt(34) + 24, 20);
    const lampOn = f > 24 ? 1 : 0;
    picture = (
      <SVG>
        <HallWall f={f} cam={cam} floorY={FLOOR} id="s10" window={false} />
        <g transform={`translate(540,${FLOOR}) scale(${k}) translate(${-cam},0) `}>
          {[5, 6].map((i) => <ClassroomDoor key={i} x={doorX(i)} y={0} scale={1} f={f} glyph={VERDICTS[i]} flip={1} lamp={1} phase={i} />)}
        </g>
        <DoorRow f={f} cam={cam} k={k} floorY={FLOOR} n={8} opts={(i) => (i === 7 ? {
          glyph: 'ok', flip: ease(f, bAt(34) + 20, 12), state: 'glow', swing: open, lamp: lampOn,
          inside: (
            <g>
              <rect x={-95} y={-420} width={190} height={420} fill={C.board} />
              <rect x={-80} y={-380} width={160} height={150} fill="#F4F2EA" stroke={C.navy} strokeWidth={4} opacity={board} />
              <g transform="translate(0,-305)" opacity={board}><Glyph kind="none" s={1.5} f={f} /></g>
              <rect x={-95} y={-60} width={190} height={60} fill={C.woodHi} />
              <rect x={-60} y={-110} width={120} height={50} fill="#DCEBEF" stroke={C.navy} strokeWidth={4} />
            </g>
          ),
        } : {glyph: VERDICTS[i], flip: 1, lamp: 1})} />
        {/* the master's program plate, held in the safe area on two chains (c14) */}
        <g transform="translate(540,520)" opacity={ease(f, bAt(33) - 6, 12) * (1 - through)}>
          {[-250, 250].map((rx) => <line key={rx} x1={rx} y1={-520} x2={rx} y2={-30} stroke={C.navy} strokeWidth={6} />)}
          <rect x={-310 + 8} y={-34 + 10} width={620} height={64} fill="#000" opacity={0.22} />
          <rect x={-310} y={-34} width={620} height={64} fill={C.paper} stroke={C.navy} strokeWidth={6} />
          <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={0.5} fill={C.navy}>UAA M.S. IN AI, DATA SCIENCE AND ENGINEERING</text>
        </g>
        {/* the flood: the whole hall goes peach-white, never amber */}
        <rect data-band="ok" width={W} height={H} fill={C.peach} opacity={flood * 0.3 * (1 - through)} style={{mixBlendMode: 'screen'}} />
        <g opacity={flood * (1 - through * 0.6)} style={{mixBlendMode: 'screen'}}>
          <path d={`M${540 - 80 * k},${FLOOR - 400 * k} L${-200},${H} L${1280},${H} L${540 + 80 * k},${FLOOR - 400 * k} Z`} fill={C.peach} opacity={0.5} />
          <ellipse cx={540} cy={FLOOR - 200 * k} rx={300 * k} ry={420 * k} fill={C.peachDk} opacity={0.28} />
        </g>
        {/* push through the door into the lab */}
        {through > 0.02 && (
          <g opacity={through}>
            <rect width={W} height={H} fill={C.board} />
            <rect x={140} y={360} width={800} height={620} fill="#F4F2EA" stroke={C.navy} strokeWidth={10} />
            <g transform="translate(540,640)"><Glyph kind="none" s={4} f={f} /></g>
            <rect data-band="ok" x={-20} y={1100} width={W + 40} height={820} fill={C.woodHi} />
            <rect x={-20} y={1100} width={W + 40} height={46} fill={C.wood} stroke={C.navy} strokeWidth={7} />
            <path d={`M0,${H} L${540},${700} L${W},${H} Z`} fill={C.peach} opacity={0.18} />
          </g>
        )}
        <NearBench cam={cam} />
        <Motes f={f} op={0.25 + 0.3 * flood} color={C.peach} />
      </SVG>
    );
    zoom = 1.0;
  } else if (n === 11) {
    // TWO DOORS. Same coral glyph on both signs, a navy strike on one and a tick on the other, a big
    // nickel key jams in both locks.
    const marks = ease(f, bAt(36) - 4, 12);
    const keyL = ease(f, bAt(37), 20);
    const keyBack = ease(f, bAt(37) + 38, 14);
    const keyR = ease(f, bAt(37) + 52, 20);
    const jamL = keyL > 0.9 && keyBack < 0.1 ? Math.sin(f * 2.4) * 5 : 0;
    const jamR = keyR > 0.9 ? Math.sin(f * 2.4) * 5 : 0;
    const kxL = lerp(560, 372, keyL) + keyBack * 190;
    const kx = keyR > 0 ? lerp(560, 868, keyR) : kxL;
    const facing = keyR > 0 ? -1 : 1;
    picture = (
      <SVG>
        <HallWall f={f} cam={f * 0.3} floorY={1330} id="s11" window tubes flicker={1} />
        <ClassroomDoor x={250} y={1330} scale={1.1} f={f} glyph={marks > 0.5 ? 'ban' : 'none'} flip={spring(f, 6, 16)} lamp={1} phase={1} eyes={0.0} />
        <ClassroomDoor x={790} y={1330} scale={1.1} f={f} glyph={marks > 0.5 ? 'ok' : 'none'} flip={spring(f, 10, 16)} lamp={1} phase={2} />
        {/* the big nickel key */}
        <g transform={`translate(${kx + (keyR > 0 ? jamR : jamL)},${1330 - 202}) scale(${facing},1)`}>
          <rect x={0} y={-12} width={170} height={24} rx={8} fill={C.brass} stroke={C.navy} strokeWidth={6} />
          <rect x={130} y={0} width={14} height={30} fill={C.brass} stroke={C.navy} strokeWidth={5} />
          <rect x={104} y={0} width={14} height={22} fill={C.brass} stroke={C.navy} strokeWidth={5} />
          <circle cx={200} cy={0} r={42} fill="none" stroke={C.navy} strokeWidth={22} />
          <circle cx={200} cy={0} r={42} fill="none" stroke={C.brass} strokeWidth={11} />
        </g>
        <Plate text="RULES SET COURSE BY COURSE" y={540} size={30} p={ease(f, 8, 10)} tone="enamel" />
        <Plate text="PER ADN" y={620} size={24} p={ease(f, 12, 10)} tone="slip" />
        {keyL > 0.9 && keyBack < 0.1 && <ImpactStar cx={340} cy={1110} r={34} color="#FFFFFF" />}
        <NearBench cam={f * 0.3} y={1590} />
        <Motes f={f} />
      </SVG>
    );
    zoom = 1.0 + 0.03 * (f / dur);
  } else if (n === 12) {
    // WHICH DOOR. A syllabus page with the coral glyph and three rows of navy marks; a faceless
    // hand traces the rows and stops on the blank one with a pen above it.
    const trace = easeIO(f, 0, 60);
    const rows: GlyphKind[] = ['ban', 'ok', 'none'];
    const hy = lerp(560, 1020, trace);
    picture = (
      <SVG>
        <rect width={W} height={H} fill={C.wallLo} />
        <rect x={-20} y={0} width={W + 40} height={H} fill={C.wood} opacity={0.0} />
        <g transform={`translate(540,${960 + Math.sin(f / 40) * 4}) rotate(${-1 + Math.sin(f / 50)})`}>
          <rect x={-340 + 14} y={-520 + 18} width={680} height={1040} fill="#000" opacity={0.25} />
          <rect x={-340} y={-520} width={680} height={1040} fill={C.paper} stroke={C.navy} strokeWidth={8} />
          <g transform="translate(0,-400)"><Glyph kind="none" s={1.8} f={f} /></g>
          {rows.map((r, i) => (
            <g key={i} transform={`translate(0,${-170 + i * 260})`}>
              <rect x={-290} y={-40} width={580} height={150} fill="none" stroke={C.navy} strokeWidth={4} opacity={0.5} />
              {[0, 1].map((l) => <rect key={l} x={-270} y={-18 + l * 28} width={300 - l * 90} height={8} fill={C.navy} opacity={0.35} />)}
              <g transform="translate(200,35)"><Glyph kind={r} s={1.0} f={f} pop={clamp01((f - 8 - i * 6) / 8)} /></g>
            </g>
          ))}
        </g>
        <Hand x={lerp(380, 700, ease(f, 0, 70))} y={hy + 250} rot={-18} s={0.8} curl={0.5} />
        {since(39) >= 0 && (
          <g transform={`translate(${470 + Math.sin(f / 3) * 3},${700 + Math.sin(f / 5) * 4}) rotate(-24)`}>
            <rect x={-8} y={-120} width={16} height={150} rx={6} fill={C.navy} />
            <path d="M-8,30 L8,30 L0,52 Z" fill={C.navy} />
          </g>
        )}
        <Motes f={f} op={0.18} />
      </SVG>
    );
    zoom = 1.0 + 0.04 * (f / dur);
  } else if (n === 13) {
    // NOVEMBER. From above, the same folder opens and a REGENTS · NOVEMBER plate and a scroll with
    // the coral glyph unroll, a faceless hand drags a chalk starting line, and a plate hangs from
    // an unnailed hook that wobbles.
    const open = easeIO(f, 0, 30);
    const scroll = ease(f, bAt(41), 36);
    const chalk = ease(f, bAt(42), 40);
    const wob = Math.sin((f - bAt(43)) / 3) * 10 * Math.exp(-Math.max(0, f - bAt(43)) / 40);
    picture = (
      <SVG>
        <rect width={W} height={H} fill={C.board} />
        <rect x={0} y={0} width={W} height={H} fill={C.wood} />
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M0,${i * 230 + 60} C300,${i * 230 + 40} 700,${i * 230 + 90} 1080,${i * 230 + 70}`} fill="none" stroke={C.woodHi} strokeWidth={3} opacity={0.5} />)}
        <path d={`M0,0 L${W},0 L${W},${H} L0,${H} Z`} fill="#F4FFF8" opacity={0.06} />
        <g transform={`translate(640,900)`}>
          <ContactShadow cx={0} cy={200} rx={330} ry={26} opacity={0.4} blur={12} />
          <Folder x={0} y={0} s={1.0} tape={0} open={open} glyph />
        </g>
        {/* the REGENTS · NOVEMBER plate laid on the table */}
        <g transform={`translate(540,${lerp(1500, 540, ease(f, bAt(40), 16))})`} opacity={ease(f, bAt(40), 8)}>
          <rect x={-300 + 8} y={-40 + 10} width={600} height={80} fill="#000" opacity={0.25} />
          <rect x={-300} y={-40} width={600} height={80} fill={C.brass} stroke={C.navy} strokeWidth={7} />
          <rect x={-288} y={-30} width={576} height={60} fill={C.paper} stroke={C.navy} strokeWidth={2.5} />
          <text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} letterSpacing={2} fill={C.navy}>REGENTS · NOVEMBER</text>
        </g>
        <Plate text="PER ADN" x={540} y={640} size={24} p={ease(f, bAt(40) + 12, 10)} tone="slip" />
        {/* the scroll with the coral glyph, landing unrolled across the folder */}
        {scroll > 0.02 && (
          <g transform="translate(540,900)">
            <rect x={-300 * scroll} y={-110} width={600 * scroll} height={220} fill={C.paper} stroke={C.navy} strokeWidth={7} />
            <g transform={`translate(0,0) scale(${scroll})`} opacity={scroll}><Glyph kind="none" s={1.8} f={f} /></g>
            <circle cx={-300 * scroll} cy={0} r={22} fill={C.brass} stroke={C.navy} strokeWidth={6} />
            <circle cx={300 * scroll} cy={0} r={22} fill={C.brass} stroke={C.navy} strokeWidth={6} />
          </g>
        )}
        {scroll > 0.5 && (
          <g opacity={ease(f, bAt(41) + 16, 10)}>
            <Plate text="GUIDING PRINCIPLES" x={540} y={1130} size={30} tone="ink" />
          </g>
        )}
        {/* the chalk starting line, a faceless hand dragging the chalk */}
        <line x1={110} y1={1230} x2={110 + 860 * chalk} y2={1230} stroke="#F4FFF8" strokeWidth={10} strokeLinecap="round" strokeDasharray="30 12" opacity={0.9} />
        {chalk > 0.02 && chalk < 0.98 && <Hand x={110 + 860 * chalk + 40} y={1330} rot={-60} s={0.6} curl={0.7} />}
        {/* the plate on its unnailed hook */}
        {f >= bAt(43) - 10 && (
          <g transform={`translate(880,1090) rotate(${wob})`} opacity={ease(f, bAt(43) - 10, 10)}>
            <circle cx={0} cy={-120} r={14} fill={C.brass} stroke={C.navy} strokeWidth={5} />
            <path d="M0,-110 L0,-30" stroke={C.navy} strokeWidth={5} />
            <rect x={-70} y={-30} width={140} height={90} fill={C.slip} stroke={C.navy} strokeWidth={5} />
            <rect x={-50} y={-6} width={100} height={7} fill={C.navy} opacity={0.4} />
            <rect x={-50} y={14} width={70} height={7} fill={C.navy} opacity={0.4} />
          </g>
        )}
        <Motes f={f} op={0.15} />
      </SVG>
    );
    zoom = interpolate(f, [0, dur], [1.0, 1.04], {extrapolateRight: 'clamp'});
  } else if (n === 14) {
    // THE QUESTION. A reverse dolly out down the whole corridor with every door ajar and the hall
    // shrinking to one row; the hook's chain becomes the chain a wide banner glyph and a row of small
    // door signs lower on; a faceless hand holds a pen between them; the tubes click off to frame 1's
    // one ticking tube with the dashed box the last thing lit.
    const pull = easeIO(f, 0, 150);
    const k = lerp(1.1, 0.45, pull);
    const cam = lerp(2000, 1350, pull);
    const opts = ease(f, bAt(45), 24);
    const off = f >= bAt(47) ? clamp01((f - bAt(47)) / 26) : 0;
    const tick = off > 0.9 ? (Math.floor(f / 7) % 4 === 0 ? 0.35 : 0.08) : 1;
    picture = (
      <SVG>
        <HallWall f={f} cam={cam} floorY={FLOOR} id="s14" window flicker={1} />
        <DoorRow f={f} cam={cam} k={k} floorY={FLOOR} n={8} opts={(i) => ({glyph: VERDICTS[i], flip: 1, state: 'ajar', swing: 0.1 + 0.03 * Math.sin(f / 20 + i), lamp: 1})} />
        <HandbookPlate x={540} y={520} f={f} lines={['"DEVICES NOT AUTHORIZED', 'BY THE FACULTY MEMBER"']} size={30} tab="UAA STUDENT HANDBOOK" dashed={0.6 + 0.4 * Math.abs(Math.sin(f / 9))} p={1} drop={1} />
        {/* the wide banner glyph and the row of small signs, lowered on chains */}
        <g opacity={opts * (1 - clamp01((f - bAt(47) + 10) / 14))}>
          <g transform={`translate(300,${lerp(-200, 860, land(f, bAt(45), 30))})`}>
            {[-90, 90].map((rx) => <line key={rx} x1={rx} y1={-220} x2={rx} y2={-50} stroke={C.navy} strokeWidth={6} />)}
            <rect x={-130} y={-236} width={260} height={18} rx={6} fill={C.brass} stroke={C.navy} strokeWidth={5} />
            <rect x={-190 + 8} y={-60 + 10} width={380} height={140} fill="#000" opacity={0.22} />
            <rect x={-190} y={-60} width={380} height={140} rx={12} fill={C.paper} stroke={C.navy} strokeWidth={8} />
            <g transform="translate(0,10)"><Glyph kind="none" s={1.5} f={f} /></g>
          </g>
          <g transform={`translate(780,${lerp(-200, 860, land(f, bAt(45) + 6, 30))})`}>
            {[-130, 130].map((rx) => <line key={rx} x1={rx} y1={-220} x2={rx} y2={-50} stroke={C.navy} strokeWidth={6} />)}
            <rect x={-190} y={-236} width={380} height={18} rx={6} fill={C.brass} stroke={C.navy} strokeWidth={5} />
            {[-130, -43, 43, 130].map((sx, i) => (
              <g key={i} transform={`translate(${sx},0) rotate(${Math.sin(f / 13 + i) * 2})`}>
                <rect x={-36} y={-50} width={72} height={100} rx={10} fill={C.paper} stroke={C.navy} strokeWidth={5} />
                <g transform="translate(0,-4)"><Glyph kind={VERDICTS[i]} s={0.5} f={f} /></g>
              </g>
            ))}
          </g>
        </g>
        <Plate text="ONE DEFAULT" x={300} y={1010} size={30} p={ease(f, bAt(45) + 18, 10)} tone="ink" />
        <Plate text="EACH FACULTY MEMBER" x={780} y={1010} size={26} p={ease(f, bAt(46), 10)} tone="ink" />
        {f >= bAt(46) - 6 && (
          <g transform={`translate(${540 + 160 * Math.sin((f - bAt(46)) / 14)},${1100})`} opacity={ease(f, bAt(46) - 6, 10)}>
            <Hand x={0} y={160} rot={-8} s={0.7} curl={0.4} />
            <rect x={-6} y={-50} width={12} height={150} rx={5} fill={C.navy} stroke={C.paper} strokeWidth={2} transform="rotate(8)" />
          </g>
        )}
        <rect width={W} height={H} fill="#0B1020" opacity={off * 0.78 * (tick === 1 ? 1 : 1)} />
        {off > 0.9 && (
          <g opacity={ease(f, bAt(47) + 24, 8)}>
            <rect x={470} y={470} width={140} height={60} rx={8} fill="none" stroke={C.paper} strokeWidth={6} strokeDasharray="14 9" />
          </g>
        )}
        {/* the Raven, a second appearance: it settles on the plate's top edge and watches the empty box */}
        <g transform={`translate(${lerp(1250, 870, ease(f, 20, 40))},${lerp(300, 410, ease(f, 20, 40))})`} opacity={1 - off}>
          <Raven x={0} y={0} scale={0.7} f={f} facing={-1} mode={ease(f, 20, 40) < 0.95 ? 'fly' : 'perch'} />
        </g>
        <NearBench cam={cam} />
        <Motes f={f} />
      </SVG>
    );
    zoom = 1.0 + 0.02 * (f / dur);
  }

  void q; void pop; void drift;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jolt.x}px, ${dy + jolt.y}px) scale(${zoom * jolt.scale})`}}>
        {picture}
      </div>
      <DayGrade f={f} sky="#CFF0E4" bounce="#C9D6CF" amount={0.45} haze={0.12} sunX={flood > 0 ? 540 : undefined} sunY={flood > 0 ? 700 : undefined} sunIntensity={0.1 + 0.45 * flood} />
      <GradeLayer f={f} bloom={0.04 + flood * 0.08} vignette={0.22} grain={0.04} warmth={0.02 + flood * 0.06} />
    </AbsoluteFill>
  );
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1005Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1005Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:100 900;font-display:block;}`}</style>
);

export const Ep1005: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const fallback = [0, 7.57, 16.88, 25.48, 36.78, 46.64, 57.34, 62.86, 72.02, 78.48, 88.7, 96.38, 100.1, 107.26, 114.4]
    .map((x) => Math.round(x * 30));
  const slots = scenes ?? fallback.slice(0, -1).map((from, i) => ({from, dur: fallback[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  void Character;
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.wall}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={i + 1} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1B2133" ink="#F7F7F2" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
