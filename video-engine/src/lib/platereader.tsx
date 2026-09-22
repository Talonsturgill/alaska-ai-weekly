/**
 * PLATE READER — the machine that watches a public road, and what it keeps.
 * ============================================================================
 * NET-NEW 2026-09-22 ("Mat-Su banned a camera it never owned").
 *
 * THE GAP THIS FILLS, twice over.
 *
 * 1. THE OBJECT. The shelf's characterized objects all have EXPRESSIVE EYES.
 *    SatelliteEye searches and strains and finds, Petrel defers to a pointed
 *    hand, Vale locks on and protects, ServerMachine is hungry, Sourdough is
 *    proud or faltering. Every one of them is built to make a machine legible by
 *    giving it a feeling. This story needs the opposite and the opposite is not
 *    on the shelf: an aperture with NO FACE and NO OPINION, which performs the
 *    identical action on a car that is wanted and a car that is nobody's
 *    business, at the identical rate, forever. MachineShadow is the nearest
 *    thing and it is a faceless institutional MONOLITH, a building. This is a
 *    small sealed instrument on a pole.
 *
 *    The shape language is therefore deliberate and it is the whole design:
 *    rectilinear, sealed, symmetrical, and NOTHING ON IT MOVES. Not the body,
 *    not the mount, and above all not the lens. It is the exact inverse of
 *    lib/civics.tsx's Gate, which is rounded and many-parted precisely so it
 *    can visibly say "it depends". Put the two in one film and the argument is
 *    in the silhouettes.
 *
 *    THE LENS DOES NOT BLINK, AND THAT IS THE WHOLE ASSET (Gate 0D, 2026-09-22).
 *    The first draft gave this machine a six-leaf iris that snapped open on
 *    every read, with anticipation and overshoot. Gate 0D refused it on two
 *    grounds and both were right. First, lib/nameengine.tsx NameEngine is a
 *    rectilinear stacked machine whose ONE documented distinguishing feature is
 *    an intake iris of six overlapping leaves, so the draft was that machine on
 *    a pole. Second, and worse, a snapping iris is a DRAMATIC ORGAN. It is the
 *    machine performing, deciding, emoting, in a film whose entire thesis is
 *    that it has no judgement to exercise. So the aperture is gone. What is
 *    here instead is a fixed, permanently open, unblinking glass strip that
 *    never changes shape in any frame. A machine that can't even blink is more
 *    unsettling than one that snaps, it is the honest drawing of affectless,
 *    and it is nothing else on this shelf. Same move as IceGlider's deliberately
 *    bare tail and FieldRadiograph's bare back panel: the absence is the design.
 *
 *    WHERE THE GAP ACTUALLY IS, stated precisely so a later gate can check it.
 *    lib/vision.tsx ReticleArm is also machined, orthogonal and faceless, and
 *    the honest difference is not "no face", it is EMPLACEMENT. Nothing on the
 *    shelf is a fixed outdoor sensor bolted to public infrastructure, watching
 *    a flow it did not choose and cannot refuse. ListeningMooring and
 *    SeismicStation are the nearest fixed emplaced sensors, both listen to
 *    nature, both are soft and round, and SeismicStation has a face.
 *
 *    IT IS NOT A VILLAIN AND MUST NOT BE DRAWN AS ONE. No glare, no menace, no
 *    leaning in. The honest reading is that it is affectless, which is a harder
 *    and more useful thing to look at.
 *
 * 2. THE SYSTEM, and this is the run's craft advance. STATE THE PRIOR ART
 *    FIRST, because the first draft of this file did not and Gate 0D was right
 *    to refuse it for that alone.
 *
 *    lib/evidence.tsx already ships FrameStack, built 2026-08-06 for THE
 *    PREVIOUS PLATE-READER FILM. It is "the queue, as a physical pile": a stack
 *    of dead redacted frames, deterministically jittered, per-frame settled,
 *    each carrying a queueTag for its position. That IS retained machine output
 *    persisting after the perception event, and any claim that the shelf can't
 *    draw what happens after perception is false.
 *
 *    What FrameStack can't do is the only question THIS film asks. It is a pile
 *    of MEDIA, N copies of one 520x300 object, with no time axis, no expiry and
 *    no recall. RetentionStack is the sibling that adds exactly three things and
 *    claims nothing else:
 *      - `retention`, so the stack FORGETS. Oldest rows shed off the bottom as
 *        new ones land. This one parameter is why the asset exists: a memo can
 *        call a record permanent and a vendor can advertise a seven day default,
 *        and a film can now draw both instead of asserting either.
 *      - `query`, so a sweep descends and re-ignites one old row. Keeping only
 *        matters because you can reach back.
 *      - rows as TYPE ON A SPINE rather than as stacked objects, which is what
 *        lets a stack stand taller than a treeline instead of sitting on a desk.
 *    The next telemetry, logging or records-retention story casts this. That is
 *    the test, and this channel meets it repeatedly.
 *
 * THE COLOUR RULE, inherited from lib/vision.tsx and enforced here by having a
 * default rather than a hardcode: a perception overlay is the ONLY emissive
 * thing in a frame. `scan` defaults to this film's magenta, and whatever a scene
 * passes must appear nowhere else in that film, or the overlay stops reading as
 * the machine's own light and becomes decoration.
 *
 * DETERMINISM: every idle, flicker and drift is a function of the frame. Never
 * Math.random, because a re-render has to produce the identical film.
 */
