import React from 'react';
import {INK} from './Character';
import {tones, FormGradient, RimLight, ContactShadow} from './lighting';

// ============================================================================================
// RECORD SLOT FAMILY (NET-NEW 2026-11-15, "The Slot Without an Edge").
// The shelf had no CHANNEL object: nothing a viewer can watch a request ARRIVE through. Any story
// about how people reach an institution (records requests, permits, mail-in ballots, comment
// periods, tip lines) can now cast a door letterbox, a PROPOSED rule drawn as a pencilled draft
// template on clipped tracing vellum beside it, and a small courier robot that carries things.
// The letterbox is FACELESS by default (face={false}); the people in the scene carry the feeling.
// Every look is a prop; nothing is episode-local.
// ============================================================================================

const uid = (s: string) => 'rs' + Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type FlapEmotion = 'calm' | 'pleased' | 'puzzled' | 'strained' | 'wary' | 'startled';

/**
 * Flap. A blackened-gunmetal door letterbox, front-on, FACELESS by default (face={true} adds rivet eyes
 * and screw-slot brows for a story that wants a character). Origin (x, y) is the centre of the mouth slot.
 * At scale 1 the backplate is 420 x 250.
 *  - open 0..1      the hinged flap swings in (a dark throat shows)
 *  - gulp 0..1      a swallow squash of the plate
 *  - faceplate 0..1 the PROPOSED rule: tracing vellum clipped to the door BESIDE the mouth (to the right), never over it
 *  - sketch 0..1    a pencil draws the vellum's form-shaped outline on
 *  - bolts 0..4     pencilled bolt circles drawn one by one (only drawn, never fastened)
 *  - cutoutGlow 0..1 the outlined form glows amber
 *  - dashSolid 0..1 the dashed fourth (right) edge is pencilled solid from the top (still pencil, never ink)
 *  - dashGlow 0..1  the dashed edge glows amber
 *  - tag 0..1       a BLANK hang tag drops on a string from the vellum's top-right corner; tagSwing adds swing
 *  - emotion, look, lookY, cross apply only with face={true}
 * Idles: breath (plate scale), a travelling lip glint, rain beads on the lip. Draws no text.
 */
export const Flap: React.FC<{
  x: number; y: number; scale?: number; f: number;
  open?: number; gulp?: number; emotion?: FlapEmotion; look?: number; lookY?: number; cross?: number;
  faceplate?: number; bolts?: number; cutoutGlow?: number; dashSolid?: number; dashGlow?: number;
  tag?: number; tagSwing?: number; seed?: number; plateOnly?: boolean; face?: boolean; sketch?: number;
}> = ({x, y, scale = 1, f, open = 0, gulp = 0, emotion = 'calm', look = 0, lookY = 0, cross = 0,
  faceplate = 0, bolts = 0, cutoutGlow = 0, dashSolid = 0, dashGlow = 0, tag = 0, tagSwing = 0, seed = 1, plateOnly = false, face = false, sketch = 1}) => {
  const id = uid(`flap${x}${y}${seed}`);
  const gm = tones('#4A4F57');
  const nk = tones('#B9BEC4');
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
          {face ? <>{eye(-82, -1)}{eye(82, 1)}</> : (
            <g>
              <rect x={-120} y={-100} width={240} height={50} rx={10} fill={gm.core} stroke={INK} strokeWidth={4} />
              {[-80, -40, 0, 40, 80].map((lx) => <line key={lx} x1={lx} y1={-90} x2={lx} y2={-60} stroke={gm.key} strokeWidth={4} opacity={0.5} />)}
            </g>
          )}
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
          {face && gp > 0.02 && [-1, 1].map((s) => (
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
        <FacePlate f={f} id={id} p={fp} sketch={sketch} bolts={bolts} cutoutGlow={cutoutGlow} dashSolid={dashSolid} dashGlow={dashGlow} tag={tag} tagSwing={tagSwing} />
      )}
    </g>
  );
};

/** the PROPOSED rule as a DRAFT TEMPLATE: a sheet of tracing vellum clipped to the door beside the mouth (to the right),
 *  a pencilled form-shaped outline whose fourth (right) edge is dashed, pencilled bolt circles that are only drawn, a DRAFT tab. */
