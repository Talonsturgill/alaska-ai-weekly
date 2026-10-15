import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK, ContactShadow, tones, FormGradient} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {Gate, ThresholdGate, AperturePlate} from './lib/civics';
import {QuestionToken} from './lib/credentials';
import {ServerMachine, AlaskaMini} from './lib/kit';
import {ReviewPen, TallyCounter} from './lib/props';
import {IDS} from './Ep1015Ids';

// THE DOOR WITH A CONDITION, 2026-10-15. Palette roles are art_direction.json. CRANBERRY is only the Gate, LARCH GOLD only the
// question token, NAVY only an official stamp, STEEL and COPPER only the server machine. Every painted string is a claims.json
// on_screen string, a quote, or a plain label. The pen never writes any ink, so the STANDARDS sheet is blank to the end.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const PAL = {
  pearl: '#DDE3EA', pearlHi: '#EEF1F4', fog: '#C9D3DD', fogWhite: '#F7F9FA', cran: '#8E2F4A', cranDeep: '#6A2238', cranHi: '#B24E6A',
  gold: '#E3B23C', goldDeep: '#9A6F12', goldHi: '#FFF4D0', navy: '#1F3A5C', desk: '#2C4A6E', teal: '#1B2E34', panel: '#223A44',
  birch: '#F4F1E6', steel: '#7C8A96', copper: '#B26B3C', pearlSteel: '#A9B4BC', pearlSteelDeep: '#6E7C88', spruce: '#2F5D50', spruceDeep: '#1D3F36',
  snow: '#F2F5F7', snowShade: '#BCC9D3', frost: '#CFE4EE', frostEdge: '#9FC3D4', table: '#8C7A66', hall: '#7A848C', map: '#6F8596', board: '#6E5E4E',
  nickelBrass: '#8C7D5A', wall: '#5B6B78',
};
const C = {ink: INK, paper: PAL.birch};
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

type Tone = 'ink' | 'paper' | 'cran' | 'navy' | 'desk' | 'panel';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#10151F', fg: '#EDE6D2'},
  paper: {fill: PAL.birch, fg: C.ink},
  cran: {fill: PAL.cran, fg: PAL.birch},
  navy: {fill: PAL.navy, fg: PAL.birch},
  desk: {fill: PAL.desk, fg: PAL.birch},
  panel: {fill: PAL.panel, fg: PAL.birch},
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

// ---- shared set pieces ------------------------------------------------------------------------------------
/** The ice-fog lot: pearl sky, a low white sun disc behind the fog at x 260 y 520, a treeline, two drifting fog bands, snow and a near plane. */
const FogLot: React.FC<{f: number; fog?: number; sunBurn?: number; drift?: number; ground?: number}> = ({f, fog = 1, sunBurn = 0.2, drift = 1, ground = 1130}) => {
  const bandA = (i: number) => ((i * 520 + f * 0.55 * drift) % 1700) - 300;
  const bandB = (i: number) => ((i * 610 - f * 0.9 * drift) % 1800 + 1800) % 1800 - 300;
  return (
    <g>
      <defs>
        <linearGradient id="fl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAL.pearlHi} /><stop offset="0.55" stopColor="#E3E9EE" /><stop offset="0.8" stopColor={PAL.fog} /><stop offset="1" stopColor="#D4DCE3" />
        </linearGradient>
        <radialGradient id="fl-sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFFFFF" stopOpacity="1" /><stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.55 + 0.35 * sunBurn} /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
        <linearGradient id="fl-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9EEF2" /><stop offset="0.3" stopColor={PAL.snow} /><stop offset="1" stopColor={PAL.snowShade} /></linearGradient>
        <linearGradient id="fl-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={PAL.fogWhite} stopOpacity="0" /><stop offset="0.5" stopColor={PAL.fogWhite} stopOpacity="0.85" /><stop offset="1" stopColor={PAL.fogWhite} stopOpacity="0" /></linearGradient>
      </defs>
      <rect data-band="ok" x={-40} y={-40} width={1160} height={ground + 60} fill="url(#fl-sky)" />
      <circle cx={260} cy={520} r={380} fill="url(#fl-sun)" opacity={0.7 + 0.3 * sunBurn} />
      <circle cx={260} cy={520} r={64 + 20 * sunBurn} fill="#FFFFFF" opacity={0.7 + 0.3 * sunBurn} />
      {/* far treeline, desaturated spruce lost in the fog */}
      <g opacity={0.5 * (0.7 + 0.3 * fog)} data-band="ok">
        {Array.from({length: 22}, (_, i) => {
          const tx = -30 + i * 54 + (rnd(i) * 20 - 10);
          const th = 90 + rnd(i + 30) * 110;
          return <path key={i} d={`M ${tx - 30} ${ground - 40} L ${tx} ${ground - 40 - th} L ${tx + 30} ${ground - 40} Z`} fill={PAL.spruce} />;
        })}
      </g>
      <rect x={-40} y={ground - 260} width={1160} height={280} fill="url(#fl-fog)" opacity={0.75 * fog} />
      {[0, 1, 2].map((i) => <ellipse key={i} cx={bandA(i)} cy={ground - 120 + (i % 2) * 40} rx={420} ry={60} fill={PAL.fogWhite} opacity={0.5 * fog} />)}
      <rect data-band="ok" x={-40} y={ground - 30} width={1160} height={1100} fill="url(#fl-snow)" />
      <path d={`M -40 ${ground - 30} Q 260 ${ground - 46} 560 ${ground - 32} T 1120 ${ground - 34}`} fill="none" stroke={PAL.snowShade} strokeWidth={5} opacity={0.7} />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${-80 + i * 250} ${ground + 150 + (i % 3) * 120} q 130 -40 280 0 q -140 44 -280 0`} fill={PAL.snowShade} opacity={0.45} />)}
      {[0, 1, 2].map((i) => <ellipse key={i} cx={bandB(i)} cy={ground + 30 + (i % 2) * 70} rx={380} ry={46} fill={PAL.fogWhite} opacity={0.42 * fog} />)}
      {/* snow dust */}
      {Array.from({length: 26}, (_, i) => {
        const px = ((rnd(i + 7) * 1300 + f * (3 + rnd(i) * 5)) % 1300) - 110;
        const py = ground + 10 + rnd(i + 17) * 700;
        return <rect key={i} x={px} y={py} width={14 + rnd(i + 3) * 26} height={3} rx={1.5} fill="#fff" opacity={0.35 + 0.3 * rnd(i + 9)} />;
      })}
    </g>
  );
};

/** THE GATE RIG: the shelf Gate plus the episode's overlays (a fogged plate, frost, a bow) and its cranberry sill. */
type GateRigProps = {f: number; x: number; y: number; scale?: number; swing?: number; verdict?: 'asking' | 'pass' | 'block'; fogPlate?: number; frost?: number; bow?: number; sill?: boolean; phase?: number; lampLit?: number};
const GateRig: React.FC<GateRigProps> = ({f, x, y, scale = 1.7, swing = 0.18, verdict = 'asking', fogPlate = 1, frost = 0, bow = 0, sill = true, phase = 0.3, lampLit = 0}) => {
  const s = scale;
  const boardTop = y + 42 * s, boardBot = y + 120 * s;
  return (
    <g>
      {sill && (
        <g>
          <ContactShadow cx={x} cy={boardBot + 44 * s} rx={230 * s} ry={20 * s} opacity={0.38} />
          <rect x={x - 200 * s} y={boardBot + 6 * s} width={400 * s} height={26 * s} rx={6 * s} fill={PAL.cran} stroke={INK} strokeWidth={6} />
          <rect x={x - 200 * s} y={boardBot + 6 * s} width={400 * s} height={7 * s} rx={3 * s} fill={PAL.cranHi} opacity={0.5} />
          <rect x={x - 176 * s} y={boardBot + 32 * s} width={22 * s} height={44 * s} fill={PAL.cranDeep} stroke={INK} strokeWidth={5} />
          <rect x={x + 154 * s} y={boardBot + 32 * s} width={22 * s} height={44 * s} fill={PAL.cranDeep} stroke={INK} strokeWidth={5} />
        </g>
      )}
      <g transform={`rotate(${bow * 6} ${x} ${y + 120 * s})`}>
        <Gate f={f} x={x} y={y} scale={s} condition="" verdict={verdict} swing={swing} phase={phase} tint={PAL.cran} />
        {fogPlate > 0.01 && (
          <g opacity={0.9 * fogPlate}>
            <rect x={x - 164 * s} y={boardTop - 2} width={328 * s} height={(boardBot - boardTop) - 2} rx={10 * s} fill={PAL.fogWhite} opacity={0.82} />
            {[0, 1, 2].map((i) => <ellipse key={i} cx={x + Math.sin(f / 40 + i * 2) * 60 * s} cy={boardTop + (i + 0.6) * 22 * s} rx={150 * s} ry={14 * s} fill="#fff" opacity={0.65} />)}
          </g>
        )}
        {lampLit > 0.01 && <circle cx={x} cy={y - 166 * s} r={30 * s} fill={PAL.goldHi} opacity={0.5 * lampLit} />}
        {frost > 0.01 && <FrostLayer x={x} y={y} s={s} frost={frost} f={f} />}
      </g>
    </g>
  );
};

/** Frost spreading along the Gate: crystalline white patches on the plinth, head and board edge, with edge glints. */
const FrostLayer: React.FC<{x: number; y: number; s: number; frost: number; f: number}> = ({x, y, s, frost, f}) => {
  const spots = [
    {px: -58, py: -40, w: 116, h: 24}, {px: -52, py: -150, w: 40, h: 90}, {px: 18, py: -150, w: 34, h: 70}, {px: -168, py: 42, w: 336, h: 16}, {px: -168, py: 60, w: 70, h: 26}, {px: 98, py: 60, w: 70, h: 26},
  ];
  return (
    <g opacity={Math.min(1, frost * 1.2)}>
      {spots.map((r, i) => {
        const k = clamp01(frost * 1.5 - i * 0.12);
        if (k <= 0) return null;
        return (
          <g key={i}>
            <rect x={x + r.px * s} y={y + r.py * s} width={r.w * s * k} height={r.h * s} rx={6 * s} fill={PAL.frost} opacity={0.85} />
            <path d={`M ${x + r.px * s} ${y + r.py * s} l ${r.w * s * k * 0.5} ${r.h * s * 0.6} l ${r.w * s * k * 0.5} ${-r.h * s * 0.2}`} fill="none" stroke={PAL.frostEdge} strokeWidth={3} />
            <circle cx={x + (r.px + r.w * k * 0.7) * s} cy={y + (r.py + 4) * s} r={4 + 2 * Math.sin(f / 5 + i)} fill="#fff" />
          </g>
        );
      })}
    </g>
  );
};

/** The QuestionToken on its own contrast carrier: a teal-black mat and the shelf asset's INK keyline. */
const Token: React.FC<{x: number; y: number; scale?: number; text: string; rot?: number; mat?: number; frost?: number; dent?: number; glow?: number}> =
({x, y, scale = 1, text, rot = 0, mat = 0, frost = 0, dent = 0, glow = 0}) => (
  <g>
    {mat > 0 && <ellipse cx={x} cy={y + 8 * scale} rx={96 * scale} ry={86 * scale} fill={PAL.teal} opacity={0.6 * mat} />}
    <QuestionToken x={x} y={y} scale={scale} rot={rot} text={text} color={PAL.gold} faceColor={PAL.gold} inkColor={INK} rimColor={PAL.goldHi} glow={glow} />
    {frost > 0.01 && (
      <g opacity={Math.min(1, frost)}>
        <circle cx={x} cy={y} r={70 * scale} fill={PAL.frost} opacity={0.6} />
        <path d={`M ${x - 60 * scale} ${y - 20 * scale} l 30 20 l 20 -26 l 24 34 l 24 -20`} fill="none" stroke="#fff" strokeWidth={3 * scale} />
      </g>
    )}
    {dent > 0.01 && (
      <g transform={`translate(${x + 26 * scale},${y - 22 * scale})`} opacity={Math.min(1, dent * 1.5)}>
        <ellipse cx={0} cy={0} rx={26 * scale} ry={18 * scale} fill={PAL.goldDeep} stroke={INK} strokeWidth={3} opacity={0.85} />
        <path d={`M ${-18 * scale} ${-2 * scale} q ${16 * scale} ${-12 * scale} ${34 * scale} ${2 * scale}`} fill="none" stroke={PAL.goldHi} strokeWidth={2.5} />
      </g>
    )}
  </g>
);

/** The blank STANDARDS sheet: birch paper with an INK keyline, a heading placeholder and dotted lines. Never any ink. */
const StandardsSheet: React.FC<{x: number; y: number; scale?: number; rot?: number; f: number}> = ({x, y, scale = 1, rot = 0, f}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
    <ContactShadow cx={0} cy={4} rx={150} ry={12} opacity={0.35} />
    <rect x={-130} y={-170} width={260} height={178} rx={5} fill={PAL.birch} stroke={INK} strokeWidth={5} />
    <text x={0} y={-132} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill={PAL.pearlSteelDeep}>STANDARDS</text>
    {[0, 1, 2].map((i) => <line key={i} x1={-100} y1={-96 + i * 34} x2={100} y2={-96 + i * 34} stroke={INK} strokeWidth={3} strokeDasharray="4 8" opacity={0.7 + 0.1 * Math.sin(f / 9 + i)} />)}
  </g>
);

/** The sheet lying flat on the sill in perspective, so it never covers the plate above it. */
const FlatSheet: React.FC<{x: number; y: number; scale?: number; f: number}> = ({x, y, scale = 1, f}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={6} rx={160} ry={10} opacity={0.4} />
    <path d="M -130 6 L -100 -58 L 130 -58 L 150 6 Z" fill={PAL.birch} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <text x={4} y={-36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={3} fill={PAL.pearlSteelDeep}>STANDARDS</text>
    {[0, 1, 2].map((i) => <line key={i} x1={-96 + i * 6} y1={-22 + i * 9} x2={110 - i * 6} y2={-22 + i * 9} stroke={INK} strokeWidth={2.5} strokeDasharray="4 7" opacity={0.7 + 0.1 * Math.sin(f / 9 + i)} />)}
  </g>
);

/** A pen lying or hovering, from the shelf ReviewPen in the nickel-brass tint. */
const NickelPen: React.FC<{x: number; y: number; f: number; angle?: number; scale?: number}> = ({x, y, f, angle = -24, scale = 0.7}) => (
  <ReviewPen x={x} y={y} f={f} scale={scale} angle={angle} color={PAL.nickelBrass} cuffColor={PAL.pearlSteelDeep} />
);

/** A hard-edged ink stamp mark, navy ink only: the UNOFFICIAL and CASE AGAINST stamps. */
const InkStamp: React.FC<{x: number; y: number; text: string; k: number; rot?: number; size?: number}> = ({x, y, text, k, rot = -6, size = 40}) => {
  if (k <= 0.01) return null;
  const w = monoW(text, size, 4) + 60, h = size + 40;
  const land = spring(k * 14, 0, 14);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${1.5 - 0.5 * land})`} opacity={Math.min(1, k * 4)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={PAL.birch} opacity={0.85} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill="none" stroke={PAL.navy} strokeWidth={7} />
      <rect x={-w / 2 + 8} y={-h / 2 + 8} width={w - 16} height={h - 16} rx={3} fill="none" stroke={PAL.navy} strokeWidth={2.5} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={size} letterSpacing={4} fill={PAL.navy}>{text}</text>
    </g>
  );
};

