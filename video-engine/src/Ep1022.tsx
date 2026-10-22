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
import {PR, GroundBG, Plumb, plumbTip, DrillBit, VellumSheet, HangTag, HollowQ, Zzz, SurveyHeli, Globe, RockBlock, TableBG, LampArm, DuskTundraBG, PaperPlane, PinOutline, DownloadArrow, DepositBlob, ReleaseScroll, RollTube, Pedestal, Loupe, snap, rnd, bump} from './lib/prospect';
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
  brass: {fill: PR.kraft, fg: INK},
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

// ---- the ground world ----------------------------------------------------------------------------------------------------------------------
const SURF = 1130;
/** the sleeper: the steel bit lying under its moss tarp on the turf, introduced in the first shot and woken act by act */
const Sleeper: React.FC<{x?: number; f: number; scale?: number; twitch?: number; eyes?: number; zzz?: number; tarp?: number; tilt?: number; cape?: number; yawn?: number; shake?: number; brow?: number; id?: string}> =
({x = 930, f, scale = 0.6, twitch = 0, eyes = 0, zzz = 1, tarp = 1, tilt = 1, cape = 0, yawn = 0, shake = 0, brow = 0, id = 'sl'}) => (
  <g>
    <DrillBit x={x} y={SURF + 16} f={f} scale={scale} tilt={tilt} tarp={tarp} twitch={twitch} eyes={eyes} cape={cape} yawn={yawn} shake={shake} brow={brow} id={id} />
    {zzz > 0.02 && <Zzz x={x - 40 * scale} y={SURF - 110 * scale} f={f} k={zzz} scale={scale * 1.2} />}
  </g>
);
const MetaTag: React.FC<{f: number; k?: number}> = ({f, k = 1}) => <HangTag text="A MAP READER · METAPHOR" size={19} tone="bone" f={f} k={k} drop={34} sway={2} />;
/** Plumb in the home world: his string is fixed above the frame and his tip stops a hair above the turf at x */
const HairPlumb: React.FC<{x: number; f: number; scale?: number; mood?: React.ComponentProps<typeof Plumb>['mood']; amp?: number; ph?: number; look?: number; tremble?: number; tag?: React.ReactNode; id: string; lift?: number; meta?: boolean}> =
({x, f, scale = 1.45, mood = 'wary', amp = 5, ph = 0, look = 0, tremble = 0, tag, id, lift = 14, meta = true}) => (
  <Plumb x={x} y={-20} len={SURF - lift + 20} f={f} scale={scale} mood={mood} tremble={tremble} amp={amp} ph={ph} look={look} id={id} shadow={false}
    tag={<g>{meta && <MetaTag f={f} />}{tag}</g>} />
);
/** CoSign: Geomorphic's own nameplate, hung from the sky on its own string. Everything the company says hangs from IT, never from Plumb. */
const CoSign: React.FC<{x?: number; y?: number; f: number; k?: number; text?: string; extra?: string}> = ({x = 150, y = 690, f, k = 1, text = 'GEOMORPHIC AI', extra}) => (
  <g>
    <path d={`M${x},-20 L${x},${y}`} stroke={PR.bone} strokeWidth={2.4} opacity={0.9 * clamp01(k)} />
    <g transform={`translate(${x},${y - 34})`}>
      <HangTag text={text} size={26} tone="kraft" f={f} k={k} drop={34} sway={2.5} />
      {extra && <g transform="translate(0,64)"><HangTag text={extra} size={20} tone="kraft" f={f + 9} k={k} drop={28} sway={3} /></g>}
    </g>
  </g>
);
const SHEET_W = 820, SHEET_H = 1040;

