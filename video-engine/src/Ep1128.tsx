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
import {HeldTravel, HeldProp} from './lib/heldidle';
import {AlaskaOutline, akProject} from './lib/akgeo';
import {NB, NLab, Nib, CheckHand, Tick, LandsatTile, tileLake, LakeFill, LakeOutline, lakeBlob, blobLen, LightTable, LakeChip, TapeMeasure, BrassWeight, SpringScale, WeighRail} from './lib/nib';
import {IDS} from './Ep1128Ids';

// The Map Swelled, 2026-11-28. Palette roles are art_direction.json: a charcoal drafting room at night lit from BELOW by
// cream vellum on a light table; ULTRAMARINE is the machine's ink alone (Nib and its lines), CARMINE the human pencil alone,
// COBALT the OUR COUNT label alone, lakes glacial-flour turquoise. Nib never touches Bolch's cards or the scale; the scale
// has no face. Every Alaska number is OUR COUNT. No hazard or flood picture anywhere.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
const INK = NB.ink;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lin = (f: number, a: number, d = 24) => clamp01((f - a) / Math.max(1, d));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** a plate window: in over 6 frames at a, out over 6 frames before b */
const win = (f: number, a: number, b = 1e9) => clamp01((f - a) / 6) * clamp01((b - f) / 6);
const spring = (k: number) => 1 - Math.exp(-6 * k) * Math.cos(9 * k);

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'plate' | 'dark' | 'count' | 'ultra';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  plate: {fill: NB.vellumL, fg: INK, edge: INK},
  dark: {fill: NB.roomL, fg: NB.vellumL, edge: NB.vellumL},
  count: {fill: NB.vellumL, fg: NB.cobalt, edge: NB.cobalt},
  ultra: {fill: NB.ultra, fg: '#FFFFFF', edge: INK},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number}> =
({text, displayLines, x = 540, y, size = 30, tone = 'plate', p = 1, rot = 0}) => {
  const ls = displayLines ?? [text ?? ''];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  const fr = useCurrentFrame();
  if (k <= 0.01) return null;
  const xx = Math.max(w / 2 + 12, Math.min(1080 - w / 2 - 12, x));
  const sc = (0.88 + 0.12 * Math.min(1, k * 1.15)) * (1 + 0.01 * Math.sin(fr / 11 + x * 0.01));
  return (
    <g opacity={Math.min(1, k * 1.7)} transform={`translate(${xx} ${yy}) rotate(${rot}) scale(${sc})`}>
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
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; overlay?: React.ReactNode; bg?: string; warmth?: number; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.22, overlay, bg = NB.room, warmth = 0.03, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: 540 + 10 * Math.sin(p.f / 110) + 6 * t, fy: 960};
  const zz = Math.max(1, c.z);
  const fx = Math.max(540 / zz, Math.min(1080 - 540 / zz, c.fx)), fy = Math.max(960 / zz, Math.min(1920 - 960 / zz, c.fy));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: bg}} />
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - fx * zz}px, ${960 - fy * zz}px) scale(${zz})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill={NB.roomL} stroke={NB.vellumL} strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={NB.vellumL}>{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.05} warmth={warmth} />
    </AbsoluteFill>
  );
};

/** the overhead light table: cream vellum glowing from below fills the frame inside an oak rim; tile boxes, a pencil tray
 *  and an eraser give the floor band under the caption card a job. glow 0..1 is the click-on. */
