import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, ContactShadow, tones, FormGradient} from './lib/lighting';
import {VoiceProvider, useVoice} from './lib/voice';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {HandSil} from './lib/stack';
import {Character} from './lib/Character';
import {Groundfish, Raven} from './lib/fauna';
import {BrassPlate} from './lib/bench';
import {StatBurst, Stamp} from './lib/kit';
import {ImpactStar, SpeedLines} from './lib/FX';
import {
  Otolith, TallyCounter, NIRReader, BenchScope, ArchiveDrawers, AgeTag, TreeRings, SpectralLine, spectrumPoints, YearDrum,
  otolithPoint, ringScales, bandCrenul, PEARL, BRASS, NIR, LAMP, ENAMEL,
} from './lib/otolith';

// WHO COUNTED, 2026-10-02.
// Palette roles are art_direction.json: Bering teal-black field, pearl hero stone, small hard brass
// parts, warm lamp, and ONE near-infrared magenta that only ever means the machine's light. Every
// painted string is a claims.json on_screen string or the storyboard annotation for its beat. The
// 1878 stone never meets the machine's beam (c6), and Derek Chamberlin is a plate, never a face.
const W = 1080, H = 1920;
const CAPTION_TOP = 1330;
const CAP_GUARD = CAPTION_TOP - 34;
type Beat = {id: number; at: number; label: string};

const C = {
  sea: '#0A1B24', seaHi: '#0F3340', seaLo: '#050C10', ink: '#0B1418', bench: '#2A1C14', benchHi: '#3E2A1D',
  velvet: '#120A10', pearl: PEARL, brass: BRASS, lamp: LAMP, nir: NIR, paper: '#F2EBDA', teal: '#1F4A55', cream: '#F2EBDA',
};
const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
/** anticipation, overshoot, settle. A linear scale-in is below the bar. */
const spring = (f: number, a: number, d = 20) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.pow(2, -9 * t) * Math.cos((t * d - 1.2) * 0.9);
};
const hash = (i: number) => Math.imul(i + 1013, 2654435761) >>> 0;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], clamp01(t))).toString(16).padStart(2, '0')).join('');
};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

const plateW = (text: string, size: number, ls = 1.5) =>
  text.length * size * 0.602 + ls * Math.max(0, text.length - 1) + 56;

/** A mono plate, sized to its string by arithmetic, kept out of the caption band. */
const Plate: React.FC<{text: string; x?: number; y: number; size?: number; tone?: 'dark' | 'brass' | 'nir'; p?: number}> =
({text, x = 540, y, size = 30, tone = 'dark', p = 1}) => {
  const w = plateW(text, size), h = size + 30;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(text, yy - h / 2, yy + h / 2);
  const fill = tone === 'brass' ? C.brass : tone === 'nir' ? '#2A0B16' : '#0D171C';
  const edge = tone === 'brass' ? C.ink : tone === 'nir' ? '#FF9DB8' : C.cream;
  const k = clamp01(p);
  if (k <= 0.01) return null;
  return (
    <g opacity={k} transform={`translate(${x} ${yy}) scale(${0.9 + 0.1 * spring(k * 20, 0, 20)})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 7} width={w} height={h} rx={8} fill={C.seaLo} opacity={0.55} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={fill} stroke={edge} strokeWidth={3.5} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={700}
        fontSize={size} letterSpacing={1.5} fill={edge}>{text}</text>
    </g>
  );
};

/** Drifting particles: the always-running ambient layer every shot carries. */
const Motes: React.FC<{f: number; n?: number; color?: string; y0?: number; y1?: number; op?: number; rise?: number}> =
({f, n = 34, color = C.pearl, y0 = 380, y1 = 1500, op = 0.3, rise = 0.35}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const h = hash(i * 7 + 3);
      const span = y1 - y0;
      const x = (h % 1080) + Math.sin(f / (40 + (h % 40)) + i) * 18;
      let y = y0 + ((h >>> 9) % span) - ((f * (rise * (0.4 + ((h >>> 5) % 60) / 100))) % span);
      if (y < y0) y += span;
      return <circle key={i} cx={x} cy={y} r={1.4 + ((h >>> 17) % 3) * 0.9} fill={color} opacity={op * (0.4 + ((h >>> 21) % 60) / 100)} />;
    })}
  </g>
);

/** Deep water: teal-black gradient, light shafts and caustic bands crossing on their own clocks. */
const Water: React.FC<{f: number; id: string}> = ({f, id}) => (
  <g>
    <defs>
      <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#123E4C" /><stop offset="0.45" stopColor={C.sea} /><stop offset="1" stopColor={C.seaLo} />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill={`url(#${id}w)`} />
    {Array.from({length: 5}, (_, i) => (
      <path key={i} d={`M${120 + i * 210 + Math.sin(f / 60 + i) * 40},0 L${40 + i * 230},1920 L${180 + i * 230},1920 Z`}
        fill="#7FD8E8" opacity={0.035 + 0.02 * Math.sin(f / 37 + i * 2)} />
    ))}
    {Array.from({length: 7}, (_, i) => (
      <ellipse key={i} cx={((i * 260 + f * (0.6 + i * 0.07)) % 1500) - 200} cy={480 + i * 150} rx={260} ry={18}
        fill="#9FE6F2" opacity={0.05} />
    ))}
    <Motes f={f} color="#BFEFF7" op={0.28} />
  </g>
);

/** The lamplit bench: dark wood, one warm lamp pool upper left, a black velvet stage. */
const Bench: React.FC<{f: number; id: string; velvet?: boolean; lampX?: number; lampY?: number}> = ({f, id, velvet = true, lampX = 420, lampY = 820}) => (
  <g>
    <defs>
      <linearGradient id={`${id}b`} x1="0" y1="0" x2="0.15" y2="1">
        <stop stopColor={C.benchHi} /><stop offset="1" stopColor={C.bench} />
      </linearGradient>
      <radialGradient id={`${id}l`} cx="0.5" cy="0.5" r="0.5">
        <stop stopColor={C.lamp} stopOpacity={0.42} /><stop offset="1" stopColor={C.lamp} stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill={`url(#${id}b)`} />
    {Array.from({length: 22}, (_, i) => (
      <path key={i} d={`M0,${i * 92 + 20} C300,${i * 92 + 8 + (i % 3) * 6} 700,${i * 92 + 34} 1080,${i * 92 + 18}`}
        fill="none" stroke="#1A100A" strokeWidth={3} opacity={0.35} />
    ))}
    <ellipse cx={lampX + Math.sin(f / 90) * 6} cy={lampY} rx={760} ry={640} fill={`url(#${id}l)`} />
    {velvet && <g>
      <rect x={150} y={520} width={780} height={760} rx={24} fill={C.velvet} stroke="#000" strokeWidth={6} />
      <rect x={168} y={538} width={744} height={60} rx={14} fill="#FFFFFF" opacity={0.03} />
    </g>}
    <Motes f={f} color={C.lamp} op={0.22} rise={0.2} />
  </g>
);

/** The bench's near edge in the lower third: a wooden lip, a tray of tagged stones and a pencil,
 *  so the frame under the caption card carries the world instead of plain wood. */
const BenchLip: React.FC<{f: number; y?: number; tags?: string[]}> = ({f, y = 1560, tags = ['4', '6', '9']}) => (
  <g>
    <rect x={-20} y={y} width={W + 40} height={H - y + 20} fill="#2E1F15" stroke={C.ink} strokeWidth={5} /> {/* caption-band-ok */}
    <rect x={-20} y={y} width={W + 40} height={16} fill="#4A3324" />
    {Array.from({length: 5}, (_, i) => <path key={i} d={`M0,${y + 60 + i * 64} C320,${y + 52 + i * 64} 760,${y + 70 + i * 64} 1080,${y + 58 + i * 64}`} fill="none" stroke="#1A100A" strokeWidth={3} opacity={0.5} />)}
    <g transform={`translate(330,${y + 120})`}>
      <ContactShadow cx={0} cy={44} rx={210} ry={14} opacity={0.5} />
      <rect x={-200} y={-30} width={400} height={74} rx={8} fill="#4A3020" stroke={C.ink} strokeWidth={5} />
      <rect x={-192} y={-24} width={384} height={12} rx={5} fill="#6A4A30" opacity={0.7} />
      {tags.map((tg, k) => <g key={k}>
        <Otolith x={-120 + k * 120} y={8} scale={0.2} rings={7} f={0} counted={1} shadow={false} rot={-6 + k * 5} />
        <AgeTag x={-96 + k * 120} y={-4} text={tg} f={f + k * 11} scale={0.52} />
      </g>)}
    </g>
    <g transform={`translate(780,${y + 150}) rotate(-12)`}>
      <rect x={-140} y={-9} width={280} height={18} rx={9} fill={C.teal} stroke={C.ink} strokeWidth={4} />
      <path d="M-140,-9 L-176,0 L-140,9 Z" fill="#E8C9A0" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M-176,0 L-164,-3 L-164,3 Z" fill={C.ink} />
      <path d="M-130,-4 L130,-4" stroke="#FFFFFF" strokeWidth={2} opacity={0.3} />
    </g>
  </g>
);

/** A lamplit room: paneled back wall, a board floor from `floorY` down, one warm pool. */
const Room: React.FC<{f: number; id: string; floorY?: number; lampX?: number; lampY?: number}> = ({f, id, floorY = 1300, lampX = 260, lampY = 900}) => (
  <g>
    <defs>
      <linearGradient id={`${id}wall`} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#0B171C" /><stop offset="1" stopColor="#173038" />
      </linearGradient>
      <linearGradient id={`${id}floor`} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#3A2618" /><stop offset="1" stopColor="#1A100A" />
      </linearGradient>
      <radialGradient id={`${id}pool`} cx="0.5" cy="0.5" r="0.5">
        <stop stopColor={C.lamp} stopOpacity={0.34} /><stop offset="1" stopColor={C.lamp} stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={W} height={floorY} fill={`url(#${id}wall)`} />
    {Array.from({length: 12}, (_, i) => (
      <g key={i}>
        <rect x={i * 92 + 6} y={300} width={80} height={floorY - 340} rx={6} fill="#10232A" stroke="#07100F" strokeWidth={3} />
        <rect x={i * 92 + 12} y={306} width={10} height={floorY - 352} fill="#FFFFFF" opacity={0.025} />
      </g>
    ))}
    <rect x={0} y={floorY - 40} width={W} height={40} fill="#2A1C14" stroke={C.ink} strokeWidth={4} />
    <rect y={floorY} width={W} height={H - floorY} fill={`url(#${id}floor)`} /> {/* caption-band-ok */}
    {Array.from({length: 9}, (_, i) => (
      <path key={i} d={`M${-200 + i * 180},${H} L${540 + (i - 4) * 60},${floorY}`} stroke="#120A06" strokeWidth={4} opacity={0.6} />
    ))}
    {Array.from({length: 5}, (_, i) => <path key={i} d={`M0,${floorY + 30 + i * i * 22} H${W}`} stroke="#120A06" strokeWidth={3} opacity={0.5} />)}
    <ellipse cx={lampX + Math.sin(f / 80) * 8} cy={lampY} rx={620} ry={560} fill={`url(#${id}pool)`} />
    <Motes f={f} color={C.lamp} op={0.16} rise={0.15} />
  </g>
);

/** Inside the machine: magenta-lit ribs, conduits and a slow scan line. */
const MachineInside: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect width={W} height={H} fill="#12060C" />
    <radialGradient id="mi_glow" cx="0.5" cy="0.47" r="0.6"><stop stopColor={C.nir} stopOpacity={0.22} /><stop offset="1" stopColor={C.nir} stopOpacity={0} /></radialGradient>
    <rect width={W} height={H} fill="url(#mi_glow)" />
    {Array.from({length: 7}, (_, i) => {
      const x = 60 + i * 160;
      return <g key={i}>
        <rect x={x - 18} y={300} width={36} height={1400} fill="#1E0D16" stroke="#000" strokeWidth={3} /> {/* caption-band-ok */}
        <rect x={x - 12} y={300} width={6} height={1400} fill={C.brass} opacity={0.18} /> {/* caption-band-ok */}
        {Array.from({length: 9}, (_, k) => <circle key={k} cx={x} cy={360 + k * 150} r={5} fill={tones(C.brass).core} stroke="#000" strokeWidth={2} />)}
      </g>;
    })}
    {Array.from({length: 4}, (_, i) => (
      <path key={i} d={`M-40,${520 + i * 260} C300,${480 + i * 260} 760,${580 + i * 260} 1120,${520 + i * 260}`} fill="none" stroke="#2A0E1C" strokeWidth={18} />
    ))}
    <rect x={0} y={420 + ((f * 6) % 1100)} width={W} height={3} fill={C.nir} opacity={0.25} />
    <Motes f={f} color={C.nir} op={0.2} />
  </g>
);

/** A small brass microscope, side view, for the reader's bench. Anchor is the foot centre. */
const Microscope: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const b = tones(C.brass);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={0} rx={110} ry={14} opacity={0.5} />
      <path d="M-100,0 L100,0 L80,-34 L-80,-34 Z" fill={b.core} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M30,-34 C70,-120 70,-220 20,-300" fill="none" stroke={C.ink} strokeWidth={34} strokeLinecap="round" />
      <path d="M30,-34 C70,-120 70,-220 20,-300" fill="none" stroke={b.base} strokeWidth={22} strokeLinecap="round" />
      <rect x={-90} y={-140} width={130} height={16} rx={4} fill={b.shade} stroke={C.ink} strokeWidth={4} />
      <g transform="rotate(-24 -20 -300)">
        <rect x={-48} y={-380} width={56} height={210} rx={8} fill={b.base} stroke={C.ink} strokeWidth={6} />
        <rect x={-58} y={-404} width={76} height={30} rx={8} fill={b.core} stroke={C.ink} strokeWidth={5} />
        <rect x={-40} y={-360} width={14} height={160} fill="#FFF3D0" opacity={0.4} />
        <rect x={-40} y={-176} width={40} height={30} fill={b.shade} stroke={C.ink} strokeWidth={4} />
      </g>
      <circle cx={52} cy={-150} r={20} fill={b.core} stroke={C.ink} strokeWidth={5} />
    </g>
  );
};