const FacePlate: React.FC<{f: number; id: string; p: number; sketch: number; bolts: number; cutoutGlow: number; dashSolid: number; dashGlow: number; tag: number; tagSwing: number}> =
({f, p, sketch, bolts, cutoutGlow, dashSolid, dashGlow, tag, tagSwing}) => {
  const PX = 236, PY = -150, PW = 250, PH = 320;
  const holes = [[PX + 24, PY + 24], [PX + PW - 24, PY + 24], [PX + 24, PY + PH - 24], [PX + PW - 24, PY + PH - 24]];
  const cx0 = PX + 52, cy0 = PY + 62, cw = 146, ch = 196, fold = 30;
  const leftTopBottom = `M ${cx0 + cw} ${cy0 + ch} H ${cx0} V ${cy0} H ${cx0 + cw - fold} L ${cx0 + cw} ${cy0 + fold}`;
  const outlineLen = cw + ch + (cw - fold) + Math.hypot(fold, fold);
  const sk = clamp01(sketch);
  const ds = clamp01(dashSolid);
  const rightEdgeLen = ch - fold;
  const dg = clamp01(dashGlow);
  const tg = clamp01(tag);
  const lift = (1 - clamp01(p)) * 40;
  const curl = Math.sin(f / 23) * 2;
  const swing = Math.sin(f / 13) * 9 * (0.4 + clamp01(tagSwing)) + (1 - tg) * 30;
  const GRAPH = '#3A4652';
  return (
    <g opacity={Math.min(1, p * 2.5)} transform={`translate(0 ${-lift})`}>
      {/* the vellum sheet, translucent, with a soft shadow and a curling lower corner */}
      <rect x={PX + 8} y={PY + 12} width={PW} height={PH} rx={3} fill="#000" opacity={0.25} />
      <path d={`M ${PX} ${PY} H ${PX + PW} V ${PY + PH - 30 + curl} Q ${PX + PW - 6} ${PY + PH - 6} ${PX + PW - 34 + curl} ${PY + PH} H ${PX} Z`} fill="#E6EEF2" fillOpacity={0.62} stroke={INK} strokeWidth={4} />
      <path d={`M ${PX + PW} ${PY + PH - 30 + curl} Q ${PX + PW - 22} ${PY + PH - 26} ${PX + PW - 34 + curl} ${PY + PH}`} fill="#C9D4DA" stroke={INK} strokeWidth={3} />
      {/* two binder clips holding it to the door */}
      {[PX + 50, PX + PW - 50].map((bx) => (
        <g key={bx} transform={`translate(${bx} ${PY - 4})`}>
          <rect x={-22} y={-12} width={44} height={26} rx={4} fill="#2A2E34" stroke={INK} strokeWidth={3} />
          <path d="M -14 -12 Q 0 -34 14 -12" fill="none" stroke="#9AA4AC" strokeWidth={3} />
        </g>
      ))}
      {/* faint grid lines on the vellum */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={PX + 12} y1={PY + 40 + i * 42} x2={PX + PW - 12} y2={PY + 40 + i * 42} stroke="#9FB6C4" strokeWidth={1.2} opacity={0.5} />)}
      {/* the cutout, glowing when lit, pencilled in as it is sketched */}
      <path d={`${leftTopBottom} V ${cy0 + ch} Z`} fill="#F2A541" opacity={0.4 * clamp01(cutoutGlow)} />
      <path d={leftTopBottom} fill="none" stroke={GRAPH} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round"
        strokeDasharray={`${outlineLen * sk} ${outlineLen}`} />
      {/* the fourth edge: a dashed pencil line, glowing, pencilled solid by dashSolid from the top */}
      {dg > 0.01 && <line x1={cx0 + cw} y1={cy0 + fold} x2={cx0 + cw} y2={cy0 + ch} stroke="#F2A541" strokeWidth={20} opacity={0.3 * dg} strokeLinecap="round" />}
      {sk > 0.98 && <line x1={cx0 + cw} y1={cy0 + fold} x2={cx0 + cw} y2={cy0 + ch} stroke={dg > 0.01 ? '#F6C46A' : INK} strokeWidth={8}
        strokeDasharray="14 14" strokeDashoffset={-f * 0.6} strokeLinecap="round" />}
      {ds > 0.001 && <line x1={cx0 + cw} y1={cy0 + fold} x2={cx0 + cw} y2={cy0 + fold + rightEdgeLen * ds} stroke={GRAPH} strokeWidth={8} strokeLinecap="round" />}
      {/* pencilled bolt circles: only drawn, never fastened */}
      {holes.map(([bx, by], i) => {
        const k = clamp01(bolts - i);
        return <circle key={i} cx={bx} cy={by} r={13} fill="none" stroke={GRAPH} strokeWidth={3} strokeDasharray={`${82 * k} 82`} />;
      })}
      {/* the DRAFT tab and the BLANK hang tag on a string from the top-right corner */}
      <g transform={`translate(${PX + 20} ${PY + PH - 46})`}>
        <rect x={0} y={0} width={86} height={30} rx={3} fill="none" stroke={GRAPH} strokeWidth={3} strokeDasharray="6 5" />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={10 + i * 15} y1={22} x2={18 + i * 15} y2={8} stroke={GRAPH} strokeWidth={3} />)}
      </g>
      {tg > 0.01 && (
        <g transform={`translate(${PX + PW - 8} ${PY + 8}) rotate(${swing})`}>
          <path d={`M 0 0 V ${12 + 84 * tg}`} stroke="#9AA4AC" strokeWidth={3} />
          <g transform={`translate(0 ${12 + 84 * tg})`}>
            <path d="M -38 0 H 38 V 70 H -38 Z" fill="#D7DEE2" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <circle cx={0} cy={12} r={6} fill="#14181E" />
          </g>
        </g>
      )}
    </g>
  );
};

/**
 * Tote. A small graphite courier robot with an ice-cyan screen face: a rounded box on two wheels with a screen face, an antenna and a
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
  const body = tones('#8C96A0');
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
          <rect key={ex} x={ex - 8} y={-102 - eyeH / 2 + blink * eyeH * 0.45} width={16} height={Math.max(2, eyeH * (1 - blink * 0.9))} rx={6} fill="#9FE7FF" />
        ))}
        {emotion === 'puzzled'
          ? <path d="M -14 -72 Q 0 -78 14 -70" stroke="#9FE7FF" strokeWidth={4} fill="none" strokeLinecap="round" />
          : <path d="M -16 -76 Q 0 -66 16 -76" stroke="#9FE7FF" strokeWidth={4} fill="none" strokeLinecap="round" />}
        {/* antenna */}
        <line x1={30} y1={-150} x2={40 + Math.sin(f / 7) * 3} y2={-186} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <circle cx={40 + Math.sin(f / 7) * 3} cy={-190} r={8} fill="#9FE7FF" stroke={INK} strokeWidth={3} />
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
          <circle cx={0} cy={18} r={5} fill="#B9BEC4" stroke={INK} strokeWidth={2} />
        </g>
        <RimLight d="M -60 -150 H 50 Q 74 -150 74 -126" w={4} color="#FFE2A8" opacity={0.6} />
      </g>
    </g>
  );
};
