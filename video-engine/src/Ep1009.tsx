import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, NightGrade, INK, ContactShadow} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {SteelVessel, TwinVessel, LoopGovernor, CellSurface, VESSEL_PATH, BP} from './lib/bioprocess';
import {SIM} from './lib/simulation';
import {SearchReticle} from './lib/vision';
import {
  RF, TankFace, TankMood, PowerGauge, Cable, AshHeap, Barge, CheapSun, NameChair, AwardPie, Envelope,
  SampleJars, Tarp, Monitor, Snowfall, FrostYardDusk, PriceTag, monoW,
} from './lib/refinery';

// THE DESIGN BRIEF, 2026-10-09. Palette roles are art_direction.json. EMBER means only electricity, SIM lime only the model.
// Every painted string is a claims.json on_screen string, a quote, or a plain label.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const C = {
  ink: INK, paper: RF.paper, stamp: '#7A2236', amber: '#E9DDA8', sim: SIM,
  wood: '#4A3A2B', woodDark: '#2E241B', shed: '#26324F', shedLight: '#3B4A70',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
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

// ---- THE GAUGE: one global timeline so the needle, lamp and world agree in every shot ----------------------------
const GT = [0, 0.4, 0.55, 3, 7.7, 12, 25, 34, 35.5, 42.7, 43.5, 44.5, 45.5, 46.5, 48, 51.4, 53, 58, 68, 77.3, 80.58, 82, 83.5, 85.5, 87, 101, 102.4, 104, 116.6, 116.8, 130];
const GV = [0.72, 0.72, 0.1, 0.18, 0.5, 0.55, 0.5, 0.5, 0.45, 0.5, 0.9, 0.15, 0.85, 0.3, 0.5, 0.5, 0.12, 0.2, 0.2, 0.2, 0.18, 0.36, 0.36, 0.14, 0.14, 0.2, 0.62, 0.64, 0.1, 0.1, 0.1];
const gaugeAt = (t: number) => interpolate(t, GT, GV, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
const jitterAt = (t: number) => (t > 42.7 && t < 48.5 ? 7 : t > 51 && t < 68 ? 3.2 : t > 116.6 ? 4 : t > 34 && t < 43 ? 2 : 1.1);
type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};
const gt = (p: SP) => (p.from + p.f) / 30;

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'paper' | 'stamp' | 'amber';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#10151F', fg: C.paper},
  paper: {fill: C.paper, fg: C.ink},
  stamp: {fill: C.stamp, fg: C.paper},
  amber: {fill: '#E9DDA8', fg: C.ink},
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
  const sc = 0.84 + 0.16 * spring(k * 20, 0, 20);
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
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={1} fill={C.stamp}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: push, kick, grade ---------------------------------------------------------
const PLANNED = 'PLANNED WORK · ILLUSTRATION';
const Frame: React.FC<{p: SP; z0?: number; z1?: number; zk?: (f: number) => number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; night?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; children: React.ReactNode}> =
({p, z0 = 1, z1 = 1.05, zk, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, night = 0.2, bloom = 0.06, vignette = 0.32, ox = 540, oy = 900, tag = true, overlay, tagText = PLANNED, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const z = zk ? zk(p.f) : lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur)));
  const gtT = (p.from + p.f) / 30;
  const dark = gtT > 51 && gtT < 104 ? 0.16 * clamp01((gtT - 51) / 40) * (1 - clamp01((gtT - 100) / 4)) : 0;
  night = night > 0 ? night + dark : night;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + lerp(dx0, dx1, t)}px, ${jl.y + lerp(dy0, dy1, t)}px) scale(${z * jl.scale})`, transformOrigin: `${ox}px ${oy}px`}}>
        {children}
      </div>
      {night > 0 && <NightGrade f={p.f} amount={night} />}
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#10151F" stroke={C.paper} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={C.paper}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.03} />
    </AbsoluteFill>
  );
};

// ---- the hero: a steel tank with a face, or its lime ghost -----------------------------------------------------------
const Tank: React.FC<{f: number; x: number; y: number; s?: number; mood?: TankMood; look?: number; lookY?: number; sweat?: number; shiver?: number; phase?: number; ghost?: number; flip?: boolean}> =
({f, x, y, s = 1.5, mood = 'calm', look = 0, lookY = 0, sweat = 0, shiver = 0, phase = 0, ghost = 0, flip = false}) => (
  <g transform={flip ? `translate(${2 * x},0) scale(-1,1)` : undefined}>
    {/* the tank is PLANNED: a dashed lime model outline rides around the steel everywhere it stands in the yard */}
    <g transform={`translate(${x},${y}) scale(${s * 1.07})`} opacity={ghost < 1 ? 0.95 : 0}>
      <path d={VESSEL_PATH} fill="none" stroke={SIM} strokeWidth={5 / s} strokeDasharray={`${16 / s} ${9 / s}`} strokeDashoffset={-f * 0.6} />
      <g transform={s > 2.2 ? 'translate(150,-262)' : 'translate(0,-318)'}><rect x={-58} y={-18} width={116} height={34} rx={4} fill="#10151F" stroke={SIM} strokeWidth={2.4 / s} /><text y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill={SIM}>PLANNED</text></g>
    </g>
    {ghost < 1 && (
      <g opacity={1 - ghost}>
        <SteelVessel f={f} x={x} y={y} scale={s} lid={0} phase={phase} mouth={0} shiver={shiver} gain={2.6}
          face={<TankFace f={f} mood={mood} look={flip ? -look : look} lookY={lookY} sweat={sweat} phase={phase} />} />
      </g>
    )}
    {ghost > 0 && (
      <g opacity={ghost}>
        <TwinVessel f={f} x={x} y={y} scale={s} drawn={clamp01(ghost)} running={0.6} phase={phase} />
        <g transform={`translate(${x},${y}) scale(${s})`}><TankFace f={f} mood={mood === 'calm' ? 'ghost' : mood} look={look} lookY={lookY} sweat={sweat} phase={phase} /></g>
      </g>
    )}
  </g>
);

/** the gauge at its global value, with the cable to wherever it feeds */
const Gauge: React.FC<{p: SP; x: number; y: number; s?: number; plate?: string; plateTone?: 'ink' | 'ember' | 'paper'; phase?: number}> = ({p, x, y, s = 1, plate, plateTone, phase = 0}) => {
  const t = gt(p);
  const v = gaugeAt(t);
  return <PowerGauge f={p.f + p.from} x={x} y={y} scale={s} value={v} jitter={jitterAt(t)} glow={clamp01(v * 1.4)} plate={plate} plateTone={plateTone} phase={phase} />;
};

// ---- helpers: the barrel window of cells, hatch fill, the planned governor, a pen ----------------------------------------------------
const nightOf = (v: number, base = 0.12) => base + 0.4 * (1 - clamp01(v));

/** the cutaway window in the tank barrel: `stall` 0 working .. 1 all drooped */
const CellWindow: React.FC<{f: number; x: number; y: number; s: number; stall: number; n?: number}> = ({f, x, y, s, stall, n = 18}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-72} y={-122} width={144} height={104} rx={10} fill="#0F1A33" stroke={C.ink} strokeWidth={5} />
    <rect x={-66} y={-116} width={132} height={92} rx={6} fill="#9AB083" opacity={0.08 + 0.12 * (1 - stall)} />
    {Array.from({length: n}, (_, i) => {
      const cx = -56 + (i % 6) * 22;
      const cy = -90 + Math.floor(i / 6) * 28;
      const down = stall > 0.25 + rnd(i) * 0.55;
      return (
        <g key={i} transform={`translate(${cx},${cy + (down ? 9 : 0)}) rotate(${down ? 24 : 0})`}>
          <ellipse cx={0} cy={0} rx={9} ry={8} fill={down ? '#8A8F78' : '#9AB083'} stroke={C.ink} strokeWidth={2.4}
            transform={`scale(${1 + (down ? 0 : 0.12 * Math.sin(f / 4 + i))},${1 + (down ? 0 : 0.12 * Math.cos(f / 5 + i))})`} />
          <circle cx={-2.6} cy={-1} r={1.6} fill={C.ink} /><circle cx={3} cy={-1} r={1.6} fill={C.ink} />
        </g>
      );
    })}
  </g>
);

/** pencil hatch ticks that fill the model outline as if it is still being designed */
const HatchFill: React.FC<{x: number; y: number; s: number; p: number}> = ({x, y, s, p}) => {
  const id = `hf${Math.round(x)}`;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={0.9}>
      <defs><clipPath id={id}><path d={VESSEL_PATH} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        {Array.from({length: 22}, (_, i) => (
          <path key={i} d={`M ${-120 + i * 12} 0 L ${-60 + i * 12} ${-232}`} stroke={SIM} strokeWidth={1.6} opacity={0.5}
            strokeDasharray="300" strokeDashoffset={300 * (1 - clamp01(p * 22 - i))} />
        ))}
      </g>
    </g>
  );
};

/** the governor drawn as PLANNED: a dashed lime frame and tag around the shelf LoopGovernor */
const PlannedGovernor: React.FC<{f: number; fl: number; x: number; y: number; s: number; spin: number; throttle?: number; strain?: number}> = ({f, fl, x, y, s, spin, throttle = 0.5, strain = 0}) => (
  <g>
    <rect x={x - 90 * s} y={y - 190 * s} width={180 * s} height={206 * s} rx={14} fill="none" stroke={SIM} strokeWidth={4} strokeDasharray="16 10" strokeDashoffset={-f * 1.4} opacity={0.9} />
    <g opacity={0.92}><LoopGovernor f={fl} x={x} y={y} scale={s} spin={spin} throttle={throttle} strain={strain} /></g>
    <g transform={`translate(${x},${y - 214 * s})`}>
      <rect x={-52} y={-16} width={104} height={30} rx={4} fill="#10151F" stroke={SIM} strokeWidth={2.4} />
      <text y={6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} letterSpacing={2} fill={SIM}>PLANNED</text>
    </g>
  </g>
);

// ---- S1: the needle slams, the half-drawn model tank flinches ---------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t = gt(p);
  const v = gaugeAt(t);
  const slam = f >= 12 && f < 40 ? 1 : 0;
  const mood: TankMood = f < 12 ? 'ghost' : f < b(2) ? 'gasp' : 'worried';
  return (
    <Frame p={p} z0={1.16} z1={1.0} dy0={-60} dy1={0} night={nightOf(v, 0.1)}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1210} />
        <PriceTag f={f} x={968} y={690} scale={0.9} creep={0} snap={0} />
        <Cable f={f + p.from} x0={660} y0={1100} x1={540} y1={1080} sag={90} live={clamp01(v * 1.6)} />
        <Tank f={f} x={300} y={1270} s={2.1} ghost={0.5 + 0.5 * ease(f, 0, 34)} mood={mood} look={0.9} sweat={ease(f, b(2), 40)} shiver={slam * 2.2} />
        <HatchFill x={300} y={1270} s={2.1} p={ease(f, b(2) - 6, 60)} />
        <Gauge p={p} x={740} y={1270} s={1.6} />
        <Plate text="A TANK NERVOUS ABOUT POWER" y={685} size={32} tone="paper" p={ease(f, 8, 10)} drop={50} />
        <Snowfall f={f + p.from} />
      </SVG>
    </Frame>
  );
};

// ---- S2: four chairs at a round table in the snow (UAF joins LAST) ---------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const v = gaugeAt(gt(p));
  const card = ease(f, 0, 10);
  const lit = ease(f, b(6), 14);
  const chairs = [
    {label: 'UAF', x: 170, a: spring(f, b(6) - 6, 24), join: true},
    {label: 'UAA', x: 400, a: spring(f, b(5) - 14, 26)},
    {label: 'MONTANA TECH', x: 640, a: spring(f, b(5) - 6, 26)},
    {label: 'WYOMING', x: 880, a: spring(f, b(5) + 2, 26)},
  ];
  return (
    <Frame p={p} z0={1.2} z1={1.0} oy={1100} night={nightOf(v, 0.1)} tag={false}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1150} shift={40 * easeIO(f, 0, 200)} />
        {chairs.map((c, i) => (
          <NameChair key={i} x={c.x} y={1160} scale={1.25} label={c.label} arrive={c.a} join={!!c.join && lit > 0.2}
            tone={['#6E6A8F', '#5E7AA8', '#7C9C8C', '#8A7A9E'][i]} />
        ))}
        <ContactShadow cx={540} cy={1240} rx={420} ry={34} opacity={0.5} />
        <ellipse cx={540} cy={1250} rx={500} ry={96} fill={C.wood} stroke={C.ink} strokeWidth={7} />
        <ellipse cx={540} cy={1234} rx={488} ry={84} fill="#6B543B" stroke={C.ink} strokeWidth={4} />
        <path d="M 470 1320 L 470 1366 M 610 1320 L 610 1366" stroke={C.ink} strokeWidth={10} />
        {[360, 540, 720].map((mx, i) => (
          <g key={i} transform={`translate(${mx},1230)`}>
            <rect x={-16} y={-24} width={32} height={26} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
            <path d={`M ${-4 + 3 * Math.sin(f / 9 + i)} -30 q 6 -18 0 -34`} fill="none" stroke="#fff" strokeWidth={3} opacity={0.5} />
          </g>
        ))}
        <Plate text="" displayLines={['UAF NEWS · OCTOBER 5TH', '$6 MILLION NSF']} y={585} size={30} tone="paper" p={card} drop={50} />
        <Plate text="UAF · JOINING" y={745} size={30} tone="amber" p={ease(f, b(6), 8)} drop={30} />
        <Plate text="" displayLines={['UAA · MONTANA TECH · WYOMING']} y={835} size={24} tone="ink" p={ease(f, b(7), 10)} drop={30} />
        <Snowfall f={f + p.from} />
      </SVG>
    </Frame>
  );
};

// ---- S3: the pie on a paper award ledger ---------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const grow = spring(f, 0, 22);
  const cut = easeIO(f, b(9) - 10, 28);
  const pen = ease(f, b(9) + 10, 14);
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={1000} night={0} tag={false}>
      <SVG>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1980} fill="#E4DCC4" />
        {Array.from({length: 30}, (_, i) => <path key={i} d={`M -20 ${60 + i * 66} L 1100 ${60 + i * 66}`} stroke="#8FA3A0" strokeWidth={2.4} opacity={0.55} />)}
        <path d="M 120 -20 L 120 1960" stroke="#7A2236" strokeWidth={3} opacity={0.35} />
        {[0, 1, 2, 3].map((i) => (<g key={i} transform={`translate(0,${1260 + i * 0})`}><rect x={150 + i * 205} y={1230} width={190} height={46} fill="none" stroke="#6E7D83" strokeWidth={3} /><rect x={162 + i * 205} y={1246} width={60 + 30 * ((i * 37) % 4)} height={12} fill="#6E7D83" opacity={0.6} /></g>))}
        <ContactShadow cx={540} cy={1150} rx={380} ry={30} opacity={0.3} />
        <AwardPie f={f} x={540} y={1000} scale={1.45} cut={cut} grow={grow} />
        <g transform={`translate(${540 - 0.46 * 1.45 * (125 + 56 * cut)},${1000 - 0.89 * 1.45 * (125 + 56 * cut)})`} opacity={cut}>
          <path d="M 0 0 L 0 -120" stroke={C.ink} strokeWidth={7} />
          <path d="M 0 -120 L -100 -92 L 0 -64 Z" fill="#E9DDA8" stroke={C.ink} strokeWidth={5} />
        </g>
        <g transform={`translate(${860 - 120 * pen},${1200 - 160 * pen}) rotate(-35)`} opacity={pen}>
          <rect x={-8} y={-130} width={16} height={130} fill="#2B3446" stroke={C.ink} strokeWidth={4} />
          <path d="M -8 0 L 8 0 L 0 26 Z" fill="#E9DDA8" stroke={C.ink} strokeWidth={3} />
        </g>
        <Plate text="" displayLines={['UAF SHARE · ABOUT $913,000', 'OF ABOUT $6 MILLION · TO SCALE']} y={585} size={28} tone="amber" p={ease(f, b(8), 10)} drop={40} />
      </SVG>
    </Frame>
  );
};

// ---- S4: waste or feedstock (no tank, a low look up the heap) ----------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const v = gaugeAt(gt(p));
  const flip = ease(f, b(10) + 4, 20);
  return (
    <Frame p={p} z0={1.0} z1={1.1} dx0={-10} dx1={16} night={nightOf(v, 0.1)}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1320} shift={80 * easeIO(f, 0, 150)} />
        <Gauge p={p} x={990} y={1330} s={0.6} />
        <AshHeap f={f + p.from} x={560} y={1400} scale={2.0} flip={flip} look={-0.6} scoop={0} />
        {Array.from({length: 7}, (_, i) => {
          const t = ((f + i * 31) / 140) % 1;
          const px = 380 + 560 * t * 0.5 + i * 24;
          const py = 1370 - 330 * Math.sin(Math.min(1, t) * Math.PI * 0.5) - (i % 3) * 18;
          return (
            <g key={i} transform={`translate(${px},${py})`} opacity={ease(f, b(11) - 40 + i * 8, 10)}>
              <ellipse rx={13} ry={10} fill="#9AB083" stroke={C.ink} strokeWidth={3} />
              <circle cx={-3} cy={-1} r={1.8} fill={C.ink} /><circle cx={4} cy={-1} r={1.8} fill={C.ink} />
              <circle cx={10} cy={-14} r={4} fill={RF.coal} stroke={C.ink} strokeWidth={1.6} />
            </g>
          );
        })}
        <Plate text="COAL REFUSE AND ASH" y={585} size={30} tone="paper" p={ease(f, b(10), 10)} drop={40} />
        <Snowfall f={f + p.from} />
      </SVG>
    </Frame>
  );
};

// ---- S5: atoms cling to the OUTSIDE of the wall (macro) -----------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const bound = ease(f, 6, 70);
  const rej = clamp01(((f - (b(13) - 8)) % 70) / 50) * (f > b(13) - 8 ? 1 : 0);
  return (
    <Frame p={p} z0={1.5} z1={1.0} ox={800} oy={820} night={0.05} overlay={<>
      <Plate text="ATOMS CLING OUTSIDE · ILLUSTRATIVE" y={585} size={26} tone="paper" p={ease(f, 2, 10)} drop={40} />
      <Plate text="ONE KNOWN MECHANISM · ILLUSTRATIVE" y={685} size={22} tone="ink" p={ease(f, b(13), 10)} drop={30} />
    </>}>
      <SVG>
        <defs>
          <radialGradient id="mac" cx="50%" cy="46%" r="75%">
            <stop offset="0" stopColor="#35426C" /><stop offset="1" stopColor="#0E1530" />
          </radialGradient>
        </defs>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill="url(#mac)" />
        {Array.from({length: 22}, (_, i) => (
          <circle key={i} cx={rnd(i) * 1080} cy={((rnd(i + 40) * 1920 - f * (0.4 + rnd(i + 80))) % 1920 + 1920) % 1920} r={6 + rnd(i + 120) * 34} fill="#8EA6E0" opacity={0.07 + 0.06 * rnd(i + 5)} />
        ))}
        <CellSurface f={f} cx={470} cy={900} r={250} bound={bound} reject={rej} />
      </SVG>
    </Frame>
  );
};

// ---- S6: two AI tools, a plank bench in the snow ---------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const v = gaugeAt(gt(p));
  const rank = ease(f, b(15) + 28, 20);
  const rx = 160 + 280 * (0.5 + 0.5 * Math.sin(f / 22)) * (1 - rank) + (rank > 0 ? 140 : 0);
  const lift = ease(f, b(16), 40);
  const twitch = Math.sin(f / 5) * (0.4 + lift);
  return (
    <Frame p={p} z0={1.0} z1={1.06} night={nightOf(v, 0.1)}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1180} />
        <ContactShadow cx={540} cy={1330} rx={560} ry={22} opacity={0.5} />
        <rect x={-20} y={1240} width={1120} height={42} fill="#6B4E2E" stroke={C.ink} strokeWidth={6} />
        {[80, 520, 990].map((lx) => <rect data-band="ok" key={lx} x={lx} y={1282} width={26} height={60} fill="#4A3A2B" stroke={C.ink} strokeWidth={5} />)}
        <line x1={540} y1={560} x2={540} y2={1330} stroke={C.paper} strokeWidth={6} strokeDasharray="22 14" opacity={0.5} />
        <SampleJars f={f + p.from} x={300} y={1262} scale={1.2} rank={rank} />
        <SearchReticle x={rx} y={1060} f={f} lock={rank} r={70} color={C.paper} ghosts={3} />
        <g transform={`translate(770,1262) scale(${1 + 0.014 * twitch},${1 - 0.014 * twitch})`}>
          <ContactShadow cx={0} cy={6} rx={170} ry={16} opacity={0.5} />
          <rect x={-100} y={-176} width={200} height={176} fill="#8E6B3E" stroke={C.ink} strokeWidth={6} />
          <Tarp x={0} y={4} w={290} h={230} pull={0.06 * lift} f={f} />
        </g>
        <Plate text="TWO AI TOOLS PLANNED" y={565} size={30} tone="paper" p={ease(f, 0, 10)} drop={40} />
        <Plate text="AI WILL PREDICT RECOVERY" y={645} size={22} tone="ink" p={ease(f, b(15), 10)} drop={30} />
        <Snowfall f={f + p.from} />
      </SVG>
    </Frame>
  );
};

// ---- S7: the tarp comes off; the PLANNED governor reaches for the valve and the tank stays worried -------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t = gt(p);
  const v = gaugeAt(t);
  const pull = ease(f, b(17) - 10, 18);
  const spin = ease(f, b(17), 24);
  const reach = ease(f, b(18) - 4, 22);
  const mood: TankMood = f < b(17) ? 'worried' : f < b(18) ? 'gasp' : f < b(19) ? 'worried' : 'strain';
  const stall = ease(f, b(19) - 10, 36) * 0.8;
  const env = f < b(19) + 8 ? 0 : spring(f, b(19) + 8, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.04} night={nightOf(v, 0.12)}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1190} />
        <Tank f={f} x={290} y={1280} s={1.65} mood={mood} look={0.7} sweat={f < b(18) ? 0.4 : 0.9} shiver={f > b(17) ? 1.4 : 0} />
        {stall > 0 && f > b(19) - 10 && <CellWindow f={f} x={290} y={1280} s={1.65} stall={stall} />}
        <path d={`M 700 ${1150 - 10 * reach} Q 600 1090 508 1112`} fill="none" stroke={C.ink} strokeWidth={9} strokeDasharray="14 10" opacity={reach} />
        <g><rect data-band="ok" x={0} y={0} width={0} height={0} /></g>
        <PlannedGovernor f={f} fl={f + p.from} x={770} y={1280} s={1.4} spin={spin} throttle={0.3 + 0.6 * reach} strain={f > b(17) ? 0.8 : 0} />
        <g transform="translate(770,1280)"><Tarp x={0} y={6} w={250} h={260} pull={pull} f={f} /></g>
        <Gauge p={p} x={960} y={1290} s={0.78} />
        <g transform={`translate(150,${lerp(300, 1320, env * env)}) rotate(${-8 + 6 * (1 - env)})`} opacity={env > 0 ? 1 : 0}>
          <Envelope f={f} x={0} y={0} scale={0.42} stamp="RESULTS" />
        </g>
        <Plate text="AI WILL ADJUST THE BIOREACTOR" y={585} size={28} tone="amber" p={ease(f, b(18), 10)} drop={40} />
        <Plate text="CELLS STALL · ILLUSTRATIVE" y={670} size={22} tone="ink" p={ease(f, b(19), 10)} drop={30} />
        <Snowfall f={f + p.from} />
      </SVG>
    </Frame>
  );
};

// ---- S8: the cutaway, cells stall when the needle sinks and the yard darkens ---------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t = gt(p);
  const v = gaugeAt(t);
  const stall = clamp01((0.5 - v) / 0.4);
  const mood: TankMood = stall > 0.7 ? 'strain' : 'worried';
  const blink = f > b(21) - 4 && f < b(21) + 22 ? 0.5 * Math.sin(((f - b(21) + 4) / 26) * Math.PI) : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1000} night={nightOf(v, 0.12) + blink}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1190} />
        <Cable f={f + p.from} x0={860} y0={1190} x1={640} y1={1130} sag={60} live={clamp01(v * 1.6)} />
        <Tank f={f} x={470} y={1290} s={2.3} mood={mood} look={0.9} sweat={stall} shiver={stall * 1.8} />
        <CellWindow f={f} x={470} y={1290} s={2.3} stall={stall} />
        <Gauge p={p} x={920} y={1300} s={1.15} />
        <Plate text="CAN CELLS KEEP WORKING · ILLUSTRATIVE" y={585} size={26} tone="paper" p={ease(f, 2, 10)} drop={40} />
        <Snowfall f={f + p.from} />
      </SVG>
    </Frame>
  );
};

// ---- S9: the quote rides in on the ember pulse ------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t = gt(p);
  const v = gaugeAt(t);
  const ride = easeIO(f, 2, 50);
  const q = ease(f, 2, 22);
  const racing = f > b(23) ? 1 : 0;
  return (
    <Frame p={p} z0={1.04} z1={1.0} dx0={20} dx1={-20} night={nightOf(v, 0.12)}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1190} shift={30 * Math.sin(f / 90)} />
        <Cable f={f + p.from} x0={880} y0={1200} x1={330} y1={1160} sag={90} live={clamp01(v * 1.6 + 0.3)} />
        <Tank f={f} x={170} y={1300} s={1.25} mood="worried" look={0.8} />
        <CellWindow f={f * (racing ? 1.8 : 0.8)} x={170} y={1300} s={1.25} stall={clamp01(0.7 - v * 1.4)} n={18} />
        <Gauge p={p} x={930} y={1300} s={1.0} />
        <QuotePlate text={"\"ALASKA'S REMOTE ENERGY CHALLENGES MAKE ENERGY USE A CENTRAL PART OF THAT QUESTION\" · SRIJAN AGGARWAL · UAF PROFESSOR"} x={lerp(760, 540, ride)} y={690} size={36} wrap={26} p={q} />
        <Snowfall f={f + p.from} />
      </SVG>
    </Frame>
  );
};

// ---- S10: built in software first (the virtual pilot plant on a shed desk) ---------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const v = gaugeAt(gt(p));
  const drawn = ease(f, 10, 70);
  const guts = ease(f, b(26), 24);
  const lampSwing = 8 * Math.sin(f / 7) * Math.exp(-f / 50);
  const level = f > b(27) ? ((f - b(27)) / 40) % 1 : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.16} oy={1000} night={0.1} overlay={<Plate text="VIRTUAL PILOT PLANT" y={565} size={32} tone="ink" p={ease(f, 4, 10)} drop={40} />}>
      <SVG>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1980} fill={C.shed} />
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M -20 ${60 + i * 150} L 1100 ${60 + i * 150}`} stroke="#000" strokeWidth={3} opacity={0.18} />)}
        <rect data-band="ok" x={-20} y={1260} width={1120} height={700} fill={C.wood} />
        {Array.from({length: 8}, (_, i) => <path key={i} d={`M -20 ${1290 + i * 80} L 1100 ${1290 + i * 80}`} stroke={C.woodDark} strokeWidth={3} opacity={0.5} />)}
        <path d="M -20 1260 L 1100 1260" stroke={C.ink} strokeWidth={8} />
        <ellipse cx={520} cy={1330} rx={460} ry={60} fill={RF.emberHot} opacity={0.12} />
        <g transform="translate(70,780)">
          <rect width={170} height={250} fill="#1C2742" stroke={C.ink} strokeWidth={8} />
          {Array.from({length: 10}, (_, i) => <circle key={i} cx={20 + rnd(i) * 130} cy={(10 + rnd(i + 7) * 220 + f * 1.3 * (0.5 + rnd(i))) % 240} r={3} fill="#fff" opacity={0.8} />)}
        </g>
        <g transform={`translate(950,1260) rotate(${lampSwing}, 0, -300)`}>
          <ContactShadow cx={0} cy={0} rx={60} ry={10} opacity={0.5} />
          <path d="M 0 0 L 0 -150 L -70 -250" stroke={C.ink} strokeWidth={12} fill="none" />
          <path d="M -110 -240 L -30 -240 L -50 -290 L -90 -290 Z" fill={RF.emberHot} stroke={C.ink} strokeWidth={5} />
          <ellipse cx={-70} cy={-215} rx={60} ry={14} fill={RF.emberHot} opacity={0.3} />
        </g>
        <Monitor f={f} x={470} y={1250} scale={1.4}>
          <g opacity={0.95}>
            {Array.from({length: 7}, (_, i) => <path key={i} d={`M -290 ${-150 + i * 50} L 290 ${-150 + i * 50}`} stroke={SIM} strokeWidth={1} opacity={0.12} />)}
            <TwinVessel f={f} x={0} y={140} scale={1.1} fidelity={0.9} drawn={drawn} running={guts} />
            {level > 0 && <path d={`M -100 ${140 - 20 - level * 220} L 100 ${140 - 20 - level * 220}`} stroke={SIM} strokeWidth={3} opacity={0.9} />}
          </g>
        </Monitor>
        <text x={470} y={740} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={3} fill={SIM}>VIRTUAL · NOT BUILT</text>
        <Gauge p={p} x={900} y={1470} s={0.9} />
        <g transform="translate(120,1380)">
          <ContactShadow cx={0} cy={6} rx={50} ry={8} opacity={0.4} />
          <rect x={-30} y={-52} width={60} height={56} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={5} />
          <path d={`M 30 -40 q 24 6 0 28`} fill="none" stroke={C.ink} strokeWidth={5} />
          <path d={`M ${-6 + 3 * Math.sin(f / 9)} -62 q 6 -18 0 -34`} fill="none" stroke="#fff" strokeWidth={3} opacity={0.5} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S11: no results yet (the stamp slams across the model) ----------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const st = f < 6 ? 0 : spring(f, 4, 12);
  const shake = f >= 6 && f < 30 ? Math.sin((f - 6) * 1.9) * 6 * (1 - (f - 6) / 24) : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={950} night={0.05} overlay={<Plate text="" displayLines={['THE MODEL ONLY']} y={565} size={26} tone="ink" p={ease(f, 8, 8)} drop={30} />}>
      <SVG>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1980} fill="#0D1522" />
        {Array.from({length: 40}, (_, i) => <path key={i} d={`M -20 ${i * 50} L 1100 ${i * 50}`} stroke="#000" strokeWidth={1.4} opacity={0.3} />)}
        <g transform={`translate(${shake},0)`}>
          <TwinVessel f={f} x={540} y={1300} scale={2.4} fidelity={0.9} drawn={1} running={f > 10 ? 0.2 + 0.5 * Math.abs(Math.sin(f / 3)) : 1} />
        </g>
        <g transform={`translate(540,900) rotate(-7) scale(${st})`} opacity={st > 0 ? 1 : 0}>
          <rect x={-330} y={-70} width={660} height={140} fill="#0D1522" fillOpacity={0.5} stroke={C.stamp} strokeWidth={14} />
          <text y={24} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={70} letterSpacing={4} fill={C.stamp}>NO RESULTS YET</text>
        </g>
        <Gauge p={p} x={920} y={1230} s={0.8} />
      </SVG>
    </Frame>
  );
};

