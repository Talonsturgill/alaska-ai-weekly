import React from 'react';
import {INK, tones, FormGradient} from './lighting';
import {GripHand} from './props';

// =============================================================================
// SCOPE — the STUDY LENS family (2026-10-08, "Who Writes the Study").
// A hand lens made physical: a buoy-yellow enamel ring, a refracting glass, a long
// dark handle that several hands can grip, an engravable rim and a clock that can
// be set into the rim. The glass takes children (what is being studied) and the
// handle takes hands (who is doing the studying). A lens is a POINT OF VIEW you can
// hold, which is what the shelf's machine-vision reticles are not.
// Local coords: lens centre at (0,0), radius R. The handle leaves the rim at
// `handleDeg` (degrees, 0 = +x, 90 = down) and runs HL px. Everything is ink
// outlined and form shaded. Contact shadow is the caller's, since the lens floats.
// =============================================================================

export const LENS = {
  rim: '#F2C230',
  rimDk: '#A8741A',
  handle: '#27363B',
  glass: '#CFE7E2',
  paper: '#F4F2EA',
  stamp: '#D8432F',
};

const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
const MONO = "'JetBrains Mono', monospace";

export type LensHandKind = 'dev' | 'cbd' | 'alliance' | 'borough' | 'agency';

/** cuff colours: a hand is identified by its sleeve and a hanging tag, never by a face */
export const HAND_CUFF: Record<LensHandKind, string> = {
  dev: '#4C5F73',
  cbd: '#4F7A55',
  alliance: '#D9742B',
  borough: '#2C4A6B',
  agency: '#8A8F92',
};

export type LensHandSpec = {
  kind: LensHandKind;
  /** 0..1 position along the handle, 0 at the collar */
  at: number;
  /** which side the arm comes from */
  side: 1 | -1;
  /** 0 = far off frame, 1 = gripping */
  reach: number;
  /** how hard it grips, 0 loose rest .. 1 tight (drives the digits closing) */
  tag?: string;
  dotted?: boolean;
};

