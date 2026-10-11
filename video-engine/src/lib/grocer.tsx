import React from 'react';
import {INK, ContactShadow, tones, FormGradient, RimLight} from './lighting';

// GROCER, 2026-10-11 ("This Crate Was Supposed To Fly"). Reusable pieces for a story about where a price starts:
// a kraft tag with swappable faces, a grocery shelf whose tags can be messy or ruled, a mint code sheet, the
// rule's steel beam with its three gold zone weights, quadcopter rotor stubs for a cargo crate, a paper drift,
// brass calipers, a closed gate and a gust of loose tags. Palette roles are art_direction.json.
// KRAFT means only the tag. MINT means only AI-written code. RED means only the human check.
// STEEL and GOLD mean only the rule. GREEN means only the gate.

export const PAL = {
  ink: INK, kraft: '#C49A5A', kraftShade: '#8F6B36', kraftHi: '#E3C58C', paper: '#F1E8D2', snow: '#EEF3F5', snowShade: '#B9C8D2',
  rose: '#F2A58E', glacier: '#7FB4D6', tundraInk: '#1E2B3A', spruce: '#2F5D50', spruceDeep: '#1D3F36',
  red: '#D9362B', steel: '#5E7388', steelHi: '#8EA2B5', steelDeep: '#3C4B5B', gold: '#F2C14E', goldDeep: '#B98A1E',
  mint: '#58E0B0', mintDeep: '#1F8F6C', green: '#3E7B4E', greenDeep: '#27513A', raven: '#151A22', brass: '#C79A3B', nickel: '#A9B4BC', nickelDeep: '#6E7C88',
};

export const monoW = (text: string, size: number, ls = 1.5) => text.length * size * 0.602 + ls * (text.length - 1);

const hash = (i: number) => {
  let x = (Math.floor(i) + 1013) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return x >>> 0;
};
export const rnd = (i: number) => (hash(i) % 10000) / 10000;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const MONO = "'JetBrains Mono', monospace";

/** A barcode of vertical bars. `mess` 0 is clean and regular, 1 is doubled, shifted and smeared. */
export const Barcode: React.FC<{x: number; y: number; w: number; h: number; seed?: number; mess?: number; color?: string}> = ({x, y, w, h, seed = 1, mess = 0, color = PAL.ink}) => {
  const n = 22;
  const bars: React.ReactNode[] = [];
  let cx = 0;
  const unit = w / (n * 1.9);
  for (let i = 0; i < n; i++) {
    const bw = unit * (0.6 + 1.1 * rnd(seed * 31 + i));
    const shift = mess * (rnd(seed * 17 + i) - 0.5) * unit * 2.2;
    bars.push(<rect key={i} x={cx + shift} y={-h / 2 + mess * (rnd(seed * 5 + i) - 0.5) * 8} width={bw} height={h} fill={color} opacity={1 - 0.35 * mess * rnd(seed + i * 3)} />);
    if (mess > 0.4 && i % 5 === 2) bars.push(<rect key={`d${i}`} x={cx + bw * 0.6} y={-h / 2} width={bw} height={h} fill={color} opacity={0.4} />);
    cx += bw + unit * (0.5 + 0.6 * rnd(seed * 13 + i));
  }
  const sc = w / Math.max(1, cx);
  return <g transform={`translate(${x},${y}) scale(${sc},1)`}>{bars}{mess > 0.5 && <rect x={cx * 0.3} y={-h * 0.15} width={cx * 0.3} height={h * 0.5} fill={PAL.kraftShade} opacity={0.35} />}</g>;
};

export type TagFace = 'blank' | 'smudge' | 'ruled' | 'measured' | 'rule' | 'stamped';

