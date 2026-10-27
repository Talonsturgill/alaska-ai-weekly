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
import {FIB, Reel, reelHand, Pen, SigLine, Sticky, DataBox, Clip} from './lib/fiber';
import type {ReelMood} from './lib/fiber';
import {AK_PATH} from './lib/akmap';
import {IDS} from './Ep1027Ids';

// The Blank Line, 2026-10-27. Palette roles are art_direction.json. THE REEL (a saffron cable spool with a face, lib/fiber.tsx) is the hero and the SIGNATURE LINE is the throughline: a dotted line
// on the resolution that is blank, papered over by MAYBE notes, swept bare by a gust beside a DO NOT COUNT stamp, and left blank with the pen turned outward. Saffron is the Reel only, tomato is stamps, the cut spark and
// the clock wedge only, butter is sticky notes only. Only the front DataBoxes have faces.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const SERIF = 'Fraunces, Georgia, serif';
const C = {ink: INK, paper: '#F4EEDC'};
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

type Tone = 'ink' | 'cream' | 'wood';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#1E2340', fg: '#F4EEDC'},
  cream: {fill: '#F4EEDC', fg: '#1E2340'},
  wood: {fill: '#C99A62', fg: '#1E2340'},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'ink', p = 1, rot = 0, drop = 0}) => {
  const ls = displayLines ?? [text];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  const fr = useCurrentFrame();
  if (k <= 0.01) return null;
  const sc = (0.84 + 0.16 * Math.min(1, k * 1.15)) * (1 + 0.012 * Math.sin(fr / 11 + x * 0.01));
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

// ---- the shot frame: a camera that can move to any focus, kick, grade ---------------------------------------------------------------------
const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; dim?: number; children: React.ReactNode}> =
({p, cam, z0 = 1, z1 = 1.05, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, bloom = 0.04, vignette = 0.2, ox = 540, oy = 960, tag = true, overlay, tagText = CHIP, dim = 0, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + lerp(dx0, dx1, t) + 7 * Math.sin(p.f / 23)}px, ${jl.y + lerp(dy0, dy1, t) + 9 * Math.sin(p.f / 17 + 1)}px) rotate(${0.3 * Math.sin(p.f / 31)}deg) translate(540px, 960px) scale(${c.z * jl.scale * (1 + 0.008 * Math.sin(p.f / 13))}) translate(${-c.fx}px, ${-c.fy}px)`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {dim > 0 && <div style={{position: 'absolute', inset: 0, background: '#10142A', opacity: dim}} />}
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#1E2B4D" stroke={C.paper} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={C.paper}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.02} />
    </AbsoluteFill>
  );
};
/** a camera that eases between keyframes {t: frame, z, fx, fy} */
const clampCam = (c: Cam): Cam => ({z: c.z, fx: Math.max(540 / c.z, Math.min(1080 - 540 / c.z, c.fx)), fy: Math.max(960 / c.z, Math.min(1920 - 960 / c.z, c.fy))});
const track = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => clampCam(trackRaw(keys)(f));
const trackRaw = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => {
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


/** an inked block with a form gradient and a top highlight */
const Blk: React.FC<{x: number; y: number; w: number; h: number; c: string; id: string; r?: number; sw?: number}> = ({x, y, w, h, c, id, r = 8, sw = 5}) => (
  <g>
    <defs><FormGradient id={id} t={tones(c)} /></defs>
    <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id})`} stroke={INK} strokeWidth={sw} />
    <rect x={x + 5} y={y + 4} width={Math.max(0, w - 10)} height={Math.max(3, Math.min(8, h * 0.1))} rx={3} fill="#fff" opacity={0.28} />
  </g>
);

// ---- the world (palette roles are art_direction.json) --------------------------------------------------------------------------------------
const P = {
  lilac: FIB.lilac, lilacHi: FIB.lilacHi, lilacDeep: FIB.lilacDeep, blush: FIB.blush, petrol: FIB.teal, petrolHi: FIB.tealHi, petrolDeep: FIB.tealDeep,
  tan: FIB.tan, tanHi: FIB.tanHi, tanShade: FIB.tanShade, cream: FIB.cream, creamShade: FIB.creamShade, paper: FIB.paper, saffron: FIB.saffron,
  saffronHi: FIB.saffronHi, saffronShade: FIB.saffronShade, cable: FIB.cable, cableHi: FIB.cableHi, tracer: FIB.tracer, tomato: FIB.tomato,
  tomatoDeep: FIB.tomatoDeep, butter: FIB.butter, butterShade: FIB.butterShade, ink: INK, navy: '#1E2340', gold: '#E9C86A',
};
const FIBX = FIB;
const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
/** a plate's opacity for a window: in over 8 frames at `a`, out over 8 frames from `z` */
const win = (f: number, a: number, z: number) => ease(f, a, 8) * (1 - ease(f, z, 8));

/** the lilac dusk dock: sky, a low sun, clouds, far mountains, a petrol sea with glitter, a plank deck. sun 0..1 dims the sun, dusk 0..1 deepens the sky. */
const DockBG: React.FC<{f: number; id: string; sun?: number; dusk?: number; deckTop?: number}> = ({f, id, sun = 1, dusk = 0, deckTop = 1030}) => {
  const sky0 = mix(P.lilacHi, '#7B74B6', dusk * 0.7), sky1 = mix(P.lilac, '#A58BB8', dusk * 0.6), sky2 = mix(P.blush, '#E8B7B5', dusk * 0.5);
  const drift = 26 * Math.sin(f / 90);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}_sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky0} /><stop offset="0.55" stopColor={sky1} /><stop offset="1" stopColor={sky2} /></linearGradient>
        <linearGradient id={`${id}_sea`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={FIB.plumHi} /><stop offset="1" stopColor={FIB.plum} /></linearGradient>
        <linearGradient id={`${id}_deck`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.tanHi} /><stop offset="1" stopColor={P.tan} /></linearGradient>
        <radialGradient id={`${id}_sun`}><stop offset="0" stopColor={P.saffronHi} stopOpacity={0.95} /><stop offset="1" stopColor={P.saffronHi} stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={-20} y={0} width={W + 40} height={deckTop - 230} fill={`url(#${id}_sky)`} />
      <circle cx={210 + drift * 0.2} cy={deckTop - 330} r={230 * sun} fill={`url(#${id}_sun)`} opacity={sun} />
      <circle cx={210 + drift * 0.2} cy={deckTop - 330} r={62 * sun} fill={P.saffronHi} stroke={INK} strokeWidth={4} opacity={sun} />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${((f * (0.18 + i * 0.07) + i * 420) % 1500) - 260},${300 + i * 150})`} opacity={0.55}>
          <ellipse cx={0} cy={0} rx={200 - i * 30} ry={26} fill={P.lilacHi} stroke={INK} strokeWidth={3} />
          <ellipse cx={60} cy={-18} rx={120 - i * 20} ry={22} fill={P.lilacHi} stroke={INK} strokeWidth={3} />
        </g>
      ))}
      <path d={`M -20,${deckTop - 250} L 120,${deckTop - 330} L 220,${deckTop - 290} L 380,${deckTop - 400} L 520,${deckTop - 300} L 660,${deckTop - 360} L 820,${deckTop - 270} L 960,${deckTop - 330} L 1100,${deckTop - 250} L 1100,${deckTop - 200} L -20,${deckTop - 200} Z`} fill={P.lilacDeep} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M 380,${deckTop - 400} L 420,${deckTop - 340} L 460,${deckTop - 362} L 520,${deckTop - 300} Z M 660,${deckTop - 360} L 700,${deckTop - 306} L 740,${deckTop - 326} L 820,${deckTop - 270} Z`} fill="#fff" opacity={0.55} />
      <rect x={-20} y={deckTop - 210} width={W + 40} height={250} fill={`url(#${id}_sea)`} stroke={INK} strokeWidth={5} />
      {Array.from({length: 16}).map((_, i) => {
        const y = deckTop - 190 + (i % 8) * 28, x = ((i * 173 + f * (0.5 + (i % 3) * 0.3)) % 1200) - 60;
        return <path key={i} d={`M ${x},${y} q 22,-8 44,0 t 44,0`} fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" opacity={0.28} />;
      })}
      {Array.from({length: 7}).map((_, i) => <ellipse key={i} cx={210 + 18 * Math.sin(f / 9 + i)} cy={deckTop - 160 + i * 30} rx={70 - i * 8} ry={5} fill={P.saffronHi} opacity={0.5 * sun} />)}
      <rect x={-20} y={deckTop} width={W + 40} height={H - deckTop} fill={`url(#${id}_deck)`} stroke={INK} strokeWidth={6} />
      <rect x={-20} y={deckTop} width={W + 40} height={16} fill={P.tanHi} stroke={INK} strokeWidth={5} />
      {Array.from({length: 7}).map((_, i) => <path key={i} d={`M -20,${deckTop + 60 + i * i * 12 + i * 18} L ${W + 20},${deckTop + 60 + i * i * 12 + i * 18}`} stroke={INK} strokeWidth={2.6} opacity={0.3} />)}
      {Array.from({length: 11}).map((_, i) => <path key={i} d={`M ${60 + i * 96},${deckTop + 18} L ${-300 + i * 168},${H}`} stroke={INK} strokeWidth={2.2} opacity={0.2} />)}
    </g>
  );
};

/** the lower third as a stage: the dock's front beam with bollards and a rope coil, and the sea below it. */
const NearDock: React.FC<{f: number; y?: number; seed?: number}> = ({f, y = 1560, seed = 1}) => (
  <g data-band="ok">
    <rect data-band="ok" x={-40} y={y + 56} width={W + 80} height={H - y} fill={FIB.plum} stroke={INK} strokeWidth={5} />
    {Array.from({length: 9}).map((_, i) => <path key={i} d={`M ${((i * 190 + f * (0.6 + (i % 3) * 0.25)) % 1300) - 110},${y + 120 + (i % 4) * 56} q 28,-9 56,0 t 56,0`} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.25} data-band="ok" />)}
    <rect data-band="ok" x={-40} y={y} width={W + 80} height={64} rx={6} fill={P.tanHi} stroke={INK} strokeWidth={6} />
    <rect data-band="ok" x={-40} y={y + 4} width={W + 80} height={10} fill="#fff" opacity={0.3} />
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} data-band="ok" x={40 + i * 230 + 12 * rnd(i + seed)} y={y + 64} width={34} height={150} fill={P.tanShade} stroke={INK} strokeWidth={5} />)}
    {[190, 880].map((bx, i) => (
      <g key={i} data-band="ok" transform={`translate(${bx + 14 * rnd(seed + i)},${y})`}>
        <rect x={-22} y={-52} width={44} height={56} rx={10} fill={P.cableHi} stroke={INK} strokeWidth={5} />
        <ellipse cx={0} cy={-52} rx={30} ry={11} fill={P.cable} stroke={INK} strokeWidth={5} />
        {i === 0 && <ellipse cx={-6} cy={-12} rx={46} ry={14} fill="none" stroke={P.tracer} strokeWidth={6} />}
      </g>
    ))}
  </g>
);

