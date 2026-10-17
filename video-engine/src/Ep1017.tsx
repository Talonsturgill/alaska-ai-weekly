import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK, ContactShadow, tones, FormGradient} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {GR, DayRoom, SnowDay, ReserveBar, CashBlock, MWReadout, FunnelMachine, HeightChart, RemoteControl, DateDrum, Switchbox, GenStack, PostcardStreet, OwnPlug, LedgerSlip, SpareTire, HallFront, lerpHex} from './lib/grid';
import {IDS} from './Ep1017Ids';

// TEN BILLION, HOW MANY MEGAWATTS, 2026-10-17. Palette roles are art_direction.json. CYAN is only the ReserveBar's fluid, HAZARD ORANGE only
// alerts, BANKNOTE GREEN only the CashBlock and money. Every painted string is a claims.json on_screen string, a quote, or a plain label.
// Burgum, Bradish and Kreiss-Tomkins appear only as plates, never as drawn people.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const PAL = {pearlSteelDeep: GR.steelHi};
const C = {ink: INK, paper: GR.cream};
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
  ink: {fill: GR.navy, fg: GR.cream},
  paper: {fill: GR.cream, fg: GR.navy},
  rust: {fill: GR.orangeDeep, fg: GR.cream},
  navy: {fill: '#1F3A4A', fg: GR.cream},
  desk: {fill: GR.woodDeep, fg: GR.cream},
  panel: {fill: '#1F3A4A', fg: GR.cream},
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

