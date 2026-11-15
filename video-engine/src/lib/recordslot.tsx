import React from 'react';
import {INK} from './Character';
import {tones, FormGradient, RimLight, ContactShadow} from './lighting';

// ============================================================================================
// RECORD SLOT FAMILY (NET-NEW 2026-11-15, "The Slot Without an Edge").
// The shelf had no CHANNEL object: nothing a viewer can watch a request ARRIVE through. Any story
// about how people reach an institution (records requests, permits, mail-in ballots, comment
// periods, tip lines) can now cast a letterbox with a face, the steel faceplate a rule bolts on
// beside it, and a small courier robot that carries things through.
// Every look is a prop; nothing is episode-local.
// ============================================================================================

const uid = (s: string) => 'rs' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type FlapEmotion = 'calm' | 'pleased' | 'puzzled' | 'strained' | 'wary' | 'startled';

/**
 * Flap. A blackened-gunmetal door letterbox WITH A FACE, set into a door, front-on.
 * Origin (x, y) is the centre of the mouth slot. At scale 1 the backplate is 420 x 250.
 *  - open 0..1      the hinged flap swings in (the mouth opens, a dark throat shows)
 *  - gulp 0..1      a swallow: the plate squashes, the flap clamps, the cheeks puff
 *  - emotion        lids, brows (screw slots) and pupils
 *  - look -1..1     pupils slide left / right; lookY -1..1 up / down
 *  - cross 0..1     eyes cross (at a bolt beside it)
 *  - faceplate 0..1 a steel plate swings in and bolts on BESIDE the mouth (to the right), never over it
 *  - bolts 0..4     how many of the four bolt heads have fired (each flashes cinnabar as it lands)
 *  - cutoutGlow 0..1 the plate's form-shaped cutout lights
 *  - dashSolid 0..1 the cutout's fourth (right) edge is drawn solid from top to bottom; 0 = dashed
 *  - dashGlow 0..1  the dashed edge glows amber
 *  - tag 0..1       a BLANK hang tag drops on a chain from the plate's top-right corner; tagSwing adds swing
 * Idles: breath (plate scale), a seeded blink, a lip glint that travels, rain beads on the lip.
 * The asset draws its own door-surround shadow; it never draws text.
 */
