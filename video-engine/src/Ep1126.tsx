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
import {HeldTravel} from './lib/heldidle';
import {IdleFigure, FigureFinish, StrikeProp} from './lib/figureidle';
import {Suit} from './lib/people';
import {Stopwatch} from './lib/groundstop';
import {SearchReticle} from './lib/vision';
import {Odometer} from './lib/sonar';
import {AK_PATH} from './lib/akmap';
import {
  PING, Ping, BrainSlice, CTRing, SliceStack, ReportPrinter, Scoreboard, GurneyToken, WallPhone, GownHooks, WardWorld, AK_POINTS,
} from './lib/ping';
import {IDS} from './Ep1126Ids';

// Ahead of the Patient, 2026-11-26. Palette roles are art_direction.json: celadon tile and graphite ink under an ivory lightbox key,
// navy winter windows with warm sodium dots; CORAL belongs to Ping and its copies alone; RUBY belongs to the clot alone; the
// Anchorage room is rosy under a warm bulb. Ping is the protagonist and carries the feeling. Named people are faceless Suits with
// boxed name cards. Nobody is drawn flown (no vehicle ever, only a gurney token). The five specialists stand on a WHOLE STATE card,
// never on the map. The 21 hospitals are dashed outlines (planned). The OUTCOMES row is always a dashed blank.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
const INK = PING.ink;
const C = {ink: INK, paper: PING.paper, bg: PING.tile};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** spring 0..1 with overshoot that starts at frame a */
const spr = (f: number, a: number, d = 16) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.exp(-6 * t) * Math.cos(9 * t);
};

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'plate' | 'dark' | 'coral';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  plate: {fill: PING.paper, fg: INK, edge: INK},
  dark: {fill: '#22383B', fg: '#F4F1E6', edge: '#F4F1E6'},
  coral: {fill: PING.coral, fg: INK, edge: INK},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> =
({text, displayLines, x = 540, y, size = 32, tone = 'plate', p = 1, rot = 0}) => {
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
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.18, overlay, bg = C.bg, warmth = 0.03, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: 540 + 12 * Math.sin(p.f / 110) + 8 * t, fy: 960};
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
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#22383B" stroke="#F4F1E6" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F4F1E6">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.05} warmth={warmth} />
    </AbsoluteFill>
  );
};

/** a boxed name card on a short stake (named people are never characterized) */
const NameCard: React.FC<{x: number; y: number; text: string; size?: number; f: number}> = ({x, y, text, size = 22, f}) => {
  const w = monoW(text, size) + 30;
  return (
    <g transform={`translate(${x} ${y}) rotate(${Math.sin(f / 27 + x) * 1.2})`}>
      <ContactShadow cx={0} cy={2} rx={20} ry={5} opacity={0.35} />
      <rect x={-4} y={-70} width={8} height={72} fill={PING.steelD} stroke={INK} strokeWidth={2.5} />
      <rect x={-w / 2} y={-70 - size - 22} width={w} height={size + 22} rx={5} fill={PING.paper} stroke={INK} strokeWidth={4} />
      <text x={0} y={-70 - 11 + size * 0.36 - size / 2 + 2} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={size} letterSpacing={1.5} fill={INK}>{text}</text>
    </g>
  );
};

/** a small hanging tag on a peg, rows of mono text sized by arithmetic */
const PegTag: React.FC<{x: number; y: number; text: string; size?: number; f: number; k?: number; tone?: 'paper' | 'coral'}> = ({x, y, text, size = 20, f, k = 1, tone = 'paper'}) => {
  const kk = clamp01(k);
  if (kk <= 0.01) return null;
  const w = monoW(text, size) + 26;
  const sw = 3 * Math.sin(f / 13 + x * 0.01) + (1 - kk) * 30;
  return (
    <g transform={`translate(${x} ${y})`} opacity={Math.min(1, kk * 2)}>
      <circle cx={0} cy={0} r={6} fill={PING.steel} stroke={INK} strokeWidth={3} />
      <g transform={`rotate(${sw})`}>
        <path d={`M 0 0 L ${-w / 4} 26 M 0 0 L ${w / 4} 26`} stroke={INK} strokeWidth={2.5} />
        <rect x={-w / 2} y={26} width={w} height={size + 18} rx={5} fill={tone === 'coral' ? PING.coralL : PING.paper} stroke={INK} strokeWidth={3.5} />
        <text x={0} y={26 + 9 + size * 0.86} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} fill={INK}>{text}</text>
      </g>
    </g>
  );
};

/** the stylised Alaska map board on a graphite desk, seen from above; children draw in the 1000x700 map box. */
const MapDesk: React.FC<{f: number; ox?: number; oy?: number; s?: number; seed?: number; children?: React.ReactNode; near?: boolean}> = ({f, ox = 40, oy = 620, s = 1, seed = 1, children, near = true}) => (
  <g>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#3E4C4A" />
    {Array.from({length: 26}, (_, i) => <path key={i} d={`M -40 ${i * 80 + (seed * 17) % 80} H 1120`} stroke="#33403E" strokeWidth={3} opacity={0.6} />)}
    <rect x={ox - 30} y={oy - 30} width={1000 * s + 60} height={700 * s + 60} rx={8} fill="#000" opacity={0.3} transform="translate(12 16)" />
    <rect x={ox - 30} y={oy - 30} width={1000 * s + 60} height={700 * s + 60} rx={8} fill={PING.paper} stroke={INK} strokeWidth={7} />
    <g transform={`translate(${ox} ${oy}) scale(${s})`}>
      <rect x={0} y={0} width={1000} height={700} fill="#CFDDE0" />
      {Array.from({length: 9}, (_, i) => <path key={i} d={`M 0 ${i * 80 + 30} Q 500 ${i * 80 + 30 + 6 * Math.sin(f / 40 + i)} 1000 ${i * 80 + 30}`} stroke="#B9CCD0" strokeWidth={2} fill="none" />)}
      <path d={AK_PATH} fill="#E9E2CB" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={AK_PATH} fill="none" stroke="#C9BE9C" strokeWidth={14} opacity={0.35} transform="translate(4 6)" />
      {[[260, 220], [380, 160], [640, 180], [720, 300], [300, 330]].map(([mx, my], i) => (
        <path key={i} d={`M ${mx - 26} ${my + 12} L ${mx} ${my - 18} L ${mx + 26} ${my + 12} Z`} fill="#D3C8A6" stroke="#9C9070" strokeWidth={2.5} />
      ))}
      {children}
    </g>
    {near && (
      <g data-band="ok">
        <rect x={-40} y={1590} width={1160} height={30} fill="#2E3A39" stroke={INK} strokeWidth={5} />
        <g transform="translate(170 1720)"><ellipse cx={0} cy={46} rx={56} ry={12} fill="#000" opacity={0.3} /><rect x={-40} y={-40} width={80} height={86} rx={8} fill="#E9E2D0" stroke={INK} strokeWidth={5} />
          <path d="M 40 -20 q 28 0 28 24 q 0 24 -28 24" stroke={INK} strokeWidth={6} fill="none" />
          {[0, 1].map((i) => <path key={i} d={`M ${-12 + i * 20} -52 q 9 -16 0 -32`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.4 + 0.3 * Math.sin(f / 8 + i)} />)}</g>
        <g transform="translate(880 1740) rotate(-18)"><rect x={-100} y={-9} width={200} height={18} rx={9} fill="#2E4A5A" stroke={INK} strokeWidth={4} /><path d="M 100 -9 L 124 0 L 100 9 Z" fill={PING.bone} stroke={INK} strokeWidth={3} /></g>
        <g transform="translate(540 1800) rotate(3)"><rect x={-130} y={-40} width={260} height={80} rx={4} fill={PING.paper} stroke={INK} strokeWidth={4} />{[0, 1, 2].map((i) => <rect key={i} x={-110} y={-26 + i * 22} width={180 - i * 30} height={7} fill="#B7AE97" />)}</g>
      </g>
    )}
  </g>
);

/** a dashed route on the map box from a to b with a soft arc */
const Route: React.FC<{a: [number, number]; b: [number, number]; color?: string; width?: number}> = ({a, b, color = INK, width = 6}) => {
  const mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.18, my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.18;
  return <path d={`M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`} stroke={color} strokeWidth={width} fill="none" strokeDasharray="14 10" strokeLinecap="round" opacity={0.85} />;
};
/** point along the same arc */
const routePt = (a: [number, number], b: [number, number], t: number): [number, number] => {
  const mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.18, my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.18;
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * mx + t * t * b[0], u * u * a[1] + 2 * u * t * my + t * t * b[1]];
};

/** a map dot with a label plate */
const MapDot: React.FC<{at: [number, number]; label: string; f: number; size?: number; dx?: number; dy?: number; pulse?: boolean}> = ({at, label, f, size = 22, dx = 0, dy = -44, pulse = false}) => {
  const w = monoW(label, size) + 22;
  return (
    <g>
      {pulse && <circle cx={at[0]} cy={at[1]} r={18 + 8 * Math.sin(f / 6)} fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />}
      <circle cx={at[0]} cy={at[1]} r={11} fill={PING.bone} stroke={INK} strokeWidth={5} />
      <rect x={at[0] + dx - w / 2} y={at[1] + dy - size / 2 - 9} width={w} height={size + 18} rx={5} fill={PING.paper} stroke={INK} strokeWidth={3.5} />
      <text x={at[0] + dx} y={at[1] + dy + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} fill={INK}>{label}</text>
    </g>
  );
};

// ================================================================== SCENES ==================================================================

