import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, NightGrade, ContactShadow} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {Character} from './lib/Character';
import {Moose, Mosquito} from './lib/fauna';
import {ImpactStar} from './lib/FX';
// every hand in this episode is the shaded, bell-finished hand (key/fill/rim + cast shadow), never the flat silhouette
import {ShadedHand as HandSil} from './lib/frontdesk';
import {BrassBell, CallSheet, CardboardBell, RotaryPhone, Handset, Walker, IconCard, FD, RowState} from './lib/frontdesk';

// A DESK THAT NEVER SLEEPS, 2026-10-06. Palette roles are art_direction.json: pine plank and teal night,
// ONE polished brass hero, ROW MINT only ever means a row somebody wrote down, WARNING RED only ever means
// the cell nobody wrote, the kitchen's alarm is its own bright blue, and lamp and ember are light only.
// Every painted string is a claims.json on_screen string, a quote, or a plain label of the set.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const C = {
  ...FD,
  teal: '#0F1E2A', tealLift: '#1B3446', moon: '#5B6B7C', violet: '#7B6FD0', paper: '#E7E5DA', slip: '#F2EBD0',
  ember: '#E39A45', lampKey: '#FFF1D2', flannel: '#B23A3A', puffer: '#2F7D6B', navy: '#14100D', ink: '#14100D',
};
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
const fade = (f: number, inAt: number, outAt: number, d = 8) => ease(f, inAt, d) * (1 - ease(f, outAt, d));

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'enamel' | 'slip' | 'brass' | 'alarm';
const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#1B2A38', fg: C.paper},
  enamel: {fill: C.paper, fg: C.ink},
  slip: {fill: C.slip, fg: C.ink},
  brass: {fill: C.brass, fg: C.ink},
  alarm: {fill: C.red, fg: C.paper},
};

/** THE NAMEPLATE. A mono plate sized to its string by arithmetic, ink or enamel and never brass, kept inside the
 *  plate band and clear of the square crop lines and the caption band. `lines` stack, longest line sets the width. */
const Plate: React.FC<{text: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number; reveal?: number[]}> =
({text, displayLines, x = 540, y, size = 30, tone = 'ink', p = 1, rot = 0, drop = 0, reveal}) => {
  const ls = displayLines ?? [text];
  const w = Math.min(1000, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const sc = 0.84 + 0.16 * spring(k * 20, 0, 20);
  return (
    <g opacity={Math.min(1, k * 1.6)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.28} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={C.ink} strokeWidth={4} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg} opacity={reveal ? clamp01(reveal[i] ?? 1) : 1}>{l}</text>
      ))}
    </g>
  );
};

/** A boxed quote, serif on paper with the attribution UNDER it as one plate (DISPATCH_STANDARD 9). Serif caps run 0.68 em. */
const QuotePlate: React.FC<{text: string; x?: number; y: number; size?: number; p?: number; rot?: number}> =
({text, x = 540, y, size = 40, p = 1, rot = 0}) => {
  const parts = text.split(' · ');
  const lines = [parts[0]];
  const by = parts.length > 1 ? parts.slice(1).join(' · ') : undefined;
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const tw = Math.min(1000, Math.max(...lines.map((l) => l.length * size * 0.68), by ? monoW(by, 22) : 0) + 80);
  const th = lines.length * (size + 10) + (by ? 46 : 0) + 36;
  assertCropSafe(lines.join(' '), y - th / 2, y + th / 2);
  const s = 0.6 + 0.4 * spring(k * 18, 0, 18);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={Math.min(1, k * 2)}>
      <rect x={-tw / 2 + 10} y={-th / 2 + 12} width={tw} height={th} fill="#000" opacity={0.28} />
      <rect x={-tw / 2} y={-th / 2} width={tw} height={th} fill={C.paper} stroke={C.ink} strokeWidth={7} />
      <rect x={-tw / 2 + 11} y={-th / 2 + 11} width={tw - 22} height={th - 22} fill="none" stroke={C.ink} strokeWidth={2.2} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-th / 2 + 22 + size * 0.86 + i * (size + 10)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={C.ink}>{l}</text>
      ))}
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={1} fill={C.redDk}>{by}</text>}
    </g>
  );
};

/** Snow in `n` flakes across a vertical span, three depths by `d`. */
const Snow: React.FC<{f: number; n?: number; y0?: number; y1?: number; speed?: number; op?: number; d?: number; wind?: number}> = ({f, n = 60, y0 = 0, y1 = H, speed = 1, op = 0.8, d = 1, wind = 0.25}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const h = hash(i * 13 + 5);
      const span = y1 - y0;
      const sp = (0.9 + ((h >>> 3) % 100) / 80) * speed * d;
      const y = y0 + ((((h >>> 8) % span) + f * sp) % span);
      const x = ((h % 1200) - 60 + Math.sin(f / (30 + (h % 25)) + i) * 14 + f * wind * d) % 1160;
      return <circle key={i} cx={x - 40} cy={y} r={(1.4 + ((h >>> 17) % 3)) * d} fill="#F4F8FF" opacity={op * (0.5 + ((h >>> 21) % 50) / 100)} />;
    })}
  </g>
);

/** Dust motes in a lamp pool, the always-running ambient layer. */
const Dust: React.FC<{f: number; n?: number; cx?: number; cy?: number; rx?: number; ry?: number; op?: number; color?: string}> = ({f, n = 24, cx = 420, cy = 1000, rx = 340, ry = 300, op = 0.35, color = '#FFF4D8'}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const h = hash(i * 7 + 3);
      const a = (h % 628) / 100 + f / (160 + (h % 90));
      const r = 0.25 + ((h >>> 9) % 75) / 100;
      const x = cx + Math.cos(a) * rx * r;
      const y = cy + Math.sin(a * 1.3) * ry * r - ((f * (0.1 + ((h >>> 5) % 40) / 200)) % 60);
      return <circle key={i} cx={x} cy={y} r={1.5 + ((h >>> 17) % 3)} fill={color} opacity={op * (0.4 + ((h >>> 21) % 60) / 100)} />;
    })}
  </g>
);

/** The nightcap, drawn on its own so it can be flung. Origin sits where it rests on the dome. */
const Nightcap: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-110,40 C-100,-40 -40,-110 40,-80 C100,-60 150,-10 170,60 C120,10 60,-20 -20,30 Z" fill="#E8E2D6" stroke={C.ink} strokeWidth={7} />
    <rect x={-120} y={30} width={150} height={26} rx={12} fill="#C94A3A" stroke={C.ink} strokeWidth={6} />
    <circle cx={176} cy={66} r={20} fill="#F6F2E8" stroke={C.ink} strokeWidth={6} />
  </g>
);

/** The coat peg: a board with a hook, an OWNER tag, and (when `coat` > 0) the owner's flannel coat hanging on it. */
const CoatPeg: React.FC<{x: number; y: number; coat?: number; f: number; s?: number}> = ({x, y, coat = 0, f, s = 1}) => {
  const sw = Math.sin(f / 33) * 1.2 * coat;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-64} y={-30} width={128} height={34} rx={8} fill={C.plankHi} stroke={C.ink} strokeWidth={6} />
      <circle cx={0} cy={4} r={9} fill="#8C8A84" stroke={C.ink} strokeWidth={4} />
      <rect x={-60} y={-26} width={90} height={22} rx={5} fill={C.brass} stroke={C.ink} strokeWidth={3} />
      <text x={-15} y={-9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} letterSpacing={1} fill={C.ink}>OWNER</text>
      {coat > 0.01 && (
        <g transform={`rotate(${sw} 0 8) translate(0,${(1 - clamp01(coat)) * -30})`} opacity={clamp01(coat * 3)}>
          <path d="M-70,14 L-40,0 L40,0 L70,14 L82,200 L50,206 L44,120 L40,300 L-40,300 L-44,120 L-50,206 L-82,200 Z" fill={C.flannel} stroke={C.ink} strokeWidth={6} />
          {[-40, -10, 20, 50].map((lx, i) => <line key={i} x1={lx} y1={10} x2={lx} y2={296} stroke="#7A2626" strokeWidth={3} opacity={0.5} />)}
          {[60, 120, 180, 240].map((ly, i) => <line key={i} x1={-76} y1={ly} x2={76} y2={ly} stroke="#7A2626" strokeWidth={3} opacity={0.4} />)}
          <path d="M0,2 L0,298" stroke={C.ink} strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

/** THE TRADING POST COUNTER ROOM. One hanging lamp is the key, the woodstove a low side key, the window a cold spill.
 *  `lamp` 0..1 dims the lamp, `moose` 0..1 walks the moose across the SIDE-COLUMN window, `mooseQ` 0..1 gives it a
 *  big question mark and a lean. The window sits below the plate band. */
const CounterRoom: React.FC<{f: number; lamp?: number; lampX?: number; moose?: number; mooseQ?: number; coat?: number; stove?: number; showCoat?: boolean}> = ({
  f, lamp = 1, lampX = 420, moose = 0, mooseQ = 0, coat = 0, stove = 1, showCoat = true,
}) => {
  const flick = 0.92 + 0.08 * Math.sin(f / 7) * Math.sin(f / 11);
  return (
    <g>
      {/* back wall: vertical planks */}
      <rect width={W} height={1150} fill="#2C2118" />
      {Array.from({length: 14}, (_, i) => (
        <g key={i}>
          <rect x={i * 80} y={0} width={78} height={1150} fill={i % 2 ? '#33261B' : '#2A1F16'} />
          <line x1={i * 80} y1={0} x2={i * 80} y2={1150} stroke="#150F0A" strokeWidth={4} />
          <line x1={i * 80 + 30} y1={60 + (i * 37) % 200} x2={i * 80 + 34} y2={300 + (i * 53) % 260} stroke="#3C2E21" strokeWidth={3} opacity={0.7} />
        </g>
      ))}
      {/* shelves at the far left, above the bell */}
      {[430, 610].map((sy, si) => (
        <g key={sy}>
          <rect x={30} y={sy} width={420} height={18} fill={C.plankHi} stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 6}, (_, i) => {
            const h = hash(i * 5 + si * 17);
            const bw = 40 + (h % 26), bh = 56 + ((h >>> 4) % 40);
            const bx = 50 + i * 66;
            return <g key={i}>
              <rect x={bx} y={sy - bh} width={bw} height={bh} rx={5} fill={['#8E3B2E', '#3E6A74', '#9A8742', '#5A4A7C', '#6B7A4A'][h % 5]} stroke={C.ink} strokeWidth={4} />
              <rect x={bx + 5} y={sy - bh + 14} width={bw - 10} height={10} fill="#E7E5DA" opacity={0.7} />
            </g>;
          })}
        </g>
      ))}
      {/* the window in a SIDE column, below the plate band */}
      <g>
        <rect x={812} y={762} width={250} height={226} fill={C.ink} />
        <clipPath id="winc"><rect x={822} y={772} width={230} height={206} /></clipPath>
        <g clipPath="url(#winc)">
          <rect x={822} y={772} width={230} height={206} fill="#10283A" />
          <rect x={822} y={772} width={230} height={90} fill={C.moon} opacity={0.35} />
          <path d="M822,830 C880,800 940,860 1052,820" fill="none" stroke={C.violet} strokeWidth={22} opacity={0.35} />
          <Snow f={f} n={22} y0={772} y1={980} speed={0.8} op={0.7} d={0.9} />
          {moose > 0.02 && (
            <g transform={`translate(${lerp(1090, 930, ease(moose * 100, 0, 100) * (1 - 0.0 * mooseQ))},${900 + mooseQ * 4}) scale(${0.3})`}>
              <Moose x={0} y={0} scale={1} f={f} facing={-1} emotion={mooseQ > 0.3 ? 'wary' : 'calm'} alert={mooseQ} />
            </g>
          )}
          {mooseQ > 0.05 && (
            <g transform={`translate(${902 + Math.sin(f / 9) * 3},${842}) rotate(${Math.sin(f / 11) * 4})`} opacity={clamp01(mooseQ * 2)}>
              <rect x={-26} y={-30} width={52} height={60} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
              <text x={0} y={22} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={58} fill={C.red}>?</text>
            </g>
          )}
        </g>
        <rect x={812} y={762} width={250} height={226} fill="none" stroke={C.plankHi} strokeWidth={12} />
        <line x1={937} y1={762} x2={937} y2={988} stroke={C.plankHi} strokeWidth={8} />
        <line x1={812} y1={875} x2={1062} y2={875} stroke={C.plankHi} strokeWidth={8} />
        <rect x={822} y={772} width={230} height={206} fill={C.frost} opacity={0.12} />
      </g>
      {showCoat && <CoatPeg x={92} y={780} coat={coat} f={f} />}
      {/* the woodstove, low at the left, a side key */}
      <g transform="translate(150,1090)">
        <rect x={-96} y={-110} width={192} height={150} rx={14} fill="#26221F" stroke={C.ink} strokeWidth={7} />
        <rect x={-56} y={-82} width={112} height={74} rx={8} fill={C.ember} opacity={0.35 + 0.55 * flick * stove} />
        <rect x={-56} y={-82} width={112} height={74} rx={8} fill="none" stroke={C.ink} strokeWidth={5} />
        <rect x={-14} y={-300} width={28} height={190} fill="#26221F" stroke={C.ink} strokeWidth={6} />
      </g>
      {/* the hanging lamp */}
      <g transform={`translate(${lampX},0)`}>
        <line x1={0} y1={0} x2={0} y2={300} stroke={C.ink} strokeWidth={6} />
        <path d="M-70,360 L-26,306 L26,306 L70,360 Z" fill="#2E3A44" stroke={C.ink} strokeWidth={6} />
        <ellipse cx={0} cy={362} rx={44} ry={9} fill={C.lampKey} opacity={0.4 + 0.6 * lamp} />
        <path d="M-44,364 L-340,1160 L340,1160 L44,364 Z" fill={C.lampKey} opacity={0.07 * lamp * flick} />
      </g>
      {/* the counter: top slab and front face */}
      <rect x={-20} y={1130} width={W + 40} height={84} fill={C.plankHi} stroke={C.ink} strokeWidth={7} />
      {Array.from({length: 5}, (_, i) => <line key={i} x1={-20} y1={1148 + i * 15} x2={W + 20} y2={1148 + i * 15} stroke={C.plank} strokeWidth={3} opacity={0.5} />)}
      <rect data-band="ok" x={-20} y={1214} width={W + 40} height={H - 1214} fill={C.plankDk} />
      {Array.from({length: 9}, (_, i) => <line key={i} data-band="ok" x1={i * 130} y1={1214} x2={i * 130} y2={H} stroke="#2A1D14" strokeWidth={5} />)}
      <ellipse cx={lampX} cy={1170} rx={340} ry={40} fill={C.lampKey} opacity={0.2 * lamp * flick} />
      {/* the near plane below the counter: floor boards, a feed sack, a lantern with its own glow, a pair of boots */}
      <g data-band="ok">
        <rect x={-20} y={1560} width={W + 40} height={H - 1560} fill="#1D140D" />
        {Array.from({length: 8}, (_, i) => <line key={i} x1={-20} y1={1600 + i * 46} x2={W + 20} y2={1600 + i * 46} stroke="#0F0A06" strokeWidth={5} />)}
        <rect x={-20} y={1500} width={W + 40} height={64} fill="#3A2A1D" stroke={C.ink} strokeWidth={6} />
        <g transform="translate(150,1800)">
          <ContactShadow cx={0} cy={100} rx={150} ry={20} opacity={0.5} blur={10} />
          <path d="M-110,100 C-130,20 -90,-90 -40,-110 L40,-110 C90,-90 130,20 110,100 Z" fill="#9A7B52" stroke={C.ink} strokeWidth={7} />
          <path d="M-46,-110 C-30,-140 30,-140 46,-110" fill="none" stroke={C.ink} strokeWidth={6} />
          {[-50, -10, 30, 70].map((sx) => <line key={sx} x1={sx} y1={-90} x2={sx + 8} y2={90} stroke="#7A5E3C" strokeWidth={4} opacity={0.7} />)}
        </g>
        <g transform="translate(930,1790)">
          <ContactShadow cx={0} cy={86} rx={90} ry={14} opacity={0.5} blur={8} />
          <circle cx={0} cy={-10} r={150 * stove * 0.0 + 120} fill={C.ember} opacity={0.12 * flick} />
          <rect x={-34} y={-34} width={68} height={92} rx={10} fill="#3A3E44" stroke={C.ink} strokeWidth={6} />
          <rect x={-22} y={-20} width={44} height={56} rx={6} fill="#FFD58A" opacity={0.85 * flick} />
          <path d="M-26,-34 C-26,-64 26,-64 26,-34" fill="none" stroke={C.ink} strokeWidth={6} />
        </g>
        <g transform="translate(700,1860)">
          <ContactShadow cx={0} cy={44} rx={110} ry={12} opacity={0.5} blur={8} />
          {[-44, 44].map((bx, i) => <path key={i} d={`M${bx - 28},-60 L${bx + 18},-60 L${bx + 18},-8 L${bx + 52},12 L${bx + 52},44 L${bx - 28},44 Z`} fill="#4A3A2A" stroke={C.ink} strokeWidth={6} />)}
        </g>
      </g>
    </g>
  );
};