/** the vault door: concrete frame, a petrol steel door with rivets and a slow wheel, a stencilled plate that lights. */
const Vault: React.FC<{x: number; y: number; s?: number; f: number; lit?: number; id: string; spin?: number; jolt?: number}> = ({x, y, s = 1, f, lit = 0, id, spin = 0, jolt = 0}) => (
  <g transform={`translate(${x},${y - jolt * 6}) scale(${s})`}>
    <defs><FormGradient id={`${id}_d`} t={tones(P.petrol)} /><FormGradient id={`${id}_w`} t={tones(P.lilacDeep)} /></defs>
    <ContactShadow cx={0} cy={6} rx={230} ry={16} opacity={0.38} blur={9} />
    <rect x={-190} y={-540} width={380} height={540} rx={10} fill={`url(#${id}_w)`} stroke={INK} strokeWidth={7} />
    <rect x={-150} y={-460} width={300} height={460} rx={8} fill={`url(#${id}_d)`} stroke={INK} strokeWidth={7} />
    {[0, 1, 2, 3, 4, 5].map((i) => [-1, 1].map((sx) => <circle key={`${i}${sx}`} cx={sx * 128} cy={-430 + i * 80} r={7} fill={P.petrolHi} stroke={INK} strokeWidth={3.4} />))}
    <g transform={`translate(0,-250) rotate(${spin * 90 + f * 0.3})`}>
      <circle r={78} fill="none" stroke={INK} strokeWidth={22} />
      <circle r={78} fill="none" stroke={P.cableHi} strokeWidth={12} />
      {[0, 1, 2, 3].map((i) => <line key={i} x1={0} y1={0} x2={78 * Math.cos((i * Math.PI) / 2)} y2={78 * Math.sin((i * Math.PI) / 2)} stroke={INK} strokeWidth={16} strokeLinecap="round" />)}
      <circle r={20} fill={P.petrolHi} stroke={INK} strokeWidth={6} />
    </g>
    <rect x={-132} y={-510} width={264} height={46} rx={6} fill={lit > 0.5 ? P.cream : '#2A3340'} stroke={INK} strokeWidth={5} />
    {lit > 0.05 && <rect x={-150} y={-528} width={300} height={82} rx={10} fill={P.saffronHi} opacity={0.35 * lit} />}
    <text x={0} y={-476} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={2} fill={lit > 0.5 ? INK : '#556'}>UP TO $75M</text>
  </g>
);

/** a sheet of text bars: the resolution's body. rows fills in, hl highlights a row. */
const TextBars: React.FC<{x: number; y: number; w: number; rows: number; gap?: number; seed?: number; shade?: number; show?: number}> = ({x, y, w, rows, gap = 40, seed = 1, shade = 0.5, show = 1}) => (
  <g>
    {Array.from({length: rows}).map((_, i) => {
      const ww = w * (0.74 + 0.26 * rnd(i + seed * 7)) * (i === rows - 1 ? 0.6 : 1);
      const on = clamp01(show * rows - i);
      return <rect key={i} x={x - w / 2} y={y + i * gap} width={ww * on} height={12} rx={6} fill={INK} opacity={shade * (0.8 + 0.2 * rnd(i + seed))} />;
    })}
  </g>
);

/** the resolution sheet. origin top-centre; w 520, h 680. slot 0..1 opens the blank slot in row 3; ghost dims the text rows; sig is the signature line group. */
const Resolution: React.FC<{x: number; y: number; s?: number; rot?: number; f: number; unroll?: number; slot?: number; ghost?: number; id: string; sig?: boolean; sigPulse?: number; rows?: number; stickies?: React.ReactNode; head?: boolean}> =
({x, y, s = 1, rot = 0, f, unroll = 1, slot = 0, ghost = 0, id, sig = true, sigPulse = 0, rows = 11, stickies, head = true}) => {
  const u = clamp01(unroll);
  const h = 680 * Math.max(0.12, u);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot + 0.6 * Math.sin(f / 31)}) scale(${s})`}>
      <defs><FormGradient id={`${id}_p`} t={tones(P.cream)} /><clipPath id={`${id}_c`}><rect x={-260} y={0} width={520} height={h} /></clipPath></defs>
      <rect x={-254} y={10} width={520} height={h} fill="#000" opacity={0.22} />
      <g clipPath={`url(#${id}_c)`}>
        <rect x={-260} y={0} width={520} height={680} rx={10} fill={`url(#${id}_p)`} stroke={INK} strokeWidth={6} />
        <rect x={-260} y={0} width={520} height={34} fill={P.petrol} stroke={INK} strokeWidth={5} />
        {head && <text x={0} y={25} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill={P.cream}>RESOLUTION NO. G26-11</text>}
        <TextBars x={0} y={78} w={440} rows={rows} gap={40} seed={3} shade={0.5 - ghost * 0.3} show={u} />
        {slot > 0.02 && (
          <g transform="translate(86,158)" opacity={clamp01(slot * 2)}>
            <rect x={-46} y={-4} width={92} height={22} rx={3} fill={P.butter} opacity={0.75 + 0.2 * Math.sin(f / 5)} stroke={INK} strokeWidth={3.4} />
            <rect x={-46} y={18} width={92} height={4} fill={P.butterShade} opacity={0.8} />
          </g>
        )}
        {sig && <SigLine x={0} y={610} w={400} f={f} pulse={sigPulse} />}
      </g>
      {stickies}
    </g>
  );
};

/** the big egg-timer clock: a round face, a tomato wedge at the deadline, a spinning hand, two bells, feet. hand is in turns. */
const Clock: React.FC<{x: number; y: number; s?: number; f: number; hand: number; wedge?: number; id: string; jolt?: number; chime?: number}> = ({x, y, s = 1, f, hand, wedge = 1, id, jolt = 0, chime = 0}) => (
  <g transform={`translate(${x},${y - jolt * 8}) rotate(${1.2 * Math.sin(f / 7) * (1 + chime * 2)}) scale(${s})`}>
    <defs><FormGradient id={`${id}_f`} t={tones(P.cream)} /><FormGradient id={`${id}_b`} t={tones(P.petrolHi)} /></defs>
    <ContactShadow cx={0} cy={6} rx={170} ry={14} opacity={0.38} blur={9} />
    {[-1, 1].map((sx) => <path key={sx} d={`M ${sx * 90},-14 L ${sx * 130},0 L ${sx * 60},0 Z`} fill={P.tanShade} stroke={INK} strokeWidth={6} strokeLinejoin="round" />)}
    {[-1, 1].map((sx) => <g key={sx} transform={`translate(${sx * 74},-338) rotate(${sx * (12 + chime * 10 * Math.sin(f / 2))})`}><path d="M -40,0 Q -40,-52 0,-56 Q 40,-52 40,0 Z" fill={`url(#${id}_b)`} stroke={INK} strokeWidth={6} /><circle cx={0} cy={-60} r={8} fill={P.cableHi} stroke={INK} strokeWidth={4} /></g>)}
    <circle cx={0} cy={-170} r={166} fill={`url(#${id}_f)`} stroke={INK} strokeWidth={9} />
    <circle cx={0} cy={-170} r={148} fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />
    {wedge > 0.02 && <path d={`M 0,-170 L ${142 * Math.sin(-0.1)},${-170 - 142 * Math.cos(-0.1)} A 142,142 0 0 1 ${142 * Math.sin(0.62 * wedge - 0.1)},${-170 - 142 * Math.cos(0.62 * wedge - 0.1)} Z`} fill={P.tomato} stroke={INK} strokeWidth={4} opacity={0.9} />}
    {Array.from({length: 12}).map((_, i) => {
      const a = (i * Math.PI) / 6;
      return <line key={i} x1={128 * Math.sin(a)} y1={-170 - 128 * Math.cos(a)} x2={146 * Math.sin(a)} y2={-170 - 146 * Math.cos(a)} stroke={INK} strokeWidth={i % 3 === 0 ? 8 : 4} strokeLinecap="round" />;
    })}
    <g transform={`translate(0,-170) rotate(${hand * 360})`}>
      <line x1={0} y1={22} x2={0} y2={-122} stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <line x1={0} y1={22} x2={0} y2={-122} stroke={P.tomatoDeep} strokeWidth={6} strokeLinecap="round" />
    </g>
    <circle cx={0} cy={-170} r={14} fill={P.cableHi} stroke={INK} strokeWidth={5} />
  </g>
);

/** a magnifier with a tan handle and a glassy lens; origin at the lens centre. */
const Magnifier: React.FC<{x: number; y: number; s?: number; rot?: number; f: number}> = ({x, y, s = 1, rot = -30, f}) => (
  <g transform={`translate(${x},${y + 4 * Math.sin(f / 9)}) rotate(${rot}) scale(${s})`}>
    <ContactShadow cx={20} cy={170} rx={80} ry={10} opacity={0.2} blur={8} />
    <rect x={-14} y={86} width={28} height={150} rx={12} fill={P.tan} stroke={INK} strokeWidth={6} />
    <rect x={-8} y={96} width={8} height={120} rx={4} fill="#fff" opacity={0.3} />
    <circle r={92} fill="#E8F2F8" opacity={0.28} />
    <circle r={92} fill="none" stroke={INK} strokeWidth={16} />
    <circle r={92} fill="none" stroke={P.cableHi} strokeWidth={8} />
    <path d="M -62,-34 A 70,70 0 0 1 -14,-66" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.8} />
  </g>
);


// ---- S1: the unsigned line (keys 1, 2, 3) ----------------------------------------------------------------------------------------------------
const Easel: React.FC<{x: number; y: number; s?: number; f: number; id: string; sigPulse?: number; sig?: boolean; ghost?: number; sheetScale?: number; head?: boolean; extra?: React.ReactNode}> = ({x, y, s = 1, f, id, sigPulse = 0, sig = true, ghost = 0, sheetScale = 0.5, head = true, extra}) => {
  const top = -340 - 680 * sheetScale;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={6} rx={210} ry={13} opacity={0.36} blur={8} />
      {[-1, 1].map((sx) => <path key={`l${sx}`} d={`M ${sx * 60},-340 L ${sx * 190},0`} stroke={INK} strokeWidth={22} strokeLinecap="round" />)}
      {[-1, 1].map((sx) => <path key={`m${sx}`} d={`M ${sx * 60},-340 L ${sx * 190},0`} stroke={P.tan} strokeWidth={11} strokeLinecap="round" />)}
      {[-1, 1].map((sx) => <rect key={`p${sx}`} x={sx * (260 * sheetScale + 14) - 8} y={top - 20} width={16} height={-340 - top + 20} fill={P.tan} stroke={INK} strokeWidth={5} />)}
      <rect x={-(260 * sheetScale + 24)} y={top - 30} width={2 * (260 * sheetScale + 24)} height={18} rx={4} fill={P.tanHi} stroke={INK} strokeWidth={5} />
      <rect x={-(260 * sheetScale + 28)} y={-346} width={2 * (260 * sheetScale + 28)} height={22} rx={4} fill={P.tanHi} stroke={INK} strokeWidth={6} />
      <Resolution x={0} y={top} s={sheetScale} f={f} id={`${id}r`} sig={sig} sigPulse={sigPulse} ghost={ghost} head={head} />
      {extra}
    </g>
  );
};

