import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, ContactShadow} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {MONO, monoW} from './lib/prospect';
import {HeldTravel, HeldProp} from './lib/heldidle';
import {Raven} from './lib/fauna';
import {Spruce} from './lib/rail';
import {Envelope} from './lib/refinery';
import {AlaskaOutline, akProject, akHeight} from './lib/akgeo';
import {SG, StormGlass, Thunderhead, Bolt, StrikeToken, SensDial, AverageRuler, ModelRacer, RangeColumn, Lab, TestCard, ChainHang} from './lib/stormglass';
import {IDS} from './Ep1127Ids';

// Trained on 2019, 2026-11-27. Palette roles are art_direction.json: green-slate storm sky to a pewter anvil with a golden
// band of low midnight light that thins act by act; tussock khaki, taiga conifers, muted fireweed buds. LEMON is lightning
// alone (bolts, the hatched range columns, strike marks, the glass's charge after a bolt). OXBLOOD is the wax seal alone.
// The glass is THE MODEL, never called a storm glass on screen. The future range is ONE hatched treatment from floor to
// ceiling; TODAY is the only solid token. The preprint's envelope and card never touch the glass except by the cord, and
// the race never includes the glass. No people are drawn; Krause and Rammig are name cards only.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
const INK = SG.ink;
const GROUND = 1262;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** a plate window: in over 6 frames at a, out over 6 frames before b */
const win = (f: number, a: number, b = 1e9) => clamp01((f - a) / 6) * clamp01((b - f) / 6);
/** a bolt's life 0..1 starting at frame a, about a second long */
const boltP = (f: number, a: number, d = 30) => (f < a ? 0 : (f - a) / d);
const charge = (f: number, a: number) => (f < a ? 0 : Math.exp(-(f - a) / 6));

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'plate' | 'dark' | 'lemon';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  plate: {fill: SG.paper, fg: INK, edge: INK},
  dark: {fill: '#22302F', fg: SG.paper, edge: SG.paper},
  lemon: {fill: SG.lemon, fg: INK, edge: INK},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> =
