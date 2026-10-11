import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, NightGrade, INK, ContactShadow, DayGrade} from './lib/lighting';
import {VoiceProvider, useVoice} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {FlightCrate} from './lib/clinic';
import {AlaskaMini} from './lib/kit';
import {StampBot} from './lib/credentials';
import {ReviewPen, TallyCounter} from './lib/props';
import {Raven} from './lib/fauna';
import {AnchorageSkylineBG} from './lib/biomes';
import {Snowfall} from './lib/refinery';
import {ImpactStar} from './lib/FX';
import {PAL, KraftTag, Rotors, GroceryShelf, CodeSheet, ZoneBeam, DriftStack, UsdaGate, Calipers, RuralSwirl, SteelTag, Barcode, monoW} from './lib/grocer';

// THIS CRATE WAS SUPPOSED TO FLY, 2026-10-11. Palette roles are art_direction.json. KRAFT is only the tag, MINT only AI-written code, RED only the human check,
// STEEL and GOLD only the rule, GREEN only the gate. Every painted string is a claims.json on_screen string, a quote, or a plain label.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const C = {ink: INK, paper: PAL.paper};

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
const gt = (p: SP) => (p.from + p.f) / 30;

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'paper' | 'kraft' | 'steel' | 'mint' | 'red' | 'green';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#10151F', fg: '#EDE6D2'},
  paper: {fill: PAL.paper, fg: C.ink},
  kraft: {fill: PAL.kraft, fg: C.ink},
  steel: {fill: PAL.steel, fg: '#F4F1E6'},
  mint: {fill: '#0E2420', fg: PAL.mint},
  red: {fill: PAL.paper, fg: PAL.red},
  green: {fill: PAL.greenDeep, fg: '#F4F1E6'},
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
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={1} fill={PAL.steelDeep}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: push, kick, grade ---------------------------------------------------------
const CHIP = 'ILLUSTRATION';
const Frame: React.FC<{p: SP; z0?: number; z1?: number; zk?: (f: number) => number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; night?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; children: React.ReactNode}> =
({p, z0 = 1, z1 = 1.05, zk, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, night = 0.12, bloom = 0.06, vignette = 0.32, ox = 540, oy = 900, tag = true, overlay, tagText = CHIP, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const z = zk ? zk(p.f) : lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur)));
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