const win = (f: number, a: number, b: number) => (f >= a && f < b ? 1 : 0);
/** The deep navy cutaway world the numbers live in. */
const Cutaway: React.FC<{f: number}> = ({f}) => (
  <g>
    <defs><linearGradient id="cw-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GR.duskHi} /><stop offset="1" stopColor={GR.dusk} /></linearGradient></defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="url(#cw-bg)" />
    {Array.from({length: 24}, (_, i) => <line key={`v${i}`} data-band="ok" x1={i * 60 - 20} y1={-40} x2={i * 60 - 20} y2={1960} stroke={GR.grid} strokeWidth={2} opacity={0.35} />)}
    {Array.from({length: 34}, (_, i) => <line key={`h${i}`} data-band="ok" x1={-40} y1={i * 60 - 20} x2={1120} y2={i * 60 - 20} stroke={GR.grid} strokeWidth={2} opacity={0.35} />)}
    <rect data-band="ok" x={-40} y={1330} width={1160} height={630} fill="#0C1D2B" />
    <rect data-band="ok" x={-40} y={1330} width={1160} height={10} fill={GR.grid} opacity={0.7} />
    {Array.from({length: 13}, (_, i) => <line key={`p${i}`} data-band="ok" x1={540 + (i - 6) * 40} y1={1340} x2={540 + (i - 6) * 220} y2={1960} stroke={GR.grid} strokeWidth={2.5} opacity={0.5} />)}
    {Array.from({length: 6}, (_, i) => <line key={`q${i}`} data-band="ok" x1={-40} y1={1380 + i * i * 22 + i * 30} x2={1120} y2={1380 + i * i * 22 + i * 30} stroke={GR.grid} strokeWidth={2.5} opacity={0.5} />)}
    <ellipse data-band="ok" cx={430} cy={1700} rx={420} ry={90} fill={GR.cyan} opacity={0.07} />
    <path data-band="ok" d={`M 120 1840 C 260 1760 360 1900 520 1830 S 800 1760 960 1860`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
    <path data-band="ok" d={`M 120 1840 C 260 1760 360 1900 520 1830 S 800 1760 960 1860`} fill="none" stroke={GR.steelLite} strokeWidth={10} strokeLinecap="round" />
    {Array.from({length: 10}, (_, i) => <circle key={i} data-band="ok" cx={((i * 137 + f * (0.4 + (i % 3) * 0.3)) % 1200) - 60} cy={200 + ((i * 211) % 1000)} r={2 + (i % 3)} fill={GR.cream} opacity={0.18} />)}
  </g>
);
/** The audience cameo: the ReserveBar in the lower third, the near plane, looking up at the action. */
const Cameo: React.FC<{x: number; f: number; k?: number; look?: number; emotion?: 'calm' | 'puzzled' | 'uneasy' | 'worried' | 'sweating' | 'hopeful' | 'unsure' | 'resolved' | 'happy'; scale?: number; mw?: number}> = ({x, f, k = 1, look = 0, emotion = 'calm', scale = 0.62, mw = 38}) =>
  k > 0 ? (
    <g transform={`translate(0 ${(1 - k) * 300})`}>
      <ReserveBar x={x} y={1990} f={f} scale={scale} mw={mw} emotion={emotion} look={look} lines={false} id={`cam${Math.round(x)}`} />
    </g>
  ) : null;

// ---- S1: a block of dollars against a megawatt chart (beats 1, 2) ----------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t1 = b(1), t2 = b(2);
  const hop = clamp01(f / Math.max(8, t1));
  const bx = lerp(-180, 410, easeIO(hop, 0, 1));
  const by = 1240 - 150 * Math.sin(hop * Math.PI);
  const land = f - t1;
  const sq = land >= 0 ? Math.max(0, 1 - land / 10) * (0.6 + 0.4 * Math.cos(land / 1.5)) : 0;
  const penK = ease(f, t2 - 10, 18);
  const barIn = ease(f, t2 - 8, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000}
      overlay={<>
        <Plate text="HOW MANY MEGAWATTS?" y={560} size={40} tone="ink" p={ease(f, t2 + 4, 8)} />
      </>}>
      <SVG>
        <DayRoom f={g} floor={1240} id="s1r" />
        <HeightChart x={720} y={1240} f={g} scale={0.78} mark={12.5} markK={0} pencil={penK} id="s1h" />
        <CashBlock x={bx} y={by} f={g} scale={0.64} emotion="eager" squash={sq} id="s1c" />
        <g opacity={barIn} transform={`translate(0 ${(1 - barIn) * 80})`}>
          <ReserveBar x={1010} y={1240} f={g} scale={0.38} mw={40} emotion={f < t2 + 40 ? 'puzzled' : 'calm'} look={-0.8} lines={false} shadow id="s1rb" />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S2: a knock at the hall door (beats 3, 31, 39, 4, 33, 5) ------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t3 = b(3), t31 = b(31), t39 = b(39), t4 = b(4), t33 = b(33), t5 = b(5);
  const hop = ease(f, t3, 18);
  const bx = lerp(-200, 330, hop);
  const by = 1300 - 70 * Math.abs(Math.sin(Math.min(1, (f - t3) / 18) * Math.PI)) * (f < t3 + 18 ? 1 : 0);
  const kn = f >= t4 ? Math.abs(Math.sin((f - t4) / 5)) * (f < t4 + 44 ? 1 : 0) : 0;
  const tower = ease(f, t33 - 40, 36);
  const fold = ease(f, t33, 14);
  const tag = ease(f, t5, 10);
  const lean = ease(f, t39, 14);
  const knockPulse = f >= t4 && f < t4 + 44 ? Math.abs(Math.sin((f - t4) / 5)) : 0;
  const look = 0;
  const head = f < t31 ? 'BURGUM · FAIRBANKS CHAMBER · OCTOBER 14TH' : f < t39 ? 'INTERIOR SECRETARY BURGUM' : f < t4 ? 'A FAIRBANKS CHAMBER CROWD' : f < t33 ? 'BURGUM SAID' : f < t5 ? 'BURGUM SAID · 10 BILLION' : 'BURGUM SAID · 10 BILLION · NO TAX BREAKS';
  const lines = head.startsWith('BURGUM SAID · 10 BILLION · NO') ? ['BURGUM SAID · 10 BILLION', 'NO TAX BREAKS'] : head.startsWith('BURGUM · FAIRBANKS') ? ['BURGUM · FAIRBANKS CHAMBER', 'OCTOBER 14TH'] : undefined;
  const cols = ['#2B5D78', '#7A3B2E', '#3E6B4A', '#44465E', '#8A6A2F'];
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1000} dx0={-20} dx1={30}
      overlay={<>
        <Plate text={f < t31 ? 'BURGUM · FAIRBANKS CHAMBER · OCTOBER 14TH' : f < t39 ? 'INTERIOR SECRETARY BURGUM' : f < t4 ? 'A FAIRBANKS CHAMBER CROWD' : f < t33 ? 'BURGUM SAID' : f < t5 ? 'BURGUM SAID · 10 BILLION' : 'BURGUM SAID · 10 BILLION · NO TAX BREAKS'} displayLines={lines} y={f < t4 ? 530 : 570} size={30} tone={f < t4 ? 'paper' : 'ink'} p={ease(f, t3 + 4, 8)} />
      </>}>
      <SVG>
        <SnowDay f={g} ground={1240} id="s2s" steam={false} seed={1} />
        <HallFront x={640} y={1262} f={g} scale={0.84} knock={f > t4 ? Math.min(0.99, (f - t4) / 44) : 0} id="s2h" plaque="BURGUM" />
        {/* BURGUM SAID: the pitch lives in a thought bubble, not on the street */}
        <g opacity={ease(f, t33 - 44, 12)}>
          <ellipse cx={190} cy={760} rx={215} ry={200} fill={GR.cream} opacity={0.22} />
          <ellipse cx={190} cy={760} rx={215} ry={200} fill="none" stroke={GR.cream} strokeWidth={7} strokeDasharray="18 12" strokeDashoffset={-f * 0.6} />
          <circle cx={290} cy={1000} r={22} fill={GR.cream} opacity={0.5} stroke={INK} strokeWidth={3} />
          <circle cx={318} cy={1066} r={13} fill={GR.cream} opacity={0.5} stroke={INK} strokeWidth={3} />
        </g>
        {Array.from({length: 10}, (_, i) => {
          const k = clamp01(tower * 10 - i);
          return k > 0 && fold < 1 ? (
            <g key={i} transform={`translate(${130} ${880 - i * 24 - (1 - k) * 160 + fold * i * 10}) scale(0.7) rotate(${(i % 2 ? 2 : -2)})`} opacity={clamp01(k * 3) * (1 - fold)}>
              <rect x={-80} y={-22} width={160} height={24} rx={4} fill={GR.green} stroke={INK} strokeWidth={4} />
              <rect x={-80} y={-22} width={160} height={7} rx={3} fill="#FFFFFF" opacity={0.3} />
            </g>
          ) : null;
        })}
        {fold > 0 && (
          <g transform={`translate(130 885) scale(${fold * 0.7})`} opacity={fold}>
            <ContactShadow cx={0} cy={4} rx={150} ry={12} opacity={0.35} />
            <rect x={-120} y={-150} width={240} height={150} fill="#7C8EA0" stroke={INK} strokeWidth={7} />
            <rect x={-120} y={-150} width={240} height={20} fill="#FFFFFF" opacity={0.25} />
            {[-60, 0, 60].map((vx) => <rect key={vx} x={vx - 14} y={-100} width={28} height={60} fill={GR.navy} stroke={INK} strokeWidth={4} />)}
            <rect x={-110} y={-210} width={220} height={46} rx={4} fill={GR.cream} stroke={INK} strokeWidth={5} transform={`rotate(${3 * Math.sin(f / 9)} 0 -190)`} />
            <text x={0} y={-178} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={19} letterSpacing={1} fill={GR.navy} transform={`rotate(${3 * Math.sin(f / 9)} 0 -190)`}>A DATA CENTER</text>
          </g>
        )}
        {/* the crowd leans in on each knock and turns to look at each other at NO TAX BREAKS */}
        {[0, 1, 2, 3, 4].map((i) => {
          const c = cols[i];
          const tilt = -6 * lean - 5 * knockPulse + look * (i % 2 ? 9 : -9);
          return (
            <g key={i} transform={`translate(${770 + i * 78 - lean * 6} ${1318 + (i % 2) * 12}) scale(${0.9 + 0.08 * (i % 3)}) rotate(${tilt} 0 0)`} opacity={ease(f, t31, 10)}>
              <ContactShadow cx={0} cy={4} rx={44} ry={8} opacity={0.35} />
              <path d="M -34 0 L -30 -90 Q 0 -110 30 -90 L 34 0 Z" fill={c} stroke={INK} strokeWidth={5} />
              <circle cx={0} cy={-124} r={26} fill={c} stroke={INK} strokeWidth={5} />
              <rect x={-12 + (i % 2 ? 8 : -8) * look} y={-132} width={14} height={10} fill={GR.cream} stroke={INK} strokeWidth={2.5} />
            </g>
          );
        })}
        <CashBlock x={bx} y={by} f={g} scale={0.64} emotion="eager" knock={kn} squash={Math.max(0, 1 - Math.abs(f - (t3 + 18)) / 8) * (f >= t3 + 18 ? 1 : 0)} id="s2c" />
        {tag > 0 && (
          <g transform={`translate(${bx + 150} ${by - 240 + 6 * Math.sin(f / 8)}) rotate(${6 * Math.sin(f / 10)})`} opacity={tag}>
            <line x1={0} y1={-22} x2={0} y2={0} stroke={INK} strokeWidth={4} />
            <rect x={-118} y={0} width={236} height={44} rx={5} fill={GR.cream} stroke={INK} strokeWidth={5} />
            <text x={0} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={21} letterSpacing={1} fill={GR.navy}>NO TAX BREAKS</text>
          </g>
        )}
        <Cameo x={150} f={g} k={ease(f, t39, 16)} look={0.7} emotion="puzzled" />
      </SVG>
    </Frame>
  );
};

