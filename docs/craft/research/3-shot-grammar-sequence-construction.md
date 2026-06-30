# Shot Grammar & Sequence Construction

> Facet 3 of the Cinematic Scene Craft brain. The medium: 60s, vertical 9:16
> (1080×1920 @30fps), narrated ALASKA.AI "Dispatch" films, 100% hand-coded in
> Python (PIL/numpy/scipy). No AI imagery, no live-action, no stock — every
> "shot" is a rendered composition drawn in code. So every technique below is
> translated into **how to draw a genuinely different image**, not how to point a
> camera. Read `docs/craft/README.md` (the medium) and `docs/VIDEO_PRODUCTION_STANDARD.md`
> §3D (the shot-structure gate) before applying any of this.

## The big idea

A sequence reads as a sequence — not a screensaver — when each shot is a **new
image**: a different subject, at a different scale, from a different angle, in a
different layout. The grammar of shot SIZES exists precisely so that varying them
*means* something: a wide says "here is the whole world," a close-up says "feel
this," and the contrast between them is the storytelling. Our current failure is
the opposite of this grammar — we render ONE canvas and crop/zoom over it, so
every "shot" is the same picture at a different magnification. The fix is to think
like a director building **coverage**: storyboard a shot LIST where scale, angle,
subject, and composition each change, then draw each shot as its own composition
from a blank page, and CUT between them.

## Principles