const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t1 = b(1), t2 = b(2), t3 = b(3);
  const arrive = ease(f, t1, 46);
  const rs = 0.95;
  const rx = lerp(-300, 330, arrive);
  const stop = bump(f, t1 + 44, 24);
  const board = ease(f, t3 - 14, 22);
  const raise = ease(f, t3 - 6, 22);
  const hand = reelHand(raise, rs, rx, 1290);
  const hov = 6 * Math.sin(g / 8) - 12 * (1 - raise);
  const nib = {x: hand.x - 74 * 0.9, y: hand.y + 43 * 0.9 + hov};
  const mood = f < t3 ? 'hope' : 'ask';
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1060}, {t: p.dur, z: 1.1, fx: 600, fy: 1040}]);
  return (
    <Frame p={p} cam={cam} bloom={0.06}
      overlay={<>
        <Plate p={win(f, t3, t3 + 120)} text="ONE UNSIGNED LINE" y={640} size={36} tone="ink" />
      </>}>
      <SVG>
        <DockBG f={g} id="s1" />
        {[0, 1].map((i) => <path key={i} d={`M ${((g * (1.4 + i * 0.5) + i * 600) % 1500) - 200},${380 + i * 70} q 20,-16 40,0 q 20,-16 40,0`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />)}
        <Vault x={880} y={1290} s={0.96} f={g} lit={ease(f, t2, 8)} id="s1v" jolt={bump(f, t2, 16)} />
        <g transform={`translate(0,${(1 - board) * 420})`}>
          <Easel x={590} y={1290} s={0.78} f={g} id="s1e" sigPulse={f > t3 ? 0.5 + 0.5 * Math.sin(g / 6) : 0} />
        </g>
        <Reel x={rx} y={1290} s={rs} f={g} mood={mood as ReelMood} look={f < t3 ? 5 : 4} crank={arrive * 3} tail={arrive} raise={raise} phase={0.3} id="s1r" jolt={stop * 0.5} />
        {raise > 0.05 && <Pen x={nib.x} y={nib.y} s={0.9} rot={60} f={g} />}
        <NearDock f={g} y={1580} seed={1} />
      </SVG>
    </Frame>
  );
};

// ---- S2: the resolution (keys 4, 42, 52, 5, 6, 7) ---------------------------------------------------------------------------------------------
const OfficeBG: React.FC<{f: number; id: string; dusk?: number; lamp?: number}> = ({f, id, dusk = 0.25, lamp = 0}) => {
  const wall0 = mix(P.paper, '#CFC8E6', dusk), wall1 = mix('#E4DFF3', '#B2A9D8', dusk);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}_w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={wall0} /><stop offset="1" stopColor={wall1} /></linearGradient>
        <linearGradient id={`${id}_d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.tanHi} /><stop offset="1" stopColor={P.tan} /></linearGradient>
      </defs>
      <rect x={-20} y={0} width={W + 40} height={1290} fill={`url(#${id}_w)`} />
      {/* a window to the dusk dock */}
      <g transform="translate(110,430)">
        <rect x={0} y={0} width={250} height={330} rx={10} fill={mix(P.lilac, P.blush, 0.4)} stroke={INK} strokeWidth={8} />
        <rect x={0} y={190} width={250} height={140} fill={FIB.plum} />
        <circle cx={70} cy={176} r={34} fill={P.saffronHi} stroke={INK} strokeWidth={4} />
        <path d="M 0,190 L 250,190" stroke={INK} strokeWidth={4} />
        <path d="M 125,0 L 125,330 M 0,165 L 250,165" stroke={INK} strokeWidth={7} />
        <path d={`M 20,${250 + 6 * Math.sin(f / 12)} q 20,-8 40,0 t 40,0 t 40,0`} fill="none" stroke="#fff" strokeWidth={3.4} opacity={0.4} />
      </g>
      {/* a pegboard of hooks and tools along the lower wall */}
      <rect x={-20} y={900} width={W + 40} height={390} fill={mix(P.lilacDeep, '#6F68A8', 0.3)} opacity={0.5} />
      {Array.from({length: 14}).map((_, i) => Array.from({length: 4}).map((__, j) => <circle key={`${i}${j}`} cx={40 + i * 76} cy={950 + j * 80} r={3.4} fill={INK} opacity={0.3} />))}
      <rect x={-20} y={1236} width={W + 40} height={24} fill={P.tanShade} stroke={INK} strokeWidth={5} />
      <rect x={-20} y={1260} width={W + 40} height={H - 1260} fill={`url(#${id}_d)`} stroke={INK} strokeWidth={6} />
      {Array.from({length: 7}).map((_, i) => <path key={i} d={`M -20,${1300 + i * i * 10 + i * 16} L ${W + 20},${1300 + i * i * 10 + i * 16}`} stroke={INK} strokeWidth={2.4} opacity={0.26} />)}
      {Array.from({length: 18}).map((_, i) => <circle key={`d${i}`} cx={((g_(f, i) * (0.5 + rnd(i) * 0.7) + rnd(i + 3) * 1300) % 1300) - 110} cy={500 + 600 * rnd(i + 8) + 14 * Math.sin(f / 20 + i)} r={2 + 2.2 * rnd(i + 2)} fill="#fff" opacity={0.32} />)}
      {lamp > 0 && <ellipse cx={540} cy={1400} rx={460} ry={120} fill="#fff" opacity={0.1 * lamp} />}
    </g>
  );
};
const g_ = (f: number, i: number) => f + i * 0;

const Gavel: React.FC<{x: number; y: number; s?: number; f: number; hit?: number; dust?: number; id: string}> = ({x, y, s = 1, f, hit = 0, dust = 0, id}) => {
  const k = clamp01(hit);
  const ang = lerp(0, 58, k);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={8} rx={130} ry={12} opacity={0.38} blur={8} />
      <Blk x={-90} y={-46} w={180} h={46} c={P.tanShade} id={`${id}b`} r={8} sw={6} />
      <Blk x={-112} y={-4} w={224} h={14} c={P.tan} id={`${id}c`} r={5} sw={5} />
      <g transform={`translate(120,-100) rotate(${ang})`}>
        <rect x={-190} y={-9} width={190} height={18} rx={8} fill={P.tanHi} stroke={INK} strokeWidth={6} />
        <rect x={-250} y={-42} width={80} height={84} rx={12} fill={P.tan} stroke={INK} strokeWidth={6} />
        <rect x={-242} y={-34} width={12} height={68} rx={5} fill="#fff" opacity={0.3} />
        <rect x={-196} y={-42} width={12} height={84} fill={P.tanShade} opacity={0.6} />
      </g>
      {dust > 0.02 && Array.from({length: 7}).map((_, i) => {
        const a = (i / 6) * Math.PI, d = 30 + 110 * (1 - dust);
        return <circle key={i} cx={-30 + d * Math.cos(a) * 1.6} cy={-48 - d * Math.sin(a) * 0.9} r={5} fill={P.cream} stroke={INK} strokeWidth={2} opacity={0.75 * dust} />;
      })}
    </g>
  );
};

const Banner: React.FC<{x: number; y: number; f: number; open: number; strip?: number; id: string}> = ({x, y, f, open, strip = 0, id}) => {
  const k = clamp01(open);
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-330} y={-8} width={660} height={18} rx={9} fill={P.tanShade} stroke={INK} strokeWidth={5} />
      <g transform={`rotate(${1.2 * Math.sin(f / 19)},0,0)`}>
        <path d={`M -310,10 L 310,10 L 310,${10 + 150 * k} L 0,${10 + 190 * k} L -310,${10 + 150 * k} Z`} fill={P.petrol} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {k > 0.8 && <text x={0} y={92} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={66} letterSpacing={6} fill={P.cream}>AIDEA BOARD</text>}
        {strip > 0.02 && (
          <g>
            <path d={`M -240,${10 + 190 * k} L 240,${10 + 190 * k - 14} L 240,${10 + 190 * k - 14 + 66 * strip} L -240,${10 + 190 * k + 66 * strip} Z`} fill={P.cream} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            {strip > 0.8 && <text x={0} y={10 + 190 * k + 36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={2} fill={INK}>STATE DEVELOPMENT AUTHORITY</text>}
          </g>
        )}
      </g>
    </g>
  );
};

const NameTag: React.FC<{x: number; y: number; f: number; k: number}> = ({x, y, f, k}) => {
  const kk = clamp01(k);
  if (kk < 0.02) return null;
  const sw = 7 * Math.sin(f / 9) * (1 - kk) + 2 * Math.sin(f / 21);
  return (
    <g transform={`translate(${x},${y - (1 - kk) * 240}) rotate(${sw})`}>
      <line x1={0} y1={-60} x2={0} y2={0} stroke={INK} strokeWidth={5} />
      <rect x={-130} y={0} width={260} height={96} rx={6} fill={P.cream} stroke={INK} strokeWidth={5} />
      <text x={0} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={1} fill={INK}>NORTHSTAR FIBER</text>
      <text x={0} y={54} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={1} fill={INK}>DEVELOPMENT</text>
      <text x={0} y={80} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={15} letterSpacing={1} fill={P.tomatoDeep}>(WORKING NAME)</text>
    </g>
  );
};

const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t4 = b(4), t42 = b(42), t52 = b(52), t5 = b(5), t6 = b(6), t7 = b(7);
  const hit = ease(f, t4 - 28, 24) * (1 - ease(f, t4 + 1, 4));
  const hit2 = ease(f, t52 - 22, 14) * (1 - ease(f, t52 - 1, 4));
  const slam = Math.max(hit, hit2);
  const dustK = Math.max(bump(f, t4 + 4, 20), bump(f, t52 + 3, 20));
  const banner = ease(f, t42 - 4, 22);
  const strip = ease(f, t52, 16);
  const unroll = ease(f, t5, 34);
  const slot = ease(f, t6, 14);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: t5 - 10, z: 1.04, fx: 520, fy: 980}, {t: p.dur, z: 1.14, fx: 640, fy: 930}]);
  return (
    <Frame p={p} cam={cam} bloom={0.05}
      overlay={<>
        <Plate p={win(f, t4 + 4, t5 - 4)} text="AIDEA BOARD · OCT 21ST · RESOLUTION G26-11" displayLines={['AIDEA BOARD · OCT 21ST', 'RESOLUTION G26-11']} y={700} size={34} tone="ink" />
        <Plate p={win(f, t7 + 6, t7 + 150)} text="NORTHSTAR FIBER DEVELOPMENT (WORKING NAME)" displayLines={['NORTHSTAR FIBER DEVELOPMENT', '(WORKING NAME)']} y={1010} size={30} tone="cream" />
      </>}>
      <SVG>
        <OfficeBG f={g} id="s2" />
        <Banner x={540} y={470} f={g} open={banner} strip={strip} id="s2b" />
        <g>
          <rect x={500} y={732} width={400} height={14} rx={7} fill={P.tanShade} stroke={INK} strokeWidth={5} />
          <Resolution x={700} y={738} s={0.62} f={g} unroll={unroll} slot={slot} id="s2r" sig={false} head={false} />
        </g>
        <Gavel x={250} y={1250} s={1.15} f={g} hit={slam} dust={dustK} id="s2g" />
        <Reel x={850} y={1380} s={0.62} f={g} mood={f > t7 ? 'smile' : 'calm'} look={-4} tail={0.4} phase={0.8} id="s2l" jolt={slam * 0.6} />
        <NameTag x={850} y={1060} f={g} k={ease(f, t7, 26)} />
        <NearDock f={g} y={1580} seed={2} />
      </SVG>
    </Frame>
  );
};

