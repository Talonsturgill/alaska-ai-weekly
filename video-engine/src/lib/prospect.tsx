import React from 'react';
import {Easing, interpolate} from 'remotion';
import {ContactShadow, FormGradient, INK, RimLight, tones, paleTones} from './lighting';

// THE PROSPECT KIT, 2026-10-22 ("The Hair Above the Ground"). One idea drawn as two objects. A brass plumb bob on a hairline string
// (Plumb) hangs a hair above a map and can't come down. A steel tricone drill bit (DrillBit) sleeps under a moss tarp in the corner of
// the same table, and is the only thing in the film that goes down. Around them: a vellum survey sheet that takes vermilion flight lines,
// a survey helicopter with a towed sensor bird, a globe that a ribbon of those lines winds around, a banded rock block with field lines
// and glow, a brass lamp on an arm, and the small paper kit (hang tags, a paper plane, a release scroll, deposit blobs).
// Everything is SVG in the 1080 x 1920 frame at a caller-set x, y and scale, every animated value is passed in, and the only strings
// painted are the ones the caller hands in (HangTag). No part of this kit paints a result: question marks are hollow, deposits are tagged
// as somebody else's, and the glow is only ever rock that differs.
export const PR = {
  spruce: '#14211B', spruceHi: '#1C2E26', spruceDeep: '#0E1713', night: '#0A110E',
  vellum: '#DCE3D6', vellumHi: '#EEF3EA', vellumShade: '#B9C6B8', contour: '#8FA394',
  brass: '#C79A2B', brassShade: '#8A6A1C', brassKey: '#F0CF72', brassRim: '#FFE9A8',
  peri: '#6E86C9', periDeep: '#3F56A0', periHi: '#A9BAEA',
  lichen: '#C6D84A', lichenDeep: '#7F9420',
  thread: '#D7263D', threadDeep: '#8E1224',
  steel: '#8E99A3', steelShade: '#4A5560', steelHi: '#C9D2DA', steelDeep: '#2E363E',
  tarp: '#5B6B58', tarpShade: '#3A4638', tarpHi: '#7C8E77',
  bone: '#F4EEDC', kraft: '#B58B55', kraftShade: '#7E5C35',
  duskTop: '#6F6A9A', duskMid: '#D4977C', duskLow: '#F0C58E', hills: '#8A76A6', hillsFar: '#B49CC2',
  tundra: '#7A7B4A', tundraHi: '#A89B62', tundraShade: '#4F5232', willow: '#8C8F52',
  ocean: '#2F5AA0', oceanHi: '#5B8AD0', land: '#6C8B4E',
  ink: INK,
};
export const MONO = "'JetBrains Mono', monospace";
export const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
export const eo = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
export const eio = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const hash = (i: number) => {
  let x = (Math.floor(i) + 1022) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
export const rnd = (i: number) => (hash(i) % 10000) / 10000;
/** an overshooting snap from 0 to 1 starting at frame a */
export const snap = (f: number, a: number, d = 10) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.pow(1 - t, 3) * Math.cos(t * 6.2);
};
/** a decaying squash bump that starts at frame a */
export const bump = (f: number, a: number, len = 16) => (f < a ? 0 : Math.max(0, 1 - (f - a) / len) * (0.55 + 0.45 * Math.cos((f - a) / 1.6)));

// ---- Plumb: the hero -----------------------------------------------------------------------------------------------------------------
export type PlumbMood = 'wary' | 'curious' | 'worried' | 'wide' | 'droop' | 'ask' | 'sheepish';
const BOB_H = 236;
/** where the tip of a Plumb hung from (x, y) with string-plus-bob length len is at frame f. Scenes use it to place things under the tip. */
export const plumbAngle = (f: number, amp = 5, ph = 0) => ((amp * (0.72 * Math.sin(f / 37 + ph) + 0.28 * Math.sin(f / 23.7 + ph * 1.7))) * Math.PI) / 180;
export const plumbTip = (x: number, y: number, len: number, f: number, amp = 5, ph = 0, tremble = 0) => {
  const a = plumbAngle(f, amp, ph);
  const tr = tremble * (Math.sin(f * 0.37 + ph) * 1.6 + Math.sin(f * 0.61) * 0.7);
  return {x: x + len * Math.sin(a) + tr, y: y + len * Math.cos(a), a};
};

/**
 * Plumb: a brass plumb bob on a hairline string, a labelled metaphor for "a reader of maps". The string is fixed at (x, y); the tip hangs
 * len px away and swings on a long irrational period. The face sits on the shoulders of the brass. tremble (0..1) is the tip shaking when it
 * is a hair above something, look (-1..1) is where the pupils go, eyes (0..1) how open, mood sets the brows. tag paints a hang tag on the
 * string (the caller's words). He never lights up and never points: the only thing he can do is hang.
 */
export const Plumb: React.FC<{
  x: number; y: number; len?: number; f: number; scale?: number; mood?: PlumbMood; tremble?: number; look?: number; eyes?: number;
  amp?: number; ph?: number; sag?: number; tag?: React.ReactNode; id?: string; shadow?: boolean; shadowY?: number; sq?: number;
}> = ({x, y, len = 700, f, scale = 1, mood = 'wary', tremble = 0, look = 0, eyes = 1, amp = 5, ph = 0, sag = 0, tag, id = 'pl', shadow = true, shadowY, sq = 0}) => {
  const tip = plumbTip(x, y, len, f, amp, ph, tremble);
  const a = tip.a;
  const deg = (-a * 180) / Math.PI;
  const t = tones(PR.brass);
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const blink = Math.sin(f / 47 + ph) > 0.975 ? 0.12 : 1;
  const ey = clamp01(eyes) * blink;
  const brow = mood === 'worried' ? 10 : mood === 'wide' ? -8 : mood === 'ask' ? -4 : mood === 'droop' ? 12 : mood === 'sheepish' ? 8 : mood === 'curious' ? -5 : 2;
  const eyeR = mood === 'wide' ? 1.18 : mood === 'droop' ? 0.82 : 1;
  const bx = tip.x, by = tip.y;
  const topX = bx + BOB_H * scale * Math.sin(a), topY = by - BOB_H * scale * Math.cos(a);
  const px = look * 6, py = mood === 'droop' ? 5 : 0;
  const stringMid = {x: lerp(x, topX, 0.42), y: lerp(y, topY, 0.42)};
  return (
    <g>
      {/* the hairline string, with the faintest sag */}
      <path d={`M${x},${y} Q${(x + topX) / 2 + sag * 14},${(y + topY) / 2} ${topX},${topY}`} fill="none" stroke={PR.bone} strokeWidth={2.4} opacity={0.92} />
      <path d={`M${x + 1.5},${y} Q${(x + topX) / 2 + sag * 14 + 1.5},${(y + topY) / 2} ${topX + 1.5},${topY}`} fill="none" stroke={INK} strokeWidth={1.2} opacity={0.35} />
      {tag && <g transform={`translate(${stringMid.x},${stringMid.y}) rotate(${deg})`}>{tag}</g>}
      {shadow && <ContactShadow cx={bx + 14} cy={shadowY ?? by + 6} rx={46 * scale} ry={9 * scale} opacity={0.34} blur={8} />}
      <g transform={`translate(${bx},${by}) rotate(${deg}) scale(${scale * (1 + 0.05 * sq)},${scale * (1 - 0.06 * sq)})`}>
        <FormGradient id={`${gid}b`} t={t} softness={0.6} />
        <FormGradient id={`${gid}s`} t={tones(PR.steel)} softness={0.5} />
        {/* the conical body down to the point */}
        <path d={`M0,0 C8,-26 38,-62 54,-122 C58,-142 54,-156 48,-164 L-48,-164 C-54,-156 -58,-142 -54,-122 C-38,-62 -8,-26 0,0 Z`}
          fill={`url(#${gid}b)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* turned rings on the body */}
        <path d="M-30,-72 q30,14 60,0 M-44,-100 q44,18 88,0" fill="none" stroke={PR.brassShade} strokeWidth={3.4} opacity={0.6} strokeLinecap="round" />
        {/* the collar */}
        <path d="M-50,-164 L50,-164 L44,-184 L-44,-184 Z" fill={`url(#${gid}b)`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        {[-176, -170].map((yy, i) => <path key={i} d={`M-46,${yy} L46,${yy}`} stroke={PR.brassShade} strokeWidth={2.4} opacity={0.65} />)}
        {/* hex cap and eyelet */}
        <path d="M-34,-184 L-22,-206 L22,-206 L34,-184 Z" fill={`url(#${gid}b)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M-6,-206 L-6,-224 a6,6 0 0 1 12,0 L6,-206 Z" fill={`url(#${gid}b)`} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={0} cy={-226} r={9} fill="none" stroke={INK} strokeWidth={4.4} />
        {/* the key light along the left, a core shade on the right */}
        <path d="M-40,-48 C-28,-82 -34,-110 -44,-140" fill="none" stroke={PR.brassKey} strokeWidth={9} opacity={0.5} strokeLinecap="round" />
        <path d="M36,-56 C44,-90 44,-118 40,-150" fill="none" stroke={PR.brassShade} strokeWidth={8} opacity={0.42} strokeLinecap="round" />
        <RimLight d="M-52,-120 C-44,-84 -26,-52 -6,-14" w={3.4} color={PR.brassRim} opacity={0.65} />
        {/* the face, on the shoulders of the brass */}
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * 24},-122)`}>
            <ellipse cx={0} cy={0} rx={17 * eyeR} ry={Math.max(2, 21 * ey * eyeR)} fill={PR.bone} stroke={INK} strokeWidth={3.8} />
            {ey > 0.25 && <circle cx={px} cy={py} r={7.4 * eyeR} fill={INK} />}
            {ey > 0.25 && <circle cx={px + 2.4} cy={py - 2.6} r={2.4} fill="#FFFFFF" opacity={0.9} />}
            <path d={`M${-18 * s * 0.0 - 17},${-26 - brow * 0.25 * s * -1} q17,${-9 + brow * 0.3} 34,${brow * 0.45 * s}`} fill="none" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
          </g>
        ))}
        {mood === 'sheepish' && <path d="M-12,-92 q12,-5 24,0" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />}
        {mood === 'worried' && <path d="M-10,-90 q10,-6 20,0" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />}
      </g>
    </g>
  );
};

// ---- the paper kit ----------------------------------------------------------------------------------------------------------------------
export type TagTone = 'brass' | 'kraft' | 'bone' | 'ink';
const TAGT: Record<TagTone, {fill: string; fg: string; edge: string}> = {
  brass: {fill: PR.bone, fg: INK, edge: PR.kraftShade},
  kraft: {fill: PR.kraft, fg: INK, edge: PR.kraftShade},
  bone: {fill: PR.bone, fg: INK, edge: '#8A8575'},
  ink: {fill: '#10151F', fg: PR.bone, edge: '#4A5560'},
};
/**
 * tagShift: how far a HangTag's body must slide sideways so its whole width stays inside the frame's safe margin.
 * atX is the knot's x in authored frame space (after every parent translate), camScale the scene's camera scale about x 540,
 * the same projection zoom_clip_check uses. Returns 0 when the tag already fits. When the tag is wider than the safe span it
 * centres on the frame. Machine pass 2026-10-22, after the 10-22 metaphor tag read METAPHO and METAP on shots 3, 5, 9 and 10
 * with its hero at x 850 to 910.
 */
export const tagShift = (atX: number, w: number, camScale = 1, margin = 54, frameW = 1080) => {
  const half = w / 2 + 7;                                 // body half width, plus the drop shadow offset and the stroke
  const lo = 540 + (margin - 540) / camScale + half - atX;          // smallest shift that clears the left margin
  const hi = 540 + (frameW - margin - 540) / camScale - half - atX; // largest shift that clears the right margin
  if (lo > hi) return 540 - atX;
  return Math.max(lo, Math.min(hi, 0));
};

/**
 * HangTag: a tag on a string, sized to its string by arithmetic. Origin is the top of the string (the knot), the tag hangs below it.
 * Pass atX (the knot's authored frame x) and camScale to keep the tag inside the 54 px safe margin. The body slides sideways and
 * the string angles to follow it, so the knot never moves. Without atX the tag draws exactly as before.
 */
export const HangTag: React.FC<{text: string; size?: number; tone?: TagTone; drop?: number; rot?: number; sway?: number; f?: number; k?: number; lines?: string[]; atX?: number; camScale?: number; margin?: number}> =
({text, size = 26, tone = 'brass', drop = 46, rot = 0, sway = 3, f = 0, k = 1, lines, atX, camScale = 1, margin = 54}) => {
  const ls = lines ?? [text];
  const w = Math.max(...ls.map((l) => monoW(l, size, 1.2))) + 40;
  const h = ls.length * (size + 12) + 16;
  const T = TAGT[tone];
  const kk = clamp01(k);
  if (kk <= 0.02) return null;
  const s = 0.8 + 0.2 * Math.min(1, kk * 1.2);
  const dx = atX === undefined ? 0 : tagShift(atX, w, camScale, margin);
  return (
    <g opacity={Math.min(1, kk * 1.8)} transform={`rotate(${rot + sway * Math.sin(f / 19)}) scale(${s})`}>
      <path d={`M0,0 L${dx},${drop}`} stroke={PR.bone} strokeWidth={2.4} />
      <circle cx={0} cy={0} r={3.6} fill={PR.brassShade} stroke={INK} strokeWidth={2} />
      <g transform={`translate(${dx},${drop})`}>
        <rect x={-w / 2 + 5} y={5} width={w} height={h} rx={7} fill="#000" opacity={0.28} />
        <path d={`M${-w / 2},12 L${-14},0 L14,0 L${w / 2},12 L${w / 2},${h} L${-w / 2},${h} Z`} fill={T.fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M${-w / 2 + 6},${h - 6} L${w / 2 - 6},${h - 6}`} stroke={T.edge} strokeWidth={4} />
        <circle cx={0} cy={10} r={4.4} fill="#10151F" stroke={INK} strokeWidth={1.6} />
        {ls.map((l, i) => (
          <text key={i} x={0} y={14 + (size + 12) * (i + 0.5) + size * 0.36 - 1} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.2} fill={T.fg}>{l}</text>
        ))}
      </g>
    </g>
  );
};

