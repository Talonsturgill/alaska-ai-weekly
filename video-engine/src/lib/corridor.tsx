import React from 'react';
import {tones, ContactShadow, FormGradient} from './lighting';

// THE CORRIDOR FAMILY (net-new 2026-10-05, "Every Door").
//
// The shelf had rooms (PaperOfficeBG, newsroom walls) and gates (civics.tsx) but nothing that is a
// PLACE WHERE A RULE VARIES: a row of identical doors, each carrying its own sign. This is that.
//
// Shape language is the thesis (art_direction.json): DOORS, LOCKERS and the HandbookPlate are
// RECTILINEAR and hard-cornered; every sign GLYPH is ROUND and SOFT. One hard sentence over the
// hall, many soft little rules on the doors. ONE hot coral accent means only a glyph on a sign.
// Everything is ink-outlined and three-tone shaded, and everything that touches the floor casts.

export const COR = {
  wall: '#BFE3D0', wallHi: '#D8F0E2', wallLo: '#9CCBB6', locker: '#6F8FA8', lockerDk: '#4B6B85',
  oak: '#5B4B7A', oakDk: '#3E3257', ink: '#1B2133', lino: '#9AA79C', linoHi: '#B9C4BB',
  coral: '#FF5C4D', coralDk: '#C23B30', slip: '#F6E7A1', brass: '#A9B3B8', paper: '#F7F7F2', glass: '#CFE9F2',
  warm: '#FFE2C8',
};
const INK = COR.ink;
const MONO = "'JetBrains Mono', monospace";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const hash = (i: number) => Math.imul(i + 977, 2654435761) >>> 0;

/** Mono width of a string by arithmetic (0.602em advance), the rule for every plate. */
export const corW = (text: string, size: number, ls = 1.5) =>
  text.length * size * 0.602 + ls * Math.max(0, text.length - 1);

export type GlyphKind = 'none' | 'ban' | 'ok' | 'ask' | 'ai';

/**
 * A pictogram sign glyph: a ROUND head with two eyes and an antenna (the AI), optionally struck
 * through (ban), ticked (ok) or questioned (ask). Coral is the only accent, spent here and
 * nowhere else. Origin is the centre of the glyph, radius about 40 at scale 1. Wordless on purpose,
 * so a door sign makes no claim about a specific course.
 */
