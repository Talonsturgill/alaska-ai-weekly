import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK, ContactShadow, FormGradient, tones} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {snap, bump, rnd, MONO, monoW} from './lib/prospect';
import {ServerMachine} from './lib/kit';
import {Plate as Sign, Ruler, SIGN} from './lib/sign';
import {IDS} from './Ep1025Ids';

// One Word, Every Size, 2026-10-25. Palette roles are art_direction.json. The PLATE (a brass-rimmed enamel sign with a face, lettered DATA CENTER) is the hero and the throughline: it fits a fridge and
// a gigawatt, strains against a ruler with no marks, and ends hanging from one open tick. It reacts to SIZE only. Signal pink (P.pink) is spent ONLY on the RECOMMENDED stamp (S2) and the open tick (S14).
// The Fairbanks tick is dashed ink and tagged PROPOSED. A recommendation is never drawn as a law: dashed hatching, a dashed board on a cart. No vote tally is drawn. The one bird is a plain gull.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const SERIF = 'Fraunces, Georgia, serif';
const P = {
  teal: '#2F6F6B', tealDeep: '#1B4A48', tealHi: '#4F8F8A', fog: '#C9D6D3', fogHi: '#E6EEEC', fogLo: '#9DB3B0', cedar: SIGN.cedar, cedarHi: SIGN.cedarHi, cedarShade: SIGN.cedarShade,
  cream: SIGN.cream, creamShade: SIGN.creamShade, brass: SIGN.brass, brassHi: SIGN.brassHi, brassShade: SIGN.brassShade, blue: SIGN.blue, blueDeep: '#2F7FA3', blueHi: '#9ED3E8',
  pink: SIGN.pink, amber: '#F2B84B', gold: '#E9C46A', ink: INK, stone: '#5E6B6A', stoneHi: '#8A9794', sea: '#3E7F86', seaDeep: '#25595F', slate: '#3B4B5C', steel: '#8E99A3', copper: '#C56B4A',
};
const C = {ink: INK, paper: '#F4EEDC'};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const easeIn = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'cream' | 'cedar' | 'dash';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#14202A', fg: P.cream},
  cream: {fill: P.cream, fg: '#14202A'},
  cedar: {fill: '#B07A52', fg: '#14202A'},
  dash: {fill: '#1B2B36', fg: P.cream},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number; dashed?: boolean}> =
