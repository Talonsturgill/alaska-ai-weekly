import React from 'react';
import {tones, ContactShadow} from './lighting';

// THE NEWSROOM FAMILY (net-new 2026-10-03, "The Choosing Isn't").
//
// The shelf had AI bodies that watch (SatelliteEye), fly (Petrel, Vale), classify (NameEngine)
// and compute (ServerMachine, a box with a face). Nothing on it WRITES. An LLM news agent
// ingests documents and emits prose, so its body is a writing machine: NewsAgent. And the
// story's argument is that writing got cheap while choosing did not, so its counterweight is
// one hard square box at the top of a front page: LeadSlot.
//
// Shape language is the thesis (art_direction.json): NewsAgent is ROUND (a domed body, a
// platen cylinder overhanging both sides, knob cheeks, a funnel hopper) and the reams it
// prints are SOFT (bowed edges, curls). Only LeadSlot has hard 90-degree corners and a thick
// square frame. Every surface is ink-outlined and three-tone shaded (tones()), and anything
// that stands on the ground casts a ContactShadow.

export const NEWS = {
  cream: '#F2EAD8', paper: '#F7F1E3', newsprint: '#CFC6B2', ink: '#16130F', spruce: '#2F5D50',
  spruceDk: '#1F4238', sky: '#A9CFE6', amber: '#F7A21B', kraft: '#C79F63', oxblood: '#7A2A1E',
  rubber: '#2A2A26', screen: '#16302A', glyph: '#E9F5DC',
};
const INK = NEWS.ink;
const MONO = "'JetBrains Mono', monospace";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const hash = (i: number) => Math.imul(i + 977, 2654435761) >>> 0;

export type AgentEmotion = 'happy' | 'focused' | 'sheepish' | 'earnest' | 'thoughtful' | 'helpless';

/** Mono width of a string by arithmetic (0.602em advance), the rule for every plate. */
export const monoW = (text: string, size: number, ls = 1.5) =>
  text.length * size * 0.602 + ls * Math.max(0, text.length - 1);

/**
 * NewsAgent: Walter, the typewriter-press with a screen face. Origin is the CENTRE OF ITS BASE
 * on the ground (y = 0); the body rises to about y = -500 at scale 1, and the platen overhangs to
 * about x = +-285. It has NO ARMS on purpose: it can't call, attend or interview (claim c12).
 *
 *   blink      0..1 eyelid close (drive it from the frame, phase-offset per shot)
 *   look       -1..1 horizontal eye direction, lookY -1..1 vertical
 *   carriage   0..1 carriage slam: the platen jolts left then returns (drive with a decay)
 *   roll       platen knob angle in degrees (keep it turning while it works)
 *   gulp       0..1 funnel bulge as plates drop in
 *   tongue     0..1 how far the printed sheet hangs out of the mouth slot
 *   screenText optional lines that replace the face (typed by `typed` 0..1)
 */
