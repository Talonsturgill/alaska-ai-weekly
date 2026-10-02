import React, {useId} from 'react';
import {AnswerCard, Binder, DateTag, MONO, P, SERIF, clamp01} from './stack';
import {blurAt, passAlpha, perspScale} from './focus';

/**
 * THE TABLETOP KIT (2026-10-02, promoted from the 2026-09-30 episode for the scene system).
 *
 * "The Answer Was on Top" drew a whole desk-and-paper world inside one episode file: a phone on
 * a fog-lit slate, a lamp-lit kitchen table, a binder from overhead, a trooper's report with a
 * calendar strip, a counter receipt and a rubber stamp, a fogged window, a cork wall, a laptop,
 * an agency page with its fine print, an emergency-order slip and a tower of summaries. None of
 * it could be cast again, because it lived in that file's shot branches.
 *
 * Here it is reusable. Every component draws in its own local coordinates, takes its motion as
 * plain 0..1 props (so a scene spec can drive them from beat anchors), owns its gradient and
 * clip ids, and keeps the 09-30 palette (lib/stack.tsx P). Visible strings that are claims are
 * props, so the spec passes the claims string and the compiler can check it.
 */

const sid = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, '');
const hash = (i: number) => Math.imul(i + 1013, 2654435761) >>> 0;

/** Unreadable glyph rules: the house look for any text that is not a claims string. */
export const Glyphs: React.FC<{
  x: number; y: number; w: number; lines: number; gap?: number; color?: string; opacity?: number; seed?: number; progress?: number;
}> = ({x, y, w, lines, gap = 26, color = P.slate, opacity = 0.34, seed = 0, progress = 1}) => (
  <g>
    {Array.from({length: lines}, (_, i) => {
      const k = clamp01(progress * lines - i);
      return <rect key={i} x={x} y={y + i * gap} width={w * (0.5 + (hash(i + seed) % 45) / 100) * k} height={9} rx={4.5} fill={color} opacity={opacity} />;
    })}
  </g>
);

/** The fog-lit slate surface a phone lies on, with the table's own objects so fog is never the whole story. */
export const SlateSurface: React.FC<{f: number; objects?: boolean}> = ({f, objects = true}) => {
  const id = sid(useId());
  return (
    <g>
      <defs>
        <linearGradient id={`slate${id}`} x1="0" y1="0" x2="0.1" y2="1">
          <stop stopColor={P.fogHi} /><stop offset="0.55" stopColor={P.fog} /><stop offset="1" stopColor={P.fogLo} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#slate${id})`} />
      {Array.from({length: 5}, (_, i) => (
        <ellipse key={i} cx={((i * 300 + f * 0.35) % 1500) - 200} cy={620 + i * 150} rx={320 - i * 24} ry={46} fill={P.fogHi} opacity={0.22} />
      ))}
      {Array.from({length: 60}, (_, i) => {
        const h = hash(i + 9);
        return <circle key={i} cx={h % 1080} cy={(h >>> 8) % 1920} r={1.2 + (h % 3)} fill={P.paper4} opacity={0.18} />;
      })}
      {objects && (
        <g>
          <g transform="translate(150,640) rotate(-8)">
            <rect x={-6} y={8} width={290} height={380} fill={P.ink} opacity={0.25} />
            <rect x={0} y={0} width={290} height={380} fill={P.paper} stroke={P.ink} strokeWidth={3} />
            <rect x={0} y={0} width={290} height={46} fill={P.slate} />
            <Glyphs x={26} y={84} w={230} lines={8} gap={34} seed={71} opacity={0.32} />
          </g>
          <g transform="translate(930,1230) rotate(58)">
            <rect x={-6} y={6} width={330} height={26} rx={13} fill={P.ink} opacity={0.25} />
            <rect x={0} y={0} width={330} height={26} rx={13} fill={P.peat} stroke={P.ink} strokeWidth={3} />
            <rect x={20} y={5} width={220} height={4} rx={2} fill={P.cream} opacity={0.5} />
          </g>
          <path d="M900,1400 C820,1300 760,1260 700,1180" fill="none" stroke={P.ink} strokeWidth={9} opacity={0.75} strokeLinecap="round" />
          <path d="M900,1400 C820,1300 760,1260 700,1180" fill="none" stroke={P.paper4} strokeWidth={2} opacity={0.5} strokeLinecap="round" />
          <circle cx={930} cy={560} r={92} fill="none" stroke={P.paper5} strokeWidth={9} opacity={0.32} />
          <circle cx={930} cy={560} r={86} fill="none" stroke={P.fogHi} strokeWidth={3} opacity={0.4} />
        </g>
      )}
    </g>
  );
};

