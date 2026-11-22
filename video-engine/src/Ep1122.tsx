import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, ContactShadow, INK} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {MONO, monoW} from './lib/prospect';
import {HeldTravel} from './lib/heldidle';
import {Suit} from './lib/people';
import {Stamp} from './lib/kit';
import {AK_PATH} from './lib/akmap';
import {
  CAN, Nix, Microbe, Speck, RefuseLump, Flask, BenchDial, ScaleWall, Staircase, BenchWorld, TearCalendar, BlowPage,
  DataFeeder, Bassinet, BlockBar, GhostTank, Magnifier, Drum, ToyTurbine, GoalStool,
} from './lib/canary';
import {IDS} from './Ep1122Ids';

// The Bird That Says No, 2026-11-22. Palette roles are art_direction.json: honey-cream lamp on cold materials only, a pale aqua window
// deepening to deep teal, a rose-grey horizon, neutral grey ground, a lichen-chartreuse canary, lilac ONLY for rare-earth specks and a
// working flask, cobalt ONLY for the scale wall. Nix is a model and never mines: microbes do the work. Real people are faceless with
// boxed name tags. The DOE pilot is another building across a street and UAA's flask never enters it or its chart.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;

const C = {
  ink: INK, paper: '#FBF8F0', chalk: CAN.chalk, grey: '#4A4E52', greyL: '#8C9196', teal: '#24474F', aqua: '#9FB4C4', rose: '#B89A9A',
  lamp: CAN.lamp, loss: '#C8464A', lilac: CAN.lilac, cobalt: CAN.cobalt, felt: CAN.felt,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** visible window: fades in over 6 frames from a, out over 8 before z */
const win = (f: number, a: number, z = 1e9) => Math.min(clamp01((f - a) / 6), clamp01((z - f) / 8));

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'plate' | 'dark' | 'teal';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  dark: {fill: '#22262B', fg: '#FBF8F0', edge: '#FBF8F0'},
  teal: {fill: C.teal, fg: '#EEF0F2', edge: '#CFE0E4'},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'plate', p = 1, rot = 0}) => {
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

/** a small tag sized to its string, used on figures and props */
const Lab: React.FC<{text: string; x: number; y: number; size?: number; fill?: string; ink?: string; rot?: number}> = ({text, x, y, size = 22, fill = C.paper, ink = C.ink, rot = 0}) => {
  const w = monoW(text, size) + 24;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2} y={-size * 0.75 - 6} width={w} height={size * 1.5 + 4} rx={5} fill={fill} stroke={C.ink} strokeWidth={3} />
      <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} fill={ink}>{text}</text>
    </g>
  );
};

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; overlay?: React.ReactNode; bg?: string; warmth?: number; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.22, ox = 540, oy = 960, overlay, bg = C.grey, warmth = 0.02, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 12 * Math.sin(p.f / 110) + 8 * t, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: bg}} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#22262B" stroke="#FBF8F0" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#FBF8F0">{CHIP}</text>
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

