import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, DayGrade, ContactShadow} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {Raven, Ptarmigan} from './lib/fauna';
import {ImpactStar} from './lib/FX';
import {HandSil} from './lib/stack';
import {FT, FortuneBall, AnswerDie, DieWorld, Pebble, PebbleRow, StakeFlag, KraftTag, ReportBooklet, Boulder, Bucket, RoundStamp, Mood} from './lib/fortune';

// ASK AGAIN, 2026-10-07. Palette roles are art_direction.json: obsidian ball (the darkest value in every daylight frame), pale
// overcast slate sky over river gravel, CRANBERRY means only the finance and insurance sector, CYAN means only what the ball
// says, WARM #F4D9A0 means only the labeled blank, OCHRE is report data, BONE is paper, heather wool is the viewer's hand.
// Every painted string is a claims.json on_screen string, a quote, or a plain label of the set.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const C = FT;
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
const hash = (i: number) => {
  let x = (Math.floor(i) + 1013) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
const rnd = (i: number) => (hash(i) % 10000) / 10000;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** a short decaying jolt, for an object that has just been hit */
const jolt = (f: number, a: number, amp = 1, d = 14) => (f >= a && f < a + d ? amp * Math.sin(((f - a) / d) * Math.PI * 3) * Math.exp(-(f - a) / (d * 0.45)) : 0);

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'bone' | 'kraft' | 'cyan' | 'warm';
const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: C.ink, fg: C.bone},
  bone: {fill: C.bone, fg: C.ink},
  kraft: {fill: C.kraft, fg: C.ink},
  cyan: {fill: C.cyan, fg: C.ink},
  warm: {fill: C.warm, fg: C.ink},
};

/** THE NAMEPLATE. A mono plate sized to its string by arithmetic, kept inside the plate band and clear of the square crop
 *  lines and the caption band. `lines` stack, the longest line sets the width. */
