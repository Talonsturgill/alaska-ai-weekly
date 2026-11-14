import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {MONO, monoW} from './lib/prospect';
import {HeldTravel} from './lib/heldidle';
import {IdleFigure, FigureFinish} from './lib/figureidle';
import {BushPlane} from './lib/vehicles';
import {AK_PATH} from './lib/akmap';
import {RingedSeal, SurveyPod} from './lib/iceseal';
import {IDS} from './Ep1114Ids';

// Two Pixels, One New Name, 2026-11-14. Palette roles are art_direction.json. The RingedSeal is the hero, the SurveyPod's nameplate
// is the throughline (P1 steel 2019 ARTICLE, P2 gold SUPER INTELLIGENCE, P3 SAME LEGAL DEFINITION, P4 swollen again, P5 on its edge).
// Gold ONLY on the SI nameplates and stamp, the thermal ramp ONLY inside heat frames, cobalt leads in every exterior.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;

export const C = {
  sky: '#BFE3F2', skyH: '#F4FBFD', skyD: '#8FC6DE', ice: '#F2F7F9', iceS: '#A9C7D6', iceC: '#6E97AE', lead: '#123B57', leadL: '#2E6F8E',
  seal: '#6B6A73', pod: '#E9E4D8', podC: '#B8B0A0', gold: '#D9A520', goldD: '#8A6410', goldL: '#F3D27A',
  vio: '#3A1E5C', mag: '#E0408A', coral: '#FF8A3D', hot: '#FFF4E6',
  paper: '#EFE8D6', paperD: '#D8CFB8', ink: '#232A33', line: '#14181E', desk: '#2E4F66', deskD: '#1E3546', wall: '#EFE8D6', wallD: '#DCD3BC',
  warmDesk: '#5A4636', warmDeskD: '#3E3026', skin: '#C98E6B', sleeve: '#2E4F66', plane: '#2E6F8E',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** a decaying settle after a landing, for the object itself (never the frame) */
const settle = (f: number, at: number, amp = 1, dur = 22) => {
  const t = f - at;
  if (t < 0 || t > dur) return 0;
  return amp * Math.sin(t * 0.7) * Math.exp(-t / (dur * 0.35));
};

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'dark' | 'plate' | 'warn' | 'glow' | 'gold';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#13202B', fg: '#F2F7F9', edge: '#F2F7F9'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  warn: {fill: C.paper, fg: C.lead, edge: C.ink},
  glow: {fill: '#FFFFFF', fg: C.ink, edge: C.ink},
  gold: {fill: C.gold, fg: '#2A1E04', edge: C.ink},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'dark', p = 1, rot = 0, drop = 0}) => {
  const ls = displayLines ?? [text ?? ''];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  const fr = useCurrentFrame();
  if (k <= 0.01) return null;
  const sc = (0.88 + 0.12 * Math.min(1, k * 1.15)) * (1 + 0.01 * Math.sin(fr / 11 + x * 0.01));
  return (
    <g opacity={Math.min(1, k * 1.7)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
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
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; overlay?: React.ReactNode; bg?: string; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.04, vignette = 0.2, ox = 540, oy = 930, overlay, bg = C.sky, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 14 * Math.sin(p.f / 110) + 10 * t, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: bg}} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#13202B" stroke="#F2F7F9" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F2F7F9">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.06} warmth={0.02} />
    </AbsoluteFill>
  );
};

const track = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => {
  const clampC = (c: Cam): Cam => ({z: c.z, fx: Math.max(540 / c.z, Math.min(1080 - 540 / c.z, c.fx)), fy: Math.max(960 / c.z, Math.min(1920 - 960 / c.z, c.fy))});
  if (f <= keys[0].t) return clampC(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i].t) {
      const a = keys[i - 1], bk = keys[i];
      const k = Easing.inOut(Easing.cubic)((f - a.t) / Math.max(1, bk.t - a.t));
      return clampC({z: lerp(a.z, bk.z, k), fx: lerp(a.fx, bk.fx, k), fy: lerp(a.fy, bk.fy, k)});
    }
  }
  return clampC(keys[keys.length - 1]);
};

/** visibility of the i-th item of a sequence: in on its beat, out as the next one lands. */
const vis = (f: number, b: (id: number) => number, ks: number[], i: number) => ease(f, b(ks[i]), 12) * (i < ks.length - 1 ? 1 - ease(f, b(ks[i + 1]) - 10, 8) : 1);