// ---- S12: the price does not move (back out in the yard, at the pole) ------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t = gt(p);
  const v = gaugeAt(t);
  const nudge = 0.5 + 0.5 * Math.sin(f / 9);
  const creep = ease(f, b(30) - 8, 36);
  const snap = f < b(30) + 30 ? 0 : clamp01((f - b(30) - 30) / 24);
  return (
    <Frame p={p} z0={1.12} z1={1.0} oy={1000} night={nightOf(v, 0.12)} overlay={<><Plate text="IT ADAPTS" y={565} size={32} tone="paper" p={ease(f, b(29), 10)} drop={40} /><Plate text="CAN'T MAKE POWER CHEAPER" y={655} size={28} tone="stamp" p={ease(f, b(30), 10)} drop={30} /></>}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1210} />
        <PriceTag f={f} x={812} y={700} scale={1.5} creep={creep} snap={snap} />
        <Cable f={f + p.from} x0={560} y0={1170} x1={330} y1={1160} sag={60} live={clamp01(v * 1.6)} />
        <PlannedGovernor f={f} fl={f + p.from} x={300} y={1290} s={1.3} spin={0.6} throttle={nudge} />
        <Gauge p={p} x={640} y={1290} s={1.15} />
        <path d={`M 390 1180 Q 480 ${1120 + 20 * nudge} 600 1150`} fill="none" stroke={SIM} strokeWidth={5} strokeDasharray="12 9" strokeDashoffset={-f * 2} />
        <Snowfall f={f + p.from} />
      </SVG>
    </Frame>
  );
};

