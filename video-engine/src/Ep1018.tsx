import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {GradeLayer, INK, ContactShadow, tones, FormGradient} from './lib/lighting';
import {VoiceProvider} from './lib/voice';
import {cameraKick, kickTransform} from './lib/camera';
import {EndCredits} from './lib/EndCredits';
import {assertCropSafe} from './lib/cropsafe';
import {CaptionBar} from './lib/captions';
import {NM, Norm, SkiBoot, PhoneApp, Skier, Workbench, SlopeBG, NightRoom, PaperSet, FloorPlan, Compressor, Ecg, YardBG, Clipboard, ProofCard, SymposiumStage} from './lib/norm';
import {IDS} from './Ep1018Ids';

// WHAT NORM LEARNS, 2026-10-18. Palette roles are art_direction.json. MINT is only Norm (and the band he learned), ALARM RED only where the real thing does not match
// what he remembered, MUSTARD FELT the bench and the 2019 desk. Every painted string is a claims.json on_screen string, a quote, or a plain label. Ronner, Healy and Smith
// appear only as plates, never as drawn people. Norm is a labelled metaphor, never a claim about how any project works beyond what claims.json says.
const W = 1080, H = 1920;
const CAPTION_TOP = 1336;
const CAP_GUARD = CAPTION_TOP - 36;
type Beat = {id: number; at: number; label: string};

const MONO = "'JetBrains Mono', monospace";
const SERIF = 'Fraunces, Georgia, serif';
const C = {ink: INK, paper: NM.paper};
const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
const ease = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const easeIO = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const easeIn = (f: number, a: number, d = 24) =>
  interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
const spring = (f: number, a: number, d = 20) => {
  const t = clamp01((f - a) / d);
  if (t <= 0) return 0;
  return 1 - Math.pow(2, -9 * t) * Math.cos((t * d - 1.2) * 0.9);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** a decaying squash bump that starts at frame a: 0 before, 1 at contact, rebounding with overshoot */
const bump = (f: number, a: number, len = 16) => (f < a ? 0 : Math.max(0, 1 - (f - a) / len) * (0.55 + 0.45 * Math.cos((f - a) / 1.6)));

type SP = {f: number; from: number; dur: number; b: (id: number) => number; kicks: number[]; bt: (id: number) => number};
type SceneProps = {p: SP};

const SVG: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>{children}</svg>
);

type Tone = 'ink' | 'paper' | 'felt' | 'plum' | 'indigo';
const TONES: Record<Tone, {fill: string; fg: string}> = {
  ink: {fill: NM.navy, fg: NM.cream},
  paper: {fill: NM.cream, fg: NM.navy},
  felt: {fill: NM.felt, fg: NM.navy},
  plum: {fill: NM.plum, fg: NM.cream},
  indigo: {fill: NM.indigo, fg: NM.cream},
};

/** THE NAMEPLATE: a mono plate sized to its string by arithmetic, clear of the crop lines and the caption band. */
const Plate: React.FC<{text: string; displayLines?: string[]; x?: number; y: number; size?: number; tone?: Tone; p?: number; rot?: number; drop?: number; dashed?: boolean}> =
({text, displayLines, x = 540, y, size = 30, tone = 'ink', p = 1, rot = 0, drop = 0, dashed = false}) => {
  const ls = displayLines ?? [text];
  const w = Math.min(1020, Math.max(...ls.map((l) => monoW(l, size))) + 56);
  const h = ls.length * (size + 16) + 14;
  const yy = Math.min(y, CAP_GUARD - h / 2);
  assertCropSafe(ls.join(' '), yy - h / 2, yy + h / 2);
  const t = TONES[tone];
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const fr = useCurrentFrame();
  const sc = (0.84 + 0.16 * spring(k * 20, 0, 20)) * (1 + 0.012 * Math.sin(fr / 11 + x * 0.01));
  return (
    <g opacity={Math.min(1, k * 1.6)} transform={`translate(${x} ${yy - drop * (1 - k)}) rotate(${rot}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} rx={6} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={t.fill} stroke={C.ink} strokeWidth={4} />
      {dashed && <rect x={-w / 2 + 7} y={-h / 2 + 7} width={w - 14} height={h - 14} rx={3} fill="none" stroke={t.fg} strokeWidth={2.4} strokeDasharray="10 7" strokeDashoffset={-fr * 0.6} opacity={0.8} />}
      {ls.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 7 + (size + 16) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={800}
          fontSize={size} letterSpacing={1.5} fill={t.fg}>{l}</text>
      ))}
    </g>
  );
};

/** A boxed quote, serif on paper with the attribution under it. `text` is "quote · attribution". */
const QuotePlate: React.FC<{text: string; x?: number; y: number; size?: number; wrap?: number; p?: number; rot?: number}> =
({text, x = 540, y, size = 34, wrap = 30, p = 1, rot = 0}) => {
  const parts = text.split(' · ');
  const by = parts.length > 1 ? parts.slice(1).join(' · ') : undefined;
  const lines: string[] = [];
  let cur = '';
  parts[0].split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > wrap) { lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  const k = clamp01(p);
  if (k <= 0.01) return null;
  const tw = Math.min(1000, Math.max(...lines.map((l) => l.length * size * 0.68), by ? monoW(by, 20) : 0) + 80);
  const th = lines.length * (size + 10) + (by ? 46 : 0) + 36;
  const yy = Math.min(y, CAP_GUARD - th / 2);
  assertCropSafe(lines.join(' '), yy - th / 2, yy + th / 2);
  const sc = 0.6 + 0.4 * spring(k * 18, 0, 18);
  return (
    <g transform={`translate(${x},${yy}) rotate(${rot}) scale(${sc})`} opacity={Math.min(1, k * 2)}>
      <rect x={-tw / 2 + 10} y={-th / 2 + 12} width={tw} height={th} fill="#000" opacity={0.3} />
      <rect x={-tw / 2} y={-th / 2} width={tw} height={th} fill={C.paper} stroke={C.ink} strokeWidth={7} />
      <rect x={-tw / 2 + 11} y={-th / 2 + 11} width={tw - 22} height={th - 22} fill="none" stroke={C.ink} strokeWidth={2.2} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-th / 2 + 22 + size * 0.86 + i * (size + 10)} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={size} fill={C.ink}>{l}</text>
      ))}
      {by && <text x={0} y={th / 2 - 22} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={1} fill={NM.steel}>{by}</text>}
    </g>
  );
};

// ---- the shot frame: push, kick, grade ---------------------------------------------------------
const CHIP = 'ILLUSTRATION';
const Frame: React.FC<{p: SP; z0?: number; z1?: number; zk?: (f: number) => number; dx0?: number; dx1?: number; dy0?: number; dy1?: number; bloom?: number; vignette?: number; ox?: number; oy?: number; tag?: boolean; overlay?: React.ReactNode; tagText?: string; children: React.ReactNode}> =
({p, z0 = 1, z1 = 1.05, zk, dx0 = 0, dx1 = 0, dy0 = 0, dy1 = 0, bloom = 0.05, vignette = 0.28, ox = 540, oy = 900, tag = true, overlay, tagText = CHIP, children}) => {
  const jl = kickTransform(p.f, cameraKick(p.f, p.from, p.dur, p.kicks));
  const t = clamp01(p.f / Math.max(1, p.dur));
  const z = zk ? zk(p.f) : lerp(z0, z1, easeIO(p.f, 0, Math.max(1, p.dur)));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${jl.x + lerp(dx0, dx1, t) + 9 * Math.sin(p.f / 23)}px, ${jl.y + lerp(dy0, dy1, t) + 12 * Math.sin(p.f / 17 + 1)}px) rotate(${0.35 * Math.sin(p.f / 31)}deg) scale(${z * jl.scale * (1 + 0.009 * Math.sin(p.f / 13))})`, transformOrigin: `${ox}px ${oy}px`}}>
        {children}
      </div>
      {overlay && <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{overlay}</svg>}
      {tag && (
        <svg width={W} height={H} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <g data-band="ok">
            <rect x={50} y={436} width={monoW(tagText, 20) + 30} height={38} rx={5} fill="#10151F" stroke={C.paper} strokeWidth={2.4} opacity={0.92} />
            <text x={65} y={462} fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1.5} fill={C.paper}>{tagText}</text>
          </g>
        </svg>
      )}
      <GradeLayer f={p.f} bloom={bloom} vignette={vignette} grain={0.05} warmth={0.02} />
    </AbsoluteFill>
  );
};

