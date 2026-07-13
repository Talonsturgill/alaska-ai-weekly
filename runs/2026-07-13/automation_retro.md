# Automation retro — 2026-07-13 (Carousel No. 6, "The Interior's Power Math", shipped 8.69)

Phase-by-phase diff of the run vs `prompts/routine_instructions.md`, fresh eyes, with evidence.
Verdict: clean run, shipped at 8.69 over a 8.3 bar; all phases done through scoring; machine_qa PASS 0/0.
One RECURRING engine deviation carried a hand-workaround into 4 shipped slides and is the reactive fix this run.

## Phase-by-phase deviations (with evidence)

### 1. FONT-LOADED QA PROBE false-FAILs on italic-only display faces (RECURRING; reactive fix this run)
- **Spec/gate:** render.py's in-page QA builds a `document.fonts.check()` spec per used family and, on a
  false result, records `fonts_missing`; qa.py turns any `fonts_missing` entry into a HARD FAIL
  ("font not loaded: <family> w<weight>").
- **Defect:** the spec is built as `cs.fontWeight + " 32px \"" + fam + "\""` (render.py:147) with **no
  font-style**. Per the CSS Font Loading matching rules (MDN FontFaceSet.check), a `normal`-style query
  matches only the `normal`-style `@font-face`. This run used **Instrument Serif ITALIC** as the SOFT/accent
  voice on S3 (`.note`, `font-style:italic`), S7 (`.foot`, italic), and elsewhere; the Instrument Serif family
  is declared as two separate faces in `assets/fonts/fonts.css` (Regular = normal, Italic = italic, lines
  60-70). The upright-400 probe tests the **normal** face's load status, which is NOT loaded when only the
  italic text is on the slide -> `fonts_missing: Instrument Serif w400` -> qa.py FAIL.
- **Evidence of the workaround (the hack the fix removes):** the showrunner injected hidden offscreen
  upright-Instrument-Serif loader spans purely to satisfy the probe:
  - S1 `.isload{ position:absolute; left:-9999px; ... font-family:"Instrument Serif" }` (slide-01.html:22)
  - S6, S7, S9 each carry `<span style="position:absolute; left:-9999px; top:0; font-family:'Instrument
    Serif'; font-weight:400; font-style:normal;" data-decorative aria-hidden="true">.</span>`
    (slide-06.html:60, slide-07.html:72, slide-09.html:54)
  These spans force `InstrumentSerif-Regular.ttf` to load so the upright probe passes; they carry no design
  intent. Their existence PROVES the probe tests the normal face, not the italic face actually rendered.
- **History:** flagged/parked 2026-07-10, touched 2026-07-11; recurred THIS run -> now fixed in the engine.
- **Classification:** gate REPAIR (probe the face actually used). It still FAILs a genuinely missing face;
  it stops false-FAILing a present italic face. No threshold weakened.

### 2. Fixed-width centered in-scene label DIVs tripped the safe-zone gate on box edges (NOT an engine bug)
- The safe-zone check (qa.py:274) tests each text node's box (`x, y, w, h`). A fixed-width centered label DIV
  whose glyphs sit inside the 80px margin can still have box edges outside it. Handled in-slide with
  content-width + nowrap so the box hugs the glyphs. This is correct gate behavior (the gate cannot know the
  glyphs are centered inside an over-wide box); no engine change. Noting only; leave alone.

### 3. Fact-checker fetched guessed/wrong URLs that 404'd (PROCESS, not engine)
- Several verifiable context claims were dropped because the fact-checker (tools: WebFetch, Read) fetched
  GUESSED source URLs that 404'd; the showrunner recovered them by re-fetching real URLs. This is an agent
  behavior/process issue, not an engine gate. Candidate remedy is a fact-checker prompt tweak ("never
  fabricate a URL; only fetch URLs present in scout findings/claims") but that is agent-prompt territory and
  not this run's bounded reactive fix. Left for a future prompt pass; noted here so it is not lost.

## Other phases
- wake / craft_refresh / research / claims / docket / selection / directors_room / copy / art_build /
  pixel_review / flow_review / assemble / scoring: all `done`, no deviations surfaced in the incident notes.
- Shipping in progress at retro time; merge + Gmail draft follow this phase per policy.

## Reactive fix chosen
Incident #1 (font-style probe) — the single bounded engine fix. Verified against this run's slides and
examples/demo-deck plus a throwaway italic-only reconstruction (must FAIL before, PASS after). See
ledger/upgrades.json entry 2026-07-13.

## Frontier scan
Focus: headless-Chromium/Playwright rendering capabilities (rotation: fresh; last 3 were editorial-dataviz
07-10, procedural-art 07-11, 3D 07-11, accessibility/PDF 07-12). Finding parked to FIELD_NOTES: Playwright
v1.49 removed old Chromium headless mode; screenshots render differently under new headless mode, with
`chromium-headless-shell` preserving old-mode fidelity. Relevant to engine determinism if Playwright is ever
upgraded. Parked, not applied (no upgrade pending in this container; would need a version bump to bite).
