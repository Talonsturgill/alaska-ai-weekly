import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { z } from 'zod';

// ---- Brand palette (2.5D flat infographic) ----
const BG_DEEP = '#0b1a2b';   // deep navy
const BG_MID = '#12314f';    // mid slate-blue (parallax layer)
const ICE = '#e8f4ff';       // near-white ice
const AMBER = '#ffb347';     // accent / data
const LANDMASS = '#1e4a73';  // Alaska silhouette fill

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

// Simplified flat Alaska silhouette (SVG polygon approximation, viewBox 0 0 100 60).
const ALASKA_PATH =
  'M8,20 L20,14 L30,16 L34,10 L42,12 L46,7 L52,10 L60,9 L70,13 L82,12 ' +
  'L92,18 L88,24 L78,26 L82,32 L74,34 L70,42 L60,44 L54,40 L48,46 ' +
  'L40,44 L34,50 L28,46 L22,50 L16,44 L20,36 L12,34 L16,28 L8,26 Z';

// North Slope pulsing dot, in the same 100x60 viewBox (upper-north area).
const DOT_X = 60;
const DOT_Y = 13;

const ParallaxBg: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Two layers drift at different speeds for depth.
  const back = interpolate(frame, [0, durationInFrames], [0, -40]);
  const front = interpolate(frame, [0, durationInFrames], [0, -90]);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_DEEP, overflow: 'hidden' }}>
      {/* back layer: large soft blobs */}
      <AbsoluteFill style={{ transform: `translateX(${back}px)` }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 120 + i * 430,
              left: -120 + i * 260,
              width: 520,
              height: 520,
              borderRadius: '50%',
              background: BG_MID,
              opacity: 0.5,
            }}
          />
        ))}
      </AbsoluteFill>
      {/* front layer: thin diagonal grid lines */}
      <AbsoluteFill
        style={{
          transform: `translateX(${front}px)`,
          backgroundImage:
            `repeating-linear-gradient(115deg, ${ICE}0d 0 2px, transparent 2px 90px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Headline: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, mass: 0.9 } });
  const y = interpolate(s, [0, 1], [140, 0]);
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        top: 150,
        left: 70,
        right: 70,
        transform: `translateY(${y}px)`,
        opacity,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 6, color: AMBER }}>
        ALASKA.AI DISPATCH
      </div>
      <div
        style={{
          fontSize: 118,
          lineHeight: 1.02,
          fontWeight: 900,
          color: ICE,
          marginTop: 18,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const AlaskaMap: React.FC<{ dotLabel: string }> = ({ dotLabel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - 18, fps, config: { damping: 16 } });
  const scale = interpolate(reveal, [0, 1], [0.85, 1]);
  const opacity = interpolate(frame, [18, 34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Pulsing dot
  const pulse = Math.sin((frame / fps) * Math.PI * 2 * 1.1);
  const dotR = 2.2 + pulse * 0.5;
  const ringR = interpolate((frame % 45) / 45, [0, 1], [2.2, 9]);
  const ringO = interpolate((frame % 45) / 45, [0, 1], [0.6, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        top: 640,
        left: 60,
        right: 60,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <svg viewBox="0 0 100 60" width="100%" style={{ display: 'block' }}>
        <path d={ALASKA_PATH} fill={LANDMASS} stroke={ICE} strokeWidth={0.6} strokeOpacity={0.5} />
        <circle cx={DOT_X} cy={DOT_Y} r={ringR} fill="none" stroke={AMBER} strokeWidth={0.5} opacity={ringO} />
        <circle cx={DOT_X} cy={DOT_Y} r={dotR} fill={AMBER} />
      </svg>
      <div style={{ textAlign: 'center', color: ICE, fontSize: 40, fontWeight: 700, marginTop: 24 }}>
        <span style={{ color: AMBER }}>&#9679;</span> {dotLabel}
      </div>
    </div>
  );
};

const Counter: React.FC<{ count: number; label: string }> = ({ count, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 45;
  const t = interpolate(frame, [start, start + 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const value = Math.round(t * count);
  const pop = spring({ frame: frame - start, fps, config: { damping: 12 } });
  const scale = interpolate(pop, [0, 1], [0.6, 1]);
  const opacity = interpolate(frame, [start, start + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 230,
        left: 70,
        right: 70,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: 'left bottom',
      }}
    >
      <div style={{ fontSize: 180, fontWeight: 900, color: AMBER, lineHeight: 1 }}>
        {value}+
      </div>
      <div style={{ fontSize: 52, fontWeight: 700, color: ICE, letterSpacing: 2 }}>
        {label}
      </div>
    </div>
  );
};

export const Dispatch: React.FC<z.infer<typeof dispatchSchema>> = (props) => {
  return (
    <AbsoluteFill style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <ParallaxBg />
      {/* Hook scene ~8s (0-240 frames) */}
      <Sequence durationInFrames={240}>
        <Headline text={props.headline} />
        <AlaskaMap dotLabel={props.dotLabel} />
        <Counter count={props.commentCount} label={props.commentLabel} />
      </Sequence>
    </AbsoluteFill>
  );
};