/** the floor under the caption bar gets a job: a desk edge with the day's working props, varied by seed */
const NearDesk: React.FC<{f: number; seed?: number; tone?: string}> = ({f, seed = 1, tone = '#6E5A48'}) => {
  const left = seed % 2 === 0;
  return (
    <g data-band="ok">
      <rect x={-40} y={1560} width={1160} height={400} fill={tone} stroke={INK} strokeWidth={6} />
      <path d="M -40 1574 H 1120" stroke="#fff" strokeWidth={5} opacity={0.18} />
      <g transform={`translate(${left ? 200 : 860} 1690)`}><ellipse cx={0} cy={50} rx={60} ry={12} fill="#000" opacity={0.3} /><rect x={-42} y={-44} width={84} height={92} rx={8} fill="#E9E2D0" stroke={INK} strokeWidth={5} />
        <path d="M 42 -24 q 30 0 30 26 q 0 26 -30 26" stroke={INK} strokeWidth={6} fill="none" />
        {[0, 1].map((i) => <path key={i} d={`M ${-12 + i * 22} -56 q 9 -16 0 -32`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.35 + 0.3 * Math.sin(f / 8 + i)} />)}</g>
      <g transform={`translate(${left ? 620 : 380} 1720) rotate(${left ? 4 : -5})`}><rect x={-150} y={-46} width={300} height={92} rx={4} fill={PING.paper} stroke={INK} strokeWidth={4} />{[0, 1, 2].map((i) => <rect key={i} x={-128} y={-30 + i * 24} width={200 - i * 40} height={8} fill="#B7AE97" />)}</g>
      <g transform={`translate(${left ? 900 : 160} 1700) rotate(${left ? -22 : 18})`}><rect x={-100} y={-9} width={200} height={18} rx={9} fill="#2E4A5A" stroke={INK} strokeWidth={4} /><path d="M 100 -9 L 124 0 L 100 9 Z" fill={PING.bone} stroke={INK} strokeWidth={3} /></g>
      <g transform={`translate(${left ? 420 : 640} 1850)`}><rect x={-60} y={-20} width={120} height={40} rx={6} fill="#8FA3A3" stroke={INK} strokeWidth={4} /><rect x={-48} y={-10} width={70} height={8} fill={PING.bone} opacity={0.7} /></g>
    </g>
  );
};
/** the floor of an exterior: trampled snow with a fence line, footprints and a stake, varied by seed */
const NearSnow: React.FC<{f: number; seed?: number}> = ({f, seed = 1}) => (
  <g data-band="ok">
    <path d={`M -40 1560 Q 300 ${1530 + 10 * (seed % 3)} 620 1570 T 1120 1550 V 1960 H -40 Z`} fill="#E6EDF0" stroke={INK} strokeWidth={5} />
    {Array.from({length: 7}, (_, i) => (
      <g key={i} transform={`translate(${80 + i * 150 + (seed * 37) % 60} ${1620 + (i % 2) * 18})`}>
        <ContactShadow cx={0} cy={70} rx={20} ry={5} opacity={0.35} />
        <rect x={-7} y={-40} width={14} height={110} fill="#6B4A32" stroke={INK} strokeWidth={3} transform={`rotate(${i % 2 ? 4 : -3})`} />
      </g>
    ))}
    <path d={`M 40 1610 L 1100 ${1620 + 8 * Math.sin(f / 50)}`} stroke="#8A6A4A" strokeWidth={6} />
    {Array.from({length: 9}, (_, i) => <ellipse key={`fp${i}`} cx={200 + i * 70} cy={1780 + (i % 2) * 22} rx={14} ry={7} fill="#C5D2D8" />)}
    <path d="M -40 1880 Q 400 1840 800 1890 T 1120 1870" stroke="#C5D2D8" strokeWidth={22} fill="none" />
  </g>
);


/** the cold 0:00 stopwatch on a little console stand (case 1: it never runs) */
const ColdWatch: React.FC<{f: number; x: number; y: number; r?: number}> = ({f, x, y, r = 54}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-r * 1.6} y={r + 4} width={r * 3.2} height={r * 1.1} rx={8} fill="#2A3B3D" stroke={INK} strokeWidth={5} />
    <Stopwatch f={f} x={0} y={0} r={r} sweep={0} accent={PING.brass} />
  </g>
);