({text, displayLines, x = 540, y, size = 34, tone = 'ink', p = 1, rot = 0, drop = 0, dashed = false}) => {
  const ls = displayLines ?? [text];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[dashed ? 'dash' : tone];
  const k = clamp01(p);
  const fr = useCurrentFrame();
  if (k <= 0.01) return null;
  const sc = (0.84 + 0.16 * Math.min(1, k * 1.15)) * (1 + 0.012 * Math.sin(fr / 11 + x * 0.01));
  return (
    <g opacity={Math.min(1, k * 1.6)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={dashed ? P.cream : C.ink} strokeWidth={dashed ? 3 : 4} strokeDasharray={dashed ? '14 9' : undefined} strokeDashoffset={dashed ? -fr * 0.7 : 0} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

/** a boxed quote typed to the voice: `type` (0..1) is how much has been typed */
const QuotePlate: React.FC<{text: string; by?: string; x?: number; y: number; size?: number; wrap?: number; p?: number; type?: number}> =
({text, by, x = 540, y, size = 44, wrap = 20, p = 1, type = 1}) => {
  const lines: string[] = [];
  let cur = '';
  text.split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > wrap) { lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const tw = Math.min(1000, Math.max(...lines.map((l) => l.length * size * 0.68), by ? monoW(by, 24) : 0) + 80);
  const th = lines.length * (size + 10) + (by ? 54 : 0) + 36;
  const yy = Math.min(y, CAP_GUARD - th / 2);
  assertCropSafe(text, yy - th / 2, yy + th / 2);
  const shown = Math.round(text.length * clamp01(type));
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
      {by && <text x={0} y={th / 2 - 20} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={24} letterSpacing={1} fill="#2F6F6B" opacity={clamp01(type * 3)}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: a camera that can move to any focus, kick, grade ---------------------------------------------------------------------
const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; dim?: number; children: React.ReactNode}> =
({p, cam, z0 = 1, z1 = 1.05, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, bloom = 0.04, vignette = 0.22, ox = 540, oy = 960, tag = true, overlay, tagText = CHIP, dim = 0, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + lerp(dx0, dx1, t) + 7 * Math.sin(p.f / 23)}px, ${jl.y + lerp(dy0, dy1, t) + 9 * Math.sin(p.f / 17 + 1)}px) rotate(${0.3 * Math.sin(p.f / 31)}deg) translate(540px, 960px) scale(${c.z * jl.scale * (1 + 0.008 * Math.sin(p.f / 13))}) translate(${-c.fx}px, ${-c.fy}px)`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {dim > 0 && <div style={{position: 'absolute', inset: 0, background: '#0A1A1E', opacity: dim}} />}
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#14202A" stroke={C.paper} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={C.paper}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.02} />
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

// ---- shared pieces --------------------------------------------------------------------------------------------------------------------------
const Gr: React.FC<{id: string; c: string}> = ({id, c}) => <defs><FormGradient id={id} t={tones(c)} /></defs>;

/** rain streaks, deterministic, slanting; always on, the film's ambient layer */
const Rain: React.FC<{f: number; n?: number; op?: number; len?: number; slant?: number; seed?: number; wind?: number}> = ({f, n = 70, op = 0.42, len = 48, slant = 0.2, seed = 0, wind = 0}) => (
  <g data-band="ok" opacity={op}>
    {Array.from({length: n}).map((_, i) => {
      const x0 = rnd(i + seed * 97) * 1400 - 160;
      const sp = 24 + rnd(i + 7) * 22;
      const y = ((rnd(i + 3) * 2200 + f * sp) % 2200) - 140;
      const sl = slant + wind;
      return <line key={i} x1={x0 - y * sl * 0.35} y1={y} x2={x0 - y * sl * 0.35 - len * sl} y2={y + len} stroke="#DCEBEA" strokeWidth={2.6 + rnd(i + 9) * 1.4} strokeLinecap="round" />;
    })}
  </g>
);

/** the harbor behind everything: fog sky, two fir ridges, a teal sound. `dark` 0..1 is the squall, `gold` a late break. */
const Harbor: React.FC<{f: number; id: string; horizon?: number; dark?: number; gold?: number; drift?: number}> = ({f, id, horizon = 1000, dark = 0, gold = 0, drift = 1}) => {
  const mix = (a: string, b: string, t: number) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const skyTop = mix(mix(P.fog, '#6F8C8E', 0.15), '#2A4447', dark);
  const skyLow = mix(mix(P.fogHi, '#B9CCC8', 0.1), '#587A7A', dark);
  const ridge = (y0: number, amp: number, seed: number, off: number) => {
    let d = `M-40,${horizon + 30}`;
    for (let i = 0; i <= 14; i++) d += ` L${-40 + i * 90 + off},${y0 - amp * (0.4 + rnd(i + seed) * 0.9)}`;
    return d + ` L1160,${horizon + 30} Z`;
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${id}_s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={skyTop} /><stop offset="1" stopColor={skyLow} /></linearGradient>
        <linearGradient id={`${id}_w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix(P.sea, '#1D3A3E', dark)} /><stop offset="1" stopColor={mix(P.seaDeep, '#10272B', dark)} /></linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={horizon + 40} fill={`url(#${id}_s)`} />
      {gold > 0.01 && <rect x={0} y={0} width={W} height={horizon + 40} fill={P.gold} opacity={0.2 * gold} />}
      {/* low cloud bands */}
      {Array.from({length: 4}).map((_, i) => <ellipse key={i} cx={((i * 330 + f * 0.35 * drift) % 1500) - 200} cy={horizon - 520 + i * 70} rx={340} ry={42} fill="#fff" opacity={0.2 * (1 - dark * 0.5)} />)}
      <path d={ridge(horizon - 130, 120, 3, 0)} fill={mix('#7E9A98', '#34504F', dark)} stroke={INK} strokeWidth={3.5} />
      <path d={ridge(horizon - 40, 90, 11, 40)} fill={mix('#4D6F6C', '#203938', dark)} stroke={INK} strokeWidth={3.5} />
      {Array.from({length: 16}).map((_, i) => <path key={i} d={`M${i * 74 + 12},${horizon + 4} l14,-48 l14,48 Z`} fill={mix('#2F5654', '#16302F', dark)} stroke={INK} strokeWidth={2.2} opacity={0.9} />)}
      <rect x={0} y={horizon} width={W} height={H - horizon} fill={`url(#${id}_w)`} />
      {Array.from({length: 9}).map((_, i) => <path key={i} d={`M${60 + (i * 137) % 900},${horizon + 40 + i * 24} q40,${6 * Math.sin(f / 15 + i)} 90,0`} stroke="#9FD0CF" strokeWidth={3} fill="none" opacity={0.35} strokeLinecap="round" />)}
    </g>
  );
};

/** the wet cedar boardwalk in the near plane: planks converging, a rail along the far edge, puddles that ripple. */
const Boardwalk: React.FC<{f: number; y0?: number; id?: string; puddles?: boolean; rail?: boolean}> = ({f, y0 = 1260, id = 'bw', puddles = true, rail = true}) => (
  <g>
    <Gr id={`${id}_g`} c={P.cedar} />
    <rect x={0} y={y0} width={W} height={H - y0} fill={`url(#${id}_g)`} />
    <rect x={0} y={y0} width={W} height={H - y0} fill="#0E1F20" opacity={0.12} />
    {Array.from({length: 14}).map((_, i) => <line key={i} x1={540 + (i - 7) * 36} y1={y0} x2={540 + (i - 7) * 190} y2={H} stroke={INK} strokeWidth={4} opacity={0.55} />)}
    {Array.from({length: 7}).map((_, i) => { const yy = y0 + Math.pow(i / 6, 1.7) * (H - y0 - 20) + 24; return <line key={i} x1={0} y1={yy} x2={W} y2={yy} stroke={INK} strokeWidth={3} opacity={0.35} />; })}
    {puddles && [[250, y0 + 190, 150], [800, y0 + 330, 190]].map(([px, py, pr], i) => (
      <g key={i}>
        <ellipse cx={px} cy={py} rx={pr} ry={pr * 0.17} fill="#9FD0CF" opacity={0.42} />
        <ellipse cx={px + 10} cy={py} rx={pr * (0.35 + 0.35 * ((f / 40 + i * 0.4) % 1))} ry={pr * 0.05 * (0.35 + 0.35 * ((f / 40 + i * 0.4) % 1))} fill="none" stroke="#E6EEEC" strokeWidth={2.4} opacity={0.6 * (1 - ((f / 40 + i * 0.4) % 1))} />
      </g>
    ))}
    {rail && (
      <g>
        <rect x={-10} y={y0 - 58} width={W + 20} height={20} fill={P.cedarHi} stroke={INK} strokeWidth={5} />
        {Array.from({length: 7}).map((_, i) => <rect key={i} x={30 + i * 168} y={y0 - 38} width={22} height={62} fill={P.cedar} stroke={INK} strokeWidth={4} />)}
      </g>
    )}
  </g>
);

/** a plain gull, the film's one bird: fly flaps, perch breathes and glances */
const Gull: React.FC<{x: number; y: number; s?: number; f: number; mode?: 'fly' | 'perch'; facing?: 1 | -1; pencil?: number; carry?: boolean}> = ({x, y, s = 1, f, mode = 'perch', facing = 1, pencil = 0, carry = false}) => {
  const flap = mode === 'fly' ? 38 * Math.sin(f / 2.6) : 6 + 3 * Math.sin(f / 21);
  const bob = mode === 'fly' ? 5 * Math.sin(f / 5) : 0.8 * Math.sin(f / 17);
  const head = mode === 'perch' ? 6 * Math.sin(f / 33) : 0;
  return (
    <g transform={`translate(${x},${y + bob}) scale(${s * facing},${s})`}>
      {mode === 'perch' && <ContactShadow cx={0} cy={44} rx={34} ry={7} opacity={0.3} />}
      <g transform={`translate(-6,-24) rotate(${-flap})`}>
        <path d="M0,0 q-70,-6 -110,24 q44,6 74,-4 q-30,16 -52,22 q48,6 88,-22 Z" fill="#C9D4D8" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        <path d="M-90,22 q8,-6 14,-2" stroke="#3B4B5C" strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      <path d="M-44,-4 q8,-36 44,-36 q40,0 48,34 q2,30 -26,42 q-38,12 -58,-12 q-8,-12 -8,-28 Z" fill="#F4F1E8" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-34,10 q18,14 50,4" stroke="#D6D0BE" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M-44,-4 l-30,-12 l8,28 Z" fill="#C9D4D8" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <g transform={`translate(34,-40) rotate(${head})`}>
        <circle cx={0} cy={0} r={20} fill="#F4F1E8" stroke={INK} strokeWidth={5} />
        <path d="M16,-2 l34,6 l-34,8 Z" fill="#E8A21B" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={5} cy={-5} r={4.6} fill={INK} />
        {pencil > 0.02 && <g opacity={pencil}><rect x={26} y={2} width={64} height={7} rx={2} fill="#E8B04A" stroke={INK} strokeWidth={3} transform="rotate(14 26 2)" /><path d="M88,16 l10,6 l-12,0 Z" fill="#14202A" /></g>}
      </g>
      {mode === 'perch' && <g><path d="M-6,44 l-4,26 M10,44 l4,26" stroke="#E8A21B" strokeWidth={5} strokeLinecap="round" /></g>}
      {mode === 'fly' && carry && <g><path d="M-8,40 l-10,40 M10,40 l10,40" stroke="#E8A21B" strokeWidth={5} strokeLinecap="round" /></g>}
    </g>
  );
};

/** the Cubby: a shelf ServerMachine in copper at fridge scale. base at (x, y). */
const Cubby: React.FC<{x: number; y: number; s?: number; f: number; emotion?: 'nervous' | 'focused' | 'shock' | 'greedy'; look?: number; phase?: number}> = ({x, y, s = 0.72, f, emotion = 'nervous', look = 0, phase = 1.3}) => (
  <g>
    <ContactShadow cx={x} cy={y + 6} rx={200 * s} ry={13} opacity={0.34} blur={8} />
    <ServerMachine frame={f} emotion={emotion} x={x} y={y} scale={s} tint="copper" lookX={look} phase={phase} />
  </g>
);

/** a big flat-fronted campus block: ribbed roof, fans, a loading door, rows of small windows. w x h at base (x, y). */
const Slab: React.FC<{x: number; y: number; w: number; h: number; f: number; id: string; windows?: number; fans?: number}> = ({x, y, w, h, f, id, windows = 6, fans = 3}) => (
  <g transform={`translate(${x},${y})`}>
    <Gr id={`${id}_g`} c="#7C8A94" />
    <ContactShadow cx={0} cy={8} rx={w * 0.52} ry={16} opacity={0.38} blur={10} />
    <rect x={-w / 2} y={-h} width={w} height={h} fill={`url(#${id}_g)`} stroke={INK} strokeWidth={8} />
    <rect x={-w / 2 - 10} y={-h - 22} width={w + 20} height={26} fill="#5A6770" stroke={INK} strokeWidth={6} />
    {Array.from({length: fans}).map((_, i) => {
      const cx = -w / 2 + (w / (fans + 1)) * (i + 1);
      return <g key={i} transform={`translate(${cx},${-h - 56})`}>
        <ellipse cx={0} cy={26} rx={44} ry={9} fill="#000" opacity={0.25} />
        <rect x={-34} y={-8} width={68} height={34} fill="#9AA6AE" stroke={INK} strokeWidth={5} />
        <g transform={`rotate(${f * 14 + i * 40} 0 9) scale(1,0.45)`}>{[0, 1, 2].map((k) => <ellipse key={k} cx={0} cy={0} rx={30} ry={7} fill="#E6EEEC" stroke={INK} strokeWidth={3} transform={`translate(0,9) rotate(${k * 60})`} />)}</g>
      </g>;
    })}
    {Array.from({length: 3}).map((_, r) => Array.from({length: windows}).map((__, c) => {
      const wx = -w / 2 + 34 + c * ((w - 68) / windows), wy = -h + 34 + r * (h * 0.2);
      const lit = rnd(r * 13 + c * 5 + id.length) > 0.55;
      return <rect key={`${r}-${c}`} x={wx} y={wy} width={(w - 68) / windows - 14} height={h * 0.11} fill={lit ? P.amber : '#2B3A44'} stroke={INK} strokeWidth={3} opacity={lit ? 0.92 : 1} />;
    }))}
    <rect x={-w * 0.12} y={-h * 0.24} width={w * 0.24} height={h * 0.24} fill="#3B4B5C" stroke={INK} strokeWidth={6} />
    {[0.25, 0.5, 0.75].map((k) => <line key={k} x1={-w * 0.12 + w * 0.24 * k} y1={-h * 0.24} x2={-w * 0.12 + w * 0.24 * k} y2={0} stroke={INK} strokeWidth={3} />)}
  </g>
);

/** a bench box with three LEDs (the 1 KW) */
const LabBox: React.FC<{x: number; y: number; s?: number; f: number; id: string}> = ({x, y, s = 1, f, id}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Gr id={`${id}_g`} c="#9AA6AE" />
    <ContactShadow cx={0} cy={6} rx={84} ry={9} opacity={0.34} blur={7} />
    <rect x={-70} y={-96} width={140} height={96} rx={8} fill={`url(#${id}_g)`} stroke={INK} strokeWidth={6} />
    <rect x={-58} y={-84} width={116} height={14} fill="#5A6770" stroke={INK} strokeWidth={3} />
    {[0, 1, 2].map((i) => <circle key={i} cx={-34 + i * 34} cy={-44} r={8} fill={Math.sin(f / 5 + i * 2) > -0.2 ? P.amber : '#5A6770'} stroke={INK} strokeWidth={3} />)}
    <rect x={-40} y={-26} width={80} height={10} rx={3} fill="#2B3A44" stroke={INK} strokeWidth={3} />
  </g>
);

/** a shipping-container-size block (the 1 MW) */
const Container: React.FC<{x: number; y: number; s?: number; id: string}> = ({x, y, s = 1, id}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <Gr id={`${id}_g`} c="#4F7C99" />
    <ContactShadow cx={0} cy={6} rx={170} ry={11} opacity={0.34} blur={8} />
    <rect x={-150} y={-150} width={300} height={150} fill={`url(#${id}_g)`} stroke={INK} strokeWidth={7} />
    {Array.from({length: 12}).map((_, i) => <line key={i} x1={-136 + i * 25} y1={-142} x2={-136 + i * 25} y2={-8} stroke={INK} strokeWidth={3} opacity={0.5} />)}
    <rect x={-150} y={-150} width={300} height={14} fill="#6FA0BE" stroke={INK} strokeWidth={4} />
    <rect x={118} y={-122} width={26} height={96} fill="#2B3A44" stroke={INK} strokeWidth={4} />
  </g>
);

/** a lit slim tower of `rows` x 2 windows; `lit` is the fraction of windows lit (amber) */
const Tower: React.FC<{x: number; y: number; rows?: number; lit?: number; f: number; id: string; s?: number; shadow?: boolean}> = ({x, y, rows = 13, lit = 1, f, id, s = 1, shadow = true}) => {
  const h = rows * 40 + 56;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <Gr id={`${id}_g`} c="#6C7C86" />
      {shadow && <ContactShadow cx={0} cy={6} rx={92} ry={10} opacity={0.34} blur={8} />}
      <rect x={-42} y={-h} width={84} height={h} fill={`url(#${id}_g)`} stroke={INK} strokeWidth={6} />
      <rect x={-50} y={-h - 14} width={100} height={20} fill="#4A5963" stroke={INK} strokeWidth={5} />
      <line x1={0} y1={-h - 14} x2={0} y2={-h - 56} stroke={INK} strokeWidth={5} />
      {Array.from({length: rows * 2}).map((_, i) => {
        const r = Math.floor(i / 2), c = i % 2;
        const on = i / (rows * 2) < lit && (rnd(i + id.length * 3) > 0.12 || lit < 0.99 ? true : true);
        return <rect key={i} x={-30 + c * 34} y={-h + 28 + r * 40} width={24} height={26} fill={on ? P.amber : '#2B3A44'} stroke={INK} strokeWidth={3} opacity={on ? 0.8 + 0.2 * Math.sin(f / 9 + i) : 1} />;
      })}
      <rect x={-14} y={-26} width={28} height={26} fill="#3B4B5C" stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** a cedar signpost with a blank cream board; the board's text is sized to its string by arithmetic. */
const Signpost: React.FC<{x: number; y: number; lines: string[]; size?: number; k?: number; f: number; sag?: number; id: string; tone?: 'cream' | 'blue'}> = ({x, y, lines, size = 30, k = 1, f, sag = 0, id, tone = 'cream'}) => {
  const kk = clamp01(k);
  if (kk <= 0.01) return null;
  const bw = Math.max(...lines.map((l) => monoW(l, size))) + 52;
  const bh = lines.length * (size + 14) + 30;
  const rise = (1 - kk) * 520;
  const sw = 2.2 * Math.sin(f / 21 + x) * (1 + sag);
  return (
    <g transform={`translate(${x},${y + rise}) rotate(${sw})`} opacity={Math.min(1, kk * 2)}>
      <ContactShadow cx={0} cy={6} rx={70} ry={9} opacity={0.34} blur={7} />
      <Gr id={`${id}_p`} c={P.cedar} />
      <rect x={-22} y={-560} width={44} height={560} rx={6} fill={`url(#${id}_p)`} stroke={INK} strokeWidth={6} />
      <g transform={`translate(0,${-470 + sag * 26})`}>
        <rect x={-bw / 2 + 5} y={-bh / 2 + 7} width={bw} height={bh} rx={6} fill="#000" opacity={0.28} />
        <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={6} fill={tone === 'cream' ? P.cream : P.blueHi} stroke={INK} strokeWidth={6} />
        <rect x={-bw / 2 + 8} y={-bh / 2 + 8} width={bw - 16} height={bh - 16} rx={3} fill="none" stroke={P.brass} strokeWidth={3} />
        {lines.map((l, i) => <text key={i} x={0} y={-bh / 2 + 15 + (size + 14) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.5} fill={INK}>{l}</text>)}
        {sag > 0.05 && <path d={`M${-bw / 2 + 40},${bh / 2 + 4} q4,${16 * sag} 0,${28 * sag}`} stroke={P.blueHi} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />}
      </g>
    </g>
  );
};

/** a hammer on a swing: pivot at the handle's end. swing in degrees. */
const Hammer: React.FC<{x: number; y: number; s?: number; swing?: number; f: number}> = ({x, y, s = 1, swing = 0, f}) => (
  <g transform={`translate(${x},${y}) rotate(${swing + 1.2 * Math.sin(f / 19)}) scale(${s})`}>
    <rect x={-13} y={-320} width={26} height={320} rx={8} fill={P.cedarHi} stroke={INK} strokeWidth={6} />
    <rect x={-6} y={-312} width={7} height={300} fill={P.cream} opacity={0.35} />
    <rect x={-84} y={-390} width={168} height={82} rx={12} fill="#7C8A94" stroke={INK} strokeWidth={7} />
    <rect x={-72} y={-380} width={144} height={16} rx={6} fill="#C9D4D8" opacity={0.7} />
    <rect x={44} y={-380} width={40} height={72} rx={8} fill="#5A6770" stroke={INK} strokeWidth={5} />
  </g>
);

/** a plain unlettered sign board on a stake (the S9 boards): the string, if any, is a Plate overlay */
const Board: React.FC<{x: number; y: number; w?: number; h?: number; k?: number; f: number; id: string; nail?: number; tilt?: number}> = ({x, y, w = 340, h = 230, k = 1, f, id, nail = 0, tilt = 0}) => {
  const kk = clamp01(k);
  if (kk <= 0.01) return null;
  return (
    <g transform={`translate(${x},${y}) rotate(${tilt + 1.4 * Math.sin(f / 23 + x)})`} opacity={Math.min(1, kk * 2)}>
      <ContactShadow cx={0} cy={h * 0.5 + 40} rx={w * 0.4} ry={10} opacity={0.3} blur={8} />
      <Gr id={`${id}_p`} c={P.cedarHi} />
      <rect x={-18} y={0} width={36} height={h * 0.55 + 40} fill={P.cedar} stroke={INK} strokeWidth={6} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={`url(#${id}_p)`} stroke={INK} strokeWidth={7} />
      {[0.3, 0.62].map((q) => <line key={q} x1={-w / 2 + 12} y1={-h / 2 + h * q} x2={w / 2 - 12} y2={-h / 2 + h * q} stroke={INK} strokeWidth={3} opacity={0.4} />)}
      {nail > 0.02 && <g opacity={Math.min(1, nail * 3)}><circle cx={0} cy={-h * 0.1} r={14} fill="#C9D4D8" stroke={INK} strokeWidth={5} /><path d={`M0,${-h * 0.1} l0,${20 * nail}`} stroke={INK} strokeWidth={7} strokeLinecap="round" /></g>}
    </g>
  );
};


/** the near plane below the caption bar: a bollard with a rope loop, a bucket, a coil of rope, a puddle that rings. Seeded so no two shots set the same corner. */
const Foreground: React.FC<{f: number; seed?: number}> = ({f, seed = 0}) => {
  const flip = seed % 2 === 1 ? -1 : 1;
  const ox = flip === 1 ? 0 : W;
  return (
    <g transform={`translate(${ox},0) scale(${flip},1)`}>
      <ellipse cx={560} cy={1840} rx={230} ry={30} fill="#9FD0CF" opacity={0.4} />
      <ellipse cx={560} cy={1840} rx={50 + 150 * ((f / 46 + seed * 0.3) % 1)} ry={8 + 22 * ((f / 46 + seed * 0.3) % 1)} fill="none" stroke="#E6EEEC" strokeWidth={3} opacity={0.7 * (1 - ((f / 46 + seed * 0.3) % 1))} />
      <g transform="translate(150,1600)">
        <ContactShadow cx={0} cy={168} rx={90} ry={14} opacity={0.4} blur={8} />
        <Gr id={`fg${seed}b`} c={P.cedar} />
        <path d="M-56,160 L-48,0 Q0,-26 48,0 L56,160 Z" fill={`url(#fg${seed}b)`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <ellipse cx={0} cy={-2} rx={52} ry={16} fill={P.cedarHi} stroke={INK} strokeWidth={6} />
        <path d={`M-40,40 q-50,${60 + 6 * Math.sin(f / 20 + seed)} 10,120`} stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
        <path d={`M-40,40 q-50,${60 + 6 * Math.sin(f / 20 + seed)} 10,120`} stroke="#D9C79A" strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray="12 7" />
      </g>
      <g transform="translate(820,1700)">
        <ContactShadow cx={0} cy={100} rx={130} ry={14} opacity={0.38} blur={8} />
        {[0, 1, 2].map((i) => <ellipse key={i} cx={0} cy={i * 26} rx={110 - i * 4} ry={30} fill="#D9C79A" stroke={INK} strokeWidth={5} />)}
        <ellipse cx={0} cy={-4} rx={62} ry={16} fill="#8A5A3B" stroke={INK} strokeWidth={5} />
        <path d="M60,40 q70,30 110,70" stroke="#D9C79A" strokeWidth={9} fill="none" strokeLinecap="round" />
      </g>
      <g transform="translate(470,1760)">
        <ContactShadow cx={0} cy={110} rx={90} ry={12} opacity={0.36} blur={8} />
        <path d="M-70,0 L-58,110 Q0,124 58,110 L70,0 Z" fill={P.cedarHi} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {[-34, 0, 34].map((x) => <line key={x} x1={x} y1={4} x2={x * 0.9} y2={112} stroke={INK} strokeWidth={4} opacity={0.5} />)}
        <ellipse cx={0} cy={0} rx={70} ry={16} fill={P.blueDeep} stroke={INK} strokeWidth={6} />
        <ellipse cx={0} cy={0} rx={58 + 8 * Math.sin(f / 9 + seed)} ry={11} fill="none" stroke={P.blueHi} strokeWidth={3} opacity={0.8} />
        <path d="M-68,6 q68,-70 136,0" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

// ---- S1: one sign (keys 1, 2, 3, 4) -------------------------------------------------------------------------------------------------------------
const PowerWall: React.FC<{f: number; id: string; y1?: number}> = ({f, id, y1 = 1200}) => (
  <g>
    <Gr id={`${id}_w`} c="#7A5236" />
    <rect x={0} y={0} width={W} height={y1} fill={`url(#${id}_w)`} />
    {Array.from({length: 14}).map((_, i) => <line key={i} x1={i * 80} y1={0} x2={i * 80} y2={y1} stroke={INK} strokeWidth={4} opacity={0.5} />)}
    {Array.from({length: 5}).map((_, i) => <rect key={i} x={i * 230 + 30} y={160 + (i % 3) * 360} width={90} height={9} fill="#3C2415" opacity={0.35} />)}
    <g transform="translate(790,520)">
      <rect x={-140} y={-170} width={280} height={340} rx={10} fill="#1B2D33" stroke={INK} strokeWidth={9} />
      <rect x={-126} y={-156} width={252} height={312} rx={4} fill="#9FB6B4" opacity={0.85} />
      <rect x={-126} y={-156} width={252} height={312} rx={4} fill={P.amber} opacity={0.22} />
      <line x1={0} y1={-156} x2={0} y2={156} stroke={INK} strokeWidth={7} /><line x1={-126} y1={0} x2={126} y2={0} stroke={INK} strokeWidth={7} />
      {Array.from({length: 9}).map((_, i) => { const ph = (f * 3 + i * 97) % 340; return <line key={i} x1={-120 + i * 30} y1={-156 + ph * 0.9} x2={-124 + i * 30} y2={-136 + ph * 0.9} stroke="#E6EEEC" strokeWidth={3} opacity={0.7} />; })}
      <rect x={-156} y={168} width={312} height={20} fill={P.cedarHi} stroke={INK} strokeWidth={6} />
    </g>
  </g>
);

const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t2 = b(2), t3 = b(3), t4 = b(4);
  const drop = snap(f, 2, 12);
  const dropY = lerp(-380, 1338, Math.min(1, drop));
  const grab = ease(f, t3 - 8, 14);
  const fly = easeIO(f, t3 - 6, 30);
  const land = snap(f, t4 - 4, 12);
  const gx = lerp(1320, 700, ease(f, t3 - 36, 28)) + (f > t3 ? lerp(0, -170, fly) : 0);
  const gy = lerp(-80, 1010, ease(f, t3 - 36, 28)) + (f > t3 ? lerp(0, -330, fly) : 0);
  const slab = ease(f, t3 - 4, 34);
  const hint = 0.38 * (1 - slab);
  const plateX = f < t3 - 8 ? 700 : lerp(700, 560, fly);
  const plateY = f < 4 ? dropY : (f < t3 - 8 ? 1338 : lerp(1338, 1360, fly) - 120 * Math.sin(fly * Math.PI) * (1 - land));
  const str = lerp(0, 660, ease(f, t4, 18)) * (1 - 0.0 * land) + 14 * Math.sin(f / 3) * ease(f, t4 + 18, 6);
  const settle = f > t4 + 28 ? 0 : 1;
  const mood = f < t3 - 8 ? 'smug' : f < t4 ? 'alarm' : 'strained';
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: t3 + 10, z: 1.0, fx: 540, fy: 940}, {t: p.dur, z: 1.05, fx: 560, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="FRIDGE SIZE" y={560} size={34} tone="ink" p={ease(f, t2, 8) * (1 - ease(f, t3 + 4, 8))} />
        <Plate x={540} text="CAMPUS" y={635} size={34} tone="ink" p={ease(f, t3 + 6, 8) * (1 - ease(f, t4, 8))} />
        <Plate x={540} text="1 GIGAWATT" y={710} size={34} tone="ink" p={ease(f, t4 + 4, 8)} />
      </>}>
      <SVG>
        <PowerWall f={g} id="s1" />
        <Boardwalk f={g} y0={1190} id="s1b" puddles={false} rail={false} />
        <Foreground f={g} seed={1} />
        {hint > 0.01 && <g opacity={hint} transform="translate(1010,0)"><Slab x={0} y={1330} w={760} h={560} f={g} id="s1h" windows={5} fans={3} /></g>}
        {slab > 0.01 && <g transform={`translate(${lerp(1500, 580, slab)},0)`}><Slab x={0} y={1330} w={1060} h={740} f={g} id="s1s" windows={7} fans={4} /></g>}
        <Cubby x={f < t3 ? 290 : lerp(290, 150, ease(f, t3, 20))} y={1340} s={0.72} f={g} emotion={f > t3 + 4 ? 'shock' : 'nervous'} look={f > t3 ? 0.6 : 0} />
        <Sign x={plateX} y={plateY} s={0.95} f={g} mood={mood} stretchPx={str} crack={0} legs={f < t3 - 8 || f > t4 - 4} legH={f < t3 - 8 ? 44 : 44} look={f > t3 ? 4 : -4} phase={0.4} id="s1p" />
        {f < t3 - 36 && <Gull x={800} y={706} s={0.9} f={g} mode="perch" facing={-1} />}
        {f >= t3 - 36 && f < t3 + 40 && <Gull x={gx} y={gy} s={1.25} f={g} mode="fly" facing={-1} carry={grab > 0.3} />}
        {f > 2 && f < 20 && <ellipse cx={700} cy={1340} rx={lerp(30, 260, ease(f, 6, 12))} ry={lerp(6, 40, ease(f, 6, 12))} fill="none" stroke="#DCEBEA" strokeWidth={5 * (1 - ease(f, 6, 12))} opacity={0.8} />}
        {settle > 0 && f > t4 && f < t4 + 12 && <circle cx={560} cy={1300} r={ease(f, t4, 12) * 520} fill="none" stroke="#DCEBEA" strokeWidth={6 * (1 - ease(f, t4, 12))} opacity={0.5} />}
        <Rain f={g} />
      </SVG>
    </Frame>
  );
};

// ---- S2: a ban in every zone (keys 5, 6, 7, 8) ------------------------------------------------------------------------------------------------
const ZONES: Array<{d: string; c: string}> = [
  {d: 'M300,860 q60,-50 140,-30 q40,40 10,100 q-80,30 -150,-10 Z', c: '#B7D9A8'},
  {d: 'M470,800 q90,-60 170,-20 q30,60 -20,110 q-90,10 -150,-30 Z', c: '#E8D58A'},
  {d: 'M660,840 q70,-30 130,10 q10,70 -50,100 q-80,0 -90,-50 Z', c: '#9EC7D8'},
  {d: 'M360,980 q80,-40 150,0 q20,70 -30,110 q-100,10 -130,-40 Z', c: '#D9A98F'},
  {d: 'M560,990 q90,-30 160,10 q10,80 -50,100 q-90,0 -110,-50 Z', c: '#C3B0D8'},
];
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t6 = b(6), t7 = b(7), t8 = b(8);
  const fall = easeIn(f, t7 - 16, 16);
  const hit = snap(f, t7, 10);
  const stampY = lerp(-420, 930, fall) - 40 * (1 - fall) * 0 + (f > t7 ? lerp(0, -380, ease(f, t7 + 10, 24)) : 0);
  const imprint = ease(f, t7, 4);
  const hatch = ease(f, t7 + 6, 26);
  const post = ease(f, t6 - 10, 18);
  const tag = f < t8 ? 0 : snap(f, t8, 14);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 940}, {t: p.dur, z: 1.06, fx: 520, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="SITKA · OCTOBER 21ST" y={560} size={34} tone="ink" p={ease(f, 6, 8)} />
        <Plate x={540} text="RECOMMENDED · A BAN IN EVERY ZONE" y={650} size={30} tone="cream" p={ease(f, t7 + 8, 8)} />
      </>}>
      <SVG>
        <PowerWall f={g} id="s2" y1={1240} />
        <Boardwalk f={g} y0={1240} id="s2b" puddles={false} rail={false} />
        <Foreground f={g} seed={2} />
        <defs>
          <pattern id="s2hatch" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="26" stroke="#14202A" strokeWidth="5" strokeDasharray="10 8" /></pattern>
        </defs>
        {/* the painted wall map */}
        <g transform="translate(0,0)">
          <rect x={150} y={640} width={780} height={560} rx={10} fill="#5B3C27" stroke={INK} strokeWidth={9} />
          <rect x={172} y={662} width={736} height={516} rx={4} fill={P.sea} stroke={INK} strokeWidth={6} />
          {Array.from({length: 7}).map((_, i) => <path key={i} d={`M${200 + i * 100},${690 + (i % 3) * 140} q30,${5 * Math.sin(g / 14 + i)} 60,0`} stroke="#9FD0CF" strokeWidth={3.4} fill="none" opacity={0.5} strokeLinecap="round" />)}
          <path d="M250,880 q20,-120 170,-150 q160,-40 300,20 q110,50 80,200 q-40,140 -190,170 q-170,30 -280,-40 q-90,-60 -80,-200 Z" fill="#8FA878" stroke={INK} strokeWidth={6} />
          {ZONES.map((z, i) => (
            <g key={i}>
              <path d={z.d} fill={z.c} stroke={INK} strokeWidth={4} />
              <path d={z.d} fill="url(#s2hatch)" opacity={hatch * 0.9} />
            </g>
          ))}
          <path d="M560,640 q30,70 -10,120" stroke="#fff" strokeWidth={0} fill="none" />
          {/* the RECOMMENDED imprint */}
          <g opacity={imprint * 0.94}>
            <text x={540} y={920} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={84} letterSpacing={3} fill={P.pink} stroke={P.pink} strokeWidth={1.2} transform="rotate(-8 540 920)">RECOMMENDED</text>
            <rect x={160} y={834} width={760} height={122} fill="none" stroke={P.pink} strokeWidth={7} strokeDasharray="22 12" transform="rotate(-8 540 920)" />
          </g>
        </g>
        {/* the stamp */}
        <g transform={`translate(540,${stampY})`}>
          <rect x={-24} y={-250} width={48} height={150} rx={10} fill={P.cedarHi} stroke={INK} strokeWidth={6} />
          <ellipse cx={0} cy={-262} rx={40} ry={22} fill={P.cedar} stroke={INK} strokeWidth={6} />
          <g transform={`scale(${1 + 0.1 * hit},${1 - 0.14 * hit})`}>
            <rect x={-130} y={-100} width={260} height={46} rx={8} fill="#5A6770" stroke={INK} strokeWidth={6} />
            <rect x={-122} y={-62} width={244} height={22} rx={4} fill={P.pink} stroke={INK} strokeWidth={4} />
          </g>
        </g>
        {f >= t7 && f < t7 + 22 && <ellipse cx={540} cy={930} rx={ease(f, t7, 18) * 480} ry={ease(f, t7, 18) * 120} fill="none" stroke="#DCEBEA" strokeWidth={7 * (1 - ease(f, t7, 18))} opacity={0.8} />}
        <Signpost x={925} y={1480} lines={['PLANNING', 'COMMISSION', 'UNANIMOUS']} size={28} k={post} f={g} id="s2p" />
        {/* the radio tag swinging from the map frame */}
        {tag > 0.01 && (
          <g transform={`translate(250,${698}) rotate(${(1 - tag) * 70 + 5 * Math.sin(g / 12)})`}>
            <line x1={0} y1={0} x2={0} y2={34} stroke={INK} strokeWidth={5} />
            <rect x={-150} y={34} width={300} height={112} rx={8} fill={P.cream} stroke={INK} strokeWidth={6} />
            <rect x={-142} y={42} width={284} height={96} rx={4} fill="none" stroke={P.brass} strokeWidth={3} />
            <text x={0} y={80} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} letterSpacing={2} fill={INK}>PER KCAW</text>
            <text x={0} y={118} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={INK}>SITKA PUBLIC RADIO</text>
          </g>
        )}
        <Sign x={170} y={1318} s={0.9} f={g} mood="worried" look={5} stretchPx={0} crack={0} phase={1.1} id="s2s" />
        <Rain f={g} op={0.3} />
      </SVG>
    </Frame>
  );
};

