import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

// =============================================================================
// IGS-GRADE HOOK SCENE — "The AI boom wants Alaska"
// Style grammar (from studying real Infographics Show frames):
//   - thick dark outlines on EVERY shape (comic ink)
//   - multi-tone shading: base fill + darker shade region + lighter highlight blob
//   - a CHARACTER with facial emotion anchors the frame (hungry server-machine)
//   - detail density: teeth, LED rows, vents, mountains, trees, pipeline
//   - fat outlined arrow, shouty boxed label, starburst stat badge
//   - saturated palette on a radial-burst background
// =============================================================================

const INK = '#101423';        // comic outline ink
const BG = '#141b3d';         // deep saturated navy
const RAY = '#1c2752';        // burst rays
const GLOW = '#27356e';       // center glow
const STEEL = '#5d7fae';      // machine body base
const STEEL_D = '#43608c';    // machine shade
const STEEL_L = '#7fa1cc';    // machine highlight
const ICE = '#eef6ff';
const SNOW = '#ffffff';
const LAND = '#3f7a54';       // Alaska tundra green (saturated, IGS-style)
const LAND_D = '#2e5c3f';
const RED = '#e8402f';
const RED_D = '#b52c1e';
const AMBER = '#ffb531';
const AMBER_D = '#e0921a';

const OUT = 7; // stroke width for main outlines

