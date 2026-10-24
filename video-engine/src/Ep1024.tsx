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
import {SatelliteEye, AlaskaMini} from './lib/kit';
import {ScanReticle} from './lib/FX';
import {SoilColumn, ThawProbe, TH} from './lib/thaw';
import {IDS} from './Ep1024Ids';

// Seeing Is the Easy Part, 2026-10-24. Palette roles are art_direction.json. The HOT PIXEL (thermal orange #FF5A1F, ember #FFD23F) is the only warm light in the cold orbital plate,
// and it is the film's throughline: found, timed, flagged, fallen through, sunk, forked and finally chosen. Everything PLANNED (the 20 minute goal, the EDF triage tool, the CATG burns, the
// empty put-out ring) is DASHED bone. The Eye never decides anything. No Alaska Native person is drawn, the quote is a plate. Every painted string is a claims.json on_screen string, a quote, or a plain label.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const SERIF = 'Fraunces, Georgia, serif';
const P = {
  void: '#0B1020', plate: '#1F3A5F', plateHi: '#2C4A6E', grid: '#3A5C86', cyan: '#7FD6E0', cyanDeep: '#2E8FA3',
  hot: '#FFB02E', hotRim: '#FF8A1F', hotCore: '#FFF4C2', hotDeep: '#B3601A', ice: '#9FD8E6', iceHi: '#E3F6FB', peat: '#5A3B2A', bone: '#F4F1E8', boneDim: '#CFC9B4',
  ink: '#0B1020', kraft: '#D9C79A', smoke: '#6B6B73', smokeHi: '#9A9AA3', green: '#7BC47F', tan: '#8A7A52', gold: '#E8B04A',
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

type Tone = 'ink' | 'bone' | 'kraft' | 'hot' | 'ice' | 'dash';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: '#0B1020', fg: P.bone},
  bone: {fill: P.bone, fg: '#0B1020'},
  kraft: {fill: P.kraft, fg: INK},
  hot: {fill: P.hot, fg: INK},
  ice: {fill: P.ice, fg: '#0B1020'},
  dash: {fill: '#16233B', fg: P.bone},
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
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.34} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={dashed ? P.bone : C.ink} strokeWidth={dashed ? 3 : 4} strokeDasharray={dashed ? '14 9' : undefined} strokeDashoffset={dashed ? -fr * 0.7 : 0} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

