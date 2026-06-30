# Title Design, FUI/HUD & Data Motion-Graphics Transitions

> Facet 6 of the Cinematic Scene Craft brain (see `../README.md`). This is the Dispatch's **native
> visual register**: hand-coded vertical motion graphics in an instrument / HUD / FUI / data-viz key.
> Everything below is translated for a 60s, 9:16 (1080×1920 @30fps), narrated film whose every pixel is
> drawn in Python (PIL/numpy/scipy) — no AI imagery, no footage, no stock. The job of this facet is to
> teach the routine how to **genuinely change scenes** (map → chart → UI → environment) inside a
> single coherent screen-graphics world, so a cut reads as *travel through one argument*, not a
> slideshow of dashboards.

## The big idea
A great title sequence is not a credit list — it is a **60-to-90-second short film that states the
whole story in microcosm** before the story proper begins, and the *form itself carries the content*
(Bass's prologue; Cooper's Se7en; Antibody's True Detective). The same logic is what makes a
fictional interface or a data animation feel alive: a screen is a **place with rules**, and you move
between screens the way you move between rooms — with a motivated path, carried objects, and a reveal,
not a hard cut to an unrelated still. The Dispatch already lives in this register, so its scene
*breaks* should be designed exactly like title-sequence beats and FUI screen-changes: **one element or
one camera move threads the cut**, the new screen *boots / assembles / scans into being* (it is not the
old screen zoomed), and every moving mark means something. The enemy is the dashboard slideshow; the
cure is to treat each transition as a guided journey through a single data world.

## Principles
- **The title is the overture; the transition is the argument.** Saul Bass: a title sequence
  *conditions the audience* so that "when the film actually began, viewers would already have an
  emotional resonance with it." Scorsese on Bass: the titles "function as a prologue … setting the tone,
  establishing the mood, and foreshadowing the action … not simply identification tags but pieces
  integral to the work as a whole." For the Dispatch, each *scene break* should likewise foreshadow and
  set up the next beat, not merely arrive at it.
- **Form follows content — literally.** Bass's rule: "reach for a simple visual phrase that tells you
  what the picture is about." Anatomy of a Murder *is* a dissected body of evidence; Se7en's titles are
  *physically hand-made by the killer*. Pick the ONE visual metaphor that is the story, then let the
  motion be that metaphor doing its thing.
- **Make the ordinary extraordinary, with a single idea — not high technology.** Art of the Title on
  Anatomy of a Murder: "no high technology was needed — only a playground in which a graphic designer
  could think of a simple idea." This is the Dispatch's permission slip: cut paper, sliding bars, a
  spiral — primitive, code-drawable moves beat expensive ones when the idea is right.
- **Right technique, right reason — never "to look cool."** Patrick Clair (True Detective / Westworld):
  double exposure "wasn't to look nice or look cool"; it was chosen because "we're trying to use the
  exploited, polluted landscape … as a metaphor for these broken, exploited people." Any HUD flourish
  that doesn't carry meaning is noise — cut it.
- **A fictional interface builds a *world*, and the world has a logic.** Territory Studio's Blade Runner
  2049 brief: "If electricity didn't exist, what would that mean for the visual language? … How would
  society use that technology?" Tech reflected social hierarchy — K's degraded spinner vs. Wallace
  Corp's pristine geometry. Your UI's *rules* (what's degraded, what's clean, what's holographic) ARE
  the story.
- **Sync motion to narration; motion explains, it does not decorate.** Vox house rule: animations
  "explain rather than decorate," with motion "closely synced to narration"; "we do the story first."
  The VO is the metronome — every reveal lands on a word.
- **Find one anchor motif and build everything on it.** Vox: "find something unique to hold on to as an
  anchor … flying text and words flying around that can serve as repeating motifs to build visuals on
  top of." Antibody: "working off the same reference material … is key." One recurring element (a
  Polaris star, a coastline stroke, a single data point) becomes the thread that ties every scene
  together and the object you *carry across cuts*.
- **Build, don't cut, when you can.** The best modern sequences *assemble* (Westworld's wireframe → render),
  *boot up* (FUI power-on reveals), or *travel* (a camera through a constructed data space). A reveal-by-
  construction is a stronger scene-start than a hard cut to a finished still.

