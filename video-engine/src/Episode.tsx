import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {z} from 'zod';
import {VoiceProvider, useVoice} from './lib/voice';
import {Raven} from './lib/fauna';
import {SpeedLines, ImpactStar, ZoomVignette} from './lib/FX';
import {BoxLabel, Stamp, ServerMachine} from './lib/kit';
import {StatCard, Nameplate, SwingSign, PenAndDocument, MeasuringChain, GearLever, TallyCounter} from './lib/props';
import {MainStreetBG} from './lib/biomes';
import {tones, FormGradient, RimLight, ContactShadow, GradeLayer, MotionBlur} from './lib/lighting';
import {entrance, ChipShadow} from './lib/motion';
import {Character} from './lib/Character';

const BOLD = 'Arial Black, Arial, sans-serif';

// ---- 2026-07-21 palette ("The Pen That Won't Land", art_direction-locked) ----
// cool slate-indigo dusk sky + honeyed window-glow key + copper ServerMachine hero +
// a red DRAFT / green PAID ink-stamp accent pair + ink-charcoal shadow.
const SKY = '#454e63';
const GLOW = '#d99a4e';
const DRAFT = '#c0392b';
const PAID = '#3f7d4f';
const INKC = '#1b2130';
const OAK = '#8b5e3c';
const OAK_D = '#5f3f26';
const PAPER = '#f4efe0';

export const episodeSchema = z.object({
  captions: z.array(z.object({text: z.string(), start: z.number(), end: z.number(), seg: z.number()})),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(),
    energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
});
export type EpisodeProps = z.infer<typeof episodeSchema>;

// =============================================================== shared set pieces

// A warm oak-toned classroom interior, MainStreetBG glimpsed through the window
// behind (the "living classroom" pole of the shape-language contrast: rounded
// desks, wood grain, flannel — everything ServerMachine is not).
const Classroom: React.FC<{f: number; dusk?: number}> = ({f, dusk = 1}) => {
  const tOak = tones(OAK);
  return (
    <g>
      <rect width={1080} height={1920} fill={INKC} />
      {/* the window onto Main Street, dusk exterior doing the real key light */}
      <g transform="translate(540,560)">
        <rect x={-420} y={-260} width={840} height={520} rx={10} fill={SKY} stroke={INKC} strokeWidth={10} />
        <g transform="scale(0.62) translate(-260,-200)">
          <MainStreetBG f={f} dusk={dusk} banner={false} />
        </g>
        <rect x={-420} y={-260} width={840} height={520} rx={10} fill="none" stroke={OAK_D} strokeWidth={24} />
        <line x1={0} y1={-260} x2={0} y2={260} stroke={OAK_D} strokeWidth={14} />
        <line x1={-420} y1={0} x2={420} y2={0} stroke={OAK_D} strokeWidth={14} />
        {/* window-glow wash into the room */}
        <rect x={-420} y={-260} width={840} height={520} fill={GLOW} opacity={0.1} />
      </g>
      {/* the classroom floor + oak desk, warm and rounded */}
      <defs><FormGradient id="oakDesk" t={tOak} softness={0.8} /></defs>
      <rect x={0} y={1120} width={1080} height={800} fill="#2c2a30" />
      <ContactShadow cx={540} cy={1200} rx={480} ry={60} opacity={0.35} />
      <rect x={90} y={1080} width={900} height={140} rx={26} fill="url(#oakDesk)" stroke={INKC} strokeWidth={10} />
      <rect x={90} y={1080} width={900} height={18} rx={9} fill="#a9754a" opacity={0.6} />
      {/* window-glow rim on the desk edge */}
      <RimLight d="M120,1082 L960,1082" w={6} opacity={0.5} color={GLOW} />
      {/* idle dust motes */}
      {Array.from({length: 8}).map((_, i) => (
        <circle key={i} cx={(i * 173 + f * 0.4) % 1080} cy={300 + (i * 211) % 700} r={2.4} fill={GLOW} opacity={0.18 + 0.1 * Math.sin(f / 30 + i)} />
      ))}
    </g>
  );
};