/** Norm's cameo in the lower-third near plane, looking up at the action. */
const NormCameo: React.FC<{x?: number; f: number; k?: number; emotion?: 'blank' | 'grin' | 'alarm' | 'proud' | 'worried' | 'sweat' | 'ask' | 'calm' | 'wobbly'; look?: number; scale?: number; dent?: 'none' | 'boot' | 'turn' | 'ring' | 'heart'; dentK?: number; red?: number; unset?: number; id?: string}> =
({x = 170, f, k = 1, emotion = 'calm', look = 0.8, scale = 0.55, dent = 'none', dentK = 0, red = 0, unset = 0, id = 'cam'}) =>
  k > 0 ? (
    <g transform={`translate(0 ${(1 - k) * 300})`}>
      <Norm x={x} y={1960} f={f} scale={scale} emotion={emotion} look={look} dent={dent} dentK={dentK} red={red} redAt="side" unset={unset} id={id} />
    </g>
  ) : null;

const HallBG: React.FC<{f: number; id?: string}> = ({f, id = 'hl'}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B1A44" /><stop offset="1" stopColor="#4A3C78" /></linearGradient>
      <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={NM.lamp} stopOpacity="0.5" /><stop offset="1" stopColor={NM.lamp} stopOpacity="0" /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={1300} fill={`url(#${id}-w)`} />
    {[0, 1, 2].map((i) => <path key={i} data-band="ok" d={`M ${200 + i * 340} 0 L ${60 + i * 340 + 60 * Math.sin(f / 40 + i)} 1240 L ${340 + i * 340 + 60 * Math.sin(f / 40 + i)} 1240 Z`} fill={`url(#${id}-c)`} opacity={0.55} />)}
    <rect data-band="ok" x={-40} y={1240} width={1160} height={720} fill="#2A2457" />
    <rect data-band="ok" x={-40} y={1230} width={1160} height={20} fill={NM.felt} stroke={INK} strokeWidth={5} />
    {Array.from({length: 16}, (_, i) => <circle key={i} data-band="ok" cx={((i * 173 + f * 0.3) % 1200) - 60} cy={120 + ((i * 97) % 900)} r={2 + (i % 3)} fill={NM.lamp} opacity={0.22} />)}
  </g>
);

/** The inspection table: a deep navy blueprint wall with a hard spot pool, and a slate floor. Where Norm is checked against the real thing. */
const InspectBG: React.FC<{f: number; floor?: number; id?: string}> = ({f, floor = 1250, id = 'ib'}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0F1A33" /><stop offset="1" stopColor="#24366A" /></linearGradient>
      <radialGradient id={`${id}-p`} cx="0.5" cy="0.45" r="0.55"><stop offset="0" stopColor="#BFD2FF" stopOpacity="0.55" /><stop offset="1" stopColor="#BFD2FF" stopOpacity="0" /></radialGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={floor + 40} fill={`url(#${id}-w)`} />
    {Array.from({length: 20}, (_, i) => <line key={`v${i}`} data-band="ok" x1={i * 60 - 20} y1={-40} x2={i * 60 - 20} y2={floor} stroke="#5B7BC0" strokeWidth={2} opacity={0.35} />)}
    {Array.from({length: 22}, (_, i) => <line key={`h${i}`} data-band="ok" x1={-40} y1={i * 60 - 10} x2={1120} y2={i * 60 - 10} stroke="#5B7BC0" strokeWidth={2} opacity={0.35} />)}
    <ellipse data-band="ok" cx={540} cy={floor - 140} rx={600} ry={560} fill={`url(#${id}-p)`} />
    <rect data-band="ok" x={-40} y={floor} width={1160} height={760} fill="#2B3A66" />
    <rect data-band="ok" x={-40} y={floor - 12} width={1160} height={26} fill="#16224A" stroke={INK} strokeWidth={5} />
    {Array.from({length: 9}, (_, i) => <line key={i} data-band="ok" x1={540 + (i - 4) * 80} y1={floor + 14} x2={540 + (i - 4) * 240} y2={1960} stroke="#5B7BC0" strokeWidth={2.5} opacity={0.4} />)}
    {Array.from({length: 14}, (_, i) => <circle key={i} data-band="ok" cx={((i * 191 + f * 0.3) % 1200) - 60} cy={160 + ((i * 123) % 900)} r={2 + (i % 3)} fill="#BFD2FF" opacity={0.25} />)}
  </g>
);

