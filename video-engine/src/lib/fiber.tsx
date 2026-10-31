import React from 'react';
import {AK_PATH} from './akmap';

// lib/fiber.tsx, NET-NEW 2026-10-31 ("A Ceiling Is Not a Cable"). The chart-room family: cream chart paper, graphite pencil for everything
// undecided, a cobalt sea cutaway, a brass faced question token (Pip) that travels in every shot. Vermilion is reserved for the two locks, the
// clock and the date. Undecided things are ALWAYS dashed graphite and never filled.

export const FIB = {
  paper: '#F1E7CB', paper2: '#FBF5E1', land: '#C9B27A', landD: '#A8915A', sea: '#2B4C9B', seaLt: '#5C84CC', deep: '#1E3C82',
  brass: '#B8963A', brassL: '#E0C46A', brassD: '#6F5A1E', verm: '#E0502A', ink: '#2B2824', pencil: '#6B7280', green: '#6B7280', wood: '#A8743F', woodD: '#7A4F25', cream: '#FBF5E1',
};
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const SCALLOP = 'M0,-72 L18,-62 L39,-60 L51,-42 L68,-28 L65,-7 L73,12 L60,31 L55,51 L34,58 L17,72 L-4,65 L-25,72 L-42,56 L-63,48 L-65,26 L-77,8 L-65,-11 L-67,-33 L-47,-44 L-34,-64 L-12,-63 Z';

export type PipEmotion = 'curious' | 'puzzled' | 'wry' | 'thoughtful' | 'determined' | 'hopeful' | 'reading';

/** PIP, the faced brass question token. Eyes and brows carry the feeling, the engraving carries the throughline state. */
export const Pip: React.FC<{x?: number; y?: number; s?: number; rot?: number; f: number; emotion?: PipEmotion; squash?: number; look?: number; glow?: number; ghost?: boolean; seed?: number}> =
({x = 0, y = 0, s = 1, rot = 0, f, emotion = 'curious', squash = 0, look = 0, glow = 0, ghost = false, seed = 0}) => {
  const blink = ((f + seed * 37) % 118) < 4 ? 0.15 : 1;
  const bob = Math.sin((f + seed * 20) / 14) * 3;
  const breath = 1 + 0.03 * Math.sin((f + seed * 11) / 19);
  const sway = 3.2 * Math.sin((f + seed * 17) / 41);
  const brow = emotion === 'puzzled' ? [-10, 8] : emotion === 'wry' ? [4, -8] : emotion === 'determined' ? [8, 8] : emotion === 'hopeful' ? [-6, -6] : [0, 0];
  const mouth = emotion === 'puzzled' ? 'M-14,40 Q0,32 14,40' : emotion === 'wry' ? 'M-14,38 Q-2,44 14,32' : emotion === 'determined' ? 'M-14,38 L14,38' : emotion === 'hopeful' ? 'M-14,34 Q0,48 14,34' : 'M-12,36 Q0,44 12,36';
  return (
    <g transform={`translate(${x} ${y + bob}) rotate(${rot + sway}) scale(${s * breath * (1 + squash * 0.18)} ${s * breath * (1 - squash * 0.18)})`} opacity={ghost ? 0.5 : 1}>
      <ellipse cx={0} cy={86} rx={64} ry={12} fill="#000" opacity={0.22} />
      <path d={SCALLOP} fill={FIB.brass} stroke={FIB.ink} strokeWidth={8} strokeLinejoin="round" />
      <path d={SCALLOP} fill="none" stroke={FIB.brassL} strokeWidth={4} transform="scale(0.93)" opacity={0.7} />
      <circle r={52} fill={FIB.brassL} stroke={FIB.brassD} strokeWidth={5} />
      <path d="M-40,-24 Q-20,-52 14,-46" fill="none" stroke="#fff" strokeWidth={5} opacity={0.5} strokeLinecap="round" />
      <circle r={76 + glow * 8} fill="none" stroke={FIB.sea} strokeWidth={4} opacity={glow * 0.6} />
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`translate(${sd * 21} -26)`}>
          <ellipse rx={12} ry={14 * blink} fill="#fff" stroke={FIB.ink} strokeWidth={3} />
          <circle cx={look * 5} cy={1} r={6} fill={FIB.ink} />
          <path d={`M-13,${-20 + brow[sd > 0 ? 1 : 0]} L13,${-20 - brow[sd > 0 ? 1 : 0] * 0.4}`} stroke={FIB.ink} strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      <path d={mouth} fill="none" stroke={FIB.ink} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

/** The engraving is drawn as a separate plate under Pip so the long strings stay legible: a small engraved band below the token. */
export const PipBand: React.FC<{x: number; y: number; text: string; s?: number; p?: number}> = ({x, y, text, s = 1, p = 1}) => {
  const w = Math.max(70, text.length * 12.4 + 28);
  if (p <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp01(p * 1.6)}>
      <rect x={-w / 2} y={-17} width={w} height={34} rx={7} fill={FIB.brassL} stroke={FIB.ink} strokeWidth={4} />
      <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} letterSpacing={0.6} fill={FIB.ink}>{text}</text>
    </g>
  );
};

