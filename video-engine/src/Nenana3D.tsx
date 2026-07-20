import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {Stage3D, Plane, Card, Solidify, Atmosphere, CastShadow3D, Camera} from './lib/stage3d';
import {Vale} from './lib/kit';
import {GradeLayer} from './lib/lighting';

// =============================================================================
// Nenana3D — the VERTICAL SLICE (UPGRADE_BACKLOG #1, task: one Episode-grade
// scene on the true-2.5D engine). The 07-20 dispatch's signature moment, rebuilt
// with real depth: VALE lifts off a TRUE 3D runway (a ground plane rotated into
// the floor, centerline + edge lights receding in genuine perspective) while the
// camera cranes down through the treeline, flies low OVER the tarmac toward the
// hero, then rises with the liftoff. Vale is Solidified (the existing kit hero,
// zero re-authoring, now reads with body thickness on the orbit).
// =============================================================================

const W = 1080, H = 1920;
const INK = '#101423';
const NIGHT = '#141F38';
const SKY_MID = '#26406e';
const ROSE = '#E8A87C';
const SUNGLOW = '#F4A65B';
const SPRUCE = '#243A2E';
const IR_CIT = '#FFE24A';

// ---------------------------------------------------------------- sky + bands
const Sky: React.FC<{dawn: number}> = ({dawn}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
    <defs>
      <linearGradient id="nn3sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={NIGHT} />
        <stop offset="55%" stopColor={SKY_MID} />
        <stop offset="100%" stopColor={ROSE} />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#nn3sky)" />
    <ellipse cx={W * 0.58} cy={H * 0.6} rx={560} ry={170} fill={SUNGLOW} opacity={0.14 + 0.3 * dawn} />
    {Array.from({length: 24}).map((_, i) => (
      <circle key={i} cx={(i * 191) % W} cy={(i * 83) % (H * 0.38)} r={1.8} fill="#fff" opacity={0.55 * (1 - dawn)} />
    ))}
  </svg>
);

const Spruce: React.FC<{x: number; y: number; h: number; fill: string}> = ({x, y, h, fill}) => {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const ty = y - h * (0.18 + t * 0.8);
    const tw = h * 0.5 * (1 - t * 0.62);
    parts.push(<path key={i} d={`M${x - tw},${ty} L${x},${ty - h * 0.34} L${x + tw},${ty} Z`} fill={fill} />);
  }
  return <g><rect x={x - 5} y={y - h * 0.2} width={10} height={h * 0.2} fill="#2a1c12" />{parts}</g>;
};

const TreeBand: React.FC<{baseY: number; h: number; fill: string; count: number; step: number}> = ({baseY, h, fill, count, step}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
    {Array.from({length: count}).map((_, i) => (
      <Spruce key={i} x={i * step - step / 2} y={baseY} h={h * (0.72 + ((i * 37) % 40) / 100)} fill={fill} />
    ))}
  </svg>
);

// ---------------------------------------------------------------- TRUE 3D runway floor
// A ground plane rotated into the floor. Authored as a long tarmac strip (2400px
// deep) with a painted centerline + threshold + edge lights; rotateX(90deg) lays
// it flat at ground height, so the camera genuinely flies OVER it and the
// markings recede with real perspective. `f` blinks the edge lights.
const GROUND_Y = H * 0.62;             // world y where the floor sits
const RUN_DEPTH = 2600;                 // how far the runway extends into the scene

const RunwayFloor: React.FC<{f: number}> = ({f}) => (
  <div style={{
    position: 'absolute', left: W / 2 - 700, top: GROUND_Y, width: 1400, height: RUN_DEPTH,
    transformOrigin: 'top center',
    transform: 'rotateX(88deg)',        // just shy of 90 so it stays visible ahead
    transformStyle: 'preserve-3d',
  }}>
    {/* SUPERSAMPLE: the floor is perspective-stretched near the camera, so raster
        it at 2x and scale down — keeps the tarmac/markings crisp in the foreground */}
    <svg width={2800} height={RUN_DEPTH * 2} viewBox={`0 0 1400 ${RUN_DEPTH}`}
      style={{position: 'absolute', transform: 'scale(0.5)', transformOrigin: 'top left'}}>
      {/* tarmac */}
      <rect width={1400} height={RUN_DEPTH} fill="#2b3340" />
      <rect x={90} y={0} width={1220} height={RUN_DEPTH} fill="#333c4b" />
      {/* threshold bars (near end) */}
      {Array.from({length: 8}).map((_, i) => (
        <rect key={i} x={200 + i * 130} y={60} width={70} height={140} fill={ROSE} opacity={0.6} />
      ))}
      {/* centerline dashes receding */}
      {Array.from({length: 16}).map((_, i) => (
        <rect key={i} x={670} y={300 + i * 145} width={60} height={80} rx={8} fill={ROSE} opacity={0.55} />
      ))}
      {/* edge lights: two rows, gentle blink */}
      {Array.from({length: 14}).map((_, i) => {
        const on = ((f / 6 + i) % 9) < 6;
        return (
          <g key={i}>
            <circle cx={120} cy={200 + i * 170} r={14} fill={on ? '#6cc8ff' : '#26507a'} />
            <circle cx={1280} cy={200 + i * 170} r={14} fill={on ? '#6cc8ff' : '#26507a'} />
          </g>
        );
      })}
      {/* weathering streaks so the tarmac reads as a surface, not a fill */}
      {Array.from({length: 24}).map((_, i) => (
        <rect key={i} x={(i * 173) % 1300} y={(i * 431) % RUN_DEPTH} width={40 + (i * 13) % 90} height={8}
          fill={i % 2 ? '#242c38' : '#3a4453'} opacity={0.5} />
      ))}
    </svg>
  </div>
);

