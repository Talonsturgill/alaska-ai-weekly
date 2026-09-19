/**
 * RUN-OF-RIVER — the intake, the penstock and the powerhouse.
 * ============================================================================
 * NET-NEW 2026-09-19 ("AURORA-AI", the Cordova islanded-grid dispatch).
 *
 * THE GAP THIS FILLS. The shelf had OilfieldBG (fossil extraction), FrostYardBG
 * (a utility yard) and RiverBG (a river as landscape), and nothing at all that
 * shows water being TAKEN from a creek and turned into electricity. That is the
 * physical mechanism of every small hydro story in Alaska, and this channel will
 * keep meeting them.
 *
 * WHY THE PARAMS ARE THE PARAMS. A run-of-river plant is defined by what it
 * CANNOT do, and the props say so:
 *   - `flow` is the creek. Nobody dispatches it. It is an input, not a control.
 *   - `gate` is the intake, and it is the ONLY thing an operator actually moves.
 *   - `spill` is the water going past unused, which on a plant with no reservoir
 *     is energy thrown away permanently. It is the single most story-bearing
 *     number in small hydro and it usually goes undrawn.
 * A scene that wants to say "this plant is running flat out and still throwing
 * energy away" sets flow high, gate open and spill high, and the picture says it
 * without a caption.
 *
 * DETERMINISM: every ripple is a sine of the frame. Never Math.random.
 */
import React from 'react';
import {INK, tones, FormGradient, RimLight, ContactShadow} from './lighting';

export interface RunOfRiverProps {
  f: number;
  x?: number;
  y?: number;
  scale?: number;
  /** 0..1 the creek's water level. An INPUT. Nobody commands it. */
  flow?: number;
  /** 0..1 the intake gate, the one thing an operator moves */
  gate?: number;
  /** 0..1 water going past the intake unused. On a plant with no reservoir this
   *  is energy thrown away and never recovered. */
  spill?: number;
  /** 0..1 the powerhouse door light. Warm, local, and the scene's motivated key. */
  lamp?: number;
  /** the warm light colour, so an episode can re-tint without a redraw */
  lampColor?: string;
  /** the water colour family */
  water?: string;
  /** flips the whole assembly so the creek can come down either side */
  facing?: 1 | -1;
}

/**
 * The whole assembly, drawn top-left (intake, high) to bottom-right (powerhouse,
 * low), so the penstock reads as a fall. Local origin is the POWERHOUSE FLOOR,
 * which is the thing scenes need to align other objects and shadows to.
 */