/** a glass jar on the bench, origin at its base centre */
const Jar: React.FC<{x: number; y: number; s?: number; ring?: number}> = ({x, y, s = 1, ring = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={3} rx={70} ry={10} opacity={0.35} blur={7} />
    <path d="M-60,-150 L-60,-10 Q-60,0 -50,0 L50,0 Q60,0 60,-10 L60,-150 Z" fill={CAN.glass} opacity={0.35} />
    <path d="M-60,-150 L-60,-10 Q-60,0 -50,0 L50,0 Q60,0 60,-10 L60,-150" fill="none" stroke={C.ink} strokeWidth={5} />
    <ellipse cx={0} cy={-150} rx={60} ry={12} fill="none" stroke={C.ink} strokeWidth={4} />
    <path d="M-44,-130 L-44,-30" stroke="#fff" strokeWidth={6} opacity={0.45} strokeLinecap="round" />
    {ring > 0 && [0, 1].map((k) => <ellipse key={k} cx={0} cy={-80} rx={70 + ring * 60 + k * 20} ry={30 + ring * 20} fill="none" stroke="#fff" strokeWidth={3} opacity={(1 - ring) * 0.5} />)}
  </g>
);

/** the flask's neck tag, drawn after the flask at its neck */
const NeckTag: React.FC<{x: number; y: number; text?: string; s?: number; f: number}> = ({x, y, text = '', s = 1, f}) => {
  const w = Math.max(56, monoW(text, 18) + 20);
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${6 + 3 * Math.sin(f / 19)})`}>
      <path d="M0,0 L14,26" stroke={C.ink} strokeWidth={2.5} />
      <g transform="translate(14 26)">
        <rect x={-6} y={0} width={w} height={34} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} />
        <circle cx={2} cy={8} r={3} fill="none" stroke={C.ink} strokeWidth={2} />
        {text && <text x={w / 2 - 2} y={23} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>{text}</text>}
      </g>
    </g>
  );
};

// ---- S1 the jar (L0) -------------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b1 = p.b(1), b2 = p.b(2), b3 = p.b(3);
  const fall = clamp01((f - 2) / 8);
  const lumpY = lerp(700, 1218, fall * fall);
  const land = f >= 10 ? 1 : 0;
  const ring = clamp01((f - 10) / 18);
  const card = ease(f, b3 - 4, 14);
  const turn = card > 0.5 ? 0.5 + 0.5 * Math.sin((f - b3) / 9) : 0;
  const cam = track([{t: 0, z: 1.14, fx: 520, fy: 1060}, {t: p.dur, z: 1.22, fx: 540, fy: 1080}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="AN AI BUILT TO SAY NO · FAST" x={540} y={600} size={34} p={win(f, b1 + 4, b2 + 8)} />
        <Plate text="ONE JOB" x={540} y={600} size={36} tone="dark" p={win(f, b2 + 10, b3)} /> {/* plate-overlap-ok */}
        <Plate text="NO? · OK?" x={540} y={600} size={38} p={win(f, b3 + 6)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <BenchWorld f={f} seed={1} dusk={0.05}>
          <HeldTravel f={f} x={560} y={1020} w={200} h={230} mode="sweep" seed={11}>
            <Flask f={f} x={680} y={1240} s={0.95} fill={0} seed={1} bubbles={false} />
          </HeldTravel>
          <NeckTag x={700} y={1080} f={f} />
          <Jar x={400} y={1240} ring={land ? ring : 0} />
          <g transform={`translate(400 ${lumpY}) scale(${land ? 1 + 0.12 * Math.sin(clamp01((f - 10) / 8) * Math.PI) : 1} ${land ? 1 - 0.12 * Math.sin(clamp01((f - 10) / 8) * Math.PI) : 1})`}>
            <RefuseLump f={f} x={0} y={0} s={1.05} seed={3} />
          </g>
          <Nix f={f} x={560} y={1240} scale={1.25} snapAt={b2} look={f < b2 ? 0.2 : -0.8} card={card} flip={turn} cardText="NO" cardBack="OK" cues={[b1, b2, b3]} seed={2} mood="alert" />
        </BenchWorld>
      </SVG>
    </Frame>
  );
};

// ---- S2 not rare (L1-L2) ---------------------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b4 = p.b(4), b5 = p.b(5), b6 = p.b(6), b7 = p.b(7), b8 = p.b(8);
  const hop = clamp01((f - b4) / Math.max(1, b5 - b4));
  const stops = [[470, 1150], [600, 1170], [700, 1140]];
  const si = Math.min(2, Math.floor(hop * 3));
  const lift = easeIO(f, b6, 20) * (1 - easeIO(f, b7 + 6, 20));
  const mx = lerp(lerp(stops[si][0], stops[Math.min(2, si + 1)][0], clamp01(hop * 3 - si)), 640, lift);
  const my = lerp(stops[si][1], 700, lift) - 6 * Math.abs(Math.sin(hop * 9.4));
  const spin = Math.max(0, f - b7) * 14;
  const scatter = easeIO(f, b8, 30);
  const range = clamp01((f - b6) / 10) * (1 - clamp01((f - b7 - 20) / 14));
  const cam = track([{t: 0, z: 1.04, fx: 520, fy: 1000}, {t: b6, z: 1.05, fx: 560, fy: 920}, {t: b7 + 10, z: 1.06, fx: 600, fy: 980}, {t: p.dur, z: 1.08, fx: 560, fy: 1020}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="BRANDON BRIGGS · UAA BIOLOGIST" x={540} y={600} size={32} p={win(f, b4 + 4, b5)} />
        <Plate text={'"THE RARE EARTHS ARE NOT RARE" · BRIGGS'} x={540} y={600} size={30} tone="dark" p={win(f, b5 + 4, b6)} /> {/* plate-overlap-ok */}
        <Plate text="FOUND EVERYWHERE · PER BRIGGS" x={540} y={600} size={32} p={win(f, b6 + 4, b7)} /> {/* plate-overlap-ok */}
        <Plate text="MAGNETS · MOTORS · WIND TURBINES" x={540} y={600} size={32} tone="dark" p={win(f, b7 + 4, b8)} /> {/* plate-overlap-ok */}
        <Plate text="SPREAD THIN · HARD TO CONCENTRATE · PER BRIGGS" displayLines={['SPREAD THIN · HARD TO CONCENTRATE', 'PER BRIGGS']} x={540} y={610} size={30} p={win(f, b8 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <BenchWorld f={f} seed={2} dusk={0.08} behind={
          <Suit f={f} x={260} y={1560} s={1.55} seed={4} cues={[b4, b6, b8]} coat="#5B6168" reach={0.7 + 0.3 * lift} facing={1} />
        }>
          {/* specks across the range when the magnifier lifts */}
          {Array.from({length: 22}).map((_, i) => (
            <g key={i} opacity={range * (0.4 + 0.6 * h01(i, 3))}><Speck f={f} x={120 + h01(i, 1) * 860} y={560 + h01(i, 2) * 300} r={6} seed={i} glow={0.6} /></g>
          ))}
          {/* the rock tray */}
          <HeldTravel f={f} x={420} y={1120} w={340} h={130} mode="sweep" seed={21}>
            <g>
              <rect x={420} y={1196} width={340} height={44} rx={8} fill="#6B7076" stroke={C.ink} strokeWidth={5} />
              {Array.from({length: 7}).map((_, i) => (
                <g key={i}>
                  <path d={`M${450 + i * 44},1198 l-16,0 l6,-26 l20,-8 l14,14 Z`} fill={i % 2 ? '#5A5E64' : '#74787E'} stroke={C.ink} strokeWidth={3} />
                  <Speck f={f} x={448 + i * 44 + (scatter * (h01(i, 5) - 0.5) * 120)} y={1180 - scatter * h01(i, 7) * 40} r={4 + (1 - scatter)} seed={i + 2} glow={clamp01((f - b5) / 8) * 0.6} />
                </g>
              ))}
            </g>
          </HeldTravel>
          <ToyTurbine x={900} y={980} s={1.1} spin={spin} />
          <g transform="translate(820 980)">
            <rect x={-30} y={-40} width={60} height={40} rx={6} fill="#8C9196" stroke={C.ink} strokeWidth={3} />
            <circle cx={0} cy={-20} r={12} fill={C.lilac} stroke={C.ink} strokeWidth={3} transform={`rotate(${spin})`} />
          </g>
          {f > b7 && f < b7 + 40 && [0, 1, 2].map((k) => {
            const t = clamp01((f - b7 - k * 6) / 20);
            return <Speck key={k} f={f} x={lerp(620, 870, t)} y={lerp(1170, 960, t) - Math.sin(t * Math.PI) * 60} r={5} seed={k + 9} />;
          })}
          <Magnifier x={mx} y={my + 140} s={0.9} rot={-18 + 10 * lift} glint={clamp01((f - b5) / 8)} />
          <Nix f={f} x={860} y={1240} scale={1.0} look={-0.6} card={0} cues={[b5, b8]} seed={5} mood={f > b8 ? 'worried' : 'alert'} />
          {f > b5 && <Speck f={f} x={860 + 64} y={1240 - 108} r={4} seed={31} />}
        </BenchWorld>
      </SVG>
    </Frame>
  );
};

// ---- S3 two hundred steps (L3) -------------------------------------------------------------------------------------------------------------------
const Exterior: React.FC<{f: number; dusk?: number; seed?: number}> = ({f, dusk = 0, seed = 1}) => {
  const top = dusk > 0.5 ? C.teal : C.aqua;
  return (
    <g>
      <defs>
        <linearGradient id={`ext${seed}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={dusk > 0.5 ? C.rose : '#D9D2CC'} /></linearGradient>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2400} fill={`url(#ext${seed})`} />
      <path d={`M-200,900 L60,520 L220,640 L380,360 L540,560 L700,300 L860,520 L1000,420 L1280,760 L1280,2200 L-200,2200 Z`} fill={dusk > 0.5 ? '#3E5A60' : '#B7C3CB'} stroke={C.ink} strokeWidth={5} />
      <path d="M300,430 L380,360 L460,440 M640,360 L700,300 L760,370" fill="none" stroke={CAN.snow} strokeWidth={14} strokeLinecap="round" opacity={0.8} />
      <path d={`M-200,1200 L160,960 L420,1080 L700,900 L1000,1040 L1280,960 L1280,2200 L-200,2200 Z`} fill={dusk > 0.5 ? '#2E4A50' : '#7F949E'} stroke={C.ink} strokeWidth={4} />
      {Array.from({length: 18}).map((_, i) => {
        const tx = -60 + i * 70 + h01(seed, i) * 30, ty = 1150 + h01(seed + 2, i) * 70, th = 70 + h01(seed + 4, i) * 50;
        return <path key={i} d={`M${tx},${ty - th} L${tx + th * 0.28},${ty} L${tx - th * 0.28},${ty} Z`} fill={CAN.spruce} stroke={C.ink} strokeWidth={2.5} />;
      })}
      <rect x={-200} y={1300} width={1480} height={900} fill={dusk > 0.5 ? '#2A2D31' : '#5C6064'} />
      {Array.from({length: 8}).map((_, i) => <line key={i} x1={-200} x2={1280} y1={1340 + i * 80} y2={1340 + i * 80} stroke={C.ink} strokeWidth={2} opacity={0.25} />)}
      <circle cx={980 + 6 * Math.sin(f / 90)} cy={dusk > 0.5 ? 380 : 260} r={dusk > 0.5 ? 0 : 0} fill="#fff" />
    </g>
  );
};