// ---- S13: the barge, the obvious alternative ---------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const v = gaugeAt(gt(p));
  const arrive = easeIO(f, 0, 70) - 0.12 * clamp01((f - 70) / 90);
  const sun = ease(f, b(33) - 14, 50);
  const horn = f > b(32) && f < b(32) + 40 ? ease(f, b(32), 34) : 0;
  const dimmed = f > b(32) ? 0.7 : 0.2;
  return (
    <Frame p={p} z0={1.0} z1={1.07} dx0={0} dx1={-26} night={nightOf(v, 0.14)} tagText="OUR FRAMING · ILLUSTRATION" overlay={<Plate text="THE OBVIOUS ALTERNATIVE · SHIP IT" y={585} size={28} tone="paper" p={ease(f, b(32), 10)} drop={40} />}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1000} pole={false} />
        <g opacity={0.95}>
          <CheapSun f={f} x={790} y={lerp(1200, 700, sun)} scale={1.1} pull={sun} />
        </g>
        <rect data-band="ok" x={-20} y={1000} width={1120} height={980} fill={RF.water} />
        <rect data-band="ok" x={-20} y={1000} width={1120} height={70} fill={RF.waterLight} opacity={0.4} />
        {Array.from({length: 14}, (_, i) => (
          <path key={i} d={`M ${rnd(i) * 1000 - 20} ${1050 + i * 58} q 40 -12 80 0 t 80 0`} fill="none" stroke="#fff" strokeWidth={3} opacity={0.18}
            transform={`translate(${14 * Math.sin(f / 30 + i)},0)`} />
        ))}
        <path d="M -20 1000 Q 160 960 300 1010 L 300 1100 L -20 1100 Z" fill="#8190B2" stroke={C.ink} strokeWidth={6} />
        <Tank f={f} x={200} y={1110} s={1.2} mood={f > b(32) ? 'strain' : 'worried'} look={0.9} sweat={0.7} />
        <CellWindow f={f} x={200} y={1110} s={1.2} stall={dimmed} n={18} />
        <Barge f={f} x={lerp(1500, 590, arrive)} y={1290} scale={1.6} sign="SHIP IT" horn={horn} />
        <Snowfall f={f + p.from} n={45} />
      </SVG>
    </Frame>
  );
};