export const Flap: React.FC<{
  x: number; y: number; scale?: number; f: number;
  open?: number; gulp?: number; emotion?: FlapEmotion; look?: number; lookY?: number; cross?: number;
  faceplate?: number; bolts?: number; cutoutGlow?: number; dashSolid?: number; dashGlow?: number;
  tag?: number; tagSwing?: number; seed?: number; plateOnly?: boolean;
}> = ({x, y, scale = 1, f, open = 0, gulp = 0, emotion = 'calm', look = 0, lookY = 0, cross = 0,
  faceplate = 0, bolts = 0, cutoutGlow = 0, dashSolid = 0, dashGlow = 0, tag = 0, tagSwing = 0, seed = 1, plateOnly = false}) => {
  const id = uid(`flap${x}${y}${seed}`);
  const gm = tones('#4A4F57');
  const nk = tones('#B9BEC4');
  const steel = tones('#7E8A94');
  const op = clamp01(open);
  const gp = clamp01(gulp);
  const breath = 1 + 0.018 * Math.sin(f / 15 + seed);
  const sy = breath * (1 - 0.1 * Math.sin(gp * Math.PI));
  const sx = breath * (1 + 0.07 * Math.sin(gp * Math.PI));
  const blinkPhase = (f + seed * 41) % 124;
  const blink = blinkPhase < 6 ? Math.sin((blinkPhase / 6) * Math.PI) : 0;
  const lid = {calm: 0.28, pleased: 0.45, puzzled: 0.2, strained: 0.55, wary: 0.5, startled: 0.02}[emotion];
  const lidK = Math.min(1, lid + blink * (1 - lid));
  const browTilt = {calm: 0, pleased: -6, puzzled: 14, strained: -14, wary: 8, startled: -4}[emotion];
  const browLift = {calm: 0, pleased: -4, puzzled: -10, strained: 6, wary: 2, startled: -16}[emotion];
  const px = Math.max(-1, Math.min(1, look)) * 12;
  const py = Math.max(-1, Math.min(1, lookY)) * 8;
  const cx = clamp01(cross) * 11;
  const glint = ((f * 3.2 + seed * 90) % 520) - 260;
  const fp = clamp01(faceplate);
  const W = 420, H = 250;

  const eye = (ex: number, side: 1 | -1) => (
    <g transform={`translate(${ex} -72)`}>
      {/* rivet socket */}
      <circle r={30} fill={gm.core} stroke={INK} strokeWidth={5} />
      <circle r={24} fill="#F2EEE4" stroke={INK} strokeWidth={3} />
      <circle cx={px - side * cx} cy={py} r={11} fill={INK} />
      <circle cx={px - side * cx - 4} cy={py - 4} r={3.6} fill="#FFFFFF" />
      {/* lid: a gunmetal shutter that drops over the eye */}
      <clipPath id={`${id}e${side}`}><circle r={24} /></clipPath>
      <g clipPath={`url(#${id}e${side})`}>
        <rect x={-30} y={-30} width={60} height={60 * lidK} fill={`url(#${id}g)`} stroke={INK} strokeWidth={3} />
      </g>
      {/* screw-slot brow */}
      <g transform={`translate(0 ${-42 + browLift}) rotate(${browTilt * side})`}>
        <rect x={-26} y={-6} width={52} height={12} rx={6} fill={nk.base} stroke={INK} strokeWidth={4} />
        <line x1={-14} y1={0} x2={14} y2={0} stroke={INK} strokeWidth={3} />
      </g>
    </g>
  );

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <FormGradient id={`${id}g`} t={gm} softness={0.62} />
        <FormGradient id={`${id}n`} t={nk} softness={0.6} />
        <FormGradient id={`${id}s`} t={steel} softness={0.6} />
        <linearGradient id={`${id}th`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06080A" />
          <stop offset="1" stopColor="#1B1F24" />
        </linearGradient>
      </defs>
      {!plateOnly && (
        <g transform={`scale(${sx} ${sy})`}>
          {/* recess shadow in the door */}
          <rect x={-W / 2 + 10} y={-H / 2 + 14} width={W} height={H} rx={34} fill="#000" opacity={0.35} />
          {/* backplate */}
          <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={34} fill={`url(#${id}g)`} stroke={INK} strokeWidth={7} />
          <path d={`M ${-W / 2 + 30} ${-H / 2 + 8} H ${W / 2 - 40}`} stroke={gm.key} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
          {/* corner screws */}
          {[[-W / 2 + 28, -H / 2 + 28], [W / 2 - 28, -H / 2 + 28], [-W / 2 + 28, H / 2 - 28], [W / 2 - 28, H / 2 - 28]].map(([sx2, sy2], i) => (
            <g key={i} transform={`translate(${sx2} ${sy2}) rotate(${i * 37})`}>
              <circle r={10} fill={`url(#${id}n)`} stroke={INK} strokeWidth={3} />
              <line x1={-6} y1={0} x2={6} y2={0} stroke={INK} strokeWidth={2.5} />
            </g>
          ))}
          {eye(-82, -1)}
          {eye(82, 1)}
          {/* the mouth: slot frame, throat, and the hinged flap */}
          <rect x={-150} y={8} width={300} height={70} rx={20} fill={`url(#${id}n)`} stroke={INK} strokeWidth={6} />
          <rect x={-134} y={20} width={268} height={46} rx={12} fill={`url(#${id}th)`} />
          {/* the flap: hinged at the top edge of the throat, swings inward (foreshortens upward) */}
          <g transform={`translate(0 20) scale(1 ${1 - 0.86 * op})`}>
            <rect x={-134} y={0} width={268} height={46} rx={10} fill={`url(#${id}g)`} stroke={INK} strokeWidth={5} />
            <rect x={-118} y={30} width={236} height={7} rx={3.5} fill={gm.key} opacity={0.55} />
            {/* the travelling lip glint */}
            <clipPath id={`${id}fl`}><rect x={-134} y={0} width={268} height={46} rx={10} /></clipPath>
            <g clipPath={`url(#${id}fl)`}>
              <rect x={glint} y={-10} width={40} height={70} fill="#FFF3D9" opacity={0.22} transform={`skewX(-24)`} />
            </g>
          </g>
          {/* cheeks puff on the gulp */}
          {gp > 0.02 && [-1, 1].map((s) => (
            <ellipse key={s} cx={s * 172} cy={42} rx={18 * Math.sin(gp * Math.PI)} ry={24 * Math.sin(gp * Math.PI)} fill={gm.key} stroke={INK} strokeWidth={4} opacity={0.9} />
          ))}
          {/* rain beads hanging from the nickel lip */}
          {[0, 1, 2, 3, 4].map((i) => {
            const bx = -120 + i * 60 + ((seed * 13 + i * 7) % 11);
            const life = ((f + i * 23 + seed * 5) % 70) / 70;
            return (
              <g key={i}>
                <ellipse cx={bx} cy={80 + 6 * life} rx={4.5 + 2 * life} ry={5 + 4 * life} fill="#DCE6EE" stroke={INK} strokeWidth={1.6} opacity={0.85} />
                {life > 0.85 && <ellipse cx={bx} cy={80 + 6 * life + (life - 0.85) * 400} rx={3} ry={5} fill="#DCE6EE" opacity={0.7} />}
              </g>
            );
          })}
          <RimLight d={`M ${-W / 2 + 34} ${-H / 2} H ${W / 2 - 34} Q ${W / 2} ${-H / 2} ${W / 2} ${-H / 2 + 34}`} w={5} color="#FFE2A8" opacity={0.55} />
        </g>
      )}
      {fp > 0.001 && (
        <FacePlate f={f} id={id} p={fp} bolts={bolts} cutoutGlow={cutoutGlow} dashSolid={dashSolid} dashGlow={dashGlow} tag={tag} tagSwing={tagSwing} steelId={`${id}s`} />
      )}
    </g>
  );
};

