import React from 'react';
import {z} from 'zod';
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  BurnWindowEngine, DripTorch, FireDangerWash, PunchedWindow,
  ENAMEL, STEELOX, EMBER, DUFF, SPRUCE, BURNABLE,
} from './lib/firecraft';
import {
  INK, tones, FormGradient, RimLight, ContactShadow, MotionBlur, DayGrade,
  AccentRegistry, useAccentExtent,
} from './lib/lighting';
import {Stage3D, Plane, Atmosphere} from './lib/stage3d';
import {vitals, entrance, EASE} from './lib/motion';
import {MaterialDefs, matFill} from './lib/materials';
import {Character} from './lib/Character';

const E_OUT = Easing.bezier(...EASE.enter);
const E_MOVE = Easing.bezier(...EASE.move);

// =============================================================================
// DISPATCH 2026-08-03 — "THE DAYS YOU ARE ALLOWED TO BURN"
//
// Board: out/dispatch/storyboard.json   Look: out/dispatch/art_direction.json
// Facts: out/dispatch/claims.json (the ONLY source of anything on screen)
//
// THESIS: Alaska has spent decades mapping the days you must not burn and nobody
// has mapped the days you can, so NSF paid UAF $1,588,147 on July 31 to have
// machine learning read decades of weather and find them.
//
// THE SHAPE GRAMMAR, and it is three things, not two (Gate 0D caught the collision):
//   FLOOD          prohibition. No stroke anywhere, no silhouette, runs past every
//                  boundary it is given. It cannot be reasoned with.
//   APERTURE       permission. Hard-edged, bevelled, ALWAYS PORTRAIT.
//   DASHED-UNFILLED a stated absence. ALWAYS WIDE LANDSCAPE, NO bevel, haze visibly
//                  drifting through its interior, so the liability void can never be
//                  mistaken for a burn window in silhouette.
//
// THE BINDING PALETTE RULE: #3fbf7f MEANS A DAY YOU MAY BURN AND NOTHING ELSE. It is
// first licensed at THE PUNCH, not at the ending, and the beam the window throws is
// bone, not green, so the accent lives on the aperture and the light stays uncoloured.
// Enforced at paint time by useAccentExtent (this run's craft advance), which requires
// the WHOLE window bbox inside a licensed rect rather than just its centre.
//
// LIGHT: smoke kills shadow, so this film runs almost no key, very high fill and a
// lifted floor. Exactly ONE hard-edged beam exists in 90 seconds and it is the light
// falling through the punched window. ContactShadow is retained as occlusion and is
// EXEMPT from the lifted floor, or nothing would sit on the ground.
//
// DARK ANCHOR OBLIGATION (Gate 0D): every scene carries >= 8% of frame at or below
// L25 (#1f3833), because a chalk-enamel hero on an amber haze field is a 7-point
// separation and would have no silhouette at feed size.
// =============================================================================

const SKY = '#e8c9a4';
const BONE = '#f2e8d8';
const SHADOW = '#7a5a48';
const BOLD = 'Arial Black, Arial, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

/** THE 1:1 SQUARE LINKEDIN CROP IS THE DELIVERABLE (corrected 2026-08-03 on owner
 *  evidence: LinkedIn routes anything TALLER THAN SQUARE into the swipe-only Video tab,
 *  and the old 4:5 1080x1350 cut is taller than square). A 1:1 centre crop off the
 *  1080x1920 master takes y 420 to 1500, which is a considerably tighter box than the
 *  4:5 285 to 1635 this film was originally laid out for, so every load-bearing element
 *  moves inside it. */
const SAFE_TOP = 420;
const SAFE_BOT = 1500;
/** the lowest a top card may be CENTRED and still sit wholly inside the 1:1 crop
 *  (420 + half of the tallest 132px card + margin) */
const CARD_TOP_Y = 530;
/** the caption reserve is the y-RANGE 1310 to 1442, wholly inside the square box */
const CAPTION_TOP = 1310;
// CAPTION FITTING. The bar is 940 wide and the text was set at a fixed 40px with no wrap
// and no fit, so a 50-character cue drew about 944px of glyphs and spilled past both ends
// of its own plate. Same class as the Card sub-line and the counter placard: a string whose
// width nobody measured. Measured ratio for this face at weight 800 is ~0.482 em per char.
const CAP_W = 884;
const CAP_K = 0.482;
/** one line if it fits at full size, otherwise two balanced lines broken at a space */
const capRows = (s: string): string[] => {
  if (s.length * CAP_K * 40 <= CAP_W) return [s];
  const w = s.split(' ');
  if (w.length < 2) return [s];
  let cut = 1, best = Infinity;
  for (let k = 1; k < w.length; k++) {
    const d = Math.abs(w.slice(0, k).join(' ').length - w.slice(k).join(' ').length);
    if (d < best) {best = d; cut = k;}
  }
  return [w.slice(0, cut).join(' '), w.slice(cut).join(' ')];
};
const CARD_BOT = CAPTION_TOP - 96;
const FPS = 30;

const FALLBACK_LINES = [
  0.0, 5.05, 8.35, 18.2, 25.87, 29.18, 32.91, 41.45, 46.06, 51.98,
  57.47, 62.08, 66.26, 72.62, 77.67, 85.34, 89.4,
];

type SceneProps = {from: number; total: number; L: (i: number) => number};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** A BURN WINDOW, form-shaded. The panel's sharpest craft note was that the green
 *  chips were single-tone fills inside an outline, which made the film's only accent
 *  and its entire data payload the flattest object on screen. A window is a cut
 *  APERTURE, so it gets a lit top-left bevel, a shaded lower-right return, a bone
 *  rim on the light side and an inner occlusion line. */
const WindowChip: React.FC<{
  x: number; y: number; w: number; h: number; fill: string; dashed?: boolean;
}> = ({x, y, w, h, fill, dashed = false}) => {
  const id = `wc${Math.round(x)}${Math.round(y)}${w}`;
  if (dashed) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={3} fill="none"
              stroke={BONE} strokeWidth={4} strokeDasharray="9 7" opacity={0.95} />
        <rect x={x} y={y} width={w} height={h} rx={3} fill="none"
              stroke={INK} strokeWidth={1.6} strokeDasharray="9 7" opacity={0.5} />
      </g>
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#7ee0ab" />
          <stop offset="52%" stopColor={fill} />
          <stop offset="100%" stopColor="#2a8f5e" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={`url(#${id})`} stroke={INK} strokeWidth={4} />
      {/* the lit bevel return, top and left */}
      <path d={`M${x + 3},${y + h - 3} L${x + 3},${y + 3} L${x + w - 3},${y + 3}`}
            fill="none" stroke="#c9f5dd" strokeWidth={3} opacity={0.75} />
      {/* the occluded return, bottom and right */}
      <path d={`M${x + 3},${y + h - 3} L${x + w - 3},${y + h - 3} L${x + w - 3},${y + 3}`}
            fill="none" stroke="#1d6b46" strokeWidth={3} opacity={0.8} />
    </g>
  );
};
/** deterministic hash; never Math.random (it re-rolls every frame) */
const hh = (i: number, s = 1) => {
  const x = Math.imul(i * 2654435761 + s * 40503, 2246822519);
  return ((x >>> 8) & 0xffff) / 0xffff;
};

