import React from 'react';
import {tones, FormGradient, RimLight, ContactShadow} from './lighting';
import {figureIdle, FigurePose} from './figureidle';
import {MONO, monoW} from './prospect';
import {Hand, HandPencil} from './hand';

/**
 * THE NIB FAMILY (2026-11-28, "The Map Swelled").
 *
 * Nib is a knee-high steel drafting-pen nib that stands on its split tines. It is the study's
 * DEEP-LEARNING TRACER: its breather hole is its one eye (eye only, no brows or mouth: it acts
 * through its tines, its lean and its ink line), its ultramarine reservoir holds the only ink the
 * machine uses. It is never damaged and never carries OUR COUNT material.
 *
 * Colour law (LAW.*): ULTRAMARINE is the machine's line alone. PERSIMMON (NB.carmine key) is the
 * study's checker's pencil alone, hairline strokes only. PINE (NB.cobalt key) is OUR COUNT alone, in
 * stamp, slip, tab and type form. NICKEL (NB.brass key) is the scales, weights and steel tape. Lakes
 * are rock-flour TURQUOISE.
 *
 * Also here: CheckHand (role 'study' = oatmeal cuff and persimmon pencil, role 'ours' = pine cuff and
 * tally clicker; origin at the tool tip), LightTable (side view with a lamp), LandsatTile, lakeBlob,
 * LakeFill, LakeOutline, LakeChip, TapeMeasure (a steel tape with plated ticks), BrassWeight (a
 * machined nickel cylinder, optional turquoise lake inlay), SpringScale and WeighRail.
 */
export const NB = {
  room: '#2A2018', roomL: '#3A2D22', roomD: '#1C150F',
  vellum: '#F6DDA8', vellumD: '#E0C084', vellumL: '#FCEFCF', glow: '#FFF3D0',
  oak: '#6B4E34', oakL: '#8E6A48', oakD: '#4A3422',
  steel: '#B9BEC8', steelD: '#7D8494', steelL: '#E8ECF2',
  ultra: '#3346C8', ultraL: '#6A7CF0', ultraD: '#1F2C8A',
  carmine: '#E0662A', carmineL: '#F59060', carmineD: '#A8441A',
  cobalt: '#2F6B45', cobaltL: '#4E9466',
  lake: '#7FC8C2', lakeD: '#4FA39C', lakeL: '#B5E4DF',
  ice: '#EEF3F6', iceD: '#BFCBD6', rock: '#8C8A86', rockD: '#5E5C59', tile: '#9A9894', tileD: '#6E6C68',
  brass: '#8E949C', brassL: '#D3D7DC', brassD: '#4E535A',
  skin: '#C98E6A', skinD: '#9C6646', skinL: '#E2B08E', cuff: '#CDBFA3', cuffD: '#A89A7E', pine: '#2F6B45', pineD: '#1E4A2E',
  sky: '#5E5A78', skyL: '#E9B49A', peak: '#9A93B0', iceRim: '#F6C6C6', hilite: '#F3E39A', hiliteEdge: '#D9C25A', gravel: '#77706A', gravelD: '#4E4842',
  ink: '#15161D', inkL: '#33343F', paper: '#F6DDA8', paperD: '#E0C084',
  card: '#F2F3EF', cardD: '#D8DAD3', steelTape: '#C9CDD3',
};
/** colour-law aliases: persimmon is the study's pencil, pine is OUR COUNT, nickel the scales. */
export const LAW = {persimmon: NB.carmine, pine: NB.cobalt, nickel: NB.brass, ultra: NB.ultra, lake: NB.lake};

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

/** A mono label on a plate sized to its string by arithmetic. */
export const NLab: React.FC<{x: number; y: number; text: string; size?: number; fill?: string; ink?: string; edge?: string; rot?: number}> =
({x, y, text, size = 18, fill = NB.paper, ink = NB.ink, edge = NB.ink, rot = 0}) => {
  const w = monoW(text, size) + 22;
  const h = size + 14;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill={fill} stroke={edge} strokeWidth={3} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1} fill={ink}>{text}</text>
    </g>
  );
};

export type NibEmotion = 'calm' | 'curious' | 'proud' | 'surprised' | 'sheepish' | 'focused' | 'uneasy' | 'wonder';

/**
 * Nib. Origin is the TIP (the contact point with the sheet). About 430 px tall at s=1.
 *  splay 0..1   the tines open (unsure) ; stroke 0..1 a drawing bob (the tip presses, the body leans)
 *  tick 0..1    a carmine tick sticker on the right shoulder (a person checked it)
 *  look -1..1   the pupil looks left/right ; lean degrees ; squash 0..1 landing squash
 */