// ---- shared set pieces ------------------------------------------------------------------------------------
/** First light on snowy tundra: rose horizon, glacier ridges, drifts, a foreground of tussocks. */
const DawnTundra: React.FC<{f: number; shift?: number; ground?: number; wind?: number; dust?: boolean}> = ({f, shift = 0, ground = 1330, wind = 1, dust = true}) => {
  const clouds = [0, 1, 2].map((i) => ({x: ((i * 470 + f * (0.25 + i * 0.1) * wind + shift * 0.2) % 1500) - 200, y: 700 + i * 70 - (i % 2) * 40, w: 300 + i * 90}));
  return (
    <g>
      <defs>
        <linearGradient id="dt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E2B3A" /><stop offset="0.28" stopColor="#4B5483" /><stop offset="0.43" stopColor="#B8789A" /><stop offset="0.5" stopColor={PAL.rose} /><stop offset="0.56" stopColor="#F7CFB0" />
        </linearGradient>
        <radialGradient id="dt-sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFF0D6" stopOpacity="1" /><stop offset="0.4" stopColor="#FFC9A0" stopOpacity="0.6" /><stop offset="1" stopColor={PAL.rose} stopOpacity="0" /></radialGradient>
        <linearGradient id="dt-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4DCD4" /><stop offset="0.25" stopColor={PAL.snow} /><stop offset="1" stopColor="#C9D8E2" /></linearGradient>
      </defs>
      <rect data-band="ok" x={-20} y={-20} width={1120} height={1100} fill="url(#dt-sky)" />
      {Array.from({length: 40}, (_, i) => <circle key={i} cx={rnd(i + 5) * 1080} cy={rnd(i + 55) * 560} r={1 + (i % 3) * 0.6} fill="#fff" opacity={(0.25 + 0.35 * Math.sin(f / 19 + i)) * (1 - 0.8 * (rnd(i + 55) * 560) / 560)} />)}
      <circle cx={340 - shift * 0.1} cy={ground - 380} r={300} fill="url(#dt-sun)" />
      <circle cx={340 - shift * 0.1} cy={ground - 380} r={78} fill="#FFF0D6" opacity={0.95} />
      {clouds.map((c, i) => (
        <g key={i} opacity={0.8}>
          <ellipse cx={c.x} cy={c.y} rx={c.w / 2} ry={22} fill="#F9C9B6" />
          <ellipse cx={c.x + 40} cy={c.y - 14} rx={c.w / 3} ry={20} fill="#FBD8C6" />
          <rect x={c.x - c.w / 2} y={c.y + 8} width={c.w} height={14} fill="#E39AA0" opacity={0.6} />
        </g>
      ))}
      <path data-band="ok" d={`M -40 ${ground - 250} L 120 ${ground - 330} L 230 ${ground - 280} L 380 ${ground - 400} L 520 ${ground - 300} L 650 ${ground - 350} L 820 ${ground - 270} L 980 ${ground - 340} L 1120 ${ground - 260} L 1120 ${ground - 150} L -40 ${ground - 150} Z`} fill="#8FA7C9" stroke={INK} strokeWidth={4} transform={`translate(${-shift * 0.25},0)`} />
      <path d={`M 380 ${ground - 400} L 330 ${ground - 340} L 372 ${ground - 350} L 405 ${ground - 330} L 440 ${ground - 355} Z`} fill="#fff" opacity={0.85} transform={`translate(${-shift * 0.25},0)`} />
      <path data-band="ok" d={`M -40 ${ground - 170} Q 160 ${ground - 240} 340 ${ground - 190} T 700 ${ground - 200} T 1120 ${ground - 180} L 1120 ${ground - 60} L -40 ${ground - 60} Z`} fill="#6F8FB5" stroke={INK} strokeWidth={4} transform={`translate(${-shift * 0.45},0)`} />
      <rect data-band="ok" x={-40} y={ground - 90} width={1160} height={2200} fill="url(#dt-snow)" />
      <path d={`M -40 ${ground - 90} Q 200 ${ground - 120} 480 ${ground - 96} T 1120 ${ground - 100}`} fill="none" stroke={PAL.rose} strokeWidth={6} opacity={0.7} />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M ${-60 + i * 230} ${ground + 60 + (i % 3) * 90} q 120 -34 260 0 q -130 40 -260 0`} fill={PAL.snowShade} opacity={0.55} stroke="none" />)}
      {dust && Array.from({length: 34}, (_, i) => {
        const px = ((rnd(i + 7) * 1300 + f * (4 + rnd(i) * 7) * wind) % 1300) - 110;
        const py = ground - 40 + rnd(i + 17) * 140;
        return <rect key={i} x={px} y={py} width={18 + rnd(i + 3) * 30} height={3} rx={1.5} fill="#fff" opacity={0.35 + 0.3 * rnd(i + 9)} />;
      })}
      {/* near plane: tussocks below the caption */}
      {Array.from({length: 11}, (_, i) => {
        const tx = -20 + i * 112 + (i % 2) * 20, sw = 5 * Math.sin(f / 20 + i);
        return (
          <g key={i} transform={`translate(${tx},${1760 + (i % 3) * 40})`}>
            <ellipse cx={0} cy={50} rx={58} ry={12} fill="#10151F" opacity={0.18} />
            {[-26, -12, 0, 12, 26].map((o, k) => <path key={k} d={`M ${o} 50 q ${o * 0.3 + sw} -60 ${o * 0.8 + sw * 2} -${90 + k * 10}`} fill="none" stroke={k % 2 ? '#5C6B4A' : '#7C8A5E'} strokeWidth={9} strokeLinecap="round" />)}
            <path d="M -30 50 q 30 -26 60 0" fill="#3E4A33" stroke={INK} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
};

/** The crate on tundra: lift, wobble, thump, dust. Shared by the first and last shot so the loop matches. */
const CrateOnTundra: React.FC<{f: number; spin: number; lift: number; squash?: number; tagSpin: number; dust?: number; x?: number; ground?: number; scale?: number}> =
({f, spin, lift, squash = 0, tagSpin, dust = 0, x = 540, ground = 1330, scale = 1.35}) => {
  const cy = ground - 94 * scale - lift;
  return (
    <g>
      <ContactShadow cx={x} cy={ground + 8} rx={250 * (1 - lift / 400)} ry={26} opacity={0.5 * (1 - lift / 260)} />
      {dust > 0.01 && (
        <g opacity={1 - dust}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={x + (i - 3) * 90 * (0.4 + dust)} cy={ground - 10 - 36 * dust - (i % 2) * 14} r={22 + 40 * dust} fill="#FFFFFF" opacity={0.6} />)}
        </g>
      )}
      <g transform={`translate(${x},${cy + squash * 18}) scale(${1 + squash * 0.05},${1 - squash * 0.08}) translate(${-x},${-cy - squash * 18})`}>
        <Rotors x={x} y={cy} scale={scale} f={f} spin={spin} />
        <FlightCrate x={x} y={cy} f={f} scale={scale} proposed={false} />
        <KraftTag x={x - 6} y={cy - 300 * scale / 1.35 + 30} f={f} scale={0.62} spin={tagSpin} front="blank" back="blank" stringLen={20} />
      </g>
    </g>
  );
};

// ---- S1: the crate that tried to fly (beats 1 and 2) -------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const spinUp = ease(f, 0, 14);
  const t2 = b(2);
  const liftIn = ease(f, 6, 18);
  const dip = f < 10 ? 10 * ease(f, 0, 6) : 0;
  const drop = clamp01((f - (t2 - 6)) / 14);
  const lift = (78 * liftIn - dip + 4 * Math.sin(f * 0.7) * liftIn) * (1 - drop * drop);
  const landed = f > t2 + 6;
  const squash = landed ? Math.max(0, 1 - (f - t2 - 6) / 10) : 0;
  const spin = spinUp * (1 - clamp01((f - t2 - 6) / 22));
  const dust = landed ? clamp01((f - t2 - 6) / 26) : 0;
  return (
    <Frame p={p} z0={1.1} z1={1.0} dy0={-40} dy1={0} night={0} bloom={0.08}
      overlay={<>
        <Plate text="STUDY CRATE" y={560} size={32} tone="paper" p={ease(f, b(1) + 8, 10) * (f < t2 + 4 ? 1 : 0)} />
        <Plate text="STARTED AS DRONE DELIVERY RESEARCH" displayLines={['STARTED AS DRONE', 'DELIVERY RESEARCH']} y={600} size={30} tone="kraft" p={ease(f, t2 + 6, 10)} />
      </>}>
      <SVG>
        <DawnTundra f={f + p.from} wind={1.2} />
        <CrateOnTundra f={f + p.from} spin={spin} lift={lift} squash={squash} tagSpin={(f + p.from) / 26} dust={dust} />
        {f > t2 + 4 && f < t2 + 12 && <ImpactStar cx={700} cy={1318} r={44} color="#FFFFFF" rot={8} />}
      </SVG>
    </Frame>
  );
};

// ---- S2: pull back to the map (beats 3 to 5) ------------------------------------------------------------------------
const Silhouette: React.FC<{x: number; y: number; scale?: number; f: number}> = ({x, y, scale = 1, f}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={0} rx={190} ry={14} opacity={0.35} />
    <rect x={-170} y={-70} width={340} height={70} rx={6} fill="#7B5B3A" stroke={INK} strokeWidth={6} />
    <path d={`M -64 -70 Q -64 -190 0 -190 Q 64 -190 64 -70 Z`} fill="#1B2638" stroke={INK} strokeWidth={5} />
    <circle cx={0} cy={-228 + 2 * Math.sin(f / 20)} r={42} fill="#1B2638" stroke={INK} strokeWidth={5} />
    <path d="M 120 -70 L 120 -190 L 180 -240" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
    <ellipse cx={186} cy={-248} rx={34} ry={16} fill="#F6D9A0" stroke={INK} strokeWidth={5} />
    <path d="M 160 -240 L 120 -150 L 230 -150 L 212 -240 Z" fill="#F6D9A0" opacity={0.18} />
  </g>
);

const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rise = easeIO(f, 0, 44);
  const cardY = lerp(2020, 900, rise);
  const crateS = lerp(1.35, 0.3, rise);
  const crateX = lerp(540, 260, rise);
  const crateY = lerp(1330, 1038, rise);
  const line = ease(f, b(5), 70);
  const pinPulse = 1 + 0.18 * Math.sin(f / 7);
  return (
    <Frame p={p} z0={1.0} z1={1.04} night={0} bloom={0.06}
      overlay={<>
        <Plate text="PER ANCHORAGE DAILY NEWS" y={520} size={28} tone="paper" p={ease(f, b(3) + 10, 10)} />
        <Plate text="MIKE JONES · UAA" x={790} y={1210} size={26} tone="paper" p={ease(f, b(4), 10)} />
        <Plate text="A DRONE DELIVERY PLAN" y={1290} size={26} tone="kraft" p={ease(f, b(5) + 10, 10)} />
      </>}>
      <SVG>
        <DawnTundra f={f + p.from} wind={0.6} ground={lerp(1330, 1500, rise)} dust={false} />
        <g transform={`translate(540,${cardY})`}>
          <rect x={-440} y={-410} width={900} height={780} fill="#000" opacity={0.3} transform="translate(12,16)" />
          <rect x={-450} y={-420} width={900} height={780} rx={18} fill={PAL.paper} stroke={INK} strokeWidth={9} />
          <rect x={-432} y={-402} width={864} height={744} rx={10} fill="#DDEAF1" stroke={INK} strokeWidth={3} />
          {Array.from({length: 9}, (_, i) => <path key={i} d={`M -432 ${-380 + i * 84} L 432 ${-380 + i * 84}`} stroke="#fff" strokeWidth={3} opacity={0.6} />)}
        </g>
        <g transform={`translate(0,${cardY - 900})`}>
          <AlaskaMini frame={f} x={170} y={640} scale={2.1} pin={false} />
          {/* the village pin and the dotted plan */}
          <path d={`M 262 1038 Q 460 790 740 ${860}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" strokeDasharray="2 26" opacity={line > 0.02 ? 0.45 : 0} />
          <path d={`M 262 1038 Q 460 790 ${262 + 478 * line} ${1038 - 178 * line + 140 * Math.sin(Math.PI * line) * 0}`} fill="none" stroke={PAL.red} strokeWidth={9} strokeLinecap="round" strokeDasharray="2 24" opacity={line > 0.02 ? 1 : 0} pathLength={1} />
          <g transform={`translate(740,860) scale(${pinPulse})`}>
            <circle cx={0} cy={-44} r={22} fill={PAL.red} stroke={INK} strokeWidth={6} />
            <path d="M -14 -30 L 0 0 L 14 -30 Z" fill={PAL.red} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <circle cx={0} cy={-44} r={8} fill={PAL.paper} />
          </g>
          <Silhouette x={790} y={1260} f={f} scale={0.8} />
        </g>
        <g>
          <Rotors x={crateX} y={crateY} scale={crateS} f={f + p.from} spin={0} fold={rise} />
          <FlightCrate x={crateX} y={crateY} f={f + p.from} scale={crateS} proposed={false} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S3: blades become tags, the quote, the smudged tag (beats 6 to 8) --------------------------------------------------------
const StoreWall: React.FC<{f: number; lamp?: number}> = ({f, lamp = 1}) => (
  <g>
    <defs>
      <linearGradient id="sw-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E8D3A6" /><stop offset="1" stopColor="#D2B885" /></linearGradient>
      <radialGradient id="sw-lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFE9B8" stopOpacity="0.85" /><stop offset="1" stopColor="#FFE9B8" stopOpacity="0" /></radialGradient>
    </defs>
    <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="url(#sw-wall)" />
    {Array.from({length: 14}, (_, i) => <rect key={i} x={i * 84 - 20} y={-20} width={4} height={1300} fill="#B89C69" opacity={0.28} />)}
    <rect data-band="ok" x={-20} y={1180} width={1120} height={760} fill="#6B4B2E" stroke={INK} strokeWidth={5} />
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M -20 ${1230 + i * 80} L 1100 ${1230 + i * 80}`} stroke="#4F351F" strokeWidth={4} opacity={0.5} />)}
    <ellipse cx={540 + 30 * Math.sin(f / 60)} cy={380} rx={640} ry={420} fill="url(#sw-lamp)" opacity={lamp} />
    <path d="M 540 -20 L 540 150" stroke={INK} strokeWidth={6} />
    <path d="M 440 220 L 480 150 L 600 150 L 640 220 Z" fill={PAL.spruce} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

const BLADES = [{x: 330, sx: 300, t: 0}, {x: 470, sx: 480, t: 10}, {x: 610, sx: 640, t: 18}, {x: 760, sx: 800, t: 6}];
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t6 = b(6), t7 = b(7), t8 = b(8);
  const flip = easeIO(f, t8, 26);
  const tagIn = ease(f, t8 - 30, 34);
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0} bloom={0.05}
      overlay={<>
        <Plate text="WHERE IS IT HEADED?" y={520} size={30} tone="kraft" p={ease(f, t6 + 80, 10) * (f < t7 + 20 ? 1 : 0)} />
        <QuotePlate text={'"SIGNIFICANTLY MORE THAN THAT" · MIKE JONES'} y={1240} size={32} wrap={40} p={ease(f, t7 + 4, 14)} />
      </>}>
      <SVG>
        <StoreWall f={f + p.from} />
        <GroceryShelf x={540} y={1185} f={f + p.from} scale={0.9} mess={1} seed={4} />
        {BLADES.map((bl, i) => {
          const k = clamp01((f - t6 - bl.t) / 70);
          const fall = easeIn(f, t6 + bl.t, 70);
          const bx = bl.sx + (bl.x - bl.sx) + 40 * Math.sin(k * 9 + i) * (1 - k);
          const by = lerp(-60, 770, fall);
          const rot = 80 * Math.sin(k * 7 + i) * (1 - k) + (k > 0.95 ? (i % 2 ? 9 : -8) : 0);
          const asTag = clamp01((k - 0.45) / 0.2);
          return (
            <g key={i} transform={`translate(${bx},${by}) rotate(${rot})`}>
              <g opacity={1 - asTag}><rect x={-6} y={-60} width={12} height={120} rx={5} fill={PAL.paper} stroke={INK} strokeWidth={4} /><circle cy={0} r={9} fill={PAL.brass} stroke={INK} strokeWidth={3} /></g>
              <g opacity={asTag}><KraftTag x={0} y={-34} f={f + i * 5} scale={0.34} front="smudge" stringLen={14} /></g>
            </g>
          );
        })}
        <g opacity={tagIn > 0.01 ? 1 : 0}>
          <KraftTag x={540} y={lerp(-300, 470, tagIn)} f={f + p.from} scale={0.78} flip={flip} front="blank" back="smudge" swing={4 * Math.sin(f / 7) * (1 - tagIn)} destDots={0} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S4: the shelf and the code (beats 9 to 12) --------------------------------------------------------------------------------
const CodeBackdrop: React.FC<{f: number}> = ({f}) => (
  <g>
    <defs>
      <linearGradient id="cb-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#12302B" /><stop offset="1" stopColor="#0B1B1A" /></linearGradient>
    </defs>
    <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="url(#cb-bg)" />
    {Array.from({length: 28}, (_, i) => <path key={i} d={`M -20 ${i * 70 + ((f * 0.6) % 70)} L 1100 ${i * 70 + ((f * 0.6) % 70)}`} stroke={PAL.mint} strokeWidth={1.5} opacity={0.06} />)}
    {Array.from({length: 16}, (_, i) => <path key={i} d={`M ${i * 72} -20 L ${i * 72} 1940`} stroke={PAL.mint} strokeWidth={1.5} opacity={0.05} />)}
    <rect data-band="ok" x={-20} y={1190} width={1120} height={760} fill="#10201F" stroke={INK} strokeWidth={5} />
  </g>
);

const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t9 = b(9), t10 = b(10), t11 = b(11), t12 = b(12);
  const slide = easeIO(f, t9, 26);
  const printDur = Math.max(60, (t12 - t11) * 1.15);
  const printP = ease(f, t11, printDur);
  const comb = clamp01((f - (t11 + 6)) / Math.max(50, printDur * 0.9));
  const snap = clamp01(comb * 1.2 - 0.1);
  const mess = f < t11 ? 1 : 1 - snap;
  const wig = f > t10 && f < t11 ? 1 : 0;
  const tagIn = ease(f, t12 - 4, 26);
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0} bloom={0.05}
      overlay={<>
        <Plate text="RURAL ALASKA GROCERY PRICES" y={540} size={26} tone="paper" p={ease(f, t9 + 12, 10) * (f < t11 ? 1 : 0)} />
        <Plate text="UNCLEANED PRICE DATA" x={300} y={1175} size={24} tone="kraft" p={ease(f, t10 + 4, 10) * (f < t11 + 10 ? 1 : 0)} />
        <Plate text="AI-WRITTEN CODE · CLEANED THE PRICE DATA" displayLines={['AI-WRITTEN CODE ·', 'CLEANED THE PRICE DATA']} y={560} size={28} tone="mint" p={ease(f, t11 + 4, 10)} />
        <Plate text="CODE WRITTEN BY AI" x={540} y={1250} size={26} tone="mint" p={ease(f, t12 + 14, 10)} />
      </>}>
      <SVG>
        <CodeBackdrop f={f + p.from} />
        <g transform={`translate(${-440 * (1 - slide)},0)`}>
          <GroceryShelf x={285} y={1160} f={f + p.from} scale={0.66} w={760} h={640} mess={mess} snap={0} seed={7} />
        </g>
        {wig > 0 && <ellipse cx={230} cy={880} rx={120} ry={74} fill="none" stroke={PAL.red} strokeWidth={6} strokeDasharray="14 10" opacity={0.9} />}
        {/* the comb ray that sweeps the shelf while the code prints */}
        {comb > 0.01 && comb < 0.99 && <rect x={20} y={1160 - 640 * 0.66 + comb * 640 * 0.66 - 8} width={520} height={16} fill={PAL.mint} opacity={0.55} />}
        <g transform={`translate(${460 * (1 - slide)},0)`}>
          <CodeSheet x={790} y={780} f={f + p.from} w={400} h={640} progress={printP} comb={comb} scale={1} />
        </g>
        <path d="M 40 1190 L 1040 1190" stroke={PAL.steelHi} strokeWidth={10} strokeLinecap="round" />
        <path d="M 40 1190 L 1040 1190" stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        <g opacity={tagIn > 0.01 ? 1 : 0}>
          <KraftTag x={540} y={lerp(900, 1196, tagIn)} f={f + p.from} scale={0.6} front="ruled" tick={0} swing={5 * Math.sin(f / 6) * (1 - tagIn)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S5: hours by hand, and the pen (beats 13 to 15) -------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t13 = b(13), t14 = b(14), t15 = b(15);
  const stackH = lerp(80, 560, ease(f, t13, 110));
  const botIn = easeIO(f, t14 - 6, 30);
  const reject = ease(f, t14 + 26, 18);
  const botX = lerp(1250, 880, botIn);
  const penIn = easeIO(f, t14 + 8, 40);
  const penHover = 8 * Math.sin(f / 9);
  const penY = lerp(300, 880, penIn) + (f > t15 ? penHover : 0);
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0} bloom={0.05}
      overlay={<>
        <Plate text="QUEBEC · HUNDREDS OF HOURS BY HAND · PER ADN" displayLines={['QUEBEC · HUNDREDS OF HOURS', 'BY HAND · PER ADN']} x={285} y={560} size={21} tone="kraft" p={ease(f, t13 + 10, 10)} />
        <Plate text="JONES SAYS IT STILL NEEDS HUMAN OVERSIGHT" displayLines={['JONES SAYS IT STILL', 'NEEDS HUMAN OVERSIGHT']} x={800} y={560} size={21} tone="paper" p={ease(f, t14 + 8, 10)} />
        <Plate text="CHECKED BY" x={800} y={1240} size={24} tone="red" p={ease(f, t15 + 4, 10)} />
      </>}>
      <SVG>
        <g>
          <rect data-band="ok" x={-20} y={-20} width={560} height={1960} fill="#CDB892" />
          <rect data-band="ok" x={540} y={-20} width={560} height={1960} fill="#DCE8EE" />
          <rect data-band="ok" x={-20} y={1200} width={560} height={740} fill="#7B5B3A" stroke={INK} strokeWidth={5} />
          <rect data-band="ok" x={540} y={1200} width={560} height={740} fill="#8DA2B2" stroke={INK} strokeWidth={5} />
          <ellipse cx={270} cy={520} rx={330} ry={300} fill="#FFE9B8" opacity={0.35} />
        </g>
        {/* left: the Quebec desk */}
        <DriftStack x={250} y={1210} f={f + p.from} h={stackH} w={300} seed={3} />
        <TallyCounter x={80} y={1090} s={0.9} f={f + p.from} count="0001" spin={1} roll={0} />
        <g transform="translate(440,0)"><Silhouette x={0} y={1236} f={f + p.from} scale={0.55} /></g>
        {/* right: the pen and the stamp robot */}
        <CodeSheet x={800} y={900} f={f + p.from} w={360} h={470} progress={1} scale={1} />
        <g opacity={botIn > 0.01 ? 1 : 0}><StampBot f={f + p.from} x={botX} y={1070} reject={reject} /></g>
        <g opacity={penIn > 0.01 ? 1 : 0}><ReviewPen x={730} y={penY} f={f + p.from} color={PAL.red} grip={1} angle={22} scale={1.1} /></g>
        {/* the seam */}
        <path d="M 540 -20 L 540 1940" stroke={INK} strokeWidth={10} />
        <path d="M 534 -20 L 534 1940" stroke="#fff" strokeWidth={3} opacity={0.5} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the starting price (beats 16 to 18) ----------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t16 = b(16), t17 = b(17), t18 = b(18);
  const weights = easeIO(f, t17, 40);
  const steelX = lerp(540, 250, easeIO(f, t18 - 10, 30));
  const tagIn = ease(f, t18 - 4, 34);
  const flip = easeIO(f, t18 + 14, 26);
  const beamIn = ease(f, t16, 30);
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0} bloom={0.05}
      overlay={<>
        <Plate text="ANCHORAGE FOOD PRICES" y={540} size={28} tone="steel" p={ease(f, t16 + 12, 10) * (f < t18 ? 1 : 0)} />
        <Plate text="ANCHORAGE PRICES PLUS ZONE ADJUSTMENT · 7 CFR 273.10" displayLines={['ANCHORAGE PRICES PLUS', 'ZONE ADJUSTMENT · 7 CFR 273.10']} y={1250} size={24} tone="steel" p={ease(f, t17 + 6, 10)} />
        <Plate text="ADN CALLS IT A 40-YEAR-OLD FORMULA" y={540} size={26} tone="paper" p={ease(f, t18 + 22, 10)} />
      </>}>
      <SVG>
        <AnchorageSkylineBG f={f + p.from} season="summer" denali={false} floatplane={false} />
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill={PAL.steel} opacity={0.1} />
        <g opacity={beamIn}>
          <ZoneBeam x={540} y={620 + 30 * (1 - beamIn)} f={f + p.from} scale={0.95} weights={weights} />
        </g>
        <g opacity={beamIn}>
          <SteelTag x={steelX} y={720} f={f + p.from} scale={0.85} text="ANCHORAGE" />
        </g>
        <g opacity={tagIn > 0.01 ? 1 : 0}>
          <KraftTag x={620} y={lerp(-300, 560, tagIn)} f={f + p.from} scale={0.82} flip={flip} front="measured" back="rule" backLabel2="ADN CALLS IT A 40-YEAR-OLD FORMULA" swing={5 * Math.sin(f / 6) * (1 - tagIn)} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S7: the case for the old way (beats 19 to 21) ----------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t19 = b(19), t20 = b(20), t21 = b(21);
  const lamp = clamp01((f - t19) / 120);
  const triPhase = Math.abs((((Math.max(0, f - t19 - 10) / 110) % 2) + 2) % 2 - 1);
  const lampX = lerp(-330, 330, triPhase);
  const gust = ease(f, t21, 24);
  const flyT = clamp01((f - (t21 + 20)) / 70);
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0} bloom={0.04}
      overlay={<>
        <Plate text="STEADY · AUDITABLE" x={290} y={560} size={26} tone="steel" p={ease(f, t19 + 14, 10)} />
        <Plate text="ONE CITY PRICE PLUS FIXED ZONES" displayLines={['ONE CITY PRICE PLUS', 'FIXED ZONES']} x={290} y={1245} size={22} tone="steel" p={ease(f, t20 + 6, 10)} />
        <Plate text="RURAL PRICES ARE NOISY" displayLines={['RURAL PRICES', 'ARE NOISY']} x={800} y={560} size={26} tone="kraft" p={ease(f, t21 + 14, 10)} />
      </>}>
      <SVG>
        <defs><linearGradient id="s7-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B7C7D6" /><stop offset="1" stopColor="#E6EDF2" /></linearGradient></defs>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1100} fill="url(#s7-sky)" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={-30 + i * 170} y={780 - (i * 53 % 90)} width={150} height={260 + (i * 53 % 90)} fill="#9DB0C2" stroke={INK} strokeWidth={3} opacity={0.7} />)}
        <rect data-band="ok" x={-20} y={1040} width={1120} height={900} fill={PAL.snow} stroke={INK} strokeWidth={4} />
        <path d={`M -20 1060 Q 300 1020 560 1050 T 1100 1040`} fill="none" stroke={PAL.snowShade} strokeWidth={8} />
        {/* left: the steady beam */}
        <g transform="translate(0,0)">
          <ZoneBeam x={290} y={680} f={f + p.from} scale={0.64} weights={1} w={820} />
          <SteelTag x={290} y={760} f={f + p.from} scale={0.6} text="ANCHORAGE" />
          <g transform={`translate(${290 + lampX * 0.64},${680 + 14})`} opacity={lamp}>
            <polygon points="-34,0 34,0 120,200 -120,200" fill="#FFE9B8" opacity={0.28} />
            <circle r={22} fill={PAL.brass} stroke={INK} strokeWidth={5} />
            <circle r={9} fill="#FFF3D0" />
          </g>
          <rect x={44} y={1060} width={500} height={120} fill={PAL.snowShade} opacity={0.5} />
        </g>
        {/* the fence between them */}
        {Array.from({length: 7}, (_, i) => <rect key={i} x={535 + (i % 2) * 6} y={940 + i * 40} width={14} height={110} fill="#8F6B36" stroke={INK} strokeWidth={3} transform={`rotate(${(i - 3) * 1.2} 542 ${995 + i * 40})`} />)}
        {/* right: the gust of rural tags and the raven */}
        <g opacity={0.35 + 0.65 * gust}>
          <RuralSwirl f={f + p.from} cx={800} cy={930} n={9} r={210} gust={1} scale={0.4} skip={4} />
        </g>
        {f > t21 + 12 && (() => {
          const rx = lerp(1180, 380, flyT);
          const ry = lerp(560, 760, flyT) - 140 * Math.sin(Math.PI * flyT);
          return (
            <g>
              <Raven x={rx} y={ry} f={f} scale={1.1} facing={-1} mode="fly" />
              {flyT > 0.45 && <KraftTag x={rx - 90} y={ry + 40} f={f + 17} scale={0.3} front="smudge" stringLen={10} swing={20 * Math.sin(f / 3)} />}
            </g>
          );
        })()}
        <g opacity={0.7}>
          {Array.from({length: 46}, (_, i) => {
            const sx = 560 + (((rnd(i + 3) * 700 + f * (9 + rnd(i) * 9)) % 700));
            const sy = 460 + rnd(i + 11) * 780;
            return <path key={i} d={`M ${sx} ${sy} l ${50 + rnd(i + 7) * 60} ${6 + rnd(i) * 9}`} stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.6} />;
          })}
        </g>
        <Snowfall f={f + p.from} n={40} />
      </SVG>
    </Frame>
  );
};

// ---- S8: not published yet (beats 22 and 23) ---------------------------------------------------------------------------------------------------
const BenchBackdrop: React.FC<{f: number; pool?: number}> = ({f, pool = 1}) => (
  <g>
    <defs>
      <linearGradient id="bb-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1E1710" /><stop offset="1" stopColor="#3A2A1B" /></linearGradient>
      <radialGradient id="bb-pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFE2A8" stopOpacity="0.9" /><stop offset="0.6" stopColor="#F2B766" stopOpacity="0.3" /><stop offset="1" stopColor="#F2B766" stopOpacity="0" /></radialGradient>
    </defs>
    <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="url(#bb-bg)" />
    <ellipse cx={540 + 24 * Math.sin(f / 45)} cy={900} rx={720} ry={760} fill="url(#bb-pool)" opacity={pool} />
    <rect data-band="ok" x={-20} y={1190} width={1120} height={750} fill="#7B5B3A" stroke={INK} strokeWidth={5} />
    {Array.from({length: 8}, (_, i) => <path key={i} d={`M -20 ${1240 + i * 90} L 1100 ${1240 + i * 90}`} stroke="#4F351F" strokeWidth={4} opacity={0.55} />)}
    <path d="M 540 -20 L 540 110" stroke={INK} strokeWidth={6} />
    <path d="M 430 190 L 470 110 L 610 110 L 650 190 Z" fill={PAL.goldDeep} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t22 = b(22), t23 = b(23);
  const slam = easeIn(f, t22 - 22, 22);
  const lift = easeIO(f, t22 + 12, 26);
  const stamp = ease(f, t22, 12);
  const sy = lerp(-260, 700, slam) - 700 * lift * (f > t22 ? 1 : 0) * 0.45;
  const sx = 540;
  const press = f >= t22 - 2 && f < t22 + 14 ? 1 : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.07} night={0} bloom={0.06}
      overlay={<>
        <Plate text="ONE OUTLET · ANCHORAGE DAILY NEWS" displayLines={['ONE OUTLET ·', 'ANCHORAGE DAILY NEWS']} y={540} size={28} tone="paper" p={ease(f, t23 + 4, 10)} />
      </>}>
      <SVG>
        <BenchBackdrop f={f + p.from} />
        <KraftTag x={540} y={640} f={f + p.from} scale={1.55} front="stamped" stamp={stamp} frontLabel="NOT PUBLISHED YET" tick={0} swing={press ? 3 * Math.sin(f * 2.4) : 0} />
        <g transform={`translate(${sx},${sy})`}>
          <rect x={-70} y={-260} width={140} height={190} rx={22} fill="#9B6A3E" stroke={INK} strokeWidth={7} />
          <rect x={-90} y={-80} width={180} height={34} rx={6} fill="#6C6F76" stroke={INK} strokeWidth={7} />
          <rect x={-100} y={-48} width={200} height={26} rx={4} fill={PAL.red} stroke={INK} strokeWidth={6} />
          <rect x={-60} y={-250} width={20} height={150} rx={8} fill="#fff" opacity={0.18} />
        </g>
        {f > t22 && f < t22 + 12 && <ImpactStar cx={540} cy={920} r={70} color="#FFFFFF" rot={14} />}
        {Array.from({length: 22}, (_, i) => <circle key={i} cx={(rnd(i + 3) * 1200 + f * (0.4 + rnd(i) * 0.8)) % 1100} cy={300 + rnd(i + 9) * 900 - ((f * (0.3 + rnd(i + 2) * 0.6)) % 90)} r={1.5 + rnd(i + 5) * 2.5} fill="#FFE9B8" opacity={0.3 + 0.4 * rnd(i + 7)} />)}
      </SVG>
    </Frame>
  );
};

// ---- S9: a hope, not a decision (beats 24 to 26) ----------------------------------------------------------------------------------------------------
const MapTable: React.FC<{f: number}> = ({f}) => (
  <g>
    <defs><linearGradient id="mt-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#223552" /><stop offset="1" stopColor="#16253B" /></linearGradient></defs>
    <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="url(#mt-bg)" />
    {Array.from({length: 14}, (_, i) => <path key={i} d={`M -20 ${60 + i * 140} Q 540 ${40 + i * 140 + 14 * Math.sin(f / 60 + i)} 1100 ${60 + i * 140}`} stroke={PAL.glacier} strokeWidth={2} opacity={0.14} fill="none" />)}
    {Array.from({length: 8}, (_, i) => <path key={i} d={`M ${i * 160} -20 Q ${i * 160 + 30} 960 ${i * 160 - 20} 1940`} stroke={PAL.glacier} strokeWidth={2} opacity={0.1} fill="none" />)}
  </g>
);

const Envelope2: React.FC<{x: number; y: number; scale?: number; f: number}> = ({x, y, scale = 1, f}) => (
  <g transform={`translate(${x},${y + 3 * Math.sin(f / 18)}) scale(${scale})`}>
    <ContactShadow cx={0} cy={84} rx={140} ry={12} opacity={0.4} />
    <rect x={-130} y={-80} width={260} height={160} rx={8} fill={PAL.paper} stroke={INK} strokeWidth={7} />
    <path d="M -130 -80 L 0 20 L 130 -80" fill="#E4D9BC" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={0} cy={20} r={20} fill={PAL.green} stroke={INK} strokeWidth={5} />
    <text x={0} y={30} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={22} fill={PAL.paper}>?</text>
  </g>
);

const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t24 = b(24), t25 = b(25), t26 = b(26);
  const gateIn = easeIO(f, t24, 36);
  const drift = easeIO(f, t25, 60);
  const tagX = lerp(170, 520, drift);
  const flip = easeIO(f, t26, 26);
  const dest = ease(f, t26 + 14, 40);
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0} bloom={0.05}
      overlay={<>
        <Plate text="HOPED TO INFORM USDA · SNAP RATES IN ALASKA" displayLines={['HOPED TO INFORM USDA ·', 'SNAP RATES IN ALASKA']} y={560} size={26} tone="green" p={ease(f, t24 + 14, 10) * (f < t26 ? 1 : 0)} />
        <Plate text="A HOPE" x={380} y={1130} size={30} tone="paper" p={ease(f, t25 + 50, 10) * (f < t26 ? 1 : 0)} />
        <Plate text="HOPED · NOT A DECISION" displayLines={['HOPED ·', 'NOT A DECISION']} y={560} size={30} tone="paper" p={ease(f, t26 + 20, 10)} />
      </>}>
      <SVG>
        <MapTable f={f + p.from} />
        <AlaskaMini frame={f + p.from} x={20} y={640} scale={2.4} pin={false} />
        <UsdaGate x={850} y={1290} f={f + p.from} scale={0.78} rise={gateIn} />
        <Envelope2 x={640} y={1250} scale={0.55} f={f + p.from} />
        <KraftTag x={tagX} y={820} f={f + p.from} scale={0.9} flip={flip} front="measured" back="blank" destDots={dest} swing={4 * Math.sin(f / 7)} />
        {Array.from({length: 4}, (_, i) => <circle key={i} cx={tagX + 150 + i * 36} cy={1010} r={5} fill={PAL.glacier} opacity={drift > 0.05 && drift < 0.98 ? 0.7 - i * 0.15 : 0} />)}
      </SVG>
    </Frame>
  );
};

// ---- S10: different evidence (beats 27 to 30) -------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t27 = b(27), t28 = b(28), t29 = b(29), t30 = b(30);
  const tagsIn = ease(f, t27, 34);
  const open = easeIO(f, t28, 40);
  const penIn = easeIO(f, t29 - 30, 32);
  const tick = ease(f, t29 + 10, 24);
  const penX = lerp(900, 166, penIn);
  const penY = lerp(420, 780, penIn);
  const nudge = tick > 0 && tick < 1 ? 5 * Math.sin(f * 1.6) : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.06} night={0} bloom={0.06}
      overlay={<>
        <Plate text="SHELF PRICE · ANCHORAGE PRICE PLUS ZONE" displayLines={['SHELF PRICE · ANCHORAGE', 'PRICE PLUS ZONE']} y={1180} size={26} tone="paper" p={ease(f, t27 + 20, 10)} />
        <Plate text="NOBODY HAS PUBLISHED THE DISTANCE" displayLines={['NOBODY HAS PUBLISHED', 'THE DISTANCE']} y={560} size={26} tone="ink" p={ease(f, t28 + 24, 10) * (f < t30 ? 1 : 0)} />
        <Plate text="CHECKED BY A PERSON" x={290} y={1000} size={24} tone="red" p={ease(f, t29 + 30, 10) * (f < t30 ? 1 : 0)} />
        <Plate text="WAITS ON PUBLICATION AND USDA" displayLines={['WAITS ON PUBLICATION', 'AND USDA']} y={560} size={28} tone="paper" p={ease(f, t30 + 4, 10)} />
      </>}>
      <SVG>
        <BenchBackdrop f={f + p.from} pool={0.9} />
        <path d="M 40 520 L 1040 520" stroke={PAL.steelHi} strokeWidth={10} strokeLinecap="round" />
        <path d="M 40 520 L 1040 520" stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        <g opacity={tagsIn > 0.01 ? 1 : 0} transform={`translate(0,${-40 * (1 - tagsIn)})`}>
          <KraftTag x={290} y={540} f={f + p.from} scale={0.95} front="measured" tick={tick} swing={nudge} />
          <SteelTag x={790} y={540} f={f + p.from} scale={1.0} text="ANCHORAGE + ZONE" />
        </g>
        <Calipers x={540} y={620} f={f + p.from} open={open} legLen={330} />
        <g opacity={open > 0.4 ? 1 : 0}>
          <rect x={460} y={1000} width={160} height={78} rx={10} fill={PAL.paper} stroke={INK} strokeWidth={6} />
          <text x={540} y={1058} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={40} letterSpacing={6} fill={INK} opacity={0.4 + 0.4 * Math.sin(f / 6)}>· · ?</text>
        </g>
        <g opacity={penIn > 0.01 ? 1 : 0}><ReviewPen x={penX} y={penY} f={f + p.from} color={PAL.red} grip={1} angle={22} scale={1.1} /></g>
      </SVG>
    </Frame>
  );
};

// ---- S11: the question, and the crate (beats 31 to 33) ----------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t32 = b(32), t33 = b(33);
  const twitch = f > t32 && f < t32 + 18 ? 0.35 : 0;
  const rel = f - t33;
  const spinUp = rel > 0 ? ease(f, t33, 14) : twitch;
  const liftIn = ease(f, t33 + 6, 18);
  const lift = rel > 0 ? 78 * liftIn + 4 * Math.sin(f * 0.7) * liftIn : 0;
  return (
    <Frame p={p} zk={() => lerp(1.04, 1.0, easeIO(f, 0, p.dur))} night={0} bloom={0.08}
      overlay={<>
        <Plate text="WILL THEY MATCH ANCHORAGE PLUS A ZONE?" displayLines={['WILL THEY MATCH', 'ANCHORAGE PLUS A ZONE?']} y={570} size={32} tone="paper" p={ease(f, b(31) + 14, 10)} />
      </>}>
      <SVG>
        <DawnTundra f={f + p.from} wind={1.2} />
        <CrateOnTundra f={f + p.from} spin={spinUp} lift={lift} squash={0} tagSpin={(f + p.from) / 26} />
      </SVG>
    </Frame>
  );
};

// ---- placeholders: every shot gets a crude version first (the rough cut) ---------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p} night={0}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill="#243B5A" />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.paper}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);

const TITLES: Record<number, string> = {1: 'CRATE LIFTS', 2: 'PULL BACK', 3: 'BLADES TO TAGS', 4: 'SHELF AND CODE', 5: 'QUEBEC AND PEN', 6: 'THE BEAM', 7: 'THE CASE', 8: 'NOT PUBLISHED', 9: 'THE GATE', 10: 'THE CALIPERS', 11: 'THE QUESTION'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

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

export const ep1011Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1011Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1011: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 3, 13, 26, 37, 50, 64, 75, 81, 91, 103, 112].map((x) => Math.round(x * 30));
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