export const RunOfRiver: React.FC<RunOfRiverProps> = ({
  f, x = 0, y = 0, scale = 1, flow = 0.7, gate = 0.75, spill = 0.35,
  lamp = 1, lampColor = '#E3873A', water = '#2E6F99', facing = 1,
}) => {
  const uid = `ror${Math.round(x)}_${Math.round(y)}`;
  const conc = tones('#7E8C86');     // wet concrete
  const pipe = tones('#5A6E72');     // painted steel penstock
  const house = tones('#3E5550');    // powerhouse shell
  const wt = tones(water);
  const fl = Math.max(0, Math.min(1, flow));
  const gt = Math.max(0, Math.min(1, gate));
  const sp = Math.max(0, Math.min(1, spill));

  // the creek never stops: two desynced travelling waves on irrational periods
  const w1 = Math.sin(f / 13.7);
  const w2 = Math.sin(f / 9.3 + 1.4);

  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale})`}>
      <defs>
        <FormGradient id={`${uid}c`} t={conc} />
        <FormGradient id={`${uid}p`} t={pipe} />
        <FormGradient id={`${uid}h`} t={house} />
        <FormGradient id={`${uid}w`} t={wt} />
        <linearGradient id={`${uid}lamp`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lampColor} stopOpacity={0.85} />
          <stop offset="1" stopColor={lampColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* ---- THE CREEK, upper left. An input, not a control. ---------------- */}
      <g>
        <path
          d={`M-560,-560 L-330,-470 L-300,-408 L-540,-500 Z`}
          fill={`url(#${uid}w)`}
          stroke={INK}
          strokeWidth={5}
        />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M${-548 + i * 14},${-542 + i * 24} q70,${8 + 5 * (i % 2 ? w1 : w2)} 150,${34 + 3 * w2}`}
            fill="none"
            stroke="#EAF2EC"
            strokeWidth={3.4}
            opacity={0.18 + 0.16 * fl}
          />
        ))}
      </g>

      {/* ---- THE INTAKE. Concrete box, sluice gate, trash rack. ------------- */}
      <g transform="translate(-300,-430)">
        <ContactShadow cx={40} cy={86} rx={104} ry={13} opacity={0.3} />
        <path d="M-52,-58 H120 V78 H-52 Z" fill={`url(#${uid}c)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* the shade side, so the box is never a flat fill */}
        <path d="M78,-58 H120 V78 H78 Z" fill={conc.shade} opacity={0.55} />
        <RimLight d="M-52,-58 H120" w={3} opacity={0.5} />
        {/* trash rack bars, the thing that keeps the creek's debris out */}
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${-40 + i * 24},-46 V64`} stroke={INK} strokeWidth={4} opacity={0.75} />
        ))}
        {/* THE SLUICE GATE. The only moving control in the picture. */}
        <g transform={`translate(0,${-96 * gt})`}>
          <rect x={-46} y={-30} width={108} height={92} rx={4} fill={pipe.base} stroke={INK} strokeWidth={5} />
          <path d="M50,-30 H62 V62 H50 Z" fill={pipe.shade} opacity={0.6} />
          <path d="M-40,-14 H56" stroke={INK} strokeWidth={4} opacity={0.5} />
        </g>
        {/* gate stem and handwheel, so the gate is clearly a thing a person turns */}
        <path d={`M8,-58 V${-118 - 96 * gt}`} stroke={INK} strokeWidth={7} />
        <g transform={`translate(8,${-126 - 96 * gt}) rotate(${gt * 210})`}>
          <circle r={19} fill="none" stroke={INK} strokeWidth={7} />
          <path d="M-19,0 H19 M0,-19 V19" stroke={INK} strokeWidth={5} />
        </g>
      </g>

      {/* ---- THE SPILL. Energy going past, permanently. ---------------------- */}
      {sp > 0.02 && (
        <g opacity={0.35 + 0.55 * sp}>
          <path
            d={`M-180,-368 q${34 + 8 * w1},110 ${10 + 4 * w2},228 q-6,74 -70,120`}
            fill="none"
            stroke={wt.core}
            strokeWidth={16 + 30 * sp}
            strokeLinecap="round"
          />
          <path
            d={`M-180,-368 q${34 + 8 * w2},110 ${10 + 4 * w1},228`}
            fill="none"
            stroke="#EAF2EC"
            strokeWidth={4}
            opacity={0.5}
          />
          {/* spray where it lands: the tell that this water did no work */}
          {[0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={-244 + i * 22 + 6 * Math.sin(f / (7 + i * 1.7) + i)}
              cy={-8 - 16 * Math.abs(Math.sin(f / (11 + i * 2.3) + i * 1.9))}
              r={3.5 + i * 0.7}
              fill="#EAF2EC"
              opacity={0.3 * sp}
            />
          ))}
        </g>
      )}

      {/* ---- THE PENSTOCK. The fall, and the only path that does work. ------ */}
      <g>
        <ContactShadow cx={-90} cy={30} rx={210} ry={16} opacity={0.24} />
        {/* the pipe itself, drawn as a band with a lit crown and a shaded belly */}
        <path d="M-248,-352 L-24,-34 L-96,16 L-318,-306 Z" fill={`url(#${uid}p)`} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-248,-352 L-24,-34 L-52,-14 L-276,-332 Z" fill={pipe.key} opacity={0.32} />
        <RimLight d="M-248,-352 L-24,-34" w={3.5} opacity={0.55} />
        {/* expansion bands, which is what makes a penstock read as a penstock */}
        {[0.18, 0.38, 0.58, 0.78].map((t, i) => (
          <path
            key={i}
            d={`M${-248 + t * 224},${-352 + t * 318} l-70,46`}
            stroke={INK}
            strokeWidth={7}
            opacity={0.8}
          />
        ))}
        {/* anchor block: nothing floats */}
        <g transform="translate(-186,-190)">
          <path d="M-56,-26 H58 V54 H-56 Z" fill={`url(#${uid}c)`} stroke={INK} strokeWidth={5} />
          <path d="M28,-26 H58 V54 H28 Z" fill={conc.shade} opacity={0.5} />
        </g>
        {/* water moving INSIDE the pipe, shown as travelling highlight ticks */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const t = (((f * (0.004 + 0.012 * fl * gt)) + i / 6) % 1);
          return (
            <circle
              key={i}
              cx={-268 + t * 224}
              cy={-334 + t * 318}
              r={5.5}
              fill="#EAF2EC"
              opacity={0.1 + 0.4 * fl * gt}
            />
          );
        })}
      </g>

      {/* ---- THE POWERHOUSE. Local origin is its floor. --------------------- */}
      <g>
        <ContactShadow cx={70} cy={4} rx={188} ry={20} opacity={0.34} />
        {/* the warm spill of light out of the open door, on the ground */}
        {lamp > 0.02 && (
          <path d="M18,0 L-96,0 L-52,-116 L34,-116 Z" fill={`url(#${uid}lamp)`} opacity={0.5 * lamp} />
        )}
        <path d="M-108,-150 H250 V0 H-108 Z" fill={`url(#${uid}h)`} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M170,-150 H250 V0 H170 Z" fill={house.shade} opacity={0.6} />
        {/* roof with a real overhang, so the building has a top rather than an edge */}
        <path d="M-132,-150 L60,-216 L274,-150 Z" fill={pipe.base} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M60,-216 L274,-150 L240,-150 L60,-206 Z" fill={pipe.shade} opacity={0.6} />
        <RimLight d="M-132,-150 L60,-216" w={4} opacity={0.6} />
        {/* THE OPEN DOOR, which is the scene's motivated key light */}
        <rect x={-58} y={-116} width={76} height={116} fill={INK} />
        {lamp > 0.02 && (
          <rect x={-52} y={-110} width={64} height={110} fill={lampColor} opacity={0.5 + 0.45 * lamp} />
        )}
        {/* windows with a warm flicker, desynced from each other */}
        {[0, 1].map((i) => (
          <g key={i}>
            <rect x={78 + i * 76} y={-112} width={52} height={44} rx={4} fill={INK} />
            <rect
              x={82 + i * 76}
              y={-108}
              width={44}
              height={36}
              rx={3}
              fill={lampColor}
              opacity={(0.35 + 0.3 * lamp) * (0.82 + 0.18 * Math.sin(f / (17 + i * 6) + i * 2.1))}
            />
          </g>
        ))}
        {/* vent louvres and a wall box, for detail density */}
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M196,${-124 + i * 15} H236`} stroke={INK} strokeWidth={5} opacity={0.7} />
        ))}
        <rect x={-96} y={-74} width={26} height={34} rx={3} fill={conc.base} stroke={INK} strokeWidth={4} />
      </g>

      {/* ---- THE TAILRACE. The water leaves, having done its work. ---------- */}
      <g>
        <path d={`M250,-42 H470 L500,26 H262 Z`} fill={`url(#${uid}w)`} stroke={INK} strokeWidth={5} />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M${268 + i * 10},${-26 + i * 18} q78,${6 + 5 * (i % 2 ? w2 : w1)} 176,${4 + 3 * w1}`}
            fill="none"
            stroke="#EAF2EC"
            strokeWidth={3.2}
            opacity={0.16 + 0.2 * fl * gt}
          />
        ))}
      </g>
    </g>
  );
};