// ---- S1: a hair above the ground (keys 1, 2, 3, 6) -------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t2 = b(2), t3 = b(3), t6 = b(6);
  const rows = easeIO(f, 8, 190);
  const rowCount = 12, sw = 420, sh = 480, sx = 250, sy = 900;
  const rowH = (sh - 28) / rowCount;
  const k = Math.min(rowCount - 1, Math.floor(rows * rowCount));
  const pr = clamp01(rows * rowCount - k);
  const dir = k % 2 ? -1 : 1;
  const hx = dir > 0 ? sx - sw / 2 + 14 + pr * (sw - 28) : sx + sw / 2 - 14 - pr * (sw - 28);
  const hy = sy - sh / 2 + 14 + (k + 0.5) * rowH - 30;
  const amp = 5 + 38 * Math.exp(-f / 15);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000}
      overlay={<>
        <Plate x={540} text="DGGS · TWO 2026 SURVEYS" y={540} size={36} tone="ink" p={ease(f, 4, 8) * (f < t2 + 40 ? 1 : 0)} />
        <Plate x={540} text="ABOUT 45,800 LINE-KM · THE FILM'S ARITHMETIC" displayLines={['ABOUT 45,800 LINE-KM', "THE FILM'S ARITHMETIC"]} y={640} size={34} tone="paper" p={ease(f, t2 + 2, 8)} />
      </>}>
      <SVG>
        <GroundBG f={g} surface={SURF} pondX={540} id="s1g" />
        <g transform={`translate(0,${6 * Math.sin(g / 41)})`}>
          <VellumSheet x={sx} y={sy} w={sw} h={sh} rot={-4} f={g} contours={ease(f, t3, 40) * 0.6} rows={rows} rowCount={rowCount} id="s1v" />
          {rows > 0.01 && rows < 0.995 && <SurveyHeli x={hx} y={hy} f={g} scale={0.42} facing={dir as 1 | -1} bird={50} swing={0} rotor={1} />}
        </g>
        <Sleeper f={g} x={890} scale={0.8} zzz={ease(f, t6, 12)} id="s1b" />
        <HairPlumb x={550} f={g} scale={1.6} tremble={1} amp={amp} look={0.4} id="s1p" />
      </SVG>
    </Frame>
  );
};