- **Shot size is a language; contrast is the grammar.** StudioBinder: "If you
  don't use all of the different types of camera shots in film, how can you signal
  anything to your viewer without shot size contrast?" A wide and a close-up next
  to each other carry meaning *because* they differ. One magnification all the way
  through says nothing. ([StudioBinder, shot sizes](https://www.studiobinder.com/blog/types-of-camera-shots-sizes-in-film/))

- **Establish, then isolate — macro to micro.** The classic build presents "the
  broadest perspective" first, then "standard shot sizes get tighter and tighter
  on groups, individuals and faces." The viewer needs the geography before the
  detail. ([StudioBinder, establishing shot](https://www.studiobinder.com/blog/what-is-an-establishing-shot-definition-examples/))

- **Coverage is the engine of a legible sequence.** A scene is shot from "various
  angles and sizes" so an editor has options; varying focal length, depth of field
  and shot size across coverage creates "different psychological effect[s] on the
  viewer," and is how a cut signals a shift (Nolan changing shots in *Insomnia* as
  the protagonist changes tactics). ([StudioBinder, coverage/reaction/cutaway](https://www.studiobinder.com/blog/shot-reverse-shot-cutaways-coverage/))

- **A move can replace a cut — but only if it lands a genuinely different framing.**
  Spielberg's oner: "Within a single Oner, Spielberg can frame and re-frame, change
  angles, and shift between a wide, a medium, and a close-up — all without cutting,"
  shifting "from one static frame to another." The point is not the unbroken take;
  it's that he produces *distinct compositions*. PTA's *There Will Be Blood* office
  scene moves only a few feet yet builds **four distinct compositions** in one shot.
  A reframe that does NOT change the composition is the thing we must stop doing.
  ([Spielberg oner](https://icantunseethatmovie.com/2016/06/01/the-spielberg-oner/) ·
  [PTA office scene](https://cinephiliabeyond.org/will-blood-paul-thomas-andersons-epic-take-american-identity-day-lewis-performance-lifetime/))

- **Angle and height are emotion, not decoration.** Low = power/dread, high =
  vulnerability, eye-level = neutral connection, Dutch tilt = "disorientation, a
  de-stabilized mental state," overhead = "neutral or sometimes divine." Changing
  the angle changes the meaning even of the same subject. ([StudioBinder, angles](https://www.studiobinder.com/blog/types-of-camera-shot-angles-in-film/))

- **Lens character changes the space itself.** Wide "exaggerate[s] the appearance
  of distance between objects" and immerses; telephoto "compress[es] the image by
  causing the background to appear closer to the subject," flattens, isolates, and
  reads as surveillance or intimacy. Two shots of the same subject on different
  "lenses" are different images. ([StudioBinder, focal length](https://www.studiobinder.com/blog/focal-length-camera-lenses-explained/))

- **A composition SYSTEM is a choice with a feeling.** Kubrick's centered
  one-point perspective reads "stable but unsettling," "ominous"; Wes Anderson's
  planimetric centering makes space "look and feel constructed"; Deakins' negative
  space makes "the emptiness speak volumes"; Fincher withholds the close-up because
  "a closeup tells the audience that something is important." The framing argues a
  point of view. ([Kubrick](https://www.filmscalpel.com/kubrick-one-point-perspective/) ·
  [Wes Anderson](https://www.studiobinder.com/blog/wes-anderson-symmetry/) ·
  [Deakins](https://www.studiobinder.com/blog/roger-deakins-cinematography/) ·
  [Fincher](https://nofilmschool.com/david-fincher-filmmaking-style))

- **The rules of composition are made to be broken — knowingly.** Rule of thirds
  is "a starting point, not a law"; centering "can create tension" (Nightcrawler /
  Lou Bloom dead-center for intensity). Choose thirds OR center per shot for a
  reason — and vary it across the sequence so shots don't all sit the same way.
  ([StudioBinder, composition rules](https://www.studiobinder.com/blog/rules-of-shot-composition-in-film/))

## Technique catalog

### Shot-size ladder (ELS → LS → MS → MCU → CU → ECU)
**Who/what:** The universal shot-size taxonomy (StudioBinder's 7 sizes: Extreme
Long, Long/Wide, Medium Long, Medium, Medium Close-Up, Close-Up, Extreme
Close-Up). An extreme wide "make[s] your subject appear small against their
location… emphasize[s] how small a character is"; an ECU "focuses on a specific
area" (just the eyes, the trigger, the lips).
**What it does:** Assigns each shot a *scale*, so the sequence moves through scale
the way a paragraph moves through ideas.
**Why it works:** Scale contrast is the carrier of meaning — wide = context and
scale, close = emotion and significance; without the contrast there is no signal.
**Dispatch translation:** Build the shot list as an explicit scale ladder, and
make scale literal in pixels:
- **ELS / establishing** = the *whole system* drawn small in a large field —
  the entire Cook Inlet map, the full pipeline schematic, the complete model
  diagram — with deliberate emptiness around it (30–50% negative space, per the
  standard). Render it ONCE; never reuse it as the base canvas for the other
  shots.
- **MS** = one module of that system filling the mid-frame — a single buoy and
  its readout, one node of the diagram — redrawn at working scale, not a crop.
- **ECU insert** = a *full-frame render of ONE element with everything else gone*:
  a single gauge needle, one rivet, one glowing data cell, one spectrogram peak.
  Cut to it to punch a detail. The giveaway that you cropped instead of cutting is
  that neighboring elements are still visible at the edges — in a true ECU they are
  not in the file at all.
The rule: each rung is a *separately authored composition*, not the same PNG at a
different zoom. ([shot sizes](https://www.studiobinder.com/blog/types-of-camera-shots-sizes-in-film/))

### Angle & height (low / high / eye-level / Dutch / overhead)
**Who/what:** *The Matrix* low-angle for power/dread; *Avengers* high-angle for
inferiority; the overhead as "neutral or sometimes divine" POV; the Dutch tilt as
"emphasis for any tense or subjective moment."
**What it does:** Re-poses the *same subject* so the viewer's relationship to it
changes — looking up at it, down on it, or level with it.
**Why it works:** Vertical relationship encodes power and safety; a tilt encodes
instability. It's meaning you get for free by changing where the "camera" sits.
**Dispatch translation:** In code there is no camera, so you *simulate* angle by
how you draw the geometry:
- **Low angle** = draw the subject with converging verticals rising off the bottom
  edge, foreshortened toward the top, a horizon line low in the frame — the data
  tower looms.
- **High / overhead (top-down)** = switch to a plan/map projection: the river as a
  line on a chart, the sensor field as dots on a grid. This is one of the cleanest
  ways to make a *genuinely* different shot of the same subject (eye-level scene →
  top-down map is a real change of register and POV).
- **Dutch tilt** = rotate the entire composition ±3–8° (`img.rotate`), crop to
  fill; reserve it for the one beat of alarm/uncertainty (a failure spike, an
  anomaly). Use sparingly — it is punctuation.
- **Eye-level** = horizon at mid-frame, no convergence: the neutral default for the
  "here are the facts" beats. ([angles](https://www.studiobinder.com/blog/types-of-camera-shot-angles-in-film/))

### Lens character (wide vs. long/telephoto)
**Who/what:** *The Favourite*'s wide/fisheye expanding space; *Tinker Tailor
Soldier Spy*'s extreme-telephoto compression for suspense and surveillance; the
"compress two characters to feel closer / more intimate" use of a long lens.
**What it does:** Changes how depth itself is drawn — wide exaggerates near/far
separation; long flattens it.
**Why it works:** Our brains read perspective as space and emotion: wide feels
present, immersive, sometimes unstable; long feels watched, isolated, compressed.
**Dispatch translation:** Encode "lens" as a perspective + parallax + DOF recipe,
not a focal number:
- **Wide shot** = strong perspective (aggressive vanishing-point convergence),
  large parallax multipliers between planes (bg 0.3 / mid 0.4 / fg 0.5 from the
  standard, fg up to 1.1–1.3×), foreground elements pushed large at the edges.
  Reads immersive/grand.
- **Long / telephoto shot** = near-orthographic (parallel lines stay parallel,
  little convergence), planes stacked with minimal parallax (compressed), and a
  shallow-DOF look — Gaussian-blur the bg/fg, keep ONE plane razor sharp (deep-
  space-composition focus, *Citizen Kane* style). Reads as surveillance/intimacy
  and visually isolates the hero. Alternating a "wide" beat with a "long" beat on
  the same subject gives you two distinct images for free.
([focal length](https://www.studiobinder.com/blog/focal-length-camera-lenses-explained/))

### The classic build: establishing → master → medium → insert → reaction
**Who/what:** Standard coverage grammar. Establishing = "the widest, most
comprehensive view"; the master "cover[s] your entire scene"; the insert is "a
close-up that isolates a specific object, detail, or action"; the reaction "cuts
to a separate shot… to see the reaction." De Palma's *Scarface* chainsaw scene
cuts to Tony's horrified *face* instead of the violence.
**What it does:** Gives a scene a legible arc — orient, develop, detail, respond —
each beat on a different framing.
**Why it works:** Macro-before-micro lets the viewer build a mental map, then the
inserts and reactions deliver the payload inside that map; the changes of framing
are what make the edit *read* as progress.
**Dispatch translation:** This is the Dispatch's shot list, ~4+ shots over 60s:
1. **Establishing** — wide schematic of the whole story-system (≈8–12s; lands the
   premise visually by ~f30–45 per the standard).
2. **Medium** — move into the one subsystem the argument is about.
3. **Insert / ECU** — a full-frame detail that IS the AI mechanism (the detector
   pulling one voice from the roar; the one cell that flips).
4. **"Reaction"** — our reaction shot is the *consequence*: cut from the mechanism
   to the human/Alaska outcome (a meter on a Bethel home, a ratepayer figure, the
   beluga). The reaction shot is how you make the data *mean* something.
Keep brand throughlines (wordmark, type, grade, caption engine) constant so the
cuts feel like ONE film. ([establishing](https://www.studiobinder.com/blog/what-is-an-establishing-shot-definition-examples/) ·
[coverage/reaction](https://www.studiobinder.com/blog/shot-reverse-shot-cutaways-coverage/))

### The master shot — and why it is NOT the base canvas
**Who/what:** The master = "the continuous filming of a scene, in its entirety,
that captures all of the necessary information," a safety net that "can eliminate
possible gaps in your edit."
**What it does:** Guarantees one wide that contains the whole geography.
**Why it works:** It anchors continuity — but in a finished film you spend most of
the screen time in the *tighter* shots cut from coverage, not parked on the master.
**Dispatch translation:** This is the exact trap to avoid. Render a master (the
wide establishing schematic) — then **leave it.** Do NOT make every subsequent
shot a crop/zoom of the master; that is precisely the "fake scene change" the
README calls out. Author the medium, the insert and the reaction as *new files*
that share only the brand throughlines. The master appears once (and maybe a brief
return at the end for resolution), not as the substrate of the whole piece.
([master shot](https://www.studiobinder.com/blog/directing-technique-complex-master-shot/))

### Spielberg's oner / moving master (distinct framings inside one move)
**Who/what:** Tony Zhou & Taylor Ramos, *Every Frame a Painting* — "The Spielberg
Oner." "Within a single Oner, Spielberg can frame and re-frame, change angles, and
shift between a wide, a medium, and a close-up — all without cutting," moving
"from one static frame to another." He manages the basic angles (master, single,
reverse, insert) inside one unbroken take; the oners "don't keep moving forward,"
they *settle* into successive compositions (Duel, Tintin, Jaws, Raiders).
**What it does:** Delivers a whole sequence's worth of distinct images in one
continuous move — the move is *motivated by* arriving at the next composition.
**Why it works:** Each settle is a genuinely different frame, so the eye re-reads
the whole image even though there was no cut; the connective move adds momentum and
meaning a hard cut can't.
**Dispatch translation:** Our `dc.reframe(img, cx, cy, scale)` move is legitimate
ONLY when, like Spielberg, it *lands a different composition* — e.g. a continuous
push that starts on the whole-map wide and ENDS on a region drawn with its own
detail layer that wasn't legible before (the destination has more/other
information, not just bigger pixels). Storyboard the start AND end framings as two
distinct images, ease between them (easeInOutCubic), and hold the destination still
(pre-roll/settle holds from the standard). If start and end are the same picture at
two zooms, it's a crop, not a oner — cut to a new render instead.
([Spielberg oner](https://icantunseethatmovie.com/2016/06/01/the-spielberg-oner/))

### Depth staging — foreground / midground / background layering
**Who/what:** Spielberg's and PTA's depth staging; *Citizen Kane*'s deep-space
composition where "characters at different depths foreshadow narrative outcomes
while maintaining focus."
**What it does:** Puts meaningful information on multiple planes so one frame holds
relationships (near vs. far = power, priority, foreshadowing).
**Why it works:** Depth makes a single composition rich and three-dimensional, and
moving the planes (parallax) makes the world feel real rather than flat.
**Dispatch translation:** Always build a shot in ≥3 planes and animate them with
the standard's parallax (bg 0.3 / mid 0.4 / fg 0.5, 0.1 spacing reads as distinct
planes). Put STORY on different planes: the data field in back, the hero
instrument mid, a foreground element (a UI bracket, a silt particle field, a label
rail) in front. Pull focus between planes (`dc.focus_pull`) to hand attention from
near to far *in place* — a real shift of subject without a cut. Deep-space framing
also gives a single render genuine variety vs. a flat poster. ([composition rules](https://www.studiobinder.com/blog/rules-of-shot-composition-in-film/))

### PTA's "four compositions in a few feet" (the moving master, minimal version)
**Who/what:** Paul Thomas Anderson, *There Will Be Blood*, the office scene — a
~2.5-minute shot that "moves only several feet" yet creates **four distinct
compositions**: a profile CU of Eli entering, an obstructed wide of Plainview at
his desk, a medium three-shot, and a final CU of Eli. PTA "pairs camera movement
with character movement and positioning."
**What it does:** Proves you don't need big moves or many cuts to get genuinely
different shots — you need different *arrangements*, achieved by what enters frame
and how blocking re-stacks the planes.
**Why it works:** Each re-stack is a new image with a new power balance; the
restraint reads as control (which the standard prizes: "restraint reads as
expensive").
**Dispatch translation:** Within a held "shot," change the COMPOSITION by changing
what occupies the frame and where: an element slides in from the foreground and
re-stacks the planes; a label rail rises and re-balances the layout; the hero
shifts from center to a thirds intersection as a second element claims center.
Small, motivated re-stagings (not zooms) give you PTA's effect cheaply — multiple
images out of one setup. ([PTA / TWBB](https://cinephiliabeyond.org/will-blood-paul-thomas-andersons-epic-take-american-identity-day-lewis-performance-lifetime/))

### Kubrick one-point perspective & dead-center symmetry
**Who/what:** Stanley Kubrick — vanishing point "positioned in the exact center of
the image," producing frames that are "ruthlessly rigid, inescapable and
claustrophobic, stable but unsettling," with "an ominous quality" (the Overlook
corridors, the *2001* / *A Clockwork Orange* / *Full Metal Jacket* lineage;
Kogonada's "Kubrick // One-Point Perspective" supercut).
**What it does:** Organizes the entire frame around a single central axis — total
order.
**Why it works:** "Symmetry signals control, and too much control implies
something sinister beneath the surface"; it places the subject "at the center of
the universe," reading as power, isolation, or madness by context.
**Dispatch translation:** A *one-point-perspective corridor* shot is a strong,
distinct register for one beat: draw a tunnel/conduit/data-corridor with all edges
converging to a dead-center vanishing point, the hero element on the central axis,
perfect bilateral symmetry. Use it for the "the system, perfectly in control"
beat, or invert it for menace (an over-ordered surveillance grid). It is visually
unmistakable from a thirds-based or map-based shot — exactly the kind of contrast
the sequence needs. ([Kubrick / Filmscalpel](https://www.filmscalpel.com/kubrick-one-point-perspective/) ·
[Pixflow on Kubrick symmetry](https://pixflow.net/blog/kubrick-symmetry-one-point-perspective/))

### Wes Anderson planimetric / centered framing
**Who/what:** Wes Anderson — planimetric staging (camera "placed 90 degrees
perpendicular… to the subject" so "foreground, midground, and background… appear
as flat planes"), with the subject centered (Grand Budapest Hotel, Moonrise
Kingdom's mirrored walks, Royal Tenenbaums); Kogonada's "Centered" video essay
drew the white center-line down his frames.
**What it does:** Flattens depth into stacked planes and locks the subject dead
center; "makes the filmic space look and feel constructed," with hidden detail in
the corners for the wandering eye.
**Why it works:** The flat, centered frame is legible at a glance and reads as
designed/curated — and the planimetric "flat planes" map *perfectly* onto how we
already composite (literal layers).
**Dispatch translation:** A **planimetric shot** is nearly free in our medium and
makes a distinct register: orthographic (no perspective), elements as flat
stacked layers, hero centered, symmetrical margins — an editorial schematic /
"data-brutalist" look. Alternate it with a perspective "wide" and a top-down "map"
and you've got three obviously different shots. Use centered framing on the thesis
beat (Nightcrawler-style center = intensity), thirds on the connective beats.
([Wes Anderson / StudioBinder](https://www.studiobinder.com/blog/wes-anderson-symmetry/) ·
[Open Culture on Anderson symmetry](https://www.openculture.com/2014/03/the-perfect-symmetry-of-wes-andersons-movies.html))

### Fincher precision, negative space & the withheld close-up
**Who/what:** David Fincher — "omniscient camera that doesn't have any personality
to it," won't move "unless he has a compelling, character-based reason," blocks to
show power ("a 50-50 shot… then uses blocking to indicate who is taking control" —
*Gone Girl*), and deliberately withholds close-ups because "a closeup tells the
audience that something is important."
**What it does:** Treats framing as exact information control — every element
placed, the close-up *rationed* so it lands.
**Why it works:** Locked precision reads as authority and inevitability ("what's
happening was doomed to happen"); rationing the CU keeps it powerful when it
finally comes.
**Dispatch translation:** Make the Dispatch *Fincher-precise*: lock most shots
(the "omniscient" stillness the standard already wants), keep one slow motivated
move per piece, and **save the ECU for the one moment that matters** — don't open
on a close-up and don't spam them, or the punch is gone. Use a 50-50 split layout
to set up two forces (Alaska ↔ the AI system), then shift the balance via blocking
(one side grows/centers) to show who's "in control" of the argument. Negative
space + locked frame = the "expensive restraint" register. ([Fincher / No Film School](https://nofilmschool.com/david-fincher-filmmaking-style) ·
[Fincher directing style / StudioBinder](https://www.studiobinder.com/blog/david-fincher-movies-directing-styles/))

### Coen-brothers inserts (objects as their own shots)
**Who/what:** The Coen Brothers' rapid object inserts — "any shot whose sole
purpose is to focus the viewer's attention to a specific detail within a scene,"
working through composition (details on thirds intersections), color, and timing.
**What it does:** Promotes an object — a coin, a hand, a number — to its own
full-frame shot, cutting the texture of a scene with hard, graphic details.
**Why it works:** An insert is a hard pattern-interrupt and a meaning-injector: a
brief flash says "this matters," and the rhythm of cutting to inserts and back
energizes the edit.
**Dispatch translation:** Treat key data points as Coen inserts — a single number,
one icon, one waveform — rendered FULL-FRAME and graphic, on a thirds intersection
or dead center, cut to hard on a downbeat for ~0.5–1.5s, then back to the wider
register. These are cheap to draw (one element, lots of negative space) and they
are unmistakably different images from the establishing/medium shots — instant
scale and subject contrast. ([Coen inserts / StudioBinder](https://www.studiobinder.com/blog/insert-shot-film-example/) ·
[insert shot guide](https://www.studiobinder.com/camera-shots/framing/insert-shot/))

### Deakins / Villeneuve negative space & silhouette
**Who/what:** Roger Deakins with Denis Villeneuve — *Prisoners* (vast negative
space around Jackman "amplifying his despair and isolation"), *1917* (a lone
soldier "against a pale, empty sky… the emptiness speaks volumes"), *Sicario* /
*No Country* (centered subjects in "vast, empty environments"), and *Blade Runner
2049*'s Gosling held in silhouette "accomplished as much through architecture as
lighting." Deakins keeps it "simple… focus on character and emotion and let the
lighting and framing follow."
**What it does:** Lets emptiness and a single shape carry the frame — scale,
loneliness, dread — with almost nothing in it.
**Why it works:** Negative space gives the eye one thing and a lot of room, which
reads as scale and emotion; silhouette abstracts a subject to its most legible
form (it must "read in pure silhouette" — the standard's own beluga test).
**Dispatch translation:** Build at least one **negative-space shot**: a tiny hero
(one buoy, one figure, the wordmark) low or off-center in a huge empty field of
graded sky/water/grid — 60–80% intentional emptiness. It's the maximal scale
contrast against your busy HUD shots and it lands emotion (the lone sensor in the
vast Inlet). Use **silhouette** for a clean, abstract beat — the subject as a flat
black/gold shape against a lit field — which also doubles as a strong graphic-match
hand-off into the next shot. ([Deakins / StudioBinder](https://www.studiobinder.com/blog/roger-deakins-cinematography/) ·
[Deakins on Blade Runner 2049 / British Cinematographer](https://britishcinematographer.co.uk/roger-deakins-cbe-bsc-asc-blade-runner-2049/))

### Rule of thirds vs. centered (vary the placement across the cut)
**Who/what:** Rule of thirds = subject on the grid intersections, "more pleasing
to the eye," opens negative space (Nightcrawler's off-center Lou for alienation);
centered = "the most common alternative," "can create tension" (Nightcrawler's
dead-center Lou for intensity). The rule "is a starting point, not a law."
**What it does:** Sets where the subject *sits* in the frame — and therefore the
frame's balance and tension.
**Why it works:** Off-center feels natural and dynamic; dead-center feels formal,
tense, confrontational. Switching between them across shots keeps the sequence from
sitting the same way every time.
**Dispatch translation:** Don't park every hero in the center. Deliberately move
the placement shot-to-shot: thirds on the establishing and connective beats
(room for the system to breathe), dead-center on the thesis/punch beat (confront
the viewer). Use leading lines (a converging conduit, a river, a diagonal data
trail) to point the eye to the subject — `leading lines` are trivial to draw and
make a composition feel authored. ([composition rules](https://www.studiobinder.com/blog/rules-of-shot-composition-in-film/) ·
[rule of thirds](https://www.studiobinder.com/camera-shots/composition/rule-of-thirds-in-film/))

## Anti-patterns

- **Every shot is a crop of the same master image.** *This is our core failure.*
  Symptom: the "scene change" is a zoom/pan and neighboring elements from the same
  canvas are still visible at the new frame's edges. Fix: author each shot as a
  separate render that shares only the brand throughlines; the master/establishing
  wide appears once and is then *left behind*, not reused as the substrate. Test:
  freeze a frame from each shot and ask "could this be a still from a different
  setup?" If they're all clearly the same picture zoomed, it failed (the
  SCENE_STRUCTURE gate is supposed to catch this — design past it, don't game it).

- **No scale contrast.** Three mediums in a row read as one shot. Fix: force the
  size ladder — at least one true ELS/wide, at least one ECU/insert, somewhere in
  the 4+ shots. Wide→ECU is the single biggest "new image" you can get.

- **Camera angle never changes.** Eye-level the whole way is flat. Fix: include at
  least one top-down/map shot and consider one low-angle "looms" shot; reserve a
  Dutch tilt for a single beat of alarm. A top-down map of the same subject is the
  cheapest genuinely-different shot we have.

- **The close-up is spent, not saved.** Opening on an ECU or cutting to many burns
  Fincher's "this is important" signal. Fix: ration ECUs; let the establishing wide
  set up the world so the detail lands when it comes.

- **The reframe is a crop, not a oner.** A push that ends on the same picture
  bigger is zoom-for-its-own-sake. Fix: only reframe when the destination is a
  *different composition with different/more information* (Spielberg's settle into a
  new framing); otherwise cut to a new render.

- **Centering everything (or thirds-ing everything).** Same balance every shot
  reads as a template. Fix: deliberately alternate centered vs. thirds vs.
  negative-space placement across the cut.

- **Ignoring the tall 9:16 frame.** A horizontal-film instinct wastes our format.
  The 1080×1920 frame is built for **verticality and stacking** — use it:
  - **Stack** layers top-to-bottom as distinct registers — e.g. aurora/sky band
    up top (kept vivid per the standard), the hero instrument in the mid-band, a
    data rail / caption zone in the lower third — and reveal them top-down so the
    tall frame *fills progressively*.
  - **Vertical motion as a shot type:** a descent (surface → depth in the Inlet),
    a rising stack (numbers climbing the column), a top-to-bottom signal flow — the
    dominant MOTION VECTOR becomes "vertical," a distinct axis from a horizontal
    traverse or a radial scan (the composition_axes list).
  - **A tall ELS** (whole vertical system) vs. a **tall ECU** (one element filling
    the column) are dramatically different uses of the same frame — exploit the
    height for scale contrast, not just width.
  - Keep load-bearing content in the central 1080×1080 and inside the safe area
    (40px hard floor, ~80–110px premium margin) so a 4:5 / 1:1 crop still works.

## Sources

- StudioBinder — [Types of Camera Shots & Shot Sizes (ELS→ECU, scale contrast)](https://www.studiobinder.com/blog/types-of-camera-shots-sizes-in-film/)
- StudioBinder — [Types of Camera Angles (low/high/eye-level/Dutch/overhead, with meanings)](https://www.studiobinder.com/blog/types-of-camera-shot-angles-in-film/)
- StudioBinder — [Focal Length / Lens Character (wide vs. telephoto, compression, distortion)](https://www.studiobinder.com/blog/focal-length-camera-lenses-explained/)
- StudioBinder — [What Is an Establishing Shot? (macro→micro build)](https://www.studiobinder.com/blog/what-is-an-establishing-shot-definition-examples/)
- StudioBinder — [The Master Shot (5 steps; coverage safety net)](https://www.studiobinder.com/blog/directing-technique-complex-master-shot/)
- StudioBinder — [Shot Reverse Shot, Reaction Shots, Cutaways & Coverage](https://www.studiobinder.com/blog/shot-reverse-shot-cutaways-coverage/)
- StudioBinder — [The Insert Shot (Coen-brothers details)](https://www.studiobinder.com/blog/insert-shot-film-example/) · [Insert Shot — Ultimate Guide](https://www.studiobinder.com/camera-shots/framing/insert-shot/)
- StudioBinder — [Rules of Shot Composition (thirds, balance, leading lines, deep space, negative space)](https://www.studiobinder.com/blog/rules-of-shot-composition-in-film/) · [Rule of Thirds — Ultimate Guide](https://www.studiobinder.com/camera-shots/composition/rule-of-thirds-in-film/)
- StudioBinder — [Wes Anderson Symmetry & Planimetric Composition](https://www.studiobinder.com/blog/wes-anderson-symmetry/)
- StudioBinder — [Roger Deakins Cinematography (negative space, silhouette, centered wides)](https://www.studiobinder.com/blog/roger-deakins-cinematography/)
- StudioBinder — [The Directing Style of David Fincher (precision, blocking, withheld CU)](https://www.studiobinder.com/blog/david-fincher-movies-directing-styles/)
- No Film School — [The Iconically Precise Filmmaking of David Fincher](https://nofilmschool.com/david-fincher-filmmaking-style)
- *Every Frame a Painting* (Tony Zhou & Taylor Ramos) — The Spielberg Oner, summarized at [I Can't Unsee That Movie](https://icantunseethatmovie.com/2016/06/01/the-spielberg-oner/) (distinct framings inside one take)
- Cinephilia & Beyond — [There Will Be Blood: PTA's epic take (the office scene's four compositions in a few feet)](https://cinephiliabeyond.org/will-blood-paul-thomas-andersons-epic-take-american-identity-day-lewis-performance-lifetime/)
- Filmscalpel — [Kubrick One-Point Perspective (symmetry, "stable but unsettling")](https://www.filmscalpel.com/kubrick-one-point-perspective/) · Pixflow — [Kubrick Symmetry & One-Point Perspective](https://pixflow.net/blog/kubrick-symmetry-one-point-perspective/)
- Open Culture — [The Perfect Symmetry of Wes Anderson's Movies (Kogonada "Centered")](https://www.openculture.com/2014/03/the-perfect-symmetry-of-wes-andersons-movies.html)
- British Cinematographer — [Roger Deakins on Blade Runner 2049 (silhouette via architecture; keep it simple)](https://britishcinematographer.co.uk/roger-deakins-cbe-bsc-asc-blade-runner-2049/)
