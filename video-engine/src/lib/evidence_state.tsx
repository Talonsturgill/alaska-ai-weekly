import React from 'react';
import {ClaimChip} from './vision';
import {Simulated, SIM} from './simulation';
import {Unnamed} from './absence';
import {FormGradient, RimLight, tones} from './lighting';

// Evidence is not a color legend applied after drawing. The union below decides what
// callers are allowed to construct. Modeled and unmeasured states accept paths, never
// arbitrary children, so neither can accidentally inherit a fill, light, floor or shadow.
export type EvidenceStateProps =
  | {state: 'observed'; children: React.ReactNode}
  | {state: 'interpreted'; x: number; y: number; source: string; label: string; sublabel: string; op?: number; w?: number}
  | {state: 'modeled'; d: string; fidelity: number; f: number; x?: number; y?: number; scale?: number; phase?: number; drawn?: number; occupied?: number; strokeWidth?: number}
  | {state: 'unmeasured'; d: string; label: string; f: number; x?: number; y?: number; scale?: number; phase?: number; wide?: number; tall?: number; labelSide?: 'below' | 'above' | 'right'; labelSize?: number; strokeWidth?: number};

export const EvidenceState: React.FC<EvidenceStateProps> = (props) => {
  if (props.state === 'observed') return <g>{props.children}</g>;
  if (props.state === 'interpreted') {
    return <ClaimChip x={props.x} y={props.y} text={props.label} sub={`${props.source} · ${props.sublabel}`} op={props.op} w={props.w} />;
  }
  if (props.state === 'modeled') {
    return <Simulated d={props.d} fidelity={props.fidelity} f={props.f} x={props.x} y={props.y}
      scale={props.scale} phase={props.phase} drawn={props.drawn} occupied={props.occupied}
      strokeWidth={props.strokeWidth} />;
  }
  return <Unnamed d={props.d} label={props.label} f={props.f} x={props.x} y={props.y}
    scale={props.scale} phase={props.phase} wide={props.wide} tall={props.tall}
    labelSide={props.labelSide} labelSize={props.labelSize} strokeWidth={props.strokeWidth}
    solid={0} />;
};

export const EVIDENCE = {
  ink: '#13212A',
  nickel: '#B9C6CE',
  nickelDark: '#71818D',
  radar: '#7968E8',
  model: SIM,
  spruce: '#164B3B',
  cloud: '#63D7F2',
  flare: '#F26B45',
  paper: '#F3ECDD',
} as const;

const hoopPath = 'M -82 0 A 82 34 0 1 0 82 0 A 82 34 0 1 0 -82 0';
const groundPath = 'M -82 -22 L -82 16 Q 0 58 82 16 L 82 -22';

