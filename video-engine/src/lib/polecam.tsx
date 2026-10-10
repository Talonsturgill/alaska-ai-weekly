import React from 'react';
import {tones, ContactShadow, INK} from './lighting';

/**
 * POLECAM — the "who keeps the plate" family (NET-NEW 2026-10-10, "Who Keeps The Plate").
 * ======================================================================================
 * The story: a vendor's plate-reading camera goes up on a store's pole in Anchorage, someone saws
 * it down, and the October 20th vote is about the CITY's cameras, not the store's. The shelf had
 * sensor heroes (SeismicStation, SatelliteEye, StudyLens) but no pole-mounted street camera, no
 * receipt tape and no lot to stand it in. Every piece is local-coordinate SVG, ink-outlined,
 * form-shaded, casting a contact shadow. Origin is the floor centre of the object unless noted.
 *
 * COLOUR LICENCE (art_direction.json): AMBER means ONLY the store. LILAC means ONLY the vendor.
 * CIVIC BLUE means ONLY the city. CYAN means ONLY the machine reading. Nothing else uses them.
 */

export const PC = {
  sky: '#14232F',
  skyLow: '#1F3A47',
  asphalt: '#2A2F36',
  asphaltLight: '#3C434D',
  snow: '#D5DDE0',
  snowShade: '#8E9EA6',
  sodium: '#FFB43A',
  sodiumHot: '#FFD98A',
  cyan: '#4DE3D6',
  cyanDeep: '#1F9C94',
  lilac: '#F070B8',
  lilacDeep: '#A63A78',
  civic: '#4C7FD1',
  civicDeep: '#2A4F94',
  bone: '#E8E4D8',
  graphite: '#3A4048',
  steel: '#7C8792',
  paper: '#D8CCAE',
  kraft: '#9C8A66',
  oxblood: '#B3262E',
  solar: '#3B4048',
  lampWhite: '#F3E7C8',
  ink: INK,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const hash = (i: number) => {
  let x = (Math.floor(i) + 7001) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967295;
};
export const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);

/* ================================================================== */
/* THE HERO                                                           */
/* ================================================================== */
export type CamMood = 'proud' | 'calm' | 'worried' | 'shock' | 'smug' | 'sheepish' | 'dazed' | 'wry' | 'off';

/**
 * PoleCam — a steel pole with a bracket and a bone-white camera head that has ONE big lens eye,
 * brows, cheek LEDs and a solar panel for a hat. Origin = the pole's base on the ground.
 *  - `h` pole height. `mood` drives lid, brows and pupil. `look`/`lookY` -1..1 aim the pupil.
 *  - `cut` 0..1 is the sawing progress (a notch deepens), `fall` 0..1 is the topple after the cut
 *    (the head and the upper pole swing about the cut and slide to the snow).
 *  - `ribbon` draws a hanging NEW! tag. `glow` 0..1 lights the lens ring cyan (the machine is reading).
 *  - `sweat` 0..1 draws a drop. `lean` tilts the head (deg), a gesture the scene can drive.
 */
