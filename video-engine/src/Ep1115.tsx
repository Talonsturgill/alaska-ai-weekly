import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, ContactShadow, tones, FormGradient} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {MONO, monoW} from './lib/prospect';
import {HeldTravel, HeldProp} from './lib/heldidle';
import {IdleFigure, FigureFinish, StrikeProp} from './lib/figureidle';
import {Flap, Tote} from './lib/recordslot';
import {IDS} from './Ep1115Ids';

// The Slot Without an Edge, 2026-11-15. Palette roles are art_direction.json. Flap (gunmetal, never brass) is the hero; the Question
// (a cream balloon that folds into a note) is the throughline. PROPOSED is lead pencil on tracing vellum with dashed borders, glacier-cyan
// ONLY on screens where AI shows, sodium amber is the one exterior key, the clerk's room is the one warm interior.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;

export const C = {
  night: '#142420', nightD: '#0C1513', stone: '#3A4A5C', stoneL: '#5E7385', stoneD: '#26323F', lamp: '#F2A541', lampL: '#FFD48A',
  paper: '#F3E9D2', paperD: '#D9CCAE', vellum: '#E6EEF2', lead: '#3A4652', sea: '#9FE7FF', tagc: '#D7DEE2', gun: '#4A4F57', nickel: '#B9BEC4',
  door: '#1E2A26', doorL: '#2C3B35', glass: '#E9D9A8', oak: '#6B4A2E', oakD: '#4A321E', oakL: '#8C6440', warm: '#E8C27A',
  green: '#2F5A44', greenL: '#4F8A6A', ink: '#14181E', line: '#14181E', skin: '#C98E6B', shell: '#2F6E8E', shellD: '#1F4F69', rail: '#2E6B4E',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.2, 1.16, 0.3, 1);
const ease = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const h01 = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** a decaying settle after a landing, for the object itself (never the frame) */
const settle = (f: number, at: number, amp = 1, dur = 22) => {
  const t = f - at;
  if (t < 0 || t > dur) return 0;
  return amp * Math.sin(t * 0.7) * Math.exp(-t / (dur * 0.35));
};

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'dark' | 'plate' | 'prop' | 'warm';
const TONES: Record<Tone, {fill: string; fg: string; edge: string}> = {
  dark: {fill: '#101A17', fg: '#F3E9D2', edge: '#F3E9D2'},
  plate: {fill: C.paper, fg: C.ink, edge: C.ink},
  prop: {fill: '#E6EEF2', fg: '#3A4652', edge: '#3A4652'},
  warm: {fill: '#FFF4DC', fg: '#3A2614', edge: '#3A2614'},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text?: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number}> =
({text, displayLines, x = 540, y, size = 34, tone = 'dark', p = 1, rot = 0, drop = 0}) => {
  const ls = displayLines ?? [text ?? ''];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  const fr = useCurrentFrame();
  if (k <= 0.01) return null;
  const sc = (0.88 + 0.12 * Math.min(1, k * 1.15)) * (1 + 0.01 * Math.sin(fr / 11 + x * 0.01));
  return (
    <g opacity={Math.min(1, k * 1.7)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={tone === 'prop' ? 2 : 6} fill={t.fill} stroke={t.edge} strokeWidth={4} strokeDasharray={tone === 'prop' ? '14 9' : undefined} />
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

const CHIP = 'ILLUSTRATION';
type Cam = {z: number; fx: number; fy: number};
const Frame: React.FC<{p: SP; cam?: (f: number) => Cam; z0?: number; z1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; overlay?: React.ReactNode; bg?: string; warmth?: number; children: React.ReactNode}> =
({p, cam, z0 = 1.0, z1 = 1.05, bloom = 0.05, vignette = 0.26, ox = 540, oy = 930, overlay, bg = C.night, warmth = 0.03, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const c: Cam = cam ? cam(p.f) : {z: lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur))), fx: ox + 12 * Math.sin(p.f / 110) + 8 * t, fy: oy};
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: bg}} />
      <div style={{position: 'absolute', inset: 0, background: 'transparent', transform: `translate(${jl.x + 2 * Math.sin(p.f / 23)}px, ${jl.y + 3 * Math.sin(p.f / 17 + 1)}px) translate(${540 - c.fx * c.z}px, ${960 - c.fy * c.z}px) scale(${c.z})`, transformOrigin: '0 0'}}>
        {children}
      </div>
      {overlay && <SVG>{overlay}</SVG>}
      <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-band="ok">
          <rect x={50} y={436} width={monoW(CHIP, 20) + 30} height={38} rx={5} fill="#101A17" stroke="#F3E9D2" strokeWidth={2.4} opacity={0.92} />
          <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F3E9D2">{CHIP}</text>
        </g>
      </svg>
      <GradeLayer f={p.f} bloom={bloom + 0.02} vignette={vignette} grain={0.06} warmth={warmth} />
    </AbsoluteFill>
  );
};

const track = (keys: Array<{t: number; z: number; fx: number; fy: number}>) => (f: number): Cam => {
  const clampC = (c: Cam): Cam => ({z: c.z, fx: Math.max(540 / c.z, Math.min(1080 - 540 / c.z, c.fx)), fy: Math.max(960 / c.z, Math.min(1920 - 960 / c.z, c.fy))});
  if (f <= keys[0].t) return clampC(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i].t) {
      const a = keys[i - 1], bk = keys[i];
      const k = Easing.inOut(Easing.cubic)((f - a.t) / Math.max(1, bk.t - a.t));
      return clampC({z: lerp(a.z, bk.z, k), fx: lerp(a.fx, bk.fx, k), fy: lerp(a.fy, bk.fy, k)});
    }
  }
  return clampC(keys[keys.length - 1]);
};

// ---- shared props ------------------------------------------------------------------------------------------------------------------------------------
/** rain: two planes of streaks; the near plane only inside the lamp cone, the far drizzle everywhere */
const Rain: React.FC<{f: number; seed?: number; cone?: boolean; dense?: number}> = ({f, seed = 0, cone = true, dense = 1}) => {
  const far = Array.from({length: Math.round(70 * dense)}).map((_, i) => {
    const x = ((h01(i, seed) * 1300 + f * 3) % 1300) - 110;
    const y = ((h01(i + 7, seed) * 2100 + f * 26 + i * 13) % 2100) - 120;
    return <line key={`f${i}`} x1={x} y1={y} x2={x - 8} y2={y + 34} stroke="#9FB4C4" strokeWidth={2} opacity={0.22} />;
  });
  const near = Array.from({length: Math.round(46 * dense)}).map((_, i) => {
    const x = ((h01(i, seed + 3) * 900 + f * 5) % 900) + 60;
    const y = ((h01(i + 11, seed + 3) * 2000 + f * 44 + i * 29) % 2000) - 100;
    return <line key={`n${i}`} x1={x} y1={y} x2={x - 14} y2={y + 64} stroke="#FFE2A8" strokeWidth={3.4} opacity={0.5} strokeLinecap="round" />;
  });
  return (
    <g>
      {far}
      {cone ? (
        <g>
          <clipPath id={`raincone${seed}`}><polygon points="150,320 -80,1600 1000,1600 300,320" /></clipPath>
          <g clipPath={`url(#raincone${seed})`}>{near}</g>
        </g>
      ) : near}
    </g>
  );
};

/** the sky band: Mount Juneau's dark shoulder, spruce on the ridge, rooftops with a few lit windows, a low cloud drifting */
const Hillside: React.FC<{f: number; y?: number}> = ({f, y = 0}) => {
  const ridge = 'M -100,300 C 80,140 220,90 380,150 C 520,70 700,20 860,110 C 960,160 1060,120 1200,180 L 1200,520 L -100,520 Z';
  return (
    <g transform={`translate(0 ${y})`}>
      <rect x={-200} y={-200} width={1480} height={760} fill="#0E1A18" />
      <path d={ridge} fill="#18302A" stroke={C.line} strokeWidth={5} />
      <path d="M -100,330 C 120,210 300,200 460,250 C 640,190 820,200 1200,260 L 1200,520 L -100,520 Z" fill="#1E3A32" />
      {Array.from({length: 26}).map((_, i) => {
        const x = -60 + i * 50 + 10 * h01(i, 4);
        const top = 260 + 50 * Math.sin(i * 0.7) - 30 * h01(i, 9);
        return <path key={i} d={`M ${x},${top + 90} L ${x + 14},${top} L ${x + 28},${top + 90} Z`} fill="#122822" stroke={C.line} strokeWidth={3} />;
      })}
      {/* low cloud */}
      <ellipse cx={((f * 0.6) % 1500) - 200} cy={200} rx={260} ry={34} fill="#2B403B" opacity={0.55} />
      <ellipse cx={((f * 0.4 + 700) % 1500) - 200} cy={150} rx={200} ry={26} fill="#2B403B" opacity={0.45} />
      {/* rooftops with lit windows */}
      {[[-40, 380, 200], [150, 400, 170], [700, 390, 220], [910, 370, 220]].map(([x, top, w], i) => (
        <g key={i}>
          <path d={`M ${x},${top + 140} V ${top + 30} L ${x + w / 2},${top} L ${x + w},${top + 30} V ${top + 140} Z`} fill="#16231F" stroke={C.line} strokeWidth={4} />
          {[0, 1].map((j) => <rect key={j} x={x + 30 + j * 70} y={top + 60} width={30} height={34} fill={(i + j) % 2 ? '#F2C478' : '#26332E'} opacity={0.9} />)}
        </g>
      ))}
    </g>
  );
};

