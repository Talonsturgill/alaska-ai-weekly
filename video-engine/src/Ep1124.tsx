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
import {SearchReticle} from './lib/vision';
import {Raven} from './lib/fauna';
import {
  SCN, specColor, Specs, ScanDrone, Scanline, SpectrumCard, PinFlag, SearchGrid, ClearedStamp, StampMark, Bouncer, Stopwatch, Gear,
  Coin, TundraWorld, Tussocks, Crayons, GearKind,
} from './lib/scanline';
import {IDS} from './Ep1124Ids';

// Trust the Flag, 2026-11-24. Palette roles are art_direction.json: flat overcast pewter-sage over olive and khaki tundra and a wet grey
// mudflat; signal red is the GPS pins and the stamp ALONE; the spectrum is the machine's view ALONE. Summer, no snow. Specs (the Pi) is
// the only faced hero; the quadcopter has no face; gear has no faces; nothing is ever "found". The mudflat and the swamp grass are two
// dioramas with two thresholds and are never joined by a dial. Quinhagak is a map pin and an org card only.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
const C = {ink: SCN.ink, paper: SCN.paper, sky: SCN.sky, bg: '#9AA6A8'};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
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

type Tone = 'plate' | 'dark' | 'red';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  plate: {fill: SCN.paper, fg: SCN.ink, edge: SCN.ink},
  dark: {fill: '#2E3436', fg: '#F3EDE0', edge: '#F3EDE0'},
  red: {fill: SCN.red, fg: '#FBF6EC', edge: SCN.ink},
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

/** a starburst stat badge */
const Burst: React.FC<{x: number; y: number; lines: string[]; p: number; size?: number; fill?: string; rot?: number}> = ({x, y, lines, p, size = 30, fill = '#F2D15C', rot = -4}) => {
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const w = Math.max(...lines.map((l) => monoW(l, size))) + 70;
  const h = lines.length * (size + 12) + 50;
  const pts = Array.from({length: 28}, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const r = i % 2 ? 1 : 1.12;
    return `${(Math.cos(a) * w * 0.56 * r).toFixed(1)},${(Math.sin(a) * h * 0.62 * r).toFixed(1)}`;
  }).join(' ');
  assertCropSafe(lines.join(' '), y - h * 0.7, y + h * 0.7);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${0.6 + 0.4 * k})`} opacity={Math.min(1, k * 2)}>
      <polygon points={pts} fill="#000" opacity={0.25} transform="translate(6 8)" />
      <polygon points={pts} fill={fill} stroke={SCN.ink} strokeWidth={6} strokeLinejoin="round" />
      {lines.map((l, i) => (
        <text key={i} x={0} y={(i - (lines.length - 1) / 2) * (size + 12) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={size} fill={SCN.ink}>{l}</text>
      ))}
    </g>
  );
};

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; overlay?: React.ReactNode; bg?: string; warmth?: number; preprint?: boolean; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.04, vignette = 0.2, overlay, bg = C.bg, warmth = -0.01, preprint = false, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: 540 + 12 * Math.sin(p.f / 110) + 8 * t, fy: 960};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: bg}} />
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#2E3436" stroke="#F3EDE0" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F3EDE0">{CHIP}</text>
          {preprint && <rect x={50 + monoW(CHIP, 20) + 42} y={436} width={monoW('PREPRINT', 20) + 30} height={38} rx={5} fill="#F3EDE0" stroke="#2E3436" strokeWidth={2.4} opacity={0.95} />}
          {preprint && <text x={50 + monoW(CHIP, 20) + 57} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#2E3436">PREPRINT</text>}
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.05} warmth={warmth} />
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

/** a boxed card (a printed sign), falling in with a bounce from frame a */
const DropCard: React.FC<{x: number; y: number; text: string; a: number; f: number; rot?: number; size?: number; scale?: number}> = ({x, y, text, a, f, rot = 0, size = 30, scale = 1}) => {
  const k = spr(f, a, 18);
  if (k <= 0) return null;
  const w = monoW(text, size) + 50;
  return (
    <g transform={`translate(${x} ${lerp(y - 500, y, Math.min(1, k))}) rotate(${rot + 3 * (1 - Math.min(1, k)) + 0.8 * Math.sin(f / 19 + x)}) scale(${scale})`}>
      <ContactShadow cx={0} cy={44} rx={w * 0.5} ry={10} opacity={0.35 * Math.min(1, k)} />
      <rect x={-w / 2 + 6} y={-34} width={w} height={72} rx={8} fill="#000" opacity={0.25} />
      <rect x={-w / 2} y={-40} width={w} height={72} rx={8} fill={SCN.paper} stroke={SCN.ink} strokeWidth={6} />
      <text x={0} y={-4 + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={size} letterSpacing={2} fill={SCN.ink}>{text}</text>
    </g>
  );
};

/** a small square pixel token (the machine's unit) */
const Pix: React.FC<{x: number; y: number; c: string; s?: number; glow?: number; hat?: boolean; o?: number}> = ({x, y, c, s = 26, glow = 0, hat = false, o = 1}) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    {glow > 0 && <rect x={-s} y={-s} width={s * 2} height={s * 2} rx={6} fill={c} opacity={0.25 * glow} />}
    <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={3} fill={c} stroke={SCN.ink} strokeWidth={3} />
    <rect x={-s / 2 + 3} y={-s / 2 + 3} width={s * 0.35} height={s * 0.25} fill="#fff" opacity={0.5} />
    {hat && <path d={`M ${-s / 2} ${-s / 2} L 0 ${-s * 1.5} L ${s / 2} ${-s / 2} Z`} fill={SCN.gold} stroke={SCN.ink} strokeWidth={2.5} />}
  </g>
);

/** a clipboard sheet seen from above with a terrain fill: the throughline object in its scene form. Origin is the paper centre. */
const Sheet: React.FC<{f: number; x: number; y: number; w: number; h: number; kind: 'mudflat' | 'grass' | 'plain'; label?: string; rot?: number; seed?: number; children?: React.ReactNode}> =
({f, x, y, w, h, kind, label, rot = 0, seed = 1, children}) => {
  const fill = kind === 'mudflat' ? SCN.mud : kind === 'grass' ? SCN.khaki : SCN.paper;
  const lite = kind === 'mudflat' ? SCN.mudL : kind === 'grass' ? SCN.khakiL : '#FFFFFF';
  const cid = `sheet-${seed}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + 0.6 * Math.sin(f / 37 + seed)})`}>
      <ContactShadow cx={0} cy={h / 2 + 40} rx={w * 0.56} ry={18} opacity={0.35} />
      <rect x={-w / 2 - 24} y={-h / 2 - 54} width={w + 48} height={h + 80} rx={18} fill="#8A5A32" stroke={SCN.ink} strokeWidth={7} />
      <rect x={-w / 2 - 16} y={-h / 2 - 46} width={w + 32} height={h + 64} rx={14} fill="#A8743F" opacity={0.6} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={fill} stroke={SCN.ink} strokeWidth={4} />
      <clipPath id={cid}><rect x={-w / 2} y={-h / 2} width={w} height={h} /></clipPath>
      <g clipPath={`url(#${cid})`}>
        {Array.from({length: 46}, (_, i) => {
          const px = (h01(i, seed) - 0.5) * w, py = (h01(i, seed + 3) - 0.5) * h;
          if (kind === 'mudflat') return <path key={i} d={`M ${px - 30} ${py} q 15 -6 30 0 t 30 0`} stroke={i % 2 ? lite : SCN.mudD} strokeWidth={3} fill="none" opacity={0.55} />;
          if (kind === 'grass') return <path key={i} d={`M ${px} ${py + 10} q ${3 * Math.sin(f / 15 + i)} -18 5 -30 M ${px + 6} ${py + 10} q ${3 * Math.sin(f / 15 + i)} -14 -4 -24`} stroke={i % 2 ? SCN.shade : lite} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
          return null;
        })}
        {kind === 'mudflat' && <path d={`M ${-w / 2} ${-h * 0.32} q ${w / 4} ${-22 + 6 * Math.sin(f / 20)} ${w / 2} 0 t ${w / 2} 0`} stroke={SCN.seaL} strokeWidth={12} fill="none" opacity={0.5} />}
        {Array.from({length: Math.ceil(w / 60) + 1}, (_, i) => <path key={`gv${i}`} d={`M ${-w / 2 + i * 60} ${-h / 2} V ${h / 2}`} stroke="#F3EDE0" strokeWidth={1.5} opacity={0.35} />)}
        {Array.from({length: Math.ceil(h / 60) + 1}, (_, i) => <path key={`gh${i}`} d={`M ${-w / 2} ${-h / 2 + i * 60} H ${w / 2}`} stroke="#F3EDE0" strokeWidth={1.5} opacity={0.35} />)}
      </g>
      {children}
      <rect x={-64} y={-h / 2 - 68} width={128} height={38} rx={10} fill="#B9BCC2" stroke={SCN.ink} strokeWidth={6} />
      {label && (
        <g transform={`translate(0 ${h / 2 + 2})`}>
          <rect x={-monoW(label, 22) / 2 - 14} y={-2} width={monoW(label, 22) + 28} height={34} rx={4} fill={SCN.paper} stroke={SCN.ink} strokeWidth={4} />
          <text x={0} y={23} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={SCN.ink}>{label}</text>
        </g>
      )}
    </g>
  );
};