// ---- S14: the envelope opens on a crate in the yard, the boxes stay empty, the pen taps and bounces off ------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const v = gaugeAt(gt(p));
  const open = ease(f, 6, 30);
  const rib = ease(f, b(35) - 8, 40);
  const ribW = monoW('SEPT 2026 TO AUG 2030', 34) + 70;
  const tapAt = [b(36) + 4, b(36) + 26, b(36) + 48];
  const tap = (i: number) => (f > tapAt[i] && f < tapAt[i] + 14 ? Math.sin(((f - tapAt[i]) / 14) * Math.PI) : 0);
  const penI = f < tapAt[1] - 6 ? 0 : f < tapAt[2] - 6 ? 1 : 2;
  const pen = ease(f, b(36) - 8, 10);
  const lineYs = [1, 2, 3].map((i) => 1090 + 1.3 * (14 + 40 * i - 280 * open) - 4);
  return (
    <Frame p={p} z0={1.06} z1={1.0} night={nightOf(v, 0.12)}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1210} />
        <ContactShadow cx={540} cy={1330} rx={300} ry={22} opacity={0.5} />
        <rect x={360} y={1220} width={360} height={110} fill="#8E6B3E" stroke={C.ink} strokeWidth={7} />
        {[400, 480, 560, 640].map((px) => <path key={px} d={`M ${px} 1224 L ${px} 1326`} stroke={C.ink} strokeWidth={3} opacity={0.5} />)}
        <Envelope f={f} x={540} y={1090} scale={1.3} open={open} lines={['TO BE EVALUATED', 'COST', 'ENERGY', 'ENVIRONMENT']} />
        {lineYs.map((ly, i) => (
          <g key={i} opacity={open > 0.7 ? 1 : 0}>
            <rect x={390} y={ly - 22} width={46} height={38} fill="none" stroke={C.ink} strokeWidth={4} />
            {tap(i) > 0.05 && <text x={413} y={ly + 5} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={14} fill={C.stamp} opacity={tap(i)}>?</text>}
          </g>
        ))}
        <g transform={`translate(${413 + 40 * (1 - pen)},${(lineYs[penI] ?? 1100) - 4 - 26 * tap(penI) - 50 * (1 - pen)}) rotate(-24)`} opacity={pen}>
          <rect x={-8} y={-150} width={16} height={150} fill="#2B3446" stroke={C.ink} strokeWidth={4} />
          <path d="M -8 0 L 8 0 L 0 28 Z" fill="#E9DDA8" stroke={C.ink} strokeWidth={3} />
        </g>
        <g transform={`translate(200,1300)`} opacity={open}>
          <path d="M -20 -80 L 20 -80 L 20 -30 L 60 40 Q 64 60 40 60 L -40 60 Q -64 60 -60 40 L -20 -30 Z" fill="#CFE3EE" fillOpacity={0.4} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
          <path d="M -48 30 L 48 30 L 56 44 Q 58 56 40 56 L -40 56 Q -58 56 -56 44 Z" fill="#9AB083" stroke={C.ink} strokeWidth={3} />
          {[0, 1, 2].map((i) => <circle key={i} cx={-14 + i * 14} cy={20 - ((f * 0.7 + i * 17) % 40)} r={4} fill="#fff" opacity={0.7} />)}
        </g>
        <g opacity={open}><TwinVessel f={f} x={880} y={1330} scale={0.6} fidelity={0.8} drawn={1} running={0.4} /></g>
        <g transform="translate(540,1160)" opacity={rib > 0 ? 1 : 0}>
          <rect x={-ribW / 2 + 6} y={-30 + 8} width={ribW * rib} height={64} fill="#000" opacity={0.3} />
          <rect x={-ribW / 2} y={-30} width={ribW * rib} height={64} fill={RF.paper} stroke={C.ink} strokeWidth={5} />
          {rib > 0.85 && <text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} letterSpacing={2} fill={C.ink}>SEPT 2026 TO AUG 2030</text>}
        </g>
        <Gauge p={p} x={930} y={1290} s={0.8} />
        <Snowfall f={f + p.from} n={40} />
      </SVG>
    </Frame>
  );
};

