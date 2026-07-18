import React from 'react';
import { Composition } from 'remotion';
import { Episode, episodeSchema } from './Episode';
import { Standoff } from './Standoff';
import { z } from 'zod';

const standoffSchema = z.object({
  yesCount: z.number(),
  noLabel: z.string(),
});

// 1080x1920 (9:16), 30fps. "Dispatch" = the full episode timeline (6 scenes wired
// to the VO line anchors, captions overlaid). "Standoff" kept for look-dev.
// 2026-07-18: retimed to the actual synthesized VO (out/dispatch/vo_lines.json,
// 53.34s = 1600 frames @ 30fps).
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Dispatch"
        component={Episode}
        durationInFrames={1633}
        fps={30}
        width={1080}
        height={1920}
        schema={episodeSchema}
        defaultProps={{ captions: [] }}
      />
      <Composition
        id="Standoff"
        component={Standoff}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
        schema={standoffSchema}
        defaultProps={{ yesCount: 500, noLabel: 'fewer than a dozen in favor' }}
      />
    </>
  );
};