/** The darkness outside the lamp, a radial that is clear at the pool and falls to near black. */
const Dim: React.FC<{amount: number; cx?: number; cy?: number; r?: number; id?: string}> = ({amount, cx = 420, cy = 1000, r = 900, id = 'dim'}) => (
  <g pointerEvents="none">
    <defs>
      <radialGradient id={id} cx={cx} cy={cy} r={r} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#050A10" stopOpacity={0} />
        <stop offset="0.55" stopColor="#050A10" stopOpacity={0.35 * amount} />
        <stop offset="1" stopColor="#050A10" stopOpacity={0.88 * amount} />
      </radialGradient>
    </defs>
    <rect data-band="ok" width={W} height={H} fill={`url(#${id})`} />
  </g>
);

// ---- the shot frame: push, kick, grade ---------------------------------------------------------
type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]};
type SceneProps = {p: SP};
const Frame: React.FC<{p: SP; z0?: number; z1?: number; dy?: number; night?: number; sources?: {x: number; y: number; r: number; color?: string; intensity?: number}[]; bloom?: number; vignette?: number; children: React.ReactNode}> =
({p, z0 = 1, z1 = 1.05, dy = 0, night = 0.5, sources = [], bloom = 0.05, vignette = 0.3, children}) => {
  const jolt = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const z = interpolate(p.f, [0, p.dur], [z0, z1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jolt.x}px, ${dy + jolt.y}px) scale(${z * jolt.scale})`}}>
        {children}
      </div>
      <NightGrade f={p.f} color="#0E2230" amount={night} floor={0.3} horizon={0.1} sources={sources} />
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.04} />
    </AbsoluteFill>
  );
};
const LAMP_SRC = [{x: 420, y: 380, r: 640, color: '#FFF1D2', intensity: 0.5}, {x: 150, y: 1050, r: 360, color: '#E39A45', intensity: 0.5}];

// ============================================================================================================
// S1  THE BELL AT 2 A.M. A dim lamp-pool counter, the bell asleep under a nightcap, an empty coat peg, the clipboard
// with one mint row and one red-rimmed blank row. The Mosquito rams the plunger and the bell wakes.
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const hit = b(2), wake = b(3), clip = b(4);
  const awake = f >= hit;
  const lamp = awake ? 1 : 0.5;
  const flash = awake ? 0.5 * (1 - ease(f, hit, 12)) : 0;
  const ring = awake ? Math.max(0, 1 - (f - hit) / 10) : 0;
  // the Mosquito dives from off frame to the plunger and bounces away
  const dive = easeIO(f, 4, hit - 4);
  const away = ease(f, hit + 2, 40);
  const mx = f < hit ? lerp(1260, 440, dive) : lerp(440, 760, away);
  const my = f < hit ? lerp(430, 842, dive) + Math.sin(f / 4) * 10 * (1 - dive) : lerp(842, 712, away) + Math.sin(f / 5) * 8 * away;
  // the flung nightcap
  const ct = clamp01((f - hit) / 36);
  const cap = !awake;
  const capX = lerp(430, 700, ct), capY = 868 - 300 * Math.sin(ct * Math.PI * 0.9) + 330 * ct * ct;
  const emotion = !awake ? 'asleep' : f < wake + 44 ? 'alert' : 'calm';
  const rings = f >= wake ? [0, 1, 2].map((i) => ease(f, wake + i * 8, 40)) : [];
  return (
    <Frame p={p} z0={1.0} z1={1.06} night={0.4} sources={LAMP_SRC} bloom={0.05}>
      <SVG>
        <CounterRoom f={f} lamp={lamp} moose={f >= clip ? ease(f, clip, 70) : 0} coat={0} />
        {/* clipboard and tag sit right of the bell: the dome reaches x~620 at y1068 and was drawn over the tag's left end */}
        <CallSheet x={730} y={950} scale={0.6} f={f} rows={['lit', 'blank'] as RowState[]} nail />
        {f >= clip && <Plate text="NOT WRITTEN DOWN" x={772} y={1068} size={19} tone="slip" p={ease(f, clip, 10)} rot={-2} />}
        <BrassBell x={420} y={1160} scale={1.12} f={f} emotion={emotion as 'asleep'} ring={ring} cap={cap ? 1 : 0} lamp={lamp} />
        {!awake && [0, 1, 2].map((i) => {
          const t = ((f / 40 + i / 3) % 1);
          return <text key={i} x={530 + t * 40 + i * 14} y={900 - t * 130} fontFamily={SERIF} fontWeight={900} fontSize={34 + i * 6} fill="#DDE6F0" opacity={0.8 * (1 - t)}>Z</text>;
        })}
        {awake && ct < 1 && <Nightcap x={capX} y={capY} rot={ct * 540} s={0.45} />}
        <Mosquito x={mx} y={my} scale={0.8} f={f} facing={-1} divebomb={f < hit ? dive : 0} />
        {rings.map((r, i) => r > 0.01 && r < 0.99 && (
          <circle key={i} cx={420} cy={1010} r={80 + r * 520} fill="none" stroke={C.lampKey} strokeWidth={8 * (1 - r)} opacity={0.5 * (1 - r)} />
        ))}
        <Dust f={f} cx={420} cy={1010} />
        <Dim amount={lerp(1.0, 0.5, lamp)} cx={420} cy={1000} r={860} id="d1" />
        {flash > 0.01 && <rect data-band="ok" width={W} height={H} fill="#FFE9A8" opacity={flash} style={{mixBlendMode: 'screen'}} />}
        <Plate text="NOBODY AT THE FRONT DESK" y={590} size={40} tone="ink" p={1} rot={f >= wake && f < wake + 14 ? Math.sin((f - wake) * 1.1) * 2.5 : 0} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S2  THE TRADING POST. A crane down on the post at night. Four small shops flip to OPEN, the masthead drops on
// chains, the Web 907 plate hooks on, the neon spells the sign.
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b, dur} = p;
  const cr = easeIO(f, 0, dur);
  const off = (d: number) => (1 - cr) * 150 * d;
  const msIn = land(f, b(5), 26);
  const webIn = land(f, b(7), 22);
  const neon = Math.floor(clamp01((f - b(8)) / 70) * 30);
  const SIGN_FULL = '"A FRONT DESK THAT NEVER SLEEPS" · STEVE VICK';
  const SIGN = SIGN_FULL.split(' · ')[0];
  const shops = [{x: 30, w: 170}, {x: 205, w: 150}, {x: 735, w: 150}, {x: 890, w: 170}];
  const smoke = Array.from({length: 7}, (_, i) => ((f / 90 + i / 7) % 1));
  return (
    <Frame p={p} z0={1.0} z1={1.04} night={0.35} sources={[{x: 380, y: 1060, r: 420, color: '#FFD58A', intensity: 0.6}, {x: 540, y: 1150, r: 300, color: '#FFD58A', intensity: 0.5}]} bloom={0.06}>
      <SVG>
        <defs>
          <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#08121E" /><stop offset="0.6" stopColor="#14283C" /><stop offset="1" stopColor="#1E3A4C" /></linearGradient>
        </defs>
        <g transform={`translate(0,${off(0.3)})`}>
          <rect y={-200} width={W} height={1500} fill="url(#sky2)" />
          {Array.from({length: 46}, (_, i) => {
            const h = hash(i * 11);
            return <circle key={i} cx={h % 1080} cy={(h >>> 8) % 700} r={1 + ((h >>> 16) % 2)} fill="#F4F8FF" opacity={0.4 + 0.5 * Math.abs(Math.sin(f / 30 + i))} />;
          })}
          <path d={`M-40,260 C220,${140 + Math.sin(f / 60) * 20} 520,${340 + Math.sin(f / 70) * 20} 1120,200`} fill="none" stroke={C.violet} strokeWidth={90} opacity={0.22} />
          <path d={`M-40,330 C260,${230 + Math.sin(f / 50) * 16} 600,${430 + Math.sin(f / 80) * 16} 1120,300`} fill="none" stroke="#5B7FD0" strokeWidth={50} opacity={0.18} />
        </g>
        <g transform={`translate(0,${off(0.6)})`}>
          {[[-30, 520], [90, 460], [960, 500], [1060, 440]].map(([x, y], i) => (
            <path key={i} d={`M${x},${y + 520} L${x - 110},${y + 520} L${x - 60},${y + 330} L${x - 90},${y + 330} L${x - 30},${y + 140} L${x},${y} L${x + 30},${y + 140} L${x + 90},${y + 330} L${x + 60},${y + 330} L${x + 110},${y + 520} Z`} fill="#0A1620" stroke="#070E15" strokeWidth={4} />
          ))}
          {/* four small shops down the street, each flips to OPEN */}
          {shops.map((s, i) => {
            const open = f >= b(6) + i * 9;
            const k = spring(f, b(6) + i * 9, 12);
            return (
              <g key={i}>
                <rect x={s.x} y={1060} width={s.w} height={190} fill="#1B2B38" stroke={C.ink} strokeWidth={5} />
                <path d={`M${s.x - 8},1060 L${s.x + s.w / 2},1005 L${s.x + s.w + 8},1060 Z`} fill="#DDE6F0" stroke={C.ink} strokeWidth={5} />
                <rect x={s.x + 22} y={1100} width={s.w - 44} height={80} fill={open ? '#FFD58A' : '#0F1C27'} stroke={C.ink} strokeWidth={5} />
                {open && <ellipse cx={s.x + s.w / 2} cy={1168} rx={22} ry={13} fill={C.brass} stroke={C.ink} strokeWidth={4} />}
                <g transform={`translate(${s.x + s.w / 2},1082) scale(${1},${0.6 + 0.4 * k})`}>
                  <rect x={-34} y={-12} width={68} height={24} rx={4} fill={open ? C.ember : '#33414E'} stroke={C.ink} strokeWidth={3} />
                  <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={15} fill={C.ink}>{open ? 'OPEN' : 'SHUT'}</text>
                </g>
              </g>
            );
          })}
        </g>
        <g transform={`translate(0,${off(1.0)})`}>
          {/* the trading post */}
          <rect x={250} y={880} width={580} height={410} fill="#4A3426" stroke={C.ink} strokeWidth={8} />
          {Array.from({length: 9}, (_, i) => <line key={i} x1={250} y1={925 + i * 45} x2={830} y2={925 + i * 45} stroke="#2E2018" strokeWidth={5} />)}
          <path d="M215,885 L540,690 L865,885 Z" fill="#33261B" stroke={C.ink} strokeWidth={8} />
          <path d="M232,880 L540,704 L848,880 L820,880 L540,722 L260,880 Z" fill="#E9EEF5" />
          <rect x={720} y={690} width={46} height={150} fill="#2B2B2E" stroke={C.ink} strokeWidth={6} />
          {smoke.map((t, i) => <circle key={i} cx={743 + Math.sin(t * 6 + i) * 18 + t * 40} cy={680 - t * 220} r={16 + t * 34} fill="#CBD3DC" opacity={0.5 * (1 - t)} />)}
          {/* windows and door, warm */}
          <rect x={290} y={965} width={180} height={185} fill="#FFD58A" stroke={C.ink} strokeWidth={7} />
          <rect x={610} y={965} width={180} height={185} fill="#FFC873" stroke={C.ink} strokeWidth={7} />
          <line x1={380} y1={965} x2={380} y2={1150} stroke={C.ink} strokeWidth={5} /><line x1={290} y1={1057} x2={470} y2={1057} stroke={C.ink} strokeWidth={5} />
          <BrassBell x={382} y={1148} scale={0.36} f={f} emotion="calm" shadow={false} lamp={1} blink={0} />
          <rect x={470} y={1010} width={140} height={280} fill="#E39A45" opacity={0.85} stroke={C.ink} strokeWidth={7} />
          <rect x={486} y={1026} width={108} height={170} fill="#FFD58A" opacity={0.9} />
          {/* the neon sign, letter by letter, brass-ember, never as saturated as the alarm */}
          <rect x={300} y={888} width={480} height={52} rx={8} fill="#10161C" stroke={C.ink} strokeWidth={5} />
          <text x={540} y={925} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1.2} fill={C.ember} opacity={0.9}>
            {SIGN.slice(0, neon)}<tspan fill="#2A3138">{SIGN.slice(neon)}</tspan>
          </text>
          {neon > 0 && <rect x={300} y={888} width={480} height={52} rx={8} fill={C.ember} opacity={0.12 + 0.05 * Math.sin(f / 3)} />}
        </g>
        <g transform={`translate(0,${off(1.5)})`}>
          <path d={`M-20,1290 C200,1250 400,1330 600,1290 C800,1250 950,1310 1100,1280 L1100,1400 L-20,1400 Z`} fill="#DCE6F0" />
          <rect data-band="ok" x={-20} y={1330} width={W + 40} height={H - 1330} fill="#CBD6E2" />
        </g>
        <g transform={`translate(0,${off(1.8)})`}>
          {Array.from({length: 9}, (_, i) => (
            <g key={i} transform={`translate(${60 + i * 128},1590)`}>
              <rect x={-14} y={0} width={28} height={230} fill="#4A3A2A" stroke={C.ink} strokeWidth={6} />
              <path d="M-14,0 L0,-26 L14,0 Z" fill="#4A3A2A" stroke={C.ink} strokeWidth={6} />
              <ellipse cx={0} cy={-6} rx={22} ry={10} fill="#EAF2FA" />
            </g>
          ))}
          <rect x={-20} y={1640} width={W + 40} height={18} fill="#4A3A2A" stroke={C.ink} strokeWidth={5} />
          <rect x={-20} y={1720} width={W + 40} height={18} fill="#4A3A2A" stroke={C.ink} strokeWidth={5} />
          <path d="M-20,1860 C200,1820 420,1890 640,1850 C860,1810 980,1870 1100,1840 L1100,1960 L-20,1960 Z" fill="#E7EEF6" />
        </g>
        <Snow f={f} n={34} d={0.6} op={0.6} />
        <Snow f={f} n={22} d={1.0} op={0.8} wind={0.35} />
        <Snow f={f} n={14} d={1.7} op={0.9} wind={0.5} />
        {/* the masthead on two chains, the Web 907 plate on a bracket */}
        {[-300, 300].map((rx) => <line key={rx} x1={540 + rx} y1={-20} x2={540 + rx} y2={lerp(-60, 540, clamp01(msIn))} stroke={C.ink} strokeWidth={6} opacity={clamp01(msIn * 4)} />)}
        <Plate text="ALASKA BUSINESS · SEPT 28TH · TRACY BARBOUR" y={560} size={24} tone="enamel" p={clamp01(msIn)} drop={460} rot={Math.sin((f - b(5)) / 6) * 1.5 * Math.exp(-(f - b(5)) / 30)} />
        <Plate text="STEVE VICK WEB 907 · FAIRBANKS" displayLines={['STEVE VICK', 'WEB 907 · FAIRBANKS']} x={lerp(1400, 540, clamp01(webIn))} y={690} size={26} tone="ink" p={clamp01(webIn * 4)} rot={Math.sin((f - b(7)) / 5) * 2 * Math.exp(-(f - b(7)) / 24)} />
        <Dim amount={0.35} cx={540} cy={1000} r={1100} id="d2" />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S3  THE GUIDE CABIN. Tight on the tiny side door, then at the estimate the camera pulls back and the whole hundred
// arrive: about seven take the side door, drawn at true scale.
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const zoom = lerp(1.9, 1.0, easeIO(f, b(12) - 12, 74));
  const cx = 815, cy = 1200;
  // the estimate waits for the pull-back: zoom is easeIO(b(12)-12, 74), so at b(12)+36 it is ~1.16 and the roof edge
  // (scene y700) sits at screen ~620, well below the plate's 431..521 span in open sky; landing at b(12) put it on the shingle
  const tag = ease(f, b(10), 14), quote = ease(f, b(11), 12), est = ease(f, b(12) + 36, 14);
  const sideLamp = 0.5 + 0.5 * spring(f, b(11), 16);
  const WALL = '#4A3426';
  return (
    <Frame p={p} z0={1.0} z1={1.02} night={0.3} sources={[{x: 265, y: 1000, r: 320, color: '#FFD58A', intensity: 0.5}, {x: 815, y: 1100, r: 260, color: '#FFD58A', intensity: 0.55}]} bloom={0.05}>
      <SVG>
        <defs>
          <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#101A2E" /><stop offset="0.7" stopColor="#2A3F5C" /><stop offset="1" stopColor="#6B5A6A" /></linearGradient>
        </defs>
        <g transform={`translate(${cx},${cy}) scale(${zoom}) translate(${-cx},${-cy})`}>
          <rect y={-300} width={W} height={1100} fill="url(#sky3)" />
          <path d="M-20,760 L1100,760 L1100,700 L-20,700 Z" fill="#2A2018" stroke={C.ink} strokeWidth={6} />
          <rect x={-20} y={760} width={W + 40} height={560} fill={WALL} stroke={C.ink} strokeWidth={6} />
          {Array.from({length: 12}, (_, i) => (
            <g key={i}>
              <line x1={-20} y1={790 + i * 46} x2={W + 20} y2={790 + i * 46} stroke="#2E2018" strokeWidth={6} />
              <ellipse cx={14} cy={790 + i * 46 - 22} rx={14} ry={20} fill="#6B4A32" stroke={C.ink} strokeWidth={3} />
              <ellipse cx={W - 14} cy={790 + i * 46 - 22} rx={14} ry={20} fill="#6B4A32" stroke={C.ink} strokeWidth={3} />
            </g>
          ))}
          {/* snow on the roof edge */}
          <path d="M-20,700 C200,690 400,720 600,700 C800,684 950,716 1100,700 L1100,730 L-20,730 Z" fill="#E7EEF6" />
          {/* the antler rack and the shingle */}
          <g transform="translate(540,845)">
            <rect x={-60} y={-8} width={120} height={22} rx={6} fill={C.plankHi} stroke={C.ink} strokeWidth={5} />
            {[-1, 1].map((sd) => <path key={sd} d={`M${sd * 20},-6 C${sd * 60},-50 ${sd * 90},-40 ${sd * 110},-90 M${sd * 60},-34 L${sd * 80},-80 M${sd * 85},-44 L${sd * 118},-52`} fill="none" stroke="#D9CBB0" strokeWidth={10} strokeLinecap="round" />)}
          </g>
          <g transform="translate(540,930)">
            <rect x={-150} y={-24} width={300} height={52} rx={6} fill={C.plankHi} stroke={C.ink} strokeWidth={6} />
            <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={27} letterSpacing={1.5} fill={C.ink}>GUIDE SERVICE</text>
          </g>
          {/* the big plain door and the tiny side door */}
          <rect x={110} y={1000} width={310} height={300} fill="#2E2018" stroke={C.ink} strokeWidth={8} />
          <line x1={265} y1={1000} x2={265} y2={1300} stroke={C.ink} strokeWidth={6} />
          <rect x={126} y={1016} width={126} height={270} fill="#5A3E2A" stroke={C.ink} strokeWidth={4} />
          <rect x={278} y={1016} width={126} height={270} fill="#5A3E2A" stroke={C.ink} strokeWidth={4} />
          <g transform="translate(265,960)"><rect x={-110} y={-22} width={220} height={44} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={21} letterSpacing={1.2} fill={C.ink}>EVERYONE ELSE</text></g>
          <rect x={770} y={1105} width={90} height={195} fill="#2E2018" stroke={C.ink} strokeWidth={7} />
          <rect x={782} y={1117} width={66} height={175} fill="#E39A45" opacity={0.7} />
          <g transform="translate(815,1070)"><rect x={-66} y={-20} width={132} height={38} rx={5} fill={C.paper} stroke={C.ink} strokeWidth={5} /><text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={19} letterSpacing={1} fill={C.ink}>CHATBOT</text></g>
          {/* porch lamps; the side door's lamp holds the bell */}
          <circle cx={265} cy={965} r={0} />
          <g transform="translate(815,1030)">
            <circle r={22} fill="#FFE9B0" opacity={0.7 * sideLamp + 0.2} stroke={C.ink} strokeWidth={4} />
            <circle r={52 * sideLamp + 20} fill="#FFD58A" opacity={0.2 * sideLamp} />
            <ellipse cx={0} cy={5} rx={13} ry={9} fill={C.brass} stroke={C.ink} strokeWidth={3} />
            <path d="M-13,5 C-13,-8 -6,-14 0,-14 C6,-14 13,-8 13,5 Z" fill={C.brass} stroke={C.ink} strokeWidth={3} />
          </g>
          <rect data-band="ok" x={-20} y={1290} width={W + 40} height={H - 1290} fill="#DCE6F0" />
          {/* the queue at the big door: a stylised SAMPLE of everyone else, eight spaced, shaded residents of varied
              height and pose (2026-10-06 fix round: 93 flat clones read as a striped mass), the line running off the
              left edge so it reads as continuing past the frame */}
          {[
            {x: 30, dy: 10, s: 2.7, tall: 1.05, coat: '#3E5C86', hat: '#C98A2A', lean: -3, fc: 1},
            {x: 92, dy: -4, s: 2.45, tall: 0.92, coat: '#B23A3A', hat: '#2F4F3E', lean: 2, fc: 1},
            {x: 150, dy: 14, s: 2.85, tall: 1.12, coat: '#7A7A52', hat: '#3E5C86', lean: 0, fc: 1},
            {x: 212, dy: 0, s: 2.35, tall: 0.86, coat: '#C98A2A', hat: '#8A3B2E', lean: -4, fc: 1},
            {x: 268, dy: 12, s: 2.6, tall: 1.0, coat: '#2F7D6B', hat: '#C98A2A', lean: 3, fc: -1},
            {x: 330, dy: -2, s: 2.5, tall: 1.08, coat: '#6B4A7C', hat: '#2F4F3E', lean: 0, fc: 1},
            {x: 392, dy: 16, s: 2.75, tall: 0.95, coat: '#3E5C86', hat: '#8A3B2E', lean: -2, fc: -1},
            {x: 456, dy: 4, s: 2.4, tall: 1.02, coat: '#B23A3A', hat: '#3E5C86', lean: 4, fc: -1},
          ].map((w, k) => (
            <Walker key={k} x={w.x + Math.sin(f / 38 + k) * 2.5} y={1290 + w.dy} s={w.s} tall={w.tall} lean={w.lean + Math.sin(f / 31 + k * 1.7) * 1.5}
              f={f} coat={w.coat} hat={w.hat} phase={k * 1.3} facing={w.fc as 1 | -1} shade stride={0.25} breath={1} />
          ))}
          {/* the seven who take the side door */}
          {Array.from({length: 7}, (_, i) => {
            const x0 = 815 + 4 * (30 + i * 40);
            const x = Math.max(815, x0 - 4 * f);
            const arrived = x <= 815;
            const sink = arrived ? clamp01((f - (x0 - 815) / 4) / 14) : 0;
            return <Walker key={i} x={x} y={1300 - sink * 6} s={2.5 * (1 - 0.5 * sink)} f={f} coat={['#E39A45', '#6FC0FF', '#B23A3A', '#2F7D6B', '#C98A2A', '#7B6FD0', '#B23A3A'][i]} hat="#2A2F3A" phase={i * 2} facing={-1} shade />;
          }).concat([])}
          {Array.from({length: 9}, (_, i) => (
            <g key={i} transform={`translate(${40 + i * 130},1440)`}>
              <rect x={-12} y={0} width={24} height={210} fill="#4A3A2A" stroke={C.ink} strokeWidth={5} />
              <ellipse cx={0} cy={-2} rx={20} ry={9} fill="#EAF2FA" />
            </g>
          ))}
          <rect data-band="ok" x={-20} y={1490} width={W + 40} height={16} fill="#4A3A2A" stroke={C.ink} strokeWidth={5} />
          <rect data-band="ok" x={-20} y={1570} width={W + 40} height={16} fill="#4A3A2A" stroke={C.ink} strokeWidth={5} />
          {/* breath puffs over the queue */}
          {Array.from({length: 14}, (_, i) => {
            const t = ((f / 60 + i / 14) % 1);
            const h = hash(i * 9);
            return <circle key={i} cx={60 + (h % 440)} cy={1190 - t * 40} r={4 + t * 9} fill="#EAF2FA" opacity={0.35 * (1 - t)} />;
          })}
        </g>
        <Snow f={f} n={40} d={0.8} op={0.7} />
        <Plate text="ROD PANGBORN · NORTH POLE" displayLines={['ROD PANGBORN', 'NORTH POLE']} x={790} y={545} size={28} tone="enamel" p={ease(f, b(9), 14) * (1 - ease(f, b(12) - 4, 8))} />
        <Plate text="WEB 907 CLIENT" x={790} y={640} size={22} tone="slip" p={tag * (1 - ease(f, b(12) - 4, 8))} rot={Math.sin((f - b(10)) / 5) * 3 * Math.exp(-(f - b(10)) / 20)} />
        <QuotePlate text={'"SCARY-GOOD" · ROD PANGBORN'} y={738} size={38} p={quote * (1 - ease(f, b(12) - 4, 8))} rot={-1.5} />
        <Plate text="ABOUT 5 TO 10% OF CUSTOMERS USE IT · PANGBORN'S ESTIMATE · PER ALASKA BUSINESS" displayLines={['ABOUT 5 TO 10% OF CUSTOMERS USE IT', "PANGBORN'S ESTIMATE · PER ALASKA BUSINESS"]} y={492} size={22} tone="enamel" p={est} />
        <Dim amount={0.3} cx={540} cy={1100} r={1100} id="d3" />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S4  ONE NUMBER AT MIDNIGHT. A dark kitchen, a sick dog that doesn't lift its head, a worried owner and a ringing
// rotary phone. The frost-blue alarm settles to white when the call is answered and one row on the fridge lights mint.
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const answered = b(16);
  const ringing = f < answered;
  const relief = ease(f, answered, 30);
  const alarm = (ringing ? 0.5 + 0.5 * Math.sin(f / 3.8) : 0.5 * (1 - relief) * 0) * (1 - relief);
  const walkP = clamp01(f / 66);
  // once he has arrived he shifts his weight foot to foot while he waits on the line (two incommensurate periods)
  const settled = ease(f, 60, 30);
  const ox = lerp(1260, 700, easeIO(f, 0, 66)) + settled * (7 * Math.sin((f - 66) / 34) + 1.6 * Math.sin((f - 66) / 13));
  // THE RECEIVER. He reaches for it (point, 58..80), lifts it off the cradle (84..94) and holds it to his ear to the
  // end of the shot. Ear-side anchor is the rig's head (feet-relative (±56,-366) at scale 1.2), cups toward the head.
  const fc = f < answered + 26 ? -1 : 1;
  const fr = useCurrentFrame(); // the Sequence-local clock, identical to f; staging_check resolves it as frame-driven
  const reach = interpolate(fr, [58, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lifted = f >= 84;
  const liftT = easeIO(f, 84, 10);
  const hsX = lerp(400, ox + fc * 1.2 * 62, liftT);
  const hsY = lerp(1023, 888 + Math.sin(f / 9) * 1.5, liftT) - 70 * Math.sin(Math.PI * liftT);
  const hsR = lerp(0, fc * 80, liftT), hsS = lerp(1, 0.65, liftT);
  const hsEnds = [-95, 95].map((u) => ({x: hsX + u * hsS * Math.cos((hsR * Math.PI) / 180), y: hsY + u * hsS * Math.sin((hsR * Math.PI) / 180)}));
  const hsLow = hsEnds[0].y > hsEnds[1].y ? hsEnds[0] : hsEnds[1];
  const srcX = lifted ? hsX : 400, srcY = lifted ? hsY : 1060;
  const stroke = ease(f, answered + 14, 24);
  const rings = Array.from({length: 3}, (_, i) => ((f / 34 + i / 3) % 1));
  const white = Array.from({length: 3}, (_, i) => clamp01((f - answered - i * 10) / 50));
  const clockMin = f < b(15) ? 59 : 60;
  const rowState: RowState[] = ['dim', f >= answered ? 'lit' : 'dim', 'dim'];
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0.5} sources={[{x: 430, y: 1100, r: 300, color: '#FFE0A0', intensity: 0.4}]} bloom={0.04}>
      <SVG>
        <rect width={W} height={H} fill="#15202B" />
        <rect y={1250} width={W} height={H - 1250} fill="#0E161E" />
        {/* 9:16 bottom third: kitchen floorboards in perspective and a braided rug the dog bed sits on (set dressing only) */}
        {Array.from({length: 13}, (_, i) => (
          <line key={i} data-band="ok" x1={i * 90} y1={1250} x2={540 + (i * 90 - 540) * 1.9} y2={H} stroke="#1C2A36" strokeWidth={5} />
        ))}
        {[1420, 1620, 1840].map((ly) => <line key={ly} data-band="ok" x1={0} y1={ly} x2={W} y2={ly} stroke="#1C2A36" strokeWidth={4} opacity={0.7} />)}
        <ellipse data-band="ok" cx={820} cy={1400} rx={300} ry={110} fill="#4A3A2E" stroke={C.ink} strokeWidth={6} />
        <ellipse data-band="ok" cx={820} cy={1400} rx={240} ry={84} fill="none" stroke="#B0805A" strokeWidth={10} opacity={0.7} />
        <ellipse data-band="ok" cx={820} cy={1400} rx={170} ry={58} fill="none" stroke="#3E5C6E" strokeWidth={10} opacity={0.8} />
        {/* the window with a cold moon */}
        <rect x={740} y={420} width={260} height={330} fill="#0B141C" stroke={C.ink} strokeWidth={8} />
        <circle cx={870} cy={540} r={44} fill="#C9D5E2" opacity={0.85} />
        <rect x={740} y={420} width={260} height={330} fill={C.moon} opacity={0.2} />
        <Snow f={f} n={16} y0={420} y1={750} speed={0.7} op={0.5} d={0.7} />
        {/* the fridge, the magnet sheet, the keys on their hook */}
        <rect x={50} y={470} width={250} height={740} rx={14} fill="#B9C2CA" stroke={C.ink} strokeWidth={8} />
        <rect x={50} y={470} width={250} height={14} fill="#E4EAF0" opacity={0.6} />
        <line x1={50} y1={760} x2={300} y2={760} stroke={C.ink} strokeWidth={5} />
        <CallSheet x={175} y={640} scale={0.4} f={f} rows={rowState} glow={relief} />
        <Plate text="ON CALL TONIGHT" x={175} y={820} size={18} tone="slip" p={ease(f, answered + 6, 12)} />
        <g transform="translate(640,930)">
          <circle r={7} fill="#8C8A84" stroke={C.ink} strokeWidth={3} />
          <g transform={`rotate(${Math.sin(f / 20) * 3 + (f > answered ? Math.sin((f - answered) / 4) * 6 * Math.exp(-(f - answered) / 40) : 0)} 0 0)`}>
            <path d="M0,0 L0,30" stroke={C.ink} strokeWidth={4} />
            <circle cx={0} cy={44} r={14} fill="none" stroke="#C9D5E2" strokeWidth={5} />
            <rect x={-6} y={58} width={12} height={30} rx={3} fill="#C9D5E2" stroke={C.ink} strokeWidth={3} />
          </g>
          {f > answered && <circle cx={0} cy={54} r={10 + 26 * Math.abs(Math.sin((f - answered) / 6))} fill="none" stroke="#FFF1D2" strokeWidth={3} opacity={0.5} />}
        </g>
        {/* the wall clock */}
        <g transform="translate(500,740) scale(0.88)">
          <circle r={64} fill="#E7E5DA" stroke={C.ink} strokeWidth={8} />
          <line x1={0} y1={0} x2={0} y2={-44} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
          <line x1={0} y1={0} x2={Math.sin((clockMin / 60) * Math.PI * 2) * 52} y2={-Math.cos((clockMin / 60) * Math.PI * 2) * 52} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
          {f >= b(15) && f < b(15) + 6 && <ImpactStar cx={0} cy={0} r={46} color="#FFFFFF" />}
        </g>
        {/* the table, the phone, the dog bed */}
        <rect x={210} y={1130} width={380} height={30} rx={6} fill={C.plankHi} stroke={C.ink} strokeWidth={6} />
        {[250, 540].map((lx) => <rect key={lx} x={lx} y={1160} width={22} height={120} fill={C.plank} stroke={C.ink} strokeWidth={5} />)}
        <RotaryPhone x={400} y={1130} scale={1.0} f={f} ring={ringing && !lifted ? 1 : 0} glow={0} lifted={lifted} />
        {/* the coiled cord from the phone body to the lifted receiver */}
        {lifted && (
          <g fill="none" strokeLinecap="round">
            <path d={`M505,1100 Q${(505 + hsLow.x) / 2},${Math.max(1100, hsLow.y) + 90 + Math.sin(f / 16) * 8} ${hsLow.x},${hsLow.y}`} stroke={C.ink} strokeWidth={9} />
            <path d={`M505,1100 Q${(505 + hsLow.x) / 2},${Math.max(1100, hsLow.y) + 90 + Math.sin(f / 16) * 8} ${hsLow.x},${hsLow.y}`} stroke="#3A322C" strokeWidth={5} strokeDasharray="4 3" />
          </g>
        )}
        <g transform="translate(840,1288)">
          <ellipse cx={0} cy={6} rx={170} ry={34} fill="#3A2A3E" stroke={C.ink} strokeWidth={6} />
          <ellipse cx={0} cy={-4} rx={140} ry={22} fill="#5B4A60" />
          <ellipse cx={20} cy={-30} rx={92} ry={36} fill="#8A6F58" stroke={C.ink} strokeWidth={6} />
          <g transform={`translate(-64,-18) rotate(${f > answered ? -4 - stroke * 3 : 0})`}>
            <circle r={30} fill="#9A7D64" stroke={C.ink} strokeWidth={6} />
            <path d="M-26,-14 C-48,-8 -50,22 -28,26 Z" fill="#6E563F" stroke={C.ink} strokeWidth={5} />
            <circle cx={6} cy={0} r={4} fill={C.ink} />
          </g>
          <path d={`M112,-34 C136,-44 ${148 + (f > answered ? Math.sin(f / 5) * 6 : 0)},-30 150,-12`} fill="none" stroke="#8A6F58" strokeWidth={14} strokeLinecap="round" />
        </g>
        {/* the worried owner walks in, reaches for the phone, lifts the receiver to his ear and shifts his weight while
            it rings through; relief turns him toward the dog with the receiver still at his ear */}
        <Character frame={f} x={ox} y={1296} scale={1.2} facing={fc} outfit="puffer" headgear="beanie"
          pose={f < 58 ? 'stand' : !lifted ? 'point' : 'raise'} gesture={reach} emotion={f < answered ? 'worried' : 'neutral'}
          walking={walkP < 1} walkPhase={walkP * 8} look={f >= answered ? 12 : 0} idleGain={1.6} />
        {lifted && <Handset x={hsX} y={hsY} rot={hsR} s={hsS} />}
        {/* (fix round 2026-10-06) the separate puffer-sleeve hand that floated over the dog is gone: it rose out of the
            owner's knees as a third arm. Relief reads on the owner's own body (head turns, look=12) and the dog's tail. */}
        {/* the frost-blue alarm: rings and a pulsing wash while it rings, white when answered */}
        {ringing && rings.map((r, i) => <circle key={i} cx={srcX} cy={srcY} r={40 + r * 520} fill="none" stroke={C.alarm} strokeWidth={10 * (1 - r)} opacity={0.7 * (1 - r)} />)}
        <rect data-band="ok" width={W} height={H} fill={C.alarm} opacity={0.12 * alarm} style={{mixBlendMode: 'screen'}} />
        {white.map((r, i) => r > 0.01 && r < 0.99 && <circle key={i} cx={srcX} cy={srcY} r={40 + r * 600} fill="none" stroke="#FFFFFF" strokeWidth={8 * (1 - r)} opacity={0.65 * (1 - r)} />)}
        {/* ONE plate in the open wall between the fridge (x<=300) and the window (x>=740), x 325..714 y 493..667, inside
            the square crop; the clock sits below it at 684..796. Each line arrives with its VO beat. */}
        <Plate text="WEB 907 JOB · EMERGENCY VET SERVICE · AFTER HOURS · ONE NUMBER" displayLines={['WEB 907 JOB', 'EMERGENCY VET SERVICE', 'AFTER HOURS', 'ONE NUMBER']}
          x={520} y={580} size={24} tone="ink" p={ease(f, b(13), 12) * (1 - ease(f, answered + 40, 10))} reveal={[1, ease(f, b(14), 10), ease(f, b(14), 10), ease(f, b(15), 10)]} />
        <Dim amount={0.55} cx={420} cy={1050} r={1000} id="d4" />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S5  INSIDE THE BELL (the signature shot). The lit mint row from the fridge fills the frame and becomes the one lit
// row inside the bell, the camera dollies into the brass, the metal goes translucent amber, and there are no circuits.
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const zz = lerp(1.0, 1.32, easeIO(f, 6, 230));
  const cut = ease(f, 20, 44);
  const m = easeIO(f, 0, 22);
  const rowX = 540 - 170, rowY = 905, rowW = 340, rowH = 52;
  const r0 = {x: lerp(0, rowX, m), y: lerp(880, rowY, m), w: lerp(1080, rowW, m), h: lerp(220, rowH, m)};
  const bellIn = ease(f, 8, 14);
  const relief = ease(f, b(19), 24);
  const bar = f < b(19) + 22 ? lerp(-60, 0, easeIO(f, b(19) - 20, 40)) : 0;
  return (
    <Frame p={p} z0={1} z1={1} night={0.25} bloom={0.08} vignette={0.35}>
      <SVG>
        <rect width={W} height={H} fill="#1A130E" />
        <g transform={`translate(540,1060) scale(${zz}) translate(-540,-1060)`}>
          <g opacity={bellIn}>
            <BrassBell x={540} y={1380} scale={3.0} f={f} emotion="calm" cut={cut} blink={0}
              inside={
                <g transform="translate(0,-120) scale(0.4)">
                  <CallSheet x={0} y={0} scale={1} f={f} rows={['lit', 'dim'] as RowState[]} nail glow={1} />
                </g>
              } />
          </g>
          {f < 34 && <rect x={r0.x} y={r0.y} width={r0.w} height={r0.h} rx={10} fill={C.mint} opacity={1 - ease(f, 18, 14)} />}
          {f >= b(19) - 20 && <rect x={rowX + 6} y={rowY + rowH / 2 + bar} width={rowW - 12} height={5} fill="#FFFFFF" opacity={0.85 * (1 - 0.0)} />}
        </g>
        <rect data-band="ok" width={W} height={H} fill="#FFB347" opacity={0.2 * cut} style={{mixBlendMode: 'screen'}} />
        <Dust f={f} cx={540} cy={1060} rx={420} ry={260} n={30} op={0.5} color="#FFE7B0" />
        <QuotePlate text={'"JUST READING A SPREADSHEET" · STEVE VICK'} y={560} size={36} p={ease(f, b(18), 12)} rot={-1} />
        {f >= b(19) && (
          <g>
            <circle cx={880} cy={730} r={64} fill="none" stroke={relief > 0.5 ? '#FFFFFF' : C.alarm} strokeWidth={10 - 5 * relief} opacity={0.9} />
            <circle cx={880} cy={730} r={64 - 24 * relief} fill={relief > 0.5 ? '#FFFFFF' : C.alarm} opacity={0.35} />
            <Plate text="PANIC TO RELIEF" x={880} y={826} size={20} tone="slip" p={ease(f, b(19), 10)} />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S6  THE FREE BELL. The camera has pulled out of the dome to the counter. A flat cardboard FREE bell wedges in beside
// the polished brass one with nothing behind it, the moose leans with a big question mark, and a hand lifts the sheet.
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cin = land(f, b(20) + 4, 26);
  const cx = lerp(1380, 770, clamp01(cin));
  const sq = f > b(20) + 26 ? 1 + 0.05 * Math.sin((f - b(20) - 26) / 2.2) * Math.exp(-(f - b(20) - 26) / 7) : 1;
  const lift = easeIO(f, b(23), 50);
  const handIn = ease(f, b(23) - 20, 22);
  const sheetY = lerp(780, 800, lift), sheetS = lerp(0.6, 0.95, lift), sheetX = lerp(330, 600, lift);
  const blank = f >= b(23) + 20;
  const mach = fade(f, b(20), b(22) - 6, 10);
  return (
    <Frame p={p} z0={1.0} z1={1.06} night={0.4} sources={LAMP_SRC} bloom={0.05}>
      <SVG>
        <CounterRoom f={f} lamp={1} lampX={545} moose={ease(f, b(21), 40)} mooseQ={ease(f, b(21) + 14, 20)} coat={0} />
        {/* the real bell's sheet on the wall, and the bare nail behind the cardboard one */}
        <circle cx={770} cy={800} r={9} fill="#8C8A84" stroke={C.ink} strokeWidth={4} />
        {!blank && f < b(23) + 20 && <CallSheet x={sheetX} y={sheetY} scale={sheetS} f={f} rows={['lit', 'blank'] as RowState[]} nail={lift < 0.05} />}
        <circle cx={330} cy={706} r={9} fill="#8C8A84" stroke={C.ink} strokeWidth={4} opacity={lift > 0.05 ? 1 : 0} />
        <BrassBell x={330} y={1160} scale={1.05} f={f} emotion={blank ? 'asleep' : f >= b(22) ? 'deadpan' : 'alert'} lean={f >= b(22) && !blank ? 6 : 0} lamp={1} />
        <g transform={`translate(${cx},1170) scale(1,${sq}) translate(${-cx},-1170)`}>
          <CardboardBell x={cx} y={1170} scale={1.05} f={f} answer={0} rot={-7} />
        </g>
        {/* the hand that lifts the sheet off its nail (a faceless hand, flannel sleeve not needed here) */}
        {f >= b(23) - 20 && lift < 1 && <HandSil x={lerp(560, sheetX, handIn)} y={lerp(430, sheetY - 92 * sheetS, handIn)} rot={180} s={0.45} curl={0.7} reach={2000} />}
        {blank && <CallSheet x={600} y={800} scale={0.95} f={f} rows={['lit', 'blank'] as RowState[]} glow={0.8} />}
        {blank && <HandSil x={600} y={800 - 96} rot={180} s={0.45} curl={0.7} reach={2000} />}
        <Dust f={f} cx={545} cy={1010} />
        <Dim amount={0.5} cx={545} cy={1000} r={900} id="d6" />
        <Plate text="CARLOS MACHUCA" y={540} size={34} tone="enamel" p={mach} />
        <Plate text="AI RESOURCE PROGRAM DIRECTOR · ALASKA SBDC" y={604} size={19} tone="slip" p={mach} />
        <QuotePlate text={'"ACCIDENTAL ADOPTION" · CARLOS MACHUCA'} y={600} size={38} p={fade(f, b(22), b(23) - 4, 10)} rot={1.2} />
        <Plate text="FREE · NO PLAN" y={ 560} size={30} tone="alarm" p={ease(f, b(23) + 8, 12)} rot={-2} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S7  THE INVENTED ANSWER. A flat paper world. Both bells, with nothing behind them, answer with total confidence and
// two ribbons of ink curl up and scrawl across the page. Ink is black, with only a thin red edge.
const Ribbon: React.FC<{x0: number; y0: number; g: number; dir: 1 | -1; seed: number; f: number}> = ({x0, y0, g, dir, seed, f}) => {
  const sw = Math.sin(f / 18 + seed) * 18;
  const d = `M${x0},${y0} C${x0 + dir * (160 + sw)},${y0 - 200} ${x0 - dir * 220},${y0 - 420} ${x0 + dir * 80},${y0 - 620} S${x0 + dir * 300},${y0 - 880} ${x0 - dir * 40},${y0 - 1000}`;
  const mid = `rib${seed}`;
  return (
    <g>
      <defs>
        <mask id={mid} maskUnits="userSpaceOnUse" x={-400} y={-1400} width={2200} height={3600}>
          <path d={d} pathLength={1} fill="none" stroke="#FFFFFF" strokeWidth={130} strokeLinecap="round" strokeDasharray={`${g} 2`} />
        </mask>
      </defs>
      <path d={d} pathLength={1} fill="none" stroke={C.ink} strokeWidth={108} strokeLinecap="round" strokeDasharray={`${g} 2`} />
      <path d={d} pathLength={1} fill="none" stroke="#F6F3E6" strokeWidth={92} strokeLinecap="round" strokeDasharray={`${g} 2`} />
      <path d={d} pathLength={1} fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${g} 2`} transform="translate(46,0)" opacity={0.85} />
      <g mask={`url(#${mid})`}>
        <path d={d} pathLength={1} fill="none" stroke={C.ink} strokeWidth={60} strokeDasharray="0.0065 0.0135" opacity={0.78} />
        <path d={d} pathLength={1} fill="none" stroke="#F6F3E6" strokeWidth={18} strokeDasharray="0.02 0.028" opacity={0.9} />
      </g>
    </g>
  );
};
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  // The ribbons are already rising on frame 0: a fast ease-out draw (half the page by ~10 frames, full by ~54) while
  // the whole ribbon rises on an overshooting back-out and settles, so the cream page is never empty above the bells.
  const gt = clamp01(f / 54);
  const g = clamp01(0.05 + 0.95 * (1 - Math.pow(1 - gt, 3)));
  const rt = clamp01(f / 30) - 1;
  const rise = 240 * (1 - (1 + 2.7 * rt * rt * rt + 1.7 * rt * rt));
  const talk = Math.abs(Math.sin(f / 4)) * ease(f, 0, 4);
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0.0} bloom={0.03} vignette={0.2}>
      <SVG>
        <rect width={W} height={H} fill={C.paper} />
        {Array.from({length: 70}, (_, i) => {
          const h = hash(i * 17);
          return <path key={i} d={`M${h % 1080},${(h >>> 8) % 1920} q${20 + (h % 30)},${(h >>> 4) % 14} ${40 + (h % 40)},${(h >>> 12) % 12}`} stroke="#CFCBB9" strokeWidth={2} fill="none" opacity={0.7} />;
        })}
        <rect x={0} y={1286} width={W} height={H - 1286} data-band="ok" fill="#D7D3C2" />
        {/* 9:16 bottom third: the page is a ledger, ruled rows and a margin rule under the bells (set dressing only;
            the margin is NOT red, warning red is reserved for the cell nobody wrote) */}
        {Array.from({length: 11}, (_, i) => <line key={i} data-band="ok" x1={0} y1={1340 + i * 54} x2={W} y2={1340 + i * 54} stroke="#9FB7C9" strokeWidth={3} opacity={0.6} />)}
        <line data-band="ok" x1={120} y1={1286} x2={120} y2={H} stroke="#7F98AB" strokeWidth={4} opacity={0.5} />
        {/* the ribbons are clipped to start above the bell bases (plate top ~y1213): during the rise (rise=240 at f0)
            their tails sat at y1420 and poked out under the bells toward the caption */}
        <defs><clipPath id="ribclip7"><rect x={-200} y={-400} width={W + 400} height={1590} /></clipPath></defs>
        <g clipPath="url(#ribclip7)"><g transform={`translate(0,${rise})`}>
          <Ribbon x0={270} y0={1180} g={g} dir={1} seed={1} f={f} />
          <Ribbon x0={810} y0={1190} g={clamp01(g * 1.05 - 0.02)} dir={-1} seed={2} f={f} />
        </g></g>
        <BrassBell x={270} y={1240} scale={0.8} f={f} emotion="happy" talk={talk} lamp={0.8} />
        <CardboardBell x={810} y={1250} scale={0.82} f={f} answer={0} rot={-7} />
        <QuotePlate text={'"CONFIDENTLY MAKE UP AN ANSWER" · STEVE VICK'} y={560} size={34} p={ease(f, b(25), 12)} rot={-1} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S8  THE AUDITOR'S DESK. A back room, a banker's lamp, a plain clerk with a clipboard. He sets down the sheet, pins two
