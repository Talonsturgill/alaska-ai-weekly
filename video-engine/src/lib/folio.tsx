import React from 'react';
import {Easing, interpolate} from 'remotion';
import {ContactShadow, FormGradient, INK, tones, paleTones} from './lighting';

// THE FOLIO KIT, 2026-10-20 ("ADL 234762"). One idea drawn as one object: a manila case folder with a face, standing on its edge,
// that is asked to hold nineteen thousand nine hundred fifty acres. It goes thin, fat, hollow and shaken, and its six index tabs are
// the six things a letter says do not exist yet. Around it the small cast that tells the week: a walnut land-office desk, a plan sheet,
// rubber stamps, a receipt, a dotted-pencil data centre, the letter, council signs, a hearing room with an empty witness chair, a
// counter of ready parcel files with a coin stack. Everything is an SVG in the 1080 x 1920 frame at a caller-set x, y and scale,
// every animated value is passed in, and the only strings painted are the ones the caller hands in.
export const FO = {
  manila: '#E8C98A', manilaHi: '#FFF1CC', manilaDeep: '#B98A4E', kraft: '#9A6E3C',
  magenta: '#C2336F', magentaDeep: '#8E1F4E', magentaHi: '#F2A6C6',
  walnut: '#5A3D2B', walnutDeep: '#3B2A20', walnutHi: '#8A6244', green: '#2F6B4F', greenDeep: '#1F4A36', greenHi: '#7FC4A0',
  celadon: '#A9C2BD', celadonHi: '#DDE7E3', slate: '#8FA3A8', slateDeep: '#4F646A', snow: '#EEF2EF', snowShade: '#BFCFCF',
  spruce: '#1F3B33', spruceHi: '#355E50', senate: '#2C3A36', senateHi: '#475C55',
  brass: '#C99A3C', brassHi: '#F0D28A', brassDeep: '#7D5E1C', paper: '#FFFDF4', cream: '#F4EEDC', creamShade: '#D9CFB3',
  navy: '#1D2A2A', lamp: '#FFF1C9', stampRed: '#9E2B25', headlight: '#FFF6C2',
};
export const MONO = "'JetBrains Mono', monospace";
export const SERIF = 'Fraunces, Georgia, serif';
export const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const EZ = Easing.bezier(0.18, 0.76, 0.24, 1);
export const eo = (f: number, a: number, d = 24) => interpolate(f, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EZ});
const hash = (i: number) => {
  let x = (Math.floor(i) + 1020) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
export const rnd = (i: number) => (hash(i) % 10000) / 10000;

const Grad: React.FC<{id: string; base: string; pale?: boolean; softness?: number}> = ({id, base, pale, softness = 0.7}) => (
  <FormGradient id={id} t={pale ? paleTones(base) : tones(base)} softness={softness} />
);

// ---- the hero ----------------------------------------------------------------------------------------------------------------------
export type FolioEmotion = 'blank' | 'alert' | 'worried' | 'hollow' | 'smug' | 'proud' | 'ask' | 'listen' | 'shock';
export const TAB_LABELS = ['TENANT', 'SITE PLAN', 'POWER', 'COOLING', 'WATER', 'SCHEDULE'];
const COVER_W = 360, COVER_H = 500;

/**
 * Folio: a manila case folder standing on its bottom edge. Origin is the bottom centre. thick (0..1) fattens it with a stack of sheets
 * behind the cover, open (0..1) swings the cover on its left hinge to show six empty pockets, tabs (0..6) is how many index tabs have
 * popped out of the right edge (each is a mono label with an empty dashed slot), blank (0..1) draws the magenta dotted outline of what
 * is missing in each revealed slot, rattle (0..1) shakes it, sq flattens it on an impact, pin (0..1) lays a SUBPOENA stamp across the
 * cover, note (0..1) sticks a yellow OCT 26 note to it, look turns the eyes, label is the case number on the tab.
 */
export const Folio: React.FC<{
  x: number; y: number; f: number; scale?: number; emotion?: FolioEmotion; sq?: number; thick?: number; open?: number; tabs?: number; blank?: number;
  rattle?: number; pin?: number; note?: number; look?: number; tilt?: number; id?: string; shadow?: boolean; label?: string; noteText?: string; pinText?: string;
  forest?: number; tabGlow?: number; tabsStand?: number;
}> = ({x, y, f, scale = 1, emotion = 'blank', sq = 0, thick = 0, open = 0, tabs = 0, blank = 1, rattle = 0, pin = 0, note = 0, look = 0, tilt = 0, id = 'fo', shadow = true,
  label = 'ADL 234762', noteText = 'OCT 26', pinText = 'SUBPOENA', forest = 0, tabGlow = 0, tabsStand = 0}) => {
  const ph = x * 0.011;
  const rat = rattle * (Math.sin(f * 1.9 + ph) * 5 + Math.sin(f * 3.1) * 2.5);
  const breathe = Math.sin(f / 31 + ph) * 0.006;
  const sway = Math.sin(f / 23 + ph) * (2.0 + 2.6 * rattle) + Math.sin(f / 61 + ph * 2) * 1.2;
  const bob = Math.abs(Math.sin(f / 52 + ph)) * 0.012;
  const sx = 1 + 0.12 * sq + breathe - bob, sy = 1 - 0.18 * sq - breathe + bob;
  const blink = Math.sin(f / 37 + ph) > 0.965 ? 0.12 : 1;
  const px = look * 11 + Math.sin(f / 47 + ph) * 3.5;
  const py = emotion === 'worried' || emotion === 'hollow' ? 6 : emotion === 'ask' ? -4 : emotion === 'listen' ? 2 : 0;
  const brow = emotion === 'shock' ? -20 : emotion === 'ask' ? -12 : emotion === 'smug' || emotion === 'proud' ? -5 : emotion === 'worried' || emotion === 'hollow' ? 8 : 0;
  const bt = emotion === 'shock' ? -10 : emotion === 'worried' || emotion === 'hollow' ? 12 : emotion === 'smug' ? -8 : 0;
  const mouth = (() => {
    switch (emotion) {
      case 'proud': return 'M -30 6 Q 0 26 30 6';
      case 'smug': return 'M -26 10 Q 4 22 32 2';
      case 'shock': return 'M -18 4 Q 0 -16 18 4 Q 0 24 -18 4';
      case 'worried': return 'M -26 16 Q -10 0 4 14 Q 18 26 28 10';
      case 'hollow': return 'M -24 16 Q 0 4 24 16';
      case 'ask': return 'M -16 10 Q 2 4 20 12';
      case 'listen': return 'M -18 12 L 18 12';
      case 'alert': return 'M -22 10 Q 0 22 22 10';
      default: return 'M -20 12 L 20 12';
    }
  })();
  const k = clamp01(open);
  const coverSX = lerp(1, 0.16, k);
  const nTabs = Math.max(0, Math.min(6, tabs));
  const fat = clamp01(thick);
  const sheets = Math.round(fat * 6);
  const faceX = -COVER_W / 2 + COVER_W * 0.5; // cover-space
  return (
    <g transform={`translate(${x + rat} ${y}) rotate(${tilt + sway} 0 0) scale(${scale})`}>
      <defs>
        <Grad id={`${id}-m`} base={FO.manila} pale softness={0.9} />
        <Grad id={`${id}-k`} base={FO.manilaDeep} softness={0.8} />
        <Grad id={`${id}-p`} base={FO.paper} pale softness={0.8} />
      </defs>
      {shadow && <ContactShadow cx={0} cy={12} rx={COVER_W * 0.62 + fat * 30} ry={22} opacity={0.42} />}
      <g transform={`scale(${sx} ${sy})`}>
        {/* a spruce forest poking out of the folder's mouth: the folder is asked to hold the land */}
        {forest > 0 && (
          <g opacity={clamp01(forest * 1.6)}>
            {Array.from({length: 7}, (_, i) => {
              const tx = -COVER_W / 2 + 36 + i * 50 + 5 * Math.sin(f / 19 + i);
              const th = (60 + (i * 37) % 60 + forest * 70) * (0.5 + 0.5 * clamp01(forest));
              return (
                <path key={i} d={`M ${tx} ${-COVER_H + 8} L ${tx - 22} ${-COVER_H + 8} L ${tx - 10} ${-COVER_H - th * 0.4} L ${tx - 18} ${-COVER_H - th * 0.4} L ${tx} ${-COVER_H - th} L ${tx + 18} ${-COVER_H - th * 0.4} L ${tx + 10} ${-COVER_H - th * 0.4} L ${tx + 22} ${-COVER_H + 8} Z`}
                  fill={i % 2 ? FO.spruce : FO.spruceHi} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
              );
            })}
          </g>
        )}
        {/* the stack of sheets behind the cover (fatness) */}
        {Array.from({length: sheets}, (_, i) => (
          <g key={i} transform={`translate(${14 + i * 9} ${-i * 3})`}>
            <rect x={-COVER_W / 2} y={-COVER_H + 14} width={COVER_W - 20} height={COVER_H - 14} fill={i % 2 ? FO.cream : FO.paper} stroke={INK} strokeWidth={5} />
          </g>
        ))}
        {/* the interior: six pockets, each empty and dotted in magenta */}
        {k > 0.02 && (
          <g opacity={clamp01(k * 2)}>
            <rect x={-COVER_W / 2} y={-COVER_H} width={COVER_W} height={COVER_H} fill={`url(#${id}-p)`} stroke={INK} strokeWidth={7} />
            {TAB_LABELS.map((t, i) => {
              const POCKET: string[][] = [['COMMITTED', 'TENANT'], ['SITE', 'PLAN'], ['POWER', 'SOURCE'], ['COOLING'], ['WATER', 'PLAN'], ['SCHEDULE']];
              const col = i % 2, row = Math.floor(i / 2);
              const px0 = -COVER_W / 2 + 64 + col * 148, py0 = -COVER_H + 52 + row * 146;
              const on = Math.max(0.28, clamp01((nTabs - i) * 1.2));
              return (
                <g key={t} opacity={on}>
                  <rect x={px0} y={py0} width={128} height={112} fill={FO.cream} stroke={INK} strokeWidth={4} />
                  <rect x={px0 + 7} y={py0 + 7} width={114} height={98} fill="none" stroke={FO.magenta} strokeWidth={3.2} strokeDasharray="9 7" strokeDashoffset={-f * 0.5} opacity={blank} />
                  {POCKET[i].map((w, wi) => <text key={wi} x={px0 + 64} y={py0 + 40 + wi * 22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={16} letterSpacing={0.5} fill={FO.navy}>{w}</text>)}
                  <text x={px0 + 64} y={py0 + 92} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={FO.magenta} opacity={blank}>BLANK</text>
                </g>
              );
            })}
          </g>
        )}
        {/* the six index tabs on the right edge: label plus an empty dashed slot */}
        {k < 0.6 && TAB_LABELS.map((t, i) => {
          const on = clamp01(nTabs - i);
          if (on <= 0) return null;
          const ty = -COVER_H + 44 + i * 74;
          const out = on * 190 * (1 - k);
          const wob = Math.sin(f / 9 + i * 1.3) * 2 * rattle;
          return (
            <g key={t} transform={`translate(${COVER_W / 2 - 20} ${ty + wob + tabsStand * (i % 2 ? -9 : 9)})`}>
              <rect x={-4} y={0} width={out} height={60} fill={`url(#${id}-k)`} stroke={INK} strokeWidth={5} />
              {i === 0 && tabGlow > 0 && (
                <g opacity={clamp01(tabGlow)}>
                  <rect x={-14} y={-10} width={out + 20} height={80} fill={FO.headlight} opacity={0.35} />
                  <rect x={-8} y={-4} width={out + 8} height={68} fill="none" stroke={FO.headlight} strokeWidth={5} strokeDasharray="10 7" strokeDashoffset={-f * 0.8} />
                </g>
              )}
              {on > 0.6 && <>
                <text x={34} y={37} fontFamily={MONO} fontWeight={800} fontSize={t.length > 6 ? 21 : 24} letterSpacing={0.5} fill={FO.navy}>{t}</text>
                <rect x={out - 34} y={14} width={20} height={32} fill="none" stroke={FO.magenta} strokeWidth={3.5} strokeDasharray="6 5" strokeDashoffset={-f * 0.6} opacity={blank} />
              </>}
            </g>
          );
        })}
        {/* the cover, hinged on its left edge */}
        <g transform={`translate(${-COVER_W / 2} 0) scale(${coverSX} 1) translate(${COVER_W / 2} 0)`}>
          <rect x={-COVER_W / 2} y={-COVER_H} width={COVER_W} height={COVER_H} fill={`url(#${id}-m)`} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
          {/* the top tab with the case number */}
          <g opacity={clamp01(1 - k * 3)}>
            <path d={`M ${-COVER_W / 2} ${-COVER_H} L ${-COVER_W / 2} ${-COVER_H - 46} L ${-COVER_W / 2 + 190} ${-COVER_H - 46} L ${-COVER_W / 2 + 214} ${-COVER_H} Z`} fill={`url(#${id}-k)`} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
            <text x={-COVER_W / 2 + 18} y={-COVER_H - 12} fontFamily={MONO} fontWeight={900} fontSize={25} letterSpacing={1} fill={FO.navy}>{label}</text>
          </g>
          <path d={`M ${-COVER_W / 2 + 12} ${-COVER_H + 14} L ${COVER_W / 2 - 12} ${-COVER_H + 14}`} stroke={FO.manilaHi} strokeWidth={6} opacity={0.7} strokeLinecap="round" />
          <rect x={COVER_W / 2 - 22} y={-COVER_H} width={22} height={COVER_H} fill={FO.manilaDeep} opacity={0.3} />
          {/* the face */}
          <g transform={`translate(${faceX - 4} ${-COVER_H * 0.62})`} opacity={clamp01(1 - k * 1.6)}>
            {[-1, 1].map((s) => (
              <g key={s} transform={`translate(${s * 62} 0)`}>
                <ellipse cx={0} cy={0} rx={34} ry={38 * blink} fill="#FFFFFF" stroke={INK} strokeWidth={5.5} />
                {blink > 0.5 && <>
                  <circle cx={px} cy={py} r={14} fill={INK} />
                  <circle cx={px + 5} cy={py - 6} r={4.6} fill="#FFFFFF" />
                </>}
                <path d="M -28 -48 L 28 -48" stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`translate(0 ${brow}) rotate(${s * bt} 0 -48)`} />
              </g>
            ))}
            <path d={mouth} transform="translate(0 74)" fill={emotion === 'shock' ? INK : 'none'} stroke={INK} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {/* a PRELIMINARY label-strip on the cover (always true) */}
          <g transform={`translate(0 ${-COVER_H + 400})`} opacity={clamp01(1 - k * 1.6)}>
            <rect x={-COVER_W / 2 + 26} y={0} width={COVER_W - 52} height={44} fill="none" stroke={FO.navy} strokeWidth={3} strokeDasharray="8 6" opacity={0.55} />
            <text x={0} y={30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={3} fill={FO.navy} opacity={0.6}>PRELIMINARY</text>
          </g>
          {/* a wet smudge-ready ink dot where stamps land */}
          {pin > 0 && (
            <g opacity={clamp01(pin * 1.4)} transform={`translate(0 ${-COVER_H * 0.3}) rotate(-9) scale(${0.7 + 0.3 * clamp01(pin)})`}>
              <rect x={-150} y={-36} width={300} height={72} fill="none" stroke={FO.stampRed} strokeWidth={8} />
              <rect x={-142} y={-28} width={284} height={56} fill="none" stroke={FO.stampRed} strokeWidth={2.5} />
              <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={44} letterSpacing={4} fill={FO.stampRed}>{pinText}</text>
            </g>
          )}
        </g>
        {/* the sticky note */}
        {note > 0 && (
          <g transform={`translate(${-60} ${-200}) rotate(${6 + 2 * Math.sin(f / 13)}) scale(${0.62 * (0.5 + 0.5 * clamp01(note))})`} opacity={clamp01(note * 2)}>
            <rect x={-96} y={-86} width={192} height={192} fill="#000" opacity={0.25} transform="translate(7 9)" />
            <rect x={-96} y={-96} width={192} height={192} fill="#FFF1CC" stroke={INK} strokeWidth={6} />
            <rect x={-96} y={-96} width={192} height={30} fill={FO.brass} stroke={INK} strokeWidth={4} />
            <NoteWords text={noteText} />
          </g>
        )}
      </g>
    </g>
  );
};

// ---- worlds -------------------------------------------------------------------------------------------------------------------------
/** The land-office desk: a walnut wall, a banker's lamp throwing a pool, a desk edge with a blotter and a pencil, and the dust in the lamp. */
export const DeskBG: React.FC<{f: number; desk?: number; id?: string; chair?: boolean; lamp?: number; chairSwing?: number}> = ({f, desk = 1180, id = 'dk', chair = true, lamp = 0.12, chairSwing = 0}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={FO.walnutDeep} /><stop offset="1" stopColor={FO.walnut} /></linearGradient>
      <radialGradient id={`${id}-p`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={FO.lamp} stopOpacity="0.7" /><stop offset="1" stopColor={FO.lamp} stopOpacity="0" /></radialGradient>
      <linearGradient id={`${id}-d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={FO.walnutHi} /><stop offset="1" stopColor={FO.walnut} /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={desk + 40} fill={`url(#${id}-w)`} />
    {/* wainscot panels */}
    {Array.from({length: 4}, (_, i) => <rect key={i} data-band="ok" x={40 + i * 262} y={desk - 560} width={230} height={480} fill="none" stroke={FO.walnutHi} strokeWidth={5} opacity={0.5} />)}
    {/* the framed plat on the wall */}
    <g data-band="ok" transform={`translate(350 ${desk - 870}) rotate(${-0.6 + Math.sin(f / 60) * 0.3})`}>
      <rect x={-110} y={-80} width={220} height={160} fill={FO.cream} stroke={INK} strokeWidth={8} />
      {Array.from({length: 5}, (_, i) => <line key={i} x1={-96} y1={-60 + i * 30} x2={96} y2={-60 + i * 30} stroke={FO.slate} strokeWidth={2.5} />)}
      {Array.from({length: 6}, (_, i) => <line key={i} x1={-96 + i * 38} y1={-66} x2={-96 + i * 38} y2={64} stroke={FO.slate} strokeWidth={2.5} />)}
    </g>
    {chair && (
      <g data-band="ok" transform={`translate(900 ${desk - 20}) rotate(${chairSwing + 1.2 * Math.sin(f / 37)} 0 -10)`}>
        <ContactShadow cx={0} cy={6} rx={92} ry={12} opacity={0.4} />
        <rect x={-70} y={-310} width={140} height={200} fill={FO.walnutHi} stroke={INK} strokeWidth={7} />
        <rect x={-70} y={-120} width={140} height={26} fill={FO.walnut} stroke={INK} strokeWidth={7} />
        <rect x={-62} y={-96} width={14} height={92} fill={FO.walnut} stroke={INK} strokeWidth={6} />
        <rect x={48} y={-96} width={14} height={92} fill={FO.walnut} stroke={INK} strokeWidth={6} />
      </g>
    )}
    <ellipse data-band="ok" cx={540} cy={desk - 140} rx={620} ry={520} fill={`url(#${id}-p)`} opacity={lamp} />
    {lamp > 0.4 && <rect data-band="ok" x={-40} y={-40} width={1160} height={desk + 40} fill={FO.lamp} opacity={0.16 * lamp} />}
    {/* flat celadon window light off the Houston snow, a tall soft shaft from upper left */}
    <path data-band="ok" d={`M -40 -40 L 360 -40 L 760 ${desk} L 120 ${desk} Z`} fill={FO.celadonHi} opacity={0.2 - 0.14 * lamp} />
    <rect data-band="ok" x={-40} y={-40} width={1160} height={desk + 40} fill={FO.celadon} opacity={0.14 * (1 - lamp)} />
    <rect data-band="ok" x={-40} y={desk} width={1160} height={800} fill={`url(#${id}-d)`} />
    <rect data-band="ok" x={-40} y={desk - 12} width={1160} height={26} fill={FO.walnutDeep} stroke={INK} strokeWidth={5} />
    {/* the blotter, a pencil, and the grain of the desk */}
    <rect data-band="ok" x={250} y={desk + 230} width={580} height={250} fill={FO.green} stroke={INK} strokeWidth={6} opacity={0.9} />
    <rect data-band="ok" x={250} y={desk + 230} width={580} height={250} fill="none" stroke={FO.greenHi} strokeWidth={3} opacity={0.4} transform="translate(8 8)" />
    <g data-band="ok" transform={`translate(150 ${desk + 330})`}>
      <ContactShadow cx={0} cy={86} rx={64} ry={10} opacity={0.4} />
      <path d="M -52 0 L -44 84 L 44 84 L 52 0 Z" fill={FO.cream} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 52 14 Q 98 20 88 54 Q 80 72 46 68" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <ellipse cx={0} cy={0} rx={52} ry={12} fill={FO.walnutDeep} stroke={INK} strokeWidth={5} />
      {[0, 1].map((i) => <path key={i} d={`M ${-14 + i * 28} -16 q ${8 * Math.sin(f / 12 + i)} -22 0 -44`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.4} />)}
    </g>
    <g data-band="ok" transform={`translate(930 ${desk + 430})`}>
      <ContactShadow cx={0} cy={44} rx={130} ry={12} opacity={0.4} />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-120 + (i % 2) * 8} y={36 - i * 22} width={240} height={22} fill={i % 2 ? FO.paper : FO.cream} stroke={INK} strokeWidth={5} />)}
    </g>
    <g data-band="ok" transform={`translate(780 ${desk + 600}) rotate(${-8 + Math.sin(f / 50) * 0.8})`}>
      <rect x={-130} y={-9} width={260} height={18} fill="#E9B740" stroke={INK} strokeWidth={5} />
      <path d="M 130 -9 L 170 0 L 130 9 Z" fill={FO.creamShade} stroke={INK} strokeWidth={4} />
      <rect x={-130} y={-9} width={28} height={18} fill="#C26B6B" stroke={INK} strokeWidth={5} />
    </g>
    {Array.from({length: 14}, (_, i) => <circle key={i} data-band="ok" cx={((i * 191 + f * 0.3) % 1200) - 60} cy={160 + ((i * 123) % 880)} r={2 + (i % 3)} fill={FO.lamp} opacity={0.22} />)}
    {/* the banker's lamp */}
    <g data-band="ok" transform={`translate(110 ${desk})`}>
      <ContactShadow cx={0} cy={4} rx={80} ry={10} opacity={0.4} />
      <rect x={-46} y={-26} width={92} height={26} rx={6} fill={FO.brass} stroke={INK} strokeWidth={6} />
      <rect x={-8} y={-196} width={16} height={172} fill={FO.brassDeep} stroke={INK} strokeWidth={5} />
      <path d="M -88 -176 Q 0 -250 88 -176 L 70 -158 L -70 -158 Z" fill={lamp > 0.5 ? FO.greenHi : FO.green} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {lamp > 0.5 && <ellipse cx={0} cy={-150} rx={70} ry={14} fill={FO.lamp} opacity={0.9} />}
      <path d="M -60 -190 Q 0 -230 50 -194" fill="none" stroke={FO.greenHi} strokeWidth={6} opacity={0.6} strokeLinecap="round" />
    </g>
  </g>
);

/** The Houston exterior: overcast celadon sky, a spruce row, birch-bone snow and survey stakes, with a drifting snow haze. */
export const ExteriorBG: React.FC<{f: number; ground?: number; id?: string; stakes?: boolean}> = ({f, ground = 1200, id = 'ex', stakes = true}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={FO.celadon} /><stop offset="1" stopColor={FO.celadonHi} /></linearGradient>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={FO.snow} /><stop offset="1" stopColor={FO.snowShade} /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={ground + 60} fill={`url(#${id}-s)`} />
    <ellipse data-band="ok" cx={860} cy={ground - 380} rx={190} ry={120} fill="#FFFFFF" opacity={0.35} />
    <path data-band="ok" d={`M -40 ${ground - 250} L 140 ${ground - 330} L 260 ${ground - 270} L 420 ${ground - 400} L 600 ${ground - 290} L 760 ${ground - 360} L 940 ${ground - 270} L 1120 ${ground - 340} L 1120 ${ground} L -40 ${ground} Z`} fill={FO.slate} stroke={INK} strokeWidth={5} opacity={0.75} />
    {Array.from({length: 24}, (_, i) => {
      const bx = i * 48 - 20 + 6 * Math.sin(f / 70 + i), bh = 150 + (i * 53) % 110;
      return (
        <g key={i} data-band="ok" transform={`translate(${bx} ${ground - 10})`}>
          <path d={`M 0 0 L -28 0 L -14 ${-bh * 0.34} L -24 ${-bh * 0.34} L -8 ${-bh * 0.62} L -18 ${-bh * 0.62} L 0 ${-bh} L 18 ${-bh * 0.62} L 8 ${-bh * 0.62} L 24 ${-bh * 0.34} L 14 ${-bh * 0.34} L 28 0 Z`} fill={i % 2 ? FO.spruce : FO.spruceHi} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
      );
    })}
    <rect data-band="ok" x={-40} y={ground - 10} width={1160} height={900} fill={`url(#${id}-g)`} />
    <rect data-band="ok" x={-40} y={ground - 14} width={1160} height={14} fill={FO.slateDeep} stroke={INK} strokeWidth={4} opacity={0.5} />
    {Array.from({length: 7}, (_, i) => <path key={i} data-band="ok" d={`M ${-100 + i * 220} ${ground + 340 + (i % 3) * 120} Q ${i * 220 + 100} ${ground + 300 + (i % 3) * 120} ${i * 220 + 320} ${ground + 340 + (i % 3) * 120}`} fill="none" stroke={FO.slate} strokeWidth={4} opacity={0.35} />)}
    {stakes && [180, 420, 700, 930].map((sx, i) => (
      <g key={sx} data-band="ok" transform={`translate(${sx} ${ground + 120 + (i % 2) * 70})`}>
        <ContactShadow cx={0} cy={6} rx={34} ry={6} opacity={0.3} />
        <rect x={-6} y={-96} width={12} height={96} fill={FO.manilaDeep} stroke={INK} strokeWidth={4} />
        <rect x={-6} y={-96} width={12} height={26} fill={FO.magenta} stroke={INK} strokeWidth={4} />
      </g>
    ))}
    {Array.from({length: 36}, (_, i) => <circle key={i} data-band="ok" cx={((i * 83 + f * (0.4 + (i % 3) * 0.2)) % 1200) - 60} cy={((i * 131 + f * 0.9) % 1900)} r={2 + (i % 3)} fill="#FFFFFF" opacity={0.5} />)}
  </g>
);

/** The hearing room: a deep spruce-green wall, two pendants, a bench rail, and the near chair-backs along the bottom. */
export const SenateBG: React.FC<{f: number; id?: string; floor?: number}> = ({f, id = 'sn', floor = 1230}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={FO.senate} /><stop offset="1" stopColor={FO.senateHi} /></linearGradient>
      <radialGradient id={`${id}-l`} cx="0.5" cy="0" r="0.8"><stop offset="0" stopColor={FO.lamp} stopOpacity="0.55" /><stop offset="1" stopColor={FO.lamp} stopOpacity="0" /></radialGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={floor + 40} fill={`url(#${id}-w)`} />
    {Array.from({length: 5}, (_, i) => <rect key={i} data-band="ok" x={20 + i * 210} y={180} width={180} height={760} fill="none" stroke={FO.senateHi} strokeWidth={5} opacity={0.6} />)}
    {[250, 830].map((px, i) => (
      <g key={px} data-band="ok" transform={`translate(${px + 8 * Math.sin(f / 40 + i)} 0)`}>
        <line x1={0} y1={-40} x2={0} y2={150} stroke={INK} strokeWidth={5} />
        <path d="M -60 220 Q 0 130 60 220 Z" fill={FO.green} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <ellipse cx={0} cy={222} rx={60} ry={9} fill={FO.lamp} stroke={INK} strokeWidth={4} />
        <path d="M -60 224 L -260 900 L 260 900 L 60 224 Z" fill={`url(#${id}-l)`} opacity={0.5} />
      </g>
    ))}
    <rect data-band="ok" x={-40} y={floor} width={1160} height={760} fill={FO.walnutDeep} />
    <rect data-band="ok" x={-40} y={floor - 12} width={1160} height={26} fill={FO.walnut} stroke={INK} strokeWidth={5} />
    {Array.from({length: 9}, (_, i) => <line key={i} data-band="ok" x1={540 + (i - 4) * 80} y1={floor + 14} x2={540 + (i - 4) * 240} y2={1960} stroke={FO.walnutHi} strokeWidth={2.5} opacity={0.35} />)}
    {Array.from({length: 16}, (_, i) => <circle key={i} data-band="ok" cx={((i * 191 + f * 0.3) % 1200) - 60} cy={160 + ((i * 123) % 900)} r={2 + (i % 3)} fill={FO.lamp} opacity={0.2} />)}
    {/* the near plane: the backs of the public benches along the bottom, and a brass rail */}
    {[60, 400, 740, 1080].map((bx, i) => (
      <g key={i} data-band="ok" transform={`translate(${bx + 10 * Math.sin(f / 60 + i)} 0)`}>
        <rect x={-130} y={1580} width={260} height={400} rx={18} fill={FO.walnut} stroke={INK} strokeWidth={8} />
        <rect x={-110} y={1600} width={220} height={120} rx={10} fill={FO.walnutHi} opacity={0.5} />
      </g>
    ))}
    <rect data-band="ok" x={-40} y={1520} width={1160} height={22} fill={FO.brass} stroke={INK} strokeWidth={6} />
  </g>
);

/** The ready-land counter: grey window light, shelves of parcel files with blank spines, a brass rail, a coin jar spot. */
export const CounterBG: React.FC<{f: number; id?: string; floor?: number; lamps?: number}> = ({f, id = 'cn', floor = 1230, lamps = 0}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D9DFD8" /><stop offset="1" stopColor="#B9C6C0" /></linearGradient>
    </defs>
    <rect data-band="ok" x={-40} y={-40} width={1160} height={floor + 40} fill={`url(#${id}-w)`} />
    {/* the window with a gray winter dusk */}
    <g data-band="ok" transform="translate(60 130)">
      <rect x={0} y={0} width={420} height={520} fill={FO.celadon} stroke={INK} strokeWidth={9} />
      <path d="M 0 360 L 90 320 L 190 350 L 300 300 L 420 340 L 420 520 L 0 520 Z" fill={FO.snow} stroke={INK} strokeWidth={5} />
      <line x1={210} y1={0} x2={210} y2={520} stroke={INK} strokeWidth={7} /><line x1={0} y1={260} x2={420} y2={260} stroke={INK} strokeWidth={7} />
    </g>
    {/* shelves of ready parcel files */}
    {[0, 1, 2].map((r) => (
      <g key={r} data-band="ok" transform={`translate(520 ${220 + r * 250})`}>
        <rect x={0} y={170} width={500} height={16} fill={FO.walnut} stroke={INK} strokeWidth={5} />
        {Array.from({length: 11}, (_, i) => {
          const h = 120 + ((i * 29 + r * 17) % 40);
          return <rect key={i} x={10 + i * 44} y={170 - h} width={36} height={h} fill={i % 3 ? FO.manila : FO.manilaDeep} stroke={INK} strokeWidth={4} />;
        })}
        {Array.from({length: 11}, (_, i) => <rect key={`t${i}`} x={16 + i * 44} y={170 - 100 - ((i * 29 + r * 17) % 40) + 20} width={24} height={14} fill="none" stroke={FO.navy} strokeWidth={2} opacity={0.5} />)}
      </g>
    ))}
    {/* three process lamps along the rail */}
    {[0, 1, 2].map((i) => (
      <g key={i} data-band="ok" transform={`translate(${770 + i * 110} 1040)`}>
        <circle cx={0} cy={0} r={34} fill={clamp01(lamps - i) > 0.5 ? FO.greenHi : FO.greenDeep} stroke={INK} strokeWidth={7} />
        {clamp01(lamps - i) > 0.5 && <circle cx={0} cy={0} r={54 + 5 * Math.sin(f / 5 + i)} fill={FO.greenHi} opacity={0.22} />}
        <circle cx={-10} cy={-12} r={9} fill="#FFFFFF" opacity={0.6} />
      </g>
    ))}
    <rect data-band="ok" x={-40} y={floor} width={1160} height={760} fill={FO.walnut} />
    <rect data-band="ok" x={-40} y={floor - 16} width={1160} height={34} fill={FO.walnutHi} stroke={INK} strokeWidth={6} />
    <rect data-band="ok" x={-40} y={floor + 18} width={1160} height={14} fill={FO.brass} stroke={INK} strokeWidth={4} />
    {Array.from({length: 12}, (_, i) => <circle key={i} data-band="ok" cx={((i * 191 + f * 0.3) % 1200) - 60} cy={200 + ((i * 123) % 800)} r={2 + (i % 3)} fill="#FFFFFF" opacity={0.25} />)}
    {/* the near plane: stacked ready-parcel file boxes and a brass rail along the bottom */}
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i} data-band="ok" transform={`translate(${60 + i * 240 + 8 * Math.sin(f / 50 + i)} ${1600 + (i % 2) * 70})`}>
        <rect x={-100} y={0} width={200} height={260} fill={i % 2 ? FO.manila : FO.manilaDeep} stroke={INK} strokeWidth={8} />
        <rect x={-100} y={0} width={200} height={36} fill={FO.manilaHi} opacity={0.4} />
        <rect x={-60} y={70} width={120} height={46} fill="none" stroke={FO.navy} strokeWidth={4} opacity={0.6} />
      </g>
    ))}
    <rect data-band="ok" x={-40} y={1560} width={1160} height={22} fill={FO.brass} stroke={INK} strokeWidth={6} />
  </g>
);