// ---- S3: the missing word (keys 8, 9, 10) ------------------------------------------------------------------------------------------------------
const CoilBack: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={0} cy={0} rx={120 - i * 14} ry={50 - i * 5} fill="none" stroke={INK} strokeWidth={22} />)}
    {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={0} cy={0} rx={120 - i * 14} ry={50 - i * 5} fill="none" stroke={P.cable} strokeWidth={14} />)}
    {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={0} cy={0} rx={120 - i * 14} ry={50 - i * 5} fill="none" stroke={P.tracer} strokeWidth={3} strokeDasharray="12 14" />)}
  </g>
);

const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t8 = b(8), t9 = b(9), t10 = b(10);
  const mag = easeIO(f, t9, 70);
  const sweepY = lerp(780, 1290, mag);
  const sweepX = 540 + 150 * Math.sin(mag * 9);
  const coil = ease(f, t8 - 6, 40);
  const sticky = ease(f, t10, 12);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.12, fx: 560, fy: 1010}]);
  return (
    <Frame p={p} cam={cam} bloom={0.05}
      overlay={<>
        <Plate p={win(f, t8 + 6, t9 - 4)} text="SUBSEA + TERRESTRIAL FIBER" y={560} size={34} tone="ink" />
        <Plate p={win(f, t9 + 6, t10 + 90)} text="ONE WORD IS MISSING" y={650} size={36} tone="cream" />
      </>}>
      <SVG>
        <OfficeBG f={g} id="s3" dusk={0.4} />
        <Resolution x={540} y={560} s={1.18} f={g} slot={1} id="s3r" ghost={0.3} sigPulse={0}
          stickies={sticky > 0.02 ? <g transform={`translate(${86 * 1},${158 - (1 - sticky) * 160}) scale(1)`}><Sticky x={0} y={-10} s={0.7} rot={-5} text="HOLD THAT THOUGHT" size={15} f={g} flap={1 - sticky} /></g> : undefined} />
        <g transform={`translate(${lerp(1300, 880, coil)},${lerp(1180, 1140, coil)})`}>
          <CoilBack x={0} y={0} s={0.9} rot={-18 + 6 * Math.sin(g / 14)} />
        </g>
        {f >= t9 - 10 && <Magnifier x={sweepX} y={sweepY} s={1.1} rot={-28} f={g} />}
        <NearDock f={g} y={1580} seed={3} />
      </SVG>
    </Frame>
  );
};

// ---- S4: four cables (keys 11, 12, 49, 13, 14) ---------------------------------------------------------------------------------------------------
const CABLE_START: Array<[number, number]> = [[430, 880], [510, 905], [600, 915], [690, 905]];
const cablePath = (i: number) => {
  const [x0, y0] = CABLE_START[i];
  const x1 = 260 + i * 190;
  return `M ${x0},${y0} C ${x0 - 20 + i * 8},${y0 + 150} ${x1 + 30},${1090 + i * 12} ${x1},1262`;
};
const PartyHat: React.FC<{x: number; y: number; s?: number; rot?: number; k: number}> = ({x, y, s = 1, rot = 0, k}) => {
  if (k < 0.02) return null;
  return (
    <g transform={`translate(${x},${y - (1 - k) * 160}) rotate(${rot}) scale(${s * (0.6 + 0.4 * k)})`}>
      <path d="M -26,0 L 0,-62 L 26,0 Z" fill={P.cream} stroke={INK} strokeWidth={4.4} strokeLinejoin="round" />
      <path d="M -17,-22 L 17,-22 M -22,-8 L 22,-8" stroke={P.petrol} strokeWidth={5} />
      <circle cx={0} cy={-64} r={7} fill={P.butter} stroke={INK} strokeWidth={3.4} />
    </g>
  );
};
const Tag1999: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k < 0.02) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${0.5 + 0.5 * k})`} opacity={clamp01(k * 2)}>
      <line x1={0} y1={0} x2={0} y2={-14} stroke={INK} strokeWidth={4} />
      <rect x={-56} y={-2} width={112} height={40} rx={4} fill={P.cream} stroke={INK} strokeWidth={4.4} />
      <text x={0} y={28} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={INK}>1999</text>
    </g>
  );
};
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t11 = b(11), t12 = b(12), t49 = b(49), t13 = b(13), t14 = b(14);
  const roll = ease(f, t11, 40);
  const lit = (i: number) => ease(f, t12 + i * 7, 10);
  const hats = ease(f, t13, 16);
  const gauge = easeIO(f, t14 - 14, 50);
  const landPulse = bump(f, t49, 24);
  const cam = track([{t: 0, z: 1.12, fx: 540, fy: 1010}, {t: t11 + 40, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.06, fx: 560, fy: 1060}]);
  const gaugeA = lerp(-70, 70, gauge);
  return (
    <Frame p={p} cam={cam} bloom={0.04}
      overlay={<>
        <Plate p={win(f, t12 + 4, t13 - 4)} text="4 UNDERSEA CABLES TO THE LOWER 48" displayLines={['4 UNDERSEA CABLES', 'TO THE LOWER 48']} y={590} size={34} tone="ink" />
        <Plate p={win(f, t13 + 4, t14 - 6)} text="2 IN SERVICE SINCE 1999" y={700} size={36} tone="cream" />
        <Plate p={win(f, t14 + 4, t14 + 150)} text="END OF TYPICAL DESIGN LIFE" y={800} size={34} tone="ink" />
      </>}>
      <SVG>
        <defs>
          <linearGradient id="s4sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={FIB.plumHi} /><stop offset="1" stopColor={FIB.plum} /></linearGradient>
          <clipPath id="s4ak"><path d={AK_PATH} /></clipPath>
        </defs>
        <rect x={-20} y={0} width={W + 40} height={H} fill="url(#s4sea)" />
        {Array.from({length: 9}).map((_, i) => <path key={i} d={`M -20,${480 + i * 100} L ${W + 20},${480 + i * 100}`} stroke="#fff" strokeWidth={2} opacity={0.1} />)}
        {Array.from({length: 12}).map((_, i) => <path key={`w${i}`} d={`M ${((i * 211 + g * 0.6) % 1300) - 110},${520 + (i % 6) * 120} q 24,-9 48,0 t 48,0`} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.2} />)}
        <g transform={`translate(${lerp(120, 40, roll)},${lerp(520, 420, roll)}) scale(${lerp(0.7, 0.95, roll)})`} opacity={clamp01(roll * 2.4)}>
          <path d={AK_PATH} transform="translate(8,12)" fill="#000" opacity={0.25} />
          <path d={AK_PATH} fill="#E9DFC4" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          <g clipPath="url(#s4ak)" opacity={0.35}>
            {Array.from({length: 14}).map((_, i) => <ellipse key={i} cx={200 + (i * 137) % 700} cy={150 + (i * 91) % 420} rx={60 + (i % 4) * 30} ry={24 + (i % 3) * 14} fill="none" stroke={P.tanShade} strokeWidth={3} />)}
          </g>
        </g>
        {CABLE_START.map((_, i) => {
          const d = cablePath(i);
          const k = lit(i);
          return (
            <g key={i} opacity={clamp01(roll * 3)}>
              <path d={d} fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" />
              <path d={d} fill="none" stroke={mix(P.petrolDeep, P.petrolHi, k)} strokeWidth={11} strokeLinecap="round" />
              <path d={d} fill="none" stroke={P.cream} strokeWidth={3} strokeLinecap="round" strokeDasharray="10 34" strokeDashoffset={-g * 2 - i * 9} opacity={0.2 + 0.7 * k} />
            </g>
          );
        })}
        {[0, 1].map((i) => {
          const x1 = 260 + i * 190;
          const mx = lerp(CABLE_START[i][0], x1, 0.5), my = 1090;
          return (
            <g key={i}>
              <PartyHat x={mx} y={my - 8} s={1} rot={i ? 8 : -8} k={hats} />
              <Tag1999 x={mx + 40} y={my + 14} k={hats} />
            </g>
          );
        })}
        <rect x={-20} y={1262} width={W + 40} height={68} fill={P.tanHi} stroke={INK} strokeWidth={7} />
        <rect x={-20} y={1262} width={W + 40} height={12} fill="#fff" opacity={0.3} />
        <text x={540} y={1314} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={8} fill={INK} opacity={0.85 + 0.15 * landPulse}>LOWER 48</text>
        {landPulse > 0.05 && <rect x={-20} y={1262} width={W + 40} height={68} fill="#fff" opacity={0.3 * landPulse} />}
        {CABLE_START.map((_, i) => <circle key={`l${i}`} cx={260 + i * 190} cy={1262} r={11 + 5 * landPulse} fill={P.cream} stroke={INK} strokeWidth={4.4} />)}
        <g transform="translate(172,1020)" opacity={clamp01((gauge + (f > t14 - 16 ? 1 : 0)) * 1.5)}>
          <path d="M -110,0 A 110,110 0 0 1 110,0" fill={P.cream} stroke={INK} strokeWidth={7} />
          <path d="M 60,-92 A 110,110 0 0 1 110,0" fill="none" stroke={P.tomato} strokeWidth={12} />
          <g transform={`rotate(${gaugeA},0,0)`}><line x1={0} y1={0} x2={0} y2={-94} stroke={INK} strokeWidth={8} strokeLinecap="round" /></g>
          <circle r={12} fill={P.cableHi} stroke={INK} strokeWidth={5} />
        </g>
        <NearDock f={g} y={1580} seed={4} />
      </SVG>
    </Frame>
  );
};

// ---- S5: a data cul-de-sac (keys 15, 54, 16, 43, 17) ---------------------------------------------------------------------------------------------
const RoadWorld: React.FC<{f: number; id: string; grey?: number}> = ({f, id, grey = 0}) => {
  const lampC = mix(P.cream, '#8C8A99', grey);
  return (
    <g>
      <DockBG f={f} id={id} deckTop={1130} sun={1 - grey * 0.6} />
      <path d="M 120,1130 L 960,1130 L 1500,1480 L -420,1480 Z" fill={P.tan} stroke={INK} strokeWidth={6} />
      <path d="M 420,1130 L 660,1130 L 1060,1480 L 20,1480 Z" fill={mix('#4A4A5C', '#6A6878', grey)} stroke={INK} strokeWidth={6} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M 540,${1140 + i * 76} L 540,${1160 + i * 76 + i * 8}`} stroke={P.cream} strokeWidth={4 + i * 2} strokeDasharray="16 12" strokeLinecap="round" />)}
      <rect x={410} y={1118} width={260} height={26} fill={P.tomato} stroke={INK} strokeWidth={5} opacity={1 - grey * 0.5} />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${420 + i * 52},1118 L ${446 + i * 52},1144`} stroke={P.cream} strokeWidth={14} />)}
      {[-1, 1].map((sx) => [0, 1, 2].map((i) => {
        const y = 1160 + i * 100, x = 540 + sx * (190 + i * 140);
        const sc = 0.5 + i * 0.28;
        return (
          <g key={`${sx}${i}`} transform={`translate(${x},${y}) scale(${sc})`}>
            <ContactShadow cx={0} cy={4} rx={36} ry={7} opacity={0.3} blur={6} />
            <rect x={-6} y={-200} width={12} height={200} fill={P.cableHi} stroke={INK} strokeWidth={5} />
            <path d="M -6,-196 Q 30,-216 56,-196" fill="none" stroke={INK} strokeWidth={6} />
            <circle cx={52} cy={-190} r={16} fill={lampC} stroke={INK} strokeWidth={4.4} />
            <circle cx={52} cy={-190} r={46} fill={lampC} opacity={0.28 * (1 - grey)} />
          </g>
        );
      }))}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${130 + i * 70},1090)`}>
          <rect x={0} y={-60} width={54} height={60} fill={mix([P.lilacHi, P.blush, P.cream][i], '#8C8A99', grey)} stroke={INK} strokeWidth={4} />
          <path d="M -6,-60 L 27,-96 L 60,-60 Z" fill={mix(P.tanShade, '#6A6878', grey)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <rect x={18} y={-40} width={16} height={18} fill={mix(P.saffronHi, '#8C8A99', grey)} opacity={0.6} stroke={INK} strokeWidth={2.4} />
        </g>
      ))}
    </g>
  );
};
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t15 = b(15), t54 = b(54), t16 = b(16), t43 = b(43), t17 = b(17);
  const rise = ease(f, t15, 22);
  const grey = easeIO(f, t16 + 4, 40) * (1 - easeIO(f, t17 - 2, 26));
  const flip = easeIO(f, t17, 18);
  const snap = ease(f, t16, 8);
  const spark = bump(f, t16 + 6, 26);
  const quote = ease(f, t54, 8);
  const cam = track([{t: 0, z: 1.0, fx: 600, fy: 1050}, {t: p.dur, z: 1.1, fx: 640, fy: 1020}]);
  const face = Math.cos(flip * Math.PI);
  const hubSide = flip > 0.5;
  return (
    <Frame p={p} cam={cam} bloom={0.05}
      overlay={<>
        <Plate p={win(f, t54, t16 - 4)} text="THE ROAD ENDS" y={560} size={34} tone="cream" />
        <Plate p={win(f, t16 + 4, t17 - 6)} text="ONE DAMAGED SYSTEM CAN DEGRADE OR ISOLATE LARGE PARTS OF THE STATE" displayLines={['ONE DAMAGED SYSTEM CAN DEGRADE', 'OR ISOLATE LARGE PARTS OF THE STATE']} y={690} size={30} tone="ink" />
        <Plate p={win(f, t17 + 4, t17 + 130)} text="FROM CUL-DE-SAC TOWARD HUB" displayLines={['FROM "CUL-DE-SAC"', 'TOWARD "HUB"']} y={830} size={36} tone="ink" />
        {grey > 0.05 && <rect x={0} y={0} width={W} height={H} fill="#8C8A99" opacity={0.28 * grey} />}
      </>}>
      <SVG>
        <RoadWorld f={g} id="s5" grey={grey} />
        <g transform={`translate(780,${1330 + (1 - rise) * 420})`}>
          <ContactShadow cx={0} cy={4} rx={70} ry={11} opacity={0.36} blur={8} />
          <Blk x={-9} y={-400} w={18} h={400} c={P.cableHi} id="s5post" r={4} sw={5} />
          <g transform={`translate(-150,-390) scale(${face >= 0 ? face : -face},1)`} style={{transformOrigin: '150px 0px'}}>
            <g transform="translate(150,0)">
              <rect x={-170} y={0} width={340} height={170} rx={8} fill={hubSide ? P.petrol : P.lilacDeep} stroke={INK} strokeWidth={7} />
              <rect x={-156} y={12} width={312} height={146} rx={4} fill="none" stroke={P.cream} strokeWidth={4} />
              {!hubSide ? (
                <>
                  <text x={0} y={70} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={3} fill={P.cream}>DATA</text>
                  <text x={0} y={124} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={3} fill={P.cream}>CUL-DE-SAC</text>
                </>
              ) : (
                <>
                  <text x={0} y={70} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={3} fill={P.cream}>DATA</text>
                  <text x={0} y={124} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={54} letterSpacing={6} fill={P.cream}>HUB</text>
                </>
              )}
              {quote > 0.05 && !hubSide && <g opacity={quote}><text x={-168} y={20} fontFamily={SERIF} fontWeight={900} fontSize={58} fill={P.cream}>"</text><text x={140} y={150} fontFamily={SERIF} fontWeight={900} fontSize={58} fill={P.cream}>"</text></g>}
            </g>
          </g>
        </g>
        {/* the trench cutaway: a cable under the road, a what-if snap drawn dashed */}
        <g transform="translate(60,800)">
          <rect x={0} y={0} width={420} height={230} rx={14} fill="#3B2F4A" stroke={INK} strokeWidth={8} />
          <rect x={0} y={0} width={420} height={30} rx={14} fill={P.tanShade} stroke={INK} strokeWidth={6} />
          {Array.from({length: 10}).map((_, i) => <circle key={i} cx={30 + (i * 83) % 380} cy={60 + (i * 47) % 150} r={5 + (i % 3) * 3} fill="#5D4B70" />)}
          <path d="M 10,130 L 190,130" stroke={INK} strokeWidth={26} strokeLinecap="round" />
          <path d="M 10,130 L 190,130" stroke={P.petrolHi} strokeWidth={14} strokeLinecap="round" />
          <path d={`M ${230 + 14 * snap},130 L 410,${130 + 14 * snap}`} stroke={P.cream} strokeWidth={12} strokeLinecap="round" strokeDasharray="14 12" opacity={0.7} />
          {spark > 0.03 && Array.from({length: 8}).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <line key={i} x1={210 + 20 * Math.cos(a)} y1={130 + 20 * Math.sin(a)} x2={210 + (30 + 40 * (1 - spark)) * Math.cos(a)} y2={130 + (30 + 40 * (1 - spark)) * Math.sin(a)} stroke={P.tomato} strokeWidth={6} strokeLinecap="round" opacity={spark} />;
          })}
          <text x={210} y={206} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={2} fill={P.cream} opacity={0.9}>WHAT IF</text>
        </g>
        <NearDock f={g} y={1580} seed={5} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the clock (keys 18, 19, 57, 20) -------------------------------------------------------------------------------------------------------------