/** Face content in tag-local coordinates: origin top centre of the body, width w, height h. */
const FaceContent: React.FC<{face: TagFace; w: number; h: number; tick?: number; f: number; destDots?: number; label?: string; label2?: string; stamp?: number}> =
({face, w, h, tick = 0, f, destDots = 0, label, label2, stamp = 0}) => {
  const bc = (mess: number, seed: number) => <Barcode x={-w / 2 + 28} y={64} w={w - 56} h={44} seed={seed} mess={mess} />;
  const box = null;
  if (face === 'blank') {
    return (
      <g>
        <path d={`M ${-w / 2 + 34} 70 L ${w / 2 - 34} 70 M ${-w / 2 + 34} 112 L ${w / 2 - 70} 112`} stroke={PAL.ink} strokeWidth={5} opacity={0.18} strokeLinecap="round" />
        <text x={0} y={h - 22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill={PAL.ink} opacity={0.5}>DESTINATION</text>
        <path d={`M ${-w / 2 + 34} ${h - 50} L ${w / 2 - 34} ${h - 50}`} stroke={PAL.ink} strokeWidth={4} strokeDasharray={destDots > 0 ? '2 12' : '0'} opacity={destDots > 0 ? 0.75 : 0.25 + 0.2 * Math.sin(f / 5)} strokeLinecap="round" />
        {destDots > 0.02 && <text x={0} y={h - 62} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={28} letterSpacing={4} fill={PAL.greenDeep} opacity={clamp01(destDots)}>USDA</text>}
      </g>
    );
  }
  if (face === 'smudge') {
    return (
      <g>
        {bc(1, 3)}
        {[0, 1].map((r) => <path key={r} d={`M ${-w / 2 + 30} ${112 + r * 26} q 40 ${-10 + r * 6} 80 0 t 80 0 t 70 ${4 - r * 3}`} fill="none" stroke={PAL.ink} strokeWidth={6} opacity={0.3} strokeLinecap="round" />)}
        <ellipse cx={30} cy={118} rx={62} ry={22} fill={PAL.kraftShade} opacity={0.35} />
        <text x={0} y={h - 22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={2} fill={PAL.ink} opacity={0.5}>DESTINATION</text>
        <path d={`M ${-w / 2 + 34} ${h - 50} L ${w / 2 - 34} ${h - 50}`} stroke={PAL.ink} strokeWidth={4} opacity={0.3 + 0.35 * Math.sin(f / 5)} strokeLinecap="round" />
      </g>
    );
  }
  if (face === 'ruled') {
    return (
      <g>
        {bc(0, 7)}
        {[0, 1].map((r) => <path key={r} d={`M ${-w / 2 + 28} ${112 + r * 22} L ${w / 2 - 28 - r * 60} ${112 + r * 22}`} stroke={PAL.ink} strokeWidth={5} opacity={0.5} strokeLinecap="round" />)}
        {box}
      </g>
    );
  }
  if (face === 'measured') {
    return (
      <g>
        {bc(0, 11)}
        <text x={0} y={134} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={20} letterSpacing={1} fill={PAL.ink}>{label ?? 'MEASURED ON THE SHELF'}</text>
        {box}
      </g>
    );
  }
  if (face === 'stamped') {
    return (
      <g>
        {bc(0, 7)}
        {box}
        <g transform={`translate(0,${h * 0.55}) rotate(-9) scale(${1 + 0.5 * (1 - clamp01(stamp))})`} opacity={clamp01(stamp * 2.4)}>
          <rect x={-136} y={-30} width={272} height={60} fill="none" stroke="#2A3342" strokeWidth={6} />
          <rect x={-136} y={-30} width={272} height={60} fill={PAL.paper} opacity={0.55} />
          <text x={0} y={7} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={21} letterSpacing={0.5} fill="#2A3342">{label ?? 'NOT PUBLISHED YET'}</text>
        </g>
      </g>
    );
  }
  // rule face
  return (
    <g>
      <rect x={-w / 2 + 22} y={22} width={w - 44} height={44} fill={PAL.steel} stroke={PAL.ink} strokeWidth={4} />
      <text x={0} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={24} letterSpacing={2} fill={PAL.snow}>ANCHORAGE</text>
      <text x={0} y={104} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={30} letterSpacing={2} fill={PAL.ink}>+ ZONE</text>
      {[-1, 0, 1].map((k) => <g key={k} transform={`translate(${k * 62},146)`}><ellipse rx={20} ry={11} fill="none" stroke={PAL.steelDeep} strokeWidth={6} /><ellipse rx={9} ry={4} fill="none" stroke={PAL.steelDeep} strokeWidth={4} opacity={0.6} /></g>)}
      {label2 && <text x={0} y={h - 22} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={17} letterSpacing={1} fill={PAL.ink} opacity={0.7}>{label2}</text>}
    </g>
  );
};

/** THE THROUGHLINE: a kraft tag on a string. Origin at the string's knot. `flip` 0..1 turns it through edge-on from `front` to `back`. */
export const KraftTag: React.FC<{
  x: number; y: number; f: number; scale?: number; flip?: number; swing?: number; w?: number; h?: number; spin?: number;
  front: TagFace; back?: TagFace; tick?: number; stamp?: number; destDots?: number; frontLabel?: string; backLabel?: string; backLabel2?: string; stringLen?: number; shade?: number;
}> = ({x, y, f, scale = 1, flip = 0, swing = 0, w = 300, h = 200, spin, front, back = 'rule', tick = 0, stamp = 0, destDots = 0, frontLabel, backLabel, backLabel2, stringLen = 46, shade = 0}) => {
  const k = spin !== undefined ? spin : clamp01(flip);
  const ang = k * Math.PI;
  const sx = Math.cos(ang);
  const face: TagFace = sx >= 0 ? front : back;
  const sway = Math.sin(f / 23) * 4 + swing;
  const T = tones(PAL.kraft);
  const id = `kt-${Math.round(x)}-${Math.round(y)}-${Math.round(scale * 10)}`;
  const body = `M ${-w / 2 + 34} 0 L ${w / 2 - 34} 0 L ${w / 2} 34 L ${w / 2} ${h} L ${-w / 2} ${h} L ${-w / 2} 34 Z`;
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${sway})`}>
      <path d={`M 0 0 L 0 ${stringLen}`} stroke={PAL.ink} strokeWidth={5} strokeLinecap="round" />
      <circle cx={0} cy={0} r={6} fill={PAL.ink} />
      <g transform={`translate(0,${stringLen}) scale(${Math.max(0.03, Math.abs(sx))},1)`}>
        <defs><FormGradient id={id} t={T} /></defs>
        <path d={body} transform="translate(8,10)" fill="#000" opacity={0.22} />
        <path d={body} fill={`url(#${id})`} stroke={PAL.ink} strokeWidth={7} strokeLinejoin="round" />
        <circle cx={0} cy={22} r={9} fill={PAL.paper} stroke={PAL.ink} strokeWidth={4} />
        <RimLight d={`M ${-w / 2 + 38} 3 L ${w / 2 - 38} 3`} w={4} opacity={0.5} />
        {shade > 0 && <path d={body} fill="#000" opacity={0.28 * shade} />}
        <g>
          <FaceContent face={face} w={w} h={h} tick={tick} f={f} destDots={destDots} label={sx >= 0 ? frontLabel : backLabel} label2={backLabel2} stamp={stamp} />
        </g>
      </g>
    </g>
  );
};

/** Four quadcopter rotor stubs on booms for a cargo crate. Origin = the crate's centre (FlightCrate local origin). */
export const Rotors: React.FC<{x: number; y: number; scale?: number; f: number; spin?: number; fold?: number}> = ({x, y, scale = 1, f, spin = 0, fold = 0}) => {
  const hubs: [number, number][] = [[-290, -150], [290, -150], [-290, 30], [290, 30]];
  const T = tones(PAL.steelHi);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {hubs.map(([hx, hy], i) => {
        const arm = hx < 0 ? -1 : 1;
        const a = (f * 1.9 * spin + i * 40) * (i % 2 ? -1 : 1);
        const blur = clamp01(spin);
        const bl = 96 * (1 - 0.9 * fold);
        return (
          <g key={i} transform={`translate(0,0)`}>
            <path d={`M ${arm * 160} ${hy + 40} L ${hx} ${hy + 14}`} stroke={PAL.ink} strokeWidth={22} strokeLinecap="round" />
            <path d={`M ${arm * 160} ${hy + 40} L ${hx} ${hy + 14}`} stroke={PAL.steel} strokeWidth={12} strokeLinecap="round" />
            <rect x={hx - 17} y={hy - 12} width={34} height={36} rx={8} fill={T.base} stroke={PAL.ink} strokeWidth={6} />
            {blur > 0.05 && <ellipse cx={hx} cy={hy - 14} rx={bl * 1.05} ry={14 + 5 * Math.sin(f / 2 + i)} fill={PAL.glacier} opacity={0.35 * blur} />}
            <g transform={`translate(${hx},${hy - 14})`}>
              {[0, 1].map((b) => {
                const ca = (a + b * 180) * Math.PI / 180;
                const len = bl * Math.cos(ca);
                return <path key={b} d={`M 0 0 L ${len} ${-4 * Math.sin(ca)}`} stroke={PAL.ink} strokeWidth={13} strokeLinecap="round" />;
              })}
              {[0, 1].map((b) => {
                const ca = (a + b * 180) * Math.PI / 180;
                const len = bl * Math.cos(ca);
                return <path key={b} d={`M 0 0 L ${len} ${-4 * Math.sin(ca)}`} stroke={PAL.paper} strokeWidth={6} strokeLinecap="round" />;
              })}
              <circle r={9} fill={PAL.brass} stroke={PAL.ink} strokeWidth={4} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

/** A rural grocery shelf. `mess` 0..1 dirties the tag codes, `rows` 0..1 snaps them into ruled rows. Origin = bottom centre. */
export const GroceryShelf: React.FC<{x: number; y: number; f: number; w?: number; h?: number; scale?: number; mess?: number; snap?: number; seed?: number; dim?: number}> =
({x, y, f, w = 760, h = 640, scale = 1, mess = 1, snap = 0, seed = 1, dim = 0}) => {
  const tiers = 3;
  const tierH = h / tiers;
  const cols = ['#C8493B', '#E8B84B', '#4C8DB5', '#8E5FA8', '#5BA66A', '#D9843B'];
  const items: React.ReactNode[] = [];
  const shelfTags: React.ReactNode[] = [];
  for (let t = 0; t < tiers; t++) {
    const baseY = -h + (t + 1) * tierH - 22;
    let cx = -w / 2 + 44;
    let n = 0;
    while (cx < w / 2 - 70) {
      const kind = hash(seed * 100 + t * 20 + n) % 3;
      const c = cols[hash(seed * 77 + t * 13 + n) % cols.length];
      const iw = kind === 0 ? 56 : kind === 1 ? 72 : 64;
      const ih = kind === 0 ? 92 : kind === 1 ? 62 : 108;
      const TT = tones(c);
      const bob = 2 * Math.sin(f / 31 + n + t);
      items.push(
        <g key={`${t}-${n}`} transform={`translate(${cx + iw / 2},${baseY + bob})`}>
          <ContactShadow cx={0} cy={2} rx={iw * 0.55} ry={6} opacity={0.4} />
          {kind === 0 ? (
            <g>
              <rect x={-iw / 2} y={-ih} width={iw} height={ih} rx={9} fill={TT.base} stroke={PAL.ink} strokeWidth={5} />
              <rect x={-iw / 2 + 4} y={-ih + 28} width={iw - 8} height={34} fill={PAL.paper} stroke={PAL.ink} strokeWidth={3} />
              <path d={`M ${-iw / 2 + 8} ${-ih + 10} L ${-iw / 2 + 8} ${-8}`} stroke="#fff" strokeWidth={4} opacity={0.35} />
            </g>
          ) : kind === 1 ? (
            <g>
              <rect x={-iw / 2} y={-ih} width={iw} height={ih} rx={4} fill={TT.base} stroke={PAL.ink} strokeWidth={5} />
              <rect x={-iw / 2 + 6} y={-ih + 10} width={iw - 12} height={ih - 30} fill={PAL.paper} opacity={0.85} stroke={PAL.ink} strokeWidth={3} />
            </g>
          ) : (
            <g>
              <rect x={-iw / 2} y={-ih} width={iw} height={ih} rx={5} fill={TT.base} stroke={PAL.ink} strokeWidth={5} />
              <rect x={-iw / 2} y={-ih} width={iw} height={18} rx={4} fill={TT.shade} stroke={PAL.ink} strokeWidth={4} />
              <circle cx={0} cy={-ih / 2 + 8} r={17} fill={PAL.paper} stroke={PAL.ink} strokeWidth={3} />
            </g>
          )}
        </g>,
      );
      shelfTags.push(
        <g key={`tg${t}-${n}`} transform={`translate(${cx + iw / 2},${baseY + 20 + (mess * (rnd(seed * 9 + n + t * 7) - 0.5) * 10) * (1 - snap)}) rotate(${mess * (1 - snap) * (rnd(seed * 3 + n * 2 + t) - 0.5) * 22})`}>
          <rect x={-iw / 2 - 2} y={-9} width={iw + 4} height={26} fill={PAL.kraft} stroke={PAL.ink} strokeWidth={3} />
          <Barcode x={-iw / 2 + 4} y={4} w={iw - 8} h={14} seed={seed * 40 + n + t * 9} mess={mess * (1 - snap)} />
        </g>,
      );
      cx += iw + 18 + (hash(seed + n * 3 + t) % 14);
      n++;
    }
  }
  const board = (yy: number) => (
    <g>
      <rect x={-w / 2 - 14} y={yy} width={w + 28} height={30} fill={PAL.spruce} stroke={PAL.ink} strokeWidth={6} />
      <rect x={-w / 2 - 14} y={yy} width={w + 28} height={9} fill="#fff" opacity={0.18} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} fill={PAL.spruceDeep} stroke={PAL.ink} strokeWidth={7} />
      {[1, 2, 3].map((i) => <path key={i} d={`M ${-w / 2 + 10} ${-h + i * (h / 4)} L ${w / 2 - 10} ${-h + i * (h / 4)}`} stroke="#000" strokeWidth={3} opacity={0.12} />)}
      {items}
      {[0, 1, 2].map((t) => board(-h + (t + 1) * tierH - 22))}
      {shelfTags}
      <rect x={-w / 2 - 20} y={-h - 14} width={w + 40} height={20} fill={PAL.spruce} stroke={PAL.ink} strokeWidth={6} />
      {dim > 0 && <rect x={-w / 2 - 20} y={-h - 14} width={w + 40} height={h + 40} fill="#000" opacity={dim} />}
    </g>
  );
};

/** A mint code sheet. `progress` 0..1 prints lines top to bottom, `comb` 0..1 sweeps the cleaning comb across. Origin = centre. */
export const CodeSheet: React.FC<{x: number; y: number; f: number; w?: number; h?: number; progress?: number; comb?: number; scale?: number; rot?: number}> =
({x, y, f, w = 520, h = 700, progress = 1, comb = 0, scale = 1, rot = 0}) => {
  const rows = 17;
  const rh = (h - 120) / rows;
  const shown = progress * rows;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
      <rect x={-w / 2 + 12} y={-h / 2 + 14} width={w} height={h} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="#0E2420" stroke={PAL.ink} strokeWidth={8} />
      <rect x={-w / 2} y={-h / 2} width={w} height={52} rx={8} fill={PAL.mintDeep} stroke={PAL.ink} strokeWidth={8} />
      {[0, 1, 2].map((i) => <circle key={i} cx={-w / 2 + 30 + i * 26} cy={-h / 2 + 26} r={7} fill={i === 0 ? PAL.red : i === 1 ? PAL.gold : PAL.mint} stroke={PAL.ink} strokeWidth={3} />)}
      <text x={w / 2 - 24} y={-h / 2 + 34} textAnchor="end" fontFamily={MONO} fontWeight={900} fontSize={20} letterSpacing={2} fill={PAL.snow}>WRITTEN BY AI</text>
      {Array.from({length: rows}, (_, r) => {
        const vis = clamp01(shown - r);
        if (vis <= 0.02) return null;
        const indent = (hash(r * 7) % 3) * 34;
        const segs = 2 + (hash(r * 11) % 3);
        let cx = -w / 2 + 28 + indent;
        const els: React.ReactNode[] = [];
        for (let s = 0; s < segs; s++) {
          const sw = 34 + (hash(r * 19 + s * 5) % 110);
          if (cx + sw > w / 2 - 28) break;
          els.push(<rect key={s} x={cx} y={0} width={sw * vis} height={rh * 0.46} rx={3} fill={s % 2 ? PAL.mint : '#B5F5DD'} opacity={0.92} />);
          cx += sw + 14;
        }
        return <g key={r} transform={`translate(0,${-h / 2 + 80 + r * rh})`}>{els}</g>;
      })}
      {shown < rows && <rect x={-w / 2 + 28} y={-h / 2 + 80 + Math.floor(shown) * rh} width={14} height={rh * 0.5} fill={PAL.mint} opacity={0.5 + 0.5 * Math.sin(f / 3)} />}
      {comb > 0.01 && comb < 0.99 && (
        <g transform={`translate(0,${-h / 2 + 52 + comb * (h - 52)})`}>
          <rect x={-w / 2 - 20} y={-6} width={w + 40} height={12} fill={PAL.mint} opacity={0.9} />
          {Array.from({length: 18}, (_, i) => <rect key={i} x={-w / 2 - 14 + i * ((w + 28) / 18)} y={6} width={9} height={30} fill={PAL.mint} opacity={0.55} />)}
        </g>
      )}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="none" stroke={PAL.mint} strokeWidth={3} opacity={0.35 + 0.15 * Math.sin(f / 9)} />
    </g>
  );
};

/** The rule's steel beam on two posts with hooks for tags. Origin = beam centre top. Hooks sit at the given beam-local x positions. */
export const ZoneBeam: React.FC<{x: number; y: number; f: number; scale?: number; w?: number; hooks?: number[]; snow?: number}> = ({x, y, f, scale = 1, w = 820, hooks = [-110, 290], snow = 0}) => {
  const T = tones(PAL.steel);
  const id = `zb-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs><FormGradient id={id} t={T} /></defs>
      <ContactShadow cx={0} cy={560} rx={w * 0.6} ry={14} opacity={0.35} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * (w / 2 - 20) - 22} y={30} width={44} height={530} fill={`url(#${id})`} stroke={PAL.ink} strokeWidth={7} />
          <rect x={s * (w / 2 - 20) - 52} y={540} width={104} height={30} fill={PAL.steelDeep} stroke={PAL.ink} strokeWidth={6} />
        </g>
      ))}
      <rect x={-w / 2} y={0} width={w} height={64} fill={`url(#${id})`} stroke={PAL.ink} strokeWidth={8} />
      <rect x={-w / 2} y={0} width={w} height={14} fill="#fff" opacity={0.22} />
      {Array.from({length: 13}, (_, i) => <circle key={i} cx={-w / 2 + 40 + i * ((w - 80) / 12)} cy={46} r={5} fill={PAL.steelDeep} stroke={PAL.ink} strokeWidth={2} />)}
      {hooks.map((hx, i) => (
        <g key={i}>
          <path d={`M ${hx} 64 L ${hx} 92`} stroke={PAL.ink} strokeWidth={8} strokeLinecap="round" />
          <circle cx={hx} cy={98} r={9} fill={PAL.steelHi} stroke={PAL.ink} strokeWidth={5} />
        </g>
      ))}
      {snow > 0.01 && (
        <g>
          <path d={`M ${-w / 2 + 10} 2 Q ${-w / 4} ${-26 * snow} 0 ${-12 * snow} T ${w / 2 - 10} 2 Z`} fill={PAL.snow} stroke={PAL.ink} strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

/** The three equal zone weights hanging in a fan from one point (the Anchorage tag). Origin = the point they hang from. t 0..1 slides them out; labels shows the zone names. */
export const ZoneWeights: React.FC<{x: number; y: number; f: number; scale?: number; t?: number; labels?: number}> = ({x, y, f, scale = 1, t = 1, labels = 0}) => {
  const names = ['URBAN', 'RURAL I', 'RURAL II'];
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={clamp01(t * 3)}>
      {[-1, 0, 1].map((k, i) => {
        const wx = k * 190 * t;
        const drop = 190 * t + 30;
        const swing = Math.sin(f / 17 + i * 1.4) * 2.5 * t;
        const glow = clamp01(labels * 3 - i);
        return (
          <g key={i}>
            <path d={`M 0 0 L ${wx} ${drop}`} stroke={PAL.ink} strokeWidth={8} strokeDasharray="14 6" />
            <g transform={`translate(${wx},${drop}) rotate(${swing})`}>
              <path d={`M -52 0 L 52 0 L 66 74 L -66 74 Z`} fill={PAL.gold} stroke={PAL.ink} strokeWidth={7} strokeLinejoin="round" />
              <path d={`M -44 8 L 44 8`} stroke="#fff" strokeWidth={5} opacity={0.5} />
              <path d={`M -52 0 L 52 0 L 66 74 L -66 74 Z`} fill="#fff" opacity={0.35 * glow * (0.6 + 0.4 * Math.sin(f / 5))} />
              {labels > 0.01 && <text x={0} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={names[i].length > 6 ? 17 : 20} letterSpacing={1} fill={PAL.ink} opacity={glow}>{names[i]}</text>}
            </g>
          </g>
        );
      })}
    </g>
  );
};

/** A paper-and-tag stack that grows to `h` px. Origin = bottom centre. */
export const DriftStack: React.FC<{x: number; y: number; f: number; h?: number; w?: number; seed?: number; scale?: number}> = ({x, y, f, h = 400, w = 300, seed = 2, scale = 1}) => {
  const n = Math.max(1, Math.floor(h / 16));
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ContactShadow cx={0} cy={4} rx={w * 0.62} ry={12} opacity={0.4} />
      {Array.from({length: n}, (_, i) => {
        const lean = (rnd(seed * 7 + i) - 0.5) * 14 + Math.sin(f / 40 + i) * 0.6 * (i / n);
        const off = (rnd(seed * 3 + i) - 0.5) * 34 * (0.4 + i / n);
        const kraft = i % 3 === 0;
        return (
          <g key={i} transform={`translate(${off},${-i * 16}) rotate(${lean})`}>
            <rect x={-w / 2} y={-18} width={w} height={22} fill={kraft ? PAL.kraft : PAL.paper} stroke={PAL.ink} strokeWidth={4} />
            <path d={`M ${-w / 2 + 14} -8 L ${-w / 2 + 14 + 60 + (hash(i) % 90)} -8`} stroke={PAL.ink} strokeWidth={3} opacity={0.3} />
          </g>
        );
      })}
    </g>
  );
};

/** The USDA marker: a plain green signpost at the end of a dotted line. It has no door, no lock and no lights, because nothing has been decided. Origin = base centre. */
export const UsdaMarker: React.FC<{x: number; y: number; f: number; scale?: number; rise?: number}> = ({x, y, f, scale = 1, rise = 1}) => {
  const T = tones(PAL.green);
  const id = `um-${Math.round(x)}-${Math.round(y)}`;
  const r = clamp01(rise);
  return (
    <g transform={`translate(${x},${y + (1 - r) * 300}) scale(${scale})`} opacity={clamp01(r * 3)}>
      <defs><FormGradient id={id} t={T} /></defs>
      <ContactShadow cx={0} cy={4} rx={130} ry={14} opacity={0.4} />
      <rect x={-16} y={-420} width={32} height={420} fill="#7B5B3A" stroke={PAL.ink} strokeWidth={7} />
      <rect x={-170} y={-520} width={340} height={150} rx={10} fill={`url(#${id})`} stroke={PAL.ink} strokeWidth={8} />
      <rect x={-154} y={-504} width={308} height={118} rx={6} fill="none" stroke={PAL.paper} strokeWidth={3} opacity={0.7} />
      <text x={0} y={-418} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={64} letterSpacing={8} fill={PAL.paper}>USDA</text>
    </g>
  );
};

/** Brass calipers opening between two points. Origin = pivot (top). `open` 0..1. */
export const Calipers: React.FC<{x: number; y: number; f: number; scale?: number; open?: number; legLen?: number}> = ({x, y, f, scale = 1, open = 1, legLen = 360}) => {
  const a = 6 + 26 * clamp01(open) + 1.2 * Math.sin(f / 7);
  const T = tones(PAL.nickel);
  const id = `cal-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs><FormGradient id={id} t={T} /></defs>
      {[-1, 1].map((s) => (
        <g key={s} transform={`rotate(${s * a})`}>
          <path d={`M -20 0 L 20 0 L 10 ${legLen} L -10 ${legLen} Z`} fill={`url(#${id})`} stroke={PAL.ink} strokeWidth={6} strokeLinejoin="round" />
          <path d={`M 0 ${legLen} l ${-s * 22} 34`} stroke={PAL.ink} strokeWidth={7} strokeLinecap="round" />
        </g>
      ))}
      <circle cx={0} cy={0} r={24} fill={`url(#${id})`} stroke={PAL.ink} strokeWidth={6} />
      <circle cx={0} cy={0} r={8} fill={PAL.ink} />
    </g>
  );
};