// ---- props --------------------------------------------------------------------------------------------------------------------------
/** The plan sheet: a surveyed parcel on a grid, unrolled by k (0..1). It carries a hatched parcel, a creek, a pin on Houston and no label of its own. */
export const MapSheet: React.FC<{x: number; y: number; f: number; scale?: number; k?: number; id?: string; pinK?: number; hatch?: number; rot?: number}> = ({x, y, f, scale = 1, k = 1, id = 'ms', pinK = 1, hatch = 1, rot = 0}) => {
  const w = 680 * clamp01(k), h = 500;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      <defs>
        <clipPath id={`${id}-c`}><rect x={-340} y={-250} width={w} height={h} /></clipPath>
        <Grad id={`${id}-p`} base={FO.paper} pale softness={0.8} />
      </defs>
      <rect x={-330} y={-232} width={w} height={h} fill="#000" opacity={0.3} transform="translate(10 14)" />
      <rect x={-340} y={-250} width={w} height={h} fill={`url(#${id}-p)`} stroke={INK} strokeWidth={8} />
      <g clipPath={`url(#${id}-c)`}>
        {Array.from({length: 12}, (_, i) => <line key={`v${i}`} x1={-340 + i * 62} y1={-250} x2={-340 + i * 62} y2={250} stroke={FO.slate} strokeWidth={2} opacity={0.6} />)}
        {Array.from({length: 9}, (_, i) => <line key={`h${i}`} x1={-340} y1={-250 + i * 62} x2={340} y2={-250 + i * 62} stroke={FO.slate} strokeWidth={2} opacity={0.6} />)}
        <path d="M -340 120 C -240 80 -160 160 -60 120 S 150 140 340 70" fill="none" stroke="#8DB6C6" strokeWidth={14} strokeLinecap="round" />
        <path d="M -140 -190 L 180 -214 L 270 -40 L 200 150 L -90 196 L -230 40 Z" fill={FO.manilaDeep} opacity={0.35 * hatch} />
        <path d="M -140 -190 L 180 -214 L 270 -40 L 200 150 L -90 196 L -230 40 Z" fill="none" stroke={FO.navy} strokeWidth={6} strokeLinejoin="round" strokeDasharray="22 10" strokeDashoffset={-f * 0.5} opacity={hatch} />
        {Array.from({length: 14}, (_, i) => <line key={i} x1={-260 + i * 38} y1={-220} x2={-300 + i * 38 + 120} y2={210} stroke={FO.navy} strokeWidth={2} opacity={0.18 * hatch} />)}
        {pinK > 0 && (
          <g transform={`translate(-170 ${160 - 30 * (1 - clamp01(pinK))})`} opacity={clamp01(pinK * 2)}>
            <ellipse cx={0} cy={4} rx={20} ry={6} fill={INK} opacity={0.3} />
            <path d="M 0 0 C -30 -34 -22 -64 0 -64 C 22 -64 30 -34 0 0 Z" fill={FO.navy} stroke={INK} strokeWidth={5} />
            <circle cx={0} cy={-42} r={8} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
          </g>
        )}
      </g>
      {/* the roll's curl at the leading edge while it unrolls */}
      {k < 0.98 && <rect x={-340 + w - 14} y={-250} width={26} height={h} rx={12} fill={FO.creamShade} stroke={INK} strokeWidth={6} />}
    </g>
  );
};

