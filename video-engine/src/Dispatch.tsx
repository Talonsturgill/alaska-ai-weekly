import React from 'react';
import {z} from 'zod';
import {IGSHook} from './IGSHook';

export const dispatchSchema = z.object({
  headline: z.string(),
  commentCount: z.number(),
  commentLabel: z.string(),
  dotLabel: z.string(),
});

export const defaultProps: z.infer<typeof dispatchSchema> = {
  headline: 'The AI boom wants Alaska',
  commentCount: 500,
  commentLabel: 'public comments',
  dotLabel: 'North Slope',
};

// The Dispatch composition renders the scene timeline. Today: the IGS-grade hook
// scene (docs/craft/INFOGRAPHIC_2_5D.md — character-anchored, everything outlined
// and shaded, every element a story element). The first slide-like PoC scene was
// retired after comparing frames against the real Infographics Show.
export const Dispatch: React.FC<z.infer<typeof dispatchSchema>> = (props) => {
  return <IGSHook {...props} />;
};