const StickyNote: React.FC<{x: number; y: number; rot?: number; f: number; k?: number}> = ({x, y, rot = 0, f, k = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot + 1.2 * Math.sin(f / 9)})`} opacity={k}>
    <rect x={-120} y={-110} width={240} height={240} fill="#000" opacity={0.25} transform="translate(8 10)" />
    <rect x={-120} y={-120} width={240} height={240} fill="#FFE27A" stroke={INK} strokeWidth={6} />
    <rect x={-120} y={-120} width={240} height={36} fill="#F2CC3E" stroke={INK} strokeWidth={4} />
    <text x={0} y={-8} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} letterSpacing={1} fill={NM.navy}>GENERIC</text>
    <text x={0} y={42} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={34} letterSpacing={1} fill={NM.navy}>ADVICE</text>
  </g>
);

const Kettle: React.FC<{x: number; y: number; f: number; scale?: number}> = ({x, y, f, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={6} rx={110} ry={12} opacity={0.4} />
    <path d="M -80 0 L -66 -110 Q 0 -150 66 -110 L 80 0 Z" fill={NM.steelHi} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -50 -100 Q 0 -126 40 -100" fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.5} strokeLinecap="round" />
    <path d="M 66 -96 Q 130 -110 118 -50 L 78 -40" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
    <path d="M -66 -96 Q -130 -140 -120 -80" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
    <circle cx={0} cy={-140} r={12} fill={NM.brass} stroke={INK} strokeWidth={5} />
    {Array.from({length: 3}, (_, i) => {
      const t = ((f / 40 + i / 3) % 1);
      return <ellipse key={i} cx={-100 - 10 * Math.sin(f / 14 + i) - t * 20} cy={-120 - t * 120} rx={14 + t * 20} ry={10 + t * 14} fill="#FFFFFF" opacity={0.45 * (1 - t)} />;
    })}
  </g>
);

const AnchorButton: React.FC<{x: number; y: number; f: number; scale?: number; press?: number; ring?: number}> = ({x, y, f, scale = 1, press = 0, ring = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ContactShadow cx={0} cy={14} rx={170} ry={16} opacity={0.45} />
    {ring > 0 && [0, 1].map((k) => {
      const t = ((f / 36 + k * 0.5) % 1);
      return <ellipse key={k} cx={0} cy={-34} rx={90 + t * 160} ry={40 + t * 60} fill="none" stroke={NM.amberHi} strokeWidth={6} opacity={0.7 * (1 - t) * ring} />;
    })}
    {/* a steel wall plate with rivets and a coil cable, so it reads as a device */}
    <rect x={-130} y={-24} width={260} height={54} rx={10} fill={NM.steel} stroke={INK} strokeWidth={8} />
    <rect x={-130} y={-24} width={260} height={11} rx={5} fill="#FFFFFF" opacity={0.3} />
    {[-108, 108].map((rx) => <circle key={rx} cx={rx} cy={3} r={7} fill={NM.steelHi} stroke={INK} strokeWidth={4} />)}
    <path d="M 130 6 C 190 6 170 -40 230 -20 S 280 20 320 8" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
    {/* the collar and the cap */}
    <rect x={-84} y={-52 + press * 8} width={168} height={34} rx={8} fill={NM.steelDeep} stroke={INK} strokeWidth={7} />
    <path d={`M -70 ${-52 + press * 8} L -70 ${-92 + press * 22} Q 0 ${-124 + press * 22} 70 ${-92 + press * 22} L 70 ${-52 + press * 8} Z`} fill={NM.amber} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <ellipse cx={0} cy={-92 + press * 22} rx={70} ry={20} fill={NM.amberHi} stroke={INK} strokeWidth={7} />
    <path d={`M -40 ${-92 + press * 22} a 40 14 0 0 0 80 0`} fill="none" stroke={NM.brassDeep} strokeWidth={6} strokeLinecap="round" />
    <ellipse cx={-26} cy={-100 + press * 22} rx={22} ry={6} fill="#FFFFFF" opacity={0.7} />
  </g>
);

const FamilyPhone: React.FC<{x: number; y: number; f: number; scale?: number; buzz?: number; label?: string; ghost?: number}> = ({x, y, f, scale = 1, buzz = 0, label = 'FAMILY', ghost = 1}) => (
  <g transform={`translate(${x + (buzz > 0 ? 5 * Math.sin(f * 1.7) * buzz : 0)} ${y}) scale(${scale})`} opacity={ghost}>
    <ContactShadow cx={0} cy={220} rx={140} ry={14} opacity={0.35} />
    <rect x={-120} y={-210} width={240} height={430} rx={34} fill={NM.navy} stroke={INK} strokeWidth={9} />
    <rect x={-102} y={-186} width={204} height={382} rx={20} fill={NM.paper} stroke={INK} strokeWidth={4} />
    <text x={0} y={-130} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} letterSpacing={2} fill={NM.navy}>{label}</text>
    <path d="M -34 40 Q -34 -40 0 -40 Q 34 -40 34 40 L 50 62 L -50 62 Z" fill={NM.brass} stroke={INK} strokeWidth={7} strokeLinejoin="round" transform={`rotate(${buzz > 0 ? 8 * Math.sin(f * 1.5) : 0} 0 -40)`} />
    <circle cx={0} cy={82} r={11} fill={NM.brassDeep} stroke={INK} strokeWidth={5} />
    {buzz > 0 && [0, 1].map((k) => <path key={k} d={`M ${-70 - k * 26} -20 Q ${-86 - k * 26} 20 ${-70 - k * 26} 60 M ${70 + k * 26} -20 Q ${86 + k * 26} 20 ${70 + k * 26} 60`} fill="none" stroke={NM.amberHi} strokeWidth={6} strokeLinecap="round" opacity={buzz * (0.5 + 0.5 * Math.sin(f / 3 + k))} />)}
  </g>
);

const PriceTag: React.FC<{x: number; y: number; f: number; scale?: number; rot?: number}> = ({x, y, f, scale = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot + 2 * Math.sin(f / 8)}) scale(${scale})`}>
    <rect x={-250} y={-110} width={500} height={240} fill="#000" opacity={0.28} transform="translate(10 12)" />
    <path d="M -250 -110 L 190 -110 L 250 -40 L 250 130 L -250 130 Z" fill={NM.cream} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <circle cx={206} cy={-62} r={14} fill={NM.felt} stroke={INK} strokeWidth={5} />
    <path d="M 206 -62 L 206 -230" stroke={INK} strokeWidth={5} />
    <text x={-10} y={-48} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={2} fill={NM.navy}>ESTIMATED OVER</text>
    <text x={-10} y={34} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={66} letterSpacing={2} fill={NM.navy}>$54 BILLION</text>
    <text x={-10} y={96} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={2} fill={NM.steel}>PER ADN</text>
  </g>
);

// ---- S1: a boot presses a blob (beats 1, 2, 3) ----------------------------------------------------------------------------------
const S1: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t1 = b(1), t2 = b(2), t3 = b(3);
  const pop = spring(f, 0, 16);
  const nx = 540, ny = 1190, ns = 1.15;
  // the dent boot sits at (-6,-22) scale 1.18 in Norm space
  const tx = nx - 6 * ns, ty = ny - 22 * ns, tsc = 0.9 * ns;
  const drop = easeIn(f, t2 - 16, 16);
  const lift = ease(f, t2 + 16, 18);
  const by = lerp(-420, ty, drop) - lift * 520;
  const bs = bump(f, t2, 14);
  const dentK = ease(f, t2, 8);
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1100}
      overlay={<>
        <Plate text="WHAT NORM LEARNS" y={530} size={40} tone="felt" p={ease(f, t1 + 2, 8)} />
      </>}>
      <SVG>
        <Workbench f={g} floor={1250} id="s1w" />
        <Norm x={nx} y={ny + (1 - pop) * 60} f={g} scale={ns * (0.7 + 0.3 * pop)} emotion={f < t2 - 4 ? 'blank' : f < t3 ? 'ask' : 'grin'} sq={bs * 0.9} dent="boot" dentK={dentK} look={f > t3 ? 0 : 0.2} id="s1n" />
        {f < t2 + 40 && <SkiBoot x={tx} y={by} f={g} scale={tsc} id="s1b" />}
        {drop < 1 && drop > 0 && <ellipse cx={tx + 30} cy={1252} rx={150 * (0.4 + 0.6 * drop)} ry={14} fill={INK} opacity={0.3 * drop} />}
      </SVG>
    </Frame>
  );
};