/** A rubber stamp block that comes down on a point and leaves a boxed imprint. down (0..1) is the descent, ink (0..1) the imprint. */
export const Stamp: React.FC<{x: number; y: number; f: number; scale?: number; down?: number; ink?: number; lines: string[]; size?: number; color?: string; rot?: number; smudge?: number; id?: string}> =
({x, y, f, scale = 1, down = 0, ink = 0, lines, size = 40, color = FO.stampRed, rot = -4, smudge = 0}) => {
  const w = Math.max(...lines.map((l) => monoW(l, size, 3))) + 54;
  const h = lines.length * (size + 14) + 24;
  const lift = (1 - clamp01(down)) * 520;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      {ink > 0 && (
        <g opacity={clamp01(ink)}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="none" stroke={color} strokeWidth={8} />
          <rect x={-w / 2 + 9} y={-h / 2 + 9} width={w - 18} height={h - 18} fill="none" stroke={color} strokeWidth={2.5} />
          {lines.map((l, i) => <text key={i} x={0} y={-h / 2 + 12 + (size + 14) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={size} letterSpacing={3} fill={color}>{l}</text>)}
          {smudge > 0 && <ellipse cx={w / 2 - 20} cy={h / 2 + 4} rx={46 * smudge} ry={14 * smudge} fill={color} opacity={0.28} transform="rotate(-8)" />}
        </g>
      )}
      <g transform={`translate(0 ${-lift})`} opacity={ink > 0.8 ? clamp01(1 - (ink - 0.8) * 5) * 0 + (lift > 2 ? 1 : 0) : 1}>
        <rect x={-w / 2 - 8} y={-h / 2 - 54} width={w + 16} height={54} rx={10} fill={FO.walnutHi} stroke={INK} strokeWidth={7} />
        <rect x={-30} y={-h / 2 - 150} width={60} height={104} rx={14} fill={FO.walnut} stroke={INK} strokeWidth={7} />
        <rect x={-w / 2} y={-h / 2} width={w} height={14} fill={color} stroke={INK} strokeWidth={4} />
      </g>
    </g>
  );
};