const Plate: React.FC<{text: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 30, tone = 'ink', p = 1, rot = 0, drop = 0}) => {
  const ls = displayLines ?? [text];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
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
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

/** A boxed quote, serif on bone with the attribution UNDER it as one plate. `text` is "quote · attribution", the quote is wrapped
 *  to `wrap` characters a line. Serif caps run 0.68 em. */
const QuotePlate: React.FC<{text: string; x?: number; y: number; size?: number; wrap?: number; p?: number; rot?: number}> =
({text, x = 540, y, size = 36, wrap = 32, p = 1, rot = 0}) => {
  const parts = text.split(' · ');
  const by = parts.length > 1 ? parts.slice(1).join(' · ') : undefined;
  const lines: string[] = [];
  const words = parts[0].split(' ');
  lines.length = 0;
  let cur = '';
  words.forEach((w) => { if ((cur + ' ' + w).trim().length > wrap) { lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const tw = Math.min(1020, Math.max(...lines.map((l) => l.length * size * 0.6), by ? monoW(by, 22) : 0) + 80);
  const th = lines.length * (size + 10) + (by ? 46 : 0) + 36;
  assertCropSafe(lines.join(' '), y - th / 2, y + th / 2);
  const sc = 0.6 + 0.4 * spring(k * 18, 0, 18);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, k * 2)}>
      <rect x={-tw / 2 + 10} y={-th / 2 + 12} width={tw} height={th} fill="#000" opacity={0.28} />
      <rect x={-tw / 2} y={-th / 2} width={tw} height={th} fill={C.bone} stroke={C.ink} strokeWidth={7} />
      <rect x={-tw / 2 + 11} y={-th / 2 + 11} width={tw - 22} height={th - 22} fill="none" stroke={C.ink} strokeWidth={2.2} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-th / 2 + 22 + size * 0.86 + i * (size + 10)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={C.ink}>{l}</text>
      ))}
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={1} fill={C.cyanDk}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: push, kick, grade ---------------------------------------------------------
type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]};
type SceneProps = {p: SP};
const Frame: React.FC<{p: SP; z0?: number; z1?: number; dy?: number; day?: number; bloom?: number; vignette?: number; children: React.ReactNode}> =
({p, z0 = 1, z1 = 1.05, dy = 0, day = 0.5, bloom = 0.04, vignette = 0.28, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const z = interpolate(p.f, [0, p.dur], [z0, z1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x}px, ${dy + jl.y}px) scale(${z * jl.scale})`}}>
        {children}
      </div>
      {day > 0 && <DayGrade f={p.f} sky="#D3DCE2" bounce="#B8A98C" amount={day} floor={0.35} haze={0.16} sunIntensity={0} />}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.02} />
    </AbsoluteFill>
  );
};

// ---- the world: pale overcast sky, far hills, a river, tundra, river gravel, a plank table -----------------------
const Sky: React.FC<{f: number; h?: number; rift?: number}> = ({f, h = 900, rift = 0}) => (
  <g>
    <defs>
      <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#AAB6BF" />
        <stop offset="0.6" stopColor={C.slate} />
        <stop offset="1" stopColor="#DCE1E1" />
      </linearGradient>
      <radialGradient id="riftg" cx="78%" cy="30%" r="60%">
        <stop offset="0" stopColor={C.rift} stopOpacity={0.85} />
        <stop offset="1" stopColor={C.rift} stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={W + 80} height={h + 40} fill="url(#skyg)" />
    {rift > 0.01 && <rect data-band="ok" x={-40} y={-40} width={W + 80} height={h + 40} fill="url(#riftg)" opacity={rift * 0.5} />}
    {[0, 1, 2, 3].map((i) => {
      const cx = ((f * (0.35 + i * 0.18) + i * 340) % (W + 700)) - 350;
      const cy = 90 + i * 120;
      return (
        <g key={i} opacity={0.5}>
          <ellipse cx={cx} cy={cy} rx={250 + i * 30} ry={34 + i * 6} fill="#E6EAEA" />
          <ellipse cx={cx + 120} cy={cy + 14} rx={180} ry={26} fill="#D4DADC" />
        </g>
      );
    })}
  </g>
);

const FarLand: React.FC<{f: number; y: number; drift?: number}> = ({f, y, drift = 1}) => {
  const hills = (c: string, base: number, amp: number, seed: number, par: number) => {
    const o = f * 0.05 * drift * par;
    const pts: string[] = [`${-40},${y + base + 90}`];
    for (let i = 0; i <= 12; i++) pts.push(`${-40 + i * 100 - (o % 100)},${y + base - rnd(seed + i + Math.floor(o / 100)) * amp}`);
    pts.push(`${W + 80},${y + base + 90}`);
    return <polygon points={pts.join(' ')} fill={c} stroke={C.ink} strokeWidth={0} />;
  };
  return (
    <g>
      {hills('#9AA3A6', -34, 70, 3, 0.4)}
      {hills('#A39B83', 6, 52, 9, 0.7)}
      {hills('#8F8767', 40, 36, 15, 1)}
      {/* the river: a slate mirror with glints */}
      <rect data-band="ok" x={-40} y={y + 62} width={W + 80} height={70} fill={C.river} />
      {Array.from({length: 12}, (_, i) => <rect key={i} data-band="ok" x={40 + i * 96 + 20 * Math.sin(f / 30 + i)} y={y + 76 + (i % 4) * 14} width={44 + (i % 3) * 20} height={4} fill={C.rim} opacity={0.55} />)}
      {/* tundra bands */}
      <rect data-band="ok" x={-40} y={y + 128} width={W + 80} height={140} fill={C.tundra} />
      <rect data-band="ok" x={-40} y={y + 128} width={W + 80} height={26} fill={C.tundraDk} opacity={0.4} />
      {Array.from({length: 46}, (_, i) => {
        const h = rnd(i * 5 + 2);
        return <path key={i} d={`M${h * W},${y + 150 + rnd(i + 90) * 100} l${-3 + 6 * Math.sin(f / 40 + i)},-14`} stroke="#B5453A" strokeWidth={4} opacity={0.5} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
};

/** River gravel: a bed of grey-ochre with angular stones. Deterministic stones, `sc` scales them (near plane larger). */
const Gravel: React.FC<{y0: number; y1?: number; seed?: number; n?: number; sc?: number; lit?: number}> = ({y0, y1 = H + 40, seed = 1, n = 70, sc = 1, lit = 0}) => (
  <g>
    <rect data-band="ok" x={-40} y={y0} width={W + 80} height={y1 - y0} fill={C.gravel} />
    <rect data-band="ok" x={-40} y={y0} width={W + 80} height={18} fill={C.gravelDk} opacity={0.5} />
    {Array.from({length: n}, (_, i) => {
      const h = rnd(seed * 97 + i);
      const x = rnd(seed * 31 + i + 7) * (W + 60) - 30;
      const y = y0 + 20 + rnd(seed * 13 + i + 3) * (y1 - y0 - 20);
      const r = (6 + h * 18) * sc * (0.6 + (y - y0) / (y1 - y0) * 0.9);
      const tone = [C.gravelHi, C.gravelDk, '#A59E8A', '#8A8470'][i % 4];
      return (
        <polygon key={i} data-band="ok" points={`${x - r},${y} ${x - r * 0.4},${y - r * 0.7} ${x + r * 0.6},${y - r * 0.6} ${x + r},${y + r * 0.1} ${x + r * 0.2},${y + r * 0.6} ${x - r * 0.7},${y + r * 0.4}`} fill={tone} stroke={C.ink} strokeWidth={1.6} opacity={0.82 + lit * 0.1} />
      );
    })}
  </g>
);

/** The plank table the ball sits on. `top` is the y of the table's top surface front edge. */
const Table: React.FC<{top: number; x?: number; w?: number; face?: number; ink?: boolean}> = ({top, x = 540, w = 980, face = 120, ink = false}) => (
  <g>
    <ContactShadow cx={x + 20} cy={top + face + 8} rx={w * 0.52} ry={26} opacity={0.4} blur={14} />
    {/* back (top surface) */}
    <polygon points={`${x - w / 2 + 70},${top - 54} ${x + w / 2 - 70},${top - 54} ${x + w / 2},${top} ${x - w / 2},${top}`} fill={ink ? '#6B5A3C' : '#B79B6B'} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    {[0.25, 0.5, 0.75].map((k, i) => <line key={i} x1={lerp(x - w / 2 + 70, x - w / 2, k)} y1={top - 54 + 54 * 0} x2={lerp(x - w / 2 + 70, x - w / 2, k) - 0} y2={top} stroke={C.kraftDk} strokeWidth={3} opacity={0.35} />)}
    {/* front face */}
    <rect data-band="ok" x={x - w / 2} y={top} width={w} height={face} fill={ink ? '#4C3F29' : C.kraftDk} stroke={C.ink} strokeWidth={6} />
    {[0.33, 0.66].map((k, i) => <line key={i} x1={x - w / 2} y1={top + face * k} x2={x + w / 2} y2={top + face * k} stroke={C.ink} strokeWidth={3} opacity={0.45} />)}
    <rect data-band="ok" x={x - w / 2} y={top} width={w} height={10} fill={C.rim} opacity={0.2} />
  </g>
);

/** The wool mitten: the shelf's HandSil in heather wool with a knit cuff. Wrist at (x,y), fingers point along `rot`. */
const Mitten: React.FC<{x: number; y: number; rot?: number; s?: number; curl?: number}> = ({x, y, rot = 0, s = 1, curl = 0.25}) => (
  <g>
    <HandSil x={x} y={y} rot={rot} s={s} curl={curl} fill={C.wool} />
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      {[-44, -22, 0, 22, 44].map((cx) => <line key={cx} x1={cx} y1={-6} x2={cx} y2={-100} stroke={C.woolDk} strokeWidth={4} opacity={0.35} strokeLinecap="round" strokeDasharray="10 8" />)}
      <rect x={-70} y={-6} width={140} height={26} rx={8} fill={C.bone} stroke={C.ink} strokeWidth={5} />
      {[-52, -26, 0, 26, 52].map((cx) => <line key={cx} x1={cx} y1={-4} x2={cx} y2={18} stroke={C.boneDk} strokeWidth={3} />)}
    </g>
  </g>
);

/** A far, small ball on a table: a dark silhouette with a cyan pinpoint and no readable face. */
const FarBall: React.FC<{x: number; y: number; s?: number; f: number; pulse?: number}> = ({x, y, s = 0.2, f, pulse = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ContactShadow cx={20} cy={248} rx={230} ry={30} opacity={0.5} blur={12} />
    <circle r={250} fill={C.ink} stroke={C.inkDeep} strokeWidth={10} />
    <path d="M-220,-110 A250,250 0 0 1 -40,-244" fill="none" stroke={C.rim} strokeWidth={14} opacity={0.45} />
    <circle cx={0} cy={-34} r={104} fill={C.cyan} opacity={0.7 + 0.3 * Math.sin(f / 7) * (0.4 + pulse)} />
  </g>
);

const Dust: React.FC<{f: number; x: number; y: number; a: number; n?: number; r?: number; color?: string}> = ({f, x, y, a, n = 9, r = 120, color = C.gravelHi}) => {
  const t = f - a;
  if (t < 0 || t > 30) return null;
  const k = t / 30;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const ang = (i / n) * Math.PI * 2 + rnd(i) * 0.6;
        const d = r * k * (0.5 + rnd(i + 9) * 0.7);
        return <circle key={i} cx={x + Math.cos(ang) * d} cy={y + Math.sin(ang) * d * 0.5 - k * 20} r={(10 + rnd(i + 3) * 16) * (1 - k * 0.5)} fill={color} opacity={0.7 * (1 - k)} />;
      })}
    </g>
  );
};

// ============================================================================================================
// S1  THE BALL SLAMS DOWN. A heather mitten has just slammed a dented, taped fortune ball onto a plank table on a gravel bar.
// The window already sloshes +8,577 JOBS. The ball squints, the mitten winds up and shakes it.
const FG1: [number, number, number][] = [[110, 1560, 44], [330, 1640, 36], [610, 1590, 40], [880, 1650, 50], [200, 1800, 58], [560, 1830, 52], [960, 1840, 60]];
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const sq = f < 16 ? Math.max(0, 1 - f / 16) * (0.5 + 0.5 * Math.cos(f * 0.9)) : 0;
  const mood: Mood = f < b(2) ? 'startled' : f < b(3) ? 'wary' : 'anxious';
  const slam = f < 48 ? ease(f, 16, 26) : 1;
  const comeIn = ease(f, b(3) - 20, 18);
  const sh = f >= b(3) ? Math.min(1, (f - b(3)) / 6) : 0;
  const shx = Math.sin((f - b(3)) * 0.4) * 2.5 * sh;
  const tilt = Math.sin((f - b(3)) * 0.4 + 0.6) * 2 * sh;
  return (
    <Frame p={p} z0={1.0} z1={1.07} day={0.45}>
      <SVG>
        <Sky f={f} h={900} />
        <FarLand f={f} y={800} />
        <Gravel y0={1060} seed={1} n={60} />
        <Table top={1262} />
        <Gravel y0={1382} y1={H + 40} seed={2} n={60} sc={1.5} />
        <g transform={`translate(${shx},0)`}>
          <FortuneBall x={540} y={950} s={1.25} f={f} mood={mood} look={[Math.sin(f / 19) * 0.5, 0.2]} answer="+8,577 JOBS" answerA={f < b(3) ? 1 : 0.6} squash={sq} tilt={tilt} sloshing={sq * 0.6 + sh * 0.8} sweat={0} />
        </g>
        {f < 48 && <g opacity={1 - slam * 0.9} transform={`translate(0,${-760 * slam})`}><Mitten x={560} y={300} rot={180} s={1.5} curl={0.15} /></g>}
        {f < 8 && <ImpactStar cx={540} cy={640} r={100} color={C.bone} />}
        <Dust f={f} x={540} y={1262} a={2} r={260} />
        {f >= b(3) - 20 && (
          <g transform={`translate(${shx},0)`}>
            <Mitten x={lerp(1500, 1010, comeIn)} y={1090} rot={-90} s={1.5} curl={0.5} />
          </g>
        )}
        {/* round 1: the lower third was empty gravel. The slam now reaches the near plane: the big foreground stones hop on the
            impact and chatter on every shake, and a loose stone jolted off the plank drops into the foreground and rolls left. */}
        {FG1.map(([x, y, r], i) => {
          const hop = f >= 2 && f < 30 ? Math.abs(Math.sin(((f - 2) / 14) * Math.PI)) * (34 - i * 2) * Math.exp(-(f - 2) / 10) : 0;
          const chat = sh > 0 ? Math.abs(Math.sin((f - b(3)) * 0.4 + i * 0.9)) * 7 * sh : 0;
          return <Pebble key={i} x={x} y={y - hop - chat} r={r} seed={300 + i * 3} color={C.gravel} rot={i * 37 + hop * 0.6} lit={0.25} />;
        })}
        {f >= 6 && (() => {
          const t = f - 6;
          const fall = clamp01(t / 16);
          const x = t < 16 ? lerp(930, 900, fall) : Math.max(250, 900 - (t - 16) * 5.4);
          const y = t < 16 ? lerp(1262, 1660, fall * fall) : 1660 - Math.abs(Math.sin((t - 16) / 7)) * 46 * Math.exp(-(t - 16) / 18);
          return <Pebble x={x} y={y} r={28} seed={77} color={C.gravelHi} rot={-(t * 9)} lit={0.3} />;
        })()}
        {/* the label holds at full strength for the WHOLE shot (round 1: it faded out at b(3)) */}
        <Plate text="ASK THE FORECAST ABOUT AI" y={556} size={36} p={ease(f, 3, 6)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S2  THE REPORT LANDS. Straight down on the gravel: the creased booklet slaps down, faceted ochre pebble rows tumble out of
// its pages and settle into a grid while the camera pulls back from one pebble to the whole grid, the counter climbs, a year
// ribbon draws, the health care row swells, and a round +2.6% stamp thumps down.
const ROWS2 = 7;
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slap = f < 22 ? spring(f, 0, 22) : 1;
  const bookY = lerp(-300, 990, easeIO(f, 0, 12));
  const bookS = lerp(1.5, 1.0, ease(f, 0, 14));
  return (
    <Frame p={p} z0={1.2} z1={1.02} day={0.5}>
      <SVG>
        <Gravel y0={-60} seed={4} n={200} sc={1.7} />
        <g transform={`translate(${jolt(f, 8, 6)},${jolt(f, 8, 5)})`}>
          <ReportBooklet x={330} y={bookY} s={bookS} rot={-4 + (1 - slap) * 8} f={f} lines={['ALASKA DEPT.', 'OF LABOR', 'ECONOMIC TRENDS', 'OCTOBER 2026']} lift={0.5} />
        </g>
        {Array.from({length: ROWS2}, (_, i) => {
          const n = 11 - (i % 3) + (i === 3 ? 1 : 0);
          const ry = 770 + i * 84;
          return (
            <g key={i}>
              {Array.from({length: n}, (_, j) => {
                const t0 = b(5) + i * 5 + j * 1.5;
                const pk = ease(f, t0, 20);
                if (pk <= 0) return null;
                const tx = 580 + j * 36 + (rnd(i * 31 + j) - 0.5) * 6, ty = ry + (rnd(i * 17 + j) - 0.5) * 8;
                const sx = 330 + (rnd(i * 5 + j) - 0.5) * 140, sy = 980;
                const x = lerp(sx, tx, pk);
                const y = lerp(sy, ty, pk) - Math.sin(pk * Math.PI) * 150;
                return <Pebble key={j} x={x} y={y} r={15 * (0.8 + 0.2 * pk)} seed={i * 40 + j} rot={(1 - pk) * 200 * (j % 2 ? 1 : -1)} shadow={pk > 0.9} />;
              })}
            </g>
          );
        })}
        {/* the year ribbon draws along the bottom edge of the grid */}
        {f >= b(6) && (
          <g>
            <line x1={580} y1={1292} x2={580 + 420 * ease(f, b(6), 24)} y2={1292} stroke={C.bone} strokeWidth={8} strokeLinecap="round" />
            {[0, 1, 2, 3, 4].map((k) => <line key={k} x1={580 + k * 105} y1={1280} x2={580 + k * 105} y2={1304} stroke={C.bone} strokeWidth={5} opacity={ease(f, b(6) + k * 4, 6)} />)}
          </g>
        )}
        <RoundStamp x={810} y={650} r={130} text="+2.6%" p={ease(f, b(7), 10)} rot={-8} size={58} />
        <Plate text="" displayLines={['ALASKA DEPT. OF LABOR · ECONOMIC TRENDS', 'OCTOBER 2026']} y={560} size={26} tone="bone" p={ease(f, b(4), 8) * (1 - ease(f, b(5) - 6, 8))} />
        {/* round 1 BLOCKER: this plate (one line, x258..822, y660..720) covered the +2.6% stamp (x680..940, y520..780). Two lines
            at x330 span x136..524 even at the shot's entry zoom of 1.17, clear of the stamp at its 1.5x landing scale (x615..1005). */}
        <Plate text="335,157 → 343,733 · +8,577" displayLines={['335,157 → 343,733', '+8,577']} x={330} y={690} size={30} p={ease(f, b(5) - 4, 8)} />
        <Plate text="2024 → 2034" x={790} y={1220} size={26} tone="bone" p={ease(f, b(6) + 8, 8)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S15  THE HEALTH CARE ROW AND THE GRINDER. Push in on the grid. The health care row swells and glows ochre, then the top-growth row climbs the page
// edge beside a spinning grinder wheel throwing sparks, the fastest growing job, and lands at the top with a burst.
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const hc = ease(f, b(8), 22);
  const climb = easeIO(f, b(45), 54);
  const lnd = f >= b(47) ? f - b(47) : -1;
  const rowY = (i: number) => 760 + i * 92;
  const machineY = lerp(rowY(6), 600, climb);
  return (
    <Frame p={p} z0={1.0} z1={1.1} day={0.5}>
      <SVG>
        <Gravel y0={-60} seed={14} n={200} sc={1.8} />
        {Array.from({length: 6}, (_, i) => {
          const n = 12 + (i === 3 ? Math.round(hc * 3) : 0);
          const shift = i >= 3 ? climb * -(i === 5 ? 0 : 0) : 0;
          return (
            <g key={i}>
              {Array.from({length: n}, (_, j) => (
                <Pebble key={j} x={140 + j * 62} y={rowY(i) + shift + 2 * Math.sin(f / 30 + j)} r={(22 + (i === 3 ? hc * 6 : 0))} seed={i * 40 + j} lit={i === 3 ? hc * 0.7 : 0} />
              ))}
            </g>
          );
        })}
        {/* the machine operators' row: climbs from the bottom to the top of the page */}
        {Array.from({length: 12}, (_, j) => <Pebble key={j} x={200 + j * 62} y={machineY} r={22} seed={700 + j} color={C.ochre} lit={0.45 * climb} />)}
        <g transform={`translate(110,${machineY}) rotate(${(f - b(45)) * 16})`} opacity={ease(f, b(45), 8)}>
          <circle r={50} fill={C.slateDk} stroke={C.ink} strokeWidth={7} />
          {[0, 1, 2, 3, 4, 5].map((k) => <line key={k} x1={0} y1={0} x2={50 * Math.cos((k * Math.PI) / 3)} y2={50 * Math.sin((k * Math.PI) / 3)} stroke={C.ink} strokeWidth={5} />)}
          <circle r={11} fill={C.bone} stroke={C.ink} strokeWidth={4} />
        </g>
        {f >= b(45) && Array.from({length: 7}, (_, k) => {
          const t = ((f - b(45)) * 2.6 + k * 11) % 46;
          const burst = lnd >= 0 && lnd < 24 ? lnd * 4 : 0;
          return <circle key={k} cx={168 + t * (1.4 + k * 0.12) + burst} cy={machineY - 18 - t * 0.7 + (k % 2) * 12 - burst * 0.5} r={4.5 - t / 14} fill={C.ochreHi} opacity={0.9 - t / 60} />;
        })}
        {lnd >= 0 && lnd < 8 && <ImpactStar cx={200} cy={machineY} r={70} color={C.ochreHi} />}
        <Plate text="HEALTH CARE + SOCIAL ASSISTANCE · +5,954 · +11.4%" y={545} size={22} tone="bone" p={ease(f, b(8), 10)} />
        <Plate text="" displayLines={['CRUSHING, GRINDING + POLISHING', 'MACHINE OPERATORS · +23.1%']} y={1230} size={24} tone="bone" p={ease(f, b(45) + 6, 10)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// the answer die faces used inside the window shots
const ICON_FACES = [['o o o o o', 'o o o', 'o o o o'], ['o o', 'o o o o o o', 'o o o'], ['o o o o', 'o o', 'o o o o o'], ['o o o', 'o o o o o', 'o o']];

/** The ball's two eyes as seen from inside the window, looking at the die, with drops sliding down the glass. */
const InEyes: React.FC<{f: number; look?: [number, number]; mood?: 'nervous' | 'mortified' | 'calm' | 'wary'; sweat?: number; y?: number}> = ({f, look = [0, 1], mood = 'nervous', sweat = 0, y = 455}) => {
  const blink = (f % 118) < 5 ? Math.sin(((f % 118) / 5) * Math.PI) : 0;
  const r = 60;
  const eye = (cx: number, sgn: number) => (
    <g>
      <ellipse cx={cx} cy={y} rx={r} ry={r * 1.12} fill={C.bone} stroke={C.ink} strokeWidth={7} />
      <circle cx={cx + look[0] * 16} cy={y + look[1] * 18} r={r * 0.46} fill={C.ink} />
      <circle cx={cx + look[0] * 16 - 8} cy={y + look[1] * 18 - 9} r={8} fill={C.bone} />
      {(mood === 'wary' || mood === 'mortified' || blink > 0.02) && <rect x={cx - r - 3} y={y - r * 1.2} width={r * 2 + 6} height={r * 2.4 * Math.max(blink, mood === 'wary' ? 0.4 : mood === 'mortified' ? 0.3 : 0)} fill={C.cyanDk} stroke={C.ink} strokeWidth={6} />}
      <path d={`M${cx - r},${y - r * 1.5 + (mood === 'nervous' || mood === 'mortified' ? -sgn * 20 : 0)} L${cx + r},${y - r * 1.5 + (mood === 'nervous' || mood === 'mortified' ? sgn * 20 : 0)}`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      {eye(400, -1)}{eye(680, 1)}
      {sweat > 0.02 && [0, 1, 2].map((i) => {
        const pp = clamp01(sweat * 1.4 - i * 0.25);
        if (pp <= 0) return null;
        const dx = 330 + i * 190 + (i === 1 ? 20 : 0);
        const dy = y + 70 + pp * 380;
        return <path key={i} d={`M${dx},${dy - 22} q16,24 0,40 q-16,-16 0,-40 Z`} fill={C.cyanHi} stroke={C.bone} strokeWidth={3} opacity={0.9} />;
      })}
    </g>
  );
};

// ============================================================================================================
// S3  INSIDE THE WINDOW. The round +2.6% stamp becomes the round window (an iris from the stamp's position), the faceted die floats
// in the cyan liquid, a cardboard tab rises, the die flips through faces, the ball's eyes sweat at the glass, the quote prints.
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const iris = ease(f, 0, 16);
  const rad = lerp(130, 1500, iris * iris);
  const flipAt = [b(10), b(11), b(11) + 16, b(11) + 32, b(12)];
  let faceIdx = 0, flip = 0;
  flipAt.forEach((a, i) => {
    if (f >= a) { faceIdx = i + 1; flip = ease(f, a, 12); }
  });
  const faces: string[][] = [['ABOUT THE', 'EFFECTS', 'OF A I'], ['AI JOBS', '?'], ICON_FACES[0], ICON_FACES[1], ICON_FACES[2], ['AI JOBS', '?']];
  const fi = Math.min(faces.length - 1, faceIdx);
  const showFlip = flip < 1 ? flip : 0;
  const tab = ease(f, b(9) + 4, 22);
  return (
    <Frame p={p} z0={1.02} z1={1.0} day={0.2}>
      <SVG>
        {f < 14 && <g><Gravel y0={-60} seed={4} n={140} sc={1.7} /><RoundStamp x={810} y={650} r={130} text="+2.6%" p={1} rot={-8} size={58} /></g>}
        <clipPath id="irisS3"><circle cx={810} cy={650} r={rad} /></clipPath>
        <g clipPath="url(#irisS3)">
          <DieWorld f={f} id="s3" variant="shallow" />
          <InEyes f={f} look={[Math.sin(f / 31) * 0.4, 1]} mood="nervous" sweat={f >= b(11) ? clamp01((f - b(11)) / 120) : 0} />
          <AnswerDie x={540} y={1040} s={1.0} f={f} lines={faces[fi]} flip={showFlip} textSize={faces[fi].length === 3 && fi === 0 ? 32 : faces[fi][0].length > 8 ? 34 : 44} />
          {tab > 0.01 && <Plate text="ABOUT THE EFFECTS OF AI" x={760} y={1240} size={26} tone="kraft" p={tab} drop={300} rot={-4} />}
        </g>
        <QuotePlate text={'"AI will touch much of Alaska\'s labor force over the next decade, but we can\'t accurately attribute any current broad shifts to AI." · P. 6'} y={650} size={34} wrap={34} p={ease(f, b(12), 10)} />
        <Plate text="AI JOBS ?" y={1260} x={300} size={30} p={ease(f, b(10) + 4, 8) * (1 - ease(f, b(12) - 4, 8))} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S4  SO WHAT NUMBER? Back out on the table, low angle. The mitten yanks the tab free of the window rim and shakes the ball hard,
// the window shows AI JOBS ???, the ball sweats and its eyes dart.
const S4: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const sh = Math.min(1, f / 8);
  const shx = Math.sin(f * 0.4) * 2.5 * sh;
  const tilt = Math.sin(f * 0.4 + 0.6) * 2 * sh;
  const tabP = ease(f, 0, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.06} day={0.45} dy={-20}>
      <SVG>
        <Sky f={f} h={700} />
        <FarLand f={f} y={560} />
        <Gravel y0={820} seed={5} n={60} />
        <Table top={1180} face={250} />
        <Gravel y0={1430} y1={H + 40} seed={6} n={50} sc={1.7} />
        <g transform={`translate(${shx},0)`}>
          <FortuneBall x={540} y={905} s={1.1} f={f} mood="anxious" look={[Math.sin(f / 6) * 0.8, 0.3]} answer="AI JOBS ???" sweat={clamp01(f / 50)} tilt={tilt} sloshing={sh} />
          <Mitten x={1020} y={1010} rot={-90} s={1.5} curl={0.5} />
        </g>
        <g transform={`translate(${lerp(560, 270, tabP)},${lerp(840, 1130, tabP * tabP)}) rotate(${lerp(0, -14, tabP)})`}>
          <rect x={-170} y={-28} width={340} height={56} rx={5} fill={C.kraft} stroke={C.ink} strokeWidth={5} />
          <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>ABOUT THE EFFECTS OF AI</text>
        </g>
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S5  THE SECTOR THE REPORT NAMES. A high oblique over a gravel bar laid out as the report's rows, faceted ochre pebbles by sector.
// One row sweeps cranberry, FINANCE + INSURANCE, a cranberry-cloth stake drops at its head and the sidebar's quote tag sticks beside it.
const ROW_Y = (i: number) => 840 + i * 64;
const ROW_R = (i: number) => 8.5 + i * 1.3;
const ROW_G = (i: number) => 21 + i * 3.4;
const BAR5 = '820,640 905,700 965,830 1000,1010 985,1200 930,1330 760,1392 -40,1400';
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const sweep = easeIO(f, b(14), 40);
  const flag = ease(f, b(15) - 6, 20);
  // round 1: S5 read as S2 again (pebble rows on a gravel field). Now the rows sit on a GRAVEL BAR, a tongue of stones with a
  // wet edge and a lapping foam line, and the river wraps round it on the right and fills the lower third, which is where S6's
  // cranberry pebbles are about to roll.
  return (
    <Frame p={p} z0={1.06} z1={1.0} day={0.5} dy={-10}>
      <SVG>
        <Sky f={f} h={560} />
        <FarLand f={f} y={400} />
        <rect data-band="ok" x={-40} y={640} width={W + 80} height={H} fill={C.river} />
        <rect data-band="ok" x={-40} y={1400} width={W + 80} height={H} fill={C.riverDk} opacity={0.3} />
        {Array.from({length: 26}, (_, i) => {
          const y = 690 + ((i * 97) % 1200);
          const x = ((i * 173 + f * (1.1 + (i % 3) * 0.5)) % 1260) - 90;
          return <rect key={i} data-band="ok" x={x} y={y} width={50 + (i % 4) * 22} height={4} fill={C.rim} opacity={0.5} />;
        })}
        {[[190, 1640, 0.5], [860, 1760, 0.42]].map(([x, y, sc], i) => (
          <g key={i}>
            {[0, 1].map((k) => {
              const t = (f * 0.6 + k * 40 + i * 25) % 80;
              return <ellipse key={k} data-band="ok" cx={x} cy={y + 30} rx={(sc as number) * 160 + t * 1.6} ry={((sc as number) * 160 + t * 1.6) * 0.28} fill="none" stroke={C.rim} strokeWidth={4} opacity={0.6 * (1 - t / 80)} />;
            })}
            <Boulder x={x} y={y} s={sc} seed={20 + i * 5} />
            <rect data-band="ok" x={x - (sc as number) * 170} y={y + 24} width={(sc as number) * 340} height={(sc as number) * 120} fill={C.river} />
          </g>
        ))}
        <clipPath id="s5bar"><polygon points={`-40,640 ${BAR5}`} /></clipPath>
        <polygon data-band="ok" points={`-40,640 ${BAR5}`} fill={C.gravel} />
        <g clipPath="url(#s5bar)"><Gravel y0={640} y1={1420} seed={7} n={90} sc={1.1} /></g>
        <polyline points={BAR5} fill="none" stroke={C.riverDk} strokeWidth={22} opacity={0.45} />
        <polyline points={BAR5} fill="none" stroke={C.ink} strokeWidth={5} />
        <polyline points={BAR5} fill="none" stroke={C.rim} strokeWidth={6} strokeDasharray="40 22" strokeDashoffset={-f * 1.4} opacity={0.75} transform={`translate(${6 + 3 * Math.sin(f / 14)},${8 + 3 * Math.sin(f / 14)})`} />
        {Array.from({length: 8}, (_, i) => {
          const n = Math.floor(760 / ROW_G(i));
          return (
            <g key={i}>
              {Array.from({length: n}, (_, j) => {
                const fin = i === 3;
                const hot = fin && j < sweep * n;
                return <Pebble key={j} x={150 + j * ROW_G(i)} y={ROW_Y(i) + 2 * Math.sin(f / 30 + j)} r={ROW_R(i)} seed={i * 50 + j} color={hot ? C.cranberry : C.ochre} lit={hot ? 0.3 : 0} />;
              })}
            </g>
          );
        })}
        <StakeFlag x={112} y={ROW_Y(3) + 14} s={0.95} f={f} cloth={C.cranberry} clothDk="#5E0F25" h={300} p={flag} unfurl={ease(f, b(15) + 8, 18)} phase={1} />
        <Plate text="FINANCE + INSURANCE" y={540} size={34} p={ease(f, b(14) + 6, 8)} tone="ink" />
        <QuotePlate text={'"...most vulnerable to automation in the near term, particularly finance and insurance." · P. 6'} y={690} size={30} wrap={34} p={ease(f, b(15), 10)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S6  FOUR HUNDRED EIGHTY NINE. Ground level at the river end of the gravel bar. The cranberry row's end pebbles roll off the
// bar edge down the slope into the river, 489 of them as a falling count, the bottom chunk first, and a stamp thumps on the pile.
const RIVER_Y = 700;
const Slope: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect data-band="ok" x={-40} y={RIVER_Y} width={W + 80} height={H} fill={C.river} />
    {Array.from({length: 18}, (_, i) => <rect key={i} data-band="ok" x={30 + i * 62 + 14 * Math.sin(f / 26 + i)} y={RIVER_Y + 24 + (i % 6) * 58} width={50 + (i % 3) * 26} height={4} fill={C.rim} opacity={0.5} />)}
    <rect data-band="ok" x={-40} y={RIVER_Y} width={W + 80} height={24} fill={C.riverDk} opacity={0.35} />
    <polygon data-band="ok" points={`-40,1090 640,1086 790,1150 960,1300 1120,1460 1120,${H + 40} -40,${H + 40}`} fill={C.gravel} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    {Array.from({length: 40}, (_, i) => {
      const x = rnd(i * 7 + 2) * 1000, y = 1110 + rnd(i * 11 + 4) * 760;
      const r = 8 + rnd(i) * 16;
      return <polygon key={i} data-band="ok" points={`${x - r},${y} ${x - r * 0.3},${y - r * 0.7} ${x + r * 0.6},${y - r * 0.5} ${x + r},${y + r * 0.2} ${x},${y + r * 0.6}`} fill={[C.gravelHi, C.gravelDk, '#A59E8A'][i % 3]} stroke={C.ink} strokeWidth={1.6} opacity={0.8} />;
    })}
    <polyline points="640,1086 790,1150 960,1300 1120,1460" fill="none" stroke={C.rim} strokeWidth={6} opacity={0.35} />
  </g>
);
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const roll = easeIO(f, b(16), 70);
  const nRow = 15;
  const stamp = ease(f, b(17) - 2, 10);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < nRow; i++) {
    for (let j = 0; j < 2; j++) {
      const k = i * 2 + j;
      const total = nRow * 2;
      const rank = (total - 1 - k) + j * -6; // the ends, bottom stack first
      const fall = k >= total - 14;
      const delay = fall ? clamp01(roll * 1.6 - ((total - 1 - k) / 14) * 0.55 + (j === 0 ? 0.12 : 0)) : 0;
      void rank;
      const bx = 100 + i * 38, by = 1068 - j * 24;
      let x = bx, y = by, rot = rnd(k) * 40;
      if (fall && delay > 0) {
        // along the bar top to the shoulder at x640, then down the slope to the water at x~1010
        const tx = lerp(bx, 1010, delay), baseY = delay < 0.4 ? by : lerp(by, 1560, easeIO(delay, 0.4, 0.6));
        x = tx; y = baseY + (delay > 0.88 ? (delay - 0.88) * 120 : 0) - Math.sin(delay * Math.PI * 6) * 6 * (1 - delay);
        rot += delay * 700;
      }
      items.push(<Pebble key={k} x={x} y={y} r={17} seed={k * 3 + 1} color={C.cranberry} rot={rot} shadow={!(fall && delay > 0.05)} />);
    }
  }
  const splashAt = b(16) + 52;
  return (
    <Frame p={p} z0={1.0} z1={1.05} day={0.5}>
      <SVG>
        <Sky f={f} h={RIVER_Y + 10} />
        <g opacity={1}><FarLand f={f} y={470} drift={0.6} /></g>
        <Slope f={f} />
        {items}
        <StakeFlag x={70} y={1100} s={1.1} f={f} cloth={C.cranberry} clothDk="#5E0F25" h={300} phase={1} />
        {[0, 1, 2, 3].map((i) => {
          const t = f - (splashAt + i * 7);
          if (t < 0 || t > 44) return null;
          return <ellipse key={i} cx={1010} cy={1580} rx={20 + t * 3.2} ry={(20 + t * 3.2) * 0.32} fill="none" stroke={C.rim} strokeWidth={5} opacity={0.8 * (1 - t / 44)} />;
        })}
        <Plate text="" displayLines={['6,027 → 5,538 · −489 · −8.1%', 'NOT CALLED AN AI NUMBER']} y={566} size={26} p={ease(f, b(16), 8) * (1 - ease(f, b(17) - 4, 8))} />
        <Plate text="75% OF IT · BANKING + RELATED SERVICES · P. 9" y={700} size={24} p={ease(f, b(17), 8)} />
        <g transform={`translate(420,820) rotate(-6) scale(${1.5 - 0.5 * stamp})`} opacity={stamp}>
          <rect x={-275} y={-44} width={550} height={88} rx={6} fill={C.bone} stroke={C.ink} strokeWidth={7} />
          <text x={0} y={13} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={32} letterSpacing={1} fill={C.ink}>NOT CALLED AN AI NUMBER</text>
        </g>
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S7  TOO UNCERTAIN, WHICH ROW. The last ripple ring irises into the window rim and we are back inside. The die rolls and lands on a
// face reading TOO UNCERTAIN TO PROJECT THIS YEAR, the ball's pupils stuck on it, then it tumbles to WHICH ROW IS THE AI ROW.
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const iris = ease(f, 0, 16);
  const rad = lerp(60, 1700, iris * iris);
  const rollP = easeIO(f, b(18) - 4, 30);
  const second = easeIO(f, b(20), 22);
  const faceA = ['TOO', 'UNCERTAIN', 'TO PROJECT', 'THIS YEAR'];
  const faceB = ['WHICH ROW', 'IS THE', 'AI ROW?'];
  const useB = second > 0.5;
  const dx = lerp(150, 540, rollP);
  const dy = 1040 - Math.sin(rollP * Math.PI) * 140 + (second > 0 && second < 1 ? -Math.sin(second * Math.PI) * 130 : 0);
  const rot = (1 - rollP) * -300 + (second > 0 ? second * 120 : 0);
  return (
    <Frame p={p} z0={1.03} z1={1.0} day={0.2}>
      <SVG>
        {f < 14 && (
          <g>
            <rect data-band="ok" x={-40} y={-40} width={W + 80} height={H + 80} fill={C.river} />
            {[0, 1, 2].map((i) => <ellipse key={i} cx={1000} cy={1540} rx={80 + i * 90 + f * 6} ry={(80 + i * 90 + f * 6) * 0.32} fill="none" stroke={C.rim} strokeWidth={5} opacity={0.7} />)}
          </g>
        )}
        <clipPath id="irisS7"><circle cx={1000} cy={1540} r={rad} /></clipPath>
        <g clipPath="url(#irisS7)">
          <DieWorld f={f} id="s7" variant="river" />
          <InEyes f={f} look={[clamp01(rollP) * 0.2 - 0.2, 1]} mood="nervous" sweat={0.5} y={410} />
          <AnswerDie x={dx} y={dy} s={1.0} f={f} rot={rot * (rollP >= 1 ? 1 : 1)} lines={useB ? faceB : faceA} textSize={useB ? 40 : 32} flip={second > 0 && second < 1 ? 0 : 0} />
        </g>
        <Plate text="TOO UNCERTAIN TO PROJECT THIS YEAR" y={530} size={28} p={ease(f, b(18) + 10, 8) * (1 - ease(f, b(19) - 4, 8))} />
        <QuotePlate text={'"...too uncertain to project this year." · P. 9'} y={770} size={34} wrap={40} p={ease(f, b(19), 10) * (1 - ease(f, b(20) - 4, 8))} />
        <Plate text="WHICH ROW IS THE AI ROW?" y={640} size={32} p={ease(f, b(20) + 8, 8)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// the oblique tundra bar with survey stakes (S8, S13)
const FieldBG: React.FC<{f: number; rift?: number; table?: boolean}> = ({f, rift = 0, table = true}) => (
  <g>
    <Sky f={f} h={560} rift={rift} />
    <FarLand f={f} y={400} />
    <Gravel y0={660} seed={8} n={120} sc={1.2} />
    {table && (
      <g>
        <Table top={826} x={540} w={330} face={36} />
        <FarBall x={540} y={757} s={0.2} f={f} />
      </g>
    )}
  </g>
);

// ============================================================================================================
// S8  THE SCARY ROWS. High and wide over the bar. Survey stakes drop into the gravel one by one. The ptarmigan arrives with a kraft
// reason tag in its beak and ties it to the pole, then the flag unfurls with the percentage already wearing its reasons.
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const st1 = ease(f, b(21) + 2, 14), st2 = ease(f, b(21) + 24, 14);
  const bird = f < b(23) ? lerp(980, 530, easeIO(f, b(21) + 6, b(22) - b(21) - 6)) : lerp(530, 840, easeIO(f, b(23) - 4, 30));
  const birdY = (f < b(23) ? 1290 : 1340) + Math.abs(Math.sin(f / 5)) * -8;
  const carrying1 = f < b(22) + 6;
  const carrying2 = f >= b(23) - 2 && f < b(23) + 30 && f >= b(23) - 4;
  const tags1 = ease(f, b(22) + 4, 14), tags2 = ease(f, b(23) + 26, 14);
  const un1 = ease(f, b(22) + 18, 16), un2 = ease(f, b(23) + 46, 16);
  const face = bird > 700 ? 1 : -1;
  return (
    <Frame p={p} z0={1.2} z1={1.0} dy={-6} day={0.5}>
      <SVG>
        <FieldBG f={f} />
        <StakeFlag x={150} y={1010} s={0.9} f={f} cloth={C.cranberry} clothDk="#5E0F25" h={300} phase={1} />
        <StakeFlag x={470} y={1240} s={1.05} f={f} cloth={C.ochre} h={330} p={st1} unfurl={un1} phase={2} label={['−27.9%']} labelSize={40} />
        <StakeFlag x={800} y={1290} s={1.15} f={f} cloth={C.ochre} h={330} p={st2} unfurl={un2} phase={3} label={['−27.7%']} labelSize={40} />
        {/* the reason tags tied to each pole BEFORE its percentage opens */}
        <KraftTag x={470 + 36} y={1240 - 215} w={150} text={['SERVICES', 'GOING REMOTE']} size={14} swing={Math.sin(f / 12) * 5} p={tags1} />
        <KraftTag x={470 + 12} y={1240 - 130} w={150} text={['FREELANCE', 'WORK']} size={15} swing={Math.sin(f / 10 + 1) * 5} p={ease(f, b(22) + 9, 12)} />
        <KraftTag x={470 + 40} y={1240 - 60} w={170} text={['SMALL NUMBERS,', 'BIG PERCENTS']} size={14} swing={Math.sin(f / 11 + 2) * 5} p={ease(f, b(22) + 14, 12)} />
        <KraftTag x={800 + 40} y={1290 - 240} w={150} text={['SERVICES', 'GOING REMOTE']} size={14} swing={Math.sin(f / 12) * 5} p={tags2} />
        <KraftTag x={800 + 12} y={1290 - 150} w={150} text={['FREELANCE', 'WORK']} size={15} swing={Math.sin(f / 10 + 1) * 5} p={ease(f, b(23) + 33, 12)} />
        <g>
          <Ptarmigan x={bird} y={birdY} scale={0.95} f={f} facing={face as 1 | -1} season="summer" />
          {(carrying1 || carrying2) && <g transform={`translate(${bird + face * -58},${birdY - 62}) rotate(${-8 * face})`}><rect x={-26} y={-14} width={52} height={32} rx={3} fill={C.kraft} stroke={C.ink} strokeWidth={3} /><circle cx={0} cy={-4} r={3} fill={C.inkDeep} /></g>}
        </g>
        <Plate text="NEWS ANALYSTS, REPORTERS + JOURNALISTS · −27.9%" y={546} size={22} tone="bone" p={ease(f, b(22), 8) * (1 - ease(f, b(23) - 4, 8))} />
        <Plate text="BROADCAST ANNOUNCERS + RADIO DJS · −27.7%" y={640} size={22} tone="bone" p={ease(f, b(23), 8)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S9  THROUGH THE FLAGS. Ground level. The huge percentages fill the foreground and loom as the camera dollies in, then the reason tags
// swing across and cover them. The ball is only a small dark silhouette on the table far behind, a cyan pinpoint for a window.
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cover = easeIO(f, b(26), 30);
  // round 1: at s2.6 the two flags overlapped and ran off both edges, so neither % sign showed. At s2.0 the cloths are x62..442 and
  // x612..992, the percentages x108..396 and x658..946, inside the frame even at the shot's end zoom of 1.14 (x47..1003).
  const flags = [{x: 40, label: '−27.9%', ph: 2, cx: 252}, {x: 590, label: '−27.7%', ph: 3, cx: 802}];
  return (
    <Frame p={p} z0={1.0} z1={1.14} day={0.5}>
      <SVG>
        <Sky f={f} h={1040} />
        <FarLand f={f} y={880} />
        <Gravel y0={1160} seed={9} n={110} sc={1.7} />
        <Table top={1036} x={540} w={220} face={24} />
        <FarBall x={540} y={1002} s={0.12} f={f} pulse={cover} />
        <StakeFlag x={820} y={1070} s={0.8} f={f} cloth={C.ochre} h={330} p={ease(f, b(46), 14)} unfurl={ease(f, b(46) + 6, 16)} phase={5} label={['−11.7%']} labelSize={38} />
        <Plate text="INFORMATION · 4,541 → 4,011 · −11.7%" y={640} size={26} tone="bone" p={ease(f, b(46) + 6, 8)} />
        {flags.map((fl, i) => (
          <g key={i}>
            <StakeFlag x={fl.x} y={1600} s={2.0} f={f} cloth={C.ochre} h={330} phase={fl.ph} label={[fl.label]} labelSize={40} />
            {[0, 1, 2].map((k) => {
              const t0 = lerp(0, 1, cover);
              const sx = fl.x + 110 + k * 10, sy = 1240 - k * 150;
              const ex = fl.cx, ey = 960 - 30 + k * 96 - (i === 1 ? 10 : 0);
              const text = [['SERVICES', 'GOING REMOTE'], ['FREELANCE', 'WORK'], ['SMALL NUMBERS,', 'BIG PERCENTS']][k];
              return <KraftTag key={k} x={lerp(sx, ex, t0)} y={lerp(sy, ey, t0)} w={lerp(200, 330, t0)} text={text} size={lerp(16, 26, t0)} swing={Math.sin(f / 10 + k + i) * 4 * (1 - t0)} rot={lerp(0, -3 + k * 3, t0)} />;
            })}
          </g>
        ))}
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// the ink test stage: the SAME table with the overcast killed to ink and one widened cool-white spot
const InkStage: React.FC<{f: number; spot?: number; cy?: number; rx?: number; ry?: number; id?: string}> = ({f, spot = 1, cy = 1010, rx = 560, ry = 470, id = 'spot'}) => (
  <g>
    <defs>
      <radialGradient id={id} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor={C.rim} stopOpacity={0.5} />
        <stop offset="0.55" stopColor={C.rim} stopOpacity={0.2} />
        <stop offset="1" stopColor={C.rim} stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={W + 80} height={H + 80} fill={C.inkDeep} />
    <ellipse cx={540 + 6 * Math.sin(f / 50)} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} opacity={spot} />
    {Array.from({length: 22}, (_, i) => {
      const h = rnd(i * 7 + 1);
      const x = 540 + (h - 0.5) * rx * 1.6 + 10 * Math.sin(f / (40 + i) + i);
      const y = cy - ry * 0.9 + (((f * (0.2 + h * 0.4) + i * 83) % (ry * 1.8)));
      return <circle key={i} cx={x} cy={y} r={1.6 + h * 2} fill={C.rim} opacity={0.35 * spot} />;
    })}
  </g>
);

const MadeUpStake: React.FC<{x: number; y: number; s?: number; rot?: number; f: number; text: string}> = ({x, y, s = 1, rot = 0, text}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <ContactShadow cx={4} cy={4} rx={40} ry={9} opacity={0.4} blur={6} />
    <polygon points="-8,0 8,0 8,-150 0,-176 -8,-150" fill={C.bone} stroke={C.ink} strokeWidth={4.5} strokeLinejoin="round" />
    <g transform="translate(0,-190) rotate(-4)">
      <rect x={-86} y={-42} width={172} height={84} fill={C.kraft} stroke={C.ink} strokeWidth={5} />
      <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>{text}</text>
      <line x1={-64} y1={14} x2={64} y2={-12} stroke={C.ink} strokeWidth={5} />
      <rect x={-78} y={-96} width={156} height={44} rx={4} fill={C.bone} stroke={C.ink} strokeWidth={4} transform="rotate(5)" />
      <text x={0} y={-65} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink} transform="rotate(5)">MADE UP</text>
    </g>
  </g>
);

/** The grease pencil the raven writes with. Tip at (0,0), body trails up and to the right. */
const GreasePencil: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = -35, s = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <polygon points="0,0 -9,-26 9,-26" fill="#E9D8B0" stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <polygon points="0,0 -3,-9 3,-9" fill={C.ink} />
    <rect x={-10} y={-210} width={20} height={186} fill={C.kraft} stroke={C.ink} strokeWidth={4} />
    {[-150, -112, -74].map((yy) => <line key={yy} x1={-10} y1={yy} x2={10} y2={yy + 8} stroke={C.kraftDk} strokeWidth={2.5} />)}
    <rect x={-10} y={-225} width={20} height={16} fill={C.bone} stroke={C.ink} strokeWidth={4} />
  </g>
);

// ============================================================================================================
// S10  THE FAIR OBJECTION. The overcast goes to ink on the same table as one cool spot drops. A raven inside the spot's rim drags a short row
// of pebbles out of the open report, then draws a dashed projection line straight out of that lit row across the planks past a METHOD stake,
// a boulder drops inside the spot where the line never pointed, the line runs over a roped-off empty patch marked by the EXCLUDES stake, and
// the ball's window face wipes blank.
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const spot = ease(f, 2, 12);
  const dragP = ease(f, b(27) + 10, 40);
  const lineP = easeIO(f, b(28), 130);
  const boulderT = f - b(29);
  const by = boulderT < 0 ? -300 : boulderT < 14 ? lerp(-300, 1058, (boulderT / 14) ** 2) : 1058 + jolt(f, b(29) + 14, 10, 10);
  const blank = ease(f, b(31), 12);
  const lineEnd = lerp(300, 1100, lineP);
  return (
    <Frame p={p} z0={1.0} z1={1.05} day={0} vignette={0.4}>
      <SVG>
        <InkStage f={f} spot={spot} />
        <Table top={1100} ink face={110} />
        <ReportBooklet x={170} y={1048} s={0.3} rot={-8} f={f} lines={[]} />
        {Array.from({length: 7}, (_, j) => {
          const pk = clamp01(dragP * 1.4 - j * 0.1);
          return <Pebble key={j} x={lerp(170, 300 + j * 34, pk)} y={lerp(1040, 1070, pk) - Math.sin(pk * Math.PI) * 30} r={13} seed={j * 11 + 2} color={C.ochre} lit={0.2} rot={pk * 140} />;
        })}
        <FortuneBall x={500} y={888} s={0.82} f={f} mood={blank > 0.5 ? 'mortified' : 'wary'} look={[-0.6, 0.4]} faceA={1 - blank} tilt={-3} sloshing={0} />
        {/* the roped-off empty patch, no pebbles in it */}
        <g opacity={ease(f, b(30) - 10, 12)}>
          {[780, 1000].map((px) => <g key={px}><polygon points={`${px - 6},1086 ${px + 6},1086 ${px + 5},1030 ${px - 5},1030`} fill={C.bone} stroke={C.ink} strokeWidth={3} /></g>)}
          <path d="M780,1036 Q890,1070 1000,1036" fill="none" stroke={C.kraft} strokeWidth={6} />
          <path d="M786,1086 L994,1086" fill="none" stroke={C.rim} strokeWidth={3} strokeDasharray="6 10" opacity={0.5} />
        </g>
        <StakeFlag x={236} y={1096} s={0.7} f={f} cloth={C.bone} clothDk={C.boneDk} h={300} p={ease(f, b(28) - 4, 12)} phase={4} label={['METHOD']} labelSize={22} />
        <StakeFlag x={1030} y={1096} s={0.7} f={f} cloth={C.bone} clothDk={C.boneDk} h={300} p={ease(f, b(30) - 6, 12)} phase={5} label={['EXCLUDES']} labelSize={20} lean={0} />
        {/* the dashed projection line, bone, straight out of the lit row */}
        {lineP > 0 && <line x1={300} y1={1066} x2={lineEnd} y2={1066} stroke={C.bone} strokeWidth={7} strokeDasharray="18 12" strokeLinecap="round" />}
        {lineP > 0 && <polygon points={`${lineEnd + 20},1066 ${lineEnd - 4},1054 ${lineEnd - 4},1078`} fill={C.bone} stroke={C.ink} strokeWidth={2} />}
        <Boulder x={690} y={by} s={0.62} />
        {boulderT >= 14 && boulderT < 26 && <Dust f={f} x={690} y={1090} a={b(29) + 14} r={150} color={C.rim} />}
        {/* the raven, inside the rim of the spot, feathers lifted by a stage-white rim */}
        <g>
          <ellipse cx={900} cy={846} rx={90} ry={70} fill={C.rim} opacity={0.1} />
          <rect x={886} y={880} width={28} height={220} fill="#6B5A3C" stroke={C.ink} strokeWidth={5} />
          <Raven x={900} y={880} scale={1.05} f={f} facing={-1} mode="perch" />
        </g>
        <Plate text="" displayLines={['METHOD · HISTORICAL TRENDS +', 'POPULATION + KNOWN PROJECTS · P. 11']} y={560} size={26} tone="bone" p={ease(f, b(28), 8) * (1 - ease(f, b(30) - 4, 8))} />
        <Plate text="EXCLUDES SELF-EMPLOYED + FISHERMEN" y={700} size={28} tone="bone" p={ease(f, b(30), 8)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S11  THE LIMIT, AND THE LABEL. Inside the window under the cool spot. The die floats up with a blank face and holds still, square to the
// glass. The raven's grease-pencil tip reaches in from frame right and writes the label on the OUTSIDE of the glass over the blank, conceding.
// The label lights warm, the only warm light in the ink, and the film's one cyan-to-warm change.
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rise = easeIO(f, 0, 22);
  const wp = ease(f, b(32) + 6, 76);
  const warm = ease(f, b(33), 16);
  // round 1: the label ran as two 36px lines ~540px wide across a facet ~210px wide. It is now written INSIDE the facet, upright, in
  // three short lines in the die's own coordinates (die s1.35, facet half width 166*(y+192)/288, baselines 14/46/78 at 22px, every
  // line's cap top inside the facet with margin), registered to the die's bob so it stays on the glass over the blank face.
  const DS = 1.35;
  const dieY = lerp(1080, 960, rise);
  const bob = 5 * Math.sin(f / 21);
  const LBL = ['AI · TOO EARLY', 'TO PREDICT THE', 'MAGNITUDE'];
  const BASE = [14, 46, 78];
  const lw = LBL.map((l) => monoW(l, 22, 0.5));
  const lk = LBL.map((_, i) => clamp01(wp * 3 - i));
  const li = Math.min(2, Math.floor(wp * 3));
  const tipX = 540 + (-lw[li] / 2 + lw[li] * lk[li]) * DS;
  const tipY = dieY + bob + (BASE[li] - 4) * DS;
  const pen = ease(f, b(32), 14) * (1 - ease(f, b(32) + 86, 14));
  return (
    <Frame p={p} z0={1.0} z1={1.04} day={0} vignette={0.45}>
      <SVG>
        <DieWorld f={f} id="s11" variant="deep" dim={0.18} warm={warm * 0.8} />
        <InEyes f={f} look={[0, 1]} mood={warm > 0.5 ? 'calm' : 'mortified'} />
        <AnswerDie x={540} y={dieY} s={DS} f={f} blank glowWarm={warm} />
        {/* the label on the OUTSIDE of the glass, registered over the blank face */}
        <g transform={`translate(540,${dieY + bob}) scale(${DS})`}>
          {LBL.map((l, i) => (
            <g key={i}>
              <clipPath id={`s11l${i}`}><rect x={-lw[i] / 2 - 4} y={BASE[i] - 22} width={lw[i] * lk[i] + 8} height={30} /></clipPath>
              <text clipPath={`url(#s11l${i})`} x={0} y={BASE[i]} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={0.5} fill={C.ink}>{l}</text>
            </g>
          ))}
        </g>
        <g opacity={pen} transform={`translate(${lerp(1300, tipX, ease(f, b(32), 14))},${lerp(780, tipY, ease(f, b(32), 14))})`}>
          <GreasePencil x={0} y={0} rot={-38} s={1.0} />
        </g>
        <Plate text="AI · TOO EARLY TO PREDICT THE MAGNITUDE · P. 6" y={560} size={24} tone={warm > 0.5 ? 'warm' : 'bone'} p={ease(f, b(33) + 4, 8)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S12  NOBODY COULD DEFEND. Wide on the spot, the same table. The conceding raven plants a bare survey stake in the gravel at the table's foot and
// the label slides off the glass onto it. Then it plants two kraft stakes with crossed-out scrawl stamped MADE UP, they topple into a bucket, and
// the ptarmigan walks in and drags the labeled stake out of the light.
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const plant = ease(f, b(34) - 6, 16);
  const slide = easeIO(f, b(34) + 6, 30);
  const unf = ease(f, b(34) + 30, 20);
  const m1 = ease(f, b(35) - 8, 12), m2 = ease(f, b(35) + 2, 12);
  const top1 = easeIO(f, b(35) + 12, 30), top2 = easeIO(f, b(35) + 24, 30);
  const drag = easeIO(f, b(36) + 6, 56);
  // REFRAMED (2026-10-07 round 1: at 107.9s the dragged stake had left frame left and the bucket sat on the right edge). The set is
  // drawn 1.15x about (540,1240) and laid out so every prop stays inside x 70..1010 at the shot's end zoom of 1.05: the stake is only
  // dragged from x330 to x210 (screen ~116..264), the bucket sits at x820 (screen ~770..954), the ball shrinks to keep its size.
  const birdX = lerp(-60, 250, ease(f, b(36) - 10, 24)) - drag * 100;
  const stakeX = lerp(330, 210, drag);
  const lean = lerp(0, 72, ease(f, b(36) + 4, 14));
  const flyX = lerp(540, 328, slide), flyY = lerp(880, 1130, slide) - Math.sin(slide * Math.PI) * 120;
  return (
    <Frame p={p} z0={1.0} z1={1.05} day={0} vignette={0.45}>
      <SVG>
        <defs>
          <radialGradient id="s12pool" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={C.rim} stopOpacity={0.32} />
            <stop offset="0.6" stopColor={C.rim} stopOpacity={0.09} />
            <stop offset="1" stopColor={C.rim} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="s12fall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.inkDeep} stopOpacity={0} />
            <stop offset="1" stopColor={C.inkDeep} stopOpacity={0.94} />
          </linearGradient>
        </defs>
        <InkStage f={f} spot={1} cy={1030} rx={600} ry={520} id="spot2" />
        <g transform="translate(540 1240) scale(1.15) translate(-540 -1240)">
          <Table top={1090} ink face={100} w={860} />
          <polygon data-band="ok" points={`-140,1196 1220,1196 1220,${H + 200} -140,${H + 200}`} fill="#2A281F" />
          {/* the spot's falloff on the floor: a lit pool under the cone that dies out toward the frame bottom */}
          <ellipse data-band="ok" cx={540 + 6 * Math.sin(f / 50)} cy={1262} rx={640} ry={160} fill="url(#s12pool)" />
          {Array.from({length: 40}, (_, i) => <polygon key={i} data-band="ok" points={`${rnd(i * 3 + 1) * 1080},${1210 + rnd(i * 5) * 120} ${rnd(i * 3 + 1) * 1080 + 16},${1204 + rnd(i * 5) * 120} ${rnd(i * 3 + 1) * 1080 + 22},${1218 + rnd(i * 5) * 120}`} fill={C.gravelDk} stroke={C.ink} strokeWidth={1.4} opacity={0.75 - Math.abs(rnd(i * 3 + 1) - 0.5) * 0.9} />)}
          <FortuneBall x={540} y={880} s={0.64} f={f} mood="calm" look={[-0.4, 0.5]} faceA={1} shadow={true} />
          {/* the bare stake the raven plants, taking the label */}
          <StakeFlag x={stakeX} y={1280} s={1.0} f={f} cloth={C.warm} clothDk="#C9A95F" h={300} p={plant} unfurl={unf} phase={6} label={['AI · TOO EARLY', 'TO PREDICT THE', 'MAGNITUDE']} labelSize={17} glow={unf} lean={lean} />
          {slide > 0 && slide < 1 && (
            <g transform={`translate(${flyX},${flyY})`}>
              <rect x={-150} y={-24} width={300} height={48} rx={5} fill={C.warm} stroke={C.ink} strokeWidth={4} />
              <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={C.ink}>AI · TOO EARLY TO PREDICT</text>
            </g>
          )}
          {/* the two made-up stakes topple into the bucket */}
          <g opacity={m1}><MadeUpStake x={lerp(620, 720, top1)} y={lerp(1270, 1296, top1)} s={0.9} rot={top1 * 94} f={f} text="-?,???" /></g>
          <g opacity={m2}><MadeUpStake x={lerp(690, 760, top2)} y={lerp(1280, 1300, top2)} s={0.9} rot={top2 * 94} f={f} text="???" /></g>
          <Bucket x={820} y={1300} s={0.8} rock={jolt(f, b(35) + 70, 4, 12)} label={['NOBODY COULD', 'DEFEND THIS']} labelSize={18} />
          <g>
            <ellipse cx={840} cy={806} rx={100} ry={76} fill={C.rim} opacity={0.1} />
            <rect x={826} y={850} width={28} height={240} fill="#6B5A3C" stroke={C.ink} strokeWidth={5} />
            <Raven x={840} y={850} scale={1.05} f={f} facing={-1} mode="perch" />
            <GreasePencil x={796} y={832 + (f >= b(36) ? 26 : 0)} rot={f >= b(36) ? 70 : -30} s={0.5} />
          </g>
          {f >= b(36) - 10 && <Ptarmigan x={birdX} y={1290} scale={0.95} f={f} facing={1} season="summer" />}
        </g>
        <rect data-band="ok" x={-40} y={1330} width={W + 80} height={H - 1290} fill="url(#s12fall)" />
        {/* MADE UP sits at y610 (band 584..636), clear of the warm plate's band 520..572 and of the ball's top at y642 */}
        <Plate text="MADE UP · −?,??? · NOBODY COULD DEFEND THIS" y={610} size={22} tone="bone" p={ease(f, b(35), 8) * (1 - ease(f, b(36) + 20, 8))} />
        <Plate text="AI · TOO EARLY TO PREDICT THE MAGNITUDE · P. 6" y={546} size={22} tone="warm" p={ease(f, b(34), 8) * (1 - ease(f, b(35) - 4, 8))} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S13  THE AI ROW. Pull back and up over the whole bar as a rift opens in the cloud. The two scary flags go grey under their reasons. The
// ptarmigan tugs the labeled AI stake upright in the gravel beside the cranberry finance flag, no number on it, then walks to its foot and
// settles facing it. The cranberry flag lifts its tag, MOST VULNERABLE TO AUTOMATION.
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rift = ease(f, 0, 90);
  const grey = ease(f, b(37) + 10, 30);
  const arrive = easeIO(f, b(37) + 14, b(38) - b(37) - 14);
  const plantP = ease(f, b(38), 18);
  // THE PAYOFF, REBUILT (2026-10-07 round 1). The scary flags go GREY (a saturate filter to 0.1 and a 22% darken, tags and all),
  // a rake of cool light falls from the rift at upper right with long ground shadows to lower left, the land desaturates by half,
  // and the labeled AI stake is the ONLY warm thing left. Everything is larger and laid inside x 60..1050 at the start zoom 1.04:
  // AI stake s1.35 (top y832) beside a visibly SHORTER cranberry finance flag (top y932), ball s0.3, ptarmigan s1.3, and the whole
  // set is then drawn 1.15x about (540,1250) inside x 149..1024, with near gravel desaturated under the captions.
  const AX = 420, AY = 1250;
  const aiX = lerp(700, AX, arrive);
  const aiLean = f < b(38) ? 50 : lerp(50, 0, spring(f, b(38), 18));
  const birdX = f < b(38) ? aiX + 100 : lerp(aiX + 100, AX + 120, easeIO(f, b(39) - 10, 30));
  const tagLift = ease(f, b(40), 14);
  const sat = 1 - 0.9 * grey, dk = 1 - 0.22 * grey;
  const shadow = (x: number, y: number, len: number, w = 10) => (
    <polygon points={`${x - w},${y} ${x + w},${y} ${x + w - len * 0.92},${y + len * 0.2} ${x - w - len * 0.92},${y + len * 0.2}`} fill={C.inkDeep} opacity={0.22 * rift} />
  );
  return (
    <Frame p={p} z0={1.04} z1={1.0} dy={-6} day={0.4}>
      <SVG>
        <defs>
          <filter id="s13grey" x="-10%" y="-10%" width="120%" height="120%">
            <feColorMatrix type="saturate" values={`${sat}`} />
            <feComponentTransfer><feFuncR type="linear" slope={dk} /><feFuncG type="linear" slope={dk} /><feFuncB type="linear" slope={dk} /></feComponentTransfer>
          </filter>
          <filter id="s13land"><feColorMatrix type="saturate" values={`${1 - 0.5 * rift}`} /></filter>
          <linearGradient id="s13rake" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.rim} stopOpacity={0.42} />
            <stop offset="0.42" stopColor={C.rim} stopOpacity={0.1} />
            <stop offset="0.6" stopColor={C.inkDeep} stopOpacity={0} />
            <stop offset="1" stopColor={C.inkDeep} stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <g filter="url(#s13land)">
          <FieldBG f={f} rift={rift} table={false} />
          <FgDetail f={f} lit={rift} />
        </g>
        <rect data-band="ok" x={-40} y={-40} width={W + 80} height={H + 80} fill="url(#s13rake)" opacity={rift} />
        <g transform="translate(540 1250) scale(1.15) translate(-540 -1250)">
        <g filter="url(#s13land)"><Table top={850} x={540} w={420} face={44} /></g>
        <FarBall x={540} y={745} s={0.3} f={f} />
        {/* long rake shadows, falling away from the rift */}
        {shadow(200, 1170, 260)}
        {shadow(715, 1110, 280)}
        {shadow(790, 1230, 280)}
        {f >= b(38) && shadow(AX, AY, 420, 14)}
        <StakeFlag x={200} y={1170} s={0.95} f={f} cloth={C.cranberry} clothDk="#5E0F25" h={250} phase={1} />
        <KraftTag x={200 + 70} y={1064} w={190} text={['MOST VULNERABLE', 'TO AUTOMATION']} size={16} swing={Math.sin(f / 10) * 5 * tagLift} p={tagLift} />
        <g filter="url(#s13grey)">
          <StakeFlag x={715} y={1110} s={0.85} f={f} cloth={C.ochre} clothDk={C.ochreDk} h={330} phase={2} label={['−27.9%']} labelSize={38} />
          <StakeFlag x={790} y={1230} s={0.85} f={f} cloth={C.ochre} clothDk={C.ochreDk} h={330} phase={3} label={['−27.7%']} labelSize={38} />
          <KraftTag x={715} y={1010} w={130} text={['SERVICES', 'GOING REMOTE']} size={13} swing={Math.sin(f / 12) * 5} />
          <KraftTag x={790 + 70} y={1070} w={130} text={['SERVICES', 'GOING REMOTE']} size={13} swing={Math.sin(f / 12 + 1) * 5} />
        </g>
        <StakeFlag x={aiX} y={AY} s={1.35} f={f} cloth={C.warm} clothDk="#C9A95F" h={310} p={1} unfurl={1} phase={6} label={['AI · TOO EARLY', 'TO PREDICT THE', 'MAGNITUDE']} labelSize={17} glow={1} lean={aiLean} />
        {plantP > 0 && plantP < 1 && <Dust f={f} x={AX} y={AY} a={b(38)} r={130} />}
        <Ptarmigan x={birdX} y={1262 + Math.abs(Math.sin(f / 6)) * (f < b(38) ? -6 : 0)} scale={1.3} f={f} facing={-1} season="summer" />
        </g>
        <Plate text="MOST VULNERABLE TO AUTOMATION · P. 6" y={546} size={24} tone="bone" p={ease(f, b(40), 8)} />
      </SVG>
    </Frame>
  );
};