// ---- S2: the real boot goes back, and does not fit (beats 4, 5, 6, 8) ------------------------------------------------------------------
const S2: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t4 = b(4), t5 = b(5), t6 = b(6), t7 = b(7), t8 = b(8);
  const hop = ease(f, t4 - 6, 20);
  const nx = lerp(300, 540, hop);
  const ny = 1220 - 120 * Math.sin(hop * Math.PI) * (f < t4 + 20 ? 1 : 0);
  const ns = 1.15;
  const land = bump(f, t4 + 14, 12);
  const slide = ease(f, t6 - 22, 26);
  const bx = lerp(1320, 540 - 6 * ns + 12, slide);
  const bsc = lerp(0.9 * ns, 1.0 * ns, ease(f, t7, 12));
  const redK = ease(f, t8, 8);
  const press = bump(f, t6 + 4, 12);
  const unset = ease(f, t5, 16);
  const ticks = ease(f, t6 + 8, 10) * (1 - ease(f, t7 - 2, 6));
  return (
    <Frame p={p} zk={(ff) => lerp(1.0, 1.14, easeIO(ff, 0, p.dur))} oy={1150}
      overlay={<>
        <Plate text="NORM" y={590} size={44} tone="felt" p={ease(f, t4 + 2, 8) * (f < t5 ? 1 : 0)} />
        <Plate text="NORM · A STAND-IN FOR A MACHINE THAT LEARNS NORMAL" displayLines={['NORM · A STAND-IN FOR', 'A MACHINE THAT LEARNS NORMAL']} y={600} size={28} tone="felt" p={ease(f, t5 + 2, 8) * (f < t6 ? 1 : 0)} />
        <Plate text="PRESS THE REAL BOOT BACK" y={580} size={30} tone="ink" p={ease(f, t6 + 2, 8) * (f < t7 ? 1 : 0)} />
        <Plate text="WHERE IT DOESN'T FIT" y={580} size={32} tone="ink" p={ease(f, t7 + 2, 8)} />
      </>}>
      <SVG>
        <InspectBG f={g} floor={1250} id="s2w" />
        <Norm x={nx} y={ny} f={g} scale={ns} emotion={f < t6 ? (f < t4 + 14 ? 'proud' : 'calm') : f < t8 ? 'ask' : 'alarm'} sq={land * 0.6 + press * 0.5} dent="boot" dentK={1} red={redK} redAt="toe" unset={unset} unsetLabel look={f > t6 ? 0.5 : 0} id="s2n" />
        {f > t6 - 24 && <SkiBoot x={bx} y={1220 - 22 * ns} f={g} scale={bsc} rot={3 * ease(f, t7, 12)} redK={redK} id="s2b" />}
        {ticks > 0 && [0, 1, 2].map((i) => <circle key={i} cx={470 + i * 30} cy={1255 - i * 8} r={9 * ticks} fill={NM.mint} stroke={INK} strokeWidth={3} />)}
      </SVG>
    </Frame>
  );
};

// ---- S3: three projects on a stage (beats 9, 10) ---------------------------------------------------------------------------------------
const S3: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t9 = b(9), t10 = b(10), t11 = b(11);
  const slideIn = ease(f, t9, 18);
  const tiles = ease(f, t10 - 40, 70) * 3;
  const link = ease(f, t11, 24);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000} dx0={-20} dx1={20}
      overlay={<>
        <Plate text="UA AI SYMPOSIUM · SEPTEMBER 25TH TO 27TH" displayLines={['UA AI SYMPOSIUM', 'SEPTEMBER 25TH TO 27TH']} y={560} size={32} tone="indigo" p={ease(f, t9 + 4, 8)} />
        <Plate text="THREE PROJECTS" y={690} size={34} tone="paper" p={ease(f, t10 - 30, 8) * (f < t11 ? 1 : 0)} />
        <Plate text="THE SAME WAY" y={690} size={34} tone="ink" p={ease(f, t11 + 2, 8)} />
      </>}>
      <SVG>
        <HallBG f={g} id="s3h" />
        <SymposiumStage x={lerp(1200, 540, slideIn)} y={1210} f={g} scale={1.2} tiles={tiles} id="s3s" />
        {link > 0 && [0, 1, 2].map((i) => <path key={i} d={`M ${300 + i * 240} 1050 Q ${300 + i * 120} ${1250 + 60 * i} 190 1360`} fill="none" stroke={NM.mint} strokeWidth={7} strokeDasharray="4 14" strokeLinecap="round" pathLength={1} strokeDashoffset={1 - link} opacity={0.9 * link} />)}
        <Norm x={170} y={1500} f={g} scale={0.5} emotion="ask" look={0.7} id="s3n" />
        {Array.from({length: 5}, (_, i) => (
          <g key={i} transform={`translate(${130 + i * 220 + 14 * Math.sin(g / 30 + i)} 1700)`}>
            <ContactShadow cx={0} cy={60} rx={70} ry={10} opacity={0.3} />
            <ellipse cx={0} cy={0} rx={50} ry={60} fill={i % 2 ? NM.plumHi : NM.plum} stroke={INK} strokeWidth={6} />
          </g>
        ))}
      </SVG>
    </Frame>
  );
};