/** A small receipt slip with a torn bottom edge. */
export const ReceiptTag: React.FC<{x: number; y: number; f: number; scale?: number; rot?: number; lines: string[]; k?: number; size?: number}> = ({x, y, f, scale = 1, rot = 0, lines, k = 1, size = 24}) => {
  const w = Math.max(...lines.map((l) => monoW(l, size, 1))) + 40;
  const h = lines.length * (size + 12) + 40;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + 3 * Math.sin(f / 10)}) scale(${scale * (0.6 + 0.4 * clamp01(k))})`} opacity={clamp01(k * 2)}>
      <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} fill="#000" opacity={0.25} />
      <path d={`M ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2} L ${w / 2} ${h / 2} ${Array.from({length: 9}, (_, i) => `L ${w / 2 - (i + 1) * (w / 9)} ${h / 2 + (i % 2 ? 0 : 12)}`).join(' ')} L ${-w / 2} ${-h / 2} Z`} fill={FO.paper} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {lines.map((l, i) => <text key={i} x={0} y={-h / 2 + 34 + i * (size + 12)} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1} fill={FO.navy}>{l}</text>)}
    </g>
  );
};

/** A dotted-pencil data centre: a long low shed with rows of windows and cooling fans, drawn dashed because it does not exist. erase (0..1) rubs it out. */
export const DottedBuilding: React.FC<{x: number; y: number; f: number; scale?: number; k?: number; erase?: number; id?: string; label?: string}> = ({x, y, f, scale = 1, k = 1, erase = 0, label = 'DATA CENTERS'}) => {
  const op = clamp01(k) * (1 - 0.78 * clamp01(erase));
  const dash = `14 9`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={op}>
      <g fill="none" stroke={FO.navy} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={-f * 0.5}>
        <path d="M -300 0 L -300 -170 L 300 -170 L 300 0 Z" />
        <path d="M -300 -170 L -250 -230 L 250 -230 L 300 -170" />
        {Array.from({length: 7}, (_, i) => <rect key={i} x={-270 + i * 80} y={-130} width={52} height={56} />)}
        {[-190, -40, 110, 240].map((fx, i) => <circle key={i} cx={fx} cy={-258} r={26} />)}
        {[-190, -40, 110, 240].map((fx, i) => <path key={`f${i}`} d={`M ${fx - 18} -258 L ${fx + 18} -258 M ${fx} -276 L ${fx} -240`} />)}
      </g>
      {erase > 0 && erase < 1 && <rect x={-320 + 640 * erase - 40} y={-300} width={80} height={320} fill={FO.paper} opacity={0.75} />}
      <text x={0} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={3} fill={FO.navy} opacity={0.8}>{label}</text>
    </g>
  );
};

/** The July letter: a plain sheet with a letterhead block and rule lines, six struck lines sliding off one by one as the list is read. */
export const LetterSheet: React.FC<{x: number; y: number; f: number; scale?: number; rot?: number; head: string; items?: string[]; shown?: number; id?: string}> = ({x, y, f, scale = 1, rot = 0, head, items = [], shown = 0}) => {
  const w = 600, h = 420 + items.length * 6;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + 0.8 * Math.sin(f / 22)}) scale(${scale})`}>
      <rect x={-w / 2 + 10} y={-h / 2 + 14} width={w} height={h} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={FO.paper} stroke={INK} strokeWidth={8} />
      <rect x={-w / 2} y={-h / 2} width={w} height={64} fill={FO.cream} stroke={INK} strokeWidth={6} />
      <text x={-w / 2 + 28} y={-h / 2 + 42} fontFamily={MONO} fontWeight={900} fontSize={28} letterSpacing={2} fill={FO.navy}>{head}</text>
      {Array.from({length: 9}, (_, i) => <line key={i} x1={-w / 2 + 34} y1={-h / 2 + 108 + i * 34} x2={w / 2 - 34 - (i % 3) * 60} y2={-h / 2 + 108 + i * 34} stroke={FO.slate} strokeWidth={5} strokeLinecap="round" opacity={0.7} />)}
      {items.map((t, i) => {
        const on = clamp01(shown - i);
        return (
          <g key={t} opacity={on} transform={`translate(${(1 - on) * 80} 0)`}>
            <text x={-w / 2 + 40} y={-h / 2 + 108 - 9 + i * 34} fontFamily={MONO} fontWeight={800} fontSize={22} letterSpacing={1} fill={FO.magentaDeep}>{`NO ${t}`}</text>
          </g>
        );
      })}
    </g>
  );
};