// ---- S2: offered for download (keys 4, 5, 48, 56) --------------------------------------------------------------------------------------------------
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
        <GroundBG f={g} surface={SURF} pondX={820} id="s2g" />
        {Array.from({length: N}).map((_, i) => {
          const a = (i - 2) * 15 * fan * (1 - square);
          const ox = (i - 2) * 100 * fan * (1 - square) + (i - 2) * 4 * square;
          const oy = Math.abs(i - 2) * 20 * fan * (1 - square) - i * 5 * square;
          return <VellumSheet key={i} x={360 + ox} y={900 + oy} w={400} h={500} rot={a} f={g} contours={0.8} rows={0.5 + 0.1 * i} rowCount={10} id={`s2v${i}`} dim={(4 - i) * 0.04} />;
        })}
        {[0, 1, 2, 3, 4].map((i) => <DownloadArrow key={i} x={360 + (i - 2) * 100 * (1 - square)} y={690 + Math.abs(i - 2) * 20} scale={0.6} f={g} k={ease(f, t5 + i * 5, 10) * (1 - ease(f, t56, 12))} id={`s2a${i}`} />)}
        <Sleeper f={g} x={940} scale={0.52} zzz={1} id="s2b" />
        <HairPlumb x={830} f={g} scale={1.5} mood="curious" amp={5} ph={1.4} look={-0.6} id="s2p" />
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
  const px = lerp(-120, 560, fly), py = lerp(1200, 990, fly) - 120 * Math.sin(fly * Math.PI);
  const land = ease(f, t10, 10);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1050}
      overlay={<>
        <Plate x={540} text="OCT 20TH" y={540} size={38} tone="ink" p={ease(f, t7 + 2, 8) * (f < t10 ? 1 : 0)} />
        <Plate x={540} text="OCT 20TH · GOLDEN DYKE EXPLORATION LLC" displayLines={['OCT 20TH · GOLDEN DYKE', 'EXPLORATION LLC']} y={760} size={34} tone="paper" p={ease(f, t10 + 2, 8)} />
      </>}>
      <SVG>
        <GroundBG f={g} surface={SURF} pondX={840} id="s3g" />
        <g transform={`translate(0,${5 * Math.sin(g / 37)})`}>
          <VellumSheet x={330} y={930} w={520} h={460} rot={3} f={g} contours={0.3} id="s3v" />
          <AlaskaMini frame={g} x={110} y={760} scale={1.1} pin={false} />
        </g>
        <PinOutline x={720} y={1060} f={g} scale={0.8} k={land} />
        <PaperPlane x={px} y={py} rot={lerp(-20, 4, fly)} scale={1.1} f={g} shadowDy={70 - 30 * fly} />
        {f > t8 && f < t10 + 8 && <g transform={`translate(${px - 60},${py + 20})`}><HangTag text="PORTLAND-BASED" size={24} tone="kraft" f={g} k={ease(f, t8, 8)} rot={-10} /></g>}
        <Sleeper f={g} x={950} scale={0.5} zzz={0.5} id="s3b" />
        <CoSign x={540} y={600} f={g} k={ease(f, t9, 8)} />
        <HairPlumb x={880} f={g} scale={1.4} mood="curious" amp={5} ph={2.1} look={-0.7} id="s3p" />
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
  const bx = lerp(200, 880, sweep);
  const qs: [number, number][] = [[200, 1290], [430, 1400], [660, 1300], [860, 1390], [540, 1240]];
  const pk = plumbTip(850, -20, SURF - 14 + 20, g, 4, 0.5, 0);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000}
      overlay={<>
        <Plate x={420} text="ITS WORDS · AI-DRIVEN PROSPECT GENERATOR" displayLines={['ITS WORDS ·', 'AI-DRIVEN PROSPECT GENERATOR']} y={560} size={34} tone="brass" p={ease(f, t12 + 2, 8)} />
        <Plate x={420} text="OVERLOOKED SYSTEMS?" y={730} size={36} tone="ink" p={ease(f, t13 + 2, 8) * (f < t14 ? 1 : 0)} />
        <Plate x={420} text="ITS WORDS · DRILL-READY DATA PACKAGES" displayLines={['ITS WORDS ·', 'DRILL-READY DATA PACKAGES']} y={815} size={34} tone="paper" p={ease(f, t14 + 2, 8)} />
      </>}>
      <SVG>
        <GroundBG f={g} surface={SURF} pondX={540} id="s4g" />
        {f > t13 - 14 && f < t13 + 90 && <path d={`M${pk.x},${pk.y} L${bx - 190},1560 L${bx + 190},1560 Z`} fill={PR.lichen} opacity={0.16 + 0.03 * Math.sin(f / 4)} />}
        {qs.map(([qx, qy], i) => <HollowQ key={i} x={qx} y={qy} size={96} f={g} k={snap(f, t13 + i * 9, 10)} color={PR.bone} />)}
        <RollTube x={170} y={900} scale={0.8} f={g} out={ease(f, t14, 26)} id="s4r" />
        <Sleeper f={g} x={940} scale={0.52} zzz={1 - ease(f, t53, 4)} tilt={1} id="s4b" />
        <CoSign x={420} y={410} f={g} k={ease(f, t11, 8)} />
        <HairPlumb x={850} f={g} scale={1.6} mood="curious" amp={4} ph={0.5} id="s4p" />
      </SVG>
    </Frame>
  );
};