// ============================================================================================================
// S14  ASK AGAIN. The mitten sets the ball down gently on the table in a break of light. The window settles on ASK AGAIN NEXT FORECAST, the
// report's fine print rises in bone, and far behind the ball the ptarmigan keeps its watch at the foot of the labeled stake beside the
// cranberry flag. The ball blinks once.
/** Near-plane gravel for the lower third: a meltwater rivulet whose glints run downhill, big lit stones whose top facets brighten
 *  with `lit`, and sedge tufts that sway. `drift` slides the whole near plane for parallax against the far land. */
const FgDetail: React.FC<{f: number; lit: number; drift?: number}> = ({f, lit, drift = 0}) => {
  const d = 'M-80,1600 C180,1630 300,1730 520,1716 S860,1800 1160,1772';
  return (
    <g transform={`translate(${drift},0)`}>
      <path data-band="ok" d={d} fill="none" stroke={C.riverDk} strokeWidth={34} strokeLinecap="round" opacity={0.8} />
      <path data-band="ok" d={d} fill="none" stroke={C.river} strokeWidth={20} strokeLinecap="round" />
      <path data-band="ok" d={d} fill="none" stroke={C.rim} strokeWidth={5} strokeLinecap="round" strokeDasharray="28 64" strokeDashoffset={-f * 3.2} opacity={0.45 + 0.45 * lit} />
      {[[90, 1530, 46], [330, 1580, 38], [700, 1610, 52], [960, 1560, 40], [180, 1820, 64], [560, 1850, 58], [880, 1860, 66], [420, 1500, 30]].map(([x, y, r], i) => (
        <Pebble key={i} x={x} y={y} r={r} seed={500 + i * 7} color={C.gravel} rot={i * 41} lit={0.15 + 0.55 * lit} />
      ))}
      {[[40, 1690], [250, 1520], [610, 1560], [790, 1700], [1040, 1640], [470, 1790]].map(([x, y], i) => (
        <g key={i}>
          {[-2, -1, 0, 1, 2].map((k) => {
            const sw = 9 * Math.sin(f / (17 + i * 2) + i + k * 0.4);
            return <path key={k} d={`M${x + k * 6},${y} q${k * 6 + sw * 0.4},-40 ${k * 14 + sw},-${74 - Math.abs(k) * 10}`} stroke={k % 2 ? '#7E7048' : '#9A8656'} strokeWidth={4} fill="none" strokeLinecap="round" />;
          })}
        </g>
      ))}
    </g>
  );
};

