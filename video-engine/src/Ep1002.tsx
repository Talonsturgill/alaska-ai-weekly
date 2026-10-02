import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, ContactShadow, tones, FormGradient} from './lib/lighting';
import {VoiceProvider, useVoice} from './lib/voice';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {HandSil} from './lib/stack';
import {Character} from './lib/Character';
import {Groundfish} from './lib/fauna';
import {BrassPlate} from './lib/bench';
import {StatBurst, Stamp} from './lib/kit';
import {ImpactStar, SpeedLines} from './lib/FX';
import {
  Otolith, TallyCounter, NIRReader, BenchScope, ArchiveDrawers, AgeTag, TreeRings, SpectralLine, spectrumPoints,
  PEARL, BRASS, NIR, LAMP, ENAMEL,
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

/** A small brass microscope, side view, for the reader's bench. Anchor is the foot centre. */
const Scope: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
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

/** A small age tag printed by the machine (no handwriting: rules and a stamped word). */
const MachineTag: React.FC<{x: number; y: number; s?: number; op?: number}> = ({x, y, s = 1, op = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={op}>
    <rect x={-56} y={-34} width={112} height={68} rx={6} fill="#E9E4F0" stroke={C.ink} strokeWidth={4} />
    <rect x={-56} y={-34} width={112} height={18} rx={6} fill={C.nir} />
    <text x={0} y={18} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>AGE</text>
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
  const drift = Math.sin(f / 71.3);
  const acc = voice.accentAt ? voice.accentAt(from + f) : 0;
  let picture: React.ReactNode = null;
  let zoom = push;
  let dy = 0;

  if (n === 1) {
    // HOOK. A rockfish glides in, an x-ray finds the ear stone, the stone pops toward camera.
    const swimX = interpolate(f, [0, 70], [-260, 470], {extrapolateRight: 'clamp', easing: EZ});
    const xr = q(2, 18);
    const popK = spring(f, bAt(3), 22);
    const out = clamp01(since(3) / 4);
    const spin = since(3) > 0 ? Math.max(0, 40 - since(3)) * 6 : 0;
    const head = {x: swimX + 2.6 * 70, y: 860};
    const sx = lerp(head.x, 540, popK), sy = lerp(head.y, 1010, popK);
    picture = (
      <SVG>
        <Water f={f} id="s1" />
        <Groundfish x={swimX} y={900} scale={2.6} f={f} kind="rockfish" swim={0.8} xray={xr} stoneOut={out} />
        {since(3) >= 0 && (
          <g>
            <SpeedLines cx={sx} cy={sy} frame={f} intensity={Math.max(0, 1 - since(3) / 16)} color={C.pearl} />
            <Otolith x={sx} y={sy} scale={lerp(0.18, 1.25, popK)} f={f} rot={spin} mode="xray" counted={0} shadow={false} />
          </g>
        )}
        <Plate text="A FISH BORN IN 1878." y={500} size={44} p={ease(f, 0, 6)} />
        <Plate text="WHO COUNTED?" y={575} size={44} p={ease(f, 4, 8)} />
        <Plate text="ALEUTIANS · 2022" y={1250} size={30} p={q(2, 12)} />
      </SVG>
    );
    zoom = 1 + 0.05 * (f / dur);
  } else if (n === 2) {
    // BORN 1878. The stone lands under the objective; each click pulses one ring outward and rolls
    // the date wheel back. The counter stays low: 0144 is saved for the button.
    const land = spring(f, 0, 16);
    const clicks = Math.max(0, Math.floor(since(5) / 12) + 1);
    const nClicks = Math.min(6, since(5) >= 0 ? clicks : 0);
    const clickPhase = since(5) >= 0 && nClicks < 6 ? (since(5) % 12) / 12 : 1;
    const yearK = interpolate(f, [bAt(5), bAt(6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
    const year = 2022 - 144 * yearK;
    const slam = pop(6, 14);
    const shake = since(6) >= 0 && since(6) < 10 ? Math.sin(since(6) * 3) * (10 - since(6)) * 0.8 : 0;
    const press = since(5) >= 0 && nClicks < 6 ? clamp01(1 - clickPhase * 3) : 0;
    picture = (
      <SVG>
        <g transform={`translate(${shake},0)`}>
          <Bench f={f} id="s2" />
          <BenchScope x={540} y={860} scale={1.05} drop={ease(f, 0, 12)} lamp={1} f={f} />
          <Otolith x={540} y={860 - 200 * (1 - land)} scale={1.55} f={f} rings={14} counted={nClicks / 14 + (since(6) > 0 ? 0.6 * ease(f, bAt(6), 40) : 0)}
            pulse={since(5) >= 0 && nClicks < 6 ? clickPhase : 0} rot={-8} />
          <TallyCounter x={260} y={1110} scale={0.62} count={2022 - 144 * yearK} plate="BORN" />
          <TallyCounter x={820} y={1110} scale={0.62} count={nClicks + 0.0} press={press} plate="RINGS" />
          <HandSil x={905} y={1235} rot={-35} s={0.7} curl={0.5 + 0.4 * press} fill="#B98A64" />
          {slam > 0.02 && <g>
            {since(6) < 12 && <ImpactStar cx={260} cy={1110} r={160 * slam} color={C.lamp} />}
            <StatBurst cx={540} cy={600} scale={0.85 * slam} big="1878" lines={['BORN']} fill={C.lamp} big_fs={92} />
            <Plate text="EST. 144 YEARS OLD · BORN 1878" y={1250} size={30} p={slam * (1 - q(7, 8))} />
          </g>}
          <BrassPlate x={540} y={1240} lines={['WHO COUNTED?']} set={q(7, 16)} scale={0.9} w={520} size={44} />
          <Plate text="EAR STONE" y={500} size={30} p={q(4, 12) * (1 - q(6, 8))} />
          <Plate text="0001" x={820} y={960} size={26} p={q(5, 8) * (1 - q(6, 8))} />
          <Plate text="2022" x={260} y={960} size={26} p={q(5, 8) * (1 - q(6, 8))} />
          <text x={-999} y={-999}>{Math.round(year)}</text>
        </g>
      </SVG>
    );
    zoom = 1 + 0.04 * (f / dur);
  } else if (n === 3) {
    // EAR STONES, LIKE A TREE. A cutaway of the head shows the PAIR, then the stone and a sawn
    // cross-section count ring for ring.
    const open = ease(f, 0, 22);
    const lift = q(9, 24);
    const ringK = interpolate(f, [bAt(10), dur - 10], [0.05, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const pulse = since(10) >= 0 ? ((since(10) % 18) / 18) : 0;
    const treeIn = spring(f, bAt(11), 20);
    picture = (
      <SVG>
        <rect width={W} height={H} fill="#0C2028" />
        {Array.from({length: 24}, (_, i) => <path key={i} d={`M${i * 48 + (f * 0.3) % 48},380 V1320`} stroke="#14343F" strokeWidth={1.5} />)}
        {Array.from({length: 20}, (_, i) => <path key={i} d={`M0,${380 + i * 48} H1080`} stroke="#14343F" strokeWidth={1.5} />)}
        <g opacity={1 - 0.55 * lift}>
          <Groundfish x={560} y={720} scale={2.2 * open + 0.4} f={f} kind="rockfish" swim={0.15} xray={open} stoneOut={lift} caustics={false} />
        </g>
        {/* the pair, lifted out side by side */}
        <Otolith x={lerp(430, 330, lift)} y={lerp(735, 900, lift)} scale={lerp(0.12, 0.62, lift)} f={f} mode="pearl" rot={-6} counted={ringK} pulse={pulse} />
        <Otolith x={lerp(450, 300, lift) + 0} y={lerp(745, 1150, lift)} scale={lerp(0.1, 0.0, lift)} f={f} mode="pearl" rot={186} counted={0} shadow={false} />
        <Otolith x={lerp(440, 760, lift)} y={lerp(740, 900, lift)} scale={lerp(0.12, 0.62 * (1 - treeIn), lift)} f={f} mode="pearl" rot={186} counted={ringK} pulse={pulse} />
        {treeIn > 0.01 && <TreeRings x={lerp(1300, 760, treeIn)} y={950} scale={0.95} counted={ringK} pulse={pulse} f={f} />}
        <Plate text="A PAIR OF EAR STONES" y={500} size={32} p={q(8, 12) * (1 - q(9, 10))} />
        <Plate text="OTOLITH · EAR STONE" y={500} size={32} p={q(9, 12) * (1 - q(10, 10))} />
        <Plate text="ONE RING A YEAR" x={300} y={1250} size={28} p={q(10, 12)} />
        <Plate text="LIKE A TREE" x={770} y={1250} size={28} p={q(11, 12)} />
        <Motes f={f} color="#BFEFF7" op={0.16} />
      </SVG>
    );
  } else if (n === 4) {
    // THE READER. A NOAA reader at a brass microscope clicks a counter; trays pile up behind.
    const crane = 1 - ease(f, 0, 40);
    const clickN = Math.floor(f / 9);
    const click = (f % 9) / 9;
    const trays = Math.max(0, Math.floor(interpolate(f, [bAt(13), bAt(14)], [0, 9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
    const hit = pop(14, 16);
    picture = (
      <SVG>
        <Bench f={f} id="s4" velvet={false} lampX={360} lampY={900} />
        {/* the tray stack behind, sliding in and piling to the ceiling */}
        {Array.from({length: trays}, (_, i) => {
          const sl = ease(f, bAt(13) + i * 5, 10);
          const y = 1080 - i * 74;
          return (
            <g key={i} transform={`translate(${lerp(1200, 0, sl)},0)`}>
              <rect x={600} y={y} width={360} height={60} rx={6} fill="#4A3020" stroke={C.ink} strokeWidth={4} />
              {Array.from({length: 7}, (_, k) => <ellipse key={k} cx={628 + k * 48} cy={y + 30} rx={16} ry={11} fill={C.pearl} stroke={C.ink} strokeWidth={2} />)}
            </g>
          );
        })}
        {hit > 0.02 && since(14) < 14 && <ImpactStar cx={780} cy={420} r={150 * hit} color={C.lamp} />}
        <Scope x={480} y={1200} s={1.1} />
        <Character frame={from + f} x={250} y={1270} scale={1.05} facing={1} pose="carry" gesture={0.6 + 0.4 * clamp01(1 - click * 3)} emotion="neutral" outfit="flannel"
          hairStyle="long" glasses headgear="bare" idleGain={0.6} />
        <TallyCounter x={392} y={1050} scale={0.32} count={40 + clickN + click} press={clamp01(1 - click * 3)} steam={q(15, 20)} f={f} worn={0.4} />
        <Plate text="NOAA SCIENTISTS" y={500} size={32} p={q(12, 12) * (1 - q(14, 8))} />
        <Plate text="MICROSCOPES" x={480} y={760} size={26} p={q(13, 10) * (1 - q(14, 8))} />
        {hit > 0.02 && <StatBurst cx={780} cy={760} scale={0.95 * hit} big="30,000+" lines={['A YEAR']} fill={C.lamp} big_fs={66} />}
        <Plate text="30,000+ A YEAR · PER NOAA" y={500} size={30} p={q(14, 10)} />
        <Plate text="COUNTED BY HAND" x={330} y={1250} size={26} p={q(15, 10)} />
      </SVG>
    );
    dy = -120 * crane;
  } else if (n === 5) {
    // A FASTER READER. The NIR reader slides in on rails, a cloth falls over its plate, the beam hits a
    // small tagged POLLOCK stone (never the 1878 stone), the model block lights, an age tag snaps out.
    const slide = spring(f, bAt(16), 26);
    const mx = lerp(1500, 600, slide);
    const beam = q(18, 10);
    const model = q(19, 14);
    const spec = ease(f, bAt(19), 40);
    const tagOut = pop(20, 14);
    const whip = f < 8 ? (8 - f) * 30 : 0;
    picture = (
      <SVG>
        <g transform={`translate(${-whip},0)`}>
          <Bench f={f} id="s5" velvet={false} lampX={160} lampY={980} />
          <Scope x={120} y={1260} s={0.85} />
          <NIRReader x={mx} y={1250} scale={1.0} f={f} beam={beam} spectrum={spec} seed={3} plate="TRAINED ON THE ARCHIVE" cloth={q(17, 16)}
            slot={tagOut > 0.01 ? <MachineTag x={0} y={60 * (1 - tagOut)} s={0.9} /> : null} />
          {/* the small tagged pollock stone in the sample port */}
          <g transform={`translate(${mx - 200},${1250 - 210})`}>
            <Otolith x={0} y={0} scale={0.22} f={f} mode={beam > 0.2 ? 'nir' : 'pearl'} counted={0.6} shadow={false} />
            <AgeTag x={30} y={-6} text="7" f={f} scale={0.5} />
          </g>
          {/* the model block, glowing inside the body */}
          <g transform={`translate(${mx},${1250 - 160})`} opacity={model}>
            {Array.from({length: 4}, (_, r) => Array.from({length: 6}, (_, c) => (
              <circle key={`${r}${c}`} cx={-60 + c * 24} cy={-20 + r * 14} r={5}
                fill={C.nir} opacity={0.4 + 0.6 * Math.abs(Math.sin(f / 6 + r + c))} />
            )))}
          </g>
          {since(16) >= 0 && since(16) < 12 && <ImpactStar cx={mx - 300} cy={1250} r={90} color={C.brass} />}
        </g>
        <Plate text="A FASTER READER" y={500} size={34} p={q(16, 12) * (1 - q(18, 8))} />
        <Plate text="?" x={mx} y={1150} size={26} p={q(17, 10) * (1 - q(18, 6))} />
        <Plate text="NEAR-INFRARED LIGHT" y={500} size={32} tone="nir" p={q(18, 10) * (1 - q(19, 8))} />
        <Plate text="MACHINE LEARNING" y={500} size={32} tone="nir" p={q(19, 10) * (1 - q(20, 8))} />
        <Plate text="AGE" x={mx + 205} y={760} size={28} tone="nir" p={q(20, 10)} />
      </SVG>
    );
  } else if (n === 6) {
    // WHAT EACH ONE SEES. Eyepiece left (rings ticked off, a thumb on the counter), spectrum right.
    const ring = interpolate(f, [0, dur], [0.15, 1], {extrapolateRight: 'clamp'});
    const pulse = (f % 16) / 16;
    const s600 = pop(21, 14), s800 = pop(22, 14);
    picture = (
      <SVG>
        <rect width={W} height={H} fill={C.seaLo} />
        {/* LEFT: the eyepiece */}
        <defs><clipPath id="s6eye"><circle cx={280} cy={930} r={230} /></clipPath></defs>
        <circle cx={280} cy={930} r={248} fill="#000" stroke={C.brass} strokeWidth={14} />
        <g clipPath="url(#s6eye)">
          <rect x={30} y={680} width={500} height={500} fill="#2A1A12" />
          <ellipse cx={280} cy={930} rx={240} ry={240} fill={C.lamp} opacity={0.18} />
          <Otolith x={280} y={930} scale={1.15} f={f} counted={ring} pulse={pulse} rot={-10} shadow={false} />
        </g>
        <TallyCounter x={280} y={1240} scale={0.38} count={88 + Math.floor(f / 16) + (f % 16) / 16} press={clamp01(1 - pulse * 3)} />
        {/* RIGHT: the spectrum screen */}
        <rect x={570} y={700} width={470} height={460} rx={18} fill="#071116" stroke={C.brass} strokeWidth={10} />
        {Array.from({length: 7}, (_, i) => <path key={i} d={`M${590 + i * 70},720 V1140`} stroke="#18343C" strokeWidth={2} />)}
        <SpectralLine x={600} y={760} w={410} h={340} seed={3} progress={ease(f, 0, 50)} width={6} />
        <path d="M540,640 V1300" stroke={C.cream} strokeWidth={4} opacity={0.6} />
        {s600 > 0.02 && since(22) < 0 && <StatBurst cx={540} cy={620} scale={0.8 * s600} big="600%" lines={['PER NOAA']} fill={C.lamp} big_fs={84} />}
        {s800 > 0.02 && <StatBurst cx={540} cy={620} scale={1.25 * s800} big="600 TO 800%" lines={['MORE EFFICIENT', 'PER NOAA']} fill={C.lamp} big_fs={40} />}
        <Plate text="PER NOAA" y={500} size={28} p={ease(f, 0, 10) * (1 - q(22, 6))} />
        <Plate text="600 TO 800% MORE EFFICIENT · PER NOAA" y={500} size={22} p={q(22, 12)} />
        <Plate text="MICROSCOPE STILL IN THE PROCESS" x={540} y={1250} size={24} p={q(23, 12)} />
      </SVG>
    );
    zoom = 1 + 0.03 * (f / dur);
  } else if (n === 7) {
    // YOU NEED THE AGE FIRST. Inside: the machine tag drains, the line runs into an empty slot.
    const drain = ease(f, bAt(24), 18);
    const run = ease(f, bAt(24) + 6, 30);
    const recoil = since(25) >= 0 ? Math.sin(since(25) / 3) * Math.exp(-since(25) / 10) * 40 : 0;
    const wob = Math.sin(f / 5) * 12;
    picture = (
      <SVG>
        <rect width={W} height={H} fill="#12060C" />
        {Array.from({length: 12}, (_, i) => <rect key={i} x={0} y={420 + i * 80} width={W} height={2} fill={C.nir} opacity={0.08} />)}
        <g transform="translate(540,900) scale(2.2)">
          <rect x={-64} y={-62} width={128} height={124} rx={10} fill="#081014" stroke={C.ink} strokeWidth={6} />
          <rect x={-64} y={-62} width={128} height={124} rx={10} fill="none" stroke={C.brass} strokeWidth={8} />
          <text x={0} y={-76} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.brass}>AGE OUT</text>
          <MachineTag x={0} y={140 * drain} s={0.85} op={1 - drain} />
          {drain > 0.6 && <QMark x={0} y={-6} s={0.9} wob={wob} />}
        </g>
        <g transform={`translate(${recoil},0)`}>
          <SpectralLine x={-40} y={760} w={lerp(80, 480, run)} h={260} seed={3} progress={1} width={7} />
        </g>
        <Plate text="?" y={500} size={34} p={q(24, 10) * (1 - q(25, 8))} />
        <Plate text="NEED THE AGE FIRST" y={500} size={34} p={q(25, 12)} />
        <Motes f={f} color={C.nir} op={0.2} />
      </SVG>
    );
    zoom = 1.04 + 0.05 * (f / dur);
  } else if (n === 8) {
    // THE TAGGING TABLE. A pollock drops its stone on the first tag; the reader's hand writes the age
    // copied off the counter; tagged stones march to the hopper; the brass count lands on 8,617.
    const truck = interpolate(f, [0, dur], [30, -30]);
    const fishK = ease(f, bAt(26) - 24, 26);
    const drop = spring(f, bAt(26), 14);
    const write = ease(f, bAt(27), 34);
    const door = ease(f, bAt(28), 30);
    const march = clamp01((f - bAt(29)) / 110);
    const countK = interpolate(f, [bAt(30) - 18, bAt(30)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const cnt = since(30) >= 0 ? 8617 : Math.floor(8617 * countK * countK);
    const scrib = write > 0 && write < 1 ? Math.sin(f * 1.7) * 10 : 0;
    picture = (
      <SVG>
        <g transform={`translate(${truck},0)`}>
          <rect x={-200} width={1480} height={H} fill="#102229" />
          <rect x={-200} y={380} width={1480} height={600} fill="#0D1C22" />
          {Array.from({length: 9}, (_, i) => <rect key={i} x={-160 + i * 170} y={380} width={6} height={600} fill="#173038" />)}
          {/* the far door, at the back of the room */}
          <g transform="translate(240,930)">
            <rect x={-80} y={-280} width={160} height={280} fill="#081014" stroke={C.ink} strokeWidth={6} />
            <rect x={-70} y={-270} width={140} height={270} fill={C.lamp} opacity={0.08 + 0.6 * door} />
            <path d={`M-70,-270 L${-70 + 140 * (1 - 0.4 * door)},${-262 + 8 * (1 - door)} L${-70 + 140 * (1 - 0.4 * door)},-6 L-70,0 Z`} fill="#3A2A1E" stroke={C.ink} strokeWidth={5} />
            <path d="M-70,0 L-200,90 L220,90 L70,0 Z" fill={C.lamp} opacity={0.14 * door} />
          </g>
          <Plate text="STOCK ASSESSMENT" x={240} y={600} size={22} p={door} />
          {/* the training count, the same brass counter, large */}
          <TallyCounter x={640} y={640} scale={0.95} count={cnt} plate="TRAINING" />
          {since(30) >= 0 && since(30) < 12 && <ImpactStar cx={640} cy={640} r={200} color={C.lamp} />}
          {/* hopper on the right */}
          <g transform="translate(930,1010)">
            <ContactShadow cx={0} cy={0} rx={150} ry={14} opacity={0.5} />
            <path d="M-140,-330 L140,-330 L60,-80 L-60,-80 Z" fill={C.teal} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
            <path d="M-120,-318 L120,-318" stroke={C.nir} strokeWidth={5} opacity={0.7} />
            <rect x={-70} y={-80} width={140} height={80} fill={tones(C.brass).core} stroke={C.ink} strokeWidth={6} />
            {Array.from({length: 4}, (_, i) => <circle key={i} cx={-48 + i * 32} cy={-40} r={5} fill={tones(C.brass).key} stroke={C.ink} strokeWidth={2} />)}
          </g>
          {/* table */}
          <rect x={-200} y={1000} width={1480} height={330} fill="#3E2A1D" stroke={C.ink} strokeWidth={6} /> {/* caption-band-ok */}
          <rect x={-200} y={1000} width={1480} height={22} fill="#5A3E2A" />
          {Array.from({length: 6}, (_, i) => <path key={i} d={`M-200,${1060 + i * 44} C300,${1052 + i * 44} 700,${1070 + i * 44} 1280,${1058 + i * 44}`} fill="none" stroke="#2A1C14" strokeWidth={3} opacity={0.5} />)}
          {/* marching tagged stones, center to hopper */}
          {Array.from({length: 8}, (_, i) => {
            const u = clamp01(march * 1.7 - i * 0.11);
            if (u <= 0) return null;
            const x = lerp(560, 930, u), y = 975 - Math.abs(Math.sin(u * Math.PI * 5)) * 18 - (u > 0.86 ? (u - 0.86) * 1900 : 0);
            return <g key={i} opacity={u > 0.98 ? 0 : 1}>
              <Otolith x={x} y={y} scale={0.24} f={f} counted={0.5} shadow={false} />
              <AgeTag x={x + 26} y={y - 10} text={String(3 + i)} f={f + i * 7} scale={0.6} />
            </g>;
          })}
          {/* the first tag and stone, center stage */}
          <g transform="translate(420,960)">
            <AgeTag x={-30} y={-40} text={write > 0.75 ? '7' : ''} f={f} scale={2.0} />
            <Otolith x={10} y={-10 - 260 * (1 - drop)} scale={0.5} f={f} counted={0.6} />
          </g>
          {/* the reader's hand with a pencil, writing on the tag */}
          <g transform={`translate(${lerp(760, 600, ease(f, bAt(27) - 20, 20)) + scrib * 0.6},${1120 + scrib * 0.3}) `} opacity={ease(f, bAt(27) - 20, 14) * (1 - ease(f, bAt(29) + 10, 16))}>
            <path d="M-110,-50 L10,10" stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
            <path d="M-110,-50 L10,10" stroke="#E6B54A" strokeWidth={10} strokeLinecap="round" />
            <path d="M-110,-50 L-122,-56" stroke="#2A2A2A" strokeWidth={8} strokeLinecap="round" />
            <HandSil x={-20} y={-10} rot={-120} s={1.2} curl={0.7} fill="#C99A72" />
          </g>
          {/* the pollock, swimming in to drop its stone, then leaving */}
          <g opacity={1 - ease(f, bAt(26) + 26, 20)}>
            <Groundfish x={lerp(-360, 250, fishK) + 300 * ease(f, bAt(26) + 6, 30)} y={760} scale={1.8} f={f} kind="pollock" swim={0.8} caustics={false} />
          </g>
        </g>
        <Plate text="POLLOCK" y={500} size={30} p={q(26, 10) * (1 - q(27, 8))} />
        <Plate text="2023 · TRAINED AND TESTED" y={500} size={30} p={q(27, 10) * (1 - q(29, 8))} />
        <Plate text="TAGGED WITH AGES" y={500} size={30} p={q(29, 10) * (1 - q(30, 8))} />
        <Plate text="8,617 POLLOCK STONES · 2023" y={1250} size={30} p={q(30, 10)} />
        <Motes f={f} color={C.lamp} op={0.14} />
      </SVG>
    );
  } else if (n === 9) {
    // THE ARCHIVE. The wall falls away; drawers to a vanishing point light one by one.
    const fall = ease(f, 0, 26);
    const lit = interpolate(f, [bAt(32), bAt(33)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const burst = pop(33, 16);
    picture = (
      <SVG>
        <rect width={W} height={H} fill="#0A1418" />
        <ArchiveDrawers f={f} vy={900 + 60 * (f / dur)} rows={10} cols={7} depth={6} glint={0.3 + 0.9 * lit}
          open={{row: 6, col: 3, t: ease(f, bAt(34) - 20, 24)}} />
        {/* the bench wall falling away */}
        {fall < 1 && <g transform={`translate(0,${1400 * fall}) rotate(${10 * fall} 540 1920)`}>
          <rect width={W} height={H} fill="#2A1C14" />
          <Scope x={300} y={1200} s={1} />
        </g>}
        {burst > 0.02 && <StatBurst cx={540} cy={800} scale={1.25 * burst} big="2.5 MILLION" lines={['OTOLITH PAIRS', 'PER NOAA']} fill={C.lamp} big_fs={44} />}
        <Plate text="NOAA ARCHIVE" y={500} size={34} p={q(31, 12) * (1 - q(33, 8))} />
        <Plate text="BUILT RING BY RING" y={1250} size={30} p={q(32, 12) * (1 - q(33, 8))} />
        <Plate text="2.5 MILLION OTOLITH PAIRS · PER NOAA" y={500} size={26} p={q(33, 10)} />
        <Plate text="SINCE THE 1960s" y={1250} size={32} tone="brass" p={q(34, 12)} />
        <Motes f={f} color={C.lamp} op={0.18} rise={0.15} />
      </SVG>
    );
    dy = 80 - 160 * (f / dur);
  } else if (n === 10) {
    // THE HANGAR (signature shot). No person. A 1930s timber hangar, a propeller on a beam, drawers
    // glinting like stars, an unlabeled archive stone rising under the Chamberlin plate, crates.
    const fadeIn = ease(f, 0, 14);
    const rise = ease(f, bAt(36), 30);
    const prop = Math.sin(f / 40) * 6;
    picture = (
      <SVG>
        <rect width={W} height={H} fill="#140E0A" />
        {/* plank walls and roof trusses */}
        {/* caption-band-ok: hangar plank wall, background */}
        {Array.from({length: 14}, (_, i) => <rect key={i} x={i * 80} y={380} width={78} height={1000} fill={i % 2 ? '#3A2618' : '#33221A'} stroke="#1A100A" strokeWidth={3} />)}
        <path d="M-40,620 L540,380 L1120,620" fill="none" stroke="#5A3A22" strokeWidth={26} />
        <path d="M-40,620 L540,380 L1120,620" fill="none" stroke={C.ink} strokeWidth={6} />
        {[160, 360, 720, 920].map((x, i) => <path key={i} d={`M${x},${620 - Math.abs(540 - x) * 0} L540,380`} stroke="#4A3020" strokeWidth={12} />)}
        <rect x={-20} y={610} width={1120} height={24} fill="#5A3A22" stroke={C.ink} strokeWidth={5} />
        {/* the propeller on the beam */}
        <g transform={`translate(540,640) rotate(${prop})`}>
          <path d="M-260,8 C-180,-24 -40,-14 0,0 C40,-14 180,-24 260,8 C180,20 40,14 0,4 C-40,14 -180,20 -260,8 Z" fill="#6A4628" stroke={C.ink} strokeWidth={6} />
          <circle r={22} fill={tones(C.brass).core} stroke={C.ink} strokeWidth={5} />
        </g>
        <g opacity={fadeIn}>
          <g transform="translate(140,700) scale(0.75)">
            <ArchiveDrawers w={1080} h={1000} vx={540} vy={560} f={f} rows={8} cols={7} depth={4} glint={1.2} />
          </g>
        </g>
        <radialGradient id="s10l" cx="0.5" cy="0.5" r="0.5"><stop stopColor={C.lamp} stopOpacity={0.4} /><stop offset="1" stopColor={C.lamp} stopOpacity={0} /></radialGradient>
        <ellipse cx={540} cy={960} rx={380} ry={300} fill="url(#s10l)" />
        <Otolith x={540} y={lerp(1130, 900, rise)} scale={0.5} f={f} counted={1} shadow={false} rot={-6} />
        <BrassPlate x={540} y={1110} lines={['"A PERFECT LITTLE TIME CAPSULE"', 'DEREK CHAMBERLIN · NOAA FISHERIES']} set={q(36, 16)} scale={0.85} w={760} size={30} />
        {/* crates stamping shut */}
        {[0, 1, 2].map((i) => {
          const k = spring(f, bAt(37) + i * 6, 12);
          return <g key={i} transform={`translate(${170 + i * 370},1230)`}>
            <ContactShadow cx={0} cy={40} rx={120} ry={12} opacity={0.5} />
            <rect x={-120} y={-60} width={240} height={100} fill="#6A4A2A" stroke={C.ink} strokeWidth={5} />
            <path d={`M-120,-60 L120,-60 L${120 - 0},${-60 - 70 * (1 - k)} L-120,${-60 - 70 * (1 - k)} Z`} fill="#7A5A36" stroke={C.ink} strokeWidth={4} />
          </g>;
        })}
        <Plate text="AROUND 2 MILLION · SEATTLE · 1930s HANGAR" y={500} size={26} p={q(35, 12)} />
        {since(37) >= 0 && <Stamp cx={540} cy={1180} s={0.55 * spring(f, bAt(37) + 12, 12)} text="MOVED · 2012" rot={-6} color={C.lamp} />}
        <Motes f={f} color={C.lamp} op={0.25} rise={0.12} />
      </SVG>
    );
  } else if (n === 11) {
    // THE NEXT STEP. Credit first (the trophy), then the tag climbs to AGE, reaches for the dashed
    // step and slips back; the dashed step leads to the SAME lit STOCK ASSESSMENT door from the
    // tagging room; NEXT STEP stamps into the empty outline.
    const tagStep1 = ease(f, bAt(40), 22);
    const reach = ease(f, bAt(42), 18);
    const slip = ease(f, bAt(42) + 22, 18);
    const flick = 0.55 + 0.45 * Math.abs(Math.sin(f / 4));
    const doorLit = q(43, 16);
    const up = reach * (1 - slip);
    const tagX = lerp(lerp(180, 330, tagStep1), 520, up);
    const tagY = lerp(lerp(1270, 1110, tagStep1), 920, up) - Math.sin(slip * Math.PI) * 40;
    const b = tones(C.brass);
    picture = (
      <SVG>
        <rect width={W} height={H} fill="#0C1A20" />
        <radialGradient id="s11l" cx="0.15" cy="0.65" r="0.7"><stop stopColor={C.lamp} stopOpacity={0.3} /><stop offset="1" stopColor={C.lamp} stopOpacity={0} /></radialGradient>
        <rect width={W} height={H} fill="url(#s11l)" />
        {/* step 1 AGE, solid brass */}
        <ContactShadow cx={330} cy={1300} rx={180} ry={14} opacity={0.5} />
        <rect x={190} y={1150} width={280} height={150} fill={b.base} stroke={C.ink} strokeWidth={7} />
        <rect x={190} y={1150} width={280} height={22} fill={b.key} />
        <text x={330} y={1250} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={46} fill={C.ink}>AGE</text>
        {/* step 2, dashed, never filled */}
        <g opacity={q(41, 10) * flick}>
          <rect x={450} y={950} width={280} height={350} fill="none" stroke={C.cream} strokeWidth={6} strokeDasharray="20 14" />
          <text x={590} y={1110} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.cream} opacity={doorLit}>STOCK</text>
          <text x={590} y={1150} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.cream} opacity={doorLit}>ASSESSMENT</text>
        </g>
        {/* step 3 CATCH LIMITS, solid, with the lit door on top */}
        <rect x={710} y={760} width={320} height={540} fill={b.core} stroke={C.ink} strokeWidth={7} />
        <rect x={710} y={760} width={320} height={22} fill={b.base} />
        <text x={870} y={860} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>CATCH</text>
        <text x={870} y={898} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>LIMITS</text>
        <g transform="translate(940,760)">
          <rect x={-70} y={-270} width={140} height={270} fill="#081014" stroke={C.ink} strokeWidth={6} />
          <rect x={-60} y={-260} width={120} height={260} fill={C.lamp} opacity={0.15 + 0.6 * doorLit} />
          <path d="M-60,0 L-150,30 L130,30 L60,0 Z" fill={C.lamp} opacity={0.18 * doorLit} />
        </g>
        <g opacity={q(41, 16)}>
          <Character frame={from + f} x={lerp(1060, 800, ease(f, bAt(41), 30))} y={760} scale={0.62} facing={-1}
            pose={since(41) < 34 ? 'stand' : 'arms-crossed'} walking={since(41) >= 0 && since(41) < 30}
            emotion="neutral" outfit="vest" glasses headgear="cap" />
        </g>
        {/* the NIR reader at the foot, with its engineers' trophy */}
        <NIRReader x={110} y={1300} scale={0.34} f={f} beam={0.4} spectrum={1} seed={3} plate="" cloth={1} trophy={q(39, 18)} rails={false} />
        <MachineTag x={tagX} y={tagY} s={1.2} />
        {since(42) > 18 && since(42) < 30 && <ImpactStar cx={520} cy={930} r={70} color={C.cream} />}
        {since(44) >= 0 && <Stamp cx={590} cy={1050} s={0.42 * spring(f, bAt(44), 12)} text="NEXT STEP" rot={-8} color={C.lamp} />}
        <Plate text="THE FAIR CASE AGAINST" y={520} size={40} p={pop(38, 14) * (1 - q(39, 8))} />
        <Plate text="CREDIT: THE ENGINEERS" y={520} size={32} p={q(39, 10) * (1 - q(40, 8))} />
        <Plate text="AGE" x={330} y={1060} size={26} p={q(40, 10) * (1 - q(41, 8))} />
        <Plate text="FISHERY MANAGERS" y={520} size={32} p={q(41, 10) * (1 - q(42, 8))} />
        <Plate text="NOAA, 2023" y={520} size={32} p={q(42, 10) * (1 - q(43, 8))} />
        <Plate text="STOCK ASSESSMENT" y={520} size={32} p={q(43, 10) * (1 - q(44, 8))} />
        <Plate text="NEXT STEP" y={520} size={40} tone="brass" p={q(44, 10)} />
        <Motes f={f} color={C.lamp} op={0.16} />
      </SVG>
    );
    dy = interpolate(f, [0, dur], [40, -30]);
  } else if (n === 12) {
    // MANAGERS SET LIMITS, NOT MACHINES. The pen drags a numberless line; focus racks across the hall
    // to the reader, still clicking under the lamp.
    const rack = ease(f, bAt(46) - 8, 18);
    const line = ease(f, bAt(45) + 6, 40);
    const click = (f % 10) / 10;
    picture = (
      <SVG>
        <rect width={W} height={H} fill="#0C1A20" />
        <defs>
          <filter id="s12fg"><feGaussianBlur stdDeviation={8 * rack} /></filter>
          <filter id="s12bg"><feGaussianBlur stdDeviation={8 * (1 - rack)} /></filter>
        </defs>
        {/* background: the reader across the hall */}
        <g filter="url(#s12bg)">
          <radialGradient id="s12l" cx="0.5" cy="0.5" r="0.5"><stop stopColor={C.lamp} stopOpacity={0.5} /><stop offset="1" stopColor={C.lamp} stopOpacity={0} /></radialGradient>
          <ellipse cx={760} cy={760} rx={300} ry={240} fill="url(#s12l)" />
          <Scope x={820} y={900} s={0.6} />
          <Character frame={from + f} x={660} y={920} scale={0.5} facing={1} pose="carry" gesture={0.55 + 0.45 * Math.abs(Math.sin(f / 6))} outfit="flannel" hairStyle="long" glasses />
          <TallyCounter x={720} y={800} scale={0.16} count={300 + f / 10} press={clamp01(1 - click * 3)} />
        </g>
        {/* foreground: the clipboard and the pen */}
        <g filter="url(#s12fg)">
          <rect x={120} y={860} width={620} height={420} rx={16} fill={C.paper} stroke={C.ink} strokeWidth={6} transform="rotate(-4 430 1070)" />
          <rect x={300} y={840} width={260} height={50} rx={10} fill={tones(C.brass).core} stroke={C.ink} strokeWidth={5} />
          <path d={`M180,1100 L${180 + 460 * line},${1092}`} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
          {Array.from({length: 4}, (_, i) => <rect key={i} x={180} y={960 + i * 34} width={300 - i * 40} height={10} rx={5} fill="#8A8476" opacity={0.5} />)}
          <g transform={`translate(${180 + 460 * line},1092)`}>
            <path d="M0,0 L60,-150" stroke={C.ink} strokeWidth={16} strokeLinecap="round" />
            <path d="M0,0 L60,-150" stroke={C.teal} strokeWidth={10} strokeLinecap="round" />
            <HandSil x={50} y={-120} rot={-24} s={1.1} curl={0.6} fill="#B98A64" />
          </g>
          <g transform="translate(860,1230)"><MachineTag x={0} y={0} s={0.9} /></g>
        </g>
        <Plate text="MANAGERS SET LIMITS" y={500} size={36} p={q(45, 12) * (1 - q(46, 8))} />
        <Plate text="NOT MACHINES" x={860} y={1140} size={26} p={ease(f, bAt(45) + 70, 12)} />
        <Plate text="MICROSCOPE STAYS IN THE PROCESS" y={500} size={28} p={q(46, 12)} />
      </SVG>
    );
    zoom = 1 + 0.05 * (f / dur);
  } else if (n === 13) {
    // LOOK WHERE THE SPEED CAME FROM. The reader feeds hand-tagged stones to the hopper; through the
    // AGE OUT shutter the question mark flips to a handwritten tag; the line tears into ticks that
    // curve into rings, magenta turning pearl; the cloth comes off the plate.
    const feed = ease(f, bAt(47), 40);
    const glow = q(48, 30);
    const dive = ease(f, bAt(49) - 24, 22);
    const flip = ease(f, bAt(49), 16);
    const turn = ease(f, bAt(50), 34);
    const cloth = 1 - ease(f, bAt(48), 22);
    const pts = spectrumPoints(700, 300, 3, 56);
    const benchView = (
      <g opacity={1 - dive}>
        <Bench f={f} id="s13" velvet={false} lampX={240} lampY={900} />
        <NIRReader x={650} y={1250} scale={1.0} f={f} beam={0.5 + 0.5 * glow} spectrum={1} seed={3} plate="TRAINED ON THE ARCHIVE" cloth={cloth} />
        <g transform={`translate(${lerp(-80, 330, feed)},1230)`}>
          <rect x={-120} y={-40} width={240} height={50} rx={6} fill="#4A3020" stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 5}, (_, k) => <g key={k}>
            <ellipse cx={-90 + k * 44} cy={-16} rx={16} ry={11} fill={C.pearl} stroke={C.ink} strokeWidth={2} />
            <AgeTag x={-84 + k * 44} y={-24} text={String(4 + k)} f={f + k * 5} scale={0.38} />
          </g>)}
        </g>
        <Character frame={from + f} x={lerp(-140, 150, feed)} y={1290} scale={0.95} facing={1} pose="carry" gesture={feed} outfit="flannel" hairStyle="long" glasses />
        <ellipse cx={540} cy={900} rx={500} ry={400} fill={C.lamp} opacity={0.1 * glow} />
      </g>
    );
    picture = (
      <SVG>
        {benchView}
        {dive > 0.01 && (
          <g opacity={dive}>
            <rect width={W} height={H} fill="#12060C" />
            <g transform="translate(540,720) scale(1.6)">
              <rect x={-64} y={-62} width={128} height={124} rx={10} fill="#081014" stroke={C.ink} strokeWidth={6} />
              <rect x={-64} y={-62} width={128} height={124} rx={10} fill="none" stroke={C.brass} strokeWidth={8} />
              {flip < 0.5 ? <QMark x={0} y={-6} s={0.9} wob={Math.sin(f / 5) * 10} /> : <AgeTag x={-40} y={-50} text="7" f={f} scale={1.0} flip={0} />}
            </g>
            {/* the line tears into ticks that curve and land as rings around a core */}
            <g>
              {pts.map(([px, py], i) => {
                const ringIdx = i % 7;
                const a = (i / pts.length) * Math.PI * 2 * 3 + ringIdx;
                const rx = 60 + ringIdx * 34, ry = 40 + ringIdx * 23;
                const tx = 540 + Math.cos(a) * rx, ty = 1110 + Math.sin(a) * ry;
                const sx = 190 + px, sy = 960 + py * 0.6;
                const k = clamp01(turn * 1.3 - (i / pts.length) * 0.3);
                const x = lerp(sx, tx, k), y = lerp(sy, ty, k) - Math.sin(k * Math.PI) * 60;
                const ang = lerp(0, (a * 180) / Math.PI + 90, k);
                const col = k > 0.95 && ringIdx === 6 ? C.lamp : mixHex(C.nir, C.pearl, k);
                return <rect key={i} x={x - 2.5} y={y - 12} width={5} height={24} rx={2.5} fill={col} transform={`rotate(${ang} ${x} ${y})`} />;
              })}
              {turn < 0.05 && <SpectralLine x={190} y={960} w={700} h={180} seed={3} progress={1} width={6} />}
              <ellipse cx={540} cy={1110} rx={14} ry={10} fill={C.pearl} opacity={turn} />
            </g>
          </g>
        )}
        {/* the plate, held big once its cloth is off */}
        <g transform="translate(540,600)" opacity={ease(f, bAt(48) + 14, 10) * (1 - dive)}>
          <rect x={-200} y={-34} width={400} height={68} rx={8} fill={C.brass} stroke={C.nir} strokeWidth={4} />
          <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>TRAINED ON THE ARCHIVE</text>
          {cloth > 0.01 && <rect x={-210 + 500 * (1 - cloth)} y={-44 - 80 * (1 - cloth)} width={420} height={88} fill="#7B2B3C" stroke={C.ink} strokeWidth={4} opacity={cloth} />}
        </g>
        <Plate text="SPEED · METHOD" y={500} size={34} p={q(47, 12) * (1 - q(48, 8))} />
        <Plate text="TRAINED ON THE ARCHIVE" y={500} size={32} tone="brass" p={q(48, 12) * (1 - ease(f, bAt(49) - 24, 8))} />
        <Plate text="CHECKED AGAINST MICROSCOPE AGES" y={500} size={28} p={q(49, 10) * (1 - q(50, 8))} />
        <Plate text="THE COUNT CAME FIRST" y={1250} size={30} p={q(50, 12)} />
      </SVG>
    );
    zoom = 1 + 0.06 * dive;
  } else if (n === 14) {
    // SOMEBODY COUNTED. Human only: the 1878 stone under the objective, a thumb, the final click on
    // "counted" reads 0144, the rings ripple, then the rockfish of frame 1.
    const click = since(52) >= 0;
    const press = since(52) >= 0 && since(52) < 8 ? 1 - since(52) / 8 : 0;
    const ripple = click ? clamp01(since(52) / 24) : 0;
    const loop = ease(f, bAt(53), 8);
    picture = (
      <SVG>
        <Bench f={f} id="s14" />
        <BenchScope x={540} y={860} scale={1.05} drop={1} lamp={1} f={f} />
        <Otolith x={540} y={860} scale={1.55} f={f} rings={14} counted={1} pulse={ripple} rot={-8} />
        <TallyCounter x={820} y={1110} scale={0.62} count={click ? 144 : 143} press={press} plate="RINGS" />
        <HandSil x={905} y={1235} rot={-35} s={0.7} curl={0.5 + 0.4 * press} fill="#B98A64" />
        <BrassPlate x={540} y={1250} lines={['SOMEBODY COUNTED']} set={q(51, 16)} scale={0.9} w={560} size={44} />
        <Plate text="0144" x={820} y={960} size={26} p={q(52, 8)} />
        {loop > 0.01 && <g opacity={loop}>
          <Water f={f} id="s14w" />
          <Groundfish x={-260 + 4 * since(53)} y={900} scale={2.6} f={f} kind="rockfish" swim={0.8} />
        </g>}
      </SVG>
    );
    zoom = 1 + 0.04 * (f / dur);
  }

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px) scale(${zoom}) translateX(${drift * 5}px)`}}>
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