export const EvidenceColumn: React.FC<{
  f: number; x?: number; y?: number; scale?: number;
  record?: number; radar?: number; interpretation?: number; model?: number;
  ground?: 'unknown' | 'unreported' | 'confirmed'; compact?: boolean;
  interpretationSide?: 'left' | 'right';
}> = ({f, x = 0, y = 0, scale = 1, record = 0, radar = 0, interpretation = 0,
  model = 0, ground = 'unknown', compact = false, interpretationSide = 'right'}) => {
  const nickelT = tones(EVIDENCE.nickel);
  const gap = compact ? 142 : 172;
  const ys = [-gap, 0, gap];
  const opRecord = Math.max(0.18, record);
  const opRadar = Math.max(0.18, radar);
  const modelDrawn = Math.max(0, Math.min(1, model));
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <FormGradient id={`evidenceNickel${Math.round(x)}${Math.round(y)}`} t={nickelT} />
      <path d={`M 0 ${ys[0] - 70} L 0 ${ys[2] + 78}`} stroke={EVIDENCE.ink} strokeWidth={14} strokeLinecap="round" opacity={0.72} />
      <path d={`M 0 ${ys[0] - 70} L 0 ${ys[2] + 78}`} stroke={EVIDENCE.nickelDark} strokeWidth={7} strokeLinecap="round" />

      <EvidenceState state="observed">
        <g opacity={opRecord}>
          <path d={hoopPath} transform={`translate(0 ${ys[0]})`} fill={record > 0.55 ? EVIDENCE.nickel : 'none'}
            fillOpacity={0.22} stroke={EVIDENCE.ink} strokeWidth={10} />
          <path d={hoopPath} transform={`translate(0 ${ys[0]})`} fill="none" stroke={EVIDENCE.nickel}
            strokeWidth={5} strokeDasharray={record > 0.55 ? undefined : '18 14'} />
          {record > 0.55 && <rect x={58} y={ys[0] - 16} width={35} height={32} rx={4} fill={EVIDENCE.nickel} stroke={EVIDENCE.ink} strokeWidth={5} />}
        </g>
      </EvidenceState>
      <text x={0} y={ys[0] - 54} textAnchor="middle" fill={EVIDENCE.ink} fontSize={compact ? 20 : 24}
        fontWeight={900} fontFamily="Archivo, Arial Black, sans-serif">COMPANY FLIGHT RECORD</text>

      <EvidenceState state="observed">
        <g opacity={opRadar}>
          <path d={hoopPath} transform={`translate(0 ${ys[1]})`} fill={radar > 0.55 ? EVIDENCE.radar : 'none'}
            fillOpacity={0.18} stroke={EVIDENCE.ink} strokeWidth={10} />
          <path d={hoopPath} transform={`translate(0 ${ys[1]})`} fill="none" stroke={radar > 0.55 ? EVIDENCE.radar : EVIDENCE.nickel}
            strokeWidth={5} strokeDasharray={radar > 0.55 ? undefined : '18 14'} />
          {radar > 0.55 && <rect x={58} y={ys[1] - 16} width={35} height={32} rx={4} fill={EVIDENCE.radar} stroke={EVIDENCE.ink} strokeWidth={5} />}
        </g>
      </EvidenceState>
      <text x={0} y={ys[1] - 54} textAnchor="middle" fill={EVIDENCE.ink} fontSize={compact ? 20 : 24}
        fontWeight={900} fontFamily="Archivo, Arial Black, sans-serif">OBSERVED RADAR</text>

      {ground === 'unknown' && (
        <g transform={`translate(0 ${ys[2]})`}>
          <path d={groundPath} fill="none" stroke={EVIDENCE.nickel} strokeWidth={7} strokeLinecap="round" />
          <text x={0} y={82} textAnchor="middle" fill={EVIDENCE.ink} fontSize={compact ? 22 : 27}
            fontWeight={900} fontFamily="Archivo, Arial Black, sans-serif">GROUND?</text>
        </g>
      )}
      {ground === 'unreported' && (
        <EvidenceState state="unmeasured" d={groundPath} label="NOT REPORTED" f={f}
          x={0} y={ys[2]} wide={164} tall={96} labelSize={compact ? 18 : 22} strokeWidth={5} />
      )}
      {ground === 'confirmed' && (
        <EvidenceState state="observed">
          <g transform={`translate(0 ${ys[2]})`}>
            <path d={groundPath} fill={EVIDENCE.nickel} fillOpacity={0.2} stroke={EVIDENCE.ink} strokeWidth={9} />
            <path d={groundPath} fill="none" stroke={EVIDENCE.nickel} strokeWidth={5} />
            <text x={0} y={82} textAnchor="middle" fill={EVIDENCE.ink} fontSize={compact ? 20 : 24}
              fontWeight={900} fontFamily="Archivo, Arial Black, sans-serif">SURFACE CONFIRMED</text>
          </g>
        </EvidenceState>
      )}

      {modelDrawn > 0 && (
        <EvidenceState state="modeled" d={`M -24 ${ys[1] - 14} C 28 ${ys[1] + 48}, -34 ${ys[2] - 84}, 0 ${ys[2] - 18}`}
          fidelity={ground === 'unknown' ? 0.65 : 0.42} f={f} drawn={modelDrawn} occupied={0} strokeWidth={4} phase={2.7} />
      )}
      {interpretation > 0 && (
        <EvidenceState state="interpreted" x={interpretationSide === 'left' ? -222 : 222} y={ys[1]} source="RAINMAKER"
          label="COMPANY INTERPRETATION" sublabel="ATTRIBUTED" op={interpretation} w={330} />
      )}
      <RimLight d={`M -8 ${ys[0] - 70} L -8 ${ys[2] + 70}`} color="#FFFFFF" w={3} opacity={0.34} />
    </g>
  );
};