/** chart paper with a ruled border, a faint grid and a compass rose. `sea` adds the cobalt cutaway band. */
export const ChartBG: React.FC<{f: number; id: string; sea?: number; grid?: boolean; tilt?: number}> = ({f, id, sea = 0, grid = true, tilt = 0}) => {
  const waves = [0, 1, 2, 3, 4].map((i) => 880 + sea * 0 + i * 0);
  void waves;
  return (
    <g>
      <defs>
        <linearGradient id={`pg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={FIB.paper2} />
          <stop offset="1" stopColor={FIB.paper} />
        </linearGradient>
        <linearGradient id={`sg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={FIB.seaLt} />
          <stop offset="0.35" stopColor={FIB.sea} />
          <stop offset="1" stopColor={FIB.deep} />
        </linearGradient>
      </defs>
      <rect x={-40} y={-40} width={1160} height={2000} fill={`url(#pg${id})`} data-band="ok" />
      {grid && Array.from({length: 17}).map((_, i) => (
        <line key={`h${i}`} x1={0} x2={1080} y1={140 + i * 112} y2={140 + i * 112 + tilt} stroke={FIB.land} strokeWidth={1.4} opacity={0.35} data-band="ok" />
      ))}
      {grid && Array.from({length: 10}).map((_, i) => (
        <line key={`v${i}`} y1={0} y2={1920} x1={60 + i * 106} x2={60 + i * 106} stroke={FIB.land} strokeWidth={1.4} opacity={0.3} data-band="ok" />
      ))}
      <rect x={26} y={26} width={1028} height={1868} fill="none" stroke={FIB.ink} strokeWidth={5} opacity={0.5} data-band="ok" />
      <rect x={40} y={40} width={1000} height={1840} fill="none" stroke={FIB.ink} strokeWidth={1.6} opacity={0.4} data-band="ok" />
      <g data-band="ok">
        <rect x={-20} y={-10} width={1120} height={92} fill={FIB.wood} stroke={FIB.ink} strokeWidth={6} />
        <rect x={-20} y={64} width={1120} height={18} fill={FIB.woodD} opacity={0.6} />
        {[150, 520, 880].map((cx, i) => (
          <g key={i} transform={`translate(${cx} 82) rotate(${2.2 * Math.sin(f / 31 + i * 2)})`}>
            <line x1={0} y1={0} x2={0} y2={96 + 40 * i % 3} stroke={FIB.ink} strokeWidth={4} />
            <path d={`M-62,${96 + 40 * i % 3} L62,${96 + 40 * i % 3} L44,${150 + 40 * i % 3} L-44,${150 + 40 * i % 3} Z`} fill={i === 1 ? FIB.brassL : FIB.cream} stroke={FIB.ink} strokeWidth={5} />
          </g>
        ))}
        <path d="M300,82 L780,82 L1020,1100 L60,1100 Z" fill="#FFF6D0" opacity={0.1} />
        <g transform="translate(250 150)" opacity={0.85}>
          <rect x={-120} y={-14} width={240} height={30} rx={4} fill={FIB.brassL} stroke={FIB.ink} strokeWidth={4} transform="rotate(-6)" />
          {Array.from({length: 11}).map((_, i) => <line key={i} x1={-110 + i * 22} x2={-110 + i * 22} y1={-14 + (-110 + i * 22) * -0.105} y2={-2 + (-110 + i * 22) * -0.105} stroke={FIB.ink} strokeWidth={2.4} />)}
        </g>
      </g>
      <g transform="translate(930 190)" opacity={0.7} data-band="ok">
        <circle r={60} fill="none" stroke={FIB.ink} strokeWidth={2.4} />
        <path d="M0,-74 L12,0 L0,74 L-12,0 Z" fill={FIB.ink} opacity={0.55} />
        <path d="M-74,0 L0,-9 L74,0 L0,9 Z" fill={FIB.ink} opacity={0.3} />
        <text y={-82} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={FIB.ink}>N</text>
      </g>
      {sea > 0 && (
        <g data-band="ok">
          <rect x={-40} y={1920 - 1920 * sea} width={1160} height={1920 * sea + 40} fill={`url(#sg${id})`} />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M-40,${1920 - 1920 * sea + 18 + i * 10} ${Array.from({length: 14}).map((_, k) => `Q${k * 90 + 35 + 14 * Math.sin(f / 18 + k + i)},${1920 - 1920 * sea + 4 + i * 10 + (k % 2 ? 12 : -12)} ${k * 90 + 80},${1920 - 1920 * sea + 18 + i * 10}`).join(' ')}`}
              fill="none" stroke="#fff" strokeWidth={3 - i * 0.5} opacity={0.35 - i * 0.07} />
          ))}
          {Array.from({length: 7}).map((_, i) => (
            <ellipse key={i} cx={(i * 197 + f * 0.6 * (1 + (i % 3) * 0.4)) % 1140 - 30} cy={1920 - 1920 * sea * (0.35 + (i * 0.37) % 0.55)} rx={22 + (i % 3) * 8} ry={4} fill="#fff" opacity={0.08} />
          ))}
        </g>
      )}
    </g>
  );
};

/** a cable run: ink-outlined armoured tube with a travelling pulse. `draw` 0..1 reveals it. dashed = graphite pencil (undecided). */
export const CableRun: React.FC<{d: string; f: number; draw?: number; color?: string; w?: number; dashed?: boolean; pulse?: boolean; id: string; speed?: number; ghost?: number}> =
({d, f, draw = 1, color = FIB.cream, w = 14, dashed = false, pulse = true, id, speed = 1, ghost = 1}) => {
  const L = 3000;
  if (dashed) {
    return (
      <g opacity={ghost}>
        <path d={d} fill="none" stroke={FIB.pencil} strokeWidth={w * 0.55} strokeDasharray="16 14" strokeLinecap="round" strokeDashoffset={-f * 0.6} pathLength={L} />
      </g>
    );
  }
  return (
    <g opacity={ghost}>
      <path d={d} fill="none" stroke={FIB.ink} strokeWidth={w + 8} strokeLinecap="round" strokeLinejoin="round" pathLength={L} strokeDasharray={`${L * draw} ${L}`} />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={L} strokeDasharray={`${L * draw} ${L}`} />
      <path d={d} fill="none" stroke="#fff" strokeWidth={w * 0.25} strokeLinecap="round" pathLength={L} strokeDasharray={`${L * draw} ${L}`} opacity={0.45} transform="translate(0 -3)" />
      {pulse && draw > 0.98 && (
        <path d={d} fill="none" stroke={FIB.paper2} strokeWidth={w * 0.6} strokeLinecap="round" pathLength={L}
          strokeDasharray={`90 ${L / 3 - 90}`} strokeDashoffset={-((f * 22 * speed) % (L / 3))} opacity={0.85} id={`pl${id}`} />
      )}
    </g>
  );
};

export const Phone: React.FC<{x: number; y: number; s?: number; f: number; glow?: number; rot?: number}> = ({x, y, s = 1, f, glow = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={150} rx={110} ry={16} fill="#000" opacity={0.22} />
    <rect x={-70} y={-140} width={140} height={288} rx={24} fill="#2A3350" stroke={FIB.ink} strokeWidth={6} />
    <rect x={-58} y={-124} width={116} height={250} rx={14} fill={FIB.deep} />
    <rect x={-58} y={-124} width={116} height={250} rx={14} fill={FIB.seaLt} opacity={0.25 + 0.2 * glow * (0.6 + 0.4 * Math.sin(f / 9))} />
    <rect x={-44} y={20} width={88} height={22} rx={11} fill={FIB.paper2} opacity={0.9} />
    <rect x={-44} y={52} width={60} height={14} rx={7} fill={FIB.paper2} opacity={0.5} />
    <circle cx={0} cy={118} r={6} fill={FIB.paper2} opacity={0.6} />
    <rect x={-22} y={-132} width={44} height={6} rx={3} fill={FIB.ink} />
  </g>
);

export const Sign: React.FC<{x: number; y: number; text: string; sub?: string; f: number; rise?: number; s?: number; w?: number; rot?: number}> = ({x, y, text, sub, f, rise = 1, s = 1, w = 520, rot = 0}) => {
  const sway = Math.sin(f / 15) * 1.6;
  return (
    <g transform={`translate(${x} ${y + (1 - rise) * 320}) rotate(${rot + sway}) scale(${s})`} opacity={clamp01(rise * 3)}>
      <ellipse cx={0} cy={4} rx={50} ry={9} fill="#000" opacity={0.22} />
      <rect x={-9} y={-260} width={18} height={262} fill="#8A8F9E" stroke={FIB.ink} strokeWidth={4} />
      <rect x={-w / 2} y={-420} width={w} height={sub ? 168 : 128} rx={14} fill={FIB.green} stroke={FIB.ink} strokeWidth={7} />
      <rect x={-w / 2 + 10} y={-410} width={w - 20} height={sub ? 148 : 108} rx={9} fill="none" stroke={FIB.paper2} strokeWidth={3} />
      <text x={0} y={sub ? -352 : -350} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={w > 480 ? 36 : 30} letterSpacing={1} fill={FIB.paper2}>{text}</text>
      {sub && <text x={0} y={-296} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={1} fill={FIB.brassL}>{sub}</text>}
    </g>
  );
};

/** a glass jar with a painted ceiling line, optionally empty. */
export const Jar: React.FC<{x: number; y: number; s?: number; f: number; line?: string; fill?: number}> = ({x, y, s = 1, f, line = 'UP TO $75 MILLION', fill = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={170} ry={22} fill="#000" opacity={0.25} />
    <path d="M-150,-460 L-150,-10 Q-150,10 -130,10 L130,10 Q150,10 150,-10 L150,-460" fill={FIB.seaLt} fillOpacity={0.16} stroke={FIB.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M-132,-440 L-132,-18" stroke="#fff" strokeWidth={9} opacity={0.5} strokeLinecap="round" />
    <rect x={-168} y={-482} width={336} height={30} rx={10} fill={FIB.land} stroke={FIB.ink} strokeWidth={7} />
    <line x1={-150} x2={150} y1={-420} y2={-420} stroke={FIB.ink} strokeWidth={5} strokeDasharray="22 12" />
    <rect x={-136} y={-412} width={272} height={44} rx={6} fill={FIB.paper2} stroke={FIB.ink} strokeWidth={4} />
    <text x={0} y={-381} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} letterSpacing={0.5} fill={FIB.ink}>{line}</text>
    {fill > 0 && <rect x={-142} y={-10 - 380 * fill} width={284} height={380 * fill} fill={FIB.brass} opacity={0.8} />}
    <circle cx={0} cy={-6 + 0 * f} r={0} fill={FIB.brass} />
  </g>
);

export const Coin: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse rx={30} ry={30} fill={FIB.brass} stroke={FIB.ink} strokeWidth={5} />
    <ellipse rx={21} ry={21} fill="none" stroke={FIB.brassD} strokeWidth={3} />
    <path d="M-12,-14 Q0,-26 12,-14" stroke="#fff" strokeWidth={4} fill="none" opacity={0.6} />
  </g>
);

export const Calendar: React.FC<{x: number; y: number; s?: number; f: number; face?: number; text?: string; sub?: string; rot?: number; tab?: boolean}> =
({x, y, s = 1, f, face = 0, text = 'DEC 31ST', sub = '2028', rot = 0, tab = true}) => {
  const sw = Math.sin(f / 17) * 1.4;
  const sx = Math.max(0.04, Math.abs(Math.cos(face * Math.PI)));
  const front = face > 0.5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + sw}) scale(${s})`}>
      <ellipse cx={8} cy={170} rx={130} ry={14} fill="#000" opacity={0.18} />
      <circle cx={0} cy={-170} r={9} fill={FIB.ink} />
      <g transform={`scale(${sx} 1)`}>
        <rect x={-120} y={-160} width={240} height={320} rx={10} fill={front ? FIB.paper2 : FIB.land} stroke={FIB.ink} strokeWidth={7} />
        {front ? (
          <g>
            <rect x={-120} y={-160} width={240} height={70} rx={10} fill={FIB.verm} stroke={FIB.ink} strokeWidth={7} />
            <text x={0} y={-112} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} fill={FIB.paper2}>{text}</text>
            <text x={0} y={30} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight={900} fontSize={110} fill={FIB.ink}>{sub}</text>
          </g>
        ) : (
          <g>
            <path d="M-100,-120 L100,-120 M-100,-80 L100,-80 M-100,-40 L100,-40" stroke={FIB.landD} strokeWidth={4} />
            {tab && <path d="M120,-40 L170,-20 L120,16 Z" fill={FIB.verm} stroke={FIB.ink} strokeWidth={5} />}
          </g>
        )}
      </g>
    </g>
  );
};

export const Doc: React.FC<{x: number; y: number; s?: number; rot?: number; title: string; lines?: number; stamp?: string}> = ({x, y, s = 1, rot = 0, title, lines = 6}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-88} y={-118} width={176} height={236} rx={6} fill="#000" opacity={0.16} transform="translate(8 9)" />
    <rect x={-88} y={-118} width={176} height={236} rx={6} fill={FIB.paper2} stroke={FIB.ink} strokeWidth={5} />
    <rect x={-72} y={-102} width={144} height={22} rx={3} fill={FIB.ink} opacity={0.85} />
    <text x={0} y={-85} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={14} fill={FIB.paper2}>{title}</text>
    {Array.from({length: lines}).map((_, i) => <rect key={i} x={-72} y={-62 + i * 24} width={i % 3 === 2 ? 96 : 144} height={9} rx={3} fill={FIB.pencil} opacity={0.5} />)}
  </g>
);