const TableTop: React.FC<{f: number; glow?: number; seed?: number; rimTop?: number; props?: boolean}> = ({f, glow = 1, seed = 1, rimTop = 330, props = true}) => {
  const g = clamp01(glow);
  return (
    <g>
      <rect x={-60} y={-60} width={1200} height={2040} fill={NB.oakD} />
      <rect x={-60} y={rimTop} width={1200} height={1180} fill={NB.oak} stroke={INK} strokeWidth={5} />
      {Array.from({length: 10}, (_, i) => <path key={i} d={`M -40 ${rimTop + 14 + i * 116} q 280 ${10 * Math.sin(i)} 560 0 t 560 0`} stroke={NB.oakL} strokeWidth={2.5} fill="none" opacity={0.5} />)}
      <rect x={30} y={rimTop + 40} width={1020} height={1080} fill={NB.roomD} stroke={INK} strokeWidth={5} />
      <rect x={30} y={rimTop + 40} width={1020} height={1080} fill={NB.vellum} opacity={0.15 + 0.85 * g} />
      <rect x={30} y={rimTop + 40} width={1020} height={1080} fill={NB.glow} opacity={0.18 * g * (0.94 + 0.06 * Math.sin(f / 31 + seed))} />
      {Array.from({length: 6}, (_, i) => <path key={`v${i}`} d={`M ${60 + i * 170} ${rimTop + 60} l 20 1040`} stroke={NB.vellumD} strokeWidth={2} opacity={0.35 * g} />)}
      {props && (
        <g data-band="ok">
          <rect x={-60} y={1460} width={1200} height={520} fill={NB.oakD} stroke={INK} strokeWidth={5} />
          <path d="M -60 1476 L 1140 1476" stroke={NB.oakL} strokeWidth={4} opacity={0.6} />
          {/* a pencil tray with three spare pencils */}
          <g transform="translate(150 1600)">
            <ContactShadow cx={90} cy={70} rx={130} ry={14} opacity={0.45} />
            <rect x={-20} y={0} width={240} height={64} rx={14} fill={NB.inkL} stroke={INK} strokeWidth={5} />
            {[0, 1, 2].map((i) => <g key={i} transform={`translate(0 ${12 + i * 16}) rotate(${-2 + i * 2})`}><rect x={0} y={0} width={200} height={12} fill={i === 1 ? NB.carmine : '#C9A76A'} stroke={INK} strokeWidth={2.5} /><path d="M 200 0 L 214 6 L 200 12 Z" fill="#E7C9A0" stroke={INK} strokeWidth={2} /></g>)}
          </g>
          {/* stacked tile boxes */}
          <g transform="translate(640 1560)">
            <ContactShadow cx={140} cy={150} rx={190} ry={18} opacity={0.45} />
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${i * 14} ${i * -44})`}>
                <rect x={0} y={100} width={280} height={52} rx={4} fill={['#5B6C82', '#6E5E4A', '#4E5E58'][i]} stroke={INK} strokeWidth={4} />
                <rect x={110} y={112} width={60} height={26} rx={3} fill={NB.vellumL} stroke={INK} strokeWidth={2.5} />
              </g>
            ))}
          </g>
          <g transform="translate(480 1760) rotate(-8)">
            <ContactShadow cx={0} cy={26} rx={56} ry={9} opacity={0.4} />
            <rect x={-50} y={-20} width={100} height={40} rx={8} fill="#E8B9BE" stroke={INK} strokeWidth={4} />
            <path d="M -30 -20 L -30 20" stroke={INK} strokeWidth={2.5} />
          </g>
        </g>
      )}
    </g>
  );
};

/** the drafting room seen at eye level: a far wall with a shelf of tile boxes, a framed survey map of Alaska and a window
 *  onto a dark range; the light table side-on at tableY. */
const Room: React.FC<{f: number; tableY?: number; lamp?: boolean; seed?: number}> = ({f, tableY = 1180, lamp = true, seed = 1}) => (
  <g>
    <rect x={-60} y={-60} width={1200} height={2040} fill={NB.room} />
    <rect x={-60} y={-60} width={1200} height={tableY - 200} fill={NB.roomL} opacity={0.55} />
    {/* window onto a dark range under stars */}
    <g transform="translate(700 470)">
      <rect x={0} y={0} width={300} height={260} fill="#232A3E" stroke={INK} strokeWidth={6} />
      <path d="M 0 200 L 60 130 L 110 170 L 170 90 L 230 160 L 300 120 L 300 260 L 0 260 Z" fill="#3A4462" stroke={INK} strokeWidth={3} />
      <path d="M 150 110 L 170 90 L 190 112" stroke={NB.iceD} strokeWidth={5} fill="none" />
      {Array.from({length: 7}, (_, i) => <circle key={i} cx={20 + h01(seed, i) * 260} cy={20 + h01(seed + 1, i) * 70} r={2 + (i % 2)} fill={NB.vellumL} opacity={0.5 + 0.5 * Math.sin(f / 17 + i)} />)}
      <path d="M 150 0 L 150 260 M 0 130 L 300 130" stroke={INK} strokeWidth={6} />
    </g>
    {/* framed survey map of Alaska on the wall */}
    <g transform="translate(90 500)">
      <rect x={0} y={0} width={300} height={220} fill={NB.vellumD} stroke={INK} strokeWidth={6} />
      <rect x={12} y={12} width={276} height={196} fill={NB.vellum} stroke={NB.oak} strokeWidth={3} />
      <AlaskaOutline x={28} y={30} w={244} fill={NB.vellumD} stroke={INK} strokeWidth={2.5} shadow={0} />
    </g>
    {/* shelf of tile boxes */}
    <g transform={`translate(0 ${tableY - 360})`}>
      <rect x={-60} y={0} width={1200} height={18} fill={NB.oak} stroke={INK} strokeWidth={4} />
      {Array.from({length: 9}, (_, i) => <rect key={i} x={30 + i * 116} y={-90 - 20 * h01(seed + 3, i)} width={96} height={90 + 20 * h01(seed + 3, i)} fill={['#5B6C82', '#6E5E4A', '#4E5E58'][i % 3]} stroke={INK} strokeWidth={3.5} />)}
    </g>
    <LightTable f={f} x={540} y={tableY} w={1060} lamp={lamp} />
    <rect x={-60} y={tableY + 464} width={1200} height={600} fill={NB.roomD} data-band="ok" />
    <path d={`M -60 ${tableY + 466} L 1140 ${tableY + 466}`} stroke={NB.inkL} strokeWidth={4} data-band="ok" />
  </g>
);

// ---- S1: THE TRACE
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const glow = ease(f, 3, 8);
  const drop = ease(f, 2, 10);
  const A = {x: 70, y: 600, w: 470, h: 560}, Bt = {x: 540, y: 600, w: 470, h: 560};
  const la = tileLake(A.x, A.y, A.w, A.h, 3, 0.26);
  const tr = easeIO(f, 12, Math.max(18, b(2) - 4));
  const slideB = ease(f, b(3) - 2, 14);
  const lb = tileLake(Bt.x, Bt.y, Bt.w, Bt.h, 8, 0.24);
  const run = easeIO(f, b(3) + 12, 30);
  const th = tr * Math.PI * 2 - Math.PI / 2;
  let nx = la.cx + la.rx * Math.cos(th), ny = la.cy + la.ry * Math.sin(th);
  if (run > 0) {
    nx = lerp(lb.cx + lb.rx, Bt.x + Bt.w + 34, run);
    ny = lerp(lb.cy, lb.cy - 20, run);
  }
  const lineEnd = Math.min(Bt.x + Bt.w, nx);
  return (
    <Frame p={p} z0={1.06} z1={1.0} overlay={<>
          <Plate x={540} text="A MACHINE · DEEP LEARNING" y={520} size={30} tone="ultra" p={win(f, 8, b(2))} />
          <Plate x={540} text="TRACED ON SATELLITE TILES" y={520} size={30} p={win(f, b(2) + 2, b(3))} />
          <Plate x={540} text="CIRCA 2000 · CIRCA 2020" y={520} size={30} tone="dark" p={win(f, b(3) + 4)} />
        </>}>
      <SVG>
        <TableTop f={f} glow={glow} seed={1} />
        <HeldTravel f={f} x={A.x} y={A.y} w={A.w} h={A.h} mode="sweep" seed={11}>
          <LandsatTile f={f} {...A} seed={3} trace={tr} glow={glow * 0.35} date="CIRCA 2000" lakeR={0.26} />
        </HeldTravel>
        {slideB > 0.01 && (
          <g transform={`translate(${(1 - slideB) * 620} 0)`}>
            <LandsatTile f={f} {...Bt} seed={8} trace={run > 0 ? 1 : 0} glow={0.35} date="CIRCA 2020" lakeR={0.24} />
            {run > 0 && <path d={`M ${lb.cx + lb.rx} ${lb.cy} L ${lineEnd} ${lerp(lb.cy, lb.cy - 20, clamp01((lineEnd - lb.cx - lb.rx) / Math.max(1, Bt.x + Bt.w + 34 - lb.cx - lb.rx)))}`} stroke={NB.ultra} strokeWidth={6} strokeLinecap="round" />}
          </g>
        )}
        <g transform={`translate(0 ${(1 - drop) * -700})`}>
          <Nib f={f} x={nx} y={ny} s={0.62} emotion={f < 14 ? 'curious' : run > 0.9 ? 'curious' : 'focused'} squash={f >= 10 && f < 20 ? Math.sin(((f - 10) / 10) * Math.PI) : 0}
            stroke={tr > 0 && tr < 1 ? 1 : run > 0 && run < 1 ? 1 : 0} splay={run > 0.95 ? 0.7 : 0} look={run > 0.9 ? 0.8 : 0} lookY={run > 0.9 ? 0.6 : 0}
            cues={[b(1), b(2), b(3)]} seed={7} ink={run > 0.95 ? 0 : 1} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S2: TILE TO TILE
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tw = 360, gap = 30;
  const scroll = f * 5.2;
  const flip = f >= b(5);
  const second = easeIO(f, b(5) + 2, 26);
  const tiles = Array.from({length: 7}, (_, i) => i);
  return (
    <Frame p={p} z0={1.0} z1={1.04} overlay={<>
          <Plate x={540} text="LANDSAT IMAGES" y={500} size={32} p={win(f, b(4) + 4, b(5))} />
          <Plate x={540} text="DEEP LEARNING · LAKES WORLDWIDE · 2000 AND 2020" displayLines={['DEEP LEARNING · LAKES WORLDWIDE', '2000 AND 2020']} y={540} size={28} tone="ultra" p={win(f, b(5) + 2)} />
        </>}>
      <SVG>
        <TableTop f={f} seed={2} />
        <HeldTravel f={f} x={0} y={700} w={1080} h={420} mode="shadow" seed={21}>
          <g>
            {tiles.map((i) => {
              const x = 600 + i * (tw + gap) - scroll;
              const dist = (540 - (x + tw / 2)) / (tw + gap);
              const trace = clamp01(dist + 0.6);
              const L = tileLake(x, 720, tw, 380, 20 + i, 0.24);
              return (
                <g key={i}>
                  <LandsatTile f={f} x={x} y={720} w={tw} h={380} seed={20 + i} trace={trace} lake={flip ? 1 + 0.25 * second : 1} date={flip ? 'CIRCA 2020' : 'CIRCA 2000'} lakeR={0.24} />
                  {flip && trace >= 1 && <LakeOutline cx={L.cx} cy={L.cy} rx={L.rx} ry={L.ry} seed={20 + i} p={1} width={3} color={NB.ultraL} dashed />}
                </g>
              );
            })}
          </g>
        </HeldTravel>
        <Nib f={f} x={540 + 30 * Math.sin(f / 7)} y={930 + 30 * Math.cos(f / 7)} s={0.6} emotion={flip ? 'curious' : 'proud'} stroke={1} cues={[b(4), b(5)]} seed={7} tick={0} />
        <g transform={`translate(540 1250)`}>
          <ContactShadow cx={0} cy={30} rx={300} ry={12} opacity={0.3} />
          {['2000', '2020'].map((y, i) => (
            <g key={y} transform={`translate(${-150 + i * 300} 0)`}>
              <rect x={-90} y={-30} width={180} height={60} rx={8} fill={(flip ? i === 1 : i === 0) ? NB.ultra : NB.roomL} stroke={INK} strokeWidth={4} />
              <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} fill={NB.vellumL}>{`C. ${y}`}</text>
            </g>
          ))}
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S3: CHECKED BY HAND (eye level across the table, the surface in perspective)
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const ticks = [b(6), b(6) + 12, b(6) + 24];
  const tp = [[300, 1050], [470, 1000], [700, 1040]] as [number, number][];
  const hk = (i: number) => clamp01((f - ticks[i]) / 8);
  let hx = 900, hy = 1500, press = 0;
  for (let i = 0; i < 3; i++) {
    if (f >= ticks[i] - 8) {
      const k = easeIO(f, ticks[i] - 8, 8);
      hx = lerp(i ? tp[i - 1][0] + 20 : 900, tp[i][0] + 20, k);
      hy = lerp(i ? tp[i - 1][1] + 10 : 1500, tp[i][1] + 10, k);
      press = f >= ticks[i] && f < ticks[i] + 6 ? 1 : 0;
    }
  }
  const nudge = easeIO(f, b(7) - 6, 10);
  if (f >= b(7) - 14) {
    const k = easeIO(f, b(7) - 14, 10);
    hx = lerp(tp[2][0] + 20, 620, k);
    hy = lerp(tp[2][1] + 10, 930, k);
  }
  const sticker = f >= b(7) + 6;
  if (f >= b(7) + 2) {
    const k = easeIO(f, b(7) + 2, 8);
    hx = lerp(620, 700, k);
    hy = lerp(930, 820, k);
  }
  const away = easeIO(f, b(8) - 10, 14);
  hx = lerp(hx, 1100, away);
  hy = lerp(hy, 1600, away);
  const card = ease(f, b(8), 18);
  return (
    <Frame p={p} z0={1.0} z1={1.05} overlay={<>
          <Plate x={540} text="CHECKED BY HAND · PER TU GRAZ" y={520} size={30} tone="plate" p={win(f, b(6) + 4, b(7))} />
          <Plate x={540} text="MANUAL REFINEMENT · PER THE PAPER" y={520} size={30} tone="plate" p={win(f, b(7) + 2, b(8))} />
          <Plate x={540} text="NATURE CLIMATE CHANGE · NOVEMBER 20TH" displayLines={['NATURE CLIMATE CHANGE', 'NOVEMBER 20TH']} y={560} size={30} tone="dark" p={win(f, b(8) + 6)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1240} seed={3} />
        {/* the table surface in perspective: tiles and outlines on the glowing vellum */}
        <g>
          <path d="M 40 1200 L 140 900 L 940 900 L 1040 1200 Z" fill={NB.vellum} stroke={INK} strokeWidth={5} />
          <path d="M 40 1200 L 140 900 L 940 900 L 1040 1200 Z" fill={NB.glow} opacity={0.25} />
          {[0, 1, 2].map((i) => {
            const cx = tp[i][0], cy = tp[i][1];
            return (
              <g key={i}>
                <path d={`M ${cx - 110} ${cy + 60} L ${cx - 90} ${cy - 50} L ${cx + 90} ${cy - 50} L ${cx + 110} ${cy + 60} Z`} fill={NB.tile} stroke={INK} strokeWidth={3} />
                <g transform={`translate(${cx} ${cy}) scale(1 0.5)`}>
                  <LakeFill cx={0} cy={0} rx={60} ry={50} seed={30 + i} />
                  <LakeOutline cx={0} cy={0} rx={60 * (i === 2 ? 1 + 0.12 * nudge : 1)} ry={50 * (i === 2 ? 1 + 0.12 * nudge : 1)} seed={30 + i} p={1} width={6} />
                </g>
                <Tick x={cx + 64} y={cy - 26} p={hk(i)} s={1.1} />
              </g>
            );
          })}
          {card > 0.01 && (
            <g transform={`translate(${lerp(-300, 760, card)} 1130) skewX(-12)`}>
              <rect x={-120} y={-40} width={240} height={70} fill={NB.vellumL} stroke={INK} strokeWidth={4} opacity={0.9} />
              <text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>NATURE CLIMATE</text>
              <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>CHANGE</text>
            </g>
          )}
        </g>
        <HeldProp f={f} px={560} py={1080} w={220} h={360} kind="rest" seed={31}>
          <Nib f={f} x={560} y={1080} s={0.78} emotion={sticker ? 'proud' : f > b(6) ? 'curious' : 'calm'} look={f > b(6) && f < b(7) ? -0.8 : 0.4} tick={sticker ? ease(f, b(7) + 6, 14) : 0}
            splay={f > b(7) - 6 && f < b(7) + 2 ? 0.8 : 0} cues={[b(6), b(7), b(8)]} seed={7} ink={0} />
        </HeldProp>
        <CheckHand f={f} x={hx} y={hy} s={1.15} press={press} angle={-10} />
      </SVG>
    </Frame>
  );
};

// ---- S4: THE QUESTION (low and close at the waterline)
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const walk = easeIO(f, 0, Math.max(12, b(9) + 10));
  const unsure = f >= b(10) - 4;
  const wl = 1060;
  return (
    <Frame p={p} z0={1.08} z1={1.0} overlay={<>
          <Plate x={540} text="DOES A LAKE EAT ITS GLACIER?" y={540} size={36} tone="ultra" p={win(f, b(9) + 2)} />
          <Plate x={540} text="THE QUESTION" y={640} size={26} tone="dark" p={win(f, b(10) + 2)} />
        </>}>
      <SVG>
        <rect x={-60} y={-60} width={1200} height={2040} fill={NB.tile} />
        {/* the ice front, close: white wall with crevasses and blue shadows */}
        <path d={`M -60 -60 L 1140 -60 L 1140 ${wl - 40} C 900 ${wl - 10} 700 ${wl - 70} 480 ${wl - 30} C 300 ${wl} 140 ${wl - 50} -60 ${wl - 30} Z`} fill={NB.ice} stroke={INK} strokeWidth={6} />
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${40 + i * 120} 380 q ${10 * Math.sin(i)} 300 ${-20 + 10 * i % 30} ${560 + 40 * h01(4, i)}`} stroke={NB.iceD} strokeWidth={6} fill="none" />)}
        {Array.from({length: 6}, (_, i) => <path key={`s${i}`} d={`M ${100 + i * 170} ${wl - 200} l 30 150 l -40 0 Z`} fill="#A9C4DA" opacity={0.6} />)}
        {/* the lake */}
        <path d={`M -60 ${wl - 30} C 140 ${wl - 50} 300 ${wl} 480 ${wl - 30} C 700 ${wl - 70} 900 ${wl - 10} 1140 ${wl - 40} L 1140 1980 L -60 1980 Z`} fill={NB.lake} stroke={INK} strokeWidth={6} data-band="ok" />
        <path d={`M -60 ${wl + 140} L 1140 ${wl + 120} L 1140 1980 L -60 1980 Z`} fill={NB.lakeD} opacity={0.35} data-band="ok" />
        {Array.from({length: 7}, (_, i) => {
          const ph = ((f / 40 + i / 7) % 1);
          return <path key={i} d={`M ${80 + i * 140} ${wl + 20 + ph * 380} q 40 -12 80 0`} stroke={NB.lakeL} strokeWidth={5} fill="none" opacity={1 - ph} data-band="ok" />;
        })}
        <path d={`M -60 ${wl - 26} C 140 ${wl - 46} 300 ${wl + 4 + 6 * Math.sin(f / 9)} 480 ${wl - 26} C 700 ${wl - 66} 900 ${wl - 6} 1140 ${wl - 36}`} stroke={NB.lakeL} strokeWidth={8} fill="none" opacity={0.8} />
        <HeldTravel f={f} x={0} y={380} w={1080} h={700} mode="shadow" seed={41}><g><rect x={0} y={380} width={1080} height={700} fill="none" /></g></HeldTravel>
        <Nib f={f} x={lerp(860, 560, walk)} y={wl + 40} s={1.25} emotion={unsure ? 'uneasy' : 'curious'} splay={unsure ? 0.9 : 0} look={unsure ? 0 : -0.3}
          lookY={unsure ? (f < b(10) + 20 ? 0.9 : -0.9) : 0.8} lean={walk < 1 ? -8 * Math.sin(f / 3) : 0} cues={[b(9), b(10)]} seed={7} tick={1} ink={0} />
      </SVG>
    </Frame>
  );
};