/** THE DOOR: stone surround, carved lintel, wall lamp and cone, JUNEAU street sign, the door and its wired-glass panel, green railing, wet step, street */
const DoorWorld: React.FC<{f: number; notice?: number; tag?: number; children?: React.ReactNode; reflect?: boolean; sign?: boolean; signX?: number}> = ({f, notice = 0, tag = 0, children, reflect = false, sign = true, signX = 70}) => {
  const flick = 0.92 + 0.08 * Math.sin(f / 5) * Math.sin(f / 13);
  return (
    <g>
      <Hillside f={f} />
      {/* stone wall */}
      <rect x={-200} y={420} width={1480} height={1100} fill={C.stone} data-band="ok" />
      {Array.from({length: 12}).map((_, r) => (
        <g key={r}>
          <line x1={-200} y1={440 + r * 90} x2={1280} y2={440 + r * 90} stroke={C.stoneD} strokeWidth={4} />
          {Array.from({length: 8}).map((__, c) => <line key={c} x1={(c * 200 + (r % 2) * 100) - 100} y1={440 + r * 90} x2={(c * 200 + (r % 2) * 100) - 100} y2={530 + r * 90} stroke={C.stoneD} strokeWidth={4} />)}
        </g>
      ))}
      {/* the plain stone lintel */}
      <rect x={200} y={360} width={680} height={84} fill="#4C5E70" stroke={C.line} strokeWidth={6} />
      <path d="M 210,372 H 870" stroke="#6E8296" strokeWidth={4} opacity={0.6} />
      {/* the door */}
      <rect data-band="ok" x={250} y={444} width={580} height={1060} fill={C.door} stroke={C.line} strokeWidth={8} />
      <rect x={280} y={470} width={520} height={300} fill="#0F1714" stroke={C.line} strokeWidth={6} />
      {/* wired glass, lit from inside */}
      <rect x={296} y={486} width={488} height={268} fill={C.glass} opacity={0.88} />
      {reflect && <g opacity={0.35}><clipPath id="glassref"><rect x={296} y={486} width={488} height={268} /></clipPath><g clipPath="url(#glassref)"><g transform="translate(240 330) scale(0.6 0.5)"><Hillside f={f} /></g></g></g>}
      {Array.from({length: 9}).map((_, i) => <line key={i} x1={296 + i * 61} y1={486} x2={296 + i * 61} y2={754} stroke="#B7A57A" strokeWidth={2} />)}
      {Array.from({length: 5}).map((_, i) => <line key={i} x1={296} y1={486 + i * 67} x2={784} y2={486 + i * 67} stroke="#B7A57A" strokeWidth={2} />)}
      <rect data-band="ok" x={280} y={800} width={520} height={680} fill={C.doorL} stroke={C.line} strokeWidth={5} opacity={0.6} />
      <circle cx={770} cy={1180} r={18} fill={C.nickel} stroke={C.line} strokeWidth={4} />
      {/* the notice taped to the glass */}
      {notice > 0.01 && (
        <g transform={`translate(540 ${lerp(560, 620, notice)}) rotate(${-2 + settle(f, 0, 0)})`} opacity={Math.min(1, notice * 2)}>
          <rect x={-150} y={-60} width={300} height={190} fill={C.paper} stroke={C.line} strokeWidth={5} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-120} y={-10 + i * 24} width={i === 0 ? 240 : 200 - i * 14} height={9} fill={C.paperD} />)}
          <rect x={-120} y={-44} width={160} height={16} fill={C.ink} />
          {[[-150, -60], [150, -60], [-150, 130], [150, 130]].map(([tx, ty], i) => (
            <rect key={i} x={tx - 18} y={ty - 8} width={36} height={16} fill="#E8DFC0" opacity={clamp01(notice * 4 - i * 0.6)} transform={`rotate(${i % 2 ? 35 : -35} ${tx} ${ty})`} />
          ))}
        </g>
      )}
      {tag > 0.01 && (
        <g transform={`translate(640 ${760}) rotate(${Math.sin(f / 12) * 6})`} opacity={tag}>
          <line x1={0} y1={-20} x2={0} y2={0} stroke={C.nickel} strokeWidth={3} />
          <rect x={-30} y={0} width={60} height={34} rx={4} fill={C.paperD} stroke={C.line} strokeWidth={3} />
        </g>
      )}
      {/* wall lamp and its cone */}
      <polygon points="150,320 -80,1600 1000,1600 300,320" fill={C.lamp} opacity={0.12 * flick} style={{mixBlendMode: 'screen'}} />
      <g transform="translate(180 300)">
        <path d="M -60,-40 H 10" stroke={C.line} strokeWidth={10} />
        <path d="M -20,-10 L 40,-10 L 60,30 L -40,30 Z" fill="#222C2A" stroke={C.line} strokeWidth={5} />
        <ellipse cx={10} cy={34} rx={46} ry={12} fill={C.lampL} opacity={flick} />
      </g>
      {/* lamp post with the JUNEAU street sign */}
      <g>
        <rect data-band="ok" x={60} y={420} width={22} height={1100} fill="#1B2422" stroke={C.line} strokeWidth={4} />
        {sign && <g transform={`translate(${signX} ${560}) rotate(${1.5 * Math.sin(f / 40)})`}>
          <rect x={-10} y={-34} width={monoW('JUNEAU', 30) + 40} height={56} rx={6} fill={C.green} stroke={C.line} strokeWidth={5} />
          <text x={10} y={4} fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={1.5} fill="#F3E9D2">JUNEAU</text>
        </g>}
      </g>
      {/* green railing down the steps on the right */}
      <g>
        <path d="M 880,980 L 1100,1260" stroke={C.rail} strokeWidth={14} strokeLinecap="round" />
        {[0, 1, 2, 3].map((i) => <line key={i} x1={900 + i * 56} y1={1005 + i * 70} x2={900 + i * 56} y2={1500} stroke={C.rail} strokeWidth={9} />)}
        <path d="M 880,980 L 1100,1260" stroke="#7FBFA0" strokeWidth={3} opacity={0.6} />
      </g>
      {children}
      {/* the wet step, doormat, puddle and the street below */}
      <rect x={-200} y={1500} width={1480} height={150} fill="#2A3440" stroke={C.line} strokeWidth={6} data-band="ok" />
      <rect x={-200} y={1500} width={1480} height={14} fill="#5E7385" opacity={0.6} data-band="ok" />
      <rect x={360} y={1540} width={360} height={60} rx={8} fill="#5B3A28" stroke={C.line} strokeWidth={4} data-band="ok" />
      {Array.from({length: 9}).map((_, i) => <line key={i} x1={380 + i * 38} y1={1546} x2={380 + i * 38} y2={1594} stroke="#3E271A" strokeWidth={4} data-band="ok" />)}
      <rect x={-200} y={1650} width={1480} height={300} fill="#141D1C" data-band="ok" />
      <ellipse cx={240} cy={1620} rx={120} ry={16} fill="#E9C27A" opacity={0.25 + 0.1 * Math.sin(f / 9)} data-band="ok" />
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={((i * 190 + f * 1.5) % 1300) - 100} y={1700 + (i % 3) * 60} width={70} height={6} fill={C.lamp} opacity={0.3} data-band="ok" />
      ))}
      <g data-band="ok">
        <rect x={880} y={1600} width={150} height={190} rx={10} fill="#2F5A44" stroke={C.line} strokeWidth={5} />
        <rect x={900} y={1630} width={110} height={60} fill="#C9D2D9" stroke={C.line} strokeWidth={3} />
        {[0, 1, 2].map((i) => <rect key={i} x={910} y={1640 + i * 16} width={90 - i * 20} height={6} fill="#6E7C88" />)}
      </g>
      {/* ripples where drops hit the step */}
      {Array.from({length: 6}).map((_, i) => {
        const life = ((f + i * 17) % 40) / 40;
        return <ellipse key={i} cx={120 + i * 170} cy={1560 + (i % 2) * 40} rx={8 + 30 * life} ry={3 + 8 * life} fill="none" stroke="#9FB4C4" strokeWidth={2} opacity={0.6 * (1 - life)} data-band="ok" />;
      })}
    </g>
  );
};

/** the Question: a cream speech balloon with a question mark; fold 0..1 folds it into a note */
const Question: React.FC<{x: number; y: number; s?: number; f: number; fold?: number; seed?: number}> = ({x, y, s = 1, f, fold = 0, seed = 0}) => {
  const k = clamp01(fold);
  const bob = 6 * Math.sin(f / 14 + seed);
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <ellipse cx={8} cy={92} rx={60 * (1 - k * 0.3)} ry={10} fill="#000" opacity={0.28} />
      {k < 0.98 && (
        <g opacity={1 - k} transform={`scale(${1 - 0.5 * k})`}>
          <path d="M -80,-50 Q -80,-90 -40,-90 H 40 Q 80,-90 80,-50 V 0 Q 80,40 40,40 H -10 L -40,74 L -30,40 H -40 Q -80,40 -80,0 Z" fill={C.paper} stroke={C.line} strokeWidth={6} strokeLinejoin="round" />
          <path d="M -60,-70 Q -20,-82 30,-78" stroke="#FFFFFF" strokeWidth={6} fill="none" opacity={0.7} strokeLinecap="round" />
          <text x={0} y={-6} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight={900} fontSize={84} fill={C.ink}>?</text>
        </g>
      )}
      {k > 0.02 && (
        <g opacity={k} transform={`rotate(${-6 + 4 * Math.sin(f / 20)})`}>
          <path d="M -60,-34 H 60 V 34 H -60 Z" fill={C.paper} stroke={C.line} strokeWidth={5} />
          <path d="M -60,0 H 60" stroke={C.paperD} strokeWidth={3} />
          <path d="M -44,-18 H 30" stroke="#8A7C5E" strokeWidth={4} />
          <text x={36} y={26} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight={900} fontSize={30} fill={C.ink}>?</text>
        </g>
      )}
    </g>
  );
};

const Envelope: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-70} y={-44} width={140} height={88} rx={5} fill={C.paper} stroke={C.line} strokeWidth={5} />
    <path d="M -70,-44 L 0,10 L 70,-44" fill="none" stroke={C.line} strokeWidth={4} />
    <path d="M -70,44 L -14,0 M 70,44 L 14,0" stroke={C.paperD} strokeWidth={3} />
  </g>
);

/** a standing person in a rain shell, three-quarter, holding a phone or a note in the near hand */
const Person: React.FC<{f: number; x: number; y: number; s?: number; hold?: 'phone' | 'note' | 'none'; reach?: number; cues?: number[]; look?: number}> = ({f, x, y, s = 1, hold = 'phone', reach = 0, cues = [], look = 0}) => {
  const sh = tones(C.shell);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ContactShadow cx={0} cy={4} rx={110} ry={18} opacity={0.45} />
      <FigureFinish x={0} footY={0} w={220} h={560} keySide="left">
        <IdleFigure f={f} x={0} footY={0} h={560} seed={5} cues={cues}>
          {(pose) => (
            <g>
              <defs><FormGradient id="shellG" t={sh} softness={0.62} /></defs>
              {/* legs and boots */}
              <rect x={-58} y={-200} width={46} height={190} rx={18} fill="#24303A" stroke={C.line} strokeWidth={6} />
              <rect x={12} y={-200} width={46} height={190} rx={18} fill="#2C3A46" stroke={C.line} strokeWidth={6} />
              <path d="M -70,-14 h 66 v 18 h -72 z M 6,-14 h 66 v 18 h -72 z" fill="#3B2A1E" stroke={C.line} strokeWidth={5} />
              {/* the rain shell */}
              <path d="M -96,-190 Q -104,-380 -60,-420 Q 0,-450 60,-420 Q 104,-380 96,-190 Z" fill="url(#shellG)" stroke={C.line} strokeWidth={7} strokeLinejoin="round" />
              <path d="M 0,-430 V -200" stroke={C.shellD} strokeWidth={5} />
              {Array.from({length: 9}).map((_, i) => <line key={i} x1={-6} y1={-420 + i * 24} x2={6} y2={-420 + i * 24} stroke="#C9D2D9" strokeWidth={3} />)}
              {[-1, 1].map((sd) => <path key={sd} d={`M ${sd * 50},-410 Q ${sd * 70},-300 ${sd * 60},-200`} stroke={C.shellD} strokeWidth={4} fill="none" opacity={0.7} />)}
              <rect x={-70} y={-300} width={50} height={36} rx={6} fill="none" stroke={C.shellD} strokeWidth={4} />
              <path d="M -96,-190 Q -104,-380 -60,-420" stroke="#FFE2A8" strokeWidth={5} fill="none" opacity={0.6} />
              <path d="M -86,-300 Q 0,-286 86,-300" stroke={C.shellD} strokeWidth={4} fill="none" opacity={0.6} />
              {/* far arm hangs */}
              <g transform={`rotate(${8 + pose.armL * 0.3} -86 -400)`}>
                <rect x={-112} y={-404} width={42} height={190} rx={20} fill="url(#shellG)" stroke={C.line} strokeWidth={6} />
                <ellipse cx={-91} cy={-208} rx={18} ry={16} fill={C.skin} stroke={C.line} strokeWidth={4} />
              </g>
              {/* near arm lifts the phone or the note toward the slot */}
              <g transform={`rotate(${-70 - 40 * reach + pose.armR * 0.3} 80 -400)`}>
                <rect x={60} y={-410} width={42} height={150} rx={20} fill="url(#shellG)" stroke={C.line} strokeWidth={6} />
                <g transform="translate(81 -264)">
                  {hold === 'phone' && (
                    <g transform="rotate(70)">
                      <rect x={-34} y={-58} width={68} height={116} rx={12} fill="#13202B" stroke={C.line} strokeWidth={5} />
                      <rect x={-26} y={-48} width={52} height={92} rx={6} fill="#18303A" />
                      <circle cx={-10} cy={-14} r={6} fill={C.sea} /><circle cx={10} cy={-14} r={6} fill={C.sea} />
                      <path d="M -12,6 Q 0,16 12,6" stroke={C.sea} strokeWidth={4} fill="none" strokeLinecap="round" />
                    </g>
                  )}
                  {hold === 'note' && <g transform="rotate(70)"><rect x={-40} y={-26} width={80} height={52} fill={C.paper} stroke={C.line} strokeWidth={4} /></g>}
                  <ellipse cx={0} cy={0} rx={20} ry={18} fill={C.skin} stroke={C.line} strokeWidth={4} />
                </g>
              </g>
              {/* head under a hood */}
              <g transform={`translate(0 -470) rotate(${pose.headRot * 0.6 + look * 10})`}>
                <circle r={54} fill={C.skin} stroke={C.line} strokeWidth={7} />
                <circle cx={18} cy={-4} r={6} fill={C.ink} /><circle cx={-12} cy={-4} r={6} fill={C.ink} />
                <path d="M -10,24 Q 4,32 18,22" stroke="#7A4E36" strokeWidth={4} fill="none" strokeLinecap="round" />
                <path d="M -68,10 Q -72,-70 0,-74 Q 72,-70 68,10 Q 56,-46 0,-50 Q -56,-46 -68,10 Z" fill={C.shellD} stroke={C.line} strokeWidth={6} />
                <path d="M -64,-6 Q -66,-64 0,-70" stroke="#FFE2A8" strokeWidth={5} fill="none" opacity={0.65} />
                <path d="M -14,8 Q -8,12 -2,8" stroke="#7A4E36" strokeWidth={3} fill="none" />
              </g>
            </g>
          )}
        </IdleFigure>
      </FigureFinish>
    </g>
  );
};