/** the brass two-pan scale. tilt -1 (left pan down) .. +1 (right pan down). */
export const ScalePans: React.FC<{x: number; y: number; s?: number; tilt: number; f: number; left?: React.ReactNode; right?: React.ReactNode; labels?: [string, string]}> =
({x, y, s = 1, tilt, f, left, right, labels}) => {
  const ang = tilt * 16 + Math.sin(f / 13) * 0.6 * (1 - Math.abs(tilt));
  const r = (ang * Math.PI) / 180;
  const half = 270;
  const lx = -half * Math.cos(r), ly = -150 - half * Math.sin(r) * -1;
  const rx = half * Math.cos(r), ry = -150 + half * Math.sin(r) * -1;
  // beam endpoints: left end drops when tilt<0
  const lyy = -330 + (-ang) * 0 + (ang > 0 ? 0 : 0);
  void lyy;
  const L = {x: -half * Math.cos(r), y: -330 + half * Math.sin(r)};
  const R = {x: half * Math.cos(r), y: -330 - half * Math.sin(r)};
  void lx; void ly; void rx; void ry;
  const pan = (px: number, py: number, kids: React.ReactNode, k: number) => (
    <g transform={`translate(${px} ${py})`}>
      <path d={`M0,0 L-120,150 M0,0 L120,150`} stroke={FIB.brassD} strokeWidth={5} />
      <path d="M-150,150 Q0,230 150,150 Z" fill={FIB.brass} stroke={FIB.ink} strokeWidth={7} />
      <path d="M-130,160 Q-60,200 20,208" fill="none" stroke={FIB.brassL} strokeWidth={6} opacity={0.8} />
      <g transform="translate(0 145)" key={k}>{kids}</g>
      {labels && (
        <g transform="translate(0 -52)">
          <rect x={-labels[k].length * 9.4 - 14} y={-20} width={labels[k].length * 18.8 + 28} height={40} rx={5} fill={FIB.cream} stroke={FIB.ink} strokeWidth={4} />
          <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} letterSpacing={0.5} fill={FIB.ink}>{labels[k]}</text>
        </g>
      )}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={22} rx={220} ry={20} fill="#000" opacity={0.25} />
      <path d="M-120,10 L120,10 L60,-20 L-60,-20 Z" fill={FIB.brassD} stroke={FIB.ink} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-18} y={-340} width={36} height={330} rx={8} fill={FIB.brass} stroke={FIB.ink} strokeWidth={7} />
      <path d={`M${L.x},${L.y} L${R.x},${R.y}`} stroke={FIB.ink} strokeWidth={26} strokeLinecap="round" />
      <path d={`M${L.x},${L.y} L${R.x},${R.y}`} stroke={FIB.brassL} strokeWidth={14} strokeLinecap="round" />
      <circle cx={0} cy={-330} r={22} fill={FIB.brass} stroke={FIB.ink} strokeWidth={7} />
      {pan(L.x, L.y, left, 0)}
      {pan(R.x, R.y, right, 1)}
    </g>
  );
};

