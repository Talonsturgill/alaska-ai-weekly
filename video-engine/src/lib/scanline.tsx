import React from 'react';
import {tones, ContactShadow, RimLight} from './lighting';
import {figureIdle, FigurePose} from './figureidle';
import {MONO, monoW} from './prospect';

/**
 * THE SCANLINE FAMILY (2026-11-24, "Trust the Flag").
 *
 * Specs (a faced Raspberry Pi 4B board, the hero), a small quadrotor that carries a push-broom camera pod (NO face, never a
 * cargo drone), the rainbow push-broom scanline and its spectrum cards (the machine's view ONLY), red GPS pin flags, a
 * clipboard search grid with pins and fog, an inked CLEARED rubber stamp that can flip to NOT CLEARED, the DBSCAN bouncer
 * (a faced velvet-rope post with a clipboard, an OBJECT, never a person), a mute faced stopwatch, staged search gear with NO
 * faces (waders, buoy, life jacket, net, bucket, tarp, jacket) that can blend toward the grass, a two-faced coin, and an
 * overcast July tundra world (tundra, mudflat, swamp grass) with near tussocks for the master's floor.
 *
 * Palette roles (art_direction.json): signal red is ONLY flags and the stamp's ink; the spectrum is ONLY the machine's view.
 * Summer only, no snow. Every faced character takes `cues` and commits a beat pose on each (the forest.tsx beatPose pattern).
 */
