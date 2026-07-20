import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FjordBG, GlacierBG, RiverBG} from './lib/biomes';

// look-dev: 2x2 grid, each cell a half-scale full-frame biome.
// fjord (mist), glacier (mid-calve so the slab reads), river fall + summer.
const Cell: React.FC<{top: number; left: number; label: string; children: React.ReactNode}> = ({top, left, label, children}) => (
  <div style={{position: 'absolute', top, left, width: 540, height: 960, overflow: 'hidden'}}>
    <div style={{position: 'absolute', transform: 'scale(0.5)', transformOrigin: 'top left', width: 1080, height: 1920}}>
      {children}
    </div>
    <div style={{position: 'absolute', left: 16, top: 12, fontFamily: 'Arial, sans-serif', fontWeight: 800, fontSize: 28, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.7)'}}>{label}</div>
  </div>
);

export const BiomeShowcase2: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Cell top={0} left={0} label="FJORD">
        <FjordBG f={f} mist={0.8} />
      </Cell>
      <Cell top={0} left={540} label="GLACIER (calve 0.5)">
        <GlacierBG f={f} calve={0.5} />
      </Cell>
      <Cell top={960} left={0} label="RIVER (fall)">
        <RiverBG f={f} season="fall" riffle={0.8} />
      </Cell>
      <Cell top={960} left={540} label="RIVER (summer)">
        <RiverBG f={f} season="summer" riffle={0.6} />
      </Cell>
    </AbsoluteFill>
  );
};