export const PoleCam: React.FC<{
  f: number; x: number; y: number; scale?: number; h?: number; mood?: CamMood; look?: number; lookY?: number;
  cut?: number; fall?: number; cutAt?: number; ribbon?: boolean; glow?: number; sweat?: number; lean?: number;
  phase?: number; flip?: boolean; shadow?: boolean; label?: string;
}> = ({f, x, y, scale = 1, h = 420, mood = 'calm', look = 0, lookY = 0, cut = 0, fall = 0, cutAt = 170,
  ribbon = false, glow = 0, sweat = 0, lean = 0, phase = 0, flip = false, shadow = true, label}) => {
  const uid = `pcam${Math.round(x)}${Math.round(y)}${Math.round(phase * 10)}`;
  const T = tones(PC.bone);
  const TS = tones(PC.steel);
  const blinkT = (f + phase * 41) % 131;
  const blink = blinkT < 5 ? Math.sin((blinkT / 5) * Math.PI) : 0;
  const lidBase = {proud: 0.1, calm: 0.22, worried: 0.05, shock: 0, smug: 0.5, sheepish: 0.3, dazed: 0.35, wry: 0.42, off: 1}[mood];
  const lid = Math.max(lidBase, blink);
  const browTilt = {proud: -6, calm: 0, worried: -18, shock: -12, smug: 10, sheepish: -14, dazed: 0, wry: 8, off: 6}[mood];
  const browLift = {proud: -8, calm: 0, worried: -6, shock: -16, smug: 2, sheepish: -4, dazed: 0, wry: -3, off: 4}[mood];
  const idle = 1.2 * Math.sin(f / 24 + phase);
  const px = look * 9, py = lookY * 7;
  const pupilR = mood === 'shock' ? 5 : mood === 'dazed' ? 9 : 11;
  const cutY = h - cutAt; // height of the cut above the ground (pole top at h)
  const fallAng = 92 * Math.pow(fall, 2);
  const fallX = 70 * fall;
  const fallY = (cutY - 58) * Math.pow(fall, 1.7);
  const headY = -h;
  const upper = (
    <g>
      {/* upper pole */}
      <rect x={-12} y={-h} width={24} height={cutAt} fill={`url(#${uid}-pole)`} stroke={INK} strokeWidth={5} />
      <rect x={-6} y={-h + 6} width={5} height={cutAt - 12} fill="#fff" opacity={0.2} />
      {/* bracket */}
      <rect x={-14} y={-h + 14} width={40} height={14} fill={`url(#${uid}-pole)`} stroke={INK} strokeWidth={4} />
      {/* ribbon */}
      {ribbon && (
        <g transform={`translate(-32,${-h + 70}) rotate(${6 * Math.sin(f / 9)})`}>
          <path d="M 0 -50 L 0 0" stroke={INK} strokeWidth={3} />
          <rect x={-46} y={0} width={92} height={40} rx={4} fill={PC.paper} stroke={INK} strokeWidth={4} />
          <text x={0} y={29} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={26} letterSpacing={2} fill={PC.oxblood}>NEW!</text>
        </g>
      )}
      {/* head */}
      <g transform={`translate(30,${-h - 52 + idle}) rotate(${lean})`}>
        {/* solar panel hat */}
        <g transform="translate(0,-74)">
          <path d="M -86 12 L -64 -22 L 64 -22 L 86 12 Z" fill={PC.solar} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          {[-1, 0, 1].map((i) => <path key={i} d={`M ${i * 30 - 12} 12 L ${i * 26 - 8} -22`} stroke="#9AA6B2" strokeWidth={2} opacity={0.6} />)}
          <path d="M -80 0 L 80 0" stroke="#9AA6B2" strokeWidth={2} opacity={0.5} />
          <path d="M -64 -22 L 64 -22" stroke="#fff" strokeWidth={2.4} opacity={0.35} />
        </g>
        <rect x={-88} y={-62} width={176} height={124} rx={26} fill={`url(#${uid}-body)`} stroke={INK} strokeWidth={5.5} />
        <path d="M -76 -52 Q 0 -66 76 -52" fill="none" stroke="#fff" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
        <rect x={-76} y={46} width={152} height={8} rx={4} fill={T.shade} opacity={0.5} />
        {/* cheek leds */}
        {[-1, 1].map((s) => <circle key={s} cx={s * 64} cy={34} r={5.5} fill={s === 1 && (f + phase * 17) % 48 < 6 ? PC.cyan : '#5B6169'} stroke={INK} strokeWidth={2.6} />)}
        {/* the eye */}
        <g transform="translate(0,4)">
          {glow > 0.02 && <circle cx={0} cy={0} r={62 + 14 * glow} fill={PC.cyan} opacity={0.18 * glow} />}
          <circle cx={0} cy={0} r={48} fill={PC.graphite} stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={0} r={40} fill="#0B1A1E" stroke={INK} strokeWidth={3} />
          <circle cx={0} cy={0} r={34} fill="#F4F1E6" stroke={INK} strokeWidth={3} />
          <circle cx={px} cy={py} r={22 + 3 * glow} fill={glow > 0.02 ? PC.cyan : '#6FB6C9'} stroke={INK} strokeWidth={3.4} />
          {mood === 'dazed' ? (
            <path d={`M ${px} ${py} m -9 0 a 9 9 0 1 1 9 9 a 5 5 0 1 1 -5 -5`} fill="none" stroke={INK} strokeWidth={3.4} transform={`rotate(${f * 12} ${px} ${py})`} />
          ) : (
            <circle cx={px} cy={py} r={pupilR} fill={INK} />
          )}
          <circle cx={px - 5} cy={py - 6} r={4} fill="#fff" />
          {/* the lid */}
          <path d={`M -34 -34 L 34 -34 L 34 ${-34 + 68 * lid} Q 0 ${-34 + 68 * lid + 7} -34 ${-34 + 68 * lid} Z`} fill={PC.graphite} stroke={INK} strokeWidth={4} clipPath={`url(#${uid}-clip)`} />
        </g>
        {/* brows */}
        {[-1, 1].map((s) => (
          <path key={s} d={`M ${s * 52 - 24} ${-52 + browLift} L ${s * 52 + 24} ${-52 + browLift + s * browTilt * 0.5}`}
            stroke={INK} strokeWidth={7} strokeLinecap="round" />
        ))}
        {sweat > 0.02 && (
          <g transform={`translate(${82},${-26 + 40 * sweat})`} opacity={Math.min(1, sweat * 2)}>
            <path d="M 0 -15 Q 10 0 0 10 Q -10 0 0 -15 Z" fill="#9CD0EE" stroke={INK} strokeWidth={3} />
          </g>
        )}
        {label && <text x={0} y={92} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={20} fill={PC.paper}>{label}</text>}
      </g>
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`}>
      <defs>
        <linearGradient id={`${uid}-pole`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={TS.key} /><stop offset="0.4" stopColor={TS.base} /><stop offset="1" stopColor={TS.shade} />
        </linearGradient>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={T.key} /><stop offset="0.5" stopColor={T.base} /><stop offset="1" stopColor={T.shade} />
        </linearGradient>
        <clipPath id={`${uid}-clip`}><circle cx={0} cy={0} r={34} /></clipPath>
      </defs>
      {shadow && <ContactShadow cx={0} cy={4} rx={70 + 90 * fall} ry={10} opacity={0.5} />}
      {/* base plate and the lower pole */}
      <path d="M -34 0 L -22 -22 L 22 -22 L 34 0 Z" fill={`url(#${uid}-pole)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {[-18, 18].map((bx) => <circle key={bx} cx={bx} cy={-8} r={3.4} fill={INK} />)}
      <rect x={-12} y={-cutY} width={24} height={cutY - 18} fill={`url(#${uid}-pole)`} stroke={INK} strokeWidth={5} />
      <rect x={-6} y={-cutY + 6} width={5} height={cutY - 30} fill="#fff" opacity={0.2} />
      {/* the notch of the saw */}
      {cut > 0.02 && (
        <g>
          <path d={`M -14 ${-cutY} L ${-14 + 26 * cut} ${-cutY - 5} L ${-14 + 26 * cut} ${-cutY + 5} Z`} fill="#0B1A1E" />
          <path d={`M -14 ${-cutY - 14} Q ${-24 - 10 * cut} ${-cutY - 6} -14 ${-cutY + 14}`} fill="none" stroke={PC.sodiumHot} strokeWidth={0} />
        </g>
      )}
      {/* the upper half swings about the cut, drops and slides */}
      <g transform={`translate(${fallX},${fallY}) rotate(${fallAng},0,${-cutY})`}>{upper}</g>
    </g>
  );
};

/* ================================================================== */
/* THE TAPE — the throughline object                                  */
/* ================================================================== */
export type TapeStamp = {at: number; text: string; color: string; fg?: string};

/**
 * Tape — the camera's receipt strip, the memory the film is about. Drawn along +x from the origin,
 * `len` px long, `printed` 0..1 how much has come out of the camera. Day ticks every `tickEvery` px
 * (one tick is one day), perforated end, optional stamps (`at` 0..1 along the printed length). `tint`
 * is the rulebook colour that owns it: amber (store), lilac (vendor), civic (city) or paper.
 */
export const Tape: React.FC<{
  f: number; x: number; y: number; len?: number; w?: number; printed?: number; rot?: number; tint?: string;
  tickEvery?: number; ticks?: boolean; stamps?: TapeStamp[]; wave?: number; trucks?: number; phase?: number; fadeEnd?: number;
}> = ({f, x, y, len = 400, w = 46, printed = 1, rot = 0, tint = PC.paper, tickEvery = 0, ticks = false, stamps = [], wave = 0, trucks = 0, phase = 0, fadeEnd = 0}) => {
  const L = len * clamp01(printed);
  if (L < 2) return null;
  const seg = 24;
  const n = Math.max(2, Math.ceil(L / seg));
  const wy = (px: number) => wave * Math.sin(px / 52 + f / 14 + phase) * clamp01(px / 120);
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= n; i++) {
    const px = Math.min(L, i * seg);
    top.push(`${px},${wy(px) - w / 2}`);
    bot.unshift(`${px},${wy(px) + w / 2}`);
  }
  const d = `M ${top.join(' L ')} L ${bot.join(' L ')} Z`;
  const gid = `tp${Math.round(x)}${Math.round(y)}${Math.round(phase * 7)}`;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" /><stop offset="0.5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        {fadeEnd > 0 && <linearGradient id={`${gid}-f`} x1="0" y1="0" x2="1" y2="0"><stop offset={1 - fadeEnd} stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.55" /></linearGradient>}
      </defs>
      <path d={d} transform="translate(5,8)" fill="#000" opacity={0.28} />
      <path d={d} fill={tint} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={d} fill={`url(#${gid})`} />
      {/* perforated end */}
      {Array.from({length: 4}, (_, i) => <circle key={i} cx={L - 8} cy={wy(L) - w / 2 + 8 + i * ((w - 16) / 3)} r={2.6} fill={INK} opacity={0.7} />)}
      {ticks && tickEvery > 0 && Array.from({length: Math.floor(L / tickEvery)}, (_, i) => {
        const tx = (i + 1) * tickEvery;
        return <path key={i} d={`M ${tx} ${wy(tx) - w / 2 + 6} L ${tx} ${wy(tx) - w / 2 + 6 + (i % 7 === 6 ? 18 : 11)}`} stroke={INK} strokeWidth={2.4} opacity={0.8} />;
      })}
      {trucks > 0 && Array.from({length: trucks}, (_, i) => {
        const tx = 40 + i * 70;
        if (tx > L - 20) return null;
        return (
          <g key={i} transform={`translate(${tx},${wy(tx)})`} opacity={0.85}>
            <path d="M -16 8 L -16 -2 L -8 -2 L -4 -9 L 6 -9 L 10 -2 L 16 -2 L 16 8 Z" fill={INK} />
            <circle cx={-8} cy={9} r={3.6} fill={INK} /><circle cx={9} cy={9} r={3.6} fill={INK} />
          </g>
        );
      })}
      {stamps.map((s, i) => {
        const sx = s.at * L;
        if (sx > L - 20) return null;
        const tw = monoW(s.text, 18) + 22;
        return (
          <g key={i} transform={`translate(${sx},${wy(sx) + 2}) rotate(-4)`}>
            <rect x={-tw / 2} y={-17} width={tw} height={34} rx={3} fill={s.color} stroke={INK} strokeWidth={3} />
            <text x={0} y={6} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={18} letterSpacing={1.5} fill={s.fg ?? INK}>{s.text}</text>
          </g>
        );
      })}
      {fadeEnd > 0 && <path d={d} fill={`url(#${gid}-f)`} />}
    </g>
  );
};