// ---- small props shared across shots ----------------------------------------------------------------
const WALNUT = '#5E4A3E';
const typedN = (f: number, a: number, cps = 1.1) => Math.max(0, Math.floor((f - a) * cps));

const BallotBox: React.FC<{x: number; y: number; scale?: number; f: number}> = ({x, y, scale = 1, f}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={4} rx={130} ry={14} opacity={0.4} />
    <rect x={-84} y={-230} width={168} height={230} rx={10} fill={WALNUT} stroke={INK} strokeWidth={6} />
    <rect x={-84} y={-230} width={168} height={22} rx={8} fill="#7A6050" stroke={INK} strokeWidth={5} />
    <rect x={-52} y={-222} width={104} height={10} rx={4} fill={INK} />
    <rect x={-74} y={-170} width={148} height={64} rx={4} fill={PAL.birch} stroke={INK} strokeWidth={4} />
    <text x={0} y={-128} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} letterSpacing={2} fill={INK}>BALLOTS</text>
    <rect x={-84} y={-230} width={10} height={230} fill="#FFFFFF" opacity={0.16 + 0.05 * Math.sin(f / 17)} />
  </g>
);

/** The YES and NO signpost. `snap` 0..1 breaks the NO arm off at its joint, leaving a stump. */
const YesNoSign: React.FC<{x: number; y: number; scale?: number; f: number; spin?: number; snapped?: boolean; stumpOnly?: boolean}> = ({x, y, scale = 1, f, spin = 0, snapped = false, stumpOnly = false}) => {
  const sway = 1.2 * Math.sin(f / 23);
  const boardW = Math.abs(Math.cos(spin * 7)) * 0.9 + 0.1;
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${sway})`}>
      <ContactShadow cx={0} cy={4} rx={80} ry={10} opacity={0.4} />
      <rect x={-9} y={-380} width={18} height={380} fill={WALNUT} stroke={INK} strokeWidth={5} />
      <g transform={`scale(${stumpOnly ? 1 : boardW},1)`}>
        <path d="M -10 -330 L -190 -330 L -226 -300 L -190 -270 L -10 -270 Z" fill={PAL.birch} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <text x={-112} y={-290} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} letterSpacing={3} fill={INK}>YES</text>
        {!snapped ? (
          <g>
            <path d="M 10 -250 L 190 -250 L 226 -220 L 190 -190 L 10 -190 Z" fill={PAL.birch} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <text x={112} y={-210} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} letterSpacing={3} fill={INK}>NO</text>
          </g>
        ) : (
          <path d="M 10 -250 L 52 -250 L 40 -236 L 58 -222 L 44 -208 L 10 -190 Z" fill={PAL.birch} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        )}
      </g>
    </g>
  );
};

/** The snapped NO arm, carried through the film: it knocks the token in S1 and is the dial's pointer in S14. */
const SnappedArrow: React.FC<{x: number; y: number; rot?: number; scale?: number}> = ({x, y, rot = 0, scale = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
    <path d="M -90 -30 L 90 -30 L 126 0 L 90 30 L -90 30 L -78 14 L -94 0 L -78 -14 Z" fill={PAL.birch} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <text x={4} y={11} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={3} fill={INK}>NO</text>
  </g>
);

// ---- S1: the Gate is the seam (beats 1, 2) -------------------------------------------------------------------
const GX = 540, GY = 1000, GS = 1.7;
const SILL_Y = GY + 120 * GS + 10;   // the sill's top edge
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t2 = b(2);
  const spinK = clamp01((f - t2) / 14);
  const flight = ease(f, t2 + 10, 20);
  const snapped = f >= t2 + 10;
  const arrowX = lerp(950 + 100, 620, flight), arrowY = lerp(1250 - 200, SILL_Y - 70, flight) - 150 * Math.sin(Math.PI * flight);
  const hit = clamp01((f - (t2 + 28)) / 30);
  const tokX = 540 + 90 * easeIO(f, t2 + 28, 34), tokRot = 360 * 2 * easeIO(f, t2 + 28, 40);
  const idle = f < t2 + 28 ? (g / 11) * 57 : tokRot;
  return (
    <Frame p={p} z0={1.0} z1={1.18} oy={1000}
      overlay={<Plate text="DID FAIRBANKS VOTE ON DATA CENTERS?" displayLines={['DID FAIRBANKS VOTE', 'ON DATA CENTERS?']} y={600} size={40} tone="paper" p={ease(f, 4, 8)} />}>
      <SVG>
        <FogLot f={g} fog={1} sunBurn={0.2} />
        <BallotBox x={170} y={1250} scale={1.1} f={g} />
        <YesNoSign x={950} y={1250} scale={0.95} f={g} spin={spinK * (f >= t2 ? 1 : 0)} snapped={snapped} />
        <GateRig f={g} x={GX} y={GY} scale={GS} fogPlate={1} />
        <Token x={tokX} y={SILL_Y - 56} scale={0.75} text="" rot={idle} mat={0.0} />
        {snapped && flight < 0.99 && <SnappedArrow x={arrowX} y={arrowY} rot={lerp(0, 540, flight)} scale={0.9} />}
        {flight >= 0.99 && <SnappedArrow x={380} y={1286} rot={-8 + 6 * hit} scale={0.8} />}
      </SVG>
    </Frame>
  );
};

// ---- S2: one in five chairs (beats 3, 4) ----------------------------------------------------------------------
const GYM_COLS = 12, GYM_ROWS = 8;
const GymChairs: React.FC<{f: number; t3: number; t4: number}> = ({f, t3, t4}) => {
  const order = Array.from({length: GYM_COLS * GYM_ROWS}, (_, k) => ({k, r: rnd(k * 13 + 5)})).sort((a, c) => a.r - c.r);
  const litRank: Record<number, number> = {};
  order.slice(0, 20).forEach((o, i) => { litRank[o.k] = i; });
  return (
    <g>
      {Array.from({length: GYM_COLS * GYM_ROWS}, (_, k) => {
        const i = k % GYM_COLS, j = Math.floor(k / GYM_COLS);
        const cx = 540 + (i - (GYM_COLS - 1) / 2) * 80, cy = 640 + j * 68;
        const d = Math.hypot((i - 5.5) * 80, (j - 3.5) * 68);
        const pop = spring(f, t3 + 4 + d / 9, 14);
        if (pop <= 0.01) return null;
        const lit = litRank[k] !== undefined ? ease(f, t4 + litRank[k] * 2, 8) : 0;
        return (
          <g key={k} transform={`translate(${cx},${cy}) scale(${pop})`}>
            <rect x={-20} y={-18} width={40} height={36} rx={7} fill={lit > 0.5 ? PAL.goldHi : '#5C6872'} stroke={INK} strokeWidth={2.4} />
            <rect x={-20} y={-18} width={40} height={10} rx={5} fill="#fff" opacity={0.18 + 0.5 * lit} />
            {lit > 0.4 && <circle cx={0} cy={0} r={30} fill={PAL.goldHi} opacity={0.18 * lit} />}
          </g>
        );
      })}
    </g>
  );
};
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t3 = b(3), t4 = b(4);
  const hole = easeIO(f, 0, 22);
  const click = clamp01((f - t4) / 24);
  return (
    <Frame p={p} z0={1.04} z1={1.0}
      overlay={<>
        <Plate text="OCT 6TH" x={220} y={580} size={28} tone="paper" p={ease(f, t3 + 4, 8)} />
        <Plate text="TURNOUT 20.95% · 16,177 OF 77,227 · UNOFFICIAL" displayLines={['TURNOUT 20.95%', '16,177 OF 77,227', 'UNOFFICIAL']} y={1227} size={28} tone="paper" p={ease(f, t4 + 12, 10)} />
      </>}>
      <SVG>
        <defs>
          <mask id="s2-slot"><rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#fff" />
            <rect x={540 - (120 + 1300 * hole)} y={900 - (14 + 1000 * hole)} width={(120 + 1300 * hole) * 2} height={(14 + 1000 * hole) * 2} rx={14 + 40 * hole} fill="#000" />
          </mask>
        </defs>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#76828A" />
        {Array.from({length: 18}, (_, i) => <line key={i} x1={-40} y1={560 + i * 40} x2={1120} y2={560 + i * 40} stroke={INK} strokeWidth={2} opacity={0.12} />)}
        {Array.from({length: 12}, (_, i) => <rect key={i} x={70 + (i % 4) * 250} y={540 + Math.floor(i / 4) * 330} width={170} height={74} rx={10} fill={PAL.fogWhite} opacity={0.2 + 0.05 * Math.sin(g / 6 + i * 1.7)} />)}
        <GymChairs f={f} t3={t3} t4={t4} />
        <TallyCounter x={900} y={1180} s={0.8} f={g} variant="clicker" count="20.95" spin={click} />
        <Token x={150} y={1180} scale={0.7} text={f > t4 + 14 ? '1 IN 5' : ''} mat={1} />
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={PAL.teal} mask="url(#s2-slot)" />
      </SVG>
    </Frame>
  );
};

// ---- S3: the 217 sliver (beats 5, 6, 7) -----------------------------------------------------------------------------
const CountTableBG: React.FC<{f: number}> = ({f}) => (
  <g>
    <defs>
      <radialGradient id="ct-lamp" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stopColor="#FFE2AE" stopOpacity="0.5" /><stop offset="1" stopColor="#FFE2AE" stopOpacity="0" /></radialGradient>
      <linearGradient id="ct-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6C7C89" /><stop offset="1" stopColor="#52626F" /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={1100} fill="url(#ct-wall)" />
    <rect data-band="ok" x={-40} y={1010} width={1160} height={1000} fill={PAL.table} />
    <rect x={-40} y={1010} width={1160} height={10} fill="#6E5E4B" />
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M -40 ${1060 + i * 110} Q 540 ${1040 + i * 110 + 10 * Math.sin(i)} 1120 ${1060 + i * 110}`} stroke={INK} strokeWidth={3} opacity={0.12} fill="none" />)}
    <ellipse cx={540} cy={900} rx={620} ry={560} fill="url(#ct-lamp)" opacity={0.85 + 0.06 * Math.sin(f / 21)} />
    {Array.from({length: 18}, (_, i) => {
      const px = ((rnd(i + 3) * 1200 + f * (0.6 + rnd(i))) % 1200) - 60, py = 560 + rnd(i + 9) * 600;
      return <circle key={i} cx={px} cy={py} r={2 + rnd(i + 1) * 2} fill="#FFF4D0" opacity={0.25 + 0.2 * rnd(i + 5)} />;
    })}
  </g>
);
const Stack: React.FC<{x: number; baseY: number; w: number; h: number; tone: string}> = ({x, baseY, w, h, tone}) => {
  const layers = Math.max(2, Math.floor(h / 14));
  return (
    <g>
      <ContactShadow cx={x} cy={baseY + 6} rx={w * 0.62} ry={14} opacity={0.4} />
      <rect x={x - w / 2} y={baseY - h} width={w} height={h} fill={tone} stroke={INK} strokeWidth={5} />
      {Array.from({length: layers}, (_, i) => <line key={i} x1={x - w / 2 + 3} y1={baseY - h + 8 + i * (h - 10) / layers} x2={x + w / 2 - 3} y2={baseY - h + 8 + i * (h - 10) / layers} stroke={INK} strokeWidth={1.6} opacity={0.35} />)}
      <rect x={x - w / 2} y={baseY - h} width={w} height={9} fill="#FFFFFF" opacity={0.5} />
      <rect x={x + w / 2 - 14} y={baseY - h} width={14} height={h} fill={INK} opacity={0.12} />
    </g>
  );
};
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t5 = b(5), t6 = b(6), t7 = b(7);
  const rise = ease(f, t5, 30);
  const HH = 460, RH = HH * 7542 / 7759;   // true to scale: 217 of 7,759 is 2.8 percent
  const baseY = 1180;
  const sliver = ease(f, t6, 16);
  const topH = baseY - HH * rise, topR = baseY - RH * rise;
  return (
    <Frame p={p} z0={1.0} z1={1.05}
      overlay={<>
        <Plate text="HOWELL 7,759" x={320} y={600} size={28} tone="paper" p={ease(f, t5 + 18, 10)} />
        <Plate text="RAMIREZ 7,542" x={760} y={600} size={28} tone="paper" p={ease(f, t5 + 22, 10)} />
        <Plate text="217 VOTES" x={540} y={880} size={26} tone="paper" p={ease(f, t6 + 6, 8)} />
        <Plate text="UNOFFICIAL" x={540} y={1270} size={26} tone="navy" p={ease(f, t7 + 14, 8)} />
      </>}>
      <SVG>
        <CountTableBG f={g} />
        <g transform={`translate(0,${f > t7 && f < t7 + 14 ? 9 * Math.sin((f - t7) * 1.3) * (1 - (f - t7) / 14) : 0})`}>
        <Stack x={320} baseY={baseY} w={190} h={HH * rise} tone={PAL.birch} />
        <Stack x={760} baseY={baseY} w={190} h={RH * rise} tone="#E8E3D2" />
        </g>
        {sliver > 0.02 && (
          <g opacity={sliver}>
            <rect x={415} y={Math.min(topH, topR) - 3} width={345} height={Math.abs(topH - topR) + 6} fill={PAL.goldHi} opacity={0.9} />
            <path d={`M 540 ${topH} L 540 ${topR}`} stroke={INK} strokeWidth={5} />
            <path d={`M 520 ${topH} L 560 ${topH} M 520 ${topR} L 560 ${topR}`} stroke={INK} strokeWidth={5} />
            <path d={`M 420 ${topH} L 520 ${topH}`} stroke={INK} strokeWidth={2.5} strokeDasharray="6 7" />
            <path d={`M 660 ${topR} L 560 ${topR}`} stroke={INK} strokeWidth={2.5} strokeDasharray="6 7" />
          </g>
        )}
        <InkStamp x={540} y={1060} text="UNOFFICIAL" k={ease(f, t7, 8)} size={46} />
        <Token x={940} y={1240} scale={0.6} text="1 IN 5" mat={1} />
      </SVG>
    </Frame>
  );
};