/** the night clerk, seated at the desk, front-on, a generic figure (not a likeness) */
const Clerk: React.FC<{f: number; x: number; y: number; s?: number; look?: number; rub?: number; nod?: number; cues?: number[]}> = ({f, x, y, s = 1, look = 0, rub = 0, nod = 0, cues = []}) => {
  const cardi = tones('#5E4A6A');
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <FigureFinish x={0} footY={0} w={260} h={360} keySide="left">
        <IdleFigure f={f} x={0} footY={0} h={360} seed={7} cues={cues}>
          {(pose) => (
            <g>
              <defs><FormGradient id="cardiG" t={cardi} softness={0.6} /></defs>
              <path d="M -120,0 Q -126,-170 -70,-210 Q 0,-236 70,-210 Q 126,-170 120,0 Z" fill="url(#cardiG)" stroke={C.line} strokeWidth={7} />
              <path d="M -30,-214 L 0,-150 L 30,-214" fill="#EDE2C6" stroke={C.line} strokeWidth={5} />
              {/* the arm that rubs an eye on its beat */}
              <g transform={`rotate(${-20 - 90 * rub + pose.armR * 0.3} 92 -190)`}>
                <rect x={78} y={-196} width={40} height={150} rx={18} fill="url(#cardiG)" stroke={C.line} strokeWidth={6} />
                <ellipse cx={98} cy={-46} rx={20} ry={18} fill={C.skin} stroke={C.line} strokeWidth={4} />
              </g>
              <g transform={`rotate(${20 + pose.armL * 0.3} -92 -190)`}>
                <rect x={-118} y={-196} width={40} height={150} rx={18} fill="url(#cardiG)" stroke={C.line} strokeWidth={6} />
                <ellipse cx={-98} cy={-46} rx={20} ry={18} fill={C.skin} stroke={C.line} strokeWidth={4} />
              </g>
              <g transform={`translate(0 ${-276 + 8 * nod}) rotate(${pose.headRot * 0.6 + look * 12})`}>
                <circle r={58} fill={C.skin} stroke={C.line} strokeWidth={7} />
                <path d="M -58,-6 Q -56,-70 0,-72 Q 56,-70 58,-6 Q 30,-40 -58,-6 Z" fill="#3A2A22" stroke={C.line} strokeWidth={5} />
                <circle cx={-20} cy={0} r={13} fill="none" stroke={C.line} strokeWidth={4} /><circle cx={20} cy={0} r={13} fill="none" stroke={C.line} strokeWidth={4} />
                <path d="M -7,0 H 7" stroke={C.line} strokeWidth={4} />
                <circle cx={-20} cy={1} r={4} fill={C.ink} /><circle cx={20} cy={1} r={4} fill={C.ink} />
                <path d="M -14,30 Q 0,36 14,30" stroke="#7A4E36" strokeWidth={4} fill="none" strokeLinecap="round" />
              </g>
            </g>
          )}
        </IdleFigure>
      </FigureFinish>
    </g>
  );
};

/** the clerk's room: oak panels, a window onto the rainy spruce hillside, a green-shaded lamp, the desk */
const ClerkRoom: React.FC<{f: number; children?: React.ReactNode; desk?: number}> = ({f, children, desk = 1150}) => {
  const lampK = 0.95 + 0.05 * Math.sin(f / 7);
  return (
    <g>
      <rect data-band="ok" x={-200} y={-200} width={1480} height={2320} fill={C.oakD} />
      {Array.from({length: 9}).map((_, i) => <rect key={i} x={-120 + i * 160} y={-200} width={150} height={desk + 200} fill={i % 2 ? '#56391F' : '#5C3E22'} stroke="#3A2614" strokeWidth={4} />)}
      {/* window onto Juneau's spruce hillside in the rain */}
      <g>
        <rect x={600} y={160} width={400} height={480} fill="#0E1A18" stroke="#2A1A0E" strokeWidth={14} />
        <clipPath id="clerkwin"><rect x={600} y={160} width={400} height={480} /></clipPath>
        <g clipPath="url(#clerkwin)">
          <g transform="translate(560 40) scale(0.5)"><Hillside f={f} /></g>
          {Array.from({length: 26}).map((_, i) => {
            const yy = ((h01(i, 2) * 520 + f * 9) % 520) + 160;
            return <line key={i} x1={600 + h01(i, 5) * 400} y1={yy} x2={596 + h01(i, 5) * 400} y2={yy + 26} stroke="#9FB4C4" strokeWidth={2} opacity={0.5} />;
          })}
        </g>
        <line x1={800} y1={160} x2={800} y2={640} stroke="#2A1A0E" strokeWidth={10} />
        <line x1={600} y1={400} x2={1000} y2={400} stroke="#2A1A0E" strokeWidth={10} />
      </g>
      {/* the lamp pool */}
      <ellipse cx={330} cy={desk + 20} rx={420} ry={170} fill={C.warm} opacity={0.22 * lampK} style={{mixBlendMode: 'screen'}} />
      {children}
      {/* the desk */}
      <rect x={-200} y={desk} width={1480} height={60} fill={C.oakL} stroke={C.line} strokeWidth={7} data-band="ok" />
      <rect x={-200} y={desk + 60} width={1480} height={900} fill={C.oak} stroke={C.line} strokeWidth={7} data-band="ok" />
      {[120, 560].map((dx) => <g key={dx} data-band="ok"><rect x={dx} y={desk + 120} width={380} height={150} rx={8} fill="#5A3E24" stroke={C.line} strokeWidth={5} /><rect x={dx + 150} y={desk + 180} width={80} height={18} rx={9} fill="#C9A24A" stroke={C.line} strokeWidth={3} /></g>)}
      {Array.from({length: 6}).map((_, i) => <path key={i} d={`M -200,${desk + 300 + i * 110} Q 540,${desk + 120 + i * 110 + 20 * Math.sin(i)} 1280,${desk + 150 + i * 110}`} stroke="#5A3E24" strokeWidth={4} fill="none" data-band="ok" />)}
      {/* the green-shaded lamp */}
      <g transform={`translate(190 ${desk})`}>
        <rect x={-50} y={-14} width={100} height={14} rx={6} fill="#C9A24A" stroke={C.line} strokeWidth={4} />
        <rect x={-6} y={-150} width={12} height={140} fill="#C9A24A" stroke={C.line} strokeWidth={3} />
        <path d="M -90,-150 Q 0,-210 90,-150 Z" fill={C.green} stroke={C.line} strokeWidth={5} />
        <ellipse cx={0} cy={-148} rx={84} ry={10} fill={C.lampL} opacity={lampK} />
      </g>
    </g>
  );
};

/** the inside of the door: plank back, the slot's inner hood, a wire basket under it, a painted 250 line on the wall */
const InsideDoor: React.FC<{f: number; stack?: number; children?: React.ReactNode; basket?: boolean}> = ({f, stack = 0, children, basket = true}) => {
  const lineY = 860;
  return (
    <g>
      <rect data-band="ok" x={-200} y={-200} width={1480} height={2320} fill="#1B1D20" />
      {Array.from({length: 8}).map((_, i) => <rect data-band="ok" key={i} x={-120 + i * 170} y={-200} width={160} height={2320} fill={i % 2 ? '#22201C' : '#26231E'} stroke="#111" strokeWidth={4} />)}
      {/* warm spill from the clerk's room on the left */}
      <polygon points="-200,300 300,500 300,1500 -200,1700" fill={C.warm} opacity={0.12} style={{mixBlendMode: 'screen'}} />
      {/* the slot's inner hood */}
      <g transform="translate(540 430)">
        <rect x={-190} y={-60} width={380} height={120} rx={20} fill={C.gun} stroke={C.line} strokeWidth={7} />
        <rect x={-150} y={-20} width={300} height={44} rx={10} fill="#0B0E12" />
        <path d="M -170,-48 H 160" stroke="#7E8A94" strokeWidth={5} opacity={0.6} />
      </g>
      {/* the painted 250 line */}
      <line x1={140} y1={lineY} x2={940} y2={lineY} stroke={C.paper} strokeWidth={8} strokeDasharray="30 14" />
      {children}
      {/* the wire basket */}
      {basket && <g transform="translate(540 1120)">
        <path d="M -260,-220 L -230,140 H 230 L 260,-220" fill="none" stroke="#9AA4AC" strokeWidth={8} />
        {Array.from({length: 9}).map((_, i) => <line key={i} x1={-230 + i * 57.5} y1={140} x2={-260 + i * 65} y2={-220} stroke="#9AA4AC" strokeWidth={4} />)}
        {Array.from({length: 4}).map((_, i) => <line key={i} x1={-256 + i * 4} y1={-130 + i * 80} x2={256 - i * 4} y2={-130 + i * 80} stroke="#9AA4AC" strokeWidth={4} />)}
        {/* the stack in the basket */}
        {Array.from({length: Math.round(28 * clamp01(stack))}).map((_, i) => (
          <rect key={i} x={-200 + 6 * Math.sin(i * 1.7)} y={120 - i * 9.6} width={400} height={8} fill={i % 3 ? C.paper : C.paperD} stroke={C.line} strokeWidth={1.5} />
        ))}
      </g>}
      {basket && <ContactShadow cx={540} cy={1290} rx={300} ry={26} opacity={0.4} />}
      <rect x={-200} y={1300} width={1480} height={800} fill="#15130F" data-band="ok" />
      <rect x={-200} y={1300} width={1480} height={16} fill="#3A3128" data-band="ok" />
      <ellipse cx={540} cy={1420} rx={320} ry={40} fill="#F6C46A" opacity={0.1} data-band="ok" />
      {[[200, 1640, -8], [800, 1720, 10], [480, 1820, -3]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} data-band="ok">
          <rect x={-80} y={-46} width={170} height={110} fill="#000" opacity={0.3} />
          <rect x={-90} y={-56} width={170} height={110} fill={C.paper} stroke={C.line} strokeWidth={4} />
          {[0, 1, 2, 3].map((j) => <rect key={j} x={-70} y={-36 + j * 22} width={120 - j * 18} height={7} fill={C.paperD} />)}
        </g>
      ))}
    </g>
  );
};

// ---- the shots ---------------------------------------------------------------------------------------------------------------------------------------
const LX = 420; // the letterbox x whenever the draft template is up, so letterbox + template + tag stay inside x 60 to 1020

/** S1, out of the rain a question balloon drifts into the lamp cone and the letterbox gulps it while a pencil sketches a dashed outline beside it */
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const drift = ease(f, 0, 16);
  const gulpAt = 16;
  const open = f < gulpAt ? ease(f, 8, 12) : 1 - ease(f, gulpAt + 6, 8);
  const rattle = f > b(2) && f < b(2) + 14 ? Math.sin((f - b(2)) * 1.9) * (1 - (f - b(2)) / 14) : 0;
  const swallowed = f > gulpAt + 4;
  const sketch = ease(f, 0, 70);
  const cam = track([{t: 0, z: 1.45, fx: 560, fy: 940}, {t: p.dur, z: 1.56, fx: 580, fy: 950}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
      <Plate text="ASK OUT LOUD · IT COUNTS" x={540} y={600} size={40} tone="dark" p={ease(f, 2, 6)} />
      <Plate text="CURRENT RULE · ORAL REQUESTS COUNT" displayLines={['CURRENT RULE · ORAL REQUESTS COUNT', '2 AAC 96.310']} x={540} y={1220} size={34} tone="plate" p={ease(f, b(2) + 4, 6)} />
    </>}>
      <SVG>
        <DoorWorld f={f} sign={false}>
          <g transform={`translate(0 ${rattle * 3})`}>
            <Flap x={LX} y={960} scale={1.05} f={f} face={false} open={open} gulp={swallowed && f < gulpAt + 20 ? 0.6 : 0} faceplate={sketch > 0 ? 1 : 0} sketch={sketch} bolts={0} />
          </g>
          {!swallowed && <Question x={lerp(900, LX + 20, drift)} y={lerp(800, 990, drift)} s={lerp(1.35, 0.8, drift)} f={f} />}
          {/* the pencil sketching the outline */}
          {sketch > 0 && sketch < 0.99 && <g transform={`translate(${LX + 300 + 140 * Math.sin(sketch * 6)} ${840 + 200 * sketch}) rotate(-35)`}>
            <rect x={0} y={-8} width={130} height={16} fill="#8C96A0" stroke={C.line} strokeWidth={3} />
            <path d="M 0,-8 L -24,0 L 0,8 Z" fill="#EBD5A5" stroke={C.line} strokeWidth={3} />
          </g>}
        </DoorWorld>
        <Rain f={f} seed={1} />
        <HeldTravel f={f} x={LX - 220} y={829} w={441} h={262} seed={3} strength={0.34} rx={36} mode="sweep" />
      </SVG>
    </Frame>
  );
};

/** the street across the road: the door small and lit, the person crossing, a near curb with a parked bumper */
const StreetFront: React.FC<{f: number; cross: number}> = ({f, cross}) => (
  <g>
    <rect x={-200} y={1380} width={1480} height={700} fill="#101816" data-band="ok" />
    <rect x={-200} y={1380} width={1480} height={12} fill="#2A3440" data-band="ok" />
    {Array.from({length: 8}).map((_, i) => <rect key={i} x={((i * 170 - f * 2) % 1400) - 100} y={1560 + (i % 3) * 70} width={90} height={7} fill={C.lamp} opacity={0.28} data-band="ok" />)}
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-60 + i * 260} y={1700} width={150} height={16} fill="#E6E0C8" opacity={0.5} data-band="ok" />)}
    {/* the near curb and a parked car's rear in the foreground */}
    <rect x={-200} y={1820} width={1480} height={40} fill="#3A4A5C" stroke={C.line} strokeWidth={5} data-band="ok" />
    <g data-band="ok">
      <path d="M 700,1920 L 720,1760 Q 760,1700 860,1700 H 1100 V 1920 Z" fill="#2E4F66" stroke={C.line} strokeWidth={6} />
      <rect x={760} y={1760} width={60} height={30} rx={6} fill="#E04B3A" opacity={0.8} />
      <path d="M 740,1740 Q 800,1720 900,1722" stroke="#7FA6C0" strokeWidth={4} fill="none" opacity={0.6} />
    </g>
  </g>
);

