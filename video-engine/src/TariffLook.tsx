import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Statement, CostStack} from './lib/tariff';
import {UnnamedValue} from './lib/absence';

// Look-dev audition sheet for the 2026-09-23 net-new assets. Render a still
// before any episode scene depends on them (ASSET_MANIFEST convention).
const DUSK = '#3E3852';
const GOLD = '#C9A227';
const COPPER = '#C87137';
const CARBON = '#1F3A5F';
const PAPER = '#EDE7DB';

export const TariffLook: React.FC = () => {
  const f = useCurrentFrame();
  const arrive = Math.min(1, f / 60);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{background: DUSK}}>
      <rect x={0} y={1420} width={1080} height={500} fill={GOLD} opacity={0.55} />

      <Statement
        f={f} x={60} y={70} w={620}
        masthead="U.S. AIR FORCE"
        rows={[
          {label: 'ACREAGE', value: 'ABOUT 4,700'},
          {label: 'PARCELS', value: '12'},
          {label: 'INSTALLATIONS', value: '3'},
          {label: 'POWER DEMAND', value: null},
        ]}
        totalLabel="AWARDED"
        totalValue="NONE YET"
        arrive={arrive}
      />

      <g transform="translate(60,880)">
        <text x={0} y={0} fontFamily="'JetBrains Mono', monospace" fontSize={26}
          fontWeight={800} fill={PAPER} letterSpacing={2}>UnnamedValue, standalone</text>
        <UnnamedValue label="WATER DRAW" f={f} x={0} y={70} w={560} color={PAPER} />
        <UnnamedValue label="SETTLED ROW" f={f} x={0} y={150} w={560} color={PAPER}
          value="14.2" solid={Math.min(1, Math.max(0, (f - 40) / 40))} />
      </g>

      <g transform="translate(0,120)">
        <text x={760} y={40} fontFamily="'JetBrains Mono', monospace" fontSize={24}
          fontWeight={800} fill={PAPER} letterSpacing={2}>SPLIT</text>
        <CostStack f={f} x={780} y={760} w={110} h={520}
          halves={[{name: 'WIRES', frac: 0.45, color: COPPER},
                   {name: 'FUEL', frac: 0.55, color: CARBON}]}
          split={Math.min(1, f / 45)} labelSize={20} />
      </g>

      <g transform="translate(0,300)">
        <text x={120} y={880} fontFamily="'JetBrains Mono', monospace" fontSize={24}
          fontWeight={800} fill={PAPER} letterSpacing={2}>DIVIDED ACROSS 5</text>
        <CostStack f={f} x={300} y={1480} w={110} h={420}
          halves={[{name: 'WIRES', frac: 0.45, color: COPPER},
                   {name: 'FUEL', frac: 0.55, color: CARBON}]}
          customers={5} divide={Math.min(1, f / 50)} labels={false} />
      </g>
    </svg>
  );
};