/** an ILLUSTRATION tag hung on a peg */
const IllTag: React.FC<{x: number; y: number; p?: number}> = ({x, y, p = 1}) => {
  const w = monoW('ILLUSTRATION', 18) + 24;
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp01(p)}>
      <circle cx={0} cy={-34} r={6} fill="#B9BCC2" stroke={SCN.ink} strokeWidth={3} />
      <path d="M 0 -30 L 0 -14" stroke={SCN.ink} strokeWidth={3} />
      <rect x={-w / 2} y={-14} width={w} height={30} rx={4} fill="#2E3436" stroke="#F3EDE0" strokeWidth={2.5} />
      <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill="#F3EDE0">ILLUSTRATION</text>
    </g>
  );
};

/** a hatched (illustration-style) pixel */
const HatchPix: React.FC<{x: number; y: number; o?: number; s?: number}> = ({x, y, o = 1, s = 26}) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={3} fill="#7E8A4A" stroke={SCN.ink} strokeWidth={3} strokeDasharray="5 3" />
    {[0, 1, 2].map((i) => <path key={i} d={`M ${-s / 2 + i * 8} ${s / 2} L ${-s / 2 + i * 8 + 10} ${-s / 2}`} stroke={SCN.ink} strokeWidth={2} opacity={0.6} />)}
  </g>
);

