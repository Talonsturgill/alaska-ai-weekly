# DISPATCH 2026-07-17 — "IT'S DIGGING FOR ITS OWN PARTS"

**Story:** UAF wins a $15M NSF Critical Mineral Accelerator Engine that uses AI to prospect
for Alaska's critical minerals. The great irony: those minerals (cobalt, graphite, gallium,
germanium, nickel, rare earths) are the exact raw materials that go into the AI's own chips.
A machine reaching into the ground for its own parts.

## Winning treatment (writers-room panel, scorer-graded)

The panel pitched three full treatments; a scorer graded them on scroll-stop power, emotional
arc, honest-caveat clarity, feasibility with the current library, and freshness vs the ledger.

- **Comedian ("Self-Made Man")** — freshest hero, best hook, but a bespoke toothy biped robot
  is the least buildable (not the `ServerMachine` rack rig). Grafted in: the still-hungry
  chest-socket **button** and the chip-clicks-into-one-socket loop.
- **Dramatist ("What The Machine Is Looking For")** — best emotional arc (a geologist's genuine
  want), but reused the prior dispatch's navy radial-burst look. Grafted in: the **rusted
  pickaxes ignored** gag, the **pencil-snaps-its-tip** gag, the **cargo ship + verified Sullivan
  quote** beat, and the **"MADE WITH: COBALT · GRAPHITE · GALLIUM" chest label**.
- **Explainer ("It's Digging For Its Own Parts") — WINNER.** Most buildable (reuses
  `ServerMachine` wholesale; its built-in `emotion='ghost'` variant literally *is* the
  $160M-not-awarded caveat) and the clearest DRAWN honest caveat (the $15M-solid vs $160M-ghost
  scale-stack). Crowned as the spine, repainted for freshness and grafted with the beats above.

## Palette (fresh, distinct from the last 2 dispatches)

Underground world, unused across the ledger:
- **World / bedrock:** amethyst-plum (`#3d2a55` base, `#2a1c3d` shade)
- **Hero metal:** copper-rose (`#c56b4a` main, `#8f4a30` shade, `#e0a07f` highlight) — re-skins
  the STEEL-blue `ServerMachine` and is thematically literal (a machine made of mined metal)
- **Value / ore + chip:** citrine-gold `#ffc21e`
- **Accent (one):** phosphor-lime `#b6ff3a` — the AI's signature only: the narrowing search-circle,
  the 56 igniting tiles, the dashed ghost-money model.

## Hero design (build-ready, off the current library)

- **Prospecting machine:** reuse `kit.tsx > ServerMachine` geometry + emotion state machine
  wholesale. THREE small additions: (1) a down-angled **drill-bit/claw right-arm** attachment
  (never the plug-reach), (2) a front **chest chip-socket** (reuse the `ghost` variant's dashed
  chip-slot rect on the solid body) + the "MADE WITH…" label, (3) parameterize the hardcoded
  `STEEL/STEEL_D/STEEL_L` fills so the copper re-skin renders (the one non-trivial build task).
- **Geologist:** stock `Character` rig — `outfit='worker'`, hardhat auto-renders, `pose='point'`
  (neutral→shock), reused for the pickaxe-swing button.
- **$160M ghost model:** the same machine re-rendered at `emotion='ghost'`, `scale≈1.8`, lime
  dashed, low-opacity pulse. Free from the library.
- **Camera:** vertical-descent (we go DOWN into the earth); cross-section cutaway for the
  mineral-vein/periodic beats; two snap-zoom punches (`FX` SpeedLines/ImpactStar/ZoomVignette)
  on the chip-reveal and the ghost scale-stack; loop the final push-back into the exact cold-open.

## VO script (~120 words, owner's cloned voice; numbers spoken as words, numerals on screen)

> An AI system is digging into Alaska's ground, hunting for the metals it is built from. The
> University of Alaska Fairbanks won fifteen million dollars from the National Science Foundation.
> One of twelve engines picked across twenty states, aimed at Alaska's bedrock. Fifty six of sixty
> critical minerals sit here: cobalt, graphite, gallium, nickel, rare earths. Crack one open, and
> inside is the same chip the machine needs to keep thinking. It is mining itself. Up to one
> hundred sixty million dollars is possible over ten years. That part is not funded yet. Only
> fifteen million is real. Geologists still have to swing the pick. Alaska found the flashlight.
> It has not found the minerals yet.

## Honest caveat (drawn, not just narrated)

Three physical caveats on screen: (1) the **$160M ghost model** labeled "NOT AWARDED" next to the
solid $15M model; (2) the geologist's **pickaxe DOINK** off bare bedrock stamped "UNPROVEN AT
SCALE" — AI narrows the search, a human still has to swing the pick, and can still find nothing;
(3) the button's **still-empty chest sockets** — one part filled, the rest still hungry.

See `storyboard.json` for the full beat map (14 beats), shot list (7 shots), hook, and audio arc.