// ---- S3: only a recommendation (keys 9, 10) --------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t10 = b(10);
  const slide = easeIO(f, 0, Math.max(30, t10 - 4));
  const sheetX = lerp(280, 760, slide);
  const cam = track([{t: 0, z: 1.0, fx: 640, fy: 980}, {t: t10 + 10, z: 1.0, fx: 640, fy: 980}, {t: p.dur, z: 1.04, fx: 420, fy: 990}]);
  const flag = 20 * Math.sin(g / 5) * Math.max(0, 1 - slide) + (slide > 0.9 ? 6 : 0);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="NEXT · THE SITKA ASSEMBLY · DATE NOT SET" displayLines={['NEXT · THE SITKA ASSEMBLY', 'DATE NOT SET']} y={560} size={28} tone="ink" p={ease(f, 4, 8) * (1 - ease(f, t10 + 8, 8))} />
        <Plate x={540} text="NO DATA CENTER PROPOSED IN SITKA" displayLines={['NO DATA CENTER', 'PROPOSED IN SITKA']} y={700} size={30} tone="cream" p={ease(f, t10 + 8, 8)} />
      </>}>
      <SVG>
        <Harbor f={g} id="s3" horizon={1000} dark={0.08} />
        <Boardwalk f={g} y0={1230} id="s3b" />
        <Foreground f={g} seed={3} />
        {/* the bare lot behind a chain rail */}
        <g>
          <rect x={-40} y={1130} width={560} height={110} fill="#8A8470" stroke={INK} strokeWidth={6} />
          {Array.from({length: 12}).map((_, i) => <ellipse key={i} cx={20 + i * 44} cy={1150 + (i % 4) * 22} rx={14} ry={6} fill="#6E6A58" opacity={0.7} />)}
          {[0, 1, 2, 3].map((i) => <g key={i}><rect x={10 + i * 150} y={1090} width={16} height={70} fill={P.cedar} stroke={INK} strokeWidth={4} /></g>)}
          <path d={`M18,1100 q66,${34 + 4 * Math.sin(g / 18)} 142,0 q66,${34 + 4 * Math.sin(g / 18 + 1)} 142,0 q66,${34} 142,0`} stroke="#5A6770" strokeWidth={5} fill="none" strokeDasharray="14 5" />
          <rect x={150} y={900} width={20} height={200} fill={P.cedar} stroke={INK} strokeWidth={6} />
          <rect x={60} y={840} width={200} height={110} rx={6} fill={P.cream} stroke={INK} strokeWidth={6} />
          <path d="M84,872 h150 M84,900 h110" stroke={INK} strokeWidth={5} opacity={0.4} />
        </g>
        <Gull x={160} y={808} s={0.7} f={g} mode="perch" facing={1} />
        {/* the mailbox */}
        <g transform="translate(830,1180)">
          <ContactShadow cx={0} cy={110} rx={70} ry={10} opacity={0.34} blur={8} />
          <rect x={-18} y={0} width={36} height={110} fill={P.cedar} stroke={INK} strokeWidth={6} />
          <rect x={-90} y={-130} width={180} height={140} rx={30} fill={P.cedarHi} stroke={INK} strokeWidth={7} />
          <rect x={-62} y={-96} width={124} height={50} rx={8} fill="#2B1E14" stroke={INK} strokeWidth={5} />
          <rect x={-70} y={-170} width={140} height={44} rx={6} fill={P.cream} stroke={INK} strokeWidth={5} />
          <text x={0} y={-139} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={19} letterSpacing={1} fill={INK}>ASSEMBLY</text>
          <g transform={`translate(88,-80) rotate(${-flag})`}><rect x={0} y={-70} width={14} height={80} fill={P.brass} stroke={INK} strokeWidth={4} /><rect x={0} y={-70} width={44} height={28} fill={P.brass} stroke={INK} strokeWidth={4} /></g>
        </g>
        {/* the stamped sheet sliding along the rail */}
        <g transform={`translate(${sheetX},${1128 + 6 * Math.sin(g / 6)}) rotate(${-8 + 8 * slide})`}>
          <ContactShadow cx={0} cy={80} rx={110} ry={9} opacity={0.3} blur={7} />
          <rect x={-110} y={-70} width={220} height={150} fill={P.cream} stroke={INK} strokeWidth={6} />
          <rect x={-110} y={-70} width={220} height={150} fill="url(#s2hatch)" opacity={0.16} />
          <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={1} fill={P.pink} transform="rotate(-8)">RECOMMENDED</text>
        </g>
        <Rain f={g} op={0.38} />
      </SVG>
    </Frame>
  );
};