// ---- S15: the design brief (gauge close-up, then the camera rises to the lit yard) ----------------------------------------------------------
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t = gt(p);
  const v = gaugeAt(t);
  const sweep = ease(f, b(37) + 4, 22);
  const flip = easeIO(f, b(38) - 4, 18);
  const stamp = f < b(38) + 16 ? 0 : spring(f, b(38) + 16, 12);
  const plug = ease(f, b(39) - 6, 20);
  const rise = easeIO(f, b(39) - 12, 60);
  return (
    <Frame p={p} zk={() => lerp(1.25, 1.0, rise)} ox={560} oy={1000} night={nightOf(v, 0.1)} overlay={<g transform={`translate(540,540) rotate(-5) scale(${stamp})`} opacity={stamp > 0 ? 1 : 0}><rect x={-140} y={-38} width={280} height={76} fill={RF.paper} stroke={C.stamp} strokeWidth={9} /><text y={13} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={40} letterSpacing={4} fill={C.stamp}>OUR READ</text></g>}>
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1190} />
        <Cable f={f + p.from} x0={560} y0={1080} x1={lerp(330, 420, plug)} y1={1010} sag={60} live={clamp01(v * 1.4 + 0.3 * plug)} />
        <Tank f={f} x={270} y={1170} s={1.0} mood={plug > 0.6 ? 'relief' : 'calm'} look={0.9} />
        <CellWindow f={f} x={270} y={1170} s={1.0} stall={0} n={18} />
        <g>
          <Gauge p={p} x={600} y={1170} s={1.8} />
          <g transform="translate(600,1236)">
            <rect x={-170} y={-34} width={340} height={64} rx={6} fill="#E9DDA8" stroke={C.ink} strokeWidth={5} opacity={flip} />
            <text y={10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={3} fill={C.ink} opacity={flip}>DESIGN BRIEF</text>
          </g>
        </g>
        <g transform={`translate(${lerp(826, 1500, sweep)},${lerp(700, 560, sweep)}) rotate(${lerp(0, 40, sweep)})`}>
          <path d="M 0 -40 L 0 0" stroke={C.ink} strokeWidth={3} />
          <rect x={-86} y={0} width={172} height={40} rx={4} fill={RF.kraft} stroke={C.ink} strokeWidth={4} />
          <text y={27} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={17} letterSpacing={1} fill={C.ink}>AFTERTHOUGHT</text>
        </g>
        <Snowfall f={f + p.from} />
      </SVG>
    </Frame>
  );
};

