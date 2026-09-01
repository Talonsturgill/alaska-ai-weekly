import React from 'react';

export const SPACE = {
  void: '#130F12',
  signal: '#FF2F6D',
  ivory: '#FFF0D1',
  graphite: '#4B4348',
  neutral: '#A79DA1',
  ash: '#8D7C86',
  ink: '#1B1519',
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - Math.pow(1 - clamp(v), 3);

export type TraceState = 'observed' | 'uncertain' | 'calibrated' | 'extrapolated';

/**
 * Reusable continuous path-state renderer. The path never swaps identity when its
 * evidence state changes: observed/calibrated segments have body, rim and form;
 * uncertainty adds displaced phase/amplitude ghosts; extrapolation is hairline,
 * dashed and shadowless. Arc-length dash phase is continuous across transitions.
 */
export const EvidenceTrace: React.FC<{
  d?: string;
  f: number;
  state?: TraceState;
  progress?: number;
  width?: number;
  opacity?: number;
  phase?: number;
}> = ({
  d = 'M 70 520 C 270 390 430 650 610 500 C 760 390 860 460 1010 300',
  f,
  state = 'observed',
  progress = 1,
  width = 24,
  opacity = 1,
  phase = 0,
}) => {
  const p = ease(progress);
  const length = 1650;
  const dash = length * (1 - p);
  const physical = state === 'observed' || state === 'calibrated';
  const uncertain = state === 'uncertain';
  const extrapolated = state === 'extrapolated';
  const wobble = uncertain ? 8 + 5 * Math.sin(f / 13 + phase) : 0;
  const baseWidth = extrapolated ? Math.max(5, width * 0.28) : width;
  const stroke = extrapolated ? SPACE.signal : SPACE.signal;
  return <g opacity={opacity}>
    {physical && <path d={d} fill="none" stroke={SPACE.ink} strokeWidth={baseWidth + 15}
      strokeLinecap="round" strokeLinejoin="round" pathLength={length}
      strokeDasharray={length} strokeDashoffset={dash} />}
    {uncertain && [-1, 1].map((s) => <path key={s} d={d} fill="none" stroke={SPACE.ash}
      strokeWidth={Math.max(6, width * (s > 0 ? 0.8 : 0.48))} strokeLinecap="round"
      pathLength={length} strokeDasharray={length} strokeDashoffset={dash}
      transform={`translate(${s * wobble} ${s * (11 + 5 * Math.cos(f / 17 + phase))})`}
      opacity={0.42} />)}
    <path d={d} fill="none" stroke={stroke} strokeWidth={baseWidth}
      strokeLinecap="round" strokeLinejoin="round" pathLength={length}
      strokeDasharray={extrapolated ? '34 24' : length}
      strokeDashoffset={extrapolated ? -f * 1.25 + phase * 20 : dash}
      opacity={extrapolated ? 0.55 : 1} />
    {physical && <path d={d} fill="none" stroke={SPACE.ivory} strokeWidth={Math.max(3, width * 0.2)}
      strokeLinecap="round" pathLength={length} strokeDasharray={length}
      strokeDashoffset={dash} opacity={0.78} transform="translate(0 -5)" />}
    {state === 'calibrated' && <path d={d} fill="none" stroke={SPACE.ivory} strokeWidth={3}
      pathLength={length} strokeDasharray="8 58" strokeDashoffset={-f * 1.8}
      opacity={0.58} />}
  </g>;
};

/** This episode's five-state instance of EvidenceTrace. */
export const SignalRibbon: React.FC<{
  f: number;
  state?: 'clean' | 'paired' | 'frayed' | 'recalibrated' | 'solid-to-dashed';
  x?: number;
  y?: number;
  scale?: number;
  progress?: number;
  rotate?: number;
}> = ({f, state = 'clean', x = 0, y = 0, scale = 1, progress = 1, rotate = 0}) => {
  const d = state === 'paired'
    ? 'M 70 520 C 260 500 405 410 575 475 C 730 535 860 425 1010 300'
    : state === 'recalibrated' || state === 'solid-to-dashed'
      ? 'M 70 610 C 270 570 430 500 610 420 C 760 350 870 270 1010 170'
      : 'M 70 560 C 260 365 420 670 610 485 C 760 340 870 470 1010 250';
  return <g transform={`translate(${x} ${y}) rotate(${rotate} 540 500) scale(${scale})`}>
    {state === 'frayed' ? <>
      <EvidenceTrace d={d} f={f} state="uncertain" progress={progress} width={28} />
      <path d={d} fill="none" stroke={SPACE.signal} strokeWidth={11} strokeLinecap="round"
        strokeDasharray="16 22" strokeDashoffset={-f * 1.1} opacity={0.6} transform="translate(0 -24)" />
    </> : state === 'solid-to-dashed' ? <>
      <clipPath id="solid0901"><rect x={0} y={0} width={640} height={1200} /></clipPath>
      <clipPath id="dash0901"><rect x={640} y={0} width={500} height={1200} /></clipPath>
      <g clipPath="url(#solid0901)"><EvidenceTrace d={d} f={f} state="calibrated" progress={progress} width={28} /></g>
      <g clipPath="url(#dash0901)"><EvidenceTrace d={d} f={f} state="extrapolated" progress={progress} width={28} phase={0.7} /></g>
      <line x1={640} y1={250} x2={640} y2={690} stroke={SPACE.ivory} strokeWidth={7} />
      <circle cx={640} cy={420} r={18} fill={SPACE.ivory} stroke={SPACE.ink} strokeWidth={6} />
    </> : <EvidenceTrace d={d} f={f} state={state === 'recalibrated' ? 'calibrated' : 'observed'} progress={progress} width={28} />}
  </g>;
};

/**
 * Faceless schematic upstream solar-wind monitor. It is deliberately not the
 * imaging/AI-coded SatelliteEye and never receives a face, camera eye or intent.
 */
export const UpstreamMonitor: React.FC<{f: number; x?: number; y?: number; scale?: number; deploy?: number}> =
  ({f, x = 540, y = 560, scale = 1, deploy = 1}) => {
    const d = ease(deploy);
    const drift = Math.sin(f / 41) * 4;
    return <g transform={`translate(${x} ${y + drift}) scale(${scale})`}>
      <ellipse cx={0} cy={170} rx={170} ry={24} fill={SPACE.ink} opacity={0.35} />
      <g transform={`scale(${0.92 + 0.08 * d})`}>
        <rect x={-112} y={-82} width={224} height={164} rx={26} fill={SPACE.graphite} stroke={SPACE.ink} strokeWidth={12} />
        <path d="M -96 -50 L 18 -50 L 84 8 L 84 60 L -96 60 Z" fill="#665A61" />
        <path d="M -92 -55 L 12 -55" stroke={SPACE.ivory} strokeWidth={8} strokeLinecap="round" opacity={0.72} />
        {[-1, 1].map((s) => <g key={s} transform={`translate(${s * (112 + 150 * d)} 0)`}>
          <rect x={s < 0 ? -150 : 0} y={-86} width={150} height={172} rx={8} fill="#5A526A" stroke={SPACE.ink} strokeWidth={10} />
          {Array.from({length: 4}, (_, i) => <line key={i} x1={(s < 0 ? -146 : 4) + i * 36} y1={-80}
            x2={(s < 0 ? -146 : 4) + i * 36} y2={80} stroke="#D9C3CB" strokeWidth={4} opacity={0.62} />)}
        </g>)}
        <line x1={0} y1={-82} x2={0} y2={-190 - 95 * d} stroke={SPACE.neutral} strokeWidth={15} strokeLinecap="round" />
        <circle cx={0} cy={-205 - 95 * d} r={26} fill={SPACE.ivory} stroke={SPACE.ink} strokeWidth={9} />
        <line x1={92} y1={-28} x2={205 + 100 * d} y2={-95} stroke={SPACE.neutral} strokeWidth={12} strokeLinecap="round" />
        <path d={`M ${205 + 100 * d} -95 q 54 -40 91 4 q -20 66 -91 48 Z`} fill={SPACE.neutral} stroke={SPACE.ink} strokeWidth={9} />
        <circle cx={-47} cy={9} r={15} fill={SPACE.signal} opacity={0.68 + 0.22 * Math.sin(f / 8)} />
        <circle cx={20} cy={9} r={9} fill={SPACE.ivory} opacity={0.6 + 0.28 * Math.sin(f / 11)} />
      </g>
      <g transform="translate(-108 124)">
        <rect width={216} height={52} rx={8} fill={SPACE.ivory} stroke={SPACE.ink} strokeWidth={6} />
        <text x={108} y={34} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize={19} fontWeight={900} fill={SPACE.ink}>WIND · SCHEMATIC</text>
      </g>
    </g>;
  };

export const UncertaintyLattice: React.FC<{f: number; x?: number; y?: number; scale?: number; flex?: number}> =
  ({f, x = 540, y = 650, scale = 1, flex = 1}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {Array.from({length: 9}, (_, i) => {
      const yy = -330 + i * 82;
      const bend = Math.sin(f / 28 + i * 0.8) * 18 * flex;
      return <path key={i} d={`M -430 ${yy} C -180 ${yy + bend}, 100 ${yy - 130 * Math.sin(i)}, 430 ${yy + bend}`}
        fill="none" stroke={SPACE.ash} strokeWidth={4 + (i % 3)} opacity={0.34 + (i % 2) * 0.14}
        strokeDasharray="18 14" strokeDashoffset={-f * (0.25 + i * 0.03)} />;
    })}
    {Array.from({length: 7}, (_, i) => <circle key={i} cx={-300 + i * 100} cy={-170 + 55 * Math.sin(f / 19 + i)}
      r={11 + (i % 3) * 4} fill={SPACE.void} stroke={SPACE.ivory} strokeWidth={4} opacity={0.82} />)}
  </g>;

/**
 * Reusable instrument-room environment for evidence films. It is apparatus, not grain:
 * two visible telemetry rails own ports, status lamps and routed traces, so a sparse
 * scientific diagram still has a characterized place around it without inventing data.
 */
export const MeasurementField: React.FC<{f: number; dense?: boolean}> = ({f, dense = false}) => <g>
  <g opacity={dense ? 0.28 : 0.22}>
    {Array.from({length: 7}, (_, i) => {
      const y = 330 + i * 128;
      return <path key={i} d={`M 92 ${y} C 285 ${y - 42}, 490 ${y + 52}, 690 ${y - 20} S 900 ${y + 24}, 990 ${y - 12}`}
        fill="none" stroke={i % 3 === 0 ? SPACE.signal : SPACE.ash} strokeWidth={i % 3 === 0 ? 4 : 3}
        strokeDasharray={i % 2 ? '17 14' : '7 19'} strokeDashoffset={-f * (0.18 + i * 0.025)} />;
    })}
  </g>
  {[78, 892].map((x, side) => <g key={x} transform={`translate(${x} 390)`}>
    <rect width={110} height={610} rx={18} fill={SPACE.ink} opacity={0.52} stroke={SPACE.graphite} strokeWidth={7}/>
    {Array.from({length: 6}, (_, i) => <g key={i} transform={`translate(13 ${18 + i * 96})`}>
      <rect width={84} height={76} rx={11} fill={SPACE.graphite} opacity={0.58} stroke={SPACE.ash} strokeWidth={3}/>
      <circle cx={21} cy={24} r={7} fill={(i + side) % 3 === 0 ? SPACE.signal : SPACE.ivory}
        opacity={0.62 + 0.22 * Math.sin(f / 16 + i * 1.7)}/>
      <circle cx={43} cy={24} r={5} fill={SPACE.neutral} opacity={0.62}/>
      <path d="M 14 51 H 70 M 14 62 H 51" stroke={SPACE.neutral} strokeWidth={5} strokeLinecap="round" opacity={0.7}/>
    </g>)}
  </g>)}
</g>;