const Porthole: React.FC<{cx: number; cy: number; r: number; f: number; id: string; children?: React.ReactNode}> = ({cx, cy, r, f, id, children}) => (
  <g>
    <defs><clipPath id={`${id}_c`}><circle cx={cx} cy={cy} r={r} /></clipPath>
      <linearGradient id={`${id}_s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.lilacHi} /><stop offset="0.6" stopColor={P.lilac} /><stop offset="1" stopColor={P.blush} /></linearGradient></defs>
    <g clipPath={`url(#${id}_c)`}>
      <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} fill={`url(#${id}_s)`} />
      <circle cx={cx - r * 0.5} cy={cy + r * 0.1} r={r * 0.2} fill={P.saffronHi} stroke={INK} strokeWidth={4} />
      <rect x={cx - r} y={cy + r * 0.2} width={2 * r} height={r} fill={FIB.plum} />
      <rect x={cx - r} y={cy + r * 0.62} width={2 * r} height={r} fill={P.tan} stroke={INK} strokeWidth={5} />
      {children}
    </g>
    <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke={INK} strokeWidth={34} />
    <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke={P.cableHi} strokeWidth={22} />
    {Array.from({length: 12}).map((_, i) => { const a = (i * Math.PI) / 6; return <circle key={i} cx={cx + (r + 14) * Math.cos(a)} cy={cy + (r + 14) * Math.sin(a)} r={7} fill={P.petrolHi} stroke={INK} strokeWidth={3.4} />; })}
    <path d={`M ${cx - r * 0.7},${cy - r * 0.4} A ${r * 0.8},${r * 0.8} 0 0 1 ${cx - r * 0.2},${cy - r * 0.78}`} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.5} />
  </g>
);
const VaultInterior: React.FC<{f: number; id: string; lamp?: number}> = ({f, id, lamp = 1}) => (
  <g>
    <defs>
      <linearGradient id={`${id}_w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1E3A46" /><stop offset="1" stopColor="#0F2229" /></linearGradient>
      <radialGradient id={`${id}_l`} cx="0.5" cy="0" r="1"><stop offset="0" stopColor={P.saffronHi} stopOpacity={0.5 * lamp} /><stop offset="1" stopColor={P.saffronHi} stopOpacity={0} /></radialGradient>
    </defs>
    <rect x={-20} y={0} width={W + 40} height={H} fill={`url(#${id}_w)`} />
    {Array.from({length: 12}).map((_, r) => Array.from({length: 7}).map((__, c) => <rect key={`${r}${c}`} x={-30 + c * 170 + (r % 2) * 85} y={20 + r * 112} width={158} height={100} rx={4} fill="none" stroke="#000" strokeWidth={3} opacity={0.32} />))}
    <path d={`M 700,0 L 700,300`} stroke={INK} strokeWidth={6} />
    <path d="M 640,300 L 760,300 L 980,1230 L 420,1230 Z" fill={`url(#${id}_l)`} opacity={0.9 + 0.1 * Math.sin(f / 4)} />
    <path d="M 650,300 Q 700,262 750,300 Z" fill={P.cableHi} stroke={INK} strokeWidth={6} />
    <circle cx={700} cy={310} r={16} fill={P.saffronHi} stroke={INK} strokeWidth={4} />
    <rect x={-20} y={1230} width={W + 40} height={H - 1230} fill="#16313A" stroke={INK} strokeWidth={6} />
  </g>
);
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t18 = b(18), t19 = b(19), t57 = b(57), t20 = b(20);
  const drop = ease(f, t18 - 10, 14);
  const land = bump(f, t18 + 4, 26);
  const spin = f < t19 ? easeIO(f, t18 + 4, Math.max(10, t19 - t18 - 6)) * 3.4 + 0.1 : 0.04 + 0.006 * Math.sin(g / 5);
  const hand = f < t19 ? spin : 0.04 + 0.006 * Math.sin(g / 5);
  const wedge = ease(f, t19 - 8, 18);
  const pen = ease(f, t57 - 14, 14);
  const lever = ease(f, t20, 18);
  const cam = track([{t: 0, z: 1.0, fx: 600, fy: 1000}, {t: p.dur, z: 1.1, fx: 640, fy: 980}]);
  const cy = lerp(-760, 0, drop);
  return (
    <Frame p={p} cam={cam} bloom={0.07} vignette={0.3}
      overlay={<>
        <Plate p={win(f, t18 + 4, t19 - 2)} text="THE MONEY HAS A CLOCK" y={560} size={36} tone="cream" />
        <Plate p={win(f, t19 + 2, t19 + 240)} text="AUTHORITY EXPIRES DEC 31ST, 2028" displayLines={['AUTHORITY EXPIRES', 'DEC 31ST, 2028']} y={680} size={36} tone="ink" />
        <Plate p={win(f, t20 + 4, t20 + 120)} text="UNLESS THE BOARD EXTENDS IT" y={800} size={30} tone="cream" />
      </>}>
      <SVG>
        <VaultInterior f={g} id="s6" />
        <Porthole cx={290} cy={780} r={170} f={g} id="s6p" />
        <rect x={380} y={1226} width={640} height={40} rx={6} fill={P.tan} stroke={INK} strokeWidth={6} />
        <rect x={380} y={1226} width={640} height={10} fill="#fff" opacity={0.25} />
        <g transform={`translate(0,${cy})`}>
          <Clock x={700} y={1226} s={0.95} f={g} hand={hand} wedge={wedge} id="s6c" jolt={land} chime={land * 0.5} />
        </g>
        {/* the plaque the pen lands on */}
        <g transform="translate(470,1196)">
          <rect x={-66} y={-34} width={132} height={40} rx={4} fill={P.cream} stroke={INK} strokeWidth={4} />
          <text x={0} y={-20} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={INK}>AUTHORITY</text>
          <text x={0} y={-4} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill={INK}>TO SIGN</text>
        </g>
        {pen > 0.02 && <Pen x={600} y={lerp(300, 1204, pen) - 6 * bump(f, t57 + 8, 14)} s={0.8} rot={lerp(160, 84, pen)} f={g} />}
        {/* the lever and flag */}
        <g transform="translate(940,1226)">
          <Blk x={-30} y={-24} w={60} h={24} c={P.cableHi} id="s6lv" r={4} sw={5} />
          <g transform={`rotate(${lerp(-40, 30, lever)},0,-20)`}><rect x={-5} y={-130} width={10} height={112} rx={4} fill={P.tanHi} stroke={INK} strokeWidth={5} /><circle cx={0} cy={-136} r={14} fill={P.tomato} stroke={INK} strokeWidth={4.4} /></g>
        </g>
        <Reel x={110} y={1420} s={0.55} f={g} mood={land > 0.1 ? 'surprise' : 'worry'} look={5} tail={0.3} phase={0.4} id="s6r" jolt={land} />
      </SVG>
    </Frame>
  );
};

// ---- S7: the line forms (keys 21, 22, 50, 51, 23) ----------------------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t21 = b(21), t22 = b(22), t50 = b(50), t51 = b(51), t23 = b(23);
  const cx = 540, cy = 1060, r = 300;
  const count = Math.min(15, Math.floor(Math.max(0, f - t23 + 6) / 4));
  const lift = ease(f, t51, 14);
  const cam = track([{t: 0, z: 1.18, fx: 540, fy: 1040}, {t: t21 + 50, z: 1.0, fx: 540, fy: 1020}, {t: p.dur, z: 1.04, fx: 540, fy: 1050}]);
  return (
    <Frame p={p} cam={cam} bloom={0.06} vignette={0.3}
      overlay={<>
        <Plate p={win(f, t21 + 6, t22 - 2)} text="THE LINE FORMS" y={540} size={34} tone="cream" />
        <Plate p={win(f, t22 + 2, t23 + 200)} text="ALASKA PUBLIC MEDIA" y={632} size={32} tone="ink" />
        <Plate p={win(f, t50 + 2, t23 + 200)} text="OCT 15TH" y={720} size={32} tone="cream" />
        <Plate p={win(f, t23 + 2, t23 + 200)} text="AS MANY AS 15 DATA CENTER PROPOSALS" displayLines={['AS MANY AS 15', 'DATA CENTER PROPOSALS']} y={840} size={34} tone="ink" />
      </>}>
      <SVG>
        <VaultInterior f={g} id="s7" lamp={0.6} />
        <Porthole cx={cx} cy={cy} r={r} f={g} id="s7p">
          {Array.from({length: 15}).map((_, i) => {
            const row = i % 2;
            const x = -100 - i * 96 + (f + 40) * 4.4;
            const y = cy + 150 + row * 56;
            const faced = i < 3;
            return (
              <g key={i}>
                <DataBox x={x} y={y} s={0.62 + row * 0.08} f={g} mood={faced ? 'hope' : 'blank'} faceless={!faced} phase={i * 1.3} id={`s7b${i}`} hop={count > i ? bump(f, t23 + i * 4, 14) * 0.3 : 0} />
                <Sticky x={x + 6} y={y - 124 * (0.62 + row * 0.08) - lift * 18} s={0.55} rot={-4 + (i % 3) * 3} text="MAYBE?" size={20} f={g} />
              </g>
            );
          })}
        </Porthole>
        <NearDock f={g} y={1580} seed={7} />
      </SVG>
    </Frame>
  );
};