// ---- S16: two roads, the question, and the slam that now finds the cells still working ----------------------------------------------------------
const S16: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t = gt(p);
  const v = gaugeAt(t);
  const away = 0.55 * easeIO(f, b(42) - 6, 150);
  const slam = t > 116.62;
  const mood: TankMood = slam ? 'strain' : 'calm';
  return (
    <Frame p={p} z0={1.0} z1={1.04} night={nightOf(v, 0.1)} tagText="OUR FRAMING · ILLUSTRATION">
      <SVG>
        <FrostYardDusk f={f + p.from} power={v} ground={1150} />
        <rect data-band="ok" x={540} y={1000} width={620} height={920} fill={RF.water} />
        <g transform="translate(540,0)">{Array.from({length: 8}, (_, i) => <path key={i} d={`M ${20 + rnd(i) * 400} ${1060 + i * 70} q 30 -10 60 0 t 60 0`} fill="none" stroke="#fff" strokeWidth={3} opacity={0.2} />)}</g>
        <rect data-band="ok" x={536} y={560} width={8} height={1360} fill={C.ink} />
        <Cable f={f + p.from} x0={470} y0={1180} x1={330} y1={1110} sag={50} live={clamp01(v * 1.6)} />
        <Tank f={f} x={215} y={1310} s={1.75} mood={mood} look={0.2} sweat={slam ? 0.8 : 0} shiver={slam ? 1.6 : 0} />
        <CellWindow f={f} x={215} y={1310} s={1.75} stall={slam ? 0.5 + 0.5 * Math.sin(f / 5) : 0} n={18} />
        <g transform="translate(215,1115)"><rect x={-40} y={-18} width={80} height={32} rx={4} fill="#10151F" stroke={C.paper} strokeWidth={2.4} /><text y={6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.paper}>2030?</text></g>
        <Gauge p={p} x={470} y={1330} s={0.82} />
        <CheapSun f={f} x={850} y={860} scale={0.7} label="CHEAPER POWER, SOMEWHERE" />
        <Barge f={f} x={lerp(800, 860, away / 0.55)} y={lerp(1250, 1120, away / 0.55)} scale={lerp(1.0, 0.62, away / 0.55)} sign="SHIP IT" loaded={1} />
        <Plate text="WHICH WOULD YOU BET ON" y={565} size={34} tone="amber" p={ease(f, b(43), 10)} drop={50} />
        <Snowfall f={f + p.from} />
      </SVG>
    </Frame>
  );
};