/** S2, a hard cut across the road: the lit door small in the rain under the lamp and the JUNEAU sign, a person crosses and posts a napkin note */
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cross = easeIO(f, 0, Math.max(10, b(4) - 6));
  const post = ease(f, b(4) - 6, 10);
  const cam = track([{t: 0, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.05, fx: 560, fy: 960}]);
  const px = lerp(980, 640, cross);
  return (
    <Frame p={p} cam={cam} overlay={<>
      <Plate text="JUNEAU · A STATE OFFICE DOOR" x={540} y={600} size={34} tone="dark" p={ease(f, 6, 8)} />
      <Plate displayLines={['CURRENT RULE · 2 AAC 96.310 ·', 'NO DENIAL FOR SKIPPING THE FORM']} text="CURRENT RULE · NO DENIAL FOR SKIPPING THE FORM" x={540} y={1220} size={34} tone="dark" p={ease(f, b(4), 6)} />
    </>}>
      <SVG>
        <g transform="translate(205 260) scale(0.62)">
          <DoorWorld f={f}>
            <Flap x={LX} y={960} scale={1.05} f={f} face={false} open={post > 0.2 && post < 0.95 ? 0.8 : 0} faceplate={1} sketch={0.35} />
          </DoorWorld>
        </g>
        {/* the wall either side of the small door, running to the frame edge */}
        <rect data-band="ok" x={-200} y={260} width={405} height={1120} fill="#2C3846" />
        <rect data-band="ok" x={875} y={260} width={405} height={1120} fill="#2C3846" />
        {Array.from({length: 12}).map((_, r) => <line key={r} x1={-200} y1={300 + r * 90} x2={205} y2={300 + r * 90} stroke="#202A36" strokeWidth={4} />)}
        {Array.from({length: 12}).map((_, r) => <line key={`r${r}`} x1={875} y1={300 + r * 90} x2={1280} y2={300 + r * 90} stroke="#202A36" strokeWidth={4} />)}
        <g transform="translate(0 0)"><rect x={-200} y={-200} width={1480} height={470} fill="#0E1A18" /></g>
        <g transform="translate(0 -60)"><Hillside f={f} /></g>
        <StreetFront f={f} cross={cross} />
        {/* the person crossing to the door, small, then posting */}
        <g transform={`translate(${px} 1390) scale(0.42)`}>
          <Person f={f} x={0} y={0} s={1} hold="note" reach={post} cues={[b(4)]} look={-0.5} />
        </g>
        <Rain f={f} seed={2} cone={false} dense={0.8} />
        <HeldTravel f={f} x={330} y={500} w={420} h={300} seed={4} strength={0.34} rx={10} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S3, a notice slaps onto the wired glass, the hillside reflected in it, and a department tag is pinned under it */
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const slap = ease(f, b(5) + 4, 8);
  const tag = ease(f, b(6), 10);
  const cam = track([{t: 0, z: 1.75, fx: 540, fy: 650}, {t: p.dur, z: 1.82, fx: 540, fy: 660}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
      <Plate text="NOTICE OF PROPOSED CHANGES · NOV 11TH" x={540} y={1080} size={34} tone="dark" p={ease(f, b(5) + 10, 6)} />
      <Plate text="DEPARTMENT OF ADMINISTRATION" x={540} y={1190} size={34} tone="plate" p={ease(f, b(6) + 4, 6)} />
    </>}>
      <SVG>
        <DoorWorld f={f} sign={false} tag={tag} reflect>
          <StrikeProp f={f} at={b(5) + 10} px={540} py={640} lift={90}>
            <g opacity={slap}>
              <g transform="translate(540 620) rotate(-2)">
                <rect x={-150} y={-60} width={300} height={190} fill={C.paper} stroke={C.line} strokeWidth={5} />
                <rect x={-120} y={-44} width={160} height={16} fill={C.ink} />
                {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-120} y={-10 + i * 24} width={i === 0 ? 240 : 200 - i * 14} height={9} fill={C.paperD} />)}
                {[[-150, -60], [150, -60], [-150, 130], [150, 130]].map(([tx, ty], i) => (
                  <rect key={i} x={tx - 18} y={ty - 8} width={36} height={16} fill="#E8DFC0" opacity={clamp01((f - b(5) - 12 - i * 4) / 4)} transform={`rotate(${i % 2 ? 35 : -35} ${tx} ${ty})`} />
                ))}
              </g>
            </g>
          </StrikeProp>
          <Flap x={540} y={960} scale={1.2} f={f} face={false} />
        </DoorWorld>
        <Rain f={f} seed={3} dense={0.6} />
        <HeldTravel f={f} x={380} y={540} w={320} h={210} seed={5} strength={0.36} rx={6} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S4, tracing vellum with a pencilled outline is clipped beside the slot, a service envelope and Tote stop at its line, a blank tag drops */
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const fp = ease(f, b(7), 14);
  const bolts = clamp01((f - b(7) - 14) / 8) * 4;
  const env = easeIO(f, b(8) - 10, 26);
  const roll = easeIO(f, b(9) - 30, 46);
  const toteX = lerp(1250, 900, roll);
  const raise = ease(f, b(9) + 16, 14);
  const tag = ease(f, b(10), 14);
  const push = easeIO(f, b(10) - 6, 34);
  const cam = track([{t: 0, z: 1.1, fx: 600, fy: 980}, {t: b(10) - 6, z: 1.16, fx: 620, fy: 980}, {t: b(10) + 26, z: 1.62, fx: 760, fy: 880}, {t: p.dur, z: 1.68, fx: 760, fy: 880}]);
  return (
    <Frame p={p} cam={cam} overlay={<>
      <Plate text="PROPOSED · A DRAFT, PER JUNEAU EMPIRE" x={540} y={600} size={34} tone="prop" p={ease(f, b(7) + 8, 6) * (1 - push)} />
      <Plate text="PROPOSED · NO THIRD PARTY SERVICES" x={540} y={680} size={34} tone="prop" p={ease(f, b(8) + 4, 6) * (1 - ease(f, b(9) - 4, 6))} />
      <Plate displayLines={['PROPOSED ·', 'NO REQUESTS VIA AUTOMATED TOOLS OR AI']} text="PROPOSED · NO REQUESTS VIA AUTOMATED TOOLS OR AI" x={540} y={1190} size={34} tone="prop" p={ease(f, b(9), 6) * (1 - push)} />
      <Plate text="NOTHING REPORTED SAYS WHY" x={540} y={760} size={36} tone="dark" p={ease(f, b(10) + 10, 6)} />
      <Plate text="HOLD ON TO THAT" x={540} y={1270} size={34} tone="plate" p={ease(f, b(11), 6)} />
    </>}>
      <SVG>
        <DoorWorld f={f} sign={false}>
          <Flap x={LX} y={960} scale={1.05} f={f} face={false} faceplate={fp} sketch={1} bolts={bolts} tag={tag} tagSwing={push} />
          {/* the blank tag folded up behind the right clip until it drops */}
          {tag < 0.05 && fp > 0.5 && <rect x={LX + 1.05 * 420} y={960 - 1.05 * 154} width={30} height={22} fill="#D7DEE2" stroke={C.line} strokeWidth={3} transform={`rotate(12 ${LX + 1.05 * 420} ${960 - 1.05 * 154})`} />}
          {/* the courier service envelope that slides to the line and waits */}
          <g transform={`translate(${lerp(1200, LX + 1.05 * 420, env)} ${1000 + 4 * Math.sin(f / 9)}) rotate(${-6 + settle(f, b(8) + 16, 4)})`} opacity={1 - ease(f, b(9) + 10, 12)}>
            <Envelope x={0} y={0} s={0.8} />
            <rect x={-46} y={-26} width={52} height={22} rx={4} fill="#E3B23C" stroke={C.line} strokeWidth={3} />
            <path d="M -40,-14 h 18 m 4,0 h 14" stroke={C.line} strokeWidth={3} />
          </g>
          <Tote x={toteX} y={1420} scale={1.0} f={f} facing={-1} roll={toteX} lean={roll > 0 && roll < 1 ? -0.4 : 0} emotion={raise > 0.5 ? 'puzzled' : 'eager'} satchelSwing={roll < 1 ? 1 : 0.3} envelope={raise} />
        </DoorWorld>
        <Rain f={f} seed={4} />
        <HeldTravel f={f} x={LX - 220} y={829} w={441} h={262} seed={6} strength={0.34} rx={36} mode="sweep" />
      </SVG>
    </Frame>
  );
};

/** S5, on the clerk's desk a screen boots an official form with the state seal, then folds it into a portal login */
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const boot = ease(f, b(12), 14);
  const fold = easeIO(f, b(47), 16);
  const cursor = Math.floor(f / 12) % 2;
  const cam = track([{t: 0, z: 1.08, fx: 540, fy: 940}, {t: p.dur, z: 1.18, fx: 540, fy: 930}]);
  return (
    <Frame p={p} cam={cam} bg={C.oakD} warmth={0.08} overlay={<>
      <Plate displayLines={['PROPOSED ·', 'OFFICIAL FORMS OR PORTALS ONLY']} text="PROPOSED · OFFICIAL FORMS OR PORTALS ONLY" x={540} y={600} size={34} tone="prop" p={ease(f, b(12) + 6, 6)} />
      <Plate text="FORM · OR PORTAL" x={540} y={1240} size={34} tone="warm" p={ease(f, b(47) + 4, 6)} />
    </>}>
      <SVG>
        <ClerkRoom f={f} desk={1260}>
          <g transform="translate(540 900)">
            <rect x={-330} y={-250} width={660} height={460} rx={22} fill="#1B2228" stroke={C.line} strokeWidth={8} />
            <rect x={-300} y={-222} width={600} height={404} rx={10} fill={boot > 0.5 ? '#EEF2F4' : '#0E1418'} />
            <rect x={-40} y={210} width={80} height={110} fill="#2A2E34" stroke={C.line} strokeWidth={5} />
            <rect x={-160} y={312} width={320} height={26} rx={8} fill="#2A2E34" stroke={C.line} strokeWidth={5} />
            {boot > 0.5 && (
              <g opacity={1 - fold}>
                {/* the official form with the state seal */}
                <circle cx={-220} cy={-160} r={40} fill="none" stroke="#2F5A44" strokeWidth={6} />
                <path d="M -250,-150 l 14,-20 l 12,14 l 14,-22 l 14,28 z" fill="#2F5A44" />
                <rect x={-160} y={-184} width={300} height={22} fill="#3A4652" />
                {[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x={-260} y={-90 + i * 52} width={110} height={14} fill="#9AA4AC" /><rect x={-130} y={-96 + i * 52} width={380} height={28} fill="#FFFFFF" stroke="#9AA4AC" strokeWidth={3} /></g>)}
              </g>
            )}
            {fold > 0.01 && (
              <g opacity={fold} transform={`scale(${lerp(0.6, 1, fold)})`}>
                <rect x={-200} y={-120} width={400} height={240} rx={16} fill="#FFFFFF" stroke="#3A4652" strokeWidth={5} />
                <circle cx={0} cy={-70} r={26} fill="none" stroke="#2F5A44" strokeWidth={5} />
                <rect x={-150} y={-20} width={300} height={36} rx={6} fill="#EEF2F4" stroke="#9AA4AC" strokeWidth={3} />
                <rect x={-150} y={30} width={300} height={36} rx={6} fill="#EEF2F4" stroke="#9AA4AC" strokeWidth={3} />
                {cursor ? <rect x={-140} y={-12} width={4} height={22} fill="#3A4652" /> : null}
                <rect x={-80} y={80} width={160} height={28} rx={8} fill="#2F5A44" />
              </g>
            )}
          </g>
          {/* a keyboard and an in-tray on the desk front */}
          <rect x={260} y={1300} width={560} height={90} rx={12} fill="#2A2E34" stroke={C.line} strokeWidth={5} data-band="ok" />
          {Array.from({length: 10}).map((_, i) => <rect key={i} x={280 + i * 54} y={1316} width={44} height={24} rx={4} fill="#3E444C" data-band="ok" />)}
        </ClerkRoom>
        <HeldTravel f={f} x={240} y={660} w={600} h={400} seed={7} strength={0.34} rx={14} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S6, under the awning a person's phone helper trims a rambling scroll; the person fixes it by hand and carries it to the slot */
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const unroll = ease(f, b(14) - 30, 24);
  const snip = ease(f, b(14), 18);
  const fix = ease(f, b(15), 20);
  const carry = easeIO(f, b(16), 28);
  const cam = track([{t: 0, z: 1.15, fx: 520, fy: 1000}, {t: b(16), z: 1.2, fx: 560, fy: 980}, {t: p.dur, z: 1.28, fx: 600, fy: 980}]);
  const scrollLen = lerp(40, 420, unroll) * (1 - 0.78 * snip);
  return (
    <Frame p={p} cam={cam} overlay={<>
      <Plate text="AN AI HELPER · ILLUSTRATION" x={540} y={600} size={34} tone="dark" p={ease(f, b(13) + 4, 6)} />
      <Plate text="TRIMMED TO ONE QUESTION" x={540} y={680} size={34} tone="dark" p={ease(f, b(14) + 10, 6)} />
      <Plate text="FIXED BY HAND" x={540} y={760} size={34} tone="plate" p={ease(f, b(15) + 6, 6)} />
      <Plate text="CARRIED BY THE PERSON" x={540} y={1250} size={34} tone="plate" p={ease(f, b(16) + 10, 6)} />
    </>}>
      <SVG>
        <DoorWorld f={f} sign={false}>
          <path d="M 200,440 L 880,440 L 940,520 L 140,520 Z" fill="#2F4A3E" stroke={C.line} strokeWidth={6} />
          {Array.from({length: 8}).map((_, i) => <path key={i} d={`M ${150 + i * 100},520 q 50,30 100,0`} fill="#3E5E50" stroke={C.line} strokeWidth={4} />)}
          <Flap x={640} y={960} scale={0.8} f={f} face={false} faceplate={1} sketch={1} bolts={4} tag={1} />
          <Person f={f} x={300} y={1500} s={1.25} hold={carry > 0.05 ? 'note' : 'phone'} reach={carry} cues={[b(13), b(15), b(16)]} look={0.4} />
          {carry < 0.05 && (
            <g transform="translate(500 880)">
              <rect x={-10} y={0} width={190} height={scrollLen} fill={C.paper} stroke={C.line} strokeWidth={4} />
              {Array.from({length: Math.floor(scrollLen / 22)}).map((_, i) => <rect key={i} x={6} y={12 + i * 22} width={150 - (i * 37) % 60} height={8} fill={C.paperD} />)}
              {snip > 0.05 && snip < 0.95 && <path d={`M -20,${scrollLen} l 230,0`} stroke={C.sea} strokeWidth={6} strokeDasharray="10 8" />}
              {fix > 0.05 && <path d="M 6,38 l 120,-10" stroke={C.ink} strokeWidth={5} opacity={fix} />}
              {snip > 0.3 && [0, 1, 2].map((i) => <rect key={i} x={20 + i * 50} y={scrollLen + 30 + Math.max(0, f - b(14)) * (4 + i)} width={40} height={60} fill={C.paperD} stroke={C.line} strokeWidth={2} transform={`rotate(${20 * (i - 1)})`} opacity={1 - ease(f, b(14) + 30, 20)} />)}
            </g>
          )}
          {fix > 0.02 && carry < 0.05 && <g transform={`translate(${560 + 50 * Math.sin(f / 3) * (1 - fix)} 910) rotate(-30)`}>
            <rect x={0} y={-8} width={120} height={16} fill="#8C96A0" stroke={C.line} strokeWidth={3} />
            <path d="M 0,-8 L -22,0 L 0,8 Z" fill="#EBD5A5" stroke={C.line} strokeWidth={3} />
          </g>}
        </DoorWorld>
        <Rain f={f} seed={6} />
        <HeldTravel f={f} x={472} y={860} w={336} h={200} seed={8} strength={0.34} rx={27} mode="sweep" />
      </SVG>
    </Frame>
  );
};