// ---- S3: electricity into intelligence (beats 6, 7, 50) ----------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t6 = b(6), t7 = b(7), t50 = b(50);
  const bolt = ease(f, t6, 22);
  const brain = ease(f, t7 - 6, 26);
  const coins = ease(f, t50, 56);
  const kick = f >= t6 + 14 ? Math.max(0, 1 - (f - t6 - 14) / 16) : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1000}
      overlay={<>
        <Plate text="ELECTRICITY IN" y={1180} size={30} tone="ink" p={ease(f, t6 + 6, 8) * (f < t7 ? 1 : 0)} />
        <QuotePlate text={'"YOU CONVERT ELECTRICITY INTO INTELLIGENCE, YOU MAKE MONEY" · BURGUM'} y={620} size={34} wrap={24} p={ease(f, t7 + 2, 12)} />
      </>}>
      <SVG>
        <DayRoom f={g} floor={1240} window={false} id="s3r" />
        <FunnelMachine x={330} y={1250} f={g} scale={0.9} bolt={bolt} brain={brain} coins={coins} kick={kick} id="s3f" />
      </SVG>
    </Frame>
  );
};

/** The table a macro of the remote sits on. */
const TableTop: React.FC<{f: number; id: string}> = ({f, id}) => (
  <g>
    <DayRoom f={f} floor={1020} window={false} id={`${id}r`} rug={false} />
    <rect data-band="ok" x={-40} y={1020} width={1160} height={460} fill={GR.wood} stroke={INK} strokeWidth={8} />
    <rect data-band="ok" x={-40} y={1020} width={1160} height={26} fill="#FFFFFF" opacity={0.22} />
    {Array.from({length: 6}, (_, i) => <path key={i} data-band="ok" d={`M -40 ${1090 + i * 64} Q 540 ${1076 + i * 64 + 6 * Math.sin(i)} 1120 ${1090 + i * 64}`} fill="none" stroke={GR.woodDeep} strokeWidth={3} opacity={0.5} />)}
    <rect data-band="ok" x={-40} y={1480} width={1160} height={440} fill={GR.woodDeep} />
    <rect data-band="ok" x={-40} y={1480} width={1160} height={16} fill={INK} opacity={0.5} />
  </g>
);

