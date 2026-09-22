import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {Stage3D, Plane} from './lib/stage3d';
import {ContactShadow, RimLight, MotionBlur, GradeLayer, tones} from './lib/lighting';
import {VoiceProvider, useVoice} from './lib/voice';
import {entrance, followThrough} from './lib/motion';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';

/** THE PALETTE — a cold Mat-Su twilight, chosen to diverge from the last two dispatches.
 *  2026-09-19 was a green-teal powerhouse night (#0E2622 / #E3873A). 2026-09-14 was a cold
 *  sea grey. This film is PLUM: a valley sky going violet after sunset, snow holding the last
 *  blue, and one warm civic interior to set against it.
 *
 *  `scan` is the perception colour and it appears NOWHERE ELSE, which is lib/vision.tsx's own
 *  standing rule: a perception overlay is the only emissive thing in a frame, so the moment a
 *  second object borrows its colour the overlay stops reading as the machine's own light. The
 *  library's default CYAN is deliberately NOT used, both to diverge from 09-19's cyan and
 *  because a magenta that exists nowhere in an Alaska twilight is doing the job harder. */
const C = {
  ink: '#0B0714',
  night: '#241539',
  sky: '#3A1F52',
  ground: '#1A1030',
  snow: '#C9D2E8',
  snowD: '#7E88A8',
  spruce: '#131B2A',
  brass: '#D9A441',
  brassD: '#8A5F1C',
  cream: '#F2EAD8',
  light: '#EDE8F5',
  scan: '#FF3FA4',
  scanD: '#7A1750',
};
const FONT = 'Fraunces, Georgia, serif';
const MONO = 'JetBrains Mono, monospace';
const W = 1080, H = 1920;
type Beat = {id: number; at: number; label: string};

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.18, 0.76, 0.24, 1)});

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

/** Mono advance is exact, so a plate's width is arithmetic and never judgement.
 *  DISPATCH_STANDARD section 4: size the plate to the string, never the reverse. */
const plateW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1) + 56;