// -----------------------------------------------------------------------------
// THE DARK ANCHOR. Every scene mounts one. This is the Gate 0D obligation made
// mechanical: a scene cannot forget it, because the scene list calls it.
// -----------------------------------------------------------------------------
const SpruceWall: React.FC<{f: number; y?: number; density?: number; opacity?: number}> = ({
  f, y = 1500, density = 17, opacity = 1,
}) => (
  <g opacity={opacity}>
    {/* the solid band IS most of the dark anchor; the trees only break its top edge */}
    <rect x={-40} y={y + 88} width={1160} height={940} fill={SPRUCE} />
    {Array.from({length: density}).map((_, i) => {
      const x = -60 + (i * 1220) / density + hh(i, 3) * 44;
      const hgt = 150 + hh(i, 7) * 170;
      const wdt = 40 + hh(i, 11) * 26;       // wide enough to OVERLAP its neighbour
      // each tree gets its own sway period and lean, so the row stops reading as a
      // stamped rhythm, and the skirts carry a lit side so it is not one flat tone
      const sway = Math.sin(f / (44 + hh(i, 23) * 38) + i * 1.7) * (2.2 + hh(i, 29) * 2.6);
      const lean = (hh(i, 31) - 0.5) * 7;
      const lit = '#2b4a42';
      return (
        <g key={i} transform={`translate(${x + sway},${y + 96}) rotate(${lean})`}>
          <path d={`M0,0 L${-wdt},0 L0,${-hgt * 0.52} L${wdt},0 Z`} fill={SPRUCE} />
          <path d={`M0,0 L${-wdt},0 L0,${-hgt * 0.52} Z`} fill={lit} opacity={0.55} />
          <path d={`M0,${-hgt * 0.30} L${-wdt * 0.76},${-hgt * 0.30} L0,${-hgt * 0.80} L${wdt * 0.76},${-hgt * 0.30} Z`} fill={SPRUCE} />
          <path d={`M0,${-hgt * 0.30} L${-wdt * 0.76},${-hgt * 0.30} L0,${-hgt * 0.80} Z`} fill={lit} opacity={0.5} />
          <path d={`M0,${-hgt * 0.60} L${-wdt * 0.5},${-hgt * 0.60} L0,${-hgt} L${wdt * 0.5},${-hgt * 0.60} Z`} fill={SPRUCE} />
          <path d={`M0,${-hgt * 0.60} L${-wdt * 0.5},${-hgt * 0.60} L0,${-hgt} Z`} fill={lit} opacity={0.45} />
        </g>
      );
    })}
  </g>
);

/** the FAR PLANE: a smoke-flattened ridge line, so no shot is a hero on empty paper */
const FarRidge: React.FC<{f: number; y?: number}> = ({f, y = 980}) => (
  <g>
    {[0, 1, 2].map((k) => {
      const off = k * 54;
      const op = 0.30 - k * 0.08;          // aerial perspective: further = flatter
      const pts = Array.from({length: 15}).map((_, i) => {
        const x = -60 + i * 82;
        const hgt = 60 + hh(i + k * 31, 19) * (120 - k * 26);
        return `${x},${y - off - hgt}`;
      }).join(' L');
      return (
        <path key={k} d={`M-60,${y + 200} L${pts} L1140,${y + 200} Z`}
              fill={SPRUCE} opacity={op} />
      );
    })}
  </g>
);

/** the amber haze volume, with internal density variation so it is never a flat backdrop */
const Haze: React.FC<{f: number; amount?: number; y?: number}> = ({f, amount = 1, y = 0}) => (
  <g opacity={amount}>
    {Array.from({length: 5}).map((_, i) => {
      const drift = ((f * (0.24 + i * 0.11)) % 1500) - 250;
      return (
        <ellipse key={i} cx={drift + hh(i, 11) * 500} cy={y + 240 + i * 300 + Math.sin(f / 77 + i) * 22}
                 rx={520 + hh(i, 5) * 260} ry={110 + hh(i, 9) * 70}
                 fill={SKY} opacity={0.2 + hh(i, 13) * 0.2} />
      );
    })}
  </g>
);

// -----------------------------------------------------------------------------
// ALASKA, simplified honestly. Real coastline character (the Aleutian tail, Cook
// Inlet, Norton Sound, the Southeast panhandle) without pretending to be a survey
// map. Shots 1 and 10 use the SAME path so the loopback is exact.
// -----------------------------------------------------------------------------
// A RECOGNISABLE ALASKA. Pass 1 drew a blob that read as a leaf, which is fatal for a
// film whose hook, signature shot and loopback are all this silhouette. The tells a
// viewer actually uses are, in order: the Seward Peninsula bump on the west, the
// Alaska Peninsula sweeping southwest into a dotted Aleutian arc, the Southeast
// panhandle running down-right, and the straight Canada border. All four are drawn.
const AK_PATH =
  'M250,180 L520,152 L832,150 ' +
  'L832,470 L880,560 L930,662 L986,762 L958,778 L898,690 L848,600 L820,540 ' +
  'L742,542 L700,588 L658,546 L620,602 L590,560 L540,602 L500,586 ' +
  'L452,642 L378,692 L298,732 L236,764 ' +
  'L250,700 L332,660 L402,620 L452,586 ' +
  'L400,560 L340,572 L300,520 L246,506 ' +
  'L216,456 L252,430 L214,400 L166,386 ' +
  'L150,330 L202,318 L246,342 L236,286 L262,250 Z';
/** the Aleutian arc, drawn as a real chain of separate islands running west */
const AK_TAIL = [
  {x: 208, y: 782, r: 15}, {x: 172, y: 800, r: 12}, {x: 138, y: 812, r: 10},
  {x: 106, y: 822, r: 9}, {x: 78, y: 830, r: 8}, {x: 52, y: 836, r: 7},
  {x: 30, y: 842, r: 6},
];

const AlaskaField: React.FC<{
  f: number; wash?: number; drain?: number; relief?: boolean;
}> = ({f, wash = 1, drain = 0, relief = true}) => (
  <g>
    <path d={AK_PATH} fill="#8a6a52" stroke={INK} strokeWidth={7} />
    {AK_TAIL.map((c, i) => (
      <ellipse key={i} cx={c.x} cy={c.y} rx={c.r * 1.5} ry={c.r} fill="#8a6a52" stroke={INK} strokeWidth={5} />
    ))}
    {relief && (
      <g opacity={0.5}>
        {Array.from({length: 34}).map((_, i) => {
          const x = 250 + hh(i, 21) * 560;
          const y = 340 + hh(i, 23) * 420;
          return <path key={i} d={`M${x},${y} l${16 + hh(i, 4) * 22},${-9 - hh(i, 6) * 9}`}
                       stroke={SPRUCE} strokeWidth={4} strokeLinecap="round" />;
        })}
      </g>
    )}
    {wash > 0.01 && (
      <FireDangerWash f={f} x={130} y={230} w={900} hgt={820}
                      amount={wash} bleed={150} drain={drain} seed={5} />
    )}
  </g>
);

/** the corner icon, PLANTED in shot 1 so the button has something to flip */
const CornerTool: React.FC<{f: number; flip?: number; x?: number; y?: number}> = ({
  f, flip = 0, x = 128, y = 1046,
}) => {
  const p = clamp01(flip);
  const rot = p * 180;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-62} y={-62} width={124} height={124} rx={12}
            fill="#2b3a34" stroke={INK} strokeWidth={5} opacity={0.9} />
      <g transform={`rotate(${rot})`} opacity={1}>
        {p < 0.5 ? (
          // PULASKI: the correct Alaska wildland suppression tool
          <g>
            <rect x={-6} y={-44} width={12} height={88} rx={4} fill="#8a6a3a" stroke={INK} strokeWidth={4} />
            <path d="M-34,-40 L6,-32 L6,-14 L-34,-22 Z" fill={STEELOX} stroke={INK} strokeWidth={4} />
            <path d="M34,-40 L6,-32 L6,-14 L34,-22 Z" fill={STEELOX} stroke={INK} strokeWidth={4} />
          </g>
        ) : (
          // DRIP TORCH: the tool that starts one on purpose
          <g transform="rotate(180)">
            <rect x={-20} y={-30} width={40} height={52} rx={7} fill={STEELOX} stroke={INK} strokeWidth={4} />
            <path d="M-20,10 L-46,22 L-56,38" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <circle cx={-56} cy={38} r={7} fill="#ffc24a" stroke={INK} strokeWidth={3} />
          </g>
        )}
      </g>
    </g>
  );
};