/* ================================================================== */
/* VEHICLES                                                           */
/* ================================================================== */
/** Pickup — a side-view pickup facing +x. Origin = ground under the middle. Wheels turn with `roll`. */
export const Pickup: React.FC<{
  f: number; x: number; y: number; scale?: number; body?: string; roll?: number; flip?: boolean; lamps?: boolean; plate?: boolean; plateGlow?: number;
}> = ({f, x, y, scale = 1, body = '#5E7A5A', roll = 0, flip = false, lamps = true, plate = true, plateGlow = 0}) => {
  const T = tones(body);
  const uid = `pk${Math.round(x)}${Math.round(y)}${Math.round(roll)}`;
  const wheel = (cx: number) => (
    <g transform={`translate(${cx},-34)`}>
      <circle r={34} fill="#14181D" stroke={INK} strokeWidth={5} />
      <circle r={17} fill="#9AA3AD" stroke={INK} strokeWidth={3.4} />
      <g transform={`rotate(${roll})`}>{[0, 72, 144, 216, 288].map((a) => <path key={a} d="M 0 0 L 0 -14" stroke={INK} strokeWidth={3} transform={`rotate(${a})`} />)}</g>
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`}>
      <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={T.key} /><stop offset="0.5" stopColor={T.base} /><stop offset="1" stopColor={T.shade} /></linearGradient></defs>
      <ContactShadow cx={0} cy={2} rx={170} ry={14} opacity={0.5} />
      {/* bed and body */}
      <path d="M -170 -50 L -170 -112 L -64 -112 L -64 -70 L 40 -70 L 74 -122 L 126 -122 L 150 -92 L 176 -86 L 176 -50 Q 176 -36 160 -36 L -154 -36 Q -170 -36 -170 -50 Z"
        fill={`url(#${uid})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      {/* cab window */}
      <path d="M 54 -112 L 78 -112 L 112 -112 L 128 -92 L 54 -92 Z" fill="#14343A" stroke={INK} strokeWidth={4} />
      <path d="M 66 -108 L 78 -108 L 70 -96 L 60 -96 Z" fill="#fff" opacity={0.25} />
      <path d="M -164 -104 L -70 -104" stroke={INK} strokeWidth={3} opacity={0.5} />
      {wheel(-98)}{wheel(110)}
      {lamps && <path d="M 176 -76 L 340 -112 L 340 -40 Z" fill={PC.sodiumHot} opacity={0.18} />}
      {lamps && <rect x={166} y={-84} width={14} height={14} rx={3} fill={PC.sodiumHot} stroke={INK} strokeWidth={3} />}
      {plate && (
        <g transform="translate(-168,-62)">
          <rect x={-8} y={-12} width={16} height={26} fill="#F4F1E6" stroke={plateGlow > 0.05 ? PC.cyan : INK} strokeWidth={plateGlow > 0.05 ? 4 : 3} />
          <path d="M -4 -6 L 4 -6 M -4 0 L 4 0 M -4 6 L 4 6" stroke={INK} strokeWidth={2} />
        </g>
      )}
    </g>
  );
};

/** PatrolCar — a side-view sedan with a light bar and a roof reader pod. Origin = ground under the middle. */
export const PatrolCar: React.FC<{f: number; x: number; y: number; scale?: number; flip?: boolean; roll?: number; pod?: number}> = ({f, x, y, scale = 1, flip = false, roll = 0, pod = 0}) => {
  const uid = `pc${Math.round(x)}${Math.round(y)}`;
  const T = tones('#E9ECEF');
  const wheel = (cx: number) => (
    <g transform={`translate(${cx},-30)`}>
      <circle r={30} fill="#14181D" stroke={INK} strokeWidth={5} />
      <circle r={14} fill="#9AA3AD" stroke={INK} strokeWidth={3} />
      <g transform={`rotate(${roll})`}>{[0, 90, 180, 270].map((a) => <path key={a} d="M 0 0 L 0 -12" stroke={INK} strokeWidth={3} transform={`rotate(${a})`} />)}</g>
    </g>
  );
  const blink = Math.floor(f / 6) % 2 === 0;
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`}>
      <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={T.key} /><stop offset="0.6" stopColor={T.base} /><stop offset="1" stopColor={T.shade} /></linearGradient></defs>
      <ContactShadow cx={0} cy={2} rx={150} ry={12} opacity={0.5} />
      <path d="M -150 -44 L -146 -70 L -98 -76 L -66 -118 L 56 -118 L 94 -76 L 146 -68 L 152 -44 Q 152 -30 138 -30 L -138 -30 Q -150 -30 -150 -44 Z" fill={`url(#${uid})`} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <path d="M -150 -44 L 152 -44 L 152 -30 L -150 -30 Z" fill="#14181D" opacity={0.85} />
      <path d="M -60 -112 L -44 -112 L -44 -80 L -86 -80 Z M -34 -112 L 50 -112 L 82 -80 L -34 -80 Z" fill="#14343A" stroke={INK} strokeWidth={3.6} />
      <path d="M -10 -62 L 40 -62 L 40 -50 L -10 -50 Z" fill={PC.civic} stroke={INK} strokeWidth={3} opacity={0.9} />
      {/* light bar */}
      <rect x={-34} y={-130} width={68} height={14} rx={3} fill="#2A2F36" stroke={INK} strokeWidth={3.6} />
      <rect x={-30} y={-127} width={28} height={8} fill={blink ? '#F4F1E6' : '#8C93A0'} />
      <rect x={2} y={-127} width={28} height={8} fill={blink ? '#27406E' : PC.civic} />
      {/* roof reader pod, lens eyes lit when `pod` rises */}
      <g transform="translate(-62,-122)">
        <rect x={-18} y={-18} width={36} height={22} rx={4} fill="#2A2F36" stroke={INK} strokeWidth={3.4} />
        <circle cx={-6} cy={-7} r={6} fill={pod > 0.05 ? PC.cyan : '#7C8792'} stroke={INK} strokeWidth={2.4} />
        <circle cx={8} cy={-7} r={6} fill={pod > 0.05 ? PC.cyan : '#7C8792'} stroke={INK} strokeWidth={2.4} />
      </g>
      {wheel(-92)}{wheel(92)}
    </g>
  );
};

/** Drone — a small quad with four spinning rotors. Origin = the body centre. */
export const Drone: React.FC<{f: number; x: number; y: number; scale?: number; tilt?: number}> = ({f, x, y, scale = 1, tilt = 0}) => (
  <g transform={`translate(${x},${y + 6 * Math.sin(f / 9)}) scale(${scale}) rotate(${tilt})`}>
    <ContactShadow cx={0} cy={90} rx={50} ry={7} opacity={0.2} />
    {[-1, 1].map((s) => (
      <g key={s}>
        <path d={`M 0 0 L ${s * 62} -12`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M 0 0 L ${s * 62} -12`} stroke="#5E6772" strokeWidth={4.5} strokeLinecap="round" />
        <ellipse cx={s * 62} cy={-20} rx={34} ry={5} fill="#fff" opacity={0.55} transform={`rotate(${(f * 55) % 360} ${s * 62} -20)`} />
        <ellipse cx={s * 62} cy={-20} rx={34} ry={5} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.6} />
      </g>
    ))}
    <rect x={-26} y={-14} width={52} height={28} rx={9} fill="#E8E4D8" stroke={INK} strokeWidth={5} />
    <circle cx={0} cy={10} r={9} fill={PC.graphite} stroke={INK} strokeWidth={3.4} />
    <circle cx={0} cy={10} r={4} fill={PC.cyan} />
  </g>
);

/* ================================================================== */
/* THE FEED WALL — 750 as a physical count                            */
/* ================================================================== */
/**
 * FeedWall — 750 tiny camera eyes in a 50 x 15 grid, lit one after another as `count` rises 0..750.
 * Origin = the wall's top-left. `cell` is the pitch. Lit eyes blink at their own phase.
 */
export const FeedWall: React.FC<{f: number; x: number; y: number; pulse?: number; cell?: number; tint?: string; beam?: number}> = ({f, x, y, pulse = 0, cell = 18, tint = PC.civic, beam = 0}) => {
  const cols = 50, rows = 15;
  const W = cols * cell, H = rows * cell;
  const k = clamp01(pulse);
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-14} y={-14} width={W + 28} height={H + 28} rx={12} fill="#0B1219" stroke={INK} strokeWidth={6} />
      <rect x={-6} y={-6} width={W + 12} height={H + 12} rx={8} fill="#13222B" />
      {/* every one of the 750 sockets is drawn in the SAME state: a capacity, never a live count */}
      {Array.from({length: cols * rows}, (_, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        return (
          <g key={i} transform={`translate(${c * cell + cell / 2},${r * cell + cell / 2})`}>
            <circle r={cell * 0.38} fill={k > 0.02 ? '#2E4A5C' : '#1C2F39'} stroke={tint} strokeWidth={1.8} opacity={0.75 + 0.25 * k} />
            <circle r={cell * 0.14} fill={k > 0.02 ? '#E8E4D8' : '#0B1219'} opacity={0.4 + 0.6 * k} />
          </g>
        );
      })}
      {beam > 0.02 && <path d={`M ${W * 0.1} ${H + 14} L ${W * (0.1 + 0.7 * beam)} ${H * 0.4}`} stroke={PC.cyan} strokeWidth={5} opacity={0.65} strokeDasharray="12 10" strokeDashoffset={-f * 3} />}
    </g>
  );
};

/* ================================================================== */
/* THE RULEBOOKS                                                      */
/* ================================================================== */
/** Rulebook — a ring binder standing on its spine edge, with a coloured cover, label plate and ribbon. Origin = bottom centre. */
export const Rulebook: React.FC<{
  f: number; x: number; y: number; scale?: number; color: string; deep: string; title: string; sub?: string; rot?: number; open?: number; w?: number; h?: number;
}> = ({f, x, y, scale = 1, color, deep, title, sub, rot = 0, w = 170, h = 220}) => {
  const uid = `rb${Math.round(x)}${Math.round(y)}`;
  const T = tones(color);
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
      <defs><linearGradient id={uid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={T.key} /><stop offset="0.5" stopColor={color} /><stop offset="1" stopColor={deep} /></linearGradient></defs>
      <ContactShadow cx={0} cy={2} rx={w * 0.62} ry={9} opacity={0.4} />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={8} fill={`url(#${uid})`} stroke={INK} strokeWidth={5.5} />
      <rect x={-w / 2} y={-h} width={22} height={h} rx={6} fill={deep} stroke={INK} strokeWidth={4} />
      {[0.2, 0.5, 0.8].map((k) => <circle key={k} cx={-w / 2 + 11} cy={-h * k} r={5} fill="#C9D0D6" stroke={INK} strokeWidth={2.6} />)}
      <rect x={-w / 2 + 34} y={-h + 28} width={w - 100} height={56} rx={4} fill={PC.paper} stroke={INK} strokeWidth={3.4} />
      <text x={-w / 2 + 34 + (w - 100) / 2} y={-h + 64} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={Math.min(26, (w - 116) / (title.length * 0.602 + 0.1))} letterSpacing={1} fill={INK}>{title}</text>
      {sub && <text x={-w / 2 + 34 + (w - 100) / 2} y={-h + 118} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={Math.min(18, (w - 70) / (sub.length * 0.602 + 0.1))} fill={PC.paper}>{sub}</text>}
      <path d={`M ${w / 2 - 28} ${-h} L ${w / 2 - 28} ${-h + 56} L ${w / 2 - 38} ${-h + 46} L ${w / 2 - 48} ${-h + 56} L ${w / 2 - 48} ${-h} Z`} fill={PC.paper} stroke={INK} strokeWidth={3} />
    </g>
  );
};

/* ================================================================== */
/* THE LOT                                                            */
/* ================================================================== */
/**
 * LotNight — the film's home set: a teal night over a snowy Anchorage big-box lot. Sky and stars,
 * a Chugach ridge, a long low store with a sign band and lit doors, sodium lamp poles with light
 * pools on the asphalt, painted parking lines, snow banks and a near plane of carts. `ground` is
 * the y of the asphalt line. Draws full-bleed (0..1080 x 0..1920). `lamp` 0..1 lights the sodium pools.
 */
export const LotNight: React.FC<{f: number; ground?: number; shift?: number; lamp?: number; store?: string | null; cartX?: number; cart?: boolean}> = ({f, ground = 1180, shift: shift0 = 0, lamp = 1, store = 'THE STORE', cartX = -200, cart = true}) => {
  const shift = shift0 + 22 * Math.sin(f / 140);
  const stars = Array.from({length: 40}, (_, i) => ({x: hash(i + 11) * 1080, y: hash(i + 71) * (ground - 520), r: 1 + (i % 3) * 0.7, p: i}));
  const ridge = (seed: number, base: number, amp: number, col: string, par: number) => {
    let d = `M -60 ${ground - 80} L -60 ${base}`;
    for (let i = 0; i <= 14; i++) d += ` L ${-60 + i * 90 - shift * par} ${base - amp * (0.4 + 0.6 * hash(i + seed))}`;
    d += ` L 1200 ${ground - 80} Z`;
    return <path d={d} fill={col} stroke={INK} strokeWidth={4} />;
  };
  const lampAt = (lx: number, h: number, s: number) => (
    <g transform={`translate(${lx - shift * s},${ground + 6})`}>
      <ellipse cx={0} cy={50} rx={230 * s} ry={34 * s} fill={PC.sodium} opacity={0.2 * lamp} />
      <rect x={-6 * s} y={-h * s} width={12 * s} height={h * s} fill="#4A525C" stroke={INK} strokeWidth={4} />
      <rect x={-6 * s} y={-h * s} width={5 * s} height={h * s} fill="#fff" opacity={0.15} />
      <path d={`M ${-6 * s} ${-h * s} q 0 ${-24 * s} ${34 * s} ${-26 * s}`} fill="none" stroke={INK} strokeWidth={5} />
      <rect x={20 * s} y={(-h - 36) * s} width={36 * s} height={12 * s} rx={3} fill={PC.sodiumHot} stroke={INK} strokeWidth={3} />
      <circle cx={38 * s} cy={(-h - 24) * s} r={40 * s * lamp} fill={PC.sodium} opacity={0.2 * lamp} />
      <path d={`M ${22 * s} ${(-h - 24) * s} L ${-80 * s} 40 L ${150 * s} 40 L ${56 * s} ${(-h - 24) * s} Z`} fill={PC.sodium} opacity={0.07 * lamp} />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id="ln-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={PC.sky} /><stop offset="0.8" stopColor={PC.skyLow} /><stop offset="1" stopColor="#2B4B5C" /></linearGradient>
        <linearGradient id="ln-au" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6C8F7A" stopOpacity="0.22" /><stop offset="1" stopColor="#6C8F7A" stopOpacity="0" /></linearGradient>
        <linearGradient id="ln-asph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={PC.asphaltLight} /><stop offset="1" stopColor={PC.asphalt} /></linearGradient>
      </defs>
      <rect data-band="ok" x={-20} y={-20} width={1120} height={ground + 40} fill="url(#ln-sky)" />
      {stars.map((s) => <circle key={s.p} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.3 + 0.35 * Math.sin(f / 21 + s.p)} />)}
      <g opacity={0.9}><circle cx={850} cy={330} r={62} fill={PC.lampWhite} opacity={0.16} /><circle cx={850} cy={330} r={38} fill={PC.lampWhite} opacity={0.75} /><circle cx={838} cy={320} r={9} fill="#D8CCAE" opacity={0.6} /><circle cx={864} cy={344} r={6} fill="#D8CCAE" opacity={0.5} /></g>
      <path d={`M -40 360 ${Array.from({length: 9}, (_, i) => `Q ${i * 140 + 70} ${290 + 70 * Math.sin(f / 80 + i * 0.9)} ${(i + 1) * 140} ${360 + 40 * Math.sin(f / 95 + i * 0.7)}`).join(' ')} L 1180 740 L -40 740 Z`} fill="url(#ln-au)" opacity={0.8 + 0.2 * Math.sin(f / 55)} />
      {ridge(1, ground - 250, 110, '#17363C', 0.2)}
      {ridge(5, ground - 170, 70, '#112A30', 0.45)}
      {/* the store */}
      {store !== null && <g transform={`translate(${-shift * 0.7},0)`}>
        <rect x={40} y={ground - 190} width={760} height={190} fill="#38434F" stroke={INK} strokeWidth={5} />
        <rect x={40} y={ground - 190} width={760} height={34} fill="#2C353F" stroke={INK} strokeWidth={5} />
        <rect x={60} y={ground - 150} width={720} height={44} rx={4} fill="#222A32" stroke={INK} strokeWidth={4} data-band="ok" />
        <text x={250} y={ground - 117} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={32} letterSpacing={6} fill={PC.sodiumHot} opacity={0.9}>{store}</text>
        {[110, 300, 490, 680].map((dx) => <rect key={dx} x={dx} y={ground - 90} width={100} height={90} fill={PC.sodium} opacity={0.5 + 0.1 * Math.sin(f / 30 + dx)} stroke={INK} strokeWidth={4} />)}
        <rect x={800} y={ground - 150} width={90} height={150} fill="#2A323B" stroke={INK} strokeWidth={5} />
      </g>}
      <rect data-band="ok" x={-20} y={ground} width={1120} height={1960 - ground} fill="url(#ln-asph)" />
      <path d={`M -20 ${ground + 2} L 1100 ${ground + 2}`} stroke="#fff" strokeWidth={3} opacity={0.18} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <path key={i} d={`M ${60 + i * 130 - shift * 1.1} ${ground + 40} L ${20 + i * 130 - shift * 1.1} ${ground + 260}`} stroke="#EDE6D2" strokeWidth={6} opacity={0.35} />)}
      <path d={`M -20 ${ground + 300} L 1100 ${ground + 300}`} stroke="#EDE6D2" strokeWidth={5} opacity={0.18} />
      {lampAt(180, 330, 0.8)}
      {lampAt(980, 360, 0.9)}
      {/* snow banks and the near plane */}
      <g data-band="ok">
        <path d={`M -40 1980 L -40 1640 Q 220 ${1580 + 10 * Math.sin(f / 90)} 520 1650 Q 820 1720 1120 1620 L 1120 1980 Z`} fill="#8FA9B3" stroke={INK} strokeWidth={5} />
        <path d="M -40 1700 Q 260 1650 560 1710 T 1120 1690" fill="none" stroke="#fff" strokeWidth={4} opacity={0.45} />
        {Array.from({length: 7}, (_, i) => <ellipse key={i} cx={120 + i * 150 + 20 * Math.sin(i)} cy={1800 + (i % 3) * 36} rx={38} ry={9} fill="#6C879A" opacity={0.7} />)}
      </g>
      {cart && <ShoppingCart f={f} x={(cartX + f * 0.9) % 1500 - 200} y={1560} scale={0.9} />}
    </g>
  );
};

/** A shopping cart, a background gag that rolls the whole film. Origin = ground under the middle. */
export const ShoppingCart: React.FC<{f: number; x: number; y: number; scale?: number}> = ({f, x, y, scale = 1}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`} data-band="ok">
    <ContactShadow cx={0} cy={4} rx={70} ry={8} opacity={0.4} />
    <path d="M -64 -92 L -40 -92 L -28 -44 L 56 -44 L 70 -92 L 86 -92" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M -64 -92 L -40 -92 L -28 -44 L 56 -44 L 70 -92 L 86 -92" fill="none" stroke="#C9D0D6" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M -34 -70 L 62 -70 M -30 -54 L 56 -54" stroke={INK} strokeWidth={3} />
    {[-6, 14, 34].map((cx) => <path key={cx} d={`M ${cx} -44 L ${cx + 6} -92`} stroke={INK} strokeWidth={3} />)}
    {[-24, 52].map((cx) => <circle key={cx} cx={cx} cy={-18} r={13} fill="#14181D" stroke={INK} strokeWidth={3.4} />)}
    <path d="M -28 -44 L -24 -30 M 56 -44 L 52 -30" stroke={INK} strokeWidth={4} />
  </g>
);

/* ================================================================== */
/* SMALL PROPS                                                        */
/* ================================================================== */
/** SawBlade — a handsaw blade with a grip, no hand. Origin = the grip. It strokes along +x by `stroke`. */
export const SawBlade: React.FC<{x: number; y: number; scale?: number; stroke?: number; rot?: number}> = ({x, y, scale = 1, stroke = 0, rot = 0}) => (
  <g transform={`translate(${x + stroke},${y}) rotate(${rot}) scale(${scale})`}>
    <path d="M 0 -18 L 280 -10 L 280 22 L 0 22 Z" fill="#B8C2CC" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M 4 -14 L 276 -8" stroke="#fff" strokeWidth={3} opacity={0.6} />
    <path d={`M 280 22 ${Array.from({length: 18}, (_, i) => `L ${268 - i * 15} ${34} L ${260 - i * 15} 22`).join(' ')}`} fill="#B8C2CC" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path d="M -90 -34 Q -108 -10 -92 30 L 0 24 L 0 -22 Z" fill="#7A4A2B" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <ellipse cx={-52} cy={-4} rx={14} ry={9} fill="#14181D" opacity={0.85} />
  </g>
);

/** HandSign — a cardboard sign on a stake with scribbled lines (never legible words) and two arrows. Origin = the stake's foot. */
export const HandSign: React.FC<{x: number; y: number; scale?: number; rot?: number; p?: number}> = ({x, y, scale = 1, rot = 0, p = 1}) => {
  const k = clamp01(p);
  if (k < 0.02) return null;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale * (0.7 + 0.3 * k)})`} opacity={Math.min(1, k * 2)}>
      <ContactShadow cx={0} cy={2} rx={40} ry={6} opacity={0.4} />
      <rect x={-5} y={-170} width={10} height={170} fill="#7A5A3A" stroke={INK} strokeWidth={4} />
      <rect x={-92} y={-300} width={184} height={140} fill={PC.kraft} stroke={INK} strokeWidth={5} />
      {[-258, -234, -210].map((yy, i) => <path key={i} d={`M -72 ${yy} q 20 -14 40 0 t 40 0 t 40 0 t ${28 - i * 6} 0`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />)}
      <path d="M -70 -184 L -30 -184 M -44 -196 L -30 -184 L -44 -172" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d="M 70 -184 L 30 -184 M 44 -196 L 30 -184 L 44 -172" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** ScanBeam — a cyan cone from a lens to a target, the machine reading. Origin = the lens. */
export const ScanBeam: React.FC<{f: number; x: number; y: number; tx: number; ty: number; spread?: number; p?: number}> = ({f, x, y, tx, ty, spread = 60, p = 1}) => {
  const k = clamp01(p);
  if (k < 0.02) return null;
  const ex = x + (tx - x) * k, ey = y + (ty - y) * k;
  const ang = Math.atan2(ey - y, ex - x);
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  const sp = spread * (0.9 + 0.1 * Math.sin(f / 5));
  return (
    <g>
      <path d={`M ${x} ${y} L ${ex + nx * sp} ${ey + ny * sp} L ${ex - nx * sp} ${ey - ny * sp} Z`} fill={PC.cyan} opacity={0.2} />
      <path d={`M ${x} ${y} L ${ex} ${ey}`} stroke={PC.cyan} strokeWidth={3} opacity={0.7} strokeDasharray="14 10" strokeDashoffset={-f * 3} />
    </g>
  );
};

/** NoCameraSign — a round no-sign over a camera glyph on a stick, held by a neighbour. Origin = the stick foot. */
export const NoCameraSign: React.FC<{x: number; y: number; scale?: number; rot?: number}> = ({x, y, scale = 1, rot = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
    <rect x={-5} y={-130} width={10} height={130} fill="#7A5A3A" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={-190} r={72} fill={PC.paper} stroke={INK} strokeWidth={6} />
    <rect x={-32} y={-210} width={64} height={40} rx={8} fill={PC.graphite} stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={-190} r={13} fill="#F4F1E6" stroke={INK} strokeWidth={3} />
    <circle cx={0} cy={-190} r={6} fill={INK} />
    <circle cx={0} cy={-190} r={72} fill="none" stroke={INK} strokeWidth={11} />
    <path d="M -50 -240 L 50 -140" stroke={INK} strokeWidth={11} strokeLinecap="round" />
  </g>
);

/* ================================================================== */
/* CIVIC AND DESK PROPS                                               */
/* ================================================================== */
/** Ladder — an A-frame stepladder. Origin = ground under the middle. */
export const Ladder: React.FC<{x: number; y: number; scale?: number; lean?: number}> = ({x, y, scale = 1, lean = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${lean}) scale(${scale})`}>
    <ContactShadow cx={0} cy={2} rx={90} ry={8} opacity={0.4} />
    {[-1, 1].map((s) => <path key={s} d={`M ${s * 20} -300 L ${s * 70} 0`} stroke={INK} strokeWidth={13} strokeLinecap="round" />)}
    {[-1, 1].map((s) => <path key={s} d={`M ${s * 20} -300 L ${s * 70} 0`} stroke="#C79A3A" strokeWidth={7} strokeLinecap="round" />)}
    {[-240, -170, -100, -36].map((yy) => <path key={yy} d={`M ${-20 - (yy + 300) * 0.1666} ${yy} L ${20 + (yy + 300) * 0.1666} ${yy}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />)}
    <path d="M -22 -304 L 22 -304" stroke={INK} strokeWidth={12} strokeLinecap="round" />
  </g>
);

/** Calendar — a wall calendar page that can flip (flip 0..1 rotates the old page away) and take a stamp. */
export const Calendar: React.FC<{f: number; x: number; y: number; scale?: number; flip?: number; month?: string; day?: string; stamp?: string; stampP?: number}> = ({f, x, y, scale = 1, flip = 1, month = 'OCT', day = '20', stamp, stampP = 0}) => {
  const k = clamp01(flip);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-100} y={-120} width={200} height={240} rx={8} fill={PC.paper} stroke={INK} strokeWidth={6} />
      <rect x={-100} y={-120} width={200} height={54} rx={8} fill={PC.civic} stroke={INK} strokeWidth={6} />
      <text x={0} y={-82} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={34} letterSpacing={4} fill="#F4F1E6">{month}</text>
      <text x={0} y={46} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight={900} fontSize={118} fill={INK}>{day}</text>
      {[-70, 70].map((rx) => <circle key={rx} cx={rx} cy={-120} r={7} fill="#C9D0D6" stroke={INK} strokeWidth={3} />)}
      {k < 1 && (
        <g transform={`translate(0,-66) scale(1,${1 - k})`} style={{transformBox: 'fill-box'}}>
          <rect x={-100} y={0} width={200} height={186} fill={PC.paper} stroke={INK} strokeWidth={5} opacity={1 - k} />
          <text x={0} y={120} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight={900} fontSize={118} fill={INK} opacity={1 - k}>19</text>
        </g>
      )}
      {stamp && stampP > 0.02 && (
        <g transform={`translate(0,92) rotate(-8) scale(${0.7 + 0.3 * clamp01(stampP)})`} opacity={clamp01(stampP * 2)}>
          <rect x={-84} y={-20} width={168} height={40} fill="none" stroke={PC.civic} strokeWidth={5} />
          <text x={0} y={7} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={17} letterSpacing={1} fill={PC.civic}>{stamp}</text>
        </g>
      )}
    </g>
  );
};