import React from 'react';
import {INK, tones, FormGradient, RimLight, ContactShadow} from './lighting';

export const SCAN = '#FF3FA4';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** THE READ, and it is NOT a movement of the machine. The housing is fixed and
 *  the glass is always open, so a read is the emitter strip firing and the
 *  characters leaving the plate. Everything mechanical stays exactly where it
 *  was. Drive `lit` with this and the plate's readEdge with the same value. */
export function readFire(f: number, at: number, dur = 7): number {
  const t = (f - at) / dur;
  if (t <= 0) return 0;
  if (t >= 1) return Math.max(0, 1 - (t - 1) * 0.55);
  return 1 - Math.pow(1 - t, 3);
}

export interface PlateReaderProps {
  f: number;
  x?: number;
  y?: number;
  scale?: number;
  /** 0..1 the emissive scan wash. The ONLY emissive thing in the frame. */
  lit?: number;
  /** true draws the housing as a dotted ghost: the machine that is NOT there.
   *  The film's hook and its button both need a bracket with nothing in it. */
  ghost?: boolean;
  /** the perception colour. Must appear nowhere else in the film. */
  scan?: string;
  /** the cold body colour */
  body?: string;
  /** draws the pole and cantilever arm under the housing */
  pole?: boolean;
  /** ground y for the pole's contact shadow */
  groundY?: number;
  id?: string;
}

/**
 * The machine. A sealed box, a fixed glass strip behind a stepped hood, an
 * emitter strip, a sunshade with drip notches, a bracket clamp and a mount.
 * Six parts, three lit zones, and not one of them articulated. Nothing on it
 * moves in any frame of any film.
 */