// ---------------------------------------------------------------- camera
// The move: start high and back (the whole range in frame), crane DOWN through
// the treeline while dollying IN low over the tarmac toward Vale, then RISE with
// the liftoff and orbit slightly so Vale's solidified body reads.
function cam(f: number): Camera {
  const p1 = interpolate(f, [0, 95], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const p2 = interpolate(f, [95, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  return {
    z: interpolate(p1, [0, 1], [-400, 620]),                       // dolly deep in
    y: interpolate(p1, [0, 1], [-260, 120]) + p2 * -300,           // crane down, then rise with liftoff
    x: interpolate(p1, [0, 1], [-90, 40]),
    rotX: interpolate(p1, [0, 1], [-10, 4]) + p2 * -6,             // look down early, level out
    rotY: interpolate(f, [0, 170], [-10, 9], {extrapolateRight: 'clamp'}),
  };
}

export const Nenana3D: React.FC = () => {
  const f = useCurrentFrame();
  const c = cam(f);
  const dawn = interpolate(f, [0, 170], [0.15, 1], {extrapolateRight: 'clamp'});
  // Vale: grounded until ~f100, then a real anticipation dip + springy rise
  const anticip = interpolate(f, [96, 112], [0, 26], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(f, [112, 168], [0, 620], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const valeY = GROUND_Y - 360 + anticip - rise;
  const grounded = f < 116;
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT}}>
      <Stage3D camera={c} background={NIGHT}>
        {/* sky + far range with air between the layers */}
        <Plane z={2100} fill><Sky dawn={dawn} /></Plane>
        <Plane z={1500} fill><Atmosphere z={1500}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
            <path d={`M0,${GROUND_Y + 30} Q${W * 0.3},${GROUND_Y - 220} ${W * 0.55},${GROUND_Y - 80} Q${W * 0.8},${GROUND_Y - 260} ${W},${GROUND_Y - 60} L${W},${H} L0,${H} Z`} fill="#2f3f63" />
          </svg>
        </Atmosphere></Plane>
        <Plane z={1050} fill><Atmosphere z={1050}><TreeBand baseY={GROUND_Y + 40} h={170} fill="#1c3024" count={18} step={78} /></Atmosphere></Plane>
        <Plane z={620} fill><Atmosphere z={620}><TreeBand baseY={GROUND_Y + 60} h={250} fill={SPRUCE} count={14} step={104} /></Atmosphere></Plane>

        {/* THE FLOOR: a true 3D runway the camera flies over */}
        <RunwayFloor f={f} />

        {/* VALE: the existing kit hero, Solidified for body thickness, + cast shadow */}
        <Plane z={140}>
          {grounded && (
            <CastShadow3D x={W / 2 - 160} y={GROUND_Y + 40} scaleX={1.5} lean={0.65} squash={0.2} blur={14}
              opacity={interpolate(f, [96, 150], [0.36, 0.06], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
              <svg width={340} height={260} viewBox="0 0 340 260"><ellipse cx={170} cy={120} rx={150} ry={90} fill="#000" /></svg>
            </CastShadow3D>
          )}
          <Card x={W / 2 - 200} y={valeY} w={400} h={420} solid depth={30} camRotY={c.rotY ?? 0}>
            <svg width={400} height={420} viewBox="0 0 400 420" style={{position: 'absolute'}}>
              <g transform="translate(200,190)">
                <Vale frame={f} scale={1.05} emotion={grounded ? 'vigilant' : 'resolute'} eyeLock={grounded ? 0.15 : 0.4}
                  groundY={grounded ? 170 : undefined} />
              </g>
            </svg>
          </Card>
          {/* downwash dust on liftoff */}
          {!grounded && rise < 320 && (
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
              {Array.from({length: 8}).map((_, i) => (
                <ellipse key={i} cx={W / 2 + (i - 4) * 52} cy={GROUND_Y + 20 + 8 * Math.sin(f / 4 + i)}
                  rx={34 * (1 - rise / 340)} ry={10} fill="#cfe0f2" opacity={0.35 * (1 - rise / 340)} />
              ))}
            </svg>
          )}
        </Plane>

        {/* near foreground spruces sweeping past the camera */}
        <Plane z={30}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
            <Spruce x={70} y={H * 1.05} h={760} fill="#12211a" />
            <Spruce x={W - 50} y={H * 1.1} h={860} fill="#0f1d16" />
          </svg>
        </Plane>
      </Stage3D>
      {/* lower-third slides in on the settle */}
      <div style={{
        position: 'absolute', bottom: 430, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
        opacity: interpolate(f, [128, 148], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        transform: `translateY(${interpolate(f, [128, 152], [70, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4))})}px)`,
      }}>
        <div style={{background: INK, color: '#fff', fontFamily: 'Arial Black', fontWeight: 900, fontSize: 40, padding: '10px 26px', borderRadius: 10, border: `5px solid ${IR_CIT}`}}>UAF ACUASI · Nenana, Alaska</div>
        <div style={{marginTop: 10, background: IR_CIT, color: INK, fontFamily: 'Arial Black', fontWeight: 900, fontSize: 44, padding: '8px 24px', borderRadius: 10, transform: 'rotate(-1.5deg)'}}>Alaska built the RANGE</div>
      </div>
      <GradeLayer f={f} bloom={0.4} vignette={0.24} grain={0.04} warmth={0.06} />
    </AbsoluteFill>
  );
};
