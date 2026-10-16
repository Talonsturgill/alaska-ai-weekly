import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK, ContactShadow, tones, FormGradient} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {SeismicStation} from './lib/sensors';
import {OD, TileBoard, GrainBin, DialPanel, Ledger, ClockFace, RangeSlots, Pegboard, MapPlate, CorkWall, Dominoes, Slip, NightYard, LampPool} from './lib/odds';
import {IDS} from './Ep1016Ids';

// THE FORECAST THAT SHOWS ITS WORK, 2026-10-16. Palette roles are art_direction.json. CRANBERRY is only the Gate, LARCH GOLD only the
// question token, NAVY only an official stamp, STEEL and COPPER only the server machine. Every painted string is a claims.json
// on_screen string, a quote, or a plain label. The pen never writes any ink, so the STANDARDS sheet is blank to the end.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const PAL = {birch: OD.chalk, pearlSteelDeep: OD.skepticDeep, navy: '#16303C', desk: OD.desk, panel: '#12262D', rust: OD.alarm, steel: '#3B5662', brass: OD.brass};
const C = {ink: INK, paper: OD.chalk};
const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const easeIn = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
const spring = (f: number, a: number, d = 20) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.pow(2, -9 * t) * Math.cos((t * d - 1.2) * 0.9);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (i: number) => {
  let x = (Math.floor(i) + 1013) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
const rnd = (i: number) => (hash(i) % 10000) / 10000;

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'paper' | 'rust' | 'navy' | 'desk' | 'panel';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#070F13', fg: OD.chalk},
  paper: {fill: OD.chalk, fg: C.ink},
  rust: {fill: OD.alarmDeep, fg: OD.chalk},
  navy: {fill: '#16303C', fg: OD.chalk},
  desk: {fill: OD.desk, fg: OD.chalk},
  panel: {fill: '#12262D', fg: OD.chalk},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
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
  const fr = useCurrentFrame();
  const sc = (0.84 + 0.16 * spring(k * 20, 0, 20)) * (1 + 0.012 * Math.sin(fr / 11 + x * 0.01));
  return (
    <g opacity={Math.min(1, k * 1.6)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={C.ink} strokeWidth={4} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

/** A boxed quote, serif on paper with the attribution under it. `text` is "quote · attribution". */
const QuotePlate: React.FC<{text: string; x?: number; y: number; size?: number; wrap?: number; p?: number; rot?: number}> =
({text, x = 540, y, size = 34, wrap = 30, p = 1, rot = 0}) => {
  const parts = text.split(' · ');
  const by = parts.length > 1 ? parts.slice(1).join(' · ') : undefined;
  const lines: string[] = [];
  let cur = '';
  parts[0].split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > wrap) { lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const tw = Math.min(1000, Math.max(...lines.map((l) => l.length * size * 0.68), by ? monoW(by, 20) : 0) + 80);
  const th = lines.length * (size + 10) + (by ? 46 : 0) + 36;
  const yy = Math.min(y, CAP_GUARD - th / 2);
  assertCropSafe(lines.join(' '), yy - th / 2, yy + th / 2);
  const sc = 0.6 + 0.4 * spring(k * 18, 0, 18);
  return (
    <g transform={`translate(${x},${yy}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, k * 2)}>
      <rect x={-tw / 2 + 10} y={-th / 2 + 12} width={tw} height={th} fill="#000" opacity={0.3} />
      <rect x={-tw / 2} y={-th / 2} width={tw} height={th} fill={C.paper} stroke={C.ink} strokeWidth={7} />
      <rect x={-tw / 2 + 11} y={-th / 2 + 11} width={tw - 22} height={th - 22} fill="none" stroke={C.ink} strokeWidth={2.2} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-th / 2 + 22 + size * 0.86 + i * (size + 10)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={C.ink}>{l}</text>
      ))}
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={1} fill={PAL.pearlSteelDeep}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: push, kick, grade ---------------------------------------------------------
const CHIP = 'ILLUSTRATION';
const Frame: React.FC<{p: SP; z0?: number; z1?: number; zk?: (f: number) => number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; children: React.ReactNode}> =
({p, z0 = 1, z1 = 1.05, zk, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, bloom = 0.05, vignette = 0.28, ox = 540, oy = 900, tag = true, overlay, tagText = CHIP, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const z = zk ? zk(p.f) : lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur)));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + lerp(dx0, dx1, t) + 9 * Math.sin(p.f / 23)}px, ${jl.y + lerp(dy0, dy1, t) + 12 * Math.sin(p.f / 17 + 1)}px) rotate(${0.35 * Math.sin(p.f / 31)}deg) scale(${z * jl.scale * (1 + 0.009 * Math.sin(p.f / 13))})`, transformOrigin: `${ox}px ${oy}px`}}>
        {children}
      </div>
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#10151F" stroke={C.paper} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={C.paper}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.02} />
    </AbsoluteFill>
  );
};

// ---- shared pieces --------------------------------------------------------------------------------------------------
const Night: React.FC<{f: number; lamp?: {x: number; y: number; r?: number}; dawn?: number; ground?: number; shake?: number}> = ({f, lamp, dawn = 0, ground = 1230, shake = 0}) => (
  <g>
    <NightYard f={f} dawn={dawn} ground={ground} shake={shake} />
    {lamp && <LampPool x={lamp.x} y={lamp.y} r={lamp.r ?? 420} f={f} />}
  </g>
);
const DarkRoom: React.FC<{f: number; lampX?: number; lampY?: number; floor?: number}> = ({f, lampX = 540, lampY = 900, floor = 1240}) => (
  <g>
    <defs><radialGradient id="dr-lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={OD.tungsten} stopOpacity="0.5" /><stop offset="1" stopColor={OD.tungsten} stopOpacity="0" /></radialGradient></defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={OD.night} />
    <rect data-band="ok" x={-40} y={-40} width={1160} height={floor + 40} fill="#102A33" />
    <rect data-band="ok" x={-40} y={floor} width={1160} height={760} fill={OD.desk} />
    <rect data-band="ok" x={-40} y={floor} width={1160} height={14} fill={OD.deskHi} opacity={0.7} />
    {Array.from({length: 7}, (_, i) => <rect key={i} data-band="ok" x={-40} y={floor + 60 + i * 110} width={1160} height={4} fill="#000" opacity={0.18} />)}
    <circle cx={lampX} cy={lampY} r={560 * (1 + 0.02 * Math.sin(f / 21))} fill="url(#dr-lamp)" />
    {/* the practical: a pendant lamp that motivates the pool, swinging a hair */}
    <g transform={`translate(${lampX} 0) rotate(${1.2 * Math.sin(f / 37)} 0 0)`}>
      <line x1={0} y1={-20} x2={0} y2={170} stroke={INK} strokeWidth={6} />
      <path d="M -92 270 Q -80 190 0 176 Q 80 190 92 270 Z" fill={OD.brass} stroke={INK} strokeWidth={7} />
      <path d="M -70 262 Q -60 208 -4 190" fill="none" stroke={OD.brassHi} strokeWidth={6} opacity={0.7} />
      <ellipse cx={0} cy={272} rx={92} ry={14} fill={OD.tungstenHi} stroke={INK} strokeWidth={5} />
    </g>
    {/* near plane on the desk: a mug with steam and a pen cup, so the lower third has a front row */}
    <g transform={`translate(150 ${floor + 380})`}>
      <ContactShadow cx={0} cy={86} rx={96} ry={14} opacity={0.5} />
      <path d="M -70 -60 L -62 80 Q 0 100 62 80 L 70 -60 Z" fill="#7E8C82" stroke={INK} strokeWidth={7} />
      <ellipse cx={0} cy={-60} rx={70} ry={16} fill="#2A1A12" stroke={INK} strokeWidth={6} />
      <path d="M 68 -30 q 52 0 46 44 q -6 34 -50 28" fill="none" stroke={INK} strokeWidth={11} />
      {[0, 1, 2].map((i) => <path key={i} d={`M ${-24 + i * 24} -86 q ${10 * Math.sin(f / 9 + i)} -40 0 -80`} fill="none" stroke={OD.chalk} strokeWidth={5} opacity={0.3} strokeLinecap="round" />)}
    </g>
    <g transform={`translate(${940} ${floor + 360})`}>
      <ContactShadow cx={0} cy={100} rx={80} ry={12} opacity={0.5} />
      <rect x={-48} y={-70} width={96} height={170} rx={10} fill={OD.brass} stroke={INK} strokeWidth={7} />
      {[-24, 0, 24].map((x, i) => <line key={i} x1={x} y1={-70} x2={x + (i - 1) * 16} y2={-170 - i * 18} stroke={i === 1 ? OD.alarm : OD.chalk} strokeWidth={10} strokeLinecap="round" />)}
    </g>
    {Array.from({length: 18}, (_, i) => {
      const px = ((rnd(i + 3) * 1200 + f * (0.6 + rnd(i) * 1.2)) % 1200) - 60;
      return <circle key={i} cx={px} cy={200 + rnd(i + 11) * 1100 + 12 * Math.sin(f / 30 + i)} r={1.5 + rnd(i + 5) * 2} fill={OD.tungstenHi} opacity={0.2 + 0.25 * rnd(i + 8)} />;
    })}
  </g>
);

// ---- S1: 3:07 on the muskeg, the slip, the felt reports (beats 1 to 5) ----------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t1 = b(1), t2 = b(2), t3 = b(3), t4 = b(4), t5 = b(4) + 26;
  const shake = f < t2 + 10 ? clamp01(1 - f / (t2 + 10)) * (f > 0 ? 1 : 0.5) : 0;
  const pan = easeIO(f, t4 - 14, 34);
  const out = ease(f, t3, 46);
  const emo: 'straining' | 'heard' | 'listening' = f < t2 ? 'straining' : f < t3 + 30 ? 'heard' : 'listening';
  const nCork = 103 * ease(f, t4 + 6, 44);
  const chipIn = ease(f, t2, 8);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1100}
      overlay={<>
        <Plate text="THE FORECAST THAT SHOWS ITS WORK" x={540} y={500} size={26} tone="paper" p={ease(f, t1 + 6, 10) * (f < t4 - 20 ? 1 : 0)} />
        <Plate text="JUST PAST 3 A.M." x={400} y={600} size={36} tone="rust" p={ease(f, t1 + 2, 8) * (f < t2 + 40 ? 1 : 0)} />
        <Plate text="M5.6 · 43 KM NNW OF LAKE MINCHUMINA · OCT 15TH" displayLines={['M5.6 · 43 KM NNW OF', 'LAKE MINCHUMINA · OCT 15TH']} y={700} size={30} tone="ink" p={chipIn * (f < t4 - 6 ? 1 : 0)} />
        <Plate text="103 FELT REPORTS · USGS" y={820} size={36} tone="ink" p={ease(f, t5, 8)} />
      </>}>
      <SVG>
        <g transform={`translate(${-1200 * pan} 0)`}>
          <Night f={g} lamp={{x: 360, y: 980}} shake={shake} />
          <g transform={`translate(${shake * 6 * Math.sin(f * 2.1)} 0)`}>
            <SeismicStation x={400} y={1240} f={g} scale={2.0} emotion={emo} lamp={emo === 'heard' ? 1 : 0} heading={emo === 'straining' ? -55 : -28} groundY={0} tint="#7E8C82" />
          </g>
          {/* the slip curls out of the station's flank */}
          <Slip x={690} y={930} f={g} scale={1.0} out={out} header="U S GEOLOGICAL SURVEY" lines={[]} rot={-3} />
          <g transform="translate(1200 0)">
            <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={OD.night} />
            <rect data-band="ok" x={-40} y={-40} width={1160} height={1500} fill="#112B34" />
            <LampPool x={540} y={920} r={560} f={g} />
            <CorkWall x={540} y={900} f={g} scale={1.0} n={nCork} />
          </g>
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S2: a clock with no hands (beats 6, 7) ------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t6 = b(6), t7 = b(7);
  const q = ease(f, t7, 16);
  const appear = ease(f, t6, 10);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={960}
      overlay={<>
        <Plate text="WHEN?" y={540} size={56} tone="ink" p={ease(f, t6 + 4, 8) * (f < t7 ? 1 : 0)} />
        <Plate text="THE NEXT ONE" y={660} size={44} tone="ink" p={ease(f, t7 + 4, 8)} />
      </>}>
      <SVG>
        <DarkRoom f={g} lampX={560} lampY={900} />
        <g opacity={appear}><ClockFace x={540} y={960} f={g} scale={1.55} hands={false} dark qmark={q} /></g>
      </SVG>
    </Frame>
  );
};