export const NewsAgent: React.FC<{
  x: number; y: number; scale?: number; f: number; emotion?: AgentEmotion;
  blink?: number; look?: number; lookY?: number; carriage?: number; roll?: number; gulp?: number;
  tongue?: number; screenText?: string[]; typed?: number; shadow?: boolean; nameplate?: string;
}> = ({x, y, scale = 1, f, emotion = 'happy', blink = 0, look = 0, lookY = 0, carriage = 0, roll, gulp = 0,
  tongue = 0.6, screenText, typed = 1, shadow = true, nameplate}) => {
  const body = tones(NEWS.spruce);
  const dark = tones(NEWS.spruceDk);
  const crm = tones(NEWS.cream);
  const id = `na${Math.round(x)}_${Math.round(y)}`;
  const breathe = Math.sin(f / 19) * 3;
  const rollDeg = roll ?? f * 6;
  const slam = carriage > 0 ? -26 * Math.sin(Math.min(1, carriage) * Math.PI) : 0;
  const tongueLen = 40 + 150 * clamp01(tongue);
  const flutter = Math.sin(f / 7) * 5;
  // eyes on the screen, drawn as glyph shapes so the face reads at thumbnail size
  const ex = look * 18, ey = lookY * 10;
  const lid = clamp01(blink);
  const eye = (cx: number) => {
    const w = 34, h = 40 * (1 - lid * 0.92);
    switch (emotion) {
      case 'happy':
        return <path d={`M${cx - 26},${-218 + ey} Q${cx},${-250 + ey + lid * 26} ${cx + 26},${-218 + ey}`} fill="none" stroke={NEWS.glyph} strokeWidth={11} strokeLinecap="round" />;
      case 'focused':
        return <rect x={cx - w / 2 - 4} y={-226 + ey - 8 * (1 - lid)} width={w + 8} height={Math.max(4, 16 * (1 - lid))} rx={5} fill={NEWS.glyph} />;
      case 'sheepish':
        return <g>
          <rect x={cx - w / 2} y={-212 + 10} width={w} height={Math.max(4, h * 0.45)} rx={8} fill={NEWS.glyph} />
          <ellipse cx={cx + (cx < 0 ? -10 : 10)} cy={-178} rx={20} ry={8} fill="#E88A7A" opacity={0.7} />
        </g>;
      case 'helpless':
        return <g>
          <rect x={cx - w / 2} y={-236 + ey} width={w} height={Math.max(4, h)} rx={12} fill={NEWS.glyph} />
          <path d={`M${cx - 24},${-252} L${cx + 20},${-262 + (cx < 0 ? 12 : 0)}`} stroke={NEWS.glyph} strokeWidth={7} strokeLinecap="round" transform={cx < 0 ? '' : `scale(-1,1) translate(${-2 * cx},0)`} />
        </g>;
      case 'thoughtful':
        return <rect x={cx - w / 2} y={-232 + ey} width={w} height={Math.max(4, h * 0.7)} rx={10} fill={NEWS.glyph} />;
      default: // earnest
        return <circle cx={cx + ex * 0.2} cy={-214 + ey} r={Math.max(3, 19 * (1 - lid * 0.9))} fill={NEWS.glyph} />;
    }
  };
  const mouth = (() => {
    switch (emotion) {
      case 'happy': return 'M-34,-170 Q0,-146 34,-170';
      case 'sheepish': return 'M-22,-160 Q0,-168 22,-158';
      case 'helpless': return 'M-26,-156 Q0,-172 26,-156';
      case 'focused': return 'M-24,-162 L24,-162';
      case 'thoughtful': return 'M-14,-160 Q4,-154 22,-164';
      default: return 'M-28,-166 Q0,-150 28,-166';
    }
  })();
  const shown = screenText ? screenText.join('\n') : '';
  const nChars = Math.floor(shown.length * clamp01(typed));
  let left = nChars;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}b`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={body.key} /><stop offset="0.5" stopColor={body.base} /><stop offset="1" stopColor={body.shade} />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#56564E" /><stop offset="0.35" stopColor={NEWS.rubber} /><stop offset="1" stopColor="#0E0E0C" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={dark.key} /><stop offset="0.6" stopColor={dark.base} /><stop offset="1" stopColor={dark.shade} />
        </linearGradient>
        <radialGradient id={`${id}s`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#24493F" /><stop offset="1" stopColor={NEWS.screen} />
        </radialGradient>
      </defs>
      {shadow && <ContactShadow cx={0} cy={4} rx={250} ry={26} opacity={0.34} />}
      {/* plinth: a rounded trapezoid, the only near-flat line on the machine is its foot */}
      <path d="M-232,0 Q-236,-40 -206,-62 L206,-62 Q236,-40 232,0 Z" fill={dark.base} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M-200,-54 L200,-54" stroke={dark.key} strokeWidth={5} opacity={0.6} />
      {[-170, -60, 60, 170].map((rx) => <circle key={rx} cx={rx} cy={-30} r={6} fill={dark.shade} stroke={INK} strokeWidth={3} />)}
      <g transform={`translate(0,${breathe * 0.4})`}>
        {/* domed body: no straight vertical side, bowed flanks */}
        <path d="M-208,-60 C-222,-170 -196,-292 -132,-334 Q0,-372 132,-334 C196,-292 222,-170 208,-60 Z"
          fill={`url(#${id}b)`} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        {/* shade crescent on the right flank, highlight blob upper left */}
        <path d="M150,-300 C196,-250 210,-160 196,-70 L170,-70 C182,-150 176,-240 140,-292 Z" fill={body.shade} opacity={0.55} />
        <ellipse cx={-120} cy={-280} rx={46} ry={22} fill="#FFFFFF" opacity={0.18} transform="rotate(-28 -120 -280)" />
        {/* the key apron: two curved rows of round keys */}
        {[0, 1].map((row) =>
          Array.from({length: row ? 9 : 10}, (_, i) => {
            const n = row ? 9 : 10;
            const kx = -168 + (336 / (n - 1)) * i + (row ? 0 : 0);
            const ky = -96 - row * 34 + Math.pow((kx / 168), 2) * 10;
            const press = Math.max(0, Math.sin(f / 3 + i * 1.7 + row * 2)) > 0.92 ? 4 : 0;
            return <g key={`${row}${i}`}>
              <circle cx={kx} cy={ky + 5} r={13} fill={dark.shade} />
              <circle cx={kx} cy={ky + press} r={13} fill={crm.base} stroke={INK} strokeWidth={4} />
              <circle cx={kx - 4} cy={ky - 4 + press} r={4} fill="#FFFFFF" opacity={0.6} />
            </g>;
          }))}
        {/* screen bezel + face */}
        <rect x={-128} y={-306} width={256} height={176} rx={34} fill={dark.base} stroke={INK} strokeWidth={8} />
        <rect x={-110} y={-290} width={220} height={144} rx={24} fill={`url(#${id}s)`} stroke={INK} strokeWidth={4} />
        {/* scanlines */}
        {Array.from({length: 9}, (_, i) => <rect key={i} x={-108} y={-286 + i * 16 + ((f * 0.6) % 16)} width={216} height={3} fill="#FFFFFF" opacity={0.04} />)}
        {screenText ? (
          <g>
            {screenText.map((ln, i) => {
              const take = Math.max(0, Math.min(ln.length, left));
              left -= ln.length + 1;
              const size = Math.min(30, 200 / Math.max(6, ln.length) * 1.55);
              return <text key={i} x={0} y={-238 + i * 40 + (screenText.length === 1 ? 18 : 0)} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} fill={NEWS.glyph}>{ln.slice(0, take)}</text>;
            })}
            {Math.floor(f / 8) % 2 === 0 && <rect x={70} y={-180} width={14} height={4} fill={NEWS.glyph} />}
          </g>
        ) : (
          <g transform={`translate(${ex},0)`}>
            {eye(-48)}{eye(48)}
            <path d={mouth} fill="none" stroke={NEWS.glyph} strokeWidth={8} strokeLinecap="round" />
          </g>
        )}
        <ellipse cx={-70} cy={-272} rx={34} ry={12} fill="#FFFFFF" opacity={0.08} />
        {/* the mouth slot under the face, and the sheet hanging out of it */}
        <rect x={-120} y={-138} width={240} height={18} rx={9} fill={INK} />
        <g transform={`translate(0,-128)`}>
          <path d={`M-98,0 L98,0 L${94 + flutter * 0.3},${tongueLen} Q0,${tongueLen + 16 + flutter} ${-94 + flutter * 0.3},${tongueLen} Z`}
            fill={NEWS.paper} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          {Array.from({length: Math.max(0, Math.floor(tongueLen / 26))}, (_, i) => (
            <line key={i} x1={-74} y1={18 + i * 24} x2={i % 3 === 2 ? 30 : 74} y2={18 + i * 24} stroke={NEWS.newsprint} strokeWidth={5} />
          ))}
          <path d={`M-98,0 L98,0 L96,14 L-96,14 Z`} fill="#000" opacity={0.18} />
        </g>
        {/* carriage bell on the right shoulder */}
        <g transform="translate(176,-318)">
          <rect x={-6} y={0} width={12} height={22} fill={dark.shade} stroke={INK} strokeWidth={3} />
          <path d="M-24,0 Q-24,-34 0,-36 Q24,-34 24,0 Z" fill="#D9D2BD" stroke={INK} strokeWidth={5} />
          <circle cx={-8} cy={-20} r={5} fill="#FFFFFF" opacity={0.7} />
        </g>
        {/* the ALASKA NEWS nameplate on the plinth (optional) */}
        {nameplate && (() => {
          const w = monoW(nameplate, 24) + 36;
          return <g transform="translate(0,-31)">
            <rect x={-w / 2} y={-19} width={w} height={38} rx={6} fill={NEWS.cream} stroke={INK} strokeWidth={4} />
            <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} letterSpacing={1.5} fill={INK}>{nameplate}</text>
          </g>;
        })()}
      </g>
      {/* platen cylinder across the top, overhanging both flanks, with knob cheeks */}
      <g transform={`translate(${slam},${-352 + breathe * 0.6})`}>
        <rect x={-262} y={-30} width={524} height={60} rx={30} fill={`url(#${id}p)`} stroke={INK} strokeWidth={8} />
        <rect x={-246} y={-22} width={492} height={10} rx={5} fill="#FFFFFF" opacity={0.16} />
        {/* the paper riding the platen */}
        <path d="M-150,-28 L150,-28 L146,-92 Q0,-104 -146,-92 Z" fill={NEWS.paper} stroke={INK} strokeWidth={5} />
        {[-70, -50].map((ly) => <line key={ly} x1={-110} y1={ly} x2={110} y2={ly} stroke={NEWS.newsprint} strokeWidth={4} />)}
        {[-1, 1].map((sd) => (
          <g key={sd} transform={`translate(${sd * 282},0)`}>
            <circle r={44} fill={crm.shade} stroke={INK} strokeWidth={8} />
            <circle r={34} fill={crm.base} />
            <g transform={`rotate(${rollDeg * sd})`}>
              {[0, 60, 120].map((a) => <line key={a} x1={0} y1={-30} x2={0} y2={30} stroke={crm.shade} strokeWidth={6} transform={`rotate(${a})`} />)}
            </g>
            <circle r={11} fill={NEWS.spruceDk} stroke={INK} strokeWidth={4} />
            <circle cx={-12} cy={-14} r={7} fill="#FFFFFF" opacity={0.5} />
          </g>
        ))}
      </g>
      {/* funnel hopper on top, takes the records */}
      <g transform={`translate(0,${-420 + breathe * 0.8}) scale(${1 + gulp * 0.12},${1 - gulp * 0.06})`}>
        <path d="M-128,-86 L128,-86 L58,8 L-58,8 Z" fill={`url(#${id}f)`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d="M-128,-86 L128,-86" stroke={dark.key} strokeWidth={6} />
        <ellipse cx={0} cy={-86} rx={128} ry={16} fill={NEWS.spruceDk} stroke={INK} strokeWidth={6} />
        <ellipse cx={0} cy={-84} rx={104} ry={9} fill="#0B1A16" />
        <path d="M-96,-70 L-44,0" stroke="#FFFFFF" strokeWidth={6} opacity={0.14} />
      </g>
    </g>
  );
};

