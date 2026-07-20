import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AuroraNightBG, TundraBG} from './lib/biomes';
import {Caribou} from './lib/fauna';

// look-dev: top half aurora night (w/ caribou silhouette), bottom half tundra day
export const BiomeShowcase: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <div style={{position: 'absolute', top: 0, left: 0, width: 1080, height: 960, overflow: 'hidden'}}>
        <div style={{position: 'absolute', transform: 'scale(0.5)', transformOrigin: 'top left', width: 1080, height: 1920}}>
          <AuroraNightBG f={f} intensity={1} moon />
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
            <Caribou x={540} y={1560} scale={1.4} f={f} trot={0.3} />
          </svg>
        </div>
      </div>
      <div style={{position: 'absolute', top: 960, left: 0, width: 1080, height: 960, overflow: 'hidden'}}>
        <div style={{position: 'absolute', transform: 'scale(0.5)', transformOrigin: 'top left', width: 1080, height: 1920}}>
          <TundraBG f={f} season="autumn" wind={0.6} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