export const Glyph: React.FC<{kind: GlyphKind; s?: number; f?: number; pop?: number}> = ({kind, s = 1, f = 0, pop = 1}) => {
  const k = clamp01(pop);
  if (k <= 0.01) return null;
  const wob = Math.sin(f / 9) * 1.5;
  const mark = kind === 'ban' ? 'ban' : kind === 'ok' ? 'ok' : kind === 'ask' ? 'ask' : 'none';
  return (
    <g transform={`scale(${s * (0.7 + 0.3 * k)}) rotate(${wob})`} opacity={Math.min(1, k * 2)}>
      {/* the SAME coral round head on every sign: two eyes, a small smile, NO antenna (not a robot) */}
      <g>
        <circle cx={0} cy={0} r={40} fill={COR.coral} stroke={INK} strokeWidth={6} />
        <path d="M-30,-14 A36,36 0 0 1 8,-36" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.45} />
        <path d="M20,30 A36,36 0 0 0 36,-6" fill="none" stroke={COR.coralDk} strokeWidth={7} strokeLinecap="round" opacity={0.7} />
        <circle cx={-14} cy={-4} r={8} fill={COR.paper} stroke={INK} strokeWidth={3.5} />
        <circle cx={14} cy={-4} r={8} fill={COR.paper} stroke={INK} strokeWidth={3.5} />
        <circle cx={-12} cy={-3} r={3.4} fill={INK} />
        <circle cx={16} cy={-3} r={3.4} fill={INK} />
        <path d="M-12,16 Q0,24 12,16" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      </g>
      {mark === 'ban' && (
        <g>
          <circle cx={0} cy={0} r={54} fill="none" stroke={INK} strokeWidth={17} />
          <circle cx={0} cy={0} r={54} fill="none" stroke={COR.paper} strokeWidth={8} />
          <line x1={-38} y1={-38} x2={38} y2={38} stroke={INK} strokeWidth={17} strokeLinecap="round" />
          <line x1={-38} y1={-38} x2={38} y2={38} stroke={COR.paper} strokeWidth={8} strokeLinecap="round" />
        </g>
      )}
      {mark === 'ok' && (
        <g transform="translate(24,26)">
          <circle cx={0} cy={0} r={24} fill={COR.paper} stroke={INK} strokeWidth={6} />
          <path d="M-12,0 L-3,10 L13,-10" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {mark === 'ask' && (
        <g transform="translate(26,-30)">
          <circle cx={0} cy={0} r={22} fill={COR.paper} stroke={INK} strokeWidth={6} />
          <text x={0} y={11} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={32} fill={INK}>?</text>
        </g>
      )}
    </g>
  );
};

export type DoorState = 'shut' | 'ajar' | 'open' | 'dark' | 'glow';

/**
 * ClassroomDoor, the film's repeated object. Origin is the CENTRE OF ITS BASE on the floor (y = 0);
 * it is 190 wide and 420 tall at scale 1, the sign sits at eye height beside the knob, the lamp
 * over the frame lights when `lamp` > 0.
 *
 *   glyph   the pictogram in the sign slot (wordless)
 *   flip    0..1 the sign slaps on: 0 empty slot, 1 settled (drive with a spring and a thunk)
 *   state   shut / ajar (a crack of light) / open (swung wide) / dark (unlit, frosted) / glow (warm light behind)
 *   swing   0..1 how far the slab has swung (overrides ajar/open when set)
 *   lamp    0..1 the little lamp over the frame
 *   eyes    0..1 the transom becomes a pair of eyes (the door has a face when it reacts)
 *   slip    0..1 a citation slip stuck on the frame (butter), never a person
 */
export const ClassroomDoor: React.FC<{
  x: number; y: number; scale?: number; f: number; glyph?: GlyphKind; flip?: number; state?: DoorState;
  swing?: number; lamp?: number; eyes?: number; slip?: number; shadow?: boolean; phase?: number; sign?: boolean;
  inside?: React.ReactNode;
}> = ({x, y, scale = 1, f, glyph = 'none', flip = 1, state = 'shut', swing, lamp = 0, eyes = 0, slip = 0, shadow = true, phase = 0, sign = true, inside}) => {
  const oak = tones(COR.oak);
  const id = `cd${Math.round(x)}_${Math.round(y)}_${Math.round(phase * 10)}`;
  const sw = swing ?? (state === 'open' ? 1 : state === 'ajar' ? 0.12 : 0);
  const dark = state === 'dark';
  const glow = state === 'glow';
  const slabW = 190 * (1 - 0.82 * sw);
  const slabX = -95;
  const breathe = Math.sin(f / 31 + phase) * 1.2;
  const blink = (f + phase * 40) % 150 < 5 ? 0.15 : 1;
  const behind = glow || sw > 0.05;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {shadow && <ContactShadow cx={0} cy={4} rx={118} ry={16} opacity={0.34} blur={9} />}
      <defs>
        <FormGradient id={`${id}o`} t={oak} softness={0.9} />
        <clipPath id={`${id}c`}><rect x={-95} y={-420} width={190} height={420} /></clipPath>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={COR.warm} /><stop offset="1" stopColor="#FFB9A0" />
        </linearGradient>
      </defs>
      {/* frame */}
      <rect x={-108} y={-438} width={216} height={438} fill={oak.shade} stroke={INK} strokeWidth={7} />
      {/* what is behind the door */}
      <rect x={-95} y={-420} width={190} height={420} fill={behind ? `url(#${id}g)` : dark ? '#202A3A' : '#2B3446'} />
      {inside && sw > 0.05 && (
        <g clipPath={`url(#${id}c)`} opacity={clamp01(sw * 1.6)}>{inside}</g>
      )}
      {/* transom */}
      <rect x={-95} y={-420} width={190} height={58} fill={dark ? '#26324A' : COR.glass} stroke={INK} strokeWidth={5} />
      {!dark && <path d="M-95,-362 L-40,-420 L-8,-420 L-63,-362 Z" fill="#FFFFFF" opacity={0.35} />}
      {eyes > 0.05 && (
        <g opacity={eyes}>
          {[-34, 34].map((ex) => (
            <g key={ex}>
              <ellipse cx={ex} cy={-392} rx={20} ry={18 * blink} fill={COR.paper} stroke={INK} strokeWidth={4} />
              <circle cx={ex + 3} cy={-391} r={7 * blink} fill={INK} />
            </g>
          ))}
          <path d="M-60,-418 Q-34,-430 -8,-416" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <path d="M8,-416 Q34,-430 60,-418" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
      {/* the slab, hinged on the left, foreshortening as it swings */}
      <g transform={`translate(${slabX},0)`}>
        <rect x={0} y={-362} width={slabW} height={362} fill={`url(#${id}o)`} stroke={INK} strokeWidth={7} />
        {sw < 0.7 && (
          <g opacity={1 - sw * 1.3}>
            <rect x={slabW * 0.14} y={-336} width={slabW * 0.72} height={120} fill="none" stroke={oak.shade} strokeWidth={6} />
            <rect x={slabW * 0.14} y={-190} width={slabW * 0.72} height={150} fill="none" stroke={oak.shade} strokeWidth={6} />
            <rect x={slabW * 0.14 + 2} y={-334} width={slabW * 0.72 - 4} height={3} fill={oak.key} opacity={0.6} />
            {/* knob */}
            <circle cx={slabW * 0.86} cy={-176 + breathe * 0.3} r={12} fill={COR.brass} stroke={INK} strokeWidth={4} />
            <circle cx={slabW * 0.86 - 3} cy={-179} r={4} fill="#FFF3C4" opacity={0.8} />
          </g>
        )}
        {dark && <rect x={0} y={-362} width={slabW} height={362} fill="#101728" opacity={0.55} />}
      </g>
      {/* the lamp over the frame */}
      <g transform="translate(0,-455)">
        <rect x={-22} y={-10} width={44} height={20} rx={6} fill={COR.paper} stroke={INK} strokeWidth={4} />
        <circle cx={0} cy={0} r={8} fill={lamp > 0.05 ? '#FFFFFF' : '#8892A4'} stroke={INK} strokeWidth={2.5} opacity={lamp > 0.05 ? 1 : 0.7} />
        {lamp > 0.05 && <circle cx={0} cy={0} r={22 + 4 * Math.sin(f / 5)} fill="#F4FFF8" opacity={0.35 * lamp} />}
      </g>
      {/* the sign: a rounded square at eye height beside the door, glyph settled by `flip` */}
      {sign && (
        <g transform="translate(150,-250)">
          <rect x={-46} y={-60} width={92} height={120} rx={14} fill={COR.paper} stroke={INK} strokeWidth={6} />
          <rect x={-36} y={-50} width={72} height={100} rx={9} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.5} />
          <g transform={`translate(0,${(1 - clamp01(flip)) * -26})`}>
            <Glyph kind={glyph} s={0.78} f={f + phase * 20} pop={flip} />
          </g>
          {/* a tape strip so the sign is parented to the wall, never floating */}
          <rect x={-18} y={-68} width={36} height={14} fill="#FFFFFF" opacity={0.75} stroke={INK} strokeWidth={2} />
        </g>
      )}
      {/* the citation slip stuck to the frame */}
      {slip > 0.05 && (
        <g transform={`translate(-128,${-300 + (1 - clamp01(slip)) * -50}) rotate(${-8 + Math.sin(f / 11 + phase) * 2})`} opacity={clamp01(slip * 2)}>
          <rect x={-30} y={-38} width={60} height={76} fill={COR.slip} stroke={INK} strokeWidth={4} />
          <rect x={-20} y={-24} width={40} height={6} fill={INK} opacity={0.5} />
          <rect x={-20} y={-12} width={30} height={6} fill={INK} opacity={0.5} />
          <circle cx={14} cy={20} r={9} fill={COR.coral} stroke={INK} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

/**
 * HandbookPlate: ONE long hard bar carrying the handbook sentence, with a visibly empty DASHED
 * box where AI would be. The throughline object. Width is sized to its string by arithmetic.
 * Origin is the CENTRE of the plate. `fill` 0..1 turns the dashed box from empty to ringed.
 *
 *   lines   the sentence rows (caps, no AI in them)
 *   tab     the small label tab above (UAA STUDENT HANDBOOK)
 *   dashed  0..1 how visible the empty box is
 *   lock    0..1 the plate becomes a lock body (a key slot opens at its right end)
 *   collar  0..1 how many citation slips ring it (0..1 of `collarN`)
 */
export const HandbookPlate: React.FC<{
  x: number; y: number; f: number; lines: string[]; tab?: string; size?: number; dashed?: number; lock?: number;
  p?: number; shadow?: boolean; collar?: number; collarN?: number; drop?: number;
}> = ({x, y, f, lines, tab, size = 34, dashed = 1, lock = 0, p = 1, shadow = true, collar = 0, collarN = 12, drop = 1}) => {
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const w = Math.max(...lines.map((l) => corW(l, size))) + 70;
  const h = lines.length * (size + 14) + 120;
  const brass = tones(COR.brass);
  const id = `hp${Math.round(x)}_${Math.round(y)}`;
  const settle = 1 - clamp01(drop);
  const sway = Math.sin(f / 17) * 0.8;
  return (
    <g transform={`translate(${x},${y - settle * 220}) rotate(${sway})`} opacity={Math.min(1, k * 2)}>
      <defs><FormGradient id={id} t={brass} softness={0.8} /></defs>
      {shadow && <rect x={-w / 2 + 12} y={-h / 2 + 16} width={w} height={h} fill="#000" opacity={0.24} />}
      {/* two hanging rods so the plate is parented to the ceiling, not floating */}
      {[-w / 2 + 50, w / 2 - 50].map((rx) => <line key={rx} x1={rx} y1={-h / 2} x2={rx} y2={-h / 2 - 160} stroke={INK} strokeWidth={6} />)}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={`url(#${id})`} stroke={INK} strokeWidth={9} />
      <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h - 28} fill={COR.paper} stroke={INK} strokeWidth={3} />
      {/* rivets */}
      {[[-w / 2 + 28, -h / 2 + 28], [w / 2 - 28, -h / 2 + 28], [-w / 2 + 28, h / 2 - 28], [w / 2 - 28, h / 2 - 28]].map(([rx, ry], i) => (
        <circle key={i} cx={rx} cy={ry} r={6} fill={brass.shade} stroke={INK} strokeWidth={2.5} />
      ))}
      {tab && (
        <g transform={`translate(${-w / 2 + 34},${-h / 2 - 4})`}>
          <rect x={0} y={-30} width={corW(tab, 20) + 36} height={34} fill={COR.slip} stroke={INK} strokeWidth={4} />
          <text x={18} y={-6} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={INK}>{tab}</text>
        </g>
      )}
      {lines.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 62 + i * (size + 14)} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={INK}>{l}</text>
      ))}
      {/* THE EMPTY DASHED BOX where AI would be: no text in it, ever */}
      <g transform={`translate(0,${h / 2 - 46})`} opacity={dashed}>
        <rect x={-62} y={-24} width={124} height={48} rx={8} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="14 9"
          strokeDashoffset={-(f * 0.7) % 46} />
      </g>
      {lock > 0.01 && (
        <g transform={`translate(${w / 2 - 6},0)`} opacity={lock}>
          <rect x={0} y={-34} width={64} height={68} rx={10} fill={brass.base} stroke={INK} strokeWidth={6} />
          <circle cx={26} cy={-6} r={9} fill={INK} />
          <rect x={22} y={0} width={8} height={20} fill={INK} />
        </g>
      )}
      {collar > 0.02 && Array.from({length: Math.round(collarN * collar)}, (_, i) => {
        const a = (i / collarN) * Math.PI * 2;
        const cx = Math.cos(a) * (w / 2 + 38), cy = Math.sin(a) * (h / 2 + 34);
        return (
          <g key={i} transform={`translate(${cx},${cy}) rotate(${(a * 180) / Math.PI + 90 + Math.sin(f / 9 + i) * 4})`}>
            <rect x={-18} y={-24} width={36} height={48} fill={COR.slip} stroke={INK} strokeWidth={3.5} />
            <circle cx={5} cy={12} r={6} fill={COR.coral} stroke={INK} strokeWidth={2.5} />
          </g>
        );
      })}
    </g>
  );
};

/**
 * HallWall: the side-on corridor backdrop. A seafoam wall, a dusty-blue locker band, cool tube
 * troughs on the ceiling, and a teal linoleum floor with reflections. `cam` is the camera x in
 * world px; the wall and lockers move at 0.55 of it (parallax), the floor strip at 1.0, so a
 * lateral dolly reads as real depth. `floorY` is where the doors stand. One tube flickers.
 */
export const HallWall: React.FC<{f: number; cam?: number; floorY?: number; tubes?: boolean; window?: boolean; id?: string; flicker?: number}> =
({f, cam = 0, floorY = 1330, tubes = true, window: win = false, id = 'hw', flicker = 0}) => {
  const par = cam * 0.55;
  const wallT = tones(COR.wall);
  const lk = tones(COR.locker);
  const off = ((par % 240) + 240) % 240;
  const lkOff = ((par % 120) + 120) % 120;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={COR.wallHi} /><stop offset="0.55" stopColor={COR.wall} /><stop offset="1" stopColor={COR.wallLo} />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={COR.linoHi} /><stop offset="0.25" stopColor={COR.lino} /><stop offset="1" stopColor="#6C7B70" />
        </linearGradient>
        <FormGradient id={`${id}l`} t={lk} softness={0.9} />
      </defs>
      <rect x={-20} y={0} width={1120} height={floorY} fill={`url(#${id}w)`} />
      {/* ceiling band and tubes */}
      <rect x={-20} y={0} width={1120} height={150} fill={wallT.shade} stroke={INK} strokeWidth={6} />
      {tubes && Array.from({length: 6}, (_, i) => {
        const tx = -300 + i * 360 - ((par * 1.0) % 360) + (i % 2) * 0;
        const flick = flicker > 0 && i === 2 ? 0.55 + 0.45 * Math.abs(Math.sin(f / 2.3)) : 1;
        return (
          <g key={i} opacity={flick}>
            <rect x={tx} y={44} width={250} height={34} rx={8} fill="#F4FFF8" stroke={INK} strokeWidth={5} />
            <rect x={tx - 20} y={78} width={290} height={90} fill="#F4FFF8" opacity={0.10} />
          </g>
        );
      })}
      {/* clerestory windows, a cool wash at the far end */}
      {win && [0, 1, 2].map((i) => {
        const wx = 60 + i * 340 - (par % 340);
        // an Alaskan window: a snow-capped range, spruce, and snow falling through the glass
        return (
          <g key={i}>
            <clipPath id={`${id}wc${i}`}><rect x={wx} y={190} width={240} height={160} /></clipPath>
            <rect x={wx} y={190} width={240} height={160} fill="#CFE3EE" />
            <g clipPath={`url(#${id}wc${i})`}>
              <path d={`M${wx},300 L${wx + 50},238 L${wx + 90},270 L${wx + 150},214 L${wx + 205},262 L${wx + 240},240 L${wx + 240},350 L${wx},350 Z`} fill="#8EA6BA" />
              <path d={`M${wx + 150},214 L${wx + 128},242 L${wx + 150},236 L${wx + 168},244 Z`} fill="#F4FAFD" />
              <path d={`M${wx + 50},238 L${wx + 34},258 L${wx + 50},254 L${wx + 64},262 Z`} fill="#F4FAFD" />
              {[28, 98, 176, 214].map((sx, k) => (
                <path key={k} d={`M${wx + sx},${352} L${wx + sx - 20},${352} L${wx + sx - 8},${318 - (k % 2) * 8} L${wx + sx - 16},${318 - (k % 2) * 8} L${wx + sx - 4},${290 - (k % 2) * 8} L${wx + sx + 8},${318 - (k % 2) * 8} L${wx + sx},${318 - (k % 2) * 8} L${wx + sx + 12},${352} Z`} fill="#2F5B54" />
              ))}
              {Array.from({length: 10}, (_, k) => {
                const hh = hash(k * 5 + i);
                return <circle key={k} cx={wx + (hh % 240) + Math.sin(f / 18 + k) * 6} cy={190 + ((hh >>> 7) % 160 + f * (0.8 + (k % 3) * 0.3)) % 160} r={2.4} fill="#FFFFFF" opacity={0.9} />;
              })}
            </g>
            <rect x={wx} y={190} width={240} height={160} fill="none" stroke={INK} strokeWidth={6} />
            <line x1={wx + 120} y1={190} x2={wx + 120} y2={350} stroke={INK} strokeWidth={4} />
          </g>
        );
      })}
      {/* bulletin-board strip on the back wall, far parallax */}
      {Array.from({length: 5}, (_, i) => {
        const bx = -200 + i * 480 - (par * 0.6 % 480);
        return (
          <g key={`bb${i}`}>
            <rect x={bx} y={420} width={200} height={130} fill="#C8A878" stroke={INK} strokeWidth={5} />
            {[0, 1, 2].map((j) => <rect key={j} x={bx + 16 + j * 58} y={438 + (j % 2) * 14} width={44} height={56} fill={[COR.paper, COR.slip, '#D9E7F5'][j]} stroke={INK} strokeWidth={2.5} />)}
          </g>
        );
      })}
      {/* locker band behind the door row */}
      <rect x={-20} y={floorY - 520} width={1120} height={520} fill="none" />
      {Array.from({length: 12}, (_, i) => {
        const lx = -120 + i * 120 - lkOff;
        return (
          <g key={`lk${i}`}>
            <rect x={lx} y={floorY - 260} width={116} height={260} fill={`url(#${id}l)`} stroke={INK} strokeWidth={5} />
            {[0, 1, 2].map((s) => <rect key={s} x={lx + 22} y={floorY - 236 + s * 12} width={72} height={5} fill={lk.shade} opacity={0.8} />)}
            <circle cx={lx + 90} cy={floorY - 130} r={5} fill={COR.paper} stroke={INK} strokeWidth={2.5} />
          </g>
        );
      })}
      <rect x={-20} y={floorY - 262} width={1120} height={12} fill={lk.key} stroke={INK} strokeWidth={4} opacity={0.9} />
      {/* wall guard rail and the wall's own seam markers moving at the wall's speed */}
      {Array.from({length: 5}, (_, i) => <rect key={`pil${i}`} x={-40 + i * 240 - off} y={150} width={18} height={floorY - 150 - 262} fill={wallT.shade} opacity={0.55} />)}
      {/* floor */}
      <rect x={-20} y={floorY} width={1120} height={H_FLOOR - floorY} fill={`url(#${id}f)`} />
      <line x1={-20} y1={floorY} x2={1100} y2={floorY} stroke={INK} strokeWidth={7} />
      {Array.from({length: 7}, (_, i) => {
        const yy = floorY + 16 + i * i * 9;
        return <line key={`fl${i}`} x1={-20} y1={yy} x2={1100} y2={yy} stroke="#6C7B70" strokeWidth={3} opacity={0.6} />;
      })}
      {Array.from({length: 10}, (_, i) => {
        const fx = -80 + i * 150 - ((cam * 1.0) % 150);
        return <line key={`fv${i}`} x1={fx} y1={floorY} x2={fx - 90 - i * 4} y2={H_FLOOR} stroke="#6C7B70" strokeWidth={3} opacity={0.5} />;
      })}
      {/* tube reflections sliding on the linoleum */}
      {tubes && Array.from({length: 4}, (_, i) => {
        const rx = -200 + i * 420 - ((cam * 1.0) % 420);
        return <ellipse key={`rf${i}`} cx={rx + 125} cy={floorY + 110 + (i % 2) * 40} rx={170} ry={14} fill="#F4FFF8" opacity={0.16} />;
      })}
    </g>
  );
};
const H_FLOOR = 1920;