// ---- S3: the odds come out of the slip (beats 8 to 11) -----------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t8 = b(8), t9 = b(9), t10 = b(10), t11 = b(11), t41 = b(41);
  const tap = Math.max(0, 1 - Math.abs(f - (t41 + 5)) / 6);
  const slide = easeIO(f, t8, 22);
  const print = clamp01((f - t9) / 12);
  const whip = spring(f, t10, 30);
  const m = 720 * whip, h = 60 * whip;
  const ann = f < t9 ? 'U S GEOLOGICAL SURVEY' : f < t10 ? 'ODDS, NOT A TIME' : f < t11 ? 'FORECAST ISSUED 12 HOURS LATER' : 'M5+ OUTSIDE THE LOWER 48 · FORECAST POSTED';
  return (
    <Frame p={p} z0={1.04} z1={1.0} oy={900}
      overlay={<>
        <Plate text={f < t9 ? 'U S GEOLOGICAL SURVEY' : f < t10 ? 'ODDS, NOT A TIME' : f < t11 ? 'FORECAST ISSUED 12 HOURS LATER' : 'M5+ OUTSIDE THE LOWER 48 · FORECAST POSTED'} displayLines={ann.length > 34 ? ['M5+ OUTSIDE THE LOWER 48', 'FORECAST POSTED'] : undefined} y={1130} size={30} tone={f < t9 ? 'navy' : 'ink'} p={ease(f, t8 + 6, 8)} />
      </>}>
      <SVG>
        <DarkRoom f={g} lampX={400} lampY={760} />
        <Slip x={lerp(-260, 360, slide)} y={540} f={g} scale={1.05} out={1} header="U S GEOLOGICAL SURVEY" lines={[{text: 'ODDS', p: print}]}
          boxShown box={0} stamp={{text: '12 HOURS LATER', k: ease(f, t10 + 14, 6), tone: 'ink'}} />
        <ClockFace x={820} y={760} f={g} scale={0.72} hands h={h} m={m} tone="warm" />
        <g transform={`translate(${lerp(1200, 560, easeIO(f, t8 + 6, 24))} ${1030 + 12 * Math.sin(g / 9) - 70 * tap}) rotate(${-8 + 10 * (f > t10 ? 0 : 1)})`} opacity={f < t10 ? 1 : 0}>
          <rect x={-60} y={-100} width={120} height={90} rx={10} fill={OD.brass} stroke={INK} strokeWidth={6} />
          <rect x={-18} y={-10} width={36} height={60} rx={6} fill={OD.deskHi} stroke={INK} strokeWidth={5} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S4: one hundred tiles lit forty and seven (beats 12 to 14) ----------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t12 = b(12), t13 = b(13), t14 = b(14), t42 = b(42);
  const flash = Math.max(0, 1 - Math.abs(f - (t42 + 3)) / 8);
  const rise = ease(f, t12, 26);
  let lit = 40 * easeIO(f, t13, 40);
  if (f >= t14) lit = lerp(40, 7, easeIO(f, t14, 22));
  const ann = f < t14 ? 'ABOUT 40 IN 100' : 'M4+ · ABOUT 7 IN 100';
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={900} bloom={0.08}
      overlay={<>
        <Plate text={f < t14 ? 'ABOUT 40 IN 100' : 'M4+ · ABOUT 7 IN 100'} y={1255} size={30} tone="ink" p={ease(f, t13, 8)} />
      </>}>
      <SVG>
        <DarkRoom f={g} lampX={540} lampY={860} />
        <TileBoard x={540} y={860} f={g} scale={0.92} lit={lit} rise={rise} flash={flash} label="A WEEK OUT · M3+" />
        <Slip x={110} y={1090} f={g} scale={0.5} out={ease(f, t12, 20)} header="" rot={-4}
          lines={[{text: '40 IN 100', p: clamp01((f - t13) / 10), small: false}, {text: '7 IN 100', p: clamp01((f - t14) / 10), small: false}]} />
      </SVG>
    </Frame>
  );
};