export const IGSHook: React.FC<{headline: string; commentCount: number; commentLabel: string; dotLabel: string}> = ({
  headline,
  commentCount,
  commentLabel,
  dotLabel,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ---- global animation drivers -------------------------------------------
  const breathe = 1 + 0.012 * Math.sin(f / 12);            // machine body breath
  const bob = 4 * Math.sin(f / 14);                        // arm/plug bob
  const rayRot = f * 0.08;                                 // slow burst rotation
  const akFloat = 6 * Math.sin(f / 26);                    // Alaska hover
  const blink = ((f + 30) % 84) < 5 ? 1 : 0;               // eyelid blink
  const pupilX = 6 * Math.sin(f / 40);                     // pupil wander (toward AK)
  const ledOn = (i: number) => ((f / 7 + i) % 5) < 1.6;

  const headIn = spring({frame: f - 4, fps, config: {damping: 11, stiffness: 120}});
  const machineIn = spring({frame: f - 14, fps, config: {damping: 12, stiffness: 90}});
  const akIn = spring({frame: f - 26, fps, config: {damping: 12, stiffness: 90}});
  const arrowT = interpolate(f, [46, 76], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const badgeIn = spring({frame: f - 84, fps, config: {damping: 9, stiffness: 140}});
  const count = Math.round(interpolate(f, [84, 130], [0, commentCount], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  const pinPulse = 1 + 0.25 * Math.sin(f / 9);

  // starburst polygon points
  const burst = (cx: number, cy: number, spikes: number, r1: number, r2: number) => {
    const pts: string[] = [];
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? r1 : r2;
      const a = (Math.PI * i) / spikes - Math.PI / 2;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return pts.join(' ');
  };

  return (
    <AbsoluteFill style={{backgroundColor: BG, overflow: 'hidden'}}>
      {/* ================= RADIAL BURST BACKGROUND ================= */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <radialGradient id="glow" cx="50%" cy="58%" r="55%">
          <stop offset="0%" stopColor={GLOW} />
          <stop offset="100%" stopColor={BG} />
        </radialGradient>
        <rect width="1080" height="1920" fill="url(#glow)" />
        <g transform={`rotate(${rayRot} 540 1120)`} opacity={0.85}>
          {Array.from({length: 14}).map((_, i) => {
            const a = (i * 360) / 14;
            return <path key={i} d="M540,1120 L440,-500 L640,-500 Z" fill={RAY} transform={`rotate(${a} 540 1120)`} />;
          })}
        </g>
        {/* hand-drawn splash accents at edges (IGS thumbnail language) */}
        <g opacity={0.9}>
          <path d="M40,300 q30,-8 62,4 q-26,14 -60,10 Z" fill={AMBER_D} transform={`rotate(${8 * Math.sin(f / 30)} 70 305)`} />
          <path d="M1040,520 q-34,-4 -60,14 q30,12 62,4 Z" fill={RED_D} transform={`rotate(${-8 * Math.sin(f / 26)} 1010 530)`} />
          <circle cx="90" cy="1650" r="10" fill={AMBER_D} />
          <circle cx="1000" cy="1720" r="14" fill={RAY} stroke={INK} strokeWidth={4} />
        </g>
      </svg>

      {/* ================= ALASKA (detailed, floating) ================= */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{position: 'absolute', transform: `translateY(${akFloat - 60 * (1 - akIn)}px)`, opacity: akIn}}
      >
        <g transform="translate(160,330) scale(1.55)">
          {/* landmass with shade tone */}
          <path
            d="M30,120 L95,78 L150,88 L172,58 L215,66 L238,40 L268,52 L310,46 L355,64 L420,58
               L465,88 L448,118 L400,130 L418,162 L378,172 L360,214 L308,224 L280,202 L252,232
               L212,222 L182,254 L152,232 L120,254 L90,222 L108,182 L64,172 L84,142 L30,132 Z"
            fill={LAND}
            stroke={INK}
            strokeWidth={OUT}
            strokeLinejoin="round"
          />
          <path
            d="M310,46 L355,64 L420,58 L465,88 L448,118 L400,130 L418,162 L378,172 L360,214 L308,224 L280,202 L300,150 L285,100 Z"
            fill={LAND_D}
            opacity={0.55}
          />
          {/* mountain range with snow caps */}
          {[
            [150, 150, 34],
            [200, 145, 42],
            [255, 152, 36],
          ].map(([mx, my, s], i) => (
            <g key={i}>
              <path d={`M${mx - s},${my + s * 0.9} L${mx},${my - s} L${mx + s},${my + s * 0.9} Z`} fill="#6b7f8f" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              <path d={`M${mx - s * 0.34},${my - s * 0.32} L${mx},${my - s} L${mx + s * 0.34},${my - s * 0.32} L${mx + s * 0.16},${my - s * 0.14} L${mx - s * 0.02},${my - s * 0.3} L${mx - s * 0.18},${my - s * 0.12} Z`} fill={SNOW} stroke={INK} strokeWidth={3} />
            </g>
          ))}
          {/* spruce trees */}
          {[
            [95, 190],
            [122, 200],
            [330, 190],
            [355, 178],
          ].map(([tx, ty], i) => (
            <g key={i} transform={`translate(${tx},${ty})`}>
              <path d="M0,-26 L12,-4 L5,-4 L14,12 L-14,12 L-5,-4 L-12,-4 Z" fill="#2f6b45" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
              <rect x={-2.6} y={12} width={5.2} height={7} fill="#5b4023" stroke={INK} strokeWidth={2.4} />
            </g>
          ))}
          {/* pipeline running south from the slope */}
          <path d="M300,86 C 285,130 240,160 205,196" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <path d="M300,86 C 285,130 240,160 205,196" fill="none" stroke="#c9cfd8" strokeWidth={5} strokeLinecap="round" strokeDasharray="14 10" />
          {/* NORTH SLOPE PIN (big, outlined, pulsing) */}
          <g transform={`translate(300,64) scale(${pinPulse})`}>
            <circle r={26} fill="none" stroke={RED} strokeWidth={5} opacity={Math.max(0, 1.4 - pinPulse)} />
          </g>
          <g transform="translate(300,64)">
            <path d="M0,26 C -20,2 -20,-16 0,-24 C 20,-16 20,2 0,26 Z" fill={RED} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
            <circle cx={0} cy={-6} r={7.5} fill={ICE} stroke={INK} strokeWidth={4} />
          </g>
        </g>
        {/* boxed pin label — sits to the RIGHT of the pin, clear of the headline box */}
        <g transform="translate(742,470) rotate(3)">
          <rect x={-14} y={-30} width={250} height={58} rx={9} fill={ICE} stroke={INK} strokeWidth={6} />
          <text x={111} y={11} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={30} fill={INK} letterSpacing={2}>
            {dotLabel.toUpperCase()}
          </text>
          {/* little pointer nub toward the pin */}
          <path d="M-14,6 l-26,-14 l30,-16 Z" fill={ICE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
      </svg>

      {/* ================= FAT RED ARROW (plug -> pin) ================= */}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g opacity={arrowT > 0.02 ? 1 : 0}>
          <path
            d="M700,1170 C 850,1000 830,780 640,560"
            fill="none"
            stroke={INK}
            strokeWidth={46}
            strokeLinecap="round"
            strokeDasharray={800}
            strokeDashoffset={800 * (1 - arrowT)}
          />
          <path
            d="M700,1170 C 850,1000 830,780 640,560"
            fill="none"
            stroke={RED}
            strokeWidth={30}
            strokeLinecap="round"
            strokeDasharray={800}
            strokeDashoffset={800 * (1 - arrowT)}
          />
          {arrowT > 0.97 && (
            <g transform="translate(640,560) rotate(-42)">
              <path d="M0,-52 L44,26 L12,16 L0,44 L-12,16 L-44,26 Z" fill={RED} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
              <path d="M0,-52 L44,26 L12,16 Z" fill={RED_D} />
            </g>
          )}
        </g>
      </svg>

      {/* ================= THE HUNGRY SERVER MACHINE ================= */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{
          position: 'absolute',
          transform: `translateY(${180 * (1 - machineIn)}px) scale(${breathe})`,
          transformOrigin: '50% 78%',
          opacity: machineIn,
        }}
      >
        {/* ground shadow */}
        <ellipse cx="480" cy="1738" rx="330" ry="42" fill={INK} opacity={0.35} />
        <g>
          {/* body */}
          <rect x="270" y="1150" width="420" height="580" rx="38" fill={STEEL} stroke={INK} strokeWidth={OUT + 2} />
          {/* shade + highlight tones */}
          <path d="M560,1158 h92 a30,30 0 0 1 30,30 v512 a30,30 0 0 1 -30,30 h-92 Z" fill={STEEL_D} opacity={0.8} />
          <rect x="292" y="1170" width="60" height="220" rx="24" fill={STEEL_L} opacity={0.7} />
          {/* side vents */}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={306} y={1580 + i * 42} width={120} height={18} rx={9} fill={STEEL_D} stroke={INK} strokeWidth={4} />
          ))}
          {/* LED rows (blinking) */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={330 + (i % 3) * 44} cy={1516 + Math.floor(i / 3) * 34} r={11} fill={ledOn(i) ? AMBER : '#2b3a55'} stroke={INK} strokeWidth={4} />
          ))}
          {/* rack seams */}
          <path d="M282,1476 h300" stroke={INK} strokeWidth={5} opacity={0.8} />
          <path d="M282,1560 h300" stroke={INK} strokeWidth={5} opacity={0.8} />

          {/* FACE: hungry eyes looking at Alaska */}
          {/* eye whites */}
          <ellipse cx={392} cy={1268} rx={62} ry={70} fill={ICE} stroke={INK} strokeWidth={OUT} />
          <ellipse cx={556} cy={1268} rx={62} ry={70} fill={ICE} stroke={INK} strokeWidth={OUT} />
          {/* pupils track toward the pin (up-left) + wander */}
          <circle cx={378 + pupilX} cy={1240} r={24} fill={INK} />
          <circle cx={542 + pupilX} cy={1240} r={24} fill={INK} />
          <circle cx={386 + pupilX} cy={1232} r={8} fill={ICE} />
          <circle cx={550 + pupilX} cy={1232} r={8} fill={ICE} />
          {/* eyelids (blink) */}
          {blink === 1 && (
            <g>
              <rect x={328} y={1198} width={128} height={72} rx={30} fill={STEEL} stroke={INK} strokeWidth={5} />
              <rect x={492} y={1198} width={128} height={72} rx={30} fill={STEEL} stroke={INK} strokeWidth={5} />
            </g>
          )}
          {/* hungry eyebrows */}
          <path d={`M330,1196 q60,${-14 - 3 * Math.sin(f / 18)} 118,10`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
          <path d={`M498,1206 q58,${-24 - 3 * Math.sin(f / 18)} 118,-10`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />

          {/* open hungry mouth with teeth + tongue */}
          <path d="M356,1358 q118,96 236,0 q-16,110 -118,110 q-102,0 -118,-110 Z" fill="#5b1b1b" stroke={INK} strokeWidth={OUT} strokeLinejoin="round" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${376 + i * 44},${1372 + (i === 0 || i === 4 ? 4 : i === 2 ? 16 : 10)} l16,26 l16,-22 Z`} fill={SNOW} stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
          ))}
          <path d="M414,1442 q60,34 120,2 q-24,44 -62,44 q-38,0 -58,-46 Z" fill="#c4453a" stroke={INK} strokeWidth={5} />
          {/* drool drop (hungry) */}
          <path d={`M596,1416 q10,${18 + 6 * Math.sin(f / 10)} 0,${30 + 6 * Math.sin(f / 10)} q-10,-12 0,-30 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={3.5} opacity={0.95} />

          {/* left arm resting */}
          <path d="M276,1420 q-70,10 -64,86 q4,58 66,58" fill="none" stroke={INK} strokeWidth={40} strokeLinecap="round" />
          <path d="M276,1420 q-70,10 -64,86 q4,58 66,58" fill="none" stroke={STEEL_D} strokeWidth={26} strokeLinecap="round" />

          {/* right arm raised holding THE PLUG toward Alaska */}
          <g transform={`translate(0,${bob})`}>
            <path d="M676,1300 q120,-40 84,-150" fill="none" stroke={INK} strokeWidth={42} strokeLinecap="round" />
            <path d="M676,1300 q120,-40 84,-150" fill="none" stroke={STEEL} strokeWidth={28} strokeLinecap="round" />
            {/* fist */}
            <circle cx={758} cy={1146} r={40} fill={STEEL} stroke={INK} strokeWidth={OUT} />
            <path d="M730,1150 q28,20 56,0" fill="none" stroke={INK} strokeWidth={5} />
            {/* plug body + prongs + cable */}
            <g transform="translate(758,1108) rotate(-24)">
              <rect x={-30} y={-58} width={60} height={62} rx={12} fill={AMBER} stroke={INK} strokeWidth={6.5} />
              <path d="M-30,-58 h26 v62 h-26 Z" fill={AMBER_D} opacity={0.8} />
              <rect x={-18} y={-92} width={13} height={36} rx={5} fill="#cfd6df" stroke={INK} strokeWidth={5} />
              <rect x={6} y={-92} width={13} height={36} rx={5} fill="#cfd6df" stroke={INK} strokeWidth={5} />
              {/* spark when arrow completes */}
              {arrowT > 0.97 && (f % 10 < 5) && (
                <polygon points={burst(0, -108, 6, 26, 11)} fill={AMBER} stroke={INK} strokeWidth={4} />
              )}
            </g>
            <path d={`M740,1180 q-90,90 -180,${64 + 8 * Math.sin(f / 16)}`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
          </g>
        </g>
      </svg>

      {/* ================= SHOUTY HEADLINE (red box) ================= */}
      <div
        style={{
          position: 'absolute',
          top: 108,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: `translateY(${-160 * (1 - headIn)}px) rotate(-2deg)`,
        }}
      >
        <div
          style={{
            background: RED,
            border: `9px solid ${INK}`,
            borderRadius: 14,
            padding: '26px 44px',
            boxShadow: `0 14px 0 ${INK}55`,
            maxWidth: 900,
          }}
        >
          <div
            style={{
              fontFamily: 'Arial Black, Arial, sans-serif',
              fontWeight: 900,
              fontSize: 88,
              lineHeight: 1.04,
              color: '#fff',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 1,
              textShadow: `4px 5px 0 ${RED_D}`,
            }}
          >
            {headline}
          </div>
        </div>
      </div>

      {/* ================= STARBURST STAT BADGE ================= */}
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{position: 'absolute', transform: `scale(${badgeIn})`, transformOrigin: '208px 1130px'}}
      >
        <g transform={`rotate(${5 * Math.sin(f / 22)} 208 1130)`}>
          <polygon points={burst(208, 1130, 14, 178, 138)} fill={AMBER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          <polygon points={burst(208, 1130, 14, 150, 118)} fill="none" stroke={AMBER_D} strokeWidth={5} strokeLinejoin="round" opacity={0.8} />
          <text x={208} y={1112} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={84} fill={INK}>
            {count}+
          </text>
          <text x={208} y={1162} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={30} fill={INK} letterSpacing={0.5}>
            {commentLabel.toUpperCase().split(' ')[0]}
          </text>
          <text x={208} y={1198} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={30} fill={INK} letterSpacing={0.5}>
            {commentLabel.toUpperCase().split(' ').slice(1).join(' ')}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