/** HollowQ: an outlined question mark with no fill, a target that is only a guess. Origin is the centre of its hook. */
export const HollowQ: React.FC<{x: number; y: number; size?: number; f: number; k?: number; color?: string; bob?: number; rot?: number; sw?: number}> =
({x, y, size = 90, f, k = 1, color = PR.bone, bob = 6, rot = 0, sw = 5}) => {
  const kk = clamp01(k);
  if (kk <= 0.02) return null;
  const s = (size / 90) * (0.7 + 0.3 * Math.min(1, kk * 1.3));
  return (
    <g opacity={Math.min(1, kk * 2)} transform={`translate(${x},${y + bob * Math.sin(f / 13 + x * 0.01)}) rotate(${rot}) scale(${s})`}>
      <path d="M-26,-34 C-26,-78 28,-78 28,-34 C28,-8 0,-8 0,20" fill="none" stroke={INK} strokeWidth={sw + 8} strokeLinecap="round" />
      <path d="M-26,-34 C-26,-78 28,-78 28,-34 C28,-8 0,-8 0,20" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray="1 0" />
      <circle cx={0} cy={50} r={sw + 4} fill={INK} />
      <circle cx={0} cy={50} r={sw + 0.6} fill={color} />
    </g>
  );
};

/** Zzz: three stacked z glyphs drawn as polylines that rise and fade, so a sleeper has a visible breath. */
export const Zzz: React.FC<{x: number; y: number; f: number; k?: number; scale?: number}> = ({x, y, f, k = 1, scale = 1}) => {
  if (k <= 0.02) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={clamp01(k)}>
      {[0, 1, 2].map((i) => {
        const ph = ((f / 60 + i / 3) % 1);
        const s = 0.6 + ph * 0.7;
        return <path key={i} d="M-10,-10 L10,-10 L-10,10 L10,10" fill="none" stroke={PR.bone} strokeWidth={5 / s} strokeLinejoin="round" strokeLinecap="round"
          opacity={Math.sin(ph * Math.PI) * 0.95} transform={`translate(${14 + ph * 26 + i * 6},${-ph * 70 - i * 14}) scale(${s})`} />;
      })}
    </g>
  );
};

// ---- DrillBit: the throughline ------------------------------------------------------------------------------------------------------------
/**
 * DrillBit: a steel tricone bit with a face on its shoulders. Origin is the ground contact under the middle of its base, upright it is about
 * 230 px tall. tilt (0..1) lays it on its side (1 is asleep, flat), tarp (0..1) is how much of the moss tarp covers it (1 covered), cape (0..1)
 * moves the tarp to its shoulders, eyes (0..1) how open, yawn (0..1), shake (0..1) a head shake, spin (0..1) the cones turning, sink (px)
 * how far its base is below ground, twitch (0..1) a shiver under the tarp. Steel is cold grey on purpose: it is the one thing that grades.
 */
