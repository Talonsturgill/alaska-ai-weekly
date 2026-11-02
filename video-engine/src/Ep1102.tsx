import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer} from './lib/lighting';
import {VoiceProvider, useVoice} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {MONO, monoW} from './lib/prospect';
import {StampBot} from './lib/credentials';
import {AK_PATH} from './lib/akmap';
import {IDS} from './Ep1102Ids';

// The Door Is Yours, 2026-11-02. Palette roles are art_direction.json. CLICKY is a gunmetal faced counter on the dash of a night cab, the car's own recorder.
// THE FOB is the throughline, a nickel key fob whose tag changes: ENROLLED? (S1), ? (S3), NOT ENROLLED (S7), dark (S9), ASK FIRST (S10), YES? (S12), YOUR CALL (S13).
// Amber is LIGHT only. Magenta is ALLEGED, NOT ENROLLED and NO ADMISSION only. Teal is the data stream. Bone paper lives in S8 and S9 only.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

export const C = {
  sky: '#1A1740', ground: '#262252', gun: '#8C93A3', gunD: '#5C6272', glow: '#FF9A1F', mag: '#E0338A', shadow: '#0B0A1F', paper: '#EDE6D3', ink: '#120F2A',
  dash: '#34306B', teal: '#00E0C6', fob: '#BFC7D5', white: '#F4F1EA', cream: '#D9DCE6',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const springy = (f: number, a: number, d = 26) => {
  const k = clamp01((f - a) / d);
  return k <= 0 ? 0 : 1 - Math.exp(-5.5 * k) * Math.cos(k * 9);
};
const bump = (f: number, a: number, d = 14) => {
  const k = clamp01((f - a) / d);
  return k <= 0 || k >= 1 ? 0 : Math.sin(k * Math.PI) * (1 - k * 0.3);
};

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'dark' | 'plate' | 'warn' | 'glow';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#0F0D2B', fg: '#EDE6D3', edge: '#EDE6D3'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.mag, edge: C.mag},
  glow: {fill: C.glow, fg: C.ink, edge: C.ink},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'dark', p = 1, rot = 0, drop = 0}) => {
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
    <g opacity={Math.min(1, k * 1.7)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={t.edge} strokeWidth={4} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

/** a sized label: rect sized by monoW, text centred on it. */
const Lab: React.FC<{text: string; x: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> = ({text, x, y, size = 24, tone = 'plate', p = 1, rot = 0}) => {
  if (p <= 0.01) return null;
  const w = monoW(text, size) + 28, h = size + 22;
  const t = TONES[tone];
  return (
    <g opacity={clamp01(p * 1.8)} transform={`translate(${x} ${y}) rotate(${rot}) scale(${0.9 + 0.1 * clamp01(p)})`}>
      <rect x={-w / 2 + 4} y={-h / 2 + 5} width={w} height={h} rx={5} fill="#000" opacity={0.22} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill={t.fill} stroke={t.edge} strokeWidth={3} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={0.8} fill={t.fg}>{text}</text>
    </g>
  );
};

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; warmth?: number; bg?: string; children: React.ReactNode}> =
({p, cam, z0 = 1, z1 = 1.05, bloom = 0.05, vignette = 0.28, ox = 540, oy = 960, warmth = 0.02, bg = C.sky, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: bg, transform: `translate(${jl.x + 4 * Math.sin(p.f / 23)}px, ${jl.y + 5 * Math.sin(p.f / 17 + 1) + 4 * t}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill={C.ink} stroke="#EDE6D3" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#EDE6D3">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.07} warmth={warmth} />
    </AbsoluteFill>
  );
};

const track = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => {
  const clampC = (c: Cam): Cam => ({z: c.z, fx: Math.max(540 / c.z, Math.min(1080 - 540 / c.z, c.fx)), fy: Math.max(960 / c.z, Math.min(1920 - 960 / c.z, c.fy))});
  if (f <= keys[0].t) return clampC(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i].t) {
      const a = keys[i - 1], bk = keys[i];
      const k = Easing.inOut(Easing.cubic)((f - a.t) / Math.max(1, bk.t - a.t));
      return clampC({z: lerp(a.z, bk.z, k), fx: lerp(a.fx, bk.fx, k), fy: lerp(a.fy, bk.fy, k)});
    }
  }
  return clampC(keys[keys.length - 1]);
};

// ---- the cast ------------------------------------------------------------------------------------------------------------------------
/** CLICKY: the car's recorder. A gunmetal hand counter with eyes. click = frames of last click (squash), look -1..1, mood, off = silent and dim. */
const Clicky: React.FC<{f: number; x: number; y: number; s?: number; click?: number; look?: number; mood?: 'wry' | 'alarmed' | 'warm' | 'focused' | 'puzzled'; off?: boolean; glow?: number; n?: number}> =
({f, x, y, s = 1, click = -999, look = 0, mood = 'wry', off = false, glow = 1, n = 0}) => {
  const sq = bump(f, click, 10);
  const blink = (f % 120) > 114 ? 0.15 : 1;
  const ang = n * 28 + (off ? 0 : 6 * Math.sin(f / 9));
  const mouth = mood === 'alarmed' ? 'M -16,34 q 16,-16 32,0' : mood === 'warm' ? 'M -20,28 q 20,20 40,0' : mood === 'puzzled' ? 'M -16,34 q 8,-8 16,0 t 16,0' : 'M -18,32 q 18,8 36,-2';
  return (
    <g transform={`translate(${x} ${y}) scale(${s * (1 + 0.07 * sq)} ${s * (1 - 0.08 * sq)})`}>
      {!off && <circle r={150} fill={C.glow} opacity={0.18 * glow} />}
      <ellipse cx={0} cy={78} rx={74} ry={13} fill="#000" opacity={0.4} />
      <rect x={-12} y={-100} width={24} height={30} rx={8} fill={C.gunD} stroke={C.ink} strokeWidth={6} />
      <circle r={72} fill={C.gun} stroke={C.ink} strokeWidth={8} />
      <path d="M -62,-24 a 66,66 0 0 1 36,-40" stroke="#C7CCD8" strokeWidth={6} fill="none" opacity={0.7} />
      <circle r={54} fill={C.cream} stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 12}).map((_, i) => <line key={i} x1={0} y1={-48} x2={0} y2={-42} stroke={C.ink} strokeWidth={3} transform={`rotate(${i * 30})`} opacity={0.6} />)}
      <line x1={0} y1={0} x2={0} y2={-40} stroke={C.mag} strokeWidth={4} transform={`rotate(${ang})`} opacity={off ? 0.3 : 0.9} />
      <g transform="translate(0 -12)">
        {[-20, 20].map((ex, i) => (
          <g key={i}>
            <ellipse cx={ex} cy={0} rx={13} ry={13 * (off ? 0.35 : blink)} fill={C.white} stroke={C.ink} strokeWidth={3} />
            <circle cx={ex + look * 5} cy={off ? 2 : 0} r={6} fill={C.ink} />
          </g>
        ))}
        {mood === 'alarmed' && <path d="M -34,-18 l 22,-6 M 34,-18 l -22,-6" stroke={C.ink} strokeWidth={4} />}
        {mood === 'wry' && <path d="M 8,-20 l 26,-8" stroke={C.ink} strokeWidth={4} />}
      </g>
      <path d={mouth} stroke={C.ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** staccato teal rings off a point, one every `period` frames from t0. off = frame at which they die (0 = never). */
const Rings: React.FC<{f: number; x: number; y: number; t0: number; period?: number; off?: number; r?: number}> = ({f, x, y, t0, period = 90, off = 0, r = 260}) => {
  if (f < t0) return null;
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const ff = f - t0 - i * period;
        if (ff < 0) return null;
        const k = (ff % (period * 3)) / (period * 1.2);
        if (k > 1) return null;
        if (off && f > off) return null;
        return <circle key={i} cx={x} cy={y} r={20 + r * k} fill="none" stroke={C.teal} strokeWidth={6 - 4 * k} opacity={0.85 * (1 - k)} />;
      })}
    </g>
  );
};

/** THE FOB: a nickel key fob with an engraved tag. tag text changes, never the silhouette. */
const Fob: React.FC<{x: number; y: number; s?: number; rot?: number; tag?: string; dim?: boolean; glow?: number}> = ({x, y, s = 1, rot = 0, tag = 'ENROLLED?', dim = false, glow = 0}) => {
  const rows = tag.split('|');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {glow > 0 && <circle r={90} fill={C.teal} opacity={0.18 * glow} />}
      <path d="M 0,-96 a 14,14 0 1 1 0.1,0 Z" fill="none" stroke={C.fob} strokeWidth={7} />
      <circle cx={0} cy={-96} r={12} fill="none" stroke={C.fob} strokeWidth={6} />
      <rect x={-46} y={-80} width={92} height={150} rx={34} fill={dim ? '#6D7384' : C.fob} stroke={C.ink} strokeWidth={7} />
      <rect x={-34} y={-62} width={68} height={30} rx={10} fill={dim ? '#4A4F60' : '#8C93A3'} stroke={C.ink} strokeWidth={4} />
      <circle cx={0} cy={-47} r={5} fill={dim ? '#333' : C.teal} />
      <rect x={-38} y={-14} width={76} height={74} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={4} />
      {rows.map((r, i) => <text key={i} x={0} y={14 + i * 22 - (rows.length - 1) * 8 + 8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={rows.length > 1 ? 14 : 15} fill={r.includes('NOT') ? C.mag : C.ink}>{r}</text>)}
    </g>
  );
};

/** a night road seen through a windshield, lines streaming toward the viewer. speed in px/frame, brake 0..1 slows it. */
const Road: React.FC<{f: number; speed?: number; y0?: number; moose?: number}> = ({f, speed = 22, y0 = 470, moose = 0}) => (
  <g>
    <rect x={-100} y={y0} width={1280} height={470} fill="#0D0B26" />
    <path d={`M 540,${y0 + 20} L 40,${y0 + 470} L 1040,${y0 + 470} Z`} fill="#22204C" />
    {Array.from({length: 7}).map((_, i) => {
      const k = (((i * 90 + f * speed * 0.9) % 630) / 630);
      const yy = y0 + 20 + 450 * k * k;
      const w = 6 + 40 * k * k;
      return <rect key={i} x={540 - w / 2} y={yy} width={w} height={10 + 70 * k * k} fill="#EDE6D3" opacity={0.7} />;
    })}
    {Array.from({length: 26}).map((_, i) => {
      const k = (((i * 67 + f * speed * 1.4) % 700) / 700);
      return <circle key={`s${i}`} cx={(i * 211) % 1080} cy={y0 + 450 * k} r={2 + 3 * k} fill="#EDE6D3" opacity={0.35} />;
    })}
    <path d={`M 120,${y0 + 470} L 460,${y0 + 20} L 620,${y0 + 20} L 960,${y0 + 470} Z`} fill={C.glow} opacity={0.12} />
    {moose > 0 && (
      <g transform={`translate(${lerp(1100, 700, ease(moose, 0, 14))} ${y0 + 250}) scale(1.5)`}>
        <ellipse cx={0} cy={68} rx={90} ry={10} fill="#000" opacity={0.4} />
        <rect x={-70} y={-10} width={120} height={60} rx={28} fill="#3A2F2A" stroke={C.ink} strokeWidth={5} />
        <path d="M -52,50 v 40 M -28,50 v 40 M 18,50 v 40 M 38,50 v 40" stroke="#3A2F2A" strokeWidth={9} />
        <path d="M 50,0 q 40,-14 52,10 l -6,24 l -40,-4 z" fill="#3A2F2A" stroke={C.ink} strokeWidth={5} />
        <path d="M 78,-6 l 4,-40 l 18,22 l 18,-26 l -6,44" fill="none" stroke="#6B5A48" strokeWidth={6} />
        <circle cx={92} cy={6} r={3.5} fill={C.glow} />
        <circle cx={0} cy={0} r={0} />
      </g>
    )}
  </g>
);

/** the dash panel and gloved hands on the wheel. */
const Dash: React.FC<{f: number; y?: number; hands?: number}> = ({f, y = 960, hands = 1}) => (
  <g>
    <path d={`M -40,${y} Q 540,${y - 70} 1120,${y} L 1120,1400 L -40,1400 Z`} fill={C.dash} stroke={C.ink} strokeWidth={8} />
    <path d={`M -40,${y} Q 540,${y - 70} 1120,${y}`} fill="none" stroke={C.glow} strokeWidth={3} opacity={0.5} />
    <rect x={-40} y={y + 80} width={1160} height={500} fill="#241F58" opacity={0.7} />
    {hands > 0 && (
      <g opacity={hands}>
        <ellipse cx={540} cy={y + 270} rx={380} ry={44} fill="none" stroke="#0B0A1F" strokeWidth={26} />
        <rect x={190} y={y + 215} width={120} height={78} rx={32} fill="#2B2646" stroke={C.ink} strokeWidth={6} />
        <rect x={770} y={y + 215} width={120} height={78} rx={32} fill="#2B2646" stroke={C.ink} strokeWidth={6} />
        <path d="M 210,y L 210,y" stroke="none" />
      </g>
    )}
  </g>
);

/** a round dash gauge. needle 0..1, label under. */
const Gauge: React.FC<{x: number; y: number; r?: number; needle: number; label?: string; moon?: boolean; flash?: number}> = ({x, y, r = 92, needle, label, moon, flash = 0}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r + 16} fill="#0B0A1F" stroke={C.ink} strokeWidth={6} />
    <circle r={r} fill="#15123A" stroke={C.glow} strokeWidth={4} opacity={0.95} />
    {flash > 0 && <circle r={r + 10} fill={C.mag} opacity={0.25 * flash} />}
    {Array.from({length: 9}).map((_, i) => <line key={i} x1={0} y1={-r + 8} x2={0} y2={-r + 22} stroke={C.white} strokeWidth={4} transform={`rotate(${-120 + i * 30})`} opacity={0.7} />)}
    {moon && <path d="M -18,-30 a 26,26 0 1 0 30,30 a 20,20 0 1 1 -30,-30 z" fill={C.cream} opacity={0.9} />}
    <line x1={0} y1={0} x2={0} y2={-r + 18} stroke={C.glow} strokeWidth={7} strokeLinecap="round" transform={`rotate(${-120 + 240 * clamp01(needle)})`} />
    <circle r={9} fill={C.gun} stroke={C.ink} strokeWidth={4} />
    {label && <text y={r + 50} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1} fill={C.white}>{label}</text>}
  </g>
);

/** THE SIGNATURE SQUARE: a blank dotted square the film carries from the first frame to the last. */
const Square: React.FC<{x: number; y: number; s?: number; fill?: number; label?: string}> = ({x, y, s = 1, fill = 0, label}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-66} y={-66} width={132} height={132} rx={10} fill={C.teal} fillOpacity={0.14 * fill} stroke={C.white} strokeWidth={5} strokeDasharray="12 10" />
    {label && <text y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.white} opacity={fill}>{label}</text>}
  </g>
);

/** the teal data stream: an edgeless river of dots flowing from (x0,y0) toward (x1,y1). width scales the thickness. */
const Stream: React.FC<{f: number; x0: number; y0: number; x1: number; y1: number; n?: number; speed?: number; w?: number; opacity?: number}> = ({f, x0, y0, x1, y1, n = 26, speed = 0.012, w = 1, opacity = 1}) => (
  <g opacity={opacity}>
    {Array.from({length: n}).map((_, i) => {
      const k = ((i / n + f * speed) % 1 + 1) % 1;
      const wob = 14 * Math.sin(k * 9 + i);
      return <circle key={i} cx={lerp(x0, x1, k) + wob * (y1 - y0) / 400} cy={lerp(y0, y1, k) + wob * (x1 - x0) / 400} r={(4 + 4 * Math.sin(i * 1.3 + 2) ** 2) * w} fill={C.teal} opacity={0.9 * Math.sin(Math.PI * k)} />;
    })}
  </g>
);

/** the consent gate: two posts, a hinged bar. lever 0 (COLLECT BY DEFAULT, up) to 1 (ASK FIRST, slammed shut). */
const Gate: React.FC<{x: number; y: number; s?: number; lever: number; open?: number; label?: string; locked?: number}> = ({x, y, s = 1, lever, open = 0, label, locked = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={150} rx={260} ry={22} fill="#000" opacity={0.4} />
    <rect x={-250} y={-230} width={60} height={390} rx={12} fill={C.gun} stroke={C.ink} strokeWidth={8} />
    <rect x={190} y={-230} width={60} height={390} rx={12} fill={C.gun} stroke={C.ink} strokeWidth={8} />
    <g transform={`translate(-190 -20) rotate(${lerp(-70, 0, lever) - open * 82})`}>
      <rect x={0} y={-24} width={380} height={48} rx={16} fill={C.dash} stroke={C.glow} strokeWidth={5} />
      <rect x={20} y={-10} width={340} height={8} fill={C.glow} opacity={0.5} />
    </g>
    {locked > 0 && <rect x={176} y={-34} width={34} height={68} rx={8} fill={C.teal} stroke={C.ink} strokeWidth={5} opacity={locked} />}
    {label && <Lab text={label} x={0} y={215} size={22} tone="glow" />}
  </g>
);

const lastClick = (f: number, t0: number, period = 90) => (f < t0 ? -999 : t0 + Math.floor((f - t0) / period) * period);
const Vig: React.FC<{c?: string}> = ({c = C.sky}) => <rect data-band="ok" x={-1100} y={-1000} width={3280} height={4000} fill={c} opacity={0} />;

// ---- S1: the night cab, Clicky clicks, the diary unrolls -----------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t0 = b(1) + 10;
  const fobIn = springy(f, b(2), 24);
  const diary = ease(f, b(3), 30);
  const rows = Math.floor(clamp01((f - b(3)) / 120) * 9);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={900}>
      <SVG>
        <Road f={f} speed={20} />
        <Dash f={f} />
        <Rings f={f} x={540} y={880} t0={t0} period={90} />
        <Clicky f={f} x={540} y={880} s={1.15} click={lastClick(f, t0)} n={Math.floor(f / 30)} look={Math.sin(f / 50)} />
        <Square x={200} y={1090} s={1} fill={0} />
        <Fob x={880} y={lerp(700, 1060, fobIn)} s={0.9} rot={8 * Math.sin(f / 14) * (1 - fobIn * 0.4)} tag="ENROLLED?" />
        <g opacity={diary} transform={`translate(${lerp(640, 760, diary)} 700)`}>
          <rect x={0} y={0} width={300} height={290} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 9}).map((_, i) => (
            <g key={i} opacity={i < rows ? 1 : 0.15}>
              <line x1={20} y1={34 + i * 28} x2={280} y2={34 + i * 28} stroke={C.ink} strokeWidth={2} opacity={0.5} />
              <text x={26} y={28 + i * 28} fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>{2016 + i}</text>
              <rect x={110} y={14 + i * 28} width={Math.min(160, 30 + i * 14)} height={10} fill={C.teal} opacity={0.8} />
            </g>
          ))}
        </g>
        <Plate x={540} text="SMART DRIVER · ALLEGED" y={520} p={ease(f, b(1) + 6, 14) * (1 - ease(f, b(3) - 10, 8))} size={30} />
        <Plate text="2016 TO 2024 PER THE ATTORNEYS GENERAL" x={540} displayLines={['2016 TO 2024', 'PER THE ATTORNEYS GENERAL']} y={609} p={ease(f, b(3), 14)} size={28} />
      </SVG>
    </Frame>
  );
};

// ---- S2: $220 million, 36 attorneys general -----------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const k = ease(f, b(4), 56);
  const v = Math.round(220 * k);
  const cards = Math.floor(clamp01((f - b(5)) / 40) * 36);
  const ak = ease(f, b(6), 18);
  return (
    <Frame p={p} z0={1.0} z1={1.08} oy={900} bg="#14123A">
      <SVG>
        <rect data-band="ok" x={0} y={0} width={1080} height={1920} fill="#14123A" />
        {Array.from({length: Math.round(2 + 20 * k)}).map((_, i) => (
          <g key={i} transform={`translate(${220 + (i % 2) * 6} ${1070 - i * 17})`}>
            <ellipse cx={0} cy={0} rx={96} ry={22} fill="#C9A24A" stroke={C.ink} strokeWidth={5} />
            <ellipse cx={0} cy={-6} rx={96} ry={22} fill="#E2BC62" stroke={C.ink} strokeWidth={5} />
          </g>
        ))}
        <g transform="translate(250 740)">
          <rect x={-150} y={-60} width={300} height={120} rx={14} fill="#0B0A1F" stroke={C.glow} strokeWidth={6} />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={54} fill={C.glow}>{`$${v}M`}</text>
        </g>
        {Array.from({length: 36}).map((_, i) => {
          const on = i < cards;
          const col = i % 6, row = Math.floor(i / 6);
          const isAk = i === 3;
          const lift = isAk ? ak : 0;
          const dc = i === 35;
          const x = 520 + col * 90, y = 700 + row * 68 - lift * 40;
          const pop = springy(f, b(5) + (i * 40) / 36, 12);
          return on ? (
            <g key={i} transform={`translate(${x} ${dc ? y + 40 : y}) scale(${(1 + 0.4 * lift) * pop})`}>
              <rect x={-38} y={-24} width={76} height={48} rx={6} fill={isAk ? C.glow : C.paper} stroke={dc ? C.teal : C.ink} strokeWidth={dc ? 5 : 3} strokeDasharray={dc ? '8 6' : undefined} />
              <text y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={isAk ? 20 : 17} fill={C.ink}>{isAk ? 'AK' : dc ? 'DC' : ''}</text>
            </g>
          ) : null;
        })}
        <Plate x={540} text="$220 MILLION · PER THE SETTLEMENT" y={518} p={ease(f, b(4), 14) * (1 - ease(f, b(5) - 10, 8))} size={26} />
        <Plate x={540} text="36 ATTORNEYS GENERAL" y={585} p={ease(f, b(5), 14) * (1 - ease(f, b(6) - 10, 8))} size={32} />
        <Plate x={540} text="ALASKA IN" y={656} p={ease(f, b(6), 14)} size={34} />
      </SVG>
    </Frame>
  );
};

// ---- S3: the question, two envelopes -------------------------------------------------------------------------------------------------------
const Envelope: React.FC<{x: number; y: number; label: string; tone: Tone; rattle?: number; crack?: number}> = ({x, y, label, tone, rattle = 0, crack = 0}) => (
  <g transform={`translate(${x + 8 * rattle * Math.sin(y + 40 * rattle)} ${y}) rotate(${4 * rattle * Math.sin(rattle * 40)})`}>
    <rect x={-150} y={-90} width={300} height={190} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <path d="M -150,-90 L 0,20 L 150,-90" fill="none" stroke={C.ink} strokeWidth={5} />
    {crack > 0 && <path d="M -120,-72 L 0,4 L 120,-72" fill="none" stroke={C.glow} strokeWidth={7} opacity={crack} />}
    <Lab text={label} x={0} y={66} size={20} tone={tone} />
  </g>
);

const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const sl = ease(f, b(7), 22);
  const rat = bump(f, b(34), 26) + 0.2 * ease(f, b(34), 12);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={940} bg="#16143F">
      <SVG>
        <rect x={0} y={1010} width={1080} height={300} fill="#2A2358" stroke={C.ink} strokeWidth={6} />
        <Envelope x={lerp(-200, 290, sl)} y={880} label="ONE THING FIXED" tone="plate" />
        <Envelope x={lerp(1280, 790, sl)} y={880} label="ONE THING CAN'T" tone="warn" rattle={bump(f, b(34), 40)} crack={ease(f, b(34), 14)} />
        <Fob x={540} y={900} s={1.1} tag="?" rot={6 * Math.sin(f / 12)} />
        <Plate text="ONE THING FIXED ONE THING CAN'T" x={540} displayLines={['ONE THING FIXED', 'ONE THING CAN\'T']} y={545} p={ease(f, b(7), 14)} size={32} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the gauges, a moose, the city of dots ----------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const brake = bump(f, b(8) + 10, 30);
  const night = ease(f, b(35), 24);
  const t9 = b(9);
  const city = ease(f, t9 + 6, 60);
  const cam = track([{t: 0, z: 1.12, fx: 540, fy: 1000}, {t: t9, z: 1.12, fx: 540, fy: 1000}, {t: t9 + 60, z: 0.9, fx: 540, fy: 900}]);
  return (
    <Frame p={p} cam={cam}>
      <SVG>
        <Road f={f} speed={lerp(22, 6, brake)} moose={Math.max(0, f - b(8))} />
        <Dash f={f} />
        <Rings f={f} x={540} y={880} t0={t9} period={90} r={340} />
        <Clicky f={f} x={540} y={880} s={0.85} click={f > b(8) && f < b(8) + 30 ? b(8) + 10 : lastClick(f, t9 + 4)} mood="alarmed" look={0.8} glow={0.8} />
        <Gauge x={260} y={1130} needle={0.15 + 0.7 * brake} label="HARD BRAKING" flash={brake} />
        <Gauge x={540} y={1130} needle={0.2 + 0.6 * night} label="LATE-NIGHT" moon flash={bump(f, b(35), 30)} />
        <Gauge x={820} y={1130} needle={0.3 + 0.4 * Math.abs(Math.sin(f / 45))} label="LOCATION" />
        <Fob x={920} y={1000} s={0.55} rot={10 * Math.sin(f / 13)} tag="?" />
        {Array.from({length: 90}).map((_, i) => {
          const gx = 70 + (i % 15) * 66, gy = 520 + Math.floor(i / 15) * 60;
          const d = Math.hypot(gx - 540, gy - 700) / 700;
          const on = clamp01((city - d * 0.9) * 4);
          return on > 0 ? <circle key={i} cx={gx} cy={gy} r={9 * on} fill={C.teal} opacity={0.8 * on} /> : null;
        })}
        <Plate x={540} text="HARD BRAKING" y={521} p={ease(f, b(8) + 24, 12) * (1 - ease(f, b(35) - 10, 8))} size={32} />
        <Plate x={540} text="LATE-NIGHT DRIVING" y={590} p={ease(f, b(35), 12) * (1 - ease(f, t9, 8))} size={30} />
        <Plate x={540} text="LOCATION EVERY 3 SECONDS" y={657} p={ease(f, t9, 14)} size={28} />
      </SVG>
    </Frame>
  );
};

// ---- S5: the Broker -------------------------------------------------------------------------------------------------------------------------
const Broker: React.FC<{f: number; x: number; y: number; s?: number; work?: number}> = ({f, x, y, s = 1, work = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={170} rx={190} ry={20} fill="#000" opacity={0.4} />
    <rect x={-150} y={-120} width={300} height={290} rx={22} fill="#4B4A7C" stroke={C.ink} strokeWidth={8} />
    <path d="M -110,-120 L -60,-170 L 60,-170 L 110,-120" fill="#3A3966" stroke={C.ink} strokeWidth={7} />
    <rect x={-100} y={-60} width={200} height={90} rx={14} fill="#15123A" stroke={C.ink} strokeWidth={5} />
    {[-48, 48].map((ex, i) => <g key={i}><circle cx={ex} cy={-18} r={22} fill={C.white} stroke={C.ink} strokeWidth={4} /><circle cx={ex + 6} cy={-16} r={9} fill={C.ink} /></g>)}
    <rect x={-70} y={52} width={140} height={22} rx={6} fill="#15123A" stroke={C.ink} strokeWidth={4} />
    <rect x={-80} y={96} width={160} height={14} fill={C.teal} opacity={0.5 + 0.4 * Math.sin(f / 5) * work} />
  </g>
);

const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const page = ease(f, b(10), 36);
  const sheets = Math.floor(clamp01((f - b(11)) / 60) * 6);
  const env = ease(f, b(12), 90);
  const tag = ease(f, b(13), 14);
  return (
    <Frame p={p} z0={1.0} z1={1.08} oy={960} bg="#15123C">
      <SVG>
        <Clicky f={f} x={130} y={820} s={0.62} click={lastClick(f, b(10) + 2, 120)} look={1} mood="focused" glow={0.6} />
        <g transform={`translate(${lerp(190, 400, page)} ${lerp(820, 780, page)}) rotate(${lerp(-10, 6, page)})`} opacity={1 - 0.0}>
          <rect x={-34} y={-44} width={68} height={88} rx={6} fill={C.teal} opacity={0.9} stroke={C.ink} strokeWidth={4} />
        </g>
        <Broker f={f} x={560} y={900} s={0.95} work={ease(f, b(11), 10)} />
        <Lab text="VERISK" x={430} y={965} size={20} tone="plate" p={ease(f, b(43), 12)} />
        <Lab text="LEXISNEXIS" x={690} y={965} size={20} tone="plate" p={ease(f, b(44), 12)} />
        {Array.from({length: sheets}).map((_, i) => <rect key={i} x={830} y={1060 - i * 20} width={120} height={14} rx={3} fill={C.paper} stroke={C.ink} strokeWidth={3} transform={`rotate(${(i % 2) * 3 - 1} 800 1060)`} />)}
        <rect x={80} y={1180} width={920} height={34} rx={8} fill="#2A2358" stroke={C.ink} strokeWidth={5} />
        {Array.from({length: 18}).map((_, i) => <rect key={i} x={((i * 52 + f * 3) % 920) + 80} y={1190} width={22} height={6} fill={C.glow} opacity={0.5} />)}
        {[300, 520, 760, 940].map((hx, i) => (
          <g key={i} transform={`translate(${hx} 1115)`}>
            <path d="M -40,0 L 0,-46 L 40,0 Z" fill="#5C5A92" stroke={C.ink} strokeWidth={5} />
            <rect x={-30} y={0} width={60} height={52} fill="#3A3966" stroke={C.ink} strokeWidth={5} />
          </g>
        ))}
        {[0, 1, 2, 3].map((i) => {
          const k = clamp01(env * 1.3 - i * 0.18);
          return k > 0 && k < 1 ? <rect key={i} x={lerp(760, 300 + i * 210, k) - 20} y={lerp(1060, 1110, k) - 14} width={40} height={28} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} /> : null;
        })}
        <Fob x={lerp(120, 1000, ((f * 0.004) % 1))} y={1150} s={0.42} tag="?" />
        <Lab text="SOME INSURERS · IN PART" x={620} y={1010} size={20} tone="warn" p={tag} rot={-3} />
        <Plate x={540} text="GM SOLD IT · ALLEGED" y={520} p={ease(f, b(10), 14) * (1 - ease(f, b(43) - 10, 8))} size={30} />
        <Plate x={540} text="VERISK" y={590} p={ease(f, b(43), 14) * (1 - ease(f, b(44) - 10, 8))} size={34} />
        <Plate x={540} text="LEXISNEXIS" y={662} p={ease(f, b(44), 14) * (1 - ease(f, b(11) - 10, 8))} size={34} />
        <Plate x={540} text="DRIVER RATINGS" y={734} p={ease(f, b(11), 14) * (1 - ease(f, b(12) - 10, 8))} size={34} />
        <Plate x={540} text="TO INSURERS" y={806} p={ease(f, b(12), 14) * (1 - ease(f, b(13) - 10, 8))} size={34} />
        <Plate x={540} text="SOME INSURERS · IN PART" y={875} p={ease(f, b(13), 14)} size={28} tone="warn" />
      </SVG>
    </Frame>
  );
};

// ---- S6: Alaska's share ---------------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const card = springy(f, b(14), 24);
  const tag = ease(f, b(36), 14);
  const box = ease(f, b(15), 16);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={900} bg="#13113A">
      <SVG>
        <g transform="translate(90 600) scale(0.9)">
          <path d={AK_PATH} fill="#262252" stroke={C.teal} strokeWidth={4} opacity={0.95} />
          <path d={AK_PATH} fill="none" stroke={C.glow} strokeWidth={2} opacity={0.4} transform="translate(5 6)" />
        </g>
        <g transform={`translate(540 ${lerp(1000, 880, card)}) scale(${card})`} opacity={clamp01(card * 2)}>
          <rect x={-190} y={-62} width={380} height={124} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <text x={0} y={-8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>ALASKA</text>
          <text x={0} y={38} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.ink}>$2.5 MILLION</text>
        </g>
        <Lab text="ALASKA DEPT OF LAW" x={540} y={990} size={20} p={tag} />
        <Lab text="VIA ALASKA'S NEWS SOURCE" x={540} y={1036} size={18} p={tag} />
        <g transform={`translate(840 1160) scale(${box})`} opacity={box}>
          <rect x={-90} y={-60} width={180} height={120} rx={10} fill="none" stroke={C.white} strokeWidth={5} strokeDasharray="12 10" />
          <text y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={68} fill={C.white} opacity={0.6 + 0.4 * Math.sin(f / 6)}>?</text>
        </g>
        <Clicky f={f} x={130} y={1170} s={0.5} look={0.9} mood="puzzled" glow={0.5} />
        <Fob x={230} y={1160} s={0.4} tag="?" rot={-8} />
        <Plate x={540} text="ALASKA · $2.5 MILLION" y={521} p={ease(f, b(14), 14) * (1 - ease(f, b(36) - 10, 8))} size={32} />
        <Plate text="ALASKA DEPT OF LAW VIA ALASKA'S NEWS SOURCE" x={540} displayLines={['ALASKA DEPT OF LAW', "VIA ALASKA'S NEWS SOURCE"]} y={607} p={ease(f, b(36), 14) * (1 - ease(f, b(15) - 10, 8))} size={24} />
        <Plate x={540} text="HOW MANY ALASKANS?" y={694} p={ease(f, b(15), 14)} size={34} />
      </SVG>
    </Frame>
  );
};

// ---- S7: NOT ENROLLED, the phone, the paper tower ----------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const hit = bump(f, b(16), 20);
  const tower = clamp01((f - b(17)) / 60);
  const stamp = springy(f, b(38), 16);
  const wr = ease(f, b(18), 14);
  const river = 1 + 1.3 * ease(f, b(48), 30);
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={900} bg="#14113A">
      <SVG>
        <Stream f={f} x0={520} y0={1000} x1={250} y1={1300} n={30} w={river} speed={0.014} />
        <Stream f={f} x0={560} y0={1000} x1={520} y1={1310} n={24} w={river * 0.8} speed={0.012} />
        <g transform={`translate(540 1000) rotate(${2 * Math.sin(f / 30)})`}>
          <rect x={-170} y={-280} width={340} height={560} rx={40} fill="#0B0A1F" stroke={C.gun} strokeWidth={9} />
          <rect x={-146} y={-246} width={292} height={492} rx={20} fill="#17143F" />
                    <rect x={-120} y={-100} width={240} height={70} rx={35} fill={C.mag} stroke={C.ink} strokeWidth={4} opacity={0.95} />
          <circle cx={-82 + 0} cy={-65} r={26} fill={C.white} />
          <text x={0} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.mag} transform={`scale(${1 + 0.06 * hit})`}>NOT</text>
          <text x={0} y={80} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} fill={C.mag}>ENROLLED</text>
          <circle cx={118} cy={-232} r={7} fill={C.teal} opacity={0.5 + 0.5 * Math.sin(f / 4)} />
          <g transform={`translate(40 160) rotate(${-14 + 4 * stamp}) scale(${stamp})`} opacity={clamp01(stamp * 2)}>
            <rect x={-96} y={-30} width={192} height={60} rx={6} fill="none" stroke={C.mag} strokeWidth={7} />
            <text y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} fill={C.mag}>ALLEGED</text>
          </g>
        </g>
        <g transform="translate(870 1280)">
          {Array.from({length: 14}).map((_, i) => i / 14 < tower ? <rect key={i} x={-52 + (i % 3) * 3} y={-i * 30} width={104} height={24} rx={3} fill={C.paper} stroke={C.ink} strokeWidth={3} transform={`rotate(${(i % 3 - 1) * 2} 0 ${-i * 30})`} /> : null)}
          <line x1={-90} y1={-420} x2={90} y2={-420} stroke={C.glow} strokeWidth={5} strokeDasharray="10 8" opacity={0.9} />
          <text x={0} y={-440} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.glow}>370,000</text>
        </g>
        <Clicky f={f} x={190} y={740} s={0.75} look={0.9} mood="alarmed" glow={0.7} n={Math.floor(f / 6)} click={lastClick(f, b(16), 12)} />
        <Fob x={250} y={1110} s={0.5} tag="NOT|ENROLLED" rot={-10} glow={0.8 + 0.2 * Math.sin(f / 4)} />
        <Lab text="THE COMPLAINT BLAMES A GLITCH" x={540} y={1215} size={20} tone="warn" p={wr} rot={2} />
        <Plate x={540} text="NOT ENROLLED" y={523} p={ease(f, b(16) + 4, 14) * (1 - ease(f, b(48) - 10, 8))} size={36} tone="warn" />
        <Plate x={540} text="STILL COLLECTING" y={596} p={ease(f, b(48), 14) * (1 - ease(f, b(17) - 10, 8))} size={34} />
        <Plate text="OVER 370,000 TOLD 'NOT ENROLLED'" x={540} displayLines={["OVER 370,000 TOLD", "'NOT ENROLLED'"]} y={689} p={ease(f, b(17), 14) * (1 - ease(f, b(38) - 10, 8))} size={30} />
        <Plate x={540} text="ALLEGED" y={783} p={ease(f, b(38), 14) * (1 - ease(f, b(18) - 10, 8))} size={36} tone="warn" />
        <Plate x={540} text="THE COMPLAINT BLAMES A GLITCH" y={851} p={ease(f, b(18), 14)} size={24} />
      </SVG>
    </Frame>
  );
};

const Glove: React.FC<{x: number; y: number; s?: number; rot?: number; open?: number}> = ({x, y, s = 1, rot = 0, open = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={110} rx={80} ry={12} fill="#000" opacity={0.3} />
    <rect x={-52} y={-10} width={104} height={96} rx={30} fill="#2B2646" stroke={C.ink} strokeWidth={6} />
    {[-40, -14, 12, 38].map((fx, i) => <rect key={i} x={fx - 11} y={-70 + Math.abs(i - 1.5) * 8 + (1 - open) * 40} width={24} height={72} rx={12} fill="#2B2646" stroke={C.ink} strokeWidth={5} />)}
    <rect x={-84} y={20} width={36} height={60} rx={16} fill="#2B2646" stroke={C.ink} strokeWidth={5} transform="rotate(-30 -66 50)" />
    <rect x={-58} y={86} width={116} height={40} rx={10} fill="#3A3466" stroke={C.ink} strokeWidth={5} />
  </g>
);

// ---- S8: the courtroom --------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const flip = ease(f, b(19), 16);
  const stampK = springy(f, b(20), 14);
  const win = ease(f, b(21), 14);
  const box = ease(f, b(22), 22);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={940} bg={C.paper} vignette={0.2} warmth={0}>
      <SVG>
        <g transform={`translate(540 0) scale(${0.04 + 0.96 * flip} 1) translate(-540 0)`}>
          <rect x={0} y={420} width={1080} height={900} fill={C.paper} />
          {[150, 330, 540, 750, 930].map((cx, i) => <rect key={i} x={cx - 18} y={430} width={36} height={420} fill="#D6CDB5" stroke="#B7AC90" strokeWidth={3} />)}
          <rect x={60} y={840} width={960} height={26} fill="#B7AC90" />
          <g transform="translate(260 960)">
            <StampBot f={f} x={0} y={0} reject={bump(f, b(20), 20)} />
          </g>
          <g transform={`translate(560 1130)`}>
            <rect x={-250} y={-70} width={500} height={130} rx={8} fill="#D9CFB4" stroke={C.ink} strokeWidth={6} />
            <text x={0} y={-24} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>STATE v. GM · DOCKET</text>
            <g transform={`translate(${-60} ${10}) rotate(-8) scale(${stampK})`} opacity={clamp01(stampK * 2)}>
              <rect x={-130} y={-24} width={260} height={48} rx={6} fill="none" stroke={C.mag} strokeWidth={6} />
              <text y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={32} fill={C.mag}>NO ADMISSION</text>
            </g>
          </g>
          <g transform="translate(830 900)">
            {Array.from({length: 6}).map((_, r) => Array.from({length: 4}).map((_, c) => (
              <rect key={`${r}${c}`} x={-120 + c * 62 + (r % 2) * 30} y={-130 + r * 42} width={58} height={38} fill="#B9674F" stroke="#7A3F30" strokeWidth={3} />
            )))}
            <rect x={-80} y={-60} width={160} height={70} rx={8} fill="#2B2646" stroke={C.ink} strokeWidth={6} opacity={win} />
            <Lab text="NO CLAIMS PROCESS" x={0} y={55} size={18} tone="warn" p={win} />
          </g>
          <g transform={`translate(${lerp(120, 560, box)} ${lerp(1040, 1122, box)})`} opacity={box}>
            <rect x={-170} y={-30} width={340} height={72} rx={8} fill="#F4EEDD" stroke={C.ink} strokeWidth={4} strokeDasharray="12 8" />
            <text y={-2} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={C.ink}>ALASKA DRIVERS AFFECTED</text>
            <text y={26} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.mag}>NOT STATED</text>
          </g>
          <Clicky f={f} x={120} y={760} s={0.55} look={0.8} mood="focused" glow={0.2} />
          <Fob x={960} y={1140} s={0.4} tag="?" rot={10} />
        </g>
        <Plate x={540} text="THE FAIR CASE" y={523} tone="plate" p={ease(f, b(19) + 8, 14) * (1 - ease(f, b(20) - 10, 8))} size={36} />
        <Plate x={540} text="NO ADMISSION · GM" y={596} tone="warn" p={ease(f, b(20), 14) * (1 - ease(f, b(21) - 10, 8))} size={34} />
        <Plate x={540} text="NO CLAIMS PROCESS" y={668} tone="plate" p={ease(f, b(21), 14) * (1 - ease(f, b(22) - 10, 8))} size={34} />
        <Plate text="ALASKA DRIVERS AFFECTED NOT STATED" x={540} displayLines={['ALASKA DRIVERS AFFECTED', 'NOT STATED']} y={759} tone="plate" p={ease(f, b(22), 14)} size={28} />
      </SVG>
    </Frame>
  );
};

// ---- S9: the houses, the empty glove -------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const env = ease(f, b(23) + 20, 30);
  const coin = ease(f, b(42), 50);
  const sag = ease(f, b(24), 24);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={960} bg="#E4DCC6" vignette={0.18} warmth={0}>
      <SVG>
        <rect x={0} y={1020} width={1080} height={300} fill="#4A5A5C" stroke={C.ink} strokeWidth={6} />
        {[230, 540, 850].map((hx, i) => (
          <g key={i} transform={`translate(${hx} 760)`}>
            <path d="M -90,0 L 0,-100 L 90,0 Z" fill="#5C5A92" stroke={C.ink} strokeWidth={6} />
            <rect x={-70} y={0} width={140} height={110} fill="#3A3966" stroke={C.ink} strokeWidth={6} />
            {[0, 1, 2].map((j) => <rect key={j} x={-48 + j * 8} y={20 + j * 24} width={96} height={16} rx={3} fill={C.paper} stroke={C.ink} strokeWidth={3} />)}
          </g>
        ))}
        <g transform="translate(250 1130)">
          <rect x={-130} y={-70} width={260} height={150} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <path d={`M -130,-70 L 0,${lerp(10, -120, env)} L 130,-70`} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <Lab text="ONE THING CAN'T" x={0} y={30} size={16} tone="warn" />
        </g>
        <Glove x={lerp(560, 600, sag)} y={lerp(1060, 1110, sag)} s={0.95} rot={lerp(-6, 10, sag)} open={1 - 0.3 * sag} />
        <g transform={`translate(${lerp(1100, 800, coin)} ${1190 + 4 * Math.sin(coin * 30)}) rotate(${coin * 720})`} opacity={clamp01(1 - 0.0)}>
          <circle r={26} fill={C.gunD} stroke={C.ink} strokeWidth={5} />
          <circle r={16} fill="none" stroke={C.glow} strokeWidth={3} opacity={0.6} />
        </g>
        <Fob x={960} y={1150} s={0.42} tag="ENROLLED?" dim rot={12} />
        <Plate x={540} text="THE ONE THING IT CAN'T DO" y={520} tone="plate" p={ease(f, b(23), 14) * (1 - ease(f, b(42) - 10, 8))} size={30} />
        <Plate x={540} text="THE COIN STOPS SHORT" y={589} tone="plate" p={ease(f, b(42), 14) * (1 - ease(f, b(24) - 10, 8))} size={32} />
        <Plate x={540} text="NO PAYOUT FOR DRIVERS" y={659} tone="warn" p={ease(f, b(24), 14)} size={32} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the gate, the signature shot -----------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const sweep = easeIO(f, b(41), 22);
  const slam = Math.pow(ease(f, b(25), 9), 2);
  const sod = ease(f, b(25) + 2, 24);
  const bolt = springy(f, b(26), 16);
  const after = f > b(25) + 4;
  const cam = track([{t: 0, z: 1.1, fx: 300, fy: 950}, {t: b(25) - 4, z: 1.1, fx: 500, fy: 950}, {t: b(25) + 8, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam}>
      <SVG>
        <Road f={f} speed={after ? 6 : 14} y0={480} />
        <Dash f={f} y={1010} hands={0} />
        <Stream f={f} x0={40} y0={1000} x1={slam > 0.5 ? 420 : 520} y1={930} n={34} speed={after ? 0.003 : 0.012} w={after ? 1.2 : 1} />
        {after && Array.from({length: 18}).map((_, i) => <circle key={i} cx={430 - (i % 6) * 24} cy={850 + Math.floor(i / 6) * 40 + 8 * Math.sin(f / 9 + i)} r={9} fill={C.teal} opacity={0.75} />)}
        <Gate x={560} y={900} s={1.05} lever={slam} locked={bolt} label={slam > 0.5 ? 'ASK FIRST' : 'COLLECT BY DEFAULT'} />
        <Fob x={slam > 0.5 ? 805 : 880} y={slam > 0.5 ? 700 : 760} s={0.5} tag={slam > 0.5 ? 'ASK|FIRST' : '?'} rot={-6} />
        <Rings f={f} x={170} y={900} t0={20} period={80} off={b(25)} r={200} />
        <Clicky f={f} x={170} y={900} s={0.8} click={lastClick(f, 30, 80)} off={f > b(25) + 2} mood={f > b(25) ? 'focused' : 'alarmed'} look={0.9} glow={f > b(25) ? 0 : 0.8} />
        <rect data-band="ok" x={lerp(-300, 1300, sod)} y={420} width={260} height={900} fill={C.glow} opacity={0.28 * Math.sin(Math.PI * sod)} transform="skewX(-14)" />
        <g transform={`translate(${lerp(0, 1300, sweep)} 0)`}>
          <rect x={-1100} y={420} width={1100} height={900} fill="#E4DCC6" />
          <rect x={-8} y={420} width={8} height={900} fill={C.ink} />
        </g>
        <Plate x={540} text="THE DOOR" y={523} p={ease(f, b(41) + 14, 12) * (1 - ease(f, b(25) - 10, 8))} size={36} />
        <Plate x={540} text="ASK FIRST" y={601} p={ease(f, b(25), 10) * (1 - ease(f, b(26) - 10, 8))} size={44} tone="glow" />
        <Plate x={540} text="A CLEAR YES" y={681} p={ease(f, b(26), 12)} size={40} />
      </SVG>
    </Frame>
  );
};

// ---- S11: delete the old dots --------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const grow = ease(f, b(27), 50);
  const clamp = ease(f, b(47), 20);
  const cut = easeIO(f, b(28), 36);
  const gone = ease(f, b(40), 60);
  const lineX = lerp(880, 600, cut);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={960} bg="#13113A">
      <SVG>
        <path d="M 60,1100 Q 300,980 540,1060 T 1020,980" fill="none" stroke="#2A2358" strokeWidth={80} strokeLinecap="round" />
        <path d="M 60,1100 Q 300,980 540,1060 T 1020,980" fill="none" stroke={C.white} strokeWidth={4} strokeDasharray="20 18" opacity={0.6} />
        {Array.from({length: 40}).map((_, i) => {
          const x = 70 + i * 24, y = 1100 - 120 * Math.sin(i / 6) * 0.1 + (i % 2) * 18;
          const old = x < lineX;
          const keep = i % 9 === 4;
          const alive = i / 40 < grow;
          const fade = old && !keep ? 1 - clamp01(gone * 1.4 - (i / 40) * 0.8) : 1;
          return alive ? <circle key={i} cx={x} cy={y - 40} r={9} fill={C.teal} opacity={0.85 * fade} /> : null;
        })}
        <g transform={`translate(${lineX} 0)`} opacity={cut > 0.01 ? 1 : 0}>
          <line x1={0} y1={800} x2={0} y2={1230} stroke={C.glow} strokeWidth={6} />
          <Lab text="JAN 16TH 2025" x={0} y={1250} size={20} tone="glow" />
        </g>
        <g transform="translate(830 700)">
          <circle r={120} fill="#0B0A1F" stroke={C.glow} strokeWidth={6} />
          <path d="M -90,0 A 90,90 0 0 1 90,0" fill="none" stroke={C.mag} strokeWidth={14} opacity={0.5} />
          <rect x={-30} y={-110} width={60} height={110} fill={C.teal} opacity={0.2 * clamp} />
          <line x1={0} y1={0} x2={0} y2={-96} stroke={C.glow} strokeWidth={8} strokeLinecap="round" transform={`rotate(${lerp(70, 8, clamp) + 3 * Math.sin(f / 3) * (1 - clamp)})`} />
          <circle r={10} fill={C.gun} stroke={C.ink} strokeWidth={4} />
        </g>
        <Clicky f={f} x={190} y={720} s={0.6} look={0.8} off mood="focused" />
        <Fob x={170} y={1190} s={0.4} tag="ASK|FIRST" rot={-6} />
        <Plate x={540} text="EVERY DOT KEPT" y={523} p={ease(f, b(27), 14) * (1 - ease(f, b(47) - 10, 8))} size={36} />
        <Plate x={540} text="ONLY WHAT'S NEEDED" y={596} p={ease(f, b(47), 14) * (1 - ease(f, b(28) - 10, 8))} size={34} />
        <Plate x={540} text="BEFORE JAN 16TH, 2025" y={667} p={ease(f, b(28), 14) * (1 - ease(f, b(40) - 10, 8))} size={32} />
        <Plate x={540} text="OLDER DATA DELETED" y={738} p={ease(f, b(40), 14)} size={34} />
      </SVG>
    </Frame>
  );
};

// ---- S12: the key ---------------------------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const env = ease(f, b(29) + 14, 28);
  const rise = ease(f, b(39), 26);
  const drop = easeIO(f, b(30), 28);
  const fx = lerp(220, 640, drop), fy = lerp(1080, 1010, drop) - 120 * Math.sin(Math.PI * drop);
  return (
    <Frame p={p} z0={1.0} z1={1.08} oy={960}>
      <SVG>
        <Road f={f} speed={5} y0={480} />
        <Dash f={f} y={1010} hands={0} />
        <Stream f={f} x0={40} y0={1000} x1={420} y1={930} n={20} speed={0.002} />
        <Gate x={560} y={880} s={0.95} lever={1} locked={1} />
        <g transform="translate(220 1130)">
          <rect x={-110} y={-60} width={220} height={120} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <path d={`M -110,-60 L 0,${lerp(8, -110, env)} L 110,-60`} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <Lab text="ONE THING FIXED" x={0} y={30} size={15} tone="plate" />
        </g>
        <Fob x={fx} y={drop > 0 || env > 0.8 ? fy : 1080} s={0.62} tag={drop > 0.6 ? 'YES?' : 'ASK|FIRST'} rot={lerp(-8, 8, drop)} glow={drop} />
        <Glove x={lerp(780, 650, rise)} y={lerp(1330, 1120, rise)} s={0.85} rot={lerp(8, -4, rise)} open={1} />
        <Plate text="THE DOOR CAN GM COLLECT AT ALL?" x={540} displayLines={['THE DOOR', 'CAN GM COLLECT AT ALL?']} y={541} p={ease(f, b(29), 14) * (1 - ease(f, b(39) - 10, 8))} size={28} />
        <Plate x={540} text="THE DRIVER" y={633} p={ease(f, b(39), 14) * (1 - ease(f, b(30) - 10, 8))} size={36} />
        <Plate x={540} text="THE DRIVER HOLDS THE KEY" y={703} p={ease(f, b(30), 14)} size={28} tone="glow" />
      </SVG>
    </Frame>
  );
};

// ---- S13: the driver's phone, COPY or DELETE, the fob settles ------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const wake = ease(f, b(31), 24);
  const hover = Math.sin(Math.max(0, f - b(32)) / 26);
  const settle = easeIO(f, b(33), 34);
  const ring = f - b(45);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={940}>
      <SVG>
        <g transform="translate(180 660) scale(0.4)" opacity={0.85}>
          <Gate x={0} y={0} s={1} lever={1} locked={1} />
        </g>
        <g transform="translate(540 900)">
          <rect x={-210} y={-330} width={420} height={640} rx={44} fill="#0B0A1F" stroke={C.gun} strokeWidth={10} />
          <rect x={-184} y={-296} width={368} height={572} rx={24} fill="#17143F" />
                              {[{x: -90, t: 'COPY'}, {x: 90, t: 'DELETE'}].map((bt, i) => (
            <g key={i} transform={`translate(${bt.x} 20)`} opacity={clamp01(wake * 1.6 - i * 0.2)}>
              <rect x={-82} y={-60} width={164} height={120} rx={18} fill={C.teal} fillOpacity={0.25 + 0.2 * Math.abs(hover) * (i ? 1 : 0)} stroke={C.teal} strokeWidth={6} />
              <text y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} fill={C.white}>{bt.t}</text>
            </g>
          ))}
        </g>
        <Glove x={540 + 90 * hover} y={lerp(1420, 1190, wake)} s={0.7} rot={-4} open={0.8} />
        <Square x={880} y={1130} s={1} fill={settle} />
        <Lab text="YOUR CALL" x={880} y={1236} size={20} tone="glow" p={clamp01((settle - 0.7) * 4)} />
        <Fob x={lerp(540, 880, settle)} y={lerp(560, 1130, settle) - 140 * Math.sin(Math.PI * settle)} s={lerp(0.7, 0.5, settle)} tag={settle > 0.8 ? 'YOUR|CALL' : 'YES?'} rot={lerp(-10, 0, settle)} glow={1 - settle} />
        <Clicky f={f} x={180} y={1120} s={0.62} off mood="warm" look={0.6} />
        {ring > 0 && ring < 80 && <circle cx={880} cy={1130} r={20 + ring * 5} fill="none" stroke={C.teal} strokeWidth={6} opacity={1 - ring / 80} />}
        <Plate text="ASK FOR A COPY ASK FOR DELETION" x={540} displayLines={['ASK FOR A COPY', 'ASK FOR DELETION']} y={541} p={ease(f, b(31), 14) * (1 - ease(f, b(32) - 10, 8))} size={28} />
        <Plate x={540} text="YOUR DATA · YOUR CALL" y={629} p={ease(f, b(32), 14) * (1 - ease(f, b(33) - 10, 8))} size={28} />
        <Plate x={540} text="COPY FIRST OR DELETE?" y={696} p={ease(f, b(33), 14)} size={30} tone="glow" />
      </SVG>
    </Frame>
  );
};

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
  return Comp ? <Comp p={p} /> : null;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1102Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1102Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1102: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 8.9, 18.0, 25.4, 33.8, 44.8, 54.3, 66.6, 79.5, 87.2, 95.3, 104.9, 115.2, 124.54].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.sky}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#0F0D2B" ink="#EDE6D3" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