export const Nib: React.FC<{
  f: number; x: number; y: number; s?: number; emotion?: NibEmotion; splay?: number; stroke?: number; tick?: number;
  look?: number; lookY?: number; lean?: number; squash?: number; cues?: number[]; seed?: number; label?: boolean; facing?: 1 | -1; ink?: number;
}> = ({f, x, y, s = 1, emotion = 'calm', splay = 0, stroke = 0, tick = 0, look = 0, lookY = 0, lean = 0, squash = 0, cues, seed = 7, label = true, facing = 1, ink = 1}) => {
  const id = uid(`nb${seed}`);
  const bp = beatPose(f, seed, cues, 430);
  const ts = tones(NB.steel);
  const tu = tones(NB.ultra);
  const breath = 1 + 0.012 * Math.sin(f / 14 + seed);
  const blink = ((f + seed * 31) % 103) < 4;
  const sq = clamp01(squash);
  const sp = clamp01(splay);
  const st = clamp01(stroke);
  const rot = lean + bp.skew * 0.5 + 1.2 * Math.sin(f / 27 + seed) + st * 6 * Math.sin(f / 3.2);
  // the steel body: a chisel that narrows to the tip at 0,0
  const BODY = `M ${-6 - sp * 8} -6 C -40 -90 -96 -170 -104 -250 C -110 -300 -96 -330 -78 -342 L 78 -342 C 96 -330 110 -300 104 -250 C 96 -170 40 -90 ${6 + sp * 8} -6 Z`;
  const eyeY = -232;
  const pup = look * 9;
  const pupY = lookY * 7;
  const open = emotion === 'surprised' || emotion === 'wonder';
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <defs>
        <FormGradient id={`${id}s`} t={ts} />
        <FormGradient id={`${id}u`} t={tu} />
        <linearGradient id={`${id}h`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={NB.steelL} stopOpacity={0.0} />
          <stop offset="0.35" stopColor={NB.steelL} stopOpacity={0.55} />
          <stop offset="0.6" stopColor={NB.steelL} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <ContactShadow cx={8} cy={2} rx={46 + st * 8} ry={9} opacity={0.45} />
      {ink > 0.02 && <circle cx={0} cy={0} r={7 + 3 * st} fill={NB.ultra} opacity={0.9 * ink} />}
      <g transform={`translate(0 ${-bp.dip * 7 + st * 4}) rotate(${rot} 0 0) scale(${(1 + sq * 0.07) * (1 / breath) ** 0.3} ${(1 - sq * 0.09) * breath})`}>
        {/* the reservoir and grip above the shoulders, the machine's ink */}
        <path d="M -70 -342 L -62 -400 Q 0 -418 62 -400 L 70 -342 Z" fill={`url(#${id}u)`} stroke={NB.ink} strokeWidth={6} strokeLinejoin="round" />
        {[0, 1, 2].map((i) => <path key={i} d={`M ${-60 + i * 4} ${-356 - i * 14} Q 0 ${-366 - i * 14} ${60 - i * 4} ${-356 - i * 14}`} stroke={NB.ultraD} strokeWidth={4} fill="none" />)}
        <ellipse cx={-30} cy={-388} rx={16} ry={5} fill={NB.ultraL} opacity={0.8} />
        <path d="M -62 -404 Q 0 -440 62 -404" fill={NB.ink} stroke={NB.ink} strokeWidth={6} />
        {/* the steel body */}
        <path d={BODY} fill={`url(#${id}s)`} stroke={NB.ink} strokeWidth={6} strokeLinejoin="round" />
        <path d={BODY} fill={`url(#${id}h)`} />
        {/* shoulder chamfer + engraved scrolls (detail density) */}
        <path d="M -98 -300 Q 0 -286 98 -300" stroke={NB.steelD} strokeWidth={4} fill="none" />
        <path d="M -84 -318 q 18 -10 36 0 q 18 10 36 0" stroke={NB.steelD} strokeWidth={3} fill="none" opacity={0.8} />
        <path d="M 12 -318 q 18 -10 36 0 q 18 10 36 0" stroke={NB.steelD} strokeWidth={3} fill="none" opacity={0.8} />
        {[-70, -46, 46, 70].map((rx) => <circle key={rx} cx={rx} cy={-270} r={4} fill={NB.steelL} stroke={NB.ink} strokeWidth={2} />)}
        {/* the slit from the breather hole to the tip, opening with splay */}
        <path d={`M 0 ${eyeY + 34} L ${-sp * 6} -10`} stroke={NB.ink} strokeWidth={4} />
        {sp > 0.05 && <path d={`M 0 ${eyeY + 34} L ${sp * 6} -10`} stroke={NB.ink} strokeWidth={4} />}
        <RimLight d="M 96 -300 C 100 -230 70 -150 30 -60" w={6} color="#F4F7FA" opacity={0.75} />
        <path d="M -82 -300 C -86 -230 -60 -150 -24 -64" stroke={NB.steelL} strokeWidth={7} strokeLinecap="round" opacity={0.6} fill="none" />
        {/* the breather-hole eye */}
        <g transform={`translate(${look * 4} 0)`}>
          <circle cx={0} cy={eyeY} r={34} fill={NB.ink} />
          <circle cx={0} cy={eyeY} r={blink ? 0 : open ? 29 : 27} fill="#FFFFFF" />
          {blink && <path d={`M -28 ${eyeY} Q 0 ${eyeY + 10} 28 ${eyeY}`} stroke={NB.ink} strokeWidth={5} fill="none" />}
          {!blink && <circle cx={pup} cy={eyeY + 2 + pupY} r={12} fill={NB.ultraD} />}
          {!blink && <circle cx={pup} cy={eyeY + 2 + pupY} r={6} fill={NB.ink} />}
          {!blink && <circle cx={pup + 4} cy={eyeY - 3 + pupY} r={3.5} fill="#FFFFFF" />}
          <circle cx={0} cy={eyeY} r={34} fill="none" stroke={NB.ultra} strokeWidth={4} opacity={0.85} />
        </g>
        {/* neutral additions */}
        {tick > 0.02 && (
          <g transform={`translate(70 -318) scale(${0.4 + 0.6 * (1 - Math.exp(-6 * clamp01(tick)) * Math.cos(8 * clamp01(tick)))}) rotate(-8)`}>
            <circle cx={0} cy={0} r={20} fill={NB.vellumL} stroke={NB.ink} strokeWidth={3} />
            <path d="M -9 1 L -2 9 L 11 -9" stroke={NB.carmine} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </g>
      {label && (
        <g transform={`scale(${facing} 1)`}><NLab x={0} y={-462 - bp.dip * 7} text="DEEP LEARNING" size={15} fill={NB.vellumL} ink={NB.ultraD} /></g>
      )}
    </g>
  );
};

/**
 * CheckHand: a person's right hand and cuff holding a carmine pencil. Origin is the PENCIL TIP (the grip
 * point is drawn around it, so placing the tip places the hand). angle in degrees (0 = pencil pointing
 * straight down-left at 35deg from vertical). press 0..1 squashes the hand on a tick.
 * Pass `cues` (strike frames) for the articulated lib Hand (lib/hand.tsx): wrist, knuckles, anticipation,
 * press, recoil and settle. New episodes should; the cue-less path is kept so Ep1128 renders as shipped.
 */
export const CheckHand: React.FC<{f: number; x: number; y: number; s?: number; angle?: number; press?: number; seed?: number; arm?: number; role?: 'study' | 'ours'; cues?: number[]}> =
({f, x, y, s = 1, angle = 0, press = 0, seed = 3, arm = 1, role = 'study', cues}) => {
  const ours = role === 'ours';
  // cues given: the articulated lib Hand (machine pass 2026-11-28, queue lib-hand-asset) with the same
  // role colours and tool, striking on each cue. Without cues this is the rigid hand Ep1128 shipped.
  if (cues) {
    return (
      <Hand f={f} x={x} y={y} s={s} angle={angle} cues={cues} press={press} seed={seed} arm={arm > 0 ? 300 : 0}
        skin={NB.skin} sleeve={ours ? NB.pine : NB.cuff} cuff={ours ? NB.pineD : NB.cuffD} ink={NB.ink}>
        {ours ? (
          <g>
            <rect x={-30} y={-96} width={60} height={86} rx={14} fill={NB.pine} stroke={NB.ink} strokeWidth={4} />
            <rect x={-20} y={-84} width={40} height={26} rx={4} fill={NB.vellumL} stroke={NB.ink} strokeWidth={2.5} />
            <circle cx={0} cy={-6} r={10} fill={NB.pineD} stroke={NB.ink} strokeWidth={3} />
          </g>
        ) : <HandPencil color={NB.carmine} colorL={NB.carmineL} ink={NB.ink} />}
      </Hand>
    );
  }
  const cuff = ours ? NB.pine : NB.cuff, cuffD = ours ? NB.pineD : NB.cuffD;
  const id = uid(`ch${seed}`);
  const tk = tones(NB.skin);
  const pr = clamp01(press);
  const idle = 1.5 * Math.sin(f / 19 + seed);
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${-35 + angle + idle})`}>
      <defs><FormGradient id={`${id}k`} t={tk} /></defs>
      <ContactShadow cx={10} cy={6} rx={22} ry={6} opacity={0.35} />
      <g transform={`translate(0 ${pr * 6}) scale(${1 + pr * 0.04} ${1 - pr * 0.05})`}>
        {ours ? (
          <g>
            {/* our pine tally clicker held at the fingertips, its button at the origin */}
            <rect x={-30} y={-96} width={60} height={86} rx={14} fill={NB.pine} stroke={NB.ink} strokeWidth={4} />
            <rect x={-20} y={-84} width={40} height={26} rx={4} fill={NB.vellumL} stroke={NB.ink} strokeWidth={2.5} />
            <circle cx={0} cy={-6} r={10} fill={NB.pineD} stroke={NB.ink} strokeWidth={3} />
            <path d="M -18 -40 L 18 -40" stroke={NB.pineD} strokeWidth={3} />
          </g>
        ) : (
          <g>
            {/* the pencil: tip at the origin, running up the frame */}
            <path d="M 0 0 L -9 -34 L 9 -34 Z" fill="#E7C9A0" stroke={NB.ink} strokeWidth={3} strokeLinejoin="round" />
            <path d="M 0 0 L -3 -11 L 3 -11 Z" fill={NB.carmine} />
            <rect x={-10} y={-260} width={20} height={228} fill={NB.carmine} stroke={NB.ink} strokeWidth={4} />
            <path d="M -3 -250 L -3 -40" stroke={NB.carmineL} strokeWidth={3} />
            <rect x={-11} y={-282} width={22} height={24} fill="#C8C8C8" stroke={NB.ink} strokeWidth={3} />
            <rect x={-10} y={-300} width={20} height={20} rx={6} fill={NB.cuffD} stroke={NB.ink} strokeWidth={3} />
          </g>
        )}
        {/* the hand gripping at about 60 px up the pencil */}
        <path d="M -22 -64 C -48 -80 -58 -126 -40 -160 C -22 -192 30 -196 52 -170 C 70 -146 64 -104 40 -80 C 26 -66 6 -58 -8 -60 Z" fill={`url(#${id}k)`} stroke={NB.ink} strokeWidth={5} strokeLinejoin="round" />
        {/* thumb over the pencil and the index finger along it */}
        <path d="M -30 -92 C -18 -88 -4 -86 12 -92 C 20 -95 22 -104 14 -108 C 2 -112 -16 -108 -30 -104 Z" fill={tk.key} stroke={NB.ink} strokeWidth={4} />
        <path d="M 14 -74 C 22 -60 18 -46 8 -40 C 2 -37 -4 -42 -2 -50 L 4 -70 Z" fill={tk.key} stroke={NB.ink} strokeWidth={4} />
        <path d="M 30 -120 q 10 4 14 14 M 34 -144 q 10 4 12 14" stroke={NB.skinD} strokeWidth={3} fill="none" />
        <path d="M -6 -60 q 6 4 12 0" stroke={NB.skinD} strokeWidth={3} fill="none" />
        {/* the cuff and sleeve, out of frame upward */}
        {arm > 0 && <path d="M -40 -164 L -70 -420 L 90 -440 L 56 -168 Z" fill={cuff} stroke={NB.ink} strokeWidth={5} strokeLinejoin="round" />}
        {arm > 0 && <path d="M -44 -182 Q 6 -200 58 -186" stroke={cuffD} strokeWidth={8} fill="none" />}
        {arm > 0 && <path d="M -56 -300 L 76 -312" stroke={cuffD} strokeWidth={4} fill="none" opacity={0.7} />}
      </g>
    </g>
  );
};

/** a carmine tick or a correction stroke drawn on with progress p (0..1) at x,y */
export const Tick: React.FC<{x: number; y: number; p: number; s?: number}> = ({x, y, p, s = 1}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  const L = 62;
  return (
    <path d={`M ${x - 18 * s} ${y} L ${x - 4 * s} ${y + 14 * s} L ${x + 22 * s} ${y - 20 * s}`} stroke={NB.carmine} strokeWidth={6 * s} fill="none" strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={`${L * s} ${L * s}`} strokeDashoffset={L * s * (1 - k)} />
  );
};

/** a closed wobbly lake blob path around cx,cy with mean radius r (rx ry stretch), seeded */
export function lakeBlob(cx: number, cy: number, rx: number, ry: number, seed: number, n = 14, wob = 0.28): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wob * (h01(seed, i) - 0.5) * 2 + 0.12 * Math.sin(a * 3 + seed);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (i === 0) d += `M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} `;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  return d + 'Z';
}