export type SlotState = 'empty' | 'stub' | 'jammed' | 'headline' | 'question' | 'story';

/**
 * LeadSlot: the top slot of a front page, the film's throughline. Origin is the CENTRE OF THE
 * WINDOW. The square frame is the only hard-cornered thing in the newsroom family and the only
 * thing in the cadmium-amber accent: amber means the choice. Window 460 x 300 at scale 1; the
 * page around it is 600 x 760, the hatch sits above the frame.
 *
 *   hatch      0..1 open angle of the hinged hatch above the window
 *   drop       0..1 a stub falling from the hatch into the window (state 'stub')
 *   jam        0..1 how wedged the jammed sheets are (state 'jammed')
 *   headline   the official headline lines (state 'headline'), seal 0..1 PENDING stamp
 *   box        'none' | 'empty' | 'filled' dashed box under the headline, question text
 *   shaft      0..1 the hard sun shaft that lands on the slot from the turn
 *   accent     0..1 how lit the amber frame is (the jammed slot greys out)
 */
export const LeadSlot: React.FC<{
  x: number; y: number; scale?: number; f: number; state?: SlotState;
  hatch?: number; drop?: number; jam?: number; headline?: string[]; seal?: number;
  box?: 'none' | 'empty' | 'filled'; boxPulse?: number; question?: string[]; fill?: number;
  shaft?: number; accent?: number; page?: boolean; label?: string;
}> = ({x, y, scale = 1, f, state = 'empty', hatch = 0, drop = 0, jam = 0, headline = [], seal = 0,
  box = 'none', boxPulse = 0, question = [], fill = 1, shaft = 0, accent = 1, page = true, label = 'THE LEAD'}) => {
  const id = `ls${Math.round(x)}_${Math.round(y)}`;
  const amb = tones(NEWS.amber);
  const grey = tones('#BDB4A2');
  const fr = accent >= 0.999 ? amb : {
    key: mix(grey.key, amb.key, accent), base: mix(grey.base, amb.base, accent), shade: mix(grey.shade, amb.shade, accent), core: amb.core,
  };
  const W = 460, H = 300;
  const hatchA = -100 * clamp01(hatch);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}fr`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={fr.key} /><stop offset="0.55" stopColor={fr.base} /><stop offset="1" stopColor={fr.shade} />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4B4335" /><stop offset="1" stopColor="#2A251D" />
        </linearGradient>
        <linearGradient id={`${id}sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4C8" stopOpacity={0} /><stop offset="0.6" stopColor="#FFE9A0" stopOpacity={0.5} /><stop offset="1" stopColor="#FFE9A0" stopOpacity={0.15} />
        </linearGradient>
      </defs>
      {page && (
        <g>
          <rect x={-300 + 10} y={-420 + 14} width={600} height={800} fill="#000" opacity={0.18} />
          <rect x={-300} y={-420} width={600} height={800} fill={NEWS.paper} stroke={INK} strokeWidth={7} />
          {/* masthead rule and columns: the rest of the page is grey type, nobody's choice */}
          <rect x={-270} y={-400} width={540} height={10} fill={INK} />
          {Array.from({length: 3}, (_, c) =>
            Array.from({length: 7}, (_, r) => (
              <rect key={`${c}${r}`} x={-266 + c * 182} y={190 + r * 24} width={(hash(c * 9 + r) % 3 === 0) ? 110 : 160} height={9} fill={NEWS.newsprint} />
            )))}
        </g>
      )}
      {/* the hatch, hinged on its top edge, above the frame */}
      <g transform={`translate(0,${-H / 2 - 92})`}>
        <rect x={-150} y={-46} width={300} height={56} rx={4} fill={NEWS.spruceDk} stroke={INK} strokeWidth={7} />
        <g transform={`translate(0,-46) rotate(${hatchA * 0.0} ) scale(1,${Math.cos(hatchA * Math.PI / 180)})`}>
          <rect x={-130} y={0} width={260} height={50} fill={NEWS.spruce} stroke={INK} strokeWidth={6} />
          <line x1={-110} y1={25} x2={110} y2={25} stroke={NEWS.spruceDk} strokeWidth={5} />
        </g>
        {[-120, 120].map((hx) => <circle key={hx} cx={hx} cy={-46} r={7} fill={NEWS.kraft} stroke={INK} strokeWidth={3} />)}
      </g>
      {/* the frame: thick, square, hard-cornered, amber */}
      <rect x={-W / 2 - 34} y={-H / 2 - 34} width={W + 68} height={H + 68} fill={`url(#${id}fr)`} stroke={INK} strokeWidth={10} />
      <rect x={-W / 2 - 22} y={-H / 2 - 24} width={W + 44} height={8} fill="#FFFFFF" opacity={0.28} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} fill={`url(#${id}w)`} stroke={INK} strokeWidth={7} />
      {/* inner shadow at the top of the window */}
      <rect x={-W / 2} y={-H / 2} width={W} height={26} fill="#000" opacity={0.3} />
      {/* label tab */}
      {label && (() => {
        const lw = monoW(label, 26) + 40;
        return <g transform={`translate(${-W / 2 - 34 + lw / 2},${-H / 2 - 34})`}>
          <rect x={-lw / 2} y={-22} width={lw} height={44} fill={INK} />
          <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} letterSpacing={1.5} fill={fr.base}>{label}</text>
        </g>;
      })()}
      {/* window contents */}
      <g>
        {state === 'stub' && (() => {
          const k = clamp01(drop);
          const yy = -H / 2 - 120 + k * (120 + 40);
          return <g transform={`translate(0,${yy}) rotate(${(1 - k) * 8})`}>
            <rect x={-140} y={-60} width={280} height={150} fill={NEWS.paper} stroke={INK} strokeWidth={5} />
            {[0, 1, 2, 3].map((r) => <rect key={r} x={-116} y={-40 + r * 30} width={r === 0 ? 232 : 190} height={r === 0 ? 16 : 9} fill={r === 0 ? INK : NEWS.newsprint} />)}
          </g>;
        })()}
        {state === 'jammed' && Array.from({length: 11}, (_, i) => {
          const h = hash(i * 31);
          const k = clamp01(jam * 1.4 - i * 0.04);
          const rot = ((h % 40) - 20) * k;
          const ox = ((h >> 4) % 300) - 150, oy = -60 - ((h >> 9) % 140) + 160 * k;
          return <g key={i} transform={`translate(${ox},${oy - 180 * (1 - k)}) rotate(${rot})`}>
            <rect x={-120} y={-70} width={240} height={150} fill={i % 2 ? NEWS.paper : '#EFE6D2'} stroke={INK} strokeWidth={5} />
            <rect x={-96} y={-48} width={180} height={12} fill={INK} opacity={0.8} />
            <rect x={-96} y={-20} width={150} height={8} fill={NEWS.newsprint} />
          </g>;
        })}
        {(state === 'headline' || state === 'question') && (
          <g>
            <rect x={-W / 2 + 14} y={-H / 2 + 14} width={W - 28} height={H - 28} fill={NEWS.paper} stroke={INK} strokeWidth={4} />
            {state === 'headline' && headline.map((ln, i) => (
              <text key={i} x={-W / 2 + 34} y={-H / 2 + 52 + i * 30} fontFamily={MONO} fontWeight={700} fontSize={19} fill={INK} letterSpacing={0.5}>{ln}</text>
            ))}
            {state === 'headline' && Array.from({length: 2}, (_, r) => (
              <rect key={r} x={-W / 2 + 34} y={-H / 2 + 52 + headline.length * 30 + r * 16} width={W - 120 - r * 60} height={7} fill={NEWS.newsprint} />
            ))}
            {state === 'question' && question.map((ln, i) => (
              <text key={i} x={0} y={-H / 2 + 92 + i * 62} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight={900} fontSize={50} fill={INK}>{ln}</text>
            ))}
          </g>
        )}
      </g>
      {/* the PENDING seal */}
      {seal > 0.01 && (
        <g transform={`translate(${W / 2 - 70},${-H / 2 + 52}) rotate(-12) scale(${1 + 0.35 * (1 - clamp01(seal))})`} opacity={clamp01(seal * 2)}>
          <circle r={56} fill="none" stroke={NEWS.oxblood} strokeWidth={6} />
          <circle r={46} fill="none" stroke={NEWS.oxblood} strokeWidth={2.5} />
          <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={NEWS.oxblood}>PENDING</text>
        </g>
      )}
      {/* the dashed box under the headline: a question with no words, until it fills */}
      {box !== 'none' && (
        <g transform={`translate(0,${H / 2 - 70})`}>
          <rect x={-W / 2 + 34} y={-36} width={W - 68} height={72} fill={box === 'filled' ? NEWS.paper : 'none'}
            stroke={box === 'filled' ? INK : NEWS.oxblood} strokeWidth={box === 'filled' ? 5 : 5 + 2 * boxPulse} strokeDasharray={box === 'filled' ? undefined : '16 12'}
            strokeDashoffset={-f * 1.2} />
          {box === 'empty' && <text x={0} y={16} textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight={900} fontSize={46} fill={NEWS.oxblood} opacity={0.75 + 0.25 * boxPulse}>?</text>}
          {box === 'filled' && question.length > 0 && (
            <text x={0} y={12} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} fill={INK} opacity={clamp01(fill)}>{question.join(' ')}</text>
          )}
        </g>
      )}
      {/* the hard sun shaft that only ever lands on this slot */}
      {shaft > 0.01 && (
        <g opacity={clamp01(shaft)} style={{mixBlendMode: 'screen'}}>
          <path d={`M${-W / 2 - 120},-1400 L${W / 2 + 60},-1400 L${W / 2 + 40},${H / 2 + 34} L${-W / 2 - 40},${H / 2 + 34} Z`} fill={`url(#${id}sh)`} />
        </g>
      )}
    </g>
  );
};

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * clamp01(t)).toString(16).padStart(2, '0')).join('');
}