/** A hand-lettered council sign on two stakes, with a small porch lamp. */
export const CouncilSign: React.FC<{x: number; y: number; f: number; scale?: number; lines: string[]; k?: number; size?: number; lit?: number; rot?: number}> = ({x, y, f, scale = 1, lines, k = 1, size = 34, lit = 1, rot = 0}) => {
  const w = Math.max(...lines.map((l) => monoW(l, size, 1.5))) + 56;
  const h = lines.length * (size + 14) + 36;
  const up = clamp01(k);
  return (
    <g transform={`translate(${x} ${y + (1 - up) * 340}) rotate(${rot + 2.6 * Math.sin(f / 17 + x * 0.01)}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={w * 0.4} ry={10} opacity={0.4} />
      {[-w * 0.32, w * 0.32].map((px) => <rect key={px} x={px - 9} y={-h - 150} width={18} height={150} fill={FO.manilaDeep} stroke={INK} strokeWidth={6} />)}
      <rect x={-w / 2 + 8} y={-h - 190 + 10} width={w} height={h} fill="#000" opacity={0.25} />
      <rect x={-w / 2} y={-h - 190} width={w} height={h} fill={FO.paper} stroke={INK} strokeWidth={8} />
      {lines.map((l, i) => <text key={i} x={0} y={-h - 190 + 20 + (size + 14) * (i + 0.5) + size * 0.36} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={size} letterSpacing={1.5} fill={i === lines.length - 1 ? FO.magentaDeep : FO.navy}>{l}</text>)}
      <circle cx={w / 2 + 40} cy={-h - 190 + 20} r={22} fill={FO.lamp} stroke={INK} strokeWidth={6} opacity={0.4 + 0.6 * lit} />
      {lit > 0.2 && <circle cx={w / 2 + 40} cy={-h - 190 + 20} r={52 + 4 * Math.sin(f / 6)} fill={FO.lamp} opacity={0.2 * lit} />}
    </g>
  );
};

/** A witness chair at a hearing table with a brass nameplate and a microphone. The chair is empty unless seated is set (it never is). */
export const WitnessChair: React.FC<{x: number; y: number; f: number; scale?: number; plate?: string; k?: number; spin?: number; slip?: boolean; turn?: number; slipK?: number}> = ({x, y, f, scale = 1, plate = 'CROWTHER', k = 1, spin = 0, slip = false, turn = 0, slipK = 1}) => {
  const pw = monoW(plate, 26, 2) + 44;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={clamp01(k * 2)}>
      <ContactShadow cx={0} cy={10} rx={150} ry={16} opacity={0.42} />
      {/* the table */}
      <rect x={-250} y={-150} width={500} height={34} fill={FO.walnutHi} stroke={INK} strokeWidth={7} />
      <rect x={-232} y={-116} width={18} height={116} fill={FO.walnut} stroke={INK} strokeWidth={6} />
      <rect x={214} y={-116} width={18} height={116} fill={FO.walnut} stroke={INK} strokeWidth={6} />
      {/* the chair, tipping a little on its swivel */}
      <g transform={`translate(0 -10) scale(${1 - Math.abs(turn) * 0.022} 1) rotate(${spin * Math.sin(f / 9) * 3}) translate(0 10)`}>
        <rect x={-62} y={-330} width={124} height={170} rx={10} fill={FO.green} stroke={INK} strokeWidth={7} />
        <rect x={-62} y={-330} width={124} height={34} rx={10} fill={FO.greenHi} stroke={INK} strokeWidth={6} opacity={0.7} />
        <rect x={-70} y={-170} width={140} height={32} rx={8} fill={FO.green} stroke={INK} strokeWidth={7} />
        <rect x={-8} y={-138} width={16} height={110} fill={FO.slateDeep} stroke={INK} strokeWidth={5} />
        <path d="M -60 -26 L 60 -26 M 0 -28 L -48 0 M 0 -28 L 48 0" stroke={INK} strokeWidth={9} strokeLinecap="round" fill="none" />
      </g>
      {/* mic and nameplate on the table */}
      <g transform="translate(150 -150)">
        <rect x={-6} y={-70} width={12} height={70} fill={FO.slateDeep} stroke={INK} strokeWidth={4} />
        <ellipse cx={0} cy={-80} rx={20} ry={26} fill={FO.slate} stroke={INK} strokeWidth={5} />
      </g>
      <g transform="translate(-60 -152)">
        <rect x={-pw / 2} y={-44} width={pw} height={44} fill={FO.brass} stroke={INK} strokeWidth={6} />
        <text x={0} y={-12} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={26} letterSpacing={2} fill={FO.navy}>{plate}</text>
      </g>
      {slip && <g transform={`translate(0 ${-400 + 280 * (1 - slipK) + 10 * Math.sin(f / 12)}) rotate(-4)`} opacity={clamp01(slipK * 3)}>
        <rect x={-150} y={-40} width={300} height={80} fill={FO.paper} stroke={INK} strokeWidth={5} />
        <text x={0} y={-6} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={FO.navy}>DNR · NO PERMISSION</text>
        <text x={0} y={24} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} fill={FO.navy}>TO ATTEND</text>
      </g>}
    </g>
  );
};

/** The words on a sticky note, one word to a line so a long ordinal date fits the paper. */
const NoteWords: React.FC<{text: string}> = ({text}) => {
  const w = text.split(' ');
  return (
    <>
      {w.map((t, i) => <text key={i} x={0} y={(w.length === 1 ? 22 : -2 + i * 58)} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={i === 0 && w.length > 1 ? 40 : 62} letterSpacing={1} fill={FO.navy}>{t}</text>)}
    </>
  );
};

/** A stack of brass coins with a ledger tag. n coins, grow (0..1) builds it. */
export const CoinStack: React.FC<{x: number; y: number; f: number; scale?: number; n?: number; grow?: number; id?: string}> = ({x, y, f, scale = 1, n = 12, grow = 1, id = 'cs'}) => {
  const count = Math.round(n * clamp01(grow));
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs><Grad id={`${id}-b`} base={FO.brass} softness={0.8} /></defs>
      <ContactShadow cx={0} cy={6} rx={96} ry={12} opacity={0.45} />
      {Array.from({length: count}, (_, i) => {
        const dx = 5 * Math.sin(i * 1.7 + f / 40);
        return (
          <g key={i} transform={`translate(${dx} ${-i * 26})`}>
            <ellipse cx={0} cy={0} rx={82} ry={24} fill={FO.brassDeep} stroke={INK} strokeWidth={5} />
            <rect x={-82} y={-20} width={164} height={20} fill={`url(#${id}-b)`} />
            <path d="M -82 -20 L -82 0 M 82 -20 L 82 0" stroke={INK} strokeWidth={5} />
            <ellipse cx={0} cy={-20} rx={82} ry={24} fill={FO.brassHi} stroke={INK} strokeWidth={5} />
            <ellipse cx={-20} cy={-24} rx={28} ry={6} fill="#FFFFFF" opacity={0.55} />
          </g>
        );
      })}
    </g>
  );
};

