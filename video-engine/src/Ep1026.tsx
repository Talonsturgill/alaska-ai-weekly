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
import {BAL, BallotBox, Slip, Rails, Lectern, Gate, InTray, BillSheet} from './lib/ballot';
import {IDS} from './Ep1026Ids';

// Not Yes or No, 2026-10-26. Palette roles are art_direction.json. The BALLOT BOX (a tall upright steel box with a slanted hinged lid and a face) is the hero and the SLIP is the throughline: a YES / NO slip whose boxes
// melt ONCE (S1) into three rails SIZE / PLACE / WHO PAYS, goes face down into an IN tray, flips to SENATE 14 TO 5, and ends as a blank FIRST RULE UNWRITTEN sheet. The hero reacts to the slip, to SIZE and to the grid, never to a
// candidate or a side. A pause is a padlocked gate with a key, never a wall. Aurora green (P.aurora) is electricity only. Brick red (P.brick) is the seal ribbon and curtains only. Candidates are faceless lecterns.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const SERIF = 'Fraunces, Georgia, serif';
const P = {
  sage: BAL.sage, sageDeep: '#9DB6A2', sageHi: '#DCE9DE', maple: '#E3C183', mapleDeep: '#C79A52', mapleHi: '#F2D9A4', brick: BAL.cranberry, brickDeep: '#6E2418', brickHi: '#C96A52',
  ink: INK, inkBlue: BAL.navy, cream: BAL.cream, creamShade: BAL.creamShade, steel: BAL.steel, steelHi: BAL.steelHi, honey: BAL.honey, wood: BAL.wood, woodHi: BAL.woodHi, woodShade: BAL.woodShade,
  aurora: BAL.aurora, dusk: BAL.dusk, duskDeep: '#262A47', duskHi: '#6A6F9A', sky: '#DCE9EE', slate: '#4A5A63', slateHi: '#7E8E97', paper: '#F4EEDC',
};
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
  ink: {fill: '#1E2B4D', fg: P.cream},
  cream: {fill: P.cream, fg: '#1E2B4D'},
  wood: {fill: '#C99A62', fg: '#1E2B4D'},
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