({text, displayLines, x = 540, y, size = 30, tone = 'plate', p = 1, rot = 0}) => {
  const ls = displayLines ?? [text ?? ''];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  const fr = useCurrentFrame();
  if (k <= 0.01) return null;
  const sc = (0.88 + 0.12 * Math.min(1, k * 1.15)) * (1 + 0.01 * Math.sin(fr / 11 + x * 0.01));
  return (
    <g opacity={Math.min(1, k * 1.7)} transform={`translate(${x} ${yy}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={t.edge} strokeWidth={4} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; overlay?: React.ReactNode; bg?: string; warmth?: number; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.2, overlay, bg = SG.plum, warmth = 0.03, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: 540 + 10 * Math.sin(p.f / 110) + 6 * t, fy: 960};
  const zz = Math.max(1, c.z);
  const fx = Math.max(540 / zz, Math.min(1080 - 540 / zz, c.fx)), fy = Math.max(960 / zz, Math.min(1920 - 960 / zz, c.fy));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: bg}} />
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - fx * zz}px, ${960 - fy * zz}px) scale(${zz})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#22302F" stroke={SG.paper} strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={SG.paper}>{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.05} warmth={warmth} />
    </AbsoluteFill>
  );
};

/** the shared world: green-slate sky, a golden band that thins act by act, an anvil, a far ridge with a burn scar,
 *  a taiga plane, the sedge ridge and a near plane of tussocks and fireweed buds under the caption card. */
const Ridge: React.FC<{f: number; seed?: number; band?: number; flash?: number; cloud?: boolean; wall?: number; raven?: number; ravenDuck?: number; ground?: number; trees?: number}> =
({f, seed = 1, band = 1, flash = 0, cloud = true, wall = 0, raven = -1, ravenDuck = -1, ground = GROUND, trees = 1}) => {
  const dim = 0.32 * (1 - clamp01(band));
  const id = `rg${seed}`;
  const bw = 40 + 120 * clamp01(band);
  const conifers = [] as React.ReactNode[];
  for (let i = 0; i < 16; i++) {
    const x = -40 + i * 74 + (h01(seed, i) - 0.5) * 40;
    const hgt = 150 + 120 * h01(seed + 2, i);
    conifers.push(<Spruce key={i} x={x} y={ground - 70 + 20 * h01(seed + 4, i)} h={hgt * trees} seed={seed * 10 + i} snow={false} tone={SG.taiga} />);
  }
  const tufts = [] as React.ReactNode[];
  for (let i = 0; i < 26; i++) {
    const x = -20 + i * 44 + (h01(seed + 7, i) - 0.5) * 30;
    const y = 1490 + 400 * h01(seed + 8, i);
    const r = 26 + 22 * h01(seed + 9, i);
    const sw = 3 * Math.sin(f / 23 + i);
    tufts.push(
      <g key={i} transform={`translate(${x} ${y})`}>
        <ellipse cx={0} cy={6} rx={r * 1.1} ry={r * 0.32} fill={SG.peat} opacity={0.6} />
        <path d={`M ${-r} 0 Q ${-r * 0.6 + sw} ${-r * 1.4} 0 ${-r * 0.9} Q ${r * 0.6 + sw} ${-r * 1.5} ${r} 0 Z`} fill={i % 3 ? SG.sedge : SG.sedgeL} stroke={INK} strokeWidth={3} />
        {i % 4 === 1 && <g transform={`translate(${r * 0.3} ${-r})`}><path d={`M 0 0 L ${sw} -60`} stroke={SG.sedgeD} strokeWidth={4} /><ellipse cx={sw} cy={-66} rx={6} ry={14} fill={SG.fireweed} stroke={INK} strokeWidth={2.5} /></g>}
      </g>,
    );
  }
  const rv = raven >= 0;
  const duck = ravenDuck >= 0 && f >= ravenDuck && f < ravenDuck + 18 ? Math.sin(((f - ravenDuck) / 18) * Math.PI) : 0;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}s`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={SG.plum} />
          <stop offset="0.55" stopColor={SG.mauve} />
          <stop offset="1" stopColor={SG.mauveL} />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={SG.apricot} stopOpacity={0} />
          <stop offset="0.6" stopColor={SG.apricot} stopOpacity={0.75} />
          <stop offset="1" stopColor={SG.apricotL} stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <rect x={-80} y={-80} width={1240} height={ground + 120} fill={`url(#${id}s)`} />
      <rect x={-80} y={ground - 260 - bw / 2} width={1240} height={bw} fill={`url(#${id}b)`} />
      {cloud && <Thunderhead f={f} x={520 + 30 * Math.sin(f / 140)} y={760} w={1180} flash={flash} seed={seed} />}
      {wall > 0.01 && (
        <g opacity={clamp01(wall)}>
          <path d={`M -80 ${ground - 120} Q 300 ${ground - 330 - 60 * Math.sin(f / 30)} 600 ${ground - 300} Q 900 ${ground - 340} 1160 ${ground - 140} L 1160 ${ground - 80} L -80 ${ground - 80} Z`} fill={SG.plumL} stroke={INK} strokeWidth={4} />
          {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${40 + i * 120} ${ground - 260} l ${-8} 160`} stroke={SG.mauveL} strokeWidth={5} opacity={0.6} strokeDasharray="10 12" />)}
        </g>
      )}
      <path d={`M -80 ${ground - 150} Q 140 ${ground - 230} 330 ${ground - 170} Q 560 ${ground - 250} 760 ${ground - 180} Q 960 ${ground - 230} 1160 ${ground - 160} L 1160 ${ground} L -80 ${ground} Z`} fill={SG.plumL} stroke={INK} strokeWidth={4} />
      <path d={`M 560 ${ground - 236} Q 640 ${ground - 230} 720 ${ground - 196}`} stroke={SG.peat} strokeWidth={10} opacity={0.6} fill="none" />
      <g>{conifers}</g>
      <rect x={-80} y={ground - 20} width={1240} height={1960 - ground} fill={SG.sedge} data-band="ok" />
      <path d={`M -80 ${ground - 20} Q 300 ${ground - 44} 600 ${ground - 26} Q 900 ${ground - 12} 1160 ${ground - 30}`} stroke={SG.sedgeL} strokeWidth={8} fill="none" />
      {Array.from({length: 14}, (_, i) => <ellipse key={`g${i}`} cx={30 + i * 78} cy={ground + 40 + 30 * h01(seed + 12, i)} rx={30} ry={8} fill={SG.sedgeD} opacity={0.5} data-band="ok" />)}
      <g data-band="ok">{tufts}</g>
      {dim > 0.01 && <rect x={-80} y={-80} width={1240} height={2080} fill={SG.plum} opacity={dim} data-band="ok" />}
      {rv && (
        <g>
          <rect x={raven - 5} y={ground - 150} width={10} height={150} fill={SG.woodD} stroke={INK} strokeWidth={3} />
          <ContactShadow cx={raven} cy={ground + 2} rx={16} ry={4} opacity={0.4} />
          <g transform={`translate(0 ${duck * 26})`}><Raven x={raven} y={ground - 150} scale={0.8} f={f} facing={-1} /></g>
        </g>
      )}
    </g>
  );
};

/** a boxed name card on a short stake (named people are never drawn) */
const NameCard: React.FC<{x: number; y: number; text: string; size?: number; f: number; drop?: number}> = ({x, y, text, size = 20, f, drop = 1}) => {
  const w = monoW(text, size) + 30;
  const d = clamp01(drop);
  return (
    <g transform={`translate(${x} ${y - (1 - d) * 500}) rotate(${Math.sin(f / 27 + x) * 1.2 + (1 - d) * 18})`}>
      {d >= 1 && <ContactShadow cx={0} cy={2} rx={22} ry={5} opacity={0.4} />}
      {d >= 1 && <path d="M -26 2 l 10 -10 M 26 2 l -10 -10 M -14 4 l 6 -14" stroke={SG.peat} strokeWidth={4} />}
      <rect x={-4} y={-80} width={8} height={82} fill={SG.woodD} stroke={INK} strokeWidth={2.5} />
      <rect x={-w / 2} y={-80 - size - 22} width={w} height={size + 22} rx={5} fill={SG.paper} stroke={INK} strokeWidth={4} />
      <text x={0} y={-80 - 11 + size * 0.36 - size / 2 + 2} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={size} letterSpacing={1.5} fill={INK}>{text}</text>
    </g>
  );
};

/** a brass field easel with a spring clip; the sheet hangs from the clip */
const Easel: React.FC<{x: number; y: number; f: number; children?: React.ReactNode; jump?: number}> = ({x, y, f, children, jump = 0}) => (
  <g transform={`translate(${x} ${y - 10 * jump})`}>
    <ContactShadow cx={0} cy={4} rx={130} ry={14} opacity={0.42} />
    <path d="M -110 0 L -20 -470 M 110 0 L 20 -470 M 0 -470 L 0 40" stroke={INK} strokeWidth={14} strokeLinecap="round" />
    <path d="M -110 0 L -20 -470 M 110 0 L 20 -470 M 0 -470 L 0 40" stroke={SG.brass} strokeWidth={8} strokeLinecap="round" />
    <rect x={-150} y={-160} width={300} height={16} rx={6} fill={SG.brassL} stroke={INK} strokeWidth={4} />
    <rect x={-30} y={-490} width={60} height={24} rx={6} fill={SG.brass} stroke={INK} strokeWidth={4} />
    {children}
  </g>
);

/** a sheet of paper with real body, mono rows */
const Sheet: React.FC<{x: number; y: number; w: number; h: number; title?: string; rows?: number; rot?: number; f: number; tint?: string}> = ({x, y, w, h, title, rows = 5, rot = 0, f, tint = SG.paper}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot + Math.sin(f / 19 + x) * 1.2})`}>
    <rect x={-w / 2 + 6} y={6} width={w} height={h} fill="#000" opacity={0.25} />
    <rect x={-w / 2} y={0} width={w} height={h} fill={tint} stroke={INK} strokeWidth={4} />
    <path d={`M ${w / 2 - 34} ${h} L ${w / 2} ${h - 34} L ${w / 2} ${h} Z`} fill={SG.paperD} stroke={INK} strokeWidth={3} />
    {title && <text x={0} y={42} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={Math.min(26, (w - 30) / (title.length * 0.62))} fill={INK}>{title}</text>}
    {Array.from({length: rows}, (_, i) => <rect key={i} x={-w / 2 + 22} y={62 + i * 24} width={(w - 44) * (0.6 + 0.4 * h01(x, i))} height={8} rx={3} fill={SG.paperD} />)}
  </g>
);

/** a field plank on short legs, the bench of the film (all on the ridge) */
const Plank: React.FC<{x: number; y: number; w?: number}> = ({x, y, w = 900}) => (
  <g transform={`translate(${x} ${y})`}>
    <ContactShadow cx={0} cy={70} rx={w * 0.55} ry={16} opacity={0.4} />
    {[-w * 0.42, w * 0.42].map((lx) => <rect key={lx} x={lx - 10} y={0} width={20} height={70} fill={SG.woodD} stroke={INK} strokeWidth={4} />)}
    <rect x={-w / 2} y={-34} width={w} height={40} rx={6} fill="#8A6A44" stroke={INK} strokeWidth={5} />
    <path d={`M ${-w / 2 + 20} -18 L ${w / 2 - 20} -18`} stroke="#A8865A" strokeWidth={3} />
    {Array.from({length: 6}, (_, i) => <path key={i} d={`M ${-w / 2 + 60 + i * w / 6} -28 q 30 6 60 0`} stroke="#6E5236" strokeWidth={2} fill="none" />)}
  </g>
);

/** a brass hand stamp, origin at its face */
const HandStamp: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-50} y={-30} width={100} height={30} rx={6} fill={SG.brass} stroke={INK} strokeWidth={5} />
    <rect x={-14} y={-130} width={28} height={100} fill={SG.woodD} stroke={INK} strokeWidth={5} />
    <ellipse cx={0} cy={-150} rx={42} ry={30} fill={SG.wood} stroke={INK} strokeWidth={5} />
    <path d="M -30 -158 q 30 -16 60 0" stroke={SG.woodL} strokeWidth={5} fill="none" />
  </g>
);

/** six tiny weather instrument icons on posts (faceless) */
const INSTR = ['thermo', 'rain', 'hygro', 'baro', 'sock', 'sun'] as const;
const Instrument: React.FC<{x: number; y: number; kind: typeof INSTR[number]; f: number; tick?: number}> = ({x, y, kind, f, tick = 0}) => {
  const tk = clamp01(tick);
  const jig = tk > 0 && tk < 1 ? Math.sin(tk * Math.PI * 4) * 6 : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-5} y={-110} width={10} height={110} fill={SG.woodD} stroke={INK} strokeWidth={3} />
      <ContactShadow cx={0} cy={2} rx={18} ry={4} opacity={0.4} />
      <g transform={`translate(0 -150) rotate(${jig})`}>
        <circle cx={0} cy={0} r={38} fill={SG.paper} stroke={INK} strokeWidth={4} />
        {kind === 'thermo' && <g><rect x={-6} y={-26} width={12} height={40} rx={6} fill="#FFFFFF" stroke={INK} strokeWidth={3} /><circle cx={0} cy={18} r={9} fill={SG.blush} stroke={INK} strokeWidth={3} /><rect x={-3} y={-6 - 10 * tk} width={6} height={24 + 10 * tk} fill={SG.blush} /></g>}
        {kind === 'rain' && <g><path d="M -16 -14 L 16 -14 L 10 18 L -10 18 Z" fill={SG.glassL} stroke={INK} strokeWidth={3} /><path d={`M -12 ${8 - 8 * tk} L 12 ${8 - 8 * tk}`} stroke={SG.mauve} strokeWidth={4} /></g>}
        {kind === 'hygro' && <g><path d="M -18 10 Q 0 -30 18 10" stroke={INK} strokeWidth={3} fill="none" /><path d={`M 0 12 L ${-12 + 24 * tk} -16`} stroke={SG.inkL} strokeWidth={4} /></g>}
        {kind === 'baro' && <g><circle cx={0} cy={0} r={24} fill={SG.paperD} stroke={INK} strokeWidth={3} /><path d={`M 0 0 L ${Math.cos(-2 + tk) * 18} ${Math.sin(-2 + tk) * 18}`} stroke={INK} strokeWidth={4} /></g>}
        {kind === 'sock' && <g><path d={`M -20 -12 L 18 ${-8 + 6 * Math.sin(f / 6)} L 18 ${6 + 6 * Math.sin(f / 6)} L -20 12 Z`} fill={SG.blush} stroke={INK} strokeWidth={3} /><path d="M -2 -10 L -2 10 M 8 -9 L 8 9" stroke={SG.paper} strokeWidth={4} /></g>}
        {kind === 'sun' && <g><circle cx={0} cy={0} r={13} fill={SG.apricot} stroke={INK} strokeWidth={3} />{Array.from({length: 8}, (_, i) => <path key={i} d={`M ${Math.cos(i * 0.785 + f / 40) * 18} ${Math.sin(i * 0.785 + f / 40) * 18} L ${Math.cos(i * 0.785 + f / 40) * 28} ${Math.sin(i * 0.785 + f / 40) * 28}`} stroke={INK} strokeWidth={3} />)}</g>}
      </g>
    </g>
  );
};

