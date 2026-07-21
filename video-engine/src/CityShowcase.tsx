import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AnchorageSkylineBG} from './lib/biomes';
import {Moose} from './lib/fauna';
import {GradeLayer} from './lib/lighting';

// Look-dev: the Anchorage skyline biome + the downtown-moose insider gag.
export const CityShowcase: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AnchorageSkylineBG f={f} season="fall" denali floatplane train />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform="translate(300,1810) scale(0.9)"><Moose x={0} y={0} f={f} facing={1} /></g>
      </svg>
      <GradeLayer f={f} bloom={0.4} vignette={0.42} grain={0.05} warmth={0.08} />
    </AbsoluteFill>
  );
};