// ---- S5: THE WORLD MULTIPLIED (popcorn and the stalled tape)
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pull = easeIO(f, 0, 30);
  const N = 120;
  const popT = (i: number) => b(11) + Math.pow(i / N, 0.55) * Math.max(30, b(13) - b(11) - 10);
  const cnt = Math.round(3567 * clamp01(lin(f, b(11), Math.max(20, b(12) - b(11) + 6))));
  const tape = 130 * clamp01(lin(f, b(13), 24));
  return (
    <Frame p={p} cam={(ff) => ({z: lerp(1.6, 1.0, pull), fx: 540, fy: 900})} overlay={<>
          <Plate x={540} text="WORLD · +3,567 ICE-CONTACT LAKES · +35%" displayLines={['WORLD · +3,567', 'ICE-CONTACT LAKES · +35%']} y={540} size={32} tone="plate" p={win(f, b(11) + 4, b(13))} />
          <Plate x={540} text="+3,567 · ABOUT 35% MORE LAKES" y={680} size={26} tone="dark" p={win(f, b(12) + 2, b(13))} />
          <Plate x={540} text="WORLD · AREA +9%" y={540} size={34} tone="plate" p={win(f, b(13) + 4)} />
        </>}>
      <SVG>
        <TableTop f={f} seed={5} />
        <HeldTravel f={f} x={60} y={420} w={960} h={900} mode="shadow" seed={51}>
          <g>
            {Array.from({length: 48}, (_, i) => {
              const c = i % 8, r = Math.floor(i / 8);
              return <LandsatTile key={i} f={f} x={70 + c * 118} y={440 + r * 140} w={112} h={134} seed={60 + i} glow={0.2} lakeR={0.16} />;
            })}
          </g>
        </HeldTravel>
        {Array.from({length: N}, (_, i) => (
          <LakeChip key={i} x={90 + h01(70, i) * 900} y={460 + h01(71, i) * 820} r={9 + 6 * h01(72, i)} pop={(f - popT(i)) / 10} seed={i} />
        ))}
        <g transform="translate(760 1360)">
          <ContactShadow cx={0} cy={44} rx={170} ry={14} opacity={0.45} />
          <rect x={-170} y={-40} width={340} height={84} rx={12} fill={NB.brass} stroke={INK} strokeWidth={5} />
          <rect x={-150} y={-26} width={300} height={56} rx={6} fill={NB.roomD} stroke={INK} strokeWidth={3} />
          <text x={0} y={18} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={40} fill={NB.lakeL}>{f >= b(11) ? `+${cnt.toLocaleString('en-US')}` : '+0'}</text>
        </g>
        <TapeMeasure f={f} x={150} y={1380} len={tape} label={f >= b(13) ? 'AREA' : undefined} sweat={f > b(13) + 26 ? 1 : 0} />
        <Nib f={f} x={980} y={1390} s={0.34} emotion={f > b(13) ? 'uneasy' : 'surprised'} cues={[b(11), b(12), b(13)]} seed={7} tick={1} label={false} ink={0} />
      </SVG>
    </Frame>
  );
};

