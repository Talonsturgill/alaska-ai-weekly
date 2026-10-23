import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK, ContactShadow} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {snap, bump, rnd, MONO, monoW, HollowQ} from './lib/prospect';
import {FormGradient, tones} from './lib/lighting';
import {PM, Dotty, PTag, RainGauge, Building, Stair, Hatch, ParcelPlane, SnowMorningBG, PaperRoomBG, BigBook, BLD, FLOOR_H, floorTop, stairPoint, cellXY, PARCEL} from './lib/permit';
import {SeedDrone} from './lib/evidence_state';
import {ForecastTrace} from './lib/forecast';
import {Stamp} from './lib/folio';
import {IDS} from './Ep1023Ids';

// The Rule That Stops at the Fence, 2026-10-23. Palette roles are art_direction.json. EMERALD is only what the rule can reach (the borough's parcels, Dotty's header and ticks, the stamp ink).
// AMBER is only the loose dashed outline that asks who checks. Every Rainmaker line carries RAINMAKER SAYS or ITS WORDS on a putty tag, and the gallons and the inch are one company estimate that is never shrunk.
// Dotty is a labelled metaphor for a form and never reacts to a result with light. No source calls the drone's software AI and neither does the film. Every painted string is a claims.json on_screen string, a quote, or a plain label.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const SERIF = 'Fraunces, Georgia, serif';
const C = {ink: INK, paper: '#FFFDF4'};
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

