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
import {Suit} from './lib/people';
import {SledDogTeam, Raven} from './lib/fauna';
import {FlightCrate} from './lib/clinic';
import {Drone} from './lib/polecam';
import {
  SER, Tag, SampleTube, CargoDrone, RadarEye, Ribbon, SightBubble, ResultTray, GroundStation, Village, SampleFridge,
  Train1925, Engine1925, DuskWorld, MapBoard, MapPin, MAP_PT, trailPts, loopPts, linePts, morphPts, Poles,
} from './lib/serum';
import {IDS} from './Ep1123Ids';

// Two Runs Out of Nenana, 2026-11-23. Palette roles are art_direction.json: apricot to plum dusk over lavender ice, scarlet for the
// ribbon ALONE, oxblood blood in frosted tubes, sepia ONLY for 1925, phosphor green ONLY for what is planned or machine-seen.
// The cargo drone has no face. Real people are faceless with boxed name tags. The radar is dashed and PLANNED in every frame, and
// never appears in the August 19th sequence. The loop is never a delivery and the laid-straight ribbon is a comparison only.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
const C = {ink: SER.ink, paper: SER.paper, plum: SER.plum, night: SER.night};

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

type Tone = 'plate' | 'dark' | 'sepia';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  plate: {fill: SER.paper, fg: SER.ink, edge: SER.ink},
  dark: {fill: '#2A2034', fg: '#FBF6EC', edge: '#FBF6EC'},
  sepia: {fill: '#EAD7B4', fg: '#3A2614', edge: '#3A2614'},
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

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; overlay?: React.ReactNode; bg?: string; warmth?: number; sepia?: boolean; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.22, overlay, bg = C.plum, warmth = 0.03, sepia = false, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: 540 + 12 * Math.sin(p.f / 110) + 8 * t, fy: 960};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: bg}} />
      <div style={{position: 'absolute', inset: 0, filter: sepia ? 'sepia(0.85) contrast(1.05) brightness(0.98)' : undefined, transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#2A2034" stroke="#FBF6EC" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#FBF6EC">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={sepia ? 0.09 : 0.05} warmth={warmth} />
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

// ---- THE MAP ON THE ICE (S1, S9, S13, S15) --------------------------------------------------------------------------------------------------
const MX = 40, MY = 560, MS = 1.0; // the map box placed in frame
const mp = (pt: [number, number]): [number, number] => [MX + pt[0] * MS, MY + pt[1] * MS];
const TRAIL = trailPts(48).map(mp);
const NEN = mp(MAP_PT.NENANA);
const NOME = mp(MAP_PT.NOME);
const LOOP = loopPts(NEN[0], NEN[1] - 46, 64, 46, 48, Math.PI / 2);
/** the ribbon laid ALONG the curving trail, stopping 621/674 of the way, offset a hair to the south so both read */
const alongTrail = (frac: number, n = 48): [number, number][] => {
  const cum = [0];
  for (let i = 1; i < TRAIL.length; i++) cum.push(cum[i - 1] + Math.hypot(TRAIL[i][0] - TRAIL[i - 1][0], TRAIL[i][1] - TRAIL[i - 1][1]));
  const total = cum[cum.length - 1] * frac;
  return Array.from({length: n}, (_, k) => {
    const d = (total * k) / (n - 1);
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const t = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    const x = TRAIL[i - 1][0] + (TRAIL[i][0] - TRAIL[i - 1][0]) * t, y = TRAIL[i - 1][1] + (TRAIL[i][1] - TRAIL[i - 1][1]) * t;
    const dx = TRAIL[i][0] - TRAIL[i - 1][0], dy = TRAIL[i][1] - TRAIL[i - 1][1], L = Math.hypot(dx, dy) || 1;
    return [x - (dy / L) * 14, y + (dx / L) * 14] as [number, number];
  });
};
const LINE = alongTrail(621 / 674);
const VILLAGE_PT = mp([360, 352]);

/** the river-ice ground seen from above: the far shore and dusk at the top, drifts and sled tracks below */
const IceFromAbove: React.FC<{f: number; seed?: number; night?: number; children?: React.ReactNode}> = ({f, seed = 1, night = 0, children}) => (
  <g>
    <defs>
      <linearGradient id={`iceA${seed}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={night ? '#7D7090' : '#BFAFCB'} /><stop offset="0.5" stopColor={SER.snow} /><stop offset="1" stopColor={SER.snowD} />
      </linearGradient>
      <linearGradient id={`skyA${seed}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={SER.night} /><stop offset="0.55" stopColor={SER.mauve} /><stop offset="1" stopColor={night ? SER.mauve : SER.apricot} />
      </linearGradient>
    </defs>
    <rect data-band="ok" x={-120} y={-120} width={1320} height={520} fill={`url(#skyA${seed})`} />
    {Array.from({length: 26}, (_, i) => (
      <circle key={i} cx={h01(i, seed) * 1080} cy={30 + h01(i + 7, seed) * 220} r={1.5 + h01(i + 3, seed) * 1.5} fill="#FFF6E8" opacity={0.5 + 0.5 * Math.sin(f / 25 + i)} />
    ))}
    <path d={`M -120 400 ${Array.from({length: 14}, (_, i) => `L ${-100 + i * 100} ${330 - 70 * h01(i, seed + 2)} L ${-50 + i * 100} ${360 - 30 * h01(i + 5, seed)}`).join(' ')} L 1200 400 Z`} fill="#6E5B80" stroke={C.ink} strokeWidth={4} />
    {Array.from({length: 36}, (_, i) => {
      const x = -60 + i * 34 + 10 * h01(i, seed);
      const h = 50 + 40 * h01(i + 20, seed);
      return <path key={i} d={`M ${x} 420 L ${x + 15} ${420 - h} L ${x + 30} 420 Z`} fill={SER.spruce} stroke={C.ink} strokeWidth={2} />;
    })}
    <rect data-band="ok" x={-120} y={410} width={1320} height={1640} fill={`url(#iceA${seed})`} />
    {Array.from({length: 9}, (_, i) => (
      <path key={i} d={`M ${-80 + h01(i, seed) * 200} ${480 + i * 160} q 300 ${-30 + 60 * h01(i + 2, seed)} 640 ${-10} t 600 10`} stroke="#FFFFFF" strokeWidth={3} opacity={0.35} fill="none" />
    ))}
    {children}
    {/* near plane under the caption bar: sled runner tracks, a lantern, drifts */}
    <g data-band="ok">
      <path d="M -60 1560 Q 400 1500 1140 1590" stroke={SER.snowD} strokeWidth={8} fill="none" />
      <path d="M -60 1600 Q 400 1540 1140 1630" stroke={SER.snowD} strokeWidth={8} fill="none" />
      {Array.from({length: 5}, (_, i) => {
        const x = -40 + i * 250 + 40 * h01(i, seed + 9);
        const yy = 1790 + 50 * h01(i + 4, seed);
        return <path key={i} d={`M ${x} 1960 Q ${x + 70} ${yy} ${x + 160} ${yy + 12} Q ${x + 220} ${yy + 20} ${x + 280} 1960 Z`} fill={i % 2 ? '#E7E0EE' : '#D9D0E3'} stroke={C.ink} strokeWidth={3} />;
      })}
      <g transform={`translate(880 1660)`}>
        <ContactShadow cx={0} cy={6} rx={50} ry={10} opacity={0.4} />
        <rect x={-26} y={-80} width={52} height={80} rx={8} fill="#3A3040" stroke={C.ink} strokeWidth={4} />
        <rect x={-18} y={-70} width={36} height={56} rx={4} fill={SER.warm} opacity={0.8 + 0.2 * Math.sin(f / 5)} />
        <ellipse cx={0} cy={-40} rx={90} ry={60} fill={SER.warm} opacity={0.12} />
        <path d="M -16 -80 Q 0 -110 16 -80" stroke={C.ink} strokeWidth={4} fill="none" />
      </g>
    </g>
  </g>
);

/** sepia paw prints along a polyline, revealed 0..1 */
const PawTrail: React.FC<{pts: [number, number][]; reveal: number; f: number; s?: number}> = ({pts, reveal, f, s = 1}) => {
  const n = Math.round(pts.length * clamp01(reveal));
  return (
    <g>
      <path d={pts.slice(0, Math.max(2, n)).map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ')} fill="none" stroke={SER.sepiaD} strokeWidth={10 * s} strokeDasharray={`${4 * s} ${14 * s}`} strokeLinecap="round" opacity={0.9} />
      {pts.slice(0, n).filter((_, i) => i % 3 === 0).map((q, i) => (
        <g key={i} transform={`translate(${q[0]} ${q[1] + (i % 2 ? -9 : 9) * s}) scale(${s})`} opacity={0.85}>
          <ellipse cx={0} cy={0} rx={5} ry={4} fill={SER.sepiaD} />
          {[-4, 0, 4].map((dx) => <circle key={dx} cx={dx - 4} cy={-6} r={1.8} fill={SER.sepiaD} />)}
        </g>
      ))}
    </g>
  );
};

/** the sepia dog team at map scale */
const MapDogs: React.FC<{f: number; x: number; y: number; s?: number; facing?: 1 | -1; dogs?: number; vx?: number}> = ({f, x, y, s = 0.32, facing = -1, dogs = 4, vx = 6}) => (
  <g filter="url(#sep1925)">
    <SledDogTeam f={f} x={x} y={y} scale={s} facing={facing} dogs={dogs} vx={vx} />
  </g>
);

const SepiaDefs: React.FC = () => (
  <defs>
    <filter id="sep1925"><feColorMatrix type="matrix" values="0.40 0.75 0.19 0 0.02  0.35 0.68 0.17 0 0  0.27 0.53 0.13 0 -0.02  0 0 0 1 0" /></filter>
  </defs>
);

// ---- S1 two runs (L0) --------------------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b1 = p.b(1), b2 = p.b(2), b3 = p.b(3);
  const trail = clamp01((f - 4) / Math.max(1, b2 + 10 - 4));
  const dogAt = TRAIL[Math.min(47, Math.round(trail * 47))];
  const loopK = clamp01((f - b3 + 14) / 26);
  const sh = LOOP[Math.min(47, Math.round(loopK * 47))];
  const sh2 = LOOP[Math.min(47, Math.round(loopK * 47) + 1)] ?? sh;
  const ang = (Math.atan2(sh2[1] - sh[1], sh2[0] - sh[0]) * 180) / Math.PI;
  const shut = f > b3 + 12 ? 1 - 0.1 * Math.sin(clamp01((f - b3 - 12) / 10) * Math.PI) : 1;
  const glance = clamp01((f - b3 + 20) / 10) * (1 - clamp01((f - b3 + 4) / 8));
  const cam = track([{t: 0, z: 1.2, fx: 520, fy: 900}, {t: b2 + 10, z: 1.12, fx: 520, fy: 910}, {t: p.dur, z: 1.15, fx: 540, fy: 920}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="TWO RUNS · ONE TOWN" x={540} y={560} size={40} p={win(f, b1 + 2, b2)} />
        <Plate text="ALL THE WAY · NOME" x={540} y={640} size={36} tone="sepia" p={win(f, b2 + 4, b3 + 2)} /> {/* plate-overlap-ok */}
        <Plate text="1,000 KM · ONE LOOP" x={540} y={720} size={38} p={win(f, b3 + 8)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <SepiaDefs />
        <IceFromAbove f={f} seed={1}>
          <HeldTravel f={f} x={MX} y={MY} w={1000} h={700} mode="shadow" seed={13}>
            <MapBoard f={f} x={MX} y={MY} s={MS} seed={1} />
          </HeldTravel>
          <PawTrail pts={TRAIL} reveal={trail} f={f} />
          <MapPin f={f} x={NOME[0]} y={NOME[1]} />
          <Tag x={NOME[0] - 10} y={NOME[1] - 44} text="NOME" size={22} />
          <MapPin f={f} x={VILLAGE_PT[0]} y={VILLAGE_PT[1]} color="#8C8496" pulse={glance} />
          <g transform={`translate(${NEN[0]} ${NEN[1]}) scale(${shut}) translate(${-NEN[0]} ${-NEN[1]})`}>
            {loopK > 0 && <Ribbon f={f} pts={LOOP} reveal={loopK} w={14} seed={1} />}
          </g>
          <MapPin f={f} x={NEN[0]} y={NEN[1]} color={SER.warm} />
          <Tag x={NEN[0] + 70} y={NEN[1] + 40} text="NENANA" size={22} />
          <MapDogs f={f} x={dogAt[0]} y={dogAt[1] + 6} />
          {loopK > 0 && loopK < 1 && <CargoDrone f={f} x={sh[0]} y={sh[1]} view="top" scale={0.12} rot={ang} shadowOnly />}
        </IceFromAbove>
      </SVG>
    </Frame>
  );
};

// ---- S2 1925 (L1-L2) ------------------------------------------------------------------------------------------------------------------------
const Depot: React.FC<{f: number; x: number; y: number; swing: number}> = ({f, x, y, swing}) => (
  <g transform={`translate(${x} ${y})`}>
    <ContactShadow cx={0} cy={0} rx={240} ry={16} opacity={0.4} />
    <rect x={-220} y={-200} width={300} height={200} fill={SER.sepia} stroke={C.ink} strokeWidth={6} />
    <path d="M -250 -200 L -70 -290 L 110 -200 Z" fill={SER.sepiaD} stroke={C.ink} strokeWidth={6} />
    {[-180, -90].map((dx) => <rect key={dx} x={dx} y={-150} width={60} height={70} fill={SER.warm} opacity={0.7} stroke={C.ink} strokeWidth={4} />)}
    <rect x={10} y={-120} width={50} height={120} fill={SER.sepiaD} stroke={C.ink} strokeWidth={4} />
    {/* the sign post with the ribbon */}
    <rect x={150} y={-260} width={14} height={260} fill={SER.sepiaD} stroke={C.ink} strokeWidth={4} />
    <g transform={`translate(157 -250) rotate(${swing * 8 * Math.sin(f / 5)})`}>
      <path d="M -70 0 L -70 16 M 70 0 L 70 16" stroke={C.ink} strokeWidth={4} />
      <rect x={-110} y={16} width={220} height={54} fill="#EAD7B4" stroke={C.ink} strokeWidth={5} />
      <text x={0} y={54} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>NENANA</text>
    </g>
    <g transform="translate(157 -120)">
      <path d={`M -10 0 q 10 -10 20 0 q -10 10 -20 0`} fill={SER.ribbon} stroke={C.ink} strokeWidth={3} />
      <path d={`M 4 4 q ${30 + 6 * Math.sin(f / 6)} 20 ${60} ${30 + 8 * Math.sin(f / 7)}`} stroke={C.ink} strokeWidth={13} fill="none" strokeLinecap="round" />
      <path d={`M 4 4 q ${30 + 6 * Math.sin(f / 6)} 20 ${60} ${30 + 8 * Math.sin(f / 7)}`} stroke={SER.ribbon} strokeWidth={8} fill="none" strokeLinecap="round" />
    </g>
  </g>
);

const S2: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b4 = p.b(4), b5 = p.b(5), b6 = p.b(6);
  const nome = 1 - easeIO(f, b5 - 10, 16);
  const trainX = lerp(1500, 520, easeIO(f, b5 - 6, Math.max(20, b6 - b5 + 6)));
  const cam = track([{t: 0, z: 1.05, fx: 540, fy: 960}, {t: b5, z: 1.03, fx: 560, fy: 980}, {t: p.dur, z: 1.07, fx: 520, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} sepia vignette={0.34} overlay={
      <g>
        <Plate text="NOME · JANUARY 1925 · DIPHTHERIA" x={540} y={580} size={32} tone="sepia" p={win(f, b4 + 4, b5 - 4)} />
        <Plate text="BY TRAIN TO NENANA" x={540} y={660} size={36} tone="sepia" p={win(f, b5 + 4, b6)} /> {/* plate-overlap-ok */}
        <Plate text="RAILROAD'S CLOSEST POINT TO NOME" x={540} y={740} size={30} tone="sepia" p={win(f, b6 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <DuskWorld f={f} seed={2} horizon={1140} sun={0.3} stars={0.9}>
          {nome > 0.01 && (
            <g opacity={nome}>
              <Poles f={f} y={1120} top={480} n={5} x0={60} gapX={250} sepia birds={false} />
              <HeldTravel f={f} x={80} y={900} w={920} h={260} mode="shadow" seed={21}>
                <Village f={f} x={540} y={1200} s={1.15} glow={0.6} seed={2} runway={false} sign={false} />
              </HeldTravel>
              {Array.from({length: 40}, (_, i) => (
                <circle key={i} cx={(h01(i, 4) * 1200 + f * (1.5 + h01(i, 5))) % 1180 - 50} cy={(h01(i, 6) * 900 + f * 3) % 900 + 400} r={3} fill="#fff" opacity={0.7} />
              ))}
            </g>
          )}
          {nome < 0.99 && (
            <g opacity={1 - nome}>
              <Poles f={f} y={1160} top={470} n={5} x0={100} gapX={260} sepia />
              <Train1925 f={f} x={trainX} y={1300} s={1.3} speed={f > b6 ? 0.1 : 1} />
              <g transform="translate(300 1270) scale(1.3) translate(-300 -1270)"><Depot f={f} x={300} y={1270} swing={clamp01((f - b6) / 30)} /></g>
              <g transform="translate(820 860)">
                <rect x={-150} y={-100} width={300} height={200} rx={8} fill="#EAD7B4" stroke={C.ink} strokeWidth={5} opacity={clamp01((f - b6) / 12)} />
                <g opacity={clamp01((f - b6) / 12)}>
                  <path d="M -120 40 Q -60 -40 0 10 Q 60 50 120 -30" fill="none" stroke={SER.sepiaD} strokeWidth={3} />
                  <circle cx={100} cy={-20} r={8} fill={SER.warm} stroke={C.ink} strokeWidth={3} />
                  <circle cx={-110} cy={30} r={8} fill={C.paper} stroke={C.ink} strokeWidth={3} />
                  <path d={`M 100 -20 L ${lerp(100, -110, easeIO(f, b6, 30))} ${lerp(-20, 30, easeIO(f, b6, 30))}`} stroke={C.ink} strokeWidth={4} strokeDasharray="8 8" />
                </g>
              </g>
            </g>
          )}
        </DuskWorld>
      </SVG>
    </Frame>
  );
};

// ---- S3 the relay (L3-L4) ----------------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b7 = p.b(7), b8 = p.b(8), b9 = p.b(9), b10 = p.b(10);
  const teamX = lerp(1300, 140, clamp01(f / Math.max(1, b9 + 20)));
  const count = Math.round(674 * easeIO(f, b8, 40));
  const drop = clamp01((f - b10) / 26);
  const cam = track([{t: 0, z: 1.04, fx: 600, fy: 1000}, {t: b9, z: 1.04, fx: 480, fy: 1000}, {t: p.dur, z: 1.09, fx: 640, fy: 1020}]);
  return (
    <Frame p={p} cam={cam} sepia vignette={0.32} overlay={
      <g>
        <Plate text="20 MUSHERS · RELAY" x={540} y={570} size={36} tone="sepia" p={win(f, b7 + 4, b8)} />
        <Plate text="NENANA TO NOME · 674 MILES · DOG TEAMS" displayLines={['NENANA TO NOME · 674 MILES', 'DOG TEAMS']} x={540} y={660} size={32} tone="sepia" p={win(f, b8 + 4, b9)} /> {/* plate-overlap-ok */}
        <Plate text="1925 · AN ENGINE AT 40 BELOW?" x={540} y={760} size={34} tone="sepia" p={win(f, b9 + 4, b10)} /> {/* plate-overlap-ok */}
        <Plate text="NOBODY KNEW · PER UAF SCIENCE FORUM" x={540} y={840} size={30} tone="sepia" p={win(f, b10 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <DuskWorld f={f} seed={3} horizon={1080} sun={0.5}>
          <Poles f={f} y={1090} top={480} n={5} x0={40} gapX={270} sepia />
          {/* mileage marker */}
          <g transform="translate(300 1250)">
            <ContactShadow cx={0} cy={4} rx={60} ry={10} opacity={0.4} />
            <rect x={-10} y={-200} width={20} height={200} fill={SER.sepiaD} stroke={C.ink} strokeWidth={4} />
            <HeldTravel f={f} x={-90} y={-260} w={180} h={74} mode="sweep" seed={31}>
              <g>
                <rect x={-90} y={-260} width={180} height={74} rx={6} fill="#EAD7B4" stroke={C.ink} strokeWidth={5} />
                <text x={0} y={-210} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} fill={C.ink}>{String(count).padStart(3, '0')}</text>
              </g>
            </HeldTravel>
            <Tag x={0} y={-150} text="MILES" size={18} />
          </g>
          <Engine1925 f={f} x={820} y={1270} s={1.45} drop={drop} shiver={f > b9 - 10 ? 1 : 0.3} />
          {/* the team, a faceless musher on the sled */}
          <g transform={`translate(${teamX} 0)`}>
            <SledDogTeam f={f} x={0} y={1300} scale={1.7} facing={-1} dogs={6} vx={3} />
            <g transform="translate(760 1300) scale(1.3)">
              <ContactShadow cx={0} cy={4} rx={120} ry={12} opacity={0.4} />
              <path d="M -110 0 L 110 0 Q 130 -4 136 -20" stroke={C.ink} strokeWidth={7} fill="none" />
              <rect x={-90} y={-60} width={170} height={50} rx={6} fill={SER.sepiaD} stroke={C.ink} strokeWidth={5} />
              <path d="M 70 -60 L 70 -150" stroke={C.ink} strokeWidth={6} />
              <Suit f={f} x={60} y={-10} s={0.75} seed={7} cues={[b7, b9, b10]} face={false} coat={SER.sepiaD} trousers="#5A3E22" skin="#C9A27A" hair="#3A2614" reach={0.3 + 0.7 * Math.sin(clamp01((f - b9 - 10) / 24) * Math.PI)} facing={f > b9 && f < b9 + 14 ? 1 : -1} />
            </g>
          </g>
        </DuskWorld>
      </SVG>
    </Frame>
  );
};

// ---- S4 August 19th (L5) -----------------------------------------------------------------------------------------------------------------------
const Hangar: React.FC<{f: number; x: number; y: number; door: number}> = ({f, x, y, door}) => (
  <g transform={`translate(${x} ${y})`}>
    <ContactShadow cx={150} cy={0} rx={300} ry={18} opacity={0.4} />
    <path d="M -100 0 L -100 -260 Q 150 -380 400 -260 L 400 0 Z" fill="#5A4E66" stroke={C.ink} strokeWidth={7} />
    <rect x={-40} y={-230} width={380} height={230} fill={SER.warm} opacity={0.35 * door} />
    <rect x={-40} y={-230} width={380 * (1 - door)} height={230} fill="#6E6280" stroke={C.ink} strokeWidth={5} />
    {Array.from({length: 7}, (_, i) => <line key={i} x1={-40 + i * 54 * (1 - door)} x2={-40 + i * 54 * (1 - door)} y1={-230} y2={0} stroke={C.ink} strokeWidth={2} opacity={0.5} />)}
    <g transform="translate(-40 -180)">
      <path d={`M 0 0 q ${20 + 6 * Math.sin(f / 6)} 26 ${40} ${50 + 8 * Math.sin(f / 7)}`} stroke={C.ink} strokeWidth={13} fill="none" strokeLinecap="round" />
      <path d={`M 0 0 q ${20 + 6 * Math.sin(f / 6)} 26 ${40} ${50 + 8 * Math.sin(f / 7)}`} stroke={SER.ribbon} strokeWidth={8} fill="none" strokeLinecap="round" />
    </g>
    <Tag x={150} y={-300} text="NENANA" size={22} />
  </g>
);

const RunwayLights: React.FC<{f: number; y: number; n?: number}> = ({f, y, n = 10}) => (
  <g>
    {Array.from({length: n}, (_, i) => (
      <g key={i}>
        <circle cx={-40 + i * 130} cy={y} r={9} fill={SER.warm} stroke={C.ink} strokeWidth={2.5} opacity={0.6 + 0.4 * Math.sin(f / 6 + i)} />
        <ellipse cx={-40 + i * 130} cy={y} rx={30} ry={10} fill={SER.warm} opacity={0.18} />
      </g>
    ))}
  </g>
);

const S4: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b11 = p.b(11), b12 = p.b(12);
  const door = easeIO(f, 0, 18);
  const roll = easeIO(f, b11, Math.max(24, b12 - b11));
  const lift = easeIO(f, b12, 40);
  const dx = lerp(200, 700, roll) + 500 * lift;
  const dy = 1250 - 520 * lift;
  const cam = track([{t: 0, z: 1.05, fx: 440, fy: 1040}, {t: b12, z: 1.04, fx: 580, fy: 1000}, {t: p.dur, z: 1.06, fx: 640, fy: 900}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="NENANA · AUGUST 19TH" x={540} y={580} size={38} p={win(f, b11 + 4, b12 + 6)} />
        <Plate text="TAKES OFF" x={540} y={660} size={38} tone="dark" p={win(f, b12 + 10)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <DuskWorld f={f} seed={4} horizon={1160} sun={1} stars={0.2} summer>
          <Poles f={f} y={1170} top={500} n={5} x0={200} gapX={250} />
          <rect data-band="ok" x={-60} y={1200} width={1200} height={110} fill="#77727E" stroke={C.ink} strokeWidth={4} />
          {Array.from({length: 9}, (_, i) => <rect key={i} x={-20 + i * 140 - ((f * 6 * roll) % 140)} y={1250} width={70} height={10} fill="#F3EEF6" opacity={0.7} />)}
          <RunwayLights f={f} y={1206} />
          <RunwayLights f={f} y={1306} />
          <Hangar f={f} x={60} y={1200} door={door} />
          <HeldTravel f={f} x={dx - 300} y={dy - 160} w={600} h={180} mode="sweep" seed={41}>
            <CargoDrone f={f} x={dx} y={dy} scale={1.0} prop={0.5 + 0.5 * roll} rot={-10 * lift} gear groundY={lift < 0.05 ? 1252 : undefined} />
          </HeldTravel>
        </DuskWorld>
      </SVG>
    </Frame>
  );
};

// ---- S5 the aircraft from above, August flats (L6) --------------------------------------------------------------------------------------
const Flats: React.FC<{f: number; seed?: number}> = ({f, seed = 5}) => (
  <g>
    <rect data-band="ok" x={-120} y={-120} width={1320} height={2160} fill="#7E9660" />
    {Array.from({length: 60}, (_, i) => (
      <ellipse key={i} cx={h01(i, seed) * 1100} cy={h01(i + 30, seed) * 1960} rx={30 + 50 * h01(i + 2, seed)} ry={20 + 30 * h01(i + 5, seed)} fill={i % 3 ? '#6E8650' : '#93A86E'} opacity={0.7} />
    ))}
    <path d={`M -120 ${560 + 10 * Math.sin(f / 60)} C 200 700, 300 900, 520 980 S 900 1200, 1200 1340`} stroke="#4E6A7A" strokeWidth={130} fill="none" />
    <path d={`M -120 ${560 + 10 * Math.sin(f / 60)} C 200 700, 300 900, 520 980 S 900 1200, 1200 1340`} stroke="#9FB8C0" strokeWidth={96} fill="none" />
    {Array.from({length: 8}, (_, i) => <path key={i} d={`M ${(i * 160 + f * 0.8) % 1200 - 60} ${700 + i * 90} q 30 -6 60 0`} stroke="#E4F0F2" strokeWidth={4} opacity={0.6} fill="none" />)}
    {Array.from({length: 80}, (_, i) => {
      const x = h01(i + 9, seed + 1) * 1100, y = h01(i + 40, seed + 1) * 1960;
      return <path key={`t${i}`} d={`M ${x} ${y} l 10 -24 l 10 24 Z`} fill={i % 5 === 0 ? '#8AA040' : '#2F5A3A'} stroke={C.ink} strokeWidth={2} />;
    })}
  </g>
);

const S5: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b13 = p.b(13);
  const t = clamp01(f / Math.max(1, p.dur));
  const x = lerp(1000, 120, t), y = lerp(760, 1180, t);
  const cam = track([{t: 0, z: 1.04, fx: 560, fy: 960}, {t: p.dur, z: 1.08, fx: 520, fy: 980}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <Plate text="WINDRACERS ULTRA · TWIN ENGINE" x={540} y={600} size={34} p={win(f, Math.max(2, b13))} />
    }>
      <SVG>
        <Flats f={f} />
        <CargoDrone f={f} x={x + 120} y={y + 150} view="top" scale={0.9} rot={208} shadowOnly />
        <HeldTravel f={f} x={x - 300} y={y - 300} w={600} h={600} mode="sweep" seed={51}>
          <CargoDrone f={f} x={x} y={y} view="top" scale={0.9} rot={208} />
        </HeldTravel>
      </SVG>
    </Frame>
  );
};

// ---- S6 the pilots (L7) ------------------------------------------------------------------------------------------------------------------------
const Room: React.FC<{f: number; seed?: number; lamp?: number; children?: React.ReactNode}> = ({f, seed = 1, lamp = 0, children}) => (
  <g>
    <rect data-band="ok" x={-120} y={-120} width={1320} height={1400} fill="#3A2E48" />
    {Array.from({length: 12}, (_, i) => <line key={i} x1={-120 + i * 110} x2={-120 + i * 110} y1={-120} y2={1280} stroke="#2E2440" strokeWidth={6} />)}
    {/* a window onto the dusk runway */}
    <g transform="translate(540 520)">
      <rect x={-300} y={-220} width={600} height={300} fill="#2A2034" stroke={C.ink} strokeWidth={8} />
      <rect x={-286} y={-206} width={572} height={272} fill={SER.mauve} />
      <rect x={-286} y={-30} width={572} height={96} fill={SER.apricot} />
      <path d={`M -286 20 ${Array.from({length: 10}, (_, i) => `L ${-286 + i * 64} ${-10 - 30 * h01(i, seed)}`).join(' ')} L 286 20 Z`} fill="#6E5B80" />
      <rect x={-286} y={40} width={572} height={26} fill="#8E8099" />
      {Array.from({length: 8}, (_, i) => <circle key={i} cx={-260 + i * 74} cy={50} r={4} fill={SER.warm} opacity={0.6 + 0.4 * Math.sin(f / 6 + i)} />)}
      <line x1={0} y1={-206} x2={0} y2={66} stroke={C.ink} strokeWidth={8} />
      <line x1={-286} y1={-80} x2={286} y2={-80} stroke={C.ink} strokeWidth={6} />
    </g>
    {children}
    <rect data-band="ok" x={-120} y={1280} width={1320} height={760} fill="#4A3C58" />
    {Array.from({length: 8}, (_, i) => <line key={i} x1={-120} x2={1200} y1={1300 + i * 80} y2={1300 + i * 80} stroke="#3A2E48" strokeWidth={4} />)}
    <g data-band="ok">
      {/* the floor: a cable run, a tool case and a stack of sample boxes, varied by seed */}
      <path d={`M -60 ${1640 + 30 * h01(seed, 1)} C 200 ${1600 + 40 * h01(seed, 2)}, 500 ${1720}, 1140 ${1660 + 30 * h01(seed, 3)}`} stroke={C.ink} strokeWidth={14} fill="none" />
      <path d={`M -60 ${1640 + 30 * h01(seed, 1)} C 200 ${1600 + 40 * h01(seed, 2)}, 500 ${1720}, 1140 ${1660 + 30 * h01(seed, 3)}`} stroke="#2A2630" strokeWidth={8} fill="none" />
      <g transform={`translate(${160 + 140 * h01(seed, 4)} 1760)`}>
        <ellipse cx={0} cy={4} rx={120} ry={14} fill={C.ink} opacity={0.35} />
        <rect x={-110} y={-90} width={220} height={90} rx={10} fill="#8A3A3A" stroke={C.ink} strokeWidth={5} />
        <rect x={-40} y={-108} width={80} height={22} rx={8} fill="none" stroke={C.ink} strokeWidth={6} />
        <rect x={-100} y={-56} width={200} height={10} fill="#6E2A2A" />
      </g>
      <g transform={`translate(${760 + 120 * h01(seed, 5)} 1800)`}>
        <ellipse cx={0} cy={4} rx={110} ry={12} fill={C.ink} opacity={0.35} />
        {[0, 1, 2].map((k) => <rect key={k} x={-90 + k * 8} y={-70 - k * 66} width={180 - k * 16} height={64} rx={4} fill={k % 2 ? '#B89A6A' : '#A4865A'} stroke={C.ink} strokeWidth={4} />)}
        <rect x={-30} y={-60} width={60} height={22} fill={SER.paper} stroke={C.ink} strokeWidth={2} />
      </g>
    </g>
    {lamp > 0 && <ellipse cx={540} cy={1100} rx={460} ry={300} fill={SER.warm} opacity={0.08 * lamp} />}
  </g>
);

const S6: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b14 = p.b(14), b15 = p.b(15);
  const cam = track([{t: 0, z: 1.06, fx: 540, fy: 1000}, {t: p.dur, z: 1.1, fx: 560, fy: 1020}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="FLOWN BY UAF PILOTS · REMOTELY" x={540} y={560} size={34} p={win(f, b14 + 4, b15 + 4)} />
        <Plate text="UAF DRONE CENTER" x={540} y={640} size={36} tone="dark" p={win(f, b15 + 6)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <Room f={f} seed={6}>
          <HeldTravel f={f} x={240} y={760} w={600} h={540} mode="shadow" seed={61}>
            <GroundStation f={f} x={540} y={1290} s={1.0} loopK={clamp01((f - b14) / 60)} clock="" />
          </HeldTravel>
          <Suit f={f} x={540} y={1310} s={1.5} seed={3} cues={[b14, b15]} face={false} coat="#5A4E66" trousers="#2E2440" reach={0.55 + 0.1 * Math.sin(f / 9)} facing={1} />
          <g transform="translate(640 1050)"><Tag x={0} y={0} text="UAF PILOT" size={20} /></g>
        </Room>
      </SVG>
    </Frame>
  );
};

// ---- S7 two samples (L8-L9) --------------------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b16 = p.b(16), b17 = p.b(17), b18 = p.b(18), b19 = p.b(19);
  const pop = ease(f, b16, 14);
  const drop = easeIO(f, b16 + 22, 16);
  const flewY = lerp(1020, 940, pop) + 150 * drop;
  const slide = ease(f, b18, 20);
  const door = easeIO(f, b19, 18);
  const latch = easeIO(f, b17, 10);
  const cam = track([{t: 0, z: 1.1, fx: 420, fy: 1000}, {t: b18 - 10, z: 1.08, fx: 460, fy: 1000}, {t: b18 + 20, z: 1.04, fx: 560, fy: 1010}, {t: p.dur, z: 1.03, fx: 540, fy: 1010}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="HUMAN BLOOD SAMPLES" x={540} y={560} size={38} p={win(f, b16 + 4, b17)} />
        <Plate text="FOR THE INTERNATIONAL TESTING AGENCY" x={540} y={640} size={30} tone="dark" p={win(f, b17 + 4, b18)} /> {/* plate-overlap-ok */}
        <Plate text="TWO SAMPLES EACH" x={540} y={720} size={36} p={win(f, b18 + 4, b19)} /> {/* plate-overlap-ok */}
        <Plate text="ONE FLEW · ONE STAYED · TO COMPARE" x={540} y={800} size={32} tone="dark" p={win(f, b19 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <Room f={f} seed={7} lamp={1}>
          {/* a rack and bench */}
          <rect x={60} y={1180} width={960} height={40} fill="#6E5E7E" stroke={C.ink} strokeWidth={6} />
          <rect x={80} y={1220} width={30} height={80} fill="#4A3C58" stroke={C.ink} strokeWidth={4} />
          <rect x={970} y={1220} width={30} height={80} fill="#4A3C58" stroke={C.ink} strokeWidth={4} />
          <SampleTube f={f} x={300} y={flewY} scale={1.2} emotion={pop > 0.5 ? 'eager' : 'calm'} goggles={f > b16 + 10} label="FLEW" cues={[b16, b17]} seed={1} look={0.3} shadow={false} />
          <HeldTravel f={f} x={130} y={980} w={340} h={260} mode="sweep" seed={71}>
            <FlightCrate x={300} y={1180} f={f} scale={1.0} proposed={false} latchProgress={latch} lights={0} tag="" groundY={1180} />
          </HeldTravel>
          <SampleFridge f={f} x={770} y={1180} s={1.1} open={1 - door}>
            <SampleTube f={f} x={lerp(90, 0, slide)} y={-158} scale={0.66} emotion="wistful" glow={1} label="STAYED" cues={[b18, b19]} seed={2} look={-0.6} shadow={false} />
            <g transform={`translate(${lerp(90, 0, slide) + 40} -300) rotate(${-20 + 25 * Math.sin(f / 4)})`}>
              <path d="M 0 0 L 0 -40" stroke={C.ink} strokeWidth={3} />
              <path d="M 0 -40 l 26 6 l -4 22 l -22 -8 Z" fill="#FFFFFF" stroke={C.ink} strokeWidth={2.5} />
            </g>
          </SampleFridge>
          <g transform="translate(300 1050)">
            <path d={`M -150 120 q -30 -60 10 -120`} stroke={C.ink} strokeWidth={12} fill="none" strokeLinecap="round" />
            <path d={`M -150 120 q -30 -60 10 -120`} stroke={SER.ribbon} strokeWidth={7} fill="none" strokeLinecap="round" />
          </g>
        </Room>
      </SVG>
    </Frame>
  );
};

// ---- S8 eight forty seven (L10) ------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b20 = p.b(20), b21 = p.b(21);
  const spin = easeIO(f, b20, Math.max(30, p.dur - b20 - 10));
  const mins = Math.round(527 * spin);
  const clock = `${Math.floor(mins / 60)} HR ${String(mins % 60).padStart(2, '0')} MIN`;
  const mugPh = Math.floor((f - b20) / 18);
  const mug = f > b20 && mugPh % 2 === 1 ? 1 : 0;
  const ra = (f / 40) * Math.PI * 2;
  return (
    <Frame p={p} z0={1.02} z1={1.12} overlay={
      <g>
        <Plate text="8 HR 47 MIN" x={540} y={600} size={44} p={win(f, b20 + 4)} />
        <Plate text="STILL UP" x={540} y={700} size={34} tone="dark" p={win(f, b21 + 4)} />
      </g>
    }>
      <SVG>
        <Room f={f} seed={8}>
          <Raven f={f} x={540 + 220 * Math.cos(ra)} y={460 + 50 * Math.sin(ra)} scale={0.5} mode="fly" facing={Math.sin(ra) > 0 ? -1 : 1} />
          {/* the big wall clock */}
          <g transform="translate(860 820)">
            <circle r={110} fill={C.paper} stroke={C.ink} strokeWidth={8} />
            {Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={-92} x2={0} y2={-78} stroke={C.ink} strokeWidth={5} transform={`rotate(${i * 30})`} />)}
            <line x1={0} y1={0} x2={0} y2={-70} stroke={C.ink} strokeWidth={7} transform={`rotate(${spin * 527 * 6})`} strokeLinecap="round" />
            <line x1={0} y1={0} x2={0} y2={-48} stroke={SER.ribbon} strokeWidth={9} transform={`rotate(${spin * 527 * 0.5})`} strokeLinecap="round" />
            <circle r={9} fill={C.ink} />
          </g>
          <HeldTravel f={f} x={240} y={760} w={600} h={540} mode="shadow" seed={81}>
            <GroundStation f={f} x={540} y={1290} s={1.0} mug={mug} clock={clock} loopK={1} />
          </HeldTravel>
        </Room>
      </SVG>
    </Frame>
  );
};

// ---- S9 laid along the trail, the signature (L11-L12) --------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b22 = p.b(22), b23 = p.b(23), b24 = p.b(24), b25 = p.b(25);
  const unl = easeIO(f, b22, Math.max(24, b23 - b22));
  const creep = f > b23 && f < b25 ? 0.006 * Math.sin(clamp01((f - b23) / 20) * Math.PI) : 0;
  const snap = f < b25 ? 0 : clamp01((f - b25) / 9);
  const over = f < b25 ? 0 : Math.sin(clamp01((f - b25) / 16) * Math.PI) * 0.12 * (1 - clamp01((f - b25 - 16) / 10));
  const k = clamp01(unl * (1 - snap) - over + creep);
  const pts = morphPts(LOOP, LINE, k);
  const tip = LINE[47];
  const dogX = lerp(tip[0] - 170, tip[0] - 46, easeIO(f, b23 + 20, 26));
  const sniff = f > b24 && f < b25 ? Math.sin(f / 2.5) * 3 : 0;
  const cam = track([{t: 0, z: 1.14, fx: 540, fy: 920}, {t: b24 - 12, z: 1.15, fx: 500, fy: 920}, {t: b24 + 6, z: 1.8, fx: tip[0] + 20, fy: tip[1] - 20},
    {t: b25 + 2, z: 1.8, fx: tip[0] + 20, fy: tip[1] - 20}, {t: b25 + 22, z: 1.16, fx: 540, fy: 920}, {t: p.dur, z: 1.14, fx: 540, fy: 920}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="1,000 KM LOOP · LAID ALONG THE TRAIL" x={540} y={560} size={32} p={win(f, b22 + 4, b25)} />
        <Plate text="ABOUT 621 MILES" x={540} y={640} size={38} tone="dark" p={win(f, b23 + 4, b25)} /> {/* plate-overlap-ok */}
        <Plate text="NENANA TO NOME · 674 MILES" x={540} y={720} size={34} tone="sepia" p={win(f, b24 - 4, b25)} /> {/* plate-overlap-ok */}
        <Plate text="LANDS WHERE IT STARTED · A TEST LOOP" x={540} y={800} size={32} p={win(f, b25 + 8)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <SepiaDefs />
        <IceFromAbove f={f} seed={9}>
          <HeldTravel f={f} x={MX} y={MY} w={1000} h={700} mode="shadow" seed={91}>
            <MapBoard f={f} x={MX} y={MY} s={MS} seed={2} />
          </HeldTravel>
          <PawTrail pts={TRAIL} reveal={1} f={f} />
          <MapPin f={f} x={NOME[0]} y={NOME[1]} />
          <Tag x={NOME[0] - 10} y={NOME[1] - 44} text="NOME" size={22} />
          <Ribbon f={f} pts={pts} w={16} fray={k > 0.85} seed={2} wobble={k > 0.9 ? 0.6 : 2} />
          <MapPin f={f} x={NEN[0]} y={NEN[1]} color={SER.warm} />
          {(f < b24 - 14 || f > b25 + 24) && <Tag x={NEN[0] + 70} y={NEN[1] + 40} text="NENANA" size={22} />}
          {f > b23 + 14 && f < b25 + 30 && (
            <g transform={`translate(${sniff} 0)`}><MapDogs f={f} x={dogX} y={tip[1] + 6} s={0.26} dogs={1} facing={1} vx={f < b24 ? 3 : 0} /></g>
          )}
        </IceFromAbove>
      </SVG>
    </Frame>
  );
};

// ---- S10 forty below (L13) ----------------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b26 = p.b(26), b27 = p.b(27);
  const needle = easeIO(f, b27, 24);
  const cam = track([{t: 0, z: 1.03, fx: 540, fy: 980}, {t: p.dur, z: 1.08, fx: 600, fy: 960}]);
  return (
    <Frame p={p} cam={cam} bg={C.night} overlay={
      <g>
        <Plate text="SMALL DRONES FLOWN AT 40 BELOW · PER CAHILL" displayLines={['SMALL DRONES FLOWN AT 40 BELOW', 'PER CAHILL']} x={540} y={590} size={32} p={win(f, b26 + 4)} />
        <Plate text="SMALL DRONES ONLY · NOT THE ULTRA" x={540} y={720} size={30} tone="dark" p={win(f, b27 + 6)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <DuskWorld f={f} seed={10} horizon={1100} sun={0.15} stars={1}>
          {Array.from({length: 70}, (_, i) => (
            <circle key={i} cx={(h01(i, 2) * 1300 - f * (6 + 4 * h01(i, 3))) % 1300 + (h01(i, 2) * 1300 - f * (6 + 4 * h01(i, 3)) < 0 ? 1300 : 0) - 100} cy={(h01(i, 4) * 900 + f * 2) % 900 + 520} r={2.5 + 2 * h01(i, 5)} fill="#fff" opacity={0.7} />
          ))}
          <g filter="url(#sep1925)" opacity={0.55}>
            <Engine1925 f={f} x={260} y={1250} s={0.9} drop={0} shiver={1} />
          </g>
          <HeldTravel f={f} x={580} y={860} w={260} h={180} mode="sweep" seed={101}>
            <Drone f={f} x={700} y={940} scale={2.0} tilt={4 * Math.sin(f / 12)} />
          </HeldTravel>
          <g transform="translate(940 1260)">
            <ContactShadow cx={0} cy={4} rx={40} ry={8} opacity={0.4} />
            <rect x={-12} y={-300} width={24} height={300} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={5} />
            <rect x={-6} y={lerp(-200, -40, needle)} width={12} height={lerp(200, 40, needle)} fill="#3E7FD0" />
            <circle cx={0} cy={-20} r={20} fill="#3E7FD0" stroke={C.ink} strokeWidth={5} />
            <Tag x={-90} y={lerp(-200, -50, needle)} text="40 BELOW" size={18} />
          </g>
        </DuskWorld>
        <SepiaDefs />
      </SVG>
    </Frame>
  );
};

// ---- S11 the test (L14-L16) -------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b28 = p.b(28), b29 = p.b(29), b30 = p.b(30), b31 = p.b(31), b32 = p.b(32);
  const walkIn = easeIO(f, b28 - 6, 30);
  const walkOut = easeIO(f, b30 - 24, 22);
  const cx = lerp(-160, 200, walkIn) - 420 * walkOut;
  const liftK = Math.sin(clamp01((f - b29) / 50) * Math.PI);
  const tray = f < b30 ? 0 : 1;
  const trayY = lerp(700, 1190, clamp01((f - b30) / 8));
  const lean = f > b31 ? 8 * Math.min(1, (f - b31) / 12) : 0;
  const turn = easeIO(f, b32, 18);
  const slip = easeIO(f, b32 + 10, 40);
  const cam = track([{t: 0, z: 1.06, fx: 540, fy: 1040}, {t: b30, z: 1.1, fx: 560, fy: 1060}, {t: p.dur, z: 1.04, fx: 560, fy: 1040}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="CATHY CAHILL · UAF DRONE CENTER DIRECTOR" displayLines={['CATHY CAHILL', 'UAF DRONE CENTER DIRECTOR']} x={540} y={600} size={32} p={win(f, b28 + 4, b29)} />
        <Plate text={'"THE BLOOD COULD SURVIVE" · CAHILL'} x={540} y={600} size={32} tone="dark" p={win(f, b29 + 4, b30)} /> {/* plate-overlap-ok */}
        <Plate text="THE COMPARISON" x={540} y={680} size={36} p={win(f, b30 + 4, b31)} /> {/* plate-overlap-ok */}
        <Plate text="LAB RESULTS · NOT PUBLISHED" x={540} y={760} size={36} tone="dark" p={win(f, b31 + 2) * (f > b32 + 20 ? 0.75 : 1)} /> {/* plate-overlap-ok */}
        <Plate text="CLAIM THE TRIP · NOT THE RESULT" x={540} y={840} size={34} p={win(f, b32 + 12)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <Room f={f} seed={11}>
          {/* a wall shelf of sample racks and binders, the top of the square */}
          <g>
            <rect x={80} y={660} width={360} height={16} fill="#7A6E86" stroke={C.ink} strokeWidth={4} />
            {Array.from({length: 7}, (_, i) => <rect key={i} x={96 + i * 46} y={560 + (i % 3) * 8} width={36} height={100 - (i % 3) * 8} rx={4} fill={['#B0303F', '#5E7A88', '#C9A65A', '#6A5A7A'][i % 4]} stroke={C.ink} strokeWidth={3} />)}
            <rect x={640} y={660} width={240} height={16} fill="#7A6E86" stroke={C.ink} strokeWidth={4} />
            {Array.from({length: 6}, (_, i) => <g key={i}><rect x={660 + i * 36} y={600} width={18} height={60} rx={9} fill="#C8E3F0" opacity={0.8} stroke={C.ink} strokeWidth={3} /><rect x={660 + i * 36} y={590} width={18} height={14} rx={3} fill="#F3EBDD" stroke={C.ink} strokeWidth={2} /></g>)}
          </g>
          {/* cold side window light */}
          <path d="M 240 360 L 840 360 L 1080 1200 L 0 1200 Z" fill="#BFD6EE" opacity={0.1} />
          <rect x={80} y={1190} width={920} height={30} fill="#7A6E86" stroke={C.ink} strokeWidth={6} />
          <rect x={110} y={1220} width={860} height={60} fill="#5E5470" stroke={C.ink} strokeWidth={5} />
          {/* the door the ribbon slips under */}
          <rect x={900} y={820} width={150} height={370} fill="#4A3C58" stroke={C.ink} strokeWidth={6} />
          <circle cx={920} cy={1010} r={8} fill={SER.steel} stroke={C.ink} strokeWidth={3} />
          <Suit f={f} x={cx} y={1310} s={1.3} seed={9} cues={[b28, b29]} face={false} coat="#6A4E5E" trousers="#2E2440" walk={walkIn < 1 || walkOut > 0 ? f : 0} reach={0.3 + 0.7 * liftK} reachL={0.7 * liftK} facing={walkOut > 0.05 ? -1 : 1} />
          {walkIn > 0.6 && walkOut < 0.5 && <g transform={`translate(${cx + 10} 900)`}><Tag x={0} y={0} text="CAHILL" size={20} /></g>}
          <SampleTube f={f} x={420} y={1190 - 60 * liftK} scale={1.15} emotion={f > b31 ? 'worried' : 'calm'} label="FLEW" cues={[b29, b31]} seed={3} tilt={lean} look={0.4} />
          <SampleTube f={f} x={640} y={1190 - 60 * liftK} scale={1.15} emotion={f > b31 ? 'worried' : 'calm'} label="STAYED" cues={[b30, b31]} seed={4} tilt={-lean} look={-0.4} />
          {tray > 0 && (
            <HeldTravel f={f} x={680} y={trayY - 180} w={320} h={190} mode="sweep" seed={111}>
              <ResultTray f={f} x={830} y={trayY} s={1.0} />
            </HeldTravel>
          )}
          {/* the empty crate beside the table turns to show its stamp */}
          <g transform={`translate(210 1180) scale(${0.62 * (1 - 0.15 * Math.sin(turn * Math.PI))} 0.62)`}>
            <FlightCrate x={0} y={0} f={f} scale={1} proposed={false} latchProgress={1} lights={0} tag="" groundY={0} />
            {turn > 0.5 && (
              <g>
                <rect x={-150} y={-120} width={300} height={70} rx={6} fill="none" stroke="#B0303F" strokeWidth={6} transform="rotate(-6)" />
                <text x={0} y={-74} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill="#B0303F" transform="rotate(-6)">NOT TESTED</text>
                <text x={0} y={-40} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill="#B0303F" transform="rotate(-6)">FOR DOPING</text>
              </g>
            )}
          </g>
          {/* the ribbon slides out under the door */}
          <Ribbon f={f} pts={linePts(lerp(380, 700, slip), 1194, lerp(700, 1060, slip), 1194, 20)} w={10} seed={11} wobble={1} />
        </Room>
      </SVG>
    </Frame>
  );
};

// ---- S12 the villages (L17) -------------------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b33 = p.b(33);
  const cam = track([{t: 0, z: 1.12, fx: 540, fy: 1060}, {t: p.dur, z: 1.02, fx: 540, fy: 980}]);
  const far = [[160, 1030], [300, 1010], [820, 1000], [930, 1025]];
  return (
    <Frame p={p} cam={cam} overlay={
      <Plate text="82% OF COMMUNITIES OFF THE ROAD SYSTEM · PER THE STATE" displayLines={['82% OF COMMUNITIES', 'OFF THE ROAD SYSTEM · PER THE STATE']} x={540} y={600} size={32} p={win(f, Math.max(2, b33 + 2))} />
    }>
      <SVG>
        <DuskWorld f={f} seed={12} horizon={1060} sun={0.9}>
          {far.map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <rect x={-30} y={-26} width={60} height={26} fill="#5A4A6A" stroke={C.ink} strokeWidth={3} />
              <path d="M -38 -26 L 0 -50 L 38 -26 Z" fill="#EEE8F4" stroke={C.ink} strokeWidth={3} />
              <rect x={-8} y={-20} width={14} height={12} fill={SER.warm} opacity={clamp01((f - b33 - i * 6) / 8)} />
            </g>
          ))}
          {/* the only road: a short track reaching 2 of 10 roofs */}
          <path d="M 1140 1240 Q 1000 1210 930 1180" stroke="#8E8099" strokeWidth={26} fill="none" />
          <HeldTravel f={f} x={60} y={1000} w={960} h={280} mode="shadow" seed={121}>
            <Village f={f} x={540} y={1260} s={1.25} glow={clamp01((f - b33) / 20)} seed={12} runway={false} />
          </HeldTravel>
          <g transform="translate(980 1110)"><Tag x={0} y={0} text="ROAD" size={18} /></g>
        </DuskWorld>
      </SVG>
    </Frame>
  );
};

// ---- S13 keep it in sight (L18) --------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b34 = p.b(34), b35 = p.b(35);
  const R = 120;
  const reach = easeIO(f, b34, Math.max(20, b35 - b34));
  const dx = VILLAGE_PT[0] - NEN[0], dy = VILLAGE_PT[1] - NEN[1];
  const dl = Math.hypot(dx, dy);
  const lim = R / dl;
  const bubble = easeIO(f, b35 - 8, 14);
  const strain = f > b35 ? Math.sin(f / 2.2) * 0.012 : 0;
  const kk = f < b35 ? reach * Math.min(1, (lim + 0.18) / 1) : Math.min(reach, lim + strain + 0.02);
  const rib = linePts(NEN[0] + 20, NEN[1] + 6, NEN[0] + 20 + dx * kk, NEN[1] + 6 + dy * kk, 24);
  const cam = track([{t: 0, z: 1.3, fx: NEN[0] - 60, fy: NEN[1] + 10}, {t: p.dur, z: 1.42, fx: NEN[0] - 90, fy: NEN[1] + 10}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="A VILLAGE RUN" x={540} y={580} size={38} p={win(f, b34 + 4, b35)} />
        <Plate text="FEDERAL RULES · BEYOND LINE OF SIGHT" x={540} y={660} size={32} tone="dark" p={win(f, b35 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <IceFromAbove f={f} seed={13}>
          <HeldTravel f={f} x={MX} y={MY} w={1000} h={700} mode="shadow" seed={131}>
            <MapBoard f={f} x={MX} y={MY} s={MS} seed={3} />
          </HeldTravel>
          <PawTrail pts={TRAIL} reveal={1} f={f} />
          {/* the coiled test loop stays small on NENANA, unremarked */}
          <g transform={`translate(${NEN[0]} ${NEN[1]}) scale(0.5) translate(${-NEN[0]} ${-NEN[1]})`}><Ribbon f={f} pts={LOOP} w={14} seed={12} /></g>
          <Ribbon f={f} pts={rib} w={14} fray seed={13} wobble={f > b35 ? 3 : 1} />
          {bubble > 0 && (
            <g transform={`translate(${NEN[0]} ${NEN[1]}) scale(1 0.62)`}>
              <SightBubble f={f} cx={0} cy={0} r={R} p={bubble} squash={1} strain={f > b35 ? 1 : 0} onSnow />
              <SightBubble f={f} cx={0} cy={0} r={R} p={bubble} squash={-1} strain={f > b35 ? 1 : 0} onSnow />
            </g>
          )}
          <MapPin f={f} x={VILLAGE_PT[0]} y={VILLAGE_PT[1]} color="#8C8496" pulse={1} />
          <Tag x={VILLAGE_PT[0]} y={VILLAGE_PT[1] - 42} text="VILLAGE" size={20} />
          <MapPin f={f} x={NEN[0]} y={NEN[1]} color={SER.warm} />
          <Tag x={NEN[0] + 60} y={NEN[1] + 48} text="NENANA" size={20} />
        </IceFromAbove>
      </SVG>
    </Frame>
  );
};

// ---- S14 eyes of its own (L19-L20) --------------------------------------------------------------------------------------------------------
/** a dashed ghost airplane silhouette: an "other aircraft" the planned radar would avoid */
const GhostPlane: React.FC<{x: number; y: number; s?: number; f: number}> = ({x, y, s = 1, f}) => {
  const off = -((f * 1.4) % 20);
  const d = 'M -90 0 L 60 -6 Q 90 0 60 6 L -90 4 Z M -10 -2 L -30 -70 L -10 -70 L 20 -2 M -10 2 L -30 70 L -10 70 L 20 2 M -80 0 L -96 -26 L -84 -26 L -70 0';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={9} strokeDasharray="12 8" strokeDashoffset={off} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={SER.phos} strokeWidth={4.5} strokeDasharray="12 8" strokeDashoffset={off} strokeLinejoin="round" />
    </g>
  );
};

const S14: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b36 = p.b(36), b37 = p.b(37), b38 = p.b(38), b43 = p.b(43);
  const up = ease(f, b36, 16);
  const hop = easeIO(f, b37 - 4, 30);
  const rx = lerp(250, 760, hop);
  const ry = 1260 - 140 * Math.sin(hop * Math.PI);
  const sweep = easeIO(f, b38 + 12, 30);
  const linkBreak = f > b38 + 6;
  const flick = f > b38 && f < b38 + 6 ? (Math.floor(f) % 2) : 1;
  const ghostX = lerp(1180, -120, clamp01((f - b43 + 4) / 70));
  const bend = easeIO(f, b43 + 8, 24);
  const cam = track([{t: 0, z: 1.05, fx: 520, fy: 1060}, {t: p.dur, z: 1.08, fx: 600, fy: 1040}]);
  return (
    <Frame p={p} cam={cam} bg={C.night} overlay={
      <g>
        <Plate text="DETECT AND AVOID RADAR · PLANNED" x={540} y={570} size={34} p={win(f, b36 + 4, b37)} />
        <Plate text={'"A KEY STEP" · CAHILL'} x={540} y={650} size={36} tone="dark" p={win(f, b37 + 4, b38)} /> {/* plate-overlap-ok */}
        <Plate text="IF THE DRONE LOSES LINK · PER CAHILL · PLANNED" displayLines={['IF THE DRONE LOSES LINK', 'PER CAHILL · PLANNED']} x={540} y={740} size={30} p={win(f, b38 + 4, b43)} /> {/* plate-overlap-ok */}
        <Plate text="AVOID OTHER AIRCRAFT · AUTOMATICALLY · PLANNED" displayLines={['AVOID OTHER AIRCRAFT', 'AUTOMATICALLY · PLANNED']} x={540} y={850} size={30} tone="dark" p={win(f, b43 + 4)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <DuskWorld f={f} seed={14} horizon={1140} sun={0.2} stars={1}>
          <Poles f={f} y={1150} top={480} n={4} x0={380} gapX={240} birds={false} />
          <rect data-band="ok" x={-60} y={1190} width={1200} height={110} fill="#6E6280" stroke={C.ink} strokeWidth={4} />
          <RunwayLights f={f} y={1196} />
          {/* the ground station hut and its antenna */}
          <g transform="translate(110 1190)">
            <rect x={-70} y={-120} width={140} height={120} fill="#4A3C58" stroke={C.ink} strokeWidth={5} />
            <rect x={-40} y={-90} width={50} height={40} fill={SER.warm} opacity={0.7} stroke={C.ink} strokeWidth={3} />
            <line x1={40} y1={-120} x2={40} y2={-260} stroke={C.ink} strokeWidth={6} />
            <circle cx={40} cy={-266} r={10} fill={SER.steel} stroke={C.ink} strokeWidth={3} />
          </g>
          {/* the link line, dashed, flickers and breaks */}
          {!linkBreak && <path d="M 150 924 Q 400 860 640 1150" fill="none" stroke={SER.phos} strokeWidth={4} strokeDasharray="10 8" opacity={flick} />}
          {linkBreak && f < b38 + 30 && (
            <g opacity={1 - clamp01((f - b38 - 6) / 24)}>
              <path d="M 150 924 Q 260 890 330 890" fill="none" stroke={SER.phos} strokeWidth={4} strokeDasharray="10 8" />
              <path d="M 470 940 Q 560 1020 640 1150" fill="none" stroke={SER.phos} strokeWidth={4} strokeDasharray="10 8" />
              <path d="M 380 880 l 20 30 l -14 6 l 22 34" stroke={SER.phos} strokeWidth={4} fill="none" />
            </g>
          )}
          <HeldTravel f={f} x={300} y={1080} w={640} h={180} mode="sweep" seed={141}>
            <CargoDrone f={f} x={660} y={1250} scale={1.15} prop={0} gear groundY={1252} />
          </HeldTravel>
          {f > b43 - 4 && <GhostPlane x={ghostX} y={620 + 20 * Math.sin(f / 10)} s={0.9} f={f} />}
          {f > b43 + 4 && (
            <path d={`M 640 1060 Q 760 ${1000 - 160 * bend} ${900 + 60 * bend} ${980 - 300 * bend}`} fill="none" stroke={SER.phos} strokeWidth={6} strokeDasharray="14 10" markerEnd="" />
          )}
          <RadarEye f={f} x={rx} y={ry} scale={1.55 * up} emotion={f > b37 ? 'shy' : 'eager'} cues={[b36, b37, b38, b43]} seed={6} sweep={sweep} ghost={f > b37 && f < b37 + 30 ? 0.55 : 1}
            look={f > b43 ? lerp(0.8, -0.8, clamp01((f - b43) / 60)) : 0} />
        </DuskWorld>
      </SVG>
    </Frame>
  );
};

// ---- S15 partners (L21) ---------------------------------------------------------------------------------------------------------------------
const S15: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b39 = p.b(39), b44 = p.b(44), b40 = p.b(40);
  const gust = clamp01((f - b39) / 50);
  const fl = easeIO(f, b40, 30);
  const cam = track([{t: 0, z: 1.04, fx: 520, fy: 1020}, {t: p.dur, z: 1.09, fx: 580, fy: 1030}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="PARTNERS · RYAN AIR · TANANA CHIEFS CONFERENCE" displayLines={['PARTNERS · RYAN AIR', 'TANANA CHIEFS CONFERENCE']} x={540} y={590} size={32} p={win(f, b39 + 4)} />
        <Plate text="AN ALASKA NATIVE NONPROFIT" x={540} y={690} size={32} tone="dark" p={win(f, b44 + 4)} />
        <Plate text="DEVELOP OR TEST · MEDICAL DELIVERY" x={540} y={770} size={32} p={win(f, b40 + 4)} />
      </g>
    }>
      <SVG>
        <DuskWorld f={f} seed={15} horizon={1040} sun={0.5} stars={0.8}>
          <HeldTravel f={f} x={60} y={980} w={960} h={280} mode="shadow" seed={151}>
            <Village f={f} x={540} y={1200} s={1.2} glow={0.4 + 0.8 * clamp01((f - b44) / 12)} seed={15} runway lit={false} />
          </HeldTravel>
          {Array.from({length: 26}, (_, i) => (
            <path key={i} d={`M ${lerp(-200, 1300, (gust * 1.4 + h01(i, 3)) % 1)} ${1100 + h01(i, 4) * 200} q 40 -10 90 0`} stroke="#F4F0FA" strokeWidth={3} opacity={0.7 * Math.sin(Math.PI * clamp01(gust * 1.2))} fill="none" />
          ))}
          {/* a dashed flight line arrives and stops short of the unlit markers */}
          {fl > 0 && <path d={`M 1140 860 Q 900 900 ${lerp(1140, 760, fl)} ${lerp(860, 1060, fl)}`} fill="none" stroke={SER.phos} strokeWidth={6} strokeDasharray="16 12" />}
        </DuskWorld>
      </SVG>
    </Frame>
  );
};

// ---- S16 next, the button (L22) ------------------------------------------------------------------------------------------------------------
const S16: React.FC<SceneProps> = ({p}) => {
  const {f} = p;
  const b41 = p.b(41), b45 = p.b(45), b42 = p.b(42);
  const flick = f < b45 ? 0 : Math.sin(clamp01((f - b45) / 36) * Math.PI);
  const lay = easeIO(f, b42, 30);
  const R = 120;
  const dx = VILLAGE_PT[0] - NEN[0], dy = VILLAGE_PT[1] - NEN[1], dl = Math.hypot(dx, dy);
  const lim = R / dl;
  const loopPts2 = morphPts(LOOP, LINE, flick * 0.98);
  const solid = linePts(NEN[0], NEN[1], NEN[0] + dx * lim * lay, NEN[1] + dy * lim * lay, 12);
  const dashEnd = [lerp(NEN[0] + dx * lim, VILLAGE_PT[0], clamp01((lay - 0.3) / 0.7)), lerp(NEN[1] + dy * lim, VILLAGE_PT[1], clamp01((lay - 0.3) / 0.7))];
  const cam = track([{t: 0, z: 1.12, fx: NEN[0], fy: NEN[1] + 60}, {t: b41 + 30, z: 1.02, fx: 540, fy: 940}, {t: p.dur, z: 1.06, fx: 520, fy: 930}]);
  return (
    <Frame p={p} cam={cam} overlay={
      <g>
        <Plate text="THE DOGS RAN THE TRAIL" x={540} y={560} size={36} tone="sepia" p={win(f, b41 + 4, b45)} />
        <Plate text="THE DRONE HAS THE LEGS" x={540} y={640} size={36} p={win(f, b45 + 4, b42)} /> {/* plate-overlap-ok */}
        <Plate text="NEXT · EYES OF ITS OWN · PLANNED" x={540} y={720} size={34} tone="dark" p={win(f, b42 + 6)} /> {/* plate-overlap-ok */}
      </g>
    }>
      <SVG>
        <SepiaDefs />
        <IceFromAbove f={f} seed={16}>
          <HeldTravel f={f} x={MX} y={MY} w={1000} h={700} mode="shadow" seed={161}>
            <MapBoard f={f} x={MX} y={MY} s={MS} seed={4} />
          </HeldTravel>
          <PawTrail pts={TRAIL} reveal={1} f={f} />
          <MapPin f={f} x={NOME[0]} y={NOME[1]} />
          <MapPin f={f} x={VILLAGE_PT[0]} y={VILLAGE_PT[1]} color={lay > 0.9 ? SER.warm : '#8C8496'} />
          <Tag x={VILLAGE_PT[0]} y={VILLAGE_PT[1] - 42} text="CLINIC" size={20} />
          {f < b42 && <Ribbon f={f} pts={loopPts2} w={14} seed={16} wobble={1.5} />}
          {f >= b42 && <g transform={`translate(${NEN[0]} ${NEN[1]}) scale(0.5) translate(${-NEN[0]} ${-NEN[1]})`}><Ribbon f={f} pts={LOOP} w={14} seed={12} /></g>}
          {lay > 0 && (
            <g>
              <g transform={`translate(${NEN[0]} ${NEN[1]}) scale(1 0.62)`}>
                <SightBubble f={f} cx={0} cy={0} r={R} p={lay} squash={1} onSnow />
                <SightBubble f={f} cx={0} cy={0} r={R} p={lay} squash={-1} onSnow />
              </g>
              <Ribbon f={f} pts={solid} w={14} seed={17} wobble={0.8} />
              {lay > 0.3 && (
                <g>
                  <path d={`M ${NEN[0] + dx * lim} ${NEN[1] + dy * lim} L ${dashEnd[0]} ${dashEnd[1]}`} stroke={C.ink} strokeWidth={14} strokeDasharray="18 14" strokeLinecap="round" />
                  <path d={`M ${NEN[0] + dx * lim} ${NEN[1] + dy * lim} L ${dashEnd[0]} ${dashEnd[1]}`} stroke={SER.phosD} strokeWidth={8} strokeDasharray="18 14" strokeLinecap="round" />
                </g>
              )}
            </g>
          )}
          <MapPin f={f} x={NEN[0]} y={NEN[1]} color={SER.warm} />
          <MapDogs f={f} x={NEN[0] + 50} y={NEN[1] + 80} s={0.3} dogs={4} facing={-1} vx={0} />
          <CargoDrone f={f} x={NEN[0] + 130} y={NEN[1] - 40} view="top" scale={0.14} rot={-20} />
          {lay > 0 && <RadarEye f={f} x={NEN[0] - 150} y={NEN[1] + 170} scale={0.6 * lay} cues={[b42]} seed={8} onSnow />}
          <Tag x={NEN[0] - 80} y={NEN[1] - 40} text="NENANA" size={20} />
        </IceFromAbove>
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

export const ep1123Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1123Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1123: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 7, 15, 24, 33, 36, 40, 47, 55, 59, 70, 75, 89, 95, 104, 112, 121].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.plum}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#2A2034" ink="#FBF6EC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
