import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK, ContactShadow} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {snap, bump, rnd, MONO, monoW} from './lib/prospect';
import {SON, Wedge, EchoBlobs, CenterLine, Odometer, SonarWater, fanPath} from './lib/sonar';
import {AK_PATH} from './lib/akmap';
import {Moose} from './lib/fauna';
import {TallyCounter} from './lib/props';
import {Character} from './lib/Character';
import {IDS} from './Ep1028Ids';

// The River It Never Saw, 2026-10-28. Palette roles are art_direction.json. WEDGE (a sonar fan on a slate base with a face and two tally wheels) is the hero
// and the gold CENTER LINE is the throughline: bare (S1), ruled with tallies (S4), a needle (S7), half dashed into the dark (S11), an open hook (S13).
// The right third of the fan is black from the first frame: the river the model never saw. Violet is for dashed unknowns only. Coral is spent once, on 0.80.
// Wedge is an instrument in the film's own sonar world, never drawn deployed. The unseen Alaska river is a dashed question mark, never a result.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const SERIF = 'Fraunces, Georgia, serif';
const C = {ink: INK, paper: SON.paper};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'paper' | 'violet' | 'coral';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  ink: {fill: '#06242B', fg: SON.mint, edge: SON.mint},
  paper: {fill: SON.paper, fg: '#0B1F26', edge: INK},
  violet: {fill: '#1A1630', fg: '#CFC6F5', edge: SON.violet},
  coral: {fill: '#2B100C', fg: '#FFB2A3', edge: SON.coral},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'ink', p = 1, rot = 0, drop = 0}) => {
  const ls = displayLines ?? [text];
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
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={t.edge} strokeWidth={4} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

// ---- the shot frame: a camera that can move to any focus, kick, grade ------------------------------------------------------------------------
const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; dim?: number; children: React.ReactNode}> =
({p, cam, z0 = 1, z1 = 1.05, bloom = 0.06, vignette = 0.28, ox = 540, oy = 960, tag = true, overlay, tagText = CHIP, dim = 0, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + 7 * Math.sin(p.f / 23)}px, ${jl.y + 9 * Math.sin(p.f / 17 + 1) + 6 * t}px) rotate(${0.3 * Math.sin(p.f / 31)}deg) translate(540px, 960px) scale(${c.z * jl.scale * (1 + 0.008 * Math.sin(p.f / 13))}) translate(${-c.fx}px, ${-c.fy}px)`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {dim > 0 && <div style={{position: 'absolute', inset: 0, background: '#010708', opacity: dim}} />}
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#06242B" stroke={SON.mint} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={SON.mint}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0} />
    </AbsoluteFill>
  );
};
const clampCam = (c: Cam): Cam => ({z: c.z, fx: Math.max(540 / c.z, Math.min(1080 - 540 / c.z, c.fx)), fy: Math.max(960 / c.z, Math.min(1920 - 960 / c.z, c.fy))});
const trackRaw = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => {
  if (f <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i].t) {
      const a = keys[i - 1], bk = keys[i];
      const k = Easing.inOut(Easing.cubic)((f - a.t) / Math.max(1, bk.t - a.t));
      return {z: lerp(a.z, bk.z, k), fx: lerp(a.fx, bk.fx, k), fy: lerp(a.fy, bk.fy, k)};
    }
  }
  return keys[keys.length - 1];
};
const track = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => clampCam(trackRaw(keys)(f));

// ---- shared pieces -------------------------------------------------------------------------------------------------------------------------------
/** the near plane: river bank rocks under the caption card so the lower third is a stage */
const NearBank: React.FC<{f: number; seed?: number; fog?: boolean; dusk?: boolean}> = ({f, seed = 1, fog = false, dusk = false}) => (
  <g data-band="ok">
    <path data-band="ok" d="M -40,1560 Q 140,1520 300,1556 T 620,1548 T 920,1540 T 1120,1560 L 1120,1960 L -40,1960 Z" fill={dusk ? '#2A2119' : '#081A1F'} stroke={INK} strokeWidth={6} />
    {Array.from({length: 9}).map((_, i) => (
      <ellipse key={i} data-band="ok" cx={30 + i * 128 + 24 * rnd(i + seed) + 14 * Math.sin(f / 70 + i)} cy={1640 + 120 * rnd(i + seed * 3 + 2)} rx={46 + 38 * rnd(i + 4 + seed)} ry={20 + 14 * rnd(i + 8 + seed)} fill={dusk ? '#4A3A2C' : '#17403B'} stroke={INK} strokeWidth={5} />
    ))}
    {/* current streaks and a few small fish keep the lower third alive */}
    {Array.from({length: 7}).map((_, i) => <rect key={`c${i}`} data-band="ok" x={((f * (1.2 + rnd(i + seed) * 1.4) + rnd(i + 5) * 1400) % 1500) - 200} y={1610 + 40 * i} width={140 + 90 * rnd(i + 9)} height={4} rx={2} fill={dusk ? SON.echoHi : SON.mint} opacity={dusk ? 0.2 : 0.18} />)}
    {[0, 1, 2].map((i) => <ellipse key={`fish${i}`} data-band="ok" cx={((f * (1.8 + 0.5 * i) + 300 * i) % 1300) - 100} cy={1730 + 70 * i + 6 * Math.sin(f / 11 + i)} rx={16} ry={7} fill={SON.echo} opacity={0.55} />)}
    {Array.from({length: 14}).map((_, i) => <circle key={`s${i}`} cx={((f * (0.3 + rnd(i) * 0.5) + rnd(i + 3) * 1200) % 1240) - 80} cy={1580 + 260 * rnd(i + 7) + 6 * Math.sin(f / 19 + i)} r={2 + 2.4 * rnd(i + 2)} fill={SON.mint} opacity={fog ? 0.16 : 0.26} />)}
  </g>
);

/** a paper sheet with ink edge */
const Sheet: React.FC<{x: number; y: number; w: number; h: number; rot?: number; f: number; children?: React.ReactNode}> = ({x, y, w, h, rot = 0, f, children}) => (
  <g transform={`translate(${x},${y}) rotate(${rot + 0.5 * Math.sin(f / 37)})`}>
    <ContactShadow cx={0} cy={h / 2 + 10} rx={w * 0.55} ry={16} opacity={0.4} blur={10} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={SON.paper} stroke={INK} strokeWidth={6} />
    <rect x={-w / 2 + 8} y={-h / 2 + 8} width={w - 16} height={14} fill="#fff" opacity={0.35} />
    {children}
  </g>
);

const Stamp: React.FC<{text: string; x: number; y: number; rot?: number; p: number; size?: number; color?: string}> = ({text, x, y, rot = -8, p, size = 34, color = SON.coral}) => {
  const k = clamp01(p);
  if (k <= 0.02) return null;
  const w = monoW(text, size, 2) + 36;
  const sc = 1.7 - 0.7 * Math.min(1, k * 1.25) + 0.05 * Math.sin(k * 9);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, k * 2)}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.7} rx={5} fill="none" stroke={color} strokeWidth={5} />
      <text x={0} y={size * 0.3} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={2} fill={color}>{text}</text>
    </g>
  );
};

/** a small in-scene label in its own rect, sized to its string by arithmetic */
const Tag: React.FC<{text: string; x: number; y: number; size?: number; op?: number; fg?: string}> = ({text, x, y, size = 22, op = 1, fg = SON.paper}) => {
  const w = monoW(text, size) + 28;
  return (
    <g transform={`translate(${x},${y})`} opacity={op}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.6} rx={5} fill="#06201A" stroke={SON.slateHi} strokeWidth={2.5} />
      <text x={0} y={size * 0.3} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.5} fill={fg}>{text}</text>
    </g>
  );
};

/** a horizontal gauge: track 0..max, fill to value, drawn as an UPPER BOUND with a notch */
const Gauge: React.FC<{x: number; y: number; w: number; value: number; max: number; k: number; color: string; h?: number}> = ({x, y, w, value, max, k, color, h = 34}) => {
  const fw = (w * value) / max * clamp01(k);
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={0} y={0} width={w} height={h} rx={6} fill="#02131A" stroke={SON.slateHi} strokeWidth={4} />
      <rect x={4} y={4} width={Math.max(0, fw)} height={h - 8} rx={3} fill={color} />
      <rect x={4} y={4} width={Math.max(0, fw)} height={7} fill="#fff" opacity={0.25} />
      <path d={`M ${4 + fw},-8 L ${4 + fw},${h + 8}`} stroke={SON.paper} strokeWidth={4} />
      {[0, 0.2, 0.4, 0.6, 0.8].map((v, i) => <line key={i} x1={(w * v) / max} x2={(w * v) / max} y1={h} y2={h + 10} stroke={SON.slateHi} strokeWidth={2.4} />)}
    </g>
  );
};

// ---- S1: the flood (line 0) ----------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t2 = b(2), t3 = b(3);
  const on = snap(f, 0, 9);
  const ring = ease(f, 0, 22);
  const roll = ease(f, Math.max(12, t3 - 96), 90);
  const land = bump(f, t3 - 2, 22);
  const cam = track([{t: 0, z: 1.1, fx: 540, fy: 1010}, {t: p.dur, z: 1.0, fx: 600, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <g transform={`translate(540,520) scale(${1 + 0.07 * land})`}><Odometer x={-170} y={-46} value={855936 * roll} digits={6} size={58} id="s1o" /></g>
        <Plate x={540} text="NUSHAGAK · JUNE 28TH · SONAR COUNT" y={640} size={30} tone="ink" p={ease(f, t2 - 6, 8)} />
        {f < 4 && <rect data-band="ok" x={0} y={0} width={W} height={H} fill={SON.mint} opacity={0.35 - f * 0.08} />}
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s1w" />
        <circle cx={500} cy={1090} r={40 + 900 * ring} fill="none" stroke={SON.mint} strokeWidth={6} opacity={0.6 * (1 - ring)} />
        {/* the agency's own sonar: a faceless bank instrument with a fully lit fan */}
        <Wedge x={500} y={1090} s={1} f={f} id="s1" faceless plaque="ADF&G SONAR" lit={on} dark={0} tallyL={f * 0.6} tallyR={f * 2.4} blobs={150} speed={2.8} dirRight={0.88} line="bare" seed={1} />
        {/* an unlit fan beside it, dashed and unmeasured, planted for the end of the film */}
        <Wedge x={930} y={1010} s={0.3} f={f} id="s1g" R={620} base={false} ghost={0.95} blobs={0} line="bare" lit={0.2} rings={false} />
        <text x={930} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={110} fill={SON.violet} opacity={0.5 * (0.6 + 0.4 * Math.sin(f / 14))}>?</text>
        <NearBank f={f} seed={1} />
      </SVG>
    </Frame>
  );
};

// ---- S2: the Kenai season (line 1) ---------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t4 = b(4), t5 = b(5);
  const rise = easeIO(f, t4 + 10, 60);
  const cam = track([{t: 0, z: 1.1, fx: 420, fy: 1000}, {t: p.dur, z: 1.0, fx: 540, fy: 1000}]);
  const H0 = 560, base = 1230;
  const slabs = 15;
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="KENAI MILE 19 · 1,111,781 · SONAR ESTIMATE" y={580} size={30} tone="ink" p={ease(f, t4 + 4, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s2w" bank={0} seed={2} />
        <g transform="translate(300,0)">
          <ContactShadow cx={0} cy={base + 4} rx={170} ry={14} opacity={0.4} blur={9} />
          {Array.from({length: slabs}).map((_, i) => {
            const sh = (H0 * 0.8454) / slabs * rise;
            const y = base - sh * (i + 1);
            return <rect key={i} x={-120} y={y} width={240} height={Math.max(0, sh - 3)} rx={4} fill={SON.echo} stroke={INK} strokeWidth={4} opacity={0.55 + 0.4 * ((i % 3) / 2)} />;
          })}
          <g transform={`translate(0,${-(H0 * 0.8454) * rise})`}>
            <rect x={-120} y={base - H0 * 0.1546 * rise} width={240} height={H0 * 0.1546 * rise} rx={4} fill={SON.echoHi} stroke={INK} strokeWidth={5} />
            <rect x={-120} y={base - H0 * 0.1546 * rise} width={240} height={8} fill="#fff" opacity={0.3} />
          </g>
        </g>
        <Wedge x={760} y={1190} s={0.55} f={f} id="s2" R={620} base faceless lit={0.9} blobs={60} speed={1.4} dirRight={0.8} dark={0} line="bare" seed={2} tallyL={f * 0.3} tallyR={f * 1.1} />
        <NearBank f={f} seed={2} />
      </SVG>
    </Frame>
  );
};

// ---- S15: fifteen sonar sites (line 2) -----------------------------------------------------------------------------------------------------------
const PINS: Array<[number, number]> = [[470, 120], [440, 160], [410, 200], [380, 240], [300, 250], [250, 290], [320, 300], [200, 230], [560, 140], [610, 170], [520, 220], [350, 150], [270, 180], [450, 260], [480, 100]];
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t6 = b(6), t7 = b(7);
  const pins = (i: number) => ease(f, t6 + 2 + i * 3, 10);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.08, fx: 580, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="15 SONAR SITES · 13 RIVERS · ADF&G" y={580} size={30} tone="ink" p={ease(f, t7 - 6, 8)} />
        <Plate x={540} text="SCHEMATIC · NOT SITE LOCATIONS" y={660} size={26} tone="paper" p={ease(f, t7 + 14, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s15w" bank={0} seed={15} />
        <g transform="translate(90,760) scale(0.9)">
          <path d={AK_PATH} fill="#0F3A40" stroke={SON.mint} strokeWidth={6} opacity={0.95} strokeLinejoin="round" />
          {PINS.map(([px, py], i) => (
            <g key={i} transform={`translate(${px},${py})`} opacity={pins(i)}>
              <circle r={14 + 4 * Math.sin(f / 7 + i)} fill={SON.mint} stroke={INK} strokeWidth={5} />
              <circle r={34} fill="none" stroke={SON.mint} strokeWidth={4} opacity={0.4 * (0.5 + 0.5 * Math.sin(f / 9 + i))} />
            </g>
          ))}
        </g>
        <NearBank f={f} seed={15} />
      </SVG>
    </Frame>
  );
};

// ---- S3: the preprint (line 3) -------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t8 = b(8), t9 = b(9), t10 = b(10), t38 = b(38);
  const drop = ease(f, 0, 14);
  const stamp = ease(f, t9, 12);
  const strip = ease(f, t38 - 10, 22);
  const cam = track([{t: 0, z: 1.06, fx: 540, fy: 1000}, {t: p.dur, z: 1.0, fx: 540, fy: 1010}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="PREPRINT · OCT 15TH · CALTECH + MIT" y={580} size={30} tone="paper" p={ease(f, t8, 8)} />
        <Plate x={540} text="A TEST FOR SONAR FISH COUNTING" y={660} size={30} tone="ink" p={ease(f, t10 - 4, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s3w" seed={3} />
        <g transform={`translate(0,${-(1 - drop) * 700})`}>
          <Sheet x={540} y={1000} w={560} h={640} rot={-3} f={f + p.from}>
            <text x={0} y={-190} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={118} fill="#0B1F26">CFC26</text>
            {[-96, -62, -28].map((yy, i) => <rect key={i} x={-200 + (i === 2 ? 60 : 0)} y={yy} width={400 - (i === 2 ? 120 : 0)} height={9} rx={4} fill="#0B1F26" opacity={0.28} />)}
            {Array.from({length: 7}).map((_, i) => <rect key={`l${i}`} x={-200} y={40 + i * 34} width={i === 6 ? 220 : 400} height={9} rx={4} fill="#0B1F26" opacity={0.14} />)}
            <Stamp text="PREPRINT" x={110} y={190} rot={-7} p={stamp} size={38} color="#0B3B52" />
            <Stamp text="NOT PEER REVIEWED" x={0} y={262} rot={3} p={ease(f, t9 + 14, 12)} size={24} color="#0B3B52" />
          </Sheet>
        </g>
        {/* the benchmark clip strip: sprocket frames, each a tiny fan */}
        <g transform={`translate(${540 - 520 * (1 - strip)},1250)`} opacity={strip}>
          <rect x={-480} y={-68} width={960} height={136} rx={8} fill="#02090B" stroke={SON.slateHi} strokeWidth={5} />
          {Array.from({length: 5}).map((_, i) => (
            <g key={i} transform={`translate(${-380 + i * 190},48)`}>
              <path d={fanPath(98)} fill={SON.fan} stroke={SON.mint} strokeWidth={3} />
              {Array.from({length: 4}).map((__, j) => <ellipse key={j} cx={-30 + ((f * (0.6 + j * 0.25) + i * 17 + j * 21) % 60)} cy={-30 - j * 15} rx={6} ry={3} fill={SON.echo} />)}
            </g>
          ))}
          {Array.from({length: 24}).map((_, i) => <rect key={i} x={-468 + i * 40} y={-60} width={14} height={9} rx={2} fill={SON.paper} opacity={0.5} />)}
        </g>
        <NearBank f={f} seed={3} />
      </SVG>
    </Frame>
  );
};

// ---- S4: counted by hand at a line (lines 4 and 5) -----------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t11 = b(11), t12 = b(12), t13 = b(13);
  const clicks = Math.floor(Math.max(0, f - t12) / 9);
  const thumb = bump(f, t12 + (clicks * 9), 8);
  const cam = track([{t: 0, z: 1.0, fx: 600, fy: 1040}, {t: p.dur, z: 1.06, fx: 540, fy: 1040}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="EXPERTS WATCH THE VIDEO · PER PREPRINT" y={560} size={30} tone="ink" p={ease(f, t11, 8) * (1 - ease(f, t13 + 4, 6))} />
        <Plate x={540} text="TALLY OF CROSSINGS, EACH DIRECTION" y={640} size={30} tone="paper" p={ease(f, t12 - 4, 8)} />
        <Plate x={540} text="COUNTS GUIDE HARVEST LIMITS · PER PREPRINT" y={720} size={28} tone="ink" p={ease(f, t13 + 8, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s4w" seed={4} />
        {/* the video the experts watch: a faceless sonar fan, no machine boxes in this shot */}
        <rect x={400} y={640} width={560} height={660} rx={22} fill="#04100D" stroke={SON.slateHi} strokeWidth={9} />
        <rect x={414} y={656} width={532} height={628} rx={14} fill="none" stroke={SON.mint} strokeWidth={3} opacity={0.35} />
        <Tag text="BENCHMARK CLIP" x={680} y={1262} size={22} />
        {Array.from({length: 13}).map((_, i) => <rect key={i} x={420 + i * 41} y={650} width={20} height={11} rx={3} fill={SON.paper} opacity={0.45} />)}
        <Wedge x={680} y={1214} s={0.64} f={f} id="s4" R={640} base={false} faceless lit={0.95} blobs={50} speed={1.5} dirRight={0.7} line="ruled" seed={4} />
        {/* a person with a clicker: the hand count, as the preprint says */}
        <ContactShadow cx={190} cy={1310} rx={130} ry={14} opacity={0.45} blur={9} />
        <g transform={`translate(${3 * Math.sin(f / 23)},${-4 * Math.abs(Math.sin(f / 19))}) rotate(${1.4 * Math.sin(f / 29)} 190 1310)`}><Character frame={f} pose="stand" emotion="neutral" outfit="puffer" headgear="beanie" facing={1} scale={0.8} x={190} y={1310} /></g>
        <g transform={`translate(${318 - 8 * thumb},${1090 + 8 * thumb}) scale(${1 + 0.08 * thumb})`}>
          <TallyCounter x={0} y={0} s={0.9} f={f} variant="clicker" count={String(clicks).padStart(4, '0')} spin={1} />
        </g>
        <NearBank f={f} seed={4} />
      </SVG>
    </Frame>
  );
};

// ---- S5: the dataset (line 6) --------------------------------------------------------------------------------------------------------------------
const SITES: Array<{x: number; y: number; ak: boolean}> = [
  {x: 360, y: 700, ak: true}, {x: 440, y: 640, ak: true}, {x: 480, y: 668, ak: true}, {x: 410, y: 676, ak: true},
  {x: 520, y: 820, ak: false}, {x: 500, y: 860, ak: false}, {x: 560, y: 920, ak: false}, {x: 575, y: 960, ak: false},
  {x: 540, y: 1050, ak: false}, {x: 570, y: 1090, ak: false}, {x: 590, y: 1130, ak: false},
];
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t14 = b(14), t15 = b(15), t16 = b(16), t46 = b(46);
  const cam = track([{t: 0, z: 1.04, fx: 520, fy: 960}, {t: p.dur, z: 1.0, fx: 560, fy: 980}]);
  const coast = ease(f, t14, 40);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="11 SITES · 9 RIVER SYSTEMS" y={520} size={30} tone="ink" p={ease(f, t15, 8)} />
        <Plate x={540} text="ALASKA · 3 KENAI SITES + 1 NUSHAGAK" y={590} size={26} tone="paper" p={ease(f, t46, 8)} />
        <Plate x={540} text="ALASKA · LARGER, DENSER POPULATIONS · PER PREPRINT" displayLines={['ALASKA · LARGER, DENSER', 'POPULATIONS · PER PREPRINT']} y={690} size={24} tone="ink" p={ease(f, t16, 8)} />
        <Plate x={540} text="4,363 CLIPS · 1.0M+ BOXES" y={1274} size={28} tone="ink" p={ease(f, t14 + 30, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s5w" seed={5} />
        <g transform="translate(0,150)">
          <path d="M 360,560 C 470,640 430,760 540,820 C 620,880 560,960 540,1040 C 530,1100 580,1140 640,1170" fill="none" stroke={SON.mint} strokeWidth={9} opacity={0.75} strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - coast)} />
          <text x={700} y={700} fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={2} fill={SON.paper} opacity={0.75}>ALASKA</text>
          <text x={700} y={1100} fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={2} fill={SON.paper} opacity={0.75}>N. CALIFORNIA</text>
          {SITES.map((s0, i) => {
            const k = ease(f, t14 + i * 5, 12);
            return (
              <g key={i} transform={`translate(${s0.x},${s0.y})`} opacity={k}>
                <circle r={20 + 4 * Math.sin(f / 8 + i)} fill={s0.ak ? SON.mint : 'none'} stroke={s0.ak ? INK : SON.mint} strokeWidth={s0.ak ? 5 : 6} />
                {s0.ak && <circle r={38} fill="none" stroke={SON.mint} strokeWidth={3} opacity={0.5 + 0.3 * Math.sin(f / 6 + i)} />}
              </g>
            );
          })}
          <circle cx={443} cy={661} r={78} fill="none" stroke={SON.mint} strokeWidth={4} opacity={ease(f, t46, 10)} />
        </g>
        <NearBank f={f} seed={5} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the question (line 7). The faced WEDGE is THE MODEL, labelled, and first appears here -----------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t17 = b(17), t18 = b(17) + 70;
  const q = ease(f, t17 + 6, 20);
  const snapZ = 1 + 0.25 * snap(f, t18 - 4, 14);
  const cam = track([{t: 0, z: 1.05, fx: 540, fy: 1060}, {t: p.dur, z: 1.1 * snapZ, fx: 620, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="CAN IT COUNT A RIVER IT NEVER SAW?" y={520} size={31} tone="violet" p={ease(f, t17, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s6w" seed={6} />
        <Wedge x={500} y={1130} s={0.85} f={f} id="s6" R={640} plaque="THE MODEL" mood="unsure" look={0.9} lit={0.95} dark={1} darkQ={q} darkFrom={11} blobs={70} speed={1.8} dirRight={0.9} tallyL={140} tallyR={612} line="bare" seed={6} />
        <NearBank f={f} seed={6} />
      </SVG>
    </Frame>
  );
};

// ---- S7: the direction score (line 8) -----------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t19 = b(19), t36 = b(36);
  const lean = 6 * Math.sin(f / 17) * (1 - ease(f, t36 + 20, 30)) + 3 * Math.sin(f / 9);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="NEW SCORE · DIRECTION OF ERROR" y={580} size={30} tone="ink" p={ease(f, t19, 8)} />
        <Plate x={540} text="TOO HIGH OR TOO LOW?" y={660} size={32} tone="paper" p={ease(f, t36, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s7w" seed={7} />
        <Wedge x={540} y={1150} s={0.76} f={f} id="s7" R={620} plaque="THE MODEL" dark={1} darkFrom={11} mood="squint" look={Math.sin(f / 20)} blobs={60} speed={1.5} dirRight={0.6} boxes={1} line="needle" lean={lean} tallyL={f * 0.35} tallyR={f * 0.38} seed={7} />
        <NearBank f={f} seed={7} />
      </SVG>
    </Frame>
  );
};

// ---- S14: the Kenai result (line 9): a river cross-section, two banks, two thin miss gauges -------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t20 = b(20), t21 = b(21), t22 = b(22), t23 = b(23), t50 = b(50);
  const lean = -1.6 * ease(f, t23 - 12, 24) + 0.35 * Math.sin(f / 15) * ease(f, t23, 10);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 940}, {t: p.dur, z: 1.0, fx: 540, fy: 1010}]);
  const gl = ease(f, t21 - 6, 30), gr = ease(f, t22 - 6, 30);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="KENAI BANK HELD OUT OF TRAINING" y={560} size={30} tone="paper" p={ease(f, t20, 8)} />
        <Plate x={540} text="LEFT BANK · MISS UNDER 0.07 (7%)" y={640} size={28} tone="ink" p={ease(f, t21, 8)} />
        <Plate x={540} text="RIGHT BANK · MISS UNDER 0.03 (3%)" y={720} size={28} tone="ink" p={ease(f, t22, 8)} />
        <Plate x={540} text="NEAR ZERO, NOT ZERO" y={800} size={30} tone="paper" p={ease(f, t23 + 4, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s14w" seed={14} />
        <rect x={80} y={640} width={920} height={680} rx={14} fill="#03100C" stroke={SON.slateHi} strokeWidth={8} />
        {Array.from({length: 18}).map((_, i) => <rect key={i} x={100 + i * 50} y={648} width={22} height={12} rx={3} fill={SON.paper} opacity={0.45} />)}
        <Wedge x={620} y={1110} s={0.42} f={f} id="s14" R={600} plaque="THE MODEL" mood="reading" look={0.4} dark={1 - ease(f, t21, 90)} darkFrom={11} blobs={50} speed={1.5} dirRight={0.55} boxes={1} line="needle" lean={lean} tallyL={f * 0.35} tallyR={f * 0.38} seed={14} />
        {/* the river in cross-section: a bank on each side, a thin vertical gauge standing on each */}
        <path d="M -40,1170 L 300,1170 Q 380,1230 540,1250 Q 700,1230 780,1170 L 1120,1170 L 1120,1330 L -40,1330 Z" fill="#0E3A30" stroke={SON.mint} strokeWidth={5} opacity={0.9} />
        {[0, 1].map((i) => {
          const gx = i ? 840 : 130;
          const val = i ? 0.03 : 0.07, k = i ? gr : gl;
          return (
            <g key={i} transform={`translate(${gx},1170)`}>
              <rect x={0} y={-320 * ease(f, t50, 14)} width={34} height={320 * ease(f, t50, 14)} rx={6} fill="#02130F" stroke={SON.slateHi} strokeWidth={4} />
              <rect x={4} y={-4 - 312 * (val / 0.8) * k} width={26} height={312 * (val / 0.8) * k} rx={3} fill={SON.mint} />
              <path d={`M -10,${-4 - 312 * (val / 0.8) * k} L 44,${-4 - 312 * (val / 0.8) * k}`} stroke={SON.paper} strokeWidth={4} />
              <Tag text={i ? 'RIGHT' : 'LEFT'} x={17} y={60} size={22} />
              <Tag text="0.80" x={17} y={-350} size={20} op={0.8} />
            </g>
          );
        })}
        <NearBank f={f} seed={14} />
      </SVG>
    </Frame>
  );
};

// ---- S8: a different ruler (line 10) -------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t24 = b(24), t25 = b(25), t39 = b(39);
  const cam = track([{t: 0, z: 1.06, fx: 540, fy: 1010}, {t: p.dur, z: 1.0, fx: 540, fy: 1000}]);
  const click = bump(f, t25, 24);
  const strike = ease(f, t39 - 6, 40);
  const c1 = Math.max(0, f - t24 - 20), c2 = Math.max(0, f - t24 - 26);
  const n1 = Math.min(100, Math.floor(c1 / 3)), n2 = Math.min(90, Math.floor(c2 / 3.3));
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="TWO PEOPLE, ONE VIDEO" y={560} size={30} tone="ink" p={ease(f, t24, 8)} />
        <Plate x={540} text="ABOUT 10% APART · INFORMAL" y={640} size={28} tone="paper" p={ease(f, t25, 8)} />
        <Plate x={540} text="NOT A SCOREBOARD" y={720} size={30} tone="ink" p={ease(f, t39, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s8w" mood="dusk" seed={8} />
        <g>
          <ContactShadow cx={540} cy={1224} rx={420} ry={20} opacity={0.4} blur={12} />
          <rect x={90} y={1130} width={900} height={110} rx={12} fill="#3A2E24" stroke={INK} strokeWidth={7} />
          <rect x={90} y={1130} width={900} height={16} rx={8} fill={SON.echoHi} opacity={0.25} />
        </g>
        <TallyCounter x={300} y={960 + 8 * Math.sin(f / 17) + 10 * Math.abs(Math.sin(f / 3.1)) * (n1 < 100 ? 1 : 0)} s={1.6} f={f} variant="clicker" count={String(n1).padStart(4, '0')} spin={1} />
        <TallyCounter x={640} y={960 + 8 * Math.sin(f / 15 + 1) + 10 * Math.abs(Math.sin(f / 3.4)) * (n2 < 90 ? 1 : 0)} s={1.6} f={f} variant="clicker" count={String(n2).padStart(4, '0')} spin={1} />
        <Tag text="ILLUSTRATIVE" x={470} y={1290} size={20} />
        {/* the thin Kenai gauge slides in to dock against the human ruler, its ticks do not line up, and it slides back */}
        <g transform="translate(470,820)" opacity={ease(f, t39 - 12, 10)}>
          <g transform={`translate(${300 - 260 * Math.sin(Math.PI * strike * 0.9)},0)`}>
            <rect x={-250} y={-16} width={500} height={30} rx={5} fill="#02130F" stroke={SON.mint} strokeWidth={4} />
            {Array.from({length: 20}).map((_, i) => <line key={i} x1={-250 + i * 26} x2={-250 + i * 26} y1={-16} y2={-4} stroke={SON.mint} strokeWidth={2.5} />)}
            <Tag text="MODEL MISS" x={0} y={50} size={20} />
          </g>
        </g>
        <g transform="translate(470,760)" opacity={ease(f, t25, 14)}>
          <rect x={-250} y={-12 + 20 * click} width={500} height={10} rx={4} fill={SON.paper} opacity={0.5} />
          <line x1={-250} x2={-250} y1={-34 + 20 * click} y2={4 + 20 * click} stroke={SON.gold} strokeWidth={5} />
          {Array.from({length: 11}).map((_, i) => <line key={i} x1={-250 + i * 50} x2={-250 + i * 50} y1={-12 + 20 * click} y2={-26 + 20 * click} stroke={SON.paper} strokeWidth={3} opacity={0.6} />)}
        </g>
        <NearBank f={f} seed={8} dusk />
      </SVG>
    </Frame>
  );
};

// ---- S9: the Nushagak held out (line 10) -----------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t26 = b(26), t48 = b(48);
  const lift = easeIO(f, t26 + 24, 50);
  const g = ease(f, t48 - 6, 30);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.0, fx: 540, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="HELD OUT OF TRAINING" y={560} size={32} tone="violet" p={ease(f, t26, 8)} />
        <Plate x={540} text="NUSHAGAK HELD OUT · MISS 0.035 (3.5%)" y={640} size={28} tone="ink" p={ease(f, t48, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s9w" seed={9} />
        {/* the clip strip scrolls, and the Nushagak clip is lifted out and set aside */}
        <g transform="translate(0,820)">
          <rect data-band="ok" x={-40} y={-80} width={1160} height={160} fill="#03100C" opacity={0.85} />
          {Array.from({length: 8}).map((_, i) => {
            if (i === 3) return null;
            const gx = ((i * 190 - f * 1.4) % 1520 + 1520) % 1520 - 190;
            return (
              <g key={i} transform={`translate(${gx},0)`}>
                <rect x={0} y={-52} width={170} height={104} rx={8} fill={SON.fan} stroke={SON.mint} strokeWidth={4} opacity={0.8} />
                {[0, 1, 2].map((j) => <ellipse key={j} cx={34 + j * 46 + 6 * Math.sin(f / 9 + i + j)} cy={-10 + j * 16} rx={9} ry={4.5} fill={SON.echo} />)}
              </g>
            );
          })}
          <rect x={620} y={-52} width={170} height={104} rx={8} fill="#03100C" stroke={SON.violet} strokeWidth={4} strokeDasharray="10 8" opacity={lift} />
          <g transform={`translate(620,${-90 * lift})`}>
            <rect x={0} y={-52} width={170} height={104} rx={8} fill={SON.fan} stroke={SON.violet} strokeWidth={4} />
            {[0, 1, 2].map((j) => <ellipse key={j} cx={34 + j * 46 + 6 * Math.sin(f / 9 + j)} cy={-18 + j * 14} rx={9} ry={4.5} fill={SON.echo} />)}
            <Tag text="NUSHAGAK" x={85} y={30} size={20} />
          </g>
        </g>
        <Wedge x={340} y={1190} s={0.62} f={f} id="s9a" R={600} plaque="THE MODEL" mood="reading" look={0.7} dark={1 - ease(f, t48, 50)} darkFrom={11} blobs={50} speed={1.4} boxes={1} line="bare" seed={9} />
        {/* a thin mint gauge for the held-out miss, 0.035 on a track that runs to 0.80 */}
        <g transform="translate(560,1000)">
          <rect x={0} y={0} width={400} height={34} rx={6} fill="#02130F" stroke={SON.slateHi} strokeWidth={4} />
          <rect x={4} y={4} width={Math.max(6, 392 * (0.035 / 0.8)) * g} height={26} rx={3} fill={SON.mint} />
          <Tag text="MISS 0 TO 0.80" x={200} y={72} size={20} />
          <line x1={-20} y1={48} x2={420} y2={48} stroke={SON.gold} strokeWidth={4} />
        </g>
        <NearBank f={f} seed={9} />
      </SVG>
    </Frame>
  );
};

// ---- S10: Mad River (line 12) --------------------------------------------------------------------------------------------------------------------
const TRACK = 430;
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t27 = b(27), t28 = b(28), t29 = b(29), t42 = b(42);
  const seen = ease(f, t42 - 4, 22);
  const unseen = ease(f, t28 - 2, 20);
  const cam = track([{t: 0, z: 1.08, fx: 540, fy: 1000}, {t: Math.max(1, t29 - 10), z: 1.08, fx: 540, fy: 1000}, {t: t29 + 40, z: 1.0, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="MAD RIVER · CALIFORNIA" y={520} size={30} tone="paper" p={ease(f, t27, 8)} />
        <Plate x={540} text="CALIFORNIA · IN TRAINING 0.33 · HELD OUT 0.80" y={600} size={26} tone="coral" p={ease(f, t28, 8)} />
        <Plate x={540} text="KENAI HELD OUT · 0.07 AND 0.03" y={680} size={28} tone="ink" p={ease(f, t29, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s10w" mood="dusk" seed={10} />
        <g transform="translate(330,1170)">
          <ContactShadow cx={150} cy={8} rx={210} ry={14} opacity={0.4} blur={8} />
          <rect x={0} y={-TRACK} width={120} height={TRACK} rx={5} fill="#02130F" stroke={SON.slateHi} strokeWidth={4} />
          <rect x={200} y={-TRACK} width={120} height={TRACK} rx={5} fill="#02130F" stroke={SON.slateHi} strokeWidth={4} />
          <rect x={4} y={-TRACK * seen * (0.33 / 0.8) - 4} width={112} height={TRACK * seen * (0.33 / 0.8)} rx={3} fill={SON.mint} stroke={INK} strokeWidth={3} />
          <rect x={204} y={-TRACK * unseen - 4 + 4} width={112} height={TRACK * unseen} rx={3} fill={SON.coral} stroke={INK} strokeWidth={3} />
          <line x1={-30} y1={0} x2={350} y2={0} stroke={SON.gold} strokeWidth={5} />
          <Tag text="IN TRAINING" x={60} y={56} size={22} />
          <Tag text="HELD OUT" x={260} y={56} size={22} />
          <Tag text="ABOUT A THIRD (0.33)" x={60} y={-TRACK * seen * (0.33 / 0.8) - 34} size={18} op={seen} />
          <Tag text="80% (0.80)" x={260} y={-TRACK - 34} size={22} op={unseen} />
          <g opacity={ease(f, t29, 16)}>
            <line x1={196} y1={-TRACK * (0.07 / 0.8)} x2={324} y2={-TRACK * (0.07 / 0.8)} stroke={SON.paper} strokeWidth={4} />
            <line x1={196} y1={-TRACK * (0.03 / 0.8)} x2={324} y2={-TRACK * (0.03 / 0.8)} stroke={SON.paper} strokeWidth={4} />
            <Tag text="KENAI 0.07 / 0.03" x={470} y={-TRACK * (0.05 / 0.8)} size={18} />
          </g>
        </g>
        <NearBank f={f} seed={10} dusk />
      </SVG>
    </Frame>
  );
};

// ---- S11: the Kenai channel doubled (line 13) -----------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t30 = b(30), t31 = b(31), t52 = b(52);
  const first = ease(f, t52 - 2, 22);
  const second = ease(f, t31 - 2, 22);
  const cam = track([{t: 0, z: 1.04, fx: 500, fy: 980}, {t: p.dur, z: 1.0, fx: 560, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="KENAI CHANNEL" y={520} size={32} tone="paper" p={ease(f, t30, 8) * (1 - ease(f, t31 + 4, 6))} />
        <Plate x={540} text="KENAI CHANNEL · IN TRAINING 0.14 · HELD OUT 0.29" y={600} size={24} tone="ink" p={ease(f, t31, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s11w" seed={11} />
        <g transform="translate(250,1230)">
          <ContactShadow cx={200} cy={8} rx={260} ry={14} opacity={0.4} blur={8} />
          <rect x={0} y={-430} width={160} height={430} rx={5} fill="#02130F" stroke={SON.slateHi} strokeWidth={4} />
          <rect x={240} y={-430} width={160} height={430} rx={5} fill="#02130F" stroke={SON.slateHi} strokeWidth={4} />
          <rect x={4} y={-430 * (0.143 / 0.8) * first - 4} width={152} height={430 * (0.143 / 0.8) * first} rx={3} fill={SON.mint} stroke={INK} strokeWidth={3} />
          <rect x={244} y={-430 * (0.286 / 0.8) * second - 4} width={152} height={430 * (0.286 / 0.8) * second} rx={3} fill={SON.mint} stroke={INK} strokeWidth={3} />
          <line x1={-30} y1={0} x2={430} y2={0} stroke={SON.gold} strokeWidth={5} />
          <Tag text="IN TRAINING" x={80} y={56} size={22} />
          <Tag text="HELD OUT" x={320} y={56} size={22} />
          <Tag text="0.80" x={200} y={-458} size={20} op={0.8} />
          <Tag text="14% (0.14)" x={80} y={-430 * (0.143 / 0.8) * first - 34} size={20} op={first} />
          <Tag text="29% (0.29)" x={320} y={-430 * (0.286 / 0.8) * second - 34} size={20} op={second} />
        </g>
        <NearBank f={f} seed={11} dusk />
      </SVG>
    </Frame>
  );
};

// ---- S12: built for deployment, no agency use reported (line 14) -----------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t32 = b(32), t33 = b(33);
  const reach = ease(f, t32 + 6, 40);
  const cam = track([{t: 0, z: 1.1, fx: 700, fy: 1060}, {t: p.dur, z: 1.1, fx: 380, fy: 1080}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="BUILT FOR DEPLOYMENT" y={560} size={32} tone="ink" p={ease(f, t32, 8)} />
        <Plate x={540} text="NO AGENCY USE REPORTED" y={640} size={32} tone="paper" p={ease(f, t33, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s12w" seed={12} />
        <Sheet x={300} y={930} w={380} h={460} rot={-4} f={f + p.from}>
          {Array.from({length: 6}).map((_, i) => <rect key={i} x={-130} y={-50 + i * 32} width={i === 5 ? 140 : 260} height={9} rx={4} fill="#0B1F26" opacity={0.16} />)}
          <Stamp text="PREPRINT" x={50} y={170} rot={-6} p={1} size={28} color="#0B3B52" />
        </Sheet>
        <text x={300} y={832} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={78} fill="#0B1F26">CFC26</text>
        <Wedge x={930} y={1000} s={0.4} f={f} id="s12g" R={620} base={false} ghost={0.95} blobs={0} line="bare" lit={0.2} rings={false} />
        <text x={930} y={860} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={100} fill={SON.violet} opacity={0.6 * (1 - 0.7 * ease(f, t33, 12))}>?</text>
        <Wedge x={700} y={1180} s={0.6} f={f} id="s12" R={560} plaque="THE MODEL" mood="idle" look={-0.6} blobs={30} speed={1.2} dirRight={0.7} line="bare" seed={12} />
        {/* the agency's bank sonar, and a dashed cable that stops one step short of it */}
        <Wedge x={250} y={1330} s={0.34} f={f} id="s12p" R={560} faceless lit={0.8} blobs={10} speed={1.0} line="bare" seed={22} />
        <path d={`M 560,1320 C 500,1330 ${520 - 150 * reach},1340 ${500 - 190 * reach},1328`} fill="none" stroke={SON.violet} strokeWidth={6} strokeDasharray="14 12" strokeDashoffset={-f * 0.6} strokeLinecap="round" />
        <NearBank f={f} seed={12} />
      </SVG>
    </Frame>
  );
};

// ---- S13: the button (line 15), the opening frame changed ------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const t34 = b(34), t35 = b(35), t44 = b(44), t49 = b(49), t51 = b(51);
  const out = ease(f, p.dur - 14, 12);
  const cam = track([{t: 0, z: 1.1, fx: 540, fy: 1010}, {t: p.dur, z: 1.0, fx: 600, fy: 1000}]);
  const short = ease(f, t35 - 10, 36);
  return (
    <Frame p={p} cam={cam} dim={out}
      overlay={<>
        <Plate x={540} text="A COUNT SOMEBODY USES · STILL MISSING" y={600} size={28} tone="violet" p={ease(f, t44, 8)} />
      </>}>
      <SVG>
        <SonarWater f={f + p.from} id="s13w" seed={13} />
        {/* the agency's lit fan at left, as in the opening, with its odometer slot above */}
        <Wedge x={420} y={1090} s={0.9} f={f} id="s13a" faceless plaque="FIELD SONAR" lit={0.95} dark={0} blobs={40} speed={1.6} dirRight={0.85} line="bare" seed={1} tallyL={f * 0.5} tallyR={f * 1.2} />
        {/* the dashed unlit fan at right, with the model standing at its edge and the line ending in an open hook */}
        <Wedge x={850} y={1010} s={0.52} f={f} id="s13g" R={620} base={false} ghost={Math.min(1, 0.95 + 0.3 * bump(f, t51, 18))} blobs={0} line="hook" dashFrom={0.4} hook={1} lit={0.2} rings={false} />
        <Wedge x={700} y={1250} s={0.34} f={f} id="s13m" R={600} base mood={f > t35 ? 'wide' : 'idle'} look={-0.7 + 1.6 * ease(f, t49, 14)} blobs={0} line="bare" lit={0.1} rings={false} />
        <g transform="translate(690,430)">
          <g opacity={ease(f, t44, 10)} transform={`translate(0,${-90 * (1 - ease(f, t44, 10))})`}>
            <rect x={0} y={0} width={96} height={104} rx={10} fill="none" stroke={SON.violet} strokeWidth={5} strokeDasharray="12 10" strokeDashoffset={-f * 0.5} />
            <text x={48} y={78} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={74} fill={SON.violet}>?</text>
          </g>
          <g opacity={ease(f, t44 + 4, 10)} transform={`translate(0,${-90 * (1 - ease(f, t44 + 4, 10))})`}>
            <rect x={112} y={0} width={96} height={104} rx={10} fill="none" stroke={SON.violet} strokeWidth={5} strokeDasharray="12 10" strokeDashoffset={-f * 0.5} />
            <text x={160} y={78} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={74} fill={SON.violet}>?</text>
          </g>
          <g opacity={ease(f, t44 + 8, 10)} transform={`translate(0,${-90 * (1 - ease(f, t44 + 8, 10))})`}>
            <rect x={224} y={0} width={96} height={104} rx={10} fill="none" stroke={SON.violet} strokeWidth={5} strokeDasharray="12 10" strokeDashoffset={-f * 0.5} />
            <text x={272} y={78} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={74} fill={SON.violet}>?</text>
          </g>
        </g>
        {/* one fish stops one step short of the dashed fan's line */}
        <g transform={`translate(${560 + 200 * short},${900})`}>
          <ellipse cx={0} cy={0} rx={22} ry={11} fill={SON.echo} stroke={INK} strokeWidth={3} />
          <circle cx={0} cy={0} r={34 + 4 * Math.sin(f / 5)} fill="none" stroke={SON.violet} strokeWidth={3} strokeDasharray="8 7" />
        </g>
        <NearBank f={f} seed={13} />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={SON.abyss} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={SON.mint}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'THE FLOOD', 2: 'TWO RIVERS', 3: 'THE PREPRINT', 4: 'COUNTED BY HAND', 5: 'THE DATA', 6: 'THE QUESTION', 7: 'THE KENAI', 8: 'DIFFERENT RULER', 9: 'HELD OUT', 10: 'MAD RIVER', 11: 'THE DARK HALF', 12: 'NOT DEPLOYED', 13: 'THE BUTTON', 14: 'KENAI RESULT', 15: 'FIFTEEN SITES'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15};
const SHOT_ORDER = [1, 2, 15, 3, 4, 5, 6, 7, 14, 9, 8, 10, 11, 12, 13];

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

export const ep1028Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1028Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1028: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 10, 16, 22, 36, 47, 54, 59, 65, 77, 85, 90, 103, 109, 115, 122].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: SON.abyss}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#06242B" ink="#F3EBD7" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