type Tone = 'ink' | 'paper' | 'putty' | 'emerald' | 'amber' | 'indigo';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#1B2233', fg: PM.bone},
  paper: {fill: PM.bone, fg: '#1B2233'},
  putty: {fill: PM.kraft, fg: INK},
  emerald: {fill: PM.marigold, fg: INK},
  amber: {fill: '#FFF3D4', fg: PM.tealDeep},
  indigo: {fill: PM.lavDeep, fg: PM.lavHi},
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
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={28} letterSpacing={1} fill={PM.lavDeep} opacity={clamp01(type * 3)}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: a camera that can move to any focus, kick, grade ------------------------------------------------------------------------
const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; children: React.ReactNode}> =
({p, cam, z0 = 1, z1 = 1.05, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, bloom = 0.04, vignette = 0.24, ox = 540, oy = 960, tag = true, overlay, tagText = CHIP, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + lerp(dx0, dx1, t) + 7 * Math.sin(p.f / 23)}px, ${jl.y + lerp(dy0, dy1, t) + 9 * Math.sin(p.f / 17 + 1)}px) rotate(${0.3 * Math.sin(p.f / 31)}deg) translate(540px, 960px) scale(${c.z * jl.scale * (1 + 0.008 * Math.sin(p.f / 13))}) translate(${-c.fx}px, ${-c.fy}px)`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#1B2233" stroke={C.paper} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={C.paper}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.0} />
    </AbsoluteFill>
  );
};
/** a camera that eases between keyframes {t: frame, z, fx, fy} */
const track = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => {
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

// ---- shared pieces -----------------------------------------------------------------------------------------------------------------------------
const GF_Y = floorTop('ground') + FLOOR_H - 40;      // the ground floor's walking line (1306)
const SK_Y = floorTop('sky') + FLOOR_H - 40;
const STAIR_SOLID = 0.43;                            // the painted borough line is the ceiling of the lit floor
const TAG1 = ['ABOUT 0.01 IN', 'AUG 23RD', 'RAINMAKER SAYS'];
const TAG2 = ['OUTSIDE CHECK', 'NOT IN THE REPORTS', 'WE FOUND'];

/** a hollow question mark, ink outline and bone stroke, never amber or emerald */
const QMark: React.FC<{x: number; y: number; f: number; size?: number; k?: number; word?: string; rot?: number; bob?: number}> = ({x, y, f, size = 96, k = 1, word, rot = 0, bob = 7}) => {
  const kk = clamp01(k);
  if (kk <= 0.02) return null;
  const s = (size / 90) * (0.7 + 0.3 * Math.min(1, kk * 1.3));
  return (
    <g opacity={Math.min(1, kk * 2)} transform={`translate(${x},${y + bob * Math.sin(f / 13 + x * 0.01)}) rotate(${rot}) scale(${s})`}>
      <path d="M-26,-34 C-26,-78 28,-78 28,-34 C28,-8 0,-8 0,20" fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" />
      <path d="M-26,-34 C-26,-78 28,-78 28,-34 C28,-8 0,-8 0,20" fill="none" stroke={PM.bone} strokeWidth={8} strokeLinecap="round" />
      <circle cx={0} cy={50} r={11} fill={INK} />
      <circle cx={0} cy={50} r={6.4} fill={PM.bone} />
      {word && <text x={0} y={86} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={2} fill={PM.bone} stroke={INK} strokeWidth={5} paintOrder="stroke">{word}</text>}
    </g>
  );
};

const FloorSign: React.FC<{k: 'sky' | 'state' | 'ground'; text: string; p: number}> = ({k, text, p}) => {
  const w = monoW(text, 22, 1.5) + 32;
  const y0 = floorTop(k) + FLOOR_H - 76;
  if (p <= 0.02) return null;
  return (
    <g opacity={clamp01(p)} transform={`translate(${BLD.x + BLD.w - 150},${y0})`}>
      <rect x={-w / 2 + 4} y={-17 + 5} width={w} height={34} rx={4} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-17} width={w} height={34} rx={4} fill={k === 'ground' ? PM.marigold : '#1B2233'} stroke={INK} strokeWidth={3.4} />
      <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={1.5} fill={k === 'ground' ? INK : PM.bone}>{text}</text>
    </g>
  );
};

/** the snowy building in cutaway with the rain gauge in the snow beside it (S1, S7, S13) */
const BuildingWorld: React.FC<{g: number; lit?: {sky?: number; state?: number; ground?: number}; signs?: {ground?: number; sky?: number; state?: number}; noon?: boolean; tag1?: number; tag2?: number; gaugeX?: number; gaugeScale?: number; children?: React.ReactNode}> =
({g, lit = {ground: 1, state: 0.06, sky: 0.04}, signs = {}, noon = false, tag1 = 0, tag2 = 0, gaugeX = 62, gaugeScale = 0.5, children}) => (
  <g>
    <SnowMorningBG f={g} horizon={1330} id="bw" flakes={noon ? 18 : 54} />
    <Building f={g} lit={lit}>
      <FloorSign k="ground" text="BOROUGH LAND" p={signs.ground ?? 0} />
      <FloorSign k="sky" text="FAA" p={signs.sky ?? 0} />
      <FloorSign k="state" text="STATE" p={signs.state ?? 0} />
      {children}
    </Building>
    <RainGauge x={gaugeX} y={1326} f={g} scale={gaugeScale} tag1={TAG1} tag1k={tag1} tag2={TAG2} tag2k={tag2} labels={false} id="bwg" />
  </g>
);

// ---- S1: the form rises (keys 1, 2, 3, 5) ------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t2 = b(2), t3 = b(3), t5 = b(5);
  const rise = snap(f, 8, 26);
  const dyy = GF_Y + (1 - Math.min(1.12, rise)) * 190;
  const squash = bump(f, 34, 18);
  const strike = ease(f, t3 + 3, 6);
  const down = f < t3 + 16 ? snap(f, t3 - 8, 8) : 1 - ease(f, t3 + 16, 10);
  const cam = track([
    {t: 0, z: 1.0, fx: 540, fy: 960},
    {t: 44, z: 1.06, fx: 520, fy: 1020},
    {t: 80, z: 2.3, fx: 470, fy: 1190},
    {t: t2 - 6, z: 2.3, fx: 470, fy: 1190},
    {t: t2 + 34, z: 1.0, fx: 540, fy: 960},
    {t: t3 - 22, z: 1.0, fx: 540, fy: 960},
    {t: t3 + 4, z: 2.5, fx: 380, fy: 1170},
    {t: p.dur, z: 2.5, fx: 390, fy: 1170},
  ]);
  const qk = ease(f, t2 + 12, 10);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="THE WEATHER RULE IS A FORM" displayLines={['THE WEATHER RULE', 'IS A FORM']} y={640} size={44} tone="ink" p={ease(f, 10, 8) * (f < t2 + 2 ? 1 : 1 - ease(f, t2 + 2, 8))} />
        <Plate x={540} text="OCT 20TH" y={640} size={52} tone="emerald" p={ease(f, t3 + 4, 8)} />
        <Plate x={540} text="KENAI PENINSULA BOROUGH ASSEMBLY" displayLines={['KENAI PENINSULA', 'BOROUGH ASSEMBLY']} y={800} size={34} tone="paper" p={ease(f, t3 + 46, 10)} />
        <Plate x={540} text="IN EFFECT RIGHT AWAY" y={980} size={38} tone="emerald" p={ease(f, t5, 8)} />
      </>}>
      <SVG>
        <BuildingWorld g={g} signs={{ground: ease(f, t2 + 8, 14)}}>
          <QMark x={540} y={floorTop('sky') + 130} f={g} size={84} k={qk} />
          <QMark x={540} y={floorTop('state') + 130} f={g + 30} size={84} k={qk} />
          <rect x={BLD.x + 370} y={GF_Y - 6} width={140} height={14} rx={5} fill="#1B1620" stroke={INK} strokeWidth={4} />
          <g clipPath="url(#s1clip)">
            <Dotty x={440} y={dyy} f={g} scale={0.36} mood="proud" sq={squash} sticker={ease(f, 44, 8)} look={0.4} armL={f > 40 ? 20 : 130} armR={f > 40 ? 26 : 130} id="s1d" />
          </g>
          <clipPath id="s1clip"><rect x={0} y={0} width={1080} height={GF_Y + 2} /></clipPath>
          <g transform="translate(300,1190) rotate(-2)">
            <rect x={-56} y={-38} width={116} height={86} rx={4} fill="#000" opacity={0.22} transform="translate(5,6)" />
            <rect x={-60} y={-42} width={120} height={86} rx={4} fill={PM.paper} stroke={INK} strokeWidth={3.4} />
            {[-18, -2, 14].map((yy) => <rect key={yy} x={-46} y={yy + 8} width={92 - (yy === 14 ? 30 : 0)} height={4} rx={2} fill={PM.paperDeep} />)}
            <circle cx={0} cy={-42} r={5} fill={INK} />
            {strike > 0.02 && (
              <g opacity={clamp01(strike * 2)} transform={`scale(${1 + 0.12 * (1 - strike)})`}>
                <rect x={-48} y={-30} width={96} height={34} rx={4} fill="none" stroke={PM.marigoldDeep} strokeWidth={4} transform="rotate(-3)" />
                <text x={0} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={11} letterSpacing={0.3} fill={PM.marigoldDeep} transform="rotate(-3)">OCT 20TH</text>
              </g>
            )}
          </g>
          {f > t3 - 14 && f < t3 + 30 && (
            <Stamp x={300} y={1186} f={g} scale={0.3} down={down} ink={0} lines={['OCT 20TH']} size={40} color={PM.marigoldDeep} rot={-3} id="s1st" />
          )}
          {f > t5 - 2 && (
            <g transform={`translate(${690},${GF_Y - 210}) rotate(${6 * Math.sin((f - t5) / 6) * Math.exp(-(f - t5) / 30)})`} opacity={clamp01((f - t5) / 6)}>
              <PTag lines={['IN EFFECT', 'RIGHT AWAY']} size={19} tone="putty" k={1} f={g} drop={30} sway={3} />
            </g>
          )}
        </BuildingWorld>
      </SVG>
    </Frame>
  );
};

// ---- S2: borough land (keys 6, 7, 8, 9, 56, 10) --------------------------------------------------------------------------------------------------
const PL = {x0: 380, y0: 700, sc: 0.85};
const dp0 = {x: 380 + 0.85 * (525 - 0.42 * 300), y: 700 + 0.85 * 0.62 * 300};
const pj = (cx: number, cy: number) => ({x: PL.x0 + PL.sc * (cx - 0.42 * cy), y: PL.y0 + PL.sc * 0.62 * cy});
const BOROUGH = [2, 3, 7, 8, 9, 12, 13, 14, 17, 18, 19, 23, 24];
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t6 = b(6), t7 = b(7), t8 = b(8), t9 = b(9), t56 = b(56), t10 = b(10);
  const tilt = ease(f, 0, 26);
  const lit = ease(f, t6, 26);
  const walkX = lerp(-120, dp0.x, easeIO(f, t7 - 36, 84));
  const walking = f > t7 - 36 && f < t7 + 48;
  const berry = pj(375, 300), dp = pj(525, 300);
  const lean = f < t9 ? 0 : f < t10 ? -6 : f < t10 + 14 ? lerp(-6, 5, ease(f, t10, 12)) : 5;
  const glyph = snap(f, t10, 10);
  const trackK = ease(f, t56 + 4, 30);
  const cam = track([
    {t: 0, z: 1.0, fx: 540, fy: 820},
    {t: t8 + 10, z: 1.06, fx: 560, fy: 900},
    {t: t9 + 24, z: 1.75, fx: 680, fy: 900},
    {t: p.dur, z: 1.85, fx: 690, fy: 900},
  ]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="BOROUGH LAND" y={560} size={40} tone="emerald" p={ease(f, t6, 8) * (f < t7 - 2 ? 1 : 1 - ease(f, t7 - 2, 8))} />
        <Plate x={540} text="COMMERCIAL LEASE OR LAND USE PERMIT" displayLines={['COMMERCIAL LEASE', 'OR LAND USE PERMIT']} y={620} size={36} tone="ink" p={ease(f, t7 + 8, 8) * (f < t9 - 2 ? 1 : 1 - ease(f, t9 - 2, 8))} />
        <Plate x={540} text="BERRY PICKING" y={600} size={38} tone="paper" p={ease(f, t56, 8) * (f < t10 ? 1 : 0)} />
        <Plate x={540} text="SKIING" y={668} size={38} tone="paper" p={ease(f, t56 + 28, 8) * (f < t10 ? 1 : 0)} />
        <Plate x={540} text="GEOENGINEERING BANNED · CASUAL-USE LAND" displayLines={['GEOENGINEERING BANNED', 'CASUAL-USE LAND']} y={640} size={36} tone="ink" p={ease(f, t10 + 4, 8)} />
      </>}>
      <SVG>
        <SnowMorningBG f={g} horizon={470} id="s2" flakes={50} near={false} />
        <g transform={`translate(0,${(1 - tilt) * -60}) `} opacity={tilt}>
          <ParcelPlane x={PL.x0} y={PL.y0} scale={PL.sc} borough={BOROUGH} lit={lit} f={g} id="s2p" />
        </g>
        {/* the casual use parcel: a berry bush and ski tracks, in screen space on the plane */}
        <g>
          <ContactShadow cx={berry.x + 6} cy={berry.y + 34} rx={64} ry={11} opacity={0.3} blur={7} />
          {[[-34, 4, 26], [8, -12, 32], [38, 8, 24], [-8, 18, 22], [22, -2, 20]].map(([dx, dy, r], i) => (
            <g key={i} transform={`translate(${berry.x + dx},${berry.y + dy + 6 * Math.sin(g / 14 + i)})`}>
              <circle r={r} fill={PM.spruceHi} stroke={INK} strokeWidth={4} />
              <circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.4} fill={PM.marigoldHi} opacity={0.25} />
            </g>
          ))}
          {[[-26, -6], [-6, -20], [18, -14], [34, 6], [-14, 10], [10, 14]].map(([dx, dy], i) => <circle key={i} cx={berry.x + dx} cy={berry.y + dy + 4 * Math.sin(g / 14 + i)} r={5} fill="#4B3D91" stroke={INK} strokeWidth={2} opacity={f > t56 - 2 ? 1 : 0.9} />)}
          {[-1, 1].map((s) => {
            const d = `M${berry.x - 130 + s * 14},${berry.y + 70} C${berry.x - 40 + s * 14},${berry.y + 20} ${berry.x + 40 + s * 14},${berry.y + 70} ${berry.x + 140 + s * 14},${berry.y + 30}`;
            return <path key={s} d={d} fill="none" stroke="#7E8C96" strokeWidth={5} strokeLinecap="round" strokeDasharray="400" strokeDashoffset={400 * (1 - trackK)} />;
          })}
        </g>
        {glyph > 0.02 && (
          <g transform={`translate(${berry.x},${berry.y - 20}) scale(${glyph * 1.0}) rotate(${4 * Math.sin((f - t10) / 3) * Math.exp(-(f - t10) / 20)})`}>
            <circle r={104} fill="#FFFFFF" opacity={0.92} stroke={INK} strokeWidth={9} />
            <circle r={84} fill="none" stroke={INK} strokeWidth={12} />
            <path d="M-60,-60 L60,60" stroke={INK} strokeWidth={14} strokeLinecap="round" />
          </g>
        )}
        {/* the rain gauge stands beside Dotty's parcel, bare hooks */}
        <RainGauge x={dp.x + 185} y={dp.y + 50} f={g} scale={0.46} labels={false} id="s2g" />
        {f > t7 - 36 && <Dotty x={walking ? walkX : dp.x} y={dp.y + 28} f={g} scale={0.5} mood={f < t10 ? 'proud' : f < t10 + 40 ? 'wary' : 'proud'} tack={ease(f, t8, 10)} walk={walking ? (f - t7) / 4 : 0} lean={lean} armR={f >= t10 && f < t10 + 40 ? 70 : 20} look={f >= t9 ? -0.8 : 0.3} id="s2d" />}
      </SVG>
    </Frame>
  );
};

// ---- S3: her four boxes (keys 11, 12, 13, 14) -----------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t11 = b(11), t12 = b(12), t13 = b(13), t14 = b(14);
  const fill = ease(f, t11 + 4, 24) + ease(f, t12, 20) + ease(f, t13, 20) + ease(f, t14, 20);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000}
      overlay={<>
        <Plate x={540} text="THE FORM ASKS" y={560} size={40} tone="emerald" p={ease(f, t11, 8) * (f < t13 - 2 ? 1 : 1 - ease(f, t13 - 2, 6))} />
        <Plate x={540} text="HOW OFTEN · HOW LONG" y={560} size={38} tone="ink" p={ease(f, t13 + 2, 8) * (f < t14 - 2 ? 1 : 1 - ease(f, t14 - 2, 6))} />
        <Plate x={540} text="THE OUTCOME THEY INTEND" y={560} size={36} tone="emerald" p={ease(f, t14 + 2, 8)} />
      </>}>
      <SVG>
        <PaperRoomBG f={g} deskY={1250} id="s3" />
        <RainGauge x={700} y={1290} f={g} scale={0.78} labels id="s3g" />
        <Dotty x={400} y={1500} f={g} scale={1.85} mood={fill < 3.6 ? 'read' : 'beam'} fill={fill} look={0.4} armL={24} armR={fill > 3.9 ? 60 : 26} id="s3d" />
      </SVG>
    </Frame>
  );
};

// ---- S4: August 23rd, the late summer bay (keys 15, 16, 17, 18) ---------------------------------------------------------------------------------
const SummerSkyBG: React.FC<{f: number; id: string; clouds?: boolean}> = ({f, id, clouds = true}) => (
  <g>
    <defs>
      <linearGradient id={`${id}sk`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FB8DE" /><stop offset="1" stopColor="#F5E3B0" /></linearGradient>
      <radialGradient id={`${id}sun`} cx="0.1" cy="0.45" r="0.7"><stop offset="0" stopColor={PM.sun} stopOpacity={0.6} /><stop offset="1" stopColor={PM.sun} stopOpacity={0} /></radialGradient>
    </defs>
    <rect data-band="ok" x={-60} y={-60} width={1200} height={2040} fill={`url(#${id}sk)`} />
    <rect data-band="ok" x={-60} y={-60} width={1200} height={2040} fill={`url(#${id}sun)`} />
    {clouds && [[200, 300, 1.3], [760, 220, 1.0], [520, 1420, 1.5], [60, 1320, 1.0], [900, 1380, 1.2]].map(([cx, cy, sc], i) => {
      const dx = ((g0(f) * (0.16 + i * 0.04) + cx * 2) % 1500) - 200;
      return (
        <g key={i} transform={`translate(${dx},${cy}) scale(${sc})`} opacity={0.88}>
          <ellipse cx={0} cy={0} rx={150} ry={34} fill="#FFFFFF" />
          <ellipse cx={-70} cy={-20} rx={80} ry={36} fill="#FFFFFF" />
          <ellipse cx={50} cy={-26} rx={90} ry={40} fill="#FFFFFF" />
          <ellipse cx={0} cy={14} rx={170} ry={14} fill="#DDEBF3" opacity={0.8} />
        </g>
      );
    })}
  </g>
);
const g0 = (f: number) => f;