/** Rift shafts: cool-bone light falling from the cloud break at upper right, widening with `widen`. */
const RiftShafts: React.FC<{f: number; widen: number}> = ({f, widen}) => (
  <g>
    {[0, 1, 2, 3].map((i) => {
      const x0 = 820 + i * 46, x1 = 760 - i * 190;
      const w0 = 30 + i * 8, w1 = (90 + i * 40) * (0.45 + 1.3 * widen);
      const br = 0.5 + 0.5 * Math.sin(f / (29 + i * 7) + i * 2);
      return <polygon key={i} points={`${x0 - w0 / 2},120 ${x0 + w0 / 2},120 ${x1 + w1 / 2},1240 ${x1 - w1 / 2},1240`} fill={C.rift} opacity={(0.07 + 0.06 * br) * (0.4 + 0.6 * widen)} />;
    })}
  </g>
);

const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const down = easeIO(f, 0, 30);
  const ballY = lerp(860, 955, down) + (f >= 30 && f < 44 ? Math.sin(((f - 30) / 14) * Math.PI) * -4 : 0);
  const mit = ease(f, 26, 26);
  // round 1: about ten seconds read static here. The rift now WIDENS across the whole shot (sky break, four shafts and a light pool
  // on the gravel), the near plane drifts for parallax over a running rivulet and swaying sedge, and the ptarmigan walks, hops and
  // TURNS to face the ball (b(43) lands in the credits, so the turn is timed off b(42)).
  const widen = easeIO(f, 0, p.dur);
  const turnP = easeIO(f, b(42) + 24, 16);
  const tx = Math.cos(turnP * Math.PI);
  const pX = lerp(990, 960, easeIO(f, 20, 90)) - 16 * turnP;
  const pY = 1100 - Math.sin(turnP * Math.PI) * 18;
  const pulse = 0.5 + 0.5 * Math.sin(f / 9);
  return (
    <Frame p={p} z0={1.02} z1={1.0} day={0.35}>
      <SVG>
        <Sky f={f} h={900} rift={lerp(0.3, 1, widen)} />
        <FarLand f={f} y={800} />
        <Gravel y0={1000} seed={11} n={70} lit={1} />
        <ellipse cx={lerp(820, 700, widen)} cy={1110} rx={lerp(160, 520, widen)} ry={lerp(30, 90, widen)} fill={C.rift} opacity={0.35} />
        <RiftShafts f={f} widen={widen} />
        <StakeFlag x={846} y={1086} s={0.5} f={f} cloth={C.cranberry} clothDk="#5E0F25" h={250} phase={1} />
        <StakeFlag x={930} y={1096} s={0.55} f={f} cloth={C.warm} clothDk="#C9A95F" h={310} phase={6} label={['AI · TOO EARLY', 'TO PREDICT THE', 'MAGNITUDE']} labelSize={17} glow={0.6 + 0.4 * pulse} />
        <g transform={`translate(${pX},${pY}) scale(${tx},1) translate(${-pX},${-pY})`}>
          <Ptarmigan x={pX} y={pY} scale={0.62} f={f} facing={1} season="summer" />
        </g>
        <Table top={1262} />
        <Gravel y0={1382} y1={H + 40} seed={12} n={40} sc={1.5} />
        <FgDetail f={f} lit={widen} drift={-36 * widen} />
        <FortuneBall x={540} y={ballY} s={1.2} f={f} mood={f >= b(42) ? 'calm' : 'relieved'} look={[turnP * 0.6, 0.1]} answer="ASK AGAIN" squash={f >= 30 && f < 42 ? Math.sin(((f - 30) / 12) * Math.PI) * 0.6 : 0} />
        <g opacity={1 - mit} transform={`translate(0,${-700 * mit})`}><Mitten x={620} y={ballY - 360} rot={180} s={1.4} curl={0.3} /></g>
        <Plate text="ASK AGAIN NEXT FORECAST" y={556} size={34} tone="ink" p={ease(f, b(41) + 4, 10)} />
        <Plate text="" displayLines={['EXCLUDES SELF-EMPLOYED + FISHERMEN', 'ALASKA DEPT. OF LABOR']} y={1270} size={24} tone="bone" p={ease(f, b(42), 12)} />
      </SVG>
    </Frame>
  );
};

// ---- the shot router and the composition ------------------------------------------------------------------------
const SHOTS: Record<number, React.FC<SceneProps>> = {15: S15, 1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14};

const SHOT_ORDER = [1, 2, 15, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

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

export const ep1007Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1007Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:100 900;font-display:block;}`}</style>
);

export const Ep1007: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 6.2, 15.1, 24.2, 36.1, 39.4, 45.7, 52.3, 60.6, 73.4, 83.2, 95.4, 104.0, 108.4, 117.7, 125.0].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.inkDeep}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#10141C" ink="#F2EDE4" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