// ---- S4: a ski turn (beats 12, 13, 14) -------------------------------------------------------------------------------------------------
const turnPt = (u: number) => ({x: 330 + 200 * Math.sin(u * Math.PI * 2.4), y: 780 + 470 * u});
const S4: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t12 = b(12), t13 = b(13), t14 = b(14), t15 = b(15), t16 = b(16);
  const run = easeIO(f, t12 - 4, Math.max(40, p.dur - t12 - 30));
  const pt = turnPt(run);
  const pt2 = turnPt(Math.min(1, run + 0.02));
  const lean = Math.max(-1, Math.min(1, (pt2.x - pt.x) / 6));
  const trace = Array.from({length: 40}, (_, i) => turnPt((run * i) / 39));
  const phoneIn = ease(f, t14 - 10, 24);
  const grade = ease(f, t15 - 4, 50) * 3;
  const drill = ease(f, t16 - 4, 18);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000} dx0={20} dx1={-10}
      overlay={<>
        <Plate text="FIRST · A SKI TURN" y={555} size={34} tone="indigo" p={ease(f, t12 + 2, 8) * (f < t13 ? 1 : 0)} />
        <Plate text="FLOWLINE · JAN RONNER · PER ADN" displayLines={['FLOWLINE · JAN RONNER', 'PER ADN']} y={570} size={30} tone="paper" p={ease(f, t13 + 2, 8)} />
        <Plate text="GRADES UPLOADED VIDEO · SUGGESTS DRILLS" displayLines={['GRADES UPLOADED VIDEO', 'SUGGESTS DRILLS']} y={1220} size={26} tone="indigo" p={ease(f, t16 + 2, 10)} />
      </>}>
      <SVG>
        <SlopeBG f={g} ground={1180} id="s4s" />
        <path d={`M ${trace.map((q) => `${q.x} ${q.y + 6}`).join(' L ')}`} fill="none" stroke={NM.roseDeep} strokeWidth={9} strokeDasharray="4 16" strokeLinecap="round" opacity={0.85} />
        {Array.from({length: 7}, (_, i) => <circle key={i} cx={pt.x - lean * 30 - i * 11} cy={pt.y + 4 - (i % 3) * 7} r={3 + (i % 3) * 2} fill="#FFFFFF" opacity={0.6 * (1 - i / 7)} />)}
        <Skier x={pt.x} y={pt.y + 4} f={g} scale={0.95} lean={lean} id="s4k" />
        <g transform={`translate(${lerp(1400, 810, phoneIn)} ${1000 + 8 * Math.sin(g / 14)})`}>
          <PhoneApp x={0} y={0} f={g} scale={0.8} rot={-4} grade={grade} drill={drill} id="s4p" />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S5: generic advice, then one skier's turn (beats 17, 18, 19) -----------------------------------------------------------------------
const S5: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t17 = b(17), t18 = b(18), t19 = b(19), t20 = b(20), t55 = b(55);
  const ns = 1.35;
  const hang = ease(f, t55, Math.max(8, t17 - t55 - 10));
  const slap = easeIn(f, t17 - 10, 10);
  const slide = ease(f, t17 + 14, 22);
  const noteY = lerp(-200, 520, hang) + lerp(0, 520, slap) + slide * 560;
  const noteK = f < t17 + 32 ? 1 : Math.max(0, 1 - (f - t17 - 32) / 6);
  const sqz = bump(f, t17, 10) * 0.5;
  const fly = ease(f, t18 - 8, 22);
  const dentK = ease(f, t18 + 10, 14);
  return (
    <Frame p={p} z0={1.0} z1={1.08} oy={1150}
      overlay={<>
        <QuotePlate text={'"VERY GENERIC" · JAN RONNER'} y={600} size={40} wrap={22} p={ease(f, t17 + 4, 12) * (f < t18 ? 1 : 0)} />
        <Plate text="ONE SKIER'S TURN" y={580} size={34} tone="felt" p={ease(f, t18 + 6, 8) * (f < t19 ? 1 : 0)} />
        <Plate text="LAUNCH PLANNED FOR DECEMBER" y={650} size={28} tone="paper" dashed p={ease(f, t19 + 2, 8)} />
      </>}>
      <SVG>
        <Workbench f={g} floor={1280} id="s5w" />
        <Norm x={540} y={1280} f={g} scale={ns} emotion={f < t17 ? 'calm' : f < t18 ? 'worried' : 'proud'} sq={sqz} dent="turn" dentK={dentK} look={0.3} id="s5n" />
        {noteK > 0 && <StickyNote x={540 + 80 * slide} y={noteY} rot={4 + 30 * slide} f={g} k={noteK} />}
        {f > t20 - 6 && f < t20 + 40 && (
          <g transform={`translate(${lerp(1000, 660, ease(f, t20 - 6, 30))} ${lerp(820, 1170, ease(f, t20 - 6, 30))})`} opacity={1 - ease(f, t20 + 24, 14)}>
            <circle r={46} fill={NM.paper} stroke={INK} strokeWidth={6} />
            <path d="M -26 14 C -10 -20 8 10 26 -18" fill="none" stroke={NM.indigo} strokeWidth={9} strokeLinecap="round" />
          </g>
        )}
        {fly > 0 && fly < 1 && (
          <g transform={`translate(${lerp(560, 0, fly)} ${lerp(-300, 0, fly)})`} opacity={1 - 0.2 * fly}>
            <path d="M 440 1010 C 520 1054 604 1088 534 1138 C 462 1188 504 1230 592 1254" fill="none" stroke={NM.roseDeep} strokeWidth={9} strokeDasharray="4 16" strokeLinecap="round" />
          </g>
        )}
      </SVG>
    </Frame>
  );
};

// ---- S6: a kitchen and one brass button (beats 21) ---------------------------------------------------------------------------------------------
const S6: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t21 = b(21), t22 = b(22), t56 = b(56);
  const glowW = ease(f, t22, 24);
  const qB = ease(f, t22 + 6, 14);
  const press = Math.abs(Math.sin(Math.max(0, f - t21 - 40) / 7)) * (f > t21 + 40 && f < t21 + 80 ? 1 : 0);
  return (
    <Frame p={p} z0={1.02} z1={1.1} oy={1050} dx0={30} dx1={-30}
      overlay={<>
        <Plate text="SECOND · A KITCHEN" y={560} size={34} tone="plum" p={ease(f, t56 + 2, 8) * (f < t21 ? 1 : 0)} />
        <Plate text="ANCHOR · NATHAN HEALY · PER ADN" displayLines={['ANCHOR · NATHAN HEALY', 'PER ADN']} y={570} size={32} tone="plum" p={ease(f, t21 + 4, 8)} />
      </>}>
      <SVG>
        <NightRoom f={g} floor={1240} id="s6r" />
        {/* the counter */}
        <rect data-band="ok" x={-40} y={1010} width={1160} height={34} fill={NM.felt} stroke={INK} strokeWidth={6} />
        <rect data-band="ok" x={-40} y={1044} width={1160} height={220} fill={NM.feltDeep} stroke={INK} strokeWidth={6} />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} data-band="ok" x1={90 + i * 240} y1={1050} x2={90 + i * 240} y2={1260} stroke={INK} strokeWidth={4} opacity={0.4} />)}
        <rect data-band="ok" x={620} y={300} width={300} height={380} rx={8} fill={NM.amberHi} opacity={0.5 * glowW} />
        <Kettle x={170} y={1010} f={g} scale={1.05} />
        <AnchorButton x={560} y={1010} f={g} scale={1.5} press={press} ring={ease(f, t21 + 30, 10)} />
        <g transform="translate(900 1010)">
          <ContactShadow cx={0} cy={4} rx={70} ry={10} opacity={0.4} />
          <path d="M -50 0 L -42 -80 L 42 -80 L 50 0 Z" fill={NM.cream} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <path d="M 42 -64 Q 86 -60 70 -22 L 46 -18" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        </g>
        {qB > 0 && <g transform={`translate(${620} ${800 + 8 * Math.sin(g / 10)}) scale(${0.6 + 0.4 * qB})`} opacity={qB}>
          <ellipse cx={0} cy={0} rx={86} ry={72} fill={NM.cream} stroke={INK} strokeWidth={7} strokeDasharray="14 9" strokeDashoffset={-g * 0.6} />
          <circle cx={-40} cy={78} r={12} fill={NM.cream} stroke={INK} strokeWidth={5} />
          <text x={0} y={30} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={96} fill={NM.navy}>?</text>
        </g>}
      </SVG>
    </Frame>
  );
};