export const PlateReader: React.FC<PlateReaderProps> = ({
  f, x = 0, y = 0, scale = 1, lit = 0, ghost = false,
  scan = SCAN, body = '#5A6070', pole = false, groundY, id = 'pr',
}) => {
  const L = clamp01(lit);
  const t = tones(body);
  // The housing does not breathe and does not bob. The ONLY idle is a slow
  // thermal shimmer off the top plane and a slight sway in the service cable,
  // because a sealed instrument on a steel pole in the cold does nothing else.
  const cable = 2.4 * Math.sin(f / 37) + 1.1 * Math.sin(f / 23.3);
  const shimmer = 0.5 + 0.5 * Math.sin(f / 61);
  const dash = ghost ? {strokeDasharray: '11 9', strokeDashoffset: -f * 0.35} : {};

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <FormGradient id={`${id}-body`} t={t} />
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.4" y2="1">
          <stop stopColor="#1A2030" /><stop offset="1" stopColor="#070A12" />
        </linearGradient>
        <radialGradient id={`${id}-wash`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor={scan} stopOpacity="0.55" /><stop offset="1" stopColor={scan} stopOpacity="0" />
        </radialGradient>
      </defs>

      {pole && (
        <g>
          {groundY !== undefined && (
            <ContactShadow cx={0} cy={groundY} rx={44} ry={11} opacity={0.5} />
          )}
          {/* the mast, with a weld seam and a bolt collar */}
          <rect x={-13} y={0} width={26} height={groundY !== undefined ? groundY : 640}
                fill={`url(#${id}-body)`} stroke={INK} strokeWidth={5} />
          <path d={`M-13 118h26`} stroke={INK} strokeWidth={3} opacity={0.55} />
          <rect x={-21} y={150} width={42} height={16} rx={3} fill={t.shade} stroke={INK} strokeWidth={4} />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={-14 + i * 9.4} cy={158} r={2.6} fill={INK} opacity={0.75} />
          ))}
          {/* the cantilever arm with its gusset */}
          <rect x={-8} y={-16} width={172} height={20} rx={4}
                fill={`url(#${id}-body)`} stroke={INK} strokeWidth={5} />
          <path d="M6 4 L6 44 L44 4 Z" fill={t.shade} stroke={INK} strokeWidth={4} />
          {/* the slack service cable, the one thing on the pole that moves */}
          <path d={`M150 6 q${-46 + cable} ${44 + cable * 0.7} -96 ${16 + cable}`}
                fill="none" stroke={INK} strokeWidth={7} opacity={0.85} />
          <path d={`M150 6 q${-46 + cable} ${44 + cable * 0.7} -96 ${16 + cable}`}
                fill="none" stroke={t.key} strokeWidth={2.6} opacity={0.3} />
          {/* a junction box with an indicator that stays dark when ghosted */}
          <rect x={-30} y={210} width={30} height={40} rx={3}
                fill={t.base} stroke={INK} strokeWidth={4.5} />
          <circle cx={-15} cy={230} r={4} fill={ghost ? '#2A2E3A' : scan}
                  opacity={ghost ? 1 : 0.35 + 0.45 * L * shimmer} />
        </g>
      )}

      {/* THE BRACKET. It is drawn whether or not the machine is in it, because
       *  the film's hook and its button are both an EMPTY bracket and the
       *  emptiness only reads if the mount is unmistakably there. */}
      <g transform="translate(156 -6)">
        <path d="M-10 -4 L-10 26 L14 26 L14 -4 Z" fill={t.shade} stroke={INK} strokeWidth={5} />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={-4 + (i % 2) * 12} cy={2 + Math.floor(i / 2) * 16} r={3.1}
                  fill={ghost ? '#0A0D16' : INK} opacity={0.9} />
        ))}
      </g>

      {/* THE HOUSING */}
      <g transform="translate(156 -6)" opacity={ghost ? 0.55 : 1}>
        <g {...(ghost ? {} : {})}>
          {/* sealed body */}
          <rect x={14} y={-30} width={116} height={62} rx={5}
                fill={ghost ? 'none' : `url(#${id}-body)`}
                stroke={ghost ? '#8E93A8' : INK} strokeWidth={ghost ? 4 : 6} {...dash} />
          {!ghost && (
            <>
              {/* the bolted seam that runs the length of it */}
              <path d="M14 -6h116" stroke={INK} strokeWidth={3} opacity={0.5} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <circle key={i} cx={24 + i * 19} cy={-6} r={2.5} fill={INK} opacity={0.6} />
              ))}
              {/* the top plane, the one surface catching the last of the sky */}
              <path d="M14 -30h116v9H14Z" fill={t.key} opacity={0.22 + 0.12 * shimmer} />
              {/* sunshade lip with two drip notches */}
              <path d="M8 -34h128v10H8Z" fill={t.shade} stroke={INK} strokeWidth={5} />
              <path d="M44 -24v7M104 -24v7" stroke={INK} strokeWidth={4} opacity={0.8} />
              {/* the infrared emitter strip, dark until the machine works */}
              <rect x={22} y={16} width={100} height={9} rx={3}
                    fill="#12161F" stroke={INK} strokeWidth={3} />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <rect key={i} x={26 + i * 12} y={18} width={7} height={5} rx={1}
                      fill={scan} opacity={0.12 + 0.72 * L} />
              ))}
              {/* the bracket clamp and its locking nut */}
              <rect x={2} y={-14} width={16} height={30} rx={2}
                    fill={t.shade} stroke={INK} strokeWidth={4.5} />
              <circle cx={10} cy={1} r={4.6} fill={t.base} stroke={INK} strokeWidth={3} />
            </>
          )}
        </g>

        {/* THE GLASS. A fixed horizontal strip behind a stepped hood. It is
         *  permanently open, it has no leaves, no iris and no shutter, and it
         *  does not change shape in any frame of any film. The only thing that
         *  ever changes here is how much light comes OUT of it. */}
        {!ghost && (
          <g transform="translate(130 1)">
            <rect x={0} y={-19} width={30} height={38} rx={4}
                  fill={t.shade} stroke={INK} strokeWidth={5} />
            <path d="M0 -19h30v6H0Z" fill={t.key} opacity={0.25} />
            {/* the stepped hood over the strip */}
            <path d="M26 -24h30v7H26Z" fill={t.shade} stroke={INK} strokeWidth={4.5} />
            {/* the strip itself. Always open. */}
            <rect x={28} y={-11} width={34} height={22} rx={2}
                  fill={`url(#${id}-glass)`} stroke={INK} strokeWidth={5} />
            <rect x={31} y={-8} width={28} height={16} rx={1}
                  fill={scan} opacity={0.10 + 0.55 * L} />
            <rect x={28} y={-11} width={34} height={22} rx={2} fill="none"
                  stroke={scan} strokeWidth={2} opacity={0.18 + 0.32 * L} />
            {/* one hard specular tick so the glass reads as glass, not a hole */}
            <path d="M32 -7 q9 -3 20 -1" fill="none" stroke="#DDE4F2" strokeWidth={2.6} opacity={0.4} />
          </g>
        )}
      </g>

      {/* the emissive wash. Drawn LAST so nothing overprints the one thing that
       *  is meant to be the brightest in frame (DISPATCH_STANDARD rule 7). */}
      {!ghost && L > 0.01 && (
        <ellipse cx={316} cy={-5} rx={132} ry={92} fill={`url(#${id}-wash)`} opacity={0.75 * L} />
      )}
      {!ghost && (
        <RimLight d="M170 -36h128v66H170Z" w={2.6} color={scan} opacity={0.22 * L} />
      )}
    </g>
  );
};

