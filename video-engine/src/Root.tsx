import React from 'react';
import { Composition } from 'remotion';
import { Dispatch, dispatchSchema, defaultProps } from './Dispatch';
import { Standoff } from './Standoff';
import { z } from 'zod';

const standoffSchema = z.object({
  yesCount: z.number(),
  noLabel: z.string(),
});

// 1080x1920 (9:16), 30fps. "Dispatch" = the full 60s timeline; "Standoff" = the
// confrontation scene (cast + set + dramatic zoom), renderable standalone for
// look-dev and scene review.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Dispatch"
        component={Dispatch}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        schema={dispatchSchema}
        defaultProps={defaultProps}
      />
      <Composition
        id="Standoff"
        component={Standoff}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
        schema={standoffSchema}
        defaultProps={{ yesCount: 500, noLabel: 'fewer than 12 in favor' }}
      />
    </>
  );
};