// ---- S1: BORN IN THE RING (the slice with its vessel cutoff is already in the bore; Ping pops at 0.2 s reacting; the counter lands on 2 million)
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pop = clamp01((f - 1) / 14);
  const cells = 2000000 * Easing.out(Easing.cubic)(clamp01((f + 6) / Math.max(1, b(2) + 6)));
  const nailGlint = ease(f, b(3) - 4, 10) * (1 - ease(f, b(3) + 24, 20));
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.07, easeIO(fr, 0, p.dur)), fx: lerp(560, 600, easeIO(fr, 0, p.dur)), fy: 980})}>
      <SVG>
        <WardWorld f={f} seed={1} windowX={250} windowW={360} floorY={1320} near="cart" />
        <HeldTravel f={f} x={300} y={610} w={640} h={720} mode="sweep" seed={11}>
          <CTRing f={f} x={620} y={930} s={1.0} table={0.7} glow={1} spin={1}>
            <BrainSlice x={0} y={-6} r={124} clot={1} seed={2} />
          </CTRing>
        </HeldTravel>
        <g transform="translate(830 1000)">
          <Ping f={f} x={0} y={0} s={0.62} emotion={f < 3 ? 'sleepy' : f < b(3) - 6 ? 'alert' : 'curious'} pop={pop} glow={0.9} cues={[b(1) + 6, b(46), b(2), b(3)]} seed={1} look={f > b(3) - 6 ? -1 : 0} />
        </g>
        <g transform="translate(170 700)">
          <circle cx={0} cy={0} r={10} fill={PING.steel} stroke={INK} strokeWidth={4} />
          <circle cx={-3} cy={-3} r={4} fill="#fff" opacity={0.3 + 0.7 * nailGlint} />
          <rect x={-70} y={24} width={140} height={40} rx={5} fill={PING.paper} stroke={INK} strokeWidth={3.5} />
          <text x={0} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={INK}>RESULTS</text>
        </g>
        <ColdWatch f={f} x={170} y={880} r={46} />
        <g data-band="ok" transform="translate(800 560)">
          <Odometer x={0} y={0} value={cells} digits={7} size={30} id="cells1126" commas label="ABOUT" fg={PING.bone} bg="#16262A" />
        </g>
        <Plate x={540} text="A BRAIN SCAN · AN ALASKA HOSPITAL" y={1250} size={30} p={ease(f, 4, 8) * (1 - ease(f, b(46) - 4, 8))} />
        <Plate x={540} text="EVERY MINUTE" y={1180} size={30} tone="dark" p={ease(f, b(46) + 2, 8) * (1 - ease(f, b(2) - 7, 6))} />
        <Plate x={540} text="ABOUT 2 MILLION BRAIN CELLS · EVERY MINUTE" y={1110} size={30} p={ease(f, b(2) + 2, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S2: THE OLD WAY (from above; a sweating ream crawls a dashed wire toward Anchorage and jams)
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const A = AK_POINTS.INTERIOR, B = AK_POINTS.ANCHORAGE;
  const crawl = 0.05 + 0.12 * clamp01(f / Math.max(1, b(5)));
  const [rx, ry] = routePt(A, B, crawl);
  const peel = clamp01((f - b(5)) / 30);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.25, 1.0, easeIO(fr, 0, 40)), fx: lerp(640, 540, easeIO(fr, 0, 40)), fy: lerp(980, 960, easeIO(fr, 0, 40))})}>
      <SVG>
        <MapDesk f={f} seed={2}>
          <Route a={A} b={B} />
          <MapDot at={A} label="A HOSPITAL" f={f} dx={-150} dy={-20} />
          <MapDot at={B} label="ANCHORAGE" f={f} dx={-40} dy={50} pulse />
          <HeldTravel f={f} x={rx - 90} y={ry - 220} w={180} h={230} mode="shadow" seed={2}>
            <g transform={`translate(${rx} ${ry}) scale(0.5)`}>
              <SliceStack f={f} x={0} y={0} s={1} n={16} sweat={1} seed={4} />
            </g>
          </HeldTravel>
          {peel > 0 && peel < 1 && (
            <g transform={`translate(${lerp(rx + 40, A[0] + 30, peel)} ${lerp(ry - 60, A[1] - 20, peel)}) rotate(${peel * 220})`} opacity={1 - peel * 0.6}>
              <rect x={-56} y={-44} width={112} height={88} rx={4} fill="#1E2829" stroke={INK} strokeWidth={4} />
            </g>
          )}
        </MapDesk>
        <Plate x={540} text="JUST SENDING THE IMAGES TO ANCHORAGE" y={560} size={28} p={ease(f, b(4) + 4, 10) * (1 - ease(f, b(5) - 7, 6))} />
        <Plate x={540} text="COULD TAKE 45 MIN" y={630} size={34} tone="dark" p={ease(f, b(5) + 2, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S3: THE COALITION (Ping lands on the reading desk beside a cold stopwatch; the volunteer sheet unrolls; Ping spins to RAPIDAI)
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const jump = clamp01((f - 2) / 22);
  const px = lerp(260, 560, jump), py = lerp(880, 1110, jump) - Math.sin(jump * Math.PI) * 160;
  const land = jump >= 1 ? Math.max(0, 1 - (f - 24) / 10) : 0;
  const unroll = easeIO(f, b(39) - 10, 18);
  const spin = easeIO(f, b(7) - 8, 14);
  const plate = spr(f, b(7), 14);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.02, 1.08, easeIO(fr, 0, p.dur)), fx: lerp(500, 580, easeIO(fr, 0, p.dur)), fy: 1000})}>
      <SVG>
        <HeldTravel f={f} x={0} y={0} w={1080} h={1920} mode="shadow" seed={13}>
          <WardWorld f={f} seed={3} windowX={850} windowW={280} floorY={1240} near="desk" />
        </HeldTravel>
        <g transform="translate(250 780)">
          <rect x={-150} y={-120} width={300} height={240} rx={10} fill={PING.bone} stroke={INK} strokeWidth={7} />
          <rect x={-134} y={-104} width={268} height={208} fill="#FFFDF4" opacity={0.9} />
          <BrainSlice x={-60} y={0} r={56} clot={0} seed={7} />
          <BrainSlice x={62} y={0} r={56} clot={0} seed={8} />
        </g>
        <g transform="translate(580 470)">
          <rect x={-200} y={-14} width={400} height={28} rx={14} fill={PING.steelD} stroke={INK} strokeWidth={5} />
          <g transform={`rotate(${2 * Math.sin(f / 15)})`}>
            <path d={`M -184 14 H 184 V ${14 + 150 * unroll} H -184 Z`} fill={PING.paper} stroke={INK} strokeWidth={5} />
            {unroll > 0.6 && <text x={0} y={70} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} fill={INK} opacity={(unroll - 0.6) / 0.4}>ALASKA STROKE</text>}
            {unroll > 0.8 && <text x={0} y={110} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} fill={INK} opacity={(unroll - 0.8) / 0.2}>COALITION</text>}
            <rect x={-190} y={8 + 150 * unroll} width={380} height={18} rx={9} fill={PING.steelD} stroke={INK} strokeWidth={4} />
          </g>
        </g>
        <g data-band="ok">
          <rect x={300} y={1120} width={560} height={40} rx={6} fill="#8C7660" stroke={INK} strokeWidth={6} />
          <rect x={330} y={1160} width={30} height={160} fill="#6E5A48" stroke={INK} strokeWidth={5} />
          <rect x={800} y={1160} width={30} height={160} fill="#6E5A48" stroke={INK} strokeWidth={5} />
        </g>
        <ColdWatch f={f} x={780} y={1010} r={40} />
        <g transform={`translate(${px} ${py})`}>
          <g transform={`scale(${spin < 0.5 ? 1 - spin * 2 : (spin - 0.5) * 2} 1)`}>
            <Ping f={f} x={0} y={0} s={0.9} emotion={spin > 0.5 ? 'proud' : 'hopeful'} squash={land} cues={[b(6), b(39), b(7)]} seed={2} clot={false} />
          </g>
        </g>
        <Plate x={540} text="VOLUNTEER GROUP" y={1262} size={28} p={ease(f, b(6) + 6, 10) * (1 - ease(f, b(39) - 7, 6))} />
        <Plate x={540} text="ALASKA STROKE COALITION" y={1192} size={28} p={ease(f, b(39) + 4, 10) * (1 - ease(f, b(7) - 7, 6))} />
        <Plate x={540} text="RAPIDAI · STROKE SCAN SOFTWARE" y={1122} size={28} p={ease(f, b(7) + 4, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S4: THE FLAG (a giant slice; the reticle snaps on the vessel cutoff; the branch beyond dims; Ping launches at the wall phone)
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rise = easeIO(f, 0, 14);
  const flag = spr(f, b(9) - 2, 12);
  const dimmed = ease(f, b(42) - 2, 12);
  const fire = clamp01((f - b(10)) / 12);
  const ring = f > b(10) + 10 ? Math.max(0, 1 - (f - b(10) - 10) / 40) : 0;
  const tag = spr(f, b(11), 14);
  const cx = 500 + 0.42 * 330, cy = 960 - 0.02 * 330;
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.06, 1.0, easeIO(fr, 0, p.dur)), fx: lerp(580, 520, easeIO(fr, 0, p.dur)), fy: lerp(900, 960, easeIO(fr, 0, p.dur))})} bg="#16262A">
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#16262A" />
        <rect x={60} y={560 + 80 * (1 - rise)} width={960} height={820} rx={18} fill={PING.bone} stroke={INK} strokeWidth={8} />
        <rect x={86} y={586 + 80 * (1 - rise)} width={908} height={768} fill="#FFFDF4" />
        <g transform={`translate(0 ${80 * (1 - rise)})`}>
          <HeldTravel f={f} x={170} y={610} w={660} h={700} mode="sweep" seed={14}>
            <BrainSlice x={500} y={960} r={330} clot={dimmed} seed={3} />
          </HeldTravel>
          <SearchReticle x={cx} y={cy} f={f} lock={flag} seed={3} r={90} color={PING.bone} ghosts={3} />
        </g>
        <WallPhone f={f} x={950} y={1190} s={0.8} lift={ring * 0.3} swing={ring} />
        <NearDesk f={f} seed={4} tone="#2E3A39" />
        {fire > 0 && fire < 1 && (
          <circle cx={lerp(800, 950, fire)} cy={lerp(1240, 1140, fire)} r={22} fill={PING.coral} stroke={INK} strokeWidth={4} />
        )}
        <g transform="translate(790 1300)">
          <Ping f={f} x={0} y={0} s={0.8} emotion={f < b(9) ? 'determined' : f < b(10) ? 'alert' : 'proud'} squash={fire > 0 && fire < 0.4 ? 1 - fire / 0.4 : 0} cues={[b(8), b(9), b(42), b(10), b(11)]} seed={4} look={f < b(10) ? -1 : 1} />
        </g>
        {tag > 0.02 && (
          <g transform={`translate(950 990) rotate(${(1 - Math.min(1, tag)) * 180})`}>
            <rect x={-96} y={-22} width={192} height={44} rx={6} fill={PING.coralL} stroke={INK} strokeWidth={4} />
            <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>SECONDS</text>
          </g>
        )}
        <Plate x={540} text="READING THE SCAN" y={500} size={28} tone="dark" p={ease(f, b(8) + 2, 8) * (1 - ease(f, b(9) - 7, 6))} />
        <Plate x={540} text="SUSPECTED LARGE VESSEL OCCLUSION" y={570} size={30} p={ease(f, b(9) + 2, 8) * (1 - ease(f, b(42) - 7, 6))} />
        <Plate x={540} text="A CLOT IN A BIG BRAIN ARTERY" y={640} size={30} p={ease(f, b(42) + 2, 8) * (1 - ease(f, b(10) - 7, 6))} />
        <Plate x={540} text="IN ONE CASE · PER STAT" y={710} size={28} tone="dark" p={ease(f, b(10) + 2, 8) * (1 - ease(f, b(11) - 7, 6))} />
        <Plate x={540} text="ALERT · SECONDS AFTER THE SCAN" y={780} size={30} tone="coral" p={ease(f, b(11) + 4, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S5: AT ONCE (over the map Ping splits; one copy to LOCAL TEAM, one off the map onto the WHOLE STATE card)
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const A = AK_POINTS.INTERIOR;
  const split = clamp01((f - 2) / Math.max(1, b(13) - 2));
  const race = easeIO(f, b(13) - 2, 24);
  const lx = lerp(A[0], A[0] + 120, race), ly = lerp(A[1], A[1] - 30, race);
  const ox = 40, oy = 620;
  const tx = lerp(ox + A[0], 900, race), ty = lerp(oy + A[1], 1060, race);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.05, easeIO(fr, 0, p.dur)), fx: 540, fy: lerp(960, 1000, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <HeldTravel f={f} x={0} y={560} w={1080} h={820} mode="shadow" seed={15}>
        <MapDesk f={f} seed={5} near={false}>
          {race <= 0 && (
            <g transform={`translate(${A[0]} ${A[1] - 10}) scale(0.62)`}>
              <Ping f={f} x={0} y={0} s={1} emotion="determined" split={split * 0.98} spread={170} cues={[b(12)]} seed={5} />
            </g>
          )}
          {race > 0 && (
            <g transform={`translate(${lx} ${ly - 10}) scale(0.62)`}><Ping f={f} x={0} y={0} s={1} emotion={race >= 1 ? 'proud' : 'determined'} cues={[b(13)]} seed={5} tilt={race >= 1 ? 10 * Math.sin(Math.min(1, (f - b(13) - 22) / 10) * Math.PI) : 0} /></g>
          )}
          <MapDot at={A} label="LOCAL TEAM" f={f} dx={150} dy={-118} />
        </MapDesk>
        </HeldTravel>
        {/* the WHOLE STATE card at the board's edge, off the map */}
        <g transform="translate(900 1300)">
          <ContactShadow cx={0} cy={6} rx={170} ry={12} opacity={0.4} />
          <rect x={-160} y={-170} width={320} height={176} rx={8} fill={PING.paper} stroke={INK} strokeWidth={5} />
          <text x={0} y={-136} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK}>WHOLE STATE</text>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${-112 + i * 56} -16) scale(0.6)`}>
              <path d="M -22 0 L -18 -80 Q 0 -96 18 -80 L 22 0 Z" fill="#5E8F86" stroke={INK} strokeWidth={5} />
              <circle cx={0} cy={-104} r={18} fill="#C99A78" stroke={INK} strokeWidth={5} />
            </g>
          ))}
        </g>
        {race > 0 && (
          <g transform={`translate(${tx} ${ty - 10}) scale(0.62)`}>
            <Ping f={f} x={0} y={0} s={1} emotion={race >= 1 ? 'proud' : 'determined'} cues={[b(13)]} seed={8} tilt={race >= 1 ? -10 * Math.sin(Math.min(1, (f - b(13) - 22) / 10) * Math.PI) : 0} />
          </g>
        )}
        {race > 0 && race < 1 && [0, 1, 2].map((i) => <line key={i} x1={tx} y1={ty - 50 + i * 16} x2={tx - 70 * (900 - ox - A[0]) / 600} y2={ty - 50 + i * 16 - 70} stroke={PING.coral} strokeWidth={5} opacity={0.6} strokeLinecap="round" />)}
        <Plate x={540} text="THE ALERT SPLITS" y={560} size={30} tone="coral" p={ease(f, b(12) + 2, 10) * (1 - ease(f, b(13) - 7, 6))} />
        <Plate x={540} text="LOCAL TEAM + SPECIALISTS AT ONCE" y={630} size={30} p={ease(f, b(13) + 6, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S6: FIVE (low behind the WHOLE STATE card the view pulls back until five figures are dwarfed by Alaska; a pager twitches)
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pull = easeIO(f, 0, 50);
  const tap = Math.max(0, Math.min(5, Math.floor((f - b(15) + 2) / 8)));
  const buzz = f > b(15) + 16 && f < b(15) + 70 ? Math.sin(f * 2.4) * 5 : 0;
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.6, 1.0, easeIO(fr, 0, 50)), fx: lerp(540, 540, pull), fy: lerp(1150, 980, easeIO(fr, 0, 50))})}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#3E4C4A" />
        <HeldTravel f={f} x={40} y={470} w={1000} h={700} mode="shadow" seed={16}>
        <g transform="translate(40 470) scale(1.0)">
          <path d={AK_PATH} fill="#E9E2CB" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d={AK_PATH} fill="none" stroke="#C9BE9C" strokeWidth={16} opacity={0.35} transform="translate(5 8)" />
        </g>
        </HeldTravel>
        <g data-band="ok">
          <rect data-band="ok" x={-40} y={1290} width={1160} height={700} fill="#2E3A39" />
          <path d="M -40 1290 H 1120" stroke={INK} strokeWidth={6} />
        </g>
        <NearDesk f={f} seed={6} tone="#3B4A48" />
        <g transform="translate(540 1290)">
          <ContactShadow cx={0} cy={6} rx={330} ry={18} opacity={0.45} />
          <rect x={-320} y={-250} width={640} height={256} rx={10} fill={PING.paper} stroke={INK} strokeWidth={6} />
          <text x={0} y={-206} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={INK}>WHOLE STATE</text>
          {[0, 1, 2, 3, 4].map((i) => {
            const nod = tap > i ? Math.sin(Math.min(1, (f - b(15) - i * 8) / 8) * Math.PI) * 8 : 0;
            const x = -224 + i * 112;
            return (
              <g key={i}>
                <IdleFigure f={f} x={x} footY={-20} h={150} seed={20 + i} cues={[b(14), b(15) + i * 8]}>
                  <g transform={`translate(${x} -20) rotate(${nod})`}>
                    <ContactShadow cx={0} cy={2} rx={26} ry={6} opacity={0.4} />
                    <path d="M -26 0 L -22 -96 Q 0 -114 22 -96 L 26 0 Z" fill="#5E8F86" stroke={INK} strokeWidth={5} />
                    <path d="M -16 -90 L -12 -10" stroke="#7FB0A6" strokeWidth={5} />
                    <circle cx={0} cy={-124} r={21} fill="#C99A78" stroke={INK} strokeWidth={5} />
                    <path d="M -21 -132 Q 0 -152 21 -132" stroke="#4A3A30" strokeWidth={9} fill="none" />
                    {i === 4 && (
                      <g transform={`translate(26 -50) rotate(${buzz * 2})`}>
                        <rect x={-16} y={-22} width={32} height={44} rx={6} fill="#2E3A39" stroke={INK} strokeWidth={4} />
                        <circle cx={0} cy={-8} r={7} fill={PING.bone} opacity={buzz !== 0 ? 1 : 0.35} />
                      </g>
                    )}
                  </g>
                </IdleFigure>
              </g>
            );
          })}
        </g>
        <g transform="translate(870 1250)"><Ping f={f} x={0} y={0} s={0.55} emotion="hopeful" arm={tap > 0 && tap < 5 ? 1 : 0} cues={[b(15)]} seed={6} look={-1} /></g>
        <Plate x={540} text="WHOLE STATE" y={560} size={34} p={ease(f, b(14) + 6, 10) * (1 - ease(f, b(15) - 7, 6))} />
        <Plate x={540} text="5 CLOT-REMOVAL SPECIALISTS · WHOLE STATE" y={630} size={28} p={ease(f, b(15) + 2, 10)} />
      </SVG>
    </Frame>
  );
};

/** the second hospital's exterior: blue before sunrise, a far ridge and spruce, the building with a canopy and doors */
const ERExterior: React.FC<{f: number; doors: number}> = ({f, doors}) => (
  <g>
    <defs><linearGradient id="erSky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#24395A" /><stop offset="1" stopColor="#6E86A2" /></linearGradient></defs>
    <rect x={-40} y={-40} width={1160} height={1100} fill="url(#erSky)" />
    {Array.from({length: 30}, (_, i) => <circle key={i} cx={(i * 71) % 1100} cy={(i * 37) % 420} r={1.6} fill="#E8F0F4" opacity={0.5 + 0.3 * Math.sin(f / 20 + i)} />)}
    <path d="M -40 760 L 160 620 L 300 700 L 520 560 L 760 690 L 960 600 L 1120 660 V 900 H -40 Z" fill="#2E4462" />
    {Array.from({length: 18}, (_, i) => <path key={i} d={`M ${i * 64} 860 l -18 50 h 36 Z`} fill="#1B2C40" />)}
    <rect data-band="ok" x={-40} y={880} width={1160} height={480} fill="#B9C2CA" />
    <rect x={60} y={560} width={960} height={720} fill="#8FA3A3" stroke={INK} strokeWidth={7} />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={120 + i * 230} y={620} width={150} height={110} rx={6} fill={i === 1 ? '#FFD9A0' : '#304660'} stroke={INK} strokeWidth={5} />)}
    <path d="M 120 840 L 960 840 L 1000 900 L 80 900 Z" fill="#5E6C6C" stroke={INK} strokeWidth={6} />
    <rect x={140} y={900} width={20} height={380} fill="#5E6C6C" stroke={INK} strokeWidth={4} />
    <rect x={920} y={900} width={20} height={380} fill="#5E6C6C" stroke={INK} strokeWidth={4} />
    <ellipse cx={540} cy={900} rx={160} ry={14} fill="#FFE4B0" opacity={0.6} />
    <g transform="translate(540 1280)">
      <rect x={-200} y={-360} width={400} height={360} fill="#FFD9A0" stroke={INK} strokeWidth={7} />
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * 200} 0) scale(${s * (1 - doors * 0.55)} 1)`}>
          <rect x={-196} y={-356} width={194} height={356} fill="#9FBFB4" stroke={INK} strokeWidth={6} />
          <rect x={-170} y={-320} width={140} height={150} rx={6} fill="#FFE7BC" stroke={INK} strokeWidth={4} />
        </g>
      ))}
      <rect x={-140} y={-420} width={280} height={46} rx={6} fill={PING.paper} stroke={INK} strokeWidth={4} />
      <text x={0} y={-388} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>EMERGENCY</text>
    </g>
    <g data-band="ok">
      <path d="M -40 1330 Q 200 1290 420 1330 T 1120 1320 V 1960 H -40 Z" fill="#E6EDF0" stroke={INK} strokeWidth={5} />
      <g transform="translate(900 1420)"><path d="M -24 40 L 0 -40 L 24 40 Z" fill="#E87F3A" stroke={INK} strokeWidth={4} /><rect x={-14} y={-6} width={28} height={10} fill="#fff" /></g>
      {[120, 300].map((x, i) => <path key={i} d={`M ${x - 60} 1500 Q ${x} 1470 ${x + 60} 1500`} stroke="#C5D2D8" strokeWidth={14} fill="none" />)}
    </g>
  </g>
);

