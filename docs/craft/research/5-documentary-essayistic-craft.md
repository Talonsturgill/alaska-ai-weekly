# Documentary & Essayistic Craft

> Facet 5 of the Cinematic Scene Craft brain. The Dispatch is not "a video with facts in it" —
> it IS a non-fiction form. This dossier studies the masters of the documentary/essay film and the
> modern editorial-explainer desks, and translates every move into our medium: a 60s, vertical 9:16
> (1080×1920 @30fps), narrated, 100% **hand-coded** (PIL/numpy/scipy) film. No AI imagery, no
> live-action, no stock. Every "scene" is a rendered composition (map, chart, diagram, UI/HUD,
> stylized vignette). The job here is to build a real **journey** between those registers, where the
> *cutting itself argues*.

## The big idea

Non-fiction storytelling is not "show the evidence." It is **sequence the evidence so the order
becomes the argument**. The great documentarians and editorial desks almost never sit on one canvas:
they move the viewer through different *kinds* of image — a held photograph, a stylized reenactment, an
archival fragment, a map, a 3D reconstruction, a chart — and the **collision and succession** of those
registers is where meaning is manufactured. Music and voice are not decoration; they are load-bearing
structure that tells the viewer how to *feel* about each image and when one idea ends and the next
begins. For us, this means the Dispatch must be built as a deliberate route between **distinct rendered
registers (map → chart → scene → UI)**, with each cut motivated by the argument, not by a desire for a
luma spike.

## Principles

- **The order is the argument.** Adam Curtis: *"high end bolted to low end, that's all I've ever done.
  That's my trick and that's all I'm ever interested in."* What you place *next to* what — and what you
  put *after* what — is the thesis. A chart followed by a human vignette says something a chart alone
  cannot. (Curtis, *The Wire* interview.)
- **A still is a master shot, not wallpaper.** Ken Burns: every photograph contains *"the potential for
  long shots, medium shots, close-ups, tilts, pans, reveals, and detail inserts."* You don't drift over
  an image — you *direct* inside it. (Burns, CineD.)
- **Movement must have a destination and a reason.** Burns' own test for lazy rostrum work:
  *"Where are you going? What are you looking at?"* Automated zooms drift *"toward your elbow, not your
  face."* Motivated movement lands on the meaningful detail. (Burns, CineD.)
- **Duration is meaning.** Burns: *"Meaning requires something else"* beyond instant recognition; a held
  33-second push into a single portrait built intimacy a quick cut never could. The *meaningfully held
  image* is a tool, not dead air. (Burns, CineD.)
- **The image can be expressive, not literal.** Errol Morris reenacts to *visualize competing
  testimonies* — including versions that contradict each other — so the reenactment dramatizes the
  *instability of the truth*, not "what happened." (Morris, *The Thin Blue Line*.)
- **Score is structure, not mood-paint.** Morris hired Philip Glass because he *"does existential dread
  better than anybody"*; the music runs *under* the testimony to make a documentary feel like a film.
  Vox's Joss Fong cuts music every ~20s to mark idea-boundaries. Music tells the viewer when a unit of
  argument begins and ends.
- **Show, then withhold, then reveal.** Fong refused to open on the black-hole photo: *"I didn't want
  the photo to be the first thing people see. I wanted people to understand why this is so difficult
  before they saw the result."* Sequence builds the stakes that make the payoff land.
- **Build from existing reality; let imperfection carry truth.** Asif Kapadia builds entire features
  from archive with **no talking heads** — *"I will interview people but I don't want to show them"* —
  and prizes degraded footage because *"humans are imperfect… the footage matches the characters."*
  Authenticity over polish.
- **Evidence must be verifiable, and the visual is the proof.** NYT Visual Investigations: *"the thing
  that connects all of these is the use of visual evidence… we can analyze it to extract information
  that might not be immediately obvious."* The animation IS the argument about what occurred.