// ---- shared pieces --------------------------------------------------------------------------------------------------------------------------
/** an inked block with a form gradient and a top highlight */
const Blk: React.FC<{x: number; y: number; w: number; h: number; c: string; id: string; r?: number; sw?: number}> = ({x, y, w, h, c, id, r = 8, sw = 5}) => (
  <g>
    <defs><FormGradient id={id} t={tones(c)} /></defs>
    <rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id})`} stroke={INK} strokeWidth={sw} />
    <rect x={x + 5} y={y + 4} width={Math.max(0, w - 10)} height={Math.max(3, Math.min(8, h * 0.1))} rx={3} fill="#fff" opacity={0.28} />
  </g>
);

/** brick curtain panels that part (open 0..1) */
const Curtains: React.FC<{open: number; id?: string}> = ({open, id = 'cu'}) => {
  const o = clamp01(open);
  if (o >= 0.995) return null;
  const half = 560 * (1 - o);
  const folds = (side: number) => Array.from({length: 7}).map((_, i) => {
    const x = side < 0 ? i * (half / 7) : 1080 - i * (half / 7);
    return <path key={i} d={`M${x},0 Q${x + side * 14},960 ${x},1920`} stroke={P.brickDeep} strokeWidth={9} fill="none" opacity={0.55} />;
  });
  return (
    <g data-band="ok">
      <defs><FormGradient id={id} t={tones(P.brick)} /></defs>
      <rect data-band="ok" x={-30} y={-20} width={half + 30} height={1960} fill={`url(#${id})`} stroke={INK} strokeWidth={6} />
      <rect data-band="ok" x={1080 - half} y={-20} width={half + 30} height={1960} fill={`url(#${id})`} stroke={INK} strokeWidth={6} />
      {folds(-1)}{folds(1)}
      <rect x={-30} y={-20} width={1140} height={34} fill={P.brickDeep} stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** the polling hall: sage wall, clerestory windows (never green), a maple floor with planks, a baseboard, parallax drift. dusk 0..1 turns the windows slate-violet. */
const Hall: React.FC<{f: number; id: string; dusk?: number; floorY?: number; wall?: boolean}> = ({f, id, dusk = 0, floorY = 1180, wall = true}) => {
  const mix = (a: string, b: string, t: number) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const wallC = mix(P.sage, '#7E8F86', dusk * 0.7);
  const winC = mix(P.sky, P.dusk, dusk);
  const drift = 20 * Math.sin(f / 70);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}_w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix(wallC, '#FFFFFF', 0.15)} /><stop offset="1" stopColor={wallC} /></linearGradient>
        <linearGradient id={`${id}_f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix(P.maple, '#7A6A55', dusk * 0.6)} /><stop offset="1" stopColor={mix(P.mapleDeep, '#4A3F36', dusk * 0.6)} /></linearGradient>
      </defs>
      {wall && <rect x={0} y={0} width={W} height={floorY + 20} fill={`url(#${id}_w)`} />}
      {/* clerestory windows near the top, drifting slowly (far layer) */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${60 + i * 270 + drift * 0.5},120)`}>
          <rect x={0} y={0} width={210} height={330} rx={14} fill={winC} stroke={INK} strokeWidth={7} />
          <rect x={10} y={10} width={190} height={310} rx={8} fill="none" stroke="#fff" strokeWidth={3} opacity={0.5} />
          <path d="M105,0 L105,330 M0,165 L210,165" stroke={INK} strokeWidth={5} />
          {dusk > 0.2 && <circle cx={150} cy={90} r={5} fill="#fff" opacity={0.6 * dusk} />}
        </g>
      ))}
      {Array.from({length: 9}).map((_, i) => <rect key={i} x={i * 140 + 20} y={470} width={100} height={Math.max(0, floorY - 520)} rx={8} fill="none" stroke={INK} strokeWidth={3} opacity={0.12} />)}
      <path d={`M-20,470 Q 270,${520 + 10 * Math.sin(f / 40)} 540,476 T 1100,470`} fill="none" stroke={INK} strokeWidth={5} />
      {Array.from({length: 14}).map((_, i) => {
        const bx = 20 + i * 80, by = 478 + 24 * Math.sin((i / 13) * Math.PI) * 0.9 + (i % 2) * 2;
        return <path key={i} d={`M ${bx - 22},${by} L ${bx + 22},${by} L ${bx},${by + 50 + 4 * Math.sin(f / 15 + i)} Z`} fill={[BAL.cream, BAL.honey, BAL.steelHi][i % 3]} stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
      })}
      <rect x={0} y={floorY - 36} width={W} height={56} fill={mix(P.sageDeep, '#4F5D56', dusk * 0.6)} stroke={INK} strokeWidth={5} />
      <rect x={0} y={floorY + 20} width={W} height={H - floorY} fill={`url(#${id}_f)`} />
      {Array.from({length: 12}).map((_, i) => <path key={i} d={`M${-100 + i * 150},${floorY + 20} L${-400 + i * 260},${H}`} stroke={INK} strokeWidth={2.4} opacity={0.18} />)}
      {Array.from({length: 7}).map((_, i) => <line key={i} x1={0} y1={floorY + 60 + i * i * 14} x2={W} y2={floorY + 60 + i * i * 14} stroke={INK} strokeWidth={2.2} opacity={0.15} />)}
    </g>
  );
};

/** a near-plane rail and floor planks under the caption card so the lower third is a stage. kind: chairs (varied row, some empty, a spotlight pool), spruce (dark foreground trees on a snow bank, for the dusk shots), bare. */
const NearRail: React.FC<{f: number; y?: number; dusk?: number; kind?: 'chairs' | 'spruce' | 'bare'; seed?: number}> = ({f, y = 1560, dusk = 0, kind = 'chairs', seed = 1}) => (
  <g data-band="ok" opacity={1 - dusk * 0.1}>
    {kind === 'spruce' ? (
      <g>
        <rect data-band="ok" x={-40} y={y + 20} width={W + 80} height={H - y} fill="#2B3050" stroke={INK} strokeWidth={5} />
        <path d={`M -40,${y + 30} Q 270,${y - 10} 540,${y + 24} T 1120,${y + 20} L 1120,${y + 80} L -40,${y + 80} Z`} fill="#E6ECF4" stroke={INK} strokeWidth={5} />
        {Array.from({length: 9}).map((_, i) => {
          const tx = 40 + i * 125 + 30 * rnd(i + seed * 7), th = 150 + 150 * rnd(i + seed * 3 + 5);
          return (
            <g key={i} transform={`translate(${tx},${y + 120}) rotate(${1.4 * Math.sin(f / 40 + i)})`}>
              <path d={`M 0,${-th} L 46,-30 L 18,-30 L 62,60 L -62,60 L -18,-30 L -46,-30 Z`} fill="#141A33" stroke={INK} strokeWidth={4} />
              <path d={`M 0,${-th + 8} L 20,${-th + 70} L 0,${-th + 62} Z`} fill="#3A4570" opacity={0.7} />
            </g>
          );
        })}
      </g>
    ) : (
      <g>
        <rect data-band="ok" x={-40} y={y + 80} width={W + 80} height={H - y} fill={P.mapleDeep} stroke={INK} strokeWidth={5} />
        <rect x={-40} y={y} width={W + 80} height={26} rx={6} fill={P.woodHi} stroke={INK} strokeWidth={5} />
        {Array.from({length: 9}).map((_, i) => <rect key={i} x={20 + i * 130 + 6 * Math.sin(f / 60)} y={y + 26} width={22} height={54} rx={5} fill={P.wood} stroke={INK} strokeWidth={4} />)}
        <rect x={-40} y={y - 6} width={W + 80} height={8} fill="#fff" opacity={0.25} />
        {kind === 'chairs' && (
          <g>
            <ellipse cx={200 + 600 * rnd(seed + 40)} cy={y + 250} rx={330} ry={110} fill="#fff" opacity={0.12} />
            {Array.from({length: 5}).map((_, i) => {
              if (rnd(i + seed * 11) < 0.22) return null;
              const hh = 90 + 60 * rnd(i + seed * 5 + 2);
              return (
                <g key={i} transform={`translate(${60 + i * 230 + 6 * Math.sin(f / 50 + i)},${y + 160 + 70 * rnd(i + seed * 13)})`}>
                  <rect x={-70} y={0} width={140} height={hh} rx={12} fill="#2A3556" stroke={INK} strokeWidth={6} />
                  <rect x={-56} y={12} width={112} height={18} rx={6} fill="#4A5A88" opacity={0.7} />
                  {[-52, 52].map((cx) => <rect key={cx} x={cx - 7} y={hh - 4} width={14} height={110} fill="#1B2440" stroke={INK} strokeWidth={4} />)}
                </g>
              );
            })}
          </g>
        )}
      </g>
    )}
  </g>
);

/** a mail slot desk edge etc: small coin */
const Coin: React.FC<{x: number; y: number; s?: number; spin?: number}> = ({x, y, s = 1, spin = 0}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={18 * Math.abs(Math.cos(spin))} ry={18} fill={P.honey} stroke={INK} strokeWidth={4} />
    <ellipse cx={0} cy={0} rx={9 * Math.abs(Math.cos(spin))} ry={9} fill="none" stroke={BAL.honeyShade} strokeWidth={3} />
  </g>
);

/** a plain building. kind 'shed' is low and small, 'hall' is long and vast. No face, no slot, no seal. */
const Building: React.FC<{x: number; y: number; w: number; h: number; id: string; windows?: number; lit?: number; kind?: 'shed' | 'hall'; f: number; plug?: number}> = ({x, y, w, h, id, windows = 4, lit = 1, kind = 'shed', f, plug = 0}) => (
  <g transform={`translate(${x},${y})`}>
    <ContactShadow cx={w / 2} cy={4} rx={w * 0.55} ry={12} opacity={0.34} blur={8} />
    <Blk x={0} y={-h} w={w} h={h} c={kind === 'hall' ? '#6F7C86' : '#B08A5A'} id={id} r={6} sw={6} />
    {kind === 'hall' && <rect x={-6} y={-h - 18} width={w + 12} height={26} rx={5} fill="#4A5A63" stroke={INK} strokeWidth={5} />}
    {kind === 'shed' && <path d={`M -10,${-h} L ${w / 2},${-h - 48} L ${w + 10},${-h} Z`} fill="#8A5A3B" stroke={INK} strokeWidth={6} strokeLinejoin="round" />}
    {Array.from({length: windows}).map((_, i) => {
      const ww = (w - 40) / windows;
      return <rect key={i} x={20 + i * ww + 4} y={-h + (kind === 'hall' ? 36 : 28)} width={ww - 12} height={kind === 'hall' ? 34 : 30} rx={4} fill="#F2D9A4" opacity={0.35 + 0.5 * lit * (0.8 + 0.2 * Math.sin(f / 7 + i * 2))} stroke={INK} strokeWidth={3.4} />;
    })}
    <rect x={w / 2 - 26} y={-64} width={52} height={64} rx={5} fill="#3D4652" stroke={INK} strokeWidth={5} />
    {/* an outlet box on the wall for the cord */}
    <rect x={w - 36} y={-52} width={26} height={30} rx={4} fill={P.cream} stroke={INK} strokeWidth={4} />
    <circle cx={w - 23} cy={-42} r={3} fill={INK} /><circle cx={w - 23} cy={-32} r={3} fill={INK} />
    {plug > 0.5 && <circle cx={w - 23} cy={-37} r={22 + 6 * Math.sin(f / 3)} fill={P.aurora} opacity={0.3 * (plug - 0.4)} />}
  </g>
);

/** the power pole. sag 0..1 droops the line, lamp 0..1 lights the alert lamp (green is electricity only). */
const Pole: React.FC<{x: number; y: number; s?: number; sag?: number; lamp?: number; f: number; id: string; reach?: number}> = ({x, y, s = 1, sag = 0, lamp = 0, f, id, reach = 520}) => {
  const sg = 40 + sag * 150 + 7 * Math.sin(f / 13) + 4 * Math.sin(f / 7.3);
  const flick = lamp > 0.05 ? 0.5 + 0.5 * Math.sin(f / 2.2) : 0;
  return (
    <g transform={`translate(${x},${y}) rotate(${0.8 * Math.sin(f / 33)}) scale(${s})`}>
      <ContactShadow cx={0} cy={4} rx={70} ry={11} opacity={0.34} blur={8} />
      <Blk x={-17} y={-620} w={34} h={620} c={P.wood} id={id} r={6} sw={6} />
      <Blk x={-120} y={-600} w={240} h={26} c={P.woodHi} id={`${id}x`} r={6} sw={5} />
      <path d={`M ${-reach},${-580 + 20} Q ${-reach / 2},${-580 + sg} -100,-585 M 100,-585 Q ${reach / 2},${-580 + sg} ${reach},${-580 + 20}`} fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <path d={`M ${-reach},${-580 + 20} Q ${-reach / 2},${-580 + sg} -100,-585 M 100,-585 Q ${reach / 2},${-580 + sg} ${reach},${-580 + 20}`} fill="none" stroke={P.aurora} strokeWidth={5} strokeLinecap="round" />
      {[-100, 100].map((sx) => <circle key={sx} cx={sx} cy={-585} r={11} fill={P.cream} stroke={INK} strokeWidth={4.4} />)}
      <g transform="translate(0,-470)">
        <rect x={-34} y={-30} width={68} height={60} rx={10} fill="#3D4652" stroke={INK} strokeWidth={5.4} />
        <circle cx={0} cy={0} r={20} fill={lamp > 0.05 ? '#F2A33B' : '#6B7F70'} opacity={0.5 + 0.5 * lamp * (0.5 + 0.5 * flick)} stroke={INK} strokeWidth={4} />
        {lamp > 0.05 && <circle cx={0} cy={0} r={60 + 30 * flick} fill="#F2A33B" opacity={0.18 * lamp} />}
      </g>
    </g>
  );
};

// ---- S1: the slip (keys 1, 2, 3, 4) ---------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t1 = b(1), t2 = b(2), t3 = b(3), t4 = b(4);
  const spit = ease(f, t1, 14);
  const melt = easeIO(f, t3, 56);
  const mouth = Math.max(bump(f, t1, 26), 0) * 1.3;
  const swing = f < t2 ? 0 : f < t2 + 40 ? Math.sin((f - t2) / 6) * (1 - (f - t2) / 40) * 78 : 0;
  const penOn = f >= t2 - 2 && f < t3 + 6;
  const mood = f < t2 ? 'blank' : f < t3 ? 'sweat' : f < t4 ? 'worried' : 'ask';
  const rail = ease(f, t4 - 2, 30);
  const vals: [number, number, number] = [0.3 + 0.04 * Math.sin(g / 21), 0.68 + 0.04 * Math.sin(g / 17 + 1), 0.5 + 0.05 * Math.sin(g / 19 + 2)];
  const sx = lerp(468, 700, spit), sy = lerp(1150, 900, spit);
  const sc = lerp(0.2, 0.86, Math.min(1, spit * 1.15)) * (1 + 0.1 * Math.sin(spit * Math.PI));
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1080}, {t: p.dur, z: 1.1, fx: 580, fy: 1010}]);
  return (
    <Frame p={p} cam={cam} bloom={0.05}
      overlay={<>
        <Plate x={540} text="VOTING OPEN · ELECTION DAY NOVEMBER 3RD" displayLines={['VOTING OPEN', 'ELECTION DAY NOVEMBER 3RD']} y={640} size={36} tone="ink" p={ease(f, t4, 8)} />
      </>}>
      <SVG>
        <Hall f={g} id="s1" floorY={1180} />
        <NearRail f={g} y={1580} seed={1} />
        <g transform="translate(0,0)">
          <Slip x={sx} y={sy} s={sc} f={g} melt={melt} rot={-4} vals={vals} pulse={[rail > 0.9 ? bump(f, t4 + 6, 20) : 0, 0, 0]} penAt={penOn ? 250 : undefined} id="s1sl" head="DATA CENTERS?" />
        </g>
        <BallotBox x={330} y={1300} s={1.28} f={g} mood={mood as 'blank'} mouth={mouth} flagDroop={f > t3 && f < t4 ? 0.7 : 0} look={f < t2 ? 4 : 5} phase={0.3} id="s1b" />
      </SVG>
    </Frame>
  );
};