// ---- S7: the plan: sensors, a band, a trace, an alert (beats 25, 26, 27) ----------------------------------------------------------------------------------------
const S7: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t25 = b(25), t26 = b(26), t27 = b(27);
  const sensors = ease(f, t25, 16);
  const band = ease(f, t26, 30);
  const trace = ease(f, t26 + 8, 50);
  const dev = ease(f, t27, 28);
  const buzz = ease(f, t27 + 14, 8);
  const press = f > t25 + 10 && f < t25 + 30 ? Math.abs(Math.sin((f - t25) / 4)) : 0;
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={900}
      overlay={<>
        <Plate text="MOTION SENSORS + ONE BUTTON" y={545} size={30} tone="plum" p={ease(f, t25 + 2, 8) * (f < t26 ? 1 : 0)} />
        <Plate text="LEARNS A SENIOR'S ROUTINES" y={545} size={30} tone="plum" p={ease(f, t26 + 2, 8) * (f < t27 ? 1 : 0)} />
        <Plate text="DESIGNED TO ALERT FAMILY" y={545} size={30} tone="plum" p={ease(f, t27 + 2, 8)} />
        <Plate text="SAFETY THRESHOLD" y={1290} size={26} tone="paper" p={ease(f, t27 + 40, 10)} />
        <Plate text="HOW IT'S DESIGNED" y={1215} size={26} tone="felt" dashed p={ease(f, t25 + 4, 10)} />
      </>}>
      <SVG>
        <rect data-band="ok" x={-40} y={-40} width={1160} height={2000} fill={NM.plum} />
        {Array.from({length: 18}, (_, i) => <line key={`a${i}`} data-band="ok" x1={i * 64 - 20} y1={-40} x2={i * 64 - 20} y2={1960} stroke={NM.plumHi} strokeWidth={2} opacity={0.5} />)}
        {Array.from({length: 32}, (_, i) => <line key={`c${i}`} data-band="ok" x1={-40} y1={i * 64 - 20} x2={1120} y2={i * 64 - 20} stroke={NM.plumHi} strokeWidth={2} opacity={0.5} />)}
        <FloorPlan x={540} y={930} f={g} scale={1.3} sensors={sensors} button={1} band={band} trace={trace} dev={dev} press={press} id="s7f" />
        <FamilyPhone x={920} y={1090} f={g} scale={0.5} buzz={0} ghost={buzz > 0 ? 1 : 0.3} />
        <NormCameo x={160} f={g} emotion={dev > 0.4 ? 'alarm' : 'proud'} look={0.7} scale={0.55} dent="ring" dentK={band} red={dev} id="s7c" />
      </SVG>
    </Frame>
  );
};

// ---- S8: same Norm, higher stakes (beats 28, 29) ------------------------------------------------------------------------------------------------------------------
const S8: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t28 = b(28), t29 = b(29);
  const h1 = ease(f, t28 - 10, 20);
  const h2 = ease(f, t29 - 4, 20);
  const stepTop = [1180, 1040, 900];
  const nx = h2 > 0 ? lerp(570, 830, h2) : lerp(130, 570, h1);
  const topY = h2 > 0 ? lerp(stepTop[1], stepTop[2], h2) : lerp(stepTop[0], stepTop[1], h1);
  const ny = topY - 130 * Math.sin((h2 > 0 ? h2 : h1) * Math.PI);
  const ns = lerp(0.55, 0.9, h2 > 0 ? 0.5 + 0.5 * h2 : 0.5 * h1);
  const land = bump(f, h2 > 0 ? t29 + 16 : t28 + 16, 12);
  const labels = ['SKI TURN', 'A HOME', 'A PIPELINE'];
  const lit = [ease(f, t28 - 20, 8), ease(f, t28 + 8, 8), ease(f, t29 + 8, 8)];
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1100}
      overlay={<>
        <Plate text="SAME NORM" x={330} y={560} size={40} tone="felt" p={ease(f, t28 + 2, 8)} />
        <Plate text="HIGHER STAKES" x={330} y={660} size={36} tone="ink" p={ease(f, t29 + 2, 8)} />
      </>}>
      <SVG>
        <Workbench f={g} floor={1280} id="s8w" lamp={0.8} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={140 + i * 260} y={stepTop[i]} width={270} height={1280 - stepTop[i]} fill={NM.feltDeep} stroke={INK} strokeWidth={8} opacity={0.97} />
            <rect x={140 + i * 260} y={stepTop[i]} width={270} height={22} fill={NM.feltHi} stroke={INK} strokeWidth={6} />
            <rect x={150 + i * 260} y={stepTop[i] + 40} width={250} height={52} rx={6} fill={lit[i] > 0.5 ? NM.cream : NM.felt} stroke={INK} strokeWidth={4} />
            <text x={275 + i * 260} y={stepTop[i] + 76} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={i === 2 ? 22 : 26} letterSpacing={1} fill={NM.navy}>{labels[i]}</text>
          </g>
        ))}
        <Norm x={nx} y={ny} f={g} scale={ns} emotion={f < t29 ? 'proud' : 'worried'} sq={land * 0.7} look={0.4} id="s8n" />
      </SVG>
    </Frame>
  );
};

