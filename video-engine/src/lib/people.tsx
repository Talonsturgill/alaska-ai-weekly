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
// Look-dev: `SuitLook` (scripts/probe_frames.sh SuitLook 0,0.5,1.0,1.5,2.0 or a remotion still).
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
}

export const Suit: React.FC<SuitProps> = ({
  f, x, y, s = 1, seed = 1, cues = [], coat = '#3A4048', trousers = '#2A2E36', shirt = '#F2EEE6',
  skin = '#C99A78', hair = '#4A3A30', tie = false, longHair = false, reach = 0, reachL = 0, facing = 1,
  walk = 0, keySide = 'left', rimColor = '#FFD7B0', gain = 1,
}) => {
  const hgt = 300 * s;
  const step = Math.sin(walk * 0.35) * 14;
  const tieColor = typeof tie === 'string' ? tie : tie ? '#9C3F2A' : null;
  const shade = '#9A6E52';
  const rx = 58 + reach * 70, ry = -128 - reach * 70;
  return (
    <FigureFinish x={x} footY={y} w={140 * s} h={hgt} keySide={keySide} rimColor={rimColor}>
      <IdleFigure f={f} x={x} footY={y} h={hgt} seed={seed} cues={cues} gain={gain}>
        {(pose) => (
          <g transform={`translate(${x},${y}) scale(${s * facing},${s})`}>
            <ContactShadow cx={0} cy={2} rx={62} ry={9} opacity={0.38} />
            {[-1, 1].map((side) => {
              const fx = side * (22 - step);
              const d = `M ${side * 18} -110 L ${fx} -6`;
              return (
                <g key={side}>
                  <path d={d} stroke={INK} strokeWidth={22} strokeLinecap="round" />
                  <path d={d} stroke={trousers} strokeWidth={14} strokeLinecap="round" />
                  <ellipse cx={fx} cy={-4} rx={22} ry={10} fill="#1A1A20" stroke={INK} strokeWidth={3} />
                </g>
              );
            })}
            <g transform={`translate(${pose.shift * 0.4},${pose.dip + Math.sin(f / 11 + seed) * 2.5}) rotate(${pose.lean} 0 -110)`}>
              <path d="M -50 -100 Q -56 -200 -30 -228 L 30 -228 Q 56 -200 50 -100 Q 0 -90 -50 -100 Z" fill={coat} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <path d="M -16 -226 L 0 -170 L 16 -226 Z" fill={shirt} stroke={INK} strokeWidth={3} />
              {tieColor && <path d="M -4 -200 L 4 -200 L 6 -150 L 0 -140 L -6 -150 Z" fill={tieColor} stroke={INK} strokeWidth={2} />}
              <path d="M -36 -222 Q -48 -190 -44 -110" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.25} strokeLinecap="round" />
              {(() => {
                const l = `M -40 -214 Q ${-64 + pose.armL * 10 - reachL * 20} ${-170 - reachL * 30} ${-52 + pose.armL * 6 - reachL * 40} ${-128 - reachL * 80}`;
                const r = `M 40 -214 Q ${70 + reach * 30} ${-190 + reach * 10} ${rx} ${ry + pose.armR * 6}`;
                return (
                  <>
                    <path d={l} stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
                    <path d={l} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
                    <circle cx={-52 + pose.armL * 6 - reachL * 40} cy={-128 - reachL * 80} r={11} fill={skin} stroke={INK} strokeWidth={3} />
                    <path d={r} stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
                    <path d={r} stroke={coat} strokeWidth={14} fill="none" strokeLinecap="round" />
                    <circle cx={rx} cy={ry + pose.armR * 6} r={11} fill={skin} stroke={INK} strokeWidth={3} />
                  </>
                );
              })()}
              <g transform={`translate(${pose.headX * 0.4},0) rotate(${pose.headRot} 0 -250)`}>
                {longHair && <path d="M -40 -282 Q -54 -232 -36 -206 L -20 -214 Q -30 -250 -26 -282 Z M 40 -282 Q 54 -232 36 -206 L 20 -214 Q 30 -250 26 -282 Z" fill={hair} stroke={INK} strokeWidth={3} />}
                <ellipse cx={0} cy={-262} rx={36} ry={42} fill={skin} stroke={INK} strokeWidth={5} />
                <ellipse cx={8} cy={-256} rx={20} ry={24} fill={shade} opacity={0.6} />
                <path d="M -34 -282 Q 0 -312 34 -282 Q 20 -296 0 -298 Q -20 -296 -34 -282 Z" fill={hair} stroke={INK} strokeWidth={3} />
                {longHair && <path d="M -36 -284 Q -40 -304 -12 -306 Q 20 -308 36 -284 Q 20 -296 0 -298 Q -20 -296 -36 -284 Z" fill={hair} stroke={INK} strokeWidth={3} />}
              </g>
            </g>
          </g>
        )}
      </IdleFigure>
    </FigureFinish>
  );
};
