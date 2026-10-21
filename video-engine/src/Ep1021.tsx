import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK, ContactShadow} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {Character} from './lib/Character';
import {AlaskaMini} from './lib/kit';
import {SatelliteEye} from './lib/sensors';
import {BushPlane} from './lib/vehicles';
import {HandSil} from './lib/stack';
import {CAL, BeachBG, CabinBG, OrbitBG, WalrusCalf, CarcassMound, BearPrints, ViewFrame, TrailCam, HaulPhoto, Phone, Pool, Kennel, Tally, QMark, NeuralStack, CalfInset, Gauge, Skiff, CabinDoor, snap, rnd} from './lib/calf';
import {IDS} from './Ep1021Ids';

// The Count and the Calf, 2026-10-21. Palette roles are art_direction.json. SURVEY ORANGE is only the count and its marks (the viewfinder corners, the label boxes, the question mark,
// the window the frame becomes). The tawny calf is the only warm hide. Violet and Tony are generic rig figures, never named beyond their plates, and the community is never drawn.
// Every painted string is a claims.json on_screen string, a quote, or a plain label. The network's picture is an ILLUSTRATION of how this kind of learning works and never a USGS result.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const C = {ink: INK, paper: CAL.paper};
const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** a decaying squash bump that starts at frame a */
const bump = (f: number, a: number, len = 16) => (f < a ? 0 : Math.max(0, 1 - (f - a) / len) * (0.55 + 0.45 * Math.cos((f - a) / 1.6)));

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'paper' | 'orange' | 'dusk' | 'pale';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#16203F', fg: CAL.cream},
  paper: {fill: CAL.cream, fg: '#16203F'},
  orange: {fill: CAL.orange, fg: INK},
  dusk: {fill: '#3A4452', fg: CAL.cream},
  pale: {fill: '#26335C', fg: CAL.pale},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number; dashed?: boolean}> =
