import React from 'react';
import {Easing, interpolate} from 'remotion';
import {Character} from './lib/Character';
import {EEGHeadset} from './lib/research';
import {EvidenceTrace} from './lib/spaceweather';
import {ContactShadow, FormGradient, RimLight, paleTones, tones} from './lib/lighting';
import {Sheet} from './lib/paper';

const PAPER = '#FFF9E8';
const LILAC = '#E8E1FA';
const VIOLET = '#776CB6';
const INK = '#25213D';
const CITRON = '#E4EC65';
const CORAL = '#ED9575';
const FONT = 'Archivo, Arial, sans-serif';
const MONO = 'JetBrains Mono, monospace';
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const between = (n: number, a: number, b: number) => clamp((n - a) / (b - a));
const TRACE = 'M0 0 C22 -5 31 17 48 8 S71 -19 91 -7 Q107 20 120 5 T153 -10 C169 -4 177 28 194 14 S219 -22 236 -8 Q252 11 269 3 T297 -12 Q314 -4 329 9 L345 4';

/** Shot 4 only. All narration-dependent acting follows the supplied beat clock.
 * The connection is a diagram, not a claim about wiring, voltage, or a result.
 * Parent owns shot camera/reveal-clock holds and the caption band.
 */
export const EEGDemo0912: React.FC<{
  f: number;
  observationAt: number;
  bp: (id: number, d?: number) => number;
}> = ({f, observationAt, bp}) => {
  const uid = `demo0912-${React.useId().replace(/:/g, '')}`;
  const reveal = clamp(bp(10, 21));
  const signal = clamp(bp(10, 56));
  const observe = clamp(bp(11, 32));
  const gesture = interpolate(f, [observationAt, observationAt + 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.18, 0.8, 0.25, 1),
  });
  const isolate = clamp(bp(12, 26));
  const turn = between(observe, 0.12, 0.68);
  const touch = between(gesture, 0.7, 1);
  const arrayScale = 0.76;
  const traceX = 591 - 369 * isolate;
  const traceY = 821 + 20 * isolate;
  const traceScale = 0.99 + 0.12 * isolate;
  const traceProgress = clamp(0.9 * signal + 0.1 * isolate);
  const bracketEnd = traceX + 346 * traceScale * traceProgress;
  const label = (text: string, x: number, y: number, size = 27, fill = INK) => (
    <text x={x} y={y} textAnchor="middle" fill={fill} fontFamily={MONO}
      fontSize={size} fontWeight={800}>{text}</text>
  );

  return <g data-scene="eeg-recording-demonstration">
    <defs>
      <FormGradient id={`${uid}-paper`} t={paleTones(PAPER)} />
      <FormGradient id={`${uid}-stand`} t={tones(VIOLET)} />
      {/* Reveal a view of fixed contacts; never animate electrodes over the scalp. */}
      <clipPath id={`${uid}-array-view`}>
        <circle cx={0} cy={0} r={30 + 380 * reveal} />
      </clipPath>
    </defs>

    {/* Anatomical orientation is schematic. Nineteen scalp pads belong to the
        imported array; its two earclips and three empty inputs stay distinct. */}
    <g opacity={1 - isolate}>
      {label('19 SCALP CONTACTS', 309, 579, 29)}
      <g transform={`translate(307 810) scale(${arrayScale})`}>
        <g clipPath={`url(#${uid}-array-view)`}>
          <path d="M-22 -214 L0 -246 L22 -214" fill={CORAL} stroke={INK}
            strokeWidth={6} strokeLinejoin="round" />
          <EEGHeadset f={f} mode="array" spread={1} body={VIOLET}
            contact={CITRON} ink={INK} highlight={9} />
        </g>
      </g>
      {/* The source of the recording is a scalp pad, not an auxiliary socket.
          A dashed arrow makes the link explicitly explanatory, not a cable. */}
      <path d="M445 810 C478 810 494 801 519 801 H565" fill="none"
        stroke={INK} strokeWidth={5} strokeDasharray="8 9"
        opacity={signal} />
      <path d="M552 791 L567 801 L552 811" fill="none" stroke={INK}
        strokeWidth={5} strokeLinecap="round" opacity={signal} />
      <g opacity={signal}>
        {label('RECORDS', 514, 752, 23)}
      </g>
      {label('TOP VIEW · SCHEMATIC', 309, 1110, 23)}
    </g>

    {/* A large display, with body/shade/rim and a responding recording bracket. */}
    <g opacity={1 - isolate}>
      <ContactShadow cx={758} cy={1049} rx={162} ry={16} opacity={0.23} />
      <path d="M735 946 H792 L805 1035 H720Z" fill={`url(#${uid}-stand)`}
        stroke={INK} strokeWidth={5} />
      <path d={`M655 ${1041 + 2 * touch} Q750 ${1043 + 4 * touch} 829 1041 L841 1060 H646Z`}
        fill={`url(#${uid}-stand)`} stroke={INK} strokeWidth={5} />
      <rect x={574} y={705} width={390} height={262} rx={17} fill={VIOLET}
        stroke={INK} strokeWidth={6} />
      <rect x={563} y={694} width={390} height={262} rx={17}
        fill={`url(#${uid}-paper)`} stroke={INK} strokeWidth={6} />
      <RimLight d="M578 701 H930 M570 715 V932" color={PAPER} w={5} />
      {label('ELECTRICAL ACTIVITY', 758, 744, 25)}
    </g>

    {/* Beat 12 removes environmental competition, while this same trace
        moves into an isolated measurement/interpretation composition. */}
    <g opacity={isolate}>
      <rect x={169} y={704} width={802} height={328} rx={16} fill={PAPER} />
      {label('RECORDING', 411, 754, 29)}
      <path d="M664 781 H937 V969 H664Z" fill={LILAC} stroke={VIOLET}
        strokeWidth={4} strokeDasharray="10 10" />
      {label('INTERPRETATION', 800, 754, 26)}
      {/* Intentionally no output symbol, thought, number, score or diagnosis. */}
    </g>

    <g transform={`translate(${traceX} ${traceY}) scale(${traceScale})`}>
      <EvidenceTrace d={TRACE} f={f} progress={traceProgress} width={8}
        color={CORAL} state="observed" />
    </g>
    <path d={`M${traceX} ${traceY + 48} v12 H${bracketEnd} v-12`}
      fill="none" stroke={VIOLET} strokeWidth={4} opacity={signal} />
    <g opacity={signal} transform={`translate(${(1 - signal) * -13} 0)`}>
      {label('SCHEMATIC', traceX + 172 * traceScale, traceY + 107, 28)}
    </g>

    {/* A real articulated gesture: arrive, turn toward the signal, extend to
        the display ledge, then give the isolated measurement space priority. */}
    <g opacity={observe * (1 - isolate)}>
      <g transform={`translate(851 1188) scale(${(-1 + 2 * turn) * (1 - 0.06 * isolate)} ${1 - 0.06 * isolate})`}>
        <Character frame={f} x={0} y={0} scale={0.62} facing={-1}
          pose="point" gesture={gesture * (1 - 0.25 * isolate)}
          emotion="neutral" outfit="flannel" headgear="bare"
          skin="#DDAF91" hair={INK} eyes={VIOLET} trim={CITRON}
          idleGain={0.6} />
      </g>
    </g>
    <g opacity={observe}>
      <rect x={460} y={1187} width={500} height={88} rx={10} fill={INK} opacity={0.2} />
      <rect x={456} y={1182} width={500} height={88} rx={10} fill={PAPER}
        stroke={INK} strokeWidth={3} />
      <text x={706} y={1216} textAnchor="middle" fill={INK} fontFamily={FONT}
        fontSize={31} fontWeight={850}>Vadim Egorov</text>
      {label('GRADUATE STUDENT', 706, 1252, 23)}
    </g>

    {/* Persistent notebook identity at the requested act-boundary anchor.
        Only its outer paper/stitched spine appears; NEXT STEP stays concealed. */}
    <g data-throughline="same-notebook" transform="translate(180 1160)">
      <ContactShadow cx={10} cy={86} rx={85} ry={11} opacity={0.2} />
      <Sheet x={-72} y={-47} w={183} h={120} fill={CORAL} />
      <Sheet x={-69} y={-52} w={176} h={120} fill={PAPER} curl={0.4} />
      <path d="M0 -42 V59" stroke={VIOLET} strokeWidth={5} strokeDasharray="5 7" />
      <path d="M-57 -23 H-13 M-57 -8 H-13 M-57 7 H-20" stroke={VIOLET}
        strokeWidth={3} />
      <path d="M100 -31 H132 V-1 H100Z" fill={CORAL} stroke={INK} strokeWidth={3} />
      <path d="M87 -52 L107 -32 H87Z" fill={LILAC} stroke={VIOLET} strokeWidth={2} />
    </g>
  </g>;
};