// ---- S5: public data (keys 55, 15, 16, 17, 49) ------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t55 = b(55), t15 = b(15), t16 = b(16), t17 = b(17), t49 = b(49);
  const s1 = easeIO(f, t55, 26), s2 = easeIO(f, t16 - 12, 24);
  const tw = ease(f, t49, 6) * (1 - ease(f, t49 + 40, 20));
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1050}
      overlay={<>
        <Plate x={450} text="ITS WORDS · WHAT IT READS IS PUBLIC" displayLines={['ITS WORDS ·', 'WHAT IT READS IS PUBLIC']} y={560} size={34} tone="brass" p={ease(f, t55 + 2, 8)} />
        <Plate x={450} text="ITS WORDS · NEW STATE AIRBORNE SURVEYS" displayLines={['ITS WORDS ·', 'NEW STATE AIRBORNE SURVEYS']} y={750} size={34} tone="ink" p={ease(f, t16 + 2, 8)} />
      </>}>
      <SVG>
        <GroundBG f={g} surface={SURF} pondX={540} id="s5g" />
        <g transform={`translate(${lerp(-300, 0, s1)},${5 * Math.sin(g / 37)})`}>
          <VellumSheet x={230} y={920} w={380} h={440} rot={-5} f={g} contours={0.8} id="s5a" />
          <g transform="translate(230,1150)"><HangTag text="USGS + STATE MAPPING" size={20} tone="kraft" f={g} k={ease(f, t55 + 14, 8)} rot={-3} drop={26} /></g>
        </g>
        <g transform={`translate(${lerp(400, 0, s2)},${5 * Math.sin(g / 33 + 1)})`}>
          <VellumSheet x={690} y={900} w={240} h={440} rot={4} f={g} contours={ease(f, t17, 30)} glow={0} rows={0} id="s5b" />
        </g>
        <Sleeper f={g} x={955} scale={0.46} twitch={tw} zzz={1 - ease(f, t49, 6)} id="s5s" />
        <CoSign x={450} y={410} f={g} k={ease(f, t55, 8)} />
        <HairPlumb x={910} f={g} scale={1.5} mood="curious" amp={5} ph={3.1} look={-0.5} id="s5p" />
      </SVG>
    </Frame>
  );
};

// ---- S6: what one of those surveys looks like (keys 18, 19, 20, 49, 21, 22) -----------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t18 = b(18), t19 = b(19), t20 = b(20), t21 = b(21), t22 = b(22), t49 = b(21) - 10;
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

// ---- S8: the same map (keys 26, 27, 28) -------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t26 = b(26), t27 = b(27), t28 = b(28);
  const rx = [110, 290, 470];
  // a race: the third reader finishes first and steps toward the pedestal, the other two lean in after it
  const lean = (i: number) => ease(f, t26 + (i === 2 ? 0 : 26 + i * 8), 26);
  const step = ease(f, t28 - 6, 26);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1100}
      overlay={<>
        <Plate x={540} text="THE BEST CASE" y={560} size={38} tone="ink" p={ease(f, t26 + 2, 8)} />
        <Plate x={540} text="THE SAME MAP" y={630} size={38} tone="paper" p={ease(f, t27 + 2, 8)} />
        <Plate x={540} text="FIRST LOOK?" y={700} size={40} tone="brass" p={ease(f, t28 + 2, 8)} />
      </>}>
      <SVG>
        <TableBG f={g} lampX={560} lampY={1000} seed={8} pool={0.9} />
        {rx.map((x, i) => {
          const xx = x + (i === 2 ? 200 * step : 0);
          return (
            <g key={i}>
              <ContactShadow cx={xx} cy={1296} rx={80} ry={11} opacity={0.3} blur={7} />
              <Character frame={g + i * 13} x={xx} y={1290} scale={0.95} facing={1} pose="carry" emotion={i === 2 && f > t28 ? 'smug' : 'neutral'} outfit={['flannel', 'puffer', 'vest'][i] as 'flannel'} headgear={['beanie', 'bare', 'cap'][i] as 'bare'} hair={['#3d2c1e', '#7a5a3a', '#1f1c1a'][i]} idleGain={1} walking={i === 2 && f > t28 - 6 && f < t28 + 22} walkPhase={g * 0.3} />
              <Loupe x={xx + 120 * 0.95} y={1290 - 190 * 0.95 + 24 * lean(i)} scale={0.9} rot={-30} />
            </g>
          );
        })}
        <Pedestal x={930} y={1296} scale={0.95} />
        <HollowQ x={930} y={1050} size={120} f={g} k={snap(f, t28, 12)} color={PR.brass} />
        {[0, 1, 2].map((i) => <VellumSheet key={i} x={rx[i] + 150 + (i === 2 ? 200 * step : 0)} y={1330 - 8 * i} w={230} h={150} rot={i % 2 ? 4 : -4} f={g} contours={0.8} rows={0.5} rowCount={6} id={`s8v${i}`} />)}
        <g>{[0, 1, 2].map((i) => <DownloadArrow key={i} x={rx[i] + 150} y={1250} scale={0.42} f={g} k={ease(f, t27 + i * 3, 10) * (1 - ease(f, t27 + 40, 14))} id={`s8a${i}`} />)}</g>
        <rect data-band="ok" x={-40} y={1290} width={1160} height={110} fill="#2B1F16" stroke={INK} strokeWidth={6} />
        <Plumb x={250} y={-20} len={880} f={g} scale={1.3} mood={f > t28 ? 'ask' : 'curious'} amp={4} ph={1.1} look={0.5} id="s8p" shadow={false} tag={<MetaTag f={g} />} />
      </SVG>
    </Frame>
  );
};

