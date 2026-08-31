import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EvidenceColumn, EVIDENCE, RadarGroundCutaway, SeedDrone} from './lib/evidence_state';

const BOLD = 'Archivo, Arial Black, Arial, sans-serif';
const MONO = 'JetBrains Mono, Consolas, monospace';

export const EvidenceLook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#A9DCE8'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <linearGradient id="lookSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#63D7F2" />
            <stop offset="1" stopColor="#E8F4EE" />
          </linearGradient>
        </defs>
        <rect data-band="ok" width={1080} height={1920} fill="url(#lookSky)" />
        <text x={64} y={92} fontFamily={BOLD} fontSize={46} fontWeight={900} fill={EVIDENCE.ink}>EVIDENCE LOOK · 0.28 GATE</text>

        <g transform="translate(230 370)">
          <SeedDrone f={f} scale={0.72} flareLoad={1} />
          <text x={0} y={190} textAnchor="middle" fontFamily={MONO} fontSize={22} fill={EVIDENCE.ink}>SEEDDRONE · NO LOCK · NO TANK</text>
        </g>
        <g transform="translate(510 220)">
          <SeedDrone f={f} scale={0.28} flareLoad={1} />
          <text x={0} y={86} textAnchor="middle" fontFamily={MONO} fontSize={18} fill={EVIDENCE.ink}>0.28</text>
        </g>

        <g transform="translate(210 770)"><EvidenceColumn f={f} scale={0.68} ground="unknown" compact /></g>
        <g transform="translate(550 770)"><EvidenceColumn f={f} scale={0.68} record={1} radar={1} interpretation={1} model={1} ground="unknown" compact /></g>
        <g transform="translate(875 770)"><EvidenceColumn f={f} scale={0.68} record={1} radar={1} interpretation={1} model={1} ground="unreported" compact interpretationSide="left" /></g>
        <text x={200} y={1090} textAnchor="middle" fontFamily={MONO} fontSize={20} fill={EVIDENCE.ink}>UNKNOWN</text>
        <text x={540} y={1090} textAnchor="middle" fontFamily={MONO} fontSize={20} fill={EVIDENCE.ink}>OBSERVED + MODEL</text>
        <text x={870} y={1090} textAnchor="middle" fontFamily={MONO} fontSize={20} fill={EVIDENCE.ink}>NOT REPORTED</text>

        <g transform="translate(540 1450)">
          <RadarGroundCutaway f={f} scale={0.74} groundEvidence="unreported" modelProgress={1} />
        </g>
        <g transform="translate(870 1260) scale(0.28)">
          <RadarGroundCutaway f={f} groundEvidence="unreported" modelProgress={1} />
        </g>
        <text x={540} y={1810} textAnchor="middle" fontFamily={BOLD} fontSize={34} fontWeight={900} fill={EVIDENCE.ink}>
          41.70–89.35 ACRE-FEET · NOT TOTAL UNCERTAINTY
        </text>
      </svg>
    </AbsoluteFill>
  );
};