/** Podium — a lectern with a front panel. Origin = ground under the middle. */
export const Podium: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={4} rx={110} ry={10} opacity={0.5} />
    <path d="M -90 0 L -76 -250 L 76 -250 L 90 0 Z" fill="#5B4632" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -86 -250 L 86 -250 L 100 -276 L -100 -276 Z" fill="#7A5E40" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-50} y={-210} width={100} height={110} rx={4} fill="none" stroke={INK} strokeWidth={4} opacity={0.6} />
    <path d="M -80 -240 L -72 -40" stroke="#fff" strokeWidth={3} opacity={0.12} />
  </g>
);

/** Folder — a kraft folder with a label. `squeeze` 0..1 narrows it under a clamp. Origin = bottom centre. */
export const Folder: React.FC<{x: number; y: number; scale?: number; label: string; squeeze?: number; rot?: number}> = ({x, y, scale = 1, label, squeeze = 0, rot = 0}) => {
  const w = 190 * (1 - 0.22 * clamp01(squeeze));
  const words = label.split(' ');
  const lines = label.length > 12 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [label];
  const size = Math.min(22, (w - 30) / (Math.max(...lines.map((l) => l.length)) * 0.602));
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
      <path d={`M ${-w / 2} 0 L ${-w / 2} -240 L ${-w / 2 + 70} -240 L ${-w / 2 + 84} -256 L ${w / 2} -256 L ${w / 2} 0 Z`} fill={PC.kraft} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <rect x={-w / 2 + 10} y={-190} width={w - 20} height={lines.length * (size + 8) + 14} rx={3} fill={PC.paper} stroke={INK} strokeWidth={3} />
      {lines.map((l, i) => <text key={i} x={0} y={-190 + 10 + size + i * (size + 8)} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={size} letterSpacing={0.5} fill={INK}>{l}</text>)}
    </g>
  );
};