({text, displayLines, x = 540, y, size = 34, tone = 'ink', p = 1, rot = 0, drop = 0, dashed = false}) => {
  const ls = displayLines ?? [text];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const fr = useCurrentFrame();
  const sc = (0.84 + 0.16 * Math.min(1, k * 1.15)) * (1 + 0.012 * Math.sin(fr / 11 + x * 0.01));
  return (
    <g opacity={Math.min(1, k * 1.6)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={C.ink} strokeWidth={4} />
      {dashed && <rect x={-w / 2 + 7} y={-h / 2 + 7} width={w - 14} height={h - 14} rx={3} fill="none" stroke={t.fg} strokeWidth={2.4} strokeDasharray="10 7" strokeDashoffset={-fr * 0.6} opacity={0.8} />}
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

/** A boxed quote typed to the voice: `type` (0..1) is how much has been typed, text is "quote · attribution". */
const QuotePlate: React.FC<{text: string; x?: number; y: number; size?: number; wrap?: number; p?: number; type?: number}> =
({text, x = 540, y, size = 34, wrap = 26, p = 1, type = 1}) => {
  const parts = text.split(' · ');
  const by = parts.length > 1 ? parts.slice(1).join(' · ') : undefined;
  const full = parts[0];
  const lines: string[] = [];
  let cur = '';
  full.split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > wrap) { lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const tw = Math.min(1000, Math.max(...lines.map((l) => l.length * size * 0.68), by ? monoW(by, 28) : 0) + 80);
  const th = lines.length * (size + 10) + (by ? 58 : 0) + 36;
  const yy = Math.min(y, CAP_GUARD - th / 2);
  assertCropSafe(full, yy - th / 2, yy + th / 2);
  const shown = Math.round(full.length * clamp01(type));
  let used = 0;
  return (
    <g transform={`translate(${x},${yy})`} opacity={Math.min(1, k * 2)}>
      <rect x={-tw / 2 + 10} y={-th / 2 + 12} width={tw} height={th} fill="#000" opacity={0.3} />
      <rect x={-tw / 2} y={-th / 2} width={tw} height={th} fill={C.paper} stroke={C.ink} strokeWidth={7} />
      <rect x={-tw / 2 + 11} y={-th / 2 + 11} width={tw - 22} height={th - 22} fill="none" stroke={C.ink} strokeWidth={2.2} />
      {lines.map((l, i) => {
        const take = Math.max(0, Math.min(l.length, shown - used));
        used += l.length + 1;
        return <text key={i} x={0} y={-th / 2 + 22 + size * 0.86 + i * (size + 10)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={C.ink}>{l.slice(0, take)}</text>;
      })}
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={28} letterSpacing={1} fill="#26335C" opacity={clamp01(type * 3)}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: push, kick, grade ---------------------------------------------------------
const CHIP = 'ILLUSTRATION';
const Frame: React.FC<{p: SP; z0?: number; z1?: number; zk?: (f: number) => number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; children: React.ReactNode}> =
({p, z0 = 1, z1 = 1.05, zk, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, bloom = 0.05, vignette = 0.28, ox = 540, oy = 900, tag = true, overlay, tagText = CHIP, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const z = zk ? zk(p.f) : lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur)));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + lerp(dx0, dx1, t) + 9 * Math.sin(p.f / 23)}px, ${jl.y + lerp(dy0, dy1, t) + 12 * Math.sin(p.f / 17 + 1)}px) rotate(${0.35 * Math.sin(p.f / 31)}deg) scale(${z * jl.scale * (1 + 0.009 * Math.sin(p.f / 13))})`, transformOrigin: `${ox}px ${oy}px`}}>
        {children}
      </div>
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#10151F" stroke={C.paper} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={C.paper}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.02} />
    </AbsoluteFill>
  );
};

/** a person on the beach: Violet (flannel, long hair, beanie) or Tony (puffer, cap), a generic rig with no identifying features beyond the plates */
const Violet: React.FC<{x: number; y: number; f: number; scale?: number; facing?: 1 | -1; pose?: 'stand' | 'carry'; walking?: boolean; phase?: number; emotion?: 'neutral' | 'worried'}> =
({x, y, f, scale = 0.5, facing = 1, pose = 'stand', walking = false, phase, emotion = 'neutral'}) => (
  <g>
    <ContactShadow cx={x} cy={y + 4} rx={70 * scale * 2} ry={10} opacity={0.3} blur={7} />
    <Character frame={f} x={x} y={y} scale={scale} facing={facing} pose={pose} emotion={emotion} outfit="flannel" headgear="beanie" hair="#3d2c1e" hairStyle="long" walking={walking} walkPhase={phase} idleGain={1} />
  </g>
);
const Tony: React.FC<{x: number; y: number; f: number; scale?: number; facing?: 1 | -1; walking?: boolean; phase?: number}> =
({x, y, f, scale = 0.5, facing = -1, walking = false, phase}) => (
  <g>
    <ContactShadow cx={x} cy={y + 4} rx={70 * scale * 2} ry={10} opacity={0.3} blur={7} />
    <Character frame={f + 17} x={x} y={y} scale={scale} facing={facing} pose="stand" emotion="neutral" outfit="puffer" headgear="cap" hair="#2d2a26" walking={walking} walkPhase={phase} />
  </g>
);

/** NearPlane: stones, a driftwood log and grass tufts bleeding off the lower edge, so the lower third of every exterior shot has a near plane. */
const NearPlane: React.FC<{y?: number; f: number; seed?: number; tone?: string}> = ({y = 1560, f, seed = 0, tone = '#6F6359'}) => (
  <g>
    {Array.from({length: 7}).map((_, i) => {
      const sx = rnd(i + seed * 7) * 1160 - 40, sy = y + 20 + rnd(i + 11 + seed) * 280, s = 0.8 + rnd(i + 3 + seed) * 1.3;
      return <ellipse key={i} cx={sx + 10 * Math.sin(f / (60 + i * 7) + i)} cy={sy} rx={44 * s} ry={22 * s} fill={tone} stroke={INK} strokeWidth={4} opacity={0.95} />;
    })}
    <g transform={`translate(${-20 + seed * 90} ${y + 190}) rotate(-4)`}>
      <rect x={0} y={0} width={470} height={38} rx={18} fill="#5B4A3B" stroke={INK} strokeWidth={5} />
      <path d="M50,10 l110,0 M210,22 l120,0" stroke={INK} strokeWidth={3} opacity={0.4} />
    </g>
    {Array.from({length: 9}).map((_, i) => {
      const gx = rnd(i + 40 + seed) * 1080, gy = y + 330 + rnd(i + 50) * 120;
      return <path key={`g${i}`} d={`M${gx},${gy} q${-12 + 6 * Math.sin(f / 21 + i)},-60 ${-24},-96 M${gx},${gy} q${8 + 6 * Math.sin(f / 23 + i)},-70 ${18},-110`} fill="none" stroke="#6E7A55" strokeWidth={7} strokeLinecap="round" />;
    })}
  </g>
);

// ---- S1: counted, then a breath (keys 1, 2, 3) ----------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t2 = 42, t3 = b(3);
  const A = {x: 250, y: 1118}, B = {x: 860, y: 1126}, Cc = {x: 560, y: 1160};
  const hop1 = easeIO(f, t2 - 8, 14), hop2 = easeIO(f, t3 - 22, 14);
  const cx = f < t3 - 22 ? lerp(A.x, B.x, hop1) : lerp(B.x, Cc.x, hop2);
  const cy = f < t3 - 22 ? lerp(A.y, B.y, hop1) : lerp(B.y, Cc.y, hop2);
  const cw = f < t3 - 22 ? lerp(480, 470, hop1) : lerp(470, 400, hop2);
  const ch = f < t3 - 22 ? lerp(300, 290, hop1) : lerp(290, 250, hop2);
  const n = f < t2 + 4 ? (f < 6 ? 0 : 1) : f < t3 - 8 ? 2 : 2;
  const roll = f >= t3 - 8 ? 0.5 + 0.03 * Math.sin(f * 2.1) : f >= t2 + 4 && f < t2 + 8 ? 0.5 : 0;
  const breath = 0.3 + 1.3 * ease(f, t3 - 30, 40);
  const jolt = bump(f, t3, 14);
  return (
    <Frame p={p} z0={1.0} z1={1.08} oy={1150}
      overlay={<>
        <Plate x={540} text="SHE WAS COUNTING THE DEAD" y={560} size={38} tone="ink" p={ease(f, 4, 8) * (f < t3 ? 1 : 0)} />
        <Plate x={540} text="ONE OF THEM BREATHED" y={640} size={40} tone="orange" p={ease(f, t3 + 2, 8)} />
      </>}>
      <SVG>
        <BeachBG f={g} horizon={820} shore={980} id="s1b" />
        <CarcassMound x={A.x} y={1196} scale={0.95} f={g} id="s1a" />
        <CarcassMound x={B.x} y={1206} scale={0.9} facing={-1} variant={1} f={g} id="s1c" />
        <WalrusCalf x={560} y={1250} f={g} scale={0.8} dull={1} eyes={0} breath={breath} mood="sleep" id="s1k" />
        <ViewFrame x={cx} y={cy + 6 * jolt} w={cw} h={ch} f={f} mode="bracket" k={snap(f, 0, 10)} id="s1v" />
        <Tally x={910} y={1390 - 80} scale={0.62} n={n} roll={roll} shiver={f >= t3 - 8 ? 1 : 0} f={g} />
      </SVG>
    </Frame>
  );
};

// ---- S2: a pin, then the beach (keys 4, 5, 6, 7, 9) ------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t5 = b(4) + 58, t6 = b(6), t7 = b(7), t9 = b(9);
  const zoom = Math.exp(lerp(0, Math.log(9), easeIO(f, t5 - 24, 36)));
  const mapOp = 1 - ease(f, t5 + 6, 14);
  const beachOp = ease(f, t5 + 2, 16);
  const pinX = 60 + 92 * 1.9, pinY = 720 + 118 * 1.9;
  const vx = lerp(-170, 330, easeIO(f, t6 - 28, 46));
  const walkingV = f > t6 - 28 && f < t6 + 18;
  const tx = lerp(1260, 790, easeIO(f, t9 - 40, 44));
  const walkingT = f > t9 - 40 && f < t9 + 6;
  const raise = ease(f, t7 - 8, 10);
  const flash = f >= t7 && f < t7 + 8 ? (f - t7) / 8 : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1100}
      overlay={<>
        <Plate x={540} text="POINT LAY · MID-SEPTEMBER" y={540} size={36} tone="ink" p={ease(f, 4, 8) * (f < t6 - 6 ? 1 : 0)} />
        <Plate x={540} text="VIOLET ANNISKETT · COLLEGE STUDENT" y={610} size={30} tone="paper" p={ease(f, t6 + 2, 8)} />
        <Plate x={540} text="PER ALASKA PUBLIC MEDIA" y={830} size={28} tone="dusk" p={ease(f, 18, 8)} />
        <Plate x={540} text="PHOTOS, TO COUNT LATER" y={680} size={34} tone="orange" p={ease(f, t7 + 2, 8)} />
        <Plate x={540} text="TONY FISCHBACH · USGS" y={750} size={32} tone="ink" p={ease(f, t9 + 2, 8)} />
      </>}>
      <SVG>
        <g opacity={beachOp}>
          <g transform={`translate(540 1000) scale(${lerp(0.72, 1, beachOp)}) translate(-540 -1000)`}>
            <BeachBG f={g} horizon={820} shore={980} id="s2b" />
            <CarcassMound x={250} y={1196} scale={0.95} f={g} id="s2a" />
            <CarcassMound x={880} y={1210} scale={0.9} facing={-1} variant={1} f={g} id="s2c" />
            <WalrusCalf x={570} y={1236} f={g} scale={0.72} dull={1} eyes={0} breath={1.3} mood="sleep" id="s2k" />
            <Violet x={vx} y={1290} f={g} scale={0.52} pose={f > t7 - 10 ? 'carry' : 'stand'} walking={walkingV} />
            {f > t7 - 10 && <Phone x={vx + 120 * 0.52} y={1290 - 190 * 0.52} scale={0.9} flash={flash} />}
            {f > t7 && <ViewFrame x={250} y={1118} w={480} h={300} f={f} mode="bracket" k={snap(f, t7, 10)} id="s2v" />}
            <Tony x={tx} y={1280} f={g} scale={0.52} facing={-1} walking={walkingT} />
          </g>
        </g>
        <g opacity={mapOp}>
          <g transform={`translate(${pinX} ${pinY}) scale(${zoom}) translate(${-pinX} ${-pinY})`}>
            <rect data-band="ok" x={-600} y={0} width={2400} height={1920} fill="#8FA4A8" />
            <rect data-band="ok" x={-600} y={0} width={2400} height={1920} fill="#2A5568" opacity={0.55} />
            <AlaskaMini frame={g} x={60} y={720} scale={1.9} pin={false} />
            <circle cx={pinX} cy={pinY} r={22 + 14 * Math.sin(f / 7)} fill="none" stroke={CAL.cream} strokeWidth={6} opacity={0.8} />
            <circle cx={pinX} cy={pinY} r={11} fill="#16203F" stroke={CAL.cream} strokeWidth={4} />
          </g>
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S3: a stomach moved (keys 10 to 15) --------------------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t11 = b(11), t12 = b(12), t13 = b(13), t14 = b(14), t15 = b(15);
  const w = ease(f, t12, 20);
  const eyes = ease(f, t12 + 8, 14);
  const heave = 0.4 + 2.2 * ease(f, t11 - 10, 10) * (1 - 0.35 * ease(f, t12 + 20, 30));
  const jolt = bump(f, t11, 14);
  const shiver = ease(f, t15 - 6, 10);
  const two = snap(f, t13, 10);
  const wide = 1 - ease(f, t13 - 2, 8);
  return (
    <Frame p={p} zk={(ff) => lerp(1.0, 1.38, easeIO(ff, 0, p.dur))} ox={540} oy={1230}
      overlay={<>
        <Plate x={540} text="A STOMACH MOVED" y={540} size={38} tone="ink" p={ease(f, t11 + 2, 8) * (f < t12 ? 1 : 0)} />
        <Plate x={540} text="A BABY WALRUS" y={606} size={38} tone="orange" p={ease(f, t12 + 2, 8) * (f < t13 ? 1 : 0)} />
        <Plate x={540} text="TWO CARCASSES · ONE BREATH" y={672} size={34} tone="ink" p={ease(f, t13 + 2, 8) * (f < t14 ? 1 : 0)} />
        <Plate x={540} text="ALIVE" y={738} size={46} tone="paper" p={ease(f, t14 + 2, 8) * (f < t15 ? 1 : 0)} />
        <Plate x={540} text="BEAR TRACKS NEARBY" y={804} size={36} tone="dusk" p={ease(f, t15 + 2, 8)} />
      </>}>
      <SVG>
        <BeachBG f={g} horizon={760} shore={930} id="s3b" gulls={false} />
        <CarcassMound x={150} y={1190} scale={1.5} f={g} id="s3a" />
        <CarcassMound x={950} y={1206} scale={1.4} facing={-1} variant={2} f={g} id="s3c" />
        <g opacity={1 - w}><WalrusCalf x={540} y={1212 + 3 * jolt} f={g} scale={1.02} dull={1} eyes={0} breath={heave} mood="sleep" id="s3d" sq={0} /></g>
        <g opacity={w}><WalrusCalf x={540} y={1212 + 3 * jolt} f={g} scale={1.02} dull={0} eyes={eyes} breath={heave} mood={f > t14 - 20 ? 'afraid' : 'wake'} shiver={shiver} id="s3e" /></g>
        {wide > 0.01 && <ViewFrame x={540} y={1074} w={1000} h={520} f={f} mode="bracket" k={snap(f, 0, 10) * wide + 0.0} dim={1 - wide} id="s3v" />}
        <ViewFrame x={150} y={1074} w={560} h={380} f={f} mode="box" k={two} id="s3b1" />
        <ViewFrame x={950} y={1090} w={520} h={360} f={f} mode="box" k={snap(f, t13 + 3, 10)} id="s3b2" />
        <BearPrints x={60} y={1240} scale={1.25} n={5} k={ease(f, t15, 46)} rot={-3} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the first move is a question (keys 16, 17, 18) -----------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t16 = b(16), t17 = b(17), t18 = b(18);
  const close = ease(f, t16, 26);
  const reach = easeIO(f, t17 - 12, 24) - easeIO(f, t18 + 4, 22);
  const hx = lerp(1340, 900, clamp01(reach));
  const tremble = Math.sin(f * 1.7) * 3 * clamp01(reach);
  const stamp = snap(f, t18, 10);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1200}
      overlay={<>
        <Plate x={540} text="THE FIRST MOVE" y={560} size={40} tone="ink" p={ease(f, t16 + 2, 8) * (f < t17 ? 1 : 0)} />
        <Plate x={540} text="NOT A RESCUE" y={630} size={42} tone="paper" p={ease(f, t17 + 2, 8)} />
      </>}>
      <SVG>
        <BeachBG f={g} horizon={1000} shore={1100} id="s4b" gulls={false} far={false} />
        <WalrusCalf x={430} y={1290} f={g} scale={1.5} eyes={1} breath={1.1} mood="afraid" shiver={0.25} look={0.4} id="s4k" />
        <ViewFrame x={560} y={1150} w={lerp(1100, 560, close)} h={lerp(560, 340, close)} f={f} mode="bracket" k={snap(f, 0, 8)} id="s4v" />
        <HandSil x={hx} y={1090 + tremble} rot={-90} s={0.9} sleeve fill="#5A4A5C" />
        <QMark x={840} y={800} size={430} f={g} k={stamp} />
      </SVG>
    </Frame>
  );
};




// ---- S5: a camera and a network (keys 19, 21, 22, 23, 24) ---------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t19 = b(19), t21 = b(21), t22 = b(22), t23 = b(23), t24 = b(24);
  const flash = f >= t22 && f < t22 + 9 ? 1 - (f - t22) / 9 : 0;
  const slide = easeIO(f, t22 + 2, 20);
  const lit = 4 * ease(f, t23, 34);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1100} dx0={0} dx1={-30}
      overlay={<>
        <Plate x={540} text="USGS" displayLines={['USGS · TEACHING NEURAL NETWORKS', 'TO SPOT WALRUSES']} y={540} size={32} tone="ink" p={ease(f, t21 + 2, 8)} />
        <Plate x={540} text="COMPUTING CENTER" y={660} size={30} tone="dusk" p={ease(f, t21 + 6, 8) * (f < t22 ? 1 : 0)} />
        <Plate x={540} text="TRAIL CAMERA PHOTOS" y={730} size={30} tone="paper" p={ease(f, t22 + 2, 8) * (f < t23 ? 1 : 0)} />
        <Plate x={540} text="DEEP NEURAL NETWORK" y={800} size={30} tone="pale" p={ease(f, t23 + 2, 8) * (f < t24 ? 1 : 0)} />
        <Plate x={540} text="IN DEVELOPMENT" y={870} size={32} tone="pale" dashed p={ease(f, t24 + 2, 8)} />
      </>}>
      <SVG>
        <BeachBG f={g} horizon={740} shore={930} id="s5b" gulls={false} far={false} />
        {Array.from({length: 10}).map((_, i) => <CarcassMound key={i} x={420 + i * 62 + rnd(i) * 20} y={900 + (i % 3) * 8} scale={0.16 + rnd(i + 5) * 0.05} facing={i % 2 ? -1 : 1} variant={i} f={g} shadow={false} id={`s5m${i}`} />)}
        <ViewFrame x={705} y={868} w={640} h={150} f={f} mode="bracket" k={snap(f, t19 + 2, 10)} sw={7} id="s5v" />
        <g transform="translate(460 0) scale(-1 1)"><TrailCam x={230} y={1262} f={g} scale={1.25} cone={0.8} id="s5t" /></g>
        {f >= t21 && (
          <g opacity={ease(f, t21 + 4, 10)} transform="translate(930 720)">
            {[0, 1, 2].map((i) => <rect key={i} x={-46} y={i * 26} width={92} height={20} rx={4} fill={CAL.pale} opacity={0.35} stroke={INK} strokeWidth={3.4} />)}
            {[0, 1, 2].map((i) => <circle key={i} cx={30} cy={10 + i * 26} r={4} fill={i === Math.floor(f / 9) % 3 ? CAL.cream : '#3A4452'} />)}
          </g>
        )}
        {f >= t22 && <HaulPhoto x={lerp(280, 270, slide)} y={lerp(1000, 860, slide)} w={460} h={330} f={g} n={8} marks={0} guess={ease(f, t24, 24)} learn={0.12} tilt={lerp(-14, -2, slide)} id="s5p" seed={4} />}
        {flash > 0 && <circle cx={332} cy={908} r={130 * flash + 20} fill="#FFFFFF" opacity={0.5 * flash} />}
        {f >= t23 - 6 && <NeuralStack x={880} y={1020} scale={0.78} f={g} lit={lit} />}
        <CalfInset x={875} y={1300} scale={0.34} f={g} id="s5c" />
      </SVG>
    </Frame>
  );
};

// ---- S6: people mark, the network guesses (keys 25 to 28) -----------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t25 = b(25), t26 = b(26), t27 = b(26) + 33, t28 = b(28);
  const PW = 980, PH = 420, PX = 50, PY = 900, N = 7;
  const marks = N * ease(f, t25, 56);
  const idx = Math.min(N - 1, Math.floor(marks));
  const px = PX + 70 + rnd(idx * 3 + 0) * (PW - 160), py = PY + 100 + rnd(idx * 3 + 1) * (PH - 190);
  const handOn = f >= t25 && f < t25 + 62;
  const learn = f < t28 ? 0 : 0.62 * ease(f, t28, 26);
  const gauge = f < t27 ? 0.92 : f < t28 ? 0.88 - 0.06 * Math.sin((f - t27) / 3) : lerp(0.88, 0.46, ease(f, t28, 26));
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1050}
      overlay={<>
        <Plate x={540} text="ILLUSTRATIVE" displayLines={['ILLUSTRATIVE', 'HOW THIS KIND OF LEARNING WORKS']} y={525} size={30} tone="orange" p={ease(f, 4, 8)} />
        <Plate x={540} text="PEOPLE MARK" y={640} size={34} tone="paper" p={ease(f, t25 + 2, 8) * (f < t26 ? 1 : 0)} />
        <Plate x={540} text="THE NETWORK GUESSES" y={715} size={34} tone="pale" p={ease(f, t26 + 2, 8) * (f < t27 ? 1 : 0)} />
        <Plate x={540} text="COMPARES" y={790} size={34} tone="dusk" p={ease(f, t27 + 2, 8) * (f < t28 ? 1 : 0)} />
        <Plate x={540} text="ADJUSTS" y={865} size={34} tone="pale" p={ease(f, t28 + 2, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill="#1F2540" />
        {Array.from({length: 12}).map((_, i) => <path key={i} d={`M${-40 + i * 100},0 L${-40 + i * 100},1960`} stroke={CAL.pale} strokeWidth={1.6} opacity={0.08} />)}
        <HaulPhoto x={PX} y={PY} w={PW} h={PH} f={g} n={N} marks={marks} guess={ease(f, t26, 20)} learn={f < t26 ? 0 : learn} id="s6p" />
        {handOn && (<>
          <HandSil x={px + 60} y={py + 40} rot={-28} s={0.47} sleeve={false} fill={INK} />
          <HandSil x={px + 60} y={py + 40} rot={-28} s={0.45} sleeve fill="#5A4A5C" />
        </>)}
        <Gauge x={930} y={705} scale={0.5} v={gauge} f={g} />
      </SVG>
    </Frame>
  );
};

// ---- S7: a coast from orbit (keys 29, 129, 30, 31, 32) ----------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t129 = b(29) + 56, t30 = b(31) - 40, t31 = b(31), t32 = b(32);
  const shrink = easeIO(f, 0, 30);
  const d = Math.sin(g / 90) * 8;
  return (
    <Frame p={p} zk={(ff) => lerp(1.45, 1.0, easeIO(ff, 0, 44)) + 0.04 * (ff / p.dur)} oy={1100}
      overlay={<>
        <Plate x={540} text="SATELLITE VIEW" y={540} size={38} tone="pale" p={ease(f, 6, 8) * (f < t31 ? 1 : 0)} />
        <Plate x={540} text="MARINE MAMMAL PROTECTION ACT · REPORTING" displayLines={['MARINE MAMMAL PROTECTION ACT', 'REPORTING']} y={640} size={32} tone="ink" p={ease(f, t31 + 2, 8)} />
        <Plate x={540} text="METHODS IN DEVELOPMENT · NOT RESULTS" displayLines={['METHODS IN DEVELOPMENT', 'NOT RESULTS']} y={770} size={36} tone="pale" dashed p={ease(f, t32 + 2, 8)} />
      </>}>
      <SVG>
        <OrbitBG f={g} grid={ease(f, t129 - 14, 30)} />
        {shrink < 0.99 && (
          <g opacity={1 - shrink} transform={`translate(540 1100) scale(${lerp(1, 0.18, shrink)}) translate(-540 -1100)`}>
            <HaulPhoto x={90} y={850} w={900} h={420} f={g} n={7} marks={7} guess={1} learn={0.62} id="s7p" />
          </g>
        )}
        {f >= t129 - 20 && <SatelliteEye x={lerp(1150, 840, ease(f, t129 - 20, 36))} y={640} scale={0.55} f={g} scanCone={ease(f, t129, 20) * 0.6} />}
        {Array.from({length: 7}).map((_, i) => {
          const sx = 560 + rnd(i) * 440 + d, sy = 1100 + rnd(i + 30) * 420;
          const kk = snap(f, t30 + i * 4, 8);
          const flick = 0.55 + 0.45 * Math.abs(Math.sin(f / (6 + i) + i));
          return <ViewFrame key={i} x={sx} y={sy} w={112} h={72} f={f} mode="dotted" k={kk} sw={6} dim={1 - flick} id={`s7v${i}`} />;
        })}
      </SVG>
    </Frame>
  );
};

// ---- S8: nobody standing there (keys 33 to 36) -----------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t33 = b(33), t34 = b(34), t35 = b(35), t36 = b(35) + 48;
  const sx = lerp(-120, 1180, easeIO(f, t34 - 20, 140));
  const heave = 1.3;
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1150}
      overlay={<>
        <Plate x={540} text="THE FAIR OBJECTION" y={560} size={40} tone="ink" p={ease(f, t33 + 2, 8) * (f < t36 ? 1 : 0)} />
        <Plate x={540} text="3 MOUNDS · NOBODY STANDING THERE" displayLines={['3 MOUNDS', 'NOBODY STANDING THERE']} y={670} size={34} tone="dusk" p={ease(f, t35 + 2, 8)} />
      </>}>
      <SVG>
        <BeachBG f={g} horizon={820} shore={980} id="s8b" />
        <CarcassMound x={250} y={1196} scale={0.95} f={g} id="s8a" />
        <CarcassMound x={880} y={1206} scale={0.9} facing={-1} variant={1} f={g} id="s8c" />
        <WalrusCalf x={560} y={1250} f={g} scale={0.8} dull={1} eyes={0} breath={heave} mood="sleep" id="s8k" />
        <BearPrints x={60} y={1316} scale={0.9} n={5} k={1} rot={-2} />
        <SatelliteEye x={sx} y={330} scale={0.6} f={g} scanCone={ease(f, t34, 20)} />
        <ViewFrame x={540} y={1110} w={960} h={330} f={f} mode="dotted" label="3 MOUNDS" labelSize={24} k={snap(f, t35, 10)} dim={f > t36 ? 0.55 : 0} id="s8v" />
        <ViewFrame x={560} y={1160} w={400} h={250} f={f} mode="bracket" k={snap(f, t36, 10)} id="s8o" />
      </SVG>
    </Frame>
  );
};

// ---- S9: the network and the choice (keys 37 to 40) --------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t37 = 0, t38 = b(38), t39 = b(39), t40 = b(40);
  const slide = easeIO(f, t38, 30);
  const wall = ease(f, t39 - 4, 14);
  const dim = ease(f, t39, 14);
  const q = ease(f, t40, 12);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1000}
      overlay={<>
        <Plate x={540} text="TAUGHT FROM PICTURES PEOPLE COLLECT" y={560} size={36} tone="paper" p={ease(f, t38 + 2, 8) * (f < t39 ? 1 : 0)} />
        <Plate x={540} text="NOT THE CHOICE" y={630} size={42} tone="ink" p={ease(f, t39 + 2, 8) * (f < t40 ? 1 : 0)} />
        <Plate x={540} text="THE CHOICE SHE FACED" y={700} size={38} tone="orange" p={ease(f, t40 + 2, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill="#1B2140" />
        {Array.from({length: 12}).map((_, i) => <path key={i} d={`M${-40 + i * 100},0 L${-40 + i * 100},1960`} stroke={CAL.pale} strokeWidth={1.6} opacity={0.08} />)}
        <NeuralStack x={270} y={950} scale={0.95} f={g} lit={ease(f, t37, 30) * 4} dim={dim} />
        <path d={`M120,1230 L${lerp(120, 250, slide)},${lerp(1230, 1090, slide)}`} stroke={CAL.pale} strokeWidth={10} strokeDasharray="14 12" strokeDashoffset={-f} opacity={0.7} strokeLinecap="round" />
        <HaulPhoto x={lerp(40, 160, slide)} y={lerp(1240, 1090, slide)} w={200} h={150} f={g} n={4} marks={0} guess={0} id="s9p" seed={9} tilt={-6} />
        <rect x={528} y={lerp(300, 420, wall)} width={24} height={lerp(0, 880, wall)} fill="none" stroke={CAL.pale} strokeWidth={5} strokeDasharray="12 10" strokeDashoffset={-f * 0.6} opacity={wall} />
        <QMark x={810} y={900} size={380} f={g} k={1} outline={q < 0.5} glow={q} />
        <CalfInset x={880} y={1300} scale={0.32} f={g} id="s9c" />
      </SVG>
    </Frame>
  );
};

// ---- S10: ask the community first (keys 41, 42, 43) -------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t41 = b(41), t42 = b(42), t43 = b(43);
  const type = ease(f, t42, 126);
  const qDim = ease(f, t43, 18);
  return (
    <Frame p={p} z0={1.0} z1={1.03} dx0={0} dx1={-40} oy={1100}
      overlay={<>
        <Plate x={540} text="HUNTED THERE FOR SUBSISTENCE" y={540} size={34} tone="dusk" p={ease(f, t41 + 4, 8)} />
        <QuotePlate text="IT WAS VERY IMPORTANT FOR US TO ASK THE COMMUNITY FIRST · ANNISKETT · PER ALASKA PUBLIC MEDIA" y={800} size={34} wrap={24} p={ease(f, t42, 8)} type={type} />
      </>}>
      <SVG>
        <BeachBG f={g} horizon={900} shore={1080} id="s10b" dusk={1} dark={0.14} far={false} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const hx = 60 + i * 66 + rnd(i) * 20;
          return (
            <g key={i}>
              <rect x={hx} y={872} width={30} height={22} fill="#2A3140" stroke={INK} strokeWidth={2.4} />
              <path d={`M${hx - 3},872 L${hx + 15},858 L${hx + 33},872 Z`} fill="#1F2430" stroke={INK} strokeWidth={2.4} />
              <rect x={hx + 10} y={878} width={8} height={9} fill="#E8B66A" opacity={0.95} />
              <circle cx={hx + 14} cy={882} r={12} fill="#E8B66A" opacity={0.18} />
            </g>
          );
        })}
        <WalrusCalf x={150} y={1264} f={g} scale={0.46} eyes={0.9} breath={1.1} mood="calm" id="s10k" />
        <NearPlane y={1470} f={g} seed={3} tone="#5E5648" />
        <QMark x={950} y={640} size={96} f={g} k={1 - qDim * 0.85} outline />
      </SVG>
    </Frame>
  );
};


// ---- S11: it felt hard (keys 44 to 47) ------------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t44 = b(44), t45 = b(45), t46 = b(46), t47 = b(46) + 66;
  const lower = ease(f, t46, 22);
  const hy = 640 + 70 * lower + 3 * Math.sin(f * 0.9) * (1 - lower);
  const back = ease(f, t46 + 4, 30);
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={1100}
      overlay={<>
        <Plate x={390} text="IT FELT HARD" y={540} size={40} tone="dusk" p={ease(f, t44 + 4, 8) * (f < t45 ? 1 : 0)} />
        <QuotePlate x={390} text="WE CAN'T CHOOSE THIS ON OUR OWN · ANNISKETT" y={700} size={36} wrap={22} p={ease(f, t45, 8) * (f < t46 + 2 ? 1 : 0)} type={ease(f, t45, 40)} />
        <Plate x={390} text="ONCE THE COMMUNITY DECIDED" y={860} size={32} tone="paper" p={ease(f, t46 + 2, 8) * (f < t47 ? 1 : 0.0)} />
      </>}>
      <SVG>
        <BeachBG f={g} horizon={420} shore={500} id="s11b" dusk={1} dark={0.22} gulls={false} far={false} />
        <WalrusCalf x={470} y={1262} f={g} scale={2.3} eyes={0.85} breath={1.2} mood={f < t46 ? 'afraid' : 'calm'} shiver={f < t46 ? 0.2 : 0} id="s11k" />
        <HandSil x={770} y={hy - 40} rot={180} s={0.84} sleeve={false} fill={INK} />
        <HandSil x={770} y={hy - 40} rot={180} s={0.8} sleeve fill="#5A4A5C" />
        <ViewFrame x={580} y={1100} w={lerp(960, 1300, back)} h={lerp(560, 760, back)} f={f} mode="bracket" k={snap(f, 0, 8)} dim={0.65 * back} id="s11v" />
        {f >= t47 && <ViewFrame x={930} y={1000} w={200} h={420} f={f} mode="box" k={snap(f, t47, 10)} id="s11d" />}
      </SVG>
    </Frame>
  );
};

// ---- S12: to the cabin (keys 48 to 51) --------------------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t48 = b(48), t49 = b(49), t50 = b(50), t51 = b(51);
  const inside = f >= t50 - 4;
  const walk = easeIO(f, 0, 118);
  const vx = lerp(60, 560, walk), tx = lerp(-80, 420, walk), cxp = lerp(-40, 700, walk);
  const door = ease(f, t49 - 10, 26);
  const lamp = f < t50 ? 0.12 : 0.12 + 0.88 * ease(f, t50, 6);
  const sit = ease(f, t51, 24);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1150}
      overlay={<>
        <Plate x={540} text="THEY WALKED HIM TO CAMP" y={540} size={34} tone="dusk" p={ease(f, t48 + 4, 8) * (f < t49 ? 1 : 0)} />
        <Plate x={540} text="AN OLD BROKEN DOOR" y={610} size={36} tone="paper" p={ease(f, t49 + 2, 8) * (f < t50 ? 1 : 0)} />
        <Plate x={540} text="THE CAMP CABIN" y={680} size={38} tone="paper" p={ease(f, t50 + 2, 8) * (f < t51 ? 1 : 0)} />
        <Plate x={540} text="THEY STAYED THE NIGHT" y={750} size={34} tone="dusk" p={ease(f, t51 + 2, 8)} />
      </>}>
      <SVG>
        {!inside && (
          <g>
            <BeachBG f={g} horizon={880} shore={1010} id="s12b" dusk={1} dark={0.24} far={false} gulls={false} />
            <BearPrints x={40} y={1060} scale={0.55} n={5} k={1} rot={-6} />
            <rect x={760} y={820} width={300} height={380} fill="#3A2E28" stroke={INK} strokeWidth={6} />
            <path d="M740,820 L910,740 L1080,820 Z" fill="#2A211C" stroke={INK} strokeWidth={6} />
            {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${790 + i * 55},830 L${790 + i * 55},1195`} stroke={INK} strokeWidth={2.4} opacity={0.5} />)}
            <CabinDoor x={790} y={1200} scale={0.85} open={door} f={g} />
            <Violet x={vx} y={1300} f={g} scale={0.6} walking={f < 120} />
            <Tony x={tx} y={1290} f={g} scale={0.6} facing={1} walking={f < 120} />
            <WalrusCalf x={Math.min(cxp, 840)} y={1290} f={g} scale={0.72} eyes={0.9} breath={0.9} mood="calm" id="s12k" />
          </g>
        )}
        {inside && (
          <g>
            <CabinBG f={g} wx={760} wy={780} ww={280} wh={340} lamp={lamp} id="s12c" />
            <WalrusCalf x={640} y={1262} f={g} scale={1.1} eyes={0.9} breath={1} mood="calm" id="s12i" />
            <Violet x={lerp(120, 330, sit)} y={1310} f={g} scale={0.66} walking={sit > 0 && sit < 1} />
            <Tony x={lerp(1010, 900, sit)} y={1310} f={g} scale={0.66} facing={-1} walking={sit > 0 && sit < 1} />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S13: hoo hoo at the window (keys 52 to 55) ----------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t52 = b(52), t53 = b(53), t54 = b(54), t55 = b(55);
  const call = f >= t52 && f < t52 + 48 ? 1 : 0;
  const toWin = easeIO(f, t53 - 20, 26);
  const dawn = ease(f, t54, 24);
  const sleep = ease(f, t55 - 10, 20);
  const calfX = f < t55 - 12 ? lerp(520, 640, toWin) : 540;
  return (
    <Frame p={p} z0={1.0} z1={1.1} oy={1050}
      overlay={<>
        <Plate x={540} text={'"HOO, HOO"'} y={540} size={44} tone="paper" p={ease(f, t52 + 2, 8) * (f < t53 ? 1 : 0)} />
        <Plate x={540} text="THE WINDOW" y={610} size={40} tone="dusk" p={ease(f, t53 + 2, 8) * (f < t54 ? 1 : 0)} />
        <Plate x={540} text="DAY TWO" y={680} size={42} tone="ink" p={ease(f, t54 + 2, 8) * (f < t55 ? 1 : 0)} />
        <Plate x={540} text="ASLEEP AGAINST HER" y={750} size={36} tone="paper" p={ease(f, t55 + 2, 8)} />
      </>}>
      <SVG>
        <CabinBG f={g} wx={740} wy={900} ww={300} wh={360} lamp={1 - 0.55 * dawn} id="s13c" door={false} />
        <rect x={590} y={720} width={300} height={360} fill="#8AA0B4" opacity={0.0 + 0.8 * dawn} />
        {f >= t52 && f < t53 && <ViewFrame x={calfX + 230} y={1090} w={330} h={260} f={f} mode="bracket" k={snap(f, t52, 10)} sw={8} id="s13b" />}
        {f >= t53 && <ViewFrame x={740} y={900} w={300} h={360} f={f} mode="window" k={snap(f, t53, 12)} glow={1 - dawn} sill id="s13w" />}
        <Violet x={190} y={1300} f={g} scale={0.85} facing={1} />
        {f < t55 - 10 ? (
          <WalrusCalf x={calfX} y={1262} f={g} scale={1.7} eyes={1} breath={1} mood="sad" raise={1} call={call} id="s13k" />
        ) : (
          <WalrusCalf x={520} y={1264} f={g} scale={1.3} facing={-1} eyes={1 - sleep} breath={1.1} mood={sleep > 0.5 ? 'sleep' : 'content'} snoutDown={sleep} id="s13s" />
        )}
      </SVG>
    </Frame>
  );
};

// ---- S14: 800 miles (keys 56 to 60) ---------------------------------------------------------------------------------------------------------------------
const ROUTE = 'M92,118 C150,96 230,112 292,176 L318,205';
const routePos = (t: number): [number, number] => {
  if (t < 0.8) {
    const u = t / 0.8, w = 1 - u;
    return [w * w * w * 92 + 3 * w * w * u * 150 + 3 * w * u * u * 230 + u * u * u * 292, w * w * w * 118 + 3 * w * w * u * 96 + 3 * w * u * u * 112 + u * u * u * 176];
  }
  const v = (t - 0.8) / 0.2;
  return [292 + 26 * v, 176 + 29 * v];
};
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t56 = b(56), t57 = b(57), t58 = b(58), t59 = b(59), t60 = b(60);
  const phase = f < t57 - 2 ? 0 : f < t58 - 2 ? 1 : f < t59 - 2 ? 2 : 3;
  const sk = lerp(220, 860, easeIO(f, 0, t57 - 4));
  const kc = lerp(200, 640, easeIO(f, t57 + 10, 40));
  const route = ease(f, t59, 60);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1050}
      overlay={<>
        <Plate x={540} text="ACROSS THE LAGOON" y={540} size={36} tone="ink" p={ease(f, t56 + 4, 8) * (phase === 0 ? 1 : 0)} />
        <Plate x={540} text="ALASKA SEALIFE CENTER · KENNEL" displayLines={['ALASKA SEALIFE CENTER', 'KENNEL']} y={640} size={34} tone="paper" p={ease(f, t57 + 2, 8) * (phase === 1 ? 1 : 0)} />
        <Plate x={540} text="FLEW TO ANCHORAGE" y={750} size={38} tone="dusk" p={ease(f, t58 + 2, 8) * (phase === 2 ? 1 : 0)} />
        <Plate x={540} text="MORE THAN 800 MILES TO SEWARD" displayLines={['MORE THAN 800 MILES', 'TO SEWARD']} y={830} size={38} tone="orange" p={ease(f, t60 + 2, 8)} />
      </>}>
      <SVG>
        {phase === 0 && (
          <g>
            <rect x={-40} y={0} width={1160} height={900} fill={`url(#s14sky)`} />
            <defs><linearGradient id="s14sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={CAL.skyTop} /><stop offset="1" stopColor={CAL.haze} /></linearGradient></defs>
            <path d="M-40,880 L200,850 L420,870 L640,845 L900,872 L1120,850 L1120,940 L-40,940 Z" fill="#6F7F88" opacity={0.7} />
            <rect data-band="ok" x={-40} y={920} width={1160} height={1040} fill={CAL.sea} />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={`M-40,${960 + i * 70 + 6 * Math.sin(g / 20 + i)} q140,-12 280,0 t280,0 t280,0 t280,0`} fill="none" stroke="#FFFFFF" strokeWidth={3 + i * 0.6} opacity={0.14 + i * 0.03} />)}
            <path d={`M${sk - 240},1150 q-80,10 -170,-4 M${sk - 250},1170 q-120,14 -250,-6`} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.4} />
            <NearPlane y={1470} f={g} seed={5} tone="#34474C" />
            <Skiff x={sk} y={1120} scale={1.05} f={g} id="s14k" />
            <WalrusCalf x={sk - 20} y={1092} f={g} scale={0.3} eyes={0.9} breath={0.9} mood="calm" shadow={false} id="s14c" />
            {[-90, 70, 130].map((dx, i) => <g key={i}><circle cx={sk + dx} cy={1000 + (i === 1 ? 6 : 0)} r={17} fill="#2A2F36" stroke={INK} strokeWidth={3} /><rect x={sk + dx - 17} y={1018} width={34} height={56} rx={14} fill="#2A2F36" stroke={INK} strokeWidth={3} /></g>)}
          </g>
        )}
        {phase === 1 && (
          <g>
            <BeachBG f={g} horizon={760} shore={940} id="s14b" far={false} />
            <Kennel x={700} y={1260} scale={1.2} f={g} door={ease(f, t57, 20)} id="s14n" />
            <WalrusCalf x={kc} y={1262} f={g} scale={0.55} eyes={0.9} breath={0.9} mood="calm" id="s14d" />
            <HandSil x={kc - 220} y={1090} rot={90} s={0.63} sleeve={false} fill={INK} />
            <HandSil x={kc - 220} y={1090} rot={90} s={0.6} sleeve fill="#5A4A5C" />
            <ViewFrame x={800} y={1090} w={300} h={330} f={f} mode="bracket" k={snap(f, t57 + 4, 10)} sw={8} id="s14o" />
            <NearPlane y={1470} f={g} seed={6} />
          </g>
        )}
        {phase === 2 && (
          <g>
            <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={CAL.skyLow} />
            {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={200 + i * 190 + 40 * Math.sin(g / 60 + i)} cy={600 + i * 140} rx={230} ry={30} fill="#FFFFFF" opacity={0.22} />)}
            <g transform={`rotate(${-12 + 10 * Math.sin(g / 20)} 540 900)`}>
              <path d={`M-160,905 L${lerp(-160, 1240, easeIO(f, t58 - 4, 64)) - 150},905`} stroke={CAL.cream} strokeWidth={6} strokeDasharray="16 14" strokeDashoffset={-g} opacity={0.7} />
              <BushPlane x={lerp(-160, 1240, easeIO(f, t58 - 4, 64))} y={900} scale={1.1} f={g} mode="fly" propSpeed={1.4} />
            </g>
            <path d="M-40,1500 L1120,1420 L1120,1960 L-40,1960 Z" fill={CAL.gravelShade} opacity={0.55} />
          </g>
        )}
        {phase === 3 && (
          <g>
            <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill="#8FA4A8" />
            <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill="#2A5568" opacity={0.55} />
            <g transform="translate(120 905) scale(1.75)">
              <AlaskaMini frame={g} x={0} y={0} scale={1} pin={false} />
              <path d={ROUTE} fill="none" stroke={CAL.cream} strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - route} />
              <path d={ROUTE} fill="none" stroke="#16203F" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - route} />
              {(() => { const [rx, ry] = routePos(route); return <circle cx={rx} cy={ry} r={9 + 2 * Math.sin(f / 4)} fill={CAL.cream} stroke="#16203F" strokeWidth={4} opacity={route > 0.02 ? 1 : 0} />; })()}
              {[[92, 118, 'POINT LAY'], [292, 176, 'ANCHORAGE'], [318, 205, 'SEWARD']].map(([cx, cy, lb], i) => (
                <g key={i} opacity={ease(f, t59 + i * 24, 8)}>
                  <circle cx={cx as number} cy={cy as number} r={8} fill="#16203F" stroke={CAL.cream} strokeWidth={4} />
                  <text x={(cx as number) + (i === 0 || i === 2 ? 14 : -14)} y={(cy as number) + (i === 0 ? -14 : i === 1 ? -14 : 10)} textAnchor={i === 0 || i === 2 ? 'start' : 'end'} fontFamily={MONO} fontWeight={800} fontSize={17} fill="#16203F" stroke={CAL.cream} strokeWidth={4} paintOrder="stroke">{lb as string}</text>
                </g>
              ))}
            </g>
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S15: doing well (keys 61, 62) -------------------------------------------------------------------------------------------------------------------------
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t61 = b(61), t62 = b(62);
  const bob = Math.sin(g / 21) * 7;
  return (
    <Frame p={p} z0={1.0} z1={1.04} oy={1100}
      overlay={<>
        <Plate x={540} text="SEALIFE CENTER · DOING WELL" y={540} size={34} tone="ink" p={ease(f, t61 + 2, 8)} />
        <Plate x={540} text="ANNAUTAQ" displayLines={['ANNAUTAQ', 'NAMED FOR HER LATE FATHER']} y={680} size={34} tone="paper" p={ease(f, t62 + 2, 8)} />
        <ViewFrame x={540} y={680} w={760} h={170} f={f} mode="bracket" k={snap(f, t62 + 6, 10)} sw={8} id="s15o" />
      </>}>
      <SVG>
        <defs><linearGradient id="s15w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DCE9E6" /><stop offset="1" stopColor="#9FC2C0" /></linearGradient></defs>
        <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill="url(#s15w)" />
        {Array.from({length: 9}).map((_, i) => <path key={i} d={`M${-40 + i * 140},0 L${-40 + i * 140},1960`} stroke="#FFFFFF" strokeWidth={3} opacity={0.35} />)}
        {Array.from({length: 14}).map((_, i) => <path key={i} d={`M-40,${i * 140} L1120,${i * 140}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.3} />)}
        <Pool x={540} y={1330} w={800} h={430} f={g} id="s15p" />
        <WalrusCalf x={520} y={1030 + bob} f={g} scale={1.45} eyes={0.75} breath={1.3} mood="content" raise={0.5} id="s15k" />
        <rect x={140} y={920} width={800} height={410} fill="#7CC4D0" opacity={0.45} />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${200 + i * 120 + 18 * Math.sin(g / 17 + i)},930 l40,0 l-14,300 l-40,0 Z`} fill="#FFFFFF" opacity={0.12 + 0.05 * Math.sin(g / 11 + i)} />)}
        {[0, 1, 2].map((i) => <path key={i} d={`M150,${950 + i * 22 + 4 * Math.sin(g / 12 + i)} q100,-10 200,0 t200,0 t200,0 t200,0`} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.5 - i * 0.12} />)}
        <rect x={110} y={900} width={860} height={22} fill="#D8D2C2" stroke={INK} strokeWidth={5} />
      </SVG>
    </Frame>
  );
};

