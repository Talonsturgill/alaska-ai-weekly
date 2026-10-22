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
import {PR, Plumb, plumbTip, DrillBit, VellumSheet, HangTag, HollowQ, Zzz, SurveyHeli, Globe, RockBlock, TableBG, LampArm, DuskTundraBG, PaperPlane, PinOutline, DownloadArrow, DepositBlob, ReleaseScroll, RollTube, Pedestal, Loupe, snap, rnd, bump} from './lib/prospect';
import {IDS} from './Ep1022Ids';

// The Hair Above the Ground, 2026-10-22. Palette roles are art_direction.json. VERMILION is only the flight lines and the ribbon they become. Brass is Plumb and the lamp, steel is the drill bit.
// Every company line carries the ITS WORDS tag. The two surveys are shown as "what one of those looks like", never as the company's inputs. Plumb is a labelled metaphor for a reader of maps
// and never lights up on a result; no property, find, deal or money is drawn; targets are hollow question marks; rock glow is rock that differs. Every painted string is a claims.json on_screen
// string, a quote, or a plain label.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const C = {ink: INK, paper: '#FFFDF4'};
const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);

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

type Tone = 'ink' | 'paper' | 'brass' | 'dusk' | 'pale';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#10151F', fg: PR.bone},
  paper: {fill: PR.bone, fg: '#10151F'},
  brass: {fill: PR.brass, fg: INK},
  dusk: {fill: '#2A3A33', fg: PR.bone},
  pale: {fill: '#26335C', fg: PR.periHi},
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

// ---- shared bits ---------------------------------------------------------------------------------------------------------------------
/** the sleeper: the steel bit under its moss tarp in the lower corner, introduced from the first shot and woken act by act */
const Sleeper: React.FC<{x?: number; y?: number; f: number; scale?: number; twitch?: number; eyes?: number; zzz?: number; tarp?: number; tilt?: number; cape?: number; id?: string}> =
({x = 860, y = 1700, f, scale = 0.8, twitch = 0, eyes = 0, zzz = 1, tarp = 1, tilt = 1, cape = 0, id = 'sl'}) => (
  <g>
    <DrillBit x={x} y={y} f={f} scale={scale} tilt={tilt} tarp={tarp} twitch={twitch} eyes={eyes} cape={cape} id={id} />
    {zzz > 0.02 && <Zzz x={x - 40 * scale} y={y - 120 * scale} f={f} k={zzz} scale={scale * 1.1} />}
  </g>
);
const SHEET_W = 820, SHEET_H = 1040;

