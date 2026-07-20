import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {Stage3D, Plane, Extrude, CastShadow3D, Camera} from './lib/stage3d';
import {tones, RimLight} from './lib/lighting';

// =============================================================================
// TwentyFiveD — a PROOF scene for the true-2.5D engine (UPGRADE_BACKLOG #1).
// A boreal Alaska range with real depth: layered ridgeline / treeline planes, a
// dimensional extruded sensor beacon hero with a projected cast shadow, and ONE
// virtual camera that dollies THROUGH the treeline while orbiting slightly. The
// companion `BorealFlat` renders the SAME art with no depth/camera, for a
// side-by-side "before/after". If the 2.5D read clears the bar, we migrate the
// Episode scenes onto this engine.
// =============================================================================

const INK = '#101423';
const NIGHT = '#141F38';
const SKY_MID = '#26406e';
const ROSE = '#E8A87C';
const SPRUCE = '#243A2E';
const SPRUCE_HI = '#3d6349';
const GUN = '#8C99A8';
const AMBER = '#FFCE6B';
const IR_CIT = '#FFE24A';

const W = 1080, H = 1920;

// ---- a single spruce silhouette (authored flat, placed at any depth) ----
const Spruce: React.FC<{x: number; y: number; h: number; fill: string; seed?: number}> = ({x, y, h, fill, seed = 0}) => {
  const w = h * 0.5;
  const tiers = 4;
  const parts = [];
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const ty = y - h * (0.18 + t * 0.8);
    const tw = w * (1 - t * 0.62);
    const th = h * 0.34;
    parts.push(<path key={i} d={`M${x - tw},${ty} L${x},${ty - th} L${x + tw},${ty} Z`} fill={fill} />);
  }
  return (
    <g>
      <rect x={x - 5} y={y - h * 0.2} width={10} height={h * 0.2} fill="#2a1c12" />
      {parts}
    </g>
  );
};

// a ridge/tree band that fills the frame at its plane (authored to cover W x H)
const TreeBand: React.FC<{baseY: number; h: number; fill: string; count: number; step: number; jitter?: number}> = ({baseY, h, fill, count, step, jitter = 0}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
    {Array.from({length: count}).map((_, i) => {
      const x = i * step - step;
      const hh = h * (0.72 + ((i * 37 + jitter) % 40) / 100);
      return <Spruce key={i} x={x} y={baseY} h={hh} fill={fill} seed={i} />;
    })}
  </svg>
);

const Ridge: React.FC<{baseY: number; amp: number; fill: string}> = ({baseY, amp, fill}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
    <path d={`M0,${baseY} Q${W * 0.25},${baseY - amp} ${W * 0.5},${baseY - amp * 0.4}
      Q${W * 0.75},${baseY - amp * 1.3} ${W},${baseY - amp * 0.5} L${W},${H} L0,${H} Z`} fill={fill} />
  </svg>
);

const Sky: React.FC = () => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
    <defs>
      <linearGradient id="sky25" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={NIGHT} />
        <stop offset="58%" stopColor={SKY_MID} />
        <stop offset="100%" stopColor={ROSE} />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#sky25)" />
    <ellipse cx={W * 0.62} cy={H * 0.66} rx={520} ry={150} fill="#F4A65B" opacity={0.28} />
    {Array.from({length: 26}).map((_, i) => (
      <circle key={i} cx={(i * 173) % W} cy={(i * 89) % (H * 0.4)} r={1.8} fill="#fff" opacity={0.5} />
    ))}
  </svg>
);