// ---- S4: the memo (keys 11, 12, 13) ----------------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t12 = b(12), t13 = b(13);
  const open = ease(f, 0, 22);
  const steps = [0, 1, 2, 3, 4, 5].map((i) => ease(f, t12 + i * 5, 12));
  const cx = lerp(1290, 905, ease(f, t13, 34));
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.06, fx: 560, fy: 980}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="AI SPURRED THE GROWTH · PER CITY MEMO" displayLines={['AI SPURRED THE GROWTH', 'PER CITY MEMO']} y={556} size={30} tone="ink" p={ease(f, t12 + 4, 8)} />
        <QuotePlate x={540} y={1150} text="NOT ENTIRELY UNLIKELY" by="CITY MEMO" size={44} wrap={16} p={ease(f, t13 + 6, 8)} type={ease(f, t13 + 8, 40)} />
      </>}>
      <SVG>
        <PowerWall f={g} id="s4" y1={1260} />
        <Boardwalk f={g} y0={1260} id="s4b" puddles={false} rail={false} />
        <Foreground f={g} seed={4} />
        {/* the memo on a cedar frame */}
        <g transform={`translate(330,930) scale(${0.7 + 0.3 * open},${open})`}>
          <rect x={-250} y={-340} width={500} height={680} rx={8} fill={P.cedar} stroke={INK} strokeWidth={9} />
          <rect x={-226} y={-316} width={452} height={632} fill={P.cream} stroke={INK} strokeWidth={5} />
          <text x={0} y={-258} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} letterSpacing={3} fill={INK}>CITY MEMO</text>
          <line x1={-190} y1={-228} x2={190} y2={-228} stroke={INK} strokeWidth={4} />
          {Array.from({length: 11}).map((_, i) => <path key={i} d={`M${-190},${-180 + i * 46} q${40 + (i % 3) * 18},${5} ${300 - (i % 4) * 36},0`} stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.42} />)}
          <rect x={-196} y={-30} width={372} height={34} fill={P.amber} opacity={0.35} />
        </g>
        {/* the growth steps */}
        {steps.map((s, i) => (
          <g key={i} transform={`translate(${680 + i * 62},${1260 - s * (70 + i * 52)})`}>
            <Gr id={`s4g${i}`} c="#7C8A94" />
            <rect x={0} y={0} width={60} height={70 + i * 52} fill={`url(#s4g${i})`} stroke={INK} strokeWidth={5} opacity={Math.min(1, s * 3)} />
          </g>
        ))}
        <Sign x={640} y={1330} s={0.62} f={g} mood="curious" look={-3} phase={2.1} id="s4p" />
        <Cubby x={cx} y={1330} s={0.56} f={g} emotion="nervous" look={-0.5} phase={2.7} />
        <Rain f={g} op={0.3} />
      </SVG>
    </Frame>
  );
};