export const Magnifier: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = -30}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-8} y={50} width={16} height={92} rx={8} fill={FIB.wood} stroke={FIB.ink} strokeWidth={5} />
    <circle r={58} fill="#fff" fillOpacity={0.28} stroke={FIB.ink} strokeWidth={9} />
    <circle r={58} fill="none" stroke={FIB.brass} strokeWidth={4} transform="scale(0.88)" />
    <path d="M-36,-26 Q-18,-46 8,-44" fill="none" stroke="#fff" strokeWidth={6} opacity={0.7} strokeLinecap="round" />
  </g>
);

export const Keyhole: React.FC<{x: number; y: number; s?: number; lit?: number; label: string; f: number}> = ({x, y, s = 1, lit = 0, label, f}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={92} rx={110} ry={13} fill="#000" opacity={0.22} />
    <rect x={-96} y={-96} width={192} height={186} rx={16} fill={FIB.paper2} stroke={FIB.ink} strokeWidth={7} />
    <rect x={-96} y={-96} width={192} height={186} rx={16} fill={FIB.verm} opacity={0.12 + 0.28 * lit} />
    <circle cx={0} cy={-18} r={26} fill={FIB.ink} />
    <path d="M-14,-6 L14,-6 L22,56 L-22,56 Z" fill={FIB.ink} />
    <circle cx={0} cy={-18} r={26 + lit * 6 + 2 * Math.sin(f / 6) * lit} fill="none" stroke={FIB.verm} strokeWidth={5} opacity={lit} />
    <text x={0} y={-62} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={label.length > 10 ? 15 : 20} fill={FIB.ink}>{label}</text>
  </g>
);