/** The question mark glyph, drawn identically on the brass plate and inside the AGE OUT slot. */
const QMark: React.FC<{x: number; y: number; s?: number; wob?: number; color?: string}> = ({x, y, s = 1, wob = 0, color = C.pearl}) => (
  <g transform={`translate(${x},${y}) rotate(${wob}) scale(${s})`}>
    <text x={0} y={30} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={96} fill={color} stroke={C.ink} strokeWidth={4} paintOrder="stroke">?</text>
  </g>
);

/** ONE ENGRAVED BRASS SIGN for every brass plate in the film (the WHO COUNTED? loop object, the
 *  Chamberlin plate, the title plate). House mono, text centred on the plate, width sized by
 *  arithmetic (0.602em + tracking), at least 40px from each screw, a dark inner engrave line.
 *  Anchor (x, y) is the plate centre. `flip` 0..1 rolls the flap (scaleY through 0). */
const BrassSign: React.FC<{x: number; y: number; lines: string[]; size?: number; s?: number; rot?: number; flip?: number; minW?: number}> =
({x, y, lines, size = 40, s = 1, rot = 0, flip = 0, minW = 0}) => {
  const b = tones(C.brass);
  const longest = Math.max(...lines.map((l) => l.length));
  const textW = longest * size * 0.602 + Math.max(0, longest - 1) * 1.5;
  const w = Math.max(minW, textW + 2 * (40 + 22));
  const lh = size * 1.18;
  const h = lines.length * lh + 44;
  const sy = Math.abs(1 - 2 * clamp01(flip)) || 0.02;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s},${s * sy})`}>
      <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} rx={10} fill="#000" opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={b.base} stroke={C.ink} strokeWidth={5} />
      <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w - 12} height={h * 0.32} rx={7} fill={b.key} opacity={0.45} />
      <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={6} fill="none" stroke={b.shade} strokeWidth={2} />
      {[-1, 1].map((k) => (
        <g key={k} transform={`translate(${k * (w / 2 - 22)},0)`}>
          <circle r={8} fill={b.core} stroke={C.ink} strokeWidth={2.5} />
          <path d="M-5,0 h10" stroke={C.ink} strokeWidth={2} />
        </g>
      ))}
      {lines.map((l, i) => (
        <text key={i} x={0} y={(i - (lines.length - 1) / 2) * lh + size * 0.36} textAnchor="middle" fontFamily={MONO}
          fontWeight={800} fontSize={size} letterSpacing={1.5} fill={C.ink}>{l}</text>
      ))}
    </g>
  );
};

/** An inked, form-shaded hand gripping (optionally) a pen: ONE outline for the back of the hand,
 *  the index finger and the three curled fingers, a separate thumb over the pen, nails, knuckle
 *  highlights, curl creases, a rim light, and a cuffed sleeve in the wearer's colour. Anchor is the
 *  pinch point; the pen tip sits at (-195, 77) from it at rot 0 and scale 1. */
const InkHand: React.FC<{x: number; y: number; rot?: number; s?: number; pen?: boolean; press?: number; sleeve?: string}> =
({x, y, rot = 0, s = 1, pen = false, press = 0, sleeve = C.teal}) => {
  const skin = tones('#C99A72');
  const sl = tones(sleeve);
  const gid = `ih${Math.round(x)}x${Math.round(y)}r${Math.round(rot)}`;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <defs>
        <linearGradient id={`${gid}k`} x1="0" y1="0" x2="0.25" y2="1">
          <stop stopColor={skin.key} /><stop offset="0.45" stopColor={skin.base} /><stop offset="1" stopColor={skin.shade} />
        </linearGradient>
        <linearGradient id={`${gid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={sl.key} /><stop offset="0.5" stopColor={sl.base} /><stop offset="1" stopColor={sl.shade} />
        </linearGradient>
      </defs>
      <ellipse cx={30} cy={44} rx={96} ry={22} fill="#000" opacity={0.16} />
      {/* sleeve and cuff */}
      <path d="M58,26 L232,108 L208,184 L34,104 Z" fill={`url(#${gid}s)`} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d="M58,26 L84,38 L60,116 L34,104 Z" fill={sl.shade} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M86,40 L64,116" stroke={C.ink} strokeWidth={2.5} opacity={0.6} />
      <circle cx={72} cy={66} r={5} fill={sl.key} stroke={C.ink} strokeWidth={2} />
      <path d="M100,50 L226,110" stroke="#FFFFFF" strokeWidth={4} opacity={0.18} strokeLinecap="round" />
      {/* back of the hand, index finger and the three curled fingers, one outline */}
      <path d={'M64,22 C48,-6 18,-18 -8,-13 C-20,-11 -30,-4 -33,4 C-35,11 -29,16 -22,14 '
        + 'C-14,12 -8,14 -5,20 C-11,28 -11,36 -3,40 C-9,47 -7,55 3,58 C-1,65 3,72 13,72 C30,80 46,88 58,94 Z'}
        fill={`url(#${gid}k)`} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      {/* curl creases and the knuckle line */}
      <path d="M-5,20 C2,23 8,25 14,24 M-3,40 C4,42 10,43 16,41 M3,58 C9,59 14,59 19,57" fill="none" stroke={skin.shade} strokeWidth={3} strokeLinecap="round" />
      {[[-6, -10], [8, -12], [22, -10]].map(([kx, ky], i) => (
        <ellipse key={i} cx={kx} cy={ky + 4} rx={6} ry={3.5} fill="#FFF0DE" opacity={0.45} />
      ))}
      <path d="M-30,1 C-27,-2 -23,-3 -20,-1" fill="none" stroke={skin.shade} strokeWidth={2.5} />
      <rect x={-34} y={0} width={10} height={8} rx={3} fill="#F1DCCB" stroke={C.ink} strokeWidth={1.5} transform="rotate(-24 -29 4)" />
      {/* rim light along the top of the hand */}
      <path d="M60,16 C44,-6 18,-14 -6,-9" fill="none" stroke="#FFE8D2" strokeWidth={3.5} opacity={0.75} strokeLinecap="round" style={{mixBlendMode: 'screen'} as any} />
      {pen && (
        <g transform="translate(-40,-6) rotate(-28)">
          <rect x={-150} y={-7} width={190} height={14} rx={7} fill={C.teal} stroke={C.ink} strokeWidth={4} />
          <path d="M-150,-7 L-176,0 L-150,7 Z" fill={C.brass} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          <rect x={10} y={-9} width={8} height={18} fill={C.brass} stroke={C.ink} strokeWidth={2} />
          <path d="M-140,-4 L30,-4" stroke="#FFFFFF" strokeWidth={2} opacity={0.3} />
        </g>
      )}
      {/* the thumb, over the pen, pressing on `press` */}
      <g transform={`translate(${6 * press},${8 * press})`}>
        <path d="M48,30 C32,16 16,6 4,0 C-3,-3 -7,3 -3,7 C8,14 24,24 40,44 Z" fill={`url(#${gid}k)`} stroke={C.ink} strokeWidth={4.5} strokeLinejoin="round" />
        <rect x={-4} y={-1} width={10} height={7} rx={3} fill="#F1DCCB" stroke={C.ink} strokeWidth={1.5} transform="rotate(28 1 2)" />
        <path d="M44,28 C30,17 18,9 8,4" fill="none" stroke="#FFE8D2" strokeWidth={2.5} opacity={0.6} />
      </g>
    </g>
  );
};

/** The WHO COUNTED? brass plate at slot scale: the same plate the film asks its question on. */
const SlotPlate: React.FC<{x: number; y: number; s?: number; wob?: number}> = ({x, y, s = 1, wob = 0}) => (
  <BrassSign x={x} y={y} lines={['WHO COUNTED?']} size={40} s={0.22 * s} rot={wob} />
);

/** A small age tag printed by the machine (no handwriting: rules and a stamped word). */
const MachineTag: React.FC<{x: number; y: number; s?: number; op?: number; value?: string}> = ({x, y, s = 1, op = 1, value = '7'}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={op}>
    <rect x={-56} y={-40} width={112} height={80} rx={6} fill="#E9E4F0" stroke={C.ink} strokeWidth={4} />
    <rect x={-56} y={-40} width={112} height={20} rx={6} fill={C.nir} />
    <text x={0} y={-25} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill="#FFE5EE">AGE</text>
    <text x={0} y={28} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} fill={C.ink}>{value}</text>
  </g>
);

// THE TURN. 144 tally ticks (the stone's 144 years) start standing on the machine's spectral line
// and end lying along the growth bands of the S14 stone, at that stone's exact centre, scale and
// rotation, so the cut to the bench lands on rings the ticks already drew. Inner bands fill first,
// the way the stone grew; each band gets ticks in proportion to its length.
const STONE = {x: 540, y: 860, s: 1.55, rot: -8, rings: 14};
const LINE = {x: -40, y: 760, w: 480, h: 260, seed: 3}; // S7's line: S13 re-enters the same slot
const TICK_N = 144;
type Tick = {sx: number; sy: number; tx: number; ty: number; ang: number; len: number; outer: boolean};
const TICKS: Tick[] = (() => {
  const ks = ringScales(STONE.rings).slice().reverse(); // core outward
  const per = (k: number) => {
    let L = 0, prev = otolithPoint(k, 0, bandCrenul(k));
    for (let i = 1; i <= 72; i++) {
      const p = otolithPoint(k, (i / 72) * Math.PI * 2, bandCrenul(k));
      L += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p;
    }
    return L * STONE.s;
  };
  const lens = ks.map(per);
  const total = lens.reduce((a, b) => a + b, 0);
  const counts = lens.map((L) => Math.max(2, Math.round((TICK_N * L) / total)));
  let diff = TICK_N - counts.reduce((a, b) => a + b, 0);
  for (let j = counts.length - 1; diff !== 0; j = (j - 1 + counts.length) % counts.length) {
    counts[j] += Math.sign(diff); diff -= Math.sign(diff);
  }
  // the source: the spectral polyline resampled by arc length into TICK_N stations
  const raw = spectrumPoints(LINE.w, LINE.h, LINE.seed, 64).map(([a, b]) => [LINE.x + a, LINE.y + b] as [number, number]);
  const cum = [0];
  for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const at = (d: number): [number, number] => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const u = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return [lerp(raw[i - 1][0], raw[i][0], u), lerp(raw[i - 1][1], raw[i][1], u)];
  };
  const cr = Math.cos((STONE.rot * Math.PI) / 180), sr = Math.sin((STONE.rot * Math.PI) / 180);
  const out: Tick[] = [];
  ks.forEach((k, ring) => {
    const cn = bandCrenul(k);
    for (let j = 0; j < counts[ring]; j++) {
      const a = ((j + 0.5 * (ring % 2)) / counts[ring]) * Math.PI * 2;
      const [lx, ly] = otolithPoint(k, a, cn);
      const [lx2, ly2] = otolithPoint(k, a + 0.004, cn);
      const [sx, sy] = at((out.length / (TICK_N - 1)) * cum[cum.length - 1]);
      out.push({
        sx, sy,
        tx: STONE.x + STONE.s * (lx * cr - ly * sr), ty: STONE.y + STONE.s * (lx * sr + ly * cr),
        ang: (Math.atan2(ly2 - ly, lx2 - lx) * 180) / Math.PI + STONE.rot,
        len: Math.max(7, Math.min(46, (0.62 * lens[ring]) / counts[ring])),
        outer: ring === ks.length - 1,
      });
    }
  });
  return out;
})();

/** `grow` 0..1 stands the ticks up on the line; `fly` 0..1 carries them, inner bands first, onto
 *  the rings, turning magenta to pearl, the outermost (most recent) band landing in lamp light. */
const TickRings: React.FC<{grow: number; fly: number; op?: number}> = ({grow, fly, op = 1}) => (
  <g opacity={op}>
    {TICKS.map((tk, i) => {
      const k = EZ(clamp01(fly * 1.4 - (i / (TICK_N - 1)) * 0.4));
      const x = lerp(tk.sx, tk.tx, k), y = lerp(tk.sy, tk.ty, k) - Math.sin(k * Math.PI) * 70;
      let d = tk.ang - 90; d = ((d + 540) % 360) - 180;
      const th = ((90 + d * k) * Math.PI) / 180;
      const L = lerp(30 * clamp01(grow), tk.len, k) / 2;
      const col = tk.outer && k > 0.9 ? mixHex(C.pearl, C.lamp, (k - 0.9) * 10) : mixHex(C.nir, C.pearl, k);
      if (L < 0.5) return null;
      return <path key={i} d={`M${x - Math.cos(th) * L},${y - Math.sin(th) * L} L${x + Math.cos(th) * L},${y + Math.sin(th) * L}`}
        stroke={col} strokeWidth={tk.outer ? 6 : 5} strokeLinecap="round" />;
    })}
  </g>
);