// ---- the dimensional hero: an extruded hexagonal sensor beacon ----
const hexPath = (cx: number, cy: number, r: number) => {
  const p = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    p.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a) * 0.62}`);
  }
  return p.join(' ');
};

const SensorBeacon: React.FC<{f: number}> = ({f}) => {
  const bodyT = tones(GUN);
  const pulse = 0.6 + 0.4 * Math.sin(f / 8);
  return (
    <div style={{position: 'absolute', left: W / 2 - 150, top: H * 0.5 - 140, width: 300, height: 420, transformStyle: 'preserve-3d'}}>
      {/* the extruded hexagonal prism body (real thickness) */}
      <Extrude depth={90} slices={10} dir={{x: 0.5, y: 0.2}} render={(shade) => {
        const col = shade > 0.85 ? bodyT.key : shade > 0.6 ? bodyT.base : shade > 0.4 ? bodyT.core : bodyT.shade;
        return (
          <svg width={300} height={420} viewBox="0 0 300 420" style={{position: 'absolute'}}>
            <polygon points={hexPath(150, 250, 120)} fill={col} />
            <rect x={30} y={130} width={240} height={130} fill={col} />
            <polygon points={hexPath(150, 130, 120)} fill={col} />
          </svg>
        );
      }} />
      {/* front-face detail: lit hex cap, glowing lens, rim, mast */}
      <svg width={300} height={420} viewBox="0 0 300 420" style={{position: 'absolute', transform: 'translateZ(2px)'}}>
        <polygon points={hexPath(150, 130, 120)} fill={bodyT.key} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <polygon points={hexPath(150, 122, 96)} fill="none" stroke={bodyT.shade} strokeWidth={3} opacity={0.5} />
        {/* the sensor eye */}
        <circle cx={150} cy={126} r={40} fill="#12161f" stroke={INK} strokeWidth={5} />
        <circle cx={150} cy={126} r={28} fill={AMBER} opacity={0.5 + 0.4 * pulse} />
        <circle cx={150} cy={126} r={14} fill={IR_CIT} opacity={0.7 + 0.3 * pulse} />
        <circle cx={142} cy={118} r={5} fill="#fff" opacity={0.9} />
        {/* body rim + panel seams on the front */}
        <rect x={30} y={130} width={240} height={130} fill="none" stroke={INK} strokeWidth={6} />
        <line x1={30} y1={170} x2={270} y2={170} stroke={bodyT.shade} strokeWidth={3} opacity={0.5} />
        {[70, 150, 230].map((rx, i) => <circle key={i} cx={rx} cy={200} r={6} fill={bodyT.core} stroke={INK} strokeWidth={2.5} />)}
        {/* mast + blinker */}
        <rect x={146} y={16} width={8} height={30} fill={bodyT.core} stroke={INK} strokeWidth={3} />
        <circle cx={150} cy={14} r={7} fill={(f % 40) < 20 ? '#ff5a4d' : '#5a1f1c'} stroke={INK} strokeWidth={2.5} />
        {/* rim light on the lit (upper-left) hex edges */}
        <polygon points={hexPath(150, 130, 120)} fill="none" stroke={bodyT.key} strokeWidth={4} opacity={0.55} style={{mixBlendMode: 'screen'}} />
      </svg>
    </div>
  );
};

// camera: a strong dolly IN through the treeline + a truck + an orbit that reveals
// the hero's dimensional side wall + a gentle boom. Eased so it reads cinematic.
function cam(f: number): Camera {
  const p = interpolate(f, [0, 150], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return {
    z: interpolate(p, [0, 1], [-260, 980]),           // push from behind, deep through the treeline
    x: interpolate(p, [0, 1], [-140, 150]),           // truck across (drives the parallax)
    y: interpolate(p, [0, 1], [40, -30]),             // gentle boom up
    rotY: interpolate(p, [0, 1], [-16, 15]),          // orbit past the hero (reveals extruded side)
  };
}

const GROUND_Y = H * 0.72;

const SceneContents: React.FC<{f: number; flat: boolean}> = ({f, flat}) => {
  // in flat mode everything collapses to z=0 with no camera parallax
  const z = (d: number) => (flat ? 0 : d);
  return (
    <>
      <Plane z={z(1900)} fill><Sky /></Plane>
      <Plane z={z(1300)} fill><Ridge baseY={GROUND_Y - 40} amp={260} fill="#2f3f63" /></Plane>
      <Plane z={z(950)} fill><TreeBand baseY={GROUND_Y} h={150} fill="#1c3024" count={20} step={70} jitter={3} /></Plane>
      <Plane z={z(520)} fill><TreeBand baseY={GROUND_Y + 30} h={230} fill={SPRUCE} count={16} step={92} jitter={7} /></Plane>
      {/* ground plane */}
      <Plane z={z(240)} fill>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
          <rect x={0} y={GROUND_Y + 90} width={W} height={H} fill="#1a2530" />
          <rect x={0} y={GROUND_Y + 90} width={W} height={40} fill="#233240" opacity={0.6} />
        </svg>
      </Plane>
      {/* hero + its cast shadow (shadow sits on the ground plane behind the hero) */}
      <Plane z={z(120)}>
        <CastShadow3D x={W / 2 - 120} y={GROUND_Y + 150} scaleX={1.4} lean={0.7} squash={0.22} blur={16} opacity={0.36}>
          <svg width={320} height={200} viewBox="0 0 320 200"><polygon points={hexPath(160, 120, 120)} fill="#000" /><rect x={40} y={40} width={240} height={110} fill="#000" /></svg>
        </CastShadow3D>
        <SensorBeacon f={f} />
      </Plane>
      {/* a couple NEAR spruces that sweep fast past the camera (foreground parallax) */}
      <Plane z={z(40)}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
          <Spruce x={90} y={H * 0.98} h={620} fill="#15251b" />
          <Spruce x={W - 70} y={H * 1.02} h={720} fill="#12211a" />
        </svg>
      </Plane>
    </>
  );
};

export const TwentyFiveD: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      <Stage3D camera={cam(f)} background={NIGHT}>
        <SceneContents f={f} flat={false} />
      </Stage3D>
      <div style={{position: 'absolute', left: 30, top: 30, background: IR_CIT, color: INK, fontFamily: 'Arial Black', fontWeight: 900, fontSize: 30, padding: '6px 16px', borderRadius: 8}}>TRUE 2.5D</div>
    </AbsoluteFill>
  );
};

export const BorealFlat: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      <Stage3D camera={{}} background={NIGHT}>
        <SceneContents f={f} flat={true} />
      </Stage3D>
      <div style={{position: 'absolute', left: 30, top: 30, background: '#9fb2d6', color: INK, fontFamily: 'Arial Black', fontWeight: 900, fontSize: 30, padding: '6px 16px', borderRadius: 8}}>FLAT (before)</div>
    </AbsoluteFill>
  );
};