export const Postcard: React.FC<{x: number; y: number; s?: number; rot?: number; text: string}> = ({x, y, s = 1, rot = 0, text}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-92} y={-58} width={184} height={116} rx={5} fill={FIB.paper2} stroke={FIB.ink} strokeWidth={5} transform="translate(5 6)" opacity={0.2} />
    <rect x={-92} y={-58} width={184} height={116} rx={5} fill={FIB.paper2} stroke={FIB.ink} strokeWidth={5} />
    <rect x={56} y={-48} width={28} height={34} fill="none" stroke={FIB.pencil} strokeWidth={3} strokeDasharray="5 4" />
    <text x={-8} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={FIB.ink}>{text}</text>
    <path d="M-76,32 L52,32 M-76,44 L20,44" stroke={FIB.pencil} strokeWidth={3} />
  </g>
);

export const WallClock: React.FC<{x: number; y: number; s?: number; f: number; hand?: number}> = ({x, y, s = 1, f, hand = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={216} rx={170} ry={16} fill="#000" opacity={0.2} />
    <circle r={200} fill={FIB.paper2} stroke={FIB.ink} strokeWidth={14} />
    <circle r={176} fill="none" stroke={FIB.verm} strokeWidth={6} />
    {Array.from({length: 12}).map((_, i) => <line key={i} x1={0} y1={-168} x2={0} y2={i % 3 === 0 ? -138 : -152} stroke={FIB.ink} strokeWidth={i % 3 === 0 ? 9 : 5} transform={`rotate(${i * 30})`} />)}
    <line x1={0} y1={0} x2={0} y2={-120} stroke={FIB.ink} strokeWidth={13} strokeLinecap="round" transform={`rotate(${hand * 30 + 60})`} />
    <line x1={0} y1={0} x2={0} y2={-160} stroke={FIB.verm} strokeWidth={7} strokeLinecap="round" transform={`rotate(${hand * 360 + f * 6})`} />
    <circle r={14} fill={FIB.ink} />
  </g>
);

/** a lower-third near plane for the chart desk: rolled chart, pencil, ruler. keeps the bottom of the 9:16 from being dead. */
export const DeskNear: React.FC<{f: number; seed?: number}> = ({f, seed = 0}) => {
  const d = Math.sin(f / 37 + seed) * 6;
  return (
    <g data-band="ok" transform={`translate(${d} 0)`}>
      <rect x={-40} y={1560} width={1160} height={400} fill={FIB.wood} />
      <rect x={-40} y={1560} width={1160} height={14} fill={FIB.woodD} />
      {Array.from({length: 7}).map((_, i) => <path key={i} d={`M-40,${1600 + i * 52} Q540,${1590 + i * 52 + 8 * Math.sin(i)} 1120,${1604 + i * 52}`} stroke={FIB.woodD} strokeWidth={2} fill="none" opacity={0.5} />)}
      <g transform="translate(170 1700) rotate(-8)">
        <rect x={-150} y={-30} width={300} height={60} rx={30} fill={FIB.paper2} stroke={FIB.ink} strokeWidth={6} />
        <ellipse cx={-150} cy={0} rx={18} ry={30} fill={FIB.land} stroke={FIB.ink} strokeWidth={5} />
        <path d="M-130,-14 Q0,-26 130,-14" stroke={FIB.pencil} strokeWidth={4} fill="none" opacity={0.5} />
      </g>
      <g transform="translate(820 1760) rotate(6)">
        <rect x={-190} y={-18} width={380} height={36} rx={4} fill={FIB.brassL} stroke={FIB.ink} strokeWidth={5} />
        {Array.from({length: 18}).map((_, i) => <line key={i} x1={-180 + i * 21} x2={-180 + i * 21} y1={-18} y2={i % 5 === 0 ? 2 : -6} stroke={FIB.ink} strokeWidth={2.4} />)}
      </g>
      <g transform="translate(560 1830) rotate(-3)">
        <path d="M-120,0 L110,-6 L132,-2 L110,6 Z" fill={FIB.verm} stroke={FIB.ink} strokeWidth={4} />
        <path d="M110,-6 L132,-2 L110,6 Z" fill={FIB.land} stroke={FIB.ink} strokeWidth={3} />
        <path d="M126,-2 L134,-2" stroke={FIB.pencil} strokeWidth={4} />
      </g>
    </g>
  );
};

export const AK_BOX = {w: 1000, h: 700};
export const AlaskaShape: React.FC<{x: number; y: number; s: number; f?: number; fill?: string; dashed?: boolean}> = ({x, y, s, fill = FIB.land, dashed = false}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={AK_PATH} fill={dashed ? 'none' : fill} stroke={dashed ? FIB.pencil : FIB.ink} strokeWidth={dashed ? 5 / s : 6 / s} strokeDasharray={dashed ? `${18 / s} ${12 / s}` : undefined} strokeLinejoin="round" />
  </g>
);

/** the Lower 48 west coast as a painted strip on the right of the chart (not a coordinate map). */
export const WestCoast: React.FC<{x?: number; y?: number; f: number}> = ({x = 0, y = 0}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M1100,960 L840,960 Q820,1000 836,1040 Q812,1090 826,1130 Q806,1190 822,1250 Q800,1320 826,1380 L1100,1380 Z" fill={FIB.land} stroke={FIB.ink} strokeWidth={7} strokeLinejoin="round" />
    <path d="M1100,1000 Q960,1010 900,1050 Q880,1130 905,1200 Q940,1300 1100,1330" fill={FIB.landD} opacity={0.25} />
    <text x={955} y={1000} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={FIB.ink} opacity={0.7}>WASHINGTON</text>
    <text x={955} y={1190} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={FIB.ink} opacity={0.7}>OREGON</text>
  </g>
);

export const Pin: React.FC<{x: number; y: number; f: number; p: number; label?: string}> = ({x, y, f, p, label}) => {
  if (p <= 0.01) return null;
  const k = Math.min(1, p);
  const pop = 1 + 0.25 * Math.sin(k * Math.PI);
  return (
    <g transform={`translate(${x} ${y}) scale(${pop * k})`}>
      <circle r={20 + 4 * Math.sin(f / 8)} fill="none" stroke={FIB.verm} strokeWidth={4} opacity={0.5} />
      <circle r={13} fill={FIB.verm} stroke={FIB.ink} strokeWidth={5} />
      <circle r={4} cx={-4} cy={-4} fill="#fff" opacity={0.7} />
      {label && <text x={-24} y={6} textAnchor="end" fontFamily={MONO} fontWeight={900} fontSize={20} fill={FIB.ink}>{label}</text>}
    </g>
  );
};

/** a brass tide gauge standing in the sea cutaway, painted with the ceiling line at the top and water at zero. */
export const Gauge: React.FC<{x: number; y: number; s?: number; f: number; label?: string; rise?: number; mark?: number}> = ({x, y, s = 1, f, label = 'UP TO $75 MILLION', rise = 1, mark = 0}) => {
  const w = label.length * 13.6 + 36;
  return (
    <g transform={`translate(${x} ${y + (1 - rise) * 500}) scale(${s})`} opacity={clamp01(rise * 3)}>
      <ellipse cx={0} cy={6} rx={110} ry={16} fill="#000" opacity={0.3} />
      <rect x={-30} y={-640} width={60} height={640} rx={12} fill={FIB.brass} stroke={FIB.ink} strokeWidth={8} />
      <rect x={-18} y={-628} width={14} height={616} rx={6} fill={FIB.brassL} opacity={0.7} />
      {Array.from({length: 17}).map((_, i) => <line key={i} x1={i % 4 === 0 ? 4 : 12} x2={30} y1={-20 - i * 36} y2={-20 - i * 36} stroke={FIB.ink} strokeWidth={i % 4 === 0 ? 5 : 3} />)}
      <line x1={-30} x2={30} y1={-640} y2={-640} stroke={FIB.ink} strokeWidth={4} />
      <g transform="translate(0 -690)">
        <rect x={-w / 2} y={-26} width={w} height={52} rx={6} fill={FIB.cream} stroke={FIB.ink} strokeWidth={6} />
        <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} letterSpacing={0.5} fill={FIB.ink}>{label}</text>
        <path d={`M${-w / 2},30 L${w / 2},30`} stroke={FIB.verm} strokeWidth={5} strokeDasharray="14 8" opacity={0.0 + mark} />
      </g>
      <text x={-44} y={-12} textAnchor="end" fontFamily={MONO} fontWeight={900} fontSize={20} fill={FIB.ink} opacity={0.8}>0</text>
    </g>
  );
};

