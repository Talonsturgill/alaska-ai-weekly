import React from 'react';

// =============================================================================
// CHARACTER — the parameterized IGS-style person rig (the cast system).
// Draw space: local 300x520, feet at (150,500). Scenes place/scale/flip it.
// Every shape ink-outlined; torso/head carry shade + highlight tones; idle
// breath + blink built in (pass the frame). Poses/emotions/outfits are props,
// so one rig yields a whole cast that REACTS to the story.
// =============================================================================

export const INK = '#101423';

export type Pose = 'stand' | 'arms-crossed' | 'point' | 'panic';
export type Emotion = 'neutral' | 'angry' | 'worried' | 'shock' | 'smug';
// Everyday Alaskan gear (deliberately NOT the fur-ruff parka, which reads as
// Inupiat/Inuit-coded; the crowd must read as generic residents). 'parka' is kept
// for legacy scenes but new crowds use puffer/flannel/vest + varied headgear.
export type Outfit = 'parka' | 'suit' | 'worker' | 'puffer' | 'flannel' | 'vest';
export type Headgear = 'bare' | 'beanie' | 'cap' | 'trapper' | 'hood';

export interface CharacterProps {
  frame: number;
  pose?: Pose;
  emotion?: Emotion;
  outfit?: Outfit;
  headgear?: Headgear;
  hair?: string;
  skin?: string;
  facing?: 1 | -1; // 1 = faces right
  scale?: number;
  x?: number;
  y?: number; // feet anchor in scene coords
}

const OUTFITS: Record<Outfit, {main: string; shade: string; trim: string; pants: string}> = {
  parka: {main: '#c8542e', shade: '#a03e1f', trim: '#e8dcc8', pants: '#3a4a5c'},
  suit: {main: '#2e4a6b', shade: '#22374f', trim: '#e23b30', pants: '#22374f'},
  worker: {main: '#e8a423', shade: '#c4861a', trim: '#e8e0d0', pants: '#4a4238'},
  puffer: {main: '#2f7d6b', shade: '#215c4e', trim: '#173f35', pants: '#3a4250'},
  flannel: {main: '#b23a3a', shade: '#8a2a2a', trim: '#e0d2c0', pants: '#38404e'},
  vest: {main: '#c98a2a', shade: '#a06e1f', trim: '#4a4238', pants: '#3a4250'},
};

