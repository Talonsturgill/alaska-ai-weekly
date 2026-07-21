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

// ---------------------------------------------------------------- MAIN STREET
// Small-town Alaska main street (Talkeetna/Seward energy): one-point perspective
// down a gravel road, false-front storefronts converging both sides, power poles
// with sagging wires, a pennant string fluttering across the street, a big
// snow-capped massif closing the view. Params: `dusk` 0..1 (warms the sky,
// lights the windows), `banner`. Motion: pennant flutter, puddle shimmer,
// cloud drift, dusk window flicker.
export const MainStreetBG: React.FC<{f: number; dusk?: number; banner?: boolean}> = ({f, dusk = 0, banner = true}) => {
  const du = Math.max(0, Math.min(1, dusk));
  const VPX = 540, VPY = 1030;
  const s = (t: number) => Math.pow(1 - t, 1.4);
  const gy = (t: number) => VPY + 870 * s(t);
  const sx = (t: number, baseX: number) => VPX + (baseX - VPX) * s(t);
  // each building = a camera-facing STOREFRONT face (lit, door + shop window +
  // sign) plus the street-side wall receding to the VP (shadow side). Without
  // the front face the row read as leaning cards in pass 1.
  const facade = (tF: number, tB: number, baseX: number, h: number, col: string, colD: string, key: string, parapet: 'flat' | 'step' | 'arc') => {
    const sgn = baseX < VPX ? -1 : 1;
    const xO = sx(tF, baseX + sgn * 420);
    const xF = sx(tF, baseX), xB = sx(tB, baseX);
    const yF = gy(tF), yB = gy(tB);
    const yFT = yF - h * s(tF), yBT = yB - h * s(tB);
    const sf = s(tF);
    const dw = 64 * sf, dh = 150 * sf;                      // door
    const dx = xF + sgn * 90 * sf;
    const wwx = xF + sgn * 320 * sf, wwx2 = xF + sgn * 170 * sf; // shop window
    const front = (
      <g>
        <rect x={Math.min(xO, xF)} y={yFT} width={Math.abs(xF - xO)} height={yF - yFT} fill={col} />
        <rect x={Math.min(xO, xF)} y={yFT - 30 * sf} width={Math.abs(xF - xO)} height={30 * sf} fill={colD} />
        <rect x={dx - dw / 2} y={yF - dh} width={dw} height={dh} fill="#2a2420" />
        <rect x={Math.min(wwx, wwx2)} y={yF - h * 0.52 * sf} width={Math.abs(wwx2 - wwx)} height={h * 0.3 * sf} fill="#2a3440" />
        <rect x={Math.min(wwx, wwx2)} y={yF - h * 0.52 * sf} width={Math.abs(wwx2 - wwx)} height={h * 0.3 * sf} fill="#ffb84a" opacity={du * 0.75} />
        <rect x={Math.min(wwx, wwx2) - 8 * sf} y={yF - h * 0.56 * sf} width={Math.abs(wwx2 - wwx) + 16 * sf} height={h * 0.05 * sf} fill={colD} />
        <rect x={Math.min(xO, xF)} y={yF - 8 * sf} width={Math.abs(xF - xO)} height={8 * sf} fill={colD} opacity={0.7} />
      </g>
    );
    const xM = (xF + xB) / 2, yMT = (yFT + yBT) / 2;
    const cap = parapet === 'flat'
      ? `M${xF},${yFT} L${xB},${yBT} L${xB},${yBT - 26 * s(tB)} L${xF},${yFT - 26 * s(tF)} Z`
      : parapet === 'step'
        ? `M${xF},${yFT} L${xB},${yBT} L${xB},${yBT - 20 * s(tB)} L${xM},${yMT - 20 * s((tF + tB) / 2)} L${xM},${yMT - 46 * s((tF + tB) / 2)} L${xF},${yFT - 46 * s(tF)} Z`
        : `M${xF},${yFT - 8 * s(tF)} Q${xM},${yMT - 60 * s((tF + tB) / 2)} ${xB},${yBT - 8 * s(tB)} L${xB},${yBT} L${xF},${yFT} Z`;
    // two window quads inset along the wall
    const win = (ta: number, tb: number) => {
      const wxF = sx(ta, baseX), wxB = sx(tb, baseX);
      const wyF = gy(ta) - h * 0.62 * s(ta), wyB = gy(tb) - h * 0.62 * s(tb);
      const wyF2 = gy(ta) - h * 0.3 * s(ta), wyB2 = gy(tb) - h * 0.3 * s(tb);
      return `M${wxF},${wyF} L${wxB},${wyB} L${wxB},${wyB2} L${wxF},${wyF2} Z`;
    };
    const t1 = tF + (tB - tF) * 0.18, t2 = tF + (tB - tF) * 0.44;
    const t3 = tF + (tB - tF) * 0.58, t4 = tF + (tB - tF) * 0.86;
    // window flicker at dusk: each window gates on its own slow sine
    const wOn = (seed: number) => du * (0.55 + 0.45 * (Math.sin(f / 34 + seed * 2.7) > -0.4 ? 1 : 0.3));
    return (
      <g key={key}>
        <path d={`M${xF},${yF} L${xB},${yB} L${xB},${yBT} L${xF},${yFT} Z`} fill={col} />
        <path d={`M${xF},${yF} L${xB},${yB} L${xB},${yBT} L${xF},${yFT} Z`} fill="#000" opacity={0.18} />
        <path d={cap} fill={colD} />
        <path d={win(t1, t2)} fill="#2a3440" />
        <path d={win(t3, t4)} fill="#2a3440" />
        <path d={win(t1, t2)} fill="#ffb84a" opacity={wOn(tF * 10)} />
        <path d={win(t3, t4)} fill="#ffb84a" opacity={wOn(tF * 10 + 1)} />
        <path d={`M${xF},${yF} L${xB},${yB} L${xB},${yB - 8 * s(tB)} L${xF},${yF - 8 * s(tF)} Z`} fill={colD} opacity={0.7} />
        {front}
      </g>
    );
  };
  const leftRow: Array<[number, number, number, string, string, 'flat' | 'step' | 'arc']> = [
    [0.02, 0.17, 600, '#8a4438', '#5f2c24', 'step'],
    [0.19, 0.34, 520, '#3f6a70', '#2a4a50', 'flat'],
    [0.36, 0.5, 560, '#b08a3c', '#7f6128', 'arc'],
    [0.52, 0.66, 480, '#6a7a84', '#48545c', 'step'],
  ];
  const rightRow: Array<[number, number, number, string, string, 'flat' | 'step' | 'arc']> = [
    [0.02, 0.16, 540, '#4a6a48', '#324a30', 'arc'],
    [0.18, 0.33, 620, '#9a5a70', '#6e3c50', 'step'],
    [0.35, 0.49, 500, '#b8b0a0', '#8a8274', 'flat'],
    [0.51, 0.65, 540, '#7a5038', '#553524', 'arc'],
  ];
  const roadPts = Array.from({length: 12}).map((_, i) => i / 11);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="msSkyD" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9cc0d8" />
          <stop offset="100%" stopColor="#dcecf0" />
        </linearGradient>
        <linearGradient id="msSkyN" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a3a62" />
          <stop offset="70%" stopColor="#b06a4e" />
          <stop offset="100%" stopColor="#e8a45e" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#msSkyD)" />
      <rect width={W} height={H} fill="url(#msSkyN)" opacity={du} />
      {/* drifting cloud */}
      {[0, 1].map((i) => {
        const x = ((f * (0.35 + i * 0.2) + i * 460) % (W + 360)) - 180;
        return (
          <g key={i} opacity={0.7 - du * 0.3}>
            <ellipse cx={x} cy={250 + i * 170} rx={120 + i * 30} ry={24} fill="#f2f8fa" />
            <ellipse cx={x + 70} cy={260 + i * 170} rx={80} ry={17} fill="#f2f8fa" />
          </g>
        );
      })}
      {/* the massif closing the street */}
      <path d={`M180,${VPY} L380,660 q40,-60 90,-20 L540,540 q40,-30 80,20 L720,690 q60,-40 110,20 L900,${VPY} Z`} fill="#7d94a8" />
      <path d={`M470,640 L540,540 L610,640 q-40,26 -70,-6 q-36,30 -70,6 Z`} fill="#eef5f8" />
      <path d={`M380,660 q40,-60 90,-20 L500,700 q-60,20 -120,-40 Z`} fill="#eef5f8" opacity={0.8} />
      <rect x={0} y={VPY - 4} width={W} height={4} fill="#6a8296" opacity={0.6} />
      {/* gravel road converging to the VP + center dashes + puddle */}
      <path d={`M${roadPts.map((t) => `${sx(t, 140).toFixed(1)},${gy(t).toFixed(1)}`).join(' L')} L${roadPts.slice().reverse().map((t) => `${sx(t, 940).toFixed(1)},${gy(t).toFixed(1)}`).join(' L')} Z`}
        fill={du > 0.5 ? '#6a5e54' : '#8a7e70'} />
      {[0.04, 0.15, 0.26, 0.37, 0.48, 0.59].map((t, i) => (
        <path key={i} d={`M${540 - 9 * s(t)},${gy(t)} L${540 + 9 * s(t)},${gy(t)} L${540 + 9 * s(t + 0.045)},${gy(t + 0.045)} L${540 - 9 * s(t + 0.045)},${gy(t + 0.045)} Z`}
          fill="#d8ccb4" opacity={0.75} />
      ))}
      <ellipse cx={660} cy={1720} rx={95} ry={20} fill={du > 0.5 ? '#e8a45e' : '#b8d4e0'} opacity={0.55} />
      <path d={`M${610 + 8 * Math.sin(f / 9)},1718 q40,${-3 + 2 * Math.sin(f / 7)} 90,0`} fill="none" stroke="#f2f8fa" strokeWidth={3} opacity={0.5} />
      {/* storefront rows, deepest first so near fronts occlude far ones */}
      {leftRow.slice().reverse().map((b, i) => facade(b[0], b[1], 150, b[2], b[3], b[4], `L${i}`, b[5]))}
      {rightRow.slice().reverse().map((b, i) => facade(b[0], b[1], 930, b[2], b[3], b[4], `R${i}`, b[5]))}
      {/* power poles + sagging wires, right side */}
      {[0.08, 0.26, 0.44].map((t, i) => {
        const x = sx(t, 962), y = gy(t), hp = 660 * s(t);
        return (
          <g key={i}>
            <rect x={x - 5 * s(t)} y={y - hp} width={10 * s(t)} height={hp} fill="#3a3028" />
            <rect x={x - 40 * s(t)} y={y - hp + 18 * s(t)} width={80 * s(t)} height={8 * s(t)} fill="#3a3028" />
          </g>
        );
      })}
      {[[0.08, 0.26], [0.26, 0.44]].map(([ta, tb], i) => {
        const xa = sx(ta, 962), ya = gy(ta) - 660 * s(ta) + 22 * s(ta);
        const xb = sx(tb, 962), yb = gy(tb) - 660 * s(tb) + 22 * s(tb);
        const sag = 46 * s((ta + tb) / 2) + 3 * Math.sin(f / 22 + i);
        return <path key={i} d={`M${xa},${ya} Q${(xa + xb) / 2},${(ya + yb) / 2 + sag} ${xb},${yb}`} fill="none" stroke="#2a241e" strokeWidth={3.5 * s(ta)} />;
      })}
      {/* pennant string across the street */}
      {banner && (() => {
        const t = 0.09;
        const xa = sx(t, 150), xb = sx(t, 930);
        const ya = gy(t) - 600 * s(t), yb = ya + 10;
        const cols = ['#d84a3a', '#e8b84a', '#4a8ad8', '#4aa86a', '#d84a3a', '#e8b84a', '#4a8ad8'];
        return (
          <g>
            <path d={`M${xa},${ya} Q${(xa + xb) / 2},${ya + 42} ${xb},${yb}`} fill="none" stroke="#3a3028" strokeWidth={3} />
            {cols.map((c, i) => {
              const u = (i + 0.5) / cols.length;
              const px = xa + (xb - xa) * u;
              const py = ya + 42 * 4 * u * (1 - u) * 0.5 + (ya - ya) + 21 * Math.sin(Math.PI * u);
              const fl = 14 * Math.sin(f / 6 + i * 1.3);
              return <path key={i} d={`M${px - 16},${py} L${px + 16},${py} L${px + fl * 0.3},${py + 40 + fl * 0.2}Z`} fill={c} transform={`rotate(${fl * 0.4} ${px} ${py})`} />;
            })}
          </g>
        );
      })()}
    </svg>
  );
};