// ---- worlds ----------------------------------------------------------------------------------------------------------------------------------------
/** THE ICE WORLD: high-noon sky, sun upper left, pressure ridges on the horizon, floes split by cobalt leads, near rubble under the caption band. */
const IceWorld: React.FC<{f: number; hz?: number; seed?: number; drift?: number; near?: boolean}> = ({f, hz = 780, seed = 0, drift = 0.15, near = true}) => {
  const dx = (f * drift) % 400;
  return (
    <g>
      <defs>
        <linearGradient id={`isky${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.skyD} />
          <stop offset="0.7" stopColor={C.sky} />
          <stop offset="1" stopColor={C.skyH} />
        </linearGradient>
        <radialGradient id={`isun${seed}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.35" stopColor="#FFF6DA" stopOpacity={0.6} />
          <stop offset="1" stopColor="#FFF6DA" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-200} y={-200} width={1480} height={hz + 220} fill={`url(#isky${seed})`} />
      <circle cx={190} cy={hz - 520} r={230} fill={`url(#isun${seed})`} />
      <circle cx={190} cy={hz - 520} r={54} fill="#FFFDF2" stroke={C.line} strokeWidth={3} />
      {/* thin high cloud streaks */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${-100 + ((i * 420 + f * 0.25) % 1500) - 200},${hz - 380 + i * 90} q 160,-30 320,0 q 120,20 240,0`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.75} />
      ))}
      {/* pressure ridges on the horizon */}
      <path d={`M -200,${hz} ${Array.from({length: 16}).map((_, i) => `L ${-200 + i * 100},${hz - 20 - h01(i, seed) * 60} L ${-150 + i * 100},${hz - 4}`).join(' ')} L 1400,${hz} L 1400,${hz + 30} L -200,${hz + 30} Z`}
        fill={C.ice} stroke={C.line} strokeWidth={3} strokeLinejoin="round" />
      {Array.from({length: 16}).map((_, i) => (
        <path key={`rs${i}`} d={`M ${-200 + i * 100},${hz - 20 - h01(i, seed) * 60} L ${-150 + i * 100},${hz - 4} L ${-178 + i * 100},${hz - 2} Z`} fill={i % 3 ? C.iceS : C.iceC} opacity={0.85} />
      ))}
      {/* the ice field with cobalt leads in perspective */}
      <rect x={-200} y={hz + 20} width={1480} height={1920 - hz} fill={C.ice} />
      {Array.from({length: 6}).map((_, i) => {
        const y0 = hz + 40 + i * i * 34 + i * 30;
        const th = 6 + i * 6;
        const off = ((dx * (1 + i * 0.4)) + h01(i, seed + 3) * 600) % 1600 - 300;
        return (
          <g key={`ld${i}`}>
            <path d={`M ${off - 900},${y0} q 200,${-8 - i * 3} 420,${4} q 260,${10 + i * 2} 520,${-6} q 240,-12 620,${6} L ${off + 700},${y0 + th} q -240,10 -620,-2 q -260,-8 -520,4 q -200,10 -420,-4 Z`}
              fill={C.lead} stroke={C.line} strokeWidth={2.5} />
            <path d={`M ${off - 700},${y0 + th * 0.4} q 200,-4 380,2`} stroke={C.leadL} strokeWidth={2 + i * 0.6} fill="none" opacity={0.8} />
          </g>
        );
      })}
      {/* blue shadow planes on the floes */}
      {Array.from({length: 9}).map((_, i) => {
        const x = (h01(i, seed + 7) * 1300 - 100 + dx * 0.6) % 1300 - 100, y = hz + 80 + h01(i, seed + 9) * (1300 - hz);
        const r = 30 + h01(i, 2) * 70;
        return <path key={`sp${i}`} d={`M ${x - r},${y} q ${r},${-r * 0.35} ${r * 2},0 q ${-r},${r * 0.2} ${-r * 2},0 Z`} fill={C.iceS} opacity={0.55} />;
      })}
      {near && (
        <g>
          {/* near rubble under the caption band */}
          {Array.from({length: 11}).map((_, i) => {
            const x = -40 + i * 110 + h01(i, seed + 5) * 40, y = 1520 + h01(i, seed + 6) * 300, s = 40 + h01(i, seed + 8) * 70;
            return (
              <g key={`rb${i}`}>
                <path d={`M ${x - s},${y + s * 0.4} L ${x - s * (0.4 + h01(i, seed + 14) * 0.4)},${y - s * (0.3 + h01(i, seed + 15) * 0.5)} L ${x + s * 0.3},${y - s * (0.5 + h01(i, seed + 16) * 0.4)} L ${x + s},${y - s * 0.1} L ${x + s * 0.8},${y + s * 0.45} Z`} fill={C.ice} stroke={C.line} strokeWidth={4} strokeLinejoin="round" />
                <path d={`M ${x + s * 0.3},${y - s * 0.7} L ${x + s},${y - s * 0.1} L ${x + s * 0.8},${y + s * 0.45} L ${x + s * 0.2},${y + s * 0.1} Z`} fill={C.iceS} />
                <path d={`M ${x - s * 0.6},${y - s * 0.5} L ${x + s * 0.3},${y - s * 0.7}`} stroke="#FFFFFF" strokeWidth={4} opacity={0.9} />
              </g>
            );
          })}
          <path d={`M -200,1500 q 400,-24 800,-6 q 400,16 880,0 L 1400,1530 q -500,12 -900,4 q -400,-10 -700,10 Z`} fill={C.lead} stroke={C.line} strokeWidth={3} />
        </g>
      )}
      {/* glints */}
      {Array.from({length: 14}).map((_, i) => {
        const tw = 0.5 + 0.5 * Math.sin(f / 9 + i * 2.1);
        return <path key={`gl${i}`} d={`M ${h01(i, seed + 11) * 1080},${hz + 60 + h01(i, seed + 12) * 700} m -8,0 h 16 m -8,-8 v 16`} stroke="#FFFFFF" strokeWidth={3} opacity={tw} />;
      })}
    </g>
  );
};

/** THE THERMAL FRAME: the survey's-eye view, self-lit, violet field, magenta cracks, scanlines, a refresh sweep. */
const Thermal: React.FC<{f: number; op?: number; stamp?: string}> = ({f, op = 1, stamp}) => {
  if (op <= 0.01) return null;
  const sweep = (f * 14) % 2200 - 140;
  return (
    <g opacity={op}>
      <rect data-band="ok" x={-200} y={-200} width={1480} height={2320} fill={C.vio} />
      <defs>
        <radialGradient id="thv" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.5" stopColor={C.vio} stopOpacity={0} />
          <stop offset="1" stopColor="#1A0B2C" stopOpacity={0.85} />
        </radialGradient>
      </defs>
      {Array.from({length: 22}).map((_, i) => (
        <path key={i} d={`M ${h01(i, 1) * 1100},${h01(i, 2) * 1900} l ${60 + h01(i, 3) * 160},${(h01(i, 4) - 0.5) * 120} l ${40 + h01(i, 5) * 100},${(h01(i, 6) - 0.5) * 80}`}
          stroke={C.mag} strokeWidth={2 + h01(i, 7) * 3} fill="none" opacity={0.28} />
      ))}
      {Array.from({length: 120}).map((_, i) => (
        <rect key={`n${i}`} x={h01(i, 21) * 1080} y={h01(i, 22) * 1920} width={6} height={6} fill={i % 3 ? '#5A2E82' : '#7A3A8E'} opacity={0.5 + 0.3 * Math.sin(f / 5 + i)} />
      ))}
      {Array.from({length: 48}).map((_, i) => <rect key={`s${i}`} x={-200} y={i * 40} width={1480} height={2} fill="#000" opacity={0.18} />)}
      <rect x={-200} y={sweep} width={1480} height={6} fill={C.mag} opacity={0.35} />
      <rect data-band="ok" x={-200} y={-200} width={1480} height={2320} fill="url(#thv)" />
      {stamp && <text x={830} y={560} fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.hot} opacity={0.85}>{stamp}</text>}
    </g>
  );
};

/** an Alaska outline as a stencil */
const AKMark: React.FC<{x: number; y: number; s: number; fill?: string; stroke?: string; op?: number}> = ({x, y, s, fill = 'none', stroke = C.ink, op = 1}) => (
  <path d={AK_PATH} transform={`translate(${x} ${y}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={5 / s} strokeLinejoin="round" opacity={op} />
);

/** the interior wall with a window onto the ice and a framed map of Alaska (the AFSC-side rooms). */
const Room: React.FC<{f: number; win?: [number, number, number, number]; map?: [number, number, number]; floorY?: number; tone?: 'cool' | 'warm'}> = ({f, win = [600, 470, 380, 300], map = [120, 520, 0.26], floorY = 1150, tone = 'cool'}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={floorY + 200} fill={C.wall} />
    {Array.from({length: 12}).map((_, i) => <rect key={i} x={-200 + i * 130} y={-200} width={4} height={floorY + 200} fill={C.wallD} opacity={0.6} />)}
    {/* window onto the ice */}
    <g>
      <rect x={win[0] - 14} y={win[1] - 14} width={win[2] + 28} height={win[3] + 28} rx={6} fill={C.desk} stroke={C.line} strokeWidth={5} />
      <svg x={win[0]} y={win[1]} width={win[2]} height={win[3]} viewBox={`0 ${500} 1080 ${1080 * win[3] / win[2]}`} preserveAspectRatio="xMidYMid slice">
        <IceWorld f={f} hz={760} seed={4} near={false} />
      </svg>
      <rect x={win[0]} y={win[1]} width={win[2]} height={win[3]} fill="none" stroke={C.line} strokeWidth={4} />
      <path d={`M ${win[0] + win[2] / 2},${win[1]} V ${win[1] + win[3]} M ${win[0]},${win[1] + win[3] / 2} H ${win[0] + win[2]}`} stroke={C.desk} strokeWidth={10} />
      <path d={`M ${win[0] + 20},${win[1] + 20} l 60,0`} stroke="#FFFFFF" strokeWidth={5} opacity={0.6} />
    </g>
    {/* framed map of Alaska */}
    {map[2] > 0 && (
      <g>
        <rect x={map[0] - 16} y={map[1] - 16} width={1000 * map[2] + 32} height={700 * map[2] + 32} fill={C.paper} stroke={C.line} strokeWidth={6} />
        <rect x={map[0] - 6} y={map[1] - 6} width={1000 * map[2] + 12} height={700 * map[2] + 12} fill="#D5E6EE" />
        <AKMark x={map[0]} y={map[1]} s={map[2]} fill={C.paperD} stroke={C.ink} />
      </g>
    )}
    {tone === 'warm' && <rect x={-200} y={-200} width={1480} height={floorY + 200} fill="#FFB866" opacity={0.08} />}
  </g>
);

// ---- the cast --------------------------------------------------------------------------------------------------------------------------------------
/** the analyst: a generic seated figure seen three-quarter from behind (not a likeness), wrapped in the figure rig,
 *  form-shaded like the props, breathing and leaning into the magnifier, a profile cue on the far cheek. */
const Analyst: React.FC<{f: number; x: number; y: number; s?: number; lean?: number; rub?: number; cues?: number[]}> = ({f, x, y, s = 1, lean = 0, rub = 0, cues = []}) => {
  const breath = 1 + 0.05 * Math.sin(f / 11);
  const bob = 4 * Math.sin(f / 21) + 3 * Math.sin(f / 7.3);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={20} cy={156} rx={130} ry={16} fill="#0C2434" opacity={0.35} />
      <FigureFinish x={0} footY={150} w={170} h={320} keySide="right">
        <IdleFigure f={f} x={0} footY={150} h={320} seed={3} cues={cues}>
          {(pose) => (
            <g>
              <defs>
                <linearGradient id="anlFleece" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#1F4F69" />
                  <stop offset="0.55" stopColor={C.plane} />
                  <stop offset="1" stopColor="#5FA0C0" />
                </linearGradient>
              </defs>
              <rect x={-80} y={-20} width={160} height={170} rx={20} fill={C.deskD} stroke={C.line} strokeWidth={6} />
              <path d="M -70,0 q 70,-14 140,0" stroke="#3E6A86" strokeWidth={6} fill="none" />
              <g transform={`rotate(${lean * 14 + 2 * Math.sin(f / 30)} 0 120) scale(1 ${breath})`} style={{transformOrigin: '0px 120px'}}>
                <path d="M -66,130 Q -76,0 -40,-40 Q 0,-60 40,-40 Q 76,0 66,130 Z" fill="url(#anlFleece)" stroke={C.line} strokeWidth={7} strokeLinejoin="round" />
                <path d="M -20,-40 V 120" stroke="#163C52" strokeWidth={5} opacity={0.6} />
                <path d="M -60,40 q 60,14 120,0" stroke="#163C52" strokeWidth={5} opacity={0.5} fill="none" />
                {/* upper arm and forearm reaching to the magnifier, the other hand rubbing the eyes on the beat */}
                <g transform={`rotate(${-40 + pose.armR * 0.4 + 6 * Math.sin(f / 26)} 48 -20)`}>
                  <rect x={36} y={-28} width={30} height={84} rx={15} fill="url(#anlFleece)" stroke={C.line} strokeWidth={6} />
                  <g transform={`translate(51 50) rotate(${-50 - rub * 40})`}>
                    <rect x={-14} y={-6} width={28} height={74} rx={14} fill="url(#anlFleece)" stroke={C.line} strokeWidth={6} />
                    <ellipse cx={0} cy={74} rx={16} ry={14} fill={C.skin} stroke={C.line} strokeWidth={5} />
                    <path d="M -6,70 q 6,8 14,2" stroke="#9A6A4E" strokeWidth={3} fill="none" />
                  </g>
                </g>
                {/* head, back three-quarter, toque, profile cue on the far cheek */}
                <g transform={`translate(0 ${-78 + bob * 0.5}) rotate(${pose.headRot * 0.6 + lean * 10 + bob * 0.6})`}>
                  <circle r={46} fill={C.skin} stroke={C.line} strokeWidth={7} />
                  <path d="M 30,-6 q 22,10 18,30 q -8,6 -16,0" fill="#B97E5C" stroke={C.line} strokeWidth={4} />
                  <path d="M 42,8 l 10,6 l -8,4" fill={C.skin} stroke={C.line} strokeWidth={3} />
                  <path d="M -30,20 q 30,24 62,4" stroke="#9A6A4E" strokeWidth={4} fill="none" opacity={0.6} />
                  <path d="M -46,-6 Q -40,-60 0,-62 Q 44,-60 46,-6 Q 20,-20 -46,-6 Z" fill={C.ink} stroke={C.line} strokeWidth={5} />
                  <path d="M -40,-30 Q 0,-46 40,-30" stroke="#5FA0C0" strokeWidth={8} fill="none" />
                  <circle cx={0} cy={-64} r={10} fill="#5FA0C0" stroke={C.line} strokeWidth={4} />
                  <circle cx={-44} cy={6} r={9} fill={C.skin} stroke={C.line} strokeWidth={4} />
                </g>
              </g>
            </g>
          )}
        </IdleFigure>
      </FigureFinish>
    </g>
  );
};

/** a survey tripod with feet on the ice (the pod stands on it for the floe test) */
const Tripod: React.FC<{x: number; top: number; foot: number}> = ({x, top, foot}) => (
  <g>
    {[-1, 0, 1].map((d) => (
      <g key={d}>
        <ellipse cx={x + d * 150} cy={foot + 4} rx={30} ry={8} fill="#0C2434" opacity={0.3} />
        <path d={`M ${x},${top} L ${x + d * 150},${foot}`} stroke={C.line} strokeWidth={16} strokeLinecap="round" />
        <path d={`M ${x},${top} L ${x + d * 150},${foot}`} stroke={C.iceC} strokeWidth={8} strokeLinecap="round" />
      </g>
    ))}
    <rect x={x - 40} y={top - 20} width={80} height={30} rx={6} fill={C.deskD} stroke={C.line} strokeWidth={5} />
  </g>
);

/** a signpost frozen into the floe; the board swings open (0..1) into a quote card */
const SignPost: React.FC<{f: number; x: number; boardY: number; foot: number; w: number; h: number; open: number; lines: string[]; head: string; glint: number; seed: number}> =
({f, x, boardY, foot, w, h, open, lines, head, glint, seed}) => {
  const k = clamp01(open);
  const sx = 1;
  const sw = settle(f, 0, 0) + 1.5 * Math.sin(f / 40 + seed);
  const size = 30;
  return (
    <g>
      <ellipse cx={x + 10} cy={foot + 4} rx={60} ry={12} fill="#0C2434" opacity={0.28} />
      <rect x={x - 12} y={boardY} width={24} height={foot - boardY} fill={C.desk} stroke={C.line} strokeWidth={5} />
      <path d={`M ${x - 40},${foot} q 40,-24 80,0`} fill={C.ice} stroke={C.line} strokeWidth={4} />
      <g transform={`translate(${x} ${boardY}) rotate(${sw * 0.3}) scale(${sx} 1)`}>
        <rect x={-w / 2 + 8} y={8} width={w} height={h} rx={10} fill="#000" opacity={0.22} />
        <rect x={-w / 2} y={0} width={w} height={h} rx={10} fill={C.paper} stroke={C.line} strokeWidth={6} />
        <rect x={-w / 2} y={0} width={w} height={54} rx={10} fill={C.ink} />
        <text x={0} y={37} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={2} fill={C.paper}>{head}</text>
        {k > 0.5 && lines.map((l, i) => (
          <text key={i} x={0} y={110 + i * (size + 14)} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} fill={C.ink}>{l}</text>
        ))}
        {glint > 0 && glint < 1 && <rect x={-w / 2 + (w + 120) * glint - 120} y={0} width={60} height={h} fill="#FFFFFF" opacity={0.45} transform={`skewX(-18)`} />}
        {k < 0.99 && (
          <g transform={`translate(0 ${k * 120})`} opacity={1 - k}>
            <rect x={-w / 2 - 6} y={-6} width={w + 12} height={h + 12} rx={12} fill={C.iceC} stroke={C.line} strokeWidth={6} />
            <path d={`M ${-w / 2},${h * 0.33} H ${w / 2} M ${-w / 2},${h * 0.66} H ${w / 2}`} stroke={C.ink} strokeWidth={6} />
            <path d={`M ${-w / 2 + 20},10 q ${w / 2 - 20},40 ${w - 40},0`} stroke="#4F7A90" strokeWidth={5} fill="none" />
          </g>
        )}
      </g>
    </g>
  );
};

/** the open, empty envelope with a blank sheet (the Nov 28 definition does not exist yet) */
const Envelope: React.FC<{x: number; y: number; s?: number; sheet: number; p: number}> = ({x, y, s = 1, sheet, p}) => (
  <g transform={`translate(${x} ${y}) scale(${s * (0.9 + 0.1 * p)})`} opacity={clamp01(p * 1.5)}>
    <rect x={-150} y={-30 - sheet * 120} width={260} height={180} rx={4} fill="#FFFFFF" stroke={C.line} strokeWidth={4} transform="translate(20 0)" />
    <rect x={-170} y={-60} width={340} height={200} rx={8} fill={C.paper} stroke={C.line} strokeWidth={6} />
    <path d="M -170,-60 L 0,40 L 170,-60" fill="none" stroke={C.line} strokeWidth={5} />
    <path d="M -170,-60 L 0,-150 L 170,-60" fill={C.paperD} stroke={C.line} strokeWidth={5} />
    <circle cx={0} cy={-150} r={8} fill={C.ink} />
  </g>
);

/** the ear stone reader: an enamel box with one lens eye, a tray, its own gold SI plate */
const Reader: React.FC<{f: number; x: number; y: number; s?: number; beam: number; look?: number}> = ({f, x, y, s = 1, beam, look = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={200} ry={18} fill="#0C2434" opacity={0.3} />
    <rect x={-170} y={-260} width={340} height={260} rx={30} fill={C.pod} stroke={C.line} strokeWidth={7} />
    <rect x={-170} y={-60} width={340} height={60} rx={10} fill={C.podC} stroke={C.line} strokeWidth={5} />
    <path d="M -150,-240 h 300" stroke="#FFFFFF" strokeWidth={6} opacity={0.6} />
    {/* the lens eye */}
    <g transform="translate(0,-170)">
      <circle r={62} fill="#2B2F36" stroke={C.line} strokeWidth={6} />
      <circle r={44} fill="#5A6470" stroke={C.line} strokeWidth={4} />
      <circle r={30} fill="#6D3FB0" />
      <circle cx={look * 10} cy={6} r={14} fill="#0B0D12" />
      <circle cx={-10} cy={-12} r={7} fill="#FFFFFF" opacity={0.85} />
    </g>
    {/* the gold SI plate, metal */}
    <g transform="translate(0,-92)">
      <rect x={-118} y={-18} width={236} height={34} rx={5} fill={C.gold} stroke={C.line} strokeWidth={4} />
      <rect x={-118} y={8} width={236} height={8} fill={C.goldD} opacity={0.6} />
      <path d="M -108,-12 h 60" stroke={C.goldL} strokeWidth={3} />
      <text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill="#2A1E04" letterSpacing={1}>SUPER INTELLIGENCE</text>
    </g>
    {/* tray */}
    <rect x={-150} y={-46} width={300} height={36} rx={8} fill={C.ink} stroke={C.line} strokeWidth={4} />
    {/* the near infrared band */}
    {beam > 0 && <rect x={-150 + 280 * beam} y={-56} width={26} height={50} fill={C.mag} opacity={0.5} rx={6} />}
  </g>
);

/** a plain brass microscope worked by a person's hand turning the focus knob */
const Microscope: React.FC<{f: number; x: number; y: number; s?: number; turn: number}> = ({f, x, y, s = 1, turn}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={140} ry={14} fill="#0C2434" opacity={0.3} />
    <rect x={-110} y={-30} width={220} height={30} rx={8} fill="#8A6A3A" stroke={C.line} strokeWidth={5} />
    <path d="M 40,-30 Q 80,-150 20,-260" fill="none" stroke={C.line} strokeWidth={34} strokeLinecap="round" />
    <path d="M 40,-30 Q 80,-150 20,-260" fill="none" stroke="#B08A4A" strokeWidth={22} strokeLinecap="round" />
    <rect x={-50} y={-330} width={56} height={170} rx={14} fill="#B08A4A" stroke={C.line} strokeWidth={6} transform="rotate(-18 -22 -245)" />
    <rect x={-90} y={-110} width={150} height={16} rx={4} fill={C.ink} />
    {/* focus knob and the hand turning it */}
    <g transform={`translate(70,-120) rotate(${turn * 120})`}>
      <circle r={26} fill="#8A6A3A" stroke={C.line} strokeWidth={5} />
      <path d="M -18,0 H 18" stroke={C.line} strokeWidth={5} />
    </g>
    <g transform={`translate(110,-112) rotate(${-10 + 6 * Math.sin(turn * 6)})`}>
      <rect x={20} y={-26} width={160} height={52} rx={22} fill={C.sleeve} stroke={C.line} strokeWidth={6} />
      <ellipse cx={4} cy={0} rx={34} ry={26} fill={C.skin} stroke={C.line} strokeWidth={6} />
      <path d="M -22,-10 q -10,10 0,20 M -14,-18 q -14,14 0,30" stroke={C.line} strokeWidth={4} fill="none" />
    </g>
  </g>
);

/** a tile from the survey: white ice with leads, optionally warm (an animal) or dark (the seal) */
const Tile: React.FC<{x: number; y: number; w: number; h: number; i: number; warm?: number; dark?: boolean; op?: number}> = ({x, y, w, h, i, warm = 0, dark = false, op = 1}) => (
  <g opacity={op}>
    <rect x={x} y={y} width={w} height={h} fill={C.ice} stroke={C.line} strokeWidth={3} />
    <path d={`M ${x},${y + h * (0.3 + h01(i, 1) * 0.4)} q ${w * 0.4},${-h * 0.1} ${w},${h * (h01(i, 2) - 0.5) * 0.3}`} stroke={C.lead} strokeWidth={4 + h01(i, 3) * 5} fill="none" />
    <path d={`M ${x + w * h01(i, 4)},${y + h * 0.75} l ${w * 0.25},0`} stroke={C.iceS} strokeWidth={6} />
    {warm > 0 && <circle cx={x + w * (0.3 + h01(i, 5) * 0.4)} cy={y + h * (0.3 + h01(i, 6) * 0.4)} r={14 * warm + 4} fill={C.coral} stroke={C.hot} strokeWidth={3} opacity={warm} />}
    {dark && (<g><rect x={x + w * 0.46} y={y + h * 0.5} width={9} height={9} fill="#3E3D45" /><rect x={x + w * 0.46 + 9} y={y + h * 0.5} width={9} height={9} fill="#55545C" /></g>)}
  </g>
);

/** the boxed pin tag ONE OF THESE IS A SEAL (also on the 2019 article photo and in the button) */
const PinTag: React.FC<{x: number; y: number; s?: number; p: number; f: number}> = ({x, y, s = 1, p, f}) => {
  if (p <= 0.01) return null;
  const sw = settle(f, 0, 0) + 4 * Math.sin(f / 18);
  const t = 'ONE OF THESE IS A SEAL';
  const w = monoW(t, 22) + 34;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * (0.8 + 0.2 * p)}) rotate(${sw})`} opacity={clamp01(p * 1.6)}>
      <circle r={9} fill={C.coral} stroke={C.line} strokeWidth={4} />
      <path d="M 0,0 L 0,-60" stroke={C.line} strokeWidth={4} />
      <rect x={-w / 2} y={-110} width={w} height={50} rx={6} fill={C.paper} stroke={C.line} strokeWidth={4} />
      <text x={0} y={-77} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>{t}</text>
    </g>
  );
};

/** the detector box: four corners that snap in with overshoot (k 0..1), or spring open (k > 1 = 1 to 2 opens) */
const DetBox: React.FC<{x: number; y: number; w: number; h: number; k: number; color?: string}> = ({x, y, w, h, k, color = C.coral}) => {
  if (k <= 0.01) return null;
  const open = k > 1 ? (k - 1) : 0;
  const g = (1 - Math.min(1, k)) * 60 + open * 70;
  const L = 34;
  const corners: Array<[number, number, number, number]> = [[-1, -1, 1, 1], [1, -1, -1, 1], [-1, 1, 1, -1], [1, 1, -1, -1]];
  return (
    <g opacity={Math.min(1, k * 2) * (1 - open * 0.6)}>
      {corners.map(([sx, sy, dx, dy], i) => {
        const cx = x + sx * (w / 2 + g), cy = y + sy * (h / 2 + g);
        return <path key={i} d={`M ${cx},${cy + dy * L} L ${cx},${cy} L ${cx + dx * L},${cy}`} stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </g>
  );
};

/** the wing seen from below with the pod hanging on its strut and a calendar clipped to the strut */
const UnderWing: React.FC<{f: number; children?: React.ReactNode}> = ({f, children}) => (
  <g>
    <defs>
      <linearGradient id="uwsky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.skyD} />
        <stop offset="1" stopColor={C.skyH} />
      </linearGradient>
    </defs>
    <rect data-band="ok" x={-200} y={-200} width={1480} height={2320} fill="url(#uwsky)" />
    {/* far ice below, tilted, with leads: this camera hangs off the plane looking out and down */}
    <g transform="translate(0 0)">
      <path d="M -200,1260 Q 540,1220 1280,1270 L 1280,2120 L -200,2120 Z" fill={C.ice} stroke={C.line} strokeWidth={3} />
      {Array.from({length: 4}).map((_, i) => (
        <path key={i} d={`M ${-200 + ((f * 0.6 + i * 330) % 1600) - 200},${1320 + i * 120} q 300,-10 600,6 q 200,8 500,-4 L ${((f * 0.6 + i * 330) % 1600) + 700},${1334 + i * 120 + i * 6} q -300,10 -600,-6 Z`} fill={C.lead} stroke={C.line} strokeWidth={2} />
      ))}
    </g>
    {[0, 1].map((i) => (
      <ellipse key={i} cx={((f * 0.9 + i * 700) % 1700) - 300} cy={1000 + i * 120} rx={180} ry={30} fill="#FFFFFF" opacity={0.75} />
    ))}
    {/* the plane's own shadow on the floe below, and pressure-ridge blocks in the near ice */}
    <path d={`M ${300 + 40 * Math.sin(f / 50)},1620 l 260,-30 l 220,40 l -480,20 Z`} fill="#0C2434" opacity={0.18} />
    {Array.from({length: 7}).map((_, i) => {
      const bx = 60 + i * 160 + 30 * Math.sin(i * 2.3), by = 1700 + (i % 3) * 70, r = 40 + (i % 4) * 14;
      return (
        <g key={`ub${i}`}>
          <path d={`M ${bx - r},${by + r * 0.3} L ${bx - r * 0.3},${by - r * 0.7} L ${bx + r},${by - r * 0.2} L ${bx + r * 0.6},${by + r * 0.4} Z`} fill={C.ice} stroke={C.line} strokeWidth={4} />
          <path d={`M ${bx - r * 0.3},${by - r * 0.7} L ${bx + r},${by - r * 0.2} L ${bx + r * 0.2},${by + r * 0.1} Z`} fill={C.iceC} opacity={0.7} />
        </g>
      );
    })}
    {/* the wing underside across the top */}
    <path d="M -200,280 L 1280,330 L 1280,470 L -200,430 Z" fill={C.plane} stroke={C.line} strokeWidth={7} />
    <path d="M -200,420 L 1280,458" stroke="#0E3247" strokeWidth={14} opacity={0.6} />
    {Array.from({length: 12}).map((_, i) => <circle key={i} cx={-160 + i * 120} cy={318 + i * 4} r={5} fill="#0E3247" />)}
    <AKMark x={760} y={350} s={0.09} fill="#0E3247" stroke="#0E3247" op={0.75} />
    {children}
  </g>
);

/** tear-off calendar clipped to a strut */
const TearCal: React.FC<{x: number; y: number; s?: number; page: string; tear: number}> = ({x, y, s = 1, page, tear}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70} y={0} width={140} height={150} rx={8} fill={C.paper} stroke={C.line} strokeWidth={5} />
    <rect x={-70} y={0} width={140} height={36} rx={8} fill={C.ink} />
    <text x={0} y={26} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={14} fill={C.paper}>LAST UPDATED</text>
    <text x={0} y={112} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={C.ink}>{page}</text>
    {tear < 1 && (
      <g transform={`translate(${tear * 120} ${tear * 260}) rotate(${tear * 70})`} opacity={1 - tear}>
        <rect x={-70} y={36} width={140} height={114} fill={C.paperD} stroke={C.line} strokeWidth={4} />
      </g>
    )}
    <circle cx={0} cy={-10} r={10} fill={C.iceC} stroke={C.line} strokeWidth={4} />
  </g>
);


/** near plane under the caption band: a strip of survey tiles on a light table (cutaways), varied by seed */
const NearStrip: React.FC<{f: number; y?: number; seed?: number; dark?: boolean}> = ({f, y = 1560, seed = 0, dark = true}) => (
  <g>
    <rect x={-200} y={y - 30} width={1480} height={1920 - y + 230} fill={dark ? '#0F1A22' : C.deskD} stroke={C.line} strokeWidth={5} />
    {Array.from({length: 9}).map((_, i) => {
      const x = ((i * 150 + f * 0.8 + seed * 40) % 1350) - 150;
      return <Tile key={i} x={x} y={y} w={130} h={96} i={i + seed * 9} warm={i % 4 === 1 ? 1 : 0} />;
    })}
    {Array.from({length: 12}).map((_, i) => <rect key={`h${i}`} x={((i * 120 + f * 0.8) % 1440) - 180} y={y - 18} width={16} height={10} fill="#2B3A46" />)}
    <path d={`M -200,${y + 130} H 1280`} stroke="#2B3A46" strokeWidth={8} />
    {Array.from({length: 5}).map((_, i) => <rect key={`r${i}`} x={60 + i * 210} y={y + 170} width={150} height={110} rx={10} fill={dark ? '#16232D' : '#3E6A86'} stroke={C.line} strokeWidth={4} />)}
  </g>
);

/** near plane for a desk: an edge with prints, a pencil and a mug */
const DeskNearPlane: React.FC<{f: number; y?: number; warm?: boolean}> = ({f, y = 1500, warm = false}) => (
  <g>
    <rect x={-200} y={y} width={1480} height={600} fill={warm ? C.warmDeskD : C.deskD} stroke={C.line} strokeWidth={6} />
    <rect x={-200} y={y} width={1480} height={24} fill={warm ? C.warmDesk : '#3E6A86'} />
    {[[90, 1, -6], [300, 0, 4], [560, 1, -3]].map(([x, w, r], i) => (
      <g key={i} transform={`translate(${x} ${y + 120}) rotate(${r + 1.2 * Math.sin(f / 40 + i)})`}>
        <rect x={-110} y={-70} width={220} height={150} fill={w ? C.ice : C.paper} stroke={C.line} strokeWidth={4} />
        {w ? <path d="M -110,-10 q 100,-20 220,6" stroke={C.lead} strokeWidth={10} fill="none" /> : Array.from({length: 4}).map((_, j) => <rect key={j} x={-90} y={-46 + j * 26} width={160} height={8} fill={C.paperD} />)}
      </g>
    ))}
    <g transform={`translate(860 ${y + 110})`}>
      <ellipse cx={0} cy={60} rx={70} ry={14} fill="#000" opacity={0.25} />
      <rect x={-56} y={-40} width={112} height={100} rx={12} fill={C.paper} stroke={C.line} strokeWidth={5} />
      <path d="M 56,-16 q 34,6 30,30 q -4,22 -30,22" fill="none" stroke={C.line} strokeWidth={8} />
      <AKMark x={-34} y={-10} s={0.06} fill={C.iceC} stroke={C.iceC} />
      {[0, 1].map((i) => <path key={i} d={`M ${-14 + i * 24},-50 q ${8 * Math.sin(f / 9 + i)},-20 0,-40`} stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.6} />)}
    </g>
    <path d={`M 640,${y + 240} l 160,-30`} stroke={C.gold === '' ? C.ink : '#E3C247'} strokeWidth={12} strokeLinecap="round" />
  </g>
);

// ---- the shots -------------------------------------------------------------------------------------------------------------------------------------
/** S1, two pixels on a thermal frame resolve into the seal */
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const res = easeIO(f, b(46) - 12, 26);
  const ring = ease(f, 0, 9);
  const pulse = 1 + 0.25 * Math.max(0, Math.sin(f / 4)) * (1 - ease(f, 40, 20));
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 1000}, {t: b(2), z: 1.04, fx: 540, fy: 1000}, {t: b(46), z: 1.32, fx: 560, fy: 1040}, {t: p.dur, z: 1.4, fx: 570, fy: 1040}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
      <Plate text="AS SMALL AS 2 PIXELS" x={540} y={600} size={44} tone="dark" p={ease(f, 0, 8)} />
      <Plate text="THE SEAL" x={540} y={1250} size={30} tone="plate" p={ease(f, b(46) + 6, 12)} />
    </>}>
      <SVG>
        <IceWorld f={f} hz={760} seed={1} />
        <RingedSeal x={540} y={1110} scale={2.1} f={f} pixels={1 - res} thermal={1 - res * 0.8} lift={res * 0.8} emotion={res > 0.7 ? 'squint' : 'calm'} seed={2} />
        <Thermal f={f} op={1 - res} />
        {/* the two pixels on the thermal frame */}
        <g opacity={(1 - res) * (f < 18 && f % 6 >= 3 ? 0.35 : 1)} transform={`translate(542 1045) scale(${pulse}) translate(-542 -1045)`}>
          <rect x={506} y={1027} width={36} height={36} fill={C.coral} />
          <rect x={542} y={1027} width={36} height={36} fill={C.hot} />
        </g>
        <g opacity={1 - res * 0.7}>
          <circle cx={542} cy={1045} r={lerp(220, 90, ring) + 8 * Math.sin(f / 6)} fill="none" stroke={C.hot} strokeWidth={8} opacity={ring} />
        </g>
        {/* the stake tag that lands on the ice */}
        <g transform={`translate(780 ${lerp(1000, 1180, ease(f, b(2), 10))})`} opacity={ease(f, b(2), 4) * (0.25 + 0.75 * res)}>
          <ellipse cx={0} cy={60} rx={30} ry={7} fill="#0C2434" opacity={0.3} />
          <path d="M 0,60 V -20" stroke={C.line} strokeWidth={6} />
          <rect x={-116} y={-70} width={232} height={48} rx={5} fill={C.paper} stroke={C.line} strokeWidth={4} />
          <text x={0} y={-38} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>ARCTIC SEA ICE</text>
        </g>
        <HeldTravel f={f} x={700} y={1110} w={180} h={60} seed={11} strength={0.4} rx={20} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S2, the plane banks over the pack ice and the pod fires color and thermal together */
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const px = lerp(330, 760, f / p.dur);
  const py = 840 + 30 * Math.sin(f / 30);
  const alt = ease(f, b(5), 14);
  return (
    <Frame p={p} z0={1.0} z1={1.06} overlay={<>
      <Plate text="NOAA SURVEY PLANE" x={540} y={560} size={36} tone="dark" p={vis(f, b, [3, 4], 0)} />
      <Plate text="COLOR + THERMAL · TOGETHER" x={540} y={560} size={36} tone="dark" p={vis(f, b, [3, 4], 1)} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        <IceWorld f={f} hz={660} seed={2} drift={0.6} />
        {/* the plane's shadow sliding over a floe */}
        <ellipse cx={px - 120} cy={1280} rx={170} ry={26} fill="#0C2434" opacity={0.22} />
        <g transform={`rotate(-6 ${px} ${py})`}>
          <BushPlane x={px} y={py} scale={2.1} f={f} mode="fly" body={C.plane} />
          <SurveyPod x={px + 14} y={py + 76} scale={0.75} f={f} text="" plateSize={18} shutter={b(4)} />
        </g>
        {/* the altimeter line and tag */}
        <g opacity={alt}>
          <path d={`M ${px + 10},${py + 120} L ${px + 10},${lerp(py + 120, 1240, alt)}`} stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" />
          <g transform={`translate(${px + 10} ${lerp(py + 120, 1240, alt)}) rotate(${settle(f, b(5) + 14, 8)})`}>
            <rect x={-92} y={-26} width={184} height={52} rx={6} fill={C.paper} stroke={C.line} strokeWidth={4} />
            <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} fill={C.ink}>1,000 FT</text>
          </g>
        </g>
        <HeldTravel f={f} x={px - 80} y={1218} w={190} h={60} seed={12} strength={0.3} rx={14} mode="sweep" />
      </SVG>
    </Frame>
  );
};

/** S3, the tile wall stacks up, a few glow, and one dark tile gets the pin tag */
const COLS = 7, ROWS = 13, TW = 136, TH = 100, TG = 10, TX = (1080 - (COLS * TW + (COLS - 1) * TG)) / 2, TY = 330;
const WARM = [9, 23, 38, 52, 67, 80];
const DARK = 46;
const tilePos = (i: number) => ({x: TX + (i % COLS) * (TW + TG), y: TY + Math.floor(i / COLS) * (TH + TG)});
const TileWall: React.FC<{f: number; build: number; glow: number; tagK: number; frameAK?: boolean}> = ({f, build, glow, tagK, frameAK = true}) => {
  const n = COLS * ROWS;
  return (
    <g>
      <rect data-band="ok" x={-200} y={-200} width={1480} height={2320} fill="#1B2A36" />
      <rect data-band="ok" x={TX - 24} y={TY - 24} width={COLS * TW + (COLS - 1) * TG + 48} height={ROWS * TH + (ROWS - 1) * TG + 48} rx={10} fill="#0F1A22" stroke={C.line} strokeWidth={6} />
      {Array.from({length: n}).map((_, i) => {
        const k = clamp01(build * n * 1.15 - (i * 0.9 + h01(i, 9) * 6));
        const {x, y} = tilePos(i);
        const w = WARM.indexOf(i);
        return <Tile key={i} x={x} y={y - (1 - k) * 40} w={TW} h={TH} i={i} op={k} warm={w >= 0 ? clamp01(glow * WARM.length - w) : 0} dark={i === DARK} />;
      })}
      {frameAK && <AKMark x={TX + 4} y={TY + ROWS * (TH + TG) - 6} s={0.08} fill="#6E97AE" stroke="#6E97AE" op={0.9} />}
      {(() => {
        const {x, y} = tilePos(DARK);
        return <PinTag x={x + TW * 0.5} y={y + TH * 0.55} s={2.0} p={tagK} f={f} />;
      })()}
    </g>
  );
};
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  return (
    <Frame p={p} z0={1.08} z1={1.0} oy={960} bg="#1B2A36" overlay={<>
      <Plate text="1,000,000 IMAGES" x={540} y={560} size={40} tone="dark" p={vis(f, b, [6, 7], 0)} />
      <Plate text="MAY BE 7,000 TO 9,000 ANIMALS" x={540} y={560} size={36} tone="dark" p={vis(f, b, [6, 7], 1)} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        <TileWall f={f} build={easeIO(f, b(6), 70)} glow={ease(f, b(7), 40)} tagK={ease(f, b(8), 14)} />
        <HeldTravel f={f} x={TX} y={TY} w={COLS * TW} h={ROWS * TH} seed={13} strength={0.4} mode="sweep" />
      </SVG>
    </Frame>
  );
};

/** S4, the analyst by a window onto the ice, the calendar sheds a year, the prints topple */
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const topple = ease(f, b(10), 16);
  return (
    <Frame p={p} z0={1.02} z1={1.08} oy={940} bg={C.wall} overlay={<>
      <Plate text="NOAA, 2019 · A YEAR BY HAND" x={540} y={560} size={36} tone="plate" p={vis(f, b, [9, 10], 0)} />
      <Plate text="AFTER EVERY SEASON" x={540} y={560} size={36} tone="plate" p={vis(f, b, [9, 10], 1)} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        <Room f={f} win={[600, 640, 380, 280]} map={[110, 680, 0.3]} floorY={1180} />
        {/* the calendar shedding its months */}
        <g transform="translate(470 680)">
          <rect x={-64} y={0} width={128} height={150} rx={6} fill={C.paper} stroke={C.line} strokeWidth={5} />
          <rect x={-64} y={0} width={128} height={30} rx={6} fill={C.ink} />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={C.paper}>2019</text>
        </g>
        {Array.from({length: 12}).map((_, i) => {
          const t0 = b(9) + i * 9;
          const k = clamp01((f - t0) / 70);
          if (k <= 0 || k >= 1) return null;
          return <rect key={i} x={430 + 40 * Math.sin(k * 6 + i) + i * 6} y={720 + k * 520} width={80} height={60} fill={C.paperD} stroke={C.line} strokeWidth={3} transform={`rotate(${k * 200 + i * 20} ${470 + i * 6} ${750 + k * 520})`} opacity={1 - k * 0.3} />;
        })}
        {/* the desk */}
        <rect data-band="ok" x={-200} y={1180} width={1480} height={800} fill={C.desk} stroke={C.line} strokeWidth={6} />
        <rect x={-200} y={1180} width={1480} height={30} fill="#3E6A86" />
        {/* the stack of prints that topples into a tray */}
        <rect x={720} y={1230} width={260} height={60} rx={6} fill={C.deskD} stroke={C.line} strokeWidth={5} />
        {Array.from({length: 8}).map((_, i) => (
          <g key={i} transform={`translate(${780 + topple * (i * 12)} ${1150 - i * 14 + topple * (i * 14 + 60)}) rotate(${topple * (12 - i * 3)})`}>
            <rect x={-70} y={-20} width={140} height={20} fill={i % 2 ? C.ice : '#E2EDF2'} stroke={C.line} strokeWidth={3} />
          </g>
        ))}
        {/* desk lamp */}
        <path d="M 980,1180 L 940,980 L 1010,900" stroke={C.line} strokeWidth={12} fill="none" />
        <path d="M 980,880 l 70,40 l -40,40 Z" fill={C.ink} />
        <DeskNearPlane f={f} y={1560} />
        <Analyst f={f} x={360} y={1230} s={1.15} lean={0.45 + 0.45 * Math.sin(f / 22)} rub={ease(f, b(10) + 6, 12) * (1 - ease(f, b(10) + 40, 14))} cues={[b(9), b(10)]} />
        {/* the magnifier over a print */}
        <g transform={`translate(${560 + 20 * Math.sin(f / 24)} 1230)`}>
          <rect x={-80} y={-10} width={160} height={110} fill={C.ice} stroke={C.line} strokeWidth={3} />
          <circle r={56} cx={0} cy={40} fill="#D5ECF7" stroke={C.line} strokeWidth={8} opacity={0.85} />
          <path d="M 40,80 L 100,140" stroke={C.line} strokeWidth={14} />
        </g>
        <HeldTravel f={f} x={110} y={680} w={300} h={210} seed={14} strength={0.4} rx={8} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S5, the color and thermal frames slide into register inside an Alaska outline, the box snaps around the seal */
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slide = easeIO(f, b(11), 30);
  const box = ease(f, b(12), 12);
  const lx = lerp(-320, 540, slide), rx = lerp(1400, 540, slide);
  return (
    <Frame p={p} z0={1.0} z1={1.06} bg="#13202B" overlay={<>
      <Plate text="COLOR FRAME · THERMAL FRAME" x={540} y={560} size={34} tone="dark" p={vis(f, b, [11, 12], 0)} />
      <Plate text="SEAL HEAT SIGNATURES" x={540} y={560} size={36} tone="dark" p={vis(f, b, [11, 12], 1)} /> {/* plate-overlap-ok: sequenced */}
      <Plate text="DEVELOPED WITH MICROSOFT AI" x={540} y={1250} size={30} tone="plate" p={ease(f, b(13), 12)} rot={settle(f, b(13) + 10, 3)} />
    </>}>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2320} fill="#13202B" />
        <AKMark x={140} y={260} s={0.8} stroke="#2E4F66" op={0.9} />
        {/* color frame: real ice with a lit seal */}
        <g transform={`translate(${lx} 960)`} opacity={1 - slide * 0.25}>
          <rect x={-430} y={-320} width={860} height={640} fill={C.ice} stroke={C.line} strokeWidth={7} />
          <path d="M -430,-90 q 260,-50 860,20 L 430,-40 q -560,-60 -860,0 Z" fill={C.lead} stroke={C.line} strokeWidth={3} />
          <path d="M -430,200 q 300,-30 860,10" stroke={C.iceS} strokeWidth={26} fill="none" opacity={0.8} />
          <g transform="translate(0 150)"><RingedSeal x={0} y={0} scale={0.9} f={f} seed={5} /></g>
          <text x={-400} y={-280} fontFamily={MONO} fontWeight={800} fontSize={28} fill={C.ink}>COLOR</text>
        </g>
        {/* thermal frame: violet field and a white-hot ramp around her */}
        <g transform={`translate(${rx} 960)`} opacity={1 - slide * 0.62}>
          <rect x={-430} y={-320} width={860} height={640} fill={C.vio} stroke={C.line} strokeWidth={7} />
          <path d="M -430,-90 q 260,-50 860,20" stroke="#5A2E82" strokeWidth={40} fill="none" />
          <ellipse cx={-10} cy={110} rx={210} ry={84} fill={C.mag} opacity={0.55} />
          <ellipse cx={0} cy={108} rx={140} ry={56} fill={C.coral} opacity={0.85} />
          <ellipse cx={70} cy={90} rx={56} ry={30} fill={C.hot} />
          <text x={240} y={-280} fontFamily={MONO} fontWeight={800} fontSize={28} fill={C.hot}>THERMAL</text>
        </g>
        {slide > 0.98 && f < b(11) + 44 && <rect x={110} y={640} width={860} height={640} fill="none" stroke="#FFFFFF" strokeWidth={10} opacity={1 - (f - b(11) - 30) / 14} />}
        <DetBox x={556} y={1060} w={360} h={190} k={box} />
        <NearStrip f={f} y={1560} seed={1} />
        <HeldTravel f={f} x={330} y={1226} w={420} h={48} seed={15} strength={0.4} rx={12} mode="sweep" gain={box > 0.5 ? 1 : 0} />
      </SVG>
    </Frame>
  );
};

/** S6, under the wing: the 2019 plate, PAGE LAST UPDATED NOV 6, the gold stamp swells the plate, the glance */
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const swing = ease(f, b(14), 22);
  const stampT = b(16);
  const hit = f >= stampT + 8;
  const grow = hit ? 1 + 0.45 * ease(f, stampT + 8, 14) : 1;
  const glance = ease(f, b(17), 10) * (1 - ease(f, b(17) + 34, 14));
  const stampY = lerp(-200, 790, ease(f, stampT, 8)) - (hit ? ease(f, stampT + 14, 16) * 900 : 0);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={900} bg={C.sky} overlay={<>
      <Plate text="NOAA · ALASKA FISHERIES SCIENCE CENTER" x={540} y={1250} size={28} tone="dark" p={ease(f, b(14) + 8, 12) * (1 - ease(f, b(15) - 8, 8))} />
      <Plate displayLines={['THE PAGE NOW SAYS', 'SUPER INTELLIGENCE']} text="THE PAGE NOW SAYS SUPER INTELLIGENCE" x={540} y={1120} size={32} tone="dark" p={vis(f, b, [16, 17], 0)} />
      <Plate text="DID IT GET SMARTER?" x={540} y={560} size={42} tone="warn" p={ease(f, b(17), 12)} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        <UnderWing f={f}>
          <g transform={`translate(${lerp(1300, 540, swing) + settle(f, b(14) + 22, 10)} 0)`}>
            <path d="M 0,440 L 0,640" stroke={C.line} strokeWidth={18} />
            <path d="M 0,440 L 0,640" stroke={C.iceC} strokeWidth={9} />
            <g transform={`rotate(${settle(f, b(15), 10)} -360 550)`}><TearCal x={-360} y={560} s={1} page="NOV 6" tear={1} /></g>
            <path d="M -300,566 L -10,520" stroke={C.ink} strokeWidth={4} />
            <SurveyPod x={0} y={700} scale={1.8} f={f} text={hit ? 'SUPER INTELLIGENCE' : ''} plateSize={20}
              gold={hit} plateGrow={grow} tilt={glance * 9} lookDown={glance} shutter={b(14) + 30} />
          </g>
          {/* the gold stamp */}
          <g transform={`translate(540 ${stampY})`} opacity={f > stampT - 2 && f < stampT + 40 ? 1 : 0}>
            <rect x={-60} y={-260} width={120} height={200} rx={16} fill={C.ink} stroke={C.line} strokeWidth={6} />
            <rect x={-150} y={-70} width={300} height={70} rx={10} fill={C.gold} stroke={C.line} strokeWidth={6} />
            <rect x={-150} y={-20} width={300} height={20} fill={C.goldD} />
          </g>
          {hit && f < stampT + 30 && <circle cx={540} cy={890} r={(f - stampT - 8) * 18} fill="none" stroke={C.goldL} strokeWidth={8} opacity={1 - (f - stampT - 8) / 22} />}
        </UnderWing>
        <HeldTravel f={f} x={250} y={850} w={580} h={110} seed={16} strength={0.4} rx={14} mode="sweep" />
      </SVG>
    </Frame>
  );
};

/** S7, the ear stone race: the reader with its gold plate, the near infrared band, the stopwatch, a person's hand at the microscope */
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const drop = ease(f, b(18), 12);
  const beam = ((f - b(19)) / 40) % 1;
  const sw = f >= b(20) ? clamp01((f - b(20)) / 60) : 0;
  const nStones = f >= b(21) ? Math.min(10, Math.floor((f - b(21)) / 7) + 1) : 0;
  const cam = track([{t: 0, z: 1.06, fx: 520, fy: 1000}, {t: p.dur, z: 1.0, fx: 560, fy: 980}]);
  return (
    <Frame p={p} cam={cam} bg={C.wall} overlay={<>
      <Plate text="SUPER INTELLIGENCE · AGING FISH" x={540} y={560} size={34} tone="gold" p={vis(f, b, [18, 19, 20, 21], 0)} />
      <Plate text="NEAR INFRARED" x={540} y={560} size={36} tone="dark" p={vis(f, b, [18, 19, 20, 21], 1)} /> {/* plate-overlap-ok: sequenced */}
      <Plate text="30 TO 50 SECONDS PER EAR STONE" x={540} y={560} size={34} tone="dark" p={vis(f, b, [18, 19, 20, 21], 2)} /> {/* plate-overlap-ok: sequenced */}
      <Plate displayLines={['10X+ FASTER THAN A PERSON', 'AT A MICROSCOPE']} text="10X+ FASTER THAN A PERSON AT A MICROSCOPE" x={540} y={580} size={32} tone="dark" p={vis(f, b, [18, 19, 20, 21], 3)} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        <Room f={f} win={[640, 660, 340, 240]} map={[90, 700, 0.24]} floorY={1100} />
        {/* the bench */}
        <rect data-band="ok" x={-200} y={1100} width={1480} height={900} fill={C.desk} stroke={C.line} strokeWidth={6} />
        <rect x={-200} y={1100} width={1480} height={34} fill={C.paper} stroke={C.line} strokeWidth={4} />
        {/* the reader drops onto the bench */}
        <g transform={`translate(0 ${(1 - drop) * -500})`}>
          <Reader f={f} x={330} y={1130 + settle(f, b(18) + 12, 6)} s={1.0} beam={f >= b(19) ? beam : 0} look={Math.sin(f / 30)} />
        </g>
        {/* the stone in the tray, and the done tray filling */}
        <ellipse cx={330 + (f >= b(20) ? sw * 260 : 0)} cy={1090 + (sw > 0.6 ? (sw - 0.6) * 100 : 0)} rx={12} ry={8} fill="#E8DDC8" stroke={C.line} strokeWidth={3} />
        <rect x={520} y={1160} width={200} height={50} rx={8} fill={C.ink} stroke={C.line} strokeWidth={4} />
        {Array.from({length: nStones}).map((_, i) => {
          const t = f - (b(21) + i * 7);
          const yy = lerp(1080, 1180, clamp01(t / 6));
          return <ellipse key={i} cx={540 + (i % 5) * 36} cy={yy - Math.floor(i / 5) * 14 - Math.abs(settle(f, b(21) + i * 7 + 6, 6, 10))} rx={13} ry={8} fill="#E8DDC8" stroke={C.line} strokeWidth={3} />;
        })}
        {/* the microscope and the person's hand */}
        <DeskNearPlane f={f} y={1500} />
        <Microscope f={f} x={840} y={1140} s={1.0} turn={Math.sin(f / 26) * 0.6 + f / 400} />
        {/* the stopwatch */}
        <g transform="translate(560 900)" opacity={ease(f, b(20) - 6, 10)}>
          <circle r={86} fill={C.paper} stroke={C.line} strokeWidth={8} />
          <rect x={-14} y={-112} width={28} height={24} fill={C.ink} />
          <path d={`M 0,0 L ${70 * Math.sin(sw * Math.PI * 1.6)},${-70 * Math.cos(sw * Math.PI * 1.6)}`} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
          <path d={`M 0,0 m 0,-72 A 72,72 0 0 1 ${72 * Math.sin(Math.PI * 1.0)},${-72 * Math.cos(Math.PI * 1.0)}`} stroke={C.mag} strokeWidth={8} fill="none" opacity={0.5} />
          <circle r={8} fill={C.ink} />
        </g>
        <HeldTravel f={f} x={160} y={870} w={340} h={260} seed={17} strength={0.4} rx={30} mode="sweep" />
      </SVG>
    </Frame>
  );
};

/** S8, the framed 2019 article swings on its hook, its seal photo wears the pin tag, an ink string pins it to the gold plate in the window */
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const sw = ease(f, b(22), 10);
  const ang = 8 * Math.sin((f - b(22)) / 9) * Math.exp(-(Math.max(0, f - b(22))) / 60) + 1.5 * Math.sin(f / 31);
  const str = easeIO(f, b(23), 18);
  return (
    <Frame p={p} z0={1.04} z1={1.0} oy={940} bg={C.wall} overlay={<>
      <Plate text={'2019 · "ARTIFICIAL INTELLIGENCE"'} x={540} y={560} size={34} tone="plate" p={vis(f, b, [22, 23], 0)} />
      <Plate text="SAME SEAL WORK" x={540} y={560} size={38} tone="dark" p={vis(f, b, [22, 23], 1)} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        <Room f={f} win={[700, 1020, 300, 220]} map={[0, 0, 0]} floorY={1500} />
        {/* the pod's gold plate glinting in the window */}
        <g transform="translate(850 1110)">
          <rect x={-90} y={-16} width={180} height={32} rx={4} fill={C.gold} stroke={C.line} strokeWidth={4} />
          <path d="M -80,-10 h 40" stroke={C.goldL} strokeWidth={3} />
          <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={13} fill="#2A1E04">SUPER INTELLIGENCE</text>
        </g>
        <circle cx={420} cy={660} r={10} fill={C.ink} />
        <g transform={`translate(420 ${lerp(500, 660, sw)}) rotate(${ang})`} opacity={sw}>
          <path d="M 0,0 L -140,80 M 0,0 L 140,80" stroke={C.ink} strokeWidth={4} />
          <rect x={-300} y={80} width={600} height={560} fill={C.desk} stroke={C.line} strokeWidth={8} />
          <rect x={-270} y={110} width={540} height={500} fill={C.paper} />
          <text x={-250} y={160} fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.ink}>NOAA FISHERIES · 2019</text>
          <text x={-250} y={204} fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>DEVELOPING ARTIFICIAL</text>
          <text x={-250} y={242} fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>INTELLIGENCE TO FIND</text>
          <text x={-250} y={280} fontFamily={MONO} fontWeight={800} fontSize={30} fill={C.ink}>ICE SEALS</text>
          <rect x={-250} y={310} width={300} height={200} fill={C.ice} stroke={C.line} strokeWidth={4} />
          <path d="M -250,380 q 150,-20 300,10" stroke={C.lead} strokeWidth={10} fill="none" />
          <g transform="translate(-100 460) scale(0.5)"><RingedSeal x={0} y={0} f={f} seed={6} /></g>
          <PinTag x={-100} y={500} s={0.6} p={1} f={f} />
          {Array.from({length: 6}).map((_, i) => <rect key={i} x={80} y={320 + i * 30} width={160} height={10} fill={C.paperD} />)}
        </g>
        {/* a row of survey drawers, its own lower third */}
        <rect data-band="ok" x={-200} y={1500} width={1480} height={600} fill={C.deskD} stroke={C.line} strokeWidth={6} />
        {Array.from({length: 6}).map((_, i) => (
          <g key={`dr${i}`} transform={`translate(${20 + (i % 3) * 350} ${1530 + Math.floor(i / 3) * 190})`}>
            <rect x={0} y={0} width={320} height={160} rx={8} fill="#2B4F66" stroke={C.line} strokeWidth={5} />
            <rect x={110} y={60} width={100} height={22} rx={10} fill="#8FA8B6" stroke={C.line} strokeWidth={3} />
            <rect x={120} y={110} width={80} height={30} fill={C.paper} stroke={C.line} strokeWidth={2} />
          </g>
        ))}
        {/* the ink string from the photo to the window */}
        <path d={`M 360,1000 Q 600,${1060 + 40 * Math.sin(f / 20)} ${lerp(360, 790, str)},${lerp(1000, 1110, str)}`} stroke={C.ink} strokeWidth={5} fill="none" opacity={str > 0 ? 1 : 0} />
        <circle cx={360} cy={1000} r={10} fill={C.ink} opacity={str > 0 ? 1 : 0} />
        <HeldTravel f={f} x={150} y={790} w={540} h={500} seed={18} strength={0.35} rx={6} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S9, the order's desk: the order slides in, the word card flips, the browser multiplies, the open empty envelope pins up */
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slide = ease(f, b(24), 16);
  const flip = ease(f, b(25), 14);
  const pull = easeIO(f, b(26), 40);
  const env = ease(f, b(27), 14);
  const sheet = ease(f, b(42), 20);
  const cam = track([{t: 0, z: 1.1, fx: 540, fy: 960}, {t: b(26), z: 1.1, fx: 540, fy: 980}, {t: b(26) + 40, z: 1.0, fx: 540, fy: 980}, {t: b(27), z: 1.0, fx: 540, fy: 980}, {t: b(27) + 30, z: 1.0, fx: 540, fy: 980}, {t: p.dur, z: 1.02, fx: 540, fy: 980}]);
  const cardW = monoW('ARTIFICIAL INTELLIGENCE', 30) + 40;
  return (
    <Frame p={p} cam={cam} bg={C.warmDesk} overlay={<>
      <Plate text="EXECUTIVE ORDER · SEPT 29" x={540} y={560} size={36} tone="plate" p={vis(f, b, [24, 25, 26, 27, 42], 0)} />
      <Plate text="SAY SUPER INTELLIGENCE" x={540} y={560} size={36} tone="dark" p={vis(f, b, [24, 25, 26, 27, 42], 1)} /> {/* plate-overlap-ok: sequenced */}
      <Plate text="WEBSITES · REPORTS" x={540} y={560} size={36} tone="dark" p={vis(f, b, [24, 25, 26, 27, 42], 2)} /> {/* plate-overlap-ok: sequenced */}
      <Plate displayLines={['PROPOSED NEW DEFINITION', 'DUE NOV 28']} text="PROPOSED NEW DEFINITION DUE NOV 28" x={540} y={580} size={34} tone="warn" p={vis(f, b, [24, 25, 26, 27, 42], 3)} /> {/* plate-overlap-ok: sequenced */}
      <Plate displayLines={['DUE TO THE PRESIDENT', 'NOT PUBLIC YET']} text="DUE TO THE PRESIDENT · NOT PUBLIC YET" x={540} y={580} size={34} tone="warn" p={vis(f, b, [24, 25, 26, 27, 42], 4)} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2320} fill={C.warmDesk} />
        {Array.from({length: 14}).map((_, i) => <path key={i} d={`M -200,${-100 + i * 150} q 700,30 1480,0`} stroke={C.warmDeskD} strokeWidth={5} fill="none" opacity={0.6} />)}
        {/* lamp pool */}
        <ellipse cx={420} cy={1000} rx={600} ry={500} fill="#FFD9A0" opacity={0.12} />
        {/* the wall of browser windows behind (revealed by the pull back) */}
        {Array.from({length: 12}).map((_, i) => {
          const k = clamp01(pull * 12 - i);
          const x = 150 + (i % 4) * 200, y = 1360 + Math.floor(i / 4) * 150;
          if (k <= 0 || (i === 5)) return null;
          return (
            <g key={i} opacity={k} transform={`translate(${x} ${y})`}>
              <rect x={0} y={0} width={180} height={120} rx={8} fill="#FFFFFF" stroke={C.line} strokeWidth={4} />
              <rect x={0} y={0} width={180} height={24} rx={8} fill={C.iceC} />
              <text x={12} y={70} fontFamily={MONO} fontWeight={800} fontSize={12} fill={C.ink}>{'SUPER INTELLIGENCE'.slice(0, Math.floor(clamp01((f - b(26)) / 30 - i * 0.05) * 18))}</text>
            </g>
          );
        })}
        {/* the order document */}
        <g transform={`translate(${lerp(-500, 330, slide)} 1050) rotate(${lerp(-12, -3, slide)})`}>
          <rect x={-250} y={-330} width={500} height={660} fill={C.paper} stroke={C.line} strokeWidth={6} />
          <text x={0} y={-270} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>EXECUTIVE ORDER</text>
          <text x={0} y={-238} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>SEPT 29</text>
          {Array.from({length: 12}).map((_, i) => <rect key={i} x={-200} y={-200 + i * 34} width={i % 3 === 2 ? 260 : 400} height={10} fill={C.paperD} />)}
          {/* the word card that flips */}
          <g transform={`translate(0 120) scale(1 ${Math.abs(Math.cos(flip * Math.PI))})`}>
            <rect x={-cardW / 2} y={-28} width={cardW} height={56} rx={6} fill={flip > 0.5 ? C.ink : '#FFFFFF'} stroke={C.line} strokeWidth={4} />
            <text x={0} y={10} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={flip > 0.5 ? C.paper : C.ink}>{flip > 0.5 ? 'SUPER INTELLIGENCE' : 'ARTIFICIAL INTELLIGENCE'}</text>
          </g>
          {/* the seal presses itself */}
          <g transform={`translate(150 250) scale(${lerp(1.6, 1, ease(f, b(24) + 10, 10))})`} opacity={ease(f, b(24) + 10, 6)}>
            <circle r={52} fill="none" stroke={C.iceC} strokeWidth={8} />
            <circle r={34} fill="none" stroke={C.iceC} strokeWidth={4} />
          </g>
        </g>
        {/* one browser window typing, then multiplying */}
        <g transform="translate(760 820)">
          <rect x={-200} y={-130} width={400} height={260} rx={10} fill="#FFFFFF" stroke={C.line} strokeWidth={5} />
          <rect x={-200} y={-130} width={400} height={40} rx={10} fill={C.iceC} />
          <circle cx={-176} cy={-110} r={7} fill={C.paper} /><circle cx={-154} cy={-110} r={7} fill={C.paper} />
          <text x={-176} y={0} fontFamily={MONO} fontWeight={800} fontSize={26} fill={C.ink}>{'SUPER INTELLIGENCE'.slice(0, Math.floor(clamp01((f - b(26)) / 24) * 18))}</text>
          <rect x={-176} y={30} width={300} height={10} fill={C.paperD} /><rect x={-176} y={56} width={220} height={10} fill={C.paperD} />
        </g>
        {/* the open, empty envelope pinned to the desk board */}
        <g transform="translate(820 1180)">
          <rect x={-230} y={-120} width={460} height={300} rx={8} fill="#B89A6A" stroke={C.line} strokeWidth={5} opacity={env} />
          <circle cx={0} cy={-100} r={10} fill={C.ink} opacity={env} />
          <Envelope x={0} y={40} s={0.9} sheet={sheet} p={env} />
        </g>
        <HeldTravel f={f} x={140} y={720} w={480} h={640} seed={19} strength={0.3} rx={6} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S10, the definition cutaway: the order's page and the statute page side by side, the gold plate spins to its back, an ink line joins the phrases */
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const pages = ease(f, b(28), 16);
  const spin = easeIO(f, b(28) + 10, 50);
  const line = easeIO(f, b(29), 24);
  const part = easeIO(f, b(30), 26);
  return (
    <Frame p={p} z0={1.0} z1={1.06} bg={C.deskD} overlay={<>
      <Plate text="SEC. 3(A) · 15 U.S.C. 9401(3)" x={540} y={560} size={34} tone="plate" p={vis(f, b, [28, 29, 30], 1)} /> {/* plate-overlap-ok: sequenced */}
      <Plate text="TWO VIEWS" x={540} y={560} size={40} tone="dark" p={ease(f, b(30), 12)} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        <IceWorld f={f} hz={760} seed={6} />
        {/* the two pages, which part like doors onto the floe */}
        <g transform={`translate(${-part * 560} 0)`}>
          <rect data-band="ok" x={-200} y={-200} width={740} height={2320} fill={C.deskD} stroke={C.line} strokeWidth={8} />
          <g transform={`translate(${lerp(-400, 280, pages)} 1060)`}>
            <rect x={-230} y={-340} width={460} height={680} fill="#FFFFFF" stroke={C.line} strokeWidth={6} />
            <text x={-200} y={-290} fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>THE ORDER · SEC. 3(A)</text>
            {Array.from({length: 10}).map((_, i) => <rect key={i} x={-200} y={-250 + i * 30} width={i % 4 === 3 ? 220 : 400} height={9} fill={C.paperD} />)}
            <rect x={-206} y={70} width={412} height={92} fill="#FFF2B0" />
            <text x={-188} y={104} fontFamily={MONO} fontWeight={800} fontSize={19} fill={C.ink}>"ARTIFICIAL INTELLIGENCE"</text>
            <text x={-188} y={134} fontFamily={MONO} fontWeight={800} fontSize={19} fill={C.ink}>AS DEFINED IN 9401(3)</text>
            {Array.from({length: 5}).map((_, i) => <rect key={`b${i}`} x={-200} y={190 + i * 30} width={360} height={9} fill={C.paperD} />)}
          </g>
        </g>
        <g transform={`translate(${part * 560} 0)`}>
          <rect data-band="ok" x={540} y={-200} width={740} height={2320} fill={C.deskD} stroke={C.line} strokeWidth={8} />
          <g transform={`translate(${lerp(1480, 800, pages)} 1060)`}>
            <rect x={-230} y={-340} width={460} height={680} fill="#FFFFFF" stroke={C.line} strokeWidth={6} />
            <text x={-200} y={-290} fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>15 U.S.C. 9401(3)</text>
            {Array.from({length: 4}).map((_, i) => <rect key={i} x={-200} y={-250 + i * 30} width={400} height={9} fill={C.paperD} />)}
            <rect x={-206} y={-120} width={412} height={62} fill="#FFF2B0" />
            <text x={-188} y={-80} fontFamily={MONO} fontWeight={800} fontSize={19} fill={C.ink}>"ARTIFICIAL INTELLIGENCE"</text>
            {Array.from({length: 12}).map((_, i) => <rect key={`b${i}`} x={-200} y={-30 + i * 30} width={i % 3 === 2 ? 240 : 400} height={9} fill={C.paperD} />)}
          </g>
        </g>
        <g opacity={1 - part}><NearStrip f={f} y={1560} seed={3} dark={false} /></g>
        {/* the ink line joining the matched phrases */}
        <g opacity={1 - part}>
          <path d={`M 492,1178 C 540,${1190} 560,${980} ${lerp(492, 590, line)},${lerp(1178, 972, line)}`} stroke={C.ink} strokeWidth={6} fill="none" strokeDasharray={`${line * 900} 900`} />
        </g>
        {/* the gold plate on a chain spins to its back face */}
        <g opacity={1 - part}>
          <path d="M 540,-40 L 540,560" stroke={C.ink} strokeWidth={5} strokeDasharray="14 8" />
          <SurveyPod x={540} y={440} scale={1.5} f={f} plateOnly gold text="SUPER INTELLIGENCE" backText="SAME LEGAL DEFINITION" plateSpin={0.5 * spin} plateSize={24} />
        </g>
        <HeldTravel f={f} x={570} y={720} w={460} h={680} seed={20} strength={0.35} rx={6} mode="shadow" gain={part > 0.02 ? 0 : 1} />
      </SVG>
    </Frame>
  );
};

/** S11, one locked symmetric floe: two identical signs open the same way, the pod on a tripod dead center, the seal turns between them */
const TwoSigns: React.FC<{p: SP; tight?: boolean}> = ({p, tight = false}) => {
  const {f, b} = p;
  const bt0 = p.bt;
  // in the tight frame the beats of the wide frame are in the past: read them from absolute time
  const B = (id: number) => (tight ? bt0(id) - p.from : b(id));
  const L = ease(f, B(31), 18), R = ease(f, B(33), 18);
  const glint = clamp01((f - B(32)) / 30);
  const turns = tight ? (f > B(48) - 10 ? Math.tanh(3 * Math.sin((f - B(48) + 10) / 14)) : 0) : 0;
  const gust = ease(f, B(47), 30) * (1 - ease(f, B(47) + 50, 30));
  return (
    <Frame p={p} cam={tight ? () => ({z: 1.08, fx: 540, fy: 1000}) : undefined} z0={1.0} z1={1.0} oy={960} overlay={<>
      <Plate text={'"A NEW ERA"'} x={540} y={500} size={30} tone="plate" p={tight ? 0 : ease(f, B(32), 12) * (1 - ease(f, B(43) - 8, 8))} />
      <Plate text="THE ORDER'S CASE" x={540} y={500} size={30} tone="plate" p={tight ? 0 : ease(f, B(47), 12) * (1 - ease(f, B(32) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
      <Plate text="THE DEAN'S DOUBT" x={540} y={500} size={30} tone="plate" p={tight ? ease(f, B(48), 12) * (1 - ease(f, B(34) - 8, 8)) : 0} /> {/* plate-overlap-ok: sequenced */}
      <Plate text="SAME TOOLS · BOTH SIDES" x={540} y={500} size={30} tone="dark" p={tight ? ease(f, B(34), 12) : 0} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        <IceWorld f={f} hz={720} seed={7} drift={0.05} />
        <SignPost f={f} x={250} boardY={640} foot={1200} w={400} h={300} open={L} head="THE ORDER · SEPT 29" seed={1}
          lines={['"NOT MERELY', 'ARTIFICIAL', 'INTELLIGENCE"']} glint={glint} />
        <SignPost f={f} x={830} boardY={640} foot={1200} w={400} h={300} open={R} head="TILLIPMAN · GWU" seed={2}
          lines={['NO PURPOSE', 'OTHER THAN', 'REBRANDING']} glint={glint} />
        {/* the attribution cards slide in under each quote the same way */}
        <g opacity={ease(f, B(44), 12)} transform={`translate(830 ${985 + settle(f, B(44) + 12, 6)})`}>
          <rect x={-200} y={-24} width={400} height={48} rx={6} fill={C.paper} stroke={C.line} strokeWidth={4} />
          <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>ASSOC. DEAN · VIA GOVCIO</text>
        </g>
        <g opacity={ease(f, B(43), 12)} transform={`translate(250 ${985 + settle(f, B(43) + 12, 6)})`}>
          <rect x={-200} y={-24} width={400} height={48} rx={6} fill={C.paper} stroke={C.line} strokeWidth={4} />
          <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.ink}>CALLS FOR A DEFINITION</text>
        </g>
        <Tripod x={540} top={840} foot={1200} />
        <SurveyPod x={540} y={700} scale={0.8} f={f} gold text="SUPER INTELLIGENCE" plateSize={24} />
        <RingedSeal x={540} y={1290} scale={1.1} f={f} look={turns} lift={0.6} emotion="curious" seed={8} />
        {gust > 0 && Array.from({length: 14}).map((_, i) => <ellipse key={`gs${i}`} cx={(i * 83 + (f - B(47)) * 14) % 1200 - 60} cy={1150 + (i % 4) * 30 - gust * 40} rx={26} ry={6} fill="#FFFFFF" opacity={0.7 * gust} />)}
        <HeldTravel f={f} x={440} y={680} w={200} h={70} seed={21} strength={0.4} rx={14} mode="sweep" />
      </SVG>
    </Frame>
  );
};

const S11: React.FC<SceneProps> = ({p}) => <TwoSigns p={p} />;
const S11b: React.FC<SceneProps> = ({p}) => <TwoSigns p={p} tight />;

/** S12, back under the wing: the blank accuracy tag, the detector box finds nothing, the plate swells again */
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const tag = ease(f, b(35), 18);
  const tagAng = 14 * Math.sin((f - b(35)) / 8) * Math.exp(-Math.max(0, f - b(35)) / 40) + 2 * Math.sin(f / 23);
  const boxK = f < b(45) ? 0 : f < b(45) + 18 ? ease(f, b(45), 12) : 1 + ease(f, b(45) + 18, 14);
  const look = ease(f, b(36), 12);
  const grow = 1.45 + 0.12 * ease(f, b(37), 14) + 0.02 * Math.sin(f / 9) * ease(f, b(37), 14);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={900} overlay={<>
      <Plate text="ACCURACY · NOT GIVEN" x={540} y={560} size={36} tone="plate" p={vis(f, b, [35, 45, 36, 37], 0)} />
      <Plate text="NO ACCURACY FIGURE ON THE PAGE" x={540} y={560} size={34} tone="dark" p={vis(f, b, [35, 45, 36, 37], 1)} /> {/* plate-overlap-ok: sequenced */}
      <Plate text="NOTHING ON THE PAGE SHOWS SMARTER" x={540} y={560} size={32} tone="dark" p={vis(f, b, [35, 45, 36, 37], 2)} /> {/* plate-overlap-ok: sequenced */}
      <Plate text="A BIGGER NAME" x={540} y={560} size={46} tone="gold" p={vis(f, b, [35, 45, 36, 37], 3)} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        <UnderWing f={f + 400}>
          <path d="M 540,440 L 540,640" stroke={C.line} strokeWidth={18} />
          <path d="M 540,440 L 540,640" stroke={C.iceC} strokeWidth={9} />
          <SurveyPod x={540} y={700} scale={1.6} f={f} gold text="SUPER INTELLIGENCE" plateSize={20} plateGrow={grow} tilt={-look * 7} lookDown={-0.2 * look} />
          {/* the blank tag on a chain from the mount */}
          <g transform={`translate(150 450) rotate(${tagAng})`} opacity={tag}>
            <path d={`M 0,0 L 0,${lerp(40, 290, tag)}`} stroke={C.ink} strokeWidth={5} strokeDasharray="12 6" />
            <g transform={`translate(0 ${lerp(40, 290, tag)})`}>
              <rect x={-90} y={0} width={180} height={110} rx={10} fill={C.paper} stroke={C.line} strokeWidth={5} />
              <text x={0} y={34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.ink}>ACCURACY</text>
              <rect x={-60} y={56} width={120} height={30} rx={4} fill="none" stroke={C.iceC} strokeWidth={3} strokeDasharray="8 6" />
            </g>
          </g>
          <DetBox x={150 - 345 * Math.sin(tagAng * Math.PI / 180)} y={450 + 345} w={200} h={130} k={boxK} />
        </UnderWing>
        <HeldTravel f={f} x={290} y={900} w={500} h={90} seed={22} strength={0.35} rx={10} mode="sweep" />
      </SVG>
    </Frame>
  );
};

/** S13, the signature crane: the plate settles on its edge over the thermal counter, the camera cranes into the tagged tile,
 *  the seal rises out of it and looks up at the lens, then folds back into two pixels */
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const edge = easeIO(f, 0, 14);
  const wob = edge > 0.98 ? 3 * Math.sin(f / 4) * Math.exp(-Math.max(0, f - 14) / 20) : 0;
  const dive = easeIO(f, b(39) - 6, 30);
  const rise = easeIO(f, b(39) + 4, 18);
  const fold = easeIO(f, b(40), 12);
  const ring = ease(f, b(40) + 10, 9);
  const day = '11-' + String(Math.min(28, 14 + Math.floor(clamp01(f / 110) * 14))).padStart(2, '0');
  const tz = lerp(1, 6.2, dive);
  const {x: tx, y: ty} = tilePos(DARK);
  const cx = tx + TW * 0.5, cy = ty + TH * 0.5;
  const inside = clamp01((dive - 0.85) * 7);
  return (
    <Frame p={p} z0={1.0} z1={1.0} bg={C.vio} overlay={<>
      <Plate displayLines={['PROPOSED DEFINITION', 'DUE NOV 28']} text="PROPOSED DEFINITION · DUE NOV 28" x={540} y={1240} size={30} tone="dark" p={ease(f, 6, 12) * (1 - ease(f, b(39) - 10, 8))} />
      <Plate text="A SEAL CAN STILL BE 2 PIXELS" x={540} y={1250} size={32} tone="plate" p={ease(f, b(39) + 24, 12) * (1 - ease(f, b(40) - 8, 8))} /> {/* plate-overlap-ok: sequenced */}
    </>}>
      <SVG>
        {/* the thermal frame, the tile wall seen through it, and the pod above, opaque, its plate settling on its edge */}
        <g opacity={1 - inside + fold}>
          <Thermal f={f} op={1} stamp={dive < 0.5 || fold > 0.5 ? day : undefined} />
        </g>
        <g transform={`translate(${cx} ${cy}) scale(${tz}) translate(${-cx} ${-cy})`} opacity={(0.35 + 0.65 * dive) * (1 - inside)}>
          <TileWall f={f} build={1} glow={1} tagK={1 - clamp01(dive * 4)} frameAK={false} />
        </g>
        <g opacity={1 - dive}>
          <SurveyPod x={540} y={560} scale={1.2} f={f} gold text="SUPER INTELLIGENCE" plateSize={24} plateSpin={0.25 * edge} tilt={wob} />
        </g>
        {/* inside the tile: the ice, the stake tag from the open, the pod above, and the seal rising out of her two pixels to look up at the lens */}
        <g opacity={inside * (1 - fold)}>
          <IceWorld f={f} hz={700} seed={9} />
          <PinTag x={300} y={820} s={1.0} p={1} f={f} />
          <g transform="translate(860 1180)">
            <ellipse cx={0} cy={60} rx={30} ry={7} fill="#0C2434" opacity={0.3} />
            <path d="M 0,60 V -20" stroke={C.line} strokeWidth={6} />
            <rect x={-116} y={-70} width={232} height={48} rx={5} fill={C.paper} stroke={C.line} strokeWidth={4} />
            <text x={0} y={-38} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={C.ink}>ARCTIC SEA ICE</text>
          </g>
          <SurveyPod x={540} y={330} scale={1.0} f={f} gold text="SUPER INTELLIGENCE" plateSize={24} plateSpin={0.25} lookDown={1} />
        </g>
        <RingedSeal x={540} y={1150} scale={2.0} f={f} pixels={clamp01(1 - rise + fold)} thermal={fold} lift={rise * (1 - fold)} look={-0.3 * rise} emotion="curious" seed={10} />
        {fold > 0.98 && <circle cx={540} cy={1118} r={lerp(220, 90, ring) + 8 * Math.sin(f / 6)} fill="none" stroke={C.hot} strokeWidth={8} opacity={ring} />}
        <HeldTravel f={f} x={440} y={500} w={200} h={70} seed={23} strength={0.4} rx={14} mode="sweep" gain={dive > 0.02 ? 0 : 1} />
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S11b, 13: S12, 14: S13};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

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

export const ep1114Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1114Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1114: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 5.9, 11.6, 17.1, 22.5, 27.8, 37.3, 51.2, 57.3, 72.1, 81.5, 96.7, 107.9, 119.4].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.sky}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#13202B" ink="#F2F7F9" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