// ---- S4: more studies (beats 8, 9, 10) ------------------------------------------------------------------------------
const NameCard: React.FC<{x: number; y: number; w: number; h: number; name: string; sub?: string; k: number; children?: React.ReactNode}> = ({x, y, w, h, name, sub, k, children}) => {
  if (k <= 0.01) return null;
  const sc = 0.85 + 0.15 * spring(k * 20, 0, 20);
  return (
    <g transform={`translate(${x + (1 - ease(k * 30, 0, 24)) * -900},${y + 5 * Math.sin(useCurrentFrame() / 13)}) rotate(${0.9 * Math.sin(useCurrentFrame() / 29)}) scale(${sc})`}>
      <rect x={-w / 2 + 10} y={-h / 2 + 14} width={w} height={h} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={PAL.birch} stroke={INK} strokeWidth={6} />
      <rect x={-w / 2} y={-h / 2} width={w} height={64} fill={INK} />
      <text x={-w / 2 + 28} y={-h / 2 + 43} fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={2.5} fill={PAL.birch}>{name}</text>
      {sub && <text x={w / 2 - 28} y={-h / 2 + 43} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={2} fill={PAL.pearlSteel}>{sub}</text>}
      {children}
    </g>
  );
};
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t8 = b(8), t9 = b(9), t10 = b(10);
  const wob = Math.sin(g / 26) * 4;
  const lift = 14 * Math.sin(g / 15) * 0.5;
  return (
    <Frame p={p} z0={1.0} z1={1.08} oy={900}
      overlay={<>
        <Plate text="NO POSITION" y={580} size={32} tone="paper" p={ease(f, t9 + 6, 8) * (f < t10 + 4 ? 1 : 0)} />
        <Plate text="MORE STUDIES" y={980} size={32} tone="paper" p={ease(f, t10 + 6, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#5B6B78" />
        <ellipse cx={540} cy={900} rx={560} ry={520} fill="#FFE2AE" opacity={0.1 + 0.03 * Math.sin(g / 25)} />
        <rect x={120} y={500} width={840} height={820} fill={PAL.board} stroke={INK} strokeWidth={8} />
        {Array.from({length: 40}, (_, i) => <circle key={i} cx={140 + rnd(i) * 800} cy={520 + rnd(i + 40) * 780} r={2.2} fill={INK} opacity={0.25} />)}
        <NameCard x={540} y={790} w={680} h={300} name="MIGUEL RAMIREZ" sub="RUNNER UP" k={ease(f, t8, 24)} />
        <g transform={`translate(${(1 - ease(ease(f, t8, 24) * 30, 0, 24)) * -900},0)`}>
          <rect x={224} y={768} width={212} height={64} fill="none" stroke={INK} strokeWidth={3} />
          <text x={330} y={810} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={3} fill={INK}>POSITION</text>
          <rect x={440} y={768} width={380} height={64} fill="none" stroke={INK} strokeWidth={4} strokeDasharray={f > t9 ? '10 9' : '0'} opacity={f > t9 ? 0.9 : 0} />
          {f > t9 + 6 && <rect x={440} y={768} width={380 * ease(f, t9 + 6, 10)} height={64} fill={PAL.pearl} opacity={0.35} />}
          <rect x={224} y={866} width={440} height={40} fill={PAL.birch} stroke={PAL.pearlSteel} strokeWidth={2} />
          <text x={444} y={894} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={22} letterSpacing={2} fill={PAL.pearlSteelDeep}>FAIRBANKS BOROUGH ASSEMBLY</text>
        </g>
        <Token x={880} y={1130} scale={0.8} text="1 IN 5" mat={1} />
        {/* the balance scale: level pans and a weight hovering unplaced */}
        <g transform="translate(540,1260)">
          <ContactShadow cx={0} cy={30} rx={200} ry={14} opacity={0.4} />
          <rect x={-14} y={-130} width={28} height={160} fill={PAL.pearlSteel} stroke={INK} strokeWidth={5} />
          <g transform={`rotate(${wob * 0.35} 0 -130)`}>
            <rect x={-250} y={-142} width={500} height={22} rx={8} fill={PAL.pearlSteel} stroke={INK} strokeWidth={5} />
            {[-1, 1].map((sd) => (
              <g key={sd} transform={`translate(${sd * 220},-120)`}>
                <path d="M 0 0 L -64 70 M 0 0 L 64 70" stroke={INK} strokeWidth={4} />
                <rect x={-80} y={70} width={160} height={22} rx={8} fill={PAL.birch} stroke={INK} strokeWidth={5} />
                <text x={0} y={87} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} letterSpacing={3} fill={INK}>{sd < 0 ? 'YAY' : 'NAY'}</text>
              </g>
            ))}
          </g>
        </g>
        {f > t10 && <g transform={`translate(540,${1080 + lift - 24 * (1 - ease(f, t10, 14))}) rotate(${Math.sin(g / 12) * 4})`} opacity={ease(f, t10, 10)}>
          <path d="M -70 -26 L 70 -26 L 90 20 L -90 20 Z" fill={PAL.nickelBrass} stroke={INK} strokeWidth={5} />
          <text x={0} y={5} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} letterSpacing={2} fill={PAL.goldHi}>STUDIES</text>
        </g>}
      </SVG>
    </Frame>
  );
};