const S3: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b9 = p.b(9), b10 = p.b(10), b11 = p.b(11);
  const rev = easeIO(f, b9, 40);
  const count = Math.round(lerp(0, 200, clamp01((f - b9) / Math.max(1, b11 - b9))));
  const sit = ease(f, b11, 14);
  const cam = track([{t: 0, z: 1.18, fx: 300, fy: 1240}, {t: b10, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 0.98, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam} bg={C.aqua} overlay={
      <g>
        <Plate text="TODAY'S ROUTE · PER BRIGGS" x={540} y={600} size={32} p={win(f, b9 + 6, b10)} />
        <Plate text="ACIDS · HEAT · SOLVENTS" x={540} y={600} size={34} tone="dark" p={win(f, b10 + 4, b11)} /> {/* plate-overlap-ok */}
        <Plate text="CAN TAKE 200 STEPS · PER BRIGGS" x={540} y={600} size={32} p={win(f, b11 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <Exterior f={f} seed={3} />
        <HeldTravel f={f} x={120} y={300} w={820} h={1080} mode="shadow" seed={31}>
          <Staircase f={f} x={140} y={1330} x2={880} y2={330} reveal={rev} steps={50} />
        </HeldTravel>
        <g transform={`translate(${lerp(170, 860, rev)} ${lerp(1310, 330, rev) - 40})`}>
          <rect x={-46} y={-26} width={92} height={40} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={3} />
          <text x={0} y={4} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>{count}</text>
        </g>
        <Drum f={f} x={200} y={1340} label="ACID" color="#7A8696" shake={clamp01((f - b10) / 6)} steam={clamp01((f - b10) / 10)} seed={1} />
        <Drum f={f} x={320} y={1340} label="HEAT" color="#8C7A80" shake={clamp01((f - b10 - 6) / 6)} steam={clamp01((f - b10 - 6) / 10)} seed={2} />
        <Drum f={f} x={440} y={1340} label="SOLVENT" color="#6E7E78" shake={clamp01((f - b10 - 12) / 6)} steam={clamp01((f - b10 - 12) / 10)} seed={3} />
        <g transform={`translate(0 ${sit * 30})`}>
          <Suit f={f} x={640} y={1310} s={0.9} seed={7} cues={[b10, b11]} coat="#C2873A" gain={1 - sit * 0.5} />
        </g>
        <g transform={`translate(720 ${1300 + sit * 10})`}>
          <path d="M0,0 L20,-120 M10,-60 L40,-60" stroke={C.ink} strokeWidth={6} fill="none" />
          <circle cx={-4} cy={6} r={12} fill="#22262B" stroke={C.ink} strokeWidth={3} />
          <Drum f={f} x={30} y={-4} s={0.55} label="ACID" seed={8} />
        </g>
        <path d="M650,1000 q14,-20 34,-6" fill="none" stroke={C.ink} strokeWidth={4} opacity={sit} />
      </SVG>
    </Frame>
  );
};

// ---- S4 the wall (L4-L5) ---------------------------------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b12 = p.b(12), b48 = p.b(48), b13 = p.b(13), b14 = p.b(14);
  const liftK = ease(f, b12, 20);
  const glow = ease(f, b48 + 6, 16);
  const wall = easeIO(f, b13, 70);
  const cam = track([{t: 0, z: 1.12, fx: 540, fy: 1060}, {t: b13, z: 1.06, fx: 540, fy: 1000}, {t: b13 + 70, z: 0.96, fx: 540, fy: 900}, {t: p.dur, z: 0.95, fx: 540, fy: 900}]);
  const crumbT = clamp01((f - b48) / 12);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="WORKED BEFORE · IN THE LAB" x={540} y={600} size={34} p={win(f, b48 + 6, b13)} />
        <Plate text="NOT YET SCALED · NOT YET VIABLE" x={540} y={600} size={32} tone="dark" p={win(f, b13 + 6, b14)} /> {/* plate-overlap-ok */}
        <Plate text="THE WALL" x={540} y={600} size={40} p={win(f, b14 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <BenchWorld f={f} seed={4} dusk={0.12} wallUp={wall}>
          <Jar x={260} y={1240} s={0.8} />
          <RefuseLump f={f} x={260} y={1232} s={0.7} seed={3} />
          {crumbT > 0 && crumbT < 1 && <circle cx={lerp(300, 540, crumbT)} cy={lerp(1150, 960, crumbT) - Math.sin(crumbT * Math.PI) * 80} r={8} fill={CAN.soot} stroke={C.ink} strokeWidth={2} />}
          <g transform={`translate(0 ${-liftK * 140})`}>
            <HeldTravel f={f} x={430} y={880} w={220} h={250} mode="sweep" seed={41}>
              <Flask f={f} x={540} y={1120} s={1.1} fill={0.25 + glow * 0.5} glow={glow} seed={4} />
            </HeldTravel>
            {[0, 1, 2, 3, 4].map((i) => (
              <Microbe key={i} f={f} x={430 + i * 55} y={1150 + (i % 2) * 14} scale={1.0} seed={i + 1} rot={(i % 2 ? -14 : 14)} mood="proud" cues={[b12, b48]} />
            ))}
          </g>
          <Nix f={f} x={850} y={1240} scale={1.05} look={wall > 0.3 ? -0.2 : -0.6} snapAt={b13 + 8} card={1 - ease(f, b14, 12) * 0.6} cardText="NO" cues={[b13, b14]} seed={6} mood={f > b14 ? 'worried' : 'alert'} />
        </BenchWorld>
      </SVG>
    </Frame>
  );
};

// ---- S5 four pins (L6) ---------------------------------------------------------------------------------------------------------------------------------
const OUTLINE48 = 'M 40 120 L 120 70 L 300 60 L 470 80 L 600 70 L 700 100 L 790 60 L 860 90 L 880 160 L 830 230 L 840 300 L 780 360 L 760 430 L 700 410 L 640 450 L 560 430 L 480 470 L 430 510 L 380 450 L 280 440 L 200 400 L 120 380 L 60 320 L 30 240 Z';
const S5: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b15 = p.b(15), b16 = p.b(16), b17 = p.b(17);
  const slide = ease(f, b15, 18);
  const pins = [{x: 300, y: 860, l: 'UAA'}, {x: 330, y: 760, l: 'UAF'}, {x: 690, y: 1110, l: 'MONTANA TECH'}, {x: 770, y: 1170, l: 'WYOMING'}];
  const line = easeIO(f, b15 + 30, 30);
  const stamp = clamp01((f - b16) / 6);
  const tag = ease(f, b17, 14);
  const cam = track([{t: 0, z: 1.02, fx: 540, fy: 980}, {t: p.dur, z: 1.08, fx: 540, fy: 980}]);
  return (
    <Frame p={p} cam={cam} bg="#3C3F43" overlay={
      <g>
        <Plate text="UAA · UAF · MONTANA TECH · WYOMING" x={540} y={600} size={30} p={win(f, b15 + 10, b16)} />
        <Plate text="NSF · $6M · WHOLE PROJECT" x={540} y={600} size={34} tone="dark" p={win(f, b16 + 4, b17 + 6)} /> {/* plate-overlap-ok */}
        <Plate text="LED BY BRIGGS, UAA" x={540} y={600} size={34} p={win(f, b17 + 8)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2400} fill="#3C3F43" />
        {Array.from({length: 14}).map((_, i) => <path key={i} d={`M -200 ${100 + i * 140} L 1280 ${110 + i * 140}`} stroke="#33363A" strokeWidth={4} opacity={0.6} />)}
        <g transform={`translate(${(1 - slide) * 900} 0)`}>
          <HeldTravel f={f} x={80} y={640} w={920} h={680} mode="shadow" seed={51}>
            <g>
              <rect x={80} y={640} width={920} height={680} rx={10} fill={C.chalk} stroke={C.ink} strokeWidth={7} />
              <rect x={96} y={656} width={888} height={648} rx={6} fill={C.greyL} />
              <g transform="translate(110,700) scale(0.5)"><path d={AK_PATH} fill={C.chalk} stroke={C.ink} strokeWidth={10} /></g>
              <path d="M 552 735 L 610 700 L 700 716 L 760 688 L 840 706 L 880 760 L 860 820 L 900 860 L 950 800 L 984 780 L 984 1000 L 880 1012 L 800 1016 L 720 1012 L 640 1012 L 586 1005 L 552 900 Z" fill="#C9CDD2" stroke={C.ink} strokeWidth={4} />
              <g transform="translate(560,1000) scale(0.46)"><path d={OUTLINE48} fill={C.chalk} stroke={C.ink} strokeWidth={8} /></g>
              <text x={760} y={880} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill="#6E7378" letterSpacing={6}>CANADA</text>
            </g>
          </HeldTravel>
          <path d={`M ${pins[0].x} ${pins[0].y} L ${pins[1].x} ${pins[1].y} Q 520 900 ${pins[2].x} ${pins[2].y} L ${pins[3].x} ${pins[3].y}`} stroke={C.ink} strokeWidth={6} fill="none"
            strokeDasharray="16 12" pathLength={1} style={{strokeDasharray: line > 0.99 ? '0.02 0.015' : `${line} 1`}} />
          {pins.map((pn, i) => {
            const k = ease(f, b15 + 6 + i * 6, 12);
            return (
              <g key={i} transform={`translate(${pn.x} ${pn.y - (1 - k) * 60})`} opacity={k}>
                <ContactShadow cx={0} cy={4} rx={14} ry={4} opacity={0.4} blur={3} />
                <path d="M0,0 L-14,-30 A16,16 0 1 1 14,-30 Z" fill={C.chalk} stroke={CAN.soot} strokeWidth={5} />
                <circle cx={0} cy={-36} r={6} fill={C.ink} />
              </g>
            );
          })}
          {stamp > 0 && (
            <g transform={`translate(520 940) scale(${1.4 - 0.4 * stamp})`} opacity={stamp}>
              <circle r={190} fill="none" stroke={C.loss} strokeWidth={10} opacity={0.85} />
              <circle r={174} fill="none" stroke={C.loss} strokeWidth={3} opacity={0.85} />
              <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={64} fill={C.loss} opacity={0.9}>$6M</text>
            </g>
          )}
          {tag > 0 && <g transform={`translate(${pins[0].x} ${pins[0].y - 36})`}><path d={`M0,0 L${-20 * tag},${50 * tag}`} stroke={C.ink} strokeWidth={2.5} /><g opacity={tag}><Lab text="BRIGGS" x={-20 * tag} y={70 * tag} size={18} /></g></g>}
          <Flask f={f} x={930} y={1330} s={0.6} fill={0.7} glow={0.8} seed={5} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S6 inside the flask (L7) -------------------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b18 = p.b(18), b19 = p.b(19);
  const open = ease(f, b18, 20);
  const cl = easeIO(f, b19, 26);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.07, fx: 540, fy: 980}]);
  return (
    <Frame p={p} cam={cam} bg="#2E3236" overlay={
      <g>
        <Plate text="MICROBES · RARE EARTHS FROM COAL REFUSE" displayLines={['MICROBES', 'RARE EARTHS FROM COAL REFUSE']} x={540} y={610} size={32} p={win(f, b18 + 6, b19)} />
        <Plate text="COAL REFUSE · WASTE FROM COAL PROCESSING" displayLines={['COAL REFUSE', 'WASTE FROM COAL PROCESSING']} x={540} y={610} size={32} tone="dark" p={win(f, b19 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2400} fill="#2E3236" />
        <ellipse cx={540} cy={1060} rx={520} ry={420} fill={C.lilac} opacity={0.12 + 0.1 * cl} />
        <g transform={`translate(540 1440) scale(${4.2}) translate(-540 -1440)`}>
          <Flask f={f} x={540} y={1440} s={1} fill={0.9} glow={0.4 + 0.5 * cl} seed={6} bubbles />
        </g>
        {/* the cutaway seam */}
        <path d={`M 300 ${720 + 20 * Math.sin(f / 30)} L 780 ${700 + 20 * Math.cos(f / 30)}`} stroke={C.chalk} strokeWidth={4} strokeDasharray="14 10" opacity={open} />
        {Array.from({length: 10}).map((_, i) => {
          const sink = clamp01((f - b18 - i * 3) / 40);
          return <path key={i} d={`M ${300 + i * 50} ${780 + sink * (420 + h01(i, 2) * 120)} l -12 0 l 4 -14 l 14 -4 Z`} fill={CAN.soot} stroke={C.ink} strokeWidth={2.5} opacity={open} />;
        })}
        {Array.from({length: 16}).map((_, i) => {
          const sx = 280 + h01(i, 1) * 520, sy = 860 + h01(i, 2) * 440;
          return <Speck key={i} f={f} x={lerp(sx, 540 + 26 * Math.cos(i), cl)} y={lerp(sy, 1100 + 26 * Math.sin(i), cl)} r={9} seed={i} glow={cl} />;
        })}
        {cl > 0.8 && <circle cx={540} cy={1100} r={60 + 6 * Math.sin(f / 4)} fill={C.lilac} opacity={0.25} />}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = i / 6 * Math.PI * 2 + f / 60;
          const rr = lerp(330, 120, cl);
          return <Microbe key={i} f={f} x={540 + rr * Math.cos(a) * open + (1 - open) * (i * 60 - 150)} y={1100 + rr * 0.7 * Math.sin(a) * open - (1 - open) * 300} scale={1.8} seed={i + 3} rot={a * 57} carry={cl} mood="busy" cues={[b18, b19]} />;
        })}
      </SVG>
    </Frame>
  );
};

