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

// ---------------------------------------------------------------- COASTAL FJORD
// Southeast Alaska: steep forested walls dropping into still green water,
// hanging mist bands across the slopes, reflections. Params: `mist` 0..1,
// `waterY` (waterline). Motion: mist drift, water shimmer, distant gull specks.
export const FjordBG: React.FC<{f: number; mist?: number; waterY?: number}> = ({f, mist = 0.7, waterY = H * 0.66}) => {
  const mi = Math.max(0, Math.min(1, mist));
  const wall = (side: 1 | -1, depth: number, col: string) => {
    const bx = side === 1 ? 0 : W;
    return (
      <path d={`M${bx},${waterY} L${bx},${waterY - 900 - depth * 200}
        q${side * (260 + depth * 60)},${140 + depth * 40} ${side * (300 + depth * 90)},${420 + depth * 60}
        q${side * 40},${240} ${side * (200 + depth * 40)},${480 + depth * 80} Z`} fill={col} />
    );
  };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="fjSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8c9d4" />
          <stop offset="100%" stopColor="#dfe8e8" />
        </linearGradient>
        <linearGradient id="fjWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f6a5e" />
          <stop offset="100%" stopColor="#22423c" />
        </linearGradient>
        {/* wide region: heavy blur on a thin ellipse clips at the default 110% bbox */}
        <filter id="fjMist" x="-80%" y="-400%" width="260%" height="900%">
          <feGaussianBlur stdDeviation={20} />
        </filter>
      </defs>
      <rect width={W} height={H} fill="url(#fjSky)" />
      {/* distant gull specks circling */}
      {[0, 1, 2].map((i) => {
        const gx = 400 + 180 * Math.sin(f / 40 + i * 2.1) + i * 90;
        const gy = 300 + 60 * Math.cos(f / 34 + i * 1.7);
        return <path key={i} d={`M${gx - 8},${gy} q8,-7 16,0`} fill="none" stroke="#5a6a74" strokeWidth={3} strokeLinecap="round" />;
      })}
      {/* distant ridge closing the throat of the V (aerial perspective; without
          it the sky gap hit the waterline as a bright glowing lens) */}
      <path d={`M240,${waterY} L340,${waterY - 260} q60,-80 130,-40 q80,-120 160,-30 q70,-50 120,10 L840,${waterY} Z`} fill="#93a8ab" />
      <path d={`M330,${waterY} L430,${waterY - 150} q70,-70 150,-10 q80,-40 140,30 L760,${waterY} Z`} fill="#7c948f" />
      {/* far + near fjord walls (forested: dark teal-green) */}
      {wall(1, 1, '#4a5f56')}
      {wall(-1, 1, '#42574e')}
      {wall(1, 0, '#31443c')}
      {wall(-1, 0, '#2a3c34')}
      {/* spruce fringe on the near walls */}
      {Array.from({length: 12}).map((_, i) => {
        const x = i < 6 ? 40 + i * 44 : W - 40 - (i - 6) * 44;
        const yy = waterY - 60 - (i % 6) * 90;
        return <path key={i} d={`M${x - 16},${yy} L${x},${yy - 46} L${x + 16},${yy} Z`} fill="#1f2f28" opacity={0.9} />;
      })}
      {/* hanging mist bands: soft blurred layers HUGGING the walls (drifting a
          solid ellipse across the open gap read as a UFO in pass 1) */}
      {[
        {cx: 200, cy: waterY - 420, rx: 340, ry: 42},
        {cx: 880, cy: waterY - 560, rx: 320, ry: 38},
        {cx: 340, cy: waterY - 760, rx: 300, ry: 30},
        {cx: 760, cy: waterY - 220, rx: 360, ry: 46},
      ].map((b, i) => {
        const dx = 46 * Math.sin(f / 70 + i * 1.9);
        const dy = 10 * Math.sin(f / 44 + i * 1.1);
        return (
          <ellipse key={i} cx={b.cx + dx} cy={b.cy + dy} rx={b.rx} ry={b.ry}
            fill="#eef2f4" opacity={(0.34 + (i % 2) * 0.1) * mi} filter="url(#fjMist)" />
        );
      })}
      {/* still green water + wall reflections + shimmer */}
      <rect x={0} y={waterY} width={W} height={H - waterY} fill="url(#fjWater)" />
      <path d={`M0,${waterY} q200,${120} 300,${420} L0,${H} Z`} fill="#31443c" opacity={0.3} />
      <path d={`M${W},${waterY} q-200,${120} -300,${420} L${W},${H} Z`} fill="#2a3c34" opacity={0.3} />
      {Array.from({length: 8}).map((_, i) => {
        const y = waterY + 60 + i * 90;
        const x = (f * (0.6 + (i % 3) * 0.3) + i * 140) % W;
        return <path key={i} d={`M${x - 50},${y} q50,${-5 - (i % 3)} 100,0`} fill="none" stroke="#7fb6a9" strokeWidth={3} opacity={0.35} />;
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- GLACIER
// The tidewater glacier face: fissured blue-white ice wall meeting dark water,
// bergy bits drifting, `calve` 0..1 drops a slab with splash. Ice-blue palette
// is the biome's signature. Params: `calve`, `waterY`.
export const GlacierBG: React.FC<{f: number; calve?: number; waterY?: number}> = ({f, calve = 0, waterY = H * 0.7}) => {
  const cv = Math.max(0, Math.min(1, calve));
  const faceTop = waterY - 620;
  // the calving slab: tips out and falls with cv
  const slabDrop = cv * cv * 420;
  const slabTip = cv * 26;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="glSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8c4d8" />
          <stop offset="100%" stopColor="#d8e8ee" />
        </linearGradient>
        <linearGradient id="glIce" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8f2f8" />
          <stop offset="55%" stopColor="#b8dcec" />
          <stop offset="100%" stopColor="#6aa8cc" />
        </linearGradient>
        <linearGradient id="glWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c4a5e" />
          <stop offset="100%" stopColor="#16283a" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#glSky)" />
      {/* far mountain shoulders above the ice */}
      <path d={`M0,${faceTop - 60} q220,-160 440,-60 q200,-120 400,-20 q140,-60 240,-10 L${W},${faceTop} L0,${faceTop} Z`} fill="#8aa8bc" opacity={0.8} />
      {/* THE ICE FACE: fissured wall */}
      <rect x={0} y={faceTop} width={W} height={waterY - faceTop} fill="url(#glIce)" />
      {/* seracs: jagged top edge */}
      <path d={`M0,${faceTop} ${Array.from({length: 14}).map((_, i) => `L${i * 80 + 30},${faceTop - 34 - (i * 29 % 40)} L${i * 80 + 76},${faceTop}`).join(' ')} Z`} fill="#eef6fa" stroke="#7fb0cc" strokeWidth={3} />
      {/* deep blue fissures */}
      {Array.from({length: 9}).map((_, i) => {
        const x = 60 + i * 118;
        return <path key={i} d={`M${x},${faceTop + 10} q${(i % 2 ? 14 : -12)},${190} ${(i % 3 - 1) * 16},${waterY - faceTop - 30}`}
          fill="none" stroke="#3a7aa8" strokeWidth={5 + (i % 3) * 3} opacity={0.65} strokeLinecap="round" />;
      })}
      {/* the CALVING slab (right third) */}
      {cv > 0.02 && (
        <g transform={`translate(0,${slabDrop}) rotate(${slabTip} 850 ${waterY})`}>
          <path d={`M760,${faceTop - 20} L940,${faceTop - 44} L960,${waterY} L780,${waterY} Z`} fill="#dcedf5" stroke="#5f98bc" strokeWidth={5} />
          <path d={`M800,${faceTop + 40} q10,200 -6,${waterY - faceTop - 80}`} fill="none" stroke="#3a7aa8" strokeWidth={6} opacity={0.7} />
        </g>
      )}
      {/* splash on impact */}
      {cv > 0.7 && (
        <g opacity={(cv - 0.7) * 3}>
          {Array.from({length: 9}).map((_, i) => {
            const a = (i / 9) * Math.PI;
            const r = (cv - 0.7) * 3 * 130;
            return <circle key={i} cx={860 + Math.cos(a) * r} cy={waterY - Math.abs(Math.sin(a)) * r * 0.8} r={8 - i * 0.5} fill="#eaf6fc" opacity={0.9} />;
          })}
        </g>
      )}
      {/* dark water + drifting bergy bits */}
      <rect x={0} y={waterY} width={W} height={H - waterY} fill="url(#glWater)" />
      {Array.from({length: 6}).map((_, i) => {
        const x = ((f * (0.3 + (i % 3) * 0.2) + i * 210) % (W + 200)) - 100;
        const y = waterY + 70 + (i * 97) % (H - waterY - 140);
        const s = 14 + (i * 13) % 22;
        return (
          <g key={i}>
            <path d={`M${x - s},${y} L${x - s * 0.3},${y - s * 0.8} L${x + s * 0.5},${y - s * 0.5} L${x + s},${y} Z`} fill="#cfe6f0" stroke="#7fb0cc" strokeWidth={3} />
            <path d={`M${x - s},${y} L${x + s},${y} L${x + s * 0.6},${y + s * 0.5} L${x - s * 0.6},${y + s * 0.5} Z`} fill="#9cc6da" opacity={0.5} />
          </g>
        );
      })}
      {/* ice-face reflection shimmer */}
      {Array.from({length: 5}).map((_, i) => (
        <path key={i} d={`M${(f * 0.8 + i * 220) % W - 60},${waterY + 30 + i * 40} q60,-4 120,0`} fill="none" stroke="#7fb0cc" strokeWidth={3} opacity={0.3} />
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------- RIVER
// An Interior gravel-bar river: braided channel curving through spruce banks,
// riffle sparkle, drifting current lines. THE salmon-story stage (pair with
// Salmon, Grizzly 'fish', FishingBoat upstream). Params: `season` summer/fall,
// `riffle` 0..1 (current energy).
export const RiverBG: React.FC<{f: number; season?: 'summer' | 'fall'; riffle?: number}> = ({f, season = 'summer', riffle = 0.6}) => {
  const ri = Math.max(0, Math.min(1, riffle));
  const fall = season === 'fall';
  const bank = fall ? '#8a6a34' : '#4a6a3c';
  const bankD = fall ? '#6a4e24' : '#385130';
  const bankL = fall ? '#a08044' : '#5c7a44';
  const yTop = H * 0.4;
  const span = H - yTop;
  // ONE parametric centerline drives everything: channel, gravel margins, bar,
  // current lines, sparkle. (Pass 1 drew them independently and the bar floated
  // as a pancake while gravel dots landed on the water.)
  const ctr = (t: number) => 540 + 170 * Math.sin(t * 5.34 - 0.71);
  const wid = (t: number) => 70 + 380 * t * t;
  const side = (margin: number, sgn: 1 | -1) =>
    Array.from({length: 15}).map((_, i) => {
      const t = i / 14;
      const y = yTop + t * span;
      return `${(ctr(t) + sgn * (wid(t) / 2 + margin)).toFixed(1)},${y.toFixed(1)}`;
    });
  const channel = (margin: number) =>
    `M${side(margin, -1).join(' L')} L${side(margin, 1).reverse().join(' L')} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="rvSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8c8d8" />
          <stop offset="100%" stopColor="#d8e8e2" />
        </linearGradient>
        <linearGradient id="rvWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5f8a9c" />
          <stop offset="100%" stopColor="#33566a" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#rvSky)" />
      {/* distant range + drifting clouds so the sky band is never dead space */}
      <path d={`M0,${yTop - 40} L140,${yTop - 190} q60,-60 130,-20 L400,${yTop - 240} q80,-70 170,-30 L720,${yTop - 300} q90,-60 180,10 L1010,${yTop - 160} L${W},${yTop - 120} L${W},${yTop} L0,${yTop} Z`}
        fill="#8fa8b8" opacity={0.85} />
      <path d={`M380,${yTop - 240} L400,${yTop - 240} L470,${yTop - 210} L330,${yTop - 210} Z`} fill="#e8f2f6" opacity={0.9} />
      <path d={`M700,${yTop - 296} L740,${yTop - 288} L800,${yTop - 258} L650,${yTop - 258} Z`} fill="#e8f2f6" opacity={0.9} />
      {[0, 1].map((i) => {
        const x = ((f * (0.4 + i * 0.25) + i * 520) % (W + 400)) - 200;
        const y = 190 + i * 150;
        return (
          <g key={i} opacity={0.75}>
            <ellipse cx={x} cy={y} rx={130 + i * 40} ry={26} fill="#eef5f8" />
            <ellipse cx={x - 60} cy={y + 10} rx={80} ry={18} fill="#eef5f8" />
            <ellipse cx={x + 70} cy={y + 8} rx={90} ry={20} fill="#eef5f8" />
          </g>
        );
      })}
      {/* far treeline, two staggered rows for depth */}
      {Array.from({length: 18}).map((_, i) => {
        const x = i * 64 - 20;
        const hgt = 52 + (i * 37) % 30;
        return <path key={`b${i}`} d={`M${x - 16},${yTop} L${x},${yTop - hgt} L${x + 16},${yTop} Z`} fill="#3d5442" opacity={0.7} />;
      })}
      {Array.from({length: 15}).map((_, i) => {
        const x = i * 78 + 8;
        const hgt = 74 + (i * 31) % 46;
        return <path key={`f${i}`} d={`M${x - 22},${yTop} L${x},${yTop - hgt} L${x + 22},${yTop} Z`} fill="#2a3f2e" opacity={0.9} />;
      })}
      {/* banks: base + broad vegetation mottling (never a flat single-tone fill) */}
      <path d={`M0,${yTop} L${W},${yTop} L${W},${H} L0,${H} Z`} fill={bank} />
      {[
        {x: 130, y: 0.5, rx: 200, ry: 90, c: bankD},
        {x: 900, y: 0.56, rx: 240, ry: 110, c: bankL},
        {x: 80, y: 0.74, rx: 260, ry: 130, c: bankL},
        {x: 960, y: 0.82, rx: 230, ry: 150, c: bankD},
        {x: 260, y: 0.94, rx: 300, ry: 140, c: bankD},
        {x: 860, y: 0.66, rx: 180, ry: 80, c: bankD},
      ].map((p, i) => (
        <ellipse key={i} cx={p.x} cy={H * p.y} rx={p.rx} ry={p.ry} fill={p.c} opacity={0.4} />
      ))}
      {/* fall: red dwarf-birch shrub clusters on the banks */}
      {fall && [
        {x: 150, y: 0.58}, {x: 940, y: 0.5}, {x: 120, y: 0.86}, {x: 930, y: 0.72}, {x: 250, y: 0.7},
      ].map((p, i) => (
        <g key={i}>
          {[0, 1, 2, 3].map((j) => (
            <circle key={j} cx={p.x + (j * 37) % 70 - 30} cy={H * p.y + (j * 23) % 40 - 20}
              r={14 + (j * 7) % 12} fill="#96412a" opacity={0.75} />
          ))}
        </g>
      ))}
      {/* bank spruces, bigger toward the viewer */}
      {[
        {x: 90, y: 0.46, s: 0.7}, {x: 990, y: 0.44, s: 0.6}, {x: 950, y: 0.6, s: 1.0},
        {x: 60, y: 0.64, s: 1.1}, {x: 1010, y: 0.85, s: 1.7}, {x: 100, y: 0.92, s: 1.9},
      ].map((p, i) => {
        const hh = 110 * p.s;
        const sway = 3 * Math.sin(f / 26 + i * 1.4);
        return (
          <g key={i} transform={`translate(${p.x + sway},${H * p.y})`}>
            <rect x={-4 * p.s} y={-hh * 0.2} width={8 * p.s} height={hh * 0.22} fill="#4a3520" />
            <path d={`M${-34 * p.s},0 L0,${-hh} L${34 * p.s},0 Z`} fill="#1f3528" />
            <path d={`M${-24 * p.s},${-hh * 0.34} L0,${-hh} L${24 * p.s},${-hh * 0.34} Z`} fill="#2a4534" />
          </g>
        );
      })}
      {/* gravel margins under the channel edge, then the water on top */}
      <path d={channel(34)} fill="#b0a088" />
      <path d={channel(14)} fill="#8a7c64" opacity={0.6} />
      <path d={channel(0)} fill="url(#rvWater)" />
      {/* the braid bar: a gravel teardrop ALIGNED WITH THE FLOW at t=0.62 */}
      <g transform={`rotate(-30 ${ctr(0.62).toFixed(0)} ${(yTop + 0.62 * span).toFixed(0)})`}>
        <ellipse cx={ctr(0.62)} cy={yTop + 0.62 * span} rx={24} ry={74} fill="#a89a84" />
        <ellipse cx={ctr(0.62)} cy={yTop + 0.62 * span - 6} rx={16} ry={58} fill="#c2b49c" />
        {Array.from({length: 6}).map((_, i) => (
          <circle key={i} cx={ctr(0.62) - 9 + (i * 13) % 20} cy={yTop + 0.62 * span - 48 + (i * 33) % 96}
            r={2 + i % 3} fill="#8a7c64" opacity={0.8} />
        ))}
      </g>
      {/* current lines riding the centerline downstream */}
      {Array.from({length: 9}).map((_, i) => {
        const t = ((f * (1.1 + (i % 3) * 0.5) * ri + i * 130) % 620) / 620;
        const y = yTop + 30 + t * (span - 60);
        const tt = (y - yTop) / span;
        const x = ctr(tt) + ((i % 3) - 1) * wid(tt) * 0.26;
        return <path key={i} d={`M${x},${y} q${14 + tt * 20},${16 + tt * 20} ${4 + tt * 8},${40 + tt * 30}`}
          fill="none" stroke="#cfe6f0" strokeWidth={2.5 + tt * 2.5} opacity={0.45 * ri} strokeLinecap="round" />;
      })}
      {/* riffle sparkle, kept inside the channel */}
      {Array.from({length: 12}).map((_, i) => {
        const tt = 0.1 + ((i * 67) % 80) / 100;
        const y = yTop + tt * span;
        const tw = Math.sin(f / 6 + i * 1.7);
        return tw > 0.5 ? (
          <circle key={i} cx={ctr(tt) + (((i * 53) % 60) - 30) / 60 * wid(tt) * 0.7} cy={y}
            r={2 + tt * 2} fill="#fff" opacity={0.8 * ri} />
        ) : null;
      })}
    </svg>
  );
};