// ---- S7: ANOTHER CASE (a different hospital's doors; the gurney rolls in; the intake stopwatch clicks on; the printer starts one page)
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const doors = Math.sin(clamp01(f / 34) * Math.PI) * (1 - clamp01((f - 34) / 40));
  const roll = easeIO(f, 2, 60);
  const into = easeIO(f, b(17) - 18, 24);
  const sweep = f > b(17) ? (f - b(17)) / 1800 : 0;
  return (
    <Frame p={p} overlay={<>
          <Plate x={540} text="MID-60s · A MORNING FALL · INTERIOR HOSPITAL" y={1190} size={28} p={ease(f, b(16) + 6, 10) * (1 - ease(f, b(17) - 7, 6))} />
          <Plate x={760} text="THE CLOCK STARTS" y={1260} size={30} tone="dark" p={ease(f, b(17) + 4, 10)} />
        </>} cam={(fr) => ({z: lerp(1.0, 1.9, into), fx: lerp(540, 540, into), fy: lerp(1000, 1080, into)})}>
      <SVG>
        <HeldTravel f={f} x={0} y={0} w={1080} h={1920} mode="shadow" seed={17}>
          <ERExterior f={f} doors={doors} />
        </HeldTravel>
        {/* through the door glass: the intake board with the stopwatch and the printer */}
        <g transform="translate(540 1080) scale(0.32)">
          <rect x={-300} y={-260} width={600} height={520} rx={12} fill="#3B4A48" stroke={INK} strokeWidth={10} />
          <Stopwatch f={f} x={-140} y={-60} r={110} sweep={sweep} accent={PING.brass} />
          <ReportPrinter f={f} x={140} y={200} s={0.8} page={f > b(17) ? (f - b(17)) / 900 : 0} seed={9} />
        </g>
        <GurneyToken f={f} x={lerp(-120, 520, roll)} y={1320} s={2.0} />
      </SVG>
    </Frame>
  );
};