/** approximate perimeter of a lakeBlob for dash arithmetic */
export const blobLen = (rx: number, ry: number) => Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry))) * 1.12;

/** a turquoise lake fill with shade and a shore of silt, seeded blob */
export const LakeFill: React.FC<{cx: number; cy: number; rx: number; ry: number; seed: number; swell?: number; f?: number}> = ({cx, cy, rx, ry, seed, swell = 1, f = 0}) => {
  const k = swell * (1 + 0.012 * Math.sin(f / 15 + seed));
  return (
    <g>
      <path d={lakeBlob(cx, cy, rx * k + 6, ry * k + 6, seed)} fill={NB.tileD} opacity={0.6} />
      <path d={lakeBlob(cx, cy, rx * k, ry * k, seed)} fill={NB.lake} stroke={NB.lakeD} strokeWidth={3} />
      <path d={lakeBlob(cx - rx * 0.15, cy - ry * 0.15, rx * k * 0.55, ry * k * 0.45, seed + 3)} fill={NB.lakeL} opacity={0.55} />
      {[0, 1, 2].map((i) => <path key={i} d={`M ${cx - rx * 0.4 + i * rx * 0.3} ${cy + ry * 0.2 + i * 6} q ${rx * 0.08} -4 ${rx * 0.16} 0`} stroke={NB.lakeL} strokeWidth={2.5} fill="none" opacity={0.8} />)}
    </g>
  );
};