// ---- S9: no property named (keys 29, 30, 31, 47) ----------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t29 = b(29), t30 = b(30), t31 = b(31), t47 = b(47);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1050}
      overlay={<>
        <Plate x={420} text="NO ALASKA PROPERTY NAMED YET" y={560} size={36} tone="ink" p={ease(f, t29 + 2, 8)} />
        <Plate x={420} text="SOON · ITS WORD" y={640} size={36} tone="paper" p={ease(f, t31 + 2, 8)} />
      </>}>
      <SVG>
        <GroundBG f={g} surface={SURF} pondX={790} dawn={0.15} id="s9g" />
        <g transform={`translate(0,${5 * Math.sin(g / 35)})`}>
          <VellumSheet x={250} y={950} w={420} h={420} rot={-3} f={g} contours={0.25} id="s9v" />
          <AlaskaMini frame={g} x={55} y={820} scale={0.95} pin={false} />
        </g>
        <g transform={`translate(0,${-10 + 8 * Math.sin(g / 15)})`}>
          <PinOutline x={520} y={1040} f={g} k={snap(f, t29, 12)} scale={1.0} />
          <g transform="translate(570,880)"><HangTag text="SOON" size={26} tone="kraft" f={g} k={ease(f, t31, 8)} rot={6} /></g>
        </g>
        <Sleeper f={g} x={960} scale={0.44} zzz={f > t47 ? 0 : 0.6} eyes={ease(f, t47, 10)} id="s9s" />
        <CoSign x={420} y={450} f={g} k={ease(f, t29, 8)} />
        <HairPlumb x={900} f={g} scale={1.5} mood={f > t30 ? 'worried' : 'wary'} tremble={f > t30 ? 0.7 : 0.4} amp={f > t30 && f < t30 + 70 ? 9 : 5} ph={0.9} look={-0.5} id="s9p"
          tag={f > t30 ? <g transform="translate(-215,60)"><HangTag text={f % 24 < 8 ? '?' : f % 24 < 16 ? '??' : '???'} size={34} tone="bone" f={g} k={ease(f, t30, 6)} /></g> : undefined} />
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
        <Plate x={540} text="NOT A SIGN OF ANYTHING ON ITS OWN GROUND" displayLines={['NOT A SIGN OF ANYTHING', 'ON ITS OWN GROUND']} y={800} size={32} tone="paper" p={ease(f, t34 + 2, 8)} />
      </>}>
      <SVG>
        <GroundBG f={g} surface={SURF} pondX={790} dawn={0.25} id="s10g" />
        {[[520, 'THEIRS'], [1010, 'THEIRS']].map(([bx, tx], i) => (
          <g key={i}>
            <DepositBlob x={bx as number} y={SURF - 10} f={g} scale={1.25} seed={i} k={snap(f, t33 + i * 6, 12)} id={`s10d${i}`} />
            <g transform={`translate(${bx as number},${SURF - 120})`}><HangTag text={tx as string} size={20} tone="kraft" f={g + i * 7} k={ease(f, t33 + 8 + i * 6, 8)} rot={i * 3 - 3} drop={36} /></g>
          </g>
        ))}
        <g opacity={ease(f, t34, 10)}>
          <ellipse cx={250} cy={SURF + 30} rx={150} ry={30} fill="none" stroke={INK} strokeWidth={13} />
          <ellipse cx={250} cy={SURF + 30} rx={150} ry={30} fill="none" stroke={PR.bone} strokeWidth={6} strokeDasharray="14 12" strokeDashoffset={-g * 0.7} />
        </g>
        <ReleaseScroll x={250} y={880} w={280} h={380} unroll={ease(f, t32, 30)} f={g} id="s10s" />
        <g transform="translate(220,1110)"><HangTag text="ITS RELEASE" size={22} tone="brass" f={g} k={ease(f, t32 + 10, 8)} rot={-3} drop={30} /></g>
        <CoSign x={190} y={330} f={g} k={ease(f, t33, 8)} />
        <HairPlumb x={850} f={g} scale={1.4} mood="wary" amp={4} ph={2.2} look={-0.4} id="s10p" />
      </SVG>
    </Frame>
  );
};