// ---- S9: a compressor and its dashed twin (beats 30, 31, 32) ------------------------------------------------------------------------------------------------
const S9: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t30 = b(30), t31 = b(31), t32 = b(32), t50 = b(50);
  const arrow = ease(f, t50, 14);
  const twin = ease(f, t32 - 6, 30);
  const apart = ease(f, t32 + 50, 26);
  const cx = lerp(540, 300, apart);
  const tx = lerp(lerp(1300, 540, twin), 790, apart);
  const sc = lerp(0.95, 0.7, apart);
  const scan = f > t32 + 14 && f < t32 + 60 ? (f - t32 - 14) / 46 : -1;
  return (
    <Frame p={p} z0={1.0} z1={1.07} oy={1100}
      overlay={<>
        <Plate text="THIRD · A MACHINE" y={555} size={34} tone="indigo" p={ease(f, t30 + 2, 8) * (f < t31 ? 1 : 0)} />
        <Plate text="AARON SMITH · DIGITAL TWINS OF COMPRESSORS · PER ADN" displayLines={['AARON SMITH · DIGITAL TWINS', 'OF COMPRESSORS · PER ADN']} y={575} size={28} tone="paper" p={ease(f, t31 + 2, 8) * (f < t32 + 40 ? 1 : 0)} />
        <Plate text="A VIRTUAL COPY OF REAL EQUIPMENT" displayLines={['A VIRTUAL COPY', 'OF REAL EQUIPMENT']} y={575} size={30} tone="indigo" p={ease(f, t32 + 44, 8)} />
      </>}>
      <SVG>
        <YardBG f={g} ground={1260} id="s9y" />
        <Compressor x={cx} y={1250} f={g} scale={sc} id="s9c" run={1} glow={0.6} />
        {twin > 0 && <Compressor x={tx} y={1250} f={g} scale={sc} ghost scan={scan} id="s9t" run={1} />}
        {arrow > 0 && apart > 0.8 && <g transform="translate(540 760)" opacity={arrow}><circle r={50} fill={NM.cream} stroke={INK} strokeWidth={7} /><text x={0} y={28} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={80} fill={NM.navy}>?</text></g>}
        {arrow > 0 && <g opacity={arrow}><path d="M 380 760 C 480 700 600 700 700 760" fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" /><path d="M 380 760 C 480 700 600 700 700 760" fill="none" stroke={NM.cream} strokeWidth={14} strokeLinecap="round" /><path d="M 676 724 L 712 764 L 662 786 Z" fill={NM.cream} stroke={INK} strokeWidth={6} strokeLinejoin="round" /></g>}
        <NormCameo x={170} f={g} emotion="ask" look={0.8} scale={0.5} dent="heart" dentK={ease(f, t32, 30)} id="s9n" />
      </SVG>
    </Frame>
  );
};

// ---- S10: the pipeline, its heartbeat, and the price (beats 33, 34, 36) --------------------------------------------------------------------------------------------------
const S10: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t33 = b(33), t34 = b(34), t36 = b(36), t51 = b(51);
  const pipe = ease(f, t33, 44);
  const ecg = ease(f, t34, 34);
  const tag = f >= t51 ? 1 : 0;
  const slow = ease(f, t51, Math.max(10, t36 - t51 - 4));
  const fall = easeIn(f, t36 - 4, 10);
  const sq = bump(f, t36, 14);
  const sag = ease(f, t36 + 6, 20);
  const tagY = lerp(-300, 330, slow) + lerp(0, 700, fall) + 24 * sag;
  return (
    <Frame p={p} zk={(ff) => lerp(1.1, 1.0, easeIO(ff, t36 - 6, 50))} oy={1000}
      overlay={<>
        <Plate text="A PROPOSED GAS PIPELINE" y={555} size={32} tone="indigo" p={ease(f, t33 + 2, 8) * (f < t34 ? 1 : 0)} />
        <QuotePlate text={'"THE HEARTBEAT OF THAT PIPELINE" · AARON SMITH'} y={600} size={38} wrap={24} p={ease(f, t34 + 2, 12) * (f < t36 - 6 ? 1 : 0)} />
        <Plate text="ESTIMATED OVER $54 BILLION · PER ADN" displayLines={['ESTIMATED OVER $54 BILLION', 'PER ADN']} y={600} size={30} tone="paper" p={ease(f, t36 + 8, 8)} />
      </>}>
      <SVG>
        <YardBG f={g} ground={1230} id="s10y" pipe={pipe} />
        <Compressor x={170} y={1260} f={g} scale={0.4} id="s10c" run={1} />
        {ecg > 0 && (
          <g>
            <rect x={90} y={720} width={900} height={250} rx={22} fill={NM.navy} stroke={INK} strokeWidth={8} opacity={0.94} />
            <Ecg x={140} y={850} f={g} w={800} k={ecg} amp={1.3} />
          </g>
        )}
        <Norm x={700} y={1290} f={g} scale={0.85} emotion={f < t36 ? 'worried' : 'sweat'} sq={sq * 0.9 + 0.25 * sag} dent="heart" dentK={1} heartK={ecg} look={-0.4} id="s10n" />
        {tag > 0 && <PriceTag x={700} y={tagY} f={g} scale={0.78} rot={-4} />}
      </SVG>
    </Frame>
  );
};

// ---- S11: the test: one story, no users, no accuracy figures, no pilots (beats 37, 39, 40, 41) ---------------------------------------------------------------------------------------
const S11: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t37 = b(37), t38 = b(38), t39 = b(39), t40 = b(40), t41 = b(41);
  const cb = ease(f, t38 - 6, 24);
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1000}
      overlay={<>
        <Plate text="DO THEY WORK YET?" y={560} size={40} tone="ink" p={ease(f, t37 + 2, 8)} />
      </>}>
      <SVG>
        <PaperSet f={g} floor={1260} id="s11p" />
        {/* the hard lamp */}
        <g transform={`translate(${540 + 14 * Math.sin(g / 30)} 0)`}>
          <line x1={0} y1={-40} x2={0} y2={300} stroke={INK} strokeWidth={6} />
          <path d="M -90 360 L -40 300 L 40 300 L 90 360 Z" fill={NM.steel} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <ellipse cx={0} cy={362} rx={90} ry={12} fill={NM.lamp} stroke={INK} strokeWidth={5} />
        </g>
        <Norm x={290} y={1260} f={g} scale={0.95} emotion={f < t41 ? 'wobbly' : 'worried'} wob={1.6} unset={1} unsetLabel look={0.7} id="s11n" />
        <g transform={`translate(${lerp(1400, 740, cb)} 930)`}>
          <Clipboard x={0} y={0} f={g} scale={0.9} head="ONE STORY" rows={[
            {text: 'NO USERS REPORTED', k: ease(f, t39, 8)},
            {text: 'NO ACCURACY FIGURES', k: ease(f, t40, 8)},
            {text: 'NO PILOTS REPORTED', k: ease(f, t41, 8)},
          ]} id="s11c" size={26} />
        </g>
      </SVG>
    </Frame>
  );
};

// ---- S12: what would count as proof (beats 43, 44, 45) ---------------------------------------------------------------------------------------------------------------------------
const S12: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t43 = b(43), t44 = b(44), t45 = b(45), t57 = b(57);
  const t52 = t45 + 24;
  const st = ease(f, t52, 16);
  return (
    <Frame p={p} z0={1.0} z1={1.05} oy={1000}
      overlay={<>
        <Plate text="SHOWCASE PROJECTS · EARLY IS FAIR" displayLines={['SHOWCASE PROJECTS', 'EARLY IS FAIR']} y={575} size={34} tone="felt" p={ease(f, t57 + 2, 10) * (f < t43 - 6 ? 1 : 0)} />
        <Plate text="WHAT WOULD COUNT AS PROOF" y={560} size={34} tone="paper" p={ease(f, t43 - 6, 10)} />
      </>}>
      <SVG>
        <InspectBG f={g} floor={1260} id="s12p" />
        <ProofCard x={640} y={780} f={g} scale={1} lines={['DECEMBER START', 'THAT HOLDS']} p={ease(f, t43 - 4, 18)} rot={-2 * (1 - st)} size={32} />
        <ProofCard x={640} y={970} f={g} scale={1} lines={['A FIRST HOUSEHOLD', 'FOR ANCHOR']} p={ease(f, t44 - 4, 18)} rot={1.5 * (1 - st)} size={32} />
        <ProofCard x={640} y={1170} f={g} scale={1} lines={['A TWIN CHECKED', 'AGAINST A REAL', 'COMPRESSOR']} p={ease(f, t45 - 4, 18)} rot={-1 * (1 - st)} size={32} />
        <Norm x={170} y={1260} f={g} scale={0.7} emotion={f < t43 ? 'calm' : 'ask'} unset={1} look={0.9} id="s12n" />
      </SVG>
    </Frame>
  );
};