// The DRAFT easel: PenAndDocument on a stand, the through-line image of the whole film.
const DraftEasel: React.FC<{x: number; y: number; s?: number; f: number; op?: number; reletter?: number}> = ({x, y, s = 1, f, op = 1, reletter = 0}) => {
  const hover = 1;
  // kinetic-type scramble (craft advance): on a gust, glyphs of "DRAFT" independently
  // glitch through NON-ALPHABETIC symbols before resettling (never real letters, so the
  // scramble can never coincidentally spell a real word mid-transition), seeded per-glyph
  // and re-picked every frame (no Math.random, deterministic from f).
  const GLYPHS = 'DRAFT'.split('');
  const NEAR = '#%&@?!+*';
  const scrambled = GLYPHS.map((ch, i) => {
    const seed = (i * 37 + 11) % NEAR.length;
    const localT = Math.max(0, Math.min(1, reletter * 3 - i * 0.4));
    return localT < 1 && localT > 0 ? NEAR[(seed + f) % NEAR.length] : ch;
  }).join('');
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={op}>
      {/* easel legs */}
      <line x1={-150} y1={200} x2={-40} y2={-40} stroke={OAK_D} strokeWidth={14} strokeLinecap="round" />
      <line x1={150} y1={200} x2={40} y2={-40} stroke={OAK_D} strokeWidth={14} strokeLinecap="round" />
      <line x1={-90} y1={200} x2={90} y2={200} stroke={OAK_D} strokeWidth={12} strokeLinecap="round" />
      <ContactShadow cx={0} cy={210} rx={140} ry={20} opacity={0.3} />
      <PenAndDocument x={0} y={-40} hover={hover} f={f} />
      <g transform="translate(0,-40)">
        <Stamp cx={0} cy={60} s={0.42} text={reletter > 0.05 ? scrambled : 'DRAFT'} rot={-6} color={DRAFT} onPaper={false} />
      </g>
    </g>
  );
};

// =============================================================== S1: cold open
// Beat 1-2 / Shot A. Frame-1 hook: the tool already working beside the unsigned rule.
const S1: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const voice = useVoice();
  const gf = from + f;
  const push = interpolate(f, [0, 200], [1.0, 1.06], {extrapolateRight: 'clamp', easing: Easing.out(Easing.ease)});
  const headlineOp = interpolate(f, [0, 150, 175], [1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const easelIn = entrance(f, 30, 4, {drop: 0});
  const tremblePulse = 0.6 + 0.4 * Math.sin(f / 3);
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={`translate(540,960) scale(${push}) translate(-540,-960)`}>
          <Classroom f={f} dusk={1} />
          {/* the teacher + copper ServerMachine, working side by side */}
          <g transform="translate(340,1030)">
            <Character frame={f} x={0} y={0} scale={0.92} facing={1} outfit="flannel" emotion="neutral" pose="stand" talking={voice.opennessAt(gf) * 0.6} />
          </g>
          <g transform="translate(700,1000)">
            <ServerMachine frame={f} x={0} y={0} scale={0.62} facing={-1} tint="copper" emotion="focused" talking={voice.opennessAt(gf)} />
          </g>
          {/* a small stack of papers between them (idle life: top sheet drifts) */}
          <g transform="translate(520,1140)">
            {[0, 1, 2].map((i) => (
              <rect key={i} x={-46} y={-10 - i * 6} width={92} height={64} rx={4} fill={PAPER} stroke={INKC} strokeWidth={3}
                transform={`rotate(${(i - 1) * 4 + Math.sin(f / 20 + i) * 1.2})`} />
            ))}
          </g>
          {/* the DRAFT easel, background, the story's other half */}
          <g opacity={easelIn.on ? 1 : 0} transform={`translate(0,${easelIn.dy})`}>
            <DraftEasel x={880} y={760} s={0.62} f={f} op={0.92} />
          </g>
        </g>
      </svg>
      {/* the frame-1 headline: bold ink present at frame 0 */}
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', opacity: headlineOp}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 68, color: '#fff', background: 'rgba(27,33,48,0.86)', padding: '14px 36px', borderRadius: 14, border: `6px solid ${GLOW}`, textShadow: '3px 4px 0 rgba(0,0,0,0.55)', letterSpacing: 0.5}}>
          THE PEN THAT WON'T SIGN
        </span>
      </div>
      {gf > 0 && voice.accentAt(gf) > 0.5 && <ZoomVignette amount={0.1 * voice.accentAt(gf)} />}
    </AbsoluteFill>
  );
};