/** S7, macro on the vellum: the folded note presses at the dashed pencil edge, which neither blocks it nor lets it through */
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const glow = ease(f, b(17), 16);
  const press = Math.max(0, Math.sin((f - b(17) - 10) / 9)) * (f > b(17) + 10 ? 1 : 0);
  const cam = track([{t: 0, z: 2.6, fx: 840, fy: 950}, {t: p.dur, z: 3.0, fx: 850, fy: 950}]);
  const edgeX = LX + (236 + 52 + 146) * 1.05;
  return (
    <Frame p={p} cam={cam} overlay={<>
      <Plate text="AUTOMATED TOOL = ?" x={540} y={620} size={44} tone="dark" p={ease(f, b(17) + 4, 6)} />
      <Plate text="NOT DEFINED IN THE REPORT" x={540} y={1250} size={34} tone="plate" p={ease(f, b(18), 6)} />
    </>}>
      <SVG>
        <DoorWorld f={f} sign={false}>
          <Flap x={LX} y={960} scale={1.05} f={f} face={false} faceplate={1} sketch={1} bolts={4} tag={1} dashGlow={glow} cutoutGlow={0.2} />
          <Question x={edgeX + 70 - 16 * press} y={950 + 20 * Math.sin(f / 16)} s={0.5} f={f} fold={1} seed={3} />
          {press > 0.5 && <ellipse cx={edgeX} cy={950} rx={8 + 14 * press} ry={40} fill="none" stroke="#F6C46A" strokeWidth={3} opacity={press - 0.4} />}
        </DoorWorld>
        <Rain f={f} seed={7} dense={0.7} />
        <HeldTravel f={f} x={LX + 248} y={803} w={262} h={336} seed={9} strength={0.36} rx={4} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S8, the camera cranes through the slot: the basket, the DRAFT tape line, a 15 hour candle, an hour meter, the state law plaque */
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const fall = ease(f, b(19) + 10, 24);
  const stack = lerp(0.25, 0.9, ease(f, b(20), 50)) + 0.1 * ease(f, b(42) - 4, 6);
  const stopJolt = settle(f, b(42), 6);
  const candle = ease(f, b(21), 20);
  const tiles = clamp01((f - b(22)) / 24) * 8;
  const flip5 = ease(f, b(22) + 24, 12);
  const plaque = ease(f, b(23), 12);
  const cam = track([{t: 0, z: 1.6, fx: 540, fy: 520}, {t: b(20) - 6, z: 1.05, fx: 540, fy: 960}, {t: p.dur, z: 1.1, fx: 560, fy: 960}]);
  return (
    <Frame p={p} cam={cam} bg="#1B1D20" overlay={<>
      <Plate text="AI ISN'T THE WHOLE DRAFT" x={540} y={880} size={34} tone="dark" p={ease(f, b(19) + 6, 6) * (1 - ease(f, b(20) - 4, 6))} />
      <Plate text="PER JUNEAU EMPIRE" x={540} y={600} size={34} tone="dark" p={ease(f, b(20) + 2, 6) * (1 - ease(f, b(42) - 4, 6))} />
      <Plate displayLines={['PROPOSED ·', 'STOP AT 250 DOCUMENTS OR 15 HOURS']} text="PROPOSED · STOP AT 250 DOCUMENTS OR 15 HOURS" x={540} y={680} size={34} tone="prop" p={ease(f, b(42) + 2, 6) * (1 - ease(f, b(22) - 6, 6))} />
      <Plate text="STAFF HOURS RUN DOWN" x={800} y={1000} size={30} tone="plate" p={ease(f, b(21), 6) * (1 - ease(f, b(22) - 6, 6))} />
      <Plate displayLines={['PROPOSED ·', 'PAST 5 HOURS, PAY FOR ALL OF IT']} text="PROPOSED · PAST 5 HOURS, PAY FOR ALL OF IT" x={540} y={780} size={34} tone="prop" p={ease(f, b(22) + 4, 6)} />
      <Plate displayLines={['STATE LAW · AS 40.25.110(C) ·', 'FEES START PAST 5 HOURS A MONTH']} text="STATE LAW · FEES START PAST 5 HOURS A MONTH" x={540} y={1200} size={30} tone="dark" p={ease(f, b(23) + 4, 6)} />
    </>}>
      <SVG>
        <InsideDoor f={f} stack={stack}>
          {/* the dashed edge's amber glow spilling through the slot from outside */}
          <polygon points="400,450 680,450 760,900 320,900" fill="#F6C46A" opacity={0.1 + 0.04 * Math.sin(f / 8)} style={{mixBlendMode: 'screen'}} />
          {/* the question note caught half in the slot, seen from inside, lit by the dashed edge's glow */}
          <g transform={`translate(560 ${452 + 3 * Math.sin(f / 9)}) rotate(${-4 + 2 * Math.sin(f / 17)})`}>
            <rect x={-60} y={-6} width={120} height={40} fill={C.paper} stroke={C.line} strokeWidth={4} />
            <rect x={-60} y={-6} width={120} height={14} fill="#F6C46A" opacity={0.35} />
          </g>
          {/* the DRAFT masking tape over the 250 line */}
          <g transform={`translate(0 ${stopJolt})`}>
            <rect x={150} y={846} width={780} height={30} fill="#E8DDB5" opacity={0.92} stroke="#B8A979" strokeWidth={2} />
            {[0, 1, 2, 3].map((i) => <g key={i}><rect x={190 + i * 190} y={852} width={90} height={18} fill="none" stroke={C.lead} strokeWidth={2.5} strokeDasharray="6 4" /><path d={`M ${198 + i * 190},866 l 12,-10 m 8,10 l 12,-10 m 8,10 l 12,-10 m 8,10 l 12,-10`} stroke={C.lead} strokeWidth={2.5} /></g>)}
          </g>
          <g transform="translate(830 1130)">
            <rect x={-90} y={0} width={180} height={18} fill="#3A3128" stroke={C.line} strokeWidth={4} />
            <HeldProp f={f} px={0} py={0} w={60} h={200} seed={2} kind="rest">
              <path d={`M -28,0 L -22,${lerp(-180, -150, candle)} Q 0,${lerp(-186, -156, candle)} 22,${lerp(-180, -150, candle)} L 28,0 Z`} fill="#EFE3C4" stroke={C.line} strokeWidth={4} />
              <path d={`M -14,-10 L -10,${lerp(-170, -140, candle)}`} stroke="#FFF8E6" strokeWidth={5} opacity={0.7} />
              {[0, 1, 2].map((i) => <line key={i} x1={-24} y1={-140 + i * 45} x2={24} y2={-140 + i * 45} stroke={C.ink} strokeWidth={3} />)}
              <path d={`M 0,${lerp(-180, -150, candle) - 4} q ${10 * Math.sin(f / 3)},-18 0,-40 q -12,22 0,40`} fill={C.lamp} stroke="#C46A1A" strokeWidth={2} />
              <circle cx={0} cy={lerp(-210, -180, candle)} r={36} fill={C.lampL} opacity={0.25} />
              {candle > 0.3 && <ellipse cx={22} cy={lerp(-150, -60, ease(f, b(21) + 8, 20))} rx={5} ry={8} fill={C.paper} stroke={C.line} strokeWidth={2} />}
            </HeldProp>
          </g>
          <g transform="translate(540 980)" opacity={ease(f, b(22) - 10, 10)}>
            <rect x={-260} y={-60} width={520} height={120} rx={14} fill="#2A2E34" stroke={C.line} strokeWidth={6} />
            {Array.from({length: 8}).map((_, i) => {
              const lit = tiles > i ? 1 : 0;
              const on = i < 5 ? flip5 : lit;
              return <rect key={i} x={-240 + i * 60} y={-40} width={50} height={80} rx={6} fill={on > 0.5 ? C.lamp : lit ? '#6E7C88' : '#3A4048'} stroke={C.line} strokeWidth={3} />;
            })}
          </g>
          {plaque > 0.01 && <g transform={`translate(540 ${1066 + settle(f, b(23) + 6, 4)})`} opacity={plaque}>
            <rect x={-90} y={0} width={180} height={40} rx={4} fill="#8C7A54" stroke={C.line} strokeWidth={3} />
            <path d="M -70,30 l 10,-14 l 14,4 l 10,-12 l 18,6 l 10,-8 l 8,10 l -6,10 l -20,2 l -8,6 z" fill="#5A4A30" />
          </g>}
        </InsideDoor>
        <HeldTravel f={f} x={300} y={880} w={480} h={380} seed={10} strength={0.34} rx={20} mode="sweep" />
      </SVG>
    </Frame>
  );
};

const Timer: React.FC<{h: number; label: string; sand: number; noLabel?: boolean}> = ({h, label, sand, noLabel = false}) => (
  <g>
    <rect x={-90} y={-h / 2 - 20} width={180} height={20} fill={C.oakL} stroke={C.line} strokeWidth={5} />
    <rect x={-90} y={h / 2} width={180} height={20} fill={C.oakL} stroke={C.line} strokeWidth={5} />
    <path d={`M -70,${-h / 2} Q -70,-10 -8,0 Q -70,10 -70,${h / 2} H 70 Q 70,10 8,0 Q 70,-10 70,${-h / 2} Z`} fill="#CFE2EA" opacity={0.5} stroke={C.line} strokeWidth={5} />
    <path d={`M -60,${-h / 2 + 10 + (h / 2 - 20) * sand} H 60 L 8,-4 H -8 Z`} fill="#E3C27A" opacity={0.95} />
    <path d={`M -60,${h / 2} L -60,${h / 2 - (h / 2 - 20) * sand} Q 0,${h / 2 - (h / 2 - 20) * sand - 30} 60,${h / 2 - (h / 2 - 20) * sand} L 60,${h / 2} Z`} fill="#E3C27A" />
    <line x1={0} y1={0} x2={0} y2={h / 2 - 4} stroke="#E3C27A" strokeWidth={3} opacity={sand < 0.98 ? 1 : 0} />
    {!noLabel && <><rect x={-50} y={-30} width={100} height={48} rx={6} fill={C.paper} stroke={C.line} strokeWidth={4} />
    <text x={0} y={4} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} fill={C.ink}>{label}</text></>}
  </g>
);