/** A phone slab centred on (0,0). Children draw inside the screen clip, (0,0) at the screen's top-left. */
export const Phone: React.FC<{w?: number; h?: number; glow?: number; children?: React.ReactNode}> = ({w = 500, h = 860, glow = 1, children}) => {
  const id = sid(useId());
  return (
    <g>
      <defs>
        <radialGradient id={`glow${id}`} cx="0.5" cy="0.62" r="0.7">
          <stop stopColor="#8FB3C7" stopOpacity={0.55} /><stop offset="1" stopColor="#0A1216" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`scr${id}`}><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={44} /></clipPath>
      </defs>
      <ellipse cx={14} cy={h / 2 + 26} rx={w / 2 + 40} ry={30} fill={P.ink} opacity={0.35} />
      <rect x={-w / 2 - 14} y={-h / 2 - 14} width={w + 28} height={h + 28} rx={58} fill="#10171B" stroke={P.ink} strokeWidth={5} />
      <path d={`M${-w / 2 + 30},${-h / 2 - 10} H${w / 2 - 30}`} stroke={P.cream} strokeWidth={3} opacity={0.7} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={44} fill="#0A1216" />
      <g clipPath={`url(#scr${id})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={`url(#glow${id})`} opacity={glow} />
        <g transform={`translate(${-w / 2},${-h / 2})`}>{children}</g>
      </g>
    </g>
  );
};

/** The search bar at the top of a phone screen, in screen coordinates. `text` types in from outside. */
export const SearchBar: React.FC<{x?: number; y?: number; w?: number; h?: number; text?: string; caret?: boolean; size?: number}> =
({x = 30, y = 70, w = 440, h = 78, text = '', caret = false, size = 30}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="#1B282F" stroke="#3C505B" strokeWidth={3} />
    <circle cx={x + 42} cy={y + h / 2} r={13} fill="none" stroke={P.paper4} strokeWidth={4} />
    <path d={`M${x + 52},${y + h / 2 + 10} l12,12`} stroke={P.paper4} strokeWidth={4} strokeLinecap="round" />
    <text x={x + 80} y={y + h / 2 + 11} fontFamily={MONO} fontWeight={700} fontSize={size} fill={P.cream}>{text}{caret ? '|' : ''}</text>
  </g>
);

/** Three dots pulsing under the search bar while a page loads. */
export const LoadingDots: React.FC<{f: number; x?: number; y?: number; k?: number}> = ({f, x = 210, y = 230, k = 1}) => (
  <g>
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={x + i * 40} cy={y} r={8 + 3 * Math.sin(f / 5 + i * 1.3)} fill={P.paper3} opacity={0.5 * k} />
    ))}
  </g>
);

/** A shimmer band sweeping across a screen while it loads. `k` 0..1 is the sweep. */
export const Shimmer: React.FC<{k: number; h?: number}> = ({k, h = 620}) => (
  <g transform={`translate(${-300 + 900 * k},0) skewX(-18)`} opacity={0.35 * Math.sin(Math.PI * clamp01(k))}>
    <rect x={0} y={150} width={90} height={h} fill={P.paper} />
  </g>
);

/** A thumb silhouette, tip at (0,0), extending down and to the right. */
export const Thumb: React.FC<{rot?: number; dip?: number}> = ({rot = -24, dip = 0}) => (
  <g transform={`translate(0,${dip}) rotate(${rot})`}>
    <g transform="translate(-4,-4)" opacity={0.85}><rect x={-62} y={-8} width={124} height={640} rx={62} fill={P.cream} /></g>
    <rect x={-62} y={-8} width={124} height={640} rx={62} fill={P.ink} />
    <ellipse cx={-14} cy={30} rx={20} ry={12} fill="#243038" opacity={0.7} />
  </g>
);