// ---- S4: a remote on a table, pause (beats 8, 34, 35, 9) ------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t8 = b(8), t34 = b(34), t35 = b(35), t9 = b(9);
  const dr = f < t8 ? 0 : easeIn(f, t8, 10);
  const ry = f < t8 ? -420 : lerp(-420, 1130, dr) - (f >= t8 + 10 ? 36 * Math.exp(-(f - t8 - 10) / 7) * Math.abs(Math.cos((f - t8 - 10) / 3)) : 0);
  const cardK = ease(f, t34, 14);
  const press = f >= t9 - 2 ? Math.min(1, ease(f, t9 - 2, 7)) * (1 - 0.5 * ease(f, t9 + 20, 12)) : 0;
  const ann = f < t34 ? 'AT THAT EVENT' : 'KREISS-TOMKINS · DEMOCRATIC CANDIDATE FOR GOVERNOR';
  return (
    <Frame p={p} z0={1.04} z1={1.0} oy={1000}
      overlay={<>
        <Plate text={f < t34 ? 'AT THAT EVENT' : 'KREISS-TOMKINS · DEMOCRATIC CANDIDATE FOR GOVERNOR'} displayLines={f >= t34 ? ['KREISS-TOMKINS · DEMOCRATIC', 'CANDIDATE FOR GOVERNOR'] : undefined} y={560} size={28} tone="paper" p={ease(f, t8 + 6, 8) * (f < t9 ? 1 : 0)} />
        <QuotePlate text={'"I THINK WE SHOULD PAUSE" · KREISS-TOMKINS'} y={560} size={38} wrap={22} p={ease(f, t9 + 12, 10)} />
      </>}>
      <SVG>
        <TableTop f={g} id="s4t" />
        <g transform={`translate(0 0)`}>
          <RemoteControl x={500} y={ry} f={g} scale={0.92} active={f >= t9 ? 'pause' : 'none'} press={press} id="s4rc" />
        </g>
        {/* the tent card */}
        <g transform="translate(930 1130)" opacity={ease(f, t8 + 8, 10)}>
          <ContactShadow cx={0} cy={6} rx={90} ry={10} opacity={0.35} />
          <path d={`M -90 0 L -80 ${-200 * (0.4 + 0.6 * cardK)} L 80 ${-200 * (0.4 + 0.6 * cardK)} L 90 0 Z`} fill={GR.cream} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <text x={0} y={-128 * (0.4 + 0.6 * cardK)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={15} letterSpacing={0.5} fill={INK} opacity={cardK}>KREISS-TOMKINS</text>
          <text x={0} y={-100 * (0.4 + 0.6 * cardK)} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={INK} opacity={cardK}>CANDIDATE</text>
        </g>
        <Cameo x={170} f={g} k={ease(f, t35 - 6, 16)} look={lerp(-0.9, 0.5, ease(f, t35, 12))} emotion="uneasy" />
      </SVG>
    </Frame>
  );
};

// ---- S5: two days earlier, a date drum and a switchbox (beats 10, 48, 11, 12) ------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t10 = b(10), t48 = b(48), t11 = b(11), t12 = b(12);
  const t40 = t11 + 16;
  const roll = easeIO(f, t10 + 6, 40);
  const lamp = ease(f, t11, 8);
  const st = ease(f, t12, 8);
  const tagK = ease(f, t40, 8);
  const lid = ease(f, t12 - 6, 12);
  const ring = ease(f, t48, 10);
  const ann = f < t48 ? 'TWO DAYS EARLIER' : f < t11 ? 'MONDAY OCTOBER 12TH' : 'GOLDEN VALLEY ELECTRIC · LEVEL 2 ALERT';
  return (
    <Frame p={p} z0={1.04} z1={1.0} oy={1000}
      overlay={<>
        <Plate text={f < t48 ? 'PAUSE FOR WHAT?' : f < t11 ? 'MONDAY OCTOBER 12TH' : 'GOLDEN VALLEY ELECTRIC · LEVEL 2 ALERT'} displayLines={f >= t11 ? ['GOLDEN VALLEY ELECTRIC', 'LEVEL 2 ALERT'] : undefined} y={560} size={30} tone={f < t11 ? 'paper' : 'rust'} p={ease(f, t10 + 4, 8)} />
        <g opacity={st} transform={`translate(790 ${860 - 20 * (1 - st)}) rotate(${-8 + 10 * (1 - st)}) scale(${1 + 0.5 * (1 - st)})`}>
          <rect x={-250} y={-48} width={500} height={96} rx={6} fill={GR.cream} stroke={GR.orange} strokeWidth={8} />
          <text x={0} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} letterSpacing={2} fill={GR.orangeDeep}>FIRST UNDER A</text>
          <text x={0} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} letterSpacing={2} fill={GR.orangeDeep}>NEW ALERT SYSTEM</text>
        </g>
      </>}>
      <SVG>
        <DayRoom f={g} floor={1260} window={false} id="s5r" />
        <DateDrum x={290} y={960} f={g} scale={0.92} from={14} to={12} roll={roll} id="s5d" />
        {ring > 0 && <ellipse cx={380} cy={960} rx={118 * ring} ry={100 * ring} fill="none" stroke={GR.orange} strokeWidth={10} opacity={ring} />}
        <Switchbox x={800} y={960} f={g} scale={1.0} lamp={lamp} id="s5s" />
        {lid > 0 && (
          <g transform={`translate(800 ${760})`} opacity={lid}>
            <circle cx={150} cy={-10} r={34} fill={GR.cream} stroke={INK} strokeWidth={6} />
            <text x={150} y={4} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={48} fill={GR.navy}>1</text>
          </g>
        )}
        {tagK > 0 && (
          <g transform={`translate(800 ${1230 - 40 * (1 - tagK)}) rotate(-4)`} opacity={tagK}>
            <rect x={-82} y={-24} width={164} height={44} rx={5} fill={GR.orange} stroke={INK} strokeWidth={5} />
            <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} letterSpacing={2} fill={GR.cream}>LEVEL 2</text>
          </g>
        )}
        <RemoteControl x={560} y={1660} f={g} scale={0.46} active={f < t10 + 60 ? 'rewind' : 'none'} press={ease(f, t10, 6)} id="s5rc" />
      </SVG>
    </Frame>
  );
};