/** the study's press release card. rows 0..1 opens the two blank rows; howMany fills the first row with our count. */
const ReleaseCard: React.FC<{f: number; x: number; y: number; s?: number; lit?: number; rows?: number; howMany?: number; whyGone?: number}> = ({f, x, y, s = 1, lit = 0, rows = 0, howMany = 0, whyGone = 0}) => {
  const r = clamp01(rows);
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${-2 + 0.6 * Math.sin(f / 37)})`}>
      <rect x={-330 + 10} y={-300 + 12} width={660} height={600} fill="#000" opacity={0.28} />
      <rect x={-330} y={-300} width={660} height={600} fill={NB.vellumL} stroke={INK} strokeWidth={5} />
      <rect x={-330} y={-300} width={660} height={64} fill={NB.roomL} stroke={INK} strokeWidth={5} />
      <text x={0} y={-258} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={NB.vellumL}>PRESS RELEASE · TU GRAZ</text>
      {Array.from({length: 4}, (_, i) => <rect key={i} x={-290} y={-210 + i * 30} width={560 * (0.7 + 0.3 * h01(9, i))} height={10} rx={4} fill={NB.vellumD} />)}
      <rect x={-300} y={-86} width={600} height={56} rx={6} fill={NB.lakeL} opacity={clamp01(lit)} />
      <text x={0} y={-48} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={23} fill={INK}>"PARTICULARLY PRONOUNCED IN ALASKA"</text>
      {Array.from({length: 2}, (_, i) => <rect key={`b${i}`} x={-290} y={-8 + i * 30} width={500 * (0.6 + 0.4 * h01(19, i))} height={10} rx={4} fill={NB.vellumD} />)}
      {r > 0.01 && (
        <g transform={`translate(0 120) scale(1 ${spring(r)})`}>
          {[['HOW MANY', 0], ['WHY', 1]].map(([lab, i]) => (
            <g key={lab as string} transform={`translate(0 ${(i as number) * 84})`} opacity={i === 1 ? 1 - clamp01(whyGone) : 1}>
              <text x={-290} y={10} fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>{lab as string}</text>
              <rect x={-120} y={-24} width={410} height={50} rx={6} fill={NB.vellum} stroke={INK} strokeWidth={4} strokeDasharray={i === 0 && howMany > 0 ? '0' : '10 8'} />
              {i === 0 && howMany > 0 && <text x={85} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={NB.cobalt} opacity={clamp01(howMany)}>931 TO 1,078</text>}
            </g>
          ))}
        </g>
      )}
    </g>
  );
};

// ---- S6: NO ALASKA NUMBER
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slide = ease(f, b(14) - 2, 16);
  const lit = easeIO(f, b(14) + 14, 12);
  const rows = ease(f, b(15) - 2, 14);
  const puff = f >= b(15) && f < b(15) + 18 ? (f - b(15)) / 18 : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.06} overlay={<>
          <Plate x={540} text={'"PARTICULARLY PRONOUNCED IN ALASKA" · PER TU GRAZ'} displayLines={['"PARTICULARLY PRONOUNCED', 'IN ALASKA" · PER TU GRAZ']} y={520} size={28} p={win(f, b(14) + 16, b(15))} />
          <Plate x={540} text="NO ALASKA NUMBER IN THE RELEASE" y={520} size={30} tone="dark" p={win(f, b(15) + 4)} />
        </>}>
      <SVG>
        <TableTop f={f} seed={6} />
        <HeldTravel f={f} x={190} y={660} w={700} h={640} mode="shadow" seed={61}>
          <g transform={`translate(${(1 - slide) * -800} 0)`}><ReleaseCard f={f} x={540} y={960} s={1.02} lit={lit} rows={rows} /></g>
        </HeldTravel>
        {puff > 0 && [0, 1].map((i) => (
          <g key={i} opacity={1 - puff}>
            {Array.from({length: 6}, (_, k) => <circle key={k} cx={760 + Math.cos(k) * 60 * puff} cy={1082 + i * 86 + Math.sin(k * 1.7) * 30 * puff} r={10 + 8 * puff} fill={NB.vellumD} />)}
          </g>
        ))}
        <Nib f={f} x={940} y={1420} s={0.5} emotion={f >= b(15) ? 'surprised' : 'curious'} look={-0.8} lookY={-0.6} cues={[b(14), b(15)]} seed={7} tick={1} label={false} ink={0} />
      </SVG>
    </Frame>
  );
};

/** a brass counter drum digit */
const Drum: React.FC<{x: number; y: number; d: number}> = ({x, y, d}) => {
  const dd = ((d % 10) + 10) % 10;
  const i0 = Math.floor(dd), fr = dd - i0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-34} y={-50} width={68} height={100} rx={8} fill={NB.roomD} stroke={INK} strokeWidth={4} />
      <clipPath id={`dr${x}`}><rect x={-30} y={-44} width={60} height={88} /></clipPath>
      <g clipPath={`url(#dr${x})`}>
        {[0, 1].map((k) => <text key={k} x={0} y={18 - (fr - k) * 70 * -1 - k * 0} transform={`translate(0 ${-(fr) * 70 + k * 70})`} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={52} fill={NB.vellumL}>{(i0 + k) % 10}</text>)}
      </g>
      <path d="M -34 -6 L 34 -6" stroke={NB.brass} strokeWidth={2} opacity={0.5} />
    </g>
  );
};

// ---- S7: WE COUNTED
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const open = ease(f, b(16), 18);
  const roll = clamp01(lin(f, b(17) - 4, 22));
  const val = 13685 * roll;
  const stamp = f >= b(18) ? spring(clamp01((f - b(18)) / 12)) : 0;
  const tk = clamp01((f - b(18) - 10) / 8);
  const digits = Math.floor(val).toString().padStart(5, '0').split('').map(Number);
  return (
    <Frame p={p} z0={1.0} z1={1.05} overlay={<>
          <Plate x={540} text="THE AUTHORS' OPEN DATA · FIGSHARE" y={520} size={30} p={win(f, b(16) + 4, b(17))} />
          <Plate x={540} text="OUR COUNT · 13,685 LAKES · +3,567 · MATCHES THE PAPER" displayLines={['OUR COUNT · 13,685 LAKES', '+3,567 · MATCHES THE PAPER']} y={540} size={28} tone="count" p={win(f, b(17) + 6, b(18) + 30)} />
          <Plate x={540} text="COUNT ONLY · OUR COUNT" y={680} size={26} tone="count" p={win(f, b(18) + 6)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1260} lamp seed={7} />
        {/* the open folder on the table, tiles fanning out */}
        <g transform="translate(250 1180)">
          <ContactShadow cx={0} cy={60} rx={220} ry={18} opacity={0.45} />
          <path d="M -200 50 L -180 -60 L 180 -60 L 200 50 Z" fill="#C9A35E" stroke={INK} strokeWidth={5} />
          <g transform={`rotate(${-70 * open} -180 -60)`}><path d="M -180 -60 L -170 -170 L 170 -170 L 180 -60 Z" fill="#D9B46E" stroke={INK} strokeWidth={5} /><text x={0} y={-108} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>THE AUTHORS' OPEN DATA</text></g>
          {Array.from({length: 5}, (_, i) => {
            const k = clamp01(open * 1.4 - i * 0.1);
            return <g key={i} transform={`translate(${-60 + i * 30 * k} ${-40 - 60 * k}) rotate(${(i - 2) * 14 * k})`}><rect x={-70} y={-50} width={140} height={100} fill={NB.tile} stroke={INK} strokeWidth={3} /><path d={lakeBlob(0, 6, 30, 20, 90 + i)} fill={NB.lake} stroke={NB.ultra} strokeWidth={3} /></g>;
          })}
        </g>
        {/* the tally counters */}
        <HeldTravel f={f} x={430} y={800} w={560} h={220} mode="sweep" seed={71}>
          <g>
            <rect x={430} y={820} width={560} height={180} rx={18} fill={NB.brass} stroke={INK} strokeWidth={6} />
            <rect x={450} y={838} width={520} height={144} rx={10} fill={NB.brassD} stroke={INK} strokeWidth={3} />
            {digits.map((d, i) => <Drum key={i} x={500 + i * 105} y={910} d={i === 4 ? (val % 10) : Math.floor(val / Math.pow(10, 4 - i)) % 10} />)}
          </g>
        </HeldTravel>
        <g transform="translate(710 1050)">
          <ContactShadow cx={0} cy={140} rx={160} ry={14} opacity={0.4} />
          <rect x={-150} y={0} width={300} height={130} fill={NB.vellumL} stroke={INK} strokeWidth={4} transform="skewX(-10)" />
          <text x={0} y={40} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>TALLY · ICE-CONTACT</text>
          <text x={0} y={70} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>2000 · 10,118</text>
          <text x={0} y={96} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>2020 · 13,685</text>
          {stamp > 0.01 && <g transform={`translate(30 70) rotate(-12) scale(${2 - stamp})`} opacity={clamp01(stamp * 2)}><rect x={-100} y={-30} width={200} height={60} rx={6} fill="none" stroke={NB.cobalt} strokeWidth={6} /><text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={NB.cobalt}>OUR COUNT</text></g>}
          <Tick x={150} y={20} p={tk} s={1.4} />
        </g>
        {f >= b(18) - 10 && f < b(18) + 24 && <g transform={`translate(740 ${lerp(700, 1090, easeIO(f, b(18) - 10, 10)) - 120 * easeIO(f, b(18) + 2, 12)})`}><rect x={-60} y={-130} width={120} height={40} rx={8} fill={NB.oak} stroke={INK} strokeWidth={4} /><rect x={-16} y={-90} width={32} height={70} fill={NB.oakD} stroke={INK} strokeWidth={4} /><rect x={-70} y={-20} width={140} height={22} rx={4} fill={NB.cobalt} stroke={INK} strokeWidth={4} /></g>}
        <Nib f={f} x={160} y={1210} s={0.55} emotion={f >= b(18) ? 'proud' : 'focused'} look={0.8} tag={ease(f, b(18) + 8, 16)} tick={1} cues={[b(16), b(17), b(18)]} seed={7} ink={0} />
        {f > b(18) + 4 && <CheckHand f={f} x={lerp(1100, 880, easeIO(f, b(18) + 4, 8))} y={1080} s={1.0} press={tk > 0 && tk < 1 ? 1 : 0} angle={-15} />}
      </SVG>
    </Frame>
  );
};