/** an ultramarine ink trace around a lake blob, drawn on with p (0..1) */
export const LakeOutline: React.FC<{cx: number; cy: number; rx: number; ry: number; seed: number; p: number; width?: number; color?: string; dashed?: boolean}> =
({cx, cy, rx, ry, seed, p, width = 5, color = NB.ultra, dashed = false}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  const L = blobLen(rx, ry);
  return (
    <path d={lakeBlob(cx, cy, rx, ry, seed)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round"
      strokeDasharray={dashed ? '10 9' : `${L} ${L}`} strokeDashoffset={dashed ? 0 : L * (1 - k)} opacity={dashed ? k : 1} />
  );
};

/**
 * LandsatTile: a grey satellite tile seen from above, w x h, top-left at x,y. Ice (white, with crevasse
 * lines) enters from one side, rock texture elsewhere, and one turquoise lake against the ice front.
 * lake 0..: the lake's swell; trace 0..1 the ultramarine outline; label shows a corner date chip.
 */
export const LandsatTile: React.FC<{f: number; x: number; y: number; w: number; h: number; seed?: number; lake?: number; trace?: number; glow?: number; date?: string; lakeR?: number}> =
({f, x, y, w, h, seed = 1, lake = 1, trace = 0, glow = 0.35, date, lakeR = 0.22}) => {
  const id = uid(`lt${seed}`);
  const cx = x + w * (0.42 + 0.12 * h01(seed, 1)), cy = y + h * (0.56 + 0.1 * h01(seed, 2));
  const rx = w * lakeR, ry = h * lakeR * 0.72;
  return (
    <g>
      <defs><clipPath id={`${id}c`}><rect x={x} y={y} width={w} height={h} /></clipPath></defs>
      <rect x={x + 8} y={y + 10} width={w} height={h} fill="#000" opacity={0.25} />
      <g clipPath={`url(#${id}c)`}>
        <rect x={x} y={y} width={w} height={h} fill={NB.tile} />
        {Array.from({length: 18}, (_, i) => (
          <path key={i} d={lakeBlob(x + w * h01(seed + 4, i), y + h * h01(seed + 5, i), w * 0.08 + w * 0.06 * h01(seed + 6, i), h * 0.05 + h * 0.04 * h01(seed + 7, i), seed * 10 + i, 8, 0.4)}
            fill={i % 2 ? NB.rock : NB.rockD} opacity={0.55} />
        ))}
        {/* the ice front from the top */}
        <path d={`M ${x - 10} ${y - 10} L ${x + w + 10} ${y - 10} L ${x + w + 10} ${cy - ry * lake - h * 0.06} C ${x + w * 0.7} ${cy - ry * lake + 4} ${x + w * 0.3} ${cy - ry * lake - h * 0.1} ${x - 10} ${cy - ry * lake - h * 0.02} Z`}
          fill={NB.ice} stroke={NB.iceD} strokeWidth={3} />
        {Array.from({length: 7}, (_, i) => <path key={`c${i}`} d={`M ${x + w * (0.1 + i * 0.13)} ${y + h * 0.05} l ${w * 0.03} ${h * 0.18}`} stroke={NB.iceD} strokeWidth={3} />)}
        <LakeFill cx={cx} cy={cy} rx={rx} ry={ry} seed={seed} swell={lake} f={f} />
        {glow > 0 && <rect x={x} y={y} width={w} height={h} fill={NB.glow} opacity={glow * 0.25} />}
        <LakeOutline cx={cx} cy={cy} rx={rx * lake} ry={ry * lake} seed={seed} p={trace} width={Math.max(3, w * 0.012)} />
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={NB.ink} strokeWidth={4} />
      {date && <NLab x={x + monoW(date, 14) / 2 + 22} y={y + h - 20} text={date} size={14} fill={NB.roomL} ink={NB.vellumL} edge={NB.ink} />}
    </g>
  );
};

/** the lake centre of a LandsatTile, for placing Nib's tip on the shore */
export function tileLake(x: number, y: number, w: number, h: number, seed = 1, lakeR = 0.22) {
  return {cx: x + w * (0.42 + 0.12 * h01(seed, 1)), cy: y + h * (0.56 + 0.1 * h01(seed, 2)), rx: w * lakeR, ry: h * lakeR * 0.72};
}

/** LightTable (side view): an oak table whose top glows, on two legs, with a desk lamp at left. Origin: front-top centre of the table. */
export const LightTable: React.FC<{f: number; x: number; y: number; w?: number; lamp?: boolean; legs?: boolean}> = ({f, x, y, w = 1000, lamp = true, legs = true}) => {
  const id = uid('ltb');
  const to = tones(NB.oak);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <FormGradient id={`${id}o`} t={to} />
        <radialGradient id={`${id}g`} cx="0.5" cy="1" r="0.9">
          <stop offset="0" stopColor={NB.glow} stopOpacity={0.55} />
          <stop offset="1" stopColor={NB.glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={-60} rx={w * 0.62} ry={260} fill={`url(#${id}g)`} />
      <path d={`M ${-w / 2} 0 L ${-w / 2 + 40} -40 L ${w / 2 - 40} -40 L ${w / 2} 0 Z`} fill={NB.vellum} stroke={NB.ink} strokeWidth={5} />
      <path d={`M ${-w / 2 + 50} -34 L ${w / 2 - 50} -34`} stroke={NB.vellumL} strokeWidth={4} opacity={0.8} />
      <rect x={-w / 2} y={0} width={w} height={44} fill={`url(#${id}o)`} stroke={NB.ink} strokeWidth={5} />
      {Array.from({length: 8}, (_, i) => <path key={i} d={`M ${-w / 2 + 40 + i * w / 8} 14 q 30 8 60 0`} stroke={NB.oakD} strokeWidth={2.5} fill="none" />)}
      {legs && [-w * 0.42, w * 0.42].map((lx) => (
        <g key={lx}>
          <rect x={lx - 18} y={44} width={36} height={420} fill={to.core} stroke={NB.ink} strokeWidth={5} />
          <ContactShadow cx={lx} cy={466} rx={50} ry={10} opacity={0.4} />
        </g>
      ))}
      {lamp && (
        <g transform={`translate(${-w / 2 + 90} -40)`}>
          <ellipse cx={0} cy={0} rx={60} ry={14} fill={NB.inkL} stroke={NB.ink} strokeWidth={4} />
          <path d="M 0 -6 L 30 -230 L 150 -300" stroke={NB.ink} strokeWidth={14} fill="none" strokeLinecap="round" />
          <path d="M 0 -6 L 30 -230 L 150 -300" stroke={NB.brass} strokeWidth={8} fill="none" strokeLinecap="round" />
          <circle cx={30} cy={-230} r={12} fill={NB.brassL} stroke={NB.ink} strokeWidth={4} />
          <g transform="translate(150 -300) rotate(28)">
            <path d="M -50 0 L 50 0 L 30 -60 L -30 -60 Z" fill={NB.brass} stroke={NB.ink} strokeWidth={5} />
            <ellipse cx={0} cy={2} rx={46} ry={10} fill={NB.glow} opacity={0.85 + 0.1 * Math.sin(f / 23)} />
          </g>
        </g>
      )}
    </g>
  );
};

/** a popcorn lake chip: a tiny turquoise blob with a sheen; pop 0..1 springs it in */
export const LakeChip: React.FC<{x: number; y: number; r?: number; pop?: number; seed?: number}> = ({x, y, r = 14, pop = 1, seed = 1}) => {
  const k = clamp01(pop);
  if (k <= 0) return null;
  const sc = 1 - Math.exp(-7 * k) * Math.cos(10 * k);
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`}>
      <path d={lakeBlob(0, 0, r, r * 0.75, seed, 9, 0.35)} fill={NB.lake} stroke={NB.ink} strokeWidth={2.5} />
      <ellipse cx={-r * 0.3} cy={-r * 0.25} rx={r * 0.32} ry={r * 0.18} fill={NB.lakeL} />
    </g>
  );
};

/** a steel tape: a case at x,y with the tape extended `len` px to the right, ticked. label rides the tip. */
export const TapeMeasure: React.FC<{f: number; x: number; y: number; len: number; label?: string; sweat?: number; marks?: {at: number; label: string; color?: string}[]}> = ({f, x, y, len, label, sweat = 0, marks = []}) => {
  const L = Math.max(0, len);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ContactShadow cx={L / 2} cy={30} rx={L / 2 + 50} ry={8} opacity={0.3} />
      <rect x={0} y={-14} width={L} height={28} fill={NB.steelTape} stroke={NB.ink} strokeWidth={3.5} />
      {Array.from({length: Math.floor(L / 16)}, (_, i) => <path key={i} d={`M ${i * 16 + 8} -14 l 0 ${i % 5 === 4 ? 16 : 9}`} stroke={NB.ink} strokeWidth={2} />)}
      <rect x={L - 6} y={-20} width={12} height={40} rx={2} fill={NB.brass} stroke={NB.ink} strokeWidth={3} />
      <circle cx={-20} cy={0} r={42} fill={NB.oakL} stroke={NB.ink} strokeWidth={5} />
      <circle cx={-20} cy={0} r={18} fill={NB.brassL} stroke={NB.ink} strokeWidth={4} />
      <path d={`M -20 0 L ${-20 + 14 * Math.cos(f / 8)} ${14 * Math.sin(f / 8)}`} stroke={NB.ink} strokeWidth={3} />
      {sweat > 0.05 && <path d={`M ${L + 6} ${-26 + 10 * ((f / 12) % 1)} q 5 8 0 12 q -5 -4 0 -12`} fill={NB.lakeL} stroke={NB.ink} strokeWidth={2} opacity={sweat} />}
      {label && <NLab x={L + 10 + monoW(label, 16) / 2 + 20} y={0} text={label} size={16} fill={NB.vellumL} />}
      {marks.filter((m) => m.at <= L + 1).map((m) => <g key={m.label}><path d={`M ${m.at} -24 L ${m.at} 22`} stroke={m.color ?? NB.ink} strokeWidth={5} /><NLab x={m.at} y={48} text={m.label} size={15} fill={NB.vellumL} ink={m.color ?? NB.ink} edge={m.color ?? NB.ink} /></g>)}
    </g>
  );
};

/** a brass weight with a label plate; size by share. Origin at its bottom centre. */
export const BrassWeight: React.FC<{x: number; y: number; w: number; label?: string; tint?: string; lake?: boolean}> = ({x, y, w, label, tint = NB.brass, lake = false}) => {
  const id = uid('bw');
  const t = tones(tint);
  const h = w * 0.72;
  const ry = w * 0.14;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${id}t`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={t.shade} /><stop offset="0.3" stopColor={t.key} /><stop offset="0.55" stopColor={t.base} /><stop offset="1" stopColor={t.core} />
        </linearGradient>
      </defs>
      <path d={`M ${-w / 2} ${-h} L ${-w / 2} 0 A ${w / 2} ${ry} 0 0 0 ${w / 2} 0 L ${w / 2} ${-h} Z`} fill={`url(#${id}t)`} stroke={NB.ink} strokeWidth={5} />
      <path d={`M ${-w / 2} ${-h * 0.35} A ${w / 2} ${ry} 0 0 0 ${w / 2} ${-h * 0.35}`} stroke={NB.brassD} strokeWidth={3} fill="none" />
      <ellipse cx={0} cy={-h} rx={w / 2} ry={ry} fill={t.key} stroke={NB.ink} strokeWidth={4} />
      <path d={`M -10 ${-h - 4} Q 0 ${-h - 30} 10 ${-h - 4}`} stroke={NB.ink} strokeWidth={6} fill="none" />
      <path d={`M ${-w * 0.36} ${-h + 10} L ${-w * 0.36} -8`} stroke={NB.brassL} strokeWidth={5} opacity={0.85} />
      {lake && <path d={lakeBlob(0, -h * 0.62, w * 0.3, w * 0.16, 77)} fill={NB.lake} stroke={NB.ink} strokeWidth={3} />}
      {label && <text x={0} y={-h * (lake ? 0.2 : 0.4)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={Math.min(24, (w * 0.84) / (label.length * 0.62))} fill={NB.ink}>{label}</text>}
    </g>
  );
};

/**
 * SpringScale: a nickel spring hanging from a hook at x,y, a pan on chains below; the spring's extension
 * is `ext` px (the honest share), the weight sits in the pan. empty draws an empty swinging pan.
 */
export const SpringScale: React.FC<{f: number; x: number; y: number; ext: number; weightW?: number; label?: string; empty?: boolean; swing?: number; seed?: number; land?: number; lake?: boolean}> =
({f, x, y, ext, weightW = 0, label, empty = false, swing = 0, seed = 1, land = 1, lake = false}) => {
  const coils = 9;
  const sw = swing * 6 * Math.sin(f / 9 + seed);
  const L = 60 + ext;
  const pts: string[] = [];
  for (let i = 0; i <= coils * 2; i++) pts.push(`${(i % 2 ? 18 : -18)},${(i / (coils * 2)) * L}`);
  const lk = clamp01(land);
  return (
    <g transform={`translate(${x} ${y}) rotate(${sw})`}>
      <path d="M 0 -30 q 14 0 14 14 q 0 14 -14 14" stroke={NB.ink} strokeWidth={6} fill="none" />
      <path d="M 0 -30 q 14 0 14 14 q 0 14 -14 14" stroke={NB.brass} strokeWidth={3} fill="none" />
      <polyline points={pts.join(' ')} fill="none" stroke={NB.ink} strokeWidth={7} strokeLinejoin="round" />
      <polyline points={pts.join(' ')} fill="none" stroke={NB.brassL} strokeWidth={3.5} strokeLinejoin="round" />
      <g transform={`translate(0 ${L})`}>
        <path d="M 0 0 L -70 70 M 0 0 L 70 70" stroke={NB.ink} strokeWidth={3} />
        <path d="M -86 70 Q 0 104 86 70 Z" fill={NB.brass} stroke={NB.ink} strokeWidth={5} />
        <path d="M -70 76 Q 0 96 70 76" stroke={NB.brassL} strokeWidth={3} fill="none" />
        {!empty && weightW > 0 && lk > 0.01 && <g transform={`translate(0 ${-(1 - lk) * 260})`}><BrassWeight x={0} y={74} w={weightW} label={label} lake={lake} /></g>}
      </g>
    </g>
  );
};

/** WeighRail: a nickel rail on a column, n spring scales hanging from it; the plate reads its text. Origin: column foot. */
export const WeighRail: React.FC<{f: number; x: number; y: number; w?: number; plate?: string; children?: React.ReactNode; railY?: number}> =
({f, x, y, w = 860, plate = 'MACHINE LEARNING MODELS', children, railY = -720}) => {
  const id = uid('wr');
  const tb = tones(NB.brass);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><FormGradient id={`${id}b`} t={tb} /></defs>
      <ContactShadow cx={0} cy={4} rx={200} ry={20} opacity={0.45} />
      <path d="M -150 0 L -110 -40 L 110 -40 L 150 0 Z" fill={`url(#${id}b)`} stroke={NB.ink} strokeWidth={6} />
      <rect x={-24} y={railY} width={48} height={-railY - 40} fill={`url(#${id}b)`} stroke={NB.ink} strokeWidth={6} />
      <path d={`M -10 ${railY + 20} L -10 -60`} stroke={NB.brassL} strokeWidth={5} opacity={0.7} />
      <rect x={-w / 2} y={railY - 24} width={w} height={34} rx={10} fill={`url(#${id}b)`} stroke={NB.ink} strokeWidth={6} />
      {[-w / 2 + 14, w / 2 - 14].map((ex) => <circle key={ex} cx={ex} cy={railY - 7} r={20} fill={tb.key} stroke={NB.ink} strokeWidth={5} />)}
      {plate && <g transform={`translate(0 ${railY - 76})`}>
        <rect x={-(monoW(plate, 20) + 40) / 2} y={-26} width={monoW(plate, 20) + 40} height={46} rx={8} fill={NB.roomL} stroke={NB.ink} strokeWidth={5} />
        <text x={0} y={6} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={20} letterSpacing={1.5} fill={NB.brassL}>{plate}</text>
      </g>}
      <g transform={`translate(0 ${railY})`}>{children}</g>
      <circle cx={0} cy={railY - 7} r={9 + Math.sin(f / 30)} fill={NB.brassL} stroke={NB.ink} strokeWidth={3} />
    </g>
  );
};
