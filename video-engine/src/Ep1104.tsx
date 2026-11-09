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
import {IDS} from './Ep1104Ids';
import {ListeningMooring} from './lib/sensors';
import {ServerMachine} from './lib/kit';
import {Halibut} from './lib/fauna';
import {HeldProp} from './lib/heldidle';

// The Ears Did the Work, 2026-11-04. Palette roles are art_direction.json. BUNK is the seafloor ear (ListeningMooring with a face), the catalog SHEET is the throughline.
// Gold is the machine only, chalk is the human-checked only, mint is Bunk only, coral is the honest limits only.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

export const C = {
  sky: '#2A0F1F', ground: '#4A1D2B', mint: '#6FE3C1', gold: '#FFC93C', chalk: '#F2EBDD', coral: '#FF6B4A', shadow: '#14060F', slate: '#5B6E7A', ink: '#14060F',
  dash: '#7A3A4C', white: '#FFF8EC', cream: '#EBD9D0', paper: '#F2EBDD', wine: '#6B2A3E',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
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
  dark: {fill: '#1A0912', fg: '#F2EBDD', edge: '#F2EBDD'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.coral, edge: C.coral},
  glow: {fill: C.gold, fg: C.ink, edge: C.ink},
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



// ---- Atmosphere + Frame ----------------------------------------------------------------------------------------------------------------
type Look = 'sea' | 'stage' | 'paper' | 'lab';
const Atmos: React.FC<{f: number; look: Look}> = ({f, look}) => {
  const top = look === 'stage' ? '#1C0914' : look === 'paper' ? '#3A1626' : look === 'lab' ? '#2A1020' : '#1F0A16';
  const mid = look === 'paper' ? '#5A2538' : look === 'lab' ? '#42182A' : C.ground;
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="atm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.35" stopColor={C.sky} />
          <stop offset="0.8" stopColor={mid} />
          <stop offset="1" stopColor="#0E040A" />
        </linearGradient>
        <radialGradient id="mintGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={C.mint} stopOpacity={0.2} /><stop offset="1" stopColor={C.mint} stopOpacity={0} /></radialGradient>
        <radialGradient id="goldGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={C.gold} stopOpacity={0.16} /><stop offset="1" stopColor={C.gold} stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#atm)" />
      <ellipse cx={200} cy={200} rx={460} ry={300} fill="url(#goldGlow)" />
      <ellipse cx={900} cy={1700} rx={520} ry={320} fill="url(#mintGlow)" />
      {Array.from({length: 34}).map((_, i) => {
        const k = ((f * (0.35 + (i % 5) * 0.12) + i * 97) % 1900);
        return <circle key={i} cx={(i * 211) % 1080} cy={1920 - k} r={2 + (i % 4)} fill={C.cream} opacity={0.1 + 0.12 * ((i % 3) / 2)} />;
      })}
      {Array.from({length: 8}).map((_, i) => <path key={i} d={`M ${i * 150 - 30},1920 q 40,-${140 + (i % 3) * 50} 80,0 z`} fill="#0E040A" opacity={0.65} />)}
    </svg>
  );
};

type Cam = {z: number; fx: number; fy: number};
/** the foreground layer: modelled seabed strata, drifting plankton and mint-lit domes, so the region under the captions is never a flat gradient. */
const Foreground: React.FC<{f: number; look: Look}> = ({f, look}) => {
  const sway = Math.sin(f / 60) * 14;
  if (look === 'stage') {
    return (
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={0} y={1520} width={1080} height={400} fill="#14060F" />
          <path d="M 0,1520 Q 270,1490 540,1520 T 1080,1520 L 1080,1560 L 0,1560 Z" fill="#6B2A3E" stroke="#14060F" strokeWidth={6} />
          {Array.from({length: 11}).map((_, i) => <g key={i} transform={`translate(${i * 108 + 20 + sway * (i % 2 ? 1 : -1) * 0.4} ${1700 + (i % 3) * 30})`}><circle r={44} fill="#0A0308" /><rect x={-60} y={30} width={120} height={150} rx={40} fill="#0A0308" /></g>)}
        </g>
      </svg>
    );
  }
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <g data-band="ok">
        <path d={`M 0,1530 Q 200,${1490 + sway} 420,1520 T 800,1510 T 1080,1520 L 1080,1920 L 0,1920 Z`} fill="#5E2A3E" />
        <path d={`M 0,1600 Q 260,${1570 - sway} 540,1600 T 1080,1590 L 1080,1920 L 0,1920 Z`} fill="#4A1D2E" />
        <path d={`M 0,1700 Q 300,${1680 + sway} 600,1700 T 1080,1690 L 1080,1920 L 0,1920 Z`} fill="#38141F" />
        <path d="M 0,1530 Q 200,1490 420,1520 T 800,1510 T 1080,1520" fill="none" stroke={C.chalk} strokeWidth={3} opacity={0.35} />
        {Array.from({length: 26}).map((_, i) => <circle key={i} cx={(i * 83 + 40) % 1080} cy={1560 + ((i * 47) % 320)} r={2.5 + (i % 3)} fill={i % 4 === 0 ? C.mint : C.cream} opacity={0.25 + 0.25 * Math.abs(Math.sin(f / 30 + i))} />)}
        {[110, 330, 540, 750, 970].map((x, i) => <g key={i} transform={`translate(${x} ${1800 + 8 * Math.sin(f / 22 + i)})`}><ellipse cx={0} cy={6} rx={56} ry={10} fill="#000" opacity={0.4} /><rect x={-24} y={-40} width={48} height={44} rx={8} fill="#46606B" stroke="#14060F" strokeWidth={5} /><circle cx={0} cy={-46} r={34} fill="#2F4A45" stroke="#14060F" strokeWidth={6} /><circle cx={0} cy={-46} r={14 + 6 * Math.sin(f / 10 + i * 2)} fill={C.mint} opacity={0.85} />{[0, 1].map((k) => { const ph = ((f / 40 + k * 0.5 + i * 0.2) % 1); return <circle key={k} cx={0} cy={-46} r={20 + ph * 90} fill="none" stroke={C.mint} strokeWidth={5 * (1 - ph)} opacity={0.6 * (1 - ph)} />; })}</g>)}
        {[220, 640, 880].map((x, i) => <path key={i} d={`M ${x},1900 q ${30 + sway * 0.8},-120 ${-10 + sway},-230 q ${-30 - sway},-90 ${10},-170`} stroke="#6B8F7A" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.55} />)}
      </g>
    </svg>
  );
};

const CHIP = 'ILLUSTRATION · NOT DATA';
const Frame: React.FC<{p: SP; look?: Look; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; warmth?: number; children: React.ReactNode}> =
({p, look = 'sea', z0 = 1.04, z1 = 1.22, bloom = 0.06, vignette = 0.3, ox = 540, oy = 960, warmth = 0.03, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const z = lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur)));
  const fx = ox + 40 * Math.sin(p.f / 110) + 24 * t, fy = oy;
  return (
    <AbsoluteFill>
      <Atmos f={p.f} look={look} />
      <Foreground f={p.f} look={look} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 3 * Math.sin(p.f / 23)}px, ${jl.y + 4 * Math.sin(p.f / 17 + 1) + 3 * t}px) translate(${540 - fx * z}px, ${960 - fy * z}px) scale(${z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={60} y={300} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill={C.ink} stroke="#F2EBDD" strokeWidth={2.4} opacity={0.92} />
          <text x={75} y={326} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F2EBDD">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.07} warmth={warmth} />
    </AbsoluteFill>
  );
};