/** S9, a tall 60 timer turns over and a squat 30 timer with a DRAFT tag is set down beside it */
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const turn = easeIO(f, b(24), 20);
  const slip = ease(f, b(24) + 10, 14);
  const land = ease(f, b(25), 14);
  const cam = track([{t: 0, z: 1.1, fx: 540, fy: 960}, {t: p.dur, z: 1.16, fx: 540, fy: 950}]);
  return (
    <Frame p={p} cam={cam} bg="#1B1D20" overlay={<>
      <Plate displayLines={['CURRENT RULE · 2 AAC 96.340 ·', '60 WORKING DAYS TO APPEAL']} text="CURRENT RULE · 60 WORKING DAYS TO APPEAL" x={540} y={600} size={34} tone="dark" p={ease(f, b(24) + 4, 6)} />
      <Plate displayLines={['PROPOSED ·', 'APPEAL WINDOW 60 TO 30 WORKING DAYS']} text="PROPOSED · APPEAL WINDOW 60 TO 30 WORKING DAYS" x={540} y={1210} size={34} tone="prop" p={ease(f, b(25) + 6, 6)} />
    </>}>
      <SVG>
        <InsideDoor f={f} stack={1} basket={false}>
          <rect x={120} y={1060} width={840} height={30} fill={C.oakL} stroke={C.line} strokeWidth={6} />
          {[200, 880].map((x) => <path key={x} d={`M ${x},1090 l 0,60 l 40,0`} stroke="#5A4A30" strokeWidth={8} fill="none" />)}
          <ContactShadow cx={380} cy={1060} rx={120} ry={12} opacity={0.4} />
          <g transform={`translate(380 900) rotate(${180 * turn})`}>
            <Timer h={280} label="60" sand={clamp01((f - b(24) - 20) / 400)} noLabel />
          </g>
          <g transform="translate(380 1120)"><rect x={-50} y={-4} width={100} height={48} rx={6} fill={C.paper} stroke={C.line} strokeWidth={4} /><text x={0} y={32} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} fill={C.ink}>60</text></g>
          <ContactShadow cx={720} cy={1060} rx={100 * land} ry={12} opacity={0.4} />
          <g transform={`translate(720 ${lerp(700, 960, land) + settle(f, b(25) + 14, 5)})`} opacity={land}>
            <Timer h={160} label="30" sand={0} />
            <g transform={`translate(96 -60) rotate(${8 * Math.sin(f / 13)})`}>
              <line x1={0} y1={0} x2={0} y2={30} stroke="#9AA4AC" strokeWidth={3} />
              <rect x={-46} y={30} width={92} height={36} rx={3} fill={C.vellum} stroke={C.lead} strokeWidth={3} strokeDasharray="6 4" />
              <text x={0} y={56} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={18} fill={C.lead}>DRAFT</text>
            </g>
          </g>
          <g transform={`translate(560 ${lerp(700, 1046, slip)}) rotate(${lerp(-30, -6, slip)})`} opacity={slip}>
            <rect x={-60} y={-16} width={120} height={32} fill={C.paperD} stroke={C.line} strokeWidth={3} />
            <path d="M -40,0 H 40" stroke={C.ink} strokeWidth={4} />
          </g>
          <g transform="translate(860 700)">
            <rect x={-90} y={0} width={180} height={40} rx={4} fill="#8C7A54" stroke={C.line} strokeWidth={3} />
            <path d="M -70,30 l 10,-14 l 14,4 l 10,-12 l 18,6 l 10,-8 l 8,10 l -6,10 l -20,2 l -8,6 z" fill="#5A4A30" />
          </g>
        </InsideDoor>
        <HeldTravel f={f} x={290} y={740} w={180} h={300} seed={11} strength={0.34} rx={20} mode="sweep" />
      </SVG>
    </Frame>
  );
};