// =============================================================== S2: the tools at work
// Beat 3 / Shot B. Push-detail on the worksheet: MagicSchool + Gemini helping.
const S2: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const voice = useVoice();
  const gf = from + f;
  const noteIn = interpolate(f, [10, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={OAK_D} opacity={0.9} />
        {/* the worksheet, large, filling the insert */}
        <g transform="translate(540,860)">
          <ContactShadow cx={0} cy={330} rx={360} ry={40} opacity={0.35} />
          <rect x={-320} y={-380} width={640} height={720} rx={14} fill={PAPER} stroke={INKC} strokeWidth={8} />
          {Array.from({length: 12}).map((_, i) => (
            <line key={i} x1={-260} y1={-320 + i * 52} x2={260} y2={-320 + i * 52} stroke="#d8cfb2" strokeWidth={3} />
          ))}
          {/* AI margin-note glyphs typing in along the edge */}
          {[0, 1, 2, 3].map((i) => (
            <g key={i} opacity={interpolate(f, [10 + i * 8, 26 + i * 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
              <circle cx={300} cy={-300 + i * 90} r={10} fill={PAID} opacity={0.85} />
              <line x1={276} y1={-300 + i * 90} x2={230} y2={-300 + i * 90} stroke={PAID} strokeWidth={4} opacity={0.6} />
            </g>
          ))}
        </g>
        {/* MagicSchool (copper hero) leaning in from the left */}
        <g transform="translate(150,1350) scale(0.5)">
          <ServerMachine frame={f} x={0} y={0} facing={1} tint="copper" emotion="focused" talking={voice.opennessAt(gf)} />
        </g>
        {/* the second AI unit (Gemini): same rig re-instanced, copper, smaller,
            secondary staging so it reads as a second instance, never steel/greedy */}
        <g transform="translate(940,1400) scale(0.34)">
          <ServerMachine frame={f + 14} x={0} y={0} facing={-1} tint="copper" emotion="focused" />
        </g>
        <BoxLabel x={540} y={1660} text="MagicSchool · Google Gemini" fs={30} w={520} h={64} fill={PAPER} color={INKC} />
      </svg>
      {gf > 0 && voice.accentAt(gf) > 0.5 && <ZoomVignette amount={0.08 * voice.accentAt(gf)} />}
    </AbsoluteFill>
  );
};

// =============================================================== S3: the ledger
// Beat 4-5 / Shot C. $8,300 + receipt unspool + the paired PAID/DRAFT stamps.
const S3: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cardIn = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 170}});
  const tapeLen = interpolate(f, [8, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const STAMP_AT = 78;
  const paidS = spring({frame: f - STAMP_AT, fps, config: {damping: 9, stiffness: 220}});
  const draftS = spring({frame: f - (STAMP_AT + 4), fps, config: {damping: 9, stiffness: 220}});
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={INKC} />
        <g transform={`translate(540,700) scale(${cardIn})`}>
          <StatCard x={0} y={0} big="$8,300" sub="3-YEAR MAGICSCHOOL SUBSCRIPTION" formShaded color={DRAFT} />
        </g>
        {/* the receipt tape unspooling and pooling on the floor (craft-advance param) */}
        <g transform="translate(540,780)">
          <path
            d={`M0,0 C${40 * tapeLen},${140 * tapeLen} ${-30 * tapeLen},${260 * tapeLen} ${20 * tapeLen},${360 * tapeLen} S${-40 * tapeLen},${520 * tapeLen} ${10 * tapeLen},${620 * tapeLen}`}
            fill="none" stroke={PAPER} strokeWidth={64} strokeLinecap="round" opacity={tapeLen > 0.02 ? 0.95 : 0} />
          {tapeLen > 0.85 && <ellipse cx={10} cy={640} rx={90} ry={26} fill={PAPER} opacity={0.9} stroke={INKC} strokeWidth={4} />}
        </g>
        {/* the paired stamps: PAID lands on the receipt, DRAFT lands on the easel, same beat */}
        <g transform="translate(300,1320)">
          <Stamp cx={0} cy={0} s={paidS} text="PAID" rot={-6} color={PAID} onPaper />
        </g>
        <g transform="translate(760,1360)">
          <Stamp cx={0} cy={0} s={draftS} text="DRAFT" rot={7} color={DRAFT} onPaper />
        </g>
        {/* impact bursts offset to a CORNER of each stamp so the PAID/DRAFT text (the
            accessibility-load-bearing signal) is never occluded */}
        {paidS > 0.9 && <ImpactStar cx={300 + 240} cy={1320 - 60} r={34} color={PAID} />}
        {draftS > 0.9 && <ImpactStar cx={760 + 240} cy={1360 - 60} r={34} color={DRAFT} />}
      </svg>
    </AbsoluteFill>
  );
};