// tags from the earlier stories onto one clipboard, lifts the estimate plate to a single slip, and turns an empty column.
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const fr = useCurrentFrame();
  const sheetIn = land(f, b(26) - 4, 24);
  const tags = easeIO(f, b(27) - 4, 26);
  const lift = easeIO(f, b(28), 30);
  const open = easeIO(f, b(29), 26);
  const ptr = ease(f, b(29) - 8, 14);
  const clipX = 150 + 120 * 1.5, clipY = 1290 - 190 * 1.5;
  const q = fade(f, b(26), b(27) + 6, 10);
  const both = ease(f, b(27) + 22, 12) * (1 - ease(f, b(28) - 2, 8));
    return (
    <Frame p={p} z0={1.0} z1={1.05} night={0.5} sources={[{x: 330, y: 960, r: 420, color: '#E6F2D0', intensity: 0.6}]} bloom={0.05}>
      <SVG>
        <rect width={W} height={H} fill="#0D1620" />
        {[40, 760].map((fx, i) => (
          <g key={i}>
            <rect x={fx} y={420} width={250} height={760} fill="#1A2733" stroke="#0A0F15" strokeWidth={6} />
            {[0, 1, 2, 3].map((r) => <g key={r}><rect x={fx + 14} y={440 + r * 180} width={222} height={160} fill="#223241" stroke="#0A0F15" strokeWidth={4} /><rect x={fx + 90} y={500 + r * 180} width={70} height={16} rx={6} fill="#8C8A84" /></g>)}
          </g>
        ))}
        {/* the desk and the banker's lamp: a HARD cone, the room falls to dark around it */}
        <rect x={-20} y={1160} width={W + 40} height={54} fill="#5B3F2A" stroke={C.ink} strokeWidth={7} />
        <rect data-band="ok" x={-20} y={1214} width={W + 40} height={H - 1214} fill="#2A1D14" />
        {/* 9:16 bottom third: the desk's two drawer pedestals, lit from the lamp at x330 and falling off to the right,
            so the floor under the caption card is a piece of furniture and not a blank field (set dressing only) */}
        {[{x: 60, lit: 1}, {x: 700, lit: 0.45}].map((pd) => (
          <g key={pd.x}>
            <rect data-band="ok" x={pd.x} y={1218} width={320} height={50} rx={6} fill="#3A2919" stroke={C.ink} strokeWidth={6} />
            <rect data-band="ok" x={pd.x + 8} y={1224} width={304} height={8} fill="#6E4F33" opacity={0.55 * pd.lit} />
            <rect data-band="ok" x={pd.x + 120} y={1236} width={80} height={18} rx={8} fill={C.brass} stroke={C.ink} strokeWidth={4} opacity={0.55 + 0.4 * pd.lit} />
          </g>
        ))}
        {/* kick plate, then the floor plane in perspective: the Auditor's feet (y1290) land on boards, not drawer faces */}
        <rect data-band="ok" x={-20} y={1268} width={W + 40} height={22} fill="#1A120C" stroke={C.ink} strokeWidth={5} />
        <rect data-band="ok" x={-20} y={1290} width={W + 40} height={H - 1290} fill="#3B2C20" />
        {Array.from({length: 13}, (_, i) => (
          <line key={i} data-band="ok" x1={i * 90} y1={1290} x2={540 + (i * 90 - 540) * 1.9} y2={H} stroke="#251A12" strokeWidth={5} />
        ))}
        {[1380, 1520, 1720].map((ly) => <line key={ly} data-band="ok" x1={0} y1={ly} x2={W} y2={ly} stroke="#251A12" strokeWidth={4} opacity={0.7} />)}
        <ContactShadow cx={160} cy={1294} rx={120} ry={16} opacity={0.5} blur={8} />
        <g transform="translate(330,0)">
          <line x1={0} y1={0} x2={0} y2={760} stroke={C.ink} strokeWidth={6} />
          <path d="M-90,860 L-34,760 L34,760 L90,860 Z" fill="#1F6B4A" stroke={C.ink} strokeWidth={6} />
          <path d="M-86,862 L-520,1170 L520,1170 L86,862 Z" fill="#FFF1D2" opacity={0.12} />
        </g>
        <ellipse cx={330} cy={1176} rx={420} ry={36} fill="#FFF1D2" opacity={0.22} />
        <BrassBell x={720} y={1170} scale={0.55} f={f} emotion="deadpan" lamp={0.9} />
        {/* the carried call sheet set into frame by the Auditor's hand */}
        <CallSheet x={520} y={lerp(540, 860, clamp01(sheetIn))} scale={0.72} f={f} rows={['lit', 'blank'] as RowState[]} />
        {f >= b(26) - 14 && f < b(26) + 40 && <HandSil x={520} y={lerp(420, 760, clamp01(sheetIn))} rot={180} s={0.4} curl={0.6} reach={2200} />}
        {/* the Auditor and his clipboard */}
        <Character frame={f} x={150} y={1290} scale={1.5} facing={1} outfit="suit" glasses pose={f >= b(29) - 8 ? 'point' : 'carry'}
          gesture={f >= b(29) - 8 ? interpolate(fr, [b(29) - 8, b(29) + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1} emotion={f >= b(27) ? 'neutral' : 'worried'} />
        <g transform={`translate(${clipX},${clipY}) rotate(${-6 + Math.sin(f / 30) * 1.2 + (f >= b(27) ? 3 * Math.sin((f - b(27)) / 5) * Math.exp(-(f - b(27)) / 30) : 0)})`}>
          <rect x={-52} y={-70} width={104} height={140} rx={8} fill={C.plankHi} stroke={C.ink} strokeWidth={6} />
          <rect x={-40} y={-52} width={80} height={110} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <rect x={-22} y={-78} width={44} height={20} rx={5} fill="#B9B3A6" stroke={C.ink} strokeWidth={4} />
          {[-30, -12, 6, 24].map((ly) => <rect key={ly} x={-30} y={ly} width={60} height={5} fill={C.ink} opacity={0.35} />)}
        </g>
        {/* the two tags from the earlier stories fly in and click onto the clipboard */}
        {f >= b(27) - 4 && (
          <g>
            <g transform={`translate(${lerp(120, clipX - 30, tags)},${lerp(520, clipY - 30, tags)}) rotate(${(1 - tags) * -30})`}>
              <rect x={-80} y={-16} width={160} height={32} rx={5} fill={C.slip} stroke={C.ink} strokeWidth={4} /><text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.ink}>WEB 907 CLIENT</text>
            </g>
            <g transform={`translate(${lerp(1000, clipX + 20, tags)},${lerp(480, clipY + 20, tags)}) rotate(${(1 - tags) * 28})`}>
              <rect x={-66} y={-16} width={132} height={32} rx={5} fill="#1B2A38" stroke={C.ink} strokeWidth={4} /><text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={C.paper}>WEB 907 JOB</text>
            </g>
          </g>
        )}
        {tags > 0.95 && f < b(27) + 30 && <ImpactStar cx={clipX} cy={clipY} r={42} color="#FFFFFF" />}
        {/* the estimate plate, lifted off a single handwritten slip */}
        {f >= b(28) - 4 && (
          <g transform="translate(520,640)">
            <rect x={-150} y={-44} width={300} height={88} fill={C.slip} stroke={C.ink} strokeWidth={5} transform="rotate(-2)" />
            <text x={0} y={14} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontWeight={700} fontSize={46} fill={C.ink} transform="rotate(-2)">PANGBORN</text>
            <g transform={`translate(0,${-lift * 140}) rotate(${lift * 5})`}>
              <rect x={-190} y={-62} width={380} height={124} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
              <text x={0} y={-14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>ABOUT 5 TO 10%</text>
              <text x={0} y={18} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={19} fill={C.ink}>OWNER'S ESTIMATE</text>
              <text x={0} y={46} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={15} fill={C.ink}>PER ALASKA BUSINESS</text>
            </g>
          </g>
        )}
        {/* the WRONG ANSWERS column, opened and turned to camera, empty, with the red-rimmed row beside it */}
        {f >= b(29) && (
          <g transform={`translate(905,866) scale(${open * 0.85},0.85)`} opacity={clamp01(open * 3)}>
            <rect x={-150} y={-190} width={300} height={380} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
            <text x={0} y={-150} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>WRONG ANSWERS</text>
            <text x={0} y={-126} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>COUNTED</text>
            {[0, 1, 2, 3, 4].map((r) => <rect key={r} x={-120} y={-100 + r * 54} width={240} height={40} fill="none" stroke={C.ink} strokeWidth={3} opacity={0.5} />)}
            <rect x={-120} y={170 - 16} width={240} height={20} fill="none" stroke={C.red} strokeWidth={5} strokeDasharray="12 8" opacity={0.6 + 0.4 * Math.abs(Math.sin(f / 12))} />
          </g>
        )}
        <Dust f={f} cx={330} cy={1010} rx={300} ry={280} op={0.4} color="#FFF8E0" />
        <Dim amount={0.6} cx={330} cy={1000} r={900} id="d8" />
        <Plate text="TREND OR ONE FIRM'S SHOWCASE?" y={540} size={30} tone="enamel" p={q} />
        <Plate text="BOTH STORIES · WEB 907 WORK" y={600} size={32} tone="ink" p={both} />
        {/* upper right, x 731..1009 y 560..700: clear of the lifted estimate (x<=710), the sheet header (y>=710) and the Auditor's head */}
        <Plate text="NO COUNT OF WRONG ANSWERS REPORTED" displayLines={['NO COUNT OF', 'WRONG ANSWERS', 'REPORTED']} x={870} y={630} size={26} tone="ink" p={ease(f, b(29) + 6, 12)} /> {/* plate-overlap-ok: BOTH STORIES (232..848 x 569..631) is ease(f,b(27)+22,12)*(1-ease(f,b(28)-2,8)), zero from b(28)+6 = film frame 2382, and this plate is ease(f,b(29)+6,12), zero until b(29)+6 = film frame 2478, Plate returns null at k<=0.01, so they never share a frame */}
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S9  AWKWARD QUESTIONS. From overhead on the same back-room desk, a vendor's hand feeds awkward cards to the bell, which
// reads each one. No outcome is shown, and the WRONG ANSWERS column stays empty in frame.
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const icons: ('boot' | 'fish' | 'plane')[] = ['boot', 'fish', 'plane'];
  const t0 = [0, 58, 112];
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0.5} sources={[{x: 540, y: 1000, r: 520, color: '#FFF1D2', intensity: 0.5}]} bloom={0.05}>
      <SVG>
        <rect width={W} height={H} fill="#3A2A1E" />
        {Array.from({length: 26}, (_, i) => <line key={i} x1={0} y1={i * 78} x2={W} y2={i * 78} stroke="#241810" strokeWidth={5} />)}
        <CallSheet x={250} y={1010} scale={1.05} f={f} rows={['dim', 'dim', 'dim'] as RowState[]} rot={-3} glow={0} pulse={0} />
        {/* the empty WRONG ANSWERS column */}
        <g transform="translate(820,1010)">
          <rect x={-150} y={-190} width={300} height={380} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text x={0} y={-150} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>WRONG ANSWERS</text>
          <text x={0} y={-126} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>COUNTED</text>
          {[0, 1, 2, 3, 4].map((r) => <rect key={r} x={-120} y={-100 + r * 54} width={240} height={40} fill="none" stroke={C.ink} strokeWidth={3} opacity={0.5} />)}
        </g>
        {/* the bell seen from above: a brass disc with a plunger, and two eyes on its near rim reading the cards */}
        {/* raised to 1205 so the disc (1087..1323) clears the caption band and sits below the card path (bottom ~1062);
            the face is painted on the disc, eyes either side of the plunger and a mouth under it */}
        <g transform="translate(540,1205)">
          <ContactShadow cx={0} cy={10} rx={150} ry={26} opacity={0.4} blur={9} />
          <circle r={118} fill={C.brass} stroke={C.ink} strokeWidth={8} />
          <circle r={86} fill="none" stroke={C.brassDk} strokeWidth={6} />
          <circle r={34} fill={C.brassHi} stroke={C.ink} strokeWidth={6} />
          <circle cx={-56} cy={-40} r={17} fill={C.paper} stroke={C.ink} strokeWidth={5} /><circle cx={56} cy={-40} r={17} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <circle cx={-56 + Math.sin(f / 9) * 4} cy={-44} r={8} fill={C.ink} /><circle cx={56 + Math.sin(f / 9) * 4} cy={-44} r={8} fill={C.ink} />
          <path d="M-66,-68 L-44,-64 M44,-64 L66,-68" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
          <path d="M-30,56 Q0,70 30,56" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        </g>
        {icons.map((ic, i) => {
          const t = f - t0[i];
          if (t < 0) return null;
          const inn = easeIO(t, 0, 28);
          const out = easeIO(t, 40, 24);
          const x = lerp(1250, 620, inn) - out * 520;
          const y = 950 + out * 130;
          const scan = clamp01((t - 24) / 18);
          return (
            <g key={i}>
              <IconCard x={x} y={y} s={1.25} rot={-5 + inn * 4 + i * 2} icon={ic} />
              {scan > 0 && scan < 1 && t < 44 && <rect x={x - 80} y={y - 110 + scan * 220} width={160} height={5} fill="#FFFFFF" opacity={0.8} />}
            </g>
          );
        })}
        {/* the vendor's hand, a faceless sleeve, pushing each card */}
        {[0, 1, 2].map((i) => {
          const t = f - t0[i];
          if (t < 0 || t > 40) return null;
          const inn = easeIO(t, 0, 28);
          return <HandSil key={i} x={lerp(1330, 700, inn)} y={1040} rot={-90} s={0.55} curl={0.5} fill="#3E5C86" reach={1100} />;
        })}
        <Dust f={f} cx={540} cy={1000} rx={440} ry={330} op={0.3} color="#FFF8E0" />
        <Dim amount={0.45} cx={540} cy={1000} r={1000} id="d9" />
        <Plate text="TESTED WITH AWKWARD, HYPER-LOCAL QUESTIONS · PER THE ARTICLE" displayLines={['TESTED WITH AWKWARD, HYPER-LOCAL QUESTIONS', 'PER THE ARTICLE']} y={590} size={22} tone="enamel" p={ease(f, 4, 12)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S10  THE CROWD OF FREE BELLS. A hard cut to a wall of crates. Crate after crate stacks up, each holding cardboard FREE bells,
// the real bell small among them. Another owner's hand takes a free bell off the top and the moose's question card
// slides into it, and it answers with a confident ribbon of invented ink.
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  // (fix round) the grid used to rise from +100, which parked the bottom row of FREE crates (1135..1290 + rise) in the
  // caption band (1336..) for the first seconds; it now holds at its resting height and the crates drop in to it
  const rise = 0;
  // CH 155 puts the wall top at y515, leaving a clear band 420..510 inside the square for the plate above the wall
  const CW = 250, CH = 155;
  // another owner's hand comes down, takes the second free bell off the top-right crate and lifts it out of frame
  const reach = easeIO(f, b(34) - 40, 26);
  const card = easeIO(f, b(34) - 6, 24);
  const lift = easeIO(f, b(34) + 20, 30);
  const held = f >= b(34) - 14;
  const sx = 20 + 3 * CW + 64 + 118, sy = 1290 - 5 * CH + 64 + rise;
  const bx = sx, by = held ? lerp(sy, -200, lift) : sy;
  const hy = held ? by - 96 : lerp(-260, sy - 96, reach);
  return (
    <Frame p={p} z0={1.0} z1={1.04} night={0.45} sources={[{x: 540, y: 900, r: 700, color: '#FFE2A8', intensity: 0.5}]} bloom={0.05}>
      <SVG>
        <rect width={W} height={H} fill="#2A1F16" />
        <g transform={`translate(0,${rise})`}>
          {Array.from({length: 20}, (_, k) => {
            const r = Math.floor(k / 4), c = k % 4;
            const t = f - k * 3;
            if (t < 0) return null;
            const drop = (1 - clamp01(t / 14)) * -160;
            const bounce = t > 14 ? Math.sin((t - 14) / 2) * 6 * Math.exp(-(t - 14) / 7) : 0;
            const x = 20 + c * CW, y = 1290 - (r + 1) * CH + drop + bounce;
            if (r === 1 && c === 1) return null;
            const taken = r === 4 && c === 3;
            return (
              <g key={k} transform={`translate(${x},${y})`} opacity={clamp01(t / 6)}>
                <rect x={4} y={6} width={CW - 8} height={CH - 8} fill="#B58B5A" stroke={C.ink} strokeWidth={6} />
                {[0, 1, 2].map((s) => <line key={s} x1={4} y1={36 + s * 50} x2={CW - 4} y2={36 + s * 50} stroke={C.cardDk} strokeWidth={5} />)}
                <rect x={30} y={CH - 70} width={CW - 60} height={40} fill={C.paper} stroke={C.ink} strokeWidth={3} />
                <text x={CW / 2} y={CH - 42} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.red}>FREE</text>
                {(taken && f >= b(34) - 40 ? [0] : [0, 1]).map((i) => (
                  <g key={i} transform={`translate(${64 + i * 118},${64})`}><CardboardBell x={0} y={0} scale={0.28} f={f} rot={-6 + i * 12} /></g>
                ))}
              </g>
            );
          })}
          {/* the shelf holding the one real bell */}
          <g transform={`translate(${20 + CW * 1},${1290 - 2 * CH})`}>
            <rect x={0} y={0} width={CW} height={CH} fill="#1B130D" stroke={C.ink} strokeWidth={6} />
            <rect x={0} y={CH - 24} width={CW} height={24} fill={C.plankHi} stroke={C.ink} strokeWidth={5} />
            <BrassBell x={CW / 2} y={CH - 24} scale={0.4} f={f} emotion="deadpan" lamp={0.9} />
          </g>
        </g>
        {/* another owner's hand takes a free bell, and the moose's question card slides in */}
        {f >= b(34) - 40 && (
          <g>
            {by > -120 && <CardboardBell x={bx} y={by} scale={0.28} f={f} rot={6} />}
            {hy > -200 && <HandSil x={bx} y={hy} rot={180} s={0.3} curl={held ? 0.8 : 0.3} fill="#3E5C86" reach={2400} />}
            {f >= b(34) - 6 && (
              <g transform={`translate(${lerp(1300, bx - 170, card)},${sy + 40}) rotate(${(1 - card) * 14})`} opacity={1 - clamp01((f - b(34) - 30) / 10)}>
                <IconCard x={0} y={0} s={0.9} icon="moose" />
                <text x={34} y={-40} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={64} fill={C.red}>?</text>
              </g>
            )}
          </g>
        )}
        <Dust f={f} cx={540} cy={900} rx={480} ry={420} op={0.3} />
        <Dim amount={0.4} cx={540} cy={900} r={1000} id="d10" />
        <Plate text="COMMONLY SEES · NO PLAN · MACHUCA" y={494} size={26} tone="enamel" p={ease(f, b(33), 12)} rot={-1} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S11  ONE RULE. From overhead, the lit call sheet beside the bare nail board from the free bell, one bracket tying them
// as one rule, then the rows light mint one by one and the red cell stays unlit with its pulsing rim.
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const brace = easeIO(f, b(36) - 4, 40);
  // THE LAMP SWEEP. A lamp pool starts over the bare FREE board (nothing there to light), eases across to the sheet,
  // then reads it row by row, serpentine, and each written row wipes to mint as the light crosses it; the red cell is
  // never lit. Then the pool opens out over the whole sheet. Sheet geometry: centre (300,1010), scale 1.15, so row i
  // centres at y = 920 + 73.6 i and the rows span x 129..471.
  const t0 = b(37) - 6, RP = 30;
  const rowT = [0, 1, 2].map((i) => easeIO(f, t0 + i * RP, RP - 2));
  const rtl = [false, true, false];
  const k = Math.max(0, Math.min(2, Math.floor((f - t0) / RP)));
  const SX0 = 129, SX1 = 471;
  const scanX = rtl[k] ? lerp(SX1, SX0, rowT[k]) : lerp(SX0, SX1, rowT[k]);
  const scanY = 920 + 73.6 * (easeIO(f, t0 + RP - 6, 8) + easeIO(f, t0 + 2 * RP - 6, 8));
  const arrive = easeIO(f, 8, 96);
  const preX = lerp(790, SX0, arrive) + Math.sin(f / 23) * 16 * (1 - ease(f, t0 - 20, 20));
  const preY = lerp(990, 920, arrive) + Math.sin(f / 31) * 12 * (1 - ease(f, t0 - 20, 20));
  const open = easeIO(f, t0 + 3 * RP, 50);
  const scanning = f >= t0;
  const px = scanning ? lerp(scanX, 300 + Math.sin(f / 40) * 18, open) : preX;
  const py = scanning ? lerp(scanY, 1000 + Math.sin(f / 33) * 10, open) : preY;
  const pr = lerp(170, 300, open);
  const rows: RowState[] = ['lit', 'lit', 'lit', 'blank'];
  const BD = 'M120,760 q0,-44 44,-44 H476 q44,0 44,-44 q0,44 44,44 H916 q44,0 44,44';
  return (
    <Frame p={p} z0={1.04} z1={1.0} night={0.45} sources={[{x: px, y: py, r: 560, color: '#FFF1D2', intensity: 0.5}]} bloom={0.05}>
      <SVG>
        <rect width={W} height={H} fill="#3A2A1E" />
        {Array.from({length: 26}, (_, i) => <line key={i} x1={0} y1={i * 78} x2={W} y2={i * 78} stroke="#241810" strokeWidth={5} />)}
        <ellipse cx={540} cy={1000} rx={540} ry={420} fill="#FFF1D2" opacity={0.08} />
        <CallSheet x={300} y={1010} scale={1.15} f={f} rows={rows} rot={-2} glow={(rowT[0] + rowT[1] + rowT[2]) / 3} mintT={[...rowT, 1]} mintRtl={[...rtl, false]} />
        {/* the bare nail board from the free bell */}
        <g transform="translate(790,1010) rotate(2)">
          <ContactShadow cx={0} cy={220} rx={160} ry={14} opacity={0.35} blur={9} />
          <rect x={-150} y={-210} width={300} height={420} rx={10} fill={C.plankHi} stroke={C.ink} strokeWidth={8} />
          <rect x={-130} y={-190} width={260} height={380} fill="#9A6B45" opacity={0.6} />
          <circle cx={0} cy={-120} r={10} fill="#8C8A84" stroke={C.ink} strokeWidth={4} />
          <text x={0} y={120} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink} opacity={0.5}>FREE · NO PLAN</text>
        </g>
        <path d={BD} pathLength={1} fill="none" stroke={C.brassHi} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${brace} 2`} />
        {/* the lamp pool itself, a warm screen-blended disc riding the sweep */}
        <defs>
          <radialGradient id="lp11" cx={px} cy={py} r={pr} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFF1D2" stopOpacity={0.42} />
            <stop offset="0.6" stopColor="#FFF1D2" stopOpacity={0.16} />
            <stop offset="1" stopColor="#FFF1D2" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse data-band="ok" cx={px} cy={py} rx={pr} ry={pr} fill="url(#lp11)" style={{mixBlendMode: 'screen'}} />
        <Dust f={f} cx={540} cy={1000} rx={460} ry={360} op={0.3} />
        <Dim amount={0.4} cx={lerp(540, px, 0.6)} cy={lerp(1000, py, 0.6)} r={1000} id="d11" />
        <Plate text="TREND · UNPROVEN" y={540} size={32} tone="enamel" p={ease(f, b(35), 10) * (1 - ease(f, b(36) + 24, 10))} />
        <Plate text="ONE RULE" y={620} size={44} tone="ink" p={ease(f, b(36) + 28, 10) * (1 - ease(f, b(37) + 8, 10))} />
        <Plate text="WRITTEN DOWN = ANSWERED" y={700} size={30} tone="enamel" p={ease(f, b(37), 12)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S12  THE OWNER RETURNS. At counter height from the side. The owner hangs the flannel coat on the empty peg, the
// sleeve brings a pencil to the red cell, a customer walks out and the door closes, the pencil hesitates, and presses a
// person into the cell. It turns to plain paper with a pencilled figure, never mint.
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const hang = easeIO(f, 12, 40);
  const toCell = easeIO(f, 56, 40);
  const press = ease(f, b(40), 36);
  const step = easeIO(f, b(39) - 34, 14);
  const walk = easeIO(f, b(39) - 14, 50);
  const doorShut = easeIO(f, b(39) + 40, 22);
  const tipX = 489, tipY = 1032;
  const hx = f < 56 ? lerp(1170, 1040, hang) : lerp(1040, tipX + 110, toCell);
  const hy = f < 56 ? lerp(760, 740, hang) : lerp(740, tipY + 160, toCell);
  const hov = f > b(39) ? Math.sin(f / 3) * 3 * (1 - press) : 0;
  const q = ease(f, b(40), 14);
  // the lamp sweep carries on from S11: the pool drops down the sheet (row i centre y = 702 + 83.2 i, rows x 424..856),
  // wipes the fourth written row mint left to right as the coat is hung, then slides onto the red cell to meet the pencil
  const drop = easeIO(f, 0, 22), wipe4 = easeIO(f, 22, 40), toRed = easeIO(f, 66, 40);
  const lpx = lerp(lerp(lerp(640, 454, drop), 826, wipe4), 540 + Math.sin(f / 27) * 14 * (1 - press), toRed);
  const lpy = lerp(lerp(702, 952, drop), 1035, toRed);
  const lpr = lerp(150, 230, press);
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0.4} sources={LAMP_SRC} bloom={0.05}>
      <SVG>
        <rect width={W} height={H} fill="#2C2118" />
        {Array.from({length: 14}, (_, i) => <g key={i}><rect x={i * 80} y={0} width={78} height={1130} fill={i % 2 ? '#33261B' : '#2A1F16'} /><line x1={i * 80} y1={0} x2={i * 80} y2={1130} stroke="#150F0A" strokeWidth={4} /></g>)}
        {/* the door at the left, the cold night outside, a bell on a spring above it */}
        <rect x={30} y={600} width={290} height={530} fill="#0B141C" stroke={C.ink} strokeWidth={10} />
        <rect x={40} y={610} width={270} height={510} fill="#13283A" />
        <Snow f={f} n={18} y0={610} y1={1120} speed={0.7} op={0.6} d={0.8} />
        <g transform={`translate(${40},${610}) scale(${lerp(0.18, 1, doorShut)},1)`} opacity={1}>
          <rect width={270} height={510} fill="#5A3E2A" stroke={C.ink} strokeWidth={7} />
          <rect x={30} y={40} width={210} height={190} fill="#13283A" stroke={C.ink} strokeWidth={5} />
          <circle cx={238} cy={300} r={9} fill={C.brass} stroke={C.ink} strokeWidth={3} />
        </g>
        <g transform={`translate(175,574) rotate(${f > b(39) + 54 ? Math.sin((f - b(39) - 54) * 1.3) * 14 * Math.exp(-(f - b(39) - 54) / 16) : 0} 0 -14)`}>
          <path d="M0,-14 L0,10" stroke={C.ink} strokeWidth={4} /><path d="M-18,24 C-18,6 -8,0 0,0 C8,0 18,6 18,24 Z" fill={C.brass} stroke={C.ink} strokeWidth={4} />
        </g>
        {/* the coat peg on the right: the owner hangs the flannel coat */}
        <g transform={`translate(${(1 - hang) * 280},${(1 - hang) * -60})`} opacity={clamp01(1)}>
          <CoatPeg x={1000} y={640} coat={f > 20 ? 1 : 0.0} f={f} />
        </g>
        <CoatPeg x={1000} y={640} coat={0} f={f} />
        {/* the counter and the standing sheet */}
        <rect x={-20} y={1130} width={W + 40} height={84} fill={C.plankHi} stroke={C.ink} strokeWidth={7} />
        <rect data-band="ok" x={-20} y={1214} width={W + 40} height={H - 1214} fill={C.plankDk} />
        <ellipse cx={640} cy={1172} rx={380} ry={34} fill={C.lampKey} opacity={0.18} />
        <CallSheet x={640} y={845} scale={1.3} f={f} rows={['lit', 'lit', 'lit', 'lit', 'blank'] as RowState[]} fillRow={4} fillT={press} glow={1} pulse={1 - press} mintT={[1, 1, 1, wipe4, 1]} />
        <defs>
          <radialGradient id="lp12" cx={lpx} cy={lpy} r={lpr} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFF1D2" stopOpacity={0.38} />
            <stop offset="0.6" stopColor="#FFF1D2" stopOpacity={0.14} />
            <stop offset="1" stopColor="#FFF1D2" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse data-band="ok" cx={lpx} cy={lpy} rx={lpr} ry={lpr} fill="url(#lp12)" style={{mixBlendMode: 'screen'}} />
        {/* the customer, a large dark silhouette, walks to the door and out */}
        {/* staged in the open doorway (x 40..310, threshold y1120) at door scale, clear of the sheet (x>=377); it used to
            start at x640 in front of the sheet and read as standing on the clipboard face */}
        {/* 2026-10-06 fix round: shaded like the hand (key/fill/rim, cast shadow), breathing while it waits, a
            visible half step toward the door at ~b(39)-34, then the walk out into the snow, shrinking with distance,
            gone (faded) before doorShut starts at b(39)+40 so the exit is seen before the door closes */}
        {walk < 1 && (
          <g transform={`translate(${lerp(300, 290, step) - 150 * walk},1120) scale(${lerp(1, 0.55, walk)})`} opacity={1 - clamp01((walk - 0.7) / 0.3)}>
            <Walker x={0} y={0} s={4.2} f={f} coat="#4A5868" hat="#2A3440" phase={0} facing={-1} shade
              stride={clamp01(step * (1 - step) * 4 + Math.min(walk * 8, 1) * (1 - walk))} breath={1 - walk} lean={4 * walk + 2 * step} />
          </g>
        )}
        {/* the owner's sleeve and pencil */}
        <HandSil x={hx + hov} y={hy} rot={f < 56 ? 0 : -28} s={0.62} curl={f < 56 ? 0.3 : 0.55} fill={C.flannel} reach={1900} />
        {f >= 56 && <path d={`M${hx + hov - 24},${hy - 96} L${lerp(hx + hov - 24, tipX, 0.98)},${lerp(hy - 96, tipY, 0.98)}`} stroke="#E8C25A" strokeWidth={13} strokeLinecap="round" />}
        {f >= b(40) && f < b(40) + 8 && <ImpactStar cx={tipX} cy={tipY} r={30} color="#FFFFFF" />}
        <Dust f={f} cx={640} cy={1000} rx={360} ry={300} op={0.3} />
        <Dim amount={0.45} cx={640} cy={1000} r={900} id="d12" />
        <QuotePlate text={'"KEEP A HUMAN IN THAT LOOP" · CARLOS MACHUCA'} y={580} size={34} p={q} rot={-1} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S13  THE BUTTON. A hard cut to the counter: the owner's hand rests on the bell, the coat is back on its peg, two bins
// wait, a card goes in each, the Mosquito dings, the lamp clicks off and the sheet glows alone with its one pencilled figure.
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const off = f >= b(43) ? 0 : 1;
  const lampT = f >= b(43) + 6 ? 0 : f >= b(43) ? 0.35 : 1;
  const lamp = lampT;
  const back = ease(f, b(43), 44);
  const zz = lerp(1.0, 0.88, back);
  const c1 = ease(f, 70, 20), c2 = ease(f, 146, 20);
  const mx = f < 158 ? lerp(1260, 420, easeIO(f, 128, 30)) : lerp(420, 700, ease(f, 160, 40));
  const my = f < 158 ? lerp(540, 800, easeIO(f, 128, 30)) : lerp(800, 640, ease(f, 160, 40));
  // THE RESTING HAND PLAYS THE PLUNGER. It settles onto the bell after the cut (0..22) with a small answering squash,
  // winds up off the plunger (92..110), presses it home on the ding at b(42) (113..120) and lets it spring back
  // (124..138). Nothing moves the hand after that, so the lamp-off button hold from b(43) stays still and readable.
  // 2026-10-06 fix round: two PRESS-AND-RELEASE strokes timed to the evidence windows (hand_41 local 10..17, hand_42
  // local 122..129). Press 1: wound up at 10, plunger home by 15 (bell squash + ring flash at 14), release 19..31 with an
  // upward overshoot. Press 2: wind 110..117, home ON the ding at b(42)=120, held to 123, release with an overshoot that
  // peaks at 129 and is still by 135, so the hand is motionless long before the b(43) lamp-off button hold.
  const settleIn = ease(f, 0, 8);
  const wind1 = easeIO(f, 4, 6) * (1 - easeIO(f, 11, 4));
  const p1 = easeIO(f, 11, 4) * (1 - ease(f, 19, 8));
  const wind2 = easeIO(f, 110, 7) * (1 - easeIO(f, 117, 3));
  const p2 = easeIO(f, 117, 3) * (1 - ease(f, 123, 8));
  const over = (a: number) => (f >= a && f < a + 12 ? Math.sin((Math.PI * (f - a)) / 12) : 0);
  const plunge = Math.max(p1, p2);
  const handDy = -30 * (1 - settleIn) - 16 * (wind1 + wind2) + 28 * plunge - 12 * (over(19) + over(123));
  const flashAt = (a: number) => (f >= a && f < a + 10 ? 1 - (f - a) / 10 : 0);
  const flashes = [14, 120].map((a) => ({a, k: flashAt(a)})).filter((x) => x.k > 0);
  const ring = Math.max(f >= 158 ? Math.max(0, 1 - (f - 158) / 10) : 0, plunge);
  const asleep = f >= b(43) + 20;
  const sheetGlow = off ? 0.6 : 1;
  const rake = ease(f, b(43), 20);
  return (
    <Frame p={p} z0={1} z1={1} night={0.4} sources={lamp > 0.5 ? LAMP_SRC : [{x: 150, y: 1050, r: 420, color: '#E39A45', intensity: 0.7}]} bloom={0.05}>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={W + 400} height={H + 400} fill="#06090D" />
        <g transform={`translate(540,1000) scale(${zz}) translate(-540,-1000)`}>
          <CounterRoom f={f} lamp={lamp} coat={1} stove={1} />
          <CallSheet x={690} y={900} scale={0.62} f={f} rows={['lit', 'lit', 'lit', 'lit', 'human'] as RowState[]} nail glow={sheetGlow} pulse={0} />
          {/* the two bins */}
          {[{x: 120, w: 190, label: 'HUMAN CHECKS'}, {x: 770, w: 300, label: 'JUST A SPREADSHEET'}].map((bn, i) => (
            <g key={i} transform={`translate(${bn.x},1130)`}>
              <ContactShadow cx={0} cy={4} rx={bn.w / 2 + 10} ry={12} opacity={0.35} blur={7} />
              <rect x={-bn.w / 2} y={-110} width={bn.w} height={110} fill={C.plank} stroke={C.ink} strokeWidth={6} />
              <rect x={-bn.w / 2 + 10} y={-100} width={bn.w - 20} height={20} fill="#1B130D" />
              <rect x={-bn.w / 2 + 14} y={-62} width={bn.w - 28} height={40} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} />
              <text x={0} y={-35} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={bn.w < 200 ? 17 : 21} letterSpacing={1} fill={C.ink}>{bn.label}</text>
            </g>
          ))}
          <BrassBell x={420} y={1160} scale={0.95} f={f} emotion={asleep ? 'asleep' : 'calm'} ring={ring} lamp={lamp} />
          {/* the ring flash off the plunger on each press: a burst and two expanding brass rings */}
          {flashes.map(({a, k}) => (
            <g key={a} style={{mixBlendMode: 'screen'}}>
              {f - a < 4 && <ImpactStar cx={428} cy={936} r={54} color="#FFF1C8" />}
              {[0, 1].map((j) => (
                <ellipse key={j} cx={428} cy={1000} rx={150 + (f - a) * 22 + j * 46} ry={(150 + (f - a) * 22 + j * 46) * 0.62}
                  fill="none" stroke="#FFE9B0" strokeWidth={7 - j * 2} opacity={0.75 * k * (1 - j * 0.35)} />
              ))}
            </g>
          ))}
          {/* the owner's hand comes in from the LEFT at counter height and rests on the bell's crown (plunger top ~y926),
              palm and fingers above the dome, never across the painted face (eyes ~y990-1040). Sleeve runs off-frame left. */}
          <HandSil x={372} y={890 + handDy} rot={96} s={0.55} curl={0.35} fill={C.flannel} reach={1000} contact={{x: 428, y: 932 + 28 * plunge, rx: 44}} />
          {/* a card goes in each bin: a person card to HUMAN CHECKS, a row card to JUST A SPREADSHEET */}
          {c1 > 0 && c1 < 1 && (
            <g transform={`translate(${lerp(260, 130, c1)},${lerp(760, 1050, c1 * c1)}) rotate(${(1 - c1) * -20})`}>
              <rect x={-34} y={-44} width={68} height={88} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
              <circle cx={0} cy={-14} r={9} fill="none" stroke={C.ink} strokeWidth={4} /><path d="M0,-5 L0,18 M-12,4 L12,4 M0,18 L-9,32 M0,18 L9,32" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />
            </g>
          )}
          {c2 > 0 && c2 < 1 && (
            <g transform={`translate(${lerp(640, 770, c2)},${lerp(760, 1050, c2 * c2)}) rotate(${(1 - c2) * 20})`}>
              <rect x={-34} y={-44} width={68} height={88} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
              <rect x={-24} y={-20} width={48} height={14} rx={3} fill={C.mint} stroke={C.ink} strokeWidth={3} />
              <rect x={-24} y={4} width={48} height={14} rx={3} fill={C.mint} stroke={C.ink} strokeWidth={3} />
            </g>
          )}
          {(f >= 158 ? true : f >= 128) && !asleep && <Mosquito x={mx} y={my} scale={0.8} f={f} facing={-1} divebomb={f < 158 ? easeIO(f, 128, 30) : 0} />}
        </g>
        {/* after the lamp goes out the stove's ember rakes across the sheet and the paper cell, so the person survives */}
        <rect data-band="ok" x={0} y={760} width={W} height={400} fill="url(#rake)" opacity={0.0} />
        {off === 0 && (
          <g>
            <defs><linearGradient id="rk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E39A45" stopOpacity={0.4} /><stop offset="1" stopColor="#E39A45" stopOpacity={0.0} /></linearGradient></defs>
            <rect data-band="ok" x={0} y={740} width={W} height={420} fill="url(#rk)" opacity={rake} style={{mixBlendMode: 'screen'}} />
            <ellipse cx={690} cy={900} rx={190} ry={190} fill="#E8F1FA" opacity={0.08 * rake} />
          </g>
        )}
        <Dim amount={lerp(0.5, 0.94, 1 - lamp)} cx={lamp > 0.5 ? 420 : 690} cy={lamp > 0.5 ? 1000 : 900} r={lamp > 0.5 ? 900 : 520} id="d13" />
        <Plate text="HUMAN CHECKS · JUST A SPREADSHEET" y={560} size={28} tone="enamel" p={ease(f, 8, 12) * (1 - ease(f, b(43) - 8, 10))} />
      </SVG>
    </Frame>
  );
};

// ---- the shot router and the composition ------------------------------------------------------------------------
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13};

const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]; kicks: number[]}> = ({n, from, dur, beats, kicks}) => {
  const f = useCurrentFrame();
  const b = (id: number) => {
    const x = beats.find((y) => y.id === id);
    return x ? Math.round(x.at * 30) - from : 0;
  };
  const Comp = SHOTS[n];
  return <Comp p={{f, from, dur, b, kicks}} />;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1006Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1006Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:100 900;font-display:block;}`}</style>
);

export const Ep1006: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 6.78, 20.7, 32.04, 44.12, 52.34, 65.46, 71.38, 86.32, 92.12, 98.52, 109.64, 117.9, 124.74].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.teal}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={i + 1} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#0E1620" ink="#F2EDE0" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
void Character;
