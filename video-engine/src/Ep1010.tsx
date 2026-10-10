import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, NightGrade, INK, ContactShadow} from './lib/lighting';
import {VoiceProvider, useVoice} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {Character} from './lib/Character';
import {ImpactStar} from './lib/FX';
import {Snowfall} from './lib/refinery';
import {
  PC, monoW, PoleCam, Tape, Pickup, PatrolCar, Drone, FeedWall, Rulebook, LotNight, ShoppingCart, SawBlade, HandSign,
  ScanBeam, Ladder, Calendar, Podium, Folder, Clamp, Shredder, Storefront, ServerBox, StatementCard, TvMonitor,
} from './lib/polecam';

// WHO KEEPS THE PLATE, 2026-10-10. Palette roles are art_direction.json. AMBER means only the store, MAGENTA only the vendor,
// CIVIC BLUE only the city, CYAN only the machine reading. Every painted string is a claims.json on_screen string, a quote, or a plain label.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const C = {ink: INK, paper: PC.paper, amber: PC.sodium, mag: PC.lilac, civic: PC.civic, cyan: PC.cyan, bone: PC.bone};

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

type Tone = 'ink' | 'paper' | 'amber' | 'mag' | 'civic' | 'cyan';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#10151F', fg: '#EDE6D2'},
  paper: {fill: PC.paper, fg: C.ink},
  amber: {fill: PC.sodium, fg: C.ink},
  mag: {fill: PC.lilac, fg: C.ink},
  civic: {fill: PC.civicDeep, fg: '#F4F1E6'},
  cyan: {fill: '#0B1219', fg: PC.cyan},
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
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={1} fill={PC.civicDeep}>{by}</text>}
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

// ---- shared small pieces ---------------------------------------------------------------------
/** A bare pole with a bracket and no camera (the store's pole, the leash shot). Origin = base. */
const BarePole: React.FC<{x: number; y: number; h?: number; scale?: number; glint?: number}> = ({x, y, h = 460, scale = 1, glint = 0}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={4} rx={80} ry={10} opacity={0.5} />
    <path d="M -34 0 L -22 -22 L 22 -22 L 34 0 Z" fill="#7C8792" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-12} y={-h} width={24} height={h - 18} fill="#8C97A3" stroke={INK} strokeWidth={5} />
    <rect x={-6} y={-h + 6} width={5} height={h - 30} fill="#fff" opacity={0.22} />
    <rect x={-14} y={-h + 14} width={44} height={14} fill="#8C97A3" stroke={INK} strokeWidth={4} />
    {glint > 0.02 && <path d={`M ${12} ${-h + 10} l 10 -14 l 4 12 l 14 4 l -12 8 z`} fill="#fff" opacity={glint} />}
  </g>
);

/** The night street the neighbor stands on: slate sky, dim buildings, a public lamp (neutral white), curb and road. */
const StreetNight: React.FC<{f: number; shift?: number; ground?: number}> = ({f, shift: s0 = 0, ground = 1180}) => {
  const shift = s0 + 18 * Math.sin(f / 150);
  return (
    <g>
      <defs>
        <linearGradient id="sn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={PC.sky} /><stop offset="1" stopColor="#2B4B5C" /></linearGradient>
        <radialGradient id="sn-lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={PC.lampWhite} stopOpacity="0.55" /><stop offset="1" stopColor={PC.lampWhite} stopOpacity="0" /></radialGradient>
      </defs>
      <rect data-band="ok" x={-20} y={-20} width={1120} height={ground + 40} fill="url(#sn-sky)" />
      {Array.from({length: 36}, (_, i) => <circle key={i} cx={rnd(i + 5) * 1080} cy={rnd(i + 55) * (ground - 600)} r={1 + (i % 3) * 0.7} fill="#fff" opacity={0.3 + 0.35 * Math.sin(f / 21 + i)} />)}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const bx = -60 + i * 210 - shift * 0.4, bh = 260 + rnd(i + 90) * 220;
        return (
          <g key={i}>
            <rect x={bx} y={ground - bh} width={196} height={bh} fill={i % 2 ? '#1E2E3A' : '#182632'} stroke={INK} strokeWidth={4} />
            {Array.from({length: 6}, (_, k) => <rect key={k} x={bx + 22 + (k % 2) * 80} y={ground - bh + 40 + Math.floor(k / 2) * 70} width={44} height={34} fill={rnd(i * 7 + k) > 0.55 ? PC.lampWhite : '#10202B'} opacity={rnd(i * 7 + k) > 0.55 ? 0.7 : 1} stroke={INK} strokeWidth={2.4} />)}
          </g>
        );
      })}
      <rect data-band="ok" x={-20} y={ground} width={1120} height={80} fill="#4A5560" stroke={INK} strokeWidth={5} />
      <rect data-band="ok" x={-20} y={ground + 80} width={1120} height={1960 - ground - 80} fill={PC.asphalt} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={40 + i * 280 - shift} y={ground + 360} width={150} height={12} fill={PC.paper} opacity={0.3} />)}
      <g transform={`translate(${130 - shift * 0.8},${ground + 20})`}>
        <circle cx={0} cy={-340} r={240} fill="url(#sn-lamp)" />
        <rect x={-8} y={-380} width={16} height={380} fill="#4A525C" stroke={INK} strokeWidth={4} />
        <rect x={-8} y={-380} width={60} height={12} fill="#4A525C" stroke={INK} strokeWidth={3.4} />
        <rect x={34} y={-374} width={36} height={14} rx={3} fill={PC.lampWhite} stroke={INK} strokeWidth={3} />
      </g>
      <Snowfall f={f} n={34} />
    </g>
  );
};