/** a counter that can be dead. The pair states the film's premise in one prop. */
const Counter: React.FC<{
  f: number; x: number; y: number; spin?: number; value?: string; dark?: boolean; label: string;
}> = ({f, x, y, spin = 0, value = '0', dark = false, label}) => {
  const id = `ctr${x}`;
  const body = tones(ENAMEL);
  const blur = spin > 0.4;
  return (
    <g transform={`translate(${x},${y})`}>
      <FormGradient id={id} t={body} softness={0.6} />
      <ContactShadow cx={0} cy={64} rx={72} ry={11} opacity={0.34} blur={10} />
      <rect x={-104} y={-56} width={208} height={116} rx={11}
            fill={`url(#${id})`} stroke={INK} strokeWidth={6} />
      <rect x={-52} y={-32} width={104} height={52} rx={5}
            fill={dark ? '#2b3a3d' : '#101a1c'} stroke={INK} strokeWidth={4} />
      <text x={0} y={8} textAnchor="middle"
            fill={dark ? '#5d6b6d' : '#ffd98a'}
            style={{font: `700 38px ${MONO}`, letterSpacing: 2}}>
        {blur ? '███' : value}
      </text>
      {/* AUTO-FIT, same rule the Card sub-lines got. The label used to overflow a 152px
          plate and render as "ST NOT BUR" in the film's first and last hero frames. */}
      <text x={0} y={48} textAnchor="middle" fill={INK}
            style={{font: `700 ${Math.max(14, Math.min(22, Math.floor(184 / (label.length * 0.62))))}px ${MONO}`,
                    letterSpacing: 0.5}}>{label}</text>
      {[-84, 84].map((sx) => (
        <circle key={sx} cx={sx} cy={-42} r={4} fill={body.shade} stroke={INK} strokeWidth={2} />
      ))}
    </g>
  );
};

/** boxed label, form-shaded by default (never a flat chip) */
const Card: React.FC<{x: number; y: number; text: string; sub?: string; w?: number; tint?: string}> = ({
  x, y, text, sub, w = 620, tint = BONE,
}) => {
  const id = `cd${x}${y}${text.length}`;
  const t = tones(tint);
  const h = sub ? 132 : 90;
  return (
    <g transform={`translate(${x},${y})`}>
      <FormGradient id={id} t={t} softness={0.5} />
      <ContactShadow cx={0} cy={h / 2 + 8} rx={w / 2 - 10} ry={10} opacity={0.3} blur={9} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={9}
            fill={`url(#${id})`} stroke={INK} strokeWidth={6} />
      <text x={0} y={sub ? -8 : 12} textAnchor="middle" fill={INK}
            style={{font: `900 ${Math.min(42, 1100 / Math.max(12, text.length))}px ${BOLD}`, letterSpacing: 1}}>
        {text}
      </text>
      {sub && (
        <text x={0} y={38} textAnchor="middle" fill={INK} opacity={0.82}
              style={{font: `700 ${Math.max(17, Math.min(27, Math.floor((w - 44) / (sub.length * 0.60))))}px ${MONO}`}}>
          {sub}
        </text>
      )}
    </g>
  );
};

/** every scene mounts this: haze volume + dark anchor + grade */
const World: React.FC<{f: number; children: React.ReactNode; anchorY?: number; hazeAmt?: number;
  interior?: boolean; shakeX?: number; shakeY?: number}> = ({
  f, children, anchorY = 1480, hazeAmt = 1, interior = false, shakeX = 0, shakeY = 0,
}) => (
  <>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #f0d8b6 0%, ${SKY} 46%, #d9b291 100%)`}} />
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%">
        <MaterialDefs />
        <g transform={`translate(${shakeX},${shakeY})`}>
        {!interior && <FarRidge f={f} y={Math.min(1040, anchorY - 380)} />}
        {!interior && <Haze f={f} amount={0.85 * hazeAmt} />}
        {!interior && <SpruceWall f={f} y={anchorY} />}
        {children}
        </g>
      </svg>
    </AbsoluteFill>
    <DayGrade f={f} sky={SKY} bounce={SHADOW} amount={0.55} floor={0.3} haze={0.42} sunX={540} sunY={120} sunIntensity={0.32} />
  </>
);