export const SCN = {
  ink: '#2A2620', sky: '#B9C3C6', skyL: '#D8DED9', skyD: '#8E9A9C', sea: '#7F8E90', seaL: '#A9B6B4',
  sedge: '#7E8A4A', sedgeL: '#A4AE68', khaki: '#A08A54', khakiL: '#C4AE76', shade: '#3F4B2E',
  mud: '#6F6A62', mudL: '#9A948A', mudD: '#4E4A44',
  board: '#2F8F5B', boardL: '#56B47F', boardD: '#1D6440', gold: '#E9C46A', chip: '#2B2B30', led: '#7CF0FF',
  red: '#E63B2E', redL: '#FF7A6B', redD: '#A3231A', paper: '#F3EDE0', rule: '#C9C0AE', fog: '#C9CFCB',
  drone: '#4A4F57', droneL: '#7B828C', pod: '#D9D4C7', brass: '#C79A3B', velvet: '#8E2340',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
let UID = 0;
const uid = (s: string) => `${s.replace(/[^a-z0-9]/gi, '')}${(UID++ % 100000).toString(36)}`;

type BeatPose = {skew: number; dip: number; tilt: number; on: boolean};
const NO_POSE: BeatPose = {skew: 0, dip: 0, tilt: 0, on: false};
function beatPose(f: number, seed: number, cues: number[] | undefined, h: number): BeatPose {
  if (!cues || !cues.length) return NO_POSE;
  const p: FigurePose = figureIdle(f, seed, 1, cues);
  const skew = (Math.atan2(p.shift * 2.2 * (h / 300), h) * 180) / Math.PI + p.lean * 0.7;
  return {skew, dip: p.dip * 1.4, tilt: p.headRot * 1.6, on: true};
}

/** the 150-band spectrum as a colour at t 0..1 (violet to deep red, past the visible edge) */
export const specColor = (t: number) => {
  const stops = ['#6A3FD0', '#3D6BE0', '#2BB3C9', '#3FBF6A', '#C9D23A', '#F2A13A', '#E5502E', '#B3122E'];
  const x = clamp01(t) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const k = x - i;
  const a = stops[i], b = stops[i + 1];
  const ch = (s: string, o: number) => parseInt(s.slice(o, o + 2), 16);
  const mix = (o: number) => Math.round(ch(a, o) + (ch(b, o) - ch(a, o)) * k).toString(16).padStart(2, '0');
  return `#${mix(1)}${mix(3)}${mix(5)}`;
};

export type SpecsEmotion = 'squint' | 'smug' | 'buried' | 'doubtful' | 'resolved' | 'proud' | 'alarmed';

/**
 * Specs. Origin (x, y) is the board's centre. At scale 1 the board is 250 wide and 170 tall.
 *  - emotion   face set
 *  - look      -1..1 pupils (LED eyes)
 *  - feetUp    0..1 tips the board back with two little cable feet up on a box (the 5.7 ms gag)
 *  - glow      0..1 the LED eyes brighten
 */
export const Specs: React.FC<{f: number; x: number; y: number; scale?: number; emotion?: SpecsEmotion; look?: number; cues?: number[]; seed?: number;
  feetUp?: number; glow?: number; tilt?: number; squash?: number; shadow?: boolean}> =
({f, x, y, scale = 1, emotion = 'squint', look = 0, cues, seed = 1, feetUp = 0, glow = 0.5, tilt = 0, squash = 0, shadow = false}) => {
  const id = uid(`specs${seed}`);
  const bp = beatPose(f, seed, cues, 170);
  const W = 250, H = 170;
  const t = tones(SCN.board);
  const breathe = 1 + 0.014 * Math.sin(f / 12 + seed);
  const blinkPh = (f + seed * 41) % 96;
  const blink = blinkPh < 4 ? 1 - Math.abs(blinkPh - 2) / 2 : 0;
  const lean = -14 * feetUp;
  const brow = {squint: 5, smug: -3, buried: 9, doubtful: 7, resolved: -1, proud: -5, alarmed: -9}[emotion];
  const eyeH = {squint: 0.45, smug: 0.55, buried: 1, doubtful: 0.8, resolved: 0.85, proud: 0.7, alarmed: 1.25}[emotion] * (1 - blink);
  const mouth = {squint: 'M -26 0 L 26 0', smug: 'M -28 -4 Q 4 14 30 -8', buried: 'M -20 6 Q 0 -6 20 6', doubtful: 'M -24 4 Q -6 -2 8 4 T 26 2',
    resolved: 'M -24 0 Q 0 8 24 0', proud: 'M -28 -2 Q 0 18 28 -2', alarmed: 'M -14 -6 Q 0 -14 14 -6 Q 14 10 0 12 Q -14 10 -14 -6 Z'}[emotion];
  const sq = 1 - 0.14 * squash;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * (1 + 0.07 * squash)} ${scale * sq * breathe}) rotate(${tilt + lean + bp.skew * 0.6}) translate(0 ${-bp.dip})`}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" x2="0.4" y1="0" y2="1">
          <stop offset="0" stopColor={t.key} /><stop offset="0.55" stopColor={t.base} /><stop offset="1" stopColor={t.shade} />
        </linearGradient>
      </defs>
      {shadow && <ContactShadow cx={0} cy={H / 2 + 14} rx={120} ry={12} opacity={0.35} />}
      {feetUp > 0.02 && (
        <g opacity={clamp01(feetUp * 2)}>
          {[-1, 1].map((s) => (
            <path key={s} d={`M ${s * 60} ${H / 2 - 6} q ${s * 20} ${40 - 30 * feetUp} ${s * 50 + 70 * feetUp} ${30 - 70 * feetUp}`} fill="none" stroke={SCN.ink} strokeWidth={9} strokeLinecap="round" />
          ))}
          {[-1, 1].map((s) => (
            <path key={`c${s}`} d={`M ${s * 60} ${H / 2 - 6} q ${s * 20} ${40 - 30 * feetUp} ${s * 50 + 70 * feetUp} ${30 - 70 * feetUp}`} fill="none" stroke="#3A6FD8" strokeWidth={4.5} strokeLinecap="round" />
          ))}
        </g>
      )}
      {/* the board */}
      <rect x={-W / 2 + 6} y={-H / 2 + 8} width={W} height={H} rx={18} fill="#000" opacity={0.22} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={18} fill={`url(#${id}-b)`} stroke={SCN.ink} strokeWidth={7} />
      {/* traces */}
      {Array.from({length: 9}, (_, i) => (
        <path key={i} d={`M ${-W / 2 + 18 + i * 26} ${H / 2 - 12} v ${-18 - (i % 3) * 8} h ${(i % 2 ? 12 : -12)}`} fill="none" stroke={t.core} strokeWidth={3} opacity={0.7} />
      ))}
      {/* mounting holes */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
        <g key={i}><circle cx={sx * (W / 2 - 18)} cy={sy * (H / 2 - 18)} r={9} fill={SCN.gold} stroke={SCN.ink} strokeWidth={3} /><circle cx={sx * (W / 2 - 18)} cy={sy * (H / 2 - 18)} r={4} fill={SCN.ink} /></g>
      ))}
      {/* GPIO header = the brow */}
      <g transform={`translate(0 ${-H / 2 + 22 + brow * 0.6})`}>
        <rect x={-92} y={-9} width={184} height={18} rx={3} fill={SCN.chip} stroke={SCN.ink} strokeWidth={3} />
        {Array.from({length: 20}, (_, i) => <rect key={i} x={-88 + i * 9} y={-5} width={4.5} height={10} fill={SCN.gold} />)}
      </g>
      {/* LED eyes in chip sockets */}
      <g transform={`translate(${look * 6} ${-6}) rotate(${bp.tilt})`}>
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * 52} 0)`}>
            <rect x={-30} y={-26} width={60} height={52} rx={8} fill={SCN.chip} stroke={SCN.ink} strokeWidth={4} />
            <ellipse cx={look * 5} cy={0} rx={17} ry={Math.max(1.5, 17 * eyeH)} fill={SCN.led} opacity={0.55 + 0.45 * glow} />
            <ellipse cx={look * 5} cy={0} rx={28} ry={Math.max(3, 24 * eyeH)} fill={SCN.led} opacity={0.12 + 0.18 * glow} />
            <circle cx={look * 5 - 5} cy={-5 * eyeH} r={4 * eyeH} fill="#fff" opacity={0.9} />
            <path d={`M -26 ${-34 + (s < 0 ? brow : -brow) * 0.5} L 26 ${-34 + (s < 0 ? -brow : brow) * 0.5}`} stroke={SCN.ink} strokeWidth={6} strokeLinecap="round" />
          </g>
        ))}
      </g>
      {/* Ethernet-port mouth */}
      <g transform={`translate(0 ${H / 2 - 40})`}>
        <rect x={-38} y={-16} width={76} height={34} rx={4} fill="#D9D9DE" stroke={SCN.ink} strokeWidth={4} />
        <path d={mouth} fill={emotion === 'alarmed' ? '#5A1410' : 'none'} stroke={SCN.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* white chip labels */}
      <rect x={-W / 2 + 16} y={8} width={30} height={14} rx={2} fill="#F4F1E8" stroke={SCN.ink} strokeWidth={2} />
      <rect x={W / 2 - 46} y={8} width={30} height={14} rx={2} fill="#F4F1E8" stroke={SCN.ink} strokeWidth={2} />
      <RimLight d={`M ${-W / 2 + 14} ${-H / 2 + 4} H ${W / 2 - 14}`} w={4} color="#E6FFEF" opacity={0.6} />
      {emotion === 'buried' || emotion === 'alarmed' ? <path d="M 112 -60 q 7 12 0 19 q -7 -7 0 -19 Z" fill="#BFE8FF" stroke={SCN.ink} strokeWidth={2.5} /> : null}
    </g>
  );
};

/**
 * ScanDrone. A small quadrotor, NO face. Origin (x, y) is the body centre. At scale 1 it spans about 420 across.
 * The camera pod hangs under the body at (0, 58); a Cat6 cable runs to Specs if `cableTo` is given (local coords).
 */
export const ScanDrone: React.FC<{f: number; x: number; y: number; scale?: number; tilt?: number; cableTo?: [number, number]; beam?: number}> =
({f, x, y, scale = 1, tilt = 0, cableTo, beam = 0}) => {
  const bob = 4 * Math.sin(f / 9);
  const d = tones(SCN.drone);
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${scale}) rotate(${tilt + 1.2 * Math.sin(f / 17)})`}>
      {beam > 0 && <path d="M -14 74 L -150 520 L 150 520 L 14 74 Z" fill={SCN.led} opacity={0.1 * beam} />}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M ${s * 40} -6 L ${s * 170} -26`} stroke={SCN.ink} strokeWidth={16} strokeLinecap="round" />
          <path d={`M ${s * 40} -6 L ${s * 170} -26`} stroke={d.base} strokeWidth={9} strokeLinecap="round" />
          <rect x={s * 170 - 14} y={-46} width={28} height={24} rx={5} fill={d.shade} stroke={SCN.ink} strokeWidth={4} />
          {/* blurred rotor disc */}
          <ellipse cx={s * 170} cy={-50} rx={78} ry={10} fill={SCN.droneL} opacity={0.35} stroke={SCN.ink} strokeWidth={2.5} />
          <path d={`M ${s * 170 - 70 * Math.cos(f * 1.7 + s)} -50 L ${s * 170 + 70 * Math.cos(f * 1.7 + s)} -50`} stroke={SCN.ink} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
        </g>
      ))}
      <rect x={-56} y={-30} width={112} height={56} rx={16} fill={d.base} stroke={SCN.ink} strokeWidth={6} />
      <path d="M -48 -20 H 48" stroke={d.key} strokeWidth={5} opacity={0.7} strokeLinecap="round" />
      <circle cx={34} cy={-2} r={5} fill={SCN.red} stroke={SCN.ink} strokeWidth={2} opacity={0.5 + 0.5 * ((f % 30) < 15 ? 1 : 0)} />
      {/* gimbal + push-broom camera pod */}
      <path d="M 0 26 V 44" stroke={SCN.ink} strokeWidth={8} />
      <rect x={-34} y={44} width={68} height={34} rx={6} fill={SCN.pod} stroke={SCN.ink} strokeWidth={5} />
      <rect x={-24} y={70} width={48} height={7} rx={2} fill={SCN.ink} />
      <rect x={-20} y={71} width={40} height={4} fill={specColor((f % 60) / 60)} />
      {cableTo && <path d={`M 30 64 C 90 90 ${cableTo[0] - 40} ${cableTo[1] - 60} ${cableTo[0]} ${cableTo[1]}`} fill="none" stroke={SCN.ink} strokeWidth={8} strokeLinecap="round" />}
      {cableTo && <path d={`M 30 64 C 90 90 ${cableTo[0] - 40} ${cableTo[1] - 60} ${cableTo[0]} ${cableTo[1]}`} fill="none" stroke="#3A6FD8" strokeWidth={4} strokeLinecap="round" />}
    </g>
  );
};

/**
 * Scanline. The push-broom line seen from above, sweeping DOWN the frame. y0..y1 is the swept span, p 0..1 its progress.
 * Behind it, a rainbow wake of thin stripes (the machine's view) fades to `wake` opacity. A small squinting face rides the line.
 */
export const Scanline: React.FC<{f: number; x0: number; x1: number; y0: number; y1: number; p: number; wake?: number; face?: boolean; thick?: number}> =
({f, x0, x1, y0, y1, p, wake = 0.35, face = true, thick = 18}) => {
  const y = y0 + (y1 - y0) * clamp01(p);
  const n = Math.max(1, Math.floor((y - y0) / 10));
  const id = uid('scan');
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-s`} x1="0" x2="1" y1="0" y2="0">
          {Array.from({length: 8}, (_, i) => <stop key={i} offset={i / 7} stopColor={specColor(i / 7)} />)}
        </linearGradient>
      </defs>
      {Array.from({length: n}, (_, i) => (
        <rect key={i} x={x0} y={y0 + i * 10} width={x1 - x0} height={10} fill={specColor(h01(i, 3))} opacity={wake * (0.35 + 0.65 * (i / n)) * (0.55 + 0.45 * h01(i, 7))} />
      ))}
      <rect x={x0 - 6} y={y - thick / 2 - 4} width={x1 - x0 + 12} height={thick + 8} rx={6} fill={SCN.ink} />
      <rect x={x0} y={y - thick / 2} width={x1 - x0} height={thick} rx={4} fill={`url(#${id}-s)`} />
      <rect x={x0} y={y - thick / 2 - 26} width={x1 - x0} height={26} fill={SCN.led} opacity={0.12 + 0.05 * Math.sin(f / 3)} />
      {face && (
        <g transform={`translate(${x1 - 70} ${y})`}>
          <circle r={26} fill={SCN.paper} stroke={SCN.ink} strokeWidth={5} />
          <path d="M -13 -4 h 9 M 4 -4 h 9" stroke={SCN.ink} strokeWidth={5} strokeLinecap="round" />
          <path d="M -9 10 Q 0 14 9 10" stroke={SCN.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

/** SpectrumCard. One pixel fanned into bars, with its profile curve. kind picks the shape of the curve. */
export const SpectrumCard: React.FC<{x: number; y: number; w?: number; h?: number; kind: 'grass' | 'jacket' | 'mud'; label?: string; p?: number; hot?: number}> =
({x, y, w = 300, h = 220, kind, label, p = 1, hot = 0}) => {
  const bars = 30;
  const curve = (t: number) => {
    if (kind === 'grass') return 0.18 + 0.22 * Math.exp(-((t - 0.38) ** 2) / 0.01) + (t > 0.62 ? 0.62 * clamp01((t - 0.62) * 6) : 0);
    if (kind === 'mud') return 0.22 + 0.25 * t;
    return 0.55 + 0.25 * Math.exp(-((t - 0.78) ** 2) / 0.02) - 0.3 * Math.exp(-((t - 0.3) ** 2) / 0.02);
  };
  const bw = (w - 40) / bars;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={14} fill="#000" opacity={0.22} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={SCN.paper} stroke={SCN.ink} strokeWidth={6} />
      {Array.from({length: bars}, (_, i) => {
        const t = i / (bars - 1);
        const v = curve(t) * clamp01(p * bars - i);
        const bh = (h - 70) * v;
        return <rect key={i} x={-w / 2 + 20 + i * bw} y={h / 2 - 22 - bh} width={bw - 2} height={bh} fill={specColor(t)} stroke={SCN.ink} strokeWidth={1.2} />;
      })}
      <path d={Array.from({length: 40}, (_, i) => {
        const t = i / 39;
        return `${i ? 'L' : 'M'} ${-w / 2 + 20 + t * (w - 40)} ${h / 2 - 22 - (h - 70) * curve(t) * clamp01(p * 1.1)}`;
      }).join(' ')} fill="none" stroke={SCN.ink} strokeWidth={4} strokeLinejoin="round" />
      {hot > 0 && <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} rx={18} fill="none" stroke={SCN.red} strokeWidth={6} opacity={hot} />}
      {label && <text x={0} y={-h / 2 + 30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={1.5} fill={SCN.ink}>{label}</text>}
    </g>
  );
};

/**
 * PinFlag. A red GPS pin flag on a stake. Origin (x, y) is where the stake meets the ground. At scale 1 it stands 150 tall.
 *  - spring 0..1  springs out of the ground with an overshoot
 *  - wobble       the settle amplitude in degrees (bigger on the mudflat)
 *  - gps          optional small GPS tag under the pennant
 */
export const PinFlag: React.FC<{f: number; x: number; y: number; scale?: number; spring?: number; wobble?: number; seed?: number; gps?: string; glow?: number; dim?: number}> =
({f, x, y, scale = 1, spring = 1, wobble = 2, seed = 1, gps, glow = 0, dim = 0}) => {
  const s = clamp01(spring);
  const over = s < 1 ? Math.sin(s * Math.PI * 0.5) * (1 + 0.28 * Math.sin(s * Math.PI)) : 1;
  const rot = wobble * Math.sin(f / 5 + seed * 2) * (0.4 + 0.6 * Math.exp(-((f % 120) / 60)));
  const r = tones(SCN.red);
  if (s <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={1 - 0.6 * dim}>
      <ContactShadow cx={0} cy={2} rx={22 * s} ry={6} opacity={0.4} />
      <g transform={`scale(1 ${over}) rotate(${rot})`}>
        {glow > 0 && <circle cx={30} cy={-118} r={60} fill={SCN.redL} opacity={0.22 * glow} />}
        <path d="M 0 0 V -150" stroke={SCN.ink} strokeWidth={9} strokeLinecap="round" />
        <path d="M 0 0 V -150" stroke="#D8C9A8" strokeWidth={4} strokeLinecap="round" />
        <path d={`M 2 -150 L 74 ${-128 + 3 * Math.sin(f / 4 + seed)} L 2 -104 Z`} fill={r.base} stroke={SCN.ink} strokeWidth={5} strokeLinejoin="round" />
        <path d="M 6 -142 L 46 -130" stroke={SCN.redL} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
        <path d="M 6 -110 L 50 -122" stroke={r.shade} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        <circle cx={0} cy={-154} r={7} fill={SCN.gold} stroke={SCN.ink} strokeWidth={3} />
      </g>
      {gps && s > 0.9 && (
        <g transform="translate(0 30)">
          <rect x={-monoW(gps, 16) / 2 - 10} y={-12} width={monoW(gps, 16) + 20} height={26} rx={4} fill={SCN.paper} stroke={SCN.ink} strokeWidth={3} />
          <text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={SCN.ink}>{gps}</text>
        </g>
      )}
    </g>
  );
};

/**
 * SearchGrid. The clipboard search grid, the throughline. Origin (x, y) is the clipboard's centre; w x h the paper.
 *  - stripes 0..1       rainbow scan bands painted down the sheet
 *  - pins [{u,v,p,wob}] pins at paper fractions u, v (p spring)
 *  - fog [{u,v,r,p}]    fog patches over silent ground
 *  - split              draws a centre wall (two scenes)
 *  - title              header string
 */
export const SearchGrid: React.FC<{f: number; x: number; y: number; w?: number; h?: number; rot?: number; stripes?: number;
  pins?: {u: number; v: number; p: number; wob?: number}[]; fog?: {u: number; v: number; r: number; p: number}[]; split?: number; title?: string; seed?: number}> =
({f, x, y, w = 420, h = 520, rot = 0, stripes = 0, pins = [], fog = [], split = 0, title = 'SEARCH GRID', seed = 3}) => {
  const id = uid('grid');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + 0.8 * Math.sin(f / 31 + seed)})`}>
      <ContactShadow cx={0} cy={h / 2 + 30} rx={w * 0.55} ry={14} opacity={0.3} />
      <rect x={-w / 2 - 22} y={-h / 2 - 50} width={w + 44} height={h + 76} rx={18} fill="#8A5A32" stroke={SCN.ink} strokeWidth={7} />
      <rect x={-w / 2 - 14} y={-h / 2 - 42} width={w + 28} height={h + 60} rx={14} fill="#A8743F" opacity={0.6} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={SCN.paper} stroke={SCN.ink} strokeWidth={4} />
      <clipPath id={`${id}-c`}><rect x={-w / 2} y={-h / 2} width={w} height={h} /></clipPath>
      <g clipPath={`url(#${id}-c)`}>
        {Array.from({length: Math.floor(h / 40) + 1}, (_, i) => <path key={`h${i}`} d={`M ${-w / 2} ${-h / 2 + 50 + i * 40} H ${w / 2}`} stroke={SCN.rule} strokeWidth={2} />)}
        {Array.from({length: Math.floor(w / 40) + 1}, (_, i) => <path key={`v${i}`} d={`M ${-w / 2 + i * 40} ${-h / 2 + 50} V ${h / 2}`} stroke={SCN.rule} strokeWidth={2} />)}
        {stripes > 0 && Array.from({length: Math.floor((h - 50) / 14 * stripes)}, (_, i) => (
          <rect key={`s${i}`} x={-w / 2} y={-h / 2 + 50 + i * 14} width={w} height={14} fill={specColor(h01(i, seed))} opacity={0.22} />
        ))}
        {fog.map((g, i) => (
          <g key={`f${i}`} opacity={clamp01(g.p)}>
            <ellipse cx={-w / 2 + g.u * w} cy={-h / 2 + g.v * h} rx={g.r * w} ry={g.r * w * 0.7} fill={SCN.fog} opacity={0.85} />
            <ellipse cx={-w / 2 + g.u * w + 8 * Math.sin(f / 20 + i)} cy={-h / 2 + g.v * h - 6} rx={g.r * w * 0.7} ry={g.r * w * 0.45} fill="#E3E7E4" opacity={0.7} />
          </g>
        ))}
        {split > 0 && <rect x={-5} y={-h / 2 + 50} width={10} height={(h - 50) * clamp01(split)} fill={SCN.ink} />}
      </g>
      <text x={0} y={-h / 2 + 34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={2} fill={SCN.ink}>{title}</text>
      {pins.map((pn, i) => (
        <PinFlag key={i} f={f} x={-w / 2 + pn.u * w} y={-h / 2 + pn.v * h} scale={0.36} spring={pn.p} wobble={pn.wob ?? 2} seed={i + seed} />
      ))}
      {/* the clip */}
      <rect x={-70} y={-h / 2 - 64} width={140} height={40} rx={10} fill="#B9BCC2" stroke={SCN.ink} strokeWidth={6} />
      <rect x={-50} y={-h / 2 - 56} width={100} height={10} rx={4} fill="#E4E6EA" />
    </g>
  );
};

/**
 * ClearedStamp. Origin (x, y) is the stamp FACE centre (the rubber), handle up. flip 0..1 turns it over to show `back`.
 * inked 0..1 shows the impression it would leave (drawn by the scene where it lands).
 */
export const ClearedStamp: React.FC<{x: number; y: number; scale?: number; rot?: number; flip?: number; front?: string; back?: string; f?: number}> =
({x, y, scale = 1, rot = 0, flip = 0, front = 'CLEARED', back = 'NOT CLEARED', f = 0}) => {
  const sx = Math.cos(clamp01(flip) * Math.PI);
  const showBack = sx < 0;
  const label = showBack ? back : front;
  const r = tones(SCN.red);
  const wd = 260;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rot})`}>
      {/* handle */}
      <path d="M -20 -40 L -26 -150 Q 0 -176 26 -150 L 20 -40 Z" fill="#8A5A32" stroke={SCN.ink} strokeWidth={6} />
      <ellipse cx={0} cy={-158} rx={44} ry={26} fill="#A8743F" stroke={SCN.ink} strokeWidth={6} />
      <ellipse cx={-10} cy={-166} rx={18} ry={8} fill="#D9A56A" opacity={0.7} />
      <g transform={`scale(${Math.max(0.04, Math.abs(sx))} 1)`}>
        <rect x={-wd / 2} y={-44} width={wd} height={44} rx={8} fill="#5E4A3A" stroke={SCN.ink} strokeWidth={6} />
        <rect x={-wd / 2 + 6} y={0} width={wd - 12} height={26} rx={4} fill={showBack ? '#3A3A3A' : r.shade} stroke={SCN.ink} strokeWidth={5} />
        <text x={0} y={-14} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={label.length > 9 ? 24 : 30} letterSpacing={2} fill="#FBF6EC">{label}</text>
      </g>
    </g>
  );
};

/** StampMark. The rectangular inked impression a stamp leaves. */
export const StampMark: React.FC<{x: number; y: number; text: string; p?: number; rot?: number; size?: number; color?: string}> =
({x, y, text, p = 1, rot = -6, size = 40, color = SCN.red}) => {
  const w = monoW(text, size) + 40;
  const k = clamp01(p);
  if (k <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${1.25 - 0.25 * k})`} opacity={k}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.6} rx={6} fill="none" stroke={color} strokeWidth={6} />
      <rect x={-w / 2 + 8} y={-size * 0.95 + 8} width={w - 16} height={size * 1.6 - 16} rx={4} fill="none" stroke={color} strokeWidth={2.5} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={size} letterSpacing={3} fill={color}>{text}</text>
    </g>
  );
};