// ---- S5: no size line (keys 14, 15, 16, 17, 18) -----------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t14 = 6, t15 = b(15), t16 = b(16), t17 = b(17), t18 = b(18);
  const rx = lerp(-600, 540, easeIO(f, t14 - 6, 26));
  const tag = f < t15 ? 0 : snap(f, t15, 16);
  const lab = ease(f, t16, 10), con = ease(f, t17, 10), mtn = ease(f, t18 - 10, 36);
  const stretch = lerp(0, 600, ease(f, t18 + 4, 22));
  const crack = ease(f, t18 + 26, 14);
  const stilts = lerp(44, 330, ease(f, t16 - 6, 20));
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.07, fx: 540, fy: 960}]);
  const RY = 1150;
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="THE DRAFT · NO SIZE LINE" y={560} size={32} tone="cream" p={ease(f, t14 + 8, 8)} />
        <Plate x={190} text="1 KW" y={1262} size={30} tone="ink" p={lab} />
        <Plate x={860} text="1 MW" y={1262} size={30} tone="ink" p={con} />
        <Plate x={540} text="1 KW · 1 MW · 1 GW · ONE WORD" y={650} size={28} tone="ink" p={ease(f, t18 + 8, 8)} />
      </>}>
      <SVG>
        <Harbor f={g} id="s5" horizon={1030} dark={0.15} />
        <Boardwalk f={g} y0={1290} id="s5b" />
        <Foreground f={g} seed={5} />
        {mtn > 0.01 && <g transform={`translate(0,${(1 - mtn) * 700})`} opacity={Math.min(1, mtn * 2)}><Slab x={540} y={1190} w={1040} h={720} f={g} id="s5s" windows={7} fans={4} /></g>}
        <Ruler x={rx} y={RY} len={940} f={g} id="s5r" />
        {/* the lab box and the container drop onto the ruler */}
        {lab > 0.01 && <LabBox x={190} y={RY - 38 - (1 - snap(f, t16, 12)) * 520} s={0.9} f={g} id="s5l" />}
        {con > 0.01 && <Container x={860} y={RY - 38 - (1 - snap(f, t17, 12)) * 520} s={0.8} id="s5c" />}
        {/* Rudas's name tag drops on a chain from the ruler's end */}
        {tag > 0.01 && (
          <g transform={`translate(${rx - 10},${RY + 38}) rotate(${6 * Math.sin(g / 10) * (1.2 - tag * 0.2)})`}>
            <line x1={0} y1={0} x2={0} y2={lerp(0, 26, tag)} stroke={INK} strokeWidth={5} strokeDasharray="8 5" />
            <g transform={`translate(0,${lerp(0, 26, tag)})`}>
              <rect x={-170} y={0} width={340} height={64} rx={8} fill={P.brass} stroke={INK} strokeWidth={6} />
              <text x={0} y={42} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={1} fill={INK}>COMMISSIONER RUDAS</text>
            </g>
          </g>
        )}
        <Sign x={540} y={RY - 38} s={0.95} f={g} mood={f > t18 + 4 ? 'strained' : 'curious'} stretchPx={stretch} crack={crack} look={f < t18 ? -5 : 0} legs legH={stilts} phase={0.9} id="s5p" />
        <Rain f={g} op={0.34} />
      </SVG>
    </Frame>
  );
};

// ---- S6: Cordova (keys 19, 20, 21) -----------------------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t20 = b(20), t21 = b(21);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 940}, {t: p.dur, z: 1.04, fx: 560, fy: 1000}]);
  const outline = ease(f, t20 + 4, 14);
  const readout = ease(f, t21, 8);
  const reading = Math.round(150 * ease(f, t21, 14));
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="CORDOVA · HYDRO PLANT" y={600} size={34} tone="ink" p={ease(f, 6, 8)} />
        <Plate x={540} text="FRIDGE SIZED · PER SITKA'S MEMO" y={690} size={30} tone="cream" p={ease(f, t20, 8)} />
      </>}>
      <SVG>
        <Harbor f={g} id="s6" horizon={880} dark={0.1} />
        {/* the hillside the creek runs down */}
        <path d="M-40,700 q200,-60 380,20 q220,90 420,340 l0,860 l-800,0 Z" fill="#41614F" stroke={INK} strokeWidth={7} />
        <path d="M-40,780 q200,-40 330,40 q200,100 380,330" stroke="#2F4A3B" strokeWidth={26} fill="none" opacity={0.5} />
        {/* the creek and the penstock */}
        <path d="M-40,760 q140,40 290,40" stroke={P.blueDeep} strokeWidth={46} fill="none" strokeLinecap="round" />
        <path d="M-40,760 q140,40 290,40" stroke={P.blueHi} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray="34 26" strokeDashoffset={-g * 3} />
        <g>
          <path d="M250,800 L690,1160" stroke={INK} strokeWidth={70} strokeLinecap="round" />
          <path d="M250,800 L690,1160" stroke="#8E99A3" strokeWidth={54} strokeLinecap="round" />
          <path d="M250,780 L690,1140" stroke="#C9D4D8" strokeWidth={10} strokeLinecap="round" opacity={0.8} />
          <path d="M250,800 L690,1160" stroke={P.blue} strokeWidth={20} strokeLinecap="round" strokeDasharray="30 30" strokeDashoffset={-g * 4} opacity={0.75} />
          {[0.15, 0.4, 0.65, 0.9].map((k) => <g key={k} transform={`translate(${lerp(250, 690, k)},${lerp(800, 1160, k)}) rotate(39)`}><rect x={-8} y={-38} width={16} height={76} fill="#5A6770" stroke={INK} strokeWidth={4} /></g>)}
        </g>
        {/* the powerhouse with an open front */}
        <g transform="translate(690,1330)">
          <ContactShadow cx={0} cy={4} rx={340} ry={18} opacity={0.36} blur={10} />
          <rect x={-290} y={-380} width={580} height={380} fill="#1B2D33" stroke={INK} strokeWidth={9} />
          <rect x={-272} y={-362} width={544} height={344} fill="#2D4A4D" />
          <Gr id="s6r" c={P.cedar} />
          <path d="M-330,-370 L0,-520 L330,-370 Z" fill="url(#s6r)" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
          <rect x={-272} y={-120} width={544} height={14} fill={P.cedarHi} stroke={INK} strokeWidth={5} />
          <g transform={`translate(-200,-170) rotate(${g * 9})`}>
            <circle r={72} fill="#5A6770" stroke={INK} strokeWidth={7} />
            {Array.from({length: 8}).map((_, i) => <path key={i} d="M0,0 L0,-66" stroke={INK} strokeWidth={9} transform={`rotate(${i * 45})`} />)}
            <circle r={16} fill={P.brass} stroke={INK} strokeWidth={5} />
          </g>
          <g transform={`translate(-200,-86) scale(${1})`}><rect x={-30} y={0} width={60} height={86} fill={P.blue} stroke={INK} strokeWidth={5} opacity={0.8} /></g>
          <Sign x={-20} y={-120} s={0.5} f={g} mood="plain" crack={1} stretchPx={0} look={2} phase={3.3} id="s6p" />
          {/* the Cubby on its shelf */}
          <g transform="translate(150,-120)"><Cubby x={0} y={0} s={0.5} f={g} emotion="nervous" phase={4.1} /></g>
          {readout > 0.01 && (
            <g transform="translate(150,-310)" opacity={readout}>
              <rect x={-70} y={-24} width={140} height={46} rx={6} fill="#14202A" stroke={P.brass} strokeWidth={5} />
              <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={1} fill={P.amber}>{`${reading} KW`}</text>
            </g>
          )}
          {outline > 0.01 && <rect x={238 - 60} y={-120 - 270 * 1} width={110} height={270} fill="none" stroke={P.cream} strokeWidth={4} strokeDasharray="10 8" opacity={outline * 0.9} transform="translate(-10,0)" />}
        </g>
        <Rain f={g} op={0.36} />
      </SVG>
    </Frame>
  );
};