// Alaska on the vellum: true outline fit, coastal lakes placed by lon/lat (our count's biggest gains among them)
const AK_FIT = {x: 70, y: 560, w: 940};
const COAST: [number, number, number, number][] = [
  [-143.42, 60.15, 1.6, 92377], [-138.86, 59.48, 1.25, 91539], [-140.16, 59.82, 1.2, 91569], [-138.16, 59.18, 1.0, 91540], [-142.77, 60.81, 0.8, 91713],
  [-143.92, 60.3, 0.9, 92234], [-146.0, 60.9, 0.7, 5], [-148.4, 61.2, 0.75, 6], [-134.6, 58.5, 0.7, 7], [-136.5, 58.9, 0.65, 8], [-150.5, 61.6, 0.6, 9], [-152.8, 60.3, 0.55, 10],
];
const AkVellum: React.FC<{f: number; swell?: number; seed?: number; labelVitus?: boolean}> = ({f, swell = 0, seed = 8, labelVitus = false}) => (
  <g>
    <AlaskaOutline x={AK_FIT.x} y={AK_FIT.y} w={AK_FIT.w} fill={NB.vellumD} stroke={INK} strokeWidth={4} shadow={10} shadowColor={NB.oakD} />
    {COAST.map(([lon, lat, r, sd], i) => {
      const [x, y] = akProject(lon, lat, AK_FIT);
      const rr = 9 * r;
      const k = 1 + 0.16 * swell * (1 + 0.04 * Math.sin(f / 7 + i));
      return (
        <g key={i}>
          <path d={lakeBlob(x, y, rr * 1.0, rr * 0.75, sd)} fill="none" stroke={NB.inkL} strokeWidth={2} strokeDasharray="4 4" />
          <LakeFill cx={x} cy={y} rx={rr} ry={rr * 0.75} seed={sd} swell={k} f={f} />
          <path d={lakeBlob(x, y, rr * k, rr * 0.75 * k, sd)} fill="none" stroke={NB.ultra} strokeWidth={2.5} />
        </g>
      );
    })}
    {labelVitus && (() => {
      const [x, y] = akProject(-143.42, 60.15, AK_FIT);
      return <NLab x={x - 20} y={y - 44} text="BERING GLACIER" size={14} />;
    })()}
  </g>
);