export type BouncerMood = 'stern' | 'shrug' | 'pleased' | 'unsure';

/**
 * Bouncer. The DBSCAN doorman as an OBJECT: a brass rope post with a face and a clipboard, a velvet rope to a second post.
 * Origin (x, y) is the post's foot. At scale 1 the post stands 300 tall. arm -1..1 swings the clipboard arm (1 = wave off).
 */
export const Bouncer: React.FC<{f: number; x: number; y: number; scale?: number; mood?: BouncerMood; arm?: number; rope?: number; cues?: number[]; seed?: number; label?: string}> =
({f, x, y, scale = 1, mood = 'stern', arm = 0, rope = 260, cues, seed = 5, label = 'DBSCAN'}) => {
  const bp = beatPose(f, seed, cues, 300);
  const b = tones(SCN.brass);
  const blinkPh = (f + seed * 23) % 110;
  const blink = blinkPh < 4 ? 1 - Math.abs(blinkPh - 2) / 2 : 0;
  const brow = {stern: 8, shrug: -6, pleased: -3, unsure: 5}[mood];
  const mouth = {stern: 'M -18 0 H 18', shrug: 'M -18 4 Q 0 -6 18 4', pleased: 'M -18 -2 Q 0 12 18 -2', unsure: 'M -16 2 Q -4 -4 6 2 T 18 0'}[mood];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={80} ry={12} opacity={0.38} />
      <ContactShadow cx={rope} cy={4} rx={60} ry={10} opacity={0.32} />
      {/* rope + second post */}
      <path d={`M 26 -210 Q ${rope / 2} ${-140 + 6 * Math.sin(f / 15)} ${rope - 16} -170`} fill="none" stroke={SCN.ink} strokeWidth={20} strokeLinecap="round" />
      <path d={`M 26 -210 Q ${rope / 2} ${-140 + 6 * Math.sin(f / 15)} ${rope - 16} -170`} fill="none" stroke={SCN.velvet} strokeWidth={13} strokeLinecap="round" />
      <path d={`M 26 -214 Q ${rope / 2} ${-146 + 6 * Math.sin(f / 15)} ${rope - 16} -176`} fill="none" stroke="#C4566F" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      <g transform={`translate(${rope} 0)`}>
        <ellipse cx={0} cy={-10} rx={46} ry={14} fill={b.shade} stroke={SCN.ink} strokeWidth={5} />
        <rect x={-12} y={-180} width={24} height={170} fill={b.base} stroke={SCN.ink} strokeWidth={5} />
        <circle cx={0} cy={-188} r={18} fill={b.key} stroke={SCN.ink} strokeWidth={5} />
      </g>
      <g transform={`rotate(${bp.skew * 0.8}) translate(0 ${-bp.dip})`}>
        <ellipse cx={0} cy={-12} rx={64} ry={18} fill={b.shade} stroke={SCN.ink} strokeWidth={6} />
        <rect x={-34} y={-250} width={68} height={238} rx={20} fill={b.base} stroke={SCN.ink} strokeWidth={6} />
        <rect x={-22} y={-240} width={14} height={220} rx={7} fill={b.key} opacity={0.6} />
        <circle cx={0} cy={-262} r={36} fill={b.key} stroke={SCN.ink} strokeWidth={6} />
        {/* face on the post */}
        <g transform={`translate(0 -176) rotate(${bp.tilt})`}>
          {[-1, 1].map((s) => (
            <g key={s}>
              <ellipse cx={s * 14} cy={0} rx={9} ry={11 * (1 - blink)} fill="#FFFDF8" stroke={SCN.ink} strokeWidth={3} />
              <circle cx={s * 14} cy={2} r={4.5 * (1 - blink)} fill={SCN.ink} />
              <path d={`M ${s * 14 - 10} ${-18 + (s < 0 ? brow : -brow) * 0.4} L ${s * 14 + 10} ${-18 + (s < 0 ? -brow : brow) * 0.4}`} stroke={SCN.ink} strokeWidth={4.5} strokeLinecap="round" />
            </g>
          ))}
          <path d={mouth} transform="translate(0 26)" stroke={SCN.ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        </g>
        {/* clipboard arm */}
        <g transform={`translate(-30 -150) rotate(${-30 - 60 * arm})`}>
          <path d="M 0 0 L -70 0" stroke={SCN.ink} strokeWidth={14} strokeLinecap="round" />
          <path d="M 0 0 L -70 0" stroke={b.base} strokeWidth={8} strokeLinecap="round" />
          <g transform="translate(-92 0) rotate(20)">
            <rect x={-30} y={-40} width={60} height={80} rx={6} fill="#8A5A32" stroke={SCN.ink} strokeWidth={4} />
            <rect x={-24} y={-32} width={48} height={66} fill={SCN.paper} />
            {[0, 1, 2, 3].map((i) => <path key={i} d={`M -18 ${-20 + i * 14} H 18`} stroke={SCN.rule} strokeWidth={3} />)}
          </g>
        </g>
        {label && (
          <g transform="translate(0 -60)">
            <rect x={-monoW(label, 18) / 2 - 10} y={-14} width={monoW(label, 18) + 20} height={28} rx={4} fill={SCN.paper} stroke={SCN.ink} strokeWidth={3} />
            <text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={SCN.ink}>{label}</text>
          </g>
        )}
      </g>
    </g>
  );
};