// ---- S2: twelve lecterns (keys 5, 6, 7, 8, 9) ----------------------------------------------------------------------------------------------
const LecternRows: React.FC<{f: number; litAt: number; nodAt: number; id: string; spread?: number; signAt?: number; lateTwo?: boolean}> = ({f, litAt, nodAt, id, spread = 0, signAt, lateTwo = false}) => (
  <g>
    {Array.from({length: 12}).map((_, i) => {
      const row = i < 6 ? 0 : 1;
      const col = i % 6;
      const x0 = 200 + col * 140 + (row ? 70 : 0);
      const y0 = row ? 1330 : 1190;
      const sc = row ? 0.85 : 0.72;
      const nod = f > nodAt ? Math.max(0, Math.sin(((f - nodAt - (i === 4 || i === 9 ? 10 : 0)) / 7)) ) * ease(f, nodAt, 4) * (1 - ease(f, nodAt + 28, 12)) : 0;
      const sg = signAt === undefined || !row ? 0 : ease(f, signAt + ((lateTwo && (i === 2 || i === 8)) ? 18 : (i % 4)), 10);
      return (
        <g key={i} transform={`translate(${(x0 < 540 ? -1 : 1) * spread * (60 + rnd(i + 5) * 150) * (x0 > 380 && x0 < 700 ? 1.6 : 1)},${spread * (rnd(i + 11) - 0.5) * 30})`}>
          <Lectern x={x0} y={y0} s={sc} f={f} lit={ease(f, litAt + i * 4, 6)} card="" phase={i * 1.7} hop={nod * 0.12} id={`${id}${i}`} />
          {sg > 0.02 && (
            <g transform={`translate(${x0 - 4 * sc},${y0 - (300 + 40 * sg) * sc}) scale(${sc * 1.2 * sg})`}>
              <rect x={-3} y={0} width={6} height={52} fill={P.creamShade} stroke={INK} strokeWidth={3.4} />
              <rect x={-68} y={-26} width={136} height={30} rx={4} fill={P.cream} stroke={INK} strokeWidth={4} />
              <text x={0} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={11} fill={INK}>RULES + LOCAL</text>
            </g>
          )}
        </g>
      );
    })}
  </g>
);

const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t5 = b(5), t6 = b(6), t7 = b(7), t8 = b(8), t9 = b(9);
  const open = ease(f, 0, 22);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1060}, {t: p.dur, z: 1.05, fx: 560, fy: 1050}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="FAIRBANKS-AREA FORUM" y={520} size={34} tone="cream" p={ease(f, t5 + 4, 8)} />
        <Plate x={540} text="12 FAIRBANKS-AREA CANDIDATES · RULES + LOCAL INPUT" displayLines={['12 FAIRBANKS-AREA CANDIDATES', 'RULES + LOCAL INPUT']} y={620} size={32} tone="ink" p={ease(f, t6, 8)} />
        <Plate x={540} text="GENERALLY AGREED" y={740} size={34} tone="cream" p={ease(f, t7, 8) * (1 - ease(f, t8 + 20, 8))} />
        <Plate x={540} text="PER THE FAIRBANKS DAILY NEWS-MINER" displayLines={['PER THE FAIRBANKS DAILY NEWS-MINER']} y={820} size={28} tone="cream" p={ease(f, t9, 8)} />
        <Curtains open={open} id="s2c" />
      </>}>
      <SVG>
        <Hall f={g} id="s2" floorY={1060} />
        <rect data-band="ok" x={0} y={1060} width={W} height={380} fill={P.wood} stroke={INK} strokeWidth={6} />
        {Array.from({length: 6}).map((_, i) => <line key={i} x1={0} y1={1100 + i * 60} x2={W} y2={1100 + i * 60} stroke={P.woodShade} strokeWidth={3} opacity={0.5} />)}
        <LecternRows f={g} litAt={t6} nodAt={t7} signAt={t8} lateTwo id="s2l" />
        <NearRail f={g} y={1520} seed={2} />
      </SVG>
    </Frame>
  );
};

// ---- S3: the slip in the tray (keys 10, 11) -------------------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t10 = b(10), t11 = b(11);
  const fly = easeIO(f, t10, 26);
  const land = ease(f, t10 + 24, 10);
  const slipX = lerp(-160, 540, fly);
  const slipY = lerp(640, 740, fly) + lerp(0, 215, land);
  const arm = ease(f, t11 - 8, 10) * (1 - ease(f, t11 + 6, 10));
  const slap = bump(f, t11 + 4, 18);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.12, fx: 560, fy: 1060}]);
  const landed = f > t10 + 30;
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="A BILL" y={560} size={40} tone="ink" p={ease(f, t10 + 20, 8)} />
        <Plate x={540} text="HOLD THAT THOUGHT" y={660} size={34} tone="cream" p={ease(f, t11, 8)} />
      </>}>
      <SVG>
        <Hall f={g} id="s3" floorY={1160} />
        <NearRail f={g} y={1560} kind="bare" />
        {/* the rail the slip rides on */}
        <rect x={-40} y={600} width={W + 80} height={22} rx={11} fill={P.inkBlue} stroke={INK} strokeWidth={5} />
        <rect x={-40} y={604} width={W + 80} height={5} rx={2} fill="#fff" opacity={0.2} />
        <InTray x={560} y={1270} s={1.5} f={g} lamp={0.4} tab={arm > 0.5 ? 0 : 1} id="s3t" dust={landed ? bump(f, t10 + 30, 30) : 0}>
          {landed && <BillSheet x={0} y={-190} s={0.55} rot={slap * 2} f={g} face={false} id="s3b" />}
        </InTray>
        {!landed && <Slip x={slipX} y={slipY} s={0.5} rot={lerp(-8, 14, fly)} f={g} melt={1} vals={[0.3, 0.68, 0.5]} id="s3s" />}
        <BallotBox x={170} y={1330} s={0.95} f={g} mood={arm > 0.4 ? 'ask' : 'blank'} look={5} phase={1.9} id="s3b2" />
        {arm > 0.02 && (
          <g>
            <path d={`M 250,1190 L ${lerp(250, 400, arm)},${lerp(1190, 1120, arm)}`} stroke={INK} strokeWidth={26} strokeLinecap="round" />
            <path d={`M 250,1190 L ${lerp(250, 400, arm)},${lerp(1190, 1120, arm)}`} stroke={P.steel} strokeWidth={15} strokeLinecap="round" />
            <circle cx={lerp(250, 400, arm)} cy={lerp(1190, 1120, arm)} r={19} fill={P.steelHi} stroke={INK} strokeWidth={5} />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S4: then they split, the padlocked gate (keys 12, 13, 14) -------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t12 = b(12), t13 = b(13), t14 = b(14);
  const spread = ease(f, t12, 26);
  const haul = easeIO(f, t13 - 6, 36);
  const key = ease(f, t14 - 6, 22);
  const gx = lerp(1500, 660, haul);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1060}, {t: p.dur, z: 1.08, fx: 600, fy: 1100}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="THEN THEY SPLIT" y={520} size={40} tone="ink" p={ease(f, t12, 8) * (1 - ease(f, t13 + 40, 8))} />
        <Plate x={540} text="3 BACK A STATE MORATORIUM" y={620} size={34} tone="ink" p={ease(f, t13, 8)} />
        <Plate x={540} text="UNTIL ALASKA CAN STUDY IT" y={720} size={34} tone="cream" p={ease(f, t14, 8)} />
      </>}>
      <SVG>
        <Hall f={g} id="s4" floorY={1060} />
        <rect data-band="ok" x={0} y={1060} width={W} height={380} fill={P.wood} stroke={INK} strokeWidth={6} />
        {Array.from({length: 6}).map((_, i) => <line key={i} x1={0} y1={1100 + i * 60} x2={W} y2={1100 + i * 60} stroke={P.woodShade} strokeWidth={3} opacity={0.5} />)}
        <LecternRows f={g} litAt={-999} nodAt={9999} spread={spread} id="s4l" />
        {/* the three haulers lean into the gate */}
        {[0, 1, 2].map((i) => (
          <g key={i}><Lectern x={gx - 270 + i * 66} y={1350 - i * 12} s={0.74} f={g} lit={1} card="" phase={i * 2.1} id={`s4h${i}`} hop={0} /></g>
        ))}
        <Gate x={gx} y={1390} s={1.2} f={g} keyLabel="STUDY" keyK={key * 0.78} open={0} id="s4g" keyShow={ease(f, t14 - 10, 8)} />
        <NearRail f={g} y={1540} seed={4} />
      </SVG>
    </Frame>
  );
};