export const StudyLens: React.FC<{
  f: number;
  x: number;
  y: number;
  s?: number;
  /** tilt of the whole instrument about its centre, degrees */
  rot?: number;
  R?: number;
  handleDeg?: number;
  HL?: number;
  /** what is under study, drawn in glass space (0,0 centre, radius R) */
  glass?: React.ReactNode;
  /** magnification of the glass content */
  mag?: number;
  /** engraved text along the lower rim */
  rimText?: string;
  /** a clock set in the rim, 0..1 = fraction of the hour past the mark, undefined = none */
  clock?: number;
  clockLabel?: string;
  hands?: LensHandSpec[];
  /** plates riding the rim, drawn in lens space after the rim */
  rimChildren?: React.ReactNode;
  /** a soft wobble of the glass sheen 0..1 */
  glint?: number;
  handScale?: number;
  /** 0..1 turns the handle toward the camera as a perspective wedge (52px at the collar to 190px at the near end over 420px) */
  armDeg?: number;
  wedge?: number;
  /** ring squash about the vertical axis, 1 = face on */
  ring?: number;
}> = ({
  f, x, y, s = 1, rot = 0, R = 300, handleDeg = 62, HL = 560, glass, mag = 1.18, rimText, clock, clockLabel,
  hands = [], rimChildren, glint = 0.5, handScale = 0.8, armDeg = 40, wedge = 0, ring = 1,
}) => {
  const id = `lens${React.useId().replace(/:/g, '')}`;
  const rimT = tones(LENS.rim);
  const hdT = tones(LENS.handle);
  const gx = Math.cos((handleDeg * Math.PI) / 180);
  const gy = Math.sin((handleDeg * Math.PI) / 180);
  const sheen = 0.55 + 0.25 * Math.sin(f / 31) * glint;
  const rimW = 30;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} data-study-lens="true">
      <defs>
        <FormGradient id={`${id}-rim`} t={rimT} />
        <FormGradient id={`${id}-hd`} t={hdT} />
        <clipPath id={`${id}-clip`}><circle r={R - 4} /></clipPath>
        <radialGradient id={`${id}-glass`} cx="0.36" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="0.45" stopColor={LENS.glass} stopOpacity="0.1" />
          <stop offset="1" stopColor="#0E1A20" stopOpacity="0.34" />
        </radialGradient>
        <path id={`${id}-arc`} d={`M ${-(R + rimW / 2 + 7)} 0 A ${R + rimW / 2 + 7} ${R + rimW / 2 + 7} 0 0 0 ${R + rimW / 2 + 7} 0`} />
      </defs>

      {/* handle, behind the ring: collar, shaft with grip ridges, end ring */}
      {wedge > 0 && (
        <g transform={`rotate(${lerpN(handleDeg, 66, wedge)}) translate(${R * ring - 6},0)`} opacity={wedge}>
          <path d="M0,-26 L420,-95 Q452,-95 452,0 Q452,95 420,95 L0,26 Z" fill={`url(#${id}-hd)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          {Array.from({length: 7}, (_, i) => (
            <path key={i} d={`M${70 + i * 48},${-(30 + i * 8.6)} L${70 + i * 48},${30 + i * 8.6}`} stroke={INK} strokeWidth={4 + i * 0.6} opacity={0.4} />
          ))}
          <path d="M16,-18 L400,-76" stroke="#6B8590" strokeWidth={6} strokeLinecap="round" opacity={0.55} />
          <ellipse cx={446} cy={0} rx={22} ry={64} fill="#0E1A20" stroke={INK} strokeWidth={5} />
          <path d="M-2,-34 L96,-28 L96,28 L-2,34 Z" fill={`url(#${id}-rim)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        </g>
      )}
      <g transform={`scale(${ring},1)`}>
      <g transform={`rotate(${handleDeg}) translate(${R - 6},0)`} opacity={1 - wedge}>
        <path d={`M0,-26 L90,-22 L${HL},-24 Q${HL + 26},-24 ${HL + 26},0 Q${HL + 26},24 ${HL},24 L90,22 L0,26 Z`}
          fill={`url(#${id}-hd)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {Array.from({length: 9}, (_, i) => (
          <path key={i} d={`M${150 + i * 38},-22 L${150 + i * 38},22`} stroke={INK} strokeWidth={4} opacity={0.4} />
        ))}
        <path d={`M20,-17 L${HL - 10},-18`} stroke="#6B8590" strokeWidth={5} strokeLinecap="round" opacity={0.55} />
        <circle cx={HL + 6} cy={0} r={10} fill="#0E1A20" stroke={INK} strokeWidth={4} />
        <path d="M-2,-34 L96,-28 L96,28 L-2,34 Z" fill={`url(#${id}-rim)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M18,-26 L84,-22" stroke="#FFF6C8" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      </g>

      {/* the glass: whatever is under study, magnified, clipped to the ring */}
      <g clipPath={`url(#${id}-clip)`}>
        <circle r={R} fill="#9DB7B2" opacity={0.0} />
        <g transform={`scale(${mag})`}>{glass}</g>
        <circle r={R} fill={`url(#${id}-glass)`} />
        {/* edge refraction band */}
        <circle r={R - 20} fill="none" stroke="#FFFFFF" strokeWidth={22} opacity={0.12} />
        <path d={`M${-R * 0.72},${-R * 0.34} A${R * 0.8},${R * 0.8} 0 0 1 ${-R * 0.22},${-R * 0.76}`} fill="none"
          stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" opacity={sheen} />
        <path d={`M${-R * 0.62},${-R * 0.46} A${R * 0.8},${R * 0.8} 0 0 1 ${-R * 0.5},${-R * 0.58}`} fill="none"
          stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
      </g>

      {/* the ring */}
      <circle r={R + rimW / 2} fill="none" stroke={INK} strokeWidth={rimW + 12} />
      <circle r={R + rimW / 2} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={rimW} />
      <circle r={R + rimW / 2 + rimW * 0.28} fill="none" stroke="#FFF2B0" strokeWidth={4} opacity={0.5}
        strokeDasharray={`${R * 1.6} ${R * 5}`} transform="rotate(-150)" />
      <circle r={R - 2} fill="none" stroke={INK} strokeWidth={5} />
      {[200, 290, 20, 110].map((a) => (
        <g key={a} transform={`rotate(${a}) translate(${R + rimW / 2},0)`}>
          <circle r={5} fill={LENS.rimDk} stroke={INK} strokeWidth={2.5} />
          <path d="M-3,0 L3,0" stroke={INK} strokeWidth={1.6} />
        </g>
      ))}
      {rimText && (
        <text fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={3} fill={INK} opacity={0.82}>
          <textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">{rimText}</textPath>
        </text>
      )}

      {/* rim clock */}
      {clock !== undefined && (
        <g transform={`rotate(${handleDeg + 150}) translate(${R + rimW / 2 + 6},0)`}>
          <circle r={58} fill="#0E1A20" stroke={INK} strokeWidth={6} />
          <circle r={50} fill={LENS.paper} stroke={INK} strokeWidth={3} />
          {Array.from({length: 12}, (_, i) => (
            <path key={i} d={`M0,-44 L0,${i % 3 === 0 ? -34 : -39}`} stroke={INK} strokeWidth={i % 3 === 0 ? 4 : 2.5}
              transform={`rotate(${i * 30})`} />
          ))}
          <path d="M0,0 L0,-26" stroke={INK} strokeWidth={6} strokeLinecap="round" transform="rotate(-150)" />
          <path d="M0,0 L0,-38" stroke={LENS.stamp} strokeWidth={4} strokeLinecap="round" transform={`rotate(${-90 + clock * 360})`} />
          <circle r={5} fill={INK} />
          {clockLabel && (
            <text y={78} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} fill={INK}>{clockLabel}</text>
          )}
        </g>
      )}
      {rimChildren}
      </g>

      {/* hands on the handle, drawn in handle space so they follow every swing */}
      <g transform={`rotate(${handleDeg}) translate(${R - 6},0)`}>
        {hands.map((h, i) => {
          const along = 150 + h.at * (HL - 260);
          const dist = 1500 * (1 - Math.max(0, Math.min(1, h.reach)));
          return (
            <g key={i} transform={`translate(${along},0) rotate(${-h.side * armDeg}) translate(${dist},0)`}
              opacity={h.dotted ? 0.55 : 1}>
              <g transform={`scale(${handScale})`}>
                {h.dotted ? (
                  <g fill="none" stroke={HAND_CUFF.agency} strokeWidth={5} strokeDasharray="12 10" strokeLinecap="round">
                    <circle r={60} />
                    <path d="M60,0 L640,0" />
                  </g>
                ) : (
                  <g><path d="M630,-56 L2000,-56 L2000,64 L630,64 Z" fill={HAND_CUFF[h.kind]} stroke={INK} strokeWidth={5} /><GripHand x={0} y={0} reach={1} scale={1} cuffColor={HAND_CUFF[h.kind]} skin={h.kind === 'alliance' ? '#D9742B' : undefined} /></g>
                )}
                {h.tag && !h.dotted && (
                  <g transform="translate(250,-4)">
                    <path d="M0,0 L-6,48" stroke={INK} strokeWidth={3} />
                    <rect x={-70} y={46} width={140} height={34} rx={4} fill={LENS.paper} stroke={INK} strokeWidth={3} />
                    <text x={0} y={70} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={INK}>{h.tag}</text>
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </g>
      {/* anchor for callers that need the handle tip in lens space */}
      <circle cx={gx * (R + HL)} cy={gy * (R + HL)} r={0.01} fill="none" />
    </g>
  );
};