// ---- S8: Sec. 9 (keys 24, 44, 25, 26, 27) -------------------------------------------------------------------------------------------------------------
const NOTE_FROM = [[860, 1050], [980, 1090], [1040, 1000], [920, 940], [1010, 900]];
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t24 = b(24), t44 = b(44), t25 = b(25), t26 = b(26), t27 = b(27);
  const clipIn = ease(f, t24, 20);
  const coin = ease(f, t44 - 6, 26);
  const press = ease(f, t26, 10);
  const fly = (i: number) => ease(f, t26 + i * 3, 14);
  const gust = ease(f, t27 + 6, 26);
  const stampK = ease(f, t27 - 2, 6);
  const stampOn = f >= t27 + 2;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1080}, {t: p.dur, z: 1.12, fx: 560, fy: 1010}]);
  return (
    <Frame p={p} cam={cam} bloom={0.05}
      overlay={<>
        <Plate p={win(f, t24 + 4, t25 - 4)} text="SEC. 9" y={530} size={36} tone="ink" />
        <Plate p={win(f, t25 + 2, t25 + 210)} text="SEC. 9 · BINDING CUSTOMER COMMITMENTS" displayLines={['SEC. 9 · BINDING', 'CUSTOMER COMMITMENTS']} y={625} size={34} tone="ink" />
        <Plate p={win(f, t44 + 4, t25 - 2)} text="NO DOLLAR YET" y={735} size={34} tone="cream" />
        <Plate p={win(f, t26 + 2, t27 + 80)} text='"EXPRESSIONS OF INTEREST ... DO NOT SATISFY"' displayLines={['"EXPRESSIONS OF INTEREST', '... DO NOT SATISFY"']} y={860} size={30} tone="cream" />
      </>}>
      <SVG>
        <defs><linearGradient id="s8sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.lilacHi} /><stop offset="1" stopColor={P.blush} /></linearGradient></defs>
        <rect x={-20} y={0} width={W + 40} height={1060} fill="url(#s8sky)" />
        {Array.from({length: 9}).map((_, i) => <circle key={i} cx={80 + i * 130 + 20 * Math.sin(g / 40 + i)} cy={620 + 150 * rnd(i + 4)} r={40 + 50 * rnd(i + 2)} fill={P.saffronHi} opacity={0.12} />)}
        <rect x={-20} y={1010} width={W + 40} height={H - 1010} fill={P.tan} stroke={INK} strokeWidth={6} />
        {Array.from({length: 8}).map((_, i) => <path key={i} d={`M -20,${1030 + i * i * 14 + i * 18} L ${W + 20},${1030 + i * i * 14 + i * 18}`} stroke={INK} strokeWidth={3} opacity={0.3} />)}
        {Array.from({length: 9}).map((_, i) => <path key={`v${i}`} d={`M ${120 + i * 110},1010 L ${-500 + i * 260},${H}`} stroke={INK} strokeWidth={2.4} opacity={0.2} />)}
        <Easel x={540} y={1330} s={1} f={g} id="s8e" sheetScale={0.75} head={false}
          extra={
            <g>
              {/* the sticky notes that pile onto the line */}
              {NOTE_FROM.map(([nx, ny], i) => {
                const k = fly(i);
                const gx = lerp(0, -520 - i * 40, gust), gy = lerp(0, -260 - 30 * i, gust);
                const tx = [-150, -50, 50, 150, -60][i], ty = [-430, -430, -430, -430, -330][i];
                const ex = lerp(nx - 540, tx, k) + gx, ey = lerp(ny - 1330 - 40 * Math.sin(k * Math.PI) * 6, ty, k) + gy;
                if (k < 0.01 || gust > 0.55) return null;
                return <Sticky key={i} x={ex} y={ey} s={0.95} rot={lerp(-12, (i % 3) * 4 - 6, k) + gust * 60} text="MAYBE?" size={22} f={g} flap={gust} />;
              })}
              {stampOn && (
                <g transform={`translate(150,-486) rotate(-7) scale(${1 + 0.8 * (1 - stampK)})`} opacity={clamp01(stampK * 2)}>
                  <rect x={-160} y={-34} width={320} height={68} rx={4} fill="none" stroke={P.tomato} strokeWidth={8} />
                  <text x={0} y={11} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={2} fill={P.tomato}>DO NOT COUNT</text>
                </g>
              )}
            </g>
          }
          sigPulse={press > 0.5 && gust < 0.1 ? 0 : 0} />
        <g transform={`translate(${lerp(-260, 200, clipIn)},0)`}>
          <Clip x={0} y={1340} s={1.28} f={g} mood={f < t26 ? 'firm' : 'smug'} stamp={bump(f, t27 - 6, 16)} id="s8c" />
        </g>
        {[0, 1, 2, 3].map((i) => (
          <DataBox key={i} x={760 + i * 118} y={1350 - (i % 2) * 4} s={1.15} f={g} flip={false} mood={i === 0 ? 'hope' : 'blank'} faceless={i !== 0} phase={i * 1.4} id={`s8b${i}`} arm={press * 0.5} hop={bump(f, t26 + i * 3, 12) * 0.25} />
        ))}
        {coin > 0.01 && coin < 0.999 && <g transform={`translate(${lerp(250, 200, coin)},${lerp(300, 1010, coin)}) rotate(${coin * 720})`}><ellipse rx={30} ry={30 * Math.abs(Math.cos(coin * 14))} fill={P.gold} stroke={INK} strokeWidth={5} /></g>}
        {coin >= 0.999 && f < t25 + 40 && <g transform="translate(200,1010)"><ellipse rx={30} ry={30} fill={P.gold} stroke={INK} strokeWidth={5} /><text x={0} y={11} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={INK}>$</text></g>}
        <NearDock f={g} y={1580} seed={8} />
      </SVG>
    </Frame>
  );
};