// ---- S5: from the question to Juneau (beats 11 to 15) -------------------------------------------------------------------
const OutlineIcon: React.FC<{x: number; y: number; kind: 'box' | 'gavel' | 'door'; k: number; f: number}> = ({x, y, kind, k, f}) => (
  <g transform={`translate(${x},${y}) scale(${0.6 + 0.4 * spring(k * 18, 0, 18)})`} opacity={clamp01(k * 3)}>
    <rect x={-80} y={-80} width={160} height={160} rx={14} fill={PAL.birch} stroke={INK} strokeWidth={5} opacity={0.92} />
    {kind === 'box' && <g><rect x={-34} y={-34} width={68} height={72} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="8 7" /><rect x={-22} y={-40} width={44} height={8} fill={INK} /></g>}
    {kind === 'gavel' && <g transform="rotate(-30)"><rect x={-30} y={-40} width={60} height={30} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="8 7" /><rect x={-5} y={-10} width={10} height={60} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="8 7" /></g>}
    {kind === 'door' && <g><rect x={-30} y={-46} width={60} height={92} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="8 7" /><circle cx={16} cy={0} r={4} fill={INK} /></g>}
    <text x={0} y={70 + 2 * Math.sin(f / 5)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} fill={INK}>?</text>
  </g>
);
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t11 = b(11), t12 = b(12), t13 = b(13), t14 = b(14), t15 = b(15);
  const PIN = {x: 735, y: 1040};
  const flip = easeIO(f, t12 + 6, 20);
  const monthShown = flip < 0.5 ? 'OCT 6TH' : 'AUG 27TH';
  const calK = f < t12 ? 0 : 1 - ease(f, t13 - 4, 10);
  const planeK = clamp01((f - t13) / 44);
  const planeX = lerp(540, PIN.x, easeIO(f, t13, 44)), planeY = lerp(820, PIN.y - 30, easeIO(f, t13, 44)) - 160 * Math.sin(Math.PI * planeK);
  const open = ease(f, t14, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={900}
      overlay={<>
        <Plate text="WHO ANSWERED THAT?" y={580} size={32} tone="paper" p={ease(f, t11 + 4, 8) * (f < t12 ? 1 : 0)} />
        <Plate text="REQUEST TO THE LEGISLATURE" y={660} size={30} tone="paper" p={ease(f, t13 + 4, 8) * (f < t14 ? 1 : 0)} />
        <Plate text="PAUSE · PER KUAC" y={1250} size={32} tone="paper" p={ease(f, t14 + 6, 8) * (f < t15 ? 1 : 0)} />
        <Plate text="UNTIL" y={1170} size={32} tone="paper" p={ease(f, t15 + 6, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={PAL.map} />
        {Array.from({length: 14}, (_, i) => <path key={i} d={`M -20 ${60 + i * 140} Q 540 ${40 + i * 140 + 14 * Math.sin(g / 60 + i)} 1100 ${60 + i * 140}`} stroke={PAL.fogWhite} strokeWidth={2} opacity={0.12} fill="none" />)}
        <ellipse cx={420} cy={900} rx={700} ry={400} fill="#000" opacity={0.08 + 0.04 * Math.sin(g / 70)} />
        <g style={{filter: 'saturate(0.18) brightness(1.18) contrast(0.95)'}}><AlaskaMini frame={g} x={15} y={640} scale={2.0} pin={false} /></g>
        <OutlineIcon x={200} y={820} kind="box" k={ease(f, t11 + 6, 14)} f={g} />
        <OutlineIcon x={540} y={760} kind="gavel" k={ease(f, t11 + 12, 14) * (f < t12 + 4 ? 1 : 0)} f={g} />
        <OutlineIcon x={880} y={820} kind="door" k={ease(f, t11 + 18, 14) * (f < t12 + 4 ? 1 : 0)} f={g} />
        {/* the Juneau pin and slot */}
        <g transform={`translate(${PIN.x},${PIN.y})`}>
          <circle r={22 + 6 * Math.sin(g / 9)} fill="none" stroke={PAL.fogWhite} strokeWidth={4} opacity={0.7} />
          <circle r={10} fill={INK} stroke={PAL.fogWhite} strokeWidth={3} />
          <rect x={-64} y={14} width={128} height={14} rx={4} fill={INK} stroke={PAL.fogWhite} strokeWidth={3} />
          <text x={0} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill={PAL.fogWhite}>JUNEAU</text>
        </g>
        {/* the calendar leaf, OCT 6TH flipping backward to AUG 27TH */}
        {calK > 0.02 && (
          <g transform={`translate(540,${850}) scale(${0.7 + 0.3 * calK})`} opacity={calK}>
            <rect x={-190} y={-190} width={380} height={380} rx={12} fill={PAL.birch} stroke={INK} strokeWidth={7} />
            <rect x={-190} y={-190} width={380} height={72} rx={12} fill={PAL.navy} stroke={INK} strokeWidth={7} />
            <g transform={`scale(1,${Math.max(0.05, Math.abs(Math.cos(flip * Math.PI)))})`}>
              <text x={0} y={30} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={monthShown.length > 7 ? 74 : 86} fill={INK}>{monthShown}</text>
            </g>
            <text x={0} y={140} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={3} fill={PAL.pearlSteelDeep}>{flip < 0.5 ? 'ELECTION' : '2027 PRIORITIES'}</text>
          </g>
        )}
        {/* the paper request folds into a plane and glides to the slot */}
        {f > t13 && planeK < 0.99 && (
          <g transform={`translate(${planeX},${planeY}) rotate(${lerp(-18, 24, planeK)})`}>
            <ContactShadow cx={0} cy={150 + 160 * Math.sin(Math.PI * planeK)} rx={60} ry={9} opacity={0.35} />
            <path d="M -70 20 L 80 -30 L 20 40 L -10 22 L -34 52 Z" fill={PAL.birch} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d="M -10 22 L 80 -30" stroke={INK} strokeWidth={3} />
          </g>
        )}
        {/* the request opens beside the slot: PAUSE in large type, its UNTIL clause fogged white */}
        {open > 0.02 && (
          <g transform={`translate(${560},${900}) scale(${0.6 + 0.4 * open})`} opacity={open}>
            <path d={`M 150 150 L ${PIN.x - 560} ${PIN.y - 900}`} stroke={INK} strokeWidth={3} strokeDasharray="6 8" />
            <rect x={-250} y={-170} width={500} height={330} fill={PAL.birch} stroke={INK} strokeWidth={7} />
            <text x={0} y={-52} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={120} fill={INK}>PAUSE</text>
            <text x={0} y={-4} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={1.5} fill={INK}>NEW COMMERCIAL DATA CENTERS</text>
            <text x={0} y={28} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={1.5} fill={INK}>ON MUNICIPAL OR STATE-OWNED LANDS</text>
            <rect x={-220} y={52} width={440} height={76} fill={PAL.fogWhite} />
            <text x={0} y={102} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} letterSpacing={3} fill="#E9EEF2">UNTIL ? ? ?</text>
            {[0, 1, 2].map((i) => <ellipse key={i} cx={Math.sin(g / 30 + i * 2) * 60} cy={72 + i * 18} rx={190} ry={16} fill="#fff" opacity={0.6} />)}
          </g>
        )}
        <Token x={f > t15 ? 735 : 540} y={f > t15 ? 1160 : 1250} scale={0.7 + (f > t15 && f < t15 + 16 ? 0.35 * Math.sin(((f - t15) / 16) * Math.PI) : 0)} text={f > t15 + 6 ? 'UNTIL' : ''} mat={1} rot={f < t12 ? g * 4 : 0} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the door that never opened (beats 16, 17, 18) -----------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t16 = b(16), t17 = b(17), t18 = b(18);
  const VP = {x: 540, y: 880};
  const travel = easeIO(f, t16, 70);
  const sheetScale = lerp(1, 0.42, travel), sheetY = lerp(1190, 960, travel), sheetX = lerp(540, 628, travel);
  const lampsOn = Math.floor(clamp01((f - t17) / 34) * 14);
  const rattle = f > t18 && f < t18 + 24 ? 7 * Math.sin((f - t18) * 1.6) * (1 - (f - t18) / 24) : 0;
  const door = (x: number, w: number, h: number, lit: boolean, jx = 0) => (
    <g transform={`translate(${x + jx},${VP.y + 60})`}>
      <rect x={-w / 2 - 8} y={-h - 8} width={w + 16} height={h + 8} fill="#3C4B55" stroke={INK} strokeWidth={5} />
      <rect x={-w / 2} y={-h} width={w} height={h} fill={lit ? '#8A6A56' : WALNUT} stroke={INK} strokeWidth={5} />
      <rect x={-w / 2 + 10} y={-h + 14} width={w - 20} height={h * 0.38} fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />
      <circle cx={w / 2 - 14} cy={-h * 0.45} r={5} fill={PAL.pearlSteel} stroke={INK} strokeWidth={2} />
    </g>
  );
  return (
    <Frame p={p} zk={() => lerp(1.0, 1.1, easeIO(f, 0, p.dur))} ox={VP.x} oy={VP.y}
      overlay={<>
        <Plate text="DATA CENTER BILL · POWER USE · DECOMMISSIONING" displayLines={['DATA CENTER BILL', 'POWER USE ·', 'DECOMMISSIONING']} y={640} size={28} tone="paper" p={ease(f, t16 + 4, 10) * (f < t17 - 2 ? 1 : 0)} />
        <Plate text="SENATE 14-5" y={800} size={36} tone="paper" p={ease(f, t17 + 4, 8) * (f < t18 - 2 ? 1 : 0)} />
        <Plate text="HOUSE NEVER TOOK IT UP" y={920} size={32} tone="paper" p={ease(f, t18 + 6, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={PAL.fog} />
        {/* walls in perspective */}
        <path d={`M -40 -40 L ${VP.x - 150} ${VP.y - 90} L ${VP.x - 150} ${VP.y + 80} L -40 1500 Z`} fill="#B9C4CE" stroke={INK} strokeWidth={4} />
        <path d={`M 1120 -40 L ${VP.x + 150} ${VP.y - 90} L ${VP.x + 150} ${VP.y + 80} L 1120 1500 Z`} fill="#AEBAC5" stroke={INK} strokeWidth={4} />
        <path d={`M -40 -40 L 1120 -40 L ${VP.x + 150} ${VP.y - 90} L ${VP.x - 150} ${VP.y - 90} Z`} fill="#D3DAE1" stroke={INK} strokeWidth={4} />
        <path d={`M -40 1500 L ${VP.x - 150} ${VP.y + 80} L ${VP.x + 150} ${VP.y + 80} L 1120 1500 L 1120 2000 L -40 2000 Z`} fill={PAL.hall} stroke={INK} strokeWidth={4} />
        {[0, 1, 2, 3, 4].map((i) => {
          const k = (i + ((g * 0.012) % 1)) / 5, y = lerp(VP.y - 100, 20, k * k), w = lerp(120, 560, k * k);
          return <rect key={i} x={VP.x - w / 2} y={y} width={w} height={lerp(8, 30, k * k)} rx={4} fill={PAL.fogWhite} opacity={0.5 + 0.2 * Math.sin(g / 7 + i)} />;
        })}
        {Array.from({length: 6}, (_, i) => { const k = i / 6, y = lerp(VP.y + 100, 1900, k * k); return <line key={i} x1={VP.x - lerp(150, 700, k * k)} y1={y} x2={VP.x + lerp(150, 700, k * k)} y2={y} stroke={INK} strokeWidth={2} opacity={0.2} />; })}
        {door(VP.x - 92, 150, 250, lampsOn > 0)}
        {door(VP.x + 92, 150, 250, false, rattle)}
        {/* the tally board by the first door: 14 lit lamps, 5 dark */}
        <g transform={`translate(${VP.x - 380},${VP.y - 10}) scale(1.35)`}>
          <rect x={-90} y={-70} width={180} height={150} rx={8} fill={PAL.teal} stroke={INK} strokeWidth={5} />
          {Array.from({length: 19}, (_, i) => {
            const r = Math.floor(i / 7), c = i % 7;
            const lit = i < 14 ? i < lampsOn : false;
            return <circle key={i} cx={-60 + c * 20} cy={-40 + r * 40} r={7} fill={lit ? PAL.goldHi : '#2D4047'} stroke={INK} strokeWidth={2} />;
          })}
        </g>
        {/* the bill sheet slides toward the doors with the token on its corner */}
        <g transform={`translate(${sheetX},${sheetY}) scale(${sheetScale})`}>
          <ContactShadow cx={0} cy={30} rx={190} ry={16} opacity={0.35} />
          <rect x={-190} y={-250} width={380} height={290} fill={PAL.birch} stroke={INK} strokeWidth={6} />
          <text x={0} y={-196} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={3} fill={INK}>DATA CENTER BILL</text>
          {[0, 1, 2, 3].map((i) => <line key={i} x1={-150} y1={-150 + i * 34} x2={150 - 30 * (i % 2)} y2={-150 + i * 34} stroke={INK} strokeWidth={3} opacity={0.4} />)}
          <Token x={150} y={-30} scale={0.5} text="UNTIL" mat={1} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S7: a guide lands on the desk (beats 19, 20, 21) ------------------------------------------------------------------------
const Hand: React.FC<{x: number; y: number; dir: 1 | -1; label: string; k: number}> = ({x, y, dir, label, k}) => (
  <g transform={`translate(${x},${y}) scale(${dir},1)`}>
    <rect x={-210} y={-34} width={150} height={68} rx={20} fill={PAL.pearlSteel} stroke={INK} strokeWidth={5} />
    <text x={-135} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} letterSpacing={2} fill={INK} transform={`scale(${dir},1)`}>{label}</text>
    <path d="M -60 -30 Q 10 -52 60 -34 Q 86 -20 78 4 Q 70 30 38 34 Q -10 42 -60 30 Z" fill={PAL.birch} stroke={INK} strokeWidth={5} />
    {[-18, -2, 14].map((o, i) => <path key={i} d={`M 52 ${o} L ${80 + 6 * k} ${o + 3}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />)}
  </g>
);
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t19 = b(19), t20 = b(20), t21 = b(21);
  const drop = spring(f, t19, 22);
  const dy = (1 - drop) * -900;
  const crack = ease(f, t20, 14);
  const reach = easeIO(f, t21, 20);
  const part = easeIO(f, t21 + 22, 18);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1000}
      overlay={<>
        <Plate text="A GUIDE FROM UAF" y={580} size={34} tone="paper" p={ease(f, t19 + 14, 8) * (f < t20 ? 1 : 0)} />
        <Plate text="ASKS THE QUESTIONS UNDERNEATH" displayLines={['ASKS THE QUESTIONS', 'UNDERNEATH']} y={700} size={32} tone="paper" p={ease(f, t20 + 4, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={PAL.desk} />
        {Array.from({length: 10}, (_, i) => <line key={i} x1={-40} y1={400 + i * 150} x2={1120} y2={400 + i * 150} stroke={INK} strokeWidth={3} opacity={0.15} />)}
        <ellipse cx={500} cy={960} rx={560} ry={520} fill="#FFE2AE" opacity={0.16 + 0.03 * Math.sin(g / 19)} />
        <g transform={`translate(540,${1010 + dy})`}>
          <ContactShadow cx={14} cy={290} rx={250} ry={24} opacity={0.45 * drop} />
          <rect x={-215} y={-270} width={430} height={560} fill={PAL.birch} stroke={INK} strokeWidth={7} />
          {crack > 0.02 && <path d={`M -215 -270 L ${-215 + 430 * crack * 0.9} -270 L ${-215 + 430 * crack * 0.9} -240 L -215 -240 Z`} fill="#D8D2BE" stroke={INK} strokeWidth={4} />}
          <rect x={-215} y={-270} width={430} height={80} fill={INK} />
          <text x={-190} y={-218} fontFamily={MONO} fontWeight={800} fontSize={34} letterSpacing={4} fill={PAL.birch}>GUIDE</text>
          <text x={0} y={-110} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={4} fill={PAL.pearlSteelDeep}>UAF</text>
          <g transform={`translate(0,${-90 + 40 * crack})`}><Token x={0} y={110} scale={1.1} text="UNTIL" mat={1} rot={-8 * crack} /></g>
        </g>
        <Hand x={lerp(-260, 150, reach) - 80 * part} y={1030} dir={1} label="YES" k={reach} />
        <Hand x={lerp(1340, 930, reach) + 80 * part} y={1030} dir={-1} label="NO" k={reach} />
      </SVG>
    </Frame>
  );
};

// ---- S8: the frost and the waiting machine (beats 22 to 24, 59, 67, 25, 28) ---------------------------------------------------------------
const WallClock: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-8} y={0} width={16} height={380} fill={WALNUT} stroke={INK} strokeWidth={4} />
    <circle r={62} fill={PAL.birch} stroke={INK} strokeWidth={6} />
    {Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={-50} x2={0} y2={-42} stroke={INK} strokeWidth={3} transform={`rotate(${i * 30})`} />)}
    <line x1={0} y1={0} x2={0} y2={-34} stroke={INK} strokeWidth={5} transform={`rotate(${f * 0.2})`} strokeLinecap="round" />
    <line x1={0} y1={0} x2={0} y2={-48} stroke={INK} strokeWidth={3} transform={`rotate(${f * 6 % 360})`} strokeLinecap="round" />
  </g>
);
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t22 = b(22), t23 = b(23), t24 = b(24), t59 = b(59), t67 = b(67), t25 = b(25), t26 = b(26), t28 = b(28);
  const frost = ease(f, t22, 30);
  const fogPlate = 1;
  const web = ease(f, t26, 30);
  const bow = f > t25 && f < t25 + 40 ? Math.sin(((f - t25) / 40) * Math.PI) : 0;
  const cardK = ease(f, t25, 10) * (f < t26 + 40 ? 1 : 0.9);
  const glance = ease(f, t28, 10) * (1 - ease(f, t28 + 30, 12));
  const punch = ease(f, t28 + 14, 8);
  const tokFrost = ease(f, t59, 26);
  const GXs = 400, GYs = 1010, Ss = 1.5;
  const bBot = GYs + 120 * Ss;
  const stampK = ease(f, t23, 8);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1000}
      overlay={<>
        <Plate text="A NO WITH GOOD MANNERS" y={560} size={32} tone="paper" p={ease(f, t25 + 6, 8) * (f < t26 + 20 ? 1 : 0)} />
        <Plate text="IF NOBODY DRAFTS THEM" y={650} size={32} tone="paper" p={ease(f, t26 + 6, 8) * (f < t28 - 4 ? 1 : 0)} />
      </>}>
      <SVG>
        <FogLot f={g} fog={1.25 + 0.2 * ease(f, t24, 30)} sunBurn={0.1} />
        <rect x={0} y={880} width={1080} height={300} fill={PAL.fog} opacity={0.0} />
        {/* the STANDARDS drawer behind the Gate, with a cobweb */}
        <g transform="translate(170,1010)">
          <ContactShadow cx={0} cy={200} rx={130} ry={12} opacity={0.35} />
          <rect x={-100} y={-170} width={200} height={370} fill="#8A97A2" stroke={INK} strokeWidth={6} />
          <rect x={-86} y={-150} width={172} height={150} fill="#A9B4BC" stroke={INK} strokeWidth={5} />
          <rect x={-40} y={-82} width={80} height={14} rx={5} fill={INK} />
          <rect x={-80} y={-130} width={160} height={34} fill={PAL.birch} stroke={INK} strokeWidth={3} />
          <text x={0} y={-105} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} letterSpacing={2} fill={INK}>STANDARDS</text>
          <rect x={-86} y={14} width={172} height={160} fill="#A9B4BC" stroke={INK} strokeWidth={5} />
          {web > 0.02 && (
            <g opacity={web} stroke={INK} strokeWidth={2.2} fill="none">
              <path d={`M -86 -150 L ${-86 + 150 * web} ${-150 + 120 * web}`} />
              <path d={`M -86 -150 L ${-86 + 170 * web} ${-150 + 40 * web}`} />
              <path d={`M -86 -150 L ${-86 + 60 * web} ${-150 + 170 * web}`} />
              {[0.3, 0.55, 0.8].map((r, i) => <path key={i} d={`M ${-86 + 150 * web * r} ${-150 + 120 * web * r} Q ${-86 + 150 * web * r + 20} ${-150 + 40 * web * r + 30} ${-86 + 170 * web * r} ${-150 + 40 * web * r}`} />)}
            </g>
          )}
        </g>
        <GateRig f={g} x={GXs} y={GYs} scale={Ss} fogPlate={fogPlate} frost={frost} bow={bow} verdict="asking" />
        <InkStamp x={GXs} y={GYs + 80 * Ss} text="THE CASE AGAINST" k={stampK * (f < t24 + 90 ? 1 : 0.0 + 1)} size={30} rot={-4} />
        {/* the NO, THANK YOU card hung below the plate on the cranberry board */}
        {cardK > 0.02 && (
          <g transform={`translate(${GXs},${bBot + 62}) rotate(${bow * 4})`} opacity={cardK}>
            <rect x={-150} y={-30} width={300} height={60} rx={4} fill={PAL.birch} stroke={INK} strokeWidth={5} />
            <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} letterSpacing={3} fill={INK}>NO, THANK YOU</text>
          </g>
        )}
        <Token x={GXs + 20} y={bBot + 10 - 38} scale={0.5} text={tokFrost > 0.55 ? '' : 'UNTIL'} frost={tokFrost} mat={0} rot={0} />
        {f > t67 && f < t67 + 30 && <rect x={GXs - 120 * Ss * 0.8} y={GYs + 60 * Ss} width={240 * Ss * 0.8} height={14} fill={PAL.birch} opacity={0.9 * Math.sin(((f - t67) / 30) * Math.PI)} />}
        {/* the waiting machine with a ticket taped to its front, a wall clock beside it and a hole punch */}
        <WallClock x={900} y={640} f={g} />
        <ServerMachine frame={g} emotion="nervous" x={790} y={1240} scale={0.8} lookX={-2 + 8 * glance} tint="copper" />
        <g transform="translate(790,1120)">
          <rect x={-62} y={-30} width={124} height={64} fill={PAL.birch} stroke={INK} strokeWidth={4} transform={`rotate(${3 * Math.sin(g / 14)})`} />
          <text x={0} y={-4} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={16} letterSpacing={2} fill={INK}>TICKET</text>
          {punch > 0.3 && <g><circle cx={0} cy={18} r={10} fill={PAL.pearlSteelDeep} stroke={INK} strokeWidth={3} /></g>}
        </g>
        {punch > 0.02 && punch < 0.99 && <rect x={768} y={1070 + 40 * punch} width={44} height={24} rx={5} fill={PAL.nickelBrass} stroke={INK} strokeWidth={4} />}
      </SVG>
    </Frame>
  );
};

// ---- S9: LaJiness at the count table (beats 29, 66, 30) -------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t29 = b(29), t66 = b(66), t30 = b(30);
  const quote = "I don't think that data centers are good for any community.";
  const n = Math.min(quote.length, typedN(f, t29 + 68, 1.0));
  const typed = quote.slice(0, n);
  const words = typed.split(' ');
  const lines: string[] = [];
  let cur = '';
  words.forEach((w) => { if ((cur + ' ' + w).trim().length > 24) { lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  const dent = ease(f, t30, 10);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={940}
      overlay={<Plate text="HIS GENERAL VIEW" y={580} size={32} tone="paper" p={ease(f, t30 + 6, 8)} />}>
      <SVG>
        <CountTableBG f={g} />
        <Stack x={250} baseY={1190} w={230} h={520} tone={PAL.birch} />
        <NameCard x={640} y={860} w={640} h={440} name="NICK LAJINESS" sub="WINNING INCUMBENT" k={ease(f, t29, 20)}>
          {lines.map((l, i) => <text key={i} x={-290} y={-46 + i * 46} fontFamily={SERIF} fontWeight={900} fontSize={36} fill={INK}>{i === 0 ? '"' : ''}{l}{i === lines.length - 1 && n >= quote.length ? '"' : ''}</text>)}
          {f > t66 && <rect x={-290 + 8} y={-34 + 46} width={clamp01((f - t66) / 12) * 250} height={5} fill={INK} opacity={0.8} />}
          <text x={-290} y={178} fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={2} fill={PAL.pearlSteelDeep}>FAIRBANKS BOROUGH ASSEMBLY</text>
        </NameCard>
        <Token x={880} y={1230} scale={0.8} text="" frost={1} dent={dent} mat={1} />
      </SVG>
    </Frame>
  );
};

// ---- S10: a condition can be written (beats 31, 32, 33, 34) ------------------------------------------------------------------------
const Dial: React.FC<{x: number; y: number; label: string[]; k: number; f: number}> = ({x, y, label, k, f}) => (
  <g transform={`translate(${x},${y + (1 - k) * 90}) scale(${0.6 + 0.4 * k})`} opacity={clamp01(k * 2)}>
    <circle r={54} fill={PAL.pearlSteel} stroke={INK} strokeWidth={6} />
    <circle r={40} fill={PAL.fogWhite} stroke={INK} strokeWidth={3} />
    {Array.from({length: 9}, (_, i) => <line key={i} x1={0} y1={-38} x2={0} y2={-30} stroke={INK} strokeWidth={3} transform={`rotate(${-120 + i * 30})`} />)}
    <line x1={0} y1={0} x2={0} y2={-30} stroke={INK} strokeWidth={4} strokeLinecap="round" transform={`rotate(${-120 + 1.5 * Math.sin(f / 7 + x)})`} />
    <circle r={5} fill={INK} />
    {label.map((l, i) => <text key={i} x={0} y={88 + i * 22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={21} letterSpacing={1.2} fill={INK} stroke={PAL.fogWhite} strokeWidth={5} paintOrder="stroke">{l}</text>)}
  </g>
);
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t31 = b(31), t32 = b(32), t33 = b(33), t34 = b(34);
  const lit = ease(f, t31, 14);
  const crack = easeIO(f, t32, 14);
  const frostLeft = 1 - crack;
  const clause = ease(f, t32 + 12, 14);
  const GY10 = 930, GS10 = 1.6;
  const bTop = GY10 + 42 * GS10, bBot = GY10 + 120 * GS10;
  const dialKs = [0, 1, 2, 3].map((i) => ease(f, t33 + 6 + i * 6, 14));
  const tap = f - t34;
  const tapIdx = tap < 0 ? -1 : Math.min(3, Math.floor(tap / 10));
  const dialXs = [150, 390, 690, 930];
  const penX = tapIdx < 0 ? 760 : dialXs[tapIdx], penY = tapIdx < 0 ? bBot + 40 : 1170 + 10 * Math.abs(Math.sin(tap * 0.5));
  const pieces = [0, 1, 2, 3, 4, 5].map((i) => ({x: 420 + i * 55, fall: easeIn(f, t32 + i * 3, 34)}));
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={950}
      overlay={<>
        <Plate text="UNTIL STANDARDS EXIST · PER KUAC" displayLines={['UNTIL STANDARDS EXIST', 'PER KUAC']} y={560} size={30} tone="paper" p={ease(f, t32 + 14, 8) * (f < t33 + 4 ? 1 : 0)} />
        <Plate text="A DOOR WITH A CONDITION" y={680} size={32} tone="paper" p={ease(f, t33 + 14, 8) * (f < t34 ? 1 : 0)} />
        <Plate text="A CONDITION CAN BE WRITTEN" y={770} size={30} tone="paper" p={ease(f, t34 + 4, 8)} />
      </>}>
      <SVG>
        <FogLot f={g} fog={lerp(1.3, 0.55, crack)} sunBurn={crack} />
        <GateRig f={g} x={540} y={GY10} scale={GS10} fogPlate={1 - clause} frost={frostLeft} sill={true} lampLit={lit} />
        {/* the condition plate: birch with INK text, warm when lit */}
        <g opacity={clause}>
          <rect x={540 - 164 * GS10} y={bTop - 2} width={328 * GS10} height={(bBot - bTop) - 2} rx={10} fill={lit > 0.5 ? PAL.goldHi : PAL.birch} stroke={INK} strokeWidth={5} />
          <text x={540} y={bTop + 44} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} letterSpacing={2} fill={INK}>UNTIL STANDARDS</text>
          <text x={540} y={bTop + 84} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} letterSpacing={2} fill={INK}>EXIST</text>
        </g>
        {lit > 0.02 && lit < 1 && <rect x={540 - 164 * GS10} y={bTop - 2} width={328 * GS10} height={(bBot - bTop) - 2} rx={10} fill={PAL.goldHi} opacity={0.35 * lit} />}
        {frostLeft > 0.02 && frostLeft < 0.98 && pieces.map((q, i) => <rect key={i} x={q.x} y={GY10 - 40 + q.fall * 520} width={52} height={30} rx={4} fill={PAL.frost} stroke={PAL.frostEdge} strokeWidth={2} transform={`rotate(${q.fall * 90 * (i % 2 ? 1 : -1)} ${q.x} ${GY10 - 40 + q.fall * 520})`} opacity={1 - q.fall} />)}
        <Token x={430} y={bBot + 10 - 38} scale={0.5} text="" dent={1} frost={frostLeft} mat={0} />
        <FlatSheet x={690} y={bBot + 26} scale={0.9} f={g} />
        {/* four labelled dials rise under the plate: ELECTRICAL DEMAND, WATER USE, ENVIRONMENTAL IMPACTS, AIR QUALITY */}
        {[['ELECTRICAL', 'DEMAND'], ['WATER', 'USE'], ['ENVIRONMENTAL', 'IMPACTS'], ['AIR', 'QUALITY']].map((l, i) => <Dial key={i} x={dialXs[i]} y={1200} label={l} k={dialKs[i]} f={g} />)}
        <NickelPen x={penX} y={penY} f={g} angle={-60} scale={0.55} />
      </SVG>
    </Frame>
  );
};

// ---- S11: the title page (beats 36, 37, 52) ------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t36 = b(36), t37 = b(37), t52 = b(52);
  const roll = easeIO(f, t36, 36);
  const tag = spring(f, t37, 16);
  const riffle = ease(f, t52, 20);
  const underline = ease(f, t52, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={960}
      overlay={<Plate text="OFFICE OF NAVAL RESEARCH · PER THE DEPOSIT RECORD" displayLines={['OFFICE OF NAVAL RESEARCH', 'PER THE DEPOSIT RECORD']} y={600} size={28} tone="navy" p={ease(f, t37 + 8, 8)} />}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="#7A6A58" />
        <rect x={-40} y={-40} width={1160} height={560} fill={PAL.wall} />
        <ellipse cx={540} cy={1000} rx={640} ry={520} fill="#FFE2AE" opacity={0.18 + 0.03 * Math.sin(g / 23)} />
        {/* a ring of chairs round the table */}
        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * Math.PI * 2, cx = 540 + Math.cos(a) * 470, cy = 1000 + Math.sin(a) * 330;
          return <g key={i} transform={`translate(${cx},${cy}) rotate(${(a * 180) / Math.PI + 90}) translate(0,${2 * Math.sin(g / 20 + i)})`}><rect x={-24} y={-22} width={48} height={44} rx={8} fill="#5C6872" stroke={INK} strokeWidth={3} /></g>;
        })}
        <g transform="translate(540,1000)">
          <ContactShadow cx={0} cy={250} rx={380} ry={22} opacity={0.4} />
          <rect x={-310} y={-250} width={620} height={500} fill={PAL.birch} stroke={INK} strokeWidth={7} />
          <line x1={0} y1={-250} x2={0} y2={250} stroke={INK} strokeWidth={4} opacity={0.5} />
          <text x={-155} y={-150} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={38} fill={INK}>COMPUTING</text>
          <text x={-155} y={-96} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={38} fill={INK}>IN PLACE</text>
          <text x={-155} y={-30} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={16} letterSpacing={1} fill={PAL.pearlSteelDeep}>A CONVERSATION GUIDE ON</text>
          <text x={-155} y={-8} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={16} letterSpacing={1} fill={PAL.pearlSteelDeep}>DATA CENTERS FOR ALASKANS</text>
          {/* a page-turn highlight sweeps the right page as the guide opens */}
          {f > t36 && f < t36 + 40 && <path d={`M ${lerp(300, -300, (f - t36) / 40)} -250 Q ${lerp(300, -300, (f - t36) / 40) - 80} 0 ${lerp(300, -300, (f - t36) / 40)} 250`} fill="none" stroke={PAL.fogWhite} strokeWidth={26} opacity={0.5} />}
          {/* the right page riffles to a spread of question marks */}
          <g opacity={riffle}>
            {[0, 1, 2, 3, 4, 5].map((i) => <text key={i} x={70 + (i % 3) * 90} y={-130 + Math.floor(i / 3) * 130} fontFamily={SERIF} fontWeight={900} fontSize={84} fill={INK} opacity={0.75}>?</text>)}
          </g>
          {/* the navy deposit-record tag snaps onto the cover */}
          <g transform={`translate(${190 + (1 - tag) * 120},${190 - (1 - tag) * 60}) rotate(${-4 + (1 - tag) * 20})`} opacity={clamp01(tag * 3)}>
            <rect x={-130} y={-34} width={260} height={68} rx={6} fill={PAL.navy} stroke={INK} strokeWidth={5} />
            <rect x={-44} y={-44} width={88} height={16} rx={5} fill={PAL.pearlSteel} stroke={INK} strokeWidth={4} />
            <text x={0} y={-4} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} letterSpacing={1.5} fill={PAL.birch}>OFFICE OF NAVAL RESEARCH</text>
            <text x={0} y={20} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={14} letterSpacing={1.5} fill={PAL.birch}>PER THE DEPOSIT RECORD</text>
            <rect x={-104} y={26} width={208 * underline} height={3} fill={PAL.birch} />
          </g>
        </g>
        <Token x={lerp(-120, 360, roll)} y={lerp(1300, 1130, roll) - 60 * Math.sin(Math.PI * roll) - 22 * riffle} scale={0.7} text="" dent={1} mat={1} rot={360 * roll * 1.5} />
      </SVG>
    </Frame>
  );
};

// ---- S12: who benefits, who pays (beats 53, 39, 40) -----------------------------------------------------------------------------------
const SatToken: React.FC<{x: number; y: number; text: string; label: string; k: number; lit: number}> = ({x, y, text, label, k, lit}) => (
  <g opacity={clamp01(k * 2)}>
    <circle cx={x} cy={y} r={96 + 10 * lit} fill={PAL.goldHi} opacity={0.35 * lit} />
    <QuestionToken x={x} y={y} scale={1.3} text={text} color={PAL.nickelBrass} faceColor="#A89A72" inkColor={INK} rimColor={PAL.goldHi} />
    <circle cx={x} cy={y} r={78} fill="none" stroke={PAL.goldHi} strokeWidth={2.5} opacity={0.5 + 0.5 * lit} />
    <rect x={x - 118} y={y + 92} width={236} height={34} rx={4} fill={PAL.birch} stroke={INK} strokeWidth={3} opacity={k} />
    <text x={x} y={y + 116} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={1} fill={INK} opacity={k}>{label}</text>
  </g>
);
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t53 = b(53), t39 = b(39), t40 = b(40);
  const lift = easeIO(f, t53, 24);
  const bloom = ease(f, t53 + 6, 20);
  const eng = [0, 1, 2, 3].map((i) => ease(f, t39 + i * 4, 10));
  const pays = ease(f, t40, 12);
  const rack = Math.sin(g / 40) * 14;
  return (
    <Frame p={p} z0={1.0} z1={1.04} dx0={rack} dx1={-rack}
      overlay={<Plate text="WHO BENEFITS? WHO PAYS? · AS UAF SUMMARIZES" displayLines={['WHO BENEFITS? WHO PAYS?', 'AS UAF SUMMARIZES']} y={600} size={28} tone="paper" p={ease(f, t39 + 6, 8)} />}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={PAL.desk} />
        <ellipse cx={540} cy={950} rx={620} ry={560} fill="#FFE2AE" opacity={0.14 + 0.03 * Math.sin(g / 17)} />
        <rect x={40} y={720} width={1000} height={500} fill="#24415F" stroke={INK} strokeWidth={5} opacity={0.5} />
        {[[220, 820, 'WHAT COMPUTING', 'WHAT COMPUTING?'], [860, 820, 'WHAT RESOURCES', 'WHAT RESOURCES?'], [220, 1150, 'WHO SHOULD CONTROL IT', 'WHO SHOULD CONTROL IT?'], [860, 1150, 'WHO BENEFITS', 'WHO BENEFITS?']].map((q, i) => (
          <SatToken key={i} x={q[0] as number} y={q[1] as number} text={q[2] as string} label={q[3] as string} k={bloom * (f < t39 ? 1 : 1)} lit={eng[i] * (i === 3 ? 1 : 0.5)} />
        ))}
        <ContactShadow cx={540} cy={1070 + 60 * (1 - lift)} rx={150} ry={16} opacity={0.4 * lift} />
        <Token x={540} y={960 + 70 * (1 - lift) - 12 * lift} scale={2.1} text={pays > 0.5 ? 'WHO PAYS' : ''} glow={pays} />
      </SVG>
    </Frame>
  );
};

// ---- S13: two apertures (beats 41, 42, 43, 44, 55, 45, 65) ---------------------------------------------------------------------------------
const QCard: React.FC<{x: number; y: number; rows: number; k: number}> = ({x, y, rows, k}) => (
  <g transform={`translate(${x},${y}) scale(${0.8 + 0.2 * k})`} opacity={clamp01(k * 2)}>
    <rect x={-60} y={-14} width={120} height={rows * 38 + 28} fill={PAL.birch} stroke={INK} strokeWidth={6} />
    {Array.from({length: rows}, (_, i) => <text key={i} x={0} y={24 + i * 38} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={34} fill={INK}>? ?</text>)}
  </g>
);
const Silhouette: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <rect x={-40} y={-60} width={80} height={60} rx={8} fill={PAL.fogWhite} stroke={INK} strokeWidth={5} />
    <rect x={-8} y={-50} width={16} height={40} fill={PAL.panel} /><rect x={-20} y={-38} width={40} height={16} fill={PAL.panel} />
  </g>
);
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t41 = b(41), t42 = b(42), t43 = b(43), t44 = b(44), t55 = b(55), t45 = b(45), t65 = b(65);
  const split = easeIO(f, t42, 30);
  const typed = "A small facility supporting a hospital or tribal government, for example, raises different questions from a hyperscale facility serving global customers.";
  const n = Math.min(typed.length, typedN(f, t43, 0.7));
  const qlines: string[] = [];
  let cur = '';
  typed.slice(0, n).split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > 46) { qlines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) qlines.push(cur);
  const clinicX = lerp(-140, 250, easeIO(f, t43, 50));
  const machX = lerp(1250, 790, easeIO(f, t45, 34));
  const pull = easeIO(f, t45, 40);
  const cardSmall = ease(f, t44, 12), cardFlip = ease(f, t55, 14), cardBig = ease(f, t65, 12);
  const ringX = lerp(540, 250, split), ringX2 = lerp(540, 790, split);
  return (
    <Frame p={p} zk={() => lerp(1.12, 1.0, pull)} ox={540} oy={1000}
      overlay={<>
        <Plate text="HOSPITAL OR TRIBAL FACILITY" displayLines={['HOSPITAL OR', 'TRIBAL FACILITY']} x={290} y={1075} size={26} tone="paper" p={ease(f, t44 + 4, 8) * (f < t45 ? 1 : 0)} />
        <Plate text="HYPERSCALE · DIFFERENT QUESTIONS" displayLines={['HYPERSCALE ·', 'DIFFERENT QUESTIONS']} x={640} y={900} size={26} tone="paper" p={ease(f, t45 + 8, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={1180} fill="#5E6E7A" />
        <rect data-band="ok" x={-40} y={1150} width={1160} height={900} fill={PAL.hall} />
        <rect x={-40} y={1144} width={1160} height={10} fill={INK} opacity={0.4} />
        <ellipse cx={540} cy={900} rx={640} ry={420} fill={PAL.fogWhite} opacity={0.1 + 0.03 * Math.sin(g / 21)} />
        <NameCard x={540} y={720} w={900} h={250} name="LEASI VANESSA LEE RAYMOND, ACEP" k={ease(f, t41, 20)}>
          {qlines.map((l, i) => <text key={i} x={-410} y={-10 + i * 36} fontFamily={SERIF} fontWeight={900} fontSize={30} fill={INK}>{i === 0 ? '"' : ''}{l}{i === qlines.length - 1 && n >= typed.length ? '"' : ''}</text>)}
        </NameCard>
        {/* the Gate's cranberry condition ring splits into two pearl-steel apertures, each ringed inset on its plate */}
        {[{cx: ringX, cutW: 90, tag: 'S'}, {cx: ringX2, cutW: 230, tag: 'L'}].map((a, i) => (
          <g key={a.tag} opacity={clamp01(split * 3)}>
            <AperturePlate f={g} x={a.cx} y={1010} cut={1} cutW={a.cutW} scale={1.15} tint={PAL.pearlSteel} absence={false} />
            <circle cx={a.cx} cy={880} r={30} fill="none" stroke={PAL.cran} strokeWidth={8} />
            <circle cx={a.cx} cy={880} r={44} fill="none" stroke={PAL.pearlSteel} strokeWidth={8} />
          </g>
        ))}
        {split < 0.98 && <circle cx={ringX} cy={880} r={30 + 8 * (1 - split)} fill="none" stroke={PAL.cran} strokeWidth={8} opacity={1 - split} />}
        {/* the question cards, each inked on its own plate */}
        <g transform={`translate(250,1210) scale(${Math.max(0.05, Math.abs(Math.cos(cardFlip * Math.PI)))},1) translate(-250,-1210)`}><QCard x={250} y={1210} rows={cardFlip > 0.5 ? 3 : 2} k={cardSmall} /></g>
        <QCard x={800} y={1180} rows={4} k={cardBig} />
        {f > t43 && <g transform={`translate(${clinicX},${1130 + 6 * Math.sin(g / 4)}) rotate(${3 * Math.sin(g / 5)})`}><ContactShadow cx={0} cy={22} rx={70} ry={9} opacity={0.4} />
          <rect x={-52} y={-86} width={104} height={96} rx={10} fill={PAL.fogWhite} stroke={INK} strokeWidth={6} />
          <rect x={-8} y={-66} width={16} height={46} fill={PAL.panel} /><rect x={-24} y={-52} width={48} height={16} fill={PAL.panel} /></g>}
        {f > t45 && <g transform={`translate(${machX},1250)`}><ServerMachine frame={g} emotion="focused" x={0} y={0} scale={1.1} tint="copper" /></g>}
      </SVG>
    </Frame>
  );
};

// ---- S14: rules sized to what gets built (beats 46, 57, 47) ---------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t46 = b(46), t57 = b(57), t47 = b(47);
  const boot = ease(f, 0, 14);
  const drop = spring(f, t46, 22);
  // the pointer travels YES -> NO -> settles on the scale
  const toYes = easeIO(f, t57, 18), toNo = easeIO(f, t57 + 20, 18), settle = easeIO(f, t57 + 44, 26);
  let ang = 0;
  if (f < t57) ang = -90 + 90 * 0;
  else ang = lerp(lerp(lerp(0, -80, toYes), 80, toNo), -20, settle);
  const turn = easeIO(f, t47, 40);
  const slotL = lerp(60, 150, turn), slotR = lerp(60, 330, turn);
  return (
    <Frame p={p} z0={1.0} z1={1.04} oy={980}
      overlay={<>
        <Plate text="NOT YES, NOT NO" y={560} size={34} tone="panel" p={ease(f, t46 + 10, 8) * (f < t47 - 2 ? 1 : 0)} />
        <Plate text="RULES SIZED TO WHAT GETS BUILT" displayLines={['RULES SIZED TO', 'WHAT GETS BUILT']} y={700} size={32} tone="panel" p={ease(f, t47 + 6, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={PAL.panel} />
        {Array.from({length: 12}, (_, i) => <line key={i} x1={-40} y1={460 + i * 120} x2={1120} y2={460 + i * 120} stroke={PAL.pearlSteel} strokeWidth={2} opacity={0.12 * boot} />)}
        <g transform="translate(540,1020)" opacity={boot}>
          <circle r={330} fill={PAL.pearlSteel} stroke={INK} strokeWidth={8} />
          <circle r={290} fill={PAL.fogWhite} stroke={INK} strokeWidth={5} />
          {/* the size scale between greyed YES and NO */}
          {Array.from({length: 17}, (_, i) => {
            const a = -80 + i * 10;
            return <line key={i} x1={0} y1={-262} x2={0} y2={-262 + (i % 4 === 0 ? 40 : 24)} stroke={INK} strokeWidth={i % 4 === 0 ? 6 : 3} transform={`rotate(${a})`} opacity={0.8 + 0.2 * Math.sin(g / 9 + i)} />;
          })}
          <text transform="rotate(-80) translate(0,-212)" textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} letterSpacing={3} fill={PAL.pearlSteelDeep} opacity={0.45}>YES</text>
          <text transform="rotate(80) translate(0,-212)" textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} letterSpacing={3} fill={PAL.pearlSteelDeep} opacity={0.45}>NO</text>
          <g transform="translate(-180,-80) scale(0.9)"><Silhouette x={0} y={0} /></g>
          <rect x={-232} y={-132} width={104} height={32} fill={PAL.birch} stroke={INK} strokeWidth={3} /><text x={-180} y={-110} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={2} fill={INK}>SMALL</text>
          <g transform={`translate(180,-70) scale(1.4)`} opacity={0.9}><rect x={-34} y={-76} width={68} height={76} rx={6} fill={PAL.steel} stroke={INK} strokeWidth={4} /><circle cx={0} cy={-52} r={7} fill={PAL.fogWhite} /></g>
          <rect x={128} y={-152} width={104} height={32} fill={PAL.birch} stroke={INK} strokeWidth={3} /><text x={180} y={-130} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={2} fill={INK}>LARGE</text>
          {/* the snapped arrow from the opening, the dial's pointer, with the token as its hub */}
          <g transform={`rotate(${ang - 90 + 90})`}>
            <g transform={`translate(0,${-(1 - drop) * 700}) rotate(90)`}><g transform="translate(150,0) scale(1.1)"><SnappedArrow x={0} y={0} rot={0} scale={1} /></g></g>
          </g>
          <Token x={0} y={0} scale={0.9} text="" mat={0.6} rot={turn * 40} />
        </g>
        {/* two slots that resize to the clinic box and the machine silhouettes */}
        <g transform="translate(0,1290)">
          <rect x={270 - slotL} y={-36} width={slotL * 2} height={72} rx={8} fill="none" stroke={PAL.pearlSteel} strokeWidth={6} strokeDasharray="14 10" />
          <rect x={810 - slotR} y={-36} width={slotR * 2} height={72} rx={8} fill="none" stroke={PAL.pearlSteel} strokeWidth={6} strokeDasharray="14 10" />
          <g opacity={turn}><Silhouette x={270} y={22} scale={0.7} /><rect x={776} y={-26} width={68} height={48} rx={4} fill={PAL.steel} stroke={INK} strokeWidth={4} /></g>
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S15: the opening framing again, with the camera drifting back out (beats 48, 64, 49, 50, 51) ---------------------------------------------
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t48 = b(48), t64 = b(64), t49 = b(49), t50 = b(50), t51 = b(51);
  const fog = 1 + 0.35 * ease(f, t50, 40);
  const bill = easeIO(f, t49, 26);
  const pen = ease(f, t64, 10);
  const flip = easeIO(f, t51, 18);
  const tokText = flip > 0.5 ? 'WHO WRITES THEM' : '';
  const hover = 6 * Math.sin(g / 8);
  return (
    <Frame p={p} zk={() => lerp(1.18, 1.0, easeIO(f, 0, p.dur))} oy={1000}
      overlay={<>
        <Plate text="ONE BLANK PAGE" x={300} y={880} size={34} tone="paper" p={ease(f, t48 + 10, 8) * (f < t49 ? 1 : 0)} />
        <Plate text="THE SENATE'S BILL STALLED IN THE HOUSE" displayLines={['THE SENATE\'S BILL', 'STALLED IN THE HOUSE']} y={660} size={32} tone="paper" p={ease(f, t49 + 8, 8) * (f < t51 ? 1 : 0)} />
        <Plate text="WHO WRITES THEM?" y={560} size={44} tone="paper" p={ease(f, t51 + 14, 8)} />
      </>}>
      <SVG>
        <FogLot f={g} fog={fog} sunBurn={0.2} />
        <BallotBox x={170} y={1250} scale={1.1} f={g} />
        <YesNoSign x={950} y={1250} scale={0.95} f={g} snapped stumpOnly />
        <GateRig f={g} x={GX} y={GY} scale={GS} fogPlate={1} />
        <FlatSheet x={420} y={SILL_Y + 18} scale={0.95} f={g} />
        <g transform={`translate(${lerp(1200, 690, bill)},${SILL_Y + 4}) rotate(${-2})`}>
          <rect x={-106} y={-112} width={212} height={116} fill={PAL.birch} stroke={INK} strokeWidth={5} />
          <text x={0} y={-80} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} letterSpacing={1.5} fill={INK}>DATA CENTER BILL</text>
          {[0, 1, 2].map((i) => <line key={i} x1={-66} y1={-56 + i * 24} x2={64 - 20 * (i % 2)} y2={-56 + i * 24} stroke={INK} strokeWidth={2.5} opacity={0.4} />)}
        </g>
        <Token x={560} y={SILL_Y - 38} scale={0.5} text={tokText} rot={flip * 360} mat={0} glow={flip > 0.5 ? 0.6 : 0} />
        <NickelPen x={440 + 10 * pen} y={SILL_Y - 190 + hover * (1 - pen) + 120 * pen} f={g} angle={-70} scale={0.6} />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill="#243B5A" />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.paper}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'THE GATE', 2: 'CHAIRS', 3: 'TALLY', 4: 'RAMIREZ', 5: 'JUNEAU', 6: 'HALL', 7: 'GUIDE', 8: 'FROST', 9: 'LAJINESS', 10: 'CONDITION', 11: 'TITLE', 12: 'TOKENS', 13: 'APERTURES', 14: 'DIAL', 15: 'LOOP'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

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

export const ep1015Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1015Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1015: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 6, 10, 17, 23, 38, 47, 52, 65, 71, 79, 87, 90, 104, 111, 120].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#101826" ink="#F4F2EA" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