// =============================================================================
// S1 — THE PROHIBITION MAP. Lines 0 to 1.
// =============================================================================
const S1: React.FC<SceneProps> = ({from, L}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const t = g / FPS;
  const wash = interpolate(t, [L(0), L(0) + 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const spin = interpolate(t, [L(0) + 2.6, L(0) + 3.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const deadIn = interpolate(t, [L(1), L(1) + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <World f={g} anchorY={1560}>
      <g transform="translate(60,300) scale(0.86)">
        <AlaskaField f={g} wash={wash} />
      </g>
      <Counter f={g} x={250} y={1196} spin={spin} value="███" label="MUST NOT BURN" />
      <g opacity={deadIn}>
        <Counter f={g} x={640} y={1196} value="0" dark label="YOU CAN" />
      </g>
      <CornerTool f={g} />
      <Card x={540} y={CARD_TOP_Y} text="WHICH DAYS ARE YOU ALLOWED TO BURN" w={940} />
    </World>
  );
};

// =============================================================================
/** THE AWARD PACKET. S2 used to be three cards dropping onto empty ridge, which is
    a slide, not a shot, and it sat on the two worst seconds in the film for retention.
    The packet is the physical thing the whole story turns on, so the money and the
    recipient are printed ON it and the cards annotate an object instead of floating. */
const AwardPacket: React.FC<{land: number; write: number; stamp: number}> = ({land, write, stamp}) => {
  const W = 780, H = 470;
  const paper = tones('#efe9dc');
  const band = tones('#c9bfa4');
  const lift = (1 - land) * 560;      // flies up from under the frame
  const tip = (1 - land) * -9;        // and settles out of a tilt
  const fit = (txt: string, box: number, cap: number, k = 0.62) =>
    Math.max(15, Math.min(cap, Math.floor(box / Math.max(1, txt.length * k))));
  const NAME = 'UNIVERSITY OF ALASKA FAIRBANKS';
  const PI = 'Christine Waigl, principal investigator';
  return (
    <g transform={`translate(540,${880 + lift}) rotate(${tip})`} opacity={clamp01(land * 1.7)}>
      <FormGradient id="pkt" t={paper} softness={0.42} />
      <FormGradient id="pktb" t={band} softness={0.52} />
      <ContactShadow cx={8} cy={H / 2 + 18} rx={W / 2 - 26} ry={19} opacity={0.36} blur={20} />
      {/* the sheet underneath, so this reads as a PACKET and not a single page */}
      <rect x={-W / 2 + 15} y={-H / 2 + 13} width={W} height={H} rx={7}
            fill="#d5cdb9" stroke={INK} strokeWidth={5} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={8}
            fill="url(#pkt)" stroke={INK} strokeWidth={6} />
      {/* printed header block */}
      <rect x={-W / 2 + 9} y={-H / 2 + 9} width={W - 18} height={74} rx={5}
            fill="url(#pktb)" stroke={INK} strokeWidth={4.5} />
      <text x={0} y={-181} textAnchor="middle" fill={INK}
            style={{font: `700 31px ${MONO}`, letterSpacing: 2}}>NSF AWARD 2536745</text>
      {/* punched filing holes, so the paper has been handled */}
      {[-250, 0, 250].map((hx) => (
        <circle key={hx} cx={hx} cy={H / 2 - 26} r={9} fill="#b9b0a0" stroke={INK} strokeWidth={3} />
      ))}
      {/* abstract body: set text, not legible at feed size and not meant to be. Without
          it the lower half of the sheet is blank for the five seconds before the stamp,
          which is the same dead-frame failure one layer in. */}
      <g opacity={clamp01(write * 1.2) * 0.34}>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={-W / 2 + 34} y={16 + i * 22} height={9} rx={4.5} fill={INK}
                width={(W - 68) * [1, 0.94, 0.98, 0.55][i] * clamp01(write * 1.6 - i * 0.12)} />
        ))}
      </g>
      <text x={-W / 2 + 34} y={-84} fill={INK}
            style={{font: `900 ${fit(NAME, W - 68, 40)}px ${BOLD}`, letterSpacing: 0.5}}>{NAME}</text>
      <text x={-W / 2 + 34} y={-38} fill={INK} opacity={0.8}
            style={{font: `700 ${fit(PI, W - 68, 28, 0.6)}px ${MONO}`}}>{PI}</text>
      <line x1={-W / 2 + 34} y1={-8} x2={W / 2 - 34} y2={-8}
            stroke={INK} strokeWidth={3.5} opacity={0.4} />
      <g opacity={clamp01(stamp * 2)}>
        <line x1={-W / 2 + 34} y1={122} x2={W / 2 - 34} y2={122} stroke={INK} strokeWidth={3} opacity={0.34} />
        <text x={-W / 2 + 34} y={182} fill={INK}
              style={{font: `900 ${66 - (1 - clamp01(stamp)) * 22}px ${BOLD}`, letterSpacing: 1}}>$1,588,147</text>
        <text x={W / 2 - 34} y={178} textAnchor="end" fill={INK} opacity={0.78}
              style={{font: `700 23px ${MONO}`}}>July 31, 2026</text>
      </g>
      {/* the stamp lands LAST and presses: a rubber date stamp, in ink, not an accent */}
      {stamp > 0.02 && (
        <g transform={`translate(226,58) rotate(-13) scale(${0.7 + clamp01(stamp) * 0.3})`}
           opacity={clamp01(stamp * 1.4)}>
          <rect x={-118} y={-46} width={236} height={92} rx={8}
                fill="none" stroke={INK} strokeWidth={7} opacity={0.68} />
          <rect x={-106} y={-34} width={212} height={68} rx={5}
                fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />
          <text x={0} y={12} textAnchor="middle" fill={INK} opacity={0.72}
                style={{font: `900 34px ${BOLD}`, letterSpacing: 3}}>OBLIGATED</text>
        </g>
      )}
    </g>
  );
};

// =============================================================================
// S2 — THE AWARD LANDS. Line 2.
// =============================================================================
const S2: React.FC<SceneProps> = ({from, L}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const t = g / FPS;
  const {fps} = useVideoConfig();
  const drop = spring({frame: Math.max(0, g - L(2) * FPS), fps, config: {damping: 13, mass: 0.7}});
  // THE PACKET IS THE SHOT, so it flies in with the shot. Timed to +1.5 it left 8.7s
  // bare, which is the exact second the panel named, twice, in the retention window.
  const land = spring({frame: Math.max(0, g - (L(2) + 0.25) * FPS), fps, config: {damping: 14, mass: 0.8}});
  const write = interpolate(t, [L(2) + 1.1, L(2) + 3.2], [0, 1],
                            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_MOVE});
  const stamp = spring({frame: Math.max(0, g - (L(2) + 6.4) * FPS), fps, config: {damping: 9, mass: 0.5}});
  const shake = stamp > 0.1 && stamp < 0.6 ? (hh(Math.floor(g), 2) - 0.5) * 6 : 0;
  return (
    <World f={g} anchorY={1430}>
      <g transform={`translate(${shake},0)`}>
        <g transform={`translate(540,${500 + (1 - drop) * -420})`} opacity={drop}>
          <Card x={0} y={0} text="NATIONAL SCIENCE FOUNDATION" w={860} />
        </g>
        <AwardPacket land={land} write={write} stamp={stamp} />
        {/* THE OPEN LOOP: a blank date plate on the same stroke. It stays empty for 80 seconds. */}
        <g transform="translate(540,1230)" opacity={stamp}>
          <rect x={-120} y={-44} width={240} height={88} rx={8}
                fill="#d8cfbb" stroke={INK} strokeWidth={6} />
          <line x1={-90} y1={20} x2={90} y2={20} stroke={INK} strokeWidth={4} opacity={0.35} />
          <text x={0} y={-4} textAnchor="middle" fill={INK} opacity={0.42}
                style={{font: `700 26px ${MONO}`}}>ARRIVES</text>
        </g>
      </g>
      {/* the tool drops to the plate line so it stops sitting on the packet's left edge */}
      <CornerTool f={g} y={1230} />
    </World>
  );
};

// =============================================================================
// S3 — WHAT A PRESCRIBED BURN IS. Lines 3 to 4.
// =============================================================================
const S3: React.FC<SceneProps> = ({from, L}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const t = g / FPS;
  const tilt = interpolate(t, [L(3) + 0.2, L(3) + 1.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const crawl = interpolate(t, [L(3) + 2.6, L(4)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_MOVE});
  const patch = interpolate(t, [L(4), L(4) + 2.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // START THE LINE AT 380, NOT 120. The torch hangs to the LEFT of the flame, so a
  // flame at x=120 puts the only subject in the shot half off the plate, and the square
  // cut is what LinkedIn shows. A line already part-run also reads as work in progress.
  // The travel is shortened too, so the burn boss holding the torch stays on the plate
  // for the whole crawl instead of walking out of the square at the end of it.
  // travel shortened again: at 430 the boss walked off the right edge by the end of the
  // crawl and handed the shot back its empty frame at 23s.
  const flameX = 400 + crawl * 300;
  return (
    <World f={g} anchorY={1180}>
      {/* the duff, drawn as three shaded strata so fuel is a SUBSTANCE */}
      <g>
        <rect x={0} y={1180} width={1080} height={70} fill="#7a5a3c" stroke={INK} strokeWidth={5} />
        <rect x={0} y={1250} width={1080} height={60} fill={DUFF} />
        <rect x={0} y={1310} width={1080} height={80} fill="#4e3826" />
        {/* the fuel bar collapses where the line has already passed */}
        <rect x={0} y={1180} width={flameX} height={34} fill="#3a2b1e" opacity={0.85} />
      </g>
      {/* the flame line */}
      <g transform={`translate(${flameX},1176)`}>
        {Array.from({length: 9}).map((_, i) => {
          const fx = -60 + i * 15;
          const fh = 26 + Math.abs(Math.sin(g / 3.4 + i)) * 34;
          return <path key={i} d={`M${fx},0 q6,${-fh * 0.6} 0,${-fh} q-8,${fh * 0.55} 0,${fh} Z`}
                       fill={i % 2 ? '#ffb03a' : EMBER} stroke={INK} strokeWidth={2.4} />;
        })}
      </g>
      {/* AND SOMEONE IS HOLDING IT. Scaled up on its own the torch just hung in the sky
          with no operator and no ground contact, which trades one dead frame for a
          floating prop. A burn boss watching the line they just laid fills the band
          between the card and the fuel, and gives the tool a reason to be in the air. */}
      {/* the holding-line watcher, deep left. A burn is a crew job, and one figure alone
          left the other two thirds of the plate empty for the whole crawl. */}
      <ellipse cx={248} cy={1188} rx={54} ry={11} fill="#4a3323" opacity={0.45} />
      <g transform="translate(244,1180) scale(0.9)">
        <Character frame={g + 53} pose="arms-crossed" emotion="neutral"
                   outfit="flannel" headgear="beanie" facing={1} />
      </g>
      {/* the burn boss, at 1.12 not 1.5: at 1.5 the head crashed into the title card */}
      <ellipse cx={flameX + 136} cy={1190} rx={64} ry={13} fill="#4a3323" opacity={0.5} />
      <ellipse cx={flameX + 132} cy={1187} rx={38} ry={9} fill="#3a2718" opacity={0.55} />
      <g transform={`translate(${flameX + 130},1180) scale(1.12)`}>
        <Character frame={g} pose="stand" emotion="neutral"
                   outfit="vest" headgear="cap" facing={-1} />
      </g>
      <DripTorch x={flameX + 52} y={1032} f={g} scale={1.0} tilt={tilt} lit={tilt} groundY={148} />
      <Card x={540} y={CARD_TOP_Y} text="A FIRE YOU SET ON PURPOSE" w={760} />
      <g opacity={patch}>
        <Card x={540} y={CARD_BOT - 40} text="RARELY USED HERE" sub="prescribed burning remains underused in Alaska (NSF)" w={880} />
      </g>
      <CornerTool f={g} />
    </World>
  );
};

// =============================================================================
// S4 — THE EMPTY CRADLE. Line 5. The rehook.
// =============================================================================
const S4: React.FC<SceneProps> = ({from, L}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const t = g / FPS;
  const lamp = interpolate(t, [L(5) + 0.3, L(5) + 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <World f={g} anchorY={1520} hazeAmt={0.5}>
      {/* the rack IS the dark anchor: real cradles, two filled, the middle one empty */}
      <rect x={80} y={720} width={920} height={470} rx={16} fill="#16211d" stroke={INK} strokeWidth={8} />
      <rect x={80} y={1140} width={920} height={50} rx={6} fill="#0f1714" stroke={INK} strokeWidth={6} />
      {[0, 1, 2].map((i) => {
        const cx = 250 + i * 290;
        const empty = i === 1;
        return (
          <g key={i}>
            {/* the cradle bed, with locating pins and a wear witness mark */}
            <rect x={cx - 120} y={1010} width={240} height={44} rx={7}
                  fill={empty ? '#2a3a34' : '#1c2723'} stroke={INK} strokeWidth={5} />
            {[-78, 0, 78].map((px) => (
              <rect key={px} x={cx + px - 7} y={992} width={14} height={26} rx={3}
                    fill="#0d1512" stroke={INK} strokeWidth={3} />
            ))}
            {!empty && (
              <g opacity={0.55}>
                <rect x={cx - 96} y={880} width={192} height={116} rx={10}
                      fill={STEELOX} stroke={INK} strokeWidth={5} />
                {[0, 1, 2].map((k) => (
                  <rect key={k} x={cx - 72 + k * 46} y={906} width={30} height={22} rx={3}
                        fill="#2c3a3d" stroke={INK} strokeWidth={3} />
                ))}
                <circle cx={cx} cy={962} r={12} fill="#3d4b4d" stroke={INK} strokeWidth={4} />
              </g>
            )}
            {empty && (
              <text x={cx} y={952} textAnchor="middle" fill="#6d7f7a" opacity={0.9}
                    style={{font: `700 26px ${MONO}`, letterSpacing: 3}}>EMPTY</text>
            )}
          </g>
        );
      })}
      {/* the lamp: a cone with a real lit pool on the bed it finds */}
      <g opacity={lamp}>
        <defs>
          <linearGradient id="s4lamp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff6dd" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#fff6dd" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <path d="M512,700 L568,700 L700,1040 L380,1040 Z" fill="url(#s4lamp)" />
        <ellipse cx={540} cy={1032} rx={162} ry={26} fill="#ffeec9" opacity={0.34} />
        {Array.from({length: 20}).map((_, i) => (
          <circle key={i} cx={410 + hh(i, 31) * 260} cy={730 + hh(i, 37) * 290}
                  r={1.6 + hh(i, 41) * 2.6} fill="#fff6dd" opacity={0.45} />
        ))}
      </g>
      <Card x={540} y={CARD_BOT - 60} text="THE INSTRUMENT DOES NOT EXIST"
            sub="NSF: the state lacks weather forecasting tools" w={920} />
      <CornerTool f={g} />
    </World>
  );
};

// =============================================================================
// S5 — THE ENGINE, THE RE-CUT, THE PUNCH, THE PULLBACK. Lines 6 to 7.
// This scene carries the film's only hard light and its first licensed accent.
// =============================================================================
const S5: React.FC<SceneProps> = ({from, L}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const t = g / FPS;
  const {fps} = useVideoConfig();
  const accentBox = useAccentExtent();
  const build = interpolate(t, [L(6), L(6) + 1.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_OUT});
  const recut = interpolate(t, [L(6) + 3.0, L(6) + 4.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const feed = build * (0.35 + recut * 0.65);
  const rejects = Math.floor(interpolate(t, [L(6) + 5.0, L(7)], [0, 7], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  // THE PUNCH, REBUILT AS AN IMPACT. The panel's repeated finding was that this read
  // as a dolly: the stroke existed in the timeline and had no amplitude on screen.
  // Now it is a full anticipation / drive / contact / overshoot / settle, the head is
  // large enough to see, the frame shakes on contact, a slug ejects, and the window is
  // cut INTO the stock rather than floating above the machine.
  const pf = (t - L(7)) * FPS;
  const RAISE = 10, HOLD = 6, DRIVE = 4, SETTLE = 12;   // frames
  const CONTACT = RAISE + HOLD + DRIVE;                 // 20f = 0.67s in
  const punch =
    pf < 0 ? 0
    : pf < RAISE ? -0.30 * (pf / RAISE)                       // rear back, loading
    : pf < RAISE + HOLD ? -0.30                               // the held beat before it
    : pf < CONTACT ? -0.30 + 1.30 * ((pf - RAISE - HOLD) / DRIVE)   // DRIVE
    : pf < CONTACT + SETTLE ? 1.0 - 0.22 * Math.sin(((pf - CONTACT) / SETTLE) * Math.PI)
    : 1.0;
  // the head is moving fastest through the drive, which is what earns the blur
  const punchVel = pf >= RAISE + HOLD && pf < CONTACT ? 1 : 0;
  const windows = pf >= CONTACT ? 1 : 0;
  // contact flash + shake, spent over 6 frames only so it reads as a hit not a wobble
  const hit = pf >= CONTACT && pf < CONTACT + 6 ? 1 - (pf - CONTACT) / 6 : 0;
  const shakeX = hit > 0 ? (hh(Math.floor(g), 91) - 0.5) * 14 * hit : 0;
  const shakeY = hit > 0 ? (hh(Math.floor(g), 97) - 0.5) * 10 * hit : 0;
  // the waste slug curls away and drops out of frame after contact
  const slug = clamp01((pf - CONTACT) / 22);
  const beam = interpolate(t, [L(7) + 0.6, L(7) + 1.0, L(7) + 2.2], [0, 1, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pull = interpolate(t, [L(7) + 2.6, L(7) + 4.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_MOVE});
  const sc = 1 - pull * 0.42;
  return (
    <World f={g} anchorY={1560} hazeAmt={0.75} shakeX={shakeX} shakeY={shakeY}>
      <g>
      <g transform={`translate(540,${900 - pull * 40}) scale(${sc}) translate(-540,-900)`}>
        <g opacity={build}>
          <BurnWindowEngine x={520} y={900} f={g} scale={1.42}
            emotion={windows ? 'found' : recut < 1 ? 'straining' : 'reading'}
            feed={feed} punch={Math.max(0, punch)} windows={windows ? 1 : 0}
            lamp={windows ? 1 : 0} groundY={150}
            windowFill={accentBox(BURNABLE, 660, 900, 40, 44)} />
        </g>
        {/* THE PUNCH HEAD, big enough to read, driving down onto the stock */}
        <g opacity={build} transform={`translate(838,${596 + punch * 300})`}>
          <MotionBlur vy={punchVel * 70} gain={1.2}>
            <rect x={-46} y={-150} width={92} height={150} rx={6}
                  fill={STEELOX} stroke={INK} strokeWidth={6} />
            {/* the compression spring visibly loads as the head rears back */}
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={-34} y1={-140 + i * (30 + punch * -14)}
                    x2={34} y2={-126 + i * (30 + punch * -14)}
                    stroke={INK} strokeWidth={5} opacity={0.55} />
            ))}
            {/* hardened cutting shoe, reusing CoringTube's geometry idea */}
            <path d="M-30,0 L30,0 L22,30 L-22,30 Z" fill="#b9c6c8" stroke={INK} strokeWidth={6} />
            <line x1={-22} y1={30} x2={22} y2={30} stroke="#eef4f4" strokeWidth={4} />
          </MotionBlur>
        </g>
        {/* THE CONTACT FLASH */}
        {hit > 0 && (
          <g opacity={hit}>
            <circle cx={838} cy={926} r={40 + (1 - hit) * 90} fill="none"
                    stroke="#fff6dd" strokeWidth={9 * hit} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line key={a} x1={838 + Math.cos(a * Math.PI / 180) * 48}
                    y1={926 + Math.sin(a * Math.PI / 180) * 48}
                    x2={838 + Math.cos(a * Math.PI / 180) * (96 + (1 - hit) * 60)}
                    y2={926 + Math.sin(a * Math.PI / 180) * (96 + (1 - hit) * 60)}
                    stroke="#fff6dd" strokeWidth={7 * hit} strokeLinecap="round" />
            ))}
          </g>
        )}
        {/* THE WASTE SLUG, curling away and dropping out of frame */}
        {slug > 0.01 && slug < 1 && (
          <g transform={`translate(${838 + slug * 130},${944 + slug * slug * 420}) rotate(${slug * 340})`}
             opacity={1 - slug * 0.5}>
            <rect x={-14} y={-16} width={28} height={32} rx={3}
                  fill="#c9d6d8" stroke={INK} strokeWidth={4} />
          </g>
        )}
        {/* the reject pile: days the machine threw away */}
        {Array.from({length: Math.max(0, rejects)}).map((_, i) => (
          <rect key={i} x={250 + (i % 4) * 26} y={1104 - Math.floor(i / 4) * 14}
                width={22} height={12} rx={2} fill="#9aa5a0" stroke={INK} strokeWidth={2.4}
                transform={`rotate(${-14 + hh(i, 17) * 28} ${260 + (i % 4) * 26} ${1110})`} />
        ))}
      </g>
      </g>
      {/* the punched window, staged LARGE, with the film's one hard beam */}
      {windows > 0 && (
        <g opacity={interpolate(pull, [0, 0.6], [1, 0], {extrapolateRight: 'clamp'})}
           transform={`translate(${shakeX},${shakeY}) translate(838,926) scale(${
             1 + 0.34 * Math.max(0, 1 - (pf - CONTACT) / 9)})`}>
          <PunchedWindow x={0} y={0} f={g} w={132} hgt={168} beam={beam}
                         fill={accentBox(BURNABLE, 772, 842, 132, 168)} />
        </g>
      )}
      <Card x={540} y={CARD_TOP_Y}
            text={recut < 1 ? 'RE-CUT FOR ALASKA' : windows ? 'ONE SAFE DAY' : 'READING DECADES OF WEATHER'}
            sub={recut < 1 ? 'Prescribed Fire and Smoke Planner, re-cut to the Canadian FWI'
                           : windows ? 'a day the model says would have been safe'
                           : 'statistical and machine-learning techniques (NSF)'} w={960} />
      <CornerTool f={g} />
    </World>
  );
};

// =============================================================================
// S6 — THE SHEET HANDED ACROSS, AND THE GROUND UNDER FOUR AUTHORITIES. Lines 8 to 9.
// =============================================================================
const S6: React.FC<SceneProps> = ({from, L}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const t = g / FPS;
  const accentBox = useAccentExtent();
  const push = interpolate(t, [L(8) + 0.2, L(8) + 1.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_OUT});
  const fields = interpolate(t, [L(9), L(9) + 1.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_OUT});
  const HATCH = [
    {a: 20, c: '#b8894a'}, {a: 70, c: '#7d8f92'}, {a: 115, c: '#8a6a52'}, {a: 160, c: '#5f7a6a'},
  ];
  return (
    <World f={g} anchorY={1600} hazeAmt={0.6} interior>
      {/* the plank table IS the dark anchor */}
      <rect x={0} y={620} width={1080} height={900} fill="#3b2f24" stroke={INK} strokeWidth={7} />
      {Array.from({length: 6}).map((_, i) => (
        <line key={i} x1={0} y1={680 + i * 140} x2={1080} y2={680 + i * 140}
              stroke="#2a2018" strokeWidth={5} opacity={0.7} />
      ))}
      {/* the punched sheet, pushed across */}
      <g transform={`translate(${250 + push * 290},960) scale(1.34) rotate(${-4 + push * 3})`}>
        <rect x={-160} y={-110} width={320} height={220} rx={6}
              fill="#efeade" stroke={INK} strokeWidth={6} />
        {[0, 1, 2].map((i) => (
          <WindowChip key={i} x={-110 + i * 78} y={-30} w={40} h={54}
                      fill={accentBox(BURNABLE, 100 + push * 300 + i * 78, 870, 40, 54)} />
        ))}
        <text x={0} y={-58} textAnchor="middle" fill={INK}
              style={{font: `700 26px ${MONO}`}}>SAFE DAYS</text>
      </g>
      {/* four hatched jurisdictions colliding over one piece of ground */}
      <g opacity={fields}>
        {HATCH.map((h, i) => (
          <g key={i} transform={`translate(540,1220) rotate(${h.a})`} opacity={0.5}>
            <rect x={-320 + (1 - fields) * 260} y={-90} width={640} height={180}
                  fill={h.c} opacity={0.45} stroke={INK} strokeWidth={3} />
          </g>
        ))}
        <Card x={540} y={CARD_BOT - 20} text="MUNICIPAL / FEDERAL / TRIBAL / NON-PROFIT" w={980} />
      </g>
      <Card x={540} y={CARD_TOP_Y} text="A COUNT YOU CAN HAND OVER" w={780} />
    </World>
  );
};

// =============================================================================
// S7 — FOUR HANDS, AND THE PLATES TURN TO FACE. Lines 10 to 11. Close and low.
// =============================================================================
const S7: React.FC<SceneProps> = ({from, L}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const t = g / FPS;
  const accentBox = useAccentExtent();
  const hands = interpolate(t, [L(10), L(10) + 1.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_OUT});
  const turn = interpolate(t, [L(11), L(11) + 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_OUT});
  const SIDES = [
    {x: 190, y: 760, r: 0}, {x: 890, y: 760, r: 180},
    {x: 190, y: 1180, r: 0}, {x: 890, y: 1180, r: 180},
  ];
  return (
    <World f={g} anchorY={1620} hazeAmt={0.45} interior>
      <rect x={0} y={560} width={1080} height={1060} fill="#3b2f24" stroke={INK} strokeWidth={7} />
      {/* the sheet, close, lit from beneath through its own holes */}
      <g transform="translate(540,960)">
        <rect x={-250} y={-170} width={500} height={340} rx={8}
              fill="#efeade" stroke={INK} strokeWidth={7} />
        {[0, 1, 2].map((i) => (
          <WindowChip key={i} x={-170 + i * 120} y={-50} w={62} h={86}
                      fill={accentBox(BURNABLE, 370 + i * 120, 910, 62, 86)} />
        ))}
      </g>
      {/* four hands stopping short, then landing */}
      {SIDES.map((s, i) => {
        const d = (1 - hands) * 200;
        const land = turn * 34;
        return (
          <g key={i} transform={`translate(${s.x + (s.r ? d : -d)},${s.y + land}) rotate(${s.r})`} opacity={hands}>
            {/* a HAND, with fingers and a cuff. The panel called the old shape an
                unshaded flat blob sitting next to fully finished assets, and it was. */}
            <path d="M-10,-30 q46,-14 70,8 q18,16 8,44 q-14,32 -52,28 q-32,-6 -34,-38 Z"
                  fill="#c8b48a" stroke={INK} strokeWidth={5} />
            {/* form shading: lit knuckle side, occluded palm side */}
            <path d="M-10,-30 q46,-14 70,8 q10,9 10,22 q-30,-16 -80,-8 Z"
                  fill="#dcc9a2" opacity={0.85} />
            <path d="M-30,20 q34,20 66,10 q-14,26 -50,22 q-24,-5 -30,-24 Z"
                  fill="#a68d63" opacity={0.7} />
            {/* four finger creases so it reads as a hand at feed size */}
            {[0, 1, 2, 3].map((k) => (
              <path key={k} d={`M${6 + k * 15},${-24 + k * 3} q7,20 2,40`}
                    fill="none" stroke={INK} strokeWidth={2.6} opacity={0.55} />
            ))}
            <rect x={-40} y={14} width={44} height={34} rx={7} fill="#9a8560" stroke={INK} strokeWidth={4.5} />
            <line x1={-36} y1={22} x2={0} y2={22} stroke={INK} strokeWidth={2.2} opacity={0.5} />
          </g>
        );
      })}
      {/* the four plates rotating to face one another */}
      {SIDES.map((s, i) => (
        <g key={`p${i}`} transform={`translate(${s.x},${s.y - 130}) rotate(${(1 - turn) * (i % 2 ? 40 : -40)})`}>
          <rect x={-84} y={-26} width={168} height={52} rx={6}
                fill={ENAMEL} stroke={INK} strokeWidth={5} />
          <text x={0} y={8} textAnchor="middle" fill={INK} style={{font: `700 23px ${MONO}`}}>
            {['MUNICIPAL', 'FEDERAL', 'TRIBAL', 'NON-PROFIT'][i]}
          </text>
        </g>
      ))}
      <Card x={540} y={CARD_BOT - 20} text="THE GRANT PAYS FOR THIS PART TOO"
            sub="+ curriculum for a four-year wildland fire program" w={980} />
    </World>
  );
};

// =============================================================================
// S8 — THE CLOCK AND THE GAP. Lines 12 to 13.
// =============================================================================
const S8: React.FC<SceneProps> = ({from, L}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const t = g / FPS;
  const rule = interpolate(t, [L(12), L(12) + 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_OUT});
  const seasons = interpolate(t, [L(12) + 2.2, L(13)], [0, 4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const arrows = interpolate(t, [L(13) + 0.2, L(13) + 1.8], [0, 3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dis = interpolate(t, [L(13) + 2.6, L(13) + 3.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <World f={g} anchorY={1600} hazeAmt={0.5}>
      <rect x={0} y={520} width={1080} height={1100} fill="#22302c" stroke={INK} strokeWidth={6} />
      {/* the machined rule */}
      <g opacity={rule}>
        <rect x={90} y={700} width={900 * rule} height={22} rx={4} fill={STEELOX} stroke={INK} strokeWidth={5} />
        {[0, 1, 2, 3, 4].map((i) => {
          const last = i === 4;
          return (
          <g key={i} opacity={rule * 5 > i ? 1 : 0}>
            <line x1={110 + i * 218} y1={700} x2={110 + i * 218} y2={last ? 652 : 664}
                  stroke={last ? '#ffd98a' : INK} strokeWidth={last ? 9 : 6} />
            <text x={110 + i * 218} y={last ? 634 : 646} textAnchor="middle"
                  fill={last ? '#ffd98a' : BONE}
                  style={{font: `${last ? 900 : 700} ${last ? 30 : 24}px ${MONO}`}}>{2026 + i}</text>
          </g>);
        })}
      </g>
      {/* four stands burning and regrowing, untreated */}
      {[0, 1, 2, 3].map((i) => {
        const p = clamp01(seasons - i);
        const burn = p < 0.5 ? p * 2 : 0;
        const grow = p > 0.5 ? (p - 0.5) * 2 : 0;
        return (
          <g key={i} transform={`translate(${190 + i * 218},900)`}>
            <path d={`M0,${60} L-42,${60} L0,${60 - 110 * (1 - burn * 0.8 + grow * 0.5)} L42,${60} Z`}
                  fill={SPRUCE} stroke={INK} strokeWidth={4} />
            {burn > 0.05 && burn < 0.95 && (
              <path d="M-16,50 q10,-34 0,-56 q-14,28 0,56 Z" fill={EMBER} stroke={INK} strokeWidth={3} />
            )}
          </g>
        );
      })}
      {/* three boxes fill, the fourth is a WIDE LANDSCAPE dashed void with no bevel */}
      {[0, 1, 2].map((i) => {
        const on = arrows > i;
        return (
          <g key={i} transform={`translate(${200 + i * 200},1136)`}>
            <rect x={-78} y={-52} width={156} height={104} rx={7}
                  fill={on ? ENAMEL : '#9aa79f'} stroke={INK} strokeWidth={6} />
            {on && <path d="M-140,0 L-86,0 M-96,-12 L-84,0 L-96,12" stroke={INK} strokeWidth={7} fill="none" />}
            <text x={0} y={8} textAnchor="middle" fill={INK} opacity={on ? 1 : 0.62}
                  style={{font: `700 ${['FORECAST', 'PARTNERS', 'CURRICULUM'][i].length > 9 ? 17 : 21}px ${MONO}`}}>
              {['FORECAST', 'PARTNERS', 'CURRICULUM'][i]}
            </text>
          </g>
        );
      })}
      <g transform="translate(800,1136)">
        <rect x={-150} y={-42} width={300} height={84} rx={0}
              fill="none" stroke={INK} strokeWidth={6} strokeDasharray="18 14" />
        <text x={0} y={8} textAnchor="middle" fill={BONE} opacity={0.85}
              style={{font: `700 24px ${MONO}`}}>LIABILITY</text>
        {/* the arrow that reaches the contour and comes apart */}
        <g opacity={1 - dis}>
          <path d={`M${-320 + dis * 140},0 L${-166},0`} stroke={INK} strokeWidth={7} fill="none" />
        </g>
        {dis > 0.2 && [0, 1, 2].map((i) => (
          <rect key={i} x={-210 + i * 22} y={-6 + dis * (30 + i * 18)} width={16} height={9}
                fill={INK} opacity={1 - dis} transform={`rotate(${dis * 60 * (i + 1)} ${-202 + i * 22} 0)`} />
        ))}
      </g>
      <Card x={540} y={CARD_TOP_Y} text="THE AWARD RUNS THROUGH 2030"
            sub="Sept 1, 2026 to Aug 31, 2030" w={980} />
      <CornerTool f={g} />
    </World>
  );
};

// =============================================================================
// S9 — THE CREW THAT CAN'T GO. Line 14.
// =============================================================================
const S9: React.FC<SceneProps> = ({from, L}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const t = g / FPS;
  const drop = interpolate(t, [L(14) + 0.4, L(14) + 1.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_OUT});
  const sheet = interpolate(t, [L(14) + 3.6, L(14) + 5.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <World f={g} anchorY={1120}>
      {/* the crew, at ~20% of frame height so they read as PEOPLE not specks */}
      {[
        {x: 320, sc: 1.42, pose: 'stand' as const, emo: 'worried' as const, out: 'vest' as const, hat: 'cap' as const, face: 1 as const},
        {x: 540, sc: 1.58, pose: 'arms-crossed' as const, emo: 'neutral' as const, out: 'worker' as const, hat: 'trapper' as const, face: -1 as const},
        {x: 748, sc: 1.34, pose: 'stand' as const, emo: 'worried' as const, out: 'flannel' as const, hat: 'beanie' as const, face: 1 as const},
      ].map((c, i) => (
        <g key={i}>
          {/* the boots sit on the ground: a real occlusion ellipse, exempt from the lifted floor */}
          {/* boots ON the ground. The panel called this a parity failure and it was:
              the bench forty seconds earlier gets a shadow and the people did not. */}
          <ellipse cx={c.x + 5} cy={1190} rx={58 * c.sc} ry={14} fill="#4a3323" opacity={0.5} />
          <ellipse cx={c.x + 3} cy={1187} rx={34 * c.sc} ry={9} fill="#3a2718" opacity={0.55} />
          <g transform={`translate(${c.x},1180) scale(${c.sc})`}>
            <Character frame={g + i * 37} pose={c.pose} emotion={c.emo}
                       outfit={c.out} headgear={c.hat} facing={c.face} />
          </g>
        </g>
      ))}
      {/* the unlit torch swings down and knocks the boot */}
      <g transform={`translate(300,1290) rotate(${drop * 26})`}>
        <DripTorch x={0} y={0} f={g} scale={0.7} tilt={0} lit={0} withHand={false} groundY={90} />
      </g>
      {/* the blank day sheet lifts, holds, and lowers */}
      <g transform={`translate(760,${1120 + Math.max(0, sheet - 0.6) * 240})`}
         opacity={interpolate(sheet, [0, 0.15, 0.85, 1], [0, 1, 1, 0.6])}>
        <rect x={-92} y={-64} width={184} height={128} rx={6}
              fill="#efeade" stroke={INK} strokeWidth={6} />
        <text x={0} y={6} textAnchor="middle" fill={INK} opacity={0.4}
              style={{font: `700 24px ${MONO}`}}>NO DAY</text>
      </g>
      {/* the engine, a pale speck deep in the haze */}
      <g opacity={0.42} transform="translate(880,900) scale(0.2)">
        <BurnWindowEngine x={0} y={0} f={g} feed={1} groundY={120} />
      </g>
      <Card x={540} y={CARD_TOP_Y} text="A CREW WITH NO DAY TO GO ON" w={840} />
      <CornerTool f={g} />
    </World>
  );
};

// =============================================================================
// S10 — THE INVERTED MAP. Lines 15 to 16. The signature shot and the button.
// The windows are DASHED first and HARDEN, so the film never claims a count that
// does not exist yet (claims.json: on-screen day counts are illustrative).
// =============================================================================
const S10: React.FC<SceneProps> = ({from, L, total}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const t = g / FPS;
  const accentBox = useAccentExtent();
  const drain = interpolate(t, [L(15) + 0.2, L(15) + 2.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_MOVE});
  const open = interpolate(t, [L(16) + 0.1, L(16) + 1.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // HARDEN EARLY. This used to run L(16)+1.2 to +2.4 (78.9 to 80.1s), so for most of
  // the closing shot the windows were still dashed bone outlines over a dark patch on a
  // brown map, which is why two judges independently read the payoff as "tan hatching"
  // and as losing luminance on the good news. The dashed state is a 0.5s grace note, not
  // the state the shot lives in.
  const harden = interpolate(t, [L(16) + 0.35, L(16) + 0.95], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flip = interpolate(t, [L(16) + 2.6, L(16) + 3.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: E_OUT});
  // 11 windows, each >= 44px on its short side, one hero at 2x near centre
  // Bigger, fewer, and clustered in the Interior so they read as a place rather than
  // as scatter. The panel called these the faintest element in their own hero frame.
  const WINS = Array.from({length: 9}).map((_, i) => ({
    x: 330 + hh(i, 51) * 400, y: 400 + hh(i, 57) * 300,
    hero: i === 4,
  }));
  return (
    <World f={g} anchorY={1560}>
      <g transform="translate(60,300) scale(0.86)">
        <AlaskaField f={g} wash={(1 - drain) * (1 - harden * 0.9)} drain={drain} />
      </g>
      {/* the windows open, dashed first, then harden */}
      <g transform="translate(60,300) scale(0.86)">
        {WINS.map((w, i) => {
          const p = clamp01(open * 11 - i);
          if (p <= 0) return null;
          const ww = w.hero ? 128 : 68;
          const wh = w.hero ? 162 : 86;
          // each window POPS with a spring overshoot instead of fading up
          const pop = 1 + 0.42 * Math.max(0, 1 - p * 4);
          return (
            <g key={i} opacity={p}
               transform={`translate(${w.x},${w.y}) scale(${pop}) translate(${-w.x},${-w.y})`}>
              {harden > 0.5 && (
                <rect x={w.x - ww / 2 - 7} y={w.y - wh / 2 - 7} width={ww + 14} height={wh + 14}
                      rx={4} fill="#1a120c" opacity={0.7} />
              )}
              <WindowChip x={w.x - ww / 2} y={w.y - wh / 2} w={ww} h={wh}
                          dashed={harden <= 0.5}
                          fill={harden > 0.5 ? accentBox(BURNABLE, w.x - ww / 2, w.y - wh / 2, ww, wh) : BURNABLE} />
              {w.hero && harden > 0.6 && (
                <text x={w.x} y={w.y + wh / 2 + 30} textAnchor="middle" fill={INK}
                      style={{font: `700 26px ${MONO}`}}>2030</text>
              )}
            </g>
          );
        })}
      </g>
      {/* the dead counter finally lights, and shows a DASH, not a number */}
      <g opacity={harden}>
        <Counter f={g} x={640} y={1196} value="—" label="YOU CAN" />
      </g>
      <Counter f={g} x={250} y={1196} value="███" label="MUST NOT BURN" />
      <CornerTool f={g} flip={flip} />
      <Card x={540} y={CARD_TOP_Y}
            text={open > 0.4 ? 'THE DAYS YOU ARE ALLOWED' : 'DAYS IN DANGER, MAPPED FOR DECADES'} w={940} />
    </World>
  );
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10];

export const ep0803Schema = z.object({
  captions: z.array(z.object({start: z.number(), end: z.number(), text: z.string()})).optional(),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  lines: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.any()).optional(),
});

export const Ep0803: React.FC<z.infer<typeof ep0803Schema>> = ({
  captions = [], scenes, total, lines,
}) => {
  const {width} = useVideoConfig();
  const f = useCurrentFrame();
  const lineTable = lines && lines.length >= 17 ? lines : FALLBACK_LINES;
  const L = React.useCallback((i: number) => lineTable[Math.min(i, lineTable.length - 1)], [lineTable]);
  const bounds = scenes && scenes.length === SCENES.length
    ? scenes
    : SCENES.map((_, i) => ({from: Math.round(FALLBACK_LINES[[0, 2, 3, 5, 6, 8, 10, 12, 14, 15][i]] * FPS), dur: 300}));
  const totalF = total ?? 2800;

  // THE ACCENT LICENCE. Nothing before the punch may paint the reserved green.
  const licences = React.useMemo(() => [{
    hue: BURNABLE,
    means: 'a day you may burn',
    rects: [
      {x: 700, y: 760, w: 340, h: 360},    // the punched window, cut into the stock, S5
      {x: 560, y: 840, w: 420, h: 180},    // the engine's outbound stock, S5
      {x: 60, y: 820, w: 900, h: 180},     // the sheet on the table, S6
      {x: 300, y: 860, w: 480, h: 200},    // the sheet close, S7
      {x: 280, y: 320, w: 640, h: 520},    // the window scatter on the map, S10
    ],
  }], []);

  return (
    <AccentRegistry accents={licences}>
      <AbsoluteFill style={{background: SKY}}>
        {SCENES.map((S, i) => (
          <Sequence key={i} from={bounds[i].from} durationInFrames={Math.max(1, bounds[i].dur)}>
            <S from={bounds[i].from} total={totalF} L={L} />
          </Sequence>
        ))}
        {/* OPEN CAPTIONS, from the forced alignment. Most plays are muted. */}
        <AbsoluteFill>
          <svg viewBox="0 0 1080 1920" width="100%" height="100%">
            {captions
              .filter((c) => f >= c.start * FPS && f <= c.end * FPS)
              .map((c, i) => {
                const rows = capRows(c.text);
                const longest = rows.reduce((m, r) => Math.max(m, r.length), 0);
                const size = Math.max(24, Math.min(40, Math.floor(CAP_W / (longest * CAP_K))));
                return (
                <g key={i}>
                  <rect x={70} y={CAPTION_TOP} width={940} height={132} rx={12}
                        fill="#14201c" opacity={0.82} />
                  {rows.map((r, k) => (
                    <text key={k} x={540}
                          y={CAPTION_TOP + (rows.length === 1 ? 80 : 56 + k * 48)}
                          textAnchor="middle" fill="#f6f1e4"
                          style={{font: `800 ${size}px ${BOLD}`, letterSpacing: 0.5}}>
                      {r}
                    </text>
                  ))}
                </g>
                );
              })}
          </svg>
        </AbsoluteFill>
      </AbsoluteFill>
    </AccentRegistry>
  );
};
