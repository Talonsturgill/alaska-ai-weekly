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
    {t: t3 + 4, z: 2.6, fx: 470, fy: 1170},
    {t: p.dur, z: 2.6, fx: 480, fy: 1170},
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
          {strike > 0.02 && (
            <g opacity={clamp01(strike * 2)} transform={`translate(440,1150) rotate(-3) scale(${0.26 * (1 + 0.1 * (1 - strike))})`}>
              <rect x={-130} y={-34} width={260} height={68} rx={6} fill="none" stroke={PM.marigoldDeep} strokeWidth={9} />
              <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={46} letterSpacing={3} fill={PM.marigoldDeep}>OCT 20TH</text>
            </g>
          )}
          {f > t3 - 14 && f < t3 + 30 && (
            <Stamp x={440} y={1160} f={g} scale={0.26} down={down} ink={0} lines={['OCT 20TH']} size={40} color={PM.marigoldDeep} rot={-3} id="s1st" />
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
const pj = (cx: number, cy: number) => ({x: PL.x0 + PL.sc * (cx - 0.42 * cy), y: PL.y0 + PL.sc * 0.62 * cy});
const BOROUGH = [2, 3, 7, 8, 9, 12, 13, 14, 17, 18, 19, 23, 24];
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t6 = b(6), t7 = b(7), t8 = b(8), t9 = b(9), t56 = b(56), t10 = b(10);
  const tilt = ease(f, 0, 26);
  const lit = ease(f, t6, 26);
  const walkX = lerp(-120, 846, easeIO(f, t7 - 36, 84));
  const walking = f > t7 - 36 && f < t7 + 48;
  const berry = pj(375, 300), dp = pj(675, 300);
  const lean = f < t9 ? 0 : f < t10 ? -6 : f < t10 + 14 ? lerp(-6, 5, ease(f, t10, 12)) : 5;
  const glyph = snap(f, t10, 10);
  const trackK = ease(f, t56 + 4, 30);
  const cam = track([
    {t: 0, z: 1.0, fx: 540, fy: 820},
    {t: t8 + 10, z: 1.06, fx: 560, fy: 900},
    {t: t9 + 24, z: 1.75, fx: 700, fy: 900},
    {t: p.dur, z: 1.85, fx: 710, fy: 900},
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
        <RainGauge x={dp.x + 140} y={dp.y + 40} f={g} scale={0.52} labels={false} id="s2g" />
        {f > t7 - 36 && <Dotty x={walking ? walkX : 846} y={dp.y + 28} f={g} scale={0.5} mood={f < t10 ? 'proud' : f < t10 + 40 ? 'wary' : 'proud'} tack={ease(f, t8, 10)} walk={walking ? (f - t7) / 4 : 0} lean={lean} armR={f >= t10 && f < t10 + 40 ? 70 : 20} look={f >= t9 ? -0.8 : 0.3} id="s2d" />}
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
        <RainGauge x={880} y={1290} f={g} scale={0.9} labels id="s3g" />
        <Dotty x={470} y={1500} f={g} scale={1.85} mood={fill < 3.6 ? 'read' : 'beam'} fill={fill} look={0.4} armL={24} armR={fill > 3.9 ? 60 : 26} id="s3d" />
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
    <rect x={-60} y={-60} width={1200} height={2040} fill={`url(#${id}sk)`} />
    <rect x={-60} y={-60} width={1200} height={2040} fill={`url(#${id}sun)`} />
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
        <Plate x={540} text="20 MILES NE OF HOMER" y={1215} size={36} tone="ink" p={ease(f, t18, 8)} />
      </>}>
      <SVG>
        <defs><linearGradient id="s4sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#58A9D6" /><stop offset="1" stopColor={PM.bayDeep} /></linearGradient></defs>
        <rect x={-60} y={-60} width={1200} height={2040} fill="url(#s4sea)" />
        {Array.from({length: 30}).map((_, i) => <path key={i} d={`M${60 + rnd(i + 3) * 900},${700 + rnd(i + 9) * 800} q16,-9 32,0`} fill="none" stroke="#C9E8F7" strokeWidth={3} opacity={0.35 + 0.35 * Math.abs(Math.sin(g / (20 + i) + i))} />)}
        <path d="M-60,-60 L1140,-60 L1140,430 L900,560 L760,690 L640,790 L520,860 L430,900 L380,960 L340,1060 L318,1140 L300,1170 L282,1140 L300,1060 L326,960 L260,930 L120,960 L-60,1000 Z" fill={PM.summerGrass} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d="M900,560 L760,690 L640,790 L520,860 L430,900" fill="none" stroke="#F6EDC5" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
        {[[160, 300], [420, 180], [900, 260], [600, 420], [220, 700], [1000, 640]].map(([tx, ty], i) => (
          <g key={i} transform={`translate(${tx},${ty})`}>{[0, 1, 2].map((j) => <path key={j} d={`M${j * 30 - 30},0 L${j * 30 - 44},0 L${j * 30 - 30},-62 L${j * 30 - 16},0 Z`} fill={PM.summerGrassDeep} stroke={INK} strokeWidth={2.4} />)}</g>
        ))}
        <rect x={-60} y={-60} width={1200} height={2040} fill={PM.sun} opacity={0.1} />
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
  const tagX = lerp(330, 890, tagPeel), tagY = lerp(960, 878, tagPeel) - 160 * Math.sin(tagPeel * Math.PI);
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
            <rect x={0} y={0} width={1080} height={1920} fill="#D9E8DA" />
            <rect x={0} y={1180} width={1080} height={740} fill={PM.summerGrassDeep} stroke={INK} strokeWidth={8} />
            <rect x={0} y={1176} width={1080} height={4} fill={PM.water} />
            <path d="M0,1176 L1080,1176" stroke={PM.waterDeep} strokeWidth={1.6} />
            <rect x={150} y={880} width={34} height={300} fill="#FFFFFF" opacity={0.55} stroke={INK} strokeWidth={5} />
            {Array.from({length: 11}).map((_, i) => <path key={i} d={`M${i % 5 === 0 ? 120 : 134},${1180 - i * 30} L150,${1180 - i * 30}`} stroke={INK} strokeWidth={3} />)}
            <text x={112} y={870} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={26} fill={INK}>1 IN</text>
            <path d="M170,1174 L330,1090" stroke={INK} strokeWidth={5} />
            <RainGauge x={800} y={1180} f={g} scale={1.0} labels tag1={undefined} tag2={undefined} id="s5g" />
            <PTag lines={TAG1} size={20} tone="putty" k={1} f={g} drop={30} sway={tagPeel < 0.99 ? 0 : 3} />
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
          <rect x={-60} y={-60} width={1200} height={2040} fill={PM.summerGrass} />
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
          <rect x={880} y={960} width={50} height={300} fill="#FFFDF4" stroke={INK} strokeWidth={5} />
          {Array.from({length: 11}).map((_, i) => <path key={i} d={`M${i % 5 === 0 ? 880 : 896},${1260 - i * 30} L930,${1260 - i * 30}`} stroke={INK} strokeWidth={i % 5 === 0 ? 3.4 : 2.2} />)}
          <text x={905} y={940} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={INK}>1 IN</text>
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
