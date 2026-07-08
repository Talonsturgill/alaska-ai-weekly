# SLIDE DOSSIER SPEC — the per-slide design document

NO SLIDE IS CODED WITHOUT A COMPLETE DOSSIER. The directors room produces
one dossier per slide inside `out/<run>/storyboard.md`. This is where the
thinking happens — the art code merely executes it. A dossier that could
describe two different slides is too vague; a reviewer should be able to
sketch the slide from the dossier alone. Every field is REQUIRED (write
"none — because <reason>" rather than omitting).

Extreme depth is the point: decisions are made HERE, at planning altitude,
not improvised in code. Budget 150-400 words of specification per slide
plus the checklist.

---

## Dossier fields (per slide)

### A. NARRATIVE
1. **Beat** — this slide's single job in the deck's arc (e.g., "escalation:
   make the cost concrete"), and the open loop it inherits + the one it
   plants for the next slide.
2. **Copy, final** — every string that will appear, verbatim, with character
   counts: kicker, headline (marked line breaks, ≤3 lines, broken by sense),
   body (25-50 words), annotations, labels, units, footer, counter. Straight
   quotes, no em/en dashes ever, numerals tabular. Each factual string
   carries its claim-id from claims.json.
3. **Reader takeaway** — the one sentence a scroller retains at 432px.

### B. COMPOSITION
4. **Layout map** — grid placement in twelfths: which columns/rows each
   block occupies, the focal point (rule-of-thirds coordinate), the eye
   path (1→2→3), the quiet zone, and the single permitted grid violation
   if any.
5. **Depth plan** — the slide's z-stack, layer by layer (background →
   atmosphere → structure → anchor → plates → type → grain), with the ≥4
   depth cues named (occlusion/atmosphere/scale/DOF/fog/shadow/light) and
   the focal plane stated. For 3D scenes: camera pos/pitch/fov/cy and the
   computed horizonY + expected peak/subject screen-y (show the arithmetic).
6. **Continuity device state** — what the deck motif does HERE (route
   extends to km X, fill at N%, axis wght 640→720), what bleeds off the
   right edge to pull the swipe, and what the panorama spine shows in this
   1080px window.

### C. ART DIRECTION
7. **Technique stack** — the named techniques (library numbers or "NEW:"),
   with ALL load-bearing parameters: seeds, frequencies, octaves, counts,
   palettes-per-element, stroke weights, blend modes, filter params.
   Deterministic: another run of the same dossier = the same image.
8. **Data-in-art mapping** — which story numbers drive which parameters
   ("particle count = 43 MW → 4,300 particles", "contour interval = 1 year
   of permitting"), stated so the critic can verify.
9. **Palette assignment** — hex per role: bg base, atmosphere hues, structure
   ink(s), anchor, type primary/secondary, accent (gold budget: where does
   #FFC72C appear and NOWHERE else), estimated worst-case text-contrast
   pairs with target ratios.
10. **Type spec** — per text block: family, size px, weight (+ variation
    axes), leading, tracking, case, color, alignment, max width px, and the
    fit strategy (fixed / binary-search fit-to-box).
11. **Iconography/anchor spec** — the literal anchor element (geo silhouette,
    diagram, pictograms): its source data, projection/construction, size,
    position; the annotation furniture (leader lines, ticks, scale bar,
    coordinates) and their weights.

### D. VERIFICATION
12. **Reference intent** — one line naming the aesthetic register ("NASA
    mission poster meets APF telemetry", "Bloomberg BW spread, arctic
    edition") — NOT a template to copy, a taste anchor for the critic.
13. **Risk flags** — what could go wrong in render (long headline, busy
    field under text, tiny labels, panorama seam) and the mitigation
    already built into the spec.
14. **Acceptance checklist** — 5-10 slide-specific, binary checks the pixel
    critic must verify beyond the global standards, e.g.:
    - [ ] route terminates exactly at Nome's dot, label clear of coastline
    - [ ] all 6 borough labels readable at thumb size
    - [ ] headline baseline sits on row 5 gridline; no descender collision
    - [ ] particle density visibly denser on the right half (43 vs 12 MW)
    - [ ] gold appears ONLY on the route and the counter

---

## Deck-level dossier header (once per storyboard)

- **Thesis** — the deck's argument in one sentence; the title (≤60 chars)
  for the PDF document.
- **Arc** — named beats slide-by-slide in one line each (hook → ... → close)
  and where the emotional temperature shifts.
- **Slide count rationale** — why N slides (6-12 band, 8-10 default).
- **Continuity system** — which devices (panorama/motif/edge-tease/camera/
  palette-arc), with the motif's full state table across slides.
- **Variety ledger check** — the last 4 decks' hero structures/atmospheres/
  hooks (from ledger/artwork.json) and this deck's REQUIRED divergence,
  stated explicitly ("last week was cartographic dark-teal panorama; this
  week is isometric amber system-cutaway with white ground").
- **Variance dials** — DESIGN_VARIANCE (how far from house center, 1-5),
  VISUAL_DENSITY (1-5), TYPE_TEMPERATURE (cool grotesk ↔ warm serif),
  chosen deliberately and justified.
- **Palette + type system** — the deck's full palette with roles, the 1-2
  families + axes.
- **Claims index** — claim-id → slide(s) where used.