/** the proposed faceplate, in Flap's local space: to the right of the mouth, bolted to the door. */
const FacePlate: React.FC<{f: number; id: string; p: number; bolts: number; cutoutGlow: number; dashSolid: number; dashGlow: number; tag: number; tagSwing: number; steelId: string}> =
({f, id, p, bolts, cutoutGlow, dashSolid, dashGlow, tag, tagSwing, steelId}) => {
  // swings in from the right about its left hinge, lands with a small overshoot
  const ang = (1 - p) * 70;
  const PX = 236, PY = -150, PW = 250, PH = 320;
  const holes = [[PX + 24, PY + 24], [PX + PW - 24, PY + 24], [PX + 24, PY + PH - 24], [PX + PW - 24, PY + PH - 24]];
  // the form-shaped cutout: a sheet with a folded top-right corner
  const cx0 = PX + 52, cy0 = PY + 62, cw = 146, ch = 196, fold = 30;
  const leftTopBottom = `M ${cx0 + cw} ${cy0 + ch} H ${cx0} V ${cy0} H ${cx0 + cw - fold} L ${cx0 + cw} ${cy0 + fold}`;
  const ds = clamp01(dashSolid);
  const rightEdgeLen = ch - fold;
  const dg = clamp01(dashGlow);
  const tg = clamp01(tag);
  const swing = Math.sin(f / 13) * 9 * (0.4 + clamp01(tagSwing)) + (1 - tg) * 30;
  return (
    <g transform={`translate(${PX} 0) skewY(${-ang * 0.12}) scale(${Math.cos((ang * Math.PI) / 180)} 1) translate(${-PX} 0)`} opacity={Math.min(1, p * 3)}>
      <rect x={PX + 10} y={PY + 14} width={PW} height={PH} rx={14} fill="#000" opacity={0.35} />
      <rect x={PX} y={PY} width={PW} height={PH} rx={14} fill={`url(#${steelId})`} stroke={INK} strokeWidth={7} />
      {/* brushed lines */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line key={i} x1={PX + 16} y1={PY + 30 + i * 38} x2={PX + PW - 16} y2={PY + 30 + i * 38} stroke="#FFFFFF" strokeWidth={1.4} opacity={0.12} />
      ))}
      {/* the cutout: dark through the plate, lit when cutoutGlow rises */}
      <path d={`${leftTopBottom} V ${cy0 + ch} Z`} fill="#0B0E12" />
      <path d={`${leftTopBottom} V ${cy0 + ch} Z`} fill="#F2A541" opacity={0.55 * clamp01(cutoutGlow)} />
      <path d={leftTopBottom} fill="none" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d={leftTopBottom} fill="none" stroke="#C9D2D9" strokeWidth={3} strokeLinejoin="round" opacity={0.7} />
      {/* the fourth edge: dashed, glowing, drawn solid by dashSolid from the top */}
      {dg > 0.01 && <line x1={cx0 + cw} y1={cy0 + fold} x2={cx0 + cw} y2={cy0 + ch} stroke="#F2A541" strokeWidth={22} opacity={0.28 * dg} strokeLinecap="round" />}
      <line x1={cx0 + cw} y1={cy0 + fold} x2={cx0 + cw} y2={cy0 + ch} stroke={dg > 0.01 ? '#F6C46A' : '#C9D2D9'} strokeWidth={7}
        strokeDasharray="16 14" strokeDashoffset={-f * 0.6} strokeLinecap="round" />
      {ds > 0.001 && <line x1={cx0 + cw} y1={cy0 + fold} x2={cx0 + cw} y2={cy0 + fold + rightEdgeLen * ds} stroke={INK} strokeWidth={9} strokeLinecap="round" />}
      {/* bolts: each fires in turn, flashing cinnabar */}
      {holes.map(([bx, by], i) => {
        const k = clamp01(bolts - i);
        const flash = k > 0 && k < 1 ? 1 - k : 0;
        return (
          <g key={i} transform={`translate(${bx} ${by})`}>
            <circle r={13} fill="#20252B" stroke={INK} strokeWidth={3} />
            {k > 0 && <g transform={`scale(${0.6 + 0.4 * Math.min(1, k * 1.3)})`}>
              <circle r={14} fill="#D2452F" stroke={INK} strokeWidth={4} />
              <polygon points="-6,-3 0,-7 6,-3 6,3 0,7 -6,3" fill="#8E2A1C" />
            </g>}
            {flash > 0.05 && <circle r={14 + 26 * (1 - flash)} fill="none" stroke="#FFB08F" strokeWidth={4} opacity={flash} />}
          </g>
        );
      })}
      {/* the blank hang tag on a chain from the top-right corner */}
      {tg > 0.01 && (
        <g transform={`translate(${PX + PW - 8} ${PY + 8}) rotate(${swing})`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse key={i} cx={0} cy={12 + i * 14 * tg} rx={4} ry={7} fill="none" stroke="#9AA4AC" strokeWidth={3} />
          ))}
          <g transform={`translate(0 ${12 + 84 * tg})`}>
            <path d="M -38 0 H 38 V 70 H -38 Z" fill="#EDE2C6" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <circle cx={0} cy={12} r={6} fill="#14181E" />
            <path d="M -30 64 H 30" stroke="#C9BC99" strokeWidth={3} />
          </g>
        </g>
      )}
    </g>
  );
};