// ---- S11: a map shows rock (keys 35, 36, 37) --------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t35 = b(35), t36 = b(36), t37 = b(37);
  const wake = ease(f, t37 - 6, 22);
  const shake = ease(f, t37 + 34, 6) * (1 - ease(f, t37 + 64, 20));
  const yawn = Math.max(0, Math.sin(clamp01((f - t37 - 6) / 30) * Math.PI)) * (f < t37 + 40 ? 1 : 0);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1100}
      overlay={<>
        <Plate x={540} text="MAGNETISM + NATURAL RADIATION" y={560} size={34} tone="ink" p={ease(f, t35 + 2, 8)} />
        <Plate x={540} text="A MAP SHOWS WHERE ROCK DIFFERS" y={630} size={34} tone="paper" p={ease(f, t36 + 2, 8) * (f < t37 ? 1 : 0)} />
        <Plate x={540} text="A MAP SHOWS ROCK · A DRILL SHOWS WHAT'S IN IT" displayLines={["A MAP SHOWS ROCK ·", "A DRILL SHOWS WHAT'S IN IT"]} y={770} size={34} tone="brass" p={ease(f, t37 + 2, 8)} />
        <Plate x={540} text="THE FILM'S READ" y={870} size={26} tone="dusk" p={ease(f, t37 + 8, 8)} />
      </>}>
      <SVG>
        <GroundBG f={g} surface={SURF} pondX={330} dim={0.42 * ease(f, t35, 24)} glow={ease(f, t36, 24)} field={ease(f, t35, 20)} bend={0.5 + 0.5 * Math.sin(g / 14)} id="s11g" />
        <g transform={`translate(0,${5 * Math.sin(g / 31)})`}>
          <VellumSheet x={600} y={930} w={400} h={500} rot={3} f={g} contours={1} glow={ease(f, t35, 24)} patch={0} id="s11v" />
        </g>
        <DrillBit x={900} y={SURF + 16} f={g} scale={lerp(0.6, 1.05, wake)} tilt={1 - wake} tarp={1 - ease(f, t37 - 4, 20)} eyes={ease(f, t37 - 8, 12)} yawn={yawn} shake={shake} brow={6} id="s11b" />
        <HairPlumb x={330} f={g} scale={1.4} mood="curious" amp={5} ph={0.2} look={0.7} id="s11p" />
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
  const pxA = lerp(1320, 640, walk), pxB = lerp(1480, 790, walk);
  const reach = ease(f, t38, 14);
  // the partner nearest the bit steps up to it and the bit shoulders its tarp-cape
  const handoff = ease(f, t39 + 14, 18);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1100}
      overlay={<>
        <Plate x={640} text="ITS WORDS · IT DOESN'T DRILL" displayLines={['ITS WORDS ·', "IT DOESN'T DRILL"]} y={560} size={40} tone="ink" p={ease(f, t38 + 2, 8) * (f < t39 ? 1 : 0)} />
        <Plate x={640} text="ITS WORDS · PARTNERS DRILL · IT KEEPS AN INTEREST" displayLines={['ITS WORDS ·', 'PARTNERS DRILL ·', 'IT KEEPS AN INTEREST']} y={640} size={34} tone="brass" p={ease(f, t39 + 2, 8)} />
      </>}>
      <SVG>
        <GroundBG f={g} surface={SURF} pondX={300} dawn={0.6} id="s12g" />
        <ContactShadow cx={pxA} cy={SURF + 30} rx={80} ry={11} opacity={0.3} blur={7} />
        <Character frame={g} x={pxA} y={SURF + 26} scale={0.95} facing={-1} pose="carry" emotion="neutral" outfit="worker" headgear="hardhat" walking={walking} walkPhase={g * 0.3} />
        <Thermos x={pxA - 120 * 0.95} y={SURF + 26 - 190 * 0.95} f={g} scale={0.9} />
        <ContactShadow cx={pxB} cy={SURF + 30} rx={80} ry={11} opacity={0.3} blur={7} />
        <Character frame={g + 17} x={pxB} y={SURF + 26} scale={0.95} facing={-1} pose="stand" emotion="neutral" outfit="puffer" headgear="hardhat" walking={walking} walkPhase={g * 0.3 + 2} />
        <DrillBit x={940} y={SURF + 18} f={g} scale={1.0} tilt={1 - ease(f, t39 - 8, 20)} tarp={0} cape={ease(f, t39, 16)} eyes={1} brow={-4} id="s12b" />
        {handoff > 0.02 && <g transform={`translate(${830},${SURF - 270})`}><HangTag text="PARTNERS FUND + RUN IT" size={20} tone="kraft" f={g} k={snap(f, t39 + 14, 10)} drop={26} rot={4} /></g>}
        <CoSign x={640} y={410} f={g} k={ease(f, t38, 8)} />
        <HairPlumb x={240} f={g} scale={1.5} mood={f > t38 ? 'sheepish' : 'wary'} amp={4 + 9 * reach * (1 - ease(f, t38 + 40, 30))} ph={0.4} look={0.9} id="s12p" />

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
        <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={PR.spruceDeep} />
        {Array.from({length: 40}).map((_, i) => <circle key={i} data-band="ok" cx={rnd(i + 7) * 1080} cy={rnd(i + 57) * 1900} r={1.4 + rnd(i + 19) * 2.4} fill={PR.bone} opacity={0.3 + 0.4 * Math.abs(Math.sin(g / (24 + i) + i))} />)}
        <Globe x={540} y={1180} r={250 * (0.6 + 0.4 * rise)} f={g} wrap={0} id="s13g" tiltDeg={-8 + 2 * Math.sin(g / 40)} geo>
          {[[-135, -150, 'ALASKA', t42 + 8], [-58, 70, 'PERU', t42]].map(([px, py, lb, t0], i) => {
            const k = (r: number) => r * (0.6 + 0.4 * rise);
            const ring = ((g - (t0 as number)) / 24) % 1;
            return (
              <g key={i} transform={`translate(${k(px as number)},${k(py as number)}) scale(${pulse})`}>
                {f > (t0 as number) + 6 && [0, 1].map((j) => { const q = (ring + j * 0.5) % 1; return <ellipse key={j} cx={0} cy={0} rx={10 + 70 * q} ry={5 + 30 * q} fill="none" stroke={PR.bone} strokeWidth={4} opacity={(1 - q) * 0.7} />; })}
                <PinOutline x={0} y={0} f={g} scale={0.55} k={snap(f, t0 as number, 12)} />
                <g transform="translate(0,-130)"><HangTag text={lb as string} size={20} tone="bone" f={g} k={ease(f, (t0 as number) + 4, 8)} drop={20} /></g>
              </g>
            );
          })}
        </Globe>
        <g opacity={ease(f, t43, 8)} transform={`translate(0,${6 * Math.sin(g / 9)})`}>
          <circle cx={170} cy={1640} r={64} fill="none" stroke={INK} strokeWidth={14} />
          <circle cx={170} cy={1640} r={64} fill="none" stroke="#B87333" strokeWidth={7} strokeDasharray="14 10" strokeDashoffset={-g * 0.6} />
          <g transform="translate(170,1720)"><HangTag text="COPPER" size={22} tone="bone" f={g} k={ease(f, t43 + 4, 8)} drop={16} /></g>
        </g>
        <g opacity={ease(f, t44, 8)} transform={`translate(0,${6 * Math.sin(g / 8 + 1)})`}>
          <circle cx={910} cy={1640} r={64} fill="none" stroke={INK} strokeWidth={14} />
          <circle cx={910} cy={1640} r={64} fill="none" stroke="#E0B83A" strokeWidth={7} strokeDasharray="14 10" strokeDashoffset={-g * 0.6} />
          <g transform="translate(910,1720)"><HangTag text="GOLD" size={22} tone="bone" f={g} k={ease(f, t44 + 4, 8)} drop={16} /></g>
        </g>
        <Plumb x={310} y={-20} len={640} f={g} scale={1.1} mood="curious" amp={5} ph={2.6} look={0.6} id="s13p" shadow={false} />
      </SVG>
    </Frame>
  );
};