## Technique catalog

### Kinetic typography as the actor (Bass, North by Northwest / Psycho)
- **Who/what:** Saul Bass for Hitchcock — North by Northwest (animated grid lines + directional arrows
  racing up a green plane that resolves into the side of a skyscraper) and Psycho (fragmented horizontal
  and vertical bars that slide text together and apart, jittering to Herrmann's strings).
- **What it does:** Type is not labeling the scene — it *is* the scene, performing the words. Lines and
  bars enter as graphic energy, then resolve into the world (the grid *becomes* the skyscraper façade).
- **Why it works:** It collapses the gap between credit and image; the audience reads "tension / urban /
  vertical" before any actor appears. The motion of the type sets pace and mood.
- **Dispatch translation:** Treat headline/label type as a moving instrument layer, not a static caption.
  Slide kicker words on from the frame edges on hard beats; let a column of telemetry type *become* a
  bar in a chart (the glyph stretches into the bar). To change scenes: have the lines that ruled one
  screen **slide off-axis and re-rule the next screen** — the same family of strokes draws the morgue UI,
  then re-draws the map grid, so the register is continuous while the content changes.

### Form-as-content title (Cooper, Se7en)
- **Who/what:** Kyle Cooper / Imaginary Forces, Se7en (1995) main titles — typography hand-etched into
  black scratchboard, smeared and jittered during the film transfer; the sequence "appears hand-made by
  Se7en's main character, serial killer John Doe," with the end crawl running *backwards up the screen*.
- **What it does:** The *texture and behavior of the type embody the antagonist* — obsessive, defaced,
  inverted. The titles are a self-contained character study, a short film before the film.
- **Why it works:** Because the medium is the message, the sequence is unforgettable and inseparable from
  the story. It proved a title could be art, not throat-clearing.
- **Dispatch translation:** Let the *rendering style itself* carry the story's tension. If the beat is
  "fragile / degrading" (e.g., a thawing permafrost dataset), draw the type and the UI chrome with
  deliberate jitter, scan-line smear, and registration error — `numpy` per-frame sub-pixel offsets,
  scratch overlays, additive noise. The degradation is the argument. A scene break can be a *defacement
  wipe*: the current screen scratches/burns away to expose the next, rather than dissolving cleanly.

### Literal-dissection assembly (Bass, Anatomy of a Murder)
- **Who/what:** Saul Bass, Anatomy of a Murder (1959) — a cut-paper silhouette of a body, dissected into
  fragments that slide, shift, and recombine on a flat field, the pieces "presented like part of a
  puzzle," calibrated to Duke Ellington's score.
- **What it does:** The film's title — a forensic anatomy — is performed literally: a whole figure breaks
  into evidence and reassembles. Pure 2D cut-out motion; "no high technology needed."
- **Why it works:** A single, legible visual metaphor introduces the subject and the mood in one gesture,
  and the recombination gives the sequence a beginning-middle-end arc.
- **Dispatch translation:** This is the **carried-element / morph engine** in its simplest form, and it is
  code-trivial: keep a registry of named vector "parts" (PIL polygons / numpy point sets) and tween their
  positions/anchors between scenes. To change scenes, **don't cut — disassemble and reassemble**: the
  bars of scene A's chart detach and slide into the outline of scene B's map; the same parts, recomposed,
  *are* the transition. This makes screen-to-screen read as one continuous argument.

### Spiral / generative figure as a state machine (Bass + Whitney, Vertigo)
- **Who/what:** Saul Bass with John Whitney, Vertigo (1958) — spiraling Lissajous-style figures (generated
  on Whitney's mechanical analog computer) emerging from a magnified eye, evoking psychological vertigo.
- **What it does:** A parametric mathematical figure *is* the emotional state; it rotates and morphs
  through related forms, holding interest with motion alone over near-static type.
- **Why it works:** Procedural geometry feels both precise and uncanny — exactly the "instrument" mood —
  and it can transform continuously, so one figure can carry a whole beat without a cut.
- **Dispatch translation:** Lissajous/parametric curves are a `numpy` one-liner (`x = A·sin(a·t+δ)`,
  `y = B·sin(b·t)`). Use a slowly-evolving generative figure as a **connective-tissue layer**: it lives
  behind every scene as the "instrument" signature, and at a scene break you *push its parameters* so the
  same curve unwinds from a spiral (scene A) into the streamlines of a wind-map (scene B). The transition
  is a continuous morph of one equation, not a swap of two pictures.

### Double-exposure compositing — figure as window (Antibody/Clair, True Detective S1)
- **Who/what:** Patrick Clair / Antibody, produced by Elastic, lead designer Raoul Marks — True Detective
  S1 (2014). Human figures used "as windows into partial landscapes"; portraits slowed to "10% or 20% of
  their original speed"; low-poly 3D geometry of truck stops/refineries with landscape footage projected
  over it; dirt, light flares, and "optical glitches" stitched in.
- **What it does:** A face becomes a *transparent aperture* through which a second image (the corrupted
  landscape) bleeds — two scenes occupying one frame at once. Cuts move between subjects while the
  double-exposure logic stays constant.
- **Why it works:** It says the thing the show is about ("marginalised or internally divided" characters)
  without a word, and the layered transparency means a "cut" can be a *cross-fade of contents inside a
  held silhouette* — far smoother than a hard cut.
- **Dispatch translation:** Multiply/screen-blend two render layers through an alpha mask (PIL
  `Image.composite` / numpy `dst = a*mask + b*(1-mask)`). Hold a **silhouette mask** (a salmon, a
  coastline, a turbine) constant across a scene break and **swap what shows *through* it**: scene A's
  chart lives inside the coastline; the chart fades and a satellite map fades up *inside the same
  coastline*; then the mask itself dissolves to reveal the full map. The held shape is the carry; the
  contents are the journey.

### Assemble-into-being: wireframe → render reveal (Clair, Westworld)
- **Who/what:** Patrick Clair / Elastic, Westworld main titles — robotic tools "string piano wire and
  sinew alike," a horse and rider built layer by layer; "wireframe and render" progressions; an
  exposed-ribcage horse galloping "Muybridgian in its movement."
- **What it does:** Nothing cuts *in* fully-formed; forms are **constructed on screen** — point cloud →
  edges → surface → material → motion — so the reveal itself is the drama.
- **Why it works:** Construction implies authorship and intent (perfect for a creation story, and for an
  AI/ML angle); a built reveal is inherently a "new world arriving," which is exactly what a scene break
  needs to feel like.
- **Dispatch translation:** Build a **state-chain renderer** for every hero object: `points → drawn edges
  → filled faces → shaded/labeled`. Drive the chain by a 0→1 progress value per scene-start so the next
  scene literally *assembles* from the wireframe up (`PIL.ImageDraw` line passes, then polygon fills, then
  a gradient/scanline shade). A scene break = the previous screen's geometry **collapses back to its
  point cloud and the points re-fly into the next screen's wireframe** — one continuous build, two
  different worlds.

### FUI world-logic: degradation as character (Territory Studio, Blade Runner 2049)
- **Who/what:** Territory Studio (David Sheldon-Hicks et al.) for Denis Villeneuve — Blade Runner 2049
  screen graphics built from *physical* references (optical lenses, cine projectors, microfiche, even
  scanned grapes/bone), with "warping, ghosting and colour degradation … glitches and surface textures"
  for K's spinner, vs. pure black-and-white geometric minimalism for Wallace Corp.
- **What it does:** Each interface's *condition* encodes its owner's place in the world; degraded vs.
  pristine reads as poor vs. powerful, old-tech vs. new-tech — world-building through UI alone.
- **Why it works:** When screens have consistent rules, moving between them *teaches* the viewer the world
  and gives every transition stakes (going from a clean corporate UI to a degraded street UI is a
  *descent*, not just a cut).
- **Dispatch translation:** Define two-or-three **interface "tiers"** as reusable code styles — e.g.
  `clean` (crisp lines, flat fills, high contrast) and `degraded` (chromatic-aberration split via
  channel-shift in numpy, ghost echoes, scanline + bloom, jitter). Assign tiers to story beats. A scene
  break that *crosses tiers* (clean corporate metric → degraded field sensor) is automatically a
  meaningful journey. Per-storybeat interface logic also means each scene is genuinely a different screen,
  not the same dashboard re-cropped.

### FUI boot-up / power-on as the scene-start (Territory; FUI canon — Hansen, Thorp, Kieffer)
- **Who/what:** The FUI tradition codified in *HUDS+GUIS* / "FUI: How to Design User Interfaces for Film
  and Games" (Ash Thorp, Jayse Hansen, Chris Kieffer; Interstellar, Minority Report, Star Wars). Territory
  designed Blade Runner morgue screens as "looping states triggered by the actors," lenses that "shunt
  into place with each level of magnification."
- **What it does:** Interfaces **power on, calibrate, and lock** — elements stream in, grids draw
  themselves, readouts spin up to a value and settle. The boot *is* a built-in transition-in.
- **Why it works:** A boot-up sequence reads unmistakably as "a NEW system coming online," so it's the
  cleanest way to signal a genuine scene change in a HUD register — the opposite of zooming the old
  screen.
- **Dispatch translation:** Give each new scene a 6–12 frame **boot-in**: corner brackets snap to the
  edges, a sweep line wipes once and "draws" the grid/axes behind it, numeric readouts count up from 0 to
  their value and settle with a tiny overshoot (ease-out), labels type on glyph-by-glyph. Crucially, boot
  into a **NEW interface, not the same one zoomed** — different layout, different tier, different data.
  This single move fixes the core "fake scene change" problem.

### 3D-gesture / volumetric data field (Territory + Ash Thorp, Ghost in the Shell)
- **Who/what:** Territory Studio with Ash Thorp, Ghost in the Shell — brief explicitly *banned straight
  lines* and conventional screens, pushing "immersive three-dimensional" data fields manipulated by
  gesture/voice/thought; references included jellyfish, sand, dust, and magnetic filaments.
- **What it does:** Data lives as a *volumetric field* in space, not on a flat panel; you move *through*
  it, and it responds to a presence.
- **Why it works:** A field you travel through is inherently a journey; depth and parallax make a 2D
  delivery feel spatial, and curved/organic motion reads as "alive."
- **Dispatch translation:** Fake volumetric depth in code with **parallax layers + particle fields**:
  scatter `numpy` point clouds at several simulated depths, move a virtual camera (translate/scale layers
  at different rates) to fly *into or through* the field. A scene break = **push the camera through the
  field** until it resolves on the next screen on the far side (data field → emerge facing the chart).
  Use streamline/curl-noise motion (scipy) for the "filament/dust" feel — no straight lines required.

### Grid-based holographic projection that carries story (GMUNK, Tron: Legacy boardroom)
- **Who/what:** GMUNK + Jake Sargeant, David Lewandowski, Josh Nimoy at Digital Domain — 12+ minutes of
  Tron: Legacy holographic content. The Encom boardroom used **grid-based** giant in-camera projections to
  "communicate core story points," including the OS12 launch and the "Marvin" hack *taking over the
  screen* and tainting the launch, wired to news feeds; the light-table interface launched/shut-down the
  sequence. Graphics were delivered as **asset libraries played back and manipulated live on set**.
- **What it does:** A single grid language hosts many "screens," and the *graphics themselves advance the
  plot* (a hack visibly hijacks the display) — the interface is a character with agency.
- **Why it works:** A consistent grid system means every screen is obviously the same world, so you can
  cut between many of them freely; and an interface that gets *interrupted/hijacked* is a built-in
  dramatic transition.
- **Dispatch translation:** Establish ONE grid module (line spacing, corner glyphs, type ramp) and render
  every scene as a different layout *on that grid* — instantly cohesive, instantly distinct. Stage a
  **takeover transition** for a turning point: the orderly grid glitches, a new data layer floods in from
  a corner and overwrites the screen (numpy block-reveal + glitch), delivering you into the next scene.
  The "asset library / live playback" mindset maps perfectly to code: render scenes as composable layers
  with parameters, not as baked frames.

### Map-and-data guided journey (Vox Atlas, Sam Ellis)
- **Who/what:** Sam Ellis, Vox Atlas — map-driven explainers built by "toggling between a map and what's
  happening on the ground," combining maps with data viz/footage/photos, syncing camera moves to mapped
  data, always built on "a story arc, with a beginning, middle, and end," story-first.
- **What it does:** The viewer is *flown* across geography and *down* from map to ground and back, with
  data layers added on top of a continuous spatial base — a guided tour, not a gallery of charts.
- **Why it works:** A shared spatial substrate (the map) makes every cut feel like a move within one
  place; toggling altitude (overview ↔ ground) gives rhythm and keeps it from being flat.
- **Dispatch translation:** Use an **Alaska map as the persistent substrate** and treat scenes as
  *altitudes and overlays* on it: wide state map → push/zoom to a region while a data layer (heat, points,
  route) draws on → "drop to ground" by morphing the map into a stylized scene/diagram → pull back to the
  map to resume. Because it's all one coordinate space in code, the camera can **travel between scenes**
  (animate offset/scale of the same projected geometry) so transitions are literal journeys.

### Carried-element transition (synthesis across Bass / Antibody / Vox)
- **Who/what:** The through-line of all the above — Bass's recombining parts, Antibody's held silhouette,
  Vox's "anchor" motif and "flying text … repeating motifs to build on top of."
- **What it does:** One specific element **survives the cut** and is recontextualized: a data point in
  scene A's chart *flies out and becomes the marker* on scene B's map; a coastline stroke that framed a
  photo *unbends into the x-axis* of the next chart.
- **Why it works:** A carried element makes two different screens read as *one continuous sentence* —
  the cut is a comma, not a period. This is the single highest-leverage anti-slideshow move.
- **Dispatch translation:** Maintain a small set of **named, persistent objects** in the engine (e.g.
  `hero_point`, `coastline_path`, `polaris`). At a scene break, do NOT clear the canvas — **animate the
  carried object from its scene-A pose to its scene-B role** (tween position, then re-skin it: a chart dot
  → a map pin), and let the rest of scene A fade and scene B build *around* the moving anchor. One object
  threads the whole 60 seconds.

## Anti-patterns
- **The slideshow (the core failure this brain exists to kill).** Hard-cutting between static, finished
  screens with nothing carried and nothing in motion across the cut. *Fix:* never cut to a finished
  still — either **carry an element** across (chart dot → map pin), **build the new screen** (boot-up /
  wireframe-assemble), or **travel** to it (camera through the data field / across the map). A cut with
  no thread is a period where you wanted a comma.
- **Zooming one dashboard and calling it a new scene.** The exact bug from the README: the camera crops a
  single rendered display and the gate mistakes a luma spike for a scene change. *Fix:* a scene change
  must reach a **genuinely different interface** — different layout, different tier (clean ↔ degraded),
  different data substrate (UI → map → chart → environment). If you can reach it by panning the same PNG,
  it is not a new scene. Boot a *new* interface; don't re-frame the old one.
- **Decorative HUD noise without meaning.** Spinning rings, fake hex readouts, random "scanning" bars that
  encode nothing — the thing Clair calls doing it "to look cool" and Vox calls decorating instead of
  explaining. *Fix:* every animated mark must map to a fact in the VO line on screen at that moment; if a
  reading isn't carrying information, delete it. Motion is a pointer, not garnish.
- **Style with no world-logic.** Mixing clean and degraded looks arbitrarily, so the UI's condition stops
  meaning anything (violating Territory's tier discipline). *Fix:* fix the rules first (what's degraded,
  what's holographic, what's pristine, and *why*), then every transition that crosses a rule becomes a
  meaningful move (a descent, an upgrade, a hijack).
- **Form that ignores content.** A generic "techy" look stamped on regardless of the story (the opposite
  of Se7en/Anatomy). *Fix:* pick the ONE visual phrase that *is* this week's story and let the motion be
  that metaphor performing — fragile data jitters and degrades; a network assembles from a wireframe; a
  forecast flies across the map.

**How to make screen-to-screen feel like travel (the operating rule):** at every scene break, satisfy at
least one of three "threads" — **CARRY** (an element survives and is recontextualized), **BUILD** (the new
screen assembles/boots into being rather than cutting in finished), or **TRAVEL** (a motivated camera move
moves *through* a shared space — map, grid, or data field — to arrive). One coherent interface world +
one carried anchor + a built or traveled arrival = a guided 60-second journey, not a deck of slides.

## Sources
- [Saul Bass — Art of the Title (designer profile)](https://www.artofthetitle.com/designer/saul-bass/)
- [Saul Bass — Wikipedia (per-film mechanics: Vertigo spiral/Whitney, Psycho bars, NxNW grid/arrows, Anatomy of a Murder, philosophy quotes)](https://en.wikipedia.org/wiki/Saul_Bass)
- [Anatomy of a Murder (1959) — Art of the Title](https://www.artofthetitle.com/title/anatomy-of-a-murder/)
- [Saul Bass — North by Northwest and Psycho: A Brief History of Title Sequences (what-when-how)](https://what-when-how.com/motion-graphic-titling-for-filmvideo-and-the-web/saul-bass-north-by-northwest-and-psycho-a-brief-history-of-title-sequences-motion-graphic-titling/)
- [Kyle Cooper — Wikipedia (Se7en scratchboard/jitter, Imaginary Forces → Prologue, body of work)](https://en.wikipedia.org/wiki/Kyle_Cooper)
- [Imaginary Forces — Se7en (project page)](https://imaginaryforces.com/project/se7en)
- [Kyle Cooper — Art of the Title (designer profile)](https://www.artofthetitle.com/designer/kyle-cooper/)
- [Kyle Cooper interview — Watch the Titles](https://www.watchthetitles.com/articles/00170-Kyle_Cooper_interview_pt_1_2)
- [True Detective (2014) — Art of the Title (Patrick Clair / Antibody / Elastic; double-exposure mechanics)](https://www.artofthetitle.com/title/true-detective/)
- [From True Detective to Westworld: the art of Antibody's title sequences — ACMI (Clair on metaphor, "right reason")](https://www.acmi.net.au/stories-and-ideas/from-true-detective-to-westworld-the-art-of-antibodys-title-sequences/)
- [Westworld — Art of the Title (Patrick Clair / Elastic; wireframe→render assembly mechanics)](https://www.artofthetitle.com/title/westworld/)
- [Blade Runner 2049 — Territory Studio (project case study; degradation/world-logic, per-storybeat UI)](https://territorystudio.com/project/blade-runner-2049/)
- [Blade Runner 2049 UI Design — HUDS+GUIS](https://www.hudsandguis.com/home/2018/blade-runner-2049)
- [Ghost in the Shell — Territory Studio (Ash Thorp; no-straight-lines, volumetric data fields)](https://territorystudio.com/project/ghost-in-the-shell/)
- [Ghost in the Shell FUI — HUDS+GUIS](https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui)
- [FUI: How to Design User Interfaces for Film and Games — HUDS+GUIS (Thorp, Hansen, Kieffer)](https://www.hudsandguis.com/fui-media)
- [TRON Board Room — GMUNK (grid-based holographic boardroom, light-table, OS12/Marvin hack)](https://gmunk.com/TRON-Board-Room)
- [TRON: Legacy — GMUNK (12+ min holographic content, asset libraries for live playback)](https://gmunk.com/TRON-Legacy)
- [TRON Legacy UI — HUDS+GUIS](https://www.hudsandguis.com/home/2011/04/19/tron-legacy-ui)
- [Interview: GMUNK (TRON: Legacy) — Inventing Interactive](http://inventinginteractive.com/2011/03/02/interview-gmunk/)
- [Vox Atlas: Producer Sam Ellis on his map animations — Storybench (map-as-substrate guided journey)](https://www.storybench.org/vox-atlas-producer-sam-ellis-on-his-map-animations/)
- [How Vox uses animation to make complicated topics digestible — Storybench ("explain not decorate," anchor motif)](https://www.storybench.org/how-vox-uses-animation-to-make-complicated-topics-digestible-for-everyone/)
- [How Vox Video uses Earth Studio for dynamic visual storytelling — Google Earth (Medium)](https://medium.com/google-earth/how-vox-video-uses-earth-studio-for-dynamic-visual-storytelling-703fc871766e)
- [Six Essential Motion Design Transitions — School of Motion (morph/carry transition craft)](https://www.schoolofmotion.com/blog/six-essential-motion-design-transitions-tutorial)