// ---- S5: who pays (keys 15, 16, 17, 18) -------------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t15 = b(15), t16 = b(16), t17 = b(17), t18 = b(18);
  const knob = lerp(0.5, 0.92, ease(f, t16, 14));
  const drawer = ease(f, t16, 10);
  const env = ease(f, t17, 20);
  const pour = clamp01((f - t18) / 70);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1010}, {t: p.dur, z: 1.1, fx: 540, fy: 1090}]);
  const slotX = (i: number) => 720 + i * 52;
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="RENTZEL · SOME SORT OF TAX" y={540} size={32} tone="ink" p={ease(f, t15, 8)} />
        <Plate x={540} text="MOORE" y={640} size={32} tone="cream" p={ease(f, t17, 8)} />
        <Plate x={540} text="COULD PAY A DIGITAL DIVIDEND" y={740} size={30} tone="ink" p={ease(f, t18, 8)} />
      </>}>
      <SVG>
        <Hall f={g} id="s5" floorY={1000} />
        <rect data-band="ok" x={-40} y={1000} width={W + 80} height={420} fill={P.woodHi} stroke={INK} strokeWidth={7} />
        {Array.from({length: 7}).map((_, i) => <line key={i} x1={0} y1={1040 + i * 56} x2={W} y2={1040 + i * 56} stroke={P.woodShade} strokeWidth={3} opacity={0.45} />)}
        <Rails x={540} y={820} s={1.15} f={g} vals={[0.5, 0.5, knob]} labels={['SIZE', 'PLACE', 'WHO PAYS']} onlyIdx={2} w={560} pulse={[0, 0, bump(f, t16, 20)]} />
        {/* the cash register */}
        <g transform="translate(250,1230)" opacity={1 - 0.55 * ease(f, t17, 10)}>
          <ContactShadow cx={0} cy={4} rx={170} ry={14} opacity={0.34} blur={8} />
          <Blk x={-150} y={-170} w={300} h={170} c="#7E5B2E" id="s5r" r={12} sw={7} />
          <rect x={-110} y={-250} width={220} height={90} rx={10} fill={P.cream} stroke={INK} strokeWidth={6} />
          <text x={0} y={-188} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={42} fill={INK}>{f > t16 ? 'TAX' : ''}</text>
          {[0, 1, 2, 3].map((i) => [0, 1].map((j) => <rect key={`${i}${j}`} x={-120 + i * 60} y={-140 + j * 40} width={46} height={28} rx={5} fill={P.honey} stroke={INK} strokeWidth={4} />))}
          <rect x={-130} y={-30 + 36 * drawer} width={260} height={42} rx={7} fill="#4A3216" stroke={INK} strokeWidth={6} />
          {drawer > 0.2 && Array.from({length: 4}).map((_, i) => <Coin key={i} x={-90 + i * 56} y={-12 + 36 * drawer} s={0.8} />)}
        </g>
        {/* the envelope */}
        <g transform={`translate(${lerp(1300, 800, env)},1190) rotate(${-8 + 8 * env})`}>
          <ContactShadow cx={0} cy={72} rx={150} ry={12} opacity={0.3} blur={8} />
          <rect x={-150} y={-70} width={300} height={170} rx={10} fill={P.cream} stroke={INK} strokeWidth={7} />
          <path d={`M -150,-70 L 0,${20 - 90 * env} L 150,-70`} fill={P.creamShade} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <text x={0} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={INK}>EVERY ALASKAN</text>
        </g>
        {/* a row of identical mail slots along the desk front */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <g key={i} transform={`translate(${slotX(i) - 130},1400)`}>
            <rect x={-26} y={-18} width={52} height={30} rx={5} fill={P.cream} stroke={INK} strokeWidth={4.4} />
            <rect x={-16} y={-8} width={32} height={8} rx={3} fill={INK} />
          </g>
        ))}
        {pour > 0 && Array.from({length: 8}).map((_, i) => {
          const k = clamp01(pour * 1.6 - i * 0.12);
          const kk = Math.min(k, 0.78);
          return k > 0 ? <g key={i} opacity={0.75}><circle cx={lerp(800 + i * 4, slotX(i) - 130, kk)} cy={lerp(1170, 1320, kk * kk) - 120 * Math.sin(kk * Math.PI)} r={17} fill="none" stroke={INK} strokeWidth={4.4} strokeDasharray="7 6" /></g> : null;
        })}
        <NearRail f={g} y={1570} kind="bare" />
      </SVG>
    </Frame>
  );
};

// ---- S6: shed or hall on a painted map (keys 19, 20, 21, 22) ----------------------------------------------------------------------------------
const AK_PATH = 'M 880,70 L 800,50 L 730,40 L 660,52 L 590,38 L 520,56 L 470,26 L 425,45 L 395,95 L 340,128 L 300,118 L 255,150 L 205,168 L 190,150 L 215,205 L 270,222 L 245,270 L 205,315 L 185,372 L 212,425 L 262,455 L 300,478 L 262,505 L 205,545 L 130,575 L 70,605 L 25,625 L 12,650 L 75,628 L 150,600 L 232,568 L 305,528 L 360,505 L 425,492 L 470,470 L 492,432 L 520,398 L 540,440 L 560,478 L 620,500 L 700,470 L 745,448 L 800,468 L 860,520 L 905,572 L 950,632 L 990,700 L 945,688 L 900,640 L 868,590 L 880,540 L 890,300 Z';
const MapLand: React.FC<{id: string; f: number}> = ({id, f}) => (
  <g>
    <defs>
      <FormGradient id={id} t={tones('#B9A56E')} />
      <clipPath id={`${id}c`}><path d={AK_PATH} /></clipPath>
    </defs>
    <path d={AK_PATH} fill="#000" opacity={0.2} transform="translate(14,18)" />
    <path d={AK_PATH} fill={`url(#${id})`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <g clipPath={`url(#${id}c)`}>
      <path d="M 330,150 Q 520,100 800,118" fill="none" stroke="#7E6F3D" strokeWidth={26} opacity={0.5} strokeLinecap="round" />
      <path d="M 300,330 Q 470,250 700,360 Q 760,380 800,440" fill="none" stroke="#7E6F3D" strokeWidth={22} opacity={0.45} strokeLinecap="round" />
      <path d="M 260,230 Q 330,300 300,420 M 560,200 Q 600,280 560,360 M 700,160 Q 740,240 780,300" fill="none" stroke="#5E88A8" strokeWidth={7} opacity={0.7} strokeLinecap="round" />
      {Array.from({length: 22}).map((_, i) => <path key={i} d={`M ${250 + (i * 83) % 600},${200 + (i * 57) % 260} l 11,-28 l 11,28 Z`} fill="#4F6F58" stroke={INK} strokeWidth={3} />)}
      {/* cloud shadows drifting across the land */}
      {[0, 1, 2].map((i) => <ellipse key={i} cx={((f * (0.9 + i * 0.3) + i * 380) % 1300) - 150} cy={170 + i * 150} rx={170} ry={46} fill="#233" opacity={0.12} />)}
    </g>
    <path d={AK_PATH} fill="none" stroke="#fff" strokeWidth={5} opacity={0.25} transform="translate(-4,-4)" />
  </g>
);

const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t19 = b(19), t20 = b(20), t21 = b(21), t22 = b(22);
  const unroll = ease(f, 0, 26);
  const shed = ease(f, t20, 14);
  const roll = easeIO(f, t21, 44);
  const SP = {x: 40 + 495, y: 560 + 430}, NP = {x: 40 + 600, y: 560 + 70};
  const hx = lerp(SP.x, NP.x, roll), hy = lerp(SP.y, NP.y, roll);
  const cam = track([{t: 0, z: 1.2, fx: 540, fy: 1150}, {t: t21 + 10, z: 1.1, fx: 580, fy: 960}, {t: t22 + 36, z: 1.0, fx: 540, fy: 940}, {t: p.dur, z: 1.0, fx: 540, fy: 940}]);
  const cord = ease(f, t22 - 6, 14);
  const cs = 34 * Math.sin(g / 14);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="SOUTH ANCHORAGE · HOUSE RACE" y={520} size={30} tone="cream" p={ease(f, t19 + 4, 8)} />
        <Plate x={540} text="HOLLAND · MODEST · PURPOSE-BUILT" y={600} size={30} tone="ink" p={ease(f, t20, 8) * (1 - ease(f, t21 + 30, 8))} />
        <Plate x={540} text="BOYLE · OPEN TO LARGE" y={680} size={32} tone="ink" p={ease(f, t21, 8)} />
        <Plate x={540} text="NORTH SLOPE" y={760} size={34} tone="cream" p={ease(f, t22 + 10, 8)} />
      </>}>
      <SVG>
        <defs><linearGradient id="s6sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9EC3D3" /><stop offset="1" stopColor="#6F9DB4" /></linearGradient></defs>
        <rect data-band="ok" x={0} y={0} width={W} height={H} fill="url(#s6sea)" />
        {Array.from({length: 26}).map((_, i) => <path key={i} d={`M ${(i * 211) % 1100 - 40},${300 + (i * 173) % 1500} q 40,${10 * Math.sin(g / 20 + i)} 90,0`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.4} strokeLinecap="round" />)}
        <g transform={`translate(${(1 - unroll) * 760 + 40},540)`}><MapLand id="s6m" f={g} /></g>
        {/* a small ship crossing the Gulf */}
        <g transform={`translate(${((g * 1.4) % 1300) - 100},1330)`}><path d="M -26,0 L 26,0 L 18,14 L -18,14 Z" fill={P.cream} stroke={INK} strokeWidth={4} /><rect x={-8} y={-14} width={16} height={14} fill={P.steel} stroke={INK} strokeWidth={3.4} /></g>
        {/* the rail the hall rolls on: south pin to north pin */}
        <path d={`M ${SP.x},${SP.y} Q ${SP.x + 40},${(SP.y + NP.y) / 2} ${NP.x},${NP.y}`} stroke={INK} strokeWidth={20} fill="none" strokeLinecap="round" strokeDasharray="2 42" opacity={0.9} />
        <g transform={`translate(${SP.x},${SP.y})`}><circle r={17} fill={P.brick} stroke={INK} strokeWidth={5} /><circle r={26 + 6 * Math.sin(g / 9)} fill="none" stroke={P.brick} strokeWidth={3} opacity={0.5} /></g>
        <g transform={`translate(${NP.x},${NP.y})`}><circle r={17} fill={P.inkBlue} stroke={INK} strokeWidth={5} /><circle r={26 + 6 * Math.sin(g / 9 + 1)} fill="none" stroke={P.inkBlue} strokeWidth={3} opacity={0.5} /></g>
        {shed > 0.02 && <g transform={`translate(0,${(1 - shed) * -80})`} opacity={shed}><Building x={SP.x - 65} y={SP.y - 20} w={130} h={78} id="s6s" windows={2} kind="shed" f={g} /></g>}
        {roll > 0 && <Building x={hx - 120} y={hy + 40} w={240} h={96} id="s6h" windows={5} kind="hall" f={g} />}
        {/* the dangling cord from the top of the frame: planted for the pay at the shed */}
        {cord > 0.02 && (
          <g opacity={cord}>
            <rect x={186} y={440} width={130} height={34} rx={5} fill={P.cream} stroke={INK} strokeWidth={4} />
            <text x={251} y={463} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={1} fill={INK}>WHO PAYS</text>
            <path d={`M 251,474 Q ${290 + cs},700 ${240 + cs * 1.5},${960 + 14 * Math.sin(g / 9)}`} stroke={INK} strokeWidth={28} fill="none" strokeLinecap="round" />
            <path d={`M 251,474 Q ${290 + cs},700 ${240 + cs * 1.5},${960 + 14 * Math.sin(g / 9)}`} stroke={P.aurora} strokeWidth={15} fill="none" strokeLinecap="round" />
            <g transform={`translate(${240 + cs * 1.5},${976 + 14 * Math.sin(g / 9)})`}><rect x={-20} y={-12} width={40} height={30} rx={5} fill={P.creamShade} stroke={INK} strokeWidth={5} /><rect x={-12} y={16} width={7} height={22} fill={INK} /><rect x={6} y={16} width={7} height={22} fill={INK} /></g>
          </g>
        )}
        <NearRail f={g} y={1560} kind="bare" />
      </SVG>
    </Frame>
  );
};