/** a desk phone with a coiled cord; `lift` raises the receiver, `swing` sways it on its hook */
const DeskPhone: React.FC<{f: number; x: number; y: number; s?: number; lift?: number; swing?: number}> = ({f, x, y, s = 1, lift = 0, swing = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={4} rx={130} ry={14} opacity={0.4} />
    <path d="M -120 0 L -96 -90 H 96 L 120 0 Z" fill={PING.beige} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    {Array.from({length: 9}, (_, i) => <circle key={i} cx={-36 + (i % 3) * 36} cy={-62 + Math.floor(i / 3) * 0} r={0} />)}
    {Array.from({length: 6}, (_, i) => <rect key={i} x={-60 + (i % 3) * 44} y={-70 + Math.floor(i / 3) * 30} width={32} height={22} rx={4} fill="#EFE7D2" stroke={INK} strokeWidth={3} />)}
    <g transform={`translate(0 ${-110 - 150 * lift}) rotate(${swing * 8 * Math.sin(f / 4) - 18 * lift})`}>
      <path d="M -130 0 Q -140 -40 -100 -40 H 100 Q 140 -40 130 0 L 110 14 H -110 Z" fill={PING.beige} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    </g>
    <path d={`M 120 -10 C 200 ${20 + 30 * lift} 160 ${100 + 20 * Math.sin(f / 6)} 230 120`} stroke={INK} strokeWidth={5} fill="none" strokeDasharray="10 5" />
  </g>
);

// ---- S8: THE CALL BEATS THE REPORT (the nurse's hand lifts the phone at UNDER 30; a bone pulse runs to PROVIDENCE; hang up; the printer finally drops)
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lift = ease(f, b(18) - 6, 10) * (1 - ease(f, b(19) - 4, 8));
  const swing = f > b(19) + 4 ? Math.exp(-(f - b(19) - 4) / 40) : 0;
  const sweep = lerp(0.42, 0.5, clamp01(f / Math.max(1, b(18) + 6))) + (f > b(18) + 6 ? 0.0006 * (f - b(18) - 6) : 0);
  const pulse = clamp01((f - b(43) + 6) / 16);
  const page = lerp(0.55, 1, clamp01(f / Math.max(1, b(20) - 4)));
  const drop = clamp01((f - b(20) + 4) / 10);
  const tag = spr(f, b(43) + 8, 14);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.02, 1.08, easeIO(fr, 0, p.dur)), fx: lerp(460, 620, easeIO(fr, b(19), 30)), fy: 1000})}>
      <SVG>
        <WardWorld f={f} seed={7} windowX={540} windowW={320} floorY={1180} near="counter" />
        <g data-band="ok"><rect x={-40} y={1180} width={1160} height={50} fill="#7FA196" stroke={INK} strokeWidth={6} /></g>
        <g transform="translate(560 860)">
          <rect x={-150} y={-60} width={300} height={300} rx={10} fill="#3B4A48" stroke={INK} strokeWidth={7} />
          <g transform={`translate(0 ${-14 * Math.exp(-Math.max(0, f - b(18)) / 5) * (f >= b(18) ? Math.abs(Math.sin((f - b(18)) * 0.9)) : 0)})`}><Stopwatch f={f} x={0} y={70} r={100} sweep={sweep} accent={PING.brass} /></g>
          <path d={`M ${Math.cos(0.5 * Math.PI * 2 - Math.PI / 2) * 108} ${70 + Math.sin(0.5 * Math.PI * 2 - Math.PI / 2) * 108} l 0 16`} stroke={INK} strokeWidth={6} />
          <text x={0} y={230} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={PING.bone}>UNDER 30 MIN</text>
        </g>
        <DeskPhone f={f} x={230} y={1180} s={1.0} lift={lift} swing={swing} />
        {lift > 0.2 && (
          <g transform={`translate(230 ${1070 - 150 * lift})`}>
            <path d="M -40 -30 Q -120 -10 -200 30 L -220 -40 Q -130 -70 -40 -70 Z" fill="#C99A78" stroke={INK} strokeWidth={5} />
            <path d="M -180 -30 L -240 -48 L -230 18 Z" fill="#9FBFB4" stroke={INK} strokeWidth={5} />
          </g>
        )}
        {pulse > 0 && pulse < 1 && <circle cx={lerp(350, 430, pulse)} cy={lerp(1130, 1080, pulse)} r={12} fill={PING.bone} stroke={INK} strokeWidth={3} />}
        {tag > 0.02 && <PegTag x={450} y={980} text="PROVIDENCE · ANCHORAGE" f={f} k={tag} size={18} />}
        <HeldTravel f={f} x={700} y={800} w={330} h={430} mode="sweep" seed={8}>
          <ReportPrinter f={f} x={860} y={1180} s={0.8} page={page} drop={drop} seed={9} />
        </HeldTravel>
        <Plate x={540} text="UNDER 30 MIN AFTER HE ARRIVED" y={560} size={30} p={ease(f, b(18) + 2, 8) * (1 - ease(f, b(43) - 7, 6))} />
        <Plate x={540} text="PROVIDENCE · ANCHORAGE" y={630} size={30} p={ease(f, b(43) + 2, 8) * (1 - ease(f, b(19) - 7, 6))} />
        <Plate x={540} text="TRANSFER CALL" y={700} size={30} tone="dark" p={ease(f, b(19) + 2, 8) * (1 - ease(f, b(20) - 7, 6))} />
        <Plate x={540} text="2 MIN BEFORE THE OFFICIAL REPORT" y={770} size={30} tone="dark" p={ease(f, b(20) + 4, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S9: CLOT OUT (medium: the stopwatch on the intake board sweeps hard and stops at 4 HR 23 MIN; the nurse's hand presses it flat)
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const run = clamp01(f / Math.max(1, b(21)));
  const sweep = lerp(0.5, 4.38, Easing.inOut(Easing.quad)(run));
  const slam = f > b(21) ? Math.exp(-(f - b(21)) / 6) * Math.sin((f - b(21)) * 1.4) * 4 : 0;
  const hand = easeIO(f, b(22) - 10, 12);
  const hrs = Math.min(4, Math.floor(4.38 * run));
  const readout = run >= 1 ? '4 HR 23 MIN' : `${hrs} HR`;
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.04, easeIO(fr, 0, p.dur)), fx: 540, fy: 960})}>
      <SVG>
        <WardWorld f={f} seed={8} windowX={860} windowW={260} floorY={1300} near="counter" />
        <HeldTravel f={f} x={240} y={600} w={600} h={620} mode="sweep" seed={19}>
          <rect x={240} y={600} width={600} height={620} rx={14} fill="#3B4A48" />
        </HeldTravel>
        <g transform={`translate(540 ${900 + slam * 4})`}>
          <rect x={-300} y={-300} width={600} height={620} rx={14} fill="#3B4A48" stroke={INK} strokeWidth={8} />
          <rect x={-276} y={-276} width={552} height={572} rx={8} fill="#E7E2D2" stroke={INK} strokeWidth={4} />
          <Stopwatch f={f} x={0} y={-20} r={200} sweep={sweep} accent={PING.brass} />
          {run < 1 && <path d={`M 0 -20 L ${Math.cos(sweep * Math.PI * 2 - Math.PI / 2 - 0.25) * 170} ${-20 + Math.sin(sweep * Math.PI * 2 - Math.PI / 2 - 0.25) * 170}`} stroke={PING.ink} strokeWidth={8} opacity={0.25} />}
          <g transform="translate(0 240)">
            <rect x={-150} y={-30} width={300} height={56} rx={6} fill="#22383B" stroke={INK} strokeWidth={4} />
            <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} fill={PING.bone}>{readout}</text>
          </g>
        </g>
        {hand > 0.02 && (
          <g transform={`translate(780 ${720 + 4 * Math.sin(f / 9)}) rotate(${(1 - Math.min(1, hand)) * 40 + 4 * Math.sin(f / 13)})`}>
            <path d="M 0 -40 L 0 0" stroke={INK} strokeWidth={3} />
            <circle cx={0} cy={-40} r={6} fill={PING.steel} stroke={INK} strokeWidth={3} />
            <rect x={-110} y={0} width={220} height={50} rx={5} fill={PING.paper} stroke={INK} strokeWidth={4} />
            <text x={0} y={33} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK}>FROM ARRIVAL</text>
          </g>
        )}
        <Plate x={540} text="AFTER HE ARRIVED" y={540} size={30} tone="dark" p={ease(f, b(44) + 2, 8) * (1 - ease(f, b(21) - 7, 6))} />
        <Plate x={540} text="4 HR 23 MIN · CLOT OUT" y={610} size={34} p={ease(f, b(21) + 2, 8) * (1 - ease(f, b(22) - 7, 6))} />
        <Plate x={540} text="CLOT OUT" y={680} size={34} tone="dark" p={ease(f, b(22) + 2, 8)} />
      </SVG>
    </Frame>
  );
};