// ---- placeholders: every shot gets a crude version first (the rough cut) ---------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p} night={0}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill="#1B2744" />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.paper}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);

const TITLES: Record<number, string> = {1: 'NEEDLE', 2: 'TABLE', 3: 'PIE', 4: 'HEAP', 5: 'CELL', 6: 'TWO TOOLS', 7: 'TARP', 8: 'CUTAWAY', 9: 'QUOTE', 10: 'TWIN', 11: 'NO RESULTS', 12: 'PRICE', 13: 'BARGE', 14: 'ENVELOPE', 15: 'GAUGE', 16: 'ROADS'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15, 16: S16};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]; kicks: number[]}> = ({n, from, dur, beats, kicks}) => {
  const f = useCurrentFrame();
  const b = (id: number) => {
    const x = beats.find((y) => y.id === id);
    return x ? Math.round(x.at * 30) - from : 0;
  };
  const bt = (id: number) => {
    const x = beats.find((y) => y.id === id);
    return x ? Math.round(x.at * 30) : 0;
  };
  const Comp = SHOTS[n];
  const p = {f, from, dur, b, kicks, bt};
  return Comp ? <Comp p={p} /> : <Rough n={n} title={TITLES[n] ?? ''} p={p} />;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1009Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1009Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1009: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 7.72, 19.76, 25.44, 30.48, 35.0, 42.78, 51.4, 58.94, 68.58, 77.32, 80.58, 87.62, 92.92, 101.1, 106.6, 118.8].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#0C1220" ink="#F4F2EA" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
