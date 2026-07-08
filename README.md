# Alaska.Ai — Weekly LinkedIn Carousel Studio

An autonomous Claude Code routine that produces one world-class LinkedIn
carousel per week about Alaska and AI: researched, fact-checked,
storyboarded in forensic detail, rendered as bespoke code-crafted artwork,
reviewed pixel by pixel, and delivered as a post-ready Gmail draft.

## How a run works

```
wake (ledgers + instincts + variance dials)
  → craft refresh (light web study, keeps the brain current)
  → research sweep (6 parallel scouts: power/compute, research+Indigenous
    AI, AI in the field, policy+money, robotics, community signal)
  → fact-check → claims.json (atomic claims, verbatim evidence, kill log)
  → topic selection + 90-day semantic dedupe gate
  → DIRECTORS ROOM: 3 treatment pitches from rotating creative lenses
    → showrunner synthesis → storyboard with a full DOSSIER per slide
    (copy w/ claim-ids, layout map, depth plan with computed camera math,
    technique stack with seeds+parameters, data-in-art mappings, palette
    roles, type specs, acceptance checklist)
  → copy chamber (voice-locked caption + first-comment sources; objective
    lint gate)
  → art build (bespoke HTML/CSS/SVG/Canvas per slide; offline; seeded)
  → render 1080x1350 @2x → machine QA (errors, fonts, overflow, contrast,
    safe zones)
  → pixel critics (parallel, per slide, full-size + 432px thumb: transcribe
    every word, verify every checklist item) → revise loop
  → flow critic (contact sheet as filmstrip: arc, seams, swipe pulls)
  → assemble (VECTOR-text PDF via Chromium print + pypdf, thumbs, contact
    sheet)
  → scorer vs weighted rubric + hard-fail list
  → ship (commit runs/<date>/, merge to main, verify raw URLs)
  → Gmail draft (paste-ready post + comment block + previews + URLs +
    report card + aftercare)
  → retro (ledgers: topics, artwork variety, confidence-scored instincts)
```

## What makes it different

- **A brain, not a template.** `knowledge/` holds a distilled, sourced
  playbook: LinkedIn performance science (slide counts, dwell mechanics,
  caption fold, PDF-vs-image evidence), a visual doctrine (Swiss grids,
  typography, OKLCH color, anti-AI-slop bans), an 80+ entry technique
  library (generative fields, cartography, software 3D, line-work flair),
  and a per-slide dossier spec. Refreshed lightly every run.
- **A variety engine.** `ledger/artwork.json` makes sameness a hard fail:
  hero structures can't repeat for 4 weeks, atmospheres for 3, continuity
  devices for 2 — plus deliberate variance dials per deck.
- **Real artwork from code.** Committed offline stack: 8 variable font
  families, seeded simplex noise, a hand-rolled software-3D renderer
  (perspective camera, painter's z-sort, Lambert light, fog), Zdog, d3 +
  true lon/lat Alaska GeoJSON (state, 29 boroughs, 40-place gazetteer).
  No GPU, no network, fully deterministic.
- **Adversarial review.** Objective gates (render errors, font fallbacks,
  overflow, contrast, caption lint) run before subjective ones (pixel
  critics who transcribe every rendered word, a flow critic who judges
  the deck as a filmstrip, a scorer with hard-fail powers).
- **Compounding memory.** Topics dedupe ledger, artwork variety ledger,
  and confidence-scored instincts injected into future runs.

## Operating it

- The routine trigger (schedule/model/connectors) lives at
  claude.ai/code/routines; its prompt is `prompts/ROUTINE_PROMPT.txt`,
  which defers entirely to `prompts/routine_instructions.md`.
- Weekly artifacts land in `runs/<date>/` on `main`; the Gmail draft links
  to them. Post the PDF as a LinkedIn document post; the individual PNGs
  are always in the email as a fallback.
- Add sources in `config/sources.yaml`; promote the routine's
  `new_sources_to_consider` suggestions weekly.
- Performance feedback: add a line to `ledger/topics.json`
  `outcome_notes` (or just tell the next run in its trigger text) and the
  instincts ledger will absorb it.

See `CLAUDE.md` for the authoritative delivery/merge policy and layout.