/** Small hand silhouette in an owner colour, reaching along its own +x. */
const ShadowHand: React.FC<{x: number; y: number; rot: number; color: string; reach: number; tremble?: number}> = ({x, y, rot, color, reach, tremble = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) translate(${reach},${tremble})`}>
    <path d="M -300 -26 L -40 -34 L -40 34 L -300 26 Z" fill={color} stroke={INK} strokeWidth={5} opacity={0.94} />
    <ellipse cx={0} cy={0} rx={52} ry={46} fill={color} stroke={INK} strokeWidth={5} opacity={0.94} />
    {[-32, -11, 11, 32].map((fy, i) => <rect key={i} x={30} y={fy - 8} width={64 - Math.abs(fy) * 0.3} height={16} rx={8} fill={color} stroke={INK} strokeWidth={4.4} opacity={0.94} />)}
    <rect x={-18} y={-72} width={46} height={24} rx={12} fill={color} stroke={INK} strokeWidth={4.4} opacity={0.94} transform="rotate(-30 -18 -60)" />
    <g transform="translate(110,-4)"><circle r={24} fill={PC.paper} stroke={INK} strokeWidth={4} /><text y={11} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={34} fill={INK}>?</text></g>
  </g>
);

// ---- S1: the pole they cut (beats 1 to 4) ----------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const fallT = clamp01((f - (b(4) - 6)) / 26);
  const fall = fallT * fallT * (3 - 2 * fallT);
  const cutP = ease(f, b(3) + 6, 56);
  const cutting = f > b(3) - 8 && f < b(4) + 4;
  const mood = f < b(3) ? 'proud' : f < b(4) + 4 ? 'calm' : 'off';
  const pxCar = interpolate(f, [b(2) - 10, b(2) + 120], [-420, 1500], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const look = clamp01(Math.abs(pxCar - 540) < 700 ? 1 : 0) * Math.max(-1, Math.min(1, (pxCar - 540) / 420)) * (f > b(2) - 10 && f < b(3) ? 1 : 0);
  const sawIn = easeIO(f, b(3) - 14, 22);
  const sawOut = easeIO(f, b(4) + 4, 18);
  const stroke = cutting ? 34 * Math.sin(f * 0.75) : 0;
  const sawX = lerp(-440, 214, sawIn) + stroke - 700 * sawOut;
  const tapeP = ease(f, b(2) + 4, 40) * (fall < 0.02 ? 1 : 0);
  const ladderX = 420 - 760 * easeIO(f, b(2), 36);
  const landed = f > b(4) + 10;
  const puff = clamp01((f - (b(4) + 12)) / 26);
  return (
    <Frame p={p} z0={1.0} z1={1.05} night={0.1}
      overlay={<>
        <Plate text="FLOCK CAMERA · ANCHORAGE LOWE'S" y={566} size={28} p={ease(f, b(1) + 8, 10) * (f < b(3) ? 1 : 0)} />
        <Plate text="WITHIN DAYS" y={566} size={34} tone="paper" p={ease(f, b(3) + 6, 10) * (f < b(4) ? 1 : 0)} />
        <Plate text="OCT 4 · ABOUT 11:28 PM · OLD SEWARD HWY" y={566} size={26} p={ease(f, b(4) + 8, 12)} />
      </>}>
      <SVG>
        <LotNight f={f + p.from} ground={1060} lamp={0.88 + 0.12 * Math.sin(f / 5)} />
        <Ladder x={ladderX} y={1330} scale={1.35} lean={-8} />
        <Pickup f={f} x={pxCar} y={1285} scale={0.9} roll={f * 14} />
        {/* the saw's tip and shadow wait at frame left from frame 1 */}
        <g opacity={f < b(3) - 14 ? 1 : 0}><path d="M -10 1092 L 46 1098 L 46 1114 L -10 1112 Z" fill="#B8C2CC" stroke={INK} strokeWidth={4} /></g>
        <PoleCam f={f} x={540} y={1330} h={440} cutAt={250} scale={1.2} mood={mood} look={look} ribbon={fall < 0.02} glow={f < b(3) ? 0.35 : 0}
          cut={cutP} fall={fall} lean={fall < 0.02 ? 3 * cutP * Math.sin(f * 0.8) : 0} />
        {fall < 0.02 && <Tape f={f} x={622} y={826} rot={90} len={330} printed={tapeP} trucks={3} wave={5} phase={1} />}
        {landed && <Tape f={f} x={700} y={1340} rot={4} len={280} printed={ease(f, b(4) + 12, 30)} trucks={3} wave={3} />}
        {cutting && <SawBlade x={sawX} y={1102} rot={-2} scale={1.1} />}
        {cutting && Array.from({length: 8}, (_, i) => {
          const ph = (f * 1.6 + i * 11) % 44;
          return <circle key={i} cx={520 + 8 * Math.sin(i * 2 + f / 3)} cy={1114 + ph * 1.5} r={2.6} fill="#D7C79B" opacity={1 - ph / 48} />;
        })}
        {landed && <g opacity={1 - puff}>{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={640 + (i - 2) * 40 * puff} cy={1326 - 30 * puff - (i % 2) * 14} r={14 + 36 * puff} fill="#E6EEF0" opacity={0.55} />)}</g>}
        {f > b(4) + 4 && f < b(4) + 12 && <ImpactStar cx={660} cy={1310} r={46} color="#FFFFFF" rot={12} />}
        <HandSign x={220} y={1380} scale={1.1} rot={-4} p={ease(f, b(4) + 36, 20)} />
        <Snowfall f={f + p.from} n={60} />
      </SVG>
    </Frame>
  );
};

// ---- S2: what the machine reads (beats 5 to 7) --------------------------------------------------------
const TAGS = [
  {name: 'PLATE', from: [556, 1180], to: [880, 780]},
  {name: 'MAKE', from: [915, 1190], to: [880, 860]},
  {name: 'COLOR', from: [830, 1150], to: [880, 940]},
  {name: 'BODY TYPE', from: [750, 1135], to: [880, 1020]},
];
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const zoom = 1 + 2.6 * (1 - easeIO(f, 0, 56));
  const beam = ease(f, b(6), 26);
  const glow = 0.4 + 0.6 * beam;
  return (
    <Frame p={p} zk={() => zoom * lerp(1.0, 1.04, easeIO(f, 56, 200))} ox={265} oy={683} night={0.05} tagText="FLOCK'S OWN WORDS · ILLUSTRATION"
      overlay={<>
        <Plate text="FLOCK" y={546} size={34} tone="mag" p={ease(f, b(5) + 24, 10) * (f < b(6) ? 1 : 0)} />
        <Plate text="FLOCK'S OWN FAQ · MACHINE LEARNING" y={546} size={26} tone="cyan" p={ease(f, b(6) + 4, 10)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="#0B1219" />
        {Array.from({length: 24}, (_, i) => <path key={i} d={`M ${-20 + i * 50} 0 L ${-20 + i * 50} 1920`} stroke="#162833" strokeWidth={2} />)}
        {Array.from({length: 40}, (_, i) => <path key={i} d={`M 0 ${i * 50} L 1080 ${i * 50}`} stroke="#162833" strokeWidth={2} />)}
        <path d="M -20 1255 L 1100 1255" stroke="#2A4350" strokeWidth={4} />
        {beam > 0.02 && [0, 1, 2].map((i) => {
          const r = (((f - b(6)) * 5 + i * 80) % 240);
          return <circle key={i} cx={265} cy={683} r={r} fill="none" stroke={PC.cyan} strokeWidth={3} opacity={0.5 * (1 - r / 240)} />;
        })}
        <PoleCam f={f} x={220} y={1250} h={330} cutAt={250} scale={1.5} mood="proud" look={0.9} glow={glow} />
        <Pickup f={f} x={745} y={1250} scale={1.15} roll={f * 3} lamps={false} plateGlow={beam} />
        <ScanBeam f={f} x={265} y={690} tx={650} ty={1140} spread={90} p={beam} />
        {TAGS.map((t, i) => {
          const k = ease(f, b(7) + i * 14, 20);
          if (k < 0.02) return null;
          const px = lerp(t.from[0], t.to[0], k), py = lerp(t.from[1], t.to[1], k);
          return (
            <g key={t.name}>
              <path d={`M ${t.from[0]} ${t.from[1]} L ${px - 70} ${py}`} stroke={PC.cyan} strokeWidth={3} strokeDasharray="8 7" opacity={0.8} />
              <g transform={`translate(${px},${py}) scale(${0.8 + 0.2 * spring(k * 20, 0, 20)})`}>
                <rect x={-96} y={-22} width={192} height={44} rx={5} fill="#0B1219" stroke={PC.cyan} strokeWidth={3.4} />
                <text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} letterSpacing={2} fill={PC.cyan}>{t.name}</text>
              </g>
            </g>
          );
        })}
        <Tape f={f} x={160} y={1290} rot={0} len={640} printed={ease(f, b(6) + 8, 60)} trucks={4} wave={3} w={30} phase={2} />
      </SVG>
    </Frame>
  );
};

// ---- S3: who decides what it keeps (beats 8 to 9) --------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const reach = easeIO(f, b(8) + 10, 40);
  const frozen = f > b(9);
  const tr = frozen ? 0 : 5 * Math.sin(f / 2.6);
  const stamp = f < b(9) ? 0 : spring(f, b(9), 16);
  const x0 = -900 + f * 7;
  return (
    <Frame p={p} z0={1.0} z1={1.04} night={0.05}
      overlay={<>
        <Plate text="WHO DECIDES WHAT IT KEEPS?" y={640} size={32} p={ease(f, b(8) + 8, 10) * (f < b(9) ? 1 : 0)} />
        <Plate text="NOT WHO YOU'D THINK" y={640} size={34} tone="paper" p={ease(f, b(9) + 8, 10)} />
        {stamp > 0.02 && (
          <g transform={`translate(540,930) rotate(-9) scale(${stamp})`}>
            <circle r={104} fill={PC.paper} stroke={INK} strokeWidth={9} />
            <circle r={88} fill="none" stroke={INK} strokeWidth={3} />
            <text y={50} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={150} fill={INK}>?</text>
          </g>
        )}
      </>}>
      <SVG>
        <defs><radialGradient id="s3-lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={PC.lampWhite} stopOpacity="0.32" /><stop offset="1" stopColor={PC.lampWhite} stopOpacity="0" /></radialGradient></defs>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="#10181C" />
        {Array.from({length: 26}, (_, i) => <path key={i} d={`M -20 ${i * 76 + 10} Q 540 ${i * 76 + 24 * Math.sin(i)} 1100 ${i * 76 + 10}`} stroke="#1A2A31" strokeWidth={3} fill="none" />)}
        <ellipse cx={540} cy={900} rx={520} ry={420} fill="url(#s3-lamp)" />
        <Tape f={f} x={x0} y={900} len={2400} w={64} printed={1} trucks={32} wave={7} phase={3} tint={PC.paper} />
        <ShadowHand x={-40} y={900} rot={0} color={PC.sodium} reach={lerp(0, 330, reach)} tremble={tr} />
        <ShadowHand x={1120} y={900} rot={180} color={PC.lilac} reach={lerp(0, 330, reach)} tremble={-tr} />
        <ShadowHand x={540} y={-30} rot={90} color={PC.civic} reach={lerp(0, 330, reach)} tremble={tr * 0.8} />
        {Array.from({length: 18}, (_, i) => <circle key={i} cx={(rnd(i + 3) * 1080 + f * 0.3 * (1 + i % 3)) % 1080} cy={(rnd(i + 70) * 1900 + f * 0.2) % 1900} r={1.6 + (i % 3)} fill={PC.lampWhite} opacity={0.35} />)}
      </SVG>
    </Frame>
  );
};

// ---- S4: Flock told a TV station (beats 10 to 12) ----------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slideB = easeIO(f, b(11), 26);
  const stampB = f < b(11) + 24 ? 0 : spring(f, b(11) + 24, 12);
  const cardC = ease(f, b(12), 24);
  return (
    <Frame p={p} z0={1.0} z1={1.03} dx0={36} dx1={-36} night={0.1}
      overlay={<>
        <Plate text="FLOCK TO KTUU" y={590} size={32} tone="mag" p={ease(f, b(10) + 6, 10) * (f < b(11) ? 1 : 0)} />
        <Plate text="UPDATED" y={590} size={32} tone="paper" p={ease(f, b(11) + 6, 10) * (f < b(12) ? 1 : 0)} />
        <Plate text="CUSTOMER NOT NAMED BY FLOCK" y={590} size={28} p={ease(f, b(12) + 6, 10)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="#162632" />
        <rect data-band="ok" x={-20} y={1150} width={1120} height={800} fill="#3A2C20" stroke={INK} strokeWidth={6} />
        {Array.from({length: 12}, (_, i) => <path key={i} d={`M -20 ${1180 + i * 60} L 1100 ${1180 + i * 64}`} stroke="#2B2017" strokeWidth={3} />)}
        <rect x={50} y={620} width={720} height={500} fill={PC.kraft} stroke={INK} strokeWidth={8} />
        {Array.from({length: 40}, (_, i) => <circle key={i} cx={70 + rnd(i + 8) * 680} cy={640 + rnd(i + 28) * 460} r={2.4 + rnd(i) * 2} fill="#7C6B4A" opacity={0.6} />)}
        <StatementCard x={lerp(330, 210, slideB)} y={lerp(830, 1010, slideB)} head="FLOCK TO KTUU" lines={['NOT AWARE OF ANY', 'CAMERAS IN ALASKA']} w={430} rot={lerp(-2, -10, slideB)} opacity={lerp(1, 0.7, slideB)} />
        <g opacity={slideB > 0.02 ? 1 : 0}>
          <StatementCard x={lerp(780, 400, slideB)} y={760} head="FLOCK TO KTUU · UPDATED" lines={['BEGAN INSTALLING FOR', 'A PRIVATE CUSTOMER']} w={470} rot={2} />
          {stampB > 0.02 && (
            <g transform={`translate(560,650) rotate(-10) scale(${stampB})`}>
              <rect x={-90} y={-26} width={180} height={52} fill="none" stroke={PC.lilac} strokeWidth={6} />
              <text y={11} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={3} fill={PC.lilac}>UPDATED</text>
            </g>
          )}
        </g>
        <g opacity={cardC} transform={`translate(0,${(1 - cardC) * 60})`}>
          <StatementCard x={850} y={900} head="CUSTOMER" lines={['NOT NAMED BY FLOCK']} w={330} empty rot={3} tint={PC.paper} />
          <g transform={`translate(850,${790 + 4 * Math.sin(f / 7)})`}><circle r={26} fill={PC.paper} stroke={INK} strokeWidth={4} /><text y={11} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={34} fill={INK}>?</text></g>
        </g>
        <TvMonitor f={f} x={900} y={1230} scale={0.62} />
        <g transform="translate(130,1150)">
          <ellipse cx={0} cy={0} rx={190} ry={30} fill={PC.lampWhite} opacity={0.12} />
          <path d="M 0 0 L 0 -230 L 80 -270" stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" /><path d="M 0 0 L 0 -230 L 80 -270" stroke="#8C97A3" strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M 60 -290 L 130 -250 L 100 -226 L 36 -262 Z" fill="#5C6670" stroke={INK} strokeWidth={5} transform={`rotate(${3 * Math.sin(f / 30)} 80 -270)`} />
        </g>
        <Tape f={f} x={360} y={1195} len={640} w={34} printed={ease(f, b(10), 80)} trucks={7} wave={4} phase={4} />
        <path d="M 1010 1150 q 10 -26 0 -40 q -10 -14 0 -34" stroke="#fff" strokeWidth={4} fill="none" opacity={0.4 + 0.2 * Math.sin(f / 9)} />
      </SVG>
    </Frame>
  );
};

// ---- S5: very Minority Report (beats 13 to 14) -----------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const talk = useVoice().opennessAt(p.from + f);
  const q = ease(f, b(14), 22);
  return (
    <Frame p={p} zk={() => lerp(1.0, 1.12, easeIO(f, 0, p.dur))} ox={380} oy={1050} night={0.1}
      overlay={<>
        <Plate text="ONE NEIGHBOR" y={600} size={30} p={ease(f, b(13) + 6, 10) * (f < b(14) ? 1 : 0)} />
        <QuotePlate text={'"VERY MINORITY REPORT" · RESIDENT TO KTUU'} x={640} y={730} size={34} wrap={18} p={q} rot={-2} />
      </>}>
      <SVG>
        <StreetNight f={f + p.from} ground={1180} />
        <PoleCam f={f} x={880} y={1250} h={430} scale={0.7} mood="calm" look={-1} glow={0.4 + 0.2 * Math.sin(f / 6)} flip phase={2} />
        <Tape f={f} x={820} y={1262} rot={180} len={520} w={22} printed={ease(f, b(13), 60)} trucks={6} wave={9} phase={5} />
        <Character frame={f} x={330} y={1470} scale={1.7} facing={1} outfit="puffer" headgear="beanie" pose="stand" emotion="worried" talking={talk} />
        <ContactShadow cx={330} cy={1474} rx={130} ry={18} opacity={0.5} />
        {[0, 1, 2, 3].map((i) => { const ph = (f * 0.7 + i * 17) % 70; return <circle key={i} cx={440 + 14 * Math.sin(i + f / 8)} cy={1000 - ph * 1.3} r={7 + ph / 12} fill="#fff" opacity={0.28 * (1 - ph / 70)} />; })}
      </SVG>
    </Frame>
  );
};

// ---- S6: not the biggest in town (beats 15 to 16) ---------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const sock = ease(f, b(16), 40);
  const zoom = 1 + 1.9 * (1 - easeIO(f, 0, 100));
  return (
    <Frame p={p} zk={() => zoom} ox={540} oy={1000} night={0.05}
      overlay={<>
        <Plate text="THIS LOT" y={620} size={32} p={ease(f, b(15) + 20, 10) * (f < b(16) ? 1 : 0)} />
        <Plate text="NOT THE BIGGEST SYSTEM IN TOWN" y={620} size={28} p={ease(f, b(16) + 6, 10)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="#0E1A24" />
        <path d="M -20 700 Q 120 740 160 880 Q 200 1040 120 1200 Q 60 1320 -20 1400 Z" fill="#162B38" stroke="#223C4C" strokeWidth={4} />
        <path d="M -20 700 Q 120 740 160 880 Q 200 1040 120 1200" fill="none" stroke="#2C4B5E" strokeWidth={5} opacity={0.7 + 0.2 * Math.sin(f / 20)} />
        {Array.from({length: 14}, (_, i) => <path key={'v' + i} d={`M ${220 + i * 62} 560 L ${200 + i * 62} 1480`} stroke="#243C4B" strokeWidth={i % 4 === 0 ? 5 : 2.4} />)}
        {Array.from({length: 17}, (_, i) => <path key={'h' + i} d={`M 190 ${600 + i * 54} L 1100 ${590 + i * 54}`} stroke="#243C4B" strokeWidth={i % 4 === 0 ? 5 : 2.4} />)}
        {Array.from({length: 120}, (_, i) => <circle key={i} cx={240 + rnd(i + 3) * 800} cy={620 + rnd(i + 99) * 820} r={2.2 + rnd(i) * 2.2} fill={PC.lampWhite} opacity={0.25 + 0.4 * (0.5 + 0.5 * Math.sin(f / 15 + i))} />)}
        {Array.from({length: 150}, (_, i) => {
          const c = i % 15, r = Math.floor(i / 15);
          const dx = 260 + c * 56, dy = 640 + r * 74;
          const k = clamp01((sock * 1.6 - Math.hypot(dx - 540, dy - 1000) / 700));
          return <circle key={i} cx={dx} cy={dy} r={9} fill="#14232F" stroke={PC.civic} strokeWidth={2.4} opacity={k * 0.9} />;
        })}
        {Array.from({length: 7}, (_, i) => <circle key={i} cx={((f * (1.2 + i * 0.3) + i * 140) % 900) + 180} cy={700 + i * 100} r={3.6} fill="#FFE6A8" />)}
        <g transform="translate(540,1000)">
          <circle r={34 + 10 * Math.sin(f / 7)} fill={PC.sodium} opacity={0.18} />
          <circle r={14} fill={PC.sodium} stroke={INK} strokeWidth={4} />
          <rect x={-12} y={-34} width={24} height={16} rx={4} fill={PC.bone} stroke={INK} strokeWidth={3} />
          <circle cx={0} cy={-26} r={4} fill={PC.cyan} />
        </g>
        <Tape f={f} x={528} y={1018} rot={118} len={260} w={10} printed={1} wave={5} phase={6} />
      </SVG>
    </Frame>
  );
};

// ---- S7: two proposed rules (beats 17 to 19) -----------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pin = clamp01((f - 4) / 20);
  const dropA = spring(f, b(17), 22), dropB = spring(f, b(17) + 10, 22);
  const slide = easeIO(f, b(17) + 34, 40);
  const cal = easeIO(f, b(18), 20);
  const stamp = f < b(18) + 22 ? 0 : spring(f, b(18) + 22, 14);
  const tagA = spring(f, b(19), 16), tagB = spring(f, b(19) + 12, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.08} ox={540} oy={1000} night={0.08}
      overlay={<>
        <Plate text="2 PROPOSED RULES" y={620} size={32} tone="civic" p={ease(f, b(17) + 18, 10) * (f < b(18) ? 1 : 0)} />
        <Plate text="OCT 20 · VOTE EXPECTED" y={620} size={32} tone="civic" p={ease(f, b(18) + 6, 10)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="#17283A" />
        <rect data-band="ok" x={-20} y={1010} width={1120} height={200} fill="#12202E" stroke={INK} strokeWidth={5} />
        <rect x={80} y={560} width={250} height={420} fill={PC.civicDeep} stroke={INK} strokeWidth={6} />
        <text x={205} y={700} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={3} fill="#F4F1E6">ASSEMBLY</text>
        <path d="M 120 760 Q 205 820 290 760" fill="none" stroke="#F4F1E6" strokeWidth={5} opacity={0.6} />
        <rect x={380} y={560} width={260} height={360} fill="#0F1E2B" stroke={INK} strokeWidth={6} />
        {Array.from({length: 22}, (_, i) => <circle key={i} cx={392 + rnd(i + 4) * 236} cy={575 + rnd(i + 44) * 330} r={1.4 + rnd(i) * 1.4} fill="#fff" opacity={0.5 + 0.4 * Math.sin(f / 18 + i)} />)}
        <path d="M 510 560 L 510 920 M 380 740 L 640 740" stroke={INK} strokeWidth={5} />
        <Calendar f={f} x={860} y={760} scale={1.05} flip={cal} stamp="VOTE EXPECTED" stampP={stamp} />
        <rect data-band="ok" x={-20} y={1180} width={1120} height={800} fill="#5B4632" stroke={INK} strokeWidth={6} />
        <rect data-band="ok" x={-20} y={1180} width={1120} height={30} fill="#7A5E40" />
        {Array.from({length: 10}, (_, i) => <path key={i} d={`M -20 ${1230 + i * 70} L 1100 ${1236 + i * 70}`} stroke="#4A3826" strokeWidth={3} />)}
        <g transform={`translate(540,${1180 - 6})`}>
          <ellipse cx={0} cy={-6} rx={190} ry={24} fill={PC.lampWhite} opacity={0.14 + 0.03 * Math.sin(f / 8)} />
          <path d="M 0 0 L 0 -150 L 62 -190" stroke={INK} strokeWidth={13} fill="none" strokeLinecap="round" /><path d="M 0 0 L 0 -150 L 62 -190" stroke="#8C97A3" strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M 40 -214 L 108 -176 L 84 -148 L 22 -184 Z" fill="#5C6670" stroke={INK} strokeWidth={5} />
        </g>
        <g transform={`translate(${96},${lerp(-200, 1176, pin)}) scale(0.7)`} opacity={pin > 0.02 ? 1 : 0}>
          <rect x={-30} y={-38} width={60} height={38} rx={8} fill={PC.bone} stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={-19} r={10} fill="#F4F1E6" stroke={INK} strokeWidth={3} /><circle cx={0} cy={-19} r={5} fill={PC.cyan} />
        </g>
        <Tape f={f} x={140} y={1165} len={260} w={26} printed={ease(f, b(17) + 20, 40)} trucks={3} wave={2} phase={7} />
        <Rulebook f={f} x={lerp(240, 150, easeIO(f, b(17) + 30, 40)) + 0 * slide} y={lerp(-300, 1176, dropA)} scale={0.9} w={240} h={270} color={PC.civic} deep={PC.civicDeep} title="AO 2026-108" sub="PROPOSED" />
        <Rulebook f={f} x={lerp(840, 930, slide) - 0 * slide} y={lerp(-300, 1176, dropB)} scale={0.9} w={240} h={270} color="#7FA6E8" deep="#3C63AE" title="AO 108(S)" sub="PROPOSED" />
        <g transform={`translate(${160},${1180 + 30 * tagA})`} opacity={clamp01(tagA)}>
          <path d="M 0 -240 L 0 -190" stroke={INK} strokeWidth={3} />
          <rect x={-130} y={-190} width={260} height={46} rx={4} fill={PC.paper} stroke={INK} strokeWidth={4} />
          <text y={-160} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={19} letterSpacing={0.5} fill={INK}>FROM ASSEMBLY MEMBERS</text>
        </g>
        <g transform={`translate(${930},${1180 + 30 * tagB})`} opacity={clamp01(tagB)}>
          <path d="M 0 -240 L 0 -190" stroke={INK} strokeWidth={3} />
          <rect x={-110} y={-190} width={220} height={46} rx={4} fill={PC.paper} stroke={INK} strokeWidth={4} />
          <text y={-160} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} letterSpacing={0.5} fill={INK}>FROM THE MAYOR</text>
        </g>
        {Array.from({length: 18}, (_, i) => <circle key={i} cx={(rnd(i + 9) * 1080 + f * 0.3) % 1080} cy={(rnd(i + 49) * 900 + 500 + f * 0.15 * (1 + i % 3)) % 1000 + 500} r={1.8} fill={PC.lampWhite} opacity={0.3} />)}
      </SVG>
    </Frame>
  );
};

// ---- S8: the test (beats 20 to 24) -------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const talk = useVoice().opennessAt(p.from + f);
  const feed = ease(f, b(20) + 6, 80);
  const run = f > b(20) + 24 && f < b(21) ? 1 : 0;
  const lift = easeIO(f, b(21), 26);
  const close = easeIO(f, b(22) + 6, 60);
  const storeTurn = easeIO(f, b(23) - 6, 20);
  const dimL = lerp(0, 0.5, storeTurn);
  const dimR = lerp(0.45, 0, storeTurn);
  const wrap = ease(f, b(23) + 4, 50);
  const glint = ease(f, b(24), 12) * (1 - ease(f, b(24) + 20, 20));
  const mayorX = 230, mayorY = 1300;
  return (
    <Frame p={p} z0={1.0} z1={1.04} ox={540} oy={1000} night={0.08}
      overlay={<>
        <Plate text="MEMBERS' VERSION · CITY DATA DELETED AFTER 14 DAYS" displayLines={["MEMBERS' VERSION", 'CITY DATA DELETED AFTER 14 DAYS']} x={270} y={600} size={19} tone="civic" p={ease(f, b(20) + 20, 10) * (f < b(22) ? 1 : 0)} />
        <QuotePlate text={'"UNDULY LIMIT SOME CORE FUNCTIONS OF APD OPERATIONS" · THE MAYOR'} x={270} y={700} size={23} wrap={19} p={ease(f, b(22) + 8, 14) * (f < b(23) ? 1 : 0.35 * (1 - storeTurn) + 0.0)} />
        <Plate text="A STORE'S POLE · A STORE'S CALL" displayLines={["A STORE'S POLE", "A STORE'S CALL"]} x={810} y={620} size={24} tone="amber" p={ease(f, b(23) + 6, 12)} />
        <Plate text="NOTHING IN EITHER RULE STOPS IT" displayLines={['NOTHING IN EITHER', 'RULE STOPS IT']} x={810} y={740} size={21} tone="paper" p={ease(f, b(24) + 10, 12)} />
      </>}>
      <SVG>
        <defs>
          <clipPath id="s8L"><rect x={-20} y={-20} width={560} height={1960} /></clipPath>
          <clipPath id="s8R"><rect x={540} y={-20} width={560} height={1960} /></clipPath>
        </defs>
        {/* LEFT: the hall (city) */}
        <g clipPath="url(#s8L)">
          <rect data-band="ok" x={-20} y={-20} width={580} height={1960} fill="#17283A" />
          <rect x={-10} y={540} width={540} height={14} fill={PC.civicDeep} />
          <rect x={-20} y={1240} width={580} height={800} fill="#2A3B4A" stroke={INK} strokeWidth={5} data-band="ok" />
          <Tape f={f} x={118} y={1296} len={300} w={24} printed={feed} tint={PC.civic} ticks tickEvery={21} wave={2} phase={8} />
          <Shredder f={f} x={470} y={1310} scale={0.78} run={run} />
          <g transform="translate(78,1300)">
            <PatrolCar f={f} x={0} y={0} scale={0.36} />
            <g transform="translate(6,-96)"><rect x={-78} y={-16} width={156} height={32} rx={4} fill={PC.civicDeep} stroke={INK} strokeWidth={3} /><text y={7} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={15} letterSpacing={1} fill="#F4F1E6">CITY CAMERAS</text></g>
          </g>
          <Character frame={f} x={mayorX} y={mayorY} scale={1.25} facing={1} outfit="suit" glasses hairStyle="long" hair="#3d2c1e" pose="carry" gesture={lift} emotion="neutral" talking={talk} look={f < b(21) ? -14 : 0} />
          <Podium x={mayorX} y={mayorY + 4} scale={0.95} />
          <g transform={`translate(${mayorX + 150},${mayorY - 250 - 70 * lift})`}>
            <Folder x={0} y={0} scale={0.8} label="CORE POLICE OPERATIONS" squeeze={close} rot={-2 * lift} />
          </g>
          {f > b(22) - 4 && <g transform={`translate(${mayorX + 150},${mayorY - 250 - 70 * lift - 110})`} opacity={ease(f, b(22) - 4, 8)}><Clamp x={0} y={0} scale={0.8} close={close} gapOpen={188} gapClosed={126} /></g>}
          <rect x={-20} y={-20} width={580} height={1960} fill="#000" opacity={dimL} />
        </g>
        {/* RIGHT: the store's lot */}
        <g clipPath="url(#s8R)">
          <rect data-band="ok" x={540} y={-20} width={580} height={1960} fill="url(#s8-sky)" />
          <defs><linearGradient id="s8-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={PC.sky} /><stop offset="1" stopColor="#2B4B5C" /></linearGradient></defs>
          {Array.from({length: 24}, (_, i) => <circle key={i} cx={560 + rnd(i + 2) * 520} cy={rnd(i + 62) * 700} r={1.2 + (i % 3) * 0.6} fill="#fff" opacity={0.3 + 0.3 * Math.sin(f / 20 + i)} />)}
          <rect data-band="ok" x={540} y={1120} width={580} height={800} fill={PC.asphalt} />
          <Storefront f={f} x={810} y={1130} scale={0.78} sign="THE STORE" />
          <BarePole x={810} y={1300} h={470} glint={glint} />
          <g transform={`translate(810,${1300 - 330})`}>
            {[0, 1, 2].map((i) => <rect key={i} x={-14} y={-8 + i * 34 - 20 * wrap} width={28} height={14} fill={PC.paper} stroke={INK} strokeWidth={2.6} opacity={wrap > 0.05 + i * 0.25 ? 1 : 0} transform={`skewY(${i % 2 ? -14 : 14})`} />)}
          </g>
          <g transform={`translate(810,${1300 - 220}) rotate(${3 * Math.sin(f / 18)})`} opacity={clamp01(storeTurn + 0.0)}>
            <path d="M -40 -14 L -40 -40 M 40 -14 L 40 -40" stroke={INK} strokeWidth={3} />
            <rect x={-92} y={-14} width={184} height={54} rx={4} fill={PC.sodium} stroke={INK} strokeWidth={4} />
            <text y={20} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={17} fill={INK}>A STORE'S POLE</text>
          </g>
          <ShoppingCart f={f} x={(560 + f * 0.9) % 700 + 500} y={1440} scale={0.8} />
          <Snowfall f={f + p.from} n={44} />
          <rect x={540} y={-20} width={580} height={1960} fill="#000" opacity={dimR} />
        </g>
        {/* the seam is the spine of the FROM THE MAYOR rulebook */}
        <rect x={528} y={-20} width={24} height={1960} fill={PC.civic} stroke={INK} strokeWidth={5} />
        <rect x={528} y={-20} width={8} height={1960} fill="#fff" opacity={0.25} />
      </SVG>
    </Frame>
  );
};

// ---- S9: rules and the neighbor (beats 25 to 26) -----------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tick = (a: number) => (f < a ? 0 : spring(f, a, 12));
  const x1 = interpolate(f, [b(25), b(25) + 90], [420, 1260], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const x2 = interpolate(f, [b(25) + 18, b(25) + 108], [420, 1260], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const squeeze = ease(f, b(26), 30);
  return (
    <Frame p={p} zk={() => lerp(1.0, 1.1, easeIO(f, 0, p.dur))} ox={330} oy={1100} night={0.1}
      overlay={<>
        <Plate text="FAIR POINTS" x={690} y={600} size={32} tone="paper" p={ease(f, b(25) + 6, 10) * (f < b(26) ? 1 : 0)} />
        <Plate text="THEY DON'T ANSWER NEIGHBORS WHO WANT NO CAMERA" displayLines={["THEY DON'T ANSWER", 'NEIGHBORS WHO WANT NO CAMERA']} x={690} y={640} size={26} p={ease(f, b(26) + 6, 12)} />
      </>}>
      <SVG>
        <StreetNight f={f + p.from} ground={1180} shift={40} />
        <PoleCam f={f} x={890} y={1255} h={440} scale={0.9} mood="calm" look={-1} glow={0.5 + 0.2 * Math.sin(f / 6)} flip phase={3} />
        <Tape f={f} x={820} y={1268} rot={180} len={560} w={22} printed={1} trucks={6} wave={9} phase={11} />
        <Character frame={f} x={250} y={1520} scale={2.15} facing={1} outfit="puffer" headgear="beanie" pose="arms-crossed" emotion="worried" idleGain={squeeze > 0.1 ? 1.4 : 1} />
        <ContactShadow cx={250} cy={1524} rx={160} ry={20} opacity={0.5} />
        {[{x: x1, y: 1010, t: "THE MAYOR'S POINT", w: 330}, {x: x2, y: 1110, t: "A STORE'S POINT", w: 300}].map((c, i) => (
          <g key={i} transform={`translate(${c.x},${c.y + 8 * Math.sin(f / 9 + i)}) rotate(${-4 + 8 * i})`} opacity={f > b(25) - 2 ? 1 : 0}>
            <rect x={-c.w / 2 + 6} y={-30 + 8} width={c.w} height={60} fill="#000" opacity={0.3} />
            <rect x={-c.w / 2} y={-30} width={c.w} height={60} fill={PC.paper} stroke={INK} strokeWidth={4.4} />
            <text x={-14} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>{c.t}</text>
            <g transform={`translate(${c.w / 2 - 34},0) scale(${tick(b(25) + 8 + i * 14)})`}><circle r={18} fill="#F4F1E6" stroke={INK} strokeWidth={3} /><path d="M -8 0 L -2 7 L 9 -7" stroke={INK} strokeWidth={4.4} fill="none" strokeLinecap="round" /></g>
          </g>
        ))}
        {headlights(f)}
      </SVG>
    </Frame>
  );
};
const headlights = (f: number) => {
  const x = ((f * 7) % 2600) - 700;
  return (
    <g transform={`translate(${x},1330)`} opacity={0.65}>
      <ellipse cx={0} cy={0} rx={150} ry={10} fill={PC.lampWhite} opacity={0.22} />
      <circle cx={0} cy={0} r={9} fill={PC.lampWhite} />
      <circle cx={70} cy={0} r={9} fill={PC.lampWhite} />
    </g>
  );
};

// ---- S10: the biggest system (beats 27 to 31) ------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pull = easeIO(f, 0, 120);
  const lit = 6 + 54 * ease(f, b(28), 50) + 60 * ease(f, b(29), 40) + 40 * ease(f, b(30), 40);
  const col = Math.round(interpolate(f, [b(29), b(29) + 56], [0, 49], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const carX = lerp(-340, 400, easeIO(f, b(28) - 6, 70));
  const bracket = ease(f, b(30), 20);
  const drone = ease(f, b(31), 40);
  const beam = ease(f, b(31) + 6, 36);
  const shrink = lerp(0.5, 0.34, easeIO(f, b(31), 40));
  return (
    <Frame p={p} zk={() => lerp(11, 1, pull)} ox={99} oy={659} night={0.06} tagText="UP TO 750 · ILLUSTRATION"
      overlay={<>
        <Plate text="THE BIGGEST SYSTEM" y={560} size={30} tone="paper" p={ease(f, b(27) + 70, 10) * (f < b(28) ? 1 : 0)} />
        <Plate text="CITY'S AXON DEAL" x={320} y={560} size={28} tone="civic" p={ease(f, b(28) + 4, 10)} />
        <Plate text="$11.8M · 5 YEARS" x={330} y={1030} size={50} tone="paper" p={ease(f, b(29) + 4, 12)} />
        <Plate text="UP TO 750 FEEDS" x={330} y={1130} size={40} tone="civic" p={ease(f, b(30) + 6, 12)} />
        {bracket > 0.02 && (
          <g opacity={bracket}>
            <path d={`M 90 ${628 - 10 * (1 - bracket)} L 90 612 L 990 612 L 990 ${628 - 10 * (1 - bracket)}`} fill="none" stroke={PC.paper} strokeWidth={6} strokeLinecap="round" />
          </g>
        )}
        {drone > 0.02 && <text x={0} y={0} />}
        <Plate text="THIS LOT" x={950} y={1000} size={18} tone="amber" p={ease(f, b(27) + 100, 14)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="#0C1620" />
        <rect data-band="ok" x={-20} y={1240} width={1120} height={800} fill="#16232D" stroke={INK} strokeWidth={5} />
        <FeedWall f={f} x={90} y={650} lit={lit} beam={beam} />
        {/* the column that lights when the slab drops */}
        {f > b(29) && f < b(29) + 90 && Array.from({length: 15}, (_, r) => (
          <g key={r} transform={`translate(${90 + col * 18 + 9},${650 + r * 18 + 9})`} opacity={1 - clamp01((f - b(29) - 56) / 30)}>
            <circle r={6.8} fill="#E8E4D8" stroke={INK} strokeWidth={1.6} /><circle r={3.2} fill={PC.civic} />
          </g>
        ))}
        {/* the patrol car carries CITY'S AXON DEAL on its door */}
        <PatrolCar f={f} x={carX} y={1285} scale={0.8} roll={f * 10} pod={ease(f, b(31), 10)} />
        <g transform={`translate(${carX + 8},${1285 - 52})`}><rect x={-70} y={-16} width={140} height={32} rx={3} fill={PC.civicDeep} stroke={INK} strokeWidth={3} /><text y={6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={13} letterSpacing={0.5} fill="#F4F1E6">CITY'S AXON DEAL</text></g>
        {beam > 0.02 && <path d={`M ${carX - 50} ${1285 - 105} L ${lerp(carX - 50, 140, beam)} ${lerp(1285 - 105, 940, beam)}`} stroke={PC.cyan} strokeWidth={4} strokeDasharray="12 9" strokeDashoffset={-f * 3} opacity={0.8} />}
        <Drone f={f} x={lerp(1250, 700, drone)} y={lerp(1000, 1040, drone)} scale={0.8} tilt={lerp(14, -3, drone)} />
        {/* the lot's own camera stands OUTSIDE the wall, amber, and shrinks */}
        <PoleCam f={f} x={950} y={1290} h={430} scale={shrink} mood="calm" look={-1} flip phase={4} />
        <g transform="translate(950,1290)"><ellipse cx={0} cy={-6} rx={90 * shrink * 2} ry={16} fill={PC.sodium} opacity={0.3} /></g>
        <Tape f={f} x={920} y={1262} rot={-90} len={110} w={8} printed={ease(f, b(30), 40)} wave={3} phase={12} />
      </SVG>
    </Frame>
  );
};

// ---- S11: the fence around the city (beats 32 to 33) ------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const draw = easeIO(f, b(32), 70);
  const pole = ease(f, b(33), 24);
  const stub = ease(f, b(33) + 4, 30);
  return (
    <Frame p={p} z0={1.0} z1={1.04} night={0.05}
      overlay={<>
        <Plate text="BOTH RULES BIND CITY AGENCIES ONLY" y={590} size={26} tone="civic" p={ease(f, b(32) + 10, 12)} />
        <Plate text="NEITHER COVERS A STORE'S POLE" y={1250} size={28} tone="amber" p={ease(f, b(33) + 8, 12)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="#10202B" />
        {Array.from({length: 22}, (_, i) => <path key={'v' + i} d={`M ${-20 + i * 52} 0 L ${-20 + i * 52} 1920`} stroke="#193040" strokeWidth={2} />)}
        {Array.from({length: 38}, (_, i) => <path key={'h' + i} d={`M 0 ${i * 52} L 1080 ${i * 52}`} stroke="#193040" strokeWidth={2} />)}
        {/* the city's things, seen from above */}
        <g transform="translate(240,790)">
          <rect x={-150} y={-62} width={300} height={124} rx={10} fill="#0B1219" stroke={INK} strokeWidth={5} />
          {Array.from({length: 60}, (_, i) => <circle key={i} cx={-136 + (i % 20) * 14.4} cy={-44 + Math.floor(i / 20) * 40} r={4.6} fill={rnd(i + 2) > 0.7 ? '#E8E4D8' : '#1C2F39'} />)}
        </g>
        <g transform={`translate(${560 + 30 * Math.sin(f / 60)},960)`}>
          <rect x={-70} y={-30} width={140} height={60} rx={14} fill="#E9ECEF" stroke={INK} strokeWidth={5} />
          <rect x={-18} y={-22} width={36} height={44} rx={5} fill="#14343A" stroke={INK} strokeWidth={3} />
          <rect x={-8} y={-34} width={16} height={68} rx={4} fill="#2A2F36" stroke={INK} strokeWidth={3} />
          <rect x={-6} y={-26} width={5} height={52} fill={Math.floor(f / 6) % 2 ? '#F4F1E6' : '#8C93A0'} /><rect x={1} y={-26} width={5} height={52} fill={Math.floor(f / 6) % 2 ? PC.civic : '#26406E'} />
          <circle cx={-40} cy={0} r={6} fill={pole < 0.1 ? PC.cyan : '#7C8792'} stroke={INK} strokeWidth={2.4} />
        </g>
        <g transform={`translate(800,830) rotate(${f * 14})`}>
          <path d="M -50 -50 L 50 50 M 50 -50 L -50 50" stroke={INK} strokeWidth={14} strokeLinecap="round" /><path d="M -50 -50 L 50 50 M 50 -50 L -50 50" stroke="#5E6772" strokeWidth={7} strokeLinecap="round" />
          {[[-50, -50], [50, -50], [-50, 50], [50, 50]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={22} fill="#fff" opacity={0.4} stroke={INK} strokeWidth={2.4} />)}
          <rect x={-18} y={-18} width={36} height={36} rx={8} fill={PC.bone} stroke={INK} strokeWidth={4} />
        </g>
        {/* the dashed civic boundary draws itself, then the line stops short of the pole */}
        <rect x={90} y={650} width={870} height={440} rx={30} fill={PC.civic} opacity={0.08 * draw} />
        <rect x={90} y={650} width={870} height={440} rx={30} fill="none" stroke={PC.civic} strokeWidth={9} pathLength={1000} strokeDasharray={`${1000 * draw} 1000`} />
        <rect x={90} y={650} width={870} height={440} rx={30} fill="none" stroke="#10202B" strokeWidth={4} pathLength={1000} strokeDasharray="12 10" strokeDashoffset={-f * 1.2} opacity={draw > 0.98 ? 0.6 : 0} />
        <path d={`M 960 1090 L ${lerp(960, 910, stub)} ${lerp(1090, 1130, stub)}`} stroke={PC.civic} strokeWidth={9} strokeDasharray="14 10" strokeLinecap="round" />
        <path d={`M ${lerp(960, 910, stub) - 18} ${lerp(1090, 1130, stub) + 14} L ${lerp(960, 910, stub) + 18} ${lerp(1090, 1130, stub) - 14}`} stroke={PC.civic} strokeWidth={7} strokeLinecap="round" opacity={stub} />
        {/* the store's pole stands outside the line in its own amber pool */}
        <g transform="translate(850,1170)">
          <ellipse cx={0} cy={0} rx={150 + 14 * Math.sin(f / 12)} ry={96} fill={PC.sodium} opacity={0.32 * pole} />
          <circle r={26} fill="#8C97A3" stroke={INK} strokeWidth={5} />
          <circle r={12} fill="#7C8792" stroke={INK} strokeWidth={3} />
          <rect x={4} y={-46} width={60} height={34} rx={6} fill={PC.bone} stroke={INK} strokeWidth={4} /><circle cx={34} cy={-29} r={9} fill="#F4F1E6" stroke={INK} strokeWidth={3} /><circle cx={34} cy={-29} r={4} fill={PC.cyan} />
        </g>
        <Tape f={f} x={300} y={1180} len={500} w={20} printed={ease(f, b(33) - 10, 50)} wave={3} phase={13} />
        {Array.from({length: 26}, (_, i) => <circle key={i} cx={(rnd(i + 1) * 1080 + f * 0.5) % 1080} cy={(rnd(i + 41) * 1900 + f * 0.9) % 1900} r={2.2 + (i % 3) * 0.8} fill="#fff" opacity={0.5} />)}
      </SVG>
    </Frame>
  );
};

// ---- S12: two documents (beats 34 to 35) -----------------------------------------------------------------------------------------
const Sheet: React.FC<{x: number; y: number; head: string; tint: string; fg: string; children?: React.ReactNode; rot?: number}> = ({x, y, head, tint, fg, children, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <rect x={-420} y={-290} width={860} height={600} fill="#000" opacity={0.3} />
    <rect x={-430} y={-300} width={860} height={600} fill={PC.paper} stroke={INK} strokeWidth={6} />
    <rect x={-430} y={-300} width={860} height={78} fill={tint} stroke={INK} strokeWidth={6} />
    <text x={0} y={-248} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={Math.min(34, 780 / (head.length * 0.602))} letterSpacing={2} fill={fg}>{head}</text>
    {[-170, -120, 140, 190, 240].map((ly, i) => <path key={i} d={`M -380 ${ly} L ${180 + (i % 3) * 70} ${ly}`} stroke={INK} strokeWidth={5} opacity={0.14} strokeLinecap="round" />)}
    {children}
  </g>
);
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const swap = easeIO(f, b(35) - 10, 34);
  const t90 = ease(f, b(34) + 8, 70);
  const t7 = ease(f, b(35) + 20, 26);
  return (
    <Frame p={p} z0={1.0} z1={1.04} night={0.06}
      overlay={<>
        <Plate text="TYPICALLY NO MORE THAN 90 DAYS" y={620} size={26} tone="amber" p={ease(f, b(34) + 8, 12) * (1 - swap)} />
        <Plate text="DEFAULT 7 DAYS · ADJUSTABLE BY LOCAL RULE" displayLines={['DEFAULT 7 DAYS', 'ADJUSTABLE BY LOCAL RULE']} y={640} size={26} tone="mag" p={ease(f, b(35) + 12, 12)} />
      </>}>
      <SVG>
        <defs><radialGradient id="s12-lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={PC.lampWhite} stopOpacity="0.3" /><stop offset="1" stopColor={PC.lampWhite} stopOpacity="0" /></radialGradient></defs>
        <rect data-band="ok" x={-20} y={-20} width={1120} height={1960} fill="#10181C" />
        {Array.from({length: 26}, (_, i) => <path key={i} d={`M -20 ${i * 76 + 10} Q 540 ${i * 76 + 24 * Math.sin(i)} 1100 ${i * 76 + 10}`} stroke="#1A2A31" strokeWidth={3} fill="none" />)}
        <ellipse cx={540 + 40 * Math.sin(f / 50)} cy={1000} rx={600} ry={460} fill="url(#s12-lamp)" />
        <g transform={`translate(${-1150 * swap},0)`}>
          <Sheet x={540} y={1010} head="LOWE'S PRIVACY STATEMENT" tint={PC.sodium} fg={INK} rot={-1.5}>
            <Tape f={f} x={-380} y={30} len={760} w={52} printed={t90} tint={PC.paper} ticks tickEvery={8.44} wave={2} phase={14} fadeEnd={0.12} />
            <text x={-380} y={100} fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK} opacity={0.8}>DAY 1</text>
            <text x={380} y={100} textAnchor="end" fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK} opacity={t90 > 0.95 ? 0.9 : 0}>DAY 90</text>
          </Sheet>
        </g>
        <g transform={`translate(${1150 * (1 - swap)},0)`}>
          <Sheet x={540} y={1010} head="FLOCK FAQ" tint={PC.lilac} fg={INK} rot={1.2}>
            <Tape f={f} x={-380} y={30} len={196} w={52} printed={t7} tint={PC.paper} ticks tickEvery={28} wave={2} phase={15} />
            <text x={-380} y={100} fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK} opacity={0.8}>DAY 1</text>
            <text x={-170} y={100} textAnchor="end" fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK} opacity={t7 > 0.95 ? 0.9 : 0}>DAY 7</text>
          </Sheet>
        </g>
        <g transform="translate(920,700) rotate(24)"><path d="M 0 0 L 0 -90 Q 0 -110 18 -110 Q 36 -110 36 -90 L 36 20" fill="none" stroke="#8C97A3" strokeWidth={6} /></g>
      </SVG>
    </Frame>
  );
};

// ---- S13: the pole and its two leashes (beat 36) ----------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tight = ease(f, b(36) + 4, 40);
  const lab = ease(f, b(36) + 30, 16);
  const sway = 6 * Math.sin(f / 14);
  const px = 540, py = 1270, top = [px + 24, py - 450];
  return (
    <Frame p={p} z0={1.0} z1={1.05} dx0={-30} dx1={30} night={0.1}
      overlay={<>
        <Plate text="THE POLE ANSWERS TO THE STORE AND ITS VENDOR" displayLines={['THE POLE ANSWERS TO', 'THE STORE AND ITS VENDOR']} y={620} size={28} p={ease(f, b(36) + 8, 12)} />
        <Plate text="STORE" x={290} y={900} size={26} tone="amber" p={lab} />
        <Plate text="VENDOR" x={790} y={900} size={26} tone="mag" p={lab} />
      </>}>
      <SVG>
        <LotNight f={f + p.from} ground={1060} lamp={0.8} cart={false} store={null} />
        <Storefront f={f} x={190} y={1120} scale={0.78} sign="THE STORE" />
        <ServerBox f={f} x={900} y={1250} scale={0.86} />
        <BarePole x={px} y={py} h={450} />
        {/* the two leashes sag from the bracket to the storefront door and to the server box */}
        <path d={`M ${top[0]} ${top[1]} Q ${380 + sway} ${top[1] + 360 - 120 * tight} 230 1070`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
        <path d={`M ${top[0]} ${top[1]} Q ${380 + sway} ${top[1] + 360 - 120 * tight} 230 1070`} fill="none" stroke={PC.sodium} strokeWidth={7} strokeLinecap="round" />
        <path d={`M ${top[0]} ${top[1]} Q ${700 - sway} ${top[1] + 360 - 120 * tight} 880 1000`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
        <path d={`M ${top[0]} ${top[1]} Q ${700 - sway} ${top[1] + 360 - 120 * tight} 880 1000`} fill="none" stroke={PC.lilac} strokeWidth={7} strokeLinecap="round" />
        <Tape f={f} x={px + 30} y={py - 410} rot={90} len={230} w={20} printed={ease(f, 0, 30)} wave={5} phase={16} />
        <ShoppingCart f={f + p.from} x={((f + p.from) * 0.9 + 100) % 1500 - 200} y={1560} scale={0.9} />
        <Snowfall f={f + p.from} n={60} />
      </SVG>
    </Frame>
  );
};

// ---- S14: ask the camera (beats 37 to 40) -----------------------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rise = spring(f, b(37), 36);
  const blink = f >= b(40);
  return (
    <Frame p={p} zk={() => lerp(1.06, 1.0, easeIO(f, 0, p.dur))} ox={540} oy={900} night={0.1}
      overlay={<>
        <Plate text="WHAT DOES IT KEEP?" y={540} size={30} tone="paper" p={ease(f, b(38) + 4, 10)} />
        <Plate text="FOR HOW LONG?" y={610} size={30} tone="paper" p={ease(f, b(39) + 4, 10)} />
        <Plate text="WHO GETS IT?" y={680} size={30} tone="paper" p={ease(f, b(40) + 4, 10)} />
      </>}>
      <SVG>
        <defs><clipPath id="s14c"><rect x={-20} y={-20} width={1120} height={1396} /></clipPath></defs>
        <LotNight f={f + p.from} ground={1060} lamp={0.88 + 0.12 * Math.sin(f / 5)} />
        {/* the stump of the cut pole, with its scribble sign */}
        <g>
          <ContactShadow cx={230} cy={1404} rx={60} ry={8} opacity={0.5} />
          <path d="M 205 1400 L 215 1170 L 247 1170 L 257 1400 Z" fill="#8C97A3" stroke={INK} strokeWidth={5} />
          <path d="M 215 1170 L 247 1170 L 244 1160 L 218 1160 Z" fill="#0B1219" stroke={INK} strokeWidth={3} />
        </g>
        <HandSign x={130} y={1450} scale={1.0} rot={-4} p={1} />
        <g clipPath="url(#s14c)">
          <PoleCam f={f} x={540} y={1400 + 640 * (1 - rise)} h={440} cutAt={250} scale={1.1} mood="proud" look={0.3} ribbon glow={blink ? 1 : 0.35} />
          <Tape f={f} x={618} y={1400 + 640 * (1 - rise) - 466} rot={90} len={300} printed={ease(f, b(37) + 36, 40)} trucks={3} wave={5} phase={17} />
        </g>
        <Snowfall f={f + p.from} n={60} />
      </SVG>
    </Frame>
  );
};

// ---- placeholders: every shot gets a crude version first (the rough cut) ---------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p} night={0}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill="#14232F" />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.paper}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);

const TITLES: Record<number, string> = {1: 'POLE CUT', 2: 'WHAT IT READS', 3: 'WHO DECIDES', 4: 'TV STATION', 5: 'MINORITY REPORT', 6: 'CITY MAP', 7: 'TWO RULES', 8: 'THE TEST', 9: 'NO CAMERA', 10: 'THE WALL', 11: 'THE FENCE', 12: 'TWO SHEETS', 13: 'TWO LEASHES', 14: 'ASK'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

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

export const ep1010Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1010Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1010: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 8.23, 16.97, 22.43, 31.63, 35.86, 41.26, 51.43, 66.2, 72.03, 86.26, 92.76, 100.43, 105.13, 113.03].map((x) => Math.round(x * 30));
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