/**
 * Tote. A small seafoam courier robot: a rounded box on two wheels with a screen face, an antenna and a
 * satchel on a strap. It CARRIES things; it never writes. Origin is the contact point between the wheels.
 * At scale 1 it stands about 230 tall.
 *  - roll       distance travelled in px (wheels spin by it)
 *  - lean -1..1 leans forward / back (acceleration)
 *  - emotion    eager | puzzled | calm
 *  - satchelSwing 0..1 adds swing to the bag
 *  - envelope 0..1 an envelope rises out of the satchel and is held up in its gripper
 */
export const Tote: React.FC<{
  x: number; y: number; scale?: number; f: number; facing?: 1 | -1;
  roll?: number; lean?: number; emotion?: 'eager' | 'puzzled' | 'calm'; satchelSwing?: number; envelope?: number; seed?: number;
}> = ({x, y, scale = 1, f, facing = 1, roll = 0, lean = 0, emotion = 'eager', satchelSwing = 0, envelope = 0, seed = 2}) => {
  const id = uid(`tote${x}${y}${seed}`);
  const body = tones('#7FD6C2');
  const dark = tones('#2F3A42');
  const bob = Math.sin(f / 9 + seed) * 3;
  const wheelRot = (roll / (2 * Math.PI * 26)) * 360;
  const sw = Math.sin(f / 11 + seed) * (6 + 14 * clamp01(satchelSwing));
  const blinkPhase = (f + seed * 29) % 98;
  const blink = blinkPhase < 5 ? Math.sin((blinkPhase / 5) * Math.PI) : 0;
  const ev = clamp01(envelope);
  const eyeH = emotion === 'puzzled' ? 9 : 16;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}>
      <defs>
        <FormGradient id={`${id}b`} t={body} softness={0.66} />
        <FormGradient id={`${id}d`} t={dark} softness={0.6} />
      </defs>
      <ContactShadow cx={0} cy={2} rx={84} ry={14} opacity={0.42} blur={8} />
      {/* wheels */}
      {[-46, 46].map((wx) => (
        <g key={wx} transform={`translate(${wx} -26) rotate(${wheelRot})`}>
          <circle r={26} fill={`url(#${id}d)`} stroke={INK} strokeWidth={5} />
          <circle r={9} fill="#9AA4AC" stroke={INK} strokeWidth={3} />
          {[0, 60, 120].map((a) => <line key={a} x1={0} y1={0} x2={22 * Math.cos((a * Math.PI) / 180)} y2={22 * Math.sin((a * Math.PI) / 180)} stroke={INK} strokeWidth={3} />)}
        </g>
      ))}
      <g transform={`translate(0 ${-50 + bob}) rotate(${lean * 8})`}>
        {/* body */}
        <rect x={-74} y={-150} width={148} height={140} rx={34} fill={`url(#${id}b)`} stroke={INK} strokeWidth={6} />
        <path d="M -52 -146 H 40" stroke={body.key} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        {/* screen face */}
        <rect x={-54} y={-128} width={108} height={70} rx={16} fill="#13202B" stroke={INK} strokeWidth={4} />
        {[-22, 22].map((ex) => (
          <rect key={ex} x={ex - 8} y={-102 - eyeH / 2 + blink * eyeH * 0.45} width={16} height={Math.max(2, eyeH * (1 - blink * 0.9))} rx={6} fill="#7FD6C2" />
        ))}
        {emotion === 'puzzled'
          ? <path d="M -14 -72 Q 0 -78 14 -70" stroke="#7FD6C2" strokeWidth={4} fill="none" strokeLinecap="round" />
          : <path d="M -16 -76 Q 0 -66 16 -76" stroke="#7FD6C2" strokeWidth={4} fill="none" strokeLinecap="round" />}
        {/* antenna */}
        <line x1={30} y1={-150} x2={40 + Math.sin(f / 7) * 3} y2={-186} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <circle cx={40 + Math.sin(f / 7) * 3} cy={-190} r={8} fill="#D9FFF6" stroke={INK} strokeWidth={3} />
        {/* satchel on a strap */}
        <path d="M -60 -138 L 62 -40" stroke="#5B4632" strokeWidth={9} strokeLinecap="round" />
        <g transform={`translate(58 -40) rotate(${sw})`}>
          {ev > 0.01 && (
            <g transform={`translate(0 ${-30 - 60 * ev})`}>
              <rect x={-34} y={-22} width={68} height={44} rx={4} fill="#F3E9D2" stroke={INK} strokeWidth={4} />
              <path d="M -34 -22 L 0 6 L 34 -22" fill="none" stroke={INK} strokeWidth={3} />
            </g>
          )}
          <rect x={-40} y={-10} width={80} height={62} rx={12} fill="#7A5A3C" stroke={INK} strokeWidth={5} />
          <path d="M -40 8 Q 0 26 40 8" fill="#8F6C4A" stroke={INK} strokeWidth={4} />
          <circle cx={0} cy={18} r={5} fill="#C9A24A" stroke={INK} strokeWidth={2} />
        </g>
        <RimLight d="M -60 -150 H 50 Q 74 -150 74 -126" w={4} color="#FFE2A8" opacity={0.6} />
      </g>
    </g>
  );
};