/** A dark wood table under one lamp, full frame. */
export const WoodTable: React.FC<{f?: number; lampX?: number; lampY?: number; lampRx?: number; lampRy?: number; lamp?: number}> =
({f = 0, lampX = 830, lampY = 760, lampRx = 560, lampRy = 640, lamp = 1}) => {
  const id = sid(useId());
  return (
    <g>
      <defs>
        <linearGradient id={`wood${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#3A2C22" /><stop offset="1" stopColor="#1E1712" />
        </linearGradient>
        <radialGradient id={`lamp${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor={P.lamp} stopOpacity={0.34} /><stop offset="1" stopColor={P.lamp} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#wood${id})`} />
      {Array.from({length: 30}, (_, i) => (
        <path key={i} d={`M-20,${i * 66 + (hash(i) % 20)} Q540,${i * 66 + 14 + (hash(i + 3) % 24)} 1100,${i * 66 + (hash(i + 5) % 20)}`}
          stroke="#150F0B" strokeWidth={2} fill="none" opacity={0.5} />
      ))}
      <ellipse cx={lampX} cy={lampY} rx={lampRx} ry={lampRy} fill={`url(#lamp${id})`} opacity={lamp * (0.94 + 0.06 * Math.sin(f / 30))} />
    </g>
  );
};

/**
 * A binder seen from overhead, spine on the left at (0,0), 540 by 680. `open` swings the cover
 * about the spine and leaves its page turned away in shadow. `turn` then turns that page TOWARD
 * the viewer to show its title strip, and `tab` slides a printed tab out of the page edge.
 */
export const BinderTop: React.FC<{open?: number; turn?: number; tab?: number; title?: string[]}> =
({open = 0, turn = 0, tab = 0, title = []}) => {
  const id = sid(useId());
  const sx = Math.cos(Math.PI * (1 - clamp01(turn)));
  const opened = turn > 0;
  return (
    <g>
      <defs><filter id={`soft${id}`}><feGaussianBlur stdDeviation={6} /></filter></defs>
      <rect x={-6} y={8} width={560} height={690} fill={P.ink} opacity={0.5} />
      <rect x={0} y={0} width={540} height={680} fill={P.paper2} stroke={P.ink} strokeWidth={4} />
      {!opened && (
        <g>
          <rect x={0} y={0} width={540} height={680} fill={P.ink} opacity={0.62 * open} />
          <g filter={`url(#soft${id})`} opacity={0.6 * open}>
            <rect x={40} y={50} width={460} height={580} fill={P.paper3} />
            <path d="M40,330 L500,120 V240 L40,470 Z" fill={P.lamp} opacity={0.22} />
          </g>
          <path d={`M540,0 L${540 - 40 * open},10 L${540 - 40 * open},670 L540,680 Z`} fill={P.paper4} opacity={0.6} />
          <g transform={`scale(${Math.cos(open * Math.PI * 0.94)},1)`}>
            <rect x={0} y={0} width={540} height={680} rx={10} fill={open > 0.5 ? P.peatHi : P.peat} stroke={P.ink} strokeWidth={5} />
            {open < 0.5 && <rect x={44} y={40} width={452} height={600} rx={6} fill="none" stroke={P.peatHi} strokeWidth={4} />}
          </g>
        </g>
      )}
      {opened && (
        <g>
          <g transform={`translate(270,0) scale(${sx || 0.001},1) translate(-270,0)`}>
            {sx < 0 ? (
              <g filter={`url(#soft${id})`}><rect x={30} y={30} width={480} height={620} fill={P.paper3} /></g>
            ) : (
              <g>
                <rect x={30} y={30} width={480} height={620} fill={P.paper} stroke={P.ink} strokeWidth={2} />
                <rect x={54} y={62} width={432} height={126} fill={P.peat} />
                {title.map((t, i) => (
                  <text key={i} x={270} y={112 + i * 46} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={1.5} fill={P.cream}>{t}</text>
                ))}
                <Glyphs x={56} y={232} w={420} lines={11} gap={34} seed={12} />
              </g>
            )}
          </g>
          <rect x={-190} y={0} width={190} height={680} fill={P.peatHi} stroke={P.ink} strokeWidth={4} transform="translate(-4,0)" />
          <g transform={`translate(${580 - 250 * tab},400)`} opacity={clamp01(tab * 3)}>
            <rect x={0} y={-28} width={440} height={56} rx={6} fill={P.paper} stroke={P.ink} strokeWidth={3} />
            <path d="M22,0 H330 M22,16 H240" stroke={P.peat} strokeWidth={7} strokeLinecap="round" opacity={0.8} />
          </g>
        </g>
      )}
      <rect x={-24} y={-4} width={46} height={688} rx={20} fill={P.peatLo} stroke={P.ink} strokeWidth={5} />
      <path d="M-12,14 V666" stroke={P.cream} strokeWidth={2.5} opacity={0.55} />
    </g>
  );
};

/** A phone seen from overhead on a table, centred on (0,0). `dim` darkens its screen. */
export const PhoneTop: React.FC<{dim?: number}> = ({dim = 0}) => (
  <g>
    <rect x={-80} y={-144} width={172} height={304} rx={26} fill={P.ink} opacity={0.35} />
    <rect x={-86} y={-152} width={172} height={304} rx={26} fill="#10171B" stroke={P.ink} strokeWidth={4} />
    <rect x={-74} y={-140} width={148} height={280} rx={18} fill="#7FA4B8" opacity={0.85 * (1 - 0.7 * dim)} />
  </g>
);

/** Arcs of a ringing call beside a raised phone. `k` 0..1 runs the ring. */
export const RingArcs: React.FC<{k: number}> = ({k}) => (
  <g>
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M${120 + i * 34},${-70 - i * 6} q26,${70 + i * 6} 0,${140 + i * 12}`} fill="none" stroke={P.cream}
        strokeWidth={4} opacity={k > 0 ? 0.5 * (1 - ((k * 3 + i * 0.3) % 1)) : 0} />
    ))}
  </g>
);

/** A fogged sedge marsh at first light, full frame. `drift` slides the far ridge. */
export const MarshBG: React.FC<{f: number; drift?: number}> = ({f, drift = 0}) => {
  const id = sid(useId());
  return (
    <g>
      <defs>
        <linearGradient id={`msky${id}`} x1="0" y1="0" x2="0.1" y2="1">
          <stop stopColor={P.fogHi} /><stop offset="0.55" stopColor={P.fog} /><stop offset="1" stopColor={P.fogLo} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#msky${id})`} />
      <path d={`M-40,900 ${Array.from({length: 24}, (_, i) => `L${i * 48},${820 - Math.abs(Math.sin(i * 1.9)) * 120 - (i % 3) * 22}`).join(' ')} L1120,900 Z`}
        fill={P.fogLo} opacity={0.55} transform={`translate(${-drift * 20},0)`} />
      {Array.from({length: 4}, (_, i) => (
        <rect key={i} x={-200 + ((f * (0.5 + i * 0.2) + i * 340) % 1500)} y={700 + i * 96} width={620} height={54} rx={27} fill={P.fogHi} opacity={0.35} />
      ))}
      <rect x={0} y={880} width={1080} height={1040} fill="#6F7C6C" />
      <rect x={0} y={880} width={1080} height={1040} fill={`url(#msky${id})`} opacity={0.28} />
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={180 + i * 260 + (hash(i) % 60)} cy={1240 + (i % 2) * 130} rx={130 + (hash(i + 4) % 50)} ry={28} fill={P.fogHi} opacity={0.55} />
      ))}
      {Array.from({length: 150}, (_, i) => {
        const h = hash(i + 41);
        const x = (h % 1180) - 50 + Math.sin(f / 40 + i) * 3, y = 930 + ((h >>> 9) % 700);
        const lean = ((h >>> 3) % 30) - 15;
        return <path key={i} d={`M${x},${y} q${lean * 0.4},-30 ${lean},-64`} stroke={P.lichenLo} strokeWidth={4 + (h % 3)} fill="none" strokeLinecap="round" opacity={0.7} />;
      })}
    </g>
  );
};

/** A snipe in flight, silhouette, beak to the right. */
export const Snipe: React.FC<{s?: number}> = ({s = 1.7}) => (
  <g transform={`scale(${s})`}>
    <ellipse cx={0} cy={0} rx={34} ry={13} fill={P.ink} />
    <path d="M32,-2 l52,-16" stroke={P.ink} strokeWidth={5} strokeLinecap="round" />
    <path d="M-6,-8 q-22,-40 -58,-46 q22,18 26,44 z" fill={P.ink} />
    <path d="M-6,-8 q-22,-40 -58,-46" stroke={P.cream} strokeWidth={2} fill="none" opacity={0.8} />
  </g>
);

/** A small paper tick: the count marker that lands where a bird was taken. */
export const TickSlip: React.FC = () => <rect x={-20} y={-9} width={40} height={18} rx={3} fill={P.paper} stroke={P.ink} strokeWidth={2} />;

/** A torn hunter-orange corner, the date tag's piece that stays behind. */
export const TornCorner: React.FC<{s?: number}> = ({s = 1}) => (
  <path d={`M0,0 l${40 * s},${-4 * s} l${-6 * s},${30 * s} z`} fill={P.orange} stroke={P.orangeLo} strokeWidth={3} />
);