const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t15 = b(15), t16 = b(16), t17 = b(17), t18 = b(18);
  const homer = {x: 300, y: 1150}, pinA = {x: 760, y: 560}, pinB = {x: 880, y: 515};
  // the drone lifts off pin A, hops to pin B, then climbs away northeast
  const lift = easeIO(f, t17, 36);
  const hop = easeIO(f, t17 + 30, 40);
  const away = easeIO(f, t17 + 80, 70);
  const dx = lerp(lerp(pinA.x, pinB.x, hop), 1040, away);
  const dy = lerp(lerp(pinA.y, pinB.y, hop), 330, away) - 90 * lift;
  const lineK = ease(f, t18 - 6, 34);
  const cam = track([{t: 0, z: 1.0, fx: 560, fy: 820}, {t: p.dur, z: 1.12, fx: 610, fy: 900}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={250} text="AUG 23RD" y={590} size={40} tone="paper" p={snap(f, t15 + 4, 10)} rot={-3} />
        <Plate x={690} text="20 MILES NE OF HOMER" y={1215} size={36} tone="ink" p={ease(f, t18, 8)} />
      </>}>
      <SVG>
        <defs><linearGradient id="s4sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#58A9D6" /><stop offset="1" stopColor={PM.bayDeep} /></linearGradient></defs>
        <rect data-band="ok" x={-60} y={-60} width={1200} height={2040} fill="url(#s4sea)" />
        {Array.from({length: 30}).map((_, i) => <path key={i} d={`M${60 + rnd(i + 3) * 900},${700 + rnd(i + 9) * 800} q16,-9 32,0`} fill="none" stroke="#C9E8F7" strokeWidth={3} opacity={0.35 + 0.35 * Math.abs(Math.sin(g / (20 + i) + i))} />)}
        <path d="M-60,-60 L1140,-60 L1140,430 L900,560 L760,690 L640,790 L520,860 L430,900 L380,960 L340,1060 L318,1140 L300,1170 L282,1140 L300,1060 L326,960 L260,930 L120,960 L-60,1000 Z" fill={PM.summerGrass} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d="M900,560 L760,690 L640,790 L520,860 L430,900" fill="none" stroke="#F6EDC5" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
        {[[160, 300], [420, 180], [900, 260], [600, 420], [220, 700], [1000, 640]].map(([tx, ty], i) => (
          <g key={i} transform={`translate(${tx},${ty})`}>{[0, 1, 2].map((j) => <path key={j} d={`M${j * 30 - 30},0 L${j * 30 - 44},0 L${j * 30 - 30},-62 L${j * 30 - 16},0 Z`} fill={PM.summerGrassDeep} stroke={INK} strokeWidth={2.4} />)}</g>
        ))}
        <rect data-band="ok" x={-60} y={-60} width={1200} height={2040} fill={PM.sun} opacity={0.1} />
        {/* the launch pins and the Homer pin */}
        {[pinA, pinB].map((pp, i) => (
          <g key={i} transform={`translate(${pp.x},${pp.y})`}>
            <ellipse cx={0} cy={4} rx={26} ry={8} fill="#000" opacity={0.3} />
            <path d="M0,0 C-26,-30 -20,-62 0,-62 C20,-62 26,-30 0,0 Z" fill="#1B2233" stroke={INK} strokeWidth={4} />
            <circle cx={0} cy={-42} r={7} fill={PM.bone} />
          </g>
        ))}
        <g transform={`translate(${homer.x},${homer.y})`}>
          <ellipse cx={0} cy={4} rx={26} ry={8} fill="#000" opacity={0.3} />
          <path d="M0,0 C-26,-30 -20,-62 0,-62 C20,-62 26,-30 0,0 Z" fill="#1B2233" stroke={INK} strokeWidth={4} />
          <circle cx={0} cy={-42} r={7} fill={PM.bone} />
          <text x={42} y={-30} fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={2} fill={INK} stroke="#FFFFFF" strokeWidth={6} paintOrder="stroke">HOMER</text>
        </g>
        {lineK > 0.01 && (
          <path d={`M${homer.x},${homer.y - 40} L${lerp(homer.x, 820, lineK)},${lerp(homer.y - 40, 520, lineK)}`} stroke={INK} strokeWidth={9} strokeDasharray="22 16" strokeDashoffset={-g * 0.8} strokeLinecap="round" opacity={0.85} />
        )}
        {/* the drone: its shadow on the shore, then the drone */}
        <ellipse cx={dx + 30 * lift} cy={lerp(lerp(pinA.y, pinB.y, hop), 330, away) + 20 + 40 * lift} rx={64 - 20 * lift} ry={14} fill="#000" opacity={0.28 - 0.08 * lift} />
        {f > t17 - 6 && <SeedDrone f={g} x={dx} y={dy} scale={0.46} flareLoad={0.8} />}
        <g transform={`translate(${lerp(560, 700, snap(f, t16, 14))},${470}) rotate(${(1 - snap(f, t16, 14)) * 38})`} opacity={clamp01((f - t16 + 2) / 5)}>
          <PTag lines={['RAINMAKER', 'CALIFORNIA']} size={22} tone="putty" k={1} f={g} drop={34} sway={3} />
        </g>
        {Array.from({length: 4}).map((_, i) => {
          const cx = ((g * (0.5 + i * 0.1) + i * 380) % 1500) - 200;
          return <ellipse key={i} cx={cx} cy={1380 + i * 36} rx={150 + i * 20} ry={26} fill="#FFFFFF" opacity={0.55} />;
        })}
      </SVG>
    </Frame>
  );
};