// ---- S9: the fair case against (keys 28, 29, 30) -----------------------------------------------------------------------------------------------
const Bubble: React.FC<{x: number; y: number; lines: string[]; k: number; tail?: 1 | -1; size?: number}> = ({x, y, lines, k, tail = 1, size = 26}) => {
  const kk = clamp01(k);
  if (kk < 0.02) return null;
  const w = Math.max(...lines.map((l) => monoW(l, size))) + 46, h = lines.length * (size + 12) + 30;
  return (
    <g transform={`translate(${x},${y}) scale(${0.7 + 0.3 * kk})`} opacity={clamp01(kk * 2)}>
      <path d={`M ${-w / 2},${-h} L ${w / 2},${-h} L ${w / 2},0 L ${tail * 20},0 L ${tail * 40},34 L ${tail * -4},0 L ${-w / 2},0 Z`} fill={P.cream} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {lines.map((l, i) => <text key={i} x={0} y={-h + 18 + (size + 12) * (i + 0.6) + size * 0.3} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1} fill={INK}>{l}</text>)}
    </g>
  );
};
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t28 = b(28), t29 = b(29), t30 = b(30);
  const take = easeIO(f, t30 - 4, 18);
  const boxArm = 0.9;
  const bx = 850, by = 1245, bs = 1.6;
  const boxHand = {x: bx - (66 + 90 * boxArm) * bs, y: by - (100 + 14 * boxArm) * bs};
  const rs = 0.8, rx0 = 250, raise = 0.75 * ease(f, t30 - 10, 16);
  const reelHandP = reelHand(raise, rs, rx0, 1245);
  const penHand = {x: lerp(boxHand.x, reelHandP.x, take), y: lerp(boxHand.y, reelHandP.y, take)};
  const penRot = lerp(55, -55, take);
  const zoom = easeIO(f, t30 - 2, 12);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1050}, {t: t30 - 2, z: 1.04, fx: 560, fy: 1040}, {t: t30 + 10, z: 1.9, fx: 270, fy: 980}, {t: p.dur, z: 1.8, fx: 280, fy: 990}]);
  const mood = f > t30 ? 'firm' : 'calm';
  return (
    <Frame p={p} cam={cam} bloom={0.06} vignette={0.32}
      overlay={<>
        <Plate p={win(f, t28 + 4, t30 - 6)} text="THE FAIR CASE AGAINST THE RULE" displayLines={['THE FAIR CASE', 'AGAINST THE RULE']} y={580} size={36} tone="ink" />
      </>}>
      <SVG>
        <OfficeBG f={g} id="s9" dusk={0.95} />
        <defs><radialGradient id="s9v" cx="0.5" cy="0.62" r="0.62"><stop offset="0" stopColor="#10142A" stopOpacity={0} /><stop offset="1" stopColor="#10142A" stopOpacity={0.62} /></radialGradient>
          <linearGradient id="s9cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.saffronHi} stopOpacity={0.5} /><stop offset="1" stopColor={P.saffronHi} stopOpacity={0.05} /></linearGradient></defs>
        <path d="M 520,60 L 560,60 L 900,1240 L 180,1240 Z" fill="url(#s9cone)" opacity={0.7 + 0.1 * Math.sin(g / 5)} />
        <g transform={`translate(540,0) rotate(${2 * Math.sin(g / 25)},0,0)`}>
          <line x1={0} y1={0} x2={0} y2={64} stroke={INK} strokeWidth={6} />
          <path d="M -70,128 Q -60,64 0,64 Q 60,64 70,128 Z" fill={P.cableHi} stroke={INK} strokeWidth={6} />
          <ellipse cx={0} cy={128} rx={70} ry={12} fill={P.saffronHi} stroke={INK} strokeWidth={4} />
        </g>
        <rect x={90} y={1236} width={900} height={36} rx={6} fill={P.tan} stroke={INK} strokeWidth={6} />
        <Resolution x={540} y={940} s={0.45} f={g} id="s9r" ghost={0.2} head={false} />
        <Reel x={rx0} y={1245} s={rs} f={g} mood={mood as ReelMood} look={4} raise={raise} phase={0.2} id="s9l" tail={0.2} />
        <DataBox x={bx} y={by} s={bs} f={g} mood={f > t30 ? 'sweat' : 'cheer'} arm={boxArm} look={-4} phase={0.5} id="s9b" />
        <Pen x={penHand.x - 40} y={penHand.y + 45} s={0.8} rot={penRot} f={g} />
        <Bubble x={820} y={760} lines={['WAITS FOR', 'THE CABLE']} k={ease(f, t29, 10)} tail={-1} />
        <Bubble x={300} y={820} lines={['WAITS FOR', 'THE CUSTOMER']} k={ease(f, t30 + 4, 10)} tail={1} />
        <rect x={-20} y={0} width={W + 40} height={H} fill="url(#s9v)" />
        <NearDock f={g} y={1580} seed={9} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the ceiling (keys 31, 45, 55, 32) --------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t31 = b(31), t45 = b(45), t55 = b(55), t32 = b(32);
  const slam = ease(f, t31 - 8, 12);
  const slabY = lerp(120, 700, slam);
  const ring = bump(f, t31 + 4, 26);
  const meter = easeIO(f, t45 - 8, 26);
  const lock = ease(f, t55, 10);
  const note = ease(f, t32 - 6, 30);
  const noteX = lerp(560, 950, note);
  const noteY = 1000 - 460 * Math.sin(Math.min(1, note * 1.8) * Math.PI * 0.55) + 120 * note * note;
  const cam = track([{t: 0, z: 1.1, fx: 640, fy: 900}, {t: t31 + 20, z: 1.0, fx: 600, fy: 1000}, {t: p.dur, z: 1.08, fx: 620, fy: 1030}]);
  return (
    <Frame p={p} cam={cam} bloom={0.06}
      overlay={<>
        <Plate p={win(f, t31 + 4, t45 - 4)} text="$75M · ALL-IN CEILING" y={560} size={38} tone="ink" />
        <Plate p={win(f, t45 + 2, t55 - 2)} text="THE MOST IT CAN RISK" y={650} size={34} tone="cream" />
        <Plate p={win(f, t55 + 4, t32 + 100)} text="A CAPPED STATE FUND" y={760} size={34} tone="ink" />
      </>}>
      <SVG>
        <DockBG f={g} id="s10" sun={0.7} />
        <Vault x={690} y={1290} s={1} f={g} lit={1} id="s10v" jolt={ring} />
        <g transform={`translate(690,${slabY + 5 * ring * Math.sin(g)})`}>
          <rect x={-250} y={0} width={500} height={48} rx={6} fill={P.lilacHi} opacity={0.55} stroke={INK} strokeWidth={7} />
          <rect x={-240} y={6} width={480} height={10} fill="#fff" opacity={0.6} />
          <path d="M -200,38 L -120,10 M 60,38 L 150,12" stroke="#fff" strokeWidth={5} opacity={0.6} strokeLinecap="round" />
          {slam > 0.9 && Array.from({length: 9}).map((_, i) => <line key={i} x1={-250 + i * 62} y1={52} x2={-250 + i * 62 + (i % 2 ? 10 : -10)} y2={52 + 40 * ring} stroke="#fff" strokeWidth={4} opacity={0.5 * ring} strokeLinecap="round" />)}
        </g>
        {/* the level meter */}
        <g transform="translate(990,1290)">
          <ContactShadow cx={0} cy={4} rx={60} ry={9} opacity={0.3} blur={6} />
          <rect x={-30} y={-540} width={60} height={540} rx={10} fill={P.cream} stroke={INK} strokeWidth={6} />
          <rect x={-22} y={-540 + 540 * (1 - meter)} width={44} height={540 * meter} rx={6} fill={P.petrolHi} />
          <line x1={-44} y1={-540} x2={44} y2={-540} stroke={P.tomato} strokeWidth={7} />
        </g>
        {/* the small coffer */}
        <g transform="translate(370,1290)">
          <ContactShadow cx={0} cy={4} rx={110} ry={11} opacity={0.34} blur={7} />
          <Blk x={-100} y={-120} w={200} h={120} c={P.tanShade} id="s10cf" r={10} sw={6} />
          <path d="M -100,-120 Q 0,-190 100,-120 Z" fill={P.tan} stroke={INK} strokeWidth={6} />
          <rect x={-18} y={-98} width={36} height={44} rx={5} fill={lock > 0.5 ? P.cableHi : P.tanHi} stroke={INK} strokeWidth={5} />
          <path d={`M -10,-98 Q -10,${-128 + 10 * (1 - lock)} 0,${-128 + 10 * (1 - lock)} Q 10,${-128 + 10 * (1 - lock)} 10,-98`} fill="none" stroke={INK} strokeWidth={7} />
        </g>
        <Reel x={150} y={1290} s={0.7} f={g} mood={f > t31 ? 'worry' : 'calm'} look={5} tail={0.3} phase={0.9} id="s10r" jolt={ring * 0.5} />
        {note > 0.01 && note < 0.99 && <Sticky x={noteX} y={noteY} s={0.9} rot={-20 + 400 * note} text="MAYBE?" size={22} f={g} flap={note} />}
        <NearDock f={g} y={1580} seed={10} />
      </SVG>
    </Frame>
  );
};

// ---- S11: the word (keys 33, 53, 34, 35) -------------------------------------------------------------------------------------------------------------
const DeskTop: React.FC<{f: number; id: string}> = ({f, id}) => (
  <g>
    <defs><linearGradient id={`${id}_d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.tanHi} /><stop offset="1" stopColor={P.tan} /></linearGradient></defs>
    <rect x={-20} y={0} width={W + 40} height={H} fill={`url(#${id}_d)`} />
    {Array.from({length: 9}).map((_, i) => <path key={i} d={`M -20,${180 + i * 210} Q 540,${150 + i * 210 + 20 * Math.sin(i)} 1100,${180 + i * 210}`} stroke={INK} strokeWidth={3} opacity={0.18} fill="none" />)}
    <circle cx={150} cy={1250} r={70} fill="none" stroke={P.tanShade} strokeWidth={10} opacity={0.4} />
    <g transform="translate(920,1180) rotate(-20)"><rect x={-90} y={-8} width={180} height={16} rx={7} fill={P.petrol} stroke={INK} strokeWidth={5} /><path d="M 90,-8 L 118,0 L 90,8 Z" fill={P.cream} stroke={INK} strokeWidth={4} /></g>
  </g>
);
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t33 = b(33), t53 = b(53), t34 = b(34), t35 = b(35);
  const sweep = easeIO(f, t33, t53 - t33);
  const mx = lerp(300, 780, sweep) + 60 * Math.sin(sweep * 10);
  const my = lerp(640, 1180, sweep);
  const stop = easeIO(f, t53, 14);
  const peel = ease(f, t33 + 6, 22);
  const tw = ease(f, t35 - 4, 50);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1010}, {t: p.dur, z: 1.12, fx: 560, fy: 1040}]);
  const chip = (k: number) => ease(f, t34 + k * 22, 10);
  const mxx = lerp(mx, 640, stop), myy = lerp(my, 830, stop);
  return (
    <Frame p={p} cam={cam} bloom={0.05}
      overlay={<>
        <Plate p={win(f, t33 + 2, t53 - 2)} text="SEARCHING THE TEXT" y={540} size={34} tone="cream" />
        <Plate p={win(f, t53 + 2, t53 + 220)} text='THE RESOLUTION NEVER SAYS "AI"' displayLines={['THE RESOLUTION', 'NEVER SAYS "AI"']} y={640} size={36} tone="ink" />
        <Plate p={chip(0) * (1 - ease(f, t35 + 40, 8))} text="AI · 0 MATCHES" y={790} size={30} tone="cream" />
        <Plate p={chip(1) * (1 - ease(f, t35 + 40, 8))} text="DATA CENTERS · 0 MATCHES" y={870} size={30} tone="cream" />
        <Plate p={chip(2) * (1 - ease(f, t35 + 40, 8))} text="COMPUTE · 0 MATCHES" y={950} size={30} tone="cream" />
        <Plate p={win(f, t35 + 4, t35 + 80)} text="NOTHING ON THE PAGE" y={1060} size={34} tone="ink" />
      </>}>
      <SVG>
        <DeskTop f={g} id="s11" />
        <Resolution x={540} y={500} s={1.18} f={g} slot={1} id="s11r" ghost={0.3}
          stickies={peel < 0.98 ? <g transform={`translate(${86 + 220 * peel},${150 + 340 * peel * peel}) rotate(${40 * peel})`}><Sticky x={0} y={0} s={0.7} rot={-5} text="HOLD THAT THOUGHT" size={15} f={g} flap={peel} /></g> : undefined} />
        <Magnifier x={mxx} y={myy} s={1.1} rot={-28} f={g} />
        {tw > 0.01 && tw < 0.99 && (
          <g transform={`translate(${lerp(-120, 1200, tw)},1240) rotate(${tw * 1400})`}>
            <circle r={44} fill="none" stroke={INK} strokeWidth={5} />
            {Array.from({length: 9}).map((_, i) => <path key={i} d={`M ${-40 + i * 9},${-30 + (i % 3) * 22} Q 0,${(i % 2 ? -50 : 50)} ${40 - i * 8},${30 - (i % 4) * 16}`} fill="none" stroke={P.tanShade} strokeWidth={4} />)}
          </g>
        )}
        <NearDock f={g} y={1580} seed={11} />
      </SVG>
    </Frame>
  );
};