/** A kraft price tag on a string: the film's opening question. Origin at the string's knot.
 *  flip 0..1 turns it over (front to back) through edge-on. */
export const PriceTag: React.FC<{x: number; y: number; scale?: number; f: number; front: string[]; back: string[]; flip?: number; swing?: number; size?: number}> =
({x, y, scale = 1, f, front, back, flip = 0, swing = 0, size = 30}) => {
  const k = clamp01(flip);
  const sx = Math.cos(k * Math.PI);
  const lines = sx >= 0 ? front : back;
  const w = Math.max(...lines.map((l) => monoW(l, size))) + 80;
  const h = lines.length * (size + 12) + 44;
  const sway = Math.sin(f / 23) * 4 + swing;
  const kr = tones(NEWS.kraft);
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${sway})`}>
      <path d={`M0,0 L0,46`} stroke={INK} strokeWidth={4} />
      <g transform={`translate(0,46) scale(${Math.max(0.02, Math.abs(sx))},1)`}>
        <path d={`M${-w / 2 + 26},0 L${w / 2 - 26},0 L${w / 2},26 L${w / 2},${h} L${-w / 2},${h} L${-w / 2},26 Z`}
          fill={sx >= 0 ? kr.base : kr.key} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M${w / 2 - 20},30 L${w / 2 - 20},${h - 10}`} stroke={kr.shade} strokeWidth={10} opacity={0.6} />
        <circle cx={0} cy={18} r={9} fill={NEWS.cream} stroke={INK} strokeWidth={4} />
        {lines.map((ln, i) => (
          <text key={i} x={0} y={48 + size * 0.8 + i * (size + 12)} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.5} fill={INK}>{ln}</text>
        ))}
      </g>
    </g>
  );
};