/** a closed brass ship's chronometer with a vermilion tab. lid 0 closed .. 1 open (shows the face and the date). */
export const Chronometer: React.FC<{x: number; y: number; s?: number; f: number; lid?: number; text?: string; sub?: string}> = ({x, y, s = 1, f, lid = 0, text = 'DEC 31ST', sub = '2028'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={110} rx={150} ry={16} fill="#000" opacity={0.25} />
    <rect x={-130} y={-60} width={260} height={170} rx={14} fill={FIB.wood} stroke={FIB.ink} strokeWidth={8} />
    <rect x={-112} y={-44} width={224} height={138} rx={8} fill={FIB.woodD} opacity={0.5} />
    <circle cx={0} cy={26} r={58} fill={FIB.cream} stroke={FIB.brass} strokeWidth={10} opacity={lid} />
    <g opacity={lid}>
      <text x={0} y={18} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={FIB.verm}>{text}</text>
      <text x={0} y={46} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight={900} fontSize={30} fill={FIB.ink}>{sub}</text>
    </g>
    <g transform={`translate(-130 -60) rotate(${-lid * 112} 0 0)`}>
      <rect x={0} y={-30} width={260} height={30} rx={8} fill={FIB.wood} stroke={FIB.ink} strokeWidth={8} />
      <rect x={104} y={-26} width={52} height={22} rx={4} fill={FIB.brass} stroke={FIB.ink} strokeWidth={4} />
    </g>
    <path d="M110,-6 L152,14 L110,34 Z" fill={FIB.verm} stroke={FIB.ink} strokeWidth={5} />
    <circle cx={0} cy={-80 + 0 * f} r={0} fill={FIB.brass} />
  </g>
);