// ---- S12: without AI (keys 36, 58, 37, 60, 47, 38) -----------------------------------------------------------------------------------------------
const House: React.FC<{x: number; y: number; s?: number; c: string; lit: number; f: number; id: string; hop?: number}> = ({x, y, s = 1, c, lit, f, id, hop = 0}) => (
  <g transform={`translate(${x},${y - hop * 14}) scale(${s})`}>
    <ContactShadow cx={0} cy={4} rx={70} ry={9} opacity={0.34} blur={7} />
    <Blk x={-56} y={-96} w={112} h={96} c={c} id={id} r={3} sw={6} />
    <path d="M -72,-92 L 0,-158 L 72,-92 Z" fill={P.tanShade} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-18} y={-72} width={36} height={34} fill={lit > 0.5 ? P.saffronHi : '#6D6A8A'} stroke={INK} strokeWidth={4} opacity={0.5 + 0.5 * lit} />
    {lit > 0.5 && <circle cx={0} cy={-55} r={50} fill={P.saffronHi} opacity={0.2 * lit} />}
    <rect x={-14} y={-38} width={28} height={38} fill="#3D3552" stroke={INK} strokeWidth={4} />
  </g>
);
const Coin: React.FC<{x: number; y: number; s?: number; spin?: number}> = ({x, y, s = 1, spin = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse rx={20 * Math.abs(Math.cos(spin))} ry={20} fill={P.petrolHi} stroke={INK} strokeWidth={4} />
    <text y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={P.cream} opacity={Math.abs(Math.cos(spin))}>$</text>
  </g>
);
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t36 = b(36), t58 = b(58), t37 = b(37), t60 = b(60), t47 = b(47), t38 = b(38);
  const away = easeIO(f, t36, 36);
  const lightRun = ease(f, t58, 30);
  const cloud = ease(f, t60 - 10, 40);
  const pour = f - t37;
  const beam = ease(f, t47, 20);
  const cam = track([{t: 0, z: 1.0, fx: 600, fy: 1040}, {t: p.dur, z: 1.1, fx: 560, fy: 1010}]);
  const roofs = [0, 1, 2, 3, 4, 5];
  return (
    <Frame p={p} cam={cam} bloom={0.07}
      overlay={<>
        <Plate p={win(f, t36 + 4, t58 - 2)} text="TAKE AI OUT" y={540} size={38} tone="ink" />
        <Plate p={win(f, t58 + 2, t37 + 4)} text="THE CABLE STANDS" y={630} size={36} tone="cream" />
        <Plate p={win(f, t37 + 2, t47 - 2)} text="BEAD · $1.017 BILLION ALLOCATED" displayLines={['BEAD · $1.017 BILLION', 'ALLOCATED']} y={740} size={34} tone="ink" />
        <Plate p={win(f, t47 + 4, t47 + 190)} text="DEPENDS ON A RESILIENT BACKBONE" displayLines={['DEPENDS ON A', 'RESILIENT BACKBONE']} y={880} size={34} tone="cream" />
      </>}>
      <SVG>
        <DockBG f={g} id="s12" sun={1} deckTop={1090} />
        {roofs.map((i) => <House key={i} x={250 + i * 142} y={1230 + (i % 2) * 20} s={0.8 + (i % 3) * 0.06} c={[P.lilacHi, P.blush, P.cream, P.lilac][i % 4]} lit={ease(f, t38 - 10 + i * 5, 6)} f={g} id={`s12h${i}`} hop={beam > 0.2 ? bump(f, t47 + i * 4, 14) * 0.6 : 0} />)}
        {/* the cable runs the whole row and lifts under the roofs like a beam */}
        <path d={`M 120,1316 L 1100,1316`} stroke={INK} strokeWidth={28} strokeLinecap="round" />
        <path d={`M 120,1316 L 1100,1316`} stroke={P.cable} strokeWidth={18} strokeLinecap="round" />
        <path d={`M 120,1316 L 1100,1316`} stroke={P.tracer} strokeWidth={4} strokeLinecap="round" strokeDasharray="14 14" strokeDashoffset={-g * 2} />
        <path d={`M 120,1316 L ${120 + 980 * lightRun},1316`} stroke={P.cream} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
        {/* the boxes slide away */}
        {[0, 1, 2].map((i) => <DataBox key={i} x={900 + i * 120 + away * 520} y={1240 + (i % 2) * 18} s={0.9} f={g} faceless={i !== 0} mood="blank" phase={i * 1.2} id={`s12b${i}`} hop={bump(f, t36 + i * 3, 12) * 0.3} />)}
        <Reel x={180} y={1300} s={0.72} f={g} mood={f > t36 + 30 ? 'smile' : 'calm'} look={4} crank={away * 2} tail={1} phase={0.1} id="s12r" />
        {/* the federal broadband cloud and the coin river */}
        <g transform={`translate(${lerp(1300, 560, cloud)},${600 + 12 * Math.sin(g / 20)})`} opacity={clamp01(cloud * 2)}>
          <ellipse cx={0} cy={0} rx={250} ry={62} fill={P.lilacHi} stroke={INK} strokeWidth={6} />
          <ellipse cx={-110} cy={-34} rx={110} ry={56} fill={P.lilacHi} stroke={INK} strokeWidth={6} />
          <ellipse cx={80} cy={-48} rx={130} ry={64} fill={P.lilacHi} stroke={INK} strokeWidth={6} />
          <ellipse cx={0} cy={6} rx={238} ry={52} fill={P.lilacHi} />
          <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={25} letterSpacing={2} fill={INK}>FEDERAL BROADBAND</text>
        </g>
        {pour > 0 && Array.from({length: 18}).map((_, i) => {
          const k = ((pour - i * 5) % 90) / 90;
          if (pour - i * 5 < 0) return null;
          const hx = 250 + (i % 6) * 142;
          return <Coin key={i} x={lerp(560 + 80 * Math.sin(i), hx, k)} y={lerp(660, 1100 + (i % 2) * 20, k * k)} spin={pour / 5 + i} s={0.8} />;
        })}
        <NearDock f={g} y={1580} seed={12} />
      </SVG>
    </Frame>
  );
};

// ---- S13: who signs (keys 39, 48, 56, 40, 41) ------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t39 = b(39), t48 = b(48), t56 = b(56), t40 = b(40), t41 = b(41);
  const turn = easeIO(f, t39, 26);
  const dip = bump(f, t48, 20);
  const rs = 0.95, rx = 250;
  const hand = reelHand(1, rs, rx, 1290);
  const penRot = lerp(60, -76, turn);
  const nib = {x: hand.x + lerp(-74, 76, turn) * 0.9, y: hand.y + 43 * 0.9 + dip * 18 + 5 * Math.sin(g / 8)};
  const hands = lerp(0.16, 0.34, ease(f, t56, 120));
  const cam = track([{t: 0, z: 1.12, fx: 520, fy: 1060}, {t: t41, z: 1.02, fx: 550, fy: 1040}, {t: p.dur, z: 1.0, fx: 540, fy: 1060}]);
  return (
    <Frame p={p} cam={cam} bloom={0.08}
      overlay={<>
        <Plate p={win(f, t39 + 4, t48 - 2)} text="THE CABLE DOESN'T NEED AI" displayLines={["THE CABLE", "DOESN'T NEED AI"]} y={580} size={38} tone="ink" />
        <Plate p={win(f, t48 + 2, t56 + 20)} text="ANYONE WHO WANTS IN HAS TO SIGN" displayLines={['ANYONE WHO WANTS', 'IN HAS TO SIGN']} y={700} size={36} tone="ink" />
        <Plate p={win(f, t56 + 2, t40 + 20)} text="WHICH COMES FIRST?" y={830} size={36} tone="cream" />
        <Plate p={win(f, t40 + 4, t41 + 200)} text="A SIGNED CUSTOMER" y={910} size={34} tone="ink" />
        <Plate p={win(f, t41 + 4, t41 + 200)} text="DEC 31ST, 2028" y={990} size={34} tone="cream" />
      </>}>
      <SVG>
        <DockBG f={g} id="s13" sun={1} />
        <Vault x={880} y={1290} s={0.8} f={g} lit={1} id="s13v" />
        <Easel x={560} y={1290} s={0.78} f={g} id="s13e" head={false} sigPulse={f > t40 - 4 ? 0.5 + 0.5 * Math.sin(g / 5) : 0} />
        <Clock x={760} y={1290} s={0.5} f={g} hand={hands} wedge={1} id="s13c" chime={bump(f, t41, 30)} />
        <Reel x={rx} y={1290} s={rs} f={g} mood="firm" look={4} raise={1} tail={1} phase={0.3} id="s13r" crank={0} />
        <Pen x={nib.x} y={nib.y} s={0.9} rot={penRot} f={g} />
        <DataBox x={880} y={1300} s={0.8} f={g} mood="hope" look={-5} phase={0.5} id="s13b0" hop={dip * 0.4} />
        <DataBox x={990} y={1306} s={0.8} f={g} faceless mood="blank" phase={1.5} id="s13b1" />
        {f > t56 && f < t40 && <g transform={`translate(${nib.x + 40},${nib.y - 200 + 6 * Math.sin(g / 7)})`}><text textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={110} fill={P.cream} stroke={INK} strokeWidth={5} paintOrder="stroke">?</text></g>}
        <NearDock f={g} y={1580} seed={13} />
      </SVG>
    </Frame>
  );
};

// ---- the episode -------------------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={P.lilac} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={P.navy}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'THE UNSIGNED LINE', 2: 'THE RESOLUTION', 3: 'THE MISSING WORD', 4: 'FOUR CABLES', 5: 'A DATA CUL-DE-SAC', 6: 'THE CLOCK', 7: 'THE LINE FORMS', 8: 'SEC. 9', 9: 'THE FAIR CASE', 10: 'THE CEILING', 11: 'THE WORD', 12: 'WITHOUT AI', 13: 'WHO SIGNS'};
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

export const ep1027Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1027Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1027: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 7.44, 21.88, 30.48, 41.5, 52.5, 62.28, 70.74, 83.02, 89.9, 97.32, 105.78, 119.18, 130.3].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1E2340" ink="#F4EEDC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