// ---- S5: the silver iodide, the tile and the dive (keys 19, 20, 21, 22, 23, 24) -------------------------------------------------------------------
const WeighingPan: React.FC<{x: number; y: number; heap: number; f: number}> = ({x, y, heap, f}) => {
  const t = tones(PM.steel);
  return (
    <g transform={`translate(${x},${y})`}>
      <FormGradient id={`wp${Math.round(x)}`} t={t} softness={0.6} />
      <ContactShadow cx={0} cy={8} rx={120} ry={16} opacity={0.34} blur={9} />
      <path d="M-40,0 L-26,-70 L26,-70 L40,0 Z" fill={`url(#wp${Math.round(x)})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <rect x={-86} y={-34} width={172} height={30} rx={8} fill={PM.slateDeep} stroke={INK} strokeWidth={5} />
      <text x={0} y={-12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={PM.tealHi}>{heap > 0.02 ? `${Math.round(375 * clamp01(heap))} G` : '0 G'}</text>
      <ellipse cx={0} cy={-84} rx={96} ry={20} fill={`url(#wp${Math.round(x)})`} stroke={INK} strokeWidth={5.5} />
      <ellipse cx={0} cy={-90} rx={80} ry={12} fill="#EEF3F6" opacity={0.7} />
      {heap > 0.02 && <path d={`M${-34 * heap},-92 Q0,${-92 - 52 * heap} ${34 * heap},-92 Z`} fill="#E9EEF1" stroke={INK} strokeWidth={4} strokeLinejoin="round" />}
    </g>
  );
};
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t19 = b(19), t20 = b(20), t21 = b(21), t22 = b(22), t23 = b(23), t24 = b(24);
  const heap = ease(f, t20 - 4, 70);
  const phaseB = easeIO(f, t21 - 8, 26);                 // the tile slides up over the sky
  const flood = ease(f, t23 + 6, 40);
  const count = Math.round(19 * ease(f, t23, 30));
  const dive = easeIO(f, t24, 24);
  const phaseC = ease(f, t24 + 14, 10);
  const cam = f < t24
    ? {z: 1.0 + 0.04 * clamp01(f / 200), fx: 540, fy: 960}
    : {z: lerp(1.04, 4.2, dive), fx: lerp(540, 900, dive), fy: lerp(960, 1240, dive)};
  const tagPeel = easeIO(f, t24 + 30, 22);
  const tagX = lerp(330, 700, tagPeel), tagY = lerp(960, 878, tagPeel) - 160 * Math.sin(tagPeel * Math.PI);
  const wy = 1210;
  return (
    <Frame p={p} cam={(ff) => cam} tag
      overlay={<>
        <Plate x={540} text="ITS REPORT · SILVER IODIDE" displayLines={['ITS REPORT', 'SILVER IODIDE']} y={600} size={36} tone="putty" p={ease(f, t19, 8) * (1 - phaseB)} />
        <Plate x={540} text="ABOUT 375 G · ITS REPORT" y={1090} size={34} tone="ink" p={ease(f, t20, 8) * (1 - phaseB)} />
        <Plate x={540} text={`RAINMAKER SAYS · ${f >= t23 ? count : 0} MILLION GALLONS`} displayLines={['RAINMAKER SAYS', `${f >= t23 ? count : 0} MILLION GALLONS`]} y={600} size={36} tone="ink" p={ease(f, t23, 8)} />
        <Plate x={540} text="100 SQUARE MILES" y={720} size={34} tone="paper" p={ease(f, t24 - 2, 8) * (1 - phaseC)} />
        {/* the cross section the dive arrives at, in screen space */}
        {phaseC > 0.01 && (
          <g opacity={phaseC}>
            <rect data-band="ok" x={0} y={0} width={1080} height={1920} fill="#D9E8DA" />
            <rect data-band="ok" x={0} y={1180} width={1080} height={740} fill={PM.summerGrassDeep} stroke={INK} strokeWidth={8} />
            <rect x={0} y={1176} width={1080} height={4} fill={PM.water} />
            <path d="M0,1176 L1080,1176" stroke={PM.waterDeep} strokeWidth={1.6} />
            <rect x={150} y={880} width={34} height={300} fill="#FFFFFF" opacity={0.55} stroke={INK} strokeWidth={5} />
            {Array.from({length: 11}).map((_, i) => <path key={i} d={`M${i % 5 === 0 ? 120 : 134},${1180 - i * 30} L150,${1180 - i * 30}`} stroke={INK} strokeWidth={3} />)}
            <text x={112} y={870} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={26} fill={INK}>1 IN</text>
            <path d="M170,1174 L330,1090" stroke={INK} strokeWidth={5} />
            <RainGauge x={620} y={1180} f={g} scale={1.0} labels tag1={undefined} tag2={undefined} id="s5g" />
          </g>
        )}
        {phaseC > 0.01 && (
          <g opacity={phaseC}>
            <g transform={`translate(${tagX},${tagY})`}><PTag lines={TAG1} size={20} tone="putty" k={1} f={g} drop={30} sway={tagPeel < 0.99 ? 0 : 3} /></g>
            <Plate x={400} text="ABOUT 0.01 IN" y={1060} size={34} tone="paper" p={ease(f, t24 + 22, 8)} />
          </g>
        )}
      </>}>
      <SVG>
        {/* phase A: the drone pours into the pan */}
        <g transform={`translate(0,${-1900 * phaseB})`}>
          <SummerSkyBG f={g} id="s5a" />
          <path d={`M540,880 C540,980 ${540 + 4 * Math.sin(g / 5)},1040 540,1100`} stroke="#EEF3F6" strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray="6 9" strokeDashoffset={-g * 4} opacity={ease(f, t19, 6)} />
          <SeedDrone f={g} x={540} y={780 + 6 * Math.sin(g / 18)} scale={1.0} flareLoad={0.8} />
          <WeighingPan x={540} y={1240} heap={heap} f={g} />
        </g>
        {/* phase B: the tile */}
        <g transform={`translate(0,${1900 * (1 - phaseB)})`}>
          <rect data-band="ok" x={-60} y={-60} width={1200} height={2040} fill={PM.summerGrass} />
          {Array.from({length: 7}).map((_, i) => <path key={i} d={`M${-60},${160 + i * 280} L1140,${160 + i * 280}`} stroke={PM.summerGrassDeep} strokeWidth={3} opacity={0.35} />)}
          <rect x={130} y={640} width={620} height={620} rx={8} fill="#F6EDC5" stroke={INK} strokeWidth={9} />
          {Array.from({length: 5}).map((_, i) => <path key={i} d={`M${130 + (i + 1) * 103},640 L${130 + (i + 1) * 103},1260 M130,${640 + (i + 1) * 103} L750,${640 + (i + 1) * 103}`} stroke={PM.summerGrassDeep} strokeWidth={2.2} opacity={0.45} />)}
          {flood > 0.01 && (
            <g>
              <rect x={440 - 310 * flood} y={950 - 310 * flood} width={620 * flood} height={620 * flood} rx={8} fill={PM.waterHi} opacity={0.82} />
              {[0, 1, 2].map((i) => <rect key={i} x={440 - 310 * flood + 18 + 30 * ((g / 14 + i) % 3)} y={950 - 310 * flood + 18 + 30 * ((g / 14 + i) % 3)} width={Math.max(0, 620 * flood - 36 - 60 * ((g / 14 + i) % 3))} height={Math.max(0, 620 * flood - 36 - 60 * ((g / 14 + i) % 3))} rx={6} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.5} />)}
            </g>
          )}
          <rect x={130} y={640} width={620} height={620} rx={8} fill="none" stroke={INK} strokeWidth={9} />
          {/* the ruler: one inch is 300 px, so a hundredth of an inch is a 3 px hairline at its foot */}
          <rect x={866} y={960} width={78} height={300} fill="#FFFDF4" stroke={INK} strokeWidth={5} />
          {Array.from({length: 11}).map((_, i) => <path key={i} d={`M${i % 5 === 0 ? 880 : 896},${1260 - i * 30} L930,${1260 - i * 30}`} stroke={INK} strokeWidth={i % 5 === 0 ? 3.4 : 2.2} />)}
          <text x={905} y={940} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={INK}>1 IN</text>
          {f >= t22 - 2 && <rect x={880} y={1257} width={50} height={3} fill={PM.waterDeep} stroke={PM.teal} strokeWidth={ease(f, t22, 6) * 3} />}
          <g transform={`translate(${200},${620}) rotate(${(1 - snap(f, t21, 14)) * -30})`} opacity={clamp01((f - t21 + 2) / 5)}>
            {f < t24 + 30 && <PTag lines={['RAINMAKER SAYS']} size={24} tone="putty" k={1} f={g} drop={34} sway={3} />}
          </g>
        </g>
        {f >= t22 && f < t24 && <Plate x={905} text="ABOUT 0.01 IN OF RAIN" displayLines={['ABOUT 0.01 IN', 'OF RAIN']} y={880 + 1900 * (1 - phaseB)} size={24} tone="paper" p={ease(f, t22 + 4, 8)} />}
      </SVG>
    </Frame>
  );
};