// ---- S7: thirty eight towns (keys 22, 23) ----------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t23 = b(23);
  const crane = easeIO(f, t23 - 18, 150);
  const sc = lerp(1, 0.34, crane);
  const tarp = 5 * Math.sin(g / 6) + 2 * Math.sin(g / 2.3);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 940}, {t: p.dur, z: 1.0, fx: 540, fy: 940}]);
  const ROWS = 13;
  const TH = ROWS * 40 + 56 + 70;
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="RECORD PEAK · 26.02 MW" y={560} size={34} tone="ink" p={ease(f, 6, 8) * (1 - ease(f, t23 - 10, 8))} />
        <Plate x={540} text="1 GW IS ABOUT 38 TIMES THAT PEAK" displayLines={['1 GW IS ABOUT', '38 TIMES THAT PEAK']} y={700} size={34} tone="ink" p={ease(f, t23 + 60, 10)} />
        <Plate x={800} text="OUR MATH" y={880} size={30} tone="cream" rot={-4} p={snap(f, t23 + 100, 10)} />
      </>}>
      <SVG>
        <Harbor f={g} id="s7" horizon={900} dark={0.3} drift={2} />
        {/* the whole world rides the crane: scale about the tower's base */}
        <g transform={`translate(540,1300) scale(${sc}) translate(-540,-1300)`}>
          <g opacity={1 - crane * 0.85}><Boardwalk f={g} y0={1300} id="s7b" puddles rail={false} /></g>
          {Array.from({length: 38}).map((_, k) => {
            const ORDER = [3, 2, 4, 1, 5, 0, 6];
            const col = ORDER[k % 7], lvl = Math.floor(k / 7);
            const o = k === 0 ? 1 : ease(f, t23 + (k - 1) * 2.4, 8);
            if (o < 0.02) return null;
            return <g key={k} opacity={o}><Tower x={540 + (col - 3) * 170} y={1300 - lvl * TH} rows={ROWS} lit={1} f={g} id={`s7t${k % 6}`} shadow={lvl === 0} /></g>;
          })}
          <Sign x={330} y={1304} s={0.9} f={g} mood="plain" crack={1} look={4} phase={5.3} id="s7p" />
          <Gull x={540} y={1300 - 580 - 50} s={0.7} f={g} mode="perch" facing={-1} />
          {/* the balance under a tarp */}
          <g transform="translate(790,1300)">
            <ContactShadow cx={0} cy={4} rx={120} ry={10} opacity={0.34} blur={7} />
            <rect x={-8} y={-190} width={16} height={190} fill={P.brass} stroke={INK} strokeWidth={5} />
            <path d={`M-120,0 Q-130,-150 -40,-210 Q0,${-250 + tarp} 40,-210 Q130,-150 120,0 Z`} fill="#5B6B58" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M-80,-20 Q-70,-140 -10,-200 M20,-210 Q70,-140 80,-20`} stroke="#3A4638" strokeWidth={5} fill="none" opacity={0.7} />
            <path d={`M30,${-200 + tarp} q40,${30 + tarp} 80,${60}`} stroke="#7C8E77" strokeWidth={8} fill="none" strokeLinecap="round" />
          </g>
        </g>
        {/* the cloud decks the crane rises through */}
        {[0, 1].map((i) => (
          <g key={i} opacity={ease(f, t23 + 10 + i * 24, 30) * (0.82 - i * 0.2)} transform={`translate(0,${lerp(-160, 520, crane) + i * 380})`}>
            {Array.from({length: 7}).map((_, k) => <ellipse key={k} cx={k * 190 - 40 + ((g * (0.5 + i * 0.3)) % 190)} cy={560 + (k % 2) * 36} rx={190} ry={54} fill={i === 0 ? '#F2F6F5' : '#D6E2E0'} />)}
          </g>
        ))}
        <Rain f={g} op={0.3} />
      </SVG>
    </Frame>
  );
};

// ---- S8: overridden (keys 25, 26, 27, 28) ----------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t25 = 6, t26 = b(26), t27 = b(27), t28 = b(28);
  const staffK = ease(f, t25, 20), sustK = ease(f, t26, 20);
  const bell = bump(f, t27, 24);
  const cart = easeIO(f, t28 - 10, 120);
  const cartX = lerp(-520, 1400, cart);
  const sag = Math.min(1, ease(f, t25 + 70, 40) * 0.9);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.06, fx: 560, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="THE PLANNING COMMISSION RECOMMENDED A BAN INSTEAD" displayLines={['THE PLANNING COMMISSION', 'RECOMMENDED A BAN INSTEAD']} y={600} size={30} tone="ink" p={ease(f, t28 + 8, 8)} />
      </>}>
      <SVG>
        <Harbor f={g} id="s8" horizon={1000} dark={0.4} />
        <Boardwalk f={g} y0={1250} id="s8b" />
        <Foreground f={g} seed={8} />
        <Signpost x={290} y={1400} lines={['STAFF DID NOT', 'PROPOSE A BAN', 'MEMO · OCTOBER 16TH']} size={26} k={staffK} f={g} sag={sag} id="s8a" />
        <Signpost x={790} y={1400} lines={['OCTOBER 5TH', 'SUSTAINABILITY', 'COMMISSION']} size={26} k={sustK} f={g} id="s8c" />
        {sustK > 0.5 && (
          <g transform={`translate(790,${1400 - 470 + 92}) rotate(${22 * bell * Math.sin(g / 2)} 0 -20)`}>
            <line x1={0} y1={-20} x2={0} y2={0} stroke={INK} strokeWidth={5} />
            <path d="M-26,50 Q-26,0 0,0 Q26,0 26,50 Z" fill={P.brass} stroke={INK} strokeWidth={6} />
            <circle cx={0} cy={54} r={7} fill={P.brassShade} stroke={INK} strokeWidth={3} />
          </g>
        )}
        <Sign x={540} y={1318} s={0.9} f={g} mood="plain" crack={1} look={f < t28 ? -4 : 4} phase={6.1} id="s8p" />
        {/* the dashed RECOMMENDATION board on a hand-cart */}
        <g transform={`translate(${cartX},1432)`}>
          <ContactShadow cx={0} cy={150} rx={300} ry={14} opacity={0.34} blur={9} />
          <rect x={-290} y={-330} width={580} height={250} rx={10} fill={P.cream} opacity={0.94} />
          <rect x={-290} y={-330} width={580} height={250} rx={10} fill="none" stroke={INK} strokeWidth={8} strokeDasharray="26 14" strokeDashoffset={-g * 0.9} />
          <text x={0} y={-186} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={52} letterSpacing={3} fill={INK}>RECOMMENDATION</text>
          <rect x={-300} y={-80} width={600} height={50} fill={P.cedar} stroke={INK} strokeWidth={7} />
          {[-190, 190].map((wx) => <g key={wx} transform={`translate(${wx},${40}) rotate(${cart * 700})`}><circle r={56} fill={P.cedarHi} stroke={INK} strokeWidth={8} />{[0, 1, 2, 3].map((k) => <line key={k} x1={0} y1={0} x2={0} y2={-52} stroke={INK} strokeWidth={5} transform={`rotate(${k * 45})`} />)}<line x1={0} y1={-52} x2={0} y2={52} stroke={INK} strokeWidth={5} /></g>)}
          <path d="M-300,-56 L-470,-110" stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <path d="M-300,-56 L-470,-110" stroke={P.cedarHi} strokeWidth={7} strokeLinecap="round" />
        </g>
        <Rain f={g} op={0.5} wind={0.04} />
      </SVG>
    </Frame>
  );
};

// ---- S9: which tool (keys 29, 30) -------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t30 = b(30);
  const swing = f < 14 ? lerp(70, 70, 1) : 70 - 70 * snap(f, 14, 8);
  const hamX = lerp(1250, 700, ease(f, 0, 16));
  const nail = ease(f, 20, 8);
  const shudder = bump(f, 22, 14) * 5;
  const rulerX = lerp(1450, 760, ease(f, t30 - 8, 28));
  const boardLower = ease(f, t30 + 16, 14);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.06, fx: 540, fy: 970}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="A BAN · ONE CLEAR RULE" y={560} size={32} tone="ink" p={ease(f, 22, 8) * (1 - ease(f, t30 + 4, 8))} />
        <Plate x={540} text="WHICH TOOL KEEPS CONTROL" y={640} size={32} tone="cream" p={ease(f, t30 + 8, 8)} />
      </>}>
      <SVG>
        <PowerWall f={g} id="s9" y1={1240} />
        <Boardwalk f={g} y0={1240} id="s9b" puddles={false} rail={false} />
        <Foreground f={g} seed={9} />
        <g transform={`translate(${shudder * Math.sin(g * 2)},0)`}>
          <Board x={300} y={900} w={400} h={280} f={g} id="s9a" nail={nail} />
          <text x={300} y={920} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={80} letterSpacing={4} fill={INK}>BAN</text>
        </g>
        <Hammer x={hamX} y={880} s={0.9} swing={swing} f={g} />
        <g transform={`translate(0,${boardLower * 36})`}>
          <Board x={780} y={900} w={400} h={280} f={g} id="s9c" />
          <text x={780} y={920} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={80} letterSpacing={4} fill={INK}>LINE</text>
        </g>
        <Ruler x={rulerX} y={1100 + boardLower * 36} len={620} h={60} f={g} id="s9r" />
        <Sign x={560} y={1318} s={0.9} f={g} mood="curious" crack={1} look={f < t30 ? -5 : 5} phase={7.2} id="s9p" />
        <Rain f={g} op={0.28} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the island (keys 31, 32, 33, 34, 35) -----------------------------------------------------------------------------------------------
type BalProps = {x: number; y: number; f: number; beam: number; left: number; right: number; id: string; s?: number; tarp?: number};
const Balance: React.FC<BalProps> = ({x, y, f, beam, left, right, id, s = 1, tarp = 0}) => {
  const ARM = 250;
  const pan = (sx: number, fill: number) => {
    const ty = -Math.sin((beam * Math.PI) / 180) * ARM * sx;
    return (
      <g key={sx} transform={`translate(${sx * ARM * Math.cos((beam * Math.PI) / 180)},${ty})`}>
        <line x1={0} y1={0} x2={-70} y2={150} stroke={INK} strokeWidth={5} /><line x1={0} y1={0} x2={70} y2={150} stroke={INK} strokeWidth={5} />
        <path d="M-90,150 L90,150 Q80,214 0,214 Q-80,214 -90,150 Z" fill="#9AA6AE" stroke={INK} strokeWidth={7} />
        <rect x={-82} y={150 - fill * 70} width={164} height={Math.max(0, fill * 70)} fill={P.blue} opacity={0.9} />
        <path d={`M-82,${150 - fill * 70} q20,${4 * Math.sin(f / 7 + sx)} 41,0 t41,0 t41,0 t41,0`} stroke={P.blueHi} strokeWidth={4} fill="none" />
        <path d="M-90,150 L90,150 Q80,214 0,214 Q-80,214 -90,150 Z" fill="none" stroke={INK} strokeWidth={7} />
        <line x1={-72} y1={96} x2={72} y2={96} stroke={P.cream} strokeWidth={4} strokeDasharray="8 6" opacity={0.7} />
      </g>
    );
  };
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={420} rx={160} ry={12} opacity={0.36} blur={9} />
      <rect x={-16} y={0} width={32} height={420} fill={P.brass} stroke={INK} strokeWidth={6} />
      <rect x={-90} y={400} width={180} height={24} rx={6} fill={P.brassShade} stroke={INK} strokeWidth={6} />
      <g transform={`rotate(${-beam})`}>
        <rect x={-ARM - 20} y={-10} width={ARM * 2 + 40} height={20} rx={8} fill={P.brass} stroke={INK} strokeWidth={6} />
        <circle cx={0} cy={0} r={22} fill={P.brassHi} stroke={INK} strokeWidth={6} />
      </g>
      <g transform="translate(0,0)">{pan(-1, left)}{pan(1, right)}</g>
      {tarp > 0.01 && <path d={`M-300,420 Q-310,60 -100,-60 Q0,-110 100,-60 Q310,60 300,420 Z`} fill="#5B6B58" stroke={INK} strokeWidth={7} opacity={tarp} />}
    </g>
  );
};

const Island: React.FC<{f: number; id: string; stream?: number; flow?: number}> = ({f, id, stream = 1, flow = 1}) => (
  <g>
    <Gr id={`${id}_g`} c={P.stone} />
    <ContactShadow cx={540} cy={1128} rx={440} ry={20} opacity={0.4} blur={12} />
    <path d="M110,1140 q40,-210 170,-290 q90,-190 260,-190 q170,0 250,190 q130,90 170,290 Z" fill={`url(#${id}_g)`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M200,1100 q60,-110 150,-150 M820,1100 q-40,-110 -120,-160" stroke={INK} strokeWidth={4} fill="none" opacity={0.4} />
    {/* the town */}
    {Array.from({length: 10}).map((_, i) => {
      const hx = 250 + i * 62 + (i % 2) * 10, hy = 1090 - Math.sin(i / 9 * Math.PI) * 140 - (i % 3) * 14;
      return <g key={i} transform={`translate(${hx},${hy})`}><rect x={-20} y={-26} width={40} height={30} fill="#7B6A58" stroke={INK} strokeWidth={4} /><path d="M-24,-26 L0,-48 L24,-26 Z" fill="#4D3B2C" stroke={INK} strokeWidth={4} strokeLinejoin="round" /><rect x={-7} y={-18} width={14} height={14} fill={P.amber} stroke={INK} strokeWidth={2.6} opacity={0.75 + 0.25 * Math.sin(f / 8 + i)} /></g>;
    })}
    {/* two intakes in the hills with water coming down */}
    {[[420, 760], [640, 720]].map(([ix, iy], i) => (
      <g key={i}>
        <path d={`M${ix},${iy} q${i ? 30 : -30},120 ${i ? 20 : -20},300`} stroke={P.blueHi} strokeWidth={Math.max(2, 14 * stream)} fill="none" strokeLinecap="round" strokeDasharray="22 16" strokeDashoffset={-f * 3 * flow} opacity={0.5 + 0.5 * stream} />
        <g transform={`translate(${ix},${iy}) rotate(${f * 8 * flow})`}><circle r={30} fill="#5A6770" stroke={INK} strokeWidth={6} />{[0, 1, 2, 3, 4, 5].map((k) => <line key={k} x1={0} y1={0} x2={0} y2={-26} stroke={INK} strokeWidth={6} transform={`rotate(${k * 60})`} />)}</g>
      </g>
    ))}
  </g>
);