/** a wooden ledger post with a fill bar */
const LedgerPost: React.FC<{x: number; y: number; h: number; fill: number; year: string; rise: number}> = ({x, y, h, fill, year, rise}) => {
  const r = clamp01(rise);
  if (r <= 0) return null;
  const hh = h * r;
  const fl = clamp01(fill) * r;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ContactShadow cx={0} cy={2} rx={34} ry={7} opacity={0.42} />
      <rect x={-26} y={-hh} width={52} height={hh} fill={SG.woodD} stroke={INK} strokeWidth={4} />
      <rect x={-16} y={-hh + 12} width={32} height={Math.max(0, hh - 50)} fill={SG.peat} stroke={INK} strokeWidth={2.5} />
      <rect x={-16} y={-hh + 12 + Math.max(0, hh - 50) * (1 - fl)} width={32} height={Math.max(0, hh - 50) * fl} fill={SG.apricot} />
      <path d={`M -22 ${-hh + 12 + Math.max(0, hh - 50) * 0.07} L 22 ${-hh + 12 + Math.max(0, hh - 50) * 0.07}`} stroke={INK} strokeWidth={3} strokeDasharray="5 4" />
      <text x={0} y={-12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={16} fill={SG.paper}>{year}</text>
    </g>
  );
};

/** a brass caliper with two jaws at screen y top and y bottom on a vertical bar at x */
const Caliper: React.FC<{x: number; yTop: number; yBot: number; k: number; tick?: number}> = ({x, yTop, yBot, k, tick = 0}) => {
  const kk = clamp01(k);
  if (kk <= 0) return null;
  const yt = lerp(yTop - 160, yTop, kk), yb = lerp(yBot + 160, yBot, kk);
  return (
    <g>
      <rect x={x - 10} y={yt - 40} width={20} height={yb - yt + 80} rx={6} fill={SG.brass} stroke={INK} strokeWidth={5} />
      {Array.from({length: Math.floor((yb - yt) / 24)}, (_, i) => <path key={i} d={`M ${x - 10} ${yt + i * 24} l 8 0`} stroke={INK} strokeWidth={2} />)}
      {[yt, yb].map((yy, i) => (
        <g key={i}>
          <path d={`M ${x} ${yy - 14} L ${x - 130} ${yy - 14} L ${x - 150} ${yy} L ${x - 130} ${yy + 14} L ${x} ${yy + 14} Z`} fill={SG.brassL} stroke={INK} strokeWidth={5} />
          <circle cx={x} cy={yy} r={12} fill={SG.brass} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {tick > 0.02 && <g transform={`translate(${x + 20 + 40 * clamp01(tick)} ${yb})`}><path d="M 0 0 L 40 -16 L 40 16 Z" fill={SG.paper} stroke={INK} strokeWidth={4} /></g>}
    </g>
  );
};

/** a gear wheel */
const Gear: React.FC<{x: number; y: number; r: number; rot: number; teeth?: number; fill?: string}> = ({x, y, r, rot, teeth = 12, fill = SG.brass}) => {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 ? r : r * 0.82;
    pts.push(`${Math.cos(a) * rr},${Math.sin(a) * rr}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <polygon points={pts.join(' ')} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={0} cy={0} r={r * 0.3} fill={SG.brassD} stroke={INK} strokeWidth={3} />
      <path d={`M ${-r * 0.55} 0 L ${r * 0.55} 0`} stroke={SG.brassD} strokeWidth={4} />
    </g>
  );
};

/** a brass-and-parchment rosette on a pin */
const Rosette: React.FC<{x: number; y: number; k: number; f: number; tails?: number; seed?: number}> = ({x, y, k, f, tails = 1, seed = 1}) => {
  const kk = clamp01(k);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-3} y={-10} width={6} height={44} fill={SG.brassD} stroke={INK} strokeWidth={2} />
      {kk > 0.02 && (
        <g transform={`translate(0 -22) scale(${0.3 + 0.7 * (1 - Math.exp(-6 * kk) * Math.cos(9 * kk))}) rotate(${4 * Math.sin(f / 9 + seed)})`}>
          {Array.from({length: tails}, (_, i) => <path key={i} d={`M ${-6 + i * 8} 10 L ${-12 + i * 8} 56 L ${-2 + i * 8} 48 L ${4 + i * 8} 60 L ${6 + i * 8} 12 Z`} fill={SG.ink} stroke={INK} strokeWidth={2} />)}
          {Array.from({length: 10}, (_, j) => {
            const a = (j / 10) * Math.PI * 2;
            return <circle key={j} cx={Math.cos(a) * 18} cy={Math.sin(a) * 18} r={9} fill={j % 2 ? SG.brassL : SG.paperD} stroke={INK} strokeWidth={2} />;
          })}
          <circle cx={0} cy={0} r={13} fill={SG.paper} stroke={INK} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

/** tussock mounds seen from above, with cast shadows and fireweed buds: the ridge's ground in overhead shots */
const TopTussock: React.FC<{f: number; seed: number; y0: number; y1: number; n?: number}> = ({f, seed, y0, y1, n = 34}) => (
  <g data-band="ok">
    {Array.from({length: n}, (_, i) => {
      const x = h01(seed, i) * 1100 - 10, y = y0 + h01(seed + 1, i) * (y1 - y0), r = 24 + 22 * h01(seed + 2, i);
      return (
        <g key={i} transform={`translate(${x} ${y})`}>
          <ellipse cx={r * 0.35} cy={r * 0.3} rx={r * 1.05} ry={r * 0.8} fill={SG.peat} opacity={0.45} />
          <circle cx={0} cy={0} r={r} fill={i % 3 ? SG.sedge : SG.sedgeD} stroke={INK} strokeWidth={2.5} />
          {Array.from({length: 7}, (_, k) => <path key={k} d={`M 0 0 L ${Math.cos(k * 0.9 + i + Math.sin(f / 30) * 0.1) * r * 0.95} ${Math.sin(k * 0.9 + i) * r * 0.95}`} stroke={SG.sedgeL} strokeWidth={2.5} />)}
          <ellipse cx={-r * 0.3} cy={-r * 0.3} rx={r * 0.35} ry={r * 0.25} fill={SG.sedgeL} opacity={0.7} />
          {i % 5 === 2 && <circle cx={r * 0.5} cy={-r * 0.5} r={6} fill={SG.fireweed} stroke={INK} strokeWidth={2} />}
        </g>
      );
    })}
  </g>
);

// ---- S1: THE STRIKE (bolt on the sealed neck; a TODAY token; a hatched ghost column with a question mark)
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tok = ease(f, b(40), 14);
  const ghost = easeIO(f, b(2), 30);
  return (
    <Frame p={p} z0={1.04} z1={1.0} overlay={<>
          <Plate x={600} text="BY 2100 · HIGH EMISSIONS · PROJECTION · PER AGU" displayLines={['BY 2100 · HIGH EMISSIONS', 'PROJECTION · PER AGU']} y={840} size={28} tone="dark" p={win(f, 10, b(2) - 4)} />
          <Plate x={700} text="ALASKA · TODAY" y={1160} size={24} p={win(f, b(40) + 4, b(2))} />
          <Plate x={600} text="MORE THAN 2X TO NEARLY 7X · PROJECTION · PER AGU" displayLines={['MORE THAN 2X TO NEARLY 7X', 'PROJECTION · PER AGU']} y={600} size={30} tone="lemon" p={win(f, b(2) + 6, b(3))} />
          <Plate x={600} text="UPPER ESTIMATE · NEARLY 7X · PER AGU" displayLines={['UPPER ESTIMATE', 'NEARLY 7X · PER AGU']} y={720} size={30} p={win(f, b(3) + 2)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={1} band={1} flash={charge(f, 6)} raven={940} ravenDuck={6} />
        <Bolt x1={420} y1={640} x2={340} y2={GROUND - 640} p={boltP(f, 6, 24)} seed={3} width={16} />
        <HeldTravel f={f} x={190} y={560} w={300} h={720} mode="sweep" seed={1}>
          <StormGlass f={f} x={340} y={GROUND} s={1.0} emotion={f < 40 ? 'startled' : 'curious'} grow={0.4 + 0.6 * ease(f, 8, 20)} charge={charge(f, 8)}
            squash={f >= 8 && f < 20 ? Math.sin(((f - 8) / 12) * Math.PI) : 0} look={f > b(2) ? 0.6 : f < 30 ? 0.9 : 0} cues={[b(1), b(40), b(2), b(3)]} seed={5} />
        </HeldTravel>
        {tok > 0.01 && (
          <g transform={`translate(0 ${(1 - tok) * -300})`}>
            <RangeColumn f={f} x={720} y={GROUND} w={120} unit={52} lo={2.16} hi={6.94} grow={ghost} floorK={ghost > 0 ? 1 : 0} ghost seed={2} />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S2: WHO MADE IT (a journal sheet slaps onto the easel; a name card darts into the tussock; the glass shows its tag)
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const fly = easeIO(f, b(4) - 18, 20);
  const dart = ease(f, b(5) - 8, 10);
  const turn = ease(f, b(6), 16);
  return (
    <Frame p={p} z0={1.0} z1={1.06} overlay={<>
          <Plate x={700} text="EARTH'S FUTURE · NOVEMBER 24TH" y={600} size={30} p={win(f, b(4) + 4, b(5))} />
          <Plate x={600} text="ANDREAS KRAUSE · TECHNICAL UNIVERSITY OF MUNICH" displayLines={['ANDREAS KRAUSE', 'TECHNICAL UNIVERSITY OF MUNICH']} y={690} size={28} p={win(f, b(5) + 4, b(6))} />
          <Plate x={540} text="A MACHINE LEARNING MODEL · XGBOOST" y={920} size={30} tone="dark" p={win(f, b(6) + 4)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={2} band={0.95} raven={70} ravenDuck={b(5) - 4} />
        <Easel x={720} y={GROUND} f={f} jump={f >= b(4) && f < b(4) + 8 ? 1 : 0}>
          <g transform={`translate(${lerp(500, 0, fly)} ${lerp(-120, 0, fly)}) rotate(${lerp(40, 0, fly)})`}>
            <Sheet x={0} y={-470} w={240} h={300} title="EARTH'S FUTURE" rows={7} f={f} />
          </g>
        </Easel>
        <NameCard x={930} y={GROUND + 40} text="KRAUSE" f={f} drop={dart} />
        <HeldTravel f={f} x={160} y={600} w={300} h={680} mode="sweep" seed={2}>
          <StormGlass f={f} x={320} y={GROUND} s={0.95} emotion={turn > 0.5 ? 'curious' : 'calm'} look={lerp(0.2, 1, turn)} cues={[b(4), b(5), b(6)]} seed={6} />
        </HeldTravel>
        {turn > 0.02 && (
          <Lab x={380} y={GROUND - 497} rot={10 * Math.sin(f / 7) * (1 - turn * 0.5)} text="ML MODEL" size={16} fill={SG.brassL} />
        )}
      </SVG>
    </Frame>
  );
};

// ---- S3: SIX READINGS IN (instruments tick, taps open, the envelope skids in a pace away, strike marks tap into a tile)
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tap = easeIO(f, b(7), 24);
  const env = easeIO(f, b(10) - 10, 16);
  const marks = clamp01((f - b(8)) / 40);
  return (
    <Frame p={p} z0={1.0} z1={1.07} overlay={<>
          <Plate x={540} text="TEMPERATURE · RAIN · HUMIDITY · PRESSURE · WIND · SUN" displayLines={['TEMPERATURE · RAIN · HUMIDITY', 'PRESSURE · WIND · SUN']} y={600} size={28} p={win(f, b(7) + 4, b(10) + 30)} />
          <Plate x={360} text="ML LIGHTNING MODELS · IN GENERAL" y={1200} size={22} p={win(f, b(10) + 4)} />
          <Plate x={760} text="CLOUD-TO-GROUND LIGHTNING · HALF-DEGREE GRID" displayLines={['CLOUD-TO-GROUND LIGHTNING', 'HALF-DEGREE GRID']} y={710} size={26} tone="dark" p={win(f, b(8) + 4)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={3} band={0.9} raven={1010} />
        <Plank x={540} y={1250} w={1000} />
        {INSTR.map((k, i) => <Instrument key={k} x={120 + i * 168} y={1216} kind={k} f={f} tick={clamp01(tap * 6 - i)} />)}
        <HeldTravel f={f} x={300} y={360} w={480} h={880} mode="sweep" seed={3}>
          <StormGlass f={f} x={540} y={1216} s={1.45} emotion="curious" grow={0.45 + 0.4 * tap} taps={tap} cues={[b(7), b(10), b(8)]} seed={7} label={false} />
        </HeldTravel>
        <g transform={`translate(${lerp(-300, 0, env)} 0)`}>
          <Envelope f={f} x={170} y={1290} scale={0.55} lines={['ML LIGHTNING MODELS']} rot={-4 + 6 * (1 - env)} />
        </g>
        <g transform="translate(860 1180)">
          <path d="M -108 -60 L 132 -60 L 108 50 L -132 50 Z" fill={SG.sedge} stroke={INK} strokeWidth={4} />
          {Array.from({length: 3}, (_, i) => <path key={i} d={`M ${-60 + i * 60} -60 L ${-80 + i * 60} 50`} stroke={INK} strokeWidth={1.6} opacity={0.6} />)}
          <path d="M -130 -5 L 110 -5" stroke={INK} strokeWidth={1.6} opacity={0.6} />
          {Array.from({length: Math.floor(marks * 9)}, (_, i) => {
            const mx = -95 + h01(8, i) * 170, my = -45 + h01(9, i) * 80;
            return <path key={i} d={`M ${mx - 4} ${my - 9} L ${mx + 4} ${my - 1} L ${mx - 1} ${my - 1} L ${mx + 5} ${my + 9}`} stroke={SG.lemon} strokeWidth={4.5} fill="none" />;
          })}
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S4: SEALED IN 2019 (from above: a brass stamp hovers, then presses 2019 into the wax)
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const hover = easeIO(f, b(46), 20);
  const t = f - b(9);
  const press = t < -6 ? 0 : t < 0 ? (t + 6) / 6 : t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 14);
  const stamped = t >= 0;
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.05, 1.12, easeIO(fr, 0, p.dur)), fx: 540, fy: 900})} overlay={<>
          <Plate x={540} text="ONE YEAR OF OBSERVATIONS" y={1230} size={30} p={win(f, b(46) + 6, b(9))} />
          <Plate x={540} text="TRAINED ON 2019 · PER AGU" y={1150} size={34} tone="dark" p={win(f, b(9) + 4)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={4} band={0.85} />
        <StormGlass f={f} x={540} y={2080} s={2.25} emotion="calm" seal={stamped ? '2019' : 'plain'} sealGlow={stamped ? 0.4 : 0} grow={0.8} cues={[b(46), b(9)]} seed={8} label={false}
          squash={t >= 0 && t < 8 ? 0.4 : 0} />
        <g transform={`translate(540 ${lerp(300, 560, hover) + press * 180})`}>
          <HandStamp x={0} y={0} s={1.1} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S5: TODAY'S ALASKA (a chalked true outline cut into the tundra seen low and oblique; a TODAY token drops in)
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cut = easeIO(f, b(11), 40);
  const tok = ease(f, b(12) - 8, 14);
  const fit = {x: 110, y: 640, w: 860};
  const [cx, cy] = akProject(-150, 64.5, fit);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.1, easeIO(fr, 0, p.dur)), fx: 540, fy: lerp(900, 960, easeIO(fr, 0, p.dur))})} overlay={<>
          <Plate x={540} text="ALASKA · TODAY'S CLIMATE" y={580} size={30} p={win(f, b(11) + 6, b(12))} />
          <Plate x={540} text="MOST OF ALASKA · UNDER 1 STRIKE PER SQ KM A YEAR · 1995 TO 2014 · PER AGU" displayLines={['MOST OF ALASKA', 'UNDER 1 STRIKE PER SQ KM A YEAR', '1995 TO 2014 · PER AGU']} y={1180} size={26} p={win(f, b(12) + 4)} />
        </>}>
      <SVG>
        <rect x={-80} y={-80} width={1240} height={2080} fill={SG.sedge} data-band="ok" />
        <rect x={-80} y={-80} width={1240} height={560} fill={SG.mauve} />
        <Thunderhead f={f} x={540} y={520} w={1100} seed={5} />
        <g transform="translate(540 960) scale(1 0.62) translate(-540 -960)">
          {Array.from({length: 60}, (_, i) => <ellipse key={i} cx={h01(11, i) * 1080} cy={500 + h01(12, i) * 1000} rx={20 + 20 * h01(13, i)} ry={10} fill={SG.sedgeL} opacity={0.5} />)}
          <g opacity={cut}>
            <HeldTravel f={f} x={110} y={640} w={860} h={520} mode="sweep" seed={51}><g><AlaskaOutline x={fit.x} y={fit.y} w={fit.w} fill={SG.sedgeD} stroke={SG.paperD} strokeWidth={14} shadow={14} shadowColor={SG.peat} /><AlaskaOutline x={fit.x} y={fit.y} w={fit.w} fill="none" stroke={SG.paper} strokeWidth={6} shadow={0} opacity={0.9} /></g></HeldTravel>
          </g>
        </g>
        <TopTussock f={f} seed={61} y0={1480} y1={1900} n={22} />
        <StormGlass f={f} x={130} y={1300} s={0.5} emotion="curious" look={1} cues={[b(11), b(12)]} seed={9} label={false} seal="2019" />
        {tok > 0.01 && (
          <g transform={`translate(${cx} ${960 + (cy - 960) * 0.62 + (1 - tok) * -400})`}>
            <ContactShadow cx={0} cy={4} rx={60} ry={10} opacity={0.4} />
            <StrikeToken x={0} y={-22} w={120} today />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S6: THE RANGE (a hatched range column racks up; the WORLD column overlaps Alaska's floor; the glass and seal behind)
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const floor = easeIO(f, b(13), 18);
  const grow = easeIO(f, b(14) - 6, 50);
  const world = easeIO(f, b(15), 20);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.06, easeIO(fr, 0, p.dur)), fx: 540, fy: lerp(1000, 900, grow)})} overlay={<>
          <Plate x={560} text="PROJECTION · HIGH EMISSIONS · PER AGU" y={1230} size={28} p={win(f, b(13) + 4, b(14))} />
          <Plate x={760} text="ALASKA · +116% TO +594% · PROJECTION · HIGH EMISSIONS · PER AGU" displayLines={['ALASKA · +116% TO +594%', 'PROJECTION · HIGH EMISSIONS', 'PER AGU']} y={600} size={26} tone="lemon" p={win(f, b(14) + 6, b(15))} />
          <Plate x={760} text="WORLD · +76% TO +140% · HIGH EMISSIONS" displayLines={['WORLD · +76% TO +140%', 'HIGH EMISSIONS']} y={760} size={26} p={win(f, b(15) + 4, b(41))} />
          <Plate x={700} text="BOTH · PROJECTION · HIGH EMISSIONS" y={880} size={24} tone="dark" p={win(f, b(41) + 4)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={6} band={0.8} />
        <Envelope f={f} x={1000} y={GROUND + 40} scale={0.3} lines={['ML LIGHTNING MODELS']} rot={-6} />
        <StormGlass f={f} x={930} y={GROUND - 30} s={0.6} emotion="surprised" seal="2019" sealGlow={0.3 + 0.7 * grow} look={-1} cues={[b(13), b(14), b(15)]} seed={10} label={false} />
        <HeldProp f={f} px={300} py={GROUND} w={160} h={420} seed={2} kind="rest" gain={2}>
          <RangeColumn f={f} x={300} y={GROUND} w={150} unit={56} lo={2.16} hi={6.94} floorK={floor} grow={grow} seed={3} label="ALASKA" />
        </HeldProp>
        {world > 0.01 && (
          <g transform={`translate(${lerp(400, 0, world)} 0)`}>
            <RangeColumn f={f} x={500} y={GROUND} w={110} unit={56} lo={1.76} hi={2.4} grow={1} seed={4} label="WORLD" />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S7: FIRE COUNTRY (ten ledger posts knock up; a true-scale unplaced swatch of 2022's burn on a survey sheet)
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const FILL = [0.99, 0.98, 0.99, 0.93, 0.98, 1.0, 0.96, 0.99, 0.99, 0.99];
  const sheet = easeIO(f, b(17), 26);
  const mapW = 360;
  const sw = Math.sqrt(0.0073 * 0.36 * mapW * akHeight(mapW));
  return (
    <Frame p={p} z0={1.0} z1={1.06} overlay={<>
          <Plate x={540} text="LIGHTNING FIRES · 93% TO 100% OF ACRES BURNED · 2015 TO 2024 · AK DIV. OF FORESTRY" displayLines={['LIGHTNING FIRES', '93% TO 100% OF ACRES BURNED', '2015 TO 2024 · AK DIV. OF FORESTRY']} y={600} size={26} p={win(f, b(16) + 6, b(17))} />
          <Plate x={540} text="2022 · ABOUT 3.1 MILLION ACRES · 99% LIGHTNING" displayLines={['2022 · ABOUT 3.1 MILLION ACRES', '99% LIGHTNING']} y={1210} size={28} tone="dark" p={win(f, b(17) + 8)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={7} band={0.75} trees={1.25} />
        <StormGlass f={f} x={540} y={GROUND - 210} s={0.28} emotion="worried" seal="2019" cues={[b(16), b(17)]} seed={11} label={false} />
        {FILL.map((fl, i) => (
          <LedgerPost key={i} x={100 + i * 98} y={GROUND + 30} h={300 + 20 * h01(14, i)} fill={fl} year={`${2015 + i}`} rise={ease(f, b(16) + i * 4, 14)} />
        ))}
        {sheet > 0.01 && (
          <g transform={`translate(540 ${lerp(1400, 880, sheet)}) rotate(${-3 + 3 * Math.sin(f / 21)})`}>
            <rect x={-230} y={-170} width={460} height={300} fill={SG.paper} stroke={INK} strokeWidth={5} />
            <AlaskaOutline x={-210} y={-150} w={mapW} fill={SG.paperD} stroke={INK} strokeWidth={2.5} shadow={0} />
            <rect x={150} y={-40} width={sw} height={sw} fill={SG.apricot} stroke={INK} strokeWidth={2.5} />
            <text x={150 + sw / 2} y={-52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={INK}>TO SCALE</text>
            <text x={170} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={12} fill={INK}>NOT LOCATED</text>
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S8: ONLY LIGHTNING (the glass turns to the anvil; THE STUDY DIDN'T MODEL FIRE stamps the easel; a far spark)
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const st = f - b(18);
  const stampOn = st >= 0;
  return (
    <Frame p={p} z0={1.0} z1={1.07} overlay={<>
          <Plate x={540} text="THE STUDY DIDN'T MODEL FIRE" y={600} size={34} tone="dark" p={win(f, b(18) + 6, b(19) + 40)} />
          <Plate x={680} text="THE STUDY · LIGHTNING ONLY" y={700} size={30} p={win(f, b(19) + 6)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={8} band={0.7} raven={1000} ravenDuck={b(19)} flash={charge(f, b(19))} />
        <Bolt x1={860} y1={720} x2={850} y2={GROUND - 210} p={boltP(f, b(19) - 2, 26)} seed={9} width={10} branches={1} />
        {f >= b(19) && <circle cx={850} cy={GROUND - 210} r={10 + 4 * Math.sin(f / 2)} fill={SG.lemon} opacity={clamp01(1 - (f - b(19)) / 60)} />}
        <Easel x={680} y={GROUND} f={f} jump={st >= 0 && st < 8 ? 1 : 0}>
          {stampOn && <g transform={`translate(0 -330) rotate(-6) scale(${1 + 0.3 * Math.exp(-st / 4)})`}><rect x={-120} y={-34} width={240} height={68} rx={8} fill={SG.paper} stroke={INK} strokeWidth={5} /><text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>NO FIRE</text></g>}
        </Easel>
        <HeldTravel f={f} x={160} y={620} w={300} h={660} mode="sweep" seed={8}>
          <StormGlass f={f} x={300} y={GROUND} s={0.9} emotion="calm" seal="2019" look={lerp(-0.8, 0.8, easeIO(f, 0, 30))} cues={[b(18), b(19)]} seed={12} />
        </HeldTravel>
        <Envelope f={f} x={150} y={GROUND + 70} scale={0.4} lines={['ML LIGHTNING MODELS']} rot={-6} />
      </SVG>
    </Frame>
  );
};

// ---- S9: SURPRISED (from above: a slip on Krause's name card types out the quote; the glass far behind goes still)
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const type = clamp01((f - b(20)) / 40);
  const QUOTE = '"QUITE SURPRISED"';
  const shown = QUOTE.slice(0, Math.floor(type * QUOTE.length));
  const ROWS = ['"QUITE', 'SURPRISED"'];
  let left = shown.length;
  const rows = ROWS.map((r) => { const k = Math.max(0, Math.min(r.length, left)); left -= r.length + 1; return r.slice(0, k); });
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.08, easeIO(fr, 0, p.dur)), fx: 540, fy: 960})} overlay={<>
          <Plate x={540} text={'"I WAS QUITE SURPRISED THAT THE PROJECTIONS WERE SO HIGH." · ANDREAS KRAUSE · PER AGU'} displayLines={['"I WAS QUITE SURPRISED THAT', 'THE PROJECTIONS WERE SO HIGH."', 'ANDREAS KRAUSE · PER AGU']} y={1190} size={26} p={win(f, b(20) + 74)} />
          <Plate x={540} text="ANDREAS KRAUSE · LEAD AUTHOR" y={600} size={30} tone="dark" p={win(f, b(21) + 4)} />
        </>}>
      <SVG>
        <rect x={-80} y={-80} width={1240} height={2080} fill={SG.sedge} data-band="ok" />
        <rect x={-80} y={-80} width={1240} height={500} fill={SG.mauve} />
        <path d="M -80 420 Q 300 380 600 410 Q 860 430 1160 400 L 1160 520 L -80 520 Z" fill={SG.plumL} stroke={INK} strokeWidth={4} />
        <StormGlass f={f} x={880} y={760} s={0.45} emotion="calm" seal="2019" sealGlow={0.3} qtag={ease(f, b(21), 14)} grow={1} cues={[b(20), b(21)]} seed={13} label={false} />
        <Thunderhead f={f} x={480} y={330} w={1000} seed={9} />
        <TopTussock f={f} seed={62} y0={560} y1={1900} n={46} />
        <HeldTravel f={f} x={240} y={640} w={600} h={460} mode="shadow" seed={52}>
        <g transform={`translate(540 900) rotate(${-4 + 1.5 * Math.sin(f / 13)})`}>
          <ContactShadow cx={20} cy={30} rx={300} ry={40} opacity={0.35} />
          <rect x={-10} y={-40} width={20} height={240} fill={SG.woodD} stroke={INK} strokeWidth={4} />
          <rect x={-200} y={-200} width={400} height={64} rx={6} fill={SG.paper} stroke={INK} strokeWidth={5} />
          <text x={0} y={-158} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={INK}>KRAUSE</text>
          <rect x={-280} y={-120} width={560} height={200} rx={6} fill={SG.paper} stroke={INK} strokeWidth={5} />
          <rect x={-30} y={-134} width={60} height={26} rx={5} fill={SG.brass} stroke={INK} strokeWidth={4} />
          {rows.map((r, i) => <text key={i} x={-240} y={-34 + i * 76} fontFamily={MONO} fontWeight={900} fontSize={64} fill={INK}>{r}</text>)}
          
        </g>
        </HeldTravel>
      </SVG>
    </Frame>
  );
};

// ---- S10: THE DIAL (backward to 12 over a sepia strip; EARLIER STUDIES band; the swing past it; the seal glows hot)
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const back = easeIO(f, b(22), 30);
  let v = lerp(22, 12, back);
  const settle = f > b(23) ? 1.2 * Math.exp(-(f - b(23)) / 8) * Math.sin((f - b(23)) / 2) : 0;
  v += settle;
  const anticip = f >= b(25) - 6 && f < b(25) ? -((f - (b(25) - 6)) / 6) * 2 : 0;
  const swing = easeIO(f, b(25), 14);
  v = lerp(v + anticip, 30, swing);
  if (f > b(25) + 14) v = 30 + 1.4 * Math.exp(-(f - b(25) - 14) / 9) * Math.sin((f - b(25) - 14) / 2.2);
  const band = easeIO(f, b(24), 16);
  const strip = easeIO(f, b(22), 24);
  return (
    <Frame p={p} cam={(fr) => ({z: fr < b(24) ? lerp(1.0, 1.04, easeIO(fr, 0, b(24))) : 1.04 + 0.02 * easeIO(fr, b(24), 60), fx: fr < b(24) ? 540 : lerp(540, 560, easeIO(fr, b(24), 24)), fy: fr < b(24) ? 960 : lerp(960, 1080, easeIO(fr, b(24), 24))})} overlay={<>
          <Plate x={540} text="1900S · MODEL ESTIMATE · ABOUT +11%" y={580} size={30} p={win(f, b(22) + 6, b(23))} />
          <Plate x={540} text="ABOUT 12% PER °C" y={650} size={34} tone="dark" p={win(f, b(23) + 4, b(24) + 50)} />
          <Plate x={540} text="EARLIER STUDIES · 8% TO 17% PER °C" y={720} size={28} p={win(f, b(24) + 6, b(25))} />
          <Plate x={540} text="RUN FORWARD · NEARLY 3X ITS OWN 12 · ABOUT 30% PER °C · COULD" displayLines={['RUN FORWARD · NEARLY 3X ITS OWN 12', 'ABOUT 30% PER °C · COULD']} y={810} size={30} tone="lemon" p={win(f, b(25) + 4)} />
          <Plate x={800} text="FUTURE RUNS · PER AGU" y={1110} size={22} p={win(f, b(26) + 2)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={10} band={0.6} />
        <Plank x={540} y={1250} w={1000} />
        <g transform={`translate(${f >= b(22) && f < b(22) + 24 ? Math.sin(f * 1.7) * 5 : 0} 0)`}><Envelope f={f} x={150} y={1200} scale={0.34} lines={['ML LIGHTNING MODELS']} rot={-8} /></g>
        {strip > 0.01 && (
          <g>
            <rect x={540 - 420 * strip} y={1284} width={840 * strip} height={40} fill={SG.sepia} stroke={INK} strokeWidth={4} />
            {Array.from({length: Math.floor(14 * strip)}, (_, i) => <path key={i} d={`M ${540 - 400 * strip + i * 60} 1304 q 15 -12 30 0 q 15 12 30 0`} stroke={SG.peat} strokeWidth={3} fill="none" />)}
            <text x={150} y={1312} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK} opacity={strip * (1 - easeIO(f, b(25) - 6, 8))}>1900S</text>
          </g>
        )}
        <HeldTravel f={f} x={230} y={920} w={540} h={360} mode="sweep" seed={53}><SensDial f={f} x={500} y={1230} r={240} value={v} band={[8, 17]} bandK={band} jump={f >= b(25) + 10 && f < b(25) + 20 ? 1 : 0} /></HeldTravel>
        <StormGlass f={f} x={940} y={1216} s={0.55} emotion={swing > 0.5 ? 'worried' : 'curious'} seal="2019" qtag={1} sealGlow={lerp(0.2, 1, easeIO(f, b(26), 20))} grow={lerp(0.6, 1, easeIO(f, b(26), 30))} cues={[b(22), b(25), b(26)]} seed={14} label={false} />
      </SVG>
    </Frame>
  );
};

// ---- S11: DIFFERENT MATH (from straight above: the housing opens on two gear trains; the quote drops on chains)
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const open = easeIO(f, b(39), 24);
  const spinA = f * 2.2, spinB = f * 6.4;
  const fan = easeIO(f, b(28), 30);
  const cntA = Math.min(17, Math.floor(8 + 9 * clamp01((f - b(27)) / 10)));
  const cntB = Math.min(30, Math.floor(30 * clamp01((f - b(27)) / 10)));
  const chain = ease(f, b(28) - 4, 16);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.08, 1.0, easeIO(fr, 0, p.dur)), fx: 540, fy: 960})} overlay={<>
          <Plate x={540} text="EARLIER STUDIES' MATH · THIS STUDY'S MATH" y={530} size={22} p={win(f, b(39) + 10, b(27))} />
          <Plate x={540} text="EARLIER STUDIES DIFFER MOSTLY IN MATH · PER AGU" displayLines={['EARLIER STUDIES DIFFER', 'MOSTLY IN MATH · PER AGU']} y={630} size={24} tone="dark" p={win(f, b(27) + 4, b(28))} />
          <Plate x={540} text={'"QUITE A LARGE UNCERTAINTY" · ANDREAS KRAUSE · PER AGU'} displayLines={['"QUITE A LARGE UNCERTAINTY"', 'ANDREAS KRAUSE · PER AGU']} y={1250} size={30} p={win(f, b(28) + 6)} />
        </>}>
      <SVG>
        <rect x={-80} y={-80} width={1240} height={2080} fill="#8A6A44" data-band="ok" />
        {Array.from({length: 12}, (_, i) => <path key={i} d={`M -80 ${i * 170} Q 540 ${i * 170 + 30} 1160 ${i * 170}`} stroke="#6E5236" strokeWidth={4} fill="none" data-band="ok" />)}
        <rect x={-80} y={1460} width={1240} height={500} fill="#7A5C3A" data-band="ok" />
        <g transform="translate(990 1150) rotate(90)"><StormGlass f={f} x={0} y={0} s={0.4} emotion="curious" seal="2019" sealGlow={0.6} qtag={f < b(27) + 10 ? 1 : 0} cues={[b(39), b(27)]} seed={19} label={false} /></g>
        {Array.from({length: 8}, (_, i) => <path key={i} d={`M -80 ${1500 + i * 56} Q 540 ${1520 + i * 56} 1160 ${1500 + i * 56}`} stroke="#5E452B" strokeWidth={4} fill="none" data-band="ok" />)}
        <HeldTravel f={f} x={140} y={580} w={800} h={740} mode="sweep" seed={54}>
        <g transform="translate(540 960)">
          <ContactShadow cx={14} cy={20} rx={420} ry={80} opacity={0.35} />
          <rect x={-400} y={-380} width={800} height={740} rx={40} fill={SG.brassD} stroke={INK} strokeWidth={8} />
          <rect x={-370} y={-350} width={740} height={680} rx={30} fill="#2A2230" stroke={INK} strokeWidth={5} />
          <path d="M -360 0 L 360 0" stroke={SG.sepia} strokeWidth={30} opacity={0.9} />
          <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>DIFFERENT MATH · PER AGU</text>
          <g>
            <Gear x={-200} y={-160} r={90} rot={spinA} />
            <Gear x={-80} y={-210} r={50} rot={-spinA * 1.8} />
            <Gear x={-200} y={170} r={0} rot={0} />
            <Gear x={170} y={-170} r={80} rot={spinB} fill={SG.brassL} />
            <Gear x={280} y={-110} r={44} rot={-spinB * 1.8} fill={SG.brassL} />
            <Gear x={110} y={-60} r={36} rot={-spinB * 2.2} fill={SG.brassL} />
          </g>
          {open > 0.9 && <Lab x={-200} y={-50} text="EARLIER STUDIES" size={20} />}
          {open > 0.9 && <Lab x={190} y={-50} text="THIS STUDY" size={20} />}
          <g transform="translate(-200 170)"><rect x={-110} y={-44} width={220} height={88} rx={10} fill={SG.paper} stroke={INK} strokeWidth={5} /><text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={40} fill={INK}>{f >= b(27) ? `8 TO ${cntA}` : '--'}</text></g>
          <g transform="translate(190 170)"><rect x={-110} y={-44} width={220} height={88} rx={10} fill={SG.paper} stroke={INK} strokeWidth={5} /><text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={44} fill={INK}>{f >= b(27) ? `${cntB}` : '--'}</text></g>
          {fan > 0.01 && <path d={`M 0 300 L ${-320 * fan} 360 L ${320 * fan} 360 Z`} fill={INK} opacity={0.3 * fan} />}
          <g transform={`translate(0 ${-380}) scale(1 ${Math.cos(open * Math.PI * 0.5)}) translate(0 380)`}>
            {open < 0.98 && <rect x={-400} y={-380} width={800} height={740} rx={40} fill={SG.brass} stroke={INK} strokeWidth={8} />}
            {open < 0.6 && <text x={0} y={0} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={40} fill={INK}>% PER °C</text>}
          </g>
        </g>
        </HeldTravel>
        {chain > 0.01 && (
          <ChainHang x={540} y={lerp(300, 1020, chain)} rot={6 * Math.sin(f / 7) * chain} />
        )}
      </SVG>
    </Frame>
  );
};

// ---- S12: THE TWIST (the envelope trembles; a satellite-data track unrolls; the sleepy AVERAGE ruler wins; the glass outside the rail)
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const unroll = easeIO(f, b(43), 26);
  const race = clamp01((f - b(43) - 20) / 120);
  const won = f > b(30) + 20;
  const trem = f >= b(29) && f < b(29) + 30 ? Math.sin(f * 1.6) * 4 : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.05} overlay={<>
          <Plate x={540} text="PREPRINT · OCTOBER 17TH · KRAUSE AND RAMMIG" displayLines={['PREPRINT · OCTOBER 17TH', 'KRAUSE AND RAMMIG']} y={600} size={28} p={win(f, b(29) + 4, b(43))} />
          <Plate x={540} text="ML LIGHTNING MODELS IN GENERAL · PREPRINT" y={700} size={26} p={win(f, b(43) + 6, b(30))} />
          <Plate x={540} text="SIMPLE AVERAGE · BEAT THE ML MODELS · PREPRINT · ON SATELLITE DATA" displayLines={['SIMPLE AVERAGE · BEAT THE ML MODELS', 'PREPRINT · ON SATELLITE DATA']} y={800} size={28} tone="dark" p={win(f, b(30) + 6)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={12} band={0.5} raven={1010} />
        {unroll > 0.01 && (
          <g>
            <path d={`M ${900 - 900 * unroll} 1120 L 1000 1120 L 1060 1250 L ${840 - 900 * unroll} 1250 Z`} fill="#3E4A52" stroke={INK} strokeWidth={5} />
            {[1150, 1185, 1220].map((yy) => <path key={yy} d={`M ${900 - 900 * unroll} ${yy} L 1020 ${yy}`} stroke={SG.paper} strokeWidth={2.5} strokeDasharray="16 12" />)}
            <rect x={980} y={1110} width={14} height={150} fill={SG.paper} stroke={INK} strokeWidth={3} />
            <g opacity={unroll}><rect x={826} y={1050} width={148} height={34} rx={4} fill="#22302F" stroke={INK} strokeWidth={3} /><rect x={896} y={1084} width={8} height={36} fill={SG.woodD} /><text x={900} y={1073} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={SG.paper}>SATELLITE DATA</text></g>
            {Array.from({length: 9}, (_, i) => <rect key={i} x={140 + i * 100} y={1270} width={8} height={40} fill={SG.woodD} stroke={INK} strokeWidth={2} />)}
            <path d="M 120 1280 L 1060 1280" stroke={SG.woodD} strokeWidth={6} />
          </g>
        )}
        {[0, 1, 2].map((i) => {
          const stall = clamp01((race - 0.35 - i * 0.12) * 4);
          const xr = 220 + 520 * Math.min(race * 1.4, 0.55 + i * 0.05);
          return unroll > 0.5 ? <ModelRacer key={i} f={f} x={xr} y={1175 + i * 30} s={1.0} run={1 - stall} stall={stall} seed={i + 1} tint={[SG.mauveL, SG.lilac, SG.glassD][i]} /> : null;
        })}
        {unroll > 0.5 && <HeldTravel f={f} x={300} y={1180} w={700} h={110} mode="sweep" seed={59}><AverageRuler f={f} x={lerp(380, 820, clamp01((f - b(30) + 30) / 50))} y={1236} s={0.75} emotion={won ? 'smug' : 'sleepy'} cues={[b(43), b(30)]} seed={21} /></HeldTravel>}
        <HeldTravel f={f} x={60} y={GROUND - 60} w={220} h={160} mode="shadow" seed={60}><g transform={`translate(${trem} 0)`}><Envelope f={f} x={170} y={GROUND + 20} scale={0.38} lines={['ML LIGHTNING MODELS']} open={f >= b(29) ? 0.08 : 0} rot={-6} /></g></HeldTravel>
      </SVG>
    </Frame>
  );
};

// ---- S13: THE ADVICE (the envelope tears open; the card rises onto a stake; a cord ties the stake to the sealed neck)
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tear = easeIO(f, b(31), 14);
  const rise = ease(f, b(31) + 8, 22);
  const cord = easeIO(f, b(32) - 6, 20);
  const card = {x: 760, y: 1000};
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.08, easeIO(fr, 0, p.dur)), fx: 560, fy: 940})} overlay={<>
          <Plate x={660} text="TEST OUTSIDE THE TRAINING DATA · PREPRINT · NOT PEER REVIEWED" displayLines={['TEST OUTSIDE THE TRAINING DATA', 'PREPRINT · NOT PEER REVIEWED']} y={600} size={26} tone="dark" p={win(f, b(31) + 14)} />
          <Plate x={660} text="OUR READ · THE RANGE WAITS ON A TEST" y={730} size={24} p={win(f, b(32) + 4)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={13} band={0.45} />
        <HeldTravel f={f} x={170} y={560} w={260} h={700} mode="sweep" seed={55}><StormGlass f={f} x={300} y={GROUND} s={1.0} emotion="determined" seal="2019" sealGlow={0.4} look={1} cues={[b(31), b(32)]} seed={16} /></HeldTravel>
        <Envelope f={f} x={660} y={GROUND + 40} scale={0.6} lines={['ML LIGHTNING MODELS']} open={tear} rot={-3} />
        {rise > 0.01 && (
          <g>
            <rect x={card.x - 6} y={lerp(GROUND, card.y + 60, rise)} width={12} height={GROUND - lerp(GROUND, card.y + 60, rise) + 10} fill={SG.woodD} stroke={INK} strokeWidth={3} />
            <TestCard x={card.x} y={lerp(GROUND, card.y, rise)} rot={(1 - rise) * 180 + 2 * Math.sin(f / 11)} />
          </g>
        )}
        {cord > 0.01 && <path d={`M ${card.x - 150} ${card.y - 60} L ${card.x + 150} ${card.y - 60} L ${lerp(card.x, 360, cord) + 40} ${GROUND - 520} L ${lerp(card.x, 360, cord) - 120} ${GROUND - 520} Z`} fill={SG.plum} opacity={0.32 * cord} />}
      </SVG>
    </Frame>
  );
};

// ---- S14: IN FAIRNESS (four empty pins on a plank; one rosette for the regression, three for the formulas)
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pins = ease(f, b(33), 14);
  return (
    <Frame p={p} z0={1.0} z1={1.06} overlay={<>
          <Plate x={680} text="BEAT A REGRESSION + 3 EXISTING FORMULAS · PER THE PAPER" displayLines={['BEAT A REGRESSION', '+ 3 EXISTING FORMULAS · PER THE PAPER']} y={600} size={24} p={win(f, b(33) + 6, b(47))} />
          <Plate x={680} text="1 REGRESSION" y={710} size={30} tone="dark" p={win(f, b(47) + 4, b(44))} />
          <Plate x={680} text="3 EXISTING FORMULAS · PER THE PAPER" y={800} size={24} tone="dark" p={win(f, b(44) + 4)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={14} band={0.4} />
        <HeldTravel f={f} x={100} y={560} w={400} h={720} mode="sweep" seed={14}>
          <StormGlass f={f} x={300} y={GROUND - 40} s={1.05} emotion="calm" seal="2019" look={0} cues={[b(33), b(47), b(44)]} seed={17} />
        </HeldTravel>
        <Plank x={540} y={1290} w={900} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} opacity={pins} transform={`translate(0 ${(1 - pins) * 30})`}>
            <Rosette x={240 + i * 200} y={1250} k={i === 0 ? ease(f, b(47), 14) : ease(f, b(44) + (i - 1) * 6, 14)} f={f} tails={1} seed={i} />
          </g>
        ))}
      </SVG>
    </Frame>
  );
};

// ---- S15: READ IT AS A RANGE (the caliper's jaws on floor and ceiling; a tick at the low end; a storm wall on the horizon)
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cal = easeIO(f, b(34), 22);
  const tick = ease(f, b(35), 12);
  const wall = easeIO(f, b(36) - 10, 40);
  const unit = 56, base = GROUND;
  return (
    <Frame p={p} z0={1.0} z1={1.05} overlay={<>
          <Plate x={540} text="ALASKA · +116% TO +594% · PROJECTION · PER AGU" displayLines={['ALASKA · +116% TO +594%', 'PROJECTION · PER AGU']} y={560} size={28} tone="lemon" p={win(f, b(34) + 6, b(35))} />
          <Plate x={540} text="LOW END · MORE THAN 2X · PROJECTION · HIGH EMISSIONS · PER AGU" displayLines={['LOW END · MORE THAN 2X', 'PROJECTION · HIGH EMISSIONS · PER AGU']} y={680} size={28} p={win(f, b(35) + 4, b(36))} />
          <Plate x={540} text="OUR READ · THE WHOLE RANGE AWAITS AN OUT-OF-SAMPLE TEST" displayLines={['OUR READ · THE WHOLE RANGE', 'AWAITS AN OUT-OF-SAMPLE TEST']} y={800} size={26} tone="dark" p={win(f, b(36) + 6)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={15} band={0.25} wall={wall} />
        <StormGlass f={f} x={150} y={GROUND} s={0.55} emotion="curious" seal="2019" look={wall > 0.3 ? 1 : -1} cues={[b(34), b(36)]} seed={18} label={false} />
        <HeldTravel f={f} x={420} y={860} w={160} h={400} mode="sweep" seed={56}><RangeColumn f={f} x={500} y={base} w={150} unit={unit} lo={2.16} hi={6.94} seed={6} label="ALASKA" /></HeldTravel>
        <Caliper x={720} yTop={base - unit * 6.94} yBot={base - unit * 2.16} k={cal} tick={tick} />
      </SVG>
    </Frame>
  );
};

// ---- S16: WHO RUNS IT (from above: the map takes strike marks statewide, densest Southwest; then the frame-one ridge)
const S16: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cut = f >= b(38) - 12;
  const fit = {x: 90, y: 640, w: 900};
  const n = Math.floor(clamp01((f - b(37)) / 140) * 260);
  const marks = [] as React.ReactNode[];
  for (let i = 0; i < n; i++) {
    const sw = h01(41, i) < 0.62;
    const lon = sw ? -165 + h01(42, i) * 9 : -160 + h01(43, i) * 20;
    const lat = sw ? 58.5 + h01(44, i) * 5 : 60 + h01(45, i) * 9;
    const [mx, my] = akProject(lon, lat, fit);
    marks.push(<path key={i} d={`M ${mx - 3} ${my - 7} L ${mx + 3} ${my - 1} L ${mx - 1} ${my - 1} L ${mx + 4} ${my + 7}`} stroke={SG.lemon} strokeWidth={3} fill="none" />);
  }
  if (!cut) {
    return (
      <Frame p={p} cam={(fr) => ({z: lerp(1.12, 1.0, easeIO(fr, 0, p.dur)), fx: 520, fy: 980})} overlay={<>
            <Plate x={540} text="JUNE 23RD, 2024 · AK DIV. OF FORESTRY" y={660} size={30} p={win(f, b(37) + 6, b(45))} />
            <Plate x={540} text="ONE DAY · NEARLY 7,000 STRIKES · AK DIV. OF FORESTRY" displayLines={['ONE DAY · NEARLY 7,000 STRIKES', 'AK DIV. OF FORESTRY']} y={780} size={30} tone="lemon" p={win(f, b(45) + 4, b(38) - 12)} />
          </>}>
        <SVG>
          <rect x={-80} y={-80} width={1240} height={2080} fill="#33463F" data-band="ok" />
          {Array.from({length: 40}, (_, i) => <ellipse key={i} cx={h01(51, i) * 1080} cy={h01(52, i) * 1920} rx={40} ry={14} fill="#2B3B35" data-band="ok" />)}
          <HeldTravel f={f} x={90} y={640} w={900} h={560} mode="sweep" seed={57}><AlaskaOutline x={fit.x} y={fit.y} w={fit.w} fill={SG.sedge} stroke={INK} strokeWidth={4} shadow={10} /></HeldTravel>
          {marks}
          {Array.from({length: 4}, (_, i) => <ellipse key={`c${i}`} cx={(h01(61, i) * 1300 + f * 3) % 1300 - 100} cy={560 + i * 260} rx={260} ry={90} fill={SG.plum} opacity={0.35} />)}
          {f >= b(45) && f < b(45) + 8 && <rect x={-80} y={-80} width={1240} height={2080} fill={SG.lemonL} opacity={0.25 * (1 - (f - b(45)) / 8)} data-band="ok" />}
        </SVG>
      </Frame>
    );
  }
  return (
    <Frame p={p} z0={1.0} z1={1.03} overlay={<>
          <Plate x={700} text="WHO SHOULD RUN THAT TEST?" y={560} size={30} tone="dark" p={win(f, b(38) + 4)} />
        </>}>
      <SVG>
        <Ridge f={f} seed={1} band={0.15} wall={1} raven={940} />
        <HeldTravel f={f} x={210} y={560} w={260} h={700} mode="sweep" seed={58}><StormGlass f={f} x={340} y={GROUND} s={1.0} emotion="curious" seal="2019" sealGlow={0.3} look={0.8} cues={[b(38)]} seed={5} /></HeldTravel>
        <g>
          <rect x={714} y={GROUND - 360} width={12} height={370} fill={SG.woodD} stroke={INK} strokeWidth={3} />
          <ContactShadow cx={720} cy={GROUND + 4} rx={20} ry={5} opacity={0.4} />
          <TestCard x={720} y={GROUND - 420} rot={2 * Math.sin(f / 11)} />
          <path d={`M 570 ${GROUND - 490} L 870 ${GROUND - 490} L 400 ${GROUND - 520} L 240 ${GROUND - 520} Z`} fill={SG.plum} opacity={0.3} />
        </g>
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15, 16: S16};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

type Beat = {id: number; at: number; label: string};
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
  return Comp ? <Comp p={p} /> : null;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1127Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1127Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1127: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 9.48, 16.94, 21.88, 26.82, 33.16, 44.82, 50.74, 56.9, 63.34, 78.88, 88.9, 98.4, 102.54, 108.3, 118.3, 126.7].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: SG.plum}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#22302F" ink={SG.paper} /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
