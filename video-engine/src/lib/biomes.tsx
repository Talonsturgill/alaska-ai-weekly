import React from 'react';

// =============================================================================
// BIOMES — shared reusable environments (asset-library session #2, 2026-07-20c).
// Prior biomes (DawnForestBG, FrostYardBG, NenanaRangeBG) live in Episode.tsx as
// episode-locals; NEW biomes land here so any scene (flat or Stage3D Plane) can
// import them. Convention: each fills 1080x1920, takes `f`, exposes a small set
// of story-tunable params, and guarantees 2+ disjoint motion regions for the
// LIVING_SCREEN gate.
// =============================================================================

const W = 1080, H = 1920;

// ---------------------------------------------------------------- AURORA NIGHT
// The night/aurora rig ("known next advance" since 07-18, now built). A deep
// star-field night over a snow-lit ground band, with 2-3 ANIMATED aurora
// curtains: each a stack of vertical rays whose heights/opacities breathe on
// slow sine phases, hue-shifting green -> teal -> violet along the band. The
// aurora is the scene's living light source: `glow` bleeds its color onto the
// snow horizon. Params: `intensity` 0..1 (curtain strength), `hueShift` degrees
// (rotate the palette: 0 = classic green, ~40 = teal, ~120 = violet-heavy),
// `groundY` (horizon line), `moon` (show a low crescent).
export const AuroraNightBG: React.FC<{
  f: number; intensity?: number; hueShift?: number; groundY?: number; moon?: boolean;
}> = ({f, intensity = 1, hueShift = 0, groundY = H * 0.72, moon = false}) => {
  const inten = Math.max(0, Math.min(1, intensity));
  // three curtains at different depths/phases; each is ~14 vertical rays
  const curtain = (ci: number, baseX: number, spread: number, phase: number, op: number) => (
    <g key={ci} opacity={op * inten} style={{mixBlendMode: 'screen'} as any} filter={`url(#anBlur${ci})`}>
      {Array.from({length: 14}).map((_, i) => {
        const px = baseX + i * spread + 26 * Math.sin(f / 46 + phase + i * 0.42);
        const hgt = 300 + 190 * Math.sin(f / 33 + phase * 2 + i * 0.8) + 120 * Math.sin(f / 61 + i);
        const top = groundY - 500 - hgt * 0.8;
        const hue = 130 + hueShift + 50 * Math.sin(i * 0.5 + phase) + 18 * Math.sin(f / 52);
        const alpha = 0.16 + 0.1 * Math.sin(f / 24 + i * 1.1 + phase);
        return (
          <rect key={i} x={px} y={top} width={spread * 0.86} height={Math.max(120, hgt)}
            fill={`hsl(${hue}, 90%, 62%)`} opacity={Math.max(0.04, alpha)} rx={spread * 0.3} />
        );
      })}
    </g>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="anSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050a18" />
          <stop offset="70%" stopColor="#0c1630" />
          <stop offset="100%" stopColor="#16233f" />
        </linearGradient>
        <linearGradient id="anGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3a55" />
          <stop offset="100%" stopColor="#131c2c" />
        </linearGradient>
        {/* soft-veil blur per curtain (deeper curtains blur more) so the rays read
            as glowing light, not rounded rectangles */}
        {[0, 1, 2].map((ci) => (
          <filter key={ci} id={`anBlur${ci}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={10 + ci * 8} />
          </filter>
        ))}
      </defs>
      <rect width={W} height={H} fill="url(#anSky)" />
      {/* star field: two twinkle layers (disjoint motion region #1) */}
      {Array.from({length: 46}).map((_, i) => {
        const x = (i * 149) % W, y = (i * 83) % (groundY - 260);
        const tw = 0.35 + 0.55 * Math.sin(f / (14 + (i % 5) * 4) + i);
        return <circle key={i} cx={x} cy={y} r={i % 6 === 0 ? 2.2 : 1.4} fill="#e8f0ff" opacity={Math.max(0.08, tw)} />;
      })}
      {moon && (
        <g transform={`translate(${W - 180},220)`}>
          <circle r={44} fill="#e8ecf4" opacity={0.95} />
          <circle cx={-16} cy={-8} r={40} fill="#0c1630" />
        </g>
      )}
      {/* the aurora curtains (disjoint motion region #2, the hero light) */}
      {curtain(0, -60, 92, 0, 0.75)}
      {curtain(1, 120, 76, 2.2, 0.6)}
      {curtain(2, -140, 118, 4.1, 0.45)}
      {/* snow ground band, aurora-lit at the horizon */}
      <rect x={0} y={groundY} width={W} height={H - groundY} fill="url(#anGround)" />
      <rect x={0} y={groundY} width={W} height={90}
        fill={`hsl(${140 + hueShift}, 70%, 60%)`} opacity={0.14 * inten} style={{mixBlendMode: 'screen'} as any} />
      {/* rolling snow drift line */}
      <path d={`M0,${groundY} q270,${-24 + 6 * Math.sin(f / 40)} 540,0 q270,${24 - 6 * Math.sin(f / 40)} 540,0 l0,40 -1080,0 Z`}
        fill="#33445f" opacity={0.5} />
      {/* low spruce silhouettes on the horizon */}
      {Array.from({length: 16}).map((_, i) => {
        const x = i * 72 - 30, hgt = 60 + ((i * 37) % 40);
        return <path key={i} d={`M${x - 22},${groundY + 8} L${x},${groundY + 8 - hgt} L${x + 22},${groundY + 8} Z`} fill="#0a1220" opacity={0.9} />;
      })}
      {/* drifting near-ground snow sparkle (disjoint motion region #3) */}
      {Array.from({length: 18}).map((_, i) => {
        const seed = i * 67;
        const x = (seed + f * (0.5 + (seed % 4) * 0.25)) % (W + 80) - 40;
        const y = groundY + 60 + ((seed * 13) % (H - groundY - 100));
        return <circle key={i} cx={x} cy={y} r={2 + (seed % 3)} fill="#cfe0f2" opacity={0.3 + 0.3 * Math.sin(f / 10 + i)} />;
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- TUNDRA DAY
// Open North Slope / western tundra under a big sky: layered ground bands of
// autumn tundra colors (red-ochre sedge, olive tussock), scattered kettle
// ponds catching the sky, a far flat horizon. Params: `season` 'summer'
// (green-olive) | 'autumn' (red-rust), `wind` 0..1 (cottongrass shiver +
// cloud drift speed).
export const TundraBG: React.FC<{
  f: number; season?: 'summer' | 'autumn'; wind?: number; groundY?: number;
}> = ({f, season = 'autumn', wind = 0.5, groundY = H * 0.5}) => {
  const w = Math.max(0, Math.min(1, wind));
  const bands = season === 'autumn'
    ? ['#8a4b2e', '#a2603a', '#7a5a30', '#5f4a28']
    : ['#5a7a3e', '#6d8a48', '#4f6e38', '#3f5a30'];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="tdSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fa8c9" />
          <stop offset="100%" stopColor="#cfe0e8" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#tdSky)" />
      {/* drifting flat-bottomed clouds (motion region #1) */}
      {[0, 1, 2].map((i) => {
        const cx = ((f * (0.4 + i * 0.22) * (0.5 + w) + i * 420) % (W + 400)) - 200;
        const cy = 180 + i * 130;
        return (
          <g key={i} opacity={0.85}>
            <ellipse cx={cx} cy={cy} rx={150 - i * 24} ry={34 - i * 6} fill="#fff" />
            <ellipse cx={cx + 80} cy={cy + 8} rx={100 - i * 18} ry={24 - i * 4} fill="#fff" opacity={0.8} />
            <rect x={cx - 150 + i * 24} y={cy + 18} width={(150 - i * 24) * 2} height={8} fill="#e2ecf2" />
          </g>
        );
      })}
      {/* tundra bands receding to a FLAT horizon */}
      {bands.map((c, i) => {
        const y = groundY + i * ((H - groundY) / bands.length) * 0.9;
        return <path key={i} d={`M0,${y} q270,${-14 - i * 4} 540,0 q270,${14 + i * 4} 540,0 L${W},${H} L0,${H} Z`} fill={c} />;
      })}
      {/* kettle ponds catching the sky */}
      {[[200, 0.62, 90], [720, 0.74, 130], [430, 0.88, 70]].map(([px, fy, rx2], i) => (
        <g key={i}>
          <ellipse cx={px as number} cy={groundY + (H - groundY) * (fy as number) - 40} rx={rx2 as number} ry={(rx2 as number) * 0.3}
            fill="#a8c8d8" stroke="#5f4a28" strokeWidth={4} />
          <ellipse cx={(px as number) - (rx2 as number) * 0.3} cy={groundY + (H - groundY) * (fy as number) - 46} rx={(rx2 as number) * 0.4} ry={(rx2 as number) * 0.1} fill="#e8f4f8" opacity={0.7} />
        </g>
      ))}
      {/* cottongrass tufts shivering in the wind (motion region #2) */}
      {Array.from({length: 14}).map((_, i) => {
        const x = (i * 83 + 40) % W;
        const y = groundY + 80 + ((i * 137) % (H - groundY - 160));
        const sway = (2 + w * 5) * Math.sin(f / (9 - w * 3) + i);
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${sway})`}>
            <line x1={0} y1={0} x2={0} y2={-26} stroke="#7a6a48" strokeWidth={2.5} />
            <circle cx={0} cy={-30} r={7} fill="#f2f0e8" opacity={0.95} />
          </g>
        );
      })}
    </svg>
  );
};
