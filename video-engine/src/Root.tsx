import React from 'react';
import { Composition } from 'remotion';
import { Dispatch, dispatchSchema, defaultProps } from './Dispatch';

// 1080x1920 (9:16), 30fps, 60s = 1800 frames. Composition name: "Dispatch".
export const RemotionRoot: React.FC = () => {
  return (
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
  );
};