/* LicensePlate was REFUSED by Gate 0D on 2026-09-22 and is deliberately absent.
 * lib/evidence.tsx already ships a finished Alaska plate, built 2026-08-06 for the
 * previous plate-reader film, with a state band, an embossed double border, four
 * bolt heads and stamped invented characters. Drawing a second one here would fork
 * the geometry, which this shelf has already written down as a mistake (VESSEL_PATH
 * is shared between SteelVessel and TwinVessel for exactly this reason).
 *
 * The plate was extracted out of FrameOfEvidence into `AlaskaPlate` in the same
 * commit, so the CCTV film and the road film now draw ONE object. Import it:
 *
 *     import {AlaskaPlate} from './evidence';
 *     <AlaskaPlate readEdge={readFire(f, at)} readColor={SCAN} />
 */

export interface RetentionStackProps {
  f: number;
  x?: number;
  y?: number;
  scale?: number;
  /** how many rows have landed. The stack only ever grows during a shot. */
  rows?: number;
  /** row height in scene units */
  pitch?: number;
  /** 0..1 how much of the stack survives. 1 keeps everything. Below 1 the
   *  OLDEST rows shed off the bottom, which is what a retention window actually
   *  looks like: the recent end is untouched and the archive goes.
   *
   *  THE DEFAULT IS NOT 1, DELIBERATELY (Gate 0B, 2026-09-22). A stack that only
   *  ever grows is a PERMANENCE CLAIM made with a picture, and the 2026-09-22
   *  fact-check forbids that claim in words: the word "permanent" belongs only
   *  inside a quoted ordinance memo, and the largest vendor advertises a seven
   *  day default. A film that draws infinite accumulation says with an image
   *  what its own claim set refuses to let it say out loud. So the honest
   *  default is a window, and a scene that wants permanence has to ask for it. */
  retention?: number;
  /** 0..1 a query sweeping the stack. It lights exactly one row. */
  query?: number;
  /** which row the query finds. Defaults to an old one, because the whole
   *  point of keeping is being able to reach back. */
  queryRow?: number;
  scan?: string;
  /** strings for the rows, cycled. Short mono, never real plates. */
  labels?: string[];
  id?: string;
}

