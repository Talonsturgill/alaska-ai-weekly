import React from 'react';
import {ContactShadow} from './lighting';
import {IdleFigure, FigureFinish} from './figureidle';

// =============================================================================
// lib/people.tsx: the faceless institutional figure, promoted from the episodes (machine pass 2026-11-21).
//
// Ep1119 drew a local `Suit` for its airline and FAA people and Ep1121 copied it for a court-appointed
// ombudsman and a company lawyer. The copy carried its necktie default, so on 11-21 a named woman read as
// a man to the editor until the run bolted `tie`, `longHair` and `reachL` onto its local copy (queue
// suit-rig-necktie-default). A rig that two films in a row hand-copied belongs on the shelf, and the
// shelf version defaults to NEUTRAL: no tie, short hair. Ask for a tie when the person wears one.
//
// It is the same drawing as the 11-21 rig (which shipped), already lit by FigureFinish and performing on
// its beats through IdleFigure (both required by scripts/figure_rig_check.py). (x, y) is the middle of the
// foot line in the parent's px, `s` scales a 300 px tall figure. Labels go AFTER the component, never
// inside it (FigureFinish clips them; figure_rig_check fails it), so there is no tag prop here: draw the
// boxed name tag at y - 300 * s - 30 * s in the episode's own label style.
//
// Keep the feet above the caption card: y + the World push must clear CAPTION_TOP, which
// caption_band_check reports as FEET (2026-11-21, four courtroom shots stood figures behind the card).
// Machine pass 2026-11-22 (all three seats on 11-22: "faceless human heads flat discs with no
// key/fill/rim"; figures plainer than props on every film since 11-06): the head is modelled, a far-side
// terminator crescent, a near-cheek key highlight, an ear and a neck with the jaw's cast shadow, and it
// carries a face by default, brows, eyes that blink every 3.5 s on the seed's phase, a nose and a mouth.
// face={false} keeps the modelled head without features.
// Look-dev: `SuitLook` (scripts/probe_frames.sh SuitLook 0,0.5,1.0,1.5,2.0 or a remotion still).
// Machine pass 2026-11-26 (queue held-figure-no-idle, repeat 2; Ep1126 seats 1 and 3: Kelly Isaacs "holds one
// outstretched pose for all 8 filmstrip frames" at 75.1 s and 79.2 s). The cue performance runs about 1.7 s
// around each cue, and between cues a held reach was pinned to one point (pose.armR moved it a fraction of a
// pixel a frame), so a long gesture was a statue in every strip that missed a cue. holdLife() gives the held
// figure a continuous life between cues: a reaching hand works (it talks, on two incommensurate periods, and
// the elbow follows), the torso sways and the head nods. All of it scales by gain, so gain={0} is now a true
// statue (the torso bob used to ignore it). scripts/suit_hold_check.py measures it on SuitHoldLook.
// =============================================================================

const INK = '#1B1A22';

export interface SuitProps {
  f: number;
  /** foot line centre, parent px */
  x: number;
  y: number;
  /** scale of a 300 px figure */
  s?: number;
  seed?: number;
  /** frames the figure performs on, usually p.b(id) for its beats */
  cues?: number[];
  coat?: string;
  trousers?: string;
  shirt?: string;
  skin?: string;
  hair?: string;
  /** a necktie in this colour; default none (a neutral figure). true draws the 11-19 brick tie */
  tie?: boolean | string;
  /** shoulder-length hair framing the face */
  longHair?: boolean;
  /** 0..1 the right (key side) hand reaches up and out */
  reach?: number;
  /** 0..1 the left hand reaches up and out, for a two-handed gesture */
  reachL?: number;
  facing?: 1 | -1;
  /** frames walked; 0 stands. A travelling figure passes f */
  walk?: number;
  keySide?: 'left' | 'right';
  rimColor?: string;
  /** idle gain, 0 freezes (default 1) */
  gain?: number;
  /** eyes, brows, nose and mouth with a blink (default true, machine pass 2026-11-22); false keeps the
   *  modelled head (crescent shade, ear, neck) but draws no features */
  face?: boolean;
  /** 0..1 the figure OPERATES a handheld two-stick controller held at the waist in both hands (a drone
   *  pilot, a crane or ROV operator). The sticks work continuously and throw hard on each cue. Overrides
   *  reach/reachL. Default 0 (machine pass 2026-11-23: the 11-23 UAF pilot "stands rather than operating") */
  operate?: number;
  /** sit on a stool: hips drop 62 units, thighs come toward the viewer, the stool is drawn under the hips */
  seated?: boolean;
  /** stool colour when seated */
  stool?: string;
}