export const Character: React.FC<CharacterProps> = ({
  frame: f,
  pose = 'stand',
  emotion = 'neutral',
  outfit = 'puffer',
  headgear = 'bare',
  hair = '#3d2c1e',
  skin = '#e8b48c',
  facing = 1,
  scale = 1,
  x = 0,
  y = 0,
}) => {
  const c = OUTFITS[outfit];
  const breath = 1 + 0.011 * Math.sin(f / 13);
  const bob = 2.2 * Math.sin(f / 13);
  const blink = ((f + 11) % 92) < 5;
  const skinShade = '#c99268';

  // ---- face per emotion --------------------------------------------------
  const face = () => {
    const browY = emotion === 'shock' ? -14 : 0;
    return (
      <g>
        {/* eyes */}
        {blink && emotion !== 'shock' ? (
          <g>
            <path d="M-26,-14 q9,5 18,0" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <path d="M10,-14 q9,5 18,0" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <ellipse cx={-17} cy={-14} rx={emotion === 'shock' ? 13 : 9.5} ry={emotion === 'smug' ? 6 : emotion === 'shock' ? 15 : 11} fill="#fff" stroke={INK} strokeWidth={4.5} />
            <ellipse cx={19} cy={-14} rx={emotion === 'shock' ? 13 : 9.5} ry={emotion === 'smug' ? 6 : emotion === 'shock' ? 15 : 11} fill="#fff" stroke={INK} strokeWidth={4.5} />
            <circle cx={-15 + 2 * facing} cy={-13} r={emotion === 'shock' ? 3.4 : 4.4} fill={INK} />
            <circle cx={21 + 2 * facing} cy={-13} r={emotion === 'shock' ? 3.4 : 4.4} fill={INK} />
          </g>
        )}
        {/* brows */}
        {emotion === 'angry' && (
          <g>
            <path d="M-30,-34 L-6,-24" stroke={INK} strokeWidth={7} strokeLinecap="round" />
            <path d="M32,-34 L8,-24" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          </g>
        )}
        {emotion === 'worried' && (
          <g>
            <path d="M-28,-26 q12,-8 22,-2" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
            <path d="M30,-26 q-12,-8 -22,-2" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
          </g>
        )}
        {emotion === 'shock' && (
          <g transform={`translate(0,${browY})`}>
            <path d="M-28,-30 q11,-7 21,-3" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
            <path d="M30,-30 q-11,-7 -21,-3" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
          </g>
        )}
        {emotion === 'smug' && (
          <g>
            <path d="M-28,-30 q12,-3 22,1" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
            <path d="M30,-36 q-12,-6 -22,-1" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
          </g>
        )}
        {emotion === 'neutral' && (
          <g>
            <path d="M-27,-29 q10,-4 20,-1" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
            <path d="M29,-29 q-10,-4 -20,-1" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
          </g>
        )}
        {/* mouth */}
        {emotion === 'angry' && <path d="M-14,14 q15,-9 29,0" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
        {emotion === 'worried' && <path d="M-10,14 q11,7 22,0 q-11,10 -22,0 Z" fill="#7a2f2f" stroke={INK} strokeWidth={4.5} />}
        {emotion === 'shock' && <ellipse cx={2} cy={18} rx={12} ry={16} fill="#7a2f2f" stroke={INK} strokeWidth={5} />}
        {emotion === 'smug' && <path d="M-12,12 q16,10 30,-4" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
        {emotion === 'neutral' && <path d="M-10,14 q12,6 24,0" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
        {/* worried/angry sweat drop */}
        {(emotion === 'worried' || emotion === 'shock') && (
          <path d={`M44,-30 q7,${10 + 3 * Math.sin(f / 9)} 0,${18 + 3 * Math.sin(f / 9)} q-7,-8 0,-18 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={3} />
        )}
      </g>
    );
  };

  // ---- arms per pose -------------------------------------------------------
  const arms = () => {
    switch (pose) {
      case 'arms-crossed':
        return (
          <g>
            <path d="M-52,278 q30,26 62,18 L52,282" fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <path d="M-52,278 q30,26 62,18 L52,282" fill="none" stroke={c.main} strokeWidth={22} strokeLinecap="round" />
            <path d="M52,294 q-30,24 -62,16 L-52,296" fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <path d="M52,294 q-30,24 -62,16 L-52,296" fill="none" stroke={c.shade} strokeWidth={22} strokeLinecap="round" />
            <circle cx={-54} cy={296} r={15} fill={skin} stroke={INK} strokeWidth={5} />
            <circle cx={54} cy={282} r={15} fill={skin} stroke={INK} strokeWidth={5} />
          </g>
        );
      case 'point':
        return (
          <g>
            {/* rear arm at side */}
            <path d="M-46,266 q-16,44 -8,84" fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <path d="M-46,266 q-16,44 -8,84" fill="none" stroke={c.shade} strokeWidth={22} strokeLinecap="round" />
            {/* pointing arm extended forward */}
            <path d={`M46,262 q52,-6 96,${-18 + 3 * Math.sin(f / 11)}`} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <path d={`M46,262 q52,-6 96,${-18 + 3 * Math.sin(f / 11)}`} fill="none" stroke={c.main} strokeWidth={22} strokeLinecap="round" />
            <g transform={`translate(148,${242 + 3 * Math.sin(f / 11)})`}>
              <circle r={15} fill={skin} stroke={INK} strokeWidth={5} />
              <rect x={8} y={-7} width={30} height={13} rx={6.5} fill={skin} stroke={INK} strokeWidth={4.5} />
            </g>
          </g>
        );
      case 'panic':
        return (
          <g>
            <path d={`M-46,256 q-40,-42 -34,${-86 + 4 * Math.sin(f / 8)}`} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <path d={`M-46,256 q-40,-42 -34,${-86 + 4 * Math.sin(f / 8)}`} fill="none" stroke={c.main} strokeWidth={22} strokeLinecap="round" />
            <path d={`M46,256 q40,-42 34,${-86 - 4 * Math.sin(f / 8)}`} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <path d={`M46,256 q40,-42 34,${-86 - 4 * Math.sin(f / 8)}`} fill="none" stroke={c.main} strokeWidth={22} strokeLinecap="round" />
            <circle cx={-80} cy={168 + 4 * Math.sin(f / 8)} r={15} fill={skin} stroke={INK} strokeWidth={5} />
            <circle cx={80} cy={168 - 4 * Math.sin(f / 8)} r={15} fill={skin} stroke={INK} strokeWidth={5} />
          </g>
        );
      default: // stand
        return (
          <g>
            <path d={`M-46,266 q-14,46 -6,${88 + 2 * Math.sin(f / 13)}`} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <path d={`M-46,266 q-14,46 -6,${88 + 2 * Math.sin(f / 13)}`} fill="none" stroke={c.main} strokeWidth={22} strokeLinecap="round" />
            <path d={`M46,266 q14,46 6,${88 - 2 * Math.sin(f / 13)}`} fill="none" stroke={c.shade} strokeWidth={22} strokeLinecap="round" />
            <path d={`M46,266 q14,46 6,${88 - 2 * Math.sin(f / 13)}`} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <circle cx={-52} cy={358} r={14} fill={skin} stroke={INK} strokeWidth={5} />
            <circle cx={52} cy={356} r={14} fill={skin} stroke={INK} strokeWidth={5} />
          </g>
        );
    }
  };

  return (
    <g transform={`translate(${x},${y}) scale(${scale * facing},${scale}) translate(-150,-500)`}>
      <g transform="translate(150,500)">
        {/* ground contact shadow */}
        <ellipse cx={0} cy={2} rx={92} ry={16} fill={INK} opacity={0.28} />
        {/* legs */}
        <rect x={-40} y={-160} width={34} height={150} rx={16} fill={c.pants} stroke={INK} strokeWidth={6} />
        <rect x={8} y={-160} width={34} height={150} rx={16} fill={c.pants} stroke={INK} strokeWidth={6} />
        {/* boots */}
        <path d="M-44,-14 h44 v10 a6,6 0 0 1 -6,6 h-50 a8,8 0 0 1 -8,-8 q0,-8 20,-8 Z" fill="#5b4632" stroke={INK} strokeWidth={5} />
        <path d="M4,-14 h44 v10 a6,6 0 0 1 -6,6 h-50 a8,8 0 0 1 -8,-8 q0,-8 20,-8 Z" fill="#5b4632" stroke={INK} strokeWidth={5} />
        {/* torso (breath) */}
        <g transform={`translate(0,${-160 + bob}) scale(1,${breath}) translate(0,160)`}>
          <g transform="translate(0,-160)">
            <path d="M-92,-150 q6,-56 92,-56 q86,0 92,56 l10,144 q2,16 -16,16 h-172 q-18,0 -16,-16 Z" fill={c.main} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
            {/* shade + highlight */}
            <path d="M34,-200 q52,10 58,50 l10,144 q2,16 -16,16 h-52 Z" fill={c.shade} opacity={0.75} />
            <path d="M-78,-178 q12,-14 34,-18 l-6,70 q-20,-4 -32,-14 Z" fill="#ffffff" opacity={0.16} />
            {outfit === 'parka' && (
              <g>
                <path d="M0,-196 L0,4" stroke={INK} strokeWidth={5} />
                <path d="M-88,-152 q88,30 176,0" fill="none" stroke={c.trim} strokeWidth={16} />
                <path d="M-88,-152 q88,30 176,0" fill="none" stroke={INK} strokeWidth={4} strokeDasharray="2 10" opacity={0.5} />
              </g>
            )}
            {outfit === 'suit' && (
              <g>
                <path d="M0,-190 L-16,-120 L0,-40 L16,-120 Z" fill={c.trim} stroke={INK} strokeWidth={4.5} />
                <path d="M-40,-192 L0,-140 L40,-192" fill="none" stroke={INK} strokeWidth={5} />
              </g>
            )}
            {outfit === 'worker' && (
              <g>
                <path d="M-84,-120 h168 v22 h-168 Z" fill="#d8d8d8" stroke={INK} strokeWidth={4.5} opacity={0.9} />
                <path d="M-84,-60 h168 v22 h-168 Z" fill="#d8d8d8" stroke={INK} strokeWidth={4.5} opacity={0.9} />
              </g>
            )}
            {outfit === 'puffer' && (
              <g>
                <path d="M0,-200 L0,4" stroke={INK} strokeWidth={5} />
                {[-120, -76, -32, 12].map((yy, i) => (
                  <path key={i} d={`M-90,${yy} q90,20 180,0`} fill="none" stroke={INK} strokeWidth={4} opacity={0.5} />
                ))}
                <path d="M-86,-150 q86,26 172,0" fill="none" stroke={c.shade} strokeWidth={14} />
              </g>
            )}
            {outfit === 'flannel' && (
              <g>
                <path d="M0,-200 L0,4" stroke={INK} strokeWidth={5} />
                {[-70, -20, 30].map((yy, i) => (
                  <path key={`h${i}`} d={`M-90,${yy} q90,16 180,0`} fill="none" stroke={c.shade} strokeWidth={6} opacity={0.6} />
                ))}
                {[-50, 0, 50].map((xx, i) => (
                  <path key={`v${i}`} d={`M${xx},-198 L${xx},2`} stroke={c.shade} strokeWidth={6} opacity={0.5} />
                ))}
                <path d="M-40,-192 L0,-150 L40,-192" fill="none" stroke={INK} strokeWidth={5} />
              </g>
            )}
            {outfit === 'vest' && (
              <g>
                <path d="M-52,-196 q52,-8 104,0 l0,200 h-104 Z" fill={c.shade} opacity={0.35} />
                <path d="M0,-198 L0,4" stroke={INK} strokeWidth={5} />
                {[-120, -70, -20, 30].map((yy, i) => (
                  <path key={i} d={`M-52,${yy} h104`} stroke={INK} strokeWidth={3.5} opacity={0.4} />
                ))}
                <path d="M-86,-150 q86,26 172,0" fill="none" stroke="#e8e0d0" strokeWidth={12} />
              </g>
            )}
            {/* arms attach at shoulder height inside torso group (pose coords are authored
                around y~260-360; shift them up to chest height in torso space) */}
            <g transform="translate(0,-360)">{arms()}</g>
          </g>
        </g>
        {/* head — everyday Alaskan headgear (never the Native-coded fur ruff) */}
        <g transform={`translate(0,${-368 + bob * 1.4})`}>
          {(() => {
            const hg = outfit === 'parka' ? 'trapper' : headgear;
            const beanieCol = c.main;
            const capCol = c.shade;
            return (
              <g>
                {/* hood (plain, behind head) */}
                {hg === 'hood' && (
                  <path d="M-78,20 a78,86 0 0 1 156,0 q0,-96 -78,-96 q-78,0 -78,96 Z" fill={c.shade} stroke={INK} strokeWidth={6} />
                )}
                {/* skin */}
                <circle r={56} fill={skin} stroke={INK} strokeWidth={6} />
                <path d="M14,-54 a56,56 0 0 1 42,54 l-14,0 a42,42 0 0 0 -34,-42 Z" fill={skinShade} opacity={0.6} />
                {/* hair (visible under bare/cap/hood) */}
                {(hg === 'bare' || hg === 'cap' || hg === 'hood') && (
                  <path d="M-56,-4 a56,56 0 0 1 112,0 q-18,-36 -56,-36 q-38,0 -56,36 Z" fill={hair} stroke={INK} strokeWidth={5} />
                )}
                {/* beanie: knit cap + fold band + pom */}
                {hg === 'beanie' && (
                  <g>
                    <path d="M-58,-10 a58,58 0 0 1 116,0 q0,-64 -58,-64 q-58,0 -58,64 Z" fill={beanieCol} stroke={INK} strokeWidth={6} />
                    <rect x={-60} y={-16} width={120} height={22} rx={11} fill={c.shade} stroke={INK} strokeWidth={5} />
                    <circle cx={0} cy={-74} r={12} fill={c.trim} stroke={INK} strokeWidth={5} />
                    {[0,1,2].map((i)=>(<path key={i} d={`M${-40+i*40},-52 q0,-30 8,-40`} stroke={INK} strokeWidth={2.5} fill="none" opacity={0.3} />))}
                  </g>
                )}
                {/* trapper hat: crown + fur band + ear flaps (a HAT, generic winter) */}
                {hg === 'trapper' && (
                  <g>
                    <path d="M-58,-8 a58,58 0 0 1 116,0 q0,-60 -58,-60 q-58,0 -58,60 Z" fill={c.main} stroke={INK} strokeWidth={6} />
                    <rect x={-62} y={-18} width={124} height={26} rx={12} fill="#c9bfa8" stroke={INK} strokeWidth={5} />
                    <path d="M-58,2 q-12,44 6,66 q16,-6 16,-30 l-4,-40 Z" fill={c.main} stroke={INK} strokeWidth={5} />
                    <path d="M58,2 q12,44 -6,66 q-16,-6 -16,-30 l4,-40 Z" fill={c.shade} stroke={INK} strokeWidth={5} />
                  </g>
                )}
                {/* cap: ball cap with brim (brim points by facing) */}
                {hg === 'cap' && (
                  <g>
                    <path d="M-56,-16 a56,44 0 0 1 112,0 l-6,8 h-100 Z" fill={capCol} stroke={INK} strokeWidth={6} />
                    <rect x={-64} y={-16} width={128} height={14} rx={7} fill={capCol} stroke={INK} strokeWidth={5} />
                    <path d="M40,-14 q52,0 60,16 l-2,8 q-40,-12 -58,-8 Z" fill={c.main} stroke={INK} strokeWidth={5} />
                    <circle cx={0} cy={-54} r={6} fill={c.main} stroke={INK} strokeWidth={3} />
                  </g>
                )}
                {/* worker hardhat retained */}
                {outfit === 'worker' && hg === 'bare' && (
                  <g>
                    <path d="M-60,-22 a60,42 0 0 1 120,0 l-8,6 h-104 Z" fill="#f2c230" stroke={INK} strokeWidth={6} />
                    <rect x={-70} y={-20} width={140} height={14} rx={7} fill="#f2c230" stroke={INK} strokeWidth={5} />
                  </g>
                )}
                {face()}
              </g>
            );
          })()}
        </g>
      </g>
    </g>
  );
};