/** A car's two headlights sweeping across a window, to stand for the tenant who drives off. xk (0..1) is the sweep. */
export const Headlights: React.FC<{x: number; y: number; f: number; k?: number; away?: number; scale?: number}> = ({x, y, f, k = 1, away = 0, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={clamp01(k)}>
    {away < 0.5
      ? [-1, 1].map((s) => (
        <g key={s}>
          <path d={`M ${s * 52} 0 L ${s * 150} 220 L ${s * 20} 220 Z`} fill={FO.headlight} opacity={0.3} />
          <circle cx={s * 52} cy={0} r={30} fill={FO.headlight} stroke={INK} strokeWidth={6} />
          <circle cx={s * 52} cy={0} r={54 + 4 * Math.sin(f / 4)} fill={FO.headlight} opacity={0.25} />
        </g>
      ))
      : [-1, 1].map((s) => (
        <g key={s}>
          <circle cx={s * 52 * (1 - away * 0.4)} cy={0} r={18 * (1 - (away - 0.5))} fill={FO.magentaHi} stroke={INK} strokeWidth={5} />
        </g>
      ))}
  </g>
);

/** A paperclip that drops from the shaken folder. */
export const Paperclip: React.FC<{x: number; y: number; scale?: number; rot?: number}> = ({x, y, scale = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <path d="M -20 -48 L -20 30 A 16 16 0 0 0 12 30 L 12 -44 A 26 26 0 0 0 -40 -44 L -40 38" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
    <path d="M -20 -48 L -20 30 A 16 16 0 0 0 12 30 L 12 -44 A 26 26 0 0 0 -40 -44 L -40 38" fill="none" stroke="#C9D2D8" strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** A vote lamp: lit when on (0..1). Five of them make five yes votes. */
export const VoteLamp: React.FC<{x: number; y: number; f: number; on?: number; scale?: number; label?: string; dim?: boolean}> = ({x, y, f, on = 0, scale = 1, label, dim = false}) => {
  const k = clamp01(on);
  if (k <= 0 && !dim) return null;
  const pop = k > 0 ? 1 + 0.18 * Math.max(0, 1 - (k * 6 - 1)) : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * pop})`}>
      <ContactShadow cx={0} cy={72} rx={52} ry={9} opacity={0.4} />
      <rect x={-46} y={30} width={92} height={44} rx={8} fill={FO.brassDeep} stroke={INK} strokeWidth={6} />
      <circle cx={0} cy={-8} r={44} fill={k > 0.5 ? FO.greenHi : FO.greenDeep} stroke={INK} strokeWidth={7} />
      {k > 0.5 && <circle cx={0} cy={-8} r={78 + 6 * Math.sin(f / 4)} fill={FO.greenHi} opacity={0.22} />}
      <circle cx={-14} cy={-24} r={11} fill="#FFFFFF" opacity={0.65} />
      {label && <text x={0} y={62} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={22} fill={FO.cream}>{label}</text>}
    </g>
  );
};

/** A yellow sticky note held on its own (for the button). */
export const OctNote: React.FC<{x: number; y: number; f: number; scale?: number; text?: string; k?: number; rot?: number}> = ({x, y, f, scale = 1, text = 'OCT 26', k = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot + 1.5 * Math.sin(f / 11)}) scale(${scale * (0.6 + 0.4 * clamp01(k))})`} opacity={clamp01(k * 2)}>
    <rect x={-96} y={-86} width={192} height={192} fill="#000" opacity={0.25} transform="translate(7 9)" />
    <rect x={-96} y={-96} width={192} height={192} fill="#FFF1CC" stroke={INK} strokeWidth={6} />
    <rect x={-96} y={-96} width={192} height={30} fill={FO.brass} stroke={INK} strokeWidth={4} />
    <NoteWords text={text} />
  </g>
);