- **Manipulation is the craft, honestly aimed.** Curtis: *"of course I'm playing with you. But that's
  what a good filmmaker does."* The ethical line for us is that the *underlying facts are true and
  cited*; the editing is allowed to be persuasive.

## Technique catalog

### The directed still (rostrum with intent)

**Who/what:** Ken Burns, *The Civil War* (1990) and onward; technique pre-dates him (the NFB's *City of
Gold*, 1957; NBC's *Meet Mr. Lincoln*, 1959), but he made it a narrative grammar.
**What it does:** Treats one static image as a *scene*: starts on a detail, pushes/pans to a second
detail, reveals a third, holds on the one that matters. Simulated parallax can make a flat image feel
dimensional, *"with the viewpoint seeming to enter the picture."*
**Why it works:** A single move with a start, a path, and a destination reads as *authored attention* —
the filmmaker is pointing, and the viewer follows the pointing. Duration on the right detail converts a
picture into an emotion.
**Dispatch translation:** Inside ONE rendered register, choreograph a *guided read*, not a generic zoom:
render a high-resolution illustrated/diagrammatic plate, then move the virtual camera between
*specific load-bearing details* (e.g., on a hand-drawn map of the Aleutians: open on the chokepoint
strait, push to a single sensor icon, pan to the cable landing, hold on the one buoy the story is
about). Use multiplane parallax (bg 0.3 / mid 0.4 / fg 0.5 — see WORLD_CLASS §5) so the push has real
depth. Crucially: this is the technique used *within* a scene; it is **not** a substitute for changing
scenes. Each move must end on a meaningful detail (Burns' "what are you looking at?") and earn a held
beat before the cut.

### Expressive (non-literal) reenactment

**Who/what:** Errol Morris, *The Thin Blue Line* (1988); *The Fog of War* (2003).
**What it does:** Dramatizes testimony as a *stylized*, repeatable image — slow-motion, isolated detail
inserts (a thrown milkshake, a spinning light), and *multiple contradictory versions* of the same event
cut together — rather than a single "this is what happened" recreation.
**Why it works:** By rendering several incompatible accounts, the form makes the *uncertainty itself*
visible and dramatic. The image is honest about being a model, not footage.
**Dispatch translation:** When the story has a contested or modeled event (an AI prediction, a disputed
cause, a forecast vs. outcome), render it as an openly stylized vignette — clean vector forms, a
schematic stage — and, where the story warrants, show *two versions of the same beat* (the model's
predicted path vs. the observed path) as separate rendered shots, hard-cut together. The collision of
the two renders the gap between prediction and reality — which is often the AI thesis. Never imply the
render is real footage; lean into its diagrammatic honesty (this also keeps us inside the "no AI
imagery / no stock" rule by design).

### Direct-address eye contact (the Interrotron logic)

**Who/what:** Errol Morris' "Interrotron" — a teleprompter rig that feeds Morris' face onto the lens so
the subject looks Morris in the eye *and* down the barrel of the camera simultaneously.
**What it does:** Makes the subject address the *viewer*, not an off-screen interviewer — collapsing the
distance between speaker and audience.
**Why it works:** Eye contact is the most direct channel we have; it converts "a person talking" into
"a person talking *to you*."
**Dispatch translation:** We have no faces, but we have the same lever: **second-person address from the
interface.** Let an on-screen HUD/terminal "speak" to the viewer — a cursor that types a line of
narration verbatim as the VO says it, a readout that resolves *toward the center 4:5 safe box and holds
your gaze*. Vox's Fong uses the verbal version (*"Look at this," "This is…"*); pair that VO with a
centered, camera-facing UI element so the instrument is addressing *you*. It is the Interrotron's
"talking straight at the audience," rebuilt in motion graphics.

### Juxtaposition as argument (the collision cut)

**Who/what:** Adam Curtis, *The Century of the Self* (2002), *HyperNormalisation* (2016),
*Can't Get You Out of My Head* (2021).
**What it does:** Hard-cuts two unlike images so the *contrast* states a thesis the narration never has
to: *"smiling apparatchiks extolling central planning, intercut with interminable lines at empty
grocery stores; fleets of plutocrats' limos with starving people bundled against the cold."* Often
ironic — peppy dance-hall music laid over footage of atrocity.
**Why it works:** It runs on the Kuleshov effect: the viewer manufactures the connection between two
shots, so the argument feels *self-discovered* rather than asserted. Curtis: *"I sit on top of the
biggest archive in the world… and I just write with images."*
**Dispatch translation:** This is the single most important move for fixing our "one-canvas" problem.
Build the argument as a **deliberate collision of registers**: render Scene A = an austere, exact data
chart (the cold number — e.g., a permafrost-thaw curve or a compute-cost ramp); **hard-cut** to Scene B
= a stylized human/landscape vignette that the number is *about* (a drawn village on thawing ground, a
lone server humming in the dark). The two scenes are different *worlds*, and the cut between them IS the
editorial. Use Curtis-style irony sparingly and honestly — a rising "efficiency" line graph cut against
the thing being made less efficient *for*. Mark these collisions with a music/needle-drop change so the
juxtaposition reads as intended, not accidental.

### On-screen text + voice as a second voice (the essay layer)

**Who/what:** Adam Curtis (stark full-screen title cards between sequences); Vox/editorial lower-thirds
and kinetic captions.
**What it does:** Punctuates the film with declarative typographic statements that act as chapter heads
or thesis beats — a different *register of address* from the narrated image.
**Why it works:** A held line of type is a hard stop; it lets an argument breathe and signals "new
movement." It is also a register change *without* a new illustration — cheap and powerful.
**Dispatch translation:** Between major register changes, cut to a **full-bleed type plate** in the
locked brand system (Fraunces Black headline, JetBrains Mono telemetry — see the brief skill): one
short declarative line, held, on the brand's dark field. This is itself a "scene change" (UI/title
register) and a natural seam between map and chart. Animate the type with restraint (overshoot-and-
settle, not flying letters); the *cut to type* is the event.

### Archive-only narrative — no talking heads

**Who/what:** Asif Kapadia, *Senna* (2010), *Amy* (2015), *Diego Maradona* (2019).
**What it does:** Constructs a full dramatic arc entirely from *pre-existing* footage and *audio-only*
interviews laid over it — never cutting to a present-day expert in a chair. Built up from a 12-minute
test cut, then 7 hours, then 5, then 3, then a tight 100 minutes.
**Why it works:** Staying inside period footage keeps the viewer *in the world* of the story; an
interview cutaway would break the spell. Kapadia: *"who he was then is more interesting, and I can show
you that in a more interesting way by using archive from that time."* Imperfection reads as truth.
**Dispatch translation:** Our "archive" is **everything we render in code** — there is no chair to cut
to, by construction. Adopt Kapadia's discipline: keep the *voice* present (narration + any quoted audio)
but keep the *image* always inside the diegetic world we've drawn. Don't break to a generic "explainer"
register that drops the viewer out of the film's world. And adopt his cut-down method: storyboard long,
then ruthlessly compress to the 60s spine — kill any beat that doesn't move the arc (see the Gate-0
storyboard discipline in WORLD_CLASS §4).

### Layered visual proof (evidence as sequence)

**Who/what:** NYT Visual Investigations (Malachy Browne's team); the *Visual Forensics* / *Reconstructed*
genre.
**What it does:** Stacks evidence types in sequence to build *cumulative* proof — before/after satellite
imagery to fix a timeframe, a digital map to fix a place, a 3D reconstruction to retrace a bullet's
path, annotation to label what you're seeing — each layer answering "when/where/what/how."
**Why it works:** Each register answers a different question, so the viewer experiences the *case being
built*, step by step, and can verify each step. Browne: visual evidence lets you *"extract information
that might not be immediately obvious."*
**Dispatch translation:** When the Dispatch makes a *claim*, stage it as a mini visual-investigation
**sequence of register changes**: (1) a rendered map locates it (where), (2) annotated timeline or
before/after plate fixes it in time (when), (3) a schematic 3D/diagram reconstructs the mechanism (how),
(4) a chart quantifies it (how much). That is four genuinely different scenes, each a different
*register*, cutting in the order of the argument — the antithesis of zooming on one canvas. Animate each
piece of evidence *as it is introduced* (the strike-hole appears, the path draws on, the bar fills) so
the motion performs the reveal.

### Data animated as narrative (the explainer move)

**Who/what:** Vox (Joss Fong, Estelle Caswell), Bloomberg Originals / Bloomberg Graphics, The Economist,
NYT/FT data desks.
**What it does:** Animates a dataset so the *act of revealing it* tells the story — a line that draws on
to a turning point, a map that fills to show spread, a chart that re-sorts to expose a ranking — paced
to land "a minimum of one big takeaway" (Bloomberg's stated bar). Establishes with a question/hook
before the payoff (Fong opened on telescopes across continents, not the black hole).
**Why it works:** A static chart is information; a chart that *moves toward its punchline* is a story
with a beginning, middle, and end. Direct-address VO (*"Look at this"*) plus music cut every ~20s gives
each data beat a clear unit boundary.
**Dispatch translation:** Never drop a finished chart on screen. **Build it as a move:** axes draw in,
the line animates left-to-right and *decelerates / changes color at the inflection the story is about*,
a callout overshoots-and-settles on the key point, then hold. Treat the chart build as one "shot," and
when the number has landed, **cut to the register that gives it meaning** (the human/landscape vignette
from the juxtaposition technique). Open the whole film on the *stakes/question* register, not the
answer — withhold the hero number until the sequence has earned it.

### Music/needle-drop as the seam between movements

**Who/what:** Adam Curtis (pop and library-music needle-drops, often ironic); Errol Morris × Philip
Glass; Vox's 20-second music slices.
**What it does:** Uses a change in the music — a drop, a key change, a track swap — to mark the boundary
between one idea and the next, and to tell the viewer how to feel about the image on screen.
**Why it works:** Audiences parse structure by ear as much as by eye; a sonic shift cues "new movement"
faster than any visual. Curtis: *"use music to evoke the feelings… and put it against or with the big
things out there."*
**Dispatch translation:** Align the **audio seams to the register cuts.** When you hard-cut from chart
to vignette, change the bed — drop a sub-bass hit on the cut, swap the pad, or kill the music for a
held silence under a type plate. Use the edge-tts VO + sound-design + loudnorm mix (per the dispatch
skill) so each register change has a matching *sound* change. A register cut with no audio event feels
like a glitch; a register cut on a music beat feels like a chapter.

## Anti-patterns

- **The slow Ken Burns zoom *as* the scene change.** A continuous push/pan over a single rendered canvas
  is *reframing*, not scene-breaking — and Burns himself would fail it with *"where are you going?"* The
  rostrum move is a tool *inside* a scene; it can never be the transition *between* scenes. Non-fiction
  escapes the one-canvas trap the way Curtis, Kapadia, and NYT VI do: by actually changing the *kind* of
  image (map → chart → reconstruction → vignette → type) and letting the *cut* carry the argument. If the
  composition fingerprint (pov/layout/register/metaphor — config/composition_axes.yaml) hasn't changed,
  no scene changed.
- **Aimless drift.** Burns: automated zooms wander *"toward your elbow, not your face."* A move with no
  destination detail and no held landing is decoration. Every move must end on the meaningful thing and
  hold (duration is meaning).
- **Talking-head flatness (our version: the inert single register).** Kapadia rejects the
  expert-in-a-chair because it kills immersion. Our equivalent is parking on one HUD/dashboard for the
  whole film, or narrating *at* a static graphic. Keep the voice present but keep changing the world the
  voice lives in.
- **Data shown without a narrative move.** Dropping a fully-formed chart on screen and reading it aloud
  is the editorial cardinal sin. Vox/Bloomberg *animate the reveal toward the takeaway* and then *cut to
  meaning*. A chart that doesn't move toward a punchline — and isn't followed by the register that makes
  it matter — is information, not story.
- **Juxtaposition with no seam.** Two registers cut together with no audio event and no compositional
  contrast read as a render error, not a Curtis collision. Mark the seam (music change, type plate,
  silence) and make the two scenes *genuinely* different worlds, or the argument is lost.
- **Irony for its own sake / manipulation without truth.** Curtis-style ironic juxtaposition only earns
  its keep when the underlying facts are real and cited. We never fabricate the collision; the chart and
  the vignette must both be *true*, and the cut between them must be a *fair* reading. (See the fact-check
  lens in WORLD_CLASS §6.)

## Sources

- [The Story Behind the Ken Burns Effect (CineD)](https://www.cined.com/the-story-behind-the-ken-burns-effect-how-a-phone-call-from-steve-jobs-made-documentarys-most-influential-technique-a-household-name/) — Burns on the still as master shot, "where are you going?", the 33-second push, layered sound design.
- [Ken Burns effect (Wikipedia)](https://en.wikipedia.org/wiki/Ken_Burns_effect) — origins and precedents (*City of Gold* 1957, *Meet Mr. Lincoln* 1959), simulated parallax, the technique's mechanics.
- [The Thin Blue Line, 1988 (Wikipedia)](https://en.wikipedia.org/wiki/The_Thin_Blue_Line_(1988_film)) — Morris' stylized/contradictory reenactments, Glass "existential dread" score under testimony, the Interrotron.
- [Errol Morris (Wikipedia)](https://en.wikipedia.org/wiki/Errol_Morris) — the Interrotron, reenactment as a documentary innovation, *The Fog of War*.
- [An Interview with Adam Curtis (The Wire)](https://www.thewire.co.uk/in-writing/interviews/an-interview-with-adam-curtis) — "high end bolted to low end," "I write with images," music to evoke feeling, "reconfiguring it."
- [All Roll Is B-Roll: Adam Curtis Goes Quiet (The Drift)](https://www.thedriftmag.com/all-roll-is-b-roll/) — juxtaposition as argument, the apparatchiks/grocery-lines and limos/starving examples, the *Can't Get You Out of My Head* AI-dog montage, "Rorschach blots."
- [Adam Curtis (Wikipedia)](https://en.wikipedia.org/wiki/Adam_Curtis) — quick-cut montage, ironic music over tragedy, the Kuleshov-effect reading of his collage, his filmography (*Century of the Self*, *HyperNormalisation*, *Can't Get You Out of My Head*).
- [ScreenTalks: Asif Kapadia on Senna (Barbican)](https://www.barbican.org.uk/read-watch-listen/screentalks-archive-asif-kapadia-on-senna) — no talking heads, archive-as-engine, the 7hr→100min cut-down, embracing weak footage.
- [Asif Kapadia interview on Senna, Amy, Maradona (Film Companion)](https://www.filmcompanion.in/interviews/bollywood-interview/asif-kapadia-interview-senna-amy-diego-maradona-oscar-winning-documentary-academy-awards) — "interview people but don't show them," imperfection matching flawed characters, "who he was then is more interesting."
- [NY Times' pioneering Visual Investigations: behind the scenes (WAN-IFRA)](https://wan-ifra.org/2020/01/ny-times-pioneering-visual-investigations-behind-the-scenes/) — Malachy Browne on visual evidence, before/after satellite, 3D bullet-path reconstruction, building cumulative proof.
- [Videogram: How a Vox Video Explains the First Photo of a Black Hole (The Open Notebook)](https://www.theopennotebook.com/2020/01/07/videogram-how-a-vox-video-explains-the-science-behind-the-first-photo-of-a-black-hole/) — delayed reveal, Google Earth establishing shot, "Look at this" direct address, music cut every ~20s, layering registers.
- [How Bloomberg's 20-person graphics team visualizes the news (Digiday)](https://digiday.com/media/bloomberg-graphics-team/) — "make data beautiful," reporting baked into graphics, the "one big takeaway" share bar.