/** Stopwatch. Mute, faced. Origin is the dial centre; r 70 at scale 1. value is the needle in ms of a 25 ms dial; sweat 0..1. */
export const Stopwatch: React.FC<{f: number; x: number; y: number; scale?: number; value?: number; sweat?: number; calm?: number; mark?: number; cues?: number[]; seed?: number}> =
({f, x, y, scale = 1, value = 0, sweat = 0, calm = 0, mark = 10, cues, seed = 9}) => {
  const bp = beatPose(f, seed, cues, 160);
  const a = (v: number) => -90 + (v / 25) * 360;
  const nx = (v: number, r: number) => r * Math.cos((a(v) * Math.PI) / 180);
  const ny = (v: number, r: number) => r * Math.sin((a(v) * Math.PI) / 180);
  const jitter = sweat * 2 * Math.sin(f * 1.3);
  return (
    <g transform={`translate(${x + jitter} ${y - bp.dip}) scale(${scale}) rotate(${bp.skew})`}>
      <rect x={-14} y={-96} width={28} height={20} rx={4} fill="#B9BCC2" stroke={SCN.ink} strokeWidth={5} />
      <circle cx={0} cy={0} r={78} fill="#B9BCC2" stroke={SCN.ink} strokeWidth={7} />
      <circle cx={0} cy={0} r={64} fill={SCN.paper} stroke={SCN.ink} strokeWidth={4} />
      <path d={`M ${nx(mark, 64)} ${ny(mark, 64)} L ${nx(mark, 48)} ${ny(mark, 48)}`} stroke={SCN.red} strokeWidth={7} strokeLinecap="round" />
      {Array.from({length: 25}, (_, i) => <path key={i} d={`M ${nx(i, 62)} ${ny(i, 62)} L ${nx(i, i % 5 ? 56 : 50)} ${ny(i, i % 5 ? 56 : 50)}`} stroke={SCN.ink} strokeWidth={i % 5 ? 2 : 4} />)}
      <path d={`M 0 0 L ${nx(value, 50)} ${ny(value, 50)}`} stroke={SCN.ink} strokeWidth={6} strokeLinecap="round" />
      <circle r={7} fill={SCN.ink} />
      {/* face, low on the dial */}
      <g transform="translate(0 26)">
        {[-1, 1].map((s) => <ellipse key={s} cx={s * 14} cy={-6} rx={6} ry={calm > 0.5 ? 2 : 7} fill={SCN.ink} />)}
        <path d={calm > 0.5 ? 'M -12 8 Q 0 16 12 8' : 'M -10 12 Q 0 4 10 12'} stroke={SCN.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      {sweat > 0.1 && [0, 1].map((i) => (
        <path key={i} d={`M ${70 + i * 14} ${-50 + i * 20 + ((f * 2 + i * 30) % 40)} q 6 10 0 15 q -6 -5 0 -15 Z`} fill="#BFE8FF" stroke={SCN.ink} strokeWidth={2} opacity={sweat} />
      ))}
    </g>
  );
};

export type GearKind = 'waders' | 'buoy' | 'lifejacket' | 'net' | 'bucket' | 'tarp' | 'jacket' | 'boots';

/**
 * Gear. Staged search items, laid FLAT on the ground, NO faces (nothing may read as a person). Origin is the item's centre on
 * the ground. camo 0..1 blends the item toward the ground colour (`ground`). ghost 0..1 draws it as a dashed outline only.
 */
export const Gear: React.FC<{x: number; y: number; kind: GearKind; scale?: number; rot?: number; camo?: number; ground?: string; ghost?: number; glint?: number}> =
({x, y, kind, scale = 1, rot = 0, camo = 0, ground = SCN.sedge, ghost = 0, glint = 0}) => {
  const base = {waders: '#4D5A3A', buoy: '#F07A2E', lifejacket: '#F2A23A', net: '#5C7A86', bucket: '#E3E0D6', tarp: '#4F6B4A', jacket: '#6B6A3E', boots: '#3F3A36'}[kind];
  const mix = (a: string, b: string, k: number) => {
    const ch = (s: string, o: number) => parseInt(s.slice(o, o + 2), 16);
    const m = (o: number) => Math.round(ch(a, o) + (ch(b, o) - ch(a, o)) * k).toString(16).padStart(2, '0');
    return `#${m(1)}${m(3)}${m(5)}`;
  };
  const t = tones(mix(base, ground, clamp01(camo) * 0.82));
  const st = ghost > 0.5 ? {fill: 'none', stroke: SCN.ink, strokeWidth: 4, strokeDasharray: '10 8', opacity: 0.85} : {fill: t.base, stroke: SCN.ink, strokeWidth: 5};
  const shapes: Record<GearKind, React.ReactNode> = {
    waders: <g><path d="M -60 -50 L 60 -50 L 54 0 L 70 46 L 22 52 L 8 8 L -8 8 L -22 52 L -70 46 L -54 0 Z" {...st} /><path d="M -50 -40 H 50" stroke={t.key} strokeWidth={5} opacity={ghost > 0.5 ? 0 : 0.6} /></g>,
    buoy: <g><ellipse cx={0} cy={0} rx={56} ry={34} {...st} /><path d="M -56 0 H 56" stroke={SCN.paper} strokeWidth={10} opacity={ghost > 0.5 ? 0 : 0.9} /><path d="M 40 -24 l 26 -20" stroke={SCN.ink} strokeWidth={5} /></g>,
    lifejacket: <g><path d="M -54 -56 L -14 -56 L -6 -20 L 6 -20 L 14 -56 L 54 -56 L 60 52 L -60 52 Z" {...st} />{ghost <= 0.5 && [-30, 0, 30].map((yy) => <path key={yy} d={`M -56 ${yy} H 56`} stroke="#3A3A3A" strokeWidth={6} />)}</g>,
    net: <g><path d="M -80 -30 Q 0 -60 80 -30 Q 70 40 0 50 Q -70 40 -80 -30 Z" {...st} fillOpacity={0.35} />{ghost <= 0.5 && Array.from({length: 7}, (_, i) => <path key={i} d={`M ${-70 + i * 23} -40 L ${-60 + i * 20} 44`} stroke={t.shade} strokeWidth={3} />)}</g>,
    bucket: <g><path d="M -40 -40 L 40 -40 L 30 40 L -30 40 Z" {...st} /><ellipse cx={0} cy={-40} rx={40} ry={10} fill={ghost > 0.5 ? 'none' : t.shade} stroke={SCN.ink} strokeWidth={4} /></g>,
    tarp: <g><path d="M -90 -50 L 86 -58 L 96 44 L -84 54 Z" {...st} />{ghost <= 0.5 && <path d="M -60 -30 L 70 20" stroke={t.key} strokeWidth={6} opacity={0.5} />}</g>,
    jacket: <g><path d="M -70 -40 L -20 -56 L 0 -44 L 20 -56 L 70 -40 L 84 30 L 50 34 L 44 0 L 40 52 L -40 52 L -44 0 L -50 34 L -84 30 Z" {...st} />{ghost <= 0.5 && <path d="M 0 -44 V 50" stroke={t.shade} strokeWidth={5} />}</g>,
    boots: <g><path d="M -60 -40 L -30 -40 L -28 20 L 10 24 L 10 42 L -64 42 Z" {...st} /><path d="M 20 -36 L 48 -36 L 50 22 L 86 26 L 86 44 L 16 44 Z" {...st} /></g>,
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rot})`}>
      {ghost <= 0.5 && <ContactShadow cx={4} cy={30} rx={70} ry={14} opacity={0.3 * (1 - camo * 0.5)} />}
      {shapes[kind]}
      {glint > 0 && <circle cx={-20} cy={-20} r={10} fill="#fff" opacity={0.6 * glint} />}
    </g>
  );
};

/** Coin. Two faces, spin 0..1 turns it (0 front, 0.5 edge, 1 back). Origin is the centre, r at scale 1 is 170. */
export const Coin: React.FC<{x: number; y: number; scale?: number; spin?: number; front: string[]; back: string[]; rot?: number}> =
({x, y, scale = 1, spin = 0, front, back, rot = 0}) => {
  const c = Math.cos(spin * Math.PI);
  const face = c >= 0 ? front : back;
  const g = tones(c >= 0 ? '#E9C46A' : '#C9CDD3');
  const sx = Math.max(0.06, Math.abs(c));
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      <ellipse cx={8} cy={12} rx={172 * sx} ry={172} fill="#000" opacity={0.22} />
      <ellipse cx={0} cy={0} rx={176 * sx} ry={176} fill={g.shade} stroke={SCN.ink} strokeWidth={7} />
      <ellipse cx={0} cy={0} rx={160 * sx} ry={160} fill={g.base} stroke={SCN.ink} strokeWidth={4} />
      <ellipse cx={-40 * sx} cy={-50} rx={60 * sx} ry={40} fill={g.key} opacity={0.6} />
      <g transform={`scale(${sx} 1)`}>
        {face.map((l, i) => (
          <text key={i} x={0} y={-10 + (i - (face.length - 1) / 2) * 62 + (i === 0 ? 10 : 0)} textAnchor="middle" fontFamily={MONO} fontWeight={900}
            fontSize={i === 0 ? 74 : 26} letterSpacing={i === 0 ? 0 : 2} fill={SCN.ink}>{l}</text>
        ))}
      </g>
    </g>
  );
};

/**
 * TundraWorld. An overcast July tundra seen at a raised three-quarter angle: sky, a far grey Bering Sea strip, a horizon,
 * mid ground (tundra, mudflat or swamp grass), and near tussocks for the master floor (y 1470 to 1920).
 * hz is the horizon y. drift moves the near planes for parallax.
 */
export const TundraWorld: React.FC<{f: number; kind?: 'tundra' | 'mudflat' | 'grass'; hz?: number; drift?: number; sea?: boolean; seed?: number; topDown?: boolean}> =
({f, kind = 'tundra', hz = 520, drift = 0, sea = true, seed = 2, topDown = false}) => {
  const id = uid('tw');
  const ground = kind === 'mudflat' ? SCN.mud : kind === 'grass' ? SCN.khaki : SCN.sedge;
  const groundL = kind === 'mudflat' ? SCN.mudL : kind === 'grass' ? SCN.khakiL : SCN.sedgeL;
  const top = topDown ? -10 : hz;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={SCN.skyD} /><stop offset="0.75" stopColor={SCN.sky} /><stop offset="1" stopColor={SCN.skyL} />
        </linearGradient>
        <linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={groundL} /><stop offset="1" stopColor={ground} />
        </linearGradient>
      </defs>
      {!topDown && <rect x={0} y={0} width={1080} height={hz + 4} fill={`url(#${id}-sky)`} />}
      {!topDown && Array.from({length: 6}, (_, i) => (
        <ellipse key={i} cx={((h01(i, seed) * 1400 + f * (0.2 + 0.1 * i)) % 1500) - 200} cy={80 + i * (hz / 7)} rx={260 + 80 * h01(i, 4)} ry={34 + 10 * h01(i, 5)} fill={i % 2 ? SCN.skyL : '#A9B3B6'} opacity={0.5} />
      ))}
      {!topDown && sea && <rect x={0} y={hz - 26} width={1080} height={26} fill={SCN.sea} />}
      {!topDown && sea && <path d={`M 0 ${hz - 18} H 1080`} stroke={SCN.seaL} strokeWidth={3} opacity={0.7} />}
      <rect x={0} y={top} width={1080} height={1920 - top} fill={`url(#${id}-g)`} />
      {/* texture rows */}
      {Array.from({length: 26}, (_, r) => {
        const y = top + ((r + 0.5) / 26) ** (topDown ? 1 : 1.7) * (1920 - top);
        const s = topDown ? 1 : 0.3 + 0.9 * ((y - top) / (1920 - top));
        return Array.from({length: 7}, (_, c) => {
          const x = ((c + h01(r, c) * 0.9) / 7) * 1180 - 60 + (drift * s * 40) % 160;
          if (kind === 'mudflat') return <path key={`${r}-${c}`} d={`M ${x - 60 * s} ${y} q ${30 * s} ${-8 * s} ${60 * s} 0 t ${60 * s} 0`} fill="none" stroke={c % 2 ? SCN.mudL : SCN.mudD} strokeWidth={3 * s} opacity={0.6} />;
          return <ellipse key={`${r}-${c}`} cx={x} cy={y} rx={34 * s} ry={13 * s} fill={c % 3 ? SCN.shade : groundL} opacity={kind === 'grass' ? 0.45 : 0.35} />;
        });
      })}
      {kind === 'grass' && Array.from({length: 60}, (_, i) => {
        const x = h01(i, 11) * 1080, y = top + 40 + h01(i, 12) ** 0.7 * (1880 - top);
        const s = topDown ? 1 : 0.4 + 0.8 * ((y - top) / (1920 - top));
        const sw = 4 * Math.sin(f / 18 + i);
        return <path key={`b${i}`} d={`M ${x} ${y} q ${sw} ${-30 * s} ${8 * s + sw} ${-56 * s} M ${x + 8 * s} ${y} q ${sw} ${-24 * s} ${-6 * s + sw} ${-44 * s}`} stroke={i % 2 ? SCN.shade : '#C4AE76'} strokeWidth={4 * s} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Tussocks. The near ground band under the caption on the master (default y 1470 to 1920). */
export const Tussocks: React.FC<{f: number; y?: number; drift?: number; seed?: number; tone?: 'sedge' | 'mud'}> = ({f, y = 1480, drift = 0, seed = 4, tone = 'sedge'}) => {
  const base = tone === 'mud' ? SCN.mudD : SCN.shade;
  const lite = tone === 'mud' ? SCN.mud : SCN.sedge;
  return (
    <g>
      <rect x={0} y={y + 40} width={1080} height={1920 - y} fill={base} />
      {Array.from({length: 11}, (_, i) => {
        const cx = ((i * 118 + drift * 60 + h01(i, seed) * 40) % 1300) - 110;
        const cy = y + 70 + 40 * h01(i, seed + 1) + (i % 2) * 90;
        const r = 70 + 40 * h01(i, seed + 2);
        return (
          <g key={i}>
            <ellipse cx={cx} cy={cy + r * 0.5} rx={r * 1.2} ry={r * 0.35} fill="#000" opacity={0.25} />
            <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.62} fill={lite} stroke={SCN.ink} strokeWidth={5} />
            <ellipse cx={cx - r * 0.25} cy={cy - r * 0.22} rx={r * 0.5} ry={r * 0.24} fill={SCN.sedgeL} opacity={0.6} />
            {Array.from({length: 7}, (_, k) => (
              <path key={k} d={`M ${cx - r * 0.6 + k * r * 0.2} ${cy - r * 0.2} q ${6 * Math.sin(f / 14 + k + i)} ${-r * 0.5} ${12 - k * 3} ${-r * 0.8}`} stroke={k % 2 ? SCN.khakiL : SCN.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
            ))}
          </g>
        );
      })}
    </g>
  );
};

/** Crayons. n crayons fanned from a box; the box opens like an accordion as `open` goes 0..1. Origin is the box's base centre. */
export const Crayons: React.FC<{x: number; y: number; n: number; open?: number; scale?: number; spectrum?: boolean; label?: string}> =
({x, y, n, open = 1, scale = 1, spectrum = true, label}) => {
  const k = clamp01(open);
  const span = Math.min(900, n * 8 + 60) * k;
  const shown = Math.max(1, Math.round(n * k));
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={6} rx={Math.max(80, span / 2 + 40)} ry={14} opacity={0.3} />
      {Array.from({length: shown}, (_, i) => {
        const t = shown === 1 ? 0.5 : i / (shown - 1);
        const cx = -span / 2 + t * span;
        const c = spectrum ? specColor(t) : ['#E5502E', '#3FBF6A', '#3D6BE0'][i % 3];
        const w = n > 20 ? 10 : 30;
        return (
          <g key={i} transform={`translate(${cx} -60)`}>
            <path d={`M ${-w / 2} 0 V -120 L 0 -150 L ${w / 2} -120 V 0 Z`} fill={c} stroke={SCN.ink} strokeWidth={n > 20 ? 2 : 4} />
          </g>
        );
      })}
      <rect x={-Math.max(70, span / 2 + 20)} y={-90} width={Math.max(140, span + 40)} height={90} rx={8} fill={SCN.gold} stroke={SCN.ink} strokeWidth={6} />
      {label && <text x={0} y={-36} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={2} fill={SCN.ink}>{label}</text>}
    </g>
  );
};