// ---- S1: ONE QUESTION (top-down tundra, the scanline with cyan glints, the first pin, the grid and the waiting stamp) -----------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const scanP = clamp01(f / 60);
  const scanY = 420 + (1460 - 420) * scanP;
  const crossed = scanY > 900;
  const gridIn = easeIO(f, b(36), 22);
  const rock = Math.sin(f / 9) * 6 * gridIn;
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.3, 1.02, easeIO(fr, 0, p.dur)), fx: 560, fy: lerp(900, 960, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <TundraWorld f={f} kind="grass" topDown seed={3} />
        <HeldTravel f={f} x={150} y={820} w={600} h={520} mode="shadow" seed={1}>
          <Gear x={540} y={920} kind="waders" scale={1.55} rot={-12} camo={0.1} ground={SCN.khaki} />
          <Gear x={250} y={1240} kind="buoy" scale={0.7} rot={20} ground={SCN.khaki} camo={0.2} />
        </HeldTravel>
        {crossed && <rect x={420} y={860} width={240} height={120} fill={specColor(0.6)} opacity={0.4 * clamp01((scanY - 900) / 60)} />}
        <Scanline f={f} x0={40} x1={1040} y0={420} y1={1460} p={scanP} wake={0.22} face={false} />
        {scanP < 1 && [0, 1, 2, 3].map((i) => <circle key={i} cx={160 + i * 250 + 30 * Math.sin(f / 4 + i)} cy={scanY} r={9} fill={SCN.led} stroke={SCN.ink} strokeWidth={2} />)}
        <PinFlag f={f} x={640} y={900} scale={1.25} spring={spr(f, Math.min(b(2), 34), 18)} wobble={2.5} seed={1} gps="GPS POINT" />
        <g transform={`translate(${lerp(1300, 860, gridIn)} 680) rotate(${-6})`}>
          <SearchGrid f={f} x={0} y={0} w={260} h={320} pins={[{u: 0.62, v: 0.5, p: spr(f, b(36) + 14, 16)}]} title="SEARCH GRID" />
        </g>
        <g transform={`translate(${lerp(1300, 900, gridIn)} 1070) rotate(${rock})`}>
          <ClearedStamp x={0} y={0} scale={0.62} f={f} />
        </g>
        <Tussocks f={f} y={1490} drift={f / 120} />
        <Plate x={540} text="ONE LINE AT A TIME" y={540} p={ease(f, b(1) + 8) * (1 - ease(f, b(2), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="DIFFERENT MATERIAL" y={540} p={ease(f, b(2) + 4)} tone="red" /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S2: STANDARD KIT (from above, two camera footprints with ordinary footage; three cards rise as a list) -----------------------------------
const Footprint: React.FC<{x: number; y: number; label: string; ir?: boolean; f: number}> = ({x, y, label, ir = false, f}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-170} y={-120} width={340} height={240} rx={6} fill={ir ? '#4A3F66' : '#8C9A5A'} opacity={0.55} stroke={SCN.ink} strokeWidth={5} strokeDasharray="16 10" />
    {Array.from({length: 7}, (_, i) => (
      <ellipse key={i} cx={-120 + (i % 4) * 80 + 8 * Math.sin(f / 30 + i)} cy={-70 + Math.floor(i / 4) * 110 + (i % 2) * 20} rx={i === 3 ? 50 : 30} ry={i === 3 ? 24 : 12}
        fill={i === 3 ? (ir ? '#2E2A48' : '#6F8E90') : ir ? '#6E5A8E' : SCN.sedgeL} opacity={0.8} />
    ))}
    {[[-170, -120], [170, -120], [-170, 120], [170, 120]].map(([cx, cy], i) => <path key={i} d={`M ${cx} ${cy + (cy < 0 ? 26 : -26)} V ${cy} H ${cx + (cx < 0 ? 26 : -26)}`} stroke="#F3EDE0" strokeWidth={6} fill="none" />)}
    <rect x={-monoW(label, 22) / 2 - 12} y={-158} width={monoW(label, 22) + 24} height={32} rx={4} fill="#2E3436" stroke="#F3EDE0" strokeWidth={2.5} />
    <text x={0} y={-134} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill="#F3EDE0">{label}</text>
  </g>
);
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t = clamp01(f / p.dur);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.1, 1.0, easeIO(fr, 0, p.dur)), fx: 540, fy: 980})}>
      <SVG>
        <TundraWorld f={f} kind="tundra" topDown seed={5} />
        {Array.from({length: 6}, (_, i) => <ellipse key={i} cx={(h01(i, 2) * 1080)} cy={700 + h01(i, 3) * 700} rx={60 + 40 * h01(i, 4)} ry={26} fill="#6F8E90" stroke={SCN.ink} strokeWidth={3} opacity={0.85} />)}
        {f > b(50) - 20 && <g transform={`translate(${lerp(-80, 1160, clamp01((f - b(50) + 20) / 60))} 900)`}><Raven f={f} x={0} y={0} scale={0.6} /></g>}
        <HeldTravel f={f} x={60} y={800} w={960} h={420} mode="shadow" seed={2}>
          <Footprint x={lerp(220, 360, t)} y={1000} label="VISIBLE" f={f} />
          <Footprint x={lerp(860, 720, t)} y={1060} label="INFRARED" ir f={f} />
        </HeldTravel>
        {['CAMOUFLAGED', 'INSULATED', 'NO HEAT SIGNATURE'].map((txt, i) => {
          const k = spr(f, b(4) + i * 7, 16);
          if (k <= 0) return null;
          const w = monoW(txt, 26) + 40;
          return (
            <g key={txt} transform={`translate(540 ${lerp(760, 610 + i * 70, Math.min(1, k))})`} opacity={Math.min(1, k)}>
              <rect x={-w / 2 + 5} y={-26} width={w} height={54} rx={6} fill="#000" opacity={0.25} />
              <rect x={-w / 2} y={-30} width={w} height={54} rx={6} fill={SCN.paper} stroke={SCN.ink} strokeWidth={5} />
              <text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} fill={SCN.ink}>{txt}</text>
            </g>
          );
        })}
        <Tussocks f={f} y={1500} drift={f / 80} />
        <Plate x={540} text="STANDARD KIT · VISIBLE + INFRARED" y={1250} size={28} p={ease(f, b(3) + 6) * (1 - ease(f, b(50), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="WHAT EO/IR CAN MISS · THE PAPER'S MOTIVATION" y={520} size={24} p={ease(f, b(4) + 4)} tone="dark" /> {/* plate-overlap-ok */}
        <Plate x={540} text="ORDINARY FOOTAGE" y={1250} p={ease(f, b(50) + 4) * (1 - ease(f, b(4), 8))} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S3: 150 BANDS (crayons, then two spectrum cards) ------------------------------------------------------------------------------------------
const Desk: React.FC = () => (
  <g>
    <rect data-band="ok" x={0} y={0} width={1080} height={1920} fill="#D8D1BF" />
    <rect data-band="ok" x={0} y={1180} width={1080} height={740} fill="#A8743F" />
    {Array.from({length: 12}, (_, i) => <path key={i} d={`M 0 ${1200 + i * 60} H 1080`} stroke="#8A5A32" strokeWidth={3} opacity={0.5} />)}
    <path d="M 0 1180 H 1080" stroke={SCN.ink} strokeWidth={6} />
  </g>
);
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const open = easeIO(f, b(5) + 4, Math.max(40, b(6) - b(5)));
  const cards = easeIO(f, b(6), 30);
  return (
    <Frame p={p} bg="#C9C3B2" cam={(fr) => ({z: lerp(1.0, 1.06, easeIO(fr, 0, p.dur)), fx: 540, fy: 980})}>
      <SVG>
        <Desk />
        <Crayons x={190} y={1330} n={3} spectrum={false} label="R G B" scale={0.9} />
        <Crayons x={650} y={1330} n={150} open={open} scale={0.82} label="150" />
        <HeldTravel f={f} x={130} y={640} w={820} h={240} mode="shadow" seed={3}>
          <SpectrumCard x={300} y={760} kind="grass" label="GRASS" p={cards} />
          <SpectrumCard x={780} y={760} kind="jacket" label="JACKET" p={easeIO(f, b(6) + 10, 30)} />
        </HeldTravel>
        <Plate x={540} text="150 BANDS · 400 TO 1000 NM" y={500} p={ease(f, b(5) + 10)} /> {/* plate-overlap-ok */}
        <Plate x={540} text="SEES MATERIAL DIFFERENCES" y={1010} p={ease(f, b(6) + 30)} tone="dark" /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S4: THE FLOOD (lines pour, Specs drops in under the pod with the grid beside him, the pile, the stopwatch) ---------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const specsIn = spr(f, b(8), 18);
  const pile = clamp01((f - b(8)) / Math.max(1, b(37) - b(8) + 40));
  const tip = easeIO(f, b(37), 18);
  const buried = f > b(37) + 10;
  const sw = f < b(40) ? (f % 18) / 2 : lerp(9, 21.34, easeIO(f, b(40), 30));
  const mark = ease(f, b(9), 6) * (0.5 + 0.5 * Math.sin(f / 2));
  const lines = Math.floor((f / 3) % 8);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.08, 1.0, easeIO(fr, 0, p.dur)), fx: 540, fy: lerp(860, 940, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <TundraWorld f={f} kind="tundra" hz={1380} seed={6} />
        <Tussocks f={f} y={1480} drift={f / 100} />
        <ScanDrone f={f} x={540} y={520} scale={1.1} cableTo={specsIn > 0.5 ? [40, 300] : undefined} />
        {Array.from({length: 8}, (_, i) => {
          const yy = 610 + ((i * 30 + f * 6) % 300);
          return <rect key={i} x={480} y={yy} width={120} height={12} rx={3} fill={specColor(((i + lines) % 8) / 8)} stroke={SCN.ink} strokeWidth={2} opacity={0.9} />;
        })}
        <g transform={`translate(560 1240) rotate(${-24 * tip})`}>
          {Array.from({length: Math.floor(30 * pile)}, (_, i) => (
            <rect key={i} x={-120 + 8 * Math.sin(i * 1.7)} y={-i * 16} width={240} height={14} rx={3} fill={specColor(h01(i, 2))} stroke={SCN.ink} strokeWidth={2} />
          ))}
        </g>
        {specsIn > 0 && (
          <g transform={`translate(0 ${(1 - Math.min(1, specsIn)) * -260})`}>
            <rect x={440} y={buried ? 900 : 820} width={200} height={40} rx={10} fill={SCN.drone} stroke={SCN.ink} strokeWidth={5} />
            <Specs f={f} x={540} y={buried ? 1000 : 920} scale={1.15} emotion={buried ? 'buried' : 'alarmed'} cues={[b(8), b(37), b(40), b(9)]} look={-0.3} squash={buried ? 0.6 : 0} />
          </g>
        )}
        {buried && Array.from({length: 10}, (_, i) => (
          <rect key={`b${i}`} x={380 + i * 30} y={1010 - (i % 3) * 14} width={140} height={14} rx={3} fill={specColor(h01(i, 9))} stroke={SCN.ink} strokeWidth={2} transform={`rotate(${-10 + i * 3} ${450 + i * 30} 1010)`} />
        ))}
        <Stopwatch f={f} x={860} y={760} value={sw} sweat={clamp01((f - b(37)) / 30)} cues={[b(8), b(40), b(9)]} />
        {mark > 0 && <circle cx={860} cy={760} r={100} fill="none" stroke={SCN.red} strokeWidth={8} opacity={mark} />}
        <HeldTravel f={f} x={110} y={700} w={240} h={290} mode="sweep" seed={4}>
          <SearchGrid f={f} x={230} y={860} w={200} h={230} stripes={clamp01((f - b(8)) / (p.dur - b(8)))} title="GRID" />
        </HeldTravel>
        <Plate x={540} text="THE FLOOD · ONE LINE AT A TIME" y={1180} size={28} p={ease(f, b(7) + 8) * (1 - ease(f, b(8), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="RASPBERRY PI 4B · ON THE DRONE" y={1180} size={28} p={ease(f, b(8) + 10) * (1 - ease(f, b(40), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="DETECTOR ALONE · 21.34 MS · TOO SLOW" y={1180} size={28} p={ease(f, b(40) + 4)} tone="red" /> {/* plate-overlap-ok */}
        <Plate x={540} text="A NEW LINE EVERY 10 MS" y={560} size={28} p={ease(f, b(9) + 2)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S5: THE PIPELINE (SABL box, ERX gauge scores, the bouncer clusters, a stray goes, 5.7 and feet up, pull back to the drone) ------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const box = spr(f, b(10), 14);
  const gauge = -60 + 110 * ease(f, b(41), 14);
  const cluster = easeIO(f, b(38), 18);
  const wave = ease(f, b(11), 10) * (1 - ease(f, b(11) + 24, 12));
  const lit = ease(f, b(12), 10);
  const feet = easeIO(f, b(12) + 6, 20);
  const pull = easeIO(f, b(43), 30);
  return (
    <Frame p={p} preprint cam={(fr) => ({z: lerp(1.0, 1.05, easeIO(fr, 0, p.dur)), fx: 540, fy: 980})}>
      <SVG>
        <TundraWorld f={f} kind="tundra" hz={820} drift={f / 90} seed={7} />
        <ScanDrone f={f} x={540} y={560} scale={0.75} />
        {/* the SABL box */}
        {box > 0 && (
          <g opacity={Math.min(1, box)}>
            <HeldTravel f={f} x={60} y={720} w={960} h={560} mode="sweep" seed={5}><rect x={60} y={720} width={960} height={560} rx={22} fill={lit > 0 ? '#2E3436' : '#3A4144'} stroke={SCN.ink} strokeWidth={8} opacity={0.9} /></HeldTravel>
            <rect x={60} y={720} width={960} height={560} rx={22} fill="none" stroke={SCN.led} strokeWidth={6} opacity={0.3 + 0.6 * lit} />
            <rect x={84} y={744} width={912} height={512} rx={16} fill="none" stroke="#000" strokeWidth={10} opacity={0.25} />
            <ellipse cx={540} cy={1300} rx={480} ry={22} fill="#000" opacity={0.3} />
            {[[84, 744], [996, 744], [84, 1256], [996, 1256]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={8} fill="#B9BCC2" stroke={SCN.ink} strokeWidth={3} />)}
            <rect x={80} y={690} width={monoW('SABL', 40) + 40} height={60} rx={8} fill={SCN.paper} stroke={SCN.ink} strokeWidth={5} />
            <text x={80 + (monoW('SABL', 40) + 40) / 2} y={734} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={40} fill={SCN.ink}>SABL</text>
          </g>
        )}
        <g transform={`translate(240 ${lerp(500, 900, spr(f, b(48), 14))})`} opacity={clamp01(spr(f, b(48), 14))}>
          <path d="M -70 0 A 70 70 0 0 1 70 0" fill={SCN.paper} stroke={SCN.ink} strokeWidth={6} />
          <path d={`M 0 0 L ${58 * Math.cos(((gauge - 90) * Math.PI) / 180)} ${58 * Math.sin(((gauge - 90) * Math.PI) / 180)}`} stroke={SCN.ink} strokeWidth={7} strokeLinecap="round" />
          <rect x={-38} y={-42} width={76} height={30} rx={4} fill={SCN.paper} stroke={SCN.ink} strokeWidth={3} />
          <text x={0} y={-20} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={SCN.ink}>ERX</text>
        </g>
        {Array.from({length: 8}, (_, i) => {
          const isStray = i === 5;
          const xx = 280 + (i % 4) * 62 + (isStray ? 50 : 0);
          const yy = 1050 + Math.floor(i / 4) * 50;
          const gone = isStray ? ease(f, b(11) + 6, 22) : 0;
          const c = !isStray ? cluster : 0;
          const tx = lerp(xx, 470 + (i % 3) * 22, c), ty = lerp(yy, 1080 + Math.floor(i / 3) * 22, c);
          return <Pix key={i} x={tx - 260 * gone} y={ty - 280 * gone} c={isStray ? '#E8E2F0' : specColor(0.3 + i * 0.05)} hat={isStray} o={1 - gone}
            glow={i === 1 ? ease(f, b(41), 10) : 0} s={40} />;
        })}
        <Bouncer f={f} x={640} y={1250} scale={0.95} mood={f > b(11) ? 'pleased' : 'stern'} arm={Math.max(wave, 0.6 * ease(f, b(38), 10) * (1 - ease(f, b(38) + 20, 10)))} rope={260} cues={[b(38), b(11)]} />
        <g transform={`translate(${lerp(lerp(1260, 860, easeIO(f, b(41), 18)), 540, pull)} ${lerp(860, 700, pull)}) scale(${lerp(1, 1.2, pull)})`}>
          {pull < 0.5 && <ScanDrone f={f} x={0} y={-110} scale={0.42} />}
          <path d="M 0 -80 V -40" stroke={SCN.ink} strokeWidth={8} />
          <path d="M 0 -80 V -40" stroke="#3A6FD8" strokeWidth={4} />
          <Specs f={f} x={0} y={0} scale={0.52} emotion={f > b(12) ? 'smug' : 'squint'} feetUp={feet} glow={0.4 + 0.6 * ease(f, b(11) + 10, 4) * (1 - ease(f, b(11) + 16, 4))} cues={[b(11), b(12)]} />
          <Stopwatch f={f} x={-190} y={0} scale={0.5} value={lerp(21.3, 5.7, easeIO(f, b(12), 20))} calm={feet} cues={[b(12)]} />
        </g>
        <Plate x={540} text="SABL · A FASTER PIPELINE" y={530} p={ease(f, b(10) + 8) * (1 - ease(f, b(48), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="SAME DETECTOR" y={530} p={ease(f, b(48) + 4) * (1 - ease(f, b(41), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="SCORES EACH PIXEL" y={530} p={ease(f, b(41) + 4) * (1 - ease(f, b(38), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="DBSCAN · CLUSTERS THE STANDOUTS" y={530} size={28} p={ease(f, b(38) + 4) * (1 - ease(f, b(11), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="STRAY PIXELS OUT" y={530} p={ease(f, b(11) + 6) * (1 - ease(f, b(12), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="5.67 TO 5.73 MS · UNDER 10 MS" y={530} p={ease(f, b(12) + 10) * (1 - ease(f, b(43), 8))} tone="red" /> {/* plate-overlap-ok */}
        <Plate x={540} text="ON THE DRONE · NO OFFLOADING" y={1240} size={28} p={ease(f, b(43) + 14)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S6: ONE PIN (the clipboard grid close, a cluster becomes a reticle and a pin, the stamp rocks closer) -------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lock = easeIO(f, b(13) + 4, 20);
  const rock = Math.sin(f / 7) * 8 + 40 * ease(f, b(14), 14);
  return (
    <Frame p={p} preprint bg="#7A4E2A" cam={(fr) => ({z: lerp(1.12, 1.0, easeIO(fr, 0, p.dur)), fx: 540, fy: 940})}>
      <SVG>
        <rect data-band="ok" x={0} y={0} width={1080} height={1920} fill="#7A4E2A" />
        {Array.from({length: 14}, (_, i) => <path key={i} d={`M 0 ${i * 140 + 40} q 540 ${-20 + 10 * Math.sin(i)} 1080 0`} stroke="#5E3A1E" strokeWidth={4} opacity={0.5} />)}
        <HeldTravel f={f} x={170} y={580} w={700} h={760} mode="shadow" seed={6}>
          <SearchGrid f={f} x={520} y={960} w={700} h={760} stripes={1} pins={[{u: 0.42, v: 0.46, p: spr(f, b(13) + 16, 16)}]} title="SEARCH GRID" />
        </HeldTravel>
        {lock < 1 && Array.from({length: 7}, (_, i) => (
          <Pix key={i} x={lerp(240 + i * 50, 464, lock)} y={lerp(720 + (i % 3) * 60, 860, lock)} c={specColor(0.3 + i * 0.05)} s={18} o={1 - lock} />
        ))}
        <SearchReticle x={464} y={860} f={f} lock={lock} r={70} color={SCN.red} />
        <g transform={`translate(${lerp(900, 840, ease(f, b(14), 16))} 1250) rotate(${rock})`}>
          <ClearedStamp x={0} y={0} scale={0.8} f={f} />
        </g>
        <Specs f={f} x={170} y={1270} scale={0.62} emotion="smug" look={1} cues={[b(13), b(14)]} />
        <Plate x={540} text="GPS POINT PER CLUSTER" y={550} p={ease(f, b(13) + 18)} /> {/* plate-overlap-ok */}
        <Plate x={540} text="ONE PIN · GO CHECK" y={1180} p={ease(f, b(14) + 6)} tone="red" /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S7: QUINHAGAK (a paper map of the Bering Sea coast, a pin and the QSAR card, roads that stop short) ------------------------------------------
const COAST = 'M 1080 420 L 820 430 L 760 520 L 700 560 L 640 680 L 560 720 L 520 820 L 600 880 L 560 980 L 470 1040 L 430 1140 L 520 1200 L 600 1280 L 640 1420 L 740 1500 L 1080 1500 Z';
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pinP = spr(f, b(15) + 10, 16);
  const card = spr(f, b(15) + 26, 18);
  const roads = easeIO(f, b(16), 30);
  const QX = 545, QY = 1020;
  return (
    <Frame p={p} bg="#C9C3B2" cam={(fr) => ({z: lerp(1.2, 1.02, easeIO(fr, 0, p.dur * 0.7)), fx: 560, fy: lerp(980, 960, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <rect data-band="ok" x={0} y={0} width={1080} height={1920} fill="#D8D1BF" />
        <g transform={`rotate(${-2 + 0.6 * Math.sin(f / 40)} 540 960)`}>
          <rect data-band="ok" x={30} y={400} width={1020} height={1120} rx={10} fill="#BFD3D3" stroke={SCN.ink} strokeWidth={7} />
          {Array.from({length: 8}, (_, i) => <path key={i} d={`M 60 ${470 + i * 130} q 100 ${-10 + 4 * Math.sin(f / 30 + i)} 200 0 t 200 0`} stroke="#9CB8BA" strokeWidth={3} fill="none" />)}
          <HeldTravel f={f} x={420} y={420} w={660} h={1080} mode="shadow" seed={7}><path d={COAST} fill="#D7CFA8" stroke={SCN.ink} strokeWidth={6} /></HeldTravel>
          <path d={COAST} fill={SCN.sedgeL} opacity={0.35} />
          {Array.from({length: 6}, (_, i) => <path key={`r${i}`} d={`M ${1050 - i * 20} ${600 + i * 80} q -160 40 ${-300 + i * 30} ${120 + i * 10}`} stroke="#8FB3C2" strokeWidth={6} fill="none" opacity={0.8} />)}
          {/* roads draw in from the east and stop short */}
          {[[1040, 860, 820, 900], [1040, 1300, 840, 1220]].map(([x1, y1, x2, y2], i) => (
            <g key={`rd${i}`}>
              <path d={`M ${x1} ${y1} L ${lerp(x1, x2, roads)} ${lerp(y1, y2, roads)}`} stroke={SCN.ink} strokeWidth={9} strokeLinecap="round" />
              <path d={`M ${x1} ${y1} L ${lerp(x1, x2, roads)} ${lerp(y1, y2, roads)}`} stroke="#E9C46A" strokeWidth={4} strokeDasharray="14 10" strokeLinecap="round" />
              {roads > 0.98 && <path d={`M ${x2 - 10} ${y2 - 16} l 20 32 M ${x2 + 10} ${y2 - 16} l -20 32`} stroke={SCN.ink} strokeWidth={6} />}
            </g>
          ))}
          <text x={200} y={760} fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={4} fill="#5E7E86">BERING SEA</text>
          <text x={770} y={610} fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={1} fill="#6C6440">YUKON-KUSKOKWIM DELTA</text>
          <PinFlag f={f} x={QX} y={QY} scale={0.7} spring={pinP} wobble={1.5} seed={7} />
          {pinP > 0.5 && <circle cx={QX} cy={QY} r={20 + 30 * ((f % 40) / 40)} fill="none" stroke={SCN.red} strokeWidth={3} opacity={1 - (f % 40) / 40} />}
          {card > 0 && (
            <g transform={`translate(${QX - 230} ${QY + 220}) rotate(${(1 - Math.min(1, card)) * -80})`}>
              <ContactShadow cx={0} cy={4} rx={40} ry={8} opacity={0.4} />
              <path d="M 0 0 V -110" stroke={SCN.ink} strokeWidth={10} />
              <rect x={-170} y={-220} width={340} height={110} rx={8} fill={SCN.paper} stroke={SCN.ink} strokeWidth={5} />
              <text x={0} y={-178} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={SCN.ink}>QUINHAGAK SEARCH</text>
              <text x={0} y={-150} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={SCN.ink}>AND RESCUE</text>
              <text x={0} y={-124} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={18} fill="#5A544A">VOLUNTEER NONPROFIT</text>
            </g>
          )}
        </g>
        <Plate x={540} text="YUP'IK VILLAGE · NO ROADS IN" y={1260} p={ease(f, b(16) + 20)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S8: STAGED (from above: a SIMULATED SCENARIO tag, a dashed layout plan, gear drops into its outlines) -----------------------------------------
const PLAN: Array<{k: GearKind; x: number; y: number; r: number; key: 'w' | 'c'}> = [
  {k: 'waders', x: -220, y: -170, r: -8, key: 'w'}, {k: 'net', x: 60, y: -200, r: 6, key: 'w'}, {k: 'buoy', x: 260, y: -60, r: -14, key: 'w'},
  {k: 'buoy', x: -120, y: 30, r: 20, key: 'w'}, {k: 'lifejacket', x: 140, y: 160, r: 10, key: 'c'}, {k: 'bucket', x: -230, y: 190, r: 0, key: 'c'},
];
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const plan = easeIO(f, b(17) + 4, 30);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.08, 1.0, easeIO(fr, 0, p.dur)), fx: 540, fy: 960})}>
      <SVG>
        <TundraWorld f={f} kind="tundra" topDown seed={8} />
        <HeldTravel f={f} x={160} y={580} w={760} h={640} mode="shadow" seed={8}>
        <Sheet f={f} x={540} y={900} w={760} h={640} kind="plain" seed={8} label="SIMULATED SCENARIO">
          {PLAN.map((g, i) => {
            const a = g.key === 'w' ? b(44) + i * 9 : b(18) + (i - 4) * 10;
            const k = ease(f, a, 12);
            return (
              <g key={i}>
                <g opacity={plan}><Gear x={g.x} y={g.y} kind={g.k} rot={g.r} scale={0.8} ghost={1} /></g>
                {k > 0 && <Gear x={g.x} y={g.y - 140 * (1 - k)} kind={g.k} rot={g.r} scale={0.8 * (1.2 - 0.2 * k)} camo={0.1} ground={SCN.paper} />}
              </g>
            );
          })}
        </Sheet>
        </HeldTravel>
        <g transform={`translate(880 760) rotate(${-8 + 3 * (1 - spr(f, b(17), 12))})`} opacity={clamp01(spr(f, b(17), 12))}>
          <path d="M 0 0 V 140" stroke={SCN.ink} strokeWidth={10} />
          <rect x={-120} y={-50} width={240} height={70} rx={8} fill="#2E3436" stroke="#F3EDE0" strokeWidth={4} />
          <text x={0} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill="#F3EDE0">SIMULATED</text>
        </g>
        <Plate x={540} text="A STAGED SEARCH · NOT A REAL RESCUE" y={540} size={28} p={ease(f, b(17) + 10) * (1 - ease(f, b(44), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="WADERS · NETS · BUOYS" y={540} p={ease(f, b(44) + 6) * (1 - ease(f, b(18), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="ITEMS MOSTLY DONATED BY THE COMMUNITY" y={540} size={26} p={ease(f, b(18) + 8)} tone="dark" /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- the two sheets' layouts (in sheet-local coordinates) --------------------------------------------------------------------------------------------
const MUD_ITEMS: Array<{k: GearKind; x: number; y: number}> = [
  {k: 'buoy', x: -230, y: -150}, {k: 'bucket', x: -60, y: 20}, {k: 'net', x: 150, y: -160}, {k: 'boots', x: 240, y: 130}, {k: 'tarp', x: -240, y: 170},
  {k: 'lifejacket', x: 30, y: -240}, {k: 'waders', x: 120, y: 260}, {k: 'jacket', x: -110, y: 280}, {k: 'buoy', x: 270, y: -20},
];
// 9 pins: 5 on items 0..4 (5 of 9 = 56 percent of flags on items), 4 on bare mud; 5 of 9 items pinned (55 percent)
const MUD_PINS: Array<{x: number; y: number; bare: boolean}> = [
  {x: -220, y: -160, bare: false}, {x: -50, y: 10, bare: false}, {x: 160, y: -170, bare: false}, {x: 250, y: 120, bare: false}, {x: -230, y: 160, bare: false},
  {x: -300, y: 20, bare: true}, {x: 60, y: 120, bare: true}, {x: -20, y: -110, bare: true}, {x: 300, y: -250, bare: true},
];
const GRASS_ITEMS: Array<{k: GearKind; x: number; y: number; camo: number}> = [
  {k: 'lifejacket', x: -190, y: -150, camo: 0.2}, {k: 'buoy', x: 170, y: -200, camo: 0.15}, {k: 'jacket', x: 30, y: 60, camo: 0.85}, {k: 'waders', x: -250, y: 160, camo: 0.6},
  {k: 'tarp', x: 230, y: 160, camo: 0.7}, {k: 'net', x: -60, y: -260, camo: 0.6}, {k: 'boots', x: 270, y: -40, camo: 0.6},
];
// 2 pins, 2 of 2 on items 0 and 1 (99 percent of flags on items), 2 of 7 items pinned (29 percent)
const GRASS_PINS = [{x: -180, y: -160}, {x: 180, y: -210}];

const MudContents: React.FC<{f: number; a: number; s?: number}> = ({f, a, s = 1}) => (
  <g transform={`scale(${s})`}>
    {MUD_ITEMS.map((g, i) => <Gear key={i} x={g.x} y={g.y} kind={g.k} scale={0.55} rot={(i * 37) % 30 - 15} camo={0.15} ground={SCN.mud} />)}
    {MUD_PINS.map((pn, i) => <PinFlag key={i} f={f} x={pn.x} y={pn.y} scale={0.6} spring={spr(f, a + i * 5, 16)} wobble={pn.bare ? 10 : 2} seed={i + 3} />)}
  </g>
);
const GrassContents: React.FC<{f: number; a: number; bare?: number; s?: number; fog?: number; glow?: number}> = ({f, a, bare = 0, s = 1, fog = 0, glow = 0}) => (
  <g transform={`scale(${s})`}>
    {GRASS_ITEMS.map((g, i) => <Gear key={i} x={g.x} y={g.y} kind={g.k} scale={0.55} rot={(i * 41) % 30 - 15} camo={g.camo} ground={SCN.khaki} />)}
    {fog > 0 && GRASS_ITEMS.slice(2).map((g, i) => (
      <g key={`f${i}`} opacity={fog}>
        <ellipse cx={g.x + 6 * Math.sin(f / 25 + i)} cy={g.y} rx={90} ry={50} fill="#CFCFC6" opacity={0.75} />
        <ellipse cx={g.x - 10} cy={g.y - 12} rx={56} ry={26} fill="#E3E3DA" opacity={0.7} />
      </g>
    ))}
    {bare > 0 && GRASS_ITEMS.slice(2).map((g, i) => (
      <text key={`q${i}`} x={g.x} y={g.y - 50} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={38} fill="#2A2620" opacity={bare}>?</text>
    ))}
    {GRASS_PINS.map((pn, i) => <PinFlag key={i} f={f} x={pn.x} y={pn.y} scale={0.65} spring={spr(f, a + i * 8, 16)} wobble={1} seed={i + 11} glow={glow} />)}
  </g>
);

// ---- S9: MUDFLAT (the mudflat sheet from above, 9 pins, 56 then 55) ------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  return (
    <Frame p={p} preprint cam={(fr) => ({z: lerp(1.12, 1.0, easeIO(fr, 0, p.dur)), fx: 540, fy: lerp(920, 960, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <TundraWorld f={f} kind="mudflat" topDown seed={9} />
        <HeldTravel f={f} x={100} y={580} w={880} h={760} mode="shadow" seed={9}>
          <Sheet f={f} x={540} y={1000} w={760} h={600} kind="mudflat" seed={1} label="MUDFLAT · ITS OWN THRESHOLD">
            <MudContents f={f} a={b(19) + 6} s={0.88} />
          </Sheet>
        </HeldTravel>
        <Burst x={300} y={560} lines={['56%', '5 OF 9 FLAGS ON ITEMS']} p={spr(f, b(45), 14)} size={28} rot={-5} />
        <Burst x={790} y={560} lines={['55%', '5 OF 9 ITEMS FLAGGED']} p={spr(f, b(20), 14)} size={28} fill="#D8DDE0" rot={4} />
        <Tussocks f={f} y={1500} tone="mud" drift={f / 100} />
      </SVG>
    </Frame>
  );
};

// ---- S10: SWAMP GRASS (the swamp grass sheet alone, 2 pins on 2 items, 5 of 7 bare) -------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const drop = spr(f, b(21), 14);
  const scan = clamp01((f - b(23)) / 50);
  return (
    <Frame p={p} preprint cam={(fr) => ({z: lerp(1.0, 1.07, easeIO(fr, 0, p.dur)), fx: 540, fy: 960})}>
      <SVG>
        <TundraWorld f={f} kind="grass" topDown seed={10} />
        <g transform={`translate(0 ${(1 - Math.min(1, drop)) * -300}) scale(1)`}>
          <HeldTravel f={f} x={160} y={630} w={760} h={660} mode="shadow" seed={10}>
          <Sheet f={f} x={540} y={960} w={760} h={660} kind="grass" seed={3} label="SWAMP GRASS · ITS OWN THRESHOLD">
            <GrassContents f={f} a={b(22)} bare={ease(f, b(23) + 30, 14)} />
            {scan > 0 && scan < 1 && <rect x={-380} y={-330 + 660 * scan} width={760} height={14} fill={specColor(scan * 0.9)} stroke={SCN.ink} strokeWidth={2} />}
          </Sheet>
          </HeldTravel>
        </g>
        <Burst x={300} y={560} lines={['99%', '2 OF 2 FLAGS ON ITEMS']} p={spr(f, b(22) + 10, 14)} size={28} rot={-4} />
        <Burst x={790} y={560} lines={['29%', '2 OF 7 ITEMS FLAGGED']} p={spr(f, b(23) + 6, 14)} size={28} fill="#D8DDE0" rot={4} />
        <Tussocks f={f} y={1500} drift={f / 100} />
        <g transform={`translate(${lerp(1200, 960, ease(f, b(23), 20))} 1160) rotate(${-20 + 10 * Math.sin(f / 8)})`}><ClearedStamp x={0} y={0} scale={0.6} f={f} /></g>
      </SVG>
    </Frame>
  );
};

// ---- S11: ONE COIN (5.7 holds, the 99 and 29 badges fuse, the coin turns slowly on its edge and stands, the blank cells fog) -------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slam = easeIO(f, b(24) - 12, 14);
  const turn = f < b(24) ? 0 : clamp01((f - b(24)) / Math.max(1, b(25) - b(24) + 20));
  const fog = easeIO(f, b(25) - 6, 30);
  const sw = ease(f, b(46), 10) * (1 - ease(f, b(24), 10));
  return (
    <Frame p={p} preprint cam={(fr) => ({z: lerp(1.0, 1.06, easeIO(fr, 0, p.dur)), fx: 540, fy: 900})}>
      <SVG>
        <TundraWorld f={f} kind="grass" topDown seed={11} />
        <HeldTravel f={f} x={130} y={800} w={820} h={560} mode="shadow" seed={11}>
          <Sheet f={f} x={540} y={1080} w={820} h={560} kind="grass" seed={4} label="SWAMP GRASS">
            <GrassContents f={f} a={-200} s={0.85} fog={fog} glow={fog} />
          </Sheet>
        </HeldTravel>
        <g opacity={sw}><Stopwatch f={f} x={250} y={700} scale={0.9} value={5.7} calm={1} cues={[b(46)]} /></g>
        {slam < 1 && <Burst x={lerp(-100, 720, slam)} y={760} lines={['99%']} p={1} size={60} />}
        {slam < 1 && <Burst x={lerp(1180, 720, slam)} y={760} lines={['29%']} p={1} size={60} fill="#D8DDE0" />}
        {slam >= 1 && <Coin x={720} y={760} scale={0.8} spin={turn} rot={-6} shadowY={330} front={['99%', 'FLAGS ON ITEMS']} back={['29%', 'ITEMS FLAGGED']} />}
        {slam >= 1 && f < b(24) + 10 && <circle cx={720} cy={760} r={120 + 200 * ((f - b(24)) / 10)} fill="none" stroke="#F2D15C" strokeWidth={10} opacity={1 - (f - b(24)) / 10} />}
        <Tussocks f={f} y={1500} drift={f / 90} />
        <Plate x={540} text="IT KEEPS UP" y={520} p={ease(f, b(46) + 4) * (1 - ease(f, b(24), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="SWAMP GRASS · ITS OWN THRESHOLD" y={520} size={26} p={ease(f, b(24) + 6) * (1 - ease(f, b(25), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="TRUST THE FLAG · NOT THE SILENCE" displayLines={['TRUST THE FLAG', 'NOT THE SILENCE']} y={540} size={34} p={ease(f, b(25) + 4)} tone="dark" /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S12: THE CAMOUFLAGE CASE (the field-guide desk: a page flips open, three cards rise, a camo swatch tagged ILLUSTRATION darkens) -----------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const open = easeIO(f, b(26), 18);
  const rise = (i: number) => easeIO(f, b(26) + 10 + i * 6, 22);
  const sw = spr(f, b(39), 16);
  const dark = easeIO(f, b(39) + 6, 80);
  return (
    <Frame p={p} bg="#C9C3B2" cam={(fr) => ({z: lerp(1.06, 1.16, easeIO(fr, 0, p.dur)), fx: 540, fy: lerp(1000, 1040, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <Desk />
        {/* the field guide */}
        <g transform="translate(540 1230)">
          <ContactShadow cx={0} cy={40} rx={440} ry={24} opacity={0.4} />
          <path d="M -420 -10 L 0 20 L 420 -10 L 420 30 L 0 60 L -420 30 Z" fill="#5E3A1E" stroke={SCN.ink} strokeWidth={6} />
          <path d={`M 0 20 L -400 ${-10 - 260 * open} L -400 ${-10} Z`} fill={SCN.paper} stroke={SCN.ink} strokeWidth={5} />
          <HeldTravel f={f} x={0} y={-270} w={400} h={290} mode="shadow" seed={12}><path d="M 0 20 L 400 -10 L 400 -270 L 0 -240 Z" fill={SCN.paper} stroke={SCN.ink} strokeWidth={5} opacity={open} /></HeldTravel>
          {Array.from({length: 6}, (_, i) => <path key={i} d={`M 40 ${-210 + i * 34} L 360 ${-236 + i * 34}`} stroke={SCN.rule} strokeWidth={4} opacity={open} />)}
          <text x={200} y={-208} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={SCN.ink} opacity={open} transform="rotate(-4 200 -208)">FIELD GUIDE</text>
          <g opacity={open}>{Array.from({length: 12}, (_, i) => <rect key={i} x={60 + i * 24} y={-150 - i * 1.8} width={22} height={40} fill={specColor(i / 11)} stroke={SCN.ink} strokeWidth={1.5} />)}</g>
        </g>
        {['CAMOUFLAGED', 'INSULATED', 'NO HEAT SIGNATURE'].map((t, i) => (
          <g key={t} transform={`translate(${230 + i * 310} ${lerp(1150, 760 - (i === 1 ? 50 : 0), rise(i))}) rotate(${(i - 1) * 4})`} opacity={rise(i)}>
            <rect x={-160} y={-70} width={320} height={140} rx={10} fill="#000" opacity={0.25} transform="translate(8 10)" />
            <rect x={-160} y={-70} width={320} height={140} rx={10} fill={SCN.paper} stroke={SCN.ink} strokeWidth={7} />
            <text x={0} y={i === 2 ? -6 : 12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={i === 2 ? 26 : 30} fill={SCN.ink}>{i === 2 ? 'NO HEAT' : t}</text>
            {i === 2 && <text x={0} y={28} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} fill={SCN.ink}>SIGNATURE</text>}
          </g>
        ))}
        {sw > 0 && (
          <g transform={`translate(${lerp(-200, 300, Math.min(1, sw))} 1000) rotate(-6)`}>
            <rect x={-130} y={-60} width={260} height={120} rx={8} fill="#000" opacity={0.25} transform="translate(6 8)" />
            <rect x={-130} y={-60} width={260} height={120} rx={8} fill={lerp(0, 1, dark) > 0.5 ? '#7E8A4A' : '#9AA35E'} stroke={SCN.ink} strokeWidth={5} strokeDasharray="10 6" />
            {Array.from({length: 9}, (_, i) => <ellipse key={i} cx={-100 + (i % 3) * 90 + 10 * h01(i, 1)} cy={-30 + Math.floor(i / 3) * 30} rx={34} ry={12} fill={i % 2 ? '#6B7440' : '#A4AE68'} opacity={0.4 + 0.5 * (1 - dark)} />)}
            <rect x={-150} y={-40} width={20} height={80} fill="#7E8A4A" stroke={SCN.ink} strokeWidth={3} opacity={dark} />
            <IllTag x={0} y={-80} />
          </g>
        )}
        <Plate x={540} text="THE CAMOUFLAGE CASE · THE PAPER'S PITCH" y={640} size={28} p={ease(f, b(26) + 16)} tone="red" /> {/* plate-overlap-ok */}
        <Plate x={540} text="GENERIC CAMO SWATCH" y={1270} size={26} p={ease(f, b(39) + 16)} /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S13: TURNED AWAY (low at the rope: false alarms out, one hatched swatch pixel with them, the rope rises a notch, the rest fade; Specs dims) --------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const wave1 = ease(f, b(27) + 6, 10) * (1 - ease(f, b(27) + 30, 12));
  const wave2 = ease(f, b(47), 10) * (1 - ease(f, b(47) + 20, 10));
  const raise = easeIO(f, b(28), 16);
  const dim = easeIO(f, b(29), 20);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.08, easeIO(fr, 0, p.dur)), fx: 540, fy: lerp(1000, 960, easeIO(fr, 0, p.dur))})}>
      <SVG>
        <TundraWorld f={f} kind="grass" hz={900} drift={f / 90} seed={13} />
        {Array.from({length: 6}, (_, i) => (
          <Pix key={i} x={300 + (i % 3) * 30 - 380 * ease(f, b(27) + 8 + i * 3, 20)} y={1080 + Math.floor(i / 3) * 40 - 200 * ease(f, b(27) + 8 + i * 3, 20) * (i % 2 ? 1 : 0.5)} c="#E8E2F0" hat o={1 - ease(f, b(27) + 8 + i * 3, 20)} />
        ))}
        {Array.from({length: 4}, (_, i) => {
          const come = ease(f, b(27) + 30 + i * 4, 24);
          const swept = i === 0 ? ease(f, b(47) + 4, 20) : 0;
          const fade = i > 0 ? easeIO(f, b(28) + 10 + i * 4, 24) : 0;
          return come > 0 ? <HatchPix key={`h${i}`} x={lerp(80, 400 + i * 30, come) - 420 * swept} y={1100 + (i % 2) * 36 - 120 * swept} o={(1 - swept) * (1 - fade)} /> : null;
        })}
        <IllTag x={260} y={960} p={ease(f, b(27) + 30, 10) * (1 - ease(f, b(28) + 40, 12))} />
        <g transform={`translate(0 ${-40 * raise})`}>
          <HeldTravel f={f} x={400} y={860} w={560} h={460} mode="sweep" seed={13}>
            <Bouncer f={f} x={520} y={1300} scale={1.45} mood={f > b(47) ? 'unsure' : 'stern'} arm={Math.max(wave1, wave2)} rope={300} cues={[b(27), b(47), b(28)]} />
          </HeldTravel>
        </g>
        <ScanDrone f={f} x={850} y={680} scale={0.5} />
        <g transform="translate(850 860)">
          <path d="M 0 -150 V -70" stroke={SCN.ink} strokeWidth={8} />
          <path d="M 0 -150 V -70" stroke="#3A6FD8" strokeWidth={4} />
          <Specs f={f} x={0} y={0} scale={0.52} emotion={dim > 0.3 ? 'doubtful' : 'squint'} glow={0.6 - 0.55 * dim - 0.05 * easeIO(f, b(49), 20)} cues={[b(29), b(49)]} />
        </g>
        <Tussocks f={f} y={1490} drift={f / 90} />
        <Plate x={540} text="CUTTING FALSE ALARMS" y={530} p={ease(f, b(27) + 8) * (1 - ease(f, b(47), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="CAN DROP REAL HITS · ILLUSTRATION" y={530} size={28} p={ease(f, b(47) + 6) * (1 - ease(f, b(28), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="STRICTER CAN HIDE CAMOUFLAGE · ILLUSTRATION" y={530} size={26} p={ease(f, b(28) + 6) * (1 - ease(f, b(29), 8))} /> {/* plate-overlap-ok */}
        {f > b(49) - 4 && (
          <g transform={`translate(${lerp(1200, 700, easeIO(f, b(49), 20))} 1020) rotate(4)`} opacity={1 - 0.75 * easeIO(f, b(49) + 20, 30)}>
            <rect x={-160} y={-50} width={320} height={100} rx={10} fill={SCN.paper} stroke={SCN.ink} strokeWidth={6} />
            <text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={SCN.ink}>CAMOUFLAGED</text>
          </g>
        )}
        <Plate x={540} text="CAN GO QUIET IN THE CASE IT'S PITCHED FOR" y={530} size={26} p={ease(f, b(29) + 8)} tone="dark" /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S14: THE FENCE (from above, a dashed ring closes round the two sheets; tags clip on; an empty REAL SEARCH box is struck) ----------------------------
const ClipTag: React.FC<{x: number; y: number; lines: string[]; a: number; f: number; dark?: boolean}> = ({x, y, lines, a, f, dark = false}) => {
  const k = spr(f, a, 12);
  if (k <= 0) return null;
  const w = Math.max(...lines.map((l) => monoW(l, 22))) + 36;
  const h = lines.length * 30 + 20;
  return (
    <g transform={`translate(${x} ${y - 30 * (1 - Math.min(1, k))}) rotate(${-4 + 2 * Math.sin(f / 20 + x)})`} opacity={Math.min(1, k)}>
      <rect x={-18} y={-h / 2 - 22} width={36} height={26} rx={6} fill="#B9BCC2" stroke={SCN.ink} strokeWidth={4} />
      <rect x={-w / 2 + 5} y={-h / 2 + 6} width={w} height={h} rx={6} fill="#000" opacity={0.25} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={dark ? '#2E3436' : SCN.paper} stroke={SCN.ink} strokeWidth={4} />
      {lines.map((l, i) => <text key={i} x={0} y={-h / 2 + 34 + i * 30} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={dark ? '#F3EDE0' : SCN.ink}>{l}</text>)}
    </g>
  );
};
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const ring = easeIO(f, b(30), 30);
  const strike = easeIO(f, b(31) + 10, 14);
  const L = 2200;
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.1, 0.98, easeIO(fr, 0, p.dur)), fx: 540, fy: 960})}>
      <SVG>
        <TundraWorld f={f} kind="tundra" topDown seed={14} />
        <HeldTravel f={f} x={150} y={820} w={790} h={320} mode="shadow" seed={14}>
          <Sheet f={f} x={330} y={980} w={340} h={300} kind="mudflat" seed={5}><MudContents f={f} a={-100} s={0.42} /></Sheet>
          <Sheet f={f} x={760} y={980} w={340} h={300} kind="grass" seed={6}><GrassContents f={f} a={-100} s={0.42} fog={1} /></Sheet>
        </HeldTravel>
        <ellipse cx={545} cy={990} rx={480} ry={300} fill="none" stroke={SCN.ink} strokeWidth={7} strokeDasharray="22 14" pathLength={L} strokeDashoffset={L * (1 - ring)} opacity={0.9} />
        <ClipTag x={545} y={690} lines={['2 SCENES', 'TUNDRA · JULY']} a={b(42)} f={f} />
        <ClipTag x={260} y={1250} lines={['UNREVIEWED', 'PREPRINT']} a={b(31)} f={f} dark />
        <g transform="translate(800 1250)" opacity={ease(f, b(31) + 4, 10)}>
          <rect x={-120} y={-44} width={240} height={88} rx={6} fill={SCN.paper} stroke={SCN.ink} strokeWidth={5} strokeDasharray="12 8" />
          <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={SCN.ink}>REAL SEARCH</text>
          <path d={`M -130 30 L ${-130 + 260 * strike} ${30 - 60 * strike}`} stroke={SCN.ink} strokeWidth={8} strokeDasharray="14 8" strokeLinecap="round" />
        </g>
        <Plate x={540} text="RECALL · STILL LIMITED" y={520} p={ease(f, b(30) + 10) * (1 - ease(f, b(31), 8))} /> {/* plate-overlap-ok */}
        <Plate x={540} text="UNREVIEWED PREPRINT · NOT A REAL SEARCH" y={520} size={26} p={ease(f, b(31) + 10)} tone="dark" /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S15: AUGMENT (a layer cake of maps; QSAR's visible + infrared layer below, the swamp grass sheet with its pins slides on top) ----------------------
const Layer: React.FC<{y: number; color: string; label: string; f: number; pins?: boolean; scan?: boolean}> = ({y, color, label, f, pins, scan}) => (
  <g transform={`translate(540 ${y})`}>
    <path d="M -380 0 L 0 -150 L 380 0 L 0 150 Z" fill="#000" opacity={0.2} transform="translate(8 14)" />
    <path d="M -380 0 L 0 -150 L 380 0 L 0 150 Z" fill={color} stroke={SCN.ink} strokeWidth={6} />
    <path d="M -380 0 L 0 150 L 380 0 L 380 24 L 0 174 L -380 24 Z" fill="#000" opacity={0.25} stroke={SCN.ink} strokeWidth={5} />
    {Array.from({length: 6}, (_, i) => <path key={i} d={`M ${-300 + i * 110} ${-20 + (i % 2) * 30} q 30 -10 60 0`} stroke="#fff" strokeWidth={3} opacity={0.35} fill="none" />)}
    {scan && <path d={`M ${-380 + ((f * 6) % 760)} ${-150 + (((f * 6) % 760) / 760) * 150} l ${-0} 0`} stroke={SCN.led} strokeWidth={6} />}
    {scan && <path d={`M ${-380 + ((f * 5) % 760) * 0.5} ${-((f * 5) % 760) * 0.2} L ${((f * 5) % 760) * 0.5} ${150 - ((f * 5) % 760) * 0.2}`} stroke="#F3EDE0" strokeWidth={4} opacity={0.5} />}
    {pins && [[-150, -30], [60, 40]].map(([x, yy], i) => <PinFlag key={i} f={f} x={x} y={yy} scale={0.5} spring={1} wobble={1} seed={i + 21} glow={0.5 + 0.5 * Math.sin(f / 8 + i)} />)}
    <text x={0} y={70} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill="#F3EDE0">{label}</text>
  </g>
);
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const top = easeIO(f, b(32) + 2, 24);
  return (
    <Frame p={p} cam={(fr) => ({z: lerp(1.0, 1.07, easeIO(fr, 0, p.dur)), fx: 540, fy: 920})}>
      <SVG>
        <TundraWorld f={f} kind="tundra" hz={460} seed={15} />
        <HeldTravel f={f} x={160} y={880} w={760} h={320} mode="sweep" seed={15}><Layer y={1030} color={SCN.shade} label="QSAR · VISIBLE + INFRARED" f={f} scan /></HeldTravel>
        <ellipse cx={540} cy={lerp(700, 960, top)} rx={360} ry={40} fill="#000" opacity={0.25 * top} />
        <g transform={`translate(0 ${lerp(-420, 0, top)})`}>
          <Sheet f={f} x={540} y={780} w={600} h={380} kind="grass" seed={4} label="SABL FLAGS · SWAMP GRASS">
            <GrassContents f={f} a={-200} s={0.62} fog={1} glow={0.5 + 0.5 * Math.sin(f / 8)} />
          </Sheet>
        </g>
        <Plate x={540} text="AUGMENT · NOT REPLACE" y={520} p={ease(f, b(32) + 16)} tone="red" /> {/* plate-overlap-ok */}
      </SVG>
    </Frame>
  );
};

// ---- S16: KEEP LOOKING (the stamp swings at the fog, a pin's tip stops it with a squash and a spark, it flips and lands NOT CLEARED on silent fog) -
const S16: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const PIN = {x: 520, y: 1060};
  const FOG = {x: 790, y: 950};
  const swing = easeIO(f, b(33), 22);
  const hit = f >= b(34);
  const hitK = hit ? Math.max(0, 1 - (f - b(34)) / 10) : 0;
  const flip = easeIO(f, b(35), 14);
  const move = easeIO(f, b(35) + 10, 14);
  const press = easeIO(f, b(35) + 24, 6);
  const lift = easeIO(f, b(35) + 40, 12);
  const sx = hit ? lerp(PIN.x, FOG.x, move) : lerp(1000, PIN.x, swing);
  const stampY = PIN.y - 175;
  const sy = hit ? lerp(stampY - 30 * hitK, FOG.y - 30, move) + 40 * press - 160 * lift : lerp(420, stampY, swing);
  const squash = hit ? 1 - 0.12 * hitK : 1;
  const scanP = clamp01((f - b(35) - 30) / 70);
  const relight = easeIO(f, b(35) + 6, 14);
  return (
    <Frame p={p} preprint bg="#7A4E2A" cam={(fr) => ({z: lerp(1.02, 1.1, easeIO(fr, 0, p.dur)), fx: 580, fy: 980})}>
      <SVG>
        <rect data-band="ok" x={0} y={0} width={1080} height={1920} fill="#7A4E2A" />
        {Array.from({length: 14}, (_, i) => <path key={i} d={`M 0 ${i * 140 + 40} q 540 ${-20 + 10 * Math.sin(i)} 1080 0`} stroke="#5E3A1E" strokeWidth={4} opacity={0.5} />)}
        {/* desk props in the lower third */}
        <g transform="translate(250 1640) rotate(-8)"><rect x={-110} y={-50} width={220} height={100} rx={14} fill="#2E3436" stroke={SCN.ink} strokeWidth={6} /><rect x={-90} y={-32} width={180} height={64} rx={8} fill={SCN.redD} opacity={0.8} /></g>
        <g transform="translate(700 1700) rotate(14)"><rect x={-180} y={-12} width={340} height={24} rx={4} fill="#E9C46A" stroke={SCN.ink} strokeWidth={5} /><path d="M 160 -12 L 200 0 L 160 12 Z" fill="#D9B48A" stroke={SCN.ink} strokeWidth={4} /></g>
        <g transform="translate(960 1560) rotate(-12)"><rect x={-160} y={-120} width={320} height={240} fill={SCN.mud} stroke={SCN.ink} strokeWidth={5} /><text x={0} y={-80} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill="#F3EDE0">MUDFLAT</text></g>
        <HeldTravel f={f} x={160} y={570} w={760} h={820} mode="shadow" seed={16}>
          <SearchGrid f={f} x={540} y={980} w={760} h={820} stripes={1}
            pins={[{u: 0.22, v: 0.28, p: 1}, {u: 0.36, v: 0.74, p: 1}]}
            fog={[{u: 0.6, v: 0.58, r: 0.28, p: 1}, {u: 0.8, v: 0.46, r: 0.15, p: 1}]} title="SEARCH GRID" />
        </HeldTravel>
        <PinFlag f={f} x={PIN.x} y={PIN.y} scale={0.75 * (hit ? 1 - 0.1 * hitK : 1)} spring={spr(f, b(34) - 6, 8)} wobble={1} seed={31} glow={hit ? 1 : 0} />
        {hit && hitK > 0 && Array.from({length: 8}, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <path key={i} d={`M ${PIN.x + Math.cos(a) * 20} ${stampY + 40 + Math.sin(a) * 20} l ${Math.cos(a) * 50 * (1 - hitK)} ${Math.sin(a) * 50 * (1 - hitK)}`} stroke={SCN.redL} strokeWidth={6} strokeLinecap="round" opacity={hitK} />;
        })}
        <StampMark x={FOG.x} y={FOG.y + 30} text="NOT CLEARED" p={press} size={34} rot={-7} />
        <g transform={`translate(${sx} ${sy}) rotate(${hit ? -4 : lerp(28, -4, swing)}) scale(1 ${squash})`}>
          <ClearedStamp x={0} y={0} scale={0.85} flip={flip} f={f} />
        </g>
        {scanP > 0 && <Scanline f={f} x0={170} x1={910} y0={620} y1={1380} p={scanP} wake={0.15} face={false} thick={14} />}
        {scanP > 0 && scanP < 1 && [0, 1, 2].map((i) => <circle key={i} cx={260 + i * 260 + 20 * Math.sin(f / 4 + i)} cy={620 + 760 * scanP} r={8} fill={SCN.led} stroke={SCN.ink} strokeWidth={2} />)}
        <ScanDrone f={f} x={200} y={560} scale={0.36} />
        <path d="M 200 590 V 620" stroke={SCN.ink} strokeWidth={6} />
        <Specs f={f} x={200} y={680} scale={0.45} emotion={relight > 0.5 ? 'resolved' : 'doubtful'} glow={0.15 + 0.85 * relight} look={0.8} cues={[b(33), b(34), b(35)]} />
        <Plate x={540} text="CLEARED?" y={560} p={f >= b(33) + 4 && f < b(34) ? 1 : 0} /> {/* plate-overlap-ok */}
        <Plate x={540} text="A FLAG MEANS GO LOOK" y={560} p={f >= b(34) && f < b(35) ? 1 : 0} tone="red" /> {/* plate-overlap-ok */}
        <Plate x={540} text="NO FLAG · KEEP LOOKING" y={560} p={f >= b(35) + 4 ? 1 : 0} tone="dark" /> {/* plate-overlap-ok */}
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

export const ep1124Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1124Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1124: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 7.92, 14.76, 21.6, 35.94, 49.4, 53.66, 60.36, 66.42, 73.5, 81.14, 85.74, 91.26, 102.02, 110.26, 113.52, 120.4].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#2E3436" ink="#F3EDE0" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
