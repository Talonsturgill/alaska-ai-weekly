import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {MainStreetBG, OilfieldBG} from './lib/biomes';

// look-dev: 2x2 grid. main street day + dusk, oilfield winter + summer.
const Cell: React.FC<{top: number; left: number; label: string; children: React.ReactNode}> = ({top, left, label, children}) => (
  <div style={{position: 'absolute', top, left, width: 540, height: 960, overflow: 'hidden'}}>
    <div style={{position: 'absolute', transform: 'scale(0.5)', transformOrigin: 'top left', width: 1080, height: 1920}}>
      {children}
    </div>
    <div style={{position: 'absolute', left: 16, top: 12, fontFamily: 'Arial, sans-serif', fontWeight: 800, fontSize: 28, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.7)'}}>{label}</div>
  </div>
);

export const BiomeShowcase3: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Cell top={0} left={0} label="MAIN STREET (day)">
        <MainStreetBG f={f} dusk={0} />
      </Cell>
      <Cell top={0} left={540} label="MAIN STREET (dusk)">
        <MainStreetBG f={f} dusk={1} />
      </Cell>
      <Cell top={960} left={0} label="OILFIELD (winter)">
        <OilfieldBG f={f} season="winter" flare={0.9} />
      </Cell>
      <Cell top={960} left={540} label="OILFIELD (summer)">
        <OilfieldBG f={f} season="summer" flare={0.5} />
      </Cell>
    </AbsoluteFill>
  );
};