// ---- the cast ------------------------------------------------------------------------------------------------------------------------
/** BUNK: the shelf's ListeningMooring with a face on the dome. look -1..1, mood, detect 0..1 blooms mint rings, eye 0..1 openness. */
const Bunk: React.FC<{f: number; x: number; y: number; s?: number; detect?: number; eye?: number; mood?: 'curious' | 'proud' | 'somber' | 'warm' | 'wry'; look?: number}> =
({f, x, y, s = 1, detect = 0.25, eye = 1, mood = 'curious', look = 0}) => {
  const blink = (f % 150) > 143 ? 0.12 : 1;
  const open = Math.max(0.05, eye * blink);
  const cy = y - 150 * s;
  const mouth = mood === 'somber' ? 'M -8,16 q 8,-7 16,0' : mood === 'proud' || mood === 'warm' ? 'M -9,12 q 9,9 18,0' : 'M -8,14 q 8,3 16,-1';
  return (
    <g>
      <ListeningMooring x={x} y={y} scale={s} f={f} detect={detect} />
      <g transform={`translate(${x} ${cy}) scale(${s})`}>
        {[-11, 11].map((ex, i) => (
          <g key={i}>
            <ellipse cx={ex} cy={-2} rx={7.5} ry={7.5 * open} fill={C.white} stroke={C.ink} strokeWidth={2.4} />
            <circle cx={ex + look * 2.5} cy={-2} r={3.2 * (open > 0.3 ? 1 : 0)} fill={C.ink} />
          </g>
        ))}
        {mood === 'wry' && <path d="M 4,-14 l 14,-4" stroke={C.ink} strokeWidth={2.6} />}
        <path d={mouth} stroke={C.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

/** the ROBOT: the shelf ServerMachine, standing in for the headline's AI. bow 0..1, crown 0..1. */
const Robot: React.FC<{f: number; x: number; y: number; s?: number; emotion?: 'greedy' | 'focused' | 'nervous' | 'shock'; bow?: number; crown?: number; tilt?: number}> =
({f, x, y, s = 1, emotion = 'greedy', bow = 0, crown = 0, tilt = 0}) => {
  const {opennessAt} = useVoice();
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt + bow * 14}) translate(${-x} ${-y})`}>
      <ServerMachine frame={f} x={x} y={y} scale={s} emotion={emotion} tint="copper" talking={0} />
      {crown > 0.02 && (
        <g transform={`translate(${x} ${y - 215 * s - 30 * (1 - crown)}) scale(${s * crown})`}>
          <path d="M -44,0 l 0,-34 l 22,22 l 22,-40 l 22,40 l 22,-22 l 0,34 z" fill={C.gold} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

/** the catalog SHEET: chalk dots are hand-checked, gold dots are machine-found. n gold dots 0..24, small = gold dots shrink, stamp 0..1, tab 0..1, outline 0..1 */
const DOTS = Array.from({length: 40}).map((_, i) => ({x: ((i * 137) % 100) / 100, y: ((i * 61 + (i % 3) * 23) % 100) / 100}));
const Sheet: React.FC<{x: number; y: number; s?: number; w?: number; h?: number; chalk?: number; gold?: number; small?: number; stamp?: number; tab?: number; outline?: number; note?: number; rot?: number}> =
({x, y, s = 1, w = 420, h = 540, chalk = 6, gold = 0, small = 0, stamp = 0, tab = 0, outline = 0, note = 0, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} rx={10} fill="#000" opacity={0.3} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={6} />
    <rect x={-w / 2 + 22} y={-h / 2 + 22} width={w - 44} height={46} rx={4} fill={C.wine} opacity={0.9} />
    <text x={0} y={-h / 2 + 54} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={2} fill={C.paper}>CATALOG</text>
    {Array.from({length: 7}).map((_, i) => <line key={i} x1={-w / 2 + 24} y1={-h / 2 + 96 + i * ((h - 150) / 6)} x2={w / 2 - 24} y2={-h / 2 + 96 + i * ((h - 150) / 6)} stroke={C.ink} strokeWidth={1.5} opacity={0.14} />)}
    {DOTS.slice(0, chalk).map((d, i) => (
      <circle key={`c${i}`} cx={-w / 2 + 48 + d.x * (w - 96)} cy={-h / 2 + 108 + d.y * (h - 180)} r={13} fill={outline > 0.5 ? 'none' : C.chalk} stroke={C.ink} strokeWidth={outline > 0.5 ? 4 : 3} strokeDasharray={outline > 0.5 ? '5 6' : undefined} />
    ))}
    {DOTS.slice(6, 6 + Math.floor(gold)).map((d, i) => {
      const r = lerp(13, 7, small * (i > 5 ? 1 : 0.4));
      const k = clamp01(gold - i);
      return <circle key={`g${i}`} cx={-w / 2 + 48 + ((d.x * 0.93 + 0.04) * (w - 96))} cy={-h / 2 + 108 + ((d.y * 0.93 + 0.03) * (h - 180))} r={r * (0.4 + 0.6 * k)} fill={outline > 0.5 ? 'none' : C.gold} stroke={C.ink} strokeWidth={outline > 0.5 ? 3 : 2.5} strokeDasharray={outline > 0.5 ? '4 5' : undefined} opacity={k} />;
    })}
    {stamp > 0.05 && (
      <g transform={`translate(${w / 2 - 120} ${h / 2 - 90}) rotate(-12) scale(${0.8 + 0.2 * stamp})`} opacity={clamp01(stamp * 1.8)}>
        <rect x={-152} y={-30} width={304} height={60} rx={6} fill="none" stroke={C.wine} strokeWidth={6} />
        <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1.5} fill={C.wine}>CHECKED BY HAND</text>
      </g>
    )}
    {tab > 0.05 && (
      <g transform={`translate(${w / 2} ${-h / 2 + 150 - 30 * (1 - tab)})`} opacity={clamp01(tab * 2)}>
        <rect x={-6} y={-22} width={110} height={44} rx={6} fill={C.mint} stroke={C.ink} strokeWidth={4} />
        <text x={49} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>LOCAL</text>
      </g>
    )}
    {note > 0.05 && (
      <g transform={`translate(0 ${h / 2 - 40}) rotate(-3)`} opacity={clamp01(note * 2)}>
        <text x={0} y={0} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1} fill={C.coral}>2018 TO 2019 ONLY</text>
        <line x1={-160} y1={10} x2={-160 + 320 * note} y2={10} stroke={C.coral} strokeWidth={4} />
      </g>
    )}
  </g>
);

/** a small mint-lit dome for the arrays (not the full Bunk). lit 0..1 */
const Dome: React.FC<{x: number; y: number; r?: number; lit?: number; f?: number}> = ({x, y, r = 12, lit = 1, f = 0}) => (
  <g>
    <ellipse cx={x} cy={y + r * 0.9} rx={r * 1.5} ry={r * 0.35} fill="#000" opacity={0.35 * lit} />
    <rect x={x - r * 0.8} y={y - r * 0.2} width={r * 1.6} height={r * 1.1} rx={r * 0.25} fill="#46606B" stroke={C.ink} strokeWidth={Math.max(2, r * 0.22)} />
    <circle cx={x} cy={y - r * 0.2} r={r} fill={lit > 0.1 ? C.mint : '#2F4A45'} stroke={C.ink} strokeWidth={Math.max(2, r * 0.22)} opacity={0.35 + 0.65 * lit} />
    {lit > 0.4 && <circle cx={x} cy={y - r * 0.2} r={r * (1.6 + 0.5 * Math.sin(f / 12 + x))} fill="none" stroke={C.mint} strokeWidth={2} opacity={0.35 * lit} />}
  </g>
);

const Confetti: React.FC<{f: number; n?: number}> = ({f, n = 46}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const cyc = 260 + (i % 7) * 30;
      const t = ((f + i * 37) % cyc) / cyc;
      const x = (i * 83 + 40 * Math.sin(f / 16 + i)) % 1080;
      const y = 380 + t * 1020;
      return <rect key={i} x={x} y={y} width={12} height={18} fill={[C.gold, C.coral, C.mint, C.chalk][i % 4]} opacity={0.9} transform={`rotate(${f * 4 + i * 30} ${x} ${y})`} />;
    })}
  </g>
);

const Hand: React.FC<{x: number; y: number; s?: number; rot?: number; sleeve?: string}> = ({x, y, s = 1, rot = 0, sleeve = '#7A3A4C'}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-26} y={20} width={52} height={150} rx={12} fill={sleeve} stroke={C.ink} strokeWidth={5} />
    <path d="M -34,28 q -4,-48 8,-62 q 10,-8 14,6 l 0,-26 q 12,-8 16,8 l 0,26 q 12,-6 14,10 l 0,44 z" fill="#F0C9A8" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
  </g>
);

const Analyst: React.FC<{f: number; x: number; y: number; s?: number; write?: number; flip?: number}> = ({f, x, y, s = 1, write = 0, flip = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
    <ellipse cx={0} cy={158} rx={90} ry={14} fill="#000" opacity={0.35} />
    <path d="M -70,150 q 0,-150 70,-150 q 70,0 70,150 z" fill="#5B6E7A" stroke={C.ink} strokeWidth={6} />
    <circle cx={0} cy={-52} r={52} fill="#F0C9A8" stroke={C.ink} strokeWidth={6} />
    <path d="M -50,-62 q 10,-52 50,-52 q 40,0 50,52 q -22,-26 -50,-26 q -28,0 -50,26 z" fill="#3A2A22" stroke={C.ink} strokeWidth={5} />
    {[-18, 18].map((ex, i) => <g key={i}><circle cx={ex} cy={-50} r={13} fill={C.white} stroke={C.ink} strokeWidth={4} /><circle cx={ex + 2} cy={-48} r={5} fill={C.ink} /></g>)}
    <path d="M -12,-18 q 12,10 24,0" stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
    <g transform={`translate(${64 - 30 * write * Math.sin(f / 7)} ${34 + 20 * Math.sin(f / 5) * write}) rotate(${-20 + write * 34 * Math.sin(f / 4)})`}>
      <rect x={-8} y={-10} width={16} height={86} rx={6} fill="#F0C9A8" stroke={C.ink} strokeWidth={5} />
      <rect x={-5} y={64} width={10} height={64} rx={3} fill={C.gold} stroke={C.ink} strokeWidth={4} />
      <path d="M -5,128 l 5,16 l 5,-16 z" fill={C.ink} />
    </g>
  </g>
);

/** a seismogram squiggle: wave with a sharp first arrival at ax. */
const Squiggle: React.FC<{x: number; y: number; w?: number; a?: number; ax?: number; color?: string; sw?: number; draw?: number; f?: number}> = ({x, y, w = 760, a = 70, ax = 0.34, color = C.chalk, sw = 5, draw = 1, f = 0}) => {
  const n = 120;
  let d = '';
  for (let i = 0; i <= n * clamp01(draw); i++) {
    const t = i / n;
    const env = t < ax ? 0.05 : Math.exp(-(t - ax) * 3.2) * (t < ax + 0.03 ? 0.6 + (t - ax) * 14 : 1);
    const yy = y - a * env * Math.sin(i * 1.9 + f * 0.0) - 5 * Math.sin(i * 0.7);
    d += (i ? 'L' : 'M') + (x - w / 2 + t * w).toFixed(1) + ',' + yy.toFixed(1) + ' ';
  }
  return <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
};

// ---- throughline band: the Sheet's states --------------------------------------------------------------------------------------------
const TOPS = [{k: 1, t: 'BARE'}, {k: 7, t: 'CHECKED'}, {k: 35, t: 'TUNED'}, {k: 16, t: '~3X'}, {k: 43, t: 'SAME MAP'}, {k: 25, t: '2018 TO 2019'}, {k: 28, t: 'OUTLINE'}];
const Bands: React.FC<{beats: Beat[]}> = ({beats}) => {
  const f = useCurrentFrame();
  const at = (k: number) => {
    const x = beats.find((y) => y.id === (IDS[k] ?? k));
    return x ? Math.round(x.at * 30) : 99999;
  };
  const cur = TOPS.filter((q) => f >= at(q.k)).length - 1;
  return (
    <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <g data-band="ok">
        <text x={60} y={150} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill={C.cream} opacity={0.75}>THE CATALOG SHEET · STATE</text>
        {TOPS.map((q, i) => {
          const x = 60 + i * 138, on = i <= cur, now = i === cur;
          return (
            <g key={i} transform={`translate(${x} 205)`}>
              <rect x={0} y={-30} width={126} height={60} rx={10} fill={now ? C.gold : on ? C.wine : '#2A0F1F'} stroke={now ? C.ink : C.chalk} strokeWidth={now ? 5 : 3} opacity={on ? 1 : 0.8} />
              <text x={63} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={q.t.length > 9 ? 17 : q.t.length > 7 ? 22 : 25} fill={now ? C.ink : q.t.startsWith('2018') ? C.coral : C.cream}>{q.t}</text>
            </g>
          );
        })}
        <line x1={60} y1={262} x2={1020} y2={262} stroke={C.cream} strokeWidth={3} strokeDasharray="6 10" opacity={0.5} />
        <circle cx={60 + Math.max(0, cur) * 138 + 63} cy={262} r={9} fill={C.mint} />
      </g>
    </svg>
  );
};

const win = (f: number, a: number, b2: number, d = 12) => ease(f, a, d) * (1 - ease(f, b2 - 8, 8));
// ---- S1: a front-on stage, the Robot takes a bow, a trapdoor opens on Bunk ---------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const bow = bump(f, 20, 60) * 0.8;
  const crown = springy(f, b(2), 18);
  const hug = easeIO(f, b(2), 16);
  const door = easeIO(f, b(3) - 6, 20);
  const reveal = easeIO(f, b(3), 26);
  const sh = ease(f, b(31), 18);
  return (
    <Frame p={p} look="stage" z0={1.0} z1={1.08} oy={1000}>
      <SVG>
        <rect x={0} y={880} width={1080} height={420} fill="#3A1626" />
        <rect x={0} y={1290} width={1080} height={40} fill="#14060F" />
        <path d="M -20,380 L 220,380 Q 330,900 190,1300 L -20,1300 Z" fill="#6B2A3E" stroke={C.ink} strokeWidth={6} />
        <path d="M 1100,380 L 860,380 Q 750,900 890,1300 L 1100,1300 Z" fill="#6B2A3E" stroke={C.ink} strokeWidth={6} />
        <polygon points="540,300 250,1230 830,1230" fill={C.gold} opacity={0.12 + 0.04 * Math.sin(f / 9)} />
        <Sheet x={170} y={800} s={0.34} chalk={6} gold={0} rot={-6 + 2 * Math.sin(f / 14)} />
        <Lab text="2018 TO 2019" x={170} y={935} size={20} tone="plate" p={sh} />
        <Robot f={f} x={540} y={1310} s={1.12} emotion="greedy" bow={bow} crown={crown} />
        <g transform={`translate(${lerp(540, 540, hug)} ${lerp(670, 1000, hug)})`} opacity={(1 - easeIO(f, b(2) + 4, 9)) * (1 - ease(f, b(3) - 4, 10))}>
          <rect x={-340} y={-62} width={680} height={124} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={7} />
          <text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={1} fill={C.wine}>AI FINDS ~3X THE QUAKES</text>
          <line x1={-290} y1={-62} x2={-290} y2={-200} stroke={C.ink} strokeWidth={5} opacity={1 - hug} />
          <line x1={290} y1={-62} x2={290} y2={-200} stroke={C.ink} strokeWidth={5} opacity={1 - hug} />
        </g>
        <g opacity={door}>
          <rect x={300} y={1296} width={480} height={30} fill="#14060F" />
          <g transform={`translate(300 1296) rotate(${-80 * door})`}><rect width={240} height={22} fill="#7A3A4C" stroke={C.ink} strokeWidth={4} /></g>
          <g transform={`translate(780 1296) scale(-1 1) rotate(${-80 * door})`}><rect width={240} height={22} fill="#7A3A4C" stroke={C.ink} strokeWidth={4} /></g>
        </g>
        <g opacity={reveal} transform={`translate(0 ${(1 - reveal) * 80})`}>
          <rect x={180} y={1000} width={720} height={320} rx={16} fill="#0E040A" stroke={C.chalk} strokeWidth={5} />
          <rect x={186} y={1006} width={708} height={308} rx={12} fill="#1F0A16" />
          <Bunk f={f} x={540} y={1296} s={0.85} detect={0.25 + 0.2 * reveal} eye={reveal} mood="wry" />
        </g>
        <Confetti f={f} n={24} />
        <Plate x={540} y={584} text="ALL THE CREDIT?" size={36} tone="glow" p={ease(f, b(2), 14) * (1 - ease(f, b(3) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="THE PAPER SAYS OTHERWISE" size={32} tone="warn" p={ease(f, b(3), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S2: Bunk wakes, 75 domes light in a wave, 30 on land ----------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const wave = f - b(5);
  const pins = f - b(6);
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={1000}>
      <SVG>
        <rect data-band="ok" x={0} y={1180} width={1080} height={300} fill="#3A1626" />
        <path d="M 0,1180 Q 270,1150 540,1180 T 1080,1170" stroke={C.ink} strokeWidth={6} fill="none" />
        {[0, 1, 2].map((row) =>
          Array.from({length: 25}).map((_, i) => {
            const x = 40 + i * 41.5 + (row % 2) * 18;
            const y = 1300 + row * 62;
            const lit = wave < 0 ? 0.15 : clamp01((wave - (i + row * 3) * 1.6) / 10);
            return <Dome key={`${row}-${i}`} x={x} y={y} r={7 + row * 2.4} lit={lit} f={f} />;
          }),
        )}
        <HeldProp f={f} px={540} py={1250} w={260} h={420} seed={2} gain={2.2} kind="rest"><Bunk f={f} x={540} y={1250} s={1.45} detect={1} eye={ease(f, 0, 14)} mood="curious" look={Math.sin(f / 40)} /></HeldProp>
        <g transform="translate(0 0)">
          <path d="M 120,760 q 140,-60 300,-10 t 260,10 t 280,-30" stroke={C.cream} strokeWidth={8} fill="none" strokeLinecap="round" />
          {Array.from({length: 30}).map((_, i) => {
            const x = 130 + i * 31.5;
            const y = 745 + 20 * Math.sin(i * 0.4) - (i > 9 ? 30 : 0);
            const on = clamp01((pins - i * 1.4) / 8);
            return on > 0 ? <g key={i} transform={`translate(${x} ${y - 16 * (1 - on)})`} opacity={on}><circle r={9} fill={C.chalk} stroke={C.ink} strokeWidth={3} /><line x1={0} y1={9} x2={0} y2={22} stroke={C.ink} strokeWidth={3} /></g> : null;
          })}
          <Lab text="ALASKA PENINSULA" x={540} y={850} size={20} tone="plate" p={ease(f, 10, 16)} />
        </g>
                <Plate x={540} y={584} text="BUNK · SEAFLOOR SEISMOMETER" size={28} tone="dark" p={ease(f, b(4), 14) * (1 - ease(f, b(33) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="STARTING IN 2018" size={36} tone="dark" p={ease(f, b(33), 14) * (1 - ease(f, b(5) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="75 ON THE SEAFLOOR" size={36} tone="glow" p={ease(f, b(5), 14) * (1 - ease(f, b(6) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="30 ON LAND" size={36} tone="dark" p={ease(f, b(6), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S3: the analyst checks by hand, the authors' hands carry the Sheet away ------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const draw = easeIO(f, 4, 40);
  const stamp = springy(f, b(7) + 24, 14);
  const slide = easeIO(f, b(8), 30);
  const hand2 = ease(f, b(9), 20);
  const letgo = ease(f, b(9) + 10, 16);
  return (
    <Frame p={p} look="paper" z0={1.02} z1={1.12} oy={980}>
      <SVG>
        <rect x={0} y={1110} width={1080} height={220} fill="#5A2538" stroke={C.ink} strokeWidth={6} />
        <rect x={140} y={820} width={560} height={300} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
        <Squiggle x={420} y={980} w={480} a={70} ax={0.34} color={C.ink} sw={5} draw={draw} f={f} />
        <rect x={160 + ((f * 5) % 520)} y={832} width={14} height={276} fill={C.gold} opacity={0.55 * (1 - slide)} />
        <line x1={420 - 240 + 0.34 * 480} y1={900} x2={420 - 240 + 0.34 * 480} y2={1040} stroke={C.coral} strokeWidth={6} opacity={ease(f, b(7), 10)} />
        <HeldProp f={f} px={850} py={930} w={220} h={320} seed={5} gain={2.0} kind="rest"><Analyst f={f} x={850} y={930} s={1.15} write={ease(f, 0, 10) * (1 - slide)} flip={-1} /></HeldProp>
        <g transform={`translate(${lerp(560, 1200, slide)} ${lerp(1010, 960, slide)})`}>
          <Sheet x={0} y={0} s={0.46} chalk={6} stamp={stamp} />
        </g>
        <Hand x={lerp(1150, 790, hand2)} y={lerp(1220, 1090, hand2) - 40 * slide} s={1.0} rot={-14} sleeve="#6B8FA8" />
        <Hand x={lerp(-100, 280, ease(f, b(8), 20))} y={1130 - 20 * slide} s={1.0} rot={10} sleeve="#8C3B4B" />
        <Lab text="CORNELL" x={285} y={1330} size={20} tone="plate" p={ease(f, b(8), 14)} />
        <Lab text="USGS" x={790} y={1330} size={20} tone="plate" p={hand2 * (1 - letgo * 0.0)} />
                <Plate x={540} y={584} text="CHECKED BY HAND" size={36} tone="glow" p={ease(f, b(7), 14) * (1 - ease(f, b(8) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="BARCHECK · CORNELL" size={34} tone="dark" p={ease(f, b(8), 14) * (1 - ease(f, b(9) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="RUPPERT · USGS" size={34} tone="dark" p={ease(f, b(9), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S4: the Robot marks arrivals, the Sheet slides into its tray ------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const flags = ease(f, b(10), 18);
  const pS = ease(f, b(11), 14);
  const tray = easeIO(f, b(35), 30);
  const drop = easeIO(f, b(35) + 6, 22);
  return (
    <Frame p={p} look="lab" z0={1.0} z1={1.1} oy={1000}>
      <SVG>
        <rect x={80} y={700} width={920} height={220} rx={16} fill="#1A0912" stroke={C.chalk} strokeWidth={6} />
        <Squiggle x={540} y={815} w={820} a={62} ax={0.3} color={C.mint} sw={5} draw={1} f={f} />
        <rect x={90 + ((f * 9) % 860)} y={706} width={16} height={208} fill={C.mint} opacity={0.5} />
        <line x1={80 + 0.3 * 820 + 50} y1={715} x2={80 + 0.3 * 820 + 50} y2={905} stroke={C.gold} strokeWidth={7} opacity={flags} />
        <text x={80 + 0.3 * 820 + 62} y={748} fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.gold} opacity={flags}>P</text>
        <line x1={80 + 0.46 * 820 + 50} y1={715} x2={80 + 0.46 * 820 + 50} y2={905} stroke={C.gold} strokeWidth={7} opacity={pS} />
        <text x={80 + 0.46 * 820 + 62} y={748} fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.gold} opacity={pS}>S</text>
        <HeldProp f={f} px={430} py={1290} w={260} h={380} seed={7} gain={2.2} kind="rest"><Robot f={f} x={430} y={1290} s={0.72} emotion="focused" bow={0} /></HeldProp>
        <rect x={700} y={1170} width={300} height={130} rx={10} fill="#3A1626" stroke={C.ink} strokeWidth={6} />
        <text x={850} y={1286} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.cream}>TRAY</text>
        <g transform={`translate(${lerp(1220, 850, tray)} ${lerp(1040, 1110, tray)})`}><Sheet x={0} y={0} s={0.34} chalk={6} stamp={1} /></g>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${190 + i * 70} ${lerp(1060, 1750, drop) + i * 10}) rotate(${-8 + i * 8 + drop * 40})`} opacity={1 - drop}>
            <rect x={-30} y={-40} width={60} height={80} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
            <circle r={14} fill="none" stroke={C.slate} strokeWidth={4} />
          </g>
        ))}
                <Plate x={540} y={584} text="EQTRANSFORMER · GLOBAL MODEL" size={28} tone="dark" p={ease(f, b(10), 14) * (1 - ease(f, b(11) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="FINDS QUAKES · MARKS ARRIVALS" size={28} tone="glow" p={ease(f, b(11), 14) * (1 - ease(f, b(35) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate text="FINE-TUNED ON HAND-CHECKED PICKS" x={540} y={600} displayLines={["FINE-TUNED ON", "HAND-CHECKED PICKS"]} size={30} tone="dark" p={ease(f, b(35), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S5: four training tricks sprint and tie ----------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const go = f - b(12);
  const photo = ease(f, b(13), 10);
  const cols = [C.coral, C.mint, C.gold];
  const names = ['STARTING MODEL', 'FILTERS', 'SPLITS'];
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={1000}>
      <SVG>
        <rect x={60} y={760} width={960} height={520} rx={12} fill="#3A1626" stroke={C.ink} strokeWidth={6} />
        {[0, 1, 2].map((i) => {
          const y = 840 + i * 150;
          const run = go < 0 ? 0 : clamp01(go / 150);
          const wob = [0.0, 0.1, -0.09][i] * Math.sin(go / 14 + i * 1.7) * (1 - photo);
          const prog = go < 0 ? 0 : easeIO(f, b(12), Math.max(150, b(13) - b(12) - 6)) * (1 + wob * 2.5);
          const x = lerp(140, 860, clamp01(prog) * (photo > 0.1 ? 1 : 0.97));
          return (
            <g key={i}>
              <line x1={120} y1={y + 52} x2={940} y2={y + 52} stroke={C.cream} strokeWidth={3} strokeDasharray="10 12" opacity={0.5} />
              <g transform={`translate(${x} ${y + 8 * Math.sin(f / 3 + i)})`} opacity={1}>
                <path d="M -50,-10 q -40,20 -60,50 q 30,-6 52,-18 z" fill={cols[i]} stroke={C.ink} strokeWidth={4} opacity={0.9} />
                <circle r={48} fill={C.paper} stroke={C.ink} strokeWidth={6} />
                <circle cx={10} cy={-6} r={6} fill={C.ink} /><circle cx={-8} cy={-6} r={6} fill={C.ink} />
                <path d="M -10,14 q 10,8 20,0" stroke={C.ink} strokeWidth={4} fill="none" />
                {run > 0 && run < 1 && <line x1={-70} y1={0} x2={-110} y2={0} stroke={C.cream} strokeWidth={4} opacity={0.6} />}
              </g>
              <text x={150} y={y - 12} fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.cream} opacity={0.9}>{names[i]}</text>
              {photo > 0.2 && <g transform={`translate(920 ${y + 6})`} opacity={photo}><circle r={26} fill="#2A0F1F" stroke={C.chalk} strokeWidth={5} /><circle r={14} fill="none" stroke={C.chalk} strokeWidth={3} strokeDasharray="4 4" /></g>}
            </g>
          );
        })}
        <line x1={890} y1={780} x2={890} y2={1260} stroke={C.chalk} strokeWidth={8} opacity={0.9} />
        {photo > 0.2 && <rect x={60} y={760} width={960} height={520} fill="#FFF8EC" opacity={0.12 * (1 - photo * 0.5)} />}
        <g transform="translate(780 1290)">
          <rect x={-150} y={-40} width={300} height={64} rx={6} fill="#1A0912" stroke={C.chalk} strokeWidth={4} />
          <text x={0} y={-8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.cream}>IMPROVEMENT</text>
          <line x1={-130} y1={12} x2={-20} y2={12} stroke={C.slate} strokeWidth={8} strokeLinecap="round" />
        </g>
                <Plate x={540} y={584} text="SEVERAL TRAINING TRICKS" size={30} tone="dark" p={ease(f, b(12), 14) * (1 - ease(f, b(37) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="STARTING MODEL · FILTERS · SPLITS" size={26} tone="dark" p={ease(f, b(37), 14) * (1 - ease(f, b(13) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="NONE SUBSTANTIALLY BETTER" size={28} tone="glow" p={ease(f, b(13), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S6: a reel pours Alaska waveforms into the Robot, gold dots pop out -------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const hal = ease(f, b(15), 24);
  const gold = f - b(50);
  return (
    <Frame p={p} look="lab" z0={1.02} z1={1.14} oy={1000}>
      <SVG>
        <g transform={`translate(260 1000) rotate(${f * 3})`}>
          <circle r={190} fill="#1A0912" stroke={C.chalk} strokeWidth={8} />
          {Array.from({length: 6}).map((_, i) => <line key={i} x1={0} y1={0} x2={0} y2={-170} stroke={C.chalk} strokeWidth={8} transform={`rotate(${i * 60})`} />)}
          <circle r={34} fill={C.gold} stroke={C.ink} strokeWidth={6} />
        </g>
        <path d="M 440,950 C 600,900 700,1000 820,960" stroke={C.mint} strokeWidth={10} fill="none" />
        <rect x={720} y={880} width={280} height={190} rx={14} fill="#3A1626" stroke={C.ink} strokeWidth={6} />
        <text x={860} y={1130} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.cream}>ROBOT SLOT</text>
        {Array.from({length: 22}).map((_, i) => {
          const t = ((f * 0.02 + i / 22) % 1);
          const x = 440 + t * 420;
          const y = 950 + 30 * Math.sin(t * 9 + i) - 20 * Math.sin(t * Math.PI);
          return <rect key={i} x={x} y={y - 10 + 8 * Math.sin(i + f / 6)} width={10} height={20 + 18 * Math.sin(i * 1.3) ** 2} fill={C.mint} opacity={0.9} />;
        })}
        <g transform="translate(0 0)">
          <Sheet x={820} y={1280} s={0.3} chalk={6} gold={0} stamp={1} tab={ease(f, b(14) + 10, 18)} />
        </g>
        {Array.from({length: 12}).map((_, i) => {
          const on = clamp01((gold - i * 6) / 10);
          return on > 0 ? <circle key={i} cx={470 + (i % 6) * 70} cy={1180 + Math.floor(i / 6) * 60 - 20 * (1 - on)} r={12 * on} fill={C.gold} stroke={C.ink} strokeWidth={3} /> : null;
        }) }
        <g opacity={hal} transform={`translate(${lerp(1200, 600, hal)} 760)`}>
          <Halibut x={0} y={0} scale={0.32} f={f} facing={-1} swim={0.5} />
          <path d="M -140,60 q 20,-60 40,0 t 40,0 t 40,0" stroke={C.coral} strokeWidth={6} fill="none" />
          <rect x={-170} y={20} width={150} height={90} rx={8} fill="none" stroke={C.cream} strokeWidth={5} strokeDasharray="10 8" />
        </g>
                <Plate x={540} y={584} text="THE ALASKA DATA ITSELF" size={32} tone="glow" p={ease(f, b(14), 14) * (1 - ease(f, b(15) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="REAL OR NOISE?" size={38} tone="warn" p={ease(f, b(15), 14) * (1 - ease(f, b(50) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="HUNTING SMALL QUAKES" size={32} tone="dark" p={ease(f, b(50), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S7: the Sheet stack fills with gold to ~3X, the size key slides down ---------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const fill = easeIO(f, b(16), 170);
  const goldN = fill * 12;
  const key = easeIO(f, b(18), 26);
  const tag = springy(f, b(17), 16);
  const num = springy(f, b(16) + 40, 18);
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={1000}>
      <SVG>
        <HeldProp f={f} px={470} py={1040} w={620} h={760} seed={9} gain={4} kind="float"><Sheet x={470} y={1040} s={0.95} w={620} h={760} chalk={6} gold={goldN} small={key} stamp={0} tab={1} /></HeldProp>
        <g transform={`translate(${930} ${760})`} opacity={0.95}>
          <rect x={-18} y={0} width={90} height={420} rx={10} fill="#1A0912" stroke={C.chalk} strokeWidth={5} />
          <text x={27} y={-14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.cream}>SIZE</text>
          <rect x={-18} y={40 + key * 150} width={90} height={26} rx={5} fill={C.gold} stroke={C.ink} strokeWidth={4} />
          <circle cx={27} cy={110} r={16} fill="none" stroke={C.chalk} strokeWidth={3} />
          <circle cx={27} cy={210} r={10} fill="none" stroke={C.chalk} strokeWidth={3} />
          <circle cx={27} cy={300} r={6} fill="none" stroke={C.chalk} strokeWidth={3} />
        </g>
        <g transform={`translate(880 ${700 - 20 * (1 - num)}) scale(${0.6 + 0.4 * num})`} opacity={num}>
          <text x={0} y={0} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={96} fill={C.gold} stroke={C.ink} strokeWidth={8} paintOrder="stroke">~3X</text>
        </g>
        <g transform={`translate(330 ${1300 + 30 * (1 - tag)}) rotate(${6 - 6 * tag})`} opacity={tag}>
          <rect x={-170} y={-28} width={340} height={56} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.wine}>PER THE AUTHORS</text>
        </g>
                <Plate x={540} y={584} text="~3X MORE EARTHQUAKES" size={34} tone="glow" p={ease(f, b(16), 14) * (1 - ease(f, b(39) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="NEW DOTS" size={34} tone="dark" p={ease(f, b(39), 14) * (1 - ease(f, b(18) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate text="SMALLEST QUAKE CAUGHT DOWN 0.1 TO 0.4" x={540} y={600} displayLines={["SMALLEST QUAKE CAUGHT", "DOWN 0.1 TO 0.4"]} size={28} tone="glow" p={ease(f, b(18), 14) * (1 - ease(f, b(41) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="SMALLER QUAKES NOW CAUGHT" size={30} tone="dark" p={ease(f, b(41), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S8: gold dots flare offshore, the plate bends at the outer rise, Bunk answers in mint -----------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const flare = ease(f, b(20), 30);
  const bend = easeIO(f, b(19), 34);
  const ring = f - b(42);
  const plate = (x: number) => {
    // outer rise bulge near x=260, then diving to the right
    const bulge = 24 * Math.exp(-((x - 260) ** 2) / 4000) * bend;
    const dive = x > 420 ? (x - 420) * 0.55 : 0;
    return 1180 - bulge + dive;
  };
  const pts = Array.from({length: 41}).map((_, i) => {
    const x = i * 27;
    return `${x},${plate(x)}`;
  }).join(' ');
  return (
    <Frame p={p} z0={1.0} z1={1.08} oy={1000}>
      <SVG>
        <rect x={0} y={900} width={1080} height={80} fill="#2C6E86" opacity={0.35} />
        <path d="M 0,940 Q 270,920 540,940 T 1080,930" stroke={C.cream} strokeWidth={5} fill="none" opacity={0.6} />
        <polygon points={`0,1320 ${pts} 1080,1320`} fill="#5A2538" stroke={C.ink} strokeWidth={6} />
        <polygon points={`620,1010 1080,990 1080,1100 760,1180`} fill="#3A1626" stroke={C.ink} strokeWidth={5} />
        <text x={880} y={1060} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.cream}>ALASKA PENINSULA</text>
        {Array.from({length: 44}).map((_, i) => {
          const x = 20 + ((i * 97) % 700);
          const off = x < 520 ? 1 : 0.35;
          const on = clamp01((flare * 1.6 - (i % 11) * 0.06)) * off;
          return on > 0.05 ? <circle key={i} cx={x} cy={plate(x) - 40 - ((i * 53) % 60)} r={(x < 520 ? 12 : 7) * on * (1 + 0.3 * Math.sin(f / 6 + i))} fill={C.gold} stroke={C.ink} strokeWidth={2.5} opacity={0.4 + 0.6 * on} /> : null;
        }) }
        {[560, 640, 720, 800, 880].map((x, i) => <Dome key={i} x={x} y={plate(x) - 8} r={8} lit={0.4} f={f} />)}
        {ring > 0 && ring < 90 && <circle cx={250} cy={plate(250) - 80} r={30 + ring * 5} fill="none" stroke={C.gold} strokeWidth={8} opacity={1 - ring / 90} />}
        <g opacity={bend}>
          <path d="M 180,1020 q 70,-70 140,0" stroke={C.cream} strokeWidth={5} fill="none" />
          <text x={250} y={960} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.cream}>BULGE</text>
        </g>
                <Plate x={540} y={584} text="BIGGEST GAINS · FAR OFFSHORE" size={28} tone="glow" p={ease(f, b(20), 14) * (1 - ease(f, b(19) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate text="OUTER RISE PLATE BENDS BEFORE IT DIVES" x={540} y={600} displayLines={["OUTER RISE", "PLATE BENDS BEFORE IT DIVES"]} size={28} tone="dark" p={ease(f, b(19), 14) * (1 - ease(f, b(42) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="BIGGEST GAINS · OUTER RISE" size={34} tone="dark" p={ease(f, b(42), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S9: real or noise, the ghost map snaps over the new dots ---------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const wob = Math.sin(Math.max(0, f - b(21)) / 5) * (1 - ease(f, b(43), 10));
  const ghost = springy(f, b(43), 22);
  const done = ease(f, b(22), 20);
  const clusters = [[330, 940], [560, 1060], [760, 900], [440, 1180]];
  return (
    <Frame p={p} look="paper" z0={1.0} z1={1.1} oy={1000}>
      <SVG>
        <rect x={110} y={760} width={860} height={560} rx={14} fill="#1A0912" stroke={C.chalk} strokeWidth={6} />
        <path d="M 130,1360 Q 400,1100 700,1180 T 950,780" stroke={C.cream} strokeWidth={6} fill="none" opacity={0.5} />
        {clusters.map(([cx, cy], k) => Array.from({length: 5}).map((_, i) => (
          <circle key={`o${k}-${i}`} cx={cx + ((i * 37) % 70) - 30} cy={cy + ((i * 53) % 60) - 25} r={12} fill={C.chalk} stroke={C.ink} strokeWidth={3} />
        )))}
        {clusters.map(([cx, cy], k) => Array.from({length: 12}).map((_, i) => (
          <circle key={`n${k}-${i}`} cx={cx + ((i * 41) % 110) - 50} cy={cy + ((i * 59) % 100) - 45} r={7} fill={C.gold} stroke={C.ink} strokeWidth={2} opacity={0.95} />
        )))}
        <circle cx={880} cy={1300} r={9} fill={C.gold} />
        <g opacity={ghost} transform={`translate(0 ${(1 - ghost) * -60})`}>
          {clusters.map(([cx, cy], k) => <ellipse key={k} cx={cx} cy={cy} rx={100} ry={80} fill="none" stroke={C.mint} strokeWidth={5} strokeDasharray="12 10" />)}
        </g>
        <g transform={`translate(${740 + 26 * wob} 1200) rotate(${wob * 10})`} opacity={1 - done * 0.0}>
          <rect x={-90} y={-60} width={180} height={120} rx={8} fill="none" stroke={C.cream} strokeWidth={5} strokeDasharray={done > 0.5 ? '4 8' : '10 8'} />
          <path d="M -50,10 q 14,-40 28,0 t 28,0 t 28,0" stroke={C.coral} strokeWidth={5} fill="none" opacity={1 - ghost * 0.6} />
          {done > 0.3 && <Lab text="ABSTRACT GIVES NO FALSE ALARM RATE" x={-40} y={92} size={16} tone="warn" p={done} />}
        </g>
        <Halibut x={300} y={1450} scale={0.26} f={f} facing={1} swim={0.4} />
                <Plate x={540} y={584} text="REAL OR NOISE?" size={38} tone="warn" p={ease(f, b(21), 14) * (1 - ease(f, b(43) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate text="LANDS WHERE QUAKES ALREADY CLUSTER" x={540} y={600} displayLines={["LANDS WHERE QUAKES", "ALREADY CLUSTER"]} size={30} tone="glow" p={ease(f, b(43), 14) * (1 - ease(f, b(22) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="CONSISTENT WITH EARLIER MAPS" size={26} tone="dark" p={ease(f, b(22), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S10: the limit, a 2018 to 2019 window, the same wiggle heard by more ears, a crane lifts the first dome -----------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const bar = easeIO(f, b(23), 30);
  const second = ease(f, b(44), 20);
  const sign = springy(f, b(24), 18);
  const crane = easeIO(f, b(25), 40);
  return (
    <Frame p={p} z0={1.02} z1={1.12} oy={1000}>
      <SVG>
        <rect x={80} y={740} width={920} height={250} rx={12} fill="#1A0912" stroke={C.chalk} strokeWidth={5} />
        <Squiggle x={540} y={870} w={840} a={64} ax={0.32} color={C.chalk} sw={5} draw={easeIO(f, 6, 60)} />
        <rect x={80} y={740} width={920 * bar} height={250} rx={12} fill={C.coral} opacity={0.14} stroke={C.coral} strokeWidth={5} strokeDasharray="12 8" />
        <text x={140} y={780} fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.coral} opacity={bar}>2018 TO 2019</text>
        <rect x={80} y={990} width={920} height={230} rx={12} fill="#1A0912" stroke={C.chalk} strokeWidth={5} opacity={second} />
        <g opacity={second}>
          <Squiggle x={540} y={1100} w={840} a={58} ax={0.32} color={C.chalk} sw={5} draw={easeIO(f, b(44), 40)} />
          <text x={110} y={1028} fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.cream}>SAME RECORDING</text>
          {[0.34, 0.5, 0.66].map((u, i) => <circle key={`c${i}`} cx={120 + u * 840} cy={1190} r={12} fill={C.chalk} stroke={C.ink} strokeWidth={3} />)}
          {[0.34, 0.4, 0.46, 0.52, 0.58, 0.64, 0.7, 0.76, 0.82].map((u, i) => <circle key={`g${i}`} cx={120 + u * 840} cy={1150} r={10} fill={C.gold} stroke={C.ink} strokeWidth={3} opacity={clamp01(second * 3 - i * 0.25)} />)}
          <text x={470} y={1028} fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.gold}>PICKER ~3X</text>
          <text x={110} y={1212} fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.chalk}>ANALYST-CHECKED</text>
        </g>
        <g transform={`translate(540 ${1292 + 30 * (1 - sign)}) rotate(${-5 + 5 * sign})`} opacity={sign}>
          <rect x={-300} y={-40} width={600} height={80} rx={8} fill={C.paper} stroke={C.coral} strokeWidth={6} />
          <text x={0} y={-2} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.coral}>MORE HEARD</text>
          <text x={0} y={28} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.coral}>NOT PROOF OF MORE SHAKING</text>
        </g>
        <g transform={`translate(${860} 0)`} opacity={crane}>
          <line x1={0} y1={420} x2={0} y2={lerp(420, 1180, crane)} stroke={C.cream} strokeWidth={6} />
          <path d={`M -22,${lerp(420, 1180, crane)} h 44 l -8 26 h -28 z`} fill={C.gold} stroke={C.ink} strokeWidth={4} />
          <g transform={`translate(0 ${lerp(1250, 700, easeIO(f, b(25) + 30, 40))})`}><Dome x={0} y={0} r={18} lit={1} f={f} /></g>
        </g>
                <Plate x={540} y={584} text="ONE TEMPORARY EXPERIMENT" size={30} tone="warn" p={ease(f, b(23), 14) * (1 - ease(f, b(44) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="SAME RECORDINGS · MORE PICKED" size={32} tone="dark" p={ease(f, b(44), 14) * (1 - ease(f, b(24) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="MORE HEARD · NOT PROOF OF MORE SHAKING" size={28} tone="warn" p={ease(f, b(24), 14) * (1 - ease(f, b(25) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="2018 TO 2019 ONLY" size={34} tone="warn" p={ease(f, b(25), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S11: the banner swings to LOCAL DATA, the analyst walks on, the Robot bows to them and Bunk ---------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const swing = easeIO(f, b(26), 26);
  const crownDown = easeIO(f, b(45), 22);
  const walk = easeIO(f, b(27), 36);
  const hand = easeIO(f, b(46), 28);
  const bow = bump(f, b(46) + 20, 50) * 0.9;
  return (
    <Frame p={p} look="stage" z0={1.0} z1={1.08} oy={1000}>
      <SVG>
        <rect x={0} y={880} width={1080} height={420} fill="#3A1626" />
        <rect x={0} y={1290} width={1080} height={40} fill="#14060F" />
        <path d="M -20,380 L 220,380 Q 330,900 190,1300 L -20,1300 Z" fill="#6B2A3E" stroke={C.ink} strokeWidth={6} />
        <path d="M 1100,380 L 860,380 Q 750,900 890,1300 L 1100,1300 Z" fill="#6B2A3E" stroke={C.ink} strokeWidth={6} />
        <polygon points={`${lerp(540, 380, swing)},300 ${lerp(250, 150, swing)},1230 ${lerp(830, 640, swing)},1230`} fill={C.mint} opacity={0.12 + 0.04 * Math.sin(f / 9)} />
        <g transform={`translate(540 720) rotate(${lerp(0, 0, swing)})`}>
          <rect x={-310} y={-54} width={620} height={108} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={6} />
          <g transform={`scale(1 ${Math.abs(Math.cos(swing * Math.PI))})`}>
            <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={swing > 0.5 ? 46 : 44} letterSpacing={2} fill={swing > 0.5 ? C.wine : C.ink}>{swing > 0.5 ? 'LOCAL DATA' : 'AI'}</text>
          </g>
        </g>
        <Robot f={f} x={800} y={1290} s={0.85} emotion="greedy" bow={bow} crown={1 - crownDown} />
        <Bunk f={f} x={300} y={1290} s={1.25} detect={1} eye={1} mood="proud" />
        <g transform={`translate(${lerp(-120, 560, walk)} 1010)`}>
          <Analyst f={f} x={0} y={0} s={1.05} write={0} />
          <g transform={`translate(${lerp(0, 150, hand)} ${lerp(0, 0, hand)}) scale(1)`}><Sheet x={-40} y={120} s={0.26} chalk={6} gold={14} stamp={1} /></g>
        </g>
                <Plate x={540} y={584} text="LOCAL DATA MADE IT BETTER" size={30} tone="glow" p={ease(f, b(26), 14) * (1 - ease(f, b(45) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="NOT A CLEVER TRICK" size={36} tone="dark" p={ease(f, b(45), 14) * (1 - ease(f, b(27) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate text="SEAFLOOR EARS + PEOPLE WITH PENCILS" x={540} y={600} displayLines={["SEAFLOOR EARS", "+ PEOPLE WITH PENCILS"]} size={30} tone="dark" p={ease(f, b(27), 14) * (1 - ease(f, b(46) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="HAND-CHECKED PICKS" size={34} tone="glow" p={ease(f, b(46), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

// ---- S12: aerial grid, the crane lifts the domes one by one, one stays lit with a question ---------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lift = f - b(28);
  const q = ease(f, b(29), 18);
  const eyeClose = (f - b(30)) > 0 && (f - b(30)) < 14 ? 0.1 : 1;
  const lastIdx = 37;
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={1000}>
      <SVG>
        <rect x={60} y={700} width={960} height={620} rx={14} fill="#1A0912" stroke={C.chalk} strokeWidth={5} />
        {Array.from({length: 75}).map((_, i) => {
          const col = i % 15, row = Math.floor(i / 15);
          const x = 110 + col * 62, y = 800 + row * 120;
          const t = lift < 0 ? 0 : (lift - (i * 3.2)) / 14;
          const gone = i !== lastIdx && t > 0.5;
          return <Dome key={i} x={x} y={y} r={14} lit={i === lastIdx ? 1 : gone ? 0 : 1 - clamp01(t)} f={f} />;
        })}
        <g transform={`translate(${lerp(120, 940, clamp01(lift / 200))} ${lerp(680, 1380, clamp01(lift / 200))})`} opacity={lift > 0 ? 1 : 0}>
          <line x1={0} y1={-300} x2={0} y2={0} stroke={C.cream} strokeWidth={6} />
          <path d="M -24,0 h 48 l -8 26 h -32 z" fill={C.gold} stroke={C.ink} strokeWidth={4} />
        </g>
        <g transform={`translate(${110 + (lastIdx % 15) * 62} ${800 + Math.floor(lastIdx / 15) * 120 - 70 - 12 * (1 - q)})`} opacity={q}>
          <text textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={72} fill={C.mint} stroke={C.ink} strokeWidth={6} paintOrder="stroke">?</text>
        </g>
                <Plate x={540} y={584} text="THE EARS COME UP" size={36} tone="warn" p={ease(f, b(28), 14) * (1 - ease(f, b(48) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <Plate x={540} y={584} text="ONE ARRAY · 2018 TO 2019" size={30} tone="dark" p={ease(f, b(48), 14) * (1 - ease(f, b(29) - 10, 8))} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
        <g opacity={q}><Bunk f={f} x={540} y={1300} s={1.15} detect={0.9} eye={eyeClose} mood="curious" look={Math.sin(f / 30)} /></g>
        <Plate text="WILL THE EARS GO BACK DOWN?" x={540} y={600} displayLines={["WILL THE EARS", "GO BACK DOWN?"]} size={34} tone="glow" p={ease(f, b(29), 14)} /> {/* plate-overlap-ok: each plate retires before the next lands, gated by p */}
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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

export const ep1104Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1104Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1104: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 10.8, 22.5, 34.1, 45.0, 54.9, 64.1, 77.9, 86.2, 94.5, 106.9, 118.7, 129.1].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><Bands beats={bs} /></Sequence>
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1A0912" ink="#F2EBDD" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