const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t32 = b(32), t33 = b(33), t34 = b(34), t35 = b(35);
  const tarpOff = easeIn(f, t34 - 6, 22);
  const left = ease(f, t34 + 6, 26), right = ease(f, t35, 22);
  const beam = (left - right) * 3 + 2.2 * Math.sin(g / 14) * (right > 0.5 ? 1 : 0.3);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 900}, {t: p.dur, z: 1.05, fx: 540, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="SITKA" y={560} size={32} tone="ink" p={ease(f, 8, 8) * (1 - ease(f, t32 + 2, 6))} />
        <Plate x={540} text="ISLANDED GRID · ALL HYDRO" y={560} size={30} tone="cream" p={ease(f, t32 + 4, 8)} />
        <Plate x={540} text="2025 · 120 GWH MADE" y={640} size={30} tone="ink" p={ease(f, t34 + 10, 8)} />
        <Plate x={540} text="118 USED" y={720} size={30} tone="cream" p={ease(f, t35 + 4, 8)} />
      </>}>
      <SVG>
        <Harbor f={g} id="s10" horizon={1060} dark={0.55} />
        <g transform="translate(0,150)"><Island f={g} id="s10i" /></g>
        <Sign x={190} y={1250} s={0.8} f={g} mood="plain" crack={1} look={3} phase={8.3} id="s10p" />
        {/* the extension cord that ends at the shore above the water */}
        <g opacity={ease(f, t32 - 4, 12)}>
          <path d={`M120,1140 q-70,${60 + 8 * Math.sin(g / 20)} -20,${150}`} stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
          <path d={`M120,1140 q-70,${60 + 8 * Math.sin(g / 20)} -20,${150}`} stroke="#E8A21B" strokeWidth={8} fill="none" strokeLinecap="round" />
          <g transform={`translate(100,${1290 + 3 * Math.sin(g / 20)}) rotate(8)`}><rect x={-14} y={0} width={28} height={40} rx={4} fill="#14202A" stroke={INK} strokeWidth={4} /><line x1={-6} y1={40} x2={-6} y2={58} stroke={P.steel} strokeWidth={5} /><line x1={6} y1={40} x2={6} y2={58} stroke={P.steel} strokeWidth={5} /></g>
        </g>
        <Balance x={560} y={1010} f={g} beam={beam} left={left} right={right} id="s10b" s={0.95} tarp={1 - tarpOff} />
        {tarpOff > 0.01 && tarpOff < 1 && <path d={`M${540 + 300 * tarpOff},${900 - 200 * tarpOff} q60,-40 120,${20}`} stroke="#5B6B58" strokeWidth={30} fill="none" strokeLinecap="round" opacity={1 - tarpOff} />}
        <Rain f={g} op={0.5} wind={0.06} len={56} />
      </SVG>
    </Frame>
  );
};

// ---- S11: say it loud (keys 36, 37, 38) -------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t37 = b(37), t38 = b(38);
  const thin = ease(f, 6, 70);
  const left = lerp(0.9, 0.35, thin), right = 0.9;
  const beam = lerp(0.5, 5.5, thin) + 1.5 * Math.sin(g / 16);
  const fade = ease(f, t37 - 24, 22);
  const pod = ease(f, t37 - 4, 14);
  const mic = 5 * Math.sin(g / 15) + 2 * Math.sin(g / 6.3);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.05, fx: 540, fy: 980}]);
  return (
    <Frame p={p} cam={cam} dim={0}
      overlay={<>
        <Plate x={540} text="HYDRO MOVES WITH RAIN" y={560} size={32} tone="ink" p={ease(f, 10, 8) * (1 - ease(f, t37 - 20, 8))} />
        <Plate x={540} text="LISA SADLIER-HART · PUBLIC TESTIMONY" displayLines={['LISA SADLIER-HART', 'PUBLIC TESTIMONY']} y={700} size={30} tone="cream" p={ease(f, t37 + 6, 8)} />
        <QuotePlate x={540} y={1060} text="WE NEED TO SAY IT LOUD, AND WE NEED TO SAY IT NOW" by="LISA SADLIER-HART" size={40} wrap={22} p={ease(f, t38 - 2, 8)} type={ease(f, t38, 74)} />
      </>}>
      <SVG>
        <Harbor f={g} id="s11" horizon={1060} dark={0.78} />
        <g opacity={1 - fade}>
          <Island f={g} id="s11i" stream={lerp(1, 0.18, thin)} flow={lerp(1, 0.4, thin)} />
          <Balance x={540} y={900} f={g} beam={beam} left={left} right={right} id="s11b" s={1.0} />
          <Sign x={170} y={1318} s={0.9} f={g} mood="worried" crack={1} look={5} phase={9.4} id="s11p" />
        </g>
        <rect x={0} y={0} width={W} height={H} fill="#1A3F42" opacity={fade * 0.82} />
        {/* the empty podium with a microphone */}
        <g transform={`translate(540,${lerp(1100, 1380, pod * 1)})`} opacity={Math.min(1, pod * 2)}>
          <ContactShadow cx={0} cy={6} rx={170} ry={13} opacity={0.4} blur={9} />
          <Gr id="s11pd" c={P.cedar} />
          <path d="M-130,0 L-110,-300 L110,-300 L130,0 Z" fill="url(#s11pd)" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          <rect x={-140} y={-330} width={280} height={42} rx={8} fill={P.cedarHi} stroke={INK} strokeWidth={7} />
          <g transform={`rotate(${mic} 60 -340)`}>
            <path d="M60,-330 q0,-150 -40,-190" stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
            <path d="M60,-330 q0,-150 -40,-190" stroke="#8E99A3" strokeWidth={7} fill="none" strokeLinecap="round" />
            <ellipse cx={4} cy={-540} rx={26} ry={34} fill="#5A6770" stroke={INK} strokeWidth={6} transform="rotate(-30 4 -540)" />
          </g>
        </g>
        {pod > 0.5 && <Gull x={700} y={1052} s={0.8} f={g} mode="perch" facing={-1} />}
        <Rain f={g} op={0.55} wind={0.05} len={58} />
      </SVG>
    </Frame>
  );
};

