import React from 'react';
import { Composition } from 'remotion';
import { Episode, episodeSchema } from './Episode';
import { Standoff } from './Standoff';
import { FaunaShowcase } from './FaunaShowcase';
import { z } from 'zod';

const standoffSchema = z.object({
  yesCount: z.number(),
  noLabel: z.string(),
});

// 1080x1920 (9:16), 30fps. "Dispatch" = the full episode timeline (6 scenes wired
// to the VO line anchors, captions overlaid). "Standoff" kept for look-dev.
// 2026-07-18: retimed to the Gemini-narrated VO (out/dispatch/vo_lines.json,
// 67.52s = 2026 frames @ 30fps incl. tail; switched off the cloned voice per
// owner). DEFAULT_BOUNDS below is the fallback; episode_props.json (from
// scripts/build_scenes.py) carries the authoritative per-run scene timing.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Dispatch"
        component={Episode}
        durationInFrames={2026}
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
      <Composition
        id="FaunaShowcase"
        component={FaunaShowcase}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