// ---- S1: a hair above the ground (keys 1, 2, 3, 6) -------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t2 = b(2), t3 = b(3), t6 = b(6);
  const rows = easeIO(f, t2 - 4, 190);
  const rowH = (SHEET_H - 28) / 18;
  const k = Math.min(17, Math.floor(rows * 18));
  const pr = clamp01(rows * 18 - k);
  const dir = k % 2 ? -1 : 1;
  const hx = dir > 0 ? 540 - 393 + pr * 786 : 540 + 393 - pr * 786;
  const hy = 504 + (k + 0.5) * rowH - 40;
  const amp = 5 + 38 * Math.exp(-f / 15);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000}
      overlay={<>
        <Plate x={540} text="DGGS · TWO 2026 SURVEYS" y={540} size={36} tone="ink" p={ease(f, 4, 8)} />
        <Plate x={540} text="ABOUT 45,800 LINE-KM · THE FILM'S ARITHMETIC" displayLines={['ABOUT 45,800 LINE-KM', "THE FILM'S ARITHMETIC"]} y={640} size={34} tone="paper" p={ease(f, t2 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={420} lampY={950} seed={1} />
        <VellumSheet x={540} y={1010} w={SHEET_W} h={SHEET_H} f={g} contours={ease(f, t3, 40) * 0.7} rows={rows} rowCount={18} patch={snap(f, 0, 12)} patchX={30} patchY={90} id="s1v" />
        {rows > 0.01 && rows < 0.995 && <SurveyHeli x={hx} y={hy} f={g} scale={0.5} facing={dir as 1 | -1} bird={60} swing={0} rotor={1} />}
        <Sleeper f={g} x={810} y={1700} twitch={0} zzz={ease(f, t6, 12)} id="s1b" />
        <LampArm x={60} y={40} f={g} />
        <Plumb x={570} y={-20} len={1090} f={g} scale={1.7} mood="wary" tremble={1} amp={amp} look={0.4} id="s1p" shadowY={1130} />
      </SVG>
    </Frame>
  );
};

// ---- S2: offered for download (keys 4, 5, 6, 48, 56) -----------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t4 = b(4), t5 = b(5), t48 = b(48), t56 = b(56);
  const fan = snap(f, t4, 16);
  const square = ease(f, t56, 18);
  const N = 5;
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1050}
      overlay={<>
        <Plate x={540} text="DATA OFFERED FOR DOWNLOAD · DGGS" displayLines={['DATA OFFERED FOR', 'DOWNLOAD · DGGS']} y={560} size={36} tone="ink" p={ease(f, t4 + 2, 8) * (f < t48 ? 1 : 0)} />
        <Plate x={540} text="ONE MAP, MANY COPIES" y={720} size={34} tone="paper" p={ease(f, t56 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={540} lampY={1000} seed={2} />
        {Array.from({length: N}).map((_, i) => {
          const a = (i - 2) * 17 * fan * (1 - square);
          const ox = (i - 2) * 118 * fan * (1 - square) + (i - 2) * 4 * square;
          const oy = Math.abs(i - 2) * 22 * fan * (1 - square) - i * 5 * square;
          return <VellumSheet key={i} x={540 + ox} y={1090 + oy} w={520} h={680} rot={a} f={g} contours={0.8} rows={0.5 + 0.1 * i} rowCount={12} id={`s2v${i}`} dim={(4 - i) * 0.05} />;
        })}
        {[0, 1, 2, 3, 4].map((i) => <DownloadArrow key={i} x={540 + (i - 2) * 118 * (1 - square)} y={820 + Math.abs(i - 2) * 22 - 8} scale={0.7} f={g} k={ease(f, t5 + i * 5, 10) * (1 - ease(f, t56, 12))} id={`s2a${i}`} />)}
        <Sleeper f={g} x={880} y={1700} twitch={0} zzz={1} id="s2b" />
        <LampArm x={60} y={40} f={g} />
        <Plumb x={190} y={-20} len={800} f={g} scale={1.5} mood="curious" amp={5} look={0.6} ph={1.4} id="s2p" shadow={false} />
        <QuotePlate x={540} y={690} text={'"IMPROVE THE UNDERSTANDING OF THE GEOLOGY AND MINERAL POTENTIAL" · DGGS'} wrap={22} size={32} p={ease(f, t48, 8)} type={ease(f, t48 + 2, 90)} />
      </SVG>
    </Frame>
  );
};

// ---- S3: a paper plane from Portland (keys 7, 8, 9, 10) ---------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t7 = b(7), t8 = b(8), t9 = b(9), t10 = b(10);
  const fly = easeIO(f, t7 - 10, t10 - t7 + 4);
  const px = lerp(-120, 640, fly), py = lerp(1560, 1010, fly) - 120 * Math.sin(fly * Math.PI);
  const land = ease(f, t10, 10);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1050}
      overlay={<>
        <Plate x={540} text="OCT 20TH" y={540} size={38} tone="ink" p={ease(f, t7 + 2, 8) * (f < t10 ? 1 : 0)} />
        <Plate x={540} text="GEOMORPHIC AI" y={610} size={40} tone="brass" p={ease(f, t9 + 2, 8)} />
        <Plate x={540} text="OCT 20TH · GOLDEN DYKE EXPLORATION LLC" displayLines={['OCT 20TH · GOLDEN DYKE', 'EXPLORATION LLC']} y={760} size={34} tone="paper" p={ease(f, t10 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={560} lampY={1050} seed={3} />
        <VellumSheet x={540} y={1070} w={900} h={1000} f={g} contours={0.35} id="s3v" />
        <AlaskaMini frame={g} x={110} y={760} scale={1.55} pin={false} />
        <PinOutline x={560} y={1090} f={g} scale={1.0} k={land} />
        <PaperPlane x={px} y={py} rot={lerp(-20, 4, fly)} scale={1.1} f={g} shadowDy={70 - 30 * fly} />
        {f > t8 && f < t10 + 8 && <g transform={`translate(${px - 60},${py + 20})`}><HangTag text="PORTLAND-BASED" size={24} tone="kraft" f={g} k={ease(f, t8, 8)} rot={-10} /></g>}
        <Sleeper f={g} x={900} y={1720} twitch={0} zzz={0.5} id="s3b" />
        <Plumb x={860} y={-20} len={640} f={g} scale={1.4} mood="curious" amp={5} look={-0.7} ph={2.1} id="s3p" shadow={false} />
      </SVG>
    </Frame>
  );
};

// ---- S4: its words (keys 11, 12, 13, 14, 53) --------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t11 = b(11), t12 = b(12), t13 = b(13), t14 = b(14), t53 = b(53);
  const sweep = easeIO(f, t13 - 14, 60);
  const bx = lerp(260, 820, sweep);
  const qs: [number, number][] = [[300, 1180], [520, 1260], [740, 1150], [860, 1300], [420, 1090]];
  const pk = plumbTip(540, -20, 1050, g, 4, 0.5, 0);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000}
      overlay={<>
        <Plate x={540} text="ITS WORDS · AI-DRIVEN PROSPECT GENERATOR" displayLines={['ITS WORDS ·', 'AI-DRIVEN PROSPECT GENERATOR']} y={560} size={34} tone="brass" p={ease(f, t12 + 2, 8)} />
        <Plate x={540} text="OVERLOOKED SYSTEMS?" y={730} size={36} tone="ink" p={ease(f, t13 + 2, 8) * (f < t14 ? 1 : 0)} />
        <Plate x={540} text="DRILL-READY DATA PACKAGE" y={800} size={34} tone="paper" p={ease(f, t14 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={540} lampY={1000} seed={4} />
        <VellumSheet x={540} y={1180} w={860} h={640} f={g} contours={0.55} id="s4v" />
        {qs.map(([qx, qy], i) => <HollowQ key={i} x={qx} y={qy} size={96} f={g} k={snap(f, t13 + i * 9, 10) * 1} color={PR.bone} />)}
        {f > t13 - 14 && f < t13 + 90 && <path d={`M${pk.x},${pk.y} L${bx - 200},1500 L${bx + 200},1500 Z`} fill={PR.lichen} opacity={0.14 + 0.03 * Math.sin(f / 4)} />}
        <RollTube x={150} y={1620} scale={0.9} f={g} out={ease(f, t14, 26)} id="s4r" />
        <Sleeper f={g} x={900} y={1710} twitch={0} zzz={1 - ease(f, t53, 4)} tilt={1} id="s4b" />
        <Plumb x={540} y={-20} len={1050} f={g} scale={1.55} mood="curious" amp={4} ph={0.5} id="s4p" shadowY={1090}
          tag={<HangTag text="ITS WORDS" size={26} f={g} k={ease(f, t11, 8)} />} />
      </SVG>
    </Frame>
  );
};

// ---- S5: public data (keys 55, 15, 16, 17) ----------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t55 = b(55), t15 = b(15), t16 = b(16), t17 = b(17);
  const s1 = easeIO(f, t55, 26), s2 = easeIO(f, t16 - 12, 24);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1050}
      overlay={<>
        <Plate x={540} text="ITS WORDS · WHAT IT READS IS PUBLIC" displayLines={['ITS WORDS ·', 'WHAT IT READS IS PUBLIC']} y={560} size={34} tone="brass" p={ease(f, t15 + 2, 8)} />
        <Plate x={540} text="NEW STATE AIRBORNE SURVEYS" y={730} size={34} tone="ink" p={ease(f, t16 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={620} lampY={1000} pool={0.6 + 0.4 * ease(f, t15, 20)} seed={5} />
        <VellumSheet x={lerp(-300, 330, s1)} y={1100} w={520} h={700} rot={-5} f={g} contours={0.5} id="s5a" />
        <VellumSheet x={lerp(1400, 780, s2)} y={1130} w={520} h={700} rot={4} f={g} contours={ease(f, t17, 30)} glow={0} rows={0} id="s5b" />
        <g transform="translate(330,640)"><HangTag text="USGS + STATE MAPPING" size={22} tone="kraft" f={g} k={ease(f, t55 + 14, 8)} rot={-4} /></g>
        <Sleeper f={g} x={160} y={1730} twitch={0} zzz={0.8} id="s5s" />
        <LampArm x={60} y={40} f={g} scale={1.1} swing={1.5} />
        <Plumb x={600} y={-20} len={900} f={g} scale={1.6} mood="curious" amp={5} ph={3.1} look={-0.5} id="s5p" shadow={false} />
      </SVG>
    </Frame>
  );
};

// ---- S6: what one of those surveys looks like (keys 18, 19, 20, 49, 21, 22) -----------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t18 = b(18), t19 = b(19), t20 = b(20), t49 = b(49), t21 = b(21), t22 = b(22);
  const enter = easeIO(f, 0, 70);
  const flyP = clamp01((f - t20) / Math.max(1, t49 - t20 - 4));
  const tun = 1 - ease(f, t49 - 10, 18);
  // tundra phase: banks in from the left, then flies rows while red lines draw on the ground
  const hx = f < t20 ? lerp(-260, 520, enter) : lerp(160, 920, easeIO(flyP * 2 % 1, 0, 1) * (Math.floor(flyP * 2) % 2 ? -1 : 1) * 0.5 + 0.5);
  const hy = 700 + 14 * Math.sin(g / 21);
  const lines = Math.floor(flyP * 7) + 1;
  // cutaway phase: the sensor bird sweeps over the block
  const cut = 1 - tun;
  const cx = lerp(330, 760, easeIO(f, t49, t22 - t49 + 30));
  const bend = 0.5 + 0.5 * Math.sin((g - t49) / 12);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1000}
      overlay={<>
        <Plate x={540} text="WHAT ONE OF THOSE LOOKS LIKE" y={540} size={34} tone="ink" p={ease(f, t18 + 2, 8) * (f < t19 + 40 ? 1 : 0)} />
        <Plate x={540} text="GANES CREEK · 25,731 LINE-KM" y={610} size={36} tone="paper" p={ease(f, t19 + 2, 8) * (f < t21 ? 1 : 0)} />
        <Plate x={540} text="MAGNETIC SENSOR · GAMMA-RAY SPECTROMETERS" displayLines={['MAGNETIC SENSOR ·', 'GAMMA-RAY SPECTROMETERS']} y={700} size={34} tone="ink" p={ease(f, t21 + 2, 8)} />
      </>}>
      <SVG>
        <g opacity={tun}>
          <DuskTundraBG f={g} horizon={820} />
          {Array.from({length: 7}).map((_, i) => {
            const q = clamp01(flyP * 7 - i);
            if (q <= 0 || i >= lines) return null;
            const yy = 1010 + i * 62, dir = i % 2 ? -1 : 1;
            const x0 = dir > 0 ? 40 : 1040;
            return <path key={i} data-band="ok" d={`M${x0},${yy} l${dir * 1000 * q},0`} stroke={PR.thread} strokeWidth={6 + i * 0.6} strokeLinecap="round" strokeDasharray="22 10" opacity={0.95} />;
          })}
          <SurveyHeli x={hx} y={hy + 60} f={g} scale={1.6} facing={f < t20 || Math.floor(flyP * 2) % 2 === 0 ? 1 : -1} bird={f < t20 ? 150 : 170} swing={8 * Math.sin(g / 16)} tilt={f < t20 ? -4 * (1 - enter) : 2} />
        </g>
        <g opacity={cut}>
          <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={PR.spruceDeep} />
          <rect data-band="ok" x={-40} y={760} width={1160} height={1200} fill={PR.spruce} opacity={0.7} />
          <RockBlock x={500} y={1340} w={680} h={340} f={g} field={ease(f, t21, 20)} glow={ease(f, t22, 20)} bend={bend} depth={110} id="s6r" />
          <SurveyHeli x={cx} y={880} f={g} scale={1.1} bird={70} swing={10 * Math.sin(g / 14)} tilt={0} />
          <g transform="translate(850,1090)"><HangTag text="ROCK THAT DIFFERS" size={22} tone="bone" f={g} k={ease(f, t22 + 6, 10)} rot={4} /></g>
          <Sleeper f={g} x={900} y={1720} twitch={ease(f, t49, 6) * (1 - ease(f, t49 + 40, 20))} zzz={1 - ease(f, t49, 6)} id="s6b" />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S7: more than once around (keys 23, 24, 25) ---------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t23 = b(23), t24 = b(24), t25 = b(25);
  const sheet = snap(f, t23, 14);
  const wrap = easeIO(f, t24, 78) * 1.5;
  const rise = ease(f, t24 - 20, 30);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1050}
      overlay={<>
        <Plate x={540} text="ANIAK + LITTLE TAYLOR MTNS · 20,090 LINE-KM" displayLines={['ANIAK + LITTLE TAYLOR MTNS ·', '20,090 LINE-KM']} y={565} size={32} tone="ink" p={ease(f, t23 + 2, 8)} />
        <Plate x={540} text="MORE THAN ONCE AROUND" y={690} size={36} tone="brass" p={ease(f, t24 + 14, 8)} />
        <Plate x={540} text="SURVEYS ADD · NOT ONE FLIGHT" y={760} size={32} tone="paper" p={ease(f, t25 + 2, 8)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={PR.spruceDeep} />
        {Array.from({length: 40}).map((_, i) => <circle key={i} data-band="ok" cx={rnd(i) * 1080} cy={rnd(i + 50) * 1500} r={1.4 + rnd(i + 9) * 2.4} fill={PR.bone} opacity={0.3 + 0.4 * Math.abs(Math.sin(g / (24 + i) + i))} />)}
        <Globe x={540} y={1080} r={255} f={g} wrap={wrap} tail={ease(f, t24 + 70, 30)} id="s7g" />
        <VellumSheet x={250} y={1630} w={440} h={300} rot={-4} f={g} rows={sheet} rowCount={10} contours={0.4} id="s7a" lift={1 - sheet} />
        <VellumSheet x={800} y={1650} w={400} h={290} rot={3} f={g} rows={sheet} rowCount={10} contours={0.4} id="s7b" lift={1 - sheet} />
        <path d={`M250,1480 C230,1380 330,1330 440,1260`} fill="none" stroke={PR.thread} strokeWidth={10} strokeLinecap="round" strokeDasharray="20 10" opacity={rise * 0.9} pathLength={1} />
        <path d={`M800,1500 C830,1400 700,1330 620,1270`} fill="none" stroke={PR.thread} strokeWidth={10} strokeLinecap="round" strokeDasharray="20 10" opacity={rise * 0.9} />
      </SVG>
    </Frame>
  );
};