const Plate: React.FC<{text: string; x?: number; y: number; size?: number; tone?: 'dark' | 'brass' | 'scan'; p?: number}> =
({text, x = 540, y, size = 30, tone = 'dark', p = 1}) => {
  const w = plateW(text, size), h = size + 30;
  // Authored geometry, checked against the LinkedIn crop BEFORE a frame is encoded.
  // A plate that straddles y=420 or y=1500 ships cut in half; this throws instead.
  assertCropSafe(text, y - h / 2, y + h / 2);
  const fill = tone === 'brass' ? C.brassD : tone === 'scan' ? C.scanD : '#150C24';
  const edge = tone === 'brass' ? C.brass : tone === 'scan' ? C.scan : C.light;
  const k = clamp(p);
  if (k <= 0.01) return null;
  return (
    <g opacity={k} transform={`translate(${x} ${y}) scale(${0.94 + 0.06 * k})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 7} width={w} height={h} rx={7} fill={C.ink} opacity={0.5} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={7} fill={fill} stroke={edge} strokeWidth={3.5} />
      <path d={`M${-w / 2 + 10} ${-h / 2 + 5}h${w - 20}`} stroke={edge} strokeWidth={2} opacity={0.4} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={size} letterSpacing={1.5} fill={edge}>{text}</text>
    </g>
  );
};

const Head: React.FC<{text: string; y: number; size?: number; p?: number}> = ({text, y, size = 58, p = 1}) => {
  // y is the BASELINE. Same crop invariant as Plate.
  assertCropSafe(text, y - size * 0.78, y + size * 0.22);
  // The dark halo under every headline is the 2026-09-19 panel fix, kept: it makes whatever
  // passes behind display type read as BEHIND it rather than as a strikethrough.
  return (
    <g opacity={clamp(p)}>
      <text x={540} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size}
            fill="none" stroke={C.ink} strokeWidth={size * 0.19} strokeLinejoin="round"
            strokeLinecap="round" opacity={0.92}>{text}</text>
      <text x={540} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size}
            fill={C.light}>{text}</text>
    </g>
  );
};

const Defs = () => {
  const sn = tones(C.snow), gr = tones(C.ground), br = tones(C.brass);
  return (
    <defs>
      <linearGradient id="sky22" x1="0" y1="0" x2="0.15" y2="1">
        <stop stopColor={C.sky} /><stop offset="0.5" stopColor={C.night} /><stop offset="1" stopColor={C.ink} />
      </linearGradient>
      <linearGradient id="snow22" x1="0" y1="0" x2="0.4" y2="1">
        <stop stopColor={sn.key} /><stop offset="0.45" stopColor={sn.base} /><stop offset="1" stopColor={sn.shade} />
      </linearGradient>
      <linearGradient id="grd22" x1="0" y1="0" x2="0.3" y2="1">
        <stop stopColor={gr.base} /><stop offset="1" stopColor={C.ink} />
      </linearGradient>
      <linearGradient id="brass22" x1="0" y1="0" x2="0.7" y2="1">
        <stop stopColor={br.key} /><stop offset="0.45" stopColor={br.base} /><stop offset="1" stopColor={br.shade} />
      </linearGradient>
      <radialGradient id="lamp22" cx="0.5" cy="0.5" r="0.5">
        <stop stopColor={C.brass} stopOpacity="0.5" /><stop offset="1" stopColor={C.brass} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="scanglow22" cx="0.5" cy="0.5" r="0.5">
        <stop stopColor={C.scan} stopOpacity="0.45" /><stop offset="1" stopColor={C.scan} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
};

/** The always-running ambient layer. DISPATCH_STANDARD section 8: no scene is built only out
 *  of finished events, so every shot inherits one thing that never stops. Fine valley snow,
 *  drifting rather than falling, on irrational periods so it never pulses. */
const Snowfall: React.FC<{f: number; density?: number}> = ({f, density = 1}) => (
  <g opacity={0.3 * density}>
    {Array.from({length: 34}).map((_, i) => {
      const x = ((i * 163) % 1140) - 30 + 22 * Math.sin(f / (37 + (i % 7) * 3) + i);
      const y = ((f * (2.1 + (i % 5) * 0.7) + i * 191) % 2100) - 90;
      const r = 2 + (i % 3);
      return <circle key={i} cx={x} cy={y} r={r} fill={C.snow} opacity={0.35 + 0.3 * Math.sin(f / 23 + i)} />;
    })}
  </g>
);

const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]}> = ({n, from, dur, beats}) => {
  const local = useCurrentFrame();
  const voice = useVoice();
  const f = local + from;
  const at = (id: number) => (beats.find((b) => b.id === id)?.at ?? 0) * 30;
  const q = (id: number, d = 24, lag = 0) => ease(f, at(id) + lag, d);
  const pop = (id: number) => entrance(f, 30, at(id), {drop: 0, preset: {damping: 13, stiffness: 160, mass: 0.8}}).t;
  const travel = ease(local, 0, Math.max(40, dur));
  const acc = voice.accentAt(f);

  // Every shot is its own `n === k` branch, the LAST one included. A bare trailing `else`
  // reads to the source-level geometry gates as a continuation of the previous shot, and the
  // closing shot's plates then get compared against another shot's headline.
  let picture: React.ReactNode = null;

  if (n === 1) {
    picture = <g />;
  } else if (n === 2) {
    picture = <g />;
  } else if (n === 3) {
    picture = <g />;
  } else if (n === 4) {
    picture = <g />;
  } else if (n === 5) {
    picture = <g />;
  } else if (n === 6) {
    picture = <g />;
  } else if (n === 7) {
    picture = <g />;
  } else if (n === 8) {
    picture = <g />;
  } else if (n === 9) {
    picture = <g />;
  } else if (n === 10) {
    picture = <g />;
  } else if (n === 11) {
    picture = <g />;
  }

  // A composed camera move per shot, never a static frame. Values are z push, yaw, pitch and
  // a vertical offset, each interpolated across the shot's own `travel`.
  const lens = [
    {z: 30 - 28 * travel, rotY: -6 + 4 * travel, rotX: -3, y: 6},
    {z: -70 + 62 * travel, rotX: 11 - 6 * travel, rotY: 4, y: -16 + 14 * travel},
    {z: -160 + 100 * travel, rotX: -6 + 4 * travel, rotY: 8 - 6 * travel, y: 16},
    {z: 12 + 28 * travel, rotX: 5 - 4 * travel, rotY: -6 + 4 * travel, y: 4},
    {z: -55 + 48 * travel, rotY: 7 - 5 * travel, rotX: -4, y: 10},
    {z: 18 + 20 * travel, rotY: -5 + 4 * travel, rotX: 3, y: -6},
    {z: -100 + 76 * travel, rotX: 13 - 6 * travel, rotY: -8 + 6 * travel, y: -12},
    {z: -28 + 32 * travel, rotX: -7 + 5 * travel, rotY: 6 - 5 * travel, y: 12},
    {z: 26 - 22 * travel, rotY: -4 + 3 * travel, rotX: -2, y: 6},
    {z: -140 + 92 * travel, rotY: 10 - 7 * travel, rotX: 5 - 3 * travel, y: 14},
    {z: 14 + 36 * travel, rotY: 5 - 4 * travel, rotX: -3, y: 8},
  ];
  const camera = lens[n - 1];

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Stage3D camera={camera} background={C.ink}>
        <Plane z={650}>
          <SVG><Defs /><path d="M-300 -300H1400V2200H-300Z" fill="url(#sky22)" opacity={0.6} /></SVG>
        </Plane>
        <Plane z={0}><SVG><Defs />{picture}</SVG></Plane>
        <Plane z={-170}>
          <SVG><Snowfall f={f} density={0.8} /></SVG>
        </Plane>
      </Stage3D>
      <SVG>
        <g opacity={0.72}>
          <text x={72} y={505} fontFamily={MONO} fontWeight={700} fontSize={26} letterSpacing={3} fill={C.light}>ALASKA.AI</text>
        </g>
      </SVG>
      <GradeLayer f={f} bloom={0.03} vignette={0.14} grain={0.02} warmth={-0.01} />
    </AbsoluteFill>
  );
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));
export const ep0922Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep0922Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:100 900;font-display:block;}`}</style>
);

const Captions: React.FC<{cues: Props['captions']}> = ({cues}) => {
  const t = useCurrentFrame() / 30;
  const c = cues.find((x) => t >= x.t && t < x.t + x.d);
  if (!c) return null;
  const words = c.text.split(' ');
  const rows: string[] = [];
  let row = '';
  for (const w of words) {
    if ((row + ' ' + w).trim().length > 34 && row) { rows.push(row); row = w; } else row = (row + ' ' + w).trim();
  }
  if (row) rows.push(row);
  const fs = rows.length > 2 ? 32 : 39;
  return (
    <SVG>
      <rect x={68} y={1336} width={944} height={136} rx={16} fill="#0A0616" stroke={C.light} strokeWidth={3} opacity={0.96} />
      {rows.slice(0, 3).map((s, i) => (
        <text key={i} x={540}
          y={rows.length === 1 ? 1420 : rows.length === 2 ? 1390 + i * 49 : 1378 + i * 37}
          textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={fs} fill={C.light}>{s}</text>
      ))}
    </SVG>
  );
};

export const Ep0922: React.FC<Props> = ({captions = [], scenes, beats, credits, mouth = [], accents = []}) => {
  const fallback = [0, 8, 19, 30, 41, 52, 63, 75, 88, 99, 110, 121].map((x) => Math.round(x * 30));
  const slots = scenes ?? fallback.slice(0, -1).map((from, i) => ({from, dur: fallback[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={i + 1} from={s.from} dur={s.dur} beats={bs} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><Captions cues={captions} /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