/** a boxed quote typed to the voice: `type` (0..1) is how much has been typed, text is "quote · attribution" */
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
      <rect x={-tw / 2 + 10} y={-th / 2 + 12} width={tw} height={th} fill="#000" opacity={0.34} />
      <rect x={-tw / 2} y={-th / 2} width={tw} height={th} fill={C.paper} stroke={C.ink} strokeWidth={7} />
      <rect x={-tw / 2 + 11} y={-th / 2 + 11} width={tw - 22} height={th - 22} fill="none" stroke={C.ink} strokeWidth={2.2} />
      {lines.map((l, i) => {
        const take = Math.max(0, Math.min(l.length, shown - used));
        used += l.length + 1;
        return <text key={i} x={0} y={-th / 2 + 22 + size * 0.86 + i * (size + 10)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={C.ink}>{l.slice(0, take)}</text>;
      })}
      {by && <text x={0} y={th / 2 - 20} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={24} letterSpacing={1} fill="#2C4A6E" opacity={clamp01(type * 3)}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: a camera that can move to any focus, kick, grade ---------------------------------------------------------------------
const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; children: React.ReactNode}> =
({p, cam, z0 = 1, z1 = 1.05, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, bloom = 0.05, vignette = 0.26, ox = 540, oy = 960, tag = true, overlay, tagText = CHIP, children}) => {
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
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#0B1020" stroke={C.paper} strokeWidth={2.4} opacity={0.92} />
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

// ---- shared pieces --------------------------------------------------------------------------------------------------------------------------
/** a hollow question mark, ink outline and bone stroke */
const QMark: React.FC<{x: number; y: number; f: number; size?: number; k?: number; rot?: number; bob?: number}> = ({x, y, f, size = 96, k = 1, rot = 0, bob = 7}) => {
  const kk = clamp01(k);
  if (kk <= 0.02) return null;
  const s = (size / 90) * (0.7 + 0.3 * Math.min(1, kk * 1.3));
  return (
    <g opacity={Math.min(1, kk * 2)} transform={`translate(${x},${y + bob * Math.sin(f / 13 + x * 0.01)}) rotate(${rot}) scale(${s})`}>
      <path d="M-26,-34 C-26,-78 28,-78 28,-34 C28,-8 0,-8 0,20" fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" />
      <path d="M-26,-34 C-26,-78 28,-78 28,-34 C28,-8 0,-8 0,20" fill="none" stroke={P.bone} strokeWidth={8} strokeLinecap="round" />
      <circle cx={0} cy={50} r={11} fill={INK} />
      <circle cx={0} cy={50} r={6.4} fill={P.bone} />
    </g>
  );
};

/** THE ORBITAL PLATE: a cold false-colour grid of tiles with braided rivers and ridge shading. Self-lit, no sun. `warm` lifts a faint warm bounce. */
const OrbitBG: React.FC<{f: number; id: string; cell?: number; rivers?: number; drift?: number; y0?: number; y1?: number; tint?: string}> = ({f, id, cell = 120, rivers = 5, drift = 1, y0 = 0, y1 = H, tint}) => {
  const cols = Math.ceil(W / cell) + 2, rows = Math.ceil((y1 - y0) / cell) + 2;
  const dx = (f * 0.35 * drift) % cell;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}_g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B1020" /><stop offset="0.5" stopColor="#14264A" /><stop offset="1" stopColor="#1B3358" />
        </linearGradient>
        <radialGradient id={`${id}_v`} cx="50%" cy="50%" r="70%"><stop offset="0.5" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.55} /></radialGradient>
      </defs>
      <rect x={0} y={y0} width={W} height={y1 - y0} fill={tint ?? `url(#${id}_g)`} />
      {/* tile mosaic: each tile a slightly different cold value, the way a thermal frame is a grid of pixels */}
      {Array.from({length: rows}).map((_, r) => Array.from({length: cols}).map((__, c) => {
        const v = rnd(r * 97 + c * 31 + id.length * 7);
        return <rect key={`${r}-${c}`} x={c * cell - dx - cell} y={y0 + r * cell - cell} width={cell} height={cell} fill={v > 0.6 ? '#3C6A9A' : v > 0.3 ? P.plateHi : '#0F2547'} opacity={0.22 + v * 0.38} />;
      }))}
      {Array.from({length: rows + 1}).map((_, r) => <line key={`h${r}`} x1={0} y1={y0 + r * cell - cell} x2={W} y2={y0 + r * cell - cell} stroke={P.grid} strokeWidth={1.4} opacity={0.34} />)}
      {Array.from({length: cols + 1}).map((_, c) => <line key={`v${c}`} x1={c * cell - dx - cell} y1={y0} x2={c * cell - dx - cell} y2={y1} stroke={P.grid} strokeWidth={1.4} opacity={0.34} />)}
      {/* braided rivers */}
      {Array.from({length: rivers}).map((_, i) => {
        const yb = y0 + (y1 - y0) * (0.18 + 0.64 * (i / Math.max(1, rivers - 1)));
        const a = 60 + rnd(i + 5) * 70, ph = rnd(i + 11) * 6;
        const d = `M-60,${yb} C 200,${yb - a} 360,${yb + a} 560,${yb + a * 0.2 * Math.sin(ph)} S 900,${yb - a * 0.8} 1160,${yb + a * 0.3}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={P.cyanDeep} strokeWidth={16 - i} strokeLinecap="round" opacity={0.55} />
            <path d={d} fill="none" stroke={P.cyan} strokeWidth={6} strokeLinecap="round" opacity={0.7} strokeDasharray="30 22" strokeDashoffset={-f * 0.8} />
          </g>
        );
      })}
      {/* contour rings and ridge shading so the plate reads as terrain and not a flat wash */}
      {Array.from({length: 5}).map((_, i) => {
        const cx = 160 + rnd(i + 21) * 760, cy = y0 + (y1 - y0) * (0.12 + 0.76 * rnd(i + 31));
        return [1, 2, 3].map((k) => <ellipse key={`${i}-${k}`} cx={cx} cy={cy} rx={70 * k + rnd(i + 41) * 40} ry={36 * k + rnd(i + 51) * 22} fill="none" stroke={P.grid} strokeWidth={2.2} opacity={0.34 - k * 0.07} transform={`rotate(${rnd(i + 61) * 50 - 25} ${cx} ${cy})`} />);
      })}
      <path d={`M0,${y1 - 260} C 240,${y1 - 330} 520,${y1 - 210} 760,${y1 - 290} S 1000,${y1 - 250} 1080,${y1 - 280} L1080,${y1} L0,${y1} Z`} fill="#06122A" opacity={0.55} />
      <path d={`M0,${y0 + 230} C 300,${y0 + 180} 640,${y0 + 280} 1080,${y0 + 200} L1080,${y0} L0,${y0} Z`} fill="#06122A" opacity={0.4} />
      <rect x={0} y={y0} width={W} height={y1 - y0} fill={`url(#${id}_v)`} />
    </g>
  );
};

/** THE HOT PIXEL: a lit square with a heat ring, the throughline. `dark` 0..1 sinks it toward a heavy dark orange, `s` is the square's edge in px. */
const HotPixel: React.FC<{x: number; y: number; s?: number; f: number; k?: number; dark?: number; rings?: boolean; glow?: number; id?: string; pulse?: number}> = ({x, y, s = 150, f, k = 1, dark = 0, rings = true, glow = 1, id = 'hp', pulse = 1}) => {
  const kk = clamp01(k);
  if (kk <= 0.01) return null;
  const pul = 1 + pulse * 0.045 * Math.sin(f / 9.5);
  const half = (s / 2) * kk * pul;
  const core = dark > 0 ? P.hotDeep : P.hotCore;
  const base = dark > 0 ? '#7A3A12' : P.hot;
  const mix = (a: string, b: string, t: number) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const cBase = mix(P.hot, '#7A3A12', dark), cCore = mix(P.hotCore, P.hotDeep, dark);
  void core; void base;
  return (
    <g transform={`translate(${x},${y})`}>
      <defs>
        <radialGradient id={`${id}_g`}><stop offset="0" stopColor={cCore} stopOpacity={0.55 * glow * (1 - dark * 0.6)} /><stop offset="1" stopColor={cBase} stopOpacity={0} /></radialGradient>
        <linearGradient id={`${id}_f`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={cCore} /><stop offset="0.55" stopColor={cBase} /><stop offset="1" stopColor={mix(P.hotRim, '#3A1408', dark)} /></linearGradient>
      </defs>
      <circle r={s * 1.9 * kk} fill={`url(#${id}_g)`} />
      {rings && [0, 1, 2].map((i) => {
        const ph = ((f / 34) + i / 3) % 1;
        return <rect key={i} x={-half - ph * s * 0.9} y={-half - ph * s * 0.9} width={(half + ph * s * 0.9) * 2} height={(half + ph * s * 0.9) * 2} fill="none" stroke={cBase} strokeWidth={5 * (1 - ph) + 1.5} opacity={(1 - ph) * 0.65 * (1 - dark * 0.6)} />;
      })}
      <rect x={-half + 7} y={-half + 9} width={half * 2} height={half * 2} fill="#000" opacity={0.35} />
      <rect x={-half} y={-half} width={half * 2} height={half * 2} fill={`url(#${id}_f)`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-half + 12} y={-half + 12} width={half * 0.9} height={half * 0.55} fill={P.hotCore} opacity={0.5 * (1 - dark)} />
      <path d={`M${-half + 8},${-half + 8} L${half - 8},${-half + 8}`} stroke="#fff4de" strokeWidth={4} opacity={0.55 * (1 - dark)} strokeLinecap="round" />
    </g>
  );
};

/** a radial clock ring, `left` 1..0 of the 72 hours remaining, mono readout in the middle */
const ClockRing: React.FC<{x: number; y: number; r?: number; left: number; f: number; k?: number; label?: string}> = ({x, y, r = 130, left, f, k = 1, label = '72 HR'}) => {
  const kk = clamp01(k);
  if (kk <= 0.02) return null;
  const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * clamp01(left);
  const pt = (a: number) => `${r * Math.cos(a)},${r * Math.sin(a)}`;
  return (
    <g transform={`translate(${x},${y}) scale(${0.6 + 0.4 * kk})`} opacity={Math.min(1, kk * 1.6)}>
      <circle r={r} fill="#0B1020" opacity={0.55} stroke={INK} strokeWidth={7} />
      <circle r={r - 14} fill="none" stroke={P.boneDim} strokeWidth={3} opacity={0.5} strokeDasharray="4 10" />
      {left > 0.01 && <path d={`M0,0 L${pt(a0)} A${r - 6},${r - 6} 0 ${left > 0.5 ? 1 : 0} 1 ${pt(a1)} Z`} fill={P.hot} opacity={0.42} />}
      <path d={`M${pt(a1)}`.replace('M', 'M0,0 L')} stroke={P.hotCore} strokeWidth={6} strokeLinecap="round" />
      <circle r={r} fill="none" stroke={P.bone} strokeWidth={4} />
      {Array.from({length: 12}).map((_, i) => <line key={i} x1={(r - 4) * Math.cos(i * Math.PI / 6)} y1={(r - 4) * Math.sin(i * Math.PI / 6)} x2={(r - 18) * Math.cos(i * Math.PI / 6)} y2={(r - 18) * Math.sin(i * Math.PI / 6)} stroke={P.bone} strokeWidth={4} />)}
      <text x={0} y={r + 52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={2} fill={P.bone} stroke={INK} strokeWidth={6} paintOrder="stroke">{label}</text>
    </g>
  );
};

/** the Eye (kit SatelliteEye) with a living idle; emotion/lock/cone set by the scene */
const Eye: React.FC<{x: number; y: number; s?: number; f: number; emotion?: 'searching' | 'straining' | 'found' | 'waiting'; lock?: number; cone?: number; strain?: number; accent?: number}> = ({x, y, s = 1, f, emotion = 'searching', lock = 0, cone = 0, strain = 0, accent = 0}) => (
  <g transform={`translate(0,${5 * s * Math.sin(f / 17)}) rotate(${2.4 * Math.sin(f / 29)} ${x} ${y})`}>
    <SatelliteEye frame={f} x={x} y={y} scale={s} emotion={emotion} eyeLock={lock} scanCone={cone} strain={strain} accent={accent} />
  </g>
);

/** a faceless crew dot: head, body, ink outline */
const Crew: React.FC<{x: number; y: number; s?: number; f?: number; ph?: number; spray?: number}> = ({x, y, s = 1, f = 0, ph = 0, spray = 0}) => (
  <g transform={`translate(${x},${y + Math.sin(f / 9 + ph) * 1.5 * s}) scale(${s})`}>
    <ellipse cx={0} cy={26} rx={20} ry={5} fill="#000" opacity={0.3} />
    <rect x={-12} y={-6} width={24} height={30} rx={8} fill="#E8B04A" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={-16} r={11} fill="#D9B38C" stroke={INK} strokeWidth={4} />
    <path d="M-12,-20 Q0,-34 12,-20 Z" fill="#E8E2D0" stroke={INK} strokeWidth={3.4} />
    {spray > 0.02 && (
      <g opacity={spray}>
        <path d={`M10,0 Q${30 + 10 * Math.sin(f / 5 + ph)},-26 ${56 + 8 * Math.sin(f / 4)},-4`} fill="none" stroke="#BFE3F2" strokeWidth={4.5} strokeLinecap="round" />
        <path d={`M10,2 Q${34},-14 ${66},8`} fill="none" stroke="#7FD6E0" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      </g>
    )}
  </g>
);

/** a small steady flame, candle scale at s = 1, a contact shadow under it */
const Flame: React.FC<{x: number; y: number; s?: number; f: number; k?: number; shadow?: boolean}> = ({x, y, s = 1, f, k = 1, shadow = true}) => {
  const kk = clamp01(k);
  if (kk <= 0.02) return null;
  const fl = 1 + 0.09 * Math.sin(f / 4.3) + 0.05 * Math.sin(f / 2.7);
  const sw = 4 * Math.sin(f / 6.1);
  return (
    <g transform={`translate(${x},${y}) scale(${s * kk})`}>
      {shadow && <ContactShadow cx={0} cy={4} rx={44} ry={8} opacity={0.4} />}
      <circle cy={-46} r={92} fill={P.hotCore} opacity={0.2} style={{mixBlendMode: 'screen'}} />
      <path d={`M0,0 C -34,-6 -40,-44 -14,-82 C -12,-62 -4,-58 ${sw - 2},-104 C ${24 + sw},-70 40,-40 30,-14 C 26,-2 12,2 0,0 Z`} transform={`scale(1,${fl})`} fill={P.hotRim} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M0,-2 C -20,-6 -22,-30 -6,-52 C 0,-40 10,-44 ${sw},-62 C 18,-40 22,-22 14,-10 C 10,-2 4,0 0,-2 Z`} transform={`scale(1,${fl})`} fill={P.hot} />
      <path d="M0,0 C -8,-4 -8,-14 0,-24 C 8,-14 8,-4 0,0 Z" fill="#fff4de" opacity={0.85} />
    </g>
  );
};

/** a dashed scan ring */
const DashRing: React.FC<{x: number; y: number; r: number; f: number; color?: string; w?: number; o?: number}> = ({x, y, r, f, color = P.bone, w = 5, o = 0.85}) => (
  <circle cx={x} cy={y} r={Math.max(1, r)} fill="none" stroke={color} strokeWidth={w} strokeDasharray="22 16" strokeDashoffset={-f * 1.1} opacity={o} />
);

/** a smoke puff: a soft grey ink-outlined cloud */
const Puff: React.FC<{x: number; y: number; r: number; f: number; ph?: number}> = ({x, y, r, f, ph = 0}) => (
  <g transform={`translate(${x},${y + 2 * Math.sin(f / 14 + ph)})`}>
    <circle cx={-r * 0.5} cy={r * 0.1} r={r * 0.7} fill={P.smoke} stroke={INK} strokeWidth={3} />
    <circle cx={r * 0.5} cy={r * 0.1} r={r * 0.7} fill={P.smoke} stroke={INK} strokeWidth={3} />
    <circle cx={0} cy={-r * 0.35} r={r * 0.85} fill={P.smokeHi} stroke={INK} strokeWidth={3} />
  </g>
);

const Coin: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={12} rx={50} ry={16} fill="#7D5E1C" stroke={INK} strokeWidth={4} />
    <rect x={-50} y={-6} width={100} height={18} fill="#C99A3C" />
    <line x1={-50} y1={-6} x2={-50} y2={12} stroke={INK} strokeWidth={4} /><line x1={50} y1={-6} x2={50} y2={12} stroke={INK} strokeWidth={4} />
    <ellipse cx={0} cy={-6} rx={50} ry={16} fill="#F0D28A" stroke={INK} strokeWidth={4} />
    <ellipse cx={0} cy={-6} rx={30} ry={9} fill="none" stroke="#C99A3C" strokeWidth={3} />
  </g>
);

/** a mosaic of thermal tiles that carries the camera's fall through the hot square: cover 0..1 builds it, 1..0 dissolves it */
const TileMosaic: React.FC<{cover: number; ground?: boolean}> = ({cover, ground = false}) => {
  if (cover <= 0.01) return null;
  const cols = 8, rows = 14, cw = W / cols, ch = H / rows;
  const colors = ground ? ['#5A3B2A', '#8A7A52', '#9FD8E6', '#2C4A6E', '#E3F6FB', '#7C5640'] : [P.hotCore, P.hot, P.hotRim, '#FFD27A', '#E8872A', '#FFE9A8'];
  return (
    <g>
      {Array.from({length: rows * cols}).map((_, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const d = (r * 0.5 + c * 0.7 + rnd(i + 300) * 3) / (rows * 0.5 + cols * 0.7 + 3);
        const k = clamp01(cover * 1.6 - d * 0.6);
        if (k <= 0.01) return null;
        return <rect key={i} x={c * cw + (cw / 2) * (1 - k)} y={r * ch + (ch / 2) * (1 - k)} width={cw * k + 1} height={ch * k + 1} fill={colors[Math.floor(rnd(i + 9) * colors.length)]} stroke={INK} strokeWidth={2.4} opacity={0.96} />;
      })}
    </g>
  );
};

// ---- S1: one square (keys 1, 2, 3) -----------------------------------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t2 = b(2), t3 = b(3);
  const k = snap(f, 6, 12);
  const eyeIn = ease(f, t2, 34);
  const lock = ease(f, t3, 10);
  const q = ease(f, t3 + 4, 14);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 930}, {t: p.dur, z: 1.1, fx: 540, fy: 950}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        {f >= 6 && f < 16 && <rect width={W} height={H} fill={P.hotCore} opacity={0.34 * (1 - (f - 6) / 10)} />}
        <Plate x={540} text="ONE SQUARE · ONE FIRE" y={1100} size={34} tone="ink" p={ease(f, 22, 8)} />
        <Plate x={540} text="SOMEBODY HAS TO DECIDE" y={1210} size={34} tone="bone" p={ease(f, t3 + 6, 8)} />
      </>}>
      <SVG>
        <OrbitBG f={g} id="s1" cell={120} rivers={3} />
        <HotPixel x={540} y={940} s={170 * (1 + 0.9 * Math.max(0, 1 - (f - 6) / 6))} f={g} k={k} id="s1h" />
        {f >= 6 && f < 26 && <circle cx={540} cy={940} r={ease(f, 6, 16) * 760} fill="none" stroke={P.hotCore} strokeWidth={16 * (1 - ease(f, 6, 16))} opacity={0.8} />}
        <ScanReticle cx={540} cy={940} frame={g} lock={lock} color={P.hotCore} size={210} />
        <Eye x={540} y={lerp(-300, 440, eyeIn)} s={0.95} f={g} emotion={lock > 0.5 ? 'found' : 'searching'} lock={lock} cone={0.9 * lock} />
        <QMark x={730} y={lerp(930, 760, q)} f={g} size={110} k={q} />
      </SVG>
    </Frame>
  );
};

// ---- S2: one image (keys 4, 5, 6) -------------------------------------------------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t5 = b(5), t6 = b(6);
  const boot = ease(f, 0, 10);
  const a = snap(f, 4, 10);
  const c2 = snap(f, t5, 10);
  const br = easeIn(f, t6 - 14, 16);
  const box = {x0: lerp(110, 250, br), y0: lerp(700, 800, br), x1: lerp(970, 830, br), y1: lerp(1250, 1140, br)};
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.06, fx: 540, fy: 950}]);
  const bez = (x0: number, y0: number, x1: number, y1: number) => `M${x0},${y0} h${x1 - x0} v${y1 - y0} h${-(x1 - x0)} Z`;
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate text="FIRESAT · A PROTOTYPE" x={540} y={580} size={32} tone="ink" p={ease(f, 8, 8)} />
        <Plate text="ONE IMAGE · JUNE 2025" x={540} y={1262} size={34} tone="bone" p={ease(f, t6 + 4, 8)} />
      </>}>
      <SVG>
        <OrbitBG f={g} id="s2bg" cell={120} rivers={2} y0={0} y1={H} drift={0.5} />
        <rect x={0} y={0} width={W} height={H} fill="#06091A" opacity={0.55} />
        {Array.from({length: 50}).map((_, i) => <circle key={i} cx={rnd(i + 3) * W} cy={rnd(i + 300) * H} r={1.2 + rnd(i + 500) * 2} fill={P.bone} opacity={0.2 + 0.4 * Math.abs(Math.sin(g / 22 + i))} />)}
        <clipPath id="s2clip"><rect x={60} y={640} width={960} height={680} /></clipPath>
        <g clipPath="url(#s2clip)" opacity={boot}>
          <OrbitBG f={g} id="s2" cell={90} rivers={6} y0={600} y1={1360} drift={2} />
          {Array.from({length: 26}).map((_, i) => <line key={i} x1={60} y1={640 + ((i * 28 + f * 3) % 680)} x2={1020} y2={640 + ((i * 28 + f * 3) % 680)} stroke="#7FD6E0" strokeWidth={1.4} opacity={0.12} />)}
          <rect x={60} y={640} width={960} height={680} fill="#7FD6E0" opacity={0.05} />
          <HotPixel x={410} y={900} s={104} f={g} k={a} id="s2a" />
          <HotPixel x={690} y={1050} s={96} f={g} k={c2} id="s2b" />
        </g>
        {/* the sensor bezel and raw strip */}
        <path d={bez(60, 640, 1020, 1320)} fill="none" stroke={INK} strokeWidth={16} />
        <path d={bez(60, 640, 1020, 1320)} fill="none" stroke={P.cyan} strokeWidth={3} opacity={0.7} />
        {Array.from({length: 30}).map((_, i) => <line key={i} x1={60} y1={660 + i * 22} x2={i % 4 === 0 ? 96 : 80} y2={660 + i * 22} stroke={P.bone} strokeWidth={2.4} opacity={0.6} />)}
        <g opacity={a}>
          <rect x={360} y={758} width={monoW('MORAN FIRE', 22) + 24} height={34} rx={4} fill="#0B1020" stroke={P.bone} strokeWidth={2.6} />
          <text x={372} y={782} fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={1.5} fill={P.bone}>MORAN FIRE</text>
        </g>
        <g opacity={c2}>
          <rect x={585} y={945} width={monoW('CHICKEN FIRE', 22) + 24} height={34} rx={4} fill="#0B1020" stroke={P.bone} strokeWidth={2.6} />
          <text x={597} y={969} fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={1.5} fill={P.bone}>CHICKEN FIRE</text>
        </g>
        {/* frame brackets slam around both */}
        {br > 0.02 && ([[box.x0, box.y0, 1, 1], [box.x1, box.y0, -1, 1], [box.x0, box.y1, 1, -1], [box.x1, box.y1, -1, -1]] as Array<[number, number, number, number]>).map(([x, y, sx, sy], i) => (
          <path key={i} d={`M${x},${y + sy * 80} L${x},${y} L${x + sx * 80},${y}`} fill="none" stroke={P.cyan} strokeWidth={10} strokeLinecap="round" opacity={Math.min(1, br * 2)} />
        ))}
        <Eye x={860} y={470} s={0.5} f={g} emotion={f > t6 ? 'found' : 'searching'} lock={ease(f, t6, 8)} />
      </SVG>
    </Frame>
  );
};

// ---- S3: three in orbit (keys 7, 8, 9) --------------------------------------------------------------------------------------------------------
const FireSatSil: React.FC<{x: number; y: number; s: number; f: number; glow: number}> = ({x, y, s, f, glow}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ContactShadow cx={0} cy={120} rx={70} ry={10} opacity={0.12} />
    {[-1, 1].map((d) => (
      <g key={d} transform={`translate(${d * 96},0)`}>
        <rect x={-46} y={-30} width={92} height={60} rx={4} fill="#26303a" stroke={INK} strokeWidth={5} />
        {[0, 1, 2].map((i) => <line key={i} x1={-46 + (i + 1) * 23} y1={-30} x2={-46 + (i + 1) * 23} y2={30} stroke="#3d4a57" strokeWidth={2.4} />)}
        <line x1={-46} y1={0} x2={46} y2={0} stroke="#3d4a57" strokeWidth={2.4} />
      </g>
    ))}
    <rect x={-52} y={-40} width={104} height={80} rx={12} fill="#9AA6B4" stroke={INK} strokeWidth={6} />
    <rect x={-40} y={-30} width={80} height={14} rx={6} fill="#C9D3DE" opacity={0.7} />
    <circle cx={0} cy={58} r={22} fill="#0c1120" stroke={INK} strokeWidth={5} />
    <circle cx={0} cy={58} r={11} fill={P.cyan} opacity={0.25 + 0.7 * glow + 0.1 * Math.sin(f / 3)} />
  </g>
);

const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t7 = b(7), t8 = b(8), t9 = b(9);
  const tx = (i: number) => lerp(-200 - i * 300, 800 - i * 300 + 120, ease(f, t7, 120));
  const ring = easeIO(f, t9, 52);
  const cx = 700, cy = 1150;
  const stars = Array.from({length: 70}, (_, i) => ({x: rnd(i + 1) * W, y: rnd(i + 200) * 960, r: 1 + rnd(i + 400) * 2.2}));
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.07, fx: 600, fy: 1000}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="3 OPERATIONAL FIRESATS · JULY" y={600} size={32} tone="ink" p={ease(f, t7 + 14, 8)} />
        <Plate x={540} text="GOAL · EVERY 20 MINUTES · EARLY 2030S" y={1230} size={30} dashed p={ease(f, t9 + 20, 8)} />
      </>}>
      <SVG>
        <defs>
          <linearGradient id="s3sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#05070F" /><stop offset="1" stopColor="#0B1020" /></linearGradient>
          <radialGradient id="s3earth" cx="0.5" cy="0.1" r="0.9"><stop offset="0" stopColor="#2E8FA3" /><stop offset="0.35" stopColor="#1B4F7A" /><stop offset="1" stopColor="#0A1A38" /></radialGradient>
          <clipPath id="s3c"><circle cx={540} cy={2500} r={1560} /></clipPath>
        </defs>
        <rect width={W} height={H} fill="url(#s3sky)" />
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={P.bone} opacity={0.35 + 0.4 * Math.abs(Math.sin(g / 20 + i))} />)}
        <circle cx={540} cy={2500} r={1585} fill={P.cyan} opacity={0.22} />
        <circle cx={540} cy={2500} r={1560} fill="url(#s3earth)" stroke={INK} strokeWidth={8} />
        <g clipPath="url(#s3c)">
          {Array.from({length: 7}).map((_, i) => <ellipse key={i} cx={200 + i * 150 + ((g * 0.4) % 150)} cy={960 + i * 90} rx={260} ry={22 + i * 4} fill={P.bone} opacity={0.12} />)}
          <path d="M-100,1120 C 300,1060 700,1060 1180,1120" fill="none" stroke={P.cyan} strokeWidth={14} opacity={0.35} />
          {Array.from({length: 40}).map((_, i) => <rect key={i} x={rnd(i) * W} y={1000 + rnd(i + 40) * 420} width={90} height={90} fill={i % 2 ? P.plateHi : P.plate} opacity={0.2} />)}
        </g>
        <path d="M60,1010 C 300,940 780,940 1020,1010" fill="none" stroke={P.cyan} strokeWidth={5} opacity={0.8} />
        {[2, 1, 0].map((i) => <FireSatSil key={i} x={tx(i)} y={850 + 6 * Math.sin(g / 30 + i) + i * 18} s={0.8} f={g} glow={f > t8 ? 1 : f > t7 + 20 + i * 18 ? 0.8 : 0.1} />)}
        {/* the dashed ring and the lit square it is centred on */}
        {ring > 0.02 && <DashRing x={cx} y={cy} r={ring * 520} f={g} />}
        {ring > 0.02 && <DashRing x={cx} y={cy} r={ring * 330} f={g + 40} o={0.5} />}
        <HotPixel x={cx} y={cy} s={54} f={g} k={ease(f, 4, 12)} id="s3h" rings={false} />
      </SVG>
    </Frame>
  );
};

// ---- S4: half and four (keys 10, 11, 12, 13) --------------------------------------------------------------------------------------------------
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t11 = b(11), t12 = b(12), t13 = b(13);
  const land = easeIO(f, 0, 22);
  const nPuff = Math.floor(50 * easeIO(f, t11, 56));
  const coinDrop = (i: number) => ease(f, t12 + i * 5, 14);
  const toTray = ease(f, t13, 22);
  const mapX = 150, mapY = 470, sc = 1.2;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 880}, {t: p.dur, z: 1.05, fx: 540, fy: 940}]);
  const slot = (i: number) => ({x: 640 + (i % 10) * 20, y: 1288 - Math.floor(i / 10) * 20});
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="ABOUT HALF OF U.S. WILDFIRE EMISSIONS" displayLines={['ABOUT HALF OF U.S.', 'WILDFIRE EMISSIONS', 'PER MIT TECHNOLOGY REVIEW']} y={895} size={28} tone="ink" p={ease(f, t11 + 6, 8)} />
        <Plate x={540} text="AROUND 4% OF FEDERAL FIREFIGHTING FUNDS" displayLines={['AROUND 4% OF FEDERAL', 'FIREFIGHTING FUNDS']} y={1022} size={28} tone="bone" p={ease(f, t12 + 4, 8)} />
      </>}>
      <SVG>
        <OrbitBG f={g} id="s4" cell={120} rivers={2} />
        <g opacity={0.9}>
          <AlaskaMini frame={g} x={mapX} y={mapY} scale={sc} pin={false} />
        </g>
        {/* the Interior half glows a low dull ember, and one brighter square sits in it */}
        <ellipse cx={mapX + 262 * sc} cy={mapY + 112 * sc} rx={150} ry={96} fill="#6A4A3A" opacity={0.55 * land} style={{mixBlendMode: 'screen'}} />
        <ellipse cx={mapX + 262 * sc} cy={mapY + 112 * sc} rx={150 * (2.2 - 1.2 * land)} ry={96 * (2.2 - 1.2 * land)} fill="none" stroke={P.bone} strokeWidth={5} strokeDasharray="20 14" strokeDashoffset={-g} opacity={0.9 * Math.min(1, land * 2)} />
        <HotPixel x={mapX + 262 * sc} y={mapY + 112 * sc} s={40} f={g} k={land} id="s4h" rings={false} />
        {/* fifty puffs in a column, a hundred-slot tray with four coins */}
        {Array.from({length: 100}).map((_, i) => <circle key={i} cx={170 + (i % 10) * 20} cy={1288 - Math.floor(i / 10) * 20} r={6.5} fill="none" stroke={P.boneDim} strokeWidth={1.8} opacity={0.35} />)}
        {Array.from({length: nPuff}).map((_, i) => <Puff key={i} x={170 + (i % 10) * 20} y={1288 - Math.floor(i / 10) * 20 + (1 - ease(f, t11 + i, 10)) * -40} r={9} f={g} ph={i} />)}
        <text x={540} y={1094} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={2} fill={P.bone} stroke={INK} strokeWidth={5} paintOrder="stroke" opacity={ease(f, t13, 8)}>OUT OF 100 · ILLUSTRATIVE</text>
        {Array.from({length: 100}).map((_, i) => <circle key={i} cx={slot(i).x} cy={slot(i).y} r={6.5} fill="none" stroke={P.boneDim} strokeWidth={1.8} opacity={0.35 * ease(f, t13 - 6, 10)} />)}
        {[0, 1, 2, 3].map((i) => {
          const dropY = lerp(1000 + i * 10, 1280, coinDrop(i));
          const sl = slot(i);
          const x = lerp(740 + i * 14, sl.x, toTray), y = lerp(dropY, sl.y, toTray);
          return coinDrop(i) > 0.02 ? <Coin key={i} x={x} y={y} s={lerp(0.4, 0.13, toTray)} /> : null;
        })}
        <Eye x={880} y={640} s={0.4} f={g} emotion={f > t12 + 6 ? 'straining' : 'searching'} strain={ease(f, t12 + 6, 6)} />
      </SVG>
    </Frame>
  );
};

// ---- S5: seeing and deciding (keys 14, 15) ----------------------------------------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t14 = b(14), t15 = b(15);
  const tick = snap(f, t14, 10);
  const dec = snap(f, t15, 10);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 900}, {t: p.dur, z: 1.09, fx: 540, fy: 940}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate text="SEEING" y={1030} size={44} tone="bone" p={ease(f, t14, 8)} x={470} />
        <Plate text="DECIDING" y={1150} size={44} dashed p={ease(f, t15, 8)} x={540} drop={36} />
      </>}>
      <SVG>
        <OrbitBG f={g} id="s5bg" cell={130} rivers={2} y0={0} y1={H} drift={0.6} />
        <rect width={W} height={H} fill={P.void} opacity={0.5} />
        {Array.from({length: 40}).map((_, i) => <circle key={i} cx={rnd(i) * W} cy={rnd(i + 100) * H} r={1.4 + rnd(i + 200) * 2} fill={P.bone} opacity={0.2 + 0.3 * Math.abs(Math.sin(g / 24 + i))} />)}
        <Eye x={540} y={700} s={1.45} f={g} emotion={f >= t15 ? 'waiting' : 'found'} lock={f >= t15 ? 0 : 0.7 * tick} accent={0.2 * tick} />
        <HotPixel x={170} y={1030} s={58} f={g} k={tick} id="s5h" rings={false} />
        {tick > 0.1 && <path d="M690,1030 l20,22 l40,-48" fill="none" stroke={P.bone} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" opacity={tick} transform="translate(30,0)" />}
        <QMark x={830} y={1130} f={g} size={96} k={dec} />
      </SVG>
    </Frame>
  );
};

// ---- S6: the seventy two hour clock (keys 16, 17, 18, 19, 20) ----------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t17 = b(17), t18 = b(18), t19 = b(19), t20 = b(20);
  const inK = ease(f, 0, 30);
  const box = snap(f, t17, 12);
  const walk = easeIO(f, t18 - 12, 40);
  const fire = snap(f, t19, 12);
  const left = 1;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 900}, {t: p.dur, z: 1.09, fx: 560, fy: 960}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="YUKON FLATS" y={560} size={32} tone="ice" p={ease(f, 6, 8) * (1 - ease(f, t17, 6))} />
        <Plate x={540} text="1.6 MILLION ACRES · A PILOT" y={640} size={34} tone="ink" p={ease(f, t17 + 6, 8)} />
        <Plate x={540} text="ATTACK ONLY IF CONTAINED IN 72 HOURS" displayLines={['ATTACK ONLY IF', 'CONTAINED IN 72 HOURS']} y={1210} size={34} tone="bone" p={ease(f, t20, 8)} />
      </>}>
      <SVG>
        <OrbitBG f={g} id="s6" cell={100} rivers={7} drift={1.4} />
        <path d="M150,640 C 330,560 700,560 930,680 C 1010,820 990,1040 900,1160 C 700,1260 330,1250 170,1120 C 90,980 90,760 150,640 Z" fill="none" stroke={P.bone} strokeWidth={5} strokeDasharray="22 14" strokeDashoffset={-g * 0.5} opacity={0.8 * inK} />
        <g opacity={box}>
          <rect x={380} y={760} width={400} height={330} fill="#BFE3F2" opacity={0.14} />
          <rect x={380} y={760} width={400} height={330} fill="none" stroke={P.bone} strokeWidth={7} />
          <rect x={380} y={760} width={400} height={330} fill="none" stroke={P.cyan} strokeWidth={2.6} strokeDasharray="12 10" strokeDashoffset={-g} />
        </g>
        {[0, 1, 2, 3, 4].map((i) => <Crew key={i} x={lerp(-80, 330, walk)} y={790 + i * 66 + (1 - walk) * i * 12} s={1.15} f={g} ph={i} />)}
        <HotPixel x={600} y={920} s={96} f={g} k={fire} id="s6h" />
        <ClockRing x={600} y={920} r={150} left={left} f={g} k={fire} label="72 HR" />
      </SVG>
    </Frame>
  );
};

// ---- S7: ten minutes (keys 21, 22, 23) --------------------------------------------------------------------------------------------------------
const Drone: React.FC<{x: number; y: number; f: number; rot?: number}> = ({x, y, f, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(1.5)`}>
    <ellipse cx={4} cy={42} rx={34} ry={8} fill="#000" opacity={0.3} />
    {[[-34, -24], [34, -24], [-34, 24], [34, 24]].map(([dx, dy], i) => (
      <g key={i}>
        <line x1={0} y1={0} x2={dx} y2={dy} stroke={INK} strokeWidth={7} strokeLinecap="round" />
        <ellipse cx={dx} cy={dy} rx={22} ry={7 + 2 * Math.sin(f * 2.4 + i)} fill="#C9D3DE" opacity={0.65} stroke={INK} strokeWidth={3} />
      </g>
    ))}
    <rect x={-17} y={-13} width={34} height={26} rx={9} fill="#9AA6B4" stroke={INK} strokeWidth={5} />
  </g>
);

const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t22 = b(22), t23 = b(23);
  const boot = ease(f, 0, 12);
  const race = easeIO(f, t22, Math.max(24, t23 - t22 - 4));
  const wp: Array<[number, number]> = [[190, 1060], [320, 900], [470, 1070], [610, 880], [790, 990]];
  const seg = Math.min(wp.length - 2, Math.floor(race * (wp.length - 1)));
  const lt = race * (wp.length - 1) - seg;
  const dx = lerp(wp[seg][0], wp[seg + 1][0], lt), dy = lerp(wp[seg][1], wp[seg + 1][1], lt) + 14 * Math.sin(f / 5);
  const det = snap(f, t23, 10);
  const hand = f < t23 ? easeIO(f, 0, t23) * 5.2 : 5.2;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 940}, {t: p.dur, z: 1.06, fx: 560, fy: 980}]);
  const decoys: Array<[number, number]> = [[320, 900], [610, 880], [470, 1070]];
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="XPRIZE · ALASKA · JUNE · 10 MINUTES" y={570} size={30} tone="ink" p={ease(f, 8, 8)} />
        <Plate x={540} text="AURA FORESIGHT · MET THE DETECTION GATE" displayLines={['AURA FORESIGHT', 'MET THE DETECTION GATE']} y={1150} size={30} tone="bone" p={ease(f, t23 + 6, 8)} />
        <Plate text="PUT OUT · NO RESULT STATED" y={1262} size={26} dashed p={ease(f, t23 + 14, 8)} x={640} />
      </>}>
      <SVG>
        <OrbitBG f={g} id="s7bg" cell={110} rivers={3} y0={0} y1={H} />
        <rect width={W} height={H} fill="#06091A" opacity={0.4} />
        <clipPath id="s7clip"><rect x={70} y={790} width={940} height={440} /></clipPath>
        <g clipPath="url(#s7clip)" opacity={boot}>
          <OrbitBG f={g} id="s7" cell={80} rivers={3} y0={760} y1={1260} />
          {decoys.map(([x, y], i) => <rect key={i} x={x - 18} y={y - 18} width={36} height={36} fill="#C9A24A" opacity={0.45 + 0.25 * Math.sin(g / 8 + i * 2) + (Math.abs(dx - x) < 60 && Math.abs(dy - y) < 60 ? 0.3 : 0)} stroke={INK} strokeWidth={4} />)}
          <HotPixel x={800} y={990} s={64} f={g} k={ease(f, 4, 12)} id="s7h" />
          <Drone x={dx} y={dy} f={g} rot={8 * Math.sin(g / 9)} />
        </g>
        <path d="M70,790 h940 v440 h-940 Z" fill="none" stroke={INK} strokeWidth={12} />
        <path d="M70,790 h940 v440 h-940 Z" fill="none" stroke={P.cyan} strokeWidth={3} opacity={0.7} />
        {/* the stopwatch: a ring with a gate tick and a hand, no numerals */}
        <g transform="translate(540,700)" opacity={boot}>
          <circle r={74} fill="#0B1020" stroke={INK} strokeWidth={8} />
          <circle r={74} fill="none" stroke={P.bone} strokeWidth={4} />
          {Array.from({length: 10}).map((_, i) => <line key={i} x1={0} y1={-66} x2={0} y2={-56} stroke={P.bone} strokeWidth={4} transform={`rotate(${i * 36})`} />)}
          <line x1={0} y1={-82} x2={0} y2={-52} stroke={P.cyan} strokeWidth={8} transform="rotate(190)" />
          <line x1={0} y1={6} x2={0} y2={-58} stroke={P.hot} strokeWidth={7} strokeLinecap="round" transform={`rotate(${hand * 57.3})`} />
          <circle r={7} fill={P.bone} stroke={INK} strokeWidth={3} />
          <text x={96} y={10} textAnchor="start" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={2} fill={P.bone} stroke={INK} strokeWidth={5} paintOrder="stroke">10 MIN</text>
        </g>
        {/* DETECTED flag */}
        {det > 0.02 && (
          <g transform={`translate(780,${990 - 56 * det})`} opacity={Math.min(1, det * 2)}>
            <line x1={0} y1={0} x2={0} y2={-70} stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <path d={`M0,-70 h${190 * det} l-16,22 l16,22 h${-190 * det} Z`} fill={P.bone} stroke={INK} strokeWidth={5} />
            {det > 0.7 && <text x={14} y={-48} fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1.4} fill={INK}>DETECTED</text>}
          </g>
        )}
        {/* the put-out ring beside it stays empty */}
        <DashRing x={330} y={1256} r={36} f={g} w={5} o={ease(f, t23 + 14, 8)} />
      </SVG>
    </Frame>
  );
};