// ---- S6: Stratus (keys 25, 60, 26) -----------------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t25 = b(25), t60 = b(60), t26 = b(26);
  const obs: Array<[number, number]> = [[0, 250], [70, 210], [140, 232], [210, 170], [280, 188], [350, 130]];
  const pred: Array<[number, number]> = [[350, 130], [420, 96], [490, 118], [560, 62], [630, 80], [700, 34]];
  const click = snap(f, t26, 8);
  const barX = 140, barW = 800;
  const segW = barW / 6;
  const winX = barX + segW * 3;
  const droneX = lerp(barX + 40, winX + segW / 2, easeIO(f, t25 + 20, t26 - t25 + 20));
  const qk = ease(f, t26 + 8, 10);
  const qy = 940 - 40 * ease(f, t26 + 8, 20) - (f > t26 + 70 ? 900 * easeIO(f, t26 + 70, 40) : 0);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 900}, {t: p.dur, z: 1.04, fx: 540, fy: 930}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="REAL TIME WEATHER" y={570} size={34} tone="ink" p={ease(f, t25 + 4, 8) * (f < t60 - 2 ? 1 : 0)} />
        <Plate x={540} text="ITS WORDS · STRATUS" y={570} size={38} tone="putty" p={ease(f, t60, 8)} />
        <Plate x={540} text="PICKS THE SEEDING WINDOWS" displayLines={['PICKS THE', 'SEEDING WINDOWS']} y={1235} size={34} tone="paper" p={ease(f, t26 + 6, 8)} />
      </>}>
      <SVG>
        <SummerSkyBG f={g} id="s6" />
        <rect x={100} y={630} width={880} height={410} rx={18} fill="#FFFDF4" stroke={INK} strokeWidth={8} opacity={0.96} />
        <rect x={100} y={630} width={880} height={44} rx={18} fill="#1B2233" stroke={INK} strokeWidth={8} />
        {Array.from({length: 18}).map((_, i) => {
          const tx = 130 + ((i * 47 + g * 3) % 820);
          return <rect key={i} x={tx} y={642} width={4} height={20} fill={PM.tealHi} opacity={0.4 + 0.5 * rnd(i + 5)} />;
        })}
        <ForecastTrace observed={obs} predicted={pred} spread={44} f={g} drawn={ease(f, t25 + 30, 90)} observedDrawn={ease(f, t25 + 4, 40)} x={150} y={700} scale={0.95} nowLabel="NOW" />
        <rect x={barX} y={1090} width={barW} height={44} rx={8} fill="#FFFDF4" stroke={INK} strokeWidth={6} />
        {Array.from({length: 6}).map((_, i) => <path key={i} d={`M${barX + segW * i},1090 L${barX + segW * i},1134`} stroke={INK} strokeWidth={3} />)}
        <g transform={`translate(${winX},${1082 - 14 * (1 - click)}) scale(1,${0.9 + 0.1 * click})`} opacity={clamp01((f - t26 + 2) / 4)}>
          <rect x={0} y={0} width={segW} height={60} rx={7} fill={PM.kraft} fillOpacity={0.7} stroke={INK} strokeWidth={6} />
        </g>
        {f > t25 + 8 && <SeedDrone f={g} x={droneX} y={1024 + 6 * Math.sin(g / 15)} scale={0.34} flareLoad={0.8} />}
        <QMark x={winX + segW / 2} y={qy} f={g} size={92} k={qk} word="WHO" />
      </SVG>
    </Frame>
  );
};

// ---- S7: the stair that stops (keys 27, 28, 29, 30, 54) --------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t27 = b(27), t28 = b(28), t29 = b(29), t30 = b(30), t54 = b(54);
  const climbU = f < t28 ? 0 : STAIR_SOLID * easeIO(f, t28, t29 + 6 - t28);
  const foot = stairPoint(climbU);
  const draw = STAIR_SOLID + (1 - STAIR_SOLID) * easeIO(f, t29 + 4, 46);
  const walkPh = f > t28 && f < t29 + 8 ? (f - t28) / 3.6 : 0;
  const tip = f > t30 ? Math.sin(clamp01((f - t30) / 14) * Math.PI) * 0.5 + 0.5 : 0;
  const hatchP = ease(f, 0, 6);
  const rattle = f > t30 ? 1 : 0;
  const lineK = ease(f, t29, 20);
  const bounceT = t54 + 44;
  // the question mark floats down at the top of the stair, then bounces off the padlock and falls
  const hat = {x: 702, y: SK_Y + 4};
  let qx: number, qy: number;
  if (f < t30) { qx = lerp(640, 660, easeIO(f, 0, 30)); qy = lerp(590, 700, easeIO(f, 0, 40)); }
  else if (f < bounceT) { qx = lerp(660, hat.x - 30, easeIO(f, t30, bounceT - t30)); qy = lerp(700, hat.y - 70, easeIO(f, t30, bounceT - t30)); }
  else { const u = clamp01((f - bounceT) / 40); qx = lerp(hat.x - 30, 560, u); qy = lerp(hat.y - 70, 1100, u * u) - 60 * Math.sin(Math.min(1, u * 3) * Math.PI) * (1 - u); }
  const cam = track([
    {t: 0, z: 1.55, fx: 420, fy: 1230},
    {t: t28, z: 1.5, fx: 440, fy: 1200},
    {t: t29 + 10, z: 1.35, fx: 470, fy: 1050},
    {t: t30 + 8, z: 1.12, fx: 520, fy: 940},
    {t: p.dur, z: 1.0, fx: 540, fy: 960},
  ]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="SO WHAT CAN A BOROUGH REACH?" displayLines={['SO WHAT CAN A', 'BOROUGH REACH?']} y={640} size={42} tone="ink" p={ease(f, t27 + 6, 8) * (f < t28 + 10 ? 1 : 1 - ease(f, t28 + 10, 8))} />
        <QuotePlate x={540} text={'"LIMITED TO BOROUGH LANDS AT THIS POINT" · MAYOR MICCICHE'} y={700} wrap={20} size={32} p={ease(f, t29 - 2, 8) * (f < t54 - 4 ? 1 : 0)} type={ease(f, t29, 40)} />
        <QuotePlate x={540} text={'"THE FAA CONTROLS THE SKIES" · MAYOR MICCICHE'} y={700} wrap={22} size={34} p={ease(f, t54, 8)} type={ease(f, t54 + 4, 36)} />
        <Plate x={270} text="MAYOR PETER MICCICHE" displayLines={['MAYOR PETER', 'MICCICHE']} y={1000} size={28} tone="paper" p={ease(f, t28, 10) * (f < t29 - 6 ? 1 : 1 - ease(f, t29 - 6, 8))} rot={-3} />
      </>}>
      <SVG>
        <BuildingWorld g={g} signs={{ground: 1, sky: ease(f, t54 - 2, 8), state: 0}} tag1={1} lit={{ground: 1, state: 0.08, sky: 0.05}}>
          <QMark x={540} y={floorTop('state') + 130} f={g + 30} size={84} k={f < t54 + 60 ? 1 : 0} />
          <Stair f={g} draw={draw} solidTo={STAIR_SOLID} />
          <path d={`M${BLD.x + 4},${floorTop('state') + FLOOR_H} L${BLD.x + BLD.w - 4},${floorTop('state') + FLOOR_H}`} stroke={PM.marigold} strokeWidth={8} strokeDasharray="30 16" strokeDashoffset={-g * 0.6} opacity={lineK} />
          <Dotty x={foot.x + 17} y={foot.y - 4} f={g} scale={0.36} mood={f < t28 ? 'ask' : f < t30 ? 'proud' : 'wary'} walk={walkPh} lean={f > t30 ? 5 * tip : 0} armR={f > t30 ? 80 + 80 * tip : 20} armL={20} look={0.2} shadow id="s7d" />
          {/* the hatch is drawn dark at the apex from the first frame and only wakes later */}
          <g opacity={hatchP}>
            <Hatch x={hat.x} y={hat.y} f={g} scale={0.78} shake={rattle} />
          </g>
          <QMark x={qx} y={qy} f={g} size={70} k={1} />
        </BuildingWorld>
      </SVG>
    </Frame>
  );
};