export const SeedDrone: React.FC<{
  f: number; x?: number; y?: number; scale?: number; facing?: 1 | -1;
  flareLoad?: number; landed?: number;
}> = ({f, x = 0, y = 0, scale = 1, facing = 1, flareLoad = 0.7, landed = 0}) => {
  const bodyT = tones('#8C99A8');
  const id = `seedDrone${Math.round(x)}${Math.round(y)}`;
  const bob = (1 - landed) * (3 * Math.sin(f / 18));
  const spin = (f * 29) % 360;
  const loads = Math.max(0, Math.min(1, flareLoad));
  return (
    <g transform={`translate(${x},${y + bob}) scale(${scale * facing},${scale})`}>
      <FormGradient id={id} t={bodyT} />
      {[[-142, -18], [142, -18], [-112, 30], [112, 30]].map(([ax, ay], i) => (
        <g key={i}>
          <path d={`M 0 0 L ${ax} ${ay}`} stroke={EVIDENCE.ink} strokeWidth={16} strokeLinecap="round" />
          <path d={`M 0 0 L ${ax} ${ay}`} stroke={bodyT.core} strokeWidth={8} strokeLinecap="round" />
          <circle cx={ax} cy={ay} r={16} fill={bodyT.core} stroke={EVIDENCE.ink} strokeWidth={5} />
          <ellipse cx={ax} cy={ay - 7} rx={54} ry={8} fill="#EAF3F8" opacity={0.22 + 0.08 * Math.sin(spin / 20 + i)} />
          <line x1={ax - 48} y1={ay - 7} x2={ax + 48} y2={ay - 7} stroke="#EEF7FA" strokeWidth={3}
            opacity={0.56} transform={`rotate(${spin * (i % 2 ? -1 : 1)} ${ax} ${ay - 7})`} />
        </g>
      ))}
      <path d="M -94 -12 Q -86 -62 0 -64 Q 86 -62 94 -12 Q 92 42 0 48 Q -92 42 -94 -12 Z"
        fill={`url(#${id})`} stroke={EVIDENCE.ink} strokeWidth={7} />
      <RimLight d="M -88 -18 Q -78 -58 0 -60 Q 72 -58 88 -18" color="#FFFFFF" w={4} opacity={0.54} />
      {/* A neutral sensor window, deliberately not an eye. No iris, blink, gaze or lock ticks. */}
      <rect x={-38} y={-31} width={76} height={34} rx={8} fill="#23343E" stroke={EVIDENCE.ink} strokeWidth={5} />
      <rect x={-28} y={-22} width={56} height={16} rx={4} fill="#87BECB" opacity={0.62} />
      {/* Cloud-seeding flare rack. No suppressant tank or nozzle exists on this asset. */}
      <g transform="translate(0,58)">
        <rect x={-92} y={-10} width={184} height={52} rx={10} fill="#4F5D66" stroke={EVIDENCE.ink} strokeWidth={6} />
        {Array.from({length: 8}, (_, i) => (
          <rect key={i} x={-76 + i * 20} y={2} width={12} height={29} rx={4}
            fill={i / 8 < loads ? EVIDENCE.flare : '#7B858B'} stroke={EVIDENCE.ink} strokeWidth={2} />
        ))}
      </g>
      {[-1, 1].map((s) => <g key={s}>
        <path d={`M ${s * 44} 94 L ${s * 62} 142`} stroke={EVIDENCE.ink} strokeWidth={9} />
        <path d={`M ${s * 34} 142 L ${s * 86} 142`} stroke={EVIDENCE.ink} strokeWidth={9} strokeLinecap="round" />
      </g>)}
    </g>
  );
};