// ---- S8: a plan and a plunge (keys 24, 25, 26, 27) --------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t24 = b(24), t25 = b(25), t26 = b(26), t27 = b(27);
  const pane = ease(f, t24, 20);
  const wing = ease(f, t25, 26);
  const swap = easeIO(f, t26 - 4, 18);
  const strike = ease(f, t26 + 12, 12);
  const fall = easeIn(f, t27, Math.max(20, p.dur - t27));
  const cam = (ff: number): Cam => {
    const z = 1 + 0.06 * easeIO(ff, 0, t27) + 4.5 * easeIn(ff, t27, Math.max(20, p.dur - t27));
    return {z, fx: lerp(540, 540, fall), fy: lerp(950, 1000, fall)};
  };
  const eyeX = lerp(300, -260, swap);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="EDF · INTENDS TO BUILD · AI TRIAGE TOOL" displayLines={['EDF · INTENDS TO BUILD', 'AI TRIAGE TOOL']} y={620} size={32} dashed p={ease(f, t24 + 10, 8) * (1 - swap)} />
        <Plate text="ACRES" x={540} y={846} size={40} tone="bone" p={swap} />
        <Plate x={540} text="ACRES BURNED · THE WRONG NUMBER?" displayLines={['ACRES BURNED', 'THE WRONG NUMBER?']} y={700} size={36} tone="ink" p={ease(f, t26 + 2, 8) * (1 - fall)} />
        <TileMosaic cover={clamp01((fall - 0.45) * 2.2)} />
      </>}>
      <SVG>
        <OrbitBG f={g} id="s8" cell={110} rivers={2} y0={0} y1={H} />
        {/* the glass pane with a dashed edge */}
        <g opacity={pane * (1 - swap)} transform={`translate(${lerp(0, 380, swap)},0)`}>
          <rect x={560} y={760} width={420} height={380} rx={10} fill="#9FD8E6" opacity={0.16} />
          <rect x={560} y={760} width={420} height={380} rx={10} fill="none" stroke={P.bone} strokeWidth={5} strokeDasharray="16 10" strokeDashoffset={-g} />
          <rect x={572} y={772} width={150} height={26} rx={6} fill="#fff" opacity={0.12} />
          {[0, 1, 2].map((i) => <rect key={i} x={600} y={820 + i * 42} width={300 - i * 50} height={14} rx={6} fill={P.boneDim} opacity={0.4} />)}
          <circle cx={770} cy={1050} r={44} fill="none" stroke={P.bone} strokeWidth={5} strokeDasharray="10 8" />
          <text x={770} y={1060} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={P.bone} opacity={0.8}>?</text>
          <rect x={540} y={1130} width={440} height={16} fill="#000" opacity={0.25} />
        </g>
        {wing > 0.02 && (
          <path d={`M${eyeX + 232},900 L${lerp(eyeX + 232, 770, wing)},${lerp(900, 1050, wing)} L${lerp(eyeX + 232, 960, wing)},${lerp(900, 1100, wing)}`} fill="none" stroke={P.bone} strokeWidth={5} strokeDasharray="12 9" strokeDashoffset={-g * 1.4} opacity={0.9 * (1 - swap)} strokeLinecap="round" />
        )}
        <Eye x={eyeX} y={880} s={1.0} f={g} emotion={wing > 0.3 && wing < 1 ? 'straining' : 'searching'} strain={wing * 0.6} />
        {/* the hot square and its struck counter */}
        <HotPixel x={540} y={1010} s={190} f={g} k={swap} id="s8h" />
        {swap > 0.05 && (
          <g opacity={swap}>
            <line x1={400} y1={846} x2={400 + 280 * strike} y2={846} stroke={P.hot} strokeWidth={9} strokeLinecap="round" />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S9: frozen against three times deeper (keys 28, 29, 31, 32, 33) ------------------------------------------------------------------------------
const GROUND_Y = 760, FT = 150, COL_H = 540;
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t29 = b(29), t31 = b(31), t32 = b(32), t33 = b(33);
  const rise = ease(f, 0, 30);
  const dropL = easeIn(f, t29 - 16, 16);
  const depthL = f < t29 - 16 ? -230 : lerp(-230, 150, dropL);
  const jolt = f >= t29 ? Math.max(0, 1 - (f - t29) / 14) : 0;
  const wake = ease(f, t29 + 22, 30);
  const approach = easeIO(f, t31, 40);
  const plunge = easeIn(f, t32 - 6, 30);
  const depthR = f < t31 ? -230 : f < t32 - 6 ? lerp(-230, -40, approach) : lerp(-40, 475, plunge);
  const landed = f >= t33 - 4 ? Math.max(0, 1 - (f - (t33 - 4)) / 16) : 0;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.07, fx: 540, fy: 1010}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate text="UNBURNED · FROZEN ABOUT A FOOT DOWN" displayLines={['UNBURNED', 'FROZEN ABOUT', 'A FOOT DOWN']} x={180} y={600} size={24} tone="ice" p={ease(f, t29 + 4, 8)} />
        <Plate text="BURN SCAR · JULY 2021" displayLines={['BURN SCAR', 'JULY 2021']} x={870} y={560} size={26} tone="ink" p={ease(f, t31 + 4, 8) * (1 - ease(f, t33 - 6, 6))} />
        <Plate text="AT LEAST 3 TIMES DEEPER" displayLines={['AT LEAST', '3 TIMES DEEPER']} x={878} y={700} size={26} tone="hot" p={ease(f, t33, 8)} />
        <TileMosaic cover={1 - clamp01(f / 44)} ground />
      </>}>
      <SVG>
        <rect width={W} height={H} fill="#0F1A2E" />
        <defs><linearGradient id="s9bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B3358" /><stop offset="0.5" stopColor="#14264A" /><stop offset="1" stopColor="#0B1020" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#s9bg)" />
        <g transform={`translate(0,${(1 - rise) * 520})`} opacity={rise}>
          <SoilColumn x={260} y={GROUND_Y} w={320} h={COL_H} f={g} ftPx={FT} thawDepth={FT / COL_H} burned={false} ruler={false} id="s9l" />
          <SoilColumn x={700} y={GROUND_Y} w={380} h={COL_H} f={g} ftPx={FT} thawDepth={475 / COL_H} burned ruler glow={0.25 + 0.75 * wake} carbon={0.35} id="s9r" />
          {/* the one-foot line across both cuts */}
          <line x1={100} y1={GROUND_Y + FT} x2={372} y2={GROUND_Y + FT} stroke={P.bone} strokeWidth={3.4} strokeDasharray="14 9" strokeDashoffset={-g * 0.8} opacity={0.8} />
          <line x1={540} y1={GROUND_Y + FT} x2={910} y2={GROUND_Y + FT} stroke={P.bone} strokeWidth={3.4} strokeDasharray="14 9" strokeDashoffset={-g * 0.8} opacity={0.8} />
          {/* the square at the foot of each cut */}
          <HotPixel x={260} y={GROUND_Y + COL_H - 40} s={30} f={g} dark={0.6} k={1} id="s9pl" rings={false} glow={0.4} />
          <HotPixel x={700} y={GROUND_Y + COL_H - 40} s={30} f={g} dark={0.6} k={1} id="s9pr" rings={false} glow={0.4} />
        </g>
        <g data-band="ok">
          <rect data-band="ok" x={0} y={1340} width={W} height={H - 1340} fill="#1E3A5C" />
          {Array.from({length: 6}).map((_, i) => <path key={i} d={`M0,${1370 + i * 62} C 220,${1350 + i * 62} 420,${1400 + i * 62} 640,${1374 + i * 62} S 940,${1360 + i * 62} 1080,${1380 + i * 62}`} fill="none" stroke={i % 2 ? '#9FD8E6' : '#5C9DB4'} strokeWidth={i % 2 ? 4 : 9} opacity={0.45} />)}
          <line x1={0} y1={1340} x2={W} y2={1340} stroke={INK} strokeWidth={7} />
        </g>
        <ThawProbe x={330} y={GROUND_Y} depth={depthL} f={g} ftPx={FT} len={520} jolt={jolt} id="s9pL" />
        <ThawProbe x={700 + (f > t29 + 22 && f < t31 ? 3 * Math.sin(f * 1.9) * wake : 0)} y={GROUND_Y} depth={depthR} f={g} ftPx={FT} len={520} jolt={landed} id="s9pR" />
        {jolt > 0.3 && Array.from({length: 5}).map((_, i) => <circle key={i} cx={330 + (i - 2) * 16} cy={GROUND_Y + 150 - (f - t29) * (2 + i) * 1.2} r={4} fill={P.iceHi ?? '#E3F6FB'} opacity={jolt} />)}
        <Eye x={930} y={470} s={0.34} f={g} emotion={f > t32 - 6 ? 'straining' : 'waiting'} strain={landed} />
      </SVG>
    </Frame>
  );
};