// A row never ends on a word that points forward at what has not arrived (an article, a
// preposition, a possessive, a number before its unit), and a break at a clause comma or before
// a preposition beats a break that merely balances the two rows.
const DANGLE = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'from', 'with', 'by',
  'as', 'that', 'than', 'if', 'its', 'his', 'her', 'their', 'this', 'these', 'is', 'was', 'are', 'were', 'it', 'not',
  'no', 'into', 'about', 'over', 'under', 'each', 'every', 'more', 'most', 'only', 'next', 'very', 'so', 'what', 'where',
  'who', 'tiny', 'old', 'one', 'two', 'six', 'eight', 'hundred', 'thousand', 'million']);
const PREP = new Set(['in', 'on', 'at', 'into', 'onto', 'from', 'with', 'by', 'under', 'over', 'as', 'like', 'to', 'for', 'of']);
const WH = new Set(['where', 'what', 'when', 'who', 'which', 'how', 'why', 'if', 'because', 'while']);
const captionRows = (text: string, max = 34): string[] => {
  if (text.length <= max) return [text];
  const w = text.split(' ');
  let best = -1, bestCost = Infinity;
  for (let k = 1; k < w.length; k++) {
    const r1 = w.slice(0, k).join(' '), r2 = w.slice(k).join(' ');
    if (r1.length > max || r2.length > max) continue;
    const last = w[k - 1].toLowerCase().replace(/[,.;:?!]+$/, '');
    let cost = Math.abs(r1.length - r2.length);
    // a figure torn from its unit is the worst break there is ("600" / "to 800 percent")
    if (/^[\d.,]+$/.test(last)) cost += 80; else if (DANGLE.has(last)) cost += 40;
    // nor is a range torn at its joint ("600 to" / "800 percent")
    if (/^[\d.,]+%?$/.test(w[k]) && ['to', 'and', 'or', 'of'].includes(last)) cost += 80;
    if (/[,;:]$/.test(w[k - 1])) cost -= 30;
    if (PREP.has(w[k].toLowerCase()) || WH.has(w[k].toLowerCase())) cost -= 15;
    // a verb is never parted from its object at a possessive ("turns" / "its signature")
    if (['its', 'their', 'his', 'her'].includes(w[k].toLowerCase())) cost += 12;
    if (cost < bestCost) { bestCost = cost; best = k; }
  }
  if (best > 0) return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
  const rows: string[] = [];
  let row = '';
  for (const x of w) {
    if ((row + ' ' + x).trim().length > max && row) { rows.push(row); row = x; } else row = (row + ' ' + x).trim();
  }
  if (row) rows.push(row);
  return rows;
};

