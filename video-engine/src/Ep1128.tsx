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

// The Map Swelled, 2026-11-28. Palette roles are art_direction.json: a warm umber den lit from below by amber-cream vellum and a
// lamp; ULTRAMARINE is the machine's line (and only the machine's own plates), PERSIMMON the study's checker's pencil in hairlines,
// PINE is OUR COUNT in stamps, slips, tabs and type, NICKEL the scales, weights and steel tape, lakes rock-flour turquoise, and
// outdoors a lavender-to-rose first light. Nib never touches Bolch's material or the scale; the scale has no face. Every Alaska
// number is OUR COUNT. No hazard or flood picture anywhere.
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
      <rect data-band="ok" x={-60} y={-60} width={1200} height={2040} fill={NB.oakD} />
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
            {[0, 1, 2].map((i) => <g key={i} transform={`translate(0 ${12 + i * 16}) rotate(${-2 + i * 2})`}><rect x={0} y={0} width={200} height={12} fill={i === 1 ? NB.inkL : '#C9A76A'} stroke={INK} strokeWidth={2.5} /><path d="M 200 0 L 214 6 L 200 12 Z" fill="#E7C9A0" stroke={INK} strokeWidth={2} /></g>)}
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
            <rect x={-50} y={-20} width={100} height={40} rx={8} fill="#CDBFA3" stroke={INK} strokeWidth={4} />
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
    <rect data-band="ok" x={-60} y={-60} width={1200} height={2040} fill={NB.room} />
    <rect x={-60} y={-60} width={1200} height={tableY - 200} fill={NB.roomL} opacity={0.55} />
    {/* window onto the range at first light */}
    <g transform="translate(700 470)">
      <defs><linearGradient id={`win${seed}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={NB.sky} /><stop offset="1" stopColor={NB.skyL} /></linearGradient></defs>
      <rect x={0} y={0} width={300} height={260} fill={`url(#win${seed})`} stroke={INK} strokeWidth={6} />
      <path d="M 0 200 L 60 130 L 110 170 L 170 90 L 230 160 L 300 120 L 300 260 L 0 260 Z" fill={NB.peak} stroke={INK} strokeWidth={3} />
      <path d="M 150 110 L 170 90 L 190 112" stroke={NB.iceRim} strokeWidth={5} fill="none" />
      {Array.from({length: 2}, (_, i) => <circle key={i} cx={40 + h01(seed, i) * 220} cy={20 + h01(seed + 1, i) * 40} r={2} fill={NB.vellumL} opacity={0.3 + 0.2 * Math.sin(f / 17 + i)} />)}
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

// ---- S1: THE TRACE (then the view lifts into the tile strip: one world arc)
const S1: React.FC<SceneProps> = ({p}) => (p.f < p.b(4) ? <S1a p={p} /> : <S2 p={p} />);
const S1a: React.FC<SceneProps> = ({p}) => {
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
    nx = lerp(lb.cx + lb.rx, Bt.x + Bt.w - 110, run);
    ny = lerp(lb.cy, lb.cy - 20, run);
  }
  const lineEnd = Math.min(Bt.x + Bt.w, nx);
  return (
    <Frame p={p} z0={1.06} z1={1.0} overlay={<>
          <Plate x={540} text="A MACHINE · DEEP LEARNING" y={530} size={30} tone="ultra" p={win(f, 8, b(2))} />
          <Plate x={540} text="TRACED ON SATELLITE TILES" y={604} size={30} p={win(f, b(2) + 2, b(3))} />
          <Plate x={540} text="CIRCA 2000 · CIRCA 2020" y={678} size={30} tone="dark" p={win(f, b(3) + 4)} />
        </>}>
      <SVG>
        <TableTop f={f} glow={glow} seed={1} />
        <HeldTravel f={f} x={A.x} y={A.y} w={A.w} h={A.h} mode="sweep" seed={11}>
          <LandsatTile f={f} {...A} seed={3} trace={tr} glow={glow * 0.35} date="CIRCA 2000" lakeR={0.26} />
        </HeldTravel>
        {slideB > 0.01 && (
          <g transform={`translate(${(1 - slideB) * 620} 0)`}>
            <LandsatTile f={f} {...Bt} seed={8} trace={run > 0 ? 1 : 0} glow={0.35} date="CIRCA 2020" lakeR={0.24} />
            {run > 0 && <path d={`M ${lb.cx + lb.rx} ${lb.cy} L ${lineEnd} ${lerp(lb.cy, lb.cy - 20, clamp01((lineEnd - lb.cx - lb.rx) / Math.max(1, Bt.x + Bt.w - 110 - lb.cx - lb.rx)))}`} stroke={NB.ultra} strokeWidth={6} strokeLinecap="round" />}
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

// ---- S2: TILE TO TILE (CIRCA 2020 adds NEW small outlines between the old ones; old outlines unchanged)
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tw = 360, gap = 30;
  const scroll = f * 5.2;
  const flip = f >= b(5);
  const tiles = Array.from({length: 7}, (_, i) => i);
  return (
    <Frame p={p} warmth={0.05} cam={(ff) => ({z: lerp(1.45, 1.0, easeIO(ff, b(4), 22)), fx: 540, fy: lerp(980, 920, easeIO(ff, b(4), 22))})} overlay={<>
          <Plate x={540} text="LANDSAT IMAGES" y={530} size={32} p={win(f, b(4) + 4, b(41))} />
          <Plate x={540} text="CIRCA 2000" y={606} size={32} tone="dark" p={win(f, b(41) + 2, b(5))} />
          <Plate x={540} text="CIRCA 2000 AND 2020" y={682} size={34} tone="ultra" p={win(f, b(5) + 2)} />
        </>}>
      <SVG>
        <TableTop f={f} seed={2} />
        <HeldTravel f={f} x={0} y={700} w={1080} h={420} mode="shadow" seed={21}>
          <g>
            {tiles.map((i) => {
              const x = 600 + i * (tw + gap) - scroll;
              const dist = (540 - (x + tw / 2)) / (tw + gap);
              const trace = clamp01(dist + 0.6);
              return (
                <g key={i}>
                  <LandsatTile f={f} x={x} y={720} w={tw} h={380} seed={20 + i} trace={trace} date={x > 10 && x + tw < 1070 ? (flip ? 'CIRCA 2020' : 'CIRCA 2000') : undefined} lakeR={0.2} />
                  {flip && [0, 1].map((k) => {
                    const cx = x + tw * (0.22 + 0.55 * k), cy = 720 + 380 * (0.78 - 0.08 * k);
                    const pk = clamp01((f - b(5) - 4 - k * 5 - i * 2) / 8);
                    return pk > 0 ? <g key={k}><LakeFill cx={cx} cy={cy} rx={20 * spring(pk)} ry={14 * spring(pk)} seed={400 + i * 2 + k} /><LakeOutline cx={cx} cy={cy} rx={20} ry={14} seed={400 + i * 2 + k} p={pk} width={3.5} /></g> : null;
                  })}
                </g>
              );
            })}
          </g>
        </HeldTravel>
        <Nib f={f} x={540 + 30 * Math.sin(f / 7)} y={930 + 30 * Math.cos(f / 7)} s={0.6} emotion={flip ? 'curious' : 'proud'} stroke={1} cues={[b(4), b(41), b(5)]} seed={7} />
        <g transform="translate(540 1250)">
          <ContactShadow cx={0} cy={30} rx={300} ry={12} opacity={0.3} />
          {['2000', '2020'].map((y, i) => (
            <g key={y} transform={`translate(${-150 + i * 300} 0)`}>
              <rect x={-90} y={-30} width={180} height={60} rx={8} fill={NB.roomL} stroke={(flip ? i === 1 : i === 0) ? NB.ultra : INK} strokeWidth={(flip ? i === 1 : i === 0) ? 8 : 4} />
              <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} fill={NB.vellumL}>{`C. ${y}`}</text>
            </g>
          ))}
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S3: CHECKED BY HAND (the study's checker; eye level across the table, the surface in perspective)
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
    hx = lerp(tp[2][0] + 20, tp[2][0] + 76, k);
    hy = lerp(tp[2][1] + 10, tp[2][1] - 4, k);
  }
  const card = ease(f, b(8), 18);
  if (f >= b(8) - 12) {
    const k = easeIO(f, b(8) - 12, 12);
    hx = lerp(tp[2][0] + 76, lerp(-200, 740, card) + 120, k);
    hy = lerp(tp[2][1] - 4, 1150, k);
  }
  const away = easeIO(f, b(8) + 22, 14);
  hx = lerp(hx, 1100, away);
  hy = lerp(hy, 1600, away);
  return (
    <Frame p={p} z0={1.0} z1={1.05} warmth={0.05} overlay={<>
          <Plate x={540} text="CHECKED BY HAND · PER TU GRAZ" y={530} size={30} tone="plate" p={win(f, b(6) + 4, b(7))} />
          <Plate x={540} text="MANUAL REFINEMENT · PER THE PAPER" y={604} size={30} tone="plate" p={win(f, b(7) + 2, b(8))} />
          <Plate x={540} text="NATURE CLIMATE CHANGE · NOVEMBER 20TH" displayLines={['NATURE CLIMATE CHANGE', 'NOVEMBER 20TH']} y={678} size={30} tone="dark" p={win(f, b(8) + 6)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1240} seed={3} />
        <g>
          <path d="M 40 1200 L 140 900 L 940 900 L 1040 1200 Z" fill={NB.vellum} stroke={INK} strokeWidth={5} />
          <path d="M 40 1200 L 140 900 L 940 900 L 1040 1200 Z" fill={NB.glow} opacity={0.25} />
          {[0, 1, 2].map((i) => {
            const cx = tp[i][0], cy = tp[i][1];
            const g = i === 2 ? 1 + 0.12 * nudge : 1;
            return (
              <g key={i}>
                <path d={`M ${cx - 110} ${cy + 60} L ${cx - 90} ${cy - 50} L ${cx + 90} ${cy - 50} L ${cx + 110} ${cy + 60} Z`} fill={NB.tile} stroke={INK} strokeWidth={3} />
                <g transform={`translate(${cx} ${cy}) scale(1 0.5)`}>
                  <LakeFill cx={0} cy={0} rx={60 * g} ry={50 * g} seed={30 + i} />
                  <LakeOutline cx={0} cy={0} rx={60 * g} ry={50 * g} seed={30 + i} p={1} width={6} />
                </g>
                <Tick x={cx + 64} y={cy - 26} p={hk(i)} s={1.1} />
              </g>
            );
          })}
          {card > 0.01 && (
            <g transform={`translate(${lerp(-200, 740, card)} 1130) skewX(-12)`}>
              <rect x={-120} y={-40} width={240} height={70} fill={NB.vellumL} stroke={INK} strokeWidth={4} opacity={0.9} />
              <text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>NATURE CLIMATE</text>
              <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>CHANGE</text>
            </g>
          )}
        </g>
        <HeldProp f={f} px={560} py={1080} w={220} h={360} kind="rest" seed={31}>
          <Nib f={f} x={560} y={1080} s={0.78} emotion={f > b(6) ? 'curious' : 'calm'} look={f > b(6) && f < b(7) - 10 ? -0.8 : 0.9} lookY={f > b(7) - 10 && f < b(8) ? 0.5 : 0}
            splay={f > b(7) - 2 && f < b(7) + 4 ? 0.8 : 0} cues={[b(6), b(7), b(8)]} seed={7} ink={0} label={false} />
        </HeldProp>
        <CheckHand f={f} x={hx} y={hy} s={1.15} press={press} angle={-10} role="study" />
      </SVG>
    </Frame>
  );
};

/** pre-dawn sky, first light breaking behind the far peaks from frame left */
const DawnWorld: React.FC<{f: number; seed?: number}> = ({f, seed = 1}) => (
  <g>
    <defs>
      <linearGradient id={`dw${seed}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4A4664" /><stop offset="0.6" stopColor="#5E5A78" /><stop offset="1" stopColor="#E9B49A" /></linearGradient>
      <radialGradient id={`ds${seed}`} cx="0.15" cy="0.62" r="0.5"><stop offset="0" stopColor="#F2B8C0" stopOpacity={0.85} /><stop offset="1" stopColor="#F2B8C0" stopOpacity={0} /></radialGradient>
    </defs>
    <rect x={-60} y={-60} width={1200} height={1100} fill={`url(#dw${seed})`} />
    <rect x={-60} y={-60} width={1200} height={1100} fill={`url(#ds${seed})`} opacity={0.85 + 0.1 * Math.sin(f / 40)} />
    {Array.from({length: 9}, (_, i) => <circle key={i} cx={300 + h01(seed + 5, i) * 760} cy={80 + h01(seed + 6, i) * 360} r={2} fill={NB.vellumL} opacity={0.3 + 0.3 * Math.sin(f / 19 + i)} />)}
    <path d="M -60 760 L 120 560 L 260 660 L 420 470 L 600 640 L 760 500 L 940 620 L 1140 520 L 1140 900 L -60 900 Z" fill={NB.peak} stroke={INK} strokeWidth={5} />
    <path d="M 120 560 L 260 660 M 400 490 L 420 470 L 450 500 M 740 520 L 760 500 L 790 530" stroke="#F6C6C6" strokeWidth={6} fill="none" opacity={0.8} />
    <path d="M -60 840 L 1140 820 L 1140 1000 L -60 1000 Z" fill="#76739A" />
  </g>
);

// ---- S4: THE QUESTION (a real lake at a real ice front, first light)
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const wl = 1080;
  const rip = clamp01((f - b(10) + 18) / 26);
  const slap = f >= b(10) && f < b(10) + 16 ? (f - b(10)) / 16 : 0;
  return (
    <Frame p={p} bg="#4A4664" cam={(ff) => ({z: lerp(1.0, 1.08, easeIO(ff, 0, p.dur)), fx: 540, fy: lerp(1060, 1000, easeIO(ff, 0, p.dur))})} overlay={<>
          <Plate x={540} text="DOES A LAKE EAT ITS GLACIER? · BY HOW MUCH?" displayLines={['DOES A LAKE EAT', 'ITS GLACIER? · BY HOW MUCH?']} y={540} size={34} tone="dark" p={win(f, b(9) + 2)} />
          <Plate x={540} text="THE QUESTION" y={668} size={26} tone="dark" p={win(f, b(10) + 2)} />
        </>}>
      <SVG>
        <DawnWorld f={f} seed={4} />
        {/* the ice front, ground level */}
        <path d={`M -60 ${wl} L -60 760 Q 120 700 300 730 Q 520 690 700 720 Q 900 700 1140 740 L 1140 ${wl} Z`} fill={NB.ice} stroke={INK} strokeWidth={6} />
        {Array.from({length: 11}, (_, i) => <path key={i} d={`M ${20 + i * 100} 730 l ${10 * Math.sin(i)} ${300 + 30 * h01(4, i)}`} stroke={NB.iceD} strokeWidth={6} />)}
        <path d={`M -60 760 Q 120 700 300 730 Q 520 690 700 720 Q 900 700 1140 740`} stroke="#F6C6C6" strokeWidth={6} fill="none" opacity={0.7} />
        {Array.from({length: 6}, (_, i) => <path key={`s${i}`} d={`M ${60 + i * 180} ${wl - 220} l 30 200 l -40 0 Z`} fill="#B8B6D4" opacity={0.55} />)}
        {/* the lake */}
        <rect data-band="ok" x={-60} y={wl} width={1200} height={900} fill={NB.lake} />
        <path d={`M -60 ${wl} L 1140 ${wl}`} stroke={INK} strokeWidth={6} />
        <rect data-band="ok" x={-60} y={wl + 220} width={1200} height={680} fill={NB.lakeD} opacity={0.35} />
        {Array.from({length: 8}, (_, i) => {
          const ph = ((f / 50 + i / 8) % 1);
          return <path key={i} d={`M ${60 + i * 130} ${wl + 30 + ph * 380} q 40 -10 80 0`} stroke={NB.lakeL} strokeWidth={5} fill="none" opacity={1 - ph} data-band="ok" />;
        })}
        {rip > 0 && rip < 1 && <path d={`M ${200 + 600 * rip - 220} ${wl + 300 - 280 * rip} q 220 -40 440 0`} stroke={NB.lakeL} strokeWidth={9} fill="none" />}
        {slap > 0 && Array.from({length: 7}, (_, i) => <circle key={i} cx={480 + i * 30 + 10 * Math.sin(i)} cy={wl - 10 - 70 * Math.sin(slap * Math.PI) * (0.5 + 0.5 * h01(9, i))} r={7} fill={NB.lakeL} stroke={INK} strokeWidth={2} />)}
        <HeldTravel f={f} x={0} y={700} w={1080} h={380} mode="shadow" seed={41}>
          <path d={`M -60 ${wl} L -60 760 Q 120 700 300 730 Q 520 690 700 720 Q 900 700 1140 740 L 1140 ${wl} Z`} fill={NB.ice} opacity={0.01} />
        </HeldTravel>
        <g transform={`translate(${780 + (f > b(9) ? -1 : 0) * Math.min(260, (f - b(9)) * 6)} ${760 - (f > b(9) ? Math.min(200, (f - b(9)) * 5) : 0)}) scale(1 ${f > b(9) ? 1 - 0.5 * Math.abs(Math.sin(f / 3)) : 1})`}>
          <path d="M -24 0 Q -12 -14 0 -2 Q 12 -14 24 0" stroke={INK} strokeWidth={5} fill="none" />
        </g>
        {/* near moraine stones on the shore under the caption card */}
        <g data-band="ok">{Array.from({length: 14}, (_, i) => <ellipse key={i} cx={h01(44, i) * 1100} cy={1560 + h01(45, i) * 340} rx={30 + 30 * h01(46, i)} ry={16 + 10 * h01(47, i)} fill={i % 2 ? NB.gravel : '#9A928A'} stroke={INK} strokeWidth={3} />)}</g>
      </SVG>
    </Frame>
  );
};

// ---- S5: THE WORLD MULTIPLIED (a world sheet pinned on the wall)
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pull = easeIO(f, 0, 30);
  const OLD = 100, NEW = 35;
  const popT = (i: number) => b(11) + Math.pow(i / NEW, 0.7) * Math.max(30, b(42) - b(11) + 20);
  const roll = clamp01(lin(f, b(42) - 4, 24));
  const tape = 270 * (9 / 35) * 1.0 * clamp01(lin(f, b(13), 24));
  return (
    <Frame p={p} warmth={0.05} cam={(ff) => ({z: lerp(1.4, 1.0, pull), fx: 540, fy: 900})} overlay={<>
          <Plate x={540} text="WORLD · ICE-CONTACT LAKES" y={530} size={32} tone="plate" p={win(f, b(11) + 4, b(42) + 10)} />
          <Plate x={540} text="WORLD · +3,567 LAKES" y={606} size={34} tone="plate" p={win(f, b(42) + 12, b(50))} />
          <Plate x={540} text="WORLD · +35% LAKES" y={684} size={34} tone="plate" p={win(f, b(50) + 2, b(13))} />
          <Plate x={540} text="WORLD · AREA +9%" y={762} size={34} tone="plate" p={win(f, b(13) + 4)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1420} lamp={false} seed={5} />
        {/* the world sheet pinned on the wall */}
        <g>
          <rect x={64} y={600} width={952} height={640} fill="#000" opacity={0.3} transform="translate(10 12)" />
          <rect x={64} y={600} width={952} height={640} fill={NB.vellum} stroke={INK} strokeWidth={6} />
          {[[90, 610], [990, 610], [90, 1230], [990, 1230]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill={NB.oakD} stroke={INK} strokeWidth={3} />)}
          {Array.from({length: OLD}, (_, i) => <path key={i} d={lakeBlob(110 + (i % 14) * 62 + 14 * h01(80, i), 690 + Math.floor(i / 14) * 70 + 14 * h01(81, i), 10, 7, 500 + i, 8, 0.35)} fill={NB.lakeD} stroke={INK} strokeWidth={2} opacity={0.75} />)}
          {Array.from({length: NEW}, (_, i) => <LakeChip key={`n${i}`} x={130 + h01(82, i) * 820} y={700 + h01(83, i) * 440} r={9 + 5 * h01(84, i)} pop={(f - popT(i)) / 9} seed={i} />)}
        </g>
        <HeldTravel f={f} x={64} y={600} w={952} h={640} mode="shadow" seed={51}><rect x={64} y={600} width={952} height={640} fill={NB.vellum} opacity={0.01} /></HeldTravel>
        {/* the shelf with the oak counter and the tape */}
        <rect x={-60} y={1290} width={1200} height={22} fill={NB.oak} stroke={INK} strokeWidth={4} />
        {f >= b(42) - 4 && (() => {
          const txt = '+3,567';
          const n = Math.max(0, Math.min(txt.length, Math.ceil(roll * txt.length)));
          return <g transform="translate(860 1205) rotate(-4)" opacity={1 - 0.7 * ease(f, b(13), 12)}><text x={0} y={0} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={46} fill={INK}>{txt.slice(0, n)}</text>{roll >= 1 && <path d="M -90 14 q 90 10 180 0" stroke={INK} strokeWidth={4} fill="none" />}</g>;
        })()}
        {f >= b(50) - 2 && <g transform={`translate(860 1110) scale(${spring(clamp01((f - b(50) + 2) / 12))})`} opacity={1 - 0.7 * ease(f, b(13), 12)}><rect x={-120} y={-32} width={240} height={58} rx={6} fill={NB.vellumL} stroke={INK} strokeWidth={4} /><text x={0} y={11} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={INK}>LAKES +35%</text></g>}
        <TapeMeasure f={f} x={160} y={1260} len={tape} label={f >= b(13) ? 'AREA' : undefined} marks={[{at: 270 * (9 / 35), label: '9%'}]} />
      </SVG>
    </Frame>
  );
};

/** the study's press release card. tabs 0..1 snaps two empty pine tabs (OUR marks) onto its right edge; slip shows our count clipped BESIDE the HOW MANY? tab; whyGone lifts the WHY? tab away. */
const ReleaseCard: React.FC<{f: number; x: number; y: number; s?: number; lit?: number; tabs?: number; slip?: number; whyGone?: number; arm?: boolean; quote?: number}> = ({f, x, y, s = 1, lit = 0, tabs = 0, slip = 0, whyGone = 0, arm = true, quote = -1}) => {
  const tk = clamp01(tabs);
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${-2 + 0.6 * Math.sin(f / 37)})`}>
      {arm && (
        <g>
          <path d="M -60 -300 L -40 -520 L 200 -640" stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
          <path d="M -60 -300 L -40 -520 L 200 -640" stroke={NB.brass} strokeWidth={12} fill="none" strokeLinecap="round" />
          <circle cx={-40} cy={-520} r={18} fill={NB.brassL} stroke={INK} strokeWidth={4} />
        </g>
      )}
      <rect x={-330 + 10} y={-300 + 12} width={660} height={560} fill="#000" opacity={0.28} />
      <rect x={-330} y={-300} width={660} height={560} fill={NB.card} stroke={INK} strokeWidth={5} />
      <rect x={-330} y={-300} width={660} height={64} fill={NB.roomL} stroke={INK} strokeWidth={5} />
      <text x={0} y={-258} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={NB.vellumL}>PRESS RELEASE · TU GRAZ</text>
      <g transform="translate(-60 -310)"><rect x={-40} y={-14} width={80} height={40} rx={6} fill={NB.brass} stroke={INK} strokeWidth={4} /><text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={9} fill={INK}>TU GRAZ</text></g>
      {Array.from({length: 4}, (_, i) => <rect key={i} x={-290} y={-210 + i * 30} width={560 * (0.7 + 0.3 * h01(9, i))} height={10} rx={4} fill={NB.cardD} />)}
      <rect x={-300} y={-86} width={600 * clamp01(lit)} height={56} rx={6} fill="#F3E39A" stroke="#D9C25A" strokeWidth={lit > 0.02 ? 3 : 0} />
      <text x={0} y={-48} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={23} fill={INK} opacity={f >= 0 ? 1 : 0}>"PARTICULARLY PRONOUNCED IN ALASKA"</text>
      {Array.from({length: 5}, (_, i) => <rect key={`b${i}`} x={-290} y={-8 + i * 30} width={500 * (0.6 + 0.4 * h01(19, i))} height={10} rx={4} fill={NB.cardD} />)}
      {tk > 0.01 && (
        <g transform={`translate(${330 + (1 - spring(tk)) * 120} -250)`}>
          <rect x={-10} y={-20} width={60} height={300} rx={8} fill={NB.cobalt} stroke={INK} strokeWidth={4} />
          <g transform="translate(20 130) rotate(-90)"><text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={NB.vellumL}>OUR QUESTIONS</text></g>
        </g>
      )}
      {tk > 0.01 && [['HOW MANY?', 0], ['WHY?', 1]].map(([lab, i]) => (
        <g key={lab as string} transform={`translate(${380 + (1 - spring(tk)) * 120} ${-150 + (i as number) * 140})`} opacity={i === 1 ? 1 - clamp01(whyGone) : 1}>
          <rect x={0} y={-40} width={190} height={80} rx={8} fill={NB.vellumL} stroke={NB.cobalt} strokeWidth={5} />
          <rect x={-14} y={-20} width={28} height={40} rx={4} fill={NB.cobalt} stroke={INK} strokeWidth={3} />
          <text x={100} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={21} fill={NB.cobalt}>{lab as string}</text>
          <rect x={30} y={8} width={140} height={22} rx={4} fill="none" stroke={NB.cobalt} strokeWidth={2.5} strokeDasharray="6 5" />
        </g>
      ))}
      {slip > 0.01 && (
        <g transform={`translate(${610 + (1 - clamp01(slip)) * 160} -150) rotate(4)`}>
          <rect x={0} y={-36} width={220} height={72} rx={6} fill={NB.vellumL} stroke={NB.cobalt} strokeWidth={5} />
          <text x={110} y={-4} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={NB.cobalt}>931 TO 1,078</text>
          <text x={110} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={16} fill={NB.cobalt}>OUR COUNT</text>
        </g>
      )}
    </g>
  );
};

// ---- S6: NO ALASKA NUMBER
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const swing = ease(f, b(14) - 4, 18);
  const lit = easeIO(f, b(43) - 4, 16);
  const tabs = clamp01((f - b(15) + 4) / 14);
  return (
    <Frame p={p} z0={1.0} z1={1.06} warmth={0.05} overlay={<>
          <Plate x={540} text="PRESS RELEASE · TU GRAZ" y={530} size={30} p={win(f, b(14) + 8, b(43))} />
          <Plate x={540} text={'"PARTICULARLY PRONOUNCED IN ALASKA" · PER TU GRAZ'} displayLines={['"PARTICULARLY PRONOUNCED', 'IN ALASKA" · PER TU GRAZ']} y={604} size={28} p={win(f, b(43) + 6, b(15))} />
          <Plate x={540} text="NO ALASKA NUMBER IN THE RELEASE" y={720} size={30} tone="dark" p={win(f, b(15) + 6)} />
        </>}>
      <SVG>
        <TableTop f={f} seed={6} />
        <HeldTravel f={f} x={170} y={660} w={700} h={600} mode="shadow" seed={61}>
          <g transform={`rotate(${(1 - swing) * -12} 740 300)`}><ReleaseCard f={f} x={470} y={1070} s={0.88} lit={lit} tabs={tabs} /></g>
        </HeldTravel>
        <Nib f={f} x={960} y={1300} s={0.45} emotion={f >= b(15) ? 'surprised' : 'curious'} look={-0.8} lookY={-0.6} cues={[b(14), b(43), b(15)]} seed={7} label={false} ink={0} />
      </SVG>
    </Frame>
  );
};

/** an oak counter drum digit */
const Drum: React.FC<{x: number; y: number; d: number}> = ({x, y, d}) => {
  const dd = ((d % 10) + 10) % 10;
  const i0 = Math.floor(dd), fr = dd - i0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-34} y={-50} width={68} height={100} rx={8} fill={NB.vellumL} stroke={INK} strokeWidth={4} />
      <clipPath id={`dr${x}`}><rect x={-30} y={-44} width={60} height={88} /></clipPath>
      <g clipPath={`url(#dr${x})`}>
        {[0, 1].map((k) => <text key={k} x={0} y={18} transform={`translate(0 ${-fr * 70 + k * 70})`} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={52} fill={INK}>{(i0 + k) % 10}</text>)}
      </g>
      <path d="M -34 -6 L 34 -6" stroke={NB.oakD} strokeWidth={2} opacity={0.4} />
    </g>
  );
};

// ---- S7: WE COUNTED (our newsroom hand only)
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const open = ease(f, b(16), 18);
  const roll = clamp01(lin(f, b(17) - 6, 26));
  const val = Math.round(13685 * roll);
  const stamp = f >= b(18) ? spring(clamp01((f - b(18)) / 12)) : 0;
  const digits = val.toString().padStart(5, '0').split('').map(Number);
  // our hand: opens the folder, then clicks, then stamps
  let hx = lerp(700, 470, easeIO(f, b(16) - 14, 12)), hy = lerp(1700, 1180, easeIO(f, b(16) - 14, 12)), press = 0;
  if (f >= b(17) - 12) { const k = easeIO(f, b(17) - 12, 10); hx = lerp(470, 1030, k); hy = lerp(1180, 1080, k); press = Math.floor(f / 4) % 2 && roll < 1 ? 1 : 0; }
  if (f >= b(18) - 12) { const k = easeIO(f, b(18) - 12, 10); hx = lerp(1030, 760, k); hy = lerp(1080, 1268, k); press = f >= b(18) && f < b(18) + 6 ? 1 : 0; }
  return (
    <Frame p={p} z0={1.0} z1={1.05} warmth={0.04} overlay={<>
          <Plate x={540} text="THE AUTHORS' OPEN DATA · FIGSHARE" y={530} size={30} p={win(f, b(16) + 4, b(17))} />
          <Plate x={540} text="13,685 LAKES · OUR COUNT" displayLines={['13,685 LAKES · OUR COUNT']} y={604} size={28} tone="count" p={win(f, b(17) + 10, b(18))} />
          <Plate x={540} text="MATCHES THE PAPER · COUNT ONLY · OUR COUNT" y={720} size={30} tone="count" p={win(f, b(18) + 6)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1260} lamp seed={7} />
        <g transform="translate(260 1190)">
          <ContactShadow cx={0} cy={60} rx={220} ry={18} opacity={0.45} />
          <path d="M -200 50 L -180 -60 L 180 -60 L 200 50 Z" fill="#C9A35E" stroke={INK} strokeWidth={5} />
          <NLab x={0} y={22} text="THE AUTHORS' OPEN DATA" size={15} />
          <g transform={`rotate(${-40 * open} -180 -60)`}><path d="M -180 -60 L -170 -170 L 170 -170 L 180 -60 Z" fill="#D9B46E" stroke={INK} strokeWidth={5} /></g>
          {Array.from({length: 5}, (_, i) => {
            const k = clamp01(open * 1.4 - i * 0.1);
            return <g key={i} transform={`translate(${-60 + i * 30 * k} ${-40 - 60 * k}) rotate(${(i - 2) * 14 * k})`}><rect x={-70} y={-50} width={140} height={100} fill={NB.tile} stroke={INK} strokeWidth={3} /><path d={lakeBlob(0, 6, 30, 20, 90 + i)} fill={NB.lake} stroke={NB.ultra} strokeWidth={3} /></g>;
          })}
        </g>
        <HeldTravel f={f} x={430} y={800} w={560} h={220} mode="sweep" seed={71}>
          <g>
            <rect x={430} y={820} width={560} height={180} rx={18} fill={NB.oakL} stroke={INK} strokeWidth={6} />
            <rect x={450} y={838} width={520} height={144} rx={10} fill={NB.oakD} stroke={INK} strokeWidth={3} />
            {digits.map((d, i) => <Drum key={i} x={500 + i * 105} y={910} d={i === 4 ? (13685 * roll) % 10 : d} />)}
          </g>
        </HeldTravel>
        <g transform="translate(720 1060)">
          <ContactShadow cx={0} cy={210} rx={160} ry={14} opacity={0.4} />
          <rect x={-150} y={0} width={300} height={200} fill={NB.vellumL} stroke={NB.cobalt} strokeWidth={4} transform="skewX(-10)" />
          <text x={0} y={40} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={NB.cobalt}>OUR TALLY · ICE-CONTACT</text>
          <text x={0} y={70} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>2000 · 10,118</text>
          <text x={0} y={96} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={18} fill={INK}>2020 · 13,685</text>
          {stamp > 0.01 && <g transform={`translate(10 158) rotate(-6) scale(${2 - stamp})`} opacity={clamp01(stamp * 2)}><rect x={-100} y={-30} width={200} height={60} rx={6} fill="none" stroke={NB.cobalt} strokeWidth={6} /><text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} fill={NB.cobalt}>OUR COUNT</text></g>}
        </g>
        <Nib f={f} x={140} y={1210} s={0.5} emotion="curious" look={0.8} cues={[b(16), b(17), b(18)]} seed={7} ink={0} label={false} />
        <CheckHand f={f} x={hx} y={hy} s={0.85} press={press} angle={185} role="ours" />
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
const AkVellum: React.FC<{f: number; swell?: number; drop?: number; labelVitus?: boolean}> = ({f, swell = 0, drop = 1, labelVitus = false}) => (
  <g>
    <AlaskaOutline x={AK_FIT.x} y={AK_FIT.y} w={AK_FIT.w} fill={NB.vellumD} stroke={INK} strokeWidth={4} shadow={10} shadowColor={NB.oakD} />
    {COAST.map(([lon, lat, r, sd], i) => {
      const [x, y] = akProject(lon, lat, AK_FIT);
      const rr = 9 * r;
      const pk = clamp01(drop * COAST.length - i);
      if (pk <= 0) return null;
      const k = (1 + 0.16 * swell * (1 + 0.04 * Math.sin(f / 7 + i))) * spring(pk);
      return (
        <g key={i}>
          <path d={lakeBlob(x, y, rr, rr * 0.75, sd)} fill="none" stroke={NB.inkL} strokeWidth={2} strokeDasharray="4 4" />
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
  const lay = ease(f, b(19) - 2, 18);
  const drop = clamp01(lin(f, b(44) - 6, 40));
  const sw = easeIO(f, b(20), 30);
  const dough = sw > 0 && sw < 1 ? 0.025 * Math.sin(f / 3) : 0;
  const SC = 600 / 35;
  const tapeW = 9 * SC * clamp01(lin(f, b(20) - 20, 10));
  const tapeA = 35 * SC * easeIO(f, b(45) - 2, 34);
  let hx = lerp(1150, 700, easeIO(f, b(19) - 14, 14)), hy = lerp(1500, 900, easeIO(f, b(19) - 14, 14));
  if (f >= b(44) - 10) { const k = easeIO(f, b(44) - 10, 10); hx = lerp(700, 990, k); hy = lerp(900, 1060, k); }
  const away = easeIO(f, b(44) + 18, 14);
  hx = lerp(hx, 1200, away); hy = lerp(hy, 1600, away);
  const [vx, vy] = akProject(-143.42, 60.15, AK_FIT);
  return (
    <Frame p={p} warmth={0.04} cam={(ff) => ({z: lerp(1.0, 1.25, easeIO(ff, b(20), 40)) - 0.25 * easeIO(ff, b(45) - 10, 20), fx: lerp(540, vx + 60, easeIO(ff, b(20), 40) * (1 - easeIO(ff, b(45) - 10, 20))), fy: lerp(960, vy + 80, easeIO(ff, b(20), 40) * (1 - easeIO(ff, b(45) - 10, 20)))})} overlay={<>
          <Plate x={540} text="ALASKA · 931 TO 1,078 · +16% · OUR COUNT" y={530} size={26} tone="count" p={win(f, b(44) + 4, b(20))} />
          <Plate x={540} text="ALASKA · ABOUT 880 SQ KM IN 2000 · OUR COUNT" y={600} size={26} tone="count" p={win(f, b(20) + 6, b(45))} />
          <Plate x={540} text="AREA · +35% VS +9% · OUR COUNT" y={670} size={26} tone="count" p={win(f, b(45) + 6, b(51))} />
          <Plate x={540} text="ABOUT 1,190 SQ KM · OUR COUNT" y={740} size={26} tone="count" p={win(f, b(51) + 4)} />
        </>}>
      <SVG>
        <TableTop f={f} seed={8} />
        <HeldTravel f={f} x={60} y={520} w={960} h={760} mode="shadow" seed={81}>
          <g transform={`translate(${(1 - lay) * 900} ${(1 - lay) * 300}) scale(${1 + dough})`}>
            <rect x={60} y={500} width={960} height={780} fill={NB.vellumL} opacity={0.55} stroke={NB.vellumD} strokeWidth={3} />
            <AkVellum f={f} swell={sw} drop={drop} labelVitus={sw > 0.5} />
          </g>
        </HeldTravel>
        <g transform="translate(770 1180)"><ReleaseCard f={f} x={0} y={0} s={0.3} tabs={1} slip={ease(f, b(44), 12)} arm={false} /></g>
        <TapeMeasure f={f} x={160} y={1222} len={tapeW} label={tapeA < 10 ? 'WORLD AREA' : undefined} marks={[{at: 9 * SC, label: 'WORLD 9%'}]} />
        <TapeMeasure f={f} x={160} y={1318} len={tapeA} label={tapeA > 10 ? 'ALASKA AREA' : undefined} marks={[{at: 35 * SC, label: '35% · OUR COUNT', color: NB.cobalt}]} />
        <Nib f={f} x={120} y={1300} s={0.34} emotion={f > b(45) ? 'surprised' : 'wonder'} look={0.7} label={false} cues={[b(19), b(44), b(20), b(45)]} seed={7} ink={0} />
        {away < 1 && <CheckHand f={f} x={hx} y={hy} s={1.0} angle={-20} role="ours" />}
      </SVG>
    </Frame>
  );
};

// ---- S16: MULTIPLIED, SWELLED (back at the wall: our hand pins the Alaska vellum beside the world sheet)
const S16: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pin = ease(f, b(22) - 6, 12);
  const gone = easeIO(f, b(22) + 10, 8);
  const hx = lerp(1150, 820, easeIO(f, b(22) - 18, 12)) + 700 * gone;
  const hy = lerp(1500, 760, easeIO(f, b(22) - 18, 12)) + 1000 * gone;
  return (
    <Frame p={p} warmth={0.04} cam={(ff) => ({z: 1.0 + 0.03 * easeIO(ff, 0, p.dur), fx: lerp(520, 560, easeIO(ff, 0, p.dur)), fy: 920})} overlay={<>
          <Plate x={540} text="THE WORLD'S LAKES MULTIPLIED · ALASKA'S SWELLED" displayLines={["THE WORLD'S LAKES MULTIPLIED", "ALASKA'S SWELLED"]} y={530} size={32} tone="dark" p={win(f, b(22) + 6)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1420} lamp={false} seed={5} />
        <g>
          <rect x={40} y={620} width={470} height={600} fill={NB.vellum} stroke={INK} strokeWidth={5} />
          <text x={275} y={664} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>WORLD</text>
          {[[60, 632], [490, 632], [60, 1208], [490, 1208]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill={NB.oakD} stroke={INK} strokeWidth={3} />)}
          {Array.from({length: 60}, (_, i) => <path key={`o${i}`} d={lakeBlob(70 + (i % 10) * 44, 720 + Math.floor(i / 10) * 80, 9, 6, 600 + i, 8, 0.35)} fill={NB.lakeD} stroke={INK} strokeWidth={1.5} opacity={0.7} />)}
          {Array.from({length: 21}, (_, i) => <LakeChip key={`n${i}`} x={80 + h01(170, i) * 400} y={740 + h01(171, i) * 440} r={8} pop={((f + i * 7) % 40) / 8} seed={i} />)}
        </g>
        <g transform={`translate(${(1 - pin) * 600} ${(1 - pin) * 200}) rotate(${(1 - pin) * 8 + 1} 805 920)`}>
          <rect x={570} y={620} width={470} height={600} fill={NB.vellumL} stroke={INK} strokeWidth={5} />
          <text x={805} y={664} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>ALASKA</text>
          <g transform="translate(805 940) scale(0.48) translate(-540 -920)"><AkVellum f={f} swell={1 + 0.1 * Math.sin(f / 9)} /></g>
          {pin >= 1 && [[590, 632], [1020, 632]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill={NB.cobalt} stroke={INK} strokeWidth={3} />)}
        </g>
        <HeldTravel f={f} x={40} y={620} w={1000} h={600} mode="shadow" seed={161}><rect x={40} y={620} width={1000} height={600} fill={NB.vellum} opacity={0.01} /></HeldTravel>
        <rect x={-60} y={1290} width={1200} height={22} fill={NB.oak} stroke={INK} strokeWidth={4} />
        <NLab x={275} y={1258} text="LAKES +35% · AREA +9%" size={17} />
        <NLab x={805} y={1258} text="LAKES +16% · AREA +35% · OUR COUNT" size={15} ink={NB.cobalt} edge={NB.cobalt} />
        {gone < 1 && <CheckHand f={f} x={hx} y={hy} s={1.0} angle={-20} role="ours" />}
      </SVG>
    </Frame>
  );
};

// ---- S9: ABOUT HALF (an oak frame holding a vellum strip; the view pulls back from Alaska's half to the whole strip)
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const bar = ease(f, b(23) - 2, 16);
  const lit = easeIO(f, b(46) - 4, 16);
  const pull = easeIO(f, b(46) - 2, 26);
  const row = (i: number) => (f - b(24) - i * 2) / 10;
  const hx = lerp(-200, 120, bar) - 400 * easeIO(f, b(23) + 20, 12);
  return (
    <Frame p={p} warmth={0.03} cam={(ff) => ({z: lerp(1.0, 1.7, easeIO(ff, b(23) + 10, 16)) - 0.7 * pull, fx: lerp(540, 330, easeIO(ff, b(23) + 10, 16) * (1 - pull)), fy: 1040})} overlay={<>
          <Plate x={540} text="THE WORLD'S ADDED AREA · OUR COUNT" y={530} size={30} tone="count" p={win(f, b(23) + 6, b(46))} />
          <Plate x={540} text="ABOUT HALF THE WORLD'S ADDED AREA · OUR COUNT" displayLines={["ABOUT HALF THE WORLD'S", 'ADDED AREA · OUR COUNT']} y={604} size={30} tone="count" p={win(f, b(46) + 6, b(24))} />
          <Plate x={540} text="1,078 OF 13,685 · ABOUT 1 IN 13 · OUR COUNT" displayLines={['1,078 OF 13,685 · ABOUT 1 IN 13', 'OUR COUNT']} y={724} size={30} tone="count" p={win(f, b(24) + 4)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1280} seed={9} />
        <HeldTravel f={f} x={80} y={1000} w={920} h={140} mode="sweep" seed={91}>
          <g transform={`translate(${(1 - bar) * -1100} 0)`}>
            <ContactShadow cx={540} cy={1170} rx={480} ry={16} opacity={0.4} />
            <rect x={90} y={1010} width={900} height={130} rx={14} fill={NB.oakL} stroke={INK} strokeWidth={6} />
            <rect x={110} y={1030} width={860} height={90} rx={8} fill={NB.vellumL} stroke={INK} strokeWidth={3} />
            <rect x={110} y={1030} width={430 * lit} height={90} rx={8} fill={NB.lake} stroke={INK} strokeWidth={3} />
            <rect x={540} y={1030} width={430} height={90} rx={8} fill={NB.tile} stroke={INK} strokeWidth={3} />
            {lit > 0.6 && <NLab x={325} y={1075} text="ALASKA · ADDED AREA" size={20} fill={NB.lakeL} />}
            {(easeIO(f, b(23) + 10, 16) * (1 - pull) < 0.15) && <text x={755} y={1088} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} fill={NB.vellumL}>REST OF WORLD</text>}
            <path d="M 540 1000 L 540 1150" stroke={INK} strokeWidth={6} strokeDasharray="12 8" />
            {pull > 0.6 && <NLab x={540} y={1172} text="BAR · ADDED AREA · NOT LAKE COUNT" size={17} />}
          </g>
        </HeldTravel>
        {Array.from({length: 13}, (_, i) => (
          <g key={i} transform={`translate(0 ${row(i) > 0 ? -Math.max(0, 1 - row(i)) * 200 : 0})`}>
            <LakeChip x={140 + i * 66} y={990} r={24} pop={row(i)} seed={200 + i} />
            {i === 6 && row(i) > 0.5 && <NLab x={140 + i * 66} y={930} text="ALASKA" size={16} fill={NB.lakeL} />}
          </g>
        ))}
        <CheckHand f={f} x={hx} y={1070} s={1.0} angle={60} role="ours" />
        <Nib f={f} x={980} y={1240} s={0.5} emotion="curious" look={-0.7} cues={[b(23), b(46), b(24)]} seed={7} label={false} ink={0} />
      </SVG>
    </Frame>
  );
};

// ---- S10: TWO RINGS (signature: an oblique aerial of the real Bering lobe at first light; no hand)
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rise = easeIO(f, 0, 34);
  const cx = 540, cy = 1090;
  const r0x = 290, r0y = 118, r1x = r0x * 1.23, r1y = r0y * 1.23;
  const flag = clamp01((f - b(47) + 6) / 12);
  const inner = f >= b(52) && f < b(52) + 14 ? 1 : 0;
  const fill = easeIO(f, b(26) - 6, 44);
  const front = fill > 0 && fill < 1 ? 1 : 0;
  const k = lerp(1, 1.23, fill);
  const drift = (f * 1.4) % 1400;
  // the lobe: a fan from a far neck at the horizon to a wide snout above the lake
  const HZ = 430;
  const lobe = `M 470 ${HZ} C 300 520 40 640 -60 760 L -60 ${cy - r1y - 30} C 200 ${cy - r1y + 70} 880 ${cy - r1y + 70} 1140 ${cy - r1y - 30} L 1140 760 C 1040 640 780 520 610 ${HZ} Z`;
  return (
    <Frame p={p} bg="#4A4664" warmth={0.02} cam={(ff) => ({z: lerp(1.25, 1.0, rise), fx: 540, fy: lerp(760, 980, rise)})} overlay={<>
          <Plate x={540} text="BERING GLACIER · AERIAL VIEW" y={530} size={30} tone="dark" p={win(f, b(25) + 8, b(47))} />
          <Plate x={540} text="VITUS LAKE · BIGGEST ALASKA GAIN · OUR COUNT" displayLines={['VITUS LAKE · BIGGEST ALASKA GAIN', 'OUR COUNT']} y={604} size={28} tone="count" p={win(f, b(47) + 6, b(52))} />
          <Plate x={540} text="C. 2000 · ABOUT 105 SQ KM · OUR COUNT" displayLines={['C. 2000 · ABOUT 105 SQ KM', 'OUR COUNT']} y={720} size={28} tone="count" p={win(f, b(52) + 2, b(26))} />
          <Plate x={540} text="C. 2020 · ABOUT 158 SQ KM · OUR COUNT" displayLines={['C. 2020 · ABOUT 158 SQ KM', 'OUR COUNT']} y={836} size={30} tone="count" p={win(f, b(26) + 6)} />
        </>}>
      <SVG>
        <defs>
          <linearGradient id="aerSky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4A4664" /><stop offset="1" stopColor="#E9B49A" /></linearGradient>
          <linearGradient id="aerIce" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#D9D4E6" /><stop offset="0.55" stopColor={NB.ice} /><stop offset="1" stopColor="#F8F2EE" /></linearGradient>
          <linearGradient id="aerPlain" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#7A746E" /><stop offset="1" stopColor="#4E4842" /></linearGradient>
          <clipPath id="aerLobe"><path d={lobe} /></clipPath>
        </defs>
        {/* far sky and a low range at the horizon, small with distance */}
        <rect x={-60} y={-60} width={1200} height={HZ + 80} fill="url(#aerSky)" />
        <path d={`M -60 ${HZ + 4} L 60 ${HZ - 40} L 150 ${HZ - 18} L 260 ${HZ - 62} L 380 ${HZ - 22} L 470 ${HZ - 48} L 600 ${HZ - 14} L 720 ${HZ - 58} L 860 ${HZ - 20} L 980 ${HZ - 44} L 1140 ${HZ - 8} L 1140 ${HZ + 20} L -60 ${HZ + 20} Z`} fill="#8E86A6" stroke={INK} strokeWidth={3} />
        <path d={`M 230 ${HZ - 50} L 260 ${HZ - 62} L 290 ${HZ - 46} M 690 ${HZ - 46} L 720 ${HZ - 58} L 750 ${HZ - 44}`} stroke="#F6C6C6" strokeWidth={4} fill="none" />
        {/* the outwash and the foothills either side of the lobe */}
        <rect data-band="ok" x={-60} y={HZ + 10} width={1200} height={1600} fill="url(#aerPlain)" />
        {Array.from({length: 10}, (_, i) => <path key={`fh${i}`} d={`M ${-60 + i * 130} ${HZ + 60 + i % 3 * 30} q 70 -26 140 0`} stroke="#5E5A56" strokeWidth={3} fill="none" opacity={0.6} />)}
        {/* the lobe itself */}
        <path d={lobe} fill="url(#aerIce)" stroke={INK} strokeWidth={5} />
        <g clipPath="url(#aerLobe)">
          {/* banded medial moraines converging on the neck */}
          {[-0.55, -0.18, 0.26, 0.6].map((u, i) => {
            const xb = 540 + u * 760, wig = (i % 2 ? 1 : -1) * (40 + 30 * i);
            const pts = `M ${540 + u * 60} ${HZ} C ${540 + u * 160 + wig * 0.3} 520 ${540 + u * 300 - wig} 600 ${540 + u * 420} 680 S ${xb + wig} 840 ${xb} ${cy - r1y + 30}`;
            return <g key={`m${i}`}><path d={pts} stroke={NB.rockD} strokeWidth={10 + 12 * i % 3} fill="none" opacity={0.8} strokeLinecap="round" /><path d={pts} stroke={NB.rock} strokeWidth={3 + 4 * (i % 2)} fill="none" opacity={0.9} strokeDasharray="22 9 6 12" strokeLinecap="round" /></g>;
          })}
          {/* crevasse bands, lit lip over a shadow face, tighter toward the neck */}
          {Array.from({length: 11}, (_, r) => {
            const yy = HZ + 30 + Math.pow(r / 10, 1.5) * (cy - r1y - 90 - HZ);
            const half = 70 + (yy - HZ) * 0.95;
            const n = 4 + Math.floor(r * 0.9);
            return Array.from({length: n}, (_, j) => {
              const x0 = 540 - half + (j + 0.5) * (2 * half / n) + 10 * h01(300 + r, j);
              const len = 18 + r * 5;
              const sag = 3 + r * 0.8;
              return <g key={`c${r}-${j}`}><path d={`M ${x0 - len / 2} ${yy} q ${len / 2} ${sag} ${len} 0`} stroke="#9C98B8" strokeWidth={2 + r * 0.35} fill="none" /><path d={`M ${x0 - len / 2} ${yy - 1.5 - r * 0.2} q ${len / 2} ${sag} ${len} 0`} stroke="#FFFFFF" strokeWidth={1 + r * 0.15} fill="none" opacity={0.85} /></g>;
            });
          })}
          {/* cloud shadows drifting down-valley */}
          <ellipse cx={-300 + drift} cy={640} rx={260} ry={60} fill="#3A3650" opacity={0.16} />
          <ellipse cx={-900 + drift} cy={820} rx={340} ry={80} fill="#3A3650" opacity={0.14} />
        </g>
        {/* the dark sediment rim where the snout meets the lake */}
        <path d={`M -60 ${cy - r1y - 30} C 200 ${cy - r1y + 70} 880 ${cy - r1y + 70} 1140 ${cy - r1y - 30}`} stroke={NB.rockD} strokeWidth={14} fill="none" />
        {/* the lake: the 2000 water, then the new water spreading outward to the 2020 line */}
        <path d={lakeBlob(cx, cy, r1x, r1y, 42)} fill="none" stroke={NB.lakeD} strokeWidth={4} strokeDasharray="14 10" opacity={1 - fill} />
        <LakeFill cx={cx} cy={cy} rx={r0x * k} ry={r0y * k} seed={42} f={f} />
        {front > 0 && <path d={lakeBlob(cx, cy, r0x * k, r0y * k, 42)} fill="none" stroke={NB.lakeL} strokeWidth={10 + 6 * Math.sin(f / 2)} opacity={0.9} />}
        <path d={lakeBlob(cx, cy, r1x, r1y, 42)} fill="none" stroke={NB.lakeL} strokeWidth={26} opacity={fill >= 1 ? 0.25 + 0.15 * Math.sin(f / 6) : 0} />
        <path d={lakeBlob(cx, cy, r0x, r0y, 42)} fill="none" stroke={NB.ultraL} strokeWidth={16} opacity={0.25 + 0.35 * inner} />
        <LakeOutline cx={cx} cy={cy} rx={r0x} ry={r0y} seed={42} p={1} width={8} />
        <LakeOutline cx={cx} cy={cy} rx={r1x} ry={r1y} seed={42} p={fill} width={8} />
        {/* small bergs calved off the snout drifting on the lake */}
        {Array.from({length: 7}, (_, i) => <path key={`bg${i}`} d={`M ${cx - 220 + i * 70 + 6 * Math.sin(f / 30 + i)} ${cy - 60 + 30 * h01(310, i)} l 12 -6 l 10 4 l -4 8 z`} fill="#FFFFFF" stroke={INK} strokeWidth={2} />)}
        <NLab x={cx - 40} y={cy + 4} text="C. 2000" size={16} />
        {fill > 0.85 && <NLab x={cx - (r0x + r1x) / 2 + 14} y={cy + 8} text="C. 2020" size={16} />}
        <HeldTravel f={f} x={140} y={900} w={800} h={360} mode="sweep" seed={101}><path d={lakeBlob(cx, cy, r1x, r1y, 42)} fill={NB.lake} opacity={0.02} /></HeldTravel>
        {flag > 0.01 && (
          <g transform={`translate(${cx + r1x - 30} ${cy + r1y + 6 - (1 - spring(flag)) * 600})`}>
            <ContactShadow cx={6} cy={2} rx={18} ry={5} opacity={0.5} />
            <path d="M 0 0 L 0 -150" stroke={INK} strokeWidth={6} />
            <path d={`M 0 -150 L 120 ${-130 + 6 * Math.sin(f / 6)} L 0 -104 Z`} fill={NB.cobalt} stroke={INK} strokeWidth={4} />
          </g>
        )}
        {/* braided meltwater channels running out of the lake across the outwash, wider as they near */}
        <g data-band="ok">
          {[[-0.35, 0], [0.05, 1], [0.4, 2]].map(([u, i]) => (
            <path key={`br${i}`} d={`M ${cx + (u as number) * 300} ${cy + r1y - 6} C ${cx + (u as number) * 420 + 40} ${cy + 260} ${cx + (u as number) * 600 - 60} ${cy + 520} ${cx + (u as number) * 900} 1990`} stroke={NB.lakeD} strokeWidth={8 + 10 * (i as number)} fill="none" opacity={0.85} />
          ))}
          {[[-0.35, 0], [0.05, 1], [0.4, 2]].map(([u, i]) => (
            <path key={`bs${i}`} d={`M ${cx + (u as number) * 300} ${cy + r1y - 6} C ${cx + (u as number) * 420 + 40} ${cy + 260} ${cx + (u as number) * 600 - 60} ${cy + 520} ${cx + (u as number) * 900} 1990`} stroke={NB.lakeL} strokeWidth={2 + 2 * (i as number)} fill="none" opacity={0.7} strokeDasharray={`${30 + 10 * (i as number)} 40`} strokeDashoffset={-f * (1.5 + (i as number) * 0.5)} />
          ))}
          {/* gravel bars, sized by distance: small near the lake, large at the bottom of frame */}
          {Array.from({length: 34}, (_, i) => {
            const v = h01(320, i);
            const yy = cy + r1y + 30 + v * v * (1950 - cy - r1y - 30);
            const s = 0.3 + 1.4 * v * v;
            const xx = h01(321, i) * 1140 - 30;
            return <g key={`st${i}`}><ellipse cx={xx + 6 * s} cy={yy + 5 * s} rx={22 * s} ry={8 * s} fill="#000" opacity={0.25} /><ellipse cx={xx} cy={yy} rx={20 * s} ry={11 * s} fill={i % 3 ? NB.gravel : '#9A928A'} stroke={INK} strokeWidth={1.5 + s} /><path d={`M ${xx - 12 * s} ${yy - 4 * s} q ${8 * s} ${-5 * s} ${18 * s} ${-2 * s}`} stroke="#C8C0B6" strokeWidth={1 + s} fill="none" /></g>;
          })}
        </g>
      </SVG>
    </Frame>
  );
};

/** a glacier front seen from the ground: a scalloped ice wall with crevasses and a pale rose iceRim, ending in water or gravel */
const GlacierFront: React.FC<{f: number; x: number; y: number; w: number; lake: boolean; seed: number; drip?: number}> = ({f, x, y, w, lake, seed, drip = 0}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M ${-w / 2} 0 L ${-w / 2 + 20} -330 Q ${-w / 4} -380 0 -360 Q ${w / 4} -400 ${w / 2 - 10} -340 L ${w / 2} 0 Z`} fill={NB.ice} stroke={INK} strokeWidth={6} />
    <path d={`M ${-w / 2 + 20} -330 Q ${-w / 4} -380 0 -360 Q ${w / 4} -400 ${w / 2 - 10} -340`} stroke="#F6C6C6" strokeWidth={6} fill="none" opacity={0.8} />
    {Array.from({length: 7}, (_, i) => <path key={i} d={`M ${-w / 2 + 40 + i * (w - 80) / 6} -330 l ${8 * Math.sin(i + seed)} 300`} stroke={NB.iceD} strokeWidth={5} />)}
    <path d={`M ${-w / 2 + 10} -60 Q 0 -20 ${w / 2 - 10} -60 L ${w / 2} 0 L ${-w / 2} 0 Z`} fill="#B8B6D4" opacity={0.7} />
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

/** a glass water column on a stand: level 0..1 of `max` cm, ticks every 10 cm, its label above */
const WaterTube: React.FC<{f: number; x: number; y: number; h: number; level: number; max?: number; label: string; tickInk?: string}> = ({f, x, y, h, level, max = 70, label, tickInk = NB.vellumL}) => {
  const lv = clamp01(level);
  const fillH = h * lv;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ContactShadow cx={0} cy={6} rx={90} ry={14} opacity={0.45} />
      <rect x={-80} y={-20} width={160} height={26} rx={6} fill={NB.brass} stroke={INK} strokeWidth={5} />
      <rect x={-46} y={-20 - h} width={92} height={h} rx={10} fill={NB.vellumL} opacity={0.35} stroke={INK} strokeWidth={5} />
      <rect x={-40} y={-20 - fillH} width={80} height={fillH} fill={NB.lake} />
      {fillH > 4 && <path d={`M -40 ${-20 - fillH} q 20 ${4 * Math.sin(f / 5)} 40 0 t 40 0`} stroke={NB.lakeL} strokeWidth={4} fill="none" />}
      {Array.from({length: Math.floor(max / 10) + 1}, (_, i) => <g key={i}><path d={`M 46 ${-20 - (h * i * 10) / max} l 14 0`} stroke={tickInk} strokeWidth={3} /><text x={66} y={-14 - (h * i * 10) / max} fontFamily={MONO} fontWeight={800} fontSize={16} fill={tickInk}>{i * 10}</text></g>)}
      <path d={`M -30 ${-10 - h} L -30 -40`} stroke="#FFFFFF" strokeWidth={5} opacity={0.5} />
      <NLab x={0} y={-56 - h} text={label} size={18} />
    </g>
  );
};

// ---- S11: THE CASE FOR YES
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const rise = ease(f, b(27) - 2, 22);
  const l66 = lin(f, b(28) - 14, 30) * (66 / 70);
  const l40 = lin(f, b(29) - 2, 24) * (40 / 70);
  return (
    <Frame p={p} bg="#4A4664" z0={1.0} z1={1.05} warmth={0.01} overlay={<>
          <Plate x={540} text="THE CASE FOR YES" y={530} size={40} tone="dark" p={win(f, b(27) + 4)} />
          <Plate x={300} text="LAKE-ENDING · 66 CM A YEAR · ON AVERAGE" displayLines={['LAKE-ENDING · 66 CM', 'A YEAR · ON AVERAGE']} y={614} size={24} p={win(f, b(28) + 10)} />
          <Plate x={790} text="ON LAND · ABOUT 40 CM A YEAR" displayLines={['ON LAND · ABOUT 40 CM', 'A YEAR']} y={722} size={24} p={win(f, b(29) + 6)} />
        </>}>
      <SVG>
        <DawnWorld f={f} seed={11} />
        <g transform={`translate(0 ${(1 - rise) * 500})`}>
          <GlacierFront f={f} x={290} y={1000} w={480} lake seed={3} drip={1} />
          <GlacierFront f={f} x={800} y={1000} w={440} lake={false} seed={9} />
        </g>
        <path d="M 540 860 L 540 1170" stroke={INK} strokeWidth={10} />
        <rect data-band="ok" x={-60} y={1160} width={1200} height={820} fill={NB.gravelD} />
        {Array.from({length: 30}, (_, i) => <ellipse key={i} cx={h01(115, i) * 1100} cy={1180 + h01(116, i) * 700} rx={14 + 16 * h01(117, i)} ry={8 + 8 * h01(118, i)} fill={i % 2 ? NB.gravel : '#9A928A'} stroke={INK} strokeWidth={2.5} data-band="ok" />)}
        <HeldTravel f={f} x={180} y={760} w={720} h={500} mode="sweep" seed={111}>
          <g>
            <WaterTube f={f} x={290} y={1300} h={420} level={l66} label="LAKE-ENDING" tickInk={INK} />
            <WaterTube f={f} x={790} y={1300} h={420} level={l40} label="ON LAND" tickInk={INK} />
          </g>
        </HeldTravel>
        {/* the survey stake carrying a strip of the vellum's Gulf coast into the field */}
        <g transform="translate(540 1560)" data-band="ok">
          <ContactShadow cx={0} cy={4} rx={40} ry={8} opacity={0.45} />
          <rect x={-8} y={-200} width={16} height={204} fill={NB.oakD} stroke={INK} strokeWidth={4} />
          <g transform="rotate(-4)">
            <rect x={-130} y={-260} width={260} height={90} fill={NB.vellumL} stroke={INK} strokeWidth={4} />
            <path d="M -110 -200 Q -60 -230 -10 -215 Q 40 -235 110 -205" stroke={INK} strokeWidth={4} fill="none" />
            {[[-60, -212], [10, -220], [70, -210]].map(([x, y], i) => <path key={i} d={lakeBlob(x, y, 9, 6, 700 + i)} fill={NB.lake} stroke={NB.ultra} strokeWidth={2.5} />)}
          </g>
        </g>
      </SVG>
    </Frame>
  );
};

/** the lake-ending front's shore seen from straight above: turquoise water, the ice edge along the top, gravel along the bottom, a survey stake */
const ShoreTop: React.FC<{f: number; ring?: number}> = ({f, ring = 0}) => (
  <g>
    <rect data-band="ok" x={-60} y={-60} width={1200} height={2040} fill={NB.gravelD} />
    <path d="M -60 -60 L 1140 -60 L 1140 640 Q 820 700 540 660 Q 260 620 -60 680 Z" fill={NB.ice} stroke={INK} strokeWidth={6} />
    {Array.from({length: 12}, (_, i) => <path key={i} d={`M ${-20 + i * 100} 60 q 20 280 ${8 * Math.sin(i)} 560`} stroke={NB.iceD} strokeWidth={5} fill="none" />)}
    <path d="M -60 680 Q 260 620 540 660 Q 820 700 1140 640 L 1140 1300 Q 800 1360 540 1320 Q 280 1280 -60 1330 Z" fill={NB.lake} stroke={INK} strokeWidth={6} />
    {Array.from({length: 4}, (_, i) => {
      const k = ((f / 40 + i / 4 + ring) % 1);
      return <ellipse key={i} cx={560} cy={1000} rx={60 + 420 * k} ry={30 + 210 * k} fill="none" stroke={NB.lakeL} strokeWidth={5} opacity={1 - k} />;
    })}
    <g data-band="ok">{Array.from({length: 26}, (_, i) => <ellipse key={i} cx={h01(140, i) * 1100} cy={1360 + h01(141, i) * 560} rx={20 + 24 * h01(142, i)} ry={14 + 16 * h01(143, i)} fill={i % 2 ? NB.gravel : '#9A928A'} stroke={INK} strokeWidth={2.5} />)}</g>
  </g>
);

// ---- S12: FURTHER ACCELERATES (straight above the lake-ending front's shore: the stake's tag, rings on the water, the column lifted)
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tag = ease(f, b(30) + 2, 14);
  const lift = easeIO(f, b(31) - 6, 26);
  const hx = lerp(-200, 210, easeIO(f, b(31) - 20, 14)) - 500 * lift;
  const hy = lerp(1600, 1190, easeIO(f, b(31) - 20, 14)) + 700 * lift;
  return (
    <Frame p={p} bg={NB.gravelD} warmth={0.01} cam={(ff) => ({z: lerp(1.15, 1.0, easeIO(ff, 0, p.dur)), fx: 540, fy: 980})} overlay={<>
          <Plate x={540} text="TOBIAS BOLCH · CO-AUTHOR · TU GRAZ" y={530} size={28} p={win(f, b(30) + 6, b(31) - 2)} />
          <Plate x={540} text={'"CONTACT WITH A LAKE FURTHER ACCELERATES THE LOSS OF ICE" · TOBIAS BOLCH · PER TU GRAZ'} displayLines={['TOBIAS BOLCH · PER TU GRAZ']} y={602} size={28} tone="dark" p={win(f, b(31) + 4)} />
        </>}>
      <SVG>
        <ShoreTop f={f} />
        <HeldTravel f={f} x={0} y={680} w={1080} h={640} mode="shadow" seed={121}><rect x={0} y={680} width={1080} height={640} fill={NB.lake} opacity={0.02} /></HeldTravel>
        {/* the survey stake on the shore with its tag, from above */}
        <g transform="translate(420 1270)">
          <ContactShadow cx={10} cy={8} rx={30} ry={30} opacity={0.45} />
          <circle cx={0} cy={0} r={16} fill={NB.oakD} stroke={INK} strokeWidth={4} />
          <g transform={`translate(30 -240) rotate(${-3 + (1 - tag) * 70})`}>
            <rect x={-10} y={-10} width={560} height={210} rx={8} fill="#000" opacity={0.25} />
            <rect x={-20} y={-20} width={560} height={210} rx={8} fill={NB.card} stroke={INK} strokeWidth={5} />
            <text x={260} y={36} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>"CONTACT WITH A LAKE</text>
            <text x={260} y={76} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>FURTHER ACCELERATES</text>
            <text x={260} y={116} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} fill={INK}>THE LOSS OF ICE"</text>
            <text x={260} y={160} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={INK}>TOBIAS BOLCH · PER TU GRAZ</text>
          </g>
        </g>
        {/* the 66 column from above: a glass ring with its water, lifted toward the viewer */}
        <g transform={`translate(${200 - 300 * lift} ${1180 + 500 * lift}) scale(${1 + 0.5 * lift})`}>
          <ContactShadow cx={14 + 30 * lift} cy={14 + 30 * lift} rx={70} ry={70} opacity={0.4 * (1 - lift * 0.6)} />
          <circle cx={0} cy={0} r={62} fill={NB.vellumL} opacity={0.45} stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={0} r={52} fill={NB.lake} stroke={NB.lakeD} strokeWidth={3} />
          <ellipse cx={-14} cy={-16} rx={20} ry={10} fill={NB.lakeL} opacity={0.8 + 0.2 * Math.sin(f / 5)} />
          {lift < 0.5 && <NLab x={0} y={-96} text="66 CM" size={16} />}
        </g>
        <CheckHand f={f} x={hx} y={hy} s={1.1} angle={-25} role="study" />
      </SVG>
    </Frame>
  );
};

// ---- S13: THE WEIGH-IN (nickel springs; the release card's clip at the right end with an unexplained empty pan)
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const lower = ease(f, b(32) - 4, 26);
  const hooks = ease(f, b(48) - 2, 16);
  const K = 6.2;
  const land = (bb: number) => clamp01((f - bb + 14) / 14);
  const ext = (bb: number, share: number) => (land(bb) >= 1 ? share * K * spring(clamp01((f - bb) / 18)) : 0);
  const tap = easeIO(f, b(53) - 10, 10) * (1 - easeIO(f, b(53) + 14, 12));
  return (
    <Frame p={p} warmth={-0.01} cam={(ff) => ({z: 1.0 + 0.04 * easeIO(ff, 0, p.dur), fx: 560, fy: 960})} overlay={<>
          <Plate x={540} text="MACHINE LEARNING · WEIGHS THE FACTORS" displayLines={['MACHINE LEARNING', 'WEIGHS THE FACTORS']} y={530} size={30} tone="dark" p={win(f, b(32) + 6, b(48))} />
          <Plate x={540} text="LAKE · CLIMATE · GLACIER SHAPE" y={650} size={30} tone="dark" p={win(f, b(48) + 4, b(53))} />
          <Plate x={540} text="LAKE-ENDING GLACIERS · WORLDWIDE" y={724} size={30} tone="dark" p={win(f, b(53) + 2, b(33))} />
          <Plate x={272} text="LAKE ~11% · LAKE-ENDING GLACIERS · WORLDWIDE" displayLines={['LAKE ~11%', 'LAKE-ENDING · WORLDWIDE']} y={822} size={22} p={win(f, b(33) + 4)} />
          <Plate x={540} text="CLIMATE ~43%" y={940} size={22} p={win(f, b(34) + 4)} />
          <Plate x={800} text="GLACIER SHAPE ~46%" y={1006} size={22} p={win(f, b(35) + 4)} />
        </>}>
      <SVG>
        <Room f={f} tableY={1300} lamp={false} seed={13} />
        <rect data-band="ok" x={-60} y={-60} width={1200} height={2040} fill="#DCE0E8" opacity={0.14} style={{mixBlendMode: 'soft-light'}} />
        <g transform="translate(190 1262)"><WaterTube f={f} x={0} y={0} h={200} level={66 / 70} label={f >= b(53) ? 'WORLDWIDE' : '66 CM · ALL'} /></g>
        <HeldTravel f={f} x={100} y={560} w={820} h={700} mode="sweep" seed={131}><g transform={`translate(0 ${(1 - lower) * -900})`}>
          <WeighRail f={f} x={500} y={1260} w={760} railY={-520} plate="">
            {[[-250, 11, b(33), 64, 'LAKE'], [0, 43, b(34), 124, 'CLIMATE'], [250, 46, b(35), 130, 'SHAPE']].map(([x, sh, bb, ww, lab], i) => (
              <g key={i}>
                <SpringScale f={f} x={x as number} y={0} ext={ext(bb as number, sh as number)} weightW={ww as number} label={lab as string} land={land(bb as number)} seed={i + 1} lake={i === 0} />
                {land(bb as number) < 0.05 && hooks > 0.01 && <g transform={`translate(${x as number} ${-60 + 220 * hooks})`}><path d="M 0 -200 L 0 -40" stroke={INK} strokeWidth={3} /><BrassWeight x={0} y={60} w={ww as number} label={lab as string} lake={i === 0} /></g>}
              </g>
            ))}
          </WeighRail>
        </g></HeldTravel>
        {/* the release card's TU Graz clip arm at the rail's right end, an empty pan already hanging from it */}
        <g transform="translate(990 640)">
          <path d="M 60 760 L 60 0 L -20 0" stroke={INK} strokeWidth={20} fill="none" strokeLinecap="round" />
          <path d="M 60 760 L 60 0 L -20 0" stroke={NB.brass} strokeWidth={10} fill="none" strokeLinecap="round" />
          <rect x={-46} y={-16} width={52} height={36} rx={6} fill={NB.brass} stroke={INK} strokeWidth={4} />
          <SpringScale f={f} x={-20} y={40} ext={0} empty swing={0.6} seed={4} />
        </g>
        {tap > 0.01 && <CheckHand f={f} x={lerp(60, 150, tap)} y={lerp(1700, 1180, tap)} s={0.9} angle={200} role="study" press={f >= b(53) && f < b(53) + 6 ? 1 : 0} />}
        <Nib f={f} x={930} y={1270} s={0.36} emotion={f >= b(35) ? 'curious' : 'calm'} look={-0.6 - 0.3 * clamp01((f - b(33)) / 30)} lookY={-0.5} label={false} cues={[b(32), b(48), b(33), b(35)]} seed={7} ink={0} />
      </SVG>
    </Frame>
  );
};

// ---- S14: THE EMPTY PAN (at ground level back at the lake-ending front; the pan hangs from the survey stake)
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const fly = easeIO(f, b(37) + 2, 26);
  const landed = f >= b(37) + 28;
  const sx = 600, sy = 1040;
  const turn = easeIO(f, 4, 20);
  return (
    <Frame p={p} bg="#4A4664" warmth={-0.02} cam={(ff) => ({z: 1.0 + 0.04 * easeIO(ff, 0, p.dur), fx: 560, fy: 980})} overlay={<>
          <Plate x={540} text="A REAL PUSH · THE SMALLEST OF THE THREE" displayLines={['A REAL PUSH', 'THE SMALLEST OF THE THREE']} y={530} size={30} tone="dark" p={win(f, 4, b(37) - 2)} />
          <Plate x={540} text="ALASKA'S SPLIT · NOT IN THE RELEASE OR ABSTRACT" displayLines={["ALASKA'S SPLIT", 'NOT IN THE RELEASE OR ABSTRACT']} y={640} size={28} tone="count" p={win(f, b(37) + 8, b(38))} />
          <Plate x={540} text="COULD BE BIGGER · OR SMALLER" y={756} size={28} tone="dark" p={win(f, b(38) + 4)} />
        </>}>
      <SVG>
        <DawnWorld f={f} seed={14} />
        <GlacierFront f={f} x={540} y={1060} w={900} lake seed={6} drip={1} />
        <rect data-band="ok" x={-60} y={1210} width={1200} height={800} fill={NB.gravelD} />
        {Array.from({length: 24}, (_, i) => <ellipse key={i} cx={h01(150, i) * 1100} cy={1230 + h01(151, i) * 650} rx={14 + 18 * h01(152, i)} ry={8 + 9 * h01(153, i)} fill={i % 2 ? NB.gravel : '#9A928A'} stroke={INK} strokeWidth={2.5} data-band="ok" />)}
        {/* the survey stake with its arm and the empty pan */}
        <g>
          <ContactShadow cx={820} cy={1262} rx={40} ry={9} opacity={0.45} />
          <rect x={810} y={sy - 240} width={20} height={1262 - (sy - 240)} fill={NB.oakD} stroke={INK} strokeWidth={4} />
          <path d={`M 820 ${sy - 230} L ${sx} ${sy - 230}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <path d={`M 820 ${sy - 230} L ${sx} ${sy - 230}`} stroke={NB.brass} strokeWidth={7} strokeLinecap="round" />
          <g transform={`translate(${sx} ${sy}) scale(1.5) translate(${-sx} ${-sy})`}><SpringScale f={f} x={sx} y={sy - 160} ext={0} empty swing={landed ? 0.4 : 1} seed={4} /></g>
          <HeldTravel f={f} x={sx - 160} y={sy - 260} w={320} h={360} mode="sweep" seed={141}><rect x={sx - 150} y={sy - 250} width={300} height={340} fill={NB.brass} opacity={0.02} /></HeldTravel>
          <g transform={`translate(820 ${sy - 250}) rotate(${(1 - turn) * 20})`}>
            <Nib f={f} x={0} y={0} s={0.34} emotion="curious" look={f < b(37) ? -0.8 : 0.4} lookY={f < b(37) ? 0.6 : -0.4} splay={f >= b(38) ? 0.6 : 0} label={false} cues={[b(36), b(37), b(38)]} seed={7} ink={0} />
          </g>
        </g>
        {fly > 0 && (
          <g transform={`translate(${lerp(1120, sx, fly)} ${lerp(500, sy - 40, fly) + 60 * Math.sin(fly * Math.PI * 3)}) rotate(${(1 - fly) * 60 + (landed ? 3 * Math.sin(f / 9) : 0)})`}>
            <rect x={-70} y={-24} width={140} height={48} rx={6} fill={NB.vellumL} stroke={NB.cobalt} strokeWidth={4} />
            <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={NB.cobalt}>WHY?</text>
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S15: THE MAP ENDS (both hands at rest; no question plate)
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const run = easeIO(f, b(39) - 4, 36);
  const edge = 880;
  const nx = lerp(420, edge + 40, run);
  const rest = easeIO(f, b(40) - 6, 20);
  const step = easeIO(f, b(40) + 4, 18);
  const stroke = easeIO(f, b(40) + 22, 14);
  return (
    <Frame p={p} z0={1.0} z1={1.06} warmth={0.05} overlay={<>
          <Plate x={540} text="THE MAP ENDS · CIRCA 2020" y={530} size={32} tone="dark" p={win(f, b(39) + 10, b(40))} />
          <Plate x={540} text="NEXT MAP · NOT DRAWN YET" y={606} size={32} tone="dark" p={win(f, b(40) + 4)} />
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
        <NLab x={edge - 70} y={700} text="THE MAP ENDS · CIRCA 2020" size={18} rot={90} />
        <path d={`M 420 980 L ${Math.min(edge, nx)} 980`} stroke={NB.ultra} strokeWidth={6} strokeLinecap="round" />
        {stroke > 0.5 && <circle cx={edge + 70} cy={1000} r={6} fill={NB.ultra} />}
        <Nib f={f} x={nx + 40 * step} y={980 + 20 * step - 14 * Math.sin(stroke * Math.PI)} s={0.6} emotion={run >= 1 ? 'curious' : 'focused'} stroke={(run > 0 && run < 1) || (stroke > 0 && stroke < 1) ? 1 : 0} splay={run >= 1 ? 0.5 : 0} look={run >= 1 ? 0.3 : 0} lookY={run >= 1 ? 0.8 : 0} cues={[b(39), b(40)]} seed={7} ink={run >= 1 ? 0 : 1} />
        {rest > 0.01 && <CheckHand f={f} x={lerp(1150, 950, rest)} y={lerp(1500, 1200, rest)} s={1.0} angle={-60} role="study" />}
        {rest > 0.01 && <CheckHand f={f} x={lerp(60, 210, rest)} y={lerp(1700, 1250, rest)} s={1.0} angle={200} role="ours" />}
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15, 16: S16};
const SHOT_ORDER = [1, 3, 4, 5, 6, 7, 8, 16, 9, 10, 11, 12, 13, 14, 15];

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