// ---- S10: two million tons (keys 34, 35, 36) -------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t35 = b(35), t36 = b(36);
  const plate = ease(f, 14, 8);
  const roll = easeIO(f, t35, 52);
  const sink = easeIO(f, t36, 36);
  const motes = Array.from({length: 46}, (_, i) => {
    const ph = ((g / 120) + rnd(i + 7)) % 1;
    const x = lerp(160 + rnd(i) * 620, 640 + rnd(i + 3) * 420, ph);
    const y = lerp(1250, 330, ph) + 30 * Math.sin(g / 14 + i);
    return {x, y, o: Math.sin(ph * Math.PI) * (0.35 + 0.65 * Math.min(1, (i + 1) / 46 + roll))};
  });
  const cnt = roll < 0.98 ? Math.round(2000000 * roll).toLocaleString('en-US') : '2 MILLION+';
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.08, fx: 540, fy: 1060}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="2007 ANAKTUVUK RIVER FIRE" y={560} size={30} tone="ink" p={plate} />
        <g opacity={ease(f, t35, 8) * (1 - ease(f, t36 + 4, 8))}>
          <rect x={150} y={760} width={780} height={150} rx={8} fill="#0B1020" stroke={INK} strokeWidth={6} opacity={0.92} />
          <text x={540} y={846} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={cnt.length > 10 ? 64 : 74} letterSpacing={3} fill={P.hotCore}>{cnt}</text>
          <text x={540} y={890} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={3} fill={P.bone}>TONS OF CARBON</text>
        </g>
        <Plate x={540} text="THE LOSS IS THE GROUND · OUR READ" displayLines={['THE LOSS IS THE GROUND', 'OUR READ']} y={700} size={32} tone="bone" p={ease(f, t36 + 6, 8)} />
      </>}>
      <SVG>
        <defs>
          <linearGradient id="s10sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A2230" /><stop offset="0.55" stopColor="#6B4A3C" /><stop offset="1" stopColor="#C98A4A" /></linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#s10sky)" />
        {/* distant smoke plumes */}
        {Array.from({length: 4}).map((_, i) => Array.from({length: 7}).map((__, j) => <Puff key={`${i}-${j}`} x={160 + i * 270 + 18 * Math.sin(g / 30 + j)} y={1010 - j * 78 - ((g * 0.5 + i * 40) % 40)} r={34 + j * 7} f={g} ph={i + j} />))}
        {/* far and mid burned ridges */}
        <path d="M0,1040 C 180,990 330,1050 540,1000 S 900,1030 1080,990 L1080,1400 L0,1400 Z" fill="#3A302C" stroke={INK} strokeWidth={5} />
        <path d="M0,1110 C 220,1070 420,1130 620,1090 S 940,1120 1080,1080 L1080,1400 L0,1400 Z" fill="#2B2623" stroke={INK} strokeWidth={6} />
        {Array.from({length: 38}).map((_, i) => <path key={i} d={`M${rnd(i + 50) * W},${1090 + rnd(i + 90) * 30} l${(rnd(i + 130) - 0.5) * 10},${-30 - rnd(i + 170) * 40}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />)}
        {/* the hot square sinks through the char into the peat, behind the front ground */}
        <HotPixel x={540} y={lerp(1120, 1330, sink)} s={116} f={g} k={1} dark={sink} id="s10h" rings={sink < 0.5} />
        <path d="M0,1230 C 160,1210 340,1250 540,1230 S 900,1210 1080,1240 L1080,1480 L0,1480 Z" fill="#2B2623" stroke={INK} strokeWidth={7} />
        <path d="M0,1262 C 200,1250 380,1280 580,1262 S 900,1250 1080,1270 L1080,1480 L0,1480 Z" fill={TH.peat} stroke={INK} strokeWidth={6} />
        <path d="M0,1340 C 200,1320 420,1370 640,1340 S 940,1330 1080,1350 L1080,1920 L0,1920 Z" fill="#1B1715" stroke={INK} strokeWidth={6} />
        <path d="M0,1470 C 220,1450 460,1500 700,1470 S 960,1460 1080,1480 L1080,1920 L0,1920 Z" fill="#120F0E" stroke={INK} strokeWidth={6} />
        {Array.from({length: 9}).map((_, i) => <path key={i} d={`M${60 + i * 125},${1520 + (i % 3) * 40} l${(i % 2 ? 1 : -1) * 6},${-70 - (i * 37) % 50} l16,0 Z`} fill="#0B0908" stroke={INK} strokeWidth={4} />)}
        {Array.from({length: 24}).map((_, i) => <circle key={i} cx={rnd(i + 11) * W} cy={1400 + rnd(i + 41) * 480} r={2 + rnd(i + 61) * 4} fill={P.hotRim} opacity={0.2 + 0.4 * Math.abs(Math.sin(g / 15 + i))} />)}
        {/* amber carbon motes lifting off */}
        {motes.map((m, i) => (
          <g key={i} opacity={m.o} transform={`translate(${m.x},${m.y})`}>
            <circle r={8} fill={P.hotRim} stroke={INK} strokeWidth={2.6} /><circle r={3.2} cx={-2} cy={-2} fill={P.hotCore} />
          </g>
        ))}
      </SVG>
    </Frame>
  );
};

// ---- S11: the fair doubt (keys 37, 38) --------------------------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t38 = b(38);
  const cold = ease(f, 0, 30);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.05, fx: 540, fy: 1060}]);
  const crew = [-210, -70, 70, 210];
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="MICHELLE MACK · NORTHERN ARIZONA UNIVERSITY" displayLines={['MICHELLE MACK', 'NORTHERN ARIZONA UNIVERSITY']} y={600} size={30} tone="bone" p={ease(f, 10, 8)} />
        <Plate x={540} text="MACK · SUPPRESSION IMPACT NOT CLEAR" y={1230} size={30} tone="ink" p={ease(f, t38, 8)} />
        <rect width={W} height={H} fill="#9FD8E6" opacity={0.1 * cold} />
      </>}>
      <SVG>
        <defs><linearGradient id="s11bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B7DCE8" /><stop offset="1" stopColor="#4F7FA0" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#s11bg)" />
        {Array.from({length: 30}).map((_, i) => <path key={i} d={`M${rnd(i) * W},${rnd(i + 60) * 700 + 700} l${(rnd(i + 9) - 0.5) * 40},${(rnd(i + 19) - 0.5) * 40}`} stroke="#EAF7FB" strokeWidth={3} opacity={0.4} strokeLinecap="round" />)}
        <SoilColumn x={540} y={820} w={620} h={620} f={g} ftPx={150} thawDepth={0.84} burned ruler={false} id="s11c" glow={0} />
        <HotPixel x={540} y={820 + 470} s={64} f={g} dark={1} k={1} id="s11h" rings={false} glow={0.2} />
        <g data-band="ok">
          <rect data-band="ok" x={0} y={1440} width={W} height={H - 1440} fill="#2A4A66" />
          {Array.from({length: 6}).map((_, i) => <path key={i} d={`M0,${1440 + 30 + i * 62} C 220,${1440 + 10 + i * 62} 420,${1440 + 60 + i * 62} 640,${1440 + 34 + i * 62} S 940,${1440 + 20 + i * 62} 1080,${1440 + 40 + i * 62}`} fill="none" stroke={i % 2 ? '#9FD8E6' : '#5C9DB4'} strokeWidth={i % 2 ? 4 : 9} opacity={0.55} />)}
          {Array.from({length: 14}).map((_, i) => <ellipse key={i} cx={rnd(i + 7) * W} cy={1440 + 30 + rnd(i + 17) * (H - 1440 - 60)} rx={40 + rnd(i + 27) * 80} ry={5} fill="#E3F6FB" opacity={0.5} />)}
          <line x1={0} y1={1440} x2={W} y2={1440} stroke={INK} strokeWidth={7} />
        </g>

        {/* hoses spray at the ground and the water fades down toward an empty dashed ring */}
        {crew.map((dx, i) => <Crew key={i} x={540 + dx} y={770} s={1.05} f={g} ph={i * 1.3} spray={0.9} />)}
        {crew.map((dx, i) => <line key={i} x1={540 + dx + 60} y1={806} x2={540 + dx * 0.4 + 40} y2={1130} stroke="#BFE3F2" strokeWidth={4} strokeDasharray="10 14" strokeDashoffset={-g * 2.4} opacity={0.55} strokeLinecap="round" />)}
        <DashRing x={540} y={1290} r={44} f={g} o={ease(f, t38 - 8, 10)} />
        <QMark x={540} y={1290} f={g} size={70} k={ease(f, t38 - 4, 10)} />
      </SVG>
    </Frame>
  );
};

// ---- S12: if and if not (keys 39, 40) ---------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t40 = b(40);
  const sink1 = easeIO(f, 18, 90);
  const snapBack = ease(f, t40 + 4, 10);
  const sink2 = easeIO(f, t40 + 10, 80);
  const thawL = f < t40 ? lerp(0.24, 0.72, sink1) : lerp(0.72, 0.9, sink2);
  const thawF = f < t40 ? lerp(0.24, 0.72, sink1) : lerp(0.72, 0.24, snapBack);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1020}, {t: p.dur, z: 1.05, fx: 540, fy: 1050}]);
  const flash = f >= t40 && f < t40 + 8 ? 0.35 * (1 - (f - t40) / 8) : 0;
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="IF THE DOUBT HOLDS" y={540} size={34} tone="ink" p={ease(f, 4, 8) * (f < t40 ? 1 : 0)} />
        <Plate x={540} text="IF THE DOUBT IS WRONG" y={620} size={34} tone="bone" p={ease(f, t40, 8)} />
        <Plate text="FOUGHT" x={290} y={720} size={30} tone="ice" p={ease(f, 12, 8)} />
        <Plate text="LEFT" x={790} y={790} size={30} tone="ink" p={ease(f, 12, 8)} />
        <rect width={W} height={H} fill={P.bone} opacity={flash} />
      </>}>
      <SVG>
        <defs><linearGradient id="s12bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#14264A" /><stop offset="1" stopColor="#0B1020" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#s12bg)" />
        <line x1={540} y1={600} x2={540} y2={1400} stroke={P.bone} strokeWidth={4} strokeDasharray="10 12" opacity={0.5} />
        <SoilColumn x={290} y={860} w={380} h={470} f={g} ftPx={150} thawDepth={thawF} burned ruler={false} id="s12a" glow={0.5} carbon={0.2} />
        <SoilColumn x={790} y={860} w={380} h={470} f={g} ftPx={150} thawDepth={thawL} burned ruler={false} id="s12b" glow={0.5} carbon={0.2} />
        <line x1={100} y1={860 + 150} x2={980} y2={860 + 150} stroke={P.bone} strokeWidth={3} strokeDasharray="14 9" opacity={0.55} />
        <g data-band="ok">
          <rect data-band="ok" x={0} y={1340} width={W} height={H - 1340} fill="#2A4A66" />
          {Array.from({length: 6}).map((_, i) => <path key={i} d={`M0,${1340 + 30 + i * 62} C 220,${1340 + 10 + i * 62} 420,${1340 + 60 + i * 62} 640,${1340 + 34 + i * 62} S 940,${1340 + 20 + i * 62} 1080,${1340 + 40 + i * 62}`} fill="none" stroke={i % 2 ? '#9FD8E6' : '#5C9DB4'} strokeWidth={i % 2 ? 4 : 9} opacity={0.55} />)}
          {Array.from({length: 14}).map((_, i) => <ellipse key={i} cx={rnd(i + 7) * W} cy={1340 + 30 + rnd(i + 17) * (H - 1340 - 60)} rx={40 + rnd(i + 27) * 80} ry={5} fill="#E3F6FB" opacity={0.5} />)}
          <line x1={0} y1={1340} x2={W} y2={1340} stroke={INK} strokeWidth={7} />
        </g>

        <Crew x={250} y={810} s={1.1} f={g} spray={0.95} ph={0.4} />
        <Crew x={340} y={810} s={1.1} f={g} spray={0.95} ph={1.7} />
        <HotPixel x={290} y={770} s={46} f={g} id="s12h1" rings={false} />
        <HotPixel x={790} y={770} s={46} f={g} id="s12h2" rings={false} />
        {Array.from({length: 4}).map((_, i) => <Puff key={i} x={790 + 12 * Math.sin(g / 20 + i)} y={730 - i * 52 - ((g * 0.7) % 52)} r={26 + i * 4} f={g} ph={i} />)}
      </SVG>
    </Frame>
  );
};

// ---- S13: three roads (keys 41, 42, 43, 44) ---------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t42 = b(42), t43 = b(43), t44 = b(44);
  const arrive = snap(f, 2, 12);
  const road = (k: number) => ease(f, k, 14);
  const rd = (dx: number, top: number) => `M540,1140 C 540,1000 ${540 + dx * 0.4},880 ${540 + dx},${top}`;
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.06, fx: 540, fy: 900}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate text="FIGHT" x={210} y={700} size={34} tone="bone" p={road(t42)} />
        <Plate text="LEAVE" x={540} y={580} size={34} tone="bone" p={road(t43)} />
        <Plate text="SET A MILD FIRE" x={850} y={790} size={30} tone="bone" p={road(t44)} />
      </>}>
      <SVG>
        <OrbitBG f={g} id="s13" cell={110} rivers={3} />
        {/* ridge shading so the fork reads as land lit by one square */}
        <path d="M0,820 L180,740 L320,820 L460,700 L600,830 L780,720 L1080,830 L1080,1000 L0,1000 Z" fill="#0B1020" opacity={0.35} />
        {([[-330, 700, t42], [0, 600, t43], [310, 800, t44]] as Array<[number, number, number]>).map(([dx, top, tk], i) => (
          <g key={i}>
            <path d={rd(dx, top)} fill="none" stroke={INK} strokeWidth={28} strokeLinecap="round" opacity={0.7} />
            <path d={rd(dx, top)} fill="none" stroke={P.boneDim} strokeWidth={14} strokeLinecap="round" strokeDasharray="22 16" strokeDashoffset={-g} opacity={0.4 + 0.5 * road(tk)} />
          </g>
        ))}
        {road(t42) > 0.05 && <ClockRing x={210 + 0} y={820} r={54} left={0.7} f={g} k={road(t42)} label="" />}
        {road(t43) > 0.05 && Array.from({length: 5}).map((_, i) => <Puff key={i} x={540 + 16 * Math.sin(g / 18 + i)} y={880 - i * 54 - ((g * 0.8) % 54)} r={26 + i * 3} f={g} ph={i} />)}
        {road(t44) > 0.05 && <Flame x={690} y={940} s={0.5} f={g} k={road(t44)} />}
        <HotPixel x={540} y={1170} s={104} f={g} k={arrive} id="s13h" />
      </SVG>
    </Frame>
  );
};

// ---- S14: mild fire (keys 45, 46, 47) ---------------------------------------------------------------------------------------------------------
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t46 = b(46), t47 = b(47);
  const typeK = clamp01((f - t46) / Math.max(30, t47 - t46 + 6));
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.07, fx: 560, fy: 1040}]);
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="EDWARD ALEXANDER · GWICH'IN COUNCIL INTERNATIONAL" displayLines={['EDWARD ALEXANDER', "GWICH'IN COUNCIL INTERNATIONAL"]} y={580} size={26} tone="bone" p={ease(f, 12, 8)} />
        <QuotePlate text={'"WE NEED MILD FIRE, NOT WILDFIRE."'} y={800} size={44} wrap={18} p={ease(f, t46, 8)} type={typeK} />
        <Plate x={540} text="MILD FIRE · THE IDEA" y={1040} size={28} tone="ice" p={ease(f, t47 + 20, 8)} />
      </>}>
      <SVG>
        <defs>
          <linearGradient id="s14sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FC3D6" /><stop offset="0.6" stopColor="#E9DFC4" /><stop offset="1" stopColor="#F6D79A" /></linearGradient>
          <radialGradient id="s14sun" cx="0.3" cy="0.62" r="0.7"><stop offset="0" stopColor="#FFF4C2" stopOpacity={0.85} /><stop offset="1" stopColor="#FFF4C2" stopOpacity={0} /></radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#s14sky)" />
        <rect width={W} height={H} fill="url(#s14sun)" />
        {/* far spruce line and birch stand */}
        {Array.from({length: 40}).map((_, i) => { const x = i * 29 - 20 + 6 * Math.sin(g / 60 + i); const h = 90 + rnd(i) * 80; return <path key={i} d={`M${x},1150 L${x + 14},${1150 - h} L${x + 28},1150 Z`} fill="#2C4A3A" stroke={INK} strokeWidth={3} opacity={0.9} />; })}
        {[120, 300, 880, 1000].map((x, i) => (
          <g key={i} transform={`translate(${x + 4 * Math.sin(g / 70 + i)},0)`}>
            <rect x={-9} y={760} width={18} height={400} fill="#EFE9D8" stroke={INK} strokeWidth={4} />
            {[0, 1, 2, 3, 4].map((j) => <rect key={j} x={-9} y={800 + j * 70 + (i * 17) % 30} width={18} height={9} fill={INK} />)}
            <circle cx={0} cy={740} r={70} fill={P.green} opacity={0.78} stroke={INK} strokeWidth={4} />
          </g>
        ))}
        <path d="M0,1130 C 200,1100 400,1150 620,1120 S 920,1100 1080,1130 L1080,1480 L0,1480 Z" fill={P.tan} stroke={INK} strokeWidth={6} />
        <path d="M0,1180 C 240,1150 460,1200 700,1170 S 960,1160 1080,1190 L1080,1480 L0,1480 Z" fill={P.green} stroke={INK} strokeWidth={6} opacity={0.9} />
        <ellipse cx={420} cy={1260} rx={380} ry={26} fill="#fff" opacity={0.14} />
        <ellipse cx={700} cy={1196} rx={240 * snap(f, t47, 10)} ry={46 * snap(f, t47, 10)} fill={P.hotCore} opacity={0.32 * snap(f, t47, 10)} style={{mixBlendMode: 'screen'}} />
        <Flame x={700} y={1190} s={0.9} f={g} k={snap(f, t47, 10)} />
        <path d="M0,1420 C 200,1390 420,1450 660,1415 S 960,1400 1080,1430 L1080,1920 L0,1920 Z" fill="#5A4630" stroke={INK} strokeWidth={7} />
        <path d="M0,1520 C 240,1490 500,1550 760,1510 S 980,1500 1080,1520 L1080,1920 L0,1920 Z" fill="#3E2F20" stroke={INK} strokeWidth={7} />
        {Array.from({length: 26}).map((_, i) => <ellipse key={i} cx={rnd(i + 5) * W} cy={1450 + rnd(i + 15) * 420} rx={40 + rnd(i + 25) * 70} ry={14 + rnd(i + 35) * 20} fill={i % 3 ? '#5C7A3E' : '#7BC47F'} opacity={0.75} stroke={INK} strokeWidth={3} />)}
        {Array.from({length: 18}).map((_, i) => <g key={i} transform={`translate(${60 + rnd(i + 45) * 960},${1470 + rnd(i + 55) * 380})`}><line x1={0} y1={0} x2={0} y2={-50} stroke="#3E6A3A" strokeWidth={5} /><circle cy={-58} r={10} fill="#C2336F" stroke={INK} strokeWidth={3} /><circle cy={-72} r={8} fill="#E06A9A" stroke={INK} strokeWidth={3} /></g>)}
        {Array.from({length: 70}).map((_, i) => { const x = (i / 69) * W; const h = 40 + rnd(i + 3) * 70; return <path key={i} d={`M${x},1500 Q${x + 6 * Math.sin(g / 30 + i)},${1500 - h * 0.6} ${x + 14 * Math.sin(g / 22 + i * 0.7)},${1500 - h}`} stroke={i % 3 ? '#4F8A4F' : '#7BC47F'} strokeWidth={6} fill="none" strokeLinecap="round" />; })}
      </SVG>
    </Frame>
  );
};

// ---- S15: a plan, not a result (keys 48, 49, 50) ----------------------------------------------------------------------------------------------
const S15: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t49 = b(49), t50 = b(50);
  const inK = ease(f, 0, 24);
  const line = clamp01((f - t49) / 70);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.04, fx: 540, fy: 970}]);
  const unit = 'M300,760 L760,740 L800,1040 L330,1080 Z';
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="CATG CREW · PLANNED" y={600} size={30} dashed p={ease(f, 6, 8)} />
        <Plate text="FORT YUKON" y={680} size={28} tone="ice" p={ease(f, t49 + 2, 8)} x={780} />
        <Plate x={540} text="PLANNED CULTURAL BURNS · NEXT SPRING" displayLines={['PLANNED CULTURAL BURNS', 'NEXT SPRING']} y={1200} size={30} dashed p={ease(f, t50, 8)} />
      </>}>
      <SVG>
        <defs><linearGradient id="s15bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A89A68" /><stop offset="1" stopColor="#6F8F55" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#s15bg)" />
        {Array.from({length: 120}).map((_, i) => <circle key={i} cx={rnd(i) * W} cy={500 + rnd(i + 70) * 1000} r={6 + rnd(i + 140) * 12} fill={i % 2 ? '#3F6A45' : '#587A4A'} opacity={0.55} stroke={INK} strokeWidth={1.6} />)}
        {Array.from({length: 9}).map((_, i) => <ellipse key={i} cx={140 + rnd(i + 3) * 800} cy={560 + rnd(i + 13) * 900} rx={110 + rnd(i + 23) * 140} ry={50 + rnd(i + 33) * 70} fill="none" stroke="#6F5E36" strokeWidth={2.4} opacity={0.4} transform={`rotate(${rnd(i + 43) * 60 - 30} 540 960)`} />)}
        {/* the river bend, banks shaded */}
        <path d="M-60,1300 C 200,1300 300,1100 560,1180 S 900,1000 1160,620" fill="none" stroke="#2E5F70" strokeWidth={96} strokeLinecap="round" opacity={0.65} />
        <path d="M-60,1300 C 200,1300 300,1100 560,1180 S 900,1000 1160,620" fill="none" stroke={P.cyan} strokeWidth={70} strokeLinecap="round" />
        <path d="M-60,1300 C 200,1300 300,1100 560,1180 S 900,1000 1160,620" fill="none" stroke={P.iceHi ?? '#E3F6FB'} strokeWidth={10} strokeLinecap="round" strokeDasharray="40 30" strokeDashoffset={-g} opacity={0.6} />
        {/* the dashed burn unit with a soft shadow */}
        <path d={unit} fill="#000" opacity={0.2} transform="translate(14,18)" />
        <path d={unit} fill={P.bone} opacity={0.1} />
        <path d={unit} fill="none" stroke={P.bone} strokeWidth={6} strokeDasharray="22 14" strokeDashoffset={-g * 0.7} opacity={inK} />
        {/* the flame's dashed twin at the unit's edge */}
        <g transform="translate(330,1075) scale(0.7)" opacity={inK}>
          <path d="M0,16 C -14,8 -14,-8 0,-22 C 14,-8 14,8 0,16 Z" fill="none" stroke={P.hotRim} strokeWidth={5} strokeDasharray="6 5" />
        </g>
        {/* the dashed flame line grows along the edge */}
        {Array.from({length: 9}).map((_, i) => {
          const u = i / 8;
          if (u > line) return null;
          const x = lerp(330, 790, u), y = lerp(1075, 1035, u) - 30 * Math.sin(u * Math.PI) * 0 ;
          return <path key={i} transform={`translate(${x},${y}) scale(0.7)`} d="M0,16 C -14,8 -14,-8 0,-22 C 14,-8 14,8 0,16 Z" fill="none" stroke={P.hotRim} strokeWidth={5} strokeDasharray="6 5" />;
        })}
        {/* crew dots in dashed outline at the corner */}
        {Array.from({length: 5}).map((_, i) => <g key={i} transform={`translate(${810 + i * 34},${1090 - i * 4})`}><circle r={13} fill="none" stroke={P.bone} strokeWidth={3.4} strokeDasharray="5 4" /><ellipse cy={26} rx={10} ry={4} fill="#000" opacity={0.3} /></g>)}
      </SVG>
    </Frame>
  );
};

// ---- S16: planned, not found (keys 51, 52, 53) ------------------------------------------------------------------------------------------------
const S16: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t52 = b(52), t53 = b(53);
  const rise = easeIO(f, 0, Math.max(40, t52 - 6));
  const lit = (i: number) => ease(f, t53 + i * 15, 10);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: p.dur, z: 1.04, fx: 540, fy: 960}]);
  const sq = lerp(10, 150, ease(f, t52 - 14, 22));
  return (
    <Frame p={p} cam={cam}
      overlay={<>
        <Plate x={540} text="PLANNED, NOT YET LIT" y={1080} size={28} dashed p={ease(f, t52 + 6, 8)} />
        <Plate x={540} text="WHO SHOULD CHOOSE?" y={620} size={46} tone="ink" p={ease(f, t52, 8)} />
      </>}>
      <SVG>
        <rect width={W} height={H} fill="#7FA5BA" />
        <OrbitBG f={g} id="s16" cell={120} rivers={3} />
        <defs><linearGradient id="s16dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE2B0" stopOpacity={0} /><stop offset="1" stopColor="#F2C6A0" stopOpacity={0.4} /></linearGradient></defs>
        <rect data-band="ok" x={0} y={900} width={W} height={1020} fill="url(#s16dawn)" opacity={ease(f, t52, 50)} />
        {/* the sunrise ground and its cloud bands fall away as the camera rises */}
        <g opacity={1 - rise}>
          <rect width={W} height={H} fill="#C9C196" />
          {Array.from({length: 8}).map((_, i) => <ellipse key={i} cx={150 + i * 140 + ((g * 1.2) % 140)} cy={lerp(700 + i * 90, 1900, rise)} rx={300} ry={36} fill="#fff" opacity={0.5} />)}
        </g>
        {/* the dashed ember square in its dashed boundary */}
        <g transform="translate(540,900)" opacity={ease(f, 8, 20)}>
          <rect x={-250} y={-250} width={500} height={500} fill="none" stroke={P.bone} strokeWidth={5} strokeDasharray="24 16" strokeDashoffset={-g * 0.6} opacity={0.8} />
          <rect x={-sq / 2} y={-sq / 2} width={sq} height={sq} fill={P.hot} opacity={0.18 + 0.08 * Math.sin(g / 12)} />
          <rect x={-sq / 2} y={-sq / 2} width={sq} height={sq} fill="none" stroke={P.hotRim} strokeWidth={7} strokeDasharray="16 11" strokeDashoffset={-g * 0.9} />
        </g>
        {[[330, 1185, 'FOUGHT'], [540, 1215, 'LEFT'], [750, 1185, 'LIT']].map(([x, y, label], i) => (
          <g key={i} transform={`translate(${x},${y})`}>
            <rect x={-34} y={-34} width={68} height={68} fill={P.hot} opacity={0.12 + 0.88 * lit(i)} stroke={INK} strokeWidth={5} />
            <text y={64} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={2} fill={P.bone} stroke={INK} strokeWidth={5} paintOrder="stroke">{label as string}</text>
          </g>
        ))}
        <Eye x={850} y={720} s={0.55} f={g} emotion="found" lock={0.2} />
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={P.void} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={P.bone}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'ONE SQUARE', 2: 'ONE IMAGE', 3: 'IN ORBIT', 4: 'HALF AND FOUR', 5: 'SEEING', 6: 'THE CLOCK', 7: 'TEN MINUTES', 8: 'A PLAN', 9: 'TWO GROUNDS', 10: 'TWO MILLION', 11: 'THE DOUBT', 12: 'IF AND IF NOT', 13: 'THREE ROADS', 14: 'MILD FIRE', 15: 'A PLAN', 16: 'PLANNED'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14, 15: S15, 16: S16};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

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

export const ep1024Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1024Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1024: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 6.98, 13.2, 22.3, 31.18, 36.62, 46.8, 57.02, 66.9, 78.84, 86.74, 92.86, 100.82, 106.22, 113.18, 119.12, 128.3].map((x) => Math.round(x * 30));
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
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#0B1020" ink="#F4EEDC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