// ---- S10: INFORMATION FIRST (the signature split: left three outlined gurney tokens on converging distance lines; right Anchorage already lit)
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const k = clamp01(f / Math.max(1, b(45) + 10));
  const lights = clamp01((f - b(24) + 4) / 24);
  const gowns = clamp01((f - b(24) - 6) / 30);
  const plate = spr(f, b(25), 16);
  const cross = easeIO(f, b(45) - 6, 30);
  const lines: [number, number][] = [[1200, 0], [1000, 1], [1400, 2]];
  return (
    <Frame p={p} cam={(fr) => ({z: 1.0, fx: 540, fy: 960})}>
      <SVG>
        <defs><clipPath id="s10l"><rect data-band="ok" x={0} y={0} width={538} height={1920} /></clipPath><clipPath id="s10r"><rect data-band="ok" x={542} y={0} width={538} height={1920} /></clipPath></defs>
        <g clipPath="url(#s10l)">
          <rect data-band="ok" x={0} y={0} width={540} height={1920} fill="#2A4044" />
          {Array.from({length: 24}, (_, i) => <circle key={i} cx={(i * 47 + f * 0.6) % 540} cy={(i * 131 + f * (1.6 + (i % 3) * 0.5)) % 1920} r={2.5} fill="#DDE7EA" opacity={0.5} />)}
          {lines.map(([y0, i]) => {
            const y1 = 1000;
            const t = clamp01(0.15 + 0.6 * k + (i === 0 ? cross * 0.3 : 0) - i * 0.06);
            const gx = lerp(20, 540, t), gy = lerp(y0 * 0.55 + 300, y1, t);
            return (
              <g key={i}>
                <line x1={20} y1={y0 * 0.55 + 300} x2={540} y2={y1} stroke="#8FA9A6" strokeWidth={5} strokeDasharray="16 12" />
                {Array.from({length: 6}, (_, j) => <line key={j} x1={20 + j * 100} y1={lerp(y0 * 0.55 + 300, y1, j * 100 / 520) - 10} x2={20 + j * 100} y2={lerp(y0 * 0.55 + 300, y1, j * 100 / 520) + 10} stroke="#8FA9A6" strokeWidth={3} />)}
                {!(i === 0 && cross >= 1) && (
                  <g transform={`translate(${gx} ${gy}) scale(1.1)`}>
                    <g opacity={0.95}><GurneyToken f={f + i * 13} x={0} y={0} s={1} seed={i} /></g>
                  </g>
                )}
              </g>
            );
          })}
          <text x={40} y={1180} fontFamily={MONO} fontWeight={800} fontSize={22} fill="#8FA9A6">DISTANCE</text>
        </g>
        <g clipPath="url(#s10r)">
          <g transform="translate(270 0)">
            <HeldTravel f={f} x={0} y={0} w={1080} h={1920} mode="shadow" seed={20}>
              <WardWorld f={f} warm={1} seed={10} windowX={700} windowW={220} floorY={1300} near="desk" />
            </HeldTravel>
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${430 + i * 190} 300)`}>
                <rect x={-70} y={-14} width={140} height={28} rx={8} fill="#E8DCC0" stroke={INK} strokeWidth={4} />
                <ellipse cx={0} cy={14} rx={60} ry={12} fill={PING.lamp} opacity={clamp01(lights * 3 - i)} />
                {clamp01(lights * 3 - i) > 0.5 && <path d="M -110 30 L -190 520 L 190 520 L 110 30 Z" fill={PING.lamp} opacity={0.16} />}
              </g>
            ))}
            <GownHooks f={f} x={640} y={760} n={3} ready={gowns} />
            <g transform="translate(470 1300)">
              <rect x={-130} y={-560} width={260} height={560} fill="#8C6B4E" stroke={INK} strokeWidth={6} />
              <rect x={-104} y={-520} width={208} height={150} rx={6} fill={PING.night} stroke={INK} strokeWidth={4} />
              <g transform="translate(0 -330) rotate(-3)"><rect x={-80} y={-34} width={160} height={68} rx={4} fill={PING.paper} stroke={INK} strokeWidth={4} /><text x={0} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>TRANSFER</text><text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>CALL</text><circle cx={0} cy={-40} r={6} fill={PING.steel} stroke={INK} strokeWidth={2} /></g>
              {plate > 0.02 && (
                <g transform={`translate(0 -170) rotate(${(1 - Math.min(1, plate)) * -40})`}>
                  <rect x={-118} y={-52} width={236} height={104} rx={6} fill={PING.paper} stroke={INK} strokeWidth={4} />
                  <text x={0} y={-14} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK}>ABOUT 30%</text>
                  <text x={0} y={18} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>FASTER START</text>
                </g>
              )}
            </g>
            {cross > 0 && cross < 1 && <GurneyToken f={f} x={lerp(280, 470, cross)} y={1290} s={1.4} />}
            {cross >= 1 && <GurneyToken f={f} x={470} y={1290} s={1.4} />}
          </g>
        </g>
        <rect data-band="ok" x={536} y={0} width={8} height={1920} fill={INK} />
        <Plate x={540} text="INFORMATION FIRST · ANY TRANSFER" y={560} size={30} tone="coral" p={ease(f, 4, 10) * (1 - ease(f, b(24) - 7, 6))} />
        <Plate x={540} text="THE ROOM GETS READY" y={630} size={30} p={ease(f, b(24) + 2, 8) * (1 - ease(f, b(25) - 7, 6))} />
        <Plate x={540} text="ABOUT 30% FASTER START · EARLY DATA · PER STAT" y={700} size={26} p={ease(f, b(25) + 4, 10) * (1 - ease(f, b(45) - 7, 6))} />
        <Plate x={540} text="ONCE PATIENTS REACH ANCHORAGE" y={770} size={30} tone="dark" p={ease(f, b(45) + 2, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S11: THE PROOF DESK (warm Anchorage room; Ping slides the stopwatch to the faceless Isaacs; she hits the two lit rows; the OUTCOMES row is taped)
const ROWS = (flap: boolean) => [
  {label: 'TIME TO CALL', value: 'UNDER 30 MIN · ONE CASE', lit: 1},
  {label: 'TIME TO START', value: 'ABOUT 30% FASTER · EARLY DATA', lit: 1},
  {label: 'OUTCOMES', lit: 0, flap},
];
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slide = easeIO(f, 2, 26);
  const reach = ease(f, b(40) - 8, 12) * (1 - ease(f, b(27) - 6, 10));
  const open = ease(f, b(27) - 2, 14);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.05, easeIO(fr, 0, p.dur)), fx: 540, fy: lerp(1020, 980, easeIO(fr, 0, p.dur))})} warmth={0.06}>
      <SVG>
        <HeldTravel f={f} x={0} y={0} w={1080} h={1920} mode="shadow" seed={21}>
          <WardWorld f={f} warm={1} seed={11} windowX={180} windowW={240} floorY={1290} near="desk" />
        </HeldTravel>
        <Scoreboard f={f} x={720} y={540} s={0.66} rows={ROWS(true)} />
        <g data-band="ok">
          <rect x={40} y={1170} width={640} height={40} rx={6} fill="#8C6B4E" stroke={INK} strokeWidth={6} />
          <rect x={80} y={1210} width={30} height={110} fill="#6E5440" stroke={INK} strokeWidth={5} />
          <rect x={610} y={1210} width={30} height={110} fill="#6E5440" stroke={INK} strokeWidth={5} />
        </g>
        <Stopwatch f={f} x={lerp(220, 520, slide)} y={1122} r={46} sweep={4.38} accent={PING.brass} />
        <g transform="translate(180 1170)">
          <g opacity={1}><Ping f={f} x={0} y={0} s={0.7} emotion={f > b(27) + 10 ? 'sheepish' : 'proud'} arm={slide > 0 && slide < 1 ? 1 : 0} cues={[b(26), b(27)]} seed={12} /></g>
        </g>
        <FigureFinish x={830} footY={1300} w={170} h={360} keySide="left" outline={4}>
          <IdleFigure f={f} x={830} footY={1300} h={360} seed={13} cues={[b(40), b(27)]}>
            <Suit f={f} x={830} y={1300} s={1.2} seed={13} cues={[b(40), b(27)]} coat="#5E6E7A" face={false} longHair reach={Math.max(reach, open * 0.5)} facing={-1} />
          </IdleFigure>
        </FigureFinish>
        <NameCard x={930} y={1300} text="KELLY ISAACS" size={20} f={f} />
        <Plate x={470} text="KELLY ISAACS · PROVIDENCE STROKE PROGRAM" y={1262} size={26} p={ease(f, b(26) + 4, 10) * (1 - ease(f, b(40) - 7, 6))} />
        <Plate x={470} text="TIME TO CALL · TIME TO START · OUTCOMES" y={1192} size={26} p={ease(f, b(40) + 2, 8) * (1 - ease(f, b(27) - 7, 6))} />
        <Plate x={470} text="KELLY ISAACS · PER STAT" displayLines={['"CAN I GIVE YOU STATISTICALLY SIGNIFICANT', 'INFORMATION THAT RAPIDAI HAS MADE A BIG', 'DIFFERENCE IN THE STATE OF ALASKA?', 'I CAN\'T, REALLY."', 'KELLY ISAACS · PER STAT']} y={900} size={19} p={ease(f, b(27) + 4, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S12: THE BINDER AND THE FALSE ALARM (a binder of mismatched outcome forms; focus pulls to Ping yelling at a clear slice; an inset pager blinks)
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const openB = spr(f, 2, 18);
  const pullF = easeIO(f, b(29) - 10, 14);
  const puff = spr(f, b(29) - 4, 10) * (1 - ease(f, b(29) + 34, 12));
  const deflate = ease(f, b(29) + 34, 12);
  const blink = f > b(29) + 2 && f < b(29) + 50 && Math.floor(f / 4) % 2 === 0;
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.05, 1.0, easeIO(fr, 0, p.dur)), fx: lerp(420, 640, pullF), fy: 1000})}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#2E3A39" />
        <HeldTravel f={f} x={0} y={420} w={1080} h={900} mode="shadow" seed={22}>
        {[0, 1, 2].map((r) => (
          <g key={r} transform={`translate(0 ${420 + r * 300})`}>
            <rect x={-40} y={240} width={1160} height={26} fill="#6E5A48" stroke={INK} strokeWidth={5} />
            {Array.from({length: 16}, (_, i) => <rect key={i} x={i * 70 + (r * 23) % 40} y={240 - 150 - (i % 3) * 18} width={56} height={150 + (i % 3) * 18} rx={3} fill={['#4E6E66', '#7A6A54', '#5A6A7A'][(i + r) % 3]} stroke={INK} strokeWidth={3} opacity={0.75 - 0.25 * pullF} />)}
          </g>
        ))}
        </HeldTravel>
        <ellipse cx={300} cy={1150} rx={420} ry={260} fill="#FFE9B8" opacity={0.18} />
        <NearDesk f={f} seed={12} />
        {/* the binder, foreground left */}
        <g transform="translate(330 1180)" opacity={1 - 0.45 * pullF}>
          <ContactShadow cx={0} cy={60} rx={260} ry={18} opacity={0.45} />
          <rect x={-250} y={-30} width={500} height={90} fill="#6E5A48" stroke={INK} strokeWidth={6} />
          {Array.from({length: 7}, (_, i) => {
            const flut = Math.sin(f / 5 + i) * 6 * (1 - openB * 0.5);
            const kind = i % 3;
            return (
              <g key={i} transform={`translate(${lerp(0, -180 + i * 60, Math.min(1.1, openB))} ${-40 - i * 4 * openB}) rotate(${(-14 + i * 5) * openB + flut * 1.6})`}>
                <rect x={-60} y={-160} width={120} height={160} fill={kind === 0 ? PING.paper : kind === 1 ? '#E6E0C8' : '#F2ECDD'} stroke={INK} strokeWidth={3} />
                {kind !== 2 && Array.from({length: kind === 0 ? 5 : 2}, (_, j) => <rect key={j} x={-48} y={-146 + j * 22} width={80 - j * 8} height={7} fill="#9A9586" />)}
                {kind === 2 && <line x1={-48} y1={-120} x2={48} y2={-120} stroke="#9A9586" strokeWidth={3} strokeDasharray="6 6" />}
              </g>
            );
          })}
        </g>
        {/* the small viewer with a clear slice, behind */}
        <g transform="translate(800 1020)" opacity={0.55 + 0.45 * pullF}>
          <rect x={-120} y={-120} width={240} height={240} rx={10} fill="#111A1C" stroke={INK} strokeWidth={6} />
          <BrainSlice x={0} y={0} r={96} clot={0} seed={14} />
        </g>
        <g transform="translate(680 1300)" opacity={0.6 + 0.4 * pullF}>
          <Ping f={f} x={0} y={0} s={0.85 * (1 + 0.25 * puff) * (1 - 0.12 * deflate)} emotion={deflate > 0.3 ? 'deflated' : puff > 0.2 ? 'alert' : 'curious'} arm={puff} squash={deflate * 0.8} cues={[b(28), b(29)]} seed={15} look={1} />
        </g>
        {/* the inset: the specialists' pager blinking */}
        {f > b(29) && (
          <g transform="translate(870 790)">
            <rect x={-110} y={-90} width={220} height={180} rx={8} fill={PING.paper} stroke={INK} strokeWidth={5} />
            <rect x={-38} y={-60} width={76} height={110} rx={10} fill="#2E3A39" stroke={INK} strokeWidth={5} />
            <circle cx={0} cy={-30} r={14} fill={PING.bone} opacity={blink ? 1 : 0.3} />
            <text x={0} y={78} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={INK}>SPECIALIST PAGER</text>
          </g>
        )}
        <Plate x={540} text="NO CONSISTENT STROKE OUTCOME REPORTING" y={560} size={26} tone="dark" p={ease(f, b(28) + 4, 10) * (1 - ease(f, b(29) - 7, 6))} />
        <Plate x={540} text="FALSE POSITIVES" y={630} size={34} p={ease(f, b(29) + 2, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S13: THE DOCTOR'S READ (from above a hand rolls Ping a half turn and its glow drains to grey; then turns a desk slip from ALERT to CLEAR; the pager goes dark by itself)
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const reachK = easeIO(f, b(30) - 8, 14);
  const turn = easeIO(f, b(30) + 4, 14);
  const grey = clamp01((f - b(30) - 8) / 14);
  const toSlip = easeIO(f, b(31) - 14, 12);
  const handX = lerp(1200, 700, reachK) + lerp(0, -250, toSlip);
  const handY = lerp(820, 1080, toSlip);
  const flipT = clamp01((f - b(31) + 2) / 12);
  const dark = f > b(31) + 8;
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.04, 1.0, easeIO(fr, 0, p.dur)), fx: 540, fy: 980})}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#7E6A56" />
        <HeldTravel f={f} x={0} y={0} w={1080} h={1920} mode="shadow" seed={23}>
          <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#7E6A56" />
          {Array.from({length: 14}, (_, i) => <path key={i} d={`M -40 ${i * 150 + 40} Q 540 ${i * 150 + 60} 1120 ${i * 150 + 30}`} stroke="#6E5A48" strokeWidth={4} fill="none" />)}
        </HeldTravel>
        <g data-band="ok">
          <g transform="translate(860 1720) rotate(-12)"><rect x={-130} y={-60} width={260} height={120} rx={4} fill="#C9B48E" stroke={INK} strokeWidth={4} /><rect x={-110} y={-80} width={150} height={30} rx={3} fill="#E9D9A6" stroke={INK} strokeWidth={3} /></g>
          <g transform="translate(200 1780)"><ellipse cx={0} cy={0} rx={70} ry={26} fill="none" stroke="#5E4A38" strokeWidth={6} opacity={0.6} /></g>
          <g transform="translate(520 1830) rotate(8)"><rect x={-110} y={-9} width={220} height={18} rx={9} fill="#2E4A5A" stroke={INK} strokeWidth={4} /><path d="M 110 -9 L 134 0 L 110 9 Z" fill={PING.bone} stroke={INK} strokeWidth={3} /></g>
        </g>
        {/* the desk slip, turned over by the doctor's read */}
        <g transform={`translate(330 1180) rotate(-5) scale(1 ${flipT < 0.5 ? 1 - flipT * 2 : (flipT - 0.5) * 2})`}>
          <ContactShadow cx={0} cy={70} rx={220} ry={12} opacity={0.4} />
          <rect x={-210} y={-70} width={420} height={140} rx={6} fill={flipT < 0.5 ? '#EDE0C2' : PING.paper} stroke={INK} strokeWidth={5} />
          {flipT < 0.5 ? (
            <text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={44} fill={INK}>ALERT</text>
          ) : (
            <g><text x={0} y={-8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={44} fill={INK}>CLEAR</text><text x={0} y={40} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={INK}>NO TRANSFER CALL</text></g>
          )}
        </g>
        {/* the pager inset, which goes dark on its own */}
        <g transform="translate(900 1440)">
          <rect x={-90} y={-70} width={180} height={140} rx={8} fill={PING.paper} stroke={INK} strokeWidth={4} />
          <rect x={-30} y={-40} width={60} height={84} rx={8} fill="#2E3A39" stroke={INK} strokeWidth={4} />
          <circle cx={0} cy={-18} r={10} fill={PING.bone} opacity={dark ? 0.12 : (Math.floor(f / 4) % 2 ? 1 : 0.35)} />
        </g>
        <g transform={`translate(700 1000) rotate(${turn * 180})`}>
          <Ping f={f} x={0} y={90} s={1.0} emotion={grey > 0.5 ? 'hopeful' : 'sheepish'} grey={grey} cues={[b(30), b(31)]} seed={16} />
        </g>
        <g transform={`translate(${handX} ${handY})`}>
          <StrikeProp f={f} at={[b(31)]} px={0} py={60} lift={40}>
            <path d="M 0 0 Q 60 -20 160 -10 L 420 -10 L 420 80 L 160 90 Q 40 100 0 60 Z" fill="#C99A78" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M 160 -10 L 420 -10 L 420 80 L 160 90 Z" fill="#E9F1EE" stroke={INK} strokeWidth={6} />
            {[0, 1, 2].map((i) => <path key={i} d={`M ${10 + i * 26} ${4 + i * 6} q -26 10 -16 34`} stroke={INK} strokeWidth={5} fill="#C99A78" />)}
          </StrikeProp>
        </g>
        <Plate x={540} text="A DOCTOR REVIEWS EVERY OUTPUT" y={560} size={30} p={ease(f, b(30) + 4, 10) * (1 - ease(f, b(31) - 7, 6))} />
        <Plate x={540} text="THAT READ DECIDES THE TRANSFER" y={630} size={30} tone="dark" p={ease(f, b(31) + 2, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S14: KEEP AND PAY (six separate framed hospital vignettes brighten; tags flip to KEEP + PAY)
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lit = clamp01((f - b(32) + 2) / 36);
  const flip = clamp01((f - b(33)) / 18);
  const cols = ['#6E5A64', '#4F5A6A', '#7A5A3E', '#5A4A6A', '#6A5048', '#4E5E58'];
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.04, easeIO(fr, 0, p.dur)), fx: 540, fy: 960})} bg="#22383B">
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#22383B" />
        <HeldTravel f={f} x={50} y={540} w={980} h={780} mode="sweep" seed={24}>
          <rect x={50} y={540} width={980} height={780} fill="#22383B" />
        </HeldTravel>
        <g data-band="ok">
          <rect x={-40} y={1560} width={1160} height={400} fill="#3B4A48" stroke={INK} strokeWidth={6} />
          {Array.from({length: 6}, (_, i) => <g key={i} transform={`translate(${110 + i * 172} 1700)`}><rect x={-40} y={-30} width={80} height={60} rx={6} fill="#2E3A39" stroke={INK} strokeWidth={4} /><circle cx={0} cy={0} r={14} fill="#FFD9A0" opacity={clamp01(lit * 6 - i) > 0.5 ? 0.9 : 0.15} /></g>)}
          <path d="M -40 1820 H 1120" stroke="#2A3634" strokeWidth={8} />
        </g>
        {cols.map((c, i) => {
          const cx = 200 + (i % 3) * 340, cy = 690 + Math.floor(i / 3) * 400;
          const on = clamp01(lit * 6 - i);
          const fl = clamp01(flip * 6 - i);
          return (
            <g key={i} transform={`translate(${cx} ${cy})`}>
              <defs><clipPath id={`v${i}`}><rect x={-150} y={-180} width={300} height={360} rx={8} /></clipPath></defs>
              <g clipPath={`url(#v${i})`}>
                <rect x={-150} y={-180} width={300} height={360} fill={['#2D4660', '#33506E', '#2A425C', '#3A4E6E', '#26405A', '#30486A'][i]} />
                <path d={`M -150 ${-20 + (i % 2) * 20} L ${-60 + i * 10} ${-90} L ${40 - i * 6} ${-40} L 150 ${-100 + i * 8} V 60 H -150 Z`} fill="#22344A" />
                <rect x={-150} y={60} width={300} height={120} fill="#DCE6E8" />
                <path d={`M ${-80 - (i % 3) * 8} 60 V ${-40 - (i % 2) * 20} H ${80 + (i % 3) * 8} V 60 Z`} fill={c} stroke={INK} strokeWidth={5} />
                <path d="M -96 -36 L 0 -86 L 96 -36" stroke="#F4F7F8" strokeWidth={12} fill="none" strokeLinecap="round" />
                <path d="M -10 -70 h 20 M 0 -80 v 20" stroke="#F4F7F8" strokeWidth={6} />
                {[-46, 0, 46].map((wx, j) => <rect key={j} x={wx - 16} y={-20} width={32} height={28} rx={3} fill={on > 0.5 ? '#FFD9A0' : '#1B2C40'} stroke={INK} strokeWidth={3} />)}
                {on > 0.5 && <ellipse cx={0} cy={-6} rx={90} ry={40} fill="#FFD9A0" opacity={0.15 + 0.05 * Math.sin(f / 7 + i)} />}
                {Array.from({length: 10}, (_, j) => <circle key={j} cx={-150 + ((j * 37 + f * 0.8 + i * 13) % 300)} cy={-180 + ((j * 53 + f * 2.2) % 360)} r={2.5} fill="#F4F7F8" opacity={0.7} />)}
              </g>
              <rect x={-150} y={-180} width={300} height={360} rx={8} fill="none" stroke={INK} strokeWidth={7} />
              <g transform={`translate(0 196) scale(1 ${fl > 0.5 ? (fl - 0.5) * 2 : 1 - fl * 2})`}>
                <rect x={-80} y={-22} width={160} height={44} rx={5} fill={fl > 0.5 ? PING.paper : '#C9C0A8'} stroke={INK} strokeWidth={4} />
                <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>{fl > 0.5 ? 'KEEP + PAY' : 'FREE ACCESS'}</text>
              </g>
            </g>
          );
        })}
        <Plate x={540} text="6 HOSPITALS · FREE ACCESS" y={500} size={30} p={ease(f, b(32) + 4, 10) * (1 - ease(f, b(33) - 7, 6))} />
        <Plate x={540} text="ALL 6 SAY THEY'LL KEEP AND PAY" y={570} size={30} p={ease(f, b(33) + 4, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S15: THE PLANNED NETWORK (a dusk horizon; the CMS plate drops at one outline; stakes knock in; the view pulls back as 21 outlines pop; end tags)
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cms = spr(f, 2, 16);
  const stakes = clamp01((f - b(47) + 2) / 24);
  const net = clamp01((f - b(41) + 2) / 30);
  const pop = clamp01((f - b(34) + 2) / 40);
  const pull = easeIO(f, b(34) - 6, 60);
  const ends = spr(f, b(36), 16);
  const xs = Array.from({length: 21}, (_, i) => 70 + i * 47);
  const hy = (x: number) => 1060 - 30 * Math.sin(x / 170) - 18 * Math.sin(x / 61);
  return (
    <Frame p={p} overlay={<>
          <Plate x={540} text="OVER $3.1M · FEDERAL RURAL HEALTH MONEY · CMS" y={780} size={26} p={ease(f, 4, 10) * (1 - ease(f, b(47) - 7, 6))} />
          <Plate x={540} text="IS SET TO BUILD" y={850} size={30} tone="dark" p={ease(f, b(47) + 2, 8) * (1 - ease(f, b(41) - 7, 6))} />
          <Plate x={540} text="AI IMAGING NETWORK · PLANNED" y={920} size={30} p={ease(f, b(41) + 2, 8) * (1 - ease(f, b(34) - 7, 6))} />
          <Plate x={540} text="PLANNED · 21 HOSPITALS" y={990} size={30} p={ease(f, b(34) + 2, 8) * (1 - ease(f, b(36) - 7, 6))} />
          <Plate x={540} text="UTQIAGVIK TO JUNEAU" y={1060} size={30} p={ease(f, b(36) + 2, 10)} />
        </>} cam={(fr) => ({z: lerp(2.2, 1.12, pull), fx: lerp(220, 540, pull), fy: lerp(1040, 1000, pull)})}>
      <SVG>
        <defs><linearGradient id="dusk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#22344E" /><stop offset="0.7" stopColor="#4E6A88" /><stop offset="1" stopColor="#E8B98A" /></linearGradient></defs>
        <rect x={-40} y={-40} width={1160} height={1140} fill="url(#dusk)" />
        <path d="M -40 980 L 120 900 L 260 960 L 430 860 L 600 950 L 760 880 L 940 950 L 1120 900 V 1080 H -40 Z" fill="#3A4E66" opacity={0.7} />
        <HeldTravel f={f} x={0} y={900} w={1080} h={1060} mode="shadow" seed={25}>
          <path d={`M -40 ${hy(-40)} ${xs.concat([1120]).map((x) => `L ${x} ${hy(x)}`).join(' ')} V 1960 H -40 Z`} fill="#DDE6EA" stroke={INK} strokeWidth={5} />
        </HeldTravel>
        {net > 0 && <path d={`M 70 ${hy(70) - 30} ${xs.filter((_, i) => i / 20 <= net).map((x) => `L ${x} ${hy(x) - 30}`).join(' ')}`} stroke={INK} strokeWidth={3} strokeDasharray="6 8" fill="none" opacity={0.7} />}
        {stakes > 0 && xs.map((x, i) => (i % 2 === 1 && i / 20 <= stakes ? <g key={`s${i}`}><rect x={x - 3} y={hy(x) - 40} width={6} height={40} fill="#B8924A" stroke={INK} strokeWidth={2} /><rect x={x - 3} y={hy(x) - 40} width={6} height={8} fill="#E8487F" /></g> : null))}
        {xs.map((x, i) => {
          const on = i === 0 ? 1 : clamp01(pop * 21 - i);
          if (on <= 0) return null;
          const sc = 1 - Math.exp(-6 * on) * Math.cos(9 * on) * 0.8;
          return (
            <g key={i} transform={`translate(${x} ${hy(x)}) scale(${sc * 1.5})`}>
              <path d="M -16 0 V -22 L 0 -34 L 16 -22 V 0 Z" fill="none" stroke={INK} strokeWidth={3.5} strokeDasharray="6 4" strokeLinejoin="round" />
              <path d="M -5 -15 h 10 M 0 -20 v 10" stroke={INK} strokeWidth={3} />
            </g>
          );
        })}
        <g transform={`translate(260 ${hy(260)})`}>
          <rect x={-4} y={-150} width={8} height={150} fill="#6E5A48" stroke={INK} strokeWidth={3} />
          <ContactShadow cx={0} cy={2} rx={20} ry={5} opacity={0.4} />
          {cms > 0.02 && <g transform={`translate(0 ${lerp(-300, -150, Math.min(1, cms))})`}><rect x={-(monoW('OVER $3.1M · CMS', 16) + 28) / 2} y={-26} width={monoW('OVER $3.1M · CMS', 16) + 28} height={44} rx={4} fill={PING.paper} stroke={INK} strokeWidth={3} /><text x={0} y={4} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={16} fill={INK}>OVER $3.1M · CMS</text></g>}
        </g>
        {ends > 0.02 && (
          <g>
            <PegTag x={190} y={hy(190) - 130} text="UTQIAGVIK" f={f} k={ends} size={18} />
            <PegTag x={900} y={hy(900) - 130} text="JUNEAU" f={f} k={ends} size={18} />
          </g>
        )}
        <NearSnow f={f} seed={15} />
      </SVG>
    </Frame>
  );
};

// ---- S16: KEEP SCORE (Ping brings the stopwatch to the RESULTS nail where the scoreboard hangs, tugs off the paper: OUTCOMES is a dashed blank; pull back through the ring)
const S16: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const carry = easeIO(f, 0, 30);
  const tug = clamp01((f - 36) / 16);
  const pull = easeIO(f, b(38) - 10, 50);
  return (
    <Frame p={p} overlay={<>
          <Plate x={540} text="THE TIMES ARE ON THE BOARD" y={1262} size={28} p={ease(f, 4, 10) * (1 - ease(f, b(38) - 7, 6))} />
          <Plate x={540} text="WHAT SHOULD ALASKA MEASURE?" y={1192} size={34} tone="coral" p={ease(f, b(38) + 2, 10)} />
        </>} cam={(fr) => ({z: lerp(1.3, 1.0, pull), fx: lerp(400, 540, pull), fy: lerp(900, 960, pull)})}>
      <SVG>
        <WardWorld f={f} seed={1} windowX={250} windowW={360} floorY={1320} near="cart" />
        <HeldTravel f={f} x={470} y={650} w={540} h={640} mode="sweep" seed={26}>
          <CTRing f={f} x={740} y={930} s={0.88} table={0.7} glow={0.7} spin={0.4}>
            <BrainSlice x={0} y={-6} r={124} clot={0} seed={2} />
          </CTRing>
        </HeldTravel>
        <g transform="translate(290 560)">
          <Scoreboard f={f} x={0} y={0} s={0.72} rows={ROWS(tug < 0.5)} />
        </g>
        {tug > 0.4 && tug < 1 && (
          <g transform={`translate(${290 + 80 * tug} ${790 + 500 * (tug - 0.4) * (tug - 0.4) * 6}) rotate(${tug * 80})`}>
            <rect x={-120} y={-20} width={240} height={42} fill={PING.paper} stroke={INK} strokeWidth={3} />
          </g>
        )}
        <g transform={`translate(${lerp(620, 300, carry)} 1110)`}>
          <Ping f={f} x={0} y={0} s={0.8} emotion={tug >= 1 ? 'curious' : 'hopeful'} arm={tug > 0 && tug < 1 ? 1 : 0.3} cues={[b(37), b(38)]} seed={17} look={-1} />
          <g transform="translate(110 -90)"><Stopwatch f={f} x={0} y={0} r={36} sweep={4.38} accent={PING.brass} /></g>
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

export const ep1126Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1126Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1126: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 8.6, 13.9, 21.5, 31.1, 35.9, 41.6, 47.4, 56.8, 62.5, 72.5, 82.5, 88.7, 94, 98.4, 108.4, 115.1].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.bg}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#22383B" ink="#F4F1E6" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
