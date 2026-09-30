import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer} from './lib/lighting';
import {VoiceProvider, useVoice} from './lib/voice';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {P, MONO, SERIF, clamp01, HandSil, AnswerCard, DateTag, LabelSheet, Binder} from './lib/stack';
import {blurAt, passAlpha, perspScale} from './lib/focus';

// THE ANSWER WAS ON TOP, 2026-09-30.
// Palette roles are art_direction.json (lib/stack.tsx P). Orange means ONE thing here, the wrong
// answer. Every string painted is a claims.json on_screen / on_screen_also string; all other
// prop text is drawn as unreadable glyph rules on purpose. Weaver is never drawn with a face.
const W = 1080, H = 1920;
type Beat = {id: number; at: number; label: string};

const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
/** anticipation, overshoot, settle. A linear scale-in is below the bar (4.6). */
const spring = (f: number, a: number, d = 20) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.pow(2, -9 * t) * Math.cos((t * d - 1.2) * 0.9);
};
const hash = (i: number) => Math.imul(i + 1013, 2654435761) >>> 0;

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

const plateW = (text: string, size: number, ls = 1.5) =>
  text.length * size * 0.602 + ls * Math.max(0, text.length - 1) + 56;

const Plate: React.FC<{text: string; x?: number; y: number; size?: number; tone?: 'dark' | 'paper' | 'peat'; p?: number}> =
({text, x = 540, y, size = 30, tone = 'dark', p = 1}) => {
  const w = plateW(text, size), h = size + 30;
  assertCropSafe(text, y - h / 2, y + h / 2);
  const fill = tone === 'paper' ? P.paper : tone === 'peat' ? P.peat : '#0F171C';
  const edge = tone === 'paper' ? P.peat : P.cream;
  const k = clamp01(p);
  if (k <= 0.01) return null;
  return (
    <g opacity={k} transform={`translate(${x} ${y}) scale(${0.94 + 0.06 * k})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 7} width={w} height={h} rx={7} fill={P.ink} opacity={0.5} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={7} fill={fill} stroke={edge} strokeWidth={3.5} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={700}
        fontSize={size} letterSpacing={1.5} fill={edge}>{text}</text>
    </g>
  );
};

/** Unreadable glyph rules: the house look for any prop text that is not a claims string. */
const Glyphs: React.FC<{x: number; y: number; w: number; lines: number; gap?: number; color?: string; opacity?: number; seed?: number; progress?: number}> =
({x, y, w, lines, gap = 26, color = P.slate, opacity = 0.34, seed = 0, progress = 1}) => (
  <g>
    {Array.from({length: lines}, (_, i) => {
      const k = clamp01(progress * lines - i);
      return <rect key={i} x={x} y={y + i * gap} width={w * (0.5 + (hash(i + seed) % 45) / 100) * k} height={9} rx={4.5} fill={color} opacity={opacity} />;
    })}
  </g>
);

const Dust: React.FC<{f: number; n?: number; color?: string; y0?: number; y1?: number; op?: number}> =
({f, n = 26, color = P.paper, y0 = 480, y1 = 1300, op = 0.22}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const h = hash(i * 7 + 3);
      const x = (h % 1080) + Math.sin(f / (50 + (h % 40)) + i) * 14;
      const y = y0 + ((h >>> 9) % (y1 - y0)) - ((f * (0.2 + ((h >>> 5) % 30) / 100)) % (y1 - y0));
      return <circle key={i} cx={x} cy={y < y0 ? y + (y1 - y0) : y} r={1.4 + ((h >>> 17) % 3) * 0.6} fill={color} opacity={op * (0.5 + ((h >>> 21) % 50) / 100)} />;
    })}
  </g>
);

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="slate" x1="0" y1="0" x2="0.1" y2="1">
      <stop stopColor={P.fogHi} /><stop offset="0.55" stopColor={P.fog} /><stop offset="1" stopColor={P.fogLo} />
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop stopColor="#56636C" /><stop offset="1" stopColor="#3E4A53" />
    </linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
      <stop stopColor="#3A2C22" /><stop offset="1" stopColor="#1E1712" />
    </linearGradient>
    <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
      <stop stopColor={P.lamp} stopOpacity={0.34} /><stop offset="1" stopColor={P.lamp} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.62" r="0.7">
      <stop stopColor="#8FB3C7" stopOpacity={0.55} /><stop offset="1" stopColor="#0A1216" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
      <stop stopColor="#8C979E" /><stop offset="1" stopColor="#5E6A72" />
    </linearGradient>
    <linearGradient id="cork" x1="0" y1="0" x2="0" y2="1">
      <stop stopColor="#9A927F" /><stop offset="1" stopColor="#7D7563" />
    </linearGradient>
    <filter id="soft6"><feGaussianBlur stdDeviation={6} /></filter>
    <filter id="soft3"><feGaussianBlur stdDeviation={3} /></filter>
  </defs>
);

/** The fog-lit slate surface a phone lies on (S1, S9, S15). */
const SlateSurface: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect width={W} height={H} fill="url(#slate)" />
    {Array.from({length: 5}, (_, i) => (
      <ellipse key={i} cx={((i * 300 + f * 0.35) % 1500) - 200} cy={620 + i * 150} rx={320 - i * 24} ry={46}
        fill={P.fogHi} opacity={0.22} />
    ))}
    {Array.from({length: 60}, (_, i) => {
      const h = hash(i + 9);
      return <circle key={i} cx={h % 1080} cy={(h >>> 8) % 1920} r={1.2 + (h % 3)} fill={P.paper4} opacity={0.18} />;
    })}
    {/* the table's own objects, so the fog is never the whole story: a notepad, a pen, a charging cable, a cup ring */}
    <g transform="translate(150,640) rotate(-8)">
      <rect x={-6} y={8} width={290} height={380} fill={P.ink} opacity={0.25} />
      <rect x={0} y={0} width={290} height={380} fill={P.paper} stroke={P.ink} strokeWidth={3} />
      <rect x={0} y={0} width={290} height={46} fill={P.slate} />
      <Glyphs x={26} y={84} w={230} lines={8} gap={34} seed={71} opacity={0.32} />
    </g>
    <g transform="translate(930,1230) rotate(58)">
      <rect x={-6} y={6} width={330} height={26} rx={13} fill={P.ink} opacity={0.25} />
      <rect x={0} y={0} width={330} height={26} rx={13} fill={P.peat} stroke={P.ink} strokeWidth={3} />
      <rect x={20} y={5} width={220} height={4} rx={2} fill={P.cream} opacity={0.5} />
    </g>
    <path d="M900,1400 C820,1300 760,1260 700,1180" fill="none" stroke={P.ink} strokeWidth={9} opacity={0.75} strokeLinecap="round" />
    <path d="M900,1400 C820,1300 760,1260 700,1180" fill="none" stroke={P.paper4} strokeWidth={2} opacity={0.5} strokeLinecap="round" />
    <circle cx={930} cy={560} r={92} fill="none" stroke={P.paper5} strokeWidth={9} opacity={0.32} />
    <circle cx={930} cy={560} r={86} fill="none" stroke={P.fogHi} strokeWidth={3} opacity={0.4} />
  </g>
);

/** A phone slab. Children are drawn inside the screen clip, in screen-local coordinates
 *  with (0,0) at the screen's top-left. */
const Phone: React.FC<{cx: number; cy: number; w?: number; h?: number; id: string; glow?: number; children?: React.ReactNode; tilt?: number}> =
({cx, cy, w = 500, h = 860, id, glow = 1, children, tilt = 0}) => (
  <g transform={`translate(${cx},${cy}) rotate(${tilt})`}>
    <ellipse cx={14} cy={h / 2 + 26} rx={w / 2 + 40} ry={30} fill={P.ink} opacity={0.35} />
    <rect x={-w / 2 - 14} y={-h / 2 - 14} width={w + 28} height={h + 28} rx={58} fill="#10171B" stroke={P.ink} strokeWidth={5} />
    <path d={`M${-w / 2 + 30},${-h / 2 - 10} H${w / 2 - 30}`} stroke={P.cream} strokeWidth={3} opacity={0.7} />
    <clipPath id={`scr${id}`}><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={44} /></clipPath>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={44} fill="#0A1216" />
    <g clipPath={`url(#scr${id})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="url(#glow)" opacity={glow} />
      <g transform={`translate(${-w / 2},${-h / 2})`}>{children}</g>
    </g>
  </g>
);

/** A thumb silhouette: tip at (x,y), extending down and to the right. */
const Thumb: React.FC<{x: number; y: number; rot?: number; dip?: number; op?: number}> = ({x, y, rot = -24, dip = 0, op = 1}) => (
  <g transform={`translate(${x},${y + dip}) rotate(${rot})`} opacity={op}>
    <g transform="translate(-4,-4)" opacity={0.85}><rect x={-62} y={-8} width={124} height={640} rx={62} fill={P.cream} /></g>
    <rect x={-62} y={-8} width={124} height={640} rx={62} fill={P.ink} />
    <ellipse cx={-14} cy={30} rx={20} ry={12} fill="#243038" opacity={0.7} />
  </g>
);

const Captions: React.FC<{cues: {t: number; d: number; text: string}[]}> = ({cues}) => {
  const t = useCurrentFrame() / 30;
  const c = cues.find((x) => t >= x.t && t < x.t + x.d);
  if (!c) return null;
  const words = c.text.split(' ');
  const rows: string[] = [];
  let row = '';
  for (const w of words) {
    if ((row + ' ' + w).trim().length > 34 && row) { rows.push(row); row = w; } else row = (row + ' ' + w).trim();
  }
  if (row) rows.push(row);
  // NEVER DROP A ROW: a caption that renders most of a sentence and drops the end is a false
  // statement on screen. The bar fits whatever it is handed.
  const fs = rows.length >= 4 ? 27 : rows.length === 3 ? 32 : 39;
  const step = rows.length >= 4 ? 30 : rows.length === 3 ? 37 : 49;
  const y0 = rows.length === 1 ? 1420 : rows.length === 2 ? 1390 : rows.length === 3 ? 1378 : 1366;
  return (
    <SVG>
      <rect x={68} y={1336} width={944} height={136} rx={16} fill="#0C1418" stroke={P.cream} strokeWidth={3} opacity={0.96} />
      {rows.map((s, i) => (
        <text key={i} x={540} y={y0 + i * step} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={fs} fill={P.cream}>{s}</text>
      ))}
    </SVG>
  );
};

const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]}> = ({n, from, dur, beats}) => {
  const f = useCurrentFrame();
  const voice = useVoice();
  const bAt = (id: number) => {
    const b = beats.find((x) => x.id === id);
    return b ? b.at * 30 - from : 0;
  };
  const q = (id: number, d = 24) => ease(f, bAt(id), d);
  const pop = (id: number, d = 18) => spring(f, bAt(id), d);
  const since = (id: number) => f - bAt(id);
  const push = interpolate(f, [0, dur], [1.0, 1.06], {extrapolateRight: 'clamp'});
  const drift = Math.sin(f / 71.3);
  const acc = voice.accentAt ? voice.accentAt(from + f) : 0;
  let picture: React.ReactNode = null;
  let zoom = push;

  if (n === 1) {
    // HOOK: an ordinary search, and a binder that does not belong in the frame.
    const typed = q(1, 44);
    const query = 'snipe season'.slice(0, Math.floor(typed * 12));
    const slam = pop(3, 14);
    const wob = f >= bAt(3) ? Math.sin((f - bAt(3)) / 2.6) * Math.exp(-(f - bAt(3)) / 16) * 3 : 0;
    const shim = ease(f, bAt(2), 48);
    const thumbDip = interpolate(since(1), [0, 6, 14], [0, 16, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const thumbIn = 1 - ease(f, 0, 16);
    const thumbOut = ease(f, bAt(3) - 30, 24);
    picture = (
      <SVG><Defs />
        <SlateSurface f={f} />
        <g transform={`translate(70,1010) rotate(-7)`}>
          <rect x={150} y={-44} width={130} height={80} fill={P.paper} stroke={P.ink} strokeWidth={3} transform="rotate(5)" />
          <Binder x={0} y={0} w={420} h={290} depth={44} showPage={false} />
          <path d="M-22,10 V276" stroke={P.cream} strokeWidth={3} opacity={0.75} />
        </g>
        <Phone cx={640} cy={960} id="s1" glow={0.8 + 0.2 * shim}>
          <rect x={30} y={70} width={440} height={78} rx={39} fill="#1B282F" stroke="#3C505B" strokeWidth={3} />
          <circle cx={72} cy={109} r={13} fill="none" stroke={P.paper4} strokeWidth={4} />
          <path d="M82,119 l12,12" stroke={P.paper4} strokeWidth={4} strokeLinecap="round" />
          <text x={110} y={120} fontFamily={MONO} fontWeight={700} fontSize={30} fill={P.cream}>{query}{f % 30 < 16 && typed < 1 ? '|' : ''}</text>
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={210 + i * 40} cy={230} r={8 + 3 * Math.sin(f / 5 + i * 1.3)} fill={P.paper3} opacity={0.5 * typed * (1 - slam)} />
          ))}
          <g transform={`translate(${-300 + 900 * shim},0) skewX(-18)`} opacity={0.35 * Math.sin(Math.PI * clamp01(shim))}>
            <rect x={0} y={150} width={90} height={620} fill={P.paper} />
          </g>
        </Phone>
        <AnswerCard x={640} y={985} w={420} land={slam} wobble={wob} />
        <Thumb x={780} y={780 + 520 * (thumbIn + thumbOut)} dip={thumbDip} />
        <Plate text="GOOGLED · SNIPE SEASON" y={470} size={34} p={ease(f, 4, 10)} />
        <Dust f={f} />
      </SVG>
    );
    zoom = 1 + 0.05 * push;
  } else if (n === 2) {
    // THREE SNIPE STOP MID-LIFT AND DROP OUT AS PAPER-WHITE TICKS LAND. The card's rectangle
    // dissolves into the fog band in the first frames, so the cut is a graphic match.
    const dis = ease(f, 0, 16);
    const tickAt = [0, 22, 46];
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="url(#slate)" />
        <path d={`M-40,900 ${Array.from({length: 24}, (_, i) => `L${i * 48},${820 - Math.abs(Math.sin(i * 1.9)) * 120 - (i % 3) * 22}`).join(' ')} L1120,900 Z`}
          fill={P.fogLo} opacity={0.55} transform={`translate(${-drift * 20},0)`} />
        {Array.from({length: 4}, (_, i) => (
          <rect key={i} x={-200 + ((f * (0.5 + i * 0.2) + i * 340) % 1500)} y={700 + i * 96} width={620} height={54} rx={27} fill={P.fogHi} opacity={0.35} />
        ))}
        <rect x={0} y={900} width={W} height={1020} fill="url(#ground)" opacity={0.0} />
        <rect x={0} y={880} width={W} height={1040} fill="#6F7C6C" />
        <rect x={0} y={880} width={W} height={1040} fill="url(#slate)" opacity={0.28} />
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={`pool${i}`} cx={180 + i * 260 + (hash(i) % 60)} cy={1240 + (i % 2) * 130} rx={130 + (hash(i + 4) % 50)} ry={28} fill={P.fogHi} opacity={0.55} />
        ))}
        {Array.from({length: 150}, (_, i) => {
          const h = hash(i + 41);
          const x = (h % 1180) - 50 + Math.sin(f / 40 + i) * 3, y = 930 + ((h >>> 9) % 700);
          const lean = ((h >>> 3) % 30) - 15;
          return <path key={i} d={`M${x},${y} q${lean * 0.4},-30 ${lean},-64`} stroke={P.lichenLo} strokeWidth={4 + (h % 3)} fill="none" strokeLinecap="round" opacity={0.7} />;
        })}
        {[0, 1, 2].map((i) => {
          const t = clamp01((f - bAt(4) - tickAt[i]) / 44);
          const bx = 260 + i * 250 + t * 120, by = 1040 - t * 330 + i * 24;
          const gone = clamp01((t - 0.55) / 0.3);
          const tk = clamp01((f - bAt(4) - tickAt[i] - 10) / 16);
          return (
            <g key={i}>
              <g transform={`translate(${bx},${by}) rotate(${-24 + t * 10}) scale(1.7)`} opacity={1 - gone}>
                <ellipse cx={0} cy={0} rx={34} ry={13} fill={P.ink} />
                <path d="M32,-2 l52,-16" stroke={P.ink} strokeWidth={5} strokeLinecap="round" />
                <path d="M-6,-8 q-22,-40 -58,-46 q22,18 26,44 z" fill={P.ink} />
                <path d="M-6,-8 q-22,-40 -58,-46" stroke={P.cream} strokeWidth={2} fill="none" opacity={0.8} />
              </g>
              <g transform={`translate(${300 + i * 240 + 60},${1080 + i * 30 + 130 * (1 - tk)}) rotate(${(1 - tk) * 40})`} opacity={clamp01(tk * 3)}>
                <rect x={-20} y={-9} width={40} height={18} rx={3} fill={P.paper} stroke={P.ink} strokeWidth={2} />
              </g>
            </g>
          );
        })}
        <g opacity={1 - dis}>
          <rect x={540 - 210} y={900 - 110} width={420} height={220} rx={16} fill={P.orange} transform={`scale(${1 + dis * 1.8},${1 - dis * 0.8}) translate(0,0)`} style={{transformOrigin: '540px 900px'}} />
        </g>
        <Plate text="SEPT 5 · 3 SNIPE" y={520} size={32} p={ease(f, bAt(4) + 18, 14)} />
        <Dust f={f} color={P.paper} />
      </SVG>
    );
    zoom = 1.12 - 0.08 * ease(f, 0, 40) + 0.03 * (f / dur);
  } else if (n === 3) {
    // HER TABLE, OVERHEAD. The page stays turned away in shadow, nothing printed on it.
    const open = ease(f, bAt(5) + 8, 34);
    const pull = ease(f, bAt(6), 20);
    const raise = ease(f, bAt(7), 26);
    const slide = ease(f, bAt(8), 34);
    const ring = clamp01(since(7) / 60);
    const phoneX = 250 + 40 * pull + 230 * raise + 700 * slide;
    const phoneY = 640 - 40 * pull - 130 * raise;
    const phoneS = 1 + 0.35 * raise;
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="url(#wood)" />
        {Array.from({length: 30}, (_, i) => (
          <path key={i} d={`M-20,${i * 66 + (hash(i) % 20)} Q540,${i * 66 + 14 + (hash(i + 3) % 24)} 1100,${i * 66 + (hash(i + 5) % 20)}`}
            stroke="#150F0B" strokeWidth={2} fill="none" opacity={0.5} />
        ))}
        <ellipse cx={830} cy={760} rx={560} ry={640} fill="url(#lamp)" opacity={1.0} />
        {/* binder from above: cover swings about the spine on its left */}
        <g transform="translate(300,590)">
          <rect x={-6} y={8} width={560} height={690} fill={P.ink} opacity={0.5} />
          <rect x={0} y={0} width={540} height={680} fill={P.paper2} stroke={P.ink} strokeWidth={4} />
          <rect x={0} y={0} width={540} height={680} fill={P.ink} opacity={0.62 * open} />
          <g filter="url(#soft6)" opacity={0.6 * open}>
            <rect x={40} y={50} width={460} height={580} fill={P.paper3} />
            <path d="M40,330 L500,120 V240 L40,470 Z" fill={P.lamp} opacity={0.22} />
          </g>
          <path d={`M540,0 L${540 - 40 * open},${10} L${540 - 40 * open},${670} L540,680 Z`} fill={P.paper4} opacity={0.6} />
          <rect x={0} y={0} width={540} height={680} rx={8} fill="none" />
          <g transform={`scale(${Math.cos(open * Math.PI * 0.94)},1)`}>
            <rect x={0} y={0} width={540} height={680} rx={10} fill={open > 0.5 ? P.peatHi : P.peat} stroke={P.ink} strokeWidth={5} />
            {open < 0.5 && <rect x={44} y={40} width={452} height={600} rx={6} fill="none" stroke={P.peatHi} strokeWidth={4} />}
          </g>
          <rect x={-24} y={-4} width={46} height={688} rx={20} fill={P.peatLo} stroke={P.ink} strokeWidth={5} />
          <path d="M-12,14 V666" stroke={P.cream} strokeWidth={2.5} opacity={0.55} />
        </g>
        {/* the tag, creased on the table beside the phone, and its torn corner staying behind */}
        <g transform={`translate(${190 + 1000 * slide},${880}) rotate(-8)`}>
          <DateTag x={0} y={0} s={0.9} text="" crease={ease(f, bAt(5) + 10, 24)} tear={ease(f, bAt(8), 20)} />
        </g>
        {slide > 0.15 && <path d="M170,915 l40,-4 l-6,30 z" fill={P.orange} stroke={P.orangeLo} strokeWidth={3} />}
        {/* the phone */}
        <g transform={`translate(${phoneX},${phoneY}) scale(${phoneS}) rotate(${-10 * raise})`}>
          <rect x={-86} y={-152} width={172} height={304} rx={26} fill="#10171B" stroke={P.ink} strokeWidth={4} />
          <rect x={-74} y={-140} width={148} height={280} rx={18} fill="#7FA4B8" opacity={0.85 * (1 - 0.7 * pull)} />
        </g>
        {raise > 0.2 && [0, 1, 2].map((i) => (
          <path key={i} d={`M${phoneX + 120 + i * 34},${phoneY - 70 - i * 6} q${26},${70 + i * 6} 0,${140 + i * 12}`} fill="none" stroke={P.cream}
            strokeWidth={4} opacity={0.5 * (1 - ((ring * 3 + i * 0.3) % 1))} />
        ))}
        {/* her hands, silhouettes, no face */}
        <HandSil x={430 - 110 * open + 40 * pull} y={1600 - 470 * ease(f, bAt(5) - 6, 24) + 260 * ease(f, bAt(6) + 6, 18)} rot={-8} s={1.05} curl={0.3 * open} />
        <HandSil x={840 - 330 * raise + 600 * slide} y={1640 - 380 * ease(f, bAt(6) - 4, 22) - 100 * raise + 300 * slide} rot={14} s={1.0} flip curl={0.2 + 0.4 * raise} />
        <Plate text="SHE CALLED TROOPERS" y={1250} size={30} p={ease(f, bAt(7) + 8, 12)} />
        <Dust f={f} color={P.lamp} op={0.28} />
      </SVG>
    );
    zoom = 1 + 0.06 * (f / dur);
  } else if (n === 4) {
    // THE TROOPER'S REPORT. The dates disagree, and the binder edges in between them.
    const sweep = ease(f, bAt(9), 40);
    const drop = pop(10, 16);
    const clash = ease(f, bAt(11), 28);
    const binderIn = ease(f, bAt(11) + 20, 40);
    const sheetX = 540 - 210 * clash;
    const dayX = (d: number) => -290 + (d / 37) * 580;
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="url(#steel)" />
        {Array.from({length: 60}, (_, i) => <path key={i} d={`M0,${i * 34}H1080`} stroke={P.paper5} strokeWidth={1.4} opacity={0.22} />)}
        <g transform={`translate(${sheetX},880) rotate(${-1.5 - 1.5 * clash}) scale(${1 - 0.12 * clash})`}>
          <rect x={-346} y={-486} width={700} height={980} fill={P.ink} opacity={0.3} />
          <rect x={-350} y={-490} width={700} height={980} fill={P.paper} stroke={P.ink} strokeWidth={4} />
          <rect x={-320} y={-450} width={400} height={26} rx={8} fill={P.peat} opacity={0.85} />
          <Glyphs x={-320} y={-390} w={620} lines={5} gap={30} seed={2} />
          {/* the calendar strip */}
          <g transform="translate(0,-40)">
            <rect x={-310} y={-8} width={620} height={16} fill={P.paper3} stroke={P.ink} strokeWidth={2} />
            {Array.from({length: 38}, (_, d) => (
              <path key={d} d={`M${dayX(d)},${d % 7 === 0 ? -36 : -22} V${d % 7 === 0 ? 36 : 22}`} stroke={P.slate} strokeWidth={d % 7 === 0 ? 3 : 2} opacity={0.6} />
            ))}
            <text x={dayX(0)} y={-52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={P.slate}>SEPT</text>
            <text x={dayX(31)} y={-52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={P.slate}>OCT</text>
            <rect x={dayX(0) - 14} y={-12} width={28} height={24} rx={4} fill={P.orange} stroke={P.orangeLo} strokeWidth={3} opacity={1 - 0.6 * sweep} />
            {/* the caliper sweeps from SEPT 1 to OCT 8 and locks */}
            <path d={`M${dayX(0)},-70 V70 M${dayX(0) + (dayX(37) - dayX(0)) * sweep},-70 V70 M${dayX(0)},0 H${dayX(0) + (dayX(37) - dayX(0)) * sweep}`}
              stroke={P.peat} strokeWidth={6} fill="none" opacity={0.85} />
            <g transform={`translate(${dayX(37)},${-190 * (1 - drop)})`} opacity={clamp01(drop * 3)}>
              <rect x={-16} y={-24} width={32} height={56} rx={5} fill={P.peat} stroke={P.ink} strokeWidth={3} />
              <path d="M-16,-24 h32" stroke={P.cream} strokeWidth={2} />
            </g>
            {drop > 0.3 && <path d={`M${dayX(37) + 40},46 l42,-6 l-6,32 z`} fill={P.orange} stroke={P.orangeLo} strokeWidth={3} />}
          </g>
          <Glyphs x={-320} y={130} w={600} lines={6} gap={30} seed={8} />
        </g>
        <g opacity={clash}>
          <AnswerCard x={800} y={900} w={360} land={clash} small={false} rot={3} />
        </g>
        <g transform={`translate(${540 + 40 * (1 - binderIn)},${1500 - 250 * binderIn})`} opacity={binderIn}>
          <Binder x={-120} y={0} w={260} h={300} depth={30} showPage={false} />
        </g>
        <g transform="translate(920,540)">
          <circle r={64} fill={P.paper} stroke={P.ink} strokeWidth={5} />
          {Array.from({length: 12}, (_, i) => <path key={i} d={`M0,-54 v8`} transform={`rotate(${i * 30})`} stroke={P.ink} strokeWidth={3} />)}
          <path d="M0,0 V-46" stroke={P.ink} strokeWidth={4} strokeLinecap="round" transform={`rotate(${(f / 30) * 6})`} />
        </g>
        <Plate text="GENERAL SEASON · OCT 8" y={1200} size={30} tone="paper" p={sweep > 0.85 ? 1 : 0} x={300} />
        <Plate text="SEASON BEGAN SEPT 1" x={800} y={1200} size={26} p={clash} />
        <Dust f={f} color={P.paper} op={0.18} />
      </SVG>
    );
  } else if (n === 5) {
    // TWO PHONES, ONE ANSWER. The hunter's replay on the left, the trooper's cab on the right.
    const tap = ease(f, bAt(12), 12);
    const c1 = spring(f, bAt(12) + 14, 14);
    const c2 = spring(f, bAt(13), 12);
    const qm = spring(f, bAt(14), 20);
    const one = ease(f, bAt(14) + 12, 40);
    const both = f >= bAt(13) ? Math.sin((f - bAt(13)) / 2.4) * Math.exp(-(f - bAt(13)) / 16) * 3 : 0;
    zoom = 1.16 - 0.16 * one;
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="url(#slate)" />
        <rect x={540} y={0} width={540} height={H} fill="#12181C" />
        <rect x={540} y={0} width={540} height={H} fill="url(#slate)" opacity={0.35 * one} />
        {/* left: the hunter's phone, card already down, torn corner */}
        <Phone cx={270} cy={880} w={380} h={700} id="s5a" glow={0.8}>
          <rect x={20} y={54} width={340} height={64} rx={32} fill="#1B282F" stroke="#3C505B" strokeWidth={3} />
        </Phone>
        <AnswerCard x={270} y={900} w={310} land={1} wobble={both} text={['SEASON BEGAN', 'SEPT 1']} small />
        <path d="M400,1150 l38,-6 l-6,30 z" fill={P.orange} stroke={P.orangeLo} strokeWidth={3} />
        {/* right: the cab, a dash edge, a wheel arc, the trooper's hands */}
        <path d="M540,1180 Q800,1090 1080,1150 V1920 H540 Z" fill="#0B1013" />
        <path d="M600,1420 A360,360 0 0 1 1080,1300" fill="none" stroke="#1C262C" strokeWidth={54} />
        <path d="M600,1420 A360,360 0 0 1 1080,1300" fill="none" stroke={P.cream} strokeWidth={3} opacity={0.4} />
        {Array.from({length: 3}, (_, i) => (
          <path key={i} d={`M${560 + i * 30},700 Q${800},${560 + i * 24 + 30 * Math.sin(f / 40)} 1080,${700 - i * 20}`} stroke={P.fogHi} strokeWidth={2} fill="none" opacity={0.18} />
        ))}
        <g opacity={0.5}><path d={`M600,300 A480,480 0 0 1 ${600 + 440 * Math.sin((f / 45) % Math.PI)},${300 + 60}`} stroke={P.paper4} strokeWidth={4} fill="none" /></g>
        <Phone cx={810} cy={860} w={380} h={700} id="s5b" glow={0.8}>
          <rect x={20} y={54} width={340} height={64} rx={32} fill="#1B282F" stroke="#3C505B" strokeWidth={3} />
          <text x={72} y={96} fontFamily={MONO} fontWeight={700} fontSize={26} fill={P.cream}>{'snipe season'.slice(0, Math.floor(ease(f, 4, 30) * 12))}</text>
        </Phone>
        <AnswerCard x={810} y={880} w={310} land={c1} wobble={both} text={['SEASON BEGAN', 'SEPT 1']} small />
        <HandSil x={950} y={1700 - 380 * ease(f, 0, 22) + 34 * tap} rot={10} s={0.9} flip curl={0.4} />
        <HandSil x={640} y={1740 - 330 * ease(f, 6, 22)} rot={-6} s={0.85} curl={0.2} />
        <rect x={536} y={0} width={8} height={H} fill={P.cream} opacity={0.5 * (1 - one)} />
        <text x={540} y={840 + 50 * (1 - qm)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={240}
          fill={P.cream} stroke={P.ink} strokeWidth={14} paintOrder="stroke" opacity={clamp01(qm * 2)}>?</text>
        <Plate text="SAME SEARCH · SAME ANSWER" y={470} size={30} p={ease(f, bAt(13), 10)} />
        <Dust f={f} color={P.paper} op={0.16} />
      </SVG>
    );
  } else if (n === 6) {
    // THE COUNTER. The stamp is the event, and its lift becomes the window frame rising.
    const slamAt = Math.max(14, bAt(15) + 12);
    const slam = spring(f, slamAt, 12);
    const stampY = interpolate(f, [0, slamAt - 8, slamAt + 2], [420, 470, 830], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: Easing.in(Easing.quad)});
    const lift = ease(f, bAt(16), 30);
    const ink = ease(f, slamAt + 2, 40);
    const rise = ease(f, bAt(16) + 24, 40);
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="#6E777D" />
        {Array.from({length: 40}, (_, i) => <path key={i} d={`M0,${i * 50}H1080`} stroke={P.paper5} strokeWidth={1.3} opacity={0.2} />)}
        <g transform="translate(900,1120)"><rect x={-110} y={-40} width={200} height={110} rx={14} fill={P.ink} stroke={P.cream} strokeWidth={2} opacity={0.9} /><rect x={-92} y={-24} width={164} height={72} rx={8} fill="#22303A" /></g>
        <g transform="translate(540,900) rotate(-2)">
          <rect x={-190} y={-380} width={390} height={780} fill={P.ink} opacity={0.3} />
          <rect x={-195} y={-385} width={390} height={780} fill={P.paper} stroke={P.ink} strokeWidth={3} />
          <Glyphs x={-160} y={-330} w={310} lines={8} gap={34} seed={5} />
          <g opacity={ink} transform="translate(0,150)">
            <rect x={-180} y={-32} width={360} height={64} fill="none" stroke={P.peat} strokeWidth={6} opacity={1} />
            <path d="M-140,-8 H140 M-140,14 H70" stroke={P.peat} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
          </g>
        </g>
        <path d="M345,1310 l60,-8 l-8,44 z" fill={P.orange} stroke={P.orangeLo} strokeWidth={3} />
        <ellipse cx={540} cy={1058} rx={210 * slam} ry={26 * slam} fill={P.ink} opacity={0.4 * slam * (1 - lift)} />
        <g transform={`translate(540,${stampY - 720 * lift}) `}>
          <circle cx={0} cy={-250} r={46} fill={P.peat} stroke={P.ink} strokeWidth={4} />
          <rect x={-34} y={-250} width={68} height={210} rx={24} fill={P.peatHi} stroke={P.ink} strokeWidth={4} />
          <path d="M-22,-240 V-50" stroke={P.cream} strokeWidth={3} opacity={0.5} />
          <rect x={-170} y={-40} width={340} height={82} rx={12} fill={P.peat} stroke={P.ink} strokeWidth={4} />
          <rect x={-170} y={20} width={340} height={22} rx={8} fill={P.ink} />
          <path d="M-160,-34 H160" stroke={P.cream} strokeWidth={3} opacity={0.6} />
        </g>
        <g opacity={rise}>
          <path d={`M0,${1500 - 420 * rise} H1080 V1920 H0 Z`} fill={P.peat} />
          <path d={`M0,${1500 - 420 * rise} H1080`} stroke={P.cream} strokeWidth={4} opacity={0.6} />
        </g>
        <Plate text="NO CONTEST · $150 FINE" y={520} size={32} tone="paper" p={ease(f, slamAt + 4, 10)} />
        <Dust f={f} color={P.paper} op={0.14} />
      </SVG>
    );
  } else if (n === 7) {
    // A FOGGED WINDOW. She is upright, in profile, and had already made the call.
    const breathe = 0.5 + 0.5 * Math.sin(f / 26);
    const plateY = 560 + 170 * ease(f, bAt(17), 40);
    const down = ease(f, bAt(18), 22);
    const face = ease(f, bAt(18) + 8, 16);
    zoom = 1 + 0.07 * (f / dur);
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="#1B252C" />
        <rect x={150} y={380} width={780} height={960} fill={P.fogLo} />
        <rect x={150} y={380} width={780} height={960} fill="url(#slate)" opacity={0.55} />
        <path d="M150,1000 Q400,900 930,1010 V1340 H150 Z" fill="#33424C" opacity={0.7} />
        {/* the silhouette: unbowed, in profile, facing the light */}
        <g transform="translate(420,1000)">
          <path d="M-190,340 Q-180,120 -70,70 L-30,50 Q-42,20 -44,-20 Q-70,-24 -74,-46 Q-96,-140 0,-176 Q92,-170 96,-92 Q112,-72 118,-56 L96,-40 Q100,-22 92,0 Q84,30 62,46 L70,90 Q210,110 250,340 Z" fill={P.ink} />
          <path d="M96,-92 Q112,-72 118,-56 L96,-40 Q100,-22 92,0 Q84,30 62,46" fill="none" stroke={P.cream} strokeWidth={4} opacity={0.75} />
          <path d="M-190,340 Q-180,120 -70,70 L-30,50 M62,46 L70,90 Q210,110 250,340" fill="none" stroke={P.cream} strokeWidth={5} opacity={0.6} />
        </g>
        <ellipse cx={540 + 6 * breathe} cy={960} rx={70 + 30 * breathe} ry={44 + 16 * breathe} fill={P.paper} opacity={0.14 + 0.1 * breathe} />
        <rect x={150} y={380} width={780} height={960} fill={P.paper} opacity={0.34} />
        {Array.from({length: 18}, (_, i) => {
          const h = hash(i + 61);
          const x = 190 + (h % 700), y0 = 420 + ((h >>> 8) % 500);
          const len = 60 + ((h >>> 3) % 240) * clamp01((f - i * 4) / 90);
          return <path key={i} d={`M${x},${y0} v${len}`} stroke={P.paper} strokeWidth={3} opacity={0.24} strokeLinecap="round" />;
        })}
        <rect x={130} y={360} width={820} height={40} fill={P.peat} stroke={P.ink} strokeWidth={4} />
        <rect x={130} y={1320} width={820} height={40} fill={P.peat} stroke={P.ink} strokeWidth={4} />
        <rect x={130} y={360} width={40} height={1000} fill={P.peat} stroke={P.ink} strokeWidth={4} />
        <rect x={910} y={360} width={40} height={1000} fill={P.peat} stroke={P.ink} strokeWidth={4} />
        <rect x={60} y={1284} width={960} height={64} fill={P.peatHi} stroke={P.ink} strokeWidth={4} />
        <g transform="translate(300,1276)">
          <rect x={-90} y={-70} width={190} height={110} fill={P.paper} stroke={P.ink} strokeWidth={3} transform="rotate(-3)" />
          <Glyphs x={-70} y={-48} w={150} lines={4} gap={22} seed={3} />
        </g>
        <DateTag x={120} y={1252} s={0.5} rot={-12} crease={1} fade={1} />
        <g transform={`translate(${700},${1262})`}>
          <rect x={-56} y={-104} width={112} height={196} rx={16} fill="#10171B" stroke={P.ink} strokeWidth={3} transform={`rotate(${-8 * (1 - down)}) scale(1,${1 - 0.9 * down + 0.02})`} style={{transformOrigin: '0px 0px'}} />
          <rect x={-46} y={-94} width={92} height={176} rx={10} fill="#7FA4B8" opacity={0.85 * (1 - face)} transform={`scale(1,${1 - 0.9 * down + 0.02})`} />
        </g>
        <HandSil x={880 - 170 * ease(f, bAt(18) - 24, 26) + 120 * ease(f, bAt(18) + 14, 20)} y={1500 - 200 * ease(f, bAt(18) - 24, 26) + 100 * ease(f, bAt(18) + 14, 20)} rot={22} s={0.7} flip curl={0.3} />
        <Plate text={'"I FEEL TERRIBLE"'} y={plateY} size={34} p={ease(f, bAt(17), 14)} />
        <Dust f={f} color={P.paper} op={0.2} />
      </SVG>
    );
  } else if (n === 8) {
    // THE PUBLIC SAFETY WALL. The camera pulls back from one card to the whole board.
    const pin1 = pop(19, 12);
    const back = ease(f, bAt(20) - 4, 60);
    const pin2 = pop(21, 12);
    zoom = 1.42 - 0.42 * back;
    const blanks = [[170, 640], [150, 900], [170, 1170], [930, 660], [940, 930], [930, 1200]];
    const Pin: React.FC<{x: number; y: number; k?: number}> = ({x, y, k = 1}) => (
      <g transform={`translate(${x},${y - 30 * (1 - k)})`} opacity={clamp01(k * 3)}>
        <ellipse cx={5} cy={7} rx={11} ry={5} fill={P.ink} opacity={0.4} />
        <circle r={11} fill={P.peat} stroke={P.ink} strokeWidth={3} />
        <circle cx={-3} cy={-3} r={3.5} fill={P.cream} opacity={0.8} />
      </g>
    );
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="url(#cork)" />
        {Array.from({length: 240}, (_, i) => {
          const h = hash(i + 77);
          return <circle key={i} cx={h % 1080} cy={(h >>> 8) % 1920} r={2 + (h % 4)} fill={h % 2 ? '#B9B29E' : '#655E4E'} opacity={0.32} />;
        })}
        <rect x={0} y={0} width={W} height={H} fill={P.paper} opacity={0.06 + 0.04 * Math.sin(f / 3.1)} />
        <rect x={0} y={460} width={W} height={10} fill={P.paper} opacity={0.5} filter="url(#soft6)" />
        <g transform={`translate(540,760) rotate(${-2 + 1.6 * Math.sin(since(19) / 5) * Math.exp(-Math.max(0, since(19)) / 20)})`}>
          <rect x={-272} y={-118} width={560} height={270} fill={P.ink} opacity={0.32} />
          <rect x={-280} y={-130} width={560} height={270} fill={P.paper} stroke={P.ink} strokeWidth={3} />
          <text x={0} y={-36} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={38} fill={P.peat}>"THE FIRST TIME I THINK</text>
          <text x={0} y={30} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={38} fill={P.peat}>WE HAVE SEEN AI CITED"</text>
          <Pin x={0} y={-120} k={pin1} />
        </g>
        <g transform={`translate(540,${1110}) rotate(${3})`} opacity={clamp01(pin2 * 2)}>
          <rect x={-252} y={-100} width={520} height={230} fill={P.ink} opacity={0.3} />
          <rect x={-260} y={-112} width={520} height={230} fill={P.paper} stroke={P.ink} strokeWidth={3} />
          <text x={0} y={-22} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={42} fill={P.peat}>"I EXPECT WE'LL SEE</text>
          <text x={0} y={36} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={42} fill={P.peat}>MORE OF THIS"</text>
          <Pin x={0} y={-104} k={pin2} />
        </g>
        {blanks.map(([bx, by], i) => {
          const k = spring(f, bAt(21) + 14 + i * 7, 12);
          return (
            <g key={i} transform={`translate(${bx},${by}) rotate(${(i % 2 ? 4 : -3)})`} opacity={clamp01(k * 3)}>
              <rect x={-96} y={-70} width={200} height={150} fill={P.ink} opacity={0.3} />
              <rect x={-100} y={-76} width={200} height={150} fill={P.paper} stroke={P.ink} strokeWidth={3} />
              <Glyphs x={-78} y={-46} w={150} lines={3} gap={26} seed={i} />
              <Pin x={0} y={-70} k={k} />
            </g>
          );
        })}
        <g transform="translate(150,520)"><DateTag x={0} y={0} s={0.55} rot={-6} crease={0.6} fade={0.6} /></g>
        <Pin x={860} y={560} k={pop(20, 14)} />
        <Plate text="AUSTIN McDANIEL · PUBLIC SAFETY SPOKESMAN" y={960} size={20} tone="paper" p={ease(f, bAt(19) + 10, 12)} />
        <Dust f={f} color={P.paper} op={0.16} />
      </SVG>
    );
  } else if (n === 9) {
    // GOOGLE'S OWN HELP PAGE, a new tab, clearly not the results page.
    const swipe = ease(f, bAt(22), 22);
    const scroll = ease(f, bAt(23), 40);
    const hl = ease(f, bAt(23) + 12, 34);
    const s1 = spring(f, bAt(24), 22);
    const s2 = spring(f, bAt(25), 22);
    const wob = (k: number, ph: number) => Math.sin(f / 9 + ph) * 3 * k;
    picture = (
      <SVG><Defs />
        <SlateSurface f={f} />
        <Phone cx={540} cy={880} w={560} h={880} id="s9" glow={0.7}>
          <g transform={`translate(${-560 * swipe},0)`}>
            <rect x={30} y={60} width={500} height={70} rx={35} fill="#1B282F" stroke="#3C505B" strokeWidth={3} />
            <Glyphs x={40} y={190} w={470} lines={3} gap={34} color={P.paper4} opacity={0.5} seed={11} />
            <rect x={30} y={320} width={500} height={280} rx={16} fill={P.paper} />
            <AnswerCard x={280} y={470} w={300} land={1} small text={['SEASON BEGAN', 'SEPT 1']} />
            <Glyphs x={40} y={650} w={470} lines={6} gap={34} color={P.paper4} opacity={0.4} seed={13} />
          </g>
          <g transform={`translate(${560 * (1 - swipe)},${-140 * scroll})`}>
            <rect x={0} y={0} width={560} height={1100} fill={P.paper} />
            <rect x={0} y={0} width={560} height={110} fill={P.slate} />
            <Glyphs x={30} y={44} w={300} lines={2} gap={22} color={P.paper} opacity={0.8} seed={4} />
            <Glyphs x={30} y={170} w={500} lines={4} gap={30} seed={6} />
            <rect x={22} y={352} width={516 * hl} height={52} fill="#B8C7B0" opacity={0.9} />
            <text x={30} y={388} fontFamily={MONO} fontWeight={800} fontSize={21} letterSpacing={0.5} fill={P.peat}>AI RESPONSES MAY INCLUDE MISTAKES</text>
            <Glyphs x={30} y={450} w={500} lines={8} gap={30} seed={9} />
          </g>
        </Phone>
        <g transform={`translate(0,${-280 * (1 - s1)})`} opacity={clamp01(s1 * 2)}>
          <LabelSheet x={540} y={600} w={700} h={130} rot={-3 + wob(1, 0)} lines={0} label="AI RESPONSES MAY INCLUDE MISTAKES" />
        </g>
        <g transform={`translate(0,${-260 * (1 - s2)})`} opacity={clamp01(s2 * 2)}>
          <LabelSheet x={540} y={760} w={600} h={130} rot={2 + wob(1, 2)} lines={0} label="CHECK MORE THAN ONE PLACE" />
        </g>
        <DateTag x={380} y={1240} s={0.5} rot={-10} crease={1} fade={1} />
        <Dust f={f} color={P.paper} op={0.2} />
      </SVG>
    );
  } else if (n === 10) {
    // A NEWSROOM DESK. The email is sent and delivered, and no reply arrives.
    const send = ease(f, bAt(26), 22);
    const tickK = spring(f, bAt(26) + 30, 14);
    const cross = ease(f, bAt(27) - 30, 60);
    const flick = 0.05 * Math.sin(f / 2.3);
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="#7C878E" />
        <rect x={0} y={0} width={W} height={H} fill={P.paper} opacity={0.08 + flick} />
        <g transform="translate(540,600)">
          <circle r={130} fill={P.paper} stroke={P.ink} strokeWidth={7} />
          {Array.from({length: 12}, (_, i) => <path key={i} d="M0,-112 v18" transform={`rotate(${i * 30})`} stroke={P.ink} strokeWidth={5} />)}
          <path d="M0,0 V-84" stroke={P.ink} strokeWidth={8} strokeLinecap="round" transform={`rotate(${30 + 40 * cross})`} />
          <path d="M0,0 V-104" stroke={P.orangeLo} strokeWidth={0} transform={`rotate(${(f * 6) % 360})`} />
          <path d="M0,0 V-104" stroke={P.slate} strokeWidth={3} strokeLinecap="round" transform={`rotate(${(f * 4) % 360})`} />
        </g>
        <rect x={0} y={1290} width={W} height={630} fill="#4F5A61" />
        <g transform="translate(540,1000)">
          <rect x={-400} y={-250} width={800} height={500} rx={26} fill="#10171B" stroke={P.ink} strokeWidth={6} />
          <rect x={-376} y={-226} width={752} height={452} rx={10} fill={P.paper} />
          <rect x={-376} y={-226} width={752} height={60} fill={P.slate} />
          <Glyphs x={-350} y={-208} w={200} lines={1} color={P.paper} opacity={0.8} />
          <Glyphs x={-350} y={-120} w={180} lines={6} gap={40} seed={20} />
          <g transform={`translate(${-40 + 440 * (1 - send)},-110)`} opacity={clamp01(send * 3)}>
            <rect x={0} y={0} width={380} height={70} rx={8} fill={P.paper2} stroke={P.slate} strokeWidth={3} />
            <Glyphs x={16} y={24} w={230} lines={2} gap={20} seed={22} />
            <g transform={`translate(340,36) scale(${tickK})`}><path d="M-16,0 l10,12 l22,-26" stroke={P.lichenLo} strokeWidth={7} fill="none" strokeLinecap="round" /></g>
          </g>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={-40} y={-20 + i * 84} width={380} height={70} rx={8} fill="none" stroke={P.paper4} strokeWidth={3} strokeDasharray="10 8" opacity={0.7} />
          ))}
        </g>
        <path d="M120,1310 H960" stroke={P.paper5} strokeWidth={4} opacity={0.5} />
        <Plate text="GOOGLE DID NOT RESPOND" y={1234} size={32} p={ease(f, bAt(26) + 26, 12)} />
        <Dust f={f} color={P.paper} op={0.14} />
      </SVG>
    );
  } else if (n === 11) {
    // THE KITCHEN TABLE AGAIN, a laptop, and ADF&G's page. The tag rides the bezel unlit.
    const lid = ease(f, bAt(28), 26);
    const tab = ease(f, bAt(29), 20);
    const fold = ease(f, bAt(30), 26);
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="url(#wood)" />
        {Array.from({length: 30}, (_, i) => <path key={i} d={`M-20,${i * 66 + (hash(i) % 20)} Q540,${i * 66 + 14} 1100,${i * 66 + (hash(i + 5) % 20)}`} stroke="#150F0B" strokeWidth={2} fill="none" opacity={0.5} />)}
        <ellipse cx={830} cy={860} rx={520} ry={600} fill="url(#lamp)" opacity={0.85 + 0.1 * Math.sin(f / 30)} />
        <g transform="translate(540,1130) scale(1.12)">
          <path d="M-430,40 H430 L470,110 H-470 Z" fill="#20282D" stroke={P.ink} strokeWidth={5} />
          <ellipse cx={0} cy={140} rx={520} ry={26} fill={P.ink} opacity={0.4} />
          <g transform={`translate(0,40) scale(1,${0.15 + 0.85 * lid})`}>
            <rect x={-410} y={-560} width={820} height={560} rx={26} fill="#10171B" stroke={P.ink} strokeWidth={6} />
            <rect x={-384} y={-534} width={768} height={508} rx={8} fill={P.paper} />
            <rect x={-384} y={-534} width={768} height={84} fill={P.peat} />
            <text x={-356} y={-478} fontFamily={MONO} fontWeight={800} fontSize={38} letterSpacing={2} fill={P.cream}>ADF&G</text>
            <Glyphs x={-356} y={-420} w={700} lines={3} gap={30} seed={31} />
            <rect x={-356} y={-300} width={330} height={16} rx={8} fill={P.slate} opacity={0.55} />
            <Glyphs x={-356} y={-260} w={700} lines={4} gap={30} seed={33} />
            <g transform={`translate(0,-52) scale(1,${1 - 0.85 * fold})`} opacity={1 - 0.2 * fold}>
              <rect x={-384} y={-4} width={768} height={30} fill={P.paper2} />
            </g>
            <text x={-340} y={-40 - 20 * (1 - fold)} fontFamily={SERIF} fontWeight={900} fontSize={70 * fold} fill={P.peat}>*</text>
          </g>
          <g transform={`translate(${250 - 30 * tab},${-590 + 520 * (1 - lid) + 18 * tab})`}><DateTag x={0} y={0} s={0.5} rot={-8} text="" fade={0.5} /></g>
        </g>
        <g opacity={lid}>
          <Plate text="ONE SOURCE OF TRUTH · ADF&G REGULATIONS" y={520} size={26} p={lid} />
          <Plate text="AUSTIN McDANIEL · PUBLIC SAFETY SPOKESMAN" y={1250} size={20} tone="paper" p={ease(f, bAt(28) + 10, 12)} />
        </g>
        <Dust f={f} color={P.lamp} op={0.26} />
      </SVG>
    );
  } else if (n === 12) {
    // MACRO: THE FINE PRINT. The page calls itself simplified, and an emergency order lands on it.
    const type = ease(f, bAt(31), 110);
    const stamp = spring(f, bAt(31) + 70, 14);
    const slip = spring(f, bAt(32), 16);
    const sag = ease(f, bAt(32) + 10, 30);
    zoom = 1.06 + 0.06 * (f / dur);
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="url(#wood)" />
        <ellipse cx={780} cy={800} rx={520} ry={620} fill="url(#lamp)" opacity={0.8} />
        <g transform={`translate(540,880) skewY(${2.5 * sag}) translate(0,${18 * sag})`}>
          <rect x={-456} y={-396} width={920} height={800} fill={P.ink} opacity={0.4} />
          <rect x={-460} y={-400} width={920} height={800} fill={P.paper} stroke={P.ink} strokeWidth={5} />
          <rect x={-460} y={-400} width={920} height={110} fill={P.peat} />
          <text x={-420} y={-330} fontFamily={MONO} fontWeight={800} fontSize={46} letterSpacing={3} fill={P.cream}>ADF&G</text>
          <Glyphs x={-420} y={-250} w={840} lines={11} gap={38} seed={40} progress={type} opacity={0.4} />
          <text x={-430} y={-268} fontFamily={SERIF} fontWeight={900} fontSize={70} fill={P.peat}>*</text>
          <g transform={`translate(150,150) rotate(-8) scale(${stamp})`} opacity={clamp01(stamp * 2)}>
            <rect x={-190} y={-44} width={380} height={88} fill="none" stroke={P.peat} strokeWidth={7} opacity={0.9} />
            <text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} letterSpacing={4} fill={P.peat}>A SUMMARY</text>
          </g>
        </g>
        <g transform={`translate(${640},${700 + 1000 * (1 - slip) - 110 * (slip > 0.95 ? 0 : 0)}) rotate(${6 - 6 * slip})`} opacity={clamp01(slip * 3)}>
          <rect x={-224} y={-118} width={480} height={270} fill={P.ink} opacity={0.4} />
          <rect x={-230} y={-130} width={480} height={270} fill={P.paper} stroke={P.peat} strokeWidth={6} />
          <rect x={-230} y={-130} width={480} height={70} fill={P.peat} />
          <text x={-10} y={-82} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={36} letterSpacing={2} fill={P.cream}>EMERGENCY ORDER</text>
          <Glyphs x={-200} y={-30} w={420} lines={3} gap={34} seed={50} />
        </g>
        <Plate text="REGULATIONS ARE SIMPLIFIED" y={1200} size={28} p={ease(f, bAt(31), 12)} />
        <Plate text="EMERGENCY ORDERS CAN OVERRIDE" y={1262} size={28} p={ease(f, bAt(31) + 22, 12)} />
        <Dust f={f} color={P.lamp} op={0.26} />
      </SVG>
    );
  } else if (n === 13) {
    // THE DIVE. Four layers, each a miniature of a world we have already been in, and the one
    // thick still binder underneath. The camera makes its single continuous descent here.
    const fall = (i: number) => spring(f, bAt(33) + i * 7, 20);
    const hold = ease(f, bAt(35), 40);
    const diveT = clamp01((f - bAt(36)) / Math.max(1, bAt(37) - bAt(36)));
    const wp = [-0.55, 0.65, 1.65, 2.65, 3.55];
    const seg = Math.min(3, Math.floor(diveT * 4));
    const s = clamp01(diveT * 4 - seg);
    const mv = s < 0.5 ? ease(s * 2 * 30, 0, 30) : 1;
    const inOut = (x: number) => x * x * (3 - 2 * x);
    const uDive = diveT >= 1 ? wp[4] : wp[seg] + (wp[seg + 1] - wp[seg]) * inOut(clamp01(s * 2));
    const uPre = -1.15 + 0.6 * hold;
    const u = f < bAt(36) ? uPre : uDive;
    const landed = ease(f, bAt(37), 20);
    const slipK = spring(f, bAt(37) + 6, 18);
    const tagFall = clamp01((f - bAt(36) - 6) / 60);
    const wob = (i: number) => Math.sin(f / 11 + i * 1.7) * 1.3 * (1 - landed);
    const corner = f >= bAt(34) ? Math.sin(Math.min(1, since(34) / 20) * Math.PI) : 0;
    const fills = [P.paper, P.paper2, P.paper3, P.paper4];
    const planeXY = (d: number) => {
      const sc = perspScale(d, 0.34) * 1.3;
      return {sc, x: 540, y: 1080 - d * 260 * (sc / 1.3)};
    };
    const Head13: React.FC<{fill: string; text: string; color?: string; size?: number}> = ({fill, text, color = P.cream, size = 28}) => (
      <g>
        <rect x={-380} y={-270} width={760} height={92} fill={fill} />
        <text x={-352} y={-212} fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.5} fill={color}>{text}</text>
      </g>
    );
    const Face: React.FC<{i: number}> = ({i}) => {
      if (i === 0) return (
        <g>
          <Head13 fill={P.orangeLo} text="AI ANSWER" size={34} />
          <AnswerCard x={0} y={20} w={520} land={1} label="" />
          <g transform="translate(300,-140)"><DateTag x={0} y={0} s={0.8} rot={6} text="" crease={0.4} /></g>
        </g>
      );
      if (i === 1) return (
        <g>
          <Head13 fill={P.slate} text="AI RESPONSES MAY INCLUDE MISTAKES" size={26} />
          <Glyphs x={-350} y={-140} w={600} lines={2} gap={30} seed={6} />
          <rect x={-360} y={-50} width={720} height={64} fill="#B8C7B0" opacity={0.9} />
          <Glyphs x={-340} y={-30} w={520} lines={1} color={P.peat} opacity={0.5} seed={2} />
          <Glyphs x={-350} y={50} w={640} lines={5} gap={30} seed={9} />
        </g>
      );
      if (i === 2) return (
        <g>
          <Head13 fill={P.peat} text="ADF&G" size={38} />
          <Glyphs x={-350} y={-140} w={700} lines={6} gap={32} seed={33} />
          <g transform="translate(120,90) rotate(-8)">
            <rect x={-170} y={-40} width={340} height={80} fill="none" stroke={P.peat} strokeWidth={6} />
            <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={4} fill={P.peat}>A SUMMARY</text>
          </g>
        </g>
      );
      return (
        <g>
          <Head13 fill={P.slate} text="ONE SOURCE OF TRUTH · ADF&G REGULATIONS" size={24} />
          <Glyphs x={-350} y={-130} w={640} lines={4} gap={34} seed={44} />
          <Glyphs x={-350} y={30} w={560} lines={3} gap={34} seed={45} />
        </g>
      );
    };
    const d4 = 4 - u;
    const b = planeXY(d4);
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="url(#ground)" />
        <rect width={W} height={H} fill={P.ink} opacity={0.12 + 0.12 * clamp01((u + 0.6) / 4)} />
        {/* the binder: pinned in focus, still */}
        <g transform={`translate(${540 - 270 * b.sc * 0.92},${b.y - 260 * b.sc * 0.92}) scale(${b.sc * 0.92})`}>
          <Binder x={0} y={0} w={540} h={520} depth={56} showPage={false} />
          <path d="M-22,10 V500" stroke={P.cream} strokeWidth={4} opacity={0.8} />
          <path d="M0,4 H540" stroke={P.cream} strokeWidth={3} opacity={0.6} />
          <g transform={`translate(${210},${210 - 800 * (1 - slipK)}) rotate(${-4 * (1 - slipK)})`} opacity={clamp01(slipK * 3)}>
            <rect x={-146} y={-80} width={300} height={170} fill={P.ink} opacity={0.35} />
            <rect x={-150} y={-88} width={300} height={170} fill={P.paper} stroke={P.peat} strokeWidth={5} />
            <rect x={-150} y={-88} width={300} height={54} fill={P.peat} />
            <text x={0} y={-50} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1} fill={P.cream}>EMERGENCY ORDER</text>
            <Glyphs x={-124} y={-8} w={240} lines={2} gap={30} seed={71} />
          </g>
          {landed > 0.4 && <DateTag x={90} y={80 + 240 * (1 - landed)} s={1.0} rot={-4} state="cream" />}
        </g>
        {[3, 2, 1, 0].map((i) => {
          const d = i - u;
          const a = passAlpha(d, 0.32) * clamp01(fall(i) * 2);
          if (a <= 0.01) return null;
          const p = planeXY(d);
          const bl = blurAt(i, u, 1.5, 0.4, 7);
          const drop = -1000 * (1 - fall(i));
          return (
            <g key={i} opacity={a} filter={bl > 0.2 ? `url(#bl${i})` : undefined}
              transform={`translate(${p.x},${p.y + drop * p.sc}) rotate(${wob(i) + (i === 0 ? -corner * 2 : 0)}) skewX(-8) scale(${p.sc * 1.02},${p.sc * 0.9})`}>
              <defs><filter id={`bl${i}`}><feGaussianBlur stdDeviation={bl} /></filter></defs>
              <rect x={-372} y={-262} width={760} height={520} fill={P.ink} opacity={0.3} />
              <rect x={-380} y={-270} width={760} height={520} fill={P.cream} />
              <rect x={-380} y={-270} width={760} height={520} fill={fills[i]} opacity={0.92} stroke={P.ink} strokeWidth={4} />
              <path d="M-376,-266 H376" stroke={P.cream} strokeWidth={4} opacity={0.9} />
              <Face i={i} />
            </g>
          );
        })}
        {tagFall > 0 && tagFall < 1 && (
          <DateTag x={620 - 40 * tagFall} y={470 + 1000 * tagFall * tagFall} s={0.8} rot={6 + 240 * tagFall} text="" crease={0.6} />
        )}
        <Plate text="A SUMMARY" y={520} size={30} p={ease(f, bAt(33) + 26, 12) * (1 - ease(f, bAt(36), 14))} />
        <Dust f={f} color={P.paper} op={0.16} />
      </SVG>
    );
    zoom = 1;
  } else if (n === 14) {
    // BACK AT HER TABLE, from the same overhead angle and the same lamp. The viewer's hands turn
    // the page TOWARD camera where hers was turned away.
    const turn = ease(f, bAt(38) + 4, 40);
    const ang = Math.PI * (1 - turn);
    const sx = Math.cos(ang);
    const mail = ease(f, bAt(39), 30);
    const tab = ease(f, bAt(40), 26);
    const slip = ease(f, bAt(40) + 8, 30);
    picture = (
      <SVG><Defs />
        <rect width={W} height={H} fill="url(#wood)" />
        {Array.from({length: 30}, (_, i) => <path key={i} d={`M-20,${i * 66 + (hash(i) % 20)} Q540,${i * 66 + 14 + (hash(i + 3) % 24)} 1100,${i * 66 + (hash(i + 5) % 20)}`} stroke="#150F0B" strokeWidth={2} fill="none" opacity={0.5} />)}
        <ellipse cx={830} cy={760} rx={560} ry={640} fill="url(#lamp)" opacity={1.0} />
        <g transform="translate(300,590)">
          <rect x={-6} y={8} width={560} height={690} fill={P.ink} opacity={0.5} />
          <rect x={0} y={0} width={540} height={680} fill={P.paper2} stroke={P.ink} strokeWidth={4} />
          <g transform={`translate(270,0) scale(${sx || 0.001},1) translate(-270,0)`}>
            {sx < 0 ? (
              <g filter="url(#soft6)"><rect x={30} y={30} width={480} height={620} fill={P.paper3} /></g>
            ) : (
              <g>
                <rect x={30} y={30} width={480} height={620} fill={P.paper} stroke={P.ink} strokeWidth={2} />
                <rect x={54} y={62} width={432} height={126} fill={P.peat} />
                <text x={270} y={112} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={1.5} fill={P.cream}>REGULATIONS AND</text>
                <text x={270} y={158} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={1.5} fill={P.cream}>EMERGENCY ORDERS</text>
                <Glyphs x={56} y={232} w={420} lines={11} gap={34} seed={12} />
              </g>
            )}
          </g>
          <rect x={-190} y={0} width={190} height={680} fill={P.peatHi} stroke={P.ink} strokeWidth={4} transform="translate(-4,0)" />
          <rect x={-24} y={-4} width={46} height={688} rx={20} fill={P.peatLo} stroke={P.ink} strokeWidth={5} />
          <path d="M-12,14 V666" stroke={P.cream} strokeWidth={2.5} opacity={0.55} />
          <g transform={`translate(${540 - 250 * tab + 40},${400})`} opacity={clamp01(tab * 3)}>
            <rect x={0} y={-28} width={440} height={56} rx={6} fill={P.paper} stroke={P.ink} strokeWidth={3} />
            <path d="M22,0 H330 M22,16 H240" stroke={P.peat} strokeWidth={7} strokeLinecap="round" opacity={0.8} />
          </g>
        </g>
        <g transform={`translate(${1300 - 500 * mail},${1190 - 20 * mail}) rotate(${-6 + 6 * mail})`} opacity={clamp01(mail * 3)}>
          <rect x={-156} y={-96} width={340} height={210} fill={P.ink} opacity={0.35} />
          <rect x={-160} y={-104} width={340} height={210} fill={P.paper} stroke={P.ink} strokeWidth={4} />
          <rect x={-160} y={-104} width={340} height={44} fill={P.peat} />
          <Glyphs x={-130} y={-30} w={250} lines={3} gap={30} seed={33} />
        </g>
        <g transform={`translate(${-150 + 300 * slip},${1010}) rotate(${-4 + 4 * slip}) scale(0.8)`} opacity={clamp01(slip * 3)}>
          <rect x={-146} y={-80} width={300} height={170} fill={P.ink} opacity={0.35} />
          <rect x={-150} y={-88} width={300} height={170} fill={P.paper} stroke={P.peat} strokeWidth={5} />
          <rect x={-150} y={-88} width={300} height={54} fill={P.peat} />
          <text x={0} y={-50} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1} fill={P.cream}>EMERGENCY ORDER</text>
        </g>
        <HandSil x={330 + 40 * turn} y={1690 - 470 * ease(f, bAt(38) - 10, 26) + 150 * turn} rot={-8} s={1.05} curl={0.4 * turn} />
        <HandSil x={800} y={1720 - 280 * ease(f, bAt(39) - 10, 26) + 200 * ease(f, bAt(39) + 26, 24)} rot={14} s={0.95} flip curl={0.3} />
        <Plate text="CALL ADF&G · 907-465-4190" y={1250} size={28} p={ease(f, bAt(39) + 10, 12)} />
        <Dust f={f} color={P.lamp} op={0.28} />
      </SVG>
    );
    zoom = 1 + 0.06 * (f / dur);
  } else if (n === 15) {
    // THE BOOKEND. The same phone, the same thumb, the search bar empty, and now the binder's
    // title strip faces up with the blank tag lying on it.
    const blink = f % 30 < 16;
    const thumbIn = 1 - ease(f, 0, 20);
    picture = (
      <SVG><Defs />
        <SlateSurface f={f} />
        <g transform={`translate(70,1010) rotate(-7)`}>
          <rect x={150} y={-44} width={130} height={80} fill={P.paper} stroke={P.ink} strokeWidth={3} transform="rotate(5)" />
          <Binder x={0} y={0} w={420} h={290} depth={44} showPage={false} />
          <rect x={44} y={40} width={330} height={62} fill={P.peatHi} stroke={P.ink} strokeWidth={3} />
          <Glyphs x={64} y={62} w={230} lines={1} color={P.cream} opacity={0.6} />
          <path d="M-22,10 V276" stroke={P.cream} strokeWidth={3} opacity={0.75} />
          <DateTag x={250} y={190} s={0.8} rot={-5} state="cream" />
        </g>
        <Phone cx={640} cy={960} id="s15" glow={0.9}>
          <rect x={30} y={70} width={440} height={78} rx={39} fill="#1B282F" stroke="#3C505B" strokeWidth={3} />
          <circle cx={72} cy={109} r={13} fill="none" stroke={P.paper4} strokeWidth={4} />
          <path d="M82,119 l12,12" stroke={P.paper4} strokeWidth={4} strokeLinecap="round" />
          {blink && <rect x={112} y={94} width={4} height={32} fill={P.cream} />}
        </Phone>
        <Thumb x={780} y={800 + 520 * thumbIn} />
        <Plate text="GOOGLED · SNIPE SEASON" y={470} size={34} />
        <Dust f={f} />
      </SVG>
    );
  }

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom}) translateX(${drift * 5}px)`}}>
        {picture}
      </div>
      <GradeLayer f={f} bloom={0.05 + acc * 0.08} vignette={0.30} grain={0.05} warmth={0.0} />
    </AbsoluteFill>
  );
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep0930Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep0930Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:100 900;font-display:block;}`}</style>
);

export const Ep0930: React.FC<Props> = ({captions: cues = [], scenes, beats, credits, mouth = [], accents = []}) => {
  const fallback = [0, 10, 14.5, 25, 34.4, 44.2, 48.9, 55.6, 64.4, 75.1, 80.6, 89.9, 97.4, 111.3, 117.4, 121]
    .map((x) => Math.round(x * 30));
  const slots = scenes ?? fallback.slice(0, -1).map((from, i) => ({from, dur: fallback[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: P.fog}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={i + 1} from={s.from} dur={s.dur} beats={bs} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><Captions cues={cues} /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