/** Stick throw in degrees for an operating figure: a continuous working wobble on two incommensurate
 *  periods, plus a hard throw that lands on each cue and settles. Exported for the look-dev and tests. */
export function stickThrow(f: number, seed: number, cues: number[], side: -1 | 1): number {
  const work = 7 * Math.sin(f / 6.3 + seed * 1.7 + side) + 4 * Math.sin(f / 2.9 + seed * 0.6 - side * 2);
  let hit = 0;
  for (const c of cues) {
    const u = (f - (c - 4)) / 12;
    if (u > 0 && u < 2.2) hit += (u < 1 ? Math.sin((Math.PI / 2) * u) : Math.max(0, 1 - (u - 1) / 1.2)) * (side > 0 ? 24 : -16);
  }
  return work + hit;
}

/** The held figure's life BETWEEN cues, in figure units (h = 300): a reaching hand that works (hx, hy), the
 *  elbow's share of it (ex, ey), a torso sway (sway) and bob (bob), and a head nod (nod, degrees; ny, units).
 *  Two incommensurate periods per channel, the fastest about 0.55 s, so it never repeats inside a shot and
 *  never trembles. Exported for the look-dev and suit_hold_check. */
export function holdLife(f: number, seed: number, gain = 1) {
  const g = Math.max(0, gain);
  const a = seed * 1.37;
  return {
    hx: g * (18 * Math.sin(f / 8.7 + a) + 6 * Math.sin(f / 3.7 + a * 2.1)),
    hy: g * (14 * Math.sin(f / 6.1 + a * 0.7) + 5 * Math.sin(f / 2.6 + a * 1.3)),
    ex: g * 8 * Math.sin(f / 8.7 + a - 0.6),
    ey: g * 6 * Math.sin(f / 6.1 + a * 0.7 - 0.5),
    sway: g * (4.5 * Math.sin(f / 23 + a) + 1.8 * Math.sin(f / 9.1 + a * 1.9)),
    bob: g * 2.5 * Math.sin(f / 11 + seed),
    nod: g * (3.5 * Math.sin(f / 13.3 + a * 0.4) + 1.6 * Math.sin(f / 5.3 + a)),
    ny: g * 2 * Math.sin(f / 7.9 + a * 1.6),
    // the hanging arms swing a little with the sway, in the units the pose's armL/armR use
    arm: g * 2 * Math.sin(f / 10.3 + a * 0.9),
  };
}