/** One soft ream: bowed edges, a curl at the top sheet, a kraft wrapper band. Origin bottom
 *  centre. Reams are never hard rectangles (only the LeadSlot is). */
export const Ream: React.FC<{x: number; y: number; w?: number; h?: number; lean?: number; curl?: number; band?: boolean; seed?: number}> =
({x, y, w = 360, h = 120, lean = 0, curl = 0.5, band = true, seed = 0}) => {
  const bow = 8 + (hash(seed) % 6);
  const pt = tones(NEWS.paper);
  return (
    <g transform={`translate(${x},${y}) rotate(${lean})`}>
      <path d={`M${-w / 2},0 Q${-w / 2 - bow},${-h / 2} ${-w / 2 + 4},${-h} L${w / 2 - 4},${-h} Q${w / 2 + bow},${-h / 2} ${w / 2},0 Z`}
        fill={pt.base} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {/* page edges */}
      {Array.from({length: Math.floor(h / 9)}, (_, i) => (
        <path key={i} d={`M${-w / 2 + 8},${-6 - i * 9} Q0,${-3 - i * 9 + (i % 2)} ${w / 2 - 8},${-6 - i * 9}`} fill="none" stroke={pt.shade} strokeWidth={2} opacity={0.7} />
      ))}
      <path d={`M${w / 2 - 30},-4 Q${w / 2 + bow - 4},${-h / 2} ${w / 2 - 26},${-h + 4}`} fill="none" stroke={pt.shade} strokeWidth={14} opacity={0.5} />
      {band && <rect x={-48} y={-h - 2} width={96} height={h + 4} fill={NEWS.kraft} stroke={INK} strokeWidth={4} opacity={0.95} />}
      {/* the top sheet curling */}
      <path d={`M${-w / 2 + 6},${-h} L${w / 2 - 60},${-h} Q${w / 2 - 10},${-h - 30 * curl} ${w / 2 - 34},${-h - 54 * curl} L${-w / 2 + 6},${-h}`}
        fill={NEWS.paper} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

/** A loose printed story sheet (flutters as it falls). Origin centre. */
export const StorySheet: React.FC<{x: number; y: number; rot?: number; s?: number; tint?: string; checked?: number}> =
({x, y, rot = 0, s = 1, tint = NEWS.paper, checked = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-70} y={-90} width={140} height={180} rx={3} fill={tint} stroke={INK} strokeWidth={4} />
    <rect x={-54} y={-74} width={108} height={12} fill={INK} />
    {[0, 1, 2, 3, 4, 5].map((r) => <rect key={r} x={-54} y={-48 + r * 20} width={r % 3 === 2 ? 70 : 108} height={7} fill={NEWS.newsprint} />)}
    {checked > 0.01 && (
      <g transform={`rotate(-14) scale(${1 + 0.4 * (1 - clamp01(checked))})`} opacity={clamp01(checked * 2)}>
        <rect x={-62} y={-20} width={124} height={40} fill="none" stroke={NEWS.oxblood} strokeWidth={5} />
        <text x={0} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} fill={NEWS.oxblood}>CHECKED AFTER</text>
      </g>
    )}
  </g>
);