/**
 * THE CRAFT ADVANCE. Perception that keeps.
 *
 * A row is a plate string and a time stamp threaded onto a spine. Rows land
 * from below with a hard settle, they persist after the thing they describe has
 * gone, and a query sweep can reach back down and light one up.
 *
 * `retention` is the parameter that makes this a system rather than a prop. Set
 * it to 1 and nothing is ever forgotten. Set it lower and the oldest rows dim
 * and go, which is a vendor's advertised default drawn honestly beside a memo's
 * claim that the record is permanent. A film can put two of these side by side
 * and let a viewer see the difference without a caption.
 */
export const RetentionStack: React.FC<RetentionStackProps> = ({
  f, x = 0, y = 0, scale = 1, rows = 8, pitch = 34, retention = 0.72, query = 0,
  queryRow, scan = SCAN, labels, id = 'rs',
}) => {
  const n = Math.max(0, Math.floor(rows));
  const keep = clamp01(retention);
  const q = clamp01(query);
  const target = queryRow ?? Math.max(0, Math.floor(n * 0.22));
  const L = labels ?? ['AK 4 7 2 9', 'AK 8 1 0 3', 'AK 2 2 6 5', 'AK 9 4 1 7', 'AK 5 0 3 8', 'AK 7 6 9 1'];
  // the sweep bar travels the whole stack on the query, top to bottom
  const sweepY = -pitch * n * q;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}-spine`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={scan} stopOpacity="0.5" />
          <stop offset="1" stopColor={scan} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      {/* the spine the rows thread onto */}
      <rect x={-4} y={-pitch * n - 10} width={8} height={pitch * n + 18}
            fill={`url(#${id}-spine)`} />
      {Array.from({length: n}).map((_, i) => {
        // i = 0 is the OLDEST row, at the bottom. New rows arrive on top.
        const ry = -pitch * i;
        // the retention window: the oldest rows are the ones that go
        const age = n <= 1 ? 0 : i / (n - 1);
        const kept = age >= 1 - keep ? 1 : clamp01((age - (1 - keep) + 0.16) / 0.16);
        // a row lands with a settle, staggered so the stack builds rather than pops
        const land = clamp01((f - i * 4) / 9);
        const settle = 1 - Math.pow(1 - land, 3);
        const hit = q > 0.02 && i === target ? clamp01(1 - Math.abs(sweepY - ry) / (pitch * 1.4)) : 0;
        const op = (0.20 + 0.42 * (1 - age)) * kept * settle;
        if (op <= 0.01) return null;
        return (
          <g key={i} transform={`translate(${(1 - settle) * -26} ${ry})`} opacity={op + 0.55 * hit}>
            <rect x={-96} y={-11} width={192} height={22} rx={3}
                  fill={hit > 0.3 ? '#3A0E26' : '#170A1E'}
                  stroke={scan} strokeWidth={hit > 0.3 ? 2.8 : 1.3}
                  opacity={0.55 + 0.45 * hit} />
            <text x={-86} y={5} fontFamily="JetBrains Mono, monospace" fontWeight={700}
                  fontSize={14} letterSpacing={1.1} fill={scan} opacity={0.85 + 0.15 * hit}>
              {L[i % L.length]}
            </text>
            <text x={40} y={5} fontFamily="JetBrains Mono, monospace" fontWeight={700}
                  fontSize={12} letterSpacing={0.8} fill={scan} opacity={0.5 + 0.4 * hit}>
              {`${String(18 + (i % 6)).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`}
            </text>
          </g>
        );
      })}
      {/* the query sweep bar */}
      {q > 0.02 && q < 0.995 && (
        <g transform={`translate(0 ${sweepY})`} opacity={0.8}>
          <rect x={-112} y={-2} width={224} height={4} fill={scan} opacity={0.75} />
          <rect x={-112} y={-13} width={224} height={26} fill={scan} opacity={0.10} />
        </g>
      )}
    </g>
  );
};