/** The real parcel from above: birch-bone snow, spruce clumps in grey-green, a creek, a road, the roofs of Houston. outline (0..1) draws the parcel boundary in stamp ink. */
export const AerialBG: React.FC<{f: number; id?: string; outline?: number; hatch?: number; roofs?: number; panX?: number}> = ({f, id = 'ae', outline = 1, hatch = 0, roofs = 0, panX = 0}) => {
  const clumps = Array.from({length: 46}, (_, i) => ({x: -60 + rnd(i * 3 + 1) * 1200, y: 60 + rnd(i * 3 + 2) * 1800, r: 34 + rnd(i * 3 + 3) * 70}));
  const P = 'M 150 520 L 640 450 L 900 800 L 780 1250 L 330 1360 L 120 920 Z';
  return (
    <g transform={`translate(${panX} 0)`}>
      <defs>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={FO.snow} /><stop offset="1" stopColor={FO.snowShade} /></linearGradient>
        <clipPath id={`${id}-p`}><path d={P} /></clipPath>
      </defs>
      <rect data-band="ok" x={-120} y={-40} width={1320} height={2000} fill={`url(#${id}-s)`} />
      {clumps.map((c, i) => (
        <g key={i} data-band="ok">
          <ellipse cx={c.x + 8} cy={c.y + 10} rx={c.r * 1.05} ry={c.r * 0.85} fill={FO.slateDeep} opacity={0.22} />
          {Array.from({length: 6}, (_, j) => {
            const sx = c.x + (rnd(i * 11 + j) - 0.5) * c.r * 1.5, sy = c.y + (rnd(i * 13 + j + 5) - 0.5) * c.r * 1.2, sr = c.r * (0.34 + 0.2 * rnd(i * 17 + j));
            const pts = Array.from({length: 16}, (_, k) => { const a = (k / 16) * Math.PI * 2, rr = k % 2 ? sr * 0.46 : sr; return `${(sx + Math.cos(a) * rr).toFixed(1)},${(sy + Math.sin(a) * rr).toFixed(1)}`; }).join(' ');
            return <polygon key={j} points={pts} fill={(i + j) % 3 ? FO.spruce : FO.spruceHi} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />;
          })}
        </g>
      ))}
      <path data-band="ok" d="M -120 1480 C 200 1380 360 1560 640 1440 S 1000 1330 1260 1400" fill="none" stroke="#8DB6C6" strokeWidth={34} strokeLinecap="round" opacity={0.85} />
      <path data-band="ok" d="M -120 1480 C 200 1380 360 1560 640 1440 S 1000 1330 1260 1400" fill="none" stroke={FO.snow} strokeWidth={14} strokeLinecap="round" opacity={0.7} />
      <path data-band="ok" d="M 470 -40 C 520 500 440 1000 560 1960" fill="none" stroke={FO.slate} strokeWidth={22} strokeLinecap="round" opacity={0.75} />
      <path data-band="ok" d="M 470 -40 C 520 500 440 1000 560 1960" fill="none" stroke={FO.cream} strokeWidth={4} strokeDasharray="22 22" opacity={0.8} />
      {hatch > 0 && <g clipPath={`url(#${id}-p)`} opacity={hatch}>
        <path d={P} fill={FO.navy} opacity={0.12} />
        {Array.from({length: 26}, (_, i) => <line key={i} x1={80 + i * 36} y1={420} x2={-240 + i * 36 + 520} y2={1400} stroke={FO.navy} strokeWidth={3} opacity={0.22} />)}
      </g>}
      {outline > 0 && <path d={P} fill="none" stroke={FO.navy} strokeWidth={9} strokeLinejoin="round" strokeDasharray="30 14" strokeDashoffset={-f * 0.9} opacity={clamp01(outline)} />}
      {roofs > 0 && (
        <g data-band="ok" opacity={clamp01(roofs * 1.6)} transform={`translate(${200} ${1480}) scale(${0.7 + 0.3 * clamp01(roofs)})`}>
          {Array.from({length: 9}, (_, i) => (
            <g key={i} transform={`translate(${(i % 3) * 66} ${Math.floor(i / 3) * 52}) rotate(${(i * 7) % 10 - 5})`}>
              <rect x={0} y={0} width={46} height={34} fill={i % 2 ? FO.brass : FO.manilaDeep} stroke={INK} strokeWidth={4} />
              <path d="M -4 0 L 23 -16 L 50 0 Z" fill={FO.walnut} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            </g>
          ))}
        </g>
      )}
      {Array.from({length: 30}, (_, i) => <circle key={`n${i}`} data-band="ok" cx={((i * 83 + f * (0.5 + (i % 3) * 0.25)) % 1300) - 80} cy={((i * 131 + f * 1.1) % 2000)} r={2 + (i % 3)} fill="#FFFFFF" opacity={0.55} />)}
    </g>
  );
};
