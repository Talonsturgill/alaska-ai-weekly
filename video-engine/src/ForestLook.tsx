import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Grove, Thermometer} from './lib/forest';

// =============================================================================
// ForestLook: the measuring stand for the forest family's beat idle (machine pass 2026-11-16).
// "The Forest Can't Stand on the Ice" (11-16) drew its hero troupe and its thermometer with the
// lib's sine idles only, and every seat named them near-static on the held strips ("S2 hero tree
// barely moves", "S12 thermometer and back troupe little breath"). `mode` 'bare' draws a Grove and
// a Thermometer exactly as that film did (no cues); 'rig' passes the same five cues to both, so
// they perform on the beat through lib/figureidle's figureIdle. scripts/forest_look_check.py
// renders the frames either side of every cue through the held_beat_check Chrome path and measures
// the camera-solved whole-frame change, one subject at a time (`subject`).
// =============================================================================

export const FOREST_CUES = [30, 75, 120, 165, 210];

export const ForestLook: React.FC<{mode?: 'bare' | 'rig'; subject?: 'both' | 'grove' | 'thermo'}> = ({mode = 'bare', subject = 'both'}) => {
  const f = useCurrentFrame();
  const cues = mode === 'rig' ? FOREST_CUES : undefined;
  return (
    <AbsoluteFill style={{backgroundColor: '#1E2A44'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <rect width={1080} height={1920} fill="#1E2A44" />
        <rect y={1180} width={1080} height={740} fill="#C9D3E2" />
        {subject !== 'thermo' && (
          <Grove x={620} y={1300} f={f} cols={4} rows={2} dx={170} dy={80} scale={0.9} seed={21} lookAt={540} emotion="curious" cues={cues} />
        )}
        {subject !== 'grove' && (
          <Thermometer x={190} y={1330} scale={1.1} f={f} level={0.55} glasses emotion="calm" cues={cues} />
        )}
      </svg>
    </AbsoluteFill>
  );
};
