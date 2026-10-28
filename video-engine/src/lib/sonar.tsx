import React from 'react';
import {INK, tones, FormGradient, ContactShadow} from './lighting';
import {rnd, MONO} from './prospect';

// =============================================================================
// SONAR — the COUNTING FAN family (2026-10-28, "The River It Never Saw").
// WEDGE is the hero: a squat slate base with two eyes, two brass tally wheels
// (LEFT-going and RIGHT-going) and a mint sonar fan that rises from its apex.
// Fish are amber EchoBlobs that cross a gold CENTER LINE. The line is the
// throughline object and has five states (bare, ruled, needle, dashed, hook).
// The fan can be darkened over its right third: black is the unknown.
// WEDGE is an INSTRUMENT, never a deployed system. It is drawn only inside the
// film's own sonar world or a labelled benchmark clip, never on a real bank.
// Local coords: apex at (0,0), the fan rises toward -y, the base hangs below.
// =============================================================================

export const SON = {
  abyss: '#03130F',
  ink: '#06201A',
  deep: '#0A2E25',
  fan: '#0E5560',
  mint: '#6FF2C6',
  mintDk: '#2FA98A',
  echo: '#FF9A2E',
  echoHi: '#FFD9A0',
  gold: '#FFE9A8',
  goldDk: '#B5832A',
  paper: '#F3EBD7',
  violet: '#8B7BC7',
  coral: '#FF6B4A',
  slate: '#27424A',
  slateHi: '#4B7380',
  brass: '#C9A24B',
  brassDk: '#8A6A22',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const FAN_A = 38; // half angle, degrees
const sinA = Math.sin((FAN_A * Math.PI) / 180);
const cosA = Math.cos((FAN_A * Math.PI) / 180);
const tanA = Math.tan((FAN_A * Math.PI) / 180);

/** the fan wedge path, apex at origin, radius R, optional inner start angle a0 and end a1 (degrees from vertical, + is right) */
export const fanPath = (R: number, a0 = -FAN_A, a1 = FAN_A) => {
  const p = (a: number) => [R * Math.sin((a * Math.PI) / 180), -R * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M0,0 L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
};

// ---- EchoBlobs -----------------------------------------------------------------------------------------------------------------------------
export const EchoBlobs: React.FC<{
  f: number; R?: number; n?: number; speed?: number; seed?: number;
  /** fraction of blobs that go left to right */
  dirRight?: number;
  /** x beyond which blobs vanish into the dark (local coords), undefined = none */
  darkX?: number;
  size?: number;
  /** 0..1 mint reticle boxes on blobs near the center line */
  boxes?: number;
  boxDash?: boolean;
  /** blobs only in this fraction of lanes, 0..1 from near to far */
  laneMin?: number;
  laneMax?: number;
  color?: string;
}> = ({f, R = 620, n = 80, speed = 1.6, seed = 0, dirRight = 0.78, darkX, size = 1, boxes = 0, boxDash = false, laneMin = 0.1, laneMax = 0.95, color = SON.echo}) => {
  const items: React.ReactNode[] = [];
  const boxesOut: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const k = i + seed * 977;
    const lane = laneMin + (laneMax - laneMin) * rnd(k * 3 + 1);
    const y = -R * cosA * lane + 7 * Math.sin(f / 19 + i);
    const hw = R * cosA * lane * tanA * 0.96;
    const dir = rnd(k * 7 + 2) < dirRight ? 1 : -1;
    const span = 2 * hw + 140;
    const v = speed * 1.4 * (0.55 + 0.9 * rnd(k * 5 + 3));
    const raw = f * v * dir + rnd(k) * span * 3;
    const m = ((raw % span) + span) % span;
    const x = m - span / 2;
    if (Math.abs(x) > hw) continue;
    if (darkX !== undefined && x > darkX) continue;
    const edge = clamp01(Math.min(hw - Math.abs(x), 60) / 60);
    const rx = (13 + 10 * rnd(k * 11 + 4)) * size * (0.6 + 0.5 * lane);
    const ry = rx * 0.5;
    const op = edge * (0.7 + 0.3 * rnd(k + 8));
    const near = Math.abs(x) < 22;
    items.push(
      <g key={i} transform={`translate(${x.toFixed(1)},${y.toFixed(1)})`} opacity={op}>
        <ellipse cx={-dir * rx * 1.7} cy={0} rx={rx * 1.4} ry={ry * 0.7} fill={color} opacity={0.22} />
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={color} />
        <ellipse cx={-rx * 0.2} cy={-ry * 0.25} rx={rx * 0.55} ry={ry * 0.45} fill={SON.echoHi} opacity={0.85} />
        {near && <ellipse cx={0} cy={0} rx={rx * 1.8} ry={ry * 2.4} fill={SON.gold} opacity={0.22} />}
      </g>,
    );
    if (boxes > 0 && Math.abs(x) < 120 && lane < 0.9) {
      const bw = rx * 2.5, bh = ry * 3.2;
      const pre = clamp01(1 - Math.abs(x) / 120);
      boxesOut.push(
        <rect key={`b${i}`} x={x - bw / 2 - dir * 8} y={y - bh / 2} width={bw} height={bh} rx={2} fill="none"
          stroke={SON.mint} strokeWidth={3} opacity={boxes * (0.45 + 0.55 * pre) * edge}
          strokeDasharray={boxDash ? '7 6' : undefined} />,
      );
    }
  }
  return <g>{items}{boxesOut}</g>;
};

// ---- CenterLine ----------------------------------------------------------------------------------------------------------------------------
export type LineMode = 'bare' | 'ruled' | 'needle' | 'dashed' | 'hook';
export const CenterLine: React.FC<{
  f: number; R?: number; mode?: LineMode;
  /** needle lean in degrees (positive leans right) */
  lean?: number;
  /** dashed from this fraction up the line, 0..1 (0 = whole line dashed) */
  dashFrom?: number;
  /** 0..1 how much of the line is drawn */
  draw?: number;
  glow?: number;
  /** pegs at the two ends */
  pegs?: boolean;
  hook?: number;
}> = ({f, R = 620, mode = 'bare', lean = 0, dashFrom = 1, draw = 1, glow = 0.5, pegs = false, hook = 0}) => {
  const L = R * 0.97 * draw;
  const pulse = 0.85 + 0.15 * Math.sin(f / 5);
  const ticks: React.ReactNode[] = [];
  if (mode === 'ruled') for (let i = 1; i <= 12; i++) ticks.push(<line key={i} x1={-(i % 4 === 0 ? 16 : 9)} x2={i % 4 === 0 ? 16 : 9} y1={-L * (i / 12.5)} y2={-L * (i / 12.5)} stroke={SON.gold} strokeWidth={3} opacity={0.9} />);
  const seg = dashFrom >= 1 ? null : L * dashFrom;
  return (
    <g>
      <line x1={0} y1={0} x2={Math.sin((lean * Math.PI) / 180) * L} y2={-Math.cos((lean * Math.PI) / 180) * L} stroke={SON.gold} strokeWidth={14} opacity={0.12 + glow * 0.25 * pulse} strokeLinecap="round" />
      {seg === null ? (
        <line x1={0} y1={0} x2={Math.sin((lean * Math.PI) / 180) * L} y2={-Math.cos((lean * Math.PI) / 180) * L} stroke={SON.gold} strokeWidth={5} strokeLinecap="round" />
      ) : (
        <>
          <line x1={0} y1={0} x2={0} y2={-seg} stroke={SON.gold} strokeWidth={5} strokeLinecap="round" />
          <line x1={0} y1={-seg} x2={0} y2={-L} stroke={SON.violet} strokeWidth={5} strokeDasharray="16 14" strokeDashoffset={-f * 0.6} strokeLinecap="round" />
        </>
      )}
      {ticks}
      {mode === 'needle' && (
        <g transform={`translate(0,${-L * 0.55}) rotate(${lean})`}>
          <path d="M -9,0 L 0,-70 L 9,0 Z" fill={SON.gold} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <circle cx={0} cy={0} r={9} fill={SON.brass} stroke={INK} strokeWidth={3} />
        </g>
      )}
      {pegs && [0, 1].map((i) => (
        <g key={i} transform={`translate(0,${i ? -L : 0})`}>
          <rect x={-10} y={-8} width={20} height={16} rx={4} fill={SON.brass} stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {mode === 'hook' && hook > 0 && (
        <path d={`M 0,${-L} q 0,${-70 * hook} 36,${-70 * hook} q 34,0 34,${36 * hook}`} fill="none" stroke={SON.violet} strokeWidth={5} strokeLinecap="round" strokeDasharray="12 10" strokeDashoffset={-f * 0.5} />
      )}
    </g>
  );
};

// ---- TallyWheels / Odometer ------------------------------------------------------------------------------------------------------------------
/** one rolling digit window. value is continuous so the digit rolls between integers */
const Digit: React.FC<{v: number; w: number; h: number; size: number; fg: string}> = ({v, w, h, size, fg}) => {
  const base = Math.floor(v);
  const frac = v - base;
  const d0 = ((base % 10) + 10) % 10;
  const d1 = (d0 + 1) % 10;
  const ease = frac < 0.7 ? 0 : (frac - 0.7) / 0.3;
  const dy = -ease * h;
  return (
    <g>
      <g transform={`translate(0,${dy})`}>
        <text x={w / 2} y={h * 0.5 + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} fill={fg}>{d0}</text>
        <text x={w / 2} y={h * 1.5 + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} fill={fg}>{d1}</text>
      </g>
    </g>
  );
};

/** a brass bezel with N rolling digits. value may be fractional so the last digit rolls. commas inserted every three digits. */
export const Odometer: React.FC<{
  x: number; y: number; value: number; digits?: number; size?: number; id?: string; commas?: boolean; label?: string; fg?: string; bg?: string; s?: number;
}> = ({x, y, value, digits = 3, size = 34, id = 'od', commas = true, label, fg = SON.echoHi, bg = SON.abyss, s = 1}) => {
  const dw = size * 0.78, dh = size * 1.45;
  const nComma = commas ? Math.floor((digits - 1) / 3) : 0;
  const w = digits * dw + nComma * size * 0.35 + 14;
  const h = dh + 14;
  const vals: number[] = [];
  const v = Math.max(0, value);
  for (let i = 0; i < digits; i++) {
    // digit i from the left, each place rolls only as its lower places wrap
    const place = Math.pow(10, digits - 1 - i);
    vals.push(place > 1 ? Math.floor(v / place) : v);
  }
  let cx = 7;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <defs>
        <clipPath id={`${id}_c`}><rect x={0} y={0} width={w} height={h} rx={6} /></clipPath>
        <FormGradient id={`${id}_g`} t={tones(SON.brass)} />
      </defs>
      <rect x={-6} y={-6} width={w + 12} height={h + 12} rx={10} fill={`url(#${id}_g)`} stroke={INK} strokeWidth={5} />
      <rect x={0} y={0} width={w} height={h} rx={6} fill={bg} stroke={INK} strokeWidth={3} />
      <g clipPath={`url(#${id}_c)`}>
        {vals.map((vv, i) => {
          const gx = cx;
          cx += dw + (commas && (digits - 1 - i) % 3 === 0 && i < digits - 1 ? size * 0.35 : 0);
          const needComma = commas && (digits - 1 - i) % 3 === 0 && i < digits - 1;
          return (
            <g key={i}>
              <g transform={`translate(${gx},7)`}><Digit v={vv} w={dw} h={dh} size={size} fg={fg} /></g>
              {needComma && <text x={gx + dw + size * 0.15} y={7 + dh * 0.5 + size * 0.5} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size * 0.8} fill={fg}>,</text>}
            </g>
          );
        })}
        <rect x={0} y={0} width={w} height={h * 0.38} fill="#fff" opacity={0.08} />
      </g>
      {label && <text x={w / 2} y={h + 34} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} letterSpacing={2} fill={SON.paper}>{label}</text>}
    </g>
  );
};

// ---- WEDGE, the hero -----------------------------------------------------------------------------------------------------------------------
export type WedgeMood = 'idle' | 'reading' | 'unsure' | 'proud' | 'squint' | 'wide';

export const Wedge: React.FC<{
  x: number; y: number; s?: number; f: number; id?: string;
  R?: number;
  mood?: WedgeMood;
  /** -1..1 where the eyes look */
  look?: number;
  /** 0..1 how bright the fan is */
  lit?: number;
  /** 0..1 how black the right third of the fan is */
  dark?: number;
  /** degrees where the dark sector starts, from vertical (right side) */
  darkFrom?: number;
  darkQ?: number;
  /** left-going and right-going tallies */
  tallyL?: number;
  tallyR?: number;
  blobs?: number;
  speed?: number;
  seed?: number;
  dirRight?: number;
  boxes?: number;
  boxDash?: boolean;
  line?: LineMode;
  lean?: number;
  dashFrom?: number;
  lineDraw?: number;
  hook?: number;
  rings?: boolean;
  /** extra children drawn inside the fan clip, local coords */
  inFan?: React.ReactNode;
  /** show the base with face and wheels */
  base?: boolean;
  /** dashed hypothetical: a fan drawn as an outline only */
  ghost?: number;
  /** a faceless bank instrument (the agency's sonar), never the model */
  faceless?: boolean;
  /** engraved text on the base front, e.g. THE MODEL or ADF&G SONAR */
  plaque?: string;
}> = ({x, y, s = 1, f, id = 'wd', R = 620, mood = 'idle', look = 0, lit = 1, dark = 0, darkFrom = 10, darkQ = 0, tallyL = 0, tallyR = 0, blobs = 80, speed = 1.6, seed = 0, dirRight = 0.78, boxes = 0, boxDash = false, line = 'bare', lean = 0, dashFrom = 1, lineDraw = 1, hook = 0, rings = true, inFan, base = true, ghost = 0, faceless = false, plaque}) => {
  const blink = (f % 150) > 144 ? 0.15 : 1;
  const breathe = 1 + 0.022 * Math.sin(f / 17);
  const eyeY = 74;
  const lookX = look * 18 + 8 * Math.sin(f / 21);
  const mouth = ({idle: 'M -22,128 L 22,128', reading: 'M -22,128 L 22,128', unsure: 'M -22,132 Q 0,120 22,132', proud: 'M -26,122 Q 0,146 26,122', squint: 'M -18,130 L 18,130', wide: 'M -16,122 Q 0,148 16,122 Z'} as Record<WedgeMood, string>)[mood];
  const lidH = mood === 'squint' ? 0.78 : mood === 'unsure' ? 0.3 : 0;
  const bright = clamp01(lit);
  const sweep = ((f * 1.4) % 220) / 220;
  const darkPath = fanPath(R + 4, darkFrom, FAN_A + 1);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <defs>
        <clipPath id={`${id}_fan`}><path d={fanPath(R)} /></clipPath>
        <radialGradient id={`${id}_rg`} cx="0" cy="0" r={R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1B8F86" stopOpacity={0.95} />
          <stop offset="0.45" stopColor={SON.fan} stopOpacity={0.95} />
          <stop offset="1" stopColor={SON.deep} stopOpacity={0.98} />
        </radialGradient>
        <FormGradient id={`${id}_sl`} t={tones(SON.slate)} />
      </defs>
      {ghost > 0 && (
        <path d={fanPath(R)} fill="none" stroke={SON.violet} strokeWidth={5} strokeDasharray="18 14" strokeDashoffset={-f * 0.5} opacity={ghost} />
      )}
      <g opacity={1 - ghost}>
        {/* the fan */}
        <path d={fanPath(R + 14)} fill={SON.ink} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <g clipPath={`url(#${id}_fan)`} opacity={0.35 + 0.65 * bright}>
          <path d={fanPath(R)} fill={`url(#${id}_rg)`} />
          {rings && [0.28, 0.48, 0.68, 0.88].map((k, i) => (
            <path key={i} d={`M ${-R * k * sinA},${-R * k * cosA} A ${R * k} ${R * k} 0 0 1 ${R * k * sinA},${-R * k * cosA}`} fill="none" stroke={SON.mint} strokeWidth={2.4} opacity={0.22} />
          ))}
          {/* the sweep */}
          <g opacity={0.5}>
            <path d={fanPath(R * (0.2 + 0.85 * sweep), -FAN_A, FAN_A)} fill={SON.mint} opacity={0.05} />
            <path d={`M ${-R * (0.2 + 0.85 * sweep) * sinA},${-R * (0.2 + 0.85 * sweep) * cosA} A ${R * (0.2 + 0.85 * sweep)} ${R * (0.2 + 0.85 * sweep)} 0 0 1 ${R * (0.2 + 0.85 * sweep) * sinA},${-R * (0.2 + 0.85 * sweep) * cosA}`} fill="none" stroke={SON.mint} strokeWidth={5} opacity={0.5} />
          </g>
          {blobs > 0 && <EchoBlobs f={f} R={R} n={blobs} speed={speed} seed={seed} dirRight={dirRight} boxes={boxes} boxDash={boxDash} darkX={dark > 0.5 ? Math.tan((darkFrom * Math.PI) / 180) * R * 0.3 : undefined} />}
          {inFan}
          <CenterLine f={f} R={R} mode={line} lean={lean} dashFrom={dashFrom} draw={lineDraw} hook={hook} />
          {dark > 0 && (
            <g opacity={dark}>
              <path d={darkPath} fill="#010708" />
              <path d={`M0,0 L ${R * Math.sin((darkFrom * Math.PI) / 180)},${-R * Math.cos((darkFrom * Math.PI) / 180)}`} stroke={SON.violet} strokeWidth={4} strokeDasharray="14 12" strokeDashoffset={-f * 0.6} />
              {darkQ > 0 && (
                <text x={R * 0.46} y={-R * 0.52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={190} fill={SON.violet} opacity={0.55 * darkQ}>?</text>
              )}
            </g>
          )}
        </g>
        <path d={fanPath(R)} fill="none" stroke={SON.mint} strokeWidth={4} opacity={0.5 * bright} strokeLinejoin="round" />
        {/* the base */}
        {base && (
          <g transform={`scale(${breathe})`}>
            <ContactShadow cx={0} cy={198} rx={230} ry={20} opacity={0.4} blur={10} />
            <path d="M -170,40 Q -176,10 -120,6 L 120,6 Q 176,10 170,40 L 150,176 Q 146,196 120,196 L -120,196 Q -146,196 -150,176 Z" fill={`url(#${id}_sl)`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
            <path d="M -150,16 Q 0,-4 150,16" fill="none" stroke={SON.mint} strokeWidth={4} opacity={0.35} />
            {!faceless && [-1, 1].map((sx) => (
              <g key={sx} transform={`translate(${sx * 62},${eyeY})`}>
                <ellipse cx={0} cy={0} rx={30} ry={34} fill="#F6F7EF" stroke={INK} strokeWidth={5} />
                <ellipse cx={lookX} cy={3} rx={13} ry={blink * 15} fill={INK} />
                <circle cx={lookX - 4} cy={-3} r={4.5} fill="#fff" />
                {lidH > 0 && <path d={`M -32,-36 L 32,-36 L 32,${-36 + 72 * lidH} Q 0,${-36 + 72 * lidH + 10} -32,${-36 + 72 * lidH} Z`} fill={SON.slateHi} stroke={INK} strokeWidth={4} />}
              </g>
            ))}
            {!faceless && <path d={mouth} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}
            {faceless && (
              <g>
                <rect x={-84} y={44} width={168} height={52} rx={8} fill="#0A1A18" stroke={SON.mint} strokeWidth={3} opacity={0.9} />
                <circle cx={-58} cy={70} r={7} fill={SON.mint} opacity={0.6 + 0.4 * Math.sin(f / 9)} />
                <rect x={-36} y={62} width={104} height={6} rx={3} fill={SON.mint} opacity={0.5} />
                <rect x={-36} y={74} width={70} height={6} rx={3} fill={SON.mint} opacity={0.3} />
              </g>
            )}
            {plaque && (
              <g>
                <rect x={-(plaque.length * 22 * 0.602 + 24) / 2} y={142} width={plaque.length * 22 * 0.602 + 24} height={36} rx={5} fill="#0A1A18" stroke={SON.paper} strokeWidth={2.5} />
                <text x={0} y={168} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} fill={SON.paper}>{plaque}</text>
              </g>
            )}
            {[-1, 1].map((sx) => (
              <g key={sx} transform={`translate(${sx * 132},150)`}>
                <ellipse cx={0} cy={44} rx={44} ry={9} fill="#000" opacity={0.3} />
              </g>
            ))}
            <Odometer x={-176} y={92} value={tallyL} digits={3} size={26} id={`${id}_l`} commas={false} s={0.9} fg={SON.mint} />
            <Odometer x={96} y={92} value={tallyR} digits={3} size={26} id={`${id}_r`} commas={false} s={0.9} fg={SON.echoHi} />
            <text x={-134} y={196} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={SON.paper} opacity={0.8}>L</text>
            <text x={134} y={196} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={SON.paper} opacity={0.8}>R</text>
          </g>
        )}
      </g>
    </g>
  );
};

// ---- SonarWater: the dark river backdrop ---------------------------------------------------------------------------------------------------
export const SonarWater: React.FC<{f: number; id?: string; bank?: number; mood?: 'night' | 'dusk' | 'fog'; seed?: number}> = ({f, id = 'sw', bank = 0, mood = 'night', seed = 0}) => {
  const top = mood === 'fog' ? '#A9B4B2' : mood === 'dusk' ? '#4A3A2E' : SON.abyss;
  const bot = mood === 'fog' ? '#1C2A28' : mood === 'dusk' ? '#14201F' : SON.ink;
  const drift = (i: number, sp: number) => ((f * sp + rnd(i + seed * 31) * 1400) % 1400) - 160;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}_g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.55" stopColor={mood === 'dusk' ? '#2E3A38' : mood === 'fog' ? '#5E706D' : SON.deep} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
      </defs>
      <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={`url(#${id}_g)`} />
      {/* slow caustic bands drift across the whole water so no frame holds still */}
      {[0, 1, 2].map((i) => (
        <rect key={`cb${i}`} data-band="ok" x={((f * (0.9 + 0.5 * i) + i * 420) % 1700) - 520} y={0} width={380} height={1920} fill={SON.mint} opacity={0.045} transform={`skewX(-18)`} />
      ))}
      {/* the surface: a rippling light band and two speeds of suspended motes fill the top of the frame */}
      <rect data-band="ok" x={-40} y={150} width={1160} height={130} fill={SON.mint} opacity={0.035 + 0.02 * Math.sin(f / 40)} />
      {Array.from({length: 6}).map((_, i) => (
        <path key={`r${i}`} data-band="ok" d={`M -40,${176 + i * 20} Q 200,${160 + i * 20 + 8 * Math.sin(f / 31 + i)} 540,${176 + i * 20} T 1120,${176 + i * 20 + 6 * Math.sin(f / 27 + i)}`} fill="none" stroke={SON.paper} strokeWidth={2} opacity={0.08} />
      ))}
      <path data-band="ok" d={`M -40,430 L 80,380 L 150,410 L 260,350 L 330,400 L 470,360 L 600,420 L 720,370 L 840,410 L 960,360 L 1120,420 L 1120,470 L -40,470 Z`} fill="#02100C" opacity={0.7} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} data-band="ok" d={`M -40,${300 + i * 330 + 18 * Math.sin(f / 60 + i)} Q 270,${260 + i * 330 + 26 * Math.sin(f / 47 + i)} 540,${300 + i * 330} T 1120,${290 + i * 330 + 20 * Math.sin(f / 52 + i * 2)}`} fill="none" stroke={SON.mint} strokeWidth={3} opacity={0.07} />
      ))}
      {Array.from({length: 34}).map((_, i) => (
        <circle key={i} cx={drift(i, 0.25 + 0.5 * rnd(i + 3))} cy={rnd(i + 9 + seed) * 1920} r={1.6 + 2.6 * rnd(i + 5)} fill={SON.mint} opacity={0.12 + 0.22 * rnd(i + 7)} />
      ))}
      {bank > 0 && (
        <g opacity={bank}>
          <path data-band="ok" d={`M -40,1540 L -40,1480 Q 120,1450 240,1500 T 520,1490 T 800,1470 T 1120,1500 L 1120,1960 L -40,1960 Z`} fill="#0A1A1F" stroke={INK} strokeWidth={6} />
          {Array.from({length: 12}).map((_, i) => <ellipse key={i} cx={40 + i * 92 + 20 * rnd(i)} cy={1560 + 80 * rnd(i + 2)} rx={30 + 24 * rnd(i + 4)} ry={14 + 8 * rnd(i + 6)} fill="#112A31" stroke={INK} strokeWidth={4} />)}
        </g>
      )}
    </g>
  );
};