/** S10, outside on the green railing two same-size cards slide up and stop level, the residents draft and the statute's words */
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const c1 = ease(f, b(26), 16);
  const c2 = ease(f, b(27), 16);
  const cam = track([{t: 0, z: 1.02, fx: 540, fy: 960}, {t: p.dur, z: 1.04, fx: 540, fy: 960}]);
  const Card: React.FC<{x: number; k: number; dashed?: boolean}> = ({x, k, dashed}) => (
    <g transform={`translate(${x} ${lerp(1260, 940, k) + settle(f, 0, 0)})`} opacity={Math.min(1, k * 2)}>
      <line x1={0} y1={-120} x2={0} y2={180} stroke={C.rail} strokeWidth={10} />
      <ContactShadow cx={0} cy={190} rx={60} ry={8} opacity={0.4} />
      <rect x={-200} y={-120} width={400} height={240} rx={4} fill={dashed ? C.vellum : C.paper} stroke={C.line} strokeWidth={6} strokeDasharray={dashed ? '18 10' : undefined} />
      {[0, 1, 2].map((i) => <rect key={i} x={-160} y={-70 + i * 50} width={320 - i * 50} height={14} fill={dashed ? '#9FB6C4' : C.paperD} />)}
    </g>
  );
  return (
    <Frame p={p} cam={cam} overlay={<>
      <Plate text="PROPOSED · RESIDENTS GET PRIORITY" x={540} y={620} size={34} tone="prop" p={ease(f, b(26) + 8, 6)} />
      <Plate displayLines={['STATE LAW · AS 40.25.120 ·', '"EVERY PERSON HAS A RIGHT TO INSPECT"', '· WITH EXCEPTIONS'] } text={'"EVERY PERSON HAS A RIGHT TO INSPECT"'} x={540} y={1200} size={30} tone="dark" p={ease(f, b(27) + 8, 6)} />
    </>}>
      <SVG>
        {/* low on the steps beside the door: wet stone, the railing running across, a downpipe, rain */}
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2320} fill={C.stone} />
        {Array.from({length: 14}).map((_, r) => <line key={r} x1={-200} y1={r * 140} x2={1280} y2={r * 140} stroke={C.stoneD} strokeWidth={4} />)}
        <rect x={-200} y={-200} width={1480} height={560} fill="#0E1A18" />
        <g transform="translate(0 -80)"><Hillside f={f} /></g>
        <polygon points="0,300 -200,1600 900,1600 300,300" fill={C.lamp} opacity={0.1} />
        <rect data-band="ok" x={980} y={300} width={40} height={1300} fill="#3E4C58" stroke={C.line} strokeWidth={4} />
        {Array.from({length: 4}).map((_, i) => {
          const life = ((f + i * 11) % 30) / 30;
          return <ellipse key={i} cx={1000} cy={1540 + life * 40} rx={6} ry={10} fill="#9FB4C4" opacity={1 - life} />;
        })}
        <path d="M -200,1180 L 1280,1180" stroke={C.rail} strokeWidth={18} />
        <path d="M -200,1180 L 1280,1180" stroke="#7FBFA0" strokeWidth={4} opacity={0.6} />
        {Array.from({length: 7}).map((_, i) => <line key={i} x1={-40 + i * 190} y1={1180} x2={-40 + i * 190} y2={1600} stroke={C.rail} strokeWidth={10} />)}
        <Card x={300} k={c1} dashed />
        <Card x={780} k={c2} />
        {Array.from({length: 4}).map((_, i) => <rect key={i} x={-200} y={1480 + i * 110} width={1480} height={110} fill={i % 2 ? '#2A3440' : '#323D4A'} stroke={C.line} strokeWidth={5} data-band="ok" />)}
        <Rain f={f} seed={8} cone={false} />
        <HeldTravel f={f} x={80} y={800} w={920} h={300} seed={12} strength={0.34} rx={10} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S11, the clerk's warm room: the clerk works the stack, a candle burns down, the placard is turned toward us and flips to the stated aim */
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const work = (f % 50) / 50;
  const lift = Math.sin(work * Math.PI);
  const notch = ease(f, b(29), 16);
  const turn = ease(f, b(30), 16);
  const flip = ease(f, b(31), 14);
  const cam = track([{t: 0, z: 1.1, fx: 540, fy: 980}, {t: p.dur, z: 1.18, fx: 520, fy: 1000}]);
  return (
    <Frame p={p} cam={cam} bg={C.oakD} warmth={0.08} overlay={<>
      <Plate text="THE FAIR CASE FOR THE DRAFT" x={540} y={600} size={34} tone="warm" p={ease(f, b(28) + 4, 6)} />
      <Plate text="STAFF HOURS ARE FINITE" x={540} y={680} size={34} tone="warm" p={ease(f, b(29) + 4, 6)} />
      <Plate text="PER THE FILING, AS REPORTED" x={540} y={1150} size={30} tone="warm" p={ease(f, b(30) + 4, 6) * (1 - ease(f, b(31) - 4, 6))} />
      <Plate text="STATED AIM · EFFICIENCY · NO ADDED COST" x={540} y={1270} size={32} tone="warm" p={ease(f, b(31) + 6, 6)} />
    </>}>
      <SVG>
        <ClerkRoom f={f} desk={1250}>
          <g transform="translate(330 330)">
            <circle r={80} fill={C.paper} stroke={C.line} strokeWidth={7} />
            {Array.from({length: 12}).map((_, i) => <line key={i} x1={0} y1={-66} x2={0} y2={-56} stroke={C.ink} strokeWidth={4} transform={`rotate(${i * 30})`} />)}
            <line x1={0} y1={0} x2={0} y2={-58} stroke={C.ink} strokeWidth={4} transform={`rotate(${f * 1.2})`} />
            <line x1={0} y1={0} x2={0} y2={-40} stroke={C.ink} strokeWidth={7} transform={`rotate(${f * 0.1})`} />
            <circle r={6} fill={C.ink} />
          </g>
          {/* the inside of the street door on the back wall, the note still caught half in its slot */}
          <g transform="translate(80 560)">
            <rect x={-40} y={-40} width={300} height={560} fill={C.door} stroke={C.line} strokeWidth={6} />
            <rect x={40} y={140} width={150} height={40} rx={8} fill={C.gun} stroke={C.line} strokeWidth={4} />
            <g transform={`translate(115 ${150 + 2 * Math.sin(f / 9)}) rotate(-5)`}><rect x={-40} y={-4} width={80} height={28} fill={C.paper} stroke={C.line} strokeWidth={3} /></g>
          </g>
          <Clerk f={f} x={560} y={1260} s={1.25} look={f > b(28) + 6 && f < b(28) + 40 ? -1 : -0.2 + 0.2 * Math.sin(f / 30)} rub={0.22 * lift} cues={[b(28), b(29), b(30), b(31)]} />
        </ClerkRoom>
        {/* the stack with the question note on top, a page lifting off it each cycle */}
        <g transform="translate(330 1250)">
          {Array.from({length: 12}).map((_, i) => <rect key={i} x={-110 + 3 * Math.sin(i)} y={-12 - i * 8} width={220} height={8} fill={i % 2 ? C.paper : C.paperD} stroke={C.line} strokeWidth={1.5} />)}
          <g transform={`translate(${40 * lift} ${-110 - 60 * lift}) rotate(${-14 * lift})`}><rect x={-100} y={0} width={200} height={10} fill={C.paper} stroke={C.line} strokeWidth={2} /></g>
        </g>
        {/* the candle on the desk */}
        <g transform="translate(140 1250)">
          <rect x={-22} y={lerp(-160, -130, notch)} width={44} height={lerp(160, 130, notch)} fill={C.paper} stroke={C.line} strokeWidth={4} />
          {[0, 1, 2].map((i) => <line key={i} x1={-22} y1={-120 + i * 40} x2={22} y2={-120 + i * 40} stroke={C.ink} strokeWidth={3} />)}
          <path d={`M 0,${lerp(-160, -130, notch) - 4} q ${9 * Math.sin(f / 3)},-16 0,-36 q -11,20 0,36`} fill={C.lamp} stroke="#C46A1A" strokeWidth={2} />
          <ContactShadow cx={0} cy={0} rx={40} ry={6} opacity={0.4} />
        </g>
        {/* the placard on its easel, turned toward us, then flipped */}
        <g transform="translate(780 1250)">
          <path d="M -90,0 L -70,-140 M 90,0 L 70,-140" stroke={C.line} strokeWidth={6} />
          <g transform={`translate(0 -150) scale(${lerp(0.2, 1, turn)} 1)`}>
            <rect x={-120} y={0} width={240} height={130} rx={4} fill="#FFF4DC" stroke={C.line} strokeWidth={5} />
            <g transform={`translate(0 65) scale(1 ${Math.abs(Math.cos(flip * Math.PI))}) translate(0 -65)`}>
              {[0, 1, 2].map((i) => <rect key={i} x={-90} y={26 + i * 30} width={180 - i * 30} height={10} fill={flip > 0.5 ? '#2F5A44' : '#C9B48A'} />)}
            </g>
          </g>
        </g>
        <HeldTravel f={f} x={640} y={980} w={280} h={190} seed={13} strength={0.34} rx={8} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** the clerk's forearm and hand reaching into an overhead shot from the bottom edge to (tx, ty) */
const ReachArm: React.FC<{tx: number; ty: number; k: number; from?: [number, number]}> = ({tx, ty, k, from = [540, 2000]}) => {
  if (k <= 0.01) return null;
  const x = lerp(from[0], tx, k), y = lerp(from[1], ty, k);
  const ang = (Math.atan2(y - from[1], x - from[0]) * 180) / Math.PI;
  const len = Math.hypot(x - from[0], y - from[1]);
  return (
    <g>
      <g transform={`translate(${from[0]} ${from[1]}) rotate(${ang})`}>
        <rect x={0} y={-38} width={len} height={76} rx={36} fill="#5E4A6A" stroke={C.line} strokeWidth={6} />
        <path d={`M 20,-24 H ${len - 30}`} stroke="#7E6A8C" strokeWidth={6} opacity={0.7} />
      </g>
      <ellipse cx={x} cy={y} rx={42} ry={36} fill={C.skin} stroke={C.line} strokeWidth={5} />
      <path d={`M ${x - 20},${y + 4} q 20,14 40,0`} stroke="#9A6A4E" strokeWidth={3} fill="none" />
    </g>
  );
};

/** S12, from above the desk the clerk's hand places each thing: a waiver stamp, the calendar at 10, a portrait card into the portal, a dollar request into the tray */
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const cal = ease(f, b(33), 14);
  const portal = ease(f, b(34), 12);
  const card = ease(f, b(34) + 8, 12);
  const slide = easeIO(f, b(43), 26);
  const drop = ease(f, b(35) + 2, 12);
  const rock = settle(f, b(35) + 14, 8, 26);
  const cam = track([{t: 0, z: 1.05, fx: 540, fy: 900}, {t: p.dur, z: 1.18, fx: 520, fy: 1040}]);
  // the hand's targets, beat by beat
  const hand = f < b(33) - 10 ? {k: ease(f, b(32) - 6, 12) * (1 - ease(f, b(32) + 30, 12)), x: 600, y: 860}
    : f < b(34) - 6 ? {k: ease(f, b(33) - 8, 10) * (1 - ease(f, b(33) + 24, 10)), x: 830, y: 560}
    : f < b(43) - 4 ? {k: ease(f, b(34) - 4, 10) * (1 - ease(f, b(34) + 30, 10)), x: 720, y: 1040}
    : {k: ease(f, b(43), 10) * (1 - ease(f, b(35) + 4, 12)), x: lerp(820, 380, slide), y: lerp(1010, 1110, slide)};
  return (
    <Frame p={p} cam={cam} bg={C.oak} warmth={0.08} overlay={<>
      <Plate displayLines={['PROPOSED ·', 'PUBLIC INTEREST WAIVER STAYS']} text="PROPOSED · PUBLIC INTEREST WAIVER STAYS" x={450} y={600} size={34} tone="prop" p={ease(f, b(32), 6) * (1 - ease(f, b(34) - 6, 6))} />
      <Plate displayLines={['10 WORKING DAYS TO RESPOND ·', 'UNCHANGED, PER JUNEAU EMPIRE']} text="10 WORKING DAYS TO RESPOND · UNCHANGED" x={540} y={1180} size={34} tone="warm" p={ease(f, b(33) + 6, 6) * (1 - ease(f, b(34) - 6, 6))} />
      <Plate text="COULD · A KNOWN PERSON BEHIND EACH REQUEST" x={540} y={1270} size={30} tone="warm" p={ease(f, b(34) + 6, 6) * (1 - ease(f, b(43) - 6, 6))} />
      <Plate displayLines={['PROPOSED ·', 'REJECT REQUESTS FOR COMMERCIAL GAIN']} text="PROPOSED · REJECT REQUESTS FOR COMMERCIAL GAIN" x={540} y={700} size={34} tone="prop" p={ease(f, b(43) + 4, 6)} />
      <Plate text="COULD, PER JUNEAU EMPIRE" x={540} y={840} size={30} tone="warm" p={ease(f, b(35) + 4, 6)} />
    </>}>
      <SVG>
        <rect data-band="ok" x={-200} y={-200} width={1480} height={2320} fill={C.oak} />
        {Array.from({length: 12}).map((_, i) => <path key={i} d={`M -200,${i * 180} Q 540,${i * 180 + 30 * Math.sin(i)} 1280,${i * 180 + 10}`} stroke="#5A3E24" strokeWidth={5} fill="none" />)}
        {/* cool window light across the desk with rain running down it, the night carried indoors */}
        <polygon points="620,-100 1280,-100 1280,900 820,700" fill="#9FB4C4" opacity={0.12} />
        {Array.from({length: 7}).map((_, i) => <line key={i} x1={700 + i * 80} y1={((f * 3 + i * 90) % 800) - 100} x2={706 + i * 80} y2={((f * 3 + i * 90) % 800) - 40} stroke="#2A1A0E" strokeWidth={6} opacity={0.25} />)}
        {/* the moving lamp pool */}
        <ellipse cx={360 + 30 * Math.sin(f / 50)} cy={780} rx={460} ry={360} fill={C.warm} opacity={0.2} />
        <path d="M 60,-40 Q 260,160 460,-40 Z" fill={C.green} stroke={C.line} strokeWidth={6} />
        {/* desk furniture in the bands: a blotter edge, a mug, pens, a pad */}
        <rect x={60} y={1480} width={960} height={300} rx={10} fill="#3F2A18" stroke={C.line} strokeWidth={5} data-band="ok" />
        <g data-band="ok" transform="translate(860 1640)"><circle r={70} fill="#E9E1CF" stroke={C.line} strokeWidth={6} /><circle r={50} fill="#3A2614" /><path d="M 68,-10 q 40,0 40,20 q 0,24 -40,24" fill="none" stroke={C.line} strokeWidth={8} /></g>
        {[0, 1, 2].map((i) => <rect key={i} x={160 + i * 40} y={1560} width={14} height={180} rx={6} fill={['#2F5A44', '#3A4652', '#8C6440'][i]} stroke={C.line} strokeWidth={3} transform={`rotate(${-12 + i * 9} ${167 + i * 40} 1650)`} data-band="ok" />)}
        <g transform="translate(300 820) rotate(-8)"><rect x={-90} y={-60} width={180} height={120} fill={C.paperD} stroke={C.line} strokeWidth={4} />{[0, 1, 2].map((i) => <rect key={i} x={-70} y={-36 + i * 26} width={130 - i * 20} height={8} fill="#B9AA88" />)}</g>
        <ContactShadow cx={560} cy={960} rx={140} ry={14} opacity={0.35} />
        <g transform="translate(560 880)">
          <rect x={-120} y={-80} width={240} height={160} fill={C.paper} stroke={C.line} strokeWidth={5} />
          {[0, 1, 2].map((i) => <rect key={i} x={-90} y={-50 + i * 30} width={180 - i * 30} height={10} fill={C.paperD} />)}
          <circle cx={40} cy={30} r={44} fill="none" stroke={C.green} strokeWidth={8} opacity={ease(f, b(32) + 12, 6) * 0.8} />
        </g>
        <StrikeProp f={f} at={b(32) + 12} px={600} py={910} lift={110}>
          <g transform="translate(600 910)" opacity={1 - ease(f, b(32) + 34, 10)}>
            <rect x={-40} y={-120} width={80} height={90} rx={10} fill="#5B3A28" stroke={C.line} strokeWidth={5} />
            <rect x={-56} y={-34} width={112} height={34} rx={6} fill="#2F2A26" stroke={C.line} strokeWidth={5} />
          </g>
        </StrikeProp>
        <ContactShadow cx={830} cy={680} rx={110} ry={14} opacity={0.35} />
        <g transform="translate(830 560)">
          <rect x={-110} y={-100} width={220} height={200} rx={10} fill="#FFF4DC" stroke={C.line} strokeWidth={5} />
          <rect x={-110} y={-100} width={220} height={46} rx={10} fill={C.green} stroke={C.line} strokeWidth={5} />
          <circle cx={-80} cy={-77} r={12} fill="none" stroke="#F3E9D2" strokeWidth={3} />
          <g transform={`translate(0 30) scale(1 ${lerp(0.2, 1, cal)}) translate(0 -30)`}><text x={0} y={56} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={80} fill={C.ink}>10</text></g>
        </g>
        <ContactShadow cx={800} cy={1180} rx={160} ry={16} opacity={0.35} />
        <g transform="translate(800 1080)">
          <rect x={-170} y={-110} width={340} height={220} rx={14} fill="#13202B" stroke={C.line} strokeWidth={6} />
          <rect x={-150} y={-92} width={300} height={184} rx={8} fill={portal > 0.5 ? '#E9EEF0' : '#1A2830'} />
          {portal > 0.5 && <g>
            <circle cx={0} cy={-56} r={18} fill="none" stroke="#2F5A44" strokeWidth={4} />
            <rect x={-110} y={-22} width={220} height={34} rx={6} fill="#FFFFFF" stroke="#9AA4AC" strokeWidth={3} />
            <rect x={-110} y={22} width={220} height={34} rx={6} fill="#FFFFFF" stroke="#9AA4AC" strokeWidth={3} />
            <rect x={-40} y={66} width={80} height={18} rx={6} fill="#2F5A44" />
          </g>}
          {card > 0.01 && <g transform={`translate(-80 ${-5 + settle(f, b(34) + 14, 4)}) scale(${card})`}>
            <rect x={-26} y={-22} width={52} height={44} rx={5} fill={C.paper} stroke={C.line} strokeWidth={3} />
            <circle cx={0} cy={-4} r={9} fill={C.skin} stroke={C.line} strokeWidth={2} />
            <path d="M -16,18 Q 0,4 16,18" fill="#5E4A6A" stroke={C.line} strokeWidth={2} />
          </g>}
        </g>
        {/* the tray and the dollar request sliding across, dropping in, the tray rocking */}
        <g transform={`translate(380 1170) rotate(${rock})`}>
          <ContactShadow cx={0} cy={86} rx={150} ry={14} opacity={0.4} />
          <rect x={-140} y={-40} width={280} height={120} rx={8} fill="#2A2E34" opacity={0.2} stroke="#9AA4AC" strokeWidth={7} />
          {[0, 1, 2, 3].map((i) => <line key={i} x1={-140 + i * 93} y1={-40} x2={-140 + i * 93} y2={80} stroke="#9AA4AC" strokeWidth={3} />)}
          <g transform={`translate(${lerp(440, 0, slide)} ${lerp(-160, -60, slide) + 70 * drop}) rotate(${lerp(-12, 2, slide)})`} opacity={slide > 0 ? 1 : 0}>
            <rect x={-80} y={-46} width={160} height={92} fill={C.paper} stroke={C.line} strokeWidth={4} />
            <text x={0} y={20} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight={900} fontSize={60} fill={C.ink}>$</text>
          </g>
        </g>
        <ReachArm tx={hand.x} ty={hand.y} k={hand.k} from={[700, 2000]} />
        <HeldTravel f={f} x={180} y={720} w={260} h={200} seed={14} strength={0.34} rx={10} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S13, the door in cross-section: outside, a person in a rain shell posts hand-filled forms with a gloved hand while Tote waits; inside, the forms stack to the 250 line beside a dashed ghost IF ALLOWED */
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const open = easeIO(f, b(36), 28);
  const arrive = easeIO(f, b(36) + 4, 30);
  const post = ease(f, b(37) - 14, 12);
  const sheets = Math.round(20 * clamp01((f - b(37) + 6) / 24));
  const ghost = ease(f, b(37) + 10, 14);
  const L1 = ease(f, b(44), 8) * (1 - ease(f, b(44) + 22, 6));
  const L2 = ease(f, b(44) + 24, 8) * (1 - ease(f, b(44) + 46, 6));
  const L3 = ease(f, b(44) + 48, 8);
  const tagIn = ease(f, b(38), 14);
  const cam = track([{t: 0, z: 1.2, fx: 540, fy: 900}, {t: b(36) + 30, z: 1.0, fx: 540, fy: 960}, {t: p.dur, z: 1.04, fx: 540, fy: 950}]);
  const G = 1150; // outside ground line and inside basket floor
  const lineY = G - 280;
  return (
    <Frame p={p} cam={cam} overlay={<>
      <Plate text="PROPOSED CAPS" x={540} y={700} size={34} tone="prop" p={ease(f, b(36) + 4, 6) * (1 - ease(f, b(37) - 6, 6))} />
      <Plate displayLines={['VOLUME · 250 DOCUMENTS,', 'WHATEVER TOOL FILED IT']} text="VOLUME · 250 DOCUMENTS, WHATEVER TOOL FILED IT" x={540} y={1250} size={34} tone="dark" p={ease(f, b(37) + 6, 6) * (1 - ease(f, b(44) - 4, 6))} />
      <Plate text="WHAT DOES THE TOOL LINE ADD?" x={540} y={530} size={36} tone="dark" p={ease(f, b(44) + 4, 6)} />
      <Plate text="NOTHING REPORTED SAYS" x={540} y={620} size={34} tone="plate" p={ease(f, b(38) + 4, 6)} />
    </>}>
      <SVG>
        {/* outside half: night, hillside, lamp, the JUNEAU sign, rain, a step and a street with the lamp's reflection */}
        <rect data-band="ok" x={-200} y={-200} width={720} height={2320} fill={C.night} />
        <g transform="translate(-260 -40) scale(0.9)"><Hillside f={f} /></g>
        <polygon points="40,360 -200,1300 520,1300 200,360" fill={C.lamp} opacity={0.12} />
        <g transform="translate(70 380)"><rect x={-10} y={-34} width={monoW('JUNEAU', 30) + 40} height={56} rx={6} fill={C.green} stroke={C.line} strokeWidth={5} /><text x={10} y={4} fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={1.5} fill="#F3E9D2">JUNEAU</text></g>
        <Rain f={f} seed={9} cone={false} dense={0.5} />
        <rect data-band="ok" x={-200} y={G} width={720} height={130} fill="#2A3440" stroke={C.line} strokeWidth={6} />
        <rect data-band="ok" x={-200} y={G + 130} width={720} height={900} fill="#141D1C" />
        <ellipse data-band="ok" cx={200} cy={G + 300} rx={160} ry={22} fill={C.lamp} opacity={0.25 + 0.08 * Math.sin(f / 9)} />
        {Array.from({length: 5}).map((_, i) => <rect data-band="ok" key={i} x={((i * 150 + f * 1.5) % 760) - 120} y={G + 420 + (i % 3) * 60} width={60} height={6} fill={C.lamp} opacity={0.3} />)}
        {/* the door in section: its thickness, the slot passing through, a sill */}
        <rect data-band="ok" x={500} y={300} width={80} height={G - 300} fill={C.door} stroke={C.line} strokeWidth={8} />
        <rect x={496} y={600} width={88} height={50} fill="#0B0E12" stroke={C.line} strokeWidth={5} />
        <rect data-band="ok" x={470} y={G - 10} width={140} height={30} fill="#4C5E70" stroke={C.line} strokeWidth={5} />
        {/* inside half: warm spill, the tape line, the basket on the floor */}
        <rect data-band="ok" x={580} y={-200} width={700} height={2320} fill="#1E1C19" />
        <polygon points="1280,300 760,460 760,1150 1280,1300" fill={C.warm} opacity={0.12} />
        <rect data-band="ok" x={580} y={G} width={700} height={1000} fill="#15130F" />
        <rect data-band="ok" x={580} y={G} width={700} height={14} fill="#3A3128" />
        {[[700, G + 260, -8], [960, G + 420, 10]].map(([x, y, r], i) => <g data-band="ok" key={i} transform={`translate(${x} ${y}) rotate(${r})`}><rect x={-80} y={-50} width={160} height={100} fill={C.paperD} stroke={C.line} strokeWidth={3} />{[0, 1, 2].map((j) => <rect key={j} x={-60} y={-30 + j * 22} width={100 - j * 16} height={7} fill="#B9AA88" />)}</g>)}
        <rect x={600} y={lineY - 14} width={460} height={28} fill="#E8DDB5" opacity={0.92} stroke="#B8A979" strokeWidth={2} />
        <text x={620} y={lineY - 24} textAnchor="start" fontFamily={MONO} fontWeight={800} fontSize={24} fill={C.paper}>250</text>
        <ContactShadow cx={840} cy={G} rx={230} ry={18} opacity={0.45} />
        {/* the forms stack, rising sheet by sheet to the line */}
        <g transform={`translate(730 ${G - 10})`} opacity={open}>
          {Array.from({length: sheets}).map((_, i) => <rect key={i} x={-80 + 2 * Math.sin(i * 1.3)} y={-i * 13.4} width={160} height={11} fill={i % 3 ? '#FFFFFF' : '#EEF2F4'} stroke={C.line} strokeWidth={1.5} />)}
          {sheets > 0 && <circle cx={-50} cy={-sheets * 13.4 + 4} r={10} fill="none" stroke="#2F5A44" strokeWidth={3} />}
        </g>
        {/* Tote's stack only as a dashed ghost, IF ALLOWED */}
        <g transform={`translate(950 ${G - 10})`} opacity={open * ghost}>
          <rect x={-80} y={-268} width={160} height={268} fill="none" stroke={C.sea} strokeWidth={5} strokeDasharray="16 12" />
          <rect x={-84} y={-250} width={168} height={30} rx={3} fill="#13202B" />
          <text x={0} y={-228} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={C.sea}>IF ALLOWED</text>
        </g>
        <path d={`M 620,${G - 280} L 640,${G} H 1040 L 1060,${G - 280}`} fill="none" stroke="#9AA4AC" strokeWidth={8} opacity={open} />
        {/* outside: the person in a rain shell posting the forms with a gloved hand, Tote waiting */}
        <g transform={`translate(${lerp(-200, 290, arrive)} ${G}) scale(0.58)`}>
          <Person f={f} x={0} y={0} s={1} hold="none" reach={post} cues={[b(37)]} look={0.4} />
        </g>
        <g transform={`translate(${lerp(-200, 290, arrive) + 330 * 0.58 * Math.min(1, post * 1.2) + 70} ${lerp(G - 420, 625, post)}) rotate(-4)`} opacity={arrive > 0.9 ? 1 - ease(f, b(37) + 4, 6) : 0}>
          <rect x={-56} y={-36} width={112} height={72} fill="#FFFFFF" stroke={C.line} strokeWidth={4} />
          <circle cx={-32} cy={-18} r={9} fill="none" stroke="#2F5A44" strokeWidth={3} />
          <ellipse cx={-62} cy={8} rx={26} ry={22} fill="#3E2A1E" stroke={C.line} strokeWidth={4} />
          <path d="M -80,0 q 18,-10 36,0" stroke="#6B4A2E" strokeWidth={3} fill="none" />
        </g>
        <Tote x={lerp(-160, 110, arrive)} y={G} scale={0.78} f={f} facing={1} roll={lerp(-160, 110, arrive)} envelope={arrive} emotion="puzzled" />
        {/* the three labels, one at a time, inside the wall above the line */}
        {[['VOLUME', L1], ['A KNOWN PERSON IF A PORTAL', L2], ['TOOL LINE', L3]].map(([t, k], i) => (
          <g key={i} opacity={k as number} transform={`translate(640 ${lineY - 90})`}>
            <rect x={-10} y={-30} width={monoW(t as string, 20) + 30} height={42} rx={4} fill="#101A17" stroke="#F3E9D2" strokeWidth={3} />
            <text x={5} y={-1} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill="#F3E9D2">{t}</text>
          </g>
        ))}
        {/* the blank tag swinging into the middle */}
        <g transform={`translate(540 ${lerp(160, 420, tagIn)}) rotate(${Math.sin(f / 11) * 10})`} opacity={tagIn}>
          <line x1={0} y1={-90} x2={0} y2={-20} stroke="#9AA4AC" strokeWidth={3} />
          <rect x={-50} y={-20} width={100} height={90} fill={C.tagc} stroke={C.line} strokeWidth={5} />
          <circle cx={0} cy={-4} r={7} fill={C.ink} />
        </g>
        <HeldTravel f={f} x={620} y={G - 300} w={440} h={300} seed={15} strength={0.34} rx={20} mode="shadow" />
      </SVG>
    </Frame>
  );
};

/** S14, over the person's shoulder under the awning: a ruler traces the dashed edge solid, the phone wakes, the counter flicks, the edge breaks back, the balloon holds at the threshold */
const S14: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const trace = easeIO(f, b(39) + 4, 40);
  const back = ease(f, b(40), 14);
  const phone = ease(f, b(45), 16);
  const flick = f > b(46) && f < b(46) + 24 ? Math.sin(((f - b(46)) / 24) * Math.PI) : 0;
  const drift = easeIO(f, b(45), Math.max(20, b(41) - b(45) + 20));
  const reach = easeIO(f, b(46), 30);
  const cam = track([{t: 0, z: 1.3, fx: 640, fy: 930}, {t: p.dur, z: 1.38, fx: 620, fy: 940}]);
  const edgeX = LX + (236 + 52 + 146) * 1.05;
  const rulerY = 960 + (-150 + 62 + 30) * 1.05 + (196 - 30) * 1.05 * trace;
  return (
    <Frame p={p} cam={cam} overlay={<>
      <Plate text="IF DEFINED NARROWLY" x={540} y={600} size={38} tone="dark" p={ease(f, b(39) + 6, 6) * (1 - ease(f, b(46) - 6, 6))} />
      <Plate text="THE HELPER QUESTION" x={540} y={850} size={34} tone="plate" p={ease(f, b(45) + 4, 6) * (1 - ease(f, b(46) - 4, 6))} />
      <Plate text="IT CAN COUNT DOCUMENTS" x={540} y={1270} size={34} tone="plate" p={ease(f, b(46) + 4, 6) * (1 - ease(f, b(40) - 4, 6))} />
      <Plate text="WHERE DOES A TOOL END?" x={540} y={680} size={40} tone="dark" p={ease(f, b(40) + 2, 6) * (1 - ease(f, b(41) - 6, 6))} />
      <Plate text="WHERE WOULD YOU DRAW THE LINE?" x={540} y={760} size={40} tone="plate" p={ease(f, b(41) + 2, 8)} />
    </>}>
      <SVG>
        <DoorWorld f={f} sign={false}>
          <path d="M 200,440 L 880,440 L 940,520 L 140,520 Z" fill="#2F4A3E" stroke={C.line} strokeWidth={6} />
          {Array.from({length: 8}).map((_, i) => <path key={i} d={`M ${150 + i * 100},520 q 50,30 100,0`} fill="#3E5E50" stroke={C.line} strokeWidth={4} />)}
          <Flap x={LX} y={960} scale={1.05} f={f} face={false} faceplate={1} sketch={1} bolts={4} tag={1} dashSolid={trace * (1 - back)} dashGlow={0.25 * (1 - back)} cutoutGlow={0.1} open={drift > 0.6 ? 0.5 : 0} />
          {trace > 0.01 && back < 0.99 && (
            <g transform={`translate(${edgeX + 10} ${rulerY})`} opacity={1 - back}>
              <rect x={0} y={-90} width={34} height={180} rx={4} fill="#C9D2D9" stroke={C.line} strokeWidth={4} />
              {Array.from({length: 9}).map((_, i) => <line key={i} x1={0} y1={-80 + i * 20} x2={14} y2={-80 + i * 20} stroke={C.ink} strokeWidth={3} />)}
            </g>
          )}
          {flick > 0 && <g transform="translate(260 760)" opacity={flick}>
            <rect x={-80} y={-50} width={160} height={90} rx={8} fill="#2A2E34" stroke={C.line} strokeWidth={4} />
            <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} fill={C.paper}>250</text>
            {Array.from({length: 5}).map((_, i) => <rect key={i} x={-70} y={52 + i * 9} width={140} height={7} fill={C.paper} stroke={C.line} strokeWidth={1.2} transform={`rotate(${-25 * flick * (i % 2)} -70 ${52 + i * 9})`} />)}
          </g>}
          {/* the balloon drifting in and holding at the threshold between the open slot and the dashed edge */}
          {/* the person's hand lifting the folded note toward the slot and stopping short of the dashed edge */}
          {/* the note still caught half in the slot */}
          <g transform={`translate(${LX} 990) rotate(-3)`}><rect x={-60} y={-24} width={120} height={36} fill={C.paper} stroke={C.line} strokeWidth={4} /><ContactShadow cx={0} cy={16} rx={50} ry={6} opacity={0.3} /></g>
          {reach > 0.01 && <g transform={`translate(${lerp(200, LX + 40, reach)} ${lerp(1300, 990, reach)}) rotate(${-10 + 4 * Math.sin(f / 14)})`}>
            <rect x={-150} y={-14} width={150} height={46} rx={20} fill={C.shell} stroke={C.line} strokeWidth={5} />
                        <ellipse cx={0} cy={6} rx={22} ry={19} fill={C.skin} stroke={C.line} strokeWidth={4} />
          </g>}
          <Question x={lerp(930, LX + 120, drift)} y={lerp(700, 900, drift)} s={lerp(1.1, 0.8, drift)} f={f} seed={7} />
        </DoorWorld>
        {/* the person's shoulder and hood in the near foreground, the phone rising */}
        <g data-band="ok">
          <path d="M -200,1920 L -200,1360 Q 20,1240 220,1330 Q 330,1390 360,1920 Z" fill={C.shellD} stroke={C.line} strokeWidth={8} />
          <path d="M -40,1330 Q 80,1270 200,1320" stroke={C.shell} strokeWidth={10} fill="none" />
        </g>
        {phone > 0.01 && <g transform={`translate(${lerp(380, 300, phone)} ${lerp(1700, 1260, phone)}) rotate(-10)`}>
          <rect x={-46} y={-80} width={92} height={160} rx={14} fill="#13202B" stroke={C.line} strokeWidth={5} />
          <circle cx={-14} cy={-18} r={8} fill={C.sea} /><circle cx={14} cy={-18} r={8} fill={C.sea} />
          <path d="M -16,10 Q 0,22 16,10" stroke={C.sea} strokeWidth={4} fill="none" />
          <ellipse cx={0} cy={92} rx={30} ry={24} fill={C.skin} stroke={C.line} strokeWidth={4} />
        </g>}
        <Rain f={f} seed={10} />
        <HeldTravel f={f} x={LX + 248} y={803} w={262} h={336} seed={16} strength={0.36} rx={4} mode="shadow" />
      </SVG>
    </Frame>
  );
};

const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13, 14: S14};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

type Beat = {id: number; at: number; label: string};
const Shot: React.FC<{n: number; from: number; dur: number; beats: Beat[]; kicks: number[]}> = ({n, from, dur, beats, kicks}) => {
  const f = useCurrentFrame();
  const b = (id: number) => {
    const x = beats.find((y) => y.id === (IDS[id] ?? id));
    return x ? Math.round(x.at * 30) - from : 0;
  };
  const bt = (id: number) => {
    const x = beats.find((y) => y.id === (IDS[id] ?? id));
    return x ? Math.round(x.at * 30) : 0;
  };
  const Comp = SHOTS[n];
  const p = {f, from, dur, b, kicks, bt};
  return Comp ? <Comp p={p} /> : null;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1115Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1115Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1115: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 6.7, 10.6, 16.9, 31.1, 35.7, 43.5, 49.6, 65.2, 70.7, 78.4, 89.8, 102.9, 115.4, 127.3].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.night}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#101A17" ink="#F3E9D2" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