/** A gust of loose rural tags. Positions are procedural in (x,y)-box `box`, jittering and tumbling. */
export const RuralSwirl: React.FC<{f: number; cx: number; cy: number; n?: number; r?: number; gust?: number; scale?: number; skip?: number}> = ({f, cx, cy, n = 9, r = 250, gust = 1, scale = 0.42, skip = -1}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      if (i === skip) return null;
      const ph = i * 1.7 + f / (14 + (i % 4) * 3);
      const tx = cx + Math.cos(ph) * r * (0.5 + 0.5 * rnd(i + 3)) * gust + 30 * Math.sin(f / 5 + i);
      const ty = cy + Math.sin(ph * 1.3) * r * 0.55 + 20 * Math.cos(f / 6 + i * 2);
      const rot = (f * (3 + (i % 5)) * (i % 2 ? 1 : -1)) % 360;
      return (
        <g key={i} transform={`translate(${tx},${ty}) rotate(${rot})`}>
          <KraftTag x={0} y={-60 * scale} f={f + i * 7} scale={scale} front={i % 3 === 0 ? 'smudge' : 'measured'} frontLabel="SHELF" stringLen={16} w={240} h={170} />
        </g>
      );
    })}
  </g>
);

/** The Anchorage tag: an official-looking steel plate tag (not kraft) for the rule side. */
export const SteelTag: React.FC<{x: number; y: number; f: number; scale?: number; text?: string}> = ({x, y, f, scale = 1, text = 'ANCHORAGE'}) => {
  const tsize = Math.min(24, Math.floor(224 / (text.length * 0.602 + 0.14)));
  const sway = Math.sin(f / 31) * 1.5;
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${sway})`}>
      <path d="M 0 0 L 0 40" stroke={PAL.ink} strokeWidth={5} />
      <g transform="translate(0,40)">
        <rect x={-130} y={0} width={260} height={150} rx={8} fill={PAL.steelHi} stroke={PAL.ink} strokeWidth={7} />
        <rect x={-130} y={0} width={260} height={46} rx={8} fill={PAL.steel} stroke={PAL.ink} strokeWidth={7} />
        <text x={0} y={34} textAnchor="middle" fontFamily={MONO} fontWeight={900} fontSize={tsize} letterSpacing={2} fill={PAL.snow}>{text}</text>
        <Barcode x={-100} y={96} w={200} h={40} seed={21} mess={0} />
      </g>
    </g>
  );
};