// ---------------------------------------------------------------- NORTH SLOPE OILFIELD
// Prudhoe Bay energy: a vast flat plain to the horizon, drill-rig derrick +
// steel modules on a gravel pad, a flare stack burning, the pipeline running
// across the foreground on VSM supports. Params: `season` winter/summer,
// `flare` 0..1. Motion: flame flicker + glow breathing, beacon blink, blowing
// snow (winter) / pond shimmer (summer), drifting cloud.
export const OilfieldBG: React.FC<{f: number; season?: 'winter' | 'summer'; flare?: number}> = ({f, season = 'winter', flare = 0.8}) => {
  const fl = Math.max(0, Math.min(1, flare));
  const win = season === 'winter';
  const horY = H * 0.62;
  const plain = win ? '#e6ebf0' : '#8f9a68';
  const plainD = win ? '#cdd8e2' : '#76824f';
  const flick = 1 + 0.18 * Math.sin(f / 3) + 0.1 * Math.sin(f / 1.7 + 2);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="ofSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={win ? '#8fa8bc' : '#9cc0d8'} />
          <stop offset="100%" stopColor={win ? '#e8d8c8' : '#d8e8e2'} />
        </linearGradient>
        <radialGradient id="ofGlow">
          <stop offset="0%" stopColor="#ffb84a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffb84a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ofSky)" />
      {/* low arctic sun in a haze band, kept LEFT so it never reads as one
          blob with the flare (they merged in pass 1) */}
      <ellipse cx={260} cy={horY - 150} rx={340} ry={70} fill="#f2e2ce" opacity={0.6} />
      <circle cx={260} cy={horY - 160} r={54} fill="#f8ead2" />
      <circle cx={260} cy={horY - 160} r={38} fill="#fdf6e4" />
      {/* drifting clouds so the big sky is never dead space */}
      {[0, 1].map((i) => {
        const x = ((f * (0.4 + i * 0.25) + i * 520) % (W + 420)) - 210;
        const y = 260 + i * 210;
        return (
          <g key={i} opacity={0.7}>
            <ellipse cx={x} cy={y} rx={140 + i * 40} ry={26} fill="#eef5f8" />
            <ellipse cx={x - 70} cy={y + 10} rx={85} ry={18} fill="#eef5f8" />
            <ellipse cx={x + 80} cy={y + 8} rx={95} ry={20} fill="#eef5f8" />
          </g>
        );
      })}
      {/* distant rigs on the horizon */}
      {[220, 420].map((x, i) => (
        <g key={i} opacity={0.55}>
          <path d={`M${x - 16},${horY} L${x - 5},${horY - 64} L${x + 5},${horY - 64} L${x + 16},${horY} Z`} fill="#5a6a78" />
          <rect x={x + 20} y={horY - 22} width={44} height={22} fill="#5a6a78" />
        </g>
      ))}
      {/* the plain with drift/mottle streaks */}
      <rect x={0} y={horY} width={W} height={H - horY} fill={plain} />
      {Array.from({length: 7}).map((_, i) => (
        <ellipse key={i} cx={(i * 271) % W} cy={horY + 60 + i * 105} rx={200 + (i * 67) % 140} ry={16 + i * 4}
          fill={i % 2 ? plainD : (win ? '#f6fafc' : '#a0aa76')} opacity={0.6} />
      ))}
      {/* summer: melt ponds catching the sky */}
      {!win && [
        {x: 170, y: horY + 150, rx: 120, ry: 26}, {x: 880, y: horY + 320, rx: 150, ry: 34}, {x: 320, y: horY + 480, rx: 100, ry: 24},
      ].map((p, i) => (
        <g key={i}>
          <ellipse cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill="#a8c8d8" />
          <path d={`M${p.x - p.rx * 0.5 + 10 * Math.sin(f / 11 + i)},${p.y} q${p.rx * 0.4},${-4} ${p.rx * 0.9},0`} fill="none" stroke="#dcecf0" strokeWidth={3} opacity={0.7} />
        </g>
      ))}
      {/* gravel pad */}
      <path d={`M60,${horY + 330} L900,${horY + 330} L980,${horY + 470} L-20,${horY + 470} Z`} fill={win ? '#c2bcae' : '#b0a894'} />
      {/* steel modules */}
      <rect x={120} y={horY + 190} width={230} height={140} fill="#48688a" />
      <rect x={120} y={horY + 190} width={230} height={26} fill="#365072" />
      <rect x={168} y={horY + 262} width={40} height={68} fill="#2a3e56" />
      <rect x={240} y={horY + 230} width={54} height={38} fill="#8fb2cc" />
      <rect x={370} y={horY + 240} width={150} height={90} fill="#54748e" />
      <rect x={370} y={horY + 240} width={150} height={20} fill="#3e5a74" />
      {/* derrick: tapering lattice + blinking beacon */}
      {(() => {
        const bx = 620, by = horY + 330, hh = 470;
        const rail = (sgn: 1 | -1) => `M${bx + sgn * 90},${by} L${bx + sgn * 22},${by - hh}`;
        return (
          <g>
            <path d={`M${bx - 90},${by} L${bx - 22},${by - hh} L${bx + 22},${by - hh} L${bx + 90},${by} Z`} fill="#3a4a58" opacity={0.25} />
            <path d={rail(1)} stroke="#33434f" strokeWidth={9} fill="none" />
            <path d={rail(-1)} stroke="#33434f" strokeWidth={9} fill="none" />
            {Array.from({length: 6}).map((_, i) => {
              const u0 = i / 6, u1 = (i + 1) / 6;
              const w0 = 90 - 68 * u0, w1 = 90 - 68 * u1;
              const y0 = by - hh * u0, y1 = by - hh * u1;
              return (
                <g key={i} stroke="#33434f" strokeWidth={5} fill="none">
                  <path d={`M${bx - w0},${y0} L${bx + w1},${y1}`} />
                  <path d={`M${bx + w0},${y0} L${bx - w1},${y1}`} />
                  <path d={`M${bx - w1},${y1} L${bx + w1},${y1}`} />
                </g>
              );
            })}
            <rect x={bx - 30} y={by - hh - 26} width={60} height={26} fill="#33434f" />
            <circle cx={bx} cy={by - hh - 34} r={7} fill="#ff4a3a" opacity={Math.sin(f / 9) > 0 ? 1 : 0.15} />
          </g>
        );
      })()}
      {/* flare stack + living flame */}
      {(() => {
        const fx = 860, fy = horY + 330;
        const tip = fy - 400;
        return (
          <g>
            <ellipse cx={fx} cy={tip - 30} rx={130 * fl * flick} ry={90 * fl * flick} fill="url(#ofGlow)" opacity={0.8 * fl} />
            <rect x={fx - 8} y={tip} width={16} height={400} fill="#4a5a68" />
            <path d={`M${fx - 22},${tip} L${fx + 22},${tip} L${fx + 12},${tip + 26} L${fx - 12},${tip + 26} Z`} fill="#33434f" />
            {fl > 0.05 && (
              <g transform={`translate(${fx},${tip}) scale(${0.8 + 0.4 * fl})`}>
                <path d={`M0,0 q${-20 - 8 * Math.sin(f / 3)},${-46} ${-4 + 5 * Math.sin(f / 2.3)},${-88 * flick} q${16},${34} ${20 + 6 * Math.sin(f / 2.7)},${88} Z`} fill="#ff8a2a" />
                <path d={`M0,-6 q${-10},${-30} ${-2 + 3 * Math.sin(f / 2.1)},${-56 * flick} q${9},${22} ${12},${56} Z`} fill="#ffd24a" />
              </g>
            )}
          </g>
        );
      })()}
      {/* THE pipeline on VSM supports across the foreground */}
      {(() => {
        const py = H * 0.83;
        const seg = (x: number) => py + 14 * Math.sin(x / 260);
        const xs = Array.from({length: 8}).map((_, i) => i * 155 - 10);
        return (
          <g>
            {xs.map((x, i) => (
              <g key={i}>
                <rect x={x - 7} y={seg(x)} width={14} height={150} fill="#4a4238" />
                <rect x={x - 30} y={seg(x) - 6} width={60} height={13} fill="#4a4238" />
              </g>
            ))}
            <path d={`M-20,${seg(-20) - 28} ${xs.map((x) => `L${x + 75},${seg(x + 75) - 28}`).join(' ')} L1100,${seg(1100) - 28}`}
              fill="none" stroke="#6e7a84" strokeWidth={48} strokeLinecap="round" />
            <path d={`M-20,${seg(-20) - 42} ${xs.map((x) => `L${x + 75},${seg(x + 75) - 42}`).join(' ')} L1100,${seg(1100) - 42}`}
              fill="none" stroke="#b8c4cc" strokeWidth={12} opacity={0.9} />
            {win && <path d={`M-20,${seg(-20) - 50} ${xs.map((x) => `L${x + 75},${seg(x + 75) - 50}`).join(' ')} L1100,${seg(1100) - 50}`}
              fill="none" stroke="#f6fafc" strokeWidth={12} opacity={0.9} />}
          </g>
        );
      })()}
      {/* winter: blowing snow streaks */}
      {win && Array.from({length: 8}).map((_, i) => {
        const x = ((f * (11 + (i % 3) * 5) + i * 170) % (W + 340)) - 170;
        const y = horY + 90 + (i * 137) % (H - horY - 160);
        return <path key={i} d={`M${x},${y} q60,${-4} 120,0`} fill="none" stroke="#fbfdff" strokeWidth={4} opacity={0.55} strokeLinecap="round" />;
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- ANCHORAGE SKYLINE
// NET-NEW 2026-07-21, v2 after taste-loop (v1 stacked the city INTO the inlet).
// Reference: docs/craft/ANCHORAGE_LANDMARKS.md. The postcard order (coastal-
// trail vantage): sky -> tiny pale DENALI far north on the horizon -> MT.
// SUSITNA "SLEEPING LADY" reclining across the water -> the CHUGACH wall ->
// the low city band ON ITS BLUFF (ConocoPhillips + Atwood slabs, the Hotel
// Captain Cook's three stair-stepped MUSTARD towers) -> COOK INLET in the
// FOREGROUND -> the Tony Knowles coastal-trail strip at the bottom (stage for
// a wandering moose). Fall = termination dust + golden light. Landmarks stay
// lowkey background; never pointed at.
export const AnchorageSkylineBG: React.FC<{
  f: number; season?: 'summer' | 'fall'; denali?: boolean; floatplane?: boolean; train?: boolean;
}> = ({f, season = 'summer', denali = true, floatplane = true, train = false}) => {
  const fall = season === 'fall';
  const skyTop = fall ? '#f2d3a0' : '#cfe4ee';
  const skyLow = fall ? '#e6a968' : '#a8cadb';
  const chug1 = fall ? '#6a7050' : '#54705c';   // lit face
  const chug2 = fall ? '#4c523a' : '#3d5546';   // shade face
  const inlet1 = fall ? '#a8b8ae' : '#8fb0b6';
  const inlet2 = fall ? '#7c9088' : '#6a8c94';
  const MUST = '#d2a63c';
  const MUST_D = '#9c7a26';
  const INKB = '#2c3138';
  const CITY_Y = 1140;          // rooftop baseline (city band bottom edge)
  const WATER_Y = 1180;         // inlet starts (in FRONT of the city bluff)
  const TRAIL_Y = 1620;
  const planeX = ((f * 2.6 + 700) % (W + 500)) - 250;
  const win = (x: number, y: number, w: number, rows: number, cols: number, lit: number) => (
    Array.from({length: rows * cols}).map((_, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const on = ((x * 7 + r * 13 + c * 5) % 10) < lit;
      return <rect key={i} x={x + 8 + c * ((w - 12) / cols)} y={y + 10 + r * 22} width={(w - 12) / cols - 6} height={12}
        fill={on ? (fall ? '#f6d88a' : '#dce8ee') : '#39434c'} opacity={on ? 0.95 : 0.6} />;
    })
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="ancSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyLow} />
        </linearGradient>
        <linearGradient id="ancInlet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={inlet1} />
          <stop offset="100%" stopColor={inlet2} />
        </linearGradient>
        <linearGradient id="ancTower" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={fall ? '#d8cab0' : '#cdd6dc'} />
          <stop offset="62%" stopColor={fall ? '#b8a888' : '#a8b4bc'} />
          <stop offset="100%" stopColor={fall ? '#96876a' : '#87939c'} />
        </linearGradient>
        <linearGradient id="ancMust" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e4bc56" />
          <stop offset="60%" stopColor={MUST} />
          <stop offset="100%" stopColor="#b08a2c" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ancSky)" />
      {/* low sun + drifting clouds (ambient region 1) */}
      <circle cx={190} cy={430} r={64} fill="#fdf3d8" opacity={0.9} />
      <circle cx={190} cy={430} r={110} fill="#fceec2" opacity={0.35} />
      {[0, 1, 2].map((i) => {
        const cx = ((f * (0.5 + i * 0.3) + i * 430) % (W + 400)) - 200;
        return <ellipse key={i} cx={cx} cy={300 + i * 120} rx={140 - i * 26} ry={17} fill="#fff" opacity={0.45} />;
      })}
      {/* Denali: lone white massif floating on the far-north horizon */}
      {denali && (
        <g opacity={0.9}>
          <path d="M28,880 L86,782 L104,806 L120,788 L150,812 L196,880 Z" fill="#f6fafb" stroke="#c2d4da" strokeWidth={3.5} />
          <path d="M86,782 L104,806 L96,880 L60,880 Z" fill="#dce8ec" opacity={0.8} />
        </g>
      )}
      {/* Sleeping Lady (Mt. Susitna): the reclining woman, left horizon across the
          water: head knob, chest rise, long legs tapering away */}
      <g opacity={0.85}>
        <path d={`M-40,${CITY_Y - 26} L-40,912 L20,910 q22,-2 34,-18 q10,-14 24,-14 q14,0 22,12 q8,12 22,16 q30,8 52,26 q36,26 96,34 q60,8 130,10 L340,${CITY_Y - 26} Z`}
          fill={fall ? '#b0a28c' : '#9cadb4'} />
        <path d={`M-40,940 L340,${CITY_Y - 30} L340,${CITY_Y - 26} L-40,${CITY_Y - 26} Z`} fill={fall ? '#9c8f7a' : '#8a9ba2'} opacity={0.7} />
      </g>
      {/* CHUGACH WALL: one continuous irregular ridge running down BEHIND the city
          band (no sky gap), with lit/shade facets, foothills, and dust caps */}
      <g>
        <path d={`M150,${CITY_Y} L150,930 q60,-30 110,-96 L330,720 L420,672 L500,782 L560,742 L634,636 L706,760 L782,706 L852,664 L930,782 L988,742 L1080,660 L1080,${CITY_Y} Z`} fill={chug1} />
        {/* shade faces: each falls from its summit along the descent lines */}
        <path d={`M420,672 L500,782 L536,860 L470,${CITY_Y} L400,${CITY_Y} L392,760 Z`} fill={chug2} opacity={0.55} />
        <path d={`M634,636 L706,760 L724,846 L664,${CITY_Y} L600,${CITY_Y} L608,742 Z`} fill={chug2} opacity={0.5} />
        <path d={`M852,664 L930,782 L946,858 L888,${CITY_Y} L826,${CITY_Y} L830,742 Z`} fill={chug2} opacity={0.5} />
        {/* Flattop's flat table on the right shoulder */}
        <path d={`M960,800 L992,756 L1052,756 L1080,792 L1080,${CITY_Y} L960,${CITY_Y} Z`} fill={chug2} opacity={0.9} />
        <path d="M992,756 L1052,756 L1046,770 L1000,770 Z" fill="#fbfdff" opacity={fall ? 1 : 0.6} />
        {/* termination dust caps following the real summits */}
        <g opacity={fall ? 1 : 0.55}>
          <path d="M398,700 L420,672 L444,704 L430,714 L412,706 Z" fill="#fbfdff" />
          <path d="M612,668 L634,636 L658,670 L644,682 L626,672 Z" fill="#fbfdff" />
          <path d="M832,692 L852,664 L876,694 L862,706 L846,696 Z" fill="#fbfdff" />
          <path d="M310,742 L330,720 L352,748 L332,756 Z" fill="#fbfdff" opacity={0.8} />
        </g>
        {/* solid foothill treeline just behind the rooftops */}
        <path d={`M150,${CITY_Y} q120,-52 260,-40 l14,-14 l12,14 q140,14 300,-10 l12,-14 l14,14 q160,18 300,-6 l10,-12 l12,12 q60,4 86,2 L1080,${CITY_Y} Z`}
          fill={chug2} />
      </g>
      {/* THE CITY BAND on its bluff (in front of the Chugach base) */}
      <g>
        {/* bluff */}
        <rect x={0} y={CITY_Y} width={W} height={WATER_Y - CITY_Y + 14} fill={fall ? '#8a7c5e' : '#74806a'} />
        <line x1={0} y1={CITY_Y} x2={W} y2={CITY_Y} stroke={INKB} strokeWidth={3} opacity={0.4} />
        {/* filler low blocks, boxy, window grids, rooftop clutter */}
        {[[16, 66, 88], [116, 92, 96], [386, 60, 78], [478, 104, 92], [700, 72, 84], [796, 56, 110], [918, 88, 90]].map(([bx, bh, bw], i) => (
          <g key={i}>
            <rect x={bx} y={CITY_Y - bh} width={bw} height={bh} fill="url(#ancTower)" stroke={INKB} strokeWidth={4} />
            {win(bx, CITY_Y - bh, bw, Math.max(1, Math.floor(bh / 26)), 3, 4)}
            <rect x={bx + bw * 0.2} y={CITY_Y - bh - 8} width={10} height={8} fill={INKB} opacity={0.7} />
            {i % 2 === 0 && <line x1={bx + bw * 0.7} y1={CITY_Y - bh} x2={bx + bw * 0.7} y2={CITY_Y - bh - 16} stroke={INKB} strokeWidth={3} />}
          </g>
        ))}
        {/* ConocoPhillips + Atwood: the two tallest slabs */}
        <g>
          <rect x={560} y={CITY_Y - 218} width={66} height={218} fill="url(#ancTower)" stroke={INKB} strokeWidth={4.5} />
          {win(560, CITY_Y - 218, 66, 8, 3, 5)}
          <rect x={560} y={CITY_Y - 218} width={66} height={10} fill="#e8eef2" opacity={0.7} />
          <rect x={634} y={CITY_Y - 184} width={58} height={184} fill="url(#ancTower)" stroke={INKB} strokeWidth={4.5} opacity={0.96} />
          {win(634, CITY_Y - 184, 58, 7, 3, 4)}
          <line x1={593} y1={CITY_Y - 218} x2={593} y2={CITY_Y - 234} stroke={INKB} strokeWidth={3.5} />
          <circle cx={593} cy={CITY_Y - 238} r={3.5} fill="#e84c3c" opacity={0.6 + 0.4 * Math.sin(f / 9)} />
        </g>
        {/* HOTEL CAPTAIN COOK: three stair-stepped mustard towers, shaded */}
        <g>
          {[[168, 118, 54], [228, 164, 56], [290, 198, 58]].map(([bx, bh, bw], i) => (
            <g key={i}>
              <rect x={bx} y={CITY_Y - bh} width={bw} height={bh} fill="url(#ancMust)" stroke={MUST_D} strokeWidth={4.5} />
              {Array.from({length: Math.floor(bh / 24)}).map((_, r) => (
                <rect key={r} x={bx + 7} y={CITY_Y - bh + 10 + r * 24} width={bw - 14} height={5.5} fill={MUST_D} opacity={0.45} />
              ))}
              <rect x={bx} y={CITY_Y - bh} width={bw} height={7} fill="#f0d488" opacity={0.8} />
            </g>
          ))}
        </g>
      </g>
      {/* COOK INLET in the FOREGROUND, with moving glints + a gull (regions 2+3) */}
      <rect x={0} y={WATER_Y} width={W} height={TRAIL_Y - WATER_Y} fill="url(#ancInlet)" />
      {/* city reflections: broken vertical smears that wobble with the water */}
      <g opacity={0.3}>
        {[[576, 40, 110, '#e8eef2'], [648, 30, 84, '#cfd8dc'], [186, 34, 70, MUST], [244, 36, 84, MUST], [304, 38, 96, MUST]].map(([rx, rw, rh, rc], i) => (
          <path key={i}
            d={`M${rx},${WATER_Y} q${6 * Math.sin(f / 16 + (i as number))},${(rh as number) * 0.4} 0,${rh} l${rw},0 q${-6 * Math.sin(f / 16 + (i as number))},${-(rh as number) * 0.5} 0,${-rh} Z`}
            fill={rc as string} />
        ))}
        {[0, 1, 2].map((i) => (
          <path key={`b${i}`} d={`M${170 + i * 240},${WATER_Y + 40 + i * 26} q60,8 140,2`} stroke={inlet1} strokeWidth={10} fill="none" opacity={0.8} />
        ))}
      </g>
      {[0, 1, 2, 3].map((i) => {
        const gx = ((f * (0.9 + i * 0.35) + i * 300) % (W + 240)) - 120;
        return <path key={i} d={`M${gx},${WATER_Y + 60 + i * 96} q46,-7 92,0`} fill="none" stroke="#f2f8f6" strokeWidth={4} opacity={0.5} strokeLinecap="round" />;
      })}
      {/* mudflat streak (bore-tide Anchorage water is silty) */}
      <path d={`M0,${TRAIL_Y - 60} q300,${-16 + 6 * Math.sin(f / 30)} 640,-8 q260,6 440,-14 L1080,${TRAIL_Y} L0,${TRAIL_Y} Z`} fill={fall ? '#9a8a70' : '#8a9078'} opacity={0.5} />
      {/* optional blue-and-gold Alaska Railroad consist skirting the waterline */}
      {train && (
        <g transform={`translate(${((f * 1.8) % (W + 500)) - 250},${TRAIL_Y - 66})`}>
          {[0, 1, 2].map((c) => (
            <g key={c} transform={`translate(${c * -132},0)`}>
              <rect x={-60} y={-30} width={120} height={30} rx={6} fill="#1e3f6e" stroke={INKB} strokeWidth={3.5} />
              <rect x={-60} y={-16} width={120} height={7} fill="#e8b23a" />
              {c === 0 && <rect x={38} y={-44} width={26} height={14} rx={4} fill="#1e3f6e" stroke={INKB} strokeWidth={3} />}
              <circle cx={-34} cy={2} r={7} fill={INKB} />
              <circle cx={34} cy={2} r={7} fill={INKB} />
            </g>
          ))}
        </g>
      )}
      {/* the Tony Knowles coastal-trail strip: curving path, wooden rail, shrubs */}
      <rect x={0} y={TRAIL_Y} width={W} height={H - TRAIL_Y} fill={fall ? '#8a7c50' : '#6b7a52'} />
      {/* wooden railing along the waterline */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <g key={`rp${i}`} transform={`translate(${40 + i * 145},${TRAIL_Y + 6})`}>
          <rect x={-5} y={-34} width={10} height={40} rx={3} fill="#8a6a42" stroke={INKB} strokeWidth={2.5} />
        </g>
      ))}
      <path d={`M0,${TRAIL_Y - 16} q270,-8 540,-2 q290,6 540,-8`} fill="none" stroke="#8a6a42" strokeWidth={8} opacity={0.95} />
      <path d={`M0,${TRAIL_Y - 14} q270,-8 540,-2 q290,6 540,-8`} fill="none" stroke={INKB} strokeWidth={2} opacity={0.4} />
      {/* the paved trail curving through */}
      <path d={`M-20,${TRAIL_Y + 120} q300,-40 560,-14 q300,30 560,-30 l0,70 q-260,44 -560,24 q-300,-20 -560,14 Z`}
        fill={fall ? '#b8a67c' : '#a8a684'} stroke={INKB} strokeWidth={3.5} opacity={0.92} />
      <path d={`M-20,${TRAIL_Y + 152} q300,-36 560,-12 q300,26 560,-28`} fill="none" stroke="#8a7a5c" strokeWidth={3} strokeDasharray="24 22" opacity={0.5} />
      {/* alder shrubs + fireweed pokes */}
      {Array.from({length: 7}).map((_, i) => (
        <g key={`sh${i}`} transform={`translate(${(30 + i * 163) % W},${TRAIL_Y + 46 + (i * 71) % 150})`}>
          <ellipse cx={0} cy={0} rx={26 + (i % 3) * 8} ry={14 + (i % 2) * 5} fill={fall ? '#7c6c3c' : '#55663c'} stroke={INKB} strokeWidth={2.5} opacity={0.9} />
          {(i % 3 === 0) && <path d={`M${18 + (i % 2) * 6},2 q3,-22 0,-30 M${20 + (i % 2) * 6},-26 l4,4 M${16 + (i % 2) * 6},-18 l-4,4`} stroke={fall ? '#b05a7c' : '#c46a90'} strokeWidth={3} fill="none" />}
        </g>
      ))}
      {/* red-and-white floatplane crossing (Lake Hood habit; ambient region 4) */}
      {floatplane && (
        <g transform={`translate(${planeX},${520 + 10 * Math.sin(f / 14)}) rotate(-3)`}>
          <ellipse cx={0} cy={0} rx={46} ry={12} fill="#d8402c" stroke="#7c2014" strokeWidth={4} />
          <rect x={-8} y={-18} width={36} height={12} rx={6} fill="#f4f6f8" stroke="#7c2014" strokeWidth={3.5} />
          <path d="M-2,-6 L-34,-24 L-16,-3 Z" fill="#f4f6f8" stroke="#7c2014" strokeWidth={3.5} />
          <rect x={40} y={-8} width={10} height={16} rx={3} fill="#f4f6f8" stroke="#7c2014" strokeWidth={3} />
          <line x1={-20} y1={12} x2={-20} y2={22} stroke="#7c2014" strokeWidth={3.5} />
          <line x1={18} y1={12} x2={18} y2={22} stroke="#7c2014" strokeWidth={3.5} />
          <ellipse cx={-14} cy={26} rx={24} ry={5.5} fill="#e8e2d4" stroke="#7c2014" strokeWidth={3.5} />
          <ellipse cx={22} cy={26} rx={24} ry={5.5} fill="#e8e2d4" stroke="#7c2014" strokeWidth={3.5} />
          {/* prop blur disc */}
          <ellipse cx={52} cy={0} rx={4} ry={15 + 3 * Math.sin(f * 2)} fill="#c8ccd0" opacity={0.6} />
        </g>
      )}
    </svg>
  );
};