// ---- S14: the first hole (keys 52, 45, 50, 46) ------------------------------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t52 = b(52), t45 = b(45), t50 = b(50), t46 = b(46);
  const dig = easeIO(f, t50 + 4, 74);
  const spin = ease(f, t50 - 4, 12);
  const depth = 560 * dig;
  const bitY = SURF + 18 + depth;
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1100}
      overlay={<>
        <Plate x={540} text="WHO ACTS ON IT FIRST?" y={560} size={38} tone="ink" p={ease(f, t45 + 2, 8)} />
        <Plate x={540} text="WHO PAYS FOR THE FIRST HOLE?" displayLines={['WHO PAYS FOR', 'THE FIRST HOLE?']} y={700} size={38} tone="brass" p={ease(f, t50 + 2, 8)} />
      </>}>
      <SVG>
        <GroundBG f={g} surface={SURF} pondX={430} dawn={1} shaft={dig} shaftX={820} shaftTo={bitY} id="s14g" />
        {dig > 0.01 && <ellipse cx={820} cy={SURF + 6} rx={54 + 20 * dig} ry={11} fill="#050807" opacity={0.0} />}
        <DrillBit x={820} y={bitY} f={g} scale={1.0} tilt={0} tarp={0} cape={1 - ease(f, t50 - 10, 10)} eyes={1} brow={f > t50 ? -6 : 4} spin={spin} dust={f > t50 ? (1 - ease(f, t50 + 60, 30)) * (dig < 0.98 ? 1 : 0.3) : 0} shadow={dig < 0.02} id="s14b" />
        <HollowQ x={250} y={900} size={110} f={g} k={snap(f, t45, 12)} color={PR.brass} />
        <HollowQ x={620} y={930} size={90} f={g} k={snap(f, t50, 12)} color={PR.bone} />
        <HairPlumb x={430} f={g} scale={1.6} mood="wary" tremble={1} amp={5} look={0.5} id="s14p" />
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