const Captions: React.FC<{cues: {t: number; d: number; text: string}[]}> = ({cues}) => {
  const t = useCurrentFrame() / 30;
  // the card HOLDS across a sub-0.15s gap to the next cue, so it never blinks off for a frame
  const c = cues.find((x, i) => {
    const nx = cues[i + 1];
    const end = nx && nx.t - (x.t + x.d) < 0.15 ? nx.t : x.t + x.d;
    return t >= x.t && t < end;
  });
  if (!c) return null;
  const rows = captionRows(c.text);
  // NEVER DROP A ROW: the bar fits whatever it is handed.
  const fs = rows.length >= 4 ? 27 : rows.length === 3 ? 32 : 39;
  const step = rows.length >= 4 ? 30 : rows.length === 3 ? 37 : 49;
  const y0 = rows.length === 1 ? 1420 : rows.length === 2 ? 1390 : rows.length === 3 ? 1378 : 1366;
  return (
    <SVG>
      <rect x={68} y={1336} width={944} height={136} rx={16} fill="#0A1418" stroke={C.cream} strokeWidth={3} opacity={0.96} data-band="ok" />
      {rows.map((s, i) => (
        <text key={i} x={540} y={y0 + i * step} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={fs} fill={C.cream} data-band="ok">{s}</text>
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
  const q = (id: number, d = 20) => ease(f, bAt(id), d);
  const pop = (id: number, d = 18) => spring(f, bAt(id), d);
  const since = (id: number) => f - bAt(id);
  const push = interpolate(f, [0, dur], [1.0, 1.06], {extrapolateRight: 'clamp'});
  let drift = Math.sin(f / 71.3);
  const acc = voice.accentAt ? voice.accentAt(from + f) : 0;
  let picture: React.ReactNode = null;
  let zoom = push;
  let dy = 0;
  // IMPACT JUICE: every beat contact in this shot kicks the camera (a 2 to 4 px shake and a small
  // zoom punch that decays in about 6 frames), so each event reads in the frame as well as the plate.
  const kick = Math.min(1, beats.reduce((acc, b) => {
    const d = f - (b.at * 30 - from);
    return d >= 0 && d < 22 && b.at * 30 >= from && b.at * 30 < from + dur ? acc + Math.exp(-d / 6) : acc;
  }, 0));

  if (n === 1) {
    // HOOK. A rockfish glides in, an x-ray finds the ear stone behind its eye, the stone pops out
    // toward camera, rings showing, and keeps spinning while it drifts closer.
    const swimX = lerp(90, 470, q(1, 70));
    const xr = q(2, 18) * (1 - ease(f, bAt(3) + 10, 12));
    const popK = pop(3, 22);
    const out = clamp01(since(3) / 4);
    // the sagittal stone sits behind and below the eye: eye at +90 local, stone 34 behind it
    const head = {x: swimX + 56 * 2.6, y: 900 + 2 * 2.6};
    const sx = lerp(head.x, 520, popK), sy = lerp(head.y, 1060, popK);
    const drift = clamp01(since(3) / Math.max(1, dur - bAt(3)));
    const squash = since(3) > 0 ? 0.675 + 0.325 * Math.cos((since(3) / 36) * Math.PI * 2) : 1;
    picture = (
      <SVG>
        <Water f={f} id="s1" />
        {/* a pollock school at depth, crossing the other way */}
        <g opacity={0.45}>
          {Array.from({length: 7}, (_, i) => (
            <Groundfish key={i} x={1180 - f * (1.6 + (i % 3) * 0.3) - i * 70} y={560 + (i % 4) * 46 + Math.sin(f / 30 + i) * 8} scale={0.42 + (i % 3) * 0.06}
              f={f + i * 9} facing={-1} kind="pollock" swim={0.9} caustics={false} />
          ))}
        </g>
        <Groundfish x={swimX} y={900} scale={2.6} f={f} kind="rockfish" swim={0.8} xray={xr} stoneOut={out} />
        {since(3) >= 0 && (
          <g>
            <SpeedLines cx={sx} cy={sy} frame={f} intensity={Math.max(0, 1 - since(3) / 16)} color={C.pearl} />
            <g transform={`translate(${sx},${sy}) scale(1,${squash}) translate(${-sx},${-sy})`}>
              <Otolith x={sx} y={sy} scale={lerp(0.12, 0.72, popK) * (1 + 0.15 * drift)} f={f} rot={-10 + 8 * Math.sin(f / 20)} mode="pearl" counted={0.45} shadow={false} />
            </g>
          </g>
        )}
        <Plate text="A FISH BORN ABOUT 1878." y={500} size={42} p={1} />
        <BrassSign x={540} y={598} lines={['WHO COUNTED?']} size={40} rot={1.5 * Math.sin(f / 22)} />
        <Plate text="ALEUTIANS · 2022" y={1250} size={30} p={q(2, 12)} />
      </SVG>
    );
    zoom = 1 + 0.05 * (f / dur);
  } else if (n === 2) {
    // BORN ABOUT 1878. The stone lands under the objective; each counter click pulses one ring
    // outward while the year drum whirs back on its own. The counter stays low: 0144 is saved.
    const land = spring(f, 0, 16);
    const clicks = Math.max(0, Math.floor(since(5) / 12) + 1);
    const nClicks = Math.min(6, since(5) >= 0 ? clicks : 0);
    const clickPhase = since(5) >= 0 && nClicks < 6 ? (since(5) % 12) / 12 : 1;
    const yearK = interpolate(f, [bAt(5), bAt(6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
    const slam = pop(6, 14);
    const shake = since(6) >= 0 && since(6) < 10 ? Math.sin(since(6) * 3) * (10 - since(6)) * 0.8 : 0;
    const press = since(5) >= 0 && nClicks < 6 ? clamp01(1 - clickPhase * 3) : 0;
    const signDrop = pop(7, 18);
    const tuck = ease(f, bAt(7) - 14, 16);
    const drumS = lerp(1.0 * (0.9 + 0.1 * slam), 0.62, tuck);
    picture = (
      <SVG>
        <g transform={`translate(${shake},0)`}>
          <Bench f={f} id="s2" />
          <BenchLip f={f} />
          <BenchScope x={540} y={860} scale={1.05} drop={ease(f, 0, 12)} lamp={1} f={f} />
          <Otolith x={540} y={860 - 200 * (1 - land)} scale={1.55} f={f} rings={14} counted={nClicks / 14 + (since(6) > 0 ? 0.6 * ease(f, bAt(6), 40) : 0)}
            pulse={since(5) >= 0 && nClicks < 6 ? clickPhase : 0} rot={-8} />
          <TallyCounter x={830} y={1105} scale={0.62} count={nClicks + 0.0} press={press} plate="RINGS" />
          <InkHand x={828 + 60 * (1 - q(5, 8))} y={1000 + 6 * press - 50 * (1 - q(5, 8))} rot={-45} s={0.62} press={press} sleeve="#b23a3a" />
          {since(6) >= 0 && since(6) < 12 && <ImpactStar cx={280} cy={560} r={190} color={C.lamp} />}
          {/* the drum whirs upper LEFT, clear of the objective's nose, then tucks straight down to its corner */}
          <YearDrum x={lerp(280, 265, tuck)} y={lerp(560, 1110, tuck)} scale={drumS} year={2022 - 144 * yearK} label={since(6) >= 0 ? 'BORN · EST.' : 'CAUGHT'} />
          {slam > 0.02 && <Plate text="EST. 144 YEARS OLD · PER NOAA" y={1260} size={30} p={slam * (1 - ease(f, bAt(7) - 6, 6))} />} {/* plate-overlap-ok: sequenced, EAR STONE is gone before this one slams in on q(6) */}
          {signDrop > 0.01 && <BrassSign x={540} y={lerp(1060, 1240, Math.min(1, signDrop))} lines={['WHO COUNTED?']} size={40} s={0.95} rot={4 * Math.sin(since(7) / 4) * Math.exp(-since(7) / 14)} />}
          <Plate text="EAR STONE" y={1265} size={30} p={q(4, 12) * (1 - ease(f, bAt(6) - 8, 8))} /> {/* plate-overlap-ok: sequenced, it retires fully before q(6) lands the next plate */}
        </g>
      </SVG>
    );
    zoom = 1 + 0.04 * (f / dur);
  } else if (n === 3) {
    // EAR STONES, LIKE A TREE. A cutaway of the head shows the PAIR behind the eye; the fish lifts
    // out of the way, the pair settles at left, and a sawn cross-section at right counts ring for ring.
    const open = ease(f, 0, 22);
    const lift = q(10, 24);
    const ringK = interpolate(f, [bAt(11), dur - 10], [0.05, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const pulse = since(11) >= 0 ? ((since(11) % 18) / 18) : 0;
    const treeIn = spring(f, bAt(12), 20);
    const fx = lerp(560, 600, lift), fy = lerp(835, 680, lift), fs = lerp(2.9 * open + 0.34, 1.8, lift); // 90 percent: the tail stays in frame
    // the pair behind the eye, in fish-local units scaled by fs
    const sA = {x: fx + 58 * fs, y: fy - 2 * fs}, sB = {x: fx + 46 * fs, y: fy + 12 * fs};
    picture = (
      <SVG>
        <rect width={W} height={H} fill="#0C2028" />
        {Array.from({length: 24}, (_, i) => <path key={i} d={`M${i * 48 + (f * 0.3) % 48},0 V1920`} stroke="#14343F" strokeWidth={1.5} />)} {/* caption-band-ok */}
        {Array.from({length: 40}, (_, i) => <path key={i} d={`M0,${i * 48} H1080`} stroke="#14343F" strokeWidth={1.5} />)} {/* caption-band-ok */}
        <g opacity={1 - 0.45 * lift}>
          <Groundfish x={fx} y={fy} scale={fs} f={f} kind="rockfish" swim={0.15} xray={open} stoneOut={lift} caustics={false} />
        </g>
        {since(9) >= 0 && lift < 0.6 && <ellipse cx={(sA.x + sB.x) / 2} cy={(sA.y + sB.y) / 2} rx={34 + 22 * q(9, 10)} ry={24 + 10 * q(9, 10)} fill="none" stroke={C.lamp} strokeWidth={5} opacity={0.85 * (1 - lift)} />}
        {/* dotted leaders from the head to where the pair lands */}
        {lift > 0.05 && <path d={`M${sA.x},${sA.y} Q${(sA.x + 260) / 2},${sA.y + 200} 260,1000`} fill="none" stroke={C.pearl} strokeWidth={3} strokeDasharray="6 10" opacity={0.5 * lift} />}
        <Otolith x={lerp(sA.x, 300, lift)} y={lerp(sA.y, 960, lift)} scale={lerp(0.042 * fs, 0.6, lift)} f={f} mode="xray" rot={-6} counted={ringK} pulse={pulse} />
        <Otolith x={lerp(sB.x, 300, lift)} y={lerp(sB.y, 1170, lift)} scale={lerp(0.036 * fs, 0.45, lift)} f={f} mode="xray" rot={174} counted={ringK} pulse={pulse} />
        {treeIn > 0.01 && <TreeRings x={lerp(1300, 790, treeIn)} y={1040} scale={0.95} counted={ringK} pulse={pulse} f={f} />}
        <Plate text="A PAIR OF EAR STONES" y={495} size={32} p={q(8, 12) * (1 - ease(f, bAt(10) - 6, 6))} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
        <Plate text="OTOLITH · EAR STONE" y={495} size={32} p={q(10, 12) * (1 - ease(f, bAt(11) - 6, 6))} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
        <Plate text="ONE RING A YEAR" x={300} y={1265} size={28} p={q(11, 12)} />
        <Plate text="LIKE A TREE" x={790} y={1265} size={28} p={q(12, 12)} />
        <Motes f={f} color="#BFEFF7" op={0.16} />
      </SVG>
    );
  } else if (n === 4) {
    // THE READER. A NOAA Alaska Fisheries Science Center reader peers into a brass microscope and
    // clicks a counter on every ring; trays pile up behind until the stack hits the ceiling.
    const crane = 1 - ease(f, 0, 40);
    const clickN = Math.floor(f / 11);
    const click = (f % 11) / 11;
    const trayStart = (i: number) => bAt(14) - 6 + (i * (bAt(15) - 10 - (bAt(14) - 6))) / 8;
    const trays = Array.from({length: 9}, (_, i) => i).filter((i) => f >= trayStart(i)).length;
    const hit = pop(15, 16);
    picture = (
      <SVG>
        <Bench f={f} id="s4" velvet={false} lampX={360} lampY={900} />
        <BenchLip f={f} />
        {/* the tray stack behind, sliding in and piling to the ceiling */}
        {Array.from({length: trays}, (_, i) => {
          const sl = spring(f, trayStart(i), 12);
          const y = 1080 - i * 74;
          // from "under microscopes" the trays come FASTER: speed streaks trail each one in
          const streak = q(14, 10) * clamp01(1 - Math.abs(sl - 0.5) * 2);
          return (
            <g key={i} transform={`translate(${lerp(1200, 0, sl)},0)`}>
              {streak > 0.02 && [0, 1, 2].map((k) => <path key={k} d={`M${972 + k * 10},${y + 14 + k * 16} h${120 + 60 * k}`} stroke={C.pearl} strokeWidth={4} strokeLinecap="round" opacity={0.5 * streak} />)}
              <rect x={600} y={y} width={360} height={60} rx={6} fill="#4A3020" stroke={C.ink} strokeWidth={4} />
              <rect x={604} y={y + 4} width={352} height={10} rx={4} fill="#6A4A30" opacity={0.6} />
              {Array.from({length: 7}, (_, k) => <ellipse key={k} cx={628 + k * 48} cy={y + 32} rx={16} ry={11} fill={C.pearl} stroke={C.ink} strokeWidth={2} />)}
            </g>
          );
        })}
        {hit > 0.02 && since(15) < 14 && <ImpactStar cx={780} cy={420} r={150 * hit} color={C.lamp} />}
        {/* she stands behind the scope with her eye at the eyepiece (rig face at feet - 400 x scale) */}
        <g transform={`translate(0,${9 * clamp01(1 - click * 3)}) translate(250,1270) scale(1,${1 + 0.025 * Math.sin((f / 60) * Math.PI * 2)}) translate(-250,-1270)`}>
          <Character frame={from + f} x={250} y={1270} scale={1.05} facing={1} pose="carry" gesture={0.6 + 0.4 * clamp01(1 - click * 3)} emotion="neutral" outfit="flannel"
            hairStyle="long" glasses headgear="bare" idleGain={1.2} />
        </g>
        <Microscope x={358} y={1285} s={1.1} />
        <TallyCounter x={384} y={1078} scale={0.45} count={40 + clickN + click} press={clamp01(1 - click * 3)} steam={q(16, 20)} f={f} worn={0.4} />
        {/* the pace: the counter STEAMS, three fat puffs that read at phone size, while her thumb keeps clicking */}
        {q(16, 12) > 0.01 && [0, 1, 2].map((k) => {
          const ph = ((since(16) + k * 9) % 27) / 27;
          return <path key={k} d={`M${372 + (k - 1) * 22},${1020 - ph * 120} q14,-18 0,-36 q-14,-18 0,-36`} fill="none" stroke="#F2EBDA"
            strokeWidth={9} strokeLinecap="round" opacity={0.75 * q(16, 12) * Math.sin(Math.PI * ph)} />;
        })}
        <Plate text="NOAA ALASKA FISHERIES SCIENCE CENTER" y={500} size={28} p={q(13, 12) * (1 - ease(f, bAt(15) - 14, 6))} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
        {hit > 0.02 && <StatBurst cx={780} cy={760} scale={1.0 * hit} big="30,000+" lines={['STONES A YEAR', 'PER NOAA']} fill={C.lamp} big_fs={58} fontBig={SERIF} fontSub={MONO} />}
        <Plate text="COUNTED BY HAND" x={300} y={500} size={30} p={q(16, 10)} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
      </SVG>
    );
    dy = -120 * crane;
  } else if (n === 5) {
    // A FASTER READER. The NIR reader slides in on rails with its plate already draped, the beam
    // hits a small pollock stone with a BLANK specimen label (never the 1878 stone), the model block
    // lights, and the machine prints an age in machine type.
    // ONE eased arrival from off right, with a small settle (round 4: the old spring overshot 31 percent
    // INSIDE the whip and read as a positional pop). `eff` is the machine's on-screen centre; the
    // whipped group's coordinate is eff + whip, so the whip can't fight the slide.
    const arrive = ease(f, bAt(17) - 3, 13);
    const settle = since(17) >= 10 ? -20 * Math.sin((since(17) - 10) * 0.6) * Math.exp(-(since(17) - 10) / 5) : 0;
    const whip0 = f < 8 ? (8 - f) * 30 : 0;
    const mx = lerp(1560, 660, arrive) + settle - 60 + whip0;
    const beam = q(19, 10);
    const model = q(20, 14);
    const spec = ease(f, bAt(20), 40);
    const tagOut = pop(21, 14);
    const whip = whip0;
    const ripple = 1 - 0.08 * Math.sin(q(18, 16) * Math.PI);
    picture = (
      <SVG>
        <rect x={-500} width={W + 1000} height={H} fill={C.bench} />
        <g transform={`translate(${-whip},0)`}>
          <rect x={W - 20} width={500} height={H} fill={C.bench} />
          <Bench f={f} id="s5" velvet={false} lampX={160} lampY={980} />
          {[260, 760].map((lx, i) => (
            <g key={lx} transform={`translate(${lx},0) rotate(${Math.sin(f / 47 + i * 1.7) * 1.5} 0 0)`}>
              <path d="M0,0 L0,300" stroke={C.ink} strokeWidth={5} />
              <path d="M-70,368 L-30,300 L30,300 L70,368 Z" fill={tones(C.brass).core} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              <ellipse cx={0} cy={369} rx={72} ry={14} fill={C.lamp} stroke={C.ink} strokeWidth={3} />
              <path d="M-70,376 L-210,780 L210,780 L70,376 Z" fill={C.lamp} opacity={0.06} />
            </g>
          ))}
          <BenchLip f={f} />
          <Microscope x={262} y={1280} s={0.62} />
          {/* a 2 s breath and a 4 s weight shift run under everything; on the beam (35.1) she RECOILS back
              for 10 frames, hops, then leans in; at AGE (40.8) her head turns up toward the slot */}
          <g transform={`translate(${150 + 12 * Math.sin((f / 120) * Math.PI * 2)},${1290 - 16 * Math.sin(Math.PI * clamp01(since(19) / 12)) * (since(19) >= 0 ? 1 : 0) - 10 * Math.sin(Math.PI * clamp01(since(21) / 10)) * (since(21) >= 0 ? 1 : 0)}) rotate(${3.5 * q(17, 24) - (since(19) >= 0 && since(19) < 10 ? 9 * Math.sin(Math.PI * since(19) / 10) : 0) + 5 * ease(f, bAt(19) + 8, 14) + 1.5 * Math.sin((f / 120) * Math.PI * 2 + 1)}) scale(1,${1 + 0.035 * Math.sin((f / 60) * Math.PI * 2)}) translate(-150,-1290)`}>
            <Character frame={from + f} x={150} y={1290} scale={0.9} facing={1} pose="carry" gesture={0.6 + 0.4 * (1 - q(17, 20))}
              emotion={since(17) > 6 && since(17) < 60 ? 'shock' : 'neutral'} outfit="flannel" hairStyle="long" glasses idleGain={1.4}
              look={-12 * ease(f, bAt(21) - 4, 10)} />
          </g>
          <NIRReader x={mx + 60} y={1290} scale={1.18} f={f} beam={beam} spectrum={spec} seed={3} plate="TRAINED ON THE ARCHIVE" cloth={ripple}
            slot={tagOut > 0.01 ? <MachineTag x={0} y={60 * (1 - tagOut)} s={0.9} /> : null} />
          {/* the small pollock stone in the sample port, a blank specimen label */}
          <g transform={`translate(${mx + 60 - 236},${1290 - 248})`}>
            <Otolith x={0} y={0} scale={0.24} f={f} rings={8} mode={beam > 0.2 ? 'nir' : 'pearl'} counted={0.6} shadow={false} />
            <AgeTag x={30} y={-6} text="" f={f} scale={0.5} />
          </g>
          {/* the model block, glowing inside the body */}
          <g transform={`translate(${mx + 60},${1290 - 190})`} opacity={model}>
            {Array.from({length: 4}, (_, r) => Array.from({length: 6}, (_, c) => (
              <circle key={`${r}${c}`} cx={-70 + c * 28} cy={-24 + r * 16} r={6}
                fill={C.nir} opacity={0.4 + 0.6 * Math.abs(Math.sin(f / 6 + r + c))} />
            )))}
          </g>
          {since(17) >= 0 && since(17) < 12 && <ImpactStar cx={mx - 300} cy={1250} r={90} color={C.brass} />}
        </g>
        <Plate text="A FASTER READER" y={790} size={34} p={q(17, 12) * (1 - ease(f, bAt(19) - 6, 6))} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
        <Plate text="?" x={mx + 60} y={1170} size={26} p={q(18, 10) * (1 - ease(f, bAt(19) - 6, 6))} />
        <Plate text="NEAR-INFRARED LIGHT" y={790} size={32} tone="nir" p={q(19, 10) * (1 - ease(f, bAt(20) - 6, 6))} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
        <Plate text="MACHINE LEARNING" y={790} size={32} tone="nir" p={q(20, 10) * (1 - ease(f, bAt(21) - 6, 6))} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
      </SVG>
    );
  } else if (n === 6) {
    // WHAT EACH ONE SEES. Eyepiece left (a generic stone, rings ticked off, a thumb on the counter),
    // spectrum right. The stat builds across the seam; MICROSCOPE STILL IN THE PROCESS sits below.
    const ring = interpolate(f, [0, dur], [0.15, 1], {extrapolateRight: 'clamp'});
    const pulse = (f % 16) / 16;
    const s600 = pop(22, 14), s800 = pop(23, 14);
    const needle = Math.sin(f / 9) * 0.5 + 0.5;
    picture = (
      <SVG>
        <Bench f={f} id="s6" velvet={false} lampX={540} lampY={880} />
        <BenchLip f={f} />
        {/* the split pair sits at 88 percent about its own centre: 60 px or more from both frame edges */}
        <g transform="translate(540 930) scale(0.88) translate(-540 -930)">
        {/* LEFT: the eyepiece */}
        <defs><clipPath id="s6eye"><circle cx={280} cy={930} r={230} /></clipPath></defs>
        <circle cx={280} cy={930} r={248} fill="#000" stroke={C.brass} strokeWidth={14} />
        <g clipPath="url(#s6eye)">
          <rect x={30} y={680} width={500} height={500} fill="#2A1A12" />
          <ellipse cx={280} cy={930} rx={240} ry={240} fill={C.lamp} opacity={0.18 + 0.12 * q(24, 10)} />
          <Otolith x={280} y={930} scale={1.0} rings={8} f={f} counted={ring} pulse={pulse} rot={14} shadow={false} />
        </g>
        <TallyCounter x={150} y={1150} scale={0.58} count={88 + Math.floor(f / 16) + (f % 16) / 16} press={clamp01(1 - pulse * 3)} />
        {/* RIGHT: the spectrum screen, a scan line sweeping it */}
        <rect x={570} y={700} width={470} height={460} rx={18} fill="#071116" stroke={C.brass} strokeWidth={10} />
        {Array.from({length: 7}, (_, i) => <path key={i} d={`M${590 + i * 70},720 V1140`} stroke="#18343C" strokeWidth={2} />)}
        <SpectralLine x={600} y={760} w={410} h={340} seed={3} progress={ease(f, 0, 50)} width={6} />
        <rect x={590 + 400 * needle} y={720} width={4} height={420} fill={C.nir} opacity={0.5} />
        <path d="M540,640 V1222" stroke={C.cream} strokeWidth={4} opacity={0.6} />
        </g>
        {s600 > 0.02 && since(23) < 0 && <StatBurst cx={540} cy={620} scale={0.8 * s600} big="600%" lines={['PER NOAA']} fill={C.lamp} big_fs={80} fontBig={SERIF} fontSub={MONO} />}
        {since(23) >= 0 && since(23) < 10 && <ImpactStar cx={540} cy={620} r={260} color={C.lamp} />}
        {s800 > 0.02 && <StatBurst cx={540} cy={620} scale={1.25 * s800} big="600 TO 800%" lines={['MORE EFFICIENT', 'PER NOAA']} fill={C.lamp} big_fs={34} fontBig={SERIF} fontSub={MONO} />}
        <Plate text="PER NOAA" y={500} size={28} p={ease(f, 0, 10) * (1 - ease(f, bAt(22) - 6, 6))} />
        {/* c8 is never shown without c9: the qualifier lands 0.4 s after the 800 and holds to the cut */}
        <Plate text="MICROSCOPE STILL IN THE PROCESS" x={540} y={1250} size={28} p={ease(f, bAt(23) + 12, 10)} />
      </SVG>
    );
    zoom = 1 + 0.03 * (f / dur);
  } else if (n === 7) {
    // YOU NEED THE AGE FIRST. Inside: the machine's 7 drains away, the line runs into an empty slot,
    // and the same WHO COUNTED? sign swings down into it, asked of the machine this time.
    const drain = q(25, 18);
    const run = ease(f, bAt(25) + 6, 30);
    const recoil = since(26) >= 0 ? Math.sin(since(26) / 3) * Math.exp(-since(26) / 10) * 40 * q(26, 4) : 0;
    const wob = Math.sin(f / 5) * 12;
    picture = (
      <SVG>
        <MachineInside f={f} />
        {/* the line first, so it runs INTO the slot behind its brass frame */}
        <g transform={`translate(${recoil},0)`}>
          <SpectralLine x={-40} y={760} w={lerp(80, 480, run)} h={260} seed={3} progress={1} width={7} />
        </g>
        <g transform="translate(540,900) scale(2.2)">
          <rect x={-64} y={-62} width={128} height={124} rx={10} fill="#081014" stroke={C.ink} strokeWidth={6} />
          <rect x={-64} y={-62} width={128} height={124} rx={10} fill="none" stroke={C.brass} strokeWidth={8} />
          <rect x={-55} y={-95} width={110} height={26} rx={6} fill="#081014" stroke={C.ink} strokeWidth={2} />
          <text x={0} y={-76} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.brass}>AGE OUT</text>
          <clipPath id="s7slot"><rect x={-60} y={-58} width={120} height={116} rx={8} /></clipPath>
          <g clipPath="url(#s7slot)">
            {[0.5, 0.3].map((gk, i) => <MachineTag key={i} x={0} y={110 * Math.pow(clamp01((since(25) - 1 - i) / 10), 2)} s={0.85} op={gk * (since(25) > 1 ? 1 : 0)} />)}
            <MachineTag x={0} y={110 * Math.pow(clamp01(since(25) / 10), 2) * (drain > 0 ? 1 : 0)} s={0.85} />
          </g>
          {drain > 0.6 && <SlotPlate x={0} y={-60 + 60 * spring(f, bAt(25) + 14, 16)} s={1} wob={wob * 0.5} />}
        </g>
        <Motes f={f} color={C.nir} op={0.2} />
      </SVG>
    );
    zoom = 1.08 + 0.4 * ease(f, 0, dur);
  } else if (n === 8) {
    // THE TAGGING TABLE. An Alaska pollock drops its stone on the first tag; the reader's inked hand
    // writes the age, copied off her RINGS counter along a dotted path; the hand leaves; tagged stones
    // march to the hopper; the brass count lands on 8,617. A CLOSED, lit door waits at the back.
    const truck = interpolate(f, [0, dur], [30, -30]);
    const fishK = ease(f, bAt(27) - 24, 26);
    const drop = spring(f, bAt(27), 14);
    const write = ease(f, bAt(28), 34);
    const door = q(29, 30);
    const march = clamp01((f - bAt(30)) / 110);
    const LAND = 56; // the count climbs from "thousand" (58.22) and lands as "seventeen" ends (about 60.1, just before "pollock" at 60.22)
    const countK = q(31, LAND);
    const cnt = since(31) >= LAND ? 8617 : Math.floor(8617 * countK * countK);
    const handIn = ease(f, bAt(28) - 18, 16) * (1 - ease(f, bAt(30) - 14, 14));
    const tug = write > 0 && write < 1 ? Math.sin(f * 1.3) * 6 : 0;
    const flare = since(29) >= 0 ? Math.exp(-since(29) / 14) : 0;
    picture = (
      <SVG>
        <g transform={`translate(${truck},0)`}>
          <rect x={-200} width={1480} height={H} fill="#102229" />
          <rect x={-200} y={0} width={1480} height={980} fill="#0D1C22" />
          {Array.from({length: 9}, (_, i) => <rect key={i} x={-160 + i * 170} y={0} width={6} height={980} fill="#173038" />)}
          <rect x={-200} y={236} width={1480} height={26} fill="#173038" stroke={C.ink} strokeWidth={4} />
          {/* two pendant lamps over the tagging table */}
          {[300, 800].map((lx, i) => (
            <g key={lx} transform={`translate(${lx},0) rotate(${Math.sin(f / 47 + i * 1.7) * 1.5} 0 0)`}>
              <path d="M0,0 L0,262" stroke={C.ink} strokeWidth={5} />
              <path d="M-70,330 L-30,262 L30,262 L70,330 Z" fill={tones(C.brass).core} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              <ellipse cx={0} cy={331} rx={72} ry={14} fill={C.lamp} stroke={C.ink} strokeWidth={3} />
              <path d="M-70,338 L-230,1000 L230,1000 L70,338 Z" fill={C.lamp} opacity={0.06} />
            </g>
          ))}
          {/* the far door, CLOSED, light leaking under it, its name on a wide transom sign */}
          <g transform="translate(220,975)">
            <rect x={-136} y={-372} width={272} height={92} rx={6} fill="#2A1C14" stroke={C.ink} strokeWidth={5} />
            <text x={0} y={-334} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.lamp} opacity={0.45 + 0.55 * door}>STOCK</text>
            <text x={0} y={-298} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.lamp} opacity={0.45 + 0.55 * door}>ASSESSMENT</text>
            <rect x={-96} y={-276} width={192} height={276} fill="#3A2A1E" stroke={C.ink} strokeWidth={6} />
            {[0, 1].map((k) => <rect key={k} x={-76} y={-256 + k * 130} width={152} height={110} fill="none" stroke="#2A1C14" strokeWidth={4} />)}
            <circle cx={66} cy={-130} r={8} fill={C.brass} stroke={C.ink} strokeWidth={2} />
            <rect x={-96} y={-8} width={192} height={10} fill={C.lamp} opacity={0.3 + 0.6 * door + 0.4 * flare} />
            <path d="M-96,2 L-200,70 L200,70 L96,2 Z" fill={C.lamp} opacity={0.1 * door + 0.25 * flare} />
            {flare > 0.05 && <path d="M-60,-4 L60,-4" stroke="#FFF6DC" strokeWidth={4} opacity={flare} />}
          </g>
          {/* the training count, the same brass counter, large; its hit star sits BEHIND it. ROUND 4 BLOCKER:
              at (640,640) its POLLOCK STONES plate ran behind the hopper and lost its final S. The counter
              now sits at (600,680) and the hopper at 895 with a narrower mouth: the plate's right end is
              at x 719 and the hopper's left wall at that height is at x 786, a 67 px clear gap. */}
          {since(31) >= LAND && since(31) < LAND + 12 && <ImpactStar cx={600} cy={680} r={170} color={C.lamp} />}
          <TallyCounter x={600} y={680} scale={0.95} count={cnt} plate="POLLOCK STONES" />
          {/* the table first, so the marching stones can pass BEHIND the hopper into it */}
          <rect x={-200} y={1000} width={1480} height={920} fill="#3E2A1D" stroke={C.ink} strokeWidth={6} /> {/* caption-band-ok */}
          <rect x={-200} y={1000} width={1480} height={22} fill="#5A3E2A" />
          {Array.from({length: 18}, (_, i) => <path key={i} d={`M-200,${1060 + i * 48} C300,${1052 + i * 48} 700,${1070 + i * 48} 1280,${1058 + i * 48}`} fill="none" stroke="#2A1C14" strokeWidth={3} opacity={0.5} />)}
          {/* marching tagged stones, center to hopper */}
          {Array.from({length: 8}, (_, i) => {
            const u = clamp01(march * 1.7 - i * 0.11);
            if (u <= 0) return null;
            const x = lerp(560, 895, u), y = 975 - Math.abs(Math.sin(u * Math.PI * 5)) * 18;
            return <g key={i} opacity={u > 0.98 ? 0 : 1}>
              <Otolith x={x} y={y} scale={0.24} rings={8} f={f} counted={0.5} shadow={false} />
              <AgeTag x={x + 26} y={y - 10} text={String(3 + i)} f={f + i * 7} scale={0.6} />
            </g>;
          })}
          {/* hopper on the right */}
          <g transform="translate(895,1010)">
            <defs><linearGradient id="s8hop" x1="0" y1="0" x2="1" y2="0.3">
              <stop stopColor={tones(C.teal).key} /><stop offset="0.45" stopColor={tones(C.teal).base} /><stop offset="1" stopColor={tones(C.teal).shade} />
            </linearGradient></defs>
            <ContactShadow cx={0} cy={0} rx={130} ry={14} opacity={0.5} />
            <path d="M-115,-330 L115,-330 L55,-80 L-55,-80 Z" fill="url(#s8hop)" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
            <path d="M-104,-318 L-50,-92" stroke="#FFFFFF" strokeWidth={5} opacity={0.22} strokeLinecap="round" />
            {[-90, -35, 20, 75].map((rx, i) => <circle key={i} cx={rx} cy={-300} r={5} fill={tones(C.brass).key} stroke={C.ink} strokeWidth={2} />)}
            <path d="M-100,-318 L100,-318" stroke={C.nir} strokeWidth={5} opacity={0.7} />
            <rect x={-64} y={-80} width={128} height={80} fill={tones(C.brass).core} stroke={C.ink} strokeWidth={6} />
            {Array.from({length: 4}, (_, i) => <circle key={i} cx={-48 + i * 32} cy={-40} r={5} fill={tones(C.brass).key} stroke={C.ink} strokeWidth={2} />)}
          </g>
          {/* the training set has a body: rows of stones wait on the near table from the first frame (round 4:
              the lower half sat empty until 58 s), and each one's TAG pops on as the count climbs */}
          {Array.from({length: 36}, (_, i) => {
            const r = Math.floor(i / 9), c = i % 9;
            const sx = 110 + c * 104 + (r % 2) * 40, sy = 1110 + r * 52, sc = 0.15 + r * 0.02;
            const tagK = spring(f, bAt(31) + (LAND - 8) * (i + 0.5) / 36, 10);
            return <g key={i}>
              <Otolith x={sx} y={sy} scale={sc} rings={6} f={0} counted={1} shadow={false} rot={-8 + (i % 5) * 4} />
              {tagK > 0.02 && <g transform={`translate(${sx + 14},${sy - 6}) scale(${Math.min(1.1, tagK)}) translate(${-(sx + 14)},${-(sy - 6)})`}>
                <AgeTag x={sx + 14} y={sy - 6} text={String(2 + (hash(i) % 8))} f={f + i * 3} scale={0.34} />
              </g>}
            </g>;
          })}
          {/* the first tag and stone, center stage */}
          <g transform="translate(420,960)">
            <AgeTag x={-30} y={-40} text="7" f={f} scale={2.0} swing={tug} />
            <Otolith x={10} y={-10 - 160 * (1 - drop)} scale={0.5} rings={8} f={f} counted={0.6} />
          </g>
          {/* the reader's inked hand ties the marked tag on at its knot, tugs it, and withdraws off frame right */}
          <InkHand x={lerp(1260, 400, handIn) + tug} y={928 + 0.5 * tug} rot={-10} s={0.62} sleeve="#5A6B78" />
          {/* the Alaska pollock, swimming in to drop its stone, then leaving */}
          <g opacity={1 - ease(f, bAt(27) + 26, 20)}>
            <Groundfish x={lerp(-360, 250, fishK) + 300 * ease(f, bAt(27) + 6, 30)} y={862} scale={1.8} f={f} kind="pollock" swim={0.8} caustics={false} />
          </g>
        </g>
        <Plate text="ALASKA POLLOCK" y={500} size={30} p={q(27, 10) * (1 - ease(f, bAt(28) - 6, 6))} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
        <Plate text="COLLECTED 2014 TO 2018 · PER NOAA" y={500} size={30} p={q(28, 10) * (1 - ease(f, bAt(30) - 6, 6))} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
        <Plate text="TAGGED WITH AGES" y={500} size={30} p={q(30, 10) * (1 - ease(f, bAt(31) + LAND - 10, 6))} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
        <Plate text="8,617 POLLOCK STONES · 2023" y={500} size={30} p={ease(f, bAt(31) + LAND, 8)} /> {/* plate-overlap-ok: sequenced, TAGGED WITH AGES retires at LAND - 4 and this one lands at LAND */}
        <Motes f={f} color={C.lamp} op={0.14} />
      </SVG>
    );
  } else if (n === 9) {
    // THE ARCHIVE. The bench wall falls away into a corridor of drawers receding to a vanishing point;
    // the camera dollies forward as the drawers light in a wave; a hanging brass sign carries the count.
    const fall = ease(f, 0, 26);
    const lit = interpolate(f, [bAt(33), bAt(34)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const signIn = pop(34, 18);
    // ROUND 4: the payoff drawer opened half off the left edge. The brass sign lifts away on its chains,
    // then the camera PANS to a drawer on the near left wall, so it opens fully in frame (about x 184 to
    // 468 on screen at the shot's 1.25 push), lit inside, a row of vials glinting in it.
    const signOut = ease(f, bAt(35) - 18, 14);
    const pan = 230 * ease(f, bAt(35) - 16, 30);
    picture = (
      <SVG>
        <rect width={W} height={H} fill="#081216" />
        <radialGradient id="s9fog" cx="0.5" cy="0.47" r="0.35"><stop stopColor="#1F4A55" stopOpacity={0.9} /><stop offset="1" stopColor="#1F4A55" stopOpacity={0} /></radialGradient>
        <g transform={`translate(${pan},0)`}>
        <ArchiveDrawers f={f} vx={540} vy={880} rows={10} cols={7} depth={7} glint={0.3 + 0.9 * lit}
          open={{row: 5, col: 1, t: ease(f, bAt(35), 22)}} />
        <ellipse cx={540} cy={880} rx={260} ry={300} fill="url(#s9fog)" />
        {/* the lighting wave runs down the corridor */}
        {lit > 0 && lit < 1 && <ellipse cx={540} cy={880} rx={520 * (1 - lit) + 40} ry={600 * (1 - lit) + 46} fill="none" stroke={C.lamp} strokeWidth={6} opacity={0.5 * q(33, 12)} />}
        </g>
        {/* the bench wall falling away */}
        {fall < 1 && <g transform={`translate(0,${1400 * fall}) rotate(${10 * fall} 540 1920)`}>
          <rect width={W} height={H} fill="#2A1C14" />
          {Array.from({length: 14}, (_, i) => <rect key={i} x={i * 80} y={0} width={78} height={H} fill={i % 2 ? '#33221A' : '#2C1D14'} stroke="#1A100A" strokeWidth={3} />)}
          <rect x={0} y={0} width={W} height={14} fill={C.lamp} opacity={0.35} />
          <Microscope x={300} y={1200} s={1} />
        </g>}
        {signIn > 0.01 && signOut < 0.99 && <g transform={`translate(0,${-900 * signOut})`}>
          <path d={`M440,380 L440,${lerp(380, 640, Math.min(1, signIn))} M640,380 L640,${lerp(380, 640, Math.min(1, signIn))}`} stroke={C.ink} strokeWidth={4} />
          <BrassSign x={540} y={lerp(560, 700, Math.min(1, signIn))} lines={['2.5 MILLION OTOLITH PAIRS', 'PER NOAA']} size={30} s={1} rot={2 * Math.sin(f / 20)} />
        </g>}
        <Plate text="TRAINED ON ARCHIVE SAMPLES · PER NOAA" y={500} size={26} p={q(32, 12) * (1 - ease(f, bAt(34) - 6, 6))} />
        <Plate text="SINCE THE 1960s" x={720} y={1150} size={32} tone="brass" p={q(35, 12)} />
        <Motes f={f} color={C.lamp} op={0.18} rise={0.15} />
      </SVG>
    );
    zoom = 1 + 0.26 * ease(f, 0, dur);
  } else if (n === 10) {
    // THE HANGAR (signature shot). No person. A 1930s timber hangar in Seattle, a propeller on a beam,
    // open shelving of specimen trays glinting under the trusses, a raven lifting off a rafter, an
    // unlabeled archive stone rising under the Chamberlin sign, and crate latches snapping shut below.
    const fadeIn = ease(f, 0, 14);
    const rise = ease(f, bAt(37), 30);
    const prop = Math.sin(f / 40) * 3;
    picture = (
      <SVG>
        <rect width={W} height={H} fill="#140E0A" />
        {/* caption-band-ok: hangar plank wall, background, floor to ceiling */}
        {Array.from({length: 14}, (_, i) => <rect key={i} x={i * 80} y={0} width={78} height={1380} fill={i % 2 ? '#3A2618' : '#33221A'} stroke="#1A100A" strokeWidth={3} />)}
        {/* the roof: a second, higher truss and the ridge, with two caged work lamps */}
        <path d="M-40,330 L540,70 L1120,330" fill="none" stroke="#4A3020" strokeWidth={22} />
        <path d="M-40,330 L540,70 L1120,330" fill="none" stroke={C.ink} strokeWidth={5} />
        {[200, 380, 700, 880].map((x, i) => <path key={i} d={`M${x},${x < 540 ? 330 - (x + 40) * 0.448 : 330 - (1120 - x) * 0.448} L${x},380`} stroke="#4A3020" strokeWidth={10} />)}
        {[250, 830].map((lx, i) => (
          <g key={lx} transform={`translate(${lx},0) rotate(${Math.sin(f / 53 + i * 2.1) * 1.4} 0 0)`}>
            <path d="M0,0 L0,250" stroke={C.ink} strokeWidth={4} />
            <circle cx={0} cy={272} r={24} fill={C.lamp} stroke={C.ink} strokeWidth={4} />
            {[-1, 0, 1].map((k) => <path key={k} d={`M${k * 14},250 L${k * 22},294`} stroke={C.ink} strokeWidth={3} />)}
            <path d="M-24,282 L-170,640 L170,640 L24,282 Z" fill={C.lamp} opacity={0.07} />
          </g>
        ))}
        {/* concrete hangar floor running under the caption band to the bottom edge */}
        <rect x={0} y={1300} width={W} height={620} fill="#2A2420" stroke={C.ink} strokeWidth={4} /> {/* caption-band-ok */}
        {Array.from({length: 7}, (_, i) => <path key={i} d={`M${-400 + i * 300},1920 L${240 + i * 100},1300`} stroke="#1A1612" strokeWidth={3} opacity={0.7} />)}
        {[1380, 1500, 1660, 1860].map((y) => <path key={y} d={`M0,${y} H${W}`} stroke="#1A1612" strokeWidth={3} opacity={0.6} />)}
        <path d="M-40,620 L540,380 L1120,620" fill="none" stroke="#5A3A22" strokeWidth={26} />
        <path d="M-40,620 L540,380 L1120,620" fill="none" stroke={C.ink} strokeWidth={6} />
        {[160, 360, 720, 920].map((x, i) => <path key={i} d={`M${x},620 L540,380`} stroke="#4A3020" strokeWidth={12} />)}
        <rect x={-20} y={610} width={1120} height={24} fill="#5A3A22" stroke={C.ink} strokeWidth={5} />
        {/* a band of hangar windows under the eaves */}
        {Array.from({length: 9}, (_, i) => (
          <g key={i}>
            <rect x={64 + i * 108} y={392} width={84} height={46} fill="#1C2A30" stroke={C.ink} strokeWidth={4} />
            <path d={`M${106 + i * 108},392 V438 M${64 + i * 108},415 H${148 + i * 108}`} stroke={C.ink} strokeWidth={3} />
            <rect x={66 + i * 108} y={394} width={80} height={42} fill="#8FB7C2" opacity={0.22} />
            <rect x={68 + i * 108} y={396} width={36} height={16} fill="#CFE6EE" opacity={0.3} />
          </g>
        ))}
        {/* the propeller hangs on the back wall, two twisted blades and a spinner cone */}
        <g transform={`translate(540,575) rotate(${prop}) scale(1.2)`}>
          <path d="M-250,10 C-170,-26 -46,-18 0,0 C46,-18 170,-26 250,10 C170,22 46,16 0,6 C-46,16 -170,22 -250,10 Z" fill="#6A4628" stroke={C.ink} strokeWidth={6} />
          <path d="M-240,6 C-170,-12 -60,-10 -12,-2 M240,6 C170,-12 60,-10 12,-2" fill="none" stroke="#9A7048" strokeWidth={4} opacity={0.7} />
        </g>
        <path d="M540,575 m-26,0 a26,26 0 1,0 52,0 a26,26 0 1,0 -52,0" fill={tones(C.brass).core} stroke={C.ink} strokeWidth={5} />
        <path d="M526,566 L540,547 L554,566 Z" fill={tones(C.brass).key} stroke={C.ink} strokeWidth={3} />
        {(() => {
          // ROUND 4: the raven was a speck that left in three frames. It is twice the size now, perched
          // on the truss for the caw, then it climbs under the lit window band and flies the width of the
          // hangar, right to left, with a cool rim, inside the square crop. The hangar plate waits for it
          // to leave (it lands at +38 frames), so the bird never crosses type.
          const t = clamp01((f - bAt(36) - 4) / 38);
          const rx = lerp(900, -240, t), ry = 570 - 80 * Math.sin(Math.min(1, t * 3) * Math.PI / 2);
          return <g>
            <radialGradient id="s10rv" cx="0.5" cy="0.5" r="0.5"><stop stopColor="#BFE3EE" stopOpacity={0.55} /><stop offset="1" stopColor="#BFE3EE" stopOpacity={0} /></radialGradient>
            <ellipse cx={rx} cy={ry} rx={120} ry={84} fill="url(#s10rv)" opacity={0.4 + 0.6 * q(36, 6)} />
            <Raven x={rx} y={ry} scale={1.8} f={f} facing={-1} mode={t > 0.01 ? 'fly' : 'perch'} />
          </g>;
        })()}
        {/* open shelving under the trusses, trays of stones glinting */}
        <g opacity={fadeIn}>
          {Array.from({length: 4}, (_, r) => (
            <g key={r}>
              <rect x={40} y={700 + r * 120} width={1000} height={16} fill="#5A3A22" stroke={C.ink} strokeWidth={4} />
              {Array.from({length: 10}, (_, c) => {
                const h = hash(r * 31 + c);
                const tw = 0.5 + 0.5 * Math.sin(f / (18 + (h % 20)) + (h % 50));
                return <g key={c}>
                  <rect x={58 + c * 98} y={676 + r * 120} width={84} height={24} rx={4} fill="#4A3020" stroke={C.ink} strokeWidth={3} />
                  {[0, 1, 2].map((k) => <ellipse key={k} cx={74 + c * 98 + k * 26} cy={688 + r * 120} rx={9} ry={6} fill={C.pearl} opacity={0.85} />)}
                  {h % 5 === 0 && <circle cx={100 + c * 98} cy={686 + r * 120} r={4 + 4 * tw} fill="#FFF4D6" opacity={0.9 * tw} />}
                </g>;
              })}
            </g>
          ))}
        </g>
        <radialGradient id="s10l" cx="0.5" cy="0.5" r="0.5"><stop stopColor={C.lamp} stopOpacity={0.4} /><stop offset="1" stopColor={C.lamp} stopOpacity={0} /></radialGradient>
        <ellipse cx={540} cy={880} rx={380} ry={300} fill="url(#s10l)" />
        <Otolith x={540} y={lerp(1000, 800, rise)} scale={0.5} f={f} counted={1} shadow={false} rot={-6} />
        {q(37, 16) > 0.01 && <BrassSign x={540} y={lerp(960, 990, 1 - q(37, 16))} lines={['"A PERFECT LITTLE TIME CAPSULE"', 'DEREK CHAMBERLIN · NOAA FISHERIES']} size={26} s={q(37, 16)} />}
        {/* crates below the sign, slats, nails and brass latches that snap */}
        {[0, 1, 2].map((i) => {
          const k = i === 0 ? pop(38, 12) : spring(f, bAt(38) + i * 6, 12);
          return <g key={i} transform={`translate(${190 + i * 350},1240)`}>
            <ContactShadow cx={0} cy={44} rx={130} ry={12} opacity={0.5} />
            <rect x={-130} y={-50} width={260} height={92} fill="#6A4A2A" stroke={C.ink} strokeWidth={5} />
            {[-1, 0, 1].map((s) => <path key={s} d={`M-130,${-4 + s * 28} H130`} stroke="#3A2414" strokeWidth={3} />)}
            {[-118, 118].map((nx) => [-40, 30].map((ny) => <circle key={`${nx}${ny}`} cx={nx} cy={ny} r={3} fill="#2A1A10" />))}
            <path d={`M-130,-50 L130,-50 L130,${-50 - 60 * (1 - k)} L-130,${-50 - 60 * (1 - k)} Z`} fill="#7A5A36" stroke={C.ink} strokeWidth={4} />
            {[-70, 70].map((lx) => <rect key={lx} x={lx - 9} y={-58 + 10 * (1 - k)} width={18} height={20} rx={3} fill={tones(C.brass).base} stroke={C.ink} strokeWidth={2.5} />)}
          </g>;
        })}
        <Plate text="1930s HANGAR · SEATTLE · AROUND 2 MILLION" y={500} size={26} p={ease(f, bAt(36) + 38, 12)} />
        {since(38) >= 0 && <g transform="translate(540,1245) scale(0.4)"><Stamp cx={0} cy={0} s={spring(f, bAt(38) + 12, 12)} text="MOVED · 2012" rot={-6} color="#E8402F" /></g>}
        <Motes f={f} color={C.lamp} op={0.25} rise={0.12} />
      </SVG>
    );
  } else if (n === 11) {
    // THE FAIR CASE AGAINST. A brass sign drops on its chains; the AGE and CATCH LIMITS plinths rise
    // out of the floor around a dashed step where the same closed STOCK ASSESSMENT door stands; the
    // machine's tag hops onto AGE; a fishery manager on CATCH LIMITS points at it; the camera pushes
    // in as the tag reaches for the dashed step and the door lights; NEXT STEP, PER NOAA, 2023 stamps
    // into the dashed step, the camera whips back, the tag slips and the manager nods.
    const b = tones(C.brass);
    const sign = pop(39, 14);
    const swing = since(39) >= 0 ? 7 * Math.sin(since(39) / 6) * Math.exp(-since(39) / 22) : 0;
    const rise = pop(40, 18);
    const hop = q(41, 22);
    const reach = q(43, 18);
    const slip = ease(f, bAt(45), 16);
    const teeter = since(43) > 32 && since(45) < 0 ? Math.sin(f / 3) * 11 : 0;
    const doorLit = q(44, 16);
    const flick = 0.6 + 0.4 * Math.abs(Math.sin(f / 4));
    // the tag pops out of the reader's slot as the shot opens, hops onto AGE, JUMPS for the dashed step,
    // falls short onto AGE's edge and teeters there, then tumbles back to the middle on NEXT STEP
    const popOut = spring(f, 6, 14);
    const fallback = ease(f, bAt(43) + 20, 12);
    const up = reach * (1 - fallback);
    const edge = fallback * (1 - slip);
    // two small anticipation hops on AGE while the manager arrives, so the jump at 88.2 is telegraphed
    const idleHop = [50, 78].reduce((acc, t0) => acc + (since(41) >= t0 && since(41) < t0 + 10 && since(43) < 0 ? 22 * Math.sin(Math.PI * (since(41) - t0) / 10) : 0), 0);
    const baseX = lerp(201, 380, hop), baseY = lerp(1223 - 46 * popOut, 1104, hop) - Math.sin(hop * Math.PI) * 120 - idleHop;
    const tagX = lerp(lerp(baseX, 600, up), 468, edge);
    const tagY = lerp(lerp(baseY, 935, up), 1104, edge) - Math.sin(fallback * Math.PI) * 30 * (1 - slip) - Math.sin(slip * Math.PI) * 40;
    const point = ease(f, bAt(42) + 34, 12) * (1 - 0.3 * Math.sin(Math.PI * clamp01((f - bAt(45) + 6) / 8)));
    const nod = since(45) >= 0 ? 15 * Math.sin(Math.PI * clamp01(since(45) / 10)) - 4 * Math.sin(Math.PI * clamp01((since(45) - 10) / 10)) : 0;
    const bob = since(42) > 36 ? 3 * Math.sin(f / 9) : 0;
    const signOut = ease(f, bAt(43) - 18, 16);
    // he steps in from the frame edge (half of him visible on the first frame), two strides on screen
    const WALK = 30;
    const walkT = clamp01(since(42) / WALK);
    const manX = lerp(1060, 868, walkT) + (since(42) >= WALK ? -10 * Math.sin((since(42) - WALK) * 0.5) * Math.exp(-(since(42) - WALK) / 6) : 0);
    // the camera: a push toward the tag and the door from "NOAA called", a whip back on the stamp
    const push = 0.3 * ease(f, bAt(43), 60) * (1 - ease(f, bAt(45) - 3, 8));
    // pushed about a point LOW in the set, so the AGE plinth and its label stay above the caption band
    const cam = `translate(600,1200) scale(${1 + push}) translate(-600,-1200)`;
    const plinth = (x0: number, x1: number, top: number, label: string[], solid: boolean, fs: number, lift = 0) => {
      const dx = 26, dz = 18;
      return solid ? (
        <g clipPath="url(#s11floor)"><g transform={`translate(0,${lift * (1300 - top + 30)})`}>
          <ContactShadow cx={(x0 + x1) / 2 + 10} cy={1300} rx={(x1 - x0) / 2 + 30} ry={14} opacity={0.5} />
          <path d={`M${x1},${top} L${x1 + dx},${top - dz} L${x1 + dx},${1300 - dz} L${x1},1300 Z`} fill={b.shade} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M${x0},${top} L${x0 + dx},${top - dz} L${x1 + dx},${top - dz} L${x1},${top} Z`} fill={b.key} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <rect x={x0} y={top} width={x1 - x0} height={1300 - top} fill="url(#s11face)" stroke={C.ink} strokeWidth={6} />
          <rect x={x0 + 6} y={top + 6} width={x1 - x0 - 12} height={10} fill={b.key} opacity={0.6} />
          {Array.from({length: Math.floor((1300 - top - 60) / 120)}, (_, i) => (
            <g key={i}>
              <path d={`M${x0 + 6},${top + 170 + i * 120} H${x1 - 6}`} stroke={b.shade} strokeWidth={4} opacity={0.7} />
              {Array.from({length: 5}, (_, k) => <circle key={k} cx={x0 + 20 + k * (x1 - x0 - 40) / 4} cy={top + 180 + i * 120} r={4} fill={b.key} stroke={C.ink} strokeWidth={1.5} />)}
            </g>
          ))}
          <rect x={x0 + 10} y={1300 - 46} width={x1 - x0 - 20} height={34} rx={4} fill={b.shade} opacity={0.55} />
          <path d={`M${x0 + 12},${top + 12} L${x0 + 12},${1300 - 12}`} stroke="#FFF3D0" strokeWidth={4} opacity={0.35} />
          <rect x={x0 + 18} y={top + 26} width={x1 - x0 - 36} height={Math.min(120, 1300 - top - 52)} rx={6} fill="none" stroke={b.shade} strokeWidth={3} />
          {label.map((l, i) => <text key={i} x={(x0 + x1) / 2} y={top + 70 + i * (fs + 8)} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={fs} fill={C.ink}>{l}</text>)}
          <path d={`M${x0 + 4},${1300 - 8} L${x1 - 4},${1300 - 8}`} stroke={b.shade} strokeWidth={6} opacity={0.6} />
        </g></g>
      ) : (
        <g opacity={lerp(0.55, flick, q(42, 10))}>
          <path d={`M${x0},${top} L${x0 + dx},${top - dz} L${x1 + dx},${top - dz} L${x1},${top} Z M${x1},${top} L${x1 + dx},${top - dz} L${x1 + dx},${1300 - dz}`}
            fill="none" stroke={C.cream} strokeWidth={5} strokeDasharray="16 12" />
          <rect x={x0} y={top} width={x1 - x0} height={1300 - top} fill={C.cream} fillOpacity={0.05} stroke={C.cream} strokeWidth={6} strokeDasharray="20 14" />
        </g>
      );
    };
    picture = (
      <SVG>
        <defs>
          <linearGradient id="s11face" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={b.key} /><stop offset="0.35" stopColor={b.base} /><stop offset="1" stopColor={b.shade} />
          </linearGradient>
          <clipPath id="s11floor"><rect x={-200} y={-200} width={1480} height={1502} /></clipPath>
        </defs>
        <g transform={cam}>
          <Room f={f} id="s11" floorY={1300} lampX={150} lampY={1060} />
          {/* the hanging lamp over the reader */}
          <g transform={`translate(120,0) rotate(${Math.sin(f / 50) * 2} 0 0)`}>
            <path d="M0,0 L0,560" stroke={C.ink} strokeWidth={6} />
            <path d="M-90,640 L-40,560 L40,560 L90,640 Z" fill={b.core} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
            <ellipse cx={0} cy={642} rx={92} ry={18} fill={C.lamp} stroke={C.ink} strokeWidth={4} />
            <path d="M-90,650 L-200,1300 L200,1300 L90,650 Z" fill={C.lamp} opacity={0.07} />
          </g>
          {/* the dashed step first, so the AGE plinth's side face sits in front of it */}
          {plinth(506, 720, 1010, [], false, 30)}
          {/* when the door lights, its light spills down the dashed step and across the floor */}
          {doorLit > 0.01 && <g opacity={doorLit}>
            <linearGradient id="s11spill" x1="0" y1="0" x2="0" y2="1"><stop stopColor={C.lamp} stopOpacity={0.4} /><stop offset="1" stopColor={C.lamp} stopOpacity={0} /></linearGradient>
            <path d="M529,1000 L697,1000 L880,1720 L346,1720 Z" fill="url(#s11spill)" />
          </g>}
          {plinth(250, 480, 1170, ['AGE'], true, 46, 1 - rise)}
          {plinth(720, 1000, 850, ['CATCH', 'LIMITS'], true, 34, 1 - rise)}
          {/* the SAME closed door from the tagging room, standing on the dashed step */}
          <g transform="translate(613,992)">
            <rect x={-136} y={-368} width={272} height={88} rx={6} fill="#2A1C14" stroke={C.ink} strokeWidth={5} />
            <text x={0} y={-332} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.lamp} opacity={0.45 + 0.55 * doorLit}>STOCK</text>
            <text x={0} y={-296} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.lamp} opacity={0.45 + 0.55 * doorLit}>ASSESSMENT</text>
            <rect x={-84} y={-276} width={168} height={276} fill="#3A2A1E" stroke={C.ink} strokeWidth={6} />
            {[0, 1].map((k) => <rect key={k} x={-66} y={-256 + k * 130} width={132} height={110} fill="none" stroke="#2A1C14" strokeWidth={4} />)}
            <circle cx={58} cy={-130} r={7} fill={C.brass} stroke={C.ink} strokeWidth={2} />
            <rect x={-84} y={-8} width={168} height={10} fill={C.lamp} opacity={0.25 + 0.7 * doorLit} />
            <path d="M-84,2 L-150,40 L150,40 L84,2 Z" fill={C.lamp} opacity={0.18 * doorLit} />
          </g>
          {/* the fishery manager on the CATCH LIMITS plinth: walks in, points at the tag, nods at the stamp */}
          {since(42) >= 0 && <g transform={`translate(0,${0.6 * nod + bob}) rotate(${nod} ${manX} 850)`}>
            <Character frame={from + f} x={manX} y={850} scale={0.62} facing={-1}
              pose={since(42) < 34 ? 'stand' : 'point'} gesture={point} walking={since(42) < WALK} walkPhase={((1060 - manX) * Math.PI) / 46}
              emotion="neutral" outfit="vest" glasses headgear="cap" idleGain={1.4} lightWrap={0} look={-12 * q(44, 10)} />
          </g>}
          {/* the NIR reader on the floor, fully in frame: the tag's source */}
          <NIRReader x={125} y={1300} scale={0.36} f={f} beam={0.4} spectrum={1} seed={3} plate="" cloth={0} rails={false} />
          <g transform={`rotate(${teeter} ${tagX} ${tagY + 30})`}><MachineTag x={tagX} y={tagY} s={1.1} op={ease(f, 4, 6)} /></g>
          {since(45) >= 0 && since(45) < 12 && <ImpactStar cx={613} cy={1150} r={90} color={C.cream} />}
          {since(45) >= 0 && <g transform="translate(613,1150) scale(0.32)"><Stamp cx={0} cy={0} s={pop(45, 12)} text="NEXT STEP" rot={-8} color={C.lamp} /></g>}
        </g>
        {sign > 0.01 && signOut < 0.99 && <g transform={`translate(0,${-760 * signOut})`}>
          <path d={`M330,0 L330,${lerp(-120, 500, Math.min(1, sign)) - 40} M750,0 L750,${lerp(-120, 500, Math.min(1, sign)) - 40}`} stroke={C.ink} strokeWidth={5} strokeDasharray="10 6" />
          <BrassSign x={540} y={lerp(-120, 500, sign)} lines={['THE FAIR CASE AGAINST']} size={40} rot={swing} />
        </g>}
        {/* the year that dates NEXT STEP lands with the lit door ("into stock assessments") and holds to the cut */}
        <Plate text="PER NOAA · 2023" x={600} y={1252} size={24} tone="brass" p={ease(f, bAt(44) - 2, 8)} />
        <Motes f={f} color={C.lamp} op={0.16} />
      </SVG>
    );
  } else if (n === 12) {
    // MANAGERS SET LIMITS, NOT MACHINES. An inked hand drags a numberless line across the manager's
    // clipboard; focus racks across the hall to the reader, eye at the microscope, still clicking.
    const rack = ease(f, bAt(47) - 8, 18);
    const line = ease(f, bAt(46) + 6, 40);
    const click = (f % 11) / 11;
    const R = 0.5 / 1.05; // the S4 reader and scope, at background scale
    const rx = 660, ry = 960;
    picture = (
      <SVG>
        <defs>
          <filter id="s12fg"><feGaussianBlur stdDeviation={8 * rack} /></filter>
          <filter id="s12bg"><feGaussianBlur stdDeviation={8 * (1 - rack)} /></filter>
        </defs>
        <g filter="url(#s12bg)"><Room f={f} id="s12" floorY={1000} lampX={760} lampY={760} /></g>
        {/* background: the reader across the hall, eye at the eyepiece, thumb on the counter */}
        <g filter="url(#s12bg)">
          <radialGradient id="s12l" cx="0.5" cy="0.5" r="0.5"><stop stopColor={C.lamp} stopOpacity={0.5} /><stop offset="1" stopColor={C.lamp} stopOpacity={0} /></radialGradient>
          <ellipse cx={740} cy={800} rx={300} ry={240} fill="url(#s12l)" />
          <Character frame={from + f} x={rx} y={ry + 3 * clamp01(1 - click * 3)} scale={0.5} facing={1} pose="carry" gesture={0.6 + 0.4 * clamp01(1 - click * 3)} outfit="flannel" hairStyle="long" glasses headgear="bare" idleGain={1.2} />
          <Microscope x={rx + 108 * R} y={ry + 15 * R} s={1.1 * R} />
          {click < 0.25 && <circle cx={732} cy={858} r={64 * (1 - click * 4)} fill={C.lamp} opacity={0.35 * (1 - click * 4)} />}
          <TallyCounter x={732} y={858} scale={0.38} count={125 + Math.floor(f / 11) + click} press={clamp01(1 - click * 3)} f={f} worn={0.4} />
        </g>
        {/* foreground: the clipboard, a numberless limit line, the inked hand with the pen */}
        <g filter="url(#s12fg)">
          <g transform={`translate(0,${340 * rack}) rotate(-4 430 1070)`}>
            <rect x={132} y={876} width={620} height={420} rx={16} fill="#000" opacity={0.3} />
            <rect x={110} y={850} width={640} height={440} rx={18} fill="#6A4A30" stroke={C.ink} strokeWidth={6} />
            <rect x={120} y={860} width={620} height={420} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={5} />
            {Array.from({length: 7}, (_, i) => <path key={i} d={`M150,${930 + i * 46} H710`} stroke="#B9B2A0" strokeWidth={2} />)}
            {[330, 470, 600].map((cx) => <path key={cx} d={`M${cx},910 V1250`} stroke="#B9B2A0" strokeWidth={2} />)}
            <rect x={470} y={1114} width={130} height={46} fill="#FFF7E2" stroke="#8A8476" strokeWidth={2} strokeDasharray="6 4" />
            {Array.from({length: 4}, (_, i) => <rect key={i} x={160} y={942 + i * 46} width={150 - i * 18} height={9} rx={4} fill="#8A8476" opacity={0.45} />)}
            <rect x={300} y={826} width={260} height={56} rx={12} fill="#8E949A" stroke={C.ink} strokeWidth={5} />
            <rect x={312} y={834} width={236} height={12} rx={6} fill="#FFFFFF" opacity={0.45} />
            <circle cx={430} cy={866} r={9} fill="#5A6066" stroke={C.ink} strokeWidth={3} />
            <path d={`M180,1160 L${180 + 460 * line},1152`} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
            <InkHand x={180 + 460 * line + 195 * 0.62} y={1152 - 77 * 0.62} rot={0} s={0.62} pen sleeve="#c98a2a" />
          </g>
          <AgeTag x={800} y={1150} text="7" f={f} scale={1.3} />
        </g>
        <Plate text="LIMITS SET EACH YEAR · PER NOAA" y={500} size={28} p={q(46, 12) * (1 - ease(f, bAt(47) - 6, 6))} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
        <Plate text="30,000+ A YEAR · PER NOAA" y={500} size={28} p={q(47, 12)} /> {/* plate-overlap-ok: sequenced, it retires on q(N) as the next plate lands */}
        <Motes f={f} color={C.lamp} op={0.12} />
      </SVG>
    );
    zoom = 1 + 0.05 * (f / dur);
  } else if (n === 13) {
    // LOOK WHERE THE SPEED CAME FROM. The win is real: a trophy bounces onto the machine, CREDIT · NOAA
    // SCIENTISTS, while an inked hand feeds hand-tagged stones to it; on THAT'S REAL the cloth comes off
    // its plate, TRAINED ON THE ARCHIVE. Then inside, at S7's framing: the AGE OUT slot's WHO COUNTED?
    // flips to a handwritten 7, the sourced check holds, and the same spectral line tears into 144
    // ticks that curve onto the growth bands of the 1878 stone, exactly where the next shot's stone sits.
    const feed = ease(f, bAt(48), 40);
    const trophy = pop(48, 14);
    const glow = q(49, 30);
    const cloth = 1 - clamp01((f - bAt(49)) / 16) * (q(49, 4) > 0 ? 1 : 0);
    const dive = ease(f, bAt(50) - 6, 18);
    const flip = ease(f, bAt(50) + 6, 12);
    const grow = ease(f, bAt(51) - 8, 10);
    const fly = q(51, 24);
    const body = ease(f, bAt(51) + 22, 12);
    const glint = clamp01((f - bAt(49) - 18) / 16);
    const dolly = 1 + 0.15 * ease(f, bAt(50) - 6, 30) * (1 - ease(f, bAt(51) - 8, 22));
    const benchView = (
      <g opacity={1 - dive}>
        <Bench f={f} id="s13" velvet={false} lampX={240} lampY={900} />
        {[300, 780].map((lx, i) => (
          <g key={lx} transform={`translate(${lx},0) rotate(${Math.sin(f / 47 + i * 1.7) * 1.5} 0 0)`}>
            <path d="M0,0 L0,300" stroke={C.ink} strokeWidth={5} />
            <path d="M-70,368 L-30,300 L30,300 L70,368 Z" fill={tones(C.brass).core} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={0} cy={369} rx={72} ry={14} fill={C.lamp} stroke={C.ink} strokeWidth={3} />
            <path d="M-70,376 L-210,720 L210,720 L70,376 Z" fill={C.lamp} opacity={0.06 + 0.04 * glow} />
          </g>
        ))}
        <BenchLip f={f} />
        {since(48) >= 0 && since(48) < 12 && <ImpactStar cx={757} cy={600} r={150} color={C.lamp} />}
        <NIRReader x={540} y={1240} scale={1.45} f={f} beam={0.5 + 0.5 * glow} spectrum={1} seed={3} plate="TRAINED ON THE ARCHIVE" cloth={cloth}
          trophy={trophy} trophyScale={1.25} trophyPlate="CREDIT · NOAA SCIENTISTS"
          slot={<SlotPlate x={0} y={0} s={1} wob={Math.sin(f / 5) * 3} />} />
        {glint > 0 && glint < 1 && <g>
          <clipPath id="s13pl"><rect x={298} y={1121} width={484} height={64} rx={10} /></clipPath>
          <g clipPath="url(#s13pl)">
            <path d={`M${lerp(240, 840, glint)},1110 l40,0 l-44,100 l-40,0 Z`} fill="#FFF6DC" opacity={0.7} />
          </g>
        </g>}
        {/* the tray of hand-tagged stones, pushed into the sample port by the reader's inked hand */}
        <g transform={`translate(${lerp(-200, 175, feed)},960)`}>
          <rect x={-75} y={-40} width={150} height={50} rx={6} fill="#4A3020" stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 3}, (_, k) => <g key={k}>
            <ellipse cx={-46 + k * 44} cy={-16} rx={16} ry={11} fill={C.pearl} stroke={C.ink} strokeWidth={2} />
            <AgeTag x={-40 + k * 44} y={-24} text={String(5 + k)} f={f + k * 5} scale={0.38} />
          </g>)}
          <InkHand x={-80} y={-14} rot={180} s={0.62} sleeve="#5A6B78" />
        </g>
        <ellipse cx={540} cy={900} rx={500} ry={400} fill={C.lamp} opacity={0.1 * glow} />
      </g>
    );
    picture = (
      <SVG>
        {benchView}
        {dive > 0.01 && (
          <g opacity={dive}>
            <MachineInside f={f} />
            <g transform={`translate(540,900) scale(${dolly}) translate(-540,-900)`}>
              {/* the line first, so it runs INTO the slot behind its brass frame */}
              {grow < 0.98 && <g opacity={1 - grow}><SpectralLine x={LINE.x} y={LINE.y} w={LINE.w} h={LINE.h} seed={LINE.seed} progress={1} width={7} /></g>}
              {/* the same slot as S7, at S7's size, its question flipping to the reader's handwritten 7 */}
              <g transform={`translate(540,900) scale(${2.2 * (1 - 0.6 * grow) * (0.94 + 0.06 * pop(50, 12))})`} opacity={1 - grow}>
                <rect x={-64} y={-62} width={128} height={124} rx={10} fill="#081014" stroke={C.ink} strokeWidth={6} />
                <rect x={-64} y={-62} width={128} height={124} rx={10} fill="none" stroke={C.brass} strokeWidth={8} />
                <rect x={-55} y={-95} width={110} height={26} rx={6} fill="#081014" stroke={C.ink} strokeWidth={2} />
                <text x={0} y={-76} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.brass}>AGE OUT</text>
                {flip < 0.5
                  ? <g transform={`scale(1,${1 - 2 * flip})`}><SlotPlate x={0} y={0} s={1} wob={Math.sin(f / 5) * 4} /></g>
                  : <g transform={`scale(1,${2 * flip - 1})`}><AgeTag x={-62} y={-60} text="7" f={f} scale={1.0} flip={0} fs={64} /></g>}
                {since(50) >= 18 && since(50) < 26 && <rect x={-64} y={-62} width={128} height={124} rx={10} fill="#FFF6DC" opacity={0.4 * (1 - (since(50) - 18) / 8)} />}
              </g>
            </g>
            {body > 0 && <Otolith x={STONE.x} y={STONE.y} scale={STONE.s} f={0} rings={STONE.rings} counted={1} rot={STONE.rot} shadow={false} />}
            {grow > 0 && <TickRings grow={grow} fly={fly} op={1} />}
          </g>
        )}
        {/* ROUND 4 (c19): the SOURCED comparison rides "That's real." over the machine, top left, clear of the
            trophy, and leaves as the slot turns; OUR READ lands on the very frames the slot turns to the
            handwritten 7, so the 7 is never captioned by the citation, and only OUR READ rides into the cut */}
        {/* plate-overlap-ok: one label in three stacked rows, the attribution as large as the claim */}
        <Plate text="CHECKED AGAINST" x={300} y={492} size={26} p={ease(f, bAt(49), 10) * (1 - ease(f, bAt(50) + 6, 6))} />
        <Plate text="MICROSCOPE AGES" x={300} y={554} size={26} p={ease(f, bAt(49) + 2, 10) * (1 - ease(f, bAt(50) + 6, 6))} />
        <Plate text="BENSON ET AL. 2023" x={300} y={616} size={26} p={ease(f, bAt(49) + 4, 10) * (1 - ease(f, bAt(50) + 6, 6))} />
        <Plate text="OUR READ · THE COUNT CAME FIRST" y={614} size={26} tone="brass" p={ease(f, bAt(50) + 12, 8)} /> {/* plate-overlap-ok: sequenced, the sourced pair is gone by bAt(50) + 12 when this one lands */}
      </SVG>
    );
    // the match cut: camera back to rest (zoom 1, no drift) by the time the rings land
    zoom = lerp(1 + 0.08 * clamp01(f / Math.max(1, bAt(50))), 1, dive);
    drift = drift * (1 - dive);
  } else if (n === 14) {
    // SOMEBODY COUNTED. Human only: the 1878 stone under the objective (the rings the ticks just drew),
    // the BORN drum, the reader's thumb on the counter. On "somebody" the brass sign flips WHO COUNTED?
    // to SOMEBODY COUNTED; on "counted" the counter clicks to 0144 and the rings pulse every half second.
    const CLICK = 16; // the click lands on the word "counted", the sign flips on "somebody"
    const click = since(53) >= CLICK;
    const press = click && since(53) - CLICK < 8 ? 1 - (since(53) - CLICK) / 8 : 0;
    const pulse = click ? ((since(53) - CLICK) % 15) / 15 : 0;
    const flipK = q(53, 10);
    const set = pop(52, 16);
    const swing = since(52) >= 0 ? 2 * Math.sin(since(52) / 5) * Math.exp(-since(52) / 18) : 0; // capped at 2 degrees: its corner stays clear of BORN · EST.
    picture = (
      <SVG>
        <Bench f={f} id="s14" />
        <BenchLip f={f} />
        {/* seated from the cut: a drop's overshoot ran the lens down onto the held OUR READ chip */}
        <BenchScope x={STONE.x} y={STONE.y} scale={1.05} drop={1} lamp={1} f={f} />
        <Otolith x={STONE.x} y={STONE.y} scale={STONE.s} f={0} rings={STONE.rings} counted={1} pulse={pulse} rot={STONE.rot} />
        {f < 14 && <TickRings grow={1} fly={1} op={1 - ease(f, 0, 12)} />}
        <YearDrum x={225} y={1080} scale={0.62} year={1878} label="BORN · EST." />
        <TallyCounter x={820} y={1110} scale={0.62} count={click ? 144 : 143} press={press} plate="RINGS" />
        <InkHand x={828} y={1000 + 6 * press} rot={-45} s={0.62} press={press} sleeve="#b23a3a" />
        {set > 0.01 && (
          <BrassSign x={540} y={1245} s={set} lines={[flipK < 0.5 ? 'WHO COUNTED?' : 'SOMEBODY COUNTED']} size={42} rot={swing} flip={flipK} minW={16 * 42 * 0.602 + 15 * 1.5 + 124} />
        )}
        {/* the specimen label: where this stone came from, back on it for the close */}
        <path d="M282,822 C200,800 120,760 104,712" fill="none" stroke="#6B5A3C" strokeWidth={3} />
        <g transform="translate(232,706) rotate(-4)">
          <rect x={-142} y={-26} width={284} height={52} rx={6} fill="#E8DDBF" stroke={C.ink} strokeWidth={4} />
          <circle cx={-128} cy={0} r={5} fill="none" stroke={C.ink} strokeWidth={2.5} />
          <text x={8} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>ALEUTIANS · 2022</text>
        </g>
        {/* OUR READ holds S13's exact position across the cut, then retires as the sign springs up at 110.6 */}
        <Plate text="OUR READ · THE COUNT CAME FIRST" y={614} size={26} tone="brass" p={1 - ease(f, bAt(52) - 6, 8)} /> {/* plate-overlap-ok: sequenced, it retires at 110.6 and EST. 144 YEARS OLD lands at about 113.0 */}
        <Plate text="EST. 144 YEARS OLD" y={632} size={32} tone="brass" p={ease(f, bAt(53) + CLICK, 8)} />
      </SVG>
    );
    zoom = 1 + 0.04 * (f / dur);
  }

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${drift * 5 + Math.sin(f * 2.3) * 3.5 * kick}px, ${dy + Math.cos(f * 1.9) * 2.5 * kick}px) scale(${zoom * (1 + 0.022 * kick)})`}}>
        {picture}
      </div>
      <GradeLayer f={f} bloom={0.06 + acc * 0.08} vignette={0.34} grain={0.05} warmth={0.04} />
    </AbsoluteFill>
  );
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1002Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1002Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:100 900;font-display:block;}`}</style>
);

export const Ep1002: React.FC<Props> = ({captions: cues = [], scenes, beats, credits, mouth = [], accents = []}) => {
  const fallback = [0, 5.82, 14.66, 24.54, 32.0, 42.2, 48.0, 52.78, 63.02, 73.18, 79.08, 93.46, 100.24, 108.6, 114.46]
    .map((x) => Math.round(x * 30));
  const slots = scenes ?? fallback.slice(0, -1).map((from, i) => ({from, dur: fallback[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.sea}}>
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
