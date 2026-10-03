import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {activeCue, captionRows, Cue} from './captionrows';

export {captionRows, activeCue, danglingEnd, DANGLE} from './captionrows';
export type {Cue} from './captionrows';

/** The shared caption card (machine pass 2026-10-03). Same band geometry as Ep1002 and Ep1003
 *  (bar y 1336, 136 high, so scripts/caption_render_check.py's CAPTION_TOP still holds), rows
 *  broken by sense through captionRows, and the sub-0.15 s hold through activeCue. It never
 *  drops a row: the type steps down to fit whatever it is handed. Palette and face are props,
 *  so an episode keeps its look without copying the breaker. */
export const CaptionBar: React.FC<{
  cues: Cue[];
  bar?: string;
  ink?: string;
  edge?: string;
  font?: string;
  max?: number;
  opacity?: number;
}> = ({cues, bar = '#0A1418', ink = '#F4EEE0', edge, font = "'JetBrains Mono', monospace", max = 37, opacity = 0.95}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = activeCue(cues, frame / fps);
  if (!c) return null;
  const rows = captionRows(c.text, max);
  const fs = rows.length >= 4 ? 27 : rows.length === 3 ? 32 : 39;
  const step = rows.length >= 4 ? 30 : rows.length === 3 ? 37 : 49;
  const y0 = rows.length === 1 ? 1420 : rows.length === 2 ? 1390 : rows.length === 3 ? 1378 : 1366;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect x={68} y={1336} width={944} height={136} rx={16} fill={bar} stroke={edge ?? ink} strokeWidth={3} opacity={opacity} data-band="ok" />
      {rows.map((s, i) => (
        <text key={i} x={540} y={y0 + i * step} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={fs} fill={ink} data-band="ok">{s}</text>
      ))}
    </svg>
  );
};