/** Clamp — a screw clamp that closes (close 0..1) on something between its pads. Origin = the pads' centre. */
export const Clamp: React.FC<{x: number; y: number; scale?: number; close: number; gapOpen?: number; gapClosed?: number}> = ({x, y, scale = 1, close, gapOpen = 170, gapClosed = 116}) => {
  const gap = gapOpen + (gapClosed - gapOpen) * clamp01(close);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path d={`M ${-gap / 2 - 24} -64 Q ${-gap / 2 - 24} -96 ${-gap / 2 + 20} -96 L ${gap / 2 + 20} -96`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d={`M ${-gap / 2 - 24} -64 Q ${-gap / 2 - 24} -96 ${-gap / 2 + 20} -96 L ${gap / 2 + 20} -96`} fill="none" stroke="#8C97A3" strokeWidth={8} strokeLinecap="round" />
      <rect x={-gap / 2 - 26} y={-64} width={26} height={128} rx={4} fill="#B8C2CC" stroke={INK} strokeWidth={5} />
      <rect x={gap / 2} y={-64} width={26} height={128} rx={4} fill="#B8C2CC" stroke={INK} strokeWidth={5} />
      <path d={`M ${gap / 2 + 26} 0 L ${gap / 2 + 96} 0`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M ${gap / 2 + 26} 0 L ${gap / 2 + 96} 0`} stroke="#8C97A3" strokeWidth={7} strokeLinecap="round" />
      <path d={`M ${gap / 2 + 100} -34 L ${gap / 2 + 100} 34`} stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d={`M ${gap / 2 + 100} -34 L ${gap / 2 + 100} 34`} stroke="#B8C2CC" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

/** Shredder — a desk shredder with a slot; paper confetti falls when `run` > 0. Origin = ground under the middle. */
export const Shredder: React.FC<{f: number; x: number; y: number; scale?: number; run?: number}> = ({f, x, y, scale = 1, run = 0}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={4} rx={90} ry={9} opacity={0.5} />
    <path d="M -80 0 L -74 -140 L 74 -140 L 80 0 Z" fill="#4E5862" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
    <rect x={-84} y={-170} width={168} height={34} rx={6} fill="#6B7783" stroke={INK} strokeWidth={5} />
    <rect x={-60} y={-160} width={120} height={8} rx={3} fill="#0B1219" />
    <circle cx={60} cy={-100} r={7} fill={run > 0.05 ? PC.cyan : '#7C8792'} stroke={INK} strokeWidth={3} />
    {run > 0.05 && Array.from({length: 14}, (_, i) => {
      const ph = (f * 1.4 + i * 9) % 60;
      return <rect key={i} x={-50 + (i * 17) % 100 + 6 * Math.sin(f / 5 + i)} y={-4 + ph * 1.2} width={8} height={4} fill={PC.paper} stroke={INK} strokeWidth={1.4} opacity={1 - ph / 70} />;
    })}
  </g>
);

/** Storefront — a lit shopfront facing us with a sign band; `sign` is the band text, sized by arithmetic. Origin = ground under the middle. */
export const Storefront: React.FC<{f: number; x: number; y: number; scale?: number; sign: string}> = ({f, x, y, scale = 1, sign}) => {
  const size = Math.min(34, 360 / (sign.length * 0.602 + 0.1));
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={230} ry={14} opacity={0.5} />
      <rect x={-230} y={-330} width={460} height={330} fill="#38434F" stroke={INK} strokeWidth={6} />
      <rect x={-230} y={-330} width={460} height={46} fill="#2C353F" stroke={INK} strokeWidth={6} />
      <rect x={-200} y={-276} width={400} height={64} rx={5} fill="#222A32" stroke={INK} strokeWidth={4.5} />
      <text x={-60} y={-276 + 42} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={size} letterSpacing={4} fill={PC.sodiumHot} opacity={0.85 + 0.1 * Math.sin(f / 7)}>{sign}</text>
      {[-130, 0, 130].map((dx) => <rect key={dx} x={dx - 52} y={-170} width={104} height={170} fill={PC.sodium} opacity={0.55} stroke={INK} strokeWidth={4.5} />)}
      <ellipse cx={0} cy={26} rx={260} ry={22} fill={PC.sodium} opacity={0.2} />
    </g>
  );
};

/** ServerBox — the vendor's box on a stand: a grey cabinet with blinking LEDs and a magenta band. Origin = ground under the middle. */
export const ServerBox: React.FC<{f: number; x: number; y: number; scale?: number; label?: string}> = ({f, x, y, scale = 1, label = 'FLOCK'}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={4} rx={110} ry={10} opacity={0.5} />
    <rect x={-84} y={-300} width={168} height={300} rx={8} fill="#5C6670" stroke={INK} strokeWidth={6} />
    <rect x={-84} y={-300} width={168} height={46} rx={8} fill={PC.lilac} stroke={INK} strokeWidth={6} />
    <text x={0} y={-268} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={26} letterSpacing={3} fill={INK}>{label}</text>
    {Array.from({length: 5}, (_, r) => (
      <g key={r} transform={`translate(0,${-226 + r * 44})`}>
        <rect x={-66} y={-14} width={132} height={30} rx={4} fill="#3A434D" stroke={INK} strokeWidth={3} />
        {[0, 1, 2].map((c) => <circle key={c} cx={-44 + c * 20} cy={1} r={4} fill={(f + r * 13 + c * 7) % 40 < 20 ? PC.cyan : '#2B343C'} />)}
      </g>
    ))}
  </g>
);

/** StatementCard — a paper card with a heading line and a body, sized to its strings by arithmetic. Origin = centre. */
export const StatementCard: React.FC<{x: number; y: number; head: string; lines: string[]; w?: number; rot?: number; tint?: string; opacity?: number; empty?: boolean}> = ({x, y, head, lines, w = 460, rot = 0, tint = PC.paper, opacity = 1, empty = false}) => {
  const hs = Math.min(22, (w - 40) / (head.length * 0.602 + 0.1));
  const h = 74 + lines.length * 40 + 20 + (empty ? 120 : 0);
  const textBottom = -h / 2 + 48 + 38 + lines.length * 40;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`} opacity={opacity}>
      <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={tint} stroke={INK} strokeWidth={5} />
      <rect x={-w / 2} y={-h / 2} width={w} height={48} fill={PC.graphite} stroke={INK} strokeWidth={5} />
      <text x={0} y={-h / 2 + 32} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={hs} letterSpacing={1} fill={PC.paper}>{head}</text>
      {empty ? (
        <g>
          <circle cx={0} cy={textBottom + 34} r={26} fill="#9AA3AD" stroke={INK} strokeWidth={4} />
          <path d={`M -44 ${textBottom + 100} Q 0 ${textBottom + 52} 44 ${textBottom + 100} Z`} fill="#9AA3AD" stroke={INK} strokeWidth={4} />
        </g>
      ) : null}
      {lines.map((l, i) => {
        const s = Math.min(26, (w - 40) / (l.length * 0.602 + 0.1));
        return <text key={i} x={0} y={-h / 2 + 48 + 38 + i * 40} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={800} fontSize={s} fill={INK}>{l}</text>;
      })}
    </g>
  );
};