// ---- the empty middle floor, seen from inside (S8, S10) -------------------------------------------------------------------------------------
const OFFICE_FLOOR = 1290;
/** fixture: 0 dead, 1 cold flicker. dashed: 0..1 the dashed outline glow that returns at beat 46 */
const OfficeBG: React.FC<{g: number; flick?: number; dashed?: number; holeX?: number}> = ({g, flick = 0, dashed = 0, holeX = 210}) => (
  <g>
    <defs>
      <linearGradient id="ofw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A3C54" /><stop offset="1" stopColor="#5A4A63" /></linearGradient>
    </defs>
    <rect x={-300} y={-500} width={1700} height={OFFICE_FLOOR + 500} fill="url(#ofw)" />
    {Array.from({length: 16}).map((_, i) => <rect key={i} x={-20 + i * 72} y={0} width={4} height={OFFICE_FLOOR} fill="#2B2236" opacity={0.35} />)}
    {/* the drawn blinds: cold grey daylight leaking through slats */}
    <rect x={640} y={250} width={330} height={560} rx={8} fill={PM.blind} stroke={INK} strokeWidth={8} />
    {Array.from({length: 17}).map((_, i) => <rect key={i} x={648} y={258 + i * 32} width={314} height={22} rx={4} fill="#8A91AE" stroke={INK} strokeWidth={2.4} opacity={0.9} />)}
    <path d={`M650,820 L960,820 L760,${OFFICE_FLOOR} L180,${OFFICE_FLOOR} Z`} fill="#A9B3C9" opacity={0.1} />
    <rect x={-300} y={OFFICE_FLOOR} width={1700} height={1200} fill="#3C3340" stroke={INK} strokeWidth={8} />
    {Array.from({length: 7}).map((_, i) => <path key={i} d={`M-60,${OFFICE_FLOOR + 30 + i * 60} L1140,${OFFICE_FLOOR + 22 + i * 60}`} stroke="#241D28" strokeWidth={3} opacity={0.6} />)}
    {/* the hole in the floor the dashed stair rises through */}
    <ellipse cx={holeX} cy={OFFICE_FLOOR + 6} rx={130} ry={28} fill="#14101A" stroke={INK} strokeWidth={7} />
    {/* the ceiling fixture */}
    <g transform="translate(540,80)">
      <path d="M0,-90 L0,0" stroke={INK} strokeWidth={6} />
      <ellipse cx={0} cy={8} rx={96} ry={20} fill={flick > 0 ? '#A9B3C9' : '#4A4F66'} stroke={INK} strokeWidth={6} opacity={flick > 0 ? 0.6 + 0.4 * flick : 1} />
      {dashed > 0.02 && <ellipse cx={0} cy={8} rx={112} ry={26} fill="none" stroke="#CDBF94" strokeWidth={5} strokeDasharray="12 9" strokeDashoffset={-g * 0.7} opacity={0.6 * dashed + 0.15 * Math.sin(g / 5)} />}
    </g>
    {dashed > 0.02 && <path d={`M470,100 L330,1010 L750,1010 L610,100 Z`} fill="#CDBF94" opacity={0.1 * dashed} />}
  </g>
);
/** the dashed ghost stair, rising from the floor hole up through the ceiling */
const GhostStair: React.FC<{g: number; holeX?: number; k?: number}> = ({g, holeX = 210, k = 1}) => (
  <g opacity={k}>
    {Array.from({length: 13}).map((_, i) => {
      const x = holeX + i * 50, y = OFFICE_FLOOR - i * 104;
      return <path key={i} d={`M${x - 8},${y} L${x + 50},${y} L${x + 50},${y - 104} L${x + 98},${y - 104}`} fill="none" stroke="#CDBF94" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12 9" strokeDashoffset={-g * 0.6} opacity={0.6} />;
    })}
  </g>
);
const Desk: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={0} rx={190} ry={18} opacity={0.4} blur={10} />
    <rect x={-170} y={-170} width={340} height={26} rx={6} fill={PM.woodDeep} stroke={INK} strokeWidth={6} />
    <rect x={-150} y={-144} width={22} height={144} fill={PM.woodDeep} stroke={INK} strokeWidth={5} />
    <rect x={128} y={-144} width={22} height={144} fill={PM.woodDeep} stroke={INK} strokeWidth={5} />
    <rect x={-100} y={-140} width={200} height={60} fill="#2B2236" stroke={INK} strokeWidth={4} />
    {/* the empty chair: a tall slatted back, a seat, a post and a star base */}
    <g opacity={0.95}>
      <rect x={-66} y={-330} width={132} height={150} rx={14} fill="#241D2C" stroke={INK} strokeWidth={6} />
      {[-36, -12, 12, 36].map((xx) => <rect key={xx} x={xx - 5} y={-316} width={10} height={118} rx={4} fill="#3A3043" />)}
      <rect x={-78} y={-182} width={156} height={26} rx={8} fill="#241D2C" stroke={INK} strokeWidth={6} />
      <rect x={-8} y={-156} width={16} height={104} fill="#241D2C" stroke={INK} strokeWidth={4} />
      <path d="M-70,-46 L0,-62 L70,-46 M-30,-30 L0,-62 L30,-30" stroke={INK} strokeWidth={9} strokeLinecap="round" fill="none" />
    </g>
  </g>
);

// ---- S8: the empty middle floor (keys 31, 58, 59, 32) ------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t31 = b(31), t58 = b(58), t59 = b(59), t32 = b(32);
  const fall = Easing.in(Easing.quad)(clamp01(f / 26));
  const qy = lerp(-90, 1000, fall);
  const land = f >= 26;
  const fl = f > t32 ? (f < t32 + 6 ? 1 : f < t32 + 10 ? 0 : f < t32 + 16 ? 1 : 0) : 0;
  const dark = f > t32 + 16 ? 1 : 0;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 900}, {t: p.dur, z: 1.1, fx: 520, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="DNR" y={620} size={46} tone="putty" p={ease(f, t58, 8)} />
        <Plate x={540} text="STATE LAW DOESN'T ADDRESS CLOUD SEEDING" displayLines={["STATE LAW DOESN'T", 'ADDRESS CLOUD SEEDING']} y={740} size={36} tone="ink" p={ease(f, t59, 8)} />
      </>}>
      <SVG>
        <OfficeBG g={g} flick={fl} />
        <GhostStair g={g} k={0.8 + 0.2 * (fl > 0 ? 0.3 : 1)} />
        <Desk x={600} y={OFFICE_FLOOR} scale={1.2} />
        <QMark x={600} y={land ? 990 : qy} f={g} size={86} k={ease(f, 0, 4)} bob={land ? 5 : 0} />
        <rect data-band="ok" x={-60} y={-60} width={1200} height={2040} fill="#0B0910" opacity={0.18 + 0.1 * dark} />
      </SVG>
    </Frame>
  );
};