// ---- S8: ALASKA SWELLED
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slide = ease(f, b(19) - 4, 18);
  const sw = easeIO(f, b(20), 30);
  const dough = sw > 0 && sw < 1 ? 0.03 * Math.sin(f / 3) : 0;
  const tape = lerp(0, 1300, easeIO(f, b(21) - 4, 40));
  const seam = ease(f, b(22) - 2, 10);
  const [vx, vy] = akProject(-143.42, 60.15, AK_FIT);
  return (
    <Frame p={p} cam={(ff) => ({z: lerp(1.0, 1.35, easeIO(ff, b(20), 40)) * (1 - 0.25 * seam) + 0.25 * seam, fx: lerp(540, vx + 60, easeIO(ff, b(20), 40) * (1 - seam)), fy: lerp(960, vy + 80, easeIO(ff, b(20), 40) * (1 - seam))})} overlay={<>
          <Plate x={540} text="ALASKA · 931 TO 1,078 · +16% · OUR COUNT" displayLines={['ALASKA · 931 TO 1,078', '+16% · OUR COUNT']} y={520} size={30} tone="count" p={win(f, b(19) + 6, b(20))} />
          <Plate x={540} text="ALASKA · ABOUT 880 TO 1,190 SQ KM · +35% · OUR COUNT" displayLines={['ALASKA · ABOUT 880 TO 1,190 SQ KM', '+35% · OUR COUNT']} y={520} size={28} tone="count" p={win(f, b(20) + 6, b(21))} />
          <Plate x={540} text="AREA · +35% · OUR COUNT" y={520} size={30} tone="count" p={win(f, b(21) + 6, b(22) - 2)} />
          <Plate x={540} text="THE WORLD'S LAKES MULTIPLIED · ALASKA'S SWELLED" displayLines={["THE WORLD'S LAKES MULTIPLIED", "ALASKA'S SWELLED"]} y={540} size={32} tone="ultra" p={win(f, b(22) + 2)} />
        </>}>
      <SVG>
        <TableTop f={f} seed={8} />
        <HeldTravel f={f} x={60} y={520} w={960} h={760} mode="shadow" seed={81}>
          <g transform={`translate(${(1 - slide) * 1100} 0) scale(${1 + dough})`}>
            <rect x={60} y={500} width={960} height={800} fill={NB.vellumL} opacity={0.55} stroke={NB.vellumD} strokeWidth={3} />
            <AkVellum f={f} swell={sw} labelVitus={sw > 0.5} />
          </g>
        </HeldTravel>
        <g transform="translate(860 1240)">
          <ReleaseCard f={f} x={0} y={0} s={0.34} rows={1} howMany={ease(f, b(19) + 8, 14)} />
        </g>
        <TapeMeasure f={f} x={150} y={1400} len={tape} label="AREA" />
        <Nib f={f} x={lerp(300, 1040, easeIO(f, b(21) - 4, 40))} y={1440} s={0.36} emotion={f > b(21) ? 'surprised' : 'wonder'} stroke={f > b(21) && f < b(21) + 36 ? 1 : 0} tag={1} tick={1} label={false} cues={[b(19), b(20), b(21), b(22)]} seed={7} ink={0} />
        {seam > 0.01 && (
          <g>
            <rect x={-60} y={300} width={600} height={1220} fill={NB.vellum} opacity={seam} />
            <g opacity={seam}>{Array.from({length: 70}, (_, i) => <LakeChip key={i} x={30 + h01(170, i) * 470} y={560 + h01(171, i) * 700} r={7 + 5 * h01(172, i)} pop={1} seed={i} />)}</g>
            <path d={`M 540 ${300 - (1 - seam) * 1300} L 540 1520`} stroke={INK} strokeWidth={14} />
            <path d={`M 540 ${300 - (1 - seam) * 1300} L 540 1520`} stroke={NB.brassL} strokeWidth={6} />
            <NLab x={270} y={1300} text="WORLD · MORE LAKES" size={18} />
            <NLab x={810} y={1300} text="ALASKA · BIGGER LAKES" size={18} />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S9: ABOUT HALF
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const bar = ease(f, b(23) - 2, 16);
  const lit = easeIO(f, b(23) + 12, 14);
  const row = (i: number) => (f - b(24) - i * 2) / 10;
  return (
    <Frame p={p} z0={1.0} z1={1.05} overlay={<>
          <Plate x={540} text="ABOUT HALF THE WORLD'S ADDED AREA · OUR COUNT" displayLines={["ABOUT HALF THE WORLD'S", 'ADDED AREA · OUR COUNT']} y={540} size={30} tone="count" p={win(f, b(23) + 6, b(24))} />
          <Plate x={540} text="1,078 OF 13,685 · ABOUT 1 IN 13 · OUR COUNT" displayLines={['1,078 OF 13,685 · ABOUT 1 IN 13', 'OUR COUNT']} y={540} size={30} tone="count" p={win(f, b(24) + 4)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1280} seed={9} />
        <HeldTravel f={f} x={80} y={1000} w={920} h={140} mode="sweep" seed={91}>
          <g transform={`translate(${(1 - bar) * -1100} 0)`}>
            <ContactShadow cx={540} cy={1170} rx={480} ry={16} opacity={0.4} />
            <rect x={90} y={1010} width={900} height={130} rx={14} fill={NB.brass} stroke={INK} strokeWidth={6} />
            <rect x={110} y={1030} width={430} height={90} rx={8} fill={NB.lake} opacity={0.15 + 0.85 * lit} stroke={INK} strokeWidth={3} />
            <rect x={540} y={1030} width={430} height={90} rx={8} fill={NB.tile} stroke={INK} strokeWidth={3} />
            <text x={325} y={1088} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={INK}>ALASKA</text>
            <text x={755} y={1088} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={NB.vellumL}>REST OF WORLD</text>
            <path d="M 540 1000 L 540 1150" stroke={INK} strokeWidth={6} strokeDasharray="12 8" />
          </g>
        </HeldTravel>
        {Array.from({length: 13}, (_, i) => (
          <g key={i}>
            <LakeChip x={140 + i * 66} y={880} r={24} pop={row(i)} seed={200 + i} />
            {i === 6 && row(i) > 0.5 && <NLab x={140 + i * 66} y={820} text="ALASKA" size={16} fill={NB.lakeL} />}
          </g>
        ))}
        <Nib f={f} x={980} y={1240} s={0.5} emotion="curious" tag={1} tick={1} look={-0.7} cues={[b(23), b(24)]} seed={7} label={false} ink={0} />
      </SVG>
    </Frame>
  );
};

// ---- S10: TWO RINGS (signature)
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const crane = easeIO(f, 0, 30);
  const cx = 540, cy = 1040, r0x = 190, r0y = 120;
  const r1x = r0x * 1.23, r1y = r0y * 1.23;
  const draw = easeIO(f, b(26) - 6, 34);
  const th = draw * Math.PI * 2 - Math.PI / 2;
  const onRing = draw >= 1;
  const nx = onRing ? cx + r1x * 0.72 : cx + r1x * Math.cos(th);
  const ny = onRing ? cy + r1y * 0.75 : cy + r1y * Math.sin(th);
  const t0 = clamp01((f - b(26) - 40) / 8), t1 = clamp01((f - b(26) - 52) / 8);
  const handIn = easeIO(f, b(26) + 30, 10) * (1 - easeIO(f, b(26) + 66, 12));
  return (
    <Frame p={p} cam={(ff) => ({z: lerp(1.5, 1.0, crane), fx: 540, fy: 1000})} overlay={<>
          <Plate x={540} text="VITUS LAKE · BERING GLACIER · OUR COUNT" displayLines={['VITUS LAKE · BERING GLACIER', 'OUR COUNT']} y={520} size={30} tone="count" p={win(f, b(25) + 8, b(26))} />
          <Plate x={540} text="ABOUT 105 TO 158 SQ KM · OUR COUNT" displayLines={['ABOUT 105 TO 158 SQ KM', 'OUR COUNT']} y={520} size={32} tone="count" p={win(f, b(26) + 10)} />
        </>}>
      <SVG>
        <TableTop f={f} seed={10} />
        <HeldTravel f={f} x={60} y={460} w={960} h={900} mode="shadow" seed={101}>
          <g>
            <rect x={60} y={460} width={960} height={900} fill={NB.tile} stroke={INK} strokeWidth={5} />
            {Array.from({length: 22}, (_, i) => <path key={i} d={lakeBlob(80 + h01(110, i) * 920, 600 + h01(111, i) * 740, 40 + 40 * h01(112, i), 26 + 20 * h01(113, i), 300 + i, 8, 0.4)} fill={i % 2 ? NB.rock : NB.rockD} opacity={0.5} />)}
            {/* Bering Glacier's lobe from the top */}
            <path d={`M 60 460 L 1020 460 L 1020 840 C 860 ${cy - r1y - 40} 700 ${cy - r1y - 70} 540 ${cy - r1y - 60} C 380 ${cy - r1y - 70} 200 ${cy - r1y - 30} 60 860 Z`} fill={NB.ice} stroke={INK} strokeWidth={5} />
            {Array.from({length: 9}, (_, i) => <path key={`c${i}`} d={`M ${120 + i * 100} 500 q ${20 * Math.sin(i)} 160 ${10 * Math.cos(i)} ${240 + 30 * h01(114, i)}`} stroke={NB.iceD} strokeWidth={5} fill="none" />)}
            <LakeFill cx={cx} cy={cy} rx={r1x} ry={r1y} seed={42} f={f} />
            <LakeOutline cx={cx} cy={cy} rx={r0x} ry={r0y} seed={42} p={1} width={7} />
            <LakeOutline cx={cx} cy={cy} rx={r1x} ry={r1y} seed={42} p={draw} width={7} />
            <path d={lakeBlob(cx, cy, r1x, r1y, 42)} fill="none" stroke={NB.lakeL} strokeWidth={22} opacity={draw >= 1 ? 0.25 + 0.15 * Math.sin(f / 6) : 0} />
            <NLab x={cx - r0x + 70} y={cy} text="C. 2000" size={16} />
            {draw > 0.8 && <NLab x={cx + r1x - 30} y={cy - r1y - 18} text="C. 2020" size={16} />}
            <Tick x={cx - r0x + 160} y={cy - 30} p={t0} s={1.1} />
            <Tick x={cx + r1x - 40} y={cy + r1y - 30} p={t1} s={1.1} />
          </g>
        </HeldTravel>
        <Nib f={f} x={nx} y={ny} s={0.62} emotion={onRing ? 'wonder' : 'focused'} stroke={draw > 0 && draw < 1 ? 1 : 0} lookY={onRing ? 0.9 : 0} look={onRing ? -0.5 : 0} tag={1} tick={1} cues={[b(25), b(26)]} seed={7} ink={onRing ? 0 : 1} />
        {handIn > 0.01 && <CheckHand f={f} x={lerp(1150, cx + r1x - 20, handIn)} y={lerp(1500, cy + r1y - 10, handIn)} s={1.05} press={t1 > 0 && t1 < 1 ? 1 : 0} angle={-12} />}
      </SVG>
    </Frame>
  );
};

/** a glacier front seen from the ground: a scalloped ice wall with crevasses, ending in water or gravel */
const GlacierFront: React.FC<{f: number; x: number; y: number; w: number; lake: boolean; seed: number; drip?: number}> = ({f, x, y, w, lake, seed, drip = 0}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M ${-w / 2} 0 L ${-w / 2 + 20} -330 Q ${-w / 4} -380 0 -360 Q ${w / 4} -400 ${w / 2 - 10} -340 L ${w / 2} 0 Z`} fill={NB.ice} stroke={INK} strokeWidth={6} />
    {Array.from({length: 7}, (_, i) => <path key={i} d={`M ${-w / 2 + 40 + i * (w - 80) / 6} -330 l ${8 * Math.sin(i + seed)} 300`} stroke={NB.iceD} strokeWidth={5} />)}
    <path d={`M ${-w / 2 + 10} -60 Q 0 -20 ${w / 2 - 10} -60 L ${w / 2} 0 L ${-w / 2} 0 Z`} fill="#A9C4DA" opacity={0.7} />
    {lake ? (
      <g>
        <path d={`M ${-w / 2 - 40} 0 L ${w / 2 + 40} 0 L ${w / 2 + 60} 160 L ${-w / 2 - 60} 160 Z`} fill={NB.lake} stroke={INK} strokeWidth={5} />
        {Array.from({length: 4}, (_, i) => <path key={i} d={`M ${-w / 2 + i * w / 4} ${40 + 30 * ((f / 30 + i / 4) % 1)} q 30 -8 60 0`} stroke={NB.lakeL} strokeWidth={4} fill="none" />)}
        {drip > 0 && Array.from({length: 3}, (_, i) => <circle key={`d${i}`} cx={-w / 4 + i * w / 4} cy={-20 + ((f * 3 + i * 17) % 40)} r={5} fill={NB.lakeL} stroke={INK} strokeWidth={2} />)}
      </g>
    ) : (
      <g>
        <path d={`M ${-w / 2 - 40} 0 L ${w / 2 + 40} 0 L ${w / 2 + 60} 160 L ${-w / 2 - 60} 160 Z`} fill={NB.gravel} stroke={INK} strokeWidth={5} />
        {Array.from({length: 14}, (_, i) => <ellipse key={i} cx={-w / 2 + h01(seed, i) * w} cy={30 + h01(seed + 1, i) * 110} rx={8 + 8 * h01(seed + 2, i)} ry={5 + 4 * h01(seed + 3, i)} fill={i % 2 ? NB.gravelD : '#9A928A'} stroke={INK} strokeWidth={2} />)}
      </g>
    )}
  </g>
);

/** a glass water column on a stand: fill 0..1 of `max` cm, ticks every 10 cm, its label above */
const WaterTube: React.FC<{f: number; x: number; y: number; h: number; level: number; max?: number; label: string}> = ({f, x, y, h, level, max = 70, label}) => {
  const lv = clamp01(level);
  const fillH = (h * lv * (level > 0 ? 1 : 0));
  return (
    <g transform={`translate(${x} ${y})`}>
      <ContactShadow cx={0} cy={6} rx={90} ry={14} opacity={0.45} />
      <rect x={-80} y={-20} width={160} height={26} rx={6} fill={NB.brass} stroke={INK} strokeWidth={5} />
      <rect x={-46} y={-20 - h} width={92} height={h} rx={10} fill={NB.vellumL} opacity={0.35} stroke={INK} strokeWidth={5} />
      <rect x={-40} y={-20 - fillH} width={80} height={fillH} fill={NB.lake} />
      {fillH > 4 && <path d={`M -40 ${-20 - fillH} q 20 ${4 * Math.sin(f / 5)} 40 0 t 40 0`} stroke={NB.lakeL} strokeWidth={4} fill="none" />}
      {Array.from({length: Math.floor(max / 10) + 1}, (_, i) => <g key={i}><path d={`M 46 ${-20 - (h * i * 10) / max} l 14 0`} stroke={NB.vellumL} strokeWidth={3} /><text x={66} y={-14 - (h * i * 10) / max} fontFamily={MONO} fontWeight={800} fontSize={14} fill={NB.vellumL}>{i * 10}</text></g>)}
      <path d={`M -30 ${-10 - h} L -30 -40`} stroke="#FFFFFF" strokeWidth={5} opacity={0.5} />
      <NLab x={0} y={-56 - h} text={label} size={18} />
    </g>
  );
};

/** pre-dawn sky, far peaks and a moraine foreground */
const DawnWorld: React.FC<{f: number; seed?: number}> = ({f, seed = 1}) => (
  <g>
    <defs>
      <linearGradient id={`dw${seed}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#262B40" /><stop offset="0.6" stopColor={NB.sky} /><stop offset="1" stopColor={NB.skyL} /></linearGradient>
    </defs>
    <rect x={-60} y={-60} width={1200} height={1100} fill={`url(#dw${seed})`} />
    {Array.from({length: 9}, (_, i) => <circle key={i} cx={40 + h01(seed + 5, i) * 1000} cy={80 + h01(seed + 6, i) * 400} r={2} fill={NB.vellumL} opacity={0.4 + 0.4 * Math.sin(f / 19 + i)} />)}
    <path d="M -60 760 L 120 560 L 260 660 L 420 470 L 600 640 L 760 500 L 940 620 L 1140 520 L 1140 900 L -60 900 Z" fill={NB.peak} stroke={INK} strokeWidth={5} />
    <path d="M 400 490 L 420 470 L 450 500 M 740 520 L 760 500 L 790 530" stroke={NB.ice} strokeWidth={8} fill="none" />
    <path d="M -60 840 L 1140 820 L 1140 1000 L -60 1000 Z" fill="#6E7898" />
  </g>
);

// ---- S11: THE CASE FOR YES
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rise = ease(f, b(27) - 2, 22);
  const l66 = lin(f, b(28) - 4, 30) * (66 / 70);
  const l40 = lin(f, b(29) - 2, 24) * (40 / 70);
  return (
    <Frame p={p} bg="#262B40" z0={1.0} z1={1.05} overlay={<>
          <Plate x={540} text="THE CASE FOR YES" y={500} size={40} tone="ultra" p={win(f, b(27) + 4)} />
          <Plate x={300} text="LAKE-ENDING · 66 CM A YEAR · ON AVERAGE" displayLines={['LAKE-ENDING · 66 CM', 'A YEAR · ON AVERAGE']} y={620} size={24} p={win(f, b(28) + 10)} />
          <Plate x={790} text="ON LAND · 40 CM A YEAR" displayLines={['ON LAND · 40 CM', 'A YEAR']} y={740} size={24} p={win(f, b(29) + 6)} />
        </>}>
      <SVG>
        <DawnWorld f={f} seed={11} />
        <g transform={`translate(0 ${(1 - rise) * 500})`}>
          <GlacierFront f={f} x={290} y={1000} w={480} lake seed={3} drip={1} />
          <GlacierFront f={f} x={800} y={1000} w={440} lake={false} seed={9} />
        </g>
        <path d="M 540 860 L 540 1520" stroke={INK} strokeWidth={10} />
        <rect x={-60} y={1160} width={1200} height={820} fill={NB.gravelD} data-band="ok" />
        {Array.from({length: 30}, (_, i) => <ellipse key={i} cx={h01(115, i) * 1100} cy={1180 + h01(116, i) * 700} rx={14 + 16 * h01(117, i)} ry={8 + 8 * h01(118, i)} fill={i % 2 ? NB.gravel : '#9A928A'} stroke={INK} strokeWidth={2.5} data-band="ok" />)}
        <HeldTravel f={f} x={180} y={760} w={720} h={500} mode="sweep" seed={111}>
          <g>
            <WaterTube f={f} x={290} y={1300} h={420} level={l66} label="LAKE-ENDING" />
            <WaterTube f={f} x={790} y={1300} h={420} level={l40} label="ON LAND" />
          </g>
        </HeldTravel>
      </SVG>
    </Frame>
  );
};

// ---- S12: FURTHER ACCELERATES
const QROWS = ['"CONTACT WITH A LAKE', 'FURTHER ACCELERATES', 'THE LOSS OF ICE"'];
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const dart = ease(f, b(30) - 4, 10);
  const typ = lin(f, b(31) - 30, 46);
  const rowsShown = Math.min(QROWS.length, Math.ceil(typ * QROWS.length));
  return (
    <Frame p={p} bg="#262B40" z0={1.04} z1={1.0} overlay={<>
          <Plate x={540} text="TOBIAS BOLCH · CO-AUTHOR · TU GRAZ" y={500} size={28} p={win(f, b(30) + 6, b(31) - 26)} />
          <Plate x={540} text={'"CONTACT WITH A LAKE FURTHER ACCELERATES THE LOSS OF ICE" · TOBIAS BOLCH · PER TU GRAZ'} displayLines={['TOBIAS BOLCH · PER TU GRAZ']} y={500} size={26} tone="dark" p={win(f, b(31) + 8)} />
        </>}>
      <SVG>
        <DawnWorld f={f} seed={12} />
        <GlacierFront f={f} x={300} y={1080} w={700} lake seed={5} drip={1} />
        <rect x={-60} y={1240} width={1200} height={740} fill={NB.gravelD} data-band="ok" />
        {Array.from({length: 26}, (_, i) => <ellipse key={i} cx={h01(125, i) * 1100} cy={1260 + h01(126, i) * 640} rx={14 + 18 * h01(127, i)} ry={8 + 9 * h01(128, i)} fill={i % 2 ? NB.gravel : '#9A928A'} stroke={INK} strokeWidth={2.5} data-band="ok" />)}
        {/* the name card and quote card on one stake, driven into the gravel */}
        <HeldProp f={f} px={760} py={1250} w={420} h={620} kind="rest" seed={121}>
          <g transform={`translate(760 ${1250 - (1 - dart) * 700}) rotate(${(1 - dart) * 20})`}>
            {dart >= 1 && <ContactShadow cx={0} cy={4} rx={40} ry={8} opacity={0.45} />}
            {dart >= 1 && f < b(30) + 14 && Array.from({length: 6}, (_, i) => <circle key={i} cx={Math.cos(i) * 40 * (f - b(30)) / 14} cy={-10 - 20 * Math.sin(i * 2) * (f - b(30)) / 14} r={6} fill={NB.gravel} stroke={INK} strokeWidth={2} />)}
            <rect x={-8} y={-560} width={16} height={562} fill={NB.oakD} stroke={INK} strokeWidth={4} />
            <rect x={-200} y={-590} width={400} height={60} rx={6} fill={NB.vellumL} stroke={INK} strokeWidth={4} />
            <text x={0} y={-552} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK}>TOBIAS BOLCH · TU GRAZ</text>
            {typ > 0 && (
              <g>
                <rect x={-200} y={-500} width={400} height={170} rx={6} fill={NB.vellumL} stroke={INK} strokeWidth={4} />
                {QROWS.slice(0, rowsShown).map((r, i) => {
                  const rk = clamp01(typ * QROWS.length - i);
                  const ws = r.split(' ');
                  const text = rk >= 1 ? r : ws.slice(0, Math.max(1, Math.round(ws.length * rk))).join(' ');
                  return <text key={i} x={-182} y={-456 + i * 46} fontFamily={MONO} fontWeight={900} fontSize={21} fill={INK}>{text}</text>;
                })}
              </g>
            )}
          </g>
        </HeldProp>
        <g transform={`translate(160 1300)`}>
          <WaterTube f={f} x={0} y={0} h={300} level={(0.9 + 0.04 * Math.sin(f / 20)) * (66 / 70)} label="LAKE-ENDING" />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S13: THE WEIGH-IN
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lower = ease(f, b(32) - 4, 26);
  const K = 6.2;
  const land = (bb: number) => clamp01((f - bb + 14) / 14);
  const ext = (bb: number, share: number) => (land(bb) >= 1 ? share * K * spring(clamp01((f - bb) / 18)) : 0);
  const nod = f >= b(36) && f < b(36) + 20 ? Math.sin(((f - b(36)) / 20) * Math.PI * 2) * 6 : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.04} overlay={<>
          <Plate x={540} text="MACHINE LEARNING · WEIGHS THE FACTORS" displayLines={['MACHINE LEARNING', 'WEIGHS THE FACTORS']} y={520} size={30} tone="dark" p={win(f, b(32) + 6, b(33) - 4)} />
          <Plate x={240} text="LAKE ~11% · LAKE-ENDING GLACIERS · WORLDWIDE" displayLines={['LAKE ~11%', 'LAKE-ENDING GLACIERS', 'WORLDWIDE']} y={1180} size={22} p={win(f, b(33) + 4)} />
          <Plate x={540} text="CLIMATE ~43%" y={1240} size={22} p={win(f, b(34) + 4)} />
          <Plate x={840} text="GLACIER SHAPE ~46%" y={1240} size={22} p={win(f, b(35) + 4)} />
          <Plate x={540} text="A REAL PUSH · THE SMALLEST OF THE THREE" displayLines={['A REAL PUSH', 'THE SMALLEST OF THE THREE']} y={520} size={30} tone="ultra" p={win(f, b(36) + 2)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1300} lamp={false} seed={13} />
        <g transform={`translate(0 ${(1 - lower) * -900})`}>
          <WeighRail f={f} x={540} y={1260} w={900} railY={-640}>
            <SpringScale f={f} x={-300} y={0} ext={ext(b(33), 11)} weightW={70} label="LAKE" land={land(b(33))} seed={1} />
            <SpringScale f={f} x={0} y={0} ext={ext(b(34), 43)} weightW={130} label="CLIMATE" land={land(b(34))} seed={2} />
            <SpringScale f={f} x={300} y={0} ext={ext(b(35), 46)} weightW={136} label="SHAPE" land={land(b(35))} seed={3} />
          </WeighRail>
        </g>
        <g transform={`rotate(${nod} 120 1260)`}>
          <Nib f={f} x={120} y={1260} s={0.52} emotion={f >= b(36) ? 'curious' : 'calm'} look={f >= b(36) ? 0.9 : 0.6} lookY={f >= b(36) ? 0.2 : -0.5} tag={1} tick={1} label={false} cues={[b(32), b(33), b(36)]} seed={7} ink={0} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S14: THE EMPTY PAN
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const fly = easeIO(f, b(37) + 2, 30);
  const hang = f >= b(37) + 32;
  const sx = 860, sy = 640;
  return (
    <Frame p={p} cam={(ff) => ({z: 1.25, fx: lerp(620, 700, easeIO(ff, 0, p.dur)), fy: 900})} overlay={<>
          <Plate x={540} text="ALASKA'S SPLIT · NOT IN THE RELEASE OR ABSTRACT" displayLines={["ALASKA'S SPLIT", 'NOT IN THE RELEASE OR ABSTRACT']} y={520} size={28} tone="count" p={win(f, b(37) + 8)} />
          <Plate x={540} text="COULD BE BIGGER · OR SMALLER" y={680} size={28} tone="dark" p={win(f, b(38) + 4)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1300} lamp={false} seed={14} />
        <WeighRail f={f} x={540} y={1260} w={900} railY={-640}>
          <SpringScale f={f} x={-300} y={0} ext={11 * 6.2} weightW={70} label="LAKE" seed={1} />
          <SpringScale f={f} x={0} y={0} ext={43 * 6.2} weightW={130} label="CLIMATE" seed={2} />
          <SpringScale f={f} x={300} y={0} ext={46 * 6.2} weightW={136} label="SHAPE" seed={3} />
        </WeighRail>
        <ReleaseCard f={f} x={330} y={1180} s={0.42} rows={1} howMany={1} whyGone={fly > 0 ? 1 : 0} />
        {!hang && fly > 0 && (
          <g transform={`translate(${lerp(400, sx, fly)} ${lerp(1222, sy + 140, fly) - 160 * Math.sin(fly * Math.PI)}) rotate(${(1 - fly) * 20})`}>
            <rect x={-90} y={-22} width={180} height={44} rx={6} fill={NB.vellum} stroke={INK} strokeWidth={4} strokeDasharray="10 8" />
            <text x={-74} y={8} fontFamily={MONO} fontWeight={900} fontSize={20} fill={INK}>WHY</text>
          </g>
        )}
        {hang && (
          <g>
            <rect x={sx - 18} y={sy - 40} width={36} height={18} fill={NB.brass} stroke={INK} strokeWidth={4} />
            <SpringScale f={f} x={sx} y={sy} ext={0} empty swing={1} seed={4} />
            <NLab x={sx} y={sy + 220} text="WHY · ALASKA" size={16} />
          </g>
        )}
        <Nib f={f} x={140} y={1260} s={0.5} emotion="curious" look={0.9} lookY={-0.7} lean={f >= b(38) ? -8 : 0} tag={1} tick={1} label={false} cues={[b(37), b(38)]} seed={7} ink={0} />
      </SVG>
    </Frame>
  );
};

// ---- S15: WHO TRACES THE NEXT ONE
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const run = easeIO(f, b(39) - 4, 36);
  const edge = 880;
  const nx = lerp(420, edge + 40, run);
  const slideP = easeIO(f, b(40) + 2, 26);
  return (
    <Frame p={p} z0={1.0} z1={1.06} overlay={<>
          <Plate x={540} text="THE MAP ENDS · CIRCA 2020" y={520} size={32} tone="dark" p={win(f, b(39) + 10, b(40))} />
          <Plate x={540} text="WHO TRACES THE NEXT ONE?" y={520} size={36} tone="ultra" p={win(f, b(40) + 4)} />
        </>}>
      <SVG>
        <TableTop f={f} seed={15} />
        <HeldTravel f={f} x={60} y={520} w={edge - 60} h={760} mode="shadow" seed={151}>
          <g>
            <rect x={60} y={500} width={edge - 60} height={800} fill={NB.vellumL} opacity={0.6} stroke={NB.vellumD} strokeWidth={3} />
            <g transform="translate(-40 40) scale(0.86)"><AkVellum f={f} swell={1} /></g>
          </g>
        </HeldTravel>
        <path d={`M ${edge} 480 L ${edge} 1320`} stroke={INK} strokeWidth={6} strokeDasharray="18 10" />
        <g transform={`translate(${edge + 22} 900) rotate(90)`}><text x={0} y={0} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={INK}>THE MAP ENDS · CIRCA 2020</text></g>
        {/* the throughline strip clipped at the edge: three weights and an empty slot */}
        <g transform={`translate(${edge - 120} 470)`}>
          <rect x={-110} y={-26} width={220} height={52} rx={6} fill={NB.vellumL} stroke={INK} strokeWidth={3} />
          {[0, 1, 2].map((i) => <BrassWeight key={i} x={-80 + i * 52} y={16} w={[22, 40, 42][i]} />)}
          <rect x={64} y={-16} width={34} height={34} rx={4} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="5 4" />
        </g>
        <path d={`M 420 980 L ${Math.min(edge, nx)} 980`} stroke={NB.ultra} strokeWidth={6} strokeLinecap="round" />
        <Nib f={f} x={nx} y={980} s={0.6} emotion={run >= 1 ? 'curious' : 'focused'} stroke={run > 0 && run < 1 ? 1 : 0} splay={run >= 1 ? 0.5 : 0} look={run >= 1 ? 0.3 : 0} lookY={run >= 1 ? 0.8 : 0} tag={1} tick={1} cues={[b(39), b(40)]} seed={7} ink={run >= 1 ? 0 : 1} />
        {f >= b(40) - 10 && <CheckHand f={f} x={lerp(1150, 980, easeIO(f, b(40) - 10, 12))} y={lerp(1420, 1120, easeIO(f, b(40) - 10, 12)) + slideP * 240} s={1.1} angle={-40 + 50 * slideP} />}
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

export const ep1128Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1128Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1128: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 7, 14, 22, 27, 33, 40, 46, 52, 66, 74, 82, 92, 100, 110, 118].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: NB.room}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar={NB.roomL} ink={NB.vellumL} /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