// ---- S7: for governor (keys 23 to 27) ------------------------------------------------------------------------------------------------------------
/** a plain, UNMELTED YES / NO slip held at a lectern; tick 0..1 draws a firm tick in the YES box with a pen */
const MiniSlip: React.FC<{x: number; y: number; s?: number; f: number; tick: number; rot?: number; id: string}> = ({x, y, s = 1, f, tick, rot = -4, id}) => (
  <g transform={`translate(${x},${y + 3 * Math.sin(f / 18)}) rotate(${rot}) scale(${s})`}>
    <rect x={-95 + 8} y={-70 + 10} width={190} height={140} rx={8} fill="#000" opacity={0.26} />
    <Blk x={-95} y={-70} w={190} h={140} c={BAL.cream} id={id} r={8} sw={6} />
    <rect x={-80} y={-58} width={160} height={30} rx={4} fill={BAL.navy} stroke={INK} strokeWidth={3.4} />
    <text x={0} y={-36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} letterSpacing={1} fill={BAL.cream}>DATA CENTERS?</text>
    {[-1, 1].map((sx) => (
      <g key={sx} transform={`translate(${sx * 44},22)`}>
        <rect x={-34} y={-30} width={68} height={60} rx={6} fill={BAL.cream} stroke={INK} strokeWidth={4.6} />
        <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={sx < 0 ? 24 : 24} letterSpacing={1} fill={INK}>{sx < 0 ? 'YES' : 'NO'}</text>
      </g>
    ))}
    {tick > 0.02 && <path d="M -70,-1 L -58,9 L -38,-8" stroke={BAL.navy} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={60} strokeDashoffset={60 * (1 - clamp01(tick))} />}
    {tick > 0.02 && tick < 0.98 && (
      <g transform={`translate(${-22 + 40 * (1 - tick)},${0 - 90 * (1 - tick)}) rotate(24)`}>
        <rect x={-6} y={-70} width={12} height={110} rx={5} fill={BAL.navy} stroke={INK} strokeWidth={3.4} />
        <path d="M -6,40 L 0,58 L 6,40 Z" fill={BAL.creamShade} stroke={INK} strokeWidth={3} />
      </g>
    )}
  </g>
);

const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t24 = b(24), t25 = b(25), t26 = b(26), t27 = b(27);
  const open = ease(f, 0, 22);
  const cam = track([{t: 0, z: 1.05, fx: 540, fy: 1040}, {t: p.dur, z: 1.14, fx: 540, fy: 1060}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="FOR GOVERNOR · POSITIONS FROM SEPTEMBER" displayLines={['FOR GOVERNOR', 'POSITIONS FROM SEPTEMBER']} y={560} size={32} tone="cream" p={ease(f, 6, 8)} />
        <Plate x={540} text="BRONSON · BIG BELIEVER · SAID IN SEPTEMBER" displayLines={['BRONSON · BIG BELIEVER', 'SAID IN SEPTEMBER']} y={700} size={30} tone="ink" p={ease(f, t25, 8) * (1 - ease(f, t27 + 30, 8))} />
        <Plate x={540} text="TAYLOR · EMBRACE IT" y={820} size={32} tone="ink" p={ease(f, t27, 8)} />
        <Curtains open={open} id="s7c" />
      </>}>
      <SVG>
        <Hall f={g} id="s7" floorY={1120} />
        <rect data-band="ok" x={0} y={1120} width={W} height={330} fill={P.wood} stroke={INK} strokeWidth={6} />
        <Lectern x={300} y={1340} s={1.25} f={g} lit={ease(f, t24, 6)} card="BRONSON" cardSize={17} phase={0.4} id="s7a" />
        <Lectern x={790} y={1340} s={1.25} f={g} lit={ease(f, t26, 6)} card="TAYLOR" cardSize={17} phase={2.1} id="s7b" />
        <MiniSlip x={300} y={1065} s={1.0} f={g} tick={ease(f, t25, 14)} rot={-5} id="s7s1" />
        <MiniSlip x={790} y={1065} s={1.0} f={g} tick={ease(f, t27, 14)} rot={4} id="s7s2" />
        <BallotBox x={545} y={1340} s={0.5} f={g} mood="blank" look={0} phase={3.1} id="s7b0" />
        <NearRail f={g} y={1560} seed={7} />
      </SVG>
    </Frame>
  );
};