// ---- S8: the same map (keys 26, 27, 28, 47) ---------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t26 = b(26), t27 = b(27), t28 = b(28), t47 = b(47);
  const lean = ease(f, t26, 30);
  const rx = [110, 290, 470];
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1100}
      overlay={<>
        <Plate x={540} text="THE FAIR CASE" y={560} size={38} tone="ink" p={ease(f, t26 + 2, 8)} />
        <Plate x={540} text="THE SAME MAP" y={630} size={38} tone="paper" p={ease(f, t27 + 2, 8)} />
        <Plate x={540} text="FIRST LOOK?" y={700} size={40} tone="brass" p={ease(f, t28 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={560} lampY={1000} seed={8} pool={0.9} />
        {rx.map((x, i) => (
          <g key={i}>
            <ContactShadow cx={x} cy={1296} rx={80} ry={11} opacity={0.3} blur={7} />
            <Character frame={g + i * 13} x={x} y={1290} scale={0.95} facing={1} pose="carry" emotion="neutral" outfit={i % 2 ? 'flannel' : 'puffer'} headgear="bare" idleGain={1} />
            <Loupe x={x + 120 * 0.95} y={1290 - 190 * 0.95 + 24 * lean} scale={0.9} rot={-30} />
          </g>
        ))}
        <Pedestal x={930} y={1296} scale={0.95} />
        <HollowQ x={930} y={1050} size={120} f={g} k={snap(f, t28, 12)} color={PR.brass} />
        {[0, 1, 2].map((i) => <VellumSheet key={i} x={rx[i] + 150} y={1330 - 8 * i} w={230} h={150} rot={i % 2 ? 4 : -4} f={g} contours={0.8} rows={0.5} rowCount={6} id={`s8v${i}`} />)}
        <g transform="translate(0,0)">{[0, 1, 2].map((i) => <DownloadArrow key={i} x={rx[i] + 150} y={1250} scale={0.42} f={g} k={ease(f, t27 + i * 3, 10) * (1 - ease(f, t27 + 40, 14))} id={`s8a${i}`} />)}</g>
        <rect data-band="ok" x={-40} y={1290} width={1160} height={110} fill="#2B1F16" stroke={INK} strokeWidth={6} />
        <Sleeper f={g} x={200} y={1700} scale={0.7} twitch={0} eyes={ease(f, t47, 10)} zzz={0} tarp={1} id="s8s" />
        <Plumb x={720} y={-20} len={1060} f={g} scale={1.5} mood={f > t28 ? 'ask' : 'curious'} amp={4} ph={1.1} look={0.5} id="s8p" shadowY={1090} />
      </SVG>
    </Frame>
  );
};

// ---- S9: no property named (keys 29, 30, 31) --------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t29 = b(29), t30 = b(30), t31 = b(31);
  const slide = easeIO(f, t29 - 16, 24);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1050}
      overlay={<>
        <Plate x={540} text="NO ALASKA PROPERTY NAMED YET" y={560} size={36} tone="ink" p={ease(f, t29 + 2, 8)} />
        <Plate x={540} text="SOON · ITS WORD" y={640} size={36} tone="paper" p={ease(f, t31 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={540} lampY={1050} seed={9} />
        <g transform={`translate(${lerp(1100, 0, slide)},0)`}>
          <VellumSheet x={540} y={1130} w={900} h={1000} f={g} contours={0.25} id="s9v" />
          <AlaskaMini frame={g} x={110} y={820} scale={1.55} pin={false} />
        </g>
        <PinOutline x={560} y={1150} f={g} k={snap(f, t29, 12)} scale={1.0} />
        <g transform="translate(700,980)"><HangTag text="SOON" size={26} tone="kraft" f={g} k={ease(f, t31, 8)} rot={6} /></g>
        <Sleeper f={g} x={900} y={1730} scale={0.7} zzz={0.6} id="s9s" />
        <Plumb x={560} y={-20} len={1100} f={g} scale={1.5} mood={f > t30 ? 'worried' : 'wary'} tremble={0.8} amp={f > t30 && f < t30 + 70 ? 10 : 5} ph={0.9} look={0.3} id="s9p" shadowY={1180}
          tag={f > t30 ? <HangTag text={f % 24 < 8 ? '?' : f % 24 < 16 ? '??' : '???'} size={34} tone="bone" f={g} k={ease(f, t30, 6)} /> : undefined} />
      </SVG>
    </Frame>
  );
};

// ---- S10: their deposits, not its ground (keys 32, 33, 34) ------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t32 = b(32), t33 = b(33), t34 = b(34);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1050}
      overlay={<>
        <Plate x={540} text="ITS RELEASE · DEPOSITS IT MENTIONS BELONG TO OTHERS" displayLines={['ITS RELEASE ·', 'DEPOSITS IT MENTIONS', 'BELONG TO OTHERS']} y={620} size={34} tone="ink" p={ease(f, t33 + 2, 8)} />
        <Plate x={540} text="NOTHING SHOWN ON ITS OWN GROUND" y={780} size={32} tone="paper" p={ease(f, t34 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={600} lampY={1050} seed={10} />
        <VellumSheet x={600} y={1200} w={800} h={760} rot={-1} f={g} contours={0.45} id="s10v" />
        {[[330, 1100, 'THEIRS'], [620, 1010, 'THEIRS'], [830, 1180, 'THEIRS']].map(([bx, by, tx], i) => (
          <g key={i}>
            <DepositBlob x={bx as number} y={by as number} f={g} scale={1.15} seed={i} k={snap(f, t33 + i * 6, 12)} id={`s10d${i}`} />
            <g transform={`translate(${bx as number},${(by as number) - 40})`}><HangTag text={tx as string} size={20} tone="kraft" f={g + i * 7} k={ease(f, t33 + 8 + i * 6, 8)} rot={i * 3 - 3} drop={36} /></g>
          </g>
        ))}
        <g opacity={ease(f, t34, 10)}>
          <path d="M470,1290 C430,1250 470,1210 530,1220 C590,1230 600,1290 560,1320 C520,1340 490,1320 470,1290 Z" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
          <path d="M470,1290 C430,1250 470,1210 530,1220 C590,1230 600,1290 560,1320 C520,1340 490,1320 470,1290 Z" fill="none" stroke={PR.bone} strokeWidth={6} strokeLinecap="round" strokeDasharray="14 12" strokeDashoffset={-g * 0.7} />
        </g>
        <ReleaseScroll x={230} y={1000} w={300} h={420} unroll={ease(f, t32, 30)} f={g} id="s10s" />
        <g transform="translate(230,850)"><HangTag text="ITS RELEASE" size={22} tone="brass" f={g} k={ease(f, t32 + 10, 8)} rot={-3} drop={30} /></g>
        <Sleeper f={g} x={900} y={1730} scale={0.7} zzz={0.6} id="s10s2" />
        <Plumb x={880} y={-20} len={800} f={g} scale={1.5} mood="wary" amp={4} ph={2.2} look={-0.6} id="s10p" shadow={false} />
      </SVG>
    </Frame>
  );
};

// ---- S11: a map shows rock (keys 35, 36, 37) --------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t35 = b(35), t36 = b(36), t37 = b(37);
  const sheetOp = 1 - ease(f, t36 + 6, 16);
  const blockOp = ease(f, t36, 14);
  const wake = ease(f, t37 - 6, 22);
  const shake = ease(f, t37 + 34, 6) * (1 - ease(f, t37 + 64, 20));
  const yawn = Math.max(0, Math.sin(clamp01((f - t37 - 6) / 30) * Math.PI)) * (f < t37 + 40 ? 1 : 0);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1100}
      overlay={<>
        <Plate x={540} text="MAGNETISM + NATURAL RADIATION" y={560} size={34} tone="ink" p={ease(f, t35 + 2, 8)} />
        <Plate x={540} text="A MAP SHOWS WHERE ROCK DIFFERS" y={630} size={34} tone="paper" p={ease(f, t36 + 2, 8) * (f < t37 ? 1 : 0)} />
        <Plate x={540} text="A MAP SHOWS ROCK · A DRILL SHOWS WHAT'S IN IT" displayLines={["A MAP SHOWS ROCK ·", "A DRILL SHOWS WHAT'S IN IT"]} y={770} size={34} tone="brass" p={ease(f, t37 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={460} lampY={1100} seed={11} dim={0.2 * blockOp} />
        <g opacity={sheetOp}><VellumSheet x={480} y={1130} w={760} h={900} f={g} contours={1} glow={ease(f, t35, 24)} patch={1} patchX={40} patchY={80} id="s11v" /></g>
        <g opacity={blockOp}><RockBlock x={400} y={1360} w={640} h={380} f={g} field={1} glow={1} bend={0.5 + 0.5 * Math.sin(g / 14)} lift={1 - ease(f, t36, 26)} id="s11r" depth={110} /></g>
        <DrillBit x={900} y={1380} f={g} scale={1.2} tilt={1 - wake} tarp={1 - ease(f, t37 - 4, 20)} eyes={ease(f, t37 - 8, 12)} yawn={yawn} shake={shake} brow={6} id="s11b" />
        <Plumb x={230} y={-20} len={720} f={g} scale={1.35} mood="curious" amp={5} ph={0.2} look={0.7} id="s11p" shadow={false} />
      </SVG>
    </Frame>
  );
};

const Thermos: React.FC<{x: number; y: number; f: number; scale?: number}> = ({x, y, f, scale = 1}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <rect x={-16} y={-70} width={32} height={70} rx={8} fill="#3F5D8A" stroke={INK} strokeWidth={4.5} />
    <rect x={-18} y={-80} width={36} height={14} rx={5} fill={PR.bone} stroke={INK} strokeWidth={4} />
    <rect x={-16} y={-48} width={32} height={6} fill={PR.bone} opacity={0.6} />
    {[0, 1, 2].map((i) => {
      const ph = ((f / 40 + i / 3) % 1);
      return <path key={i} d={`M${(i - 1) * 9},${-86 - ph * 50} q8,-12 0,-24`} fill="none" stroke={PR.bone} strokeWidth={4} strokeLinecap="round" opacity={Math.sin(ph * Math.PI) * 0.7} />;
    })}
  </g>
);

// ---- S12: partners drill (keys 38, 39, 40) --------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t38 = b(38), t39 = b(39), t40 = b(40);
  const walk = easeIO(f, t39 - 30, 50);
  const walking = f > t39 - 30 && f < t39 + 22;
  const pxA = lerp(1320, 560, walk), pxB = lerp(1480, 720, walk);
  const reach = ease(f, t38, 14);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1100}
      overlay={<>
        <Plate x={540} text="IT DOESN'T DRILL" y={560} size={40} tone="ink" p={ease(f, t38 + 2, 8) * (f < t39 + 30 ? 1 : 0)} />
        <Plate x={540} text="PARTNERS DRILL · IT KEEPS AN INTEREST" displayLines={['PARTNERS DRILL ·', 'IT KEEPS AN INTEREST']} y={690} size={34} tone="brass" p={ease(f, t39 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={560} lampY={1100} seed={12} />
        <ContactShadow cx={pxA} cy={1296} rx={80} ry={11} opacity={0.3} blur={7} />
        <Character frame={g} x={pxA} y={1290} scale={0.95} facing={-1} pose="carry" emotion="neutral" outfit="worker" headgear="hardhat" walking={walking} walkPhase={g * 0.3} />
        <Thermos x={pxA - 120 * 0.95} y={1290 - 190 * 0.95} f={g} scale={0.9} />
        <ContactShadow cx={pxB} cy={1296} rx={80} ry={11} opacity={0.3} blur={7} />
        <Character frame={g + 17} x={pxB} y={1290} scale={0.95} facing={-1} pose="stand" emotion="neutral" outfit="puffer" headgear="hardhat" walking={walking} walkPhase={g * 0.3 + 2} />
        <DrillBit x={900} y={1380} f={g} scale={1.1} tilt={0} tarp={0} cape={ease(f, t39, 16)} eyes={1} brow={-4} id="s12b" />
        <Plumb x={430} y={-20} len={1150} f={g} scale={1.5} mood={f > t38 ? 'sheepish' : 'wary'} amp={4 + 9 * reach * (1 - ease(f, t38 + 40, 30))} ph={0.4} look={0.9} id="s12p" shadowY={1110}
          tag={f > t40 ? <HangTag text="KEEPS AN INTEREST" size={22} tone="brass" f={g} k={snap(f, t40, 10)} drop={40} /> : undefined} />
      </SVG>
    </Frame>
  );
};

// ---- S13: the announcing (keys 41, 42, 43, 44, 57) -------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t41 = b(41), t42 = b(42), t43 = b(43), t44 = b(44), t57 = b(57);
  const pulse = 1 + 0.07 * Math.sin(g / 5) * (f > t57 ? 1 : 0);
  const rise = snap(f, t41 - 6, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1150}
      overlay={<>
        <QuotePlate x={540} y={700} text={'"TWO OF THE MOST PROSPECTIVE PLACES IN THE WORLD" · MARK SUMNER, CEO'} wrap={21} size={32} p={ease(f, t41, 8)} type={ease(f, t42 + 10, t57 - t42 + 20)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={540} lampY={1150} seed={13} dim={0.25} near={true} />
        <Globe x={540} y={1180} r={250 * (0.6 + 0.4 * rise)} f={g} wrap={0} id="s13g" tiltDeg={-8} />
        <g transform={`translate(430,1240) scale(${pulse})`}><PinOutline x={0} y={0} f={g} scale={0.85} k={snap(f, t42, 12)} /></g>
        <g transform={`translate(660,1070) scale(${pulse})`}><PinOutline x={0} y={0} f={g} scale={0.85} k={snap(f, t42 + 8, 12)} /></g>
        <g transform="translate(430,1060)"><HangTag text="PERU" size={26} tone="bone" f={g} k={ease(f, t42 + 4, 8)} drop={30} /></g>
        <g transform="translate(660,890)"><HangTag text="ALASKA" size={26} tone="bone" f={g} k={ease(f, t42 + 12, 8)} drop={30} /></g>
        <g opacity={ease(f, t43, 8)} transform={`translate(0,${6 * Math.sin(g / 9)})`}>
          <circle cx={170} cy={1330} r={64} fill="none" stroke={INK} strokeWidth={14} />
          <circle cx={170} cy={1330} r={64} fill="none" stroke="#B87333" strokeWidth={7} strokeDasharray="14 10" strokeDashoffset={-g * 0.6} />
          <g transform="translate(170,1410)"><HangTag text="COPPER" size={22} tone="bone" f={g} k={ease(f, t43 + 4, 8)} drop={16} /></g>
        </g>
        <g opacity={ease(f, t44, 8)} transform={`translate(0,${6 * Math.sin(g / 8 + 1)})`}>
          <circle cx={910} cy={1330} r={64} fill="none" stroke={INK} strokeWidth={14} />
          <circle cx={910} cy={1330} r={64} fill="none" stroke="#E0B83A" strokeWidth={7} strokeDasharray="14 10" strokeDashoffset={-g * 0.6} />
          <g transform="translate(910,1410)"><HangTag text="GOLD" size={22} tone="bone" f={g} k={ease(f, t44 + 4, 8)} drop={16} /></g>
        </g>
        <DrillBit x={930} y={1760} f={g} scale={0.75} tilt={0} tarp={0} cape={1} eyes={1} brow={-3} id="s13b" />
        <Plumb x={150} y={-20} len={780} f={g} scale={1.35} mood="curious" amp={5} ph={2.6} look={0.6} id="s13p" shadow={false} />
      </SVG>
    </Frame>
  );
};

// ---- S14: the first hole (keys 52, 45, 50, 46) ------------------------------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t52 = b(52), t45 = b(45), t50 = b(50), t46 = b(46);
  const dig = ease(f, t46 + 6, 40);
  const spin = ease(f, t46 - 2, 8);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1100}
      overlay={<>
        <Plate x={540} text="WHO ACTS ON IT FIRST?" y={560} size={38} tone="ink" p={ease(f, t45 + 2, 8)} />
        <Plate x={540} text="WHO PAYS FOR THE FIRST HOLE?" displayLines={['WHO PAYS FOR', 'THE FIRST HOLE?']} y={700} size={38} tone="brass" p={ease(f, t50 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={440} lampY={1050} seed={14} />
        <VellumSheet x={540} y={1060} w={SHEET_W} h={SHEET_H} f={g} contours={0.7} rows={0.6} rowCount={18} patch={1} patchX={-40} patchY={90} id="s14v" />
        <ellipse cx={780} cy={1296} rx={14 + 52 * dig} ry={5 + 16 * dig} fill="#0A110E" stroke={INK} strokeWidth={4} />
        <DrillBit x={780} y={1296} f={g} scale={1.05} tilt={0} tarp={0} cape={1 - ease(f, t46 - 4, 8)} eyes={1} brow={f > t46 ? -6 : 4} spin={spin} sink={150 * dig} dust={dig * (1 - ease(f, t46 + 50, 30))} id="s14b" />
        <HollowQ x={330} y={900} size={110} f={g} k={snap(f, t45, 12)} color={PR.brass} />
        <HollowQ x={690} y={1040} size={90} f={g} k={snap(f, t50, 12)} color={PR.bone} />
        <Plumb x={560} y={-20} len={1100} f={g} scale={1.45} mood="wary" tremble={1} amp={5} look={0.5} id="s14p" shadowY={1110} />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={PR.spruceDeep} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={PR.bone}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'PLUMB', 2: 'DOWNLOAD', 3: 'PLANE', 4: 'ITS WORDS', 5: 'PUBLIC', 6: 'SURVEY', 7: 'GLOBE', 8: 'BENCH', 9: 'NO PROPERTY', 10: 'DEPOSITS', 11: 'BLOCK', 12: 'PARTNERS', 13: 'ANNOUNCING', 14: 'FIRST HOLE'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

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

export const ep1022Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1022Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1022: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 9.3, 18.6, 25.5, 36.6, 43.2, 54.9, 60.8, 68.0, 75.6, 83.8, 93.7, 100.3, 109.5, 116.64].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#10151F" ink="#F4EEDC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
