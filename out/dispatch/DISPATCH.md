# DISPATCH 2026-07-14 — THE CLAIM ON THE TUNDRA

**Story:** Stak Energy applied to lease a square mile of North Slope state land near Deadhorse for
a gas-fired AI data center running at least a gigawatt (about 30% above all of urban Alaska's peak
demand). The company's own cost figures span a twentyfold range: roughly $500 million for initial
site work (per the DNR lease documents) to "over $10 billion" for the full build, its own estimate.
No confirmed customers, no confirmed chips. More than 500 public comments have been logged, fewer
than a dozen supportive; the company calls most of the opposition form letters. The state has not
decided; the comment window closes July 17, 2026.

**Honest caveat (drawn on screen):** this is a proposal, not a built thing. The campus renders as a
dashed, ghost wireframe throughout, never solid. The cost bar visibly leaps and cannot settle
between its low and high estimates. The check on the machine is Alaskans' own public comment record,
drawn as a physical paper-flood, 500-plus against a dozen.

**Angle for the series:** the AI buildout meets Alaska land and power head-on, told with sober,
institutional restraint (no savior framing, no doom framing) — the decision belongs to Alaska, and
it isn't made yet.

## Composition fingerprint
- pov: orbital-aerial · motion: assemble-build · hero: structure-as-subject
- layout: map-territory · register: blueprint-technical
- camera_strategy: rise-reveal · light_story: overcast-diffuse
- palette: silver-white overcast sky over sage and ochre tundra, gunmetal turbine steel, electric
  blueprint cyan wireframe, sodium flare orange, a single signal-red deadline flag
- metaphor: the AI buildout drawn as an unbuilt wireframe blueprint whose numbers won't settle,
  checked by a paper flood of public comment

## Shots (5 worlds, dimensional engine, ship scale 1.0, CUDA)
1. 0.0-12.0 THE LAND — aerial rise-reveal over empty tundra; a lone survey stake; the parcel claim
   draws itself onto the ground
2. 12.0-26.0 THE CLAIM ASSEMBLES — worm's-eye dolly as wireframe gas-turbine stacks rise and
   assemble overhead; one sodium flare ignites
3. 26.0-38.0 THE NUMBERS WON'T SETTLE — macro rack-focus on a cost bar leaping between ~$500M and
   over $10B; the campus behind it drops to dashed ghost lines
4. 38.0-50.0 THE PUBLIC COMMENT — a paper flood, 500-plus slips piling against a stack of a dozen
5. 50.0-60.0 ALASKA'S CALL — match-cut back to the land and stake; JULY 17 deadline stamp settles;
   wordmark resolves

## Voice + music
- VO: owner's cloned voice (Chatterbox, MIT license; Resemble Perth provenance watermark embedded),
  take A + E2 clarity dials, auto-normalized numbers/dates
- Music: "Long Note Two" — Kevin MacLeod (incompetech.com), CC BY 4.0

## Fact-check outcome (validator, adversarial)
- CLEAR_WITH_LABELS. Verified: 500+ comments/fewer than a dozen in favor (two-source); July 17
  deadline (two-source); cost split attributed by document ($500M lease docs vs company's own
  "over $10B"); "at least 1 GW" safe, "1-3 GW" range and detailed acreage/gas-volume figures
  labeled to the lease documents (single-source, not stated as verified state fact); Boyle quote
  used in full, not the misleading truncation. Native-angle quote (Ahkivgak/Native Movement)
  UNVERIFIED (source 403'd) — dropped entirely; general civic framing only, no monolithic "Alaska
  Native" framing.

## Quality gate + panel
- Objective gate: 17/17 checks PASS, 10.0/10.
- 3-judge panel: 7.96 / 8.06 / 9.10 → median 8.06 (ship threshold 9.0). Zero hard blockers from any
  judge. Delivered with the scorecard disclosed per the routine's own fallback rule (zero hard
  blockers + style-register-only complaints): motion blur on fast moves and the cost-bar easing
  curve were the named gaps, both requiring a further full 3D re-render.

## Production note
A render-tracking bug surfaced mid-run: a "full" 1800-frame re-render silently died partway
(~frame 852) without raising an error, and a naive file-count check (1800 files present) falsely
read as complete since old frames were never deleted, just not overwritten. Caught by checking
frame mtimes directly, not just counts. Re-rendered the missing range, verified by mtime, and
rebuilt the full downstream chain (chrome, gate, encode, upload) before delivery.

## Sources
See sources.json. Primary: ADN/Northern Journal 2026-07-07; Northern Journal 2026-07-03/07-06;
Northern Alaska Environmental Center (lease-document itemization); Alaska Public Media 2026-05-26.