// ---- S8: a line at hyperscale (keys 28, 29, 52, 30) ---------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t28 = b(28), t29 = b(29), t52 = b(52), t30 = b(30);
  const slide = ease(f, 0, 22);
  const reach = easeIO(f, t52 - 6, 24);
  const slam = ease(f, t30, 8);
  const cardY = lerp(720, 1010, easeIO(f, t52 + 2, t30 - t52 + 2));
  const cam = track([{t: 0, z: 1.06, fx: 460, fy: 1040}, {t: p.dur, z: 1.14, fx: 600, fy: 1050}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="WILSON · SEPTEMBER" y={540} size={32} tone="cream" p={ease(f, t29, 8)} />
        <Plate x={540} text="NEVER LITTERED WITH HYPERSCALE" y={640} size={30} tone="ink" p={ease(f, t30, 8)} />
      </>}>
      <SVG>
        <Hall f={g} id="s8" floorY={1120} />
        <rect data-band="ok" x={0} y={1120} width={W} height={330} fill={P.wood} stroke={INK} strokeWidth={6} />
        <g transform={`translate(${lerp(500, 0, slide)},0)`}>
          <Building x={560} y={1340} w={460} h={300} id="s8h" windows={7} kind="hall" f={g} lit={0.8} />
          <Lectern x={250} y={1350} s={1.25} f={g} lit={ease(f, t29, 6)} card="WILSON" cardSize={17} phase={1.1} id="s8w" />
        </g>
        {/* her arm reaches up and pulls the limit card down to the roofline */}
        {reach > 0.01 && (
          <g>
            <path d={`M 290,1040 Q ${lerp(290, 520, reach)},${lerp(1040, 760, reach)} ${lerp(290, 760, reach)},${cardY - 30}`} stroke={INK} strokeWidth={30} strokeLinecap="round" fill="none" />
            <path d={`M 290,1040 Q ${lerp(290, 520, reach)},${lerp(1040, 760, reach)} ${lerp(290, 760, reach)},${cardY - 30}`} stroke={P.steel} strokeWidth={17} strokeLinecap="round" fill="none" />
            <circle cx={lerp(290, 760, reach)} cy={cardY - 30} r={20} fill={P.steelHi} stroke={INK} strokeWidth={5} />
          </g>
        )}
        <g transform={`translate(${lerp(1300, 800, ease(f, t52 - 14, 18))},${cardY})`}>
          <rect x={-150} y={-40} width={300} height={74} rx={8} fill={P.inkBlue} stroke={INK} strokeWidth={6} />
          <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={3} fill={P.cream}>LIMIT</text>
        </g>
        {slam > 0.3 && Array.from({length: 7}).map((_, i) => <circle key={i} cx={680 + i * 40} cy={1040 - ((i * 7) % 3) * 10} r={4 + (i % 3)} fill={P.creamShade} opacity={0.6 * (1 - slam) + 0.2} />)}
        <NearRail f={g} y={1560} seed={8} />
      </SVG>
    </Frame>
  );
};

// ---- S14: until a framework (keys 31, 32, 33), the Kreiss-Tomkins lectern and the gate with a dashed sheet-shaped key --------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t31 = b(31), t32 = b(32), t33 = b(33);
  const slide = ease(f, 0, 20);
  const drop = ease(f, t33 - 6, 22);
  const cam = track([{t: 0, z: 1.08, fx: 540, fy: 1080}, {t: p.dur, z: 1.14, fx: 560, fy: 1090}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="KREISS-TOMKINS · SEPTEMBER" y={540} size={30} tone="cream" p={ease(f, t31 + 8, 8)} />
        <Plate x={540} text="UNTIL A FRAMEWORK" y={640} size={34} tone="ink" p={ease(f, t32, 8)} />
        <Plate x={540} text="A FRAMEWORK · NOT PASSED YET" displayLines={['A FRAMEWORK', 'NOT PASSED YET']} y={760} size={30} tone="cream" p={ease(f, t33 + 6, 8)} />
      </>}>
      <SVG>
        <Hall f={g} id="s14" floorY={1120} />
        <rect data-band="ok" x={0} y={1120} width={W} height={330} fill={P.wood} stroke={INK} strokeWidth={6} />
        <g transform={`translate(${lerp(-400, 0, slide)},0)`}>
          <Lectern x={220} y={1350} s={1.3} f={g} lit={ease(f, t31, 6)} card="KREISS-TOMKINS" cardSize={12} phase={3.3} id="s14k" />
        </g>
        <g transform={`translate(${lerp(1300, 0, slide)},0)`}>
          <Gate x={700} y={1380} s={1.15} f={g} keyLabel="" keyK={0} open={0} id="s14g" keyShow={0} />
        </g>
        {/* the framework: a dashed sheet-shaped key that hovers at the keyhole, never inserted */}
        <g transform={`translate(${lerp(700, 640, drop)},${lerp(760, 1030, easeIO(f, t33 - 6, 26)) + 6 * Math.sin(g / 10)}) rotate(${-8 + 8 * drop})`} opacity={ease(f, t33 - 8, 10)}>
          <rect x={-70} y={-96} width={140} height={190} rx={8} fill="none" stroke={INK} strokeWidth={6} strokeDasharray="14 10" />
          <rect x={-70} y={-96} width={140} height={190} rx={8} fill={P.cream} opacity={0.16} />
          <text x={0} y={-52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={1.5} fill={INK}>FRAMEWORK</text>
          {[0, 1, 2].map((i) => <rect key={i} x={-48} y={-22 + i * 30} width={96 - (i === 2 ? 30 : 0)} height={5} rx={2.5} fill={INK} opacity={0.35} />)}
        </g>
        <NearRail f={g} y={1560} kind="bare" />
      </SVG>
    </Frame>
  );
};

/** the dusk Interior sky: slate-violet gradient, twinkling stars, a crescent moon, drifting cloud bands and two parallax ridges. Never green. */
const DuskSky: React.FC<{f: number; id: string; ground?: number}> = ({f, id, ground = 1230}) => (
  <g>
    <defs><linearGradient id={`${id}_s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.duskDeep} /><stop offset="1" stopColor={P.duskHi} /></linearGradient></defs>
    <rect data-band="ok" x={0} y={0} width={W} height={1320} fill={`url(#${id}_s)`} />
    {Array.from({length: 36}).map((_, i) => <circle key={i} cx={rnd(i) * 1080} cy={rnd(i + 40) * 760} r={1.6 + rnd(i + 7) * 2.4} fill="#fff" opacity={0.3 + 0.5 * Math.abs(Math.sin(f / 26 + i))} />)}
    <g transform="translate(900,250)"><circle r={54} fill="#F3EEDC" stroke={INK} strokeWidth={5} /><circle cx={22} cy={-8} r={50} fill={P.duskHi} /></g>
    {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={((f * (0.5 + i * 0.22) + i * 330) % 1500) - 200} cy={520 + i * 110} rx={300} ry={34} fill="#9AA0C8" opacity={0.28} />)}
    <path d={`M-60,1150 ${Array.from({length: 15}).map((_, i) => `L ${i * 95 - 40 + ((f * 0.25) % 95)},${1010 - 80 * rnd(i + 3 + Math.floor((f * 0.25) / 95))}`).join(' ')} L 1200,1150 Z`} fill="#2F3552" stroke={INK} strokeWidth={4} />
    <path d={`M-40,1220 ${Array.from({length: 13}).map((_, i) => `L ${i * 95 + 30},${1130 - 60 * rnd(i + 9)}`).join(' ')} L 1160,1220 Z`} fill="#222742" stroke={INK} strokeWidth={4} />
    {Array.from({length: 14}).map((_, i) => <path key={i} d={`M${i * 82 + 8},${ground + 2} l 16,-70 l 16,70 Z`} fill="#1C2038" stroke={INK} strokeWidth={2.4} />)}
    <rect data-band="ok" x={0} y={ground} width={W} height={300} fill="#3A3B4E" stroke={INK} strokeWidth={5} />
  </g>
);

// ---- S9: the grid (keys 34 to 37, 53) ------------------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t34 = b(34), t35 = b(35), t36 = b(36), t37 = b(37), t53 = b(53);
  const slideIn = ease(f, 0, 22);
  const sag = ease(f, t34 + 4, 30);
  const lamp = ease(f, t35, 8);
  const counter = ease(f, t37 - 6, 18);
  const bell = bump(f, t53, 20);
  const jam = ease(f, t36, 8);
  const jamShake = jam > 0.5 && f < t36 + 40 ? 6 * Math.sin((f - t36) * 1.7) : 0;
  const local = ease(f, t53, 24);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.03, fx: 540, fy: 1040}]);
  return (
    <Frame p={p} cam={cam} dim={0.16} tagText="IN THE INTERIOR"
      overlay={<>
        <Plate x={540} text="TOMASZEWSKI" y={540} size={34} tone="cream" p={ease(f, t35, 8) * (1 - ease(f, t37 - 8, 8))} />
        <Plate x={540} text="THE GRID ISN'T READY" y={620} size={34} tone="ink" p={ease(f, t36, 8) * (1 - ease(f, t37 - 8, 8))} />
        <Plate x={790} text="GOLDEN VALLEY ELECTRIC · RECENT ENERGY ALERT" displayLines={['GOLDEN VALLEY ELECTRIC', 'RECENT ENERGY ALERT']} y={730} size={26} tone="cream" p={ease(f, t36 + 6, 8) * (1 - ease(f, t37 - 8, 8))} />
        
        <Plate x={715} text="PRAX · HANEY · ZONING IS LOCAL" y={860} size={28} tone="ink" p={ease(f, t53, 8)} />
      </>}>
      <SVG>
        <DuskSky f={g} id="s9d" />
        <g transform={`translate(${lerp(500, 0, slideIn)},0)`}><Pole x={500} y={1360} s={1.2} sag={sag} lamp={lamp} f={g} id="s9p" reach={620} /></g>
        {/* a small rail card: WHO PAYS jams, then PLACE slides to LOCAL */}
        <g transform="translate(250,930)">
          <rect x={-170} y={-96} width={340} height={ 268} rx={10} fill={P.cream} stroke={INK} strokeWidth={6} opacity={0.94} />
          <g transform={`translate(${jamShake},0)`}><Rails x={0} y={-14} s={0.95} f={g} vals={[0.5, f < t53 ? 0.5 : lerp(0.5, 0.06, local), 0.55 + 0.03 * jam]} labels={['SIZE', 'PLACE', 'WHO PAYS']} w={290} pulse={[0, bump(f, t53, 20), jam > 0.5 ? 0.6 : 0]} /></g>
          
        </g>
        <g transform={`translate(${lerp(1400, 850, counter)},1380)`}>
          <ContactShadow cx={0} cy={4} rx={150} ry={12} opacity={0.34} blur={8} />
          <Blk x={-140} y={-140} w={280} h={140} c={P.wood} id="s9c1" r={8} sw={6} />
          <rect x={-150} y={-166} width={300} height={30} rx={8} fill={P.woodHi} stroke={INK} strokeWidth={5} />
          <g transform={`translate(0,${-176 - 6 * bell})`}>
            <path d="M -30,0 Q -30,-40 0,-44 Q 30,-40 30,0 Z" fill={P.honey} stroke={INK} strokeWidth={5} />
            <circle cx={0} cy={-48} r={6} fill={BAL.honeyShade} stroke={INK} strokeWidth={3} />
            {bell > 0.1 && <path d="M -48,-24 q -10,-10 0,-20 M 48,-24 q 10,-10 0,-20" stroke="#fff" strokeWidth={4} fill="none" opacity={bell} />}
          </g>
        </g>
        <BallotBox x={120} y={1318} s={0.5} f={g} mood={f > t36 ? 'worried' : 'blank'} flagDroop={f > t36 ? 1 : 0} look={4} phase={2.7} id="s9b" />
        <NearRail f={g} y={1580} dusk={1} kind="spruce" seed={9} />
      </SVG>
    </Frame>
  );
};