// ---- S7 the goal (L8) ------------------------------------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b20 = p.b(20);
  const sl = ease(f, b20, 18);
  return (
    <Frame p={p} cam={() => ({z: 1.3, fx: 380, fy: 1080})} bg={C.aqua} overlay={
      <g><Plate text={'GOAL · "FOUR OR FIVE" STEPS · A HOPE'} x={540} y={600} size={32} p={win(f, b20 + 6)} /></g>
    }>
      <SVG>
        <Exterior f={f} seed={7} />
        <HeldTravel f={f} x={120} y={300} w={820} h={1080} mode="shadow" seed={71}>
          <Staircase f={f} x={140} y={1330} x2={880} y2={330} reveal={1} steps={50} />
        </HeldTravel>
        <GoalStool f={f} x={300} y={1330} s={1.4} slide={sl} label="GOAL · A HOPE" />
      </SVG>
    </Frame>
  );
};

// ---- S8 the canary (L9-L10) -----------------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b21 = p.b(21), b22 = p.b(22), b23 = p.b(23), b24 = p.b(24), b25 = p.b(25), b26 = p.b(26);
  const land = ease(f, b21, 20);
  const nixY = lerp(700, 1240, land);
  const hang = ease(f, b22, 18);
  const dials = [{x: 420, l: 'TEMPERATURE', on: b24}, {x: 560, l: 'ACIDITY', on: b25}, {x: 700, l: 'SALINITY', on: b25 + 10}, {x: 840, l: 'OXYGEN', on: b26}];
  const wireK = (i: number) => clamp01((f - (i === 0 ? b23 : dials[i].on - 6)) / 10);
  const cam = track([{t: 0, z: 1.02, fx: 560, fy: 1000}, {t: b23, z: 1.06, fx: 600, fy: 1040}, {t: p.dur, z: 1.1, fx: 640, fy: 1060}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="A DEEP LEARNING MODEL · PLANNED" x={540} y={600} size={32} p={win(f, b21 + 6, b22)} />
        <Plate text="MASOUMEH HEIDARI KAPOURCHALI · UAA ENGINEERING" displayLines={['MASOUMEH HEIDARI KAPOURCHALI', 'UAA ENGINEERING']} x={540} y={610} size={30} tone="dark" p={win(f, b22 + 4, b23)} /> {/* plate-overlap-ok */}
        <Plate text="WILL READ EACH REACTOR" x={540} y={600} size={34} p={win(f, b23 + 4, b24)} /> {/* plate-overlap-ok */}
        <Plate text="TEMPERATURE" x={540} y={600} size={36} tone="dark" p={win(f, b24 + 2, b25)} /> {/* plate-overlap-ok */}
        <Plate text="ACIDITY · SALINITY" x={540} y={600} size={36} p={win(f, b25 + 2, b26)} /> {/* plate-overlap-ok */}
        <Plate text="OXYGEN" x={540} y={600} size={38} tone="dark" p={win(f, b26 + 2)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <BenchWorld f={f} seed={8} dusk={0.2} wallUp={1} behind={
          <Suit f={f} x={200} y={1560} s={1.5} seed={9} cues={[b22, b23, b25, b26]} coat="#6C6A7A" longHair reach={0.4 + 0.5 * hang} facing={1} />
        }>
          <g transform={`translate(150 ${lerp(560, 760, hang)})`} opacity={hang > 0 ? 1 : 0}>
            <DataFeeder f={f} x={0} y={0} s={0.9} seeds={0} />
            <rect x={-36} y={58} width={72} height={100} rx={5} fill="#E8EEF2" opacity={0.85} />
            <Lab text="HOW MUCH? NOT STATED" x={0} y={210} size={14} />
          </g>
          {dials.map((d, i) => {
            const on = clamp01((f - d.on) / 8);
            return (
              <g key={i}>
                <path d={`M ${d.x} 1160 Q ${(d.x + 1000) / 2} ${1120 - i * 10} 980 1160`} stroke={C.ink} strokeWidth={3} fill="none" strokeDasharray="6 0" opacity={wireK(i)} pathLength={1} style={{strokeDasharray: `${wireK(i)} 1`}} />
                <BenchDial f={f} x={d.x} y={1240} s={0.95} label={d.l} value={0.15 + on * (0.35 + 0.1 * i)} jitter={on * 3} seed={i + 1} />
              </g>
            );
          })}
          <Nix f={f} x={980} y={nixY} scale={1.1} look={-0.7} card={0} monocles={f > b26 + 4} cues={[b21, b24, b26]} seed={8} mood="alert" hop={land < 1 ? 0 : 0} />
        </BenchWorld>
      </SVG>
    </Frame>
  );
};

// ---- S9 flag then fix (L11) ---------------------------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b27 = p.b(27), b28 = p.b(28), b29 = p.b(29);
  const drift = clamp01((f - b27) / Math.max(1, b29 - b27));
  const fix = ease(f, b29, 16);
  const foam = Math.min(1, drift * 1.1) * (1 - fix * 0.7);
  const card = ease(f, b28 - 4, 12);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.08, fx: 600, fy: 1040}]);
  return (
    <Frame p={p} cam={cam} bg="#3C3F43" overlay={
      <g>
        <Plate text="PLANNED · PER BRIGGS" x={540} y={600} size={34} p={win(f, b27 + 4, b28)} />
        <Plate text="WHEN A REACTOR'S GOING TO FAIL · PER BRIGGS" displayLines={["WHEN A REACTOR'S GOING TO FAIL", 'PER BRIGGS']} x={540} y={610} size={30} tone="dark" p={win(f, b28 + 2, b29)} /> {/* plate-overlap-ok */}
        <Plate text="FLAG · THEN FIX · PER BRIGGS" x={540} y={600} size={32} p={win(f, b29 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2400} fill="#3C3F43" />
        {Array.from({length: 30}).map((_, i) => <line key={i} x1={-200} x2={1280} y1={i * 70} y2={i * 70} stroke="#45494E" strokeWidth={2} />)}
        {/* the whiteprint frame */}
        <rect x={90} y={720} width={900} height={680} rx={8} fill="none" stroke={C.chalk} strokeWidth={5} strokeDasharray="20 12" strokeDashoffset={-f * 0.6} />
        <Lab text="PLANNED" x={210} y={740} size={20} fill="#3C3F43" ink={C.chalk} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const cx = 250 + (i % 3) * 290, cy = 900 + Math.floor(i / 3) * 300;
          const hot = i === 4;
          const fr = hot ? foam : 0;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={110} fill="#2E3236" stroke={C.ink} strokeWidth={6} />
              <circle cx={cx} cy={cy} r={92} fill={hot ? C.lilac : '#8FB0B8'} opacity={0.65} />
              <circle cx={cx} cy={cy} r={92} fill="none" stroke={C.chalk} strokeWidth={3} strokeDasharray="10 8" />
              {hot && <circle cx={cx} cy={cy} r={40 + fr * 52} fill="#F2F4F6" opacity={0.85} stroke={C.ink} strokeWidth={3} />}
              {hot && Array.from({length: 7}).map((_, k) => <circle key={k} cx={cx + Math.cos(k + f / 9) * (30 + fr * 40)} cy={cy + Math.sin(k + f / 9) * (30 + fr * 40)} r={10 + fr * 8} fill="#fff" stroke={C.ink} strokeWidth={2} opacity={fr} />)}
              <g transform={`translate(${cx + 90} ${cy - 90}) rotate(${hot ? -90 + drift * 150 - fix * 110 : -60 + 10 * Math.sin(f / 13 + i)})`}>
                <circle r={22} fill={C.chalk} stroke={C.ink} strokeWidth={3} transform={`rotate(${-(hot ? -90 + drift * 150 - fix * 110 : -60 + 10 * Math.sin(f / 13 + i))})`} />
                <path d="M0,0 L0,-18" stroke={hot && drift > 0.6 && fix < 0.5 ? C.loss : C.ink} strokeWidth={4} strokeLinecap="round" />
              </g>
            </g>
          );
        })}
        <Microbe f={f} x={830 + 10 * Math.sin(f / 5)} y={1300} scale={1.4} seed={9} rot={fix * 30} mood={fix > 0.5 ? 'proud' : 'worried'} cues={[b29]} />
        <g transform={`translate(780 1290) rotate(${f * 6 * fix})`}><circle r={22} fill="none" stroke={C.ink} strokeWidth={6} /><path d="M-22,0 L22,0 M0,-22 L0,22" stroke={C.ink} strokeWidth={4} /></g>
        <rect x={60} y={640} width={960} height={14} rx={6} fill="#8C9196" stroke={C.ink} strokeWidth={3} />
        <Nix f={f} x={300} y={652} scale={1.0} look={0.6} card={card} flip={clamp01((f - b29) / 10)} cardText="NO" cardBack="FIX" cues={[b28, b29]} seed={9} mood={card > 0.5 && fix < 0.5 ? 'worried' : 'steady'} />
      </SVG>
    </Frame>
  );
};