// ---- S9: the fair case (keys 33, 34, 53, 35, 36, 37, 38) -------------------------------------------------------------------------------------------
const Balance: React.FC<{x: number; y: number; f: number; theta: number; leftLines: string[]; rightLines: string[]; rightType?: number; rightType2?: number; kL?: number; kR?: number}> =
({x, y, f, theta, leftLines, rightLines, rightType = 1, rightType2 = 1, kL = 1, kR = 1}) => {
  const L = 250;
  const a = (theta * Math.PI) / 180;
  const lx = x - L * Math.cos(a), ly = y + L * Math.sin(a);
  const rx = x + L * Math.cos(a), ry = y - L * Math.sin(a);
  const card = (cx: number, cy: number, lines: string[], tone: 'paper' | 'putty', k: number, partial = 1, partial2 = 1) => {
    if (k <= 0.02) return null;
    const w = 340;
    const h = lines.length * 34 + 30;
    return (
      <g transform={`translate(${cx},${cy - 150 * (1 - k)})`} opacity={clamp01(k * 2)}>
        <rect x={-w / 2 + 6} y={-h - 4 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.25} />
        <rect x={-w / 2} y={-h - 4} width={w} height={h} rx={6} fill={tone === 'paper' ? PM.paper : PM.kraft} stroke={INK} strokeWidth={5} />
        {lines.map((l, i) => {
          const part = i === 0 ? 1 : i === 1 ? partial : partial2;
          const shown = l.slice(0, Math.round(l.length * clamp01(part)));
          return <text key={i} x={-w / 2 + 16} y={-h + 28 + i * 34} fontFamily={MONO} fontWeight={800} fontSize={i === 0 ? 22 : i === 2 ? 17 : 18} letterSpacing={0.6} fill={INK}>{shown}</text>;
        })}
      </g>
    );
  };
  return (
    <g>
      <ContactShadow cx={x} cy={y + 640} rx={170} ry={16} opacity={0.35} blur={9} />
      <rect x={x - 12} y={y} width={24} height={640} fill={PM.woodHi} stroke={INK} strokeWidth={5} />
      <path d={`M${x - 120},${y + 640} L${x + 120},${y + 640} L${x + 70},${y + 600} L${x - 70},${y + 600} Z`} fill={PM.woodHi} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M${lx},${ly} L${rx},${ry}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M${lx},${ly} L${rx},${ry}`} stroke={PM.steel} strokeWidth={7} strokeLinecap="round" />
      <circle cx={x} cy={y} r={20} fill={PM.steel} stroke={INK} strokeWidth={6} />
      {[[lx, ly, 'L'], [rx, ry, 'R']].map(([px, py, side]) => (
        <g key={String(side)}>
          <path d={`M${px},${py} L${(px as number) - 80},${(py as number) + 210} M${px},${py} L${(px as number) + 80},${(py as number) + 210}`} stroke={INK} strokeWidth={4} />
          <path d={`M${(px as number) - 100},${(py as number) + 210} Q${px},${(py as number) + 250} ${(px as number) + 100},${(py as number) + 210} Z`} fill={PM.steel} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
      ))}
      {card(lx, ly + 214, leftLines, 'paper', kL)}
      {card(rx, ry + 214, rightLines, 'putty', kR, rightType, rightType2)}
    </g>
  );
};
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t33 = b(33), t34 = b(34), t53 = b(53), t35 = b(35), t36 = b(36), t37 = b(37), t38 = b(38);
  const lookUp = f < t33 + 40;
  const pat = f >= t33 + 40 && f < t34 ? Math.sin((f - t33 - 40) / 3) * 0.5 + 0.5 : 0;
  const tug = f >= t53 ? Math.sin((f - t53) / 4) * Math.exp(-(f - t53) / 40) : 0;
  // the beam: sags low on the left at 35, swings up through level at 36, never settles
  const th = f < t35 ? 0 : -8 * Math.exp(-(f - t35) / 70) * Math.cos((f - t35) / 11) + (f > t36 ? 6 * Math.exp(-(f - t36) / 80) * Math.sin((f - t36) / 9) : 0) - 4 * ease(f, t35, 10) * Math.exp(-(f - t35) / 200) + (f > t38 ? 5 * Math.exp(-(f - t38) / 60) * Math.sin((f - t38) / 8) : 0);
  const cam = track([
    {t: 0, z: 1.0, fx: 540, fy: 1000},
    {t: t35 - 20, z: 1.0, fx: 540, fy: 1000},
    {t: t35 + 8, z: 1.12, fx: 1630, fy: 1020},
    {t: p.dur, z: 1.2, fx: 1630, fy: 1040},
  ]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="A LAND PERMIT" y={600} size={42} tone="paper" p={ease(f, t34, 8) * (f < t35 - 6 ? 1 : 1 - ease(f, t35 - 6, 8))} rot={-2} />
        <Plate x={540} text="NOT A WEATHER GAUGE" y={680} size={42} tone="ink" p={ease(f, t53, 8) * (f < t35 - 6 ? 1 : 1 - ease(f, t35 - 6, 8))} rot={2} />
      </>}>
      <SVG>
        {[0, 1080].map((ox) => (
          <g key={ox} transform={`translate(${ox},0)`}><SnowMorningBG f={g} horizon={880} id={`s9${ox}`} flakes={40} /></g>
        ))}
        {/* the building far behind, one lit floor */}
        <g transform="translate(760,700) scale(0.34)"><Building f={g} lit={{ground: 1, state: 0.06, sky: 0.04}} /></g>
        <RainGauge x={600} y={1300} f={g} scale={1.05} labels={false} tag1={TAG1} tag1k={1} id="s9g" />
        <Dotty x={250} y={1300} f={g} scale={0.9} mood={lookUp ? 'ask' : f < t34 ? 'read' : 'proud'} look={lookUp ? 0.9 : 0} tack={1} lean={f < t53 ? 0 : -6 * tug} armR={f < t33 + 40 ? 20 : f < t34 ? 150 + 20 * pat : 20} armL={f >= t53 && f < t53 + 50 ? 110 * (0.5 + 0.5 * Math.abs(tug)) : 20} id="s9d" />
        {/* the table and the balance */}
        <g>
          <rect x={1330} y={1280} width={600} height={34} rx={6} fill={PM.snow} stroke={INK} strokeWidth={6} />
          <rect x={1370} y={1314} width={30} height={20} fill={PM.snowShade} stroke={INK} strokeWidth={5} />
          <rect x={1860} y={1314} width={30} height={20} fill={PM.snowShade} stroke={INK} strokeWidth={5} />
        </g>
        <Balance x={1630} y={640} f={g} theta={th}
          leftLines={['MAYOR PETER MICCICHE', 'MISLED ABOUT WHAT', 'RAINMAKER PLANNED']} kL={snap(f, t35, 10)}
          rightLines={["RAINMAKER'S CEO", 'HAD EVERY PERMISSION IT NEEDED', 'COULD HAVE DONE MORE OUTREACH']} kR={snap(f, t36, 10)} rightType={ease(f, t37, 36)} rightType2={ease(f, t38, 36)} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the ask (keys 39, 40, 41, 42, 43, 44, 45) --------------------------------------------------------------------------------------------
const Copier: React.FC<{x: number; y: number; f: number; k: number}> = ({x, y, f, k}) => {
  const sweep = k > 0 ? ((f * 6) % 160) : 0;
  return (
    <g transform={`translate(${x},${y})`}>
      <ContactShadow cx={0} cy={0} rx={110} ry={14} opacity={0.4} blur={8} />
      <rect x={-96} y={-170} width={192} height={170} rx={10} fill="#6A6578" stroke={INK} strokeWidth={6} />
      <rect x={-86} y={-206} width={172} height={44} rx={8} fill="#8A859A" stroke={INK} strokeWidth={5} />
      <rect x={-70} y={-196} width={140} height={22} rx={4} fill="#C8D3DC" stroke={INK} strokeWidth={3} />
      {k > 0.05 && <rect x={-66 + sweep * 0.8} y={-196} width={10} height={22} fill="#FFFFFF" opacity={0.85} />}
      <rect x={-60} y={-60} width={120} height={22} rx={4} fill="#2B2236" stroke={INK} strokeWidth={4} />
      <circle cx={70} cy={-120} r={9} fill={k > 0.05 ? '#CDBF94' : '#4A4F66'} stroke={INK} strokeWidth={3} />
    </g>
  );
};
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t39 = b(39), t40 = b(40), t41 = b(41), t42 = b(42), t43 = b(43), t44 = b(44), t45 = b(45);
  const slide = easeIO(f, t39, 44);
  const copyX = lerp(860, 740, slide);
  const fill = ease(f, t40, 16) + ease(f, t41, 16);
  const cardK = snap(f, t42, 12);
  const billK = ease(f, t43, 30);
  const glow = ease(f, t44, 16);
  const copiesT = (f - t45) / 24;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: t45 - 4, z: 1.0, fx: 540, fy: 960}, {t: t45 + 44, z: 0.94, fx: 540, fy: 960}, {t: p.dur, z: 0.94, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="ASSEMBLY ASKED THE LEGISLATURE" displayLines={['ASSEMBLY ASKED', 'THE LEGISLATURE']} y={600} size={38} tone="ink" p={ease(f, t39 + 4, 8) * (f < t42 ? 1 : 0)} />
        <Plate x={300} text="BAN" y={760} size={40} tone="emerald" p={ease(f, t40, 8) * (f < t44 ? 1 : 0)} />
        <Plate x={300} text="OR AT LEAST REGULATE" displayLines={['OR AT LEAST', 'REGULATE']} y={860} size={34} tone="emerald" p={ease(f, t41, 8) * (f < t44 ? 1 : 0)} />
        <Plate x={540} text="THE LEGISLATURE · IF IT ACTS" displayLines={['THE LEGISLATURE', 'IF IT ACTS']} y={640} size={40} tone="ink" p={ease(f, t44 + 2, 8) * (f < t45 - 2 ? 1 : 1 - ease(f, t45 - 2, 8))} />
        <Plate x={540} text="A TEMPLATE THE STATE COULD COPY" displayLines={['A TEMPLATE THE', 'STATE COULD COPY']} y={640} size={40} tone="paper" p={ease(f, t45 + 4, 8)} />
      </>}>
      <SVG>
        <OfficeBG g={g} dashed={glow} holeX={210} />
        <GhostStair g={g} />
        <Desk x={500} y={OFFICE_FLOOR} scale={1.0} />
        <QMark x={500} y={1030} f={g} size={80} k={1} bob={5} />
        {/* the tall legislature door on the right */}
        <g>
          <rect x={860} y={600} width={200} height={690} rx={8} fill={PM.woodDeep} stroke={INK} strokeWidth={8} />
          <rect x={880} y={630} width={160} height={290} rx={6} fill="none" stroke={INK} strokeWidth={4} opacity={0.6} />
          <rect x={880} y={950} width={160} height={290} rx={6} fill="none" stroke={INK} strokeWidth={4} opacity={0.6} />
          <circle cx={1020} cy={960} r={10} fill="#C9A24A" stroke={INK} strokeWidth={4} />
          <rect x={870} y={540} width={180} height={62} rx={6} fill="#1B2233" stroke={INK} strokeWidth={5} />
          <text x={960} y={566} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={0.6} fill={PM.bone}>ALASKA</text>
          <text x={960} y={590} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={0.6} fill={PM.bone}>LEGISLATURE</text>
        </g>
        {/* the copy of Dotty slides out from under the door */}
        <clipPath id="s10clip"><rect data-band="ok" x={0} y={0} width={860} height={1920} /></clipPath>
        <g clipPath="url(#s10clip)">
          {f >= t39 - 2 && <Dotty x={copyX} y={OFFICE_FLOOR + 10} f={g} scale={0.78} mood="flat" fill={fill} labels={['BAN', 'OR AT LEAST REGULATE']} look={-0.5} armL={14} armR={14} id="s10c" lean={-10 * (1 - slide)} />}
        </g>
        {/* the Vance card and the dashed conditional bill */}
        <g transform={`translate(${lerp(1160, 640, cardK)},730)`} opacity={clamp01(cardK * 2)}>
          <rect x={-120} y={-34} width={240} height={68} rx={6} fill={PM.paper} stroke={INK} strokeWidth={5} />
          <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={1} fill={INK}>REP. VANCE</text>
        </g>
        {billK > 0.01 && (
          <g opacity={billK}>
            <rect x={465} y={780} width={180} height={180} rx={4} fill="none" stroke="#CDBF94" strokeWidth={6} strokeDasharray="14 10" strokeDashoffset={-g * 0.7} opacity={0.9} />
            <text x={555} y={815} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={2} fill="#CDBF94">A BILL</text>
            {[850, 880, 910].map((yy) => <path key={yy} d={`M500,${yy} L610,${yy}`} stroke="#CDBF94" strokeWidth={5} strokeDasharray="10 8" opacity={0.7} />)}
            {glow > 0.5 && <text x={555} y={948} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} letterSpacing={0.6} fill="#CDBF94">IF RE-ELECTED</text>}
          </g>
        )}
        {/* the copier on the left feeds copies up the dashed stair */}
        <Copier x={90} y={OFFICE_FLOOR} f={g} k={f >= t45 ? 1 : 0} />
        {f >= t45 && [0, 1, 2, 3].map((i) => {
          const q = clamp01((copiesT - i * 0.45) / 4);
          if (q <= 0) return null;
          const n = q < 0.2 ? 0 : ((q - 0.2) / 0.8) * 9;
          const cx = q < 0.2 ? lerp(130, 210, q / 0.2) : 210 + n * 50;
          const cyy = OFFICE_FLOOR - n * 104;
          return <Dotty key={i} x={cx} y={cyy} f={g + i * 7} scale={0.26} mood="proud" walk={g / 3 + i} armL={14} armR={14} fill={4} shadow={false} id={`s10k${i}`} />;
        })}
      </SVG>
    </Frame>
  );
};

// ---- S11: what it asks (keys 46, 47) ------------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t46 = b(46), t47 = b(47);
  const plateK = snap(f, t47, 14);
  const out = f > t47 + 110 ? easeIO(f, t47 + 110, 18) : 0;
  const sweepA = ((f - t47) * 7) % 360;
  const holdUp = ease(f, t47 + 14, 14) * (1 - ease(f, t47 + 100, 14));
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.05, fx: 560, fy: 1020}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={330} text="WHAT IT INTENDS" y={580} size={34} tone="emerald" p={ease(f, t46 + 50, 8)} />
        <g opacity={clamp01(plateK * 1.4) * (1 - out)} transform={`translate(${lerp(1200, 790, plateK)},${690 - 140 * out}) rotate(${(1 - plateK) * 14})`}>
          <rect x={-190} y={-110} width={380} height={220} rx={10} fill={PM.kraft} stroke={INK} strokeWidth={6} />
          <text x={0} y={-66} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={1.4} fill={INK}>ITS WORDS</text>
          <text x={0} y={-30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={25} letterSpacing={1} fill={INK}>RADAR AND</text>
          <text x={0} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={25} letterSpacing={1} fill={INK}>SATELLITE CHECK</text>
          <g transform="translate(0,62)">
            <circle r={36} fill="#1B2233" stroke={INK} strokeWidth={4} />
            <circle r={22} fill="none" stroke={PM.tealHi} strokeWidth={1.6} opacity={0.5} />
            <path d={`M0,0 L${36 * Math.cos((sweepA * Math.PI) / 180)},${36 * Math.sin((sweepA * Math.PI) / 180)}`} stroke={PM.tealHi} strokeWidth={3.4} strokeLinecap="round" />
          </g>
        </g>
      </>}>
      <SVG>
        <PaperRoomBG f={g} deskY={1250} id="s11" />
        <RainGauge x={700} y={1290} f={g} scale={0.95} labels={false} tag1={TAG1} tag1k={1} id="s11g" />
        <Dotty x={290} y={1500} f={g} scale={1.6} mood="wary" fill={4} look={0.9} armL={20} armR={20 + 100 * holdUp} lean={3 * holdUp} id="s11d" />
        {f > t47 + 14 && f < t47 + 100 && (
          <path d={`M720,820 L${420 + 60 * Math.sin((f - t47) / 6)},1000 L${520 + 60 * Math.sin((f - t47) / 6)},1100 Z`} fill={PM.tealHi} opacity={0.14} />
        )}
      </SVG>
    </Frame>
  );
};

// ---- S12: not in the reports (keys 48, 49, 50) ------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t48 = b(48), t49 = b(49), t50 = b(50);
  const drop = snap(f, t49, 12);
  const film = ease(f, t50, 10);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.04, fx: 540, fy: 1010}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="THE REPORTS WE FOUND" y={600} size={38} tone="putty" p={ease(f, t48 + 4, 8) * (f < t49 - 2 ? 1 : 1 - ease(f, t49 - 2, 8))} />
        <g transform="translate(250,900)" opacity={film * 0.9}>
          <rect x={-140} y={-86} width={280} height={172} rx={10} fill="#E8EDEF" stroke={INK} strokeWidth={6} />
          <rect x={-130} y={30} width={260} height={46} fill="#8E9CA2" />
          <rect x={-130} y={26} width={260} height={4} fill="#9DB4C0" />
          <text x={0} y={-44} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={1.4} fill={PM.slateDeep}>THAT RAIN</text>
        </g>
      </>}>
      <SVG>
        <SnowMorningBG f={g} horizon={760} id="s12" flakes={60} near />
        <RainGauge x={400} y={1500} f={g} scale={1.6} labels={false} tag1={TAG1} tag1k={1} tag2={TAG2} tag2k={drop} id="s12g" />
        {/* the report pages riffle past in front of the gauge */}
        {Array.from({length: 9}).map((_, i) => {
          const u = (f - t48 - i * 3) / 30;
          if (u < 0 || u > 1) return null;
          const x = lerp(1240, -240, u), y = 880 + 80 * Math.sin(i * 1.7) + 30 * Math.sin(u * 8);
          return (
            <g key={i} transform={`translate(${x},${y}) rotate(${-14 + i * 5 + 20 * u})`}>
              <rect x={-90} y={-120} width={180} height={240} rx={6} fill="#FFFDF4" stroke={INK} strokeWidth={5} />
              {[-70, -42, -14, 14, 42].map((yy) => <rect key={yy} x={-66} y={yy} width={132 - ((i * 13 + yy) % 40)} height={7} rx={3} fill="#9AA3AB" />)}
            </g>
          );
        })}
      </SVG>
    </Frame>
  );
};

// ---- S13: the question (keys 51, 52) --------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t51 = b(51), t52 = b(52);
  const toCam = easeIO(f, t52 - 10, 14);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.03, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="WHO ASKS WHAT CAME OUT?" displayLines={['WHO ASKS', 'WHAT CAME OUT?']} y={640} size={48} tone="ink" p={ease(f, t52, 8)} />
      </>}>
      <SVG>
        <BuildingWorld g={g} noon tag1={1} tag2={1} lit={{ground: 1, state: 0.06, sky: 0.04}} signs={{ground: 1}}>
          <QMark x={540} y={floorTop('sky') + 130} f={g} size={84} />
          <QMark x={540} y={floorTop('state') + 130} f={g + 30} size={84} />
        </BuildingWorld>
        <Dotty x={300} y={1326} f={g} scale={0.5} mood="ask" look={lerp(-0.9, 0, toCam)} armL={18} armR={20} tack={0} id="s13d" />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={PM.spruceDeep} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={PM.bone}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'RISE', 2: 'PARCELS', 3: 'BOXES', 4: 'AUG 23', 5: 'TILE', 6: 'STRATUS', 7: 'STAIR', 8: 'OFFICE', 9: 'FAIR CASE', 10: 'THE ASK', 11: 'GAUGE', 12: 'NOT REPORTED', 13: 'QUESTION'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

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

export const ep1023Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1023Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1023: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 12.42, 25.04, 33.0, 42.42, 56.1, 62.58, 74.62, 80.42, 95.48, 109.58, 116.46, 120.64, 124.76].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1B2233" ink="#F4EEDC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