// =============================================================== S4: the timeline gap
// Beat 6-7 / Shot D. MainStreetBG establishing, the '2025' sign, the MeasuringChain.
const S4: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const craneY = interpolate(f, [0, 210], [40, -20], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)});
  const dolly = interpolate(f, [0, 210], [1.08, 1.0], {extrapolateRight: 'clamp'});
  const taut = interpolate(f, [70, 190], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={`translate(540,${960 + craneY}) scale(${dolly}) translate(-540,-960)`}>
          <MainStreetBG f={f} dusk={1} banner={false} />
          <g transform="translate(360,1080) scale(1.15)">
            <SwingSign x={0} y={0} f={f} lines={['2025']} />
          </g>
          <g transform="translate(340,1440)">
            <Character frame={f} x={0} y={0} scale={0.8} facing={1} outfit="vest" emotion="neutral" pose="stand" />
          </g>
          <MeasuringChain x1={400} y1={1140} x2={760} y2={1500} taut={taut} label="?" />
          <g transform="translate(780,1540) scale(0.42)" opacity={taut}>
            <DraftEasel x={0} y={0} f={f} />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// =============================================================== S5: the fork
// Beat 8-10 / Shot E. Wide two-shot on the GearLever bank, push to Dendurent, snap-zoom
// on her verbatim caption, then VanBuskirk strides in and plants on CONCRETE.
const S5: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const gf = from + f;
  const PUSH_AT = 74; // ~2.5s scene-time: push to Dendurent
  const SNAP_AT = 96; // the verbatim-quote snap-zoom
  const push = interpolate(f, [PUSH_AT, PUSH_AT + 40], [1.0, 1.32], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const snap = spring({frame: f - SNAP_AT, fps, config: {damping: 10, stiffness: 140}});
  const snapScale = 1 + Math.min(0.55, snap * 0.55);
  const pulled = interpolate(f, [PUSH_AT + 6, PUSH_AT + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pulledPrev = interpolate(f - 1, [PUSH_AT + 6, PUSH_AT + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const capOp = interpolate(f, [SNAP_AT, SNAP_AT + 12, PUSH_AT + 170, PUSH_AT + 185], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // VanBuskirk strides in from beat 10 onward (the later ~third of the shot). This scene
  // (shot E) runs 210 local frames — the stride window must land INSIDE that, with a beat
  // to spare for the arrived pose + nameplate to actually read, or the stride silently never
  // finishes (a 2026-07-21 round-3 panel catch: at [190,240] against a 210-frame scene, she
  // only ever covered 38% of the walk and never reached the 'point' pose or her nameplate).
  const vbStride = interpolate(f, [130, 195], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const vbStridePrev = interpolate(f - 1, [130, 195], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const vbVx = (vbStride - vbStridePrev) * -240; // px/frame of the stride, for directional blur
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={SKY} opacity={0.5} />
        <rect x={0} y={1200} width={1080} height={720} fill={OAK_D} />
        <ContactShadow cx={540} cy={1240} rx={480} ry={50} opacity={0.3} />
        <g transform={`translate(540,${1050 - (push - 1) * 200}) scale(${push * snapScale}) translate(-540,-1050)`}>
          {/* the GearLever bank, centered */}
          <g transform="translate(300,1150)">
            <MotionBlur vx={(pulled - pulledPrev) * 260} vy={(pulled - pulledPrev) * 260} gain={1}>
              <GearLever x={0} y={0} pulled={pulled} />
            </MotionBlur>
          </g>
          <g transform="translate(780,1150)">
            <GearLever x={0} y={0} pulled={vbStride > 0.7 ? 1 : 0} />
          </g>
          {/* Dendurent at the ADAPTABLE lever */}
          <g transform="translate(300,980)">
            <Character frame={f} x={0} y={0} scale={0.85} facing={1} outfit="suit" emotion="neutral" pose="stand" talking={voice.opennessAt(gf) * 0.5} />
          </g>
          {/* VanBuskirk striding to the CONCRETE lever */}
          <g transform={`translate(${1020 - vbStride * 240},980)`}>
            <MotionBlur vx={vbVx} gain={0.6}>
              <Character frame={f} x={0} y={0} scale={0.85} facing={-1} outfit="vest" emotion="neutral" pose={vbStride > 0.5 ? 'point' : 'stand'} />
            </MotionBlur>
          </g>
        </g>
        {snap > 0.9 && snap < 1.4 && <SpeedLines cx={540} cy={960} frame={f} intensity={0.7} />}
        {/* nameplates live OUTSIDE the push/snap-zoom camera group as fixed screen-space HUD
            labels so the snap-zoom (push*snapScale can reach ~2x) never crops or pans their
            text off-frame. Never show both at once: Dendurent's only in the wide shot before
            the snap-zoom takes hold, a hard gap during the stride, VanBuskirk's only once she
            has arrived (storyboard specifies a hard-cut fork, not a cross-fade -- this plus the
            fixed screen position guarantees no collision AND no crop). VanBuskirk's sits lower
            than Dendurent's (y=880 not 780): by the time she arrives, Dendurent's verbatim quote
            card (top:520, ~230px tall) is still up, and the two used to overlap right where her
            plate rendered. */}
        {vbStride < 0.15 && f < SNAP_AT + 4 && <Nameplate x={300} y={780} text="DENDURENT" sub="ADAPTABLE" />}
        {vbStride > 0.6 && <Nameplate x={780} y={880} text="VANBUSKIRK" sub="CONCRETE" subColor={PAID} />}
      </svg>
      {/* Dendurent's verbatim caption overlay */}
      <div style={{position: 'absolute', top: 520, left: 60, right: 60, textAlign: 'center', opacity: capOp}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 40, lineHeight: 1.25, color: '#fff', background: 'rgba(27,33,48,0.9)', padding: '20px 26px', borderRadius: 14, border: `5px solid ${GLOW}`}}>
          "If you are putting such strict parameters, it may really limit where we're going to be continuously changing the language."
          <div style={{fontSize: 24, marginTop: 10, opacity: 0.85, fontWeight: 700}}>Kari Dendurent, KPBSD Assistant Superintendent</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================== S6: the payoff
// Beat 11 / Shot F. VanBuskirk pulls CONCRETE, teeth bite.
const S6: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const voice = useVoice();
  const gf = from + f;
  const pulled = spring({frame: f - 6, fps, config: {damping: 8, stiffness: 200}});
  const pulledPrev = spring({frame: f - 7, fps, config: {damping: 8, stiffness: 200}});
  const clunkAt = 14;
  return (
    <AbsoluteFill style={{backgroundColor: OAK_D}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={OAK_D} />
        <g transform="translate(540,1000)">
          <ContactShadow cx={0} cy={280} rx={340} ry={40} opacity={0.32} />
          <g transform="scale(1.5)">
            <MotionBlur vx={(pulled - pulledPrev) * 300} vy={(pulled - pulledPrev) * 300} gain={1}>
              <GearLever x={0} y={0} pulled={Math.min(1, pulled)} />
            </MotionBlur>
          </g>
          <g transform="translate(-20,-260)">
            <Character frame={f} x={0} y={0} scale={1.05} facing={1} outfit="vest" emotion="neutral" pose="point" talking={voice.opennessAt(gf) * 0.5} />
          </g>
        </g>
        {f > clunkAt && f < clunkAt + 10 && <ImpactStar cx={540} cy={1000} r={70} color={PAID} />}
      </svg>
      <div style={{position: 'absolute', bottom: 640, left: 0, right: 0, textAlign: 'center'}}>
        <span style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, color: PAID, background: 'rgba(27,33,48,0.85)', padding: '10px 30px', borderRadius: 12, border: `4px solid ${PAID}`}}>CONCRETE</span>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================== S7: the impasse
// Beat 12 / Shot G. Both stand together, TallyCounter jams at 0.
const S7: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const voice = useVoice();
  const gf = from + f;
  const jamShake = f > 20 && f < 30 ? Math.sin(f * 3) * 4 : 0;
  // the dial visibly TRIES to roll (0 -> 0.7) then jams and snaps back to 0, twice, so the
  // failure reads as motion, not a held frame.
  const attempt = (t: number) => {
    const local = t % 40;
    return local < 18 ? interpolate(local, [0, 18], [0, 0.7], {easing: Easing.out(Easing.cubic)}) : 0;
  };
  const roll = f < 80 ? attempt(f) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={SKY} opacity={0.4} />
        <rect x={0} y={1200} width={1080} height={720} fill={OAK_D} />
        <ContactShadow cx={540} cy={1240} rx={420} ry={44} opacity={0.3} />
        <g transform="translate(420,1000)">
          <Character frame={f} x={0} y={0} scale={0.8} facing={1} outfit="suit" emotion="worried" pose="stand" talking={voice.opennessAt(gf) * 0.4} />
        </g>
        <g transform="translate(660,1000)">
          <Character frame={f} x={0} y={0} scale={0.8} facing={-1} outfit="vest" emotion="worried" pose="stand" />
        </g>
        <g transform={`translate(${540 + jamShake},1250)`}>
          <ChipShadow><TallyCounter x={0} y={0} s={1.1} f={f} variant="odometer" count="0000" roll={roll} tag="RULES IN FORCE" /></ChipShadow>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// =============================================================== S8: THE TURN
// Beat 13-14 / Shot H. Boom-drop to floor level: the continuous paper stream, the
// half-built PRIVACY gate. The signature shot.
const S8: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  // the boom-drop: a real, sustained crane-down + dolly-through, not a snap. Starts pulled
  // back and high (as if still at table height looking down) and settles into the floor-level
  // framing over ~1.7s, easing out so it reads as a deliberate camera move, not a cut.
  const boomT = interpolate(f, [0, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const camScale = interpolate(boomT, [0, 1], [0.78, 1.0]);
  const camY = interpolate(boomT, [0, 1], [-220, 0]);
  const N = 7;
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <rect width={1080} height={1920} fill={INKC} />
        <g transform={`translate(540,${960 + camY}) scale(${camScale}) translate(-540,-960)`}>
          {/* the underside of the argument: table legs + feet at the very top edge, receding */}
          <g opacity={interpolate(boomT, [0.3, 1], [0, 0.7], {extrapolateLeft: 'clamp'})}>
            <rect x={220} y={0} width={36} height={260} fill="#0f1420" />
            <rect x={824} y={0} width={36} height={260} fill="#0f1420" />
            <rect x={250} y={200} width={100} height={90} rx={10} fill="#2c2a30" />
            <rect x={730} y={200} width={100} height={90} rx={10} fill="#2c2a30" />
          </g>
          {/* the floor plane fills most of the frame: a true floor-level vantage */}
          <rect x={0} y={260} width={1080} height={1660} fill={OAK_D} />
          <RimLight d="M0,264 L1080,264" w={6} opacity={0.35} color={GLOW} />
          {/* floor plank seams receding toward the machine (depth cue) */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={90 + i * 220} y1={260} x2={540 + (i - 2) * 60} y2={1920} stroke="#4a3722" strokeWidth={3} opacity={0.35} />
          ))}
          <ContactShadow cx={540} cy={1720} rx={420} ry={70} opacity={0.32} />
          {/* the continuous paper-airplane stream, floor level, traveling into the intake */}
          {Array.from({length: N}).map((_, i) => {
            const speed = 5.6 + (i % 3) * 0.7;
            const x = ((f * speed + i * 150) % 1300) - 80;
            const lane = 520 + (i % 4) * 220;
            const y = lane + 22 * Math.sin(f / 9 + i * 2);
            const s = 0.7 + (lane - 520) / 900;
            return (
              <MotionBlur key={i} vx={speed} gain={0.7}>
                <g transform={`translate(${x},${y}) scale(${s}) rotate(${-6 + 4 * Math.sin(f / 7 + i)})`}>
                  <path d="M-40,0 L40,-12 L12,0 L40,12 Z" fill={PAPER} stroke={INKC} strokeWidth={3} />
                  {i % 2 === 0 && <line x1={-16} y1={-3} x2={16} y2={-3} stroke={DRAFT} strokeWidth={3} opacity={0.7} />}
                </g>
              </MotionBlur>
            );
          })}
          {/* the copper machine's intake, receiving the stream, large and centered-right */}
          <g transform="translate(830,1360) scale(1.05)">
            <ContactShadow cx={0} cy={470} rx={200} ry={36} opacity={0.35} />
            <ServerMachine frame={f} x={0} y={0} facing={-1} tint="copper" emotion="focused" />
          </g>
          {/* the shrink-wrapped PRIVACY gate, half-built, beside the intake */}
          <g transform="translate(230,1420) scale(1.3)">
            <g opacity={0.85}>
              <GearLever x={0} y={0} pulled={0} />
            </g>
            <rect x={-90} y={-40} width={180} height={90} fill="#fff" opacity={0.24} stroke="#fff" strokeWidth={2} strokeDasharray="6 5" />
            <BoxLabel x={0} y={-78} text="PRIVACY" fs={26} w={200} h={54} fill={PAPER} color={DRAFT} />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// =============================================================== S9: the button
// Beat 15-16 / Shot I. The Raven comments; the loop closes on the cold-open frame.
const S9: React.FC<{from?: number}> = ({from = 0}) => {
  const f = useCurrentFrame();
  const voice = useVoice();
  const gf = from + f;
  const RETURN_AT = 90;
  // the DRAFT-scramble gust lives in the SILENT TAIL after the last word (speech ends at
  // local f~183 for this run's VO length), never during the climactic final line -- a round-2
  // panel hard blocker was the scramble garbling DRAFT right as "will control the classroom,
  // or describe it" lands. Parked here it reads as a last flourish over the hang-time instead.
  const gustAt = 200;
  const dipOp = interpolate(f, [RETURN_AT + 55, RETURN_AT + 70], [1, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ravenY = interpolate(f, [0, 22], [-180, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute'}} opacity={dipOp}>
        <g>
          {/* the classroom, present the whole scene: the loop closes on this exact frame */}
          <Classroom f={f} dusk={1} />
          <g transform="translate(340,1030)">
            <Character frame={f} x={0} y={0} scale={0.92} facing={1} outfit="flannel" emotion="neutral" pose="stand" talking={voice.opennessAt(gf) * 0.3} />
          </g>
          <g transform="translate(700,1000)">
            <ServerMachine frame={f} x={0} y={0} scale={0.62} facing={-1} tint="copper" emotion="focused" talking={voice.opennessAt(gf) * 0.3} />
          </g>
          <g transform="translate(880,760) scale(0.78)">
            <DraftEasel x={0} y={0} f={f} op={1} reletter={f > gustAt && f < gustAt + 18 ? (f - gustAt) / 18 : 0} />
            <g transform={`translate(-70,${-140 + ravenY})`}>
              <Raven x={0} y={0} scale={1.1} f={f} mode="perch" />
            </g>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const SCENE_COMPONENTS: React.FC<{from?: number}>[] = [S1, S2, S3, S4, S5, S6, S7, S8, S9];
const DEFAULT_BOUNDS: {from: number; dur: number}[] = [
  {from: 0, dur: 195}, {from: 195, dur: 123}, {from: 318, dur: 192},
  {from: 510, dur: 210}, {from: 720, dur: 309}, {from: 1029, dur: 102},
  {from: 1131, dur: 84}, {from: 1215, dur: 216}, {from: 1431, dur: 219},
];

const GradedGrade: React.FC = () => {
  const f = useCurrentFrame();
  return <GradeLayer f={f} bloom={0.4} vignette={0.44} grain={0.06} warmth={0.05} />;
};

// Persistent corner chrome (LIVING_SCREEN: two spatially isolated motion regions):
// left, a small perched raven idle; right, a slow-rolling tally chip (rules-in-force
// motif carried in miniature through the whole runtime).
const CornerChrome: React.FC = () => {
  const f = useCurrentFrame();
  const roll = (f % 90) < 12 ? ((f % 90) / 12) : 0;
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', pointerEvents: 'none'}}>
      <g transform={`translate(78,90) scale(0.4)`} opacity={0.8}>
        <Raven x={0} y={0} scale={1} f={f} mode="perch" />
      </g>
      <g transform="translate(984,96)" opacity={0.88}>
        <TallyCounter x={0} y={0} s={0.46} f={f} variant="odometer" count="0000" roll={roll} />
      </g>
    </svg>
  );
};

const Captions: React.FC<{captions: EpisodeProps['captions']}> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const cue = captions.find((c) => t >= c.start && t < c.end + 0.05);
  if (!cue) return null;
  return (
    <div style={{position: 'absolute', bottom: 340, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0 60px'}}>
      <div style={{background: 'rgba(27,33,48,0.84)', borderRadius: 14, padding: '16px 30px', maxWidth: 940, border: `4px solid ${GLOW}`}}>
        <div style={{fontFamily: BOLD, fontWeight: 900, fontSize: 46, lineHeight: 1.12, color: '#fff', textAlign: 'center', letterSpacing: 0.5, textShadow: `2px 3px 0 rgba(0,0,0,0.6)`}}>
          {cue.text}
        </div>
      </div>
    </div>
  );
};

export const Episode: React.FC<EpisodeProps> = ({captions, scenes, mouth, accents}) => {
  const bounds = scenes && scenes.length === SCENE_COMPONENTS.length ? scenes : DEFAULT_BOUNDS;
  const voice = mouth && mouth.length ? {fps: 30, mouth, accents: accents ?? []} : null;
  return (
    <AbsoluteFill style={{backgroundColor: INKC}}>
      <VoiceProvider data={voice}>
        {SCENE_COMPONENTS.map((C, i) => (
          <Sequence key={i} from={bounds[i].from} durationInFrames={bounds[i].dur} name={`S${i + 1}`}>
            <C from={bounds[i].from} />
          </Sequence>
        ))}
        <GradedGrade />
        <CornerChrome />
        <Captions captions={captions} />
      </VoiceProvider>
    </AbsoluteFill>
  );
};