// ---- S13: what would you press (beats 54, 49) ------------------------------------------------------------------------------------------------------------------------------------------
const S13: React.FC<SceneProps> = ({p}) => {
  const {f, b} = p;
  const g = f + p.from;
  const t49 = b(49), t54 = b(54);
  const drop = ease(f, t54, 40);
  const settle = ease(f, t49 - 6, 30);
  const sway = (k: number) => 7 * Math.sin(g / 17 + k);
  const items = [
    {x: 230, top: 300, rest: 760, k: 0},
    {x: 540, top: 240, rest: 680, k: 1.7},
    {x: 850, top: 320, rest: 800, k: 3.1},
  ];
  return (
    <Frame p={p} z0={1.0} z1={1.06} oy={1150}
      overlay={<>
        <Plate text="WHAT WOULD YOU PRESS NORM AGAINST FIRST?" displayLines={['WHAT WOULD YOU PRESS', 'NORM AGAINST FIRST?']} y={560} size={34} tone="felt" p={ease(f, t49 + 2, 10)} />
      </>}>
      <SVG>
        <Workbench f={g} floor={1280} id="s14w" />
        <Norm x={540} y={1280} f={g} scale={1.25} emotion={f < t49 ? 'ask' : 'calm'} unset={1} unsetLabel look={f < t49 ? 0 : 0} id="s14n" />
        {items.map((it, i) => {
          const y = lerp(it.top - 600, it.rest + 90 * settle * 0, drop) ;
          const x = it.x + sway(it.k);
          return (
            <g key={i}>
              <line x1={it.x + sway(it.k) * 0.4} y1={-40} x2={x} y2={y} stroke={INK} strokeWidth={6} />
              {i === 0 && <SkiBoot x={x} y={y + 90} f={g} scale={0.75} rot={sway(it.k)} id="s14b" />}
              {i === 1 && <g transform={`translate(${x} ${y + 130}) rotate(${sway(it.k) * 0.5})`}>
                <ellipse cx={0} cy={-6} rx={70} ry={26} fill={NM.brassDeep} stroke={INK} strokeWidth={7} />
                <path d="M -70 -6 L -70 -44 Q 0 -96 70 -44 L 70 -6" fill={NM.brass} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
                <ellipse cx={0} cy={-44} rx={70} ry={24} fill={NM.brassHi} stroke={INK} strokeWidth={7} />
              </g>}
              {i === 2 && <Compressor x={x} y={y + 220} f={g} scale={0.28} id="s14c" run={1} />}
            </g>
          );
        })}
      </SVG>
    </Frame>
  );
};

// ---- the episode ---------------------------------------------------------------------------------------------------------------------------
const Rough: React.FC<{n: number; title: string; p: SP}> = ({n, title, p}) => (
  <Frame p={p}>
    <SVG>
      <rect x={0} y={0} width={W} height={H} fill={NM.felt} />
      <text x={540} y={900} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={NM.navy}>{`S${n} ${title}`}</text>
    </SVG>
  </Frame>
);
const TITLES: Record<number, string> = {1: 'PRESS', 2: 'FIT', 3: 'STAGE', 4: 'SKI', 5: 'GENERIC', 6: 'KITCHEN', 7: 'PLAN', 8: 'STAKES', 9: 'TWIN', 10: 'PIPELINE', 11: 'TEST', 12: 'PROOF', 13: 'ASK'};
const SHOTS: Record<number, React.FC<SceneProps>> = {1: S1, 2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13};
const SHOT_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

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
  return Comp ? <Comp p={p} /> : <Rough n={n} title={TITLES[n] ?? ''} p={p} />;
};

const captions = z.array(z.object({t: z.number(), d: z.number(), text: z.string()}));

export const ep1018Schema = z.object({
  captions: captions.default([]),
  scenes: z.array(z.object({from: z.number(), dur: z.number()})).optional(),
  total: z.number().optional(),
  beats: z.array(z.object({id: z.number(), at: z.number(), label: z.string()})).optional(),
  kicks: z.array(z.number()).optional(),
  mouth: z.array(z.number()).optional(),
  accents: z.array(z.object({frame: z.number(), word: z.string(), energy: z.number().optional(), lineIdx: z.number().optional()})).optional(),
  credits: z.object({music: z.string(), sources: z.array(z.string()), site: z.string(), seconds: z.number(), frames: z.number()}).optional(),
});
type Props = z.infer<typeof ep1018Schema>;

const FontStyles = () => (
  <style>{`@font-face{font-family:Fraunces;src:url('${staticFile('fonts/Fraunces-Var.ttf')}') format('truetype');font-weight:100 900;font-display:block;}@font-face{font-family:'JetBrains Mono';src:url('${staticFile('fonts/JetBrainsMono-Bold.ttf')}') format('truetype');font-weight:700 800;font-display:block;}`}</style>
);

export const Ep1018: React.FC<Props> = ({captions: cues = [], scenes, beats, kicks = [], credits, mouth = [], accents = []}) => {
  const starts = [0, 5.7, 18.3, 25.8, 43.1, 50.3, 67.6, 71.3, 83.1, 92.5, 102.3, 112, 124].map((x) => Math.round(x * 30));
  const slots = scenes ?? starts.slice(0, -1).map((from, i) => ({from, dur: starts[i + 1] - from}));
  const end = slots[slots.length - 1].from + slots[slots.length - 1].dur;
  const bs = beats ?? [];
  return (
    <VoiceProvider data={{fps: 30, mouth, accents}}>
      <AbsoluteFill style={{backgroundColor: C.ink}}>
        <FontStyles />
        {slots.map((s, i) => (
          <Sequence key={i} from={s.from} durationInFrames={s.dur} name={`S${i + 1}`}>
            <Shot n={SHOT_ORDER[i]} from={s.from} dur={s.dur} beats={bs} kicks={kicks} />
          </Sequence>
        ))}
        <Sequence from={0} durationInFrames={end}><CaptionBar cues={cues} bar="#14213D" ink="#F4EEDC" /></Sequence>
        {credits && (
          <Sequence name="CREDITS" from={end} durationInFrames={credits.frames}>
            <EndCredits data={credits} durationInFrames={credits.frames} />
          </Sequence>
        )}
      </AbsoluteFill>
    </VoiceProvider>
  );
};