export const Suit: React.FC<SuitProps> = ({
  f, x, y, s = 1, seed = 1, cues = [], coat = '#3A4048', trousers = '#2A2E36', shirt = '#F2EEE6',
  skin = '#C99A78', hair = '#4A3A30', tie = false, longHair = false, reach = 0, reachL = 0, facing = 1,
  walk = 0, keySide = 'left', rimColor = '#FFD7B0', gain = 1, face = true, operate = 0, seated = false, stool = '#4A4250',
}) => {
  const op = Math.max(0, Math.min(1, operate));
  const drop = seated ? 62 : 0;
  const hgt = 300 * s;
  const step = Math.sin(walk * 0.35) * 14;
  const tieColor = typeof tie === 'string' ? tie : tie ? '#9C3F2A' : null;
  const shade = '#9A6E52';
  const life = holdLife(f, seed, gain);
  // a held reach works between cues: the hand travels with holdLife, scaled by how far the arm is out
  const rx = 58 + reach * 70 + reach * life.hx, ry = -128 - reach * 70 + reach * life.hy;
  const lx = -52 - reachL * 40 - reachL * life.hx * 0.8, ly = -128 - reachL * 80 + reachL * life.hy * 0.9;
  return (
    <FigureFinish x={x} footY={y} w={140 * s} h={hgt} keySide={keySide} rimColor={rimColor} outline={3.5 * s} rimWidth={3.2 * s} rim={0.62} shade={0.5}>
      <IdleFigure f={f} x={x} footY={y} h={hgt} seed={seed} cues={cues} gain={gain}>
        {(pose) => (
          <g transform={`translate(${x},${y}) scale(${s * facing},${s})`}>
            <ContactShadow cx={0} cy={2} rx={62} ry={9} opacity={0.38} />
            {seated && (
              <g>
                {/* splayed stool legs and a foot ring, wider than the body so the stool reads past the knees */}
                {[-1, 1].map((sd) => (
                  <g key={sd}>
                    <path d={`M ${sd * 60} -38 L ${sd * 80} -4`} stroke={INK} strokeWidth={11} strokeLinecap="round" />
                    <path d={`M ${sd * 60} -38 L ${sd * 80} -4`} stroke={stool} strokeWidth={5} strokeLinecap="round" />
                  </g>
                ))}
                <path d="M -70 -20 L 70 -20" stroke={INK} strokeWidth={8} strokeLinecap="round" />
                <path d="M -70 -20 L 70 -20" stroke={stool} strokeWidth={3} strokeLinecap="round" />
                <rect x={-78} y={-52} width={156} height={18} rx={8} fill={stool} stroke={INK} strokeWidth={5} />
                <rect x={-70} y={-49} width={80} height={5} rx={2} fill="#FFFFFF" opacity={0.18} />
              </g>
            )}
            {[-1, 1].map((side) => {
              const fx = side * (22 - (seated ? 0 : step)) + (seated ? side * 8 : 0);
              // seated, the thigh comes toward the viewer (short, foreshortened, a knee a little wider and lower)
              const d = seated
                ? `M ${side * 18} -52 L ${side * 32} -40 L ${fx} -6`
                : `M ${side * 18} -110 L ${fx} -6`;
              return (
                <g key={side}>
                  <path d={d} stroke={INK} strokeWidth={22} strokeLinecap="round" />
                  <path d={d} stroke={trousers} strokeWidth={14} strokeLinecap="round" />
                  <ellipse cx={fx} cy={-4} rx={22} ry={10} fill="#1A1A20" stroke={INK} strokeWidth={3} />
                </g>
              );
            })}
            <g transform={`translate(${pose.shift * 0.4 + life.sway},${pose.dip + life.bob + drop}) rotate(${pose.lean + life.sway * 0.25} 0 -110)`}>
              <path d="M -50 -100 Q -56 -200 -30 -228 L 30 -228 Q 56 -200 50 -100 Q 0 -90 -50 -100 Z" fill={coat} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <path d="M -16 -226 L 0 -170 L 16 -226 Z" fill={shirt} stroke={INK} strokeWidth={3} />
              {tieColor && <path d="M -4 -200 L 4 -200 L 6 -150 L 0 -140 L -6 -150 Z" fill={tieColor} stroke={INK} strokeWidth={2} />}
              <path d="M -36 -222 Q -48 -190 -44 -110" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.25} strokeLinecap="round" />
              {op > 0 && (() => {
                // the controller at the waist, both hands on it, thumbs working the sticks
                const tl = stickThrow(f, seed, cues, -1) * op, tr = stickThrow(f, seed, cues, 1) * op;
                const lean = 2 * Math.sin(f / 17 + seed);
                const l = `M -40 -214 Q -66 -184 -50 -150`;
                const r = `M 40 -214 Q 66 -184 50 -150`;
                return (
                  <>
                    <path d={l} stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
                    <path d={l} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
                    <path d={r} stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
                    <path d={r} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
                    <g transform={`rotate(${lean} 0 -150)`}>
                      <path d="M 40 -172 L 46 -206" stroke={INK} strokeWidth={4} strokeLinecap="round" />
                      <circle cx={46} cy={-207} r={3.5} fill="#E2563E" stroke={INK} strokeWidth={1.5} />
                      {[-1, 1].map((sd) => (
                        <g key={sd} transform={`rotate(${sd < 0 ? tl : tr} ${sd * 20} -170)`}>
                          <path d={`M ${sd * 20} -170 L ${sd * 20} -186`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
                          <circle cx={sd * 20} cy={-188} r={6} fill="#3A3640" stroke={INK} strokeWidth={2.5} />
                        </g>
                      ))}
                      <rect x={-46} y={-172} width={92} height={40} rx={10} fill="#5E5A66" stroke={INK} strokeWidth={4} />
                      <rect x={-40} y={-168} width={58} height={6} rx={3} fill="#FFFFFF" opacity={0.2} />
                      <rect x={-12} y={-162} width={24} height={14} rx={2} fill="#7FD0C8" stroke={INK} strokeWidth={2} opacity={0.9} />
                    </g>
                    <circle cx={-50} cy={-150} r={11} fill={skin} stroke={INK} strokeWidth={3} />
                    <circle cx={50} cy={-150} r={11} fill={skin} stroke={INK} strokeWidth={3} />
                  </>
                );
              })()}
              {op === 0 && (() => {
                const aL = pose.armL + life.arm * (1 - reachL), aR = pose.armR - life.arm * (1 - reach);
                const hlx = lx + aL * 6, hly = ly;
                const hrx = rx, hry = ry + aR * 6;
                const l = `M -40 -214 Q ${-64 + aL * 10 - reachL * 20 - reachL * life.ex} ${-170 - reachL * 30 + reachL * life.ey} ${hlx} ${hly}`;
                const r = `M 40 -214 Q ${70 + reach * 30 + reach * life.ex} ${-190 + reach * 10 + reach * life.ey} ${hrx} ${hry}`;
                return (
                  <>
                    <path d={l} stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
                    <path d={l} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
                    <circle cx={hlx} cy={hly} r={11} fill={skin} stroke={INK} strokeWidth={3} />
                    <path d={r} stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
                    <path d={r} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
                    <circle cx={hrx} cy={hry} r={11} fill={skin} stroke={INK} strokeWidth={3} />
                  </>
                );
              })()}
              <g transform={`translate(${pose.headX * 0.4},${life.ny}) rotate(${pose.headRot + life.nod} 0 -250)`}>
                {longHair && <path d="M -40 -282 Q -54 -232 -36 -206 L -20 -214 Q -30 -250 -26 -282 Z M 40 -282 Q 54 -232 36 -206 L 20 -214 Q 30 -250 26 -282 Z" fill={hair} stroke={INK} strokeWidth={3} />}
                {/* neck, with the jaw's cast shadow across its top */}
                <path d="M -12 -232 L -12 -216 Q 0 -210 12 -216 L 12 -232 Z" fill={skin} stroke={INK} strokeWidth={3} />
                <path d="M -12 -230 Q 0 -222 12 -230 L 12 -224 Q 0 -217 -12 -224 Z" fill={shade} opacity={0.75} />
                {/* ear on the near (lit) side; the face turns three quarters toward facing */}
                {/* the ear stands clear of the skull (cx -38): at cx -33 it peeked 3 px past the outline and read
                    as a second, ghosted contour on the 11-23 pilot and Cahill (machine pass 2026-11-23) */}
                <ellipse cx={-38} cy={-258} rx={8.5} ry={12} fill={skin} stroke={INK} strokeWidth={3} />
                <path d="M -40 -265 Q -35 -258 -40 -251" stroke={shade} strokeWidth={2.5} fill="none" strokeLinecap="round" />
                <ellipse cx={0} cy={-262} rx={36} ry={42} fill={skin} stroke={INK} strokeWidth={5} />
                {/* form: a terminator crescent on the far side and a soft key highlight on the near cheek,
                    in place of the 11-21 centre blob the 11-22 panel read as a flat disc */}
                <path d="M 8 -301 Q 38 -292 34 -262 Q 32 -230 6 -222 Q 24 -242 24 -262 Q 24 -284 8 -301 Z" fill={shade} opacity={0.62} />
                <ellipse cx={-14} cy={-276} rx={11} ry={14} fill="#FFFFFF" opacity={0.16} />
                {face && (() => {
                  // a blink every three and a half seconds, phase set by seed, so held faces live
                  const blink = (f + seed * 37) % 105 < 4 ? 0.18 : 1;
                  const ey = -264;
                  return (
                    <g>
                      <path d={`M -15 ${ey - 11} Q -8 ${ey - 14} -2 ${ey - 11}`} stroke={hair} strokeWidth={3.4} fill="none" strokeLinecap="round" />
                      <path d={`M 10 ${ey - 11} Q 16 ${ey - 14} 23 ${ey - 11}`} stroke={hair} strokeWidth={3.4} fill="none" strokeLinecap="round" />
                      <ellipse cx={-8} cy={ey} rx={3.6} ry={4.6 * blink} fill={INK} />
                      <ellipse cx={16} cy={ey} rx={3.4} ry={4.4 * blink} fill={INK} />
                      <path d={`M 6 ${ey + 2} Q 12 ${ey + 14} 4 ${ey + 17}`} stroke={shade} strokeWidth={3} fill="none" strokeLinecap="round" />
                      <path d={`M -4 ${ey + 27} Q 5 ${ey + 31} 14 ${ey + 27}`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.8} />
                      <ellipse cx={-14} cy={ey + 16} rx={6} ry={4} fill="#E07A6A" opacity={0.22} />
                    </g>
                  );
                })()}
                {/* a crown of hair that covers the top of the skull. The 11-22 cap's outer edge peaked at -297 against
                    an inner edge at -298, a zero-width sliver drawn inside the head's top, so it read as a second
                    outline on every Suit (11-23, all seats: "onion-skin double outlines") */}
                <path d="M -37 -268 C -41 -306 -20 -316 0 -316 C 20 -316 41 -306 37 -268 Q 22 -289 0 -290 Q -22 -289 -37 -268 Z" fill={hair} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
                <path d="M -24 -300 Q -8 -309 10 -306" stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.18} strokeLinecap="round" />
                {longHair && <path d="M -36 -284 Q -40 -304 -12 -306 Q 20 -308 36 -284 Q 20 -296 0 -298 Q -20 -296 -36 -284 Z" fill={hair} stroke={INK} strokeWidth={3} />}
              </g>
            </g>
            {seated && [-1, 1].map((side) => (
              // the knees come toward the viewer, in front of the coat hem: what makes a front view read seated
              <g key={`knee${side}`} transform={`translate(${pose.shift * 0.2},0)`}>
                <ellipse cx={side * 30} cy={-38} rx={19} ry={14} fill={trousers} stroke={INK} strokeWidth={4} />
                <path d={`M ${side * 30 - 10} -46 Q ${side * 30} -50 ${side * 30 + 10} -46`} stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.2} strokeLinecap="round" />
              </g>
            ))}
          </g>
        )}
      </IdleFigure>
    </FigureFinish>
  );
};