// ---- S12: one tile three quarters full, then a bin of a thousand grains (beats 15 and 16) ---------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t15 = b(15), t16 = b(16);
  const fill = 0.76 * ease(f, t15, 14);
  const pull = easeIO(f, t16, 50);
  const ann = f < t16 ? 'M5+ · UNDER 1 IN 100' : 'M6+ · UNDER 1 IN 1,000';
  const big = lerp(1, 0.05, pull);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={900} bloom={0.08}
      overlay={<>
        <Plate text={f < t16 ? 'M5+ · UNDER 1 IN 100' : 'M6+ · UNDER 1 IN 1,000'} y={1255} size={30} tone="ink" p={ease(f, t15, 8)} />
      </>}>
      <SVG>
        <DarkRoom f={g} lampX={540} lampY={860} />
        <g opacity={pull}>
          <GrainBin x={540} y={930} f={g} scale={lerp(0.3, 1.0, pull)} glow={1} />
        </g>
        <g transform={`translate(${lerp(540, 480, pull)} ${lerp(880, 1162, pull)}) scale(${big})`}>
          <ContactShadow cx={0} cy={250} rx={240} ry={20} opacity={0.5} />
          <rect x={-210} y={-210} width={420} height={420} rx={46} fill={OD.tile} stroke={INK} strokeWidth={14} />
          <rect x={-190} y={-190} width={380} height={30} rx={14} fill="#fff" opacity={0.08} />
          <rect x={-196} y={196 - 392 * fill} width={392} height={392 * fill} rx={38} fill={OD.lit} stroke={INK} strokeWidth={8} />
          <rect x={-170} y={196 - 392 * fill + 14} width={340} height={20} rx={10} fill={OD.litHi} opacity={0.6 + 0.2 * Math.sin(g / 8)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S5: a published equation with four dials (beats 18 to 20) --------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t18 = b(18), t19 = b(19), t20 = b(20);
  const on = ease(f, t18, 16);
  const seat = ease(f, t18 + 8, 36);
  const feedK = easeIO(f, t19, 50);
  const nowK = easeIO(f, t20, 26);
  const wob = f > t20 ? clamp01(1 - (f - t20) / 50) : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={900}
      overlay={<>
        <Plate text={f < t19 ? 'REASENBERG AND JONES · 1989 · FOUR DIALS a b c p' : f < t20 ? 'PAST SEQUENCES' : 'BENDS TOWARD THIS ONE'}
          displayLines={f < t19 ? ['REASENBERG AND JONES · 1989', 'FOUR DIALS a b c p'] : undefined} y={1240} size={30} tone="ink" p={ease(f, t18 + 6, 8)} />
      </>}>
      <SVG>
        <DarkRoom f={g} lampX={540} lampY={860} />
        <DialPanel x={540} y={800} f={g} scale={1.0} seat={seat} on={on} wobble={wob} sync={1} />
        {[0, 1, 2].map((i) => {
          const k = clamp01(feedK * 3.4 - i * 0.9);
          return <Ledger key={i} x={lerp(-160, 540, easeIO(k, 0, 1))} y={1090 - 40 * k} rot={-10 + 20 * k} scale={0.85 * (1 - 0.35 * k)} tone="past" label="PAST" />;
        })}
        <Slip x={lerp(1240, 700, nowK)} y={lerp(1000, 940, nowK)} f={g} scale={0.46} out={1} lines={[{text: 'ODDS', p: 1}]} tape={ease(f, t20 + 14, 10)} tapeLine="MAY PERFORM POORLY WHEN BIG AFTERSHOCKS TRIGGER MORE" rot={6 - 8 * nowK} />
      </SVG>
    </Frame>
  );
};