// ---- S10: the same line (keys 38, 39) ---------------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t38 = b(38), t39 = b(39);
  const slide = ease(f, t38 - 4, 22);
  const swing = easeIO(f, t38 + 4, 30);
  const plug = ease(f, t38 + 30, 10);
  const fill = ease(f, t39, 26);
  const cam = track([{t: 0, z: 1.0, fx: 520, fy: 1050}, {t: p.dur, z: 1.1, fx: 600, fy: 1060}]);
  return (
    <Frame p={p} cam={cam} dim={0.12}
      overlay={<>
        <Plate x={540} text="HOLLAND AND BOYLE" y={540} size={34} tone="cream" p={ease(f, t38, 8)} />
        <Plate x={540} text="BOTH SEE ENERGY INVESTMENT" y={640} size={32} tone="ink" p={ease(f, t39, 8)} />
      </>}>
      <SVG>
        <DuskSky f={g} id="s10d" />
        <Pole x={990} y={1360} s={0.9} sag={1} lamp={0.8} f={g} id="s10p" reach={420} />
        <g transform={`translate(${lerp(-400, 0, slide)},0)`}><Building x={40} y={1300} w={380} h={230} id="s10s" windows={3} kind="shed" f={g} lit={0.9} plug={plug} /></g>
        <g transform={`translate(${lerp(1400, 0, slide)},0)`}><Building x={470} y={1310} w={560} h={340} id="s10h" windows={7} kind="hall" f={g} lit={0.9} /></g>
        <path d={`M 300,1010 Q 540,820 790,930`} stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray="22 16" opacity={0.9 - 0.4 * fill} />
        <path d={`M 300,1010 Q 540,820 790,930`} stroke={fill > 0.02 ? P.aurora : '#8A91B4'} strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray={fill > 0.98 ? undefined : '22 16'} opacity={0.5 + 0.5 * fill} />
        <g transform="translate(545,870)"><rect x={-98} y={-18} width={196} height={30} rx={5} fill={P.cream} stroke={INK} strokeWidth={4} /><text x={0} y={5} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={19} letterSpacing={2} fill={INK}>INVESTMENT</text></g>
        {(() => {
          const ex = lerp(880 + 14 * Math.sin(g / 11), 397, swing), ey = lerp(1000 + 16 * Math.sin(g / 9), 1263, swing);
          const cxp = lerp(930, 620, swing), cyp = lerp(960, 1180, swing);
          const d = `M 905,838 Q ${cxp},${cyp} ${ex},${ey}`;
          return (<g>
            <path d={d} stroke={INK} strokeWidth={13} fill="none" strokeLinecap="round" />
            <path d={d} stroke={P.aurora} strokeWidth={6} fill="none" strokeLinecap="round" />
            <g transform={`translate(${ex},${ey})`}><rect x={-15} y={-9} width={30} height={22} rx={4} fill={P.creamShade} stroke={INK} strokeWidth={4} />{plug > 0.5 && <circle r={26 + 6 * Math.sin(g / 3)} fill={P.aurora} opacity={0.35} />}</g>
          </g>);
        })()}
        <NearRail f={g} y={1580} dusk={1} kind="spruce" seed={10} />
      </SVG>
    </Frame>
  );
};

// ---- S11: the bill flips (keys 40, 41, 42, 43) ----------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t40 = b(40), t41 = b(41), t42 = b(42), t43 = b(43);
  const flip = easeIO(f, t41, 26);
  const rise = easeIO(f, t41, 40);
  const typed = ease(f, t41 + 8, 44);
  const stamp = ease(f, t43, 8);
  const lamp = ease(f, t41 - 10, 20) * 0.7 + 0.3;
  const tabFlip = ease(f, t40 + 8, 14);
  const cam = track([{t: 0, z: 1.08, fx: 540, fy: 1100}, {t: p.dur, z: 1.18, fx: 540, fy: 1060}]);
  return (
    <Frame p={p} cam={cam} dim={0.22}
      overlay={<>
        <Plate x={540} text="THE RULE?" y={520} size={38} tone="cream" p={ease(f, t40, 8) * (1 - ease(f, t41 + 20, 8))} />
        <Plate x={540} text="SENATE · 14 TO 5" y={600} size={38} tone="ink" p={ease(f, t41 + 14, 8)} />
        <Plate x={540} text="THE BILL · POWER RULES + DECOMMISSIONING" displayLines={['THE BILL', 'POWER RULES + DECOMMISSIONING']} y={730} size={30} tone="cream" p={ease(f, t43, 8)} />
      </>}>
      <SVG>
        <Hall f={g} id="s11" dusk={0.8} floorY={1180} />
        <NearRail f={g} y={1580} dusk={1} kind="bare" />
        <InTray x={540} y={1360} s={1.6} f={g} lamp={lamp} tab={1} tabText={tabFlip > 0.5 ? 'THIS YEAR' : 'LATER'} id="s11t">
          {flip < 0.02 && <BillSheet x={0} y={-190} s={0.55} f={g} face={false} id="s11b0" />}
        </InTray>
        {flip >= 0.02 && (
          <BillSheet x={540} y={lerp(1130, 1060, rise)} s={lerp(0.9, 1.0, rise)} f={g} flip={flip} typed={typed} stamp={stamp} id="s11b1" />
        )}
      </SVG>
    </Frame>
  );
};