/** A plain lined wall: an office, a counter, a newsroom. Full frame. */
export const RuledWall: React.FC<{fill?: string; line?: string; gap?: number; opacity?: number}> =
({fill = '#6E777D', line = P.paper5, gap = 50, opacity = 0.2}) => (
  <g>
    <rect width={1080} height={1920} fill={fill} />
    {Array.from({length: Math.ceil(1920 / gap)}, (_, i) => <path key={i} d={`M0,${i * gap}H1080`} stroke={line} strokeWidth={1.4} opacity={opacity} />)}
  </g>
);

/**
 * The trooper's report, 700 by 980 centred on (0,0), with a calendar strip. `sweep` runs a
 * bracket from SEPT 1 across to OCT 8, `drop` lands the OCT 8 marker, `corner` lays the torn
 * corner beside it.
 */
export const ReportSheet: React.FC<{sweep?: number; drop?: number; corner?: boolean}> = ({sweep = 0, drop = 0, corner = false}) => {
  const dayX = (d: number) => -290 + (d / 37) * 580;
  return (
    <g>
      <rect x={-346} y={-486} width={700} height={980} fill={P.ink} opacity={0.3} />
      <rect x={-350} y={-490} width={700} height={980} fill={P.paper} stroke={P.ink} strokeWidth={4} />
      <rect x={-320} y={-450} width={400} height={26} rx={8} fill={P.peat} opacity={0.85} />
      <Glyphs x={-320} y={-390} w={620} lines={5} gap={30} seed={2} />
      <g transform="translate(0,-40)">
        <rect x={-310} y={-8} width={620} height={16} fill={P.paper3} stroke={P.ink} strokeWidth={2} />
        {Array.from({length: 38}, (_, d) => (
          <path key={d} d={`M${dayX(d)},${d % 7 === 0 ? -36 : -22} V${d % 7 === 0 ? 36 : 22}`} stroke={P.slate} strokeWidth={d % 7 === 0 ? 3 : 2} opacity={0.6} />
        ))}
        <text x={dayX(0)} y={-52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={P.slate}>SEPT</text>
        <text x={dayX(31)} y={-52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={P.slate}>OCT</text>
        <rect x={dayX(0) - 14} y={-12} width={28} height={24} rx={4} fill={P.orange} stroke={P.orangeLo} strokeWidth={3} opacity={1 - 0.6 * sweep} />
        <path d={`M${dayX(0)},-70 V70 M${dayX(0) + (dayX(37) - dayX(0)) * sweep},-70 V70 M${dayX(0)},0 H${dayX(0) + (dayX(37) - dayX(0)) * sweep}`}
          stroke={P.peat} strokeWidth={6} fill="none" opacity={0.85} />
        <g transform={`translate(${dayX(37)},${-190 * (1 - drop)})`} opacity={clamp01(drop * 3)}>
          <rect x={-16} y={-24} width={32} height={56} rx={5} fill={P.peat} stroke={P.ink} strokeWidth={3} />
          <path d="M-16,-24 h32" stroke={P.cream} strokeWidth={2} />
        </g>
        {corner && <g transform={`translate(${dayX(37) + 40},46)`}><TornCorner /></g>}
      </g>
      <Glyphs x={-320} y={130} w={600} lines={6} gap={30} seed={8} />
    </g>
  );
};

/** A wall clock centred on (0,0). `hand` turns the hour hand in degrees; the second hand runs on `f`. */
export const WallClock: React.FC<{f: number; r?: number; hand?: number}> = ({f, r = 64, hand = 0}) => {
  const k = r / 64;
  return (
    <g>
      <circle r={r} fill={P.paper} stroke={P.ink} strokeWidth={5 * Math.max(1, k * 0.8)} />
      {Array.from({length: 12}, (_, i) => <path key={i} d={`M0,${-r + 10 * k} v${8 * k}`} transform={`rotate(${i * 30})`} stroke={P.ink} strokeWidth={3 * Math.max(1, k * 0.7)} />)}
      <path d={`M0,0 V${-r * 0.65}`} stroke={P.ink} strokeWidth={5 * Math.max(1, k * 0.7)} strokeLinecap="round" transform={`rotate(${hand})`} />
      <path d={`M0,0 V${-r * 0.8}`} stroke={P.slate} strokeWidth={2.5 * Math.max(1, k * 0.6)} strokeLinecap="round" transform={`rotate(${(f * 6) % 360})`} />
    </g>
  );
};

/** A counter receipt, 390 by 780 centred on (0,0). `ink` 0..1 spreads the stamped box. */
export const Receipt: React.FC<{ink?: number}> = ({ink = 0}) => (
  <g>
    <rect x={-190} y={-380} width={390} height={780} fill={P.ink} opacity={0.3} />
    <rect x={-195} y={-385} width={390} height={780} fill={P.paper} stroke={P.ink} strokeWidth={3} />
    <Glyphs x={-160} y={-330} w={310} lines={8} gap={34} seed={5} />
    <g opacity={ink} transform="translate(0,150)">
      <rect x={-180} y={-32} width={360} height={64} fill="none" stroke={P.peat} strokeWidth={6} />
      <path d="M-140,-8 H140 M-140,14 H70" stroke={P.peat} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
    </g>
  </g>
);

/** A rubber stamp, face down, its striking face at y 0..42 and its handle above. */
export const RubberStamp: React.FC = () => (
  <g>
    <circle cx={0} cy={-250} r={46} fill={P.peat} stroke={P.ink} strokeWidth={4} />
    <rect x={-34} y={-250} width={68} height={210} rx={24} fill={P.peatHi} stroke={P.ink} strokeWidth={4} />
    <path d="M-22,-240 V-50" stroke={P.cream} strokeWidth={3} opacity={0.5} />
    <rect x={-170} y={-40} width={340} height={82} rx={12} fill={P.peat} stroke={P.ink} strokeWidth={4} />
    <rect x={-170} y={20} width={340} height={22} rx={8} fill={P.ink} />
    <path d="M-160,-34 H160" stroke={P.cream} strokeWidth={3} opacity={0.6} />
  </g>
);

/** A card reader on the counter, centred on (0,0). */
export const CardReader: React.FC = () => (
  <g><rect x={-110} y={-40} width={200} height={110} rx={14} fill={P.ink} stroke={P.cream} strokeWidth={2} opacity={0.9} /><rect x={-92} y={-24} width={164} height={72} rx={8} fill="#22303A" /></g>
);

/**
 * A fogged window, full frame: an upright profile silhouette facing the light, her breath
 * blooming on the glass, condensation running, the frame and the sill. `f` breathes it.
 */
export const FoggedWindow: React.FC<{f: number}> = ({f}) => {
  const breathe = 0.5 + 0.5 * Math.sin(f / 26);
  return (
    <g>
      <rect width={1080} height={1920} fill="#1B252C" />
      <rect x={150} y={380} width={780} height={960} fill={P.fogLo} />
      <rect x={150} y={380} width={780} height={960} fill={P.fog} opacity={0.55} />
      <path d="M150,1000 Q400,900 930,1010 V1340 H150 Z" fill="#33424C" opacity={0.7} />
      <g transform="translate(420,1000)">
        <path d="M-190,340 Q-180,120 -70,70 L-30,50 Q-42,20 -44,-20 Q-70,-24 -74,-46 Q-96,-140 0,-176 Q92,-170 96,-92 Q112,-72 118,-56 L96,-40 Q100,-22 92,0 Q84,30 62,46 L70,90 Q210,110 250,340 Z" fill={P.ink} />
        <path d="M96,-92 Q112,-72 118,-56 L96,-40 Q100,-22 92,0 Q84,30 62,46" fill="none" stroke={P.cream} strokeWidth={4} opacity={0.75} />
        <path d="M-190,340 Q-180,120 -70,70 L-30,50 M62,46 L70,90 Q210,110 250,340" fill="none" stroke={P.cream} strokeWidth={5} opacity={0.6} />
      </g>
      <ellipse cx={540 + 6 * breathe} cy={960} rx={70 + 30 * breathe} ry={44 + 16 * breathe} fill={P.paper} opacity={0.14 + 0.1 * breathe} />
      <rect x={150} y={380} width={780} height={960} fill={P.paper} opacity={0.34} />
      {Array.from({length: 18}, (_, i) => {
        const h = hash(i + 61);
        const x = 190 + (h % 700), y0 = 420 + ((h >>> 8) % 500);
        const len = 60 + ((h >>> 3) % 240) * clamp01((f - i * 4) / 90);
        return <path key={i} d={`M${x},${y0} v${len}`} stroke={P.paper} strokeWidth={3} opacity={0.24} strokeLinecap="round" />;
      })}
      <rect x={130} y={360} width={820} height={40} fill={P.peat} stroke={P.ink} strokeWidth={4} />
      <rect x={130} y={1320} width={820} height={40} fill={P.peat} stroke={P.ink} strokeWidth={4} />
      <rect x={130} y={360} width={40} height={1000} fill={P.peat} stroke={P.ink} strokeWidth={4} />
      <rect x={910} y={360} width={40} height={1000} fill={P.peat} stroke={P.ink} strokeWidth={4} />
      <rect x={60} y={1284} width={960} height={64} fill={P.peatHi} stroke={P.ink} strokeWidth={4} />
    </g>
  );
};

/** A small call log on the sill, centred on (0,0). */
export const CallLog: React.FC = () => (
  <g>
    <rect x={-90} y={-70} width={190} height={110} fill={P.paper} stroke={P.ink} strokeWidth={3} transform="rotate(-3)" />
    <Glyphs x={-70} y={-48} w={150} lines={4} gap={22} seed={3} />
  </g>
);

/** A phone being set face down, centred on its base edge. `down` 0..1 lays it flat and darkens the glass. */
export const PhoneSetDown: React.FC<{down?: number}> = ({down = 0}) => (
  <g>
    <g transform={`rotate(${-8 * (1 - down)}) scale(1,${1 - 0.9 * down + 0.02})`}>
      <rect x={-56} y={-104} width={112} height={196} rx={16} fill="#10171B" stroke={P.ink} strokeWidth={3} />
      <rect x={-46} y={-94} width={92} height={176} rx={10} fill="#7FA4B8" opacity={0.85 * (1 - clamp01(down * 1.6))} />
    </g>
  </g>
);

/** A cork notice board, full frame, under a flickering office light. */
export const CorkBoard: React.FC<{f: number}> = ({f}) => {
  const id = sid(useId());
  return (
    <g>
      <defs>
        <linearGradient id={`cork${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#9A927F" /><stop offset="1" stopColor="#7D7563" />
        </linearGradient>
        <filter id={`soft${id}`}><feGaussianBlur stdDeviation={6} /></filter>
      </defs>
      <rect width={1080} height={1920} fill={`url(#cork${id})`} />
      {Array.from({length: 240}, (_, i) => {
        const h = hash(i + 77);
        return <circle key={i} cx={h % 1080} cy={(h >>> 8) % 1920} r={2 + (h % 4)} fill={h % 2 ? '#B9B29E' : '#655E4E'} opacity={0.32} />;
      })}
      <rect width={1080} height={1920} fill={P.paper} opacity={0.06 + 0.04 * Math.sin(f / 3.1)} />
      <rect x={0} y={460} width={1080} height={10} fill={P.paper} opacity={0.5} filter={`url(#soft${id})`} />
    </g>
  );
};

/** A push pin, its point at (0,0). `k` 0..1 presses it in from above. */
export const Pin: React.FC<{k?: number}> = ({k = 1}) => (
  <g transform={`translate(0,${-30 * (1 - k)})`} opacity={clamp01(k * 3)}>
    <ellipse cx={5} cy={7} rx={11} ry={5} fill={P.ink} opacity={0.4} />
    <circle r={11} fill={P.peat} stroke={P.ink} strokeWidth={3} />
    <circle cx={-3} cy={-3} r={3.5} fill={P.cream} opacity={0.8} />
  </g>
);

/**
 * A card pinned to a board, centred on (0,0). `lines` are its printed lines in serif, a quote
 * split where it reads naturally; with no lines it is a blank card of glyph rules. `pin` 0..1
 * presses its pin, `swing` is its rotation in degrees.
 */
export const PinnedCard: React.FC<{w?: number; h?: number; lines?: string[]; size?: number; pin?: number; swing?: number; seed?: number}> =
({w = 560, h = 270, lines = [], size = 38, pin = 1, swing = 0, seed = 0}) => (
  <g transform={`rotate(${swing})`}>
    <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} fill={P.ink} opacity={0.32} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={P.paper} stroke={P.ink} strokeWidth={3} />
    {lines.length > 0
      ? lines.map((t, i) => (
        <text key={i} x={0} y={-h / 2 + h * 0.36 + i * size * 1.7 - (lines.length - 2) * size * 0.6} textAnchor="middle" fontFamily={SERIF}
          fontWeight={900} fontSize={size} fill={P.peat}>{t}</text>
      ))
      : <Glyphs x={-w / 2 + 22} y={-h / 2 + 30} w={w - 50} lines={3} gap={26} seed={seed} />}
    <g transform={`translate(0,${-h / 2 + 10})`}><Pin k={pin} /></g>
  </g>
);

/** A search results page in screen coordinates (560 wide), with the orange answer card on top. */
export const ResultsPage: React.FC = () => (
  <g>
    <rect x={30} y={60} width={500} height={70} rx={35} fill="#1B282F" stroke="#3C505B" strokeWidth={3} />
    <Glyphs x={40} y={190} w={470} lines={3} gap={34} color={P.paper4} opacity={0.5} seed={11} />
    <rect x={30} y={320} width={500} height={280} rx={16} fill={P.paper} />
    <AnswerCard x={280} y={470} w={300} land={1} small text={['SEASON BEGAN', 'SEPT 1']} />
    <Glyphs x={40} y={650} w={470} lines={6} gap={34} color={P.paper4} opacity={0.4} seed={13} />
  </g>
);

/** A plain help page in screen coordinates (560 wide). `highlight` 0..1 drags a highlighter across `warning`. */
export const HelpPage: React.FC<{warning: string; highlight?: number}> = ({warning, highlight = 0}) => (
  <g>
    <rect x={0} y={0} width={560} height={1100} fill={P.paper} />
    <rect x={0} y={0} width={560} height={110} fill={P.slate} />
    <Glyphs x={30} y={44} w={300} lines={2} gap={22} color={P.paper} opacity={0.8} seed={4} />
    <Glyphs x={30} y={170} w={500} lines={4} gap={30} seed={6} />
    <rect x={22} y={352} width={516 * highlight} height={52} fill="#B8C7B0" opacity={0.9} />
    <text x={30} y={388} fontFamily={MONO} fontWeight={800} fontSize={21} letterSpacing={0.5} fill={P.peat}>{warning}</text>
    <Glyphs x={30} y={450} w={500} lines={8} gap={30} seed={9} />
  </g>
);

/**
 * A laptop, screen centred on (0,0), w by h. `lid` 0..1 opens it from closed. `base` draws the
 * keyboard deck below the hinge. Children draw on the screen in screen-centred coordinates.
 */
export const Laptop: React.FC<{w?: number; h?: number; lid?: number; base?: boolean; children?: React.ReactNode}> =
({w = 820, h = 560, lid = 1, base = true, children}) => (
  <g>
    {base && (
      <g>
        <ellipse cx={0} cy={h / 2 + 100} rx={w * 0.63} ry={26} fill={P.ink} opacity={0.4} />
        <path d={`M${-w * 0.52},${h / 2} H${w * 0.52} L${w * 0.57},${h / 2 + 70} H${-w * 0.57} Z`} fill="#20282D" stroke={P.ink} strokeWidth={5} />
      </g>
    )}
    <g transform={`translate(0,${h / 2}) scale(1,${0.15 + 0.85 * clamp01(lid)}) translate(0,${-h / 2})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill="#10171B" stroke={P.ink} strokeWidth={6} />
      <rect x={-w / 2 + 26} y={-h / 2 + 26} width={w - 52} height={h - 52} rx={8} fill={P.paper} />
      {children}
    </g>
  </g>
);

/** An email in an outbox row, 380 by 70 at (0,0) top-left. `tick` 0..1 pops the delivered tick. */
export const EmailRow: React.FC<{tick?: number}> = ({tick = 0}) => (
  <g>
    <rect x={0} y={0} width={380} height={70} rx={8} fill={P.paper2} stroke={P.slate} strokeWidth={3} />
    <Glyphs x={16} y={24} w={230} lines={2} gap={20} seed={22} />
    <g transform={`translate(340,36) scale(${tick})`}><path d="M-16,0 l10,12 l22,-26" stroke={P.lichenLo} strokeWidth={7} fill="none" strokeLinecap="round" /></g>
  </g>
);

/** An empty inbox slot waiting for a reply, 380 by 70 at (0,0) top-left. */
export const EmptySlot: React.FC = () => (
  <rect x={0} y={0} width={380} height={70} rx={8} fill="none" stroke={P.paper4} strokeWidth={3} strokeDasharray="10 8" opacity={0.7} />
);

/**
 * An agency page with a masthead, centred on (0,0), 920 by 800. `typed` 0..1 types its fine
 * print, `star` 0..1 grows the asterisk, `stamp` 0..1 slams the stamp `stampText` across it,
 * `sag` 0..1 sags the page under weight, `fold` 0..1 folds its footer up.
 */
export const AgencyPage: React.FC<{masthead?: string; typed?: number; star?: number; stamp?: number; stampText?: string; sag?: number; fold?: number; w?: number; h?: number}> =
({masthead = 'ADF&G', typed = 1, star = 0, stamp = 0, stampText = '', sag = 0, fold = 0, w = 920, h = 800}) => (
  <g transform={`skewY(${2.5 * sag}) translate(0,${18 * sag})`}>
    <rect x={-w / 2 + 4} y={-h / 2 + 4} width={w} height={h} fill={P.ink} opacity={0.4} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={P.paper} stroke={P.ink} strokeWidth={5} />
    <rect x={-w / 2} y={-h / 2} width={w} height={110} fill={P.peat} />
    <text x={-w / 2 + 40} y={-h / 2 + 70} fontFamily={MONO} fontWeight={800} fontSize={46} letterSpacing={3} fill={P.cream}>{masthead}</text>
    <Glyphs x={-w / 2 + 40} y={-h / 2 + 150} w={w - 80} lines={11} gap={38} seed={40} progress={typed} opacity={0.4} />
    {star > 0.01 && <text x={-w / 2 + 30} y={-h / 2 + 132} fontFamily={SERIF} fontWeight={900} fontSize={70 * star} fill={P.peat}>*</text>}
    <g transform={`translate(0,${h / 2 - 34}) scale(1,${1 - 0.85 * fold})`} opacity={1 - 0.2 * fold}>
      <rect x={-w / 2 + 2} y={-4} width={w - 4} height={30} fill={P.paper2} />
    </g>
    {stamp > 0.01 && (
      <g transform={`translate(150,150) rotate(-8) scale(${stamp})`} opacity={clamp01(stamp * 2)}>
        <rect x={-190} y={-44} width={380} height={88} fill="none" stroke={P.peat} strokeWidth={7} opacity={0.9} />
        <text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} letterSpacing={4} fill={P.peat}>{stampText}</text>
      </g>
    )}
  </g>
);

/** An order slip, 480 by 270 centred on (0,0), its heading in the peat band. */
export const OrderSlip: React.FC<{heading: string; w?: number; h?: number; size?: number; lines?: number}> =
({heading, w = 480, h = 270, size = 36, lines = 3}) => (
  <g>
    <rect x={-w / 2 + 6} y={-h / 2 + 12} width={w} height={h} fill={P.ink} opacity={0.4} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={P.paper} stroke={P.peat} strokeWidth={6} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.26} fill={P.peat} />
    <text x={0} y={-h / 2 + h * 0.18} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={2} fill={P.cream}>{heading}</text>
    <Glyphs x={-w / 2 + 30} y={-h / 2 + h * 0.37} w={w - 60} lines={lines} gap={34} seed={50} />
  </g>
);

/** A mailer envelope, 340 by 210 centred on (0,0). */
export const Mailer: React.FC = () => (
  <g>
    <rect x={-156} y={-96} width={340} height={210} fill={P.ink} opacity={0.35} />
    <rect x={-160} y={-104} width={340} height={210} fill={P.paper} stroke={P.ink} strokeWidth={4} />
    <rect x={-160} y={-104} width={340} height={44} fill={P.peat} />
    <Glyphs x={-130} y={-30} w={250} lines={3} gap={30} seed={33} />
  </g>
);

/** The inside of a patrol cab on the right half of a split frame: dash edge, wheel arc, wipers. */
export const CabInterior: React.FC<{f: number}> = ({f}) => (
  <g>
    <path d="M540,1180 Q800,1090 1080,1150 V1920 H540 Z" fill="#0B1013" />
    <path d="M600,1420 A360,360 0 0 1 1080,1300" fill="none" stroke="#1C262C" strokeWidth={54} />
    <path d="M600,1420 A360,360 0 0 1 1080,1300" fill="none" stroke={P.cream} strokeWidth={3} opacity={0.4} />
    {Array.from({length: 3}, (_, i) => (
      <path key={i} d={`M${560 + i * 30},700 Q800,${560 + i * 24 + 30 * Math.sin(f / 40)} 1080,${700 - i * 20}`} stroke={P.fogHi} strokeWidth={2} fill="none" opacity={0.18} />
    ))}
    <g opacity={0.5}><path d={`M600,300 A480,480 0 0 1 ${600 + 440 * Math.sin((f / 45) % Math.PI)},360`} stroke={P.paper4} strokeWidth={4} fill="none" /></g>
  </g>
);

/**
 * THE SUMMARY TOWER, the 09-30 signature shot, full frame. Four summary sheets stacked over the
 * one thick binder, seen down a camera that dives through them. `fall` 0..1 drops the sheets in
 * (staggered inside), `hold` settles the pre-dive framing, `dive` 0..1 descends through the four
 * layers a second each, `landed` lands the emergency-order slip and the blank tag on the binder,
 * `corner` lifts the top sheet's corner. The four faces are the worlds the film has visited.
 */
export const SummaryTower: React.FC<{
  f: number; fall?: number; hold?: number; dive?: number; diving?: boolean; landed?: number; slip?: number; tagFall?: number; corner?: number;
  faces?: {label: string; size?: number}[]; slipHeading?: string; stampText?: string;
}> = ({f, fall = 1, hold = 0, dive = 0, diving = false, landed = 0, slip = 0, tagFall = 0, corner = 0,
  faces = [{label: 'AI ANSWER', size: 34}, {label: '', size: 26}, {label: 'ADF&G', size: 38}, {label: '', size: 24}],
  slipHeading = '', stampText = ''}) => {
  const id = sid(useId());
  const wp = [-0.55, 0.65, 1.65, 2.65, 3.55];
  const seg = Math.min(3, Math.floor(clamp01(dive) * 4));
  const s = clamp01(clamp01(dive) * 4 - seg);
  const inOut = (x: number) => x * x * (3 - 2 * x);
  const uDive = dive >= 1 ? wp[4] : wp[seg] + (wp[seg + 1] - wp[seg]) * inOut(clamp01(s * 2));
  const u = diving ? uDive : -1.15 + 0.6 * hold;
  const fills = [P.paper, P.paper2, P.paper3, P.paper4];
  const planeXY = (d: number) => {
    const sc = perspScale(d, 0.34) * 1.3;
    return {sc, x: 540, y: 1080 - d * 260 * (sc / 1.3)};
  };
  const fallOf = (i: number) => clamp01(fall * 4 - (3 - i) * 0.35);
  const wob = (i: number) => Math.sin(f / 11 + i * 1.7) * 1.3 * (1 - landed);
  const Head: React.FC<{fill: string; text: string; color?: string; size?: number}> = ({fill, text, color = P.cream, size = 28}) => (
    <g>
      <rect x={-380} y={-270} width={760} height={92} fill={fill} />
      <text x={-352} y={-212} fontFamily={MONO} fontWeight={800} fontSize={size} letterSpacing={1.5} fill={color}>{text}</text>
    </g>
  );
  const Face: React.FC<{i: number}> = ({i}) => {
    const fc = faces[i] ?? {label: ''};
    if (i === 0) return (
      <g>
        <Head fill={P.orangeLo} text={fc.label} size={fc.size ?? 34} />
        <AnswerCard x={0} y={20} w={520} land={1} label="" />
        <g transform="translate(300,-140)"><DateTag x={0} y={0} s={0.8} rot={6} text="" crease={0.4} /></g>
      </g>
    );
    if (i === 1) return (
      <g>
        <Head fill={P.slate} text={fc.label} size={fc.size ?? 26} />
        <Glyphs x={-350} y={-140} w={600} lines={2} gap={30} seed={6} />
        <rect x={-360} y={-50} width={720} height={64} fill="#B8C7B0" opacity={0.9} />
        <Glyphs x={-340} y={-30} w={520} lines={1} color={P.peat} opacity={0.5} seed={2} />
        <Glyphs x={-350} y={50} w={640} lines={5} gap={30} seed={9} />
      </g>
    );
    if (i === 2) return (
      <g>
        <Head fill={P.peat} text={fc.label} size={fc.size ?? 38} />
        <Glyphs x={-350} y={-140} w={700} lines={6} gap={32} seed={33} />
        <g transform="translate(120,90) rotate(-8)">
          <rect x={-170} y={-40} width={340} height={80} fill="none" stroke={P.peat} strokeWidth={6} />
          <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={40} letterSpacing={4} fill={P.peat}>{stampText}</text>
        </g>
      </g>
    );
    return (
      <g>
        <Head fill={P.slate} text={fc.label} size={fc.size ?? 24} />
        <Glyphs x={-350} y={-130} w={640} lines={4} gap={34} seed={44} />
        <Glyphs x={-350} y={30} w={560} lines={3} gap={34} seed={45} />
      </g>
    );
  };
  const b = planeXY(4 - u);
  return (
    <g>
      <defs>
        <linearGradient id={`ground${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#56636C" /><stop offset="1" stopColor="#3E4A53" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#ground${id})`} />
      <rect width={1080} height={1920} fill={P.ink} opacity={0.12 + 0.12 * clamp01((u + 0.6) / 4)} />
      <g transform={`translate(${540 - 270 * b.sc * 0.92},${b.y - 260 * b.sc * 0.92}) scale(${b.sc * 0.92})`}>
        <Binder x={0} y={0} w={540} h={520} depth={56} showPage={false} />
        <path d="M-22,10 V500" stroke={P.cream} strokeWidth={4} opacity={0.8} />
        <path d="M0,4 H540" stroke={P.cream} strokeWidth={3} opacity={0.6} />
        <g transform={`translate(210,${210 - 800 * (1 - slip)}) rotate(${-4 * (1 - slip)})`} opacity={clamp01(slip * 3)}>
          <OrderSlip heading={slipHeading} w={300} h={170} size={24} lines={2} />
        </g>
        {landed > 0.4 && <DateTag x={90} y={80 + 240 * (1 - landed)} s={1.0} rot={-4} state="cream" />}
      </g>
      {[3, 2, 1, 0].map((i) => {
        const d = i - u;
        const fk = fallOf(i);
        const a = passAlpha(d, 0.32) * clamp01(fk * 2);
        if (a <= 0.01) return null;
        const p = planeXY(d);
        const bl = blurAt(i, u, 1.5, 0.4, 7);
        const drop = -1000 * (1 - fk);
        return (
          <g key={i} opacity={a} filter={bl > 0.2 ? `url(#bl${id}${i})` : undefined}
            transform={`translate(${p.x},${p.y + drop * p.sc}) rotate(${wob(i) + (i === 0 ? -corner * 2 : 0)}) skewX(-8) scale(${p.sc * 1.02},${p.sc * 0.9})`}>
            <defs><filter id={`bl${id}${i}`}><feGaussianBlur stdDeviation={bl} /></filter></defs>
            <rect x={-372} y={-262} width={760} height={520} fill={P.ink} opacity={0.3} />
            <rect x={-380} y={-270} width={760} height={520} fill={P.cream} />
            <rect x={-380} y={-270} width={760} height={520} fill={fills[i]} opacity={0.92} stroke={P.ink} strokeWidth={4} />
            <path d="M-376,-266 H376" stroke={P.cream} strokeWidth={4} opacity={0.9} />
            <Face i={i} />
          </g>
        );
      })}
      {tagFall > 0 && tagFall < 1 && (
        <DateTag x={620 - 40 * tagFall} y={470 + 1000 * tagFall * tagFall} s={0.8} rot={6 + 240 * tagFall} text="" crease={0.6} />
      )}
    </g>
  );
};