// ---- S6: a range, not a number (beats 21 to 23) -----------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t21 = b(21), t22 = b(22), t23 = b(23);
  const open = ease(f, t21, 28);
  const label = ease(f, t22, 12);
  const drop = clamp01((f - t23) / 30);
  const ann = f < t22 ? 'A RANGE, NOT A NUMBER' : f < t23 ? '0 TO 5 AFTERSHOCKS THIS WEEK' : 'COUNTED SO FAR · 1 AFTERSHOCK M3+';
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={900}
      overlay={<>
        <Plate text={f < t22 ? 'A RANGE, NOT A NUMBER' : f < t23 ? '0 TO 5 AFTERSHOCKS THIS WEEK' : 'COUNTED SO FAR · 1 AFTERSHOCK M3+'} y={1180} size={30} tone="ink" p={ease(f, t21 + 4, 8)} />
      </>}>
      <SVG>
        <DarkRoom f={g} lampX={540} lampY={820} />
        <RangeSlots x={540} y={800} f={g} scale={0.98} open={open} label={label} drop={drop} count={drop > 0.9 ? 1 : 0} />
        <Slip x={150} y={1020} f={g} scale={0.46} out={1} lines={[{text: 'ODDS', p: 1}]} boxShown box={0} tape={1} tapeLine="MAY PERFORM POORLY WHEN BIG AFTERSHOCKS TRIGGER MORE" rot={-4} header="" />
      </SVG>
    </Frame>
  );
};