/** TvMonitor — a studio monitor on a stand with static and a label bar. Origin = ground under the stand. */
export const TvMonitor: React.FC<{f: number; x: number; y: number; scale?: number; label?: string}> = ({f, x, y, scale = 1, label = 'TV STATION'}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={4} rx={110} ry={9} opacity={0.5} />
    <path d="M -10 0 L -10 -90 M 10 0 L 10 -90" stroke={INK} strokeWidth={14} />
    <rect x={-70} y={-12} width={140} height={14} rx={4} fill="#4E5862" stroke={INK} strokeWidth={4} />
    <rect x={-190} y={-330} width={380} height={246} rx={12} fill="#1B2229" stroke={INK} strokeWidth={7} />
    <rect x={-172} y={-314} width={344} height={186} rx={6} fill="#C6D3D8" />
    {Array.from({length: 22}, (_, i) => <rect key={i} x={-172 + (i * 53 + f * 7) % 330} y={-314 + ((i * 29 + f * 3) % 180)} width={14 + (i % 4) * 9} height={4} fill={i % 2 ? '#7E8D94' : '#F4F6F6'} opacity={0.7} />)}
    <rect x={-172} y={-120} width={344} height={32} fill={PC.graphite} />
    <text x={0} y={-97} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={900} fontSize={20} letterSpacing={3} fill={PC.paper}>{label}</text>
  </g>
);