// ---- S16: who should still be there (keys 63 to 66) ------------------------------------------------------------------------------------------------------
const S16: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t63 = b(63), t64 = b(63) + 27, t65 = b(66);
  const zoom = Math.exp(lerp(0, Math.log(5.5), easeIO(f, t64 + 6, 52)));
  const orbit = 1 - ease(f, t65 - 12, 16);
  const flick = 0.5 + 0.5 * Math.abs(Math.sin(f / 5));
  return (
    <Frame p={p} z0={1.0} z1={1.02} oy={1100}
      overlay={<>
        <Plate x={540} text="DO THE COUNTING" y={690} size={40} tone="pale" p={ease(f, t64 + 2, 8) * (f < t65 ? 1 : 0)} />
        <Plate x={540} text="WHO SHOULD STILL BE ON THE BEACH?" displayLines={['WHO SHOULD STILL BE', 'ON THE BEACH?']} y={560} size={42} tone="orange" p={ease(f, t65 + 2, 8)} />
      </>}>
      <SVG>
        <g opacity={1 - orbit}>
          <BeachBG f={g} horizon={860} shore={1010} id="s16b" far={false} />
          <Violet x={540} y={1290} f={g} scale={0.95} pose="carry" />
          <Phone x={540 + 120 * 0.95} y={1290 - 190 * 0.95} scale={1.3} />
          <ViewFrame x={570} y={1010} w={420} h={640} f={f} mode="bracket" k={snap(f, t65 + 4, 10)} id="s16v" />
          <Tally x={190} y={1300} scale={0.55} n={3} roll={0.5 + 0.04 * Math.sin(f * 1.6)} shiver={1} f={g} />
          <NearPlane y={1470} f={g} seed={8} />
        </g>
        <g opacity={orbit}>
          <g transform={`translate(800 1250) scale(${zoom}) translate(-800 -1250)`}>
            <OrbitBG f={g} grid={1} />
            {Array.from({length: 6}).map((_, i) => <ViewFrame key={i} x={560 + rnd(i) * 440} y={1100 + rnd(i + 30) * 420} w={74} h={46} f={f} mode="dotted" k={snap(f, t64 + i * 3, 8)} sw={4} dim={1 - flick} id={`s16d${i}`} />)}
            <ViewFrame x={800} y={1250} w={300} h={220} f={f} mode="dotted" k={snap(f, t64 + 4, 10)} sw={5} id="s16c" />
          </g>
          <Tally x={930} y={1300} scale={0.5} n={2} roll={0.5 + 0.4 * Math.sin(f * 1.3)} shiver={1} f={g} />
        </g>
        <SatelliteEye x={lerp(1150, 860, ease(f, t63, 20))} y={620} scale={0.5} f={g} scanCone={0.4 * orbit} />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={CAL.navy} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={CAL.cream}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'COUNT', 2: 'PIN', 3: 'STOMACH', 4: 'QUESTION', 5: 'MACHINES', 6: 'MECHANISM', 7: 'ORBIT', 8: 'NOBODY', 9: 'WALL', 10: 'DUSK', 11: 'HAND', 12: 'CABIN WALK', 13: 'WINDOW', 14: 'MILES', 15: 'POOL', 16: 'BUTTON'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15, 16: S16};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

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

export const ep1021Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1021Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1021: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 5.66, 17.88, 27.36, 32.76, 44.84, 50.72, 60.26, 67.66, 74.36, 81.92, 91.16, 98.3, 105.98, 117.72, 123.78, 129.3].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#16203F" ink="#F4EEDC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