// ---- S7: one draw can't grade a probability (beats 24 to 27) ----------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t24 = b(24), t25 = b(25), t26 = b(26), t27 = b(27);
  const q = ease(f, t24, 14);
  const drop = easeIO(f, t25, 56);
  const split = easeIO(f, t26, 22);
  const cal = ease(f, t27, 22);
  const ann = f < t25 ? 'WORTH TRUSTING?' : f < t26 ? 'ONE QUAKE' : f < t27 ? 'FORTY IN A HUNDRED · NOT WRONG EITHER WAY' : 'A LONG RUN OF FORECASTS';
  return (
    <Frame p={p} z0={1.0} z1={1.04} oy={900}
      overlay={<>
        <Plate text={f < t25 ? 'WORTH TRUSTING?' : f < t26 ? 'ONE QUAKE' : f < t27 ? 'FORTY IN A HUNDRED · NOT WRONG EITHER WAY' : 'A LONG RUN OF FORECASTS'} displayLines={ann.length > 30 ? ['FORTY IN A HUNDRED', 'NOT WRONG EITHER WAY'] : undefined} y={f < t26 ? 540 : 1210} size={34} tone={f < t25 ? 'ink' : 'navy'} p={ease(f, t24 + 6, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#0B1E25" />
        <rect data-band="ok" x={-40} y={440} width={1160} height={900} fill="#10303A" />
        <g opacity={1 - split}>
          <Pegboard x={540} y={720} f={g} scale={0.66} k={drop} seed={5} />
          <Slip x={170} y={760} f={g} scale={0.55} out={1} lines={[{text: 'ODDS', p: 1}]} tape={1} tapeLine="MAY PERFORM POORLY WHEN BIG AFTERSHOCKS TRIGGER MORE" rot={-6} header="" />
          <g opacity={q}><text x={170} y={1010} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={140} fill={OD.tungsten} stroke={INK} strokeWidth={5} paintOrder="stroke">?</text></g>
        </g>
        <g opacity={split * (1 - cal)}>
          <TileBoard x={300} y={900} f={g} scale={0.46} lit={40} tint={OD.skeptic} label="ANOTHER ARRIVES" />
          <TileBoard x={780} y={900} f={g} scale={0.46} lit={40} tint={OD.skeptic} label="NONE ARRIVES" />
          <rect x={534} y={500} width={12} height={720} fill={OD.chalk} stroke={INK} strokeWidth={4} />
        </g>
        <g opacity={cal}>
          <g transform="translate(540 760)">
            <rect x={-180} y={-190} width={360} height={380} rx={12} fill={OD.chalk} stroke={INK} strokeWidth={7} />
            <rect x={-180} y={-190} width={360} height={74} rx={12} fill={OD.alarmDeep} stroke={INK} strokeWidth={7} />
            <text x={0} y={-138} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} letterSpacing={4} fill={OD.chalk}>THIS WEEK</text>
            {Array.from({length: 7}, (_, i) => <rect key={i} x={-150 + (i % 4) * 78} y={-86 + Math.floor(i / 4) * 90} width={64} height={70} rx={6} fill="none" stroke={INK} strokeWidth={3.5} />)}
            <text x={0} y={150} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} fill={INK}>?</text>
          </g>
          {Array.from({length: 7}, (_, i) => <g key={i} transform={`rotate(${-48 + i * 16} 540 1330)`}><TileBoard x={540} y={1070 - 20 * Math.abs(i - 3)} f={g} scale={0.17} lit={40 - (i % 3) * 2} frame={false} /></g>)}
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S8: the tape comes off (beats 28 to 30) ---------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t28 = b(28), t29 = b(29), t30 = b(30);
  const peel = easeIO(f, t29, 24);
  const dom = easeIO(f, t30, 54);
  const sync = f < t30 ? 1 : 1 - ease(f, t30 + 6, 18);
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={700}
      overlay={<>
        <Plate text={f < t29 ? 'READ LAST' : f < t30 ? 'MAY PERFORM POORLY WHEN BIG AFTERSHOCKS TRIGGER MORE · PER USGS' : 'AFTERSHOCKS SET OFF THEIR OWN'}
          displayLines={f >= t29 && f < t30 ? ['MAY PERFORM POORLY WHEN', 'BIG AFTERSHOCKS TRIGGER MORE', 'PER USGS'] : undefined} y={1200} size={30} tone={f < t29 ? 'ink' : 'rust'} p={ease(f, t28 + 4, 8)} />
      </>}>
      <SVG>
        <DarkRoom f={g} lampX={540} lampY={620} />
        <Slip x={540} y={470} f={g} scale={1.38} out={1} header="U S GEOLOGICAL SURVEY" lines={[{text: 'ODDS', p: 1}, {text: 'RANGE 0 TO 5', p: 1}]} tape={1 - peel * 0.0} peel={peel} tapeLine="MAY PERFORM POORLY WHEN BIG AFTERSHOCKS TRIGGER MORE" />
        <g opacity={ease(f, t30 - 6, 10)}>
          <DialPanel x={540} y={1090} f={g} scale={0.46} seat={1} sync={sync} wobble={1 - sync} on={1} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S9: the big one came second (beats 31 to 34) ---------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t31 = b(31), t32 = b(32), t33 = b(33), t34 = b(34);
  const disc = easeIO(f, t34, 44);
  const ticks = clamp01((f - t33) / 26);
  const ann = f < t32 ? 'CONTEXT, NOT AN ALASKA CLAIM' : f < t34 ? '2011 JAPAN · M7.3 · TWO DAYS LATER' : '2011 JAPAN · M7.3 · TWO DAYS LATER · M9.1';
  return (
    <Frame p={p} zk={() => lerp(1.12, 0.9, easeIO(f, t34 - 4, 56))} oy={900}
      overlay={<>
        <Plate text={f < t32 ? 'CONTEXT, NOT AN ALASKA CLAIM' : f < t34 ? '2011 JAPAN · M7.3 · TWO DAYS LATER' : '2011 JAPAN · M7.3 · TWO DAYS LATER · M9.1'} displayLines={ann.length > 34 ? ['2011 JAPAN · M7.3', 'TWO DAYS LATER · M9.1'] : undefined} y={f < t32 ? 560 : 1210} size={30} tone={f < t32 ? 'ink' : 'navy'} p={ease(f, t31 + 4, 8)} />
        <Plate text="ILLUSTRATIVE SIZE · NOT TO SCALE" y={1130} size={24} tone="panel" p={ease(f, t34 + 20, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#0B1E25" />
        <MapPlate x={540} y={880} f={g} scale={0.9} pin={1} disc={disc} ticks={ticks} />
      </SVG>
    </Frame>
  );
};

// ---- S10: can be checked, not yet graded (beats 35 to 37) -------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t35 = b(35), t36 = b(36), t37 = b(37), t43 = b(43);
  const tk = ease(f, t43, 16);
  const box = ease(f, t36, 26);
  const tab = ease(f, t36 + 10, 16);
  const pend = ease(f, t37, 8);
  const ann = f < t36 ? 'CAN BE CHECKED · NOT YET GRADED' : f < t37 ? 'NEXT UPDATE TIME PRINTED ON EVERY FORECAST' : 'VERDICT PENDING';
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1000}
      overlay={<>
        <Plate text={f < t36 ? 'CAN BE CHECKED · NOT YET GRADED' : f < t37 ? 'NEXT UPDATE TIME PRINTED ON EVERY FORECAST' : 'VERDICT PENDING'} displayLines={ann.length > 32 ? ['NEXT UPDATE TIME', 'PRINTED ON EVERY FORECAST'] : undefined} y={1130} size={30} tone="ink" p={ease(f, t35 + 4, 8)} />
      </>}>
      <SVG>
        <Night f={g} dawn={0.2} lamp={{x: 340, y: 980}} />
        <SeismicStation x={330} y={1190} f={g} scale={1.6} emotion={f < t37 ? 'listening' : 'listening'} lamp={0} heading={f < t37 ? -24 : -8 + 6 * Math.sin(f / 30)} groundY={0} tint="#7E8C82" />
        <Slip x={730} y={520} f={g} scale={1.0} out={1} header="U S GEOLOGICAL SURVEY" lines={[{text: 'ODDS', p: 1}, {text: 'RANGE 0 TO 5', p: 1}]} boxShown box={box} tab={tab} stamp={{text: 'PENDING', k: pend, tone: 'rust'}} />
        <path d="M 640 700 L 700 770 L 840 600" fill="none" stroke={OD.lit} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={420} strokeDashoffset={420 * (1 - tk)} opacity={tk > 0 ? 0.95 : 0} />
      </SVG>
    </Frame>
  );
};

// ---- S11: ask for the slip (beats 38 to 40) ----------------------------------------------------------------------------------------
const TickRow: React.FC<{y: number; label: string; k: number}> = ({y, label, k}) => (
  <g transform={`translate(0 ${y})`} opacity={clamp01(k * 2)}>
    <g transform={`translate(${lerp(-60, 0, clamp01(k))} 0)`}>
      <path d="M -24 0 L -8 18 L 26 -22" fill="none" stroke={OD.lit} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <text x={46} y={10} fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={2} fill={OD.chalk} stroke={INK} strokeWidth={4} paintOrder="stroke">{label}</text>
    </g>
  </g>
);
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t38 = b(38), t39 = b(39), t40 = b(40), t44 = b(44);
  const pull = easeIO(f, t39, 40);
  const dawn = ease(f, t39, 80);
  const lampK = ease(f, t40, 14);
  const names = ['FLOOD', 'FIRE', 'WEATHER', 'ANY TOOL'];
  return (
    <Frame p={p} zk={() => lerp(1.2, 0.98, pull)} oy={760}
      overlay={<>
        <Plate text="FLOOD · FIRE · WEATHER · ANY TOOL" displayLines={['FLOOD · FIRE', 'WEATHER · ANY TOOL']} y={1200} size={30} tone="ink" p={ease(f, t39 + 10, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={dawn > 0.5 ? '#2A4A5A' : '#102A33'} />
        <rect data-band="ok" x={-40} y={-40} width={1160} height={1360} fill={`rgba(${Math.round(lerp(16, 90, dawn))},${Math.round(lerp(42, 130, dawn))},${Math.round(lerp(51, 150, dawn))},1)`} />
        {/* the corkboard */}
        <ContactShadow cx={540} cy={1170} rx={520} ry={22} opacity={0.5} />
        <rect x={40} y={440} width={1000} height={720} rx={14} fill={OD.cork} stroke={INK} strokeWidth={8} />
        <g transform="translate(270 470)">
          <Slip x={0} y={0} f={g} scale={1.0} out={1} header="U S GEOLOGICAL SURVEY" lines={[{text: 'ODDS', p: 1}, {text: 'RANGE 0 TO 5', p: 1}]} boxShown box={1} tab={1} rot={-1.5} />
        </g>
        <g transform="translate(470 560)">
          <TickRow y={0} label="ODDS" k={clamp01((f - t38) / 12)} />
          <TickRow y={74} label="A RANGE" k={clamp01((f - t38 - 14) / 12)} />
          <TickRow y={148} label="A LIMIT" k={clamp01((f - t38 - 28) / 12)} />
          <TickRow y={222} label="A NEXT CHECK" k={clamp01((f - t38 - 42) / 12)} />
        </g>
        {names.map((n, i) => (
          <Slip key={n} x={640 + (i % 2) * 190} y={810 + Math.floor(i / 2) * 170 - 34 * Math.max(0, 1 - Math.abs(f - (t44 + 6 + i * 7)) / 8)} f={g + i * 7} scale={0.4} out={ease(f, t39 + i * 5, 14)} header={n} lines={[]} rot={-5 + i * 3} />
        ))}
        {/* the station keeps the open: its lamp lights and a blank slip curls out */}
        <g transform="translate(150 1290)">
          <SeismicStation x={0} y={0} f={g} scale={0.62} emotion={lampK > 0.5 ? 'heard' : 'listening'} lamp={lampK} heading={-26} groundY={0} tint="#7E8C82" />
        </g>
        <Slip x={250} y={1210} f={g} scale={0.34} out={lampK} header="" lines={[]} rot={4} />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill="#102A33" />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.paper}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'STATION', 2: 'CLOCK', 3: 'ODDS', 4: 'TILES', 12: 'BIN', 5: 'DIALS', 6: 'RANGE', 7: 'ONE DRAW', 8: 'TAPE', 9: 'JAPAN', 10: 'CHECKED', 11: 'ASK'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 12: S12, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11};
const SHOT_ORDER = [1, 2, 3, 4, 12, 5, 6, 7, 8, 9, 10, 11];

const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]; kicks: number[]}> = ({n, from, dur, beats, kicks}) => {
  const f = useCurrentFrame();
  const b = (id: number) => {
    const x = beats.find((y) => y.id === (IDS[id] ?? id));
    return x ? Math.round(x.at * 30) - from : 0;
  };
  const bt = (id: number) => {
    const x = beats.find((y) => y.id === (IDS[id] ?? id));
    return x ? Math.round(x.at * 30) : 0;
  };
  const Comp = SHOTS[n];
  const p = {f, from, dur, b, kicks, bt};
  return Comp ? <Comp p={p} /> : <Rough n={n} title={TITLES[n] ?? ''} p={p} />;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1016Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1016Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1016: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 12, 16, 27, 37, 46, 56, 66, 82, 89, 100, 113, 120].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.ink}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#0A1418" ink="#EDE6D3" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