export const DrillBit: React.FC<{
  x: number; y: number; f: number; scale?: number; facing?: 1 | -1; tilt?: number; tarp?: number; cape?: number; eyes?: number; yawn?: number;
  shake?: number; spin?: number; sink?: number; twitch?: number; id?: string; shadow?: boolean; dust?: number; brow?: number;
}> = ({x, y, f, scale = 1, facing = 1, tilt = 0, tarp = 0, cape = 0, eyes = 1, yawn = 0, shake = 0, spin = 0, sink = 0, twitch = 0, id = 'db', shadow = true, dust = 0, brow = 0}) => {
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const t = tones(PR.steel);
  const td = tones(PR.steelShade);
  const tt = tones(PR.tarp);
  const breath = 1 + 0.018 * Math.sin(f / 17 + x * 0.01);
  const blink = Math.sin(f / 53 + x * 0.02) > 0.978 ? 0.1 : 1;
  const ey = clamp01(eyes) * blink;
  const sh = shake * Math.sin(f * 0.78) * (6 + 3 * Math.sin(f / 5));
  const tw = twitch * (Math.sin(f * 2.3) * 3.2 + Math.sin(f * 4.1) * 1.4);
  const rot = tilt * 82 + sh + tw * 0.6;
  const covered = clamp01(tarp);
  const spinPh = spin * f * 0.55;
  const clipId = `${gid}c`;
  const lump = covered > 0.02;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <FormGradient id={`${gid}s`} t={t} softness={0.55} />
      <FormGradient id={`${gid}d`} t={td} softness={0.55} />
      <FormGradient id={`${gid}t`} t={tt} softness={0.6} />
      {sink > 0 && <clipPath id={clipId}><rect x={-400} y={-600} width={800} height={600 + 0.0} /></clipPath>}
      {shadow && <ContactShadow cx={0} cy={6} rx={tilt > 0.5 ? 150 : 96} ry={14} opacity={0.38} blur={9} />}
      <g clipPath={sink > 0 ? `url(#${clipId})` : undefined}>
        <g transform={`translate(0,${sink}) rotate(${rot}) scale(${breath},${breath})`} style={{transformOrigin: '0px 0px'}}>
          {/* the cape: the tarp behind its shoulders, drawn first so the face stays clear */}
          {cape > 0.02 && (
            <g opacity={clamp01(cape * 1.4)} transform={`translate(0,-156) scale(${1},${clamp01(cape)})`}>
              <path d={`M-54,0 C-70,${40 + 6 * Math.sin(f / 9)} -96,${96 + 8 * Math.sin(f / 7)} -86,${130} C-40,${142 + 5 * Math.sin(f / 8)} 30,${130} 76,${142} C84,${96 + 8 * Math.sin(f / 6)} 70,${40} 54,0 Z`} fill={`url(#${gid}t)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <path d="M-30,10 C-34,50 -40,86 -44,118 M0,12 C2,56 0,92 4,124 M30,10 C34,50 40,84 44,116" fill="none" stroke={PR.tarpShade} strokeWidth={4} opacity={0.55} strokeLinecap="round" />
              <circle cx={0} cy={4} r={7} fill={PR.brass} stroke={INK} strokeWidth={3} />
            </g>
          )}
          {/* the pin and the shoulder */}
          <path d="M-24,-228 L24,-228 L24,-196 L-24,-196 Z" fill={`url(#${gid}s)`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
          {[-220, -212, -204].map((yy, i) => <path key={i} d={`M-24,${yy} L24,${yy}`} stroke={PR.steelShade} strokeWidth={3} opacity={0.8} />)}
          <path d="M-24,-196 L24,-196 L50,-164 L-50,-164 Z" fill={`url(#${gid}s)`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
          {/* the head: a rounded block the cones hang from */}
          <path d="M-62,-164 L62,-164 C74,-130 72,-92 60,-70 L-60,-70 C-72,-92 -74,-130 -62,-164 Z" fill={`url(#${gid}s)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M-44,-150 C-52,-120 -52,-96 -48,-80" fill="none" stroke={PR.steelHi} strokeWidth={8} opacity={0.5} strokeLinecap="round" />
          <path d="M44,-150 C54,-120 54,-96 50,-80" fill="none" stroke={PR.steelShade} strokeWidth={8} opacity={0.5} strokeLinecap="round" />
          {/* three cones, the middle one in front */}
          {[[-50, -48, -18, 0], [50, -48, 18, 1]].map(([cx, cy, r, side], i) => (
            <g key={i} transform={`translate(${cx},${cy}) rotate(${r})`}>
              <path d="M-26,-28 C-34,-8 -22,26 0,34 C22,26 34,-8 26,-28 Z" fill={`url(#${gid}d)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              {[-12, 2, 16].map((yy, j) => <path key={j} d={`M${-24 + j * 2},${yy} q${24 - j * 2},${6} ${48 - j * 4},0`} fill="none" stroke={PR.steelHi} strokeWidth={3.4} strokeDasharray="4 5" strokeDashoffset={(side ? 1 : -1) * spinPh * 4 + j * 3} opacity={0.9} />)}
            </g>
          ))}
          <g transform="translate(0,-40)">
            <path d="M-34,-26 C-44,-4 -30,30 0,40 C30,30 44,-4 34,-26 Z" fill={`url(#${gid}s)`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
            {[-14, 2, 18].map((yy, j) => <path key={j} d={`M${-32 + j * 3},${yy} q${32 - j * 3},${8} ${64 - j * 6},0`} fill="none" stroke={PR.steelDeep} strokeWidth={3.8} strokeDasharray="5 5" strokeDashoffset={-spinPh * 5 + j * 3} />)}
            {[-22, -6, 10, 26].map((yy, j) => <circle key={j} cx={-26 + ((j * 19 + Math.round(spinPh * 3)) % 52)} cy={yy} r={3.2} fill={PR.steelHi} stroke={INK} strokeWidth={1.4} />)}
          </g>
          {/* the face on the head */}
          {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${s * 26},-132)`}>
              <ellipse cx={0} cy={0} rx={16} ry={Math.max(1.6, 19 * ey)} fill={PR.bone} stroke={INK} strokeWidth={3.8} />
              {ey > 0.25 && <circle cx={s * -1 + (spin > 0.2 ? 0 : 2)} cy={3} r={6.8} fill={INK} />}
              {ey > 0.25 && <circle cx={2} cy={-1} r={2.2} fill="#FFFFFF" opacity={0.9} />}
              <path d={`M-17,${-24 - brow * 0.3 * s} q17,${-8 + brow * 0.2} 34,${brow * 0.4 * s}`} fill="none" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
            </g>
          ))}
          {yawn > 0.05 ? <ellipse cx={0} cy={-96} rx={14 + 6 * yawn} ry={4 + 14 * yawn} fill="#3A1A1A" stroke={INK} strokeWidth={3.4} /> : <path d="M-12,-98 q12,5 24,0" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />}
          <RimLight d="M-62,-150 C-72,-120 -70,-92 -58,-72" w={3.2} color={PR.steelHi} opacity={0.7} />
        </g>
      </g>
      {/* the moss tarp draped over the lump when it sleeps */}
      {lump && (
        <g opacity={clamp01(covered * 3)} transform={`translate(${(1 - covered) * 120},${22 - (1 - covered) * 40}) rotate(${(1 - covered) * 24})`}>
          <path d={`M-250,4 C-262,-40 -210,-86 -150,-96 C-110,-130 -30,-134 20,-104 C84,-124 170,-110 220,-60 C256,-28 266,-8 256,4 C180,14 60,10 -40,14 C-130,14 -214,10 -250,4 Z`}
            fill={`url(#${gid}t)`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" transform={`scale(1,${1 + 0.03 * Math.sin(f / 17 + x * 0.01) + tw * 0.01})`} />
          <path d="M-170,-12 C-150,-50 -100,-76 -60,-82 M-20,-26 C-6,-64 24,-86 52,-92 M84,-20 C100,-52 140,-66 176,-56 M-220,-2 q110,8 230,2" fill="none" stroke={PR.tarpShade} strokeWidth={4.2} opacity={0.55} strokeLinecap="round" />
          <path d="M-150,-76 C-100,-112 -30,-120 30,-96" fill="none" stroke={PR.tarpHi} strokeWidth={6} opacity={0.5} strokeLinecap="round" />
          {/* a gap where one steel eye shows when the tarp lifts a crack */}
          {ey > 0.25 && covered > 0.6 && eyes > 0.02 && <ellipse cx={-70} cy={-52} rx={13} ry={Math.max(1, 12 * ey)} fill={PR.bone} stroke={INK} strokeWidth={3.2} />}
        </g>
      )}
      {dust > 0.02 && [0, 1, 2, 3, 4].map((i) => {
        const ph = ((f / 22 + i * 0.21) % 1);
        return <circle key={i} cx={(i - 2) * 34 + 14 * Math.sin(f / 5 + i)} cy={-6 - ph * 50} r={8 + ph * 16} fill={PR.vellumShade} opacity={dust * (1 - ph) * 0.55} />;
      })}
    </g>
  );
};

// ---- VellumSheet: the survey sheet ------------------------------------------------------------------------------------------------------
/**
 * VellumSheet: a pale survey sheet seen from above, with tape on the corners. Origin is its centre. contours (0..1) draws periwinkle
 * contour rings, rows (0..1) draws vermilion dashed flight lines row on row, patch (0..1) pops the blue patch at (patchX, patchY) in
 * sheet space, glow (0..1) lichen glow blobs where rock differs, curl lifts the corners. It paints no text of its own.
 */
export const VellumSheet: React.FC<{
  x: number; y: number; w?: number; h?: number; rot?: number; f: number; contours?: number; rows?: number; rowCount?: number; patch?: number;
  patchX?: number; patchY?: number; glow?: number; id?: string; shadow?: boolean; tape?: boolean; lift?: number; dim?: number; seed?: number; rowDir?: 'h' | 'v';
}> = ({x, y, w = 760, h = 980, rot = 0, f, contours = 0, rows = 0, rowCount = 18, patch = 0, patchX = 0, patchY = 0, glow = 0, id = 'vs', shadow = true, tape = true, lift = 0, dim = 0, seed = 0, rowDir = 'h'}) => {
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const cl = `${gid}k`;
  const inner = {x: -w / 2 + 14, y: -h / 2 + 14, w: w - 28, h: h - 28};
  return (
    <g transform={`translate(${x},${y - lift * 14}) rotate(${rot})`}>
      {shadow && <rect x={-w / 2 + 12 + lift * 8} y={-h / 2 + 18 + lift * 12} width={w} height={h} rx={5} fill="#000" opacity={0.34 - lift * 0.1} />}
      <defs>
        <linearGradient id={`${gid}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={PR.vellumHi} /><stop offset="0.6" stopColor={PR.vellum} /><stop offset="1" stopColor={PR.vellumShade} />
        </linearGradient>
        <clipPath id={cl}><rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} /></clipPath>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} fill={`url(#${gid}g)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {/* neat border ticks, like a survey sheet */}
      <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill="none" stroke={PR.contour} strokeWidth={2.4} />
      {Array.from({length: 13}).map((_, i) => <path key={i} d={`M${inner.x + (i + 0.5) * (inner.w / 13)},${inner.y} l0,12 M${inner.x + (i + 0.5) * (inner.w / 13)},${inner.y + inner.h} l0,-12`} stroke={PR.contour} strokeWidth={2.2} />)}
      <g clipPath={`url(#${cl})`}>
        {/* contour rings */}
        {contours > 0.01 && (
          <g opacity={clamp01(contours)}>
            {[0, 1, 2].map((c) => {
              const cx = -w * 0.18 + c * w * 0.22 + (seed * 40 + c * 17) % 60 - 30, cy = -h * 0.16 + c * h * 0.2;
              return [1, 0.78, 0.58, 0.4, 0.24].map((r, i) => (
                <ellipse key={`${c}${i}`} cx={cx} cy={cy + 8 * Math.sin(f / 31 + c + i)} rx={w * 0.32 * r * (1 + 0.04 * Math.sin(f / 23 + i))} ry={h * 0.16 * r}
                  transform={`rotate(${-18 + c * 21} ${cx} ${cy})`} fill="none" stroke={i % 2 ? PR.peri : PR.periDeep} strokeWidth={i === 0 ? 3.4 : 2.6} opacity={0.55 + 0.08 * i} />
              ));
            })}
          </g>
        )}
        {/* the blue patch */}
        {patch > 0.01 && (
          <g transform={`translate(${patchX},${patchY}) scale(${clamp01(patch)})`}>
            <ellipse cx={0} cy={0} rx={120} ry={84} fill={PR.peri} stroke={INK} strokeWidth={4.4} opacity={0.96} transform="rotate(-14)" />
            <ellipse cx={-10} cy={-6} rx={78} ry={52} fill={PR.periDeep} opacity={0.75} transform="rotate(-14)" />
            <ellipse cx={-14} cy={-10} rx={34} ry={22} fill={PR.periHi} opacity={0.7} transform="rotate(-14)" />
          </g>
        )}
        {/* glow where rock differs */}
        {glow > 0.01 && [[-170, 140, 90], [110, -120, 110], [160, 210, 70]].map(([gx, gy, gr], i) => (
          <g key={i} opacity={clamp01(glow) * (0.8 + 0.2 * Math.sin(f / 13 + i))}>
            <circle cx={gx * (w / 760)} cy={gy * (h / 980)} r={(gr as number) * 1.5} fill={PR.lichen} opacity={0.2} />
            <circle cx={gx * (w / 760)} cy={gy * (h / 980)} r={gr as number} fill={PR.lichen} opacity={0.5} />
          </g>
        ))}
        {/* the flight lines, vermilion, drawn row by row */}
        {rows > 0.001 && (
          <g>
            {Array.from({length: rowCount}).map((_, i) => {
              const per = 1 / rowCount;
              const p = clamp01((rows - i * per) / per);
              if (p <= 0) return null;
              const pos = inner.y + (i + 0.5) * (inner.h / rowCount);
              const len = inner.w * p;
              const dir = i % 2 ? -1 : 1;
              const x0 = dir === 1 ? inner.x : inner.x + inner.w;
              return rowDir === 'h'
                ? <path key={i} d={`M${x0},${pos} l${dir * len},0`} stroke={PR.thread} strokeWidth={4.2} strokeLinecap="round" strokeDasharray="14 7" opacity={0.95} />
                : <path key={i} d={`M${inner.x + (i + 0.5) * (inner.w / rowCount)},${dir === 1 ? inner.y : inner.y + inner.h} l0,${dir * inner.h * p}`} stroke={PR.thread} strokeWidth={4.2} strokeLinecap="round" strokeDasharray="14 7" opacity={0.95} />;
            })}
          </g>
        )}
      </g>
      {tape && [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
        <g key={i} transform={`translate(${(sx as number) * (w / 2 - 6)},${(sy as number) * (h / 2 - 6)}) rotate(${(sx as number) * (sy as number) * 38})`}>
          <rect x={-34} y={-12} width={68} height={24} fill="#E9E0C8" stroke={INK} strokeWidth={2.4} opacity={0.82} />
        </g>
      ))}
      {dim > 0 && <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={PR.night} opacity={dim} />}
    </g>
  );
};

// ---- SurveyHeli: the helicopter and its towed bird ---------------------------------------------------------------------------------------
/**
 * SurveyHeli: a small survey helicopter seen from the side, nose toward +x (facing -1 mirrors). Origin is the middle of the fuselage. The
 * rotor is a blur disc with two blades that read as spinning, the tail rotor is a flicker, and a cable hangs a sensor bird below the belly
 * (bird is its length in px, swing its angle). It is not bush-plane based: the shelf has no rotorcraft.
 */
export const SurveyHeli: React.FC<{x: number; y: number; f: number; scale?: number; facing?: 1 | -1; bird?: number; swing?: number; tilt?: number; rotor?: number; id?: string; shadow?: boolean}> =
({x, y, f, scale = 1, facing = 1, bird = 150, swing = 0, tilt = 0, rotor = 1, id = 'sh', shadow = false}) => {
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const tb = tones(PR.bone);
  const tp = tones(PR.peri);
  const spin = f * 1.9 * rotor;
  const bw = 150 * Math.sin(spin) * rotor;
  const a = (swing * Math.PI) / 180 + 0.07 * Math.sin(f / 9);
  const bx = bird * Math.sin(a), by = 64 + bird * Math.cos(a);
  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale}) rotate(${tilt})`}>
      <FormGradient id={`${gid}b`} t={tb} softness={0.55} />
      <FormGradient id={`${gid}p`} t={tp} softness={0.55} />
      {shadow && <ContactShadow cx={0} cy={140} rx={110} ry={12} opacity={0.2} blur={9} />}
      {/* the cable and the bird */}
      <path d={`M-4,60 Q${bx * 0.5},${by * 0.5} ${bx},${by - 14}`} fill="none" stroke={PR.bone} strokeWidth={3} opacity={0.9} />
      <g transform={`translate(${bx},${by}) rotate(${-swing * 0.5})`}>
        <path d="M-34,0 C-34,-14 34,-14 40,0 C34,12 -30,12 -34,0 Z" fill={`url(#${gid}p)`} stroke={INK} strokeWidth={4.4} strokeLinejoin="round" />
        <path d="M-34,0 l-16,-14 l8,14 l-8,14 Z" fill={PR.periDeep} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
        <circle cx={28} cy={-1} r={4} fill={PR.lichen} stroke={INK} strokeWidth={2} />
      </g>
      {/* tail boom, fin and tail rotor */}
      <path d="M-30,-22 L-190,-34 L-196,-14 L-30,14 Z" fill={`url(#${gid}b)`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <path d="M-176,-30 L-206,-84 L-186,-86 L-164,-28 Z" fill={`url(#${gid}p)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <g transform="translate(-200,-60)">
        <ellipse cx={0} cy={0} rx={5 + 22 * Math.abs(Math.sin(spin * 1.7)) } ry={26} fill={PR.steelHi} stroke={INK} strokeWidth={2.4} opacity={0.75} />
        <circle cx={0} cy={0} r={4.6} fill={INK} />
      </g>
      {/* the cabin */}
      <path d="M-44,-4 C-46,-52 -8,-78 50,-78 C100,-78 128,-44 124,-8 C122,22 86,40 40,40 L-30,36 C-42,30 -44,16 -44,-4 Z" fill={`url(#${gid}b)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M58,-68 C98,-66 118,-40 116,-14 L40,-14 L40,-68 Z" fill="#26364A" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <path d="M62,-60 C84,-58 98,-44 100,-30" fill="none" stroke={PR.steelHi} strokeWidth={5} opacity={0.6} strokeLinecap="round" />
      <path d="M-40,12 L120,10" stroke={PR.peri} strokeWidth={9} opacity={0.95} />
      <path d="M-40,12 L120,10" stroke={INK} strokeWidth={2} opacity={0.4} />
      <RimLight d="M-30,-40 C-10,-70 30,-76 56,-76" w={3.4} color="#FFFFFF" opacity={0.7} />
      {/* the mast, the rotor head and the rotor */}
      <path d="M10,-78 L10,-96 L22,-96 L22,-78 Z" fill={PR.steelShade} stroke={INK} strokeWidth={4} />
      <g transform="translate(16,-102)">
        <ellipse cx={0} cy={0} rx={190} ry={14} fill={PR.steelHi} opacity={0.18 * rotor} />
        <path d={`M${-bw},0 L${bw},0`} stroke={INK} strokeWidth={9} strokeLinecap="round" opacity={rotor} />
        <path d={`M${-bw},0 L${bw},0`} stroke={PR.steelShade} strokeWidth={5} strokeLinecap="round" opacity={rotor} />
        <circle cx={0} cy={0} r={9} fill={PR.brass} stroke={INK} strokeWidth={3.6} />
      </g>
      {/* skids */}
      <path d="M-70,62 L-70,40 M60,62 L60,38 M-100,66 C-60,76 40,76 100,64" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d="M-100,66 C-60,76 40,76 100,64" fill="none" stroke={PR.steelHi} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

// ---- Globe and the ribbon ----------------------------------------------------------------------------------------------------------------
/**
 * Globe: a blue ball at (x, y) of radius r with a few land blobs that drift, and the vermilion ribbon of flight lines winding around it.
 * wrap is the number of laps drawn so far (1 is once around), laps past 1 spiral up the axis, tail (0..1) is the free end streaming
 * away from the last lap, so the ribbon visibly has slack left over.
 */
export const Globe: React.FC<{x: number; y: number; r?: number; f: number; wrap?: number; tail?: number; id?: string; tiltDeg?: number; sw?: number; geo?: boolean; children?: React.ReactNode}> =
({x, y, r = 250, f, wrap = 0, tail = 0, id = 'gl', tiltDeg = -16, sw = 16, geo = false, children}) => {
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const spinX = (f * 0.35) % 700;
  const pts = (t0: number, t1: number) => {
    const out: {x: number; y: number; front: boolean}[] = [];
    const n = Math.max(2, Math.round((t1 - t0) * 120));
    for (let i = 0; i <= n; i++) {
      const t = t0 + ((t1 - t0) * i) / n;
      const phi = Math.PI * 2 * t - Math.PI * 0.5;
      const rr = r + 10 + 5 * t;
      out.push({x: rr * Math.cos(phi), y: rr * 0.3 * Math.sin(phi) - (t * 34 - 12), front: Math.sin(phi) > 0});
    }
    return out;
  };
  const tw = Math.max(0, Math.min(wrap, 3));
  const all = pts(0, tw);
  const seg = (front: boolean) => {
    let d = '';
    let pen = false;
    all.forEach((p, i) => {
      if (p.front === front) { d += `${pen ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)} `; pen = true; } else pen = false;
      if (i === 0 && p.front !== front) pen = false;
    });
    return d;
  };
  const last = all[all.length - 1] ?? {x: 0, y: 0};
  const tl = clamp01(tail);
  const tailD = `M${last.x},${last.y} C${last.x - 120 * tl},${last.y + 140 * tl} ${last.x - 300 * tl},${last.y + 120 * tl + 20 * Math.sin(f / 9)} ${last.x - 380 * tl},${last.y + 260 * tl}`;
  return (
    <g transform={`translate(${x},${y}) rotate(${tiltDeg})`}>
      <path d={seg(false)} fill="none" stroke={INK} strokeWidth={sw + 6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={seg(false)} fill="none" stroke={PR.threadDeep} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <radialGradient id={`${gid}g`} cx="0.35" cy="0.3" r="0.85"><stop offset="0" stopColor={PR.oceanHi} /><stop offset="0.55" stopColor={PR.ocean} /><stop offset="1" stopColor="#14295A" /></radialGradient>
        <clipPath id={`${gid}c`}><circle cx={0} cy={0} r={r} /></clipPath>
        <radialGradient id={`${gid}t`} cx="0.3" cy="0.28" r="0.95"><stop offset="0.55" stopColor="#06102E" stopOpacity="0" /><stop offset="0.9" stopColor="#06102E" stopOpacity="0.55" /><stop offset="1" stopColor="#06102E" stopOpacity="0.8" /></radialGradient>
      </defs>
      <circle cx={0} cy={0} r={r} fill={`url(#${gid}g)`} stroke={INK} strokeWidth={7} />
      <g clipPath={`url(#${gid}c)`}>
        {!geo && [0, 1].map((k) => (
          <g key={k} transform={`translate(${-spinX + k * 700},0)`}>
            <path d="M-150,-120 C-110,-170 -40,-150 -20,-100 C0,-60 -60,-40 -80,0 C-110,40 -170,10 -170,-50 Z" fill={PR.land} stroke={INK} strokeWidth={3.6} opacity={0.95} />
            <path d="M120,-30 C170,-60 240,-20 230,40 C220,100 150,130 110,90 C80,60 90,0 120,-30 Z" fill="#7C9A58" stroke={INK} strokeWidth={3.6} opacity={0.95} />
            <path d="M-40,110 C0,90 60,110 50,160 C30,190 -30,180 -40,110 Z" fill={PR.land} stroke={INK} strokeWidth={3.6} opacity={0.95} />
            <path d="M260,-150 C300,-170 340,-140 320,-100 C290,-90 260,-110 260,-150 Z" fill="#7C9A58" stroke={INK} strokeWidth={3.6} opacity={0.95} />
          </g>
        ))}
        {geo && (
          <g transform={`scale(${r / 250})`}>
            {/* the Americas: a broad north, a narrow waist, a long south with a west coast bulge */}
            <path d="M-170,-150 C-190,-190 -120,-220 -60,-205 C0,-195 40,-160 30,-120 C20,-80 -20,-60 -40,-30 C-60,-10 -90,-20 -120,-50 C-150,-80 -160,-110 -170,-150 Z" fill={PR.land} stroke={INK} strokeWidth={4} />
            <path d="M-40,-30 C-20,-10 -4,10 -20,30 C-60,40 -100,70 -90,110 C-80,160 -40,200 -10,190 C20,170 20,120 10,80 C0,40 -10,10 -40,-30 Z" fill="#7C9A58" stroke={INK} strokeWidth={4} />
            {[-150, -110, -70, -30, 10, 50, 90, 130, 170].map((gy, i) => <path key={i} d={`M-250,${gy} q250,${i % 2 ? 14 : -14} 500,0`} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.18} />)}
            {[-180, -110, -40, 30, 100, 170].map((gx, i) => <path key={`m${i}`} d={`M${gx},-240 q${gx * 0.2},240 0,480`} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.14} />)}
          </g>
        )}
        <ellipse cx={-r * 0.3} cy={-r * 0.45} rx={r * 0.5} ry={r * 0.22} fill="#FFFFFF" opacity={0.12} transform="rotate(-24)" />
        <circle cx={0} cy={0} r={r} fill={`url(#${gid}t)`} />
      </g>
      <circle cx={0} cy={0} r={r + 8} fill="none" stroke="#9DB8FF" strokeWidth={10} opacity={0.22} />
      <RimLight d={`M${-r * 0.82},${-r * 0.5} A${r},${r} 0 0 1 ${-r * 0.1},${-r * 0.98}`} w={4} color="#BFD4FF" opacity={0.6} />
      <path d={seg(true)} fill="none" stroke={INK} strokeWidth={sw + 6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={seg(true)} fill="none" stroke={PR.thread} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="22 8" strokeDashoffset={-f * 0.8} />
      {children}
      {tl > 0.02 && <><path d={tailD} fill="none" stroke={INK} strokeWidth={sw + 6} strokeLinecap="round" /><path d={tailD} fill="none" stroke={PR.thread} strokeWidth={sw} strokeLinecap="round" strokeDasharray="22 8" strokeDashoffset={-f * 0.8} /></>}
    </g>
  );
};

// ---- RockBlock: the cutaway ----------------------------------------------------------------------------------------------------------
const STRATA = ['#5B6470', '#7B6A52', '#4A5A4A', '#8A7A62', '#5F5470', '#6B6B58'];
/**
 * RockBlock: a block of ground cut open, origin at the middle of the bottom edge of the front face. top paints the map surface as vellum,
 * field (0..1) bends periwinkle field lines through it, glow (0..1) lights lichen patches in the strata where they differ, bend moves the
 * lines. It never marks a find: glow is rock that differs, and the caller says so in a plate.
 */
export const RockBlock: React.FC<{x: number; y: number; w?: number; h?: number; f: number; field?: number; glow?: number; bend?: number; lift?: number; top?: boolean; id?: string; depth?: number}> =
({x, y, w = 640, h = 380, f, field = 0, glow = 0, bend = 0, lift = 0, top = true, id = 'rb', depth = 120}) => {
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const bands = STRATA.length;
  return (
    <g transform={`translate(${x},${y - lift * 30})`}>
      <ContactShadow cx={0} cy={10} rx={w * 0.58} ry={18} opacity={0.34} blur={12} />
      <defs><clipPath id={`${gid}f`}><rect x={-w / 2} y={-h} width={w} height={h} /></clipPath></defs>
      {/* the right side face, darker */}
      <path d={`M${w / 2},0 L${w / 2 + depth * 0.8},${-depth * 0.5} L${w / 2 + depth * 0.8},${-h - depth * 0.5} L${w / 2},${-h} Z`} fill="#2F3640" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      {STRATA.map((c, i) => <path key={i} d={`M${w / 2},${-(i * h) / bands} L${w / 2 + depth * 0.8},${-(i * h) / bands - depth * 0.5} L${w / 2 + depth * 0.8},${-((i + 1) * h) / bands - depth * 0.5} L${w / 2},${-((i + 1) * h) / bands} Z`} fill={c} opacity={0.55} stroke={INK} strokeWidth={1.6} />)}
      {/* the front face, banded strata with a gentle fold */}
      <g clipPath={`url(#${gid}f)`}>
        {STRATA.map((c, i) => {
          const y0 = -(i * h) / bands, y1 = -((i + 1) * h) / bands;
          const fold = 18 * Math.sin(i * 1.3 + 0.4) + 6 * Math.sin(f / 40 + i);
          return <path key={i} d={`M${-w / 2},${y0} L${w / 2},${y0 + fold} L${w / 2},${y1 + fold} L${-w / 2},${y1} Z`} fill={c} stroke={INK} strokeWidth={2.4} />;
        })}
        {glow > 0.01 && [[-0.28, -0.3, 80], [0.18, -0.62, 100], [0.3, -0.18, 60]].map(([gx, gy, gr], i) => (
          <g key={i} opacity={clamp01(glow) * (0.75 + 0.25 * Math.sin(f / 12 + i * 2))}>
            <circle cx={(gx as number) * w} cy={(gy as number) * h} r={(gr as number) * 1.6} fill={PR.lichen} opacity={0.18} />
            <circle cx={(gx as number) * w} cy={(gy as number) * h} r={gr as number} fill={PR.lichen} opacity={0.5} />
          </g>
        ))}
        {/* small rock texture */}
        {Array.from({length: 34}).map((_, i) => <circle key={i} cx={-w / 2 + rnd(i + 9) * w} cy={-rnd(i + 99) * h} r={2 + rnd(i + 5) * 3.4} fill="#000" opacity={0.2} />)}
      </g>
      <rect x={-w / 2} y={-h} width={w} height={h} fill="none" stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
      {/* the top: the map surface */}
      {top && <path d={`M${-w / 2},${-h} L${w / 2},${-h} L${w / 2 + depth * 0.8},${-h - depth * 0.5} L${-w / 2 + depth * 0.8},${-h - depth * 0.5} Z`} fill={PR.vellum} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />}
      {top && [0.25, 0.5, 0.75].map((k, i) => <path key={i} d={`M${-w / 2 + depth * 0.8 * k},${-h - depth * 0.5 * k} L${w / 2 + depth * 0.8 * k},${-h - depth * 0.5 * k}`} stroke={PR.contour} strokeWidth={2.4} />)}
      {/* field lines, bending where the rock differs */}
      {field > 0.01 && (
        <g opacity={clamp01(field)} fill="none" stroke={PR.periHi} strokeWidth={4.6} strokeLinecap="round">
          {[-0.34, -0.14, 0.06, 0.26, 0.42].map((fx, i) => {
            const cx = fx * w;
            const bow = 46 * Math.sin(f / 18 + i) * 0.4 + bend * (i === 2 || i === 3 ? 70 : 20);
            return <path key={i} d={`M${cx},${-h - 130} C${cx + bow},${-h - 70} ${cx - bow},${-h * 0.62} ${cx + bow * 0.4},${-h * 0.1}`} strokeDasharray="12 10" strokeDashoffset={-f * 0.9} opacity={0.9} />;
          })}
        </g>
      )}
    </g>
  );
};

// ---- the table and the lamp ----------------------------------------------------------------------------------------------------------
/** TableBG: the dark spruce survey table seen from above with one pool of lamp light, plus a near plane of a ruler, a pencil and a tape roll at the bottom. */
export const TableBG: React.FC<{f: number; lampX?: number; lampY?: number; pool?: number; near?: boolean; id?: string; seed?: number; dim?: number}> =
({f, lampX = 380, lampY = 900, pool = 1, near = true, id = 'tb', seed = 0, dim = 0}) => {
  const gid = `${id}${seed}`;
  const flick = 1 + 0.015 * Math.sin(f / 11) + 0.01 * Math.sin(f / 5.3);
  return (
    <g>
      <defs>
        <radialGradient id={`${gid}p`} cx={lampX / 1080} cy={lampY / 1920} r="0.62">
          <stop offset="0" stopColor="#F2DDA0" stopOpacity={0.5 * pool * flick} />
          <stop offset="0.45" stopColor="#C79A2B" stopOpacity={0.18 * pool} />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${gid}t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={PR.spruceDeep} /><stop offset="0.5" stopColor={PR.spruce} /><stop offset="1" stopColor={PR.spruceHi} /></linearGradient>
      </defs>
      <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={`url(#${gid}t)`} />
      {/* wood grain on the table top */}
      {Array.from({length: 26}).map((_, i) => <path key={i} data-band="ok" d={`M-40,${i * 80 + rnd(i + seed) * 40} C300,${i * 80 - 14 + rnd(i + 3) * 30} 700,${i * 80 + 20} 1120,${i * 80 + rnd(i + 7) * 30}`} fill="none" stroke="#000" strokeWidth={2.4 + rnd(i) * 2} opacity={0.18} />)}
      <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={`url(#${gid}p)`} />
      {dim > 0 && <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={PR.night} opacity={dim} />}
      {near && (
        <g>
          <g transform={`translate(${-40 + 30 * Math.sin(f / 90)},1566)`}>
            <rect x={0} y={0} width={640} height={60} rx={6} fill="#C9B88A" stroke={INK} strokeWidth={5} />
            {Array.from({length: 33}).map((_, i) => <path key={i} d={`M${16 + i * 19},0 l0,${i % 5 === 0 ? 24 : 14}`} stroke={INK} strokeWidth={2.6} />)}
          </g>
          <g transform={`translate(820,${1640 + 10 * Math.sin(f / 70)}) rotate(-7)`}>
            <rect x={0} y={0} width={360} height={26} rx={13} fill="#D4A53A" stroke={INK} strokeWidth={5} />
            <path d="M-10,13 l14,-9 l0,18 Z" fill="#E7C9A0" stroke={INK} strokeWidth={3.6} />
            <rect x={290} y={0} width={38} height={26} fill="#B9B7B0" stroke={INK} strokeWidth={4} />
          </g>
          <g transform="translate(120,1760)">
            <circle cx={0} cy={0} r={74} fill="#C9C2AF" stroke={INK} strokeWidth={6} />
            <circle cx={0} cy={0} r={38} fill={PR.spruce} stroke={INK} strokeWidth={5} />
            <circle cx={-18} cy={-26} r={20} fill="#FFFFFF" opacity={0.14} />
          </g>
        </g>
      )}
    </g>
  );
};

/** LampArm: the brass desk lamp on its arm, hung from the top. Origin is the wall mount, the head sits near (headX, headY) and its cone lights the table. */
export const LampArm: React.FC<{x: number; y: number; f: number; scale?: number; swing?: number; cone?: number; id?: string}> = ({x, y, f, scale = 1, swing = 1, cone = 1, id = 'la'}) => {
  const gid = `${id}${Math.round(x)}`;
  const sw = swing * Math.sin(f / 61) * 1.6;
  const t = tones(PR.brass);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <FormGradient id={`${gid}b`} t={t} softness={0.55} />
      <defs><linearGradient id={`${gid}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6E3A2" stopOpacity="0.42" /><stop offset="1" stopColor="#F6E3A2" stopOpacity="0" /></linearGradient></defs>
      <g transform={`rotate(${sw} 0 0)`}>
        <path d="M0,0 L120,40 L170,6" fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0,0 L120,40 L170,6" fill="none" stroke={PR.brass} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={0} cy={0} r={18} fill={`url(#${gid}b)`} stroke={INK} strokeWidth={5} />
        <circle cx={120} cy={40} r={13} fill={`url(#${gid}b)`} stroke={INK} strokeWidth={4.5} />
        <g transform="translate(170,6) rotate(24)">
          <path d="M-18,0 L18,0 L66,94 L-66,94 Z" fill={`url(#${gid}b)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <ellipse cx={0} cy={94} rx={66} ry={12} fill="#FFF3C4" stroke={INK} strokeWidth={5} />
          {cone > 0.02 && <path d="M-60,100 L60,100 L360,1000 L-300,1000 Z" fill={`url(#${gid}c)`} opacity={cone} />}
        </g>
      </g>
    </g>
  );
};

// ---- the dusk tundra ---------------------------------------------------------------------------------------------------------------------
/** DuskTundraBG: a cold late-afternoon tundra for the survey flight. Periwinkle hills drift against an olive band, a pale straw horizon, willow tufts in the near plane. */
export const DuskTundraBG: React.FC<{f: number; horizon?: number; id?: string; near?: boolean}> = ({f, horizon = 820, id = 'dt', near = true}) => {
  const gid = `${id}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${gid}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={PR.duskTop} /><stop offset="0.6" stopColor={PR.duskMid} /><stop offset="1" stopColor={PR.duskLow} /></linearGradient>
        <linearGradient id={`${gid}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={PR.tundraHi} /><stop offset="0.35" stopColor={PR.tundra} /><stop offset="1" stopColor={PR.tundraShade} /></linearGradient>
      </defs>
      <rect data-band="ok" x={-40} y={0} width={1160} height={horizon + 60} fill={`url(#${gid}s)`} />
      {/* thin cloud bands */}
      {[0, 1, 2].map((i) => <ellipse key={i} data-band="ok" cx={(220 + i * 360 + f * (0.2 + i * 0.08)) % 1500 - 200} cy={horizon - 420 + i * 90} rx={260 - i * 30} ry={20} fill="#F0DCC0" opacity={0.28} />)}
      {/* hills: far, near */}
      <path data-band="ok" d={`M-40,${horizon} L-40,${horizon - 150} C100,${horizon - 230} 240,${horizon - 190} 360,${horizon - 150} C500,${horizon - 100} 640,${horizon - 260} 800,${horizon - 190} C920,${horizon - 140} 1040,${horizon - 200} 1120,${horizon - 170} L1120,${horizon} Z`} fill={PR.hillsFar} transform={`translate(${-6 * Math.sin(f / 120)},0)`} />
      <path data-band="ok" d={`M-40,${horizon + 10} L-40,${horizon - 70} C140,${horizon - 150} 300,${horizon - 80} 480,${horizon - 110} C640,${horizon - 130} 820,${horizon - 60} 1120,${horizon - 100} L1120,${horizon + 10} Z`} fill={PR.hills} transform={`translate(${-14 * Math.sin(f / 90 + 1)},0)`} />
      <rect data-band="ok" x={-40} y={horizon} width={1160} height={1960 - horizon} fill={`url(#${gid}g)`} />
      {/* tussocks and ponds in perspective */}
      {Array.from({length: 40}).map((_, i) => {
        const dy = rnd(i + 3);
        const yy = horizon + 20 + dy * dy * 700;
        const s = 0.4 + dy * 1.8;
        return <ellipse key={i} data-band="ok" cx={rnd(i) * 1200 - 60 + 8 * Math.sin(f / 70 + i)} cy={yy} rx={26 * s} ry={9 * s} fill={i % 3 ? PR.willow : PR.tundraShade} stroke={INK} strokeWidth={2.4} opacity={0.9} />;
      })}
      {[0, 1].map((i) => <ellipse key={i} data-band="ok" cx={260 + i * 520} cy={horizon + 110 + i * 70} rx={120 + i * 40} ry={18} fill={PR.duskMid} stroke={INK} strokeWidth={3.4} opacity={0.85} />)}
      {near && Array.from({length: 7}).map((_, i) => {
        const gx = i * 190 - 20 + rnd(i + 70) * 60;
        return <path key={i} d={`M${gx},1930 q${-14 + 8 * Math.sin(f / 21 + i)},-120 ${-30},-210 M${gx},1930 q${10 + 8 * Math.sin(f / 23 + i)},-140 ${26},-250 M${gx},1930 q${-2},-100 ${-4},-170`} fill="none" stroke={PR.tundraShade} strokeWidth={9} strokeLinecap="round" />;
      })}
    </g>
  );
};

// ---- the small paper kit ----------------------------------------------------------------------------------------------------------------
/** PaperPlane: a folded paper plane, origin at its centre, nose toward +x. */
export const PaperPlane: React.FC<{x: number; y: number; rot?: number; scale?: number; f?: number; shadowDy?: number}> = ({x, y, rot = 0, scale = 1, f = 0, shadowDy = 60}) => (
  <g transform={`translate(${x},${y}) rotate(${rot + 2 * Math.sin(f / 10)}) scale(${scale})`}>
    <ellipse cx={-6} cy={shadowDy} rx={70} ry={10} fill="#000" opacity={0.22} />
    <path d="M-80,-18 L90,0 L-80,22 L-50,2 Z" fill={PR.vellumHi} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-50,2 L90,0 L-20,40 Z" fill={PR.vellumShade} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-80,-18 L-50,2 L-20,40" fill="none" stroke={INK} strokeWidth={3.2} opacity={0.55} />
  </g>
);

/** PinOutline: a dashed outline of a map pin, an unnamed place. The dashes crawl. */
export const PinOutline: React.FC<{x: number; y: number; scale?: number; f: number; k?: number; color?: string; sw?: number}> = ({x, y, scale = 1, f, k = 1, color = PR.bone, sw = 6}) => {
  const kk = clamp01(k);
  if (kk < 0.02) return null;
  const s = scale * (0.6 + 0.4 * Math.min(1, kk * 1.3));
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={Math.min(1, kk * 2)}>
      <path d="M0,0 C-44,-60 -66,-90 -66,-128 C-66,-166 -36,-194 0,-194 C36,-194 66,-166 66,-128 C66,-90 44,-60 0,0 Z" fill="none" stroke={INK} strokeWidth={sw + 7} strokeLinejoin="round" />
      <path d="M0,0 C-44,-60 -66,-90 -66,-128 C-66,-166 -36,-194 0,-194 C36,-194 66,-166 66,-128 C66,-90 44,-60 0,0 Z" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeDasharray="16 12" strokeDashoffset={-f * 0.7} />
      <circle cx={0} cy={-128} r={22} fill="none" stroke={color} strokeWidth={sw - 1.5} strokeDasharray="8 8" strokeDashoffset={f * 0.6} />
    </g>
  );
};

/** DownloadArrow: a fat periwinkle arrow landing on a tray, origin is the tip of the arrow. */
export const DownloadArrow: React.FC<{x: number; y: number; scale?: number; f: number; k?: number; id?: string}> = ({x, y, scale = 1, f, k = 1, id = 'da'}) => {
  const kk = clamp01(k);
  if (kk < 0.02) return null;
  const drop = (1 - kk) * -160;
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  return (
    <g transform={`translate(${x},${y + drop}) scale(${scale})`} opacity={Math.min(1, kk * 3)}>
      <FormGradient id={gid} t={tones(PR.peri)} softness={0.6} />
      <path d="M-26,-120 L26,-120 L26,-60 L58,-60 L0,0 L-58,-60 L-26,-60 Z" fill={`url(#${gid})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <path d="M-76,14 L76,14" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d="M-76,14 L76,14" stroke={PR.bone} strokeWidth={7} strokeLinecap="round" />
      <path d="M-18,-110 L-18,-62" stroke="#FFFFFF" strokeWidth={5} opacity={0.4} strokeLinecap="round" />
    </g>
  );
};

/** DepositBlob: a solid ore-brown blob on a map, with a kraft hang tag the caller fills. */
export const DepositBlob: React.FC<{x: number; y: number; scale?: number; f: number; seed?: number; id?: string; k?: number}> = ({x, y, scale = 1, f, seed = 0, id = 'dp', k = 1}) => {
  const kk = clamp01(k);
  if (kk < 0.02) return null;
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const j = (i: number) => 1 + 0.06 * Math.sin(f / 21 + i + seed);
  return (
    <g transform={`translate(${x},${y}) scale(${scale * (0.7 + 0.3 * Math.min(1, kk * 1.3))})`} opacity={Math.min(1, kk * 2)}>
      <FormGradient id={gid} t={tones('#9A6B3C')} softness={0.6} />
      <path d={`M-70,10 C-82,-32 -40,-64 ${4 * j(1)},-58 C54,-60 86,-26 76,10 C66,48 -2,58 -34,50 C-56,44 -66,34 -70,10 Z`} fill={`url(#${gid})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <path d="M-44,-22 C-24,-44 12,-48 36,-36" fill="none" stroke="#D9AE76" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
      {[[-20, 6], [18, -8], [34, 18], [-40, 22]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={3.2} fill="#5B3A1C" opacity={0.7} />)}
    </g>
  );
};

/** ReleaseScroll: a vellum release that unrolls from a roll, written as grey bars and never as words. unroll 0..1. */
export const ReleaseScroll: React.FC<{x: number; y: number; w?: number; h?: number; unroll?: number; f: number; id?: string}> = ({x, y, w = 420, h = 520, unroll = 1, f, id = 'rs'}) => {
  const uu = clamp01(unroll);
  const hh = Math.max(40, h * uu);
  const gid = `${id}${Math.round(x)}`;
  return (
    <g transform={`translate(${x},${y})`}>
      <FormGradient id={gid} t={paleTones(PR.vellum)} softness={0.5} />
      <rect x={-w / 2 + 10} y={-h / 2 + 12} width={w} height={hh} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={hh} rx={4} fill={PR.vellumHi} stroke={INK} strokeWidth={5.5} />
      {/* the title bar and text bars */}
      <rect x={-w / 2 + 30} y={-h / 2 + 30} width={w * 0.6} height={26} fill={PR.contour} opacity={0.9} />
      {Array.from({length: 10}).map((_, i) => {
        const yy = -h / 2 + 84 + i * 38;
        if (yy > -h / 2 + hh - 40) return null;
        return <rect key={i} x={-w / 2 + 30} y={yy} width={(w - 60) * (i % 4 === 3 ? 0.55 : 0.96 - (i % 3) * 0.06)} height={12} fill={PR.contour} opacity={0.7} />;
      })}
      {/* the roll at the bottom edge */}
      <g transform={`translate(0,${-h / 2 + hh})`}>
        <rect x={-w / 2 - 14} y={-6} width={w + 28} height={34} rx={17} fill={PR.vellum} stroke={INK} strokeWidth={5.5} />
        <ellipse cx={-w / 2 - 14} cy={11} rx={9} ry={17} fill={PR.vellumShade} stroke={INK} strokeWidth={4} />
        <path d={`M${-w / 2 + 10},7 q${w / 2},${5 + 2 * Math.sin(f / 9)} ${w - 20},0`} stroke={PR.vellumShade} strokeWidth={4} fill="none" opacity={0.7} />
      </g>
    </g>
  );
};

/** RollTube: a brass tube lying at the table edge with a rolled sheet that slides out (out 0..1). */
export const RollTube: React.FC<{x: number; y: number; scale?: number; f: number; out?: number; id?: string}> = ({x, y, scale = 1, f, out = 0, id = 'rt'}) => {
  const gid = `${id}${Math.round(x)}${Math.round(y)}`;
  const o = clamp01(out);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <FormGradient id={gid} t={tones(PR.brass)} softness={0.55} />
      <ContactShadow cx={20} cy={46} rx={190} ry={14} opacity={0.34} blur={9} />
      <g transform={`translate(${-o * 150},0)`}>
        <rect x={-60} y={-30} width={220} height={60} rx={30} fill={PR.vellumHi} stroke={INK} strokeWidth={5.5} />
        <ellipse cx={-60} cy={0} rx={18} ry={30} fill={PR.vellumShade} stroke={INK} strokeWidth={4.4} />
        <path d="M-56,-4 q8,-6 16,0 t16,0" fill="none" stroke={PR.contour} strokeWidth={3} />
      </g>
      <rect x={60} y={-42} width={200} height={84} rx={18} fill={`url(#${gid})`} stroke={INK} strokeWidth={6} />
      <path d="M72,-26 L248,-26" stroke={PR.brassKey} strokeWidth={7} opacity={0.6} strokeLinecap="round" />
      <ellipse cx={260} cy={0} rx={16} ry={42} fill={PR.brassShade} stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** Pedestal: a bone cylinder with a flat top, the place a "first look" would stand. Origin is the ground under it. */
export const Pedestal: React.FC<{x: number; y: number; scale?: number; id?: string}> = ({x, y, scale = 1, id = 'pd'}) => {
  const gid = `${id}${Math.round(x)}`;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <FormGradient id={gid} t={tones(PR.bone)} softness={0.6} />
      <ContactShadow cx={0} cy={8} rx={92} ry={13} opacity={0.34} blur={9} />
      <path d="M-70,0 L-58,-150 L58,-150 L70,0 Z" fill={`url(#${gid})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <ellipse cx={0} cy={-150} rx={72} ry={14} fill={PR.vellumHi} stroke={INK} strokeWidth={5} />
      <path d="M-50,-16 L-42,-132" stroke="#FFFFFF" strokeWidth={6} opacity={0.4} strokeLinecap="round" />
    </g>
  );
};

/** Loupe: a brass magnifier held by a reader, origin at the grip. */
export const Loupe: React.FC<{x: number; y: number; scale?: number; rot?: number}> = ({x, y, scale = 1, rot = -30}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
    <rect x={-5} y={-52} width={10} height={52} rx={5} fill={PR.brassShade} stroke={INK} strokeWidth={3.6} />
    <circle cx={0} cy={-84} r={32} fill="#CFE3EE" opacity={0.42} stroke={INK} strokeWidth={5} />
    <circle cx={0} cy={-84} r={32} fill="none" stroke={PR.brass} strokeWidth={4} />
    <path d="M-16,-96 q10,-12 24,-6" fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.7} strokeLinecap="round" />
  </g>
);

// ---- GroundBG: the home world, a side view of the ground itself -----------------------------------------------------------------------------
/**
 * GroundBG: sky, hills, a strip of tundra turf at `surface` with a blue pond in it, and banded rock below down to the bottom of the frame.
 * It is the world the title is about: Plumb hangs on his string from the top of the frame and his tip stops a hair above the turf, while the
 * bit sleeps on the turf under a moss tarp and is the only thing that goes down through the rock. dawn (0..1) turns the dusk sky pale,
 * glow (0..1) lights lichen where the rock differs, field (0..1) bends periwinkle field lines through the strata, shaft (0..1) cuts a
 * borehole from the turf down at shaftX to shaftTo. It paints no text.
 */
export const GroundBG: React.FC<{
  f: number; surface?: number; dawn?: number; glow?: number; field?: number; bend?: number; pondX?: number; id?: string;
  shaftX?: number; shaftTo?: number; shaft?: number; dim?: number;
}> = ({f, surface = 1130, dawn = 0, glow = 0, field = 0, bend = 0, pondX = 560, id = 'gb', shaftX = 780, shaftTo = 1700, shaft = 0, dim = 0}) => {
  const mix = (a: string, b: string, t: number) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
  };
  const sT = mix(PR.duskTop, '#8EA3CB', dawn), sM = mix(PR.duskMid, '#E8C9A8', dawn), sL = mix(PR.duskLow, '#F6DDB4', dawn);
  const strata = ['#4A5560', '#6B5F4C', '#3F4D43', '#7A6A54', '#524A66', '#5E5E4C', '#3E4A55'];
  const top = surface + 78;
  const bandH = (1960 - top) / strata.length;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sT} /><stop offset="0.65" stopColor={sM} /><stop offset="1" stopColor={sL} /></linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={PR.tundraHi} /><stop offset="0.5" stopColor={PR.tundra} /><stop offset="1" stopColor={PR.tundraShade} /></linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.5" /></linearGradient>
        <radialGradient id={`${id}h`}><stop offset="0" stopColor="#FFE3B0" stopOpacity="0.55" /><stop offset="1" stopColor="#FFE3B0" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}l`}><stop offset="0" stopColor={PR.lichen} stopOpacity="0.62" /><stop offset="0.55" stopColor={PR.lichen} stopOpacity="0.24" /><stop offset="1" stopColor={PR.lichen} stopOpacity="0" /></radialGradient>
      </defs>
      <rect data-band="ok" x={-40} y={0} width={1160} height={surface + 20} fill={`url(#${id}s)`} />
      <ellipse data-band="ok" cx={dawn > 0.5 ? 820 : 260} cy={surface - 120} rx={520} ry={260} fill={`url(#${id}h)`} />
      {[0, 1].map((k) => Array.from({length: 5}).map((_, i) => {
        const bx = ((f * (0.9 + k * 0.5) + i * 70 + k * 600) % 1500) - 200;
        const by = 330 + k * 150 + i * 14 + 20 * Math.sin(f / 31 + i + k);
        const w = 18 + 6 * Math.sin(f / 5 + i * 1.7);
        return <path key={`${k}${i}`} data-band="ok" d={`M${bx - 26},${by} q${13},${-w} ${26},0 q${13},${-w} ${26},0`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.7} />;
      }))}
      {[0, 1, 2].map((i) => <ellipse key={i} data-band="ok" cx={(160 + i * 380 + f * (0.18 + i * 0.07)) % 1500 - 200} cy={surface - 640 + i * 110} rx={250 - i * 28} ry={20} fill="#F0DCC0" opacity={0.26 + 0.1 * dawn} />)}
      <path data-band="ok" d={`M-40,${surface} L-40,${surface - 170} C100,${surface - 250} 240,${surface - 210} 360,${surface - 170} C500,${surface - 120} 640,${surface - 280} 800,${surface - 210} C920,${surface - 160} 1040,${surface - 220} 1120,${surface - 190} L1120,${surface} Z`} fill={PR.hillsFar} transform={`translate(${-6 * Math.sin(f / 120)},0)`} opacity={0.95} />
      <path data-band="ok" d={`M-40,${surface + 10} L-40,${surface - 80} C140,${surface - 160} 300,${surface - 90} 480,${surface - 120} C640,${surface - 140} 820,${surface - 70} 1120,${surface - 110} L1120,${surface + 10} Z`} fill={PR.hills} transform={`translate(${-12 * Math.sin(f / 90 + 1)},0)`} />
      {/* the turf strip */}
      <rect data-band="ok" x={-40} y={surface} width={1160} height={80} fill={`url(#${id}g)`} />
      <path data-band="ok" d={`M-40,${surface} L1120,${surface}`} stroke={INK} strokeWidth={6} />
      {Array.from({length: 30}).map((_, i) => <path key={i} data-band="ok" d={`M${-20 + i * 40 + rnd(i) * 20},${surface + 2} q${-6 + 4 * Math.sin(f / 21 + i)},-26 ${-14},-44 M${-20 + i * 40 + rnd(i) * 20},${surface + 2} q${6 + 4 * Math.sin(f / 23 + i)},-30 ${10},-52`} fill="none" stroke={PR.tundraShade} strokeWidth={5} strokeLinecap="round" />)}
      {/* the pond: the blue patch, seen from just above the turf */}
      <ellipse data-band="ok" cx={pondX} cy={surface + 22} rx={146} ry={24} fill={PR.peri} stroke={INK} strokeWidth={5} />
      <ellipse data-band="ok" cx={pondX - 10} cy={surface + 22} rx={96} ry={14} fill={PR.periDeep} opacity={0.8} />
      <ellipse data-band="ok" cx={pondX - 40} cy={surface + 18} rx={40} ry={6} fill={PR.periHi} opacity={0.75} />
      {/* the rock: bands with a gentle fold, darker toward the bottom */}
      <rect data-band="ok" x={-40} y={top} width={1160} height={1960 - top} fill="#2F3640" />
      {strata.map((c, i) => {
        const y0 = top + i * bandH, y1 = y0 + bandH + 2;
        const fold = 22 * Math.sin(i * 1.7 + 0.4) + 5 * Math.sin(f / 40 + i);
        return <path key={i} data-band="ok" d={`M-40,${y0} C260,${y0 + fold} 700,${y0 - fold} 1120,${y0 + fold * 0.6} L1120,${y1 + fold * 0.6} C700,${y1 - fold} 260,${y1 + fold} -40,${y1} Z`} fill={c} stroke={INK} strokeWidth={3} />;
      })}
      {Array.from({length: 60}).map((_, i) => <circle key={i} data-band="ok" cx={rnd(i + 3) * 1160 - 40} cy={top + rnd(i + 77) * (1960 - top)} r={2 + rnd(i + 5) * 4} fill="#000" opacity={0.2} />)}
      <rect data-band="ok" x={-40} y={top} width={1160} height={1960 - top} fill={`url(#${id}r)`} />
      {/* cracks and stones in the rock */}
      {Array.from({length: 18}).map((_, i) => {
        const cx = rnd(i + 31) * 1100, cy = top + 60 + rnd(i + 41) * (1960 - top - 100);
        return <path key={`c${i}`} data-band="ok" d={`M${cx},${cy} l${22 + rnd(i) * 40},${10 + rnd(i + 2) * 24} l${-10 + rnd(i + 3) * 30},${18 + rnd(i + 4) * 30}`} fill="none" stroke="#0A110E" strokeWidth={3} opacity={0.45} strokeLinecap="round" />;
      })}
      {Array.from({length: 12}).map((_, i) => <ellipse key={`s${i}`} data-band="ok" cx={rnd(i + 61) * 1100} cy={top + 40 + rnd(i + 71) * (1960 - top - 80)} rx={16 + rnd(i + 5) * 26} ry={9 + rnd(i + 6) * 12} fill="#000" opacity={0.18} stroke="#FFFFFF" strokeWidth={1.4} strokeOpacity={0.12} />)}
      {/* lichen glow where the rock differs: soft falloff, wider than tall so it follows the strata */}
      {glow > 0.01 && [[210, 1330, 190], [610, 1520, 230], [410, 1760, 170], [930, 1360, 150], [800, 1700, 150]].map(([gx, gy, gr], i) => (
        <ellipse key={i} data-band="ok" cx={gx as number} cy={gy as number} rx={(gr as number) * 1.5} ry={(gr as number) * 0.62} fill={`url(#${id}l)`} opacity={clamp01(glow) * (0.78 + 0.22 * Math.sin(f / 12 + i * 2))} />
      ))}
      {field > 0.01 && (
        <g data-band="ok" opacity={clamp01(field)} fill="none" stroke={PR.periHi} strokeWidth={5} strokeLinecap="round">
          {[120, 320, 540, 760, 960].map((fx, i) => {
            const bow = 40 * Math.sin(f / 18 + i) * 0.5 + bend * (i === 2 || i === 3 ? 90 : 26);
            return <path key={i} d={`M${fx},${top} C${fx + bow},${top + 260} ${fx - bow},${top + 520} ${fx + bow * 0.5},${1900}`} strokeDasharray="14 12" strokeDashoffset={-f * 0.9} opacity={0.9} />;
          })}
        </g>
      )}
      {/* a borehole cut down from the turf */}
      {shaft > 0.01 && (
        <g data-band="ok">
          <rect x={shaftX - 36} y={surface + 6} width={72} height={Math.max(0, (shaftTo - surface) * clamp01(shaft))} fill="#050807" stroke={INK} strokeWidth={5} />
          <ellipse cx={shaftX} cy={surface + 6} rx={54} ry={11} fill="#050807" stroke={INK} strokeWidth={5} />
        </g>
      )}
      {dim > 0 && <rect data-band="ok" x={-40} y={0} width={1160} height={1960} fill={PR.night} opacity={dim} />}
    </g>
  );
};