const gaugePath = 'M -44 42 L -44 -28 Q 0 -76 44 -28 L 44 42 Z';
const tracerPath = 'M -24 44 L -24 -30 L 24 -30 L 24 44 Z M -34 -30 L 34 -30';

export const RadarGroundCutaway: React.FC<{
  f: number; x?: number; y?: number; scale?: number;
  modelProgress?: number; groundEvidence?: 'unknown' | 'unreported' | 'confirmed'; comparison?: boolean;
}> = ({f, x = 0, y = 0, scale = 1, modelProgress = 1, groundEvidence = 'unknown', comparison = false}) => {
  const modelD = comparison
    ? 'M 80 -260 C 30 -150 12 -40 0 110'
    : 'M 80 -260 C 58 -176 18 -96 0 -18 M 0 -18 C -54 20 -68 58 -82 92 M 0 -18 C 36 24 56 58 78 92';
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path d="M -470 162 Q -310 72 -150 132 Q 18 42 180 138 Q 332 76 480 156 L 480 320 L -470 320 Z"
        fill={EVIDENCE.spruce} stroke={EVIDENCE.ink} strokeWidth={8} />
      <path d="M -450 -238 Q -70 -390 450 -216" fill="none" stroke={EVIDENCE.ink} strokeWidth={34} opacity={0.42} />
      <path d="M -450 -238 Q -70 -390 450 -216" fill="none" stroke={EVIDENCE.radar} strokeWidth={21} opacity={0.72} />
      <text x={-320} y={-292} fill={EVIDENCE.radar} fontFamily="JetBrains Mono, monospace" fontSize={24} fontWeight={800}>OBSERVED RADAR BEAM</text>
      <EvidenceState state="modeled" d={modelD} fidelity={comparison ? 0.82 : 0.32} f={f}
        drawn={modelProgress} occupied={0} strokeWidth={4} phase={comparison ? 7 : 4} />
      {groundEvidence === 'unknown' && <g>
        <path d="M -148 126 H 148" stroke={EVIDENCE.nickel} strokeWidth={6} />
        <text x={0} y={194} textAnchor="middle" fill={EVIDENCE.paper} fontSize={26} fontWeight={900}
          fontFamily="Archivo, Arial Black, sans-serif">GROUND?</text>
      </g>}
      {groundEvidence === 'unreported' && <g>
        <EvidenceState state="unmeasured" d={gaugePath} label="GROUND GAUGE · NOT REPORTED" f={f}
          x={-142} y={92} scale={0.75} wide={110} tall={120} labelSide="below" labelSize={20} phase={2} strokeWidth={5} />
        <EvidenceState state="unmeasured" d={tracerPath} label="TRACER · NOT REPORTED" f={f}
          x={150} y={92} scale={0.75} wide={110} tall={120} labelSide="below" labelSize={20} phase={5} strokeWidth={5} />
      </g>}
      {groundEvidence === 'confirmed' && <g transform="translate(0 92)">
        <path d={gaugePath} fill={EVIDENCE.nickel} stroke={EVIDENCE.ink} strokeWidth={7} />
        <rect x={-34} y={12} width={68} height={30 + 8 * Math.sin(f / 19)} fill="#A8DCF0" opacity={0.9} />
        <text x={0} y={154} textAnchor="middle" fill={EVIDENCE.paper} fontSize={24} fontWeight={900}
          fontFamily="Archivo, Arial Black, sans-serif">SURFACE GAUGE</text>
      </g>}
    </g>
  );
};