// ---- S12: never took it up (keys 44, 45, 46) -----------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t44 = b(44), t45 = b(45), t46 = b(46);
  const toll = bump(f, t45, 30);
  const lampsOut = (i: number) => 1 - ease(f, t45 + 8 + i * 9, 6);
  const tag = ease(f, t46, 12);
  const pull = easeIO(f, t44 + 6, 60);
  const cam = (ff: number): Cam => clampCam({z: lerp(1.9, 1.0, easeIO(ff, t44 + 6, 60)), fx: lerp(300, 540, easeIO(ff, t44 + 6, 60)), fy: lerp(1250, 1000, easeIO(ff, t44 + 6, 60))});
  void pull;
  return (
    <Frame p={p} cam={cam} dim={0.1 + 0.18 * ease(f, t45 + 10, 40)}
      overlay={<>
        <Plate x={540} text="HOUSE · NEVER TOOK IT UP" y={800} size={34} tone="ink" p={ease(f, t44, 8)} />
        <Plate x={540} text="SESSION ENDED" y={890} size={34} tone="cream" p={ease(f, t45, 8)} />
        <Plate x={540} text="SPONSOR LÖKI TOBIN · RETURNS NEXT YEAR" displayLines={['SPONSOR LÖKI TOBIN', 'RETURNS NEXT YEAR']} y={1010} size={30} tone="cream" p={tag} />
      </>}>
      <SVG>
        <rect x={0} y={0} width={W} height={H} fill="#B8C7BA" />
        <path d="M 0,0 L 330,520 L 330,1100 L 0,1500 Z" fill="#9DB6A2" stroke={INK} strokeWidth={6} />
        <path d="M 1080,0 L 750,520 L 750,1100 L 1080,1500 Z" fill="#9DB6A2" stroke={INK} strokeWidth={6} />
        <path d="M 0,1500 L 330,1100 L 750,1100 L 1080,1500 L 1080,1920 L 0,1920 Z" fill="#C79A52" stroke={INK} strokeWidth={6} />
        <path d="M 0,0 L 330,520 L 750,520 L 1080,0 Z" fill="#8DA896" stroke={INK} strokeWidth={6} />
        <path d="M 330,1920 L 470,1100 L 610,1100 L 750,1920 Z" fill="#5B6C8A" stroke={INK} strokeWidth={6} />
        <path d="M 380,1920 L 490,1100 M 700,1920 L 590,1100" stroke={P.honey} strokeWidth={5} opacity={0.8} />
        {Array.from({length: 6}).map((_, i) => <path key={i} d={`M ${200 + i * 130},1920 L ${440 + i * 40},1100`} stroke={INK} strokeWidth={2.4} opacity={0.18} />)}
        <g transform="translate(540,1100)">
          <Blk x={-210} y={-580} w={210} h={580} c={P.woodHi} id="s12d1" r={8} sw={7} />
          <Blk x={0} y={-580} w={210} h={580} c={P.woodHi} id="s12d2" r={8} sw={7} />
          <path d="M -240,-580 Q -240,-680 0,-690 Q 240,-680 240,-580" fill={P.cream} stroke={INK} strokeWidth={7} />
          <circle cx={-26} cy={-280} r={11} fill={P.honey} stroke={INK} strokeWidth={4} /><circle cx={26} cy={-280} r={11} fill={P.honey} stroke={INK} strokeWidth={4} />
        </g>
        <text x={540} y={496} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={6} fill={INK}>HOUSE</text>
        {[0, 1, 2, 3].map((i) => {
          const x = i < 2 ? 100 + i * 120 : 980 - (i - 2) * 120;
          const L = lampsOut(i);
          return (
            <g key={i} transform={`translate(${x},${i % 2 === 0 ? 800 : 700})`}>
              <rect x={-6} y={0} width={12} height={90} fill={P.slateHi} stroke={INK} strokeWidth={3.4} />
              <circle cx={0} cy={-6} r={24} fill={P.honey} opacity={0.2 + 0.8 * L} stroke={INK} strokeWidth={4.4} />
              {L > 0.05 && <circle cx={0} cy={-6} r={70} fill={P.honey} opacity={0.14 * L} />}
            </g>
          );
        })}
        <g transform="translate(300,1450)">
          <ContactShadow cx={0} cy={6} rx={230} ry={14} opacity={0.34} blur={9} />
          <Blk x={-210} y={-200} w={420} h={36} c={P.woodHi} id="s12t" r={8} sw={6} />
          {[-1, 1].map((sx) => <rect key={sx} x={sx * 170 - 14} y={-164} width={28} height={170} fill={P.wood} stroke={INK} strokeWidth={5} />)}
          <g transform="translate(0,-214)"><BillSheet x={0} y={0} s={0.5} rot={-5} f={g} face typed={1} stamp={1} id="s12b" /></g>
          {Array.from({length: 4}).map((_, i) => <circle key={i} cx={-140 + i * 90 + 10 * Math.sin(g / 14 + i)} cy={-250 - ((g * 0.5 + i * 19) % 40)} r={3} fill={P.creamShade} opacity={0.5} />)}
        </g>
        <g transform={`translate(890,1450) rotate(${toll * 10 * Math.sin(g / 2.4)})`}>
          <ContactShadow cx={0} cy={6} rx={60} ry={10} opacity={0.34} blur={8} />
          <Blk x={-8} y={-340} w={16} h={340} c={P.wood} id="s12p" r={4} sw={5} />
          <g transform={`translate(0,-360) rotate(${toll * 24 * Math.sin(g / 2.2)})`}>
            <path d="M -62,0 Q -62,-84 0,-90 Q 62,-84 62,0 Z" fill={P.honey} stroke={INK} strokeWidth={6} />
            <rect x={-70} y={-4} width={140} height={14} rx={6} fill={BAL.honeyShade} stroke={INK} strokeWidth={5} />
            <circle cx={0} cy={22} r={9} fill={INK} />
          </g>
        </g>
        <NearRail f={g} y={1600} dusk={1} kind="bare" />
      </SVG>
    </Frame>
  );
};

// ---- S13: which one decides (keys 47 to 51) ------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t47 = b(47), t48 = b(48), t49 = b(49), t50 = b(50), t51 = b(51);
  const sheet = ease(f, t47 - 4, 22);
  const pens = ease(f, t47, 24);
  const swallow = easeIO(f, t51, 14);
  const spit = ease(f, t51 + 22, 14);
  const mouth = Math.max(swallow * (1 - spit), bump(f, t51 + 22, 26) * 1.3);
  const cam = track([{t: 0, z: 1.08, fx: 580, fy: 1060}, {t: p.dur, z: 1.0, fx: 540, fy: 1080}]);
  const sxo = lerp(700, 390, swallow);
  const syo = lerp(900, 1130, swallow);
  const scs = lerp(0.8, 0.2, swallow);
  const slipOn = f > t51 + 22;
  const sx = lerp(468, 700, spit), sy = lerp(1150, 900, spit);
  const sc = lerp(0.2, 0.86, Math.min(1, spit * 1.15)) * (1 + 0.1 * Math.sin(spit * Math.PI));
  const scrib = ease(f, t47 + 14, 40);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="A STATE RULE · NEXT SESSION?" y={540} size={34} tone="ink" p={ease(f, t47, 8) * (1 - ease(f, t51 - 4, 8))} />
        <Plate x={540} text="CAPITOL OR BOROUGH?" y={640} size={32} tone="cream" p={ease(f, t47 + 20, 8) * (1 - ease(f, t51 - 4, 8))} />
      </>}>
      <SVG>
        <Hall f={g} id="s13" floorY={1180} />
        <NearRail f={g} y={1580} seed={13} />
        <BallotBox x={330} y={1300} s={1.28} f={g} mood={f < t51 ? 'ask' : 'blank'} mouth={mouth} look={5} phase={0.3} id="s13b" />
        {!slipOn && sheet > 0.02 && swallow < 0.98 && <Slip x={sxo} y={syo} s={scs} f={g} blank head="NEXT SESSION" headSize={24} rot={-3} id="s13s" />}
        {sheet > 0.02 && swallow < 0.5 && [0, 1].map((i) => (
          <g key={i} transform={`translate(${i ? 985 : 915},${880 + 10 * Math.sin(g / 9 + i * 2) - (1 - pens) * 200}) rotate(${i ? 18 : -14})`}>
            <rect x={-9} y={-90} width={18} height={168} rx={7} fill={P.inkBlue} stroke={INK} strokeWidth={4.4} />
            <path d="M -9,78 L 0,112 L 9,78 Z" fill={P.creamShade} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            {i === 0 ? <path d="M -16,-92 Q -16,-120 0,-124 Q 16,-120 16,-92 Z" fill={P.cream} stroke={INK} strokeWidth={4} />
              : <path d="M -14,-92 Q -14,-110 0,-112 Q 14,-110 14,-92 Z" fill={P.honey} stroke={INK} strokeWidth={4} />}
          </g>
        ))}
        {sheet > 0.02 && swallow < 0.5 && (
          <path d="M 800,972 q 18,-10 36,0 t 36,0 t 24,0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={120} strokeDashoffset={120 * (1 - scrib)} />
        )}
        {!slipOn && <Rails x={760} y={1190} s={0.8} f={g} vals={[0.3, 0.68, 0.5]} show={ease(f, t48 - 20, 14) * (1 - swallow)} w={300} pulse={[bump(f, t48, 20), bump(f, t49, 20), bump(f, t50, 20)]} />}
        {slipOn && <Slip x={sx} y={sy} s={sc} f={g} melt={1} rot={-4} vals={[0.5, 0.5, 0.5]} id="s13o" head="DATA CENTERS?" />}
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={P.sage} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={P.inkBlue}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {14: 'UNTIL A FRAMEWORK', 1: 'THE SLIP', 2: 'TWELVE LECTERNS', 3: 'THE TRAY', 4: 'THEN THEY SPLIT', 5: 'WHO PAYS', 6: 'SHED OR HALL', 7: 'FOR GOVERNOR', 8: 'A LINE AND A LOCK', 9: 'THE GRID', 10: 'SAME LINE', 11: 'THE BILL FLIPS', 12: 'NEVER TOOK IT UP', 13: 'WHICH ONE'};
const SHOTS: Record<number, React.FC<SceneProps>> = {14: S14, 1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 14, 9, 10, 11, 12, 13];

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

export const ep1026Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1026Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1026: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 8.3, 18.5, 24.2, 32.3, 42.3, 52.8, 64, 72.5, 79.2, 90.3, 96.1, 106.5, 113.5, 122].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#1E2B4D" ink="#F4EEDC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