// ---- S12: Fairbanks draws a line (keys 39, 40, 41) --------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t40 = b(40), t41 = b(41);
  const rx = lerp(1500, 540, easeIO(f, 0, 26));
  const tag = ease(f, 14, 18);
  const mor = f < t40 ? 0 : snap(f, t40, 16);
  const tick = ease(f, t41, 14);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.03, fx: 540, fy: 980}]);
  const RY = 1150;
  const tickAt = 0.34;
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="FAIRBANKS · MORATORIUM PROPOSED · THROUGH DEC. 31ST, 2027" displayLines={['FAIRBANKS · MORATORIUM PROPOSED', 'THROUGH DEC. 31ST, 2027']} y={620} size={26} tone="cream" p={ease(f, t40 + 8, 8)} />
        <Plate x={540} text="PROPOSED LINE · 5 MW" y={740} size={32} tone="ink" p={ease(f, t41 + 6, 8)} />
      </>}>
      <SVG>
        <Harbor f={g} id="s12" horizon={1000} dark={0.2} gold={0} />
        <Boardwalk f={g} y0={1290} id="s12b" />
        <Foreground f={g} seed={12} />
        <Ruler x={rx} y={RY} len={940} f={g} ticks={[{at: tickAt, kind: 'dash', k: tick}]} id="s12r" />
        {/* the proposed flag on the tick */}
        {tick > 0.3 && (
          <g transform={`translate(${rx - 470 + 34 + (940 - 68) * tickAt},${RY - 40})`} opacity={tick}>
            <line x1={0} y1={0} x2={0} y2={-120} stroke={INK} strokeWidth={6} />
            <path d={`M0,-120 l140,0 l-22,22 l22,22 l-140,0 Z`} fill={P.cream} stroke={INK} strokeWidth={5} strokeLinejoin="round" transform={`skewY(${3 * Math.sin(g / 6)})`} />
            <text x={14} y={-92} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1} fill={INK} transform={`skewY(${3 * Math.sin(g / 6)})`}>PROPOSED</text>
          </g>
        )}
        {/* the Fairbanks tag in a tiny parka */}
        <g transform={`translate(${rx - 290},${RY - 60}) rotate(${7 * Math.sin(g / 14) * (1.3 - tag * 0.3)})`} opacity={Math.min(1, tag * 2)}>
          <line x1={0} y1={0} x2={0} y2={-180 * tag} stroke={INK} strokeWidth={5} strokeDasharray="8 5" />
          <g transform={`translate(0,${-180 * tag})`}>
            <rect x={-130} y={-120} width={260} height={110} rx={8} fill={P.cream} stroke={INK} strokeWidth={6} />
            <text x={0} y={-52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={36} letterSpacing={2} fill={INK}>FAIRBANKS</text>
            <path d="M-26,-124 q26,-52 52,0 Z" fill="#B07A52" stroke={INK} strokeWidth={4} /><circle cx={0} cy={-142} r={13} fill="#F4F1E8" stroke={INK} strokeWidth={3} />
          </g>
          {/* the moratorium tag swings down from it */}
          {mor > 0.01 && (
            <g transform={`translate(0,${-180 * tag + 4}) rotate(${(1 - mor) * 40 + 6 * Math.sin(g / 9)})`}>
              <line x1={0} y1={0} x2={0} y2={46} stroke={INK} strokeWidth={5} />
              <rect x={-96} y={46} width={192} height={64} rx={6} fill={P.brass} stroke={INK} strokeWidth={5} />
              <text x={0} y={88} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={19} letterSpacing={1} fill={INK}>THROUGH 2027</text>
            </g>
          )}
        </g>
        <Gull x={rx + 430} y={RY - 70} s={0.8} f={g} mode="perch" facing={-1} />
        <Sign x={rx + 120} y={RY - 38} s={0.85} f={g} mood="curious" crack={1} look={-6} phase={10.1} id="s12p" />
        <Rain f={g} op={0.34} />
      </SVG>
    </Frame>
  );
};

// ---- S13: not all the same (keys 42, 43) --------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t43 = b(43);
  const open = easeIO(f, 0, 26);
  const turn = easeIO(f, 66, 22);
  const s1 = ease(f, t43, 18), s2 = ease(f, t43 + 10, 18);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.06, fx: 560, fy: 990}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="DATA CENTERS ARE NOT ALL THE SAME · UAF ACEP GUIDE" displayLines={['DATA CENTERS ARE', 'NOT ALL THE SAME', 'UAF ACEP GUIDE']} y={640} size={30} tone="ink" p={ease(f, 8, 8)} />
      </>}>
      <SVG>
        <Harbor f={g} id="s13" horizon={1000} dark={0.15} />
        <Boardwalk f={g} y0={1250} id="s13b" />
        <Foreground f={g} seed={13} />
        <g transform="translate(580,1090)">
          <ContactShadow cx={0} cy={140} rx={420} ry={16} opacity={0.36} blur={10} />
          <rect x={-420} y={-60} width={840} height={200} rx={10} fill={P.teal} stroke={INK} strokeWidth={9} />
          <g transform={`scale(${open},1)`}>
            <rect x={-400} y={-250} width={400} height={390} fill={P.cream} stroke={INK} strokeWidth={7} />
            <rect x={0} y={-250} width={400} height={390} fill={P.cream} stroke={INK} strokeWidth={7} />
            <line x1={0} y1={-250} x2={0} y2={140} stroke={INK} strokeWidth={6} />
            {Array.from({length: 6}).map((_, i) => <path key={i} d={`M-360,${-200 + i * 48} q${40},${5} ${280 - (i % 3) * 40},0`} stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.35} />)}
            <rect x={40} y={-60} width={110} height={190} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="12 8" />
            <rect x={190} y={-170} width={190} height={300} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="12 8" />
          </g>
          <g transform={`translate(0,0) scale(${turn < 0.01 ? 0 : 1})`}>
            <g transform={`translate(${turn * 0} ,0)`} opacity={turn > 0.02 && turn < 0.98 ? 0.9 : 0}><rect x={0} y={-250} width={Math.sin(turn * Math.PI) * 400} height={390} fill={P.creamShade} stroke={INK} strokeWidth={6} /></g>
          </g>
          {s1 > 0.01 && <g transform={`translate(${lerp(60, 95, s1)},${lerp(-420, 120, snap(f, t43, 14))}) scale(0.46)`}><Cubby x={0} y={0} s={0.7} f={g} emotion="focused" phase={11.2} /></g>}
          {s2 > 0.01 && <g transform={`translate(${lerp(280, 285, s2)},${lerp(-520, 118, snap(f, t43 + 10, 14))})`}><Slab x={0} y={0} w={180} h={112} f={g} id="s13s" windows={4} fans={2} /></g>}
        </g>
        <Sign x={150} y={1318} s={0.9} f={g} mood={f > t43 ? 'plain' : 'worried'} crack={1} look={5} tilt={2 * Math.sin(g / 3) * ease(f, t43, 10) * (1 - ease(f, t43 + 20, 30))} phase={12.2} id="s13p" />
        <Rain f={g} op={0.3} />
      </SVG>
    </Frame>
  );
};

// ---- S14: where does the line go (keys 44, 45, 46, 47) ---------------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t45 = b(45), t46 = b(46), t47 = b(47);
  const gold = ease(f, 0, 60);
  const tap = bump(f, t45 + 6, 18);
  const hamSwing = f < t45 ? 52 : 52 - 52 * snap(f, t45, 8) + 3;
  const tick = ease(f, t46 - 2, 12);
  const lift = easeIO(f, t47 - 4, 40);
  const px = 540, py = lerp(1290, 1112, lift);
  const gone = Math.max(0, 1 - (f - t46) / 20);
  const pen = ease(f, t46 + 4, 14);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.05, fx: 540, fy: 960}]);
  const RY = 830;
  const tickAt = 0.5;
  const tickX = 540 + (-470 + 34 + (940 - 68) * tickAt);
  void gone;
  return (
    <Frame p={p} cam={cam} bloom={0.06}
      overlay={<>
        <Plate x={540} text="SAME SIGN · TWO SIZES" y={560} size={34} tone="ink" p={ease(f, 8, 8) * (1 - ease(f, t45 - 4, 8))} />
        <Plate x={540} text="A BAN · ONE CLEAR RULE" y={640} size={34} tone="cream" p={ease(f, t45, 8) * (1 - ease(f, t46 - 6, 8))} />
        <Plate x={540} text="A SIZE LINE" y={720} size={36} tone="ink" p={ease(f, t46, 8) * (1 - ease(f, t47 - 4, 8))} />
        <Plate x={540} text="A BAN OR A LINE? AND WHERE?" y={800} size={34} tone="cream" p={ease(f, t47 + 8, 10)} />
      </>}>
      <SVG>
        <Harbor f={g} id="s14" horizon={1000} dark={0} gold={gold} />
        <Boardwalk f={g} y0={1290} id="s14b" />
        <Foreground f={g} seed={14} />
        {/* a thin golden break across the boards */}
        <path d="M-100,1290 L1180,1000 L1180,1180 L-100,1500 Z" fill={P.gold} opacity={0.18 * gold} />
        <Cubby x={190} y={1290} s={0.62} f={g} emotion="nervous" phase={13.3} />
        <Slab x={870} y={1290} w={430} h={270} f={g} id="s14s" windows={5} fans={2} />
        {/* the ruler hangs by two ropes */}
        <line x1={150} y1={-40} x2={150} y2={RY - 40} stroke={INK} strokeWidth={10} />
        <line x1={930} y1={-40} x2={930} y2={RY - 40} stroke={INK} strokeWidth={10} />
        <line x1={150} y1={-40} x2={150} y2={RY - 40} stroke="#C9B58A" strokeWidth={5} />
        <line x1={930} y1={-40} x2={930} y2={RY - 40} stroke="#C9B58A" strokeWidth={5} />
        <Ruler x={540} y={RY} len={940} f={g} ticks={[{at: tickAt, kind: 'open', k: tick}]} id="s14r" />
        <Hammer x={1130 - 120 * (f < t45 ? 0 : 1) * 0} y={1010} s={0.9} swing={hamSwing} f={g} />
        {tap > 0.02 && <g transform={`translate(980,${RY})`}><circle r={30 + 40 * (1 - tap)} fill="none" stroke="#fff" strokeWidth={6 * tap} opacity={tap} /></g>}
        {/* the cord from the open tick and the Plate rising to hang from it */}
        {lift > 0.01 && <line x1={tickX} y1={RY + 38} x2={px} y2={py - 190 - 44 * (1 - lift) - 40 * (1 - lift)} stroke={INK} strokeWidth={7} />}
        <Sign x={px} y={py} s={0.95} f={g} mood={lift > 0.8 ? 'smug' : 'plain'} crack={1} look={lift > 0.5 ? 0 : 4} legs legH={lerp(44, 0, lift)} tilt={2.4 * Math.sin(g / 24) * lift} phase={14.4} id="s14p" />
        <Gull x={tickX + 110} y={RY - 120} s={0.85} f={g} mode="perch" facing={-1} pencil={pen} />
        <Rain f={g} op={0.2 * (1 - gold * 0.8)} />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={P.tealDeep} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={P.cream}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'ONE SIGN', 2: 'EVERY ZONE', 3: 'RECOMMENDATION', 4: 'THE MEMO', 5: 'NO SIZE LINE', 6: 'CORDOVA', 7: 'THIRTY EIGHT', 8: 'OVERRIDDEN', 9: 'WHICH TOOL', 10: 'THE ISLAND', 11: 'SAY IT LOUD', 12: 'FAIRBANKS', 13: 'NOT THE SAME', 14: 'THE LINE'};
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

export const ep1025Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1025Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1025: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 9.07, 20, 24.24, 33.22, 44.12, 51.88, 59.92, 71.76, 78.24, 90.9, 101.6, 111.06, 117.24, 128.66].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#14202A" ink="#F4EEDC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