// ---- S6: the reserve, a spare tire, a 100 MW ghost (beats 13, 41, 14, 52, 15) ------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t13 = b(13), t41 = b(41), t14 = b(14), t52 = b(52), t15 = b(15);
  const rise = ease(f, t13, 24);
  const spare = ease(f, t14, 12);
  const houses = ease(f, t41, 14);
  const lineK = ease(f, t52, 14);
  const dr = easeIn(f, t15, 22);
  const over = f >= t15 + 22 ? 3 * Math.exp(-(f - t15 - 22) / 9) * Math.cos((f - t15 - 22) / 3) : 0;
  const mw = lerp(46, 11, dr) - over;
  const worried = f >= t15;
  const bs = 0.85, gy = 1290;
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={900}
      overlay={<>
        <Plate text="THE RESERVE · SPARE ROOM" y={530} size={30} tone="paper" p={ease(f, t14 + 4, 8) * (f < t15 + 20 ? 1 : 0)} />
        <Plate text="LEVEL 2 · RESERVE UNDER 15 MW" displayLines={['LEVEL 2', 'RESERVE UNDER 15 MW']} y={630} size={34} tone="rust" p={ease(f, t15 + 20, 8)} />
        <Plate text="IN USE" x={150} y={1130} size={28} tone="navy" p={houses} />
      </>}>
      <SVG>
        <Cutaway f={g} />
        <SpareTire x={120} y={720} f={g} scale={0.62} />
        <g opacity={houses}>
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${70 + i * 110} ${1290 - 12 * Math.abs(Math.sin(f / 9 + i))})`}>
              <rect x={-34} y={-70} width={68} height={70} fill="#C4755C" stroke={INK} strokeWidth={5} />
              <path d="M -46 -70 L 0 -112 L 46 -70 Z" fill="#6B7C88" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <rect x={-12} y={-54} width={24} height={26} fill={GR.brassHi} stroke={INK} strokeWidth={4} />
            </g>
          ))}
        </g>
        <g transform={`translate(0 ${(1 - rise) * 500})`} opacity={rise}>
          <ReserveBar x={420} y={gy} f={g} scale={bs} mw={mw} emotion={worried ? (f > t15 + 30 ? 'sweating' : 'worried') : f >= t52 ? 'uneasy' : 'calm'} look={worried ? 0.6 : 0.3}
            lines={lineK > 0 || f > t14 - 10} tickLabels={lineK > 0} sweat={worried ? 1 : 0} lamp={f >= t52 ? 1 : 0} spare={spare} id="s6b" />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S7: three units, one dark, two in hard hats (beats 16, 17, 36, 53, 42, 54, 18) ---------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t16 = 0, t17 = b(17), t36 = b(36), t53 = b(53), t54 = b(54), t18 = b(18);
  const t42 = t53 + 66;
  const rise = ease(f, t16, 26);
  const off = f >= t17;
  const hats = ease(f, t36, 12);
  const st = ease(f, t53, 8);
  const wr = ease(f, t54, 12);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1000} dx0={20} dx1={-20}
      overlay={<>
        <Plate text="THREE UNITS" y={510} size={30} tone="paper" p={ease(f, t16 + 4, 8) * (f < t17 ? 1 : 0)} />
        <Plate text="1 UNIT OFFLINE" y={590} size={32} tone="rust" p={ease(f, t17 + 4, 8) * (f < t53 ? 1 : 0)} />
        <Plate text="2 IN MAINTENANCE" y={670} size={30} tone="paper" p={ease(f, t36 + 4, 8) * (f < t42 ? 1 : 0)} />
        <g opacity={st * (f < t42 ? 1 : 0)} transform={`translate(540 ${960 - 20 * (1 - st)}) rotate(${-3 + 6 * (1 - st)}) scale(${1 + 0.5 * (1 - st)})`}>
          <rect x={-440} y={-90} width={880} height={180} rx={8} fill={GR.cream} stroke={GR.orange} strokeWidth={9} />
          <text x={0} y={-24} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={36} letterSpacing={2} fill={GR.orangeDeep}>THE REPORTS TIE THE ALERT</text>
          <text x={0} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={36} letterSpacing={2} fill={GR.orangeDeep}>TO A UNIT, NOT A</text>
          <text x={0} y={76} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={36} letterSpacing={2} fill={GR.orangeDeep}>DATA CENTER</text>
        </g>
        <Plate text="GVEA SPOKESPERSON ASHLEY BRADISH" displayLines={['GVEA SPOKESPERSON', 'ASHLEY BRADISH']} y={780} size={30} tone="paper" p={ease(f, t42 + 4, 8) * (f < t18 ? 1 : 0)} />
        <QuotePlate text={'"NOT GOING TO BE A QUICK FIX" · GVEA\'S ASHLEY BRADISH'} y={640} size={36} wrap={20} p={ease(f, t18 + 2, 12)} />
      </>}>
      <SVG>
        <SnowDay f={g} ground={1180} id="s7s" steam={false} seed={2} />
        <g transform={`translate(0 ${(1 - rise) * 500})`} opacity={rise}>
          <GenStack x={250} y={1330} f={g} scale={0.78} state={off ? 'off' : 'run'} id="s7a" seed={1} />
          <GenStack x={540} y={1330} f={g} scale={0.78} state="maint" hat={hats} id="s7b" seed={2} />
          <GenStack x={830} y={1330} f={g} scale={0.78} state="maint" hat={hats} id="s7c" seed={3} />
        </g>
        {wr > 0 && (
          <g transform={`translate(540 ${1000 - 20 * (1 - wr)}) rotate(${wr * 360 * 0.25})`} opacity={wr * (f < t18 ? 1 : 0.0)}>
            <circle r={60} fill={GR.cream} stroke={INK} strokeWidth={6} />
            <path d="M -26 26 L 18 -18 a 20 20 0 1 1 18 18 L -8 44 Z" fill={GR.steelLite} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          </g>
        )}
        <Cameo x={960} f={g} k={1} look={-0.7} emotion="sweating" mw={11} scale={0.62} />
      </SVG>
    </Frame>
  );
};

// ---- S8: a postcard from Ellendale (beats 19, 37, 20, 55) ------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t19 = b(19), t37 = b(37), t20 = b(20), t55 = b(55);
  const open = ease(f, t19, 20);
  const lit = Math.floor(5 * ease(f, t37, 40));
  const chk = clamp01((f - t20) / 60);
  const sil = ease(f, t37 + 10, 16);
  const head = f < t37 ? 'THE BEST CASE FOR YES' : 'ELLENDALE, NORTH DAKOTA';
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={900}
      overlay={<>
        <Plate text={f < t37 ? 'THE BEST CASE FOR YES' : 'ELLENDALE, NORTH DAKOTA'} y={560} size={32} tone="paper" p={ease(f, t19 + 4, 8)} />
        <Plate text="HOMES + BILL REBATES" y={660} size={30} tone="ink" p={ease(f, t20, 8)} />
        <Plate text="PER KTUU" y={780} x={800} size={30} tone="navy" p={ease(f, t55, 8)} rot={4} />
      </>}>
      <SVG>
        <SnowDay f={g} ground={1300} id="s8s" steam={false} seed={3} />
        <PostcardStreet x={540} y={1050} f={g} scale={1.0} open={open} lit={lit} check={chk} id="s8p" />
        {[0, 1, 2, 3, 4].map((i) => {
          const k = clamp01((f - (t20 + 6 + i * 9)) / 16);
          if (k <= 0 || k >= 1) return null;
          const hx = 160 + i * 190;
          return (
            <g key={i} transform={`translate(${hx + 30 * Math.sin(k * 6)} ${lerp(760, 1060, k * k)}) rotate(${(1 - k) * 40})`} opacity={1 - 0.3 * k}>
              <rect x={-40} y={-26} width={80} height={52} rx={4} fill={GR.cream} stroke={INK} strokeWidth={5} />
              <path d="M -40 -26 L 0 6 L 40 -26" fill="none" stroke={INK} strokeWidth={4} />
              <circle cx={24} cy={14} r={9} fill={GR.green} stroke={INK} strokeWidth={3} />
            </g>
          );
        })}
        {sil > 0 && (
          <g transform="translate(521 1066)" opacity={sil}>
            <rect x={-6} y={-6} width={12} height={34} rx={4} fill="#2A1A08" />
            <rect x={-9} y={-18} width={18} height={14} rx={5} fill="#2A1A08" />
            <circle cx={0} cy={4} r={30 + 5 * Math.sin(f / 6)} fill={GR.brassHi} opacity={0.22} />
          </g>
        )}
        <Cameo x={940} f={g} k={ease(f, t19 + 10, 16)} look={-0.6} emotion="hopeful" />
      </SVG>
    </Frame>
  );
};

// ---- S9: its own power (beats 21, 38, 22) --------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t21 = b(21), t38 = b(38), t22 = b(22);
  const t56 = t21 + 70;
  const cord = ease(f, t21 + 10, 34);
  const plugX = lerp(1250, 700, ease(f, t21, 26)) - (f > t56 ? 0 : 0);
  const mw = f < t38 ? lerp(30, 34, ease(f, t21, 20)) : lerp(34, 52, easeIO(f, t38, 30)) - (f > t22 ? 6 * ease(f, t22, 20) : 0);
  const q = ease(f, t22, 10);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={950}
      overlay={<>
        <Plate text="IF IT BROUGHT ITS OWN POWER?" displayLines={['IF IT BROUGHT', 'ITS OWN POWER?']} y={560} size={34} tone="paper" p={ease(f, t21 + 6, 8)} />
        <Plate text="MORE RESERVE, NOT LESS?" x={700} y={700} size={28} tone="navy" p={ease(f, t38, 8) * (f < t22 ? 1 : 0)} />
        <Plate text="THE REPORTS DON'T SAY" x={700} y={850} size={34} tone="rust" p={q} />
      </>}>
      <SVG>
        <Cutaway f={g} />
        <ReserveBar x={330} y={1330} f={g} scale={0.92} mw={mw} emotion={f < t21 + 20 ? 'calm' : f < t22 ? 'hopeful' : 'unsure'} look={0.8} lines tickLabels={false} id="s9b" />
        <OwnPlug x={plugX} y={1010} f={g} scale={0.9} cord={Math.max(0.15, cord)} tag="OWN POWER?" q={q} id="s9p" dir={-1} />
      </SVG>
    </Frame>
  );
};

// ---- S10: then development can proceed (beats 23, 58, 45) --------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t23 = b(23), t58 = b(58), t45 = b(45);
  const press = ease(f, t23 - 2, 7) * (1 - 0.5 * ease(f, t23 + 20, 12));
  const lampK = spring(f, t58, 14);
  const roll = easeIO(f, t45, 30);
  return (
    <Frame p={p} z0={1.04} z1={1.0} oy={1000}
      overlay={<>
        <QuotePlate text={'"AND THEN, IN A THOUGHTFUL WAY, DEVELOPMENT CAN PROCEED" · KREISS-TOMKINS'} y={600} size={34} wrap={24} p={ease(f, t23 + 6, 12)} />
      </>}>
      <SVG>
        <TableTop f={g} id="s10t" />
        <RemoteControl x={500} y={1130} f={g} scale={0.92} active={f >= t23 ? 'play' : 'none'} press={press} id="s10rc" />
        {lampK > 0 && (
          <g transform={`translate(${540} ${860 + 6 * Math.sin(f / 7)}) scale(${0.4 + 0.7 * Math.min(1.2, lampK)})`} opacity={clamp01(lampK * 2)}>
            <circle cx={0} cy={0} r={34} fill={GR.brassHi} stroke={INK} strokeWidth={5} />
            <rect x={-12} y={30} width={24} height={14} fill={GR.brass} stroke={INK} strokeWidth={4} />
            <circle cx={0} cy={0} r={70 + 8 * Math.sin(f / 6)} fill={GR.brassHi} opacity={0.2} />
          </g>
        )}
        {roll > 0 && (
          <g transform={`translate(${lerp(730, 560, roll)} ${lerp(1250, 1600, roll)}) scale(${lerp(0.5, 1.5, roll)} ${lerp(0.5, 1.5, roll) * (1 - 0.18 * Math.max(0, roll - 0.85) / 0.15)})`} opacity={1 - 0.0 * roll}>
            <ContactShadow cx={0} cy={50} rx={60} ry={8} opacity={0.35} />
            <path d="M -40 -50 L 54 0 L -40 50 Z" fill={GR.cream} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          </g>
        )}
        <Cameo x={150} f={g} k={1} look={0.8} emotion="unsure" scale={0.62} />
      </SVG>
    </Frame>
  );
};

// ---- S11: every term of yes is a megawatt question (beats 24, 59, 46, 25) ------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t24 = b(24), t59 = b(59), t46 = b(46), t25 = b(25);
  const slam = ease(f, t25 + 3, 9);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={900}
      overlay={<>
        <Plate text="EVERY TERM OF YES · A MEGAWATT QUESTION" displayLines={['EVERY TERM OF YES', 'A MEGAWATT QUESTION']} y={540} size={30} tone="paper" p={ease(f, t24 + 4, 8) * (f < t25 ? 1 : 0)} />
        <g opacity={slam} transform={`translate(540 ${760 - 20 * (1 - slam)}) rotate(${-4 + 8 * (1 - slam)}) scale(${1 + 0.7 * (1 - slam)})`}>
          <rect x={-420} y={-96} width={840} height={192} rx={8} fill={GR.cream} stroke={GR.orange} strokeWidth={10} />
          <text x={0} y={-30} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={42} letterSpacing={2} fill={GR.orangeDeep}>THE REPORTS NAME</text>
          <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={42} letterSpacing={2} fill={GR.orangeDeep}>NO MEGAWATTS FOR</text>
          <text x={0} y={72} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={42} letterSpacing={2} fill={GR.orangeDeep}>THE 10 BILLION</text>
        </g>
      </>}>
      <SVG>
        <DayRoom f={g} floor={1240} window={false} id="s11r" />
        <LedgerSlip x={540 - 1000 * ease(f, t25 - 16, 12)} y={700} label="HOMES" stamp="MW?" p={ease(f, t24, 12)} stampK={ease(f, t24 + 12, 6)} rot={-2} f={g} />
        <LedgerSlip x={540 - 1000 * ease(f, t25 - 14, 12)} y={840} label="REBATES" stamp="MW?" p={ease(f, t24 + 10, 12)} stampK={ease(f, t59, 6)} rot={1.5} f={g} />
        <LedgerSlip x={540} y={980} label="WHO BUILDS THE POWER" stamp="MW?" p={ease(f, t24 + 20, 12)} stampK={ease(f, t46, 6)} rot={-1} f={g} />
        <MWReadout x={540} y={1260} f={g} scale={1.5} q={slam} alarm={slam} id="s11m" />
        <Cameo x={940} f={g} k={1} look={-0.8} emotion="uneasy" scale={0.62} />
      </SVG>
    </Frame>
  );
};

// ---- S12: our read, a power question first (beats 26, 47, 27) -----------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t26 = b(26), t47 = b(47), t27 = b(27);
  const slide = ease(f, t26, 22);
  const plug = ease(f, t27 - 20, 20);
  const kick = f >= t27 ? Math.max(0, 1 - (f - t27) / 16) : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={950}
      overlay={<>
        <Plate text="OUR READ" y={540} size={36} tone="ink" p={ease(f, t26 + 8, 8)} />
        <Plate text="A POWER QUESTION FIRST" y={650} size={32} tone="paper" p={ease(f, t27, 8)} />
      </>}>
      <SVG>
        <DayRoom f={g} floor={1240} window={false} id="s12r" />
        <FunnelMachine x={lerp(-300, 330, slide)} y={1250} f={g} scale={0.9} plug={plug} tag={f >= t47 ? 'AI' : ''} spin={f > t27 ? 1.6 : 0.8} kick={kick} id="s12f" />
        <Cameo x={900} f={g} k={1} look={-0.8} emotion={f > t27 ? 'resolved' : 'calm'} scale={0.62} />
      </SVG>
    </Frame>
  );
};

// ---- S13: name the megawatts (beats 28, 61, 29, 30) ----------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t28 = b(28), t61 = b(61), t29 = b(29), t30 = b(30);
  const hop = clamp01((f - (t28 - 18)) / 18);
  const bx = lerp(-180, 410, easeIO(hop, 0, 1));
  const by = 1240 - 150 * Math.sin(hop * Math.PI);
  const land = f - t28;
  const sq = land >= 0 ? Math.max(0, 1 - land / 10) * (0.6 + 0.4 * Math.cos(land / 1.5)) : 0;
  const markK = ease(f, t61, 14);
  const ghost = ease(f, t29, 18);
  const look = ease(f, t30, 10);
  return (
    <Frame p={p} zk={() => lerp(1.1, 1.0, easeIO(f, t28 - 6, 50))} oy={1000}
      overlay={<>
        <Plate text="NAME THE MEGAWATTS" y={560} size={40} tone="ink" p={ease(f, t29 + 2, 8)} />
        <Plate text="10 BILLION · ? MW" y={660} size={32} tone="paper" p={ease(f, t30, 8)} />
      </>}>
      <SVG>
        <DayRoom f={g} floor={1240} id="s13r" />
        <HeightChart x={720} y={1240} f={g} scale={0.78} mark={12.5} markK={markK} markLabel="? MW" pencil={ease(f, t28 - 10, 16)} id="s13h" />
        <CashBlock x={bx} y={by} f={g} scale={0.64} emotion={f > t29 ? 'shrug' : 'eager'} squash={sq} id="s13c" />
        {ghost > 0 && (
          <g transform={`translate(410 ${960 - 30 * Math.sin(f / 12) - (1 - ghost) * 200})`} opacity={ghost}>
            <rect x={-130} y={-190} width={260} height={190} fill={GR.cream} opacity={0.12} />
            <rect x={-130} y={-190} width={260} height={190} fill="none" stroke={GR.orange} strokeWidth={9} strokeDasharray="20 12" strokeDashoffset={-f} />
            <text x={0} y={-72} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={64} letterSpacing={3} fill={GR.orangeDeep}>? MW</text>
          </g>
        )}
        <ReserveBar x={1010} y={1240} f={g} scale={0.38} mw={40} emotion="happy" look={look > 0.5 ? 0 : -0.8} lines={false} id="s13rb" />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={GR.sky} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={GR.navy}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'CHART', 2: 'KNOCK', 3: 'FUNNEL', 4: 'PAUSE', 5: 'ALERT', 6: 'RESERVE', 7: 'UNITS', 8: 'ELLENDALE', 9: 'OWN POWER', 10: 'PROCEED', 11: 'LEDGER', 12: 'OUR READ', 13: 'NAME THEM'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

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

export const ep1017Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1017Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1017: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 6, 22, 28, 40, 52, 63, 77, 88, 100, 107, 115, 122, 132].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#14283A" ink="#F4EEDC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