// ---- S10 the fast no (L12-L13) ---------------------------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b30 = p.b(30), b31 = p.b(31), b32 = p.b(32);
  const skipped = clamp01((f - b31) / 6);
  const arrow = easeIO(f, b32, 30);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.04, fx: 560, fy: 980}]);
  return (
    <Frame p={p} cam={cam} bg="#6A6E72" overlay={
      <g>
        <Plate text="MONTHS, IF NOT YEARS · PER BRIGGS" x={540} y={600} size={32} p={win(f, b30 + 4, b31)} />
        <Plate text="COULD QUICKLY FLAG A BAD FEEDSTOCK · PER BRIGGS" displayLines={['COULD QUICKLY FLAG A BAD FEEDSTOCK', 'PER BRIGGS']} x={540} y={610} size={30} tone="dark" p={win(f, b31 + 4, b32)} /> {/* plate-overlap-ok */}
        <Plate text="SHOULD SPEED THE SCALE-UP · PER BRIGGS" x={540} y={600} size={30} p={win(f, b32 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2400} fill="#7A7E82" />
        <rect x={-200} y={1380} width={1480} height={800} fill="#4A4E52" />
        {Array.from({length: 12}).map((_, i) => <line key={i} x1={-200 + i * 140} x2={-260 + i * 140} y1={1380} y2={2100} stroke={C.ink} strokeWidth={2} opacity={0.3} />)}
        {[0, 1, 2].map((i) => <rect key={i} x={120 + i * 360} y={250} width={200} height={26} rx={10} fill="#F4F6F8" opacity={0.85} stroke={C.ink} strokeWidth={3} />)}
        {/* the cobalt stripe, the wall's proxy */}
        <rect x={880} y={300} width={120} height={1080} fill={C.cobalt} stroke={C.ink} strokeWidth={5} />
        <path d={`M 940 1360 L 940 ${lerp(1360, 1000, arrow)}`} stroke={C.chalk} strokeWidth={14} strokeDasharray="22 14" />
        {arrow > 0.05 && <path d={`M 910 ${lerp(1360, 1000, arrow) + 10} L 940 ${lerp(1360, 1000, arrow) - 30} L 970 ${lerp(1360, 1000, arrow) + 10}`} fill="none" stroke={C.chalk} strokeWidth={10} />}
        <HeldTravel f={f} x={250} y={700} w={380} h={420} mode="shadow" seed={101}>
          <TearCalendar f={f} x={440} y={720} s={1.9} top="MONTH" under={skipped > 0.5 ? 'SKIPPED' : 'MONTH'} torn={clamp01((f - b30) / 30) * (1 - skipped)} seed={2} />
        </HeldTravel>
        {Array.from({length: 6}).map((_, i) => {
          const t = clamp01((f - b30 - i * 9) / 34) * (1 - skipped);
          const back = skipped;
          return <BlowPage key={i} f={f} x0={440} y0={900} x1={lerp(100 + i * 160, 440, back)} y1={lerp(1500 - i * 40, 900, back)} t={back > 0 ? 1 - back * 0.98 : t} seed={i + 1} label="MONTH" />;
        })}
        {skipped > 0 && (
          <g>
            <rect x={220} y={680} width={440} height={500} fill="none" stroke={C.chalk} strokeWidth={4} strokeDasharray="14 10" />
            <Lab text="COULD" x={300} y={700} size={18} fill="#7A7E82" ink={C.chalk} />
            <Stamp cx={440} cy={1000} s={0.55 + 0.1 * (1 - skipped)} text="SKIPPED" rot={-10} />
          </g>
        )}
        <g transform={`translate(${lerp(-120, 620, clamp01((f - b31 + 20) / 20))} 1370)`}>
          <Jar x={0} y={0} s={0.6} />
          <RefuseLump f={f} x={0} y={-8} s={0.5} seed={7} />
        </g>
        <g transform="translate(-30 0)">
          <Nix f={f} x={110} y={1380} scale={1.0} look={0.6} card={ease(f, b31 - 4, 10)} cardText="NO" cues={[b31]} seed={10} mood="smug" />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S11 across the street (L14) ------------------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b33 = p.b(33), b34 = p.b(34), b35 = p.b(35);
  const lit = ease(f, b34, 14);
  const slap = clamp01((f - b35) / 6);
  const flick = 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(f / 4) * Math.sin(f / 7));
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: b35 - 10, z: 1.0, fx: 600, fy: 960}, {t: b35 + 14, z: 1.5, fx: 680, fy: 860}, {t: p.dur, z: 1.52, fx: 680, fy: 860}]);
  return (
    <Frame p={p} cam={cam} bg={C.teal} overlay={
      <g>
        <Plate text="OTHERS HIT THAT WALL" x={540} y={600} size={36} p={win(f, b33 + 6, b34)} />
        <Plate text="DOE-FUNDED PILOT · DIFFERENT METHOD · 2023" displayLines={['DOE-FUNDED PILOT', 'DIFFERENT METHOD · 2023']} x={540} y={610} size={32} tone="dark" p={win(f, b34 + 4, b35)} /> {/* plate-overlap-ok */}
        <Plate text="EVERY SCENARIO IN THE RED · DOE-FUNDED PILOT" displayLines={['EVERY SCENARIO IN THE RED', 'DOE-FUNDED PILOT']} x={540} y={610} size={32} p={win(f, b35 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <Exterior f={f} dusk={1} seed={11} />
        {/* the other building */}
        <rect x={420} y={560} width={560} height={760} fill="#3A3F44" stroke={C.ink} strokeWidth={6} />
        {Array.from({length: 4}).map((_, i) => <rect key={i} x={450 + i * 130} y={590} width={90} height={60} fill="#2A2E32" stroke={C.ink} strokeWidth={3} />)}
        <rect x={500} y={700} width={400} height={440} fill={lit > 0 ? '#E8ECEF' : '#2A2E32'} opacity={0.3 + 0.7 * lit} stroke={C.ink} strokeWidth={5} />
        <g opacity={lit}><GhostTank f={f} x={700} y={1130} s={0.6} k={lit} /></g>
        {slap > 0 && (
          <g transform={`translate(700 920) rotate(${-4 * (1 - slap)}) scale(${0.6 + 0.4 * slap})`}>
            <rect x={-150} y={-180} width={300} height={360} rx={4} fill="#FFFDF6" stroke={C.ink} strokeWidth={4} />
            {Array.from({length: 7}).map((_, i) => <g key={i}><line x1={-120} x2={60} y1={-140 + i * 44} y2={-140 + i * 44} stroke="#C9CED6" strokeWidth={3} /><rect x={74} y={-152 + i * 44} width={56} height={22} rx={2} fill={C.loss} /></g>)}
          </g>
        )}
        <rect x={500} y={700} width={400} height={440} fill="#fff" opacity={0.06} />
        <path d="M520,720 L580,720 L520,800 Z" fill="#fff" opacity={0.12} />
        {/* the sign over the door */}
        <g transform={`translate(700 1170) rotate(${4 * Math.sin(f / 13)})`}>
          <line x1={-80} y1={0} x2={-80} y2={20} stroke={C.ink} strokeWidth={3} /><line x1={80} y1={0} x2={80} y2={20} stroke={C.ink} strokeWidth={3} />
          <rect x={-120} y={20} width={240} height={50} rx={4} fill="#22262B" stroke={C.ink} strokeWidth={3} />
          <text x={0} y={53} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.chalk}>PILOT · 2023</text>
        </g>
        <rect x={420} y={1240} width={560} height={80} fill="#2A2E32" stroke={C.ink} strokeWidth={4} />
        {/* the street and the near sidewalk */}
        <rect x={-200} y={1320} width={1480} height={60} fill="#33373B" />
        {Array.from({length: 6}).map((_, i) => <rect key={i} x={-100 + i * 240} y={1345} width={120} height={8} fill={C.chalk} opacity={0.5} />)}
        <rect x={-200} y={1380} width={1480} height={600} fill="#4A4E52" stroke={C.ink} strokeWidth={4} />
        <HeldTravel f={f} x={170} y={1180} w={140} h={200} mode="sweep" seed={111}>
          <Flask f={f} x={240} y={1380} s={0.75} fill={0.6} glow={flick * 0.7} seed={11} />
        </HeldTravel>
        <Nix f={f} x={110} y={1380} scale={1.0} look={1} card={0.3} cardText="NO" cues={[b33, b35]} seed={11} mood="worried" />
      </SVG>
    </Frame>
  );
};

// ---- S12 their lab and plant (L15) -------------------------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b36 = p.b(36), b37 = p.b(37);
  const rise = easeIO(f, b36 + 6, 40);
  const extra = easeIO(f, b37, 20);
  return (
    <Frame p={p} z0={1.0} z1={1.03} bg="#D9DDE0" overlay={
      <g>
        <Plate text="ONE FEEDSTOCK · THE PILOT'S OWN LAB AND PLANT" displayLines={['ONE FEEDSTOCK', "THE PILOT'S OWN LAB AND PLANT"]} x={540} y={610} size={30} p={win(f, b36 + 4, b37)} />
        <Plate text="LAB RAN ABOUT 30% HIGHER THAN THE PILOT" displayLines={['LAB RAN ABOUT 30% HIGHER', 'THAN THE PILOT']} x={540} y={610} size={32} tone="dark" p={win(f, b37 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2400} fill="#D9DDE0" />
        <rect x={-200} y={1300} width={1480} height={900} fill="#B9BEC3" />
        {Array.from({length: 10}).map((_, i) => <line key={i} x1={-200 + i * 160} x2={-300 + i * 160} y1={1300} y2={2100} stroke={C.ink} strokeWidth={2} opacity={0.2} />)}
        <g transform="translate(330 1290)">
          <path d="M-50,-130 L-50,-20 Q-50,0 -30,0 L30,0 Q50,0 50,-20 L50,-130" fill="none" stroke={CAN.cobaltL} strokeWidth={5} strokeDasharray="12 8" />
          <Lab text="THEIR LAB" x={0} y={40} size={18} />
        </g>
        <GhostTank f={f} x={760} y={1290} s={0.42} k={1} />
        <Lab text="THEIR PILOT" x={760} y={1330} size={18} />
        <HeldTravel f={f} x={300} y={620} w={480} h={640} mode="shadow" seed={121}>
          <g>
            <BlockBar f={f} x={430} y={1240} n={10 + 3 * extra} rise={rise} label="LAB" color={C.lilac} bw={110} bh={46} />
            <BlockBar f={f} x={650} y={1240} n={10} rise={rise} label="PILOT" color="#8FB0B8" bw={110} bh={46} />
          </g>
        </HeldTravel>
        {extra > 0.6 && <g opacity={(extra - 0.6) * 2.5}><path d="M500,780 L560,780 L560,700" fill="none" stroke={C.ink} strokeWidth={4} /><Lab text="+3 OF 10" x={600} y={680} size={20} /></g>}
      </SVG>
    </Frame>
  );
};

// ---- S13 still early (L16-L18) ----------------------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b38 = p.b(38), b39 = p.b(39), b40 = p.b(40);
  const lampSwing = Math.sin(f / 16) * 12 * (0.6 + 0.4 * clamp01((f - b38) / 20));
  const line = easeIO(f, b39 + 6, 30);
  const cap = clamp01((f - b39 - 10) / 20);
  const stamp = clamp01((f - b40) / 6);
  const cam = track([{t: 0, z: 1.08, fx: 380, fy: 1060}, {t: b39, z: 1.06, fx: 560, fy: 1040}, {t: b40, z: 1.08, fx: 720, fy: 1080}, {t: p.dur, z: 1.1, fx: 700, fy: 1080}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text={'"STILL IN THEIR INFANCY" · 2021 REVIEW'} x={540} y={600} size={30} p={win(f, b38 + 6, b39)} />
        <Plate text="DATA · THE USUAL LIMIT · 2021 REVIEW" x={540} y={600} size={30} tone="dark" p={win(f, b39 + 4, b40)} /> {/* plate-overlap-ok */}
        <Plate text="NO RESULTS YET · PLANNED WORK" x={540} y={600} size={32} p={win(f, b40 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <BenchWorld f={f} seed={13} dusk={0.95} lamp={0.8}>
          <g transform={`translate(330 640) rotate(${lampSwing})`}>
            <line x1={0} y1={-700} x2={0} y2={0} stroke={C.ink} strokeWidth={4} />
            <path d="M-50,0 L50,0 L30,-40 L-30,-40 Z" fill="#8C9196" stroke={C.ink} strokeWidth={4} />
            <path d="M-50,0 L-240,560 L240,560 L50,0 Z" fill={C.lamp} opacity={0.14} />
          </g>
          <Bassinet f={f} x={330} y={1240} s={1.0} rock={1} />
          <Lab text="THE FIELD" x={330} y={1200} size={18} />
          <g transform="translate(700 600)"><DataFeeder f={f} x={0} y={0} s={0.85} seeds={0} /><rect x={-34} y={52} width={68} height={92} rx={5} fill="#E8EEF2" opacity={0.85} />
            <path d={`M -34 ${140 - line * 50} L 34 ${140 - line * 50}`} stroke={C.ink} strokeWidth={3} strokeDasharray="8 6" opacity={line} />
            {line > 0.5 && <Lab text="TO BE GATHERED" x={0} y={200} size={14} />}
          </g>
          <g transform="translate(880 700)">
            <path d="M-10,0 q10,-14 20,0" fill="none" stroke={C.ink} strokeWidth={3} />
            <rect x={-40} y={10} width={80} height={110} rx={6} fill={CAN.glass} opacity={0.6} stroke={C.ink} strokeWidth={3} />
            <rect x={-40} y={60} width={80} height={60} fill="#C9A46A" opacity={0.7} />
            <line x1={-46} x2={46} y1={60} y2={60} stroke={C.loss} strokeWidth={4} />
            <g transform={`translate(0 140) rotate(${-60 + cap * 60})`}><line x1={0} y1={0} x2={0} y2={-30} stroke={C.ink} strokeWidth={4} /></g>
            <Lab text="NEURAL NETWORKS · GENERALLY" x={0} y={200} size={12} />
          </g>
          <Flask f={f} x={560} y={1240} s={0.7} fill={0.55} glow={0.4} seed={13} />
          {line > 0.3 && <g opacity={line}><line x1={520} x2={600} y1={1170} y2={1170} stroke={C.ink} strokeWidth={3} strokeDasharray="6 5" /><text x={612} y={1176} fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.chalk}>?</text></g>}
          <g transform="translate(820 1230)">
            <rect x={-80} y={-14} width={160} height={110} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={3} transform="rotate(-6)" />
            {stamp > 0 && <Stamp cx={0} cy={40} s={0.22 + 0.06 * (1 - stamp)} text="NO RESULTS YET" rot={-12} />}
          </g>
        </BenchWorld>
      </SVG>
    </Frame>
  );
};

// ---- S14 aimed at it (L19-L20) ------------------------------------------------------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b41 = p.b(41), b42 = p.b(42), b43 = p.b(43), b44 = p.b(44), b45 = p.b(45);
  const land = ease(f, b41, 20);
  const chalk = clamp01((f - b43) / 26);
  const stool = ease(f, b44, 18);
  const cam = track([{t: 0, z: 1.15, fx: 420, fy: 1180}, {t: b45, z: 1.1, fx: 440, fy: 1140}, {t: b45 + 60, z: 1.0, fx: 520, fy: 700}, {t: p.dur, z: 1.0, fx: 520, fy: 640}]);
  const txt = 'AUGUST 2030';
  return (
    <Frame p={p} cam={cam} bg={C.teal} overlay={
      <g>
        <Plate text="NOT OVER THE WALL" x={540} y={600} size={36} p={win(f, b41 + 6, b42)} />
        <Plate text="AIMED AT IT" x={540} y={600} size={40} tone="dark" p={win(f, b42 + 2, b43)} /> {/* plate-overlap-ok */}
        <Plate text="AWARD RUNS TO AUGUST 2030" x={540} y={600} size={34} p={win(f, b43 + 4, b44)} /> {/* plate-overlap-ok */}
        <Plate text={'GOAL · "FOUR OR FIVE" STEPS'} x={540} y={600} size={34} tone="dark" p={win(f, b44 + 4, b45)} /> {/* plate-overlap-ok */}
        <Plate text="AT FULL SIZE" x={540} y={600} size={38} p={win(f, b45 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <Exterior f={f} dusk={1} seed={14} />
        <g opacity={0.9}><Staircase f={f} x={820} y={1320} x2={1060} y2={700} reveal={1} steps={30} color="#CFD3D6" /></g>
        <ScaleWall f={f} x={260} y={1330} w={360} h={1500} grow={1} seed={14} dashed />
        <ScaleWall f={f} x={480} y={1330} w={300} h={1000} grow={1} seed={15} />
        <rect x={330} y={330} width={6} height={1000} fill={CAN.cobaltL} opacity={0.6} />
        {chalk > 0 && <text x={480} y={500} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.chalk}>{txt.slice(0, Math.ceil(txt.length * chalk))}</text>}
        <HeldTravel f={f} x={560} y={1190} w={120} h={150} mode="sweep" seed={141}>
          <Flask f={f} x={620} y={1330} s={0.6} fill={0.55} glow={0.5} seed={14} />
        </HeldTravel>
        <GoalStool f={f} x={800} y={1330} s={1.1} slide={stool} />
        <Nix f={f} x={lerp(900, 720, land)} y={lerp(900, 1330, land)} scale={1.0} facing={-1} look={-0.2} card={ease(f, b42 - 4, 12)} reticle cues={[b41, b42, b44]} seed={14} silhouette={f > b41 + 30} mood="steady" />
      </SVG>
    </Frame>
  );
};

// ---- S15 the next lump (L21) --------------------------------------------------------------------------------------------------------------------------------
const S15: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b46 = p.b(46), b47 = p.b(47);
  const tagFlip = clamp01((f - b46 - 40) / 10);
  const fall = clamp01((f - b47) / 14);
  return (
    <Frame p={p} z0={1.0} z1={1.05} bg="#2A2D31" overlay={
      <g>
        <Plate text={'"THE RARE EARTHS ARE NOT RARE" · BRIGGS'} x={540} y={600} size={30} p={win(f, b46 + 6, b47)} />
        <Plate text="AN EARLY NO THAT HOLDS UP?" x={540} y={600} size={34} tone="dark" p={win(f, b47 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2400} fill="#2A2D31" />
        <radialGradient id="jarLamp" cx="0.5" cy="0.35" r="0.6"><stop offset="0" stopColor={C.lamp} stopOpacity={0.55} /><stop offset="1" stopColor={C.lamp} stopOpacity={0} /></radialGradient>
        <rect x={-200} y={-200} width={1480} height={2400} fill="url(#jarLamp)" />
        {/* the room seen up through the jar mouth */}
        <rect x={140} y={360} width={800} height={260} fill="#5C6064" opacity={0.6} />
        <Nix f={f} x={560} y={1200} scale={2.6} look={0.1} card={1} flip={0.5 + 0.06 * Math.sin(f / 12)} cardText="2030?" cardBack="2030?" cues={[b46, b47]} seed={15} mood="steady" />
        <g transform="translate(870 1240)">
          <Flask f={f} x={0} y={0} s={0.8} fill={0.55} glow={0.35} seed={15} />
          <NeckTag x={18} y={-160} text={tagFlip > 0.5 ? 'AUGUST 2030' : ''} f={f} />
        </g>
        {fall > 0 && <g transform={`translate(540 ${lerp(200, 980, fall)}) scale(${lerp(0.6, 3.2, fall * fall)})`}><RefuseLump f={f} x={0} y={0} s={1} seed={9} /></g>}
        {/* the jar's glass rim around the whole frame */}
        <ellipse cx={540} cy={960} rx={640} ry={900} fill="none" stroke={CAN.glass} strokeWidth={180} opacity={0.35} />
        <ellipse cx={540} cy={960} rx={560} ry={820} fill="none" stroke="#fff" strokeWidth={6} opacity={0.35} />
        <path d="M150,700 Q120,960 160,1220" fill="none" stroke="#fff" strokeWidth={14} opacity={0.3} strokeLinecap="round" />
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

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

export const ep1122Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1122Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1122: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 5, 19, 25, 35, 41, 47, 50, 63, 68, 76, 86, 92, 102, 113, 121].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.grey}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#22262B" ink="#FBF8F0" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
